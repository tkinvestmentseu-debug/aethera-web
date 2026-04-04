export interface Affirmation {
  id: string;
  text: string;
  category: 'love' | 'abundance' | 'success' | 'peace';
}

export const AFFIRMATIONS: Affirmation[] = [
  // MIŁOŚĆ
  { id: 'l1', category: 'love', text: 'Jestem godna miłości — zarówno dawania jej, jak i przyjmowania.' },
  { id: 'l2', category: 'love', text: 'Moje relacje rosną w zaufaniu, ciepłości i wzajemnym szacunku.' },
  { id: 'l3', category: 'love', text: 'Otwieram serce na bliskość bez lęku i bez maski.' },
  { id: 'l4', category: 'love', text: 'Przyciągam ludzi, którzy widzą mnie taką, jaka jestem, i kochają mnie za to.' },
  { id: 'l5', category: 'love', text: 'Daję sobie tę samą łagodność, jaką ofiaruję innym.' },
  { id: 'l6', category: 'love', text: 'Moje serce jest bezpieczne — mogę kochać i być kochana.' },
  { id: 'l7', category: 'love', text: 'Zasługuję na relację opartą na prawdzie, wolności i głębokiej więzi.' },

  // OBFITOŚĆ
  { id: 'a1', category: 'abundance', text: 'Pieniądze płyną do mnie naturalnie — jestem otwarta na ich przepływ.' },
  { id: 'a2', category: 'abundance', text: 'Tworzę wartość w świecie i z wdzięcznością przyjmuję jej zwrot.' },
  { id: 'a3', category: 'abundance', text: 'Obfitość jest moim naturalnym stanem — czuję to w każdym oddechu.' },
  { id: 'a4', category: 'abundance', text: 'Jestem gotowa przyjąć więcej dobrego, niż kiedykolwiek marzyłam.' },
  { id: 'a5', category: 'abundance', text: 'Moje zasoby rosną, gdy działam z intencją i spokojem.' },
  { id: 'a6', category: 'abundance', text: 'Zasługuję na dobrobyt — finansowy, emocjonalny i duchowy.' },
  { id: 'a7', category: 'abundance', text: 'Uwalniam przekonanie o braku i witam przepływ w każdej formie.' },

  // SUKCES
  { id: 's1', category: 'success', text: 'Moje działania są zgodne z moją najgłębszą intencją.' },
  { id: 's2', category: 'success', text: 'Każdy krok — nawet mały — prowadzi mnie bliżej tego, czego pragnę.' },
  { id: 's3', category: 'success', text: 'Mam w sobie wszystko, czego potrzebuję, by tworzyć to, co chcę.' },
  { id: 's4', category: 'success', text: 'Skupiam się na tym, co w mocy, i puszczam resztę.' },
  { id: 's5', category: 'success', text: 'Moje cele są jasne — kieruję energię tam, gdzie rośnie moc sprawczości.' },
  { id: 's6', category: 'success', text: 'Jestem zdolna do zmiany — uczę się, rosnę i wybieram mądrze.' },
  { id: 's7', category: 'success', text: 'Sukces nie omija mnie — przyciągam go swoją stałością i wizją.' },

  // SPOKÓJ
  { id: 'p1', category: 'peace', text: 'Jestem tu i teraz — to wystarczy.' },
  { id: 'p2', category: 'peace', text: 'Oddycham spokojnie — moje ciało wie, jak wrócić do równowagi.' },
  { id: 'p3', category: 'peace', text: 'Puszczam to, czego nie mogę kontrolować, i wracam do siebie.' },
  { id: 'p4', category: 'peace', text: 'Mój wewnętrzny spokój nie zależy od zewnętrznych okoliczności.' },
  { id: 'p5', category: 'peace', text: 'Wybieram łagodność wobec siebie — szczególnie kiedy jest najtrudniej.' },
  { id: 'p6', category: 'peace', text: 'Zaufanie do życia jest moją kotwicą — płynę, nie walczę.' },
  { id: 'p7', category: 'peace', text: 'Harmonia jest moim naturalnym rytmem — wracam do niej zawsze.' },
];

