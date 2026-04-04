import { resolveUserFacingText } from '../../../core/utils/contentResolver';
import { TarotCardData, TarotSpread, TarotSuit } from '../types';

type ReadingCard = { slotIndex: number; card: TarotCardData; isReversed: boolean };

type TarotContextMode = 'solo' | 'partner';

interface MajorProfile {
  archetype: string;
  lesson: string;
  relationship: string;
  practical: string;
  spiritual: string;
}

interface SuitProfile {
  label: string;
  domain: string;
  emotional: string;
  relational: string;
  practical: string;
  spiritual: string;
}

interface RankProfile {
  label: string;
  lesson: string;
  momentum: string;
  challenge: string;
}

export interface TarotCardInterpretation {
  cardName: string;
  orientationLabel: string;
  roleLabel: string;
  archetypeLine: string;
  contextualMeaning: string;
  adviceLine: string;
  promptLine: string;
  relationLine: string;
}

const SUIT_PROFILES: Record<Exclude<TarotSuit, 'major'>, SuitProfile> = {
  cups: {
    label: 'Kielichy',
    domain: 'emocje, więź, wrażliwość i intuicja',
    emotional: 'czyta stan serca, czułość, tęsknotę i to, jak przepływają uczucia',
    relational: 'pokazuje wzajemność, bliskość, brak odpowiedzi emocjonalnej albo potrzebę ukojenia',
    practical: 'przekłada się na rozmowy, pojednanie, regulację emocji i decyzje podejmowane z poziomu serca',
    spiritual: 'dotyka intuicji, snów, empatii i duchowego nasycenia',
  },
  swords: {
    label: 'Miecze',
    domain: 'myśli, prawda, konflikt, wybór i granice',
    emotional: 'czyta lęk, napięcie mentalne, surowe wnioski i rozdarcie',
    relational: 'pokazuje tarcie, niewypowiedzianą prawdę, chłód, obronę albo potrzebę szczerej rozmowy',
    practical: 'przekłada się na decyzje, komunikację, konflikt, kontrakt i jasne granice',
    spiritual: 'dotyka prawdy, iluzji, przejrzenia i cięcia tego, co już nie działa',
  },
  wands: {
    label: 'Buławy',
    domain: 'wola, pasja, inicjatywa, ogień i kierunek działania',
    emotional: 'czyta zapał, gniew, ekscytację, odwagę i impuls do ruchu',
    relational: 'pokazuje chemię, pociąg, tarcie ego, walkę o przestrzeń albo wspólny zapłon',
    practical: 'przekłada się na start, ryzyko, przywództwo, tempo i śmiałość decyzji',
    spiritual: 'dotyka powołania, iskry życia i ognia, który chce się urzeczywistnić',
  },
  pentacles: {
    label: 'Denary',
    domain: 'materia, ciało, praca, bezpieczeństwo i zasoby',
    emotional: 'czyta potrzebę gruntu, poczucia bezpieczeństwa i długiego oddechu',
    relational: 'pokazuje, czy relacja daje stabilność, wkład, opiekę i codzienną wiarygodność',
    practical: 'przekłada się na pieniądze, ciało, nawyki, pracę i trwały rezultat',
    spiritual: 'dotyka ucieleśnienia, cierpliwości i tego, jak duchowość schodzi do codzienności',
  },
};

const RANK_PROFILES: Record<number, RankProfile> = {
  1: { label: 'As', lesson: 'początek i czysty zalążek energii', momentum: 'coś chce się właśnie narodzić', challenge: 'energia jest jeszcze delikatna i łatwo ją zgasić' },
  2: { label: 'Dwójka', lesson: 'spotkanie dwóch sił, wybór i równowaga', momentum: 'decyduje się to, jak połączyć dwa bieguny', challenge: 'impas lub rozdarcie może zatrzymać ruch' },
  3: { label: 'Trójka', lesson: 'wzrost, pierwsze owoce i rozwinięcie', momentum: 'energia zaczyna wychodzić poza sam impuls', challenge: 'zbyt szybkie oczekiwanie pełnego rezultatu' },
  4: { label: 'Czwórka', lesson: 'stabilizacja, zatrzymanie i zabezpieczenie', momentum: 'trzeba zbudować grunt albo schronienie', challenge: 'zastój, nuda lub zabetonowanie ruchu' },
  5: { label: 'Piątka', lesson: 'napięcie, kryzys, tarcie i test', momentum: 'coś przestaje działać tak jak wcześniej', challenge: 'reakcja obronna może pogłębić rozbicie' },
  6: { label: 'Szóstka', lesson: 'przywracanie przepływu, wymiana i ruch ku harmonii', momentum: 'pojawia się droga wyjścia albo nowy układ sił', challenge: 'łatwo pomylić ulgę z pełnym rozwiązaniem' },
  7: { label: 'Siódemka', lesson: 'próba, sprawdzian i konfrontacja z tym, co niepewne', momentum: 'trzeba stanąć wobec własnego stanowiska albo pokusy', challenge: 'rozproszenie albo defensywność' },
  8: { label: 'Ósemka', lesson: 'ruch, pogłębienie lub dyscyplina', momentum: 'energia przyspiesza albo schodzi w rzemiosło', challenge: 'tempo lub perfekcjonizm mogą zjadać sens' },
  9: { label: 'Dziewiątka', lesson: 'kulminacja, dojrzałość i granica wytrzymałości', momentum: 'zbliża się wynik, ale jeszcze nie koniec całego cyklu', challenge: 'zmęczenie, pycha albo lęk przed stratą' },
  10: { label: 'Dziesiątka', lesson: 'domknięcie, pełnia albo przeciążenie końca cyklu', momentum: 'coś dochodzi do skraju i wymaga przejścia dalej', challenge: 'noszenie zbyt dużego ciężaru albo trzymanie tego, co już się skończyło' },
  11: { label: 'Paź', lesson: 'wiadomość, uczenie się i młoda forma energii', momentum: 'pojawia się sygnał, ciekawość albo świeży impuls', challenge: 'niedojrzałość albo brak kierunku' },
  12: { label: 'Rycerz', lesson: 'ruch, misja i sposób działania tej energii', momentum: 'energia chce wejść w świat i coś uruchomić', challenge: 'pośpiech, skrajność albo nieczytanie konsekwencji' },
  13: { label: 'Królowa', lesson: 'ucieleśnienie, dojrzała receptywność i wewnętrzna władza', momentum: 'energia staje się stylem bycia, a nie tylko akcją', challenge: 'cień tej mocy staje się zbyt silny lub zamknięty' },
  14: { label: 'Król', lesson: 'opanowanie, odpowiedzialność i świadome kierowanie energią', momentum: 'ta energia chce stanąć jako autorytet lub filar', challenge: 'kontrola, pycha albo zbyt sztywne rządzenie' },
};

const MAJOR_PROFILES: Record<number, MajorProfile> = {
  0: { archetype: 'próg nowej drogi i ryzyko zaufania życiu', lesson: 'ruszyć mimo braku pełnej mapy', relationship: 'pokazuje świeżość, spontaniczność albo niedojrzałość więzi', practical: 'sprzyja startowi, testowaniu i pierwszemu krokowi', spiritual: 'otwiera drogę Głupca: naukę przez doświadczenie' },
  1: { archetype: 'świadoma sprawczość i kierowanie wolą', lesson: 'użyć narzędzi zamiast rozpraszać potencjał', relationship: 'pyta, kto realnie wpływa na bieg relacji', practical: 'wzmacnia manifestację, kompetencję i intencjonalne działanie', spiritual: 'pokazuje zestrojenie zamiaru, słowa i czynu' },
  2: { archetype: 'wiedza ukryta, intuicja i cisza wewnętrzna', lesson: 'nie wymuszać odpowiedzi, tylko ją usłyszeć', relationship: 'pokazuje niedopowiedzenie, tajemnicę albo głębokie przeczucie', practical: 'radzi czytać subtelne sygnały i nie odkrywać wszystkiego zbyt wcześnie', spiritual: 'wzmacnia kontakt z podświadomością i świętą ciszą' },
  3: { archetype: 'obfitość, ciało, płodność i życiodajność', lesson: 'pozwolić, by coś wzrosło bez nadmiernej kontroli', relationship: 'sprzyja czułości, opiece i zmysłowości', practical: 'wspiera twórczość, rozwój, wzrost i pielęgnowanie', spiritual: 'łączy duchowość z naturą, ciałem i przyjmowaniem' },
  4: { archetype: 'struktura, granica i porządek', lesson: 'ustanowić ramę, która chroni, a nie tłumi', relationship: 'pokazuje temat kontroli, odpowiedzialności i układu sił', practical: 'wspiera strategię, autorytet i decyzję opartą na strukturze', spiritual: 'uczy dojrzałego używania mocy' },
  5: { archetype: 'tradycja, nauka i przekaz wartości', lesson: 'odróżnić żywą mądrość od martwego dogmatu', relationship: 'pyta o wspólne wartości, rytuały i oczekiwania wobec więzi', practical: 'sprzyja nauce, mentorstwu i działaniu według zasad', spiritual: 'otwiera dostęp do duchowej linii przekazu' },
  6: { archetype: 'wybór serca, zgodność wartości i relacja', lesson: 'wybrać w zgodzie z tym, co naprawdę kochasz', relationship: 'to karta chemii, przyciągania i prawdy o wzajemności', practical: 'każe zobaczyć koszt wyboru, nie tylko jego urok', spiritual: 'łączy miłość z odpowiedzialnością za wybór' },
  7: { archetype: 'kierunek, wola i opanowanie rozproszonej siły', lesson: 'utrzymać kurs mimo nacisku z zewnątrz', relationship: 'pokazuje, czy relacja ma wspólny kierunek czy dwa różne zaprzęgi', practical: 'sprzyja przejęciu steru, dyscyplinie i ruchowi naprzód', spiritual: 'uczy prowadzić energię, a nie jej ulegać' },
  8: { archetype: 'siła wewnętrzna, czuła odwaga i panowanie nad impulsem', lesson: 'nie wygrać przemocą, tylko dojrzałością serca', relationship: 'pokazuje łagodną moc, cierpliwość albo ukryty gniew', practical: 'wspiera wytrwałość, regulację i wpływ bez dominacji', spiritual: 'łączy serce, ciało i instynkt w jedną siłę' },
  9: { archetype: 'samotna mądrość, wycofanie i wewnętrzny przewodnik', lesson: 'odsunąć hałas, by usłyszeć prawdę', relationship: 'pokazuje potrzebę przestrzeni, dystansu lub dojrzewania w samotności', practical: 'radzi nie przyspieszać decyzji przed refleksją', spiritual: 'otwiera drogę światła znalezionego w ciszy' },
  10: { archetype: 'cykl losu, obrót wydarzeń i punkt zwrotny', lesson: 'czytać zmianę jako część większego rytmu', relationship: 'pokazuje zmienność, losowe spotkanie albo powracający wzorzec', practical: 'sprzyja ruchowi z nurtem, a nie walce z nieuniknionym', spiritual: 'uczy zaufania do cyklu, nie do pełnej kontroli' },
  11: { archetype: 'prawda, odpowiedzialność i równowaga skutków', lesson: 'zobaczyć sprawę bez upiększeń i bez wymówek', relationship: 'pyta o uczciwość, wzajemność i realne konsekwencje działań', practical: 'wspiera decyzje prawne, kontrakty i rozliczenie', spiritual: 'uczy karmicznej odpowiedzialności' },
  12: { archetype: 'zawieszenie, odwrócenie perspektywy i świadome zatrzymanie', lesson: 'przestać pchać, zacząć widzieć inaczej', relationship: 'pokazuje stan zawieszenia, poświęcenia lub jednostronnego wysiłku', practical: 'radzi wstrzymać nacisk i przewartościować plan', spiritual: 'otwiera przez oddanie i nowy punkt widzenia' },
  13: { archetype: 'nieodwracalna transformacja i przejście przez koniec', lesson: 'pozwolić umrzeć temu, co już się domknęło', relationship: 'pokazuje koniec starej dynamiki albo konieczność głębokiej przemiany więzi', practical: 'sprzyja cięciu, domknięciu i przejściu do nowego etapu', spiritual: 'uczy, że śmierć w tarocie jest bramą, nie karą' },
  14: { archetype: 'alchemia, równowaga i dojrzewanie przez proporcję', lesson: 'łączyć, a nie rozrywać przeciwieństwa', relationship: 'sprzyja pojednaniu, regulacji i spokojnemu dostrajaniu rytmu', practical: 'wspiera proces, terapię, uzdrawianie i cierpliwe budowanie', spiritual: 'uczy świętej sztuki łączenia i harmonizowania' },
  15: { archetype: 'uwiązanie, cień i pokusa kontroli przez pożądanie lub lęk', lesson: 'nazwać to, co trzyma w zależności', relationship: 'pokazuje obsesję, silne przyciąganie, współuzależnienie albo erotyczne napięcie', practical: 'każe zobaczyć cenę nawyku, kontraktu lub kompulsji', spiritual: 'wzywa do zejścia w cień bez ucieczki w wstyd' },
  16: { archetype: 'nagłe pęknięcie fałszu i brutalna prawda', lesson: 'przestać bronić konstrukcji, która już nie stoi', relationship: 'pokazuje kryzys, wybuch lub prawdę, której nie da się już trzymać pod dywanem', practical: 'przynosi reset, awarię, przełom lub konieczny demontaż', spiritual: 'oczyszcza przez rozpad iluzji' },
  17: { archetype: 'nadzieja, odnowa i czysty oddech po burzy', lesson: 'pozwolić sobie wrócić do zaufania', relationship: 'sprzyja szczerości, delikatnej bliskości i leczeniu po pęknięciu', practical: 'wspiera spokojną odbudowę i kierunek oparty na sensie', spiritual: 'otwiera na łaskę, inspirację i autentyczność' },
  18: { archetype: 'nocne lustro, intuicja i świat niepewności', lesson: 'nie mylić lęku z intuicją', relationship: 'pokazuje projekcje, niejasność, sekret albo emocjonalną mgłę', practical: 'radzi zwolnić, sprawdzić fakty i nie działać z paniki', spiritual: 'uczy poruszania się po cieniu, snach i symbolach' },
  19: { archetype: 'jasność, życiodajność i pełne ujawnienie energii', lesson: 'pozwolić sobie być widzialnym bez maski', relationship: 'sprzyja szczerości, radości, prostocie i ciepłu', practical: 'wspiera sukces, widoczność, rozkwit i odzyskanie sił', spiritual: 'przynosi przejrzystość i zaufanie do życia' },
  20: { archetype: 'przebudzenie, wezwanie i rozliczenie z przeszłością', lesson: 'odpowiedzieć na to, co naprawdę wzywa', relationship: 'pokazuje moment prawdy, decyzji i wyjścia z dawnego schematu', practical: 'wspiera osąd, decyzję po bilansie i nowy rozdział', spiritual: 'łączy przebaczenie z odpowiedzialnym przebudzeniem' },
  21: { archetype: 'domknięcie, integracja i dojrzała pełnia cyklu', lesson: 'uznać całość drogi i wejść w następny poziom zintegrowanym ruchem', relationship: 'sprzyja dojrzałej całości, wspólnemu etapowi albo uczciwemu domknięciu', practical: 'wspiera finał, sukces, podróż i pełny rezultat', spiritual: 'pokazuje pełnię drogi Głupca i integrację doświadczenia' },
};

const clean = (value: string) => resolveUserFacingText(value).replace(/\s+/g, ' ').trim();

const orientationLabel = (isReversed: boolean) => (isReversed ? 'Odwrócona' : 'Prosta');


const MINOR_SUITS = ['cups', 'pentacles', 'swords', 'wands'] as const;
const isMajor = (card: TarotCardData): boolean =>
  card.suit === 'major' || !MINOR_SUITS.includes(card.suit as any);

const getSuitProfile = (card: TarotCardData) => isMajor(card) ? null : SUIT_PROFILES[card.suit as keyof typeof SUIT_PROFILES];

const getRankProfile = (card: TarotCardData) => isMajor(card) ? null : RANK_PROFILES[card.value];

const getMajorProfile = (card: TarotCardData) => isMajor(card) ? MAJOR_PROFILES[card.value] : null;

const getRoleLabel = (card: TarotCardData) => {
  if (isMajor(card)) return 'Wielkie Arkana';
  const rank = getRankProfile(card);
  const suit = getSuitProfile(card);
  const suitGen: Record<string,string> = { cups: 'Kielichów', swords: 'Mieczy', wands: 'Buław', pentacles: 'Denarow' };
  const suitName = !isMajor(card) ? (suitGen[card.suit as string] || '') : '';
  return ((rank && rank.label ? rank.label : 'Karta') + ' ' + (suitName || '')).trim();
};

const getSlotInsight = (spread: TarotSpread | null, slotIndex: number) => {
  const slot = spread?.slots?.[slotIndex];
  if (!slot) {
    return {
      label: 'Główna energia',
      description: 'czyta tę kartę jako ogólny ton sytuacji',
    };
  }
  return {
    label: slot.label,
    description: slot.description,
  };
};

const buildMajorContext = (card: TarotCardData, isReversed: boolean, mode: TarotContextMode) => {
  const profile = getMajorProfile(card)!;
  return {
    archetypeLine: `${clean(card.name)} wnosi wielką lekcję: ${profile.archetype}.`,
    contextualMeaning: isReversed
      ? `W odwróceniu ta karta pokazuje, że lekcja "${profile.lesson}" jest zatrzymana, wypierana albo przeżywana od środka z większym oporem. ${clean(card.description)} ${clean(card.meaningReversed)}`
      : `W pozycji prostej ta karta otwiera lekcję "${profile.lesson}" z pełniejszą jasnością. ${clean(card.description)} ${clean(card.meaningUpright)}`,
    relationLine: mode === 'partner'
      ? `W polu relacji karta czyta przede wszystkim: ${profile.relationship}.`
      : `W praktyce serca i relacji ta karta mówi o tym, że ${profile.relationship}.`,
    practicalLine: `Na poziomie codziennego ruchu ta karta podpowiada: ${profile.practical}.`,
    spiritualLine: `Na poziomie duchowym przypomina, że ${profile.spiritual}.`,
  };
};

const buildMinorContext = (card: TarotCardData, isReversed: boolean, mode: TarotContextMode) => {
  const suit = getSuitProfile(card)!;
  const rank = getRankProfile(card)!;
  return {
    archetypeLine: `${clean(card.name)} należy do ${suit.label.toLowerCase()} i niesie temat: ${suit.domain}.`,
    contextualMeaning: isReversed
      ? `W odwróceniu ${rank.label.toLowerCase()} pokazuje cień tej energii: ${rank.challenge}. ${clean(card.description)} ${clean(card.meaningReversed)}`
      : `W pozycji prostej ${rank.label.toLowerCase()} pokazuje ${rank.lesson}; tutaj szczególnie widać, że ${rank.momentum}. ${clean(card.description)} ${clean(card.meaningUpright)}`,
    relationLine: mode === 'partner'
      ? `W relacji ta karta czyta pole "${suit.relational}" i sprawdza, jak ${rank.label.toLowerCase()} tej energii ustawia wzajemność.`
      : `W relacjach karta mówi o tym, że ${suit.relational}.`,
    practicalLine: `Na poziomie realnych działań ${suit.practical}.`,
    spiritualLine: `Pod spodem działa też warstwa: ${suit.spiritual}.`,
  };
};

export const buildTarotCardInterpretation = (
  card: TarotCardData,
  isReversed: boolean,
  options?: {
    spread?: TarotSpread | null;
    slotIndex?: number;
    question?: string;
    mode?: TarotContextMode;
  }
): TarotCardInterpretation => {
  const mode = options?.mode || 'solo';
  const slot = getSlotInsight(options?.spread || null, options?.slotIndex ?? 0);
  const context = isMajor(card)
    ? buildMajorContext(card, isReversed, mode)
    : buildMinorContext(card, isReversed, mode);
  const questionLine = options?.question?.trim()
    ? `W odniesieniu do pytania "${options.question.trim()}" ta karta najmocniej dotyka osi "${slot.label}".`
    : `Ta karta ustawia ton osi "${slot.label}".`;

  return {
    cardName: clean(card.name),
    orientationLabel: orientationLabel(isReversed),
    roleLabel: getRoleLabel(card),
    archetypeLine: context.archetypeLine,
    contextualMeaning: `${questionLine} ${context.contextualMeaning} Pozycja "${slot.label}" mówi o tym, że ${slot.description.toLowerCase()}.`,
    adviceLine: `${context.practicalLine} ${clean(card.advice)}`,
    promptLine: `${context.spiritualLine} ${context.practicalLine}`,
    relationLine: context.relationLine,
  };
};

const buildFieldSentence = (
  cards: ReadingCard[],
  spread: TarotSpread | null,
  question: string,
  mode: TarotContextMode
) => {
  const majors = cards.filter((item) => isMajor(item.card));
  const reversed = cards.filter((item) => item.isReversed);
  const suits = new Set(cards.filter((item) => !isMajor(item.card)).map((item) => item.card.suit));
  const spreadLabel = spread?.name || 'ten odczyt';
  const base = question
    ? `Pytanie "${question}" nie prosi tu o pustą wróżbę, tylko o prawdziwe czytanie pola, które odsłonił rozkład ${spreadLabel}.`
    : `Ten odczyt nie działa jak ogólna afirmacja. Rozkład ${spreadLabel} pokazuje konkretny układ sił, a nie jedną uniwersalną radę.`;

  const majorLine = majors.length > 0
    ? `Dominanta Wielkich Arkanów sugeruje, że stawką jest większa lekcja niż pojedynczy nastrój: ${majors.map((item) => clean(item.card.name)).join(', ')}.`
    : 'To czytanie działa bardziej przez codzienny wzorzec i praktyczne napięcia niż przez jedną wielką karmiczną lekcję.';

  const suitLine = suits.size > 0
    ? `Najmocniej pracują tu energie ${Array.from(suits).map((suit) => SUIT_PROFILES[suit as Exclude<TarotSuit, 'major'>].label.toLowerCase()).join(', ')}, więc odczyt ma wyraźny własny żywioł.`
    : 'Cały ciężar sesji opiera się na Arkanach Wielkich, więc czytanie ma charakter archetypiczny i przełomowy.';

  const reversalLine = reversed.length > 0
    ? `Odwrócone karty nie są tu ozdobą. Pokazują miejsca oporu, zaciśnięcia albo wewnętrznego konfliktu: ${reversed.map((item) => clean(item.card.name)).join(', ')}.`
    : 'Brak odwróceń wzmacnia wrażenie, że energia chce się ujawnić dość wprost, bez maskowania głównego tematu.';

  const relationLine = mode === 'partner'
    ? 'W trybie relacyjnym liczy się nie tylko to, co czujesz Ty, ale to, co buduje pole między dwiema osobami: wzajemność, ukryte napięcie i gotowość do rozmowy.'
    : 'Ten odczyt czyta przede wszystkim Twój własny rdzeń sytuacji: emocję, decyzję, lęk albo gotowość do ruchu.';

  return [base, majorLine, suitLine, reversalLine, relationLine].join(' ');
};

export const buildTarotReadingFallback = (params: {
  question: string;
  spread: TarotSpread | null;
  cards: ReadingCard[];
  mode?: TarotContextMode;
  deckName?: string;
}) => {
  const mode = params.mode || 'solo';
  const lead = buildFieldSentence(params.cards, params.spread, params.question, mode);
  const cardThreads = params.cards
    .map((item) => {
      const interpretation = buildTarotCardInterpretation(item.card, item.isReversed, {
        spread: params.spread,
        slotIndex: item.slotIndex,
        question: params.question,
        mode,
      });
      return `${interpretation.cardName} w pozycji "${getSlotInsight(params.spread, item.slotIndex).label}" wnosi oś: ${interpretation.contextualMeaning}`;
    })
    .join(' ');

  const action = params.cards[params.cards.length - 1];
  const actionInterpretation = action
    ? buildTarotCardInterpretation(action.card, action.isReversed, {
        spread: params.spread,
        slotIndex: action.slotIndex,
        question: params.question,
        mode,
      })
    : null;

  const deckLine = params.deckName
    ? `Talia ${params.deckName} może zmienić klimat języka odczytu, ale nie zmienia rdzenia znaczeń kart.`
    : '';

  return `${lead} ${cardThreads} ${actionInterpretation ? `Najbardziej dojrzały ruch prowadzi przez ${actionInterpretation.cardName}: ${actionInterpretation.adviceLine}` : ''} ${deckLine}`.replace(/\s+/g, ' ').trim();
};

export const buildTarotReadingSections = (params: {
  interpretation?: string;
  question: string;
  spread: TarotSpread | null;
  cards: ReadingCard[];
  mode?: TarotContextMode;
}) => {
  const mode = params.mode || 'solo';
  const primary = params.cards[0];
  const middle = params.cards[Math.min(1, Math.max(0, params.cards.length - 1))];
  const last = params.cards[params.cards.length - 1];

  const firstDetail = primary
    ? buildTarotCardInterpretation(primary.card, primary.isReversed, { spread: params.spread, slotIndex: primary.slotIndex, question: params.question, mode })
    : null;
  const middleDetail = middle
    ? buildTarotCardInterpretation(middle.card, middle.isReversed, { spread: params.spread, slotIndex: middle.slotIndex, question: params.question, mode })
    : null;
  const lastDetail = last
    ? buildTarotCardInterpretation(last.card, last.isReversed, { spread: params.spread, slotIndex: last.slotIndex, question: params.question, mode })
    : null;

  const hidden = params.cards.find((item) => item.isReversed);
  const hiddenDetail = hidden
    ? buildTarotCardInterpretation(hidden.card, hidden.isReversed, { spread: params.spread, slotIndex: hidden.slotIndex, question: params.question, mode })
    : null;

  return [
    {
      title: 'Rdzeń odczytu',
      body: firstDetail
        ? `${firstDetail.archetypeLine} ${firstDetail.contextualMeaning}`
        : 'Ten odczyt stawia dziś jedną wyraźną oś, którą warto nazwać bez pośpiechu.',
    },
    {
      title: 'To, co pracuje pod spodem',
      body: middleDetail
        ? `${middleDetail.relationLine} ${middleDetail.promptLine}`
        : 'Pod spodem działa warstwa, której nie da się przeczytać wyłącznie na poziomie powierzchownego nastroju.',
    },
    {
      title: mode === 'partner' ? 'Pole relacji' : 'Emocjonalna prawda',
      body: hiddenDetail
        ? `${hiddenDetail.cardName} pokazuje miejsce oporu: ${hiddenDetail.contextualMeaning}`
        : mode === 'partner'
          ? 'Relacja nie pyta tu tylko o uczucia, lecz o wzajemność, napięcie i gotowość do szczerego ruchu.'
          : 'Ten odczyt pyta o to, co jest prawdziwe pod deklaracjami i szybkim komentarzem rozumu.',
    },
    {
      title: 'Ruch praktyczny',
      body: lastDetail
        ? lastDetail.adviceLine
        : 'Najbliższy ruch powinien być prosty, konkretny i zgodny z prawdą kart, a nie z impulsem ucieczki.',
    },
    {
      title: 'Pytanie do dalszej pracy',
      body: firstDetail
        ? `Co zmienia się w Twoim pytaniu, kiedy czytasz je przez kartę ${firstDetail.cardName}, a nie przez sam lęk przed odpowiedzią?`
        : 'Który fragment tego odczytu zatrzymał Cię najmocniej i dlaczego właśnie on?',
    },
  ];
};

export const buildTarotPromptContext = (params: {
  question: string;
  spread: TarotSpread | null;
  cards: ReadingCard[];
  mode?: TarotContextMode;
}) => {
  const mode = params.mode || 'solo';
  return params.cards
    .map((item) => {
      const slot = getSlotInsight(params.spread, item.slotIndex);
      const detail = buildTarotCardInterpretation(item.card, item.isReversed, {
        spread: params.spread,
        slotIndex: item.slotIndex,
        question: params.question,
        mode,
      });
      return [
        `Pozycja: ${slot.label}`,
        `Karta: ${detail.cardName} (${detail.orientationLabel})`,
        `Rola: ${detail.roleLabel}`,
        `Archetyp: ${detail.archetypeLine}`,
        `Znaczenie: ${detail.contextualMeaning}`,
        `Relacja: ${detail.relationLine}`,
        `Praktyka: ${detail.adviceLine}`,
      ].join('\n');
    })
    .join('\n\n');
};

export const buildTarotRevealSummary = (params: {
  question: string;
  spread: TarotSpread | null;
  card: TarotCardData;
  isReversed: boolean;
  slotIndex: number;
  mode?: TarotContextMode;
}) => {
  const detail = buildTarotCardInterpretation(params.card, params.isReversed, params);
  return `${detail.archetypeLine} ${detail.contextualMeaning}`.replace(/\s+/g, ' ').trim();
};
