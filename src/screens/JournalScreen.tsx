import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  View,
  FlatList,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
  Animated as RNAnimated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { useJournalStore, JournalEntry } from '../store/useJournalStore';
import { PatternInsightService } from '../core/services/patternInsight.service';
import { getLocaleCode } from '../core/utils/localeFormat';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, luxury, screenContracts } from '../core/theme/designSystem';
import { Typography } from '../components/Typography';
import { CelestialBackdrop } from '../components/CelestialBackdrop';
import {
  BookMarked,
  ChevronLeft,
  Heart,
  Trash2,
  Plus,
  MoonStar,
  SunMedium,
  ShieldHalf,
  Battery,
  Tag as TagIcon,
  Sparkles,
  ScrollText,
  ArrowRight,
  Star,
  WandSparkles,
  Feather,
  Eye,
  Crown,
  MessageCircle,
  Archive,
  Zap,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Ellipse, G, Defs, RadialGradient, Stop, Line } from 'react-native-svg';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW, height: SH } = Dimensions.get('window');

// ─── Writing Prompts carousel ───────────────────────────────────────────────
const WRITING_PROMPTS = [
  'Co dziś najbardziej poruszyło moje wnętrze pod spodem zdarzeń?',
  'Jaki wzorzec wraca do mnie po raz kolejny — i co naprawdę chce powiedzieć?',
  'Która emocja chce zostać zauważona, a nie naprawiona ani wytłumaczona?',
  'Co potrzebuje dziś łagodniejszego języka wobec siebie samej lub samego siebie?',
  'Jaka jedna prawda porządkuje dziś mój wewnętrzny chaos?',
  'Co chcę zapamiętać z tego tygodnia, kiedy spojrzę wstecz za rok?',
  'Jaką część siebie odkryłam lub odkryłem w ostatnich dniach, która zasługuje na uwagę?',
  'Co w tej chwili trzymam w sobie zamiast wypowiedzieć na głos?',
  'Gdybym miała lub miał porozmawiać z sobą sprzed roku — co chciałabym lub chciałbym powiedzieć?',
  'Skąd pochodzi lęk, który dzisiaj towarzyszył mi najdłużej?',
  'Czego naprawdę szukam, kiedy myślę, że szukam spokoju?',
  'Jaki dar niesie dla mnie trudność, przez którą teraz przechodzę?',
  'Co moje ciało wie o tej sytuacji, czego mój umysł jeszcze nie przyjął?',
  'Gdzie kończy się ja, a zaczyna rola, którą gram dla innych?',
];

// ─── Daily Pytanie Dnia (date-indexed, 14 entries) ────────────────────────────
const DAILY_PROMPTS = [
  'Co w tej chwili woła o moją uwagę — ale cicho, bo boi się, że znowu zostanie zignorowane?',
  'Jaka cząstka mnie potrzebuje dziś przyzwolenia, a nie zmiany?',
  'Które przekonanie o sobie zaczyna być za ciasne jak stara skóra?',
  'Co czuję, kiedy stoję w ciszy — bez telefonu, bez muzyki, bez planów?',
  'Jaka stara historia wciąż kształtuje moje dzisiejsze decyzje?',
  'Co oznaczałoby dla mnie naprawdę wybrać siebie — nie z egoizmu, lecz z miłości?',
  'Gdybym przestała lub przestał szukać odpowiedzi, co poczułabym lub poczułbym?',
  'Co w moim życiu potrzebuje zakończenia, żeby coś nowego mogło się zacząć?',
  'Kiedy ostatnio czułam lub czułem się całkowicie sobą — co wtedy robiłam lub robiłem?',
  'Czego się boję, że ktoś zobaczy — i dlaczego właśnie tego?',
  'Co jest moją najgłębszą tęsknotą, której nie ośmielam się wypowiedzieć głośno?',
  'Jaki dar wnoszę w życie innych, który sam traktuję jako oczywistość?',
  'Co by się zmieniło, gdybym uwierzyła lub uwierzył, że zasługuję na dobro?',
  'Jak wygląda moja relacja z przeszłością — czy noszę ją jak ciężar, czy jak mądrość?',
];

// ─── Archive filters ─────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'reflection', label: 'Refleksje' },
  { id: 'dream', label: 'Sny' },
  { id: 'tarot', label: 'Tarot' },
  { id: 'shadow_work', label: 'Praca z Cieniem' },
  { id: 'favorite', label: '♥ Ulubione' },
];

// ─── Animated quill SVG hero widget ─────────────────────────────────────────
const QuillHeroWidget = ({ accent, isLight }: { accent: string; isLight: boolean }) => {
  const inkAnim = useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(inkAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        RNAnimated.timing(inkAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const inkScale = inkAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.92, 1.0, 0.96] });
  const inkOpacity = inkAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.55, 1.0, 0.7] });

  return (
    <View style={heroStyles.widgetContainer}>
      <Svg width={96} height={96} viewBox="0 0 96 96">
        <Defs>
          <RadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={accent} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={accent} stopOpacity="0.00" />
          </RadialGradient>
        </Defs>
        {/* Glow circle */}
        <Circle cx="48" cy="48" r="44" fill="url(#glowGrad)" />
        {/* Quill feather body */}
        <Path
          d="M62 16 C72 24, 74 38, 60 50 L46 68 C44 72, 38 74, 34 70 C30 66, 32 60, 36 58 L50 44 C62 30, 60 20, 52 18 Z"
          fill={accent}
          opacity={isLight ? 0.72 : 0.85}
          strokeWidth={1}
          stroke={accent}
        />
        {/* Quill spine */}
        <Path
          d="M58 22 L36 62"
          stroke={isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.45)'}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        {/* Barbs left */}
        <Path d="M55 28 Q49 30 46 35" stroke={isLight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)'} strokeWidth={0.9} fill="none" strokeLinecap="round" />
        <Path d="M52 35 Q46 37 43 42" stroke={isLight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)'} strokeWidth={0.9} fill="none" strokeLinecap="round" />
        <Path d="M49 42 Q43 44 40 49" stroke={isLight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)'} strokeWidth={0.9} fill="none" strokeLinecap="round" />
        {/* Quill nib */}
        <Path
          d="M36 58 L32 72 L38 66 Z"
          fill={accent}
          opacity={0.95}
        />
        {/* Ink drop (animated via wrapper) */}
        <Ellipse cx="32" cy="76" rx="3.5" ry="2.5" fill={accent} opacity={0.7} />
        {/* Small ink splash dots */}
        <Circle cx="28" cy="79" r="1.2" fill={accent} opacity={0.4} />
        <Circle cx="36" cy="80" r="0.9" fill={accent} opacity={0.3} />
      </Svg>

      {/* Animated ink drop overlay */}
      <RNAnimated.View style={[heroStyles.inkDropAnimated, { transform: [{ scale: inkScale }], opacity: inkOpacity }]}>
        <Svg width={18} height={18} viewBox="0 0 18 18">
          <Ellipse cx="9" cy="12" rx="4" ry="3" fill={accent} opacity={0.9} />
          <Circle cx="9" cy="8" r="2.5" fill={accent} opacity={0.9} />
        </Svg>
      </RNAnimated.View>
    </View>
  );
};

const heroStyles = StyleSheet.create({
  widgetContainer: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  inkDropAnimated: { position: 'absolute', bottom: 4, left: 20 },
});

// ─── Background ──────────────────────────────────────────────────────────────
const JournalBg = ({ isLight, accent }: { isLight: boolean; accent: string }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={
        isLight
          ? (['#F4F2FA', '#EBF6EF', '#E3F0EA'] as const)
          : (['#060214', '#04110A', '#061510'] as const)
      }
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={SH} style={StyleSheet.absoluteFill} opacity={isLight ? 0.14 : 0.22}>
      <G>
        {/* Ruled lines — notebook feel */}
        {Array.from({ length: 8 }, (_, i) => (
          <Line
            key={`rl${i}`}
            x1={SW * 0.06}
            y1={SH * (0.36 + i * 0.082)}
            x2={SW * 0.94}
            y2={SH * (0.36 + i * 0.082)}
            stroke={accent}
            strokeWidth={0.5}
            opacity={0.18 - i * 0.01}
          />
        ))}
        {/* Left margin line */}
        <Line x1={SW * 0.14} y1={SH * 0.32} x2={SW * 0.14} y2={SH * 0.98} stroke={accent} strokeWidth={0.8} opacity={0.22} />
        {/* Corner feather arc */}
        <Path
          d={`M${SW * 0.88},12 Q${SW * 0.72},${SH * 0.10} ${SW * 0.56},${SH * 0.22}`}
          stroke={accent}
          strokeWidth={1.4}
          fill="none"
          opacity={0.5}
          strokeLinecap="round"
        />
        <Path
          d={`M${SW * 0.84},16 Q${SW * 0.69},${SH * 0.12} ${SW * 0.54},${SH * 0.24}`}
          stroke={accent}
          strokeWidth={0.6}
          fill="none"
          opacity={0.24}
          strokeLinecap="round"
        />
        {/* Scattered ink dots */}
        {Array.from({ length: 16 }, (_, i) => (
          <Circle
            key={`d${i}`}
            cx={((i * 137 + SW * 0.1) % (SW * 0.9))}
            cy={(SH * 0.15 + (i * 113) % (SH * 0.78))}
            r={i % 5 === 0 ? 2.2 : i % 3 === 0 ? 1.4 : 0.8}
            fill={accent}
            opacity={0.14 + (i % 4) * 0.07}
          />
        ))}
      </G>
    </Svg>
  </View>
);

// ─── Hub entry type icon helper ──────────────────────────────────────────────
const getIconForType = (type: string, primary: string, textMuted: string) => {
  switch (type) {
    case 'tarot': return <Crown color="#E98CAB" size={18} />;
    case 'dream': return <MoonStar color="#8E8DFF" size={18} />;
    case 'gratitude': return <SunMedium color="#F2BE5C" size={18} />;
    case 'shadow_work': return <Eye color="#A774FF" size={18} />;
    case 'reflection': return <Feather color="#6EE7B7" size={18} />;
    default: return <BookMarked color={primary} size={18} />;
  }
};

// ─── Mood emoji map ───────────────────────────────────────────────────────────
const MOOD_EMOJI: Record<string, string> = {
  Znakomita: '✦',
  Dobra: '☼',
  Spokojna: '☾',
  Słaba: '☁',
  Trudna: '⚡',
  excellent: '✦',
  good: '☼',
  neutral: '☾',
  bad: '☁',
  terrible: '⚡',
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export const JournalScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const aiAvailable = AiService.isLaunchAvailable();

  const { entries, deleteEntry, toggleFavorite } = useJournalStore();
  const [activeFilter, setActiveFilter] = useState('all');
  const [activePromptIdx, setActivePromptIdx] = useState(0);

  // Scroll refs
  const archiveRef = useRef<FlatList>(null);
  const scrollRef = useRef<ScrollView>(null);

  // ── Color system ───────────────────────────────────────────────────────────
  const ACCENT = isLight ? '#16A34A' : '#4ADE80';
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.50)';
  const dividerColor = isLight ? 'rgba(255,246,230,0.92)' : 'rgba(255,255,255,0.06)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.09)';
  const chipActive = ACCENT + '1A';
  const chipActiveBorder = ACCENT + '44';
  const chipInactive = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const chipInactiveBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.10)';

  // ── Derived data ──────────────────────────────────────────────────────────
  const weeklyInsight = useMemo(() => PatternInsightService.generateWeeklyInsight(), [entries]);
  const personalizedPrompt = useMemo(() => PatternInsightService.getPersonalizedPrompt(), [entries]);

  const stats = useMemo(() => {
    const favorites = entries.filter((e) => e.isFavorite).length;
    const dreams = entries.filter((e) => e.type === 'dream').length;
    const tarot = entries.filter((e) => e.type === 'tarot').length;
    const avgEnergy =
      entries.length > 0
        ? Math.round(entries.reduce((s, e) => s + (e.energyLevel || 50), 0) / entries.length)
        : 0;
    return { favorites, dreams, tarot, avgEnergy };
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (activeFilter === 'all') return entries;
    if (activeFilter === 'favorite') return entries.filter((e) => e.isFavorite);
    return entries.filter((e) => e.type === activeFilter);
  }, [activeFilter, entries]);

  // ── Hub entries (8 items) ─────────────────────────────────────────────────
  const HUB_ENTRIES = [
    {
      emoji: '📝',
      label: 'Nowy wpis',
      desc: 'Otwarta, czysta przestrzeń pisania',
      color: ACCENT,
      onPress: () => navigation.navigate('JournalEntry'),
    },
    {
      emoji: '🌅',
      label: 'Refleksja dnia',
      desc: 'Codzienne odzwierciedlenie chwili',
      color: '#FBBF24',
      onPress: () =>
        navigation.navigate('JournalEntry', {
          type: 'reflection',
          prompt: 'Co dziś najbardziej potrzebuje nazwania, zanim zniknie w biegu dnia?',
        }),
    },
    {
      emoji: '🙏',
      label: 'Wdzięczność',
      desc: 'Trzy rzeczy, które cię dziś niosły',
      color: '#F472B6',
      onPress: () => navigation.navigate('Gratitude'),
    },
    {
      emoji: '🌙',
      label: 'Sen i symbole',
      desc: 'Sny, obrazy, symbolarium podświadomości',
      color: '#818CF8',
      onPress: () => navigation.navigate('Dreams'),
    },
    {
      emoji: '👁️',
      label: 'Praca z cieniem',
      desc: 'Głęboka refleksja jungowska',
      color: '#A78BFA',
      onPress: () => navigation.navigate('ShadowWork'),
    },
    {
      emoji: '🔋',
      label: 'Energia i nastrój',
      desc: 'Ślad codziennego rytmu energetycznego',
      color: '#34D399',
      onPress: () => navigation.navigate('EnergyJournal'),
    },
    {
      emoji: '💬',
      label: 'Oracle refleksji',
      desc: 'Porozmawiaj z przewodnikiem wnętrza',
      color: '#C084FC',
      onPress: () => navigation.navigate('OracleChat', { source: 'journal' }),
    },
    {
      emoji: '📚',
      label: 'Archiwum wpisów',
      desc: `${entries.length} zapisanych stron sanktuarium`,
      color: isLight ? '#16A34A' : '#6EE7B7',
      onPress: () => {
        setActiveFilter('all');
        // Scroll down to archive after a brief delay
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
      },
    },
  ];

  // ── Delete confirm ────────────────────────────────────────────────────────
  const handleDeleteEntry = (id: string, title?: string) => {
    Alert.alert('Usuń wpis', title ? `Usunąć „${title}"?` : 'Usunąć ten wpis?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => deleteEntry(id) },
    ]);
  };

  // ── Entry card renderer ───────────────────────────────────────────────────
  const renderEntry = ({ item, index }: { item: JournalEntry; index: number }) => {
    const preview = (item.content || item.interpretation || '').slice(0, 110);
    const moodEmoji = item.mood ? MOOD_EMOJI[item.mood] ?? '' : '';
    const dateStr = new Date(item.date).toLocaleDateString(getLocaleCode(), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(380)}>
        <Pressable
          onPress={() => navigation.navigate('JournalEntry', { entryId: item.id })}
          style={[
            s.entryCard,
            {
              backgroundColor: item.isFavorite ? ACCENT + '08' : cardBg,
              borderColor: item.isFavorite ? ACCENT + '30' : cardBorder,
              borderLeftWidth: item.isFavorite ? 3 : 1,
              borderLeftColor: item.isFavorite ? ACCENT : cardBorder,
            },
          ]}
        >
          {/* Card header */}
          <View style={s.entryHeader}>
            <View style={[s.entryTypeIcon, { backgroundColor: ACCENT + '14', borderColor: ACCENT + '26' }]}>
              {getIconForType(item.type, currentTheme.primary, currentTheme.textMuted)}
            </View>
            <View style={s.entryMeta}>
              <Typography variant="cardTitle" style={{ color: textColor, fontSize: 14 }} numberOfLines={1}>
                {item.title || 'Wpis bez tytułu'}
              </Typography>
              <Typography variant="caption" style={{ color: subColor, marginTop: 3 }}>
                {dateStr}
                {moodEmoji ? `  ${moodEmoji}` : ''}
                {item.energyLevel ? `  · energia ${item.energyLevel}%` : ''}
              </Typography>
            </View>
            <View style={s.entryActions}>
              <Pressable
                onPress={() => toggleFavorite(item.id)}
                style={[s.actionBtn, { backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.07)' }]}
                hitSlop={6}
              >
                <Heart
                  color={item.isFavorite ? '#FF6F7D' : currentTheme.textMuted}
                  fill={item.isFavorite ? '#FF6F7D' : 'transparent'}
                  size={15}
                />
              </Pressable>
              <Pressable
                onPress={() => handleDeleteEntry(item.id, item.title)}
                style={[s.actionBtn, { backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.07)' }]}
                hitSlop={6}
              >
                <Trash2 color={currentTheme.textMuted} size={15} />
              </Pressable>
            </View>
          </View>

          {/* Preview line */}
          {preview ? (
            <Typography
              variant="bodySmall"
              style={{ color: subColor, marginTop: 8, lineHeight: 20 }}
              numberOfLines={2}
            >
              {preview}
              {(item.content?.length ?? 0) > 110 ? '…' : ''}
            </Typography>
          ) : null}

          {/* Tags */}
          {item.tags?.length ? (
            <View style={s.tagsRow}>
              <TagIcon color={ACCENT} size={11} />
              {item.tags.slice(0, 4).map((tag) => (
                <View
                  key={tag}
                  style={[s.tagChip, { backgroundColor: ACCENT + '0E', borderColor: ACCENT + '22' }]}
                >
                  <Typography variant="microLabel" color={ACCENT}>
                    #{tag}
                  </Typography>
                </View>
              ))}
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    );
  };

  // ─── HEADER ───────────────────────────────────────────────────────────────
  const Header = (
    <View style={s.header}>
      <Pressable onPress={() => goBackOrToMainTab(navigation, 'Profile')} style={s.backBtn}>
        <ChevronLeft color={ACCENT} size={28} />
      </Pressable>
      <View style={s.headerTitle}>
        <Typography variant="premiumLabel" color={ACCENT}>
          {t('journal.soulJournal')}
        </Typography>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Pressable
          onPress={() => {
            if (isFavoriteItem('journal')) {
              removeFavoriteItem('journal');
            } else {
              addFavoriteItem({ id: 'journal', label: 'Dziennik', route: 'Journal', params: {}, icon: 'Book', color: ACCENT, addedAt: new Date().toISOString() });
            }
          }}
          style={s.headerIconBtn}
          hitSlop={8}
        >
          <Star
            color={isFavoriteItem('journal') ? ACCENT : ACCENT + '88'}
            size={18}
            strokeWidth={1.8}
            fill={isFavoriteItem('journal') ? ACCENT : 'none'}
          />
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('JournalEntry')}
          style={[s.addBtn, { borderColor: ACCENT + '40', backgroundColor: ACCENT + '14' }]}
        >
          <Plus color={ACCENT} size={22} />
        </Pressable>
      </View>
    </View>
  );

  // ─── HERO SECTION ─────────────────────────────────────────────────────────
  const HeroSection = (
    <Animated.View entering={FadeIn.duration(700)} style={s.heroSection}>
      <View style={s.heroContent}>
        <View style={s.heroText}>
          <Typography variant="premiumLabel" color={ACCENT} style={{ letterSpacing: 3 }}>
            ✦ Sanktuarium Pisania
          </Typography>
          <Typography
            variant="editorialHeader"
            style={{ color: textColor, marginTop: 8, lineHeight: 32, fontSize: 20 }}
          >
            Miejsce, gdzie myśl{'\n'}staje się słowem,{'\n'}a słowo — jasnym wglądem.
          </Typography>
          <Typography variant="bodySmall" style={{ color: subColor, marginTop: 10, lineHeight: 22 }}>
            {entries.length === 0
              ? 'Pierwsze słowo jest zawsze najtrudniejsze. Napisz je.'
              : `${entries.length} wpisów · energia tygodnia ${weeklyInsight.averageEnergy}% · ${weeklyInsight.daysActive} aktywnych dni`}
          </Typography>
        </View>
        <QuillHeroWidget accent={ACCENT} isLight={isLight} />
      </View>

      {/* Stat pills (only if has entries) */}
      {entries.length > 0 && (
        <View style={s.statPillsRow}>
          {[
            { label: 'Wpisy', value: String(entries.length), icon: BookMarked },
            { label: 'Ulubione', value: String(stats.favorites), icon: Heart },
            { label: 'Sny', value: String(stats.dreams), icon: MoonStar },
            { label: 'Energia', value: `${stats.avgEnergy}%`, icon: Battery },
          ].map((st) => {
            const Icon = st.icon;
            return (
              <View
                key={st.label}
                style={[s.statPill, { backgroundColor: ACCENT + '0E', borderColor: ACCENT + '22' }]}
              >
                <Icon color={ACCENT} size={12} />
                <Typography
                  variant="microLabel"
                  color={ACCENT}
                  style={{ marginLeft: 5, fontSize: 11 }}
                >
                  {st.value} {st.label}
                </Typography>
              </View>
            );
          })}
        </View>
      )}
    </Animated.View>
  );

  // ─── HUB SECTION ─────────────────────────────────────────────────────────
  const HubSection = (
    <Animated.View entering={FadeInDown.delay(60).duration(500)}>
      <View style={[s.sectionBlock, { borderColor: cardBorder }]}>
        <View style={s.sectionLabelRow}>
          <Sparkles color={ACCENT} size={13} strokeWidth={1.8} />
          <Typography variant="premiumLabel" color={ACCENT} style={{ marginLeft: 7, letterSpacing: 2 }}>
            WEJŚCIA DO SANKTUARIUM
          </Typography>
        </View>

        {HUB_ENTRIES.map((item, idx) => (
          <Pressable
            key={item.label}
            style={[
              s.hubRow,
              {
                borderBottomWidth: idx < HUB_ENTRIES.length - 1 ? StyleSheet.hairlineWidth : 0,
                borderBottomColor: dividerColor,
              },
            ]}
            onPress={item.onPress}
          >
            <View style={[s.hubEmoji, { backgroundColor: item.color + '18' }]}>
              <Typography style={{ fontSize: 20 }}>{item.emoji}</Typography>
            </View>
            <View style={{ flex: 1, marginLeft: 13 }}>
              <Typography variant="cardTitle" style={{ color: textColor, fontSize: 14 }}>
                {item.label}
              </Typography>
              <Typography variant="caption" style={{ color: subColor, marginTop: 2 }}>
                {item.desc}
              </Typography>
            </View>
            <ArrowRight color={isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.22)'} size={14} />
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );

  // ─── WEEKLY INSIGHT BLOCK ─────────────────────────────────────────────────
  const InsightBlock = (
    <Animated.View entering={FadeInDown.delay(100).duration(500)}>
      <View style={[s.insightBlock, { backgroundColor: ACCENT + '07', borderColor: ACCENT + '22' }]}>
        {/* Left accent bar */}
        <View style={[s.insightBar, { backgroundColor: ACCENT }]} />
        <View style={{ flex: 1 }}>
          <View style={s.insightLabelRow}>
            <Zap color={ACCENT} size={12} strokeWidth={2} />
            <Typography variant="premiumLabel" color={ACCENT} style={{ marginLeft: 6, letterSpacing: 2, fontSize: 10 }}>
              {t('journal.weeklyInsight')}
            </Typography>
          </View>
          <Typography variant="bodyRefined" style={{ color: textColor, marginTop: 6, lineHeight: 22, fontSize: 14 }}>
            {weeklyInsight.suggestedFocus
              ? `Twój dominujący nastrój: ${weeklyInsight.dominantMood}. Sugerowany fokus: ${weeklyInsight.suggestedFocus}.`
              : 'Zacznij pisać, aby odsłonić wzorce energii i nastroju tygodnia.'}
          </Typography>
          {entries.length > 0 && (
            <Typography variant="caption" style={{ color: subColor, marginTop: 6 }}>
              Średnia energia {weeklyInsight.averageEnergy}% · {weeklyInsight.daysActive} aktywnych dni · {weeklyInsight.frequentArchetypes.slice(0, 2).join(', ')}
            </Typography>
          )}
        </View>
      </View>
    </Animated.View>
  );

  // ─── PYTANIE DNIA (date-based rotating card) ─────────────────────────────
  const dailyPromptIdx = new Date().getDate() % DAILY_PROMPTS.length;
  const dailyPromptText = DAILY_PROMPTS[dailyPromptIdx];
  const PytanieDnia = (
    <Animated.View entering={FadeInDown.delay(120).duration(480)}>
      <View style={[s.pytanieCard, { backgroundColor: ACCENT + '09', borderColor: ACCENT + '33' }]}>
        <LinearGradient
          colors={[ACCENT + '18', 'transparent'] as const}
          style={StyleSheet.absoluteFillObject as any}
        />
        <LinearGradient
          colors={['transparent', ACCENT + '99', 'transparent'] as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 }}
          pointerEvents="none"
        />
        <View style={s.pytanieLabelRow}>
          <WandSparkles color={ACCENT} size={13} strokeWidth={1.8} />
          <Typography variant="premiumLabel" color={ACCENT} style={{ marginLeft: 7, letterSpacing: 2 }}>
            ✍️ {t('journal.suggestedTopic')}
          </Typography>
        </View>
        <Typography
          variant="bodyRefined"
          style={{ color: textColor, lineHeight: 26, fontSize: 15, fontStyle: 'italic', marginTop: 10, marginBottom: 16 }}
        >
          „{dailyPromptText}"
        </Typography>
        <Pressable
          style={[s.pytanieCta, { backgroundColor: ACCENT + '1A', borderColor: ACCENT + '44' }]}
          onPress={() => navigation.navigate('JournalEntry', { prompt: dailyPromptText })}
        >
          <Feather color={ACCENT} size={13} strokeWidth={2} />
          <Typography variant="microLabel" color={ACCENT} style={{ marginLeft: 8, fontSize: 12 }}>
            Zacznij pisać
          </Typography>
          <ArrowRight color={ACCENT} size={12} style={{ marginLeft: 4 }} />
        </Pressable>
      </View>
    </Animated.View>
  );

  // ─── WRITING PROMPTS CAROUSEL ─────────────────────────────────────────────
  const PromptsCarousel = (
    <Animated.View entering={FadeInDown.delay(140).duration(500)}>
      <View style={s.carouselBlock}>
        <View style={s.sectionLabelRow}>
          <ScrollText color={ACCENT} size={13} strokeWidth={1.8} />
          <Typography variant="premiumLabel" color={ACCENT} style={{ marginLeft: 7, letterSpacing: 2 }}>
            PYTANIA PISANIA
          </Typography>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.promptScroll}
          decelerationRate="fast"
          snapToInterval={SW - layout.padding.screen * 2 - 8}
          snapToAlignment="start"
        >
          {WRITING_PROMPTS.map((prompt, idx) => (
            <Pressable
              key={idx}
              onPress={() => setActivePromptIdx(idx)}
              style={[
                s.promptCard,
                {
                  width: SW - layout.padding.screen * 2 - 8,
                  backgroundColor: activePromptIdx === idx ? ACCENT + '12' : cardBg,
                  borderColor: activePromptIdx === idx ? ACCENT + '44' : cardBorder,
                },
              ]}
            >
              <Typography
                variant="bodyRefined"
                style={{ color: textColor, lineHeight: 24, fontSize: 14, fontStyle: 'italic' }}
              >
                „{prompt}"
              </Typography>
              <Pressable
                style={[s.promptCta, { backgroundColor: ACCENT + '16', borderColor: ACCENT + '32' }]}
                onPress={() => navigation.navigate('JournalEntry', { prompt })}
              >
                <Feather color={ACCENT} size={12} strokeWidth={2} />
                <Typography variant="microLabel" color={ACCENT} style={{ marginLeft: 7 }}>
                  Pisz z tym pytaniem
                </Typography>
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>

        {/* Dot indicator */}
        <View style={s.promptDots}>
          {WRITING_PROMPTS.map((_, i) => (
            <View
              key={i}
              style={[
                s.promptDot,
                {
                  backgroundColor: i === activePromptIdx ? ACCENT : ACCENT + '30',
                  width: i === activePromptIdx ? 16 : 6,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );

  // ─── ARCHIVE SECTION ─────────────────────────────────────────────────────
  const ArchiveSection = (
    <Animated.View entering={FadeInDown.delay(180).duration(500)}>
      <View style={[s.archiveLabelRow, { borderTopColor: dividerColor }]}>
        <Archive color={ACCENT} size={13} strokeWidth={1.8} />
        <Typography variant="premiumLabel" color={ACCENT} style={{ marginLeft: 7, letterSpacing: 2 }}>
          📚 {t('journal.yourHistory')}
        </Typography>
      </View>

      {/* Filter rail */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRail}
      >
        {FILTERS.map((filter) => {
          const active = activeFilter === filter.id;
          return (
            <Pressable
              key={filter.id}
              onPress={() => setActiveFilter(filter.id)}
              style={[
                s.filterChip,
                {
                  backgroundColor: active ? chipActive : chipInactive,
                  borderColor: active ? chipActiveBorder : chipInactiveBorder,
                },
              ]}
            >
              <Typography variant="microLabel" color={active ? ACCENT : subColor}>
                {filter.label}
              </Typography>
            </Pressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );

  // ─── EMPTY ARCHIVE STATE ──────────────────────────────────────────────────
  const EmptyArchive = (
    <View style={s.emptyArchive}>
      <View style={[s.emptyQuillWrap, { backgroundColor: ACCENT + '0E', borderColor: ACCENT + '20' }]}>
        <Feather color={ACCENT} size={28} strokeWidth={1.4} />
      </View>
      <Typography
        variant="cardTitle"
        style={{ color: textColor, textAlign: 'center', marginTop: 14, lineHeight: 24 }}
      >
        Twoje sanktuarium czeka.
      </Typography>
      <Typography
        variant="bodySmall"
        style={{ color: subColor, textAlign: 'center', marginTop: 8, lineHeight: 21 }}
      >
        Pierwszy wpis jest zawsze najtrudniejszy —{'\n'}i zawsze najważniejszy.
      </Typography>
      <Pressable
        style={[s.emptyCtaBtn, { backgroundColor: ACCENT, shadowColor: ACCENT }]}
        onPress={() => navigation.navigate('JournalEntry')}
      >
        <Plus color={isLight ? '#FFF' : '#021106'} size={16} />
        <Typography
          variant="button"
          style={{ color: isLight ? '#FFF' : '#021106', marginLeft: 8 }}
        >
          {t('journal.addFirstEntry')}
        </Typography>
      </Pressable>
    </View>
  );

  // ─── CO DALEJ? SECTION ─────────────────────────────────────────────────────
  const CO_DALEJ_LINKS = [
    { emoji: '⚡', label: 'Dziennik energii', desc: 'Śledź swój rytm energetyczny', route: 'EnergyJournal', color: '#34D399' },
    { emoji: '🌙', label: 'Sny i symbole', desc: 'Zapisz i rozszyfruj obraz ze snu', route: 'Dreams', color: '#818CF8' },
    { emoji: '👁️', label: 'Praca z cieniem', desc: 'Jungowska głębia — spotkaj swój cień', route: 'ShadowWork', color: '#A78BFA' },
  ];
  const CoDalej = (
    <Animated.View entering={FadeInDown.delay(60).duration(440)}>
      <View style={[s.coDalejCard, { borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.09)' }]}>
        <View style={s.pytanieLabelRow}>
          <Sparkles color={ACCENT} size={13} strokeWidth={1.8} />
          <Typography variant="premiumLabel" color={ACCENT} style={{ marginLeft: 7, letterSpacing: 2 }}>
            CO DALEJ?
          </Typography>
        </View>
        {CO_DALEJ_LINKS.map((item, idx) => (
          <Pressable
            key={item.route}
            style={[
              s.coDalejRow,
              {
                borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
                borderTopColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.06)',
              },
            ]}
            onPress={() => navigation.navigate(item.route as any)}
          >
            <View style={[s.coDalejEmoji, { backgroundColor: item.color + '18' }]}>
              <Typography style={{ fontSize: 19 }}>{item.emoji}</Typography>
            </View>
            <View style={{ flex: 1, marginLeft: 13 }}>
              <Typography variant="cardTitle" style={{ color: textColor, fontSize: 14 }}>{item.label}</Typography>
              <Typography variant="caption" style={{ color: subColor, marginTop: 2 }}>{item.desc}</Typography>
            </View>
            <ArrowRight color={isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.22)'} size={14} />
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <View style={[s.container, { backgroundColor: currentTheme.background }]}>
      <JournalBg isLight={isLight} accent={ACCENT} />
      <CelestialBackdrop intensity="immersive" />

      <SafeAreaView edges={['top']} style={s.safeArea}>
        {Header}

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Hero */}
          {HeroSection}

          {/* 2. Hub entries */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 4 }}>
            {HubSection}
          </View>

          {/* 3. Weekly insight */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 12 }}>
            {InsightBlock}
          </View>

          {/* 4. Pytanie dnia */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 12 }}>
            {PytanieDnia}
          </View>

          {/* 5. Writing prompts carousel */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 12 }}>
            {PromptsCarousel}
          </View>

          {/* 6. Archive section label + filter */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 18 }}>
            {ArchiveSection}
          </View>

          {/* 7. Archive entry cards */}
          {filteredEntries.length === 0 ? (
            <View style={{ paddingHorizontal: layout.padding.screen }}>
              {activeFilter === 'all' ? (
                EmptyArchive
              ) : (
                <View style={[s.noResult, { borderColor: dividerColor }]}>
                  <Typography variant="cardTitle" style={{ color: textColor }}>
                    {t('common.noData')}
                  </Typography>
                  <Typography variant="bodySmall" style={{ color: subColor, marginTop: 6, lineHeight: 20 }}>
                    Zmień filtr lub dodaj nowy wpis, żeby rozwinąć tę część sanktuarium.
                  </Typography>
                </View>
              )}
            </View>
          ) : (
            <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 4 }}>
              {filteredEntries.map((item, index) => (
                <View key={item.id} style={{ marginBottom: 10 }}>
                  {renderEntry({ item, index })}
                </View>
              ))}
            </View>
          )}

          {/* 8. Co dalej? */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 24 }}>
            {CoDalej}
          </View>

          <EndOfContentSpacer size="airy" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen,
    height: 72,
  },
  backBtn: { width: 40 },
  headerTitle: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerIconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  heroSection: {
    paddingHorizontal: layout.padding.screen,
    paddingTop: 6,
    paddingBottom: 20,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroText: { flex: 1, paddingRight: 8 },
  statPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  // Section block (hub + carousel)
  sectionBlock: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
  },

  // Hub
  hubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  hubEmoji: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Insight block
  insightBlock: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  insightBar: {
    width: 3,
    borderRadius: 3,
    marginRight: 14,
    alignSelf: 'stretch',
  },
  insightLabelRow: { flexDirection: 'row', alignItems: 'center' },

  // Prompts carousel
  carouselBlock: {
    borderRadius: 20,
    overflow: 'visible',
  },
  promptScroll: {
    gap: 10,
    paddingLeft: 0,
    paddingRight: layout.padding.screen,
  },
  promptCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  promptCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  promptDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
  },
  promptDot: {
    height: 6,
    borderRadius: 3,
  },

  // Archive
  archiveLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  filterRail: {
    gap: 8,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  // Entry card
  entryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  entryTypeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  entryMeta: { flex: 1, marginLeft: 11, marginRight: 6 },
  entryActions: { flexDirection: 'row', gap: 6, alignSelf: 'flex-start' },
  actionBtn: { padding: 7, borderRadius: 9 },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },

  // Empty archive
  emptyArchive: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  emptyQuillWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    marginTop: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },

  // No result
  noResult: {
    paddingVertical: 20,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  // Pytanie dnia
  pytanieCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
  },
  pytanieLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pytanieCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },

  // Co dalej?
  coDalejCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    paddingTop: 14,
    paddingBottom: 4,
    paddingHorizontal: 0,
  },
  coDalejRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  coDalejEmoji: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
