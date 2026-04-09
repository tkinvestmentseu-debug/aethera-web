// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  Dimensions, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withSpring, withSequence,
} from 'react-native-reanimated';
import {
  Brain, Wind, Heart, BookOpen, Layers, Sparkles, Moon, Zap, Droplets, Leaf,
  Music2, Circle, ChevronLeft, Star, CheckCircle2, ArrowRight,
  Flame, Target,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - layout.padding.screen * 2 - 10) / 2;
const GOLD = '#F59E0B';

// ─── Moon phase helper ───────────────────────────────────────────────────────
function getMoonPhase(date: Date): string {
  const phases = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
  const known = new Date('2000-01-06T18:14:00Z'); // known new moon
  const diff = (date.getTime() - known.getTime()) / (1000 * 60 * 60 * 24);
  const cycle = diff % 29.53059;
  const idx = Math.floor((cycle / 29.53059) * 8);
  return phases[Math.max(0, Math.min(7, idx))];
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getShortDayLabel(dayOffset: number): string {
  const labels = ['Nd', 'Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sb'];
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return labels[d.getDay()];
}

// ─── Habits data ─────────────────────────────────────────────────────────────
interface Habit {
  id: string;
  namePl: string;
  icon: React.ComponentType<any>;
  target: string;
  color: string;
  route: string | null;
}

const HABITS: Habit[] = [
  { id: 'meditation',  namePl: 'Medytacja',       icon: Brain,       target: '10 min',      color: '#6366F1', route: 'Meditation' },
  { id: 'breathwork',  namePl: 'Oddech',           icon: Wind,        target: '5 min',       color: '#38BDF8', route: 'Breathwork' },
  { id: 'gratitude',   namePl: 'Wdzięczność',      icon: Heart,       target: '3 rzeczy',    color: '#F472B6', route: 'Gratitude' },
  { id: 'journal',     namePl: 'Dziennik',          icon: BookOpen,    target: '1 wpis',      color: '#10B981', route: 'Journal' },
  { id: 'tarot',       namePl: 'Karta dnia',        icon: Layers,      target: '1 karta',     color: '#F59E0B', route: 'DailyTarot' },
  { id: 'affirmation', namePl: 'Afirmacja',         icon: Sparkles,    target: '3x',          color: '#818CF8', route: 'Affirmations' },
  { id: 'mooncheck',   namePl: 'Faza Księżyca',     icon: Moon,        target: '1x',          color: '#D4E6F1', route: 'LunarCalendar' },
  { id: 'movement',    namePl: 'Ruch',              icon: Zap,         target: '20 min',      color: '#F97316', route: null },
  { id: 'water',       namePl: 'Woda',              icon: Droplets,    target: '8 szklanek',  color: '#7EC8E3', route: null },
  { id: 'nature',      namePl: 'Natura',            icon: Leaf,        target: '10 min',      color: '#86EFAC', route: null },
  { id: 'mantra',      namePl: 'Mantra',            icon: Music2,      target: '108x',        color: '#C084FC', route: 'MantraGenerator' },
  { id: 'chakra',      namePl: 'Czakry',            icon: Circle,      target: '1 czakra',    color: '#EF4444', route: 'Chakra' },
];

// ─── Motivational message ────────────────────────────────────────────────────
function getMotivation(pct: number): string {
  if (pct === 0) return 'Zacznij swój dzień z intencją';
  if (pct < 0.5) return 'Dobry początek! Każda praktyka się liczy';
  if (pct < 1) return 'W połowie drogi! Kontynuuj';
  return 'Dzień ukończony! Piękna praktyka ✨';
}

// ─── Animated Habit Card ─────────────────────────────────────────────────────
const HabitCard = React.memo(({
  habit, completed, streak, onToggle, onNavigate, isLight, delay,
}: {
  habit: Habit;
  completed: boolean;
  streak: number;
  onToggle: () => void;
  onNavigate: () => void;
  isLight: boolean;
  delay: number;
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const Icon = habit.icon;

  const cardBg = isLight
    ? completed ? habit.color + '18' : 'rgba(240,228,210,0.90)'
    : completed ? habit.color + '18' : 'rgba(255,255,255,0.05)';
  const cardBorder = completed ? habit.color : isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)';
  const textColor = isLight ? '#1A1A2E' : '#F0EBE2';
  const subColor  = isLight ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.45)';

  const handleToggle = () => {
    scale.value = withSequence(withSpring(0.92, { damping: 6 }), withSpring(1, { damping: 6 }));
    void HapticsService.selection();
    onToggle();
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(450)} style={animStyle}>
      <Pressable onPress={handleToggle} onLongPress={onNavigate} style={[s.habitCard, { backgroundColor: cardBg, borderColor: cardBorder, width: CARD_W }]}>
        {/* Header row: icon + checkbox */}
        <View style={s.habitCardHeader}>
          <Pressable onPress={onNavigate} hitSlop={8} style={[s.habitIconWrap, { backgroundColor: habit.color + '22', borderColor: habit.color + '55' }]}>
            <Icon color={habit.color} size={18} strokeWidth={1.8} />
          </Pressable>
          <View style={[s.habitCheck, { borderColor: completed ? habit.color : isLight ? 'rgba(0,0,0,0.20)' : 'rgba(255,255,255,0.20)', backgroundColor: completed ? habit.color + '22' : 'transparent' }]}>
            {completed && <CheckCircle2 color={habit.color} size={16} strokeWidth={2} />}
          </View>
        </View>
        {/* Name */}
        <Text style={[s.habitName, { color: textColor }]} numberOfLines={1}>{habit.namePl}</Text>
        {/* Target */}
        <Text style={[s.habitTarget, { color: habit.color }]}>{habit.target}</Text>
        {/* Streak */}
        {streak > 0 && (
          <View style={s.habitStreakRow}>
            <Flame color={GOLD} size={11} strokeWidth={2} />
            <Text style={[s.habitStreakText, { color: subColor }]}>{streak} dni</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

// ─── Weekly heatmap dot ──────────────────────────────────────────────────────
const HeatDot = ({ pct, label, isToday, isLight }: { pct: number; label: string; isToday: boolean; isLight: boolean }) => {
  const filled = pct > 0.5;
  const partial = pct > 0 && pct <= 0.5;
  const labelColor = isLight ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.40)';
  return (
    <View style={s.heatDotWrap}>
      <View style={[
        s.heatDot,
        { borderColor: isToday ? GOLD : 'transparent',
          backgroundColor: filled ? GOLD : partial ? GOLD + '55' : isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)' },
      ]} />
      <Text style={[s.heatLabel, { color: isToday ? GOLD : labelColor }]}>{label}</Text>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export const SpiritualHabitsScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const dailyProgress = useAppStore(s => s.dailyProgress);
  const updateDailyProgress = useAppStore(s => s.updateDailyProgress);
  const { isLight } = useTheme();
  const textColor  = isLight ? '#1A1A2E' : '#F0EBE2';
  const subColor   = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.50)';
  const cardBg     = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.09)';

  const bgColors = isLight
    ? (['#F0F4FF', '#E8EEFF', '#F5F0FF'] as const)
    : (['#0A0E1A', '#0F1528', '#0A1020'] as const);

  const todayKey = getTodayKey();
  const moonPhase = getMoonPhase(new Date());

  // ── State ──────────────────────────────────────────────────────────────────
  const completedToday: Record<string, boolean> = (dailyProgress?.[todayKey]?.habits) ?? {};
  const [streaks, setStreaks]             = useState<Record<string, number>>(() =>
    Object.fromEntries(HABITS.map(h => [h.id, 0]))
  );
  const [aiGuidance, setAiGuidance]       = useState('');
  const [aiLoading, setAiLoading]         = useState(false);

  // ── Derived values ─────────────────────────────────────────────────────────
  const completedCount = useMemo(() => HABITS.filter(h => completedToday[h.id]).length, [completedToday]);
  const completionPct  = completedCount / HABITS.length;
  const progressBarW   = SW - layout.padding.screen * 2 - 32;

  // ── Top 3 habit streaks ────────────────────────────────────────────────────
  const topStreaks = useMemo(() => {
    return HABITS
      .map(h => ({ habit: h, streak: streaks[h.id] ?? 0 }))
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 3);
  }, [streaks]);

  // ── Weekly heatmap data ────────────────────────────────────────────────────
  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const offset = i - 6; // -6 to 0 (today = 0)
      const d = new Date();
      d.setDate(d.getDate() + offset);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dp = dailyProgress?.[key];
      let pct = 0;
      if (offset === 0) {
        pct = completionPct;
      } else if (dp?.habits) {
        const dayCount = Object.values(dp.habits).filter(Boolean).length;
        pct = dayCount / HABITS.length;
      } else if (dp?.energyScore) {
        pct = dp.energyScore / 100;
      }
      return { key, label: getShortDayLabel(offset), pct, isToday: offset === 0 };
    });
  }, [dailyProgress, completionPct]);

  // ── Toggle habit ───────────────────────────────────────────────────────────
  const toggleHabit = useCallback((id: string) => {
    const wasOn = completedToday[id];
    const next = { ...completedToday, [id]: !wasOn };
    updateDailyProgress(todayKey, { habits: next });
    setStreaks(prev => {
      const nextStreak = wasOn ? Math.max(0, (prev[id] ?? 0) - 1) : (prev[id] ?? 0) + 1;
      return { ...prev, [id]: nextStreak };
    });
  }, [completedToday, todayKey, updateDailyProgress]);

  // ── Navigate to habit screen ───────────────────────────────────────────────
  const navigateToHabit = useCallback((habit: Habit) => {
    if (habit.route) {
      void HapticsService.selection();
      navigation.navigate(habit.route);
    }
  }, [navigation]);

  // ── AI Guidance ────────────────────────────────────────────────────────────
  const fetchAiGuidance = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiGuidance('');
    try {
      const doneHabits = HABITS.filter(h => completedToday[h.id]).map(h => h.namePl);
      const pendingHabits = HABITS.filter(h => !completedToday[h.id]).map(h => h.namePl);
      const sign = userData?.zodiacSign ?? 'nieznany';
      const messages = [
        {
          role: 'user' as const,
          content: `Jestem osobą duchową, mój znak zodiaku to ${sign}. Dziś ukończyłem/am te duchowe nawyki: ${doneHabits.join(', ') || 'żaden'}. Pozostałe do wykonania: ${pendingHabits.join(', ')}. Na podstawie mojego znaku i wykonanych praktyk, wskaż mi: (1) który nawyk z listy powinienem/powinnam priorytetyzować dziś, i dlaczego, (2) jak zintegrować różne praktyki ze sobą w ciągu dnia. Odpowiedz w języku użytkownika, krótko i inspirująco (3-4 zdania).`,
        },
      ];
      const result = await AiService.chatWithOracle(messages);
      setAiGuidance(result);
    } catch {
      setAiGuidance('Nie udało się pobrać wskazówek. Spróbuj ponownie.');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Star / favorite ────────────────────────────────────────────────────────
  const isStarred = isFavoriteItem?.('spiritual-habits') ?? false;
  const handleStar = () => {
    void HapticsService.selection();
    if (isStarred) {
      removeFavoriteItem('spiritual-habits');
    } else {
      addFavoriteItem({ id: 'spiritual-habits', label: 'Nawyki Duchowe', route: 'SpiritualHabits', params: {}, icon: 'CheckCircle2', color: '#10B981', addedAt: new Date().toISOString() });
    }
  };

  // ── Medal colors ───────────────────────────────────────────────────────────
  const MEDALS = ['🥇', '🥈', '🥉'];

  return (
    <LinearGradient colors={bgColors} style={s.root}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* ── Header ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={s.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} hitSlop={12} style={s.backBtn}>
            <ChevronLeft color={isLight ? '#1A1A2E' : '#F0EBE2'} size={22} strokeWidth={2} />
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={[s.headerTitle, { color: textColor }]}>{t('spiritualHabits.nawyki_duchowe', 'NAWYKI DUCHOWE')}</Text>
            <Text style={[s.headerSub, { color: subColor }]}>{t('spiritualHabits.twoja_codzienna_praktyka', 'Twoja codzienna praktyka')}</Text>
          </View>
          <Pressable onPress={handleStar} hitSlop={12} style={s.starBtn}>
            <Star color={isStarred ? GOLD : isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.35)'}
              fill={isStarred ? GOLD : 'none'} size={20} strokeWidth={1.8} />
          </Pressable>
        </Animated.View>

        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Today's Overview ── */}
          <Animated.View entering={FadeInDown.delay(80).duration(450)}>
            <LinearGradient
              colors={['rgba(245,158,11,0.18)', 'rgba(245,158,11,0.06)', 'transparent']}
              style={[s.overviewCard, { borderColor: GOLD + '44' }]}
            >
              {/* Date + Moon */}
              <View style={s.overviewRow}>
                <Text style={[s.overviewDate, { color: textColor }]}>
                  {(() => { const _d = new Date(); const DN = ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota']; const MN = ['Stycznia','Lutego','Marca','Kwietnia','Maja','Czerwca','Lipca','Sierpnia','Września','Października','Listopada','Grudnia']; return `${DN[_d.getDay()]}, ${_d.getDate()} ${MN[_d.getMonth()]}`; })()}
                </Text>
                <Text style={s.moonEmoji}>{moonPhase}</Text>
              </View>

              {/* Progress bar */}
              <View style={s.progressBarRow}>
                <Text style={[s.progressLabel, { color: subColor }]}>{t('spiritualHabits.ukonczono_dzis', 'Ukończono dziś:')}</Text>
                <Text style={[s.progressCount, { color: GOLD }]}>{completedCount}/{HABITS.length}</Text>
              </View>
              <View style={[s.progressTrack, { width: progressBarW, backgroundColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)' }]}>
                <Animated.View style={[s.progressFill, { width: progressBarW * completionPct, backgroundColor: GOLD }]} />
              </View>

              {/* Streak badge + motivation */}
              <View style={s.overviewFooter}>
                <View style={[s.streakBadge, { borderColor: GOLD + '66', backgroundColor: GOLD + '18' }]}>
                  <Flame color={GOLD} size={13} strokeWidth={2} />
                  <Text style={[s.streakBadgeText, { color: GOLD }]}>
                    Seria: {Math.max(...Object.values(streaks), 0)} dni
                  </Text>
                </View>
                <Text style={[s.motivationText, { color: subColor }]}>{getMotivation(completionPct)}</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Habit Grid ── */}
          <Animated.View entering={FadeInDown.delay(160).duration(400)}>
            <Text style={[s.sectionTitle, { color: subColor }]}>{t('spiritualHabits.twoje_praktyki', 'TWOJE PRAKTYKI')}</Text>
          </Animated.View>

          <View style={s.habitGrid}>
            {HABITS.map((habit, i) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                completed={!!completedToday[habit.id]}
                streak={streaks[habit.id] ?? 0}
                onToggle={() => toggleHabit(habit.id)}
                onNavigate={() => navigateToHabit(habit)}
                isLight={isLight}
                delay={200 + i * 40}
              />
            ))}
          </View>

          {/* ── Weekly Heatmap ── */}
          <Animated.View entering={FadeInDown.delay(360).duration(400)}>
            <Text style={[s.sectionTitle, { color: subColor }]}>{t('spiritualHabits.ostatnie_7_dni', 'OSTATNIE 7 DNI')}</Text>
            <View style={[s.heatmapCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={s.heatmapRow}>
                {weekData.map(d => (
                  <HeatDot key={d.key} pct={d.pct} label={d.label} isToday={d.isToday} isLight={isLight} />
                ))}
              </View>
              <Text style={[s.heatmapHint, { color: subColor }]}>
                {t('spiritualHabits.zlote_kolko_gt_50_nawykow', 'Złote kółko = &gt;50% nawyków ukończonych')}
              </Text>
            </View>
          </Animated.View>

          {/* ── Streak Leaderboard ── */}
          <Animated.View entering={FadeInDown.delay(420).duration(400)}>
            <Text style={[s.sectionTitle, { color: subColor }]}>{t('spiritualHabits.twoje_serie', 'TWOJE SERIE')}</Text>
            <View style={s.leaderRow}>
              {topStreaks.map(({ habit, streak }, idx) => {
                const Icon = habit.icon;
                return (
                  <View key={habit.id} style={[s.leaderCard, { backgroundColor: cardBg, borderColor: idx === 0 ? GOLD + '55' : cardBorder }]}>
                    <Text style={s.medal}>{MEDALS[idx]}</Text>
                    <View style={[s.leaderIconWrap, { backgroundColor: habit.color + '22' }]}>
                      <Icon color={habit.color} size={16} strokeWidth={1.8} />
                    </View>
                    <Text style={[s.leaderName, { color: textColor }]} numberOfLines={1}>{habit.namePl}</Text>
                    <Text style={[s.leaderStreak, { color: GOLD }]}>{streak} dni</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          {/* ── AI Daily Guidance ── */}
          <Animated.View entering={FadeInDown.delay(480).duration(400)}>
            <Text style={[s.sectionTitle, { color: subColor }]}>{t('spiritualHabits.wskazowki_ai', 'WSKAZÓWKI AI')}</Text>
            <Pressable
              onPress={fetchAiGuidance}
              disabled={aiLoading}
              style={({ pressed }) => [s.aiBtn, { opacity: pressed ? 0.8 : 1, borderColor: '#818CF8' + '66', backgroundColor: '#818CF8' + '12' }]}
            >
              <Sparkles color="#818CF8" size={18} strokeWidth={1.8} />
              <Text style={[s.aiBtnText, { color: '#818CF8' }]}>
                {aiLoading ? 'Generuję wskazówki...' : 'Moje Wskazówki na Dziś'}
              </Text>
              <ArrowRight color="#818CF8" size={16} strokeWidth={2} />
            </Pressable>

            {aiGuidance !== '' && (
              <Animated.View entering={FadeInUp.duration(350)}>
                <LinearGradient
                  colors={['rgba(129,140,248,0.15)', 'rgba(129,140,248,0.05)', 'transparent']}
                  style={[s.aiCard, { borderColor: '#818CF8' + '44' }]}
                >
                  <Text style={[s.aiCardText, { color: textColor }]}>{aiGuidance}</Text>
                </LinearGradient>
              </Animated.View>
            )}
          </Animated.View>

          {/* ── Habit Ritual Suggestion ── */}
          <Animated.View entering={FadeInDown.delay(520).duration(400)}>
            <Pressable
              onPress={() => { void HapticsService.selection(); navigation.navigate('MorningRitual'); }}
              style={({ pressed }) => [s.ritualBtn, { opacity: pressed ? 0.82 : 1 }]}
            >
              <LinearGradient
                colors={['rgba(245,158,11,0.22)', 'rgba(245,158,11,0.08)']}
                style={s.ritualBtnInner}
              >
                <Flame color={GOLD} size={20} strokeWidth={1.8} />
                <View style={s.ritualBtnText}>
                  <Text style={[s.ritualBtnTitle, { color: GOLD }]}>{t('spiritualHabits.zaproponuj_rytual', 'ZAPROPONUJ RYTUAŁ')}</Text>
                  <Text style={[s.ritualBtnSub, { color: isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.50)' }]}>
                    {t('spiritualHabits.poranny_rytual_5_etapow_wiele', 'Poranny Rytuał — 5 etapów, wiele nawyków naraz')}
                  </Text>
                </View>
                <ArrowRight color={GOLD} size={18} strokeWidth={2} />
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── CO DALEJ? ── */}
          <Animated.View entering={FadeInDown.delay(560).duration(400)}>
            <Text style={[s.sectionTitle, { color: subColor }]}>{t('spiritualHabits.co_dalej', 'CO DALEJ?')}</Text>
          </Animated.View>

          {([
            { label: 'Poranny Rytuał',   sub: '5 praktyk naraz',        route: 'MorningRitual',  color: GOLD,      Icon: Flame },
            { label: 'Medytacja',        sub: 'Wycisz umysł',           route: 'Meditation',     color: '#6366F1', Icon: Brain },
            { label: 'Tablica Wizji',    sub: 'Kosmiczne intencje',      route: 'VisionBoard',    color: '#A78BFA', Icon: Target },
          ] as const).map((item, i) => (
            <Animated.View key={item.route} entering={FadeInDown.delay(580 + i * 50).duration(380)}>
              <Pressable
                onPress={() => { void HapticsService.selection(); navigation.navigate(item.route); }}
                style={({ pressed }) => [s.nextCard, { borderColor: item.color + '44', backgroundColor: item.color + '0C', opacity: pressed ? 0.82 : 1 }]}
              >
                <View style={[s.nextIconWrap, { backgroundColor: item.color + '22' }]}>
                  <item.Icon color={item.color} size={18} strokeWidth={1.8} />
                </View>
                <View style={s.nextTextWrap}>
                  <Text style={[s.nextTitle, { color: textColor }]}>{item.label}</Text>
                  <Text style={[s.nextSub, { color: subColor }]}>{item.sub}</Text>
                </View>
                <ArrowRight color={item.color} size={16} strokeWidth={2} />
              </Pressable>
            </Animated.View>
          ))}

          <EndOfContentSpacer />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.padding.screen, paddingTop: 6, paddingBottom: 12,
  },
  backBtn:      { padding: 4 },
  starBtn:      { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 14, fontWeight: '800', letterSpacing: 3, marginBottom: 2 },
  headerSub:    { fontSize: 12, fontWeight: '500', letterSpacing: 0.3 },
  scroll:       { paddingHorizontal: layout.padding.screen, paddingTop: 4 },

  // Overview card
  overviewCard: {
    borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 22,
  },
  overviewRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  overviewDate:   { fontSize: 14, fontWeight: '600', textTransform: 'capitalize', flex: 1 },
  moonEmoji:      { fontSize: 28, marginLeft: 8 },
  progressBarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel:  { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  progressCount:  { fontSize: 16, fontWeight: '800' },
  progressTrack:  { height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  progressFill:   { height: '100%', borderRadius: 4 },
  overviewFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  streakBadgeText: { fontSize: 12, fontWeight: '700' },
  motivationText:  { fontSize: 12, flex: 1 },

  // Section titles
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 12, marginTop: 4 },

  // Habit grid
  habitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  habitCard: {
    borderRadius: 16, borderWidth: 1.5, padding: 12, minHeight: 112,
  },
  habitCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  habitIconWrap: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  habitCheck: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  habitName:       { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  habitTarget:     { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  habitStreakRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  habitStreakText: { fontSize: 10, fontWeight: '500' },

  // Heatmap
  heatmapCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 22,
  },
  heatmapRow:  { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  heatDotWrap: { alignItems: 'center', gap: 6 },
  heatDot:     { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
  heatLabel:   { fontSize: 10, fontWeight: '600' },
  heatmapHint: { fontSize: 10, textAlign: 'center', marginTop: 4 },

  // Leaderboard
  leaderRow:    { flexDirection: 'row', gap: 10, marginBottom: 22 },
  leaderCard: {
    flex: 1, borderRadius: 14, borderWidth: 1, padding: 12,
    alignItems: 'center', gap: 6,
  },
  medal:         { fontSize: 20 },
  leaderIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  leaderName:    { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  leaderStreak:  { fontSize: 13, fontWeight: '800' },

  // AI
  aiBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12,
  },
  aiBtnText: { flex: 1, fontSize: 14, fontWeight: '700' },
  aiCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 22,
  },
  aiCardText: { fontSize: 14, lineHeight: 22 },

  // Ritual suggestion
  ritualBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 22 },
  ritualBtnInner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16,
  },
  ritualBtnText:  { flex: 1 },
  ritualBtnTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  ritualBtnSub:   { fontSize: 12 },

  // CO DALEJ cards
  nextCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10,
  },
  nextIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nextTextWrap: { flex: 1 },
  nextTitle:    { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  nextSub:      { fontSize: 12 },
});
