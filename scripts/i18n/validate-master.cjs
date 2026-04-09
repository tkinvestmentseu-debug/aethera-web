#!/usr/bin/env node
'use strict';

const path = require('path');
const {
  SRC_LOCALES,
  TOOLS_I18N,
  REPORTS_DIR,
  readJson,
  writeJson,
  writeText,
  loadLanguageBase,
} = require('./shared.cjs');

const MASTER_PL = path.join(SRC_LOCALES, 'pl', '_master.flat.json');
const TARGETS = ['en', 'de', 'es', 'pt', 'fr', 'it', 'ru', 'ar', 'ja', 'zh'];
const languageBase = loadLanguageBase();
const TECHNICAL_KEY_PATTERN = /\.(icon|emoji)$/;

const hasPolishResidue = (text) => {
  const value = String(text || '').toLowerCase();
  if (!value) return false;
  if (languageBase.diacritics.some((char) => value.includes(char))) return true;
  if (languageBase.commonWords.some((word) => new RegExp(`(^|\\W)${word}($|\\W)`, 'i').test(value))) return true;
  return false;
};

const placeholders = (text) => (String(text).match(/\{\{[^}]+\}\}/g) || []).sort();

const main = () => {
  const master = readJson(MASTER_PL);
  const report = {
    generatedAt: new Date().toISOString(),
    totalKeys: Object.keys(master).length,
    targets: {},
  };

  for (const lang of TARGETS) {
    const filePath = path.join(SRC_LOCALES, lang, '_master.flat.json');
    let data = {};
    try {
      data = readJson(filePath);
    } catch {}

    const missing = [];
    const unchanged = [];
    const placeholderMismatches = [];
    const polishResidue = [];

    for (const [key, source] of Object.entries(master)) {
      if (TECHNICAL_KEY_PATTERN.test(key)) {
        continue;
      }
      const target = data[key];
      if (!target) {
        missing.push(key);
        continue;
      }
      if (target === source) unchanged.push(key);
      if (JSON.stringify(placeholders(source)) !== JSON.stringify(placeholders(target))) {
        placeholderMismatches.push(key);
      }
      if (lang !== 'pl' && hasPolishResidue(target)) {
        polishResidue.push(key);
      }
    }

    report.targets[lang] = {
      missing: missing.length,
      unchanged: unchanged.length,
      placeholderMismatches: placeholderMismatches.length,
      polishResidue: polishResidue.length,
      sampleMissing: missing.slice(0, 40),
      samplePlaceholderMismatches: placeholderMismatches.slice(0, 40),
      samplePolishResidue: polishResidue.slice(0, 40),
    };
  }

  const jsonPath = path.join(REPORTS_DIR, 'master-validate-report.json');
  const txtPath = path.join(REPORTS_DIR, 'master-validate-report.txt');
  writeJson(jsonPath, report);
  writeText(
    txtPath,
    [
      `generatedAt=${report.generatedAt}`,
      `totalKeys=${report.totalKeys}`,
      '',
      ...Object.entries(report.targets).map(([lang, data]) =>
        `${lang}: missing=${data.missing} unchanged=${data.unchanged} placeholderMismatches=${data.placeholderMismatches} polishResidue=${data.polishResidue}`
      ),
    ].join('\n') + '\n',
  );

  console.log(`report=${jsonPath}`);
  Object.entries(report.targets).forEach(([lang, data]) => {
    console.log(`${lang}: missing=${data.missing} unchanged=${data.unchanged} placeholder_mismatches=${data.placeholderMismatches} polish_residue=${data.polishResidue}`);
  });
};

main();
