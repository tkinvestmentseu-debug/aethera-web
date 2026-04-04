import i18n from '../i18n';

export const isEnglishLocale = () => i18n.language?.startsWith('en');

export const getLocaleCode = () => (isEnglishLocale() ? 'en-US' : 'pl-PL');

export const formatLocaleDate = (value: string | number | Date) =>
  new Date(value).toLocaleDateString(getLocaleCode());

export const formatLocaleNumber = (value: number) =>
  Number(value).toLocaleString(getLocaleCode());
