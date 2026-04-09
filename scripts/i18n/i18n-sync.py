#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
i18n-sync.py — Aethera i18n Automation Machine
================================================
Scans all .tsx/.ts source files for t('namespace.key', 'Polish text') calls,
finds keys missing from language JSON files, and translates them locally using
Argos Translate (free, offline, zero API cost).

Usage:
  python -X utf8 scripts/i18n/i18n-sync.py          # full sync
  python -X utf8 scripts/i18n/i18n-sync.py --dry-run # show what would be added
  python -X utf8 scripts/i18n/i18n-sync.py --check   # coverage report only

Requires: pip install argostranslate
Models:   python scripts/i18n/install-argos-models.py
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import re
import json
import time
import argparse
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT     = Path(__file__).parent.parent.parent
SRC_DIR  = ROOT / "src"
I18N_DIR = ROOT / "src" / "core" / "i18n"
LANGS    = ["pl", "en", "es", "pt", "de", "fr", "it", "ru", "ar", "ja", "zh"]

# ── Regex patterns for t() calls ─────────────────────────────────────────────
# Matches: t('namespace.key', 'Polish text') or t("ns.key", "Polish text")
# Also: t('ns.key', `Polish text`) - template literals (no interpolation)
T_CALL_RE = re.compile(
    r"""t\(\s*['"]([a-zA-Z][a-zA-Z0-9_]*\.[a-zA-Z0-9_.]+)['"]\s*,\s*['"`]([^'"`\n]{1,300})['"`]\s*\)""",
    re.MULTILINE
)

# Also catch: i18nKey="ns.key" with fallback comment or nearby Polish
# And: t('key') with no fallback — but we skip those (no Polish source available)

# ── Argos Translate ───────────────────────────────────────────────────────────
_translators = {}

def _get_translator(src: str, tgt: str):
    key = f"{src}->{tgt}"
    if key not in _translators:
        try:
            import argostranslate.translate as argos
            import argostranslate.package as argos_pkg
            t = argos.get_translation_from_codes(src, tgt)
            _translators[key] = t
        except Exception:
            _translators[key] = None
    return _translators[key]

def translate_text(text: str, src: str, tgt: str) -> str:
    if not text or not text.strip():
        return text
    t = _get_translator(src, tgt)
    if t is None:
        return ""
    try:
        return t.translate(text) or ""
    except Exception as e:
        print(f"  [WARN] {src}→{tgt}: {e}", file=sys.stderr)
        return ""

def translate_pl_to_all(pl_text: str) -> dict:
    """Translate Polish text to all 10 other languages via en pivot."""
    results = {"pl": pl_text}
    # Step 1: PL → EN
    en = translate_text(pl_text, "pl", "en") or pl_text
    results["en"] = en
    # Step 2: EN → others
    for lang in ["es", "pt", "de", "fr", "it", "ru", "ar", "ja", "zh"]:
        translated = translate_text(en, "en", lang)
        results[lang] = translated or en  # fallback to EN if model missing
    return results

# ── JSON helpers ─────────────────────────────────────────────────────────────
def load_lang(lang: str) -> dict:
    path = I18N_DIR / f"{lang}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}

def save_lang(lang: str, data: dict):
    path = I18N_DIR / f"{lang}.json"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

# ── Scanner ───────────────────────────────────────────────────────────────────
def scan_source_files() -> dict:
    """
    Scan all .tsx/.ts files for t('ns.key', 'Polish text') calls.
    Returns: {ns: {key: pl_text}} — deduplicated by key
    """
    found = {}  # {ns: {key: pl_text}}
    files_scanned = 0
    files_with_hits = 0

    for path in SRC_DIR.rglob("*.tsx"):
        _scan_file(path, found)
        files_scanned += 1
        if any(path.name in str(path) for ns in found for k in found.get(ns, {})):
            files_with_hits += 1

    for path in SRC_DIR.rglob("*.ts"):
        if path.suffix == ".ts":
            _scan_file(path, found)
            files_scanned += 1

    total_keys = sum(len(keys) for keys in found.values())
    print(f"  Scanned {files_scanned} files → found {total_keys} unique t() keys in {len(found)} namespaces")
    return found

def _scan_file(path: Path, found: dict):
    try:
        content = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return

    for m in T_CALL_RE.finditer(content):
        full_key = m.group(1)   # e.g. "greeting.hello" or "common.cancel"
        pl_text  = m.group(2)   # e.g. "Cześć"

        # Skip if text looks like a variable, interpolation marker, or non-Polish technical
        if not pl_text or len(pl_text) < 1:
            continue
        # Split into namespace + key
        dot_idx = full_key.find(".")
        if dot_idx < 0:
            continue
        ns  = full_key[:dot_idx]
        key = full_key[dot_idx + 1:]

        found.setdefault(ns, {})[key] = pl_text

# ── Find missing keys ─────────────────────────────────────────────────────────
def find_missing(scanned: dict, en_data: dict) -> list:
    """
    Returns list of (ns, key, pl_text) for keys missing from en.json.
    If a key exists in en.json it's considered translated (all langs should have it).
    """
    missing = []
    for ns, keys in sorted(scanned.items()):
        en_ns = en_data.get(ns, {})
        for key, pl_text in keys.items():
            if not (isinstance(en_ns, dict) and key in en_ns):
                missing.append((ns, key, pl_text))
    return missing

# ── Coverage report ───────────────────────────────────────────────────────────
def print_coverage(scanned: dict):
    print("\n  Coverage per language:")
    total_scanned = sum(len(v) for v in scanned.values())

    for lang in LANGS:
        data = load_lang(lang)
        covered = 0
        for ns, keys in scanned.items():
            lang_ns = data.get(ns, {})
            for key in keys:
                if isinstance(lang_ns, dict) and key in lang_ns:
                    covered += 1
        pct = 100 * covered // total_scanned if total_scanned else 0
        bar = "█" * (pct // 5) + "░" * (20 - pct // 5)
        print(f"    {lang:3s}  {bar}  {covered}/{total_scanned} ({pct}%)")
    print()

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Aethera i18n sync machine")
    parser.add_argument("--dry-run",  action="store_true", help="Show missing keys without translating")
    parser.add_argument("--check",    action="store_true", help="Coverage report only")
    parser.add_argument("--limit",    type=int, default=0,  help="Translate only N keys (for testing)")
    parser.add_argument("--ns",       type=str, default="", help="Only process this namespace")
    args = parser.parse_args()

    print("=" * 60)
    print("  AETHERA i18n SYNC MACHINE")
    print("=" * 60)

    # Step 1: Scan source files
    print("\n[1/4] Scanning source files for t() calls…")
    scanned = scan_source_files()

    if args.check:
        print_coverage(scanned)
        return

    # Step 2: Load language files & find missing
    print("\n[2/4] Finding missing translations…")
    en_data = load_lang("en")
    missing = find_missing(scanned, en_data)

    if args.ns:
        missing = [(ns, k, t) for ns, k, t in missing if ns == args.ns]

    if args.limit:
        missing = missing[:args.limit]

    print(f"  Missing: {len(missing)} keys across all languages")

    if not missing:
        print("\n  All keys are translated! Coverage:")
        print_coverage(scanned)
        return

    # Show sample
    print(f"  Sample missing keys:")
    for ns, key, pl_text in missing[:5]:
        print(f"    [{ns}.{key}] = '{pl_text[:60]}'")
    if len(missing) > 5:
        print(f"    ... and {len(missing) - 5} more")

    if args.dry_run:
        print("\n  [dry-run] No changes made.")
        return

    # Step 3: Load Argos
    print("\n[3/4] Loading Argos Translate models…")
    try:
        import argostranslate.translate as argos
        import argostranslate.package as argos_pkg
        installed = argos_pkg.get_installed_packages()
        model_pairs = [(p.from_code, p.to_code) for p in installed]
        print(f"  Loaded {len(installed)} models: {model_pairs}")
    except ImportError:
        print("  ERROR: argostranslate not installed!")
        print("  Run: pip install argostranslate")
        print("  Then: python scripts/i18n/install-argos-models.py")
        sys.exit(1)

    # Step 4: Translate & inject
    print(f"\n[4/4] Translating {len(missing)} keys…")
    lang_data = {lang: load_lang(lang) for lang in LANGS}

    start = time.time()
    done = 0
    errors = 0
    checkpoint_every = 50

    for i, (ns, key, pl_text) in enumerate(missing, 1):
        if i % 10 == 0 or i == 1:
            elapsed = time.time() - start
            rate = i / elapsed if elapsed > 0 else 1
            eta = (len(missing) - i) / rate if rate > 0 else 0
            print(f"  [{i:4d}/{len(missing)}] {ns}.{key[:35]:35s} | ETA {eta:.0f}s", end="\r")

        try:
            translations = translate_pl_to_all(pl_text)
        except Exception as e:
            print(f"\n  [ERR] {ns}.{key}: {e}")
            errors += 1
            continue

        # Inject into all language files (only if key doesn't already exist)
        for lang in LANGS:
            val = translations.get(lang, pl_text)
            if val:
                lang_data[lang].setdefault(ns, {})
                if key not in lang_data[lang][ns]:
                    lang_data[lang][ns][key] = val

        done += 1

        # Checkpoint save
        if done % checkpoint_every == 0:
            print(f"\n  [checkpoint] Saving {done} keys…")
            for lang in LANGS:
                save_lang(lang, lang_data[lang])

    # Final save
    print(f"\n  Saving final results…")
    for lang in LANGS:
        save_lang(lang, lang_data[lang])

    elapsed = time.time() - start
    print(f"\n{'=' * 60}")
    print(f"  DONE in {elapsed:.0f}s")
    print(f"  Translated: {done} keys")
    print(f"  Errors:     {errors}")
    print(f"  Languages:  {', '.join(LANGS)}")
    print(f"{'=' * 60}")

    print_coverage(scanned)


if __name__ == "__main__":
    main()
