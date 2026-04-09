// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Dimensions, Pressable, ScrollView, StyleSheet, Text, View, TextInput,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence,
  withDelay, Easing, FadeInDown, FadeInUp, withSpring, interpolate,
  useAnimatedProps, cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle, Path, G, Line, Text as SvgText, Defs, RadialGradient, Stop,
  Polygon, Ellipse, Rect,
} from 'react-native-svg';
import { useAppStore } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { useTarotStore } from '../features/tarot/store/useTarotStore';
import { useOracleStore } from '../store/useOracleStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { HapticsService } from '../core/services/haptics.service';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import {
  Star, ChevronLeft, Sparkles, Trophy, Zap, BookOpen, Moon, Heart,
  Lock, Award, Flame, Crown, Shield, Target, Wind, Music, Gem, Eye,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW, height: SH } = Dimensions.get('window');
const ACCENT = '#CEAE72';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Achievement data ──────────────────────────────────────────────────────────
const RARITY = {
  COMMON:    { label: 'POSPOLITE',  color: '#8BC48A', glow: '#8BC48A44' },
  RARE:      { label: 'RZADKIE',    color: '#6BB8D4', glow: '#6BB8D444' },
  EPIC:      { label: 'EPICZNE',    color: '#A58FD8', glow: '#A58FD844' },
  LEGENDARY: { label: 'LEGENDARNE', color: '#CEAE72', glow: '#CEAE7244' },
};

const CAT_COLORS = {
  'Dziennik':      '#34D399',
  'Zaangażowanie': '#CEAE72',
  'Tarot':         '#A78BFA',
  'Oracle':        '#60A5FA',
  'Medytacja':     '#FB7185',
  'Rytuały':       '#F97316',
  'Numerologia':   '#818CF8',
  'Odkrycia':      '#E879F9',
};

const ACHIEVEMENTS = [
  // ─── Dziennik ───────────────────────────────────────────────────────────────
  {
    id: 'first_entry', icon: '📖', title: 'Pierwszy zapis',
    desc: 'Dodaj pierwszy wpis do dziennika sanktuarium.',
    category: 'Dziennik', rarity: RARITY.COMMON, points: 10,
    maxProgress: 1, getProgress: (s) => Math.min(s.entries, 1),
  },
  {
    id: 'entries_7', icon: '✍️', title: 'Kronikarz tygodnia',
    desc: 'Zgromadź 7 wpisów w dzienniku.',
    category: 'Dziennik', rarity: RARITY.COMMON, points: 25,
    maxProgress: 7, getProgress: (s) => Math.min(s.entries, 7),
  },
  {
    id: 'entries_30', icon: '📚', title: 'Strażnik pamięci',
    desc: 'Zapisz 30 refleksji, snów lub rytuałów.',
    category: 'Dziennik', rarity: RARITY.RARE, points: 75,
    maxProgress: 30, getProgress: (s) => Math.min(s.entries, 30),
  },
  {
    id: 'entries_100', icon: '🏛️', title: 'Archiwista duszy',
    desc: 'Sto wpisów — historia, którą piszesz każdego dnia.',
    category: 'Dziennik', rarity: RARITY.LEGENDARY, points: 200,
    maxProgress: 100, getProgress: (s) => Math.min(s.entries, 100),
  },
  // ─── Zaangażowanie ─────────────────────────────────────────────────────────
  {
    id: 'streak_3', icon: '🔥', title: 'Trzy iskry',
    desc: 'Wróć do Aethery przez 3 dni z rzędu.',
    category: 'Zaangażowanie', rarity: RARITY.COMMON, points: 15,
    maxProgress: 3, getProgress: (s) => Math.min(s.streak, 3),
  },
  {
    id: 'streak_7', icon: '⚡', title: 'Rytm tygodnia',
    desc: 'Zachowaj ciągłość przez 7 dni.',
    category: 'Zaangażowanie', rarity: RARITY.COMMON, points: 40,
    maxProgress: 7, getProgress: (s) => Math.min(s.streak, 7),
  },
  {
    id: 'streak_30', icon: '👑', title: 'Mistrz rytmu',
    desc: 'Praktykuj przez 30 dni bez przerwy.',
    category: 'Zaangażowanie', rarity: RARITY.EPIC, points: 150,
    maxProgress: 30, getProgress: (s) => Math.min(s.streak, 30),
  },
  {
    id: 'streak_100', icon: '🏆', title: 'Sto dni światła',
    desc: 'Utrzymaj praktykę przez 100 dni z rzędu.',
    category: 'Zaangażowanie', rarity: RARITY.LEGENDARY, points: 500,
    maxProgress: 100, getProgress: (s) => Math.min(s.streak, 100),
  },
  {
    id: 'days_active_14', icon: '🌤️', title: 'Dwa tygodnie obecności',
    desc: 'Odwiedź Ætherę przez łącznie 14 różnych dni.',
    category: 'Zaangażowanie', rarity: RARITY.RARE, points: 30,
    maxProgress: 14, getProgress: (s) => Math.min(s.daysActive, 14),
  },
  // ─── Tarot ─────────────────────────────────────────────────────────────────
  {
    id: 'first_tarot', icon: '🃏', title: 'Pierwszy odczyt',
    desc: 'Otwórz pierwszy rozkład tarota.',
    category: 'Tarot', rarity: RARITY.COMMON, points: 10,
    maxProgress: 1, getProgress: (s) => Math.min(s.tarotReadings, 1),
  },
  {
    id: 'tarot_10', icon: '✦', title: 'Czytelnik symboli',
    desc: 'Wykonaj 10 odczytów tarota.',
    category: 'Tarot', rarity: RARITY.RARE, points: 50,
    maxProgress: 10, getProgress: (s) => Math.min(s.tarotReadings, 10),
  },
  {
    id: 'tarot_25', icon: '🌟', title: 'Mistrz Arkany',
    desc: 'Przeprowadź 25 pełnych odczytów tarota.',
    category: 'Tarot', rarity: RARITY.EPIC, points: 120,
    maxProgress: 25, getProgress: (s) => Math.min(s.tarotReadings, 25),
  },
  // ─── Oracle ────────────────────────────────────────────────────────────────
  {
    id: 'first_oracle', icon: '🔮', title: 'Pierwsze pytanie',
    desc: 'Rozpocznij pierwszą sesję z Oracle.',
    category: 'Oracle', rarity: RARITY.COMMON, points: 10,
    maxProgress: 1, getProgress: (s) => Math.min(s.oracleSessions, 1),
  },
  {
    id: 'oracle_10', icon: '🌀', title: 'Głęboka rozmowa',
    desc: 'Odbądź 10 sesji z Oracle.',
    category: 'Oracle', rarity: RARITY.RARE, points: 60,
    maxProgress: 10, getProgress: (s) => Math.min(s.oracleSessions, 10),
  },
  {
    id: 'oracle_50', icon: '🪬', title: 'Wtajemniczony',
    desc: 'Pięćdziesiąt rozmów z Oracle. Słuchasz coraz głębiej.',
    category: 'Oracle', rarity: RARITY.LEGENDARY, points: 200,
    maxProgress: 50, getProgress: (s) => Math.min(s.oracleSessions, 50),
  },
  // ─── Medytacja ─────────────────────────────────────────────────────────────
  {
    id: 'first_medit', icon: '🧘', title: 'Pierwsza cisza',
    desc: 'Ukończ pierwszą sesję medytacji.',
    category: 'Medytacja', rarity: RARITY.COMMON, points: 10,
    maxProgress: 1, getProgress: (s) => Math.min(s.meditationSessions, 1),
  },
  {
    id: 'medit_10', icon: '🧠', title: 'Umysł w spokoju',
    desc: 'Zamknij 10 sesji medytacyjnych.',
    category: 'Medytacja', rarity: RARITY.RARE, points: 55,
    maxProgress: 10, getProgress: (s) => Math.min(s.meditationSessions, 10),
  },
  {
    id: 'breathwork_5', icon: '💨', title: 'Oddech uwalniający',
    desc: 'Ukończ 5 sesji oddechowych.',
    category: 'Medytacja', rarity: RARITY.COMMON, points: 30,
    maxProgress: 5, getProgress: (s) => Math.min(s.breathworkCount, 5),
  },
  {
    id: 'breathwork_10', icon: '🌬️', title: 'Mistrz oddechu',
    desc: 'Zamknij 10 sesji oddechowych.',
    category: 'Medytacja', rarity: RARITY.RARE, points: 60,
    maxProgress: 10, getProgress: (s) => Math.min(s.breathworkCount, 10),
  },
  // ─── Rytuały ───────────────────────────────────────────────────────────────
  {
    id: 'first_ritual', icon: '🕯️', title: 'Pierwsza ceremonia',
    desc: 'Ukończ pierwszy rytuał.',
    category: 'Rytuały', rarity: RARITY.COMMON, points: 15,
    maxProgress: 1, getProgress: (s) => Math.min(s.rituals, 1),
  },
  {
    id: 'ritual_5', icon: '🌿', title: 'Strażnik praktyki',
    desc: 'Domknij 5 rytuałów.',
    category: 'Rytuały', rarity: RARITY.RARE, points: 45,
    maxProgress: 5, getProgress: (s) => Math.min(s.rituals, 5),
  },
  {
    id: 'ritual_20', icon: '🔯', title: 'Kapłan ceremonii',
    desc: 'Przeprowadź 20 rytualnych praktyk.',
    category: 'Rytuały', rarity: RARITY.EPIC, points: 130,
    maxProgress: 20, getProgress: (s) => Math.min(s.rituals, 20),
  },
  // ─── Numerologia ───────────────────────────────────────────────────────────
  {
    id: 'numerology_first', icon: '🔢', title: 'Liczby duszy',
    desc: 'Odkryj swój osobisty numer na ekranie Numerologii.',
    category: 'Numerologia', rarity: RARITY.COMMON, points: 10,
    maxProgress: 1, getProgress: (s) => s.hasProfile ? 1 : 0,
  },
  {
    id: 'year_card', icon: '🗓️', title: 'Karta Roku',
    desc: 'Sprawdź swoją kartę roku i roczną prognozę.',
    category: 'Numerologia', rarity: RARITY.RARE, points: 25,
    maxProgress: 1, getProgress: (s) => s.hasProfile ? 1 : 0,
  },
  // ─── Odkrycia ──────────────────────────────────────────────────────────────
  {
    id: 'dream_5', icon: '🌙', title: 'Powiernik snów',
    desc: 'Zachowaj 5 zapisów ze snów.',
    category: 'Odkrycia', rarity: RARITY.COMMON, points: 30,
    maxProgress: 5, getProgress: (s) => Math.min(s.dreams, 5),
  },
  {
    id: 'profile_complete', icon: '✅', title: 'Pełna sygnatura',
    desc: 'Uzupełnij podstawowe dane profilu.',
    category: 'Odkrycia', rarity: RARITY.COMMON, points: 10,
    maxProgress: 1, getProgress: (s) => s.hasProfile ? 1 : 0,
  },
  {
    id: 'all_worlds', icon: '🌍', title: 'Odkrywca światów',
    desc: 'Eksploruj Ætherę i zbieraj pierwsze ślady praktyki.',
    category: 'Odkrycia', rarity: RARITY.COMMON, points: 20,
    maxProgress: 3, getProgress: (s) => Math.min(s.entries, 3),
  },
  {
    id: 'wedrowiec', icon: '🔭', title: 'Wędrowiec duszy',
    desc: 'Łącznie 15 sesji medytacji i oddechu.',
    category: 'Odkrycia', rarity: RARITY.EPIC, points: 75,
    maxProgress: 15, getProgress: (s) => Math.min(s.meditationSessions + s.breathworkCount, 15),
  },
  {
    id: 'intention_5', icon: '✨', title: 'Twórca intencji',
    desc: 'Stwórz 5 kart intencji.',
    category: 'Odkrycia', rarity: RARITY.RARE, points: 20,
    maxProgress: 5, getProgress: (s) => Math.min(s.intentionCards, 5),
  },
  {
    id: 'gratitude_7', icon: '🙏', title: 'Wdzięczność w rytmie',
    desc: 'Zapisz wdzięczność przez 7 różnych dni.',
    category: 'Odkrycia', rarity: RARITY.RARE, points: 50,
    maxProgress: 7, getProgress: (s) => Math.min(s.gratitudeDays, 7),
  },
  {
    id: 'first_affirmation', icon: '💫', title: 'Pierwsze potwierdzenie',
    desc: 'Zapisz pierwszą afirmację do ulubionych.',
    category: 'Odkrycia', rarity: RARITY.COMMON, points: 10,
    maxProgress: 1, getProgress: (s) => Math.min(s.savedAffirmations, 1),
  },
];

const CATEGORIES = ['Wszystko', 'Dziennik', 'Zaangażowanie', 'Tarot', 'Oracle', 'Medytacja', 'Rytuały', 'Numerologia', 'Odkrycia'];

const RANKS = [
  { title: 'Nowicjusz',     min: 0,    icon: '🌱', color: '#8BC48A' },
  { title: 'Poszukiwacz',   min: 100,  icon: '🌊', color: '#6BB8D4' },
  { title: 'Wtajemniczony', min: 300,  icon: '🔮', color: '#A58FD8' },
  { title: 'Mistrz',        min: 700,  icon: '⚡', color: ACCENT },
  { title: 'Archont',       min: 1500, icon: '👁️', color: '#E8C97A' },
];

function getRank(pts: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (pts >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
}

// ─── AchievementOrb Widget ─────────────────────────────────────────────────────
const ORB_SIZE = 200;
const ORB_CX = ORB_SIZE / 2;
const ORB_CY = ORB_SIZE / 2;

function AchievementOrb({ unlockedCount, totalCount }: { unlockedCount: number; totalCount: number }) {
  const rotate1 = useSharedValue(0);
  const rotate2 = useSharedValue(0);
  const pulse = useSharedValue(1);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const particleAngle = useSharedValue(0);

  useEffect(() => {
    rotate1.value = withRepeat(withTiming(360, { duration: 8000, easing: Easing.linear }), -1, false);
    rotate2.value = withRepeat(withTiming(-360, { duration: 12000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withSequence(
      withTiming(1.08, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      withTiming(1.0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
    ), -1, false);
    particleAngle.value = withRepeat(withTiming(360, { duration: 5000, easing: Easing.linear }), -1, false);
    return () => {
      cancelAnimation(rotate1); cancelAnimation(rotate2);
      cancelAnimation(pulse); cancelAnimation(particleAngle);
    };
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-25, Math.min(25, e.translationY * 0.3));
      tiltY.value = Math.max(-25, Math.min(25, e.translationX * 0.3));
    })
    .onEnd(() => {
      tiltX.value = withSpring(0);
      tiltY.value = withSpring(0);
    });

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate1.value}deg` }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate2.value}deg` }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const particleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${particleAngle.value}deg` }],
  }));

  // Tick marks on outer ring
  const ticks = Array.from({ length: totalCount }, (_, i) => {
    const angle = (i / totalCount) * 2 * Math.PI - Math.PI / 2;
    const r = 88;
    const x1 = ORB_CX + (r - 6) * Math.cos(angle);
    const y1 = ORB_CY + (r - 6) * Math.sin(angle);
    const x2 = ORB_CX + r * Math.cos(angle);
    const y2 = ORB_CY + r * Math.sin(angle);
    return { x1, y1, x2, y2, earned: i < unlockedCount };
  });

  // Particles
  const particles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * 2 * Math.PI;
    const r = 72;
    return {
      cx: ORB_CX + r * Math.cos(angle),
      cy: ORB_CY + r * Math.sin(angle),
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ width: ORB_SIZE, height: ORB_SIZE, alignSelf: 'center' }, wrapStyle]}>
        {/* Glow aura */}
        <Animated.View style={[StyleSheet.absoluteFill, pulseStyle]}>
          <Svg width={ORB_SIZE} height={ORB_SIZE}>
            <Defs>
              <RadialGradient id="aura" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={ACCENT} stopOpacity="0.18" />
                <Stop offset="60%" stopColor={ACCENT} stopOpacity="0.06" />
                <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={ORB_CX} cy={ORB_CY} r={96} fill="url(#aura)" />
          </Svg>
        </Animated.View>

        {/* Outer rotating ring with ticks */}
        <Animated.View style={[StyleSheet.absoluteFill, ring1Style]}>
          <Svg width={ORB_SIZE} height={ORB_SIZE}>
            <Circle cx={ORB_CX} cy={ORB_CY} r={88} fill="none" stroke={ACCENT} strokeWidth={1.2} strokeOpacity={0.35} />
            {ticks.map((t, i) => (
              <Line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke={t.earned ? ACCENT : 'rgba(206,174,114,0.25)'}
                strokeWidth={t.earned ? 2.5 : 1} />
            ))}
          </Svg>
        </Animated.View>

        {/* Inner orb with RadialGradient */}
        <Svg width={ORB_SIZE} height={ORB_SIZE} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="sphere" cx="38%" cy="32%" r="58%">
              <Stop offset="0%" stopColor="#FFF5DC" stopOpacity="0.95" />
              <Stop offset="35%" stopColor={ACCENT} stopOpacity="0.85" />
              <Stop offset="70%" stopColor="#8B6914" stopOpacity="0.90" />
              <Stop offset="100%" stopColor="#2A1A00" stopOpacity="1" />
            </RadialGradient>
            <RadialGradient id="sheen" cx="30%" cy="25%" r="40%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={ORB_CX} cy={ORB_CY} r={62} fill="url(#sphere)" />
          <Circle cx={ORB_CX} cy={ORB_CY} r={62} fill="url(#sheen)" />
          {/* Sacred geometry inner lines */}
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * 2 * Math.PI;
            return (
              <Line key={i}
                x1={ORB_CX} y1={ORB_CY}
                x2={ORB_CX + 42 * Math.cos(a)} y2={ORB_CY + 42 * Math.sin(a)}
                stroke={ACCENT} strokeWidth={0.6} strokeOpacity={0.4} />
            );
          })}
          <Circle cx={ORB_CX} cy={ORB_CY} r={22} fill="none" stroke={ACCENT} strokeWidth={0.8} strokeOpacity={0.6} />
          <Circle cx={ORB_CX} cy={ORB_CY} r={42} fill="none" stroke={ACCENT} strokeWidth={0.6} strokeOpacity={0.3} />
        </Svg>

        {/* Counter-rotating inner ring */}
        <Animated.View style={[StyleSheet.absoluteFill, ring2Style]}>
          <Svg width={ORB_SIZE} height={ORB_SIZE}>
            <Circle cx={ORB_CX} cy={ORB_CY} r={70} fill="none"
              stroke={ACCENT} strokeWidth={1} strokeOpacity={0.4}
              strokeDasharray="4 8" />
          </Svg>
        </Animated.View>

        {/* Orbiting gold particles */}
        <Animated.View style={[StyleSheet.absoluteFill, particleStyle]}>
          <Svg width={ORB_SIZE} height={ORB_SIZE}>
            {particles.map((p, i) => (
              <Circle key={i} cx={p.cx} cy={p.cy} r={i % 3 === 0 ? 4 : 2.5}
                fill={ACCENT} opacity={i % 3 === 0 ? 0.9 : 0.55} />
            ))}
          </Svg>
        </Animated.View>

        {/* Center count text */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800', letterSpacing: 1 }}>{unlockedCount}</Text>
          <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: -2 }}>{t('achievements.trofeow', 'TROFEÓW')}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Constellation SVG ─────────────────────────────────────────────────────────
function ConstellationMap({ achievements, stats }: { achievements: any[]; stats: any }) {
  const twinkle = useSharedValue(0);
  useEffect(() => {
    twinkle.value = withRepeat(withSequence(
      withTiming(1, { duration: 2000 }),
      withTiming(0, { duration: 2000 }),
    ), -1, true);
    return () => cancelAnimation(twinkle);
  }, []);

  const stars = useMemo(() => achievements.map((a, i) => {
    const angle = (i / achievements.length) * 2 * Math.PI;
    const layer = i % 3;
    const r = 46 + layer * 28;
    const prog = a.getProgress(stats);
    const earned = prog >= a.maxProgress;
    return {
      cx: 110 + r * Math.cos(angle),
      cy: 100 + r * Math.sin(angle),
      earned,
      color: CAT_COLORS[a.category] || ACCENT,
      r: earned ? (a.rarity === RARITY.LEGENDARY ? 7 : a.rarity === RARITY.EPIC ? 5.5 : 4) : 2.5,
    };
  }), [achievements, stats]);

  const twinkleStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + twinkle.value * 0.4,
  }));

  return (
    <Animated.View style={twinkleStyle}>
      <Svg width={220} height={200}>
        {/* Connection lines */}
        {stars.filter(s => s.earned).map((s, i, arr) => {
          if (i === 0) return null;
          const prev = arr[i - 1];
          return (
            <Line key={i} x1={prev.cx} y1={prev.cy} x2={s.cx} y2={s.cy}
              stroke={ACCENT} strokeWidth={0.5} strokeOpacity={0.25} />
          );
        })}
        {/* Stars */}
        {stars.map((s, i) => (
          <G key={i}>
            {s.earned && (
              <Circle cx={s.cx} cy={s.cy} r={s.r + 4} fill={s.color} opacity={0.15} />
            )}
            <Circle cx={s.cx} cy={s.cy} r={s.r}
              fill={s.earned ? s.color : 'rgba(255,255,255,0.12)'}
              stroke={s.earned ? s.color : 'rgba(255,255,255,0.18)'}
              strokeWidth={0.8} />
          </G>
        ))}
      </Svg>
    </Animated.View>
  );
}

// ─── Achievement Card ──────────────────────────────────────────────────────────
function AchievementCard({ item, stats, isLight, index }: {
  item: any; stats: any; isLight: boolean; index: number;
}) {
  const progress = item.getProgress(stats);
  const earned = progress >= item.maxProgress;
  const pct = item.maxProgress > 0 ? Math.min(1, progress / item.maxProgress) : 0;
  const catColor = CAT_COLORS[item.category] || ACCENT;
  const pressScale = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const cardBg = isLight
    ? earned
      ? `${catColor}18`
      : 'rgba(255,255,255,0.88)'
    : earned
      ? `${catColor}14`
      : 'rgba(255,255,255,0.05)';

  const cardBorder = isLight
    ? earned ? `${catColor}55` : 'rgba(122,95,54,0.18)'
    : earned ? `${catColor}44` : 'rgba(255,255,255,0.08)';

  const textColor = isLight ? '#1A1A2E' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.5)';

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
      <Animated.View style={pressStyle}>
      <Pressable
        onPressIn={() => { pressScale.value = withSpring(0.97); }}
        onPressOut={() => { pressScale.value = withSpring(1); }}
        onPress={() => HapticsService.notify()}
      >
        <LinearGradient
          colors={isLight
            ? [earned ? `${catColor}20` : 'rgba(240,228,210,0.90)', earned ? `${catColor}08` : 'rgba(0,0,0,0.01)']
            : [earned ? `${catColor}18` : 'rgba(255,255,255,0.06)', 'rgba(0,0,0,0.0)']
          }
          style={[styles.achCard, { borderColor: cardBorder, backgroundColor: cardBg }]}
        >
          {/* Lock overlay for locked items */}
          {!earned && (
            <View style={styles.achLockBadge}>
              <Lock size={11} color={isLight ? 'rgba(0,0,0,0.58)' : 'rgba(255,255,255,0.35)'} />
            </View>
          )}

          {/* Emoji badge */}
          <View style={[styles.achEmoji, {
            backgroundColor: earned
              ? (isLight ? `${catColor}28` : `${catColor}20`)
              : (isLight ? 'rgba(255,246,230,0.92)' : 'rgba(255,255,255,0.06)'),
            borderColor: earned ? `${catColor}55` : 'transparent',
            borderWidth: 1,
            opacity: earned ? 1 : 0.45,
          }]}>
            <Text style={{ fontSize: 30 }}>{item.icon}</Text>
          </View>

          {/* Content */}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Text style={[styles.achTitle, { color: textColor, opacity: earned ? 1 : 0.55 }]}>
                {item.title}
              </Text>
              <View style={[styles.rarityBadge, { backgroundColor: `${item.rarity.color}22`, borderColor: `${item.rarity.color}55` }]}>
                <Text style={[styles.rarityLabel, { color: item.rarity.color }]}>{item.rarity.label}</Text>
              </View>
            </View>
            <Text style={[styles.achDesc, { color: subColor }]} numberOfLines={2}>{item.desc}</Text>

            {/* Progress bar */}
            <View style={[styles.progressBg, { backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)', marginTop: 8 }]}>
              <View style={[styles.progressFill, {
                width: `${pct * 100}%`,
                backgroundColor: earned ? catColor : `${catColor}88`,
              }]} />
            </View>
            <Text style={[styles.progressLabel, { color: subColor }]}>
              {earned ? `✓ Zdobyte` : `${progress} / ${item.maxProgress}`}
            </Text>
          </View>

          {/* Points */}
          <View style={[styles.pointsBadge, { borderColor: earned ? `${catColor}55` : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)') }]}>
            <Text style={[styles.pointsText, { color: earned ? catColor : subColor }]}>+{item.points}</Text>
            <Text style={[styles.pointsUnit, { color: subColor }]}>{t('achievements.pkt', 'pkt')}</Text>
          </View>
        </LinearGradient>
      </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Stats mini-card ───────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, isLight }: {
  label: string; value: string | number; icon: any; color: string; isLight: boolean;
}) {
  const Icon = icon;
  const textColor = isLight ? '#1A1A2E' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.45)';
  const cardBg = isLight ? `${color}14` : `${color}10`;
  return (
    <LinearGradient
      colors={isLight ? [`${color}18`, `${color}08`] : [`${color}14`, 'rgba(0,0,0,0)']}
      style={[styles.statCard, { borderColor: `${color}33`, backgroundColor: cardBg }]}
    >
      <Icon size={18} color={color} />
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: subColor }]}>{label}</Text>
    </LinearGradient>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export const AchievementsScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { currentTheme, isLight } = useTheme();
  const insets = useSafeAreaInsets();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const userData = useAppStore(s => s.userData);
  const themeName = useAppStore(s => s.themeName);
  const themeMode = useAppStore(s => s.themeMode);
  const meditationSessions = useAppStore(s => s.meditationSessions);
  const breathworkSessions = useAppStore(s => s.breathworkSessions);
  const streaks = useAppStore(s => s.streaks);
  const dailyProgress = useAppStore(s => s.dailyProgress);
  const gratitudeEntries = useAppStore(s => s.gratitudeEntries);
  const intentionCards = useAppStore(s => s.intentionCards);
  const favoriteAffirmations = useAppStore(s => s.favoriteAffirmations);

  const { entries: journalEntries } = useJournalStore();
  const { pastReadings } = useTarotStore();
  const { pastSessions: oracleSessions } = useOracleStore();

  const [activeCategory, setActiveCategory] = useState('Wszystko');
  const [showUpcoming, setShowUpcoming] = useState(true);
  const textColor = isLight ? '#1A1A2E' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.5)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.06)';
  const borderColor = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)';

  // ─── Compute stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const dreamEntries = journalEntries.filter((e: any) => e.type === 'dream');
    const ritualDays = Object.values(dailyProgress).filter((d: any) => d.ritualCompleted).length;
    const gratitudeDays = new Set(gratitudeEntries.map((e: any) => e.date?.slice(0, 10))).size;
    const daysActive = Object.keys(dailyProgress).length;

    return {
      entries: journalEntries.length,
      dreams: dreamEntries.length,
      streak: streaks.current,
      daysActive,
      tarotReadings: pastReadings.length,
      oracleSessions: oracleSessions.length,
      meditationSessions: meditationSessions.length,
      breathworkCount: breathworkSessions.length,
      rituals: ritualDays,
      hasProfile: !!(userData?.name && userData?.birthDate),
      intentionCards: intentionCards?.length ?? 0,
      gratitudeDays,
      savedAffirmations: favoriteAffirmations?.length ?? 0,
    };
  }, [journalEntries, pastReadings, oracleSessions, meditationSessions,
      breathworkSessions, dailyProgress, streaks, gratitudeEntries,
      intentionCards, favoriteAffirmations, userData]);

  // ─── Derived achievement data ───────────────────────────────────────────────
  const achievementsWithProgress = useMemo(() =>
    ACHIEVEMENTS.map(a => ({
      ...a,
      progress: a.getProgress(stats),
      earned: a.getProgress(stats) >= a.maxProgress,
    })), [stats]);

  const totalPoints = useMemo(() =>
    achievementsWithProgress.filter(a => a.earned).reduce((s, a) => s + a.points, 0),
    [achievementsWithProgress]);

  const unlockedCount = useMemo(() =>
    achievementsWithProgress.filter(a => a.earned).length,
    [achievementsWithProgress]);

  const rank = useMemo(() => getRank(totalPoints), [totalPoints]);

  const thisWeekUnlocked = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    // We don't have exact unlock dates stored, approximate via progress
    return achievementsWithProgress.filter(a => a.earned).length > 0
      ? Math.min(unlockedCount, 3)
      : 0;
  }, [unlockedCount]);

  const rarestBadge = useMemo(() => {
    const order = [RARITY.LEGENDARY, RARITY.EPIC, RARITY.RARE, RARITY.COMMON];
    for (const r of order) {
      const found = achievementsWithProgress.find(a => a.earned && a.rarity === r);
      if (found) return found;
    }
    return null;
  }, [achievementsWithProgress]);

  const filteredAchievements = useMemo(() =>
    activeCategory === 'Wszystko'
      ? achievementsWithProgress
      : achievementsWithProgress.filter(a => a.category === activeCategory),
    [activeCategory, achievementsWithProgress]);

  const upcomingAchievements = useMemo(() =>
    achievementsWithProgress
      .filter(a => !a.earned && a.progress > 0)
      .sort((a, b) => (b.progress / b.maxProgress) - (a.progress / a.maxProgress))
      .slice(0, 3),
    [achievementsWithProgress]);

  // ─── Star (favorite) ────────────────────────────────────────────────────────
  const FAV_ID = 'achievements';
  const isStarred = isFavoriteItem(FAV_ID);
  const handleStar = useCallback(() => {
    HapticsService.notify();
    if (isStarred) {
      useAppStore.getState().removeFavoriteItem(FAV_ID);
    } else {
      addFavoriteItem({
        id: FAV_ID,
        label: 'Osiągnięcia',
        sublabel: 'Twoje trofea i postęp',
        route: 'Achievements',
        icon: 'Trophy',
        color: ACCENT,
        addedAt: new Date().toISOString(),
      });
    }
  }, [isStarred, addFavoriteItem]);

  const bgColors = isLight
    ? ['#FAF7F0', '#F3EDD8', '#FAF7F0']
    : ['#05030E', '#0D0820', '#05030E'];

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView
      style={{ flex: 1}}
      edges={['top']}
    >

      <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Profile')} style={styles.headerBtn} hitSlop={12}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('achievements.osiagnieci', '✦ OSIĄGNIĘCIA')}</Text>
        <Pressable onPress={handleStar} style={styles.headerBtn} hitSlop={12}>
          <Star size={20} color={isStarred ? ACCENT : textColor} fill={isStarred ? ACCENT : 'none'} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero orb ── */}
        <Animated.View entering={FadeInDown.springify()} style={styles.heroSection}>
          <AchievementOrb unlockedCount={unlockedCount} totalCount={ACHIEVEMENTS.length} />

          {/* Rank badge */}
          <Animated.View entering={FadeInUp.delay(300).springify()} style={[styles.rankBadge, { borderColor: `${rank.color}55`, backgroundColor: isLight ? `${rank.color}18` : `${rank.color}14` }]}>
            <Text style={{ fontSize: 20 }}>{rank.icon}</Text>
            <Text style={[styles.rankTitle, { color: rank.color }]}>{rank.title}</Text>
            <Text style={[styles.rankPoints, { color: subColor }]}>{totalPoints} pkt</Text>
          </Animated.View>
        </Animated.View>

        {/* ── Stats Row ── */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statsRow}>
          <StatCard label={t('achievements.zdobyte', 'Zdobyte')} value={unlockedCount} icon={Trophy} color={ACCENT} isLight={isLight} />
          <StatCard label={t('achievements.ten_tydzien', 'Ten tydzień')} value={thisWeekUnlocked} icon={Zap} color="#60A5FA" isLight={isLight} />
          <StatCard label={t('achievements.seria_dni', 'Seria dni')} value={stats.streak} icon={Flame} color="#FB7185" isLight={isLight} />
          <StatCard
            label={t('achievements.najrzadsze', 'Najrzadsze')}
            value={rarestBadge ? rarestBadge.icon : '—'}
            icon={Crown}
            color="#A58FD8"
            isLight={isLight}
          />
        </Animated.View>

        {/* ── Constellation map ── */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={[styles.section, { borderColor, backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{t('achievements.mapa_konstelacj', '✦ MAPA KONSTELACJI')}</Text>
          <Text style={[styles.sectionSub, { color: subColor }]}>{t('achievements.swiecace_gwiazdy_zdobyte_trofea', 'Świecące gwiazdy — zdobyte trofea')}</Text>
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <ConstellationMap achievements={ACHIEVEMENTS} stats={stats} />
          </View>
        </Animated.View>

        {/* ── Category tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}
        >
          {CATEGORIES.map(cat => {
            const active = cat === activeCategory;
            const catColor = cat === 'Wszystko' ? ACCENT : (CAT_COLORS[cat] || ACCENT);
            return (
              <Pressable
                key={cat}
                onPress={() => { setActiveCategory(cat); HapticsService.notify(); }}
                style={[styles.catTab, {
                  backgroundColor: active
                    ? (isLight ? `${catColor}22` : `${catColor}18`)
                    : (isLight ? 'rgba(255,248,234,0.92)' : 'rgba(255,255,255,0.06)'),
                  borderColor: active ? `${catColor}66` : borderColor,
                }]}
              >
                <Text style={[styles.catTabText, {
                  color: active ? catColor : subColor,
                  fontWeight: active ? '700' : '500',
                }]}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Achievement cards ── */}
        <View style={styles.achList}>
          {filteredAchievements.map((item, i) => (
            <AchievementCard
              key={item.id}
              item={item}
              stats={stats}
              isLight={isLight}
              index={i}
            />
          ))}
        </View>

        {/* ── Upcoming achievements ── */}
        {upcomingAchievements.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).springify()} style={[styles.section, { borderColor, backgroundColor: cardBg }]}>
            <Pressable
              onPress={() => { setShowUpcoming(v => !v); HapticsService.notify(); }}
              style={styles.sectionHeader}
            >
              <View>
                <Text style={[styles.sectionTitle, { color: textColor }]}>{t('achievements.na_wyciagniec_reki', '✦ NA WYCIĄGNIĘCIE RĘKI')}</Text>
                <Text style={[styles.sectionSub, { color: subColor }]}>{t('achievements.kolejne_trofea_do_zdobycia', 'Kolejne trofea do zdobycia')}</Text>
              </View>
              <Target size={18} color={ACCENT} />
            </Pressable>

            {showUpcoming && upcomingAchievements.map((item, i) => {
              const pct = item.maxProgress > 0 ? Math.min(1, item.progress / item.maxProgress) : 0;
              const catColor = CAT_COLORS[item.category] || ACCENT;
              return (
                <Animated.View key={item.id} entering={FadeInDown.delay(i * 80).springify()} style={[styles.upcomingCard, {
                  borderColor: `${catColor}33`,
                  backgroundColor: isLight ? `${catColor}10` : `${catColor}0C`,
                }]}>
                  <Text style={{ fontSize: 28 }}>{item.icon}</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.achTitle, { color: textColor }]}>{item.title}</Text>
                    <View style={[styles.progressBg, { backgroundColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', marginTop: 6 }]}>
                      <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: catColor }]} />
                    </View>
                    <Text style={[styles.progressLabel, { color: subColor }]}>
                      {item.progress} / {item.maxProgress} — {Math.round(pct * 100)}% ukończone
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        <EndOfContentSpacer />
      </ScrollView>
        </SafeAreaView>
</View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.padding.screen,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 16,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  rankTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rankPoints: {
    fontSize: 13,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: layout.padding.screen,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: layout.padding.screen,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '400',
  },
  tabsScroll: {
    marginBottom: 16,
  },
  tabsContent: {
    paddingHorizontal: layout.padding.screen,
    gap: 8,
  },
  catTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catTabText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  achList: {
    paddingHorizontal: layout.padding.screen,
    gap: 10,
    marginBottom: 16,
  },
  achCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    position: 'relative',
  },
  achLockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  achEmoji: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 4,
  },
  achDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 10,
    marginTop: 3,
    fontWeight: '500',
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
  },
  rarityLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pointsBadge: {
    alignItems: 'center',
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 40,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '800',
  },
  pointsUnit: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: -1,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
});

export default AchievementsScreen;
