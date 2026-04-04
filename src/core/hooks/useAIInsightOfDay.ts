// src/hooks/useAIInsightOfDay.ts
// AI Insight dnia — generowany raz dziennie, cachowany per świat
// Użyj w HomeScreen w każdym kafelku świata

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AiService } from '../services/ai.service';
import i18n from '../i18n';

export type WorldKey =
  | 'tarot'
  | 'astrology'
  | 'numerology'
  | 'dreams'
  | 'rituals'
  | 'affirmations'
  | 'journal'
  | 'oracle';

const WORLD_PROMPTS: Record<WorldKey, { pl: string; en: string }> = {
  tarot: {
    pl: 'Podaj jedno krótkie (1-2 zdania) przesłanie dnia z perspektywy tarota. Bez tytułu, bez wstępu. Język: polski.',
    en: 'Provide one short daily tarot message in 1-2 sentences. No title, no introduction. Language: English.',
  },
  astrology: {
    pl: 'Podaj jedno krótkie (1-2 zdania) astrologiczne przesłanie na dziś. Bez tytułu. Język: polski.',
    en: 'Provide one short astrology message for today in 1-2 sentences. No title. Language: English.',
  },
  numerology: {
    pl: 'Podaj jedno krótkie (1-2 zdania) numerologiczne przesłanie dnia. Bez tytułu. Język: polski.',
    en: 'Provide one short numerology message of the day in 1-2 sentences. No title. Language: English.',
  },
  dreams: {
    pl: 'Podaj jeden krótki (1-2 zdania) wgląd na temat snów i podświadomości na dziś. Język: polski.',
    en: 'Provide one short insight about dreams and the subconscious for today in 1-2 sentences. Language: English.',
  },
  rituals: {
    pl: 'Podaj jedno krótkie (1-2 zdania) przesłanie dotyczące rytuałów i codziennej praktyki na dziś. Język: polski.',
    en: 'Provide one short message about rituals and daily practice for today in 1-2 sentences. Language: English.',
  },
  affirmations: {
    pl: 'Podaj jedną mocną afirmację (1 zdanie) na dziś. Bez tytułu. Język: polski.',
    en: 'Provide one strong affirmation for today in 1 sentence. No title. Language: English.',
  },
  journal: {
    pl: 'Podaj jedno krótkie (1-2 zdania) zaproszenie do refleksji i pisania na dziś. Język: polski.',
    en: 'Provide one short invitation to reflect and journal today in 1-2 sentences. Language: English.',
  },
  oracle: {
    pl: 'Podaj jedno krótkie (1-2 zdania) mistyczne przesłanie dnia od Oracle. Język: polski.',
    en: 'Provide one short mystical message of the day from the Oracle in 1-2 sentences. Language: English.',
  },
};

const FALLBACKS: Record<WorldKey, { pl: string; en: string }> = {
  tarot: { pl: 'Pozwól kartom prowadzić cię dziś z otwartym sercem.', en: 'Let the cards guide you today with an open heart.' },
  astrology: { pl: 'Gwiazdy mówią — słuchaj ciszy między słowami.', en: 'The stars are speaking. Listen to the silence between the words.' },
  numerology: { pl: 'Liczby dnia skrywają wzorzec, który czeka na odkrycie.', en: 'The numbers of the day hold a pattern waiting to be discovered.' },
  dreams: { pl: 'Sen jest bramą — co próbuje ci przekazać?', en: 'Dreaming is a gateway. What is it trying to tell you?' },
  rituals: { pl: 'Każdy rytuał, nawet mały, jest krokiem ku całości.', en: 'Every ritual, even a small one, is a step toward wholeness.' },
  affirmations: { pl: 'Jestem dokładnie tam, gdzie powinienem być.', en: 'I am exactly where I need to be.' },
  journal: { pl: 'Twoje słowa mają moc — zapisz je dziś.', en: 'Your words carry power. Write them down today.' },
  oracle: { pl: 'Odpowiedź, której szukasz, jest bliżej niż myślisz.', en: 'The answer you seek is closer than you think.' },
};

interface InsightData {
  date: string;   // 'YYYY-MM-DD'
  text: string;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useAIInsightOfDay(world: WorldKey) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const storageKey = `ai_insight_${world}_v1`;
  const lang = i18n.language?.startsWith('en') ? 'en' : 'pl';

  const load = useCallback(async () => {
    const today = todayStr();
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        const cached: InsightData = JSON.parse(raw);
        if (cached.date === today) {
          setInsight(cached.text);
          return;
        }
      }
      setLoading(true);
      const text = await AiService.chatWithOracle(
        [{ role: 'user', content: WORLD_PROMPTS[world][lang] }],
        lang
      );
      const trimmed = text.trim().slice(0, 200);
      await AsyncStorage.setItem(storageKey, JSON.stringify({ date: today, text: trimmed }));
      setInsight(trimmed);
    } catch {
      setInsight(FALLBACKS[world][lang]);
    } finally {
      setLoading(false);
    }
  }, [lang, world, storageKey]);

  useEffect(() => { void load(); }, [load]);

  return { insight: insight || FALLBACKS[world][lang], loading };
}
