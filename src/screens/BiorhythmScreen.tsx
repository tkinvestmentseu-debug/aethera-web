// @ts-nocheck
import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions,
  ActivityIndicator, FlatList, TextInput, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Svg, { Path, Circle, Line, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import {
  ArrowRight, ChevronLeft, Heart, Brain, Moon, Star, Zap, Sparkles,
  TrendingUp, AlertTriangle, Calendar, Users, BookOpen, Wand2,
  Eye, Feather, Dumbbell, Coffee, Pencil, Music, RefreshCw,
  Shield, CheckCircle, XCircle,
} from 'lucide-react-native';
import { AiService } from '../core/services/ai.service';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { screenContracts } from '../core/theme/designSystem';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { Typography } from '../components/Typography';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#CEAE72';

// ─── Cycle definitions ───────────────────────────────────────────────────────
const CYCLES = [
  { id: 'physical',     label: 'Fizyczny',      days: 23, color: '#E8705A', Icon: Zap,     desc: 'Energia ciała, wytrzymałość i koordynacja' },
  { id: 'emotional',    label: 'Emocjonalny',   days: 28, color: '#F472B6', Icon: Heart,   desc: 'Nastrój, empatia i intuicja' },
  { id: 'intellectual', label: 'Intelektualny', days: 33, color: '#60A5FA', Icon: Brain,   desc: 'Koncentracja, pamięć i kreatywność' },
  { id: 'intuition',    label: 'Intuicja',      days: 38, color: '#34D399', Icon: Eye,     desc: 'Przeczucia, synchroniczności i wewnętrzny kompas' },
  { id: 'spiritual',    label: 'Duchowość',     days: 53, color: '#CEAE72', Icon: Feather, desc: 'Połączenie z wyższym Ja, mistyczne przepływy i transcendencja' },
];

// Base 3 cycles (classic biorhythm)
const CYCLES_BASE = CYCLES.slice(0, 3);
// All 5 cycles
const CYCLES_ALL = CYCLES;

// ─── Activity optimizer data ──────────────────────────────────────────────────
const ACTIVITY_SUGGESTIONS = [
  { id: 'sport',    label: 'Trening siłowy',        icon: Dumbbell, minCycle: 'physical',  threshold: 0.4,  rationale: 'Fizyczny powyżej 50% — idealne warunki na intensywny wysiłek i budowanie siły.' },
  { id: 'yoga',     label: 'Joga lub rozciąganie',   icon: Feather,  minCycle: 'emotional', threshold: 0.3,  rationale: 'Emocjonalny stabilny — ciało i umysł harmonijnie wchodzą w przepływ.' },
  { id: 'meditate', label: 'Medytacja głęboka',      icon: Moon,     minCycle: 'spiritual', threshold: 0.5,  rationale: 'Duchowość na szczycie — najłatwiej osiągnąć ciszę wewnętrzną i trans.' },
  { id: 'study',    label: 'Nauka i czytanie',       icon: BookOpen, minCycle: 'intellectual', threshold: 0.4, rationale: 'Intelektualny wysoki — mózg absorbuje i przetwarza informacje efektywniej.' },
  { id: 'intuition',label: 'Decyzje intuicyjne',     icon: Eye,      minCycle: 'intuition', threshold: 0.5,  rationale: 'Intuicja na szczycie — zaufaj pierwszemu przeczuciu zamiast analizować.' },
  { id: 'social',   label: 'Spotkania i rozmowy',    icon: Users,    minCycle: 'emotional', threshold: 0.5,  rationale: 'Emocjonalny wysoki — empatia i wyczucie w relacjach na najwyższym poziomie.' },
  { id: 'creative', label: 'Twórczość i sztuka',     icon: Pencil,   minCycle: 'intellectual', threshold: 0.3, rationale: 'Intelektualny powyżej średniej — kreatywność i oryginalność w rozkwicie.' },
  { id: 'music',    label: 'Muzyka lub śpiew',       icon: Music,    minCycle: 'emotional', threshold: 0.3,  rationale: 'Emocjonalny otwarty — ekspresja artystyczna trafia w głębsze warstwy.' },
  { id: 'rest',     label: 'Odpoczynek i regeneracja', icon: Coffee, minCycle: 'physical',  threshold: -0.3, rationale: 'Fizyczny poniżej średniej — ciało sygnalizuje potrzebę odnowy. Nie walcz z tym.' },
  { id: 'ritual',   label: 'Rytuał duchowy',         icon: Sparkles, minCycle: 'spiritual', threshold: 0.3,  rationale: 'Duchowość aktywna — rytuały rezonują głębiej i przynoszą trwalsze efekty.' },
];

// ─── Critical day advice ──────────────────────────────────────────────────────
const CRITICAL_CYCLE_ADVICE: Record<string, { title: string; advice: string; avoid: string }> = {
  physical:     { title: 'Fizyczny przechodzi przez zero',  advice: 'Ogranicz intensywne treningi i ekspozycję na stres fizyczny. Delikatny spacer lub rozciąganie są bezpieczniejsze niż sport wyczynowy.', avoid: 'Unikaj: operacji, szybkich podróży, ekstremalnych sportów i nadmiernego wysiłku.' },
  emotional:    { title: 'Emocjonalny przechodzi przez zero', advice: 'Unikaj ważnych rozmów emocjonalnych, konfrontacji i podejmowania decyzji relacyjnych. To moment zwiększonej wrażliwości.', avoid: 'Unikaj: kłótni, ważnych rozmów o uczuciach, podpisywania umów emocjonalnych.' },
  intellectual: { title: 'Intelektualny przechodzi przez zero', advice: 'Dzień krytyczny intelektualny to słabszy czas na egzaminy, ważne negocjacje i złożone decyzje. Daj sobie więcej czasu na przemyślenie.', avoid: 'Unikaj: egzaminów, umów biznesowych, złożonych wyborów i nowości do przyswojenia.' },
  intuition:    { title: 'Intuicja przechodzi przez zero',   advice: 'Twój wewnętrzny kompas jest chwilowo mniej pewny. Nie działaj tylko na przeczucia — sprawdzaj je z rozumem.', avoid: 'Unikaj: decyzji opartych wyłącznie na przeczuciu, wróżb w ważnych sprawach.' },
  spiritual:    { title: 'Duchowość przechodzi przez zero',  advice: 'Chwila neutralności duchowej — doskonała na gruntowanie się w codzienności zamiast głębokiej pracy mistycznej.', avoid: 'Unikaj: intensywnych rytuałów inicjacyjnych i pracy z cieniami w tym dniu.' },
};

const DAYS_LABELS = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];
const MONTH_LABELS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

// ─── Bio math ─────────────────────────────────────────────────────────────────
const getBioValue = (birthDate: string, cycleDays: number, offsetDays = 0): number => {
  const birth = new Date(birthDate);
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  const diffMs = target.getTime() - birth.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.sin((2 * Math.PI * diffDays) / cycleDays);
};

const getPhaseLabel = (val: number) => {
  if (val >  0.7) return { label: 'Szczyt',    color: '#34D399' };
  if (val >  0.3) return { label: 'Wysoki',    color: '#CEAE72' };
  if (val > -0.3) return { label: 'Neutralny', color: '#60A5FA' };
  if (val > -0.7) return { label: 'Niski',     color: '#F97316' };
  return              { label: 'Minimum',  color: '#E8705A' };
};

// Check if a cycle crosses zero between day offset and offset+1
const crossesZero = (birthDate: string, cycleDays: number, offset: number): boolean => {
  const v0 = getBioValue(birthDate, cycleDays, offset);
  const v1 = getBioValue(birthDate, cycleDays, offset + 1);
  return (v0 >= 0 && v1 < 0) || (v0 < 0 && v1 >= 0);
};

const formatDateLabel = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
};

// ─── Combined arc chart ───────────────────────────────────────────────────────
const CombinedArcChart = ({ birthDate, isLight }: { birthDate: string; isLight: boolean }) => {
  const W = SW - 44;
  const H = 120;
  const days = 14;
  const totalPoints = days * 2 + 1;

  const combined = Array.from({ length: totalPoints }, (_, i) => {
    const offset = i - days;
    const vals = CYCLES.map(c => getBioValue(birthDate, c.days, offset));
    return vals.reduce((s, v) => s + v, 0) / 3;
  });

  const pathD = combined
    .map((val, i) => {
      const x = (i / (totalPoints - 1)) * (W - 24) + 12;
      const y = H * 0.5 - val * H * 0.42;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const fillPath = pathD + ` L${(W - 12).toFixed(1)},${H} L12,${H} Z`;
  const centerX = (W - 24) * 0.5 + 12;
  const todayVal = combined[days];
  const todayY = H * 0.5 - todayVal * H * 0.42;

  return (
    <Svg width={W} height={H + 16}>
      <Defs>
        <SvgGradient id="arcFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={ACCENT} stopOpacity={0.22} />
          <Stop offset="100%" stopColor={ACCENT} stopOpacity={0.01} />
        </SvgGradient>
      </Defs>
      <Line x1={12} y1={H * 0.5} x2={W - 12} y2={H * 0.5}
        stroke={isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}
        strokeWidth={1} strokeDasharray="4 6" />
      <Path d={fillPath} fill="url(#arcFill)" />
      <Path d={pathD} stroke={ACCENT} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={centerX} y1={0} x2={centerX} y2={H}
        stroke={ACCENT} strokeWidth={1.2} opacity={0.5} strokeDasharray="3 5" />
      <Circle cx={centerX} cy={todayY} r={7} fill={ACCENT} opacity={0.95} />
      <Circle cx={centerX} cy={todayY} r={13} fill={ACCENT} opacity={0.15} />
    </Svg>
  );
};

// ─── Cycle mini chart ─────────────────────────────────────────────────────────
const BioChart = ({
  birthDate, cycle, color, width, isLight,
}: {
  birthDate: string; cycle: typeof CYCLES[0]; color: string; width: number; isLight: boolean;
}) => {
  const h    = 80;
  const days = 14;
  const points = Array.from({ length: days * 2 + 1 }, (_, i) => {
    const offset = i - days;
    const val = getBioValue(birthDate, cycle.days, offset);
    return {
      x: (i / (days * 2)) * width,
      y: h / 2 - val * h * 0.44,
    };
  });
  const pathD   = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const centerX = (days / (days * 2)) * width;

  return (
    <Svg width={width} height={h + 20}>
      <Line x1={0} y1={h / 2} x2={width} y2={h / 2}
        stroke={isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'} strokeWidth={1} strokeDasharray="4 6" />
      <Line x1={centerX} y1={0} x2={centerX} y2={h}
        stroke={color} strokeWidth={1.5} opacity={0.6} strokeDasharray="3 4" />
      <Path d={pathD} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {points.filter((_, i) => i % 4 === 0).map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} opacity={0.7} />
      ))}
      <Circle cx={centerX} cy={points[days].y} r={6} fill={color} opacity={0.95} />
    </Svg>
  );
};

// ─── Loading dots ─────────────────────────────────────────────────────────────
const LoadingDots = ({ color }: { color: string }) => {
  const { t } = useTranslation();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 }}>
      <ActivityIndicator size="small" color={color} />
      <Text style={{ fontSize: 13, color, fontStyle: 'italic' }}>{t('biorhythm.analizuje_twoje_cykle', 'Analizuję Twoje cykle...')}</Text>
    </View>
  );
};

// ─── Forecast day mini bar ────────────────────────────────────────────────────
const ForecastDayItem = ({
  day, isToday, isTomorrow, isLight, textColor, subColor,
}: {
  day: any; isToday: boolean; isTomorrow: boolean; isLight: boolean; textColor: string; subColor: string;
}) => {
  const dayBarColor =
    day.avg > 0.7 ? '#34D399' :
    day.avg < -0.3 ? '#E8705A' :
    ACCENT;

  return (
    <View style={[
      bs.fcDayItem,
      isToday && { borderColor: ACCENT + '66', backgroundColor: ACCENT + '12' },
      day.isCritical && { borderColor: '#E8705A44' },
    ]}>
      <Text style={[bs.fcDayLabel, { color: isToday ? ACCENT : subColor, fontWeight: isToday || isTomorrow ? '700' : '400' }]}>
        {isToday ? 'Dziś' : isTomorrow ? 'Jutro' : day.dayLabel}
      </Text>
      <Text style={[bs.fcDate, { color: subColor }]}>{day.dateLabel}</Text>
      {/* Per-cycle mini bars */}
      <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 40, marginVertical: 6 }}>
        {CYCLES.map((c, ci) => {
          const cVal = day.cycleValues[ci];
          const barH = Math.max(4, Math.round(((cVal + 1) / 2) * 36));
          return (
            <View key={c.id} style={{ width: 7, height: 40, justifyContent: 'flex-end' }}>
              <View style={{ width: 7, height: barH, borderRadius: 3, backgroundColor: c.color + (isToday ? 'DD' : '88') }} />
            </View>
          );
        })}
      </View>
      <Text style={[bs.fcAvgPct, { color: isToday ? textColor : subColor, fontWeight: isToday ? '700' : '500' }]}>
        {Math.round(day.avg * 50 + 50)}%
      </Text>
      {day.isCritical && (
        <View style={{ marginTop: 2 }}>
          <AlertTriangle color="#E8705A" size={11} strokeWidth={2} />
        </View>
      )}
    </View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────
export const BiorhythmScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { isLight } = useTheme();
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor  = isLight ? '#6A5A48' : '#9A8E80';
  const cardBg    = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';
  const chartW    = SW - 88;
  const birthDate = userData.birthDate || '1995-01-01';

  // ── Today values ────────────────────────────────────────────────────────────
  const todayValues = useMemo(
    () => CYCLES.map(c => ({ ...c, value: getBioValue(birthDate, c.days) })),
    [birthDate],
  );

  const avgToday = useMemo(
    () => Math.round((todayValues.reduce((s, c) => s + c.value, 0) / todayValues.length) * 50 + 50),
    [todayValues],
  );

  const overallPhase = getPhaseLabel(todayValues.reduce((s, c) => s + c.value, 0) / todayValues.length);

  // ── 14-day forecast ─────────────────────────────────────────────────────────
  const forecast14 = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => {
      const cycleValues = CYCLES.map(c => getBioValue(birthDate, c.days, i));
      const avg = cycleValues.reduce((s, v) => s + v, 0) / 3;
      const today = new Date();
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayLabel = DAYS_LABELS[d.getDay()];
      const isCritical = CYCLES.some(c => crossesZero(birthDate, c.days, i));
      return {
        avg,
        cycleValues,
        dayLabel,
        dateLabel: formatDateLabel(i),
        isCritical,
        offset: i,
      };
    }),
    [birthDate],
  );

  // ── Critical days ───────────────────────────────────────────────────────────
  const criticalDays = useMemo(() =>
    forecast14
      .filter(d => d.isCritical)
      .map(d => {
        const crossingCycles = CYCLES
          .filter(c => crossesZero(birthDate, c.days, d.offset))
          .map(c => c.label);
        return { ...d, crossingCycles };
      }),
    [forecast14, birthDate],
  );

  // ── Best days ───────────────────────────────────────────────────────────────
  const bestDays = useMemo(() => {
    return forecast14
      .map(d => ({
        ...d,
        allAbove: d.cycleValues.every(v => v > 0.5),
        minVal: Math.min(...d.cycleValues),
      }))
      .filter(d => d.minVal > 0.5)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3);
  }, [forecast14]);

  // ── AI insight ──────────────────────────────────────────────────────────────
  const [aiInsight, setAiInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  const fetchAiInsight = useCallback(async () => {
    if (loadingInsight || aiInsight) return;
    HapticsService.impact('light');
    setLoadingInsight(true);
    try {
      const physical     = Math.round(todayValues[0].value * 50 + 50);
      const emotional    = Math.round(todayValues[1].value * 50 + 50);
      const intellectual = Math.round(todayValues[2].value * 50 + 50);
      const combined     = Math.round((todayValues.reduce((s, c) => s + c.value, 0) / 3) * 50 + 50);
      const isEnglish = i18n.language?.startsWith('en');
      const name = userData.name ? (isEnglish ? `User name: ${userData.name}. ` : `Imię użytkownika: ${userData.name}. `) : '';
      const sign = userData.zodiacSign ? (isEnglish ? `Zodiac sign: ${userData.zodiacSign}. ` : `Znak zodiaku: ${userData.zodiacSign}. `) : '';
      const critWarning = criticalDays.length > 0
        ? (isEnglish ? `Within the next ${criticalDays.length} critical days: ${criticalDays.slice(0, 2).map(d => d.dateLabel).join(', ')}. ` : `W ciągu najbliższych ${criticalDays.length} dni krytycznych: ${criticalDays.slice(0, 2).map(d => d.dateLabel).join(', ')}. `)
        : '';
      const prompt = isEnglish ? `You are a spiritual biorhythm guide. ${name}${sign}
Biorhythm today: Physical ${physical}%, Emotional ${emotional}%, Intellectual ${intellectual}%, Overall ${combined}%.
${critWarning}
Write exactly 3 sentences of personalized guidance for today. Be specific, warm and inspiring. Refer to the actual cycle values. No headings, only continuous text.` : `Jesteś duchowym doradcą biorytmicznym. ${name}${sign}
Biorytm dzisiaj: Fizyczny ${physical}%, Emocjonalny ${emotional}%, Intelektualny ${intellectual}%, Ogólny ${combined}%.
${critWarning}
Napisz w języku użytkownika dokładnie 3 zdania spersonalizowanej wskazówki na dziś. Bądź konkretna, ciepła i inspirująca. Odwołaj się do konkretnych wartości cykli. Nie używaj nagłówków — tylko ciągły tekst.`;
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }], isEnglish ? 'en' : 'pl');
      setAiInsight(result);
    } catch {
      setAiInsight(i18n.language?.startsWith('en') ? 'A quiet pause before insight. Your cycles are already speaking — try again in a moment.' : 'Chwila ciszy przed wglądem. Twoje cykle przemawiają — spróbuj ponownie za chwilę.');
    } finally {
      setLoadingInsight(false);
    }
  }, [loadingInsight, aiInsight, todayValues, userData, criticalDays]);

  // ── Star / favorite ─────────────────────────────────────────────────────────
  const isFav = isFavoriteItem('biorhythm');
  const handleStar = useCallback(() => {
    HapticsService.impact('light');
    if (isFavoriteItem('biorhythm')) {
      removeFavoriteItem('biorhythm');
    } else {
      addFavoriteItem({
        id: 'biorhythm',
        label: 'Biorytm',
        sublabel: 'Twoje cykle życiowe',
        route: 'Biorhythm',
        icon: 'TrendingUp',
        color: ACCENT,
        addedAt: new Date().toISOString(),
      });
    }
  }, [addFavoriteItem, removeFavoriteItem, isFavoriteItem]);

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!userData.birthDate) {
    return (
      <View style={{ flex: 1, backgroundColor: isLight ? '#FAF6EE' : '#06050F', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Typography variant="editorialHeader" style={{ color: ACCENT, textAlign: 'center' }}>{t('biorhythm.potrzebna_data_urodzenia', 'Potrzebna data urodzenia')}</Typography>
        <Typography variant="bodyRefined" style={{ color: subColor, textAlign: 'center', marginTop: 10, marginBottom: 24 }}>
          {t('biorhythm.biorytm_oblicza_twoje_cykle_na', 'Biorytm oblicza Twoje cykle na podstawie daty urodzenia.')}
        </Typography>
        <Pressable onPress={() => navigation.navigate('Profile')} style={[bs.emptyBtn, { backgroundColor: ACCENT }]}>
          <Text style={{ color: '#FFF', fontWeight: '700' }}>{t('biorhythm.przejdz_do_profilu', 'Przejdź do Profilu')}</Text>
        </Pressable>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={[bs.container, { backgroundColor: isLight ? '#FAF6EE' : '#06050F' }]}>
      <LinearGradient
        colors={isLight ? ['#FAF6EE', '#F0E8D8'] : ['#06050F', '#0A0818']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top']} style={bs.safeArea}>
        {/* ── Header ── */}
        <View style={bs.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={bs.backBtn} hitSlop={14}>
            <ChevronLeft color={ACCENT} size={28} strokeWidth={1.5} />
          </Pressable>
          <View style={bs.headerCenter}>
            <Typography variant="premiumLabel" color={ACCENT}>{t('biorhythm.biorytm', 'Biorytm')}</Typography>
            <Typography variant="screenTitle" style={{ color: textColor, marginTop: 2 }}>{t('biorhythm.twoje_cykle_zyciowe', 'Twoje cykle życiowe')}</Typography>
          </View>
          <Pressable onPress={handleStar} style={bs.starBtn} hitSlop={12}>
            <Star color={ACCENT} size={22} strokeWidth={1.6} fill={isFav ? ACCENT : 'none'} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[bs.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Combined arc hero ─────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500)}>
            <View style={[bs.heroCard, { borderColor: ACCENT + '66', shadowColor: ACCENT, shadowOpacity: 0.32, shadowRadius: 18, elevation: 8 }]}>
              <LinearGradient colors={[ACCENT + '24', 'transparent', ACCENT + '08'] as const} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={['transparent', ACCENT + 'AA', 'transparent'] as [string,string,string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 }} pointerEvents="none" />
              <View style={{ position: 'absolute', top: 10, right: 16, width: 8, height: 8, borderTopWidth: 1.8, borderRightWidth: 1.8, borderColor: ACCENT + '88' }} pointerEvents="none" />

              <View style={bs.heroTopRow}>
                <View>
                  <Typography variant="premiumLabel" color={ACCENT}>{t('biorhythm.cykl_laczony', 'CYKL ŁĄCZONY')}</Typography>
                  <Text style={[bs.heroScore, { color: ACCENT }]}>{avgToday}%</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <View style={[bs.heroPhaseBadge, { backgroundColor: overallPhase.color + '22', borderColor: overallPhase.color + '44' }]}>
                      <Text style={[bs.heroPhaseText, { color: overallPhase.color }]}>{overallPhase.label}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  {todayValues.map((cv, i) => (
                    <View key={cv.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 10, color: subColor }}>{cv.label.slice(0, 3).toUpperCase()}</Text>
                      <View style={{ width: 52, height: 5, borderRadius: 3, backgroundColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
                        <View style={{ width: `${Math.round(cv.value * 50 + 50)}%`, height: 5, backgroundColor: cv.color, borderRadius: 3 }} />
                      </View>
                      <Text style={{ fontSize: 10, color: cv.color, fontWeight: '700', width: 30 }}>{Math.round(cv.value * 50 + 50)}%</Text>
                    </View>
                  ))}
                </View>
              </View>

              <Text style={[bs.heroDesc, { color: subColor, marginBottom: 4 }]}>
                {avgToday >= 70
                  ? 'Doskonały dzień na intensywną pracę, ważne decyzje i nowe wyzwania.'
                  : avgToday >= 50
                    ? 'Stabilny dzień. Zrównoważone podejście da najlepsze efekty.'
                    : 'Dzień na regenerację, introspekcję i łagodne praktyki.'}
              </Text>

              {/* Combined arc chart */}
              <View style={{ marginHorizontal: -4, marginTop: 4 }}>
                <CombinedArcChart birthDate={birthDate} isLight={isLight} />
              </View>
              <Text style={[bs.chartLegend, { color: subColor }]}>{t('biorhythm.14_dni_temu_dzis_14', '← 14 dni temu · Dziś · +14 dni →')}</Text>
            </View>
          </Animated.View>

          {/* ── 14-day forecast horizontal scroll ────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).duration(450)}>
            <View style={[bs.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={bs.sectionHeaderRow}>
                <Calendar color={ACCENT} size={14} strokeWidth={1.8} />
                <Text style={[bs.eyebrow, { color: ACCENT }]}>{t('biorhythm.prognoza_14_dni', 'PROGNOZA 14 DNI')}</Text>
              </View>
              <Text style={[bs.sectionSub, { color: subColor }]}>
                {t('biorhythm.przesun_aby_zobaczyc_nadchodzac_dni', 'Przesuń, aby zobaczyć nadchodzące dni. Słupki: Fizyczny · Emocjonalny · Intelektualny')}
              </Text>
              <FlatList
                data={forecast14}
                keyExtractor={(_, i) => String(i)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                renderItem={({ item, index }) => (
                  <ForecastDayItem
                    day={item}
                    isToday={index === 0}
                    isTomorrow={index === 1}
                    isLight={isLight}
                    textColor={textColor}
                    subColor={subColor}
                  />
                )}
              />
              {/* Legend */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                {CYCLES.map(c => (
                  <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: c.color }} />
                    <Text style={{ fontSize: 10, color: subColor }}>{c.label}</Text>
                  </View>
                ))}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle color="#E8705A" size={9} strokeWidth={2} />
                  <Text style={{ fontSize: 10, color: subColor }}>{t('biorhythm.dzien_krytyczny', 'Dzień krytyczny')}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── Critical days ─────────────────────────────────────────────── */}
          {criticalDays.length > 0 && (
            <Animated.View entering={FadeInDown.delay(140).duration(450)}>
              <View style={[bs.sectionCard, { backgroundColor: '#E8705A0C', borderColor: '#E8705A33' }]}>
                <View style={bs.sectionHeaderRow}>
                  <AlertTriangle color="#E8705A" size={14} strokeWidth={2} />
                  <Text style={[bs.eyebrow, { color: '#E8705A' }]}>{t('biorhythm.dni_krytyczne_14_dni', 'DNI KRYTYCZNE (14 DNI)')}</Text>
                </View>
                <Text style={[bs.sectionSub, { color: subColor, marginBottom: 10 }]}>
                  {t('biorhythm.kiedy_cykl_przechodzi_przez_zero', 'Kiedy cykl przechodzi przez zero — moment wrażliwości i przejścia. Zachowaj ostrożność.')}
                </Text>
                {criticalDays.map((cd, i) => (
                  <View key={i} style={[bs.criticalRow, { borderColor: '#E8705A22', backgroundColor: isLight ? 'rgba(232,112,90,0.05)' : 'rgba(232,112,90,0.08)' }]}>
                    <View style={[bs.critDot, { backgroundColor: '#E8705A' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>
                        {cd.offset === 0 ? 'Dziś' : cd.offset === 1 ? 'Jutro' : cd.dateLabel}
                        {cd.offset > 0 ? ` (za ${cd.offset} ${cd.offset === 1 ? 'dzień' : 'dni'})` : ''}
                      </Text>
                      <Text style={{ fontSize: 11, color: subColor, marginTop: 2 }}>
                        Przejście przez zero: {cd.crossingCycles.join(', ')}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 10, color: '#E8705A', fontWeight: '600' }}>
                        {cd.dayLabel}
                      </Text>
                    </View>
                  </View>
                ))}
                <View style={[bs.critAdviceBox, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)', borderColor: '#E8705A22' }]}>
                  <Text style={{ fontSize: 12, color: subColor, lineHeight: 18 }}>
                    {t('biorhythm.w_dniach_krytycznyc_unikaj_waznych', '💡 W dniach krytycznych unikaj ważnych decyzji, operacji i intensywnego wysiłku. To czas na obserwację i introspekcję.')}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Best days picker ──────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).duration(450)}>
            <View style={[bs.sectionCard, { backgroundColor: '#34D3990C', borderColor: '#34D39933' }]}>
              <View style={bs.sectionHeaderRow}>
                <TrendingUp color="#34D399" size={14} strokeWidth={1.8} />
                <Text style={[bs.eyebrow, { color: '#34D399' }]}>{t('biorhythm.najlepsze_dni_na_decyzje', 'NAJLEPSZE DNI NA DECYZJE')}</Text>
              </View>
              <Text style={[bs.sectionSub, { color: subColor, marginBottom: 10 }]}>
                {t('biorhythm.kiedy_wszystkie_3_cykle_sa', 'Kiedy WSZYSTKIE 3 cykle są powyżej 50% — idealne okna na ważne decyzje, rozmowy i działania.')}
              </Text>
              {bestDays.length === 0 ? (
                <View style={[bs.noBestDays, { borderColor: cardBorder }]}>
                  <Text style={{ fontSize: 13, color: subColor, textAlign: 'center', lineHeight: 20 }}>
                    Brak takiego okna w najbliższych 14 dniach.{'\n'}Zaplanuj ważne sprawy na kolejny cykl.
                  </Text>
                </View>
              ) : (
                bestDays.map((bd, i) => {
                  const rank = ['🥇', '🥈', '🥉'][i] || '✦';
                  return (
                    <View key={i} style={[bs.bestDayRow, { borderColor: '#34D39922', backgroundColor: isLight ? 'rgba(52,211,153,0.06)' : 'rgba(52,211,153,0.09)' }]}>
                      <Text style={{ fontSize: 20 }}>{rank}</Text>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
                          {bd.offset === 0 ? 'Dziś' : bd.offset === 1 ? 'Jutro' : bd.dateLabel}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                          {bd.cycleValues.map((v, ci) => (
                            <Text key={ci} style={{ fontSize: 10, color: CYCLES[ci].color, fontWeight: '600' }}>
                              {CYCLES[ci].label.slice(0, 3)} {Math.round(v * 50 + 50)}%
                            </Text>
                          ))}
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#34D399' }}>
                          {Math.round(bd.avg * 50 + 50)}%
                        </Text>
                        <Text style={{ fontSize: 10, color: subColor }}>{bd.dayLabel}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </Animated.View>

          {/* ── Individual cycle cards ────────────────────────────────────── */}
          {CYCLES.map((cycle, idx) => {
            const val   = todayValues[idx].value;
            const pct   = Math.round(val * 50 + 50);
            const phase = getPhaseLabel(val);
            const Icon  = cycle.Icon;
            return (
              <Animated.View key={cycle.id} entering={FadeInDown.delay(260 + idx * 80).duration(450)}>
                <View style={[bs.cycleCard, { borderColor: cycle.color + '55', shadowColor: cycle.color, shadowOpacity: 0.24, shadowRadius: 14, elevation: 6 }]}>
                  <LinearGradient colors={[cycle.color + '20', 'transparent'] as const} style={StyleSheet.absoluteFill} />
                  <LinearGradient colors={['transparent', cycle.color + '88', 'transparent'] as [string,string,string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1 }} pointerEvents="none" />
                  <View style={{ position: 'absolute', top: 9, right: 14, width: 6, height: 6, borderTopWidth: 1.4, borderRightWidth: 1.4, borderColor: cycle.color + '88' }} pointerEvents="none" />
                  <View style={bs.cycleHeader}>
                    <View style={[bs.cycleIconWrap, { backgroundColor: cycle.color + '18', borderColor: cycle.color + '44' }]}>
                      <Icon color={cycle.color} size={20} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[bs.cycleLabel, { color: cycle.color }]}>{cycle.label.toUpperCase()}</Text>
                      <Text style={[bs.cycleName,  { color: textColor   }]}>{cycle.label}</Text>
                      <Text style={[bs.cycleDesc,  { color: subColor    }]}>{cycle.desc}</Text>
                    </View>
                    <View style={bs.cycleRight}>
                      <Text style={[bs.cyclePct, { color: cycle.color }]}>{pct}%</Text>
                      <View style={[bs.cyclePhase, { backgroundColor: phase.color + '22', borderColor: phase.color + '44' }]}>
                        <Text style={[bs.cyclePhaseText, { color: phase.color }]}>{phase.label}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[bs.progressTrack, { backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.1)' }]}>
                    <View style={[bs.progressFill, { width: pct + '%', backgroundColor: cycle.color }]} />
                  </View>
                  <Text style={[bs.cyclePeriod, { color: subColor }]}>Cykl: {cycle.days} dni · Kolejny szczyt za ~{Math.round(cycle.days / 4)} dni</Text>
                  <BioChart birthDate={birthDate} cycle={cycle} color={cycle.color} width={chartW} isLight={isLight} />
                  <Text style={[bs.chartLegend, { color: subColor }]}>{t('biorhythm.14_dni_temu_dzis_14_1', '← 14 dni temu · Dziś · +14 dni →')}</Text>
                </View>
              </Animated.View>
            );
          })}

          {/* ── AI interpretacja ─────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <View style={[bs.aiCard, { backgroundColor: ACCENT + '0E', borderColor: ACCENT + '22' }]}>
              <View style={bs.sectionHeaderRow}>
                <Sparkles color={ACCENT} size={14} strokeWidth={1.8} />
                <Text style={[bs.eyebrow, { color: ACCENT }]}>{t('biorhythm.interpreta_ai', 'INTERPRETACJA AI')}</Text>
              </View>
              {!aiInsight && !loadingInsight && (
                <>
                  <Text style={{ fontSize: 12, color: subColor, marginBottom: 10, lineHeight: 18 }}>
                    {t('biorhythm.pobierz_spersonali_wskazowke_oparta', 'Pobierz spersonalizowaną wskazówkę opartą na Twoich wartościach biorytmicznych na dziś.')}
                  </Text>
                  <Pressable
                    onPress={fetchAiInsight}
                    style={[bs.aiBtn, { borderColor: ACCENT + '55', backgroundColor: ACCENT + '18' }]}
                  >
                    <Sparkles color={ACCENT} size={15} strokeWidth={1.8} />
                    <Text style={[bs.aiBtnText, { color: ACCENT }]}>{t('biorhythm.pobierz_wglad_na_dzis', 'Pobierz wgląd na dziś')}</Text>
                  </Pressable>
                </>
              )}
              {loadingInsight && <LoadingDots color={ACCENT} />}
              {!!aiInsight && (
                <>
                  <Text style={[bs.aiText, { color: textColor }]}>{aiInsight}</Text>
                  <Pressable
                    onPress={() => setAiInsight('')}
                    style={{ marginTop: 10, alignSelf: 'flex-start' }}
                  >
                    <Text style={{ fontSize: 11, color: subColor, textDecorationLine: 'underline' }}>{t('biorhythm.odswiez', 'Odśwież')}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </Animated.View>

          {/* ── Info card ─────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(560).duration(400)}>
            <View style={[bs.infoCard, { backgroundColor: ACCENT + '0E', borderColor: ACCENT + '28' }]}>
              <Typography variant="premiumLabel" color={ACCENT}>{t('biorhythm.jak_czytac_biorytm', 'Jak czytać biorytm')}</Typography>
              <Text style={[bs.infoBody, { color: subColor }]}>
                Biorytm to trzy sinusoidalne cykle zaczynające się od daty urodzenia. Szczyt oznacza najlepszy czas na aktywność w danym obszarze. Minimum — czas na odpoczynek i regenerację. Środek cyklu (przejście przez zero) to <Text style={{ color: '#E8705A', fontWeight: '600' }}>{t('biorhythm.dni_krytyczne', 'dni krytyczne')}</Text> — momenty wzmożonej wrażliwości.
              </Text>
            </View>
          </Animated.View>

          {/* ── Co dalej? ─────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(620).duration(400)}>
            <View style={{ marginTop: 4 }}>
              <Text style={[bs.eyebrow, { color: ACCENT, marginBottom: 12 }]}>{t('biorhythm.co_dalej', '✦ CO DALEJ?')}</Text>
              {[
                {
                  icon: Wand2,
                  label: 'Medytacja',
                  sub: 'Medytacja dla regeneracji i wyrównania energii',
                  color: '#A78BFA',
                  route: 'Meditation',
                },
                {
                  icon: BookOpen,
                  label: 'Dziennik',
                  sub: 'Zanotuj swoje biorytmy i obserwacje dnia',
                  color: ACCENT,
                  route: 'JournalEntry',
                  params: { prefill: `Mój biorytm dziś: Fizyczny ${Math.round(todayValues[0].value * 50 + 50)}%, Emocjonalny ${Math.round(todayValues[1].value * 50 + 50)}%, Intelektualny ${Math.round(todayValues[2].value * 50 + 50)}%.` },
                },
                {
                  icon: Sparkles,
                  label: 'Oracle Portal',
                  sub: 'Zapytaj Oracle o swoje cykle i potencjał',
                  color: '#F472B6',
                  route: 'OraclePortal',
                },
                {
                  icon: Moon,
                  label: 'Kalendarz księżycowy',
                  sub: 'Zsynchronizuj cykl biologiczny z fazami Księżyca',
                  color: '#60A5FA',
                  route: 'LunarCalendar',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => {
                      HapticsService.impact('light');
                      navigation.navigate(item.route as any, item.params);
                    }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10,
                      backgroundColor: cardBg, borderColor: item.color + '33',
                    }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: item.color + '18' }}>
                      <Icon color={item.color} size={17} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{item.label}</Text>
                      <Text style={{ fontSize: 12, color: subColor, marginTop: 2, lineHeight: 18 }}>{item.sub}</Text>
                    </View>
                    <ArrowRight color={item.color} size={15} strokeWidth={1.5} />
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const bs = StyleSheet.create({
  container:      { flex: 1 },
  safeArea:       { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingTop: 8, paddingBottom: 10 },
  backBtn:        { width: 40 },
  starBtn:        { width: 40, alignItems: 'flex-end' },
  headerCenter:   { flex: 1, alignItems: 'center' },
  eyebrow:        { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  scroll:         { paddingHorizontal: 22, paddingTop: 4, gap: 14 },

  // Hero card
  heroCard:       { borderRadius: 22, borderWidth: 1, padding: 20, overflow: 'hidden', gap: 10 },
  heroTopRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroScore:      { fontSize: 52, fontWeight: '800', letterSpacing: -2 },
  heroPhaseBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  heroPhaseText:  { fontSize: 13, fontWeight: '700' },
  heroDesc:       { fontSize: 13, lineHeight: 20 },

  // Section card
  sectionCard:    { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden', gap: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionSub:     { fontSize: 12, lineHeight: 18 },

  // Forecast day item
  fcDayItem:      { width: 76, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(128,128,128,0.15)', padding: 10, alignItems: 'center', gap: 2 },
  fcDayLabel:     { fontSize: 11, letterSpacing: 0.3 },
  fcDate:         { fontSize: 9 },
  fcAvgPct:       { fontSize: 12 },

  // Critical days
  criticalRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 6 },
  critDot:        { width: 8, height: 8, borderRadius: 4 },
  critAdviceBox:  { borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 4 },

  // Best days
  bestDayRow:     { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
  noBestDays:     { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: 'center' },

  // Cycle cards
  cycleCard:      { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden', gap: 10 },
  cycleHeader:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cycleIconWrap:  { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cycleLabel:     { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  cycleName:      { fontSize: 16, fontWeight: '700' },
  cycleDesc:      { fontSize: 12 },
  cycleRight:     { alignItems: 'flex-end', gap: 6 },
  cyclePct:       { fontSize: 24, fontWeight: '800' },
  cyclePhase:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  cyclePhaseText: { fontSize: 11, fontWeight: '600' },
  progressTrack:  { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: 6, borderRadius: 3 },
  cyclePeriod:    { fontSize: 11 },
  chartLegend:    { fontSize: 10, textAlign: 'center' },

  // AI card
  aiCard:         { borderRadius: 18, borderWidth: 1, padding: 18, gap: 8 },
  aiBtn:          { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignSelf: 'flex-start' },
  aiBtnText:      { fontSize: 13, fontWeight: '600' },
  aiText:         { fontSize: 14, lineHeight: 24 },

  // Info card
  infoCard:       { borderRadius: 16, borderWidth: 1, padding: 18, gap: 8 },
  infoBody:       { fontSize: 13, lineHeight: 20 },

  // Empty state
  emptyBtn:       { paddingHorizontal: 28, paddingVertical: 16, borderRadius: 999 },
});
