import i18n from '../i18n';
import glossary from '../i18n/glossary.aethera.json';
import translationMemory from '../i18n/translation-memory.json';

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

const keyCache = new Map<string, string>();
const literalCache = new Map<string, string>();
const glossaryLookup = new Map<string, { termId: string; locale: string }>();
const memoryLiteralToKey = new Map<string, string>();
const memoryKeyToLocales = new Map<string, Record<string, string>>();

const normalizeLiteral = (value: string) =>
  value
    .replace(/\r\n/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeLiteralLoose = (value: string) => normalizeLiteral(value).toLocaleLowerCase();

const isPlainObject = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const buildReverseLookup = (tree: JsonRecord, target: Map<string, string>) => {
  const visit = (value: unknown, path: string[]) => {
    if (typeof value === 'string') {
      const normalized = normalizeLiteral(value);
      if (normalized && !target.has(normalized)) {
        target.set(normalized, path.join('.'));
      }
      const loose = normalizeLiteralLoose(value);
      if (loose && !target.has(loose)) {
        target.set(loose, path.join('.'));
      }
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
};

const reverseLookup = new Map<string, string>();
Object.keys((i18n.options.resources || {}) as Record<string, unknown>).forEach((language) => {
  const tree = (i18n.getResourceBundle(language, 'translation') || {}) as JsonRecord;
  buildReverseLookup(tree, reverseLookup);
});

Object.entries((glossary as { terms?: Record<string, { translations?: Record<string, string> }> }).terms || {}).forEach(([termId, term]) => {
  Object.entries(term.translations || {}).forEach(([locale, value]) => {
    const exact = normalizeLiteral(value);
    const loose = normalizeLiteralLoose(value);
    if (exact) glossaryLookup.set(exact, { termId, locale });
    if (loose) glossaryLookup.set(loose, { termId, locale });
  });
});

Object.entries((translationMemory as { entries?: Record<string, Record<string, string>> }).entries || {}).forEach(([key, locales]) => {
  memoryKeyToLocales.set(key, locales);
  Object.values(locales).forEach((value) => {
    if (typeof value !== 'string') return;
    const exact = normalizeLiteral(value);
    const loose = normalizeLiteralLoose(value);
    if (exact && !memoryLiteralToKey.has(exact)) memoryLiteralToKey.set(exact, key);
    if (loose && !memoryLiteralToKey.has(loose)) memoryLiteralToKey.set(loose, key);
  });
});

const translateByKey = (key: string) => {
  if (keyCache.has(key)) {
    return keyCache.get(key)!;
  }

  const translated = i18n.t(key, { defaultValue: key });
  keyCache.set(key, translated);
  return translated;
};

const findKeyForLiteral = (value: string) => {
  const normalized = normalizeLiteral(value);
  if (!normalized) {
    return null;
  }

  if (literalCache.has(normalized)) {
    return literalCache.get(normalized) || null;
  }

  const exact = reverseLookup.get(normalized);
  if (exact) {
    literalCache.set(normalized, exact);
    return exact;
  }

  const loose = reverseLookup.get(normalizeLiteralLoose(value));
  if (loose) {
    literalCache.set(normalized, loose);
    return loose;
  }

  const matchedPrefix = Array.from(reverseLookup.entries()).find(([literal, key]) =>
    literal === normalized && RESOLVABLE_PREFIXES.some((prefix) => key.startsWith(prefix))
  );

  const found = matchedPrefix?.[1] || '';
  literalCache.set(normalized, found);
  return found || null;
};

const translateByLiteral = (value: string) => {
  const key = findKeyForLiteral(value);
  if (!key) {
    return value;
  }

  return translateByKey(key);
};

const translateByGlossary = (value: string) => {
  const normalized = normalizeLiteral(value);
  if (!normalized) return value;

  const term = glossaryLookup.get(normalized) || glossaryLookup.get(normalizeLiteralLoose(value));
  if (!term) return value;

  const locale = i18n.language?.split('-')[0] || 'pl';
  const glossaryTerms = (glossary as { terms?: Record<string, { translations?: Record<string, string> }> }).terms || {};
  const translation = glossaryTerms[term.termId]?.translations?.[locale] || glossaryTerms[term.termId]?.translations?.pl;
  return translation || value;
};

const translateByMemory = (value: string) => {
  const normalized = normalizeLiteral(value);
  if (!normalized) return value;

  const key = memoryLiteralToKey.get(normalized) || memoryLiteralToKey.get(normalizeLiteralLoose(value));
  if (!key) return value;

  const locales = memoryKeyToLocales.get(key);
  if (!locales) return value;

  const locale = i18n.language?.split('-')[0] || 'pl';
  return locales[locale] || locales.pl || locales.en || value;
};

const resolveTarotKey = (value: string) => {
  const translated = translateByKey(value);
  if (translated !== value) {
    return translated;
  }

  const normalized = value
    .replace(/^tarot\.cards\.minor\./, 'tarot.cards.')
    .replace(/^tarot\.spreads\.daily_card\./, 'tarot.spreads.daily.');

  return translateByKey(normalized);
};

export const resolveUserFacingText = (value: string) => {
  if (!value) return value;

  if (RESOLVABLE_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    if (value.startsWith('tarot.')) {
      return resolveTarotKey(value);
    }
    return translateByKey(value);
  }

  const glossaryTranslation = translateByGlossary(value);
  if (glossaryTranslation !== value) {
    return glossaryTranslation;
  }

  const memoryTranslation = translateByMemory(value);
  if (memoryTranslation !== value) {
    return memoryTranslation;
  }

  const literalTranslation = translateByLiteral(value);
  if (literalTranslation !== value) {
    return literalTranslation;
  }

  return value;
};

export const resolveTextArray = (values: string[]) => values.map(resolveUserFacingText);
