import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import plData from './pl.json';
import enData from './en.json';
import esData from './es.json';
import ptData from './pt.json';
import deData from './de.json';
import frData from './fr.json';
import itData from './it.json';
import ruData from './ru.json';
import arData from './ar.json';
import jaData from './ja.json';
import zhData from './zh.json';
import plExtraData from './pl-data.json';
import enExtraData from './en-data.json';
import plTarotData from './pl-tarot.json';
import enTarotData from './en-tarot.json';
import plContentData from './pl-content.json';
import enContentData from './en-content.json';
// masterFlat files are NOT statically imported — they are lazy-loaded per language
// via namespaceLoaders below. Static imports blocked the JS thread for 2-3s at startup
// (unflatten+deepMerge of 12k+ keys runs synchronously). Lazy loading is non-blocking.

type JsonRecord = Record<string, unknown>;
type NamespaceLoader = () => Promise<Record<string, unknown>>;
type SupportedLanguage = 'pl' | 'en' | 'es' | 'pt' | 'de' | 'fr' | 'it' | 'ru' | 'ar' | 'ja' | 'zh';

const isPlainObject = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const unflatten = (input: Record<string, unknown>) => {
  const output: JsonRecord = {};

  Object.entries(input || {}).forEach(([flatKey, value]) => {
    const segments = flatKey.split('.');
    let cursor: JsonRecord = output;

    segments.forEach((segment, index) => {
      const isLeaf = index === segments.length - 1;
      if (isLeaf) {
        cursor[segment] = value;
        return;
      }

      if (!isPlainObject(cursor[segment])) {
        cursor[segment] = {};
      }

      cursor = cursor[segment] as JsonRecord;
    });
  });

  return output;
};

const deepMerge = <T extends JsonRecord>(base: T, ...sources: JsonRecord[]): T => {
  const output: JsonRecord = { ...base };

  sources.forEach((source) => {
    Object.entries(source).forEach(([key, value]) => {
      const existing = output[key];
      if (isPlainObject(existing) && isPlainObject(value)) {
        output[key] = deepMerge(existing, value);
      } else {
        output[key] = value;
      }
    });
  });

  return output as T;
};

// Base translations only — masterFlat loaded lazily via namespaceLoaders (non-blocking)
const plTranslation = deepMerge(plData as JsonRecord, plExtraData as JsonRecord, plTarotData as JsonRecord, plContentData as JsonRecord);
const enTranslation = deepMerge(enData as JsonRecord, enExtraData as JsonRecord, enTarotData as JsonRecord, enContentData as JsonRecord);

// Other languages use English tarot data as fallback (card names, meanings)
// so tarot.cards.major.X.name etc. always resolve to at least English instead of raw keys
const withTarotFallback = (data: JsonRecord) =>
  deepMerge(enTarotData as JsonRecord, data);

const legacyResources = {
  pl: { translation: plTranslation },
  en: { translation: enTranslation },
  es: { translation: withTarotFallback(esData as JsonRecord) },
  pt: { translation: withTarotFallback(ptData as JsonRecord) },
  de: { translation: withTarotFallback(deData as JsonRecord) },
  fr: { translation: withTarotFallback(frData as JsonRecord) },
  it: { translation: withTarotFallback(itData as JsonRecord) },
  ru: { translation: withTarotFallback(ruData as JsonRecord) },
  ar: { translation: withTarotFallback(arData as JsonRecord) },
  ja: { translation: withTarotFallback(jaData as JsonRecord) },
  zh: { translation: withTarotFallback(zhData as JsonRecord) },
};

const namespaceLoaders: Record<SupportedLanguage, Record<string, NamespaceLoader>> = {
  pl: {
    common: async () => require('../../locales/pl/common.json'),
    matrix: async () => require('../../locales/pl/matrix.json'),
    dreams: async () => require('../../locales/pl/dreams.json'),
    angelNumbers: async () => require('../../locales/pl/angelNumbers.json'),
    meditation: async () => require('../../locales/pl/meditation.json'),
    journeys: async () => require('../../locales/pl/journeys.json'),
    masterFlat: async () => { try { return require('../../locales/pl/_master.flat.json'); } catch { return {}; } },
  },
  en: {
    common: async () => require('../../locales/en/common.json'),
    matrix: async () => require('../../locales/en/matrix.json'),
    dreams: async () => require('../../locales/en/dreams.json'),
    angelNumbers: async () => require('../../locales/en/angelNumbers.json'),
    meditation: async () => require('../../locales/en/meditation.json'),
    journeys: async () => require('../../locales/en/journeys.json'),
    masterFlat: async () => { try { return require('../../locales/en/_master.flat.json'); } catch { return {}; } },
  },
  es: {
    common: async () => require('../../locales/es/common.json'),
    matrix: async () => require('../../locales/es/matrix.json'),
    dreams: async () => require('../../locales/es/dreams.json'),
    angelNumbers: async () => require('../../locales/es/angelNumbers.json'),
    meditation: async () => require('../../locales/es/meditation.json'),
    journeys: async () => require('../../locales/es/journeys.json'),
    masterFlat: async () => { try { return require('../../locales/es/_master.flat.json'); } catch { return {}; } },
  },
  pt: {
    common: async () => require('../../locales/pt/common.json'),
    matrix: async () => require('../../locales/pt/matrix.json'),
    dreams: async () => require('../../locales/pt/dreams.json'),
    angelNumbers: async () => require('../../locales/pt/angelNumbers.json'),
    meditation: async () => require('../../locales/pt/meditation.json'),
    journeys: async () => require('../../locales/pt/journeys.json'),
    masterFlat: async () => { try { return require('../../locales/pt/_master.flat.json'); } catch { return {}; } },
  },
  de: {
    common: async () => require('../../locales/de/common.json'),
    matrix: async () => require('../../locales/de/matrix.json'),
    dreams: async () => require('../../locales/de/dreams.json'),
    angelNumbers: async () => require('../../locales/de/angelNumbers.json'),
    meditation: async () => require('../../locales/de/meditation.json'),
    journeys: async () => require('../../locales/de/journeys.json'),
    masterFlat: async () => { try { return require('../../locales/de/_master.flat.json'); } catch { return {}; } },
  },
  fr: {
    common: async () => require('../../locales/fr/common.json'),
    matrix: async () => require('../../locales/fr/matrix.json'),
    dreams: async () => require('../../locales/fr/dreams.json'),
    angelNumbers: async () => require('../../locales/fr/angelNumbers.json'),
    meditation: async () => require('../../locales/fr/meditation.json'),
    journeys: async () => require('../../locales/fr/journeys.json'),
    masterFlat: async () => { try { return require('../../locales/fr/_master.flat.json'); } catch { return {}; } },
  },
  it: {
    common: async () => require('../../locales/it/common.json'),
    matrix: async () => require('../../locales/it/matrix.json'),
    dreams: async () => require('../../locales/it/dreams.json'),
    angelNumbers: async () => require('../../locales/it/angelNumbers.json'),
    meditation: async () => require('../../locales/it/meditation.json'),
    journeys: async () => require('../../locales/it/journeys.json'),
    masterFlat: async () => { try { return require('../../locales/it/_master.flat.json'); } catch { return {}; } },
  },
  ru: {
    common: async () => require('../../locales/ru/common.json'),
    matrix: async () => require('../../locales/ru/matrix.json'),
    dreams: async () => require('../../locales/ru/dreams.json'),
    angelNumbers: async () => require('../../locales/ru/angelNumbers.json'),
    meditation: async () => require('../../locales/ru/meditation.json'),
    journeys: async () => require('../../locales/ru/journeys.json'),
    masterFlat: async () => { try { return require('../../locales/ru/_master.flat.json'); } catch { return {}; } },
  },
  ar: {
    common: async () => require('../../locales/ar/common.json'),
    matrix: async () => require('../../locales/ar/matrix.json'),
    dreams: async () => require('../../locales/ar/dreams.json'),
    angelNumbers: async () => require('../../locales/ar/angelNumbers.json'),
    meditation: async () => require('../../locales/ar/meditation.json'),
    journeys: async () => require('../../locales/ar/journeys.json'),
    masterFlat: async () => { try { return require('../../locales/ar/_master.flat.json'); } catch { return {}; } },
  },
  ja: {
    common: async () => require('../../locales/ja/common.json'),
    matrix: async () => require('../../locales/ja/matrix.json'),
    dreams: async () => require('../../locales/ja/dreams.json'),
    angelNumbers: async () => require('../../locales/ja/angelNumbers.json'),
    meditation: async () => require('../../locales/ja/meditation.json'),
    journeys: async () => require('../../locales/ja/journeys.json'),
    masterFlat: async () => { try { return require('../../locales/ja/_master.flat.json'); } catch { return {}; } },
  },
  zh: {
    common: async () => require('../../locales/zh/common.json'),
    matrix: async () => require('../../locales/zh/matrix.json'),
    dreams: async () => require('../../locales/zh/dreams.json'),
    angelNumbers: async () => require('../../locales/zh/angelNumbers.json'),
    meditation: async () => require('../../locales/zh/meditation.json'),
    journeys: async () => require('../../locales/zh/journeys.json'),
    masterFlat: async () => { try { return require('../../locales/zh/_master.flat.json'); } catch { return {}; } },
  },
};

const namespaceBackend = {
  type: 'backend' as const,
  init: () => undefined,
  read: async (language: string, namespace: string, callback: (error: unknown, data: unknown) => void) => {
    try {
      const normalizedLanguage = language.split('-')[0] as SupportedLanguage;
      const loader = namespaceLoaders[normalizedLanguage]?.[namespace];
      if (!loader) {
        callback(null, {});
        return;
      }

      const payload = await loader();
      callback(null, payload);
    } catch (error) {
      callback(error, {});
    }
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(namespaceBackend)
    .use(initReactI18next)
    .init({
      resources: legacyResources,
      lng: 'pl',
      fallbackLng: ['en', 'pl'],
      supportedLngs: ['pl', 'en', 'es', 'pt', 'de', 'fr', 'it', 'ru', 'ar', 'ja', 'zh'],
      ns: ['translation', 'common'],
      defaultNS: 'translation',
      fallbackNS: 'translation',
      partialBundledLanguages: true,
      returnNull: false,
      returnEmptyString: false,
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
}

// Pre-load masterFlat for current language on startup
if (i18n.isInitialized) {
  void i18n.loadNamespaces('masterFlat');
}

export default i18n;
