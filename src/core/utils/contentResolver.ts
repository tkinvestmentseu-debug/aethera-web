import i18n from '../i18n';

// ─── Types ────────────────────────────────────────────────────────────────────
type JsonRecord = Record<string, unknown>;

const RESOLVABLE_PREFIXES = [
  'affirmations.',
  'common.',
  'data.',
  'home.',
  'journal.',
  'nav.',
  'notifications.',
  'onboarding.',
  'oracle.',
  'portal.',
  'profile.',
  'reports.',
  'rituals.',
  'tarot.',
  'tabs.',
] as const;

// ─── Caches (always cheap — just Map instances) ────────────────────────────────
const keyCache = new Map<string, string>();
const literalCache = new Map<string, string>();

// ─── Lookup maps — built LAZILY on first use ──────────────────────────────────
// BEFORE: all maps were built synchronously at module import time → ~500-1000ms startup delay
// NOW: built on first resolveUserFacingText() call → zero startup cost
let mapsReady = false;
const reverseLookup = new Map<string, string>();
const glossaryLookup = new Map<string, { termId: string; locale: string }>();
const memoryLiteralToKey = new Map<string, string>();
const memoryKeyToLocales = new Map<string, Record<string, string>>();
const masterLiteralToKey = new Map<string, string>();

// ─── Normalizers ──────────────────────────────────────────────────────────────
const normalizeLiteral = (value: string) =>
  value.replace(/\r\n/g, '\n').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();

const normalizeLiteralLoose = (value: string) => normalizeLiteral(value).toLocaleLowerCase();

const isPlainObject = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// ─── Lazy map builder ─────────────────────────────────────────────────────────
function buildReverseLookup(tree: JsonRecord, target: Map<string, string>) {
  const visit = (value: unknown, path: string[]) => {
    if (typeof value === 'string') {
      const normalized = normalizeLiteral(value);
      if (normalized && !target.has(normalized)) target.set(normalized, path.join('.'));
      const loose = normalizeLiteralLoose(value);
      if (loose && !target.has(loose)) target.set(loose, path.join('.'));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...path, String(index)]));
      return;
    }
    if (isPlainObject(value)) {
      Object.entries(value).forEach(([key, nested]) => visit(nested, [...path, key]));
    }
  };
  visit(tree, []);
}

function initMaps() {
  if (mapsReady) return;
  mapsReady = true;

  // 1. i18n reverse lookup (only currently loaded language bundles)
  Object.keys((i18n.options.resources || {}) as Record<string, unknown>).forEach((language) => {
    const tree = (i18n.getResourceBundle(language, 'translation') || {}) as JsonRecord;
    buildReverseLookup(tree, reverseLookup);
  });

  // 2. Glossary (loaded only now, not at import time)
  try {
    const glossary = require('../i18n/glossary.aethera.json') as {
      terms?: Record<string, { translations?: Record<string, string> }>;
    };
    Object.entries(glossary.terms || {}).forEach(([termId, term]) => {
      Object.entries(term.translations || {}).forEach(([locale, value]) => {
        const exact = normalizeLiteral(value);
        const loose = normalizeLiteralLoose(value);
        if (exact) glossaryLookup.set(exact, { termId, locale });
        if (loose) glossaryLookup.set(loose, { termId, locale });
      });
    });
  } catch {}

  // 3. Translation memory — NOT bundled (1.9MB, not worth the bundle bloat).
  // memoryLiteralToKey stays empty; translateByMemory() returns value unchanged → graceful.

  // 4. Build reverse lookup from masterFlat namespace (all loaded languages)
  ['pl', 'en', i18n.language?.split('-')[0]].filter(Boolean).forEach((lang) => {
    const flat = i18n.getResourceBundle(lang as string, 'masterFlat') as Record<string, string> | null;
    if (!flat) return;
    Object.entries(flat).forEach(([key, value]) => {
      if (typeof value !== 'string') return;
      const exact = normalizeLiteral(value);
      const loose = normalizeLiteralLoose(value);
      if (exact && !reverseLookup.has(exact)) reverseLookup.set(exact, key);
      if (loose && !reverseLookup.has(loose)) reverseLookup.set(loose, key);
    });
  });
}

// ─── Core translation helpers ─────────────────────────────────────────────────
const translateByKey = (key: string): string => {
  if (keyCache.has(key)) return keyCache.get(key)!;
  const locale = (i18n.language?.split('-')[0] || 'pl') as string;
  // Check masterFlat namespace (lazy-loaded, flat keys, O(1) lookup)
  const flatBundle = i18n.getResourceBundle(locale, 'masterFlat') as Record<string, string> | null;
  if (flatBundle?.[key]) { keyCache.set(key, flatBundle[key]); return flatBundle[key]; }
  const plFlat = i18n.getResourceBundle('pl', 'masterFlat') as Record<string, string> | null;
  if (plFlat?.[key]) { keyCache.set(key, plFlat[key]); return plFlat[key]; }
  const translated = i18n.t(key, { defaultValue: '' });
  const result = (translated && translated !== key) ? translated : key;
  keyCache.set(key, result);
  return result;
};

const findKeyForLiteral = (value: string): string | null => {
  const normalized = normalizeLiteral(value);
  if (!normalized) return null;

  if (literalCache.has(normalized)) return literalCache.get(normalized) || null;

  initMaps();

  const exact = reverseLookup.get(normalized);
  if (exact) { literalCache.set(normalized, exact); return exact; }

  const loose = reverseLookup.get(normalizeLiteralLoose(value));
  if (loose) { literalCache.set(normalized, loose); return loose; }

  const masterExact = masterLiteralToKey.get(normalized);
  if (masterExact) { literalCache.set(normalized, masterExact); return masterExact; }

  const masterLoose = masterLiteralToKey.get(normalizeLiteralLoose(value));
  if (masterLoose) { literalCache.set(normalized, masterLoose); return masterLoose; }

  // Avoid expensive Array.from().find() hot path — skip if no prefix match
  const found = '';
  literalCache.set(normalized, found);
  return null;
};

const translateByGlossary = (value: string): string => {
  initMaps();
  const normalized = normalizeLiteral(value);
  if (!normalized) return value;

  const term = glossaryLookup.get(normalized) || glossaryLookup.get(normalizeLiteralLoose(value));
  if (!term) return value;

  const locale = i18n.language?.split('-')[0] || 'pl';
  try {
    const glossary = require('../i18n/glossary.aethera.json') as {
      terms?: Record<string, { translations?: Record<string, string> }>;
    };
    const translation =
      glossary.terms?.[term.termId]?.translations?.[locale] ||
      glossary.terms?.[term.termId]?.translations?.pl;
    return translation || value;
  } catch {
    return value;
  }
};

const translateByMemory = (value: string): string => {
  initMaps();
  const normalized = normalizeLiteral(value);
  if (!normalized) return value;

  const key = memoryLiteralToKey.get(normalized) || memoryLiteralToKey.get(normalizeLiteralLoose(value));
  if (!key) return value;

  const locales = memoryKeyToLocales.get(key);
  if (!locales) return value;

  const locale = i18n.language?.split('-')[0] || 'pl';
  return locales[locale] || locales.pl || locales.en || value;
};

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const resolveTarotKey = (value: string): string => {
  const candidates = unique([
    value,
    value.replace(/^tarot\./, ''),
    value.replace(/^tarot\.cards\./, 'cards.'),
    value.replace(/^tarot\.spreads\./, 'spreads.'),
    value.replace(/^tarot\.spreads\.daily_card\./, 'spreads.daily.'),
    value.replace(/^tarot\.spreads\.past_present_future\./, 'spreads.three_cards.'),
    value.replace(/^tarot\.cards\.minor\./, 'cards.'),
  ]);

  for (const candidate of candidates) {
    const translated = translateByKey(candidate);
    if (translated !== candidate) return translated;
  }
  return value;
};

// ─── Public API ───────────────────────────────────────────────────────────────
export const resolveUserFacingText = (value: string): string => {
  if (!value) return value;

  // Fast path: i18n key prefix — direct lookup, no map building needed for keyCache hits
  if (RESOLVABLE_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    if (value.startsWith('tarot.')) return resolveTarotKey(value);
    return translateByKey(value);
  }

  // Slow path: literal string matching — triggers lazy map init on first call
  const glossaryTranslation = translateByGlossary(value);
  if (glossaryTranslation !== value) return glossaryTranslation;

  const memoryTranslation = translateByMemory(value);
  if (memoryTranslation !== value) return memoryTranslation;

  const key = findKeyForLiteral(value);
  if (key) return translateByKey(key);

  return value;
};

export const resolveTextArray = (values: string[]) => values.map(resolveUserFacingText);

export const resetTranslationCaches = () => {
  mapsReady = false;
  keyCache.clear();
  literalCache.clear();
  reverseLookup.clear();
  glossaryLookup.clear();
  memoryLiteralToKey.clear();
  memoryKeyToLocales.clear();
};

// Reset caches when language changes so reverse lookup rebuilds for new language
i18n.on('languageChanged', () => {
  resetTranslationCaches();
  void i18n.loadNamespaces('masterFlat');
});

// Reset caches when masterFlat finishes loading (first app launch)
// so translateByKey / reverseLookup use the freshly loaded namespace
i18n.on('loaded', (loaded: Record<string, Record<string, boolean>>) => {
  const hasMasterFlat = Object.values(loaded).some((ns) => ns?.masterFlat);
  if (hasMasterFlat) {
    resetTranslationCaches();
  }
});
