// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle as SvgCircle,
  Defs,
  G,
  Line,
  Path,
  Polygon,
  RadialGradient as SvgRadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  BookOpen,
  CheckCircle,
  ChevronLeft,
  Clock,
  MessageCircle,
  Music,
  Pause,
  Play,
  SkipForward,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  Wand2,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { useAudioCleanup } from '../core/hooks/useAudioCleanup';
import { AudioService } from '../core/services/audio.service';
import { HapticsService } from '../core/services/haptics.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { useTranslation } from 'react-i18next';

// ── Constants ───────────────────────────────────────────────────
const ACCENT = '#A078FF';
const ACCENT_DIM = 'rgba(160,120,255,0.18)';
const RING_R = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

// ── Ritual Type Definitions ─────────────────────────────────────
type RitualType = 'morning' | 'evening' | 'transform';

interface RitualStep {
  emoji: string;
  title: string;
  desc: string;
  guidance: string;
  durationSec: number;
  breathGuide?: { inhale: number; hold: number; exhale: number };
}

interface RitualConfig {
  id: RitualType;
  label: string;
  eyebrow: string;
  icon: string;
  color: string;
  gradient: [string, string, string];
  description: string;
  totalMinutes: number;
  steps: RitualStep[];
}

const RITUALS: Record<RitualType, RitualConfig> = {
  morning: {
    id: 'morning',
    label: 'Poranny',
    eyebrow: 'POWITANIE NOWEGO DNIA',
    icon: '🌅',
    color: '#F9A854',
    gradient: ['#2A1A0A', '#1A1206', '#0C0A04'],
    description: 'Obudź ciało i umysł. Ustaw intencję, która poprowadzi cię przez cały dzień z klarownością i mocą.',
    totalMinutes: 12,
    steps: [
      {
        emoji: '🌬️', title: 'Oddech przebudzenia',
        desc: 'Trzy głębokie oddechy, by zakorzenić się w nowym dniu.',
        guidance: 'Wdychaj przez nos, czując jak powietrze wypełnia brzuch, potem klatkę. Zatrzymaj chwilę. Wydychaj powoli przez usta, uwalniając resztki snu.',
        durationSec: 120,
        breathGuide: { inhale: 4, hold: 4, exhale: 6 },
      },
      {
        emoji: '🌞', title: 'Powitanie światła',
        desc: 'Wyobraź sobie złote światło wchodzące przez koronę głowy.',
        guidance: 'Z każdym wdechem światło sięga głębiej — przez gardło, serce, brzuch — aż do stóp. Czujesz ciepło, które budzi każdą komórkę ciała.',
        durationSec: 90,
      },
      {
        emoji: '🙏', title: 'Ustaw intencję',
        desc: 'Jedno zdanie, które da temu dniu kierunek.',
        guidance: 'Nie plan, nie lista zadań. Jedna jakość, którą chcesz dziś ucieleśniać: spokój, odwaga, skupienie, wdzięczność. Powiedz to w myśli lub na głos.',
        durationSec: 90,
      },
      {
        emoji: '✨', title: 'Afirmacja poranna',
        desc: 'Powtórz trzy razy: "Jestem gotowy/a. Jestem obecny/a. Jestem wystarczający/a."',
        guidance: 'Mów powoli, z przekonaniem. Jeśli słowa budzą opór — właśnie tu jest praca. Zostań z tym jedną chwilę dłużej.',
        durationSec: 90,
      },
      {
        emoji: '🌿', title: 'Wizualizacja dnia',
        desc: 'Przeglądaj dzień jak film — z perspektywy już spełnionego.',
        guidance: 'Wyobraź sobie jeden kluczowy moment dnia, który mija dobrze. Jak wygląda twoja postawa? Co czujesz w ciele? Jaka decyzja wyraża twoją intencję?',
        durationSec: 120,
      },
      {
        emoji: '💫', title: 'Zakorzenienie',
        desc: 'Poczuj podłoże pod stopami. Wróć do ciała.',
        guidance: 'Porusz palcami stóp. Poczuj ciężar ciała na podłodze. Weź jeden ostatni głęboki oddech i otwórz oczy. Rytuał zakończony — dzień może zacząć się właściwie.',
        durationSec: 60,
      },
      {
        emoji: '🕯️', title: 'Akt wdzięczności',
        desc: 'Nazwij trzy rzeczy, za które jesteś wdzięczny/a jutro.',
        guidance: 'Nie myśl zbyt długo. Pierwsze trzy, które przyjdą naturalnie: osoba, chwila, możliwość. Wdzięczność zmienia soczewkę, przez którą widzisz cały dzień.',
        durationSec: 90,
      },
      {
        emoji: '🌅', title: 'Zamknięcie poranne',
        desc: 'Złóż intencję jak nasienie w ziemię.',
        guidance: 'Złącz dłonie na sercu. Powiedz cicho: "Niech ten dzień służy mnie i innym." Potem puść — nie trzymaj intencji zbyt kurczowo. Ona wie, co robić.',
        durationSec: 60,
      },
    ],
  },
  evening: {
    id: 'evening',
    label: 'Wieczorny',
    eyebrow: 'ZAMKNIĘCIE I WYCISZENIE',
    icon: '🌙',
    color: '#7B8CDE',
    gradient: ['#050A1A', '#06091A', '#030614'],
    description: 'Puść napięcia dnia. Domknij otwarte wątki energetyczne i przygotuj ciało oraz umysł na głęboki, odnowiający sen.',
    totalMinutes: 14,
    steps: [
      {
        emoji: '🌙', title: 'Oddech zwalniający',
        desc: 'Długi wydech sygnalizuje ciału, że czas bezpieczeństwa.',
        guidance: 'Wydłuż wydech do dwukrotności wdechu. To aktywuje układ przywspółczulny i zwalnia rytm serca. Poczuj, jak barki opadają z każdym cyklem.',
        durationSec: 150,
        breathGuide: { inhale: 4, hold: 2, exhale: 8 },
      },
      {
        emoji: '🔍', title: 'Skan ciała',
        desc: 'Gdzie dzisiaj trzymałeś/aś napięcie?',
        guidance: 'Powoli przesuń uwagę od czoła przez szyję, barki, klatkę, brzuch, biodra, uda, aż do stóp. Bez oceniania — po prostu zauważ. Każde miejsce zasługuje na chwilę uwagi.',
        durationSec: 120,
      },
      {
        emoji: '📖', title: 'Przegląd dnia',
        desc: 'Co z tego dnia było dobre? Co trudne?',
        guidance: 'Nie analizuj — po prostu obserwuj jak widz. Trzy momenty: jeden, który cię zasilił; jeden, który cię kosztował; jeden, który cię zaskoczył. To wystarczy.',
        durationSec: 120,
      },
      {
        emoji: '🤲', title: 'Akt uwalniania',
        desc: 'Puść to, co nie służy ci w nocy.',
        guidance: 'Wyobraź sobie, że odkładasz plecak pełen zadań, rozmów i nierozwiązanych spraw. Nie musisz ich teraz nieść. Leżą bezpiecznie — jutro po nie wrócisz, jeśli będą potrzebne.',
        durationSec: 90,
      },
      {
        emoji: '🌊', title: 'Zmywanie energii',
        desc: 'Wizualizacja oczyszczającego światła.',
        guidance: 'Wyobraź sobie delikatną, chłodną falę światła przechodzącą przez ciało od czubka głowy do stóp. Zabiera ze sobą zmęczenie, cudze emocje i napięcie dnia.',
        durationSec: 100,
      },
      {
        emoji: '💜', title: 'Wdzięczność wieczorna',
        desc: 'Trzy rzeczy, które były prawdziwie dobre.',
        guidance: 'Nawet najtrudniejszy dzień ma w sobie coś dobrego. Jedna rozmowa, chwila ciszy, kubek herbaty, słońce przez okno. Zacznij od małego — to prawdziwsze niż wielkie.',
        durationSec: 90,
      },
      {
        emoji: '🧘', title: 'Relaksacja progresywna',
        desc: 'Rozluźniaj kolejne grupy mięśni.',
        guidance: 'Napnij stopy przez 3 sekundy — puść. Łydki — puść. Uda — puść. Kontynuuj w górę: brzuch, plecy, barki, ręce, twarz. Przy każdym "puszczeniu" ciało uczy się różnicy.',
        durationSec: 150,
      },
      {
        emoji: '🌑', title: 'Wejście w ciszę',
        desc: 'Ostatni oddech. Przekrocz próg snu.',
        guidance: 'Jeden długi, ciepły wdech nosem. Zatrzymaj na chwilę przy sercu. Powoli wydychaj przez usta. Pozwól powiekom opaść. Sen jest formą zaufania — ciało wie, jak się zatroszczyć.',
        durationSec: 60,
      },
    ],
  },
  transform: {
    id: 'transform',
    label: 'Transformacyjny',
    eyebrow: 'GŁĘBOKA PRACA WEWNĘTRZNA',
    icon: '🔥',
    color: '#FF7A5A',
    gradient: ['#1A0A06', '#160806', '#0E0504'],
    description: 'Rytuał dla momentów przełomu. Uwolnij stare wzorce, spróbuj czegoś nowego. Wymaga odwagi i gotowości na zmianę.',
    totalMinutes: 18,
    steps: [
      {
        emoji: '🔥', title: 'Oddech ognia',
        desc: 'Szybkie, energetyczne oddechy budzą wewnętrzne ciepło.',
        guidance: 'Wdech i wydech przez nos — rytmiczny, trochę szybszy niż normalnie. 20 cykli. Poczuj, jak ciało się nagrzewa i pobudza. To sygnał: jesteś gotowy/a do pracy.',
        durationSec: 120,
        breathGuide: { inhale: 2, hold: 0, exhale: 2 },
      },
      {
        emoji: '🔍', title: 'Nazwij cień',
        desc: 'Co chcesz dziś przemienić? Stary wzorzec, strach, przekonanie?',
        guidance: 'Bez oceniania. Nazwij to konkretnie: "Mój strach przed odrzuceniem," "Wzorzec odkładania na później," "Przekonanie, że nie jestem wystarczający/a." Nazwane traci część mocy.',
        durationSec: 120,
      },
      {
        emoji: '🌑', title: 'Zejście do korzenia',
        desc: 'Skąd pochodzi ten wzorzec?',
        guidance: 'Nie szukaj winnych — szukaj rozumienia. Może to była ochrona, która kiedyś była potrzebna. Możesz jej podziękować za służbę i powiedzieć: "Już nie potrzebuję tej ochrony. Jestem bezpieczny/a."',
        durationSec: 150,
      },
      {
        emoji: '⚡', title: 'Akt zerwania',
        desc: 'Wyobraź sobie, że przecinasz niewidzialną nić.',
        guidance: 'Zrób ruch dłonią — dosłownie, fizycznie. Przetnij powietrze. Powiedz: "Puszczam." To nie jest magia — to deklaracja, którą ciało pamięta. Powtórz trzy razy z pełną intencją.',
        durationSec: 90,
      },
      {
        emoji: '🌱', title: 'Sadzenie nowego nasienia',
        desc: 'Kim chcesz być zamiast?',
        guidance: 'Nie "chcę przestać X" — "chcę być Y". Konkretna jakość: odważny/a, spokojny/a, otwarty/a, hojny/a. Wyobraź sobie siebie żyjącego/ą z tej jakości przez jeden zwykły dzień.',
        durationSec: 120,
      },
      {
        emoji: '💎', title: 'Zakorzenienie nowej tożsamości',
        desc: 'Afirmacja z poziomu istoty, nie zachowania.',
        guidance: 'Nie "będę robił/a X" — "Jestem osobą, która Y." Powiedz to powoli, czując jak rezonuje lub opiera się w ciele. Opór to właśnie miejsce pracy. Wróć do tego zdania.',
        durationSec: 100,
      },
      {
        emoji: '🙌', title: 'Ceremonia zamknięcia',
        desc: 'Uczcij siebie za podjętą pracę.',
        guidance: 'To wymagało odwagi. Wielu ludzi nigdy nie siada z własnymi cieniami. Powiedz do siebie coś ciepłego — jak do bliskiej osoby, która właśnie przeszła przez trudne. Jesteś po tej stronie.',
        durationSec: 90,
      },
      {
        emoji: '🌟', title: 'Powrót i integracja',
        desc: 'Zanim wstaniesz — oddech zakorzenienia.',
        guidance: 'Trzy wolne oddechy. Poczuj podłogę, własne dłonie, temperaturę powietrza. Weź ze sobą tylko jedno zdanie z tej sesji — to, które było prawdziwe. Reszta wróci, kiedy będzie gotowa.',
        durationSec: 80,
      },
    ],
  },
};

// ── Sacred Geometry Background ──────────────────────────────────
const SacredBackground = React.memo(({ ritualType, isLight }: { ritualType: RitualType; isLight: boolean }) => {
  const config = RITUALS[ritualType];
  const rotate = useSharedValue(0);
  const rotateOuter = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(withTiming(360, { duration: 40000, easing: Easing.linear }), -1, false);
    rotateOuter.value = withRepeat(withTiming(-360, { duration: 60000, easing: Easing.linear }), -1, false);
  }, []);

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotate.value}deg` }],
  }));
  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotateOuter.value}deg` }],
  }));

  const accent = config.color;
  const [g1, g2] = isLight ? ['#FFFFFF', '#F8F4FF'] : [config.gradient[0], config.gradient[2]];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={isLight ? ['#FAF7FF', '#F2EEF9', '#EDE5F5'] : config.gradient} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', opacity: isLight ? 0.08 : 0.18 }]}>
        <Animated.View style={innerStyle}>
          <Svg width={380} height={380} viewBox="-190 -190 380 380">
            <Defs>
              <SvgRadialGradient id="bg_rg" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={accent} stopOpacity={0.4} />
                <Stop offset="100%" stopColor={accent} stopOpacity={0} />
              </SvgRadialGradient>
            </Defs>
            {/* Flower of life rings */}
            {[80, 120, 160].map((r, i) => (
              <SvgCircle key={i} cx={0} cy={0} r={r} fill="none" stroke={accent} strokeWidth={0.8} opacity={0.6 - i * 0.15} />
            ))}
            {/* Hexagon */}
            <Polygon
              points="0,-95 82,-47 82,47 0,95 -82,47 -82,-47"
              fill="none" stroke={accent} strokeWidth={1.2} opacity={0.7}
            />
            {/* Star of David inner */}
            <Polygon points="0,-62 54,-31 54,31 0,62 -54,31 -54,-31" fill="none" stroke={accent} strokeWidth={0.8} opacity={0.5} />
            {/* Cross lines */}
            {[0, 60, 120].map((angle, i) => (
              <G key={i} transform={`rotate(${angle})`}>
                <Line x1={0} y1={-160} x2={0} y2={160} stroke={accent} strokeWidth={0.5} opacity={0.3} />
              </G>
            ))}
          </Svg>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, outerStyle]}>
          <Svg width={380} height={380} viewBox="-190 -190 380 380">
            {[180, 140].map((r, i) => (
              <SvgCircle key={i} cx={0} cy={0} r={r} fill="none" stroke={accent} strokeWidth={0.6} strokeDasharray="4 8" opacity={0.35 + i * 0.1} />
            ))}
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
});

// ── Progress Ring ───────────────────────────────────────────────
const ProgressRing = React.memo(({ progress, color, size = 130 }: { progress: number; color: string; size?: number }) => {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));

  const animOffset = useSharedValue(circ);
  useEffect(() => {
    animOffset.value = withTiming(offset, { duration: 500, easing: Easing.out(Easing.quad) });
  }, [offset]);

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: animOffset.value,
  }));

  return (
    <Svg width={size} height={size}>
      <SvgCircle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
      <AnimatedCircle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${circ} ${circ}`}
        animatedProps={animProps}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
});

// ── Breathing Guide ─────────────────────────────────────────────
const BreathingGuide = React.memo(({ step, color }: { step: RitualStep; color: string }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0.7);

  const bg = step.breathGuide;
  if (!bg) return null;

  useEffect(() => {
    let active = true;
    const total = bg.inhale + bg.hold + bg.exhale;

    const runCycle = () => {
      if (!active) return;
      setPhase('inhale');
      scale.value = withTiming(1.12, { duration: bg.inhale * 1000, easing: Easing.inOut(Easing.sin) });
      opacity.value = withTiming(1.0, { duration: bg.inhale * 1000 });
      setTimeout(() => {
        if (!active) return;
        setPhase('hold');
        setTimeout(() => {
          if (!active) return;
          setPhase('exhale');
          scale.value = withTiming(0.85, { duration: bg.exhale * 1000, easing: Easing.inOut(Easing.sin) });
          opacity.value = withTiming(0.7, { duration: bg.exhale * 1000 });
          setTimeout(() => { if (active) runCycle(); }, bg.exhale * 1000 + 200);
        }, bg.hold * 1000);
      }, bg.inhale * 1000);
    };

    runCycle();
    return () => { active = false; };
  }, [bg.inhale, bg.hold, bg.exhale]);

  const circStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const PHASE_LABELS = { inhale: `Wdech… ${bg.inhale}s`, hold: `Zatrzymaj… ${bg.hold}s`, exhale: `Wydech… ${bg.exhale}s` };

  return (
    <View style={breathStyles.wrap}>
      <Animated.View style={[breathStyles.circle, { borderColor: color + '66', backgroundColor: color + '22' }, circStyle]}>
        <View style={[breathStyles.innerCircle, { backgroundColor: color + '44' }]} />
      </Animated.View>
      <Text style={[breathStyles.phaseLabel, { color }]}>{PHASE_LABELS[phase]}</Text>
      <Text style={breathStyles.hint}>
        Wdech {bg.inhale}s · Zatrzymanie {bg.hold}s · Wydech {bg.exhale}s
      </Text>
    </View>
  );
});

const breathStyles = StyleSheet.create({
  wrap:        { alignItems: 'center', marginVertical: 16 },
  circle:      { width: 90, height: 90, borderRadius: 45, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  innerCircle: { width: 40, height: 40, borderRadius: 20 },
  phaseLabel:  { fontSize: 16, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  hint:        { fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.3 },
});

// ── Confetti Particles ──────────────────────────────────────────
const ConfettiParticle = ({ color, delay }: { color: string; delay: number }) => {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue((Math.random() - 0.5) * 280);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSequence(
      withTiming(-20, { duration: 0 }),
      withTiming(60, { duration: 1200 + delay, easing: Easing.out(Easing.quad) }),
    );
    opacity.value = withSequence(
      withTiming(0, { duration: delay }),
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 600 }),
    );
    rotate.value = withTiming(360 * 2, { duration: 1800 + delay, easing: Easing.linear });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{ position: 'absolute', top: 0, left: '50%', width: 8, height: 8, borderRadius: 2, backgroundColor: color }, style]}
    />
  );
};

const CONFETTI_COLORS = [ACCENT, '#F9A854', '#5BC98E', '#7B8CDE', '#FF7A5A', '#FBBF24', '#F472B6'];

// ── Main Screen ─────────────────────────────────────────────────
export const RitualDetailScreen: React.FC = ({ navigation, route }) => {
  const { t } = useTranslation();
  useAudioCleanup();
  const insets = useSafeAreaInsets();
  const { themeName } = useAppStore();
  const { addMeditationSession, meditationSessions } = useAppStore();

  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');
  const textColor = isLight ? '#1A1018' : '#F5F0FF';
  const subColor = isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)';
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)';

  // Phase state
  const [phase, setPhase] = useState<'selector' | 'session' | 'summary'>('selector');
  const [ritualType, setRitualType] = useState<RitualType>('morning');
  const [step, setStep] = useState(0);
  const [musicOn, setMusicOn] = useState(true);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerStartRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Summary state
  const [reflectionText, setReflectionText] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const config = RITUALS[ritualType];
  const currentStep = config.steps[step];
  const totalSteps = config.steps.length;
  const isLastStep = step === totalSteps - 1;

  // Fade animation for step transitions
  const fadeAnim = useSharedValue(1);
  const slideAnim = useSharedValue(0);

  // Recent sessions (last 3 meditation sessions used as proxy)
  const recentSessions = meditationSessions.slice(0, 3);

  // ── Timer logic ──────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'session') {
      setTimeLeft(currentStep.durationSec);
    }
  }, [step, phase]);

  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setTimerRunning(false);
            HapticsService.impact('light');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else if (!timerRunning && timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
      if (timerStartRef.current) clearTimeout(timerStartRef.current);
    };
  }, [timerRunning]);

  const timerProgress = currentStep ? 1 - timeLeft / currentStep.durationSec : 0;

  // ── Navigation helpers ───────────────────────────────────────
  const animateStepChange = useCallback((fn: () => void) => {
    fadeAnim.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(fn)();
      slideAnim.value = -30;
      fadeAnim.value = withTiming(1, { duration: 280 });
      slideAnim.value = withSpring(0, { damping: 18, stiffness: 180 });
    });
  }, []);

  // ── Start ritual ─────────────────────────────────────────────
  const startRitual = useCallback(async (type: RitualType) => {
    HapticsService.impact('medium');
    setRitualType(type);
    setStep(0);
    setPhase('session');
    setTimerRunning(true);
    startTimeRef.current = new Date();
    if (musicOn) {
      await AudioService.playMusicForSession('ritual');
    }
  }, [musicOn]);

  // ── Advance step ─────────────────────────────────────────────
  const goNext = useCallback(() => {
    HapticsService.impact('light');
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);

    if (isLastStep) {
      finishRitual();
      return;
    }

    animateStepChange(() => {
      setStep(s => s + 1);
    });
    if (timerStartRef.current) clearTimeout(timerStartRef.current);
    timerStartRef.current = setTimeout(() => setTimerRunning(true), 300);
  }, [isLastStep, animateStepChange]);

  // ── Finish ritual ────────────────────────────────────────────
  const finishRitual = useCallback(async () => {
    HapticsService.impact('heavy');
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);

    const durationMin = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current.getTime()) / 60000)
      : config.totalMinutes;

    addMeditationSession({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      durationMinutes: durationMin,
      technique: `Rytuał ${config.label}`,
    });

    await AudioService.pauseBackgroundMusic();
    setPhase('summary');
    setShowConfetti(true);
    if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 2000);
  }, [config, addMeditationSession]);

  // ── Toggle timer ─────────────────────────────────────────────
  const toggleTimer = useCallback(() => {
    HapticsService.impact('light');
    setTimerRunning(r => !r);
  }, []);

  // ── Toggle music ─────────────────────────────────────────────
  const toggleMusic = useCallback(async () => {
    HapticsService.impact('light');
    if (musicOn) {
      await AudioService.pauseBackgroundMusic();
    } else {
      await AudioService.playMusicForSession('ritual');
    }
    setMusicOn(m => !m);
  }, [musicOn]);

  // ── Save journal note ─────────────────────────────────────────
  const saveJournal = useCallback(() => {
    if (!reflectionText.trim()) return;
    HapticsService.impact('medium');
    setJournalSaved(true);
    Keyboard.dismiss();
  }, [reflectionText]);

  // ── Format timer ─────────────────────────────────────────────
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── Animated step card style ─────────────────────────────────
  const stepCardStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateX: slideAnim.value }],
  }));

  // ── Recent session date formatter ─────────────────────────────
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER: SELECTOR PHASE
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'selector') {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: currentTheme.background }]} edges={['top']}>
        <SacredBackground ritualType={ritualType} isLight={isLight} />

        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={s.backBtn} hitSlop={16}>
            <ChevronLeft size={22} color={textColor} />
          </Pressable>
          <Text style={[s.headerTitle, { color: textColor }]}>Rytuał Intencji</Text>
          <Pressable onPress={toggleMusic} style={s.iconBtn} hitSlop={14}>
            {musicOn
              ? <Volume2 size={20} color={ACCENT} />
              : <VolumeX size={20} color={subColor} />}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <View style={s.heroWrap}>
              <Text style={s.heroEmoji}>🕯️</Text>
              <Text style={[s.heroTitle, { color: textColor }]}>Wybierz swój rytuał</Text>
              <Text style={[s.heroSub, { color: subColor }]}>
                Każdy typ rytuału ma inne tempo, intencję i zestaw kroków. Wybierz ten, który odpowiada twojemu momentowi.
              </Text>
            </View>
          </Animated.View>

          {/* Ritual Type Cards */}
          {(['morning', 'evening', 'transform'] as RitualType[]).map((type, idx) => {
            const cfg = RITUALS[type];
            const isSelected = ritualType === type;
            return (
              <Animated.View key={type} entering={FadeInDown.delay(150 + idx * 100).duration(460)}>
                <Pressable
                  onPress={() => { HapticsService.impact('light'); setRitualType(type); }}
                  style={({ pressed }) => [
                    s.ritualCard,
                    { backgroundColor: isSelected ? cfg.color + '22' : cardBg, borderColor: isSelected ? cfg.color + '66' : cardBorder },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] },
                  ]}
                >
                  <LinearGradient
                    colors={isSelected ? [cfg.color + '28', cfg.color + '10'] : ['transparent', 'transparent']}
                    style={s.ritualCardGradient}
                  >
                    <View style={s.ritualCardLeft}>
                      <Text style={s.ritualCardEmoji}>{cfg.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.ritualCardEyebrow, { color: isSelected ? cfg.color : subColor }]}>{cfg.eyebrow}</Text>
                        <Text style={[s.ritualCardTitle, { color: textColor }]}>{cfg.label}</Text>
                        <Text style={[s.ritualCardDesc, { color: subColor }]} numberOfLines={2}>{cfg.description}</Text>
                        <View style={s.ritualCardMeta}>
                          <Clock size={12} color={subColor} />
                          <Text style={[s.ritualCardMetaText, { color: subColor }]}>{cfg.totalMinutes} min · {totalSteps} kroków</Text>
                        </View>
                      </View>
                    </View>
                    {isSelected && (
                      <View style={[s.selectedDot, { backgroundColor: cfg.color }]} />
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            );
          })}

          {/* Start button */}
          <Animated.View entering={FadeInDown.delay(500).duration(460)} style={{ marginTop: 8 }}>
            <Pressable
              onPress={() => startRitual(ritualType)}
              style={({ pressed }) => [s.startBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] }]}
            >
              <LinearGradient colors={[config.color, ACCENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.startBtnGrad}>
                <Play size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={s.startBtnText}>Rozpocznij {config.label} Rytuał</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Recent sessions */}
          {recentSessions.length > 0 && (
            <Animated.View entering={FadeInDown.delay(600).duration(460)}>
              <Text style={[s.sectionLabel, { color: subColor, marginTop: 28 }]}>OSTATNIE SESJE</Text>
              {recentSessions.map((sess, i) => (
                <View key={sess.id} style={[s.historyRow, { borderColor: cardBorder }]}>
                  <CheckCircle size={14} color={ACCENT} style={{ marginRight: 10 }} />
                  <Text style={[s.historyText, { color: textColor }]}>{sess.technique}</Text>
                  <Text style={[s.historyDate, { color: subColor }]}>{formatDate(sess.date)}</Text>
                  <Text style={[s.historyDur, { color: subColor }]}>{sess.durationMinutes} min</Text>
                </View>
              ))}
            </Animated.View>
          )}

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: SESSION PHASE
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'session') {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: currentTheme.background }]} edges={['top']}>
        <SacredBackground ritualType={ritualType} isLight={isLight} />

        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => { finishRitual(); }} style={s.backBtn} hitSlop={16}>
            <ChevronLeft size={22} color={textColor} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={[s.headerTitle, { color: textColor }]}>{config.icon} {config.label}</Text>
            <Text style={[s.headerSub, { color: config.color }]}>{config.eyebrow}</Text>
          </View>
          <Pressable onPress={toggleMusic} style={s.iconBtn} hitSlop={14}>
            {musicOn
              ? <Music size={18} color={config.color} />
              : <VolumeX size={18} color={subColor} />}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Step Progress Dots */}
          <View style={s.dotRow}>
            {config.steps.map((_, i) => (
              <View
                key={i}
                style={[
                  s.progressDot,
                  i < step && { backgroundColor: config.color, width: 8 },
                  i === step && { backgroundColor: config.color, width: 20, borderRadius: 4 },
                  i > step && { backgroundColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)' },
                ]}
              />
            ))}
          </View>

          {/* Step Counter */}
          <Text style={[s.stepCounter, { color: subColor }]}>
            KROK {step + 1} / {totalSteps}
          </Text>

          {/* Timer Ring */}
          <View style={s.ringWrap}>
            <ProgressRing progress={timerProgress} color={config.color} size={140} />
            <View style={s.ringCenter}>
              <Text style={[s.ringTime, { color: textColor }]}>{formatTime(timeLeft)}</Text>
              <Pressable onPress={toggleTimer} hitSlop={14}>
                {timerRunning
                  ? <Pause size={18} color={config.color} />
                  : <Play size={18} color={config.color} />}
              </Pressable>
            </View>
          </View>

          {/* Step Card */}
          <Animated.View style={[s.stepCard, { backgroundColor: cardBg, borderColor: config.color + '55' }, stepCardStyle]}>
            <Text style={s.stepEmoji}>{currentStep.emoji}</Text>
            <Text style={[s.stepTitle, { color: textColor }]}>{currentStep.title}</Text>
            <Text style={[s.stepDesc, { color: subColor }]}>{currentStep.desc}</Text>

            <View style={[s.guidanceDivider, { borderColor: cardBorder }]} />

            <Text style={[s.guidanceLabel, { color: config.color }]}>PROWADZENIE</Text>
            <Text style={[s.guidanceText, { color: isLight ? 'rgba(0,0,0,0.70)' : 'rgba(255,255,255,0.75)' }]}>
              {currentStep.guidance}
            </Text>

            {/* Breathing guide for steps with breathGuide */}
            {currentStep.breathGuide && step === 0 && (
              <BreathingGuide step={currentStep} color={config.color} />
            )}
          </Animated.View>

          {/* Action buttons */}
          <View style={s.actionRow}>
            <Pressable
              onPress={goNext}
              style={({ pressed }) => [
                s.nextBtn,
                { backgroundColor: isLastStep ? '#5BC98E' : config.color },
                pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
              ]}
            >
              {isLastStep ? (
                <>
                  <CheckCircle size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={s.nextBtnText}>Zakończ Rytuał</Text>
                </>
              ) : (
                <>
                  <Text style={s.nextBtnText}>Następny krok</Text>
                  <SkipForward size={18} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </Pressable>
          </View>

          {/* Step hint */}
          {!isLastStep && (
            <Text style={[s.stepHint, { color: subColor }]}>
              Następny: {config.steps[step + 1]?.emoji} {config.steps[step + 1]?.title}
            </Text>
          )}

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: SUMMARY PHASE
  // ═══════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: currentTheme.background }]} edges={['top']}>
      <SacredBackground ritualType={ritualType} isLight={isLight} />

      {/* Confetti */}
      {showConfetti && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {CONFETTI_COLORS.flatMap((color, ci) =>
            Array.from({ length: 5 }).map((_, i) => (
              <ConfettiParticle key={`${ci}-${i}`} color={color} delay={ci * 80 + i * 60} />
            ))
          )}
        </View>
      )}

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={s.backBtn} hitSlop={16}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <Text style={[s.headerTitle, { color: textColor }]}>Rytuał Zakończony</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Completion hero */}
          <Animated.View entering={FadeInDown.delay(80).duration(500)} style={s.completionHero}>
            <LinearGradient
              colors={[config.color + '44', config.color + '18', 'transparent']}
              style={s.completionGradient}
            >
              <Text style={s.completionEmoji}>✨</Text>
              <Text style={[s.completionTitle, { color: textColor }]}>Rytuał {config.label} zakończony</Text>
              <Text style={[s.completionSub, { color: subColor }]}>
                Przeszedłeś/aś przez {totalSteps} kroków. Twoja intencja została złożona.
              </Text>
              <View style={s.completionStats}>
                <View style={[s.completionStat, { borderColor: cardBorder }]}>
                  <CheckCircle size={16} color={config.color} />
                  <Text style={[s.completionStatVal, { color: textColor }]}>{totalSteps}</Text>
                  <Text style={[s.completionStatLabel, { color: subColor }]}>kroków</Text>
                </View>
                <View style={[s.completionStat, { borderColor: cardBorder }]}>
                  <Clock size={16} color={config.color} />
                  <Text style={[s.completionStatVal, { color: textColor }]}>{config.totalMinutes}</Text>
                  <Text style={[s.completionStatLabel, { color: subColor }]}>minut</Text>
                </View>
                <View style={[s.completionStat, { borderColor: cardBorder }]}>
                  <Sparkles size={16} color={config.color} />
                  <Text style={[s.completionStatVal, { color: textColor }]}>{recentSessions.length + 1}</Text>
                  <Text style={[s.completionStatLabel, { color: subColor }]}>rytuałów</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Reflection prompts */}
          <Animated.View entering={FadeInDown.delay(200).duration(460)}>
            <Text style={[s.sectionLabel, { color: subColor, marginTop: 8 }]}>REFLEKSJA PO SESJI</Text>
            {[
              'Co poczułeś/aś w ciele podczas tego rytuału?',
              'Jaka myśl lub obraz był najbardziej wyraźny?',
              'Co chcesz zabrać z tej sesji w resztę dnia?',
            ].map((prompt, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(260 + i * 80).duration(380)}>
                <View style={[s.promptCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[s.promptNum, { color: config.color }]}>{i + 1}</Text>
                  <Text style={[s.promptText, { color: textColor }]}>{prompt}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Quick journal */}
          <Animated.View entering={FadeInDown.delay(520).duration(460)}>
            <Text style={[s.sectionLabel, { color: subColor, marginTop: 20 }]}>SZYBKI DZIENNIK</Text>
            <View style={[s.journalCard, { backgroundColor: cardBg, borderColor: journalSaved ? config.color + '55' : cardBorder }]}>
              <Text style={[s.journalPrompt, { color: subColor }]}>
                Jedno słowo lub zdanie które opisuje tę sesję…
              </Text>
              {journalSaved ? (
                <View style={s.journalSavedRow}>
                  <CheckCircle size={16} color="#5BC98E" style={{ marginRight: 8 }} />
                  <Text style={[s.journalSavedText, { color: '#5BC98E' }]}>Zapisano: "{reflectionText}"</Text>
                </View>
              ) : (
                <>
                  <TextInput
                    value={reflectionText}
                    onChangeText={setReflectionText}
                    placeholder="Spokój, klarowność, uwolnienie…"
                    placeholderTextColor={subColor}
                    style={[s.journalInput, { color: textColor, borderColor: cardBorder }]}
                    multiline
                    maxLength={200}
                  />
                  <Pressable
                    onPress={saveJournal}
                    style={[s.journalBtn, { backgroundColor: reflectionText.trim() ? config.color : cardBg }]}
                  >
                    <Text style={[s.journalBtnText, { color: reflectionText.trim() ? '#fff' : subColor }]}>
                      Zapisz notatkę
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </Animated.View>

          {/* Co dalej */}
          <Animated.View entering={FadeInDown.delay(640).duration(460)}>
            <Text style={[s.sectionLabel, { color: subColor, marginTop: 20 }]}>CO DALEJ</Text>
            {[
              { icon: BookOpen, label: 'Dziennik', sub: 'Zapisz głębszą refleksję', route: 'Journal', color: '#F9A854' },
              { icon: Star, label: 'Medytacja', sub: 'Pogłęb spokój w ciszy', route: 'Meditation', color: ACCENT },
              { icon: Wand2, label: 'Wyrocznia', sub: 'Zapytaj o intencję rytuału', route: 'OraclePortal', color: '#7B8CDE' },
              { icon: MessageCircle, label: 'Rytuały', sub: 'Wybierz kolejną praktykę', route: 'Rituals', color: '#5BC98E' },
            ].map((item, i) => (
              <Animated.View key={item.route} entering={FadeInDown.delay(700 + i * 70).duration(360)}>
                <Pressable
                  onPress={() => { HapticsService.impact('light'); navigation?.navigate(item.route); }}
                  style={({ pressed }) => [
                    s.nextRow,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                    pressed && { opacity: 0.82, transform: [{ scale: 0.985 }] },
                  ]}
                >
                  <LinearGradient colors={[item.color + '28', item.color + '0A']} style={s.nextRowGrad}>
                    <View style={[s.nextRowIcon, { backgroundColor: item.color + '28' }]}>
                      <item.icon size={18} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.nextRowLabel, { color: textColor }]}>{item.label}</Text>
                      <Text style={[s.nextRowSub, { color: subColor }]}>{item.sub}</Text>
                    </View>
                    <ChevronLeft size={16} color={subColor} style={{ transform: [{ rotate: '180deg' }] }} />
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Start new ritual button */}
          <Animated.View entering={FadeInDown.delay(900).duration(400)} style={{ marginTop: 16 }}>
            <Pressable
              onPress={() => {
                HapticsService.impact('medium');
                setPhase('selector');
                setStep(0);
                setReflectionText('');
                setJournalSaved(false);
              }}
              style={({ pressed }) => [
                s.newRitualBtn,
                { borderColor: ACCENT + '55' },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Sparkles size={16} color={ACCENT} style={{ marginRight: 8 }} />
              <Text style={[s.newRitualText, { color: ACCENT }]}>Rozpocznij nowy rytuał</Text>
            </Pressable>
          </Animated.View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── StyleSheet ──────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:             { flex: 1 },
  scrollContent:    { paddingHorizontal: layout.padding.screen, paddingTop: 8, paddingBottom: 16 },

  // Header
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.padding.screen, paddingVertical: 10, height: 52 },
  headerTitle:      { fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  headerSub:        { fontSize: 10, fontWeight: '600', letterSpacing: 1.4, marginTop: 1 },
  backBtn:          { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  iconBtn:          { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // Selector hero
  heroWrap:         { alignItems: 'center', paddingVertical: 20 },
  heroEmoji:        { fontSize: 52, marginBottom: 12 },
  heroTitle:        { fontSize: 24, fontWeight: '800', letterSpacing: -0.3, marginBottom: 8, textAlign: 'center' },
  heroSub:          { fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 320 },

  // Ritual cards
  ritualCard:       { borderRadius: 18, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  ritualCardGradient: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  ritualCardLeft:   { flexDirection: 'row', flex: 1, alignItems: 'flex-start' },
  ritualCardEmoji:  { fontSize: 30, marginRight: 14, marginTop: 2 },
  ritualCardEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 3 },
  ritualCardTitle:  { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  ritualCardDesc:   { fontSize: 13, lineHeight: 19 },
  ritualCardMeta:   { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  ritualCardMetaText: { fontSize: 11 },
  selectedDot:      { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },

  // Start button
  startBtn:         { borderRadius: 30, overflow: 'hidden', marginTop: 4 },
  startBtnGrad:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  startBtnText:     { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },

  // Section label
  sectionLabel:     { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 },

  // History
  historyRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  historyText:      { flex: 1, fontSize: 13, fontWeight: '600' },
  historyDate:      { fontSize: 12, marginRight: 8 },
  historyDur:       { fontSize: 12 },

  // Session: dots
  dotRow:           { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 6 },
  progressDot:      { width: 8, height: 8, borderRadius: 4 },

  // Session: counter
  stepCounter:      { textAlign: 'center', fontSize: 11, fontWeight: '700', letterSpacing: 1.8, marginBottom: 14 },

  // Session: ring
  ringWrap:         { alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  ringCenter:       { position: 'absolute', alignItems: 'center', justifyContent: 'center', gap: 6 },
  ringTime:         { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },

  // Session: step card
  stepCard:         { borderRadius: 22, borderWidth: 1.5, padding: 22, marginBottom: 20 },
  stepEmoji:        { fontSize: 42, textAlign: 'center', marginBottom: 10 },
  stepTitle:        { fontSize: 21, fontWeight: '800', textAlign: 'center', marginBottom: 6, letterSpacing: -0.2 },
  stepDesc:         { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 14 },
  guidanceDivider:  { borderTopWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
  guidanceLabel:    { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 6 },
  guidanceText:     { fontSize: 14, lineHeight: 23 },

  // Session: actions
  actionRow:        { gap: 10 },
  nextBtn:          { borderRadius: 28, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  nextBtnText:      { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.1 },
  stepHint:         { textAlign: 'center', fontSize: 12, marginTop: 10 },

  // Summary: completion hero
  completionHero:   { borderRadius: 22, overflow: 'hidden', marginBottom: 16 },
  completionGradient: { padding: 24, alignItems: 'center' },
  completionEmoji:  { fontSize: 54, marginBottom: 12 },
  completionTitle:  { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 6, letterSpacing: -0.2 },
  completionSub:    { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 18, maxWidth: 300 },
  completionStats:  { flexDirection: 'row', gap: 12 },
  completionStat:   { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  completionStatVal: { fontSize: 20, fontWeight: '800', marginTop: 6, marginBottom: 2 },
  completionStatLabel: { fontSize: 11 },

  // Summary: prompts
  promptCard:       { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8, gap: 12 },
  promptNum:        { fontSize: 14, fontWeight: '800', minWidth: 20 },
  promptText:       { flex: 1, fontSize: 14, lineHeight: 21 },

  // Summary: journal
  journalCard:      { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 4 },
  journalPrompt:    { fontSize: 12, marginBottom: 10, letterSpacing: 0.2 },
  journalInput:     { fontSize: 14, lineHeight: 22, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, minHeight: 72, textAlignVertical: 'top', marginBottom: 10 },
  journalBtn:       { borderRadius: 20, paddingVertical: 11, alignItems: 'center' },
  journalBtnText:   { fontSize: 14, fontWeight: '700' },
  journalSavedRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  journalSavedText: { fontSize: 14, fontWeight: '600' },

  // Summary: co dalej
  nextRow:          { borderRadius: 16, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  nextRowGrad:      { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  nextRowIcon:      { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nextRowLabel:     { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  nextRowSub:       { fontSize: 12 },

  // New ritual button
  newRitualBtn:     { borderRadius: 28, borderWidth: 1, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  newRitualText:    { fontSize: 15, fontWeight: '700' },
});

export default RitualDetailScreen;
