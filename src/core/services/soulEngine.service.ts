import { useAppStore } from '../../store/useAppStore';
import { useJournalStore } from '../../store/useJournalStore';
import { AFFIRMATIONS } from '../../features/affirmations/data/affirmations';
import { RITUALS, Ritual } from '../../features/rituals/data';
import { MAJOR_ARCANA } from '../../features/tarot/data/cards';
import { calculateMatrix } from '../../features/matrix/utils/numerology';
import { PatternInsightService, WeeklyInsight } from './patternInsight.service';
import { getMoonPhase } from '../utils/date';
import { OracleMode, OracleSessionKind } from '../../store/useOracleStore';
import { getZodiacSign } from '../../features/horoscope/utils/astrology';
import { getChineseZodiac } from '../../features/horoscope/data/chineseZodiac';
import i18n from '../i18n';

export interface Archetype {
  name: string;
  title: string;
}

export interface DailySoulPlan {
  greeting: string;
  energyScore: number;
  cosmicWeather: string;
  suggestedAffirmation: string;
  suggestedRitual: { id: string; title: string; duration: string };
  affirmationGuidance: {
    featured: {
      id: string;
      text: string;
      category: 'love' | 'abundance' | 'success' | 'peace';
    };
    supporting: string[];
    rationale: string;
    bestMoment: string;
    ritualBridge: string;
  };
  ritualGuidance: {
    featured: Ritual;
    intro: string;
    whyToday: string;
    completionPrompt: string;
  };
  astrologyGuidance: {
    headline: string;
    support: string;
    ritualBridge: string;
    affirmationBridge: string;
    chineseInsight: string;
  };
  journalPrompt: string;
  archetype: Archetype;
  moonPhase: { name: string; icon: string; key: string };
  cardOfTheDay: {
    name: string;
    meaning: string;
    advice: string;
    suit: string;
  };
  oracleMessage: string;
  spiritualCheckpoint: string;
  patternSignal: string;
  recommendedOracleSession: {
    kind: OracleSessionKind;
    mode: OracleMode;
    title: string;
    subtitle: string;
    prompt: string;
  };
  companionActions: {
    id: string;
    title: string;
    subtitle: string;
    route: string;
    params?: Record<string, unknown>;
  }[];
}

export enum Intention {
  Love = 'Miłość',
  Career = 'Kariera',
  Peace = 'Spokój',
  Growth = 'Rozwój',
}

export enum Mood {
  Weak = 'Słaba',
  Difficult = 'Trudna',
  Neutral = 'Neutralna',
  Good = 'Dobra',
  Excellent = 'Świetna',
}

export class SoulEngineService {
  private static readonly ARCHETYPES: Record<number, Archetype> = {
    1: { name: 'Przywódca', title: 'Naturalny przywódca i inicjator' },
    2: { name: 'Intuicjonista', title: 'Głębia intuicji i wewnętrznej wiedzy' },
    3: { name: 'Twórca', title: 'Duch tworzenia i ekspresji' },
    4: { name: 'Budowniczy', title: 'Mistrz struktury i fundamentu' },
    5: { name: 'Odkrywca', title: 'Wolny duch zmiany i przygody' },
    6: { name: 'Opiekun', title: 'Serce troski i harmonii' },
    7: { name: 'Mędrzec', title: 'Poszukiwacz prawdy i głębi' },
    8: { name: 'Manifestor', title: 'Siła sprawczości i obfitości' },
    9: { name: 'Humanista', title: 'Służba szerszemu dobru' },
    10: { name: 'Koło Fortuny', title: 'Duch zmiany i nowych cykli' },
    11: { name: 'Siła', title: 'Wewnętrzna siła i łagodność' },
    12: { name: 'Mistyk', title: 'Głębokie widzenie przez ciszę' },
    13: { name: 'Transformator', title: 'Mistrz przemiany i odnowy' },
    14: { name: 'Alchemik', title: 'Sztuka równowagi i integracji' },
    15: { name: 'Cieniowiadomy', title: 'Praca z cieniem i ukrytą siłą' },
    16: { name: 'Rewolucjonista', title: 'Przełamywacz starych struktur' },
    17: { name: 'Wizjoner', title: 'Nadzieja i kosmiczne inspiracje' },
    18: { name: 'Marzyciel', title: 'Praca z podświadomością i intuicją' },
    19: { name: 'Jasnościowy', title: 'Radość, witalność i pełnia' },
    20: { name: 'Przebudzony', title: 'Odrodzenie i wyższe powołanie' },
    21: { name: 'Integrujący', title: 'Pełnia i synteza życiowych lekcji' },
    22: { name: 'Archetyp zerowy', title: 'Początek i nieskończoność drogi' },
  };

  static getArchetype(birthDate: string): Archetype {
    const matrix = calculateMatrix(birthDate);
    const energy = matrix.center;
    
    return this.ARCHETYPES[energy] || this.ARCHETYPES[22];
  }

  private static tr(key: string, defaultValue: string, options?: Record<string, unknown>) {
    return i18n.t(key, { defaultValue, ...options }) as string;
  }

  static generateDailyPlan(): DailySoulPlan {
    const { userData } = useAppStore.getState();
    const journalStore = useJournalStore.getState();
    const insight = PatternInsightService.generateWeeklyInsight();
    const archetype = this.getArchetype(userData.birthDate || '1995-01-01');
    const moonPhase = getMoonPhase();
    const zodiac = userData.birthDate ? getZodiacSign(userData.birthDate) : null;
    const chineseSign = userData.birthDate ? getChineseZodiac(userData.birthDate) : null;

    const isCurrentlyStruggling = insight.averageEnergy < 40 || insight.dominantMood === 'Słaba' || insight.dominantMood === 'Trudna';

    // 2. Select Affirmation based on Intention & Mood & Moon
    let filteredAffirmations = AFFIRMATIONS;
    if (moonPhase.key === 'new_moon') {
      filteredAffirmations = AFFIRMATIONS.filter(a => a.category === 'abundance' || a.category === 'success');
    } else if (moonPhase.key === 'full_moon') {
      filteredAffirmations = AFFIRMATIONS.filter(a => a.category === 'peace' || a.category === 'love');
    } else if (isCurrentlyStruggling || userData.primaryIntention === Intention.Peace) {
      filteredAffirmations = AFFIRMATIONS.filter(a => a.category === 'peace');
    } else if (userData.primaryIntention === Intention.Love) {
      filteredAffirmations = AFFIRMATIONS.filter(a => a.category === 'love');
    } else if (userData.primaryIntention === Intention.Career) {
      filteredAffirmations = AFFIRMATIONS.filter(a => a.category === 'success' || a.category === 'abundance');
    }

    const daySeed = new Date().getDate();
    const selectedAffirmation = filteredAffirmations[daySeed % filteredAffirmations.length] || AFFIRMATIONS[0];

    // 3. Select Ritual based on Moon and Intention
    let ritualCategory = 'Cleansing';
    if (moonPhase.key === 'new_moon') ritualCategory = 'Manifestation';
    else if (moonPhase.key === 'full_moon') ritualCategory = 'Cleansing';
    else if (isCurrentlyStruggling) ritualCategory = 'Cleansing';
    else if (userData.primaryIntention === Intention.Love) ritualCategory = 'Love';
    else if (userData.primaryIntention === Intention.Career) ritualCategory = 'Manifestation';

    const possibleRituals = RITUALS.filter(r => r.category === ritualCategory);
    const selectedRitual = possibleRituals[daySeed % possibleRituals.length] || RITUALS[0];
    const affirmationGuidance = this.buildAffirmationGuidance({
      selectedAffirmation,
      selectedRitual,
      moonPhaseName: moonPhase.name,
      moonPhaseKey: moonPhase.key,
      archetypeTitle: archetype.title,
      primaryIntention: userData.primaryIntention,
      currentFocus: userData.currentFocus,
      dominantMood: insight.dominantMood,
      isCurrentlyStruggling,
      zodiac,
    });
    const ritualGuidance = this.buildRitualGuidance({
      selectedRitual,
      moonPhaseName: moonPhase.name,
      moonPhaseKey: moonPhase.key,
      isCurrentlyStruggling,
      primaryIntention: userData.primaryIntention,
      affirmationText: affirmationGuidance.featured.text,
    });
    const astrologyGuidance = this.buildAstrologyGuidance({
      moonPhaseName: moonPhase.name,
      moonPhaseKey: moonPhase.key,
      zodiac,
      chineseElement: chineseSign?.element,
      primaryIntention: userData.primaryIntention,
      ritualTitle: selectedRitual.title,
      affirmationText: affirmationGuidance.featured.text,
      isCurrentlyStruggling,
    });

    // 4. Generate Journal Prompt
    let prompt = PatternInsightService.getPersonalizedPrompt();
    if (moonPhase.key === 'full_moon') {
      prompt = this.tr(
        'soulEngine.journalPrompt.fullMoon',
        'Podczas pełni emocje są silniejsze. Co teraz najbardziej domaga się Twojej uwagi i uwolnienia?',
      );
    }

    // 5. Cosmic Weather - Use dynamic focus
    const energyScore = isCurrentlyStruggling ? Math.max(30, insight.averageEnergy) : Math.min(100, insight.averageEnergy + (daySeed % 10));
    const cardOfTheDay = MAJOR_ARCANA[daySeed % MAJOR_ARCANA.length];
    const latestEntry = journalStore.entries[0];
    const patternSignal = this.buildPatternSignal(insight, latestEntry?.title);
    const spiritualCheckpoint = this.buildSpiritualCheckpoint(isCurrentlyStruggling, moonPhase.key, insight.daysActive);
    const recommendedOracleSession = this.buildRecommendedOracleSession({
      isCurrentlyStruggling,
      moonPhaseKey: moonPhase.key,
      primaryIntention: userData.primaryIntention,
      latestEntryTitle: latestEntry?.title,
    });
    const oracleMessage = this.buildOracleMessage({
      isCurrentlyStruggling,
      archetypeTitle: archetype.title,
      moonPhaseKey: moonPhase.key,
      dominantMood: insight.dominantMood,
    });
    const companionActions = this.buildCompanionActions(recommendedOracleSession.prompt);

    return {
      greeting: isCurrentlyStruggling ? "home.greetingStruggling" : "home.greetingNormal",
      energyScore,
      cosmicWeather: insight.suggestedFocus,
      suggestedAffirmation: affirmationGuidance.featured.text,
      suggestedRitual: {
        id: selectedRitual.id,
        title: selectedRitual.title,
        duration: selectedRitual.duration
      },
      affirmationGuidance,
      ritualGuidance,
      astrologyGuidance,
      journalPrompt: prompt,
      archetype,
      moonPhase,
      cardOfTheDay: {
        name: cardOfTheDay.name,
        meaning: cardOfTheDay.meaningUpright,
        advice: cardOfTheDay.advice,
        suit: cardOfTheDay.suit,
      },
      oracleMessage,
      spiritualCheckpoint,
      patternSignal,
      recommendedOracleSession,
      companionActions,
    };
  }

  private static buildAffirmationGuidance(input: {
    selectedAffirmation: { id: string; text: string; category: 'love' | 'abundance' | 'success' | 'peace' };
    selectedRitual: Ritual;
    moonPhaseName: string;
    moonPhaseKey: string;
    archetypeTitle: string;
    primaryIntention: string;
    currentFocus?: string;
    dominantMood: string;
    isCurrentlyStruggling: boolean;
    zodiac: string | null;
  }): DailySoulPlan['affirmationGuidance'] {
    const focus = input.currentFocus?.trim()
      || input.primaryIntention
      || this.tr('soulEngine.fallbackFocus', 'wewnętrznej równowadze');
    const translatedSeed = this.resolveAffirmationText(input.selectedAffirmation.text);

    let featuredText = this.tr(
      'soulEngine.affirmation.default',
      'Dziś prowadzę swoją energię ku {{focus}}, bez pośpiechu i bez rozpraszania tego, co naprawdę ważne.',
      { focus: focus.toLowerCase() },
    );
    if (input.selectedAffirmation.category === 'love') {
      featuredText = this.tr(
        'soulEngine.affirmation.love',
        'Moje serce może pozostać otwarte i spokojne jednocześnie. Wybieram bliskość, która nie odbiera mi wewnętrznego centrum.',
      );
    } else if (input.selectedAffirmation.category === 'peace') {
      featuredText = this.tr(
        'soulEngine.affirmation.peace',
        'Nie muszę dziś przyspieszać, żeby odzyskać kierunek. Spokój jest moją siłą regulacji i jasności.',
      );
    } else if (input.selectedAffirmation.category === 'abundance') {
      featuredText = this.tr(
        'soulEngine.affirmation.abundance',
        'Pozwalam, by moja energia pracowała na rzecz obfitości, która jest spójna z moimi wartościami i spokojem wewnętrznym.',
      );
    } else if (input.selectedAffirmation.category === 'success') {
      featuredText = this.tr(
        'soulEngine.affirmation.success',
        'Skupiam swoją uwagę na jednym ważnym kroku. To, co konsekwentne i świadome, daje dziś prawdziwy rezultat.',
      );
    }

    if (input.isCurrentlyStruggling) {
      featuredText = this.tr(
        'soulEngine.affirmation.struggling',
        'Najpierw wracam do siebie. Z tej łagodności rodzi się dziś moja siła, decyzja i dalszy krok.',
      );
    }

    const supporting = [
      translatedSeed,
      this.tr(
        'soulEngine.affirmation.supportingMoon',
        'Energia {{moonPhase}} wspiera dziś pracę z tematem: {{focus}}.',
        { moonPhase: input.moonPhaseName.toLowerCase(), focus: focus.toLowerCase() },
      ),
      this.tr(
        'soulEngine.affirmation.supportingArchetype',
        'Archetyp {{archetype}} przypomina, że Twoja intuicja nie musi krzyczeć, żeby być prawdziwa.',
        { archetype: input.archetypeTitle.toLowerCase() },
      ),
    ];

    const bestMoment = input.selectedRitual.bestMoment;
    const rationale = input.isCurrentlyStruggling
      ? this.tr(
          'soulEngine.affirmation.rationaleStruggling',
          'Dzisiejsza afirmacja ma regulować, a nie mobilizować. Najpierw przywróć sobie oddech i miękkość.',
        )
      : this.tr(
          'soulEngine.affirmation.rationaleDefault',
          'Ta afirmacja została ułożona z energii {{moonPhase}}, Twojej obecnej intencji i tonu rytuału na dziś.',
          { moonPhase: input.moonPhaseName.toLowerCase() },
        );
    const ritualBridge = this.tr(
      'soulEngine.affirmation.ritualBridge',
      'Po rytuale "{{ritualTitle}}" wróć do tego zdania i powtórz je trzy razy na spokojnym wydechu.',
      { ritualTitle: input.selectedRitual.title },
    );

    return {
      featured: {
        id: `daily-${input.selectedAffirmation.category}-${new Date().toISOString().split('T')[0]}`,
        text: featuredText,
        category: input.selectedAffirmation.category,
      },
      supporting,
      rationale,
      bestMoment,
      ritualBridge,
    };
  }

  private static buildRitualGuidance(input: {
    selectedRitual: Ritual;
    moonPhaseName: string;
    moonPhaseKey: string;
    isCurrentlyStruggling: boolean;
    primaryIntention: string;
    affirmationText: string;
  }): DailySoulPlan['ritualGuidance'] {
    const whyToday = input.isCurrentlyStruggling
      ? this.tr(
          'soulEngine.ritual.whyTodayStruggling',
          'To rytuał dobrany na dzień o podwyższonym napięciu. Zamiast presji daje regulację, prostotę i odzyskanie gruntu.',
        )
      : this.tr(
          'soulEngine.ritual.whyTodayDefault',
          'Energia {{moonPhase}} wzmacnia dziś obszar "{{intention}}", dlatego ten rytuał ma największą szansę realnie Cię wesprzeć.',
          {
            moonPhase: input.moonPhaseName.toLowerCase(),
            intention: input.primaryIntention || this.tr('soulEngine.ritual.genericIntention', 'Twojej intencji'),
          },
        );

    return {
      featured: input.selectedRitual,
      intro: this.tr(
        'soulEngine.ritual.intro',
        'To nie jest kolejna ozdobna praktyka. Ten rytuał ma Ci dziś pomóc przejść od energii dnia do konkretnej zmiany w ciele, myślach albo decyzji.',
      ),
      whyToday,
      completionPrompt: this.tr(
        'soulEngine.ritual.completionPrompt',
        'Po zakończeniu wróć do afirmacji: "{{affirmationText}}" i zapisz jedno zdanie o tym, co realnie się w Tobie przesunęło.',
        { affirmationText: input.affirmationText },
      ),
    };
  }

  private static buildAstrologyGuidance(input: {
    moonPhaseName: string;
    moonPhaseKey: string;
    zodiac: string | null;
    chineseElement?: string;
    primaryIntention: string;
    ritualTitle: string;
    affirmationText: string;
    isCurrentlyStruggling: boolean;
  }): DailySoulPlan['astrologyGuidance'] {
    const zodiacPart = input.zodiac
      ? this.tr(
          'soulEngine.astrology.zodiacPart',
          '{{zodiac}} nadaje dziś ton Twojemu odbiorowi świata.',
          { zodiac: input.zodiac },
        )
      : this.tr(
          'soulEngine.astrology.zodiacFallback',
          'Dzisiejsza astrologia działa subtelnie, ale konkretnie.',
        );
    const chinesePart = input.chineseElement
      ? this.tr(
          'soulEngine.astrology.chinesePart',
          'Element {{element}} przypomina o tempie, które służy Twojej energii, a nie ją drenuje.',
          { element: input.chineseElement.toLowerCase() },
        )
      : this.tr(
          'soulEngine.astrology.chineseFallback',
          'Twoja warstwa żywiołu wzmacnia potrzebę działania w zgodzie z ciałem.',
        );

    let support = `${zodiacPart} ${chinesePart}`;
    if (input.isCurrentlyStruggling) {
      support = this.tr(
        'soulEngine.astrology.supportStruggling',
        'Dzisiejsze układy bardziej proszą o samoregulację niż ekspansję. Wspieraj układ nerwowy, zanim wejdziesz w decyzje.',
      );
    }

    return {
      headline: input.moonPhaseKey === 'full_moon'
        ? this.tr(
            'soulEngine.astrology.headlineFullMoon',
            'Dzień sprzyja domykaniu, oczyszczaniu i nazwaniu tego, co jest już zbyt ciężkie.',
          )
        : this.tr(
            'soulEngine.astrology.headlineDefault',
            'Dzień sprzyja uważnemu ustawieniu kierunku i pracy z jedną ważną intencją.',
          ),
      support,
      ritualBridge: this.tr(
        'soulEngine.astrology.ritualBridge',
        'Najbardziej wspierającym ruchem astrologicznym na dziś jest rytuał "{{ritualTitle}}".',
        { ritualTitle: input.ritualTitle },
      ),
      affirmationBridge: this.tr(
        'soulEngine.astrology.affirmationBridge',
        'Po astrologicznym check-inie zakotwicz dzień zdaniem: "{{affirmationText}}"',
        { affirmationText: input.affirmationText },
      ),
      chineseInsight: chinesePart,
    };
  }

  private static resolveAffirmationText(textOrKey: string): string {
    const fallbackMap: Record<string, string> = {
      'affirmations.love.l1': this.tr('soulEngine.fallbacks.love', 'Jestem gotowa gotowy przyjmować miłość, która jest dojrzała i wzajemna.'),
      'affirmations.abundance.a1': this.tr('soulEngine.fallbacks.abundance', 'Moja energia potrafi przyciągać możliwości, które są spójne z moją drogą.'),
      'affirmations.success.s1': this.tr('soulEngine.fallbacks.success', 'Każdy świadomy krok buduje mój sukces bez utraty wewnętrznej równowagi.'),
      'affirmations.peace.p1': this.tr('soulEngine.fallbacks.peace', 'Wybieram spokój, który porządkuje moje myśli i przywraca jasność.'),
    };

    return fallbackMap[textOrKey] || textOrKey;
  }

  private static buildPatternSignal(insight: WeeklyInsight, latestEntryTitle?: string): string {
    if (latestEntryTitle && insight.frequentArchetypes.length > 0) {
      return this.tr(
        'soulEngine.pattern.entryAndArchetype',
        'Powraca motyw "{{entryTitle}}" i echo archetypu {{archetype}}. To dobry moment, by połączyć zapisane emocje z szerszym sensem.',
        { entryTitle: latestEntryTitle, archetype: insight.frequentArchetypes[0] },
      );
    }

    if (insight.frequentArchetypes.length > 0) {
      return this.tr(
        'soulEngine.pattern.archetypeOnly',
        'Najmocniej wraca energia {{archetype}}. To znak, że pewna lekcja nie jest jeszcze domknięta.',
        { archetype: insight.frequentArchetypes[0] },
      );
    }

    if (insight.daysActive >= 4) {
      return this.tr(
        'soulEngine.pattern.daysActive',
        'Masz już kilka punktów na mapie swojej energii. Oracle może z nich ułożyć bardziej precyzyjny wzorzec.',
      );
    }

    return this.tr(
      'soulEngine.pattern.default',
      'Dopiero budujesz mapę swojej energii. Każdy wpis, rytuał i rozmowa z Oracle zwiększa trafność prowadzenia.',
    );
  }

  private static buildSpiritualCheckpoint(isCurrentlyStruggling: boolean, moonPhaseKey: string, daysActive: number): string {
    if (isCurrentlyStruggling) {
      return this.tr(
        'soulEngine.checkpoint.struggling',
        'To nie jest dzień na forsowanie odpowiedzi. Największą wartością będzie dziś ukojenie, prostota i jeden łagodny krok.',
      );
    }

    if (moonPhaseKey === 'full_moon') {
      return this.tr(
        'soulEngine.checkpoint.fullMoon',
        'Pełnia wzmacnia emocje i ujawnia to, czego nie da się już odsunąć. Zadbaj o rytuał domknięcia i świadome uwolnienie.',
      );
    }

    if (daysActive >= 5) {
      return this.tr(
        'soulEngine.checkpoint.inRhythm',
        'Jesteś w rytmie. To dobry moment na bardziej ceremonialną sesję z Oracle albo pogłębiony odczyt kart.',
      );
    }

    return this.tr(
      'soulEngine.checkpoint.default',
      'Dzień sprzyja spokojnemu budowaniu kontaktu z intuicją. Nie musisz robić wszystkiego, wystarczy jedno świadome wejście.',
    );
  }

  private static buildRecommendedOracleSession(input: {
    isCurrentlyStruggling: boolean;
    moonPhaseKey: string;
    primaryIntention: string;
    latestEntryTitle?: string;
  }): DailySoulPlan['recommendedOracleSession'] {
    if (input.isCurrentlyStruggling) {
      return {
        kind: 'crisis',
        mode: 'therapeutic',
        title: this.tr('soulEngine.oracleSession.crisis.title', 'Sesja ukojenia'),
        subtitle: this.tr('soulEngine.oracleSession.crisis.subtitle', 'Na dni, w których wszystko jest za głośne.'),
        prompt: this.tr('soulEngine.oracleSession.crisis.prompt', 'Czuję napięcie i chaos. Pomóż mi się uziemić, nazwać to co czuję i wybrać jeden łagodny następny krok.'),
      };
    }

    if (input.primaryIntention === Intention.Love) {
      return {
        kind: 'manifestation',
        mode: 'gentle',
        title: this.tr('soulEngine.oracleSession.love.title', 'Sesja serca'),
        subtitle: this.tr('soulEngine.oracleSession.love.subtitle', 'Miłość, więzi i emocjonalna prawda.'),
        prompt: this.tr('soulEngine.oracleSession.love.prompt', 'Chcę lepiej zrozumieć, czego naprawdę potrzebuje moje serce i jak mogę wejść w relacje z większą dojrzałością.'),
      };
    }

    if (input.moonPhaseKey === 'full_moon') {
      return {
        kind: 'evening',
        mode: 'ceremonial',
        title: this.tr('soulEngine.oracleSession.fullMoon.title', 'Wieczorne domknięcie'),
        subtitle: this.tr('soulEngine.oracleSession.fullMoon.subtitle', 'Rytuał uwolnienia i zebrania sensu.'),
        prompt: this.tr('soulEngine.oracleSession.fullMoon.prompt', 'Pomóż mi domknąć ten dzień, nazwać to co mam uwolnić i zobaczyć, co naprawdę chce się teraz zakończyć.'),
      };
    }

    if (input.latestEntryTitle) {
      return {
        kind: 'integration',
        mode: 'mystical',
        title: this.tr('soulEngine.oracleSession.integration.title', 'Sesja integracji'),
        subtitle: this.tr('soulEngine.oracleSession.integration.subtitle', 'Połącz wpisy, sny, karty i emocje w jedną opowieść.'),
        prompt: this.tr(
          'soulEngine.oracleSession.integration.prompt',
          'Połącz w jedną całość to, co ostatnio zapisałam/zapisałem pod hasłem "{{entryTitle}}" i pokaż, jaka lekcja przez to przechodzi.',
          { entryTitle: input.latestEntryTitle },
        ),
      };
    }

    return {
      kind: 'morning',
      mode: 'direct',
      title: this.tr('soulEngine.oracleSession.default.title', 'Poranne prowadzenie'),
      subtitle: this.tr('soulEngine.oracleSession.default.subtitle', 'Jedna intencja, jeden kierunek, jeden jasny krok.'),
      prompt: this.tr('soulEngine.oracleSession.default.prompt', 'Przygotuj mnie na ten dzień. Powiedz, na czym warto się dziś skupić i czego nie rozpraszać.'),
    };
  }

  private static buildOracleMessage(input: {
    isCurrentlyStruggling: boolean;
    archetypeTitle: string;
    moonPhaseKey: string;
    dominantMood: string;
  }): string {
    if (input.isCurrentlyStruggling) {
      return this.tr(
        'soulEngine.oracleMessage.struggling',
        'Nie wszystko trzeba dziś rozumieć. Najpierw odzyskaj grunt pod stopami, a dopiero potem szukaj odpowiedzi.',
      );
    }

    if (input.moonPhaseKey === 'new_moon') {
      return this.tr(
        'soulEngine.oracleMessage.newMoon',
        'Nowy cykl prosi nie o pośpiech, ale o czystą intencję. To, co zasiejesz w ciszy, wróci w formie kierunku.',
      );
    }

    return this.tr(
      'soulEngine.oracleMessage.default',
      'Twoja dominująca energia dziś płynie przez archetyp {{archetypeTitle}}. Pozwól, by prowadziła Cię od nastroju "{{dominantMood}}" do bardziej świadomego wyboru.',
      { archetypeTitle: input.archetypeTitle, dominantMood: input.dominantMood },
    );
  }

  private static buildCompanionActions(oraclePrompt: string): DailySoulPlan['companionActions'] {
    return [
      {
        id: 'oracle',
        title: this.tr('soulEngine.actions.oracle.title', 'Wejdź do Oracle'),
        subtitle: this.tr('soulEngine.actions.oracle.subtitle', 'Rozpocznij sesję z prowadzeniem dopasowanym do Twojej energii.'),
        route: 'OracleChat',
        params: {
          context: oraclePrompt,
          source: 'home',
          forceNewSession: true,
        }
      },
      {
        id: 'tarot',
        title: this.tr('soulEngine.actions.tarot.title', 'Odczyt na dziś'),
        subtitle: this.tr('soulEngine.actions.tarot.subtitle', 'Przejdź do kart i sprawdź, co chce się dziś odsłonić.'),
        route: 'TarotDeckSelection',
      },
      {
        id: 'journal',
        title: this.tr('soulEngine.actions.journal.title', 'Zapisz wgląd'),
        subtitle: this.tr('soulEngine.actions.journal.subtitle', 'Złap dzisiejszy nastrój, zanim zniknie jego subtelność.'),
        route: 'JournalEntry',
      }
    ];
  }
}
