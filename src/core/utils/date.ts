// src/core/utils/date.ts
import { format, Locale } from 'date-fns';
import { pl, enUS, es, pt, de, fr, it, uk, arDZ } from 'date-fns/locale';

const locales: Record<string, Locale> = {
  pl, en: enUS, es, pt, de, fr, it, uk, ar: arDZ
};

export const formatDate = (dateString: string, language: string, pattern = 'PPPP') => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const locale = locales[language] || enUS;
  return format(date, pattern, { locale });
};

export const getMoonPhase = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let c = 0;
  let e = 0;
  let jd = 0;
  let b = 0;

  if (month < 3) {
    year - 1;
    month + 12;
  }

  const yearNum = year;
  const monthNum = month;

  const a = Math.floor(yearNum / 100);
  const a2 = Math.floor(a / 4);
  const b2 = 2 - a + a2;
  const c2 = Math.floor(365.25 * yearNum);
  const d2 = Math.floor(30.6001 * (monthNum + 1));
  jd = b2 + c2 + d2 + day + 1720994.5;

  // Exact period: 29.530588853
  b = (jd - 2451550.1) / 29.530588853;
  b -= Math.floor(b);
  if (b < 0) b += 1;

  const phase = b * 29.53;

  if (phase < 1.84566) return { name: 'Nów', icon: '🌑', key: 'new_moon' };
  if (phase < 5.53699) return { name: 'Przybywający Sierp', icon: '🌒', key: 'waxing_crescent' };
  if (phase < 9.22831) return { name: 'Pierwsza Kwadra', icon: '🌓', key: 'first_quarter' };
  if (phase < 12.91963) return { name: 'Przybywający Garb', icon: '🌔', key: 'waxing_gibbous' };
  if (phase < 16.61096) return { name: 'Pełnia', icon: '🌕', key: 'full_moon' };
  if (phase < 20.30228) return { name: 'Ubywający Garb', icon: '🌖', key: 'waning_gibbous' };
  if (phase < 23.99361) return { name: 'Ostatnia Kwadra', icon: '🌗', key: 'last_quarter' };
  if (phase < 27.68493) return { name: 'Ubywający Sierp', icon: '🌘', key: 'waning_crescent' };
  return { name: 'Nów', icon: '🌑', key: 'new_moon' };
};
