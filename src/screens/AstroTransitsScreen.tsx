// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  KeyboardAvoidingView, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, Ellipse, G, Line, Text as SvgText,
} from 'react-native-svg';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Sparkles, Zap, ArrowRight, Send,
  BookOpen, Clock, TrendingUp, Eye, X, ChevronDown, ChevronUp,
  AlertCircle, Info, Globe,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#8B5CF6';

// ── BACKGROUND ──────────────────────────────────────────────────
const TransitBg = ({ isLight }: { isLight: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight
        ? ['#EEF2FF', '#E8EDFF', '#EEF2FF']
        : ['#02040F', '#040A1C', '#070E28']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={700} style={StyleSheet.absoluteFill} opacity={isLight ? 0.09 : 0.17}>
      <G>
        {[...Array(30)].map((_, i) => (
          <Circle
            key={i}
            cx={(i * 97 + 15) % SW}
            cy={(i * 83 + 22) % 680}
            r={i % 7 === 0 ? 2.0 : 0.9}
            fill={ACCENT}
            opacity={0.15 + (i % 5) * 0.07}
          />
        ))}
        {[70, 140, 210, 280].map((r, i) => (
          <Circle
            key={'ring' + i}
            cx={SW / 2}
            cy={300}
            r={r}
            fill="none"
            stroke={ACCENT}
            strokeWidth={0.6}
            opacity={0.05 + i * 0.02}
          />
        ))}
      </G>
    </Svg>
  </View>
);

// ── 3D SOLAR SYSTEM WIDGET ─────────────────────────────────────
const PLANETS = [
  { name: 'Merkury', color: '#A78BFA', orbitRx: 38, orbitRy: 16, size: 5, period: 4200, phase: 0.1 },
  { name: 'Wenus', color: '#F9A8D4', orbitRx: 56, orbitRy: 22, size: 7, period: 6800, phase: 0.4 },
  { name: 'Ziemia', color: '#60A5FA', orbitRx: 72, orbitRy: 28, size: 7.5, period: 10000, phase: 0.7 },
  { name: 'Mars', color: '#F97316', orbitRx: 88, orbitRy: 34, size: 6, period: 14000, phase: 0.2 },
  { name: 'Jowisz', color: '#FBBF24', orbitRx: 104, orbitRy: 40, size: 10, period: 22000, phase: 0.55 },
];

const ZODIAC_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

const SolarSystemWidget = ({ accent }: { accent: string }) => {
  const { t } = useTranslation();

  const anim0 = useSharedValue(PLANETS[0].phase * 360);
  const anim1 = useSharedValue(PLANETS[1].phase * 360);
  const anim2 = useSharedValue(PLANETS[2].phase * 360);
  const anim3 = useSharedValue(PLANETS[3].phase * 360);
  const anim4 = useSharedValue(PLANETS[4].phase * 360);
  const planetAnims = [anim0, anim1, anim2, anim3, anim4];

  const tiltX = useSharedValue(-10);
  const tiltY = useSharedValue(0);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    PLANETS.forEach((p, i) => {
      planetAnims[i].value = withRepeat(
        withTiming(p.phase * 360 + 360, { duration: p.period, easing: Easing.linear }),
        -1,
        false
      );
    });
    scale.value = withRepeat(
      withSequence(withTiming(1.02, { duration: 3000 }), withTiming(0.95, { duration: 3000 })),
      -1, false
    );
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-25, Math.min(25, -10 + e.translationY * 0.18));
      tiltY.value = Math.max(-25, Math.min(25, e.translationX * 0.18));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-10, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 560 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: scale.value },
    ],
  }));

  const pStyle0 = useAnimatedStyle(() => {
    const rad = (anim0.value * Math.PI) / 180;
    return { transform: [{ translateX: PLANETS[0].orbitRx * Math.cos(rad) }, { translateY: PLANETS[0].orbitRy * Math.sin(rad) }] };
  });
  const pStyle1 = useAnimatedStyle(() => {
    const rad = (anim1.value * Math.PI) / 180;
    return { transform: [{ translateX: PLANETS[1].orbitRx * Math.cos(rad) }, { translateY: PLANETS[1].orbitRy * Math.sin(rad) }] };
  });
  const pStyle2 = useAnimatedStyle(() => {
    const rad = (anim2.value * Math.PI) / 180;
    return { transform: [{ translateX: PLANETS[2].orbitRx * Math.cos(rad) }, { translateY: PLANETS[2].orbitRy * Math.sin(rad) }] };
  });
  const pStyle3 = useAnimatedStyle(() => {
    const rad = (anim3.value * Math.PI) / 180;
    return { transform: [{ translateX: PLANETS[3].orbitRx * Math.cos(rad) }, { translateY: PLANETS[3].orbitRy * Math.sin(rad) }] };
  });
  const pStyle4 = useAnimatedStyle(() => {
    const rad = (anim4.value * Math.PI) / 180;
    return { transform: [{ translateX: PLANETS[4].orbitRx * Math.cos(rad) }, { translateY: PLANETS[4].orbitRy * Math.sin(rad) }] };
  });
  const planetStyles = [pStyle0, pStyle1, pStyle2, pStyle3, pStyle4];

  const W = 240;
  const CX = W / 2;
  const CY = W / 2;

  return (
    <View style={{ alignItems: 'center', marginVertical: 16 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: W, height: W, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>
          <Svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} style={StyleSheet.absoluteFill}>
            {/* Zodiac outer ring */}
            <Circle cx={CX} cy={CY} r={118} fill="none" stroke={accent} strokeWidth={0.7} opacity={0.22} />
            {/* Zodiac glyph marks */}
            {ZODIAC_GLYPHS.map((glyph, i) => {
              const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
              const r = 112;
              const x = CX + r * Math.cos(a);
              const y = CY + r * Math.sin(a);
              return (
                <SvgText
                  key={glyph}
                  x={x} y={y + 4}
                  fontSize={8}
                  fill={accent}
                  opacity={0.55}
                  textAnchor="middle"
                >
                  {glyph}
                </SvgText>
              );
            })}
            {/* Tick marks */}
            {Array.from({ length: 36 }, (_, i) => {
              const a = (i / 36) * Math.PI * 2;
              const r1 = 118; const r2 = i % 3 === 0 ? 111 : 114;
              return (
                <Line
                  key={'tick' + i}
                  x1={CX + r1 * Math.cos(a)} y1={CY + r1 * Math.sin(a)}
                  x2={CX + r2 * Math.cos(a)} y2={CY + r2 * Math.sin(a)}
                  stroke={accent} strokeWidth={0.6} opacity={0.3}
                />
              );
            })}
            {/* Planet orbits */}
            {PLANETS.map((p, i) => (
              <Ellipse
                key={'orb' + i}
                cx={CX} cy={CY}
                rx={p.orbitRx} ry={p.orbitRy}
                fill="none"
                stroke={p.color}
                strokeWidth={0.6}
                strokeDasharray="2 6"
                opacity={0.28}
              />
            ))}
            {/* Sun */}
            <Circle cx={CX} cy={CY} r={13} fill={ACCENT} opacity={0.88} />
            <Circle cx={CX} cy={CY} r={16} fill={ACCENT} opacity={0.18} />
            <Circle cx={CX} cy={CY} r={20} fill={ACCENT} opacity={0.08} />
            {/* Sun rays */}
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return (
                <Line
                  key={'ray' + i}
                  x1={CX + 15 * Math.cos(a)} y1={CY + 15 * Math.sin(a)}
                  x2={CX + 22 * Math.cos(a)} y2={CY + 22 * Math.sin(a)}
                  stroke={ACCENT} strokeWidth={1.2} opacity={0.5}
                />
              );
            })}
          </Svg>
          {/* Animated planets */}
          {PLANETS.map((p, i) => (
            <Animated.View
              key={p.name}
              style={[
                {
                  position: 'absolute',
                  width: p.size * 2,
                  height: p.size * 2,
                  borderRadius: p.size,
                  backgroundColor: p.color,
                  shadowColor: p.color,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.9,
                  shadowRadius: 4,
                  elevation: 4,
                },
                planetStyles[i],
              ]}
            />
          ))}
        </Animated.View>
      </GestureDetector>
      <Typography variant="microLabel" style={{ color: accent, opacity: 0.7, letterSpacing: 2, marginTop: 4 }}>
        {t('astroTransits.uklad_sloneczny_tranzyt', 'UKŁAD SŁONECZNY · TRANZYT')}
      </Typography>
    </View>
  );
};

// ── DATA ────────────────────────────────────────────────────────
interface TransitObj {
  id: string;
  planet: string;
  planetColor: string;
  planetEmoji: string;
  aspect: string;
  aspectSymbol: string;
  targetPlanet: string;
  targetColor: string;
  orb: string;
  influence: string;
  duration: string;
  isPositive: boolean;
}

const TODAY_TRANSITS: TransitObj[] = [
  {
    id: 't1', planet: 'Słońce', planetColor: '#FBBF24', planetEmoji: '☀️',
    aspect: 'Trygin', aspectSymbol: '△', targetPlanet: 'Jowisz',
    targetColor: '#F97316', orb: '1°12\'', isPositive: true,
    influence: 'Ekspansja, optymizm i poczucie szczęścia. Twoja energia i kreatywność są dziś wzmocnione przez łaskę Jowisza. Doskonały czas na decyzje, rozmowy ważne dla przyszłości i podejmowanie ryzyka.',
    duration: 'Aktywny 3 dni',
  },
  {
    id: 't2', planet: 'Merkury', planetColor: '#A78BFA', planetEmoji: '☿',
    aspect: 'Koniunkcja', aspectSymbol: '☌', targetPlanet: 'Wenus',
    targetColor: '#F9A8D4', orb: '0°45\'', isPositive: true,
    influence: 'Harmonia między myślą a sercem. Komunikacja jest dziś naładowana czułością — idealna na rozmowy o miłości, twórcze pisanie i negocjacje estetyczne. Twoje słowa mają dziś magię.',
    duration: 'Aktywny 2 dni',
  },
  {
    id: 't3', planet: 'Mars', planetColor: '#F97316', planetEmoji: '♂',
    aspect: 'Kwadratura', aspectSymbol: '□', targetPlanet: 'Saturn',
    targetColor: '#94A3B8', orb: '2°30\'', isPositive: false,
    influence: 'Napięcie między impulsem a ograniczeniami. Możliwe frustracje, opóźnienia i przeszkody w realizacji planów. Pracuj wytrwale, ale nie forsuj — energia wymaga ukierunkowania, nie wybuchu.',
    duration: 'Aktywny 5 dni',
  },
  {
    id: 't4', planet: 'Wenus', planetColor: '#F9A8D4', planetEmoji: '♀',
    aspect: 'Sekstylia', aspectSymbol: '✦', targetPlanet: 'Neptun',
    targetColor: '#60A5FA', orb: '1°55\'', isPositive: true,
    influence: 'Piękno, duchowość i romantyzm łączą się. Intuicja artystyczna jest zaostrzna. Możliwe głębokie przeżycia estetyczne, mistyczne sny i wrażliwość na muzykę i sztukę.',
    duration: 'Aktywny 4 dni',
  },
  {
    id: 't5', planet: 'Księżyc', planetColor: '#C4B5FD', planetEmoji: '🌙',
    aspect: 'Opozycja', aspectSymbol: '☍', targetPlanet: 'Pluton',
    targetColor: '#EF4444', orb: '0°28\'', isPositive: false,
    influence: 'Intensywne emocje i głęboka transformacja. Stare wzorce emocjonalne mogą wypłynąć. Trudny, ale potężny czas dla pracy terapeutycznej, uwalniania dawnych ran i głębokiej przemiany.',
    duration: 'Aktywny 12 godzin',
  },
  {
    id: 't6', planet: 'Jowisz', planetColor: '#FBBF24', planetEmoji: '♃',
    aspect: 'Trygin', aspectSymbol: '△', targetPlanet: 'Uran',
    targetColor: '#67D1B2', orb: '3°10\'', isPositive: true,
    influence: 'Nagłe szanse i przełomy. Nieoczekiwane drzwi otwierają się w obszarach, gdzie od dawna czekałaś. Twoja gotowość na zmianę jest teraz kluczem do szczęścia i ekspansji.',
    duration: 'Aktywny 3 tygodnie',
  },
  {
    id: 't7', planet: 'Saturn', planetColor: '#94A3B8', planetEmoji: '♄',
    aspect: 'Sekstylia', aspectSymbol: '✦', targetPlanet: 'Chiron',
    targetColor: '#F9A8D4', orb: '1°40\'', isPositive: true,
    influence: 'Leczenie ran przez strukturę i dyscyplinę. Możliwe uzdrowienie dawnych ran emocjonalnych poprzez budowanie zdrowych granic, rutyny i szacunku do siebie.',
    duration: 'Aktywny 2 tygodnie',
  },
  {
    id: 't8', planet: 'Neptun', planetColor: '#60A5FA', planetEmoji: '♆',
    aspect: 'Koniunkcja', aspectSymbol: '☌', targetPlanet: 'Południowy Węzeł',
    targetColor: '#C4B5FD', orb: '0°52\'', isPositive: true,
    influence: 'Karmiczne przebudzenie i duchowe wspomnienia. Możliwe déjà vu, intuicyjne olśnienia i wglądy dotyczące przeszłych żyć. Mistycyzm sięga przez zasłonę czasu.',
    duration: 'Aktywny 1 tydzień',
  },
];

const CHALDEAN_PLANETS = ['Saturn', 'Jowisz', 'Mars', 'Słońce', 'Wenus', 'Merkury', 'Księżyc'];
const CHALDEAN_COLORS = ['#94A3B8', '#FBBF24', '#F97316', '#FBBF24', '#F9A8D4', '#A78BFA', '#C4B5FD'];
const CHALDEAN_EMOJIS = ['♄', '♃', '♂', '☀️', '♀', '☿', '🌙'];
const CHALDEAN_INFLUENCES = [
  'Koncentracja, struktura, praca z ograniczeniami',
  'Ekspansja, hojność, optymizm i szanse',
  'Energia, odwaga, asertywność i działanie',
  'Tożsamość, kreatywność, witalność i przywódcze działanie',
  'Miłość, piękno, estetyka i harmonia relacji',
  'Komunikacja, myślenie, planowanie i kontrakty',
  'Emocje, intuicja, dom i relacje z kobietami',
];

function getPlanetaryHours(): { planet: string; color: string; emoji: string; influence: string; startHour: number; isCurrent: boolean }[] {
  const now = new Date();
  const currentHour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sun
  // Chaldean day ruler index
  const DAY_RULERS = [3, 6, 1, 2, 0, 4, 5]; // Sun=3, Mon=6, Tue=1, Wed=2, Thu=0, Fri=4, Sat=5
  const dayRulerIdx = DAY_RULERS[dayOfWeek];
  const hours: ReturnType<typeof getPlanetaryHours> = [];
  for (let h = 0; h < 24; h++) {
    const planetIdx = (dayRulerIdx + h) % 7;
    hours.push({
      planet: CHALDEAN_PLANETS[planetIdx],
      color: CHALDEAN_COLORS[planetIdx],
      emoji: CHALDEAN_EMOJIS[planetIdx],
      influence: CHALDEAN_INFLUENCES[planetIdx],
      startHour: h,
      isCurrent: h === currentHour,
    });
  }
  return hours;
}

function getZodiacSign(birthDate: string): string {
  if (!birthDate) return '';
  const parts = birthDate.split('-');
  if (parts.length < 3) return '';
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return 'Baran';
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return 'Byk';
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return 'Bliźnięta';
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return 'Rak';
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return 'Lew';
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return 'Panna';
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return 'Waga';
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return 'Skorpion';
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return 'Strzelec';
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return 'Koziorożec';
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return 'Wodnik';
  return 'Ryby';
}

const PERSONAL_HITS: Record<string, string[]> = {
  'Baran': ['t1', 't3', 't6'],
  'Byk': ['t2', 't4', 't7'],
  'Bliźnięta': ['t2', 't3', 't8'],
  'Rak': ['t5', 't7', 't8'],
  'Lew': ['t1', 't3', 't6'],
  'Panna': ['t2', 't4', 't7'],
  'Waga': ['t2', 't4', 't7'],
  'Skorpion': ['t3', 't5', 't8'],
  'Strzelec': ['t1', 't6', 't8'],
  'Koziorożec': ['t3', 't7', 't8'],
  'Wodnik': ['t6', 't7', 't8'],
  'Ryby': ['t4', 't5', 't8'],
};

const WEEKLY_EVENTS: { day: string; date: string; events: { label: string; color: string }[] }[] = [
  { day: 'Pon', date: '31.03', events: [{ label: 'Wenus △ Neptun', color: '#F9A8D4' }, { label: 'Księżyc ☌ Mars', color: '#F97316' }] },
  { day: 'Wto', date: '01.04', events: [{ label: 'Merkury ✦ Saturn', color: '#A78BFA' }, { label: 'Pełnia Księżyca', color: '#C4B5FD' }] },
  { day: 'Śro', date: '02.04', events: [{ label: 'Słońce △ Jowisz', color: '#FBBF24' }, { label: 'Mars □ Uran', color: '#F97316' }] },
  { day: 'Czw', date: '03.04', events: [{ label: 'Wenus ☌ Chiron', color: '#F9A8D4' }] },
  { day: 'Pią', date: '04.04', events: [{ label: 'Neptun ✦ Pluton', color: '#60A5FA' }, { label: 'Księżyc △ Wenus', color: '#C4B5FD' }] },
  { day: 'Sob', date: '05.04', events: [{ label: 'Merkury ☍ Uran', color: '#A78BFA' }, { label: 'Saturn ☌ Jowisz', color: '#94A3B8' }] },
  { day: 'Nie', date: '06.04', events: [{ label: 'Słońce ☌ Merkury', color: '#FBBF24' }] },
];

const RETROGRADE_DATA = [
  {
    planet: 'Merkury',
    emoji: '☿',
    color: '#A78BFA',
    period: '1 kwi – 25 kwi 2026',
    meaning: 'Komunikacja, transport i kontrakty są podatne na opóźnienia, nieporozumienia i rewizje. Stare sprawy wracają — osoby z przeszłości, dawne projekty i niezałatwione kwestie proszą o domknięcie.',
    howToUse: 'Zamiast zaczynać nowe projekty, przeglądaj, poprawiaj i kończ stare. Sprawdzaj dwukrotnie ważne wiadomości. Doskonały czas na medytację, pisanie pamiętnika i wewnętrzne porządkowanie.',
  },
  {
    planet: 'Saturn',
    emoji: '♄',
    color: '#94A3B8',
    period: '29 mar – 19 lip 2026',
    meaning: 'Struktury, które budujesz w życiu, są poddawane próbie. Stare ograniczenia i wzorce dojrzałości wracają, aby zostać przepracowane na głębszym poziomie. Karma karierowa i zawodowa wychodzi na wierzch.',
    howToUse: 'Oceń swoje zobowiązania i granice. Co jest prawdziwym fundamentem twojego życia, a co jest zbudowane na piasku? Retrograd Saturna sprzyja głębokiej pracy z dyscypliną i odpowiedzialnością.',
  },
];

const ASPECT_PATTERNS = [
  {
    id: 'grand_trine',
    name: 'Wielki Trygin',
    symbol: '△△△',
    color: '#67D1B2',
    isActive: true,
    elements: 'Słońce (Baran) △ Jowisz (Lew) △ Mars (Strzelec)',
    meaning: 'Trójkąt doskonałej harmonii w żywiole Ognia. Naturalne talenty, łatwość ekspresji i płynny przepływ energii twórczej. Potencjał jest ogromny, ale może brakować motywacji do działania — harmonia bywa zbyt wygodna.',
  },
  {
    id: 'tsquare',
    name: 'T-Square',
    symbol: '□☍□',
    color: '#F97316',
    isActive: true,
    elements: 'Mars □ Księżyc ☍ Saturn □ Mars',
    meaning: 'Punkt kulminacyjny napięcia domagający się rozwiązania. Konflikty między emocjami, działaniem i ograniczeniami. Choć trudny, T-Square jest najsilniejszym czynnikiem motywującym do przełomowych działań.',
  },
  {
    id: 'yod',
    name: 'Palec Boga (Yod)',
    symbol: '✦✦△',
    color: '#C4B5FD',
    isActive: false,
    elements: 'Wenus ✦ Neptun, Wenus ✦ Pluton (Jowisz wierzchołek)',
    meaning: 'Wskazanie karmiczne. Konfiguracja kosmicznego przeznaczenia wymagająca specyficznej realizacji misji. Jeśli Yod jest aktywny w twoim horoskopie, szczególna rola lub zadanie prosi o wypełnienie.',
  },
];

const ORACLE_PROMPTS = [
  'Jak Merkury Retrograd wpłynie na moje życie?',
  'Który tranzyt jest teraz najważniejszy dla mnie?',
  'Jak najlepiej wykorzystać energię tej konfiguracji?',
  'Co Jupiter mi w tej chwili oferuje?',
];

// ── CURRENT SKY SNAPSHOT ─────────────────────────────────────────
const ZODIAC_SIGNS_PL = ['Baran', 'Byk', 'Bliźnięta', 'Rak', 'Lew', 'Panna', 'Waga', 'Skorpion', 'Strzelec', 'Koziorożec', 'Wodnik', 'Ryby'];

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function getPlanetSign(dayOfYear: number, year: number, daysPerSign: number, offset: number = 0): string {
  const idx = Math.floor((dayOfYear + offset) / daysPerSign) % 12;
  return ZODIAC_SIGNS_PL[Math.abs(idx) % 12];
}

function getCurrentPlanetPositions() {
  const now = new Date();
  const doy = getDayOfYear(now);
  const yr = now.getFullYear();
  // years since 2000 for outer planets
  const daysSince2000 = (now.getTime() - new Date(2000, 0, 1).getTime()) / 86400000;
  return [
    {
      symbol: '⊙', name: 'Słońce', color: '#F59E0B',
      sign: getPlanetSign(doy, yr, 30, 80),
      influence: 'Twoja wola i tożsamość świecą przez ten znak',
    },
    {
      symbol: '☽', name: 'Księżyc', color: '#D4E6F1',
      sign: ZODIAC_SIGNS_PL[Math.floor(doy * 0.4822) % 12],
      influence: 'Emocje i rytm dnia zabarwione tym energetycznie',
    },
    {
      symbol: '☿', name: 'Merkury', color: '#94A3B8',
      sign: getPlanetSign(doy, yr, 18, 60),
      influence: 'Komunikacja, myślenie i decyzje — dziś retrograd',
    },
    {
      symbol: '♀', name: 'Wenus', color: '#F472B6',
      sign: getPlanetSign(doy, yr, 25, 120),
      influence: 'Miłość, wartości i estetyka przez ten pryzmat',
    },
    {
      symbol: '♂', name: 'Mars', color: '#EF4444',
      sign: getPlanetSign(doy, yr, 57, 200),
      influence: 'Działanie, odwaga i pożądanie kierowane tą energią',
    },
    {
      symbol: '♃', name: 'Jowisz', color: '#F97316',
      sign: ZODIAC_SIGNS_PL[Math.floor(daysSince2000 / 365) % 12],
      influence: 'Szanse i ekspansja — błogosławieństwo roku',
    },
    {
      symbol: '♄', name: 'Saturn', color: '#FBBF24',
      sign: ZODIAC_SIGNS_PL[Math.floor(daysSince2000 / 913) % 12],
      influence: 'Lekcje, struktura i dojrzałość — nauka dekady',
    },
    {
      symbol: '♅', name: 'Uran', color: '#38BDF8',
      sign: ZODIAC_SIGNS_PL[Math.floor(daysSince2000 / 2556) % 12],
      influence: 'Rewolucja, innowacja i przebudzenie pokolenia',
    },
    {
      symbol: '♆', name: 'Neptun', color: '#818CF8',
      sign: ZODIAC_SIGNS_PL[Math.floor(daysSince2000 / 5114) % 12],
      influence: 'Mistycyzm, marzenia i duchowe rozpuszczenie',
    },
    {
      symbol: '♇', name: 'Pluton', color: '#8B5CF6',
      sign: ZODIAC_SIGNS_PL[Math.floor(daysSince2000 / 7670) % 12],
      influence: 'Transformacja, władza i cień zbiorowy',
    },
  ];
}

// ── PLANETARY MEANINGS GUIDE ─────────────────────────────────────
const PLANET_MEANINGS = [
  { symbol: '⊙', name: 'Słońce', color: '#F59E0B', meaning: 'Centrum tożsamości, woli i życiowej siły. Twój esencjalny charakter i misja duszy. Gdzie świeci Słońce, tam szukasz wyrazu siebie.' },
  { symbol: '☽', name: 'Księżyc', color: '#D4E6F1', meaning: 'Emocje, intuicja i nieświadomość. Twoja relacja z matką, domem i przeszłością. Rytm wewnętrzny, który rządzi nastrojami i potrzebami.' },
  { symbol: '☿', name: 'Merkury', color: '#94A3B8', meaning: 'Myślenie, komunikacja i uczenie się. Jak przetwarzasz informacje, jak mówisz i piszesz. Planeta kontraktów, podróży krótkich i transakcji.' },
  { symbol: '♀', name: 'Wenus', color: '#F472B6', meaning: 'Miłość, piękno i wartości. Jak i kogo przyciągasz. Estetyka, przyjemność i to, co sprawia że czujesz się kochana i cenna.' },
  { symbol: '♂', name: 'Mars', color: '#EF4444', meaning: 'Działanie, odwaga i pożądanie. Jak walczysz, jak realizujesz cele i jak wyrażasz gniew. Energia seksualna i motywacja do działania.' },
  { symbol: '♃', name: 'Jowisz', color: '#F97316', meaning: 'Ekspansja, hojność i mądrość. Planeta szczęścia, wzrostu i filozofii. Gdzie stoi Jowisz, tam szukasz sensu i gdzie masz największe błogosławieństwo.' },
  { symbol: '♄', name: 'Saturn', color: '#FBBF24', meaning: 'Struktura, dyscyplina i karma. Planeta lekcji, ograniczeń i dojrzewania. Gdzie stoi Saturn — tam masz pracę do wykonania, ale też największą nagrodę za wytrwałość.' },
  { symbol: '♅', name: 'Uran', color: '#38BDF8', meaning: 'Rewolucja, oryginalność i przebudzenie. Planeta nagłych zmian, geniuszu i buntu. Wskazuje gdzie łamiesz konwencje i gdzie świat się radykalnie zmienia.' },
  { symbol: '♆', name: 'Neptun', color: '#818CF8', meaning: 'Mistycyzm, iluzja i transcendencja. Planeta snów, sztuki i duchowości. Gdzie stoi Neptun, tam granice się rozmywają — duchowe uniesienie lub dezorientacja.' },
  { symbol: '♇', name: 'Pluton', color: '#8B5CF6', meaning: 'Transformacja, śmierć i odrodzenie. Planeta władzy, cienia i głębokiej zmiany. Gdzie stoi Pluton, tam nic nie zostaje takie samo — wszystko musi umrzeć i narodzić się na nowo.' },
];

// ── MAIN SCREEN ─────────────────────────────────────────────────
export default function AstroTransitsScreen({ navigation }: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const favoriteItems = useAppStore(s => s.favoriteItems);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';
  const accent = ACCENT;

  // Favorites
  const isFav = favoriteItems?.some((f: any) => f.id === 'astrotransits');
  const toggleFav = () => {
    HapticsService.notify();
    if (isFav) {
      removeFavoriteItem('astrotransits');
    } else {
      addFavoriteItem({
        id: 'astrotransits',
        label: 'Tranzyt Astrowy',
        sublabel: 'Ruchy planet',
        route: 'AstroTransits',
        icon: 'Globe',
        color: accent,
        addedAt: new Date().toISOString(),
      });
    }
  };

  // Zodiac sign from birth date
  const userSign = useMemo(() => getZodiacSign(userData?.birthDate || ''), [userData?.birthDate]);
  const personalHitIds = useMemo(() => PERSONAL_HITS[userSign] || [], [userSign]);

  // Planetary hours
  const planetaryHours = useMemo(() => getPlanetaryHours(), []);
  const currentHourData = planetaryHours.find(h => h.isCurrent);
  const nextThreeHours = useMemo(() => {
    const now = new Date().getHours();
    return planetaryHours.filter(h => h.startHour > now && h.startHour <= now + 3);
  }, [planetaryHours]);

  // Active tab
  const [activeTab, setActiveTab] = useState<'niebo' | 'planety' | 'tranzyty' | 'cykle' | 'odkryj'>('niebo');

  // Weekly event tooltip
  const [activeDayTooltip, setActiveDayTooltip] = useState<string | null>(null);

  // Retrograde expanded
  const [expandedRetro, setExpandedRetro] = useState<string | null>(null);

  // Aspect patterns expanded
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  // Planetary meanings guide
  const [meaningsOpen, setMeaningsOpen] = useState(false);
  const [expandedMeaning, setExpandedMeaning] = useState<string | null>(null);

  // Current sky snapshot
  const currentPlanetPositions = useMemo(() => getCurrentPlanetPositions(), []);

  // Oracle AI
  const [oracleInput, setOracleInput] = useState('');
  const [oracleReply, setOracleReply] = useState('');
  const [oracleLoading, setOracleLoading] = useState(false);

  const buildTransitContext = useCallback(() => {
    const active = TODAY_TRANSITS.slice(0, 4).map(t =>
      `${t.planet} ${t.aspectSymbol} ${t.targetPlanet} (${t.aspect}, orb ${t.orb})`
    ).join(', ');
    const retros = RETROGRADE_DATA.map(r => `${r.planet} Retrograd (${r.period})`).join(', ');
    return `Aktywne tranzyty dziś: ${active}. Retrogrady: ${retros}. Znak Słońca użytkownika: ${userSign || 'nieznany'}.`;
  }, [userSign]);

  const askOracle = useCallback(async (question?: string) => {
    const q = question || oracleInput.trim();
    if (!q) return;
    HapticsService.notify();
    setOracleLoading(true);
    setOracleReply('');
    try {
      const systemPrompt = `Jesteś Astrologiem Wyrocznią — głęboko wykształconym interpretatorem tranzytów planetarnych. Odpowiadasz w języku użytkownika z poetycką precyzją. Znasz hellenistyczną astrologię, astrologię karmaiczną i współczesną psychologię astrologiczną. Imię użytkownika: ${userData?.name || 'Poszukująca'}. ${buildTransitContext()} Odpowiedź powinna być konkretna, inspirująca i osadzona w obecnych tranzytach. 4-6 zdań.`;
      const result = await AiService.chatWithOracle([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: q },
      ]);
      setOracleReply(result || 'Wyrocznia obserwuje niebo. Zapytaj ponownie.');
    } catch {
      setOracleReply('Połączenie z Astrologiem zostało przerwane. Spróbuj ponownie.');
    } finally {
      setOracleLoading(false);
    }
  }, [oracleInput, userData, buildTransitContext]);

  // ── RENDER ────────────────────────────────────────────────────
  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <TransitBg isLight={isLight} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.headerBtn} hitSlop={8}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Typography variant="microLabel" style={{ color: accent, letterSpacing: 2 }}>{t('astroTransits.astrologia_tranzytow', 'ASTROLOGIA TRANZYTÓW')}</Typography>
          <Typography variant="title3" style={{ color: textColor, fontWeight: '700' }}>{t('astroTransits.tranzyty_planet', 'Tranzyty Planet')}</Typography>
        </View>
        <Pressable onPress={toggleFav} style={styles.headerBtn} hitSlop={8}>
          <Star size={20} color={isFav ? accent : subColor} fill={isFav ? accent : 'none'} />
        </Pressable>
      </View>

      {/* ── TAB BAR ───────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBarScroll, { borderBottomColor: cardBorder }]}
        contentContainerStyle={styles.tabBarContent}
      >
        {([
          { key: 'niebo', label: '🌌 Niebo' },
          { key: 'planety', label: '🪐 Planety' },
          { key: 'tranzyty', label: '⚡ Tranzyty' },
          { key: 'cykle', label: '♄ Cykle' },
          { key: 'odkryj', label: '✦ Odkryj' },
        ] as const).map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => { HapticsService.notify(); setActiveTab(tab.key); }}
            style={[
              styles.tabBarItem,
              activeTab === tab.key && { borderBottomColor: accent, borderBottomWidth: 2 },
            ]}
            hitSlop={4}
          >
            <Text style={[styles.tabBarLabel, { color: activeTab === tab.key ? accent : subColor }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingTop: 8 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── 3D WIDGET (always visible) ─────────────────────── */}
          <SolarSystemWidget accent={accent} />

          {/* ═══ TAB: PLANETY ══════════════════════════════════ */}
          {activeTab === 'planety' && (<>

          {/* ── TODAY'S TRANSITS ───────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Zap size={16} color={accent} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                {t('astroTransits.aktywne_tranzyty_dzisiaj', 'AKTYWNE TRANZYTY DZISIAJ')}
              </Typography>
            </View>
            {TODAY_TRANSITS.map((transit, idx) => (
              <Animated.View
                key={transit.id}
                entering={FadeInDown.delay(80 + idx * 50).springify()}
                style={[styles.transitCard, {
                  backgroundColor: cardBg,
                  borderColor: transit.isPositive ? transit.planetColor + '33' : '#EF4444' + '33',
                }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  {/* Planet badge */}
                  <View style={[styles.planetBadge, { backgroundColor: transit.planetColor + '22', borderColor: transit.planetColor + '55' }]}>
                    <Text style={{ fontSize: 16, textAlign: 'center', lineHeight: 22 }}>{transit.planetEmoji}</Text>
                    <Typography variant="microLabel" style={{ color: transit.planetColor, fontSize: 9, textAlign: 'center', marginTop: 2 }}>
                      {transit.planet}
                    </Typography>
                  </View>
                  {/* Aspect symbol */}
                  <View style={[styles.aspectSymbol, { backgroundColor: transit.isPositive ? '#34D39922' : '#EF444422' }]}>
                    <Text style={{ fontSize: 18, color: transit.isPositive ? '#34D399' : '#EF4444', lineHeight: 24 }}>
                      {transit.aspectSymbol}
                    </Text>
                  </View>
                  {/* Target planet badge */}
                  <View style={[styles.planetBadge, { backgroundColor: transit.targetColor + '22', borderColor: transit.targetColor + '55' }]}>
                    <Text style={{ fontSize: 14, textAlign: 'center', lineHeight: 22 }}>🪐</Text>
                    <Typography variant="microLabel" style={{ color: transit.targetColor, fontSize: 9, textAlign: 'center', marginTop: 2 }}>
                      {transit.targetPlanet}
                    </Typography>
                  </View>
                  {/* Info */}
                  <View style={{ flex: 1, marginLeft: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={[styles.aspectLabel, { backgroundColor: transit.isPositive ? '#34D39918' : '#EF444418' }]}>
                        <Typography variant="microLabel" style={{ color: transit.isPositive ? '#34D399' : '#EF4444', fontSize: 10 }}>
                          {transit.aspect}
                        </Typography>
                      </View>
                      <Typography variant="microLabel" style={{ color: subColor, fontSize: 10 }}>
                        orb {transit.orb}
                      </Typography>
                    </View>
                    <Typography variant="body2" style={{ color: textColor, lineHeight: 18, marginBottom: 4 }}>
                      {transit.influence}
                    </Typography>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} color={subColor} />
                      <Typography variant="microLabel" style={{ color: subColor, fontSize: 10 }}>
                        {transit.duration}
                      </Typography>
                    </View>
                  </View>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* ── PLANETARY HOURS ────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 10 }}>
              <Clock size={16} color={accent} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                {t('astroTransits.godziny_planetarne', 'GODZINY PLANETARNE')}
              </Typography>
            </View>
            {currentHourData && (
              <LinearGradient
                colors={isLight
                  ? [currentHourData.color + '18', currentHourData.color + '10']
                  : [currentHourData.color + '28', currentHourData.color + '12']}
                style={[styles.currentHourCard, { borderColor: currentHourData.color + '55' }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 24 }}>{currentHourData.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Typography variant="microLabel" style={{ color: currentHourData.color, letterSpacing: 2 }}>
                      {t('astroTransits.aktualna_godzina_planetarna', 'AKTUALNA GODZINA PLANETARNA')}
                    </Typography>
                    <Typography variant="title3" style={{ color: textColor, fontWeight: '700' }}>
                      Godzina {currentHourData.planet}
                    </Typography>
                    <Typography variant="body2" style={{ color: subColor, marginTop: 2 }}>
                      {currentHourData.influence}
                    </Typography>
                  </View>
                </View>
              </LinearGradient>
            )}
            {/* Next 3 hours */}
            {nextThreeHours.length > 0 && (
              <View style={{ marginTop: 8, gap: 6 }}>
                <Typography variant="microLabel" style={{ color: subColor, letterSpacing: 1.5, marginBottom: 4 }}>
                  {t('astroTransits.nastepne_godziny', 'NASTĘPNE GODZINY')}
                </Typography>
                {nextThreeHours.map((h, idx) => (
                  <View
                    key={idx}
                    style={[styles.hourRow, { backgroundColor: cardBg, borderColor: cardBorder }]}
                  >
                    <View style={[styles.hourBadge, { backgroundColor: h.color + '22' }]}>
                      <Text style={{ fontSize: 14 }}>{h.emoji}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Typography variant="label" style={{ color: textColor }}>
                        {String(h.startHour).padStart(2, '0')}:00 — Godzina {h.planet}
                      </Typography>
                      <Typography variant="body2" style={{ color: subColor, fontSize: 12 }}>
                        {h.influence}
                      </Typography>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          </>)}
          {/* ═══ TAB: TRANZYTY ════════════════════════════════ */}
          {activeTab === 'tranzyty' && (<>

          {/* ── PERSONAL TRANSIT HITS ──────────────────────────── */}
          {userSign ? (
            <Animated.View entering={FadeInDown.delay(240).springify()}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 10 }}>
                <Eye size={16} color={accent} />
                <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                  TRANZYTY OSOBISTE — {userSign.toUpperCase()}
                </Typography>
              </View>
              <Typography variant="body2" style={{ color: subColor, marginBottom: 10, lineHeight: 18 }}>
                Tranzyty, które w tej chwili dotykają twojego znaku {userSign} i twojej naturalnej energii:
              </Typography>
              {TODAY_TRANSITS.filter(t => personalHitIds.includes(t.id)).map((transit, idx) => (
                <View
                  key={transit.id}
                  style={[styles.personalHitCard, { backgroundColor: accent + '10', borderColor: accent + '33' }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Text style={{ fontSize: 18 }}>{transit.planetEmoji}</Text>
                    <Typography variant="label" style={{ color: accent, fontWeight: '700' }}>
                      {transit.planet} {transit.aspectSymbol} {transit.targetPlanet}
                    </Typography>
                    <View style={[styles.orbTag, { backgroundColor: accent + '22' }]}>
                      <Typography variant="microLabel" style={{ color: accent, fontSize: 10 }}>
                        {transit.orb}
                      </Typography>
                    </View>
                  </View>
                  <Typography variant="body2" style={{ color: subColor, lineHeight: 18 }}>
                    {transit.influence}
                  </Typography>
                </View>
              ))}
              {personalHitIds.length === 0 && (
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Typography variant="body2" style={{ color: subColor, lineHeight: 18 }}>
                    {t('astroTransits.zaden_z_dzisiejszy_tranzytow_nie', 'Żaden z dzisiejszych tranzytów nie dotyka bezpośrednio twojego znaku. To dzień obserwacji i zbierania energii.')}
                  </Typography>
                </View>
              )}
            </Animated.View>
          ) : null}

          {/* ── WEEKLY TRANSIT CALENDAR ────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(280).springify()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 10 }}>
              <TrendingUp size={16} color={accent} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                {t('astroTransits.kalendarz_tranzytow_tydzien', 'KALENDARZ TRANZYTÓW — TYDZIEŃ')}
              </Typography>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -layout.padding.screen }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: layout.padding.screen, paddingBottom: 4 }}>
                {WEEKLY_EVENTS.map((day) => (
                  <Pressable
                    key={day.day}
                    onPress={() => {
                      HapticsService.notify();
                      setActiveDayTooltip(prev => prev === day.day ? null : day.day);
                    }}
                    style={[
                      styles.weekDay,
                      {
                        backgroundColor: activeDayTooltip === day.day ? accent + '22' : cardBg,
                        borderColor: activeDayTooltip === day.day ? accent + '66' : cardBorder,
                        width: (SW - layout.padding.screen * 2 - 6 * 8) / 7,
                        minWidth: 46,
                      },
                    ]}
                  >
                    <Typography variant="microLabel" style={{ color: activeDayTooltip === day.day ? accent : subColor, fontWeight: '700', fontSize: 11 }}>
                      {day.day}
                    </Typography>
                    <Typography variant="microLabel" style={{ color: subColor, fontSize: 9, marginBottom: 4 }}>
                      {day.date}
                    </Typography>
                    <View style={{ gap: 3 }}>
                      {day.events.slice(0, 2).map((ev, i) => (
                        <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ev.color, alignSelf: 'center' }} />
                      ))}
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            {/* Tooltip */}
            {activeDayTooltip && (() => {
              const dayData = WEEKLY_EVENTS.find(d => d.day === activeDayTooltip);
              if (!dayData) return null;
              return (
                <Animated.View
                  entering={FadeInDown.duration(250)}
                  style={[styles.tooltipCard, { backgroundColor: cardBg, borderColor: accent + '44' }]}
                >
                  <Typography variant="microLabel" style={{ color: accent, letterSpacing: 1.5, marginBottom: 8 }}>
                    {dayData.day.toUpperCase()} {dayData.date}
                  </Typography>
                  {dayData.events.map((ev, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ev.color }} />
                      <Typography variant="body2" style={{ color: textColor, fontSize: 13 }}>{ev.label}</Typography>
                    </View>
                  ))}
                </Animated.View>
              );
            })()}
          </Animated.View>

          </>)}
          {/* ═══ TAB: CYKLE ═══════════════════════════════════ */}
          {activeTab === 'cykle' && (<>

          {/* ── RETROGRADE TRACKER ─────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(320).springify()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 10 }}>
              <AlertCircle size={16} color={accent} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                {t('astroTransits.retrogrady_aktywne', 'RETROGRADY AKTYWNE')}
              </Typography>
            </View>
            {RETROGRADE_DATA.map((retro) => (
              <Pressable
                key={retro.planet}
                onPress={() => {
                  HapticsService.notify();
                  setExpandedRetro(prev => prev === retro.planet ? null : retro.planet);
                }}
                style={[styles.retroCard, { backgroundColor: cardBg, borderColor: retro.color + '44' }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.retroBadge, { backgroundColor: retro.color + '22', borderColor: retro.color + '55' }]}>
                    <Text style={{ fontSize: 20, lineHeight: 26 }}>{retro.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                      {retro.planet} ℞ Retrograd
                    </Typography>
                    <Typography variant="microLabel" style={{ color: retro.color, marginTop: 2 }}>
                      {retro.period}
                    </Typography>
                  </View>
                  {expandedRetro === retro.planet
                    ? <ChevronUp size={16} color={subColor} />
                    : <ChevronDown size={16} color={subColor} />
                  }
                </View>
                {expandedRetro === retro.planet && (
                  <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 12, gap: 10 }}>
                    <View style={[styles.retroSection, { backgroundColor: retro.color + '10', borderColor: retro.color + '22' }]}>
                      <Typography variant="microLabel" style={{ color: retro.color, letterSpacing: 1.5, marginBottom: 4 }}>
                        {t('astroTransits.co_to_oznacza', 'CO TO OZNACZA')}
                      </Typography>
                      <Typography variant="body2" style={{ color: textColor, lineHeight: 19 }}>
                        {retro.meaning}
                      </Typography>
                    </View>
                    <View style={[styles.retroSection, { backgroundColor: '#34D39912', borderColor: '#34D39933' }]}>
                      <Typography variant="microLabel" style={{ color: '#34D399', letterSpacing: 1.5, marginBottom: 4 }}>
                        {t('astroTransits.jak_to_wykorzysta', 'JAK TO WYKORZYSTAĆ')}
                      </Typography>
                      <Typography variant="body2" style={{ color: textColor, lineHeight: 19 }}>
                        {retro.howToUse}
                      </Typography>
                    </View>
                  </Animated.View>
                )}
              </Pressable>
            ))}
          </Animated.View>

          {/* ── ASPECT PATTERNS ────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(360).springify()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 10 }}>
              <Sparkles size={16} color={accent} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                {t('astroTransits.wzorce_aspektowe', 'WZORCE ASPEKTOWE')}
              </Typography>
            </View>
            {ASPECT_PATTERNS.map((pattern) => (
              <Pressable
                key={pattern.id}
                onPress={() => {
                  HapticsService.notify();
                  setExpandedPattern(prev => prev === pattern.id ? null : pattern.id);
                }}
                style={[
                  styles.patternCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: pattern.isActive ? pattern.color + '55' : cardBorder,
                    opacity: pattern.isActive ? 1 : 0.65,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.patternBadge, { backgroundColor: pattern.color + '22', borderColor: pattern.color + '44' }]}>
                    <Text style={{ fontSize: 14, color: pattern.color }}>{pattern.symbol}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                        {pattern.name}
                      </Typography>
                      {pattern.isActive && (
                        <View style={[styles.activeBadge, { backgroundColor: '#34D39922' }]}>
                          <Typography variant="microLabel" style={{ color: '#34D399', fontSize: 9 }}>{t('astroTransits.aktywny', 'AKTYWNY')}</Typography>
                        </View>
                      )}
                    </View>
                    <Typography variant="body2" style={{ color: subColor, fontSize: 12, marginTop: 2 }}>
                      {pattern.elements}
                    </Typography>
                  </View>
                  {expandedPattern === pattern.id
                    ? <ChevronUp size={16} color={subColor} />
                    : <ChevronDown size={16} color={subColor} />
                  }
                </View>
                {expandedPattern === pattern.id && (
                  <Animated.View
                    entering={FadeInDown.duration(300)}
                    style={[styles.patternExpanded, { backgroundColor: pattern.color + '10', borderColor: pattern.color + '22' }]}
                  >
                    <Typography variant="body2" style={{ color: textColor, lineHeight: 20 }}>
                      {pattern.meaning}
                    </Typography>
                  </Animated.View>
                )}
              </Pressable>
            ))}
          </Animated.View>

          </>)}
          {/* ═══ TAB: ODKRYJ ══════════════════════════════════ */}
          {activeTab === 'odkryj' && (<>

          {/* ── ORACLE AI ──────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 10 }}>
              <BookOpen size={16} color={accent} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                {t('astroTransits.astrologic_wyrocznia', 'ASTROLOGICZNA WYROCZNIA')}
              </Typography>
            </View>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {/* Quick prompts */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {ORACLE_PROMPTS.map((p, i) => (
                  <Pressable
                    key={i}
                    onPress={() => askOracle(p)}
                    style={[styles.oracleChip, { backgroundColor: accent + '18', borderColor: accent + '44' }]}
                  >
                    <Typography variant="microLabel" style={{ color: accent, fontSize: 11 }}>
                      {p}
                    </Typography>
                  </Pressable>
                ))}
              </View>
              {/* Current transits summary chip */}
              <View style={[styles.contextChip, { backgroundColor: accent + '12', borderColor: accent + '33' }]}>
                <Info size={12} color={accent} />
                <Typography variant="microLabel" style={{ color: accent, marginLeft: 6, fontSize: 10, flex: 1 }}>
                  Wyrocznia ma dostęp do {TODAY_TRANSITS.length} aktywnych tranzytów, retrogradujących planet i twoich danych.
                </Typography>
              </View>
              {/* Free text */}
              <TextInput
                value={oracleInput}
                onChangeText={setOracleInput}
                placeholder={t('astroTransits.zadaj_pytanie_o_aktualne_tranzyty', 'Zadaj pytanie o aktualne tranzyty...')}
                placeholderTextColor={subColor + '88'}
                style={[styles.oracleInput, {
                  color: textColor,
                  backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)',
                  borderColor: cardBorder,
                  marginTop: 10,
                }]}
                multiline
              />
              <Pressable
                onPress={() => askOracle()}
                disabled={oracleLoading || !oracleInput.trim()}
                style={[styles.ctaBtn, { backgroundColor: oracleLoading ? subColor : accent, marginTop: 8 }]}
              >
                <Send size={15} color="#fff" />
                <Typography variant="label" style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>
                  {oracleLoading ? 'Astrolog odpowiada...' : 'Zapytaj Astrologa'}
                </Typography>
              </Pressable>
              {oracleReply ? (
                <Animated.View
                  entering={FadeInDown.duration(500)}
                  style={[styles.oracleReply, {
                    backgroundColor: isLight ? accent + '10' : accent + '18',
                    borderColor: accent + '44',
                    marginTop: 12,
                  }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Sparkles size={13} color={accent} />
                    <Typography variant="microLabel" style={{ color: accent, letterSpacing: 1.5 }}>
                      {t('astroTransits.interpreta_astrologic', 'INTERPRETACJA ASTROLOGICZNA')}
                    </Typography>
                  </View>
                  <Typography variant="body2" style={{ color: textColor, lineHeight: 22 }}>
                    {oracleReply}
                  </Typography>
                </Animated.View>
              ) : null}
            </View>
          </Animated.View>

          </>)}
          {/* ═══ TAB: NIEBO ═══════════════════════════════════ */}
          {activeTab === 'niebo' && (<>

          {/* ── CURRENT SKY SNAPSHOT ───────────────────────── */}
          <Animated.View entering={FadeInDown.delay(440).springify()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 10 }}>
              <Globe size={16} color={accent} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                {t('astroTransits.niebo_teraz_planety_w_znakach', 'NIEBO TERAZ — PLANETY W ZNAKACH')}
              </Typography>
            </View>
            <View style={{ gap: 6 }}>
              {currentPlanetPositions.map((p, i) => (
                <Animated.View
                  key={p.name}
                  entering={FadeInDown.delay(440 + i * 30).springify()}
                  style={[styles.planetSignRow, { backgroundColor: cardBg, borderColor: p.color + '33' }]}
                >
                  <View style={[styles.planetSignBadge, { backgroundColor: p.color + '22', borderColor: p.color + '55' }]}>
                    <Text style={{ fontSize: 16, color: p.color, textAlign: 'center', lineHeight: 22 }}>{p.symbol}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Typography variant="label" style={{ color: textColor, fontWeight: '600', fontSize: 13 }}>
                        {p.name}
                      </Typography>
                      <View style={[styles.signTag, { backgroundColor: p.color + '22', borderColor: p.color + '44' }]}>
                        <Typography variant="microLabel" style={{ color: p.color, fontSize: 10 }}>
                          {p.sign}
                        </Typography>
                      </View>
                    </View>
                    <Typography variant="body2" style={{ color: subColor, fontSize: 11, marginTop: 1 }}>
                      {p.influence}
                    </Typography>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* ── PLANETARY MEANINGS GUIDE ─────────────────────── */}
          <Animated.View entering={FadeInDown.delay(480).springify()}>
            <Pressable
              onPress={() => {
                HapticsService.notify();
                setMeaningsOpen(prev => !prev);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 10 }}
            >
              <BookOpen size={16} color={accent} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700', flex: 1 }}>
                {t('astroTransits.znaczenia_planet_w_astrologii', 'ZNACZENIA PLANET W ASTROLOGII')}
              </Typography>
              {meaningsOpen
                ? <ChevronUp size={16} color={subColor} />
                : <ChevronDown size={16} color={subColor} />
              }
            </Pressable>
            {meaningsOpen && (
              <Animated.View entering={FadeInDown.duration(300)} style={{ gap: 6 }}>
                {PLANET_MEANINGS.map((pm, idx) => (
                  <Pressable
                    key={pm.name}
                    onPress={() => {
                      HapticsService.notify();
                      setExpandedMeaning(prev => prev === pm.name ? null : pm.name);
                    }}
                    style={[styles.meaningCard, { backgroundColor: cardBg, borderColor: pm.color + '33' }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={[styles.planetSignBadge, { backgroundColor: pm.color + '22', borderColor: pm.color + '55' }]}>
                        <Text style={{ fontSize: 16, color: pm.color, textAlign: 'center', lineHeight: 22 }}>{pm.symbol}</Text>
                      </View>
                      <Typography variant="label" style={{ color: textColor, fontWeight: '600', flex: 1 }}>
                        {pm.name}
                      </Typography>
                      {expandedMeaning === pm.name
                        ? <ChevronUp size={14} color={subColor} />
                        : <ChevronDown size={14} color={subColor} />
                      }
                    </View>
                    {expandedMeaning === pm.name && (
                      <Animated.View entering={FadeInDown.duration(250)} style={{ marginTop: 8 }}>
                        <Typography variant="body2" style={{ color: subColor, lineHeight: 19 }}>
                          {pm.meaning}
                        </Typography>
                      </Animated.View>
                    )}
                  </Pressable>
                ))}
              </Animated.View>
            )}
          </Animated.View>

          {/* ── CO DALEJ? ─────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(520).springify()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 10 }}>
              <ArrowRight size={16} color={accent} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>
                {t('astroTransits.co_dalej', 'CO DALEJ?')}
              </Typography>
            </View>
            {[
              { label: 'Kalendarz Księżycowy', desc: 'Fazy, intencje nówu i rytuały pełni', route: 'LunarCalendar', color: '#C4B5FD' },
              { label: 'Horoskop osobisty', desc: 'Codzienność twojego znaku', route: 'Horoscope', color: '#7B6FAA' },
              { label: 'Roczna Prognoza', desc: 'Rok osobisty i kwartały astrologiczne', route: 'AnnualForecast', color: '#6366F1' },
            ].map((item, i) => (
              <Pressable
                key={item.route}
                onPress={() => { HapticsService.notify(); navigation.navigate(item.route); }}
                style={[styles.nextCard, { backgroundColor: cardBg, borderColor: item.color + '44' }]}
              >
                <View style={{ flex: 1 }}>
                  <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>{item.label}</Typography>
                  <Typography variant="body2" style={{ color: subColor, fontSize: 12, marginTop: 2 }}>{item.desc}</Typography>
                </View>
                <View style={[styles.nextArrow, { backgroundColor: item.color + '22' }]}>
                  <ArrowRight size={16} color={item.color} />
                </View>
              </Pressable>
            ))}
          </Animated.View>

          </>)}

          <EndOfContentSpacer />
        </ScrollView>
      </KeyboardAvoidingView>
        </SafeAreaView>
</View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 12,
  },
  transitCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  planetBadge: {
    width: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aspectSymbol: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  aspectLabel: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  currentHourCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
  },
  hourBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personalHitCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  orbTag: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  weekDay: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    alignItems: 'center',
    minHeight: 72,
    justifyContent: 'flex-start',
    gap: 2,
  },
  tooltipCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  retroCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  retroBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retroSection: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  patternCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  patternBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  patternExpanded: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 10,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  oracleChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  contextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  oracleInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  oracleReply: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  planetSignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  planetSignBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signTag: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  meaningCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  nextArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Tab bar
  tabBarScroll: {
    flexGrow: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBarContent: {
    paddingHorizontal: layout.padding.screen,
    flexDirection: 'row',
    gap: 0,
  },
  tabBarItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBarLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
