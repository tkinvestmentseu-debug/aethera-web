// @ts-nocheck
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Star,
  Sparkles,
  Wind,
  Moon,
  Flame,
  Leaf,
  BookOpen,
  Heart,
  Zap,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { Typography } from '../components/Typography';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { RITUALS, type Ritual } from '../features/rituals/data';
import { CATEGORY_TILES } from './RitualsScreen';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#CEAE72';

// ── DIFFICULTY HELPERS ────────────────────────────────────────
const DIFFICULTY_LABEL: Record<string, string> = {
  gentle: 'Łagodny',
  grounded: 'Zakorzeniony',
  ceremonial: 'Ceremonialny',
};

const DIFFICULTY_STARS: Record<string, string> = {
  gentle: '⭐',
  grounded: '⭐⭐',
  ceremonial: '⭐⭐⭐',
};

// Truncate description to ~100 chars
const snippet = (text: string, len = 100) =>
  text.length <= len ? text : text.slice(0, len).replace(/\s\S*$/, '') + '…';

// ── FEATURED RITUAL OF THE DAY ────────────────────────────────
const DAILY_FEATURED: Record<number, {
  emoji: string;
  title: string;
  description: string;
  gradient: [string, string, string];
  route?: string;
  category?: string;
}> = {
  1: { // Monday
    emoji: '🛡️',
    title: 'Rytuał Ochrony',
    description: 'Poniedziałek niesie energię nowych początków. Otocz się tarczą intencji — wyznacz granice, które dziś cię wzmocnią.',
    gradient: ['#4A3875', '#2E1F5C', '#1A0F3A'],
    category: 'Protection',
  },
  2: { // Tuesday
    emoji: '⚡',
    title: 'Rytuał Energii',
    description: 'Wtorek pulsuje siłą i działaniem. Wzbudź ogień wewnętrzny — rozbudź ciało, zapal wolę, rusz do przodu.',
    gradient: ['#7A2323', '#5C1A1A', '#3A0F0F'],
    category: 'Healing',
  },
  3: { // Wednesday
    emoji: '🗣️',
    title: 'Rytuał Komunikacji',
    description: 'Środa to dzień słowa i połączenia. Oczyść gardło, wypowiedz intencje — niech to, co mówisz, płynie z serca.',
    gradient: ['#1A4A5A', '#0F2E3A', '#071A22'],
    category: 'Vision',
  },
  4: { // Thursday
    emoji: '🌿',
    title: 'Rytuał Obfitości',
    description: 'Czwartek sprzyja rozrostowi i dobrobytu. Zasiej ziarno wdzięczności — otwórz się na hojność wszechświata.',
    gradient: ['#1A4A2A', '#0F3018', '#072010'],
    category: 'Abundance',
  },
  5: { // Friday
    emoji: '💗',
    title: 'Rytuał Miłości',
    description: 'Piątek należy do serca. Celebruj bliskość — z sobą, z innymi, ze światem. Puść lęk, otwórz przestrzeń.',
    gradient: ['#6B2040', '#4A1030', '#2E0820'],
    category: 'Love',
  },
  6: { // Saturday
    emoji: '📖',
    title: 'Rytuał Mądrości',
    description: 'Sobota zaprasza do refleksji i głębszego rozumienia. Usiądź w ciszy — czego prosi cię dziś twoja dusza?',
    gradient: ['#4A3010', '#3A2008', '#251504'],
    category: 'Vision',
  },
  0: { // Sunday
    emoji: '🙏',
    title: 'Rytuał Wdzięczności',
    description: 'Niedziela to czas świętowania i powrotu do korzeni. Docień wszystko, co masz — i poczuj, jak to rośnie.',
    gradient: ['#1A3A5A', '#0F2540', '#071828'],
    category: 'Manifestation',
  },
};

// ── SEASONAL RITUAL PATHS ─────────────────────────────────────
type Season = 'Wiosna' | 'Lato' | 'Jesień' | 'Zima';

function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'Wiosna';
  if (month >= 6 && month <= 8) return 'Lato';
  if (month >= 9 && month <= 11) return 'Jesień';
  return 'Zima';
}

const SEASONS: Array<{ id: Season; emoji: string; color: string; hint: string }> = [
  { id: 'Wiosna', emoji: '🌱', color: '#5BAD6F', hint: 'Odrodzenie, nowe początki' },
  { id: 'Lato',   emoji: '☀️', color: '#E8A838', hint: 'Pełnia, manifestacja' },
  { id: 'Jesień', emoji: '🍂', color: '#C87840', hint: 'Zbieranie plonów, puszczanie' },
  { id: 'Zima',   emoji: '❄️', color: '#7AAFCC', hint: 'Cisza, regeneracja, głębia' },
];

const SEASON_CATEGORIES: Record<Season, string[]> = {
  Wiosna: ['Manifestation', 'NewBeginning', 'Creativity', 'Morning'],
  Lato:   ['Love', 'Abundance', 'Vision', 'Creativity'],
  Jesień: ['Transformation', 'Moon', 'Healing', 'Cleansing'],
  Zima:   ['Support', 'Sleep', 'Protection', 'Vision'],
};

// ── GUIDED PATHS ──────────────────────────────────────────────
const GUIDED_PATHS = [
  {
    id: 'beginner',
    emoji: '🌱',
    title: 'Ścieżka Początkującego',
    desc: 'Łagodne, przystępne rytuały od 5 do 10 minut. Idealne, by zbudować codzienny nawyk ceremonialny bez przytłoczenia.',
    sub: '5–10 min · Łagodny poziom',
    gradient: ['#1A3A2A', '#0F2518', '#07180F'] as [string, string, string],
    color: '#5BAD6F',
    difficulties: ['gentle'],
  },
  {
    id: 'intense',
    emoji: '🔥',
    title: 'Ścieżka Intensywna',
    desc: 'Głęboka praca ceremonialna dla tych, którzy są gotowi na pełne zanurzenie. Od 20 do 30 minut transformacyjnej praktyki.',
    sub: '20–30 min · Ceremonialny poziom',
    gradient: ['#3A1A0A', '#2A1005', '#1A0800'] as [string, string, string],
    color: '#E87040',
    difficulties: ['ceremonial'],
  },
  {
    id: 'lunar',
    emoji: '☽',
    title: 'Ścieżka Księżycowa',
    desc: 'Rytuały zsynchronizowane z cyklami księżyca. Pracuj z nowiem, pełnią i fazami pośrednimi dla głębokiej przemiany.',
    sub: 'Fazy księżyca · Cykliczna praca',
    gradient: ['#1A1A3A', '#0F0F2A', '#07071A'] as [string, string, string],
    color: '#9A7AE8',
    difficulties: ['gentle', 'grounded'],
    category: 'Moon',
  },
];

// ── MINI RITUAL STEPS ─────────────────────────────────────────
const MINI_STEPS = [
  { emoji: '🌬️', label: 'Oddech', desc: 'Weź 3 głębokie oddechy. Wdech 4s, zatrzymaj 4s, wydech 6s.' },
  { emoji: '🕯️', label: 'Intencja', desc: 'Wypowiedz w myślach lub głośno jedną intencję na ten dzień.' },
  { emoji: '🙏', label: 'Zamknięcie', desc: 'Połóż rękę na sercu. Podziękuj sobie za tę chwilę obecności.' },
];

const MINI_TOTAL_SECONDS = 180; // 3 minutes

// ── RITUAL CARD ───────────────────────────────────────────────
interface RitualCardProps {
  ritual: Ritual;
  color: string;
  isLight: boolean;
  onPress: () => void;
  delay: number;
}

const RitualCard: React.FC<RitualCardProps> = ({ ritual, color, isLight, onPress, delay }) => {
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';
  const meta = CATEGORY_TILES.find(c => c.id === ritual.category);
  const Icon = meta?.icon;

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(440)}>
      <Pressable
        onPress={() => { void HapticsService.impact('light'); onPress(); }}
        style={({ pressed }) => [
          styles.ritualCard,
          {
            backgroundColor: cardBg,
            borderColor: pressed ? color + '55' : cardBorder,
            opacity: pressed ? 0.88 : 1,
          },
        ]}
      >
        <LinearGradient
          colors={[color + '14', color + '04']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject as any, { borderRadius: 20 }]}
        />

        {/* Top row: icon + title + duration */}
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: color + '22', borderColor: color + '33' }]}>
            {Icon ? <Icon color={color} size={22} strokeWidth={1.5} /> : null}
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Typography variant="cardTitle" style={{ color: textColor, fontSize: 15, lineHeight: 21 }}>
              {ritual.title}
            </Typography>
            <View style={styles.cardMeta}>
              <View style={[styles.durationPill, { backgroundColor: color + '1A' }]}>
                <Clock color={color} size={11} strokeWidth={2} />
                <Typography variant="microLabel" style={{ color, marginLeft: 4, fontSize: 10 }}>
                  {ritual.duration}
                </Typography>
              </View>
              <Typography variant="microLabel" style={{ color: subColor, marginLeft: 8, fontSize: 11 }}>
                {DIFFICULTY_STARS[ritual.difficulty]} {DIFFICULTY_LABEL[ritual.difficulty]}
              </Typography>
            </View>
          </View>
          <View style={[styles.startBtn, { backgroundColor: color + '1A', borderColor: color + '33' }]}>
            <Typography variant="microLabel" style={{ color, fontSize: 10, letterSpacing: 0.5 }}>ZACZNIJ</Typography>
          </View>
        </View>

        {/* Description snippet */}
        <Typography variant="bodySmall" style={{ color: subColor, marginTop: 10, lineHeight: 20, fontSize: 13 }}>
          {snippet(ritual.description)}
        </Typography>

        {/* Bottom row: best moment */}
        {ritual.bestMoment ? (
          <View style={[styles.bestMomentRow, { borderTopColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.06)' }]}>
            <Typography variant="microLabel" style={{ color: color, fontSize: 10, letterSpacing: 0.5 }}>
              🕐 {ritual.bestMoment.slice(0, 60)}{ritual.bestMoment.length > 60 ? '…' : ''}
            </Typography>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
};

// ── FEATURED RITUAL HERO CARD ─────────────────────────────────
const FeaturedRitualCard: React.FC<{
  isLight: boolean;
  navigation: any;
}> = ({ isLight, navigation }) => {
  const dow = new Date().getDay(); // 0=Sun .. 6=Sat
  const featured = DAILY_FEATURED[dow];
  const subColor = 'rgba(255,255,255,0.72)';

  const handlePress = useCallback(() => {
    void HapticsService.impact('medium');
    if (featured.category) {
      const cat = CATEGORY_TILES.find(c => c.id === featured.category);
      if (cat) {
        navigation.navigate('RitualCategorySelection', {
          categoryId: cat.id,
          categoryLabel: cat.label,
          categoryEmoji: cat.emoji,
          categoryColor: cat.color,
        });
      }
    }
  }, [featured, navigation]);

  return (
    <Animated.View entering={FadeInDown.delay(60).duration(520)} style={styles.featuredWrapper}>
      <Pressable onPress={handlePress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
        <LinearGradient
          colors={featured.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredCard}
        >
          {/* Decorative shimmer layer */}
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject as any, { borderRadius: 24 }]}
          />

          <View style={styles.featuredTopRow}>
            <View style={styles.featuredDayBadge}>
              <Typography variant="microLabel" style={[{ color: 'rgba(255,255,255,0.80)', fontSize: 9, letterSpacing: 2 }, isLight && { color: 'rgba(37,29,22,0.85)' }]}>
                RYTUAŁ DNIA
              </Typography>
            </View>
            <Sparkles color="rgba(255,255,255,0.60)" size={16} strokeWidth={1.5} />
          </View>

          <Typography style={{ fontSize: 44, marginTop: 10, marginBottom: 8 }}>
            {featured.emoji}
          </Typography>

          <Typography variant="screenTitle" style={{ color: '#FFFFFF', fontSize: 20, lineHeight: 26, marginBottom: 8 }}>
            {featured.title}
          </Typography>

          <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 21, fontSize: 13, marginBottom: 20 }}>
            {featured.description}
          </Typography>

          <Pressable
            onPress={handlePress}
            style={({ pressed }) => [styles.featuredBtn, { opacity: pressed ? 0.80 : 1 }]}
          >
            <Typography variant="microLabel" style={{ color: '#FFFFFF', fontSize: 12, letterSpacing: 1 }}>
              ZACZNIJ TERAZ
            </Typography>
            <ChevronRight color="#FFFFFF" size={14} strokeWidth={2} style={{ marginLeft: 4 }} />
          </Pressable>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

// ── GUIDED PATH CARD ──────────────────────────────────────────
const GuidedPathCard: React.FC<{
  path: typeof GUIDED_PATHS[0];
  isLight: boolean;
  navigation: any;
  delay: number;
}> = ({ path, isLight, navigation, delay }) => {
  const handlePress = useCallback(() => {
    void HapticsService.impact('light');
    if (path.category) {
      const cat = CATEGORY_TILES.find(c => c.id === path.category);
      if (cat) {
        navigation.navigate('RitualCategorySelection', {
          categoryId: cat.id,
          categoryLabel: cat.label,
          categoryEmoji: cat.emoji,
          categoryColor: cat.color,
        });
      }
    } else {
      // Filter by difficulty
      const matching = RITUALS.filter(r => path.difficulties.includes(r.difficulty));
      if (matching.length > 0) {
        navigation.navigate('RitualDetail', { ritualId: matching[0].id });
      }
    }
  }, [path, navigation]);

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(460)}>
      <Pressable onPress={handlePress} style={({ pressed }) => [{ opacity: pressed ? 0.90 : 1, marginBottom: 10 }]}>
        <LinearGradient
          colors={path.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.guidedPathCard}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject as any, { borderRadius: 20 }]}
          />

          <View style={[styles.guidedPathIcon, { backgroundColor: path.color + '28', borderColor: path.color + '44' }]}>
            <Typography style={{ fontSize: 22 }}>{path.emoji}</Typography>
          </View>

          <View style={{ flex: 1, marginLeft: 14 }}>
            <Typography variant="cardTitle" style={{ color: isLight ? '#251D16' : '#F0EBE2', fontSize: 15, lineHeight: 20 }}>
              {path.title}
            </Typography>
            <Typography variant="microLabel" style={{ color: path.color, fontSize: 10, letterSpacing: 0.5, marginTop: 2, marginBottom: 6 }}>
              {path.sub}
            </Typography>
            <Typography variant="bodySmall" style={{ color: isLight ? 'rgba(37,29,22,0.6)' : 'rgba(255,255,255,0.60)', fontSize: 12, lineHeight: 18 }}>
              {path.desc}
            </Typography>
          </View>

          <ChevronRight color={path.color} size={18} strokeWidth={1.8} style={{ marginLeft: 8, flexShrink: 0 }} />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

// ── SEASONAL CHIPS ────────────────────────────────────────────
const SeasonalChips: React.FC<{
  selected: Season | null;
  onSelect: (s: Season | null) => void;
  isLight: boolean;
}> = ({ selected, onSelect, isLight }) => {
  const currentSeason = getCurrentSeason();
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.09)';

  return (
    <Animated.View entering={FadeInDown.delay(220).duration(460)}>
      <View style={styles.sectionRow}>
        <Typography variant="microLabel" style={{ color: subColor, letterSpacing: 3, fontSize: 10 }}>
          RYTUAŁY SEZONOWE
        </Typography>
        <Typography variant="microLabel" style={{ color: ACCENT, fontSize: 10, letterSpacing: 0.5 }}>
          Teraz: {currentSeason}
        </Typography>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
          {SEASONS.map(s => {
            const isActive = selected === s.id;
            const isCurrent = s.id === currentSeason;
            return (
              <Pressable
                key={s.id}
                onPress={() => { void HapticsService.impact('light'); onSelect(isActive ? null : s.id); }}
                style={[
                  styles.seasonChip,
                  {
                    backgroundColor: isActive ? s.color + '28' : cardBg,
                    borderColor: isActive ? s.color + '88' : isCurrent ? s.color + '44' : cardBorder,
                  },
                ]}
              >
                <Typography style={{ fontSize: 16 }}>{s.emoji}</Typography>
                <View style={{ marginLeft: 6 }}>
                  <Typography
                    variant="microLabel"
                    style={{
                      color: isActive ? s.color : isLight ? '#1A1A1A' : '#F0EBE2',
                      fontSize: 12,
                      fontWeight: isActive ? '700' : '500',
                    }}
                  >
                    {s.id}
                  </Typography>
                  <Typography variant="microLabel" style={{ color: subColor, fontSize: 9, marginTop: 1 }}>
                    {s.hint}
                  </Typography>
                </View>
                {isCurrent && !isActive && (
                  <View style={[styles.currentDot, { backgroundColor: s.color }]} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Animated.View>
  );
};

// ── MINI RITUAL CARD ──────────────────────────────────────────
const MiniRitualCard: React.FC<{ isLight: boolean }> = ({ isLight }) => {
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(MINI_TOTAL_SECONDS);
  const [activeStep, setActiveStep] = useState(0);
  const timerRef = useRef<any>(null);

  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.04)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';

  const pct = 1 - secondsLeft / MINI_TOTAL_SECONDS;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  // Update active step based on time elapsed
  useEffect(() => {
    const elapsed = MINI_TOTAL_SECONDS - secondsLeft;
    if (elapsed < 60) setActiveStep(0);
    else if (elapsed < 120) setActiveStep(1);
    else setActiveStep(2);
  }, [secondsLeft]);

  const startTimer = useCallback(() => {
    if (timerRunning) {
      // Pause
      clearInterval(timerRef.current);
      setTimerRunning(false);
      void HapticsService.impact('light');
      return;
    }
    if (secondsLeft === 0) {
      // Reset
      setSecondsLeft(MINI_TOTAL_SECONDS);
      setActiveStep(0);
    }
    void HapticsService.impact('medium');
    setTimerRunning(true);
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerRunning(false);
          HapticsService.notify();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timerRunning, secondsLeft]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <Animated.View entering={FadeInDown.delay(280).duration(480)}>
      <View style={[styles.miniCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <LinearGradient
          colors={[ACCENT + '12', ACCENT + '04']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject as any, { borderRadius: 20 }]}
        />

        {/* Header row */}
        <View style={styles.miniHeader}>
          <View>
            <Typography variant="microLabel" style={{ color: ACCENT, letterSpacing: 2, fontSize: 9 }}>
              MINI RYTUAŁ
            </Typography>
            <Typography variant="cardTitle" style={{ color: textColor, fontSize: 16, marginTop: 2 }}>
              Masz 3 minuty?
            </Typography>
            <Typography variant="bodySmall" style={{ color: subColor, fontSize: 12, marginTop: 2 }}>
              Trzy kroki do wewnętrznego spokoju
            </Typography>
          </View>

          {/* Timer button */}
          <Pressable
            onPress={startTimer}
            style={({ pressed }) => [
              styles.timerBtn,
              {
                backgroundColor: timerRunning ? ACCENT + '28' : ACCENT + '18',
                borderColor: timerRunning ? ACCENT + '88' : ACCENT + '44',
                opacity: pressed ? 0.80 : 1,
              },
            ]}
          >
            {/* Progress ring (simple border trick) */}
            <Typography variant="microLabel" style={{ color: ACCENT, fontSize: 15, fontWeight: '700', letterSpacing: -0.5 }}>
              {secondsLeft === 0 ? '✓' : timeStr}
            </Typography>
            <Typography variant="microLabel" style={{ color: ACCENT, fontSize: 8, marginTop: 2, letterSpacing: 0.5 }}>
              {timerRunning ? 'PAUZA' : secondsLeft === MINI_TOTAL_SECONDS ? 'START' : secondsLeft === 0 ? 'RESET' : 'WZNÓW'}
            </Typography>
          </Pressable>
        </View>

        {/* Steps */}
        <View style={[styles.miniStepsRow, { borderTopColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.06)' }]}>
          {MINI_STEPS.map((step, i) => {
            const isActive = activeStep === i && (timerRunning || secondsLeft < MINI_TOTAL_SECONDS);
            const isDone = secondsLeft < MINI_TOTAL_SECONDS && i < activeStep;
            return (
              <View
                key={step.label}
                style={[
                  styles.miniStep,
                  {
                    backgroundColor: isActive
                      ? ACCENT + '1A'
                      : isDone
                      ? isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)'
                      : 'transparent',
                    borderColor: isActive ? ACCENT + '55' : 'transparent',
                    flex: 1,
                  },
                ]}
              >
                <Typography style={{ fontSize: 20, marginBottom: 4, opacity: isDone ? 0.40 : 1 }}>
                  {isDone ? '✅' : step.emoji}
                </Typography>
                <Typography
                  variant="microLabel"
                  style={{
                    color: isActive ? ACCENT : textColor,
                    fontSize: 11,
                    fontWeight: isActive ? '700' : '500',
                    textAlign: 'center',
                    marginBottom: 2,
                  }}
                >
                  {step.label}
                </Typography>
                <Typography
                  variant="bodySmall"
                  style={{ color: subColor, fontSize: 10, lineHeight: 14, textAlign: 'center' }}
                >
                  {step.desc}
                </Typography>
              </View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
};

// ── CO DALEJ CARD ─────────────────────────────────────────────
const CoDalejSection: React.FC<{
  isLight: boolean;
  navigation: any;
}> = ({ isLight, navigation }) => {
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.04)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';

  const actions = [
    {
      emoji: '🔮',
      label: 'Rytuał AI',
      desc: 'Wygeneruj ceremonię szytą na miarę',
      color: '#9A7AE8',
      onPress: () => { void HapticsService.impact('light'); navigation.navigate('DailyRitualAI'); },
    },
    {
      emoji: '📓',
      label: 'Dziennik',
      desc: 'Zapisz intencję po rytuale',
      color: '#5BAD6F',
      onPress: () => {
        void HapticsService.impact('light');
        navigation.navigate('JournalEntry', { prompt: 'Co chcę uwolnić lub przyciągnąć po tym rytuale?' });
      },
    },
    {
      emoji: '🪄',
      label: 'Intencje',
      desc: 'Karty z intencjami na dziś',
      color: ACCENT,
      onPress: () => { void HapticsService.impact('light'); navigation.navigate('IntentionCards'); },
    },
  ];

  return (
    <Animated.View entering={FadeInDown.delay(340).duration(480)}>
      <Typography variant="microLabel" style={{ color: subColor, letterSpacing: 3, fontSize: 10, marginBottom: 14 }}>
        CO DALEJ?
      </Typography>
      {actions.map((action, i) => (
        <Animated.View key={action.label} entering={FadeInUp.delay(360 + i * 60).duration(420)}>
          <Pressable
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.coDalejRow,
              {
                backgroundColor: cardBg,
                borderColor: pressed ? action.color + '55' : cardBorder,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <LinearGradient
              colors={[action.color + '14', action.color + '04']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFillObject as any, { borderRadius: 16 }]}
            />
            <View style={[styles.coDalejIcon, { backgroundColor: action.color + '20', borderColor: action.color + '33' }]}>
              <Typography style={{ fontSize: 20 }}>{action.emoji}</Typography>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Typography variant="cardTitle" style={{ color: textColor, fontSize: 14 }}>{action.label}</Typography>
              <Typography variant="bodySmall" style={{ color: subColor, fontSize: 12, marginTop: 2 }}>{action.desc}</Typography>
            </View>
            <ChevronRight color={action.color} size={18} strokeWidth={1.8} />
          </Pressable>
        </Animated.View>
      ))}
    </Animated.View>
  );
};

// ── ALL-CATEGORIES VIEW ───────────────────────────────────────
const AllCategoriesView: React.FC<{
  isLight: boolean;
  navigation: any;
  textColor: string;
  subColor: string;
}> = ({ isLight, navigation, textColor, subColor }) => {
  const { t } = useTranslation();
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';
  const divColor = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)';

  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);

  // Compute highlighted category ids for selected season
  const highlightedCategories = useMemo(() => {
    if (!selectedSeason) return null;
    return new Set(SEASON_CATEGORIES[selectedSeason]);
  }, [selectedSeason]);

  const sortedCategories = useMemo(() => {
    if (!highlightedCategories) return CATEGORY_TILES;
    // Highlighted first, then rest
    const highlighted = CATEGORY_TILES.filter(c => highlightedCategories.has(c.id));
    const rest = CATEGORY_TILES.filter(c => !highlightedCategories.has(c.id));
    return [...highlighted, ...rest];
  }, [highlightedCategories]);

  return (
    <>
      {/* ── FEATURED RITUAL ── */}
      <FeaturedRitualCard isLight={isLight} navigation={navigation} />

      <View style={[styles.divider, { backgroundColor: divColor, marginVertical: 20 }]} />

      {/* ── ŚCIEŻKI RYTUALNE ── */}
      <Animated.View entering={FadeInDown.delay(160).duration(460)}>
        <Typography variant="microLabel" style={{ color: subColor, letterSpacing: 3, fontSize: 10, marginBottom: 14 }}>
          ŚCIEŻKI RYTUALNE
        </Typography>
      </Animated.View>

      {GUIDED_PATHS.map((path, i) => (
        <GuidedPathCard
          key={path.id}
          path={path}
          isLight={isLight}
          navigation={navigation}
          delay={180 + i * 60}
        />
      ))}

      <View style={[styles.divider, { backgroundColor: divColor, marginVertical: 20 }]} />

      {/* ── RYTUAŁY SEZONOWE ── */}
      <SeasonalChips
        selected={selectedSeason}
        onSelect={setSelectedSeason}
        isLight={isLight}
      />

      {/* ── MINI RYTUAŁ ── */}
      <View style={[styles.divider, { backgroundColor: divColor, marginBottom: 20 }]} />

      <Animated.View entering={FadeInDown.delay(260).duration(460)}>
        <Typography variant="microLabel" style={{ color: subColor, letterSpacing: 3, fontSize: 10, marginBottom: 14 }}>
          MINI RYTUAŁ
        </Typography>
      </Animated.View>

      <MiniRitualCard isLight={isLight} />

      <View style={[styles.divider, { backgroundColor: divColor, marginVertical: 20 }]} />

      {/* ── INFO BANNER ── */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(500)}
        style={[styles.infoBanner, { backgroundColor: cardBg, borderColor: cardBorder }]}
      >
        <Typography variant="premiumLabel" color={ACCENT} style={{ letterSpacing: 0.5 }}>Ceremonialne nurty</Typography>
        <Typography variant="bodySmall" style={{ color: subColor, marginTop: 8, lineHeight: 20 }}>
          {selectedSeason
            ? `Poniżej wyróżniono kategorie rytuałów sprzyjające porze ${selectedSeason}. Pozostałe dostępne są cały rok.`
            : 'Wybierz kategorię, by zobaczyć rytuały posortowane według intencji i mocy ceremonialnej.'}
        </Typography>
      </Animated.View>

      <Typography variant="microLabel" style={{ color: subColor, letterSpacing: 3, marginBottom: 16, marginTop: 8 }}>
        WSZYSTKIE KATEGORIE
      </Typography>

      {sortedCategories.map((cat, i) => {
        const Icon = cat.icon;
        const count = RITUALS.filter(r => r.category === cat.id).length;
        const isHighlighted = highlightedCategories ? highlightedCategories.has(cat.id) : false;
        return (
          <Animated.View key={cat.id} entering={FadeInUp.delay(120 + i * 60).duration(420)}>
            <Pressable
              onPress={() => {
                void HapticsService.impact('light');
                navigation.navigate('RitualCategorySelection', {
                  categoryId: cat.id,
                  categoryLabel: cat.label,
                  categoryEmoji: cat.emoji,
                  categoryColor: cat.color,
                });
              }}
              style={({ pressed }) => [
                styles.allCatRow,
                {
                  backgroundColor: isHighlighted
                    ? (isLight ? cat.color + '10' : cat.color + '14')
                    : cardBg,
                  borderColor: pressed
                    ? cat.color + '55'
                    : isHighlighted
                    ? cat.color + '44'
                    : cardBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <LinearGradient
                colors={[cat.color + '18', cat.color + '05']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFillObject as any, { borderRadius: 18 }]}
              />
              <View style={[styles.allCatIcon, { backgroundColor: cat.color + '22', borderColor: cat.color + '33' }]}>
                <Icon color={cat.color} size={24} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Typography style={{ fontSize: 16 }}>{cat.emoji}</Typography>
                  <Typography variant="cardTitle" style={{ color: textColor, fontSize: 15 }}>{cat.label}</Typography>
                  {isHighlighted && (
                    <View style={[styles.seasonBadge, { backgroundColor: cat.color + '28' }]}>
                      <Typography variant="microLabel" style={{ color: cat.color, fontSize: 8, letterSpacing: 0.5 }}>
                        SEZONOWY
                      </Typography>
                    </View>
                  )}
                </View>
                {count > 0 && (
                  <Typography variant="caption" style={{ color: subColor, marginTop: 3, fontSize: 12 }}>
                    {count} {count === 1 ? 'rytuał' : count < 5 ? 'rytuały' : 'rytuałów'}
                  </Typography>
                )}
              </View>
              <View style={[styles.countBadge, { backgroundColor: cat.color + '22', borderColor: cat.color + '33' }]}>
                <Typography variant="microLabel" style={{ color: cat.color, fontSize: 12, fontWeight: '600' }}>{count}</Typography>
              </View>
            </Pressable>
          </Animated.View>
        );
      })}

      <View style={[styles.divider, { backgroundColor: divColor, marginVertical: 20 }]} />

      {/* ── CO DALEJ ── */}
      <CoDalejSection isLight={isLight} navigation={navigation} />
    </>
  );
};

// ── MAIN SCREEN ───────────────────────────────────────────────
export const RitualCategorySelectionScreen: React.FC<any> = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { currentTheme, isLight } = useTheme();
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';
  const divColor = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)';

  // Route params: if categoryId is provided → show filtered rituals; otherwise show all categories
  const categoryId: string | undefined = route?.params?.categoryId;
  const categoryLabel: string = route?.params?.categoryLabel ?? 'Rytuały';
  const categoryEmoji: string = route?.params?.categoryEmoji ?? '✨';
  const categoryColor: string = route?.params?.categoryColor ?? ACCENT;

  const filteredRituals = useMemo(() => {
    if (!categoryId) return [];
    return RITUALS.filter(r => r.category === categoryId);
  }, [categoryId]);

  const headerTitle = categoryId ? `${categoryEmoji} ${categoryLabel}` : 'Biblioteka Rytuałów';
  const headerSub = categoryId
    ? `${filteredRituals.length} ${filteredRituals.length === 1 ? 'rytuał' : filteredRituals.length < 5 ? 'rytuały' : 'rytuałów'}`
    : 'Wszystkie kategorie';

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={isLight
          ? ['#FBF6EE', '#F2E8D8', currentTheme.background] as any
          : ['#0B0A14', '#100A04', currentTheme.background] as any}
        style={StyleSheet.absoluteFillObject as any}
      />

      {/* Category color accent gradient at top */}
      {categoryId && (
        <LinearGradient
          colors={[categoryColor + '18', 'transparent']}
          style={[StyleSheet.absoluteFillObject as any, { height: 240 }]}
        />
      )}

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* ── HEADER ── */}
        <View style={[styles.header, { paddingHorizontal: layout.padding.screen }]}>
          <Pressable onPress={() => navigation?.canGoBack() ? navigation.goBack() : null} style={styles.backBtn}>
            <ChevronLeft color={categoryId ? categoryColor : ACCENT} size={26} strokeWidth={1.8} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Typography variant="microLabel" style={{ color: subColor, letterSpacing: 3, fontSize: 10, marginBottom: 2 }}>
              {headerSub.toUpperCase()}
            </Typography>
            <Typography variant="screenTitle" style={{ color: textColor, fontSize: 17 }}>
              {headerTitle}
            </Typography>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* ── CONTENT ── */}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {categoryId ? (
            // ── FILTERED RITUALS VIEW ──
            <>
              {/* Category hero banner */}
              <Animated.View entering={FadeInDown.delay(80).duration(500)}>
                <View style={[styles.heroBanner, { borderColor: categoryColor + '33', backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)' }]}>
                  <LinearGradient
                    colors={[categoryColor + '1A', categoryColor + '06']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFillObject as any, { borderRadius: 20 }]}
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Typography style={{ fontSize: 32 }}>{categoryEmoji}</Typography>
                    <View style={{ marginLeft: 14 }}>
                      <Typography variant="premiumLabel" style={{ color: categoryColor, letterSpacing: 1 }}>
                        {categoryLabel.toUpperCase()}
                      </Typography>
                      <View style={[styles.countPill, { backgroundColor: categoryColor + '22' }]}>
                        <Star color={categoryColor} size={10} strokeWidth={2} />
                        <Typography variant="microLabel" style={{ color: categoryColor, marginLeft: 4, fontSize: 10 }}>
                          {filteredRituals.length} rytuałów
                        </Typography>
                      </View>
                    </View>
                  </View>
                  <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 20, fontSize: 13 }}>
                    {getCategoryDescription(categoryId)}
                  </Typography>
                </View>
              </Animated.View>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: divColor }]} />

              {filteredRituals.length === 0 ? (
                <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.emptyState}>
                  <Typography style={{ fontSize: 40, marginBottom: 12 }}>🌙</Typography>
                  <Typography variant="cardTitle" style={{ color: textColor, textAlign: 'center' }}>
                    Rytuały wkrótce
                  </Typography>
                  <Typography variant="bodySmall" style={{ color: subColor, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                    Ta kategoria jest w trakcie tworzenia. Wróć wkrótce po nowe ceremonie.
                  </Typography>
                </Animated.View>
              ) : (
                filteredRituals.map((ritual, i) => (
                  <RitualCard
                    key={ritual.id}
                    ritual={ritual}
                    color={categoryColor}
                    isLight={isLight}
                    delay={160 + i * 70}
                    onPress={() => navigation?.navigate('RitualDetail', { ritualId: ritual.id })}
                  />
                ))
              )}

              {/* CO DALEJ for filtered view */}
              <View style={[styles.divider, { backgroundColor: divColor, marginVertical: 20 }]} />
              <CoDalejSection isLight={isLight} navigation={navigation} />
            </>
          ) : (
            // ── ALL CATEGORIES VIEW ──
            <AllCategoriesView
              isLight={isLight}
              navigation={navigation}
              textColor={textColor}
              subColor={subColor}
            />
          )}

          <EndOfContentSpacer size="compact" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// Category description helper
function getCategoryDescription(id: string): string {
  const desc: Record<string, string> = {
    Cleansing: 'Uwolnij to, co ciąży. Rytuały energetycznego oczyszczenia przestrzeni, ciała i umysłu z nagromadzonych napięć.',
    Protection: 'Utwardź granice. Rytuały wzmacniające filtr energetyczny i przywracające poczucie centrum.',
    Love: 'Otwórz serce. Praktyki przyciągania, wzmacniania i celebracji relacji z sobą i innymi.',
    Manifestation: 'Przekształć intencję w rzeczywistość. Ceremonie skupienia energii i stwarzania nowych możliwości.',
    Abundance: 'Przestaw uwagę z niedoboru na obecność. Rytuały wdzięczności i otwierania się na obfitość.',
    Healing: 'Towarzysz sobie w uzdrowieniu. Praktyki uważności wobec ciała, bólu i emocjonalnego echo.',
    Moon: 'Pracuj z cyklami księżyca. Rytuały nowiu, pełni i ceremonii przejścia.',
    Creativity: 'Odblokowuj twórczy przepływ. Praktyki dla artystów i wszystkich, którzy chcą wrócić do spontaniczności.',
    Morning: 'Zakorzenij dzień od samego początku. Krótkie poranne praktyki powrotu do siebie.',
    Support: 'Praktyki ciszy i świadomego niedziałania. Regeneracja zamiast kolejnego zadania.',
    Sleep: 'Świadome zamknięcie dnia. Rytuały ułatwiające przejście między dniem a nocną ciszą.',
    Transformation: 'Inicjuj głęboką zmianę. Ceremonie transformacji wzorców, przekonań i starego obrazu siebie.',
    Vision: 'Rozwijaj intuicję i wizję. Rytuały otwierające na wyższe prowadzenie i wewnętrzną mądrość.',
    NewBeginning: 'Siej intencje na nowy rozdział. Ceremonie przejścia i odwagi wejścia w nieznane.',
  };
  return desc[id] ?? 'Rytuały tej kategorii pomagają w głębokiej transformacji i ceremonialnej praktyce.';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 60, marginTop: 4,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: layout.padding.screen, paddingTop: 8 },
  divider: { height: StyleSheet.hairlineWidth },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },

  // Featured ritual
  featuredWrapper: { marginBottom: 4 },
  featuredCard: {
    borderRadius: 24, padding: 22, overflow: 'hidden',
  },
  featuredTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  featuredDayBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  featuredBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
  },

  // Guided paths
  guidedPathCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 20,
    padding: 16, overflow: 'hidden',
  },
  guidedPathIcon: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // Seasonal chips
  seasonChip: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  currentDot: {
    width: 6, height: 6, borderRadius: 3, marginLeft: 6,
  },
  seasonBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },

  // Mini ritual
  miniCard: {
    borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden', marginBottom: 4,
  },
  miniHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16,
  },
  timerBtn: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  miniStepsRow: {
    flexDirection: 'row', gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14,
  },
  miniStep: {
    alignItems: 'center', padding: 10, borderRadius: 14, borderWidth: 1,
  },

  // CO DALEJ
  coDalejRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1,
    padding: 14, marginBottom: 10, overflow: 'hidden',
  },
  coDalejIcon: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // All-categories view
  infoBanner: {
    borderRadius: 18, borderWidth: 1, padding: 20, marginBottom: 20,
  },
  allCatRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1,
    padding: 16, marginBottom: 10, overflow: 'hidden',
  },
  allCatIcon: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  countBadge: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // Filtered rituals view
  heroBanner: {
    borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 4, overflow: 'hidden',
  },
  countPill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, marginTop: 4,
  },
  ritualCard: {
    borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 12, overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardIconBox: {
    width: 50, height: 50, borderRadius: 25, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 5, flexWrap: 'wrap' },
  durationPill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 12,
  },
  startBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bestMomentRow: {
    marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth,
  },
  emptyState: {
    alignItems: 'center', paddingVertical: 48,
  },
});

export default RitualCategorySelectionScreen;
