// @ts-nocheck
import React, { useMemo, useRef, useState, useCallback } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  View, Text, ScrollView, Pressable, StyleSheet, TextInput,
  Dimensions, Platform, KeyboardAvoidingView,
} from 'react-native';
import { MysticalInput } from '../components/MysticalInput';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, Defs, Ellipse, RadialGradient, Stop, Path, G,
} from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp,
  useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withTiming, Easing,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Gem, Sparkles, Star, Layers3, ArrowRight,
  Eye, BookOpen,
} from 'lucide-react-native';
import { SpeakButton } from '../components/SpeakButton';
import { Typography } from '../components/Typography';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { AiService } from '../core/services/ai.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const CRYSTAL_ACCENT = '#8B5CF6';
const MIRROR_ACCENT = '#C0C4D0';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Mode = 'daily' | 'crystal' | 'mirror';
type FogType = 'white' | 'purple' | 'blue' | 'green';

type VisionCard = {
  title: string;
  symbol: string;
  description: string;
  horizon: 'teraz' | 'wkrótce' | 'w przyszłości';
};

type ReadingSession = {
  id: string;
  date: string;
  question: string;
  answer: string;
  mode: Exclude<Mode, 'daily'>;
  fogType: FogType;
  visions?: VisionCard[];
};

type CrystalProfile = {
  name: string;
  color: string;
  benefit: string;
  properties: string;
  use: string;
  ritual: string;
  affirmation: string;
};

// ─── Static Data ───────────────────────────────────────────────────────────────

const CRYSTALS: CrystalProfile[] = [
  {
    name: 'Ametyst',
    color: '#9B59B6',
    benefit: 'Spokój, intuicja i oczyszczenie przeciążonego umysłu.',
    properties: 'Pomaga wyciszyć chaos, wspiera refleksję i domykanie nadmiaru bodźców.',
    use: 'Połóż obok łóżka, przy medytacji lub podczas wieczornego journalingu.',
    ritual: 'Wieczorem weź trzy spokojne oddechy, trzymaj kamień przy sercu i wypowiedz intencję odpuszczenia napięcia.',
    affirmation: 'Pozwalam, by cisza przywróciła mi jasność.',
  },
  {
    name: 'Różowy kwarc',
    color: '#FF8FAB',
    benefit: 'Miłość własna, miękkość i ukojenie serca.',
    properties: 'Wspiera regulację emocji, czułość wobec siebie i odbudowę zaufania.',
    use: 'Noś przy sobie podczas trudnych rozmów lub momentów, gdy potrzebujesz większej łagodności.',
    ritual: 'Połóż dłoń na klatce piersiowej, przyłóż kryształ i nazwij jedną rzecz, za którą dziś okazujesz sobie czułość.',
    affirmation: 'Mogę być dla siebie miejscem bezpieczeństwa.',
  },
  {
    name: 'Obsydian',
    color: '#3C3C3C',
    benefit: 'Ochrona energetyczna, granice i uziemienie.',
    properties: 'Pomaga odróżnić to, co Twoje, od napięć przejętych z zewnątrz.',
    use: 'Trzymaj przy drzwiach, podczas pracy z ludźmi lub po intensywnym dniu.',
    ritual: 'Wyobraź sobie, że kamień zbiera nadmiar ciężaru. Po praktyce odłóż go przy wejściu jako symbol zamknięcia dnia.',
    affirmation: 'Zostawiam przy sobie tylko to, co naprawdę moje.',
  },
  {
    name: 'Cytryn',
    color: '#F4D03F',
    benefit: 'Energia, obfitość i odważne działanie.',
    properties: 'Wspiera sprawczość, klarowność decyzji i budowanie poczucia wewnętrznej mocy.',
    use: 'Dobrze pracuje w przestrzeni biurka, planowania i pracy nad pieniędzmi.',
    ritual: 'Rano połóż kryształ przy notatniku i zapisz jedną decyzję, która realnie otwiera przepływ.',
    affirmation: 'Wybieram ruch, który zwiększa mój dobrostan i obfitość.',
  },
  {
    name: 'Labradoryt',
    color: '#4A90D9',
    benefit: 'Magia, transformacja i odwaga do wejścia w nowy etap.',
    properties: 'Wspiera przejścia, wewnętrzne przebudzenie i pracę z niepewnością.',
    use: 'Noś przy sobie, gdy wchodzisz w zmianę albo potrzebujesz większego zaufania do procesu.',
    ritual: 'Przed ważnym krokiem przytrzymaj kamień w dłoni i nazwij, co kończysz oraz co świadomie zaczynasz.',
    affirmation: 'Nie muszę znać całej drogi, by zaufać następnemu krokowi.',
  },
  {
    name: 'Lapis lazuli',
    color: '#2C4E8A',
    benefit: 'Prawda, komunikacja i wewnętrzna godność.',
    properties: 'Pomaga mówić jasno, nie tracąc kontaktu z sercem i intuicją.',
    use: 'Dobrze sprawdza się przy rozmowach, prezentacjach i momentach, gdy trzeba nazwać prawdę spokojnie, ale wyraźnie.',
    ritual: 'Przed rozmową połóż kryształ na gardle lub trzymaj w dłoni i wypowiedz jedno zdanie, którego nie chcesz już zmiękczać.',
    affirmation: 'Moje słowa są klarowne, spokojne i prawdziwe.',
  },
];

const CRYSTAL_CHAKRA: Record<string, { chakra: string; color: string; sanskrit: string; affirmation: string }> = {
  'Ametyst': { chakra: 'Korona', color: '#9B59B6', sanskrit: 'Sahasrara', affirmation: 'Jestem połączona z wyższą mądrością.' },
  'Różowy kwarc': { chakra: 'Serce', color: '#FF8FAB', sanskrit: 'Anahata', affirmation: 'Moje serce jest otwarte i bezpieczne.' },
  'Obsydian': { chakra: 'Podstawa', color: '#3C3C3C', sanskrit: 'Muladhara', affirmation: 'Jestem uziemiona i bezpieczna.' },
  'Cytryn': { chakra: 'Splot słoneczny', color: '#F4D03F', sanskrit: 'Manipura', affirmation: 'Jestem pewna siebie i sprawcza.' },
  'Labradoryt': { chakra: 'Trzecie oko', color: '#4A90D9', sanskrit: 'Ajna', affirmation: 'Ufam swojej intuicji.' },
  'Lapis lazuli': { chakra: 'Gardło', color: '#2C4E8A', sanskrit: 'Vishuddha', affirmation: 'Mówię swoją prawdę.' },
};

const CLEANSING_METHODS = [
  { emoji: '🌊', label: 'Woda' },
  { emoji: '🌙', label: 'Księżycowe światło' },
  { emoji: '🌿', label: 'Dym z szałwii' },
  { emoji: '🔔', label: 'Dźwięk misy' },
];

const CLEANSING_TEXTS = [
  'Trzymaj kryształ pod bieżącą wodą przez 30 sekund, wizualizując odpływ wszelkich nagromadzonych energii. Uwaga: nie wszystkie kryształy nadają się do kontaktu z wodą.',
  'Połóż kryształ na parapecie lub na dworze podczas pełni lub nowiu księżyca. Zostaw na całą noc. To delikatna i bezpieczna metoda dla wszystkich kamieni.',
  'Przeprowadź kryształ przez dym z płonącej szałwii lub palo santo przez 20-30 sekund, trzymając wyraźną intencję oczyszczenia.',
  'Ułóż kryształy wokół misy tybetańskiej lub kryształowej i graj przez 2-3 minuty. Wibracje dźwięku skutecznie neutralizują nieharmonijne energie.',
];

const QUESTION_TEMPLATES = [
  'Co teraz nade mną czuwa i chce, żebym to zauważyła?',
  'Jaki wzorzec powtarza się w moim życiu i dlaczego?',
  'Co muszę odpuścić, by zrobić miejsce na nowe?',
  'Dokąd prowadzi mnie ta droga, którą teraz idę?',
  'Co moje serce wie, a czego umysł jeszcze nie przyjął?',
];

const FOG_TYPES: { id: FogType; label: string; color: string; area: string; description: string }[] = [
  { id: 'white',  label: 'Biała mgła',    color: '#C4B5FD', area: 'Duchowość', description: 'Otwiera na wyższe przesłania, nadprzyrodzony wgląd i kontakt z przewodnikami duchowymi.' },
  { id: 'purple', label: 'Fioletowa mgła', color: '#8B5CF6', area: 'Miłość',    description: 'Ujawnia wzorce w relacjach, uczucia i to, czego naprawdę pragniesz od drugiego człowieka.' },
  { id: 'blue',   label: 'Niebieska mgła', color: '#3B82F6', area: 'Kariera',   description: 'Oświetla ścieżkę zawodową, ambicje, blokady sukcesu i kolejne właściwe kroki.' },
  { id: 'green',  label: 'Zielona mgła',   color: '#10B981', area: 'Zdrowie',   description: 'Przynosi informacje o ciele, energii witalnej, procesach uzdrowienia i równowadze.' },
];

const SYMBOL_CATEGORIES = [
  { id: 'water',   emoji: '💧', label: 'Woda',      color: '#3B82F6',
    interpretation: 'Woda symbolizuje emocje i nieświadomość. Spokojne wody oznaczają harmonię wewnętrzną, wzburzone — niesione napięcie wymagające uwagi.' },
  { id: 'fire',    emoji: '🔥', label: 'Ogień',     color: '#EF4444',
    interpretation: 'Ogień to transformacja, pasja i oczyszczenie. Kontrolowany płomień zaprasza do świadomego działania; pożar sugeruje potrzebę radykalnej zmiany.' },
  { id: 'faces',   emoji: '👤', label: 'Twarze',    color: '#F59E0B',
    interpretation: 'Twarze w krysztale są aspektami Twojej psychiki. Nieznana twarz to cień — odrzucona część siebie wołająca o integrację.' },
  { id: 'animals', emoji: '🦅', label: 'Zwierzęta', color: '#10B981',
    interpretation: 'Zwierzęta symbolizują instynktowną mądrość ciała. Ptak — wyższy ogląd. Wilk — siłę grupy. Wąż — transformację i ukrytą wiedzę.' },
  { id: 'colors',  emoji: '🌈', label: 'Kolory',    color: '#8B5CF6',
    interpretation: 'Kolory są bezpośrednim językiem energetycznym. Złoty — mądrość. Czarny — głębia. Biel — nowy początek. Różowy — miłość własna.' },
  { id: 'light',   emoji: '✨', label: 'Światło',   color: '#FCD34D',
    interpretation: 'Światło wskazuje na klarowność i przebudzenie. Snop światła to potwierdzenie pytania, które nosisz, ale jeszcze nie zadałaś na głos.' },
];

const WEEKLY_SCHEDULE = [
  { day: 'Poniedziałek', planet: 'Księżyc', quality: 'Doskonały',    desc: 'Intuicja na szczycie, emocje jako kanał wglądu.',          color: '#C0C4D0', icon: '🌙' },
  { day: 'Wtorek',       planet: 'Mars',    quality: 'Trudny',        desc: 'Energia Mars zaburza wizje — lepiej odczekać.',             color: '#EF4444', icon: '⚔️' },
  { day: 'Środa',        planet: 'Merkury', quality: 'Dobry',         desc: 'Wyraźne obrazy, łatwa interpretacja symboli.',             color: '#3B82F6', icon: '☿' },
  { day: 'Czwartek',     planet: 'Jowisz',  quality: 'Bardzo dobry',  desc: 'Szeroka perspektywa, wizje dotyczące przyszłości.',        color: '#F59E0B', icon: '⚡' },
  { day: 'Piątek',       planet: 'Wenus',   quality: 'Doskonały',     desc: 'Idealny do pytań o miłość, relacje i harmonię.',           color: '#EC4899', icon: '♀' },
  { day: 'Sobota',       planet: 'Saturn',  quality: 'Neutralny',     desc: 'Głęboka praca, ale wymaga cierpliwości i skupienia.',      color: '#9CA3AF', icon: '🪐' },
  { day: 'Niedziela',    planet: 'Słońce',  quality: 'Doskonały',     desc: 'Pytania o przeznaczenie i najwyższy cel życia.',           color: '#FBBF24', icon: '☀️' },
];

const RITUAL_STEPS = [
  { count: null, label: 'Usiądź wygodnie. Zamknij oczy na chwilę.',  sub: 'Poczuj ciężar ciała na podłożu.' },
  { count: 3,    label: 'Trzy powolne oddechy',                       sub: 'Wdech przez nos, wydech przez usta...' },
  { count: 2,    label: 'Dwa oddechy z intencją',                     sub: 'Przy każdym wydechu odpuszczasz myśli...' },
  { count: 1,    label: 'Ostatni oddech przed otwarciem',             sub: 'Jesteś gotowa. Kula jest gotowa.' },
  { count: null, label: 'Otwórz oczy. Patrz w centrum kuli.',         sub: 'Nie szukaj — pozwól, żeby wizja sama przyszła.' },
];

// ─── SVG Abstract Vision Thumbnail ────────────────────────────────────────────

const VisionThumb = ({ color, seed }: { color: string; seed: number }) => {
  const s = seed % 5;
  return (
    <Svg width={54} height={54} viewBox="0 0 54 54">
      <Defs>
        <RadialGradient id={`vg${seed}`} cx="50%" cy="40%" r="55%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.85} />
          <Stop offset="100%" stopColor={color} stopOpacity={0.12} />
        </RadialGradient>
      </Defs>
      <Circle cx={27} cy={27} r={25} fill={`url(#vg${seed})`} />
      {s === 0 && <Path d="M13 27 Q27 10 41 27 Q27 44 13 27" fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.5} />}
      {s === 1 && <Circle cx={27} cy={27} r={9}  fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.5} />}
      {s === 2 && <Path d="M27 12 L38 36 L16 36 Z" fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.5} />}
      {s === 3 && <Path d="M10 27 C10 19 44 19 44 27 C44 35 10 35 10 27" fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.5} />}
      {s === 4 && <><Path d="M18 18 L36 36" stroke="#fff" strokeWidth={1.2} opacity={0.5} /><Path d="M36 18 L18 36" stroke="#fff" strokeWidth={1.2} opacity={0.5} /></>}
      <Ellipse cx={18} cy={16} rx={5} ry={3} fill="#fff" opacity={0.18} />
    </Svg>
  );
};

// ─── Enhanced Crystal Sphere ───────────────────────────────────────────────────

const CrystalSphere = ({ accent }: { accent: string }) => {
  const rot      = useSharedValue(0);
  const glow     = useSharedValue(1);
  const tiltX    = useSharedValue(0);
  const tiltY    = useSharedValue(0);
  const mistRot  = useSharedValue(0);
  const ring1    = useSharedValue(0.9);
  const ring2    = useSharedValue(0.85);
  const p1       = useSharedValue(0);
  const p2       = useSharedValue(0);
  const p3       = useSharedValue(0);

  React.useEffect(() => {
    rot.value     = withRepeat(withTiming(360, { duration: 14000, easing: Easing.linear }), -1, false);
    mistRot.value = withRepeat(withTiming(-360, { duration: 22000, easing: Easing.linear }), -1, false);
    glow.value    = withRepeat(withSequence(withTiming(1.08, { duration: 2200 }), withTiming(0.95, { duration: 2200 })), -1, true);
    ring1.value   = withRepeat(withSequence(withTiming(1.06, { duration: 1800 }), withTiming(0.88, { duration: 1800 })), -1, true);
    ring2.value   = withRepeat(withSequence(withTiming(0.90, { duration: 2400 }), withTiming(1.10, { duration: 2400 })), -1, true);
    p1.value      = withRepeat(withSequence(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 3200 })), -1, false);
    p2.value      = withRepeat(withSequence(withTiming(0, { duration: 1600 }), withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1600 })), -1, false);
    p3.value      = withRepeat(withSequence(withTiming(0, { duration: 2800 }), withTiming(1, { duration: 2400 }), withTiming(0, { duration: 2800 })), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltY.value = Math.max(-35, Math.min(35, e.translationX * 0.18));
      tiltX.value = Math.max(-24, Math.min(24, e.translationY * 0.14));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 800 });
      tiltY.value = withTiming(0, { duration: 800 });
    });

  const outerStyle  = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }],
  }));
  const spinStyle   = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }, { scale: glow.value }] }));
  const mistStyle   = useAnimatedStyle(() => ({ transform: [{ rotate: `${mistRot.value}deg` }] }));
  const ring1Style  = useAnimatedStyle(() => ({ transform: [{ scale: ring1.value }], opacity: interpolate(ring1.value, [0.88, 1.06], [0.14, 0.04]) }));
  const ring2Style  = useAnimatedStyle(() => ({ transform: [{ scale: ring2.value }], opacity: interpolate(ring2.value, [0.90, 1.10], [0.11, 0.03]) }));
  const p1Style     = useAnimatedStyle(() => ({
    opacity: p1.value * 0.7,
    transform: [{ translateX: interpolate(p1.value, [0, 1], [-18, 14]) }, { translateY: interpolate(p1.value, [0, 1], [10, -20]) }],
  }));
  const p2Style     = useAnimatedStyle(() => ({
    opacity: p2.value * 0.6,
    transform: [{ translateX: interpolate(p2.value, [0, 1], [20, -8]) }, { translateY: interpolate(p2.value, [0, 1], [-12, 18]) }],
  }));
  const p3Style     = useAnimatedStyle(() => ({
    opacity: p3.value * 0.5,
    transform: [{ translateX: interpolate(p3.value, [0, 1], [-6, 22]) }, { translateY: interpolate(p3.value, [0, 1], [22, -6]) }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.sphereWrap, outerStyle]}>
        {/* Pulsing outer glow rings */}
        <Animated.View style={[styles.glowRing1, ring1Style, { borderColor: accent + '40' }]} />
        <Animated.View style={[styles.glowRing2, ring2Style, { borderColor: accent + '28' }]} />

        {/* Core sphere with caustic refraction */}
        <Animated.View style={[styles.sphereGlow, spinStyle]}>
          <Svg width={220} height={220} viewBox="0 0 220 220">
            <Defs>
              <RadialGradient id="sphereOuterGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%"   stopColor={accent} stopOpacity={0.42} />
                <Stop offset="72%"  stopColor={accent} stopOpacity={0.12} />
                <Stop offset="100%" stopColor={accent} stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="sphereCore" cx="38%" cy="32%" r="60%">
                <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.28} />
                <Stop offset="40%"  stopColor={accent}  stopOpacity={0.52} />
                <Stop offset="100%" stopColor="#130A2A"  stopOpacity={0.96} />
              </RadialGradient>
              <RadialGradient id="causticLight" cx="60%" cy="62%" r="40%">
                <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.14} />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            {/* Outer ambient glow */}
            <Circle cx={110} cy={110} r={108} fill="url(#sphereOuterGlow)" />
            {/* Core sphere body */}
            <Circle cx={110} cy={110} r={88}  fill="url(#sphereCore)" />
            {/* Caustic light refraction patch */}
            <Ellipse cx={132} cy={138} rx={28} ry={16} fill="url(#causticLight)" />
            {/* Interior mist path — rotated by spinStyle */}
            <Path
              d="M98 100 Q118 80 138 105 Q152 122 130 140 Q108 156 90 138 Q72 118 98 100"
              fill="none" stroke="#FFFFFF" strokeWidth={0.7} opacity={0.09}
            />
            {/* Specular highlights */}
            <Ellipse cx={82} cy={70} rx={18} ry={10} fill="#FFFFFF" opacity={0.12} />
            <Ellipse cx={92} cy={110} rx={34} ry={12} fill={accent}   opacity={0.08} />
            <Ellipse cx={76} cy={64} rx={7}  ry={4}  fill="#FFFFFF" opacity={0.22} />
          </Svg>
        </Animated.View>

        {/* Counter-rotating inner mist */}
        <Animated.View style={[styles.mistLayer, mistStyle]}>
          <Svg width={160} height={160} viewBox="0 0 160 160">
            <Defs>
              <RadialGradient id="mistFill" cx="50%" cy="50%" r="50%">
                <Stop offset="0%"   stopColor={accent} stopOpacity={0.24} />
                <Stop offset="60%"  stopColor={accent} stopOpacity={0.10} />
                <Stop offset="100%" stopColor={accent} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Path
              d="M30 80 Q50 40 80 60 Q110 80 90 110 Q70 140 40 120 Q10 100 30 80"
              fill="url(#mistFill)" opacity={0.7}
            />
            <Path
              d="M90 30 Q130 50 120 90 Q110 130 70 120 Q30 110 40 70 Q50 30 90 30"
              fill={accent} opacity={0.06}
            />
          </Svg>
        </Animated.View>

        {/* Floating particles */}
        <Animated.View style={[styles.particle, p1Style, { backgroundColor: accent }]} />
        <Animated.View style={[styles.particle, p2Style, { backgroundColor: '#FFFFFF' }]} />
        <Animated.View style={[styles.particleLg, p3Style, { backgroundColor: accent }]} />
      </Animated.View>
    </GestureDetector>
  );
};

// ─── Scrying Ritual Component ──────────────────────────────────────────────────

const ScryingRitual = ({
  accent, textColor, subColor, cardBg, borderColor, onComplete,
}: {
  accent: string; textColor: string; subColor: string;
  cardBg: string; borderColor: string; onComplete: () => void;
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const fade = useSharedValue(0);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  const startRitual = () => {
    setRunning(true);
    setStep(0);
    fade.value = withTiming(1, { duration: 600 });
  };

  const nextStep = () => {
    if (step < RITUAL_STEPS.length - 1) {
      fade.value = 0;
      setTimeout(() => {
        setStep(s => s + 1);
        fade.value = withTiming(1, { duration: 500 });
      }, 140);
    } else {
      setRunning(false);
      setStep(-1);
      onComplete();
    }
  };

  if (!running) {
    return (
      <View style={[styles.ritualCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : accent + '0E', borderColor: 'transparent' }]}>
        <LinearGradient colors={[accent + '12', 'transparent']} style={StyleSheet.absoluteFill} />
        <Eye color={accent} size={22} strokeWidth={1.6} />
        <Text style={[styles.ritualTitle, { color: textColor }]}>{t('crystalBall.rytual_wchodzenia_w_trans', 'Rytuał wchodzenia w trans')}</Text>
        <Text style={[styles.ritualSub, { color: subColor }]}>
          {t('crystalBall.przed_zapytaniem_kuli_zaleca_sie', 'Przed zapytaniem kuli zaleca się krótki rytuał skupienia. Wycisza umysł i otwiera kanał wizji.')}
        </Text>
        <Pressable onPress={startRitual} style={[styles.ritualBtn, { borderColor: 'transparent', backgroundColor: accent + '22' }]}>
          <Text style={[styles.ritualBtnText, { color: accent }]}>{t('crystalBall.wejdz_w_trans_3_2', 'Wejdź w trans — 3·2·1')}</Text>
        </Pressable>
      </View>
    );
  }

  const current = RITUAL_STEPS[step];
  return (
    <View style={[styles.ritualCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : accent + '12', borderColor: 'transparent' }]}>
      <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFill} />
      <Text style={[styles.ritualStepNum, { color: accent }]}>{step + 1} / {RITUAL_STEPS.length}</Text>
      <Animated.View style={[{ alignItems: 'center' }, fadeStyle]}>
        {current.count !== null ? (
          <Text style={[styles.ritualCountdown, { color: accent }]}>{current.count}</Text>
        ) : null}
        <Text style={[styles.ritualStepLabel, { color: textColor }]}>{current.label}</Text>
        <Text style={[styles.ritualStepSub, { color: subColor }]}>{current.sub}</Text>
      </Animated.View>
      <Pressable onPress={nextStep} style={[styles.ritualBtn, { borderColor: 'transparent', backgroundColor: accent + '22', marginTop: 20 }]}>
        <Text style={[styles.ritualBtnText, { color: accent }]}>
          {step < RITUAL_STEPS.length - 1 ? t('crystalBall.dalej_arrow', 'Dalej →') : t('crystalBall.gotowa_otworz', 'Gotowa — otwórz wizję')}
        </Text>
      </Pressable>
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────

export const CrystalBallScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const userData = useAppStore(s => s.userData);
  const {currentTheme, isLight} = useTheme();
  const theme = currentTheme;
  const textColor  = isLight ? '#1A1410' : '#F5F1EA';
  const subColor   = isLight ? '#6A5A48' : '#B0A393';
  const cardBg     = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const borderColor = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)';

  const initialMode = route?.params?.mode as Mode | undefined;
  const [mode, setMode] = useState<Mode>(
    initialMode === 'daily' || initialMode === 'crystal' || initialMode === 'mirror' ? initialMode : 'daily',
  );

  // Oracle state
  const [question, setQuestion]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [sessions, setSessions]         = useState<ReadingSession[]>([]);
  const [visions, setVisions]           = useState<VisionCard[]>([]);
  const [selectedFog, setSelectedFog]   = useState<FogType>('purple');
  const [ritualDone, setRitualDone]     = useState(false);
  const [showHistory, setShowHistory]   = useState(false);
  const [cleansingMethod, setCleansingMethod] = useState(0);

  // Symbol interpreter state
  const [selectedSymbol, setSelectedSymbol]         = useState<string | null>(null);
  const [symbolNote, setSymbolNote]                 = useState('');
  const [symbolInterp, setSymbolInterp]             = useState('');
  const [loadingSymbol, setLoadingSymbol]           = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const [oracleAnchorY, setOracleAnchorY] = useState(0);

  const isFav = isFavoriteItem('crystal-ball');

  // ── Derived ──────────────────────────────────────────────────────────────────

  const daySeed = useMemo(() => {
    const now = new Date();
    return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  }, []);

  const crystal   = CRYSTALS[daySeed % CRYSTALS.length];
  const fogMeta   = FOG_TYPES.find(f => f.id === selectedFog) ?? FOG_TYPES[1];
  const accent    = mode === 'mirror' ? MIRROR_ACCENT : CRYSTAL_ACCENT;

  const todayDow      = new Date().getDay();               // 0=Sun
  const scheduleIdx   = todayDow === 0 ? 6 : todayDow - 1;
  const todaySchedule = WEEKLY_SCHEDULE[scheduleIdx];

  const modeMeta = useMemo(() => {
    if (mode === 'daily') return {
      eyebrow: 'LUKSUSOWA PRAKTYKA DNIA',
      title:   'Pracuj z jednym kamieniem, ale wejdź w niego głębiej niż w zwykły cytat.',
      copy:    'Tutaj kryształ nie jest ozdobą. To prowadząca jakość dnia: właściwości, sposób użycia, mini-rytuał i afirmacja do integracji.',
    };
    if (mode === 'crystal') return {
      eyebrow: 'KONSULTACJA WYROCZNI',
      title:   'Zadaj jedno pytanie i otrzymaj czytelny odczyt przez symbol, wizję i praktyczny ruch.',
      copy:    'To nie jest szybka odpowiedź. To spokojna interpretacja, która ma zostawić ślad i zbudować pamięć Twoich odczytów.',
    };
    return {
      eyebrow: 'ZWIERCIADŁO DUSZY',
      title:   'Wejdź pod powierzchnię sprawy i zobacz, jaki wzorzec naprawdę prosi dziś o uwagę.',
      copy:    'Tryb zwierciadła działa najlepiej wtedy, gdy nie pytasz o wszystko, tylko o to, co najbardziej wraca i nie daje spokoju.',
    };
  }, [mode]);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const focusIntoView = (offset = 0) => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(oracleAnchorY + offset - 140, 0), animated: true }), 180);
  };

  const buildPrompt = (q: string): string => {
    const area = fogMeta.area;
    const name = userData?.name ?? 'poszukiwacz';
    if (mode === 'crystal') {
      return i18n.language?.startsWith('en') ? `You are an ancient crystal oracle. Area of the question: ${area}. Name of the seeker: ${name}.

Answer in 3 parts, each starting with an UPPERCASE heading:

VISION: Describe the images in the crystal poetically — colours, motion, symbols. 3-4 sentences.

SYMBOL: One key symbol and its mystical meaning for this person. 2-3 sentences.

GUIDANCE: One concrete practical step to take within the next 3 days. 2-3 sentences.

Question: ${q}

Write in English, poetic yet clear.` : `Jesteś starożytną wyrocznią kryształowej kuli. Obszar pytania: ${area}. Imię pytającego: ${name}.

Odpowiedz w 3 częściach (każda zaczyna się nagłówkiem pisanym WIELKIMI LITERAMI):

WIZJA: Opisz poetycko obrazy w kuli — kolory, ruch, symbole. 3–4 zdania.

SYMBOL: Jeden kluczowy symbol i jego mistyczne znaczenie dla tej osoby. 2–3 zdania.

WSKAZÓWKA: Konkretna praktyczna wskazówka — co zrobić w ciągu najbliższych 3 dni. 2–3 zdania.

Pytanie: ${q}

Pisz w języku użytkownika, poetyckim lecz zrozumiałym językiem.`;
    }
    return i18n.language?.startsWith('en') ? `You are the depth of the soul mirror. You reflect what this person still cannot see in themselves. Name: ${name}.

Answer in 3 parts:

REFLECTION: What truly hides beneath this question? Which emotion or pattern lives there? 3-4 sentences.

DEEPER PATTERN: How does this pattern show up more broadly in this person's life and where might it come from? 2-3 sentences.

RETURN QUESTION: Ask one deeper question that opens a new layer of insight. Ask only — do not answer.

Question: ${q}

Write in English.` : `Jesteś głębią zwierciadła duszy. Odbijasz to, czego dana osoba jeszcze nie widzi w sobie. Imię: ${name}.

Odpowiedz w 3 częściach:

ODBICIE: Co naprawdę kryje się pod powierzchnią tego pytania? Jaka emocja lub wzorzec? 3–4 zdania.

GŁĘBSZY WZORZEC: Jak ten wzorzec pojawia się szerzej w życiu tej osoby i skąd mógł pochodzić? 2–3 zdania.

PYTANIE ZWROTNE: Zadaj jedno głębsze pytanie otwierające nowy poziom wglądu. Tylko pytaj — nie odpowiadaj.

Pytanie: ${q}

Pisz w języku użytkownika.`;
  };

  const parseVisions = (answer: string): VisionCard[] => {
    const cards: VisionCard[] = [];
    const viz   = answer.match(/WIZJA[:\s]+([\s\S]*?)(?=SYMBOL|ODBICIE|$)/i);
    const sym   = answer.match(/SYMBOL[:\s]+([\s\S]*?)(?=WSKAZÓWKA|GŁĘBSZY|$)/i);
    const wsк   = answer.match(/WSKAZÓWKA[:\s]+([\s\S]*?)$/i);
    const odb   = answer.match(/ODBICIE[:\s]+([\s\S]*?)(?=GŁĘBSZY|$)/i);
    const glb   = answer.match(/GŁĘBSZY WZORZEC[:\s]+([\s\S]*?)(?=PYTANIE|$)/i);
    const pyt   = answer.match(/PYTANIE ZWROTNE[:\s]+([\s\S]*?)$/i);

    if (viz) cards.push({ title: 'Wizja',    symbol: '🔮', description: viz[1].trim(),   horizon: 'teraz' });
    if (sym) cards.push({ title: 'Symbol',   symbol: '✦',  description: sym[1].trim(),   horizon: 'wkrótce' });
    if (wsк) cards.push({ title: 'Wskazówka', symbol: '🌟', description: wsк[1].trim(),  horizon: 'w przyszłości' });
    if (odb) cards.push({ title: 'Odbicie',  symbol: '🪞', description: odb[1].trim(),   horizon: 'teraz' });
    if (glb) cards.push({ title: 'Wzorzec',  symbol: '🌀', description: glb[1].trim(),   horizon: 'wkrótce' });
    if (pyt) cards.push({ title: 'Pytanie zwrotne', symbol: '❓', description: pyt[1].trim(), horizon: 'w przyszłości' });
    return cards;
  };

  const askOracle = async () => {
    if (!question.trim() || loading || mode === 'daily') return;
    const q = question.trim();
    setQuestion('');
    setLoading(true);
    setVisions([]);
    try {
      const answer = await AiService.chatWithOracle([{ role: 'user', content: buildPrompt(q) }]);
      const parsedVisions = parseVisions(answer);
      setVisions(parsedVisions);
      setSessions(prev => [{
        id: `${Date.now()}`,
        date: new Date().toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'long', year: 'numeric' }),
        question: q, answer, mode: mode as Exclude<Mode, 'daily'>,
        fogType: selectedFog, visions: parsedVisions,
      }, ...prev].slice(0, 10));
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 400);
    } catch {
      setSessions(prev => [{
        id: `${Date.now()}`,
        date: new Date().toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'long' }),
        question: q, answer: t('crystalBall.przestrzen_wyroczni', 'Przestrzeń wyroczni jest teraz cicha. Spróbuj ponownie za chwilę.'),
        mode: mode as Exclude<Mode, 'daily'>, fogType: selectedFog,
      }, ...prev].slice(0, 10));
    } finally {
      setLoading(false);
    }
  };

  const interpretSymbol = async () => {
    const cat = SYMBOL_CATEGORIES.find(s => s.id === selectedSymbol);
    if (!cat) return;
    if (symbolNote.trim().length < 3) { setSymbolInterp(cat.interpretation); return; }
    setLoadingSymbol(true);
    try {
      const prompt = `Jesteś mistycznym interpretatorem symboli wizji. Użytkownik widzi: ${cat.label}. Jego notatka: "${symbolNote}". Podaj osobistą interpretację w 3–4 zdaniach w języku użytkownika.`;
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setSymbolInterp(result);
    } catch {
      setSymbolInterp(cat.interpretation);
    } finally {
      setLoadingSymbol(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────────

  const renderVisionCards = () => {
    if (visions.length === 0) return null;
    return (
      <>
        <Animated.View entering={FadeInDown.duration(380)}>
          <Text style={[styles.sectionLabel, { color: accent, marginBottom: 10, marginTop: 4 }]}>
            {t('crystalBall.wizje_z_krysztalu', '✦ WIZJE Z KRYSZTAŁU')}
          </Text>
        </Animated.View>
        {visions.map((v, idx) => {
          const hColor = v.horizon === 'teraz' ? accent : v.horizon === 'wkrótce' ? '#F59E0B' : '#10B981';
          return (
            <Animated.View key={idx} entering={FadeInUp.delay(idx * 80).duration(500)}>
              <View style={[styles.visionCard, { borderColor: 'transparent', backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : hColor + '10' }]}>
                <LinearGradient colors={[hColor + '12', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={styles.visionHeader}>
                  <VisionThumb color={hColor} seed={daySeed + idx} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.visionHorizonRow}>
                      <View style={[styles.horizonDot, { backgroundColor: hColor }]} />
                      <Text style={[styles.horizonLabel, { color: hColor }]}>{v.horizon.toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.visionTitle, { color: textColor }]}>{v.title}</Text>
                  </View>
                </View>
                <Text style={[styles.visionDesc, { color: textColor }]}>{v.description}</Text>
              </View>
            </Animated.View>
          );
        })}
      </>
    );
  };

  const renderFogSelector = () => (
    <Animated.View entering={FadeInDown.delay(60).duration(500)}>
      <View style={[styles.fogSection, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)', borderColor: 'transparent' }]}>
        <Text style={[styles.sectionLabel, { color: accent }]}>{t('crystalBall.rodzaj_mgly_obszar_pytania', '🌫️ RODZAJ MGŁY — OBSZAR PYTANIA')}</Text>
        <Text style={[styles.sectionBody, { color: subColor, marginBottom: 12 }]}>
          {t('crystalBall.kolor_mgly_wyznacza_przestrzen_odcz', 'Kolor mgły wyznacza przestrzeń odczytu. Wybierz obszar, który dotyczy Twojego pytania.')}
        </Text>
        {FOG_TYPES.map(fog => {
          const active = selectedFog === fog.id;
          return (
            <Pressable
              key={fog.id}
              onPress={() => setSelectedFog(fog.id)}
              style={[styles.fogRow, { borderColor: 'transparent', backgroundColor: active ? fog.color + '16' : (isLight ? 'rgba(240,228,210,0.90)' : 'rgba(255,255,255,0.04)') }]}
            >
              <View style={[styles.fogDot, { backgroundColor: fog.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fogLabel, { color: active ? fog.color : textColor }]}>{fog.label}</Text>
                <Text style={[styles.fogAreaLabel, { color: active ? fog.color + 'CC' : subColor }]}>{fog.area}</Text>
              </View>
              {active ? <View style={[styles.fogActiveDot, { backgroundColor: fog.color }]} /> : null}
            </Pressable>
          );
        })}
        <Text style={[styles.fogDesc, { color: subColor }]}>{fogMeta.description}</Text>
      </View>
    </Animated.View>
  );

  const renderSymbolInterpreter = () => (
    <Animated.View entering={FadeInDown.delay(180).duration(500)}>
      <View style={[styles.symbolSection, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)', borderColor: 'transparent' }]}>
        <Text style={[styles.sectionLabel, { color: accent }]}>{t('crystalBall.co_widzisz_w_kuli', '🪄 CO WIDZISZ W KULI?')}</Text>
        <Text style={[styles.sectionBody, { color: subColor, marginBottom: 12 }]}>
          {t('crystalBall.wskaz_symbole_ktore_dostrzegas_moze', 'Wskaż symbole, które dostrzegasz. Możesz dodać notatkę i uzyskać osobistą interpretację.')}
        </Text>
        <View style={styles.symbolGrid}>
          {SYMBOL_CATEGORIES.map(cat => {
            const active = selectedSymbol === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  setSelectedSymbol(active ? null : cat.id);
                  setSymbolInterp('');
                  setSymbolNote('');
                }}
                style={[styles.symbolChip, { borderColor: 'transparent', backgroundColor: active ? cat.color + '20' : (isLight ? 'rgba(255,248,234,0.92)' : 'rgba(255,255,255,0.06)') }]}
              >
                <Text style={styles.symbolEmoji}>{cat.emoji}</Text>
                <Text style={[styles.symbolLabel, { color: active ? cat.color : subColor }]}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {selectedSymbol ? (
          <Animated.View entering={FadeInDown.duration(360)}>
            <View style={[styles.symbolDetail, { borderColor: 'transparent', backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)' }]}>
              <TextInput
                value={symbolNote}
                onChangeText={setSymbolNote}
                placeholder={t('crystalBall.opisz_co_dokladnie_widzisz_opcjonal', 'Opisz, co dokładnie widzisz... (opcjonalnie)')}
                placeholderTextColor={subColor}
                multiline
                style={[styles.symbolInput, { color: textColor, borderColor: 'transparent', backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.07)' }]}
              />
              <Pressable
                onPress={interpretSymbol}
                disabled={loadingSymbol}
                style={[styles.symbolBtn, {
                  borderColor: 'transparent',
                  backgroundColor: (SYMBOL_CATEGORIES.find(s => s.id === selectedSymbol)?.color ?? accent) + '22',
                }]}
              >
                <Text style={[styles.symbolBtnText, { color: SYMBOL_CATEGORIES.find(s => s.id === selectedSymbol)?.color ?? accent }]}>
                  {loadingSymbol ? t('crystalBall.interpretuje', 'Interpretuję...') : t('crystalBall.zinterpretuj_symbol', 'Zinterpretuj symbol')}
                </Text>
              </Pressable>
              <Text style={[styles.symbolInterpText, { color: symbolInterp ? textColor : subColor, fontStyle: symbolInterp ? 'normal' : 'italic' }]}>
                {symbolInterp || (SYMBOL_CATEGORIES.find(s => s.id === selectedSymbol)?.interpretation ?? '')}
              </Text>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );

  const renderHistory = () => {
    if (sessions.length === 0) return null;
    return (
      <Animated.View entering={FadeInDown.delay(140).duration(500)}>
        <Pressable onPress={() => setShowHistory(v => !v)} style={[styles.historyToggle, { borderColor: isLight ? 'rgba(139,100,42,0.45)' : 'rgba(255,255,255,0.06)' }]}>
          <BookOpen color={accent} size={16} strokeWidth={1.8} />
          <Text style={[styles.historyToggleText, { color: textColor }]}>{t('crystalBall.historia_odczytow', 'Historia odczytów')} ({sessions.length})</Text>
          <ChevronLeft color={subColor} size={16} style={{ transform: [{ rotate: showHistory ? '90deg' : '-90deg' }] }} />
        </Pressable>
        {showHistory ? sessions.map((s, i) => {
          const ia = s.mode === 'mirror' ? MIRROR_ACCENT : CRYSTAL_ACCENT;
          const fc = FOG_TYPES.find(f => f.id === s.fogType)?.color ?? ia;
          return (
            <Animated.View key={s.id} entering={FadeInUp.delay(i * 50).duration(400)}>
              <View style={[styles.historyCard, { borderColor: 'transparent', backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : ia + '0E' }]}>
                <LinearGradient colors={[ia + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={styles.historyMeta}>
                  <View style={[styles.historyFogDot, { backgroundColor: fc }]} />
                  <Text style={[styles.historyDate, { color: subColor, flex: 1 }]}>{s.date}</Text>
                  <Text style={[styles.historyMode, { color: ia }]}>{s.mode === 'mirror' ? t('crystalBall.zwierciadlo', 'Zwierciadło') : t('crystalBall.wyrocznia', 'Wyrocznia')}</Text>
                </View>
                <Text style={[styles.historyQuestion, { color: textColor }]} numberOfLines={2}>{s.question}</Text>
                <Text style={[styles.historyAnswer, { color: subColor }]} numberOfLines={4}>{s.answer}</Text>
              </View>
            </Animated.View>
          );
        }) : null}
      </Animated.View>
    );
  };

  const renderWeeklySchedule = () => (
    <Animated.View entering={FadeInDown.delay(220).duration(500)}>
      <View style={[styles.scheduleSection, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)', borderColor: 'transparent' }]}>
        <Text style={[styles.sectionLabel, { color: accent }]}>{t('crystalBall.harmonogra_tygodniowy', '📅 HARMONOGRAM TYGODNIOWY')}</Text>
        <Text style={[styles.sectionBody, { color: subColor, marginBottom: 14 }]}>
          {t('crystalBall.kazdy_dzien_tygodnia_rzadzi_inna', 'Każdy dzień tygodnia rządzi inna planeta, wpływając na jakość i głębię wizji kryształowej.')}
        </Text>
        {WEEKLY_SCHEDULE.map((day, idx) => {
          const isToday = idx === scheduleIdx;
          return (
            <View
              key={day.day}
              style={[styles.scheduleRow, {
                borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.05)',
                backgroundColor: isToday ? day.color + '10' : 'transparent',
              }]}
            >
              <Text style={styles.scheduleIcon}>{day.icon}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.scheduleDayRow}>
                  <Text style={[styles.scheduleDay, { color: isToday ? day.color : textColor, fontWeight: isToday ? '700' : '500' }]}>
                    {day.day}{isToday ? ` — ${t('crystalBall.dzis', 'dziś')}` : ''}
                  </Text>
                  <View style={[styles.scheduleQuality, { backgroundColor: day.color + '20', borderColor: 'transparent' }]}>
                    <Text style={[styles.scheduleQualityText, { color: day.color }]}>{day.quality}</Text>
                  </View>
                </View>
                <Text style={[styles.scheduleDesc, { color: subColor }]}>{day.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );

  // ── JSX ───────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isLight ? ['#F8F3FF', '#EFE7FB', '#E7DEF6'] : ['#04020C', '#080314', '#0C051E']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} hitSlop={12}>
            <ChevronLeft color={accent} size={24} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Typography variant="premiumLabel" color={accent}>{t('crystalBall.swiat_krysztalu', 'Świat kryształu')}</Typography>
            <Typography variant="screenTitle" style={{ color: textColor, marginTop: 2 }}>
              {mode === 'daily' ? t('crystalBall.krysztal_dnia', 'Kryształ dnia') : mode === 'crystal' ? t('crystalBall.wyrocznia_krystalu', 'Wyrocznia kryształu') : t('crystalBall.zwierciadlo_duszy', 'Zwierciadło duszy')}
            </Typography>
          </View>
          <Pressable
            onPress={() => { if (isFav) { removeFavoriteItem('crystal-ball'); } else { addFavoriteItem({ id: 'crystal-ball', label: t('crystalBall.krysztal_dnia', 'Kryształ dnia'), route: 'CrystalBall', params: {}, icon: 'Sparkles', color: CRYSTAL_ACCENT, addedAt: new Date().toISOString() }); } }}
            hitSlop={12}
          >
            <Star color={isFav ? CRYSTAL_ACCENT : CRYSTAL_ACCENT + '77'} size={18} fill={isFav ? CRYSTAL_ACCENT : 'none'} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
          keyboardVerticalOffset={insets.top + 56}
        >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') + 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >

          {/* ── Animated crystal ball ───────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(520)}>
            <CrystalSphere accent={accent} />
          </Animated.View>

          {/* ── Today's planetary banner ────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(40).duration(460)}>
            <View style={[styles.scheduleBanner, { backgroundColor: todaySchedule.color + '12', borderColor: todaySchedule.color + '22' }]}>
              <Text style={styles.scheduleBannerIcon}>{todaySchedule.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.scheduleBannerDay, { color: todaySchedule.color }]}>
                  Dziś: {todaySchedule.planet} — {todaySchedule.quality}
                </Text>
                <Text style={[styles.scheduleBannerDesc, { color: subColor }]}>{todaySchedule.desc}</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Mode chips ──────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(70).duration(520)} style={styles.modeRow}>
            {([
              { id: 'daily',   label: t('crystalBall.krysztal_dnia', 'Kryształ dnia') },
              { id: 'crystal', label: 'Wyrocznia' },
              { id: 'mirror',  label: t('crystalBall.zwierciadlo', 'Zwierciadło') },
            ] as { id: Mode; label: string }[]).map(opt => {
              const active = mode === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setMode(opt.id)}
                  style={[styles.modeChip, { borderColor: active ? accent + '55' : 'transparent', backgroundColor: active ? accent + '20' : (isLight ? 'rgba(255,248,234,0.92)' : 'rgba(255,255,255,0.06)') }]}
                >
                  <Text style={[styles.modeChipText, { color: active ? accent : subColor }]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </Animated.View>

          {/* ── Chambers card ───────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(100).duration(520)} style={[styles.chambersCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)', borderColor: 'transparent' }]}>
            <LinearGradient colors={[accent + '16', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
            <Typography variant="premiumLabel" color={accent}>{t('crystalBall.komnaty_krysztalu', 'Komnaty kryształu')}</Typography>
            <View style={styles.chambersGrid}>
              <Pressable onPress={() => setMode('daily')} style={[styles.chamberTile, { borderColor: mode === 'daily' ? accent + '44' : 'transparent', backgroundColor: mode === 'daily' ? accent + '16' : 'transparent' }]}>
                <Gem color={accent} size={18} />
                <Text style={[styles.chamberTitle, { color: textColor }]}>{t('crystalBall.krysztal_dnia', 'Kryształ dnia')}</Text>
                <Text style={[styles.chamberBody, { color: subColor }]}>{t('crystalBall.wlasciwosc_rytual_i_afirmacja_prowa', 'Właściwości, rytuał i afirmacja prowadząca dzień.')}</Text>
              </Pressable>
              <Pressable onPress={() => { setMode('crystal'); focusIntoView(-40); }} style={[styles.chamberTile, { borderColor: mode === 'crystal' ? accent + '44' : 'transparent', backgroundColor: mode === 'crystal' ? accent + '16' : 'transparent' }]}>
                <Sparkles color={accent} size={18} />
                <Text style={[styles.chamberTitle, { color: textColor }]}>{t('crystalBall.wyrocznia_krysztalu', 'Wyrocznia kryształu')}</Text>
                <Text style={[styles.chamberBody, { color: subColor }]}>{t('crystalBall.trojczesci_odczyt_dla_konkretneg_py', 'Trójczęściowy odczyt dla konkretnego pytania.')}</Text>
              </Pressable>
              <Pressable onPress={() => { setMode('mirror'); focusIntoView(-40); }} style={[styles.chamberTile, { borderColor: mode === 'mirror' ? accent + '44' : 'transparent', backgroundColor: mode === 'mirror' ? accent + '16' : 'transparent' }]}>
                <Layers3 color={accent} size={18} />
                <Text style={[styles.chamberTitle, { color: textColor }]}>{t('crystalBall.zwierciadl_duszy', 'Zwierciadło duszy')}</Text>
                <Text style={[styles.chamberBody, { color: subColor }]}>{t('crystalBall.odbicie_wzorzec_i_pytanie_zwrotne', 'Odbicie, wzorzec i pytanie zwrotne.')}</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* ── Mode hero card ───────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(120).duration(520)}>
            <View style={[styles.heroCard, styles.modeHeroCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : accent + '0C', borderColor: 'transparent' }]}>
              <LinearGradient colors={[accent + '14', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <Text style={[styles.cardEyebrow, { color: accent }]}>{modeMeta.eyebrow}</Text>
              <Text style={[styles.modeHeroTitle, { color: textColor }]}>{modeMeta.title}</Text>
              <Text style={[styles.modeHeroCopy, { color: subColor }]}>{modeMeta.copy}</Text>
            </View>
          </Animated.View>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* DAILY MODE                                                     */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {mode === 'daily' ? (
            <>
              <Animated.View entering={FadeInUp.delay(120).duration(520)} onLayout={e => setOracleAnchorY(e.nativeEvent.layout.y)}>
                <View style={[styles.heroCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : crystal.color + '12', borderColor: 'transparent' }]}>
                  <LinearGradient colors={[crystal.color + '16', 'transparent']} style={StyleSheet.absoluteFill} />
                  <Text style={[styles.cardEyebrow, { color: crystal.color }]}>{t('crystalBall.dzis_pracujesz_z_energia', 'DZIŚ PRACUJESZ Z ENERGIĄ')}</Text>
                  <View style={styles.crystalHeroRow}>
                    <View style={[styles.crystalSwatch, { backgroundColor: crystal.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.crystalName, { color: textColor }]}>{crystal.name}</Text>
                      <Text style={[styles.crystalBenefit, { color: subColor }]}>{crystal.benefit}</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(170).duration(520)}>
                <View style={[styles.sectionCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)', borderColor: 'transparent' }]}>
                  <View style={styles.sectionHead}>
                    <Gem color={crystal.color} size={16} strokeWidth={1.8} />
                    <Text style={[styles.sectionLabel, { color: crystal.color }]}>{t('crystalBall.wlasciwosc', '✨ WŁAŚCIWOŚCI')}</Text>
                  </View>
                  <Text style={[styles.sectionBody, { color: textColor }]}>{crystal.properties}</Text>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(220).duration(520)}>
                <View style={styles.dualRow}>
                  <View style={[styles.dualCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)', borderColor: 'transparent' }]}>
                    <Text style={[styles.sectionLabel, { color: crystal.color }]}>{t('crystalBall.jak_uzyc', 'JAK UŻYĆ')}</Text>
                    <Text style={[styles.sectionBody, { color: textColor }]}>{crystal.use}</Text>
                  </View>
                  <View style={[styles.dualCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)', borderColor: 'transparent' }]}>
                    <Text style={[styles.sectionLabel, { color: crystal.color }]}>{t('crystalBall.mini_rytual', 'MINI RYTUAŁ')}</Text>
                    <Text style={[styles.sectionBody, { color: textColor }]}>{crystal.ritual}</Text>
                  </View>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(270).duration(540)}>
                <View style={[styles.sectionCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : crystal.color + '10', borderColor: 'transparent' }]}>
                  <LinearGradient colors={[crystal.color + '14', 'transparent']} style={StyleSheet.absoluteFill} />
                  <Text style={[styles.sectionLabel, { color: crystal.color }]}>{t('crystalBall.afirmacja_krysztalu', 'AFIRMACJA KRYSZTAŁU')}</Text>
                  <View style={styles.speakRow}>
                    <Text style={[styles.quote, { color: textColor }]}>{crystal.affirmation}</Text>
                    <SpeakButton text={crystal.affirmation} compact color={crystal.color} />
                  </View>
                  <Pressable
                    onPress={() => navigation.navigate('JournalEntry', { type: 'reflection', prompt: `Dzisiejszy kryształ to ${crystal.name}. Jakiej jakości energii potrzebuję dziś więcej i jak mogę ją realnie zaprosić do dnia?` })}
                    style={[styles.cta, { borderColor: 'transparent', backgroundColor: crystal.color + '18' }]}
                  >
                    <Text style={[styles.ctaText, { color: crystal.color }]}>{t('crystalBall.zapisz_prace_z_krysztalem', 'Zapisz pracę z kryształem')}</Text>
                    <ArrowRight color={crystal.color} size={14} />
                  </Pressable>
                </View>
              </Animated.View>

              {/* Chakra section */}
              {CRYSTAL_CHAKRA[crystal.name] ? (
                <Animated.View entering={FadeInUp.delay(320).duration(520)}>
                  <View style={[styles.newSection, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : CRYSTAL_CHAKRA[crystal.name].color + '0E', borderColor: 'transparent' }]}>
                    <LinearGradient colors={[CRYSTAL_CHAKRA[crystal.name].color + '14', 'transparent']} style={StyleSheet.absoluteFill} />
                    <Text style={[styles.sectionLabel, { color: CRYSTAL_CHAKRA[crystal.name].color }]}>{t('crystalBall.krysztal_i_chakry', '🌸 KRYSZTAŁ I CHAKRY')}</Text>
                    <View style={styles.chakraRow}>
                      <View style={[styles.chakraDot, { backgroundColor: CRYSTAL_CHAKRA[crystal.name].color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.chakraName, { color: textColor }]}>{CRYSTAL_CHAKRA[crystal.name].chakra}</Text>
                        <Text style={[styles.chakraSanskrit, { color: subColor }]}>{CRYSTAL_CHAKRA[crystal.name].sanskrit}</Text>
                      </View>
                    </View>
                    <Text style={[styles.chakraAffirmation, { color: textColor }]}>{CRYSTAL_CHAKRA[crystal.name].affirmation}</Text>
                  </View>
                </Animated.View>
              ) : null}

              {/* Cleansing section */}
              <Animated.View entering={FadeInUp.delay(340).duration(520)}>
                <View style={[styles.newSection, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)', borderColor: 'transparent' }]}>
                  <Text style={[styles.sectionLabel, { color: accent }]}>{t('crystalBall.oczyszczan_i_programowa', '🔮 OCZYSZCZANIE I PROGRAMOWANIE')}</Text>
                  <Text style={[styles.sectionBody, { color: subColor, marginBottom: 14 }]}>
                    {t('crystalBall.regularne_oczyszczan_pozwala_kryszt', 'Regularne oczyszczanie pozwala kryształowi pracować z pełną mocą. Wybierz metodę bliską Tobie dziś.')}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cleansingChipsRow}>
                    {CLEANSING_METHODS.map((m, idx) => {
                      const active = cleansingMethod === idx;
                      return (
                        <Pressable
                          key={idx}
                          onPress={() => setCleansingMethod(idx)}
                          style={[styles.cleansingChip, { borderColor: 'transparent', backgroundColor: active ? accent + '22' : (isLight ? 'rgba(255,248,234,0.92)' : 'rgba(255,255,255,0.06)') }]}
                        >
                          <Text style={styles.cleansingChipEmoji}>{m.emoji}</Text>
                          <Text style={[styles.cleansingChipLabel, { color: active ? accent : subColor }]}>{m.label}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <Text style={[styles.sectionBody, { color: textColor, marginTop: 12 }]}>{CLEANSING_TEXTS[cleansingMethod]}</Text>
                </View>
              </Animated.View>

              {/* What to do section */}
              <Animated.View entering={FadeInUp.delay(360).duration(520)}>
                <View style={[styles.newSection, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)', borderColor: 'transparent' }]}>
                  <Text style={[styles.sectionLabel, { color: accent }]}>{t('crystalBall.co_dzis_mozesz_zrobic_z', '✦ CO DZIŚ MOŻESZ ZROBIĆ Z TYM KRYSZTAŁEM')}</Text>
                  {[
                    { label: t('crystalBall.medytacja_z_krystalem', 'Medytacja z kryształem'), route: 'Meditation', params: undefined },
                    { label: t('crystalBall.zapisz_intencje', 'Zapisz intencję dnia'), route: 'JournalEntry', params: { type: 'reflection', prompt: `Pracuję dziś z ${crystal.name}. Jaka intencja chce się wyłonić?` } },
                    { label: t('crystalBall.praca_z_cialem', 'Praca z ciałem — Chakry'), route: 'Chakra', params: undefined },
                    { label: t('crystalBall.kapiel_dzwiekowa', 'Kąpiel dźwiękowa'), route: 'SoundBath', params: undefined },
                  ].map((item, idx, arr) => (
                    <Pressable
                      key={item.route}
                      onPress={() => navigation.navigate(item.route, item.params)}
                      style={[styles.codalejRow, { borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.06)', borderBottomWidth: idx < arr.length - 1 ? StyleSheet.hairlineWidth : 0 }]}
                    >
                      <View style={styles.codalejLeft}>
                        <View style={[styles.codalejDot, { backgroundColor: accent }]} />
                        <Text style={[styles.codalejText, { color: textColor }]}>{item.label}</Text>
                      </View>
                      <ArrowRight color={subColor} size={16} />
                    </Pressable>
                  ))}
                </View>
              </Animated.View>

              {/* Weekly schedule */}
              {renderWeeklySchedule()}
            </>
          ) : (
            /* ══════════════════════════════════════════════════════════════ */
            /* CRYSTAL / MIRROR MODE                                          */
            /* ══════════════════════════════════════════════════════════════ */
            <>
              {/* Fog type selector */}
              {renderFogSelector()}

              {/* Scrying ritual */}
              <Animated.View entering={FadeInDown.delay(100).duration(520)}>
                <ScryingRitual
                  accent={accent}
                  textColor={textColor}
                  subColor={subColor}
                  cardBg={cardBg}
                  borderColor={borderColor}
                  onComplete={() => setRitualDone(true)}
                />
              </Animated.View>

              {/* Question input with templates */}
              <Animated.View entering={FadeInUp.delay(120).duration(520)} onLayout={e => setOracleAnchorY(e.nativeEvent.layout.y)}>
                <View style={[styles.sectionCard, { borderColor: 'transparent', overflow: 'hidden', backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : accent + '12', shadowColor: accent, shadowOpacity: 0.18, shadowRadius: 20, elevation: 8 }]}>
                  <LinearGradient colors={[accent + '18', 'transparent'] as const} style={StyleSheet.absoluteFill} />
                  <LinearGradient
                    colors={['transparent', accent + '88', 'transparent'] as [string, string, string]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1 }}
                    pointerEvents="none"
                  />
                  <Text style={[styles.cardEyebrow, { color: accent }]}>
                    {mode === 'crystal' ? t('crystalBall.pytanie_do_krysztalu', 'PYTANIE DO KRYSZTAŁU') : t('crystalBall.pytanie_do_zwierciadla', 'PYTANIE DO ZWIERCIADŁA')}
                  </Text>
                  <Text style={[styles.sectionBody, { color: subColor, marginBottom: 10 }]}>
                    {t('crystalBall.jedno_konkretne_pytanie_o_relacje', 'Jedno konkretne pytanie — o relację, decyzję, lęk, kierunek lub powracający wzorzec.')}
                  </Text>

                  {/* 5 question template chips */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
                    {QUESTION_TEMPLATES.map((tpl, idx) => (
                      <Pressable
                        key={idx}
                        onPress={() => setQuestion(tpl)}
                        style={[styles.tplChip, { borderColor: 'transparent', backgroundColor: accent + '18' }]}
                      >
                        <Text style={[styles.tplChipText, { color: accent }]} numberOfLines={2}>{tpl}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <MysticalInput
                    value={question}
                    onChangeText={setQuestion}
                    placeholder={mode === 'crystal' ? t('crystalBall.zadaj_pytanie', 'Zadaj pytanie kryształowej kuli...') : t('crystalBall.co_zwierciadlo', 'Co zwierciadło pokazuje pod powierzchnią?')}
                    placeholderTextColor={subColor}
                    multiline
                    textAlignVertical="top"
                    onFocusScroll={() => focusIntoView(100)}
                    style={{ color: textColor, minHeight: 90, fontSize: 15, lineHeight: 24 }}
                  />
                  <Pressable
                    onPress={askOracle}
                    disabled={!question.trim() || loading}
                    style={[styles.askButton, { opacity: !question.trim() || loading ? 0.5 : 1 }]}
                  >
                    <LinearGradient
                      colors={mode === 'mirror' ? ['#6C7280', '#9CA3AF'] as const : [accent, '#6D28D9'] as const}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={styles.askButtonGrad}
                    >
                      <Sparkles color="#FFF" size={18} strokeWidth={1.8} />
                      <Text style={styles.askButtonText}>
                        {loading ? t('crystalBall.kula_patrzy', 'Kula patrzy w głąb...') : t('crystalBall.uruchom_odczyt', 'Uruchom odczyt kuli')}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </Animated.View>

              {/* Vision cards */}
              {renderVisionCards()}

              {/* Symbol interpreter */}
              {renderSymbolInterpreter()}

              {/* Sessions */}
              {sessions.length > 0 ? (
                <>
                  <Animated.View entering={FadeInUp.delay(150).duration(520)}>
                    <View style={[styles.sectionCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : accent + '0A', borderColor: 'transparent' }]}>
                      <Text style={[styles.cardEyebrow, { color: accent }]}>{t('crystalBall.archiwum_odczytow', 'ARCHIWUM ODCZYTÓW')}</Text>
                      <Text style={[styles.sectionBody, { color: subColor }]}>
                        {t('crystalBall.kazda_odpowiedz_zostaje_tu_jako', 'Każda odpowiedź zostaje tu jako ślad. Wyrocznia i zwierciadło budują własną pamięć interpretacji.')}
                      </Text>
                    </View>
                  </Animated.View>

                  {sessions.map((item, index) => {
                    const ia = item.mode === 'mirror' ? MIRROR_ACCENT : CRYSTAL_ACCENT;
                    return (
                      <Animated.View key={item.id} entering={FadeInUp.delay(170 + index * 40).duration(460)}>
                        <View style={[styles.answerCard, { borderColor: 'transparent', backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : ia + '10', overflow: 'hidden', shadowColor: ia, shadowOpacity: 0.20, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 8 }]}>
                          <LinearGradient colors={[ia + '20', 'transparent', ia + '08'] as const} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
                          <LinearGradient
                            colors={['transparent', ia + '99', 'transparent'] as [string, string, string]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1 }}
                            pointerEvents="none"
                          />
                          <View style={styles.answerHead}>
                            <Layers3 color={ia} size={15} strokeWidth={1.8} />
                            <Text style={[styles.answerMode, { color: ia }]}>
                              {item.mode === 'mirror' ? t('crystalBall.zwierciadlo_duszy', 'Zwierciadło duszy') : t('crystalBall.wyrocznia_krystalu', 'Wyrocznia kryształu')}
                            </Text>
                            <Text style={[styles.answerDate, { color: subColor }]}>{item.date}</Text>
                          </View>
                          <Text style={[styles.answerQuestion, { color: subColor }]}>{item.question}</Text>
                          <View style={styles.speakRow}>
                            <Text style={[styles.answerText, { color: textColor }]}>{item.answer}</Text>
                            <SpeakButton text={item.answer} compact color={ia} />
                          </View>
                        </View>
                      </Animated.View>
                    );
                  })}
                </>
              ) : null}

              {/* Reading history toggle */}
              {renderHistory()}

              {/* Weekly schedule in oracle mode */}
              {renderWeeklySchedule()}
            </>
          )}

          <EndOfContentSpacer size="standard" />
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },

  // ─ Sphere
  sphereWrap: { width: 220, height: 220, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  sphereGlow: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', position: 'absolute' },
  mistLayer:  { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', position: 'absolute' },
  glowRing1:  { position: 'absolute', width: 242, height: 242, borderRadius: 121, borderWidth: 1.5 },
  glowRing2:  { position: 'absolute', width: 264, height: 264, borderRadius: 132, borderWidth: 1 },
  particle:   { position: 'absolute', width: 4, height: 4, borderRadius: 2 },
  particleLg: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },

  // ─ Schedule banner
  scheduleBanner:     { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 0.5, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  scheduleBannerIcon: { fontSize: 20 },
  scheduleBannerDay:  { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  scheduleBannerDesc: { fontSize: 12, lineHeight: 18, marginTop: 2 },

  // ─ Mode chips
  modeRow:      { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 14 },
  modeChip:     { flex: 1, borderRadius: 14, borderWidth: 0.5, paddingVertical: 12, alignItems: 'center' },
  modeChipText: { fontSize: 12, fontWeight: '700' },

  // ─ Chambers
  chambersCard: { borderRadius: 24, borderWidth: 0, padding: 18, overflow: 'hidden', marginBottom: 12 },
  chambersGrid: { gap: 10 },
  chamberTile:  { borderRadius: 18, borderWidth: 0.5, padding: 16 },
  chamberTitle: { fontSize: 14, fontWeight: '700', marginTop: 10 },
  chamberBody:  { fontSize: 12.5, lineHeight: 19, marginTop: 6 },

  // ─ Hero card
  heroCard:      { borderRadius: 24, borderWidth: 0, padding: 18, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  modeHeroCard:  { paddingTop: 20, paddingBottom: 20 },
  cardEyebrow:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 8 },
  modeHeroTitle: { fontSize: 20, lineHeight: 28, fontWeight: '700', letterSpacing: -0.4 },
  modeHeroCopy:  { marginTop: 10, fontSize: 13.5, lineHeight: 22 },

  // ─ Crystal hero
  crystalHeroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  crystalSwatch:  { width: 54, height: 54, borderRadius: 18 },
  crystalName:    { fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
  crystalBenefit: { fontSize: 14, lineHeight: 22, marginTop: 4 },

  // ─ Section card
  sectionCard: { borderRadius: 22, borderWidth: 0, padding: 18, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 8 },
  sectionBody:  { fontSize: 14, lineHeight: 22 },

  // ─ Dual cards
  dualRow:  { flexDirection: 'row', gap: 10, marginBottom: 12 },
  dualCard: { flex: 1, borderRadius: 20, borderWidth: 0, padding: 16 },
  quote:    { flex: 1, fontSize: 18, lineHeight: 28, fontStyle: 'italic' },
  speakRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cta:      { marginTop: 16, borderWidth: 0, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ctaText:  { fontSize: 14, fontWeight: '700' },

  // ─ Ask button
  askButton:     { borderRadius: 18, overflow: 'hidden', marginTop: 10, shadowColor: '#8B5CF6', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  askButtonGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  askButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },

  // ─ Answer card
  answerCard:     { borderRadius: 22, borderWidth: 0, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  answerHead:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  answerMode:     { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, flex: 1 },
  answerDate:     { fontSize: 10, fontWeight: '500' },
  answerQuestion: { fontSize: 13, lineHeight: 20, fontStyle: 'italic', marginBottom: 10 },
  answerText:     { flex: 1, fontSize: 14, lineHeight: 23 },

  // ─ Shared new section
  newSection:        { borderRadius: 22, borderWidth: 0, padding: 18, marginBottom: 12, overflow: 'hidden' },
  chakraRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, marginBottom: 10 },
  chakraDot:         { width: 40, height: 40, borderRadius: 20 },
  chakraName:        { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  chakraSanskrit:    { fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  chakraAffirmation: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },

  // ─ Cleansing
  cleansingChipsRow:  { flexDirection: 'row', gap: 8, paddingRight: 4 },
  cleansingChip:      { borderRadius: 20, borderWidth: 0, paddingVertical: 8, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  cleansingChipEmoji: { fontSize: 15 },
  cleansingChipLabel: { fontSize: 12, fontWeight: '700' },

  // ─ Co dalej
  codalejRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  codalejLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  codalejDot:  { width: 8, height: 8, borderRadius: 4 },
  codalejText: { fontSize: 14, fontWeight: '600' },

  // ─ Fog selector
  fogSection:   { borderRadius: 22, borderWidth: 0, padding: 18, marginBottom: 12, overflow: 'hidden' },
  fogRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 0, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
  fogDot:       { width: 18, height: 18, borderRadius: 9 },
  fogLabel:     { fontSize: 14, fontWeight: '700' },
  fogAreaLabel: { fontSize: 11, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },
  fogActiveDot: { width: 8, height: 8, borderRadius: 4 },
  fogDesc:      { fontSize: 13, lineHeight: 20, marginTop: 4, fontStyle: 'italic' },

  // ─ Ritual
  ritualCard:      { borderRadius: 22, borderWidth: 0, padding: 20, marginBottom: 12, overflow: 'hidden', alignItems: 'center' },
  ritualTitle:     { fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 6, textAlign: 'center' },
  ritualSub:       { fontSize: 13.5, lineHeight: 21, textAlign: 'center', marginBottom: 16 },
  ritualBtn:       { borderWidth: 0, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 24, alignItems: 'center' },
  ritualBtnText:   { fontSize: 14, fontWeight: '700' },
  ritualStepNum:   { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  ritualCountdown: { fontSize: 56, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  ritualStepLabel: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  ritualStepSub:   { fontSize: 13.5, lineHeight: 21, textAlign: 'center' },

  // ─ Question templates
  tplChip:     { borderRadius: 14, borderWidth: 0, paddingVertical: 9, paddingHorizontal: 12, maxWidth: SW * 0.6 },
  tplChipText: { fontSize: 12, lineHeight: 17, fontWeight: '600' },

  // ─ Vision cards
  visionCard:       { borderRadius: 22, borderWidth: 0, padding: 18, marginBottom: 10, overflow: 'hidden' },
  visionHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  visionHorizonRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  horizonDot:       { width: 6, height: 6, borderRadius: 3 },
  horizonLabel:     { fontSize: 9, fontWeight: '700', letterSpacing: 1.8 },
  visionTitle:      { fontSize: 15, fontWeight: '700' },
  visionDesc:       { fontSize: 14, lineHeight: 23 },

  // ─ Symbol interpreter
  symbolSection:   { borderRadius: 22, borderWidth: 0, padding: 18, marginBottom: 12, overflow: 'hidden' },
  symbolGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  symbolChip:      { borderRadius: 16, borderWidth: 0, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  symbolEmoji:     { fontSize: 14 },
  symbolLabel:     { fontSize: 12, fontWeight: '700' },
  symbolDetail:    { borderRadius: 16, borderWidth: 0, padding: 14, marginTop: 10 },
  symbolInput:     { borderWidth: 0, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, lineHeight: 21, minHeight: 72, marginBottom: 10 },
  symbolBtn:       { borderWidth: 0, borderRadius: 14, paddingVertical: 11, alignItems: 'center', marginBottom: 12 },
  symbolBtnText:   { fontSize: 13.5, fontWeight: '700' },
  symbolInterpText:{ fontSize: 13.5, lineHeight: 22 },

  // ─ History
  historyToggle:     { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 14, marginBottom: 10 },
  historyToggleText: { flex: 1, fontSize: 14, fontWeight: '700' },
  historyCard:       { borderRadius: 20, borderWidth: 0, padding: 16, marginBottom: 10, overflow: 'hidden' },
  historyMeta:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  historyFogDot:     { width: 8, height: 8, borderRadius: 4 },
  historyDate:       { fontSize: 11 },
  historyMode:       { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  historyQuestion:   { fontSize: 13.5, fontWeight: '600', marginBottom: 6, lineHeight: 20 },
  historyAnswer:     { fontSize: 12.5, lineHeight: 19 },

  // ─ Weekly schedule
  scheduleSection:      { borderRadius: 22, borderWidth: 0, padding: 18, marginBottom: 12, overflow: 'hidden' },
  scheduleRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10, borderRadius: 8, paddingHorizontal: 4 },
  scheduleIcon:         { fontSize: 18, marginTop: 2 },
  scheduleDayRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  scheduleDay:          { fontSize: 13.5, letterSpacing: 0.2 },
  scheduleDesc:         { fontSize: 12, lineHeight: 18 },
  scheduleQuality:      { borderRadius: 8, borderWidth: 0, paddingVertical: 2, paddingHorizontal: 7 },
  scheduleQualityText:  { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.5 },
});
