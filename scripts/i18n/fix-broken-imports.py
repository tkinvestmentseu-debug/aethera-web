#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix broken import statements where t() was incorrectly inserted.
Uses line-by-line approach to detect import blocks.

Usage: python -X utf8 scripts/i18n/fix-broken-imports.py
"""

import re
from pathlib import Path

SCREENS_DIR = Path("D:/Soulverse/src/screens")

def fix_file(content: str) -> tuple:
    """Fix t() calls inside import blocks line by line."""
    lines = content.split('\n')
    result = []
    in_import = False
    changes = 0

    for line in lines:
        # Detect start of multi-line import
        stripped = line.strip()
        if re.match(r'^import\s+(\w+\s*,\s*)?\{', stripped) and not re.search(r'\}\s*from\s*[\'"]', stripped):
            in_import = True
        elif re.match(r'^import\s+[\'"]', stripped):
            in_import = False

        if in_import:
            # Check for t() calls inside this import line and unwrap them
            if "t('" in line or 't("' in line:
                # Pattern: {t('ns.key', 'original text')}
                def unwrap(m):
                    # Extract the original text (second argument)
                    return m.group(1)

                new_line = re.sub(
                    r'\{t\([\'"][^\'"]+[\'"],\s*[\'"]([^\'"]*?)[\'"]\)\}',
                    unwrap,
                    line
                )
                if new_line != line:
                    changes += 1
                    line = new_line

        # Detect end of multi-line import
        if in_import and re.match(r'^\}\s*from\s*[\'"]', stripped):
            in_import = False

        result.append(line)

    return '\n'.join(result), changes


def main():
    total_fixed = 0
    files_fixed = 0

    for path in sorted(SCREENS_DIR.glob("*.tsx")):
        content = path.read_text(encoding='utf-8')

        # Quick check
        if "t('" not in content:
            continue

        new_content, changes = fix_file(content)

        if changes > 0:
            path.write_text(new_content, encoding='utf-8')
            print(f"  Fixed {path.name}: {changes} lines restored")
            total_fixed += changes
            files_fixed += 1

    print(f"\nDone: {files_fixed} files fixed, {total_fixed} import lines restored")


if __name__ == '__main__':
    main()
