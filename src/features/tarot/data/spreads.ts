import { TarotSpread } from '../types';

export const SPREADS: TarotSpread[] = [
  {
    id: 'daily',
    name: 'Karta dnia',
    description: 'Jeden symbol, jedna energia, jeden kierunek na dziś.',
    slots: [{ label: 'Esencja dnia', description: 'To, co chce dziś prowadzić Twoją uwagę.' }]
  },
  {
    id: 'three_cards',
    name: 'Trzy nici',
    description: 'Przeszłość, teraźniejszość i to, co właśnie się odsłania.',
    slots: [
      { label: 'To, co za Tobą', description: 'Energia lub wydarzenie, które nadal wpływa na sytuację.' },
      { label: 'To, co jest teraz', description: 'Aktualny stan energii i sedno sytuacji.' },
      { label: 'To, co się otwiera', description: 'Kierunek, który wyłania się z obecnego momentu.' }
    ]
  },
  {
    id: 'love_spread',
    name: 'Pole relacji',
    description: 'Odczyt dla miłości, więzi, napięć i emocjonalnej prawdy.',
    slots: [
      { label: 'Twoje serce', description: 'To, co czujesz naprawdę, pod spodem historii.' },
      { label: 'Druga strona', description: 'Energia lub intencja drugiej osoby.' },
      { label: 'Niewypowiedziane', description: 'To, co buduje napięcie albo dystans.' },
      { label: 'Lekcja relacji', description: 'To, czego relacja próbuje Cię nauczyć.' },
      { label: 'Najbliższy ruch', description: 'Najzdrowszy następny krok.' }
    ]
  },
  {
    id: 'career_success',
    name: 'Praca i powołanie',
    description: 'Rozkład dla decyzji zawodowych, kierunku i materializacji.',
    slots: [
      { label: 'Główna energia pracy', description: 'Jak wygląda rdzeń sytuacji zawodowej.' },
      { label: 'Ukryta blokada', description: 'To, co hamuje wzrost lub decyzję.' },
      { label: 'Mocny zasób', description: 'To, czym możesz się oprzeć o siebie.' },
      { label: 'Okno możliwości', description: 'To, co chce się teraz otworzyć.' },
      { label: 'Ruch strategiczny', description: 'Krok, który najlepiej służy Twojej ścieżce.' }
    ]
  },
  {
    id: 'shadow_work',
    name: 'Praca z cieniem',
    description: 'Rozkład do kontaktu z tym, co zostało wyparte, ukryte lub zatrzymane.',
    slots: [
      { label: 'To, co wypierasz', description: 'Energia, której nie chcesz widzieć.' },
      { label: 'Źródło napięcia', description: 'Skąd to naprawdę płynie.' },
      { label: 'Dar ukryty w cieniu', description: 'Jaką siłę ten obszar może odzyskać.' },
      { label: 'Świadomy krok', description: 'Jak wejść w ten temat bez przemocy wobec siebie.' }
    ]
  },
  {
    id: 'celtic_cross',
    name: 'Krzyż celtycki',
    description: 'Pełny dossier sytuacji z wielowarstwowym spojrzeniem na siły jawne i ukryte.',
    slots: [
      { label: 'Rdzeń sprawy', description: 'Centralna energia sytuacji.' },
      { label: 'To, co krzyżuje', description: 'Co komplikuje albo testuje tę energię.' },
      { label: 'Korzeń', description: 'Najgłębsze źródło sytuacji.' },
      { label: 'To, co odchodzi', description: 'Energia, która przestaje dominować.' },
      { label: 'To, co możliwe', description: 'Najwyższy potencjał tej sytuacji.' },
      { label: 'Najbliższa przyszłość', description: 'To, co zbliża się jako pierwsze.' },
      { label: 'Twoja postawa', description: 'Jak stajesz wobec tego wszystkiego.' },
      { label: 'Wpływy zewnętrzne', description: 'Otoczenie, ludzie i siły poza Tobą.' },
      { label: 'Nadzieje i lęki', description: 'To, co trzyma Cię pomiędzy pragnieniem a obawą.' },
      { label: 'Kulminacja', description: 'Najbardziej prawdopodobny kierunek.' }
    ]
  },
  {
    id: 'yes_no',
    name: 'Tak / Nie z kontekstem',
    description: 'Krótki odczyt dla decyzji, ale bez spłycania odpowiedzi do samego werdyktu.',
    slots: [{ label: 'Werdykt i ton', description: 'Czy energia sprzyja, blokuje czy prosi o wstrzymanie ruchu.' }]
  }
];
