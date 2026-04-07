// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View, Dimensions, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, G, Line, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withTiming, withSequence, Easing, cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Moon, Sun, Sparkles, BookOpen, ArrowRight,
  Clock, Play, Pause, RotateCcw, Wand2, Droplets, Wind, Flame,
  CheckCircle2, Circle as CircleIcon, X, ChevronDown, ChevronUp, Bell,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore, LunarIntent } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '../core/utils/localeFormat';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#C4B5FD';

// ── MOON PHASE MATH ───────────────────────────────────────────
function julianDate(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}
function getMoonAge(y: number, m: number, d: number): number {
  const jd = julianDate(y, m, d);
  const ref = 2451550.1;
  const cycle = 29.530588853;
  let age = ((jd - ref) % cycle);
  if (age < 0) age += cycle;
  return age;
}
function getMoonPhaseName(age: number): string {
  if (age < 1.5) return 'Nów';
  if (age < 7.5) return 'Przybywający Sierp';
  if (age < 9.5) return 'Pierwsza Kwadra';
  if (age < 14.0) return 'Przybywający Garb';
  if (age < 15.5) return 'Pełnia';
  if (age < 21.0) return 'Ubywający Garb';
  if (age < 23.0) return 'Ostatnia Kwadra';
  return 'Ubywający Sierp';
}
function getMoonPhaseEmoji(age: number): string {
  if (age < 1.5) return '🌑';
  if (age < 7.5) return '🌒';
  if (age < 9.5) return '🌓';
  if (age < 14.0) return '🌔';
  if (age < 15.5) return '🌕';
  if (age < 21.0) return '🌖';
  if (age < 23.0) return '🌗';
  return '🌘';
}
function getMoonIllumination(age: number): number {
  const phase = age / 29.530588853;
  return Math.round(50 * (1 - Math.cos(phase * 2 * Math.PI)));
}

// ── 3D MOON WIDGET ────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MoonWidget3D = React.memo(({ accent }: { accent: string }) => {
  const rot1  = useSharedValue(0);
  const rot2  = useSharedValue(360);
  const rot3  = useSharedValue(0);
  const drop1 = useSharedValue(0);
  const drop2 = useSharedValue(0);
  const drop3 = useSharedValue(0);
  const pulse = useSharedValue(0.95);
  const tiltX = useSharedValue(-6);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    rot1.value  = withRepeat(withTiming(360,  { duration: 18000, easing: Easing.linear }), -1, false);
    rot2.value  = withRepeat(withTiming(0,    { duration: 12000, easing: Easing.linear }), -1, false);
    rot3.value  = withRepeat(withTiming(360,  { duration: 28000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withSequence(withTiming(1.04, { duration: 2600 }), withTiming(0.95, { duration: 2600 })), -1, false);
    drop1.value = withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(60, { duration: 1400, easing: Easing.in(Easing.quad) }), withTiming(60, { duration: 600 })), -1, false);
    drop2.value = withRepeat(withSequence(withTiming(0, { duration: 500 }), withTiming(60, { duration: 1400, easing: Easing.in(Easing.quad) }), withTiming(60, { duration: 600 })), -1, false);
    drop3.value = withRepeat(withSequence(withTiming(0, { duration: 900 }), withTiming(60, { duration: 1400, easing: Easing.in(Easing.quad) }), withTiming(60, { duration: 600 })), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-24, Math.min(24, -6 + e.translationY * 0.18));
      tiltY.value = Math.max(-24, Math.min(24, e.translationX * 0.18));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-6, { duration: 900 });
      tiltY.value = withTiming(0,  { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: pulse.value },
    ],
  }));
  const ring1Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot1.value}deg` }] }));
  const ring2Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot2.value}deg` }] }));
  const ring3Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot3.value}deg` }] }));
  const drop1Style = useAnimatedStyle(() => ({ transform: [{ translateY: drop1.value }], opacity: Math.max(0, 1 - drop1.value / 55) }));
  const drop2Style = useAnimatedStyle(() => ({ transform: [{ translateY: drop2.value }], opacity: Math.max(0, 1 - drop2.value / 55) }));
  const drop3Style = useAnimatedStyle(() => ({ transform: [{ translateY: drop3.value }], opacity: Math.max(0, 1 - drop3.value / 55) }));

  // Orbit dots for ring1 (8 dots)
  const ring1Dots = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return { x: 88 * Math.cos(a), y: 88 * Math.sin(a), r: i % 2 === 0 ? 3.2 : 1.8 };
  });
  // Orbit dots for ring2 (6 sparkles)
  const ring2Dots = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return { x: 66 * Math.cos(a), y: 66 * Math.sin(a), r: i % 3 === 0 ? 2.8 : 1.4 };
  });
  // Outer ring3 (12 tiny nodes)
  const ring3Dots = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { x: 108 * Math.cos(a), y: 108 * Math.sin(a) };
  });

  return (
    <View style={{ alignItems: 'center', marginVertical: 12, height: 250 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: 240, height: 240, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>
          {/* Ring 3 — slow outer */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring3Style]}>
            <Svg width={240} height={240} viewBox="-120 -120 240 240">
              <Circle cx={0} cy={0} r={108} fill="none" stroke={accent + '22'} strokeWidth={0.8} strokeDasharray="3 9" />
              {ring3Dots.map((d, i) => (
                <Circle key={i} cx={d.x} cy={d.y} r={i % 4 === 0 ? 2.5 : 1.2} fill={accent} opacity={i % 4 === 0 ? 0.7 : 0.35} />
              ))}
            </Svg>
          </Animated.View>

          {/* Ring 1 — medium orbit */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring1Style]}>
            <Svg width={240} height={240} viewBox="-120 -120 240 240">
              <Circle cx={0} cy={0} r={88} fill="none" stroke={accent + '33'} strokeWidth={1} strokeDasharray="5 7" />
              {ring1Dots.map((d, i) => (
                <G key={i}>
                  <Circle cx={d.x} cy={d.y} r={d.r} fill={accent} opacity={0.80} />
                  {i % 2 === 0 && <Circle cx={d.x} cy={d.y} r={d.r + 2} fill="none" stroke={accent} strokeWidth={0.6} opacity={0.40} />}
                </G>
              ))}
            </Svg>
          </Animated.View>

          {/* Ring 2 — counter-rotating inner orbit */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring2Style]}>
            <Svg width={240} height={240} viewBox="-120 -120 240 240">
              <Circle cx={0} cy={0} r={66} fill="none" stroke={accent + '28'} strokeWidth={0.8} />
              {ring2Dots.map((d, i) => (
                <G key={i}>
                  <Circle cx={d.x} cy={d.y} r={d.r} fill="#F8FAFF" opacity={0.75} />
                  <Circle cx={d.x} cy={d.y} r={d.r + 1.5} fill="none" stroke={accent} strokeWidth={0.5} opacity={0.30} />
                </G>
              ))}
            </Svg>
          </Animated.View>

          {/* Moon body */}
          <Svg width={240} height={240} viewBox="-120 -120 240 240" style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="moonGrad" cx="40%" cy="35%" r="60%" fx="40%" fy="35%">
                <Stop offset="0%" stopColor="#F5F0E8" stopOpacity="1" />
                <Stop offset="60%" stopColor="#D4C9B0" stopOpacity="1" />
                <Stop offset="100%" stopColor="#8C7F68" stopOpacity="1" />
              </RadialGradient>
              <RadialGradient id="craterGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#A09080" stopOpacity="0.8" />
                <Stop offset="100%" stopColor="#C4B89E" stopOpacity="0.2" />
              </RadialGradient>
            </Defs>
            {/* Moon disk */}
            <Circle cx={0} cy={0} r={44} fill="url(#moonGrad)" />
            {/* Crescent shadow */}
            <Ellipse cx={14} cy={0} rx={32} ry={44} fill="#0B0A18" opacity={0.54} />
            {/* Craters */}
            <Circle cx={-18} cy={-12} r={7}  fill="url(#craterGrad)" />
            <Circle cx={-18} cy={-12} r={7}  fill="none" stroke="#7A6E5C" strokeWidth={0.5} opacity={0.5} />
            <Circle cx={-22} cy={16}  r={5}  fill="url(#craterGrad)" />
            <Circle cx={-22} cy={16}  r={5}  fill="none" stroke="#7A6E5C" strokeWidth={0.5} opacity={0.4} />
            <Circle cx={-6}  cy={-26} r={4}  fill="url(#craterGrad)" />
            <Circle cx={-6}  cy={-26} r={4}  fill="none" stroke="#7A6E5C" strokeWidth={0.4} opacity={0.45} />
            <Circle cx={-30} cy={2}   r={3}  fill="url(#craterGrad)" />
            <Circle cx={-8}  cy={10}  r={2}  fill="url(#craterGrad)" opacity={0.6} />
            <Circle cx={-26} cy={-6}  r={2}  fill="url(#craterGrad)" opacity={0.5} />
            <Circle cx={-14} cy={28}  r={2.5} fill="url(#craterGrad)" opacity={0.55} />
            {/* Inner detail ellipses on crater */}
            <Ellipse cx={-18} cy={-11} rx={5} ry={2.5} fill="#9A8E7C" opacity={0.25} />
            <Ellipse cx={-22} cy={16.5} rx={3.5} ry={1.8} fill="#9A8E7C" opacity={0.22} />
            {/* Specular glint */}
            <Ellipse cx={-26} cy={-20} rx={6} ry={2} fill="white" opacity={0.18} />
            {/* Glow halo */}
            <Circle cx={0} cy={0} r={52} fill="none" stroke={accent} strokeWidth={1.5} opacity={0.22} />
            <Circle cx={0} cy={0} r={58} fill="none" stroke={accent} strokeWidth={0.6} opacity={0.10} />
          </Svg>

          {/* Dew drops (animated translateY) */}
          <Animated.View style={[{ position: 'absolute', top: 80, left: 96 }, drop1Style]}>
            <Svg width={8} height={12} viewBox="0 0 8 12">
              <Path d="M4 0 Q7 5 4 11 Q1 5 4 0Z" fill={accent} opacity={0.8} />
            </Svg>
          </Animated.View>
          <Animated.View style={[{ position: 'absolute', top: 82, left: 118 }, drop2Style]}>
            <Svg width={6} height={10} viewBox="0 0 6 10">
              <Path d="M3 0 Q6 4 3 10 Q0 4 3 0Z" fill={accent} opacity={0.65} />
            </Svg>
          </Animated.View>
          <Animated.View style={[{ position: 'absolute', top: 86, left: 106 }, drop3Style]}>
            <Svg width={5} height={8} viewBox="0 0 5 8">
              <Path d="M2.5 0 Q5 3.5 2.5 8 Q0 3.5 2.5 0Z" fill="#E8E0F8" opacity={0.55} />
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

// ── BACKGROUND ────────────────────────────────────────────────
const MoonBg = ({ isDark }: { isDark: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isDark ? ['#06030F', '#080520', '#0C072A'] : ['#F4F1FF', '#EDE6FF', '#E8DFFF']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={700} style={StyleSheet.absoluteFill} opacity={isDark ? 0.14 : 0.08}>
      {Array.from({ length: 28 }, (_, i) => (
        <Circle key={i} cx={(i * 113 + 30) % SW} cy={(i * 79 + 20) % 680}
          r={i % 6 === 0 ? 1.8 : i % 3 === 0 ? 1.1 : 0.6}
          fill={ACCENT} opacity={0.18 + (i % 5) * 0.08} />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <Circle key={'h' + i} cx={SW * (0.1 + i * 0.2)} cy={100 + i * 110}
          r={40 + i * 12} fill="none" stroke={ACCENT} strokeWidth={0.4} opacity={0.12} />
      ))}
    </Svg>
  </View>
);

// ── PHASE SVG VISUALIZATION ────────────────────────────────────
const MoonPhaseSvg = ({ age, size = 90 }: { age: number; size?: number }) => {
  const phase = age / 29.530588853;
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  // waxing: phase 0->0.5, waning: 0.5->1
  const isWaxing = phase <= 0.5;
  const illuminated = phase <= 0.5 ? phase * 2 : (1 - phase) * 2;
  const rx = Math.abs(Math.cos(phase * Math.PI * 2)) * r;
  const shadowColor = '#0B0A18';
  const termDir = isWaxing ? 1 : -1;
  const sweepLarge = isWaxing ? (illuminated < 0.5 ? 0 : 1) : (illuminated < 0.5 ? 1 : 0);
  const sweepSmall = isWaxing ? (illuminated < 0.5 ? 1 : 0) : (illuminated < 0.5 ? 0 : 1);
  const termX = cx + termDir * rx;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="pGrad" cx="42%" cy="38%" r="58%">
          <Stop offset="0%" stopColor="#F0EADC" stopOpacity="1" />
          <Stop offset="55%" stopColor="#CBBF9E" stopOpacity="1" />
          <Stop offset="100%" stopColor="#7C7060" stopOpacity="1" />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={r} fill="url(#pGrad)" />
      {/* Shadow side */}
      {(phase > 0.02 && phase < 0.98) && (
        <Path
          d={`M ${cx},${cy - r} A ${r},${r} 0 1,${isWaxing ? 0 : 1} ${cx},${cy + r} A ${rx},${r} 0 1,${isWaxing ? 1 : 0} ${cx},${cy - r} Z`}
          fill={shadowColor} opacity={0.75}
        />
      )}
      {phase < 0.02 && <Circle cx={cx} cy={cy} r={r} fill={shadowColor} opacity={0.88} />}
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={ACCENT + '88'} strokeWidth={1.2} />
    </Svg>
  );
};

// ── RITUAL DATA ────────────────────────────────────────────────
interface LunarRitual {
  phase: string;
  name: string;
  duration: string;
  intention: string;
  materials: string[];
  steps: string[];
  energy: string;
}
const LUNAR_RITUALS: LunarRitual[] = [
  {
    phase: 'Nów',
    name: 'Rytuał Nowego Początku',
    duration: '25 min',
    intention: 'Zasadzenie intencji i otwarcie nowego cyklu',
    materials: ['Czarna świeca', 'Biały papier', 'Srebrny atrament lub ołówek', 'Kryształ kwarcu dymnego'],
    steps: [
      'Usiądź w ciemnym, cichym miejscu. Przez trzy oddechy wyobraź sobie, że jesteś pustą przestrzenią — gotową na nowe.',
      'Zapal czarną świecę. Jej płomień to Twój punkt orientacji w ciemności nowego cyklu.',
      'Na białym papierze srebrnym atramentem napisz jedną intencję — co chcesz teraz przyciągnąć lub rozpocząć.',
      'Połóż kryształ na kartce. Zamknij oczy i przez 5 minut oddychaj, wizualizując tę intencję jako kiełkujące ziarno.',
      'Złóż papier, zrób 3 pętle sznurkiem (symbolizując trzy noce nowej fazy) i umieść pod poduszką na trzy noce.',
    ],
    energy: 'Ciemnośc niosąca potencjał. Cisza przed stworzeniem.',
  },
  {
    phase: 'Przybywający Sierp',
    name: 'Rytuał Pierwszego Oddechu',
    duration: '20 min',
    intention: 'Nadanie kierunku i pierwsze działanie',
    materials: ['Żółta lub złota świeca', 'Papier i pióro', 'Nasiona (dowolne jadalne)', 'Mała doniczka z ziemią'],
    steps: [
      'Wieczorem wyjdź lub stań przy oknie i poszukaj wzrokiem cienkiego sierpa księżyca na zachodnim horyzoncie.',
      'Zapal żółtą świecę i napisz trzy małe kroki, które możesz podjąć w tym tygodniu ku swojej intencji.',
      'Weź nasiona i trzymaj je przez chwilę w dłoniach, przekazując im energię Twojego zamysłu.',
      'Zasadź je w doniczce, mówiąc na głos swoją intencję. To symbolicznie sieje Twój cel.',
      'Zamknij rytuał, gasząc świecę (nie dmuchając) i dziękując kiełkującemu cyklowi.',
    ],
    energy: 'Pierwsze tchnienie nowego. Odwaga małego kroku.',
  },
  {
    phase: 'Pierwsza Kwadra',
    name: 'Rytuał Przełamania Oporu',
    duration: '30 min',
    intention: 'Pokonanie wewnętrznych przeszkód i mobilizacja woli',
    materials: ['Czerwona lub pomarańczowa świeca', 'Kamień (wulkaniczny lub gładki)', 'Pisak', 'Miska z wodą'],
    steps: [
      'Usiądź przy stole. Przez chwilę poczuj, gdzie w ciele czujesz napięcie lub opór wobec swojej intencji.',
      'Zapal świecę. Pisakiem napisz na kamieniu jedno słowo oznaczające Twój główny opór (np. "strach", "wątpliwość").',
      'Trzymaj kamień mocno przez 2 minuty, czując jego ciężar. To realne rozpoznanie przeszkody.',
      'Wrzuć kamień do miski z wodą. Obserwuj, jak słowo się rozmywa. Oddech za oddechem — opór traci formę.',
      'Wytrzyj kamień do sucha, napisz na nim słowo "działam" i połóż obok świecy aż dogori.',
    ],
    energy: 'Napięcie i wzrost. Wola, która przekracza granice.',
  },
  {
    phase: 'Przybywający Garb',
    name: 'Rytuał Wdzięczności i Otwartości',
    duration: '25 min',
    intention: 'Poszerzenie recepcji i wzmocnienie energii przyjmowania',
    materials: ['Biała lub kremowa świeca', 'Kwiat (świeży lub suszony)', 'Dziennik lub kartki', 'Cytryna lub olejek cytrusowy'],
    steps: [
      'Stwórz spokojne miejsce z kwiatem w centrum. Zanurz palec w olejku cytrusowym lub przekrój cytrynę — zapach otwiera zmysły.',
      'Zapal białą świecę. Napisz 7 rzeczy, za które czujesz wdzięczność — bez cenzury, bez hierarchii.',
      'Przeczytaj każdą z nich na głos, kładąc dłoń na sercu. Pozwól ciepłu wdzięczności rozszerzyć się w klatce piersiowej.',
      'Zamknij oczy i wyobraź sobie, że jesteś jak księżyc — coraz bardziej rozświetlony, coraz bardziej widoczny.',
      'Zabierz kwiat i połóż go przy swoim łóżku jako symbol otwartości przez kolejne trzy noce.',
    ],
    energy: 'Ekspansja i obfitość. Światło, które rośnie.',
  },
  {
    phase: 'Pełnia',
    name: 'Rytuał Kulminacji i Objawienia',
    duration: '40 min',
    intention: 'Przyjęcie mocy pełni, widzenie prawdy, świętowanie drogi',
    materials: ['3 białe świece', 'Miska z wodą', 'Kryształ selenit lub księżycowy kamień', 'Zioła: rumianek lub biała szałwia'],
    steps: [
      'Wyjdź na zewnątrz lub stań przy otwartym oknie. Przez 3 minuty patrz na pełnię lub wyobrażaj sobie jej blask. Poczuj go na twarzy.',
      'Zapal trzy świece w trójkącie. Pośrodku postaw miskę z wodą i zanurz kryształ.',
      'Napisz na kartce wszystko, co osiągnąłeś od ostatniego nówu — nawet drobne kroki. Przeczytaj to na głos.',
      'Puść unoszący się dym ziół wokół siebie. Powiedz: "Widzę drogę, którą przeszłam/em. Jestem wdzięczna/y za każdy krok."',
      'Zanurz palce w wodzie z kryształem. Nanieś kroplę wody na czoło (trzecie oko) i serce. Zakończ głębokim oddechem w ciszy.',
    ],
    energy: 'Pełnia mocy. Czas widzenia i świętowania.',
  },
  {
    phase: 'Ubywający Garb',
    name: 'Rytuał Wypuszczania Balastów',
    duration: '30 min',
    intention: 'Zidentyfikowanie i uwolnienie tego, co już nie służy',
    materials: ['Fioletowa lub granatowa świeca', 'Papier do spalenia (lub wodoszczelny)', 'Kadzidło: drzewo sandałowe lub mirra', 'Misa ognioodporna'],
    steps: [
      'Usiądź ze świecą i kadzidłem. Pozwól dymowi krążyć swobodnie. Oddychaj głęboko przez 5 minut.',
      'Napisz na papierze co najmniej 5 rzeczy: przekonań, nawyków, relacji-wzorców lub emocji, które chcesz puścić.',
      'Przeczytaj każdą pozycję. Po każdej powiedz: "Dziękuję za naukę. Teraz cię zwalniam."',
      'Jeśli to bezpieczne, spal papier w misie. Obserwuj, jak każde słowo przemienia się w dym i światło.',
      'Zostań w ciszy przez 10 minut. Wyobraź sobie, że księżyc zabiera ze sobą wszystko, co puściłaś/eś.',
    ],
    energy: 'Oczyszczenie i odpuszczanie. Mądrość w zwalnianiu.',
  },
  {
    phase: 'Ostatnia Kwadra',
    name: 'Rytuał Odpoczynku i Integracji',
    duration: '20 min',
    intention: 'Zebranie mądrości cyklu i przygotowanie do odnowy',
    materials: ['Niebieska lub szara świeca', 'Dziennik', 'Herbata ziołowa (lawenda, rumianek)', 'Miękki koc'],
    steps: [
      'Przygotuj ciepłą herbatę. Owiń się kocem. Stwórz atmosferę absolutnego odpoczynku i bezpieczeństwa.',
      'Zapal świecę. Zapytaj siebie: "Czego nauczył mnie ten cykl? Co ze mnie wyciągnął?"',
      'Pisz w dzienniku przez 10 minut — bez planu, bez celu — tylko to, co chce się wyrazić.',
      'Połóż dłonie na sercu i zamknij oczy. Podziękuj sobie za cały cykl — za wszystko, co przeżyłaś/eś.',
      'Dopij herbatę w ciszy. Ten rytuał to zasłużony odpoczynek przed nowym nówem.',
    ],
    energy: 'Cisza po burzy. Czas na integrację i odpoczynek.',
  },
  {
    phase: 'Ubywający Sierp',
    name: 'Rytuał Wyciszenia i Czystości',
    duration: '20 min',
    intention: 'Oczyszczenie przestrzeni i energetyczne zamknięcie cyklu',
    materials: ['Biała lub srebrna świeca', 'Sól morska', 'Biała szałwia lub palo santo', 'Mała miska'],
    steps: [
      'Chodzisz po domu z kadzidłem białej szałwii, okrążając każde pomieszczenie zgodnie z ruchem wskazówek zegara.',
      'W centralnym miejscu wysyp sól morską na miskę. To symbol wchłaniania wszystkiego, co pozostało.',
      'Zapal białą świecę. Przez 5 minut siedź i wyobrażaj sobie, że białe światło wypełnia każdy kąt Twojej przestrzeni.',
      'Napisz jedno zdanie: "W tym cyklu nauczyłam/em się, że…" i przeczytaj je cicho.',
      'Wrzuć sól do toalety lub wysyp poza dom. Nowy cykl zaczyna się w czystości.',
    ],
    energy: 'Spokój i oczyszczenie. Gotowość na pustkę.',
  },
];

function getRitualForPhase(phaseName: string): LunarRitual {
  return LUNAR_RITUALS.find(r => r.phase === phaseName) ?? LUNAR_RITUALS[0];
}

// ── SACRED TIMING ─────────────────────────────────────────────
const SACRED_TIMES = [
  { label: 'Świt', time: '05:30', desc: 'Intencje i nowe początki', color: '#FDE68A', icon: Sun },
  { label: 'Południe', time: '12:00', desc: 'Manifestacja i działanie', color: '#FCA5A5', icon: Sparkles },
  { label: 'Zmierzch', time: '19:30', desc: 'Uwalnianie i wdzięczność', color: '#C4B5FD', icon: Moon },
  { label: 'Północ', time: '00:00', desc: 'Głęboka medytacja i przejście', color: '#60A5FA', icon: Star },
];

// ── ORACLE PROMPTS ─────────────────────────────────────────────
const MOON_ORACLE_PROMPTS = [
  'Jakie lekcje przynosi mi ta faza księżyca?',
  'Co powinienem/powinnam puścić w tym cyklu?',
  'Jaka energia jest teraz dostępna dla mnie?',
  'Co mówi mi księżyc o mojej drodze?',
];

// ── WEEK STRIP ────────────────────────────────────────────────
function getWeekDays(): { label: string; date: Date; dayName: string }[] {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      label: ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'][i],
      date: d,
      dayName: ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'][i],
    };
  });
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function MoonRitualScreen({ navigation }: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const lunarIntentions = useAppStore(s => s.lunarIntentions);
  const addLunarIntent = useAppStore(s => s.addLunarIntent);
  const favoriteItems = useAppStore(s => s.favoriteItems);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const isDark = !isLight;
  const textColor  = isLight ? '#1A1410' : '#F5F1EA';
  const subColor   = isLight ? '#6A5A48' : '#B0A393';
  const cardBg     = isLight ? 'rgba(240,228,210,0.90)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';
  const accent     = ACCENT;

  const today = new Date();
  const moonAge = getMoonAge(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const phaseName = getMoonPhaseName(moonAge);
  const phaseEmoji = getMoonPhaseEmoji(moonAge);
  const illumination = getMoonIllumination(moonAge);
  const todayRitual = useMemo(() => getRitualForPhase(phaseName), [phaseName]);
  const weekDays = useMemo(() => getWeekDays(), []);

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerDuration, setTimerDuration] = useState(300);
  const timerRef = useRef<any>(null);
  const timerProgress = timerDuration > 0 ? Math.min(timerSeconds / timerDuration, 1) : 0;

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => {
          if (s >= timerDuration) {
            setTimerRunning(false);
            clearInterval(timerRef.current);
            HapticsService.notify();
            return 0;
          }
          return s + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning, timerDuration]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Journal
  const [journalText, setJournalText] = useState('');
  const [journalEntries, setJournalEntries] = useState<{ id: string; text: string; phase: string; emoji: string; date: string }[]>([]);

  const saveJournalEntry = () => {
    if (!journalText.trim()) return;
    HapticsService.notify();
    setJournalEntries(prev => [
      { id: Date.now().toString(), text: journalText.trim(), phase: phaseName, emoji: phaseEmoji, date: formatLocaleDate(today) },
      ...prev.slice(0, 6),
    ]);
    setJournalText('');
    Keyboard.dismiss();
  };

  // Full moon intentions
  const [fullIntentions, setFullIntentions] = useState(['', '', '']);
  const [fullDone, setFullDone] = useState([false, false, false]);

  // New moon wishes
  const [newWishes, setNewWishes] = useState(['', '', '']);
  const [newDone, setNewDone] = useState([false, false, false]);

  // Week strip selected day
  const [selectedDay, setSelectedDay] = useState(today.getDay() === 0 ? 6 : today.getDay() - 1);

  // Oracle
  const [oracleInput, setOracleInput] = useState('');
  const [oracleResponse, setOracleResponse] = useState('');
  const [oracleLoading, setOracleLoading] = useState(false);

  const askOracle = async (q?: string) => {
    const query = q ?? oracleInput;
    if (!query.trim()) return;
    setOracleLoading(true);
    setOracleResponse('');
    HapticsService.notify();
    try {
      const messages = [
        {
          role: 'system' as const,
          content: `Jesteś księżycowym wyrocznym, mistycznym przewodnikiem rytuałów lunarnych. Dzisiejsza faza księżyca to ${phaseName} (wiek: ${moonAge.toFixed(1)} dni, oświetlenie: ${illumination}%). Imię użytkownika: ${userData?.name || 'wędrowiec'}. Odpowiadaj głęboko, poetycko, z wiedzą tradycji lunarnych. Max 4 zdania.`,
        },
        { role: 'user' as const, content: query },
      ];
      const res = await AiService.chatWithOracle(messages);
      setOracleResponse(res);
    } catch {
      setOracleResponse('Księżyc milczy dziś w ciemności. Spróbuj ponownie za chwilę.');
    } finally {
      setOracleLoading(false);
    }
  };

  // Favorite
  const isFav = favoriteItems?.some(f => f.route === 'MoonRitual');
  const toggleFav = () => {
    HapticsService.notify();
    if (isFav) {
      const item = favoriteItems.find(f => f.route === 'MoonRitual');
      if (item) removeFavoriteItem?.(item.id);
    } else {
      addFavoriteItem?.({ id: Date.now().toString(), label: 'Rytuał Księżycowy', route: 'MoonRitual', icon: 'Moon', color: accent, addedAt: new Date().toISOString() });
    }
  };

  // Progress ring animation
  const RING_R = 54;
  const RING_C = 2 * Math.PI * RING_R;
  const ringProg = useSharedValue(0);
  useEffect(() => {
    ringProg.value = withTiming(timerProgress, { duration: 500 });
  }, [timerProgress]);
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_C * (1 - ringProg.value),
  }));
  // Ritual steps expanded
  const [stepsExpanded, setStepsExpanded] = useState(false);

  // Selected week day info
  const selDate = weekDays[selectedDay]?.date ?? today;
  const selAge = getMoonAge(selDate.getFullYear(), selDate.getMonth() + 1, selDate.getDate());
  const selPhase = getMoonPhaseName(selAge);
  const selEmoji = getMoonPhaseEmoji(selAge);
  const selIllum = getMoonIllumination(selAge);

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <MoonBg isDark={!isLight} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.headerBtn} hitSlop={8}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Typography variant="label" style={{ color: subColor, letterSpacing: 2, fontSize: 10 }}>RYTUAŁY LUNARNY</Typography>
          <Typography variant="h3" style={{ color: textColor, fontWeight: '700', marginTop: 1 }}>Księżycowy Portal</Typography>
        </View>
        <Pressable onPress={toggleFav} style={styles.headerBtn} hitSlop={8}>
          <Star size={20} color={accent} fill={isFav ? accent : 'none'} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 3D Moon Widget */}
        <MoonWidget3D accent={accent} />

        {/* ── SECTION 1: Current Moon Phase ─────────────────── */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <MoonPhaseSvg age={moonAge} size={88} />
              <View style={{ flex: 1 }}>
                <Typography variant="microLabel" style={{ color: accent, letterSpacing: 2, fontSize: 9, marginBottom: 2 }}>FAZA DZISIAJ</Typography>
                <Typography variant="h2" style={{ color: textColor, fontWeight: '800', fontSize: 22 }}>{phaseEmoji} {phaseName}</Typography>
                <Typography variant="body" style={{ color: subColor, marginTop: 3 }}>Wiek: {moonAge.toFixed(1)} dni</Typography>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
                  <View style={{ height: 6, flex: 1, borderRadius: 3, backgroundColor: cardBorder, overflow: 'hidden' }}>
                    <View style={{ height: 6, width: `${illumination}%`, borderRadius: 3, backgroundColor: accent }} />
                  </View>
                  <Typography variant="microLabel" style={{ color: accent, fontWeight: '700', fontSize: 11 }}>{illumination}%</Typography>
                </View>
                <Typography variant="caption" style={{ color: subColor, marginTop: 2, fontSize: 10 }}>Oświetlenie tarczy</Typography>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── SECTION 2: Today's Lunar Ritual ───────────────── */}
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <Typography variant="microLabel" style={[styles.sectionLabel, { color: subColor }]}>RYTUAŁ NA DZIŚ</Typography>
          <LinearGradient
            colors={isLight ? ['rgba(196,181,253,0.12)', 'rgba(196,181,253,0.06)'] : ['rgba(196,181,253,0.14)', 'rgba(120,100,200,0.06)']}
            style={[styles.card, { borderColor: accent + '44', borderWidth: 1 }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Typography variant="microLabel" style={{ color: accent, letterSpacing: 2, fontSize: 9 }}>{phaseName.toUpperCase()}</Typography>
                <Typography variant="h3" style={{ color: textColor, fontWeight: '800', marginTop: 2 }}>{todayRitual.name}</Typography>
              </View>
              <View style={{ backgroundColor: accent + '22', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Typography variant="caption" style={{ color: accent, fontWeight: '600' }}>{todayRitual.duration}</Typography>
              </View>
            </View>

            <Typography variant="body" style={{ color: subColor, fontStyle: 'italic', marginBottom: 10 }}>
              ✨ {todayRitual.intention}
            </Typography>

            <Typography variant="microLabel" style={{ color: subColor, letterSpacing: 1.5, fontSize: 9, marginBottom: 6 }}>MATERIAŁY</Typography>
            {todayRitual.materials.map((m, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: accent }} />
                <Typography variant="body" style={{ color: textColor, flex: 1 }}>{m}</Typography>
              </View>
            ))}

            <Pressable
              onPress={() => { setStepsExpanded(p => !p); HapticsService.notify(); }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: cardBorder }}
            >
              <Typography variant="label" style={{ color: accent, fontWeight: '700' }}>Kroki rytuału</Typography>
              {stepsExpanded ? <ChevronUp size={18} color={accent} /> : <ChevronDown size={18} color={accent} />}
            </Pressable>

            {stepsExpanded && (
              <View style={{ marginTop: 10 }}>
                {todayRitual.steps.map((step, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(i * 60).springify()} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: accent + '28', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="caption" style={{ color: accent, fontWeight: '800', fontSize: 11 }}>{i + 1}</Typography>
                    </View>
                    <Typography variant="body" style={{ color: textColor, flex: 1, lineHeight: 22 }}>{step}</Typography>
                  </Animated.View>
                ))}
                <View style={{ marginTop: 8, padding: 10, borderRadius: 10, backgroundColor: accent + '12' }}>
                  <Typography variant="caption" style={{ color: accent, fontStyle: 'italic', textAlign: 'center' }}>
                    🌙 {todayRitual.energy}
                  </Typography>
                </View>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* ── SECTION 3: Ritual Timer ────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Typography variant="microLabel" style={[styles.sectionLabel, { color: subColor }]}>TIMER RYTUAŁU</Typography>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, alignItems: 'center' }]}>
            {/* Duration chips */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[5, 10, 15, 20, 25, 30].map(m => (
                <Pressable
                  key={m}
                  onPress={() => { if (!timerRunning) { setTimerDuration(m * 60); setTimerSeconds(0); HapticsService.notify(); } }}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
                    backgroundColor: timerDuration === m * 60 ? accent : cardBg,
                    borderWidth: 1, borderColor: timerDuration === m * 60 ? accent : cardBorder,
                  }}
                >
                  <Typography variant="caption" style={{ color: timerDuration === m * 60 ? '#fff' : subColor, fontWeight: '600' }}>{m} min</Typography>
                </Pressable>
              ))}
            </View>

            {/* SVG Progress Ring */}
            <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Svg width={130} height={130}>
                <Circle cx={65} cy={65} r={RING_R} fill="none" stroke={cardBorder} strokeWidth={6} />
                <AnimatedCircle
                  cx={65} cy={65} r={RING_R}
                  fill="none" stroke={accent} strokeWidth={6}
                  strokeDasharray={RING_C}
                  strokeLinecap="round"
                  animatedProps={ringProps}
                  transform="rotate(-90 65 65)"
                />
              </Svg>
              <View style={{ position: 'absolute', alignItems: 'center' }}>
                <Typography variant="h2" style={{ color: textColor, fontWeight: '800', fontSize: 26 }}>
                  {formatTime(timerSeconds)}
                </Typography>
                <Typography variant="caption" style={{ color: subColor, fontSize: 10 }}>
                  / {formatTime(timerDuration)}
                </Typography>
              </View>
            </View>

            {/* Controls */}
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <Pressable
                onPress={() => { setTimerRunning(p => !p); HapticsService.notify(); }}
                style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}
              >
                {timerRunning ? <Pause size={22} color="#fff" /> : <Play size={22} color="#fff" />}
              </Pressable>
              <Pressable
                onPress={() => { setTimerRunning(false); setTimerSeconds(0); HapticsService.notify(); }}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder, alignItems: 'center', justifyContent: 'center' }}
              >
                <RotateCcw size={18} color={subColor} />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* ── SECTION 4: Lunar Journal ───────────────────────── */}
        <Animated.View entering={FadeInDown.delay(260).springify()}>
          <Typography variant="microLabel" style={[styles.sectionLabel, { color: subColor }]}>DZIENNIK LUNARNY</Typography>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: accent + '22' }}>
                <Typography variant="caption" style={{ color: accent, fontWeight: '700' }}>{phaseEmoji} {phaseName}</Typography>
              </View>
              <Typography variant="caption" style={{ color: subColor }}>
                {today.toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'long' })}
              </Typography>
            </View>
            <TextInput
              style={[styles.input, { color: textColor, borderColor: cardBorder, backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)', minHeight: 80 }]}
              placeholder={`Jakie refleksje przynosi Ci ${phaseName}?`}
              placeholderTextColor={subColor}
              multiline
              value={journalText}
              onChangeText={setJournalText}
            />
            <Pressable
              onPress={saveJournalEntry}
              style={[styles.cta, { backgroundColor: accent, marginTop: 10 }]}
            >
              <BookOpen size={16} color="#fff" />
              <Typography variant="label" style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>Zapisz refleksję</Typography>
            </Pressable>

            {journalEntries.length > 0 && (
              <View style={{ marginTop: 14 }}>
                <Typography variant="microLabel" style={{ color: subColor, letterSpacing: 1.5, fontSize: 9, marginBottom: 8 }}>OSTATNIE WPISY</Typography>
                {journalEntries.map((e, i) => (
                  <Animated.View key={e.id} entering={FadeInDown.delay(i * 50).springify()} style={{ marginBottom: 8, padding: 10, borderRadius: 10, backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: cardBorder }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Typography variant="caption" style={{ color: accent }}>{e.emoji} {e.phase}</Typography>
                      <Typography variant="caption" style={{ color: subColor, fontSize: 10 }}>{e.date}</Typography>
                    </View>
                    <Typography variant="body" style={{ color: textColor, lineHeight: 20 }} numberOfLines={3}>{e.text}</Typography>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── SECTION 5: Full Moon Intentions ───────────────── */}
        <Animated.View entering={FadeInDown.delay(320).springify()}>
          <Typography variant="microLabel" style={[styles.sectionLabel, { color: subColor }]}>INTENCJE NA PEŁNIĘ</Typography>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Typography variant="caption" style={{ color: subColor, marginBottom: 12, lineHeight: 18 }}>
              Zapisz trzy intencje lub pragnienia, które chcesz zobaczyć w blasku pełni. Zaznacz spełnione.
            </Typography>
            {fullIntentions.map((val, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Pressable onPress={() => { const n = [...fullDone]; n[i] = !n[i]; setFullDone(n); HapticsService.notify(); }}>
                  {fullDone[i]
                    ? <CheckCircle2 size={22} color={accent} />
                    : <CircleIcon size={22} color={subColor} />}
                </Pressable>
                <TextInput
                  style={[styles.input, { flex: 1, color: fullDone[i] ? subColor : textColor, borderColor: cardBorder, backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', textDecorationLine: fullDone[i] ? 'line-through' : 'none', minHeight: 42, paddingVertical: 8 }]}
                  placeholder={`Intencja ${i + 1}…`}
                  placeholderTextColor={subColor}
                  value={val}
                  onChangeText={t => { const n = [...fullIntentions]; n[i] = t; setFullIntentions(n); }}
                />
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── SECTION 6: New Moon Wishes ─────────────────────── */}
        <Animated.View entering={FadeInDown.delay(380).springify()}>
          <Typography variant="microLabel" style={[styles.sectionLabel, { color: subColor }]}>ŻYCZENIA NA NÓW</Typography>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Typography variant="caption" style={{ color: subColor, marginBottom: 12, lineHeight: 18 }}>
              W nów zasadzasz ziarno. Jakie trzy życzenia zechcesz zasadzić w ciemności nowego cyklu?
            </Typography>
            {newWishes.map((val, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Pressable onPress={() => { const n = [...newDone]; n[i] = !n[i]; setNewDone(n); HapticsService.notify(); }}>
                  {newDone[i]
                    ? <CheckCircle2 size={22} color={'#34D399'} />
                    : <CircleIcon size={22} color={subColor} />}
                </Pressable>
                <TextInput
                  style={[styles.input, { flex: 1, color: newDone[i] ? subColor : textColor, borderColor: cardBorder, backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', textDecorationLine: newDone[i] ? 'line-through' : 'none', minHeight: 42, paddingVertical: 8 }]}
                  placeholder={`Życzenie ${i + 1}…`}
                  placeholderTextColor={subColor}
                  value={val}
                  onChangeText={t => { const n = [...newWishes]; n[i] = t; setNewWishes(n); }}
                />
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── SECTION 7: Moon Calendar Mini-Strip ───────────── */}
        <Animated.View entering={FadeInDown.delay(440).springify()}>
          <Typography variant="microLabel" style={[styles.sectionLabel, { color: subColor }]}>TYGODNIOWY KALENDARZ KSIĘŻYCA</Typography>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {weekDays.map((wd, i) => {
                const dAge = getMoonAge(wd.date.getFullYear(), wd.date.getMonth() + 1, wd.date.getDate());
                const dEmoji = getMoonPhaseEmoji(dAge);
                const isToday = i === (today.getDay() === 0 ? 6 : today.getDay() - 1);
                const isSel = i === selectedDay;
                return (
                  <Pressable
                    key={i}
                    onPress={() => { setSelectedDay(i); HapticsService.notify(); }}
                    style={{
                      flex: 1, alignItems: 'center', paddingVertical: 10, marginHorizontal: 2, borderRadius: 10,
                      backgroundColor: isSel ? accent + '28' : isToday ? cardBg : 'transparent',
                      borderWidth: isSel ? 1 : 0, borderColor: accent,
                    }}
                  >
                    <Typography variant="caption" style={{ color: isSel ? accent : subColor, fontWeight: isSel ? '700' : '400', fontSize: 9 }}>{wd.label}</Typography>
                    <Typography style={{ fontSize: 18, marginVertical: 3 }}>{dEmoji}</Typography>
                    <Typography variant="caption" style={{ color: isSel ? accent : subColor, fontSize: 9 }}>{wd.date.getDate()}</Typography>
                  </Pressable>
                );
              })}
            </View>

            {/* Detail of selected day */}
            <View style={{ marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: cardBorder }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                  {weekDays[selectedDay]?.dayName} — {selEmoji} {selPhase}
                </Typography>
                <Typography variant="caption" style={{ color: accent, fontWeight: '700' }}>{selIllum}%</Typography>
              </View>
              <Typography variant="caption" style={{ color: subColor, marginTop: 4 }}>
                {weekDays[selectedDay]?.date.toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'long' })} · Wiek: {selAge.toFixed(1)} dni
              </Typography>
            </View>
          </View>
        </Animated.View>

        {/* ── SECTION 8: Sacred Timing ───────────────────────── */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <Typography variant="microLabel" style={[styles.sectionLabel, { color: subColor }]}>ŚWIĘTE GODZINY RYTUAŁÓW</Typography>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Typography variant="caption" style={{ color: subColor, marginBottom: 12, lineHeight: 18 }}>
              Każda pora dnia niesie inną energię. Wybierz czas odpowiedni dla zamierzonego rytuału.
            </Typography>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SACRED_TIMES.map((st, i) => {
                const IconCmp = st.icon;
                return (
                  <Animated.View
                    key={i}
                    entering={FadeInDown.delay(520 + i * 60).springify()}
                    style={{
                      flex: 1, minWidth: (SW - layout.padding.screen * 2 - 24) / 2 - 4,
                      padding: 12, borderRadius: 12,
                      backgroundColor: isLight ? st.color + '18' : st.color + '14',
                      borderWidth: 1, borderColor: st.color + '44',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <IconCmp size={14} color={st.color} />
                      <Typography variant="label" style={{ color: st.color, fontWeight: '700' }}>{st.label}</Typography>
                    </View>
                    <Typography variant="h3" style={{ color: textColor, fontWeight: '800', fontSize: 18 }}>{st.time}</Typography>
                    <Typography variant="caption" style={{ color: subColor, marginTop: 3, lineHeight: 16 }}>{st.desc}</Typography>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* ── SECTION 9: Oracle AI ──────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(560).springify()}>
          <Typography variant="microLabel" style={[styles.sectionLabel, { color: subColor }]}>WYROCZNIA KSIĘŻYCOWA</Typography>
          <LinearGradient
            colors={isLight ? ['rgba(196,181,253,0.10)', 'rgba(196,181,253,0.04)'] : ['rgba(196,181,253,0.12)', 'rgba(100,80,180,0.04)']}
            style={[styles.card, { borderColor: accent + '33', borderWidth: 1 }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Wand2 size={18} color={accent} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>Zapytaj księżycową wyrocznię</Typography>
            </View>

            {/* Quick prompts */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
                {MOON_ORACLE_PROMPTS.map((p, i) => (
                  <Pressable
                    key={i}
                    onPress={() => { setOracleInput(p); askOracle(p); }}
                    style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: accent + '22', borderWidth: 1, borderColor: accent + '44' }}
                  >
                    <Typography variant="caption" style={{ color: accent, fontWeight: '600' }} numberOfLines={1}>{p}</Typography>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <TextInput
              style={[styles.input, { color: textColor, borderColor: cardBorder, backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)', minHeight: 72 }]}
              placeholder="Zadaj pytanie wyroczni księżyca…"
              placeholderTextColor={subColor}
              multiline
              value={oracleInput}
              onChangeText={setOracleInput}
            />
            <Pressable
              onPress={() => askOracle()}
              style={[styles.cta, { backgroundColor: oracleLoading ? accent + '80' : accent, marginTop: 10 }]}
              disabled={oracleLoading}
            >
              <Moon size={16} color="#fff" />
              <Typography variant="label" style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>
                {oracleLoading ? 'Księżyc odpowiada…' : 'Zapytaj wyrocznię'}
              </Typography>
            </Pressable>

            {!!oracleResponse && (
              <Animated.View entering={FadeInDown.springify()} style={{ marginTop: 14, padding: 14, borderRadius: 12, backgroundColor: accent + '12', borderWidth: 1, borderColor: accent + '33' }}>
                <Typography variant="caption" style={{ color: accent, letterSpacing: 1.5, fontSize: 9, marginBottom: 6 }}>ODPOWIEDŹ WYROCZNI</Typography>
                <Typography variant="body" style={{ color: textColor, lineHeight: 24, fontStyle: 'italic' }}>{oracleResponse}</Typography>
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>

        <EndOfContentSpacer />
      </ScrollView>
        </SafeAreaView>
</View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: {
    letterSpacing: 2, fontSize: 9, marginTop: 22, marginBottom: 8,
  },
  card: {
    borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 4,
  },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, lineHeight: 20,
  },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 14,
  },
});
