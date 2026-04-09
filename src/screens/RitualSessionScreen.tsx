// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn, FadeInDown, FadeOut,
  useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withSpring, withTiming, withDelay, cancelAnimation,
} from 'react-native-reanimated';
import Svg, {
  Circle, Line, Path, Defs, RadialGradient, Stop, Polygon,
} from 'react-native-svg';
import {
  ChevronLeft, Flame, Globe2, Heart, MoonStar,
  Music, Pause, Play, Send, Users, Volume2, VolumeX,
  Wind, Zap, Star, CheckCircle2, Clock, Eye, Sparkles,
  MessageSquare, X, ArrowRight,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { AudioService } from '../core/services/audio.service';
import { HapticsService } from '../core/services/haptics.service';
import { TTSService } from '../core/services/tts.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { useTranslation } from 'react-i18next';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Live chat messages ───────────────────────────────────────────────────────
const LIVE_MESSAGES = [
  { id: 'm1',  author: 'Luna V.',   flag: '🇵🇱', text: 'Czuję ogromną energię już teraz ✨',                   color: '#A78BFA' },
  { id: 'm2',  author: 'Orion K.',  flag: '🇩🇪', text: 'Przyszedłem z intencją uzdrowienia. Jestem gotowy.', color: '#6366F1' },
  { id: 'm3',  author: 'Aria Sol',  flag: '🇧🇷', text: '🌙 Kocham tę wspólnotę. Razem jesteśmy silniejsi.',  color: '#F59E0B' },
  { id: 'm4',  author: 'Vera M.',   flag: '🇫🇷', text: 'Oddycham razem z wami. Spokój...',                    color: '#10B981' },
  { id: 'm5',  author: 'Sol R.',    flag: '🇪🇸', text: 'To mój trzeci rytuał z tą grupą 🔥 Niesamowite.',    color: '#EC4899' },
  { id: 'm6',  author: 'Mira T.',   flag: '🇵🇱', text: 'Czuję jak napięcie odpływa z mojego ciała.',         color: '#60A5FA' },
  { id: 'm7',  author: 'Ember K.',  flag: '🇺🇸', text: '✦ Manifest: przyciągam to, czego naprawdę pragnę.',  color: '#F97316' },
  { id: 'm8',  author: 'Nox A.',    flag: '🇯🇵', text: 'Dziękuję za tę przestrzeń. Łzy oczyszczenia 🙏',     color: '#8B5CF6' },
  { id: 'm9',  author: 'Kira B.',   flag: '🇮🇹', text: 'Prowadząca jest niesamowita! Głęboko dotykam centrum.', color: '#34D399' },
  { id: 'm10', author: 'Zara W.',   flag: '🇬🇧', text: '🌸 Widzę piękne obrazy podczas wizualizacji...',    color: '#FB7185' },
  { id: 'm11', author: 'Daan H.',   flag: '🇳🇱', text: 'Intencja: pokój i jasność umysłu. Dziękuję',         color: '#6366F1' },
  { id: 'm12', author: 'Inara P.',  flag: '🇲🇽', text: 'Łączę się z wami wszystkimi 💜 Ogromna miłość.',     color: '#EC4899' },
];

// ─── Ritual phase steps ───────────────────────────────────────────────────────
const RITUAL_PHASES: Record<string, { label: string; color: string; steps: string[] }> = {
  'KSIĘŻYC': {
    label: 'Księżycowy Rytuał Uwalniania',
    color: '#818CF8',
    steps: [
      'Zapal świecę i połóż dłonie na sercu.',
      'Weź trzy głębokie oddechy. Poczuj ciężar nocy.',
      'Napisz na kartce to, czego chcesz się uwolnić.',
      'Powiedz głośno lub w ciszy: „Pozwalam, by to odeszło."',
      'Wyobraź sobie jak księżyc pochłania to, co puszczasz.',
      'Pozostań w wdzięczności przez chwilę ciszy.',
    ],
  },
  'OGIEŃ': {
    label: 'Ogniste Oczyszczanie',
    color: '#F97316',
    steps: [
      'Usiądź stabilnie. Poczuj żar ognia w swojej klatce piersiowej.',
      'Z każdym wydechem wyobraź sobie płomień oczyszczający twoje pole.',
      'Nazwij to, co chcesz spalić — lęk, blokadę, winę.',
      'Oddychaj szybko i rytmicznie przez nos (3 cykle po 10 oddechów).',
      'W ciszy poczuj wolną, oczyszczoną przestrzeń wewnątrz.',
      'Zamknij rytuał słowami: „Jestem wolny/a. Jestem nowy/a."',
    ],
  },
  'CZAKRY': {
    label: 'Aktywacja Czakry',
    color: '#10B981',
    steps: [
      'Połóż dłonie na centrum klatki piersiowej (czakra serca).',
      'Wyobraź sobie zielone światło rozszerzające się z każdym wdechem.',
      'Powtarzaj mantrę: „YAM" — dźwięk czakry serca.',
      'Poczuj jak serce otwiera się jak kwiat.',
      'Wyślij energię do osoby, która potrzebuje miłości.',
      'Pozostań w rozszerzonym polu miłości przez 3 minuty.',
    ],
  },
  'MEDYTACJA': {
    label: 'Głęboka Medytacja Grupowa',
    color: '#6366F1',
    steps: [
      'Znajdź stabilną pozycję. Zamknij oczy.',
      'Pozwól myślom przepłynąć bez angażowania się w nie.',
      'Skup uwagę na oddechu — sam oddech, nic więcej.',
      'Wejdź głębiej. Twoje ciało staje się coraz cięższe.',
      'W polu zbiorowej ciszy — odpocznij. Po prostu bądź.',
      'Powoli wracaj. Porusz palcami. Podziękuj ciszy.',
    ],
  },
};

const DEFAULT_PHASE = {
  label: 'Zbiorowy Rytuał',
  color: '#A78BFA',
  steps: [
    'Usiądź wygodnie i zamknij oczy.',
    'Połącz się z intencją dzisiejszego rytuału.',
    'Oddychaj świadomie i poczuj zbiorową energię.',
    'Wizualizuj swoją intencję jako jasne światło.',
    'Razem wznieśmy tę energię ku spełnieniu.',
    'Zakończ w wdzięczności i otwartości.',
  ],
};

const MUSIC_OPTS = [
  { id: 'ritual',         label: 'Rytuał',  emoji: '🕯️', color: '#F59E0B' },
  { id: 'forest',         label: 'Las',     emoji: '🌲', color: '#34D399' },
  { id: 'waves',          label: 'Fale',    emoji: '🌊', color: '#60A5FA' },
  { id: 'deepMeditation', label: 'Głęboka', emoji: '🔮', color: '#8B5CF6' },
  { id: 'voxscape',       label: 'Głosy',   emoji: '✦',  color: '#EC4899' },
];

// ─── Breathing cycle config (4-4-4 box breathing) ────────────────────────────
const BREATH_PHASES = [
  { label: 'WDECH',     duration: 4000, color: '#6366F1' },
  { label: 'ZATRZYMAJ', duration: 4000, color: '#8B5CF6' },
  { label: 'WYDECH',    duration: 4000, color: '#4C1D95' },
  { label: 'ZATRZYMAJ', duration: 4000, color: '#7C3AED' },
];

// ─── Ambient particles config ─────────────────────────────────────────────────
const PARTICLE_CONFIG = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x:        20 + Math.floor((i * 73  + 17) % (SW - 40)),
  y:        60 + Math.floor((i * 111 + 31) % (SH * 0.6)),
  size:     2 + (i % 3),
  opacity:  0.2 + (i % 4) * 0.12,
  duration: 3000 + (i * 500) % 4000,
  delay:    (i * 300) % 2000,
}));

// ─── Mandala geometry ─────────────────────────────────────────────────────────
const MANDALA_RINGS  = [16, 28, 42, 58, 76];
const MANDALA_SPOKES = 12;

// ─── Module-level shared values for particles (Rules of Hooks safe) ───────────
// 12 particles × 2 values each
const PART_Y  = PARTICLE_CONFIG.map(() => ({ sv: null as any }));
const PART_OP = PARTICLE_CONFIG.map(() => ({ sv: null as any }));

// 12 burst dots × 4 values each
const BURST_TX = Array.from({ length: 12 }, () => ({ sv: null as any }));
const BURST_TY = Array.from({ length: 12 }, () => ({ sv: null as any }));
const BURST_OP = Array.from({ length: 12 }, () => ({ sv: null as any }));
const BURST_SC = Array.from({ length: 12 }, () => ({ sv: null as any }));

// ─── ParticleItem — module-level component (hooks at its own top level) ───────
const ParticleItem = ({ cfg, yVal, opVal }: { cfg: typeof PARTICLE_CONFIG[0]; yVal: any; opVal: any }) => {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: yVal.value }],
    opacity:   opVal.value,
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: cfg.x, top: cfg.y }, animStyle]}>
      <Svg width={cfg.size * 3} height={cfg.size * 3}>
        <Circle cx={cfg.size * 1.5} cy={cfg.size * 1.5} r={cfg.size} fill="#A78BFA" fillOpacity={0.9} />
      </Svg>
    </Animated.View>
  );
};

// ─── BurstDot — module-level component ────────────────────────────────────────
const BurstDot = ({ accent, txVal, tyVal, opVal, scVal }: {
  accent: string; txVal: any; tyVal: any; opVal: any; scVal: any;
}) => {
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: txVal.value },
      { translateY: tyVal.value },
      { scale:      scVal.value },
    ],
    opacity: opVal.value,
  }));
  return (
    <Animated.View style={[
      { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: accent },
      animStyle,
    ]} />
  );
};

// ─── MandalaBackground — module-level component ───────────────────────────────
const MandalaBackground = ({ mandalaStyle, accent }: { mandalaStyle: any; accent: string }) => (
  <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, mandalaStyle]} pointerEvents="none">
    <Svg width={SW} height={SW} viewBox={`0 0 ${SW} ${SW}`}>
      <Defs>
        <RadialGradient id="mandalaBg" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor={accent} stopOpacity="0.08" />
          <Stop offset="100%" stopColor={accent} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={SW / 2} cy={SW / 2} r={SW / 2 - 2} fill="url(#mandalaBg)" />
      {MANDALA_RINGS.map((r) => (
        <Circle key={r} cx={SW / 2} cy={SW / 2} r={r * (SW / 120)} fill="none"
          stroke={accent} strokeWidth={0.6} strokeOpacity={0.18} />
      ))}
      {Array.from({ length: MANDALA_SPOKES }, (_, i) => {
        const angle = (i / MANDALA_SPOKES) * 2 * Math.PI;
        const r0    = 16 * (SW / 120);
        const r1    = 76 * (SW / 120);
        const cx    = SW / 2;
        const cy    = SW / 2;
        return (
          <Line key={i}
            x1={cx + Math.cos(angle) * r0} y1={cy + Math.sin(angle) * r0}
            x2={cx + Math.cos(angle) * r1} y2={cy + Math.sin(angle) * r1}
            stroke={accent} strokeWidth={0.5} strokeOpacity={0.14}
          />
        );
      })}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * 2 * Math.PI;
        const r     = 28 * (SW / 120);
        const cx    = SW / 2 + Math.cos(angle) * r;
        const cy    = SW / 2 + Math.sin(angle) * r;
        const pts   = `${cx},${cy - 8} ${cx + 5},${cy} ${cx},${cy + 8} ${cx - 5},${cy}`;
        return <Polygon key={i} points={pts} fill={accent} fillOpacity={0.10} />;
      })}
    </Svg>
  </Animated.View>
);

// ─── FloatingParticles — module-level component ───────────────────────────────
const FloatingParticles = ({ yVals, opVals }: { yVals: typeof PART_Y; opVals: typeof PART_OP }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {PARTICLE_CONFIG.map((p, i) => (
      <ParticleItem key={p.id} cfg={p} yVal={yVals[i].sv} opVal={opVals[i].sv} />
    ))}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const RitualSessionScreen = ({ navigation, route }: any) => {
  const { t }       = useTranslation();
  const themeName   = useAppStore(s => s.themeName);
  const theme       = getResolvedTheme(themeName);
  const isLight     = theme.background.startsWith('#F');
  const { ritual }  = route?.params ?? {};
  const insets      = useSafeAreaInsets();

  const phase  = RITUAL_PHASES[ritual?.type] ?? DEFAULT_PHASE;
  const ACCENT = phase.color;

  // ── State ──────────────────────────────────────────────────────────────────
  const [joined,         setJoined]         = useState(false);
  const [participants,   setParticipants]   = useState((ritual?.participants ?? 120) as number);
  const [elapsed,        setElapsed]        = useState(0);
  const [totalSecs]                         = useState(ritual?.live ? 600 : 900);
  const [currentStep,    setCurrentStep]    = useState(0);
  const [stepsDone,      setStepsDone]      = useState<number[]>([]);
  const [messages,       setMessages]       = useState(LIVE_MESSAGES.slice(0, 3));
  const [chatInput,      setChatInput]      = useState('');
  const [selectedMusic,  setSelectedMusic]  = useState('ritual');
  const [musicMuted,     setMusicMuted]     = useState(false);
  const [sessionEnded,   setSessionEnded]   = useState(false);
  const [intention,      setIntention]      = useState('');
  const [intentionSent,  setIntentionSent]  = useState(false);
  const [reactions,      setReactions]      = useState({ love: 234, light: 189, fire: 156 });
  const [breathPhaseIdx, setBreathPhaseIdx] = useState(0);
  const [burstVisible,   setBurstVisible]   = useState(false);

  // ── Chat drawer state ──────────────────────────────────────────────────────
  const [chatDrawerOpen,  setChatDrawerOpen]  = useState(false);
  const [drawerInput,     setDrawerInput]     = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [drawerMessages,  setDrawerMessages]  = useState([
    { id: 'dm1', author: 'Luna V.',  initials: 'L', avatarColor: '#8B5CF6', text: 'Czuję niezwykłą energię już teraz ✨',        time: 'teraz', isOwn: false },
    { id: 'dm2', author: 'Orion K.', initials: 'O', avatarColor: '#6366F1', text: 'Przyłączam się z intencją uzdrowienia 🙏',    time: '1 min', isOwn: false },
    { id: 'dm3', author: 'Aria Sol', initials: 'A', avatarColor: '#F59E0B', text: 'Razem tworzymy silne pole 🌙',                 time: '2 min', isOwn: false },
    { id: 'dm4', author: 'Vera M.',  initials: 'V', avatarColor: '#10B981', text: 'Spokój i wdzięczność 💚',                      time: '3 min', isOwn: false },
  ]);

  const QUICK_EMOJIS = ['🙏', '✨', '💜', '🌙', '🔥', '💫', '✦', '🌸'];

  // ── Refs ───────────────────────────────────────────────────────────────────
  const intervalRef       = useRef<NodeJS.Timeout | null>(null);
  const msgIntervalRef    = useRef<NodeJS.Timeout | null>(null);
  const breathIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef         = useRef<ScrollView>(null);
  const chatScrollRef     = useRef<ScrollView>(null);
  const drawerScrollRef   = useRef<ScrollView>(null);
  const msgIndex          = useRef(3);

  // ── Shared animation values — all at component top level ──────────────────
  const mandalaRot         = useSharedValue(0);
  const breathScale        = useSharedValue(0.95);
  const breathGlow         = useSharedValue(0.4);
  const outerRingScale     = useSharedValue(1);
  const checkProgress      = useSharedValue(0);
  const stepOpacity        = useSharedValue(1);
  const chatTranslateY     = useSharedValue(SH);
  const chatOverlayOpacity = useSharedValue(0);
  const paxPulse           = useSharedValue(1);

  // Particle shared values — 12 Y + 12 opacity, at top level
  const pY0  = useSharedValue(0); const pO0  = useSharedValue(PARTICLE_CONFIG[0].opacity);
  const pY1  = useSharedValue(0); const pO1  = useSharedValue(PARTICLE_CONFIG[1].opacity);
  const pY2  = useSharedValue(0); const pO2  = useSharedValue(PARTICLE_CONFIG[2].opacity);
  const pY3  = useSharedValue(0); const pO3  = useSharedValue(PARTICLE_CONFIG[3].opacity);
  const pY4  = useSharedValue(0); const pO4  = useSharedValue(PARTICLE_CONFIG[4].opacity);
  const pY5  = useSharedValue(0); const pO5  = useSharedValue(PARTICLE_CONFIG[5].opacity);
  const pY6  = useSharedValue(0); const pO6  = useSharedValue(PARTICLE_CONFIG[6].opacity);
  const pY7  = useSharedValue(0); const pO7  = useSharedValue(PARTICLE_CONFIG[7].opacity);
  const pY8  = useSharedValue(0); const pO8  = useSharedValue(PARTICLE_CONFIG[8].opacity);
  const pY9  = useSharedValue(0); const pO9  = useSharedValue(PARTICLE_CONFIG[9].opacity);
  const pY10 = useSharedValue(0); const pO10 = useSharedValue(PARTICLE_CONFIG[10].opacity);
  const pY11 = useSharedValue(0); const pO11 = useSharedValue(PARTICLE_CONFIG[11].opacity);

  // Burst shared values — 12 dots × 4 axes, at top level
  const bTX0  = useSharedValue(0); const bTY0  = useSharedValue(0); const bOP0  = useSharedValue(0); const bSC0  = useSharedValue(0);
  const bTX1  = useSharedValue(0); const bTY1  = useSharedValue(0); const bOP1  = useSharedValue(0); const bSC1  = useSharedValue(0);
  const bTX2  = useSharedValue(0); const bTY2  = useSharedValue(0); const bOP2  = useSharedValue(0); const bSC2  = useSharedValue(0);
  const bTX3  = useSharedValue(0); const bTY3  = useSharedValue(0); const bOP3  = useSharedValue(0); const bSC3  = useSharedValue(0);
  const bTX4  = useSharedValue(0); const bTY4  = useSharedValue(0); const bOP4  = useSharedValue(0); const bSC4  = useSharedValue(0);
  const bTX5  = useSharedValue(0); const bTY5  = useSharedValue(0); const bOP5  = useSharedValue(0); const bSC5  = useSharedValue(0);
  const bTX6  = useSharedValue(0); const bTY6  = useSharedValue(0); const bOP6  = useSharedValue(0); const bSC6  = useSharedValue(0);
  const bTX7  = useSharedValue(0); const bTY7  = useSharedValue(0); const bOP7  = useSharedValue(0); const bSC7  = useSharedValue(0);
  const bTX8  = useSharedValue(0); const bTY8  = useSharedValue(0); const bOP8  = useSharedValue(0); const bSC8  = useSharedValue(0);
  const bTX9  = useSharedValue(0); const bTY9  = useSharedValue(0); const bOP9  = useSharedValue(0); const bSC9  = useSharedValue(0);
  const bTX10 = useSharedValue(0); const bTY10 = useSharedValue(0); const bOP10 = useSharedValue(0); const bSC10 = useSharedValue(0);
  const bTX11 = useSharedValue(0); const bTY11 = useSharedValue(0); const bOP11 = useSharedValue(0); const bSC11 = useSharedValue(0);

  // Store refs into module-level arrays so sub-components & triggerBurst can access them
  // (safe to do in render since values are stable references)
  PART_Y[0].sv  = pY0;  PART_OP[0].sv  = pO0;
  PART_Y[1].sv  = pY1;  PART_OP[1].sv  = pO1;
  PART_Y[2].sv  = pY2;  PART_OP[2].sv  = pO2;
  PART_Y[3].sv  = pY3;  PART_OP[3].sv  = pO3;
  PART_Y[4].sv  = pY4;  PART_OP[4].sv  = pO4;
  PART_Y[5].sv  = pY5;  PART_OP[5].sv  = pO5;
  PART_Y[6].sv  = pY6;  PART_OP[6].sv  = pO6;
  PART_Y[7].sv  = pY7;  PART_OP[7].sv  = pO7;
  PART_Y[8].sv  = pY8;  PART_OP[8].sv  = pO8;
  PART_Y[9].sv  = pY9;  PART_OP[9].sv  = pO9;
  PART_Y[10].sv = pY10; PART_OP[10].sv = pO10;
  PART_Y[11].sv = pY11; PART_OP[11].sv = pO11;

  BURST_TX[0].sv  = bTX0;  BURST_TY[0].sv  = bTY0;  BURST_OP[0].sv  = bOP0;  BURST_SC[0].sv  = bSC0;
  BURST_TX[1].sv  = bTX1;  BURST_TY[1].sv  = bTY1;  BURST_OP[1].sv  = bOP1;  BURST_SC[1].sv  = bSC1;
  BURST_TX[2].sv  = bTX2;  BURST_TY[2].sv  = bTY2;  BURST_OP[2].sv  = bOP2;  BURST_SC[2].sv  = bSC2;
  BURST_TX[3].sv  = bTX3;  BURST_TY[3].sv  = bTY3;  BURST_OP[3].sv  = bOP3;  BURST_SC[3].sv  = bSC3;
  BURST_TX[4].sv  = bTX4;  BURST_TY[4].sv  = bTY4;  BURST_OP[4].sv  = bOP4;  BURST_SC[4].sv  = bSC4;
  BURST_TX[5].sv  = bTX5;  BURST_TY[5].sv  = bTY5;  BURST_OP[5].sv  = bOP5;  BURST_SC[5].sv  = bSC5;
  BURST_TX[6].sv  = bTX6;  BURST_TY[6].sv  = bTY6;  BURST_OP[6].sv  = bOP6;  BURST_SC[6].sv  = bSC6;
  BURST_TX[7].sv  = bTX7;  BURST_TY[7].sv  = bTY7;  BURST_OP[7].sv  = bOP7;  BURST_SC[7].sv  = bSC7;
  BURST_TX[8].sv  = bTX8;  BURST_TY[8].sv  = bTY8;  BURST_OP[8].sv  = bOP8;  BURST_SC[8].sv  = bSC8;
  BURST_TX[9].sv  = bTX9;  BURST_TY[9].sv  = bTY9;  BURST_OP[9].sv  = bOP9;  BURST_SC[9].sv  = bSC9;
  BURST_TX[10].sv = bTX10; BURST_TY[10].sv = bTY10; BURST_OP[10].sv = bOP10; BURST_SC[10].sv = bSC10;
  BURST_TX[11].sv = bTX11; BURST_TY[11].sv = bTY11; BURST_OP[11].sv = bOP11; BURST_SC[11].sv = bSC11;

  // ── All particle & burst values as flat arrays for loops ──────────────────
  const particleYVals  = [pY0, pY1, pY2, pY3, pY4, pY5, pY6, pY7, pY8, pY9, pY10, pY11];
  const particleOpVals = [pO0, pO1, pO2, pO3, pO4, pO5, pO6, pO7, pO8, pO9, pO10, pO11];
  const burstTXVals    = [bTX0, bTX1, bTX2, bTX3, bTX4, bTX5, bTX6, bTX7, bTX8, bTX9, bTX10, bTX11];
  const burstTYVals    = [bTY0, bTY1, bTY2, bTY3, bTY4, bTY5, bTY6, bTY7, bTY8, bTY9, bTY10, bTY11];
  const burstOPVals    = [bOP0, bOP1, bOP2, bOP3, bOP4, bOP5, bOP6, bOP7, bOP8, bOP9, bOP10, bOP11];
  const burstSCVals    = [bSC0, bSC1, bSC2, bSC3, bSC4, bSC5, bSC6, bSC7, bSC8, bSC9, bSC10, bSC11];

  // ── Start all ambient animations ──────────────────────────────────────────
  useEffect(() => {
    mandalaRot.value = withRepeat(withTiming(360, { duration: 60000 }), -1, false);

    outerRingScale.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 4000 }), withTiming(0.95, { duration: 4000 })),
      -1, false,
    );

    paxPulse.value = withRepeat(
      withSequence(withTiming(1.3, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1, false,
    );

    PARTICLE_CONFIG.forEach((p, i) => {
      particleYVals[i].value = withDelay(
        p.delay,
        withRepeat(
          withSequence(withTiming(-18, { duration: p.duration }), withTiming(0, { duration: p.duration })),
          -1, false,
        ),
      );
      particleOpVals[i].value = withDelay(
        p.delay,
        withRepeat(
          withSequence(
            withTiming(p.opacity * 2.2, { duration: p.duration }),
            withTiming(p.opacity * 0.3, { duration: p.duration }),
          ),
          -1, false,
        ),
      );
    });

    return () => {
      cancelAnimation(mandalaRot);
      cancelAnimation(outerRingScale);
      cancelAnimation(paxPulse);
      particleYVals.forEach(v  => cancelAnimation(v));
      particleOpVals.forEach(v => cancelAnimation(v));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Breathing animation cycle ─────────────────────────────────────────────
  useEffect(() => {
    const cycle = () => {
      BREATH_PHASES.forEach((bp, i) => {
        const isInhale    = i === 0;
        const isExhale    = i === 2;
        const targetScale = isInhale ? 1.12 : isExhale ? 0.9  : 1.01;
        const targetGlow  = isInhale ? 0.9  : isExhale ? 0.25 : 0.55;
        const delay = BREATH_PHASES.slice(0, i).reduce((acc, b) => acc + b.duration, 0);
        breathScale.value = withDelay(delay, withTiming(targetScale, { duration: bp.duration - 200 }));
        breathGlow.value  = withDelay(delay, withTiming(targetGlow,  { duration: bp.duration - 200 }));
      });
    };
    cycle();
    const totalCycle = BREATH_PHASES.reduce((a, b) => a + b.duration, 0);
    breathIntervalRef.current = setInterval(cycle, totalCycle);

    let idx = 0;
    const labelInterval = setInterval(() => {
      idx = (idx + 1) % BREATH_PHASES.length;
      setBreathPhaseIdx(idx);
    }, BREATH_PHASES[0].duration);

    return () => {
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
      clearInterval(labelInterval);
      cancelAnimation(breathScale);
      cancelAnimation(breathGlow);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Animated styles ────────────────────────────────────────────────────────
  const mandalaStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${mandalaRot.value}deg` }],
  }));

  const breathRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerRingScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: breathGlow.value,
  }));

  const paxDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: paxPulse.value }],
    opacity: paxPulse.value * 0.75,
  }));

  const chatDrawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chatTranslateY.value }],
  }));

  const chatOverlayStyle = useAnimatedStyle(() => ({
    opacity: chatOverlayOpacity.value,
  }));

  // ── Session controls ───────────────────────────────────────────────────────
  const startSession = useCallback(() => {
    setJoined(true);
    HapticsService.notify();
    if (!musicMuted) AudioService.playAmbientForSession(selectedMusic as any);
    setTimeout(() => {
      TTSService.speak(`Witaj w rytuale: ${phase.label}. Jesteśmy razem. Zacznijmy.`);
    }, 800);

    intervalRef.current = setInterval(() => {
      setElapsed(v => {
        if (v + 1 >= totalSecs) {
          endSession();
          return totalSecs;
        }
        return v + 1;
      });
      if (Math.random() < 0.08) setParticipants(p => p + Math.ceil(Math.random() * 3));
    }, 1000);

    msgIntervalRef.current = setInterval(() => {
      if (msgIndex.current < LIVE_MESSAGES.length) {
        setMessages(prev => [...prev, LIVE_MESSAGES[msgIndex.current]]);
        msgIndex.current += 1;
        setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    }, 4500);
  }, [musicMuted, selectedMusic, phase.label, totalSecs]);

  const triggerCompletionBurst = useCallback(() => {
    setBurstVisible(true);
    Array.from({ length: 12 }, (_, i) => {
      const angle = (i * 30 * Math.PI) / 180;
      const dist  = 80 + (i % 3) * 30;
      burstTXVals[i].value = 0;
      burstTYVals[i].value = 0;
      burstOPVals[i].value = 1;
      burstSCVals[i].value = 0.5;
      burstTXVals[i].value = withTiming(Math.cos(angle) * dist, { duration: 900 });
      burstTYVals[i].value = withTiming(Math.sin(angle) * dist, { duration: 900 });
      burstSCVals[i].value = withSequence(withTiming(1.4, { duration: 400 }), withTiming(0, { duration: 500 }));
      burstOPVals[i].value = withSequence(withTiming(1,   { duration: 300 }), withDelay(400, withTiming(0, { duration: 500 })));
    });
    setTimeout(() => setBurstVisible(false), 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endSession = useCallback(() => {
    if (intervalRef.current)    { clearInterval(intervalRef.current);    intervalRef.current    = null; }
    if (msgIntervalRef.current) { clearInterval(msgIntervalRef.current); msgIntervalRef.current = null; }
    setSessionEnded(true);
    setJoined(false);
    AudioService.pauseAmbientSound();
    TTSService.speak('Rytuał zakończony. Zabierz ze sobą tę energię. Dziękujemy, że byłeś z nami.');
    HapticsService.impact('heavy');
    triggerCompletionBurst();
    checkProgress.value = withTiming(1, { duration: 1200 });
  }, [triggerCompletionBurst]);

  useEffect(() => () => {
    if (intervalRef.current)    clearInterval(intervalRef.current);
    if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
    AudioService.pauseAmbientSound();
    void TTSService.stop();
  }, []);

  const toggleMute = () => {
    const next = !musicMuted;
    setMusicMuted(next);
    if (next) AudioService.pauseAmbientSound();
    else if (joined) AudioService.playAmbientForSession(selectedMusic as any);
    HapticsService.impact('light');
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = { id: `user_${Date.now()}`, author: 'Ty', flag: '🇵🇱', text: chatInput.trim(), color: ACCENT, isOwn: true };
    setMessages(prev => [...prev, msg]);
    setChatInput('');
    HapticsService.impact('light');
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const toggleStep = (i: number) => {
    HapticsService.selection();
    setStepsDone(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const advanceStep = () => {
    if (currentStep < phase.steps.length - 1) {
      stepOpacity.value = withSequence(withTiming(0, { duration: 200 }), withTiming(1, { duration: 300 }));
      setCurrentStep(s => s + 1);
      HapticsService.impact('medium');
    }
  };

  const addReaction = (key: keyof typeof reactions) => {
    setReactions(r => ({ ...r, [key]: r[key] + 1 }));
    HapticsService.impact('light');
  };

  const openChatDrawer = () => {
    setChatDrawerOpen(true);
    chatTranslateY.value     = withSpring(0, { damping: 22, stiffness: 160 });
    chatOverlayOpacity.value = withTiming(1, { duration: 250 });
    HapticsService.impact('light');
  };

  const closeChatDrawer = () => {
    chatTranslateY.value     = withSpring(SH * 0.5, { damping: 22, stiffness: 160 });
    chatOverlayOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => setChatDrawerOpen(false), 280);
    HapticsService.impact('light');
  };

  const sendDrawerMessage = () => {
    if (!drawerInput.trim()) return;
    const msg = { id: `dm_user_${Date.now()}`, author: 'Ty', initials: 'T', avatarColor: ACCENT, text: drawerInput.trim(), time: 'teraz', isOwn: true };
    setDrawerMessages(prev => [...prev, msg]);
    setDrawerInput('');
    setEmojiPickerOpen(false);
    HapticsService.impact('light');
    setTimeout(() => drawerScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendQuickEmoji = (emoji: string) => {
    const msg = { id: `dm_emoji_${Date.now()}`, author: 'Ty', initials: 'T', avatarColor: ACCENT, text: emoji, time: 'teraz', isOwn: true };
    setDrawerMessages(prev => [...prev, msg]);
    setEmojiPickerOpen(false);
    HapticsService.impact('light');
    setTimeout(() => drawerScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const progress       = Math.min(elapsed / totalSecs, 1);
  const mins           = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs           = (elapsed % 60).toString().padStart(2, '0');
  const remaining      = totalSecs - elapsed;
  const remMins        = Math.floor(remaining / 60).toString().padStart(2, '0');
  const remSecs        = (remaining % 60).toString().padStart(2, '0');
  const currentBreath  = BREATH_PHASES[breathPhaseIdx];

  const ICON_MAP: Record<string, React.ComponentType<any>> = {
    MoonStar, Flame, Zap, Globe2, Sparkles, Wind, Heart, Star,
  };
  const Icon = (ritual?.iconName ? ICON_MAP[ritual.iconName] : undefined) ?? ritual?.icon ?? Sparkles;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#080414' }}>
      {/* Full-screen cinematic dark gradient */}
      <LinearGradient
        colors={['#0C0720', '#0A0518', '#060212', '#080318']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Accent glow at top */}
      <LinearGradient
        colors={[ACCENT + '22', 'transparent']}
        style={[StyleSheet.absoluteFill, { height: SH * 0.5 }]}
        pointerEvents="none"
      />

      {/* Mandala & particles */}
      <View style={[StyleSheet.absoluteFill, { top: SH * 0.06, opacity: 0.18 }]} pointerEvents="none">
        <MandalaBackground mandalaStyle={mandalaStyle} accent={ACCENT} />
      </View>
      <FloatingParticles yVals={PART_Y} opVals={PART_OP} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <View style={sh.header}>
          <Pressable
            onPress={() => { AudioService.pauseAmbientSound(); void TTSService.stop(); goBackOrToMainTab(navigation, 'Portal'); }}
            hitSlop={14}
          >
            <BlurView intensity={30} tint="dark" style={sh.backBtn}>
              <ChevronLeft color="rgba(255,255,255,0.85)" size={20} strokeWidth={1.8} />
            </BlurView>
          </Pressable>

          <View style={{ flex: 1, alignItems: 'center' }}>
            {ritual?.live && (
              <View style={sh.liveBadge}>
                <View style={sh.liveDotRed} />
                <Text style={sh.liveBadgeText}>NA ŻYWO</Text>
              </View>
            )}
            <Text style={sh.headerTitle} numberOfLines={1}>{phase.label}</Text>
            <View style={sh.phaseDots}>
              {phase.steps.map((_, i) => (
                <View key={i} style={[sh.phaseDot, {
                  backgroundColor: i <= currentStep ? ACCENT : 'rgba(255,255,255,0.15)',
                  width: i === currentStep ? 12 : 5,
                  shadowColor:   i === currentStep ? ACCENT : 'transparent',
                  shadowRadius:  4,
                  shadowOpacity: 0.9,
                  elevation:     i === currentStep ? 4 : 0,
                }]} />
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <MusicToggleButton color={ACCENT} size={18} />
            <View style={[sh.paxBadge, { borderColor: ACCENT + '55' }]}>
              <Animated.View style={[sh.paxDot, { backgroundColor: '#4ADE80' }, paxDotStyle]} />
              <Text style={[sh.paxText, { color: ACCENT }]}>{participants.toLocaleString()}</Text>
              <Text style={sh.paxSuffix}>dusz</Text>
            </View>
          </View>
        </View>

        {/* ── SCROLLABLE BODY ────────────────────────────────────────────── */}
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── BREATHING RING ──────────────────────────────────────────── */}
          <View style={sh.breathSection}>
            <Animated.View style={[sh.outerRing, { borderColor: ACCENT + '28' }, outerRingStyle]} />
            <Animated.View style={[sh.midRing,   { borderColor: ACCENT + '18' }]} />

            {/* SVG radial glow — Animated wrapper around View, not SVG */}
            <View style={sh.breathGlowContainer} pointerEvents="none">
              <Animated.View style={glowStyle}>
                <Svg width={220} height={220}>
                  <Defs>
                    <RadialGradient id="breathGlow" cx="50%" cy="50%" r="50%">
                      <Stop offset="0%"   stopColor={currentBreath.color} stopOpacity="0.55" />
                      <Stop offset="60%"  stopColor={currentBreath.color} stopOpacity="0.18" />
                      <Stop offset="100%" stopColor={currentBreath.color} stopOpacity="0" />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={110} cy={110} r={100} fill="url(#breathGlow)" />
                </Svg>
              </Animated.View>
            </View>

            {/* Outer: scale wrapper; inner: static SVG + label (no combined entering+transform) */}
            <Animated.View style={[sh.breathRingWrap, breathRingStyle]}>
              <Svg width={220} height={220}>
                <Circle cx={110} cy={110} r={104} fill="none" stroke={currentBreath.color} strokeWidth={1.5} strokeOpacity={0.6} />
                <Circle cx={110} cy={110} r={88}  fill="none" stroke={currentBreath.color} strokeWidth={0.8} strokeOpacity={0.3} />
                <Circle cx={110} cy={110} r={72}  fill={currentBreath.color} fillOpacity={0.22} />
                <Circle cx={110} cy={110} r={10}  fill={currentBreath.color} fillOpacity={0.7} />
              </Svg>
              <View style={sh.breathLabelWrap}>
                <Text style={[sh.breathLabel, { color: currentBreath.color }]}>{currentBreath.label}</Text>
                <Text style={sh.breathSub}>box breathing 4-4-4</Text>
                <Text style={sh.breathParticipants}>{participants.toLocaleString()}</Text>
                <Text style={sh.breathParticipantsSub}>razem z tobą</Text>
              </View>
            </Animated.View>
          </View>

          {/* ── SESSION TIMER BAR ───────────────────────────────────────── */}
          {joined && !sessionEnded && (
            <Animated.View entering={FadeInDown.duration(400)} style={sh.timerBar}>
              <View style={sh.timerBarInner}>
                <Clock size={11} color="rgba(255,255,255,0.5)" />
                <Text style={sh.timerElapsed}>{mins}:{secs}</Text>
                <View style={sh.timerProgressTrack}>
                  <LinearGradient
                    colors={[ACCENT, ACCENT + 'AA']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[sh.timerProgressFill, { width: `${progress * 100}%` }]}
                  />
                </View>
                <Text style={sh.timerRemaining}>{remMins}:{remSecs}</Text>
              </View>
            </Animated.View>
          )}

          {/* ── JOIN / END BUTTON ───────────────────────────────────────── */}
          {!sessionEnded && (
            <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 22 }}>
              <Pressable onPress={joined ? endSession : startSession}>
                <LinearGradient
                  colors={joined ? ['#991B1B', '#EF4444'] : [ACCENT + 'EE', ACCENT]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={sh.joinBtn}
                >
                  {joined
                    ? <Pause color="#fff" size={18} strokeWidth={2.2} />
                    : <Play  color="#fff" size={18} strokeWidth={2.2} />}
                  <Text style={sh.joinBtnText}>
                    {joined ? 'Zakończ rytuał' : 'Dołącz do rytuału'}
                  </Text>
                  {!joined && <Sparkles color="rgba(255,255,255,0.75)" size={14} />}
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* ── COMPLETION BURST & BANNER ───────────────────────────────── */}
          {sessionEnded && (
            <Animated.View entering={FadeInDown.duration(700)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 24, alignItems: 'center' }}>
              {/* Burst particle dots */}
              {burstVisible && (
                <View style={{ position: 'absolute', top: 30, alignItems: 'center', justifyContent: 'center', width: 1, height: 1 }}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <BurstDot key={i}
                      accent={ACCENT}
                      txVal={burstTXVals[i]} tyVal={burstTYVals[i]}
                      opVal={burstOPVals[i]} scVal={burstSCVals[i]}
                    />
                  ))}
                </View>
              )}

              {/* Checkmark */}
              <View style={[sh.completionCircle, { borderColor: ACCENT + '80' }]}>
                <LinearGradient colors={[ACCENT + '44', ACCENT + '18']} style={StyleSheet.absoluteFill} borderRadius={60} />
                <Svg width={60} height={60} viewBox="0 0 60 60">
                  <Path d="M14 30 L25 41 L46 19" stroke={ACCENT} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              </View>

              <Text style={sh.completionTitle}>Rytuał zakończony ✦</Text>
              <Text style={sh.completionSub}>
                Przebywałeś {mins}:{secs} w zbiorowym polu świadomości.{'\n'}Zabierz ze sobą tę energię.
              </Text>

              <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')}>
                <LinearGradient colors={[ACCENT + 'CC', ACCENT + '77']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={sh.returnBtn}>
                  <Text style={sh.returnBtnText}>Wróć do Portalu</Text>
                  <ArrowRight color="#fff" size={16} />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* ── CINEMATIC STEP DISPLAY ──────────────────────────────────── */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 22 }}>
            <View style={[sh.stepsBlock, { borderColor: ACCENT + '22' }]}>
              <LinearGradient colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']} style={StyleSheet.absoluteFill} borderRadius={24} />

              {currentStep > 0 && (
                <Text style={sh.stepGhost} numberOfLines={2}>{phase.steps[currentStep - 1]}</Text>
              )}

              <View style={[sh.stepCurrentRow, { borderColor: ACCENT + '35' }]}>
                <View style={[sh.stepCurrentDot, { backgroundColor: ACCENT }]} />
                <Text style={sh.stepCurrentText}>{phase.steps[currentStep]}</Text>
              </View>

              <View style={sh.stepCounterRow}>
                <Text style={[sh.stepCounter, { color: ACCENT }]}>
                  Krok {currentStep + 1} z {phase.steps.length}
                </Text>
                <View style={sh.stepProgressTrack}>
                  <LinearGradient
                    colors={[ACCENT, ACCENT + '66']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[sh.stepProgressFill, { width: `${((currentStep + 1) / phase.steps.length) * 100}%` }]}
                  />
                </View>
              </View>

              {currentStep < phase.steps.length - 1 && (
                <Text style={sh.stepGhost} numberOfLines={2}>
                  Następnie: {phase.steps[currentStep + 1]}
                </Text>
              )}

              {currentStep < phase.steps.length - 1 && (
                <Pressable onPress={advanceStep}>
                  <LinearGradient
                    colors={[ACCENT + '44', ACCENT + '22']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[sh.nextStepBtn, { borderColor: ACCENT + '55' }]}
                  >
                    <Text style={[sh.nextStepBtnText, { color: ACCENT }]}>Następny krok</Text>
                    <ArrowRight color={ACCENT} size={14} />
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          </View>

          {/* ── CHECKLIST STEPS ─────────────────────────────────────────── */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 22 }}>
            <Text style={[sh.sectionLabel, { color: ACCENT }]}>KROKI RYTUAŁU</Text>
            <View style={[sh.stepsCard, { borderColor: ACCENT + '20' }]}>
              <LinearGradient colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']} style={StyleSheet.absoluteFill} borderRadius={20} />
              {phase.steps.map((step, i) => {
                const done      = stepsDone.includes(i);
                const isCurrent = i === currentStep;
                return (
                  <Pressable key={i} onPress={() => toggleStep(i)}
                    style={[sh.stepRow, i < phase.steps.length - 1 && { borderBottomWidth: 1, borderBottomColor: ACCENT + '12' }]}>
                    <View style={[sh.stepCircle, {
                      borderColor:     done ? ACCENT : isCurrent ? ACCENT + '80' : 'rgba(255,255,255,0.18)',
                      backgroundColor: done ? ACCENT : isCurrent ? ACCENT + '22' : 'transparent',
                    }]}>
                      {done
                        ? <CheckCircle2 color="#fff" size={13} />
                        : <Text style={[sh.stepNum, { color: isCurrent ? ACCENT : 'rgba(255,255,255,0.4)' }]}>{i + 1}</Text>}
                    </View>
                    <Text style={[sh.stepText, {
                      color:              done ? 'rgba(255,255,255,0.35)' : isCurrent ? '#F0EAFF' : 'rgba(255,255,255,0.65)',
                      textDecorationLine: done ? 'line-through' : 'none',
                    }]}>
                      {step}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── INTENTION ───────────────────────────────────────────────── */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 22 }}>
            <Text style={[sh.sectionLabel, { color: ACCENT }]}>TWOJA INTENCJA</Text>
            {!intentionSent ? (
              <View style={[sh.intentionCard, { borderColor: ACCENT + '25' }]}>
                <LinearGradient colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']} style={StyleSheet.absoluteFill} borderRadius={18} />
                <TextInput
                  value={intention}
                  onChangeText={setIntention}
                  placeholder="Wpisz intencję, którą wnosisz do zbiorowego pola..."
                  placeholderTextColor="rgba(200,185,255,0.35)"
                  multiline
                  style={[sh.intentionInput, { color: '#F0EAFF' }]}
                />
                <Pressable
                  onPress={() => { if (intention.trim()) { setIntentionSent(true); HapticsService.notify(); } }}
                  style={[sh.intentionSendBtn, { borderColor: ACCENT + '55' }]}
                >
                  <LinearGradient colors={[ACCENT + '44', ACCENT + '22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={sh.intentionSendGrad} borderRadius={12}>
                    <Send size={13} color={ACCENT} />
                    <Text style={[sh.intentionSendText, { color: ACCENT }]}>Wyślij intencję do kręgu</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            ) : (
              <Animated.View entering={FadeIn.duration(500)} style={[sh.intentionSentBox, { borderColor: ACCENT + '45' }]}>
                <LinearGradient colors={[ACCENT + '20', ACCENT + '08']} style={StyleSheet.absoluteFill} borderRadius={16} />
                <CheckCircle2 color={ACCENT} size={18} />
                <Text style={[sh.intentionSentText, { color: 'rgba(240,234,255,0.85)' }]}>„{intention}"</Text>
              </Animated.View>
            )}
          </View>

          {/* ── COLLECTIVE REACTIONS ────────────────────────────────────── */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 22 }}>
            <Text style={[sh.sectionLabel, { color: ACCENT }]}>ZBIOROWA ENERGIA</Text>
            <View style={sh.reactionsRow}>
              {[
                { key: 'love',  emoji: '💜', label: 'Miłość',    count: reactions.love  },
                { key: 'light', emoji: '✨',  label: 'Światło',   count: reactions.light },
                { key: 'fire',  emoji: '🔥', label: 'Przemiana', count: reactions.fire  },
              ].map(r => (
                <Pressable key={r.key} onPress={() => addReaction(r.key as any)}
                  style={[sh.reactionBtn, { borderColor: ACCENT + '25' }]}>
                  <LinearGradient colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']} style={StyleSheet.absoluteFill} borderRadius={18} />
                  <Text style={{ fontSize: 24 }}>{r.emoji}</Text>
                  <Text style={sh.reactionCount}>{r.count}</Text>
                  <Text style={sh.reactionLabel}>{r.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── MUSIC SELECTOR ──────────────────────────────────────────── */}
          <View style={{ marginBottom: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.padding.screen, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Music size={12} color={ACCENT} />
                <Text style={[sh.sectionLabel, { color: ACCENT, marginBottom: 0 }]}>MUZYKA RYTUAŁU</Text>
              </View>
              <Pressable onPress={toggleMute} style={[sh.muteBtn, { borderColor: ACCENT + '30' }]}>
                {musicMuted ? <VolumeX size={13} color="rgba(255,255,255,0.45)" /> : <Volume2 size={13} color={ACCENT} />}
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 10 }}>
              {MUSIC_OPTS.map(opt => {
                const active = selectedMusic === opt.id;
                return (
                  <Pressable key={opt.id}
                    onPress={() => { setSelectedMusic(opt.id); HapticsService.impact('light'); if (joined && !musicMuted) AudioService.playAmbientForSession(opt.id as any); }}
                    style={[sh.musicChip, { borderColor: active ? opt.color : 'rgba(255,255,255,0.12)' }]}>
                    {active && <LinearGradient colors={[opt.color + '38', opt.color + '14']} style={StyleSheet.absoluteFill} borderRadius={14} />}
                    <Text style={{ fontSize: 17 }}>{opt.emoji}</Text>
                    <Text style={[sh.musicChipLabel, { color: active ? opt.color : 'rgba(255,255,255,0.5)' }]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ── LIVE CHAT ───────────────────────────────────────────────── */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Eye size={12} color={ACCENT} />
              <Text style={[sh.sectionLabel, { color: ACCENT, marginBottom: 0 }]}>ŻYWY CZAT KRĘGU</Text>
            </View>
            <View style={[sh.chatContainer, { borderColor: ACCENT + '20' }]}>
              <LinearGradient colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']} style={StyleSheet.absoluteFill} borderRadius={20} />
              <ScrollView ref={chatScrollRef} style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}
                onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}>
                {messages.map((msg: any) => (
                  <View key={msg.id} style={[sh.chatMsg, msg.isOwn && sh.chatMsgOwn]}>
                    <View style={[sh.chatAvatar, { backgroundColor: msg.color + '30' }]}>
                      <Text style={{ fontSize: 12 }}>{msg.flag}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[sh.chatAuthor, { color: msg.color }]}>{msg.author}</Text>
                      <Text style={[sh.chatText, { color: 'rgba(240,234,255,0.8)' }]}>{msg.text}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={[sh.chatInputRow, { borderTopColor: ACCENT + '18' }]}>
                <TextInput
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder="Napisz do kręgu..."
                  placeholderTextColor="rgba(200,185,255,0.3)"
                  style={[sh.chatInput, { color: '#F0EAFF' }]}
                  onSubmitEditing={sendChat}
                  returnKeyType="send"
                />
                <Pressable onPress={sendChat} style={[sh.chatSendBtn, { backgroundColor: ACCENT + 'CC' }]}>
                  <Send size={13} color="#fff" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* ── HOST INFO ───────────────────────────────────────────────── */}
          {ritual?.host && (
            <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 18 }}>
              <View style={[sh.hostCard, { borderColor: ACCENT + '22' }]}>
                <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} style={StyleSheet.absoluteFill} borderRadius={18} />
                <View style={[sh.hostAvatar, { backgroundColor: ACCENT + '30' }]}>
                  <Sparkles size={17} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={sh.hostName}>{ritual.host}</Text>
                  <Text style={sh.hostRole}>Prowadząca rytuał · Mistrzyni ceremonii</Text>
                </View>
                <View style={[sh.hostOnline, { backgroundColor: '#4ADE80' }]} />
              </View>
            </View>
          )}

          <EndOfContentSpacer size="airy" />
        </ScrollView>

        {/* ── FLOATING CHAT FAB ──────────────────────────────────────────── */}
        <View style={[sh.chatFab, { bottom: insets.bottom + 92 }]}>
          <Pressable onPress={openChatDrawer} style={[sh.chatFabBtn, { backgroundColor: ACCENT }]}>
            <MessageSquare color="#fff" size={18} strokeWidth={2} />
            <Text style={sh.chatFabText}>Czat</Text>
          </Pressable>
        </View>

        {/* ── SLIDING CHAT DRAWER ────────────────────────────────────────── */}
        {chatDrawerOpen && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }, chatOverlayStyle]} pointerEvents="auto">
              <Pressable style={StyleSheet.absoluteFill} onPress={closeChatDrawer} />
            </Animated.View>
            <Animated.View style={[sh.chatDrawer, { height: SH * 0.48, bottom: 0 }, chatDrawerStyle]}>
              <LinearGradient colors={['rgba(6,2,18,0.98)', 'rgba(10,5,26,0.97)']} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={[ACCENT + '18', 'transparent']} style={[StyleSheet.absoluteFill, { height: 80 }]} />
              <View style={sh.chatDrawerHandle} />
              <View style={[sh.chatDrawerHeader, { borderBottomColor: ACCENT + '28' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MessageSquare color={ACCENT} size={14} strokeWidth={2} />
                  <Text style={[sh.chatDrawerTitle, { color: '#F0EBFF' }]}>CZAT RYTUAŁU</Text>
                  <View style={[sh.chatDrawerBadge, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '45' }]}>
                    <Users size={10} color={ACCENT} />
                    <Text style={[sh.chatDrawerBadgeText, { color: ACCENT }]}>{participants.toLocaleString()}</Text>
                  </View>
                </View>
                <Pressable onPress={closeChatDrawer} hitSlop={14}>
                  <X color="rgba(255,255,255,0.55)" size={20} strokeWidth={2} />
                </Pressable>
              </View>
              <ScrollView ref={drawerScrollRef} style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 }}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => drawerScrollRef.current?.scrollToEnd({ animated: false })}>
                {drawerMessages.map(msg => (
                  <View key={msg.id} style={[sh.drawerMsgRow, msg.isOwn && sh.drawerMsgRowOwn]}>
                    {!msg.isOwn && (
                      <View style={[sh.drawerAvatar, { backgroundColor: msg.avatarColor }]}>
                        <Text style={sh.drawerAvatarText}>{msg.initials}</Text>
                      </View>
                    )}
                    <View style={[sh.drawerMsgContent, msg.isOwn && { alignItems: 'flex-end' }]}>
                      {!msg.isOwn && <Text style={[sh.drawerMsgAuthor, { color: msg.avatarColor }]}>{msg.author}</Text>}
                      <View style={[sh.drawerBubble, msg.isOwn
                        ? { backgroundColor: ACCENT + 'CC', borderBottomRightRadius: 4 }
                        : { backgroundColor: 'rgba(255,255,255,0.09)', borderBottomLeftRadius: 4 }]}>
                        <Text style={[sh.drawerBubbleText, { color: msg.isOwn ? '#fff' : '#E8E0F8' }]}>{msg.text}</Text>
                      </View>
                      <Text style={sh.drawerMsgTime}>{msg.time}</Text>
                    </View>
                    {msg.isOwn && (
                      <View style={[sh.drawerAvatar, { backgroundColor: msg.avatarColor }]}>
                        <Text style={sh.drawerAvatarText}>{msg.initials}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
              {emojiPickerOpen && (
                <View style={[sh.emojiRow, { borderTopColor: ACCENT + '25' }]}>
                  {QUICK_EMOJIS.map(e => (
                    <Pressable key={e} onPress={() => sendQuickEmoji(e)} style={sh.emojiBtn}>
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
                <View style={[sh.drawerInputRow, { borderTopColor: ACCENT + '25', paddingBottom: insets.bottom > 0 ? insets.bottom : 10 }]}>
                  <Pressable onPress={() => setEmojiPickerOpen(v => !v)}
                    style={[sh.drawerEmojiToggle, { borderColor: 'rgba(255,255,255,0.15)' }]}>
                    <Text style={{ fontSize: 18 }}>🙏</Text>
                  </Pressable>
                  <TextInput
                    value={drawerInput}
                    onChangeText={setDrawerInput}
                    placeholder="Napisz do kręgu..."
                    placeholderTextColor="rgba(200,185,255,0.35)"
                    style={[sh.drawerInput, { color: '#F0EBFF' }]}
                    onSubmitEditing={sendDrawerMessage}
                    returnKeyType="send"
                    onFocus={() => setEmojiPickerOpen(false)}
                  />
                  <Pressable onPress={sendDrawerMessage} style={[sh.drawerSendBtn, { backgroundColor: ACCENT }]}>
                    <Send color="#fff" size={16} />
                  </Pressable>
                </View>
              </KeyboardAvoidingView>
            </Animated.View>
          </View>
        )}

      </SafeAreaView>
    </View>
  );
};

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const sh = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: layout.padding.screen, paddingVertical: 10, gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  liveBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  liveDotRed:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  liveBadgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 2, color: '#EF4444' },
  headerTitle: {
    fontSize: 15, fontWeight: '700', letterSpacing: 2.5, color: '#F5D38C',
    textShadowColor: 'rgba(245,211,140,0.4)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 },
  },
  phaseDots: { flexDirection: 'row', gap: 4, marginTop: 5, alignItems: 'center' },
  phaseDot:  { height: 5, borderRadius: 3 },
  paxBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  paxDot:    { width: 6, height: 6, borderRadius: 3 },
  paxText:   { fontSize: 12, fontWeight: '800' },
  paxSuffix: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },

  // Breathing ring
  breathSection: { height: 300, alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  outerRing: {
    position: 'absolute', width: 290, height: 290, borderRadius: 145, borderWidth: 1,
  },
  midRing: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125, borderWidth: 0.5,
  },
  breathGlowContainer: {
    position: 'absolute', width: 220, height: 220, alignItems: 'center', justifyContent: 'center',
  },
  breathRingWrap: {
    width: 220, height: 220, alignItems: 'center', justifyContent: 'center',
  },
  breathLabelWrap:         { position: 'absolute', alignItems: 'center' },
  breathLabel:             { fontSize: 16, fontWeight: '800', letterSpacing: 3.5, textShadowRadius: 12, textShadowOffset: { width: 0, height: 0 } },
  breathSub:               { fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.2, marginTop: 3 },
  breathParticipants:      { fontSize: 22, fontWeight: '800', color: '#F0EAFF', marginTop: 8 },
  breathParticipantsSub:   { fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 },

  // Timer bar
  timerBar:          { paddingHorizontal: layout.padding.screen, marginBottom: 14 },
  timerBarInner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  timerElapsed:      { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.8)' },
  timerProgressTrack:{ flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  timerProgressFill: { height: '100%', borderRadius: 2 },
  timerRemaining:    { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },

  // Join button
  joinBtn: {
    borderRadius: 20, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12,
  },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  // Completion
  completionCircle: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18, overflow: 'hidden',
  },
  completionTitle: {
    fontSize: 22, fontWeight: '800', letterSpacing: 1.5, color: '#F5D38C', marginBottom: 10,
    textShadowColor: 'rgba(245,211,140,0.5)', textShadowRadius: 12, textShadowOffset: { width: 0, height: 0 },
  },
  completionSub: {
    fontSize: 14, color: 'rgba(240,234,255,0.7)', lineHeight: 22,
    textAlign: 'center', marginBottom: 22, paddingHorizontal: 10,
  },
  returnBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 18 },
  returnBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Cinematic step block
  stepsBlock:        { borderRadius: 24, borderWidth: 1, padding: 20, overflow: 'hidden' },
  stepGhost:         { fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 18, marginBottom: 10, fontStyle: 'italic' },
  stepCurrentRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14,
  },
  stepCurrentDot:  { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0, shadowRadius: 6, shadowOpacity: 0.9 },
  stepCurrentText: { flex: 1, fontSize: 17, lineHeight: 26, fontWeight: '600', letterSpacing: 0.2, color: '#F0EAFF' },
  stepCounterRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  stepCounter:     { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  stepProgressTrack: { flex: 1, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  stepProgressFill:  { height: '100%', borderRadius: 1.5 },
  nextStepBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-end',
  },
  nextStepBtnText: { fontSize: 13, fontWeight: '700' },

  // Checklist
  stepsCard:  { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  stepRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNum:    { fontSize: 11, fontWeight: '700' },
  stepText:   { flex: 1, fontSize: 13, lineHeight: 20 },

  // Section label
  sectionLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },

  // Intention
  intentionCard: { borderRadius: 18, borderWidth: 1, padding: 14, overflow: 'hidden' },
  intentionInput: { fontSize: 14, lineHeight: 22, minHeight: 68, marginBottom: 10 },
  intentionSendBtn: { borderWidth: 1, borderRadius: 12, alignSelf: 'flex-end', overflow: 'hidden' },
  intentionSendGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9 },
  intentionSendText: { fontSize: 12, fontWeight: '700' },
  intentionSentBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 16, borderWidth: 1, padding: 14, overflow: 'hidden' },
  intentionSentText: { flex: 1, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  // Reactions
  reactionsRow: { flexDirection: 'row', gap: 10 },
  reactionBtn:  { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 15, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  reactionCount:{ fontSize: 15, fontWeight: '800', color: '#F0EAFF' },
  reactionLabel:{ fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },

  // Music
  muteBtn: {
    width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  musicChip: {
    alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1, minWidth: 68, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  musicChipLabel: { fontSize: 10, fontWeight: '700' },

  // Live chat
  chatContainer: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' },
  chatMsg:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  chatMsgOwn:    { flexDirection: 'row-reverse' },
  chatAvatar:    { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  chatAuthor:    { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  chatText:      { fontSize: 12, lineHeight: 17 },
  chatInputRow:  { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chatInput:     { flex: 1, fontSize: 13, paddingVertical: 4 },
  chatSendBtn:   { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  // Host
  hostCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, padding: 14, overflow: 'hidden' },
  hostAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  hostName:   { fontSize: 14, fontWeight: '700', color: '#F0EAFF' },
  hostRole:   { fontSize: 11, marginTop: 2, color: 'rgba(255,255,255,0.45)' },
  hostOnline: { width: 10, height: 10, borderRadius: 5 },

  // Chat FAB
  chatFab:    { position: 'absolute', right: 18, zIndex: 30 },
  chatFabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 11, borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 10,
  },
  chatFabText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },

  // Chat drawer
  chatDrawer: {
    position: 'absolute', left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden',
    borderTopWidth: 1, borderTopColor: 'rgba(180,150,255,0.15)',
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 22, zIndex: 50,
  },
  chatDrawerHandle: {
    width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)',
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  chatDrawerHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  chatDrawerTitle:     { fontSize: 11, fontWeight: '800', letterSpacing: 1.8 },
  chatDrawerBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  chatDrawerBadgeText: { fontSize: 10, fontWeight: '700' },

  // Drawer messages
  drawerMsgRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
  drawerMsgRowOwn:  { flexDirection: 'row-reverse' },
  drawerAvatar:     { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  drawerAvatarText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  drawerMsgContent: { flex: 1, gap: 2 },
  drawerMsgAuthor:  { fontSize: 10, fontWeight: '700', marginLeft: 4 },
  drawerBubble:     { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start', maxWidth: SW * 0.68 },
  drawerBubbleText: { fontSize: 13, lineHeight: 18 },
  drawerMsgTime:    { fontSize: 10, color: 'rgba(200,185,255,0.35)', marginLeft: 4, marginRight: 4 },

  // Drawer input
  emojiRow:         { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1 },
  emojiBtn:         { padding: 4 },
  drawerInputRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10, gap: 8, borderTopWidth: 1 },
  drawerEmojiToggle:{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  drawerInput:      { flex: 1, fontSize: 14, paddingVertical: 6, paddingHorizontal: 2 },
  drawerSendBtn:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
