// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
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
  Circle, G, Line, Path, Rect, Text as SvgText,
  Defs, RadialGradient, Stop, Ellipse,
} from 'react-native-svg';
import Animated, {
  FadeInDown, FadeIn,
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withTiming, withSpring, withSequence,
  Easing, interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Clock, Moon, Sun, Zap, Hash,
  Calendar, ArrowRight, Sparkles, AlertTriangle,
  Send, Bot, ChevronDown, ChevronUp,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { AiService } from '../core/services/ai.service';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { formatLocaleDate } from '../core/utils/localeFormat';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#FBBF24';

// ── ANIMOWANY SVG ─────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

// ── POMOCNICZE OBLICZENIA NUMEROLOGICZNE ──────────────────────

function reduceToSingle(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce((a, d) => a + parseInt(d), 0);
  }
  return n;
}

function getPersonalDay(birthDate: string | undefined, today?: Date): number {
  const d = today || new Date();
  const [y, m, day] = birthDate
    ? birthDate.split('-').map(Number)
    : [1990, 1, 1];
  const sum = reduceToSingle(
    (m || 1) + (day || 1) + reduceToSingle(d.getMonth() + 1) + reduceToSingle(d.getDate()) + reduceToSingle(d.getFullYear()),
  );
  return reduceToSingle(sum);
}

function getPersonalMonth(birthDate: string | undefined, today?: Date): number {
  const d = today || new Date();
  const [, bm = 1] = birthDate ? birthDate.split('-').map(Number) : [1990, 1, 1];
  return reduceToSingle(reduceToSingle(bm) + reduceToSingle(d.getMonth() + 1) + reduceToSingle(d.getFullYear()));
}

function getPersonalYear(birthDate: string | undefined, today?: Date): number {
  const d = today || new Date();
  const [, bm = 1, bday = 1] = birthDate ? birthDate.split('-').map(Number) : [1990, 1, 1];
  return reduceToSingle(reduceToSingle(bm) + reduceToSingle(bday) + reduceToSingle(d.getFullYear()));
}

function getLifePath(birthDate: string | undefined): number {
  if (!birthDate) return 1;
  const [y, m, d] = birthDate.split('-').map(Number);
  return reduceToSingle(reduceToSingle(y) + reduceToSingle(m) + reduceToSingle(d));
}

// ── FAZA KSIĘŻYCA ─────────────────────────────────────────────
function getMoonPhase(date: Date): { phase: number; name: string; icon: string } {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const raw = ((jd - 2451550.1) / 29.530588861) % 1;
  const phase = raw < 0 ? raw + 1 : raw;
  if (phase < 0.04 || phase > 0.96) return { phase, name: 'Nów', icon: '🌑' };
  if (phase < 0.23) return { phase, name: 'Sierp rosnący', icon: '🌒' };
  if (phase < 0.27) return { phase, name: 'Pierwsza kwadra', icon: '🌓' };
  if (phase < 0.48) return { phase, name: 'Narastający', icon: '🌔' };
  if (phase < 0.52) return { phase, name: 'Pełnia', icon: '🌕' };
  if (phase < 0.73) return { phase, name: 'Ubywający', icon: '🌖' };
  if (phase < 0.77) return { phase, name: 'Ostatnia kwadra', icon: '🌗' };
  return { phase, name: 'Malejący sierp', icon: '🌘' };
}

function getMoonSign(date: Date): { sign: string; element: string } {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const idx = Math.floor(((jd - 2451550.1) / 2.3) % 12 + 12) % 12;
  const signs = [
    { sign: 'Baran', element: 'Ogień' }, { sign: 'Byk', element: 'Ziemia' },
    { sign: 'Bliźnięta', element: 'Powietrze' }, { sign: 'Rak', element: 'Woda' },
    { sign: 'Lew', element: 'Ogień' }, { sign: 'Panna', element: 'Ziemia' },
    { sign: 'Waga', element: 'Powietrze' }, { sign: 'Skorpion', element: 'Woda' },
    { sign: 'Strzelec', element: 'Ogień' }, { sign: 'Koziorożec', element: 'Ziemia' },
    { sign: 'Wodnik', element: 'Powietrze' }, { sign: 'Ryby', element: 'Woda' },
  ];
  return signs[idx];
}

// ── GODZINY PLANETARNE ────────────────────────────────────────
const PLANET_SEQUENCE = ['Saturn', 'Słońce', 'Księżyc', 'Mars', 'Merkury', 'Jowisz', 'Wenus'];
const DAY_RULERS = ['Słońce', 'Księżyc', 'Mars', 'Merkury', 'Jowisz', 'Wenus', 'Saturn']; // Sun=0 Mon=1…

function getPlanetaryHour(date: Date): { planet: string; color: string; activity: string } {
  const dayRulerIdx = date.getDay(); // 0=Sun
  const startIdx = PLANET_SEQUENCE.indexOf(DAY_RULERS[dayRulerIdx]);
  const hourOfDay = date.getHours();
  const planetIdx = (startIdx + hourOfDay) % 7;
  const planet = PLANET_SEQUENCE[planetIdx];
  const info: Record<string, { color: string; activity: string }> = {
    'Słońce':  { color: '#F59E0B', activity: 'Inicjatywa, liderstwo, widoczność' },
    'Księżyc': { color: '#A78BFA', activity: 'Intuicja, emocje, domowe sprawy' },
    'Mars':    { color: '#EF4444', activity: 'Energia, konflikt, sport, odwaga' },
    'Merkury': { color: '#34D399', activity: 'Komunikacja, pisanie, nauka, umowy' },
    'Jowisz':  { color: '#F97316', activity: 'Ekspansja, szczęście, podróże, prawo' },
    'Wenus':   { color: '#F472B6', activity: 'Miłość, sztuka, piękno, finanse' },
    'Saturn':  { color: '#64748B', activity: 'Struktura, praca, dyscyplina, karma' },
  };
  return { planet, ...info[planet] };
}

interface PlanetHourSlot {
  hour: number;
  planet: string;
  color: string;
  activity: string;
  score: number;
}

function getDayPlanetHours(date: Date): PlanetHourSlot[] {
  const dayRulerIdx = date.getDay();
  const startIdx = PLANET_SEQUENCE.indexOf(DAY_RULERS[dayRulerIdx]);
  const bestPlanets = ['Jowisz', 'Słońce', 'Wenus'];
  const info: Record<string, { color: string; activity: string }> = {
    'Słońce':  { color: '#F59E0B', activity: 'Inicjatywa i liderstwo' },
    'Księżyc': { color: '#A78BFA', activity: 'Intuicja i emocje' },
    'Mars':    { color: '#EF4444', activity: 'Energia i odwaga' },
    'Merkury': { color: '#34D399', activity: 'Komunikacja i umowy' },
    'Jowisz':  { color: '#F97316', activity: 'Szczęście i ekspansja' },
    'Wenus':   { color: '#F472B6', activity: 'Miłość i piękno' },
    'Saturn':  { color: '#64748B', activity: 'Struktura i karma' },
  };
  return Array.from({ length: 24 }, (_, h) => {
    const planetIdx = (startIdx + h) % 7;
    const planet = PLANET_SEQUENCE[planetIdx];
    return {
      hour: h,
      planet,
      score: bestPlanets.includes(planet) ? 8 + Math.floor(Math.random() * 2) : 4 + Math.floor(Math.random() * 3),
      ...info[planet],
    };
  });
}

// ── KOSMICZNY WYNIK ───────────────────────────────────────────
function computeCosmicScore(
  personalDay: number,
  moonPhase: number,
  dayOfWeek: number,
  planetaryHour: string,
): number {
  let score = 5;
  if ([1, 3, 5, 8].includes(personalDay)) score += 1.5;
  if (moonPhase < 0.05 || moonPhase > 0.95) score += 1.2;
  if (moonPhase > 0.47 && moonPhase < 0.53) score += 1.0;
  if (dayOfWeek === 5) score += 0.8;
  if (dayOfWeek === 0 || dayOfWeek === 4) score += 0.5;
  if (['Jowisz', 'Słońce', 'Wenus'].includes(planetaryHour)) score += 0.8;
  return Math.min(10, Math.round(score * 10) / 10);
}

// ── DANE AKCJI ────────────────────────────────────────────────
interface ActionType {
  id: string;
  label: string;
  icon: string;
  conditions: string;
  bestDays: number[];
  bestMoon: string;
  tip: string;
  color: string;
}

const ACTION_TYPES: ActionType[] = [
  {
    id: 'project',
    label: 'Nowy projekt',
    icon: '🚀',
    conditions: 'Nów + liczby 1/5/3',
    bestDays: [0, 1],
    bestMoon: 'Nów',
    tip: 'Nów Księżyca to ideał dla nowych początków. Liczba 1 lub 3 w dniu osobistym wzmacnia inicjatywę.',
    color: '#FBBF24',
  },
  {
    id: 'negotiate',
    label: 'Negocjacje',
    icon: '🤝',
    conditions: 'Merkury bezpośredni + Powietrze',
    bestDays: [3],
    bestMoon: 'Pierwsza kwadra',
    tip: 'Czekaj aż Merkury wyjdzie z retrograda. Księżyc w znaku Powietrza (Waga, Bliźnięta, Wodnik) sprzyja słowom.',
    color: '#34D399',
  },
  {
    id: 'heal',
    label: 'Uzdrowienie',
    icon: '💊',
    conditions: 'Pełnia + Woda',
    bestDays: [1, 5],
    bestMoon: 'Pełnia',
    tip: 'Pełnia Księżyca w znaku Wody (Rak, Skorpion, Ryby) tworzy potężne okno uzdrowienia emocjonalnego.',
    color: '#60A5FA',
  },
  {
    id: 'travel',
    label: 'Podróż',
    icon: '✈️',
    conditions: 'Dzień Jowisza + liczba 3/5/9',
    bestDays: [4],
    bestMoon: 'Narastający',
    tip: 'Czwartek to dzień Jowisza — władcy podróży i szczęścia. Liczby 3, 5 i 9 wzmacniają przygodę.',
    color: '#F97316',
  },
  {
    id: 'relationship',
    label: 'Związek',
    icon: '💕',
    conditions: 'Godzina Wenus + Piątek',
    bestDays: [5],
    bestMoon: 'Sierp rosnący',
    tip: 'Piątek to dzień Wenus. Inicjuj rozmowy lub randki w godzinie Wenus dla dodatkowej harmonii.',
    color: '#F472B6',
  },
  {
    id: 'finance',
    label: 'Finanse',
    icon: '💰',
    conditions: 'Jowisz/Słońce + Ziemia',
    bestDays: [0, 4],
    bestMoon: 'Pierwsza kwadra',
    tip: 'Inwestycje i decyzje finansowe sprzyjają w niedzielę (Słońce) lub czwartek (Jowisz). Księżyc w Bykowi lub Koźlej najlepiej.',
    color: '#D97706',
  },
];

// ── RETROGADY ────────────────────────────────────────────────
const RETROGRADES_DATA = [
  {
    planet: 'Merkury ☿',
    active: false,
    period: '18 lip – 11 sie 2025',
    color: '#F59E0B',
    avoid: ['Podpisywanie umów', 'Ważne rozmowy', 'Zakup elektroniki', 'Nowe projekty komunikacyjne'],
  },
  {
    planet: 'Wenus ♀',
    active: true,
    period: '22 lip – 4 wrz 2025',
    color: '#F472B6',
    avoid: ['Nowe związki', 'Zabiegi kosmetyczne', 'Duże zakupy', 'Ślub lub zaręczyny'],
  },
  {
    planet: 'Mars ♂',
    active: false,
    period: '6 sty – 23 lut 2026',
    color: '#EF4444',
    avoid: ['Nowe projekty siłowe', 'Chirurgia', 'Konfrontacje', 'Zakup samochodu'],
  },
  {
    planet: 'Saturn ♄',
    active: true,
    period: '13 lip – 27 lis 2025',
    color: '#64748B',
    avoid: ['Zakładanie firmy', 'Nowe zobowiązania', 'Ważne strukturalne decyzje'],
  },
];

// ── ZAĆMIENIA ───────────────────────────────────────────────
const ECLIPSES_DATA = [
  {
    type: 'Zaćmienie Słońca',
    date: '29 marca 2025',
    sign: 'Baran ♈',
    icon: '🌑☀️',
    window: '2 tyg. przed i po',
    avoid: ['Ważne podpisania', 'Nowe partnerstwa biznesowe', 'Decyzje długoterminowe', 'Operacje medyczne'],
    energy: 'Nowe początki, tożsamość, inicjatywa — ale z niepewnością. Czas obserwacji.',
    color: '#F59E0B',
  },
  {
    type: 'Zaćmienie Księżyca',
    date: '13 kwietnia 2025',
    sign: 'Waga ♎',
    icon: '🌕🌑',
    window: '2 tyg. przed i po',
    avoid: ['Kłótnie', 'Finalizowanie partnerstw', 'Podpisywanie umów', 'Ostateczne decyzje relacyjne'],
    energy: 'Kulminacja związków i równowagi. Ujawniają się ukryte napięcia. Odpuść to, co przeszłe.',
    color: '#A78BFA',
  },
  {
    type: 'Zaćmienie Słońca',
    date: '21 września 2025',
    sign: 'Panna ♍',
    icon: '🌑☀️',
    window: '2 tyg. przed i po',
    avoid: ['Nowe projekty zdrowotne', 'Ważne zobowiązania zawodowe', 'Diety i protokoły zdrowotne'],
    energy: 'Rewizja codzienności i zdrowia. Czas porządkowania i przygotowania.',
    color: '#34D399',
  },
];

// ── ZODIAC SYMBOLS FOR CLOCK ─────────────────────────────────
const ZODIAC_GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const NUMBER_ENERGIES: Record<number, { keyword: string; color: string }> = {
  1: { keyword: 'Inicjatywa', color: '#F59E0B' },
  2: { keyword: 'Równowaga', color: '#A78BFA' },
  3: { keyword: 'Kreacja', color: '#F472B6' },
  4: { keyword: 'Stabilność', color: '#34D399' },
  5: { keyword: 'Wolność', color: '#60A5FA' },
  6: { keyword: 'Harmonia', color: '#F97316' },
  7: { keyword: 'Mistycyzm', color: '#8B5CF6' },
  8: { keyword: 'Obfitość', color: '#D97706' },
  9: { keyword: 'Mądrość', color: '#EC4899' },
};

// ── KOSMICZNY ZEGAR SVG ───────────────────────────────────────
const CosmicClock = ({ personalDay, moonPhaseIdx, accent }: { personalDay: number; moonPhaseIdx: number; accent: string }) => {
  const outerRot = useSharedValue(0);
  const midRot = useSharedValue(0);
  const innerRot = useSharedValue(0);
  const glowPulse = useSharedValue(0.6);

  useEffect(() => {
    outerRot.value = withRepeat(withTiming(360, { duration: 60000, easing: Easing.linear }), -1, false);
    midRot.value = withRepeat(withTiming(-360, { duration: 40000, easing: Easing.linear }), -1, false);
    innerRot.value = withRepeat(withTiming(360, { duration: 20000, easing: Easing.linear }), -1, false);
    glowPulse.value = withRepeat(withSequence(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      withTiming(0.5, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
    ), -1, false);
  }, []);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${outerRot.value}deg` }],
  }));
  const midStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${midRot.value}deg` }],
  }));
  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${innerRot.value}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const hourAngle = (hours / 12) * 360 + (minutes / 60) * 30 - 90;
  const minuteAngle = (minutes / 60) * 360 - 90;

  const S = 260;
  const CX = S / 2;
  const CY = S / 2;
  const R_OUTER = 118;
  const R_MID = 88;
  const R_INNER = 58;
  const MOON_ICONS = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];

  return (
    <View style={{ width: S, height: S, alignSelf: 'center', marginVertical: 8 }}>
      <Svg width={S} height={S}>
        <Defs>
          <RadialGradient id="cglow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={accent} stopOpacity="0.35" />
            <Stop offset="60%" stopColor={accent} stopOpacity="0.08" />
            <Stop offset="100%" stopColor={accent} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="center" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={accent} stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#B45309" stopOpacity="0.7" />
          </RadialGradient>
        </Defs>
        {/* Ambient glow */}
        <Circle cx={CX} cy={CY} r={130} fill="url(#cglow)" />
        {/* Outer ring track */}
        <Circle cx={CX} cy={CY} r={R_OUTER} stroke={accent + '28'} strokeWidth={22} fill="none" />
        {/* Mid ring track */}
        <Circle cx={CX} cy={CY} r={R_MID} stroke={accent + '1E'} strokeWidth={18} fill="none" />
        {/* Inner ring track */}
        <Circle cx={CX} cy={CY} r={R_INNER} stroke={accent + '18'} strokeWidth={14} fill="none" />
        {/* Tick marks */}
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i * 6 - 90) * Math.PI / 180;
          const r1 = i % 5 === 0 ? R_OUTER + 16 : R_OUTER + 12;
          const r2 = R_OUTER + 24;
          return (
            <Line key={i}
              x1={CX + Math.cos(a) * r1} y1={CY + Math.sin(a) * r1}
              x2={CX + Math.cos(a) * r2} y2={CY + Math.sin(a) * r2}
              stroke={accent + (i % 5 === 0 ? '60' : '28')}
              strokeWidth={i % 5 === 0 ? 1.8 : 0.8}
            />
          );
        })}
      </Svg>

      {/* Outer rotating zodiac ring */}
      <Animated.View style={[StyleSheet.absoluteFill, outerStyle]}>
        <Svg width={S} height={S}>
          {ZODIAC_GLYPHS.map((glyph, i) => {
            const a = (i * 30 - 90) * Math.PI / 180;
            return (
              <SvgText
                key={i}
                x={CX + Math.cos(a) * R_OUTER}
                y={CY + Math.sin(a) * R_OUTER + 5}
                textAnchor="middle"
                fill={accent}
                fontSize={13}
                opacity={0.85}
              >
                {glyph}
              </SvgText>
            );
          })}
        </Svg>
      </Animated.View>

      {/* Mid rotating moon phase ring */}
      <Animated.View style={[StyleSheet.absoluteFill, midStyle]}>
        <Svg width={S} height={S}>
          {MOON_ICONS.map((icon, i) => {
            const a = (i * 45 - 90) * Math.PI / 180;
            return (
              <SvgText
                key={i}
                x={CX + Math.cos(a) * R_MID}
                y={CY + Math.sin(a) * R_MID + 5}
                textAnchor="middle"
                fontSize={14}
                opacity={i === moonPhaseIdx ? 1 : 0.5}
              >
                {icon}
              </SvgText>
            );
          })}
        </Svg>
      </Animated.View>

      {/* Inner rotating numerology ring */}
      <Animated.View style={[StyleSheet.absoluteFill, innerStyle]}>
        <Svg width={S} height={S}>
          {Array.from({ length: 9 }, (_, i) => {
            const num = i + 1;
            const a = (i * 40 - 90) * Math.PI / 180;
            const isActive = num === personalDay;
            return (
              <SvgText
                key={i}
                x={CX + Math.cos(a) * R_INNER}
                y={CY + Math.sin(a) * R_INNER + 5}
                textAnchor="middle"
                fill={NUMBER_ENERGIES[num]?.color || accent}
                fontSize={isActive ? 16 : 12}
                fontWeight={isActive ? 'bold' : 'normal'}
                opacity={isActive ? 1 : 0.55}
              >
                {num}
              </SvgText>
            );
          })}
        </Svg>
      </Animated.View>

      {/* Static clock hands + center */}
      <Svg width={S} height={S} style={StyleSheet.absoluteFill}>
        {/* Hour hand */}
        <G>
          <Path
            d={`M ${CX} ${CY} L ${CX + Math.cos(hourAngle * Math.PI / 180) * 34} ${CY + Math.sin(hourAngle * Math.PI / 180) * 34}`}
            stroke={accent}
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.9}
          />
          <Path
            d={`M ${CX} ${CY} L ${CX + Math.cos(minuteAngle * Math.PI / 180) * 44} ${CY + Math.sin(minuteAngle * Math.PI / 180) * 44}`}
            stroke={accent + 'BB'}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </G>
        {/* Center gem */}
        <Circle cx={CX} cy={CY} r={12} fill="url(#center)" />
        <Circle cx={CX} cy={CY} r={8} fill={accent} opacity={0.9} />
        <Circle cx={CX - 2.5} cy={CY - 2.5} r={2.5} fill="white" opacity={0.6} />
      </Svg>

      {/* Pulse glow overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]} pointerEvents="none">
        <Svg width={S} height={S}>
          <Circle cx={CX} cy={CY} r={16} fill={accent} opacity={0.25} />
        </Svg>
      </Animated.View>
    </View>
  );
};

// ── SCORE BAR ────────────────────────────────────────────────
const ScoreBar = ({ score, accent, isLight }: { score: number; accent: string; isLight: boolean }) => {
  const fillWidth = useSharedValue(0);
  useEffect(() => {
    fillWidth.value = withTiming(score / 10, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [score]);
  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value * 100}%`,
  }));
  return (
    <View style={{ height: 8, backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)', borderRadius: 999, overflow: 'hidden', marginTop: 10 }}>
      <Animated.View style={[{ height: '100%', borderRadius: 999, backgroundColor: accent }, fillStyle]} />
    </View>
  );
};

// ── GŁÓWNY EKRAN ──────────────────────────────────────────────
export const DivineTimingScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const accent = ACCENT;
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.10)';

  const today = useMemo(() => new Date(), []);
  const moonInfo = useMemo(() => getMoonPhase(today), [today]);
  const moonSign = useMemo(() => getMoonSign(today), [today]);
  const personalDay = useMemo(() => getPersonalDay(userData?.birthDate, today), [userData?.birthDate]);
  const personalMonth = useMemo(() => getPersonalMonth(userData?.birthDate, today), [userData?.birthDate]);
  const personalYear = useMemo(() => getPersonalYear(userData?.birthDate, today), [userData?.birthDate]);
  const lifePath = useMemo(() => getLifePath(userData?.birthDate), [userData?.birthDate]);
  const planetaryHourNow = useMemo(() => getPlanetaryHour(today), [today]);
  const dayHours = useMemo(() => getDayPlanetHours(today), [today]);
  const cosmicScore = useMemo(
    () => computeCosmicScore(personalDay, moonInfo.phase, today.getDay(), planetaryHourNow.planet),
    [personalDay, moonInfo.phase, today, planetaryHourNow.planet],
  );

  // Moon phase index for clock
  const moonPhaseIdx = useMemo(() => {
    const ph = moonInfo.phase;
    if (ph < 0.04 || ph > 0.96) return 0;
    if (ph < 0.23) return 1;
    if (ph < 0.27) return 2;
    if (ph < 0.48) return 3;
    if (ph < 0.52) return 4;
    if (ph < 0.73) return 5;
    if (ph < 0.77) return 6;
    return 7;
  }, [moonInfo.phase]);

  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [expandedEclipse, setExpandedEclipse] = useState<number | null>(null);
  const [expandedRetrograde, setExpandedRetrograde] = useState<number | null>(null);
  const [showHourBreakdown, setShowHourBreakdown] = useState(false);

  // AI consultation
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const isFav = isFavoriteItem('divine_timing');

  const handleToggleFav = () => {
    HapticsService.notify();
    if (isFav) {
      removeFavoriteItem('divine_timing');
    } else {
      addFavoriteItem({
        id: 'divine_timing',
        label: 'Boski Rytm',
        sublabel: 'Okna czasowe i numerologia',
        route: 'DivineTiming',
        params: {},
        icon: 'Sparkles',
        color: accent,
        addedAt: new Date().toISOString(),
      });
    }
  };

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse('');
    HapticsService.notify();
    try {
      const birthInfo = userData?.birthDate ? `Data urodzenia: ${userData.birthDate}.` : '';
      const messages = [
        {
          role: 'user' as const,
          content: i18n.language?.startsWith('en')
            ? `You are an expert in divine timing: numerology, astrology and lunar cycles. ${birthInfo} Today: ${formatLocaleDate(today)}. Personal numerology day: ${personalDay}. Moon phase: ${moonInfo.name} in ${moonSign.sign}. Planetary hour: ${planetaryHourNow.planet}. Cosmic score of the day: ${cosmicScore}/10. Answer this question directly: "${aiQuery.trim()}". Give practical guidance on the best timing for this action using the available context. Write in English in 3-5 sentences.`
            : `Jesteś ekspertem od boskiego timingu — numerologii, astrologii i cykli księżycowych. ${birthInfo} Dzisiaj: ${formatLocaleDate(today)}. Dzień osobisty numerologicznie: ${personalDay}. Faza księżyca: ${moonInfo.name} w ${moonSign.sign}. Godzina planetarna: ${planetaryHourNow.planet}. Wynik kosmiczny dnia: ${cosmicScore}/10. Odpowiedz konkretnie na pytanie: "${aiQuery.trim()}". Daj praktyczne wskazówki o najlepszym momencie na tę czynność, uwzględniając dostępne dane. Pisz w języku użytkownika, w 3-5 zdaniach.`,
        },
      ];
      const result = await AiService.chatWithOracle(messages, i18n.language?.startsWith('en') ? 'en' : 'pl');
      setAiResponse(result);
    } catch {
      setAiResponse('Nie udało się skonsultować z Wyrocznią. Spróbuj ponownie.');
    } finally {
      setAiLoading(false);
    }
  };

  // 30-day power days
  const powerDays = useMemo(() => {
    const days: Array<{ date: Date; score: number; label: string; color: string }> = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const pd = getPersonalDay(userData?.birthDate, d);
      const mp = getMoonPhase(d);
      const ph = getPlanetaryHour(d);
      const s = computeCosmicScore(pd, mp.phase, d.getDay(), ph.planet);
      let label = '';
      let color = cardBg;
      if (s >= 8.5) { label = 'POTĘŻNY'; color = accent; }
      else if (s >= 7.5) { label = 'Dobry'; color = '#34D399'; }
      else if (s >= 6.5) { label = 'Sprzyjający'; color = '#60A5FA'; }
      days.push({ date: d, score: s, label, color });
    }
    return days;
  }, [today, userData?.birthDate]);

  const weekDays = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
  const months = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'];

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      {/* Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={isLight
            ? ['#FFFBEA', '#FEF3C7', '#FFFBEA']
            : ['#0A0806', '#120E04', '#1A1408']}
          style={StyleSheet.absoluteFill}
        />
        <Svg width={SW} height={SW} style={[StyleSheet.absoluteFill, { opacity: 0.12 }]}>
          <G>
            {[160, 115, 76, 44].map((r, i) => (
              <Circle key={i} cx={SW / 2} cy={190} r={r} stroke={accent}
                strokeWidth={0.7} fill="none" strokeDasharray={i % 2 === 0 ? '5 9' : '2 5'}
                opacity={0.55 - i * 0.1}
              />
            ))}
            {Array.from({ length: 20 }, (_, i) => (
              <Circle key={'s' + i} cx={(i * 131 + 30) % SW} cy={(i * 87 + 40) % (SW * 0.8)}
                r={i % 5 === 0 ? 1.8 : 0.9} fill={accent} opacity={0.3}
              />
            ))}
          </G>
        </Svg>
      </View>

      {/* Header */}
      <View style={[st.header, { paddingHorizontal: layout.padding.screen }]}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={st.iconBtn} hitSlop={20}>
          <ChevronLeft color={accent} size={26} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[st.headerTitle, { color: textColor }]}>{t('divineTiming.boski_rytm', 'Boski Rytm')}</Text>
          <Text style={[st.headerSub, { color: subColor }]}>{t('divineTiming.okna_czasowe', 'OKNA CZASOWE')}</Text>
        </View>
        <Pressable onPress={handleToggleFav} style={st.iconBtn} hitSlop={12}>
          <Star color={accent} size={20} strokeWidth={1.8} fill={isFav ? accent : 'none'} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 56}
      >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── 1. ANIMATED COSMIC CLOCK ────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(0).springify()}>
          <View style={[st.heroCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <Text style={[st.microLabel, { color: accent }]}>{t('divineTiming.kosmiczny_zegar', 'KOSMICZNY ZEGAR')}</Text>
              <Text style={[st.sectionTitle, { color: textColor, marginTop: 4 }]}>
                {today.toLocaleDateString(getLocaleCode(), { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            </View>
            <CosmicClock personalDay={personalDay} moonPhaseIdx={moonPhaseIdx} accent={accent} />
            <View style={st.clockLegendRow}>
              <View style={st.legendItem}>
                <Text style={[st.legendDot, { color: accent }]}>●</Text>
                <Text style={[st.legendText, { color: subColor }]}>{t('divineTiming.zodiak', 'Zodiak')}</Text>
              </View>
              <View style={st.legendItem}>
                <Text style={[st.legendDot, { color: '#A78BFA' }]}>●</Text>
                <Text style={[st.legendText, { color: subColor }]}>{t('divineTiming.fazy_ksiezyca', 'Fazy Księżyca')}</Text>
              </View>
              <View style={st.legendItem}>
                <Text style={[st.legendDot, { color: '#60A5FA' }]}>●</Text>
                <Text style={[st.legendText, { color: subColor }]}>{t('divineTiming.liczby_1_9', 'Liczby 1–9')}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── 2. TODAY'S COSMIC SCORE ──────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <LinearGradient
            colors={isLight
              ? [accent + '22', accent + '0A', '#FFFBEA']
              : ['#1A1206', accent + '18', '#0A0806']}
            style={[st.scoreCard, { borderColor: accent + '44' }]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={[st.microLabel, { color: accent }]}>{t('divineTiming.wynik_kosmiczny_dnia', 'WYNIK KOSMICZNY DNIA')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6, gap: 6 }}>
                  <Text style={[st.scoreNumber, { color: accent }]}>{cosmicScore}</Text>
                  <Text style={[st.scoreMax, { color: subColor }]}>/10</Text>
                </View>
                <ScoreBar score={cosmicScore} accent={accent} isLight={isLight} />
                <Text style={[st.scoreDesc, { color: subColor, marginTop: 8 }]}>
                  {cosmicScore >= 8
                    ? 'Wyjątkowo sprzyjający dzień — niebiosa są po Twojej stronie.'
                    : cosmicScore >= 6
                    ? 'Dobry potencjał — działaj świadomie i z intencją.'
                    : 'Dzień refleksji — odpoczywaj i planuj zamiast działać.'}
                </Text>
              </View>
              <View style={{ alignItems: 'center', marginLeft: 16 }}>
                <Text style={{ fontSize: 40 }}>{moonInfo.icon}</Text>
                <Text style={[st.microLabel, { color: subColor, marginTop: 4 }]}>{moonInfo.name}</Text>
              </View>
            </View>
            <View style={[st.scoreChipRow, { marginTop: 14 }]}>
              {[
                { label: 'Dzień osobisty', val: String(personalDay), color: NUMBER_ENERGIES[personalDay]?.color || accent },
                { label: 'Księżyc', val: moonSign.sign.slice(0, 5), color: '#A78BFA' },
                { label: 'Planetarna', val: planetaryHourNow.planet.slice(0, 5), color: planetaryHourNow.color },
                { label: 'Żywioł', val: moonSign.element.slice(0, 4), color: '#34D399' },
              ].map((c, i) => (
                <View key={i} style={[st.scoreChip, { borderColor: c.color + '44', backgroundColor: c.color + '14' }]}>
                  <Text style={[st.scoreChipVal, { color: c.color }]}>{c.val}</Text>
                  <Text style={[st.scoreChipLabel, { color: subColor }]}>{c.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── 3. PLANETARY HOURS TODAY ────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <View style={st.sectionHeader}>
            <Text style={[st.microLabel, { color: accent }]}>{t('divineTiming.godziny_planetarne', 'GODZINY PLANETARNE')}</Text>
            <Pressable onPress={() => setShowHourBreakdown(v => !v)} style={st.expandBtn}>
              <Text style={[st.expandBtnText, { color: accent }]}>
                {showHourBreakdown ? 'Zwiń' : 'Rozwiń'}
              </Text>
              {showHourBreakdown
                ? <ChevronUp size={14} color={accent} />
                : <ChevronDown size={14} color={accent} />}
            </Pressable>
          </View>

          {/* Current planetary hour highlight */}
          <View style={[st.planetHourCard, { backgroundColor: planetaryHourNow.color + '18', borderColor: planetaryHourNow.color + '44' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[st.planetDot, { backgroundColor: planetaryHourNow.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[st.planetName, { color: planetaryHourNow.color }]}>
                  Teraz: {planetaryHourNow.planet}
                </Text>
                <Text style={[st.planetActivity, { color: subColor }]}>{planetaryHourNow.activity}</Text>
              </View>
              <View style={[st.hourBadge, { backgroundColor: planetaryHourNow.color + '28', borderColor: planetaryHourNow.color + '60' }]}>
                <Text style={[st.hourBadgeText, { color: planetaryHourNow.color }]}>{String(today.getHours()).padStart(2, '0')}:xx</Text>
              </View>
            </View>
          </View>

          {/* Expanded hour breakdown */}
          {showHourBreakdown && (
            <Animated.View entering={FadeIn.duration(300)}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingRight: 20 }}>
                  {dayHours.map((slot, i) => {
                    const isNow = slot.hour === today.getHours();
                    return (
                      <View key={i} style={[
                        st.hourSlot,
                        { borderColor: isNow ? slot.color : cardBorder, backgroundColor: isNow ? slot.color + '20' : cardBg },
                      ]}>
                        <Text style={[st.hourSlotHour, { color: isNow ? slot.color : subColor }]}>
                          {String(slot.hour).padStart(2, '0')}h
                        </Text>
                        <Text style={{ fontSize: 14 }}>
                          {slot.planet === 'Słońce' ? '☉' : slot.planet === 'Księżyc' ? '☽' : slot.planet === 'Mars' ? '♂' : slot.planet === 'Merkury' ? '☿' : slot.planet === 'Jowisz' ? '♃' : slot.planet === 'Wenus' ? '♀' : '♄'}
                        </Text>
                        <View style={[st.hourScoreDot, { backgroundColor: slot.score >= 7 ? '#22C55E' : slot.score >= 5 ? accent : '#64748B' }]} />
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
              <Text style={[st.hintText, { color: subColor, marginTop: 6 }]}>
                {t('divineTiming.zielona_kropka_dobra_godzina_zlota', 'Zielona kropka = dobra godzina. Złota = przeciętna. Szara = trudna.')}
              </Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* ── 4. PERSONAL NUMBERS ──────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={[st.microLabel, { color: accent, marginBottom: 10 }]}>{t('divineTiming.twoje_liczby_dnia', 'TWOJE LICZBY DNIA')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'Liczba drogi\nżycia', val: lifePath, desc: NUMBER_ENERGIES[lifePath]?.keyword || '—' },
              { label: 'Rok\nosobisty', val: personalYear, desc: NUMBER_ENERGIES[personalYear]?.keyword || '—' },
              { label: 'Miesiąc\nosobisty', val: personalMonth, desc: NUMBER_ENERGIES[personalMonth]?.keyword || '—' },
              { label: 'Dzień\nosobisty', val: personalDay, desc: NUMBER_ENERGIES[personalDay]?.keyword || '—' },
            ].map((item, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(220 + i * 40).springify()} style={{ flex: 1 }}>
                <LinearGradient
                  colors={isLight
                    ? [(NUMBER_ENERGIES[item.val]?.color || accent) + '18', cardBg]
                    : [(NUMBER_ENERGIES[item.val]?.color || accent) + '22', '#0A0806']}
                  style={[st.numberCard, { borderColor: (NUMBER_ENERGIES[item.val]?.color || accent) + '40' }]}
                >
                  <Text style={[st.numberVal, { color: NUMBER_ENERGIES[item.val]?.color || accent }]}>{item.val}</Text>
                  <Text style={[st.numberLabel, { color: subColor }]}>{item.label}</Text>
                  <Text style={[st.numberDesc, { color: NUMBER_ENERGIES[item.val]?.color || accent }]} numberOfLines={1}>{item.desc}</Text>
                </LinearGradient>
              </Animated.View>
            ))}
          </View>
          <View style={[st.infoBox, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 10 }]}>
            <Text style={[st.infoText, { color: subColor }]}>
              <Text style={{ color: textColor, fontWeight: '600' }}>Dzień {personalDay} — {NUMBER_ENERGIES[personalDay]?.keyword}: </Text>
              {personalDay === 1 && 'Inicjuj nowe projekty, wyraź siebie, stań na czele.'}
              {personalDay === 2 && 'Współpracuj, słuchaj, bądź w relacji i pielęgnuj partnerstwa.'}
              {personalDay === 3 && 'Twórz, wyrażaj się artystycznie, baw się i komunikuj.'}
              {personalDay === 4 && 'Buduj, planuj, pracuj solidnie — dzień fundamentów.'}
              {personalDay === 5 && 'Zmień coś, podróżuj, poszukuj nowych doświadczeń.'}
              {personalDay === 6 && 'Zadbaj o dom, rodzinę, harmonię i troskę o innych.'}
              {personalDay === 7 && 'Zagłęb się w medytację, naukę, samotną refleksję.'}
              {personalDay === 8 && 'Działaj w finansach, karierze, przejmij kontrolę.'}
              {personalDay === 9 && 'Zakończ cykle, pomoż innym, odpuść to, co minęło.'}
            </Text>
          </View>
        </Animated.View>

        {/* ── 5. ACTION TIMING GUIDE ───────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(280).springify()}>
          <Text style={[st.microLabel, { color: accent, marginBottom: 10, marginTop: 4 }]}>{t('divineTiming.przewodnik_timingu_dzialan', 'PRZEWODNIK TIMINGU DZIAŁAŃ')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -layout.padding.screen }}>
            <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: layout.padding.screen, paddingRight: layout.padding.screen + 10 }}>
              {ACTION_TYPES.map((action, i) => {
                const isSelected = selectedAction?.id === action.id;
                const isGoodDay = action.bestDays.includes(today.getDay());
                return (
                  <Pressable
                    key={action.id}
                    onPress={() => { setSelectedAction(isSelected ? null : action); HapticsService.notify(); }}
                    style={[
                      st.actionChip,
                      {
                        borderColor: isSelected ? action.color : (isGoodDay ? action.color + '60' : cardBorder),
                        backgroundColor: isSelected ? action.color + '28' : cardBg,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{action.icon}</Text>
                    <Text style={[st.actionChipLabel, { color: isSelected ? action.color : textColor }]}>{action.label}</Text>
                    {isGoodDay && (
                      <View style={[st.goodDayBadge, { backgroundColor: action.color + '28' }]}>
                        <Text style={[{ color: action.color, fontSize: 9, fontWeight: '700' }]}>{t('divineTiming.dzis', 'DZIŚ!')}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {selectedAction && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <LinearGradient
                colors={isLight
                  ? [selectedAction.color + '18', selectedAction.color + '08', '#FFFBEA']
                  : [selectedAction.color + '22', selectedAction.color + '0A', '#0A0806']}
                style={[st.actionDetailCard, { borderColor: selectedAction.color + '50' }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Text style={{ fontSize: 28 }}>{selectedAction.icon}</Text>
                  <View>
                    <Text style={[st.actionDetailTitle, { color: selectedAction.color }]}>{selectedAction.label}</Text>
                    <Text style={[st.actionDetailCond, { color: subColor }]}>{selectedAction.conditions}</Text>
                  </View>
                </View>
                <View style={[st.divider, { backgroundColor: cardBorder }]} />
                <Text style={[st.actionDetailTip, { color: subColor, marginTop: 10 }]}>{selectedAction.tip}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <Moon size={13} color={selectedAction.color} />
                  <Text style={[{ color: selectedAction.color, fontSize: 12, fontWeight: '600' }]}>Najlepsza faza: {selectedAction.bestMoon}</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {selectedAction.bestDays.map(d => (
                    <View key={d} style={[st.dayChip, { backgroundColor: selectedAction.color + '20', borderColor: selectedAction.color + '44' }]}>
                      <Text style={[{ color: selectedAction.color, fontSize: 11, fontWeight: '600' }]}>{weekDays[d]}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </Animated.View>
          )}
        </Animated.View>

        {/* ── 6. 30-DAY POWER DAYS CALENDAR ───────────────────────── */}
        <Animated.View entering={FadeInDown.delay(340).springify()}>
          <Text style={[st.microLabel, { color: accent, marginBottom: 10, marginTop: 4 }]}>{t('divineTiming.mocne_dni_nastepne_30_dni', 'MOCNE DNI — NASTĘPNE 30 DNI')}</Text>
          <View style={[st.calendarCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {powerDays.map((pd, i) => {
                const isPowerful = pd.score >= 8.5;
                const isGood = pd.score >= 7.5;
                const isFair = pd.score >= 6.5;
                const dotColor = isPowerful ? accent : isGood ? '#22C55E' : isFair ? '#60A5FA' : cardBorder;
                return (
                  <View key={i} style={[
                    st.calDay,
                    { backgroundColor: isPowerful ? accent + '22' : isGood ? '#22C55E14' : cardBg, borderColor: dotColor + (isPowerful ? 'AA' : '44') },
                  ]}>
                    <Text style={[st.calDayNum, { color: isPowerful ? accent : textColor }]}>
                      {pd.date.getDate()}
                    </Text>
                    <Text style={[st.calDayMonth, { color: subColor }]}>
                      {months[pd.date.getMonth()]}
                    </Text>
                    <View style={[st.calDayDot, { backgroundColor: dotColor }]} />
                    {pd.label ? (
                      <Text style={[st.calDayLabel, { color: isPowerful ? accent : isGood ? '#22C55E' : '#60A5FA' }]} numberOfLines={1}>
                        {pd.label}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { color: accent, label: 'Potężny (8.5+)' },
                { color: '#22C55E', label: 'Dobry (7.5+)' },
                { color: '#60A5FA', label: 'Sprzyjający (6.5+)' },
                { color: cardBorder, label: 'Neutralny' },
              ].map((leg, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: leg.color }} />
                  <Text style={[{ color: subColor, fontSize: 11 }]}>{leg.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ── 7. RETROGRADE IMPACT ─────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text style={[st.microLabel, { color: accent, marginBottom: 10, marginTop: 4 }]}>{t('divineTiming.wplyw_retrogrado', 'WPŁYW RETROGRADÓW')}</Text>
          <View style={{ gap: 8 }}>
            {RETROGRADES_DATA.map((retro, i) => (
              <Pressable
                key={i}
                onPress={() => { setExpandedRetrograde(expandedRetrograde === i ? null : i); HapticsService.notify(); }}
                style={[st.retroCard, {
                  borderColor: retro.active ? retro.color + '60' : cardBorder,
                  backgroundColor: retro.active ? retro.color + '10' : cardBg,
                }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[st.retroDot, { backgroundColor: retro.color }]} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[st.retroPlanet, { color: retro.color }]}>{retro.planet}</Text>
                      {retro.active && (
                        <View style={[st.activeBadge, { backgroundColor: retro.color + '28', borderColor: retro.color + '60' }]}>
                          <Text style={[{ color: retro.color, fontSize: 9, fontWeight: '700' }]}>{t('divineTiming.aktywny', 'AKTYWNY')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[st.retroPeriod, { color: subColor }]}>{retro.period}</Text>
                  </View>
                  {expandedRetrograde === i ? <ChevronUp size={16} color={subColor} /> : <ChevronDown size={16} color={subColor} />}
                </View>
                {expandedRetrograde === i && (
                  <Animated.View entering={FadeIn.duration(250)} style={{ marginTop: 12 }}>
                    <Text style={[st.retroAvoidTitle, { color: textColor }]}>{t('divineTiming.unikaj_podczas_retrograda', 'Unikaj podczas retrograda:')}</Text>
                    {retro.avoid.map((item, j) => (
                      <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }}>
                        <AlertTriangle size={12} color={retro.color} />
                        <Text style={[st.retroAvoidItem, { color: subColor }]}>{item}</Text>
                      </View>
                    ))}
                  </Animated.View>
                )}
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* ── 8. ECLIPSE WINDOWS ───────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(460).springify()}>
          <Text style={[st.microLabel, { color: accent, marginBottom: 10, marginTop: 4 }]}>{t('divineTiming.okna_zacmien', 'OKNA ZAĆMIEŃ')}</Text>
          <View style={{ gap: 10 }}>
            {ECLIPSES_DATA.map((eclipse, i) => (
              <Pressable
                key={i}
                onPress={() => { setExpandedEclipse(expandedEclipse === i ? null : i); HapticsService.notify(); }}
                style={[st.eclipseCard, { borderColor: eclipse.color + '50', backgroundColor: eclipse.color + '0C' }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 22 }}>{eclipse.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.eclipseType, { color: eclipse.color }]}>{eclipse.type}</Text>
                    <Text style={[st.eclipseDate, { color: subColor }]}>{eclipse.date} · {eclipse.sign}</Text>
                    <Text style={[st.eclipseWindow, { color: subColor }]}>Okno: {eclipse.window}</Text>
                  </View>
                  {expandedEclipse === i ? <ChevronUp size={16} color={subColor} /> : <ChevronDown size={16} color={subColor} />}
                </View>
                {expandedEclipse === i && (
                  <Animated.View entering={FadeIn.duration(250)} style={{ marginTop: 12 }}>
                    <Text style={[st.eclipseEnergy, { color: subColor, marginBottom: 10 }]}>{eclipse.energy}</Text>
                    <Text style={[st.retroAvoidTitle, { color: textColor }]}>{t('divineTiming.nie_zaczynaj_nie_podpisuj', 'Nie zaczynaj / nie podpisuj:')}</Text>
                    {eclipse.avoid.map((item, j) => (
                      <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }}>
                        <AlertTriangle size={12} color={eclipse.color} />
                        <Text style={[st.retroAvoidItem, { color: subColor }]}>{item}</Text>
                      </View>
                    ))}
                  </Animated.View>
                )}
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* ── 9. AI TIMING CONSULTATION ────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(520).springify()}>
          <LinearGradient
            colors={isLight
              ? [accent + '18', accent + '08', '#FFFBEA']
              : ['#1A1206', accent + '14', '#0A0806']}
            style={[st.aiCard, { borderColor: accent + '44' }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={[st.aiIconWrap, { backgroundColor: accent + '20', borderColor: accent + '40' }]}>
                <Bot size={22} color={accent} strokeWidth={1.6} />
              </View>
              <View>
                <Text style={[st.aiTitle, { color: textColor }]}>{t('divineTiming.konsultacj_timingu', 'Konsultacja Timingu')}</Text>
                <Text style={[st.aiSub, { color: subColor }]}>{t('divineTiming.kiedy_jest_najlepszy_moment_na', 'Kiedy jest najlepszy moment na...')}</Text>
              </View>
            </View>

            <View style={[st.aiInputWrap, { backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.07)', borderColor: cardBorder }]}>
              <TextInput
                value={aiQuery}
                onChangeText={setAiQuery}
                placeholder={t('divineTiming.np_kiedy_zalozyc_firme_najlepszy', 'np. Kiedy założyć firmę? Najlepszy dzień na rozmowę...')}
                placeholderTextColor={subColor + '88'}
                style={[st.aiInput, { color: textColor }]}
                multiline
                numberOfLines={2}
                returnKeyType="send"
                onSubmitEditing={handleAiQuery}
              />
            </View>

            <Pressable
              onPress={handleAiQuery}
              disabled={aiLoading || !aiQuery.trim()}
              style={[st.aiSendBtn, { backgroundColor: aiQuery.trim() && !aiLoading ? accent : cardBg, borderColor: accent + '44' }]}
            >
              {aiLoading
                ? <ActivityIndicator size="small" color={isLight ? '#1A1410' : '#0A0806'} />
                : <><Send size={14} color={aiQuery.trim() ? (isLight ? '#1A1410' : '#0A0806') : subColor} strokeWidth={2} /><Text style={[st.aiSendText, { color: aiQuery.trim() ? (isLight ? '#1A1410' : '#0A0806') : subColor }]}>{t('divineTiming.zapytaj_wyrocznie', 'Zapytaj Wyrocznię')}</Text></>
              }
            </Pressable>

            {!!aiResponse && (
              <Animated.View entering={FadeIn.duration(400)} style={[st.aiResponseBox, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)', borderColor: accent + '30' }]}>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                  <Sparkles size={13} color={accent} />
                  <Text style={[st.microLabel, { color: accent }]}>{t('divineTiming.odpowiedz_wyroczni', 'ODPOWIEDŹ WYROCZNI')}</Text>
                </View>
                <Text style={[st.aiResponseText, { color: textColor }]}>{aiResponse}</Text>
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>

        <EndOfContentSpacer size="standard" />
      </ScrollView>
      </KeyboardAvoidingView>
        </SafeAreaView>
</View>
  );
};

// ── STYLES ────────────────────────────────────────────────────
const st = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2.5,
    marginTop: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  microLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  clockLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    fontSize: 10,
  },
  legendText: {
    fontSize: 11,
  },
  scoreCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  scoreNumber: {
    fontSize: 52,
    fontWeight: '800',
    lineHeight: 58,
  },
  scoreMax: {
    fontSize: 20,
    fontWeight: '500',
    paddingBottom: 6,
  },
  scoreDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  scoreChipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  scoreChip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 64,
  },
  scoreChipVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  scoreChipLabel: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 1,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  planetHourCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 4,
  },
  planetDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  planetName: {
    fontSize: 14,
    fontWeight: '700',
  },
  planetActivity: {
    fontSize: 12,
    marginTop: 2,
  },
  hourBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hourBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  hourSlot: {
    width: 52,
    borderRadius: 10,
    borderWidth: 1,
    padding: 6,
    alignItems: 'center',
    gap: 3,
  },
  hourSlotHour: {
    fontSize: 11,
    fontWeight: '600',
  },
  hourScoreDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hintText: {
    fontSize: 11,
    lineHeight: 16,
  },
  numberCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  numberVal: {
    fontSize: 28,
    fontWeight: '800',
  },
  numberLabel: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginTop: 2,
  },
  numberDesc: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  infoBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  actionChip: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    width: 100,
    marginBottom: 4,
  },
  actionChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  goodDayBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  actionDetailCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  actionDetailTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionDetailCond: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    borderRadius: 1,
  },
  actionDetailTip: {
    fontSize: 13,
    lineHeight: 20,
  },
  dayChip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  calendarCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  calDay: {
    width: (SW - layout.padding.screen * 2 - 28 - 14 * 3) / 5,
    borderRadius: 10,
    borderWidth: 1,
    padding: 6,
    alignItems: 'center',
    gap: 2,
  },
  calDayNum: {
    fontSize: 13,
    fontWeight: '700',
  },
  calDayMonth: {
    fontSize: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  calDayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
  calDayLabel: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  retroCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  retroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  retroPlanet: {
    fontSize: 14,
    fontWeight: '700',
  },
  retroPeriod: {
    fontSize: 11,
    marginTop: 2,
  },
  activeBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  retroAvoidTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  retroAvoidItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  eclipseCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  eclipseType: {
    fontSize: 14,
    fontWeight: '700',
  },
  eclipseDate: {
    fontSize: 11,
    marginTop: 2,
  },
  eclipseWindow: {
    fontSize: 10,
    marginTop: 1,
    fontWeight: '600',
  },
  eclipseEnergy: {
    fontSize: 13,
    lineHeight: 19,
  },
  aiCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  aiIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  aiSub: {
    fontSize: 12,
    marginTop: 1,
  },
  aiInputWrap: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  aiInput: {
    fontSize: 14,
    lineHeight: 21,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  aiSendBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  aiSendText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  aiResponseBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 14,
  },
  aiResponseText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
