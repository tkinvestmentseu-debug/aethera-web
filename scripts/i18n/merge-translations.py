#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Merge translation batches into the actual language JSON files.
Run this after all translation_batch_N.json files are created.

Usage: python -X utf8 scripts/i18n/merge-translations.py
"""

import re
import json
from pathlib import Path

I18N_DIR = Path("D:/Soulverse/src/core/i18n")
TEMP_DIR = Path("D:/Soulverse/temp_i18n")
LANGUAGES = ["pl", "en", "es", "pt", "de", "fr", "it", "ru", "ar", "ja", "zh"]

def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding='utf-8'))

def save_json(data: dict, path: Path):
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding='utf-8'
    )
    print(f"  Saved: {path.name}")


def main():
    # Load all translation batch files
    all_translations = {}  # lang -> {namespace: {key: value}}

    batch_files = sorted(
        list(TEMP_DIR.glob("translations_batch_*.json")) +
        list(TEMP_DIR.glob("done_batch_*.json"))
    )
    if not batch_files:
        print("ERROR: No translations_batch_*.json files found!")
        print("Translation agents have not completed yet.")
        return

    print(f"Found {len(batch_files)} translation batch files")

    for bf in batch_files:
        print(f"  Loading: {bf.name}")
        try:
            data = load_json(bf)
            for lang, namespaces in data.items():
                if lang not in all_translations:
                    all_translations[lang] = {}
                for ns, keys in namespaces.items():
                    if ns not in all_translations[lang]:
                        all_translations[lang][ns] = {}
                    all_translations[lang][ns].update(keys)
        except Exception as e:
            print(f"  ERROR loading {bf.name}: {e}")

    print(f"\nLoaded translations for {len(all_translations)} languages")

    # For each language, update the language file
    added_total = 0

    for lang in LANGUAGES:
        lang_file = I18N_DIR / f"{lang}.json"
        if not lang_file.exists():
            print(f"  WARNING: {lang}.json not found, skipping")
            continue

        # Load current language file
        current = load_json(lang_file)

        # Get translations for this language
        lang_translations = all_translations.get(lang, {})

        if not lang_translations:
            print(f"  {lang}: no new translations (using Polish fallback)")
            # If no translations for this language, use Polish as fallback
            lang_translations = all_translations.get('pl', {})

        added = 0
        for ns, keys in lang_translations.items():
            if ns not in current:
                current[ns] = {}
            for key, value in keys.items():
                if key not in current[ns]:
                    current[ns][key] = value
                    added += 1

        save_json(current, lang_file)
        print(f"  {lang}: +{added} new keys")
        added_total += added

    print(f"\nTotal keys added across all languages: {added_total}")

    # Verify TypeScript can still parse (check for obvious issues)
    print("\nVerifying language files...")
    for lang in LANGUAGES:
        lang_file = I18N_DIR / f"{lang}.json"
        if lang_file.exists():
            try:
                data = load_json(lang_file)
                count = sum(
                    (len(v) if isinstance(v, dict) else 1)
                    for v in data.values()
                )
                print(f"  {lang}.json: OK ({count} keys)")
            except Exception as e:
                print(f"  {lang}.json: ERROR - {e}")


if __name__ == '__main__':
    main()
