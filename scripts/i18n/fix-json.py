#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix unescaped quotes inside JSON string values using a state machine."""
import json
from pathlib import Path

def fix_json_strings(content):
    """Fix unescaped double quotes inside JSON string values."""
    result = []
    i = 0
    n = len(content)
    in_string = False
    bs = '\\'
    dq = '"'

    while i < n:
        c = content[i]

        if not in_string:
            if c == dq:
                in_string = True
                result.append(c)
            else:
                result.append(c)
            i += 1
        else:
            # Inside a string
            if c == bs:
                # Escaped char — take both
                result.append(c)
                i += 1
                if i < n:
                    result.append(content[i])
                    i += 1
            elif c == dq:
                # End of string OR unescaped quote inside
                # Look ahead to determine which
                j = i + 1
                while j < n and content[j] in ' \t':
                    j += 1
                next_sig = content[j] if j < n else ''

                if next_sig in ':,}]\n\r':
                    # End of string
                    in_string = False
                    result.append(c)
                else:
                    # Unescaped quote inside string
                    result.append(bs)
                    result.append(dq)
                i += 1
            else:
                result.append(c)
                i += 1

    return ''.join(result)


def main():
    path = Path('D:/Soulverse/temp_i18n/translations_batch_1.json')
    content = path.read_text(encoding='utf-8')

    fixed = fix_json_strings(content)

    try:
        data = json.loads(fixed)
        # Re-serialize cleanly
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
        en_count = sum(len(v) for v in data.get('en', {}).values())
        print(f'Fixed! Languages: {list(data.keys())}, EN keys: {en_count}')
    except Exception as e:
        print(f'Still broken: {e}')
        # Save partial
        path.write_text(fixed, encoding='utf-8')
        print('Saved fixed content (may still have issues)')


if __name__ == '__main__':
    main()
