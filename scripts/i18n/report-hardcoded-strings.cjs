const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const {
  ROOT,
  REPORTS_DIR,
  getSourceFiles,
  loadLanguageBase,
  normalizeText,
  writeJson,
} = require('./shared.cjs');

const languageBase = loadLanguageBase();

const ATTR_NAMES = new Set([
  'placeholder',
  'title',
  'alt',
  'label',
  'accessibilityLabel',
  'accessibilityHint',
  'aria-label',
  'headerTitle',
  'subtitle',
  'description',
  'message',
  'text',
  'cta',
  'confirmText',
  'cancelText',
]);

const CALL_TARGETS = new Set([
  'alert',
  'toast',
  'showToast',
  'showError',
  'showSuccess',
  'showMessage',
  'navigate',
  'setUserQuestion',
  'setPartnerName',
]);

const TECHNICAL_PATTERNS = [
  /^[A-Z0-9_ -]{1,3}$/,
  /^[a-z0-9_.:/-]+$/,
  /^#[0-9A-Fa-f]{3,8}$/,
  /^\d+$/,
  /^[a-z]+(?:[A-Z][a-z0-9]+)+$/,
  /^(translate|scale|rotate|rgba?|hsla?|M|L|Z)\b/,
];

function containsPolishSignal(text) {
  const value = normalizeText(text).toLowerCase();
  if (!value) return false;
  if (languageBase.diacritics.some((char) => value.includes(char))) return true;
  if (languageBase.commonWords.some((word) => new RegExp(`(^|\\W)${word}($|\\W)`, 'i').test(value))) return true;
  if (languageBase.stemHints.some((stem) => value.includes(stem))) return true;
  return false;
}

function looksTechnical(text) {
  const value = normalizeText(text);
  if (!value) return true;
  if (value.length < 2) return true;
  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(value))) return true;
  if (/^[\p{Emoji}\s.,!?;:'"()\-–—/\\]+$/u.test(value)) return true;
  return false;
}

function sanitizeSegment(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .toLowerCase();
}

function moduleFromPath(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const parts = rel.split('/');
  if (parts.includes('screens')) return sanitizeSegment(parts[parts.indexOf('screens') + 1].replace(/\.[^.]+$/, ''));
  if (parts.includes('components')) return sanitizeSegment(parts[parts.indexOf('components') + 1].replace(/\.[^.]+$/, ''));
  if (parts.includes('features')) {
    const idx = parts.indexOf('features');
    return sanitizeSegment(parts[idx + 1] || parts[idx + 2] || 'feature');
  }
  if (parts.includes('core')) {
    const idx = parts.indexOf('core');
    return sanitizeSegment(parts[idx + 1] || 'core');
  }
  return sanitizeSegment(parts[parts.length - 1].replace(/\.[^.]+$/, ''));
}

function contextSegment(node, sourceFile) {
  let current = node;
  while (current) {
    if (ts.isJsxAttribute(current) && current.name) return sanitizeSegment(current.name.getText(sourceFile));
    if (ts.isPropertyAssignment(current) && current.name) return sanitizeSegment(current.name.getText(sourceFile));
    if (ts.isVariableDeclaration(current) && current.name) return sanitizeSegment(current.name.getText(sourceFile));
    if (ts.isFunctionDeclaration(current) && current.name) return sanitizeSegment(current.name.getText(sourceFile));
    if (ts.isMethodDeclaration(current) && current.name) return sanitizeSegment(current.name.getText(sourceFile));
    if (ts.isCallExpression(current)) {
      const expr = current.expression.getText(sourceFile).split('.').pop();
      return sanitizeSegment(expr || 'call');
    }
    current = current.parent;
  }
  return 'text';
}

function inferKey(filePath, node, sourceFile) {
  const moduleName = moduleFromPath(filePath);
  const ctx = contextSegment(node, sourceFile) || 'text';
  return `${moduleName}.${ctx}`;
}

function addResult(results, filePath, sourceFile, node, rawText, reason, extra = {}) {
  const text = normalizeText(rawText);
  if (!text || looksTechnical(text)) return;
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  results.push({
    file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
    line: line + 1,
    text,
    reason,
    suggestedKey: inferKey(filePath, node, sourceFile),
    ...extra,
  });
}

function shouldReportLiteral(text) {
  const value = normalizeText(text);
  if (!value || looksTechnical(value)) return false;
  if (containsPolishSignal(value)) return true;
  if (/\s/.test(value) && /[A-ZĄĆĘŁŃÓŚŹŻ]/.test(value[0])) return true;
  if (/[.!?]/.test(value) && value.length > 12) return true;
  return false;
}

function getTemplateText(node, sourceFile) {
  const parts = [node.head.text, ...node.templateSpans.map((span) => `{{${span.expression.getText(sourceFile)}}}${span.literal.text}`)];
  return parts.join('');
}

function visitNode(filePath, sourceFile, node, results) {
  if (ts.isJsxText(node)) {
    const text = normalizeText(node.getText(sourceFile));
    if (shouldReportLiteral(text)) addResult(results, filePath, sourceFile, node, text, 'jsx_text');
  }

  if (ts.isJsxAttribute(node)) {
    const attrName = node.name.getText(sourceFile);
    if (ATTR_NAMES.has(attrName) && node.initializer) {
      if (ts.isStringLiteral(node.initializer)) {
        addResult(results, filePath, sourceFile, node.initializer, node.initializer.text, `jsx_attr:${attrName}`);
      } else if (
        ts.isJsxExpression(node.initializer) &&
        node.initializer.expression &&
        ts.isStringLiteralLike(node.initializer.expression)
      ) {
        addResult(results, filePath, sourceFile, node.initializer.expression, node.initializer.expression.text, `jsx_attr:${attrName}`);
      } else if (
        ts.isJsxExpression(node.initializer) &&
        node.initializer.expression &&
        ts.isTemplateExpression(node.initializer.expression)
      ) {
        addResult(results, filePath, sourceFile, node.initializer.expression, getTemplateText(node.initializer.expression, sourceFile), `jsx_attr:${attrName}`, { interpolation: true });
      }
    }
  }

  if (ts.isCallExpression(node)) {
    const callee = node.expression.getText(sourceFile).split('.').pop();
    if (CALL_TARGETS.has(callee || '')) {
      node.arguments.forEach((arg) => {
        if (ts.isStringLiteralLike(arg)) {
          addResult(results, filePath, sourceFile, arg, arg.text, `call:${callee}`);
        } else if (ts.isTemplateExpression(arg)) {
          addResult(results, filePath, sourceFile, arg, getTemplateText(arg, sourceFile), `call:${callee}`, { interpolation: true });
        }
      });
    }
  }

  if (ts.isPropertyAssignment(node) && node.initializer) {
    const keyName = node.name.getText(sourceFile).replace(/['"]/g, '');
    if (ATTR_NAMES.has(keyName) || ['copy', 'meaning', 'action', 'subtitle', 'title', 'desc', 'story', 'significance', 'effect', 'advice', 'prompt', 'headline', 'body'].includes(keyName)) {
      if (ts.isStringLiteralLike(node.initializer)) {
        addResult(results, filePath, sourceFile, node.initializer, node.initializer.text, `property:${keyName}`);
      } else if (ts.isTemplateExpression(node.initializer)) {
        addResult(results, filePath, sourceFile, node.initializer, getTemplateText(node.initializer, sourceFile), `property:${keyName}`, { interpolation: true });
      }
    }
  }

  if (ts.isVariableDeclaration(node) && node.initializer && ts.isStringLiteralLike(node.initializer)) {
    const name = node.name.getText(sourceFile);
    if (/prompt|label|title|subtitle|description|message|copy|text|headline|hint/i.test(name)) {
      addResult(results, filePath, sourceFile, node.initializer, node.initializer.text, `variable:${name}`);
    }
  }

  ts.forEachChild(node, (child) => visitNode(filePath, sourceFile, child, results));
}

function main() {
  const files = getSourceFiles().filter((filePath) => /\.(ts|tsx|js|jsx)$/.test(filePath));
  const results = [];

  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, filePath.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    visitNode(filePath, sourceFile, sourceFile, results);
  });

  const deduped = [];
  const seen = new Set();
  results.forEach((entry) => {
    const key = `${entry.file}:${entry.line}:${entry.text}:${entry.reason}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(entry);
  });

  const byFile = {};
  deduped.forEach((entry) => {
    byFile[entry.file] = byFile[entry.file] || { count: 0, entries: [] };
    byFile[entry.file].count += 1;
    byFile[entry.file].entries.push(entry);
  });

  const topFiles = Object.entries(byFile)
    .map(([file, data]) => ({ file, count: data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  const report = {
    generatedAt: new Date().toISOString(),
    totalCandidates: deduped.length,
    filesWithCandidates: Object.keys(byFile).length,
    topFiles,
    entries: deduped,
  };

  const outputPath = path.join(REPORTS_DIR, 'i18n-hardcoded-report.json');
  writeJson(outputPath, report);
  console.log(`total_candidates=${report.totalCandidates}`);
  console.log(`files_with_candidates=${report.filesWithCandidates}`);
  console.log(`report=${outputPath}`);
}

main();
