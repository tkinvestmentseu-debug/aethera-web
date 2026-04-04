// @ts-nocheck
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import i18n from '../core/i18n';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, {
  Circle as SvgCircle,
  G,
  Path,
  Defs,
  RadialGradient as SvgRadialGradient,
  Stop,
  Ellipse,
} from 'react-native-svg';
import {
  ChevronLeft,
  Star,
  Filter,
  BookOpen,
  Sparkles,
  MoonStar,
  ArrowRight,
  TrendingUp,
  MessageSquarePlus,
  Brain,
  Calendar,
  Clock,
  BarChart3,
  Orbit,
  Flame,
  HeartHandshake,
  NotebookPen,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Layers,
} from 'lucide-react-native';
import { useTarotStore } from '../features/tarot/store/useTarotStore';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { Typography } from '../components/Typography';
import { TarotCardVisual } from '../features/tarot/components/TarotCardVisual';
import { getTarotDeckById } from '../features/tarot/data/decks';
import { MAJOR_ARCANA } from '../features/tarot/data/cards';
import { resolveUserFacingText } from '../core/utils/contentResolver';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '../core/utils/localeFormat';

const ACCENT = '#CEAE72';

// ── FILTER CHIPS ─────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'all',     label: 'Wszystkie' },
  { id: 'week',    label: 'Tydzień' },
  { id: 'month',   label: 'Miesiąc' },
  { id: 'three',   label: 'Układy 3' },
  { id: 'celtic',  label: 'Celtic Cross' },
  { id: 'single',  label: 'Jednokartkowe' },
];

// ── SPREAD COLORS ─────────────────────────────────────────────────────────────
const SPREAD_COLORS: Record<string, string> = {
  single_card:  '#CEAE72',
  three_card:   '#60A5FA',
  celtic_cross: '#A78BFA',
  love_spread:  '#F472B6',
  shadow_work:  '#F87171',
  weekly:       '#34D399',
};

const getSpreadColor = (spreadId: string) => SPREAD_COLORS[spreadId] ?? ACCENT;

const getSpreadIcon = (spreadId: string) => {
  if (spreadId === 'love_spread')  return HeartHandshake;
  if (spreadId === 'shadow_work')  return Flame;
  if (spreadId === 'celtic_cross') return Orbit;
  if (spreadId === 'weekly')       return Star;
  if (spreadId === 'single_card')  return MoonStar;
  return Layers;
};

// ── PATTERN MESSAGES ─────────────────────────────────────────────────────────
const PATTERN_MESSAGES: Record<string, string> = {
  'Śmierć':          'Transformacja jest dominującym tematem',
  'Wieża':           'Nagłe zmiany wymagają uwagi',
  'Księżyc':         'Podświadomość domaga się głosu',
  'Słońce':          'Energia radości i spełnienia przeważa',
  'Gwiazda':         'Nadzieja i uzdrowienie są w zasięgu',
  'Koło Fortuny':    'Cykl zmiany jest w pełnym biegu',
  'Sprawiedliwość':  'Równowaga i decyzje wymagają uwagi',
  'Kochankowie':     'Relacje i wybory serca są w centrum',
  'Siła':            'Wewnętrzna odwaga prowadzi ścieżkę',
  'Pustelnik':       'Czas refleksji i wewnętrznej pracy',
  'Cesarzowa':       'Płodność i dbanie o siebie są ważne',
  'Mag':             'Czas przekształcić intencję w działanie',
  'Kapłanka':        'Intuicja jest głównym przewodnikiem',
  'Rydwan':          'Determinacja i wola prowadzą do celu',
  'Hierofant':       'Tradycja i rytualny porządek są pomocne',
};

const getPatternMessage = (cardName: string, count: number) => {
  const base = PATTERN_MESSAGES[cardName] ?? 'Ten archetip powtarza się wyraźnie';
  return `${cardName} pojawiła się ${count}× — ${base}`;
};

// ── TAROT CARDS 3D WIDGET ─────────────────────────────────────────────────────
const TarotJournalWidget3D = React.memo(({ accent }: { accent: string }) => {
  const rot   = useSharedValue(0);
  const tiltX = useSharedValue(-8);
  const tiltY = useSharedValue(0);
  const glow  = useSharedValue(0.6);

  useEffect(() => {
    rot.value  = withRepeat(withTiming(360, { duration: 20000, easing: Easing.linear }), -1, false);
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 2200 }), withTiming(0.6, { duration: 2200 })), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-24, Math.min(24, -8 + e.translationY * 0.3));
      tiltY.value = Math.max(-24, Math.min(24, e.translationX * 0.3));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-8, { duration: 800 });
      tiltY.value = withTiming(0, { duration: 800 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 500 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }],
  }));
  const rotStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 60 }, glowStyle]}>
          <Svg width={120} height={120} viewBox="0 0 120 120">
            <Defs>
              <SvgRadialGradient id="jglow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={accent} stopOpacity="0.35" />
                <Stop offset="100%" stopColor={accent} stopOpacity="0" />
              </SvgRadialGradient>
            </Defs>
            <SvgCircle cx={60} cy={60} r={56} fill="url(#jglow)" />
          </Svg>
        </Animated.View>
        <Animated.View style={rotStyle}>
          <Svg width={88} height={88} viewBox="0 0 88 88">
            {[0, 45, 90, 135].map(a => (
              <G key={a} transform={`rotate(${a} 44 44)`}>
                <Path
                  d="M44 8 L47 36 L44 40 L41 36 Z"
                  fill={accent}
                  opacity={0.5}
                />
              </G>
            ))}
            <SvgCircle cx={44} cy={44} r={16} fill="none" stroke={accent} strokeWidth={1.5} opacity={0.7} />
            <SvgCircle cx={44} cy={44} r={8} fill={accent} opacity={0.4} />
          </Svg>
        </Animated.View>
        {/* Moon symbol */}
        <View style={StyleSheet.absoluteFill}>
          <Svg width={120} height={120} viewBox="0 0 120 120">
            <Path
              d="M60 30 C46 30 36 40 36 54 C36 68 46 78 60 78 C52 72 48 64 48 54 C48 44 52 36 60 30 Z"
              fill={accent}
              opacity={0.6}
            />
          </Svg>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

// ── DATE FORMATTER ────────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    const days   = ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'];
    const months = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
};

const isThisWeek = (iso: string) => {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 7;
  } catch { return false; }
};

const isThisMonth = (iso: string) => {
  try {
    const d = new Date(iso);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  } catch { return false; }
};

// ── CARD FREQUENCY ANALYSIS ──────────────────────────────────────────────────
const getCardFrequency = (pastReadings: any[]) => {
  const freq: Record<string, { count: number; cardData: any; deckId: string }> = {};
  for (const reading of pastReadings) {
    for (const slot of (reading.cards ?? [])) {
      const name = slot.card?.name ?? '';
      if (!name) continue;
      if (!freq[name]) freq[name] = { count: 0, cardData: slot.card, deckId: reading.deckId ?? 'classic' };
      freq[name].count++;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);
};

// ── STREAK CALCULATION ────────────────────────────────────────────────────────
const calcStreak = (pastReadings: any[]) => {
  if (!pastReadings.length) return 0;
  const dates = [...new Set(pastReadings.map(r => new Date(r.date).toDateString()))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );
  let streak = 0;
  let cursor = new Date();
  for (const ds of dates) {
    const d = new Date(ds);
    const diff = Math.round((cursor.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) { streak++; cursor = d; }
    else break;
  }
  return streak;
};

// ── READING CARD COMPONENT ───────────────────────────────────────────────────
const ReadingCard = React.memo(({
  reading,
  isLight,
  cardBg,
  cardBorder,
  textColor,
  subColor,
  reflection,
  onSaveReflection,
  onAiInsight,
}: any) => {
  const [expanded, setExpanded]     = useState(false);
  const [editMode, setEditMode]     = useState(false);
  const [localText, setLocalText]   = useState(reflection ?? '');
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiInsight, setAiInsight]   = useState('');
  const [showAi, setShowAi]         = useState(false);

  const spreadColor = getSpreadColor(reading.spread?.id ?? '');
  const SpreadIcon  = getSpreadIcon(reading.spread?.id ?? '');
  const deck        = getTarotDeckById(reading.deckId ?? 'classic');

  const truncatedInterp = useMemo(() => {
    const text = reading.aiInterpretation ?? '';
    if (text.length <= 200) return text;
    return text.slice(0, 200) + '…';
  }, [reading.aiInterpretation]);

  const handleSave = () => {
    setEditMode(false);
    onSaveReflection(reading.id, localText);
    HapticsService.notify();
    Keyboard.dismiss();
  };

  const handleAiInsight = async () => {
    if (aiLoading) return;
    setShowAi(true);
    setAiLoading(true);
    HapticsService.notify();
    try {
      const cardNames = (reading.cards ?? []).map((s: any) => s.card?.name ?? '').join(', ');
      const messages = [
        {
          role: 'user' as const,
          content: `Mam odczyt Tarota. Układ: "${reading.spread?.name ?? 'nieznany'}". Karty: ${cardNames}.
          ${reading.question ? `Pytanie: "${reading.question}".` : ''}
          ${reading.aiInterpretation ? `Pierwsza interpretacja: "${reading.aiInterpretation.slice(0, 300)}"` : ''}
          ${reflection ? `Moja refleksja: "${reflection}"` : ''}

          Proszę o głębszą, duchową analizę tych kart razem jako wzorzec. Co te karty mówią zbiorowo? Jakie archetypy są obecne? Jakie pytanie powinienem sobie zadać?
          Odpowiedz w języku użytkownika, 3-4 akapity, głęboko i poetycko.`,
        },
      ];
      const result = await AiService.chatWithOracle(messages);
      setAiInsight(result);
    } catch {
      setAiInsight('Nie udało się wygenerować wglądu. Spróbuj ponownie.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()}>
      <Pressable
        onPress={() => setExpanded(p => !p)}
        style={[styles.readingCard, { backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : cardBg, borderColor: isLight ? 'rgba(0,0,0,0.07)' : cardBorder, borderLeftWidth: 3, borderLeftColor: spreadColor }]}
      >
        {/* Header row */}
        <View style={styles.readingCardHeader}>
          <View style={[styles.spreadBadge, { backgroundColor: spreadColor + '22', borderColor: spreadColor + '44' }]}>
            <SpreadIcon size={12} color={spreadColor} />
            <Typography variant="microLabel" style={{ color: spreadColor, marginLeft: 5, fontSize: 11 }}>
              {reading.spread?.name ?? 'Odczyt'}
            </Typography>
          </View>
          <View style={styles.readingDateRow}>
            <Clock size={11} color={subColor} />
            <Typography variant="microLabel" style={{ color: subColor, marginLeft: 4, fontSize: 11 }}>
              {formatDate(reading.date)}
            </Typography>
          </View>
          {expanded
            ? <ChevronUp size={16} color={subColor} />
            : <ChevronDown size={16} color={subColor} />
          }
        </View>

        {/* Question if exists */}
        {!!reading.question && (
          <Typography
            variant="body"
            style={[styles.readingQuestion, { color: textColor, opacity: 0.75 }]}
            numberOfLines={expanded ? undefined : 1}
          >
            „{reading.question}"
          </Typography>
        )}

        {/* Card row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cardScrollRow}
          contentContainerStyle={{ paddingRight: 12 }}
        >
          {(reading.cards ?? []).slice(0, 5).map((slot: any, i: number) => (
            <View key={i} style={styles.cardThumbWrap}>
              <TarotCardVisual
                deck={deck}
                card={slot.card}
                isReversed={slot.isReversed}
                size="small"
              />
              {slot.isReversed && (
                <View style={[styles.reversedBadge, { backgroundColor: ACCENT + 'CC' }]}>
                  <Typography variant="microLabel" style={{ color: '#000', fontSize: 8 }}>OBR</Typography>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Truncated interpretation */}
        {!!truncatedInterp && !expanded && (
          <Typography
            variant="body"
            style={[styles.truncInterp, { color: subColor }]}
            numberOfLines={2}
          >
            {truncatedInterp}
          </Typography>
        )}

        {/* EXPANDED SECTION */}
        {expanded && (
          <View style={styles.expandedSection}>
            {/* Full interpretation */}
            {!!reading.aiInterpretation && (
              <View style={[styles.interpBlock, { borderColor: ACCENT + '30' }]}>
                <View style={styles.interpBlockHeader}>
                  <Brain size={13} color={ACCENT} />
                  <Typography variant="microLabel" style={{ color: ACCENT, marginLeft: 6, letterSpacing: 1.2 }}>
                    INTERPRETACJA AI
                  </Typography>
                </View>
                <Typography variant="body" style={[styles.interpText, { color: textColor, opacity: 0.82 }]}>
                  {reading.aiInterpretation}
                </Typography>
              </View>
            )}

            {/* Reflection section */}
            <View style={[styles.reflectionBlock, { borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }]}>
              <View style={styles.reflectionHeader}>
                <NotebookPen size={13} color={ACCENT} />
                <Typography variant="microLabel" style={{ color: ACCENT, marginLeft: 6, letterSpacing: 1.2 }}>
                  TWOJA REFLEKSJA
                </Typography>
              </View>

              {editMode ? (
                <>
                  <TextInput
                    value={localText}
                    onChangeText={setLocalText}
                    placeholder="Co czujesz? Co ta karta mówi do Ciebie dziś?"
                    placeholderTextColor={subColor + '88'}
                    multiline
                    style={[styles.reflectionInput, {
                      color: textColor,
                      borderColor: ACCENT + '44',
                      backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                    }]}
                    autoFocus
                  />
                  <Pressable
                    style={[styles.saveBtn, { backgroundColor: ACCENT }]}
                    onPress={handleSave}
                  >
                    <Typography variant="label" style={{ color: '#1A1208', fontWeight: '700' }}>
                      Zapisz refleksję
                    </Typography>
                  </Pressable>
                </>
              ) : reflection ? (
                <>
                  <Typography variant="body" style={[styles.savedReflection, { color: textColor, opacity: 0.80 }]}>
                    {reflection}
                  </Typography>
                  <Pressable onPress={() => setEditMode(true)} style={styles.editBtn}>
                    <Typography variant="microLabel" style={{ color: ACCENT, fontSize: 12 }}>
                      Edytuj refleksję
                    </Typography>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  style={[styles.addReflectionBtn, { borderColor: ACCENT + '50' }]}
                  onPress={() => setEditMode(true)}
                >
                  <MessageSquarePlus size={14} color={ACCENT} />
                  <Typography variant="label" style={{ color: ACCENT, marginLeft: 8 }}>
                    Dodaj refleksję
                  </Typography>
                </Pressable>
              )}
            </View>

            {/* AI Deep Insight */}
            <Pressable
              style={[styles.aiInsightBtn, { borderColor: ACCENT + '44', backgroundColor: ACCENT + '14' }]}
              onPress={handleAiInsight}
            >
              {aiLoading
                ? <ActivityIndicator size="small" color={ACCENT} />
                : <Sparkles size={14} color={ACCENT} />
              }
              <Typography variant="label" style={{ color: ACCENT, marginLeft: 8 }}>
                {aiLoading ? 'Generuję głębszy wgląd…' : 'Pogłębij z AI'}
              </Typography>
            </Pressable>

            {/* AI insight result */}
            {showAi && !!aiInsight && (
              <Animated.View
                entering={FadeInDown.springify()}
                style={[styles.aiInsightResult, { borderColor: ACCENT + '30', backgroundColor: ACCENT + '0C' }]}
              >
                <View style={styles.interpBlockHeader}>
                  <Brain size={13} color={ACCENT} />
                  <Typography variant="microLabel" style={{ color: ACCENT, marginLeft: 6, letterSpacing: 1.2 }}>
                    GŁĘBSZY WGLĄD
                  </Typography>
                </View>
                <Typography variant="body" style={[styles.interpText, { color: textColor, opacity: 0.82 }]}>
                  {aiInsight}
                </Typography>
              </Animated.View>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
export const TarotJournalScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets      = useSafeAreaInsets();
  const { themeName, userData, addFavoriteItem, favoriteItems, removeFavoriteItem } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight      = currentTheme.background.startsWith('#F');

  const textColor  = isLight ? '#1A1208' : '#F0EAD6';
  const subColor   = isLight ? 'rgba(30,20,10,0.55)' : 'rgba(240,234,214,0.55)';
  const cardBg     = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)';

  const { pastReadings } = useTarotStore();

  // local reflections: id → text
  const [reflections, setReflections]           = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter]         = useState('all');
  const [weeklyInsight, setWeeklyInsight]        = useState('');
  const [weeklyLoading, setWeeklyLoading]        = useState(false);
  const [weeklyLoaded, setWeeklyLoaded]          = useState(false);

  // AI Pattern Analysis state
  const [patternAnalysis, setPatternAnalysis]   = useState('');
  const [patternLoading, setPatternLoading]     = useState(false);
  const [patternLoaded, setPatternLoaded]       = useState(false);

  // ── Favorite toggle ───────────────────────────────────────────────────────
  const isFav = favoriteItems?.some((f: any) => f.route === 'TarotJournal');
  const handleFav = () => {
    HapticsService.notify();
    if (isFav) {
      removeFavoriteItem('tarot-journal');
    } else {
      addFavoriteItem({ id: 'tarot-journal', label: 'Dziennik Tarota', sublabel: 'Historia odczytów', route: 'TarotJournal', icon: 'BookOpen', color: ACCENT, addedAt: new Date().toISOString() });
    }
  };

  // ── Filtered readings ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!pastReadings?.length) return [];
    switch (activeFilter) {
      case 'week':   return pastReadings.filter(r => isThisWeek(r.date));
      case 'month':  return pastReadings.filter(r => isThisMonth(r.date));
      case 'three':  return pastReadings.filter(r => r.spread?.id === 'three_card');
      case 'celtic': return pastReadings.filter(r => r.spread?.id === 'celtic_cross');
      case 'single': return pastReadings.filter(r => r.spread?.id === 'single_card');
      default:       return pastReadings;
    }
  }, [pastReadings, activeFilter]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalReadings = pastReadings?.length ?? 0;
  const weekReadings  = useMemo(() => (pastReadings ?? []).filter(r => isThisWeek(r.date)).length, [pastReadings]);
  const streak        = useMemo(() => calcStreak(pastReadings ?? []), [pastReadings]);
  const cardFrequency = useMemo(() => getCardFrequency(pastReadings ?? []), [pastReadings]);
  const topCard       = cardFrequency[0];
  const topDeck       = useMemo(() => getTarotDeckById(topCard?.[1]?.deckId ?? 'classic'), [topCard]);
  const patternMsg    = useMemo(() => {
    if (!topCard) return '';
    return getPatternMessage(topCard[0], topCard[1].count);
  }, [topCard]);

  // ── Weekly AI summary ─────────────────────────────────────────────────────
  const handleWeeklySummary = async () => {
    if (weeklyLoading || weeklyLoaded) return;
    setWeeklyLoading(true);
    HapticsService.notify();
    try {
      const weekReadingsList = (pastReadings ?? []).filter(r => isThisWeek(r.date));
      if (!weekReadingsList.length) {
        setWeeklyInsight('Brak odczytów z tego tygodnia. Zacznij nowy odczyt, aby zobaczyć wzorce.');
        setWeeklyLoaded(true);
        return;
      }
      const summary = weekReadingsList.map(r => {
        const cards = (r.cards ?? []).map(s => s.card?.name ?? '').join(', ');
        return `${r.spread?.name ?? 'Odczyt'}: ${cards}`;
      }).join('\n');

      const messages = [
        {
          role: 'user' as const,
          content: `Analizuję moje odczyty Tarota z tego tygodnia:
          ${summary}

          Proszę o krótkie (2-3 zdania) podsumowanie: jaki wzorzec się pojawia? Jaki temat dominuje w moim tygodniu według tych kart? Mów w języku użytkownika, poetycko i głęboko.`,
        },
      ];
      const result = await AiService.chatWithOracle(messages);
      setWeeklyInsight(result);
      setWeeklyLoaded(true);
    } catch {
      setWeeklyInsight('Nie udało się wygenerować podsumowania. Spróbuj ponownie.');
      setWeeklyLoaded(true);
    } finally {
      setWeeklyLoading(false);
    }
  };

  // ── AI Pattern Analysis ───────────────────────────────────────────────────
  const handlePatternAnalysis = async () => {
    if (patternLoading || patternLoaded) return;
    setPatternLoading(true);
    HapticsService.notify();
    try {
      const last7 = (pastReadings ?? []).slice(0, 7);
      if (!last7.length) {
        setPatternAnalysis('Brak odczytów do analizy. Wykonaj kilka odczytów, by zobaczyć wzorce.');
        setPatternLoaded(true);
        return;
      }
      const summary = last7.map(r => {
        const cards = (r.cards ?? []).map((s: any) => s.card?.name ?? '').filter(Boolean).join(', ');
    return `${r.spread?.name ?? (i18n.language?.startsWith('en') ? 'Reading' : 'Odczyt')} (${formatLocaleDate(r.date)}): ${cards}`;
      }).join('\n');

      const topCards = cardFrequency.slice(0, 3).map(([name, d]) => `${name} (×${d.count})`).join(', ');
      const userName = userData?.name ?? '';

      const messages = [
        {
          role: 'user' as const,
          content: `${userName ? `Użytkownik: ${userName}.` : ''} Analizuję mój Dziennik Tarota.

Ostatnie 7 odczytów:
${summary}

Najczęściej pojawiające się karty: ${topCards || 'brak danych'}.

Proszę o głęboką analizę wzorców w 3 sekcjach:
1. DOMINUJĄCY TEMAT: Jaki główny temat / archetyp pojawia się w tych odczytach?
2. POWTARZAJĄCE SIĘ PRZESŁANIE: Co karty mówią mi powtarzająco?
3. WSKAZÓWKA NA NASTĘPNY ODCZYT: Na czym powinienem skupić uwagę w kolejnym odczycie?

Odpowiedz w języku użytkownika, głęboko i poetycko, każda sekcja 2-3 zdania.`,
        },
      ];
      const result = await AiService.chatWithOracle(messages);
      setPatternAnalysis(result);
      setPatternLoaded(true);
    } catch {
      setPatternAnalysis('Nie udało się wygenerować analizy. Spróbuj ponownie.');
      setPatternLoaded(true);
    } finally {
      setPatternLoading(false);
    }
  };

  const handleSaveReflection = useCallback((id: string, text: string) => {
    setReflections(prev => ({ ...prev, [id]: text }));
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: currentTheme.background }]} edges={['top']}>
      {/* Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={isLight
            ? ['#FBF5E8', '#F4ECD8', '#EDE0C6']
            : ['#09060F', '#0D0818', '#120C1E']}
          style={StyleSheet.absoluteFill}
        />
        {/* Starfield dots */}
        {!isLight && (
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            {[...Array(28)].map((_, i) => (
              <SvgCircle
                key={i}
                cx={`${(i * 37 + 5) % 100}%`}
                cy={`${(i * 53 + 11) % 100}%`}
                r={i % 5 === 0 ? 1.5 : 0.8}
                fill={ACCENT}
                opacity={0.15 + (i % 3) * 0.08}
              />
            ))}
          </Svg>
        )}
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: layout.padding.screen }]}>
        <Pressable
          onPress={() => goBackOrToMainTab(navigation, 'Portal')}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <Typography variant="title3" style={[styles.headerTitle, { color: textColor }]}>
          Dziennik Tarota
        </Typography>
        <View style={styles.headerRight}>
          <Pressable onPress={handleFav} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Star size={20} color={ACCENT} fill={isFav ? ACCENT : 'none'} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 56}
      >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HERO STATS ──────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <LinearGradient
            colors={isLight ? ['#F9F0DC', '#F0E4C0'] : ['#1A1028', '#140C24']}
            style={[styles.heroCard, { borderColor: ACCENT + '30' }]}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroTextBlock}>
                <Typography variant="microLabel" style={{ color: ACCENT, letterSpacing: 2, fontSize: 10 }}>
                  STATYSTYKI
                </Typography>
                <Typography variant="title2" style={[styles.heroTitle, { color: textColor }]}>
                  Twoja Ścieżka
                </Typography>
                <Typography variant="body" style={[styles.heroSub, { color: subColor }]}>
                  {totalReadings === 0
                    ? 'Zacznij pierwsze odczyt, by zobaczyć wzorce'
                    : `${totalReadings} odczytów · głębia rośnie`}
                </Typography>
                {!!patternMsg && (
                  <View style={[styles.patternChip, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '40' }]}>
                    <TrendingUp size={11} color={ACCENT} />
                    <Typography variant="microLabel" style={{ color: ACCENT, marginLeft: 5, fontSize: 11, flex: 1 }}>
                      {patternMsg}
                    </Typography>
                  </View>
                )}
              </View>
              <TarotJournalWidget3D accent={ACCENT} />
            </View>

            {/* Stat pills */}
            <View style={styles.statRow}>
              {[
                { label: 'Odczytów',     value: String(totalReadings) },
                { label: 'Ten miesiąc',  value: String((pastReadings ?? []).filter(r => isThisMonth(r.date)).length) },
                { label: 'Pasmo',        value: `${streak}d` },
                { label: 'Top karta',    value: topCard ? topCard[0].slice(0, 6) : '—' },
              ].map((s, i) => (
                <View key={i} style={[styles.statPill, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)', borderColor: isLight ? 'rgba(0,0,0,0.08)' : cardBorder }]}>
                  <Typography variant="title3" style={{ color: ACCENT, fontWeight: '700', fontSize: i === 3 ? 11 : 18 }}>
                    {s.value}
                  </Typography>
                  <Typography variant="microLabel" style={{ color: isLight ? 'rgba(60,40,10,0.55)' : subColor, marginTop: 2, fontSize: 9 }}>
                    {s.label}
                  </Typography>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── CARD FREQUENCY (WZORCE KART) ─────────────────────────────── */}
        {cardFrequency.length > 0 && (
          <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={14} color={ACCENT} />
              <Typography variant="microLabel" style={[styles.sectionLabel, { color: ACCENT }]}>
                WZORCE KART
              </Typography>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.freqRow}
            >
              {cardFrequency.map(([name, data], i) => {
                const deck = getTarotDeckById(data.deckId ?? 'classic');
                return (
                  <View key={name} style={styles.freqItem}>
                    <View style={styles.freqCardWrap}>
                      <TarotCardVisual
                        deck={deck}
                        card={data.cardData}
                        isReversed={false}
                        size="small"
                      />
                      <View style={[styles.freqBadge, { backgroundColor: ACCENT }]}>
                        <Typography variant="microLabel" style={{ color: '#1A1208', fontSize: 9, fontWeight: '700' }}>
                          ×{data.count}
                        </Typography>
                      </View>
                    </View>
                    <Typography
                      variant="microLabel"
                      style={[styles.freqName, { color: textColor }]}
                      numberOfLines={2}
                    >
                      {name}
                    </Typography>
                    {i === 0 && (
                      <View style={[styles.freqTopBadge, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '44' }]}>
                        <Typography variant="microLabel" style={{ color: ACCENT, fontSize: 9 }}>
                          #1
                        </Typography>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── FILTER CHIPS ──────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Filter size={14} color={ACCENT} />
            <Typography variant="microLabel" style={[styles.sectionLabel, { color: ACCENT }]}>
              FILTR
            </Typography>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map(f => {
              const active = activeFilter === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setActiveFilter(f.id)}
                  style={[
                    styles.filterChip,
                    active
                      ? { backgroundColor: ACCENT, borderColor: ACCENT }
                      : { backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', borderColor: cardBorder },
                  ]}
                >
                  <Typography
                    variant="label"
                    style={{ color: active ? '#1A1208' : textColor, fontWeight: active ? '700' : '400' }}
                  >
                    {f.label}
                  </Typography>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── READINGS LIST ──────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen size={14} color={ACCENT} />
            <Typography variant="microLabel" style={[styles.sectionLabel, { color: ACCENT }]}>
              LISTA ODCZYTÓW
            </Typography>
            <Typography variant="microLabel" style={{ color: subColor, marginLeft: 'auto', fontSize: 11 }}>
              {filtered.length} {filtered.length === 1 ? 'odczyt' : filtered.length < 5 ? 'odczyty' : 'odczytów'}
            </Typography>
          </View>

          {filtered.length === 0 ? (
            /* ── EMPTY STATE ──────────────────────────────────────────────── */
            <Animated.View entering={FadeInUp.delay(300).springify()}>
              <LinearGradient
                colors={isLight ? ['#F5ECDA', '#EDE0C6'] : ['#160E2A', '#1C1230']}
                style={[styles.emptyCard, { borderColor: ACCENT + '28' }]}
              >
                <View style={styles.emptyIconWrap}>
                  <Svg width={64} height={64} viewBox="0 0 64 64">
                    <SvgCircle cx={32} cy={32} r={30} fill={ACCENT + '18'} stroke={ACCENT + '44'} strokeWidth={1.5} />
                    <Path
                      d="M22 20 L22 44 L42 44 L42 26 L36 20 Z M36 20 L36 26 L42 26"
                      fill="none"
                      stroke={ACCENT}
                      strokeWidth={1.8}
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M27 30 L37 30 M27 34 L37 34 M27 38 L33 38"
                      stroke={ACCENT}
                      strokeWidth={1.4}
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
                <Typography variant="title3" style={[styles.emptyTitle, { color: textColor }]}>
                  Dziennik czeka
                </Typography>
                <Typography variant="body" style={[styles.emptySub, { color: subColor }]}>
                  Twoje odczyty Tarota pojawią się tutaj. Każdy odczyt zostanie zapisany z kartami, interpretacją i miejscem na Twoją refleksję.
                </Typography>
                <Pressable
                  style={[styles.emptyBtn, { backgroundColor: ACCENT }]}
                  onPress={() => navigation.navigate('Tarot')}
                >
                  <Sparkles size={14} color="#1A1208" />
                  <Typography variant="label" style={{ color: '#1A1208', marginLeft: 8, fontWeight: '700' }}>
                    Zacznij odczyt
                  </Typography>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          ) : (
            filtered.map((reading, idx) => (
              <ReadingCard
                key={reading.id}
                reading={reading}
                isLight={isLight}
                cardBg={cardBg}
                cardBorder={cardBorder}
                textColor={textColor}
                subColor={subColor}
                reflection={reflections[reading.id]}
                onSaveReflection={handleSaveReflection}
              />
            ))
          )}
        </Animated.View>

        {/* ── WEEKLY AI OBSERVATIONS ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(320).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MoonStar size={14} color={ACCENT} />
            <Typography variant="microLabel" style={[styles.sectionLabel, { color: ACCENT }]}>
              OBSERWACJE TYGODNIOWE
            </Typography>
          </View>
          <LinearGradient
            colors={isLight ? ['#F7EDD8', '#EEE0C2'] : ['#180F2C', '#120A22']}
            style={[styles.weeklyCard, { borderColor: ACCENT + '28' }]}
          >
            {weeklyLoaded && !!weeklyInsight ? (
              <Animated.View entering={FadeInDown.springify()}>
                <View style={styles.interpBlockHeader}>
                  <Brain size={13} color={ACCENT} />
                  <Typography variant="microLabel" style={{ color: ACCENT, marginLeft: 6, letterSpacing: 1.2 }}>
                    WZORZEC TYGODNIA
                  </Typography>
                </View>
                <Typography variant="body" style={[styles.weeklyText, { color: textColor, opacity: 0.85 }]}>
                  {weeklyInsight}
                </Typography>
                <Pressable
                  onPress={() => { setWeeklyLoaded(false); setWeeklyInsight(''); }}
                  style={styles.refreshBtn}
                >
                  <RefreshCw size={12} color={subColor} />
                  <Typography variant="microLabel" style={{ color: subColor, marginLeft: 5, fontSize: 11 }}>
                    Odśwież
                  </Typography>
                </Pressable>
              </Animated.View>
            ) : (
              <>
                <Typography variant="body" style={[styles.weeklyHint, { color: subColor }]}>
                  {weekReadings === 0
                    ? 'Nie masz jeszcze odczytów z tego tygodnia. Wykonaj odczyt, by zobaczyć wzorzec tygodnia.'
                    : `Masz ${weekReadings} ${weekReadings === 1 ? 'odczyt' : 'odczyty'} z tego tygodnia. AI może przeanalizować pojawiające się wzorce.`}
                </Typography>
                <Pressable
                  style={[styles.aiInsightBtn, { borderColor: ACCENT + '44', backgroundColor: ACCENT + '14' }]}
                  onPress={handleWeeklySummary}
                  disabled={weeklyLoading}
                >
                  {weeklyLoading
                    ? <ActivityIndicator size="small" color={ACCENT} />
                    : <Sparkles size={14} color={ACCENT} />
                  }
                  <Typography variant="label" style={{ color: ACCENT, marginLeft: 8 }}>
                    {weeklyLoading ? 'Analizuję wzorce…' : 'Generuj podsumowanie tygodnia'}
                  </Typography>
                </Pressable>
              </>
            )}
          </LinearGradient>
        </Animated.View>

        {/* ── AI PATTERN ANALYSIS ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(360).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Brain size={14} color={ACCENT} />
            <Typography variant="microLabel" style={[styles.sectionLabel, { color: ACCENT }]}>
              ANALIZA WZORCÓW Z ORACLE
            </Typography>
          </View>
          <LinearGradient
            colors={isLight ? ['#F7EDD8', '#EEE0C2'] : ['#1A1028', '#120A22']}
            style={[styles.weeklyCard, { borderColor: ACCENT + '28' }]}
          >
            {patternLoaded && !!patternAnalysis ? (
              <Animated.View entering={FadeInDown.springify()}>
                <View style={styles.interpBlockHeader}>
                  <Sparkles size={13} color={ACCENT} />
                  <Typography variant="microLabel" style={{ color: ACCENT, marginLeft: 6, letterSpacing: 1.2 }}>
                    WZORCE MOJEGO DZIENNIKA
                  </Typography>
                </View>
                {/* Parse and render labeled sections */}
                {patternAnalysis.split(/\n\d+\.\s+/).filter(Boolean).map((section, si) => {
                  const sectionColors = [ACCENT, '#A78BFA', '#34D399'];
                  const sectionColor  = sectionColors[si % sectionColors.length];
                  const lines = section.split('\n').filter(Boolean);
                  const heading = lines[0]?.replace(/^[^:]+:\s*/, '') || '';
                  const body    = lines.slice(1).join(' ') || lines[0] || '';
                  return (
                    <View key={si} style={{ marginBottom: 12, borderLeftWidth: 2, borderLeftColor: sectionColor + '60', paddingLeft: 10 }}>
                      {!!heading && <Typography variant="microLabel" style={{ color: sectionColor, letterSpacing: 1, marginBottom: 4, fontSize: 10 }}>{heading.toUpperCase()}</Typography>}
                      <Typography variant="body" style={{ color: isLight ? '#2A1A0A' : textColor, opacity: 0.85, lineHeight: 21, fontSize: 14 }}>
                        {body || section}
                      </Typography>
                    </View>
                  );
                })}
                {patternAnalysis.split(/\n\d+\.\s+/).filter(Boolean).length === 0 && (
                  <Typography variant="body" style={{ color: isLight ? '#2A1A0A' : textColor, opacity: 0.85, lineHeight: 22, fontSize: 14 }}>
                    {patternAnalysis}
                  </Typography>
                )}
                <Pressable
                  onPress={() => { setPatternLoaded(false); setPatternAnalysis(''); }}
                  style={styles.refreshBtn}
                >
                  <RefreshCw size={12} color={subColor} />
                  <Typography variant="microLabel" style={{ color: subColor, marginLeft: 5, fontSize: 11 }}>
                    Odśwież analizę
                  </Typography>
                </Pressable>
              </Animated.View>
            ) : (
              <>
                <Typography variant="body" style={[styles.weeklyHint, { color: isLight ? '#5A4A30' : subColor }]}>
                  {totalReadings === 0
                    ? 'Wykonaj pierwsze odczyty, by Oracle mógł odkryć wzorce w Twoim dzienniku.'
                    : `Oracle przeanalizuje Twoje ostatnie ${Math.min(totalReadings, 7)} odczytów — dominujące tematy, powtarzające się karty i wskazówkę na kolejny odczyt.`}
                </Typography>
                <Pressable
                  style={[styles.aiInsightBtn, { borderColor: ACCENT + '44', backgroundColor: isLight ? ACCENT + '18' : ACCENT + '14' }]}
                  onPress={handlePatternAnalysis}
                  disabled={patternLoading || totalReadings === 0}
                >
                  {patternLoading
                    ? <ActivityIndicator size="small" color={ACCENT} />
                    : <Brain size={14} color={ACCENT} />
                  }
                  <Typography variant="label" style={{ color: ACCENT, marginLeft: 8 }}>
                    {patternLoading ? 'Analizuję wzorce…' : 'Analizuj mój Dziennik Tarota z Oracle'}
                  </Typography>
                </Pressable>
              </>
            )}
          </LinearGradient>
        </Animated.View>

        {/* ── CO DALEJ ──────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(380).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <ArrowRight size={14} color={ACCENT} />
            <Typography variant="microLabel" style={[styles.sectionLabel, { color: ACCENT }]}>
              CO DALEJ
            </Typography>
          </View>
          {[
            { label: 'Nowy odczyt Tarota',       sublabel: 'Rozłóż karty ponownie',          route: 'Tarot',       Icon: MoonStar    },
            { label: 'Karta dnia',                sublabel: 'Codzienne przesłanie z Tarota',  route: 'DailyTarot',  Icon: Calendar    },
            { label: 'Dziennik duchowy',          sublabel: 'Zapisz głębsze przemyślenia',    route: 'Journal',     Icon: NotebookPen },
          ].map((item, i) => (
            <Pressable
              key={item.route}
              onPress={() => navigation.navigate(item.route)}
              style={[styles.nextCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <View style={[styles.nextIconWrap, { backgroundColor: ACCENT + '18' }]}>
                <item.Icon size={16} color={ACCENT} />
              </View>
              <View style={styles.nextText}>
                <Typography variant="body" style={{ color: textColor, fontWeight: '600' }}>
                  {item.label}
                </Typography>
                <Typography variant="microLabel" style={{ color: subColor, marginTop: 2 }}>
                  {item.sublabel}
                </Typography>
              </View>
              <ArrowRight size={16} color={subColor} />
            </Pressable>
          ))}
        </Animated.View>

        <EndOfContentSpacer />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerRight: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 4,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  heroTitle: {
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  patternChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },

  // Section
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    letterSpacing: 1.5,
    fontSize: 11,
    marginLeft: 8,
  },

  // Frequency
  freqRow: {
    paddingRight: 8,
    gap: 12,
    flexDirection: 'row',
  },
  freqItem: {
    alignItems: 'center',
    width: 90,
  },
  freqCardWrap: {
    position: 'relative',
    marginBottom: 6,
  },
  freqBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  freqTopBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  freqName: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },

  // Filter
  filterRow: {
    gap: 8,
    paddingRight: 8,
    flexDirection: 'row',
  },
  filterChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },

  // Reading card
  readingCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  readingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  spreadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  readingDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 4,
  },
  readingQuestion: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 18,
  },
  cardScrollRow: {
    marginBottom: 10,
    marginHorizontal: -4,
  },
  cardThumbWrap: {
    marginRight: 8,
    marginLeft: 4,
    position: 'relative',
  },
  reversedBadge: {
    position: 'absolute',
    top: 6,
    right: 2,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  truncInterp: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  expandedSection: {
    marginTop: 12,
    gap: 12,
  },
  interpBlock: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  interpBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  interpText: {
    fontSize: 14,
    lineHeight: 22,
  },
  reflectionBlock: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reflectionInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  savedReflection: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  editBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  addReflectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderStyle: 'dashed',
  },
  aiInsightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  aiInsightResult: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },

  // Empty state
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },
  emptyIconWrap: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },

  // Weekly
  weeklyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  weeklyHint: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  weeklyText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },

  // Co dalej
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  nextIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  nextText: {
    flex: 1,
  },
});
