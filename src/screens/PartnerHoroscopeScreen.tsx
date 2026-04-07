// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withTiming, withSequence, withDelay, interpolate, Easing,
} from 'react-native-reanimated';
import {
  ActivityIndicator, Dimensions, KeyboardAvoidingView,
  Platform, Pressable, ScrollView, StyleSheet, View,
} from 'react-native';
import { MysticalInput } from '../components/MysticalInput';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight, Calendar, ChevronLeft, Heart, HeartHandshake,
  Orbit, Sparkles, Star, Users, Wand2, X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { getZodiacSign, ZODIAC_LABELS, ZODIAC_SYMBOLS, ZodiacSign } from '../features/horoscope/utils/astrology';
import { CelestialBackdrop } from '../components/CelestialBackdrop';
import { Typography } from '../components/Typography';
import { PremiumDatePickerSheet } from '../components/PremiumDatePickerSheet';
import { DateWheelPicker } from '../components/DateWheelPicker';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { AiService } from '../core/services/ai.service';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Defs, Ellipse, Line, Path, Polygon, RadialGradient as SvgRadialGradient, Stop, G, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const AnimGaugeCircle = Animated.createAnimatedComponent(Circle);

// ── DUAL ZODIAC WHEEL WIDGET ────────────────────────────────────
const DualZodiacWheel = ({ accent }: { accent: string }) => {
  const rot1 = useSharedValue(0);
  const rot2 = useSharedValue(0);
  const pulse = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    rot1.value = withRepeat(withTiming(360, { duration: 18000, easing: Easing.linear }), -1, false);
    rot2.value = withRepeat(withTiming(-360, { duration: 24000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 2000 }), withTiming(0, { duration: 2000 })),
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
    transform: [{ perspective: 600 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }],
  }));
  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rot1.value}deg` }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rot2.value}deg` }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.30, 0.80]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.92, 1.08]) }],
  }));

  const sz = 200;
  const cx = sz / 2;
  const signs = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

  return (
    <View style={{ height: 210, alignItems: 'center', justifyContent: 'center', marginVertical: 8 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={outerStyle}>
          {/* Base SVG — two zodiac wheel segments */}
          <Svg width={sz} height={sz}>
            <Defs>
              <SvgRadialGradient id="wheelGrad" cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor={accent} stopOpacity="0.20" />
                <Stop offset="0.6" stopColor={accent} stopOpacity="0.06" />
                <Stop offset="1" stopColor={accent} stopOpacity="0" />
              </SvgRadialGradient>
            </Defs>
            {/* Background glow */}
            <Circle cx={cx} cy={cx} r={90} fill="url(#wheelGrad)" />
            {/* Outer wheel ring */}
            <Circle cx={cx} cy={cx} r={84} fill="none" stroke={accent + '25'} strokeWidth={1.2} />
            {/* Middle ring */}
            <Circle cx={cx} cy={cx} r={64} fill="none" stroke={accent + '18'} strokeWidth={0.8} />
            {/* Inner ring */}
            <Circle cx={cx} cy={cx} r={44} fill={accent + '0A'} stroke={accent + '30'} strokeWidth={1} />
            {/* Spoke lines */}
            {Array(12).fill(0).map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const x1 = cx + 44 * Math.cos(angle);
              const y1 = cx + 44 * Math.sin(angle);
              const x2 = cx + 84 * Math.cos(angle);
              const y2 = cx + 84 * Math.sin(angle);
              return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent + '20'} strokeWidth={0.6} />;
            })}
            {/* Zodiac symbols on ring */}
            {signs.map((sign, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const tx = cx + 73 * Math.cos(angle);
              const ty = cx + 73 * Math.sin(angle);
              return (
                <SvgText key={i} x={tx} y={ty + 4} fontSize="10" fill={accent} textAnchor="middle" opacity={0.60}>{sign}</SvgText>
              );
            })}
            {/* Center glow dot */}
            <Circle cx={cx} cy={cx} r={10} fill={accent + '30'} />
            <Circle cx={cx} cy={cx} r={4} fill={accent} opacity={0.9} />
          </Svg>

          {/* Rotating outer planet A dots */}
          <Animated.View style={[StyleSheet.absoluteFill, ring1Style, { alignItems: 'center', justifyContent: 'center' }]}>
            <Svg width={sz} height={sz}>
              <Circle cx={cx + 84} cy={cx} r={6} fill={accent} opacity={0.80} />
              <Circle cx={cx - 60} cy={cx - 60} r={4.5} fill={accent} opacity={0.55} />
              <Circle cx={cx + 30} cy={cx - 80} r={3.5} fill={accent} opacity={0.40} />
            </Svg>
          </Animated.View>

          {/* Counter-rotating inner ring B */}
          <Animated.View style={[StyleSheet.absoluteFill, ring2Style, { alignItems: 'center', justifyContent: 'center' }]}>
            <Svg width={sz} height={sz}>
              <Circle cx={cx} cy={cx - 64} r={5} fill="#C4B5FD" opacity={0.72} />
              <Circle cx={cx + 45} cy={cx + 45} r={4} fill="#C4B5FD" opacity={0.50} />
              <Circle cx={cx - 55} cy={cx + 30} r={3} fill="#C4B5FD" opacity={0.38} />
            </Svg>
          </Animated.View>

          {/* Center pulse */}
          <Animated.View style={[StyleSheet.absoluteFill, pulseStyle, { alignItems: 'center', justifyContent: 'center' }]}>
            <Svg width={sz} height={sz}>
              <Circle cx={cx} cy={cx} r={18} fill={accent} opacity={0.12} />
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

const CompatGauge = ({ score, accent }: { score: number; accent: string }) => {
  const progress = useSharedValue(0);
  useEffect(() => { progress.value = withDelay(400, withTiming(score / 100, { duration: 1400 })); }, [score]);
  const animProps = useAnimatedProps(() => ({ strokeDashoffset: GAUGE_CIRCUM * (1 - progress.value) }));
  const scoreColor = score >= 80 ? '#22C55E' : score >= 65 ? '#84CC16' : score >= 50 ? '#EAB308' : score >= 35 ? '#F97316' : '#EF4444';
  const sz = 164; const c = sz / 2;
  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <Svg width={sz} height={sz}>
        <Defs>
          <SvgRadialGradient id="cGlow" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={scoreColor} stopOpacity="0.20" />
            <Stop offset="1" stopColor={scoreColor} stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Circle cx={c} cy={c} r={GAUGE_R + 8} fill="url(#cGlow)" />
        <Circle cx={c} cy={c} r={GAUGE_R} fill="none" stroke={scoreColor + '20'} strokeWidth={12} strokeLinecap="round" />
        <AnimGaugeCircle cx={c} cy={c} r={GAUGE_R} fill="none" stroke={scoreColor} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={GAUGE_CIRCUM} animatedProps={animProps} transform={`rotate(-90 ${c} ${c})`} />
        <Circle cx={c} cy={c} r={GAUGE_R - 18} fill={scoreColor + '0E'} stroke={scoreColor + '22'} strokeWidth={1} />
      </Svg>
      <View style={StyleSheet.absoluteFill as any} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Typography style={{ fontSize: 38, fontWeight: '800', color: scoreColor, lineHeight: 44 }}>{score}</Typography>
          <Typography style={{ fontSize: 10, color: scoreColor, fontWeight: '700', opacity: 0.85 }}>%</Typography>
        </View>
      </View>
    </View>
  );
};

// ── HEXAGON RADAR CHART ────────────────────────────────────────
const RadarChart = ({ scores, labels, accent, subColor }: { scores: number[]; labels: string[]; accent: string; subColor: string }) => {
  const SIZE = 158; const cx = SIZE / 2; const cy = SIZE / 2; const R = 54; const n = scores.length;
  const getPoint = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };
  const outerPts = Array(n).fill(0).map((_, i) => getPoint(i, R));
  const scorePts = scores.map((s, i) => getPoint(i, (s / 10) * R));
  const scoreStr = scorePts.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <Svg width={SIZE} height={SIZE + 20}>
        {[0.25, 0.5, 0.75, 1].map(frac => {
          const pts = Array(n).fill(0).map((_, i) => getPoint(i, R * frac));
          return <Polygon key={frac} points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={accent + '20'} strokeWidth={0.8} />;
        })}
        {outerPts.map((p, i) => <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={accent + '22'} strokeWidth={0.7} />)}
        <Polygon points={scoreStr} fill={accent + '28'} stroke={accent} strokeWidth={1.5} />
        {scorePts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={4} fill={accent} opacity={0.85} />)}
        {outerPts.map((p, i) => {
          const lx = cx + (R + 14) * Math.cos((Math.PI * 2 * i) / n - Math.PI / 2);
          const ly = cy + (R + 14) * Math.sin((Math.PI * 2 * i) / n - Math.PI / 2);
          return <SvgText key={i} x={lx} y={ly + 3} fontSize="9" fill={subColor} textAnchor="middle">{labels[i]}</SvgText>;
        })}
      </Svg>
    </View>
  );
};

// ── DATA ──────────────────────────────────────────────────────
const ZODIAC_ELEMENT: Record<ZodiacSign, string> = {
  Aries: 'Ogień', Taurus: 'Ziemia', Gemini: 'Powietrze', Cancer: 'Woda',
  Leo: 'Ogień', Virgo: 'Ziemia', Libra: 'Powietrze', Scorpio: 'Woda',
  Sagittarius: 'Ogień', Capricorn: 'Ziemia', Aquarius: 'Powietrze', Pisces: 'Woda',
};

const ELEMENT_PAIR_DYNAMICS: Record<string, { title: string; body: string; quality: string }> = {
  'Ogień-Ogień': { title: 'Dwa ognie — intensywność bez tłumika', body: 'Oboje macie impet, ambicję i potrzebę prowadzenia. Związek płonie jasno, ale wymaga świadomego chłodzenia i przestrzeni dla każdego z was osobno.', quality: 'żarliwy' },
  'Ogień-Ziemia': { title: 'Ogień i ziemia — ruch kontra fundament', body: 'Ogień wnosi wizję i tempo, ziemia — cierpliwość i trwałość. Napięcie między impulsem a stabilnością może być motorem wzrostu.', quality: 'komplementarny' },
  'Ogień-Powietrze': { title: 'Ogień i powietrze — wzajemne podsycanie', body: 'Powietrze roznosi płomień, ogień ogrzewa idee. Wspólna ciekawość i energia tworzą silną iskrę.', quality: 'pobudzający' },
  'Ogień-Woda': { title: 'Ogień i woda — napięcie przemiany', body: 'Woda gasi, ogień paruje — ale razem tworzą parę, która jest potężniejsza niż każde z osobna.', quality: 'transformujący' },
  'Ziemia-Ziemia': { title: 'Dwie ziemie — siła i pułapka stałości', body: 'Razem budujecie solidnie. Wspólna lojalność i pragmatyzm tworzą trwałe fundamenty, choć rutyna może przykryć bliskość.', quality: 'stabilny' },
  'Ziemia-Powietrze': { title: 'Ziemia i powietrze — uziemienie kontra lotność', body: 'Powietrze przynosi świeżość i nowe perspektywy, ziemia — sprawdzony grunt.', quality: 'uzupełniający' },
  'Ziemia-Woda': { title: 'Ziemia i woda — naturalny sojusz', body: 'Woda odżywia ziemię, ziemia nadaje wodzie kształt. To jedna z bardziej harmonijnych kombinacji.', quality: 'harmonijny' },
  'Powietrze-Powietrze': { title: 'Dwa powietrza — przestrzeń i dialog', body: 'Intelektualny taniec, który nigdy nie nudzi. Oboje cenicie wolność i rozmowę.', quality: 'stymulujący' },
  'Powietrze-Woda': { title: 'Powietrze i woda — myśl spotyka głębię', body: 'Umysł i serce pracują w różnym tempie. Razem tworzycie pełniejszy obraz.', quality: 'pogłębiający' },
  'Woda-Woda': { title: 'Dwie wody — ocean emocji', body: 'Głęboka empatia i intuicyjne zrozumienie bez słów. Relacja potrzebuje też wyraźnych granic.', quality: 'głęboki' },
};

const SYNASTRIA_PLANETS: Record<ZodiacSign, { sun: number; moon: number; venus: number; mars: number; rising: number }> = {
  Aries: { sun: 1, moon: 7, venus: 5, mars: 1, rising: 4 },
  Taurus: { sun: 2, moon: 2, venus: 2, mars: 8, rising: 2 },
  Gemini: { sun: 3, moon: 11, venus: 3, mars: 3, rising: 1 },
  Cancer: { sun: 4, moon: 4, venus: 8, mars: 4, rising: 10 },
  Leo: { sun: 5, moon: 1, venus: 6, mars: 5, rising: 7 },
  Virgo: { sun: 6, moon: 6, venus: 4, mars: 6, rising: 3 },
  Libra: { sun: 7, moon: 3, venus: 1, mars: 7, rising: 6 },
  Scorpio: { sun: 8, moon: 8, venus: 7, mars: 2, rising: 9 },
  Sagittarius: { sun: 9, moon: 5, venus: 9, mars: 9, rising: 5 },
  Capricorn: { sun: 10, moon: 10, venus: 10, mars: 10, rising: 8 },
  Aquarius: { sun: 11, moon: 9, venus: 11, mars: 11, rising: 2 },
  Pisces: { sun: 12, moon: 12, venus: 12, mars: 12, rising: 11 },
};

const ASPECT_DESCRIPTIONS: Record<string, { title: string; desc: string; harmony: number }> = {
  conjunction: { title: 'Koniunkcja — scalenie energii', desc: 'Energie łączą się w jednym miejscu, tworząc intensywną wspólną siłę.', harmony: 8 },
  sextile: { title: 'Sekstyl — płynna wymiana', desc: 'Energie wzajemnie się wspierają i inspirują. Łatwa komunikacja.', harmony: 9 },
  square: { title: 'Kwadrat — dynamiczne napięcie', desc: 'Napięcie, które wymaga świadomej pracy i prowadzi do wzrostu.', harmony: 5 },
  trine: { title: 'Trygon — harmonia i dar', desc: 'Naturalna harmonia i płynność. Energie płyną razem bez wysiłku.', harmony: 10 },
  opposition: { title: 'Opozycja — lustrzane dopełnienie', desc: 'Dwa bieguny przyciągające się i odpychające. Klucz to integracja różnic.', harmony: 6 },
};

const getAspectType = (myPos: number, partnerPos: number): string => {
  const diff = Math.abs(myPos - partnerPos) % 12;
  const norm = diff > 6 ? 12 - diff : diff;
  if (norm === 0) return 'conjunction';
  if (norm === 2) return 'sextile';
  if (norm === 3) return 'square';
  if (norm === 4) return 'trine';
  if (norm === 6) return 'opposition';
  if (norm === 1 || norm === 5) return 'sextile';
  return 'square';
};

const getCompatibilityScores = (mySign: ZodiacSign, partnerSign: ZodiacSign) => {
  const myEl = ZODIAC_ELEMENT[mySign]; const pEl = ZODIAC_ELEMENT[partnerSign];
  const elementHarmony: Record<string, number> = {
    'Ogień-Ogień': 7, 'Ogień-Powietrze': 9, 'Ogień-Ziemia': 5, 'Ogień-Woda': 6,
    'Ziemia-Ziemia': 8, 'Ziemia-Woda': 9, 'Ziemia-Powietrze': 5,
    'Powietrze-Powietrze': 7, 'Powietrze-Woda': 6, 'Woda-Woda': 8,
  };
  const key = myEl === pEl ? `${myEl}-${myEl}` : [myEl, pEl].sort().join('-');
  const base = elementHarmony[key] || 6;
  const signDist = Math.abs(Object.keys(ZODIAC_ELEMENT).indexOf(mySign) - Object.keys(ZODIAC_ELEMENT).indexOf(partnerSign)) % 12;
  return {
    emocje: Math.min(10, base + (signDist === 4 ? 2 : signDist === 2 ? 1 : 0)),
    komunikacja: Math.min(10, base + (myEl === 'Powietrze' || pEl === 'Powietrze' ? 2 : 0)),
    wartości: Math.min(10, base + (myEl === pEl ? 2 : 0)),
    namiętność: Math.min(10, 5 + (myEl === 'Ogień' || pEl === 'Ogień' ? 3 : myEl === 'Woda' || pEl === 'Woda' ? 2 : 1)),
    wzrost: Math.min(10, 6 + (signDist === 6 ? 2 : signDist === 3 ? 1 : 0)),
    stabilność: Math.min(10, base + (myEl === 'Ziemia' || pEl === 'Ziemia' ? 2 : 0)),
  };
};

const getRelationshipCycle = (birthDateA: string, birthDateB: string) => {
  const sumDigits = (n: number): number => {
    while (n > 9 && n !== 11 && n !== 22) n = String(n).split('').reduce((a, d) => a + Number(d), 0);
    return n;
  };
  const dateToNum = (d: string) => { const dt = new Date(d); if (isNaN(dt.getTime())) return 1; return sumDigits(dt.getFullYear() + dt.getMonth() + 1 + dt.getDate()); };
  const combined = sumDigits(dateToNum(birthDateA) + dateToNum(birthDateB));
  const cycleYear = sumDigits(combined + sumDigits(new Date().getFullYear()));
  const phases = [
    { phase: '1', name: 'Zaczynanie', desc: 'Czas nowych początków i odważnych kroków we wspólnym kierunku.', color: '#F59E0B' },
    { phase: '2', name: 'Budowanie', desc: 'Czas wzajemnego zrozumienia, cierpliwości i wzmacniania więzi.', color: '#34D399' },
    { phase: '3', name: 'Tworzenie', desc: 'Kreatywna i radosna energia — ekspresja siebie i ekspansja relacji.', color: '#818CF8' },
    { phase: '4', name: 'Testowanie', desc: 'Wyzwania, które wzmacniają lub ujawniają słabe punkty.', color: '#F97316' },
    { phase: '5', name: 'Wolność', desc: 'Zmiana i poszerzenie horyzontów. Każde z was potrzebuje przestrzeni.', color: '#EC4899' },
    { phase: '6', name: 'Integracja', desc: 'Czas miłości, troski i głębszego zakorzenienia.', color: '#60A5FA' },
    { phase: '7', name: 'Refleksja', desc: 'Wewnętrzna analiza i duchowe pogłębienie relacji.', color: '#A78BFA' },
    { phase: '8', name: 'Siła', desc: 'Manifestacja i siła — czas zbiorów i wyników.', color: '#F59E0B' },
    { phase: '9', name: 'Domknięcie', desc: 'Zakończenie cyklu, transformacja i gotowość na nowy rozdział.', color: '#FB7185' },
  ];
  return phases[(cycleYear - 1) % 9];
};

const overallCompatibility = (mySign: ZodiacSign, partnerSign: ZodiacSign): number => {
  const ORDER: ZodiacSign[] = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const d = Math.min(Math.abs(ORDER.indexOf(mySign) - ORDER.indexOf(partnerSign)), 12 - Math.abs(ORDER.indexOf(mySign) - ORDER.indexOf(partnerSign)));
  const base = [88, 62, 74, 52, 90, 66, 68][d] ?? 65;
  const eA = ZODIAC_ELEMENT[mySign]; const eB = ZODIAC_ELEMENT[partnerSign];
  const adj = eA === eB ? 6 : (eA === 'Ogień' && eB === 'Powietrze') || (eB === 'Ogień' && eA === 'Powietrze') ? 5 : (eA === 'Ziemia' && eB === 'Woda') || (eB === 'Ziemia' && eA === 'Woda') ? 5 : (eA === 'Ogień' && eB === 'Woda') || (eB === 'Ogień' && eA === 'Woda') ? -4 : 0;
  return Math.max(28, Math.min(98, base + adj));
};

const SCORE_COLOR = (s: number): string => { if (s >= 80) return '#22C55E'; if (s >= 65) return '#84CC16'; if (s >= 50) return '#EAB308'; if (s >= 35) return '#F97316'; return '#EF4444'; };
const SCORE_LABEL = (s: number): string => { if (s >= 80) return 'Harmonia'; if (s >= 65) return 'Zgodność'; if (s >= 50) return 'Napięcie'; if (s >= 35) return 'Wyzwanie'; return 'Starcie'; };
const RELATION_TYPE = (s: number): string => { if (s >= 85) return 'Płomień'; if (s >= 75) return 'Harmonia'; if (s >= 62) return 'Napięcie twórcze'; if (s >= 50) return 'Kontrast'; return 'Trudna lekcja'; };

const RELATIONSHIP_PRACTICES = [
  { title: 'Rytuał słuchania', desc: 'Każde z was mówi przez 5 minut bez przerywania — tylko słuchasz. Potem zamieniacie się rolami.', timing: 'Najlepiej w niedzielny wieczór', icon: '🌿', color: '#34D399' },
  { title: 'Wspólna intencja tygodnia', desc: 'Ustalcie jedną wspólną intencję na najbliższy tydzień. Na koniec tygodnia wspólnie oceńcie.', timing: 'Poniedziałek rano', icon: '✨', color: '#818CF8' },
  { title: 'Pudełko wdzięczności', desc: 'Każdego dnia wrzucajcie do pudełka jedną rzecz, za którą jesteście wdzięczni tej drugiej osobie.', timing: 'Codziennie, przed snem', icon: '💛', color: '#F59E0B' },
];

const ZODIAC_ORDER: ZodiacSign[] = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

// ── SECTION HEADING COMPONENT ──────────────────────────────────
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
    <View style={[s.progressTrack, { backgroundColor: color + '22' }]}>
      <Animated.View style={[s.progressFill, barStyle, { backgroundColor: color }]} />
    </View>
  );
};

// ── MAIN SCREEN ────────────────────────────────────────────────
export const PartnerHoroscopeScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { isLight } = useTheme();
  const aiAvailable = AiService.isLaunchAvailable();
  const scrollRef = useRef<ScrollView>(null);

  const [partnerName, setPartnerName] = useState('');
  const [partnerBirthDate, setPartnerBirthDate] = useState('');
  const [pickerMode, setPickerMode] = useState<'birthDate' | null>(null);
  const [myPickerVisible, setMyPickerVisible] = useState(false);
  // DateWheelPicker state for partner birth date
  const [ptDay,   setPtDay  ] = useState(1);
  const [ptMonth, setPtMonth] = useState(1);
  const [ptYear,  setPtYear ] = useState(1990);
  const [aiSynastria, setAiSynastria] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Theme-aware colors
  const accent = isLight ? '#6D28D9' : '#A78BFA';
  const accentWarm = isLight ? '#BE185D' : '#F472B6';
  const textColor = isLight ? '#1A1025' : '#F0EBF8';
  const subColor = isLight ? '#5A4070' : '#C4B5E0';
  const cardBg = isLight ? 'rgba(109,40,217,0.05)' : 'rgba(167,139,250,0.07)';
  const cardBorder = isLight ? 'rgba(109,40,217,0.12)' : 'rgba(167,139,250,0.12)';
  const dividerColor = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.07)';

  const mySign: ZodiacSign | null = useMemo(() => {
    try { return userData.birthDate ? getZodiacSign(userData.birthDate) : null; } catch { return null; }
  }, [userData.birthDate]);

  const partnerSign: ZodiacSign | null = useMemo(() => {
    try { return partnerBirthDate ? getZodiacSign(partnerBirthDate) : null; } catch { return null; }
  }, [partnerBirthDate]);

  const elementDynamic = useMemo(() => {
    if (!mySign || !partnerSign) return null;
    const myEl = ZODIAC_ELEMENT[mySign]; const pEl = ZODIAC_ELEMENT[partnerSign];
    const key = myEl === pEl ? `${myEl}-${myEl}` : [myEl, pEl].sort().join('-');
    return ELEMENT_PAIR_DYNAMICS[key] ?? null;
  }, [mySign, partnerSign]);

  const synastriaAspects = useMemo(() => {
    if (!mySign || !partnerSign) return null;
    const myPlanets = SYNASTRIA_PLANETS[mySign]; const partnerPlanets = SYNASTRIA_PLANETS[partnerSign];
    return [
      { planet: 'Słońce', myPos: myPlanets.sun, partnerPos: partnerPlanets.sun, label: '☀️' },
      { planet: 'Księżyc', myPos: myPlanets.moon, partnerPos: partnerPlanets.moon, label: '🌙' },
      { planet: 'Wenus', myPos: myPlanets.venus, partnerPos: partnerPlanets.venus, label: '♀' },
      { planet: 'Mars', myPos: myPlanets.mars, partnerPos: partnerPlanets.mars, label: '♂' },
      { planet: 'Ascendent', myPos: myPlanets.rising, partnerPos: partnerPlanets.rising, label: '⬆' },
    ].map(p => {
      const aspectKey = getAspectType(p.myPos, p.partnerPos);
      return { ...p, aspectKey, ...ASPECT_DESCRIPTIONS[aspectKey] };
    });
  }, [mySign, partnerSign]);

  const compatibilityScores = useMemo(() => {
    if (!mySign || !partnerSign) return null;
    return getCompatibilityScores(mySign, partnerSign);
  }, [mySign, partnerSign]);

  const relationshipCycle = useMemo(() => {
    if (!userData.birthDate || !partnerBirthDate) return null;
    return getRelationshipCycle(userData.birthDate, partnerBirthDate);
  }, [userData.birthDate, partnerBirthDate]);

  const overallScore = useMemo(() => {
    if (!mySign || !partnerSign) return 0;
    return overallCompatibility(mySign, partnerSign);
  }, [mySign, partnerSign]);

  const generateAiSynastria = async () => {
    if (!aiAvailable || isGeneratingAi || !mySign || !partnerSign) return;
    setIsGeneratingAi(true);
    try {
      const myName = userData.name || 'Ty';
      const prompt = i18n.language?.startsWith('en')
        ? [
            `Write a deep astrological synastry reading for ${myName} (sign: ${ZODIAC_LABELS[mySign]}, element: ${ZODIAC_ELEMENT[mySign]})`,
            `and ${partnerName.trim() || 'the partner'} (sign: ${ZODIAC_LABELS[partnerSign]}, element: ${ZODIAC_ELEMENT[partnerSign]}).`,
            `Connection quality: ${elementDynamic?.quality || 'complementary'}.`,
            'Focus on energetic dynamics, mutual complementarity, likely challenges and the gifts of this bond.',
            'Format: 3-4 paragraphs, poetic but concrete. No markdown. Max 200 words.',
          ].join(' ')
        : [
            `Napisz w języku użytkownika głęboki odczyt synastrii astrologicznej dla ${myName} (znak: ${ZODIAC_LABELS[mySign]}, żywioł: ${ZODIAC_ELEMENT[mySign]})`,
            `i ${partnerName.trim() || 'partnera'} (znak: ${ZODIAC_LABELS[partnerSign]}, żywioł: ${ZODIAC_ELEMENT[partnerSign]}).`,
            `Jakość połączenia: ${elementDynamic?.quality || 'uzupełniający'}.`,
            `Skup się na: dynamice energetycznej, wzajemnym uzupełnianiu się, potencjalnych wyzwaniach i darach tej relacji.`,
            `Format: 3-4 akapity, język poetycki, ale konkretny. Bez markdown. Max 200 słów.`,
          ].join(' ');
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }], i18n.language?.startsWith('en') ? 'en' : 'pl');
      setAiSynastria(result);
    } catch { setAiSynastria('Odczyt synastrii jest chwilowo niedostępny. Spróbuj ponownie za chwilę.'); }
    finally { setIsGeneratingAi(false); }
  };

  const hasResults = !!(mySign && partnerSign);

  return (
    <View style={[s.container, { backgroundColor: isLight ? '#F8F5FF' : '#05030F' }]}>
      {!isLight && (
        <LinearGradient colors={['#05030F', '#080418', '#0B0620']} style={StyleSheet.absoluteFill} />
      )}
      <CelestialBackdrop intensity="immersive" />

      <SafeAreaView edges={['top']} style={s.safeArea}>
        <KeyboardAvoidingView style={s.safeArea} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0}>

          {/* ── HEADER ─────────────────────────────────────── */}
          <View style={s.header}>
            <Pressable onPress={() => navigation.goBack()} style={s.headerBtn} hitSlop={20}>
              <ChevronLeft color={accent} size={26} />
            </Pressable>
            <View style={s.headerCenter}>
              <Typography variant="premiumLabel" color={accent} style={s.eyebrow}>HOROSKOP RELACYJNY</Typography>
              <Typography variant="screenTitle" style={[s.headerTitle, { color: textColor }]}>Astrologia Połączenia</Typography>
            </View>
            <Pressable
              onPress={() => { if (isFavoriteItem('partner_horoscope')) { removeFavoriteItem('partner_horoscope'); } else { addFavoriteItem({ id: 'partner_horoscope', label: 'Horoskop partnera', route: 'PartnerHoroscope', params: {}, icon: 'Heart', color: accent, addedAt: new Date().toISOString() }); } }}
              style={s.headerBtn} hitSlop={12}
            >
              <Star color={isFavoriteItem('partner_horoscope') ? accent : accent + '88'} size={18} strokeWidth={1.8} fill={isFavoriteItem('partner_horoscope') ? accent : 'none'} />
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
            <DualZodiacWheel accent={accent} />

            {/* ── HERO SUBTITLE ─────────────────────────────── */}
            <View style={s.heroSubtitle}>
              <Typography variant="bodyRefined" style={{ color: subColor, textAlign: 'center', lineHeight: 24 }}>
                Dwa znaki, dwa żywioły — jedno pole magnetyczne. Odkryj harmonię i napięcie w Waszej astrologicznej dynamice.
              </Typography>
            </View>

            {/* ── INPUT CARDS ──────────────────────────────── */}
            <View style={s.inputCardsRow}>
              {/* My sign card */}
              <View style={[s.signCard, { backgroundColor: isLight ? accent + '06' : accent + '10', borderColor: accent + '40' }]}>
                <View style={s.signCardHeader}>
                  <View style={[s.signCardDot, { backgroundColor: accent }]} />
                  <Typography variant="microLabel" color={accent}>TWÓJ ZNAK</Typography>
                </View>
                {mySign ? (
                  <View style={s.signDisplay}>
                    <Typography style={[s.signSymbol, { color: accent }]}>{ZODIAC_SYMBOLS[mySign]}</Typography>
                    <View>
                      <Typography variant="cardTitle" style={{ color: textColor }}>{ZODIAC_LABELS[mySign]}</Typography>
                      <Typography variant="caption" style={{ color: subColor }}>{ZODIAC_ELEMENT[mySign]}</Typography>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    style={[s.datePicker, { borderColor: accent + '44', backgroundColor: isLight ? accent + '0A' : accent + '12' }]}
                    onPress={() => setMyPickerVisible(true)}
                  >
                    <Calendar color={accent} size={15} />
                    <Typography variant="caption" style={{ color: subColor, marginLeft: 8 }}>Twoja data urodzenia</Typography>
                  </Pressable>
                )}
              </View>

              {/* Connector */}
              <View style={s.connectorRow}>
                <View style={[s.connectorLine, { backgroundColor: dividerColor }]} />
                <View style={[s.connectorHeart, { backgroundColor: isLight ? accentWarm + '14' : accentWarm + '22', borderColor: accentWarm + '55' }]}>
                  <Heart color={accentWarm} size={13} fill={accentWarm} />
                </View>
                <View style={[s.connectorLine, { backgroundColor: dividerColor }]} />
              </View>

              {/* Partner sign card */}
              <View style={[s.signCard, { backgroundColor: isLight ? accentWarm + '06' : accentWarm + '10', borderColor: accentWarm + '40' }]}>
                <View style={s.signCardHeader}>
                  <View style={[s.signCardDot, { backgroundColor: accentWarm }]} />
                  <Typography variant="microLabel" color={accentWarm}>ZNAK PARTNERA/KI</Typography>
                </View>
                {partnerSign ? (
                  <View style={s.signDisplay}>
                    <Typography style={[s.signSymbol, { color: accentWarm }]}>{ZODIAC_SYMBOLS[partnerSign]}</Typography>
                    <View>
                      <Typography variant="cardTitle" style={{ color: textColor }}>{ZODIAC_LABELS[partnerSign]}</Typography>
                      <Typography variant="caption" style={{ color: subColor }}>{ZODIAC_ELEMENT[partnerSign]}</Typography>
                    </View>
                  </View>
                ) : null}
                <MysticalInput
                  value={partnerName}
                  onChangeText={setPartnerName}
                  placeholder="Imię tej osoby"
                  placeholderTextColor={subColor + '88'}
                  style={{ color: textColor, fontSize: 14, marginBottom: 6 }}
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
                  accentColor={accentWarm}
                  cardBg={isLight ? accentWarm + '0A' : accentWarm + '12'}
                />
              </View>
            </View>

            {!partnerBirthDate && (
              <View style={[s.hintBox, { backgroundColor: accent + '0A', borderColor: accent + '25' }]}>
                <Typography variant="caption" style={{ color: subColor, lineHeight: 19, textAlign: 'center' }}>
                  Wpisz datę urodzenia partnera/ki, by odkryć astrologiczną dynamikę Waszej relacji.
                </Typography>
              </View>
            )}

            {/* ── ZODIAC SELECTORS (12 chips each) ─────────── */}
            {!mySign && (
              <View style={s.zodiacPicker}>
                <Typography variant="microLabel" color={accent} style={{ marginBottom: 10 }}>WYBIERZ SWÓJ ZNAK</Typography>
                <View style={s.zodiacChips}>
                  {ZODIAC_ORDER.map(sign => (
                    <Pressable
                      key={sign}
                      style={[s.zodiacChip, { borderColor: accent + '30', backgroundColor: isLight ? accent + '06' : accent + '0C' }]}
                      onPress={() => {
                        /* read-only display — sign computed from birthDate */
                      }}
                    >
                      <Typography style={{ fontSize: 16, lineHeight: 20 }}>{ZODIAC_SYMBOLS[sign]}</Typography>
                      <Typography style={{ fontSize: 9, color: accent, fontWeight: '600', marginTop: 2 }}>{ZODIAC_LABELS[sign].slice(0, 3)}</Typography>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* ── RESULTS ──────────────────────────────────── */}
            {hasResults ? (
              <>
                {/* ── COMPATIBILITY SCORE HERO ─────────────── */}
                <Animated.View entering={FadeInDown.delay(80).springify()}>
                  <View style={[s.compatCard, { backgroundColor: isLight ? SCORE_COLOR(overallScore) + '08' : SCORE_COLOR(overallScore) + '10', borderColor: SCORE_COLOR(overallScore) + '40' }]}>
                    <LinearGradient colors={[SCORE_COLOR(overallScore) + '14', 'transparent']} style={StyleSheet.absoluteFill as any} />
                    <View style={s.compatBadgeRow}>
                      <View style={[s.compatBadge, { backgroundColor: SCORE_COLOR(overallScore) + '20', borderColor: SCORE_COLOR(overallScore) + '44' }]}>
                        <Typography variant="microLabel" color={SCORE_COLOR(overallScore)}>♥ ZGODNOŚĆ ZNAKÓW</Typography>
                      </View>
                    </View>
                    <CompatGauge score={overallScore} accent={accent} />
                    <View style={s.compatSignsRow}>
                      <View style={s.compatSignItem}>
                        <Typography style={[s.compatSymbol, { color: accent }]}>{ZODIAC_SYMBOLS[mySign]}</Typography>
                        <Typography variant="microLabel" color={accent}>{ZODIAC_LABELS[mySign]}</Typography>
                      </View>
                      <View style={[s.compatJoinBadge, { backgroundColor: SCORE_COLOR(overallScore) + '20', borderColor: SCORE_COLOR(overallScore) + '44' }]}>
                        <Typography style={{ fontSize: 12, fontWeight: '800', color: SCORE_COLOR(overallScore) }}>{SCORE_LABEL(overallScore).toUpperCase()}</Typography>
                      </View>
                      <View style={s.compatSignItem}>
                        <Typography style={[s.compatSymbol, { color: accentWarm }]}>{ZODIAC_SYMBOLS[partnerSign]}</Typography>
                        <Typography variant="microLabel" color={accentWarm}>{ZODIAC_LABELS[partnerSign]}</Typography>
                      </View>
                    </View>
                    <View style={[s.compatDivider, { backgroundColor: dividerColor }]} />
                    <Typography variant="caption" style={{ color: subColor, textAlign: 'center', lineHeight: 19 }}>
                      {RELATION_TYPE(overallScore)} — wynik astrologicznej kompatybilności znaków i żywiołów
                    </Typography>
                  </View>
                </Animated.View>

                {/* ── ELEMENT DYNAMICS ─────────────────────── */}
                {elementDynamic && (
                  <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <SectionTitle label="DYNAMIKA PARY" accent={accent} />
                    <View style={[s.dynamikaCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                      <LinearGradient colors={[accent + '0A', accentWarm + '06', 'transparent']} style={StyleSheet.absoluteFill as any} />
                      <View style={s.dynamikaSigns}>
                        <View style={s.dynamikaSignItem}>
                          <Typography style={[s.dynamikaSymbol, { color: accent }]}>{ZODIAC_SYMBOLS[mySign]}</Typography>
                          <Typography variant="microLabel" color={accent}>{ZODIAC_LABELS[mySign]}</Typography>
                          <Typography variant="caption" style={{ color: subColor }}>{ZODIAC_ELEMENT[mySign]}</Typography>
                        </View>
                        <View style={s.dynamikaSep}>
                          <Typography style={{ fontSize: 18, color: accent }}>✦</Typography>
                        </View>
                        <View style={s.dynamikaSignItem}>
                          <Typography style={[s.dynamikaSymbol, { color: accentWarm }]}>{ZODIAC_SYMBOLS[partnerSign]}</Typography>
                          <Typography variant="microLabel" color={accentWarm}>{ZODIAC_LABELS[partnerSign]}</Typography>
                          <Typography variant="caption" style={{ color: subColor }}>{ZODIAC_ELEMENT[partnerSign]}</Typography>
                        </View>
                      </View>
                      <View style={[s.dynamikaDivider, { backgroundColor: dividerColor }]} />
                      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                        <View style={[s.qualityBadge, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
                          <Typography variant="microLabel" color={accent}>{elementDynamic.quality.toUpperCase()}</Typography>
                        </View>
                      </View>
                      <Typography variant="cardTitle" style={{ color: textColor, marginBottom: 10 }}>{elementDynamic.title}</Typography>
                      <Typography variant="bodySmall" style={{ lineHeight: 22, color: subColor }}>{elementDynamic.body}</Typography>
                    </View>
                  </Animated.View>
                )}

                {/* ── COMPATIBILITY RADAR ──────────────────── */}
                {compatibilityScores && (
                  <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <SectionTitle label="OBSZARY ZGODNOŚCI" accent={accentWarm} />
                    <Typography variant="caption" style={{ color: subColor, marginBottom: 14, lineHeight: 20 }}>
                      Sześć wymiarów kompatybilności — profil Waszej relacji.
                    </Typography>
                    <View style={[s.radarCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                      <RadarChart
                        scores={Object.values(compatibilityScores)}
                        labels={['emocje', 'kom.', 'wart.', 'nam.', 'wzrost', 'stab.']}
                        accent={accent}
                        subColor={subColor}
                      />
                      {/* Progress bars legend */}
                      <View style={{ gap: 8, marginTop: 8 }}>
                        {Object.entries(compatibilityScores).map(([key, val]) => (
                          <View key={key} style={s.radarLegendRow}>
                            <Typography variant="caption" style={{ width: 90, color: subColor }}>{key}</Typography>
                            <ProgressBar value={val} color={accent} />
                            <Typography variant="caption" style={{ width: 30, textAlign: 'right', color: accent }}>{val}/10</Typography>
                          </View>
                        ))}
                      </View>
                    </View>
                  </Animated.View>
                )}

                {/* ── SYNASTRY PLANETS ─────────────────────── */}
                {synastriaAspects && (
                  <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <SectionTitle label="SYNASTRIA PLANET" accent={accent} />
                    <Typography variant="caption" style={{ color: subColor, marginBottom: 14, lineHeight: 20 }}>
                      Pięć kluczowych aspektów planetarnych między Waszymi mapami.
                    </Typography>
                    <View style={{ gap: 10 }}>
                      {synastriaAspects.map((asp, idx) => (
                        <Animated.View key={asp.planet} entering={FadeInDown.delay(80 + idx * 50).duration(400)}>
                          <View style={[s.synastriaCard, { backgroundColor: isLight ? accent + '06' : accent + '0C', borderColor: accent + '30' }]}>
                            <LinearGradient colors={[accent + '0E', 'transparent']} style={StyleSheet.absoluteFill as any} />
                            <View style={s.synastriaRow}>
                              <View style={[s.planetEmoji]}>
                                <Typography style={{ fontSize: 20 }}>{asp.label}</Typography>
                              </View>
                              <View style={{ flex: 1, marginLeft: 12 }}>
                                <Typography variant="microLabel" color={accent}>{asp.planet.toUpperCase()}</Typography>
                                <Typography variant="cardTitle" style={{ color: textColor, fontSize: 13, marginTop: 2 }}>{asp.title}</Typography>
                              </View>
                              <View style={[s.harmonyBadge, { backgroundColor: accent + '18', borderColor: accent + '30' }]}>
                                <Typography variant="microLabel" color={accent}>{asp.harmony}/10</Typography>
                              </View>
                            </View>
                            <Typography variant="caption" style={{ color: subColor, lineHeight: 20, marginTop: 8 }}>{asp.desc}</Typography>
                          </View>
                        </Animated.View>
                      ))}
                    </View>
                  </Animated.View>
                )}

                {/* ── RELATIONSHIP CYCLE ───────────────────── */}
                {relationshipCycle && (
                  <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <SectionTitle label="CYKL ZWIĄZKU" accent={accentWarm} />
                    <View style={[s.cycleCard, { backgroundColor: isLight ? relationshipCycle.color + '0A' : relationshipCycle.color + '12', borderColor: relationshipCycle.color + '44' }]}>
                      <LinearGradient colors={[relationshipCycle.color + '16', 'transparent']} style={StyleSheet.absoluteFill as any} />
                      <View style={s.cycleHeader}>
                        <View style={[s.cycleBadge, { backgroundColor: relationshipCycle.color + '28', borderColor: relationshipCycle.color + '55' }]}>
                          <Typography style={{ fontSize: 22, fontWeight: '800', color: relationshipCycle.color }}>{relationshipCycle.phase}</Typography>
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                          <Typography variant="microLabel" style={{ color: relationshipCycle.color, marginBottom: 4 }}>FAZA {relationshipCycle.phase} · AKTYWNA TERAZ</Typography>
                          <Typography variant="cardTitle" style={{ color: textColor, fontSize: 17 }}>{relationshipCycle.name}</Typography>
                        </View>
                      </View>
                      <View style={[s.cycleDivider, { backgroundColor: relationshipCycle.color + '30' }]} />
                      <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 22 }}>{relationshipCycle.desc}</Typography>
                    </View>
                  </Animated.View>
                )}

                {/* ── SILNE STRONY / WYZWANIA / RADA DNIA ─── */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                  <SectionTitle label="SILNE STRONY, WYZWANIA I RADA DNIA" accent={accent} />
                  {[
                    {
                      title: 'Silne Strony',
                      icon: '✦',
                      color: '#34D399',
                      text: elementDynamic
                        ? `Wasza para łączy ${ZODIAC_ELEMENT[mySign]} i ${ZODIAC_ELEMENT[partnerSign]}. Dynamika "${elementDynamic.quality}" otwiera naturalną przestrzeń wzajemnego wsparcia i inspiracji.`
                        : 'Każda relacja ma swoje unikalne zasoby. Odkryjcie je przez wzajemną ciekawość.',
                    },
                    {
                      title: 'Wyzwania',
                      icon: '⚡',
                      color: '#F87171',
                      text: `${ZODIAC_LABELS[mySign]} i ${ZODIAC_LABELS[partnerSign]} mogą mieć różne tempo procesowania emocji i podejmowania decyzji. Świadoma komunikacja staje się kluczem.`,
                    },
                    {
                      title: 'Rada Dnia',
                      icon: '🌙',
                      color: accent,
                      text: `Dziś szczególnie wartościowe jest powiedzenie tej osobie czegoś, czego jeszcze nie powiedziałaś/eś — nie z lęku, nie z oczekiwania, lecz z czystej prawdziwości.`,
                    },
                  ].map((item, idx) => (
                    <Animated.View key={item.title} entering={FadeInDown.delay(80 + idx * 60).springify()}>
                      <View style={[s.insightCard, { backgroundColor: isLight ? item.color + '08' : item.color + '0D', borderColor: item.color + '38' }]}>
                        <LinearGradient colors={[item.color + '10', 'transparent']} style={StyleSheet.absoluteFill as any} />
                        <View style={s.insightHeader}>
                          <View style={[s.insightIconBox, { backgroundColor: item.color + '20', borderColor: item.color + '44' }]}>
                            <Typography style={{ fontSize: 16 }}>{item.icon}</Typography>
                          </View>
                          <Typography variant="premiumLabel" color={item.color} style={{ marginLeft: 12 }}>{item.title}</Typography>
                        </View>
                        <View style={[s.insightDivider, { backgroundColor: item.color + '22' }]} />
                        <Typography variant="bodySmall" style={{ lineHeight: 22, color: subColor }}>{item.text}</Typography>
                      </View>
                    </Animated.View>
                  ))}
                </Animated.View>

                {/* ── RELATIONSHIP PRACTICES ───────────────── */}
                <Animated.View entering={FadeInDown.delay(120).springify()}>
                  <SectionTitle label="PRAKTYKI DLA PARY" accent={accentWarm} />
                  <View style={{ gap: 12 }}>
                    {RELATIONSHIP_PRACTICES.map((practice, idx) => (
                      <Animated.View key={practice.title} entering={FadeInDown.delay(80 + idx * 55).duration(380)}>
                        <View style={[s.practiceCard, { backgroundColor: isLight ? practice.color + '08' : practice.color + '0D', borderColor: practice.color + '35' }]}>
                          <LinearGradient colors={[practice.color + '10', 'transparent']} style={StyleSheet.absoluteFill as any} />
                          <View style={s.practiceHeader}>
                            <Typography style={{ fontSize: 22, marginRight: 10 }}>{practice.icon}</Typography>
                            <View style={{ flex: 1 }}>
                              <Typography variant="cardTitle" style={{ color: textColor, marginBottom: 4 }}>{practice.title}</Typography>
                              <View style={[s.timingChip, { backgroundColor: practice.color + '20', borderColor: practice.color + '40' }]}>
                                <Typography style={{ fontSize: 10, fontWeight: '700', color: practice.color }}>{practice.timing}</Typography>
                              </View>
                            </View>
                          </View>
                          <View style={[s.practiceDivider, { backgroundColor: practice.color + '22' }]} />
                          <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 21 }}>{practice.desc}</Typography>
                        </View>
                      </Animated.View>
                    ))}
                  </View>
                </Animated.View>

                {/* ── AI SYNASTRY ──────────────────────────── */}
                {aiAvailable && (
                  <Animated.View entering={FadeInDown.delay(140).springify()}>
                    <SectionTitle label="AI SYNASTRIA" accent={accent} />
                    {!aiSynastria && !isGeneratingAi && (
                      <Pressable
                        onPress={generateAiSynastria}
                        style={({ pressed }) => [s.aiCtaCard, { backgroundColor: isLight ? accent + '0A' : accent + '10', borderColor: accent + '40', opacity: pressed ? 0.8 : 1 }]}
                      >
                        <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFill as any} />
                        <Wand2 color={accent} size={18} strokeWidth={1.8} />
                        <Typography variant="cardTitle" style={{ color: accent, marginLeft: 12, fontSize: 14, flex: 1 }}>
                          Wygeneruj odczyt synastrii AI
                        </Typography>
                        <ArrowRight color={accent + '88'} size={14} />
                      </Pressable>
                    )}
                    {isGeneratingAi && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
                        <ActivityIndicator size="small" color={accent} />
                        <Typography variant="bodySmall" color={accent} style={{ marginLeft: 12 }}>Czytamy Waszą synastię...</Typography>
                      </View>
                    )}
                    {aiSynastria && (
                      <Animated.View entering={FadeInDown.duration(400)}>
                        <View style={[s.aiResultCard, { backgroundColor: isLight ? accent + '06' : accent + '0C', borderColor: accent + '30' }]}>
                          <LinearGradient colors={[accent + '0E', 'transparent']} style={StyleSheet.absoluteFill as any} />
                          <Typography variant="premiumLabel" color={accent} style={{ marginBottom: 12 }}>Odczyt synastrii ✦</Typography>
                          <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 25 }}>{aiSynastria}</Typography>
                        </View>
                        <Pressable onPress={() => setAiSynastria(null)} style={{ paddingVertical: 12, alignItems: 'center' }}>
                          <Typography variant="caption" style={{ color: subColor }}>Wygeneruj ponownie</Typography>
                        </Pressable>
                      </Animated.View>
                    )}
                  </Animated.View>
                )}
              </>
            ) : (
              /* ── EMPTY STATE ────────────────────────── */
              <View style={s.emptyState}>
                <View style={[s.emptyIcon, { backgroundColor: accent + '14', borderColor: accent + '30' }]}>
                  <Orbit color={accent} size={28} />
                </View>
                <Typography variant="premiumLabel" color={accent} style={{ marginBottom: 8, textAlign: 'center' }}>
                  Odkryj horoskop relacyjny
                </Typography>
                <Typography variant="bodySmall" style={{ color: subColor, textAlign: 'center', lineHeight: 22 }}>
                  Wpisz datę urodzenia partnera/ki, by otworzyć astrologiczną analizę Waszego połączenia.
                </Typography>
              </View>
            )}

            {/* ── CO DALEJ? ─────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginTop: 24 }}>
              <SectionTitle label="CO DALEJ?" accent={accentWarm} />
              {[
                { label: 'Zgodność znaków', desc: 'Sprawdź pełną mapę relacji — żywioły, tryby i energetyczną wzajemność.', onPress: () => navigation.navigate('Compatibility') },
                { label: 'Matryca relacji', desc: 'Przenieś partnerowy kontekst do wzorca, lekcji i numerologii połączenia.', onPress: () => navigation.navigate('PartnerMatrix') },
                { label: 'Tarot dla dwojga', desc: 'Zadaj pytanie o Was jako parę i zobaczy, co karty pokazują teraz.', onPress: () => navigation.navigate('PartnerTarot') },
                { label: 'Notatka relacyjna', desc: 'Zapisz wrażenia po horoskopie z zachowanym kontekstem tej osoby.', onPress: () => navigation.navigate('JournalEntry', { prompt: `Odczytałam/em horoskop partnerski dla ${partnerName.trim() || 'tej osoby'}. Co zauważam w dynamice między naszymi znakami?`, type: 'reflection' }) },
              ].map((item, idx) => (
                <Pressable
                  key={item.label}
                  style={[s.navRow, { borderTopColor: dividerColor, borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth }]}
                  onPress={item.onPress}
                >
                  <View style={[s.navIconBox, { backgroundColor: accentWarm + '14' }]}>
                    <ArrowRight color={accentWarm} size={15} />
                  </View>
                  <View style={s.navText}>
                    <Typography variant="cardTitle" style={{ color: textColor }}>{item.label}</Typography>
                    <Typography variant="caption" style={[s.navDesc, { color: subColor }]}>{item.desc}</Typography>
                  </View>
                  <ArrowRight color={accentWarm + '88'} size={13} />
                </Pressable>
              ))}
            </Animated.View>

            <EndOfContentSpacer size="standard" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Partner date picker replaced by inline DateWheelPicker */}
      <PremiumDatePickerSheet
        visible={myPickerVisible}
        mode="date"
        title="Twoja data urodzenia"
        description="Potrzebna do obliczenia astrologicznej dynamiki relacji."
        value={new Date(userData.birthDate || '1994-06-15')}
        maximumDate={new Date()}
        onCancel={() => setMyPickerVisible(false)}
        onConfirm={(value) => { setMyPickerVisible(false); }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', height: 68, paddingHorizontal: layout.padding.screen },
  headerBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  eyebrow: { letterSpacing: 2, opacity: 0.9 },
  headerTitle: { marginTop: 2 },

  scroll: { flexGrow: 1, paddingHorizontal: layout.padding.screen, paddingTop: 4 },
  heroSubtitle: { paddingHorizontal: 8, marginBottom: 22, marginTop: -4 },

  // Section title
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 22, gap: 10 },
  sectionTitleLine: { flex: 1, height: 1 },
  sectionTitleText: { letterSpacing: 1.5, fontSize: 11 },

  // Input cards
  inputCardsRow: { gap: 0, marginBottom: 14 },
  signCard: { borderRadius: 20, borderWidth: 1, padding: 16 },
  signCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  signCardDot: { width: 8, height: 8, borderRadius: 4 },
  signDisplay: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  signSymbol: { fontSize: 32, lineHeight: 38 },
  connectorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 12 },
  connectorLine: { flex: 1, height: 1 },
  connectorHeart: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  datePicker: { flexDirection: 'row', alignItems: 'center', minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, marginTop: 8 },
  hintBox: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },

  // Zodiac picker
  zodiacPicker: { marginBottom: 14 },
  zodiacChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  zodiacChip: { width: (SW - layout.padding.screen * 2 - 8 * 3) / 4, alignItems: 'center', paddingVertical: 10, borderRadius: 14, borderWidth: 1 },

  // Compat card
  compatCard: { borderRadius: 22, borderWidth: 1, padding: 20, overflow: 'hidden', alignItems: 'center', marginBottom: 4 },
  compatBadgeRow: { flexDirection: 'row', marginBottom: 6 },
  compatBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4 },
  compatSignsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 14, marginTop: 6 },
  compatSignItem: { alignItems: 'center', gap: 4 },
  compatSymbol: { fontSize: 28, lineHeight: 34 },
  compatJoinBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 5 },
  compatDivider: { height: 1, alignSelf: 'stretch', marginBottom: 12 },

  // Dynamika
  dynamikaCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 4, overflow: 'hidden' },
  dynamikaSigns: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 },
  dynamikaSignItem: { flex: 1, alignItems: 'center', gap: 4 },
  dynamikaSymbol: { fontSize: 28, lineHeight: 34 },
  dynamikaSep: { width: 32, alignItems: 'center' },
  dynamikaDivider: { height: 1, marginBottom: 12 },
  qualityBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4 },

  // Radar
  radarCard: { borderRadius: 20, borderWidth: 1, padding: 16, alignItems: 'center', marginBottom: 4 },
  radarLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Progress bar
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },

  // Synastria
  synastriaCard: { borderRadius: 18, borderWidth: 1, padding: 14, overflow: 'hidden' },
  synastriaRow: { flexDirection: 'row', alignItems: 'center' },
  planetEmoji: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  harmonyBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },

  // Cycle
  cycleCard: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden', marginBottom: 4 },
  cycleHeader: { flexDirection: 'row', alignItems: 'center' },
  cycleBadge: { width: 52, height: 52, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cycleDivider: { height: 1, marginVertical: 12 },

  // Insight cards (Silne Strony / Wyzwania / Rada)
  insightCard: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 10, overflow: 'hidden' },
  insightHeader: { flexDirection: 'row', alignItems: 'center' },
  insightIconBox: { width: 36, height: 36, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  insightDivider: { height: 1, marginVertical: 10 },

  // Practices
  practiceCard: { borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden' },
  practiceHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 0 },
  timingChip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, marginTop: 4 },
  practiceDivider: { height: 1, marginVertical: 10 },

  // AI
  aiCtaCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden', marginBottom: 10 },
  aiResultCard: { borderRadius: 18, borderWidth: 1, padding: 18, overflow: 'hidden' },

  // Nav rows
  navRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 12 },
  navIconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  navText: { flex: 1 },
  navDesc: { marginTop: 4, lineHeight: 19 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
});
