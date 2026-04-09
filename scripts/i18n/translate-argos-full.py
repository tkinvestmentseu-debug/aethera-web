#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
"""
translate-argos-full.py
-----------------------
Complete offline translation pipeline using Argos Translate.

Steps:
  1. Read scan-report.json → get 789 missing Polish strings
  2. Also read pl/_master.flat.json to ensure ALL keys exist in other languages
  3. For each missing/untranslated string:
       PL → EN  (via pl→en model)
       EN → [de, es, pt, fr, it, ru, ar, ja, zh]  (via en→X models)
  4. Save to each language's _master.flat.json
  5. Crash-safe: saves progress every 50 strings

Usage:
  python scripts/i18n/translate-argos-full.py
  python scripts/i18n/translate-argos-full.py --only-missing   (only 789 new strings)
  python scripts/i18n/translate-argos-full.py --fill-gaps      (fill gaps in existing files)
  python scripts/i18n/translate-argos-full.py --lang de,es,fr  (specific languages only)
"""

import json
import os
import sys
import time
import argparse
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent.parent
LOCALES = ROOT / "src" / "locales"
TOOLS = ROOT / "tools" / "i18n-resources"
SCAN_REPORT = TOOLS / "scan-report.json"
PROGRESS_FILE = TOOLS / "argos-progress.json"

TARGET_LANGS = ["en", "de", "es", "pt", "fr", "it", "ru", "ar", "ja", "zh"]

# ── Argos setup ────────────────────────────────────────────────────────────────
print("[argos] Loading Argos Translate…")
try:
    import argostranslate.translate as argos
    import argostranslate.package as argos_pkg
except ImportError:
    print("ERROR: argostranslate not installed. Run: pip install argostranslate")
    sys.exit(1)

# Cache translators
_translators: dict = {}

def get_translator(src: str, tgt: str):
    key = f"{src}->{tgt}"
    if key not in _translators:
        installed = argos_pkg.get_installed_packages()
        pkg = next((p for p in installed if p.from_code == src and p.to_code == tgt), None)
        if pkg is None:
            print(f"  [WARN] No model for {key} — skipping")
            _translators[key] = None
        else:
            _translators[key] = argos.get_translation_from_codes(src, tgt)
    return _translators[key]

def translate(text: str, src: str, tgt: str) -> str:
    if not text or not text.strip():
        return text
    t = get_translator(src, tgt)
    if t is None:
        return ""
    try:
        result = t.translate(text)
        return result or ""
    except Exception as e:
        print(f"  [WARN] translate({src}->{tgt}) failed: {e}")
        return ""

def translate_pl_to_all(pl_text: str) -> dict[str, str]:
    """Translate a Polish string to all 10 target languages."""
    results = {"pl": pl_text}
    # Step 1: PL → EN
    en_text = translate(pl_text, "pl", "en")
    if not en_text:
        en_text = pl_text  # fallback to Polish if no model
    results["en"] = en_text
    # Step 2: EN → other languages
    for lang in TARGET_LANGS:
        if lang == "en":
            continue
        trans = translate(en_text, "en", lang)
        results[lang] = trans or pl_text  # fallback to Polish
    return results

# ── JSON helpers ───────────────────────────────────────────────────────────────
def load_json(path: Path) -> dict:
    if path.exists():
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_json(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_master_flat(lang: str) -> dict:
    return load_json(LOCALES / lang / "_master.flat.json")

def save_master_flat(lang: str, data: dict):
    path = LOCALES / lang / "_master.flat.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    # Sort keys for clean diffs
    sorted_data = dict(sorted(data.items()))
    save_json(path, sorted_data)
    print(f"  [OK] {lang}/_master.flat.json ({len(sorted_data)} entries)")

# ── Key generator ──────────────────────────────────────────────────────────────
import unicodedata, re

def make_key(suggested: str, existing_keys: set, existing_flat: dict) -> str:
    """Ensure the suggested key is unique."""
    key = suggested
    if key in existing_flat or key in existing_keys:
        # Add suffix to avoid collision
        i = 2
        while f"{key}_{i}" in existing_flat or f"{key}_{i}" in existing_keys:
            i += 1
        key = f"{key}_{i}"
    existing_keys.add(key)
    return key

# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only-missing", action="store_true", help="Only translate 789 missing strings")
    parser.add_argument("--fill-gaps", action="store_true", help="Fill gaps in existing language files")
    parser.add_argument("--lang", type=str, default="", help="Comma-separated target languages")
    parser.add_argument("--limit", type=int, default=0, help="Limit to N strings (for testing)")
    args = parser.parse_args()

    target_langs = [l.strip() for l in args.lang.split(",")] if args.lang else TARGET_LANGS

    print(f"[argos] Target languages: {', '.join(target_langs)}")
    print(f"[argos] Loading master flat files…")

    # Load all existing master flats
    master_flats: dict[str, dict] = {}
    for lang in ["pl"] + target_langs:
        master_flats[lang] = load_master_flat(lang)

    print(f"[argos] pl/_master.flat.json: {len(master_flats['pl'])} entries")

    # ── Part 1: New missing strings from scanner ────────────────────────────────
    new_entries: list[dict] = []  # {pl_text, key, suggestedKey}

    if SCAN_REPORT.exists():
        print(f"\n[argos] Reading scan report…")
        report = load_json(SCAN_REPORT)
        results = report.get("results", [])
        missing = [r for r in results if r.get("status") == "missing"]
        print(f"[argos] Found {len(missing)} missing string occurrences")

        # Deduplicate by string value
        seen_strings: dict[str, str] = {}  # string -> key
        seen_keys: set = set()
        for entry in missing:
            pl_text = entry.get("string", "").strip()
            if not pl_text or pl_text in seen_strings:
                continue
            # Check if value already exists in pl master flat
            already = next((k for k, v in master_flats["pl"].items() if v == pl_text), None)
            if already:
                seen_strings[pl_text] = already
                continue
            # Generate unique key
            key = make_key(entry.get("suggestedKey", f"app.string.{len(seen_strings)}"), seen_keys, master_flats["pl"])
            seen_strings[pl_text] = key
            new_entries.append({"pl": pl_text, "key": key})

        print(f"[argos] {len(new_entries)} unique NEW strings to add")
    else:
        print("[argos] scan-report.json not found — skipping new string extraction")

    # ── Part 2: Gap fill — pl keys missing in other languages ──────────────────
    gap_entries: list[dict] = []  # {pl_text, key}

    if args.fill_gaps or not args.only_missing:
        print(f"\n[argos] Checking gaps in target language files…")
        pl_flat = master_flats["pl"]
        for lang in target_langs:
            lang_flat = master_flats[lang]
            missing_keys = [k for k in pl_flat if k not in lang_flat or not lang_flat[k]]
            print(f"  {lang}: {len(missing_keys)} keys missing or empty")

        # Collect all keys missing in ANY language
        all_missing: dict[str, set] = {}  # key -> set of langs needing translation
        for key, pl_text in pl_flat.items():
            if not isinstance(pl_text, str) or not pl_text.strip():
                continue
            missing_langs = set()
            for lang in target_langs:
                if key not in master_flats[lang] or not master_flats[lang].get(key):
                    missing_langs.add(lang)
            if missing_langs:
                gap_entries.append({"pl": pl_text, "key": key, "langs": missing_langs})

        print(f"[argos] {len(gap_entries)} pl keys need translation in at least one language")

    # ── Load progress ──────────────────────────────────────────────────────────
    progress = load_json(PROGRESS_FILE)
    translated_keys: set = set(progress.get("done_keys", []))
    print(f"[argos] Already done: {len(translated_keys)} keys (resuming)")

    # ── Combine work ──────────────────────────────────────────────────────────
    all_work: list[dict] = []

    for e in new_entries:
        if e["key"] not in translated_keys:
            all_work.append({"pl": e["pl"], "key": e["key"], "langs": set(target_langs)})

    for e in gap_entries:
        if e["key"] not in translated_keys:
            existing = next((w for w in all_work if w["key"] == e["key"]), None)
            if existing:
                existing["langs"].update(e["langs"])
            else:
                all_work.append({"pl": e["pl"], "key": e["key"], "langs": e["langs"]})

    if args.limit:
        all_work = all_work[:args.limit]

    total = len(all_work)
    print(f"\n[argos] Total work items: {total}")
    if total == 0:
        print("[argos] Nothing to do — all translations are complete!")
        return

    # ── Translate ──────────────────────────────────────────────────────────────
    print(f"[argos] Starting translation… (this may take a while)\n")
    start_time = time.time()

    for i, work in enumerate(all_work, 1):
        pl_text = work["pl"]
        key = work["key"]
        langs = work["langs"]

        if i % 50 == 0 or i == 1:
            elapsed = time.time() - start_time
            rate = i / elapsed if elapsed > 0 else 0
            eta = (total - i) / rate if rate > 0 else 0
            print(f"  [{i}/{total}] {key[:60]} | {elapsed:.0f}s elapsed, ETA {eta:.0f}s")

        # Translate PL → EN first (needed as bridge)
        en_text = ""
        if "en" in langs or any(l != "pl" for l in langs):
            en_text = translate(pl_text, "pl", "en")

        # Add to pl master flat if it's a new key
        if key not in master_flats["pl"]:
            master_flats["pl"][key] = pl_text

        # Translate to each target language
        for lang in langs:
            if lang == "pl":
                continue
            if lang == "en":
                result = en_text or pl_text
            else:
                bridge = en_text or pl_text
                result = translate(bridge, "en", lang) or pl_text

            if result:
                master_flats[lang][key] = result

        translated_keys.add(key)

        # Save progress every 50 strings
        if i % 50 == 0:
            print(f"  [checkpoint] Saving progress…")
            for lang in ["pl"] + list(target_langs):
                save_master_flat(lang, master_flats[lang])
            save_json(PROGRESS_FILE, {"done_keys": list(translated_keys)})

    # ── Final save ─────────────────────────────────────────────────────────────
    print(f"\n[argos] Saving final results…")
    for lang in ["pl"] + target_langs:
        save_master_flat(lang, master_flats[lang])

    save_json(PROGRESS_FILE, {"done_keys": list(translated_keys)})

    elapsed = time.time() - start_time
    print(f"\n{'='*60}")
    print(f"  DONE in {elapsed:.0f}s")
    print(f"  Strings translated: {total}")
    print(f"  Languages updated: {', '.join(target_langs)}")
    print(f"  Run 'pnpm start -- -c' to rebuild bundle")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
