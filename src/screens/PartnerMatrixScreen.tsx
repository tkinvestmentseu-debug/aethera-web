// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Animated, {
  FadeInDown, withRepeat, withTiming, withSequence, withDelay,
  useSharedValue, useAnimatedStyle, useAnimatedProps, interpolate,
} from 'react-native-reanimated';
import {
  ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, View, Share,
} from 'react-native';
import { MysticalInput } from '../components/MysticalInput';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight, Brain, Calendar, ChevronLeft, Clock, Eye,
  Flame, Heart, HeartHandshake, Map, MessageCircle, Orbit,
  Shield, Sparkles, Star, TrendingUp, Users, BookOpen, Zap, RefreshCw,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { CelestialBackdrop } from '../components/CelestialBackdrop';
import { Typography } from '../components/Typography';
import { PremiumDatePickerSheet } from '../components/PremiumDatePickerSheet';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { calculateCompatibility, calculateMatrix, getEnergyMeaning } from '../features/matrix/utils/numerology';
import { MatrixChart } from '../features/matrix/components/MatrixChart';
import { AiService } from '../core/services/ai.service';
import { buildMatrixShareMessage } from '../core/utils/share';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Line, Path, RadialGradient as SvgRadialGradient, Stop, G, Polygon } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { DateWheelPicker } from '../components/DateWheelPicker';
import { useTheme } from '../core/hooks/useTheme';
const SW = Dimensions.get('window').width;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── DUAL MATRIX SVG WIDGET ───────────────────────────────────────
const DualMatrixWidget = ({ accentA, accentB }: { accentA: string; accentB: string }) => {
  const rot = useSharedValue(0);
  const pulse = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 20000 }), -1, false);
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 2200 }), withTiming(0, { duration: 2200 })),
      -1, true,
    );
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-22, Math.min(22, e.translationY * 0.13));
      tiltY.value = Math.max(-22, Math.min(22, e.translationX * 0.13));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));
  const rotStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rot.value}deg` }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.35, 0.85]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.94, 1.06]) }],
  }));

  const sz = 200;
  const cx = sz / 2;
  // Grid square side
  const gridA_cx = cx - 32;
  const gridB_cx = cx + 32;
  const gridSz = 54;
  const half = gridSz / 2;

  return (
    <View style={{ height: 210, alignItems: 'center', justifyContent: 'center', marginVertical: 8 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={outerStyle}>
          {/* Base SVG — two overlapping diamond grids + energy line */}
          <Svg width={sz} height={sz}>
            <Defs>
              <SvgRadialGradient id="gridGradA" cx="0.35" cy="0.35" r="0.65">
                <Stop offset="0" stopColor={accentA} stopOpacity="0.30" />
                <Stop offset="1" stopColor={accentA} stopOpacity="0.03" />
              </SvgRadialGradient>
              <SvgRadialGradient id="gridGradB" cx="0.65" cy="0.35" r="0.65">
                <Stop offset="0" stopColor={accentB} stopOpacity="0.26" />
                <Stop offset="1" stopColor={accentB} stopOpacity="0.03" />
              </SvgRadialGradient>
              <SvgRadialGradient id="centerGlow" cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor={accentA} stopOpacity="0.55" />
                <Stop offset="1" stopColor={accentB} stopOpacity="0.0" />
              </SvgRadialGradient>
            </Defs>

            {/* Outer glow rings */}
            <Circle cx={cx} cy={cx} r={88} fill="none" stroke={accentA + '12'} strokeWidth={1} />
            <Circle cx={cx} cy={cx} r={78} fill="none" stroke={accentB + '0D'} strokeWidth={0.7} />

            {/* Grid A — left diamond (rotated square) */}
            <G>
              <Polygon
                points={`${gridA_cx},${cx - half} ${gridA_cx + half},${cx} ${gridA_cx},${cx + half} ${gridA_cx - half},${cx}`}
                fill="url(#gridGradA)" stroke={accentA + '55'} strokeWidth={1.2}
              />
              {/* Inner grid lines */}
              <Line x1={gridA_cx - half} y1={cx} x2={gridA_cx + half} y2={cx} stroke={accentA + '40'} strokeWidth={0.7} />
              <Line x1={gridA_cx} y1={cx - half} x2={gridA_cx} y2={cx + half} stroke={accentA + '40'} strokeWidth={0.7} />
              {/* Small center dot A */}
              <Circle cx={gridA_cx} cy={cx} r={4} fill={accentA} opacity={0.88} />
            </G>

            {/* Grid B — right diamond */}
            <G>
              <Polygon
                points={`${gridB_cx},${cx - half} ${gridB_cx + half},${cx} ${gridB_cx},${cx + half} ${gridB_cx - half},${cx}`}
                fill="url(#gridGradB)" stroke={accentB + '55'} strokeWidth={1.2}
              />
              <Line x1={gridB_cx - half} y1={cx} x2={gridB_cx + half} y2={cx} stroke={accentB + '40'} strokeWidth={0.7} />
              <Line x1={gridB_cx} y1={cx - half} x2={gridB_cx} y2={cx + half} stroke={accentB + '40'} strokeWidth={0.7} />
              <Circle cx={gridB_cx} cy={cx} r={4} fill={accentB} opacity={0.88} />
            </G>

            {/* Energy connection line between centers */}
            <Line x1={gridA_cx} y1={cx} x2={gridB_cx} y2={cx}
              stroke={accentA + '60'} strokeWidth={1.5} strokeDasharray="4,3" />

            {/* Overlap center glow */}
            <Circle cx={cx} cy={cx} r={16} fill="url(#centerGlow)" />
            <Circle cx={cx} cy={cx} r={6} fill="white" opacity={0.20} />
          </Svg>

          {/* Rotating orbit dots */}
          <Animated.View style={[StyleSheet.absoluteFill, rotStyle, { alignItems: 'center', justifyContent: 'center' }]}>
            <Svg width={sz} height={sz}>
              <Circle cx={cx} cy={cx - 80} r={5} fill={accentA} opacity={0.72} />
              <Circle cx={cx + 58} cy={cx + 58} r={4} fill={accentB} opacity={0.55} />
              <Circle cx={cx - 58} cy={cx + 58} r={3.5} fill={accentA} opacity={0.40} />
              <Circle cx={cx + 80} cy={cx} r={3} fill={accentB} opacity={0.38} />
            </Svg>
          </Animated.View>

          {/* Pulse center overlay */}
          <Animated.View style={[StyleSheet.absoluteFill, pulseStyle, { alignItems: 'center', justifyContent: 'center' }]}>
            <Svg width={sz} height={sz}>
              <Circle cx={cx} cy={cx} r={14} fill={accentA} opacity={0.15} />
              <Circle cx={cx} cy={cx} r={7} fill={accentA} opacity={0.25} />
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      <Typography variant="caption" style={{ position: 'absolute', bottom: 2, opacity: 0.38, letterSpacing: 1 }}>
        ← przeciągnij, by odchylić →
      </Typography>
    </View>
  );
};

// ── COMPATIBILITY GAUGE ────────────────────────────────────────
const GAUGE_R = 68;
const GAUGE_CIRCUM = 2 * Math.PI * GAUGE_R;

const CompatibilityGauge = ({ score, accent }: { score: number; accent: string }) => {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(400, withTiming(score / 100, { duration: 1400 }));
  }, [score]);

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: GAUGE_CIRCUM * (1 - progress.value),
  }));

  const scoreColor = score >= 80 ? '#34D399' : score >= 60 ? '#FBBF24' : score >= 40 ? '#FB923C' : '#F87171';
  const scoreLabel = score >= 80 ? 'Wysoka harmonia' : score >= 60 ? 'Dobra zgodność' : score >= 40 ? 'Wzrost przez tarcie' : 'Głęboka lekcja';
  const sz = 168;
  const c = sz / 2;

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <Svg width={sz} height={sz}>
        <Defs>
          <SvgRadialGradient id="gaugeGlow" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={scoreColor} stopOpacity="0.18" />
            <Stop offset="1" stopColor={scoreColor} stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Circle cx={c} cy={c} r={GAUGE_R + 10} fill="url(#gaugeGlow)" />
        <Circle cx={c} cy={c} r={GAUGE_R} fill="none" stroke={scoreColor + '1E'} strokeWidth={12} strokeLinecap="round" />
        <AnimatedCircle
          cx={c} cy={c} r={GAUGE_R}
          fill="none" stroke={scoreColor} strokeWidth={12}
          strokeLinecap="round" strokeDasharray={GAUGE_CIRCUM}
          animatedProps={animProps}
          transform={`rotate(-90 ${c} ${c})`}
        />
        <Circle cx={c} cy={c} r={GAUGE_R - 18} fill={scoreColor + '10'} stroke={scoreColor + '20'} strokeWidth={1} />
      </Svg>
      <View style={StyleSheet.absoluteFill as any} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Typography style={{ fontSize: 40, fontWeight: '800', color: scoreColor, lineHeight: 46 }}>{score}</Typography>
          <Typography style={{ fontSize: 11, color: scoreColor, fontWeight: '700', opacity: 0.85 }}>%</Typography>
        </View>
      </View>
      <Typography variant="premiumLabel" color={scoreColor} style={{ marginTop: 10 }}>{scoreLabel}</Typography>
      <Typography variant="caption" style={{ opacity: 0.50, marginTop: 3 }}>Numerologiczny wynik zgodności</Typography>
    </View>
  );
};

// ── HARMONY LEVEL DATA ─────────────────────────────────────────
type HarmonyLevel = 'harmony' | 'tension' | 'neutral';
const HARMONY_ICONS: Record<HarmonyLevel, string> = { harmony: '✦', neutral: '○', tension: '⚡' };
const HARMONY_COLORS: Record<HarmonyLevel, string> = { harmony: '#34D399', neutral: '#FBBF24', tension: '#F87171' };

// ── SYNASTRY ASPECTS DATA ─────────────────────────────────────
const SYNASTRY_ASPECTS = [
  {
    id: 'komunikacja', label: 'Komunikacja', icon: MessageCircle,
    harmonyCalc: (c: number, r: number) => { const s = (c + r) % 9 || 9; return s <= 3 ? 'harmony' : s <= 6 ? 'neutral' : 'tension'; },
    descByLevel: {
      harmony: 'Wasze słowa lądują w sobie miękko. Mówicie tym samym rytmem — nawet cisza między Wami jest wymowna.',
      neutral: 'Macie różne style mówienia o tym, co czujecie. To nie problem — to zaproszenie do nauki słuchania inaczej.',
      tension: 'Słowa potrafią ranić nieintencjonalnie. Za każdym konfliktem kryje się niezaspokojona potrzeba bycia usłyszanym.',
    },
  },
  {
    id: 'wartosci', label: 'Wartości', icon: Shield,
    harmonyCalc: (c: number, b: number) => { const s = Math.abs(c - b); return s <= 2 ? 'harmony' : s <= 5 ? 'neutral' : 'tension'; },
    descByLevel: {
      harmony: 'Cenicie podobne rzeczy — wolność, głębię lub bezpieczeństwo. Wasz świat wewnętrzny gra wspólną melodię.',
      neutral: 'Część wartości podzielacie, część nie. To zdrowe pole negocjacji i wzajemnego szacunku dla różnic.',
      tension: 'To, co dla jednego jest priorytetem, dla drugiego może być nieważne. Tu potrzeba wyraźnych rozmów.',
    },
  },
  {
    id: 'emocje', label: 'Emocje', icon: Heart,
    harmonyCalc: (b: number, k: number) => { const s = (b + k) % 9 || 9; return s <= 3 ? 'harmony' : s <= 6 ? 'neutral' : 'tension'; },
    descByLevel: {
      harmony: 'Emocjonalne rytmy są zbliżone — czujecie w podobnym czasie, odpoczywajcie razem i razem burzycie.',
      neutral: 'Jeden z Was czuje głębiej lub szybciej. To wzajemne uzupełnienie, o ile pozwolicie sobie na różne tempa.',
      tension: 'Możecie odczuwać tak odmiennie, że trudno złapać most. Zapytaj, co czuje druga osoba, nie co zrobiła.',
    },
  },
  {
    id: 'misja', label: 'Misja życiowa', icon: TrendingUp,
    harmonyCalc: (lp1: number, lp2: number) => {
      if (lp1 === lp2) return 'harmony';
      const diff = Math.abs(lp1 - lp2);
      return diff <= 2 ? 'harmony' : diff <= 5 ? 'neutral' : 'tension';
    },
    descByLevel: {
      harmony: 'Zmierzacie ku podobnym celom życiowym. Wzrost jednego napędza wzrost drugiego.',
      neutral: 'Wasze misje się różnią, ale nie wykluczają. Możecie rozwijać się równolegle.',
      tension: 'Kierunki życiowe mogą się na chwilę rozbiegać. Klucz: rozróżnić "moją misję" od "naszej drogi".',
    },
  },
  {
    id: 'karma', label: 'Karmiczny węzeł', icon: Eye,
    harmonyCalc: (k: number) => { if ([11, 22].includes(k)) return 'harmony'; return k <= 4 ? 'tension' : 'neutral'; },
    descByLevel: {
      harmony: 'Wasza karmiczna nić jest silna i jasna — znacie się z dawna, nawet jeśli to pierwsze spotkanie.',
      neutral: 'Karmiczne nici są tu subtelne, ale obecne. Ta relacja uczy czego innego niż poprzednie.',
      tension: 'Głęboka praca karmiczna jest tu wezwana. Napięcia są zaproszeniem do domknięcia starego wzorca.',
    },
  },
  {
    id: 'przyszlosc', label: 'Wspólna przyszłość', icon: Map,
    harmonyCalc: (t: number, slp: number) => { const s = (t + slp) % 9 || 9; return s <= 3 ? 'harmony' : s <= 6 ? 'neutral' : 'tension'; },
    descByLevel: {
      harmony: 'Energia relacji naturalnie zmierza w przód. To, co budujecie razem, ma trwałe fundamenty.',
      neutral: 'Przyszłość jest otwarta — nie zadekretowana. Zależy bardziej od codziennych wyborów niż od wzorca.',
      tension: 'Przyszłość wymaga świadomego kursu. Bez regularnych rozmów o kierunku łatwo dryfować.',
    },
  },
];

// ── KARMIC PATTERNS ────────────────────────────────────────────
function getKarmicPatterns(center: number, karmicNumber: number, partnerName: string) {
  const name = partnerName || 'ta osoba';
  return [
    {
      num: '①', color: '#A78BFA',
      title: 'Jak się spotkaliście wcześniej',
      body: karmicNumber <= 3
        ? `Wasza poprzednia więź była intymna i głęboka. ${name} i Ty nosiłaś/eś nawzajem ciężary, których dziś nie musisz już dźwigać samotnie.`
        : karmicNumber <= 6
          ? `Poprzednio byliście towarzyszami drogi. Tamto doświadczenie zostawiło ślad wzajemnego zaufania.`
          : `W poprzednich inkarnacjach Wasza relacja była pełna kontrastu. Tamte napięcia są teraz materiałem do transformacji.`,
    },
    {
      num: '②', color: '#EC4899',
      title: 'Co przynosiłaś/eś tej osobie',
      body: center <= 3
        ? 'Przynosiłaś/eś tej osobie zakorzenienie, spokój i zdolność do wytrwania. Twoja stabilność była jej tarczą.'
        : center <= 6
          ? 'Przynosiłaś/eś tej osobie lustro — jasne i nieuniknione. Przez Ciebie widziała siebie pełniej.'
          : 'Przynosiłaś/eś tej osobie wizję, inspirację i gotowość do przeskoczenia własnych granic.',
    },
    {
      num: '③', color: '#34D399',
      title: 'Co razem zamykacie',
      body: karmicNumber === 11
        ? 'Jesteście tu, by raz na zawsze zamknąć wzorzec duchowego rozdzielenia. To rzadka, wielka szansa.'
        : karmicNumber === 22
          ? 'Zamykacie cykl budowania czegoś trwałego razem. To, co zaczęliście dawno temu, może zostać ukończone.'
          : 'Zamykacie wzorzec wzajemnego niezrozumienia. Tam, gdzie kiedyś był ból — teraz jest możliwość.',
    },
  ];
}

// ── RELATIONSHIP ROADMAP ───────────────────────────────────────
function getRelationshipRoadmap(center: number, partnerName: string) {
  const name = partnerName || 'partner/ka';
  return [
    { phase: 'I', color: '#60A5FA', icon: Sparkles, label: 'Faza rozpoznania', timeHint: 'Pierwsze miesiące',
      desc: `Energia ${center} wyznacza, czym Was przyciągało. To etap fascynacji i pierwszego rezonansu.`,
      guidance: 'Nie przyspieszaj głębi. Pozwól tej fazie trwać — ma swój rytm.' },
    { phase: 'II', color: '#A78BFA', icon: Eye, label: 'Faza zderzenia', timeHint: '3–12 miesięcy',
      desc: `Wzorce zaczynają się ujawniać. ${name} zobaczy w Tobie coś trudnego — tak jak Ty w niej/nim.`,
      guidance: 'Zamiast walczyć z tym, co boli — zapytaj, skąd pochodzi ten ból.' },
    { phase: 'III', color: '#EC4899', icon: Flame, label: 'Faza wyboru', timeHint: '1–2 rok',
      desc: 'Tu każde z Was decyduje: czy chcemy rosnąć razem czy osobno. To test autentyczności.',
      guidance: 'Wybieraj tę osobę świadomie — nie z przyzwyczajenia, nie ze strachu.' },
    { phase: 'IV', color: '#34D399', icon: Shield, label: 'Faza zakorzenienia', timeHint: '2–4 rok',
      desc: 'Budujecie wspólny rytm. Zakotwiczacie się w sobie bez tracenia siebie.',
      guidance: 'Świętujcie małe rzeczy. Rytuały budują intymność szybciej niż wielkie gesty.' },
    { phase: 'V', color: '#FBBF24', icon: TrendingUp, label: 'Faza ekspansji', timeHint: 'Po 4. roku',
      desc: 'Relacja staje się platformą do wzrostu — i indywidualnego, i wspólnego.',
      guidance: 'Nie zatrzymujcie się w wygodzie. Relacja potrzebuje nowych celów.' },
  ];
}

// ── MATRIX COMPARISON ─────────────────────────────────────────
function getMatrixComparisonRows(myMatrix: any, partnerMatrix: any, center: number) {
  if (!myMatrix || !partnerMatrix) return [];
  const rows = [
    { label: 'Droga życia', myVal: myMatrix.lifePath, partnerVal: partnerMatrix.lifePath },
    { label: 'Przeznaczenie', myVal: myMatrix.destiny, partnerVal: partnerMatrix.destiny },
    { label: 'Dusza', myVal: myMatrix.soul, partnerVal: partnerMatrix.soul },
    { label: 'Osobowość', myVal: myMatrix.personality, partnerVal: partnerMatrix.personality },
    { label: 'Moc wewnętrzna', myVal: myMatrix.power ?? center, partnerVal: partnerMatrix.power ?? center },
    { label: 'Program', myVal: myMatrix.program ?? myMatrix.bottom, partnerVal: partnerMatrix.program ?? partnerMatrix.bottom },
  ];
  return rows.map(r => {
    const diff = Math.abs((r.myVal ?? 0) - (r.partnerVal ?? 0));
    const level: HarmonyLevel = diff === 0 ? 'harmony' : diff <= 2 ? 'neutral' : 'tension';
    return { ...r, level };
  });
}

// ── MUTUAL LESSONS ─────────────────────────────────────────────
function getMutualLessons(center: number, bottom: number, right: number, partnerName: string) {
  const name = partnerName || 'ta osoba';
  return [
    {
      icon: Heart, color: '#F87171',
      title: `Czego uczysz ${name}`,
      body: center <= 4
        ? 'Uczysz tej osoby gruntowania, stabilności i zatrzymywania się przed działaniem.'
        : center <= 7
          ? 'Uczysz tej osoby głębszej refleksji, wrażliwości i słuchania ciała zamiast samego umysłu.'
          : 'Uczysz tej osoby wizji, śmiałości w marzeniach i gotowości do wyjścia poza bezpieczne granice.',
    },
    {
      icon: Sparkles, color: '#A78BFA',
      title: `Czego uczy Cię ${name}`,
      body: bottom <= 3
        ? 'Ta osoba uczy Cię dyscypliny, cierpliwości i kończenia tego, co zaczęłaś/eś.'
        : bottom <= 6
          ? 'Ta osoba uczy Cię oddawania kontroli, zaufania procesowi i odnajdywania harmonii.'
          : 'Ta osoba uczy Cię asertywności, ekspresji i odwagi w zajmowaniu własnego miejsca.',
    },
    {
      icon: Zap, color: '#FBBF24',
      title: 'Wspólna lekcja',
      body: right <= 3
        ? 'Wasza wspólna lekcja to cierpliwość wobec siebie nawzajem.'
        : right <= 6
          ? 'Wasza wspólna lekcja to prawdziwa komunikacja — mówienie trudnych prawd z łagodnością.'
          : 'Wasza wspólna lekcja to wzajemna wolność — kochanie się bez próby zmieniania drugiej osoby.',
    },
    {
      icon: BookOpen, color: '#34D399',
      title: 'Karmiczna nić',
      body: 'Ta relacja nie jest przypadkowa. Napięcia między Wami to nie błędy — to miejsca, gdzie wzrost jest możliwy.',
    },
  ];
}

// ── ENERGY TYPES ───────────────────────────────────────────────
const RELATIONSHIP_ENERGY_TYPES = [
  { id: 'lustro', label: 'Lustro', symbol: '🪞', color: '#93C5FD',
    desc: 'Widzicie w sobie nawzajem to, czego sami nie chcecie jeszcze zobaczyć.',
    practice: 'Zamiast reagować na zachowania partnera — zapytaj siebie: "Co ta reakcja mówi o mnie?"' },
  { id: 'uzupelnienie', label: 'Uzupełnienie', symbol: '☯', color: '#86EFAC',
    desc: 'Posiadacie komplementarne energie. Razem tworzycie pełniejszy obraz niż osobno.',
    practice: 'Świętujcie różnice zamiast je niwelować. Każda unikalność to Wasza wspólna siła.' },
  { id: 'wyzwanie', label: 'Wyzwanie', symbol: '⚡', color: '#FCA5A5',
    desc: 'Ta relacja wzywa do przeskoczenia ponad wygodne wzorce. Napięcia są nauczycielami.',
    practice: 'Przy kolejnym konflikcie zapytaj: "Jaką lekcję ta sytuacja chce mi przekazać?"' },
  { id: 'inspiracja', label: 'Inspiracja', symbol: '✨', color: '#FDE68A',
    desc: 'Rozpalasz w sobie nawzajem to, co uśpione. Ta więź przynosi twórczość i ekspansję.',
    practice: 'Twórzcie razem — projekt, rytuał, marzenie. Ta relacja potrzebuje wspólnego wyrazu.' },
];

function getRelationshipEnergyType(center: number, right: number) {
  if (center >= 7 || right >= 7) return RELATIONSHIP_ENERGY_TYPES[0];
  if ((center + right) % 4 === 0) return RELATIONSHIP_ENERGY_TYPES[1];
  if (center <= 2 || right <= 2) return RELATIONSHIP_ENERGY_TYPES[2];
  return RELATIONSHIP_ENERGY_TYPES[3];
}

const GROWTH_QUESTIONS = [
  'Co w tej relacji chcemy pielęgnować, a co puścić przed kolejnym rokiem?',
  'Kiedy ostatnio każde z Was poczuło się naprawdę wysłuchane — co to umożliwiło?',
  'Jaki wspólny cel lub marzenie jeszcze nie zostało nazwane między Wami?',
];

const PARTNER_PRACTICES = [
  { icon: '🧘', label: 'Medytacja dla pary', color: '#A78BFA', route: 'Meditation',
    desc: 'Usiądźcie naprzeciwko siebie. Zsynchronizujcie oddech przez 5 minut. Potem każde powiedzcie jedno zdanie o tym, co czuje.' },
  { icon: '🕯', label: 'Rytuał połączenia', color: '#FB923C', route: 'Rituals',
    desc: 'Zapalcie wspólną świecę. Każde napisze na kartce jedną rzecz, którą chce puścić ze związku i jedną, o którą prosi.' },
  { icon: '🃏', label: 'Tarot dla dwojga', color: '#34D399', route: 'PartnerTarot',
    desc: 'Wyciągnijcie po jednej karcie tarot — Twoja karta to energia, którą wnosisz; karta partnera — to, czego potrzebuje.' },
];

// ── NUMEROLOGY CALCS ───────────────────────────────────────────
function calcLifePath(dateStr: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  const digits = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  let sum = digits.split('').reduce((a, c) => a + parseInt(c, 10), 0);
  while (sum > 9 && sum !== 11 && sum !== 22) sum = String(sum).split('').reduce((a, c) => a + parseInt(c, 10), 0);
  return sum;
}
function calcSharedLifePath(lp1: number, lp2: number): number {
  let s = lp1 + lp2;
  while (s > 9 && s !== 11 && s !== 22) s = String(s).split('').reduce((a, c) => a + parseInt(c, 10), 0);
  return s;
}
function calcKarmicNumber(d1: string, d2: string): number {
  if (!d1 || !d2) return 0;
  const t1 = new Date(d1).getTime(); const t2 = new Date(d2).getTime();
  const diff = Math.abs(Math.floor((t1 - t2) / (1000 * 60 * 60 * 24)));
  let k = diff % 100;
  while (k > 9 && k !== 11 && k !== 22) k = String(k).split('').reduce((a, c) => a + parseInt(c, 10), 0);
  return k || 1;
}
function calcCompatibilityScore(center: number, right: number, bottom: number): number {
  const harmony = [1, 2, 6, 9].includes(center) ? 25 : [3, 5, 8].includes(center) ? 18 : 12;
  const contact = [2, 4, 6].includes(right) ? 25 : [1, 9].includes(right) ? 20 : 15;
  const lesson = bottom <= 3 ? 30 : bottom <= 6 ? 22 : 18;
  return Math.min(98, harmony + contact + lesson + 10);
}

// ── SECTION HEADING ─────────────────────────────────────────────
const SectionTitle = ({ label, accent }: { label: string; accent: string }) => (
  <View style={s.sectionTitleRow}>
    <View style={[s.sectionTitleLine, { backgroundColor: accent + '50' }]} />
    <Typography variant="premiumLabel" color={accent} style={s.sectionTitleText}>{label}</Typography>
    <View style={[s.sectionTitleLine, { backgroundColor: accent + '50' }]} />
  </View>
);

// ── PROGRESS BAR ───────────────────────────────────────────────
const ProgressBar = ({ value, max = 10, color }: { value: number; max?: number; color: string }) => {
  const pct = Math.min(1, value / max);
  const anim = useSharedValue(0);
  useEffect(() => { anim.value = withDelay(300, withTiming(pct, { duration: 900 })); }, [pct]);
  const barStyle = useAnimatedStyle(() => ({ width: `${anim.value * 100}%` as any }));
  return (
    <View style={[s.progressTrack, { backgroundColor: color + '20' }]}>
      <Animated.View style={[s.progressFill, barStyle, { backgroundColor: color }]} />
    </View>
  );
};

// ── MAIN SCREEN ────────────────────────────────────────────────
export const PartnerMatrixScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { isLight } = useTheme();
  const accentA = '#EC4899';
  const accentB = '#A78BFA';
  const accentGold = '#F59E0B';
  const aiAvailable = AiService.isLaunchAvailable();
  const scrollRef = useRef<ScrollView>(null);

  const [partnerName, setPartnerName] = useState('');
  const [partnerBirthDate, setPartnerBirthDate] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [personAPickerVisible, setPersonAPickerVisible] = useState(false);
  const [personABirthDate, setPersonABirthDate] = useState(userData.birthDate ?? '');
  // DateWheelPicker state — Person A
  const _initA = userData.birthDate ? new Date(userData.birthDate) : new Date(1990, 0, 1);
  const [myDay,   setMyDay  ] = useState(_initA.getDate());
  const [myMonth, setMyMonth] = useState(_initA.getMonth() + 1);
  const [myYear,  setMyYear ] = useState(_initA.getFullYear());
  // DateWheelPicker state — Partner
  const [ptDay,   setPtDay  ] = useState(1);
  const [ptMonth, setPtMonth] = useState(1);
  const [ptYear,  setPtYear ] = useState(1990);
  const [personAName, setPersonAName] = useState(userData.name ?? '');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOracleLoading, setAiOracleLoading] = useState(false);
  const [aiOracleCopy, setAiOracleCopy] = useState('');
  const [synastryCopy, setSynastryCopy] = useState('');
  const [roadmapExpanded, setRoadmapExpanded] = useState<number | null>(null);

  // Theme-aware colors
  const bg = isLight ? '#FAF8FF' : '#04020E';
  const cardBg = isLight ? 'rgba(120,60,180,0.05)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(120,60,180,0.12)' : 'rgba(255,255,255,0.08)';
  const dividerColor = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.07)';
  const textColor = isLight ? '#1A1025' : '#F0EBF8';
  const subColor = isLight ? '#5A4A70' : '#B8A8D0';

  const myMatrix = useMemo(() => personABirthDate ? calculateMatrix(personABirthDate) : null, [personABirthDate]);
  const partnerMatrix = useMemo(() => partnerBirthDate ? calculateMatrix(partnerBirthDate) : null, [partnerBirthDate]);
  const relationshipMatrix = useMemo(() => (personABirthDate && partnerBirthDate) ? calculateCompatibility(personABirthDate, partnerBirthDate) : null, [personABirthDate, partnerBirthDate]);

  const myLifePath = useMemo(() => calcLifePath(personABirthDate ?? ''), [personABirthDate]);
  const partnerLifePath = useMemo(() => partnerMatrix?.lifePath ?? 0, [partnerMatrix]);
  const sharedLifePath = useMemo(() => myLifePath && partnerLifePath ? calcSharedLifePath(myLifePath, partnerLifePath) : 0, [myLifePath, partnerLifePath]);
  const karmicNumber = useMemo(() => (personABirthDate && partnerBirthDate) ? calcKarmicNumber(personABirthDate, partnerBirthDate) : 0, [personABirthDate, partnerBirthDate]);
  const compatibilityScore = useMemo(() => relationshipMatrix ? calcCompatibilityScore(relationshipMatrix.center, relationshipMatrix.right, relationshipMatrix.bottom) : 0, [relationshipMatrix]);

  const relationshipEnergyType = useMemo(() => relationshipMatrix ? getRelationshipEnergyType(relationshipMatrix.center, relationshipMatrix.right) : null, [relationshipMatrix]);
  const mutualLessons = useMemo(() => relationshipMatrix ? getMutualLessons(relationshipMatrix.center, relationshipMatrix.bottom, relationshipMatrix.right, partnerName.trim()) : [], [relationshipMatrix, partnerName]);
  const synastrAspects = useMemo(() => {
    if (!relationshipMatrix) return [];
    const { center: c, right: r, bottom: b, top: t } = relationshipMatrix;
    return SYNASTRY_ASPECTS.map((asp, idx) => {
      let level: HarmonyLevel;
      if (idx === 0) level = asp.harmonyCalc(c, r);
      else if (idx === 1) level = asp.harmonyCalc(c, b);
      else if (idx === 2) level = asp.harmonyCalc(b, karmicNumber);
      else if (idx === 3) level = asp.harmonyCalc(myLifePath, partnerLifePath);
      else if (idx === 4) level = asp.harmonyCalc(karmicNumber, 0);
      else level = asp.harmonyCalc(t, sharedLifePath);
      return { ...asp, level, desc: asp.descByLevel[level] };
    });
  }, [relationshipMatrix, karmicNumber, myLifePath, partnerLifePath, sharedLifePath]);

  const karmicPatterns = useMemo(() => relationshipMatrix ? getKarmicPatterns(relationshipMatrix.center, karmicNumber, partnerName.trim()) : [], [relationshipMatrix, karmicNumber, partnerName]);
  const roadmap = useMemo(() => relationshipMatrix ? getRelationshipRoadmap(relationshipMatrix.center, partnerName.trim()) : [], [relationshipMatrix, partnerName]);
  const matrixComparisonRows = useMemo(() => getMatrixComparisonRows(myMatrix, partnerMatrix, relationshipMatrix?.center ?? 0), [myMatrix, partnerMatrix, relationshipMatrix]);

  const relationshipAiPrompts = relationshipMatrix && partnerMatrix ? [
    { title: 'Zapytaj o sedno tej relacji', copy: `AI wyjaśni, jak centrum ${relationshipMatrix.center} buduje napięcie i przyciąganie między Wami.`, context: `Analizuję partnerową Matrycę relacji z ${partnerName.trim() || 'tą osobą'}. Centrum ${relationshipMatrix.center}, relacje ${relationshipMatrix.right}, lekcja ${relationshipMatrix.bottom}. Wyjaśnij sedno tej relacji.` },
    { title: 'Zapytaj o konflikt i naprawę', copy: `AI pokaże, jak pracować z lekcją ${relationshipMatrix.bottom} bez eskalacji.`, context: `Chcę zrozumieć trudniejszą stronę matrycy. Centrum ${relationshipMatrix.center}, lekcja ${relationshipMatrix.bottom}, oś relacji ${relationshipMatrix.right}. Pokaż mi, skąd bierze się napięcie i jak rozmawiać dojrzale.` },
    { title: 'Zapytaj o przyszły ruch', copy: `AI odpowie, jaki krok jest najzdrowszy przy energii ${relationshipMatrix.top}.`, context: `Energia działania to ${relationshipMatrix.top}, centrum ${relationshipMatrix.center}, relacje ${relationshipMatrix.right}. Jaki najbliższy krok jest najzdrowszy dla tej relacji?` },
  ] : [];

  const handleAiOracle = async () => {
    if (!aiAvailable || !relationshipMatrix || !partnerMatrix) return;
    setAiOracleLoading(true);
    setAiOracleCopy('');
    try {
      const pA = personAName.trim() || 'Osoba A';
      const pB = partnerName.trim() || 'Osoba B';
      const prompt = `Jesteś mistrzem numerologii relacyjnej. Dokonaj głębokiej analizy związku między ${pA} i ${pB}.\n\n${pA}: Droga życia ${myLifePath}\n${pB}: Droga życia ${partnerLifePath}\nWSPÓLNA DROGA: ${sharedLifePath} | KARMICZNY: ${karmicNumber}\nCENTRUM: ${relationshipMatrix.center} | OŚ: ${relationshipMatrix.right}\nLEKCJA: ${relationshipMatrix.bottom} | DZIAŁANIE: ${relationshipMatrix.top}\nZGODNOŚĆ: ${compatibilityScore}%\n\nNapisz Oracle czytanie w 5-7 zdaniach. Pisz ciepło, poetycko. Używaj imion. Tylko w języku użytkownika.`;
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setAiOracleCopy(result?.trim() ?? '');
    } catch { setAiOracleCopy('Nie udało się wygenerować czytania Oracle. Spróbuj ponownie.'); }
    finally { setAiOracleLoading(false); }
  };

  const focusIntoView = (y: number) => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(y - 140, 0), animated: true }), 180);
  };

  const handleShare = async () => {
    if (!partnerMatrix || !relationshipMatrix) return;
    await Share.share({
      message: buildMatrixShareMessage(
        `${partnerName.trim() || 'Ta osoba'} wnosi drogę życia ${partnerMatrix.lifePath}, a wspólne centrum relacji otwiera energię ${relationshipMatrix.center}.`,
        [`Pole relacji ${relationshipMatrix.right}: ${getEnergyMeaning(relationshipMatrix.right)}`, `Lekcja więzi ${relationshipMatrix.bottom}: ${getEnergyMeaning(relationshipMatrix.bottom)}`, `Działanie ${relationshipMatrix.top}: ${getEnergyMeaning(relationshipMatrix.top)}`],
      ),
    });
  };

  const handleAiSynastry = async () => {
    if (!aiAvailable || !relationshipMatrix || !partnerMatrix) return;
    setAiLoading(true); setSynastryCopy('');
    try {
      const prompt = `Jesteś astrologiczno-numerologicznym przewodnikiem.\n\nOSOBA 1: droga życia ${myLifePath}\nOSOBA 2 (${partnerName.trim() || 'partner/ka'}): droga życia ${partnerLifePath}\nWSPÓLNA DROGA: ${sharedLifePath}\nKARMICZNY: ${karmicNumber}\nCENTRUM: ${relationshipMatrix.center} (${getEnergyMeaning(relationshipMatrix.center)})\nOŚ: ${relationshipMatrix.right} | LEKCJA: ${relationshipMatrix.bottom} | DZIAŁANIE: ${relationshipMatrix.top}\nKOMPATYBILNOŚĆ: ${compatibilityScore}%\n\nNapisz 4-5 zdań: czego ta relacja uczy obie osoby, gdzie najgłębsze przyciąganie, co jest głównym wyzwaniem. Pisz głęboko i bez banałów. W języku użytkownika.`;
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setSynastryCopy(result?.trim() ?? '');
    } catch { setSynastryCopy('Nie udało się wygenerować czytania. Spróbuj ponownie.'); }
    finally { setAiLoading(false); }
  };

  const hasResults = !!(partnerMatrix && relationshipMatrix);

  return (
    <View style={[s.container, { backgroundColor: isLight ? '#FAF8FF' : '#04020E' }]}>
      {/* Premium gradient background */}
      {!isLight && (
        <LinearGradient
          colors={['#04020E', '#070318', '#0A0422']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <CelestialBackdrop intensity="immersive" />

      <SafeAreaView edges={['top']} style={s.safeArea}>
        <KeyboardAvoidingView style={s.safeArea} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0}>

          {/* ── HEADER ─────────────────────────────────────────── */}
          <View style={s.header}>
            <Pressable onPress={() => navigation.goBack()} style={s.headerBtn} hitSlop={20}>
              <ChevronLeft color={accentA} size={26} />
            </Pressable>
            <View style={s.headerCenter}>
              <Typography variant="premiumLabel" color={accentA} style={s.eyebrow}>MATRYCA RELACJI</Typography>
              <Typography variant="screenTitle" style={[s.headerTitle, { color: textColor }]}>Energia Połączenia</Typography>
            </View>
            <Pressable
              onPress={() => { if (isFavoriteItem('partner_matrix')) { removeFavoriteItem('partner_matrix'); } else { addFavoriteItem({ id: 'partner_matrix', label: 'Matryca relacji', route: 'PartnerMatrix', params: {}, icon: 'Heart', color: accentA, addedAt: new Date().toISOString() }); } }}
              style={s.headerBtn} hitSlop={12}
            >
              <Star color={isFavoriteItem('partner_matrix') ? accentA : accentA + '88'} size={18} strokeWidth={1.8} fill={isFavoriteItem('partner_matrix') ? accentA : 'none'} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[s.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'tight') }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
          >
            {/* ── ANIMATED SVG WIDGET ──────────────────────── */}
            <DualMatrixWidget accentA={accentA} accentB={accentB} />

            {/* ── HERO SUBTITLE ─────────────────────────────── */}
            <View style={s.heroSubtitle}>
              <Typography variant="bodyRefined" style={{ color: subColor, textAlign: 'center', lineHeight: 24 }}>
                Nie tylko kim jest ta osoba — ale jak jej wzorzec spotyka Twój rytm relacji i lekcji.
              </Typography>
            </View>

            {/* ── INPUT CARDS ──────────────────────────────── */}
            <View style={s.inputCardsRow}>
              {/* Card A */}
              <View style={[s.inputCard, { backgroundColor: isLight ? accentA + '08' : accentA + '10', borderColor: accentA + '40' }]}>
                <View style={s.inputCardHeader}>
                  <View style={[s.inputCardDot, { backgroundColor: accentA }]} />
                  <Typography variant="microLabel" color={accentA}>TY</Typography>
                </View>
                <MysticalInput
                  value={personAName}
                  onChangeText={setPersonAName}
                  placeholder="Twoje imię"
                  placeholderTextColor={subColor + '88'}
                  style={{ color: textColor, fontSize: 14 }}
                  onFocusScroll={() => focusIntoView(200)}
                />
                <DateWheelPicker
                  day={myDay}
                  month={myMonth}
                  year={myYear}
                  onChange={(d, m, y) => {
                    setMyDay(d); setMyMonth(m); setMyYear(y);
                    const iso = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                    setPersonABirthDate(iso);
                  }}
                  textColor={textColor}
                  accentColor={accentA}
                  cardBg={isLight ? accentA + '0A' : accentA + '12'}
                />
              </View>

              {/* Heart divider */}
              <View style={s.inputCardsDivider}>
                <View style={[s.inputCardsDividerLine, { backgroundColor: dividerColor }]} />
                <View style={[s.heartBadge, { backgroundColor: isLight ? 'rgba(236,72,153,0.12)' : 'rgba(236,72,153,0.20)', borderColor: accentA + '55' }]}>
                  <Heart color={accentA} size={14} fill={accentA} />
                </View>
                <View style={[s.inputCardsDividerLine, { backgroundColor: dividerColor }]} />
              </View>

              {/* Card B */}
              <View style={[s.inputCard, { backgroundColor: isLight ? accentB + '08' : accentB + '10', borderColor: accentB + '40' }]}>
                <View style={s.inputCardHeader}>
                  <View style={[s.inputCardDot, { backgroundColor: accentB }]} />
                  <Typography variant="microLabel" color={accentB}>PARTNER/KA</Typography>
                </View>
                <MysticalInput
                  value={partnerName}
                  onChangeText={setPartnerName}
                  placeholder="Imię tej osoby"
                  placeholderTextColor={subColor + '88'}
                  style={{ color: textColor, fontSize: 14 }}
                  onFocusScroll={() => focusIntoView(350)}
                />
                <DateWheelPicker
                  day={ptDay}
                  month={ptMonth}
                  year={ptYear}
                  onChange={(d, m, y) => {
                    setPtDay(d); setPtMonth(m); setPtYear(y);
                    const iso = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                    setPartnerBirthDate(iso);
                  }}
                  textColor={textColor}
                  accentColor={accentB}
                  cardBg={isLight ? accentB + '0A' : accentB + '12'}
                />
              </View>
            </View>

            {(!personABirthDate || !partnerBirthDate) && (
              <View style={[s.hintBox, { backgroundColor: accentA + '0A', borderColor: accentA + '25' }]}>
                <Typography variant="caption" style={{ color: subColor, lineHeight: 19, textAlign: 'center' }}>
                  Wypełnij dane obu osób, by otworzyć pełną analizę partnerowej matrycy relacji.
                </Typography>
              </View>
            )}

            {/* ── RESULTS ──────────────────────────────────── */}
            {hasResults ? (
              <>
                {/* ── COMPATIBILITY GAUGE ─────────────────── */}
                <Animated.View entering={FadeInDown.delay(80).springify()}>
                  <View style={[s.gaugeCard, { backgroundColor: isLight ? 'rgba(236,72,153,0.05)' : 'rgba(236,72,153,0.08)', borderColor: accentA + '40' }]}>
                    <LinearGradient colors={[accentA + '12', 'transparent']} style={StyleSheet.absoluteFill as any} />
                    <View style={s.gaugeBadgeRow}>
                      <View style={[s.gaugeBadge, { backgroundColor: accentA + '18', borderColor: accentA + '44' }]}>
                        <Typography variant="microLabel" color={accentA}>♥ WYNIK KOMPATYBILNOŚCI</Typography>
                      </View>
                    </View>
                    <CompatibilityGauge score={compatibilityScore} accent={accentA} />
                    <View style={[s.gaugeDivider, { backgroundColor: dividerColor }]} />
                    <Typography variant="caption" style={{ color: subColor, textAlign: 'center', lineHeight: 19 }}>
                      Wynik numerologiczny oparty na centrum relacji, osi kontaktu i lekcji więzi.
                    </Typography>
                  </View>
                </Animated.View>

                {/* ── 3 STAT CHIPS ────────────────────────── */}
                <View style={s.statChipsRow}>
                  {[
                    { label: 'WSPÓLNA DROGA', value: sharedLifePath, color: accentA },
                    { label: 'KARMICZNY', value: karmicNumber, color: accentB },
                    { label: 'ZGODNOŚĆ', value: `${compatibilityScore}%`, color: '#34D399' },
                  ].map((chip, i) => (
                    <Animated.View key={chip.label} entering={FadeInDown.delay(60 + i * 50).springify()}
                      style={[s.statChip, { backgroundColor: isLight ? chip.color + '0C' : chip.color + '12', borderColor: chip.color + '35' }]}>
                      <LinearGradient colors={[chip.color + '14', 'transparent']} style={StyleSheet.absoluteFill as any} />
                      <Typography variant="microLabel" color={chip.color} style={{ textAlign: 'center', marginBottom: 4 }}>{chip.label}</Typography>
                      <Typography style={{ fontSize: 30, fontWeight: '800', color: chip.color, textAlign: 'center', lineHeight: 36 }}>{chip.value}</Typography>
                    </Animated.View>
                  ))}
                </View>

                {/* ── PUNCT STYKU ─────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                  <SectionTitle label="PUNKT STYKU" accent={accentA} />
                  <View style={[s.punktCard, { backgroundColor: cardBg, borderColor: accentA + '44' }]}>
                    <LinearGradient colors={[accentA + '10', accentB + '06', 'transparent']} style={StyleSheet.absoluteFill as any} />
                    <View style={[s.punktNumBadge, { backgroundColor: accentA + '20', borderColor: accentA + '55' }]}>
                      <Typography style={{ fontSize: 52, fontWeight: '800', color: accentA, lineHeight: 60 }}>{relationshipMatrix.center}</Typography>
                    </View>
                    <Typography variant="premiumLabel" color={textColor} style={{ textAlign: 'center', marginBottom: 10 }}>
                      Wspólne centrum relacji
                    </Typography>
                    <View style={[s.punktDivider, { backgroundColor: accentA + '30' }]} />
                    <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 22, textAlign: 'center' }}>
                      {getEnergyMeaning(relationshipMatrix.center)}
                    </Typography>
                    <Typography variant="caption" style={{ color: subColor, opacity: 0.70, marginTop: 8, lineHeight: 19, textAlign: 'center', fontStyle: 'italic' }}>
                      To liczba, którą razem uruchamiacie — nie należy ani do Ciebie, ani do tej osoby osobno.
                    </Typography>
                  </View>
                </Animated.View>

                {/* ── COMPATIBILITY ASPECTS ───────────────── */}
                <Animated.View entering={FadeInDown.delay(120).springify()}>
                  <SectionTitle label="PRZEPŁYWY ENERGII" accent={accentB} />
                  <Typography variant="caption" style={{ color: subColor, marginBottom: 14, lineHeight: 20 }}>
                    Sześć wymiarów relacji — aspekty numerologiczne między Waszymi wzorcami.
                  </Typography>
                  {synastrAspects.map((asp, idx) => {
                    const AspIcon = asp.icon;
                    const hColor = HARMONY_COLORS[asp.level];
                    return (
                      <Animated.View key={asp.id} entering={FadeInDown.delay(idx * 55).springify()}>
                        <View style={[s.aspectCard, { backgroundColor: isLight ? hColor + '08' : hColor + '0C', borderColor: hColor + '38' }]}>
                          <LinearGradient colors={[hColor + '0E', 'transparent']} style={StyleSheet.absoluteFill as any} />
                          <View style={s.aspectRow}>
                            <View style={[s.aspectIconBox, { backgroundColor: hColor + '20', borderColor: hColor + '44' }]}>
                              <AspIcon color={hColor} size={15} strokeWidth={1.8} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Typography variant="premiumLabel" color={hColor}>{asp.label}</Typography>
                              <ProgressBar value={asp.level === 'harmony' ? 9 : asp.level === 'neutral' ? 6 : 3} color={hColor} />
                            </View>
                            <View style={[s.aspectBadge, { backgroundColor: hColor + '18', borderColor: hColor + '40' }]}>
                              <Typography style={{ fontSize: 13, color: hColor }}>{HARMONY_ICONS[asp.level]}</Typography>
                              <Typography variant="microLabel" color={hColor} style={{ marginLeft: 4 }}>
                                {asp.level === 'harmony' ? 'Harmonia' : asp.level === 'neutral' ? 'Neutralne' : 'Napięcie'}
                              </Typography>
                            </View>
                          </View>
                          <View style={[s.aspectDivider, { backgroundColor: hColor + '22' }]} />
                          <Typography variant="caption" style={{ lineHeight: 20, color: subColor, opacity: 0.88 }}>{asp.desc}</Typography>
                        </View>
                      </Animated.View>
                    );
                  })}
                </Animated.View>

                {/* ── MATRIX COMPARISON TABLE ─────────────── */}
                <Animated.View entering={FadeInDown.delay(80).springify()}>
                  <SectionTitle label="LICZBY OBU OSÓB" accent={accentA} />
                  <View style={[s.compCard, { backgroundColor: cardBg, borderColor: accentA + '30' }]}>
                    <LinearGradient colors={[accentA + '08', 'transparent']} style={StyleSheet.absoluteFill as any} />
                    {/* Header row */}
                    <View style={[s.compRow, s.compHeaderRow, { borderBottomColor: dividerColor }]}>
                      <Typography variant="microLabel" style={[s.compLabel, { color: accentA + 'AA' }]}>LICZBA</Typography>
                      <View style={[s.compCell, { borderColor: accentA + '33', backgroundColor: accentA + '12' }]}>
                        <Typography variant="microLabel" color={accentA}>{personAName.trim() || 'TY'}</Typography>
                      </View>
                      <View style={s.compMidCell}>
                        <Typography variant="microLabel" style={{ color: subColor, opacity: 0.5 }}></Typography>
                      </View>
                      <View style={[s.compCell, { borderColor: accentB + '33', backgroundColor: accentB + '12' }]}>
                        <Typography variant="microLabel" color={accentB}>{partnerName.trim() || 'ON/ONA'}</Typography>
                      </View>
                    </View>
                    {matrixComparisonRows.map((row, idx) => (
                      <View key={row.label} style={[s.compRow, idx < matrixComparisonRows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: dividerColor }]}>
                        <Typography variant="caption" style={[s.compLabel, { color: subColor }]}>{row.label}</Typography>
                        <View style={[s.compCell, { borderColor: accentA + '22', backgroundColor: accentA + '08' }]}>
                          <Typography style={{ fontSize: 17, fontWeight: '700', color: accentA, textAlign: 'center' }}>{row.myVal ?? '—'}</Typography>
                        </View>
                        <View style={s.compMidCell}>
                          <Typography style={{ fontSize: 14, color: HARMONY_COLORS[row.level], textAlign: 'center' }}>{HARMONY_ICONS[row.level]}</Typography>
                        </View>
                        <View style={[s.compCell, { borderColor: accentB + '22', backgroundColor: accentB + '08' }]}>
                          <Typography style={{ fontSize: 17, fontWeight: '700', color: accentB, textAlign: 'center' }}>{row.partnerVal ?? '—'}</Typography>
                        </View>
                      </View>
                    ))}
                    <View style={[s.compLegend, { borderTopColor: dividerColor }]}>
                      {(['harmony', 'neutral', 'tension'] as HarmonyLevel[]).map(lvl => (
                        <View key={lvl} style={s.compLegendItem}>
                          <Typography style={{ fontSize: 12, color: HARMONY_COLORS[lvl] }}>{HARMONY_ICONS[lvl]}</Typography>
                          <Typography variant="caption" style={{ color: subColor, marginLeft: 4, opacity: 0.75 }}>
                            {lvl === 'harmony' ? 'Harmonia' : lvl === 'neutral' ? 'Neutralne' : 'Napięcie'}
                          </Typography>
                        </View>
                      ))}
                    </View>
                  </View>
                </Animated.View>

                {/* Matrix chart */}
                <View style={[s.chartCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <MatrixChart energies={relationshipMatrix} />
                </View>

                {/* ── KARMIC ANALYSIS ─────────────────────── */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                  <SectionTitle label="KARMICZNA ANALIZA POŁĄCZENIA" accent={accentB} />
                  <View style={{ gap: 12 }}>
                    {karmicPatterns.map((p, idx) => (
                      <Animated.View key={p.num} entering={FadeInDown.delay(idx * 80).springify()}>
                        <View style={[s.karmicCard, { backgroundColor: isLight ? p.color + '08' : p.color + '10', borderColor: p.color + '40' }]}>
                          <LinearGradient colors={[p.color + '12', 'transparent']} style={StyleSheet.absoluteFill as any} />
                          <View style={s.karmicHeader}>
                            <View style={[s.karmicBadge, { backgroundColor: p.color + '20', borderColor: p.color + '50' }]}>
                              <Typography style={{ fontSize: 17, color: p.color, fontWeight: '800' }}>{p.num}</Typography>
                            </View>
                            <Typography variant="premiumLabel" color={p.color} style={{ flex: 1, marginLeft: 12 }}>{p.title}</Typography>
                          </View>
                          <View style={[s.karmicDivider, { backgroundColor: p.color + '22' }]} />
                          <Typography variant="bodySmall" style={{ lineHeight: 22, color: textColor, opacity: 0.86 }}>{p.body}</Typography>
                        </View>
                      </Animated.View>
                    ))}
                  </View>
                </Animated.View>

                {/* ── AXES STAT ROW ────────────────────────── */}
                <View style={[s.axesRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <LinearGradient colors={[accentA + '0A', accentB + '06', 'transparent']} style={StyleSheet.absoluteFill as any} />
                  {[
                    { label: 'Przyciąganie', value: String(relationshipMatrix.center), color: accentA },
                    { label: 'Kontakt', value: String(relationshipMatrix.right), color: accentB },
                    { label: 'Lekcja', value: String(relationshipMatrix.bottom), color: accentGold },
                  ].map((item, idx) => (
                    <React.Fragment key={item.label}>
                      {idx > 0 && <View style={[s.axesDivider, { backgroundColor: dividerColor }]} />}
                      <View style={s.axesItem}>
                        <Typography variant="microLabel" color={item.color}>{item.label}</Typography>
                        <Typography style={{ fontSize: 28, fontWeight: '800', color: item.color, marginTop: 4 }}>{item.value}</Typography>
                      </View>
                    </React.Fragment>
                  ))}
                </View>

                {/* ── MUTUAL LESSONS ──────────────────────── */}
                <Animated.View entering={FadeInDown.delay(80).springify()}>
                  <SectionTitle label="WZAJEMNE LEKCJE" accent={accentA} />
                  <View style={{ gap: 12 }}>
                    {mutualLessons.map((lesson, idx) => {
                      const Icon = lesson.icon;
                      return (
                        <Animated.View key={idx} entering={FadeInDown.delay(idx * 70).springify()}>
                          <View style={[s.lessonCard, { backgroundColor: isLight ? lesson.color + '08' : lesson.color + '0D', borderColor: lesson.color + '35' }]}>
                            <LinearGradient colors={[lesson.color + '10', 'transparent']} style={StyleSheet.absoluteFill as any} />
                            <View style={s.lessonHeader}>
                              <View style={[s.lessonIconBox, { backgroundColor: lesson.color + '1E', borderColor: lesson.color + '44' }]}>
                                <Icon color={lesson.color} size={17} strokeWidth={1.8} />
                              </View>
                              <Typography variant="premiumLabel" color={lesson.color} style={{ flex: 1, marginLeft: 12 }}>{lesson.title}</Typography>
                            </View>
                            <View style={[s.lessonDivider, { backgroundColor: lesson.color + '20' }]} />
                            <Typography variant="bodySmall" style={{ lineHeight: 22, opacity: 0.85, color: textColor }}>{lesson.body}</Typography>
                          </View>
                        </Animated.View>
                      );
                    })}
                  </View>
                </Animated.View>

                {/* ── ENERGY TYPE ──────────────────────────── */}
                {relationshipEnergyType && (
                  <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <SectionTitle label="ENERGIA ZWIĄZKU" accent={accentB} />
                    <View style={[s.energyCard, { backgroundColor: isLight ? relationshipEnergyType.color + '0A' : relationshipEnergyType.color + '10', borderColor: relationshipEnergyType.color + '44' }]}>
                      <LinearGradient colors={[relationshipEnergyType.color + '18', 'transparent']} style={StyleSheet.absoluteFill as any} />
                      <View style={[s.energyBadge, { backgroundColor: relationshipEnergyType.color + '20', borderColor: relationshipEnergyType.color + '44' }]}>
                        <Typography variant="microLabel" color={relationshipEnergyType.color}>{relationshipEnergyType.symbol} TYP ZWIĄZKU</Typography>
                      </View>
                      <Typography style={{ fontSize: 22, fontWeight: '700', color: relationshipEnergyType.color, marginBottom: 10, marginTop: 12 }}>
                        {relationshipEnergyType.label}
                      </Typography>
                      <Typography variant="bodySmall" style={{ lineHeight: 22, color: textColor, opacity: 0.88, marginBottom: 14 }}>
                        {relationshipEnergyType.desc}
                      </Typography>
                      <View style={[s.energyPracticeBox, { backgroundColor: relationshipEnergyType.color + '12', borderColor: relationshipEnergyType.color + '30' }]}>
                        <Typography variant="microLabel" color={relationshipEnergyType.color} style={{ marginBottom: 6 }}>PRAKTYKA DLA TEGO WZORCA</Typography>
                        <Typography variant="caption" style={{ lineHeight: 20, color: textColor, opacity: 0.78 }}>{relationshipEnergyType.practice}</Typography>
                      </View>
                    </View>
                  </Animated.View>
                )}

                {/* ── ROADMAP ──────────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                  <SectionTitle label="MAPA FAZ ZWIĄZKU" accent={accentA} />
                  <View style={{ gap: 0 }}>
                    {roadmap.map((phase, idx) => {
                      const PhaseIcon = phase.icon;
                      const isExp = roadmapExpanded === idx;
                      return (
                        <Animated.View key={phase.phase} entering={FadeInDown.delay(idx * 55).springify()}>
                          <Pressable
                            style={[s.roadmapRow, {
                              borderColor: isExp ? phase.color + '55' : dividerColor,
                              backgroundColor: isExp ? (isLight ? phase.color + '0A' : phase.color + '0C') : cardBg,
                              borderTopLeftRadius: idx === 0 ? 18 : 0,
                              borderTopRightRadius: idx === 0 ? 18 : 0,
                              borderBottomLeftRadius: idx === roadmap.length - 1 ? 18 : 0,
                              borderBottomRightRadius: idx === roadmap.length - 1 ? 18 : 0,
                            }]}
                            onPress={() => setRoadmapExpanded(isExp ? null : idx)}
                          >
                            <View style={[s.roadmapBadge, { backgroundColor: phase.color + '20', borderColor: phase.color + '55' }]}>
                              <Typography style={{ fontSize: 12, color: phase.color, fontWeight: '800' }}>{phase.phase}</Typography>
                            </View>
                            <View style={{ flex: 1, marginLeft: 14 }}>
                              <View style={s.roadmapLabelRow}>
                                <Typography variant="premiumLabel" color={phase.color}>{phase.label}</Typography>
                                <View style={[s.roadmapTimeBadge, { backgroundColor: phase.color + '18' }]}>
                                  <Clock color={phase.color} size={10} strokeWidth={1.6} />
                                  <Typography variant="caption" style={{ color: phase.color, marginLeft: 4, fontSize: 10 }}>{phase.timeHint}</Typography>
                                </View>
                              </View>
                              <Typography variant="caption" style={{ color: subColor, marginTop: 3, lineHeight: 18 }} numberOfLines={isExp ? undefined : 2}>
                                {phase.desc}
                              </Typography>
                              {isExp && (
                                <View style={[s.roadmapGuidance, { backgroundColor: phase.color + '12', borderColor: phase.color + '30' }]}>
                                  <PhaseIcon color={phase.color} size={13} strokeWidth={1.7} />
                                  <Typography variant="caption" style={{ color: phase.color, flex: 1, marginLeft: 8, lineHeight: 18 }}>
                                    {phase.guidance}
                                  </Typography>
                                </View>
                              )}
                            </View>
                            <Typography style={{ fontSize: 13, color: phase.color, marginLeft: 8, opacity: 0.65 }}>{isExp ? '▲' : '▼'}</Typography>
                          </Pressable>
                        </Animated.View>
                      );
                    })}
                  </View>
                </Animated.View>

                {/* ── AI SYNASTRY ──────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                  <SectionTitle label="AI CZYTANIE SYNASTRII" accent={accentB} />
                  <Pressable
                    style={[s.aiCtaCard, { backgroundColor: isLight ? accentB + '0A' : accentB + '10', borderColor: accentB + '44', opacity: aiLoading ? 0.7 : 1 }]}
                    onPress={handleAiSynastry}
                    disabled={aiLoading || !aiAvailable}
                  >
                    <LinearGradient colors={[accentB + '18', 'transparent']} style={StyleSheet.absoluteFill as any} />
                    {aiLoading ? <ActivityIndicator color={accentB} size="small" /> : <Sparkles color={accentB} size={20} strokeWidth={1.8} />}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Typography variant="premiumLabel" color={accentB}>
                        {aiLoading ? 'Generuję czytanie...' : synastryCopy ? 'Wygeneruj ponownie' : 'Wygeneruj czytanie synastrii'}
                      </Typography>
                      <Typography variant="caption" style={{ opacity: 0.65, marginTop: 3, lineHeight: 18, color: subColor }}>
                        {aiAvailable ? 'AI połączy numerologię obu osób w spójną narrację.' : 'Skonfiguruj AI w ustawieniach, by odblokować.'}
                      </Typography>
                    </View>
                    {!aiLoading && <ArrowRight color={accentB + '88'} size={16} />}
                  </Pressable>

                  {synastryCopy !== '' && (
                    <Animated.View entering={FadeInDown.delay(60).springify()}>
                      <View style={[s.aiResultCard, { backgroundColor: isLight ? accentB + '06' : accentB + '0C', borderColor: accentB + '30' }]}>
                        <LinearGradient colors={[accentB + '0E', 'transparent']} style={StyleSheet.absoluteFill as any} />
                        <Typography variant="microLabel" color={accentB} style={{ marginBottom: 12 }}>✦ CZYTANIE SYNASTRII</Typography>
                        <Typography variant="bodySmall" style={{ lineHeight: 25, opacity: 0.88, color: textColor }}>{synastryCopy}</Typography>
                        <Pressable
                          style={[s.aiSaveBtn, { borderColor: accentB + '44' }]}
                          onPress={() => navigation.navigate('JournalEntry', {
                            prompt: `Czytanie synastrii z AI${partnerName.trim() ? ` dla relacji z ${partnerName.trim()}` : ''}:\n\n${synastryCopy}\n\nCo z tego odczytania rezonuje ze mną najbardziej?`,
                            type: 'reflection',
                          })}
                        >
                          <Typography variant="microLabel" color={accentB}>Zapisz w dzienniku</Typography>
                          <ArrowRight color={accentB} size={13} />
                        </Pressable>
                      </View>
                    </Animated.View>
                  )}
                </Animated.View>

                {/* ── AI ORACLE FULL READING ───────────────── */}
                <Animated.View entering={FadeInDown.delay(80).springify()}>
                  <SectionTitle label="AI ORACLE — PEŁNE CZYTANIE" accent={accentA} />
                  <Pressable
                    style={[s.aiCtaCard, { backgroundColor: isLight ? accentA + '0A' : accentA + '10', borderColor: accentA + '44', opacity: aiOracleLoading ? 0.7 : 1 }]}
                    onPress={handleAiOracle}
                    disabled={aiOracleLoading || !aiAvailable}
                  >
                    <LinearGradient colors={[accentA + '18', 'transparent']} style={StyleSheet.absoluteFill as any} />
                    {aiOracleLoading ? <ActivityIndicator color={accentA} size="small" /> : <Sparkles color={accentA} size={20} strokeWidth={1.8} />}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Typography variant="premiumLabel" color={accentA}>
                        {aiOracleLoading ? 'Oracle odczytuje połączenie...' : 'Oracle czytanie relacji'}
                      </Typography>
                      <Typography variant="caption" style={{ opacity: 0.65, marginTop: 3, lineHeight: 18, color: subColor }}>
                        Głęboki poetycki odczyt całości numerologicznej tej relacji.
                      </Typography>
                    </View>
                    {!aiOracleLoading && <ArrowRight color={accentA + '88'} size={16} />}
                  </Pressable>
                  {aiOracleCopy !== '' && (
                    <Animated.View entering={FadeInDown.delay(60).springify()}>
                      <View style={[s.aiResultCard, { backgroundColor: isLight ? accentA + '06' : accentA + '0C', borderColor: accentA + '30' }]}>
                        <LinearGradient colors={[accentA + '0E', 'transparent']} style={StyleSheet.absoluteFill as any} />
                        <Typography variant="microLabel" color={accentA} style={{ marginBottom: 12 }}>✦ ORACLE CZYTANIE RELACJI</Typography>
                        <Typography variant="bodySmall" style={{ lineHeight: 25, opacity: 0.88, color: textColor }}>{aiOracleCopy}</Typography>
                      </View>
                    </Animated.View>
                  )}
                </Animated.View>

                {/* ── AI PROMPTS ───────────────────────────── */}
                {relationshipAiPrompts.length > 0 && (
                  <Animated.View entering={FadeInDown.delay(80).springify()}>
                    <SectionTitle label="PYTANIA INTEGRUJĄCE" accent={accentB} />
                    {relationshipAiPrompts.map((item, idx) => (
                      <Pressable
                        key={item.title}
                        style={[s.navRow, { borderTopColor: dividerColor, borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth }]}
                        onPress={() => navigation.navigate('JournalEntry', { prompt: item.context, type: 'reflection' })}
                      >
                        <View style={[s.navIconBox, { backgroundColor: accentB + '14' }]}>
                          <Brain color={accentB} size={15} />
                        </View>
                        <View style={s.navText}>
                          <Typography variant="cardTitle" style={{ color: textColor }}>{item.title}</Typography>
                          <Typography variant="caption" style={[s.navDesc, { color: subColor }]}>{item.copy}</Typography>
                        </View>
                        <ArrowRight color={accentB + '88'} size={14} />
                      </Pressable>
                    ))}
                  </Animated.View>
                )}

                {/* ── GROWTH QUESTIONS ─────────────────────── */}
                <Animated.View entering={FadeInDown.delay(80).springify()}>
                  <SectionTitle label="CIĄGŁOŚĆ ZWIĄZKU" accent={accentA} />
                  <View style={[s.growthCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    {GROWTH_QUESTIONS.map((q, idx) => (
                      <Pressable
                        key={idx}
                        style={[s.growthRow, idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: dividerColor }]}
                        onPress={() => navigation.navigate('JournalEntry', {
                          prompt: `${q}\n\n(Kontekst: relacja z ${partnerName.trim() || 'tą osobą'}, wspólna energia ${relationshipMatrix.center})`,
                          type: 'reflection',
                        })}
                      >
                        <View style={[s.growthNumBadge, { backgroundColor: accentA + '18', borderColor: accentA + '40' }]}>
                          <Typography style={{ fontSize: 11, fontWeight: '800', color: accentA }}>{String(idx + 1).padStart(2, '0')}</Typography>
                        </View>
                        <Typography variant="bodySmall" style={{ flex: 1, lineHeight: 22, opacity: 0.86, color: textColor }}>{q}</Typography>
                        <ArrowRight color={accentA + '66'} size={13} />
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>

                {/* ── PARTNER PRACTICES ────────────────────── */}
                <Animated.View entering={FadeInDown.delay(80).springify()}>
                  <SectionTitle label="PRAKTYKI DLA PARY" accent={accentB} />
                  <View style={{ gap: 12 }}>
                    {PARTNER_PRACTICES.map((p, idx) => (
                      <Animated.View key={p.label} entering={FadeInDown.delay(idx * 70).springify()}>
                        <Pressable
                          style={[s.practiceCard, { backgroundColor: isLight ? p.color + '08' : p.color + '0D', borderColor: p.color + '35' }]}
                          onPress={() => navigation.navigate(p.route)}
                        >
                          <LinearGradient colors={[p.color + '10', 'transparent']} style={StyleSheet.absoluteFill as any} />
                          <View style={s.practiceHeader}>
                            <Typography style={{ fontSize: 26, marginRight: 12 }}>{p.icon}</Typography>
                            <Typography variant="premiumLabel" color={p.color} style={{ flex: 1 }}>{p.label}</Typography>
                            <ArrowRight color={p.color + '88'} size={15} />
                          </View>
                          <View style={[s.practiceDivider, { backgroundColor: p.color + '20' }]} />
                          <Typography variant="caption" style={{ lineHeight: 20, color: subColor }}>{p.desc}</Typography>
                        </Pressable>
                      </Animated.View>
                    ))}
                  </View>
                </Animated.View>

                {/* ── FURTHER LINKS ─────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(80).springify()}>
                  <SectionTitle label="DALSZE PARTNEROWE WEJŚCIA" accent={accentA} />
                  {[
                    { label: 'Pełna zgodność', desc: 'Przejdź do szerszej narracji relacyjnej — żywioły, znaki, harmonia.', onPress: () => navigation.navigate('Compatibility', { seededPartnerName: partnerName.trim(), seededPartnerBirthDate: partnerBirthDate }) },
                    { label: 'Tarot dla dwojga', desc: 'Zobacz tę więź przez symbol, napięcie i ukryty ruch pod powierzchnią.', onPress: () => navigation.navigate('PartnerTarot') },
                    { label: 'Notatka po matrycy', desc: 'Zapisz jeden wzorzec, który między Wami wraca najmocniej.', onPress: () => navigation.navigate('JournalEntry', { prompt: `Analizuję partnerową matrycę relacji z ${partnerName.trim() || 'tą osobą'}. Wspólne centrum to ${relationshipMatrix.center}, relacje ${relationshipMatrix.right}, lekcja ${relationshipMatrix.bottom}, działanie ${relationshipMatrix.top}.\n\nKtóry wzorzec między nami wraca najmocniej?`, type: 'reflection' }) },
                    { label: 'Udostępnij skrót relacji', desc: 'Wyślij elegancki skrót partnerowej matrycy.', onPress: handleShare },
                  ].map((item, idx, arr) => (
                    <Pressable
                      key={item.label}
                      style={[s.navRow, { borderTopColor: dividerColor, borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth }]}
                      onPress={item.onPress}
                    >
                      <View style={[s.navIconBox, { backgroundColor: accentA + '14' }]}>
                        <ArrowRight color={accentA} size={15} />
                      </View>
                      <View style={s.navText}>
                        <Typography variant="cardTitle" style={{ color: textColor }}>{item.label}</Typography>
                        <Typography variant="caption" style={[s.navDesc, { color: subColor }]}>{item.desc}</Typography>
                      </View>
                      <ArrowRight color={accentA + '88'} size={13} />
                    </Pressable>
                  ))}
                </Animated.View>
              </>
            ) : (
              /* ── EMPTY STATE ────────────────────────── */
              <View style={s.emptyState}>
                <View style={[s.emptyIcon, { backgroundColor: accentA + '14', borderColor: accentA + '30' }]}>
                  <Users color={accentA} size={28} />
                </View>
                <Typography variant="premiumLabel" color={accentA} style={{ marginBottom: 8, textAlign: 'center' }}>
                  Uruchom partnerowy kontekst
                </Typography>
                <Typography variant="bodySmall" style={{ color: subColor, textAlign: 'center', lineHeight: 22 }}>
                  Wystarczą imię i data urodzenia obu osób, by otworzyć pierwszą warstwę relacyjnej matrycy.
                </Typography>
              </View>
            )}

            {/* ── CO DALEJ? ─────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginTop: 24 }}>
              <SectionTitle label="CO DALEJ?" accent={accentB} />
              {[
                { label: 'Pełna zgodność', desc: 'Przejdź do szerszej narracji relacyjnej i żywiołów między Wami.', onPress: () => navigation.navigate('Compatibility') },
                { label: 'Notatka relacyjna', desc: 'Zapisz wzorzec, który wraca — z zachowanym kontekstem matrycy.', onPress: () => navigation.navigate('JournalEntry', { prompt: `Pracuję z partnerową matrycą${partnerName.trim() ? ` dla ${partnerName.trim()}` : ''}. Co chcę lepiej rozumieć?`, type: 'reflection' }) },
                { label: 'Horoskop partnerski', desc: 'Wróć do astrologicznej warstwy tej osoby — znak, żywioł, ton relacji.', onPress: () => navigation.navigate('PartnerHoroscope') },
              ].map((item, idx) => (
                <Pressable
                  key={item.label}
                  style={[s.navRow, { borderTopColor: dividerColor, borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth }]}
                  onPress={item.onPress}
                >
                  <View style={[s.navIconBox, { backgroundColor: accentB + '14' }]}>
                    <ArrowRight color={accentB} size={15} />
                  </View>
                  <View style={s.navText}>
                    <Typography variant="cardTitle" style={{ color: textColor }}>{item.label}</Typography>
                    <Typography variant="caption" style={[s.navDesc, { color: subColor }]}>{item.desc}</Typography>
                  </View>
                  <ArrowRight color={accentB + '88'} size={13} />
                </Pressable>
              ))}
            </Animated.View>

            <EndOfContentSpacer size="standard" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* DateWheelPicker is now inline in the input cards — no sheet needed */}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', height: 68, paddingHorizontal: layout.padding.screen },
  headerBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  eyebrow: { letterSpacing: 2, opacity: 0.9 },
  headerTitle: { marginTop: 2 },

  scroll: { flexGrow: 1, paddingHorizontal: layout.padding.screen, paddingTop: 4 },

  // Hero subtitle
  heroSubtitle: { paddingHorizontal: 8, marginBottom: 20, marginTop: -4 },

  // Section title
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 22, gap: 10 },
  sectionTitleLine: { flex: 1, height: 1 },
  sectionTitleText: { letterSpacing: 1.5, fontSize: 11 },

  // Input cards
  inputCardsRow: { gap: 0, marginBottom: 12 },
  inputCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 0 },
  inputCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  inputCardDot: { width: 8, height: 8, borderRadius: 4 },
  inputCardsDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 12 },
  inputCardsDividerLine: { flex: 1, height: 1 },
  heartBadge: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  datePicker: { flexDirection: 'row', alignItems: 'center', minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, marginTop: 10 },
  lpBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 'auto' as any },

  hintBox: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },

  // Gauge
  gaugeCard: { borderRadius: 22, borderWidth: 1, padding: 20, overflow: 'hidden', alignItems: 'center', marginBottom: 4 },
  gaugeBadgeRow: { flexDirection: 'row', marginBottom: 8 },
  gaugeBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4 },
  gaugeDivider: { height: 1, alignSelf: 'stretch', marginVertical: 14 },

  // 3 stat chips
  statChipsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  statChip: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 14, alignItems: 'center', overflow: 'hidden' },

  // Punkt styku
  punktCard: { borderRadius: 22, borderWidth: 1, padding: 22, overflow: 'hidden', alignItems: 'center', marginBottom: 4 },
  punktNumBadge: { width: 90, height: 90, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  punktDivider: { height: 1, alignSelf: 'stretch', marginVertical: 14 },

  // Aspect cards
  aspectCard: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 10, overflow: 'hidden' },
  aspectRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  aspectIconBox: { width: 36, height: 36, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  aspectBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  aspectDivider: { height: 1, marginBottom: 10 },

  // Progress bar
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 6, flex: 1 },
  progressFill: { height: 4, borderRadius: 2 },

  // Comparison table
  compCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  compRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  compHeaderRow: { borderBottomWidth: 1, paddingVertical: 12 },
  compLabel: { flex: 1, paddingRight: 6 },
  compCell: { width: 52, height: 42, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  compMidCell: { width: 30, alignItems: 'center' },
  compLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 10, borderTopWidth: 1 },
  compLegendItem: { flexDirection: 'row', alignItems: 'center' },

  // Chart
  chartCard: { borderRadius: 20, borderWidth: 1, padding: 16, alignItems: 'center', marginBottom: 4 },

  // Karmic
  karmicCard: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
  karmicHeader: { flexDirection: 'row', alignItems: 'center' },
  karmicBadge: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  karmicDivider: { height: 1, marginVertical: 12 },

  // Axes
  axesRow: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden', marginBottom: 4 },
  axesItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  axesDivider: { width: 1, marginVertical: 4 },

  // Lessons
  lessonCard: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
  lessonHeader: { flexDirection: 'row', alignItems: 'center' },
  lessonIconBox: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  lessonDivider: { height: 1, marginVertical: 12 },

  // Energy type
  energyCard: { borderRadius: 22, borderWidth: 1, padding: 20, overflow: 'hidden', marginBottom: 4 },
  energyBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' },
  energyPracticeBox: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 4 },

  // Roadmap
  roadmapRow: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, padding: 14, paddingLeft: 16 },
  roadmapBadge: { width: 32, height: 32, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  roadmapLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  roadmapTimeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  roadmapGuidance: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 10 },

  // AI CTA
  aiCtaCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden', marginBottom: 10 },
  aiResultCard: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden', marginBottom: 4 },
  aiSaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 10, borderWidth: 1, borderRadius: 12 },

  // Growth questions
  growthCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  growthRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
  growthNumBadge: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Practices
  practiceCard: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
  practiceHeader: { flexDirection: 'row', alignItems: 'center' },
  practiceDivider: { height: 1, marginVertical: 12 },

  // Nav rows
  navRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 12 },
  navIconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  navText: { flex: 1 },
  navDesc: { marginTop: 4, lineHeight: 19 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
});
