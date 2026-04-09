import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, View, Text, Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle, G, Path } from 'react-native-svg';
import Animated, { FadeInDown, FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import {
  BookOpen, Sparkles, Moon, Heart, Flame,
  CheckCircle2, Circle as CircleIcon, ChevronRight,
  Sun, Brain, CalendarDays,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { layout, screenContracts } from '../core/theme/designSystem';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { SoulEngineService } from '../core/services/soulEngine.service';
import i18n from '../core/i18n';
import { useTheme } from '../core/hooks/useTheme';

const { width: SW } = Dimensions.get('window');

// ── BACKGROUND ────────────────────────────────────────────────

const TodayBg = ({ isLight }: { isLight: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight
        ? ['#FFFBF5', '#FFF7EE', '#FDF3E7']
        : ['#060409', '#0C0714', '#130A1C']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={700} style={StyleSheet.absoluteFill} opacity={isLight ? 0.08 : 0.14}>
      <G>
        {/* Concentric daily circles */}
        <Circle cx={SW / 2} cy={180} r={130} stroke={isLight ? '#A97A39' : '#CEAE72'} strokeWidth={0.7} fill="none" strokeDasharray="4 10" />
        <Circle cx={SW / 2} cy={180} r={90}  stroke={isLight ? '#A97A39' : '#CEAE72'} strokeWidth={0.5} fill="none" strokeDasharray="2 6" />
        <Circle cx={SW / 2} cy={180} r={50}  stroke={isLight ? '#A97A39' : '#CEAE72'} strokeWidth={0.8} fill="none" />
        {/* Soft violet accent arcs */}
        <Path
          d={`M ${SW * 0.1},350 Q ${SW * 0.5},300 ${SW * 0.9},350`}
          stroke={isLight ? '#7C3AED' : '#8B5CF6'}
          strokeWidth={0.6}
          fill="none"
          opacity={0.35}
        />
        <Path
          d={`M ${SW * 0.05},420 Q ${SW * 0.5},370 ${SW * 0.95},420`}
          stroke={isLight ? '#7C3AED' : '#8B5CF6'}
          strokeWidth={0.4}
          fill="none"
          opacity={0.22}
        />
        {/* Scatter stars */}
        {Array.from({ length: 18 }, (_, i) => (
          <Circle
            key={i}
            cx={(i * 137 + 20) % SW}
            cy={(i * 89 + 20) % 600}
            r={i % 5 === 0 ? 1.5 : 0.8}
            fill={isLight ? '#A97A39' : 'rgba(255,255,255,0.7)'}
            opacity={0.18}
          />
        ))}
      </G>
    </Svg>
  </View>
);

// ── MOOD EMOJI CONFIG ─────────────────────────────────────────

type MoodKey = 'great' | 'good' | 'okay' | 'low';

const MOODS: { key: MoodKey; icon: string; label: string; color: string }[] = [
  { key: 'great', icon: '😄', label: 'Świetnie', color: '#F59E0B' },
  { key: 'good',  icon: '🙂', label: 'Dobrze',   color: '#10B981' },
  { key: 'okay',  icon: '😐', label: 'Ujdzie',   color: '#6366F1' },
  { key: 'low',   icon: '😔', label: 'Słabo',    color: '#EF4444' },
];

// ── DAILY FOCUS PHRASES (rotate by day-of-year) ───────────────

const FOCUS_PHRASES = [
  'Działaj z intencją, nie z nawyku.',
  'Jedna obecna chwila waży więcej niż tysiąc planów.',
  'Twoje ciało zna odpowiedź, zanim zrobi to umysł.',
  'Oddaj to, czego nie możesz zmienić. Weź to, co możesz.',
  'Cisza jest też językiem — naucz się jej słuchać.',
  'Energia podąża za uwagą. Na co patrzysz, to rośnie.',
  'Małe kroki konsekwentnie > wielkie gesty od czasu do czasu.',
  'Granica to akt miłości — wobec siebie i innych.',
  'Dziś możesz zacząć ponownie, bez przeprosin.',
  'Twoja historia nie jest Twoim więzieniem.',
  'Wdzięczność przekształca to, co mamy, w wystarczające.',
  'Nie musisz wszystkiego rozumieć, żeby iść dalej.',
  'Ciało jest pierwszym sanktuarium.',
  'Prawdziwa siła jest miękka i nie musi tego udowadniać.',
  'Dzień zaczyna się od pierwszego oddechu, który bierzesz świadomie.',
  'Spokój to nie brak uczuć — to wybór, jak na nie odpowiadasz.',
  'Twoja obecność jest wystarczająca.',
  'To, co pielęgnujesz w sobie, pielęgnujesz w świecie.',
  'Skup się na tym, na co masz wpływ.',
  'Każda intencja złożona z uwagą jest rytuałem.',
  'Sen jest praktyką duchową.',
  'Korzenie muszą sięgać głęboko, by korona mogła się wznosić.',
  'Zapytaj siebie: "Co teraz potrzebuję?" — i zaufaj odpowiedzi.',
  'Rytm jest ważniejszy niż intensywność.',
  'Ciekawość jest pierwszą formą odwagi.',
  'Twoje granice są zaproszeniem do szacunku.',
  'Nie ma dobrego momentu — jest tylko ten.',
  'Emocja to informacja, nie wyrok.',
];

const getDailyPhrase = () => {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = (new Date() as any) - (start as any);
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return FOCUS_PHRASES[dayOfYear % FOCUS_PHRASES.length];
};

// ── RITUAL CHECKBOX ───────────────────────────────────────────

const RitualCheckbox = React.memo(({ label, done, accent, isLight, onToggle }: {
  label: string; done: boolean; accent: string; isLight: boolean; onToggle: () => void;
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => {
          scale.value = withSpring(0.92, { damping: 12, stiffness: 400 });
          setTimeout(() => { scale.value = withSpring(1, { damping: 10, stiffness: 200 }); }, 120);
          onToggle();
        }}
        style={[rc.row, {
          backgroundColor: done
            ? (isLight ? accent + '18' : accent + '14')
            : (isLight ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.04)'),
          borderColor: done ? accent + '55' : (isLight ? 'rgba(139,100,42,0.18)' : 'rgba(255,255,255,0.10)'),
        }]}
      >
        <View style={[rc.box, {
          backgroundColor: done ? accent : 'transparent',
          borderColor: done ? accent : (isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.22)'),
        }]}>
          {done && <CheckCircle2 color="#FFF" size={14} strokeWidth={2.5} />}
          {!done && <CircleIcon color={isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.22)'} size={14} strokeWidth={1.5} />}
        </View>
        <Text style={[rc.label, {
          color: done ? accent : (isLight ? '#2A1F0E' : '#D4C9BC'),
          textDecorationLine: done ? 'line-through' : 'none',
          opacity: done ? 0.72 : 1,
        }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

const rc = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  box: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '500', flex: 1 },
});

// ── QUICK LINK BUTTON ─────────────────────────────────────────

const QuickLink = React.memo(({ icon: Icon, label, accent, isLight, onPress, delay = 0 }: {
  icon: any; label: string; accent: string; isLight: boolean; onPress: () => void; delay?: number;
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(260)} style={[animStyle, ql.wrap]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.93, { damping: 12, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
        style={[ql.btn, {
          backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.06)',
          borderColor: isLight ? accent + 'BB' : accent + '44',
          shadowColor: accent,
        }]}
      >
        <LinearGradient
          colors={isLight
            ? [accent + '22', accent + '08', 'rgba(255,255,255,0)'] as [string, string, string]
            : [accent + '28', accent + '0C', 'rgba(8,4,18,0)'] as [string, string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[ql.iconWrap, { backgroundColor: accent + (isLight ? '25' : '1C'), borderColor: accent + (isLight ? '88' : '55') }]}>
          <Icon color={accent} size={20} strokeWidth={1.7} />
        </View>
        <Text style={[ql.label, { color: isLight ? '#1A1008' : '#EDE6D8' }]} numberOfLines={1}>{label}</Text>
        <ChevronRight color={accent} size={13} strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
});

const ql = StyleSheet.create({
  wrap: { flex: 1, minWidth: (SW - 44 - 10) / 2 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 13,
    borderRadius: 16, borderWidth: 1.2, overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 5,
  },
  iconWrap: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 13, fontWeight: '700', letterSpacing: -0.1 },
});

// ── SECTION CARD WRAPPER ──────────────────────────────────────

const SectionCard = ({ accent, isLight, children, delay = 0 }: {
  accent: string; isLight: boolean; children: React.ReactNode; delay?: number;
}) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(320)} style={[sc.outerShadow, {
    shadowColor: accent,
  }]}>
    <BlurView
      intensity={isLight ? 58 : 36}
      tint={isLight ? 'light' : 'dark'}
      style={[sc.card, {
        borderColor: isLight ? 'rgba(255,255,255,0.72)' : accent + '22',
      }]}
    >
      {/* Inner glass tint layer */}
      <View style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.04)', borderRadius: 20 }}>
        <LinearGradient
          colors={isLight
            ? [accent + '18', 'rgba(255,255,255,0)', 'rgba(255,255,255,0)'] as [string, string, string]
            : [accent + '1C', 'transparent', 'transparent'] as [string, string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Top highlight edge */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: 'rgba(255,255,255,0.30)' }} pointerEvents="none" />
        {/* Top accent bar */}
        <LinearGradient
          colors={[accent + '88', accent + '33', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
          pointerEvents="none"
        />
        <View style={{ padding: 18 }}>
          {children}
        </View>
      </View>
    </BlurView>
  </Animated.View>
);

const sc = StyleSheet.create({
  outerShadow: {
    marginBottom: 14,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 22, elevation: 9,
  },
  card: {
    borderRadius: 20, borderWidth: 1,
    overflow: 'hidden',
  },
});

// ── PROGRESS BAR ──────────────────────────────────────────────

const ProgressBar = ({ value, max, accent, isLight }: { value: number; max: number; accent: string; isLight: boolean }) => {
  const pct = max === 0 ? 0 : Math.min(1, value / max);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
      <View style={[pb.track, { backgroundColor: isLight ? accent + '18' : accent + '14' }]}>
        <LinearGradient
          colors={[accent, accent + 'CC'] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[pb.fill, { width: `${pct * 100}%` }]}
        />
      </View>
      <Text style={[pb.pct, { color: accent }]}>{Math.round(pct * 100)}%</Text>
    </View>
  );
};

const pb = StyleSheet.create({
  track: { flex: 1, height: 6, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  pct: { fontSize: 12, fontWeight: '700', minWidth: 34, textAlign: 'right' },
});

// ── MORNING / EVENING RITUAL ITEMS ───────────────────────────

const MORNING_RITUALS = [
  { key: 'breath',       label: 'Poranny oddech (3 min)' },
  { key: 'affirmation',  label: 'Przeczytaj afirmację dnia' },
  { key: 'intention',    label: 'Zapisz intencję na dziś' },
  { key: 'gratitude',    label: 'Trzy rzeczy wdzięczności' },
];
const EVENING_RITUALS = [
  { key: 'review',       label: 'Krótki przegląd dnia' },
  { key: 'journal',      label: 'Wpis w dzienniku' },
  { key: 'release',      label: 'Puść napięcie dnia' },
  { key: 'sleepIntent',  label: 'Intencja snu' },
];

// ── MAIN SCREEN ───────────────────────────────────────────────

export const TodayScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const tr = useCallback((key: string, pl: string, en: string) => (
    t(key, { defaultValue: i18n.language?.startsWith('en') ? en : pl })
  ), [t]);

  const insets = useSafeAreaInsets();
  const { isLight } = useTheme();
  const userData = useAppStore(s => s.userData);
  const streaks = useAppStore(s => s.streaks);
  const dailyProgress = useAppStore(s => s.dailyProgress);
  const updateDailyProgress = useAppStore(s => s.updateDailyProgress);
  const { entries } = useJournalStore();
  const dailyPlan = useMemo(() => SoulEngineService.generateDailyPlan(), []);

  const today = new Date().toISOString().split('T')[0];
  const todayProg = dailyProgress[today] || {};

  // ── Mood state ────────────────────────────────────────────
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>((todayProg as any).mood ?? null);

  const handleMoodSelect = useCallback((key: MoodKey) => {
    setSelectedMood(key);
    updateDailyProgress(today, { mood: key } as any);
  }, [today, updateDailyProgress]);

  // ── Ritual checkbox state ─────────────────────────────────
  const [morningDone, setMorningDone] = useState<Record<string, boolean>>(
    (todayProg as any).morningRituals ?? {}
  );
  const [eveningDone, setEveningDone] = useState<Record<string, boolean>>(
    (todayProg as any).eveningRituals ?? {}
  );

  const toggleMorning = useCallback((key: string) => {
    setMorningDone(prev => {
      const next = { ...prev, [key]: !prev[key] };
      updateDailyProgress(today, { morningRituals: next } as any);
      return next;
    });
  }, [today, updateDailyProgress]);

  const toggleEvening = useCallback((key: string) => {
    setEveningDone(prev => {
      const next = { ...prev, [key]: !prev[key] };
      updateDailyProgress(today, { eveningRituals: next } as any);
      return next;
    });
  }, [today, updateDailyProgress]);

  // ── Stats ─────────────────────────────────────────────────
  const morningCount = MORNING_RITUALS.filter(r => morningDone[r.key]).length;
  const eveningCount = EVENING_RITUALS.filter(r => eveningDone[r.key]).length;
  const totalDone = morningCount + eveningCount;
  const totalRituals = MORNING_RITUALS.length + EVENING_RITUALS.length;
  const journalToday = entries.filter(e => e.date?.startsWith?.(today)).length;

  // ── Greeting ──────────────────────────────────────────────
  const firstName = userData.name?.trim() || tr('today.fallbackName', 'Wędrowcze', 'Traveler');
  const hour = new Date().getHours();
  const greeting = hour < 6
    ? tr('today.greeting.night', 'Dobranoc', 'Good night')
    : hour < 12
    ? tr('today.greeting.morning', 'Dzień dobry', 'Good morning')
    : hour < 18
    ? tr('today.greeting.day', 'Witaj', 'Welcome')
    : tr('today.greeting.evening', 'Dobry wieczór', 'Good evening');

  const focusPhrase = useMemo(() => getDailyPhrase(), []);
  const accent = '#CEAE72';
  const violetAccent = '#8B5CF6';
  const mintAccent = '#10B981';

  const textColor = isLight ? '#1A1208' : '#F0E8D8';
  const subColor  = isLight ? 'rgba(40,28,8,0.58)' : 'rgba(240,232,216,0.52)';
  const divColor  = isLight ? 'rgba(139,100,42,0.14)' : 'rgba(255,255,255,0.08)';

  return (
    <View style={ts.container}>
      <TodayBg isLight={isLight} />

      <SafeAreaView edges={['top']} style={ts.safe}>
        {/* ── HEADER ── */}
        <Animated.View entering={FadeIn.duration(300)} style={[ts.header, { borderBottomColor: divColor }]}>
          <View>
            <Text style={[ts.eyebrow, { color: accent, opacity: isLight ? 1 : 0.7 }]}>
              ✦ {tr('today.eyebrow', 'DZIŚ', 'TODAY')}
            </Text>
            <Text style={[ts.greeting, { color: textColor }]}>{greeting}, {firstName}</Text>
            <Text style={[ts.sub, { color: subColor }]}>
              {tr('today.headerSub', 'Twoje praktyki i śledzenie dnia', 'Your practices and daily tracking')}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View style={[ts.moonPill, { borderColor: accent + '55', backgroundColor: isLight ? 'rgba(255,255,255,0.90)' : accent + '12' }]}>
              <Text style={ts.moonEmoji}>{dailyPlan.moonPhase.icon}</Text>
              <Text style={[ts.moonName, { color: accent }]}>{dailyPlan.moonPhase.name}</Text>
            </View>
            <View style={[ts.streakBadge, { borderColor: accent + '44', backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : accent + '0E' }]}>
              <Sparkles color={accent} size={11} strokeWidth={2} />
              <Text style={[ts.streakText, { color: accent }]}>{streaks.current}d</Text>
            </View>
          </View>
        </Animated.View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[ts.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') + 80 }]}
          showsVerticalScrollIndicator={false}
        >

          {/* ── DZISIEJSZY FOKUS ── */}
          <Animated.View entering={FadeInDown.delay(40).duration(340)} style={[ts.focusCardOuter, { shadowColor: accent }]}>
            <BlurView
              intensity={isLight ? 65 : 42}
              tint={isLight ? 'light' : 'dark'}
              style={[ts.focusCard, { borderColor: isLight ? 'rgba(255,255,255,0.80)' : accent + '33' }]}
            >
              <View style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.04)' }}>
                <LinearGradient
                  colors={isLight
                    ? [accent + '22', 'rgba(255,255,255,0)'] as [string, string]
                    : [accent + '1E', 'transparent'] as [string, string]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                {/* Top highlight */}
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.38)' }} pointerEvents="none" />
                {/* Gradient accent bar */}
                <LinearGradient
                  colors={[accent + 'AA', accent + '44', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, borderTopLeftRadius: 18, borderTopRightRadius: 18 }}
                  pointerEvents="none"
                />
                <View style={{ padding: 18 }}>
                  <Text style={[ts.focusEyebrow, { color: accent }]}>
                    {tr('today.focus.eyebrow', 'FOKUS DNIA', 'FOCUS OF THE DAY')}
                  </Text>
                  <Text style={[ts.focusPhrase, { color: textColor }]}>{focusPhrase}</Text>
                  <View style={ts.focusMeta}>
                    <CalendarDays color={accent + 'AA'} size={13} strokeWidth={1.6} />
                    <Text style={[ts.focusDate, { color: subColor }]}>
                      {(() => { const _d = new Date(); const DAYS_PL = ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota']; const MONTHS_PL = ['Stycznia','Lutego','Marca','Kwietnia','Maja','Czerwca','Lipca','Sierpnia','Września','Października','Listopada','Grudnia']; return `${DAYS_PL[_d.getDay()]}, ${_d.getDate()} ${MONTHS_PL[_d.getMonth()]}`; })()}
                    </Text>
                  </View>
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* ── NASTRÓJ DNIA ── */}
          <SectionCard accent={violetAccent} isLight={isLight} delay={80}>
            <Text style={[ts.sectionEyebrow, { color: violetAccent }]}>
              {tr('today.mood.eyebrow', 'NASTRÓJ DNIA', 'MOOD CHECK')}
            </Text>
            <Text style={[ts.sectionTitle, { color: textColor }]}>
              {tr('today.mood.title', 'Jak się teraz czujesz?', 'How are you feeling?')}
            </Text>
            <View style={ts.moodRow}>
              {MOODS.map(m => (
                <Pressable
                  key={m.key}
                  onPress={() => handleMoodSelect(m.key)}
                  style={[ts.moodBtn, {
                    backgroundColor: selectedMood === m.key
                      ? m.color + (isLight ? '22' : '1C')
                      : (isLight ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.05)'),
                    borderColor: selectedMood === m.key
                      ? m.color + '88'
                      : (isLight ? 'rgba(139,100,42,0.16)' : 'rgba(255,255,255,0.10)'),
                    transform: [{ scale: selectedMood === m.key ? 1.08 : 1 }],
                  }]}
                >
                  <Text style={ts.moodEmoji}>{m.icon}</Text>
                  <Text style={[ts.moodLabel, { color: selectedMood === m.key ? m.color : subColor }]}>
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </SectionCard>

          {/* ── POSTĘP DNIA ── */}
          <SectionCard accent={accent} isLight={isLight} delay={120}>
            <Text style={[ts.sectionEyebrow, { color: accent }]}>
              {tr('today.progress.eyebrow', 'POSTĘP DNIA', 'DAILY PROGRESS')}
            </Text>
            <Text style={[ts.sectionTitle, { color: textColor }]}>
              {totalDone === 0
                ? tr('today.progress.titleEmpty', 'Zacznij od pierwszego kroku', 'Start with the first step')
                : totalDone >= totalRituals
                ? tr('today.progress.titleDone', 'Wszystkie praktyki ukończone ✦', 'All practices completed ✦')
                : `${totalDone} / ${totalRituals} ${tr('today.progress.titlePartial', 'praktyk wykonanych', 'practices done')}`}
            </Text>
            <ProgressBar value={totalDone} max={totalRituals} accent={accent} isLight={isLight} />

            {/* 3 metrics */}
            <View style={[ts.metricRow, { borderTopColor: divColor, borderBottomColor: divColor }]}>
              {[
                { val: String(morningCount), label: tr('today.metric.morning', 'RANEK', 'MORNING') },
                { val: String(eveningCount), label: tr('today.metric.evening', 'WIECZÓR', 'EVENING') },
                { val: String(journalToday), label: tr('today.metric.journal', 'WPISY', 'ENTRIES') },
              ].map((m, i, arr) => (
                <React.Fragment key={m.label}>
                  {i > 0 && <View style={[ts.metricDiv, { backgroundColor: accent + '28' }]} />}
                  <View style={ts.metricCell}>
                    <Text style={[ts.metricVal, { color: accent }]}>{m.val}</Text>
                    <Text style={[ts.metricLabel, { color: subColor }]}>{m.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </SectionCard>

          {/* ── PORANNY RYTUAŁ ── */}
          <SectionCard accent={mintAccent} isLight={isLight} delay={160}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={[ts.sectionIconWrap, { backgroundColor: mintAccent + (isLight ? '25' : '1C'), borderColor: mintAccent + '55' }]}>
                <Sun color={mintAccent} size={20} strokeWidth={1.7} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[ts.sectionEyebrow, { color: mintAccent, marginBottom: 2 }]}>
                  {tr('today.morning.eyebrow', 'RYTUAŁ PORANNY', 'MORNING RITUAL')}
                </Text>
                <Text style={[ts.sectionTitle, { color: textColor, marginBottom: 0 }]}>
                  {morningCount === MORNING_RITUALS.length
                    ? tr('today.morning.titleDone', 'Poranek zamknięty ✓', 'Morning complete ✓')
                    : `${morningCount}/${MORNING_RITUALS.length} ${tr('today.morning.titlePartial', 'gotowe', 'done')}`}
                </Text>
              </View>
            </View>
            {MORNING_RITUALS.map(r => (
              <RitualCheckbox
                key={r.key}
                label={r.label}
                done={!!morningDone[r.key]}
                accent={mintAccent}
                isLight={isLight}
                onToggle={() => toggleMorning(r.key)}
              />
            ))}
          </SectionCard>

          {/* ── WIECZORNY RYTUAŁ ── */}
          <SectionCard accent={violetAccent} isLight={isLight} delay={200}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={[ts.sectionIconWrap, { backgroundColor: violetAccent + (isLight ? '25' : '1C'), borderColor: violetAccent + '55' }]}>
                <Moon color={violetAccent} size={20} strokeWidth={1.7} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[ts.sectionEyebrow, { color: violetAccent, marginBottom: 2 }]}>
                  {tr('today.evening.eyebrow', 'RYTUAŁ WIECZORNY', 'EVENING RITUAL')}
                </Text>
                <Text style={[ts.sectionTitle, { color: textColor, marginBottom: 0 }]}>
                  {eveningCount === EVENING_RITUALS.length
                    ? tr('today.evening.titleDone', 'Wieczór zamknięty ✓', 'Evening complete ✓')
                    : `${eveningCount}/${EVENING_RITUALS.length} ${tr('today.evening.titlePartial', 'gotowe', 'done')}`}
                </Text>
              </View>
            </View>
            {EVENING_RITUALS.map(r => (
              <RitualCheckbox
                key={r.key}
                label={r.label}
                done={!!eveningDone[r.key]}
                accent={violetAccent}
                isLight={isLight}
                onToggle={() => toggleEvening(r.key)}
              />
            ))}
          </SectionCard>

          {/* ── SZYBKIE LINKI ── */}
          <Animated.View entering={FadeInDown.delay(240).duration(320)}>
            <Text style={[ts.sectionHeading, { color: subColor }]}>
              {tr('today.quickLinks.heading', 'SZYBKIE WEJŚCIE', 'QUICK ACCESS')}
            </Text>
            <View style={ts.quickGrid}>
              <QuickLink icon={Brain}      label={tr('today.quickLinks.meditation', 'Medytacja', 'Meditation')} accent="#7C3AED" isLight={isLight} onPress={() => navigation.navigate('Meditation')}     delay={260} />
              <QuickLink icon={BookOpen}   label={tr('today.quickLinks.journal', 'Dziennik', 'Journal')}     accent={accent}   isLight={isLight} onPress={() => navigation.navigate('JournalEntry')} delay={290} />
              <QuickLink icon={Heart}      label={tr('today.quickLinks.affirmations', 'Afirmacje', 'Affirmations')} accent="#EC4899" isLight={isLight} onPress={() => navigation.navigate('Affirmations')} delay={320} />
              <QuickLink icon={Flame}      label={tr('today.quickLinks.ritual', 'Rytuał dnia', 'Ritual of the day')} accent="#F97316" isLight={isLight} onPress={() => navigation.navigate('DailyRitualAI')} delay={350} />
            </View>
          </Animated.View>

          {/* ── ENERGIA DNIA (SoulEngine insight) ── */}
          {dailyPlan.oracleMessage ? (
            <Animated.View entering={FadeInDown.delay(300).duration(320)} style={[ts.oracleCard, {
              backgroundColor: isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.04)',
              borderColor: isLight ? accent + '44' : accent + '22',
            }]}>
              <Sparkles color={accent} size={15} strokeWidth={1.8} style={{ marginRight: 10 }} />
              <Text style={[ts.oracleText, { color: isLight ? '#2A1F0E' : '#E8DFC8', flex: 1 }]} numberOfLines={4}>
                {dailyPlan.oracleMessage}
              </Text>
            </Animated.View>
          ) : null}

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const ts = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: layout.padding.screen,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  eyebrow: { fontSize: 10, fontFamily: 'Raleway_700Bold', letterSpacing: 2.8, marginBottom: 3 },
  greeting: { fontSize: 26, fontFamily: 'Cinzel_400Regular', letterSpacing: 0.5, lineHeight: 34 },
  sub: { fontSize: 13, fontFamily: 'Raleway_400Regular', marginTop: 4, lineHeight: 18 },

  moonPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1,
  },
  moonEmoji: { fontSize: 14 },
  moonName: { fontSize: 12, fontFamily: 'Raleway_600SemiBold', letterSpacing: 0.5 },

  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1,
  },
  streakText: { fontSize: 11, fontWeight: '700' },

  scroll: { paddingHorizontal: layout.padding.screen, paddingTop: 18 },

  // Focus card
  focusCardOuter: {
    marginBottom: 14, borderRadius: 18,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 8,
  },
  focusCard: {
    borderRadius: 18, borderWidth: 1,
    overflow: 'hidden',
  },
  focusEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2.2, marginBottom: 8 },
  focusPhrase: { fontSize: 19, fontWeight: '300', lineHeight: 28, letterSpacing: 0.1, fontFamily: 'serif', marginBottom: 12 },
  focusMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  focusDate: { fontSize: 12 },

  // Section cards content
  sectionEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 5 },
  sectionTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3, marginBottom: 12, lineHeight: 23 },
  sectionIconWrap: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Mood
  moodRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  moodBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  moodEmoji: { fontSize: 22, marginBottom: 4 },
  moodLabel: { fontSize: 11, fontWeight: '600' },

  // Metrics
  metricRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingVertical: 14, marginTop: 12,
    borderTopWidth: 1, borderBottomWidth: 1,
  },
  metricCell: { flex: 1, alignItems: 'center', gap: 3 },
  metricVal: { fontSize: 20, fontWeight: '700' },
  metricLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.2 },
  metricDiv: { width: 1, height: 28 },

  // Quick links
  sectionHeading: { fontSize: 10, fontWeight: '700', letterSpacing: 2.2, marginBottom: 10, marginTop: 2 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },

  // Oracle
  oracleCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderRadius: 16, borderWidth: 1,
    padding: 16, marginBottom: 14,
  },
  oracleText: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
});
