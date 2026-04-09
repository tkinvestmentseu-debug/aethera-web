// @ts-nocheck
import React, { useEffect, useRef, useState, useMemo } from 'react';
import Animated, { FadeInDown, withRepeat, withTiming, withSequence, useSharedValue, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { Pressable, ScrollView, StyleSheet, TextInput, View, ActivityIndicator, Share, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Binary, ChevronLeft, Hash, HeartHandshake, Moon, MoonStar, Orbit, Shield, Sparkles,
  WandSparkles, Star, Search, Clock, ChevronRight, ChevronDown, ChevronUp, BookOpen,
  Brain, Zap, Trophy, CheckCircle, Circle as CircleIcon, Users, Send,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { CelestialBackdrop } from '../components/CelestialBackdrop';
import { Typography } from '../components/Typography';
import { SectionHeading } from '../components/SectionHeading';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { AiService } from '../core/services/ai.service';
import { goBackOrToMainTab, navigateToDashboardSurface } from '../navigation/navigationFallbacks';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Ellipse, Line, Path, G, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
// ─── RUNE SYMBOLS for orbiting decoration ────────────────────────────────────
const RUNE_CHARS = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ'];

// ─── Enhanced 3D Rune Orb Widget ─────────────────────────────────────────────
const RuneOrb3D = ({ accent, isLight }: { accent: string; isLight: boolean }) => {
  const rot    = useSharedValue(0);
  const rot2   = useSharedValue(0);
  const tiltX  = useSharedValue(0);
  const tiltY  = useSharedValue(0);
  const glow   = useSharedValue(0.5);
  const pulse  = useSharedValue(1);

  useEffect(() => {
    rot.value   = withRepeat(withTiming(360,  { duration: 24000, easing: Easing.linear }), -1, false);
    rot2.value  = withRepeat(withTiming(-360, { duration: 18000, easing: Easing.linear }), -1, false);
    glow.value  = withRepeat(withSequence(withTiming(1, { duration: 2000 }), withTiming(0.4, { duration: 2000 })), -1, false);
    pulse.value = withRepeat(withSequence(withTiming(1.12, { duration: 1800 }), withTiming(1.0, { duration: 1800 })), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-28, Math.min(28, e.translationY * 0.18));
      tiltY.value = Math.max(-28, Math.min(28, e.translationX * 0.18));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 1000 });
      tiltY.value = withTiming(0, { duration: 1000 });
    });

  const outerStyle  = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }],
  }));
  const orbitStyle  = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot.value}deg` }] }));
  const orbit2Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot2.value}deg` }] }));
  const glowStyle   = useAnimatedStyle(() => ({ opacity: glow.value }));
  const pulseStyle  = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const sz = 140; const cx = sz / 2; const R = 40;
  return (
    <View style={{ height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={outerStyle}>
          {/* Glow backdrop */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, glowStyle]}>
            <Svg width={sz} height={sz}>
              <Circle cx={cx} cy={cx} r={62} fill={accent + '14'} />
              <Circle cx={cx} cy={cx} r={52} fill={accent + '08'} />
            </Svg>
          </Animated.View>

          {/* Core orb */}
          <Svg width={sz} height={sz}>
            <Circle cx={cx} cy={cx} r={56} fill={isLight ? 'rgba(240,228,210,0.90)' : accent + '06'} stroke={accent + '22'} strokeWidth={0.8} />
            <Circle cx={cx} cy={cx} r={R} fill={isLight ? accent + '18' : accent + '14'} stroke={accent + '55'} strokeWidth={1.4} />
            <Ellipse cx={cx} cy={cx} rx={R} ry={R * 0.28} fill="none" stroke={accent + '44'} strokeWidth={0.8} />
            <Ellipse cx={cx} cy={cx} rx={R * 0.5} ry={R} fill="none" stroke={accent + '30'} strokeWidth={0.8} />
            {/* Cross hairs */}
            <Line x1={cx - R} y1={cx} x2={cx + R} y2={cx} stroke={accent + '20'} strokeWidth={0.6} />
            <Line x1={cx} y1={cx - R} x2={cx} y2={cx + R} stroke={accent + '20'} strokeWidth={0.6} />
          </Svg>

          {/* Pulsing center */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, pulseStyle]}>
            <Svg width={20} height={20}>
              <Circle cx={10} cy={10} r={6} fill={accent} opacity={0.9} />
              <Circle cx={10} cy={10} r={3} fill="#fff" opacity={0.5} />
            </Svg>
          </Animated.View>

          {/* Outer ring: orbiting rune dots */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, orbitStyle]}>
            <Svg width={sz} height={sz}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                const a = (i / 8) * 2 * Math.PI;
                return <Circle key={i} cx={cx + 56 * Math.cos(a)} cy={cx + 56 * Math.sin(a) * 0.32} r={i % 2 === 0 ? 4 : 2.5} fill={accent} opacity={0.55 + (i % 3) * 0.15} />;
              })}
            </Svg>
          </Animated.View>

          {/* Inner counter-rotating ring */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, orbit2Style]}>
            <Svg width={sz} height={sz}>
              {[0, 1, 2, 3, 4, 5].map(i => {
                const a = (i / 6) * 2 * Math.PI;
                return <Circle key={i} cx={cx + 44 * Math.cos(a)} cy={cx + 44 * Math.sin(a) * 0.35} r={2.2} fill={accent} opacity={0.35 + (i % 2) * 0.2} />;
              })}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ─── Static Data ─────────────────────────────────────────────────────────────
const KNOWLEDGE_BLOCKS = [
  {
    id: 'archetypes',
    IconComp: Sparkles,
    title: 'Mistycyzm i archetypy',
    copy: 'Aethera łączy archetypy, symbole i rytuały nie po to, by budować egzotyczną dekorację, ale by dać język dla wewnętrznych procesów, które trudno nazwać zwykłą analizą.',
    bullets: ['22 archetypów Tarota', 'Matryca Przeznaczenia', 'Numerologia życiowa'],
  },
  {
    id: 'moon',
    IconComp: Moon,
    title: 'Księżyc i święty czas',
    copy: 'Fazy Księżyca działają tu jako sposób czytania tempa: kiedy coś dojrzewa, kiedy wymaga domknięcia, a kiedy lepiej nie forsować ruchu.',
    bullets: ['8 faz księżyca', 'Rytm 28 dni', 'Energie lunarne'],
  },
  {
    id: 'symbols',
    IconComp: Hash,
    title: 'Runy, symbole i znaki',
    copy: 'Symbol nie daje gotowej odpowiedzi. Działa jak zwierciadło: skupia uwagę na tym, co w psychice już się porusza, ale jeszcze nie zostało ujęte w słowa.',
    bullets: ['Elder Futhark', 'Symbole alchemiczne', 'Geometria święta'],
  },
  {
    id: 'protection',
    IconComp: Shield,
    title: 'Ochrona i oczyszczanie',
    copy: 'Praktyki ochronne nie muszą wzmacniać lęku. W dobrze prowadzonej pracy chodzi bardziej o granice, regulację i odzyskanie przejrzystości niż o walkę z niewidzialnym zagrożeniem.',
    bullets: ['Techniki oczyszczania', 'Ochrona energetyczna', 'Granice aury'],
  },
];

const KNOWLEDGE_ROUTES: Record<string, string> = { archetypes: 'Tarot', moon: 'LunarCalendar', symbols: 'Numerology', protection: 'Cleansing', astrology: 'Stars' };

const DAILY_CONCEPTS = [
  { term: 'Synchroniczność', color: '#A78BFA', desc: 'Znaczące zbieżności zdarzeń niepołączonych przyczynowo — Jungowski sygnał, że nieświadome i świat zewnętrzny prowadzą dialog.' },
  { term: 'Archetyp', color: '#60A5FA', desc: 'Pierwotny wzorzec zapisany w zbiorowej nieświadomości. Nie jest postacią — jest polem energetycznym, które organizuje doświadczenie.' },
  { term: 'Aura', color: '#34D399', desc: 'Emanacja energetyczna ciała ludzkiego. Każda warstwa — eteryczna, emocjonalna, mentalna — przetwarza inne częstotliwości i impulsy.' },
  { term: 'Retrograd', color: '#F97316', desc: 'Pozorna wsteczna wędrówka planety. Czas intensywniejszej internalizacji obszarów rządzonych przez planetę — nie katastrofy, a przeglądu.' },
  { term: 'Sigil', color: '#FBBF24', desc: 'Zakodowany symbol intencji stworzony przez geometryczne uproszczenie zamiaru. Działa poniżej progu świadomego myślenia.' },
  { term: 'Inicjacja', color: '#E879A0', desc: 'Przejście przez symboliczną śmierć stareje "ja" i narodziny nowej tożsamości. Kryzys często jest bramą, nie przeszkodą.' },
  { term: 'Tranzyt', color: '#60A5FA', desc: 'Aktualne ułożenie planety wobec punktów urodzeniowego horoskopu. Aktywuje tematy, które dojrzały do pracy.' },
  { term: 'Cień', color: '#9CA3AF', desc: 'Jungowski termin na wyparte aspekty psychiki. Im dłużej ignorowany, tym silniej organizuje zachowanie bez udziału świadomości.' },
  { term: 'Kwadratura', color: '#F97316', desc: 'Aspekt astrologiczny 90°. Tworzy twórcze napięcie wymagające aktywnej integracji — nie blokadę, ale wyzwanie do działania.' },
  { term: 'Intencja', color: '#34D399', desc: 'Kierunek świadomej woli skierowany ku konkretnemu rezultatowi. Różni się od życzenia obecnością zaangażowania i jasności.' },
  { term: 'Księżyc nów', color: '#A78BFA', desc: 'Punkt zerowy cyklu lunarne. Najsilniejszy czas na sianie intencji — energia jest skupiona, niewidoczna i plastyczna.' },
  { term: 'Numerologia', color: '#CEAE72', desc: 'System czytania ukrytych wzorców w liczbach daty urodzenia i imienia. Nie przepowiada — ujawnia jakości energetyczne linii życia.' },
];

const getTodayConcept = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_CONCEPTS[dayOfYear % DAILY_CONCEPTS.length];
};

const KNOWLEDGE_CATEGORIES = [
  { id: 'astrologia', label: 'Astrologia', emoji: '⭐', color: '#FBBF24', count: 24 },
  { id: 'numerologia', label: 'Numerologia', emoji: '🔢', color: '#A78BFA', count: 12 },
  { id: 'tarot', label: 'Tarot', emoji: '🎴', color: '#F472B6', count: 22 },
  { id: 'chakry', label: 'Czakry', emoji: '🌈', color: '#34D399', count: 7 },
  { id: 'krysztal', label: 'Kryształy', emoji: '💎', color: '#60A5FA', count: 30 },
  { id: 'rytualy', label: 'Rytuały', emoji: '🕯️', color: '#F97316', count: 15 },
];

const WEEKLY_ARTICLES = [
  {
    title: 'Merkury Retrograde: Jak nawigować przez chaos',
    category: 'astrologia',
    excerpt: 'Merkury retrograde to nie przekleństwo, lecz zaproszenie do rewizji. Kiedy planeta komunikacji cofa się, nasze myśli szukają głębszych warstw znaczenia, poza tym co natychmiastowe. To czas na powrót do niedokończonych rozmów, zawieszonych decyzji i nieprzetrawionej przeszłości — nie z lęku, ale z dojrzałości.',
    readingTime: '5 min',
    color: '#FBBF24',
  },
  {
    title: '22 Wielkie Arkana: Mapa Duchowej Podróży',
    category: 'tarot',
    excerpt: 'Wielkie Arkana Tarota to nie zbiór przepowiedni, lecz mapa stanów świadomości, przez które przechodzi każda dojrzewająca psychika. Od Szaleńca przez Wieżę po Świat — każda karta opisuje inny rodzaj przejścia, kryzysu lub otwarcia. Rozumieć Arkana znaczy rozumieć siebie.',
    readingTime: '8 min',
    color: '#F472B6',
  },
  {
    title: 'Czakra Serca: Otwarcie na miłość i stratę',
    category: 'chakry',
    excerpt: 'Anahata — czakra serca — zarządza zdolnością zarówno do miłości, jak i do żałoby. Jej zamknięcie nie chroni przed bólem, lecz odcina od pełni życia. Praktyki otwierające Anahata uczą nas, że serce może być jednocześnie zranione i szeroko otwarte.',
    readingTime: '6 min',
    color: '#34D399',
  },
  {
    title: 'Numerologia Imienia: Wyrażenie Duszy w Liczbach',
    category: 'numerologia',
    excerpt: 'Każda litera imienia nosi wibrację, a ich suma tworzy Liczbę Wyrażenia — energię, którą naturalnie manifestujesz w świecie. W odróżnieniu od Drogi Życia, Liczba Wyrażenia opisuje to, co robisz z talentami, nie zaś z przeznaczeniem. Te dwa wzorce mogą się wzajemnie wspierać lub tworzyć napięcie twórcze.',
    readingTime: '7 min',
    color: '#A78BFA',
  },
];

const KNOWLEDGE_CHAMBERS = [
  { id: 'moon-room', title: 'Komnata Księżyca', copy: 'Fazy, święty timing i lunarne okna działania.', route: 'LunarCalendar', IconComp: MoonStar },
  { id: 'matrix-room', title: 'Komnata Wzorców', copy: 'Matryca, liczby i ukryte struktury życiowego rytmu.', route: 'Matrix', IconComp: Orbit },
  { id: 'shield-room', title: 'Komnata Ochrony', copy: 'Praktyki granic, oczyszczania i odzyskiwania przejrzystości.', route: 'Cleansing', IconComp: Shield },
  { id: 'journal-room', title: 'Komnata Integracji', copy: 'Zamień wiedzę o symbolach w własny zapis i praktyczne rozumienie.', route: 'JournalEntry', IconComp: WandSparkles },
] as const;

// ─── ENCYKLOPEDIA DUCHOWA — 15 spiritual concepts ────────────────────────────
const ENCYCLOPEDIA_ENTRIES = [
  {
    term: 'Arcana',
    color: '#F472B6',
    category: 'tarot',
    short: 'Sekrety ukryte w symbolach tarota.',
    full: 'Arcana (łac. arcanum — tajemnica) to zbiorcza nazwa dla kart tarota dzielonych na Wielkie Arkana (22 karty przebudzeń i kryzysów) oraz Małe Arkana (56 kart codziennych doświadczeń). Każda Wielka Arkana opisuje archetyp świadomości — od Szaleńca symbolizującego czystą potencjalność przez Śmierć (transformację) po Świat (integrację). Małe Arkana podzielone są na cztery żywioły: Różdżki (ogień/wola), Kielichy (woda/emocje), Miecze (powietrze/umysł) i Pentakle (ziemia/materia).',
  },
  {
    term: 'Chakra',
    color: '#34D399',
    category: 'chakry',
    short: 'Centra energetyczne ciała subtelnego.',
    full: 'Czakry (sanskryt: koło, krąg) to 7 głównych centrów energetycznych wzdłuż kręgosłupa, opisanych w tradycji jogi i Ajurwedy. Od Muladhary (podstawy) przez Svadhisthanę (kreatywność), Manipurę (wola), Anahatę (miłość), Visuddhę (głos), Adżnę (intuicja) po Sahasrarę (jedność). Każda czakra przetwarza określone częstotliwości doświadczeń emocjonalnych i energetycznych. Blokada jednej z nich objawia się zarówno na poziomie ciała fizycznego, jak i w powtarzających się wzorcach zachowania.',
  },
  {
    term: 'Mantra',
    color: '#FBBF24',
    category: 'rytualy',
    short: 'Dźwiękowy instrument świadomości.',
    full: 'Mantra (sanskryt: man — umysł, tra — narzędzie) to sekwencja sylab, słów lub zdań używanych jako narzędzie koncentracji i transformacji świadomości. Wibracja dźwięku mantry oddziałuje zarówno na umysł (wyciszenie myślenia dyskursywnego), jak i na pole energetyczne ciała. Praktyki wedyjskie różnicują mantry bijowe (seedowe, np. "OM", "AIM", "HRIM") — stosowane do aktywacji czakr — od mantr modlitewnych i hymnicznych. Kluczem nie jest rozumienie intelektualne, lecz powtórzenie i rezonans.',
  },
  {
    term: 'Yantra',
    color: '#A78BFA',
    category: 'rytualy',
    short: 'Geometryczny diagram energii duchowej.',
    full: 'Yantra (sanskryt: przyrząd, narzędzie) to święty diagram geometryczny będący wizualnym odpowiednikiem mantry. Reprezentuje strukturę energetyczną bóstwa lub siły kosmicznej. Najsłynniejsza — Sri Yantra — zawiera 9 trójkątów tworzących 43 mniejsze trójkąty, symbolizujące interpenetrację żeńskiej (Shakti) i męskiej (Shiva) zasady świata. W praktyce medytacyjnej yantra jest obiektem skupienia, który "przeprogramowuje" wzorce umysłu poprzez kontemplację formy zamiast treści.',
  },
  {
    term: 'Mudra',
    color: '#60A5FA',
    category: 'rytualy',
    short: 'Gest dłoni jako pieczęć energetyczna.',
    full: 'Mudra (sanskryt: pieczęć, gest) to symboliczny układ dłoni i palców stosowany w jodze, medytacji i tańcu klasycznym. Każdy palec reprezentuje żywioł: kciuk (ogień/Agni), palec wskazujący (powietrze/Vayu), środkowy (przestrzeń/Akasha), serdeczny (ziemia/Prithvi), mały (woda/Jala). Najpopularniejsza Chin mudra (kciuk dotyka wskazującego) symbolizuje połączenie indywidualnej świadomości z Brahmanem. Mudry wpływają na przepływ prany w ciele subtelnym, zmieniając stany mentalne i emocjonalne.',
  },
  {
    term: 'Tantra',
    color: '#F97316',
    category: 'rytualy',
    short: 'Filozofia rozszerzania świadomości przez doświadczenie.',
    full: 'Tantra (sanskryt: tkać, rozszerzać) to system duchowy wywodzący się z Indii, traktujący całe doświadczenie — łącznie z tym co cielesne i zmysłowe — jako ścieżkę do przebudzenia. W odróżnieniu od tradycji ascetycznych, tantra nie odrzuca świata materialnego, lecz używa go jako narzędzia transformacji. Obejmuje praktyki energetyczne (praca z kundalini), rytualne (puja, homa), seksualne (maithuna w kontekście sakralnym) i medytacyjne. Celem jest doświadczenie niedualizmu — tożsamości Shiva i Shakti, świadomości i energii.',
  },
  {
    term: 'Sutra',
    color: '#34D399',
    category: 'rytualy',
    short: 'Zwięzłe maksymy mądrości duchowej.',
    full: 'Sutra (sanskryt: nić, sznur) to aforystyczny tekst duchowy, w którym kompleksowe nauki zostają zredukowane do minimum słów, zachowując maksimum znaczenia. Najsłynniejsze — Joga Sutry Patańdżalego (196 sentencji definiujących system ashtanga jogi) oraz Brahma Sutry (systematyzacja Advaita Wedanty). Format sutry zakłada, że czytelnik otrzymuje "nić" — przewodnika, wokół którego nawija własne rozumienie przez praktykę. Sutra jest zapisem żywej tradycji przekazywanej ustnie od nauczyciela do ucznia.',
  },
  {
    term: 'Samadhi',
    color: '#A78BFA',
    category: 'rytualy',
    short: 'Stan głębokiej medytacyjnej jedności.',
    full: 'Samadhi (sanskryt: połączenie, skupienie) to najwyższy stan medytacji opisany w jodze — świadomość pozbawiona podmiotu obserwującego, całkowite roztopienie się w obiekcie kontemplacji. Patańdżali wyróżnia Samprajnata Samadhi (z obiektem — sabija) i Asamprajnata Samadhi (bez obiektu — nirbija, czysty Stan świadka). W buddyzmie odpowiednikiem jest Jhana — seria coraz głębszych stanów absorpcji. Tradycje podkreślają, że samadhi nie jest celem samym w sobie, lecz środkiem oczyszczenia świadomości dla integracji w codziennym życiu.',
  },
  {
    term: 'Karma',
    color: '#F97316',
    category: 'astrologia',
    short: 'Prawo przyczynowo-skutkowe działania.',
    full: 'Karma (sanskryt: czyn, działanie) to jedno z centralnych pojęć filozofii indyjskiej oznaczające sumę zamierzonych działań i ich konsekwencji na poziomie energetycznym. Karmy nie należy rozumieć jako kary — to raczej echo, które powraca do źródła. Rozróżniamy: Sanchita Karmę (nagromadzone czyny z poprzednich inkarnacji), Prarabdha Karmę (aktywowana w obecnym życiu) i Kriyamana Karmę (tworzona teraz). Praca z karmą w kontekście Aethery polega na świadomym identyfikowaniu powtarzających się wzorców i wybieraniu nowych odpowiedzi.',
  },
  {
    term: 'Dharma',
    color: '#FBBF24',
    category: 'astrologia',
    short: 'Twoja prawdziwa ścieżka i powołanie.',
    full: 'Dharma (sanskryt: to, co podtrzymuje) oznacza zarówno kosmiczny porządek rzeczy, jak i indywidualną ścieżkę zgodną z własną naturą. Bhagawadgita ujmuje to jako "lepiej wypełniać własną dharma niedoskonale, niż cudzą doskonale". W praktyce oznacza to rozeznanie, do czego naprawdę zostałeś stworzony — nie tylko zawodowo, lecz na poziomie charakteru i daru, który masz do zaoferowania światu. Astrologicznie dharma łączona jest z Północnym Węzłem Księżyca — punktem, ku któremu zmierza dusza.',
  },
  {
    term: 'Prana',
    color: '#34D399',
    category: 'chakry',
    short: 'Kosmiczna siła witalna przenikająca wszystko.',
    full: 'Prana (sanskryt: oddech, siła witalna) to fundamentalna energia życiowa przenikająca cały wszechświat i manifestująca się w ciele jako 5 wajus (wiatrów): Prana (wdech/serce), Apana (wydech/dolna część ciała), Samana (trawienie/pępek), Udana (gardło/ekspresja), Vyana (cyrkulacja/całe ciało). Pranajama — kontrola prany przez oddech — jest jedną z najbardziej bezpośrednich praktyk transformacji stanów umysłu. Zakłócenie przepływu prany objawia się jako choroba, wyczerpanie lub dysharmonia emocjonalna.',
  },
  {
    term: 'Kundalini',
    color: '#F472B6',
    category: 'chakry',
    short: 'Uśpiona energia wężowa u podstawy kręgosłupa.',
    full: 'Kundalini (sanskryt: zwinięta jak wąż) to uśpiona energia kosmiczna zlokalizowana u podstawy kręgosłupa (Muladhara). Jej przebudzenie i wznoszenie się przez kanały energetyczne (Ida, Pingala, Sushumna) do czubka głowy (Sahasrara) opisywane jest jako najgłębsza transformacja duchowa. Proces ten może być stopniowy lub gwałtowny — stąd ważność prowadzenia przez doświadczonego nauczyciela. Symptomy przebudzenia obejmują intensywne ciepło, drgania, stany odmienne świadomości i głębokie zmiany percepcji rzeczywistości.',
  },
  {
    term: 'Akasha',
    color: '#60A5FA',
    category: 'astrologia',
    short: 'Kosmiczny rejestr wszystkich zdarzeń.',
    full: 'Akasha (sanskryt: niebo, przestrzeń) to piąty żywioł w systemach indyjskich — subtelniejszy niż ziemia, woda, ogień i powietrze. W teozofii Helena Bławatska rozwinęła pojęcie Kronik Akashy — kosmicznego rejestru wszystkich zdarzeń, myśli i uczuć kiedykolwiek zaistniałych. W praktyce intuicyjnej i channelingu "wejście do Kronik" oznacza dostęp do informacji wykraczających poza osobistą pamięć. W kontekście fizyki kwantowej akasha bywa porównywana do pola zerowego — fundamentalnego poziomu rzeczywistości, z którego wyłania się materia.',
  },
  {
    term: 'Samsara',
    color: '#9CA3AF',
    category: 'astrologia',
    short: 'Koło wcieleń napędzane nieuśmierzoną pragnieniem.',
    full: 'Samsara (sanskryt: błądzenie, wędrówka) to cykl narodzin, śmierci i odrodzenia — fundamentalne pojęcie hinduizmu, buddyzmu i dżainizmu. Mechanizmem napędzającym samsarę jest tanha (pragnienie, przywiązanie) w ujęciu buddyjskim lub karma w ujęciu hinduskim. Ważne jest, że samsara nie jest karą, lecz konsekwencją nierozpoznania prawdziwej natury rzeczywistości (avidya — niewiedzą). Wyjście z koła wcieleń (moksha/nirvana) nie oznacza unicestwienia, lecz rozpoznanie, że nigdy nie byliśmy osobnym "ja" błądzącym przez czas.',
  },
  {
    term: 'Moksha',
    color: '#A78BFA',
    category: 'astrologia',
    short: 'Wyzwolenie ze świata cierpienia i odradzania.',
    full: 'Moksha (sanskryt: wyzwolenie, uwolnienie) to cel życia duchowego w hinduizmie — wyjście z cyklu samsary przez poznanie prawdziwej natury Jaźni (Atman=Brahman w Advaicie). Różne tradycje opisują różne ścieżki: Jnana Marga (droga wiedzy), Bhakti Marga (droga oddania), Karma Marga (droga działania bez przywiązania do owoców) i Raja Marga (droga psychofizyczna — joga). W sensie psychologicznym moksha oznacza uwolnienie od kompulsywnych wzorców ego — doświadczenie wolności, która nie zależy od okoliczności zewnętrznych.',
  },
];

// ─── POLECANE DLA CIEBIE — zodiac/life path based articles ──────────────────
const PERSONALIZED_ARTICLES: Record<string, Array<{ title: string; desc: string; color: string; route: string }>> = {
  aries:       [{ title: 'Mars i Twoja wola', desc: 'Jak planeta wojownika kształtuje Twój impuls twórczy.', color: '#EF4444', route: 'Stars' }],
  taurus:      [{ title: 'Wenus i zmysłowość', desc: 'Piękno, wartości i zakorzenienie w żywiole ziemi.', color: '#10B981', route: 'Stars' }],
  gemini:      [{ title: 'Merkury i dwoistość', desc: 'Umysł jako most między intuicją a słowem.', color: '#FBBF24', route: 'Stars' }],
  cancer:      [{ title: 'Księżyc i pamięć ciała', desc: 'Emocje jako kompas, nie przeszkoda.', color: '#60A5FA', route: 'LunarCalendar' }],
  leo:         [{ title: 'Słońce i autentyczność', desc: 'Jak wyrażać prawdziwe "ja" bez potrzeby aprobaty.', color: '#F97316', route: 'Stars' }],
  virgo:       [{ title: 'Chiron i leczenie', desc: 'Ranny uzdrowiciel — ból jako ścieżka mądrości.', color: '#34D399', route: 'Stars' }],
  libra:       [{ title: 'Wenus i równowaga relacji', desc: 'Kompromis bez utraty siebie — astrologiczny klucz.', color: '#F472B6', route: 'Compatibility' }],
  scorpio:     [{ title: 'Pluton i transformacja', desc: 'Śmierć ego i narodziny głębszego "ja".', color: '#7C3AED', route: 'ShadowWork' }],
  sagittarius: [{ title: 'Jowisz i ekspansja', desc: 'Gdzie rośnie Twoja dusza poza granicami.', color: '#FBBF24', route: 'Stars' }],
  capricorn:   [{ title: 'Saturn i inicjacja', desc: 'Czas jako nauczyciel — lekcje wytrwałości i struktury.', color: '#9CA3AF', route: 'Stars' }],
  aquarius:    [{ title: 'Uran i rewolucja', desc: 'Przełomowe wglądy i wolność od kondycjonowania.', color: '#60A5FA', route: 'Stars' }],
  pisces:      [{ title: 'Neptun i przestrzeń mistyczna', desc: 'Granica między snem, wizją i rzeczywistością.', color: '#A78BFA', route: 'Dreams' }],
};

const PATH_ARTICLES: Record<number, { title: string; desc: string; color: string; route: string }> = {
  1: { title: 'Ścieżka Lidera', desc: 'Inicjacja własnej drogi — niezależność jako dar i wyzwanie.', color: '#EF4444', route: 'Numerology' },
  2: { title: 'Ścieżka Harmonii', desc: 'Intuicja, partnerstwo i poszukiwanie równowagi.', color: '#60A5FA', route: 'Numerology' },
  3: { title: 'Ścieżka Ekspresji', desc: 'Kreatywność i radość jako ścieżka duchowa.', color: '#FBBF24', route: 'Numerology' },
  4: { title: 'Ścieżka Budowniczego', desc: 'Fundament, struktura i długodystansowe tworzenie.', color: '#34D399', route: 'Numerology' },
  5: { title: 'Ścieżka Wolności', desc: 'Zmiana, przygoda i nauka przez doświadczenie.', color: '#F97316', route: 'Numerology' },
  6: { title: 'Ścieżka Opiekuna', desc: 'Miłość, odpowiedzialność i uzdrawianie relacji.', color: '#F472B6', route: 'Numerology' },
  7: { title: 'Ścieżka Mistyka', desc: 'Głębia, analiza i poszukiwanie ukrytej wiedzy.', color: '#A78BFA', route: 'Numerology' },
  8: { title: 'Ścieżka Mocy', desc: 'Manifestacja, obfitość i praca z energią materialną.', color: '#CEAE72', route: 'Numerology' },
  9: { title: 'Ścieżka Humanisty', desc: 'Służba, mądrość i domknięcie cyklu.', color: '#60A5FA', route: 'Numerology' },
};

const DEFAULT_PERSONALIZED = [
  { title: 'Czym jest Droga Życia?', desc: 'Twój numer wyroczni odkryty z daty urodzenia.', color: '#A78BFA', route: 'Numerology' },
  { title: 'Pierwszy horoskop urodzinowy', desc: 'Mapa nieba w chwili Twoich narodzin.', color: '#FBBF24', route: 'Horoscope' },
  { title: 'Archetypy w Twoim życiu', desc: 'Które postacie organizują Twoje doświadczenie?', color: '#F472B6', route: 'Tarot' },
  { title: 'Matryca Przeznaczenia', desc: 'Liczby daty urodzenia jako mapa energii życia.', color: '#34D399', route: 'Matrix' },
];

// ─── QUIZY WIEDZY — 3 quiz topics, rotated daily ─────────────────────────────
const QUIZ_TOPICS = [
  {
    topic: 'Astrologia',
    color: '#FBBF24',
    questions: [
      {
        q: 'Który znak zodiaku rządzi planecie Mars?',
        options: ['Bliźnięta', 'Baran', 'Lew', 'Strzelec'],
        correct: 1,
        explanation: 'Mars jest planetą rządzącą Baranem — żywioł ognia, impuls inicjatywy i działania.',
      },
      {
        q: 'Co oznacza "ascendent" w horoskopie?',
        options: ['Pozycja Słońca', 'Znak wschodzący na wschodzie w momencie narodzin', 'Najsilniejsza planeta', 'Węzeł Księżyca'],
        correct: 1,
        explanation: 'Ascendent to znak zodiaku wschodzący nad horyzontem we wschodzie w chwili urodzin — maska publiczna i styl bycia w świecie.',
      },
      {
        q: 'Ile domów liczy koło horoskopu?',
        options: ['7', '10', '12', '22'],
        correct: 2,
        explanation: '12 domów symbolizuje różne obszary życia — od tożsamości (I dom) po transcendencję i sprawy ukryte (XII dom).',
      },
    ],
  },
  {
    topic: 'Tarot',
    color: '#F472B6',
    questions: [
      {
        q: 'Ile kart zawierają Wielkie Arkana?',
        options: ['12', '14', '22', '78'],
        correct: 2,
        explanation: 'Wielkie Arkana to 22 karty numerowane od 0 (Szaleniec) do 21 (Świat) — mapa etapów duchowej podróży.',
      },
      {
        q: 'Który żywioł reprezentują kielichy w Małych Arkanach?',
        options: ['Ogień', 'Ziemia', 'Powietrze', 'Woda'],
        correct: 3,
        explanation: 'Kielichy (Kielichy/Czary) symbolizują żywioł wody — emocje, relacje, intuicję i świat wewnętrzny.',
      },
      {
        q: 'Co symbolizuje karta Głupiec (Szaleniec)?',
        options: ['Błąd i niewiedzę', 'Czystą potencjalność i nowy początek', 'Szaleństwo i chaos', 'Brak kontroli'],
        correct: 1,
        explanation: 'Szaleniec (karta 0) symbolizuje nieskończone możliwości, odwagę kroku w nieznane i naturę "początku przed początkiem".',
      },
    ],
  },
  {
    topic: 'Czakry',
    color: '#34D399',
    questions: [
      {
        q: 'Która czakra jest związana z komunikacją i głosem?',
        options: ['Anahata', 'Ajna', 'Vishuddha', 'Sahasrara'],
        correct: 2,
        explanation: 'Vishuddha — czakra gardła — zarządza komunikacją, ekspresją, prawdomównością i słuchaniem głębokiego przekazu.',
      },
      {
        q: 'Jaki kolor tradycyjnie przypisuje się czakrze serca?',
        options: ['Niebieski', 'Zielony', 'Żółty', 'Fioletowy'],
        correct: 1,
        explanation: 'Anahata — czakra serca — ma kolor zielony (miłość, uzdrowienie, równowaga) lub różowy w tradycjach tantrycznych.',
      },
      {
        q: 'W którym obszarze ciała zlokalizowana jest Manipura?',
        options: ['Korzeń kręgosłupa', 'Okolice serca', 'Splot słoneczny', 'Czoło'],
        correct: 2,
        explanation: 'Manipura — "miasto klejnotów" — znajduje się w okolicach splotu słonecznego i zarządza wolą, pewnością siebie i siłą własnego ognia.',
      },
    ],
  },
];

const getTodayQuiz = () => {
  const day = new Date().getDate();
  return QUIZ_TOPICS[day % QUIZ_TOPICS.length];
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const KnowledgeScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.60)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.10)';

  // Search / category filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Encyclopedia expand state
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [encyclopediaSearch, setEncyclopediaSearch] = useState('');

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Oracle state
  const [oracleQuery, setOracleQuery] = useState('');
  const [oracleAnswer, setOracleAnswer] = useState('');
  const [oracleLoading, setOracleLoading] = useState(false);

  // Per-section Oracle AI state
  const [sectionOracleAnswer, setSectionOracleAnswer] = useState<Record<string, string>>({});
  const [sectionOracleLoading, setSectionOracleLoading] = useState<Record<string, boolean>>({});

  // Progress state
  const [articlesRead, setArticlesRead] = useState(0);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [studyStreak] = useState(3); // mock streak

  // Derived
  const weeklyArticle = useMemo(() => {
    const idx = Math.floor(new Date().getDate() / 7) % WEEKLY_ARTICLES.length;
    return WEEKLY_ARTICLES[idx];
  }, []);

  const filteredConcepts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const catFilter = activeCategory;
    if (!q && !catFilter) return DAILY_CONCEPTS;
    return DAILY_CONCEPTS.filter(concept => {
      const matchesSearch = !q || concept.term.toLowerCase().includes(q) || concept.desc.toLowerCase().includes(q);
      const matchesCategory = !catFilter || (() => {
        const map: Record<string, string[]> = {
          astrologia: ['Retrograd', 'Tranzyt', 'Kwadratura', 'Księżyc nów', 'Synchroniczność'],
          numerologia: ['Numerologia', 'Intencja'],
          tarot: ['Archetyp', 'Inicjacja'],
          chakry: ['Aura', 'Cień'],
          krysztal: ['Sigil', 'Aura'],
          rytualy: ['Inicjacja', 'Intencja', 'Sigil'],
        };
        return (map[catFilter] || []).includes(concept.term);
      })();
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const filteredEncyclopedia = useMemo(() => {
    const q = encyclopediaSearch.toLowerCase().trim();
    if (!q) return ENCYCLOPEDIA_ENTRIES;
    return ENCYCLOPEDIA_ENTRIES.filter(e =>
      e.term.toLowerCase().includes(q) ||
      e.short.toLowerCase().includes(q) ||
      e.full.toLowerCase().includes(q)
    );
  }, [encyclopediaSearch]);

  // Personalized articles based on zodiac + life path
  const personalizedArticles = useMemo(() => {
    const zodiac = userData?.zodiacSign?.toLowerCase() ?? '';
    const zodiacArticles = PERSONALIZED_ARTICLES[zodiac] ?? [];

    // Calculate life path number
    let lifePath = 0;
    if (userData?.birthDate) {
      const digits = userData.birthDate.replace(/-/g, '').split('').map(Number);
      let sum = digits.reduce((a, b) => a + b, 0);
      while (sum > 9 && sum !== 11 && sum !== 22) {
        sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0);
      }
      lifePath = sum;
    }
    const pathArticle = PATH_ARTICLES[lifePath];

    const base = pathArticle ? [pathArticle] : [];
    const combined = [...zodiacArticles.slice(0, 1), ...base, ...DEFAULT_PERSONALIZED].slice(0, 4);
    return combined;
  }, [userData]);

  // Quiz
  const todayQuiz = useMemo(() => getTodayQuiz(), []);

  const handleQuizAnswer = (qIdx: number, aIdx: number) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: aIdx }));
  };

  const handleQuizSubmit = () => {
    const score = todayQuiz.questions.reduce((acc, q, i) => acc + (quizAnswers[i] === q.correct ? 1 : 0), 0);
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  // Section-level Oracle deepening
  const handleSectionOracle = async (blockId: string, blockTitle: string, bullets: string[]) => {
    if (sectionOracleLoading[blockId]) return;
    setSectionOracleLoading(prev => ({ ...prev, [blockId]: true }));
    try {
      const messages = [
        {
          role: 'user' as const,
          content: `Jestem przewodnikiem duchowym w aplikacji Aethera. Proszę o głębszy kontekst na temat: "${blockTitle}".
Kluczowe obszary: ${bullets.join(', ')}.
Odpowiedz w języku użytkownika, 3-4 zdania, poetycko i mądrze. Podaj praktyczną wskazówkę na dziś.`,
        },
      ];
      const resp = await AiService.chatWithOracle(messages);
      setSectionOracleAnswer(prev => ({ ...prev, [blockId]: resp ?? 'Nie udało się uzyskać odpowiedzi.' }));
    } catch {
      setSectionOracleAnswer(prev => ({ ...prev, [blockId]: 'Oracle chwilowo niedostępny.' }));
    } finally {
      setSectionOracleLoading(prev => ({ ...prev, [blockId]: false }));
    }
  };

  // Oracle
  const handleOracleAsk = async () => {
    if (!oracleQuery.trim() || oracleLoading) return;
    setOracleLoading(true);
    setOracleAnswer('');
    try {
      const messages = [
        {
          role: 'user' as const,
          content: `Jestem duchowym przewodnikiem w aplikacji Aethera. Odpowiedz na pytanie użytkownika dotyczące duchowości, mistycyzmu i symboli. Bądź głęboki, mądry i praktyczny. Odpowiedź w języku użytkownika, 3-4 zdania.\n\nPytanie: ${oracleQuery}`,
        },
      ];
      const resp = await AiService.chatWithOracle(messages);
      setOracleAnswer(resp ?? 'Nie udało się uzyskać odpowiedzi. Spróbuj ponownie.');
    } catch {
      setOracleAnswer('Oracle chwilowo niedostępny. Spróbuj za chwilę.');
    } finally {
      setOracleLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <CelestialBackdrop intensity="immersive" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Home')} style={styles.backBtn} hitSlop={20}>
            <ChevronLeft color={currentTheme.primary} size={28} />
          </Pressable>
          <View style={styles.headerTitle}>
            <Typography variant="premiumLabel" color={currentTheme.primary}>{t('knowledge.biblioteka_wiedzy', 'Biblioteka wiedzy')}</Typography>
            <Typography variant="screenTitle" style={{ marginTop: 4 }}>{t('knowledge.mistyczne_mapy_symbole_i_tradycje', 'Mistyczne mapy, symbole i tradycje')}</Typography>
          </View>
          <Pressable
            onPress={() => { if (isFavoriteItem('knowledge')) { removeFavoriteItem('knowledge'); } else { addFavoriteItem({ id: 'knowledge', label: 'Biblioteka', route: 'Knowledge', params: {}, icon: 'BookOpen', color: currentTheme.primary, addedAt: new Date().toISOString() }); } }}
            style={[styles.backBtn, { alignItems: 'center', justifyContent: 'center' }]}
            hitSlop={12}
          >
            <Star color={isFavoriteItem('knowledge') ? currentTheme.primary : currentTheme.primary + '88'} size={18} strokeWidth={1.8} fill={isFavoriteItem('knowledge') ? currentTheme.primary : 'none'} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
          keyboardVerticalOffset={insets.top + 56}
        >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') }]}
          showsVerticalScrollIndicator={false}
        >
          <SectionHeading
            eyebrow="Odkrywaj"
            title={t('knowledge.wejdz_glebiej_w_mistyczne_tradycje', 'Wejdź głębiej w mistyczne tradycje i języki symboli.')}
            subtitle={t('knowledge.to_przestrzen_dla_osob_ktore', 'To przestrzeń dla osób, które chcą rozumieć nie tylko wynik odczytu, ale też systemy, z których on wyrasta: fazy księżyca, archetypy, runy, praktyki ochronne, intencję i święte timingi.')}
          />
          <RuneOrb3D accent={currentTheme.primary} isLight={isLight} />

          {/* ── 🔍 SZUKAJ ── */}
          <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Search color={subColor} size={16} strokeWidth={1.6} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('knowledge.szukaj_pojec_tradycji_praktyk', 'Szukaj pojęć, tradycji, praktyk…')}
              placeholderTextColor={subColor}
              style={[styles.searchInput, { color: textColor }]}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

          {/* ── Pojęcie dnia ── */}
          {(() => {
            const concept = getTodayConcept();
            return (
              <Animated.View entering={FadeInDown.delay(40).duration(500)}>
                <View style={{ marginBottom: 14, borderRadius: 16, padding: 18, backgroundColor: cardBg, borderLeftWidth: 3, borderLeftColor: concept.color, borderTopWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.08)', borderRightColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.08)', borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.08)' }}>
                  <Typography variant="microLabel" color={concept.color} style={{ letterSpacing: 1.5, marginBottom: 8 }}>{t('knowledge.pojecie_dnia', '📖 POJĘCIE DNIA')}</Typography>
                  <Typography variant="cardTitle" style={{ color: textColor, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>{concept.term}</Typography>
                  <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 21 }}>{concept.desc}</Typography>
                </View>
              </Animated.View>
            );
          })()}

          {/* ── Hero copy ── */}
          <View style={{ paddingHorizontal: layout.padding.screen, paddingVertical: 16 }}>
            <Typography variant="bodyRefined" style={{ color: subColor, lineHeight: 24 }}>
              {t('knowledge.wiedze_o_astrologii_numerologi_rytu', 'Wiedzę o astrologii, numerologii, rytuałach, symbolice i duchowych tradycjach — podaną spokojnie, bez ezoterycznego hałasu.')}
            </Typography>
          </View>

          {/* ── 📚 KATEGORIE WIEDZY ── */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
            <Typography variant="microLabel" color={currentTheme.primary} style={{ letterSpacing: 1.5, marginBottom: 12 }}>{t('knowledge.kategorie_wiedzy', '📚 KATEGORIE WIEDZY')}</Typography>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {KNOWLEDGE_CATEGORIES.map(cat => {
                const active = activeCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setActiveCategory(active ? null : cat.id)}
                    style={({ pressed }) => [styles.catTile, {
                      width: '30%',
                      backgroundColor: active ? cat.color + '22' : cardBg,
                      borderColor: active ? cat.color : cardBorder,
                      opacity: pressed ? 0.75 : 1,
                    }]}
                  >
                    <Typography style={{ fontSize: 22, marginBottom: 4 }}>{cat.emoji}</Typography>
                    <Typography variant="cardTitle" style={{ color: active ? cat.color : textColor, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>{cat.label}</Typography>
                    <View style={[styles.catBadge, { backgroundColor: cat.color + '22' }]}>
                      <Typography variant="microLabel" style={{ color: cat.color, fontSize: 9 }}>{cat.count}</Typography>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          {/* ═══════════════════════════════════════════════════════
              SECTION — POSTĘP NAUKI
          ═══════════════════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.delay(60).duration(500)}>
            <Typography variant="microLabel" color={currentTheme.primary} style={{ letterSpacing: 1.5, marginBottom: 12 }}>{t('knowledge.postep_nauki', '📊 POSTĘP NAUKI')}</Typography>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
              {[
                { label: 'Artykuły', value: articlesRead, icon: <BookOpen color={currentTheme.primary} size={15} strokeWidth={1.6} />, color: currentTheme.primary },
                { label: 'Quizy', value: quizScore !== null ? `${quizScore}/3` : '—', icon: <Brain color='#A78BFA' size={15} strokeWidth={1.6} />, color: '#A78BFA' },
                { label: 'Dni z rzędu', value: studyStreak, icon: <Zap color='#FBBF24' size={15} strokeWidth={1.6} />, color: '#FBBF24' },
              ].map((stat, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: cardBg, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: cardBorder, padding: 12, alignItems: 'center' }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: stat.color + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                    {stat.icon}
                  </View>
                  <Typography variant="cardTitle" style={{ color: stat.color, fontSize: 18, fontWeight: '700' }}>{stat.value}</Typography>
                  <Typography variant="microLabel" style={{ color: subColor, fontSize: 10, letterSpacing: 1, marginTop: 2, textAlign: 'center' }}>{stat.label.toUpperCase()}</Typography>
                </View>
              ))}
            </View>
          </Animated.View>

          <View style={styles.divider} />

          {/* ═══════════════════════════════════════════════════════
              SECTION — ARTYKUŁ TYGODNIA
          ═══════════════════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.delay(30).duration(500)}>
            <View style={{ marginBottom: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: weeklyArticle.color + '33' }}>
              <LinearGradient colors={[weeklyArticle.color + '1A', weeklyArticle.color + '08', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={{ padding: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Typography variant="microLabel" style={{ color: weeklyArticle.color, letterSpacing: 1.5 }}>{t('knowledge.artykul_tygodnia', '📖 ARTYKUŁ TYGODNIA')}</Typography>
                  <View style={{ flex: 1 }} />
                  <View style={[styles.readingTimeBadge, { backgroundColor: weeklyArticle.color + '22', borderColor: weeklyArticle.color + '44' }]}>
                    <Clock color={weeklyArticle.color} size={10} strokeWidth={1.8} />
                    <Typography variant="microLabel" style={{ color: weeklyArticle.color, fontSize: 10 }}>{weeklyArticle.readingTime}</Typography>
                  </View>
                </View>
                <Typography variant="cardTitle" style={{ color: textColor, fontSize: 17, fontWeight: '700', lineHeight: 24, marginBottom: 10 }}>{weeklyArticle.title}</Typography>
                <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 21 }}>{weeklyArticle.excerpt}</Typography>
                <Pressable
                  onPress={() => setArticlesRead(n => n + 1)}
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}
                >
                  <View style={[styles.catBadge, { backgroundColor: weeklyArticle.color + '22', borderColor: weeklyArticle.color + '33', borderWidth: 1, marginRight: 8 }]}>
                    <Typography variant="microLabel" style={{ color: weeklyArticle.color, fontSize: 10 }}>{weeklyArticle.category.toUpperCase()}</Typography>
                  </View>
                  <ChevronRight color={weeklyArticle.color} size={14} strokeWidth={1.8} />
                </Pressable>
              </View>
            </View>
          </Animated.View>

          <View style={styles.divider} />

          {/* ═══════════════════════════════════════════════════════
              SECTION — ENCYKLOPEDIA DUCHOWA (15 entries)
          ═══════════════════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <Typography variant="microLabel" color={currentTheme.primary} style={{ letterSpacing: 1.5, marginBottom: 12 }}>{t('knowledge.encykloped_duchowa', '📘 ENCYKLOPEDIA DUCHOWA')}</Typography>

            {/* Encyclopedia search */}
            <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor: cardBorder, marginBottom: 14 }]}>
              <Search color={subColor} size={14} strokeWidth={1.6} />
              <TextInput
                value={encyclopediaSearch}
                onChangeText={setEncyclopediaSearch}
                placeholder={t('knowledge.szukaj_w_encykloped', 'Szukaj w encyklopedii…')}
                placeholderTextColor={subColor}
                style={[styles.searchInput, { color: textColor }]}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>

            {filteredEncyclopedia.map((entry, i) => {
              const expanded = expandedEntry === entry.term;
              return (
                <Pressable
                  key={entry.term}
                  onPress={() => setExpandedEntry(expanded ? null : entry.term)}
                  style={({ pressed }) => ({
                    marginBottom: 8,
                    borderRadius: 14,
                    backgroundColor: expanded ? entry.color + '10' : cardBg,
                    borderWidth: 1,
                    borderColor: expanded ? entry.color + '40' : cardBorder,
                    overflow: 'hidden',
                    opacity: pressed ? 0.82 : 1,
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: entry.color, flexShrink: 0 }} />
                    <View style={{ flex: 1 }}>
                      <Typography variant="label" style={{ color: textColor, fontWeight: '700', fontSize: 15 }}>{entry.term}</Typography>
                      <Typography variant="bodySmall" style={{ color: subColor, marginTop: 2, lineHeight: 18 }}>{entry.short}</Typography>
                    </View>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: entry.color + '18', alignItems: 'center', justifyContent: 'center' }}>
                      {expanded
                        ? <ChevronUp color={entry.color} size={12} strokeWidth={2} />
                        : <ChevronDown color={entry.color} size={12} strokeWidth={2} />
                      }
                    </View>
                  </View>
                  {expanded && (
                    <View style={{ paddingHorizontal: 14, paddingBottom: 16, paddingTop: 2 }}>
                      <View style={{ height: 1, backgroundColor: entry.color + '22', marginBottom: 12 }} />
                      <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 22 }}>{entry.full}</Typography>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </Animated.View>

          <View style={styles.divider} />

          {/* ═══════════════════════════════════════════════════════
              SECTION — POLECANE DLA CIEBIE
          ═══════════════════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Typography variant="microLabel" color={currentTheme.primary} style={{ letterSpacing: 1.5, marginBottom: 12 }}>{t('knowledge.polecane_dla_ciebie', '✨ POLECANE DLA CIEBIE')}</Typography>
            {personalizedArticles.map((art, i) => (
              <Pressable
                key={i}
                onPress={() => { navigation.navigate(art.route); setArticlesRead(n => n + 1); }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: cardBg,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: art.color + '30',
                  marginBottom: 8,
                  opacity: pressed ? 0.78 : 1,
                })}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: art.color + '1C', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Sparkles color={art.color} size={16} strokeWidth={1.6} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="label" style={{ color: textColor, fontWeight: '600', fontSize: 14 }}>{art.title}</Typography>
                  <Typography variant="bodySmall" style={{ color: subColor, marginTop: 2, lineHeight: 18 }}>{art.desc}</Typography>
                </View>
                <ChevronRight color={art.color} size={14} strokeWidth={1.8} />
              </Pressable>
            ))}
          </Animated.View>

          <View style={styles.divider} />

          {/* ═══════════════════════════════════════════════════════
              SECTION — QUIZY WIEDZY
          ═══════════════════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.delay(120).duration(500)}>
            <View style={{ marginBottom: 18, borderRadius: 20, borderWidth: 1, borderColor: todayQuiz.color + '33', overflow: 'hidden' }}>
              <LinearGradient colors={[todayQuiz.color + '15', todayQuiz.color + '06', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={{ padding: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Brain color={todayQuiz.color} size={16} strokeWidth={1.6} />
                  <Typography variant="microLabel" style={{ color: todayQuiz.color, letterSpacing: 1.5 }}>{t('knowledge.quiz_wiedzy_dnia', 'QUIZ WIEDZY DNIA')}</Typography>
                  <View style={{ flex: 1 }} />
                  <View style={{ backgroundColor: todayQuiz.color + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Typography variant="microLabel" style={{ color: todayQuiz.color, fontSize: 10 }}>{todayQuiz.topic.toUpperCase()}</Typography>
                  </View>
                </View>
                <Typography variant="bodySmall" style={{ color: subColor, marginBottom: 16, marginTop: 4 }}>{t('knowledge.3_pytania_odpowiedz_i_sprawdz', '3 pytania · Odpowiedz i sprawdź swoją wiedzę')}</Typography>

                {todayQuiz.questions.map((q, qi) => (
                  <View key={qi} style={{ marginBottom: 16 }}>
                    <Typography variant="label" style={{ color: textColor, fontWeight: '600', marginBottom: 8, lineHeight: 20 }}>
                      {qi + 1}. {q.q}
                    </Typography>
                    {q.options.map((opt, oi) => {
                      const selected = quizAnswers[qi] === oi;
                      const isCorrect = oi === q.correct;
                      let bg = cardBg;
                      let border = cardBorder;
                      let txtColor = subColor;
                      if (quizSubmitted && isCorrect) { bg = '#34D399' + '18'; border = '#34D399' + '55'; txtColor = '#34D399'; }
                      else if (quizSubmitted && selected && !isCorrect) { bg = '#EF4444' + '15'; border = '#EF4444' + '44'; txtColor = '#EF4444'; }
                      else if (!quizSubmitted && selected) { bg = todayQuiz.color + '1A'; border = todayQuiz.color + '55'; txtColor = todayQuiz.color; }
                      return (
                        <Pressable
                          key={oi}
                          onPress={() => handleQuizAnswer(qi, oi)}
                          style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            padding: 10,
                            borderRadius: 10,
                            backgroundColor: bg,
                            borderWidth: 1,
                            borderColor: border,
                            marginBottom: 6,
                            opacity: pressed && !quizSubmitted ? 0.78 : 1,
                          })}
                        >
                          <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {selected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: quizSubmitted ? (isCorrect ? '#34D399' : '#EF4444') : todayQuiz.color }} />}
                          </View>
                          <Typography variant="bodySmall" style={{ color: txtColor, flex: 1, lineHeight: 18 }}>{opt}</Typography>
                          {quizSubmitted && isCorrect && <CheckCircle color="#34D399" size={14} strokeWidth={2} />}
                        </Pressable>
                      );
                    })}
                    {quizSubmitted && (
                      <View style={{ backgroundColor: cardBg, borderRadius: 10, padding: 10, marginTop: 4 }}>
                        <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 19, fontStyle: 'italic' }}>
                          💡 {q.explanation}
                        </Typography>
                      </View>
                    )}
                  </View>
                ))}

                {!quizSubmitted ? (
                  <Pressable
                    onPress={handleQuizSubmit}
                    disabled={Object.keys(quizAnswers).length < todayQuiz.questions.length}
                    style={({ pressed }) => ({
                      backgroundColor: Object.keys(quizAnswers).length < todayQuiz.questions.length
                        ? todayQuiz.color + '30'
                        : todayQuiz.color,
                      borderRadius: 12,
                      padding: 12,
                      alignItems: 'center',
                      opacity: pressed ? 0.82 : 1,
                    })}
                  >
                    <Typography variant="label" style={{ color: '#fff', letterSpacing: 1.5 }}>{t('knowledge.sprawdz_odpowiedzi', 'SPRAWDŹ ODPOWIEDZI')}</Typography>
                  </Pressable>
                ) : (
                  <View style={{ backgroundColor: todayQuiz.color + '15', borderRadius: 12, padding: 12, alignItems: 'center' }}>
                    <Trophy color={todayQuiz.color} size={20} strokeWidth={1.6} style={{ marginBottom: 6 }} />
                    <Typography variant="cardTitle" style={{ color: todayQuiz.color, fontSize: 20 }}>{quizScore}/3 poprawnych</Typography>
                    <Typography variant="bodySmall" style={{ color: subColor, marginTop: 4 }}>
                      {(quizScore ?? 0) === 3 ? 'Doskonały wynik! Mistrz wiedzy.' : (quizScore ?? 0) >= 2 ? 'Świetnie! Wiesz coraz więcej.' : 'Dobry początek — wracaj po więcej.'}
                    </Typography>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          <View style={styles.divider} />

          {/* ── Komnaty wiedzy — 2-column tiles ── */}
          <View style={{ marginBottom: 8 }}>
            <Typography variant="microLabel" color={currentTheme.primary} style={{ letterSpacing: 1.5, marginBottom: 12 }}>{t('knowledge.komnaty_wiedzy', 'KOMNATY WIEDZY')}</Typography>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {KNOWLEDGE_CHAMBERS.map((chamber) => {
                const Icon = chamber.IconComp;
                return (
                  <Pressable
                    key={chamber.id}
                    onPress={() => navigation.navigate(chamber.route, chamber.route === 'JournalEntry' ? { prompt: 'Jaką wiedzę z tej komnaty chcę dziś naprawdę zintegrować?', type: 'reflection' } : undefined)}
                    style={({ pressed }) => ({
                      width: '47%',
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : currentTheme.primary + '0E',
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: isLight ? 'rgba(139,100,42,0.30)' : currentTheme.primary + '22',
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: currentTheme.primary + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <Icon color={currentTheme.primary} size={17} strokeWidth={1.7} />
                    </View>
                    <Typography variant="cardTitle" style={{ color: textColor, marginBottom: 5 }}>{chamber.title}</Typography>
                    <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 18, fontSize: 12 }}>{chamber.copy}</Typography>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          {/* ── Knowledge blocks ── */}
          <View style={{ marginBottom: 4 }}>
            <Typography variant="microLabel" color={currentTheme.primary} style={{ letterSpacing: 1.5, marginBottom: 4 }}>{t('knowledge.obszary_wiedzy', 'OBSZARY WIEDZY')}</Typography>
          </View>
          {KNOWLEDGE_BLOCKS.map((block, index, arr) => {
            const BlockIcon = block.IconComp;
            const secAnswer  = sectionOracleAnswer[block.id];
            const secLoading = sectionOracleLoading[block.id];
            return (
              <Animated.View key={block.id} entering={FadeInDown.delay(index * 80).duration(400)}>
                <View style={{
                  borderRadius: 16,
                  backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)',
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: isLight ? 'rgba(139,100,42,0.32)' : 'rgba(255,255,255,0.07)',
                  marginBottom: 10,
                  overflow: 'hidden',
                }}>
                  <Pressable
                    onPress={() => { const route = KNOWLEDGE_ROUTES[block.id]; if (route) navigation.navigate(route); }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 14,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: currentTheme.primary + '18', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                      <BlockIcon color={currentTheme.primary} size={18} strokeWidth={1.6} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="label" style={{ fontWeight: '600', color: textColor }}>{block.title}</Typography>
                      <Typography variant="bodySmall" style={{ color: subColor, marginTop: 2, lineHeight: 18 }}>{block.bullets.join(' · ')}</Typography>
                    </View>
                    <ChevronRight color={currentTheme.primary + '66'} size={14} strokeWidth={1.8} />
                  </Pressable>

                  {/* Zapytaj Oracle AI button */}
                  <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
                    <Pressable
                      onPress={() => handleSectionOracle(block.id, block.title, block.bullets)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        backgroundColor: isLight ? currentTheme.primary + '12' : currentTheme.primary + '18',
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: currentTheme.primary + '33',
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      {secLoading
                        ? <ActivityIndicator size="small" color={currentTheme.primary} />
                        : <WandSparkles size={13} color={currentTheme.primary} strokeWidth={1.6} />
                      }
                      <Typography variant="microLabel" style={{ color: currentTheme.primary, letterSpacing: 0.8, fontSize: 11 }}>
                        {secLoading ? 'Zapytuję Oracle…' : 'Zapytaj Oracle o głębszy kontekst'}
                      </Typography>
                    </Pressable>
                    {!!secAnswer && (
                      <Animated.View entering={FadeInDown.duration(400)} style={{
                        marginTop: 8,
                        backgroundColor: isLight ? currentTheme.primary + '0C' : currentTheme.primary + '0E',
                        borderRadius: 10,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: currentTheme.primary + '25',
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <Sparkles color={currentTheme.primary} size={11} strokeWidth={1.6} />
                          <Typography variant="microLabel" style={{ color: currentTheme.primary, letterSpacing: 1, fontSize: 10 }}>{t('knowledge.oracle', 'ORACLE')}</Typography>
                        </View>
                        <Typography variant="bodySmall" style={{ color: isLight ? '#2A1A0A' : textColor, lineHeight: 20 }}>{secAnswer}</Typography>
                      </Animated.View>
                    )}
                  </View>
                </View>
              </Animated.View>
            );
          })}

          <View style={styles.divider} />

          {/* ── Navigation entries ── */}
          <View style={{ marginBottom: 4 }}>
            <Typography variant="microLabel" color={currentTheme.primary} style={{ letterSpacing: 1.5 }}>{t('knowledge.glebsze_wejscia', 'GŁĘBSZE WEJŚCIA')}</Typography>
          </View>
          {[
            { icon: Binary,        color: '#34D399', label: 'Numerologia',          desc: 'Droga życia, liczby relacji, cykle roczne',        onPress: () => navigation.navigate('Numerology') },
            { icon: Shield,        color: '#60A5FA', label: 'Oczyszczanie',          desc: 'Uwalnianie, ochrona i praktyki granic',            onPress: () => navigateToDashboardSurface(navigation, 'cleansing') },
            { icon: MoonStar,      color: '#A78BFA', label: 'Gwiazdy i cykle',       desc: 'Astrologia, znaki, żywioły, symbolika kosmiczna',  onPress: () => navigation.navigate('Stars') },
            { icon: Sparkles,      color: '#FBBF24', label: 'Tarot i archetypy',     desc: 'Wielkie Arkana, spready i dossier interpretacji',  onPress: () => navigateToDashboardSurface(navigation, 'tarot') },
            { icon: HeartHandshake,color: '#F472B6', label: 'Symbolika relacji',     desc: 'Połącz archetypy z dynamiką między dwojgiem',      onPress: () => navigation.navigate('Compatibility') },
          ].map(({ icon: Icon, color, label, desc, onPress }, idx, arr) => (
            <Pressable
              key={label}
              onPress={onPress}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                opacity: pressed ? 0.7 : 1,
                borderBottomWidth: idx < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.06)',
              })}
            >
              <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Icon color={color} size={18} strokeWidth={1.7} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="label" style={{ fontWeight: '600', color: textColor }}>{label}</Typography>
                <Typography variant="bodySmall" style={{ color: subColor, marginTop: 2 }}>{desc}</Typography>
              </View>
              <Moon color={isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)'} size={14} strokeWidth={1.5} />
            </Pressable>
          ))}

          <View style={styles.divider} />

          {/* ── Słownik duchowy ── */}
          <View style={{ marginBottom: 6 }}>
            <Typography variant="microLabel" color={currentTheme.primary} style={{ letterSpacing: 1.5, marginBottom: 10 }}>
              {searchQuery || activeCategory ? '🔍 WYNIKI WYSZUKIWANIA' : '📚 SŁOWNIK DUCHOWY'}
            </Typography>
            {filteredConcepts.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Typography variant="bodySmall" style={{ color: subColor, textAlign: 'center' }}>{t('knowledge.brak_pojec_pasujacych_do_zapytania', 'Brak pojęć pasujących do zapytania.')}</Typography>
              </View>
            ) : filteredConcepts.slice(0, searchQuery || activeCategory ? filteredConcepts.length : 6).map((item, i, arr) => (
              <Animated.View key={item.term} entering={FadeInDown.delay(i * 40).duration(380)}>
                <View style={{ paddingVertical: 13, borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.07)', flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color, marginTop: 7 }} />
                  <View style={{ flex: 1 }}>
                    <Typography variant="label" style={{ fontWeight: '700', color: textColor, marginBottom: 3 }}>{item.term}</Typography>
                    <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 19 }}>{item.desc}</Typography>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* ═══════════════════════════════════════════════════════
              SECTION — NAUKA Z ORACLE
          ═══════════════════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.delay(140).duration(500)}>
            <View style={{ borderRadius: 20, borderWidth: 1, borderColor: currentTheme.primary + '33', overflow: 'hidden', marginBottom: 18 }}>
              <LinearGradient colors={[currentTheme.primary + '15', currentTheme.primary + '06', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={{ padding: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <WandSparkles color={currentTheme.primary} size={16} strokeWidth={1.6} />
                  <Typography variant="microLabel" color={currentTheme.primary} style={{ letterSpacing: 1.5 }}>{t('knowledge.nauka_z_oracle', 'NAUKA Z ORACLE')}</Typography>
                </View>
                <Typography variant="bodySmall" style={{ color: subColor, marginBottom: 14, lineHeight: 20 }}>
                  {t('knowledge.zapytaj_oracle_o_dowolny_koncept', 'Zapytaj Oracle o dowolny koncept duchowy — symbol, tradycję, praktykę lub pojęcie.')}
                </Typography>

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                  <TextInput
                    value={oracleQuery}
                    onChangeText={setOracleQuery}
                    placeholder={t('knowledge.np_co_oznacza_mudra_gyan', 'np. Co oznacza mudra Gyan?')}
                    placeholderTextColor={subColor}
                    style={[{
                      flex: 1,
                      fontSize: 14,
                      color: textColor,
                      backgroundColor: cardBg,
                      borderWidth: 1,
                      borderColor: cardBorder,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                    }]}
                    returnKeyType="send"
                    onSubmitEditing={handleOracleAsk}
                  />
                  <Pressable
                    onPress={handleOracleAsk}
                    disabled={!oracleQuery.trim() || oracleLoading}
                    style={({ pressed }) => ({
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: oracleQuery.trim() ? currentTheme.primary : currentTheme.primary + '44',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    {oracleLoading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Send color="#fff" size={16} strokeWidth={1.8} />
                    }
                  </Pressable>
                </View>

                {/* Suggestion chips */}
                {!oracleAnswer && !oracleLoading && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {['Czym jest karma?', 'Jak działa mantra?', 'Co to jest mudra?', 'Czym jest dharma?'].map(s => (
                        <Pressable
                          key={s}
                          onPress={() => setOracleQuery(s)}
                          style={{ backgroundColor: currentTheme.primary + '18', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: currentTheme.primary + '33' }}
                        >
                          <Typography variant="microLabel" color={currentTheme.primary} style={{ fontSize: 11 }}>{s}</Typography>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                )}

                {oracleAnswer !== '' && (
                  <View style={{ backgroundColor: currentTheme.primary + '0E', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: currentTheme.primary + '25', marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Sparkles color={currentTheme.primary} size={13} strokeWidth={1.6} />
                      <Typography variant="microLabel" color={currentTheme.primary} style={{ letterSpacing: 1.2 }}>{t('knowledge.odpowiedz_oracle', 'ODPOWIEDŹ ORACLE')}</Typography>
                    </View>
                    <Typography variant="bodySmall" style={{ color: textColor, lineHeight: 22 }}>{oracleAnswer}</Typography>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          {/* ── Journal integration CTA ── */}
          <Pressable
            onPress={() => navigation.navigate('JournalEntry', { prompt: 'Jaką mistyczną wiedzę chcę dziś przełożyć na własny język i praktykę?', type: 'reflection' })}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              marginVertical: 4,
              padding: 18,
              borderRadius: 18,
              backgroundColor: currentTheme.primary + '14',
              borderWidth: 1,
              borderColor: currentTheme.primary + '30',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <WandSparkles color={currentTheme.primary} size={20} strokeWidth={1.6} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Typography variant="label" style={{ fontWeight: '700', color: textColor }}>{t('knowledge.dziennik_integracji_wiedzy', 'Dziennik integracji wiedzy')}</Typography>
              <Typography variant="bodySmall" style={{ color: subColor, marginTop: 3 }}>{t('knowledge.nazwij_wlasnymi_slowami_co_ma', 'Nazwij własnymi słowami, co ma dla Ciebie znaczenie w praktyce')}</Typography>
            </View>
            <Sparkles color={currentTheme.primary} size={16} strokeWidth={1.5} />
          </Pressable>

          <View style={styles.divider} />

          {/* ── CO DALEJ? ── */}
          <Typography variant="microLabel" color={currentTheme.primary} style={{ letterSpacing: 1.5, marginBottom: 12 }}>{t('knowledge.co_dalej', '✦ CO DALEJ?')}</Typography>
          {[
            { label: 'Wyrocznia', desc: 'Zapytaj o znaczenie symbolu lub systemu', route: 'OraclePortal', color: '#A78BFA' },
            { label: 'Atlas zodiakalny', desc: 'Wszystkie znaki, planety i aspekty', route: 'Stars', color: '#FBBF24' },
            { label: 'Horoskop dzienny', desc: 'Twój aktualny kosmiczny klimat', route: 'Horoscope', color: '#60A5FA' },
          ].map(link => (
            <Pressable
              key={link.route}
              onPress={() => navigation.navigate(link.route)}
              style={({ pressed }) => [styles.codalejCard, {
                backgroundColor: cardBg,
                borderColor: link.color + '33',
                opacity: pressed ? 0.75 : 1,
              }]}
            >
              <View style={[styles.codalejDot, { backgroundColor: link.color + '22' }]}>
                <Sparkles color={link.color} size={15} strokeWidth={1.6} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="label" style={{ fontWeight: '700', color: textColor }}>{link.label}</Typography>
                <Typography variant="bodySmall" style={{ color: subColor, marginTop: 2 }}>{link.desc}</Typography>
              </View>
              <ChevronRight color={link.color} size={15} strokeWidth={1.8} />
            </Pressable>
          ))}

          <EndOfContentSpacer size="standard" />
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', height: 72, paddingHorizontal: layout.padding.screen },
  backBtn: { width: 40 },
  headerTitle: { flex: 1, alignItems: 'center' },
  scrollContent: { flexGrow: 1, paddingHorizontal: layout.padding.screen, paddingTop: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  catTile: { alignItems: 'center', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 12, paddingHorizontal: 6 },
  catBadge: { marginTop: 4, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  readingTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  codalejCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 14, marginBottom: 10 },
  codalejDot: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: 'rgba(128,128,128,0.10)', marginVertical: 14 },
  // legacy (kept for compatibility)
  heroCard: { padding: 20, marginTop: 10 },
  heroCopy: { marginTop: 12, lineHeight: 26 },
  readingDeck: { padding: 22, marginTop: 14 },
  readingGrid: { gap: 10, marginTop: 16 },
  readingTile: { borderRadius: 18, borderWidth: 1, padding: 16 },
  readingCopy: { marginTop: 8, lineHeight: 21, opacity: 0.82 },
  chamberDeck: { padding: 22, marginTop: 14 },
  deckCopy: { marginTop: 10, lineHeight: 23, opacity: 0.82 },
  chamberGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  chamberTile: { width: '48%', borderRadius: 18, borderWidth: 1, padding: 16, minHeight: 156 },
  chamberIcon: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  chamberTitle: { marginBottom: 8 },
  chamberCopy: { lineHeight: 21, opacity: 0.8 },
  blockCard: { padding: 22, marginTop: 14, minHeight: 164 },
  blockCopy: { marginTop: 10, lineHeight: 23, opacity: 0.84 },
  entryStack: { marginTop: 18, gap: 12 },
  entryCard: { padding: 22, minHeight: 146 },
  entryHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  entryCopy: { marginTop: 10, lineHeight: 23, opacity: 0.84 },
  aiCard: { padding: 22, marginTop: 12, minHeight: 146 },
  learningStack: { marginTop: 16, gap: 10 },
  learningRow: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  learningCopy: { flex: 1, marginLeft: 12 },
});
