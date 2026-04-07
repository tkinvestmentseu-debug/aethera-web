// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, Path, G, Line, Polygon, Defs,
  RadialGradient as SvgRadialGradient, Stop, Ellipse as SvgEllipse,
} from 'react-native-svg';
import Animated, {
  FadeInDown, FadeIn,
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withTiming, withSequence, withDelay, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Bell, Cloud, Sun, Moon, Wind, Zap, Heart,
  Brain, Sparkles, Eye, ArrowRight, TrendingUp, Globe2,
  Flame, Droplets, Layers,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#60A5FA';

const DAY_LABELS = {
  pl: ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
const DAY_SHORT_LABELS = {
  pl: ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
const MONTH_LABELS = {
  pl: ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
};

// ── WEATHER TYPES ──────────────────────────────────────────────
const WEATHER_TYPES = [
  { id: 'stormy',    label: { pl: 'Burzliwe', en: 'Stormy' },      icon: '⛈', color: '#8B5CF6', desc: { pl: 'Intensywne energie wymagają uważności i gruntowania.', en: 'Intense energies call for grounding and deliberate awareness.' } },
  { id: 'calm',      label: { pl: 'Spokojne', en: 'Calm' },        icon: '🌤', color: '#60A5FA', desc: { pl: 'Harmonijny przepływ sprzyja refleksji i medytacji.', en: 'A harmonious current supports reflection and meditation.' } },
  { id: 'dynamic',   label: { pl: 'Dynamiczne', en: 'Dynamic' },   icon: '⚡', color: '#FBBF24', desc: { pl: 'Przyspieszone wibracje — czas działania i inicjatyw.', en: 'Accelerated vibrations favour action, momentum and initiative.' } },
  { id: 'creative',  label: { pl: 'Twórcze', en: 'Creative' },     icon: '🌈', color: '#34D399', desc: { pl: 'Kosmiczna muza jest aktywna — twórz, wyrażaj, komponuj.', en: 'The cosmic muse is active — create, express and compose.' } },
  { id: 'spiritual', label: { pl: 'Duchowe', en: 'Spiritual' },    icon: '✨', color: '#C4B5FD', desc: { pl: 'Wrota wewnętrzne są szeroko otwarte. Słuchaj ciszy.', en: 'The inner gates are wide open. Listen to silence.' } },
  { id: 'manifest',  label: { pl: 'Manifestacyjne', en: 'Manifesting' }, icon: '🌟', color: '#F59E0B', desc: { pl: 'Kosmiczne okno manifestacji — Twoje intencje mają moc.', en: 'A cosmic manifestation window — your intentions carry extra weight.' } },
];

const PLANET_DATA = [
  { name: { pl: 'Merkury', en: 'Mercury' }, symbol: '☿', domain: { pl: 'komunikacja', en: 'communication' }, color: '#94A3B8', desc: { pl: 'Wpływa na jasność myśli, wymianę słów i podróże.', en: 'Shapes clarity of thought, communication and movement.' } },
  { name: { pl: 'Wenus', en: 'Venus' }, symbol: '♀', domain: { pl: 'relacje', en: 'relationships' }, color: '#F9A8D4', desc: { pl: 'Energizuje miłość, piękno i harmonię w związkach.', en: 'Energises love, beauty and harmony in connection.' } },
  { name: { pl: 'Mars', en: 'Mars' }, symbol: '♂', domain: { pl: 'działanie', en: 'action' }, color: '#F87171', desc: { pl: 'Napędza odwagę, asertywność i inicjatywę.', en: 'Drives courage, assertion and initiative.' } },
  { name: { pl: 'Jowisz', en: 'Jupiter' }, symbol: '♃', domain: { pl: 'ekspansja', en: 'expansion' }, color: '#FCD34D', desc: { pl: 'Rozszerza perspektywę, otwiera drzwi i przynosi szczęście.', en: 'Expands perspective, opens doors and brings fortune.' } },
  { name: { pl: 'Saturn', en: 'Saturn' }, symbol: '♄', domain: { pl: 'ograniczenia', en: 'boundaries' }, color: '#A78BFA', desc: { pl: 'Wskazuje lekcje, granice i miejsca wymagające dyscypliny.', en: 'Points to lessons, boundaries and places that require discipline.' } },
  { name: { pl: 'Księżyc', en: 'Moon' }, symbol: '☽', domain: { pl: 'emocje', en: 'emotions' }, color: '#E2E8F0', desc: { pl: 'Reguluje nastrój, intuicję i rytmy emocjonalne.', en: 'Regulates mood, intuition and emotional tides.' } },
];

const ENERGY_DIMENSIONS = [
  { id: 'mental',    label: { pl: 'Energia mentalna', en: 'Mental energy' }, color: '#60A5FA', Icon: Brain },
  { id: 'emotional', label: { pl: 'Energia emocjonalna', en: 'Emotional energy' }, color: '#F472B6', Icon: Heart },
  { id: 'physical',  label: { pl: 'Energia fizyczna', en: 'Physical energy' }, color: '#34D399', Icon: Zap },
  { id: 'spiritual', label: { pl: 'Energia duchowa', en: 'Spiritual energy' }, color: '#C4B5FD', Icon: Sparkles },
  { id: 'creative',  label: { pl: 'Energia twórcza', en: 'Creative energy' }, color: '#FBBF24', Icon: Star },
  { id: 'relational',label: { pl: 'Energia relacji', en: 'Relational energy' }, color: '#F87171', Icon: Heart },
];

const ZODIAC_SIGNS = [
  'Baran','Byk','Bliźnięta','Rak','Lew','Panna',
  'Waga','Skorpion','Strzelec','Koziorożec','Wodnik','Ryby',
];

// ── DETERMINISTIC DATE HASH ─────────────────────────────────────
function dateHash(year: number, month: number, day: number, salt = 0): number {
  const n = year * 10000 + month * 100 + day + salt;
  let h = ((n ^ (n >>> 16)) * 0x45d9f3b) & 0xffffffff;
  h = ((h ^ (h >>> 16)) * 0x45d9f3b) & 0xffffffff;
  h = (h ^ (h >>> 16)) >>> 0;
  return h;
}

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    return ((s ^ (s >>> 14)) >>> 0) / 0xffffffff;
  };
}

function getMoonPhase(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const ref = 2451550.1;
  const cycle = 29.530588853;
  const p = ((jd - ref) % cycle) / cycle;
  return p < 0 ? p + 1 : p;
}

function getMoonPhaseName(phase: number, language: 'pl' | 'en' = 'pl'): string {
  if (language === 'en') {
    if (phase < 0.03 || phase > 0.97) return 'New Moon';
    if (phase < 0.22) return 'Waxing Crescent';
    if (phase < 0.28) return 'First Quarter';
    if (phase < 0.47) return 'Waxing Gibbous';
    if (phase < 0.53) return 'Full Moon';
    if (phase < 0.72) return 'Waning Gibbous';
    if (phase < 0.78) return 'Last Quarter';
    return 'Waning Crescent';
  }
  if (phase < 0.03 || phase > 0.97) return 'Nów';
  if (phase < 0.22) return 'Przybywający sierp';
  if (phase < 0.28) return 'Pierwsza kwadra';
  if (phase < 0.47) return 'Przybywający gibbous';
  if (phase < 0.53) return 'Pełnia';
  if (phase < 0.72) return 'Ubywający gibbous';
  if (phase < 0.78) return 'Ostatnia kwadra';
  return 'Ubywający sierp';
}

function computeCosmicData(date: Date, language: 'pl' | 'en' = 'pl') {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dow = date.getDay(); // 0=Sun
  const rng = seededRandom(dateHash(year, month, day));

  // Moon
  const moonPhase = getMoonPhase(year, month, day);
  const moonName = getMoonPhaseName(moonPhase, language);

  // Numerology: personal day = sum of digits of day + month + year
  const digits = (n: number) => String(n).split('').reduce((s, d) => s + parseInt(d), 0);
  let num = digits(day) + digits(month) + digits(year);
  while (num > 9 && num !== 11 && num !== 22) num = digits(num);

  // Weather type selection — blend moon phase + day + numerology
  const moonFactor = moonPhase;
  const numFactor = (num - 1) / 8;
  const dowFactor = dow / 6;
  const blend = (moonFactor * 0.4 + numFactor * 0.35 + dowFactor * 0.25 + rng() * 0.1);
  const weatherIdx = Math.min(Math.floor(blend * WEATHER_TYPES.length), WEATHER_TYPES.length - 1);
  const baseWeather = WEATHER_TYPES[weatherIdx];
  const weather = { ...baseWeather, label: baseWeather.label[language], desc: baseWeather.desc[language] };

  // Overall energy rating 1-5
  const rawRating = moonFactor * 0.3 + numFactor * 0.4 + rng() * 0.3;
  const rating = Math.max(1, Math.min(5, Math.round(rawRating * 4 + 1)));

  // Energy dimensions 1-10
  const energies: Record<string, number> = {};
  ENERGY_DIMENSIONS.forEach((d, i) => {
    const v = Math.round((rng() * 0.5 + moonFactor * 0.25 + numFactor * 0.25) * 9 + 1);
    energies[d.id] = Math.max(1, Math.min(10, v));
  });

  // Active planets — pick 3 most active today
  const planetScores = PLANET_DATA.map((p, i) => ({
    ...p,
    name: p.name[language],
    domain: p.domain[language],
    desc: p.desc[language],
    score: rng(),
  }));
  planetScores.sort((a, b) => b.score - a.score);
  const activePlanets = planetScores.slice(0, 3);

  // 7-day forecast
  const weekForecast = Array.from({ length: 7 }, (_, offset) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset - dow); // start of week
    const dr = seededRandom(dateHash(d.getFullYear(), d.getMonth() + 1, d.getDate(), 77));
    const mp = getMoonPhase(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const wr = Math.min(Math.floor((dr() * 0.7 + mp * 0.3) * WEATHER_TYPES.length), WEATHER_TYPES.length - 1);
    const rat = Math.max(1, Math.min(5, Math.round(dr() * 4 + 1)));
    const forecastWeather = WEATHER_TYPES[wr];
    return {
      dayName: DAY_SHORT_LABELS[language][d.getDay()],
      date: d.getDate(),
      weather: { ...forecastWeather, label: forecastWeather.label[language], desc: forecastWeather.desc[language] },
      rating: rat,
      isToday: d.toDateString() === date.toDateString(),
      moon: getMoonPhaseName(mp, language),
    };
  });

  // 30-day calendar
  const cal30: { day: number; rating: number; color: string }[] = [];
  const firstOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dr = seededRandom(dateHash(year, month, d, 13));
    const mp = getMoonPhase(year, month, d);
    const rat = Math.max(1, Math.min(5, Math.round((dr() * 0.5 + mp * 0.5) * 4 + 1)));
    const colors = ['#F87171', '#FBBF24', '#60A5FA', '#34D399', '#C4B5FD'];
    cal30.push({ day: d, rating: rat, color: colors[rat - 1] });
  }

  // Best activities
  const allActivities = language === 'en'
    ? [
        'Morning meditation by candlelight', 'A mindful walk in nature',
        'Writing down three gratitudes', 'A cleansing herbal bath ritual',
        'A solitary tarot reading', '4-7-8 breathwork',
        'Recording dreams after waking', 'Mirror affirmation practice',
        'Creating a mandala or drawing', 'A heart-open conversation with someone close',
        'Stretching with calm music', 'Contemplation under the stars',
        'Writing a letter from your future self', 'Grounding barefoot on the earth',
        'Working with dream symbols',
      ]
    : [
        'Medytacja poranna przy świetle świecy', 'Spacer wśród natury z intencją uważności',
        'Zapisanie trzech wdzięczności', 'Rytuał kąpieli z ziołami oczyszczającymi',
        'Czytanie kart tarota w samotności', 'Ćwiczenia oddechowe 4-7-8',
        'Zapis snów po przebudzeniu', 'Praktyka afirmacji przy lustrze',
        'Tworzenie mandalii lub rysowanie', 'Rozmowa z bliską osobą z otwartym sercem',
        'Stretching przy spokojnej muzyce', 'Kontemplacja pod gwiazdami',
        'Pisanie listu do siebie z przyszłości', 'Grounding bosymi stopami na ziemi',
        'Praca ze snami i symbolami',
      ];
  const actRng = seededRandom(dateHash(year, month, day, 42));
  const shuffled = [...allActivities].sort(() => actRng() - 0.5);
  const bestActivities = shuffled.slice(0, 5);

  // What to avoid
  const avoidAll = language === 'en'
    ? [
        'Rushed financial decisions', 'Conflicts born from miscommunication',
        'Overloading your mind with new information', 'Overworking without pause',
        'Toxic conversations and energetic drains', 'Impulse purchases',
        'Comparing yourself with others on social media',
        'Delaying important matters for no real reason',
      ]
    : [
        'Pochopnych decyzji finansowych', 'Konfliktów wynikających z nieporozumień',
        'Przeciążania umysłu nowymi informacjami', 'Nadmiernej pracy bez przerw',
        'Toksycznych rozmów i drenaży energetycznych', 'Impulsywnych zakupów',
        'Porównywania się z innymi w mediach społecznościowych',
        'Odkładania ważnych spraw bez powodu',
      ];
  const avRng = seededRandom(dateHash(year, month, day, 99));
  const avoidShuffled = [...avoidAll].sort(() => avRng() - 0.5);
  const avoidItems = avoidShuffled.slice(0, 3);

  // Main message
  const weatherDesc = typeof weather.desc === 'string' ? weather.desc : weather.desc[language];
  const messages = language === 'en'
    ? [
        `Today the cosmic field favours introspection. Personal number ${num} points toward reflection on what truly matters.`,
        `The Moon in ${moonName} strengthens your inner compass. Trust intuition a little more than logic.`,
        `The energy of day ${num} carries transformative potential. ${weatherDesc}`,
        'The planets are arranged in a way that favours deep inner work. Use this cosmic opening well.',
        `Today’s cosmic rhythm is aligned with your personal cycle ${num}. ${weatherDesc}`,
        'The vibrations of sky and earth are woven together with unusual harmony today. Let that current guide you.',
      ]
    : [
        `Dziś kosmiczne energie sprzyjają introspekcji. Liczba osobista ${num} wskazuje na czas refleksji nad tym, co naprawdę ważne.`,
        `Księżyc w fazie ${moonName} wzmacnia Twoje wewnętrzne kompasy. Zaufaj intuicji bardziej niż logice.`,
        `Energia dnia ${num} niesie potencjał transformacji. ${weatherDesc}`,
        'Planety ułożyły się w konfigurację sprzyjającą głębokiej pracy z sobą. Skorzystaj z tej kosmicznej okazji.',
        `Kosmiczny rytm dnia jest zsynchronizowany z Twoim osobistym cyklem ${num}. ${weatherDesc}`,
        'Wibracje nieba i ziemi splecione są dziś szczególnie harmonijnie. Pozwól temu przepływowi prowadzić Cię.',
      ];
  const msgIdx = dateHash(year, month, day, 7) % messages.length;

  return {
    weather, rating, energies, activePlanets, weekForecast, cal30,
    bestActivities, avoidItems, moonPhase, moonName, personalNumber: num,
    mainMessage: messages[msgIdx],
  };
}

// ── ANIMATED SVG HERO ─────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CosmicHeroScene = ({ isLight, accent, weather }: { isLight: boolean; accent: string; weather: typeof WEATHER_TYPES[0] }) => {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const starAnim = useSharedValue(0);
  const cloudAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    starAnim.value = withRepeat(withTiming(1, { duration: 8000, easing: Easing.linear }), -1, false);
    cloudAnim.value = withRepeat(withTiming(1, { duration: 12000, easing: Easing.linear }), -1, false);
    pulseAnim.value = withRepeat(
      withSequence(withTiming(1.12, { duration: 2200 }), withTiming(1, { duration: 2200 })),
      -1, true,
    );
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-18, Math.min(18, e.translationY / 14));
      tiltY.value = Math.max(-18, Math.min(18, e.translationX / 14));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 600 });
      tiltY.value = withTiming(0, { duration: 600 });
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));

  const cloudStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cloudAnim.value * 36 - 18 }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    opacity: 0.4 + pulseAnim.value * 0.2,
  }));

  const W = SW - 44;
  const H = 200;
  const cx = W / 2;
  const cy = H / 2;

  // Stars array — deterministic positions
  const stars = useMemo(() => Array.from({ length: 48 }, (_, i) => ({
    x: (i * 137 + 11) % W,
    y: (i * 79 + 7) % H,
    r: i % 5 === 0 ? 2 : i % 3 === 0 ? 1.4 : 0.8,
    op: 0.15 + (i % 6) * 0.1,
  })), [W, H]);

  // Sacred geometry cloud shapes
  const hexPoints = (x: number, y: number, r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60 - 30) * Math.PI / 180;
      return `${x + Math.cos(a) * r},${y + Math.sin(a) * r}`;
    }).join(' ');

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ height: H, borderRadius: 24, overflow: 'hidden', marginBottom: 16 }, containerStyle]}>
        <LinearGradient
          colors={isLight
            ? ['#DBEAFE', '#EFF6FF', '#F0F9FF']
            : ['#0A0E1A', '#0D1428', '#111832']}
          style={StyleSheet.absoluteFill}
        />
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgRadialGradient id="cosmicGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={weather.color} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={weather.color} stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>

          {/* Background glow */}
          <Circle cx={cx} cy={cy} r={80} fill="url(#cosmicGlow)" />

          {/* Stars (dark mode) or sun rays (light mode) */}
          {isLight ? (
            <>
              {Array.from({ length: 12 }, (_, i) => {
                const angle = (i * 30) * Math.PI / 180;
                const r1 = 42, r2 = 68;
                return (
                  <Line key={i}
                    x1={cx + Math.cos(angle) * r1} y1={cy + Math.sin(angle) * r1}
                    x2={cx + Math.cos(angle) * r2} y2={cy + Math.sin(angle) * r2}
                    stroke="#FCD34D" strokeWidth={i % 3 === 0 ? 1.8 : 0.9} opacity={0.5}
                  />
                );
              })}
              <Circle cx={cx} cy={cy} r={28} fill="#FEF3C7" opacity={0.9} />
              <Circle cx={cx} cy={cy} r={20} fill="#FDE68A" opacity={0.85} />
            </>
          ) : (
            stars.map((s, i) => (
              <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.op} />
            ))
          )}

          {/* Orbital rings — sacred geometry */}
          <Circle cx={cx} cy={cy} r={55} fill="none" stroke={weather.color} strokeWidth={0.7} strokeDasharray="4 8" opacity={0.35} />
          <Circle cx={cx} cy={cy} r={78} fill="none" stroke={accent} strokeWidth={0.5} strokeDasharray="2 6" opacity={0.2} />

          {/* Hexagram cloud shapes */}
          <Polygon points={hexPoints(cx - 90, cy - 30, 20)} fill={weather.color} opacity={0.08} />
          <Polygon points={hexPoints(cx + 95, cy - 20, 15)} fill={accent} opacity={0.07} />
          <Polygon points={hexPoints(cx - 60, cy + 55, 12)} fill={weather.color} opacity={0.06} />

          {/* Central cosmic symbol */}
          <Circle cx={cx} cy={cy} r={32} fill={weather.color} opacity={0.15} />
          <Circle cx={cx} cy={cy} r={22} fill="none" stroke={weather.color} strokeWidth={1.5} opacity={0.6} />
          {/* Inner cross of light */}
          <Line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy} stroke={weather.color} strokeWidth={1.2} opacity={0.7} />
          <Line x1={cx} y1={cy - 14} x2={cx} y2={cy + 14} stroke={weather.color} strokeWidth={1.2} opacity={0.7} />
          {/* 8-pointed star */}
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * 45) * Math.PI / 180;
            return (
              <Line key={i}
                x1={cx + Math.cos(a) * 8} y1={cy + Math.sin(a) * 8}
                x2={cx + Math.cos(a) * 20} y2={cy + Math.sin(a) * 20}
                stroke={weather.color} strokeWidth={0.8} opacity={0.5}
              />
            );
          })}
        </Svg>

        {/* Floating cloud geometry (animated) */}
        <Animated.View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }, cloudStyle]}>
          <Svg width={W} height={H}>
            <Circle cx={30} cy={30} r={18} fill={weather.color} opacity={0.06} />
            <Circle cx={W - 25} cy={H - 35} r={14} fill={accent} opacity={0.05} />
            <Polygon
              points={hexPoints(W * 0.8, H * 0.25, 22)}
              fill="none" stroke={weather.color} strokeWidth={0.8} opacity={0.15}
            />
          </Svg>
        </Animated.View>

        {/* Weather icon overlay */}
        <View style={{ position: 'absolute', top: 16, right: 16 }}>
          <Text style={{ fontSize: 36 }}>{weather.icon}</Text>
        </View>
        <View style={{ position: 'absolute', bottom: 16, left: 20 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2.5, color: isLight ? '#1E40AF' : accent, opacity: 0.8 }}>
            {i18n.language?.startsWith('en') ? 'COSMIC WEATHER' : 'KOSMICZNA POGODA'}
          </Text>
          <Text style={{ fontSize: 22, fontWeight: '300', letterSpacing: -0.5, color: isLight ? '#1E3A5F' : '#E0EEFF', marginTop: 2 }}>
            {weather.label}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

// ── STAR RATING ────────────────────────────────────────────────
const StarRating = ({ rating, color }: { rating: number; color: string }) => (
  <View style={{ flexDirection: 'row', gap: 4 }}>
    {Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={16} color={color} fill={i < rating ? color : 'transparent'} />
    ))}
  </View>
);

// ── ENERGY GAUGE ───────────────────────────────────────────────
const EnergyGauge = ({ label, value, color, Icon, delay, isLight }: {
  label: string; value: number; color: string; Icon: any; delay: number; isLight: boolean;
}) => {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withDelay(delay, withTiming(value / 10, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [value]);
  const barStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={[gauge.card, { backgroundColor: cardBg, borderColor: color + '22' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <View style={[gauge.iconWrap, { backgroundColor: color + '18', borderColor: color + '33' }]}>
          <Icon size={14} color={color} />
        </View>
        <Text style={[gauge.label, { color: textColor }]}>{label}</Text>
        <Text style={[gauge.value, { color }]}>{value}</Text>
      </View>
      <View style={[gauge.track, { backgroundColor: color + '18' }]}>
        <Animated.View style={[gauge.fill, { backgroundColor: color }, barStyle]} />
      </View>
    </Animated.View>
  );
};

const gauge = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 13, fontWeight: '500' },
  value: { fontSize: 18, fontWeight: '700' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});

// ── PLANET CARD ────────────────────────────────────────────────
const PlanetCard = ({ planet, rank, delay, isLight }: { planet: any; rank: number; delay: number; isLight: boolean }) => {
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <LinearGradient
        colors={[planet.color + '14', planet.color + '06', 'transparent']}
        style={[pc.card, { borderColor: planet.color + '30' }]}
      >
        <View style={[pc.badge, { backgroundColor: planet.color + '20', borderColor: planet.color + '44' }]}>
          <Text style={[pc.symbol, { color: planet.color }]}>{planet.symbol}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text style={[pc.name, { color: textColor }]}>{planet.name}</Text>
            <View style={[pc.domainTag, { backgroundColor: planet.color + '18' }]}>
              <Text style={[pc.domainText, { color: planet.color }]}>{planet.domain}</Text>
            </View>
            {rank === 0 && (
              <View style={[pc.activeBadge, { backgroundColor: planet.color + '25' }]}>
                <Text style={[pc.activeText, { color: planet.color }]}>{i18n.language?.startsWith('en') ? 'MOST ACTIVE' : 'NAJAKTYWNIEJSZA'}</Text>
              </View>
            )}
          </View>
          <Text style={[pc.desc, { color: subColor }]}>{planet.desc}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const pc = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  badge: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  symbol: { fontSize: 22, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '600' },
  domainTag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6 },
  domainText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  activeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  activeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  desc: { fontSize: 12, lineHeight: 18 },
});

// ── WEEK FORECAST CARD ─────────────────────────────────────────
const WeekCard = ({ day, accent, isLight }: { day: any; accent: string; isLight: boolean }) => {
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const isToday = day.isToday;
  return (
    <LinearGradient
      colors={isToday
        ? [day.weather.color + '28', day.weather.color + '10']
        : ['rgba(255,255,255,0.04)', 'transparent']}
      style={[wc.card, { borderColor: isToday ? day.weather.color + '50' : 'rgba(255,255,255,0.07)' }]}
    >
      <Text style={[wc.dayName, { color: isToday ? day.weather.color : subColor }]}>{day.dayName}</Text>
      <Text style={[wc.dayNum, { color: textColor }]}>{day.date}</Text>
      <Text style={{ fontSize: 20, marginVertical: 6 }}>{day.weather.icon}</Text>
      <View style={{ flexDirection: 'row', gap: 2, marginBottom: 4 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <View key={i} style={[wc.dot, { backgroundColor: i < day.rating ? day.weather.color : 'rgba(255,255,255,0.12)' }]} />
        ))}
      </View>
      <Text style={[wc.label, { color: isToday ? day.weather.color : subColor }]} numberOfLines={1}>
        {day.weather.label}
      </Text>
    </LinearGradient>
  );
};

const wc = StyleSheet.create({
  card: { width: (SW - 44 - 48) / 7, minWidth: 44, alignItems: 'center', padding: 8, borderRadius: 16, borderWidth: 1 },
  dayName: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  dayNum: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  label: { fontSize: 9, fontWeight: '600', letterSpacing: 0.3, textAlign: 'center' },
});

// ── MONTH CALENDAR CELL ────────────────────────────────────────
const CalCell = ({ cell, today, isLight }: { cell: any; today: number; isLight: boolean }) => {
  const isToday = cell.day === today;
  return (
    <View style={[cal.cell, { backgroundColor: cell.color + (isToday ? '38' : '16'), borderColor: isToday ? cell.color + '70' : 'transparent', borderWidth: isToday ? 1 : 0 }]}>
      <Text style={[cal.dayNum, { color: isToday ? cell.color : (isLight ? '#4A3A28' : '#C0B8B0') }]}>{cell.day}</Text>
      <View style={[cal.pip, { backgroundColor: cell.color }]} />
    </View>
  );
};

const cal = StyleSheet.create({
  cell: { width: (SW - 44 - 36) / 7, aspectRatio: 0.85, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dayNum: { fontSize: 12, fontWeight: '600' },
  pip: { width: 4, height: 4, borderRadius: 2 },
});

// ── SECTION HEADER ─────────────────────────────────────────────
const SectionHeader = ({ label, accent }: { label: string; accent: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 28, marginBottom: 16 }}>
    <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: accent + '30' }} />
    <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2.5, color: accent, opacity: 0.85 }}>{label}</Text>
    <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: accent + '30' }} />
  </View>
);

// ── MAIN SCREEN ────────────────────────────────────────────────
export const CosmicWeatherScreen = ({ navigation }: { navigation: any }) => {
  const { t } = useTranslation();
  const isEnglish = i18n.language?.startsWith('en');
  const language = isEnglish ? 'en' : 'pl';
  const localeCode = isEnglish ? 'en-US' : 'pl-PL';
  const tr = (pl: string, en: string) => (isEnglish ? en : pl);
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

  const today = useMemo(() => new Date(), []);
  const cosmic = useMemo(() => computeCosmicData(today, language), [today, language]);

  const todayDay = today.getDate();
  const todayDOW = today.getDay();
  const monthLabel = MONTH_LABELS[language][today.getMonth()];
  const yearLabel = today.getFullYear();
  const localizedDays = DAY_LABELS[language];
  const localizedDaysShort = DAY_SHORT_LABELS[language];
  const localizedWeatherTypes = useMemo(
    () => WEATHER_TYPES.map((item) => ({ ...item, label: item.label[language], desc: item.desc[language] })),
    [language],
  );
  const localizedEnergyDimensions = useMemo(
    () => ENERGY_DIMENSIONS.map((item) => ({ ...item, label: item.label[language] })),
    [language],
  );
  const localizedPlanets = useMemo(
    () => PLANET_DATA.map((item) => ({ ...item, name: item.name[language], domain: item.domain[language], desc: item.desc[language] })),
    [language],
  );

  // Calendar offset — padding for weekday start
  const firstDOW = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  const isFav = isFavoriteItem('cosmic_weather');
  const handleStar = useCallback(() => {
    HapticsService.notify();
    if (isFavoriteItem('cosmic_weather')) {
      removeFavoriteItem('cosmic_weather');
    } else {
      addFavoriteItem({
        id: 'cosmic_weather',
        label: tr('Kosmiczna Pogoda', 'Cosmic Weather'),
        sublabel: tr('Przepowiednia energetyczna dnia', 'Daily energetic forecast'),
        route: 'CosmicWeather',
        icon: 'Cloud',
        color: accent,
        addedAt: Date.now(),
      });
    }
  }, [addFavoriteItem, removeFavoriteItem, isFavoriteItem]);

  const [cosmicAiInsight, setCosmicAiInsight] = useState<string>("");
  const [cosmicAiLoading, setCosmicAiLoading] = useState(false);

  const fetchCosmicInsight = async () => {
    if (cosmicAiLoading) return;
    setCosmicAiLoading(true);
    HapticsService.notify();
    try {
      const prompt = isEnglish
        ? `Today's cosmic weather: ${cosmic.weather.label}. Moon phase: ${cosmic.moonName}. Personal number: ${cosmic.personalNumber}. Day rating: ${cosmic.rating}/5. Write a short 3-4 sentence personalized reading of today's energy and give one specific practical suggestion.`
        : `Kosmiczna pogoda dnia: ${cosmic.weather.label}. Faza księżyca: ${cosmic.moonName}. Liczba osobista: ${cosmic.personalNumber}. Ocena dnia: ${cosmic.rating}/5. Napisz krótką, 3-4 zdaniową personalizowaną interpretację energii dnia i jedną konkretną sugestię dla użytkownika.`;
      const result = await AiService.chatWithOracle(prompt, language);
      setCosmicAiInsight(result);
    } catch (e) {
      setCosmicAiInsight(tr('Nie udało się pobrać interpretacji. Spróbuj ponownie.', 'Could not load the interpretation. Try again.'));
    } finally {
      setCosmicAiLoading(false);
    }
  };

  // Zodiac for user
  const userZodiac = useMemo(() => {
    try {
      const { getZodiacSign } = require('../features/horoscope/utils/astrology');
      return getZodiacSign(userData?.birthDate);
    } catch {
      return userData?.zodiacSign || 'Baran';
    }
  }, [userData]);

  // Personalized sign advice
  const signAdvice = useMemo(() => {
    const adviceMap: Record<string, string> = isEnglish ? {
      'Aries': 'Today your Martian energy is amplified. Act boldly, but with an instinct for harmony.',
      'Taurus': 'Venus supports your senses. Find beauty in the ordinary and care for your body.',
      'Gemini': 'Mercury activates your mind. Write, speak and express yourself creatively.',
      'Cancer': 'Lunar vibrations resonate with your soul. This is a day for deep inner listening.',
      'Leo': 'Solar energy supports your expression. Let yourself shine and inspire others.',
      'Virgo': 'Your analytical precision is cosmically supported today. Organise and refine.',
      'Libra': 'Venus harmonises your relationships. A beautiful day for meaningful conversations.',
      'Scorpio': 'Pluto deepens your perception. A time for real inner discoveries.',
      'Sagittarius': 'Jovian optimism fuels your vision. Aim high and move without inner limitation.',
      'Capricorn': 'Saturn rewards your endurance. Every small step counts twice today.',
      'Aquarius': 'Uranian waves inspire revolution. Think beyond the expected.',
      'Pisces': 'Neptune immerses you in intuition. Trust what you feel, not only what you can explain.',
    } : {
      'Baran': 'Dziś Twoja Marsowa energia jest wzmocniona. Działaj odważnie, ale z wyczuciem harmonii.',
      'Byk': 'Wenus sprzyja Twoim zmysłom. Znajdź piękno w codzienności i zadbaj o ciało.',
      'Bliźnięta': 'Merkury aktywuje Twój umysł. Pisz, rozmawiaj, ekspresjonuj się twórczo.',
      'Rak': 'Księżycowe wibracje rezonują z Twoją duszą. To dzień do głębokiej introspekcji.',
      'Lew': 'Solarna energia wspiera Twoją ekspresję. Pozwól sobie błyszczeć i inspirować innych.',
      'Panna': 'Twoja analityczna precyzja jest dziś kosmicznie wspierana. Porządkuj i planuj.',
      'Waga': 'Wenus harmonizuje Twoje relacje. Dzień stworzony dla pięknych rozmów.',
      'Skorpion': 'Pluton pogłębia Twoją percepcję. Czas na prawdziwe odkrycia wewnętrzne.',
      'Strzelec': 'Jowiszowy optymizm napędza Twoje marzenia. Celuj wysoko, bez ograniczeń.',
      'Koziorożec': 'Saturn nagradza Twoją wytrwałość. Każdy mały krok liczy się podwójnie.',
      'Wodnik': 'Uranowe fale inspirują Cię do rewolucji. Myśl inaczej niż wszyscy.',
      'Ryby': 'Neptun zanurza Cię w morzu intuicji. Ufaj temu, co czujesz, nie tylko rozumiesz.',
    };
    const fallbackSign = isEnglish ? 'Aries' : 'Baran';
    const sign = Object.keys(adviceMap).find(s => userZodiac?.includes(s)) || fallbackSign;
    return adviceMap[sign] || adviceMap[fallbackSign];
  }, [isEnglish, userZodiac]);

  return (
    <View style={[s.container, { backgroundColor: currentTheme.background }]}>
      {/* Cosmic background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={isLight
            ? [currentTheme.background, '#DBEAFE20', currentTheme.background]
            : ['#060A18', '#091228', '#0A0E1A']}
          style={StyleSheet.absoluteFill}
        />
        <Svg width={SW} height={400} style={StyleSheet.absoluteFill} opacity={0.12}>
          {Array.from({ length: 60 }, (_, i) => (
            <Circle key={i}
              cx={(i * 137 + 23) % SW} cy={(i * 89 + 17) % 400}
              r={i % 5 === 0 ? 1.8 : i % 3 === 0 ? 1.2 : 0.7}
              fill={isLight ? '#1E3A8A' : 'white'}
              opacity={isLight ? 0.15 : 0.22}
            />
          ))}
        </Svg>
      </View>

      <SafeAreaView edges={['top']} style={s.safe}>
        {/* HEADER */}
        <View style={s.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={s.backBtn} hitSlop={12}>
            <ChevronLeft color={accent} size={22} strokeWidth={2} />
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={[s.headerTitle, { color: textColor }]}>{tr('Kosmiczna Pogoda', 'Cosmic Weather')}</Text>
            <Text style={[s.headerSub, { color: subColor }]}>{localizedDays[todayDOW]}, {todayDay} {monthLabel} {yearLabel}</Text>
          </View>
          <Pressable onPress={handleStar} style={s.backBtn} hitSlop={12}>
            <Star color={accent} size={20} strokeWidth={2} fill={isFav ? accent : 'none'} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. ANIMATED HERO */}
          <Animated.View entering={FadeIn.duration(600)}>
            <CosmicHeroScene isLight={isLight} accent={accent} weather={cosmic.weather} />
          </Animated.View>

          {/* 2. TODAY'S COSMIC FORECAST */}
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <LinearGradient
              colors={[cosmic.weather.color + '22', cosmic.weather.color + '0A', 'transparent']}
              style={[s.forecastCard, { borderColor: cosmic.weather.color + '35' }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <View>
                  <Text style={[s.forecastEyebrow, { color: cosmic.weather.color }]}>{tr('PROGNOZA NA DZIŚ', 'FORECAST FOR TODAY')}</Text>
                  <Text style={[s.forecastType, { color: textColor }]}>{cosmic.weather.label}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <StarRating rating={cosmic.rating} color={cosmic.weather.color} />
                  <View style={[s.moonBadge, { backgroundColor: '#C4B5FD18', borderColor: '#C4B5FD30' }]}>
                    <Text style={{ fontSize: 11, color: '#C4B5FD' }}>☽ {cosmic.moonName}</Text>
                  </View>
                </View>
              </View>
              <Text style={[s.forecastMsg, { color: isLight ? '#2A1F0E' : '#DDD8CF' }]}>{cosmic.mainMessage}</Text>
              <View style={[s.forecastDivider, { backgroundColor: cosmic.weather.color + '25' }]} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={s.forecastStat}>
                  <Text style={[s.forecastStatVal, { color: cosmic.weather.color }]}>{cosmic.personalNumber}</Text>
                  <Text style={[s.forecastStatLabel, { color: subColor }]}>{tr('LICZBA OSOBISTA', 'PERSONAL NUMBER')}</Text>
                </View>
                <View style={[s.forecastStatDivider, { backgroundColor: cosmic.weather.color + '25' }]} />
                <View style={s.forecastStat}>
                  <Text style={[s.forecastStatVal, { color: '#C4B5FD' }]}>{cosmic.moonName.split(' ')[0]}</Text>
                  <Text style={[s.forecastStatLabel, { color: subColor }]}>{tr('FAZA KSIĘŻYCA', 'MOON PHASE')}</Text>
                </View>
                <View style={[s.forecastStatDivider, { backgroundColor: cosmic.weather.color + '25' }]} />
                <View style={s.forecastStat}>
                  <Text style={[s.forecastStatVal, { color: ACCENT }]}>{cosmic.rating}/5</Text>
                  <Text style={[s.forecastStatLabel, { color: subColor }]}>{tr('OCENA DNIA', 'DAY RATING')}</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* 3. ENERGY BREAKDOWN */}
          <SectionHeader label={tr('WYMIARY ENERGII', 'ENERGY DIMENSIONS')} accent={accent} />
          {localizedEnergyDimensions.map((dim, i) => (
            <EnergyGauge
              key={dim.id}
              label={dim.label}
              value={cosmic.energies[dim.id]}
              color={dim.color}
              Icon={dim.Icon}
              delay={i * 60}
              isLight={isLight}
            />
          ))}

          {/* 4. PLANETARY INFLUENCES */}
          <SectionHeader label={tr('WPŁYWY PLANETARNE', 'PLANETARY INFLUENCES')} accent={accent} />
          <Animated.View entering={FadeInDown.delay(40).duration(400)}>
            <View style={[s.infoBox, { backgroundColor: cardBg, borderColor: accent + '20' }]}>
              <Text style={[s.infoText, { color: subColor }]}>
                {tr('Dziś szczególnie aktywne są trzy planety, których energie wyraźnie kształtują wibracje kosmiczne.', 'Today three planets are especially active, and their influence is strongly shaping the cosmic field.')}
              </Text>
            </View>
          </Animated.View>
          {cosmic.activePlanets.map((planet, i) => (
            <PlanetCard key={planet.name} planet={planet} rank={i} delay={i * 80} isLight={isLight} />
          ))}
          <Animated.View entering={FadeInDown.delay(280).duration(400)}>
            <Pressable
              onPress={() => navigation.navigate('AstrologyCycles')}
              style={[s.linkRow, { borderColor: accent + '20' }]}
            >
              <Text style={[s.linkText, { color: accent }]}>{tr('Pełna mapa tranzytów planetarnych', 'Full map of planetary transits')}</Text>
              <ArrowRight size={15} color={accent} />
            </Pressable>
          </Animated.View>

          {/* 5. WEEKLY COSMIC MAP */}
          <SectionHeader label={tr('MAPA TYGODNIA', 'WEEK MAP')} accent={accent} />
          <Animated.View entering={FadeInDown.delay(60).duration(500)}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {cosmic.weekForecast.map((day, i) => (
                <WeekCard key={i} day={day} accent={accent} isLight={isLight} />
              ))}
            </ScrollView>
          </Animated.View>

          {/* 6. BEST ACTIVITIES */}
          <SectionHeader label={tr('NAJLEPSZE AKTYWNOŚCI DZIŚ', 'BEST ACTIVITIES TODAY')} accent={accent} />
          {cosmic.bestActivities.map((activity, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(i * 60).duration(400)}>
              <View style={[s.activityRow, { borderColor: accent + '18', backgroundColor: cardBg }]}>
                <View style={[s.activityNum, { backgroundColor: accent + '18', borderColor: accent + '33' }]}>
                  <Text style={[s.activityNumText, { color: accent }]}>{i + 1}</Text>
                </View>
                <Text style={[s.activityText, { color: textColor }]}>{activity}</Text>
                <Sparkles size={14} color={accent} opacity={0.5} />
              </View>
            </Animated.View>
          ))}

          {/* 7. WHAT TO AVOID */}
          <SectionHeader label={tr('CZEGO UNIKAĆ DZIŚ', 'WHAT TO AVOID TODAY')} accent="#F87171" />
          {cosmic.avoidItems.map((item, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(i * 60).duration(400)}>
              <View style={[s.avoidRow, { borderColor: '#F8717118', backgroundColor: '#F8717108' }]}>
                <View style={[s.avoidIcon, { backgroundColor: '#F8717118' }]}>
                  <Text style={{ fontSize: 14 }}>⚠️</Text>
                </View>
                <Text style={[s.avoidText, { color: textColor }]}>{item}</Text>
              </View>
            </Animated.View>
          ))}

          {/* 8. COSMIC WEATHER FOR YOUR SIGN */}
          <SectionHeader label={`${tr('KOSMICZNA POGODA DLA', 'COSMIC WEATHER FOR')}: ${userZodiac?.toUpperCase?.() || tr('TWOJEGO ZNAKU', 'YOUR SIGN')}`} accent="#C4B5FD" />
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <LinearGradient
              colors={['#C4B5FD18', '#A78BFA08', 'transparent']}
              style={[s.signCard, { borderColor: '#C4B5FD30' }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View style={[s.signBadge, { backgroundColor: '#C4B5FD18', borderColor: '#C4B5FD40' }]}>
                  <Text style={{ fontSize: 24 }}>♊</Text>
                </View>
                <View>
                  <Text style={[s.signLabel, { color: '#C4B5FD' }]}>{userZodiac}</Text>
                  <Text style={[s.signSublabel, { color: subColor }]}>{tr('Twój znak słoneczny', 'Your sun sign')}</Text>
                </View>
                <StarRating rating={cosmic.rating} color="#C4B5FD" />
              </View>
              <Text style={[s.signAdvice, { color: isLight ? '#2A1F0E' : '#DDD8CF' }]}>{signAdvice}</Text>
              <Pressable
                onPress={() => navigation.navigate('Horoscope')}
                style={[s.signCta, { borderColor: '#C4B5FD35' }]}
              >
                <Text style={{ fontSize: 13, color: '#C4B5FD', fontWeight: '600' }}>{tr('Pełny horoskop dzienny', 'Full daily horoscope')}</Text>
                <ArrowRight size={14} color="#C4B5FD" />
              </Pressable>
            </LinearGradient>
          </Animated.View>

          {/* 9. 30-DAY COSMIC CALENDAR */}
          <SectionHeader label={`${tr('KALENDARZ', 'CALENDAR')} ${monthLabel.toUpperCase()} ${yearLabel}`} accent={accent} />
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <View style={[s.calendarWrap, { backgroundColor: cardBg, borderColor: accent + '18' }]}>
              {/* Day headers */}
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                {localizedDaysShort.map(d => (
                  <View key={d} style={{ width: (SW - 44 - 36) / 7, alignItems: 'center' }}>
                    <Text style={[s.calDayHeader, { color: subColor }]}>{d}</Text>
                  </View>
                ))}
              </View>
              {/* Grid */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {/* Offset padding cells */}
                {Array.from({ length: firstDOW }, (_, i) => (
                  <View key={'pad' + i} style={{ width: (SW - 44 - 36) / 7, aspectRatio: 0.85 }} />
                ))}
                {cosmic.cal30.map((cell, i) => (
                  <CalCell key={i} cell={cell} today={todayDay} isLight={isLight} />
                ))}
              </View>
              {/* Legend */}
              <View style={[s.calLegend, { borderTopColor: accent + '15' }]}>
                {[
                  { color: '#F87171', label: tr('Intensywny', 'Intense') },
                  { color: '#FBBF24', label: tr('Aktywny', 'Active') },
                  { color: '#60A5FA', label: tr('Spokojny', 'Calm') },
                  { color: '#34D399', label: tr('Harmonijny', 'Harmonious') },
                  { color: '#C4B5FD', label: tr('Duchowy', 'Spiritual') },
                ].map(l => (
                  <View key={l.label} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: l.color }]} />
                    <Text style={[s.legendLabel, { color: subColor }]}>{l.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* 10. SUBSCRIBE TO UPDATES */}
          <SectionHeader label={tr('POWIADOMIENIA KOSMICZNE', 'COSMIC NOTIFICATIONS')} accent={accent} />
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <Pressable
              onPress={() => navigation.navigate('NotificationsDetail')}
              style={[s.notifCard, { borderColor: accent + '30' }]}
            >
              <LinearGradient
                colors={[accent + '16', accent + '06']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={[s.notifIcon, { backgroundColor: accent + '20', borderColor: accent + '40' }]}>
                <Bell color={accent} size={22} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.notifTitle, { color: textColor }]}>{tr('Poranna prognoza kosmiczna', 'Morning cosmic forecast')}</Text>
                <Text style={[s.notifDesc, { color: subColor }]}>
                  {tr('Ustaw powiadomienie o wybranej godzinie i zacznij dzień z kosmicznym briefingiem energetycznym.', 'Set a reminder for your chosen hour and begin the day with a cosmic energy briefing.')}
                </Text>
              </View>
              <ArrowRight color={accent} size={18} />
            </Pressable>
          </Animated.View>

          {/* Quick links */}
          <Animated.View entering={FadeInDown.delay(120).duration(500)}>
            <View style={s.quickLinks}>
              {[
                { label: tr('Kalendarz Księżycowy', 'Moon calendar'), route: 'LunarCalendar', color: '#C4B5FD' },
                { label: tr('Cykle Planetarne', 'Planetary cycles'), route: 'AstrologyCycles', color: '#60A5FA' },
                { label: tr('Biorytmy', 'Biorhythms'), route: 'Biorhythm', color: '#34D399' },
              ].map(link => (
                <Pressable
                  key={link.route}
                  onPress={() => navigation.navigate(link.route)}
                  style={[s.quickLink, { borderColor: link.color + '30', backgroundColor: link.color + '0A' }]}
                >
                  <Text style={[s.quickLinkText, { color: link.color }]}>{link.label}</Text>
                  <ArrowRight size={12} color={link.color} />
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* AI COSMIC INSIGHT */}
          <Animated.View entering={FadeInDown.delay(160).duration(500)}>
            <SectionHeader label={tr('AI INTERPRETACJA DNIA', 'AI READING OF THE DAY')} accent={accent} />
            <View style={[s.infoBox, { backgroundColor: cosmic.weather.color + "10", borderColor: cosmic.weather.color + "30" }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={[s.infoText, { color: cosmic.weather.color, fontWeight: "700", fontSize: 11, letterSpacing: 1 }]}>{"ORACLE"}</Text>
                <Pressable onPress={fetchCosmicInsight} disabled={cosmicAiLoading}
                  style={{ backgroundColor: cosmic.weather.color, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 }}>
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                    {cosmicAiLoading ? "..." : tr('Interpretuj dzień', 'Interpret day')}
                  </Text>
                </Pressable>
              </View>
              {cosmicAiInsight ? (
                <Text style={[s.infoText, { color: textColor, fontStyle: "italic", lineHeight: 22 }]}>{cosmicAiInsight}</Text>
              ) : (
                <Text style={[s.infoText, { color: subColor }]}>
                  {tr('Naciśnij Interpretuj dzień, aby uzyskać spersonalizowaną AI analizę kosmicznej energii dnia.', 'Press Interpret day to receive a personalized AI reading of today’s cosmic energy.')}
                </Text>
              )}
            </View>
          </Animated.View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ── STYLES ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.padding.screen, paddingTop: 4, paddingBottom: 12,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, letterSpacing: 0.3, marginTop: 1 },
  scroll: { paddingHorizontal: layout.padding.screen, paddingTop: 8 },

  // Forecast card
  forecastCard: { borderRadius: 22, borderWidth: 1, padding: 20, marginBottom: 4 },
  forecastEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2.5, marginBottom: 6 },
  forecastType: { fontSize: 28, fontWeight: '300', letterSpacing: -0.8 },
  forecastMsg: { fontSize: 14, lineHeight: 22, letterSpacing: 0.1, marginBottom: 16 },
  forecastDivider: { height: StyleSheet.hairlineWidth, marginBottom: 14 },
  forecastStat: { flex: 1, alignItems: 'center' },
  forecastStatVal: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  forecastStatLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginTop: 3 },
  forecastStatDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  moonBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },

  // Info box
  infoBox: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  infoText: { fontSize: 13, lineHeight: 20 },

  // Link row
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 4 },
  linkText: { fontSize: 13, fontWeight: '600' },

  // Activity rows
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  activityNum: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  activityNumText: { fontSize: 13, fontWeight: '700' },
  activityText: { flex: 1, fontSize: 13, lineHeight: 19 },

  // Avoid rows
  avoidRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  avoidIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avoidText: { flex: 1, fontSize: 13, lineHeight: 19 },

  // Sign card
  signCard: { borderRadius: 22, borderWidth: 1, padding: 20, marginBottom: 4 },
  signBadge: { width: 54, height: 54, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  signLabel: { fontSize: 17, fontWeight: '700' },
  signSublabel: { fontSize: 11, marginTop: 2 },
  signAdvice: { fontSize: 14, lineHeight: 22, marginBottom: 14 },
  signCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13, borderRadius: 12, borderWidth: 1 },

  // Calendar
  calendarWrap: { borderRadius: 20, borderWidth: 1, padding: 16 },
  calDayHeader: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  calLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 12, marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 10, fontWeight: '500' },

  // Notifications card
  notifCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  notifIcon: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  notifDesc: { fontSize: 12, lineHeight: 18 },

  // Quick links
  quickLinks: { gap: 8 },
  quickLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13, borderRadius: 14, borderWidth: 1 },
  quickLinkText: { fontSize: 13, fontWeight: '600' },
});
