export interface DreamSymbol {
  id: string;
  keyword: string;
  meaning: string;
  emotionalTheme: string;
  followUpPrompt: string;
}

export const DREAM_DICTIONARY: DreamSymbol[] = [
  {
    id: 'd1',
    keyword: 'Woda',
    meaning: 'Woda w snach często odsłania stan emocji. Spokojna przynosi regulację i płynięcie z intuicją, wzburzona pokazuje przeciążenie lub uczucia, którym trudno nadać formę.',
    emotionalTheme: 'Emocje i intuicja',
    followUpPrompt: 'Jakie uczucie domaga się dziś łagodnego nazwania zamiast tłumienia?',
  },
  {
    id: 'd2',
    keyword: 'Dom',
    meaning: 'Dom symbolizuje wewnętrzny świat, poczucie bezpieczeństwa i strukturę psychiczną. Konkretne pomieszczenia mogą wskazywać obszary życia, które wołają o uwagę.',
    emotionalTheme: 'Bezpieczeństwo i tożsamość',
    followUpPrompt: 'Która część Twojego życia wymaga dziś odbudowania poczucia oparcia?',
  },
  {
    id: 'd3',
    keyword: 'Las',
    meaning: 'Las oznacza wejście w nieznane, kontakt z podświadomością i z tym, co nie zostało jeszcze nazwane. Może zapraszać do odkrycia ukrytego aspektu siebie.',
    emotionalTheme: 'Nieznane i intuicja',
    followUpPrompt: 'W jakim obszarze życia wiesz mniej, niż próbujesz udawać przed sobą?',
  },
  {
    id: 'd4',
    keyword: 'Lot',
    meaning: 'Latanie bywa znakiem wolności, ekspansji i odzyskiwania perspektywy. Jeśli we śnie pojawia się lęk podczas lotu, może to oznaczać trudność w utrzymaniu kontroli.',
    emotionalTheme: 'Wolność i kontrola',
    followUpPrompt: 'Gdzie potrzebujesz dziś więcej zaufania, a mniej kurczowego trzymania kierunku?',
  },
  {
    id: 'd5',
    keyword: 'Pościg',
    meaning: 'Bycie ściganym pokazuje energię uniku. Sen sugeruje, że jakaś emocja, decyzja albo temat wraca, bo nie został świadomie domknięty.',
    emotionalTheme: 'Unik i napięcie',
    followUpPrompt: 'Przed czym próbujesz uciekać, choć wiesz, że wymaga to nazwania?',
  },
  {
    id: 'd6',
    keyword: 'Zęby',
    meaning: 'Motyw zębów często dotyczy kontroli, wizerunku, utraty siły lub napięcia ukrytego pod powierzchnią. To sen o kruchości tego, co wydaje się stabilne.',
    emotionalTheme: 'Kruchość i lęk',
    followUpPrompt: 'Co w Twoim życiu wygląda stabilnie, ale w środku już wymaga opieki?',
  },
  {
    id: 'd7',
    keyword: 'Dziecko',
    meaning: 'Dziecko w śnie bywa obrazem wrażliwej części siebie, nowego początku albo potrzeby delikatniejszego kontaktu z własnymi emocjami.',
    emotionalTheme: 'Wrażliwość i początek',
    followUpPrompt: 'Która część Ciebie potrzebuje dziś łagodności zamiast oceny?',
  },
  {
    id: 'd8',
    keyword: 'Pociąg',
    meaning: 'Pociąg dotyczy kierunku życia i poczucia, że coś już ruszyło. Sen może pytać, czy jedziesz swoim rytmem, czy raczej podążasz cudzym torem.',
    emotionalTheme: 'Kierunek i tempo',
    followUpPrompt: 'Czy tempo, w którym dziś żyjesz, naprawdę jest Twoje?',
  },
  {
    id: 'd9',
    keyword: 'Schody',
    meaning: 'Schody pokazują przejście pomiędzy poziomami świadomości. Wchodzenie sugeruje rozwój, schodzenie zejście do głębszych warstw lub pamięci.',
    emotionalTheme: 'Przejście i rozwój',
    followUpPrompt: 'Na jakim progu stoisz teraz emocjonalnie lub życiowo?',
  },
  {
    id: 'd10',
    keyword: 'Ocean',
    meaning: 'Ocean wzmacnia temat podświadomości, ogromu i tego, co wymyka się kontroli rozumu. To symbol siły, która jest większa niż chwilowe napięcie.',
    emotionalTheme: 'Podświadomość i ogrom',
    followUpPrompt: 'Co jest dziś w Tobie większe niż słowa, ale chce zostać zauważone?',
  },
  {
    id: 'd11',
    keyword: 'Ogień',
    meaning: 'Ogień oznacza transformację, intensywność i energię, która może oczyszczać lub niszczyć. Wiele zależy od tego, czy sen pokazuje ciepło, czy zagrożenie.',
    emotionalTheme: 'Transformacja i intensywność',
    followUpPrompt: 'Jaka energia chce Cię oczyścić, a jaka zaczyna już wypalać?',
  },
  {
    id: 'd12',
    keyword: 'Ptak',
    meaning: 'Ptaki niosą wiadomość o perspektywie, wolności i sygnale z subtelniejszej warstwy psychiki. Często są zaproszeniem do spojrzenia szerzej.',
    emotionalTheme: 'Perspektywa i znak',
    followUpPrompt: 'Co zobaczysz inaczej, jeśli dziś przestaniesz patrzeć tylko z poziomu problemu?',
  },
];
