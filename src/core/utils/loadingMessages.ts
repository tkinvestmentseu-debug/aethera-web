export type LoadingDomain =
  | 'tarot'
  | 'oracle'
  | 'astrology'
  | 'reports'
  | 'numerology'
  | 'dreams'
  | 'journal'
  | 'ritual'
  | 'affirmations'
  | 'default';

export const LOADING_MESSAGES: Record<LoadingDomain, string[]> = {
  tarot: [
    'Czytamy układ kart...',
    'Interpretujemy symbole...',
    'Karty odsłaniają wzorzec...',
    'Budujemy odpowiedź dla Ciebie...',
  ],
  oracle: [
    'Oracle wsłuchuje się w Twoje pytanie...',
    'Formułujemy wgląd...',
    'Szukamy ukrytego wzorca...',
    'Kanalizujemy odpowiedź...',
  ],
  astrology: [
    'Czytamy niebo...',
    'Analizujemy tranzyty...',
    'Mapujemy energię planet...',
    'Obliczamy aspekty...',
  ],
  reports: [
    'Czytamy wzorzec duszy...',
    'Analizujemy Twoje wpisy...',
    'Budujemy raport tygodnia...',
    'Łączymy najważniejsze wątki...',
  ],
  numerology: [
    'Obliczamy wibracje...',
    'Dekodujemy liczby...',
    'Czytamy matrycę cyfr...',
  ],
  dreams: [
    'Wchodzimy w symbolikę snu...',
    'Czytamy nocny przekaz...',
    'Interpretujemy obrazy podświadomości...',
  ],
  journal: [
    'Porządkujemy refleksje...',
    'Analizujemy wpis...',
    'Szukamy powracającego wzorca...',
  ],
  ritual: [
    'Przygotowujemy przestrzeń...',
    'Ustawiamy intencję...',
    'Budujemy rytuał krok po kroku...',
  ],
  affirmations: [
    'Wybieramy afirmacje...',
    'Dobieramy energię słów...',
    'Aktywujemy wspierający przekaz...',
  ],
  default: [
    'Chwila ciszy...',
    'Przygotowujemy doświadczenie...',
    'Już prawie...',
    'Łączymy wszystkie elementy...',
  ],
};

const _msgIndex: Record<string, number> = {};

/** Zwraca kolejny komunikat z rotacją. */
export function getLoadingMessage(domain: LoadingDomain = 'default'): string {
  const msgs = LOADING_MESSAGES[domain];
  const idx = (_msgIndex[domain] ?? 0) % msgs.length;
  _msgIndex[domain] = idx + 1;
  return msgs[idx];
}
