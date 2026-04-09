#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix unescaped quotes in done_batch JSON files."""
import json
import sys
from pathlib import Path


def fix_json_strings(content):
    result = []
    i = 0
    n = len(content)
    in_string = False
    while i < n:
        c = content[i]
        if not in_string:
            if c == '"':
                in_string = True
            result.append(c)
            i += 1
        else:
            if c == chr(92):  # backslash
                result.append(c)
                i += 1
                if i < n:
                    result.append(content[i])
                    i += 1
            elif c == '"':
                j = i + 1
                while j < n and content[j] in ' \t':
                    j += 1
                next_sig = content[j] if j < n else ''
                if next_sig in ':,}]\n\r':
                    in_string = False
                    result.append(c)
                else:
                    result.append(chr(92))
                    result.append('"')
                i += 1
            else:
                result.append(c)
                i += 1
    return ''.join(result)


def fix_file(path):
    content = path.read_text(encoding='utf-8')
    fixed = fix_json_strings(content)
    try:
        data = json.loads(fixed)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
        langs = list(data.keys())
        en_count = sum(len(v) for v in data.get('en', {}).values() if isinstance(v, dict))
        print(f'Fixed {path.name}: langs={langs}, EN keys={en_count}')
        return True
    except Exception as e:
        print(f'Still broken {path.name}: {e}')
        path.write_text(fixed, encoding='utf-8')
        return False


if __name__ == '__main__':
    temp_dir = Path('D:/Soulverse/temp_i18n')
    files = list(temp_dir.glob('done_batch_*.json'))
    if not files:
        print('No done_batch files found')
    for f in sorted(files):
        try:
            json.loads(f.read_text(encoding='utf-8'))
            print(f'{f.name}: already valid JSON')
        except json.JSONDecodeError:
            fix_file(f)
