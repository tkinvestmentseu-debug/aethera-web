#!/usr/bin/env node
'use strict';

/**
 * scan-hardcoded-pl.cjs
 *
 * Scans all .tsx/.ts files under src/ and reports:
 *   1. Strings containing Polish diacritic characters
 *   2. Plain English strings that look like UI text in JSX positions
 *
 * Skips: import paths, CSS/SVG values, hex colors, URLs,
 *        console.log messages, TypeScript type annotations, regex literals.
 *
 * Output:
 *   tools/i18n-resources/scan-report.json
 *   tools/i18n-resources/scan-report.txt
 */

const fs   = require('fs');
const path = require('path');
const ts   = require('typescript');

// ─── Paths ──────────────────────────────────────────────────────────────────

const ROOT         = path.resolve(__dirname, '..', '..');
const SRC_DIR      = path.join(ROOT, 'src');
const TOOLS_DIR    = path.join(ROOT, 'tools', 'i18n-resources');
const PL_FLAT      = path.join(ROOT, 'src', 'locales', 'pl', '_master.flat.json');
const OUT_JSON     = path.join(TOOLS_DIR, 'scan-report.json');
const OUT_TXT      = path.join(TOOLS_DIR, 'scan-report.txt');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const stripBom = (s) => s.replace(/^\uFEFF/, '');

function readJson(filePath) {
  try {
    return JSON.parse(stripBom(fs.readFileSync(filePath, 'utf8')));
  } catch {
    return {};
  }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

// ─── Polish detection ────────────────────────────────────────────────────────

const POLISH_CHARS_RE = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;

const POLISH_COMMON = [
  'i ', ' i ', 'oraz', 'albo', 'dla', 'jest', 'są', ' na ', ' w ', ' z ', ' do ',
  ' po ', 'nie ', ' tak', 'dziś', 'dzień', 'rytuał', 'karta', 'energia', 'księżyc',
  'horoskop', 'sny', 'oczyszczanie', 'afirmacja', 'prowadzenie', 'praktyka', 'sesja',
  'dziennik', 'podróż', 'gwiazdy', 'cykle', 'twój', 'twoja', 'twoje', 'swój', 'swoja',
  'jako', 'tego', 'tej', 'temu', 'przez', 'przy', 'czy', 'jak', 'ale', 'lub',
];

const POLISH_STEMS = [
  'rytua', 'kart', 'energi', 'księży', 'afirm', 'oczyszcz', 'prowadzen',
  'sanktuar', 'duchow', 'kosmiczn', 'medytacj', 'oddech', 'miesią', 'tygodni',
  'liczb', 'przebudzen', 'intuicj',
];

function looksPolish(text) {
  if (POLISH_CHARS_RE.test(text)) return true;
  const lower = text.toLowerCase();
  if (POLISH_COMMON.some((w) => lower.includes(w))) return true;
  if (POLISH_STEMS.some((s) => lower.includes(s))) return true;
  return false;
}

// ─── Technical / skip patterns ───────────────────────────────────────────────

const SKIP_RES = [
  /^#[0-9A-Fa-f]{3,8}$/,                    // hex colour
  /^rgba?\(/,                                // css colour function
  /^hsla?\(/,
  /^https?:\/\//,                            // URL
  /^[./\\@][a-zA-Z0-9_/\\.-]+$/,            // file / import path
  /^[a-z0-9_]+\.[a-z0-9_]+(\.[a-z0-9_]+)*$/, // dotted identifier (e.g. "some.thing")
  /^\d[\d., ]*$/,                            // pure number / numeric list
  /^[A-Z0-9_]{2,}$/,                        // CONSTANT_CASE
  /^[a-z][a-zA-Z0-9]*$/,                    // camelCase single word
  /^(translate|scale|rotate|skew|matrix|M|L|Z|C|Q|H|V|A)\b/, // SVG / transform
  /^\s*$/,                                   // whitespace only
  /^[\p{Emoji}\s.,!?;:'"()\-–—/\\*|]+$/u,   // punctuation / emoji only
  /^[a-z0-9_-]+:[a-z0-9_-]/,               // pseudo-CSS or colon-separated id
  /^(true|false|null|undefined|void|any|never|unknown|string|number|boolean|object)$/, // TS keywords
];

// Attribute / property names that are never UI text
const SKIP_ATTR_NAMES = new Set([
  'testID', 'style', 'className', 'ref', 'key', 'id',
  'source', 'uri', 'name', 'type', 'variant', 'size', 'color',
  'fontFamily', 'fontWeight', 'textAlign', 'overflow',
  'pointerEvents', 'behavior', 'keyboardType', 'returnKeyType',
  'autoCapitalize', 'autoComplete', 'autoCorrect', 'spellCheck',
  'contentContainerStyle', 'from', 'to', 'start', 'end',
  'nativeID', 'dataDetectorTypes', 'textBreakStrategy',
]);

// Attribute names that often carry UI text
const UI_ATTR_NAMES = new Set([
  'placeholder', 'title', 'alt', 'label', 'accessibilityLabel',
  'accessibilityHint', 'aria-label', 'headerTitle', 'subtitle',
  'description', 'message', 'text', 'cta', 'confirmText', 'cancelText',
  'emptyText', 'hint', 'tooltip',
]);

// Property assignment keys in data arrays that carry UI text
const UI_PROP_KEYS = new Set([
  'title', 'subtitle', 'description', 'label', 'text', 'copy',
  'meaning', 'action', 'story', 'significance', 'effect', 'advice',
  'prompt', 'headline', 'body', 'hint', 'message', 'name',
  'desc', 'detail', 'content', 'summary',
]);

// Call targets whose first arg is often UI text
const UI_CALL_TARGETS = new Set([
  'alert', 'Alert', 'toast', 'showToast', 'showError', 'showSuccess',
  'showMessage', 'setUserQuestion', 'setPartnerName',
]);

// Variable name patterns that suggest UI text
const UI_VAR_NAME_RE = /prompt|label|title|subtitle|description|message|copy|text|headline|hint|placeholder/i;

// ─── Key suggestion helpers ───────────────────────────────────────────────────

function sanitizeSeg(v) {
  return String(v || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .toLowerCase()
    .slice(0, 40);
}

function screenNameFromPath(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const parts = rel.split('/');
  const basename = parts[parts.length - 1].replace(/\.[^.]+$/, '');

  if (parts.includes('screens')) {
    const idx = parts.indexOf('screens');
    return sanitizeSeg(parts[idx + 1].replace(/\.[^.]+$/, ''));
  }
  if (parts.includes('components')) {
    return sanitizeSeg(basename);
  }
  if (parts.includes('features')) {
    const idx = parts.indexOf('features');
    return sanitizeSeg(parts[idx + 1] || basename);
  }
  if (parts.includes('core')) {
    return sanitizeSeg(basename);
  }
  return sanitizeSeg(basename);
}

function contextFromNode(node, sourceFile) {
  let cur = node;
  while (cur) {
    if (ts.isJsxAttribute(cur) && cur.name) {
      return sanitizeSeg(cur.name.getText(sourceFile));
    }
    if (ts.isPropertyAssignment(cur) && cur.name) {
      return sanitizeSeg(cur.name.getText(sourceFile));
    }
    if (ts.isVariableDeclaration(cur) && cur.name) {
      return sanitizeSeg(cur.name.getText(sourceFile));
    }
    if (ts.isCallExpression(cur)) {
      const callee = cur.expression.getText(sourceFile).split('.').pop() || 'call';
      return sanitizeSeg(callee);
    }
    cur = cur.parent;
  }
  return 'text';
}

function textToSlug(text) {
  return sanitizeSeg(
    text
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .split(/\s+/).slice(0, 5).join('_')
  );
}

function suggestKey(filePath, node, sourceFile, text) {
  const screen  = screenNameFromPath(filePath);
  const context = contextFromNode(node, sourceFile);
  const slug    = textToSlug(text);
  // e.g. "meditationscreen.title.abundance_of_light"
  const mid = context !== 'text' && context !== slug ? `${context}.${slug}` : slug;
  return `${screen}.${mid}`.replace(/\.{2,}/g, '.').slice(0, 80);
}

// ─── String quality filters ───────────────────────────────────────────────────

function normalize(s) {
  return String(s ?? '').replace(/\r\n/g, '\n').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

function isTechnical(text) {
  const v = normalize(text);
  if (!v || v.length < 2) return true;
  if (SKIP_RES.some((re) => re.test(v))) return true;
  return false;
}

function isUIText(text) {
  const v = normalize(text);
  if (isTechnical(v)) return false;

  // Always include Polish strings
  if (looksPolish(v)) return true;

  // English UI text heuristics: starts with capital, contains spaces,
  // or ends with sentence punctuation
  if (/\s/.test(v) && /^[A-Z]/.test(v)) return true;
  if (v.length > 15 && /[.!?]$/.test(v)) return true;
  if (v.length > 20 && /\s/.test(v)) return true;

  return false;
}

// ─── Node context guards ─────────────────────────────────────────────────────

/**
 * Walk up the ancestor chain to check if this node is inside a console call,
 * import declaration, type annotation, decorator, comment, or regex.
 */
function isInSkipContext(node) {
  let cur = node.parent;
  while (cur) {
    // Inside console.log / console.warn / console.error
    if (ts.isCallExpression(cur)) {
      const callText = cur.expression.getText ? cur.expression.getText() : '';
      if (/^console\.(log|warn|error|info|debug|dir)$/.test(callText)) return true;
      // Also skip require() calls — they're import paths
      if (/^require$/.test(callText)) return true;
    }
    // Inside import declaration
    if (ts.isImportDeclaration(cur)) return true;
    // Inside export declaration source
    if (ts.isExportDeclaration(cur)) return true;
    // Inside type annotation (TypeReference, TypeLiteral, etc.)
    if (
      ts.isTypeNode(cur) ||
      ts.isTypeReferenceNode(cur) ||
      ts.isTypeAliasDeclaration(cur) ||
      ts.isInterfaceDeclaration(cur) ||
      ts.isTypeParameterDeclaration(cur)
    ) return true;
    // Inside decorator
    if (ts.isDecorator(cur)) return true;
    // Inside enum member value — usually not UI text
    if (ts.isEnumDeclaration(cur)) return true;

    cur = cur.parent;
  }
  return false;
}

// ─── Template literal helper ─────────────────────────────────────────────────

function templateText(node, sourceFile) {
  const parts = [
    node.head.text,
    ...node.templateSpans.map(
      (span) => `{{${span.expression.getText(sourceFile)}}}${span.literal.text}`
    ),
  ];
  return parts.join('');
}

// ─── Source-line cache ────────────────────────────────────────────────────────

function makeLineCache(content) {
  return content.split(/\r?\n/);
}

function getContext(lines, lineIndex) {
  const before = lineIndex > 0 ? lines[lineIndex - 1].trim() : '';
  const current = lines[lineIndex] ? lines[lineIndex].trim() : '';
  const after = lineIndex + 1 < lines.length ? lines[lineIndex + 1].trim() : '';
  return { before, current, after };
}

// ─── Visitor ─────────────────────────────────────────────────────────────────

function visitNode(filePath, sourceFile, lines, node, plFlat, results) {
  // Skip nodes inside skippable contexts at the very top
  // (we still recurse into children for partial matches)

  const addResult = (rawText, reason, nodeForKey) => {
    const text = normalize(rawText);
    if (!text || text.length < 2) return;
    if (isTechnical(text)) return;
    if (isInSkipContext(nodeForKey)) return;

    const { line: lineIdx } = sourceFile.getLineAndCharacterOfPosition(
      nodeForKey.getStart(sourceFile)
    );
    const lineNo = lineIdx + 1;
    const ctx = getContext(lines, lineIdx);

    // Check if value already exists in pl flat (by value match)
    const existingKey = Object.keys(plFlat).find((k) => plFlat[k] === text);

    const suggested = suggestKey(filePath, nodeForKey, sourceFile, text);

    results.push({
      file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
      line: lineNo,
      string: text,
      context: ctx,
      reason,
      suggestedKey: suggested,
      existingKey: existingKey || null,
      status: existingKey ? 'existing' : 'missing',
    });
  };

  // ── 1. JSX text nodes (direct text between tags) ────────────────────────
  if (ts.isJsxText(node)) {
    const text = normalize(node.getText(sourceFile));
    if (isUIText(text)) addResult(text, 'jsx_text', node);
  }

  // ── 2. JSX attributes with UI-text names ────────────────────────────────
  if (ts.isJsxAttribute(node)) {
    const attrName = node.name.getText(sourceFile);
    if (SKIP_ATTR_NAMES.has(attrName)) {
      // skip but still recurse
    } else if (UI_ATTR_NAMES.has(attrName) && node.initializer) {
      if (ts.isStringLiteral(node.initializer)) {
        if (isUIText(node.initializer.text))
          addResult(node.initializer.text, `jsx_attr:${attrName}`, node.initializer);
      } else if (
        ts.isJsxExpression(node.initializer) &&
        node.initializer.expression
      ) {
        const expr = node.initializer.expression;
        if (ts.isStringLiteralLike(expr) && isUIText(expr.text)) {
          addResult(expr.text, `jsx_attr:${attrName}`, expr);
        } else if (ts.isTemplateExpression(expr)) {
          const tmpl = templateText(expr, sourceFile);
          if (isUIText(tmpl)) addResult(tmpl, `jsx_attr:${attrName}`, expr);
        }
      }
    }
  }

  // ── 3. Call expressions  (alert, toast, etc.) ────────────────────────────
  if (ts.isCallExpression(node)) {
    const callee = node.expression.getText(sourceFile).split('.').pop() || '';
    if (UI_CALL_TARGETS.has(callee)) {
      node.arguments.forEach((arg) => {
        if (ts.isStringLiteralLike(arg) && isUIText(arg.text)) {
          addResult(arg.text, `call:${callee}`, arg);
        } else if (ts.isTemplateExpression(arg)) {
          const tmpl = templateText(arg, sourceFile);
          if (isUIText(tmpl)) addResult(tmpl, `call:${callee}`, arg);
        }
      });
    }
  }

  // ── 4. Property assignments in data arrays ───────────────────────────────
  if (ts.isPropertyAssignment(node) && node.initializer) {
    const keyName = node.name.getText(sourceFile).replace(/['"]/g, '');
    if (UI_PROP_KEYS.has(keyName)) {
      if (ts.isStringLiteralLike(node.initializer) && isUIText(node.initializer.text)) {
        addResult(node.initializer.text, `property:${keyName}`, node.initializer);
      } else if (ts.isTemplateExpression(node.initializer)) {
        const tmpl = templateText(node.initializer, sourceFile);
        if (isUIText(tmpl)) addResult(tmpl, `property:${keyName}`, node.initializer);
      }
    }
  }

  // ── 5. Variable declarations with suggestive names ──────────────────────
  if (
    ts.isVariableDeclaration(node) &&
    node.initializer &&
    ts.isStringLiteralLike(node.initializer)
  ) {
    const varName = node.name.getText(sourceFile);
    if (UI_VAR_NAME_RE.test(varName) && isUIText(node.initializer.text)) {
      addResult(node.initializer.text, `variable:${varName}`, node.initializer);
    }
  }

  // ── Recurse ──────────────────────────────────────────────────────────────
  ts.forEachChild(node, (child) =>
    visitNode(filePath, sourceFile, lines, child, plFlat, results)
  );
}

// ─── File walker ─────────────────────────────────────────────────────────────

function walkDir(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, files);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

// ─── Dedup ───────────────────────────────────────────────────────────────────

function deduplicate(results) {
  const seen = new Set();
  const out  = [];
  for (const r of results) {
    const key = `${r.file}:${r.line}:${r.string}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

// ─── Text report ─────────────────────────────────────────────────────────────

function buildTxtReport(report) {
  const lines = [
    '═══════════════════════════════════════════════════════════════════',
    '  HARDCODED STRING SCAN REPORT — Soulverse / Aethera',
    `  Generated: ${report.generatedAt}`,
    '═══════════════════════════════════════════════════════════════════',
    '',
    `  Total candidates : ${report.totalCandidates}`,
    `  Files affected   : ${report.filesAffected}`,
    `  Missing from i18n: ${report.missingCount}`,
    `  Already in i18n  : ${report.existingCount}`,
    '',
    '─────────────────────────────────────────────────────────────────── ',
    '  TOP FILES BY HIT COUNT',
    '─────────────────────────────────────────────────────────────────── ',
    ...report.topFiles.map((f) => `  [${String(f.count).padStart(4)}]  ${f.file}`),
    '',
  ];

  let currentFile = null;
  for (const entry of report.entries) {
    if (entry.file !== currentFile) {
      currentFile = entry.file;
      lines.push('');
      lines.push('╔══════════════════════════════════════════════════════════════');
      lines.push(`║  ${entry.file}`);
      lines.push('╚══════════════════════════════════════════════════════════════');
    }

    const statusMark = entry.status === 'existing' ? '✓' : '✗';
    lines.push(`  [L${String(entry.line).padStart(4)}] ${statusMark} (${entry.reason})`);
    lines.push(`         STRING  : "${entry.string}"`);
    lines.push(`         KEY     : ${entry.suggestedKey}`);
    if (entry.existingKey) {
      lines.push(`         FOUND   : ${entry.existingKey}`);
    }
    lines.push(`         CONTEXT : ${entry.context.current}`);
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('  END OF REPORT');
  lines.push('═══════════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('[scan-hardcoded-pl] Loading pl/_master.flat.json …');
  const plFlat = readJson(PL_FLAT);
  const plCount = Object.keys(plFlat).length;
  console.log(`[scan-hardcoded-pl] Loaded ${plCount} existing keys`);

  console.log('[scan-hardcoded-pl] Walking src/ for .ts/.tsx files …');
  const files = walkDir(SRC_DIR);
  console.log(`[scan-hardcoded-pl] Found ${files.length} source files`);

  const results = [];
  let processed = 0;

  for (const filePath of files) {
    processed += 1;
    if (processed % 25 === 0 || processed === files.length) {
      process.stdout.write(`\r[scan-hardcoded-pl] Processing ${processed}/${files.length} …`);
    }

    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      console.warn(`\n[scan-hardcoded-pl] Could not read ${filePath}: ${err.message}`);
      continue;
    }

    const isTsx = filePath.endsWith('x');
    let sourceFile;
    try {
      sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
        isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );
    } catch (err) {
      console.warn(`\n[scan-hardcoded-pl] Parse error in ${filePath}: ${err.message}`);
      continue;
    }

    const lines = makeLineCache(content);
    visitNode(filePath, sourceFile, lines, sourceFile, plFlat, results);
  }

  process.stdout.write('\n');

  const deduped = deduplicate(results);
  deduped.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

  // Aggregate by file
  const byFile = {};
  for (const r of deduped) {
    byFile[r.file] = byFile[r.file] || { count: 0, entries: [] };
    byFile[r.file].count += 1;
    byFile[r.file].entries.push(r);
  }

  const topFiles = Object.entries(byFile)
    .map(([file, d]) => ({ file, count: d.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  const missingCount  = deduped.filter((r) => r.status === 'missing').length;
  const existingCount = deduped.filter((r) => r.status === 'existing').length;

  const report = {
    generatedAt: new Date().toISOString(),
    totalCandidates: deduped.length,
    filesAffected: Object.keys(byFile).length,
    missingCount,
    existingCount,
    topFiles,
    entries: deduped,
  };

  ensureDir(TOOLS_DIR);
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + '\n', 'utf8');
  fs.writeFileSync(OUT_TXT, buildTxtReport(report), 'utf8');

  console.log('');
  console.log(`[scan-hardcoded-pl] ✓ Total candidates : ${report.totalCandidates}`);
  console.log(`[scan-hardcoded-pl] ✓ Files affected   : ${report.filesAffected}`);
  console.log(`[scan-hardcoded-pl] ✓ Missing from i18n: ${missingCount}`);
  console.log(`[scan-hardcoded-pl] ✓ Already in i18n  : ${existingCount}`);
  console.log(`[scan-hardcoded-pl] ✓ JSON → ${OUT_JSON}`);
  console.log(`[scan-hardcoded-pl] ✓ TXT  → ${OUT_TXT}`);
}

main();
