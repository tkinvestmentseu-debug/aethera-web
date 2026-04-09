#!/usr/bin/env node
'use strict';

/**
 * translate-missing.cjs
 *
 * Reads the scan-report.json produced by scan-hardcoded-pl.cjs,
 * then for every string whose status === 'missing':
 *   1. Adds it to src/locales/pl/_master.flat.json with its suggestedKey.
 *   2. Translates it to 10 target languages using the OpenAI gpt-4o-mini API
 *      (batched in groups of 20, crash-safe incremental saves).
 *   3. Writes each language result to src/locales/{lang}/_master.flat.json.
 *
 * Usage:
 *   node scripts/i18n/translate-missing.cjs
 *   node scripts/i18n/translate-missing.cjs --dry-run      # no API calls
 *   node scripts/i18n/translate-missing.cjs --lang=en,de   # only those langs
 *   node scripts/i18n/translate-missing.cjs --force        # re-translate even
 *                                                           # already-translated
 */

const fs   = require('fs');
const path = require('path');

// ─── Paths ────────────────────────────────────────────────────────────────────

const ROOT       = path.resolve(__dirname, '..', '..');
const TOOLS_DIR  = path.join(ROOT, 'tools', 'i18n-resources');
const LOCALES    = path.join(ROOT, 'src', 'locales');

const SCAN_REPORT = path.join(TOOLS_DIR, 'scan-report.json');
const PROGRESS    = path.join(TOOLS_DIR, 'translate-missing-progress.json');

// ─── Env loading ──────────────────────────────────────────────────────────────

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const raw of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(path.join(ROOT, '.env'));
loadEnv(path.join(ROOT, 'api-keys', '.env'));

// ─── CLI args ─────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const DRY_RUN    = argv.includes('--dry-run');
const FORCE_MODE = argv.includes('--force');
const LANG_FILTER = (argv.find((a) => a.startsWith('--lang=')) || '').replace('--lang=', '');

// ─── Config ───────────────────────────────────────────────────────────────────

const OPENAI_KEY =
  process.env.OPENAI_API_KEY ||
  process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
  '';

const MODEL      = 'gpt-4o-mini';
const BATCH_SIZE = 20;
const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 1500;

const TARGETS = [
  { id: 'en', name: 'English'            },
  { id: 'de', name: 'German'             },
  { id: 'es', name: 'Spanish'            },
  { id: 'pt', name: 'Portuguese'         },
  { id: 'fr', name: 'French'             },
  { id: 'it', name: 'Italian'            },
  { id: 'ru', name: 'Russian'            },
  { id: 'ar', name: 'Arabic'             },
  { id: 'ja', name: 'Japanese'           },
  { id: 'zh', name: 'Chinese Simplified' },
];

const activeTargets = LANG_FILTER
  ? TARGETS.filter((t) => LANG_FILTER.split(',').map((v) => v.trim()).includes(t.id))
  : TARGETS;

// ─── JSON helpers ─────────────────────────────────────────────────────────────

const stripBom = (s) => s.replace(/^\uFEFF/, '');

function readJson(filePath) {
  try {
    return JSON.parse(stripBom(fs.readFileSync(filePath, 'utf8')));
  } catch {
    return null;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function safeReadFlat(lang) {
  const p = path.join(LOCALES, lang, '_master.flat.json');
  return readJson(p) || {};
}

function writeFlat(lang, data) {
  const p = path.join(LOCALES, lang, '_master.flat.json');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  // Sort keys alphabetically for deterministic diffs
  const sorted = Object.fromEntries(
    Object.entries(data).sort(([a], [b]) => a.localeCompare(b))
  );
  fs.writeFileSync(p, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
}

// ─── Progress (crash-safe) ───────────────────────────────────────────────────

/**
 * Progress file structure:
 * {
 *   "en": { "some.key": "translated value", ... },
 *   "de": { ... },
 *   ...
 * }
 */

function loadProgress() {
  return readJson(PROGRESS) || {};
}

function saveProgress(progress) {
  writeJson(PROGRESS, progress);
}

// ─── OpenAI call ─────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends a batch of Polish strings to OpenAI for translation into targetLang.
 * Returns a mapping { polishText: translatedText }.
 *
 * The system prompt instructs the model to return ONLY a JSON object.
 */
async function translateBatchOpenAI(polishTexts, targetLang) {
  const langName = TARGETS.find((t) => t.id === targetLang)?.name || targetLang;

  const systemPrompt =
    `You are a professional translator for a spiritual wellness app called Aethera. ` +
    `Translate the Polish spiritual/wellness text to ${langName}. ` +
    `Keep the mystical, warm, introspective tone. ` +
    `Return ONLY a JSON object where each key is the exact Polish source text ` +
    `and each value is the ${langName} translation. ` +
    `Do not add any explanation, markdown, or wrapping — just the raw JSON object.`;

  const userContent = JSON.stringify(polishTexts);

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.2,
          max_tokens: 4096,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content:
                `Translate these ${polishTexts.length} strings from Polish to ${langName}.\n` +
                `Input array (translate each item): ${userContent}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        const err = new Error(`OpenAI ${response.status}: ${errBody.slice(0, 200)}`);
        err.status = response.status;
        throw err;
      }

      const payload = await response.json();
      const raw = payload.choices?.[0]?.message?.content?.trim() || '';

      // Strip possible markdown code fences
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Sometimes the model returns an array instead of an object
        // Attempt to pair by index
        try {
          const arr = JSON.parse(cleaned);
          if (Array.isArray(arr) && arr.length === polishTexts.length) {
            parsed = {};
            polishTexts.forEach((src, i) => { parsed[src] = arr[i]; });
          } else {
            throw new Error('Unexpected response shape');
          }
        } catch {
          throw new Error(`Could not parse OpenAI response JSON: ${raw.slice(0, 300)}`);
        }
      }

      return parsed;
    } catch (err) {
      lastError = err;
      const isRateLimit = err.status === 429 || err.status === 503;
      const wait = isRateLimit ? RETRY_DELAY_MS * attempt * 3 : RETRY_DELAY_MS * attempt;
      console.warn(
        `  [OpenAI] Attempt ${attempt}/${MAX_RETRIES} failed (${err.message}). ` +
        `Retrying in ${Math.round(wait / 1000)}s …`
      );
      await sleep(wait);
    }
  }

  throw lastError;
}

// ─── Key collision resolver ───────────────────────────────────────────────────

/**
 * If suggestedKey already exists in the flat file with a different value,
 * append a numeric suffix until we find a free slot.
 */
function resolveKey(flat, suggestedKey, value) {
  if (!(suggestedKey in flat)) return suggestedKey;
  if (flat[suggestedKey] === value) return suggestedKey; // exact duplicate — reuse
  let n = 2;
  while (`${suggestedKey}_${n}` in flat && flat[`${suggestedKey}_${n}`] !== value) {
    n += 1;
  }
  return `${suggestedKey}_${n}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── 0. Validate inputs ────────────────────────────────────────────────────
  if (!fs.existsSync(SCAN_REPORT)) {
    console.error(
      `[translate-missing] ERROR: scan-report.json not found at:\n  ${SCAN_REPORT}\n` +
      `Run  node scripts/i18n/scan-hardcoded-pl.cjs  first.`
    );
    process.exit(1);
  }

  if (!DRY_RUN && !OPENAI_KEY) {
    console.error(
      '[translate-missing] ERROR: No OpenAI API key found.\n' +
      'Set OPENAI_API_KEY or EXPO_PUBLIC_OPENAI_API_KEY in .env'
    );
    process.exit(1);
  }

  // ── 1. Load scan report ───────────────────────────────────────────────────
  console.log('[translate-missing] Loading scan-report.json …');
  const report = readJson(SCAN_REPORT);
  if (!report || !Array.isArray(report.entries)) {
    console.error('[translate-missing] ERROR: scan-report.json is malformed.');
    process.exit(1);
  }

  // ── 2. Filter to missing-only, deduplicate by string value ────────────────
  const allMissing = report.entries.filter((e) => e.status === 'missing');

  // Build a deduplicated map: polishText → suggestedKey (first occurrence wins)
  const missingMap = new Map(); // polishText → suggestedKey
  for (const entry of allMissing) {
    if (!missingMap.has(entry.string)) {
      missingMap.set(entry.string, entry.suggestedKey);
    }
  }

  console.log(`[translate-missing] Missing strings (unique): ${missingMap.size}`);
  console.log(`[translate-missing] Total report entries   : ${report.entries.length}`);

  if (missingMap.size === 0) {
    console.log('[translate-missing] Nothing to do — all strings are already in i18n.');
    return;
  }

  // ── 3. Update pl/_master.flat.json ───────────────────────────────────────
  console.log('[translate-missing] Updating pl/_master.flat.json …');
  const plFlat = safeReadFlat('pl');
  let plAdded = 0;

  // We need a canonical key→polishText mapping for the rest of the script
  const canonicalKeys = new Map(); // polishText → resolvedKey

  for (const [polishText, suggestedKey] of missingMap) {
    const resolvedKey = resolveKey(plFlat, suggestedKey, polishText);
    canonicalKeys.set(polishText, resolvedKey);
    if (!(resolvedKey in plFlat)) {
      plFlat[resolvedKey] = polishText;
      plAdded += 1;
    }
  }

  if (!DRY_RUN) {
    writeFlat('pl', plFlat);
    console.log(`[translate-missing] ✓ pl/_master.flat.json (+${plAdded} new keys)`);
  } else {
    console.log(`[translate-missing] [dry-run] Would add ${plAdded} keys to pl/_master.flat.json`);
  }

  // ── 4. Load crash-safe progress ──────────────────────────────────────────
  const progress = loadProgress();

  // ── 5. Translate per language ─────────────────────────────────────────────
  const polishTexts = [...missingMap.keys()];
  const batches = [];
  for (let i = 0; i < polishTexts.length; i += BATCH_SIZE) {
    batches.push(polishTexts.slice(i, i + BATCH_SIZE));
  }

  console.log(
    `[translate-missing] ${polishTexts.length} strings → ` +
    `${batches.length} batches × ${BATCH_SIZE} — targeting ${activeTargets.length} languages`
  );

  for (const target of activeTargets) {
    const langFlat = safeReadFlat(target.id);
    const langProgress = progress[target.id] || {};
    let langAdded = 0;

    console.log(`\n[translate-missing] ── Language: ${target.id} (${target.name})`);

    for (let bIdx = 0; bIdx < batches.length; bIdx++) {
      const batch = batches[bIdx];

      // Filter out already-translated items unless --force
      const toTranslate = FORCE_MODE
        ? batch
        : batch.filter((text) => !(text in langProgress));

      if (toTranslate.length === 0) {
        process.stdout.write(
          `\r  Batch ${bIdx + 1}/${batches.length} — all already translated, skipping.`
        );
        continue;
      }

      process.stdout.write(
        `\r  Batch ${bIdx + 1}/${batches.length} — translating ${toTranslate.length} strings …`
      );

      if (DRY_RUN) {
        // Simulate translations so we can still test the rest of the pipeline
        toTranslate.forEach((text) => {
          langProgress[text] = `[${target.id}] ${text}`;
        });
        process.stdout.write(' [dry-run]\n');
        continue;
      }

      try {
        const translated = await translateBatchOpenAI(toTranslate, target.id);

        // Merge into progress
        for (const srcText of toTranslate) {
          const result = translated[srcText] || translated[srcText.trim()];
          if (result) {
            langProgress[srcText] = result;
          } else {
            // Fallback: use Polish text if model didn't return this key
            console.warn(`\n  [warn] No translation returned for: "${srcText.slice(0, 60)}"`);
            langProgress[srcText] = srcText;
          }
        }

        // Crash-safe: save progress after every batch
        progress[target.id] = langProgress;
        saveProgress(progress);
        process.stdout.write(` ✓\n`);
      } catch (err) {
        console.error(`\n  [translate-missing] FATAL batch error for ${target.id}: ${err.message}`);
        console.error('  Progress saved. Re-run to continue.');
        progress[target.id] = langProgress;
        saveProgress(progress);
        // Don't exit — continue with next language
        break;
      }
    }

    process.stdout.write('\n');

    // ── Write to language flat file ────────────────────────────────────────
    for (const polishText of polishTexts) {
      const resolvedKey = canonicalKeys.get(polishText);
      if (!resolvedKey) continue;

      const translation = langProgress[polishText];
      if (!translation) continue;

      const finalKey = resolveKey(langFlat, resolvedKey, translation);
      if (!(finalKey in langFlat) || FORCE_MODE) {
        langFlat[finalKey] = translation;
        langAdded += 1;
      }
    }

    if (!DRY_RUN) {
      writeFlat(target.id, langFlat);
      console.log(`  ✓ ${target.id}/_master.flat.json (+${langAdded} entries)`);
    } else {
      console.log(`  [dry-run] Would add ${langAdded} entries to ${target.id}/_master.flat.json`);
    }
  }

  // ── 6. Final progress flush ───────────────────────────────────────────────
  if (!DRY_RUN) {
    saveProgress(progress);
  }

  // ── 7. Summary ────────────────────────────────────────────────────────────
  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log('  translate-missing — DONE');
  console.log(`  Unique Polish strings processed: ${missingMap.size}`);
  console.log(`  Languages targeted             : ${activeTargets.map((t) => t.id).join(', ')}`);
  if (DRY_RUN) console.log('  Mode: DRY RUN (no files written, no API calls)');
  console.log(`  Progress cache: ${PROGRESS}`);
  console.log('══════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('[translate-missing] Unhandled error:', err);
  process.exit(1);
});
