#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Extract TRANSLATIONS from inject_batch1.py and save as valid done_batch JSON."""
import json, re
from pathlib import Path

src = Path('D:/Soulverse/scripts/i18n/inject_batch1.py').read_text(encoding='utf-8')

# Extract TRANSLATIONS block
start = src.find('TRANSLATIONS = {') + len('TRANSLATIONS = ')
end = src.find('\n# Inject', start)
if end == -1:
    end = src.find('\nlangs =', start)
block = src[start:end].strip()

# Fix the Python dict: handle embedded unescaped double quotes
# The problematic pattern: "zh":"关闭"为某人"模式"
# Strategy: parse character by character, tracking string state
def fix_and_parse(text):
    """Parse Python dict, fixing embedded unescaped double-quotes in string values."""
    result = []
    i = 0
    n = len(text)
    in_string = False

    while i < n:
        c = text[i]

        if not in_string:
            if c == '"':
                in_string = True
                result.append(c)
                i += 1
            else:
                result.append(c)
                i += 1
        else:  # in string
            if c == '\\':
                # backslash escape: keep both chars
                result.append(c)
                i += 1
                if i < n:
                    result.append(text[i])
                    i += 1
            elif c == '"':
                # Could be end of string or embedded quote
                j = i + 1
                # Skip whitespace
                while j < n and text[j] in ' \t':
                    j += 1
                next_sig = text[j] if j < n else ''
                if next_sig in ':,}]\n\r':
                    # End of string
                    in_string = False
                    result.append(c)
                else:
                    # Embedded quote — escape it
                    result.append('\\')
                    result.append('"')
                i += 1
            else:
                result.append(c)
                i += 1

    fixed = ''.join(result)
    # Remove trailing commas before } or ]
    import re as _re
    fixed = _re.sub(r',\s*([\}\]])', r'\1', fixed)
    return json.loads(fixed)

data = fix_and_parse(block)

total = sum(len(v) for v in data.values())
print(f"Parsed OK: {len(data)} namespaces, {total} total keys")

# Transform: {ns: {key: {lang: val}}} → {lang: {ns: {key: val}}}
output = {}
for ns, keys in data.items():
    for key, translations in keys.items():
        for lang, val in translations.items():
            output.setdefault(lang, {}).setdefault(ns, {})[key] = val

out = Path('D:/Soulverse/temp_i18n/done_batch_1a.json')
out.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"Saved {out.name}: {len(output)} langs")
for lang, nsd in output.items():
    k = sum(len(v) for v in nsd.values())
    print(f"  {lang}: {k} keys")
