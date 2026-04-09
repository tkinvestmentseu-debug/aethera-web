#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  ROOT,
  SRC_I18N,
  SRC_LOCALES,
  loadGlossary,
  loadLanguageBase,
  loadTranslationMemory,
  loadEnvFile,
  readJson,
  writeJson,
} = require('./shared.cjs');

const ROOT_ENV = path.join(ROOT, '.env');
const API_KEYS_ENV = path.join(ROOT, 'api-keys', '.env');
loadEnvFile(ROOT_ENV);
loadEnvFile(API_KEYS_ENV);

const TARGETS = [
  { id: 'en', deepl: 'EN-GB' },
  { id: 'de', deepl: 'DE' },
  { id: 'es', deepl: 'ES' },
  { id: 'pt', deepl: 'PT-PT' },
  { id: 'fr', deepl: 'FR' },
  { id: 'it', deepl: 'IT' },
  { id: 'ru', deepl: 'RU' },
  { id: 'ar', deepl: 'AR' },
  { id: 'ja', deepl: 'JA' },
  { id: 'zh', deepl: 'ZH-HANS' },
];

const PLACEHOLDER_PATTERN = /\{\{[^}]+\}\}/g;
const BATCH_SIZE = 20;
const MAX_RETRIES = 5;
const MASTER_PL = path.join(SRC_LOCALES, 'pl', '_master.flat.json');
const ARGOS_SCRIPT = path.join(ROOT, 'scripts', 'i18n', 'translate_argos.py');

const args = process.argv.slice(2);
const requestedProvider = (args.find((arg) => arg.startsWith('--provider=')) || '').replace('--provider=', '') || 'auto';
const requestedTargets = (args.find((arg) => arg.startsWith('--lang=')) || '').replace('--lang=', '');
const forceMode = args.includes('--force');
const activeTargets = requestedTargets
  ? TARGETS.filter((target) => requestedTargets.split(',').map((v) => v.trim()).includes(target.id))
  : TARGETS;

const DEEPL_API_KEY = process.env.DEEPL_API_KEY || '';
const DEEPL_BASE = DEEPL_API_KEY.endsWith(':fx') ? 'https://api-free.deepl.com/v2' : 'https://api.deepl.com/v2';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

const glossary = loadGlossary();
const translationMemory = loadTranslationMemory();
const languageBase = loadLanguageBase();
const TECHNICAL_KEY_PATTERN = /\.(icon|emoji)$/;

const hasPolishResidue = (text) => {
  const value = String(text || '').toLowerCase();
  if (!value) return false;
  if (languageBase.diacritics.some((char) => value.includes(char))) return true;
  if (languageBase.commonWords.some((word) => new RegExp(`(^|\\W)${word}($|\\W)`, 'i').test(value))) return true;
  return false;
};

const protectText = (text) => {
  const placeholders = [];
  let index = 0;
  const protectedText = String(text).replace(PLACEHOLDER_PATTERN, (match) => {
    const token = `__PH_${index}__`;
    placeholders.push({ token, value: match });
    index += 1;
    return token;
  });
  return { protectedText, placeholders };
};

const restoreText = (text, placeholders) =>
  placeholders.reduce((result, placeholder) => result.split(placeholder.token).join(placeholder.value), text);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getExistingMaster = (lang) => {
  const filePath = path.join(SRC_LOCALES, lang, '_master.flat.json');
  try {
    return readJson(filePath);
  } catch {
    return {};
  }
};

const getExistingPools = (lang) => {
  const pool = {};

  const namespaceDir = path.join(SRC_LOCALES, lang);
  if (fs.existsSync(namespaceDir)) {
    for (const file of fs.readdirSync(namespaceDir).filter((name) => name.endsWith('.json') && !name.startsWith('_master'))) {
      const ns = path.basename(file, '.json');
      const flat = flatten(readJson(path.join(namespaceDir, file)));
      Object.entries(flat).forEach(([key, value]) => {
        pool[`${ns}.${key}`] = value;
      });
    }
  }

  const legacyCandidates = [
    path.join(SRC_I18N, `${lang}.json`),
    path.join(SRC_I18N, `${lang}-data.json`),
    path.join(SRC_I18N, `${lang}-tarot.json`),
    path.join(SRC_I18N, `${lang}-content.json`),
  ];
  for (const filePath of legacyCandidates) {
    if (!fs.existsSync(filePath)) continue;
    Object.assign(pool, flatten(readJson(filePath)));
  }

  return pool;
};

const flatten = (input, prefix = '', output = {}) => {
  if (Array.isArray(input)) {
    input.forEach((item, index) => flatten(item, prefix ? `${prefix}.${index}` : String(index), output));
    return output;
  }
  if (input && typeof input === 'object') {
    Object.entries(input).forEach(([key, value]) => flatten(value, prefix ? `${prefix}.${key}` : key, output));
    return output;
  }
  output[prefix] = input;
  return output;
};

const fetchDeepLUsage = async () => {
  try {
    const response = await fetch(`${DEEPL_BASE}/usage`, {
      headers: { Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}` },
    });
    if (!response.ok) throw new Error(`DeepL usage failed: ${response.status}`);
    return response.json();
  } catch (error) {
    return { character_count: 0, character_limit: 0, error: error.message || String(error) };
  }
};

const translateDeepLBatch = async (texts, target) => {
  const body = new URLSearchParams();
  body.append('source_lang', 'PL');
  body.append('target_lang', target.deepl);
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
    const error = new Error(`DeepL ${response.status}: ${await response.text()}`);
    error.status = response.status;
    throw error;
  }
  const payload = await response.json();
  return payload.translations.map((entry) => entry.text);
};

const translateOpenAIBatch = async (texts, target) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `Translate Polish product UI copy into ${target.id}. Keep placeholders like __PH_0__ unchanged. Return strict JSON array of translated strings in the same order. Tone: premium, spiritual, elegant.`,
        },
        {
          role: 'user',
          content: JSON.stringify(texts),
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!response.ok) {
    const error = new Error(`OpenAI ${response.status}: ${await response.text()}`);
    error.status = response.status;
    throw error;
  }
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed.translations)) throw new Error('OpenAI response missing translations array');
  return parsed.translations;
};

const translateArgosBatch = async (texts, target) => {
  const payload = JSON.stringify({
    source_lang: 'pl',
    target_lang: target.id,
    texts,
  });

  const result = spawnSync('python', [ARGOS_SCRIPT], {
    input: payload,
    encoding: 'utf8',
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
    },
    maxBuffer: 1024 * 1024 * 50,
  });

  if (result.status !== 0) {
    const error = new Error((result.stderr || result.stdout || 'Argos translation failed').trim());
    error.status = result.status;
    throw error;
  }

  const parsed = JSON.parse(result.stdout);
  if (!Array.isArray(parsed.translations)) {
    throw new Error('Argos response missing translations array');
  }
  return parsed.translations;
};

const translateWithRetry = async (provider, texts, target) => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      if (provider === 'deepl') return await translateDeepLBatch(texts, target);
      if (provider === 'argos') return await translateArgosBatch(texts, target);
      if (provider === 'openai') return await translateOpenAIBatch(texts, target);
      throw new Error(`Unsupported provider: ${provider}`);
    } catch (error) {
      if (attempt === MAX_RETRIES || error.status !== 429) throw error;
      await sleep(3000 * (attempt + 1));
    }
  }
  throw new Error('Retry exhaustion');
};

const glossaryTranslate = (source, lang) => {
  for (const term of Object.values(glossary.terms || {})) {
    if (term.translations?.pl === source && term.translations?.[lang]) {
      return term.translations[lang];
    }
  }
  return null;
};

const memoryTranslate = (source, lang) => {
  for (const locales of Object.values(translationMemory.entries || {})) {
    if (locales.pl === source && locales[lang]) return locales[lang];
    if (locales['pl-tarot'] === source && locales[`${lang}-tarot`]) return locales[`${lang}-tarot`];
  }
  return null;
};

async function main() {
  const master = readJson(MASTER_PL);
  const summary = { generatedAt: new Date().toISOString(), provider: requestedProvider, targets: {} };
  const summaryPath = path.join(SRC_LOCALES, '_master-translation-summary.json');

  for (const target of activeTargets) {
    const outputPath = path.join(SRC_LOCALES, target.id, '_master.flat.json');
    const existing = getExistingMaster(target.id);
    const pool = getExistingPools(target.id);
    const output = { ...existing };
    const missing = [];

    Object.entries(master).forEach(([key, source]) => {
      if (TECHNICAL_KEY_PATTERN.test(key)) {
        output[key] = source;
        return;
      }
      if (!forceMode && typeof output[key] === 'string' && output[key]) {
        const currentValue = String(output[key]);
        const shouldRepair =
          currentValue === source ||
          (target.id !== 'pl' && hasPolishResidue(currentValue));
        if (!shouldRepair) return;
      }
      if (!forceMode && typeof pool[key] === 'string' && pool[key] && pool[key] !== source) {
        const poolValue = String(pool[key]);
        if (target.id !== 'pl' && hasPolishResidue(poolValue)) {
          missing.push([key, source]);
          return;
        }
        output[key] = poolValue;
        return;
      }
      const byGlossary = glossaryTranslate(source, target.id);
      if (byGlossary) {
        output[key] = byGlossary;
        return;
      }
      const byMemory = memoryTranslate(source, target.id);
      if (byMemory) {
        output[key] = byMemory;
        return;
      }
      missing.push([key, source]);
    });

    let provider = requestedProvider;
    if (provider === 'auto') {
      provider = DEEPL_API_KEY ? 'deepl' : 'argos';
    }

    if (provider === 'deepl') {
      const usage = await fetchDeepLUsage();
      const remaining = Math.max(0, (usage.character_limit || 0) - (usage.character_count || 0));
      const required = missing.reduce((sum, [, source]) => sum + String(source).length, 0);
      if (usage.error || required > remaining) {
        provider = 'argos';
      }
    }

    let providerError = null;
    if (provider !== 'none') {
      const bySource = new Map();
      for (const [key, source] of missing) {
        if (!bySource.has(source)) bySource.set(source, []);
        bySource.get(source).push(key);
      }
      const sourceEntries = Array.from(bySource.entries());

      const effectiveBatchSize = provider === 'argos' ? 400 : BATCH_SIZE;
      for (let index = 0; index < sourceEntries.length; index += effectiveBatchSize) {
        const batch = sourceEntries.slice(index, index + effectiveBatchSize);
        const protectedBatch = batch.map(([source]) => protectText(source));
        try {
          const translated = await translateWithRetry(provider, protectedBatch.map((entry) => entry.protectedText), target);
          translated.forEach((value, offset) => {
            const restored = restoreText(value, protectedBatch[offset].placeholders);
            const keys = batch[offset][1];
            keys.forEach((key) => {
              output[key] = restored;
            });
          });
          writeJson(outputPath, output);
        } catch (error) {
          providerError = error.message;
          break;
        }
      }
    }

    writeJson(outputPath, output);

    summary.targets[target.id] = {
      total: Object.keys(master).length,
      filled: Object.keys(output).filter((key) => output[key] && output[key] !== master[key]).length,
      missing: Object.keys(master).filter((key) => !output[key] || (!TECHNICAL_KEY_PATTERN.test(key) && output[key] === master[key])).length,
      providerUsed: provider,
      error: providerError,
    };
    writeJson(summaryPath, summary);
    console.log(`${target.id}: filled=${summary.targets[target.id].filled} missing=${summary.targets[target.id].missing} provider=${summary.targets[target.id].providerUsed}`);
  }

  writeJson(summaryPath, summary);
  console.log(`summary=${summaryPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
