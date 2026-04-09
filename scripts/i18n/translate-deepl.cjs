#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const ROOT_ENV = path.join(ROOT, '.env');
const API_KEYS_ENV = path.join(ROOT, 'api-keys', '.env');
const CORE_I18N_DIR = path.join(ROOT, 'src', 'core', 'i18n');
const LOCALES_DIR = path.join(ROOT, 'src', 'locales');

const TARGETS = [
  { id: 'en', deepl: 'EN-GB', localeCode: 'en-GB' },
  { id: 'de', deepl: 'DE', localeCode: 'de-DE' },
  { id: 'es', deepl: 'ES', localeCode: 'es-ES' },
  { id: 'pt', deepl: 'PT-PT', localeCode: 'pt-PT' },
  { id: 'fr', deepl: 'FR', localeCode: 'fr-FR' },
  { id: 'it', deepl: 'IT', localeCode: 'it-IT' },
  { id: 'ru', deepl: 'RU', localeCode: 'ru-RU' },
  { id: 'ar', deepl: 'AR', localeCode: 'ar' },
  { id: 'ja', deepl: 'JA', localeCode: 'ja-JP' },
  { id: 'zh', deepl: 'ZH-HANS', localeCode: 'zh-CN' },
];

const SOURCE_COLLECTIONS = [
  {
    name: 'namespaces',
    type: 'dir',
    sourceDir: path.join(LOCALES_DIR, 'pl'),
    targetDirFactory: (lang) => path.join(LOCALES_DIR, lang),
  },
  {
    name: 'core-extras',
    type: 'files',
    files: ['pl-data.json', 'pl-tarot.json', 'pl-content.json'],
    sourceDir: CORE_I18N_DIR,
    targetFileFactory: (lang, fileName) => path.join(CORE_I18N_DIR, fileName.replace(/^pl/, lang)),
  },
];

const SKIP_KEYS = new Set(['appName', 'localeCode']);
const PLACEHOLDER_PATTERN = /\{\{[^}]+\}\}/g;
const XML_TAG_PATTERN = /<[^>]+>/g;
const BATCH_SIZE = 25;
const BATCH_DELAY_MS = 1200;
const MAX_RETRIES = 6;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(ROOT_ENV);
loadEnvFile(API_KEYS_ENV);

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
if (!DEEPL_API_KEY) {
  console.error('DEEPL_API_KEY not found in .env or api-keys/.env');
  process.exit(1);
}

const DEEPL_API_FREE = DEEPL_API_KEY.endsWith(':fx');
const DEEPL_BASE = DEEPL_API_FREE ? 'https://api-free.deepl.com/v2' : 'https://api.deepl.com/v2';

const args = process.argv.slice(2);
const forceMode = args.includes('--force');
const includeCoreExtras = args.includes('--include-core-extras');
const targetArg = args.find((arg) => arg.startsWith('--lang=')) || args[args.indexOf('--lang') + 1];
let activeTargets = TARGETS;
if (targetArg && targetArg !== '--force' && targetArg !== '--include-core-extras') {
  const requested = targetArg.replace('--lang=', '').split(',').map((item) => item.trim().toLowerCase());
  activeTargets = TARGETS.filter((target) => requested.includes(target.id));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function flattenObject(input, prefix = '', output = {}) {
  if (Array.isArray(input)) {
    input.forEach((item, index) => flattenObject(item, prefix ? `${prefix}.${index}` : String(index), output));
    return output;
  }

  if (input && typeof input === 'object') {
    Object.entries(input).forEach(([key, value]) => {
      if (SKIP_KEYS.has(key)) return;
      flattenObject(value, prefix ? `${prefix}.${key}` : key, output);
    });
    return output;
  }

  output[prefix] = input;
  return output;
}

function getDeep(input, dotKey) {
  const parts = dotKey.split('.');
  let current = input;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

function setDeep(input, dotKey, value) {
  const parts = dotKey.split('.');
  let current = input;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    const next = parts[index + 1];
    const nextIsIndex = /^\d+$/.test(next);
    if (current[part] == null) {
      current[part] = nextIsIndex ? [] : {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

function deepMerge(target, source) {
  Object.entries(source).forEach(([key, value]) => {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key], value);
      return;
    }
    target[key] = value;
  });
  return target;
}

function collectSourceItems() {
  const items = [];

  const namespaceFiles = fs
    .readdirSync(SOURCE_COLLECTIONS[0].sourceDir)
    .filter((file) => file.endsWith('.json'))
    .sort();
  namespaceFiles.forEach((fileName) => {
    items.push({
      collection: 'namespaces',
      sourcePath: path.join(SOURCE_COLLECTIONS[0].sourceDir, fileName),
      targetPathFactory: (lang) => path.join(LOCALES_DIR, lang, fileName),
      fileName,
    });
  });

  if (includeCoreExtras) {
    SOURCE_COLLECTIONS[1].files.forEach((fileName) => {
      items.push({
        collection: 'core-extras',
        sourcePath: path.join(CORE_I18N_DIR, fileName),
        targetPathFactory: (lang) => path.join(CORE_I18N_DIR, fileName.replace(/^pl/, lang)),
        fileName,
      });
    });
  }

  return items;
}

function protectText(text) {
  const placeholders = [];
  let index = 0;
  const protectedText = String(text)
    .replace(PLACEHOLDER_PATTERN, (match) => {
      const token = `<x id="ph_${index}">${match}</x>`;
      placeholders.push({ token, value: match });
      index += 1;
      return token;
    })
    .replace(XML_TAG_PATTERN, (match) => {
      if (/^<x id="ph_/.test(match) || /^<\/x>$/.test(match)) return match;
      const token = `<x id="xml_${index}">${match}</x>`;
      placeholders.push({ token, value: match });
      index += 1;
      return token;
    });
  return { protectedText, placeholders };
}

function restoreText(text, placeholders) {
  return placeholders.reduce((result, placeholder) => result.split(placeholder.token).join(placeholder.value), text);
}

async function fetchUsage() {
  const response = await fetch(`${DEEPL_BASE}/usage`, {
    headers: { Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}` },
  });
  if (!response.ok) {
    throw new Error(`DeepL usage check failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function translateBatch(texts, targetLang) {
  const body = new URLSearchParams();
  body.append('source_lang', 'PL');
  body.append('target_lang', targetLang);
  body.append('tag_handling', 'xml');
  body.append('ignore_tags', 'x');
  texts.forEach((text) => body.append('text', text));

  const response = await fetch(`${DEEPL_BASE}/translate`, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    const retryAfter = response.headers.get('retry-after');
    const error = new Error(`DeepL API error ${response.status}: ${bodyText}`);
    error.status = response.status;
    error.retryAfter = retryAfter ? Number(retryAfter) * 1000 : null;
    throw error;
  }

  const payload = await response.json();
  return payload.translations.map((entry) => entry.text);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateBatchWithRetry(texts, targetLang) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await translateBatch(texts, targetLang);
    } catch (error) {
      if (attempt === MAX_RETRIES || error.status !== 429) {
        throw error;
      }
      const backoff = error.retryAfter || (4000 * (attempt + 1));
      console.log(`rate limited ${targetLang}, retry in ${Math.round(backoff / 1000)}s`);
      await sleep(backoff);
    }
  }
  throw new Error('Unexpected retry exhaustion');
}

async function run() {
  const items = collectSourceItems();
  const estimation = [];
  let totalRequestedChars = 0;

  items.forEach((item) => {
    const flat = flattenObject(readJson(item.sourcePath));
    estimation.push({ item, flat });
  });
  const usage = await fetchUsage();
  const remainingChars = Math.max(0, (usage.character_limit || 0) - (usage.character_count || 0));

  activeTargets.forEach((target) => {
    estimation.forEach(({ item, flat }) => {
      const targetPath = item.targetPathFactory(target.id);
      const existing = fs.existsSync(targetPath) ? readJson(targetPath) : {};
      Object.entries(flat).forEach(([key, sourceValue]) => {
        const existingValue = getDeep(existing, key);
        if (!forceMode && typeof existingValue === 'string' && existingValue && existingValue !== sourceValue) {
          return;
        }
        totalRequestedChars += String(sourceValue).length;
      });
    });
  });

  console.log(`DeepL key type: ${DEEPL_API_FREE ? 'free' : 'paid'}`);
  console.log(`Remaining chars: ${remainingChars}`);
  console.log(`Requested chars: ${totalRequestedChars}`);
  console.log(`Targets: ${activeTargets.map((target) => target.id).join(', ')}`);
  console.log(`Mode: ${forceMode ? 'force' : 'resume'}`);
  console.log(`Include core extras: ${includeCoreExtras ? 'yes' : 'no'}`);

  if (remainingChars < totalRequestedChars) {
    throw new Error(`DeepL quota too low for this run. Remaining ${remainingChars}, required ${totalRequestedChars}.`);
  }

  for (const target of activeTargets) {
    console.log(`\n=== ${target.id} ===`);

    for (const { item, flat } of estimation) {
      const targetPath = item.targetPathFactory(target.id);
      const sourceClone = JSON.parse(JSON.stringify(readJson(item.sourcePath)));
      const existing = fs.existsSync(targetPath) ? readJson(targetPath) : {};
      const output = deepMerge(sourceClone, existing);

      if (output.common?.localeCode) {
        output.common.localeCode = target.localeCode;
      }

      const keysToTranslate = Object.keys(flat).filter((key) => {
        const sourceValue = flat[key];
        const existingValue = getDeep(existing, key);
        if (forceMode) return true;
        return !(typeof existingValue === 'string' && existingValue && existingValue !== sourceValue);
      });

      if (!keysToTranslate.length) {
        writeJson(targetPath, output);
        console.log(`skip ${item.fileName}`);
        continue;
      }

      console.log(`translate ${item.fileName}: ${keysToTranslate.length} keys`);
      for (let index = 0; index < keysToTranslate.length; index += BATCH_SIZE) {
        const batchKeys = keysToTranslate.slice(index, index + BATCH_SIZE);
        const batchPayload = batchKeys.map((key) => protectText(flat[key]));
        const translated = await translateBatchWithRetry(
          batchPayload.map((entry) => entry.protectedText),
          target.deepl,
        );

        translated.forEach((text, offset) => {
          const restored = restoreText(text, batchPayload[offset].placeholders);
          setDeep(output, batchKeys[offset], restored);
        });
        writeJson(targetPath, output);
        if (index + BATCH_SIZE < keysToTranslate.length) {
          await sleep(BATCH_DELAY_MS);
        }
      }
    }
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
