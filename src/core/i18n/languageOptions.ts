export type LanguageAvailability = 'full' | 'limited';

export interface LanguageOption {
  id: string;
  native: string;
  label: string;
  availability: LanguageAvailability;
  note?: string;
  rtl?: boolean;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: 'pl',
    native: 'Polski',
    label: 'Polski',
    availability: 'full',
    note: 'Pełne wsparcie w całym sanktuarium.',
  },
  {
    id: 'en',
    native: 'English',
    label: 'Angielski',
    availability: 'full',
    note: 'Full support across the entire sanctuary.',
  },
  {
    id: 'es',
    native: 'Español',
    label: 'Hiszpański',
    availability: 'full',
    note: 'Soporte completo en todo el santuario.',
  },
  {
    id: 'pt',
    native: 'Português',
    label: 'Portugalski',
    availability: 'full',
    note: 'Suporte completo em todo o santuário.',
  },
  {
    id: 'de',
    native: 'Deutsch',
    label: 'Niemiecki',
    availability: 'full',
    note: 'Vollständige Unterstützung im gesamten Heiligtum.',
  },
  {
    id: 'fr',
    native: 'Français',
    label: 'Francuski',
    availability: 'full',
    note: 'Support complet dans tout le sanctuaire.',
  },
  {
    id: 'it',
    native: 'Italiano',
    label: 'Włoski',
    availability: 'full',
    note: 'Supporto completo in tutto il santuario.',
  },
  {
    id: 'ru',
    native: 'Русский',
    label: 'Rosyjski',
    availability: 'full',
    note: 'Полная поддержка во всём святилище.',
  },
  {
    id: 'ar',
    native: 'العربية',
    label: 'Arabski',
    availability: 'full',
    note: 'دعم كامل في جميع أنحاء الملاذ.',
    rtl: true,
  },
  {
    id: 'ja',
    native: '日本語',
    label: 'Japoński',
    availability: 'full',
    note: '聖域全体で完全サポート。',
  },
  {
    id: 'zh',
    native: '中文',
    label: 'Chiński',
    availability: 'limited',
    note: 'Obsługa dodana. Pełne zasoby chińskie zostaną dopełnione po następnym przebiegu tłumaczeń.',
  },
];

export const FULLY_SUPPORTED_LANGUAGE_IDS = LANGUAGE_OPTIONS
  .filter((option) => option.availability === 'full')
  .map((option) => option.id);

export const isFullySupportedLanguage = (language: string) =>
  FULLY_SUPPORTED_LANGUAGE_IDS.includes(language);

export const isRTLLanguage = (language: string) =>
  LANGUAGE_OPTIONS.find(l => l.id === language)?.rtl === true;
