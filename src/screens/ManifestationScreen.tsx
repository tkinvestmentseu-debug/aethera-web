// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, Ellipse, G, Line, Path, Polygon, Rect, Text as SvgText,
} from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withTiming, withSequence, Easing, cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Sparkles, Sun, Moon, Flame, Wand2, ArrowRight,
  CheckCircle2, X, BookOpen, Zap, Clock, TrendingUp, Heart, Wind,
  RefreshCw, Send, ChevronDown, ChevronUp,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { CelestialBackdrop } from '../components/CelestialBackdrop';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '../core/utils/localeFormat';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#F59E0B';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── BACKGROUND ─────────────────────────────────────────────────
const ManifestBg = ({ isLight }: { isLight: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight
        ? ['#FFFBEB', '#FEF3C7', '#FFFBEB']
        : ['#0A0600', '#130A00', '#1A1000']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={700} style={StyleSheet.absoluteFill} opacity={isLight ? 0.10 : 0.18}>
      <G>
        {[...Array(28)].map((_, i) => (
          <Circle
            key={i}
            cx={(i * 113 + 22) % SW}
            cy={(i * 79 + 30) % 680}
            r={i % 6 === 0 ? 1.8 : 0.9}
            fill={ACCENT}
            opacity={0.18 + (i % 4) * 0.08}
          />
        ))}
        {[80, 160, 240, 320, 400, 480].map((r, i) => (
          <Circle
            key={'ring' + i}
            cx={SW / 2}
            cy={340}
            r={r}
            fill="none"
            stroke={ACCENT}
            strokeWidth={0.5}
            opacity={0.07}
          />
        ))}
      </G>
    </Svg>
  </View>
);

// ── 3D GOLDEN SPIRAL WIDGET ────────────────────────────────────
const GOLDEN_RATIO = 1.6180339887;
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  angle: (i / 12) * Math.PI * 2,
  radius: 50 + (i % 3) * 22,
  size: 3 + (i % 4),
  speed: 12000 + i * 2000,
  opacity: 0.5 + (i % 3) * 0.15,
}));

const GoldenSpiralWidget = ({ accent }: { accent: string }) => {
  const rot1 = useSharedValue(0);
  const rot2 = useSharedValue(360);
  const pulse = useSharedValue(0.92);
  const tiltX = useSharedValue(-7);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    rot1.value = withRepeat(withTiming(360, { duration: 18000, easing: Easing.linear }), -1, false);
    rot2.value = withRepeat(withTiming(0, { duration: 26000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 2400 }), withTiming(0.92, { duration: 2400 })),
      -1, false
    );
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-24, Math.min(24, -7 + e.translationY * 0.18));
      tiltY.value = Math.max(-24, Math.min(24, e.translationX * 0.18));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-7, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 540 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: pulse.value },
    ],
  }));
  const ring1Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot1.value}deg` }] }));
  const ring2Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot2.value}deg` }] }));

  // Fibonacci spiral points
  const spiralPoints = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < 120; i++) {
      const t = i / 12;
      const r = 3 * Math.pow(GOLDEN_RATIO, t * 0.22);
      const theta = t * Math.PI * 2 * 0.618;
      pts.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
    }
    return pts;
  }, []);

  const spiralPath = spiralPoints.reduce((acc, p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');

  // Radial golden lines
  const RADIAL_LINES = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { x2: 90 * Math.cos(a), y2: 90 * Math.sin(a) };
  });

  return (
    <View style={{ alignItems: 'center', marginVertical: 16 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>
          <Svg width={220} height={220} viewBox="-110 -110 220 220" style={StyleSheet.absoluteFill}>
            {/* Outer glow rings */}
            {[100, 84, 68].map((r, i) => (
              <Circle key={'gr' + i} cx={0} cy={0} r={r}
                fill="none" stroke={accent} strokeWidth={0.6}
                opacity={0.07 + i * 0.04} />
            ))}
            {/* Radial golden lines */}
            {RADIAL_LINES.map((l, i) => (
              <Line key={'rl' + i} x1={0} y1={0} x2={l.x2} y2={l.y2}
                stroke={accent} strokeWidth={0.7} opacity={0.18} />
            ))}
          </Svg>

          {/* Rotating outer ring */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring1Style]}>
            <Svg width={220} height={220} viewBox="-110 -110 220 220">
              {PARTICLES.map((p, i) => {
                const x = p.radius * Math.cos(p.angle);
                const y = p.radius * Math.sin(p.angle);
                return (
                  <G key={'p' + i}>
                    <Circle cx={x} cy={y} r={p.size} fill={accent} opacity={p.opacity} />
                    <Circle cx={x} cy={y} r={p.size + 3} fill={accent} opacity={0.12} />
                  </G>
                );
              })}
              {/* Orbit ellipses */}
              {[50, 72, 95].map((rx, i) => (
                <Ellipse key={'oe' + i} cx={0} cy={0} rx={rx} ry={rx * 0.55}
                  fill="none" stroke={accent} strokeWidth={0.8}
                  strokeDasharray="3 7" opacity={0.22} />
              ))}
            </Svg>
          </Animated.View>

          {/* Rotating inner spiral */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring2Style]}>
            <Svg width={220} height={220} viewBox="-110 -110 220 220">
              <Path d={spiralPath} fill="none" stroke={accent} strokeWidth={1.4} opacity={0.55} />
            </Svg>
          </Animated.View>

          {/* Center pulsing circle */}
          <View style={{ position: 'absolute', width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={220} height={220} viewBox="-110 -110 220 220">
              <Circle cx={0} cy={0} r={18} fill={accent} opacity={0.22} />
              <Circle cx={0} cy={0} r={10} fill={accent} opacity={0.55} />
              <Circle cx={0} cy={0} r={5} fill="#FFF" opacity={0.9} />
              {/* Sacred star */}
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i / 8) * Math.PI * 2;
                const r1 = 30; const r2 = 16;
                const a2 = a + Math.PI / 8;
                return (
                  <Line key={'sl' + i}
                    x1={r2 * Math.cos(a)} y1={r2 * Math.sin(a)}
                    x2={r1 * Math.cos(a2)} y2={r1 * Math.sin(a2)}
                    stroke={accent} strokeWidth={0.8} opacity={0.35}
                  />
                );
              })}
            </Svg>
          </View>
        </Animated.View>
      </GestureDetector>
      <Typography variant="microLabel" style={{ color: accent, opacity: 0.7, letterSpacing: 2, marginTop: 4 }}>
        SPIRALA ZŁOTEGO PROPORCJI
      </Typography>
    </View>
  );
};

// ── DATA ───────────────────────────────────────────────────────
const ABUNDANCE_AFFIRMATIONS = [
  'Jestem otwarta na obfitość we wszystkich jej formach.',
  'Wszechświat wspiera mnie w realizacji moich najgłębszych pragnień.',
  'Moje intencje są nasionami, które kiełkują w idealnym czasie.',
  'Przyciągam to, czego pragnę, z gracją i spokojem.',
  'Jestem gotowa przyjąć wszystko, co dla mnie przeznaczone.',
  'Moje myśli są twórcze i kształtują moją rzeczywistość.',
  'Obfitość jest moim naturalnym stanem istnienia.',
  'Każdego dnia zbliżam się do spełnienia swoich marzeń.',
  'Ufam procesowi życia i jego nieskończonej mądrości.',
  'Moje granice poszerzają się razem z moimi pragnieniami.',
  'Jestem magnesem dla miłości, zdrowia i dobrobytu.',
  'Wiem, że zasługuję na wszystko, o co proszę.',
  'Manifestacja przychodzi do mnie naturalnie i łatwo.',
  'Moje serce i umysł są zestrojone z moim najwyższym dobrem.',
  'Dziękuję za wszystko, co mam i za wszystko, co nadchodzi.',
  'Pieniądze płyną do mnie swobodnie i z radością.',
  'Moje relacje są głębokie, autentyczne i wzbogacające.',
  'Mam jasność co do swojej ścieżki i pewność każdego kroku.',
  'Tworzę rzeczywistość pełną sensu i spełnienia.',
  'Jestem bezpieczna w swoim pragnieniu i jego spełnieniu.',
  'Wszechświat odpowiada na moje najgłębsze potrzeby.',
  'Każda przeszkoda jest przekształcona w okazję.',
  'Moje ciało jest zdrowe, pełne energii i wdzięczności.',
  'Czas pracuje dla mnie, nie przeciwko mnie.',
  'Wierzę w siebie i w swój niepowtarzalny dar dla świata.',
  'Moje pragnienia są legitymizowane i godne spełnienia.',
  'Żyję w potoku łaski i wiecznej możliwości.',
  'Moje życie jest żywym dowodem mocy intencji.',
  'Każdy oddech zbliża mnie do mojej wymarzonej rzeczywistości.',
  'Jestem twórcą, nie obserwatorem swojego losu.',
];

const TECHNIQUES = [
  {
    id: '333',
    title: 'Technika 3-3-3',
    eyebrow: '✍️ POTRÓJNE ZAKOTWICZENIE',
    description: 'Zapisz swoją intencję 3 razy rano, 3 razy w południe i 3 razy wieczorem przez 3 kolejne dni. Trójka symbolizuje twórczą trójcę: myśl, słowo i czyn.',
    color: '#FBBF24',
    prompt: 'Twoja intencja w technice 3-3-3...',
  },
  {
    id: '369',
    title: 'Technika 3-6-9',
    eyebrow: '⚡ METODA TESLI',
    description: 'Zapisz intencję 3 razy o poranku, 6 razy w południe i 9 razy wieczorem. Tesla nazywał 3, 6, 9 kluczami do wszechświata — ta sekwencja tworzy spiralę energetyczną.',
    color: '#F97316',
    prompt: 'Twoja intencja w metodzie Tesli...',
  },
  {
    id: '555',
    title: 'Technika 5-5-5',
    eyebrow: '🌟 PIĘCIODNIOWA TRANSFORMACJA',
    description: 'Zapisz swoją intencję 55 razy przez 5 dni z rzędu. Ta intensywna praktyka przeprogramowuje podświadomość i tworzy głęboki ślad neuronowy dla nowej rzeczywistości.',
    color: '#EF4444',
    prompt: 'Twoja intencja na 5 dni...',
  },
];

const VISUALIZATION_STEPS = [
  {
    title: 'Wejdź w ciszę',
    body: 'Zamknij oczy. Poczuj swoje ciało spoczywające na podłożu. Weź trzy głębokie oddechy — z każdym wydechem pozwól napięciu opuszczać twoje ramiona, szczękę i dłonie.',
    breathCue: '4 sekundy wdech · 2 zatrzymanie · 6 sekund wydech',
  },
  {
    title: 'Zakotwicz się w czasie',
    body: 'Wyobraź sobie, że twoje pragnienie już się spełniło. Jaki jest dziś dzień? Jaka pora roku? Co widzisz wokół siebie? Dodaj jak najwięcej szczegółów — kolory, zapachy, dźwięki.',
    breathCue: 'Oddychaj naturalnie i swobodnie',
  },
  {
    title: 'Aktywuj zmysły',
    body: 'Czego dotykasz w tej nowej rzeczywistości? Jak pachnie twoje spełnione życie? Co słyszysz? Jaki smak mają chwile sukcesu i radości? Przepuść tę rzeczywistość przez wszystkie zmysły.',
    breathCue: 'Powolne, pełne oddechy przez nos',
  },
  {
    title: 'Poczuj emocję',
    body: 'Pozwól emocji spełnienia wypełnić twoje ciało. To może być ciepło w piersi, lekkość, spokój, radość lub podniecenie. Nie zmuszaj — pozwól naturalnemu uczuciu wdzięczności pojawić się.',
    breathCue: 'Połóż dłoń na sercu · oddychaj przez serce',
  },
  {
    title: 'Zaufaj i odpuść',
    body: 'Teraz wyobraź sobie, że wysyłasz tę intencję w przestrzeń jak balon. Patrzysz, jak odpływa ku słońcu. Nie śledzisz go — po prostu wiesz, że dotarł. Wróć do oddechu i ciszy.',
    breathCue: 'Długi, spokojny wydech · relaks całego ciała',
  },
];

const MOON_PHASE_ADVICE: Record<string, { name: string; advice: string; emoji: string }> = {
  new: {
    name: 'Nów Księżyca',
    emoji: '🌑',
    advice: 'Czas sadzenia nasion intencji. To najsilniejszy moment do zapisania nowych pragnień i rozpoczęcia manifestacji. Twoje intencje teraz mają potężne wsparcie kosmiczne. Pisz, wizualizuj i wyraź czego pragniesz z maksymalną jasnością.',
  },
  waxing_crescent: {
    name: 'Przybywający Sierp',
    emoji: '🌒',
    advice: 'Podejmuj pierwsze kroki w kierunku swoich intencji. To czas działania zgodnego z marzeniami. Każde małe działanie teraz jest jak podlewanie zasadzonego nasiona. Manifestacja nabiera tempa.',
  },
  first_quarter: {
    name: 'Pierwsza Kwadra',
    emoji: '🌓',
    advice: 'Pojawiają się wyzwania i opór — to naturalny etap. Zdecyduj, czy trwasz przy swoich intencjach pomimo trudności. Twoja wytrwałość teraz buduje fundament pod spełnienie pragnień.',
  },
  waxing_gibbous: {
    name: 'Przybywający Garb',
    emoji: '🌔',
    advice: 'Dostosuj i udoskonalaj swoje intencje. Oceń, co działa, a co wymaga korekty. To czas obserwacji znaków i synchroniczności — wszechświat odpowiada na twoje intencje.',
  },
  full: {
    name: 'Pełnia Księżyca',
    emoji: '🌕',
    advice: 'Kulminacja i spełnienie. To idealny czas na wdzięczność za to, co już zostało zamanifestowane. Pełnia wzmacnia każdą intencję emocjonalną. Świętuj swoje postępy i wyraź głęboką wdzięczność.',
  },
  waning_gibbous: {
    name: 'Ubywający Garb',
    emoji: '🌖',
    advice: 'Dziel się swoją obfitością. To co zostało zamanifestowane, chce przepływać dalej. Czas dawania, dzielenia się i integracji mądrości z procesu manifestacji.',
  },
  last_quarter: {
    name: 'Ostatnia Kwadra',
    emoji: '🌗',
    advice: 'Uwolnij to, co nie służy twojej manifestacji. Jakie przekonania, lęki lub wzorce blokują cię? Teraz jest moc do ich transformacji i oczyszczenia przestrzeni dla nowego.',
  },
  waning_crescent: {
    name: 'Ubywający Sierp',
    emoji: '🌘',
    advice: 'Czas odpoczynku, ciszy i wewnętrznego skupienia. Pozwól procesowi manifestacji dojrzewać w ciemności. Jutro lub pojutrze przyjdzie nów — przygotuj nowe intencje w sercu.',
  },
};

function julianDate(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4)
    - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function getMoonPhase(year: number, month: number, day: number): number {
  const jd = julianDate(year, month, day);
  const ref = 2451550.1;
  const cycle = 29.530588853;
  const raw = ((jd - ref) % cycle) / cycle;
  return raw < 0 ? raw + 1 : raw;
}

function getMoonPhaseKey(phase: number): string {
  if (phase < 0.03 || phase >= 0.97) return 'new';
  if (phase < 0.22) return 'waxing_crescent';
  if (phase < 0.28) return 'first_quarter';
  if (phase < 0.47) return 'waxing_gibbous';
  if (phase < 0.53) return 'full';
  if (phase < 0.72) return 'waning_gibbous';
  if (phase < 0.78) return 'last_quarter';
  return 'waning_crescent';
}

function getDaysToNewMoon(phase: number): number {
  const cycle = 29.530588853;
  return Math.round((1 - phase) * cycle);
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

const ORACLE_PROMPTS = [
  'Jak przyspieszyć moją manifestację?',
  'Co blokuje moje intencje?',
  'Jaki znak potwierdza moją ścieżkę?',
  'Jak zestroić serce z pragnieniem?',
];

// ── PROGRESS RING ──────────────────────────────────────────────
const RING_R = 54;
const RING_CIRCUM = 2 * Math.PI * RING_R;
const AnimatedPath = Animated.createAnimatedComponent(Path);

// ── MAIN SCREEN ────────────────────────────────────────────────
export default function ManifestationScreen({ navigation }: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeName, userData, favoriteItems, addFavoriteItem, removeFavoriteItem } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');

  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : 'rgba(255,255,255,0.68)';
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.10)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.16)';
  const accent = ACCENT;

  // Favorites
  const isFav = favoriteItems?.some((f: any) => f.id === 'manifestation');
  const toggleFav = () => {
    HapticsService.notify();
    if (isFav) {
      removeFavoriteItem('manifestation');
    } else {
      addFavoriteItem({
        id: 'manifestation',
        label: 'Manifestacja',
        sublabel: 'Prawo przyciągania',
        route: 'Manifestation',
        icon: 'Sparkles',
        color: accent,
        addedAt: new Date().toISOString(),
      });
    }
  };

  // Moon phase
  const today = new Date();
  const moonPhase = getMoonPhase(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const moonPhaseKey = getMoonPhaseKey(moonPhase);
  const moonData = MOON_PHASE_ADVICE[moonPhaseKey];
  const daysToNewMoon = getDaysToNewMoon(moonPhase);

  // Daily affirmation
  const dayOfYear = getDayOfYear();
  const dailyAffirmation = ABUNDANCE_AFFIRMATIONS[dayOfYear % ABUNDANCE_AFFIRMATIONS.length];

  // Intent board
  const [intents, setIntents] = useState<{ text: string; icon: string }[]>([
    { text: '', icon: '🌟' },
    { text: '', icon: '💫' },
    { text: '', icon: '✨' },
  ]);
  const EMOJI_OPTIONS = ['🌟', '⚡', '💫', '🔥', '✨'];

  // Timer progress
  const progressAnim = useSharedValue(0);
  const moonProgress = useMemo(() => {
    const cycle = 29.530588853;
    const daysElapsed = moonPhase * cycle;
    return daysElapsed / cycle;
  }, [moonPhase]);

  useEffect(() => {
    progressAnim.value = withTiming(moonProgress, { duration: 1800, easing: Easing.out(Easing.cubic) });
  }, [moonProgress]);

  // Techniques modal
  const [activeTechnique, setActiveTechnique] = useState<typeof TECHNIQUES[0] | null>(null);
  const [techniqueText, setTechniqueText] = useState('');

  // Visualization
  const [expandedVizStep, setExpandedVizStep] = useState<number | null>(null);

  // Manifestation journal
  const [journalText, setJournalText] = useState('');
  const [journalEntries, setJournalEntries] = useState<{ text: string; date: string }[]>([]);

  const saveJournalEntry = () => {
    if (!journalText.trim()) return;
    HapticsService.notify();
    setJournalEntries(prev => [
      { text: journalText.trim(), date: formatLocaleDate(new Date()) },
      ...prev.slice(0, 4),
    ]);
    setJournalText('');
  };

  // Oracle AI
  const [oracleInput, setOracleInput] = useState('');
  const [oracleReply, setOracleReply] = useState('');
  const [oracleLoading, setOracleLoading] = useState(false);

  const askOracle = useCallback(async (question?: string) => {
    const q = question || oracleInput.trim();
    if (!q) return;
    HapticsService.notify();
    setOracleLoading(true);
    setOracleReply('');
    try {
      const systemPrompt = `Jesteś Wyrocznią Manifestacji — głęboko intuicyjnym przewodnikiem prawa przyciągania i transformacji rzeczywistości. Odpowiadasz w języku użytkownika. Znasz praktyki manifestacji, prawa wibracji i mechanizmy podświadomości. Odpowiedź powinna być poetycka, konkretna i inspirująca. Kontekst użytkownika: imię ${userData?.name || 'Poszukująca'}, faza księżyca: ${moonData?.name}, liczba dni do nowiu: ${daysToNewMoon}. Odpowiedź 4-6 zdań.`;
      const result = await AiService.chatWithOracle([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: q },
      ]);
      setOracleReply(result || 'Wyrocznia milczy w tej chwili. Zapytaj ponownie.');
    } catch {
      setOracleReply('Połączenie z Wyrocznią zostało przerwane. Spróbuj ponownie.');
    } finally {
      setOracleLoading(false);
    }
  }, [oracleInput, userData, moonData, daysToNewMoon]);

  // Animated ring dashoffset
  const ringStyle = useAnimatedProps(() => {
    const offset = RING_CIRCUM * (1 - progressAnim.value);
    return { strokeDashoffset: offset };
  });

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }} edges={['top']}>
      <ManifestBg isLight={isLight} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.headerBtn} hitSlop={8}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Typography variant="microLabel" style={{ color: accent, letterSpacing: 2 }}>ŚWIAT MANIFESTACJI</Typography>
          <Typography variant="title3" style={{ color: textColor, fontWeight: '700' }}>Manifestacja</Typography>
        </View>
        <Pressable onPress={toggleFav} style={styles.headerBtn} hitSlop={8}>
          <Star size={20} color={isFav ? accent : subColor} fill={isFav ? accent : 'none'} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingTop: 8 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── 3D WIDGET ──────────────────────────────────────── */}
          <GoldenSpiralWidget accent={accent} />

          {/* ── MOON TIMER ─────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 130, height: 130 }}>
                  <Svg width={130} height={130} viewBox="0 0 130 130">
                    <Circle cx={65} cy={65} r={RING_R} fill="none"
                      stroke={isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.16)'} strokeWidth={8} />
                    <AnimatedCircle
                      cx={65} cy={65} r={RING_R}
                      fill="none" stroke={accent} strokeWidth={8}
                      strokeDasharray={RING_CIRCUM}
                      strokeLinecap="round"
                      rotation={-90} originX={65} originY={65}
                      animatedProps={ringStyle}
                    />
                  </Svg>
                  <View style={{ position: 'absolute', alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, lineHeight: 32 }}>{moonData.emoji}</Text>
                    <Typography variant="microLabel" style={{ color: accent, fontSize: 10, letterSpacing: 1 }}>
                      {daysToNewMoon}d
                    </Typography>
                  </View>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Typography variant="microLabel" style={{ color: accent, letterSpacing: 2 }}>NÓW KSIĘŻYCA ZA</Typography>
                  <Typography variant="title3" style={{ color: textColor, fontWeight: '700' }}>
                    {daysToNewMoon} {daysToNewMoon === 1 ? 'dzień' : daysToNewMoon < 5 ? 'dni' : 'dni'}
                  </Typography>
                  <Typography variant="body2" style={{ color: subColor, lineHeight: 18 }}>
                    {moonData.name}
                  </Typography>
                  <View style={[styles.phaseBadge, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
                    <Typography variant="microLabel" style={{ color: accent, fontSize: 10 }}>
                      Faza cyklu: {Math.round(moonPhase * 100)}%
                    </Typography>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── MOON PHASE ADVICE ──────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <LinearGradient
              colors={isLight ? ['#FFFBEB', '#FEF3C7'] : ['#1A1000', '#2A1A00']}
              style={[styles.card, { borderColor: accent + '33' }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Moon size={16} color={accent} />
                <Typography variant="microLabel" style={{ color: accent, letterSpacing: 2 }}>
                  MANIFESTACJA W TEJ FAZIE
                </Typography>
              </View>
              <Typography variant="body1" style={{ color: textColor, lineHeight: 22 }}>
                {moonData.advice}
              </Typography>
            </LinearGradient>
          </Animated.View>

          {/* ── INTENT BOARD ───────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Sparkles size={16} color={accent} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                TABLICA INTENCJI
              </Typography>
            </View>
            <Typography variant="body2" style={{ color: subColor, marginBottom: 12, lineHeight: 18 }}>
              Wpisz trzy intencje na dziś. Wybierz symbol energii dla każdej z nich.
            </Typography>
            {intents.map((intent, idx) => (
              <View key={idx} style={[styles.intentRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {/* Emoji picker */}
                <View style={{ gap: 4 }}>
                  {EMOJI_OPTIONS.map((em) => (
                    <Pressable
                      key={em}
                      onPress={() => {
                        HapticsService.notify();
                        setIntents(prev => prev.map((it, i) => i === idx ? { ...it, icon: em } : it));
                      }}
                      style={[
                        styles.emojiBtn,
                        intent.icon === em && { backgroundColor: accent + '33', borderColor: accent },
                      ]}
                    >
                      <Text style={{ fontSize: 14 }}>{em}</Text>
                    </Pressable>
                  ))}
                </View>
                {/* Text input */}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Text style={{ fontSize: 18 }}>{intent.icon}</Text>
                    <Typography variant="microLabel" style={{ color: subColor, letterSpacing: 1 }}>
                      INTENCJA {idx + 1}
                    </Typography>
                  </View>
                  <TextInput
                    value={intent.text}
                    onChangeText={(t) => setIntents(prev => prev.map((it, i) => i === idx ? { ...it, text: t } : it))}
                    placeholder={`Wpisz intencję ${idx + 1}...`}
                    placeholderTextColor={subColor + '88'}
                    style={[styles.intentInput, { color: textColor, borderColor: cardBorder }]}
                    multiline
                  />
                </View>
              </View>
            ))}
            <Pressable
              onPress={() => {
                const filled = intents.filter(i => i.text.trim()).length;
                if (filled === 0) {
                  Alert.alert('Brak intencji', 'Wpisz przynajmniej jedną intencję, aby ją zatwierdzić.');
                  return;
                }
                HapticsService.notify();
                Alert.alert('✨ Intencje Zatwierdzone', `Twoje ${filled} ${filled === 1 ? 'intencja została' : 'intencje zostały'} wysłane do wszechświata. Teraz je pielęgnuj.`);
              }}
              style={[styles.ctaBtn, { backgroundColor: accent }]}
            >
              <CheckCircle2 size={16} color="#fff" />
              <Typography variant="label" style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>
                Zatwierdź Intencje
              </Typography>
            </Pressable>
          </Animated.View>

          {/* ── TECHNIQUES ─────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12 }}>
              <Wand2 size={16} color={accent} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                TECHNIKI PISANIA
              </Typography>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -layout.padding.screen }}>
              <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: layout.padding.screen, paddingBottom: 4 }}>
                {TECHNIQUES.map((tech) => (
                  <View
                    key={tech.id}
                    style={[styles.techCard, { width: SW * 0.72, backgroundColor: cardBg, borderColor: tech.color + '44' }]}
                  >
                    <Typography variant="microLabel" style={{ color: tech.color, letterSpacing: 2, marginBottom: 4 }}>
                      {tech.eyebrow}
                    </Typography>
                    <Typography variant="title3" style={{ color: textColor, fontWeight: '700', marginBottom: 8 }}>
                      {tech.title}
                    </Typography>
                    <Typography variant="body2" style={{ color: subColor, lineHeight: 18, marginBottom: 12 }}>
                      {tech.description}
                    </Typography>
                    <Pressable
                      onPress={() => { HapticsService.notify(); setActiveTechnique(tech); setTechniqueText(''); }}
                      style={[styles.techBtn, { backgroundColor: tech.color + '22', borderColor: tech.color + '55' }]}
                    >
                      <Typography variant="label" style={{ color: tech.color, fontWeight: '700' }}>
                        Zacznij teraz →
                      </Typography>
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>
          </Animated.View>

          {/* ── DAILY AFFIRMATION ──────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <LinearGradient
              colors={isLight
                ? [accent + '18', accent + '10', accent + '18']
                : [accent + '28', accent + '14', accent + '28']}
              style={[styles.affirmCard, { borderColor: accent + '44', marginTop: 24 }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Sun size={16} color={accent} />
                <Typography variant="microLabel" style={{ color: accent, letterSpacing: 2 }}>
                  AFIRMACJA OBFITOŚCI DNIA
                </Typography>
              </View>
              <Typography
                variant="body1"
                style={{ color: textColor, lineHeight: 26, fontStyle: 'italic', fontSize: 16, textAlign: 'center' }}
              >
                "{dailyAffirmation}"
              </Typography>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: accent, opacity: 0.4 + i * 0.2 }} />
                ))}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── VISUALIZATION GUIDE ────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(280).springify()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12 }}>
              <Heart size={16} color={accent} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                PRZEWODNIK WIZUALIZACJI
              </Typography>
            </View>
            {VISUALIZATION_STEPS.map((step, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  HapticsService.notify();
                  setExpandedVizStep(prev => prev === idx ? null : idx);
                }}
                style={[styles.vizCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.stepCircle, { backgroundColor: accent + '22', borderColor: accent + '55' }]}>
                    <Typography variant="microLabel" style={{ color: accent, fontWeight: '700', fontSize: 12 }}>
                      {idx + 1}
                    </Typography>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="label" style={{ color: textColor, fontWeight: '600' }}>
                      {step.title}
                    </Typography>
                  </View>
                  {expandedVizStep === idx
                    ? <ChevronUp size={16} color={subColor} />
                    : <ChevronDown size={16} color={subColor} />
                  }
                </View>
                {expandedVizStep === idx && (
                  <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 10 }}>
                    <Typography variant="body2" style={{ color: subColor, lineHeight: 20, marginBottom: 8 }}>
                      {step.body}
                    </Typography>
                    {step.breathCue && (
                      <View style={[styles.breathCue, { backgroundColor: accent + '14', borderColor: accent + '33' }]}>
                        <Wind size={12} color={accent} />
                        <Typography variant="microLabel" style={{ color: accent, marginLeft: 6, fontSize: 11 }}>
                          {step.breathCue}
                        </Typography>
                      </View>
                    )}
                  </Animated.View>
                )}
              </Pressable>
            ))}
          </Animated.View>

          {/* ── MANIFESTATION JOURNAL ──────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(320).springify()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12 }}>
              <BookOpen size={16} color={accent} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                DZIENNIK MANIFESTACJI
              </Typography>
            </View>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Typography variant="body2" style={{ color: subColor, marginBottom: 8, lineHeight: 18 }}>
                Zapisz co dziś zamanifestowałaś lub co chcesz przyciągnąć. Bądź konkretna i wdzięczna.
              </Typography>
              <TextInput
                value={journalText}
                onChangeText={setJournalText}
                placeholder="Co manifestujesz w swoim życiu?..."
                placeholderTextColor={subColor + '88'}
                style={[styles.journalInput, {
                  color: textColor,
                  backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.10)',
                  borderColor: cardBorder,
                }]}
                multiline
                numberOfLines={4}
              />
              <Pressable
                onPress={saveJournalEntry}
                style={[styles.ctaBtn, { backgroundColor: accent, marginTop: 8 }]}
              >
                <CheckCircle2 size={15} color="#fff" />
                <Typography variant="label" style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>
                  Zapisz Wpis
                </Typography>
              </Pressable>
            </View>
            {journalEntries.length > 0 && (
              <View style={{ marginTop: 12, gap: 8 }}>
                <Typography variant="microLabel" style={{ color: subColor, letterSpacing: 1.5 }}>
                  OSTATNIE WPISY
                </Typography>
                {journalEntries.map((entry, idx) => (
                  <Animated.View
                    key={idx}
                    entering={FadeInDown.delay(idx * 60).springify()}
                    style={[styles.journalEntry, { backgroundColor: cardBg, borderColor: cardBorder }]}
                  >
                    <Typography variant="microLabel" style={{ color: accent, marginBottom: 4 }}>
                      {entry.date}
                    </Typography>
                    <Typography variant="body2" style={{ color: textColor, lineHeight: 18 }}>
                      {entry.text}
                    </Typography>
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* ── ORACLE AI ──────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(360).springify()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12 }}>
              <Zap size={16} color={accent} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                WYROCZNIA MANIFESTACJI
              </Typography>
            </View>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {/* Quick prompts */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {ORACLE_PROMPTS.map((p, i) => (
                  <Pressable
                    key={i}
                    onPress={() => askOracle(p)}
                    style={[styles.oracleChip, { backgroundColor: accent + '18', borderColor: accent + '44' }]}
                  >
                    <Typography variant="microLabel" style={{ color: accent, fontSize: 11 }}>
                      {p}
                    </Typography>
                  </Pressable>
                ))}
              </View>
              {/* Free text */}
              <TextInput
                value={oracleInput}
                onChangeText={setOracleInput}
                placeholder="Zadaj pytanie Wyroczni Manifestacji..."
                placeholderTextColor={subColor + '88'}
                style={[styles.oracleInput, {
                  color: textColor,
                  backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.10)',
                  borderColor: cardBorder,
                }]}
                multiline
              />
              <Pressable
                onPress={() => askOracle()}
                disabled={oracleLoading || !oracleInput.trim()}
                style={[styles.ctaBtn, { backgroundColor: oracleLoading ? subColor : accent, marginTop: 8 }]}
              >
                <Send size={15} color="#fff" />
                <Typography variant="label" style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>
                  {oracleLoading ? 'Wyrocznia odpowiada...' : 'Zapytaj Wyrocznię'}
                </Typography>
              </Pressable>
              {oracleReply ? (
                <Animated.View
                  entering={FadeInDown.duration(500)}
                  style={[styles.oracleReply, {
                    backgroundColor: isLight ? accent + '10' : accent + '18',
                    borderColor: accent + '44',
                    marginTop: 12,
                  }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Sparkles size={13} color={accent} />
                    <Typography variant="microLabel" style={{ color: accent, letterSpacing: 1.5 }}>
                      ODPOWIEDŹ WYROCZNI
                    </Typography>
                  </View>
                  <Typography variant="body2" style={{ color: textColor, lineHeight: 22 }}>
                    {oracleReply}
                  </Typography>
                </Animated.View>
              ) : null}
            </View>
          </Animated.View>

          <EndOfContentSpacer />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Technique Practice Modal */}
      <Modal visible={!!activeTechnique} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, {
            backgroundColor: isLight ? '#FFFBEB' : '#1A1000',
            borderColor: activeTechnique?.color + '44' || cardBorder,
          }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Typography variant="title3" style={{ color: textColor, fontWeight: '700' }}>
                {activeTechnique?.title}
              </Typography>
              <Pressable onPress={() => setActiveTechnique(null)} hitSlop={8}>
                <X size={20} color={subColor} />
              </Pressable>
            </View>
            <Typography variant="microLabel" style={{ color: activeTechnique?.color, letterSpacing: 2, marginBottom: 8 }}>
              {activeTechnique?.eyebrow}
            </Typography>
            <Typography variant="body2" style={{ color: subColor, lineHeight: 18, marginBottom: 16 }}>
              {activeTechnique?.description}
            </Typography>
            <TextInput
              value={techniqueText}
              onChangeText={setTechniqueText}
              placeholder={activeTechnique?.prompt}
              placeholderTextColor={subColor + '88'}
              style={[styles.techniqueInput, {
                color: textColor,
                backgroundColor: cardBg,
                borderColor: activeTechnique?.color + '44' || cardBorder,
              }]}
              multiline
              numberOfLines={6}
              autoFocus
            />
            <Pressable
              onPress={() => {
                if (!techniqueText.trim()) return;
                HapticsService.notify();
                Alert.alert('✨ Zapisano', 'Twoja praktyka pisania została zarejestrowana. Kontynuuj tę technikę regularnie, aby zamanifestować swoje pragnienia.');
                setActiveTechnique(null);
                setTechniqueText('');
              }}
              style={[styles.ctaBtn, { backgroundColor: activeTechnique?.color || accent, marginTop: 12 }]}
            >
              <CheckCircle2 size={15} color="#fff" />
              <Typography variant="label" style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>
                Zapisz Praktykę
              </Typography>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 12,
  },
  phaseBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  intentRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  emojiBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 2,
  },
  intentInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  techCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  techBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  affirmCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 12,
  },
  vizCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 8,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathCue: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  journalInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  journalEntry: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  oracleChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  oracleInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  oracleReply: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 40,
  },
  techniqueInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 140,
    textAlignVertical: 'top',
  },
});
