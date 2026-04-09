#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Translate all missing i18n keys using Anthropic API directly.
Processes 2781 keys in batches of 80, translates to 10 languages.

Usage: python -X utf8 scripts/i18n/translate-api.py
"""

import json
import os
import re
import time
from pathlib import Path
import anthropic

I18N_DIR = Path("D:/Soulverse/src/core/i18n")
TEMP_DIR = Path("D:/Soulverse/temp_i18n")
CATALOG_FILE = TEMP_DIR / "extraction_catalog.json"
LANGS = ["en", "es", "pt", "de", "fr", "it", "ru", "ar", "ja", "zh"]
BATCH_SIZE = 80  # strings per API call

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(data: dict, path: Path):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def translate_batch(items: list[tuple], attempt=0) -> dict | None:
    """
    items: list of (ns, key, polish_text)
    Returns: {lang: {ns: {key: translation}}}
    """
    # Build input
    lines = []
    for i, (ns, key, text) in enumerate(items):
        lines.append(f"{i+1}. [{ns}.{key}] {text}")

    prompt = f"""You are a professional translator for a spiritual wellness mobile app (Aethera).
Translate the following {len(items)} Polish strings to these 10 languages:
en (English), es (Spanish), pt (Portuguese Brazilian), de (German), fr (French),
it (Italian), ru (Russian), ar (Arabic), ja (Japanese), zh (Chinese Simplified)

RULES:
- Keep emojis and symbols (✦ ★ ◎ ✧ ✨ 🌙 ⭐ 💫) EXACTLY as-is
- Spiritual/mystical tone throughout
- Brand names unchanged: AETHERA, Oracle, Tarot, Chakra
- Polish → translation: Wróżka=Fortune Teller, Rytuał=Ritual, Medytacja=Meditation,
  Dusza=Soul, Energia=Energy, Księżyc=Moon, Oczyszczanie=Cleansing,
  Manifestacja=Manifestation, Afirmacja=Affirmation, Intencja=Intention,
  Uzdrowienie=Healing, Kryształ=Crystal, Synchroniczność=Synchronicity,
  Sny=Dreams, Cień=Shadow (Jungian), Horoskop=Horoscope, Numerologia=Numerology,
  Runka/Runy=Rune/Runes, Ziołowy=Herbal, Przebudzenie=Awakening

STRINGS TO TRANSLATE:
{chr(10).join(lines)}

OUTPUT FORMAT — respond with ONLY valid JSON, no markdown, no explanations:
{{
  "en": {{"1": "translation", "2": "translation", ...}},
  "es": {{"1": "...", ...}},
  "pt": {{"1": "...", ...}},
  "de": {{"1": "...", ...}},
  "fr": {{"1": "...", ...}},
  "it": {{"1": "...", ...}},
  "ru": {{"1": "...", ...}},
  "ar": {{"1": "...", ...}},
  "ja": {{"1": "...", ...}},
  "zh": {{"1": "...", ...}}
}}
Use only the number (1, 2, 3...) as the key in the output JSON."""

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=8192,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.content[0].text.strip()

        # Clean up response (remove markdown if present)
        if raw.startswith("```"):
            raw = re.sub(r"^```\w*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)

        translations_raw = json.loads(raw)

        # Map back from number keys to (ns, key, text)
        result = {}
        for lang, numbered in translations_raw.items():
            result[lang] = {}
            for num_str, translation in numbered.items():
                idx = int(num_str) - 1
                if 0 <= idx < len(items):
                    ns, key, _ = items[idx]
                    result[lang].setdefault(ns, {})[key] = translation

        return result

    except json.JSONDecodeError as e:
        print(f"    JSON error: {e}")
        if attempt < 2:
            print(f"    Retrying... (attempt {attempt+1})")
            time.sleep(2)
            return translate_batch(items, attempt + 1)
        return None
    except anthropic.RateLimitError:
        print("    Rate limited — waiting 60s...")
        time.sleep(60)
        return translate_batch(items, attempt)
    except Exception as e:
        print(f"    API error: {e}")
        if attempt < 2:
            time.sleep(5)
            return translate_batch(items, attempt + 1)
        return None


def main():
    # Load catalog
    catalog = load_json(CATALOG_FILE)

    # Load all language files
    lang_data = {}
    for lang in LANGS + ["pl"]:
        f = I18N_DIR / f"{lang}.json"
        lang_data[lang] = load_json(f) if f.exists() else {}

    # Find missing keys
    missing_items = []
    for ns, keys in catalog.items():
        for k, v in keys.items():
            en_ns = lang_data["en"].get(ns, {})
            if not isinstance(en_ns, dict) or k not in en_ns:
                missing_items.append((ns, k, v))

    total = len(missing_items)
    print(f"Missing translations: {total} keys")
    print(f"Batch size: {BATCH_SIZE} → {(total + BATCH_SIZE - 1) // BATCH_SIZE} API calls")
    print()

    # Process in batches
    translated = 0
    failed = 0

    for batch_start in range(0, total, BATCH_SIZE):
        batch = missing_items[batch_start:batch_start + BATCH_SIZE]
        batch_num = batch_start // BATCH_SIZE + 1
        total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE

        print(f"Batch {batch_num}/{total_batches} ({len(batch)} strings)...", end=" ", flush=True)

        result = translate_batch(batch)

        if result:
            # Merge into lang_data
            for lang, ns_keys in result.items():
                for ns, keys in ns_keys.items():
                    lang_data[lang].setdefault(ns, {}).update(keys)

            # Also add Polish originals
            for ns, key, text in batch:
                lang_data["pl"].setdefault(ns, {})[key] = text

            translated += len(batch)
            print(f"OK (+{len(batch)})")

            # Save every 5 batches
            if batch_num % 5 == 0:
                print("  Saving progress...", end=" ")
                for lang in LANGS + ["pl"]:
                    save_json(lang_data[lang], I18N_DIR / f"{lang}.json")
                print("saved")
        else:
            failed += len(batch)
            print(f"FAILED — using Polish fallback for {len(batch)} keys")

        # Small delay to avoid rate limits
        time.sleep(0.5)

    # Final save
    print("\nFinal save...")
    for lang in LANGS + ["pl"]:
        save_json(lang_data[lang], I18N_DIR / f"{lang}.json")
        count = sum(len(v) if isinstance(v, dict) else 1 for v in lang_data[lang].values())
        print(f"  {lang}.json: {count} top-level keys")

    # Coverage check
    en = lang_data["en"]
    covered = sum(
        1 for ns, keys in catalog.items()
        for k in keys
        if isinstance(en.get(ns), dict) and k in en[ns]
    )
    total_catalog = sum(len(v) for v in catalog.values())
    print(f"\nTranslation coverage: {covered}/{total_catalog} ({100*covered//total_catalog}%)")
    print(f"Translated in this run: {translated}")
    print(f"Failed: {failed}")


if __name__ == "__main__":
    main()
