// @ts-nocheck
import { AiService } from './ai.service';
import { useAppStore } from '../../store/useAppStore';
import type { DailyAiContent } from '../../store/useAppStore';

const ZODIAC_PL: Record<string, string> = {
  aries: 'Baran', taurus: 'Byk', gemini: 'Bliźnięta', cancer: 'Rak',
  leo: 'Lew', virgo: 'Panna', libra: 'Waga', scorpio: 'Skorpion',
  sagittarius: 'Strzelec', capricorn: 'Koziorożec', aquarius: 'Wodnik', pisces: 'Ryby',
};

const DAY_PL = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
const MONTH_PL = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

function formatDatePL(d: Date): string {
  return `${DAY_PL[d.getDay()]}, ${d.getDate()} ${MONTH_PL[d.getMonth()]} ${d.getFullYear()}`;
}

export async function generateDailyContent(zodiacSign: string): Promise<DailyAiContent | null> {
  const today = new Date().toISOString().split('T')[0];
  const dateStr = formatDatePL(new Date());
  const signPL = ZODIAC_PL[zodiacSign.toLowerCase()] || zodiacSign;

  try {
    const prompt = `Dzisiaj jest ${dateStr}. Napisz dla znaku ${signPL} w języku polskim:
1. HOROSKOP: Jeden akapit (3-4 zdania) opisujący energię i przesłanie dnia. Zwracaj się bezpośrednio do osoby (Ty). Nie zacznij od nazwy znaku.
2. AFIRMACJA: Jedna zdanie afirmacji. Zacznij od "Jestem", "Mam", "Wybieram" lub "Tworzę".
3. RYTUAŁ: Jedna praktyczna wskazówka duchowa na dziś (1-2 zdania).

Odpowiedz WYŁĄCZNIE w formacie JSON:
{"horoscope":"...","affirmation":"...","ritualTip":"..."}`;

    const response = await AiService.chatWithOracle([
      { role: 'user', content: prompt }
    ], 'pl');

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*"horoscope"[\s\S]*"affirmation"[\s\S]*"ritualTip"[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.horoscope || !parsed.affirmation || !parsed.ritualTip) return null;

    return {
      date: today,
      zodiacSign,
      horoscope: parsed.horoscope,
      affirmation: parsed.affirmation,
      ritualTip: parsed.ritualTip,
      generatedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export function isTodayContentFresh(zodiacSign: string): boolean {
  const stored = useAppStore.getState().dailyAiContent;
  if (!stored) return false;
  const today = new Date().toISOString().split('T')[0];
  return stored.date === today && stored.zodiacSign === zodiacSign;
}
