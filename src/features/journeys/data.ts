export interface JourneyDay {
  day: number;
  title: string;
  description: string;
  taskType: 'tarot' | 'journal' | 'ritual' | 'affirmation' | 'meditation' | 'breathwork';
}

export interface Journey {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration: number; // days
  category: 'przebudzenie' | 'uzdrowienie' | 'transformacja' | 'inicjacja' | 'tarot' | 'ksiezyc' | 'oracle' | 'chakry';
  color: string;
  emoji: string;
  whatYouLearn: string[];
  testimonial: string;
  testimonialAuthor: string;
  days: JourneyDay[];
  premium: boolean;
}

export interface JourneyPhase {
  id: number;
  name: string;
  nameEn: string;
  color: string;
  symbol: string;
  emoji: string;
  durationHint: string;
  description: string;
  themes: string[];
  practices: string[];
  prompts: string[];
  crystalHint: string;
  elementHint: string;
}

import i18n from '../../core/i18n';
import { resolveTextArray, resolveUserFacingText } from '../../core/utils/contentResolver';

const BASE_JOURNEYS: Journey[] = [
  {
    id: 'przebudzenie',
    title: 'Przebudzenie',
    subtitle: 'Podstawy duchowości — 7 dni',
    description: 'Tydzień codziennych praktyk i obserwacji prowadzących do głębszego samozrozumienia. Każdy dzień to jeden krok bliżej własnej prawdy.',
    duration: 7,
    category: 'przebudzenie',
    color: '#C8A96E',
    emoji: '🌅',
    whatYouLearn: [
      'Jak zatrzymać umysł i wejść w obserwację',
      'Rytuał intencji na każdy nowy dzień',
      'Podstawy pracy z kartami tarota',
      'Technika afirmacji przeprogramowującej wzorce',
      'Praca z cieniem w bezpieczny sposób',
    ],
    testimonial: 'Po siedmiu dniach zrozumiałam, czego tak naprawdę szukam. To była najważniejsza decyzja roku.',
    testimonialAuthor: 'Kasia, 34 lata',
    premium: false,
    days: [
      { day: 1, title: 'Obserwacja i intencja', description: 'Zanim zaczniesz działać, zatrzymaj się. Dziś obserwujesz swoje myśli bez oceniania i ustawiasz intencję na cały tydzień.', taskType: 'journal' },
      { day: 2, title: 'Praca z ciałem', description: 'Ciało przechowuje to, co umysł zapomniał. Krótki rytuał ruchu i uziemienia, który łączy Cię z teraźniejszością.', taskType: 'ritual' },
      { day: 3, title: 'Głos Tarota', description: 'Jedna karta jako lustro dnia. Nie szukaj przepowiedni — szukaj pytania, które karta zadaje Tobie.', taskType: 'tarot' },
      { day: 4, title: 'Afirmacja zmiany', description: 'Jedno zdanie, które przeprogramowuje powtarzający się wzorzec. Powiedz je głośno, zapisz, wróć do niego wieczorem.', taskType: 'affirmation' },
      { day: 5, title: 'Dziennik cienia', description: 'Co w sobie odsuwasz? Co drażni Cię u innych? Dziś piszesz o tym, co nosiłeś w milczeniu.', taskType: 'journal' },
      { day: 6, title: 'Integracja emocji', description: 'Przejrzyj notatki z poprzednich dni. Znajdź powtarzający się temat — to właśnie on chce być zauważony.', taskType: 'meditation' },
      { day: 7, title: 'Karta zamknięcia', description: 'Ostatnia karta tygodnia. Co zakończyło się, co zaczyna, co prosi o Twoją uwagę w następnym rozdziale.', taskType: 'tarot' },
    ],
  },
  {
    id: 'uzdrowienie-serca',
    title: 'Uzdrowienie Serca',
    subtitle: 'Praktyki leczenia — 14 dni',
    description: 'Pogłębiona praca z sercem, granicami i tym, jak kochasz i jesteś kochany. Dla tych, którzy chcą zrozumieć wzorce w swoich relacjach i uzdrowić rany z przeszłości.',
    duration: 14,
    category: 'uzdrowienie',
    color: '#E8829A',
    emoji: '💗',
    whatYouLearn: [
      'Mapa własnych wzorców relacyjnych',
      'Rytuał wybaczania siebie i innych',
      'Praca z granicami bez poczucia winy',
      'Techniki uwalniania emocjonalnych zablokować',
      'Budowanie zdrowej miłości własnej',
    ],
    testimonial: 'Czternaście dni, które pomogły mi zakończyć siedmioletni wzorzec. Serce naprawdę potrafi się leczyć.',
    testimonialAuthor: 'Marta, 29 lat',
    premium: false,
    days: [
      { day: 1, title: 'Mapa serca', description: 'Narysuj w dzienniku mapę swoich ważnych relacji. Kto daje Ci energię, kto ją zabiera?', taskType: 'journal' },
      { day: 2, title: 'Tarot miłości', description: 'Rozkład trzech kart: Ja, Ty, My. Nie szukaj przyszłości — szukaj obecnego stanu połączenia.', taskType: 'tarot' },
      { day: 3, title: 'Rytuał granic', description: 'Granice to nie mury. Dziś ustawiasz jedną granicę, którą odkładałeś zbyt długo.', taskType: 'ritual' },
      { day: 4, title: 'List do siebie', description: 'Napisz list do wersji siebie z przeszłości — tej, która potrzebowała usłyszenia czegoś ważnego.', taskType: 'journal' },
      { day: 5, title: 'Oddech uwalniający', description: 'Technika oddechowa ukierunkowana na uwalnianie napięcia z okolic klatki piersiowej i serca.', taskType: 'breathwork' },
      { day: 6, title: 'Afirmacje serca', description: 'Pięć afirmacji przebudowujących przekonania o miłości, warte powtarzania przez cały tydzień.', taskType: 'affirmation' },
      { day: 7, title: 'Obserwacja wzorców', description: 'Przejrzyj swoje notatki. Jaki wzorzec pojawia się najczęściej w Twoich relacjach?', taskType: 'journal' },
      { day: 8, title: 'Medytacja miłości', description: 'Klasyczna metta — medytacja życzliwości skierowana najpierw do siebie, potem do innych.', taskType: 'meditation' },
      { day: 9, title: 'Tarot granic', description: 'Karta pokazująca, gdzie Twoje granice potrzebują wzmocnienia lub zmiękczenia.', taskType: 'tarot' },
      { day: 10, title: 'Rytuał wybaczania', description: 'Nie dla innych — dla siebie. Ceremonia symbolicznego uwolnienia starego bólu.', taskType: 'ritual' },
      { day: 11, title: 'Dziennik wdzięczności', description: 'Trzy rzeczy, za które jesteś wdzięczny sobie samemu. Trzy sposoby, w jakie siebie chronisz.', taskType: 'journal' },
      { day: 12, title: 'Głos ciała', description: 'Gdzie w ciele czujesz miłość? Gdzie czujesz jej brak? Skanowanie ciała jako praktyka uważności.', taskType: 'meditation' },
      { day: 13, title: 'Nowa narracja', description: 'Napisz nową historię o sobie — nie o tym, kim byłeś, ale o tym, kim się stajesz.', taskType: 'journal' },
      { day: 14, title: 'Zamknięcie ścieżki', description: 'Finalna karta tarota + wpis o tym, co się naprawdę zmieniło w tych dwóch tygodniach.', taskType: 'tarot' },
    ],
  },
  {
    id: 'mistyczna-transformacja',
    title: 'Mistyczna Transformacja',
    subtitle: 'Praca z cieniem i integracja — 21 dni',
    description: 'Trudne, ale transformujące. Praca z tym, co nosimy w cieniu — stłumionymi emocjami i odrzuconymi częściami siebie — prowadzi do prawdziwej wolności i pełni.',
    duration: 21,
    category: 'transformacja',
    color: '#9B7FD4',
    emoji: '🔮',
    whatYouLearn: [
      'Jungowskie podstawy pracy z cieniem',
      'Techniki identyfikacji własnych projekcji',
      'Rytuały integracji odrzuconych części siebie',
      'Praca z archetypami przez tarot',
      'Głęboka meditacja transformacyjna',
    ],
    testimonial: 'Dwadzieścia jeden dni zmieniło mój sposób reagowania na wszystko, co trudne. Przestałem uciekać.',
    testimonialAuthor: 'Tomek, 41 lat',
    premium: true,
    days: [
      { day: 1, title: 'Odkryj cień', description: 'Co w sobie potępiasz? Co drażni Cię u innych? To właśnie tam zaczyna się Twój cień.', taskType: 'journal' },
      { day: 2, title: 'Projekcje i lustra', description: 'Przez trzy osoby, które Cię irytują, dowiadujemy się o sobie więcej niż przez lata terapii.', taskType: 'journal' },
      { day: 3, title: 'Karta cienia', description: 'Rozkład tarota: Co chcę zobaczyć / Co ukrywam / Co prosi o integrację.', taskType: 'tarot' },
      { day: 4, title: 'Rytuał konfrontacji', description: 'Symboliczne spotkanie z jedną odrzuconą częścią siebie. Nie walka — dialog.', taskType: 'ritual' },
      { day: 5, title: 'Oddech transformacyjny', description: 'Głęboka praca oddechowa wspierająca uwalnianie zakorzenionych napięć.', taskType: 'breathwork' },
      { day: 6, title: 'Archetyp siły', description: 'Który archetyp Junga jest Twoim aktualnym nauczycielem? Bohater, Cień, Anima/Animus?', taskType: 'journal' },
      { day: 7, title: 'Integracja tygodnia 1', description: 'Przejrzyj wszystkie wpisy. Jaki jest centralny temat tej pierwszej fazy pracy?', taskType: 'meditation' },
      { day: 8, title: 'Emocje bez oceniania', description: 'Przez jeden dzień obserwuj każdą emocję bez etykietowania jej jako dobra lub zła.', taskType: 'journal' },
      { day: 9, title: 'Ciało cienia', description: 'Cień mieszka w ciele. Gdzie czujesz napięcie, gdy myślisz o tym, czego nie lubisz w sobie?', taskType: 'meditation' },
      { day: 10, title: 'Tarot transformacji', description: 'Karta: Co muszę puścić, żeby mogło przyjść coś nowego.', taskType: 'tarot' },
      { day: 11, title: 'List od cienia', description: 'Napisz list od swojej odrzuconej części do siebie. Daj jej głos.', taskType: 'journal' },
      { day: 12, title: 'Rytuał uwalniania', description: 'Ceremonialny rytuał spalenia lub zakopania symbolicznego reprezentanta starego wzorca.', taskType: 'ritual' },
      { day: 13, title: 'Afirmacje integracji', description: 'Afirmacje skierowane nie do ideału, ale do całości — tej ciemnej i jasnej razem.', taskType: 'affirmation' },
      { day: 14, title: 'Integracja tygodnia 2', description: 'Co zmieniło się w sposobie, w jaki patrzysz na swoje słabości?', taskType: 'journal' },
      { day: 15, title: 'Złote cechy cienia', description: 'Cień to nie tylko to, czego nie lubimy. To też dary, których się wstydzimy. Odkryj swój złoty cień.', taskType: 'journal' },
      { day: 16, title: 'Medytacja na granicę', description: 'Wizualizacja — stoisz na granicy między tym, kim byłeś, a tym, kim się stajesz.', taskType: 'meditation' },
      { day: 17, title: 'Tarot nowego ja', description: 'Trzy karty: Kim byłem / Kim jestem / Kim mogę się stać.', taskType: 'tarot' },
      { day: 18, title: 'Nowa tożsamość', description: 'Napisz manifest nowej wersji siebie — po integracji cienia.', taskType: 'journal' },
      { day: 19, title: 'Rytuał zamknięcia', description: 'Uroczysty rytuał zakończenia starego rozdziału i otwarcia nowego.', taskType: 'ritual' },
      { day: 20, title: 'Wdzięczność za cień', description: 'Napisz list wdzięczności do swoich trudnych doświadczeń i odrzuconych części siebie.', taskType: 'journal' },
      { day: 21, title: 'Karta inicjacji', description: 'Ostatnia karta tarota tej podróży. Nie pyta, kim byłeś — pyta, kto teraz wychodzi z tej ścieżki.', taskType: 'tarot' },
    ],
  },
  {
    id: 'rok-inicjacji',
    title: 'Rok Inicjacji',
    subtitle: 'Pełne duchowe przebudzenie — 30 dni',
    description: 'Trzydzieści dni intensywnej pracy duchowej tworzących fundament świadomego życia. Dla tych, którzy są gotowi na pełną transformację i nie boją się głębi.',
    duration: 30,
    category: 'inicjacja',
    color: '#E8A44A',
    emoji: '👑',
    whatYouLearn: [
      'Kompletny system codziennych praktyk duchowych',
      'Integracja wszystkich aspektów — ciała, umysłu i ducha',
      'Praca z archetypami, cieniem i snami',
      'Zaawansowane techniki medytacyjne',
      'Rytuały cyklu księżycowego',
    ],
    testimonial: 'Trzydzieści dni, które stały się fundamentem reszty mojego życia. Nie ma powrotu do starego.',
    testimonialAuthor: 'Anna, 38 lat',
    premium: true,
    days: Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      title: [
        'Próg inicjacji', 'Intencja na 30 dni', 'Mapa duchowa', 'Praca z oddechem',
        'Tarot tygodnia 1', 'Rytuał uziemienia', 'Integracja 1',
        'Praca z cieniem', 'Emocje jako nauczyciele', 'Tarot głębi',
        'Rytuał ognia', 'Granice energetyczne', 'Integracja 2',
        'Księżyc i cykl', 'Czakry i ciało', 'Tarot transformacji',
        'Rytuał księżycowy', 'Snowy journal', 'Integracja 3',
        'Archetypy i moc', 'Złoty cień', 'Tarot inicjacji',
        'Rytuał wody', 'Nowa tożsamość', 'Integracja 4',
        'Manifest duszy', 'Rytuał finałowy', 'Tarot zamknięcia',
        'List do przyszłości', 'Karta przebudzonego',
      ][i],
      description: `Dzień ${i + 1} Roku Inicjacji. Głęboka praca z kolejną warstwą swojej duchowej ścieżki — krok po kroku, dzień po dniu.`,
      taskType: (['journal', 'tarot', 'ritual', 'meditation', 'breathwork', 'affirmation'] as const)[i % 6],
    })),
  },
  {
    id: 'droga-tarota',
    title: 'Droga Tarota',
    subtitle: 'Mistrzowska praca z tarotem — 21 dni',
    description: 'Trzy tygodnie intensywnej pracy z tarotem jako narzędziem samopoznania. Od podstaw interpretacji po zaawansowane rozkłady i pracę z archetypami Wielkich Arkanów.',
    duration: 21,
    category: 'tarot',
    color: '#7B9ED9',
    emoji: '🃏',
    whatYouLearn: [
      'Czytanie kart jako lustro psychiki, nie wyrocznia',
      'Wszystkie 22 Wielkie Arkany — głęboka symbolika',
      'Zaawansowane rozkłady: Celtycki Krzyż i inne',
      'Praca z cieniem przez archetypy tarota',
      'Tworzenie osobistego języka symbolicznego',
    ],
    testimonial: 'Tarot przestał być dla mnie magią, a stał się głębszym sposobem rozumienia siebie niż psychologia.',
    testimonialAuthor: 'Zofia, 27 lat',
    premium: true,
    days: Array.from({ length: 21 }, (_, i) => ({
      day: i + 1,
      title: [
        'Głupiec — nowy początek', 'Mag — intencja i wola', 'Kapłanka — intuicja',
        'Cesarzowa — obfitość', 'Cesarz — struktura', 'Hierofant — tradycja',
        'Kochankowie — wybór', 'Rydwan — determinacja', 'Moc — odwaga',
        'Pustelnik — samotność', 'Koło Fortuny — cykl', 'Sprawiedliwość — równowaga',
        'Wisielec — perspektywa', 'Śmierć — transformacja', 'Umiarkowanie — harmonia',
        'Diabeł — cień', 'Wieża — rozbicie', 'Gwiazda — nadzieja',
        'Księżyc — iluzja', 'Słońce — jasność', 'Sąd — przebudzenie',
      ][i],
      description: `Praca z ${i + 1}. Wielkim Arkanem. Medytacja z kartą, symbolika, pytania do refleksji i wpis w dzienniku tarota.`,
      taskType: 'tarot' as const,
    })),
  },
  {
    id: 'rytualy-ksiezyca',
    title: 'Rytuały Księżyca',
    subtitle: 'Życie w rytmie księżyca — 28 dni',
    description: 'Pełny cykl księżycowy jako mapa wewnętrznej pracy. Nów do pełni — wzrost intencji. Pełnia do nowiu — uwalnianie i integracja. Żyj w rytmie, nie w pośpiechu.',
    duration: 28,
    category: 'ksiezyc',
    color: '#8BA8D4',
    emoji: '🌙',
    whatYouLearn: [
      'Znaczenie każdej fazy księżyca dla pracy duchowej',
      'Rytuały nowiu — ustawianie intencji',
      'Rytuały pełni — kulminacja i uwalnianie',
      'Astrologia jako język energii sezonowej',
      'Tworzenie osobistego kalendarza księżycowego',
    ],
    testimonial: 'Pierwszy raz w życiu poczułam, że moje emocje mają sens i rytm. Księżyc mnie nie rządzi — rozumiem go.',
    testimonialAuthor: 'Ola, 31 lat',
    premium: true,
    days: Array.from({ length: 28 }, (_, i) => ({
      day: i + 1,
      title: [
        'Nów — nowy cykl', 'Intencja księżycowa', 'Kiełkowanie nasion', 'Rytuał otwarcia',
        'Księżyc rośnie', 'Wiara i działanie', 'Połowa drogi do pełni', 'Niecierpliwość i ufanie',
        'Garbus — kulminacja tuż przed', 'Pełnia — szczyt energii', 'Rytuał pełni', 'Po kulminacji',
        'Powolne opadanie', 'Integracja', 'Obserwacja efektów', 'Pytania bez odpowiedzi',
        'Garbus malejący', 'Wdzięczność i ocena', 'Zbliżenie do ciemności', 'Uwalnianie',
        'Rytuał uwalniania', 'Ciemna noc księżyca', 'Cisza przed nowiem', 'Podsumowanie cyklu',
        'Ostatni oddech cyklu', 'Przejście', 'Próg nowego nowiu', 'Zamknięcie i otwarcie',
      ][i],
      description: `Dzień ${i + 1} cyklu księżycowego. Praca z aktualną fazą księżyca — obserwacja jej wpływu na Twój stan wewnętrzny i dostosowanie praktyki.`,
      taskType: (['ritual', 'journal', 'meditation', 'affirmation'] as const)[i % 4],
    })),
  },
  {
    id: 'oracle-awakening',
    title: 'Oracle Awakening',
    subtitle: 'Mistrzostwo pracy z wyrocznią — 14 dni',
    description: 'Dwie tygodnie pogłębionej pracy z Oracle — narzędziem łączącym intuicję, archetypowe myślenie i wewnętrzną mądrość. Nie przewidujesz przyszłości — odkrywasz prawdę.',
    duration: 14,
    category: 'oracle',
    color: '#A89BD4',
    emoji: '✨',
    whatYouLearn: [
      'Rozwijanie intuicji jako praktycznej umiejętności',
      'Czytanie Oracle bez dosłowności — symboliczne myślenie',
      'Pytania, które rzeczywiście otwierają — nie zamykają',
      'Praca z archetypami w codziennych sytuacjach',
      'Tworzenie własnego języka z Oracle',
    ],
    testimonial: 'Oracle przestał być mistyczną przepowiednią. Stał się moim najlepszym narzędziem do podejmowania decyzji.',
    testimonialAuthor: 'Piotr, 36 lat',
    premium: true,
    days: Array.from({ length: 14 }, (_, i) => ({
      day: i + 1,
      title: [
        'Czym jest Oracle?', 'Pierwsze pytanie', 'Symbole i znaczenia', 'Intuicja vs analiza',
        'Pytania otwierające', 'Archetyp dnia', 'Integracja tygodnia 1',
        'Cień w Oracle', 'Pytanie nie o przyszłość', 'Lustra i projekcje',
        'Oracle i ciało', 'Własny system symboliczny', 'Pytanie o ścieżkę', 'Zamknięcie ścieżki Oracle',
      ][i],
      description: `Dzień ${i + 1} pracy z Oracle. Pogłębiona sesja z pytaniem, symbolem i refleksją pisaną — bez oczekiwania konkretnych odpowiedzi.`,
      taskType: (['journal', 'meditation', 'affirmation', 'tarot'] as const)[i % 4],
    })),
  },
  {
    id: 'czakry-energia',
    title: 'Czakry i Energia',
    subtitle: 'Mistrzostwo systemu czakr — 21 dni',
    description: 'Trzy tygodnie pracy z systemem czakr jako mapą wewnętrznej energii. Każdy tydzień to inna warstwa — od rozpoznania, przez oczyszczenie, po integrację i równowagę.',
    duration: 21,
    category: 'chakry',
    color: '#72C5A0',
    emoji: '⚡',
    whatYouLearn: [
      'Wszystkie 7 czakr — fizyczne i emocjonalne znaczenie',
      'Rozpoznawanie zablokowania vs przeciążenia czakry',
      'Techniki oddechowe dla każdego centrum energetycznego',
      'Mantry i afirmacje pracy z czakrami',
      'Budowanie codziennej praktyki energetycznej',
    ],
    testimonial: 'Po raz pierwszy naprawdę rozumiem, co czuję w ciele i dlaczego. Czakry stały się dla mnie prawdziwą mapą.',
    testimonialAuthor: 'Iwona, 44 lata',
    premium: true,
    days: Array.from({ length: 21 }, (_, i) => ({
      day: i + 1,
      title: [
        'Muladhara — korzeń', 'Svadhisthana — twórczość', 'Manipura — moc osobista',
        'Anahata — serce', 'Vishuddha — głos prawdy', 'Ajna — trzecie oko',
        'Sahasrara — korona', 'Przegląd tygodnia 1', 'Blokady Muladhary', 'Blokady Svadhishthany',
        'Blokady Manipury', 'Blokady Anahaty', 'Blokady Vishuddhy', 'Blokady Ajny',
        'Integracja blokad', 'Oczyszczanie korzenia', 'Oczyszczanie serca', 'Oczyszczanie głosu',
        'Balans całego systemu', 'Codzienna praktyka czakr', 'Zamknięcie i manifest',
      ][i],
      description: `Dzień ${i + 1} pracy z systemem czakr. Dedykowana praktyka, oddech i refleksja skupiona na konkretnym centrum energetycznym.`,
      taskType: (['meditation', 'breathwork', 'affirmation', 'journal', 'ritual'] as const)[i % 5],
    })),
  },
];

const BASE_JOURNEY_PHASES: JourneyPhase[] = [
  {
    id: 1,
    name: 'Przebudzenie',
    nameEn: 'Awakening',
    color: '#9B59B6',
    symbol: '◎',
    emoji: '🌅',
    durationHint: '7–14 dni',
    description: 'Przebudzenie to pierwszy krok na ścieżce transformacji duszy. To moment, w którym coś w Tobie poruszyło się — delikatny, lecz nieodwracalny impuls ku głębszemu rozumieniu siebie. Na tym etapie uczysz się dostrzegać wzorce, które dotąd działały w cieniu Twojej świadomości. Każde przebudzenie jest inne — dla jednych gwałtowne jak błyskawica, dla innych łagodne jak świt.',
    themes: ['Świadomość', 'Ciekawość', 'Wyczucie', 'Otwarcie', 'Pytania'],
    practices: ['Medytacja poranna 10 min', 'Dziennik snów', 'Cisza intencjonalna'],
    prompts: [
      'Co ostatnio mnie nurtuje, choć staram się tego nie zauważać?',
      'Kiedy po raz ostatni poczułem/am się w pełni żywy/a?',
      'Jakie wzorce w moim życiu powtarzają się mimo mojej woli?',
    ],
    crystalHint: 'Ametyst, Lapis Lazuli',
    elementHint: 'Powietrze — świeżość początku',
  },
  {
    id: 2,
    name: 'Eksploracja',
    nameEn: 'Exploration',
    color: '#3498DB',
    symbol: '⧫',
    emoji: '🗺',
    durationHint: '14–21 dni',
    description: 'Eksploracja to faza odważnego wychodzenia poza znane granice. Zaczynasz badać nowe obszary — zarówno zewnętrzne ścieżki wiedzy, jak i wewnętrzne terytoria, do których wcześniej się nie zapuszczałeś/aś. To czas eksperymentów, prób i błędów, ale też odkryć, które mogą Cię kompletnie zaskoczyć. Pozwól sobie na błądzenie — to właśnie ono prowadzi do najcenniejszych znalezisk.',
    themes: ['Odkrycie', 'Eksperyment', 'Odwaga', 'Otwartość', 'Ruch'],
    practices: ['Nowy rytuał co tydzień', 'Wyjście ze strefy komfortu', 'Czytanie mądrościowe'],
    prompts: [
      'Czego jeszcze nie próbowałem/am, a coś mnie ku temu ciągnie?',
      'Jakie przekonanie chciałbym/chciałabym dziś zakwestionować?',
      'Co by się stało, gdybym przez jeden dzień żył/a inaczej niż zwykle?',
    ],
    crystalHint: 'Akwamaryn, Labradoryt',
    elementHint: 'Woda — przepływ i odkrycie',
  },
  {
    id: 3,
    name: 'Zrozumienie',
    nameEn: 'Understanding',
    color: '#2ECC71',
    symbol: '✦',
    emoji: '💡',
    durationHint: '21–28 dni',
    description: 'Na etapie Zrozumienia zaczyna się układać mozaika. Fragmenty, które zbierałeś/aś podczas eksploracji, nagle tworzą spójny obraz. To czas głębokiego wglądu — kiedy wiesz, dlaczego działasz w określony sposób, ale też, kim naprawdę jesteś pod maską codziennych ról. Zrozumienie nie jest końcem — to most między tym, co było, a tym, czym możesz się stać.',
    themes: ['Wgląd', 'Połączenia', 'Klarowność', 'Wzorce', 'Sens'],
    practices: ['Mapowanie umysłu', 'Głęboka medytacja', 'Dialog z cieniem'],
    prompts: [
      'Jaki wzorzec nagle rozumiem inaczej niż tydzień temu?',
      'Co odkryłem/am o sobie, czego się nie spodziewałem/am?',
      'Jakie połączenie między przeszłością a teraźniejszością teraz widzę?',
    ],
    crystalHint: 'Zielony Awen, Fluoryt',
    elementHint: 'Ziemia — zakorzenienie w prawdzie',
  },
  {
    id: 4,
    name: 'Transformacja',
    nameEn: 'Transformation',
    color: '#E67E22',
    symbol: '🜂',
    emoji: '🔥',
    durationHint: '28–42 dni',
    description: 'Transformacja to serce całej podróży — i często jej najtrudniejszy etap. Stare struktury rozpadają się, by zrobić miejsce nowemu. Może być bolesna, dezorientująca, intensywna. Jednak właśnie w tym ogniu oczyszczenia rodzi się Twoja nowa jakość. Transformacja nie pyta o zgodę — ona po prostu zachodzi, gdy jesteś gotowy/a jej zaufać.',
    themes: ['Ogień', 'Rozpad', 'Odrodzenie', 'Odwaga', 'Zmiana'],
    practices: ['Praca z cieniem', 'Rytuał ognia', 'Intensywny dziennik'],
    prompts: [
      'Co musi umrzeć, żebym mógł/mogła naprawdę żyć?',
      'Jakiego lęku trzymam się najbardziej w tym momencie?',
      'Co czuję teraz, nie myśląc — co podpowiada ciało?',
    ],
    crystalHint: 'Czarny Turmalin, Karneol',
    elementHint: 'Ogień — alchemia duszy',
  },
  {
    id: 5,
    name: 'Integracja',
    nameEn: 'Integration',
    color: '#E74C3C',
    symbol: '⊕',
    emoji: '🧩',
    durationHint: '21–35 dni',
    description: 'Integracja to czas szycia wszystkiego w całość. Po burzliwej transformacji przychodzi chwila zatrzymania i przyjęcia wszystkich zmian — zarówno tych, które lubimy, jak i tych, które nas zaskoczyły. Integrujesz nowe ja ze starymi korzeniami, nowe przekonania z dawną mądrością. To faza praktyczna — przenoszenia wnętrza na zewnątrz, w codzienne wybory i relacje.',
    themes: ['Spójność', 'Cierpliwość', 'Praktyka', 'Akceptacja', 'Całość'],
    practices: ['Codzienne intencje', 'Recenzja tygodniowa', 'Wdzięczność za trudne'],
    prompts: [
      'Jak nowe rozumienie siebie zmienia moje codzienne decyzje?',
      'Co z siebie dawnego warto zabrać w przyszłość?',
      'Gdzie czuję, że stare i nowe ja wciąż się zmagają?',
    ],
    crystalHint: 'Różowy Kwarc, Morganit',
    elementHint: 'Ziemia — zakorzenienie zmian',
  },
  {
    id: 6,
    name: 'Mądrość',
    nameEn: 'Wisdom',
    color: '#F1C40F',
    symbol: '☽',
    emoji: '🌙',
    durationHint: '14–28 dni',
    description: 'Mądrość rodzi się z doświadczenia przebytej drogi. Na tym etapie nie tylko wiesz — czujesz to, co wiesz, w całym swoim ciele. Mądrość to nie suma faktów, lecz głęboka znajomość siebie i życia, która pojawia się cicho, bez ogłoszeń. Zaczynasz widzieć dalej, rozumieć więcej, wybaczać szybciej. Jesteś dla innych tym, czym Aethera jest dla Ciebie — przewodnikiem.',
    themes: ['Głębia', 'Spokój', 'Przewodnictwo', 'Intuicja', 'Perspektywa'],
    practices: ['Mentoring innych', 'Cisza kontemplacyjna', 'Symbolika i archetypy'],
    prompts: [
      'Czego ta droga nauczyła mnie, czego nie mogłem/am się nauczyć inaczej?',
      'Jak patrzę teraz na swoje dawne lęki?',
      'Co chciałbym/chciałabym przekazać komuś, kto zaczyna tę drogę?',
    ],
    crystalHint: 'Moonstone, Selenite',
    elementHint: 'Woda — głębia i refleksja',
  },
  {
    id: 7,
    name: 'Oświecenie',
    nameEn: 'Enlightenment',
    color: '#CEAE72',
    symbol: '✺',
    emoji: '☀️',
    durationHint: 'Bez końca',
    description: 'Oświecenie nie jest celem — jest sposobem istnienia. To nie jednorazowy moment olśnienia, lecz stały stan obecności i pełni. Na tym etapie ścieżka i chodź-ący stają się jednym. Nie szukasz już sensu — jesteś sensem. Każda chwila jest całkowita i wystarczająca. I choć brzmieć może abstrakcyjnie, każdy z nas zna momenty — krótkie błyski — gdy tak właśnie się czujemy.',
    themes: ['Obecność', 'Pełnia', 'Jedność', 'Pokój', 'Bycie'],
    practices: ['Nie-działanie', 'Obecność w chwili', 'Służba z miłości'],
    prompts: [
      'Kiedy ostatnio byłem/am w pełni obecny/a — bez planu, bez oceny?',
      'Czym jest dla mnie szczęście — nie jako cel, lecz jako stan?',
      'Co by się zmieniło, gdybym przez jeden dzień żył/a tak, jakby wszystko było doskonałe?',
    ],
    crystalHint: 'Diament, Czysty Kwarc',
    elementHint: 'Ether — przekraczanie żywiołów',
  },
];

const JOURNEY_PHASE_LOCALES: Record<'en', Record<number, Partial<JourneyPhase>>> = {
  en: {
    1: {
      name: 'Awakening',
      nameEn: 'Awakening',
      durationHint: '7–14 days',
      description: 'Awakening is the first step on the path of soul transformation. It is the moment when something within you begins to move: a subtle but irreversible impulse toward deeper self-understanding. At this stage you begin to notice patterns that used to operate beneath awareness. Every awakening is different. For some it arrives like lightning, for others like a quiet dawn.',
      themes: ['Awareness', 'Curiosity', 'Sensitivity', 'Opening', 'Questions'],
      practices: ['10-minute morning meditation', 'Dream journaling', 'Intentional silence'],
      prompts: [
        'What has been troubling me lately, even though I try not to look at it?',
        'When was the last time I felt fully alive?',
        'Which patterns in my life keep repeating against my will?',
      ],
      crystalHint: 'Amethyst, Lapis Lazuli',
      elementHint: 'Air — the freshness of a beginning',
    },
    2: {
      name: 'Exploration',
      nameEn: 'Exploration',
      durationHint: '14–21 days',
      description: 'Exploration is the phase of bravely moving beyond the familiar. You begin to investigate new territories: outer paths of knowledge and inner spaces you had not entered before. It is a time of experiments, trial and error, and discoveries that may surprise you completely. Let yourself wander. That wandering often leads to the most valuable findings.',
      themes: ['Discovery', 'Experiment', 'Courage', 'Openness', 'Movement'],
      practices: ['One new ritual each week', 'Leaving the comfort zone', 'Wisdom reading'],
      prompts: [
        'What have I not tried yet, even though something in me is drawn to it?',
        'Which belief would I like to question today?',
        'What would happen if I lived one day differently than usual?',
      ],
      crystalHint: 'Aquamarine, Labradorite',
      elementHint: 'Water — flow and discovery',
    },
    3: {
      name: 'Understanding',
      nameEn: 'Understanding',
      durationHint: '21–28 days',
      description: 'In Understanding, the mosaic begins to arrange itself. The fragments you gathered during exploration suddenly form a coherent picture. This is a time of deep insight, when you see why you act in certain ways and who you truly are beneath everyday roles. Understanding is not the end. It is the bridge between what was and what you can become.',
      themes: ['Insight', 'Connections', 'Clarity', 'Patterns', 'Meaning'],
      practices: ['Mind mapping', 'Deep meditation', 'Dialogue with the shadow'],
      prompts: [
        'Which pattern do I understand differently now than a week ago?',
        'What have I discovered about myself that I did not expect?',
        'What connection between the past and the present do I see now?',
      ],
      crystalHint: 'Green Awen, Fluorite',
      elementHint: 'Earth — grounding in truth',
    },
    4: {
      name: 'Transformation',
      nameEn: 'Transformation',
      durationHint: '28–42 days',
      description: 'Transformation is the heart of the entire journey, and often its most demanding stage. Old structures dissolve to make space for the new. It can feel painful, disorienting, and intense. Yet precisely in this fire of purification a new quality of self is born. Transformation does not ask for permission. It happens when you are ready to trust it.',
      themes: ['Fire', 'Dissolution', 'Rebirth', 'Courage', 'Change'],
      practices: ['Shadow work', 'Fire ritual', 'Intense journaling'],
      prompts: [
        'What must die so that I can truly live?',
        'Which fear am I clinging to most right now?',
        'What do I feel right now, beneath thought, in the body itself?',
      ],
      crystalHint: 'Black Tourmaline, Carnelian',
      elementHint: 'Fire — the alchemy of the soul',
    },
    5: {
      name: 'Integration',
      nameEn: 'Integration',
      durationHint: '21–35 days',
      description: 'Integration is the time of stitching everything into one whole. After the upheaval of transformation comes a pause in which you receive all change: the parts you like and the parts that surprised you. You are integrating the new self with old roots, new beliefs with old wisdom. This is a practical phase, bringing inner change into daily choices and relationships.',
      themes: ['Coherence', 'Patience', 'Practice', 'Acceptance', 'Wholeness'],
      practices: ['Daily intentions', 'Weekly review', 'Gratitude for the difficult'],
      prompts: [
        'How does my new self-understanding change my daily decisions?',
        'What from my former self is worth carrying into the future?',
        'Where do I still feel the old and new self struggling?',
      ],
      crystalHint: 'Rose Quartz, Morganite',
      elementHint: 'Earth — grounding the change',
    },
    6: {
      name: 'Wisdom',
      nameEn: 'Wisdom',
      durationHint: '14–28 days',
      description: 'Wisdom is born from the experience of the path already travelled. At this stage you do not only know, you feel what you know in your whole body. Wisdom is not a collection of facts but a deep familiarity with yourself and life that arrives quietly. You begin to see farther, understand more, and forgive more quickly. You become for others what Aethera has been for you: a guide.',
      themes: ['Depth', 'Calm', 'Guidance', 'Intuition', 'Perspective'],
      practices: ['Mentoring others', 'Contemplative silence', 'Symbols and archetypes'],
      prompts: [
        'What has this path taught me that I could not have learned any other way?',
        'How do I look now at my former fears?',
        'What would I want to offer someone who is just beginning this path?',
      ],
      crystalHint: 'Moonstone, Selenite',
      elementHint: 'Water — depth and reflection',
    },
    7: {
      name: 'Enlightenment',
      nameEn: 'Enlightenment',
      durationHint: 'Without end',
      description: 'Enlightenment is not a destination but a way of being. It is not a single flash of revelation but an ongoing state of presence and fullness. At this stage the path and the one who walks it become one. You are no longer searching for meaning. You are meaning. Each moment becomes complete and sufficient. And though it may sound abstract, everyone knows brief flashes of this state.',
      themes: ['Presence', 'Fullness', 'Unity', 'Peace', 'Being'],
      practices: ['Non-doing', 'Presence in the moment', 'Service from love'],
      prompts: [
        'When was the last time I was fully present, without plan and without judgment?',
        'What is happiness for me, not as a goal but as a state?',
        'What would change if I lived one day as if everything were already complete?',
      ],
      crystalHint: 'Diamond, Clear Quartz',
      elementHint: 'Ether — beyond the elements',
    },
  },
};

const translateJourneyField = (journeyId: string, field: string, fallback: string) =>
  i18n.t(`journeys.${journeyId}.${field}`, {
    defaultValue: resolveUserFacingText(fallback),
  }) as string;

const translateJourneyArray = (journeyId: string, field: string, fallback: string[]) => {
  const translated = i18n.t(`journeys.${journeyId}.${field}`, {
    returnObjects: true,
    defaultValue: resolveTextArray(fallback),
  });
  return Array.isArray(translated) ? translated.map((value) => String(value)) : resolveTextArray(fallback);
};

const translateJourneyDayField = (journeyId: string, day: number, field: string, fallback: string) =>
  i18n.t(`journeys.${journeyId}.days.${day}.${field}`, {
    defaultValue: resolveUserFacingText(fallback),
  }) as string;

export const getLocalizedJourneys = (): Journey[] =>
  BASE_JOURNEYS.map((journey) => ({
    ...journey,
    title: translateJourneyField(journey.id, 'title', journey.title),
    subtitle: translateJourneyField(journey.id, 'subtitle', journey.subtitle),
    description: translateJourneyField(journey.id, 'description', journey.description),
    whatYouLearn: translateJourneyArray(journey.id, 'whatYouLearn', journey.whatYouLearn),
    testimonial: translateJourneyField(journey.id, 'testimonial', journey.testimonial),
    testimonialAuthor: translateJourneyField(journey.id, 'testimonialAuthor', journey.testimonialAuthor),
    days: journey.days.map((day) => ({
      ...day,
      title: translateJourneyDayField(journey.id, day.day, 'title', day.title),
      description: translateJourneyDayField(journey.id, day.day, 'description', day.description),
    })),
  }));

export const getLocalizedJourneyPhases = (): JourneyPhase[] => {
  const locale = i18n.language?.startsWith('en') ? 'en' : 'pl';
  return BASE_JOURNEY_PHASES.map((phase) => {
    const localized = locale === 'en' ? JOURNEY_PHASE_LOCALES.en[phase.id] : undefined;
    return {
      ...phase,
      ...(localized || {}),
    };
  });
};
