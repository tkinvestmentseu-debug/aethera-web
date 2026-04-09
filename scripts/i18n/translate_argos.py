#!/usr/bin/env python
import json
import sys

import argostranslate.translate


def main():
    payload = json.loads(sys.stdin.read())
    source_lang = payload.get("source_lang", "pl")
    target_lang = payload["target_lang"]
    texts = payload["texts"]

    translations = [
        argostranslate.translate.translate(text, source_lang, target_lang)
        for text in texts
    ]
    sys.stdout.write(json.dumps({"translations": translations}, ensure_ascii=False))


if __name__ == "__main__":
    main()
