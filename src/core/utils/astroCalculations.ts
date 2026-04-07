// @ts-nocheck
/**
 * astroCalculations.ts
 * Oblicza znak zodiaku, liczbę numerologiczną życia i ascendent
 * na podstawie daty i godziny urodzenia.
 */

// ─── Znaki zodiaku ─────────────────────────────────────────────────────────────

export interface ZodiacInfo {
  sign: string;        // pl: Baran, Byk...
  signEn: string;      // en: Aries, Taurus...
  emoji: string;
  element: string;     // Ogień, Ziemia, Powietrze, Woda
  elementEn: string;
  dates: string;       // "21 mar – 19 kwi"
  ruling: string;      // planeta rządząca
  keywords: string[];
  description: string; // 2-zdaniowy opis
}

const ZODIAC_DATA: ZodiacInfo[] = [
  {
    sign: 'Baran', signEn: 'Aries', emoji: '♈', element: 'Ogień', elementEn: 'Fire',
    dates: '21 mar – 19 kwi', ruling: 'Mars',
    keywords: ['odwaga', 'inicjatywa', 'energia', 'niezależność'],
    description: 'Urodzony lider z niezwykłą witalnością. Baran wkracza w życie z odwagą i pasją, inspirując innych swoją bezpośredniością.',
  },
  {
    sign: 'Byk', signEn: 'Taurus', emoji: '♉', element: 'Ziemia', elementEn: 'Earth',
    dates: '20 kwi – 20 maj', ruling: 'Wenus',
    keywords: ['trwałość', 'zmysłowość', 'lojalność', 'piękno'],
    description: 'Głęboko zakorzeniony w materialnym świecie. Byk ma wyjątkową zdolność do tworzenia piękna i stabilności w każdym aspekcie życia.',
  },
  {
    sign: 'Bliźnięta', signEn: 'Gemini', emoji: '♊', element: 'Powietrze', elementEn: 'Air',
    dates: '21 maj – 20 cze', ruling: 'Merkury',
    keywords: ['ciekawość', 'komunikacja', 'wszechstronność', 'dowcip'],
    description: 'Magnetyczna dusza z nieskończoną ciekawością świata. Bliźnięta poruszają się między ideami jak motyl między kwiatami.',
  },
  {
    sign: 'Rak', signEn: 'Cancer', emoji: '♋', element: 'Woda', elementEn: 'Water',
    dates: '21 cze – 22 lip', ruling: 'Księżyc',
    keywords: ['intuicja', 'empatia', 'dom', 'opieka'],
    description: 'Głęboko intuicyjna i emocjonalna dusza. Rak potrafi czytać nastroje innych jak otwartą księgę i troszczy się z nieskończoną miłością.',
  },
  {
    sign: 'Lew', signEn: 'Leo', emoji: '♌', element: 'Ogień', elementEn: 'Fire',
    dates: '23 lip – 22 sie', ruling: 'Słońce',
    keywords: ['charyzma', 'twórczość', 'wielkoduszność', 'serce'],
    description: 'Płonące serce wypełnione hojnością i pasją. Lew oświetla każde pomieszczenie swoją obecnością i inspiruje innych do sięgania po gwiazdy.',
  },
  {
    sign: 'Panna', signEn: 'Virgo', emoji: '♍', element: 'Ziemia', elementEn: 'Earth',
    dates: '23 sie – 22 wrz', ruling: 'Merkury',
    keywords: ['analiza', 'doskonałość', 'służba', 'precyzja'],
    description: 'Wyjątkowy umysł łączący analityczną precyzję z głęboką troską o innych. Panna widzi to, co inni pomijają, i naprawia to z miłością.',
  },
  {
    sign: 'Waga', signEn: 'Libra', emoji: '♎', element: 'Powietrze', elementEn: 'Air',
    dates: '23 wrz – 22 paź', ruling: 'Wenus',
    keywords: ['harmonia', 'sprawiedliwość', 'piękno', 'relacje'],
    description: 'Mistrz równowagi i piękna. Waga posiada wrodzoną mądrość dyplomatyczną i żyje w nieustannym poszukiwaniu harmonii w każdej relacji.',
  },
  {
    sign: 'Skorpion', signEn: 'Scorpio', emoji: '♏', element: 'Woda', elementEn: 'Water',
    dates: '23 paź – 21 lis', ruling: 'Pluton',
    keywords: ['głębia', 'transformacja', 'intensywność', 'tajemnica'],
    description: 'Dusza stworzona do transformacji. Skorpion zanurza się w najgłębszych wodach ludzkiej psychiki i wychodzi z nich zawsze odnowiony.',
  },
  {
    sign: 'Strzelec', signEn: 'Sagittarius', emoji: '♐', element: 'Ogień', elementEn: 'Fire',
    dates: '22 lis – 21 gru', ruling: 'Jowisz',
    keywords: ['wolność', 'mądrość', 'przygoda', 'optymizm'],
    description: 'Wieczny poszukiwacz prawdy i przygody. Strzelec nie zna granic — fizycznych ani intelektualnych — i zaraża innych swoim optymizmem.',
  },
  {
    sign: 'Koziorożec', signEn: 'Capricorn', emoji: '♑', element: 'Ziemia', elementEn: 'Earth',
    dates: '22 gru – 19 sty', ruling: 'Saturn',
    keywords: ['ambicja', 'dyscyplina', 'wytrwałość', 'mądrość'],
    description: 'Cierpliwy budowniczy wielkich rzeczy. Koziorożec wie, że każde wielkie dzieło wymaga czasu i potrafi pracować z niezachwianą determinacją.',
  },
  {
    sign: 'Wodnik', signEn: 'Aquarius', emoji: '♒', element: 'Powietrze', elementEn: 'Air',
    dates: '20 sty – 18 lut', ruling: 'Uran',
    keywords: ['innowacja', 'wolność', 'humanitaryzm', 'oryginalność'],
    description: 'Wizjoner wyprzedzający swoją epokę. Wodnik myśli poza wszelkimi granicami i marzy o świecie lepszym dla każdej istoty.',
  },
  {
    sign: 'Ryby', signEn: 'Pisces', emoji: '♓', element: 'Woda', elementEn: 'Water',
    dates: '19 lut – 20 mar', ruling: 'Neptun',
    keywords: ['wrażliwość', 'intuicja', 'empatia', 'mistycyzm'],
    description: 'Dusza zanurzona w oceanie uczuć i intuicji. Ryby posiadają dar przenikania zasłony rzeczywistości i dostrzegania niewidzialnych połączeń.',
  },
];

// Indeksy: 0=Baran … 11=Ryby
// (mm, dd) → indeks znaku
function getZodiacIndex(month: number, day: number): number {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 0;  // Baran
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 1;  // Byk
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 2;  // Bliźnięta
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 3;  // Rak
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 4;  // Lew
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 5;  // Panna
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 6; // Waga
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 7; // Skorpion
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 8; // Strzelec
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 9;  // Koziorożec
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 10;  // Wodnik
  return 11; // Ryby
}

export function calcZodiacSign(birthDate: string): ZodiacInfo | null {
  if (!birthDate) return null;
  const parts = birthDate.split('-');
  if (parts.length < 3) return null;
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(month) || isNaN(day)) return null;
  return ZODIAC_DATA[getZodiacIndex(month, day)];
}

// ─── Liczba życia (numerologia) ────────────────────────────────────────────────

export interface LifePathInfo {
  number: number;
  isMaster: boolean;
  title: string;
  meaning: string;
  strengths: string[];
  challenge: string;
}

const LIFE_PATH_DATA: Record<number, LifePathInfo> = {
  1: {
    number: 1, isMaster: false,
    title: 'Pionier',
    meaning: 'Urodzony lider z silną wolą i niezależnością. Twoja ścieżka prowadzi przez samodyscyplinę do osiągnięć, które inspirują innych.',
    strengths: ['przywództwo', 'kreatywność', 'determinacja'],
    challenge: 'Naucz się prosić o pomoc i współpracować.',
  },
  2: {
    number: 2, isMaster: false,
    title: 'Dyplomata',
    meaning: 'Mistrz współpracy i intuicji. Twoja wrażliwość pozwala ci dostrzegać to, co inni ignorują, budując mosty tam, gdzie inni widzą mury.',
    strengths: ['empatia', 'dyplomacja', 'intuicja'],
    challenge: 'Naucz się stawiać swoje potrzeby na pierwszym miejscu.',
  },
  3: {
    number: 3, isMaster: false,
    title: 'Twórca',
    meaning: 'Dusza wyrazu i kreatywności. Twój dar polega na transformowaniu emocji i idei w piękno — przez słowo, dźwięk, kolor lub ruch.',
    strengths: ['kreatywność', 'komunikacja', 'optymizm'],
    challenge: 'Skup energię twórczą, by nie rozpraszać się na wiele projektów.',
  },
  4: {
    number: 4, isMaster: false,
    title: 'Budowniczy',
    meaning: 'Filar stabilności i porządku. Twoja misja polega na budowaniu trwałych fundamentów — czy to w relacjach, pracy, czy duchowości.',
    strengths: ['niezawodność', 'dyscyplina', 'pracowitość'],
    challenge: 'Otwórz się na zmiany i elastyczność.',
  },
  5: {
    number: 5, isMaster: false,
    title: 'Poszukiwacz',
    meaning: 'Dusza wolności i przygody. Uczysz się przez doświadczenie i pokonujesz granice, inspirując innych do wychodzenia ze strefy komfortu.',
    strengths: ['adaptacyjność', 'odwaga', 'ciekawość'],
    challenge: 'Naucz się wytrwałości i głębszego zaangażowania.',
  },
  6: {
    number: 6, isMaster: false,
    title: 'Opiekun',
    meaning: 'Serce rodziny i wspólnoty. Twoja miłość do bliskich i poczucie odpowiedzialności tworzą ciepłe, harmonijne środowisko dla wszystkich.',
    strengths: ['troskliwość', 'lojalność', 'harmonia'],
    challenge: 'Ustal zdrowe granice i nie przejmuj cudzych ciężarów.',
  },
  7: {
    number: 7, isMaster: false,
    title: 'Mistyk',
    meaning: 'Poszukiwacz ukrytej prawdy. Twój umysł przenika powierzchnię rzeczy, a dusza odczuwa połączenie z wymiarem, który inni zaledwie przeczuwają.',
    strengths: ['intuicja', 'analiza', 'duchowość'],
    challenge: 'Otwórz się na innych i podziel się swoją mądrością.',
  },
  8: {
    number: 8, isMaster: false,
    title: 'Architekt Losu',
    meaning: 'Posiadasz wyjątkową zdolność do manifestowania materialnej i duchowej obfitości. Twoja siła tkwi w wizji i konsekwentnym działaniu.',
    strengths: ['ambicja', 'siła', 'zdolności organizacyjne'],
    challenge: 'Pamiętaj, że prawdziwa władza płynie z miłości, nie z kontroli.',
  },
  9: {
    number: 9, isMaster: false,
    title: 'Humanitarny Mędrzec',
    meaning: 'Twoja dusza jest stara i mądra. Przyszedłeś, by służyć światu swoją mądrością, compassją i gotowością do oddania czegoś większego.',
    strengths: ['mądrość', 'compassja', 'idealizm'],
    challenge: 'Naucz się odpuszczać i nie nieść ciężaru świata samemu.',
  },
  11: {
    number: 11, isMaster: true,
    title: 'Mistrz Intuicji',
    meaning: 'Liczba mistrzowska 11 — jesteś kanałem wyższej świadomości. Twoja intuicja i wrażliwość są darem dla świata, gdy działasz z miejsca miłości.',
    strengths: ['wizjonerstwo', 'intuicja', 'inspiracja'],
    challenge: 'Zakorzenij mistyczne objawienia w codziennej praktyce.',
  },
  22: {
    number: 22, isMaster: true,
    title: 'Mistrzowski Budowniczy',
    meaning: 'Liczba mistrzowska 22 — masz zdolność realizowania wielkich snów w rzeczywistości. Twoja misja to budowanie czegoś, co przetrwa pokolenia.',
    strengths: ['wizja', 'pragmatyzm', 'skala działania'],
    challenge: 'Zaufaj swojej wielkości i nie pomniejszaj swoich ambicji.',
  },
  33: {
    number: 33, isMaster: true,
    title: 'Mistrzowski Nauczyciel',
    meaning: 'Liczba mistrzowska 33 — jesteś wcieleniem bezwarunkowej miłości i mądrości. Twoje powołanie to nauczanie przez przykład własnego życia.',
    strengths: ['miłość', 'uzdrawianie', 'nauczanie'],
    challenge: 'Dbaj o siebie tak samo troskliwie, jak o innych.',
  },
};

export function calcLifePath(birthDate: string): LifePathInfo | null {
  if (!birthDate) return null;
  const digits = birthDate.replace(/-/g, '').split('').map(Number).filter(n => !isNaN(n));
  if (digits.length === 0) return null;

  const reduce = (n: number): number => {
    if (n === 11 || n === 22 || n === 33) return n;
    if (n < 10) return n;
    return reduce(n.toString().split('').reduce((a, d) => a + parseInt(d, 10), 0));
  };

  const sum = digits.reduce((a, b) => a + b, 0);
  const num = reduce(sum);
  return LIFE_PATH_DATA[num] ?? LIFE_PATH_DATA[9];
}

// ─── Ascendent (uproszczony) ────────────────────────────────────────────────────
// Przybliżenie: ascendent obliczany jako znak Słońca + offset od godziny wschodu
// (co 2 godziny ascendent przesuwa się o jeden znak)

export function calcAscendant(birthDate: string, birthTime: string): ZodiacInfo | null {
  if (!birthDate || !birthTime) return null;
  const sunSign = calcZodiacSign(birthDate);
  if (!sunSign) return null;

  const timeParts = birthTime.split(':');
  const hour = parseInt(timeParts[0], 10);
  if (isNaN(hour)) return null;

  const sunIdx = ZODIAC_DATA.indexOf(sunSign);
  // Przy wschodzie słońca (~6:00) ascendent ≈ znak Słońca
  const offset = Math.round((hour - 6) / 2);
  const ascIdx = ((sunIdx + offset) % 12 + 12) % 12;
  return ZODIAC_DATA[ascIdx];
}

// ─── Elementy chińskiego zodiaku ───────────────────────────────────────────────

export function calcChineseZodiac(birthYear: number): string {
  const animals = ['Szczur','Wół','Tygrys','Królik','Smok','Wąż','Koń','Koza','Małpa','Kogut','Pies','Świnia'];
  return animals[((birthYear - 1900) % 12 + 12) % 12];
}
