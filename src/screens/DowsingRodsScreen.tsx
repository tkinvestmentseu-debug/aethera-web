// @ts-nocheck
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
  Text, TextInput, View, Dimensions, Modal, Alert,
} from 'react-native';
import { MysticalInput } from '../components/MysticalInput';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop, Line, Ellipse, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence,
  withDelay, FadeInDown, FadeInUp, FadeIn, interpolate, useAnimatedProps,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, ArrowRight, Sparkles, Moon, BookOpen, RefreshCw, Info,
  Zap, Check, Users, Gem, BatteryMedium, Layers, ChevronDown, ChevronUp,
  SlidersHorizontal, Activity, Heart, Briefcase, Feather, HelpCircle,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#FBBF24';
const SP = layout.padding.screen;
const DAILY_QUESTION_LIMIT = 3;

// ── Question Categories ─────────────────────────────────────────────────────
const QUESTION_CATEGORIES = [
  {
    id: 'milosc', label: 'Miłość', icon: Heart, color: '#F87171',
    questions: [
      'Czy ta relacja przynosi mi dobro i wzrost?',
      'Czy mogę zaufać tej osobie?',
      'Czy ta osoba czuje do mnie miłość?',
      'Czy to jest właściwy moment na wyznanie uczuć?',
      'Czy powinnam/powinienem dać tej relacji jeszcze jedną szansę?',
    ],
  },
  {
    id: 'zdrowie', label: 'Zdrowie', icon: Activity, color: '#34D399',
    questions: [
      'Czy moje ciało potrzebuje teraz odpoczynku?',
      'Czy ta dieta służy mojemu zdrowiu?',
      'Czy powinienem/powinnam podjąć tę kurację?',
      'Czy moje ciało sygnalizuje coś ważnego w tej chwili?',
      'Czy ta praktyka uzdrawiania jest dla mnie odpowiednia?',
    ],
  },
  {
    id: 'kariera', label: 'Kariera', icon: Briefcase, color: '#60A5FA',
    questions: [
      'Czy to jest właściwa praca dla mnie?',
      'Czy powinienem/powinnam przyjąć tę ofertę?',
      'Czy nadszedł czas, żeby zmienić ścieżkę zawodową?',
      'Czy ten projekt zakończy się sukcesem?',
      'Czy mam wsparcie potrzebne do realizacji tego celu?',
    ],
  },
  {
    id: 'duchowosc', label: 'Duchowość', icon: Feather, color: '#A78BFA',
    questions: [
      'Czy ta ścieżka duchowa jest zgodna z moją duszą?',
      'Czy ten nauczyciel/mentor jest dla mnie wartościowy?',
      'Czy ta praktyka otwiera moje serce?',
      'Czy moja intuicja w tej sprawie jest właściwa?',
      'Czy powinnam/powinienem kontynuować tę medytację?',
    ],
  },
  {
    id: 'decyzja', label: 'Decyzja', icon: SlidersHorizontal, color: ACCENT,
    questions: [
      'Czy to jest właściwy czas na tę decyzję?',
      'Czy powinienem/powinnam wybrać opcję A?',
      'Czy poczekanie jeszcze przez tydzień jest dobrym pomysłem?',
      'Czy ta zmiana przyniesie mi korzyść?',
      'Czy moje wahanie ma sens i powinienem/powinnam posłuchać?',
    ],
  },
  {
    id: 'wolna', label: 'Wolna forma', icon: HelpCircle, color: '#FCA5A5',
    questions: [
      'Czy to, co czuję teraz, jest słuszne?',
      'Czy ten pomysł jest wart realizacji?',
      'Czy powinienem/powinnam zaufać temu procesowi?',
    ],
  },
];

// ── Answer Types ────────────────────────────────────────────────────────────
const ANSWER_TYPES = {
  YES: { label: 'TAK', color: ACCENT, emoji: '🟡', desc: 'Różdżki zbiegają się lub wahadło oscyluje w przód i w tył' },
  NO: { label: 'NIE', color: '#EF4444', emoji: '🔴', desc: 'Różdżki rozsuwają się lub wahadło oscyluje w lewo i prawo' },
  MAYBE: { label: 'MOŻE', color: '#A78BFA', emoji: '🟣', desc: 'Różdżki drżą lub wahadło zatacza skośne ósemki' },
  ASK_AGAIN: { label: 'ZAPYTAJ PONOWNIE', color: '#6B7280', emoji: '⚪', desc: 'Instrument nieruchomy — energia niezdecydowana lub pytanie wymaga doprecyzowania' },
};

const ANSWER_KEYS = ['YES', 'NO', 'MAYBE', 'ASK_AGAIN'];
const ANSWER_WEIGHTS = [0.40, 0.35, 0.15, 0.10]; // probability distribution

// ── Crystal Pendulum Guide ──────────────────────────────────────────────────
const CRYSTALS = [
  { name: 'Kwarc Górski', color: '#E0F2FE', desc: 'Uniwersalny wzmacniacz. Neutralny i precyzyjny — idealny dla początkujących.', emoji: '💎', strength: 'Jasność, neutralność' },
  { name: 'Ametyst', color: '#C4B5FD', desc: 'Wzmacnia intuicję i połączenie z wyższą wiedzą. Doskonały do pytań duchowych.', emoji: '🔮', strength: 'Intuicja, duchowość' },
  { name: 'Obsydian', color: '#374151', desc: 'Uziemia i chroni. Odkrywa prawdę ukrytą za lękiem. Mocny, bezpośredni.', emoji: '🪨', strength: 'Ochrona, prawda' },
  { name: 'Różaniec (Kwarc Różowy)', color: '#FBCFE8', desc: 'Rezonuje z miłością i relacjami. Delikatny, ciepły. Idealny do pytań o serce.', emoji: '🌸', strength: 'Miłość, emocje' },
  { name: 'Tygrysie Oko', color: '#92400E', desc: 'Wspiera decyzje w sprawach kariery i finansów. Odwaga i pewność siebie.', emoji: '🟤', strength: 'Kariera, odwaga' },
  { name: 'Labradoryt', color: '#67E8F9', desc: 'Kamień transformacji i magii. Pomaga odkryć ukryte wzorce energetyczne.', emoji: '🌊', strength: 'Transformacja, wzorce' },
  { name: 'Malachit', color: '#6EE7B7', desc: 'Związany ze zdrowiem i uzdrawianiem. Ujawnia blokady energetyczne w ciele.', emoji: '🌿', strength: 'Zdrowie, uzdrawianie' },
  { name: 'Czarny Turmalin', color: '#1F2937', desc: 'Tworzy tarczę ochronną. Odpędza energię negatywną podczas sesji.', emoji: '🖤', strength: 'Oczyszczanie, ochrona' },
];

// ── Category Affirmations ───────────────────────────────────────────────────
const AFFIRMATIONS_BY_CATEGORY = {
  milosc: [
    'Zasługuję na miłość, która mnie wznosi, nie ciągnie w dół.',
    'Moje serce wie, kiedy czas otworzyć się, a kiedy chronić.',
    'Każda odpowiedź przybliża mnie do związku pełnego harmonii.',
  ],
  zdrowie: [
    'Moje ciało jest mądrym przewodnikiem — słucham go z wdzięcznością.',
    'Uzdrowienie zaczyna się od decyzji, by słuchać wewnętrznego głosu.',
    'Jestem w zgodzie z rytmem swojego ciała i jego potrzebami.',
  ],
  kariera: [
    'Moja praca jest wyrazem moich darów — prowadzi mnie we właściwym kierunku.',
    'Każda decyzja zawodowa przybliża mnie do pełni moich możliwości.',
    'Mam odwagę podążać za ścieżką, która rezonuje z moją duszą.',
  ],
  duchowosc: [
    'Moja intuicja jest pewnym kompasem na ścieżce przebudzenia.',
    'Jestem połączona/połączony z mądrością, która przekracza czas.',
    'Każde pytanie, które zadaję, zbliża mnie do prawdy mojej duszy.',
  ],
  decyzja: [
    'Mam w sobie całą mądrość potrzebną do podjęcia tej decyzji.',
    'Wybieram spokojnie i pewnie — każdy wybór jest krokiem naprzód.',
    'Ufam sobie, bo znam odpowiedź głębiej niż myślę.',
  ],
  wolna: [
    'Jestem prowadzona/prowadzony przez siły większe niż mój umysł.',
    'Odpowiedź zawsze tu jest — wystarczy się wyciszyć i usłyszeć.',
    'Każde pytanie to akt odwagi. Stawianie pytań to moja moc.',
  ],
};

// ── Quick Questions ─────────────────────────────────────────────────────────
const QUICK_QUESTIONS = [
  'Czy to jest właściwy czas na tę decyzję?',
  'Czy ta relacja przynosi mi dobro?',
  'Czy powinienem/powinnam wybrać tę opcję?',
  'Czy moje ciało potrzebuje teraz odpoczynku?',
  'Czy ta ścieżka jest zgodna z moim celem?',
  'Czy powinienem/powinnam podjąć ryzyko?',
];

const QUESTION_TIPS = [
  { emoji: '✦', title: 'Pytaj w trybie "czy"', body: 'Najlepiej działają pytania zaczynające się od "czy..." — dają jednoznaczną polaryzację energii.' },
  { emoji: '☽', title: 'Jedno pytanie naraz', body: 'Nie zadawaj pytań złożonych. Rozbij "czy A i B" na dwa osobne pytania.' },
  { emoji: '⚡', title: 'Bądź neutralny/a', body: 'Silna emocja (lęk, nadzieja) może wpływać na odpowiedź. Wejdź w stan spokojnej ciekawości.' },
  { emoji: '★', title: 'Sformułuj precyzyjnie', body: 'Im dokładniejszy kontekst w pytaniu, tym czystsza odpowiedź różdżek.' },
];

const PENDULUM_TIPS = [
  'Wahadło powiązane z koralami bursztynu wzmacnia połączenie z ziemią.',
  'Kryształ górski oczyszcza energię przed sesją — połóż go obok wahadła.',
  'Sesja rano, na czczo, daje czystsze odpowiedzi niż wieczorem po zmęczeniu.',
];

// ── Calibration Steps ───────────────────────────────────────────────────────
const CALIBRATION_STEPS = [
  { label: 'Myśl TAK', instruction: 'Skup się na silnym, pewnym "TAK". Przypomnij sobie moment, gdy coś wiedziałaś/wiedziałeś z absolutną pewnością.', motion: 'Oczekiwany ruch: zbliżenie do siebie (TAK)', swingPattern: 'yes' },
  { label: 'Myśl NIE', instruction: 'Teraz skup się na wyraźnym "NIE". Przypomnij sobie coś, czego absolutnie nie chcesz lub co jest niezgodne z Twoją prawdą.', motion: 'Oczekiwany ruch: oddalenie od siebie (NIE)', swingPattern: 'no' },
  { label: 'Teraz pytaj', instruction: 'Kalibracja zakończona. Twój instrument jest dostrojony do Twojego pola energetycznego. Wejdź w stan spokojnej neutralności i zadaj pytanie.', motion: 'Jesteś gotowa/gotowy ✦', swingPattern: 'ready' },
];

// ── Themed Background ────────────────────────────────────────────────────────
const DowsingBg = ({ isLight }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight ? ['#FFFBEE', '#FFF6D8', '#FFF0C0'] : ['#0A0800', '#120E00', '#1A1400']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={400} style={{ position: 'absolute', top: 0 }} opacity={isLight ? 0.1 : 0.18}>
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={ACCENT} stopOpacity={0.4} />
          <Stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={SW / 2} cy={200} r={180} fill="url(#glow)" />
      {Array.from({ length: 40 }, (_, i) => (
        <Circle key={i} cx={((i * 97 + 37) % SW)} cy={((i * 67 + 50) % 380)} r={i % 3 === 0 ? 1.8 : 0.9} fill={ACCENT} opacity={0.4 + (i % 4) * 0.1} />
      ))}
    </Svg>
  </View>
);

// ── Enhanced Pendulum Visual ─────────────────────────────────────────────────
const PendulumVisual = React.memo(({ swingAnim, answered, answerKey, isLight }) => {
  const answerData = answerKey ? ANSWER_TYPES[answerKey] : null;
  const answerColor = answerData?.color ?? ACCENT;

  const glowOpacity = useSharedValue(0);
  const trailOpacity = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = answered ? withTiming(1, { duration: 400 }) : withTiming(0, { duration: 300 });
    trailOpacity.value = answered ? withRepeat(withSequence(withTiming(0.5, { duration: 300 }), withTiming(0.1, { duration: 300 })), -1, true) : withTiming(0, { duration: 200 });
  }, [answered]);

  const swingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swingAnim.value}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const trailStyleL = useAnimatedStyle(() => ({
    opacity: trailOpacity.value * 0.6,
    transform: [{ rotate: `${swingAnim.value * 0.7}deg` }],
  }));
  const trailStyleR = useAnimatedStyle(() => ({
    opacity: trailOpacity.value * 0.4,
    transform: [{ rotate: `${swingAnim.value * 0.4}deg` }],
  }));

  return (
    <View style={{ width: 140, height: 230, alignSelf: 'center', alignItems: 'center', justifyContent: 'flex-start' }}>
      {/* Glow base */}
      {answered && (
        <Animated.View style={[{
          position: 'absolute', bottom: 16, width: 72, height: 72,
          borderRadius: 36, backgroundColor: answerColor + '33',
        }, glowStyle]} />
      )}
      {/* Trail layers */}
      <Animated.View style={[{ position: 'absolute', top: 0, alignItems: 'center', transformOrigin: 'top center' }, trailStyleL]}>
        <View style={{ width: 1, height: 130, backgroundColor: answerColor + '66' }} />
        <View style={{ width: 18, height: 24, borderRadius: 9, backgroundColor: answerColor + '44', marginTop: -2 }} />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', top: 0, alignItems: 'center', transformOrigin: 'top center' }, trailStyleR]}>
        <View style={{ width: 1, height: 130, backgroundColor: answerColor + '44' }} />
        <View style={{ width: 14, height: 20, borderRadius: 7, backgroundColor: answerColor + '22', marginTop: -2 }} />
      </Animated.View>
      {/* Anchor point */}
      <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: ACCENT, zIndex: 10, borderWidth: 2, borderColor: ACCENT + '88' }} />
      {/* Main pendulum */}
      <Animated.View style={[{ alignItems: 'center', transformOrigin: 'top center', position: 'absolute', top: 8 }, swingStyle]}>
        {/* String */}
        <View style={{ width: 1.5, height: 130, backgroundColor: ACCENT + 'CC' }} />
        {/* Crystal body */}
        <Svg width={28} height={44} style={{ marginTop: -2 }}>
          <Defs>
            <RadialGradient id="crystal" cx="50%" cy="30%" r="70%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
              <Stop offset="50%" stopColor={ACCENT} stopOpacity={0.8} />
              <Stop offset="100%" stopColor={ACCENT + 'AA'} stopOpacity={1} />
            </RadialGradient>
          </Defs>
          <Path d="M14 0 L22 14 L14 42 L6 14 Z" fill="url(#crystal)" />
          <Path d="M14 0 L22 14 L14 24 L6 14 Z" fill={ACCENT + 'EE'} />
          <Path d="M14 8 L18 14 L14 20 L10 14 Z" fill="#FFFFFF" opacity={0.5} />
        </Svg>
        {/* Cap */}
        <View style={{ width: 10, height: 8, borderRadius: 5, backgroundColor: ACCENT + 'AA', marginTop: -4 }} />
      </Animated.View>
      {/* Answer label */}
      {answered && answerData && (
        <Animated.View entering={FadeIn.duration(300)} style={{ position: 'absolute', bottom: -36 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: answerColor, letterSpacing: 2, textAlign: 'center' }}>
            {answerData.emoji} {answerData.label}
          </Text>
        </Animated.View>
      )}
    </View>
  );
});

// ── Dowsing Rods visual ──────────────────────────────────────────────────────
const DowsingRods3D = React.memo(({ leftRot, rightRot, answered, answerKey }) => {
  const answerData = answerKey ? ANSWER_TYPES[answerKey] : null;
  const answerColor = answerData?.color ?? ACCENT;

  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      tiltY.value = Math.max(-30, Math.min(30, e.translationX * 0.18));
      tiltX.value = Math.max(-20, Math.min(20, e.translationY * 0.12));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 700 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }],
  }));

  const leftStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${leftRot.value}deg` }] }));
  const rightStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rightRot.value}deg` }] }));
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = answered ? withTiming(1, { duration: 400 }) : withTiming(0, { duration: 300 });
  }, [answered]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ width: 240, height: 220, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }, containerStyle]}>
        {answered && (
          <Animated.View style={[{ position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: answerColor + '33' }, glowStyle]} />
        )}
        {/* Left rod */}
        <Animated.View style={[{ position: 'absolute', left: 20, bottom: 30, transformOrigin: 'bottom left' }, leftStyle]}>
          <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <View style={{ width: 8, height: 80, backgroundColor: ACCENT, borderRadius: 4, marginLeft: 10 }} />
            <View style={{ width: 90, height: 7, backgroundColor: ACCENT, borderRadius: 3.5, marginTop: -7 }} />
          </View>
        </Animated.View>
        {/* Right rod */}
        <Animated.View style={[{ position: 'absolute', right: 20, bottom: 30, transformOrigin: 'bottom right' }, rightStyle]}>
          <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
            <View style={{ width: 8, height: 80, backgroundColor: ACCENT, borderRadius: 4, marginRight: 10 }} />
            <View style={{ width: 90, height: 7, backgroundColor: ACCENT, borderRadius: 3.5, marginTop: -7 }} />
          </View>
        </Animated.View>
        {answered && answerData && (
          <View style={{ position: 'absolute', top: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: answerColor, letterSpacing: 2 }}>
              {answerData.emoji} {answerData.label}
            </Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
});

// ── Energy Meter ─────────────────────────────────────────────────────────────
const EnergyMeter = ({ value, isLight }) => {
  const color = value < 33 ? '#EF4444' : value < 66 ? ACCENT : '#34D399';
  const label = value < 33 ? 'NISKA' : value < 66 ? 'NEUTRALNA' : 'WYSOKA';
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Svg width={160} height={160}>
        <Defs>
          <RadialGradient id="emglow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={80} cy={80} r={70} fill="url(#emglow)" />
        <Circle cx={80} cy={80} r={60} fill="none" stroke={isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)'} strokeWidth={10} />
        <Circle
          cx={80} cy={80} r={60}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={`${(value / 100) * 377} 377`}
          strokeDashoffset={94}
          strokeLinecap="round"
          rotation={-90}
          origin="80,80"
        />
        <Circle cx={80} cy={80} r={40} fill={color + '18'} />
      </Svg>
      <Text style={{ fontSize: 32, fontWeight: '900', color, letterSpacing: 1 }}>{value}%</Text>
      <Text style={{ fontSize: 11, fontWeight: '700', color, letterSpacing: 2 }}>{label} ENERGIA</Text>
    </View>
  );
};

// ── Main Screen ──────────────────────────────────────────────────────────────
export const DowsingRodsScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
  const textColor = isLight ? '#1A1108' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.65)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = ACCENT + '33';

  // Core state
  const [mode, setMode] = useState<'rozdzki' | 'wahadlo' | 'energia'>('rozdzki');
  const [question, setQuestion] = useState('');
  const [answered, setAnswered] = useState(false);
  const [answerKey, setAnswerKey] = useState<string | null>(null);
  const [history, setHistory] = useState<{ q: string; ak: string; ts: string; date: string; note: string; category: string }[]>([]);
  const [calibrated, setCalibrated] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Category state
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCategoryQuestions, setShowCategoryQuestions] = useState(false);

  // Calibration state
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibStep, setCalibStep] = useState(0);
  const [calibDone, setCalibDone] = useState(false);

  // Energy mode state
  const [energyValue, setEnergyValue] = useState<number | null>(null);
  const [isScanningEnergy, setIsScanningEnergy] = useState(false);

  // Crystal guide state
  const [showCrystalGuide, setShowCrystalGuide] = useState(false);
  const [selectedCrystal, setSelectedCrystal] = useState<number | null>(null);

  // Daily limit state
  const [sessionCount, setSessionCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);

  // Affirmation state
  const [currentAffirmation, setCurrentAffirmation] = useState<string | null>(null);

  // History note editing
  const [editingNoteIdx, setEditingNoteIdx] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState('');

  // Sections expand/collapse
  const [showHistory, setShowHistory] = useState(true);
  const [showCrystals, setShowCrystals] = useState(false);

  // Animations
  const leftRot = useSharedValue(0);
  const rightRot = useSharedValue(0);
  const pendulumSwing = useSharedValue(0);
  const calibrateScale = useSharedValue(1);
  const energyProgress = useSharedValue(0);
  const energyScanPulse = useSharedValue(1);

  const isFav = isFavoriteItem('dowsing-rods');

  // Timer refs for cleanup
  const answerResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calibTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const energyScanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (answerResetTimerRef.current) clearTimeout(answerResetTimerRef.current);
      if (calibTimerRef.current) clearTimeout(calibTimerRef.current);
      if (energyScanTimerRef.current) clearTimeout(energyScanTimerRef.current);
    };
  }, []);

  // Stats
  const stats = useMemo(() => {
    if (!history.length) return null;
    const yes = history.filter((h) => h.ak === 'YES').length;
    const no = history.filter((h) => h.ak === 'NO').length;
    const maybe = history.filter((h) => h.ak === 'MAYBE').length;
    const ask = history.filter((h) => h.ak === 'ASK_AGAIN').length;
    return { total: history.length, yes, no, maybe, ask };
  }, [history]);

  const focusIntoView = (y = 250) => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(y - 150, 0), animated: true }), 180);
  };

  // ── Derive answer from random with weighted distribution ──────────────────
  const pickAnswer = useCallback(() => {
    const rand = Math.random();
    let cumul = 0;
    for (let i = 0; i < ANSWER_KEYS.length; i++) {
      cumul += ANSWER_WEIGHTS[i];
      if (rand < cumul) return ANSWER_KEYS[i];
    }
    return 'YES';
  }, []);

  // ── Play animation for given answer ──────────────────────────────────────
  const playAnswerAnimation = useCallback((key: string) => {
    if (mode === 'rozdzki') {
      switch (key) {
        case 'YES':
          leftRot.value = withSpring(38, { damping: 7, stiffness: 75 });
          rightRot.value = withSpring(-38, { damping: 7, stiffness: 75 });
          break;
        case 'NO':
          leftRot.value = withSpring(-38, { damping: 7, stiffness: 75 });
          rightRot.value = withSpring(38, { damping: 7, stiffness: 75 });
          break;
        case 'MAYBE':
          leftRot.value = withRepeat(withSequence(withTiming(15, { duration: 400 }), withTiming(-15, { duration: 400 })), 4, true);
          rightRot.value = withRepeat(withSequence(withTiming(-15, { duration: 400 }), withTiming(15, { duration: 400 })), 4, true);
          break;
        case 'ASK_AGAIN':
          leftRot.value = withSequence(withSpring(5), withSpring(-5), withSpring(0));
          rightRot.value = withSequence(withSpring(-5), withSpring(5), withSpring(0));
          break;
      }
    } else if (mode === 'wahadlo') {
      switch (key) {
        case 'YES':
          // Front-back (larger amplitude)
          pendulumSwing.value = withRepeat(withSequence(
            withTiming(-24, { duration: 480, easing: Easing.inOut(Easing.sin) }),
            withTiming(24, { duration: 480, easing: Easing.inOut(Easing.sin) }),
          ), 5, true);
          break;
        case 'NO':
          // Smaller lateral
          pendulumSwing.value = withRepeat(withSequence(
            withTiming(-18, { duration: 580, easing: Easing.inOut(Easing.sin) }),
            withTiming(18, { duration: 580, easing: Easing.inOut(Easing.sin) }),
          ), 5, true);
          break;
        case 'MAYBE':
          // Clockwise-like wobble
          pendulumSwing.value = withRepeat(withSequence(
            withTiming(20, { duration: 350 }), withTiming(0, { duration: 200 }),
            withTiming(-20, { duration: 350 }), withTiming(0, { duration: 200 }),
            withTiming(10, { duration: 250 }), withTiming(-10, { duration: 250 }),
          ), 2, false);
          break;
        case 'ASK_AGAIN':
          // Nearly still — tiny jitter
          pendulumSwing.value = withRepeat(withSequence(
            withTiming(4, { duration: 700 }), withTiming(-4, { duration: 700 }),
          ), 3, true);
          break;
      }
    }
  }, [mode]);

  // ── Handle Ask ────────────────────────────────────────────────────────────
  const handleAsk = () => {
    if (!question.trim()) return;
    if (limitReached) {
      Alert.alert('Limit sesji', `Dla najlepszych wyników zalecamy maksymalnie ${DAILY_QUESTION_LIMIT} pytania na sesję. Wróć jutro lub zacznij nową sesję medytacyjną.`);
      return;
    }
    HapticsService.impact('medium');
    const key = pickAnswer();
    setAnswerKey(key);
    setAnswered(true);
    playAnswerAnimation(key);

    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const date = `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}`;
    const catId = activeCategory ?? 'wolna';

    setHistory(prev => [{ q: question.trim(), ak: key, ts, date, note: '', category: catId }, ...prev].slice(0, 10));

    // Show affirmation related to category after answering
    const affArr = AFFIRMATIONS_BY_CATEGORY[catId] ?? AFFIRMATIONS_BY_CATEGORY['wolna'];
    setCurrentAffirmation(affArr[Math.floor(Math.random() * affArr.length)]);

    const newCount = sessionCount + 1;
    setSessionCount(newCount);
    if (newCount >= DAILY_QUESTION_LIMIT) setLimitReached(true);

    if (answerResetTimerRef.current) clearTimeout(answerResetTimerRef.current);
    answerResetTimerRef.current = setTimeout(() => {
      leftRot.value = withSpring(0, { damping: 10, stiffness: 100 });
      rightRot.value = withSpring(0, { damping: 10, stiffness: 100 });
      pendulumSwing.value = withTiming(0, { duration: 600 });
      setAnswered(false);
      setAnswerKey(null);
      setQuestion('');
      HapticsService.notify();
    }, 4000);
  };

  // ── Handle Calibrate ──────────────────────────────────────────────────────
  const handleCalibrate = () => {
    setCalibrated(false);
    setCalibDone(false);
    setCalibStep(0);
    setShowCalibration(true);
    HapticsService.impact('medium');
  };

  const advanceCalibStep = () => {
    if (calibStep < CALIBRATION_STEPS.length - 1) {
      const next = calibStep + 1;
      setCalibStep(next);
      HapticsService.impact('light');
      const step = CALIBRATION_STEPS[next];
      if (step.swingPattern === 'yes') {
        leftRot.value = withSpring(30, { damping: 8 });
        rightRot.value = withSpring(-30, { damping: 8 });
        pendulumSwing.value = withRepeat(withSequence(withTiming(-20, { duration: 500 }), withTiming(20, { duration: 500 })), 3, true);
      } else if (step.swingPattern === 'no') {
        leftRot.value = withSpring(-30, { damping: 8 });
        rightRot.value = withSpring(30, { damping: 8 });
        pendulumSwing.value = withRepeat(withSequence(withTiming(-16, { duration: 620 }), withTiming(16, { duration: 620 })), 3, true);
      } else {
        leftRot.value = withTiming(0, { duration: 500 });
        rightRot.value = withTiming(0, { duration: 500 });
        pendulumSwing.value = withTiming(0, { duration: 500 });
      }
    } else {
      setCalibDone(true);
      setCalibrated(true);
      calibrateScale.value = withSequence(withSpring(1.08, { damping: 5 }), withSpring(1, { damping: 8 }));
      if (calibTimerRef.current) clearTimeout(calibTimerRef.current);
      calibTimerRef.current = setTimeout(() => {
        setShowCalibration(false);
        leftRot.value = withSpring(0);
        rightRot.value = withSpring(0);
        pendulumSwing.value = withTiming(0);
        HapticsService.notify();
      }, 1200);
    }
  };

  // ── Energy Scan ───────────────────────────────────────────────────────────
  const handleEnergyScan = () => {
    if (isScanningEnergy) return;
    setIsScanningEnergy(true);
    setEnergyValue(null);
    HapticsService.impact('medium');
    energyScanPulse.value = withRepeat(withSequence(withTiming(1.15, { duration: 600 }), withTiming(1.0, { duration: 600 })), 4, false);
    if (energyScanTimerRef.current) clearTimeout(energyScanTimerRef.current);
    energyScanTimerRef.current = setTimeout(() => {
      const val = Math.round(20 + Math.random() * 75);
      setEnergyValue(val);
      setIsScanningEnergy(false);
      HapticsService.notify();
    }, 5000);
  };

  const calibrateStyle = useAnimatedStyle(() => ({ transform: [{ scale: calibrateScale.value }] }));
  const energyScanStyle = useAnimatedStyle(() => ({ transform: [{ scale: energyScanPulse.value }] }));

  const answerData = answerKey ? ANSWER_TYPES[answerKey] : null;

  return (
    <View style={[s.container, { backgroundColor: currentTheme.background }]}>
      <DowsingBg isLight={isLight} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={[s.header, { paddingHorizontal: SP }]}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={s.backBtn} hitSlop={12}>
            <ChevronLeft color={ACCENT} size={22} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[s.headerEyebrow, { color: ACCENT }]}>{t('dowsingRods.radiestezj', 'RADIESTEZJA')}</Text>
            <Text style={[s.headerTitle, { color: textColor }]}>{t('dowsingRods.rozdzki_amp_wahadlo', 'Różdżki &amp; Wahadło')}</Text>
          </View>
          <Pressable
            onPress={() => { if (isFav) { removeFavoriteItem('dowsing-rods'); } else { addFavoriteItem({ id: 'dowsing-rods', label: 'Różdżki', route: 'DowsingRods', params: {}, icon: 'Zap', color: ACCENT, addedAt: new Date().toISOString() }); } }}
            style={s.backBtn} hitSlop={8}
          >
            <Star color={isFav ? ACCENT : ACCENT + '88'} size={18} fill={isFav ? ACCENT : 'none'} />
          </Pressable>
        </View>

        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            {/* ── Mode selector ─────────────────────────────────── */}
            <Animated.View entering={FadeInDown.duration(400)} style={[s.modeRow, { marginHorizontal: SP }]}>
              {[
                { id: 'rozdzki', label: 'Różdżki', emoji: '🔱' },
                { id: 'wahadlo', label: 'Wahadło', emoji: '🔮' },
                { id: 'energia', label: 'Energia', emoji: '⚡' },
              ].map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => { setMode(m.id as any); HapticsService.impact('light'); }}
                  style={[s.modeChip, { backgroundColor: mode === m.id ? ACCENT + '28' : cardBg, borderColor: mode === m.id ? ACCENT : ACCENT + '33' }]}
                >
                  <Text style={{ fontSize: 15 }}>{m.emoji}</Text>
                  <Text style={[s.modeLabel, { color: mode === m.id ? ACCENT : subColor, fontWeight: mode === m.id ? '700' : '500' }]}>{m.label}</Text>
                </Pressable>
              ))}
            </Animated.View>

            {/* ── Visualization ─────────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(100).duration(600)} style={{ marginVertical: 20, alignItems: 'center' }}>
              {mode === 'rozdzki' && (
                <DowsingRods3D leftRot={leftRot} rightRot={rightRot} answered={answered} answerKey={answerKey} />
              )}
              {mode === 'wahadlo' && (
                <PendulumVisual swingAnim={pendulumSwing} answered={answered} answerKey={answerKey} isLight={isLight} />
              )}
              {mode === 'energia' && (
                <Animated.View style={energyScanStyle}>
                  {energyValue !== null ? (
                    <EnergyMeter value={energyValue} isLight={isLight} />
                  ) : (
                    <View style={{ alignItems: 'center', gap: 10 }}>
                      <Svg width={140} height={140}>
                        <Defs>
                          <RadialGradient id="scanGlow" cx="50%" cy="50%" r="50%">
                            <Stop offset="0%" stopColor={ACCENT} stopOpacity={isScanningEnergy ? 0.5 : 0.2} />
                            <Stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                          </RadialGradient>
                        </Defs>
                        <Circle cx={70} cy={70} r={65} fill="url(#scanGlow)" />
                        <Circle cx={70} cy={70} r={44} fill="none" stroke={ACCENT + '66'} strokeWidth={1.5} strokeDasharray="4 6" />
                        <Circle cx={70} cy={70} r={28} fill={ACCENT + '22'} />
                        <Circle cx={70} cy={70} r={14} fill={ACCENT + '44'} />
                      </Svg>
                      <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 }}>
                        {isScanningEnergy ? 'SKANOWANIE...' : 'DOTKNIJ SKANUJ'}
                      </Text>
                    </View>
                  )}
                </Animated.View>
              )}
            </Animated.View>

            {/* ── Daily limit indicator ─────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(110).duration(420)} style={{ marginHorizontal: SP, marginBottom: 12 }}>
              <View style={[s.limitBar, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                <Text style={[s.limitLabel, { color: subColor }]}>{t('dowsingRods.pytania_w_sesji', 'Pytania w sesji')}</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {Array.from({ length: DAILY_QUESTION_LIMIT }, (_, i) => (
                    <View key={i} style={[s.limitDot, { backgroundColor: i < sessionCount ? ACCENT : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)') }]} />
                  ))}
                </View>
                {limitReached && (
                  <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>{t('dowsingRods.limit_sesji', 'LIMIT SESJI')}</Text>
                )}
              </View>
            </Animated.View>

            {/* ── Calibrate button ──────────────────────────────── */}
            <Animated.View style={[calibrateStyle, { marginHorizontal: SP, marginBottom: 12 }]}>
              <Pressable
                onPress={handleCalibrate}
                style={[s.calibrateBtn, { backgroundColor: calibrated ? ACCENT + '18' : cardBg, borderColor: calibrated ? ACCENT + '66' : ACCENT + '33' }]}
              >
                {calibrated ? <Check size={14} color={ACCENT} /> : <RefreshCw size={14} color={ACCENT} />}
                <Text style={[s.calibrateText, { color: ACCENT }]}>
                  {calibrated ? 'Skalibrowane ✓' : 'Rytuał kalibracji (3 kroki)'}
                </Text>
              </Pressable>
            </Animated.View>

            {/* ── Question Categories ───────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(130).duration(460)} style={{ marginHorizontal: SP, marginBottom: 14 }}>
              <Text style={[s.sectionLabel, { color: ACCENT, marginBottom: 10 }]}>{t('dowsingRods.kategorie_pytan', 'KATEGORIE PYTAŃ')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 22 }}>
                {QUESTION_CATEGORIES.map((cat) => {
                  const CatIcon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => {
                        setActiveCategory(isActive ? null : cat.id);
                        setShowCategoryQuestions(!isActive);
                        HapticsService.impact('light');
                      }}
                      style={[s.catChip, {
                        backgroundColor: isActive ? cat.color + '28' : cardBg,
                        borderColor: isActive ? cat.color : cat.color + '44',
                      }]}
                    >
                      <CatIcon size={13} color={isActive ? cat.color : subColor} strokeWidth={2} />
                      <Text style={[s.catLabel, { color: isActive ? cat.color : subColor, fontWeight: isActive ? '700' : '500' }]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {/* Category question templates */}
              {activeCategory && showCategoryQuestions && (() => {
                const cat = QUESTION_CATEGORIES.find(c => c.id === activeCategory);
                if (!cat) return null;
                return (
                  <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 10, gap: 6 }}>
                    <Text style={[{ fontSize: 10, color: cat.color, fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 }]}>
                      PYTANIA — {cat.label.toUpperCase()}
                    </Text>
                    {cat.questions.map((q, i) => (
                      <Pressable
                        key={i}
                        onPress={() => { setQuestion(q); setShowCategoryQuestions(false); HapticsService.impact('light'); }}
                        style={[s.catQRow, { borderColor: cat.color + '44', backgroundColor: cat.color + '0C' }]}
                      >
                        <Text style={{ color: cat.color, fontSize: 13, marginRight: 4 }}>✦</Text>
                        <Text style={[s.catQText, { color: textColor }]} numberOfLines={2}>{q}</Text>
                        <ArrowRight size={12} color={cat.color} strokeWidth={2} />
                      </Pressable>
                    ))}
                  </Animated.View>
                );
              })()}
            </Animated.View>

            {/* ── Quick questions (quick tap chips) ────────────── */}
            <Animated.View entering={FadeInDown.delay(140).duration(480)} style={{ marginHorizontal: SP, marginBottom: 12 }}>
              <Text style={[s.sectionLabel, { color: ACCENT, marginBottom: 8 }]}>{t('dowsingRods.szybkie_pytania', 'SZYBKIE PYTANIA')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 22 }}>
                {QUICK_QUESTIONS.map((q, i) => (
                  <Pressable
                    key={i}
                    onPress={() => { setQuestion(q); HapticsService.impact('light'); }}
                    style={[s.quickQ, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}
                  >
                    <Text style={[s.quickQText, { color: subColor }]} numberOfLines={2}>{q}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>

            {/* ── Energy scanning mode ──────────────────────────── */}
            {mode === 'energia' && (
              <Animated.View entering={FadeInDown.delay(150).duration(460)} style={[s.energyCard, { backgroundColor: cardBg, borderColor: ACCENT + '44', marginHorizontal: SP }]}>
                <LinearGradient colors={[ACCENT + '14', 'transparent']} style={StyleSheet.absoluteFill} />
                <Text style={[s.sectionLabel, { color: ACCENT, marginBottom: 8 }]}>{t('dowsingRods.odczyt_energetycz', 'ODCZYT ENERGETYCZNY')}</Text>
                <Text style={[{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 14 }]}>
                  {t('dowsingRods.poloz_telefon_na_dloni_lub', 'Połóż telefon na dłoni lub nad przedmiotem/miejscem, którego energię chcesz zbadać. Wahadło zmierzy rezonans energetyczny.')}
                </Text>
                <Pressable
                  onPress={handleEnergyScan}
                  disabled={isScanningEnergy}
                  style={[s.scanBtn, { opacity: isScanningEnergy ? 0.6 : 1 }]}
                >
                  <LinearGradient colors={[ACCENT + 'EE', ACCENT + 'BB']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  <BatteryMedium size={16} color="#0A0800" />
                  <Text style={s.scanBtnText}>{isScanningEnergy ? 'Skanowanie... (5s)' : 'Skanuj energię'}</Text>
                </Pressable>
                {energyValue !== null && (
                  <Animated.View entering={FadeIn.duration(400)} style={{ marginTop: 12 }}>
                    <Text style={[{ color: textColor, fontSize: 13, lineHeight: 20 }]}>
                      {energyValue < 33
                        ? '🔴 Energia w tym miejscu jest niska. Rozważ oczyszczenie przestrzeni białą szałwią lub solą. Odpoczynek jest priorytetem.'
                        : energyValue < 66
                          ? '🟡 Energia neutralna — miejsce jest zrównoważone, choć bez wyraźnego potencjału. Dobry czas na spokojną pracę.'
                          : '🟢 Energia wysoka i czysta! To miejsce wspiera kreatywność, uzdrawianie i duchową praktykę.'}
                    </Text>
                    <Pressable
                      onPress={() => { setEnergyValue(null); setIsScanningEnergy(false); }}
                      style={{ marginTop: 10, alignSelf: 'flex-start' }}
                    >
                      <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '700' }}>{t('dowsingRods.skanuj_ponownie', 'Skanuj ponownie →')}</Text>
                    </Pressable>
                  </Animated.View>
                )}
              </Animated.View>
            )}

            {/* ── Question input (only for rozdzki/wahadlo) ────── */}
            {mode !== 'energia' && (
              <Animated.View entering={FadeInDown.delay(200).duration(500)} style={[s.inputSection, { marginHorizontal: SP }]}>
                <Text style={[s.sectionLabel, { color: ACCENT }]}>{t('dowsingRods.twoje_pytanie_tak_nie', 'TWOJE PYTANIE TAK / NIE')}</Text>
                {limitReached && (
                  <View style={[s.limitWarning, { borderColor: ACCENT + '55', backgroundColor: ACCENT + '14' }]}>
                    <Text style={{ color: ACCENT, fontSize: 12, lineHeight: 18 }}>
                      {t('dowsingRods.osiagnieto_limit_3_pytan_w', '✦ Osiągnięto limit 3 pytań w tej sesji. Dla najlepszych rezultatów, zrób krótką przerwę na medytację i odśwież umysł przed kolejną sesją.')}
                    </Text>
                    <Pressable onPress={() => { setSessionCount(0); setLimitReached(false); HapticsService.impact('light'); }} style={{ marginTop: 6 }}>
                      <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '700' }}>{t('dowsingRods.rozpocznij_nowa_sesje', 'Rozpocznij nową sesję →')}</Text>
                    </Pressable>
                  </View>
                )}
                <MysticalInput
                  value={question}
                  onChangeText={setQuestion}
                  placeholder={t('dowsingRods.zadaj_pytanie_na_ktore_mozna', 'Zadaj pytanie, na które można odpowiedzieć TAK lub NIE...')}
                  placeholderTextColor={ACCENT + '55'}
                  multiline
                  numberOfLines={3}
                  editable={!answered && !limitReached}
                  onFocusScroll={() => focusIntoView(340)}
                  textAlignVertical="top"
                  style={{ color: textColor, minHeight: 80, fontSize: 15, lineHeight: 24 }}
                />
                <Pressable
                  onPress={handleAsk}
                  disabled={!question.trim() || answered || limitReached}
                  style={({ pressed }) => [s.askBtn, (!question.trim() || answered || limitReached) && { opacity: 0.45 }, pressed && { opacity: 0.75 }]}
                >
                  <LinearGradient colors={[ACCENT + 'EE', ACCENT + 'BB']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  <Text style={s.askBtnText}>
                    {answered && answerData
                      ? `${answerData.emoji} Odpowiedź: ${answerData.label}`
                      : `Zapytaj ${mode === 'rozdzki' ? 'różdżki' : 'wahadło'}`}
                  </Text>
                </Pressable>
              </Animated.View>
            )}

            {/* ── Answer description ────────────────────────────── */}
            {answered && answerData && (
              <Animated.View entering={FadeInDown.duration(350)} style={[s.answerCard, { backgroundColor: answerData.color + '14', borderColor: answerData.color + '55', marginHorizontal: SP }]}>
                <Text style={[s.answerTitle, { color: answerData.color }]}>{answerData.emoji} {answerData.label}</Text>
                <Text style={[s.answerDesc, { color: subColor }]}>{answerData.desc}</Text>
              </Animated.View>
            )}

            {/* ── Affirmation after reading ─────────────────────── */}
            {currentAffirmation && !answered && (
              <Animated.View entering={FadeInDown.duration(500)} style={[s.affCard, { backgroundColor: ACCENT + '10', borderColor: ACCENT + '44', marginHorizontal: SP }]}>
                <LinearGradient colors={[ACCENT + '1A', 'transparent']} style={StyleSheet.absoluteFill} />
                <Text style={[s.sectionLabel, { color: ACCENT, marginBottom: 8 }]}>{t('dowsingRods.afirmacja_po_sesji', '✦ AFIRMACJA PO SESJI')}</Text>
                <Text style={[s.affText, { color: textColor }]}>"{currentAffirmation}"</Text>
                <Pressable onPress={() => setCurrentAffirmation(null)} style={{ marginTop: 10, alignSelf: 'flex-end' }}>
                  <Text style={{ color: ACCENT + '88', fontSize: 11, fontWeight: '600' }}>{t('dowsingRods.zamknij', 'Zamknij')}</Text>
                </Pressable>
              </Animated.View>
            )}

            {/* ── Session stats ─────────────────────────────────── */}
            {stats && (
              <Animated.View entering={FadeInDown.duration(400)} style={[s.statsCard, { backgroundColor: cardBg, borderColor: cardBorder, marginHorizontal: SP }]}>
                <Text style={[s.sectionLabel, { color: ACCENT, marginBottom: 10 }]}>{t('dowsingRods.statystyki_sesji', 'STATYSTYKI SESJI')}</Text>
                <View style={s.statsRow}>
                  {[
                    { label: 'Pytania', val: stats.total },
                    { label: 'TAK', val: stats.yes, color: ACCENT },
                    { label: 'NIE', val: stats.no, color: '#EF4444' },
                    { label: 'MOŻE', val: stats.maybe, color: '#A78BFA' },
                  ].map((st, i) => (
                    <View key={st.label} style={[s.statItem, i > 0 && { borderLeftWidth: 1, borderLeftColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.08)' }]}>
                      <Text style={[s.statVal, { color: st.color || textColor }]}>{st.val}</Text>
                      <Text style={[s.statLabel, { color: subColor }]}>{st.label}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* ── Response type guide ───────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(230).duration(460)} style={[s.responseGuide, { backgroundColor: cardBg, borderColor: ACCENT + '33', marginHorizontal: SP }]}>
              <Text style={[s.sectionLabel, { color: ACCENT, marginBottom: 10 }]}>{t('dowsingRods.znaczenie_odpowiedzi', 'ZNACZENIE ODPOWIEDZI')}</Text>
              {Object.values(ANSWER_TYPES).map((at) => (
                <View key={at.label} style={[s.responseRow, { borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.06)' }]}>
                  <View style={[s.responseBadge, { backgroundColor: at.color + '22' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: at.color, letterSpacing: 0.5 }}>{at.label}</Text>
                  </View>
                  <Text style={[s.responseDesc, { color: subColor }]} numberOfLines={2}>{at.desc}</Text>
                </View>
              ))}
            </Animated.View>

            {/* ── Info card ─────────────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(300).duration(480)} style={[s.infoCard, { borderColor: ACCENT + '44', backgroundColor: cardBg, marginHorizontal: SP }]}>
              <LinearGradient colors={[ACCENT + '14', 'transparent']} style={StyleSheet.absoluteFill} />
              <LinearGradient
                colors={['transparent', ACCENT + '77', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1 }}
                pointerEvents="none"
              />
              <Text style={[s.sectionLabel, { color: ACCENT }]}>{t('dowsingRods.jak_to_dziala', 'JAK TO DZIAŁA')}</Text>
              <Text style={[s.infoBody, { color: subColor }]}>
                Radiestezja to starożytna sztuka wyszukiwania odpowiedzi przez rezonans energetyczny. Różdżki reagują na subtelne pola energetyczne i podświadome sygnały — TAK gdy zbiegają się do środka, NIE gdy rozchodzą na zewnątrz.{'\n\n'}
                Wahadło oscyluje w przód i w tył dla TAK, w lewo i prawo dla NIE, zatacza okrąg dla MOŻE, pozostaje nieruchome gdy pytanie wymaga ponowienia. Każdy instrument działa przez Twój własny system intuicji jako antena.
              </Text>
            </Animated.View>

            {/* ── Tips toggle ───────────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(320).duration(450)} style={{ marginHorizontal: SP, marginBottom: 8 }}>
              <Pressable
                onPress={() => setShowTips(!showTips)}
                style={[s.tipsToggle, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}
              >
                <Info size={15} color={ACCENT} />
                <Text style={[s.tipsToggleText, { color: ACCENT }]}>{t('dowsingRods.jak_formulowac_pytania', 'Jak formułować pytania')}</Text>
                <Text style={{ color: ACCENT, fontSize: 14 }}>{showTips ? '▲' : '▼'}</Text>
              </Pressable>
              {showTips && (
                <Animated.View entering={FadeInDown.duration(300)}>
                  {QUESTION_TIPS.map((tip, i) => (
                    <View key={i} style={[s.tipRow, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                      <Text style={{ fontSize: 18, width: 28 }}>{tip.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.tipTitle, { color: textColor }]}>{tip.title}</Text>
                        <Text style={[s.tipBody, { color: subColor }]}>{tip.body}</Text>
                      </View>
                    </View>
                  ))}
                </Animated.View>
              )}
            </Animated.View>

            {/* ── Practical tips ────────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(340).duration(450)} style={[s.pendulumCard, { backgroundColor: cardBg, borderColor: ACCENT + '33', marginHorizontal: SP }]}>
              <Text style={[s.sectionLabel, { color: ACCENT }]}>{t('dowsingRods.wskazowki_praktyczne', 'WSKAZÓWKI PRAKTYCZNE')}</Text>
              {PENDULUM_TIPS.map((tip, i) => (
                <View key={i} style={s.pendulumTipRow}>
                  <View style={[s.pendulumDot, { backgroundColor: ACCENT + '44' }]} />
                  <Text style={[s.pendulumTip, { color: subColor }]}>{tip}</Text>
                </View>
              ))}
            </Animated.View>

            {/* ── Crystal Pendulum Guide ────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(360).duration(460)} style={{ marginHorizontal: SP, marginBottom: 14 }}>
              <Pressable
                onPress={() => setShowCrystals(!showCrystals)}
                style={[s.sectionToggleRow, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}
              >
                <Gem size={15} color={ACCENT} />
                <Text style={[s.sectionToggleLabel, { color: ACCENT }]}>{t('dowsingRods.przewodnik_po_krysztalac_wahadla', 'Przewodnik po kryształach wahadła')}</Text>
                {showCrystals ? <ChevronUp size={15} color={ACCENT} /> : <ChevronDown size={15} color={ACCENT} />}
              </Pressable>
              {showCrystals && (
                <Animated.View entering={FadeInDown.duration(350)} style={{ marginTop: 10, gap: 8 }}>
                  {CRYSTALS.map((crystal, i) => (
                    <Pressable
                      key={i}
                      onPress={() => { setSelectedCrystal(selectedCrystal === i ? null : i); HapticsService.impact('light'); }}
                      style={[s.crystalRow, {
                        backgroundColor: selectedCrystal === i ? crystal.color + '22' : cardBg,
                        borderColor: selectedCrystal === i ? crystal.color + '88' : ACCENT + '22',
                      }]}
                    >
                      <Text style={{ fontSize: 20, width: 32 }}>{crystal.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.crystalName, { color: textColor }]}>{crystal.name}</Text>
                        <Text style={[s.crystalStrength, { color: ACCENT }]}>{crystal.strength}</Text>
                        {selectedCrystal === i && (
                          <Animated.View entering={FadeIn.duration(250)}>
                            <Text style={[s.crystalDesc, { color: subColor }]}>{crystal.desc}</Text>
                          </Animated.View>
                        )}
                      </View>
                      <View style={[s.crystalColorDot, { backgroundColor: crystal.color }]} />
                    </Pressable>
                  ))}
                </Animated.View>
              )}
            </Animated.View>

            {/* ── Reading History ───────────────────────────────── */}
            {history.length > 0 && (
              <Animated.View entering={FadeInDown.delay(400).duration(480)} style={[s.historySection, { marginHorizontal: SP }]}>
                <Pressable
                  onPress={() => setShowHistory(!showHistory)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}
                >
                  <Text style={[s.sectionLabel, { color: ACCENT, marginBottom: 0 }]}>HISTORIA PYTAŃ ({history.length})</Text>
                  {showHistory ? <ChevronUp size={13} color={ACCENT} /> : <ChevronDown size={13} color={ACCENT} />}
                </Pressable>
                {showHistory && history.map((item, i) => {
                  const ad = ANSWER_TYPES[item.ak];
                  const cat = QUESTION_CATEGORIES.find(c => c.id === item.category);
                  return (
                    <Animated.View key={i} entering={FadeInUp.delay(i * 40).duration(360)}>
                      <View style={[s.historyItem, { borderColor: ad.color + '55', backgroundColor: cardBg }]}>
                        <LinearGradient colors={[ad.color + '14', 'transparent']} style={StyleSheet.absoluteFill} />
                        <View style={[s.historyBadge, { backgroundColor: ad.color + '28' }]}>
                          <Text style={[s.historyBadgeText, { color: ad.color }]}>{ad.emoji}</Text>
                          <Text style={[{ fontSize: 8, color: ad.color, fontWeight: '800', letterSpacing: 0.4 }]}>{ad.label}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.historyQ, { color: textColor }]} numberOfLines={2}>{item.q}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                            <Text style={[s.historyTs, { color: subColor }]}>{item.date} · {item.ts}</Text>
                            {cat && <Text style={{ fontSize: 10, color: cat.color }}>{cat.label}</Text>}
                          </View>
                          {/* Note */}
                          {editingNoteIdx === i ? (
                            <View style={{ marginTop: 6 }}>
                              <TextInput
                                value={noteInput}
                                onChangeText={setNoteInput}
                                placeholder={t('dowsingRods.twoja_notatka_o_trafnosci', 'Twoja notatka o trafności...')}
                                placeholderTextColor={subColor}
                                style={[s.noteInput, { color: textColor, borderColor: ACCENT + '44', backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)' }]}
                                autoFocus
                              />
                              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                                <Pressable onPress={() => {
                                  setHistory(prev => prev.map((h, idx) => idx === i ? { ...h, note: noteInput } : h));
                                  setEditingNoteIdx(null);
                                  setNoteInput('');
                                }}>
                                  <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '700' }}>{t('dowsingRods.zapisz', 'Zapisz')}</Text>
                                </Pressable>
                                <Pressable onPress={() => { setEditingNoteIdx(null); setNoteInput(''); }}>
                                  <Text style={{ color: subColor, fontSize: 12 }}>{t('dowsingRods.anuluj', 'Anuluj')}</Text>
                                </Pressable>
                              </View>
                            </View>
                          ) : (
                            <Pressable onPress={() => { setEditingNoteIdx(i); setNoteInput(item.note); }}>
                              <Text style={{ color: item.note ? ACCENT + 'CC' : ACCENT + '55', fontSize: 11, marginTop: 4, fontStyle: item.note ? 'normal' : 'italic' }}>
                                {item.note || 'Dodaj notatkę o trafności...'}
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </Animated.View>
            )}

            {/* ── Co dalej? ─────────────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(420).duration(480)} style={{ paddingHorizontal: SP, marginBottom: 6, marginTop: 8 }}>
              <Text style={[s.sectionLabel, { color: ACCENT, marginBottom: 12 }]}>{t('dowsingRods.co_dalej', '✦ CO DALEJ?')}</Text>
              {[
                { icon: Sparkles, label: 'Wyrocznia Aethery', sub: 'Głębsza odpowiedź z wyroczni', color: '#A78BFA', route: 'OraclePortal' },
                { icon: Moon, label: 'Medytacja', sub: 'Wycisz się przed nową sesją', color: '#60A5FA', route: 'Meditation' },
                { icon: BookOpen, label: 'Dziennik refleksji', sub: 'Zapisz odpowiedź i jej znaczenie', color: ACCENT, route: 'JournalEntry', params: { type: 'reflection', prompt: 'Co mówi mi ta odpowiedź i jak mogę ją zintegrować?' } },
                { icon: Zap, label: 'I Ching', sub: 'Głębsza wyrocznia Przemian', color: '#CEAE72', route: 'IChing' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Pressable
                    key={item.route}
                    onPress={() => navigation.navigate(item.route as any, (item as any).params)}
                    style={({ pressed }) => [s.codalej, { backgroundColor: cardBg, borderColor: item.color + '33', opacity: pressed ? 0.75 : 1 }]}
                  >
                    <LinearGradient colors={[item.color + '18', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                    <View style={[s.codaIcon, { backgroundColor: item.color + '18' }]}>
                      <Icon color={item.color} size={17} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.codaLabel, { color: textColor }]}>{item.label}</Text>
                      <Text style={[s.codaSub, { color: subColor }]}>{item.sub}</Text>
                    </View>
                    <ArrowRight color={item.color} size={15} strokeWidth={1.5} />
                  </Pressable>
                );
              })}
            </Animated.View>

            <EndOfContentSpacer size="standard" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Calibration Ritual Modal ──────────────────────────── */}
      <Modal visible={showCalibration} transparent animationType="fade" onRequestClose={() => setShowCalibration(false)}>
        <View style={s.modalOverlay}>
          <Animated.View entering={FadeInDown.duration(350)} style={[s.calibModal, { backgroundColor: isLight ? '#FFFBEE' : '#1A1400', borderColor: ACCENT + '55' }]}>
            <LinearGradient colors={[ACCENT + '18', 'transparent']} style={StyleSheet.absoluteFill} />
            <Text style={[s.calibModalEyebrow, { color: ACCENT }]}>{t('dowsingRods.rytual_kalibracji', 'RYTUAŁ KALIBRACJI')}</Text>
            <Text style={[s.calibModalTitle, { color: textColor }]}>Krok {calibStep + 1} z {CALIBRATION_STEPS.length}</Text>
            {/* Step indicators */}
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
              {CALIBRATION_STEPS.map((_, i) => (
                <View key={i} style={[s.calibStepDot, {
                  backgroundColor: i <= calibStep ? ACCENT : (isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)'),
                  width: i === calibStep ? 24 : 8,
                }]} />
              ))}
            </View>
            <View style={[s.calibStepCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)', borderColor: ACCENT + '33' }]}>
              <Text style={[s.calibStepLabel, { color: ACCENT }]}>{CALIBRATION_STEPS[calibStep].label}</Text>
              <Text style={[s.calibStepInstruction, { color: textColor }]}>{CALIBRATION_STEPS[calibStep].instruction}</Text>
              <Text style={[s.calibStepMotion, { color: subColor }]}>{CALIBRATION_STEPS[calibStep].motion}</Text>
            </View>
            <Pressable
              onPress={advanceCalibStep}
              style={[s.calibNextBtn, { backgroundColor: ACCENT }]}
            >
              <Text style={s.calibNextBtnText}>
                {calibStep < CALIBRATION_STEPS.length - 1 ? 'Następny krok →' : 'Zakończ kalibrację ✓'}
              </Text>
            </Pressable>
            <Pressable onPress={() => setShowCalibration(false)} style={{ marginTop: 10 }}>
              <Text style={{ color: subColor, fontSize: 13, textAlign: 'center' }}>{t('dowsingRods.pomin_kalibracje', 'Pomiń kalibrację')}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingBottom: 10 },
  backBtn: { width: 38, alignItems: 'flex-start' },
  headerEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.5, marginBottom: 2 },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.3 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  modeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 18, borderWidth: 1 },
  modeLabel: { fontSize: 12.5 },
  sectionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: 4 },
  limitBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  limitLabel: { fontSize: 11, flex: 1 },
  limitDot: { width: 12, height: 12, borderRadius: 6 },
  calibrateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 14, borderWidth: 1, paddingVertical: 9 },
  calibrateText: { fontSize: 13, fontWeight: '700' },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  catLabel: { fontSize: 12.5 },
  catQRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  catQText: { flex: 1, fontSize: 12.5, lineHeight: 18 },
  quickQ: { width: 160, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  quickQText: { fontSize: 12.5, lineHeight: 18 },
  energyCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14, overflow: 'hidden' },
  scanBtn: { height: 46, borderRadius: 23, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  scanBtnText: { fontSize: 14, fontWeight: '700', color: '#0A0800' },
  inputSection: { marginBottom: 16 },
  limitWarning: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
  askBtn: { height: 52, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  askBtnText: { fontSize: 15, fontWeight: '700', color: '#0A0800', letterSpacing: 0.3 },
  answerCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14 },
  answerTitle: { fontSize: 17, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  answerDesc: { fontSize: 13, lineHeight: 20 },
  affCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14, overflow: 'hidden' },
  affText: { fontSize: 15, lineHeight: 24, fontStyle: 'italic', fontWeight: '600' },
  statsCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statVal: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 10, letterSpacing: 0.5 },
  responseGuide: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14 },
  responseRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 9, borderBottomWidth: 1 },
  responseBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, minWidth: 64, alignItems: 'center' },
  responseDesc: { flex: 1, fontSize: 12, lineHeight: 18, paddingTop: 2 },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14, overflow: 'hidden' },
  infoBody: { fontSize: 13, lineHeight: 21 },
  tipsToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
  tipsToggleText: { flex: 1, fontSize: 13, fontWeight: '700' },
  tipRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 6 },
  tipTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  tipBody: { fontSize: 12.5, lineHeight: 19 },
  pendulumCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16 },
  pendulumTipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  pendulumDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  pendulumTip: { flex: 1, fontSize: 13, lineHeight: 20 },
  sectionToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  sectionToggleLabel: { flex: 1, fontSize: 13, fontWeight: '700' },
  crystalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, borderWidth: 1, padding: 12 },
  crystalName: { fontSize: 13.5, fontWeight: '700', marginBottom: 2 },
  crystalStrength: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
  crystalDesc: { fontSize: 12.5, lineHeight: 19, marginTop: 6 },
  crystalColorDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  historySection: { marginBottom: 16 },
  historyItem: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8, gap: 12, overflow: 'hidden' },
  historyBadge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 2 },
  historyBadgeText: { fontSize: 18 },
  historyQ: { fontSize: 13, lineHeight: 19 },
  historyTs: { fontSize: 10, opacity: 0.7 },
  noteInput: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12 },
  codalej: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10, overflow: 'hidden' },
  codaIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  codaLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  codaSub: { fontSize: 12, lineHeight: 18 },
  // Calibration modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  calibModal: { width: '100%', borderRadius: 24, borderWidth: 1, padding: 24, overflow: 'hidden', alignItems: 'center' },
  calibModalEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.5, marginBottom: 4 },
  calibModalTitle: { fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },
  calibStepDot: { height: 8, borderRadius: 4 },
  calibStepCard: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  calibStepLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
  calibStepInstruction: { fontSize: 14, lineHeight: 22, marginBottom: 8 },
  calibStepMotion: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  calibNextBtn: { width: '100%', height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  calibNextBtnText: { fontSize: 14, fontWeight: '700', color: '#0A0800' },
});
