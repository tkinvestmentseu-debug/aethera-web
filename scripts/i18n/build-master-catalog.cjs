#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  ROOT,
  SRC_I18N,
  SRC_LOCALES,
  TOOLS_I18N,
  REPORTS_DIR,
  readJson,
  writeJson,
  writeText,
  flattenObject,
  getLocaleFiles,
  getNamespaceLocaleFiles,
  normalizeText,
} = require('./shared.cjs');

const HARDCODED_REPORT = path.join(REPORTS_DIR, 'i18n-hardcoded-report.json');
const MASTER_CATALOG = path.join(TOOLS_I18N, 'master-catalog.json');
const MASTER_CATALOG_TXT = path.join(TOOLS_I18N, 'master-catalog.txt');

const sanitizeSegment = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .toLowerCase();

const namespaceFromFile = (filePath) => {
  const file = path.basename(filePath, '.json');
  if (file === 'common') return 'common';
  return file;
};

const buildExistingEntries = () => {
  const entries = [];

  getLocaleFiles()
    .filter((file) => path.basename(file).startsWith('pl'))
    .forEach((filePath) => {
      const data = readJson(filePath);
      const flat = flattenObject(data);
      Object.entries(flat).forEach(([key, value]) => {
        if (typeof value !== 'string' || !normalizeText(value)) return;
        entries.push({
          key,
          source: value,
          namespace: 'translation',
          origin: path.relative(ROOT, filePath).replace(/\\/g, '/'),
          kind: 'legacy_locale',
        });
      });
    });

  getNamespaceLocaleFiles('pl').forEach((filePath) => {
    const ns = namespaceFromFile(filePath);
    const data = readJson(filePath);
    const flat = flattenObject(data);
    Object.entries(flat).forEach(([key, value]) => {
      if (typeof value !== 'string' || !normalizeText(value)) return;
      entries.push({
        key: `${ns}.${key}`,
        source: value,
        namespace: ns,
        origin: path.relative(ROOT, filePath).replace(/\\/g, '/'),
        kind: 'namespace_locale',
      });
    });
  });

  return entries;
};

const moduleFromReportPath = (file) => {
  const normalized = file.replace(/\\/g, '/');
  const parts = normalized.split('/');
  if (parts.includes('screens')) return sanitizeSegment(parts[parts.indexOf('screens') + 1].replace(/\.[^.]+$/, ''));
  if (parts.includes('components')) return sanitizeSegment(parts[parts.indexOf('components') + 1].replace(/\.[^.]+$/, ''));
  if (parts.includes('features')) {
    const idx = parts.indexOf('features');
    return sanitizeSegment(parts[idx + 1] || 'feature');
  }
  return sanitizeSegment(parts[parts.length - 1].replace(/\.[^.]+$/, ''));
};

const buildHardcodedEntries = (existingBySource, existingKeys) => {
  if (!fs.existsSync(HARDCODED_REPORT)) {
    throw new Error(`Missing hardcoded report: ${HARDCODED_REPORT}`);
  }

  const report = readJson(HARDCODED_REPORT);
  const counters = new Map();
  const entries = [];

  for (const item of report.entries || []) {
    const source = normalizeText(item.text);
    if (!source) continue;

    const existingKey = existingBySource.get(source);
    if (existingKey) {
      entries.push({
        key: existingKey,
        source,
        namespace: existingKey.split('.')[0] || 'translation',
        origin: `${item.file}:${item.line}`,
        kind: 'hardcoded_mapped',
      });
      continue;
    }

    const moduleName = moduleFromReportPath(item.file);
    const baseKey = item.suggestedKey || `${moduleName}.text`;
    const count = (counters.get(baseKey) || 0) + 1;
    counters.set(baseKey, count);
    let key = count === 1 ? baseKey : `${baseKey}_${count}`;
    while (existingKeys.has(key)) {
      const nextCount = (counters.get(baseKey) || count) + 1;
      counters.set(baseKey, nextCount);
      key = `${baseKey}_${nextCount}`;
    }
    existingKeys.add(key);

    entries.push({
      key,
      source,
      namespace: key.split('.')[0] || moduleName,
      origin: `${item.file}:${item.line}`,
      kind: item.interpolation ? 'hardcoded_interpolated' : 'hardcoded_literal',
    });
  }

  return entries;
};

const main = () => {
  const existingEntries = buildExistingEntries();
  const existingBySource = new Map();
  const existingKeys = new Set();

  for (const entry of existingEntries) {
    if (!existingBySource.has(entry.source)) existingBySource.set(entry.source, entry.key);
    existingKeys.add(entry.key);
  }

  const hardcodedEntries = buildHardcodedEntries(existingBySource, existingKeys);
  const mergedMap = new Map();

  [...existingEntries, ...hardcodedEntries].forEach((entry) => {
    if (!mergedMap.has(entry.key)) {
      mergedMap.set(entry.key, entry);
    }
  });

  const entries = Array.from(mergedMap.values()).sort((a, b) => a.key.localeCompare(b.key));
  const byNamespace = {};
  for (const entry of entries) {
    byNamespace[entry.namespace] = (byNamespace[entry.namespace] || 0) + 1;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    totalEntries: entries.length,
    namespaces: byNamespace,
    entries,
  };

  writeJson(MASTER_CATALOG, payload);

  const lines = [
    `generatedAt=${payload.generatedAt}`,
    `totalEntries=${payload.totalEntries}`,
    '',
    'namespaces:',
    ...Object.entries(byNamespace)
      .sort((a, b) => b[1] - a[1])
      .map(([ns, count]) => `- ${ns}: ${count}`),
    '',
    'sample:',
    ...entries.slice(0, 120).map((entry) => `${entry.key} = ${entry.source}`),
  ];
  writeText(MASTER_CATALOG_TXT, `${lines.join('\n')}\n`);

  console.log(`master_catalog=${MASTER_CATALOG}`);
  console.log(`total_entries=${payload.totalEntries}`);
  console.log(`namespaces=${Object.keys(byNamespace).length}`);
};

main();
