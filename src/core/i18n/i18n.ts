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
import plExtraData from './pl-data.json';
import enExtraData from './en-data.json';
import plTarotData from './pl-tarot.json';
import enTarotData from './en-tarot.json';
import plContentData from './pl-content.json';
import enContentData from './en-content.json';

type JsonRecord = Record<string, unknown>;
type NamespaceLoader = () => Promise<Record<string, unknown>>;

const isPlainObject = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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

const plTranslation = deepMerge(
  plData as JsonRecord,
  plExtraData as JsonRecord,
  plTarotData as JsonRecord,
  plContentData as JsonRecord,
);
const enTranslation = deepMerge(
  enData as JsonRecord,
  enExtraData as JsonRecord,
  enTarotData as JsonRecord,
  enContentData as JsonRecord,
);

const legacyResources = {
  pl: { translation: plTranslation },
  en: { translation: enTranslation },
  es: { translation: esData },
  pt: { translation: ptData },
  de: { translation: deData },
  fr: { translation: frData },
  it: { translation: itData },
  ru: { translation: ruData },
  ar: { translation: arData },
  ja: { translation: jaData },
};

const namespaceLoaders: Record<string, Record<string, NamespaceLoader>> = {
  pl: {
    common: async () => require('../../locales/pl/common.json'),
    matrix: async () => require('../../locales/pl/matrix.json'),
    dreams: async () => require('../../locales/pl/dreams.json'),
    angelNumbers: async () => require('../../locales/pl/angelNumbers.json'),
    meditation: async () => require('../../locales/pl/meditation.json'),
    journeys: async () => require('../../locales/pl/journeys.json'),
  },
  en: {
    common: async () => require('../../locales/en/common.json'),
    matrix: async () => require('../../locales/en/matrix.json'),
    dreams: async () => require('../../locales/en/dreams.json'),
    angelNumbers: async () => require('../../locales/en/angelNumbers.json'),
    meditation: async () => require('../../locales/en/meditation.json'),
    journeys: async () => require('../../locales/en/journeys.json'),
  },
};

const namespaceBackend = {
  type: 'backend' as const,
  init: () => undefined,
  read: async (language: string, namespace: string, callback: (error: unknown, data: unknown) => void) => {
    try {
      const normalizedLanguage = language.split('-')[0];
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
      fallbackLng: 'pl',
      supportedLngs: ['pl', 'en', 'es', 'pt', 'de', 'fr', 'it', 'ru', 'ar', 'ja'],
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

export default i18n;
