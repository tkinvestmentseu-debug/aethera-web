#!/usr/bin/env node
'use strict';

const path = require('path');
const {
  ROOT,
  SRC_LOCALES,
  TOOLS_I18N,
  readJson,
  writeJson,
  unflattenObject,
} = require('./shared.cjs');

const MASTER_CATALOG = path.join(TOOLS_I18N, 'master-catalog.json');
const PL_MASTER_FLAT = path.join(SRC_LOCALES, 'pl', '_master.flat.json');
const PL_MASTER_NESTED = path.join(SRC_LOCALES, 'pl', '_master.json');
const TARGETS = ['en', 'de', 'es', 'pt', 'fr', 'it', 'ru', 'ar', 'ja', 'zh'];

const main = () => {
  const catalog = readJson(MASTER_CATALOG);
  const flat = {};

  for (const entry of catalog.entries || []) {
    flat[entry.key] = entry.source;
  }

  writeJson(PL_MASTER_FLAT, flat);
  writeJson(PL_MASTER_NESTED, unflattenObject(flat));

  for (const lang of TARGETS) {
    const targetFlat = path.join(SRC_LOCALES, lang, '_master.flat.json');
    const targetNested = path.join(SRC_LOCALES, lang, '_master.json');
    let existing = {};
    try {
      existing = readJson(targetFlat);
    } catch {}
    writeJson(targetFlat, existing);
    writeJson(targetNested, unflattenObject(existing));
  }

  console.log(`pl_master_flat=${PL_MASTER_FLAT}`);
  console.log(`pl_master_nested=${PL_MASTER_NESTED}`);
  console.log(`total_keys=${Object.keys(flat).length}`);
};

main();
