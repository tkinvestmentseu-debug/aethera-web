// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Dimensions, findNodeHandle, Keyboard, Modal, PanResponder,
  Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Ellipse, G, Line, Path, RadialGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  Easing, FadeIn, FadeInDown, FadeInUp, interpolate,
  useAnimatedStyle, useSharedValue, withDelay,
  withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { Bookmark, ChevronLeft, ChevronDown, ChevronUp, Flame, Lock, MessageCircle, RefreshCw, Sparkles, Star, X, RotateCcw, BookOpen, Zap } from 'lucide-react-native';
import { ALL_CARDS } from '../features/tarot/data/cards';
import { getTarotDeckById, TAROT_DECKS } from '../features/tarot/data/decks';
import { TarotCardVisual } from '../features/tarot/components/TarotCardVisual';
import { useTarotStore } from '../features/tarot/store/useTarotStore';
import { usePremiumStore } from '../store/usePremiumStore';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { resolveUserFacingText } from '../core/utils/contentResolver';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW, height: SH } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────
const GOLD = '#CEAE72';
const GOLD_DIM = 'rgba(206,174,114,0.40)';
const CLOTH_COLOR = '#1A0E2E';
const CANDLE_AMBER = '#FFC857';

// ─── Seeded RNG for date-unique readings ─────────────────────────────────────
const seededRng = (seed: number) => {
  let s = (seed | 0) >>> 0;
  return () => {
    s = Math.imul(48271, s) >>> 0;
    return s / 4294967296;
  };
};

const getDateSeed = (extra = 0) => {
  const d = new Date();
  return (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) + extra;
};

const shuffleDeck = (cards: any[], seed: number): any[] => {
  const deck = cards.map((c, i) => ({ card: c, isReversed: seededRng(seed + i * 7)() < 0.25 }));
  const rng = seededRng(seed);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

// ─── Spread definitions ───────────────────────────────────────────────────────
const SPREADS = [
  { id: 'single',  label: 'Karta chwili',   desc: 'Jeden symbol dla Twojego teraz',     count: 1, positions: [{ x: 0,   y: 0,   rot: 0  }] },
  { id: 'three',   label: 'Trzy nici',       desc: 'Przeszłość · teraźniejszość · otwierające się', count: 3, positions: [{ x: -140, y: 0, rot: -4 }, { x: 0, y: -8, rot: 0 }, { x: 140, y: 0, rot: 4 }] },
  { id: 'cross',   label: 'Krzyż Celtic',    desc: 'Głęboki pięciokartowy odczyt energii', count: 5, positions: [{ x: -145, y: 20, rot: -5 }, { x: -50, y: -15, rot: -2 }, { x: 60, y: 0, rot: 3 }, { x: 0, y: 60, rot: 0 }, { x: 0, y: -60, rot: 0 }] },
];

const SPREAD_SLOT_LABELS: Record<string, string[]> = {
  single: ['Esencja chwili'],
  three:  ['To, co za Tobą', 'To, co jest teraz', 'To, co się odsłania'],
  cross:  ['Ty teraz', 'Co kryje się pod spodem', 'Co nadchodzi', 'Fundament', 'Kulminacja'],
};

const TOPICS = [
  { id: 'love',      label: '♥ Miłość i relacje',   color: '#F472B6' },
  { id: 'work',      label: '✦ Praca i cel',         color: GOLD },
  { id: 'soul',      label: '✧ Duchowa ścieżka',     color: '#A78BFA' },
  { id: 'decision',  label: '⊕ Decyzja i wybór',     color: '#60A5FA' },
  { id: 'energy',    label: '∿ Moja energia dziś',   color: '#34D399' },
  { id: 'general',   label: '◎ Ogólny odczyt',       color: GOLD_DIM },
];

// ─── Question Categories ──────────────────────────────────────────────────────
const QUESTION_CATEGORIES = [
  {
    id: 'love',
    emoji: '💕',
    label: 'Miłość & Relacje',
    color: '#F472B6',
    template: 'Czuję pewien niepokój w relacjach... co karty chcą mi teraz powiedzieć o miłości?',
    context: 'Pytanie dotyczy miłości, relacji romantycznych i emocjonalnych połączeń.',
  },
  {
    id: 'career',
    emoji: '💼',
    label: 'Kariera & Pieniądze',
    color: '#FCD34D',
    template: 'Stoję na rozdrożu w pracy i finansach — jaką ścieżką warto iść?',
    context: 'Pytanie dotyczy kariery zawodowej, pieniędzy i finansowej stabilności.',
  },
  {
    id: 'spirituality',
    emoji: '🌙',
    label: 'Duchowość',
    color: '#A78BFA',
    template: 'Czuję, że czegoś mi brakuje wewnętrznie — co karty mówią o mojej duchowej drodze?',
    context: 'Pytanie dotyczy rozwoju duchowego, intuicji i wewnętrznej mądrości.',
  },
  {
    id: 'future',
    emoji: '🔮',
    label: 'Przyszłość',
    color: '#60A5FA',
    template: 'Co los szykuje dla mnie w nadchodzącym czasie? Chcę to zobaczyć.',
    context: 'Pytanie dotyczy nadchodzących wydarzeń i możliwych ścieżek przyszłości.',
  },
  {
    id: 'health',
    emoji: '🌿',
    label: 'Zdrowie',
    color: '#34D399',
    template: 'Jak dbać o siebie w tym czasie — co karty widzą w kwestii mojej energii i ciała?',
    context: 'Pytanie dotyczy zdrowia fizycznego, psychicznego i ogólnego dobrostanu.',
  },
  {
    id: 'hidden',
    emoji: '👁',
    label: 'Ukryte prawdy',
    color: '#F87171',
    template: 'Mam wrażenie, że czegoś nie widzę... co naprawdę dzieje się w mojej sytuacji?',
    context: 'Pytanie dotyczy ukrytych sił, tajemnic i tego co skryte przed oczami.',
  },
];

// ─── Energy Levels ────────────────────────────────────────────────────────────
const ENERGY_LEVELS = [
  { id: 'exhausted', emoji: '🌑', label: 'Wyczerpana/y', context: 'Osoba jest wyczerpana energetycznie, potrzebuje odnowy.' },
  { id: 'neutral',   emoji: '🌓', label: 'Neutralna/y',  context: 'Osoba jest w stanie równowagi, neutralnym nastroju.' },
  { id: 'full',      emoji: '🌕', label: 'Pełna/y energii', context: 'Osoba jest pełna energii, otwarta i gotowa na nowe.' },
  { id: 'intense',   emoji: '⚡', label: 'Intensywna/y', context: 'Osoba przeżywa intensywne emocje lub napięcie.' },
];

// ─── Animated Candle ─────────────────────────────────────────────────────────
const AnimatedCandle = ({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) => {
  const flicker = useSharedValue(1);
  const flicker2 = useSharedValue(0.8);
  useEffect(() => {
    flicker.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.18, { duration: 180 }),
        withTiming(0.85, { duration: 220 }),
        withTiming(1.05, { duration: 140 }),
        withTiming(0.92, { duration: 260 }),
        withTiming(1.10, { duration: 160 }),
      ), -1, true,
    ));
    flicker2.value = withDelay(delay + 80, withRepeat(
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.65, { duration: 250 }),
        withTiming(0.9, { duration: 170 }),
      ), -1, true,
    ));
  }, []);
  const s1 = useAnimatedStyle(() => ({ transform: [{ scaleY: flicker.value }, { scaleX: flicker2.value }] }));
  return (
    <View style={{ position: 'absolute', left: x - 6, top: y - 30, width: 12, height: 30 }}>
      <Svg width={12} height={30} style={StyleSheet.absoluteFill}>
        {/* Candle body */}
        <Rect x={2} y={12} width={8} height={18} rx={2} fill="#F5E6C8" opacity={0.9} />
        {/* Wax drip */}
        <Path d="M4,14 Q3,18 3,22" stroke="#E8D4A0" strokeWidth={1.5} fill="none" />
      </Svg>
      <Animated.View style={[s1, { position: 'absolute', top: 0, left: 1, alignItems: 'center' }]}>
        <Svg width={10} height={16}>
          <Defs>
            <RadialGradient id={`fg${x}${y}`} cx="50%" cy="80%" rx="50%" ry="100%">
              <Stop offset="0%" stopColor="#FFF5C0" stopOpacity="1" />
              <Stop offset="50%" stopColor={CANDLE_AMBER} stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#FF6B00" stopOpacity="0.2" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={5} cy={10} rx={4} ry={8} fill={`url(#fg${x}${y})`} />
          <Circle cx={5} cy={14} r={2} fill="#FFEE80" opacity={0.8} />
        </Svg>
      </Animated.View>
    </View>
  );
};

// ─── Tarot Table SVG Background ──────────────────────────────────────────────
const TarotTableScene = ({ phase }: { phase: string }) => {
  const { isLight } = useTheme();
  const glow = useSharedValue(0.5);
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: interpolate(glow.value, [0, 1], [0.35, 0.65]) }));
  const cx = SW / 2;
  const cy = TABLE_H / 2;
  const cr = TABLE_H * 0.44;

  return (
    <View style={{ width: SW, height: TABLE_H, overflow: 'hidden' }}>
      {/* Background */}
      <LinearGradient
        colors={isLight
          ? ['#F0E8F8', '#E8DCF5', '#EEE4F8', '#E8DCF5']
          : ['#05030F', '#0A0618', '#0F0825', '#0A0618']}
        style={StyleSheet.absoluteFill}
      />
      <Svg width={SW} height={TABLE_H} style={StyleSheet.absoluteFill}>
        {/* Stars / sparkles */}
        {STAR_POSITIONS.map(([sx, sy, sr, so], i) => (
          <Circle key={i} cx={sx} cy={sy} r={sr}
            fill={isLight ? '#7C3AED' : 'white'}
            opacity={isLight ? so * 0.25 : so} />
        ))}
        {/* Constellation lines */}
        {CONSTELLATION_LINES.map(([x1, y1, x2, y2], i) => (
          <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={isLight ? 'rgba(100,60,180,0.10)' : 'rgba(255,255,255,0.08)'}
            strokeWidth={0.5} />
        ))}
        {/* Table outer glow */}
        <Defs>
          <RadialGradient id="tglow" cx="50%" cy="50%" rx="55%" ry="55%">
            <Stop offset="0%" stopColor="#8B5CF6" stopOpacity={isLight ? '0.18' : '0.20'} />
            <Stop offset="60%" stopColor="#6D28D9" stopOpacity={isLight ? '0.08' : '0.10'} />
            <Stop offset="100%" stopColor="#4C1D95" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="cloth" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={isLight ? '#DDD0F0' : '#1E0A3C'} stopOpacity={isLight ? '0.85' : '0.95'} />
            <Stop offset="70%" stopColor={isLight ? '#D4C4EC' : '#150728'} stopOpacity={isLight ? '0.80' : '0.97'} />
            <Stop offset="100%" stopColor={isLight ? '#C8B8E8' : '#0C0418'} stopOpacity={isLight ? '0.75' : '1'} />
          </RadialGradient>
          <RadialGradient id="cglow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={GOLD} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {/* Table cloth circle */}
        <Circle cx={cx} cy={cy} r={cr + 18} fill={`url(#tglow)`} />
        <Circle cx={cx} cy={cy} r={cr} fill={`url(#cloth)`} />
        {/* Cloth border */}
        <Circle cx={cx} cy={cy} r={cr} stroke={GOLD} strokeWidth={0.8} fill="none" opacity={0.5} />
        <Circle cx={cx} cy={cy} r={cr - 8} stroke={GOLD} strokeWidth={0.3} fill="none" opacity={0.25} />
        {/* Sacred geometry inner ring */}
        <Circle cx={cx} cy={cy} r={cr * 0.55} stroke={GOLD} strokeWidth={0.4} fill="none" strokeDasharray="4 8" opacity={0.20} />
        {/* Radial lines */}
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
          const rad = deg * Math.PI / 180;
          return (
            <Line key={i}
              x1={cx + Math.cos(rad) * (cr * 0.55)} y1={cy + Math.sin(rad) * (cr * 0.55)}
              x2={cx + Math.cos(rad) * cr} y2={cy + Math.sin(rad) * cr}
              stroke={GOLD} strokeWidth={0.3} opacity={0.12}
            />
          );
        })}
        {/* Central Eye / Rune */}
        <Circle cx={cx} cy={cy} r={14} fill="none" stroke={GOLD} strokeWidth={0.6} opacity={0.35} />
        <Path d={`M${cx - 10},${cy} Q${cx},${cy - 8} ${cx + 10},${cy} Q${cx},${cy + 8} ${cx - 10},${cy} Z`}
          stroke={GOLD} strokeWidth={0.7} fill="none" opacity={0.35} />
      </Svg>

      {/* Animated central glow */}
      <Animated.View style={[glowStyle, {
        position: 'absolute', left: cx - 80, top: cy - 80, width: 160, height: 160,
        borderRadius: 80, backgroundColor: isLight ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.12)',
      }]} />

      {/* Candles */}
      <AnimatedCandle x={44} y={TABLE_H * 0.28} delay={0} />
      <AnimatedCandle x={SW - 44} y={TABLE_H * 0.28} delay={300} />
      <AnimatedCandle x={30} y={TABLE_H * 0.72} delay={150} />
      <AnimatedCandle x={SW - 30} y={TABLE_H * 0.72} delay={450} />

      {/* Candle halo glows */}
      {[[44, TABLE_H * 0.28], [SW - 44, TABLE_H * 0.28], [30, TABLE_H * 0.72], [SW - 30, TABLE_H * 0.72]].map(([cx2, cy2], i) => (
        <Svg key={i} width={60} height={60} style={{ position: 'absolute', left: cx2 - 30, top: cy2 - 50 }}>
          <Defs>
            <RadialGradient id={`halo${i}`} cx="50%" cy="60%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#FFC857" stopOpacity="0.20" />
              <Stop offset="100%" stopColor="#FFC857" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={30} cy={30} r={28} fill={`url(#halo${i})`} />
        </Svg>
      ))}

      {/* Phase label */}
      {phase === 'intro' && (
        <View style={{ position: 'absolute', bottom: 18, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ color: isLight ? 'rgba(139,100,42,0.55)' : GOLD_DIM, fontSize: 10, letterSpacing: 3.5, fontWeight: '600' }}>
            ZAPAL ŚWIECĘ
          </Text>
        </View>
      )}
    </View>
  );
};

// Pre-computed star positions to avoid re-computation on each render
const STAR_POSITIONS: [number, number, number, number][] = Array.from({ length: 60 }, (_, i) => {
  const rng = seededRng(i * 1337 + 99);
  return [rng() * SW, rng() * TABLE_H, rng() < 0.15 ? 1.6 : 0.8, 0.1 + rng() * 0.55];
});
const CONSTELLATION_LINES: [number, number, number, number][] = Array.from({ length: 8 }, (_, i) => {
  const rng = seededRng(i * 7777 + 42);
  return [rng() * SW, rng() * TABLE_H * 0.6, rng() * SW, rng() * TABLE_H * 0.6];
});
// Match actual TarotCardVisual size="small" (130×236) so the card fills its container without clipping.
const CARD_W = 130;
const CARD_H = 236;
// TABLE_H must be tall enough so absolutely-positioned cards never clip at the bottom.
// Extra padding ensures cross-spread top/bottom cards (y:±50) are never clipped.
const TABLE_H = Math.max(Math.min(SH * 0.80, 680), CARD_H + 340);

// ─── Card Back SVG ────────────────────────────────────────────────────────────
const CardBackSVG = ({ w, h, glowing }: { w: number; h: number; glowing?: boolean }) => (
  <Svg width={w} height={h}>
    <Defs>
      <RadialGradient id="cbg" cx="50%" cy="50%" rx="50%" ry="50%">
        <Stop offset="0%" stopColor="#1E0A40" />
        <Stop offset="100%" stopColor="#0A0420" />
      </RadialGradient>
    </Defs>
    <Rect x={0} y={0} width={w} height={h} rx={7} fill="url(#cbg)" />
    <Rect x={3} y={3} width={w - 6} height={h - 6} rx={5} stroke={GOLD} strokeWidth={0.7} fill="none" opacity={glowing ? 0.9 : 0.5} />
    <Rect x={6} y={6} width={w - 12} height={h - 12} rx={4} stroke={GOLD} strokeWidth={0.3} fill="none" opacity={0.3} />
    {/* Central star */}
    <Path
      d={`M${w / 2},${h / 2 - 12} L${w / 2 + 4},${h / 2 - 2} L${w / 2 + 14},${h / 2 - 2} L${w / 2 + 6},${h / 2 + 4} L${w / 2 + 9},${h / 2 + 14} L${w / 2},${h / 2 + 8} L${w / 2 - 9},${h / 2 + 14} L${w / 2 - 6},${h / 2 + 4} L${w / 2 - 14},${h / 2 - 2} L${w / 2 - 4},${h / 2 - 2} Z`}
      stroke={GOLD} strokeWidth={0.8} fill={glowing ? 'rgba(206,174,114,0.12)' : 'none'} opacity={glowing ? 1 : 0.45}
    />
    {/* Corner ornaments */}
    {[[10, 12], [w - 10, 12], [10, h - 12], [w - 10, h - 12]].map(([ox, oy], i) => (
      <G key={i}>
        <Circle cx={ox} cy={oy} r={3} stroke={GOLD} strokeWidth={0.5} fill="none" opacity={0.5} />
        <Circle cx={ox} cy={oy} r={1} fill={GOLD} opacity={0.4} />
      </G>
    ))}
    {glowing && <Circle cx={w / 2} cy={h / 2} r={22} fill="rgba(139,92,246,0.08)" />}
  </Svg>
);

// ─── Flip Card Component ──────────────────────────────────────────────────────
interface FlipCardProps {
  card: any;
  isReversed: boolean;
  deckId?: string;
  slotLabel: string;
  index: number;
  isActive: boolean;
  revealed: boolean;
  onReveal: () => void;
}

const FlipCard = ({ card, isReversed, deckId, slotLabel, index, isActive, revealed, onReveal }: FlipCardProps) => {
  const flip = useSharedValue(revealed ? 1 : 0);
  const pulse = useSharedValue(1);
  const lift = useSharedValue(0);

  useEffect(() => {
    if (revealed) {
      flip.value = 1;
      return;
    }
    if (isActive) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.97, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        ), -1, false,
      );
    } else {
      pulse.value = 1;
    }
  }, [isActive, revealed]);

  const handlePress = () => {
    if (!isActive || revealed) return;
    HapticsService.impact('light');
    lift.value = withSequence(withTiming(-12, { duration: 200 }), withTiming(0, { duration: 600 }));
    flip.value = withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) });
    setTimeout(() => { HapticsService.notify(); onReveal(); }, 380);
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: isActive && !revealed ? pulse.value : 1 },
      { translateY: lift.value },
    ],
  }));

  const backStyle = useAnimatedStyle(() => ({
    position: 'absolute', width: CARD_W, height: CARD_H,
    opacity: flip.value < 0.5 ? 1 : 0,
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(flip.value, [0, 0.5], [0, 90])}deg` }],
  }));

  const frontStyle = useAnimatedStyle(() => ({
    position: 'absolute', width: CARD_W, height: CARD_H,
    opacity: flip.value >= 0.5 ? 1 : 0,
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(flip.value, [0.5, 1], [-90, 0])}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: isActive && !revealed ? interpolate(pulse.value, [0.97, 1.05], [0.3, 0.7]) : 0,
  }));

  return (
    <Pressable onPress={handlePress} style={{ width: CARD_W, height: CARD_H }}>
      <Animated.View style={containerStyle}>
        {/* Glow ring when active */}
        <Animated.View style={[glowStyle, {
          position: 'absolute', top: -6, left: -6, right: -6, bottom: -6,
          borderRadius: 13, borderWidth: 1.5, borderColor: GOLD,
          shadowColor: GOLD, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10,
        }]} />

        {/* Card Back */}
        <Animated.View style={backStyle}>
          <CardBackSVG w={CARD_W} h={CARD_H} glowing={isActive && !revealed} />
          {isActive && !revealed && (
            <View style={{ position: 'absolute', bottom: 4, left: 0, right: 0, alignItems: 'center' }}>
              <Text style={{ color: GOLD, fontSize: 8, letterSpacing: 1.5, fontWeight: '700' }}>DOTKNIJ</Text>
            </View>
          )}
        </Animated.View>

        {/* Card Front */}
        <Animated.View style={frontStyle}>
          <View style={{ width: CARD_W, height: CARD_H, borderRadius: 7, overflow: 'hidden',
            borderWidth: 1, borderColor: 'rgba(206,174,114,0.6)',
            shadowColor: '#A78BFA', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12,
          }}>
            <TarotCardVisual deck={getTarotDeckById(deckId || 'classic')} card={card} isReversed={isReversed} faceDown={false} size="small" />
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

// ─── Oracle Typing Text ───────────────────────────────────────────────────────
const OracleTypingText = ({ text, color }: { text: string; color: string }) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setDisplayed(text.slice(0, idx));
      if (idx >= text.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [text]);
  return <Text style={{ color, fontSize: 14, lineHeight: 22 }}>{displayed}</Text>;
};

// ─── Spread Table (cards on the cloth) ───────────────────────────────────────
const SpreadTable = ({
  spreadId, dealedCards, nextRevealIndex, onReveal,
  deckId, phase,
}: {
  spreadId: string; dealedCards: any[]; nextRevealIndex: number;
  onReveal: (idx: number) => void; deckId: string; phase: string;
}) => {
  const spread = SPREADS.find(s => s.id === spreadId) || SPREADS[1];
  const cx = SW / 2;
  const cy = TABLE_H / 2 + 10;

  return (
    <View style={{ width: SW, minHeight: TABLE_H, position: 'relative', overflow: 'visible' }}>
      <TarotTableScene phase={phase} />

      {/* Cards placed on table */}
      {spread.positions.slice(0, dealedCards.length).map((pos, i) => {
        const item = dealedCards[i];
        const cardX = cx + pos.x - CARD_W / 2;
        const cardY = cy + pos.y - CARD_H / 2;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: cardX,
              top: cardY,
              zIndex: i + 1,
            }}
          >
            <Animated.View entering={FadeInDown.delay(i * 200).springify()}>
              <View style={{ transform: [{ rotate: `${pos.rot}deg` }] }}>
              <FlipCard
                card={item.card}
                isReversed={item.isReversed}
                deckId={deckId}
                slotLabel={SPREAD_SLOT_LABELS[spreadId]?.[i] || `Karta ${i + 1}`}
                index={i}
                isActive={i === nextRevealIndex}
                revealed={i < nextRevealIndex}
                onReveal={() => onReveal(i)}
              />
              </View>
            </Animated.View>
          </View>
        );
      })}

      {/* Spread label */}
      {phase === 'table' && (
        <View style={{ position: 'absolute', bottom: 8, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ color: GOLD_DIM, fontSize: 9, letterSpacing: 3, fontWeight: '700', opacity: 0.8 }}>
            {spread.label.toUpperCase()} · KARTA {Math.min(nextRevealIndex + 1, spread.count)}/{spread.count}
          </Text>
        </View>
      )}
    </View>
  );
};

// ─── Revealed Card Interpretation Block ──────────────────────────────────────
const InterpretationBlock = ({
  card, isReversed, slotLabel, interpretation, deckId, accentColor, index, isLight,
}: {
  card: any; isReversed: boolean; slotLabel: string; interpretation: string;
  deckId: string; accentColor: string; index: number; isLight?: boolean;
}) => {
  const cardName = resolveUserFacingText(card.name);
  const orientLabel = isReversed ? 'ODWRÓCONA' : 'PROSTA';

  return (
    <Animated.View entering={FadeInUp.delay(100).springify()} style={[ib.container, {
      backgroundColor: isLight ? 'rgba(255,252,245,0.92)' : 'rgba(30,10,60,0.50)',
      borderColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(206,174,114,0.15)',
    }]}>
      <LinearGradient
        colors={isLight ? ['rgba(255,252,245,0)', 'rgba(255,252,245,0)'] : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
      />
      <View style={ib.header}>
        {/* Mini card — scale 0.5x so 130×236 collapses to 65×118 layout footprint */}
        <View style={{ width: 65, height: 118, overflow: 'hidden', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(206,174,114,0.4)' }}>
          <View style={{ width: 130, height: 236, transform: [{ scale: 0.5 }], transformOrigin: 'top left' }}>
            <TarotCardVisual deck={getTarotDeckById(deckId)} card={card} isReversed={isReversed} faceDown={false} size="small" />
          </View>
        </View>
        <View style={ib.headerText}>
          <Text style={[ib.slotLabel, { color: accentColor }]}>{slotLabel.toUpperCase()}</Text>
          <Text style={[ib.cardName, { color: isLight ? '#1A0E2E' : '#F5F1EA' }]}>{cardName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <View style={[ib.orientBadge, { backgroundColor: accentColor + '22', borderColor: accentColor + '55' }]}>
              <Text style={[ib.orientText, { color: accentColor }]}>{orientLabel}</Text>
            </View>
            <Text style={[ib.suitLabel, { color: isLight ? 'rgba(60,30,100,0.45)' : 'rgba(245,241,234,0.35)' }]}>{card.suit === 'major' ? 'Arcana Większa' : `Arcana Mniejsza · ${card.suit}`}</Text>
          </View>
        </View>
      </View>

      <View style={ib.divider} />

      {interpretation ? (
        <OracleTypingText text={interpretation} color={isLight ? 'rgba(30,10,60,0.82)' : 'rgba(245,241,234,0.88)'} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accentColor }} />
          <Text style={{ color: isLight ? 'rgba(60,30,100,0.50)' : 'rgba(245,241,234,0.4)', fontSize: 13, fontStyle: 'italic' }}>
            Wróżka odczytuje kartę...
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const ib = StyleSheet.create({
  container: {
    marginHorizontal: 20, marginBottom: 14, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(206,174,114,0.15)',
    backgroundColor: 'rgba(30,10,60,0.50)',
  },
  header: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  miniCard: { width: 65, height: 118 }, // kept for TS reference; actual styles are inline above
  headerText: { flex: 1, justifyContent: 'center', gap: 2 },
  slotLabel: { fontSize: 9, letterSpacing: 2.5, fontWeight: '700' },
  cardName: { fontSize: 18, fontWeight: '700', letterSpacing: 0.3 },
  orientBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  orientText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  suitLabel: { fontSize: 10, letterSpacing: 0.5 },
  divider: { height: 0.5, backgroundColor: 'rgba(206,174,114,0.20)', marginBottom: 12 },
});

// ─── Chat Message ─────────────────────────────────────────────────────────────
interface ChatMsg {
  role: 'user' | 'oracle';
  content: string;
  extraCard?: { card: any; isReversed: boolean; label: string };
}

const ChatMessage = ({ msg, deckId, accentColor }: { msg: ChatMsg; deckId: string; accentColor: string }) => {
  const isOracle = msg.role === 'oracle';
  const { isLight } = useTheme();

  if (isOracle) {
    return (
      <Animated.View entering={FadeInUp.springify()} style={cm.oracleWrapper}>
        {/* Avatar + label row */}
        <View style={cm.oracleHeader}>
          <LinearGradient
            colors={isLight ? ['#7C3AED', '#9D4EDD'] : ['#6D28D9', '#9333EA']}
            style={cm.oracleAvatar}>
            <Text style={{ color: '#FFE5A0', fontSize: 14, fontWeight: '700' }}>✦</Text>
          </LinearGradient>
          <View style={{ marginLeft: 8 }}>
            <Text style={{ color: GOLD, fontSize: 9, letterSpacing: 2.5, fontWeight: '800' }}>WRÓŻKA AETHERA</Text>
            <View style={{ flexDirection: 'row', gap: 3, marginTop: 2 }}>
              {[0,1,2].map(i => <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: GOLD, opacity: 0.5 + i * 0.2 }} />)}
            </View>
          </View>
        </View>

        {/* Bubble */}
        <LinearGradient
          colors={isLight
            ? ['rgba(124,58,237,0.10)', 'rgba(147,51,234,0.06)', 'rgba(109,40,217,0.04)']
            : ['rgba(109,40,217,0.28)', 'rgba(88,28,220,0.18)', 'rgba(60,20,160,0.12)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[cm.oracleBubble, {
            borderColor: isLight ? 'rgba(124,58,237,0.28)' : 'rgba(206,174,114,0.30)',
          }]}>
          {/* Gold left accent bar */}
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
            backgroundColor: GOLD, borderTopLeftRadius: 18, borderBottomLeftRadius: 18, opacity: 0.7 }} />

          {msg.extraCard && (
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start',
              backgroundColor: isLight ? 'rgba(124,58,237,0.06)' : 'rgba(206,174,114,0.08)',
              borderRadius: 12, padding: 10, borderWidth: 1,
              borderColor: isLight ? 'rgba(124,58,237,0.15)' : 'rgba(206,174,114,0.18)' }}>
              <View style={{ width: 50, height: 82, borderRadius: 8, overflow: 'hidden',
                borderWidth: 1.5, borderColor: GOLD + '66' }}>
                <TarotCardVisual deck={getTarotDeckById(deckId)} card={msg.extraCard.card} isReversed={msg.extraCard.isReversed} faceDown={false} size="small" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: GOLD, fontSize: 8.5, letterSpacing: 2.5, fontWeight: '800', marginBottom: 4 }}>
                  {msg.extraCard.label.toUpperCase()}
                </Text>
                <Text style={{ color: isLight ? '#2D1A50' : '#F5F1EA', fontSize: 15, fontWeight: '800', lineHeight: 20, marginBottom: 4 }}>
                  {resolveUserFacingText(msg.extraCard.card.name)}
                </Text>
                {msg.extraCard.isReversed && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#F87171' }} />
                    <Text style={{ color: '#F87171', fontSize: 10, fontWeight: '600' }}>odwrócona</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <Text style={[cm.oracleText, {
            color: isLight ? '#2D1A50' : 'rgba(245,241,234,0.92)',
          }]}>{msg.content}</Text>

          {/* Sparkle decoration bottom-right */}
          <View style={{ alignSelf: 'flex-end', flexDirection: 'row', gap: 3, marginTop: 8, opacity: 0.45 }}>
            <Sparkles size={9} color={GOLD} />
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  /* User bubble */
  return (
    <Animated.View entering={FadeInUp.springify()} style={cm.userWrapper}>
      <LinearGradient
        colors={isLight
          ? ['rgba(80,50,150,0.09)', 'rgba(60,30,120,0.05)']
          : ['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.04)']}
        start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
        style={[cm.userBubble, {
          borderColor: isLight ? 'rgba(80,50,150,0.18)' : 'rgba(255,255,255,0.12)',
        }]}>
        <Text style={[cm.userText, { color: isLight ? '#3D2060' : 'rgba(245,241,234,0.80)' }]}>
          {msg.content}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
};

const cm = StyleSheet.create({
  /* Oracle */
  oracleWrapper: { marginLeft: 18, marginRight: 54, marginBottom: 18 },
  oracleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingLeft: 2 },
  oracleAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  oracleBubble: { borderRadius: 18, borderTopLeftRadius: 4, borderWidth: 1, padding: 16, paddingLeft: 19 },
  oracleText: { fontSize: 14.5, lineHeight: 24, letterSpacing: 0.15 },
  /* User */
  userWrapper: { marginLeft: 54, marginRight: 18, marginBottom: 14 },
  userBubble: { borderRadius: 18, borderTopRightRadius: 4, borderWidth: 1, padding: 13, paddingHorizontal: 15 },
  userText: { fontSize: 14, lineHeight: 22 },
});

// ─── Intro Sheet ──────────────────────────────────────────────────────────────
const IntroSheet = ({
  onStart, spreadId, setSpreadId, topicId, setTopicId,
  forSomeone, setForSomeone, someoneName, setSomeoneName,
  allowReversals, setAllowReversals,
  energyLevel, setEnergyLevel, insetsBottom,
  localDeckId, setLocalDeckId, onDeckPress,
}: any) => {
  const { isLight } = useTheme();

  const sectionBg = isLight ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.04)';
  const sectionBorder = isLight ? 'rgba(139,100,180,0.18)' : 'rgba(206,174,114,0.14)';
  const labelColor = isLight ? 'rgba(90,50,140,0.75)' : GOLD_DIM;
  const textPrimary = isLight ? '#2D1A50' : '#F5F1EA';
  const textMuted = isLight ? 'rgba(60,30,100,0.60)' : 'rgba(245,241,234,0.50)';

  return (
    <View style={[is.container, { paddingBottom: Math.max((insetsBottom ?? 0) + 16, 28),
      backgroundColor: isLight ? 'rgba(244,238,252,0.97)' : 'rgba(8,3,22,0.97)',
      borderColor: isLight ? 'rgba(139,100,180,0.25)' : 'rgba(206,174,114,0.20)',
    }]}>
      <LinearGradient
        colors={isLight
          ? ['rgba(244,238,252,0.97)', 'rgba(238,228,250,0.99)']
          : ['rgba(10,4,32,0.97)', 'rgba(15,8,37,0.99)']}
        style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}
      />
      <View style={[is.handle, isLight && { backgroundColor: 'rgba(100,60,160,0.20)' }]} />

      {/* Wrap content in ScrollView so button is reachable on small screens */}
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>

        {/* Title row */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text style={[is.title, { color: textPrimary }]}>Rytuał Tarota</Text>
          <Text style={[is.subtitle, { color: textMuted }]}>W co dziś chcesz się wgłębić?</Text>
        </View>

        {/* ── Section: Energia ── */}
        <View style={[is.section, { backgroundColor: sectionBg, borderColor: sectionBorder }]}>
          <Text style={[is.sectionLabel, { color: labelColor }]}>✦ TWOJA ENERGIA TERAZ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
              {ENERGY_LEVELS.map(e => (
                <Pressable
                  key={e.id}
                  onPress={() => { HapticsService.impact('light'); setEnergyLevel(energyLevel === e.id ? null : e.id); }}
                  style={[is.energyChip,
                    isLight
                      ? { borderColor: 'rgba(100,60,160,0.20)', backgroundColor: 'rgba(255,255,255,0.60)' }
                      : {},
                    energyLevel === e.id && { borderColor: GOLD, backgroundColor: 'rgba(206,174,114,0.15)' }]}
                >
                  <Text style={{ fontSize: 16 }}>{e.emoji}</Text>
                  <Text style={[is.energyLabel, { color: energyLevel === e.id ? GOLD : textMuted }]}>{e.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ── Section: Temat ── */}
        <View style={[is.section, { backgroundColor: sectionBg, borderColor: sectionBorder }]}>
          <Text style={[is.sectionLabel, { color: labelColor }]}>◎ TEMAT ODCZYTU</Text>
          <View style={is.topicGrid}>
            {TOPICS.map(t => (
              <Pressable
                key={t.id}
                onPress={() => { HapticsService.impact('light'); setTopicId(t.id); }}
                style={[is.topicChip,
                  isLight
                    ? { borderColor: 'rgba(100,60,160,0.20)', backgroundColor: 'rgba(255,255,255,0.50)' }
                    : {},
                  topicId === t.id && { borderColor: t.color, backgroundColor: t.color + '18' }]}
              >
                <Text style={[is.topicText, { color: topicId === t.id ? t.color : textMuted }]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Section: Talia ── */}
        <View style={[is.section, { backgroundColor: sectionBg, borderColor: sectionBorder }]}>
          <Text style={[is.sectionLabel, { color: labelColor }]}>✧ TWOJA TALIA</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 12, paddingRight: 12 }}>
              {TAROT_DECKS.map(deck => {
                const isActive = localDeckId === deck.id;
                const isPremiumDeck = deck.isPremium === true;
                return (
                  <Pressable
                    key={deck.id}
                    onPress={() => onDeckPress(deck)}
                    style={{
                      width: 108, borderRadius: 18,
                      overflow: 'hidden',
                      borderWidth: isActive ? 2.5 : 1,
                      borderColor: isActive ? deck.accent[0] : isLight ? 'rgba(100,60,160,0.22)' : 'rgba(255,255,255,0.14)',
                      shadowColor: isActive ? deck.accent[0] : 'transparent',
                      shadowOpacity: isActive ? 0.50 : 0,
                      shadowRadius: isActive ? 10 : 0,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: isActive ? 6 : 0,
                    }}
                  >
                    {/* Card back preview area */}
                    <LinearGradient
                      colors={deck.backGradient as [string, string, string]}
                      style={{ height: 120, alignItems: 'center', justifyContent: 'center', padding: 10 }}
                    >
                      {/* Mini card frame */}
                      <View style={{
                        width: 52, height: 80, borderRadius: 8,
                        borderWidth: 1.5, borderColor: deck.accent[0] + 'AA',
                        backgroundColor: deck.backGradient[1] + 'CC',
                        alignItems: 'center', justifyContent: 'center',
                        shadowColor: deck.accent[0], shadowOpacity: 0.5, shadowRadius: 6,
                      }}>
                        <Text style={{ fontSize: 22 }}>
                          {deck.motif === 'classic' ? '✦' : deck.motif === 'celestial' ? '🌙' : deck.motif === 'mystical' ? '🔮' : deck.motif === 'bw' ? '◈' : '✧'}
                        </Text>
                        <Text style={{ color: deck.accent[0], fontSize: 7, fontWeight: '800', letterSpacing: 1, marginTop: 3, textAlign: 'center' }}>
                          {deck.cardBackLabel?.split('·')[0]?.trim() || deck.id.toUpperCase().slice(0, 5)}
                        </Text>
                      </View>
                      {/* Active glow overlay */}
                      {isActive && (
                        <View style={{ position: 'absolute', inset: 0, backgroundColor: deck.accent[0] + '20' }} />
                      )}
                      {/* Premium badge */}
                      {isPremiumDeck && (
                        <View style={{
                          position: 'absolute', top: 8, left: 8,
                          paddingHorizontal: 6, paddingVertical: 2,
                          borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.70)',
                          borderWidth: 1, borderColor: '#F472B660',
                        }}>
                          <Text style={{ color: '#F472B6', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 }}>PREMIUM</Text>
                        </View>
                      )}
                      {/* Selected check */}
                      {isActive && (
                        <View style={{
                          position: 'absolute', top: 8, right: 8,
                          width: 20, height: 20, borderRadius: 10,
                          backgroundColor: deck.accent[0], alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>
                        </View>
                      )}
                    </LinearGradient>
                    {/* Deck name strip */}
                    <View style={{
                      backgroundColor: isActive ? deck.backGradient[0] : isLight ? 'rgba(240,232,252,0.95)' : 'rgba(10,5,25,0.95)',
                      paddingHorizontal: 8, paddingVertical: 7, borderTopWidth: 1,
                      borderTopColor: isActive ? deck.accent[0] + '55' : isLight ? 'rgba(100,60,160,0.12)' : 'rgba(255,255,255,0.06)',
                    }}>
                      <Text numberOfLines={2} style={{ fontSize: 9, fontWeight: '700', textAlign: 'center', color: isActive ? deck.accent[0] : textMuted, lineHeight: 13, letterSpacing: 0.2 }}>
                        {deck.name}
                      </Text>
                      {deck.textureLabel ? (
                        <Text style={{ color: textMuted, fontSize: 7.5, textAlign: 'center', marginTop: 2, letterSpacing: 0.5 }}>
                          {deck.textureLabel}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* ── Section: Układ kart ── */}
        <View style={[is.section, { backgroundColor: sectionBg, borderColor: sectionBorder }]}>
          <Text style={[is.sectionLabel, { color: labelColor }]}>⊕ UKŁAD KART</Text>
          <View style={{ gap: 8 }}>
            {SPREADS.map(sp => (
              <Pressable
                key={sp.id}
                onPress={() => { HapticsService.impact('light'); setSpreadId(sp.id); }}
                style={[is.spreadRow,
                  isLight ? { borderColor: 'rgba(100,60,160,0.18)' } : {},
                  spreadId === sp.id && { borderColor: GOLD + '80', backgroundColor: 'rgba(206,174,114,0.08)' }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[is.spreadName, { color: spreadId === sp.id ? GOLD : textPrimary }]}>{sp.label}</Text>
                  <Text style={[is.spreadDesc, { color: textMuted }]}>{sp.desc}</Text>
                </View>
                <View style={[{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
                  spreadId === sp.id
                    ? { backgroundColor: 'rgba(206,174,114,0.18)', borderColor: GOLD + '66' }
                    : { backgroundColor: 'transparent', borderColor: isLight ? 'rgba(100,60,160,0.15)' : 'rgba(255,255,255,0.10)' }]}>
                  <Text style={{ color: spreadId === sp.id ? GOLD : textMuted, fontSize: 12, fontWeight: '700' }}>
                    {sp.count} {sp.count === 1 ? 'karta' : 'karty'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Section: Opcje dodatkowe (reversals + for someone) ── */}
        <View style={[is.section, { backgroundColor: sectionBg, borderColor: sectionBorder }]}>
          <Text style={[is.sectionLabel, { color: labelColor }]}>⚙ OPCJE</Text>

          {/* Allow reversals toggle */}
          <Pressable
            onPress={() => { HapticsService.impact('light'); setAllowReversals((v: boolean) => !v); }}
            style={[is.optionRow, isLight ? { borderColor: 'rgba(100,60,160,0.14)' } : {},
              allowReversals && { borderColor: GOLD + '50', backgroundColor: 'rgba(206,174,114,0.06)' }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: allowReversals ? GOLD : textPrimary, fontSize: 14, fontWeight: '600' }}>
                Odwrócone karty
              </Text>
              <Text style={[is.spreadDesc, { color: textMuted }]}>
                {allowReversals ? 'Karty mogą pojawiać się odwrócone (25%)' : 'Tylko karty proste — łatwiejszy odczyt'}
              </Text>
            </View>
            <View style={[is.toggleTrack, allowReversals ? { backgroundColor: GOLD } : { backgroundColor: isLight ? 'rgba(100,60,160,0.15)' : 'rgba(255,255,255,0.12)' }]}>
              <View style={[is.toggleThumb, { alignSelf: allowReversals ? 'flex-end' : 'flex-start' }]} />
            </View>
          </Pressable>

          {/* For someone toggle */}
          <Pressable
            onPress={() => { HapticsService.impact('light'); setForSomeone((v: boolean) => !v); }}
            style={[is.optionRow, { marginTop: 8 },
              isLight ? { borderColor: 'rgba(100,60,160,0.14)' } : {},
              forSomeone && { borderColor: '#A78BFA80', backgroundColor: 'rgba(167,139,250,0.08)' }]}
          >
            <Text style={{ color: forSomeone ? '#A78BFA' : textPrimary, fontSize: 14, fontWeight: '600', flex: 1 }}>
              Odczyt dla kogoś innego
            </Text>
            <View style={[{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
              alignItems: 'center', justifyContent: 'center' },
              forSomeone ? { borderColor: '#A78BFA', backgroundColor: '#A78BFA' } : { borderColor: isLight ? 'rgba(100,60,160,0.30)' : 'rgba(245,241,234,0.25)' }]}>
              {forSomeone && <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>✓</Text>}
            </View>
          </Pressable>

          {forSomeone && (
            <TextInput
              value={someoneName}
              onChangeText={setSomeoneName}
              placeholder="Imię osoby..."
              placeholderTextColor={isLight ? 'rgba(100,60,160,0.40)' : 'rgba(245,241,234,0.30)'}
              style={[is.nameInput, { color: isLight ? '#2D1A50' : '#F5F1EA' }, isLight && { borderColor: 'rgba(167,139,250,0.40)', backgroundColor: 'rgba(167,139,250,0.06)' }]}
            />
          )}
        </View>

        {/* ── Start button ── */}
        <Pressable onPress={onStart} style={is.startBtn}>
          <LinearGradient colors={['#7C3AED', '#5B21B6']} style={is.startBtnGrad}>
            <Flame size={16} color={GOLD} />
            <Text style={is.startBtnText}>Zapal świecę · Zacznij odczyt</Text>
          </LinearGradient>
        </Pressable>

      </ScrollView>
    </View>
  );
};

const is = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(8,3,22,0.97)', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 28, paddingTop: 14,
    borderTopWidth: 1, borderColor: 'rgba(206,174,114,0.20)',
    maxHeight: '92%',
  },
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: 0.3, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, textAlign: 'center', letterSpacing: 0.3, marginBottom: 4 },
  // ── Section card ──
  section: {
    borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(206,174,114,0.14)',
  },
  sectionLabel: { fontSize: 9, color: GOLD_DIM, letterSpacing: 2.5, fontWeight: '800', marginBottom: 12 },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245,241,234,0.15)' },
  topicText: { fontSize: 13, letterSpacing: 0.2 },
  // ── Spread row ──
  spreadRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 10 },
  spreadName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  spreadDesc: { fontSize: 11, color: 'rgba(245,241,234,0.45)', lineHeight: 16 },
  // ── Option row (toggles) ──
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 12 },
  toggleTrack: { width: 42, height: 24, borderRadius: 12, padding: 3, justifyContent: 'center' },
  toggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF' },
  // ── Name input ──
  nameInput: {
    marginTop: 10, padding: 12, borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)', fontSize: 14,
    backgroundColor: 'rgba(167,139,250,0.08)',
  },
  // ── Start button ──
  startBtn: { marginTop: 4, marginBottom: 8, borderRadius: 16, overflow: 'hidden' },
  startBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, paddingHorizontal: 24 },
  startBtnText: { color: GOLD, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  // ── Energy chip ──
  energyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(245,241,234,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  energyLabel: { fontSize: 12, fontWeight: '600' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const WrozkaScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const savedWrozkaSession = useAppStore(s => s.savedWrozkaSession);
  const saveWrozkaSession = useAppStore(s => s.saveWrozkaSession);
  const clearWrozkaSession = useAppStore(s => s.clearWrozkaSession);
  const { isLight, themeName, currentTheme } = useTheme();
  const { selectedDeckId, setSelectedDeck } = useTarotStore();
  const { isPremium } = usePremiumStore();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const oracleMsgRefs = useRef<Record<number, any>>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Intro state
  const [spreadId, setSpreadId] = useState('three');
  const [topicId, setTopicId] = useState('general');
  const [forSomeone, setForSomeone] = useState(false);
  const [someoneName, setSomeoneName] = useState('');
  const [allowReversals, setAllowReversals] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);

  // Table state
  const [dealedCards, setDealedCards] = useState<any[]>([]);
  const [nextRevealIndex, setNextRevealIndex] = useState(0);
  const [interpretations, setInterpretations] = useState<Record<number, string>>({});
  const [isInterpreting, setIsInterpreting] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatDeckPointer, setChatDeckPointer] = useState(0);

  // ── Feature: Energy level selector ──
  const [energyLevel, setEnergyLevel] = useState<string | null>(null);

  // ── Feature: Drawn card modal (Dobierz kartę) ──
  const [drawnCardModal, setDrawnCardModal] = useState<{ card: any; isReversed: boolean } | null>(null);
  const [lastOracleMsgIndex, setLastOracleMsgIndex] = useState<number>(-1);

  // ── Feature: Saved quotes ──
  interface SavedQuote { text: string; date: string; topic: string; }
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [showSavedQuotes, setShowSavedQuotes] = useState(false);

  // ── Feature: Reading history ──
  interface ReadingHistoryEntry {
    date: string;
    question: string;
    topicLabel: string;
    spreadLabel: string;
    answer: string;
    expanded: boolean;
  }
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryEntry[]>([]);
  const [expandedHistoryIdx, setExpandedHistoryIdx] = useState<number | null>(null);

  // State
  const [phase, setPhase] = useState<'intro' | 'table' | 'complete'>('intro');

  const [localDeckId, setLocalDeckId] = useState(selectedDeckId || 'classic');

  const handleDeckPress = useCallback((deck: any) => {
    if (deck.isPremium && !isPremium) {
      navigation.navigate('Paywall');
      return;
    }
    HapticsService.impact('light');
    setLocalDeckId(deck.id);
    setSelectedDeck(deck.id);
  }, [isPremium, navigation, setSelectedDeck]);

  const spread = SPREADS.find(s => s.id === spreadId) || SPREADS[1];
  const deckId = localDeckId || 'classic';
  const allRevealed = nextRevealIndex >= spread.count;

  // Build seeded deck
  const dailyDeck = useMemo(() => {
    const userExtra = (userData.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return shuffleDeck(ALL_CARDS, getDateSeed(userExtra + spreadId.length));
  }, [userData.name, spreadId]);

  const topicLabel = TOPICS.find(t => t.id === topicId)?.label || 'Ogólny odczyt';
  const topicColor = TOPICS.find(t => t.id === topicId)?.color || GOLD;
  const forLabel = forSomeone && someoneName ? `dla ${someoneName}` : '';

  // ── Session continuation: check for saved session on focus ──
  useFocusEffect(useCallback(() => {
    if (savedWrozkaSession && savedWrozkaSession.dealedCards?.length > 0) {
      const ageMs = Date.now() - (savedWrozkaSession.savedAt || 0);
      // Only offer to continue if session is less than 4 hours old
      if (ageMs < 4 * 60 * 60 * 1000) {
        setShowContinuePrompt(true);
      } else {
        clearWrozkaSession();
      }
    }
  }, [savedWrozkaSession, clearWrozkaSession]));

  // ── Save session when navigating away mid-reading ──
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (dealedCards.length > 0 && phase !== 'intro') {
        saveWrozkaSession({
          dealedCards,
          interpretations,
          chatMessages,
          spreadId,
          topicId,
          phase,
          savedAt: Date.now(),
        });
      }
    });
    return unsubscribe;
  }, [navigation, dealedCards, interpretations, chatMessages, spreadId, topicId, phase, saveWrozkaSession]);

  const restoreSession = () => {
    if (!savedWrozkaSession) return;
    setDealedCards(savedWrozkaSession.dealedCards);
    setInterpretations(savedWrozkaSession.interpretations);
    setChatMessages(savedWrozkaSession.chatMessages);
    setSpreadId(savedWrozkaSession.spreadId);
    setTopicId(savedWrozkaSession.topicId);
    setPhase(savedWrozkaSession.phase);
    setNextRevealIndex(savedWrozkaSession.dealedCards.length);
    setShowIntro(false);
    setShowChat(savedWrozkaSession.phase === 'complete');
    clearWrozkaSession();
    setShowContinuePrompt(false);
  };

  const startReading = () => {
    HapticsService.impact('light');
    const raw = dailyDeck.slice(0, spread.count);
    const cards = allowReversals ? raw : raw.map(c => ({ ...c, isReversed: false }));
    setDealedCards(cards);
    setNextRevealIndex(0);
    setInterpretations({});
    setPhase('table');
    setShowIntro(false);
    setChatMessages([]);
    setShowChat(false);
    setChatDeckPointer(spread.count);
  };

  const buildSystemPrompt = useCallback(() => {
    const personName = forSomeone && someoneName ? someoneName : (userData.name || 'osoba');
    const readingFor = forSomeone && someoneName ? `dla ${someoneName}` : 'dla tej osoby';
    const energyCtx = energyLevel
      ? `\nEnergia osoby teraz: ${ENERGY_LEVELS.find(e => e.id === energyLevel)?.context || ''}`
      : '';
    const defaultPrompt = `Jesteś mądrą Wróżką Tarota — przenikliwą, osobistą, precyzyjną. Prowadzisz ${personName} przez rytuał tarota.
Temat odczytu: ${topicLabel}. Rozkład: ${spread.label} (${spread.count} ${spread.count === 1 ? 'karta' : 'kart'}).
${forSomeone ? `Ten odczyt jest ${readingFor}.` : ''}${energyCtx}
ZASADY INTERPRETACJI:
- Mów ZAWSZE o tym co karta OZNACZA dla tej osoby i jej sytuacji — NIE opisuj wyglądu karty ani symboli wizualnych.
- Każde zdanie to bezpośrednie przesłanie: "Coś się w Tobie otwiera...", "Ten czas wymaga od Ciebie...", "Twoja energia mówi..."
- Odnoś się do kontekstu pytania (${topicLabel}) — konkretne rady, ostrzeżenia, kierunek zmiany w życiu tej osoby.
- Bądź przenikliwa i bezpośrednia. Pisz do osoby, nie o kartach.
- Odpowiadaj w języku, w którym pisze do Ciebie osoba.
- Nie zaczynaj od "Karta mówi..." ani od imienia. Mów wprost: "Stoisz teraz przed...", "Coś w Tobie czeka..."`;

    return t('wrozka.oracle.systemPrompt', {
      defaultValue: defaultPrompt,
      personName,
      topicLabel,
      spreadLabel: spread.label,
      spreadCount: spread.count,
      cardWord: spread.count === 1 ? resolveUserFacingText('karta') : resolveUserFacingText('kart'),
      readingFor,
      energyCtx,
    });
  }, [topicLabel, spread, forSomeone, someoneName, userData.name, energyLevel]);

  const interpretCard = useCallback(async (idx: number, card: any, isReversed: boolean) => {
    setIsInterpreting(true);
    const cardName = resolveUserFacingText(card.name);
    const orient = isReversed ? 'odwrócona' : 'prosta';
    const slotLabel = SPREAD_SLOT_LABELS[spreadId]?.[idx] || `Karta ${idx + 1}`;
    const suitLabel = card.suit === 'major' ? 'Arcana Większa' : `${card.suit}`;
    const prompt = `Karta na pozycji "${slotLabel}": ${cardName} (${suitLabel}), ${orient}.
${idx === 0 ? `To pierwsza karta ${spread.label}.` : `Poprzednie karty: ${Object.keys(interpretations).map(i2 => {
  const c2 = dealedCards[Number(i2)];
  return c2 ? resolveUserFacingText(c2.card.name) : '';
}).filter(Boolean).join(', ')}.`}
Zinterpretuj tę kartę dla pozycji "${slotLabel}" w kontekście tematu: ${topicLabel}. 3-4 zdania. Bez nagłówków.`;

    try {
      const messages = [
        { role: 'system' as const, content: buildSystemPrompt() },
        { role: 'user' as const, content: prompt },
      ];
      const text = await AiService.chatWithOracle(messages, i18n.language?.slice(0, 2) || 'pl');
      setInterpretations(prev => ({ ...prev, [idx]: text }));
    } catch {
      setInterpretations(prev => ({ ...prev, [idx]: `${cardName} przybywa w tej chwili z ważnym przesłaniem — jej energia mówi o tym, co dziś najbardziej potrzebujesz zobaczyć.` }));
    }
    setIsInterpreting(false);
  }, [spreadId, topicLabel, dealedCards, interpretations, buildSystemPrompt, spread.label]);

  const handleCardReveal = useCallback((idx: number) => {
    const item = dealedCards[idx];
    if (!item) return;
    const newNext = idx + 1;
    setNextRevealIndex(newNext);
    interpretCard(idx, item.card, item.isReversed);

    // Scroll down after reveal
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 9999, animated: true });
    }, 400);

    if (newNext >= spread.count) {
      setTimeout(() => {
        setPhase('complete');
        setShowChat(true);
        // Add oracle opening message
        const openMsg: ChatMsg = {
          role: 'oracle',
          content: `Karty zostały wyłożone i powiedziały już wiele... Zostań chwilę z tym, co ujrzałaś/ujrzałeś. Jeśli coś Cię niepokoi, nurtuje albo chcesz zgłębić temat — zapytaj. Mogę też wyłożyć kolejną kartę, gdy poczujesz taką potrzebę.`,
        };
        setChatMessages([openMsg]);
      }, 1200);
    }
  }, [dealedCards, spread.count, spread.label]);

  const sendChatMessage = async () => {
    const msg = chatInput.trim();
    if (!msg || isChatLoading) return;
    setChatInput('');
    HapticsService.impact('light');

    const userMsg: ChatMsg = { role: 'user', content: msg };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Check if user wants a new card
    const wantsCard = /kart[aę]|wyjm|wyłóż|pokaż|rzu[ćc]|daj.*kart/i.test(msg);
    let extraCard: ChatMsg['extraCard'] | undefined;
    let cardContext = '';

    if (wantsCard && chatDeckPointer < dailyDeck.length) {
      const nextItem = dailyDeck[chatDeckPointer];
      setChatDeckPointer(p => p + 1);
      extraCard = {
        card: nextItem.card,
        isReversed: nextItem.isReversed,
        label: 'Dodatkowa karta',
      };
      const cardName = resolveUserFacingText(nextItem.card.name);
      cardContext = `\n\nWyłożyłam nową kartę: ${cardName} (${nextItem.isReversed ? 'odwrócona' : 'prosta'}). Odnieś się do niej w odpowiedzi.`;
    }

    try {
      const history = chatMessages.slice(-6).map(m => ({
        role: (m.role === 'oracle' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content,
      }));
      const cardsContext = dealedCards.map((item, i) => {
        const name = resolveUserFacingText(item.card.name);
        return `${SPREAD_SLOT_LABELS[spreadId]?.[i] || `Karta ${i + 1}`}: ${name} (${item.isReversed ? 'odwrócona' : 'prosta'})`;
      }).join('; ');

      const messages = [
        { role: 'system' as const, content: buildSystemPrompt() + `\nWyłożone karty: ${cardsContext}` },
        ...history,
        { role: 'user' as const, content: msg + cardContext },
      ];
      const text = await AiService.chatWithOracle(messages, i18n.language?.slice(0, 2) || 'pl');
      const oracleMsg: ChatMsg = { role: 'oracle', content: text, extraCard };
      setChatMessages(prev => {
        const next = [...prev, oracleMsg];
        setLastOracleMsgIndex(next.length - 1);
        return next;
      });
      // Save to reading history (keep last 10)
      const dateStr = new Date().toLocaleDateString(
        (i18n.t('common.localeCode', { defaultValue: i18n.language?.startsWith('en') ? 'en-US' : 'pl-PL' }) as string),
        { day: 'numeric', month: 'long', year: 'numeric' },
      );
      setReadingHistory(prev => {
        const entry: ReadingHistoryEntry = {
          date: dateStr,
          question: msg.length > 80 ? msg.slice(0, 80) + '…' : msg,
          topicLabel,
          spreadLabel: spread.label,
          answer: text,
          expanded: false,
        };
        return [entry, ...prev].slice(0, 10);
      });
    } catch {
      setChatMessages(prev => {
        const next = [...prev, {
          role: 'oracle' as const,
          content: 'Karty milczą przez chwilę... Spróbuj jeszcze raz, a wróżka przeczyta głębiej.',
          extraCard,
        }];
        setLastOracleMsgIndex(next.length - 1);
        return next;
      });
    }
    setIsChatLoading(false);
    // Scrolling to oracle message start is handled by the useEffect watching lastOracleMsgIndex
  };

  const resetReading = () => {
    clearWrozkaSession();
    setPhase('intro');
    setShowIntro(true);
    setDealedCards([]);
    setNextRevealIndex(0);
    setInterpretations({});
    setChatMessages([]);
    setShowChat(false);
    setChatDeckPointer(0);
    setEnergyLevel(null);
    setDrawnCardModal(null);
    setLastOracleMsgIndex(-1);
  };

  // ── Feature: Draw a random major arcana card ──
  const MAJOR_ARCANA = ALL_CARDS.filter(c => c.suit === 'major');
  const handleDrawCard = useCallback(async () => {
    if (isChatLoading) return;
    HapticsService.impact('medium');
    const idx = Math.floor(Math.random() * MAJOR_ARCANA.length);
    const card = MAJOR_ARCANA[idx];
    const isReversed = Math.random() < 0.25;
    setDrawnCardModal({ card, isReversed });

    // Auto-send oracle message about the drawn card
    const cardName = resolveUserFacingText(card.name);
    const orient = isReversed ? 'odwrócona' : 'prosta';
    setIsChatLoading(true);
    const userMsg: ChatMsg = {
      role: 'user',
      content: `[Wyciągnęłam kartę: ${cardName} (${orient})] Zinterpretuj tę kartę w kontekście naszej rozmowy.`,
    };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      const cardsContext = dealedCards.map((item, i) => {
        const name = resolveUserFacingText(item.card.name);
        return `${SPREAD_SLOT_LABELS[spreadId]?.[i] || `Karta ${i + 1}`}: ${name} (${item.isReversed ? 'odwrócona' : 'prosta'})`;
      }).join('; ');
      const history = chatMessages.slice(-4).map(m => ({
        role: (m.role === 'oracle' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content,
      }));
      const messages = [
        { role: 'system' as const, content: buildSystemPrompt() + `\nWyłożone karty: ${cardsContext}` },
        ...history,
        { role: 'user' as const, content: `Użytkownik wyciągnął dodatkową kartę: ${cardName} (${orient}). Odnieś się do niej poetycko i połącz z poprzednim kontekstem rozmowy. 3-4 zdania.` },
      ];
      const text = await AiService.chatWithOracle(messages, i18n.language?.slice(0, 2) || 'pl');
      const oracleMsg: ChatMsg = {
        role: 'oracle',
        content: text,
        extraCard: { card, isReversed, label: 'Dobrana karta' },
      };
      setChatMessages(prev => {
        const next = [...prev, oracleMsg];
        setLastOracleMsgIndex(next.length - 1);
        return next;
      });
    } catch {
      setChatMessages(prev => {
        const next = [...prev, {
          role: 'oracle' as const,
          content: `${cardName} pojawia się nie bez powodu — jej obecność mówi o tym, co teraz najważniejsze w Twojej ścieżce.`,
          extraCard: { card, isReversed, label: 'Dobrana karta' },
        }];
        setLastOracleMsgIndex(next.length - 1);
        return next;
      });
    }
    setIsChatLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  }, [isChatLoading, MAJOR_ARCANA, dealedCards, spreadId, chatMessages, buildSystemPrompt]);

  // ── Feature: Save quote ──
  const handleSaveQuote = useCallback((text: string) => {
    HapticsService.notify();
    const dateStr = new Date().toLocaleDateString(
      (i18n.t('common.localeCode', { defaultValue: i18n.language?.startsWith('en') ? 'en-US' : 'pl-PL' }) as string),
      { day: 'numeric', month: 'long', year: 'numeric' },
    );
    setSavedQuotes(prev => [{ text, date: dateStr, topic: topicLabel }, ...prev].slice(0, 50));
  }, [topicLabel]);

  const handleFavorite = () => {
    HapticsService.notify();
    if (isFavoriteItem?.('wrozka')) {
      removeFavoriteItem('wrozka');
    } else {
      addFavoriteItem({
        id: 'wrozka',
        label: resolveUserFacingText('Wróżka Tarota'),
        sublabel: resolveUserFacingText('Rytuał z talią kart'),
        route: 'Wrozka',
        icon: 'Sparkles',
        color: GOLD,
        addedAt: Date.now(),
      });
    }
  };

  // ── Scroll to START of latest oracle message ────────────────────────────────
  useEffect(() => {
    if (lastOracleMsgIndex < 0) return;
    setTimeout(() => {
      const ref = oracleMsgRefs.current[lastOracleMsgIndex];
      if (!ref || !scrollRef.current) return;
      const node = findNodeHandle(scrollRef.current);
      if (!node) return;
      ref.measureLayout(
        node,
        (_l: number, top: number) => {
          scrollRef.current?.scrollTo({ y: Math.max(0, top - 16), animated: true });
        },
        () => scrollRef.current?.scrollToEnd({ animated: true }),
      );
    }, 450);
  }, [lastOracleMsgIndex]);

  // ── Swipe-down on chat input bar → dismiss keyboard ─────────────────────────
  const chatPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 12 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderRelease: (_, g) => {
        if (g.dy > 25) Keyboard.dismiss();
      },
    }),
  ).current;

  return (
    <View style={{ flex: 1, backgroundColor: isLight ? '#F0E8F8' : '#05030F', paddingTop: insets.top }}>
      {/* Header */}
      <View style={[wr.header, { borderBottomColor: isLight ? 'rgba(139,100,42,0.15)' : 'rgba(206,174,114,0.15)' }]}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Oracle')} hitSlop={12}>
            <ChevronLeft size={22} color={GOLD} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={[wr.headerTitle, { color: isLight ? '#5B21B6' : GOLD }]}>WRÓŻKA</Text>
            {phase !== 'intro' && (
              <Text style={[wr.headerSub, { color: isLight ? 'rgba(60,30,100,0.60)' : 'rgba(245,241,234,0.45)' }]}>{topicLabel}{forLabel ? ` · ${forLabel}` : ''}</Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {phase !== 'intro' && (
              <Pressable onPress={resetReading} hitSlop={12}>
                <RefreshCw size={18} color={GOLD_DIM} />
              </Pressable>
            )}
            <Pressable onPress={() => { HapticsService.impact('light'); setShowSavedQuotes(true); }} hitSlop={12}>
              <Bookmark size={18} color={savedQuotes.length > 0 ? GOLD : GOLD_DIM} />
            </Pressable>
            <Pressable onPress={handleFavorite} hitSlop={12}>
              <Star size={18} color={isFavoriteItem?.('wrozka') ? GOLD : GOLD_DIM} fill={isFavoriteItem?.('wrozka') ? GOLD : 'none'} />
            </Pressable>
          </View>
        </View>

        {/* Intro phase */}
        {phase === 'intro' && (
          <View style={{ flex: 1 }}>
            {/* Table preview in background — absolute so it doesn't push content down */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' }}>
              <TarotTableScene phase="intro" />
            </View>
            {/* Tagline */}
            <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 10 }}>
              <Text style={{ color: isLight ? 'rgba(139,100,42,0.70)' : GOLD_DIM, fontSize: 11, letterSpacing: 3, fontWeight: '700' }}>
                RYTUAŁ TAROTA
              </Text>
              <Text style={{ color: isLight ? 'rgba(80,50,120,0.55)' : 'rgba(245,241,234,0.45)', fontSize: 12, marginTop: 4, letterSpacing: 0.3 }}>
                Talia zostanie przetasowana tylko dla Ciebie
              </Text>
            </View>
            <IntroSheet
              onStart={startReading}
              spreadId={spreadId} setSpreadId={setSpreadId}
              topicId={topicId} setTopicId={setTopicId}
              forSomeone={forSomeone} setForSomeone={setForSomeone}
              someoneName={someoneName} setSomeoneName={setSomeoneName}
              allowReversals={allowReversals} setAllowReversals={setAllowReversals}
              energyLevel={energyLevel} setEnergyLevel={setEnergyLevel}
              insetsBottom={insets.bottom}
              localDeckId={localDeckId} setLocalDeckId={setLocalDeckId}
              onDeckPress={handleDeckPress}
            />
          </View>
        )}

        {/* Table + Reading phase */}
        {phase !== 'intro' && (
          <View style={{ flex: 1 }}>
            <ScrollView
              ref={scrollRef}
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: showChat ? (keyboardHeight > 0 ? keyboardHeight + 160 : insets.bottom + 160) : insets.bottom + 80 }}
            >
              {/* Spread Table */}
              <SpreadTable
                spreadId={spreadId}
                dealedCards={dealedCards}
                nextRevealIndex={nextRevealIndex}
                onReveal={handleCardReveal}
                deckId={deckId}
                phase={phase}
              />

              {/* Topic context strip */}
              <View style={[wr.contextStrip, {
                backgroundColor: isLight ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.04)',
                borderColor: isLight ? 'rgba(139,100,42,0.18)' : 'rgba(255,255,255,0.08)',
              }]}>
                <View style={[wr.topicDot, { backgroundColor: topicColor }]} />
                <Text style={[wr.contextText, { color: topicColor }]}>{topicLabel}</Text>
                {forLabel ? <Text style={[wr.contextFor, { color: isLight ? 'rgba(60,30,100,0.55)' : 'rgba(245,241,234,0.45)' }]}> · {forLabel}</Text> : null}
                <View style={{ flex: 1 }} />
                <Text style={[wr.contextDeck, { color: isLight ? 'rgba(60,30,100,0.45)' : 'rgba(245,241,234,0.35)' }]}>{spread.label}</Text>
              </View>

              {/* Interpretation blocks */}
              {Array.from({ length: nextRevealIndex }).map((_, i) => {
                const item = dealedCards[i];
                if (!item) return null;
                return (
                  <InterpretationBlock
                    key={i}
                    card={item.card}
                    isReversed={item.isReversed}
                    slotLabel={SPREAD_SLOT_LABELS[spreadId]?.[i] || `Karta ${i + 1}`}
                    interpretation={interpretations[i] || ''}
                    deckId={deckId}
                    accentColor={topicColor}
                    index={i}
                    isLight={isLight}
                  />
                );
              })}

              {/* Interpreting indicator */}
              {isInterpreting && (
                <Animated.View entering={FadeIn} style={[wr.interpretingRow, {
                  backgroundColor: isLight ? 'rgba(139,100,42,0.08)' : 'rgba(206,174,114,0.07)',
                  borderColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(206,174,114,0.20)',
                }]}>
                  <Sparkles size={12} color={GOLD} />
                  <Text style={[wr.interpretingText, { color: isLight ? 'rgba(80,50,20,0.70)' : GOLD_DIM }]}>Wróżka odczytuje kartę...</Text>
                </Animated.View>
              )}

              {/* Chat section */}
              {showChat && (
                <Animated.View entering={FadeInDown.delay(300).springify()}>
                  <View style={wr.chatDivider}>
                    <View style={wr.chatDividerLine} />
                    <View style={wr.chatDividerBadge}>
                      <MessageCircle size={11} color={GOLD} />
                      <Text style={wr.chatDividerText}>ROZMOWA Z WRÓŻKĄ</Text>
                    </View>
                    <View style={wr.chatDividerLine} />
                  </View>

                  {/* ── Feature 1: Question category chips ── */}
                  {chatMessages.length <= 1 && (
                    <View style={{ marginHorizontal: 18, marginBottom: 14 }}>
                      <Text style={{ color: isLight ? 'rgba(100,60,160,0.60)' : GOLD_DIM, fontSize: 9, letterSpacing: 2.5, fontWeight: '700', marginBottom: 8 }}>
                        SZYBKIE PYTANIA
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18 }} contentContainerStyle={{ paddingHorizontal: 18, gap: 8, flexDirection: 'row' }}>
                        {QUESTION_CATEGORIES.map(cat => (
                          <Pressable
                            key={cat.id}
                            onPress={() => {
                              HapticsService.impact('light');
                              setChatInput(cat.template);
                              setTimeout(() => inputRef.current?.focus(), 100);
                            }}
                            style={[wr.qCatChip, { borderColor: cat.color + '55', backgroundColor: cat.color + '12' }]}
                          >
                            <Text style={{ fontSize: 13 }}>{cat.emoji}</Text>
                            <Text style={[wr.qCatChipText, { color: cat.color }]}>{cat.label}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {chatMessages.map((msg, i) => (
                    <View
                      key={i}
                      ref={msg.role === 'oracle' ? (r) => { if (r) oracleMsgRefs.current[i] = r; } : undefined}
                    >
                      <ChatMessage msg={msg} deckId={deckId} accentColor={topicColor} />
                      {/* ── Feature 5: Save quote button after oracle messages ── */}
                      {msg.role === 'oracle' && (
                        <Pressable
                          onPress={() => handleSaveQuote(msg.content)}
                          style={wr.saveQuoteBtn}
                        >
                          <Text style={{ fontSize: 12 }}>💫</Text>
                          <Text style={wr.saveQuoteBtnText}>Zapisz cytat</Text>
                        </Pressable>
                      )}
                      {/* ── Feature 3: Draw card button after last oracle message ── */}
                      {msg.role === 'oracle' && i === lastOracleMsgIndex && !isChatLoading && (
                        <Pressable onPress={handleDrawCard} style={wr.drawCardBtn}>
                          <LinearGradient
                            colors={['rgba(109,40,217,0.30)', 'rgba(91,33,182,0.20)']}
                            style={wr.drawCardBtnGrad}
                          >
                            <Text style={{ fontSize: 16 }}>🃏</Text>
                            <Text style={wr.drawCardBtnText}>Dobierz kartę</Text>
                            <Text style={wr.drawCardBtnSub}>losuj z Arcana Większa</Text>
                          </LinearGradient>
                        </Pressable>
                      )}
                    </View>
                  ))}
                  {isChatLoading && (
                    <View style={[cm.bubble, {
                      flexDirection: 'row', gap: 8, alignItems: 'center', marginHorizontal: 18,
                      backgroundColor: isLight ? 'rgba(100,60,200,0.10)' : 'rgba(109,40,217,0.18)',
                      borderColor: isLight ? 'rgba(100,60,200,0.20)' : 'rgba(206,174,114,0.20)',
                    }]}>
                      <Sparkles size={12} color={GOLD} />
                      <Text style={{ color: isLight ? '#5B21B6' : GOLD_DIM, fontSize: 13, fontStyle: 'italic' }}>Wróżka odpowiada...</Text>
                    </View>
                  )}
                </Animated.View>
              )}

              {/* ── Feature 2: Reading history ── */}
              {readingHistory.length > 0 && phase === 'complete' && (
                <Animated.View entering={FadeInDown.delay(600).springify()} style={{ marginTop: 24 }}>
                  <View style={wr.chatDivider}>
                    <View style={wr.chatDividerLine} />
                    <View style={wr.chatDividerBadge}>
                      <BookOpen size={11} color={GOLD} />
                      <Text style={wr.chatDividerText}>HISTORIA ODCZYTÓW</Text>
                    </View>
                    <View style={wr.chatDividerLine} />
                  </View>
                  {readingHistory.slice(0, 5).map((entry, i) => (
                    <Pressable
                      key={i}
                      onPress={() => setExpandedHistoryIdx(expandedHistoryIdx === i ? null : i)}
                      style={[wr.historyCard, {
                        backgroundColor: isLight ? 'rgba(255,252,245,0.88)' : 'rgba(30,10,60,0.40)',
                        borderColor: isLight ? 'rgba(139,100,42,0.18)' : 'rgba(206,174,114,0.15)',
                      }]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={wr.historyDate}>{entry.date} · {entry.topicLabel}</Text>
                          <Text style={[wr.historyQuestion, { color: isLight ? 'rgba(30,10,60,0.80)' : 'rgba(245,241,234,0.75)' }]} numberOfLines={expandedHistoryIdx === i ? undefined : 2}>
                            {entry.question}
                          </Text>
                        </View>
                        {expandedHistoryIdx === i
                          ? <ChevronUp size={14} color={GOLD_DIM} />
                          : <ChevronDown size={14} color={GOLD_DIM} />
                        }
                      </View>
                      {expandedHistoryIdx === i && (
                        <Animated.View entering={FadeIn}>
                          <View style={wr.historyDivider} />
                          <Text style={[wr.historyAnswer, { color: isLight ? 'rgba(30,10,60,0.72)' : 'rgba(245,241,234,0.70)' }]}>{entry.answer}</Text>
                        </Animated.View>
                      )}
                    </Pressable>
                  ))}
                </Animated.View>
              )}

              {/* Next card hint */}
              {!allRevealed && nextRevealIndex < dealedCards.length && (
                <Animated.View entering={FadeIn.delay(600)} style={wr.nextCardHint}>
                  <Text style={[wr.nextCardHintText, { color: isLight ? 'rgba(60,30,100,0.45)' : 'rgba(245,241,234,0.35)' }]}>
                    Dotknij następną kartę · {nextRevealIndex + 1}/{spread.count}
                  </Text>
                </Animated.View>
              )}

              <EndOfContentSpacer variant="standard" />
            </ScrollView>

            {/* Chat Input (only after all cards revealed) */}
            {showChat && (
              <View
                {...chatPanResponder.panHandlers}
                style={[wr.chatInputContainer, {
                  bottom: keyboardHeight > 0 ? keyboardHeight : 0,
                  paddingBottom: keyboardHeight > 0 ? 8 : Math.max(insets.bottom + 8, 12),
                  backgroundColor: isLight ? 'rgba(244,238,252,0.97)' : 'rgba(5,3,15,0.94)',
                  borderTopWidth: 1,
                  borderTopColor: isLight ? 'rgba(100,60,200,0.18)' : 'rgba(206,174,114,0.20)',
                }]}
              >
                {/* Prompt hint — visible when keyboard is down */}
                {keyboardHeight === 0 && !chatInput && (
                  <Text style={{
                    textAlign: 'center',
                    fontSize: 11,
                    letterSpacing: 1.5,
                    fontWeight: '600',
                    color: isLight ? 'rgba(100,60,200,0.55)' : 'rgba(206,174,114,0.55)',
                    marginBottom: 8,
                  }}>
                    ✦ Dotknij, by porozmawiać z wróżką ✦
                  </Text>
                )}
                <View style={[wr.chatInputRow, {
                  borderColor: isLight ? 'rgba(100,60,200,0.22)' : 'rgba(206,174,114,0.28)',
                }]}>
                  <TextInput
                    ref={inputRef}
                    value={chatInput}
                    onChangeText={setChatInput}
                    placeholder="Zadaj pytanie lub poproś o kolejną kartę..."
                    placeholderTextColor={isLight ? 'rgba(60,30,100,0.38)' : 'rgba(245,241,234,0.26)'}
                    style={[wr.chatInput, {
                      color: isLight ? '#2D1A50' : '#F5F1EA',
                      backgroundColor: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(20,12,40,0.96)',
                      borderColor: isLight ? 'rgba(100,60,200,0.18)' : 'rgba(255,255,255,0.10)',
                    }]}
                    multiline
                    onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 350)}
                    onSubmitEditing={sendChatMessage}
                    returnKeyType="send"
                    blurOnSubmit={true}
                  />
                  <Pressable
                    onPress={sendChatMessage}
                    disabled={!chatInput.trim() || isChatLoading}
                    style={[wr.sendBtn, (!chatInput.trim() || isChatLoading) && { opacity: 0.35 }]}
                  >
                    <LinearGradient colors={['#7C3AED', '#5B21B6']} style={wr.sendBtnGrad}>
                      <Sparkles size={16} color={GOLD} />
                    </LinearGradient>
                  </Pressable>
                </View>
                <Text style={[wr.chatHint, { color: isLight ? 'rgba(80,50,120,0.50)' : 'rgba(245,241,234,0.28)' }]}>
                  Przesuń w dół, aby ukryć klawiaturę · wpisz „wyłóż kartę", by dobrać nową
                </Text>
              </View>
            )}
          </View>
        )}
      {/* ── Session Continuation Modal ── */}
      <Modal visible={showContinuePrompt} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: isLight ? '#FAF6FF' : '#0F0625', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, borderWidth: 1, borderColor: isLight ? 'rgba(100,60,200,0.25)' : 'rgba(206,174,114,0.30)' }}>
            <Text style={{ fontSize: 22, textAlign: 'center', marginBottom: 6 }}>✦</Text>
            <Text style={{ color: isLight ? '#2D1A50' : '#F5F1EA', fontSize: 17, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
              Masz niedokończony odczyt
            </Text>
            <Text style={{ color: isLight ? 'rgba(60,30,100,0.65)' : 'rgba(245,241,234,0.60)', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 22 }}>
              Czy chcesz kontynuować poprzednią sesję z Wróżką?
            </Text>
            <Pressable
              onPress={restoreSession}
              style={{ backgroundColor: '#7C3AED', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 10 }}
            >
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>✦ Kontynuuj sesję</Text>
            </Pressable>
            <Pressable
              onPress={() => { clearWrozkaSession(); setShowContinuePrompt(false); }}
              style={{ padding: 12, alignItems: 'center' }}
            >
              <Text style={{ color: isLight ? 'rgba(60,30,100,0.55)' : 'rgba(245,241,234,0.45)', fontSize: 14 }}>Zacznij od nowa</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Feature 3: Drawn Card Modal ── */}
      <Modal
        visible={drawnCardModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawnCardModal(null)}
      >
        <Pressable style={wr.modalOverlay} onPress={() => setDrawnCardModal(null)}>
          <Pressable style={wr.drawnCardModal} onPress={e => e.stopPropagation()}>
            <LinearGradient
              colors={['#1A0638', '#0F0420']}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            />
            <Text style={wr.drawnCardModalTitle}>✦ DOBRANA KARTA ✦</Text>
            {drawnCardModal && (
              <>
                <View style={wr.drawnCardVisual}>
                  <TarotCardVisual
                    deck={getTarotDeckById(deckId)}
                    card={drawnCardModal.card}
                    isReversed={drawnCardModal.isReversed}
                    faceDown={false}
                    size="small"
                  />
                </View>
                <Text style={wr.drawnCardName}>{resolveUserFacingText(drawnCardModal.card.name)}</Text>
                <Text style={wr.drawnCardOrient}>
                  {drawnCardModal.isReversed ? '🔄 Odwrócona' : '✦ Prosta'} · Arcana Większa
                </Text>
              </>
            )}
            <Pressable onPress={() => setDrawnCardModal(null)} style={wr.drawnCardClose}>
              <Text style={{ color: GOLD, fontSize: 13, fontWeight: '700', letterSpacing: 1.5 }}>ZAMKNIJ</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Feature 5: Saved Quotes Modal ── */}
      <Modal
        visible={showSavedQuotes}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSavedQuotes(false)}
      >
        <View style={wr.sqModalBg}>
          <View style={wr.sqModal}>
            <LinearGradient
              colors={isLight ? ['#FAF4FF', '#F5EEFF'] : ['#0F0420', '#1A0638']}
              style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}
            />
            <View style={[wr.sqHandle, { backgroundColor: isLight ? 'rgba(100,60,160,0.20)' : 'rgba(255,255,255,0.18)' }]} />
            <View style={wr.sqHeader}>
              <Text style={[wr.sqTitle, { color: isLight ? '#5B21B6' : GOLD }]}>💫 ZAPISANE CYTATY</Text>
              <Pressable onPress={() => setShowSavedQuotes(false)} hitSlop={12}>
                <X size={20} color={isLight ? 'rgba(60,30,100,0.55)' : GOLD_DIM} />
              </Pressable>
            </View>
            {savedQuotes.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 32, marginBottom: 12 }}>💫</Text>
                <Text style={{ color: isLight ? 'rgba(60,30,100,0.55)' : 'rgba(245,241,234,0.45)', fontSize: 14, textAlign: 'center' }}>
                  Nie masz jeszcze zapisanych cytatów.{'\n'}Naciśnij „Zapisz cytat" po odpowiedzi Wróżki.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {savedQuotes.map((q, i) => (
                  <View key={i} style={[wr.sqCard, {
                    borderColor: isLight ? 'rgba(100,60,160,0.18)' : 'rgba(206,174,114,0.18)',
                  }]}>
                    <LinearGradient
                      colors={isLight ? ['rgba(167,139,250,0.08)', 'rgba(139,92,246,0.04)'] : ['rgba(109,40,217,0.15)', 'rgba(91,33,182,0.08)']}
                      style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                    />
                    <Text style={[wr.sqCardMeta, { color: isLight ? 'rgba(100,60,160,0.60)' : GOLD_DIM }]}>{q.date} · {q.topic}</Text>
                    <Text style={[wr.sqCardText, { color: isLight ? 'rgba(30,10,60,0.85)' : 'rgba(245,241,234,0.88)' }]}>"{q.text}"</Text>
                  </View>
                ))}
                <View style={{ height: 24 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const wr = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(206,174,114,0.15)',
  },
  headerTitle: { fontSize: 13, fontWeight: '800', color: GOLD, letterSpacing: 4 },
  headerSub: { fontSize: 10, color: 'rgba(245,241,234,0.45)', letterSpacing: 0.5, marginTop: 1 },
  contextStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 20, marginBottom: 14, marginTop: 10,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  topicDot: { width: 7, height: 7, borderRadius: 3.5 },
  contextText: { fontSize: 12, fontWeight: '600' },
  contextFor: { fontSize: 12, color: 'rgba(245,241,234,0.45)' },
  contextDeck: { fontSize: 10, color: 'rgba(245,241,234,0.35)', letterSpacing: 0.5 },
  interpretingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 12, paddingVertical: 10,
    paddingHorizontal: 14, borderRadius: 12, backgroundColor: 'rgba(206,174,114,0.07)',
    borderWidth: 0.5, borderColor: 'rgba(206,174,114,0.20)',
  },
  interpretingText: { color: GOLD_DIM, fontSize: 13, fontStyle: 'italic' },
  nextCardHint: {
    alignItems: 'center', paddingVertical: 10, marginTop: 4, marginBottom: 8,
  },
  nextCardHintText: { color: 'rgba(245,241,234,0.35)', fontSize: 11, letterSpacing: 1.5 },
  chatDivider: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginVertical: 18, gap: 10 },
  chatDividerLine: { flex: 1, height: 0.5, backgroundColor: 'rgba(206,174,114,0.25)' },
  chatDividerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(206,174,114,0.30)', backgroundColor: 'rgba(206,174,114,0.07)' },
  chatDividerText: { color: GOLD, fontSize: 9, letterSpacing: 2, fontWeight: '700' },
  chatInputContainer: { position: 'absolute', left: 0, right: 0, paddingTop: 8, paddingHorizontal: 16, paddingBottom: 8, backgroundColor: 'rgba(5,3,15,0.85)', zIndex: 10 },
  chatInputRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', backgroundColor: 'transparent',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(206,174,114,0.25)', padding: 10 },
  chatInput: { flex: 1, color: '#F5F1EA', fontSize: 14, lineHeight: 20, maxHeight: 80, backgroundColor: 'rgba(20,12,40,0.96)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  sendBtn: { width: 40, height: 40, borderRadius: 12, overflow: 'hidden' },
  sendBtnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chatHint: { fontSize: 10, color: 'rgba(245,241,234,0.25)', textAlign: 'center', marginTop: 6, marginBottom: 4, letterSpacing: 0.3 },

  // Question category chips
  qCatChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1,
  },
  qCatChipText: { fontSize: 12, fontWeight: '600' },

  // Draw card button
  drawCardBtn: { marginHorizontal: 18, marginBottom: 10, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(139,92,246,0.35)' },
  drawCardBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16 },
  drawCardBtnText: { color: GOLD, fontSize: 14, fontWeight: '700', flex: 1 },
  drawCardBtnSub: { color: 'rgba(245,241,234,0.40)', fontSize: 10, letterSpacing: 0.5 },

  // Save quote button
  saveQuoteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginHorizontal: 18, marginTop: -4, marginBottom: 10,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(206,174,114,0.25)', backgroundColor: 'rgba(206,174,114,0.06)',
  },
  saveQuoteBtnText: { color: GOLD_DIM, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  // Reading history
  historyCard: {
    marginHorizontal: 18, marginBottom: 10, padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(206,174,114,0.15)',
    backgroundColor: 'rgba(30,10,60,0.40)',
  },
  historyDate: { fontSize: 10, color: GOLD_DIM, letterSpacing: 1, marginBottom: 4 },
  historyQuestion: { fontSize: 13, color: 'rgba(245,241,234,0.75)', lineHeight: 19 },
  historyDivider: { height: 0.5, backgroundColor: 'rgba(206,174,114,0.20)', marginVertical: 10 },
  historyAnswer: { fontSize: 13, color: 'rgba(245,241,234,0.70)', lineHeight: 20, fontStyle: 'italic' },

  // Drawn card modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
  drawnCardModal: {
    width: SW * 0.82, borderRadius: 24, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(206,174,114,0.30)', overflow: 'hidden',
  },
  drawnCardModalTitle: { fontSize: 11, color: GOLD, letterSpacing: 3.5, fontWeight: '700', marginBottom: 20 },
  drawnCardVisual: { width: 130, height: 210, borderRadius: 10, overflow: 'hidden', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(206,174,114,0.50)',
    shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20 },
  drawnCardName: { fontSize: 20, fontWeight: '800', color: '#F5F1EA', letterSpacing: 0.3, textAlign: 'center', marginBottom: 6 },
  drawnCardOrient: { fontSize: 12, color: GOLD_DIM, letterSpacing: 0.5, marginBottom: 24 },
  drawnCardClose: { paddingHorizontal: 28, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(206,174,114,0.40)', backgroundColor: 'rgba(206,174,114,0.08)' },

  // Saved quotes modal
  sqModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sqModal: { height: '75%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', paddingHorizontal: 20, paddingBottom: 24 },
  sqHandle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginTop: 14, marginBottom: 16 },
  sqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sqTitle: { fontSize: 13, fontWeight: '800', color: GOLD, letterSpacing: 3 },
  sqCard: {
    marginBottom: 12, padding: 16, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(206,174,114,0.18)',
  },
  sqCardMeta: { fontSize: 10, color: GOLD_DIM, letterSpacing: 1, marginBottom: 6 },
  sqCardText: { fontSize: 14, color: 'rgba(245,241,234,0.88)', lineHeight: 22, fontStyle: 'italic' },
});
