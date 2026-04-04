const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC_I18N = path.join(ROOT, 'src', 'core', 'i18n');
const TOOLS_I18N = path.join(ROOT, 'tools', 'i18n-resources');
const REPORTS_DIR = path.join(TOOLS_I18N, 'reports');

const stripBom = (value) => value.replace(/^\uFEFF/, '');

const readJson = (filePath) => JSON.parse(stripBom(fs.readFileSync(filePath, 'utf8')));

const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const flattenObject = (input, prefix = '', output = {}) => {
  if (Array.isArray(input)) {
    input.forEach((item, index) => {
      flattenObject(item, prefix ? `${prefix}.${index}` : String(index), output);
    });
    return output;
  }

  if (input && typeof input === 'object') {
    Object.entries(input).forEach(([key, value]) => {
      flattenObject(value, prefix ? `${prefix}.${key}` : key, output);
    });
    return output;
  }

  output[prefix] = input;
  return output;
};

const getLocaleFiles = () =>
  fs.readdirSync(SRC_I18N)
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.join(SRC_I18N, file));

const getPrimaryLocaleFiles = () =>
  getLocaleFiles().filter((file) => !/-content|-data|-tarot/.test(path.basename(file)));

const loadLocaleBundle = () => {
  const bundle = {};
  getLocaleFiles().forEach((file) => {
    const name = path.basename(file, '.json');
    bundle[name] = readJson(file);
  });
  return bundle;
};

const loadLanguageBase = () => readJson(path.join(TOOLS_I18N, 'polish-language-base.json'));
const loadGlossary = () => readJson(path.join(SRC_I18N, 'glossary.aethera.json'));
const loadTranslationMemory = () => readJson(path.join(SRC_I18N, 'translation-memory.json'));

const normalizeText = (value) =>
  String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getSourceFiles = () => {
  const roots = ['src', 'App.tsx', 'index.ts'].map((entry) => path.join(ROOT, entry));
  const files = [];

  const walk = (entryPath) => {
    if (!fs.existsSync(entryPath)) return;
    const stat = fs.statSync(entryPath);
    if (stat.isFile()) {
      if (/\.(ts|tsx|js|jsx|json)$/.test(entryPath) && !entryPath.includes('node_modules')) {
        files.push(entryPath);
      }
      return;
    }

    fs.readdirSync(entryPath).forEach((child) => walk(path.join(entryPath, child)));
  };

  roots.forEach(walk);
  return files;
};

const extractStringLiterals = (content) => {
  const matches = [];
  const regex = /(["'`])((?:\\.|(?!\1)[\s\S])*)\1/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[2]);
  }
  return matches;
};

const hasPolishResidue = (text, languageBase) => {
  const normalized = normalizeText(text).toLowerCase();
  if (!normalized) return false;
  if (languageBase.diacritics.some((char) => normalized.includes(char))) return true;
  if (languageBase.commonWords.some((word) => new RegExp(`(^|\\W)${word}($|\\W)`, 'i').test(normalized))) return true;
  if (languageBase.stemHints.some((stem) => normalized.includes(stem))) return true;
  return false;
};

module.exports = {
  ROOT,
  SRC_I18N,
  TOOLS_I18N,
  REPORTS_DIR,
  readJson,
  writeJson,
  flattenObject,
  getLocaleFiles,
  getPrimaryLocaleFiles,
  loadLocaleBundle,
  loadLanguageBase,
  loadGlossary,
  loadTranslationMemory,
  normalizeText,
  getSourceFiles,
  extractStringLiterals,
  hasPolishResidue,
};
