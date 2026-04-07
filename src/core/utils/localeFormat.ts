import i18n from '../i18n';

export const isEnglishLocale = () => i18n.language?.startsWith('en');

const LOCALE_MAP: Record<string, string> = {
  pl: 'pl-PL', en: 'en-US', de: 'de-DE', es: 'es-ES',
  fr: 'fr-FR', it: 'it-IT', pt: 'pt-PT', ru: 'ru-RU',
  ar: 'ar-SA', ja: 'ja-JP', zh: 'zh-CN',
};

export const getLocaleCode = () => {
  const lang = i18n.language?.slice(0, 2) || 'pl';
  return LOCALE_MAP[lang] || 'pl-PL';
};

export const formatLocaleDate = (value: string | number | Date) =>
  new Date(value).toLocaleDateString(getLocaleCode());

// Hermes-safe number formatter — toLocaleString(locale) crashes on Hermes
export const formatLocaleNumber = (value: number): string => {
  const n = Math.floor(Number(value));
  if (isNaN(n)) return '0';
  const lang = i18n.language?.slice(0, 2) || 'pl';
  const sep = lang === 'en' ? ',' : '\u00A0';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
};
