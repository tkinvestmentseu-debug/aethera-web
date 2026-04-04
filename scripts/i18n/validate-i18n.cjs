const path = require('path');
const {
  REPORTS_DIR,
  getPrimaryLocaleFiles,
  readJson,
  writeJson,
  flattenObject,
  loadLanguageBase,
  hasPolishResidue,
} = require('./shared.cjs');

const languageBase = loadLanguageBase();
const files = getPrimaryLocaleFiles();
const locales = Object.fromEntries(files.map((file) => [path.basename(file, '.json'), flattenObject(readJson(file))]));
const baseline = locales.pl || {};
const report = {
  generatedAt: new Date().toISOString(),
  missingKeys: {},
  placeholderMismatches: [],
  polishResidueInNonPl: [],
};

const placeholderPattern = /\{\{[^}]+\}\}/g;
const baselineKeys = Object.keys(baseline);

Object.entries(locales).forEach(([locale, flat]) => {
  if (locale === 'pl') return;

  const missing = baselineKeys.filter((key) => !(key in flat));
  if (missing.length) {
    report.missingKeys[locale] = missing.slice(0, 500);
  }

  baselineKeys.forEach((key) => {
    const sourceValue = baseline[key];
    const targetValue = flat[key];
    if (typeof sourceValue !== 'string' || typeof targetValue !== 'string') return;

    const sourcePlaceholders = sourceValue.match(placeholderPattern) || [];
    const targetPlaceholders = targetValue.match(placeholderPattern) || [];
    if (sourcePlaceholders.join('|') !== targetPlaceholders.join('|')) {
      report.placeholderMismatches.push({ locale, key, sourcePlaceholders, targetPlaceholders });
    }

    if (hasPolishResidue(targetValue, languageBase)) {
      report.polishResidueInNonPl.push({ locale, key, sample: targetValue.slice(0, 180) });
    }
  });
});

const outputPath = path.join(REPORTS_DIR, 'i18n-validation.json');
writeJson(outputPath, report);
console.log(`missing_locales=${Object.keys(report.missingKeys).length}`);
console.log(`placeholder_mismatches=${report.placeholderMismatches.length}`);
console.log(`polish_residue_in_non_pl=${report.polishResidueInNonPl.length}`);
console.log(`report=${outputPath}`);
