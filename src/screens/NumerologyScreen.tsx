// @ts-nocheck
import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import i18n from '../core/i18n';
import { getLocaleCode } from '../core/utils/localeFormat';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, withSpring, interpolate, Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View, Share, useWindowDimensions, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight, Binary, Brain, ChevronLeft, ChevronDown, ChevronUp,
  HeartHandshake, Orbit, Users, Star, Gem, Calendar, TrendingUp,
  Hash, Sparkles, Zap, Sun, Moon, Globe2, Triangle, Layers,
  BookOpen, Compass, Target, Clock, BarChart3, Shield, Eye,
  Flame, Droplets, Wind, Mountain, Activity, Award, Infinity,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { Typography } from '../components/Typography';
import { MysticalInput } from '../components/MysticalInput';
import { SectionHeading } from '../components/SectionHeading';
import { calculateCompatibility, calculateMatrix, getEnergyMeaning, reduceTo22 } from '../features/matrix/utils/numerology';
import { goBackOrToMainTab, navigateToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { PremiumDatePickerSheet } from '../components/PremiumDatePickerSheet';
import { DateWheelPicker } from '../components/DateWheelPicker';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { buildNumerologyShareMessage } from '../core/utils/share';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '../core/utils/localeFormat';
import { HapticsService } from '../core/services/haptics.service';
import { useTheme } from '../core/hooks/useTheme';
const SW = Dimensions.get('window').width;
const SH = Dimensions.get('window').height;

// ── Animated Sacred Geometry Background ─────────────────────
const NumerologyBackground = ({ isLight }: { isLight: boolean }) => {
  const rot1 = useSharedValue(0);
  const rot2 = useSharedValue(0);
  const glow = useSharedValue(0.5);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    rot1.value = withRepeat(withTiming(360, { duration: 40000 }), -1, false);
    rot2.value = withRepeat(withTiming(-360, { duration: 28000 }), -1, false);
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 3000 }), withTiming(0.4, { duration: 3000 })),
      -1, false,
    );
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-18, Math.min(18, e.translationY * 0.06));
      tiltY.value = Math.max(-18, Math.min(18, e.translationX * 0.06));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 1200 });
      tiltY.value = withTiming(0, { duration: 1200 });
    });

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rot1.value}deg` }],
    opacity: 0.18,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rot2.value}deg` }],
    opacity: 0.13,
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * (isLight ? 0.08 : 0.22),
  }));
  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));

  const CX = SW / 2;
  const CY = SH * 0.38;
  const R = 56; // petal radius for Flower of Life
  const ACCENT = '#F59E0B';
  const VIOLET = '#A78BFA';

  // Flower of Life: center + 6 surrounding circles
  const flowerCenters = [
    { x: CX,       y: CY },
    { x: CX + R,   y: CY },
    { x: CX - R,   y: CY },
    { x: CX + R/2, y: CY - R * 0.866 },
    { x: CX - R/2, y: CY - R * 0.866 },
    { x: CX + R/2, y: CY + R * 0.866 },
    { x: CX - R/2, y: CY + R * 0.866 },
  ];

  // Outer rings at various radii
  const outerRings = [R * 2.1, R * 3.2, R * 4.4, R * 5.7];

  // Pythagorean number spiral points
  const spiralPoints = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * 2 * Math.PI - Math.PI / 2;
    const radius = R * 1.3 + i * R * 0.18;
    return {
      x: CX + radius * Math.cos(angle),
      y: CY + radius * Math.sin(angle),
      num: (i % 9) + 1,
      r: 10 - i * 0.3,
    };
  });

  if (isLight) {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#FAF6EE', '#F2E8D8', '#EDE0CA']}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Deep dark base */}
      <LinearGradient
        colors={['#030414', '#07060F', '#0A0A1E']}
        style={StyleSheet.absoluteFill}
      />

      {/* Radial glow center */}
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width={SW} height={SH} style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgRadialGradient id="bgGlow" cx="50%" cy="38%" r="45%">
              <Stop offset="0%" stopColor={ACCENT} stopOpacity="1" />
              <Stop offset="40%" stopColor={VIOLET} stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#030209" stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>
          <Circle cx={CX} cy={CY} r={SW * 0.72} fill="url(#bgGlow)" />
        </Svg>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[StyleSheet.absoluteFill, outerStyle]}>

          {/* Layer 1: Flower of Life petals (slow rotation) */}
          <Animated.View style={[StyleSheet.absoluteFill, ring1Style]}>
            <Svg width={SW} height={SH} style={StyleSheet.absoluteFill}>
              {flowerCenters.map((c, i) => (
                <Circle key={`f${i}`} cx={c.x} cy={c.y} r={R}
                  fill="none" stroke={ACCENT} strokeWidth={0.6} opacity={0.55} />
              ))}
              {/* Outer protective rings */}
              {outerRings.map((r2, i) => (
                <Circle key={`or${i}`} cx={CX} cy={CY} r={r2}
                  fill="none"
                  stroke={i % 2 === 0 ? ACCENT : VIOLET}
                  strokeWidth={0.5}
                  strokeDasharray={`${4 + i * 2} ${6 + i * 2}`}
                  opacity={0.22 - i * 0.04} />
              ))}
            </Svg>
          </Animated.View>

          {/* Layer 2: Counter-rotating inner geometry */}
          <Animated.View style={[StyleSheet.absoluteFill, ring2Style]}>
            <Svg width={SW} height={SH} style={StyleSheet.absoluteFill}>
              {/* Star of David / hexagram lines */}
              {[0, 60, 120, 180, 240, 300].map((deg, i) => {
                const rad = deg * Math.PI / 180;
                const rad2 = (deg + 180) * Math.PI / 180;
                const r3 = R * 1.7;
                return (
                  <Line key={`star${i}`}
                    x1={CX + r3 * Math.cos(rad)} y1={CY + r3 * Math.sin(rad)}
                    x2={CX + r3 * Math.cos(rad2)} y2={CY + r3 * Math.sin(rad2)}
                    stroke={VIOLET} strokeWidth={0.7} opacity={0.5} />
                );
              })}
              {/* Number spiral particles */}
              {spiralPoints.map((p, i) => (
                <Circle key={`sp${i}`} cx={p.x} cy={p.y} r={Math.max(2.5, p.r)}
                  fill={i % 3 === 0 ? ACCENT : VIOLET}
                  opacity={0.28 + (i % 5) * 0.1} />
              ))}
            </Svg>
          </Animated.View>

          {/* Static overlay: faint grid */}
          <Svg width={SW} height={SH} style={[StyleSheet.absoluteFill, { opacity: 0.06 }]}>
            {Array.from({ length: 12 }, (_, i) => (
              <Line key={`gl${i}`}
                x1={0} y1={i * SH / 11}
                x2={SW} y2={i * SH / 11}
                stroke={ACCENT} strokeWidth={0.4} />
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <Line key={`gv${i}`}
                x1={i * SW / 7} y1={0}
                x2={i * SW / 7} y2={SH}
                stroke={ACCENT} strokeWidth={0.4} />
            ))}
          </Svg>
        </Animated.View>
      </GestureDetector>

      {/* Bottom fade-out so content stays legible */}
      <LinearGradient
        colors={['transparent', '#07040F80', '#07040F']}
        locations={[0, 0.55, 1]}
        style={[StyleSheet.absoluteFill, { top: SH * 0.3 }]}
        pointerEvents="none"
      />
    </View>
  );
};

// ── Simple digit reducer (no master numbers) ────────────────
const reduceSimple = (n: number): number => {
  while (n > 9) {
    n = String(n).split('').reduce((s, d) => s + parseInt(d, 10), 0);
  }
  return n;
};

// ── Reduce keeping master numbers 11, 22, 33 ────────────────
const reduceMaster = (n: number): number => {
  if (n === 11 || n === 22 || n === 33) return n;
  if (n <= 9) return n;
  const next = String(n).split('').reduce((s, d) => s + parseInt(d, 10), 0);
  return reduceMaster(next);
};

// ── Pythagorean letter map ───────────────────────────────────
const LETTER_VALUES: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
  J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8,
};
const VOWELS = new Set(['A','E','I','O','U','Y']);

const letterVal = (ch: string): number => LETTER_VALUES[ch.toUpperCase()] || 0;
const sumName = (name: string): number =>
  name.toUpperCase().replace(/[^A-Z]/g, '').split('').reduce((s, c) => s + letterVal(c), 0);
const sumVowels = (name: string): number =>
  name.toUpperCase().replace(/[^A-Z]/g, '').split('').filter(c => VOWELS.has(c)).reduce((s, c) => s + letterVal(c), 0);
const sumConsonants = (name: string): number =>
  name.toUpperCase().replace(/[^A-Z]/g, '').split('').filter(c => !VOWELS.has(c)).reduce((s, c) => s + letterVal(c), 0);

// ── Core calculations ────────────────────────────────────────
const calcLifePath = (birthDate: string): number => {
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return 0;
  const day = d.getDate(), month = d.getMonth() + 1, year = d.getFullYear();
  const sum = String(day) + String(month) + String(year);
  const raw = sum.split('').reduce((s, c) => s + parseInt(c, 10), 0);
  return reduceMaster(raw);
};

const calcExpressionNumber = (fullName: string): number => {
  const raw = sumName(fullName);
  return raw ? reduceMaster(raw) : 0;
};

const calcSoulUrge = (fullName: string): number => {
  const raw = sumVowels(fullName);
  return raw ? reduceMaster(raw) : 0;
};

const calcPersonality = (fullName: string): number => {
  const raw = sumConsonants(fullName);
  return raw ? reduceMaster(raw) : 0;
};

const calcPersonalYear = (birthDate: string, year?: number): number => {
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return 0;
  const currentYear = year || new Date().getFullYear();
  const raw = d.getDate() + (d.getMonth() + 1) + currentYear;
  return reduceMaster(raw);
};

const calcPersonalMonth = (birthDate: string): number => {
  const py = calcPersonalYear(birthDate);
  const month = new Date().getMonth() + 1;
  return reduceMaster(py + month);
};

const calcPersonalDay = (birthDate: string): number => {
  const pm = calcPersonalMonth(birthDate);
  const day = new Date().getDate();
  return reduceMaster(pm + day);
};

const calcUniversalDay = (): number => {
  const now = new Date();
  const raw = now.getFullYear() + (now.getMonth() + 1) + now.getDate();
  return reduceMaster(raw);
};

// ── Maturity Number = (Life Path + Expression) reduced ──────
const calcMaturityNumber = (birthDate: string, fullName: string): number => {
  const lp = calcLifePath(birthDate);
  const expr = calcExpressionNumber(fullName);
  if (!lp || !expr) return 0;
  return reduceMaster(lp + expr);
};

// ── Balance Number = sum of initials ────────────────────────
const calcBalanceNumber = (fullName: string): number => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 0;
  const raw = parts.reduce((s, part) => {
    const first = part[0]?.toUpperCase();
    return s + (LETTER_VALUES[first] || 0);
  }, 0);
  return reduceMaster(raw);
};

// ── Hidden Passion Number = most repeated digit sum ─────────
const calcHiddenPassion = (fullName: string): number => {
  const letters = fullName.toUpperCase().replace(/[^A-Z]/g, '').split('');
  const counts: Record<number, number> = {};
  letters.forEach(l => {
    const v = LETTER_VALUES[l] || 0;
    if (v) counts[v] = (counts[v] || 0) + 1;
  });
  let max = 0, passion = 0;
  Object.entries(counts).forEach(([k, v]) => { if (v > max) { max = v; passion = parseInt(k); } });
  return passion;
};

// ── Karmic Debt check ────────────────────────────────────────
const KARMIC_DEBT_NUMBERS = new Set([13, 14, 16, 19]);
const hasKarmicDebt = (rawSum: number): boolean => KARMIC_DEBT_NUMBERS.has(rawSum);
const getKarmicDebtMeaning = (n: number): string => {
  const meanings: Record<number, string> = {
    13: 'Dług karmiczny 13 — lekcja dyscypliny, ciężkiej pracy i skupienia energii.',
    14: 'Dług karmiczny 14 — lekcja wolności z odpowiedzialnością i umiarem.',
    16: 'Dług karmiczny 16 — lekcja ego, upadku i odbudowy z pokory.',
    19: 'Dług karmiczny 19 — lekcja niezależności bez izolowania się od innych.',
  };
  return meanings[n] || '';
};

// ── Pinnacle cycles ─────────────────────────────────────────
const calcPinnacles = (birthDate: string): Array<{ number: number; from: number; to: number | null; label: string }> => {
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return [];
  const day = reduceMaster(d.getDate());
  const month = reduceMaster(d.getMonth() + 1);
  const year = reduceMaster(d.getFullYear());
  const lp = calcLifePath(birthDate);
  const end1 = 36 - lp;
  const end2 = end1 + 9;
  const end3 = end2 + 9;
  return [
    { number: reduceMaster(month + day), from: 0, to: end1, label: '1. Pinnakl' },
    { number: reduceMaster(day + year), from: end1 + 1, to: end2, label: '2. Pinnakl' },
    { number: reduceMaster(month + day + year), from: end2 + 1, to: end3, label: '3. Pinnakl' },
    { number: reduceMaster(month + year), from: end3 + 1, to: null, label: '4. Pinnakl' },
  ];
};

// ── Challenge numbers ────────────────────────────────────────
const calcChallenges = (birthDate: string): { c1: number; c2: number; c3: number; c4: number } => {
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return { c1: 0, c2: 0, c3: 0, c4: 0 };
  const day = reduceSimple(d.getDate());
  const month = reduceSimple(d.getMonth() + 1);
  const year = reduceSimple(d.getFullYear());
  const c1 = Math.abs(month - day);
  const c2 = Math.abs(day - year);
  const c3 = Math.abs(c1 - c2);
  const c4 = Math.abs(month - year);
  return { c1, c2, c3, c4 };
};

// ── Bridge numbers ───────────────────────────────────────────
const calcBridges = (birthDate: string, fullName: string): { lpExpr: number; lpSoul: number; exprSoul: number } => {
  const lp = calcLifePath(birthDate);
  const expr = calcExpressionNumber(fullName);
  const soul = calcSoulUrge(fullName);
  return {
    lpExpr: Math.abs(lp - (expr || lp)),
    lpSoul: Math.abs(lp - (soul || lp)),
    exprSoul: Math.abs((expr || 0) - (soul || 0)),
  };
};

// ── Soul compatibility ───────────────────────────────────────
const calcSoulCompatibility = (n1: number, n2: number): { score: number; label: string; color: string } => {
  if (!n1 || !n2) return { score: 0, label: '-', color: '#888' };
  const diff = Math.abs(n1 - n2);
  const pairs: Record<string, number> = {
    '1_5': 92, '5_1': 92, '2_6': 90, '6_2': 90, '3_9': 87, '9_3': 87,
    '1_4': 74, '4_1': 74, '7_11': 95, '11_7': 95, '5_3': 82, '3_5': 82,
    '2_8': 68, '8_2': 68, '1_2': 70, '2_1': 70, '4_8': 86, '8_4': 86,
    '6_9': 84, '9_6': 84, '1_9': 78, '9_1': 78, '3_6': 80, '6_3': 80,
    '1_1': 72, '2_2': 80, '3_3': 85, '4_4': 75, '5_5': 60, '6_6': 88,
    '7_7': 92, '8_8': 65, '9_9': 90, '11_22': 97, '22_11': 97,
  };
  const key = `${n1}_${n2}`;
  const score = pairs[key] ?? Math.max(40, 85 - diff * 5);
  const label = score >= 90 ? 'Doskonała' : score >= 80 ? 'Silna' : score >= 65 ? 'Harmoniczna' : 'Wyzwanie';
  const color = score >= 90 ? '#34D399' : score >= 80 ? '#60A5FA' : score >= 65 ? '#FBBF24' : '#F87171';
  return { score, label, color };
};

// ── DATA ──────────────────────────────────────────────────────
const NUMBER_META: Record<number, {
  archetype: string; planet: string; element: string;
  color: string; colorName: string; keywords: string[];
  crystal: string; crystalDesc: string; shadow: string;
  meaning: string;
}> = {
  1: {
    archetype: 'Pionier', planet: 'Słońce', element: 'Ogień',
    color: '#FF6B6B', colorName: 'Czerwień', keywords: ['inicjatywa', 'niezależność', 'odwaga', 'przywództwo'],
    crystal: 'Rubin', crystalDesc: 'Wzmacnia wolę i odwagę. Aktywuje energię inicjatywy.',
    shadow: 'Egocentryzm, niecierpliwość wobec innych.',
    meaning: 'Jesteś tu, by prowadzić. Jedynka to energia początku — otwierasz drogi, których inni się boją. Twoja misja to rozwinąć autentyczną niezależność i pokazać światu, że samodzielność jest darem, nie słabością.',
  },
  2: {
    archetype: 'Mediator', planet: 'Księżyc', element: 'Woda',
    color: '#4ECDC4', colorName: 'Turkus', keywords: ['intuicja', 'współpraca', 'harmonia', 'wrażliwość'],
    crystal: 'Kamień Księżycowy', crystalDesc: 'Pogłębia intuicję i zdolność słuchania.',
    shadow: 'Uległość, strach przed konfliktem.',
    meaning: 'Jesteś mostem między światami. Dwójka niesie dar głębokiego słuchania i tworzenia harmonii tam, gdzie inni widzą tylko sprzeczności. Twoja wrażliwość to Twoja największa moc — nie słabość.',
  },
  3: {
    archetype: 'Twórca', planet: 'Jowisz', element: 'Powietrze',
    color: '#FFD93D', colorName: 'Złoty', keywords: ['ekspresja', 'radość', 'twórczość', 'komunikacja'],
    crystal: 'Cytryn', crystalDesc: 'Rozbudza ekspresję i radość tworzenia.',
    shadow: 'Powierzchowność, rozproszenie.',
    meaning: 'Jesteś tu, by zachwycać. Trójka to energia twórczej ekspresji — Twoje słowa, obrazy i pomysły mają moc otwierania serc. Radość jest Twoim kompasem, a sztuka — Twoim językiem duszy.',
  },
  4: {
    archetype: 'Budowniczy', planet: 'Saturn', element: 'Ziemia',
    color: '#95E1D3', colorName: 'Zieleń', keywords: ['stabilność', 'dyscyplina', 'fundament', 'porządek'],
    crystal: 'Zielony Jaspis', crystalDesc: 'Uziemia i stabilizuje. Zieleń daje cierpliwość.',
    shadow: 'Sztywność, opór przed zmianą.',
    meaning: 'Jesteś architektem rzeczywistości. Czwórka to energia trwałości — budujesz struktury, które przetrwają próbę czasu. Twoja cierpliwość i konsekwencja są darem, który świat widzi dopiero po latach.',
  },
  5: {
    archetype: 'Wędrowiec', planet: 'Merkury', element: 'Eter',
    color: '#F38181', colorName: 'Koral', keywords: ['wolność', 'zmiana', 'przygoda', 'elastyczność'],
    crystal: 'Akwamaryn', crystalDesc: 'Wspiera adaptację i komunikację.',
    shadow: 'Niestałość, unikanie odpowiedzialności.',
    meaning: 'Jesteś tu, by odkrywać. Piątka niesie dar wiecznej ciekawości i odwagi przed zmianą. Wolność jest Twoim powietrzem, a różnorodność doświadczeń — nauczycielką Twojej duszy.',
  },
  6: {
    archetype: 'Opiekun', planet: 'Wenus', element: 'Ziemia',
    color: '#AA96DA', colorName: 'Lawenda', keywords: ['miłość', 'odpowiedzialność', 'harmonia', 'troska'],
    crystal: 'Różowy Kwarc', crystalDesc: 'Otwiera serce na bezwarunkową miłość.',
    shadow: 'Perfekcjonizm, poświęcenie siebie.',
    meaning: 'Jesteś tu, by troszczyć się. Szóstka to energia bezwarunkowej miłości i piękna — tworzysz przestrzenie, w których inni mogą rozkwitnąć. Pamiętaj, że miłość do siebie jest fundamentem wszystkiego.',
  },
  7: {
    archetype: 'Mędrzec', planet: 'Neptun', element: 'Woda',
    color: '#9370DB', colorName: 'Fiolet', keywords: ['mądrość', 'duchowość', 'analiza', 'introspekcja'],
    crystal: 'Ametyst', crystalDesc: 'Pogłębia medytację i wgląd. Łączy umysł z duchem.',
    shadow: 'Izolacja, nadmierna analiza.',
    meaning: 'Jesteś tu, by rozumieć to, czego nie widać. Siódemka niesie dar głębokiego wglądu i duchowego poznania. Twoja droga prowadzi do wnętrza — tam czeka mądrość, której szukasz.',
  },
  8: {
    archetype: 'Władca', planet: 'Saturn', element: 'Ziemia',
    color: '#FBBF24', colorName: 'Złoto', keywords: ['sprawczość', 'obfitość', 'ambicja', 'władza'],
    crystal: 'Obsydian', crystalDesc: 'Chroni i wzmacnia siłę woli w materializacji.',
    shadow: 'Materializm, chciwość władzy.',
    meaning: 'Jesteś tu, by manifestować. Ósemka to energia nieskończoności i mocy — potrafisz transformować marzenia w rzeczywistość. Twoja relacja z władzą i zasobami jest nauczycielem karmy.',
  },
  9: {
    archetype: 'Humanista', planet: 'Mars', element: 'Ogień',
    color: '#A8E6CF', colorName: 'Miętowy', keywords: ['misja', 'altruizm', 'mądrość', 'zamknięcie'],
    crystal: 'Lapis Lazuli', crystalDesc: 'Wspiera misję duszy i mądrość wyższą.',
    shadow: 'Samozaparcie, trudność w stawianiu granic.',
    meaning: 'Jesteś tu, by służyć i zamykać cykle. Dziewiątka niesie mądrość wszystkich poprzednich liczb. Twoja misja jest uniwersalna — działasz nie tylko dla siebie, ale dla dobra wielu.',
  },
  11: {
    archetype: 'Jasnowidz', planet: 'Uran', element: 'Powietrze',
    color: '#E879F9', colorName: 'Magenta', keywords: ['intuicja', 'iluminacja', 'wrażliwość', 'inspiracja'],
    crystal: 'Selenite', crystalDesc: 'Czyści aurę i wzmacnia jasnowidztwo.',
    shadow: 'Przeciążenie emocjonalne, nerwy.',
    meaning: 'Jesteś kanałem wyższych wibracji. Jedenastka to liczba mistrza — niesiesz dar iluminacji i intuicji, która przekracza logikę. Twoja wrażliwość jest portalem do wyższych wymiarów świadomości.',
  },
  22: {
    archetype: 'Wielki Budowniczy', planet: 'Pluton', element: 'Ziemia',
    color: '#E0E8FF', colorName: 'Perłowy', keywords: ['wizja', 'realizacja', 'moc', 'misja globalna'],
    crystal: 'Diament', crystalDesc: 'Symbol nieograniczonej mocy twórczej.',
    shadow: 'Przeciążenie ciężarem misji.',
    meaning: 'Jesteś architektem epoki. Dwudziestadwójka to najpotężniejsza liczba — łączysz wizję z realizacją w skali, która zmienia świat. Twoja misja jest globalna i historyczna.',
  },
  33: {
    archetype: 'Mistrz Miłości', planet: 'Wenus', element: 'Ogień',
    color: '#FCA5A5', colorName: 'Róż', keywords: ['uzdrowienie', 'poświęcenie', 'nauczyciel', 'miłość'],
    crystal: 'Różowy Turmalin', crystalDesc: 'Otwiera wszystkie wymiary serca.',
    shadow: 'Martyrologia, nieumiejętność odpoczywania.',
    meaning: 'Jesteś uzdrowicielem i nauczycielem. Trzydziestka trójka to liczba Chrystusowa — niesiesz dar bezwarunkowej miłości i uzdrowienia. Twoja obecność sama w sobie leczy innych.',
  },
};

const getMeta = (n: number) => NUMBER_META[n] || NUMBER_META[((n - 1) % 9) + 1];

const PERSONAL_CYCLE_NAMES: Record<number, { name: string; month: string; day: string; icon: string }> = {
  1: { name: 'Nowy Początek', icon: '🌱',
    month: 'Czas sadzenia nasion nowych projektów. Otwierasz nowy 9-letni cykl — działaj z odwagą.',
    day: 'Dzień działania z odwagą. Zrób jeden krok, który dotychczas blokował strach.' },
  2: { name: 'Współpraca', icon: '🤝',
    month: 'Czas delikatności i słuchania. Partnerstwa nie forsuj — pozwól im dojrzeć własnym tempem.',
    day: 'Dzień dyplomacji. Zamiast przekonywać, pytaj i słuchaj głębiej niż zwykle.' },
  3: { name: 'Ekspresja', icon: '🎨',
    month: 'Energia twórcza jest na szczycie. Twórz, świętuj, wyrażaj siebie — to czas radości.',
    day: 'Dzień kreatywności. Powiedz to, co chcesz powiedzieć — bez cenzury wewnętrznej.' },
  4: { name: 'Fundament', icon: '🏗️',
    month: 'Czas porządkowania i kładzenia fundamentów pod marzenia. Nie oczekuj natychmiastowych efektów.',
    day: 'Dzień struktury. Zrób listę, posprzątaj przestrzeń, zadbaj o detale.' },
  5: { name: 'Zmiana i Wolność', icon: '🌊',
    month: 'Nieoczekiwane zmiany przynoszą wyzwolenie. Bądź elastyczna i otwarta na nowe kierunki.',
    day: 'Dzień przygody. Zrób coś, czego nie planowałaś — impulsy są teraz mądrą drogowskazem.' },
  6: { name: 'Odpowiedzialność', icon: '💛',
    month: 'Czas troski o dom, rodzinę i bliskie relacje. Twoja opieka jest teraz szczególnie potrzebna.',
    day: 'Dzień miłości. Zadzwoń do kogoś ważnego lub zrób coś pięknego dla bliskiej osoby.' },
  7: { name: 'Refleksja', icon: '🔮',
    month: 'Czas wyciszenia, badań duchowych i głębokiej introspekcji. Unikaj pośpiechu w decyzjach.',
    day: 'Dzień medytacji. Poświęć co najmniej 15 minut ciszy, by usłyszeć własny głos.' },
  8: { name: 'Siła i Obfitość', icon: '⚡',
    month: 'Energia materializacji jest silna — działaj pewnie i bierz odpowiedzialność za wyniki.',
    day: 'Dzień mocy. Podejmij decyzję finansową lub zawodową, którą odkładasz.' },
  9: { name: 'Zamknięcie', icon: '🌕',
    month: 'Czas kończenia cykli, wybaczenia i puszczania tego, co już swoje zrobiło. Wielkie oczyszczenie.',
    day: 'Dzień uwalniania. Napisz coś, co chcesz puścić, a potem zniszcz kartkę.' },
  11: { name: 'Iluminacja', icon: '✨',
    month: 'Twoja intuicja działa z nadzwyczajną mocą. Czas mistycznych wglądów i głębokich przebudzeń.',
    day: 'Dzień intuicji. Twoja wrażliwość to dar — ufaj przeczuciom ponad logiką.' },
  22: { name: 'Mistrzostwo', icon: '🌟',
    month: 'Czas wielkich dokonań. To, co budujesz teraz, ma trwały wpływ na przyszłość.',
    day: 'Dzień mistrza budowniczego. Twoje działania mają dziś ponadprzeciętny zasięg.' },
  33: { name: 'Miłość Bezwarunkowa', icon: '💫',
    month: 'Czas uzdrowienia i służby. Twoja obecność leczy innych — pamiętaj o sobie.',
    day: 'Dzień współczucia. Gest miłości wobec siebie i innych niesie dziś wyjątkową moc.' },
};

const getCycleInfo = (n: number) => PERSONAL_CYCLE_NAMES[n] || PERSONAL_CYCLE_NAMES[((n - 1) % 9) + 1];

const CHALLENGE_MEANINGS: Record<number, string> = {
  0: 'Wyzwanie Mistrza — stajesz twarzą w twarz ze wszystkimi lekcjami naraz. Wymaga dużej dojrzałości.',
  1: 'Nauka samodzielności i asertywności. Przezwyciężasz zależność od opinii innych.',
  2: 'Nauka stawiania granic i poczucia własnej wartości. Przestajesz dostosowywać się za wszelką cenę.',
  3: 'Nauka wyrażania siebie bez autocenzury. Twój głos i twórcza siła chcą wyjść na światło.',
  4: 'Nauka porządku, dyscypliny i planowania. Solidny fundament staje się Twoją bazą.',
  5: 'Nauka wolności BEZ chaosu — zmiany bez porzucania odpowiedzialności.',
  6: 'Nauka przyjmowania miłości i odpuszczania perfekcjonizmu w relacjach.',
  7: 'Nauka zaufania do życia mimo braku pewności. Wiara contra kontrola.',
  8: 'Nauka zdrowego stosunku do pieniędzy i władzy — ani zbyt kurczowego, ani zbyt luźnego.',
};

const PINNACLE_QUALITIES: Record<number, string> = {
  1: 'Czas budowania indywidualności, odwagi i niezależnych decyzji.',
  2: 'Czas relacji, partnerstwa i subtelnej intuicji. Wygrywa cierpliwość.',
  3: 'Czas rozkwitu ekspresji, radości i twórczych osiągnięć.',
  4: 'Czas budowania trwałych fundamentów — praca, rodzina, bezpieczeństwo.',
  5: 'Czas wolności, podróży i licznych zmian kierunku.',
  6: 'Czas służby, miłości i odpowiedzialności za otoczenie.',
  7: 'Czas duchowego pogłębienia, nauki i analizy sensu.',
  8: 'Czas materializacji, kariery i obfitości. Wysiłek przynosi efekty.',
  9: 'Czas humanitarnych działań, finalizowania i zamykania etapów.',
  11: 'Czas mistycznej wrażliwości i iluminacyjnych przeżyć.',
  22: 'Czas wielkich projektów, które zmieniają życie wielu ludzi.',
  33: 'Czas najgłębszego uzdrowienia — siebie i tych wokół.',
};

const BALANCE_MEANINGS: Record<number, string> = {
  1: 'W chwilach kryzysu polegaj na swojej sile i niezależności. Działaj, nie czekaj.',
  2: 'W trudnych momentach szukaj harmonii i kompromisu. Słuchaj zanim zaczniesz mówić.',
  3: 'Wyrażaj emocje przez twórczość. Humor i optymizm są Twoim lekarstwem.',
  4: 'Szukaj praktycznych rozwiązań. Spokój, porządek i rutyna przywracają równowagę.',
  5: 'Daj sobie przestrzeń i zmianę perspektywy. Ruch fizyczny uwalnia napięcie.',
  6: 'Zadbaj o bliskich i siebie. Miłość i piękno otoczenia restorative Twoją energię.',
  7: 'Wyjdź w ciszę i medytację. Wewnętrzna analiza przyniesie odpowiedzi.',
  8: 'Przejmij kontrolę i podejmij decyzję. Sprawczość uwalnia Cię z bezsilności.',
  9: 'Patrz szerzej — poza własną perspektywę. Współczucie dla siebie i innych leczy.',
  11: 'Zaufaj intuicji. W kryzysie Twoja wrażliwość jest lampą w ciemności.',
  22: 'Skup się na wielkim obrazie. Twoje działania mają wymiar ponadosobisty.',
  33: 'Ulecz siebie — dopiero wtedy możesz leczyć innych. Miłość do siebie jest pierwsza.',
};

const MATURITY_MEANINGS: Record<number, string> = {
  1: 'Z wiekiem stajesz się coraz bardziej niezależnym liderem — prowadzisz własną ścieżkę z pewnością siebie.',
  2: 'Dojrzałość przynosi głębsze partnerstwa i mistrzowskie umiejętności słuchania.',
  3: 'Twoja twórczość rozkwita z każdym rokiem — życie daje Ci coraz więcej do wyrażenia.',
  4: 'Budujesz trwałe dziedzictwo. Dojrzałość to czas zbierania owoców solidnej pracy.',
  5: 'Z wiekiem odkrywasz prawdziwą wolność — nie ucieczkę, lecz świadome wybory.',
  6: 'Dojrzałość to czas harmoninych relacji i pięknie urządzonego życia z sercem.',
  7: 'Stajesz się mędrciem — Twoja wiedza duchowa i filozoficzna staje się darem dla innych.',
  8: 'Obfitość i sprawczość rozkwitają w dojrzałości. Twoje zasoby służą większemu celowi.',
  9: 'Dojrzałość odkrywa misję humanistyczną — działasz dla dobra wielu, nie tylko siebie.',
  11: 'Z wiekiem kanalizujesz iluminację z wyjątkową precyzją — stajesz się nauczycielem jasnowidzenia.',
  22: 'Twoja dojrzałość przejawia się w monumentalnych dokonaniach — budujesz dla pokoleń.',
  33: 'Stajesz się Mistrzem Miłości — uzdrawiasz przez samą swoją obecność i mądrość.',
};

// ── Glow circle component ────────────────────────────────────
const NumberGlowBadge = ({ value, size = 72, isLight, pulse = false }: { value: number; size?: number; isLight: boolean; pulse?: boolean }) => {
  const { t } = useTranslation();

  const meta = getMeta(value);
  const isMaster = value === 11 || value === 22 || value === 33;
  const glowAnim = useSharedValue(0.6);

  useEffect(() => {
    if (pulse || isMaster) {
      glowAnim.value = withRepeat(
        withSequence(withTiming(1, { duration: 1400 }), withTiming(0.6, { duration: 1400 })),
        -1, false
      );
    }
  }, [pulse, isMaster]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
    transform: [{ scale: 0.9 + glowAnim.value * 0.15 }],
  }));

  const goldColor = '#F5C842';
  const circleColor = isMaster ? goldColor : meta.color;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer glow ring */}
      <Animated.View style={[{
        position: 'absolute',
        width: size + 16,
        height: size + 16,
        borderRadius: (size + 16) / 2,
        backgroundColor: circleColor + (isMaster ? '30' : '18'),
        borderWidth: isMaster ? 2 : 1,
        borderColor: circleColor + (isMaster ? '80' : '44'),
      }, glowStyle]} />
      {/* Inner circle */}
      <LinearGradient
        colors={isMaster
          ? ['#F5C842', '#D4A017', '#F5C842']
          : [circleColor + 'DD', circleColor + '88']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: circleColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.6,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <Text style={{
          fontSize: size * 0.38,
          fontWeight: '900',
          color: isMaster ? '#1A0F00' : '#FFF',
          fontFamily: 'serif',
          letterSpacing: -1,
        }}>
          {value}
        </Text>
        {isMaster && (
          <Text style={{ fontSize: 7, color: '#1A0F00', fontWeight: '800', letterSpacing: 2, marginTop: -2 }}>
            {t('numerology.mistrz', 'MISTRZ')}
          </Text>
        )}
      </LinearGradient>
    </View>
  );
};

// ── Premium Number Card ─────────────────────────────────────
const NumberCard = ({ label, value, meta, eyebrow, isLight, sublabel }: {
  label: string; value: number; meta: typeof NUMBER_META[1]; eyebrow: string; isLight: boolean; sublabel?: string;
}) => {
  const { t } = useTranslation();

  const [expanded, setExpanded] = useState(false);
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.07)';
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.60)';
  const isMaster = value === 11 || value === 22 || value === 33;
  const goldColor = '#F5C842';
  const accentColor = isMaster ? goldColor : meta.color;

  return (
    <Pressable onPress={() => { setExpanded(e => !e); HapticsService.selection(); }} style={{ marginBottom: 12 }}>
      <View style={{
        borderRadius: 20, padding: 18, overflow: 'hidden',
        backgroundColor: cardBg,
        borderWidth: isMaster ? 1.5 : 1,
        borderColor: isMaster ? goldColor + '66' : meta.color + '44',
        borderTopWidth: isMaster ? 3 : 2,
        borderTopColor: accentColor,
      }}>
        <LinearGradient
          colors={isMaster ? [goldColor + '28', goldColor + '08', 'transparent'] : [meta.color + '18', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Master badge */}
        {isMaster && (
          <View style={{ position: 'absolute', top: 12, right: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: goldColor + '33', borderWidth: 1, borderColor: goldColor + '88' }}>
            <Text style={{ fontSize: 8, fontWeight: '800', color: goldColor, letterSpacing: 1.5 }}>{t('numerology.liczba_mistrza', '✦ LICZBA MISTRZA')}</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <NumberGlowBadge value={value} size={60} isLight={isLight} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: accentColor, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 3 }}>{eyebrow}</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: textColor, letterSpacing: 0.2 }}>{label}</Text>
            <Text style={{ fontSize: 12, color: accentColor, marginTop: 3, fontWeight: '600' }}>{meta.archetype} · {meta.planet}</Text>
            {sublabel && (
              <Text style={{ fontSize: 10, color: subColor, marginTop: 2 }}>{sublabel}</Text>
            )}
          </View>
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: accentColor + '20', alignItems: 'center', justifyContent: 'center' }}>
            {expanded ? <ChevronUp color={accentColor} size={14} /> : <ChevronDown color={accentColor} size={14} />}
          </View>
        </View>

        {/* Keywords row */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {meta.keywords.map(kw => (
            <View key={kw} style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, backgroundColor: accentColor + '22', borderWidth: 1, borderColor: accentColor + '44' }}>
              <Text style={{ fontSize: 10, color: accentColor, fontWeight: '600' }}>{kw}</Text>
            </View>
          ))}
          <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, backgroundColor: accentColor + '22', borderWidth: 1, borderColor: accentColor + '44' }}>
            <Text style={{ fontSize: 10, color: accentColor, fontWeight: '600' }}>{meta.element}</Text>
          </View>
        </View>

        {/* Expanded detail */}
        {expanded && (
          <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 16 }}>
            <View style={{ height: 1, backgroundColor: accentColor + '33', marginBottom: 14 }} />

            {/* Full meaning */}
            <Text style={{ fontSize: 13, color: textColor, lineHeight: 21, marginBottom: 14, fontStyle: 'italic' }}>
              "{meta.meaning}"
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: accentColor + '15' }}>
                <Text style={{ fontSize: 9, color: accentColor, fontWeight: '700', letterSpacing: 1.4, marginBottom: 5 }}>{t('numerology.kamien', 'KAMIEŃ')}</Text>
                <Text style={{ fontSize: 13, color: textColor, fontWeight: '700' }}>{meta.crystal}</Text>
                <Text style={{ fontSize: 11, color: subColor, marginTop: 4, lineHeight: 16 }}>{meta.crystalDesc}</Text>
              </View>
              <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: accentColor + '15' }}>
                <Text style={{ fontSize: 9, color: accentColor, fontWeight: '700', letterSpacing: 1.4, marginBottom: 5 }}>{t('numerology.cien', 'CIEŃ')}</Text>
                <Text style={{ fontSize: 11, color: subColor, lineHeight: 16 }}>{meta.shadow}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: subColor, lineHeight: 19 }}>
              {getEnergyMeaning(value)}
            </Text>
          </Animated.View>
        )}
      </View>
    </Pressable>
  );
};

// ── Compact number row card ───────────────────────────────────
const CompactNumberCard = ({ label, value, color, desc, isLight }: {
  label: string; value: number; color: string; desc: string; isLight: boolean;
}) => {
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';
  const isMaster = value === 11 || value === 22 || value === 33;
  const goldColor = '#F5C842';
  const accentColor = isMaster ? goldColor : color;
  return (
    <View style={{ flex: 1, borderRadius: 16, padding: 14, overflow: 'hidden',
      backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)',
      borderWidth: 1, borderColor: accentColor + '44',
      borderTopWidth: 2.5, borderTopColor: accentColor }}>
      <LinearGradient colors={[accentColor + '1A', 'transparent']} style={StyleSheet.absoluteFillObject} />
      <Text style={{ fontSize: 8, color: accentColor, fontWeight: '700', letterSpacing: 1.6, marginBottom: 6 }}>{label.toUpperCase()}</Text>
      <NumberGlowBadge value={value} size={48} isLight={isLight} />
      <Text style={{ fontSize: 11, color: textColor, fontWeight: '700', marginTop: 8 }}>{getMeta(value).archetype}</Text>
      <Text style={{ fontSize: 10, color: subColor, marginTop: 3, lineHeight: 14 }} numberOfLines={2}>{desc}</Text>
    </View>
  );
};

// ── 3D Pythagorean Number Grid ─────────────────────────────────────
const NumberMatrix3D = ({ lifePathNumber, accent }: { lifePathNumber: number; accent: string }) => {
  const tiltX = useSharedValue(-10);
  const tiltY = useSharedValue(0);
  const rot = useSharedValue(0);

  useEffect(() => {
    rot.value = withRepeat(
      withSequence(withTiming(20, { duration: 10000 }), withTiming(-20, { duration: 10000 })),
      -1, false
    );
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tiltY.value = Math.max(-35, Math.min(35, e.translationX * 0.2));
      tiltX.value = Math.max(-30, Math.min(10, -10 + e.translationY * 0.15));
    })
    .onEnd(() => {
      tiltY.value = withTiming(0, { duration: 900 });
      tiltX.value = withTiming(-10, { duration: 900 });
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value + rot.value}deg` },
    ],
  }));

  const NUMBERS = [1,2,3,4,5,6,7,8,9];
  const MEANINGS: Record<number, string> = {
    1:'Przywódca', 2:'Mediator', 3:'Twórca', 4:'Budowniczy',
    5:'Wolność', 6:'Opiekun', 7:'Mędrzec', 8:'Władza', 9:'Humanista',
  };
  const cellSize = 62;
  const gap = 6;
  const gridW = cellSize * 3 + gap * 2;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ alignSelf: 'center', marginVertical: 16, width: gridW, height: gridW }, animStyle]}>
        {NUMBERS.map((n, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const isActive = n === (lifePathNumber > 9 ? reduceSimple(lifePathNumber) : lifePathNumber);
          const meta = getMeta(n);
          const color = meta.color;
          return (
            <View key={n} style={{
              position: 'absolute',
              left: col * (cellSize + gap),
              top: row * (cellSize + gap),
              width: cellSize, height: cellSize,
              borderRadius: 18,
              backgroundColor: isActive ? color + 'DD' : color + '22',
              borderWidth: isActive ? 2 : 1,
              borderColor: isActive ? color : color + '55',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: color,
              shadowOffset: { width: 0, height: isActive ? 8 : 4 },
              shadowOpacity: isActive ? 0.6 : 0.2,
              shadowRadius: isActive ? 12 : 6, elevation: isActive ? 10 : 4,
            }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: isActive ? '#FFF' : color, fontFamily: 'serif' }}>{n}</Text>
              <Text style={{ fontSize: 8, color: isActive ? '#FFFFFFcc' : color + 'AA', marginTop: 2, textAlign: 'center', paddingHorizontal: 4 }} numberOfLines={1}>{MEANINGS[n]}</Text>
            </View>
          );
        })}
      </Animated.View>
    </GestureDetector>
  );
};

// ── Letter Analysis Row ─────────────────────────────────────
const LetterRow = ({ name, isLight }: { name: string; isLight: boolean }) => {
  const letters = name.toUpperCase().replace(/[^A-Z ]/g, '').split('');
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.5)';
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
      {letters.map((ch, i) => {
        if (ch === ' ') return <View key={i} style={{ width: 10 }} />;
        const val = LETTER_VALUES[ch] || 0;
        const meta = getMeta(val);
        const isVowel = VOWELS.has(ch);
        return (
          <View key={i} style={{
            width: 38, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
            backgroundColor: meta.color + (isVowel ? '44' : '22'),
            borderWidth: 1, borderColor: meta.color + (isVowel ? 'AA' : '55'),
          }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: meta.color }}>{ch}</Text>
            <Text style={{ fontSize: 9, fontWeight: '700', color: meta.color + 'CC', marginTop: 1 }}>{val}</Text>
            <Text style={{ fontSize: 7, color: subColor, marginTop: 1 }}>{isVowel ? 'V' : 'C'}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

// ── Pinnacle Timeline ─────────────────────────────────────────
const PinnacleTimeline = ({ pinnacles, birthDate, accent, isLight }: {
  pinnacles: ReturnType<typeof calcPinnacles>; birthDate: string; accent: string; isLight: boolean;
}) => {
  const { t } = useTranslation();

  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.60)';
  const birthYear = new Date(birthDate).getFullYear();
  const currentAge = new Date().getFullYear() - birthYear;

  return (
    <View>
      {pinnacles.map((p, i) => {
        const meta = getMeta(p.number);
        const ageFrom = p.from;
        const ageTo = p.to;
        const isActive = currentAge >= ageFrom && (ageTo === null || currentAge <= ageTo);
        const yearFrom = birthYear + ageFrom;
        const yearTo = ageTo !== null ? birthYear + ageTo : null;
        const rangeLabel = ageTo !== null ? `${yearFrom}–${yearTo} (wiek ${ageFrom}–${ageTo})` : `${yearFrom}+ (wiek ${ageFrom}+)`;
        const isMaster = p.number === 11 || p.number === 22 || p.number === 33;
        const accentColor = isMaster ? '#F5C842' : meta.color;
        return (
          <View key={i} style={{ flexDirection: 'row', marginBottom: i < pinnacles.length - 1 ? 14 : 0 }}>
            <View style={{ alignItems: 'center', width: 28, marginRight: 14 }}>
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: isActive ? accentColor : accentColor + '33',
                borderWidth: isActive ? 2 : 1, borderColor: accentColor,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: isActive ? (isMaster ? '#1A0F00' : '#FFF') : accentColor }}>{p.number}</Text>
              </View>
              {i < pinnacles.length - 1 && (
                <View style={{ width: 2, flex: 1, marginTop: 4, backgroundColor: accentColor + '30' }} />
              )}
            </View>
            <View style={{
              flex: 1, padding: 14, borderRadius: 14,
              backgroundColor: isActive ? accentColor + '18' : isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)',
              borderWidth: isActive ? 1.5 : StyleSheet.hairlineWidth,
              borderColor: isActive ? accentColor + '66' : accentColor + '33',
              marginBottom: 4,
            }}>
              <LinearGradient colors={isActive ? [accentColor + '1A', 'transparent'] : ['transparent', 'transparent']} style={StyleSheet.absoluteFillObject} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: accentColor, letterSpacing: 0.8 }}>
                  {p.label} — {meta.archetype}
                  {isMaster ? ' ✦' : ''}
                </Text>
                {isActive && (
                  <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: accentColor }}>
                    <Text style={{ fontSize: 8, fontWeight: '800', color: isMaster ? '#1A0F00' : '#FFF' }}>{t('numerology.teraz', 'TERAZ')}</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 10, color: subColor, marginBottom: 7 }}>{rangeLabel}</Text>
              <Text style={{ fontSize: 12, color: subColor, lineHeight: 18 }}>
                {PINNACLE_QUALITIES[p.number] || PINNACLE_QUALITIES[((p.number - 1) % 9) + 1]}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ── Kosmogram Grid ─────────────────────────────────────────
const KosmogramGrid = ({ birthDate, accent, isLight }: { birthDate: string; accent: string; isLight: boolean }) => {
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.5)';
  const digitCounts = useMemo(() => {
    const digits = birthDate.replace(/\D/g, '').split('').map(Number).filter(d => d >= 1 && d <= 9);
    const counts: Record<number, number> = {};
    for (let i = 1; i <= 9; i++) counts[i] = 0;
    digits.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
    return counts;
  }, [birthDate]);

  const GRID_LABELS = [[7,8,9],[4,5,6],[1,2,3]];
  const ENERGY_NAMES: Record<number, string> = {
    1:'Wola', 2:'Intuicja', 3:'Twórczość', 4:'Stabilność',
    5:'Wolność', 6:'Miłość', 7:'Mądrość', 8:'Siła', 9:'Misja',
  };

  return (
    <View style={{ alignSelf: 'center', marginVertical: 8 }}>
      {GRID_LABELS.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
          {row.map((n) => {
            const count = digitCounts[n] || 0;
            const meta = getMeta(n);
            const color = meta.color;
            const strength = count === 0 ? 'absent' : count === 1 ? 'weak' : count === 2 ? 'moderate' : 'strong';
            const bgOpacity = strength === 'absent' ? '11' : strength === 'weak' ? '33' : strength === 'moderate' ? '66' : 'CC';
            const borderOpacity = strength === 'absent' ? '22' : strength === 'weak' ? '44' : strength === 'moderate' ? '88' : 'FF';
            return (
              <View key={n} style={{
                width: 72, height: 72, borderRadius: 20,
                backgroundColor: color + bgOpacity,
                borderWidth: strength === 'strong' ? 2 : 1,
                borderColor: color + borderOpacity,
                alignItems: 'center', justifyContent: 'center',
                shadowColor: color, shadowOpacity: count > 0 ? 0.3 : 0,
                shadowRadius: 6, elevation: count > 0 ? 4 : 1,
              }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: count > 0 ? (isLight && strength !== 'strong' ? color : '#FFF') : color + '55' }}>{n}</Text>
                <Text style={{ fontSize: 8, color: count > 0 ? (isLight && strength !== 'strong' ? color : '#FFFc') : color + '44', marginTop: 1 }} numberOfLines={1}>{ENERGY_NAMES[n]}</Text>
                {count > 1 && (
                  <View style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 8, color: '#FFF', fontWeight: '800' }}>{count}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, justifyContent: 'center' }}>
        {[['Silna','CC'],['Umiark.','66'],['Słaba','33'],['Brak','11']].map(([label, op]) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: accent + op }} />
            <Text style={{ fontSize: 9, color: subColor }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ── Section Tab Bar ────────────────────────────────────────────
const SECTIONS = [
  { key: 'rdzen', label: 'Rdzeń', icon: Sparkles },
  { key: 'cykle', label: 'Cykle', icon: Clock },
  { key: 'rokos', label: 'Rok', icon: Sun },
  { key: 'glebsze', label: 'Głębsze', icon: Eye },
  { key: 'analiza', label: 'Analiza', icon: BarChart3 },
];

const SectionTabBar = ({ active, onSelect, accent, isLight }: {
  active: string; onSelect: (k: string) => void; accent: string; isLight: boolean;
}) => {
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.45)';
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 6, marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 4, gap: 4 }}>
        {SECTIONS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <Pressable
              key={key}
              onPress={() => { onSelect(key); HapticsService.selection(); }}
              style={{ alignItems: 'center', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 14,
                backgroundColor: isActive ? accent + '22' : 'transparent',
                borderWidth: isActive ? 1 : 0,
                borderColor: isActive ? accent + '55' : 'transparent',
              }}
            >
              <Icon color={isActive ? accent : subColor} size={15} strokeWidth={1.8} />
              <Text style={{ fontSize: 9, fontWeight: isActive ? '700' : '500', color: isActive ? accent : subColor, marginTop: 3, letterSpacing: 0.3 }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
};

// ── Section divider ───────────────────────────────────────────
const Divider = ({ label, color, isLight }: { label: string; color: string; isLight: boolean }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: layout.padding.screen, marginVertical: 20 }}>
    <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)' }} />
    <Text style={{ marginHorizontal: 10, fontSize: 9, color, fontWeight: '700', letterSpacing: 2 }}>{label}</Text>
    <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)' }} />
  </View>
);

// ── AI Insight Card ───────────────────────────────────────────
const AiInsightCard = ({ insight, loading, accent, isLight, onRequest }: {
  insight: string; loading: boolean; accent: string; isLight: boolean; onRequest: () => void;
}) => {
  const { t } = useTranslation();
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.60)';
  return (
    <View style={{ borderRadius: 18, padding: 18, overflow: 'hidden',
      backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)',
      borderWidth: 1, borderColor: accent + '44' }}>
      <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFillObject} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: accent + '22', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Sparkles color={accent} size={16} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 9, color: accent, fontWeight: '700', letterSpacing: 1.8 }}>{t('numerology.oracle_numerologi_1', 'ORACLE NUMEROLOGICZNY')}</Text>
          <Text style={{ fontSize: 12, color: textColor, fontWeight: '600', marginTop: 2 }}>{t('numerology.wglad_ai_dla_twoich_liczb', 'Wgląd AI dla Twoich liczb')}</Text>
        </View>
      </View>
      {insight ? (
        <Text style={{ fontSize: 13, color: textColor, lineHeight: 22 }}>{insight}</Text>
      ) : (
        <Text style={{ fontSize: 12, color: subColor, lineHeight: 20, fontStyle: 'italic' }}>
          {loading ? 'Oracle oblicza Twoją numerologiczną wibrację...' : 'Naciśnij przycisk, aby Oracle połączył Twoje liczby w osobistą przepowiednię.'}
        </Text>
      )}
      {!insight && !loading && (
        <Pressable
          onPress={onRequest}
          style={{ marginTop: 14, borderRadius: 12, overflow: 'hidden' }}
        >
          <LinearGradient colors={[accent, accent + 'BB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Zap color="#FFF" size={14} strokeWidth={2} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 }}>{t('numerology.zapytaj_oracle', 'Zapytaj Oracle')}</Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
};

// ── Main screen ─────────────────────────────────────────────
export const NumerologyScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.60)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.08)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.10)';

  // Active section tab
  const [activeSection, setActiveSection] = useState('rdzen');

  // Dla kogoś
  const [forSomeone, setForSomeone] = useState(false);
  const [forSomeoneName, setForSomeoneName] = useState('');
  const [forSomeoneBirth, setForSomeoneBirth] = useState('');
  const [showForSomeoneModal, setShowForSomeoneModal] = useState(false);
  // DateWheelPicker state for "dla kogoś"
  const [fsDay, setFsDay] = useState(1);
  const [fsMonth, setFsMonth] = useState(1);
  const [fsYear, setFsYear] = useState(1990);

  // Partner compatibility
  const [partnerName, setPartnerName] = useState('');
  const [partnerBirthDate, setPartnerBirthDate] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);

  // Name analysis input
  const [analysisName, setAnalysisName] = useState('');

  // AI
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const activeBirthDate = forSomeone && forSomeoneBirth.trim() ? forSomeoneBirth : userData.birthDate;
  const activeName = forSomeone && forSomeoneName.trim() ? forSomeoneName
    : [userData.name, userData.lastName].filter(Boolean).join(' ').trim();

  const matrix = useMemo(() => activeBirthDate ? calculateMatrix(activeBirthDate) : null, [activeBirthDate]);
  const partnerMatrix = useMemo(() => partnerBirthDate ? calculateMatrix(partnerBirthDate) : null, [partnerBirthDate]);
  const partnership = useMemo(() => (userData.birthDate && partnerBirthDate) ? calculateCompatibility(userData.birthDate, partnerBirthDate) : null, [partnerBirthDate, userData.birthDate]);

  // Core numbers
  const lifePath = useMemo(() => activeBirthDate ? calcLifePath(activeBirthDate) : 0, [activeBirthDate]);
  const expressionNum = useMemo(() => activeName ? calcExpressionNumber(activeName) : 0, [activeName]);
  const soulUrge = useMemo(() => activeName ? calcSoulUrge(activeName) : 0, [activeName]);
  const personality = useMemo(() => activeName ? calcPersonality(activeName) : 0, [activeName]);

  // Deeper numbers
  const maturityNum = useMemo(() => (activeBirthDate && activeName) ? calcMaturityNumber(activeBirthDate, activeName) : 0, [activeBirthDate, activeName]);
  const balanceNum = useMemo(() => activeName ? calcBalanceNumber(activeName) : 0, [activeName]);
  const hiddenPassion = useMemo(() => activeName ? calcHiddenPassion(activeName) : 0, [activeName]);

  // Cycles
  const personalYear = useMemo(() => activeBirthDate ? calcPersonalYear(activeBirthDate) : 0, [activeBirthDate]);
  const personalMonth = useMemo(() => activeBirthDate ? calcPersonalMonth(activeBirthDate) : 0, [activeBirthDate]);
  const personalDay = useMemo(() => activeBirthDate ? calcPersonalDay(activeBirthDate) : 0, [activeBirthDate]);
  const universalDay = useMemo(() => calcUniversalDay(), []);

  // Advanced
  const pinnacles = useMemo(() => activeBirthDate ? calcPinnacles(activeBirthDate) : [], [activeBirthDate]);
  const challenges = useMemo(() => activeBirthDate ? calcChallenges(activeBirthDate) : null, [activeBirthDate]);
  const bridges = useMemo(() => (activeBirthDate && activeName) ? calcBridges(activeBirthDate, activeName) : null, [activeBirthDate, activeName]);

  // Soul compatibility
  const soulCompat = useMemo(() => {
    const psn = partnerBirthDate ? calcLifePath(partnerBirthDate) : 0;
    return psn ? calcSoulCompatibility(lifePath, psn) : null;
  }, [lifePath, partnerBirthDate]);

  // Monthly forecasts: next 3 months
  const monthlyForecasts = useMemo(() => {
    if (!activeBirthDate) return [];
    const now = new Date();
    const monthNames = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
    return [0, 1, 2].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const py = calcPersonalYear(activeBirthDate, d.getFullYear());
      const pm = reduceMaster(py + (d.getMonth() + 1));
      const info = getCycleInfo(pm);
      return { month: monthNames[d.getMonth()], number: pm, name: info.name, desc: info.month, icon: info.icon };
    });
  }, [activeBirthDate]);

  const buildYearNumber = () => reduceMaster(new Date().getFullYear() + new Date().getMonth() + 1 + new Date().getDate());
  const yearNumber = useMemo(() => buildYearNumber(), []);

  const handleAiInsight = useCallback(async () => {
    if (!lifePath) return;
    setAiLoading(true);
    HapticsService.notify();
    try {
      const displayName = forSomeone ? forSomeoneName : (userData.name || 'Ty');
      const messages = [
        {
          role: 'user' as const,
          content: `Jestem numerologiem-mistycznym. Stwórz głęboki, duchowy wgląd (4-5 zdań) dla osoby ${displayName} z następującymi liczbami numerologicznymi:
- Droga Życia: ${lifePath} (${getMeta(lifePath).archetype})
- Wyraz/Przeznaczenie: ${expressionNum} (${getMeta(expressionNum || lifePath).archetype})
- Poryw Duszy: ${soulUrge} (${getMeta(soulUrge || lifePath).archetype})
- Liczba Osobowości: ${personality} (${getMeta(personality || lifePath).archetype})
- Rok Osobisty: ${personalYear}
- Aktywny Pinnakl: ${pinnacles.find(p => { const age = new Date().getFullYear() - new Date(activeBirthDate).getFullYear(); return age >= p.from && (p.to === null || age <= p.to); })?.number || '?'}
- Liczba Dojrzałości: ${maturityNum}
- Liczba Balansu: ${balanceNum}

Połącz te energie w jedno poetyckie, mistyczne przesłanie. Używaj polskiego, duchowego języka. Wskaż konkretne napięcie lub harmonię między liczbami.`,
        },
      ];
      const result = await AiService.chatWithOracle(messages);
      setAiInsight(result);
    } catch (e) {
      setAiInsight('Oracle jest chwilowo niedostępny. Spróbuj ponownie za chwilę.');
    } finally {
      setAiLoading(false);
    }
  }, [lifePath, expressionNum, soulUrge, personality, personalYear, pinnacles, maturityNum, balanceNum, activeBirthDate, forSomeone, forSomeoneName, userData.name]);

  const handleShare = async () => {
    if (!matrix) return;
    await Share.share({
      message: buildNumerologyShareMessage(
        activeName || 'Twoja mapa liczb',
        `Droga życia ${lifePath}, wyraz ${expressionNum}, poryw duszy ${soulUrge}, osobowość ${personality}.`,
        [
          `Rok osobisty ${personalYear} · Miesiąc ${personalMonth} · Dzień ${personalDay}.`,
          `Dojrzałość: ${maturityNum} · Balans: ${balanceNum}.`,
          partnerMatrix && partnership ? `Zgodność dusz: ${soulCompat?.score || '?'}%.` : 'Numerologia najlepiej działa, gdy jedną liczbę przekładasz na jeden realny ruch.',
        ],
      ),
    });
  };

  if (!matrix || !lifePath) {
    return (
      <View style={[styles.container, { backgroundColor: isLight ? '#FAF6EE' : '#030209' }]}>
        <NumerologyBackground isLight={isLight} />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.emptyState}>
            <SectionHeading
              eyebrow="Numerologia"
              title={t('numerology.najpierw_potrzebuje_twojej_daty_uro', 'Najpierw potrzebujemy Twojej daty urodzenia.')}
              subtitle={t('numerology.numerologi_w_aetherze_jest_zywa', 'Numerologia w Aetherze jest żywa i osobista. Bez daty nie otworzymy drogi życia, pinnakli ani cyklu rocznego.')}
              centered
            />
            <Pressable style={[styles.emptyAction, { borderColor: currentTheme.primary }]} onPress={() => navigateToMainTab(navigation, 'Profile')}>
              <Typography variant="premiumLabel" color={currentTheme.primary}>{t('numerology.uzupelnij_profil', 'Uzupełnij profil')}</Typography>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const lpMeta = getMeta(lifePath);
  const exprMeta = getMeta(expressionNum || lifePath);
  const soulMeta = getMeta(soulUrge || lifePath);
  const perseMeta = getMeta(personality || lifePath);
  const pyMeta = getMeta(personalYear);
  const pmMeta = getMeta(personalMonth);
  const pdMeta = getMeta(personalDay);
  const udMeta = getMeta(universalDay);
  const matMeta = getMeta(maturityNum || lifePath);
  const balMeta = getMeta(balanceNum || lifePath);

  const currentAge = new Date().getFullYear() - new Date(activeBirthDate).getFullYear();
  const activePinnacle = pinnacles.find(p => currentAge >= p.from && (p.to === null || currentAge <= p.to));

  // ── Section renderers ─────────────────────────────────────

  const renderRdzen = () => (
    <Animated.View entering={FadeInDown.duration(400)}>
      {/* Hero: Universal + Personal Day */}
      <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, borderRadius: 16, padding: 14, overflow: 'hidden',
            backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)',
            borderWidth: 1, borderColor: udMeta.color + '44', borderTopWidth: 3, borderTopColor: udMeta.color }}>
            <LinearGradient colors={[udMeta.color + '18', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <Text style={{ fontSize: 8, color: udMeta.color, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>{t('numerology.dzien_uniwersaln', '☀ DZIEŃ UNIWERSALNY')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <NumberGlowBadge value={universalDay} size={44} isLight={isLight} />
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>{getCycleInfo(universalDay).name}</Text>
                <Text style={{ fontSize: 10, color: udMeta.color }}>{udMeta.archetype}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 10, color: subColor, marginTop: 8, lineHeight: 16 }} numberOfLines={2}>{getCycleInfo(universalDay).day}</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 16, padding: 14, overflow: 'hidden',
            backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)',
            borderWidth: 1, borderColor: pdMeta.color + '44', borderTopWidth: 3, borderTopColor: pdMeta.color }}>
            <LinearGradient colors={[pdMeta.color + '18', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <Text style={{ fontSize: 8, color: pdMeta.color, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>{t('numerology.dzien_osobisty', '🌙 DZIEŃ OSOBISTY')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <NumberGlowBadge value={personalDay} size={44} isLight={isLight} />
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>{getCycleInfo(personalDay).name}</Text>
                <Text style={{ fontSize: 10, color: pdMeta.color }}>{pdMeta.archetype}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 10, color: subColor, marginTop: 8, lineHeight: 16 }} numberOfLines={2}>{getCycleInfo(personalDay).day}</Text>
          </View>
        </View>
      </View>

      <Divider label={t('numerology.rdzen_tozsamosci', '✦ RDZEŃ TOŻSAMOŚCI')} color={currentTheme.primary} isLight={isLight} />

      <View style={{ paddingHorizontal: layout.padding.screen }}>
        <NumberMatrix3D lifePathNumber={lifePath} accent={currentTheme.primary} />

        <NumberCard
          label={t('numerology.droga_zycia', 'Droga Życia')}
          value={lifePath}
          meta={lpMeta}
          eyebrow="Fundament tożsamości"
          isLight={isLight}
          sublabel="Jak przeżywasz swoje życie — misja i natura"
        />
        {expressionNum > 0 && (
          <NumberCard
            label={t('numerology.liczba_wyrazu', 'Liczba Wyrazu')}
            value={expressionNum}
            meta={exprMeta}
            eyebrow="Przeznaczenie i talent"
            isLight={isLight}
            sublabel="Suma wszystkich liter pełnego imienia"
          />
        )}
        {soulUrge > 0 && (
          <NumberCard
            label={t('numerology.poryw_duszy', 'Poryw Duszy')}
            value={soulUrge}
            meta={soulMeta}
            eyebrow="Głęboka motywacja serca"
            isLight={isLight}
            sublabel="Suma samogłosek — czego naprawdę pragniesz"
          />
        )}
        {personality > 0 && (
          <NumberCard
            label={t('numerology.liczba_osobowosci', 'Liczba Osobowości')}
            value={personality}
            meta={perseMeta}
            eyebrow="Zewnętrzna maska"
            isLight={isLight}
            sublabel="Suma spółgłosek — jak widzą Cię inni"
          />
        )}
      </View>

      {/* Bridge numbers */}
      {bridges && (expressionNum > 0 || soulUrge > 0) && (
        <Animated.View entering={FadeInDown.delay(80).duration(520)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 6 }}>
          <View style={{ borderRadius: 16, padding: 16, overflow: 'hidden',
            backgroundColor: cardBg, borderWidth: 1, borderColor: currentTheme.primary + '33' }}>
            <LinearGradient colors={[currentTheme.primary + '12', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <Text style={{ fontSize: 9, color: currentTheme.primary, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 }}>{t('numerology.liczby_pomostowe', '🌉 LICZBY POMOSTOWE')}</Text>
            <Text style={{ fontSize: 11, color: subColor, lineHeight: 17, marginBottom: 10 }}>
              {t('numerology.liczby_pomostowe_pokazuja_jakie_nap', 'Liczby pomostowe pokazują, jakie napięcie musisz zintegrować między kluczowymi energiami.')}
            </Text>
            {[
              { label: 'Droga Życia ↔ Wyraz', value: bridges.lpExpr, desc: 'Napięcie między tym, kim jesteś, a tym, czym masz być.' },
              { label: 'Droga Życia ↔ Dusza', value: bridges.lpSoul, desc: 'Napięcie między drogą a głębokim pragnieniem serca.' },
              ...(expressionNum > 0 && soulUrge > 0 ? [{ label: 'Wyraz ↔ Dusza', value: bridges.exprSoul, desc: 'Napięcie między talentami a wewnętrzną tęsknotą.' }] : []),
            ].map(({ label, value, desc }, i, arr) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.07)' }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: currentTheme.primary + '28', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: currentTheme.primary }}>{value}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>{label}</Text>
                  <Text style={{ fontSize: 11, color: subColor, marginTop: 2 }}>{desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* AI Insight */}
      <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 20 }}>
        <AiInsightCard
          insight={aiInsight}
          loading={aiLoading}
          accent={currentTheme.primary}
          isLight={isLight}
          onRequest={handleAiInsight}
        />
      </View>
    </Animated.View>
  );

  const renderCykle = () => (
    <Animated.View entering={FadeInDown.duration(400)}>
      <Divider label={t('numerology.cykl_osobisty', '✦ CYKL OSOBISTY')} color={pyMeta.color} isLight={isLight} />

      <View style={{ paddingHorizontal: layout.padding.screen }}>
        {/* Year / Month side by side */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <View style={{ flex: 1, borderRadius: 16, padding: 14, overflow: 'hidden',
            backgroundColor: cardBg, borderWidth: 1, borderColor: pyMeta.color + '55', borderLeftWidth: 4, borderLeftColor: pyMeta.color }}>
            <LinearGradient colors={[pyMeta.color + '18', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <Text style={{ fontSize: 9, color: pyMeta.color, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>{t('numerology.rok_osobisty', 'ROK OSOBISTY')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <NumberGlowBadge value={personalYear} size={44} isLight={isLight} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, flex: 1 }}>{getCycleInfo(personalYear).name}</Text>
            </View>
            <Text style={{ fontSize: 11, color: subColor, marginTop: 8, lineHeight: 16 }}>{getCycleInfo(personalYear).month}</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 16, padding: 14, overflow: 'hidden',
            backgroundColor: cardBg, borderWidth: 1, borderColor: pmMeta.color + '55', borderLeftWidth: 4, borderLeftColor: pmMeta.color }}>
            <LinearGradient colors={[pmMeta.color + '18', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <Text style={{ fontSize: 9, color: pmMeta.color, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>{t('numerology.miesiac_osobisty', 'MIESIĄC OSOBISTY')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <NumberGlowBadge value={personalMonth} size={44} isLight={isLight} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, flex: 1 }}>{getCycleInfo(personalMonth).name}</Text>
            </View>
            <Text style={{ fontSize: 11, color: subColor, marginTop: 8, lineHeight: 16 }}>{getCycleInfo(personalMonth).month}</Text>
          </View>
        </View>

        {/* Monthly forecasts */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4, marginBottom: 14 }}>
          {monthlyForecasts.map((fc, i) => {
            const fcMeta = getMeta(fc.number);
            return (
              <View key={fc.month} style={{
                width: width * 0.58, borderRadius: 16, padding: 14, overflow: 'hidden',
                backgroundColor: cardBg, borderWidth: 1, borderColor: fcMeta.color + '44',
              }}>
                <LinearGradient colors={[fcMeta.color + '20', 'transparent']} style={StyleSheet.absoluteFillObject} />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 }}>
                  <NumberGlowBadge value={fc.number} size={36} isLight={isLight} />
                  <View>
                    <Text style={{ fontSize: 10, color: fcMeta.color, fontWeight: '700', letterSpacing: 1.2 }}>{fc.month.toUpperCase()}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>{fc.icon} {fc.name}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: subColor, lineHeight: 17 }} numberOfLines={3}>{fc.desc}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Pinnacles */}
      <Divider label={t('numerology.pinnakle_zycia', '✦ PINNAKLE ŻYCIA')} color="#A78BFA" isLight={isLight} />
      <Animated.View entering={FadeInDown.delay(60).duration(520)} style={{ paddingHorizontal: layout.padding.screen }}>
        <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 14 }}>
          {t('numerology.4_glowne_etapy_zycia_z', '4 główne etapy życia, z których każdy przynosi dominującą energię i lekcję. Aktywny pinnakl to Twój obecny sezon duszy.')}
        </Text>
        {activePinnacle && (
          <View style={{ borderRadius: 14, padding: 14, marginBottom: 16,
            backgroundColor: getMeta(activePinnacle.number).color + '18',
            borderWidth: 1.5, borderColor: getMeta(activePinnacle.number).color + '55' }}>
            <LinearGradient colors={[getMeta(activePinnacle.number).color + '20', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <Text style={{ fontSize: 9, color: getMeta(activePinnacle.number).color, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>{t('numerology.aktywny_pinnakl_teraz', '✦ AKTYWNY PINNAKL TERAZ')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <NumberGlowBadge value={activePinnacle.number} size={52} isLight={isLight} pulse />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: textColor }}>
                  {activePinnacle.label}
                </Text>
                <Text style={{ fontSize: 12, color: getMeta(activePinnacle.number).color, fontWeight: '600', marginTop: 2 }}>
                  Energia {activePinnacle.number} — {getMeta(activePinnacle.number).archetype}
                </Text>
              </View>
            </View>
          </View>
        )}
        <PinnacleTimeline pinnacles={pinnacles} birthDate={activeBirthDate} accent={currentTheme.primary} isLight={isLight} />
      </Animated.View>

      {/* Challenges */}
      {challenges && (
        <>
          <Divider label={t('numerology.wyzwania_karmiczne', '✦ WYZWANIA KARMICZNE')} color="#F87171" isLight={isLight} />
          <Animated.View entering={FadeInDown.delay(80).duration(520)} style={{ paddingHorizontal: layout.padding.screen }}>
            <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 14 }}>
              {t('numerology.wyzwania_nie_blokuja_wskazuja_gdzie', 'Wyzwania nie blokują — wskazują, gdzie leży Twoja największa szansa wzrostu.')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[
                { label: 'Wyzwanie 1', value: challenges.c1, range: 'Młodość' },
                { label: 'Wyzwanie 2', value: challenges.c2, range: 'Dojrzałość' },
                { label: 'Wyzwanie 3 (główne)', value: challenges.c3, range: 'Przez całe życie' },
                { label: 'Wyzwanie 4', value: challenges.c4, range: 'Późna dojrzałość' },
              ].map(({ label, value, range }) => (
                <View key={label} style={{
                  width: (width - layout.padding.screen * 2 - 10) / 2,
                  borderRadius: 16, padding: 14, overflow: 'hidden',
                  backgroundColor: cardBg, borderWidth: 1,
                  borderColor: '#F87171' + '44', borderTopWidth: 3, borderTopColor: '#F87171',
                }}>
                  <LinearGradient colors={['#F87171' + '16', 'transparent']} style={StyleSheet.absoluteFillObject} />
                  <Text style={{ fontSize: 8, color: '#F87171', fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 }}>{label.toUpperCase()}</Text>
                  <NumberGlowBadge value={value || 1} size={40} isLight={isLight} />
                  <Text style={{ fontSize: 10, color: subColor, marginTop: 6 }}>{range}</Text>
                  <Text style={{ fontSize: 10, color: subColor, lineHeight: 15, marginTop: 4 }} numberOfLines={3}>
                    {CHALLENGE_MEANINGS[value] || CHALLENGE_MEANINGS[0]}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </>
      )}
    </Animated.View>
  );

  const renderGlebsze = () => (
    <Animated.View entering={FadeInDown.duration(400)}>
      <Divider label={t('numerology.liczby_glebsze', '✦ LICZBY GŁĘBSZE')} color="#A78BFA" isLight={isLight} />

      <View style={{ paddingHorizontal: layout.padding.screen }}>
        {/* Maturity + Balance in a row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          {maturityNum > 0 && (
            <CompactNumberCard
              label={t('numerology.dojrzalosc', 'Dojrzałość')}
              value={maturityNum}
              color="#A78BFA"
              desc="Droga Życia + Wyraz — kto staniesz się po 40."
              isLight={isLight}
            />
          )}
          {balanceNum > 0 && (
            <CompactNumberCard
              label={t('numerology.balans', 'Balans')}
              value={balanceNum}
              color="#34D399"
              desc="Suma inicjałów — Twoja kotwica w kryzysie."
              isLight={isLight}
            />
          )}
        </View>

        {/* Maturity full card */}
        {maturityNum > 0 && (
          <Animated.View entering={FadeInDown.delay(40).duration(500)} style={{ marginBottom: 12 }}>
            <View style={{ borderRadius: 18, padding: 16, overflow: 'hidden',
              backgroundColor: cardBg, borderWidth: 1, borderColor: '#A78BFA44' }}>
              <LinearGradient colors={['#A78BFA22', 'transparent']} style={StyleSheet.absoluteFillObject} />
              <Text style={{ fontSize: 9, color: '#A78BFA', fontWeight: '700', letterSpacing: 1.8, marginBottom: 12 }}>🌕 LICZBA DOJRZAŁOŚCI — {maturityNum}</Text>
              <Text style={{ fontSize: 13, color: textColor, lineHeight: 20 }}>
                {MATURITY_MEANINGS[maturityNum] || MATURITY_MEANINGS[((maturityNum - 1) % 9) + 1]}
              </Text>
              <Text style={{ fontSize: 11, color: subColor, marginTop: 8, lineHeight: 18, fontStyle: 'italic' }}>
                Liczba Dojrzałości = Droga Życia ({lifePath}) + Wyraz ({expressionNum}) = {maturityNum}. Ujawnia się w pełni po 45. roku życia.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Balance full card */}
        {balanceNum > 0 && (
          <Animated.View entering={FadeInDown.delay(60).duration(500)} style={{ marginBottom: 12 }}>
            <View style={{ borderRadius: 18, padding: 16, overflow: 'hidden',
              backgroundColor: cardBg, borderWidth: 1, borderColor: '#34D39944' }}>
              <LinearGradient colors={['#34D39922', 'transparent']} style={StyleSheet.absoluteFillObject} />
              <Text style={{ fontSize: 9, color: '#34D399', fontWeight: '700', letterSpacing: 1.8, marginBottom: 12 }}>⚖ LICZBA BALANSU — {balanceNum}</Text>
              <Text style={{ fontSize: 13, color: textColor, lineHeight: 20 }}>
                {BALANCE_MEANINGS[balanceNum] || BALANCE_MEANINGS[((balanceNum - 1) % 9) + 1]}
              </Text>
              <Text style={{ fontSize: 11, color: subColor, marginTop: 8, lineHeight: 18, fontStyle: 'italic' }}>
                {t('numerology.liczba_balansu_pochodzi_z_twoich', 'Liczba Balansu pochodzi z Twoich inicjałów — to Twoja strategia radzenia sobie z kryzysami emocjonalnymi.')}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Hidden Passion */}
        {hiddenPassion > 0 && (
          <Animated.View entering={FadeInDown.delay(80).duration(500)} style={{ marginBottom: 12 }}>
            <View style={{ borderRadius: 18, padding: 16, overflow: 'hidden',
              backgroundColor: cardBg, borderWidth: 1, borderColor: '#F472B644' }}>
              <LinearGradient colors={['#F472B622', 'transparent']} style={StyleSheet.absoluteFillObject} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <NumberGlowBadge value={hiddenPassion} size={52} isLight={isLight} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, color: '#F472B6', fontWeight: '700', letterSpacing: 1.8, marginBottom: 4 }}>{t('numerology.ukryta_pasja', '🔥 UKRYTA PASJA')}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: textColor }}>Energia {hiddenPassion}</Text>
                  <Text style={{ fontSize: 12, color: '#F472B6', marginTop: 2 }}>{getMeta(hiddenPassion).archetype} · {getMeta(hiddenPassion).planet}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 13, color: textColor, lineHeight: 20 }}>
                {t('numerology.ukryta_pasja_to_liczba_ktora', 'Ukryta Pasja to liczba, która pojawia się najczęściej w Twoim imieniu. Reprezentuje szczególny talent i obszar, w którym możesz osiągnąć mistrzostwo.')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {getMeta(hiddenPassion).keywords.map(kw => (
                  <View key={kw} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F472B622', borderWidth: 1, borderColor: '#F472B644' }}>
                    <Text style={{ fontSize: 10, color: '#F472B6', fontWeight: '600' }}>{kw}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Crystal & Color */}
        <Divider label={t('numerology.kamien_i_kolor_drogi_zycia', '✦ KAMIEŃ I KOLOR DROGI ŻYCIA')} color={lpMeta.color} isLight={isLight} />
        <Animated.View entering={FadeInDown.delay(100).duration(520)}>
          <View style={{ borderRadius: 18, padding: 18, overflow: 'hidden', backgroundColor: cardBg, borderWidth: 1, borderColor: lpMeta.color + '55' }}>
            <LinearGradient colors={[lpMeta.color + '22', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: lpMeta.color + '33', borderWidth: 2, borderColor: lpMeta.color + '66', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <Gem color={lpMeta.color} size={28} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, color: lpMeta.color, fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 }}>DROGA ŻYCIA {lifePath}</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: textColor }}>{lpMeta.crystal}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 8 }}>
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: lpMeta.color }} />
                  <Text style={{ fontSize: 12, color: lpMeta.color, fontWeight: '600' }}>{lpMeta.colorName} · {lpMeta.planet}</Text>
                </View>
              </View>
            </View>
            <Text style={{ fontSize: 13, color: subColor, lineHeight: 20, marginTop: 14 }}>{lpMeta.crystalDesc}</Text>
            <Text style={{ fontSize: 12, color: subColor + 'CC', lineHeight: 18, marginTop: 8, fontStyle: 'italic' }}>Cień: {lpMeta.shadow}</Text>
          </View>
        </Animated.View>

        {/* Soul Compatibility */}
        <Divider label={t('numerology.zgodnosc_numerologi', '✦ ZGODNOŚĆ NUMEROLOGICZNA')} color="#F472B6" isLight={isLight} />
        <Animated.View entering={FadeInDown.delay(120).duration(520)}>
          <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 14 }}>
            {t('numerology.wprowadz_dane_osoby_aby_zobaczyc', 'Wprowadź dane osoby, aby zobaczyć zgodność dróg życia oraz pełną dynamikę numerologiczną.')}
          </Text>
          <View style={{ borderRadius: 18, padding: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: '#F472B633', overflow: 'hidden', marginBottom: 14 }}>
            <LinearGradient colors={['#F472B612', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <Text style={{ fontSize: 9, color: '#F472B6', fontWeight: '700', letterSpacing: 1.6, marginBottom: 12 }}>{t('numerology.partner_numerologi', 'PARTNER NUMEROLOGICZNY')}</Text>
            <MysticalInput value={partnerName} onChangeText={setPartnerName} placeholder={t('numerology.imie_tej_osoby', 'Imię tej osoby')} />
            <Pressable style={[styles.partnerDateTrigger, { borderColor: currentTheme.glassBorder, backgroundColor: currentTheme.backgroundElevated, marginTop: 10 }]} onPress={() => setPickerVisible(true)}>
              <Typography variant="bodyRefined" style={{ color: partnerBirthDate ? currentTheme.text : currentTheme.textMuted }}>
                        {partnerBirthDate ? formatLocaleDate(partnerBirthDate) : (i18n.language?.startsWith('en') ? 'Birth date' : 'Data urodzenia')}
              </Typography>
              <ArrowRight color={currentTheme.primary} size={16} />
            </Pressable>

            {partnerMatrix && partnership && soulCompat && (
              <Animated.View entering={FadeInDown.duration(400)} style={{ marginTop: 16 }}>
                <View style={{ height: 1, backgroundColor: '#F472B444', marginBottom: 14 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#F472B6', fontWeight: '700', letterSpacing: 1.2, marginBottom: 5 }}>{t('numerology.zgodnosc_drog_zycia', 'ZGODNOŚĆ DRÓG ŻYCIA')}</Text>
                    <View style={{ height: 8, borderRadius: 4, backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)', marginBottom: 5 }}>
                      <View style={{ height: 8, borderRadius: 4, width: `${soulCompat.score}%`, backgroundColor: soulCompat.color }} />
                    </View>
                    <Text style={{ fontSize: 11, color: subColor }}>Twoja {lifePath} + {partnerName.trim() || 'partner'} {calcLifePath(partnerBirthDate)}</Text>
                  </View>
                  <View style={{ marginLeft: 14, alignItems: 'center' }}>
                    <Text style={{ fontSize: 30, fontWeight: '900', color: soulCompat.color }}>{soulCompat.score}%</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: soulCompat.color }}>{soulCompat.label}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    { label: 'Droga życia', you: lifePath, them: calcLifePath(partnerBirthDate) },
                    { label: 'Centrum', you: matrix?.center || 0, them: partnerMatrix.center },
                    { label: 'Relacje', you: matrix?.relationship || 0, them: partnerMatrix.relationship },
                  ].map(({ label, you, them }) => (
                    <View key={label} style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)', alignItems: 'center' }}>
                      <Text style={{ fontSize: 9, color: subColor, marginBottom: 5, textAlign: 'center' }}>{label}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: currentTheme.primary }}>{you}</Text>
                        <Text style={{ fontSize: 9, color: subColor }}>{t('numerology.vs', 'vs')}</Text>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#F472B6' }}>{them}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}
          </View>

          {/* Classic pairs */}
          <View style={{ borderRadius: 18, padding: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: '#F472B622', overflow: 'hidden' }}>
            <LinearGradient colors={['#F472B608', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <Text style={{ fontSize: 9, color: '#F472B6', fontWeight: '700', letterSpacing: 1.6, marginBottom: 12 }}>{t('numerology.klasyczne_pary_numerologi', 'KLASYCZNE PARY NUMEROLOGICZNE')}</Text>
            {[
              { a:1, b:5, score:92, desc:'Wzajemna inspiracja i wolność', color:'#F87171' },
              { a:2, b:6, score:90, desc:'Głęboka troska i harmonia', color:'#FB923C' },
              { a:3, b:9, score:87, desc:'Twórczość spotyka misję', color:'#FBBF24' },
              { a:7, b:11, score:95, desc:'Duchowe pokrewieństwo', color:'#60A5FA' },
              { a:4, b:8, score:86, desc:'Fundament i sprawczość', color:'#34D399' },
              { a:6, b:9, score:84, desc:'Miłość i służba wyższemu dobru', color:'#A78BFA' },
            ].map((pair, idx, arr) => (
              <View key={`${pair.a}${pair.b}`} style={{ marginBottom: idx < arr.length - 1 ? 12 : 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 48, height: 28, borderRadius: 9, backgroundColor: pair.color + '28', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: pair.color }}>{pair.a} & {pair.b}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                      <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>{pair.desc}</Text>
                      <Text style={{ fontSize: 11, color: pair.color, fontWeight: '700' }}>{pair.score}%</Text>
                    </View>
                    <View style={{ height: 5, borderRadius: 3, backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)' }}>
                      <View style={{ height: 5, borderRadius: 3, width: `${pair.score}%`, backgroundColor: pair.color }} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );

  const renderRokOs = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const pyColor = getMeta(personalYear).color;
    const pyMeta2 = getMeta(personalYear);
    const MONTH_NAMES = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'];
    const MONTH_NAMES_FULL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
    const YEAR_ACTION_MAP: Record<number, { mantra: string; actions: string[]; avoid: string; crystal: string; affirmation: string }> = {
      1: { mantra: 'Zaczynam. Decyduję. Działam.', actions: ['Zainicjuj nowy projekt lub kierunek', 'Podejmij decyzję, którą odkładasz', 'Stwórz rytuał nowego początku', 'Wyznacz 3 priorytety na cały rok'], avoid: 'Zwlekania i oczekiwania na idealne warunki', crystal: 'Karneol', affirmation: 'Mam odwagę zacząć od zera i iść własną drogą.' },
      2: { mantra: 'Słucham. Czuję. Łączę.', actions: ['Zainwestuj w relacje — czas, uwaga, szczerość', 'Rozwiń cierpliwość zamiast forsowania', 'Szukaj partnerów i współpracy', 'Ćwicz aktywne słuchanie bez oceniania'], avoid: 'Podejmowania pochopnych decyzji solo', crystal: 'Kamień księżycowy', affirmation: 'Harmonia rodzi się z uważnego słuchania i zaufania.' },
      3: { mantra: 'Tworzę. Wyrażam. Świecę.', actions: ['Realizuj projekt twórczy — pisz, maluj, twórz', 'Bierz udział w spotkaniach i prezentuj swoje idee', 'Odkryj nowe hobby ekspresji', 'Rozmawiaj — dziel się swoją wizją z innymi'], avoid: 'Tłumienia swojego głosu i talentu', crystal: 'Citrin', affirmation: 'Mój głos ma wartość i świat czeka na moją ekspresję.' },
      4: { mantra: 'Buduję. Porządkuję. Trwam.', actions: ['Stwórz system i rutynę, której brakuje', 'Zadbaj o zdrowie fizyczne — ciało to fundament', 'Zaplanuj finanse i oszczędności', 'Dokończ niedokończone projekty z lat poprzednich'], avoid: 'Rozpraszania się i braku dyscypliny', crystal: 'Zielony jaspis', affirmation: 'Każdy mały krok buduje trwałą strukturę mojego życia.' },
      5: { mantra: 'Zmieniam. Eksperymentuję. Odważam się.', actions: ['Wyjdź ze strefy komfortu — nowy kraj, kurs, środowisko', 'Porzuć to, co ogranicza i nie służy', 'Bądź elastyczny — plan może się zmienić', 'Odkryj nowy aspekt siebie przez doświadczenie'], avoid: 'Kurczowego trzymania się starych struktur', crystal: 'Akwamaryn', affirmation: 'Wolność rodzi się z gotowości do zmiany i eksperymentu.' },
      6: { mantra: 'Dbam. Harmonizuję. Odpowiadam.', actions: ['Zadbaj o relacje rodzinne i bliskie', 'Wyznacz zdrowe granice w opiekowaniu się innymi', 'Utwórz piękne i harmonijne środowisko domowe', 'Działaj z troski, nie z poczucia obowiązku'], avoid: 'Zaniedbywania własnych potrzeb w imię innych', crystal: 'Różowy kwarc', affirmation: 'Dawam z miłości, nie z lęku — i dbam też o siebie.' },
      7: { mantra: 'Wnikam. Medytuję. Rozumiem.', actions: ['Pogłęb praktykę duchową — medytacja, dziennik, cisza', 'Ucz się — czytaj, studiuj, badaj zagadnienie w głąb', 'Szukaj odosobnienia i czasu na refleksję', 'Zaufaj intuicji zamiast zewnętrznych opinii'], avoid: 'Hałasu, płytkości i presji towarzyskiej', crystal: 'Ametyst', affirmation: 'W ciszy odnajduję mądrość, której szukam na zewnątrz.' },
      8: { mantra: 'Działam. Manifestuję. Przywodzę.', actions: ['Podejmij decyzję biznesową lub finansową', 'Przejmij odpowiedzialność i lideruj', 'Zmaterializuj konkretne cele z planem działania', 'Połącz duchowość z praktyczną sprawczością'], avoid: 'Pasywności i pozostawania obserwatorem', crystal: 'Tygrysie oko', affirmation: 'Moja sprawczość zmienia rzeczywistość — działam z mocą i odpowiedzialnością.' },
      9: { mantra: 'Zamykam. Uwalniuam. Oddaję.', actions: ['Zakończ relacje, projekty i etapy, które dobiegły kresu', 'Przebacz sobie i innym — uwolnij ciężar', 'Podsumuj 9-letni cykl — czego się nauczyłeś?', 'Przygotuj miejsce na nowy cykl — oczyść, oddaj, pożegnaj'], avoid: 'Trzymania się tego, co już minęło', crystal: 'Labradoryt', affirmation: 'Zamykam ze wdzięcznością i otwieramy się na zupełnie nowe.' },
      11: { mantra: 'Czuję. Kanalizuję. Inspiruję.', actions: ['Zaufaj silnym przeczuciom bez racjonalizowania', 'Twórz i inspiruj innych swoją wizją', 'Dbaj o uziemienie — ciało, natura, rytm dnia', 'Pracuj nad granicami energetycznymi'], avoid: 'Przeciążenia wrażliwością i braku gruntu', crystal: 'Selenit', affirmation: 'Jestem kanałem światła — i moje wrażliwości są moją siłą.' },
      22: { mantra: 'Widzę wielkie. Materializuję trwałe. Buduję dla przyszłości.', actions: ['Zaplanuj długoterminowy projekt z realnym wpływem', 'Łącz wizję z konkretnym planem działania', 'Buduj struktury, które przetrwają Cię samego', 'Pracuj z zespołem — Twoja wizja potrzebuje innych'], avoid: 'Myślenia za małego i marnowania potencjału', crystal: 'Obsydian', affirmation: 'Buduję dziś coś, co będzie świecić długo po mnie.' },
    };
    const actionGuide = YEAR_ACTION_MAP[personalYear] || YEAR_ACTION_MAP[1];

    // Full 12-month forecast
    const fullMonthlyForecast = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(currentYear, i, 1);
      const pyCalc = activeBirthDate ? calcPersonalYear(activeBirthDate, d.getFullYear()) : personalYear;
      const pm = reduceMaster(pyCalc + (i + 1));
      const pmMeta = getMeta(pm);
      const isPast = i < now.getMonth();
      const isNow = i === now.getMonth();
      return { month: MONTH_NAMES[i], fullMonth: MONTH_NAMES_FULL[i], number: pm, color: pmMeta.color, isPast, isNow, name: getCycleInfo(pm).name, desc: getCycleInfo(pm).month };
    });

    // 9-year cycle
    const cycleStart = currentYear - ((personalYear - 1 + 9) % 9);
    const nineYears = Array.from({ length: 9 }, (_, i) => {
      const yr = cycleStart + i;
      const pyN = activeBirthDate ? calcPersonalYear(activeBirthDate, yr) : ((personalYear - 1 + i) % 9) + 1;
      const isCurrent = yr === currentYear;
      return { year: yr, pyN, color: getMeta(pyN).color, isCurrent };
    });

    return (
      <Animated.View entering={FadeInDown.duration(400)}>
        <Divider label={`✦ ROK OSOBISTY ${personalYear} · ${currentYear}`} color={pyColor} isLight={isLight} />

        <View style={{ paddingHorizontal: layout.padding.screen }}>
          {/* Hero card */}
          <View style={{ borderRadius: 24, padding: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1.5, borderColor: pyColor + '55' }}>
            <LinearGradient colors={[pyColor + '28', pyColor + '10', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 }}>
              <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: pyColor + '22', borderWidth: 2, borderColor: pyColor + '55', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 30, fontWeight: '900', color: pyColor }}>{personalYear}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, color: pyColor, fontWeight: '700', letterSpacing: 2, marginBottom: 4 }}>ROK OSOBISTY {currentYear}</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: isLight ? '#1A1A1A' : '#F0EBE2' }}>{pyMeta2.archetype}</Text>
                <Text style={{ fontSize: 12, color: pyColor, fontWeight: '600', marginTop: 2 }}>{pyMeta2.planet} · {pyMeta2.crystal}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, color: isLight ? '#3A3A3A' : '#D0C8BE', lineHeight: 21, marginBottom: 14 }}>{YEAR_GUIDANCE[personalYear] || YEAR_GUIDANCE[1]}</Text>
            <View style={{ borderRadius: 14, padding: 12, backgroundColor: pyColor + '14', borderWidth: 1, borderColor: pyColor + '33' }}>
              <Text style={{ fontSize: 9, color: pyColor, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 }}>{t('numerology.mantra_roku', 'MANTRA ROKU')}</Text>
              <Text style={{ fontSize: 15, color: isLight ? '#1A1A1A' : '#F0EBE2', fontWeight: '700', fontStyle: 'italic' }}>"{actionGuide.mantra}"</Text>
            </View>
          </View>

          {/* Actions + Avoid */}
          <View style={{ borderRadius: 18, padding: 16, overflow: 'hidden', marginBottom: 16, backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: pyColor + '33' }}>
            <Text style={{ fontSize: 9, color: pyColor, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 }}>{t('numerology.priorytety_roku', '✦ PRIORYTETY ROKU')}</Text>
            {actionGuide.actions.map((a, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 10 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: pyColor + '22', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  <Text style={{ fontSize: 11, color: pyColor, fontWeight: '700' }}>{i + 1}</Text>
                </View>
                <Text style={{ fontSize: 13, color: isLight ? '#2A2A2A' : '#E0D8D0', lineHeight: 20, flex: 1 }}>{a}</Text>
              </View>
            ))}
            <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.06)', paddingTop: 10 }}>
              <Text style={{ fontSize: 9, color: '#F87171', fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 }}>{t('numerology.unikaj', '⚠ UNIKAJ')}</Text>
              <Text style={{ fontSize: 12, color: isLight ? '#666' : '#B0A393', lineHeight: 18 }}>{actionGuide.avoid}</Text>
            </View>
          </View>

          {/* Affirmation */}
          <View style={{ borderRadius: 16, padding: 16, marginBottom: 20, overflow: 'hidden', backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: pyColor + '33' }}>
            <LinearGradient colors={[pyColor + '14', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <Text style={{ fontSize: 9, color: pyColor, fontWeight: '700', letterSpacing: 1.8, marginBottom: 8 }}>{t('numerology.afirmacja_roku', '✦ AFIRMACJA ROKU')}</Text>
            <Text style={{ fontSize: 14, color: isLight ? '#1A1A1A' : '#F0EBE2', lineHeight: 22, fontStyle: 'italic' }}>"{actionGuide.affirmation}"</Text>
          </View>
        </View>

        {/* 9-year cycle */}
        <Divider label={t('numerology.cykl_9_letni', '✦ CYKL 9-LETNI')} color="#A78BFA" isLight={isLight} />
        <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 20 }}>
          <Text style={{ fontSize: 12, color: isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)', lineHeight: 18, marginBottom: 14 }}>
            {t('numerology.kazdy_cykl_numerologi_trwa_9', 'Każdy cykl numerologiczny trwa 9 lat. Każdy rok niesie inną energię i lekcję — razem tworzą pełną spiralę wzrostu.')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {nineYears.map(({ year, pyN, color, isCurrent }) => (
              <View key={year} style={{ width: 72, borderRadius: 16, padding: 12, alignItems: 'center', overflow: 'hidden',
                backgroundColor: isCurrent ? color + '22' : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)'),
                borderWidth: isCurrent ? 2 : 1,
                borderColor: isCurrent ? color : (isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)'),
              }}>
                {isCurrent && <LinearGradient colors={[color + '30', 'transparent']} style={StyleSheet.absoluteFillObject} />}
                <Text style={{ fontSize: 22, fontWeight: '900', color }}>{pyN}</Text>
                <Text style={{ fontSize: 10, color: isLight ? '#888' : '#999', marginTop: 2, fontWeight: '500' }}>{year}</Text>
                {isCurrent && <Text style={{ fontSize: 8, color, fontWeight: '700', letterSpacing: 0.5, marginTop: 4 }}>{t('numerology.teraz_1', 'TERAZ')}</Text>}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Full 12-month planner */}
        <Divider label={`✦ PLAN MIESIĘCZNY ${currentYear}`} color={pyColor} isLight={isLight} />
        <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 16 }}>
          {fullMonthlyForecast.map((fc, i) => (
            <Animated.View key={fc.month} entering={FadeInDown.delay(i * 30).duration(380)}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, padding: 14, borderRadius: 16, overflow: 'hidden',
                backgroundColor: fc.isNow ? (fc.color + '18') : (fc.isPast ? (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)') : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)')),
                borderWidth: fc.isNow ? 1.5 : 1,
                borderColor: fc.isNow ? fc.color : (isLight ? 'rgba(122,95,54,0.14)' : 'rgba(255,255,255,0.07)'),
              }}>
                {fc.isNow && <LinearGradient colors={[fc.color + '18', 'transparent']} style={StyleSheet.absoluteFillObject} />}
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: fc.color + (fc.isPast ? '14' : '22'), alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: fc.isPast ? fc.color + '88' : fc.color }}>{fc.number}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: fc.isPast ? (isLight ? '#888' : '#888') : (isLight ? '#1A1A1A' : '#F0EBE2') }}>{fc.fullMonth}</Text>
                    {fc.isNow && <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: fc.color }}>
                      <Text style={{ fontSize: 8, color: '#fff', fontWeight: '700' }}>{t('numerology.teraz_2', 'TERAZ')}</Text>
                    </View>}
                  </View>
                  <Text style={{ fontSize: 11, color: fc.color + (fc.isPast ? '88' : 'FF'), fontWeight: '600', marginBottom: 3 }}>{fc.name}</Text>
                  <Text style={{ fontSize: 11, color: fc.isPast ? (isLight ? '#AAA' : '#666') : (isLight ? '#555' : '#A0998F'), lineHeight: 16 }} numberOfLines={2}>{fc.desc}</Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Planetary ruler */}
        {(() => {
          const PLANETARY_RULERS: Record<number, { planet: string; element: string; color: string; quality: string; challenge: string; ritual: string }> = {
            1:  { planet:'Słońce',       element:'Ogień',     color:'#F59E0B', quality:'Wola, tożsamość i odwaga do bycia pierwszym',             challenge:'Nadmierne ego i niecierpliwość wobec innych',    ritual:'Medytacja w świetle słońca — ładuj wolę o poranku' },
            2:  { planet:'Księżyc',      element:'Woda',      color:'#93C5FD', quality:'Intuicja, współpraca i emocjonalna głębia relacji',        challenge:'Nadwrażliwość i trudność w podejmowaniu decyzji', ritual:'Rytuał przy pełni księżyca — intencja harmonii'     },
            3:  { planet:'Jowisz',       element:'Ogień',     color:'#A78BFA', quality:'Ekspansja, optymizm i dar do inspirowania innych',         challenge:'Rozproszenie energii i nieskończone zaczynanie',  ritual:'Ołtarz kreatywności z jasnym cytrinem'              },
            4:  { planet:'Uran',         element:'Powietrze', color:'#60A5FA', quality:'Innowacja, struktura i trwałe fundamenty',                  challenge:'Sztywność i opór wobec koniecznych zmian',       ritual:'Praca z ziemią — ogrodnictwo lub praca fizyczna'    },
            5:  { planet:'Merkury',      element:'Powietrze', color:'#34D399', quality:'Komunikacja, zmiana i szybkie przyswajanie wiedzy',         challenge:'Rozterkowanie i brak zakorzenienia w jednym',    ritual:'Dziennik podróży — dokumentuj każde nowe doświadczenie' },
            6:  { planet:'Wenus',        element:'Ziemia',    color:'#F9A8D4', quality:'Miłość, piękno, harmonia domowa i troskliwość',             challenge:'Poświęcanie własnych potrzeb dla innych',        ritual:'Rytuał z różami i różowym kwarcem — otwieranie serca' },
            7:  { planet:'Neptun',       element:'Woda',      color:'#818CF8', quality:'Duchowość, intuicja mistyczna i głęboka analiza',           challenge:'Oderwanie od rzeczywistości i izolacja',         ritual:'Medytacja ciszy — 20 minut dziennie bez bodźców'    },
            8:  { planet:'Saturn',       element:'Ziemia',    color:'#78716C', quality:'Sprawczość, karma i materializacja przez dyscyplinę',       challenge:'Kontrola i perfekcjonizm blokujący przepływ',    ritual:'Rytuał intencji finansowej z tygrysim okiem'        },
            9:  { planet:'Mars',         element:'Ogień',     color:'#F87171', quality:'Odwaga do zakończeń, mądrość i humanitaryzm',               challenge:'Trzymanie się tego, co już minęło',              ritual:'Rytuał ogniowy uwalniania — spalanie symboliczne'   },
            11: { planet:'Uran/Neptun',  element:'Eter',      color:'#C4B5FD', quality:'Mistrzowska intuicja i duchowe przesłanie dla innych',      challenge:'Przeciążenie wrażliwością bez granic energetycznych', ritual:'Oczyszczanie pola — selenitowa różdżka i oddech'  },
            22: { planet:'Pluton',       element:'Eter',      color:'#6D28D9', quality:'Transformacja przez materializację wielkiej wizji',          challenge:'Marnowanie potencjału przez myślenie za małe',   ritual:'Wizualizacja dziedzictwa — co budujesz dla przyszłości?' },
          };
          const ruler = PLANETARY_RULERS[personalYear] ?? PLANETARY_RULERS[1];
          return (
            <>
              <Divider label={t('numerology.wladca_planetarny_roku', '✦ WŁADCA PLANETARNY ROKU')} color={ruler.color} isLight={isLight} />
              <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 20 }}>
                <View style={{ borderRadius: 20, padding: 18, overflow: 'hidden', borderWidth: 1.5, borderColor: ruler.color + '55', backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)' }}>
                  <LinearGradient colors={[ruler.color + '22', 'transparent']} style={StyleSheet.absoluteFillObject} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: ruler.color + '22', borderWidth: 2, borderColor: ruler.color + '55', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 28 }}>☽</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 9, color: ruler.color, fontWeight: '700', letterSpacing: 2, marginBottom: 3 }}>WŁADCA ROKU {currentYear}</Text>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: isLight ? '#1A1A1A' : '#F0EBE2' }}>{ruler.planet}</Text>
                      <Text style={{ fontSize: 12, color: ruler.color, fontWeight: '600', marginTop: 2 }}>Żywioł: {ruler.element}</Text>
                    </View>
                  </View>
                  <View style={{ gap: 10 }}>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                      <Text style={{ fontSize: 13, color: ruler.color, fontWeight: '700', width: 20 }}>✦</Text>
                      <Text style={{ fontSize: 13, color: isLight ? '#2A2A2A' : '#E0D8D0', lineHeight: 20, flex: 1 }}>{ruler.quality}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                      <Text style={{ fontSize: 13, color: '#F87171', fontWeight: '700', width: 20 }}>⚠</Text>
                      <Text style={{ fontSize: 12, color: isLight ? '#888' : '#B0A393', lineHeight: 20, flex: 1 }}>{ruler.challenge}</Text>
                    </View>
                    <View style={{ borderRadius: 12, padding: 12, backgroundColor: ruler.color + '14', borderWidth: 1, borderColor: ruler.color + '33', marginTop: 4 }}>
                      <Text style={{ fontSize: 9, color: ruler.color, fontWeight: '700', letterSpacing: 1.2, marginBottom: 5 }}>{t('numerology.rytual_roku', 'RYTUAŁ ROKU')}</Text>
                      <Text style={{ fontSize: 13, color: isLight ? '#1A1A1A' : '#F0EBE2', lineHeight: 20, fontStyle: 'italic' }}>{ruler.ritual}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          );
        })()}

        {/* Power days of the year */}
        {(() => {
          const today2 = new Date();
          const powerDays: Array<{ date: Date; personalDay: number; label: string; energy: string }> = [];
          const POWER_NUMBERS = new Set([personalYear, 8, 11, 1]);
          const POWER_DAY_DESC: Record<number, string> = {
            1:'Dzień inicjatywy — zacznij coś nowego lub podejmij ważną decyzję',
            8:'Dzień sprawczości — idealne warunki do działań finansowych i liderskich',
            11:'Dzień mistyczny — wzmożona intuicja i przebudzenie duchowe',
          };
          const PERSONAL_YEAR_POWER: Record<number, string> = {
            1:'Czas na inicjatywę zgodną z Twoim głównym tematem roku',
            2:'Czas na budowanie relacji i dyplomatyczne działania',
            3:'Czas na ekspresję i twórcze projekty',
            4:'Czas na planowanie i systematyczne działanie',
            5:'Czas na nowe doświadczenia i przełamanie rutyny',
            6:'Czas na troskę o bliskich i harmonię w domu',
            7:'Czas na refleksję i duchową praktykę',
            8:'Czas na manifestację i działania materialne',
            9:'Czas na zamknięcia i uwalnianie tego, co przeszłe',
            11:'Czas na kanalizowanie intuicji i inspirowanie innych',
            22:'Czas na wielkie decyzje i budowanie dziedzictwa',
          };
          // Find next 6 power days from today
          for (let d = 0; powerDays.length < 6 && d < 90; d++) {
            const dt = new Date(today2);
            dt.setDate(dt.getDate() + d + 1);
            const dayNum = dt.getDate();
            const monthNum = dt.getMonth() + 1;
            let pd = dayNum + monthNum + personalYear;
            while (pd > 22) { pd = String(pd).split('').reduce((s, c) => s + parseInt(c), 0); }
            if (pd === 11 || pd === 22) { /* keep master */ } else { while (pd > 9) { pd = String(pd).split('').reduce((s, c) => s + parseInt(c), 0); } }
            if (POWER_NUMBERS.has(pd)) {
              const label = pd === personalYear
                ? (PERSONAL_YEAR_POWER[personalYear] ?? 'Dzień mocy roku')
                : (POWER_DAY_DESC[pd] ?? 'Dzień wzmożonej energii');
              powerDays.push({ date: dt, personalDay: pd, label, energy: pd === 11 ? '#C4B5FD' : pd === 8 ? '#FBBF24' : pd === 1 ? '#F59E0B' : pyColor });
            }
          }
          if (powerDays.length === 0) return null;
          return (
            <>
              <Divider label={`✦ NADCHODZĄCE DNI MOCY`} color={pyColor} isLight={isLight} />
              <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 20 }}>
                <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 14 }}>
                  {t('numerology.dni_kiedy_twoja_liczba_osobista', 'Dni, kiedy Twoja liczba osobista (dzień + miesiąc + rok osobisty) rezonuje z kluczowymi częstotliwościami. To momenty wzmożonej synchroniczności.')}
                </Text>
                <View style={{ gap: 8 }}>
                  {powerDays.map((pd, i) => (
                    <Animated.View key={i} entering={FadeInDown.delay(i * 40).duration(380)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, overflow: 'hidden',
                        backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)',
                        borderWidth: 1, borderColor: pd.energy + '44' }}>
                        <LinearGradient colors={[pd.energy + '14', 'transparent']} style={StyleSheet.absoluteFillObject} />
                        <View style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: pd.energy + '22', borderWidth: 2, borderColor: pd.energy + '55', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <Text style={{ fontSize: 18, fontWeight: '900', color: pd.energy }}>{pd.personalDay}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: isLight ? '#1A1A1A' : '#F0EBE2' }}>
                            {pd.date.toLocaleDateString(getLocaleCode(), { weekday: 'long', day: 'numeric', month: 'long' })}
                          </Text>
                          <Text style={{ fontSize: 11, color: subColor, lineHeight: 16, marginTop: 2 }}>{pd.label}</Text>
                        </View>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </View>
            </>
          );
        })()}

        {/* Manifestation focus */}
        {(() => {
          const MANIFESTATION_AREAS: Record<number, Array<{ area: string; focus: string; block: string }>> = {
            1:  [{ area:'Kariera i tożsamość', focus:'Zainicjuj projekt, który niesie Twoje własne imię', block:'Czekanie na gotowość lub zgodę innych' }, { area:'Relacje', focus:'Ustal, czego naprawdę chcesz w bliskości — i powiedz to wprost', block:'Odgrywanie ról, zamiast bycia sobą' }, { area:'Finanse', focus:'Pierwsze samodzielne działanie finansowe — inwestycja lub decyzja', block:'Brak wiary, że potrafisz samodzielnie' }],
            2:  [{ area:'Kariera', focus:'Znajdź partnera lub mentora, z którym zbudujesz coś razem', block:'Próba robienia wszystkiego solo' }, { area:'Relacje', focus:'Zainwestuj w jakość, nie ilość — jeden głęboki związek', block:'Rozproszenie uwagi na wiele powierzchownych kontaktów' }, { area:'Finanse', focus:'Wspólne inwestycje lub oszczędzanie z partnerem', block:'Brak zaufania w finansowych decyzjach' }],
            3:  [{ area:'Kariera', focus:'Twórczy projekt z Twoim głosem — pisanie, mówienie, tworzenie', block:'Perfekcjonizm blokujący publikację' }, { area:'Relacje', focus:'Wyrażaj miłość głośno i kreatywnie', block:'Milczenie o potrzebach emocjonalnych' }, { area:'Finanse', focus:'Monetyzacja talentów twórczych', block:'Niedocenianie wartości własnej kreatywności' }],
            4:  [{ area:'Kariera', focus:'System, który zastąpi chaos — CRM, rutyna, harmonogram', block:'Odkładanie bo "nie ma czasu"' }, { area:'Relacje', focus:'Buduj trwałe zaufanie przez konsekwentne działanie', block:'Obietnice niespełniane w terminie' }, { area:'Finanse', focus:'Plan oszczędnościowy z miesięcznym budżetem', block:'Impulsywne wydatki bez planu' }],
            5:  [{ area:'Kariera', focus:'Nowy kierunek, środowisko lub branża — ryzyko przynosi nagrodę', block:'Przywiązanie do "tak zawsze było"' }, { area:'Relacje', focus:'Wolność w bliskości — bliskie bez więzienia', block:'Duszenie siebie lub partnera' }, { area:'Finanse', focus:'Zdywersyfikuj przychody — nie polegaj na jednym źródle', block:'Strach przed nieznanym kosztem stabilności' }],
            6:  [{ area:'Kariera', focus:'Praca z misją troski — coaching, edukacja, opieka, design', block:'Zaniedbywanie własnych potrzeb przez pomoc innym' }, { area:'Relacje', focus:'Dom jako sanktuarium — twórz piękną, spokojną przestrzeń', block:'Drobiazgowość i potrzeba kontroli bliskich' }, { area:'Finanse', focus:'Inwestycja w dom, zdrowie lub estetykę przestrzeni', block:'Wydawanie na innych kosztem własnych rezerw' }],
            7:  [{ area:'Kariera', focus:'Badanie, specjalizacja, pogłębianie wiedzy w jednej dziedzinie', block:'Brak działania bo "jeszcze nie wiem dość"' }, { area:'Relacje', focus:'Autentyczna bliskość bez masek — pozwól się poznać', block:'Emocjonalna izolacja za fasadą kompetencji' }, { area:'Finanse', focus:'Inwestycja w wiedzę i rozwój — kursy, mentoring, narzędzia', block:'Paraliż analityczny przed decyzją finansową' }],
            8:  [{ area:'Kariera', focus:'Przejęcie odpowiedzialności — awans, biznes, liderstwo', block:'Sabotowanie sukcesu przez poczucie niegodności' }, { area:'Relacje', focus:'Równowaga władzy — nie dominuj i nie pozwól dominować', block:'Używanie pieniędzy jako narzędzia kontroli' }, { area:'Finanse', focus:'Konkretny plan pomnażania — inwestycja, firma, nieruchomość', block:'Praca bez wynagrodzenia lub za mało niż wartość' }],
            9:  [{ area:'Kariera', focus:'Zamknij to, co dobiegło końca — zwolnij miejsce', block:'Trzymanie się roli lub projektu po czasie' }, { area:'Relacje', focus:'Przebaczenie i zakończenie niedziałających relacji z miłością', block:'Wleczenie za sobą nieskończonych pretensji' }, { area:'Finanse', focus:'Porządki finansowe — zamknij długi, rozlicz przeszłość', block:'Odkładanie trudnych finansowych rozmów' }],
            11: [{ area:'Kariera', focus:'Twórz z inspiracji — Twoja wrażliwość to supermoc', block:'Lekceważenie własnej intuicji pod wpływem logiki innych' }, { area:'Relacje', focus:'Bliskie z podobną duchowością i wrażliwością', block:'Emocjonalne przeciążenie przez absorpcję cudzych stanów' }, { area:'Finanse', focus:'Zarabianie przez sharing wartości i duchowego przesłania', block:'Blokada "pieniądze są złe" sabotująca obfitość' }],
            22: [{ area:'Kariera', focus:'Buduj strukturę, która przeżyje Cię — firma, fundacja, projekt', block:'Myślenie za małe i niedocenianie własnego potencjału' }, { area:'Relacje', focus:'Partnerstwo jak firma — wspólna wizja i podział ról', block:'Zaniedbywanie relacji przez pochłonięcie wielką misją' }, { area:'Finanse', focus:'Długoterminowe inwestycje i budowanie majątku dla pokoleń', block:'Brak planu po osiągnięciu celu — stagnacja sukcesu' }],
          };
          const areas = MANIFESTATION_AREAS[personalYear] ?? MANIFESTATION_AREAS[1];
          const AREA_COLORS = ['#A78BFA', '#34D399', '#FBBF24'];
          return (
            <>
              <Divider label={t('numerology.fokus_manifestac_roku', '✦ FOKUS MANIFESTACYJNY ROKU')} color={pyColor} isLight={isLight} />
              <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 20 }}>
                <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 14 }}>Trzy główne obszary, w których energia roku {personalYear} najsilniej wspiera manifestację Twoich intencji.</Text>
                <View style={{ gap: 10 }}>
                  {areas.map((a, i) => (
                    <Animated.View key={a.area} entering={FadeInDown.delay(i * 60).duration(400)}>
                      <View style={{ borderRadius: 18, padding: 16, overflow: 'hidden', borderWidth: 1, borderColor: AREA_COLORS[i] + '44',
                        backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)' }}>
                        <LinearGradient colors={[AREA_COLORS[i] + '18', 'transparent']} style={StyleSheet.absoluteFillObject} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: AREA_COLORS[i] + '22', borderWidth: 1.5, borderColor: AREA_COLORS[i] + '55', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 13, fontWeight: '900', color: AREA_COLORS[i] }}>{i + 1}</Text>
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: AREA_COLORS[i], letterSpacing: 0.3 }}>{a.area}</Text>
                        </View>
                        <View style={{ marginBottom: 8 }}>
                          <Text style={{ fontSize: 9, color: AREA_COLORS[i], fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 }}>{t('numerology.dzialaj', '✦ DZIAŁAJ')}</Text>
                          <Text style={{ fontSize: 13, color: isLight ? '#2A2A2A' : '#E0D8D0', lineHeight: 20 }}>{a.focus}</Text>
                        </View>
                        <View style={{ borderTopWidth: 1, borderTopColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.06)', paddingTop: 8 }}>
                          <Text style={{ fontSize: 9, color: '#F87171', fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 }}>{t('numerology.blokada', '⚠ BLOKADA')}</Text>
                          <Text style={{ fontSize: 12, color: subColor, lineHeight: 18 }}>{a.block}</Text>
                        </View>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </View>
            </>
          );
        })()}

      </Animated.View>
    );
  };

  const renderAnaliza = () => (
    <Animated.View entering={FadeInDown.duration(400)}>
      {/* Kosmogram */}
      <Divider label={t('numerology.kosmogram_liczbowy', '✦ KOSMOGRAM LICZBOWY')} color="#60A5FA" isLight={isLight} />
      <View style={{ paddingHorizontal: layout.padding.screen }}>
        <Text style={{ fontSize: 12, color: subColor, textAlign: 'center', marginBottom: 14, lineHeight: 18 }}>
          {t('numerology.liczby_z_daty_urodzenia_na', 'Liczby z daty urodzenia na siatce Pitagorasa. Silne pozycje to energie naturalne — brakujące to główne lekcje.')}
        </Text>
        <View style={{ borderRadius: 20, padding: 18, backgroundColor: cardBg, borderWidth: 1, borderColor: '#60A5FA33', overflow: 'hidden', alignItems: 'center', marginBottom: 14 }}>
          <LinearGradient colors={['#60A5FA14', 'transparent']} style={StyleSheet.absoluteFillObject} />
          <KosmogramGrid birthDate={activeBirthDate} accent="#60A5FA" isLight={isLight} />
        </View>

        {/* Letter analysis */}
        <Divider label={t('numerology.analiza_imienia_literowego', '✦ ANALIZA IMIENIA LITEROWEGO')} color="#34D399" isLight={isLight} />
        <View style={{ borderRadius: 18, padding: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: '#34D39933', overflow: 'hidden' }}>
          <LinearGradient colors={['#34D39914', 'transparent']} style={StyleSheet.absoluteFillObject} />
          <Text style={{ fontSize: 11, color: subColor, lineHeight: 18, marginBottom: 12 }}>
            {t('numerology.kazda_litera_twojego_imienia_niesie', 'Każda litera Twojego imienia niesie liczbę Pitagorasa (V=samogłoska, C=spółgłoska). Suma samogłosek = Poryw Duszy. Suma spółgłosek = Osobowość.')}
          </Text>
          <View style={[styles.nameInput, { backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.07)', borderColor: '#34D39944', marginBottom: 12 }]}>
            <Hash color="#34D399" size={16} strokeWidth={1.8} style={{ marginRight: 10 }} />
            <TextInput
              value={analysisName}
              onChangeText={setAnalysisName}
              placeholder={activeName || 'Wpisz pełne imię i nazwisko...'}
              placeholderTextColor={subColor}
              style={{ flex: 1, color: textColor, fontSize: 15, paddingVertical: 0 }}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>
          {(analysisName.trim() || activeName) && (
            <Animated.View entering={FadeInDown.duration(350)}>
              <LetterRow name={analysisName.trim() || activeName} isLight={isLight} />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                {[
                  { label: 'Wyraz', num: calcExpressionNumber(analysisName.trim() || activeName), color: '#34D399', desc: 'Suma wszystkich liter' },
                  { label: 'Dusza', num: calcSoulUrge(analysisName.trim() || activeName), color: '#F472B6', desc: 'Suma samogłosek' },
                  { label: 'Osobowość', num: calcPersonality(analysisName.trim() || activeName), color: '#FBBF24', desc: 'Suma spółgłosek' },
                ].map(({ label, num, color, desc }) => num > 0 ? (
                  <View key={label} style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: color + '20', borderWidth: 1, borderColor: color + '55', alignItems: 'center' }}>
                    <NumberGlowBadge value={num} size={40} isLight={isLight} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color, marginTop: 6 }}>{label}</Text>
                    <Text style={{ fontSize: 9, color: subColor, marginTop: 2, textAlign: 'center' }}>{desc}</Text>
                  </View>
                ) : null)}
              </View>
            </Animated.View>
          )}
        </View>

        {/* Guide */}
        <View style={{ paddingTop: 24, paddingBottom: 4 }}>
          <Typography variant="microLabel" color={currentTheme.primary} style={{ letterSpacing: 1.5, marginBottom: 12 }}>{t('numerology.jak_czytac_te_mape', '✦ JAK CZYTAĆ TĘ MAPĘ')}</Typography>
          {[
            { label: 'Droga Życia', copy: 'Fundament tożsamości — rdzeń, który rozwijasz przez całe życie.' },
            { label: 'Wyraz', copy: 'Talent i misja — to, co wnosisz w świat poprzez swoje działania.' },
            { label: 'Dusza', copy: 'Głębokie pragnienie serca — czego naprawdę potrzebujesz.' },
            { label: 'Osobowość', copy: 'Zewnętrzna maska — jak Cię postrzegają inni zanim Cię poznają.' },
            { label: 'Dojrzałość', copy: 'Kim staniesz się po 45-tce — kumulacja drogi i talentu.' },
            { label: 'Balans', copy: 'Twoja kotwica emocjonalna — strategia na kryzysy i wyzwania.' },
            { label: 'Pinnakl', copy: 'Aktualny sezon duszy — dominująca energia etapu życia.' },
            { label: 'Rok osobisty', copy: 'Ton roku — ekspansja, integracja lub zamknięcie cyklu.' },
          ].map(({ label, copy }, i, arr) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.07)' }}>
              <View style={{ width: 96 }}>
                <Typography variant="microLabel" color={currentTheme.primary}>{label}</Typography>
              </View>
              <Typography variant="bodySmall" style={{ flex: 1, color: subColor, lineHeight: 20 }}>{copy}</Typography>
            </View>
          ))}
        </View>

        {/* Next steps */}
        <View style={{ height: 1, backgroundColor: isLight ? 'rgba(255,246,230,0.95)' : 'rgba(255,255,255,0.06)', marginVertical: 16 }} />
        <Typography variant="microLabel" color={currentTheme.primary} style={{ letterSpacing: 1.5, marginBottom: 8 }}>{t('numerology.nastepne_kroki', '🌿 NASTĘPNE KROKI')}</Typography>
        {[
          { icon: Brain, color: '#60A5FA', label: 'Notatka refleksyjna', desc: 'Zapisz, która liczba pracuje dziś najmocniej', onPress: () => navigation.navigate('JournalEntry', { prompt: `Moja droga życia to ${lifePath}. Aktywny pinnakl: ${activePinnacle?.number || '?'}. Co teraz pracuje u mnie najmocniej?`, type: 'reflection' }) },
          { icon: HeartHandshake, color: '#F472B6', label: 'Zgodność numerologiczna', desc: 'Zestawiaj liczby z emocjonalnym obrazem relacji', onPress: () => navigation.navigate('Compatibility') },
          { icon: ArrowRight, color: currentTheme.primary, label: 'Udostępnij mapę liczb', desc: 'Wyślij elegancki skrót swojej numerologii', onPress: handleShare },
        ].map(({ icon: Icon, color, label, desc, onPress }, idx, arr) => (
          <Pressable key={label} onPress={onPress} style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center',
            paddingVertical: 14,
            opacity: pressed ? 0.7 : 1,
            borderBottomWidth: idx < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
            borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.08)',
          })}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Icon color={color} size={18} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="label" style={{ fontWeight: '600', color: textColor }}>{label}</Typography>
              <Typography variant="bodySmall" style={{ marginTop: 1, color: subColor }}>{desc}</Typography>
            </View>
            <ArrowRight color={isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'} size={16} strokeWidth={1.5} />
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#FAF6EE' : '#030209' }]}>
      <NumerologyBackground isLight={isLight} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0}
          style={styles.safeArea}
        >
          {/* ── Header ───────────────────────────────────── */}
          <View style={styles.header}>
            <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn} hitSlop={20}>
              <ChevronLeft color={currentTheme.primary} size={28} />
            </Pressable>
            <View style={styles.headerTitle}>
              <Typography variant="premiumLabel" color={currentTheme.primary}>{t('numerology.numerologi_1', 'Numerologia')}</Typography>
              <Typography variant="screenTitle" style={{ marginTop: 2 }}>{t('numerology.mapa_liczb_i_cykli_zycia', 'Mapa liczb i cykli życia')}</Typography>
            </View>
            <Pressable onPress={() => setShowForSomeoneModal(true)} style={styles.headerBtn} hitSlop={12}>
              <Users
                color={forSomeone ? currentTheme.primary : currentTheme.primary + '55'}
                size={18}
                strokeWidth={1.8}
                fill={forSomeone ? currentTheme.primary + '33' : 'none'}
              />
            </Pressable>
            <Pressable
              onPress={() => { if (isFavoriteItem('numerology')) { removeFavoriteItem('numerology'); } else { addFavoriteItem({ id: 'numerology', label: 'Numerologia', route: 'Numerology', params: {}, icon: 'Binary', color: currentTheme.primary, addedAt: new Date().toISOString() }); } }}
              style={styles.headerBtn}
              hitSlop={12}
            >
              <Star
                color={isFavoriteItem('numerology') ? currentTheme.primary : currentTheme.primary + '88'}
                size={18}
                strokeWidth={1.8}
                fill={isFavoriteItem('numerology') ? currentTheme.primary : 'none'}
              />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            {/* For someone banner */}
            {forSomeone && (
              <View style={[styles.forSomeoneBanner, { backgroundColor: currentTheme.primary + '18', borderColor: currentTheme.primary + '33' }]}>
                <Users color={currentTheme.primary} size={13} strokeWidth={1.8} />
                <Typography variant="microLabel" color={currentTheme.primary} style={{ marginLeft: 6 }}>Numerologia dla: {forSomeoneName}</Typography>
                <Pressable onPress={() => setForSomeone(false)} style={{ marginLeft: 8 }} hitSlop={8}>
                  <Text style={{ fontSize: 11, color: currentTheme.primary + 'CC' }}>✕</Text>
                </Pressable>
              </View>
            )}

            {/* ── Sprawdź swoją liczbę CTA ─────────────── */}
            <Pressable
              onPress={() => navigation.navigate('NumerologyDetail')}
              style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1, marginHorizontal: layout.padding.screen, marginBottom: 16, borderRadius: 18, overflow: 'hidden' })}
            >
              <LinearGradient
                colors={['#CEAE72', '#E8C97A', '#CEAE72']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 17, paddingHorizontal: 24, gap: 12 }}
              >
                <Infinity color="#1A1200" size={20} strokeWidth={2.2} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', letterSpacing: 1.5, color: '#1A1200' }}>{t('numerology.sprawdz_swoja_liczbe_1', 'SPRAWDŹ SWOJĄ LICZBĘ')}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '500', color: 'rgba(0,0,0,0.65)', marginTop: 2, letterSpacing: 0.3 }}>{t('numerology.kalkulator_numerologi_z_odczytem_or', 'Kalkulator numerologiczny z odczytem Oracle')}</Text>
                </View>
                <Infinity color="#1A1200" size={20} strokeWidth={2.2} />
              </LinearGradient>
            </Pressable>

            {/* ── Hub Navigation ─────────────────────────── */}
            <View style={{ marginBottom: 4 }}>
              {[
                { icon: Orbit, color: '#A78BFA', label: 'Matryca losu', desc: 'Twoja mapa życiowych wzorców i osi', onPress: () => navigation.navigate('Matrix') },
                { icon: HeartHandshake, color: '#F472B6', label: 'Partner numerologiczny', desc: 'Zgodność i dynamika w relacji', onPress: () => navigation.navigate('PartnerMatrix') },
                { icon: Star, color: '#FBBF24', label: 'Astrologia i liczby', desc: 'Połącz cykle numeryczne z mapą nieba', onPress: () => navigation.navigate('Stars') },
                { icon: Brain, color: '#60A5FA', label: 'Oracle numerologiczny', desc: 'Zapytaj AI o konkretną liczbę i ruch', onPress: () => navigation.navigate('OracleChat', { source: 'numerology', initialMode: 'growth' }) },
              ].map(({ icon: Icon, color, label, desc, onPress }, idx, arr) => (
                <Pressable key={label} onPress={onPress} style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 13, paddingHorizontal: layout.padding.screen,
                  opacity: pressed ? 0.7 : 1,
                  borderBottomWidth: idx < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.08)',
                })}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Icon color={color} size={18} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="label" style={{ fontWeight: '600', color: textColor }}>{label}</Typography>
                    <Typography variant="bodySmall" style={{ marginTop: 1, color: subColor }}>{desc}</Typography>
                  </View>
                  <ArrowRight color={isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'} size={16} strokeWidth={1.5} />
                </Pressable>
              ))}
            </View>

            <View style={{ height: 1, backgroundColor: isLight ? 'rgba(255,246,230,0.95)' : 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

            {/* ── Section tabs ─────────────────────────────── */}
            <SectionTabBar active={activeSection} onSelect={setActiveSection} accent={currentTheme.primary} isLight={isLight} />

            {/* ── Section content ─────────────────────────── */}
            {activeSection === 'rdzen' && renderRdzen()}
            {activeSection === 'cykle' && renderCykle()}
            {activeSection === 'rokos' && renderRokOs()}
            {activeSection === 'glebsze' && renderGlebsze()}
            {activeSection === 'analiza' && renderAnaliza()}

            <EndOfContentSpacer size="standard" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Date picker for partner */}
      <PremiumDatePickerSheet
        visible={pickerVisible}
        mode="date"
        title={t('numerology.data_urodzenia_tej_osoby', 'Data urodzenia tej osoby')}
        description={t('numerology.numerologi_porowna_drogi_zycia_cent', 'Numerologia porówna drogi życia, centrum i oś relacji.')}
        value={new Date(partnerBirthDate || '1994-06-15')}
        maximumDate={new Date()}
        onCancel={() => setPickerVisible(false)}
        onConfirm={(value) => { setPartnerBirthDate(value.toISOString()); setPickerVisible(false); }}
      />

      {/* For someone modal */}
      <Modal visible={showForSomeoneModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowForSomeoneModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setShowForSomeoneModal(false)}>
          <Pressable onPress={e => e.stopPropagation()} style={[styles.forSomeoneSheet, {
            backgroundColor: currentTheme.backgroundElevated, overflow: 'hidden',
            borderTopColor: currentTheme.primary + '44', borderTopWidth: 1,
            borderLeftColor: currentTheme.primary + '22', borderLeftWidth: 1,
            borderRightColor: currentTheme.primary + '22', borderRightWidth: 1,
          }]}>
            <LinearGradient
              colors={[currentTheme.primary + '18', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: currentTheme.primary + '44', alignSelf: 'center', marginBottom: 18 }} />
            <Typography variant="cardTitle" style={{ color: currentTheme.text, marginBottom: 4 }}>{t('numerology.dla_kogo_ta_sesja', 'Dla kogo ta sesja?')}</Typography>
            <Typography variant="bodySmall" style={{ color: currentTheme.textMuted, marginBottom: 20 }}>
              {t('numerology.wprowadz_dane_osoby_dla_ktorej', 'Wprowadź dane osoby, dla której robisz odczyt. Imię jest potrzebne do obliczenia Wyrazu, Duszy i Osobowości.')}
            </Typography>
            <MysticalInput
              value={forSomeoneName}
              onChangeText={setForSomeoneName}
              placeholder={t('numerology.imie_i_nazwisko_do_analizy', 'Imię i nazwisko (do analizy liter)...')}
              returnKeyType="next"
            />
            <DateWheelPicker
              day={fsDay}
              month={fsMonth}
              year={fsYear}
              onChange={(d, m, y) => {
                setFsDay(d); setFsMonth(m); setFsYear(y);
                const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                setForSomeoneBirth(iso);
              }}
              textColor={textColor}
              accentColor={currentTheme.primary}
              cardBg={cardBg}
            />
            {forSomeone && (
              <Pressable
                onPress={() => { setForSomeone(false); setShowForSomeoneModal(false); }}
                style={[styles.fsCta, { backgroundColor: 'rgba(255,100,100,0.2)', borderColor: '#FB7185', borderWidth: 1, marginTop: 12 }]}
              >
                <Typography variant="caption" style={{ color: '#FB7185', fontWeight: '600' }}>{t('numerology.wylacz_tryb_dla_kogos', 'Wyłącz tryb "Dla kogoś"')}</Typography>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                if (forSomeoneName.trim()) {
                  const iso = `${fsYear}-${String(fsMonth).padStart(2, '0')}-${String(fsDay).padStart(2, '0')}`;
                  setForSomeoneBirth(iso);
                  setForSomeone(true); setShowForSomeoneModal(false); HapticsService.notify();
                }
              }}
              style={[styles.fsCta, { backgroundColor: currentTheme.primary, marginTop: forSomeone ? 10 : 16 }]}
            >
              <Typography variant="caption" style={{ color: '#FFF', fontWeight: '700' }}>{t('numerology.potwierdz', 'Potwierdź')}</Typography>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    height: 80, paddingHorizontal: layout.padding.screen, paddingTop: 8,
  },
  backBtn: { width: 40 },
  headerBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, alignItems: 'center' },
  scrollContent: { flexGrow: 1, paddingTop: 6 },
  emptyState: { flex: 1, justifyContent: 'center', paddingHorizontal: layout.padding.screen },
  emptyAction: {
    marginTop: 24, height: 56, borderRadius: 28,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  partnerDateTrigger: {
    minHeight: 52, borderWidth: 1, borderRadius: 18,
    paddingHorizontal: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  forSomeoneBanner: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    marginBottom: 12, marginHorizontal: layout.padding.screen, borderWidth: 1,
  },
  forSomeoneSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  fsCta: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center' },
  nameInput: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
});
