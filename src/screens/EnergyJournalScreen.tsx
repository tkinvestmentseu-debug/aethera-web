// @ts-nocheck
import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, Easing,
} from 'react-native-reanimated';
import Svg, {
  Path, Circle, Polygon, Line as SvgLine, G, Defs,
  RadialGradient as SvgRadialGradient, Stop, Text as SvgText,
  Ellipse,
} from 'react-native-svg';
import {
  ChevronLeft, Battery, BookOpen, Flame, Moon, Sparkles,
  TrendingUp, Zap, Wind, Headphones, ArrowRight, Star,
  Activity, Brain, Heart, Palette, Users, Globe2,
  Save, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { screenContracts } from '../core/theme/designSystem';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { AiService } from '../core/services/ai.service';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#34D399';

// ── Energy level → orb color ──────────────────────────────────────────────────
const getEnergyColor = (level: number): string => {
  if (level >= 90) return '#A78BFA'; // transcendent — purple
  if (level >= 75) return '#34D399'; // high — green
  if (level >= 55) return '#FBBF24'; // good — yellow
  if (level >= 35) return '#F97316'; // medium — orange
  return '#E8705A';                  // low — red
};

const getEnergyLabel = (level: number): string => {
  if (level >= 90) return 'Transcendentna';
  if (level >= 75) return 'Wysoka';
  if (level >= 55) return 'Dobra';
  if (level >= 35) return 'Średnia';
  return 'Niska';
};

// ── Period options ────────────────────────────────────────────────────────────
const PERIODS = [
  { id: 7, label: '7 dni' },
  { id: 14, label: '14 dni' },
  { id: 30, label: '30 dni' },
] as const;

// ── Mood options ──────────────────────────────────────────────────────────────
const MOOD_OPTIONS = [
  { id: 'Znakomita', label: 'Wzniesienie',  color: '#34D399', energy: 92 },
  { id: 'Dobra',     label: 'Stabilność',   color: '#CEAE72', energy: 76 },
  { id: 'Spokojna',  label: 'Miękkość',     color: '#60A5FA', energy: 58 },
  { id: 'Słaba',     label: 'Zmęczenie',    color: '#F97316', energy: 34 },
  { id: 'Trudna',    label: 'Przeciążenie', color: '#E8705A', energy: 18 },
] as const;

// ── Quick scale 1-10 segment colors ──────────────────────────────────────────
const SCALE_COLORS = [
  '#E8705A', '#E8705A', '#F97316', '#F97316', '#FBBF24',
  '#FBBF24', '#34D399', '#34D399', '#34D399', '#A78BFA',
];

// ── Six energy dimensions for the radar ──────────────────────────────────────
const DIMENSIONS = [
  { key: 'fizyczna',    label: 'Fizyczna',    icon: Activity, color: '#E8705A' },
  { key: 'emocjonalna', label: 'Emocjonalna', icon: Heart,    color: '#F472B6' },
  { key: 'mentalna',    label: 'Mentalna',    icon: Brain,    color: '#60A5FA' },
  { key: 'duchowa',     label: 'Duchowa',     icon: Sparkles, color: '#A78BFA' },
  { key: 'tworcza',     label: 'Twórcza',    icon: Palette,  color: '#FBBF24' },
  { key: 'spoleczna',   label: 'Społeczna',  icon: Users,    color: '#34D399' },
];

// ── Energy influencers ────────────────────────────────────────────────────────
const INFLUENCERS = [
  { key: 'sleep',    label: 'Sen',      options: ['😴 Głęboki', '😪 Płytki', '😫 Brak'] },
  { key: 'food',     label: 'Jedzenie', options: ['🥗 Lekkie', '🍽️ Normalne', '🍕 Ciężkie'] },
  { key: 'exercise', label: 'Ruch',     options: ['🏃 Intensywny', '🚶 Spacer', '🛋️ Brak'] },
  { key: 'social',   label: 'Ludzie',   options: ['🤝 Budujące', '😐 Neutralne', '😩 Drenaż'] },
  { key: 'moon',     label: 'Księżyc',  options: ['🌕 Pełnia', '🌑 Nów', '🌙 Inny'] },
  { key: 'weather',  label: 'Pogoda',   options: ['☀️ Słonecznie', '☁️ Pochmurno', '🌧️ Deszcz'] },
];

// ── Chakra per dominant dimension ────────────────────────────────────────────
const DIMENSION_TO_CHAKRA: Record<string, { name: string; sanskrit: string; color: string; practice: string }> = {
  fizyczna:    { name: 'Muladhara',    sanskrit: 'मूलाधार', color: '#E8705A', practice: 'Ćwiczenia uziemiające, chodzenie boso, kontakt z ziemią' },
  emocjonalna: { name: 'Svadhisthana', sanskrit: 'स्वाधिष्ठान', color: '#F97316', practice: 'Twórcze wyrażanie się, taniec, dziennik emocji' },
  mentalna:    { name: 'Ajna',         sanskrit: 'आज्ञा', color: '#818CF8', practice: 'Medytacja wizualizacyjna, dziennik snów, cisza cyfrowa' },
  duchowa:     { name: 'Sahasrara',    sanskrit: 'सहस्रार', color: '#A78BFA', practice: 'Medytacja ciszy, kontemplacja natury, modlitwa bezsłowna' },
  tworcza:     { name: 'Vishuddha',    sanskrit: 'विशुद्ध', color: '#60A5FA', practice: 'Śpiew, mówienie prawdy, pisanie bez cenzury' },
  spoleczna:   { name: 'Anahata',      sanskrit: 'अनाहत', color: '#34D399', practice: 'Praktyka wdzięczności, granice z miłością, przebaczenie' },
};

// ── Chart point type ──────────────────────────────────────────────────────────
type ChartPoint = { date: string; energy: number; mood: string; entries: number; rituals: number };

// ── Animated energy orb ───────────────────────────────────────────────────────
const EnergyOrb = ({ level, isLight }: { level: number; isLight: boolean }) => {
  const orbColor = getEnergyColor(level);
  const label    = getEnergyLabel(level);
  const pulse    = useSharedValue(1);
  const rot1     = useSharedValue(0);
  const rot2     = useSharedValue(0);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,    { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true,
    );
    rot1.value = withRepeat(withTiming(360,  { duration: 7000,  easing: Easing.linear }), -1, false);
    rot2.value = withRepeat(withTiming(-360, { duration: 11000, easing: Easing.linear }), -1, false);
  }, []);

  const orbStyle  = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const ring1Styl = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot1.value}deg` }] }));
  const ring2Styl = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot2.value}deg` }] }));

  const OW = 170, OH = 170, cx = 85, cy = 85, R = 58;

  return (
    <View style={{ alignItems: 'center', marginVertical: 16 }}>
      <Animated.View style={orbStyle}>
        <Svg width={OW} height={OH}>
          <Defs>
            <SvgRadialGradient id="og" cx="40%" cy="35%" r="60%">
              <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.35} />
              <Stop offset="40%"  stopColor={orbColor} stopOpacity={0.9} />
              <Stop offset="100%" stopColor={orbColor} stopOpacity={0.3} />
            </SvgRadialGradient>
          </Defs>
          <Circle cx={cx} cy={cy} r={R + 18} fill={orbColor} opacity={0.07} />
          <Circle cx={cx} cy={cy} r={R + 10} fill={orbColor} opacity={0.10} />
          <Circle cx={cx} cy={cy} r={R}      fill="url(#og)" />
          <Ellipse cx={cx - 14} cy={cy - 16} rx={14} ry={9} fill="#FFFFFF" opacity={0.22} />
          <Circle  cx={cx - 14} cy={cy - 18} r={4}          fill="#FFFFFF" opacity={0.30} />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute' }, ring1Styl]}>
        <Svg width={OW} height={OH}>
          <Circle cx={cx} cy={cy} r={R + 14} fill="none" stroke={orbColor} strokeWidth={1.2} strokeDasharray="6 10" opacity={0.40} />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute' }, ring2Styl]}>
        <Svg width={OW} height={OH}>
          <Circle cx={cx} cy={cy} r={R + 22} fill="none" stroke={orbColor} strokeWidth={0.8} strokeDasharray="3 14" opacity={0.25} />
        </Svg>
      </Animated.View>
      <Text style={{ color: orbColor, fontSize: 13, fontWeight: '700', letterSpacing: 1.4, marginTop: 4 }}>
        {level > 0 ? `${level}%  —  ${label}` : 'Brak odczytu'}
      </Text>
    </View>
  );
};

// ── Energy radar (spider chart for 6 dimensions) ──────────────────────────────
const EnergyRadar = ({
  scores, accent, subColor,
}: { scores: Record<string, number>; accent: string; subColor: string }) => {
  const SIZE = 220, cx = 110, cy = 110, R = 72, n = DIMENSIONS.length;

  const pt = (i: number, r: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  const outer = DIMENSIONS.map((_, i) => pt(i, R));
  const score = DIMENSIONS.map((d, i) => pt(i, ((scores[d.key] ?? 3) / 5) * R));
  const scoreStr = score.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <Svg width={SIZE} height={SIZE}>
        {[0.2, 0.4, 0.6, 0.8, 1].map(frac => {
          const pts = DIMENSIONS.map((_, i) => pt(i, R * frac));
          return <Polygon key={frac} points={pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} fill="none" stroke={accent + '20'} strokeWidth={0.8} />;
        })}
        {outer.map((p, i) => (
          <SvgLine key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={accent + '22'} strokeWidth={0.8} />
        ))}
        <Polygon points={scoreStr} fill={accent + '2A'} stroke={accent} strokeWidth={1.8} />
        {score.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={DIMENSIONS[i].color} opacity={0.95} />
        ))}
        {outer.map((p, i) => {
          const lx = cx + (R + 14) * Math.cos((Math.PI * 2 * i) / n - Math.PI / 2);
          const ly = cy + (R + 14) * Math.sin((Math.PI * 2 * i) / n - Math.PI / 2);
          return (
            <SvgText key={i} x={lx} y={ly + 4} fontSize="9" fill={DIMENSIONS[i].color} textAnchor="middle" fontWeight="700">
              {DIMENSIONS[i].label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

// ── 7-day line chart ──────────────────────────────────────────────────────────
const EnergyLineChart = ({ data, color, isLight }: { data: ChartPoint[]; color: string; isLight: boolean }) => {
  const { t } = useTranslation();

  const W = SW - 88, H = 120;
  if (data.length < 2) return (
    <View style={{ height: H, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: isLight ? '#6A5A48' : '#9A8E80', fontSize: 12 }}>{t('energyJournal.za_malo_danych_loguj_energie', 'Za mało danych — loguj energię przez kilka dni')}</Text>
    </View>
  );

  const pts = data.map((item, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (item.energy / 100) * H,
    item,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${H} L0,${H} Z`;

  return (
    <View>
      <Svg width={W} height={H + 24}>
        {[25, 50, 75].map(lvl => {
          const y = H - (lvl / 100) * H;
          return (
            <G key={lvl}>
              <Path d={`M0,${y} L${W},${y}`} stroke={isLight ? 'rgba(122,95,54,0.14)' : 'rgba(255,255,255,0.07)'} strokeWidth={1} />
              <SvgText x={2} y={y - 3} fontSize="8" fill={isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.28)'}>{lvl}%</SvgText>
            </G>
          );
        })}
        <Path d={area} fill={color} opacity={0.12} />
        <Path d={line}  stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={5} fill={getEnergyColor(p.item.energy)} stroke={isLight ? '#EEF9F3' : '#060F0A'} strokeWidth={1.5} />
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        {data.map(item => (
          <Text key={item.date} style={{ fontSize: 9, color: isLight ? '#6A5A48' : '#9A8E80' }}>
            {['Nd','Pn','Wt','Śr','Cz','Pt','Sb'][new Date(item.date).getDay()]}
          </Text>
        ))}
      </View>
    </View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
export const EnergyJournalScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const dailyProgress = useAppStore(s => s.dailyProgress);
  const streaks = useAppStore(s => s.streaks);
  const updateDailyProgress = useAppStore(s => s.updateDailyProgress);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const userData = useAppStore(s => s.userData);
  const {currentTheme, isLight} = useTheme();
  const theme = currentTheme;
  const { entries } = useJournalStore();
  const accent     = ACCENT;
  const textColor  = isLight ? '#1A1410' : '#F5F1EA';
  const subColor   = isLight ? '#6A5A48' : '#B0A393';
  const cardBg     = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const borderColor = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)';

  const today        = new Date().toISOString().split('T')[0];
  const todayProgress = dailyProgress[today] || {};

  // ── local state ────────────────────────────────────────────────────────────
  const [period,       setPeriod]       = useState<number>(7);
  const [energyGoal,   setEnergyGoal]   = useState<number>(70);
  const [journalText,  setJournalText]  = useState('');
  const [journalSaved, setJournalSaved] = useState(false);
  const [showHistory,  setShowHistory]  = useState(false);
  const journalSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (journalSavedTimerRef.current) clearTimeout(journalSavedTimerRef.current); };
  }, []);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiInsight,    setAiInsight]    = useState('');
  const [showAiInsight, setShowAiInsight] = useState(false);

  const [dimensions, setDimensions] = useState<Record<string, number>>({
    fizyczna: 3, emocjonalna: 3, mentalna: 3, duchowa: 3, tworcza: 3, spoleczna: 3,
  });

  const [influencers, setInfluencers] = useState<Record<string, string>>({});

  // ── chart data ─────────────────────────────────────────────────────────────
  const chartData = useMemo<ChartPoint[]>(() => {
    return Array.from({ length: period }, (_, offset) => {
      const d = new Date();
      d.setDate(d.getDate() - (period - 1 - offset));
      const date     = d.toISOString().split('T')[0];
      const progress = dailyProgress[date] || {};
      const dayEntries = entries.filter(e => e.date?.startsWith(date));
      return {
        date,
        energy:  progress.energyLevel ?? dayEntries[0]?.energyLevel ?? 0,
        mood:    progress.mood || dayEntries[0]?.mood || 'Spokojna',
        entries: dayEntries.length,
        rituals: progress.completedRituals?.length || 0,
      };
    });
  }, [dailyProgress, entries, period]);

  const last7 = useMemo<ChartPoint[]>(() => {
    return Array.from({ length: 7 }, (_, offset) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - offset));
      const date     = d.toISOString().split('T')[0];
      const progress = dailyProgress[date] || {};
      const dayEntries = entries.filter(e => e.date?.startsWith(date));
      return {
        date,
        energy:  progress.energyLevel ?? dayEntries[0]?.energyLevel ?? 0,
        mood:    progress.mood || 'Spokojna',
        entries: dayEntries.length,
        rituals: progress.completedRituals?.length || 0,
      };
    });
  }, [dailyProgress, entries]);

  // ── computed ───────────────────────────────────────────────────────────────
  const averageEnergy = Math.round(chartData.reduce((s, i) => s + i.energy, 0) / Math.max(1, chartData.length));
  const totalEntries  = chartData.reduce((s, i) => s + i.entries, 0);
  const totalRituals  = chartData.reduce((s, i) => s + i.rituals, 0);
  const activeDays    = chartData.filter(i => i.entries > 0 || i.rituals > 0).length;
  const trendDelta    = (chartData[chartData.length - 1]?.energy || 0) - (chartData[0]?.energy || 0);
  const todayEnergy   = todayProgress.energyLevel ?? 0;
  const orbColor      = getEnergyColor(todayEnergy || averageEnergy);

  const moodBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    chartData.forEach(i => counts.set(i.mood, (counts.get(i.mood) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [chartData]);

  const dominantMood     = moodBreakdown[0]?.[0] || 'Spokojna';
  const dominantMoodMeta = MOOD_OPTIONS.find(o => o.id === dominantMood) || MOOD_OPTIONS[2];

  const weeklyInsight = useMemo(() => {
    if (averageEnergy >= 78) return 'Twoje pole jest stabilne i pojemne. Dobry moment na manifestację, odważne decyzje i głębsze rytuały.';
    if (averageEnergy >= 55) return 'Energia jest w fazie równowagi. Regularność da Ci teraz najwięcej: jeden rytuał, krótki zapis, spokojne domknięcie dnia.';
    return 'System pokazuje przeciążenie lub rozproszenie. Zamiast nowych praktyk — wróć do snu, oddechu i prostego gruntu.';
  }, [averageEnergy]);

  const personalizedTip = useMemo(() => {
    if (averageEnergy < 40) return { level: 'Tryb regeneracji',  desc: 'Priorytet: sen, cisza, ograniczenie bodźców. Nie dodawaj nowych praktyk.',                       color: '#E8705A' };
    if (averageEnergy < 60) return { level: 'Tryb stabilizacji', desc: 'Rytuał poranny, oddech, jedno zadanie na raz. Regularność ważniejsza niż intensywność.',          color: '#F97316' };
    if (averageEnergy < 80) return { level: 'Tryb płynności',    desc: 'Buduj momentum, dodaj wyzwania. Twoja energia niesie — skorzystaj z tego okna.',                  color: accent };
    return                          { level: 'Tryb ekspansji',   desc: 'Czas na duże projekty i przełomy. Twoje pole jest pojemne — odważ się na więcej.',                 color: '#A78BFA' };
  }, [averageEnergy]);

  const dominantDimKey = Object.entries(dimensions).sort((a, b) => b[1] - a[1])[0]?.[0] || 'emocjonalna';
  const dominantChakra = DIMENSION_TO_CHAKRA[dominantDimKey];

  const moonPhaseInfo = useMemo(() => {
    const now = new Date();
    const jd  = 367 * now.getFullYear()
      - Math.floor(7 * (now.getFullYear() + Math.floor((now.getMonth() + 10) / 12)) / 4)
      + Math.floor(275 * (now.getMonth() + 1) / 9)
      + now.getDate() + 1721013.5;
    const moonAge = ((jd - 2451550.1) % 29.53058867 + 29.53058867) % 29.53058867;
    const phases: [number, string, string][] = [
      [1.85,  '🌑', 'Nów'],
      [7.38,  '🌒', 'Przybywający sierp'],
      [9.22,  '🌓', 'Pierwsza kwadra'],
      [14.77, '🌔', 'Przybywający garb'],
      [16.61, '🌕', 'Pełnia'],
      [22.15, '🌖', 'Ubywający garb'],
      [23.99, '🌗', 'Ostatnia kwadra'],
      [29.53, '🌘', 'Ubywający sierp'],
    ];
    const [, phaseEmoji, phaseName] = phases.find(([max]) => moonAge < max) || phases[phases.length - 1];
    const tips: Record<string, string> = {
      'Nów':                  'Czas sadzenia intencji. Energia bywa niska — to naturalne.',
      'Przybywający sierp':   'Stopniowy wzrost. Wprowadzaj nowe nawyki małymi krokami.',
      'Pierwsza kwadra':      'Napięcie twórcze. Energia rośnie — czas na działanie.',
      'Przybywający garb':    'Kulminacja blisko. Wydobywaj z siebie to, co budowałeś.',
      'Pełnia':               'Szczyt energii. Intensywne emocje i pełnia witalizacji.',
      'Ubywający garb':       'Czas integracji. Przetwarzaj doświadczenia z pełni.',
      'Ostatnia kwadra':      'Oczyszczanie. Puść to, co nie służy.',
      'Ubywający sierp':      'Odpoczynek i regeneracja. Energia naturalnie opada.',
    };
    return { phaseEmoji, phaseName, tip: tips[phaseName] || '' };
  }, []);

  const historyEntries = useMemo(() => {
    return Array.from({ length: 14 }, (_, offset) => {
      const d    = new Date();
      d.setDate(d.getDate() - offset);
      const date = d.toISOString().split('T')[0];
      const progress   = dailyProgress[date] || {};
      const dayEntries = entries.filter(e => e.date?.startsWith(date));
      return { date, progress, dayEntries };
    }).filter(e => e.progress.energyLevel != null || e.dayEntries.length > 0);
  }, [dailyProgress, entries]);

  // ── handlers ───────────────────────────────────────────────────────────────
  const isFav = isFavoriteItem('energy-journal');

  const handleStar = () => {
    if (isFav) {
      removeFavoriteItem('energy-journal');
    } else {
      addFavoriteItem({ id: 'energy-journal', label: 'Dziennik Energii', route: 'EnergyJournal', params: {}, icon: 'Battery', color: accent, addedAt: new Date().toISOString() });
    }
  };

  const logEnergy = (level: number) => {
    const mood = level >= 80 ? 'Znakomita' : level >= 65 ? 'Dobra' : level >= 45 ? 'Spokojna' : level >= 25 ? 'Słaba' : 'Trudna';
    updateDailyProgress(today, { energyLevel: level, mood: todayProgress.mood || mood });
  };

  const logMood = (moodId: string, energy: number) =>
    updateDailyProgress(today, { mood: moodId, energyLevel: todayProgress.energyLevel ?? energy });

  const setDimension = (key: string, val: number) =>
    setDimensions(prev => ({ ...prev, [key]: val }));

  const setInfluencer = (key: string, val: string) =>
    setInfluencers(prev => ({ ...prev, [key]: prev[key] === val ? '' : val }));

  const saveJournalNote = () => {
    if (journalText.trim().length < 2) return;
    navigation.navigate('JournalEntry', {
      type: 'reflection',
      draft: journalText,
      prompt: 'Jak czuję swoją energię dzisiaj i co na nią wpływa?',
    });
    setJournalSaved(true);
    if (journalSavedTimerRef.current) clearTimeout(journalSavedTimerRef.current);
    journalSavedTimerRef.current = setTimeout(() => setJournalSaved(false), 2000);
  };

  const analyzeEnergy = async () => {
    setAiLoading(true);
    setShowAiInsight(true);
    try {
      const personLine  = userData?.name        ? `Imię: ${userData.name}.` : '';
      const zodiacLine  = userData?.zodiacSign  ? ` Znak zodiaku: ${userData.zodiacSign}.` : '';
      const weekData    = last7.map(d =>
        `${(() => { const _d = new Date(d.date); const DN = ['Nd','Pn','Wt','Śr','Cz','Pt','Sb']; return `${DN[_d.getDay()]} ${String(_d.getDate()).padStart(2,'0')}.${String(_d.getMonth()+1).padStart(2,'0')}`; })()}: ${d.energy > 0 ? d.energy + '%' : 'brak odczytu'} (nastrój: ${d.mood || '—'})`
      ).join('\n');
      const dimSummary  = DIMENSIONS.map(d => `${d.label}: ${dimensions[d.key]}/5`).join(', ');
      const inflSummary = Object.entries(influencers).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ') || 'Nie zaznaczono';

      const prompt = `Jesteś energetycznym analitykiem i duchowym przewodnikiem. ${personLine}${zodiacLine}

Dane energetyczne z ostatnich 7 dni:
${weekData}

Dzisiejszy profil energetyczny (wymiary 1-5):
${dimSummary}

Czynniki wpływające na energię dziś:
${inflSummary}

Faza księżyca: ${moonPhaseInfo.phaseName}

Napisz w języku użytkownika głęboką, trafną analizę energetyczną w 4-5 zdaniach:
1. Co wzorzec energetyczny mówi o tej osobie w tym tygodniu
2. Który wymiar energetyczny wymaga teraz uwagi i dlaczego
3. Konkretna, prosta praktyka na najbliższe 24 godziny
4. Krótkie zdanie o wpływie fazy księżyca na te dane

Pisz ciepło, konkretnie, bez ogólników. Max 5 zdań.`;

      const localizedPrompt = i18n.language?.startsWith('en')
        ? `Current energy factors:\n${inflSummary}\n\nMoon phase: ${moonPhaseInfo.phaseName}\n\nWrite a deep, accurate energetic analysis in 4-5 sentences:\n1. What this pattern says about the person this week\n2. Which energetic dimension needs attention now and why\n3. One simple practice for the next 24 hours\n4. One short line about how the moon phase affects this reading\n\nWrite warmly, concretely and without generic filler. Max 5 sentences.`
        : prompt;
      const response = await AiService.chatWithOracle([{ role: 'user', content: localizedPrompt }], i18n.language?.startsWith('en') ? 'en' : 'pl');
      setAiInsight(response);
    } catch {
      setAiInsight(i18n.language?.startsWith('en') ? 'The Oracle is quiet. Return to the breath — it always knows the answer.' : 'Oracle milczy. Wróć do oddechu — on zawsze zna odpowiedź.');
    }
    setAiLoading(false);
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isLight ? ['#EEF9F3', '#F5FBF7', '#FAFFF8'] : ['#060F0A', '#080F0C', '#0A1410']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={s.safeArea} edges={['top']}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={s.backBtn} hitSlop={14}>
            <ChevronLeft color={accent} size={28} strokeWidth={1.5} />
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={[s.eyebrow, { color: accent }]}>{t('energyJournal.dziennik_energii', '⚡ DZIENNIK ENERGII')}</Text>
            <Text style={[s.title, { color: textColor }]}>{t('energyJournal.rytm_ciala_i_pola', 'Rytm ciała i pola')}</Text>
          </View>
          <Pressable onPress={handleStar} style={s.starBtn} hitSlop={14}>
            <Star color={accent} size={20} strokeWidth={1.5} fill={isFav ? accent : 'transparent'} />
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          <ScrollView
            contentContainerStyle={[s.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') + 24 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* ════════════════════════════════════════════════════════════════
                1. ENERGY ORB HERO
            ════════════════════════════════════════════════════════════════ */}
            <Animated.View entering={FadeInDown.duration(500)}>
              <View style={[s.card, { backgroundColor: cardBg, borderColor: orbColor + '33', alignItems: 'center' }]}>
                <LinearGradient colors={[orbColor + '14', 'transparent']} style={StyleSheet.absoluteFill} />
                <Text style={[s.cardEyebrow, { color: orbColor, alignSelf: 'flex-start' }]}>{t('energyJournal.twoja_energia_teraz', '✦ TWOJA ENERGIA TERAZ')}</Text>
                <EnergyOrb level={todayEnergy || averageEnergy} isLight={isLight} />
                <Text style={[s.orbSubline, { color: subColor }]}>
                  {todayEnergy > 0
                    ? `Dzisiejszy odczyt: ${todayEnergy}% · Średnia ${period}-dniowa: ${averageEnergy}%`
                    : `Średnia ${period}-dniowa: ${averageEnergy}% · Zaloguj poziom poniżej`}
                </Text>
                {/* stat rail */}
                <View style={[s.heroStats, { alignSelf: 'stretch' }]}>
                  {[
                    { icon: Battery,  label: 'Średnia', value: `${averageEnergy}%`, color: accent },
                    { icon: BookOpen, label: 'Wpisy',   value: String(totalEntries), color: '#60A5FA' },
                    { icon: Flame,    label: 'Rytuały', value: String(totalRituals), color: '#F97316' },
                    { icon: Zap,      label: 'Pasmo',   value: `${streaks.current || 0} dni`, color: '#A78BFA' },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <View key={item.label} style={[s.heroStatCard, { borderColor: item.color + '33', backgroundColor: item.color + '12' }]}>
                        <Icon color={item.color} size={14} strokeWidth={1.8} />
                        <Text style={[s.heroStatValue, { color: item.color }]}>{item.value}</Text>
                        <Text style={[s.heroStatLabel, { color: subColor }]}>{item.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Animated.View>

            {/* ════════════════════════════════════════════════════════════════
                2. QUICK CHECK-IN — 1-10 scale
            ════════════════════════════════════════════════════════════════ */}
            <Animated.View entering={FadeInDown.delay(80).duration(500)}>
              <View style={[s.card, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[s.cardEyebrow, { color: accent }]}>{t('energyJournal.szybki_check_in', '🌿 SZYBKI CHECK-IN')}</Text>
                <Text style={[s.cardTitle, { color: textColor }]}>{t('energyJournal.jak_teraz', 'Jak teraz?')}</Text>
                <Text style={[s.cardBody, { color: subColor }]}>{t('energyJournal.dotknij_segment_1_10_zeby', 'Dotknij segment 1–10, żeby zalogować swój poziom energii.')}</Text>

                <View style={s.scaleRow}>
                  {Array.from({ length: 10 }, (_, i) => {
                    const val    = (i + 1) * 10;
                    const active = todayProgress.energyLevel === val;
                    const col    = SCALE_COLORS[i];
                    return (
                      <Pressable
                        key={val}
                        onPress={() => logEnergy(val)}
                        style={[s.scaleSegment, { backgroundColor: active ? col : col + '30', borderColor: active ? col : 'transparent' }]}
                      >
                        <Text style={[s.scaleNum, { color: active ? '#FFF' : col }]}>{i + 1}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={s.scaleHintRow}>
                  <Text style={[s.scaleHint, { color: subColor }]}>{t('energyJournal.niska', 'Niska')}</Text>
                  <Text style={[s.scaleHint, { color: subColor }]}>{t('energyJournal.transcende', 'Transcendentna')}</Text>
                </View>

                <Text style={[s.microLabel, { color: accent }]}>{t('energyJournal.nastroj', 'Nastrój')}</Text>
                <View style={s.moodGrid}>
                  {MOOD_OPTIONS.map(option => {
                    const active = todayProgress.mood === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => logMood(option.id, option.energy)}
                        style={[s.moodChip, { borderColor: active ? option.color : borderColor, backgroundColor: active ? option.color + '18' : 'transparent' }]}
                      >
                        <View style={[s.moodDot, { backgroundColor: option.color }]} />
                        <Text style={[s.moodChipTitle, { color: active ? option.color : textColor }]}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Animated.View>

            {/* ════════════════════════════════════════════════════════════════
                3. TODAY'S ENERGY PROFILE — radar + dimension sliders
            ════════════════════════════════════════════════════════════════ */}
            <Animated.View entering={FadeInDown.delay(140).duration(520)}>
              <View style={[s.card, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[s.cardEyebrow, { color: accent }]}>{t('energyJournal.profil_energetycz_dnia', '🔷 PROFIL ENERGETYCZNY DNIA')}</Text>
                <Text style={[s.cardTitle, { color: textColor }]}>{t('energyJournal.6_wymiarow_energii', '6 wymiarów energii')}</Text>
                <Text style={[s.cardBody, { color: subColor }]}>{t('energyJournal.ocen_kazdy_wymiar_od_1', 'Oceń każdy wymiar od 1 do 5 — radar aktualizuje się na żywo.')}</Text>

                <EnergyRadar scores={dimensions} accent={accent} subColor={subColor} />

                {DIMENSIONS.map(dim => {
                  const Icon = dim.icon;
                  const val  = dimensions[dim.key] ?? 3;
                  return (
                    <View key={dim.key} style={s.dimRow}>
                      <View style={s.dimLabel}>
                        <Icon color={dim.color} size={14} strokeWidth={1.8} />
                        <Text style={[s.dimName, { color: textColor }]}>{dim.label}</Text>
                      </View>
                      <View style={s.dimDots}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <Pressable
                            key={n}
                            onPress={() => setDimension(dim.key, n)}
                            style={[s.dimDot, { backgroundColor: n <= val ? dim.color : dim.color + '28', borderColor: n <= val ? dim.color : borderColor }]}
                          />
                        ))}
                      </View>
                      <Text style={[s.dimVal, { color: dim.color }]}>{val}/5</Text>
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            {/* ════════════════════════════════════════════════════════════════
                4. ENERGY JOURNAL ENTRY
            ════════════════════════════════════════════════════════════════ */}
            <Animated.View entering={FadeInDown.delay(200).duration(520)}>
              <View style={[s.card, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[s.cardEyebrow, { color: accent }]}>{t('energyJournal.wpis_energetycz', '📝 WPIS ENERGETYCZNY')}</Text>
                <Text style={[s.cardTitle, { color: textColor }]}>{t('energyJournal.obserwacje_dnia', 'Obserwacje dnia')}</Text>
                <Text style={[s.cardBody, { color: subColor }]}>
                  {(() => { const _d = new Date(); const DN = ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota']; const MN = ['Stycznia','Lutego','Marca','Kwietnia','Maja','Czerwca','Lipca','Sierpnia','Września','Października','Listopada','Grudnia']; return `${DN[_d.getDay()]}, ${_d.getDate()} ${MN[_d.getMonth()]} ${_d.getFullYear()}`; })()}
                </Text>
                <TextInput
                  value={journalText}
                  onChangeText={setJournalText}
                  placeholder={t('energyJournal.co_czuje_w_ciele_i', 'Co czuję w ciele i polu energetycznym? Co mnie dziś wzmocniło lub osłabiło? Co zaobserwowałem/am o swoim rytmie?')}
                  placeholderTextColor={subColor}
                  multiline
                  returnKeyType="done"
                  style={[
                    s.journalInput,
                    { color: textColor, backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)', borderColor },
                  ]}
                  textAlignVertical="top"
                />
                <Pressable
                  onPress={saveJournalNote}
                  style={[s.saveBtn, { backgroundColor: accent + '18', borderColor: accent + '44' }]}
                >
                  <Save color={accent} size={15} strokeWidth={1.8} />
                  <Text style={[s.saveBtnText, { color: accent }]}>
                    {journalSaved ? '✓ Zapisano' : 'Zapisz jako wpis w dzienniku'}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* ════════════════════════════════════════════════════════════════
                5. 7-DAY ENERGY GRAPH
            ════════════════════════════════════════════════════════════════ */}
            <Animated.View entering={FadeInDown.delay(260).duration(520)}>
              <View style={[s.card, { backgroundColor: cardBg, borderColor }]}>
                <View style={s.chartHeading}>
                  <View>
                    <Text style={[s.cardEyebrow, { color: accent }]}>{t('energyJournal.mapa_7_dni', '📈 MAPA 7 DNI')}</Text>
                    <Text style={[s.cardTitle, { color: textColor }]}>{t('energyJournal.trend_energetycz', 'Trend energetyczny')}</Text>
                  </View>
                  <View style={[s.deltaPill, { backgroundColor: trendDelta >= 0 ? '#34D39918' : '#E8705A18', borderColor: trendDelta >= 0 ? '#34D39944' : '#E8705A44' }]}>
                    <TrendingUp color={trendDelta >= 0 ? '#34D399' : '#E8705A'} size={13} strokeWidth={1.8} />
                    <Text style={[s.deltaText, { color: trendDelta >= 0 ? '#34D399' : '#E8705A' }]}>{trendDelta >= 0 ? '+' : ''}{trendDelta}%</Text>
                  </View>
                </View>
                <EnergyLineChart data={last7} color={accent} isLight={isLight} />
                <View style={s.chartSummaryRow}>
                  <Text style={[s.chartSummary, { color: subColor }]}>Aktywne dni: {activeDays}</Text>
                  <Text style={[s.chartSummary, { color: subColor }]}>Dziś: {todayEnergy > 0 ? `${todayEnergy}%` : '—'}</Text>
                </View>
                <View style={[s.periodRow, { marginTop: 12 }]}>
                  {PERIODS.map(opt => (
                    <Pressable
                      key={opt.id}
                      onPress={() => setPeriod(opt.id)}
                      style={[s.periodButton, { borderColor: period === opt.id ? accent : borderColor, backgroundColor: period === opt.id ? accent + '18' : 'transparent' }]}
                    >
                      <Text style={[s.periodButtonText, { color: period === opt.id ? accent : subColor }]}>{opt.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* ════════════════════════════════════════════════════════════════
                6. ENERGY INFLUENCERS
            ════════════════════════════════════════════════════════════════ */}
            <Animated.View entering={FadeInDown.delay(320).duration(520)}>
              <View style={[s.card, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[s.cardEyebrow, { color: accent }]}>{t('energyJournal.co_ksztaltuje_energie', '🧩 CO KSZTAŁTUJE ENERGIĘ')}</Text>
                <Text style={[s.cardTitle, { color: textColor }]}>{t('energyJournal.czynniki_dzis', 'Czynniki dziś')}</Text>
                <Text style={[s.cardBody, { color: subColor }]}>{t('energyJournal.zaznacz_co_wplynelo_na_twoje', 'Zaznacz, co wpłynęło na Twoje pole energetyczne.')}</Text>
                {INFLUENCERS.map(inf => (
                  <View key={inf.key} style={s.influencerRow}>
                    <Text style={[s.influencerLabel, { color: subColor }]}>{inf.label}</Text>
                    <View style={s.influencerOptions}>
                      {inf.options.map(opt => {
                        const active = influencers[inf.key] === opt;
                        return (
                          <Pressable
                            key={opt}
                            onPress={() => setInfluencer(inf.key, opt)}
                            style={[s.influencerChip, { borderColor: active ? accent : borderColor, backgroundColor: active ? accent + '18' : 'transparent' }]}
                          >
                            <Text style={[s.influencerChipText, { color: active ? accent : subColor }]}>{opt}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* ════════════════════════════════════════════════════════════════
                7. CHAKRA RESONANCE
            ════════════════════════════════════════════════════════════════ */}
            <Animated.View entering={FadeInDown.delay(380).duration(540)}>
              <View style={[s.card, { backgroundColor: dominantChakra.color + '0E', borderColor: dominantChakra.color + '30', overflow: 'hidden' }]}>
                <LinearGradient colors={[dominantChakra.color + '16', 'transparent']} style={StyleSheet.absoluteFill} />
                <Text style={[s.cardEyebrow, { color: dominantChakra.color }]}>{t('energyJournal.rezonans_czakry_dnia', '🌀 REZONANS CZAKRY DNIA')}</Text>
                <Text style={[s.cardTitle, { color: textColor }]}>Dominujący wymiar: {DIMENSIONS.find(d => d.key === dominantDimKey)?.label}</Text>
                <View style={s.chakraHero}>
                  <View style={[s.chakraCircle, { borderColor: dominantChakra.color }]}>
                    <Text style={[s.chakraSymbol, { color: dominantChakra.color }]}>{dominantChakra.sanskrit}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[s.chakraHeroName, { color: dominantChakra.color }]}>{dominantChakra.name}</Text>
                    <Text style={[s.cardBody, { color: subColor, marginTop: 0 }]}>{t('energyJournal.aktywna_czakra', 'Aktywna czakra')}</Text>
                  </View>
                </View>
                <View style={[s.practiceBanner, { backgroundColor: dominantChakra.color + '14', borderColor: dominantChakra.color + '33' }]}>
                  <Zap color={dominantChakra.color} size={14} strokeWidth={1.8} />
                  <Text style={[s.practiceText, { color: textColor }]}>{dominantChakra.practice}</Text>
                </View>
                {/* All 7 chakra balance bars */}
                <Text style={[s.microLabel, { color: subColor }]}>{t('energyJournal.balans_czakr', 'BALANS CZAKR')}</Text>
                {([
                  { name: 'Sahasrara',    color: '#A78BFA', dim: 'duchowa'    },
                  { name: 'Ajna',         color: '#818CF8', dim: 'mentalna'   },
                  { name: 'Vishuddha',    color: '#60A5FA', dim: 'tworcza'    },
                  { name: 'Anahata',      color: '#34D399', dim: 'spoleczna'  },
                  { name: 'Manipura',     color: '#FBBF24', dim: 'emocjonalna'},
                  { name: 'Svadhisthana', color: '#F97316', dim: 'fizyczna'   },
                  { name: 'Muladhara',    color: '#E8705A', dim: 'fizyczna'   },
                ] as const).map(chakra => {
                  const pct = Math.round(((dimensions[chakra.dim] ?? 3) / 5) * 100);
                  return (
                    <View key={chakra.name} style={s.chakraBarRow}>
                      <Text style={[s.chakraName, { color: chakra.color }]}>{chakra.name}</Text>
                      <View style={s.chakraBarBg}>
                        <View style={[s.chakraBarFill, { width: `${pct}%`, backgroundColor: chakra.color }]} />
                      </View>
                      <Text style={[s.chakraPct, { color: chakra.color }]}>{pct}%</Text>
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            {/* ════════════════════════════════════════════════════════════════
                8. AI ENERGY ANALYSIS
            ════════════════════════════════════════════════════════════════ */}
            <Animated.View entering={FadeInDown.delay(440).duration(540)}>
              <View style={[s.card, { backgroundColor: cardBg, borderColor: accent + '33', overflow: 'hidden' }]}>
                <LinearGradient colors={[accent + '12', 'transparent']} style={StyleSheet.absoluteFill} />
                <Text style={[s.cardEyebrow, { color: accent }]}>{t('energyJournal.analiza_energii_oracle', '🤖 ANALIZA ENERGII — ORACLE')}</Text>
                <Text style={[s.cardTitle, { color: textColor }]}>{t('energyJournal.glebszy_odczyt', 'Głębszy odczyt')}</Text>
                <Text style={[s.cardBody, { color: subColor }]}>
                  {t('energyJournal.oracle_przeanaliz_twoje_dane_z', 'Oracle przeanalizuje Twoje dane z 7 dni, wymiary energii i czynniki dnia — i da Ci spersonalizowany wgląd.')}
                </Text>
                {!showAiInsight && (
                  <Pressable
                    onPress={analyzeEnergy}
                    style={[s.aiBtn, { backgroundColor: accent + '1A', borderColor: accent + '44' }]}
                  >
                    <Sparkles color={accent} size={17} strokeWidth={1.8} />
                    <Text style={[s.aiBtnText, { color: accent }]}>{t('energyJournal.analizuj_energie', 'Analizuj Energię')}</Text>
                    <ArrowRight color={accent} size={15} strokeWidth={1.5} />
                  </Pressable>
                )}
                {showAiInsight && (
                  <View style={[s.aiResponseCard, { backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)', borderColor }]}>
                    {aiLoading ? (
                      <View style={s.aiLoadingRow}>
                        <RefreshCw color={accent} size={16} strokeWidth={1.8} />
                        <Text style={[s.aiLoadingText, { color: subColor }]}>{t('energyJournal.oracle_analizuje_twoj_wzorzec_energ', 'Oracle analizuje Twój wzorzec energetyczny…')}</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={[s.aiResponseText, { color: textColor }]}>{aiInsight}</Text>
                        <Pressable onPress={analyzeEnergy} style={[s.reanalyzeBtn, { borderColor: accent + '33' }]}>
                          <RefreshCw color={accent} size={13} strokeWidth={1.8} />
                          <Text style={[s.reanalyzeBtnText, { color: accent }]}>{t('energyJournal.odswiez_analize', 'Odśwież analizę')}</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                )}
              </View>
            </Animated.View>

            {/* ════════════════════════════════════════════════════════════════
                MOON PHASE CORRELATION
            ════════════════════════════════════════════════════════════════ */}
            <Animated.View entering={FadeInDown.delay(480).duration(540)}>
              <View style={[s.card, { backgroundColor: cardBg, borderColor: '#A78BFA33' }]}>
                <Text style={[s.cardEyebrow, { color: '#A78BFA' }]}>{t('energyJournal.korelacja_z_ksiezycem', '🌙 KORELACJA Z KSIĘŻYCEM')}</Text>
                <View style={s.moonRow}>
                  <Text style={s.moonEmoji}>{moonPhaseInfo.phaseEmoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, { color: textColor, fontSize: 16 }]}>{moonPhaseInfo.phaseName}</Text>
                    <Text style={[s.cardBody, { color: subColor, marginTop: 4 }]}>{moonPhaseInfo.tip}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* ════════════════════════════════════════════════════════════════
                PERSONALIZED ENERGY MODE
            ════════════════════════════════════════════════════════════════ */}
            <Animated.View entering={FadeInDown.delay(500).duration(540)}>
              <View style={[s.card, { backgroundColor: personalizedTip.color + '10', borderColor: personalizedTip.color + '30', overflow: 'hidden' }]}>
                <LinearGradient colors={[personalizedTip.color + '1E', 'transparent']} style={StyleSheet.absoluteFill} />
                <Text style={[s.cardEyebrow, { color: personalizedTip.color }]}>{t('energyJournal.tryb_energetycz', '✨ TRYB ENERGETYCZNY')}</Text>
                <Text style={[s.panelValue, { color: personalizedTip.color }]}>{personalizedTip.level}</Text>
                <Text style={[s.cardBody, { color: textColor }]}>{personalizedTip.desc}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: personalizedTip.color }} />
                  <Text style={[s.chartSummary, { color: subColor }]}>Średnia energia {period} dni: {averageEnergy}%</Text>
                </View>
              </View>
            </Animated.View>

            {/* ════════════════════════════════════════════════════════════════
                9. ENERGY HISTORY
            ════════════════════════════════════════════════════════════════ */}
            <Animated.View entering={FadeInDown.delay(540).duration(540)}>
              <View style={[s.card, { backgroundColor: cardBg, borderColor }]}>
                <Pressable onPress={() => setShowHistory(h => !h)} style={s.historyHeader}>
                  <View>
                    <Text style={[s.cardEyebrow, { color: accent }]}>{t('energyJournal.historia_energii', '📋 HISTORIA ENERGII')}</Text>
                    <Text style={[s.cardTitle, { color: textColor }]}>{t('energyJournal.ostatnie_14_dni', 'Ostatnie 14 dni')}</Text>
                  </View>
                  {showHistory
                    ? <ChevronUp   color={subColor} size={18} strokeWidth={1.5} />
                    : <ChevronDown color={subColor} size={18} strokeWidth={1.5} />}
                </Pressable>
                {showHistory && (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    {historyEntries.length === 0 ? (
                      <Text style={[s.cardBody, { color: subColor }]}>{t('energyJournal.zaloguj_kilka_wpisow_zeby_zobaczyc', 'Zaloguj kilka wpisów, żeby zobaczyć historię.')}</Text>
                    ) : historyEntries.map(entry => {
                      const lvl      = entry.progress.energyLevel ?? 0;
                      const col      = getEnergyColor(lvl || 50);
                      const moodMeta = MOOD_OPTIONS.find(m => m.id === entry.progress.mood);
                      const note     = entry.dayEntries[0]?.content?.slice(0, 60) || '';
                      return (
                        <View key={entry.date} style={[s.historyRow, { backgroundColor: col + '0E', borderColor: col + '25' }]}>
                          <View style={[s.historyOrb, { backgroundColor: col + '30', borderColor: col }]}>
                            <Text style={[s.historyOrbText, { color: col }]}>{lvl > 0 ? `${lvl}%` : '—'}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[s.historyDate, { color: textColor }]}>
                              {(() => { const _d = new Date(entry.date); const DN = ['Nd','Pn','Wt','Śr','Cz','Pt','Sb']; return `${DN[_d.getDay()]} ${String(_d.getDate()).padStart(2,'0')}.${String(_d.getMonth()+1).padStart(2,'0')}`; })()}
                            </Text>
                            {moodMeta && (
                              <Text style={[s.historyMood, { color: moodMeta.color }]}>{moodMeta.label}</Text>
                            )}
                            {note ? (
                              <Text style={[s.historyNote, { color: subColor }]} numberOfLines={1}>{note}…</Text>
                            ) : null}
                          </View>
                          <View style={[s.historyBar, { backgroundColor: isLight ? 'rgba(255,246,230,0.95)' : 'rgba(255,255,255,0.08)' }]}>
                            <View style={[s.historyBarFill, { height: `${lvl}%`, backgroundColor: col }]} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </Animated.View>

            {/* ════════════════════════════════════════════════════════════════
                CO DALEJ — navigation links
            ════════════════════════════════════════════════════════════════ */}
            <Animated.View entering={FadeInDown.delay(580).duration(560)}>
              <Text style={[s.cardEyebrow, { color: accent, marginBottom: 8, marginTop: 4 }]}>{t('energyJournal.co_dalej', '✦ CO DALEJ?')}</Text>
              {([
                { icon: Wind,       label: 'Oddech i reset',        sub: 'Techniki dla energii i uważności',      color: '#60A5FA', route: 'Breathwork',   params: undefined },
                { icon: Headphones, label: 'Kąpiel dźwiękowa',      sub: 'Dźwięk regeneruje pole energetyczne',   color: '#A78BFA', route: 'SoundBath',    params: undefined },
                { icon: BookOpen,   label: 'Nowy wpis w dzienniku', sub: 'Pogłęb refleksję o swoim rytmie',       color: accent,    route: 'JournalEntry', params: { type: 'energy', prompt: 'Co chcę wzmocnić w swoim polu energetycznym?' } },
                { icon: Globe2,     label: 'Medytacja',             sub: 'Wejdź w głębię ciszy i przestrzeni',    color: '#FBBF24', route: 'Meditation',   params: undefined },
              ] as const).map((item, i) => {
                const Icon = item.icon;
                return (
                  <Pressable
                    key={i}
                    onPress={() => navigation.navigate(item.route as any, item.params)}
                    style={[s.nextLinkCard, { backgroundColor: cardBg, borderColor: item.color + '33' }]}
                  >
                    <View style={[s.nextLinkIcon, { backgroundColor: item.color + '18' }]}>
                      <Icon color={item.color} size={18} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.nextLinkTitle, { color: textColor }]}>{item.label}</Text>
                      <Text style={[s.nextLinkSub, { color: subColor }]}>{item.sub}</Text>
                    </View>
                    <ArrowRight color={item.color} size={16} strokeWidth={1.5} />
                  </Pressable>
                );
              })}
            </Animated.View>

            <EndOfContentSpacer size="standard" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// ── StyleSheet ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:          { flex: 1 },
  safeArea:           { flex: 1 },
  header:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingTop: 8, paddingBottom: 10 },
  backBtn:            { width: 40 },
  starBtn:            { width: 40, alignItems: 'flex-end' },
  headerCenter:       { flex: 1, alignItems: 'center' },
  eyebrow:            { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  title:              { fontSize: 18, fontWeight: '600' },
  scroll:             { paddingHorizontal: 22, paddingTop: 6, gap: 14 },

  // cards
  card:               { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden' },
  orbSubline:         { fontSize: 12, textAlign: 'center', marginTop: 2, marginBottom: 4 },
  cardEyebrow:        { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 8 },
  cardTitle:          { fontSize: 18, lineHeight: 25, fontWeight: '600' },
  cardBody:           { fontSize: 14, lineHeight: 22, marginTop: 8 },
  microLabel:         { fontSize: 10, fontWeight: '700', letterSpacing: 1.6, marginTop: 18, marginBottom: 10 },
  panelValue:         { fontSize: 22, lineHeight: 28, fontWeight: '700', marginTop: 6, marginBottom: 8 },

  // hero stat rail
  heroStats:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  heroStatCard:       { width: '48%', borderRadius: 16, borderWidth: 1, padding: 12, gap: 5 },
  heroStatValue:      { fontSize: 18, fontWeight: '800' },
  heroStatLabel:      { fontSize: 11 },

  // check-in scale
  scaleRow:           { flexDirection: 'row', gap: 4, marginTop: 14 },
  scaleSegment:       { flex: 1, height: 42, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  scaleNum:           { fontSize: 12, fontWeight: '700' },
  scaleHintRow:       { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  scaleHint:          { fontSize: 10 },

  // mood
  moodGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodChip:           { width: '48%', borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  moodDot:            { width: 10, height: 10, borderRadius: 5 },
  moodChipTitle:      { fontSize: 13, fontWeight: '700' },

  // dimensions
  dimRow:             { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  dimLabel:           { width: 102, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dimName:            { fontSize: 12, fontWeight: '600' },
  dimDots:            { flex: 1, flexDirection: 'row', gap: 6 },
  dimDot:             { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },
  dimVal:             { fontSize: 11, fontWeight: '700', width: 28, textAlign: 'right' },

  // journal
  journalInput:       { borderWidth: 1, borderRadius: 16, padding: 14, minHeight: 100, fontSize: 14, lineHeight: 22, marginTop: 12 },
  saveBtn:            { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginTop: 12 },
  saveBtnText:        { fontSize: 14, fontWeight: '700' },

  // chart
  chartHeading:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  deltaPill:          { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  deltaText:          { fontSize: 12, fontWeight: '700' },
  chartSummaryRow:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  chartSummary:       { fontSize: 12 },
  periodRow:          { flexDirection: 'row', gap: 10 },
  periodButton:       { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  periodButtonText:   { fontSize: 12, fontWeight: '700' },

  // influencers
  influencerRow:      { marginBottom: 12 },
  influencerLabel:    { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  influencerOptions:  { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  influencerChip:     { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 },
  influencerChipText: { fontSize: 12 },

  // chakra
  chakraHero:         { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 12 },
  chakraCircle:       { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  chakraSymbol:       { fontSize: 17, fontWeight: '600' },
  chakraHeroName:     { fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  practiceBanner:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 14 },
  practiceText:       { flex: 1, fontSize: 13, lineHeight: 20 },
  chakraBarRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  chakraName:         { fontSize: 11, fontWeight: '700', width: 86, letterSpacing: 0.2 },
  chakraBarBg:        { flex: 1, height: 7, borderRadius: 4, backgroundColor: 'rgba(128,128,128,0.12)', overflow: 'hidden' },
  chakraBarFill:      { height: 7, borderRadius: 4 },
  chakraPct:          { fontSize: 11, fontWeight: '700', width: 36, textAlign: 'right' },

  // AI
  aiBtn:              { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, marginTop: 14 },
  aiBtnText:          { flex: 1, fontSize: 15, fontWeight: '700' },
  aiResponseCard:     { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 14 },
  aiLoadingRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiLoadingText:      { fontSize: 13, lineHeight: 20 },
  aiResponseText:     { fontSize: 15, lineHeight: 26 },
  reanalyzeBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, marginTop: 12, paddingTop: 10 },
  reanalyzeBtnText:   { fontSize: 12, fontWeight: '700' },

  // moon
  moonRow:            { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginTop: 8 },
  moonEmoji:          { fontSize: 34 },

  // history
  historyHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  historyRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 12 },
  historyOrb:         { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  historyOrbText:     { fontSize: 12, fontWeight: '800' },
  historyDate:        { fontSize: 13, fontWeight: '600' },
  historyMood:        { fontSize: 11, fontWeight: '700', marginTop: 2 },
  historyNote:        { fontSize: 11, marginTop: 3, lineHeight: 16 },
  historyBar:         { width: 6, height: 52, borderRadius: 3, overflow: 'hidden', justifyContent: 'flex-end' },
  historyBarFill:     { width: 6, borderRadius: 3 },

  // next links
  nextLinkCard:       { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  nextLinkIcon:       { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nextLinkTitle:      { fontSize: 14, fontWeight: '700' },
  nextLinkSub:        { fontSize: 12, lineHeight: 18, marginTop: 2 },
});
