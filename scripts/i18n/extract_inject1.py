#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Extract TRANSLATIONS from inject_batch1.py and save as valid JSON for merging."""
import re, json
from pathlib import Path

src = Path('D:/Soulverse/scripts/i18n/inject_batch1.py').read_text(encoding='utf-8')

# Find the TRANSLATIONS = { ... } block
m = re.search(r'TRANSLATIONS\s*=\s*(\{.*\})\s*\ndef inject', src, re.DOTALL)
if not m:
    # Try without the function
    idx = src.find('TRANSLATIONS = {')
    end = src.rfind('\n\ndef ')
    block = src[idx + len('TRANSLATIONS = '):end].strip()
else:
    block = m.group(1)

# Fix: replace unescaped double quotes inside string values
# Strategy: convert to JSON-compatible format by fixing embedded quotes in zh/ja values
# We'll use a character-level state machine to fix the Python dict syntax

def fix_python_dict_to_json(text):
    """Convert Python dict literal to JSON, fixing unescaped quotes."""
    result = []
    i = 0
    n = len(text)
    in_string = False

    while i < n:
        c = text[i]

        if not in_string:
            if c == "'":
                # Convert single quotes to double quotes for JSON
                result.append('"')
                i += 1
                in_string = True
            elif c == '"':
                result.append(c)
                i += 1
                in_string = True
            else:
                result.append(c)
                i += 1
        else:
            if c == '\\':
                result.append(c)
                i += 1
                if i < n:
                    result.append(text[i])
                    i += 1
            elif c == '"':
                # Check if this is end of string or embedded quote
                j = i + 1
                while j < n and text[j] in ' \t':
                    j += 1
                next_sig = text[j] if j < n else ''
                if next_sig in ':,}]\n\r':
                    in_string = False
                    result.append(c)
                else:
                    # Embedded quote — escape it
                    result.append('\\')
                    result.append('"')
                i += 1
            elif c == "'":
                # End of single-quoted string (converted to double)
                # Actually we shouldn't hit this since we convert ' to "
                result.append('"')
                i += 1
                in_string = False
            else:
                result.append(c)
                i += 1

    return ''.join(result)

# Try to eval the block directly first
try:
    data = eval(block)
    print(f"Direct eval succeeded: {len(data)} namespaces")
except SyntaxError as e:
    print(f"Eval failed: {e}, trying fix...")
    fixed = fix_python_dict_to_json(block)
    try:
        data = json.loads(fixed)
        print(f"JSON parse after fix succeeded: {len(data)} namespaces")
    except json.JSONDecodeError as e2:
        print(f"JSON also failed: {e2}")
        # Save fixed for inspection
        Path('D:/Soulverse/temp_i18n/debug_inject1.txt').write_text(fixed[:2000], encoding='utf-8')
        raise

# Now transform: {ns: {key: {lang: val}}} → {lang: {ns: {key: val}}}
output = {}
for ns, keys in data.items():
    for key, translations in keys.items():
        for lang, val in translations.items():
            output.setdefault(lang, {}).setdefault(ns, {})[key] = val

out_path = Path('D:/Soulverse/temp_i18n/done_batch_1a.json')
out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')

total_keys = sum(len(keys) for ns_data in data.values() for keys in [ns_data])
print(f"Saved {out_path.name}: {len(output)} langs, ~{total_keys} keys per lang")
