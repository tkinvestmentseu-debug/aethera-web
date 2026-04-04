export type WidgetId =
  | 'daily_affirmation'
  | 'moon_phase'
  | 'tarot_card'
  | 'energy'
  | 'streak'
  | 'horoscope'
  | 'journal_prompt'
  | 'archetype'
  | 'numerology'
  | 'ritual'
  | 'daily_crystal'
  | 'chakra_focus'
  | 'breathing_reminder'
  | 'energy_forecast'
  | 'gratitude_streak';

export type PortalWidget = {
  id: WidgetId;
  visible: boolean;
  order: number;
};

export type FavoriteItem = {
  id: string;
  label: string;
  sublabel?: string;
  route: string;
  params?: Record<string, any>;
  icon: string;
  color: string;
  addedAt: string;
};

export type ReminderConfig = {
  id: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  days: number[]; // 0=Nd, 1=Pn, 2=Wt, 3=Śr, 4=Cz, 5=Pt, 6=Sb
  enabled: boolean;
  screen?: string;
  category: 'morning' | 'evening' | 'ritual' | 'affirmation' | 'custom';
};

export const DEFAULT_PORTAL_WIDGETS: PortalWidget[] = [
  { id: 'daily_affirmation', visible: true, order: 0 },
  { id: 'moon_phase', visible: true, order: 1 },
  { id: 'tarot_card', visible: true, order: 2 },
  { id: 'energy', visible: true, order: 3 },
  { id: 'streak', visible: true, order: 4 },
  { id: 'horoscope', visible: true, order: 5 },
  { id: 'journal_prompt', visible: true, order: 6 },
  { id: 'archetype', visible: false, order: 7 },
  { id: 'numerology', visible: false, order: 8 },
  { id: 'ritual', visible: false, order: 9 },
  { id: 'daily_crystal', visible: true, order: 10 },
  { id: 'chakra_focus', visible: true, order: 11 },
  { id: 'breathing_reminder', visible: true, order: 12 },
  { id: 'energy_forecast', visible: true, order: 13 },
  { id: 'gratitude_streak', visible: true, order: 14 },
];

export const WIDGET_META: Record<WidgetId, { label: string; emoji: string; description: string }> = {
  daily_affirmation: { label: 'Afirmacja dnia', emoji: '✨', description: 'Codzienne zdanie prowadzące Twoją wibrację' },
  moon_phase: { label: 'Faza Księżyca', emoji: '🌙', description: 'Aktualna faza i jej energia' },
  tarot_card: { label: 'Karta dnia', emoji: '🃏', description: 'Tarotowy symbol prowadzący Twój dzień' },
  energy: { label: 'Energia dnia', emoji: '⚡', description: 'Wibracja i stan duchowy na dziś' },
  streak: { label: 'Pasmo obecności', emoji: '🔥', description: 'Twoja ciągłość i zaangażowanie' },
  horoscope: { label: 'Horoskop', emoji: '♈', description: 'Dzienny rytm Twojego znaku' },
  journal_prompt: { label: 'Prompt dziennika', emoji: '📖', description: 'Pytanie na dziś do refleksji' },
  archetype: { label: 'Archetyp dnia', emoji: '🏛', description: 'Energia archetypiczna prowadząca ten dzień' },
  numerology: { label: 'Numerologia', emoji: '🔢', description: 'Rok osobisty i wibracja dnia' },
  ritual: { label: 'Rytuał dnia', emoji: '🕯', description: 'Ceremonialny rytm na ten czas' },
  daily_crystal: { label: 'Kryształ dnia', emoji: '💎', description: 'Kamień i jego energia na ten dzień' },
  chakra_focus: { label: 'Czakra dnia', emoji: '🌈', description: 'Aktywna czakra i afirmacja' },
  breathing_reminder: { label: 'Oddech', emoji: '🌬', description: 'Krótkie ćwiczenie oddechowe' },
  energy_forecast: { label: 'Prognoza energii', emoji: '📈', description: '3-dniowy trend energetyczny' },
  gratitude_streak: { label: 'Seria wdzięczności', emoji: '🙏', description: 'Pasmo zapisów wdzięczności' },
};
