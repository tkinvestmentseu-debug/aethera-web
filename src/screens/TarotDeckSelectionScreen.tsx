// @ts-nocheck
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, TextInput, Modal, Dimensions, Text } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Line, Rect, Defs, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';
import { ChevronLeft, ArrowRight, CheckCircle2, Sparkles, Moon, TrendingUp, BookOpen, Star, Layers, X, Scale, Flame, GitCompare } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { TAROT_DECKS, getTarotDeckById } from '../features/tarot/data/decks';
import { useTarotStore } from '../features/tarot/store/useTarotStore';
import { TarotCardVisual } from '../features/tarot/components/TarotCardVisual';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';

const ACCENT = '#CEAE72';
const { width: SW } = Dimensions.get('window');

// ─── Premium SVG background ──────────────────────────────────────────────────
const DeckSelectionBg = ({ isLight }: { isLight: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight ? ['#FBF5EC', '#F2E8D4', '#FBF0D8'] : ['#07050F', '#0D0A1A', '#120B16']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={760} style={StyleSheet.absoluteFill} opacity={isLight ? 0.10 : 0.16}>
      <G>
        {[100, 180, 270, 370, 480].map((r, i) => (
          <Circle key={i} cx={SW / 2} cy={220} r={r}
            stroke={ACCENT} strokeWidth={0.6} fill="none" opacity={0.3 - i * 0.045}
            strokeDasharray={i % 2 === 0 ? '5 12' : '2 9'} />
        ))}
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
          const rx = 118 * Math.cos(a), ry = 118 * Math.sin(a);
          return <Circle key={`p${i}`} cx={SW / 2 + rx} cy={220 + ry} r={2.2} fill={ACCENT} opacity={0.22} />;
        })}
        {Array.from({ length: 28 }, (_, i) => (
          <Circle key={`s${i}`} cx={(i * 97 + 20) % SW} cy={(i * 83 + 50) % 760}
            r={i % 5 === 0 ? 1.4 : 0.7} fill={ACCENT} opacity={0.09} />
        ))}
        <Line x1={SW / 2} y1={100} x2={SW / 2} y2={340} stroke={ACCENT} strokeWidth={0.5} opacity={0.18} strokeDasharray="4 10" />
        <Line x1={SW / 2 - 120} y1={220} x2={SW / 2 + 120} y2={220} stroke={ACCENT} strokeWidth={0.5} opacity={0.18} strokeDasharray="4 10" />
      </G>
    </Svg>
  </View>
);

// ─── Animated deck widget ────────────────────────────────────────────────────
const DeckSelectionWidget = ({ accent }: { accent: string }) => {
  const tiltX = useSharedValue(-5);
  const tiltY = useSharedValue(0);
  const pulse = useSharedValue(0.96);
  const rot   = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withSequence(
      withTiming(1.03, { duration: 2800 }),
      withTiming(0.96, { duration: 2800 })
    ), -1, false);
    rot.value = withRepeat(withTiming(360, { duration: 20000, easing: Easing.linear }), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-20, Math.min(20, -5 + e.translationY * 0.18));
      tiltY.value = Math.max(-20, Math.min(20, e.translationX * 0.18));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-5, { duration: 800 });
      tiltY.value = withTiming(0, { duration: 800 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: pulse.value },
    ],
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rot.value}deg` }],
  }));

  const ORBIT_DOTS = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return { x: 92 * Math.cos(a), y: 92 * Math.sin(a) };
  });
  const DECK_CARDS = [
    { x: 0, y: 0, rotate: 0 },
    { x: -38, y: -8, rotate: -12 },
    { x: 38, y: -8, rotate: 12 },
    { x: -18, y: -20, rotate: -6 },
    { x: 18, y: -20, rotate: 6 },
  ];

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>
          <Svg width={200} height={200} viewBox="-100 -100 200 200" style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgRadialGradient id="deckGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={accent} stopOpacity={0.30} />
                <Stop offset="100%" stopColor={accent} stopOpacity={0} />
              </SvgRadialGradient>
            </Defs>
            <Circle cx={0} cy={0} r={95} fill="url(#deckGlow)" />
            {[80, 62].map((r, i) => (
              <Circle key={i} cx={0} cy={0} r={r} stroke={accent} strokeWidth={0.5}
                fill="none" opacity={0.16 + i * 0.06} strokeDasharray={i === 0 ? '5 8' : '2 7'} />
            ))}
            {DECK_CARDS.map((c, i) => (
              <G key={i} transform={`translate(${c.x},${c.y}) rotate(${c.rotate})`}>
                <Rect x={-13} y={-20} width={26} height={38} rx={3}
                  fill={accent} opacity={i === 0 ? 0.22 : 0.10 - i * 0.01} />
                <Rect x={-13} y={-20} width={26} height={38} rx={3}
                  stroke={accent} strokeWidth={0.9} fill="none" opacity={0.55 - i * 0.07} />
                <Line x1={-8} y1={-14} x2={8} y2={-14} stroke={accent} strokeWidth={0.5} opacity={0.35} />
                <Line x1={-8} y1={-9} x2={8} y2={-9} stroke={accent} strokeWidth={0.4} opacity={0.25} />
                <Circle cx={0} cy={2} r={5} stroke={accent} strokeWidth={0.6} fill="none" opacity={0.4} />
              </G>
            ))}
          </Svg>
          <Animated.View style={[{ position: 'absolute', width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }, orbitStyle]}>
            <Svg width={200} height={200} viewBox="-100 -100 200 200" style={StyleSheet.absoluteFill}>
              {ORBIT_DOTS.map((d, i) => (
                <Circle key={i} cx={d.x} cy={d.y} r={i % 3 === 0 ? 2.0 : 1.0}
                  fill={accent} opacity={i % 4 === 0 ? 0.50 : 0.22} />
              ))}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ─── Moon phase helper ───────────────────────────────────────────────────────
const getMoonPhase = (): { label: string; emoji: string; phase: string } => {
  const day = new Date().getDate();
  if (day <= 2) return { label: 'Nów księżyca', emoji: '🌑', phase: 'now' };
  if (day <= 7) return { label: 'Przybywający sierp', emoji: '🌒', phase: 'waxing_crescent' };
  if (day <= 9) return { label: 'Pierwsza kwadra', emoji: '🌓', phase: 'first_quarter' };
  if (day <= 14) return { label: 'Przybywający garb', emoji: '🌔', phase: 'waxing_gibbous' };
  if (day <= 16) return { label: 'Pełnia księżyca', emoji: '🌕', phase: 'full' };
  if (day <= 21) return { label: 'Ubywający garb', emoji: '🌖', phase: 'waning_gibbous' };
  if (day <= 23) return { label: 'Ostatnia kwadra', emoji: '🌗', phase: 'last_quarter' };
  if (day <= 29) return { label: 'Ubywający sierp', emoji: '🌘', phase: 'waning_crescent' };
  return { label: 'Nów księżyca', emoji: '🌑', phase: 'now' };
};

const getDeckRecommendation = (phase: string): { deckName: string; reason: string } => {
  switch (phase) {
    case 'now':
      return { deckName: 'Księżycowa wizja', reason: 'Nów to czas nowych intencji i ciszy wewnętrznej. Ta talia najlepiej tłumaczy język początków.' };
    case 'waxing_crescent':
    case 'first_quarter':
    case 'waxing_gibbous':
      return { deckName: 'Klasyczna talia', reason: 'Przybywający księżyc sprzyja działaniu i jasnym decyzjom. Klasyczna talia mówi precyzyjnie.' };
    case 'full':
      return { deckName: 'Złote sanktuarium', reason: 'Pełnia amplifikuje emocje i energie rytualne. Złote Sanktuarium rezonuje najgłębiej w tym momencie.' };
    case 'waning_gibbous':
    case 'last_quarter':
      return { deckName: 'Obsydianowe zwierciadło', reason: 'Ubywający księżyc to czas uwalniania i pracy z cieniem. Obsydian nie kłamie.' };
    case 'waning_crescent':
      return { deckName: 'Święta geometria', reason: 'Koniec cyklu wymaga refleksji nad strukturą. Geometria ujawnia wzorce.' };
    default:
      return { deckName: 'Klasyczna talia', reason: 'Energia tego tygodnia sprzyja spokojnemu, precyzyjnemu odczytowi.' };
  }
};

const getWeeklyEnergyTip = (phase: string): string => {
  switch (phase) {
    case 'now': return 'Zadaj pytania o to, czego jeszcze nie widzisz. Nów otwiera kanały intuicji.';
    case 'waxing_crescent': return 'Płynność emocji wspiera pytania o kierunek działania i nowe ścieżki.';
    case 'first_quarter': return 'Napięcie kwadry ujawnia przeszkody. Tarot może pokazać, co stoi na drodze.';
    case 'waxing_gibbous': return 'Energia sięga szczytu. Idealny czas na głębsze rozkłady i pytania o manifestację.';
    case 'full': return 'Pełnia oświetla wszystko. Nawet karta odwrócona niesie dziś wyraźne przesłanie.';
    case 'waning_gibbous': return 'Czas wdzięczności i oceny. Pytaj, co możesz puścić, a co zatrzymać.';
    case 'last_quarter': return 'Kwadra uwalniania. Rozkłady cieni i blokad dają teraz najgłębszy wgląd.';
    case 'waning_crescent': return 'Cisza przed nowym cyklem. Jeden krok wstecz, by zobaczyć całość obrazu.';
    default: return 'Każdy moment jest dobry na rozmowę z kartami, gdy przychodzisz z prawdziwym pytaniem.';
  }
};

// ─── Date formatting helper ───────────────────────────────────────────────────
const formatShortDate = (isoDate: string): string => {
  try {
    const d = new Date(isoDate);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
  } catch {
    return '–';
  }
};

const getTodayKey = () => new Date().toISOString().split('T')[0];

// ─── Tip card data ────────────────────────────────────────────────────────────
const HOW_TO_CHOOSE_TIPS = [
  {
    emoji: '🌊',
    title: 'Nastrój emocjonalny',
    body: 'Gdy jesteś w silnych emocjach, sięgnij po Księżycową wizję lub Obsydianowe zwierciadło. W spokoju i klarowności – po Klasyczną talię lub Świętą geometrię.',
  },
  {
    emoji: '🔮',
    title: 'Pytanie vs. kontemplacja',
    body: 'Konkretne pytanie życiowe prowadzi do Klasycznej talii. Jeśli szukasz głębszej kontemplacji, rytuał emocjonalny albo praca z cieniem — Złote Sanktuarium lub Obsydian.',
  },
  {
    emoji: '✨',
    title: 'Doświadczenie z tarotem',
    body: 'Początkujący najszybciej rozumieją język Klasycznej talii. Zaawansowani — Księżycową wizję lub Obsydian. Każda talia ma swój własny głos i wymaga czasu.',
  },
];

// ─── Co dalej links ───────────────────────────────────────────────────────────
const NEXT_LINKS = [
  { label: 'Dzienna karta', sublabel: 'Jedna karta na dziś', route: 'DailyTarot', icon: Star },
  { label: 'Karta roku', sublabel: 'Archetyp całego roku', route: 'YearCard', icon: TrendingUp },
  { label: 'Rozkład z partnerem', sublabel: 'Dynamika w relacji', route: 'PartnerTarot', icon: Layers },
];

// ─── Per-deck energy & numerology profiles ────────────────────────────────────
const DECK_ENERGY_PROFILES: Record<string, {
  planet: string; element: string; numerology: string; numerologyDesc: string;
  bestFor: string[]; bestTime: string; archetype: string;
}> = {
  'classic': {
    planet: 'Merkury', element: 'Powietrze',
    numerology: '1 — Początek', numerologyDesc: 'Jedynka wskazuje na jasność intencji i siłę pierwszego impulsu. Ta talia przemawia klarownym językiem.',
    bestFor: ['Pytania o kierunek', 'Decyzje życiowe', 'Codzienne odczyty'],
    bestTime: 'Rano, przy wschodzie słońca lub w fazie przybywającego księżyca.',
    archetype: 'Mag — precyzja i wola',
  },
  'lunar': {
    planet: 'Księżyc', element: 'Woda',
    numerology: '2 — Dualność', numerologyDesc: 'Dwójka reprezentuje cykle, intuicję i głębię emocjonalną. Idealna na refleksję i wgląd.',
    bestFor: ['Praca z emocjami', 'Sny i podświadomość', 'Cykl księżycowy'],
    bestTime: 'Wieczorem, przy zachodzie lub w nowiu i pełni.',
    archetype: 'Kapłanka — intuicja i tajemnica',
  },
  'golden': {
    planet: 'Słońce', element: 'Ogień',
    numerology: '3 — Ekspansja', numerologyDesc: 'Trójka to twórczość, obfitość i manifestacja. Ta talia amplifikuje energię rytuału.',
    bestFor: ['Rytuały manifestacji', 'Ceremonię', 'Głębokie pytania o cel'],
    bestTime: 'W południe lub podczas pełni księżyca.',
    archetype: 'Cesarzowa — obfitość i moc tworzenia',
  },
  'obsidian': {
    planet: 'Saturn', element: 'Ziemia',
    numerology: '4 — Fundament', numerologyDesc: 'Czwórka to structure, głęboka praca i trwałość. Obsydian ujawnia wzorce, których nie chcemy widzieć.',
    bestFor: ['Praca z cieniem', 'Blokady energetyczne', 'Pytania o prawdę'],
    bestTime: 'Nocą lub w fazie ubywającego księżyca.',
    archetype: 'Pustelnik — głębia i samotność',
  },
  'geometry': {
    planet: 'Uran', element: 'Eter',
    numerology: '5 — Transformacja', numerologyDesc: 'Piątka to zmiana, wolność i przebudzenie. Ta talia odsłania wzorce geometryczne losu.',
    bestFor: ['Przełomy i zmiany', 'Praca z archetypami', 'Medytacja i kontemplacja'],
    bestTime: 'O świcie lub przy przejściu między fazami księżyca.',
    archetype: 'Głupiec — nowy początek i odwaga',
  },
};

// ─── Per-deck signature cards ─────────────────────────────────────────────────
const DECK_SIGNATURE_CARDS: Record<string, Array<{ name: string; desc: string; emoji: string }>> = {
  'classic': [
    { name: 'Mag', desc: 'Esencja tej talii — wola, precyzja i działanie.', emoji: '🪄' },
    { name: 'Koło Fortuny', desc: 'Wzorce cyklu życia widoczne szczególnie wyraźnie.', emoji: '☸' },
    { name: 'Gwiazda', desc: 'Nadzieja i kierunek — główny motyw energetyczny.', emoji: '⭐' },
    { name: 'Świat', desc: 'Symbolizuje pełnię cyklu tej talii.', emoji: '🌍' },
    { name: 'Sąd', desc: 'Przebudzenie i transformacja — finałowa karta tej talii.', emoji: '📯' },
  ],
  'lunar': [
    { name: 'Kapłanka', desc: 'Rdzeń tej talii — cisza i wiedza wewnętrzna.', emoji: '🌙' },
    { name: 'Księżyc', desc: 'Centralny archetyp — iluzja, intuicja, głębia.', emoji: '🌕' },
    { name: 'Wieszczka', desc: 'Specjalna karta cyklu — wizja i profetyzm.', emoji: '👁' },
    { name: 'Śmierć', desc: 'W tej talii nabiera cyklicznego, wodnego wymiaru.', emoji: '🦋' },
    { name: 'Gwiazda Polarna', desc: 'Orientacja wewnętrzna — specyficzna dla tej talii.', emoji: '✦' },
  ],
  'golden': [
    { name: 'Cesarzowa', desc: 'Energia tej talii — obfitość i kreacja.', emoji: '👑' },
    { name: 'Słońce', desc: 'Centralny patron — blask i sukces.', emoji: '☀' },
    { name: 'Sił', desc: 'W tej talii szczególnie płomienna i triumfalna.', emoji: '🦁' },
    { name: 'As Pentakli', desc: 'Manifestacja — dominująca karta wyrocząca.', emoji: '🌟' },
    { name: 'Koronacja', desc: 'Specyficzna karta tej talii — ceremonia i rytuał.', emoji: '✨' },
  ],
  'obsidian': [
    { name: 'Pustelnik', desc: 'Duch tej talii — głębia, samotność i mądrość.', emoji: '🕯' },
    { name: 'Diabeł', desc: 'W tej talii jest narzędziem wyzwolenia, nie strachu.', emoji: '🪞' },
    { name: 'Wieża', desc: 'Przebudzenie przez rozbicie — mocna w tym zestawie.', emoji: '⚡' },
    { name: 'Księżyc', desc: 'Lustro cienia — centralny motyw refleksji.', emoji: '🌑' },
    { name: 'Sąd', desc: 'Nie koniec, lecz ujawnienie prawdy o sobie.', emoji: '🔮' },
  ],
  'geometry': [
    { name: 'Głupiec', desc: 'Duch swobody i nowego początku tej talii.', emoji: '🎭' },
    { name: 'Kochanki', desc: 'Geometria relacji — wybór jako wzorzec.', emoji: '⬡' },
    { name: 'Koło Fortuny', desc: 'Spirala i fraktal — wzorzec powtarzania.', emoji: '∞' },
    { name: 'Świat', desc: 'Mandala pełni — finalny obraz tej talii.', emoji: '🔯' },
    { name: 'Gwiazda', desc: 'Geometria nadziei — pięcioramienna struktura', emoji: '⭐' },
  ],
};

// ─── Inicjacja ceremony steps ─────────────────────────────────────────────────
const INICJACJA_STEPS = [
  { num: 1, title: 'Oczyszczenie przestrzeni', desc: 'Przewietrz pomieszczenie lub zapal szałwię / palo santo. Wyobraź sobie, że starą energię zastępuje świeże, czyste powietrze. Ta talia wchodzi w czystą przestrzeń.', emoji: '💨' },
  { num: 2, title: 'Kontakt pierwszej chwili', desc: 'Trzymaj talię przez 3 minuty obiema dłońmi. Nie otwieraj jej — tylko poczuj jej ciężar, temperaturę, materialność. Słuchaj, co pojawia się w ciele.', emoji: '🤲' },
  { num: 3, title: 'Oddech i intencja', desc: 'Trzy głębokie oddechy. Przy każdym wydechu powiedz (w myślach lub na głos): "Przychodzę do tej talii z otwartym sercem i bez oczekiwań."', emoji: '🌬' },
  { num: 4, title: 'Pierwsze tasowanie', desc: 'Tasuj talię przez minutę — w dowolny sposób. To rytuał wzajemnego poznania, nie metoda losowania. Mówisz do kart: "Uczę się Twojego języka."', emoji: '🃏' },
  { num: 5, title: 'Karta przywitania', desc: 'Wyciągnij jedną kartę bez pytania. Ta karta jest Twoim pierwszym dialogiem — wiadomością od talii do Ciebie. Zanotuj ją i swoje pierwsze odczucie.', emoji: '✉' },
  { num: 6, title: 'Zapieczętowanie słowem', desc: 'Wypowiedz lub napisz: "Od tej chwili ta talia jest moim narzędziem. Będę czytać z szacunkiem, ciekawością i uczciwością wobec siebie."', emoji: '📜' },
  { num: 7, title: 'Spoczynek i integracja', desc: 'Owiń talię w ciemną tkaninę lub wróć ją do pudełka. Daj jej dobę spoczynku zanim zaczniesz regularne odczyty. Inicjacja jest zakończona.', emoji: '🌙' },
];

// ─── StatRail item ────────────────────────────────────────────────────────────
const StatItem = ({ label, value, isLight }: { label: string; value: string; isLight: boolean }) => (
  <View style={styles.statItem}>
    <Typography
      variant="editorialHeader"
      style={[styles.statValue, { color: ACCENT }]}
    >
      {value}
    </Typography>
    <Typography
      variant="microLabel"
      style={[styles.statLabel, { color: isLight ? 'rgba(0,0,0,0.50)' : 'rgba(255,255,255,0.50)' }]}
    >
      {label}
    </Typography>
  </View>
);

// ─── Star rating component ────────────────────────────────────────────────────
const StarRating = ({ value, onChange, isLight }: { value: number; onChange: (n: number) => void; isLight: boolean }) => (
  <View style={{ flexDirection: 'row', gap: 6 }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Pressable key={n} onPress={() => { HapticsService.impact('light'); onChange(n); }} hitSlop={8}>
        <Star
          size={22}
          color={ACCENT}
          fill={n <= value ? ACCENT : 'transparent'}
          strokeWidth={1.5}
        />
      </Pressable>
    ))}
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
export const TarotDeckSelectionScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { themeName } = useAppStore();
  const { selectedDeckId, setSelectedDeck, resetReading, pastReadings } = useTarotStore();
  const currentTheme = getResolvedTheme(themeName);

  const handleBack = () => {
    goBackOrToMainTab(navigation, 'Home');
  };

  const handleSelect = (deckId: string, available: boolean) => {
    if (!available) return;
    if (deckId !== selectedDeckId) {
      resetReading();
    }
    setSelectedDeck(deckId);
    navigation.navigate('Tarot', { deckId });
  };

  const isLight = currentTheme.background.startsWith('#F');
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const textColor = isLight ? '#1A1008' : '#F0E8D8';
  const subColor = isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.60)';

  // ── Stats ──────────────────────────────────────────────────────────────────
  const todayKey = getTodayKey();
  const todayReadings = useMemo(
    () => pastReadings.filter((r) => r.date.startsWith(todayKey)),
    [pastReadings, todayKey]
  );
  const activeDeck = useMemo(() => getTarotDeckById(selectedDeckId), [selectedDeckId]);

  // ── Moon phase ─────────────────────────────────────────────────────────────
  const moonData = useMemo(() => getMoonPhase(), []);
  const recommendation = useMemo(() => getDeckRecommendation(moonData.phase), [moonData.phase]);
  const weeklyTip = useMemo(() => getWeeklyEnergyTip(moonData.phase), [moonData.phase]);

  // ── Per-deck reading history ───────────────────────────────────────────────
  const readingsByDeck = useMemo(() => {
    const map: Record<string, typeof pastReadings> = {};
    for (const r of pastReadings) {
      if (!map[r.deckId]) map[r.deckId] = [];
      map[r.deckId].push(r);
    }
    return map;
  }, [pastReadings]);

  // ── Deck journal state (per deck) ─────────────────────────────────────────
  const [deckJournals, setDeckJournals] = useState<Record<string, { note: string; rating: number }>>({});
  const [editingDeckJournal, setEditingDeckJournal] = useState<string | null>(null);
  const [journalInput, setJournalInput] = useState('');

  const saveJournal = (deckId: string, rating: number) => {
    setDeckJournals((prev) => ({ ...prev, [deckId]: { note: journalInput.trim(), rating } }));
    setEditingDeckJournal(null);
    setJournalInput('');
    HapticsService.impact('light');
  };

  // ── Deck journal rating per deck (live) ────────────────────────────────────
  const [liveRatings, setLiveRatings] = useState<Record<string, number>>({});

  const getRating = (deckId: string) => liveRatings[deckId] ?? deckJournals[deckId]?.rating ?? 0;
  const setRating = (deckId: string, v: number) => setLiveRatings((p) => ({ ...p, [deckId]: v }));

  // ── Porównaj talie (compare) modal ─────────────────────────────────────────
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);

  const availableDecks = TAROT_DECKS.filter((d) => d.available);
  const deckA = compareA ? getTarotDeckById(compareA) : null;
  const deckB = compareB ? getTarotDeckById(compareB) : null;
  const energyA = compareA ? DECK_ENERGY_PROFILES[compareA] : null;
  const energyB = compareB ? DECK_ENERGY_PROFILES[compareB] : null;

  // ── Inicjacja ceremony modal ───────────────────────────────────────────────
  const [inicjacjaModalOpen, setInicjacjaModalOpen] = useState(false);
  const [inicjacjaDeckId, setInicjacjaDeckId] = useState<string | null>(null);
  const [inicjacjaStep, setInicjacjaStep] = useState(0);
  const [inicjacjaDone, setInicjacjaDone] = useState(false);

  const openInicjacja = (deckId: string) => {
    setInicjacjaDeckId(deckId);
    setInicjacjaStep(0);
    setInicjacjaDone(false);
    setInicjacjaModalOpen(true);
    HapticsService.impact('medium');
  };
  const advanceInicjacja = () => {
    if (inicjacjaStep < INICJACJA_STEPS.length - 1) {
      setInicjacjaStep((s) => s + 1);
      HapticsService.impact('light');
    } else {
      setInicjacjaDone(true);
      HapticsService.notify();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#FBF5EC' : '#07050F' }]}>
      <DeckSelectionBg isLight={isLight} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={20}>
            <ChevronLeft color={currentTheme.primary} size={28} strokeWidth={1.5} />
          </Pressable>
          <Pressable
            onPress={() => setCompareModalOpen(true)}
            style={[styles.compareBtn, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: StyleSheet.hairlineWidth }]}
            hitSlop={12}
          >
            <GitCompare size={15} color={ACCENT} strokeWidth={1.5} />
            <Typography variant="microLabel" style={{ color: ACCENT, fontSize: 10, marginLeft: 4 }}>Porównaj</Typography>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Premium hero block ── */}
          <Animated.View entering={FadeInDown.duration(700)}>
            <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
              <DeckSelectionWidget accent={ACCENT} />
              <View style={[styles.heroBadge, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '44' }]}>
                <Moon size={11} color={ACCENT} strokeWidth={1.5} />
                <Text style={[styles.heroBadgeText, { color: ACCENT }]}>TALIA RYTUAŁU</Text>
              </View>
              <Text style={[styles.heroTitle, { color: textColor }]}>
                Wybierz instrument,{'\n'}przez który tarot będzie mówił
              </Text>
              <Text style={[styles.heroSub, { color: subColor }]}>
                Nie zmieniasz tylko estetyki — wybierasz głos, który dziś do Ciebie przemówi. Każda talia ma własny archetyp i rezonuje z inną energią.
              </Text>
            </View>
          </Animated.View>

          {/* ── DECK STATS RAIL ── */}
          <Animated.View entering={FadeInDown.delay(120).duration(700)}>
            <View
              style={[
                styles.statsRail,
                { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: StyleSheet.hairlineWidth },
              ]}
            >
              <StatItem label="Odczyty dziś" value={String(todayReadings.length)} isLight={isLight} />
              <View style={[styles.statDivider, { backgroundColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)' }]} />
              <StatItem label="Wszystkie odczyty" value={String(pastReadings.length)} isLight={isLight} />
              <View style={[styles.statDivider, { backgroundColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)' }]} />
              <StatItem label="Aktywna talia" value={activeDeck?.name?.split(' ')[0] ?? '–'} isLight={isLight} />
            </View>
          </Animated.View>

          {/* ── ENERGIA TYGODNIA CARD ── */}
          <Animated.View entering={FadeInDown.delay(220).duration(720)}>
            <LinearGradient
              colors={isLight ? ['#FDF4DC', '#F5E8C0', '#FBF0D4'] : ['#1C1504', '#2A1E07', '#1C1504']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.energyCard, { borderColor: ACCENT + (isLight ? '50' : '38'), borderWidth: StyleSheet.hairlineWidth }]}
            >
              <View style={styles.energyHeaderRow}>
                <View style={styles.energyHeaderLeft}>
                  <Moon color={ACCENT} size={16} strokeWidth={1.5} />
                  <Typography variant="microLabel" style={[styles.energyEyebrow, { color: ACCENT }]}>
                    ENERGIA TYGODNIA
                  </Typography>
                </View>
                <View style={[styles.moonPhaseBadge, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '44', borderWidth: StyleSheet.hairlineWidth }]}>
                  <Typography variant="microLabel" style={{ color: ACCENT, fontSize: 11 }}>
                    {moonData.emoji} {moonData.label}
                  </Typography>
                </View>
              </View>
              <View style={[styles.energyDivider, { backgroundColor: ACCENT + '28' }]} />
              <Typography variant="premiumLabel" style={[styles.energyRecoLabel, { color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)' }]}>
                NAJLEPSZA TALIA NA TEN MOMENT
              </Typography>
              <Typography variant="editorialHeader" style={[styles.energyRecoName, { color: isLight ? '#2A1C00' : '#F5E4B0' }]}>
                {recommendation.deckName}
              </Typography>
              <Typography variant="bodySmall" style={[styles.energyRecoReason, { color: isLight ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.68)', lineHeight: 22 }]}>
                {recommendation.reason}
              </Typography>
              <View style={[styles.energyTipSep, { backgroundColor: ACCENT + '20' }]} />
              <View style={styles.energyTipRow}>
                <Sparkles color={ACCENT} size={14} strokeWidth={1.5} style={{ marginTop: 2 }} />
                <Typography variant="bodySmall" style={[styles.energyTipText, { color: isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.72)', lineHeight: 22 }]}>
                  {weeklyTip}
                </Typography>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── DECK LIST ── */}
          {TAROT_DECKS.map((deck, idx) => {
            const active = selectedDeckId === deck.id;
            const deckReadings = (readingsByDeck[deck.id] || []).slice(0, 10);
            const deckReadingDates = deckReadings.slice(0, 3).map((r) => r.date);
            const energyProfile = DECK_ENERGY_PROFILES[deck.id];
            const sigCards = DECK_SIGNATURE_CARDS[deck.id] ?? [];
            const journal = deckJournals[deck.id];
            const rating = getRating(deck.id);

            return (
              <Animated.View key={deck.id} entering={FadeInUp.delay(300 + idx * 90).duration(680)}>
                <Pressable
                  onPress={() => handleSelect(deck.id, deck.available)}
                  style={({ pressed }) => [
                    styles.deckCard,
                    !deck.available && styles.inactiveDeck,
                    {
                      backgroundColor: active ? currentTheme.primary + '18' : cardBg,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: active ? currentTheme.primary + '44' : cardBorder,
                      borderRadius: 16,
                      opacity: pressed ? 0.78 : 1,
                    },
                  ]}
                >
                  {/* ── Deck top section ── */}
                  <View style={styles.deckTop}>
                    <TarotCardVisual
                      deck={deck}
                      faceDown
                      size="small"
                      subtitle={deck.available ? 'Aktywna talia' : 'W przygotowaniu'}
                    />
                    <View style={styles.deckInfo}>
                      <View style={styles.deckTitleRow}>
                        <Typography variant="editorialHeader" style={styles.deckTitle}>
                          {deck.name}
                        </Typography>
                        {active ? <CheckCircle2 color={currentTheme.primary} size={16} /> : null}
                      </View>
                      <Typography variant="microLabel" color={currentTheme.primary} style={{ marginTop: 10 }}>
                        {deck.author}
                      </Typography>
                      <Typography variant="bodySmall" style={styles.deckDesc}>
                        {deck.description}
                      </Typography>
                    </View>
                  </View>

                  {/* ── Deck footer ── */}
                  <View style={[styles.deckFooter, { borderTopColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)' }]}>
                    <Typography variant="bodySmall" style={styles.deckMood}>
                      {deck.mood}
                    </Typography>
                    <View style={styles.deckAction}>
                      <Typography variant="premiumLabel" color={currentTheme.primary}>
                        {!deck.available ? 'W przygotowaniu' : active ? 'Aktualnie wybrana' : 'Wejdź do odczytu'}
                      </Typography>
                      {deck.available ? (
                        <ArrowRight color={currentTheme.primary} size={16} />
                      ) : (
                        <Sparkles color={currentTheme.textMuted} size={16} />
                      )}
                    </View>
                  </View>

                  {/* ── Reading history strip ── */}
                  <View style={[styles.historyStrip, { borderTopColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }]}>
                    <Typography variant="microLabel" style={[styles.historyLabel, { color: isLight ? 'rgba(0,0,0,0.40)' : 'rgba(255,255,255,0.38)' }]}>
                      OSTATNIE ODCZYTY Z TEJ TALII
                    </Typography>
                    {deckReadingDates.length === 0 ? (
                      <Typography variant="bodySmall" style={[styles.historyEmpty, { color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.32)' }]}>
                        Brak historii z tą talią
                      </Typography>
                    ) : (
                      <View style={styles.historyBadgeRow}>
                        {deckReadingDates.map((date, di) => (
                          <View key={di} style={[styles.historyBadge, {
                            backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.09)',
                            borderColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)',
                            borderWidth: StyleSheet.hairlineWidth,
                          }]}>
                            <Typography variant="microLabel" style={{ color: isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.60)', fontSize: 11 }}>
                              {formatShortDate(date)}
                            </Typography>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* ── ENERGIA TALII (energy & numerology profile) ── */}
                  {deck.available && energyProfile && (
                    <View style={[styles.energyProfileBlock, { borderTopColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }]}>
                      <Typography variant="microLabel" style={[styles.blockLabel, { color: ACCENT }]}>
                        ENERGIA TALII
                      </Typography>
                      <View style={styles.energyTagRow}>
                        {[
                          { label: energyProfile.planet, prefix: '♪' },
                          { label: energyProfile.element, prefix: '◈' },
                          { label: energyProfile.archetype, prefix: '✦' },
                        ].map((tag) => (
                          <View key={tag.label} style={[styles.energyTag, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '38', borderWidth: StyleSheet.hairlineWidth }]}>
                            <Typography variant="microLabel" style={{ color: ACCENT, fontSize: 10 }}>{tag.prefix} {tag.label}</Typography>
                          </View>
                        ))}
                      </View>
                      <Typography variant="microLabel" style={[styles.numerologyLabel, { color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)' }]}>
                        NUMEROLOGIA: {energyProfile.numerology}
                      </Typography>
                      <Typography variant="bodySmall" style={[styles.numerologyDesc, { color: subColor, lineHeight: 20 }]}>
                        {energyProfile.numerologyDesc}
                      </Typography>
                      <View style={[styles.bestTimeRow, { backgroundColor: ACCENT + '10', borderColor: ACCENT + '28', borderWidth: StyleSheet.hairlineWidth }]}>
                        <Sparkles size={12} color={ACCENT} />
                        <Typography variant="bodySmall" style={{ color: subColor, flex: 1, lineHeight: 19, fontSize: 12 }}>
                          {energyProfile.bestTime}
                        </Typography>
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {energyProfile.bestFor.map((bf) => (
                          <View key={bf} style={[styles.bestForTag, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)', borderColor: cardBorder, borderWidth: StyleSheet.hairlineWidth }]}>
                            <Typography variant="microLabel" style={{ color: subColor, fontSize: 10 }}>{bf}</Typography>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* ── KARTY ARCHETYPICZNE (signature cards) ── */}
                  {deck.available && sigCards.length > 0 && (
                    <View style={[styles.sigCardsBlock, { borderTopColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }]}>
                      <Typography variant="microLabel" style={[styles.blockLabel, { color: ACCENT }]}>
                        KARTY ARCHETYPICZNE TEJ TALII
                      </Typography>
                      {sigCards.map((sc, si) => (
                        <View key={si} style={[styles.sigCardRow, { borderBottomColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }]}>
                          <View style={[styles.sigCardEmoji, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '33', borderWidth: StyleSheet.hairlineWidth }]}>
                            <Typography style={{ fontSize: 16 }}>{sc.emoji}</Typography>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Typography variant="premiumLabel" style={[styles.sigCardName, { color: textColor }]}>{sc.name}</Typography>
                            <Typography variant="bodySmall" style={[styles.sigCardDesc, { color: subColor, lineHeight: 18 }]}>{sc.desc}</Typography>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* ── HISTORIA ROZKŁADÓW (last 10 readings for this deck) ── */}
                  {deck.available && deckReadings.length > 0 && (
                    <View style={[styles.deckHistoryBlock, { borderTopColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }]}>
                      <Typography variant="microLabel" style={[styles.blockLabel, { color: ACCENT }]}>
                        HISTORIA ROZKŁADÓW
                      </Typography>
                      {deckReadings.map((reading, ri) => (
                        <Pressable
                          key={ri}
                          onPress={() => navigation.navigate('ReadingDetail', { card: reading.cards?.[0]?.card, position: reading.spread?.name ?? 'Pozycja 1' })}
                          style={({ pressed }) => [styles.readingRow, {
                            backgroundColor: pressed ? ACCENT + '10' : (isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'),
                            borderColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)',
                            borderWidth: StyleSheet.hairlineWidth,
                          }]}
                        >
                          <View style={[styles.readingDateBadge, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '33', borderWidth: StyleSheet.hairlineWidth }]}>
                            <Typography variant="microLabel" style={{ color: ACCENT, fontSize: 10 }}>
                              {formatShortDate(reading.date)}
                            </Typography>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Typography variant="premiumLabel" style={[styles.readingType, { color: textColor }]}>
                              {reading.spreadType ?? 'Odczyt'}
                            </Typography>
                            {reading.question && (
                              <Typography variant="bodySmall" style={[styles.readingQuestion, { color: subColor }]} numberOfLines={1}>
                                {reading.question}
                              </Typography>
                            )}
                          </View>
                          <ArrowRight size={14} color={ACCENT + 'AA'} strokeWidth={1.5} />
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {/* ── DECK JOURNAL (personal connection log) ── */}
                  {deck.available && (
                    <View style={[styles.journalBlock, { borderTopColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }]}>
                      <Typography variant="microLabel" style={[styles.blockLabel, { color: ACCENT }]}>
                        MOJE POŁĄCZENIE Z TALIĄ
                      </Typography>
                      <StarRating value={rating} onChange={(v) => setRating(deck.id, v)} isLight={isLight} />
                      {editingDeckJournal === deck.id ? (
                        <View style={{ marginTop: 10, gap: 8 }}>
                          <TextInput
                            value={journalInput}
                            onChangeText={setJournalInput}
                            placeholder="Opisz swoje połączenie z tą talią, pamiętne odczyty, pierwsze wrażenie..."
                            placeholderTextColor={subColor}
                            multiline
                            style={[styles.journalInput, {
                              color: textColor,
                              borderColor: ACCENT + '44',
                              backgroundColor: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.07)',
                            }]}
                          />
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <Pressable
                              onPress={() => saveJournal(deck.id, rating)}
                              style={[styles.journalSaveBtn, { backgroundColor: ACCENT + '28', borderColor: ACCENT + '55', flex: 2 }]}
                            >
                              <Typography variant="premiumLabel" style={{ color: ACCENT }}>Zapisz notatkę</Typography>
                            </Pressable>
                            <Pressable
                              onPress={() => { setEditingDeckJournal(null); setJournalInput(''); }}
                              style={[styles.journalSaveBtn, { backgroundColor: cardBg, borderColor: cardBorder, flex: 1 }]}
                            >
                              <Typography variant="premiumLabel" style={{ color: subColor }}>Anuluj</Typography>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => { setEditingDeckJournal(deck.id); setJournalInput(journal?.note ?? ''); }}
                          style={[styles.journalViewBtn, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: StyleSheet.hairlineWidth }]}
                        >
                          <Typography variant="bodySmall" style={[{ color: journal?.note ? textColor : subColor, lineHeight: 20, fontStyle: journal?.note ? 'normal' : 'italic' }]}>
                            {journal?.note || 'Dotknij, by dodać notatki o tej talii...'}
                          </Typography>
                          {!journal?.note && (
                            <BookOpen size={14} color={ACCENT + 'AA'} />
                          )}
                        </Pressable>
                      )}
                    </View>
                  )}

                  {/* ── INICJACJA button ── */}
                  {deck.available && (
                    <View style={[styles.inicjacjaRow, { borderTopColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }]}>
                      <Pressable
                        onPress={() => openInicjacja(deck.id)}
                        style={[styles.inicjacjaBtn, { backgroundColor: ACCENT + '14', borderColor: ACCENT + '44', borderWidth: StyleSheet.hairlineWidth }]}
                      >
                        <Flame size={14} color={ACCENT} strokeWidth={1.5} />
                        <Typography variant="premiumLabel" style={{ color: ACCENT }}>Ceremonia inicjacji talii</Typography>
                        <ArrowRight size={14} color={ACCENT + 'AA'} />
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}

          {/* ── JAK WYBRAĆ TALIĘ ── */}
          <Animated.View entering={FadeInDown.delay(600).duration(700)}>
            <View style={styles.eduSection}>
              <View style={styles.eduLabelRow}>
                <BookOpen color={ACCENT} size={14} strokeWidth={1.5} />
                <Typography variant="microLabel" style={[styles.eduSectionLabel, { color: ACCENT }]}>
                  JAK WYBRAĆ TALIĘ
                </Typography>
              </View>
              {HOW_TO_CHOOSE_TIPS.map((tip, ti) => (
                <Animated.View key={ti} entering={FadeInDown.delay(660 + ti * 80).duration(600)}>
                  <View style={[styles.tipCard, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: StyleSheet.hairlineWidth }]}>
                    <View style={styles.tipEmojiWrap}>
                      <Typography style={styles.tipEmoji}>{tip.emoji}</Typography>
                    </View>
                    <View style={styles.tipContent}>
                      <Typography variant="premiumLabel" style={[styles.tipTitle, { color: isLight ? '#1A1008' : '#F0E8D8' }]}>
                        {tip.title}
                      </Typography>
                      <Typography variant="bodySmall" style={[styles.tipBody, { color: isLight ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.65)', lineHeight: 22 }]}>
                        {tip.body}
                      </Typography>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* ── CO DALEJ ── */}
          <Animated.View entering={FadeInDown.delay(860).duration(700)}>
            <View style={styles.nextSection}>
              <View style={styles.eduLabelRow}>
                <Sparkles color={ACCENT} size={14} strokeWidth={1.5} />
                <Typography variant="microLabel" style={[styles.eduSectionLabel, { color: ACCENT }]}>
                  CO DALEJ
                </Typography>
              </View>
              {NEXT_LINKS.map((link, li) => {
                const IconComp = link.icon;
                return (
                  <Animated.View key={link.route} entering={FadeInDown.delay(900 + li * 70).duration(580)}>
                    <Pressable
                      onPress={() => navigation.navigate(link.route)}
                      style={({ pressed }) => [styles.nextCard, {
                        backgroundColor: pressed ? (isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)') : cardBg,
                        borderColor: cardBorder,
                        borderWidth: StyleSheet.hairlineWidth,
                        opacity: pressed ? 0.82 : 1,
                      }]}
                    >
                      <View style={[styles.nextIconWrap, { backgroundColor: currentTheme.primary + '18', borderColor: currentTheme.primary + '30', borderWidth: StyleSheet.hairlineWidth }]}>
                        <IconComp color={currentTheme.primary} size={18} strokeWidth={1.5} />
                      </View>
                      <View style={styles.nextTextWrap}>
                        <Typography variant="premiumLabel" style={[styles.nextLabel, { color: isLight ? '#1A1008' : '#F0E8D8' }]}>
                          {link.label}
                        </Typography>
                        <Typography variant="bodySmall" style={[styles.nextSublabel, { color: isLight ? 'rgba(0,0,0,0.52)' : 'rgba(255,255,255,0.50)' }]}>
                          {link.sublabel}
                        </Typography>
                      </View>
                      <ArrowRight color={isLight ? 'rgba(0,0,0,0.30)' : 'rgba(255,255,255,0.30)'} size={16} strokeWidth={1.5} />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          <EndOfContentSpacer size="compact" />
        </ScrollView>
      </SafeAreaView>

      {/* ── PORÓWNAJ TALIE MODAL ── */}
      <Modal visible={compareModalOpen} transparent animationType="slide" onRequestClose={() => setCompareModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCompareModalOpen(false)} />
          <View style={[styles.compareSheet, { backgroundColor: isLight ? '#FBF5EC' : '#0F0A18' }]}>
            <LinearGradient
              colors={isLight ? ['#FDF4DC', 'transparent'] : [ACCENT + '18', 'transparent']}
              style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
            />
            <Pressable onPress={() => setCompareModalOpen(false)} style={styles.modalClose}>
              <X size={18} color={textColor} />
            </Pressable>
            <Typography variant="microLabel" style={[styles.modalEyebrow, { color: ACCENT }]}>PORÓWNAJ TALIE</Typography>
            <Typography variant="editorialHeader" style={[styles.modalTitle, { color: textColor }]}>
              Wybierz dwie talie do porównania
            </Typography>

            {/* Deck A selector */}
            <Typography variant="microLabel" style={[{ color: subColor, fontSize: 9, letterSpacing: 1.3, marginBottom: 8, marginTop: 14 }]}>
              TALIA A
            </Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
              {availableDecks.map((d) => (
                <Pressable key={d.id} onPress={() => { setCompareA(d.id); HapticsService.impact('light'); }}
                  style={[styles.compareChip, {
                    backgroundColor: compareA === d.id ? ACCENT + '28' : cardBg,
                    borderColor: compareA === d.id ? ACCENT : cardBorder,
                    borderWidth: 1,
                  }]}>
                  <Typography variant="bodySmall" style={{ color: compareA === d.id ? ACCENT : subColor, fontWeight: compareA === d.id ? '700' : '400' }}>
                    {d.name}
                  </Typography>
                </Pressable>
              ))}
            </ScrollView>

            {/* Deck B selector */}
            <Typography variant="microLabel" style={[{ color: subColor, fontSize: 9, letterSpacing: 1.3, marginBottom: 8 }]}>
              TALIA B
            </Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
              {availableDecks.map((d) => (
                <Pressable key={d.id} onPress={() => { setCompareB(d.id); HapticsService.impact('light'); }}
                  style={[styles.compareChip, {
                    backgroundColor: compareB === d.id ? '#818CF8' + '28' : cardBg,
                    borderColor: compareB === d.id ? '#818CF8' : cardBorder,
                    borderWidth: 1,
                  }]}>
                  <Typography variant="bodySmall" style={{ color: compareB === d.id ? '#818CF8' : subColor, fontWeight: compareB === d.id ? '700' : '400' }}>
                    {d.name}
                  </Typography>
                </Pressable>
              ))}
            </ScrollView>

            {/* Comparison table */}
            {deckA && deckB && energyA && energyB && (
              <View style={[styles.compareTable, { borderColor: cardBorder, borderWidth: StyleSheet.hairlineWidth }]}>
                {/* Header */}
                <View style={[styles.compareTableRow, styles.compareTableHeader, { borderBottomColor: cardBorder, backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)' }]}>
                  <View style={{ flex: 1 }} />
                  <View style={[styles.compareTableCell, { borderLeftColor: ACCENT + '33' }]}>
                    <Typography variant="microLabel" style={{ color: ACCENT, fontSize: 9 }}>{deckA.name}</Typography>
                  </View>
                  <View style={[styles.compareTableCell, { borderLeftColor: '#818CF8' + '33' }]}>
                    <Typography variant="microLabel" style={{ color: '#818CF8', fontSize: 9 }}>{deckB.name}</Typography>
                  </View>
                </View>
                {[
                  { label: 'Planeta', a: energyA.planet, b: energyB.planet },
                  { label: 'Żywioł', a: energyA.element, b: energyB.element },
                  { label: 'Archetyp', a: energyA.archetype, b: energyB.archetype },
                  { label: 'Numerologia', a: energyA.numerology, b: energyB.numerology },
                  { label: 'Styl', a: deckA.mood?.slice(0, 40), b: deckB.mood?.slice(0, 40) },
                ].map((row, ri) => (
                  <View key={ri} style={[styles.compareTableRow, { borderBottomColor: cardBorder, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                    <View style={{ flex: 1, paddingVertical: 10, paddingLeft: 14 }}>
                      <Typography variant="microLabel" style={{ color: subColor, fontSize: 9 }}>{row.label.toUpperCase()}</Typography>
                    </View>
                    <View style={[styles.compareTableCell, { borderLeftColor: ACCENT + '22' }]}>
                      <Typography variant="bodySmall" style={{ color: textColor, fontSize: 11, lineHeight: 16 }}>{row.a}</Typography>
                    </View>
                    <View style={[styles.compareTableCell, { borderLeftColor: '#818CF8' + '22' }]}>
                      <Typography variant="bodySmall" style={{ color: textColor, fontSize: 11, lineHeight: 16 }}>{row.b}</Typography>
                    </View>
                  </View>
                ))}
                {/* Best for */}
                <View style={[styles.compareTableRow, { alignItems: 'flex-start' }]}>
                  <View style={{ flex: 1, paddingVertical: 10, paddingLeft: 14 }}>
                    <Typography variant="microLabel" style={{ color: subColor, fontSize: 9 }}>NAJLEPSZA NA</Typography>
                  </View>
                  <View style={[styles.compareTableCell, { borderLeftColor: ACCENT + '22', alignItems: 'flex-start', paddingVertical: 10 }]}>
                    {energyA.bestFor.map((bf, i) => (
                      <Typography key={i} variant="bodySmall" style={{ color: subColor, fontSize: 10, lineHeight: 18 }}>• {bf}</Typography>
                    ))}
                  </View>
                  <View style={[styles.compareTableCell, { borderLeftColor: '#818CF8' + '22', alignItems: 'flex-start', paddingVertical: 10 }]}>
                    {energyB.bestFor.map((bf, i) => (
                      <Typography key={i} variant="bodySmall" style={{ color: subColor, fontSize: 10, lineHeight: 18 }}>• {bf}</Typography>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {(!compareA || !compareB) && (
              <View style={[styles.compareHint, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: StyleSheet.hairlineWidth }]}>
                <GitCompare size={16} color={subColor} strokeWidth={1.5} />
                <Typography variant="bodySmall" style={{ color: subColor, flex: 1, lineHeight: 20 }}>
                  Wybierz dwie talie powyżej, aby zobaczyć szczegółowe porównanie ich energii, stylu i przeznaczenia.
                </Typography>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ── CEREMONIA INICJACJI MODAL ── */}
      <Modal visible={inicjacjaModalOpen} transparent animationType="slide" onRequestClose={() => setInicjacjaModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setInicjacjaModalOpen(false)} />
          <View style={[styles.inicjacjaSheet, { backgroundColor: isLight ? '#FBF5EC' : '#0F0A18' }]}>
            <LinearGradient
              colors={isLight ? ['#FDF4DC', 'transparent'] : [ACCENT + '18', 'transparent']}
              style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
            />
            <Pressable onPress={() => setInicjacjaModalOpen(false)} style={styles.modalClose}>
              <X size={18} color={textColor} />
            </Pressable>
            <Typography variant="microLabel" style={[styles.modalEyebrow, { color: ACCENT }]}>CEREMONIA INICJACJI</Typography>
            <Typography variant="editorialHeader" style={[styles.modalTitle, { color: textColor }]}>
              {inicjacjaDeckId ? getTarotDeckById(inicjacjaDeckId)?.name ?? 'Talia' : 'Talia'}
            </Typography>
            <Typography variant="bodySmall" style={[styles.modalSubtitle, { color: subColor }]}>
              7-krokowa ceremonia poświęcenia nowej talii. Wejdź w każdy krok z pełną uwagą.
            </Typography>

            {!inicjacjaDone ? (
              <>
                {/* Progress dots */}
                <View style={styles.inicjacjaDots}>
                  {INICJACJA_STEPS.map((_, i) => (
                    <View key={i} style={[styles.inicjacjaDot, {
                      backgroundColor: i < inicjacjaStep ? ACCENT : i === inicjacjaStep ? ACCENT : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'),
                      opacity: i < inicjacjaStep ? 1 : i === inicjacjaStep ? 1 : 0.35,
                      width: i === inicjacjaStep ? 22 : 8,
                    }]} />
                  ))}
                </View>

                <LinearGradient
                  colors={[ACCENT + '28', ACCENT + '10']}
                  style={[styles.inicjacjaStepCard, { borderColor: ACCENT + '44' }]}
                >
                  <Typography style={{ fontSize: 38, marginBottom: 10 }}>
                    {INICJACJA_STEPS[inicjacjaStep].emoji}
                  </Typography>
                  <Typography variant="microLabel" style={{ color: ACCENT, fontSize: 9, letterSpacing: 1.4, marginBottom: 6 }}>
                    KROK {INICJACJA_STEPS[inicjacjaStep].num} Z {INICJACJA_STEPS.length}
                  </Typography>
                  <Typography variant="editorialHeader" style={[styles.inicjacjaStepTitle, { color: textColor }]}>
                    {INICJACJA_STEPS[inicjacjaStep].title}
                  </Typography>
                  <Typography variant="bodySmall" style={[styles.inicjacjaStepDesc, { color: subColor, lineHeight: 22 }]}>
                    {INICJACJA_STEPS[inicjacjaStep].desc}
                  </Typography>
                </LinearGradient>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <Pressable onPress={() => setInicjacjaModalOpen(false)}
                    style={[styles.inicjacjaNavBtn, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: StyleSheet.hairlineWidth, flex: 1 }]}>
                    <Typography variant="premiumLabel" style={{ color: subColor }}>Przerwij</Typography>
                  </Pressable>
                  <Pressable onPress={advanceInicjacja}
                    style={[styles.inicjacjaNavBtn, { backgroundColor: ACCENT + '28', borderColor: ACCENT + '55', borderWidth: 1, flex: 2 }]}>
                    <Typography variant="premiumLabel" style={{ color: ACCENT }}>
                      {inicjacjaStep < INICJACJA_STEPS.length - 1 ? 'Następny krok →' : 'Zakończ ceremonię ✦'}
                    </Typography>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={[styles.inicjacjaDoneCard, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '55', borderWidth: 1 }]}>
                <Typography style={{ fontSize: 32, marginBottom: 10 }}>✦</Typography>
                <Typography variant="editorialHeader" style={[{ color: ACCENT, marginBottom: 10, textAlign: 'center' }]}>
                  Ceremonia zakończona
                </Typography>
                <Typography variant="bodySmall" style={[{ color: subColor, textAlign: 'center', lineHeight: 22, marginBottom: 16 }]}>
                  Twoja talia jest teraz poświęcona. Odczekaj dobę zanim wykonasz pierwszy odczyt — niech ceremonia się osadzi.
                </Typography>
                <Pressable
                  onPress={() => setInicjacjaModalOpen(false)}
                  style={[styles.inicjacjaNavBtn, { backgroundColor: ACCENT + '28', borderColor: ACCENT + '55', borderWidth: 1, alignSelf: 'stretch' }]}
                >
                  <Typography variant="premiumLabel" style={{ color: ACCENT }}>Zamknij</Typography>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    height: 56,
    paddingHorizontal: layout.padding.screen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 40 },
  compareBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingVertical: 7, paddingHorizontal: 12 },
  scrollContent: { paddingHorizontal: layout.padding.screen },

  // ── Hero block ──
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  heroBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },
  heroTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', lineHeight: 30, marginBottom: 10, paddingHorizontal: 8 },
  heroSub: { fontSize: 13, lineHeight: 20, textAlign: 'center', paddingHorizontal: 16, marginBottom: 20, opacity: 0.85 },

  // ── Intro card ──
  introCard: { padding: 20, marginTop: 14, marginBottom: 16 },

  // ── Stats rail ──
  statsRail: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 16, marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 5 },
  statValue: { fontSize: 22, lineHeight: 26 },
  statLabel: { fontSize: 10, textAlign: 'center', letterSpacing: 0.4 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 36, marginHorizontal: 4 },

  // ── Energy week card ──
  energyCard: { borderRadius: 18, padding: 22, marginBottom: 20 },
  energyHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  energyHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  energyEyebrow: { fontSize: 10, letterSpacing: 1.4 },
  moonPhaseBadge: { borderRadius: 20, paddingVertical: 5, paddingHorizontal: 11 },
  energyDivider: { height: StyleSheet.hairlineWidth, marginBottom: 16 },
  energyRecoLabel: { fontSize: 9, letterSpacing: 1.3, marginBottom: 6 },
  energyRecoName: { fontSize: 22, lineHeight: 28, marginBottom: 8 },
  energyRecoReason: { marginBottom: 4 },
  energyTipSep: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
  energyTipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  energyTipText: { flex: 1 },

  // ── Deck cards ──
  deckCard: { padding: 20, marginTop: 14 },
  inactiveDeck: { opacity: 0.78 },
  deckTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 18 },
  deckInfo: { flex: 1 },
  deckTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deckTitle: { fontSize: 24, lineHeight: 30, flexShrink: 1 },
  deckDesc: { marginTop: 12, lineHeight: 23, opacity: 0.82 },
  deckFooter: { marginTop: 18, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
  deckMood: { lineHeight: 22, opacity: 0.78 },
  deckAction: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // ── History strip ──
  historyStrip: { marginTop: 14, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth },
  historyLabel: { fontSize: 9, letterSpacing: 1.2, marginBottom: 9 },
  historyEmpty: { fontStyle: 'italic', lineHeight: 20 },
  historyBadgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  historyBadge: { borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },

  // ── Energy profile block ──
  energyProfileBlock: { marginTop: 14, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth },
  blockLabel: { fontSize: 9, letterSpacing: 1.3, marginBottom: 10 },
  energyTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  energyTag: { borderRadius: 12, paddingVertical: 5, paddingHorizontal: 10 },
  numerologyLabel: { fontSize: 9, letterSpacing: 1.2, marginBottom: 5 },
  numerologyDesc: { marginBottom: 10 },
  bestTimeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, padding: 10, marginBottom: 4 },
  bestForTag: { borderRadius: 10, paddingVertical: 4, paddingHorizontal: 9 },

  // ── Signature cards block ──
  sigCardsBlock: { marginTop: 14, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth },
  sigCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  sigCardEmoji: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sigCardName: { fontSize: 13, lineHeight: 18, marginBottom: 2 },
  sigCardDesc: {},

  // ── Deck history block ──
  deckHistoryBlock: { marginTop: 14, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth },
  readingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 10, marginBottom: 6 },
  readingDateBadge: { borderRadius: 10, paddingVertical: 4, paddingHorizontal: 8 },
  readingType: { fontSize: 12, lineHeight: 18, marginBottom: 2 },
  readingQuestion: { fontSize: 11, lineHeight: 16 },

  // ── Journal block ──
  journalBlock: { marginTop: 14, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  journalInput: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 13.5, lineHeight: 22, minHeight: 80, textAlignVertical: 'top' },
  journalSaveBtn: { borderRadius: 12, borderWidth: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  journalViewBtn: { borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },

  // ── Inicjacja row ──
  inicjacjaRow: { marginTop: 14, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth },
  inicjacjaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, padding: 12 },

  // ── Educational section ──
  eduSection: { marginTop: 28 },
  eduLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  eduSectionLabel: { fontSize: 10, letterSpacing: 1.4 },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, padding: 16, marginBottom: 10, gap: 14 },
  tipEmojiWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(206,174,114,0.12)' },
  tipEmoji: { fontSize: 22 },
  tipContent: { flex: 1 },
  tipTitle: { marginBottom: 6, lineHeight: 20 },
  tipBody: {},

  // ── Co dalej section ──
  nextSection: { marginTop: 28 },
  nextCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, marginBottom: 10, gap: 14 },
  nextIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nextTextWrap: { flex: 1 },
  nextLabel: { marginBottom: 3, lineHeight: 20 },
  nextSublabel: { lineHeight: 18 },

  // ── Modals ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  modalClose: { position: 'absolute', top: 18, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(128,128,128,0.15)', alignItems: 'center', justifyContent: 'center' },
  modalEyebrow: { fontSize: 9, letterSpacing: 1.5, marginBottom: 6 },
  modalTitle: { fontSize: 24, lineHeight: 30, marginBottom: 4 },
  modalSubtitle: { lineHeight: 22, marginBottom: 4 },

  // ── Compare sheet ──
  compareSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, overflow: 'hidden', maxHeight: '88%' },
  compareChip: { borderRadius: 12, paddingVertical: 7, paddingHorizontal: 13 },
  compareTable: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  compareTableRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  compareTableHeader: { borderBottomWidth: StyleSheet.hairlineWidth },
  compareTableCell: { flex: 1, paddingHorizontal: 10, paddingVertical: 10, borderLeftWidth: StyleSheet.hairlineWidth, alignItems: 'flex-start', justifyContent: 'center' },
  compareHint: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: 14, padding: 14, marginTop: 12 },

  // ── Inicjacja sheet ──
  inicjacjaSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, overflow: 'hidden' },
  inicjacjaDots: { flexDirection: 'row', gap: 6, alignItems: 'center', marginVertical: 16 },
  inicjacjaDot: { height: 8, borderRadius: 4 },
  inicjacjaStepCard: { borderRadius: 18, borderWidth: 1, padding: 22, alignItems: 'center', marginBottom: 8 },
  inicjacjaStepTitle: { fontSize: 20, lineHeight: 26, textAlign: 'center', marginBottom: 10 },
  inicjacjaStepDesc: { textAlign: 'center' },
  inicjacjaNavBtn: { borderRadius: 13, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  inicjacjaDoneCard: { borderRadius: 18, padding: 22, alignItems: 'center', marginTop: 10 },
});
