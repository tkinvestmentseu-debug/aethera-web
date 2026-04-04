const path = require('path');
const {
  SRC_I18N,
  getLocaleFiles,
  readJson,
  writeJson,
  flattenObject,
} = require('./shared.cjs');

const outputPath = path.join(SRC_I18N, 'translation-memory.json');
const localeFiles = getLocaleFiles();
const memory = {
  version: 1,
  generatedBy: 'scripts/i18n/build-translation-memory.cjs',
  locales: {},
  entries: {}
};

localeFiles.forEach((file) => {
  const localeName = path.basename(file, '.json');
  memory.locales[localeName] = path.basename(file);
  const flat = flattenObject(readJson(file));
  Object.entries(flat).forEach(([key, value]) => {
    if (typeof value !== 'string') return;
    memory.entries[key] ||= {};
    memory.entries[key][localeName] = value;
  });
});

writeJson(outputPath, memory);
console.log(`translation-memory updated: ${outputPath}`);
