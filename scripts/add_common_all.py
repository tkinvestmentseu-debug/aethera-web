#!/usr/bin/env python3
import json, os

BASE = r"D:\Soulverse\src\core\i18n"

ALL_TRANSLATIONS = {
    "en": "All", "pl": "Wszystkie", "de": "Alle", "es": "Todos",
    "fr": "Tous", "it": "Tutti", "pt": "Todos", "ru": "Все",
    "ar": "الكل", "ja": "すべて", "zh": "全部"
}

for lang, val in ALL_TRANSLATIONS.items():
    path = os.path.join(BASE, lang + ".json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if "all" not in data.get("common", {}):
        data["common"]["all"] = val
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"[{lang}] Added common.all = {val}")

print("Done.")
