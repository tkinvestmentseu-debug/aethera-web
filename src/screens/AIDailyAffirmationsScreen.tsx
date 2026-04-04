// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Share,
  Modal,
  TextInput,
  Clipboard,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Svg, { Circle, G, Defs, RadialGradient, Stop, Line } from 'react-native-svg';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  Copy,
  Heart,
  Moon,
  RefreshCw,
  Share2,
  Sparkles,
  Star,
  Users,
  Wind,
  X,
  Zap,
  Calendar,
  Layers,
  Target,
  Flame,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { SoulEngineService } from '../core/services/soulEngine.service';
import { screenContracts } from '../core/theme/designSystem';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { AiService } from '../core/services/ai.service';
import { Typography } from '../components/Typography';
import { useTranslation } from 'react-i18next';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#F472B6';

// ─── Category data ──────────────────────────────────────────────────────────
const AFFIRMATION_CATEGORIES = [
  { id: 'all',          label: 'Wszystkie',    emoji: '✦',  color: '#F472B6' },
  { id: 'love',         label: 'Miłość',       emoji: '♡',  color: '#F472B6' },
  { id: 'abundance',    label: 'Obfitość',     emoji: '🌿', color: '#34D399' },
  { id: 'healing',      label: 'Uzdrowienie',  emoji: '✧',  color: '#A78BFA' },
  { id: 'transform',    label: 'Transformacja',emoji: '◈',  color: '#FBBF24' },
  { id: 'protection',   label: 'Ochrona',      emoji: '◈',  color: '#60A5FA' },
  { id: 'confidence',   label: 'Pewność',      emoji: '◉',  color: '#F97316' },
  { id: 'mission',      label: 'Misja',        emoji: '✵',  color: '#E879F9' },
];

const TONE_OPTIONS = [
  { id: 'gentle',   label: 'Delikatny' },
  { id: 'strong',   label: 'Mocny' },
  { id: 'poetic',   label: 'Poetycki' },
];

const LENGTH_OPTIONS = [
  { id: 'short',    label: 'Krótka' },
  { id: 'medium',   label: 'Średnia' },
  { id: 'long',     label: 'Długa' },
];

const STYLE_OPTIONS = [
  { id: 'classic',   label: 'Klasyczny' },
  { id: 'modern',    label: 'Nowoczesny' },
  { id: 'mystical',  label: 'Mistyczny' },
];

const CHALLENGE_SERIES = [
  {
    id:    'confidence',
    title: '7 dni pewności siebie',
    desc:  'Codziennie jedna afirmacja, która buduje fundament wewnętrznej siły.',
    color: '#F97316',
    icon:  '◉',
    days: [
      'Moja wartość nie zależy od cudzego spojrzenia — istnieje we mnie jako stały fundament.',
      'Krok po kroku, oddech po oddechu — wchodzę w przestrzeń, która jest moja.',
      'Moje ciało zna odpowiedź. Ufam temu, co czuję zanim zacznę tłumaczyć.',
      'Wybór dla siebie nie jest egoizmem — jest wyrazem szacunku do życia, które mi dano.',
      'Mój głos ma prawo brzmieć. Nie muszę go ściszać, żeby ktoś poczuł się bezpiecznie.',
      'Pewność, której szukam na zewnątrz, mieszka tuż pod mostkiem. Wracam tam teraz.',
      'Jestem gotowa/gotowy na to, co przychodzi — bo znam siebie wystarczająco dobrze.',
    ],
  },
  {
    id:    'abundance',
    title: '7 dni obfitości',
    desc:  'Sekwencja otwierająca na przepływ energii, zasobów i wdzięczności.',
    color: '#34D399',
    icon:  '🌿',
    days: [
      'Moje życie jest pełne rzeczy, które trudno zmierzyć, ale łatwo poczuć.',
      'Dobro nie omija mnie — płynie do mnie przez ścieżki, których jeszcze nie widzę.',
      'Jestem wystarczająca/wystarczający. Już teraz. Bez uzupełnień i poprawek.',
      'Otwieram się na przyjmowanie — bez wstydu, bez warunków, bez tłumaczenia.',
      'Przepływ pieniędzy, energii i miłości jest dla mnie naturalny jak oddech.',
      'Moje zasoby odnawiają się, kiedy działam zgodnie z własną prawdą.',
      'Wdzięczność jest moim pierwszym krokiem ku temu, czego jeszcze nie mam.',
    ],
  },
  {
    id:    'healing',
    title: '7 dni uzdrowienia',
    desc:  'Łagodna praca z ciałem, przeszłością i miejscami, które bolą.',
    color: '#A78BFA',
    icon:  '✧',
    days: [
      'Moje ciało wie, jak wracać do równowagi. Ufam temu procesowi każdego dnia.',
      'To, co wydarzyło się wcześniej, nie definiuje tego, co jest możliwe teraz.',
      'Leczę się powoli i nie muszę tego nikomu tłumaczyć ani udowadniać.',
      'Każda trudna emocja jest posłańcem — słucham jej z szacunkiem i bez lęku.',
      'Moje serce może poczuć ból i jednocześnie pozostać miękkie i otwarte.',
      'Pozwalam sobie być w procesie. Uzdrowienie nie jest celem — jest drogą.',
      'Noszę w sobie siłę do przejścia przez to, co nieprzyjemne, bez uciekania.',
    ],
  },
];

// ─── Animated orb with pan-tilt gesture ────────────────────────────────────
const AnimatedPulseOrb = React.memo(({ accent }: { accent: string }) => {
  const scale  = useSharedValue(1);
  const tiltX  = useSharedValue(0);
  const tiltY  = useSharedValue(0);
  const glow   = useSharedValue(0.55);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.13, { duration: 2200 }), withTiming(0.89, { duration: 2200 })),
      -1, true,
    );
    glow.value = withRepeat(
      withSequence(withTiming(0.85, { duration: 1800 }), withTiming(0.45, { duration: 1800 })),
      -1, true,
    );
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = withSpring(e.translationY / 18, { damping: 12 });
      tiltY.value = withSpring(e.translationX / 18, { damping: 12 });
    })
    .onEnd(() => {
      tiltX.value = withSpring(0, { damping: 10 });
      tiltY.value = withSpring(0, { damping: 10 });
    });

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: interpolate(glow.value, [0.45, 0.85], [1, 1.18]) }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={orbStyle}>
        <Animated.View style={[{ position: 'absolute', top: -20, left: -20, right: -20, bottom: -20 }, glowStyle]}>
          <Svg width={170} height={170} style={{ opacity: 0.22 }}>
            <Defs>
              <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={accent} stopOpacity="1" />
                <Stop offset="100%" stopColor={accent} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={85} cy={85} r={80} fill="url(#glow)" />
          </Svg>
        </Animated.View>
        <Svg width={130} height={130}>
          <Defs>
            <RadialGradient id="iris" cx="42%" cy="38%" r="55%">
              <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.35" />
              <Stop offset="40%"  stopColor={accent}  stopOpacity="0.90" />
              <Stop offset="100%" stopColor={accent}  stopOpacity="0.40" />
            </RadialGradient>
          </Defs>
          <Circle cx={65} cy={65} r={60} fill={accent + '14'} stroke={accent + '30'} strokeWidth={1} />
          <Circle cx={65} cy={65} r={44} fill={accent + '22'} stroke={accent + '40'} strokeWidth={1.2} />
          <Circle cx={65} cy={65} r={28} fill={accent + '35'} />
          <Circle cx={65} cy={65} r={16} fill="url(#iris)" />
          <Circle cx={58} cy={59} r={3.5}  fill="#FFFFFF" opacity={0.55} />
          <Circle cx={70} cy={67} r={1.8}  fill="#FFFFFF" opacity={0.30} />
        </Svg>
      </Animated.View>
    </GestureDetector>
  );
});

// ─── Weekly calendar strip ──────────────────────────────────────────────────
const WEEK_DAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

interface WeekDay {
  dayLabel: string;
  dateLabel: string;
  hasAffirmation: boolean;
  rating: number; // 0-5
  isToday: boolean;
}

function buildWeekData(): WeekDay[] {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    return {
      dayLabel: WEEK_DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1],
      dateLabel: String(d.getDate()),
      hasAffirmation: i < 6 ? Math.random() > 0.3 : true,
      rating: i < 6 ? Math.floor(Math.random() * 4) + (Math.random() > 0.4 ? 1 : 0) : 0,
      isToday: i === 6,
    };
  });
}

const WeekCalendar = React.memo(({ accent, textColor, subColor, cardBg }: any) => {
  const [week] = useState(buildWeekData);
  const [ratings, setRatings] = useState<number[]>(week.map((d) => d.rating));

  return (
    <View style={[wc.container, { backgroundColor: cardBg, borderColor: accent + '28' }]}>
      <LinearGradient colors={[accent + '10', 'transparent']} style={StyleSheet.absoluteFill} />
      <View style={wc.header}>
        <Calendar color={accent} size={14} strokeWidth={1.8} />
        <Text style={[wc.title, { color: accent }]}>TYGODNIOWY KALENDARZ AFIRMACJI</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={wc.rail}>
        {week.map((day, i) => (
          <View key={i} style={[wc.dayCol, day.isToday && { backgroundColor: accent + '18', borderRadius: 14 }]}>
            <Text style={[wc.dayLabel, { color: day.isToday ? accent : subColor }]}>{day.dayLabel}</Text>
            <Text style={[wc.dateLabel, { color: day.isToday ? accent : textColor }]}>{day.dateLabel}</Text>
            <View style={[wc.checkCircle, {
              backgroundColor: day.hasAffirmation ? accent + '22' : 'transparent',
              borderColor: day.hasAffirmation ? accent + '66' : subColor + '44',
            }]}>
              {day.hasAffirmation
                ? <Check color={accent} size={11} strokeWidth={2.5} />
                : <Text style={{ color: subColor, fontSize: 9 }}>—</Text>
              }
            </View>
            {day.hasAffirmation && (
              <View style={wc.starsRow}>
                {Array.from({ length: 3 }, (_, si) => (
                  <Pressable key={si} onPress={() => {
                    const newR = [...ratings];
                    newR[i] = si + 1 === ratings[i] ? 0 : si + 1;
                    setRatings(newR);
                  }}>
                    <Star
                      size={9}
                      color={accent}
                      fill={si < ratings[i] ? accent : 'transparent'}
                      strokeWidth={1.5}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      <Text style={[wc.hint, { color: subColor }]}>Dotknij gwiazdek, żeby ocenić rezonans afirmacji danego dnia.</Text>
    </View>
  );
});

const wc = StyleSheet.create({
  container: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden', gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },
  rail: { gap: 6, paddingVertical: 4 },
  dayCol: { alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, minWidth: 46 },
  dayLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  dateLabel: { fontSize: 14, fontWeight: '700' },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  hint: { fontSize: 11, lineHeight: 16 },
});

// ─── 108 Repetitions practice modal ────────────────────────────────────────
const PracticeModal = React.memo(({ visible, affirmation, onClose, accent, textColor, subColor }: any) => {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const breathScale = useSharedValue(1);
  const countScale  = useSharedValue(1);
  const phaseRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runBreathCycle = useCallback(() => {
    setPhase('inhale');
    breathScale.value = withTiming(1.35, { duration: 4000 }, () => {
      runOnJS(setPhase)('hold');
      breathScale.value = withTiming(1.35, { duration: 2000 }, () => {
        runOnJS(setPhase)('exhale');
        breathScale.value = withTiming(1, { duration: 6000 }, () => {
          runOnJS(setPhase)('idle');
        });
      });
    });
  }, []);

  const handleTap = useCallback(() => {
    if (count >= 108) return;
    setCount((c) => c + 1);
    countScale.value = withSequence(withTiming(1.4, { duration: 90 }), withSpring(1, { damping: 12 }));
    if (count % 9 === 0) runBreathCycle();
  }, [count]);

  const breathStyle  = useAnimatedStyle(() => ({ transform: [{ scale: breathScale.value }] }));
  const counterStyle = useAnimatedStyle(() => ({ transform: [{ scale: countScale.value }] }));

  const PHASE_LABELS: Record<string, string> = {
    idle: 'Dotknij orba, aby powtórzyć',
    inhale: 'Wdech... powoli',
    hold: 'Zatrzymaj oddech',
    exhale: 'Wydech... zwalniaj',
  };

  return (
    <Modal visible={visible} animationType="fade" transparent presentationStyle="overFullScreen">
      <View style={pm.overlay}>
        <LinearGradient colors={['#0A0512CC', '#150A20EE']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={pm.safe} edges={['top']}>
          <View style={pm.topRow}>
            <Pressable onPress={() => { setCount(0); setPhase('idle'); onClose(); }} hitSlop={14}>
              <X color="#FFFFFF" size={24} strokeWidth={1.5} />
            </Pressable>
            <Text style={pm.modalTitle}>108 Powtórzeń</Text>
            <View style={{ width: 24 }} />
          </View>

          <Text style={pm.affText}>„{affirmation}"</Text>

          <View style={pm.orbWrap}>
            <Animated.View style={breathStyle}>
              <Pressable onPress={handleTap} style={pm.orbBtn}>
                <Svg width={160} height={160}>
                  <Defs>
                    <RadialGradient id="pm_g" cx="50%" cy="50%" r="50%">
                      <Stop offset="0%"   stopColor={accent} stopOpacity="0.80" />
                      <Stop offset="100%" stopColor={accent} stopOpacity="0.10" />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={80} cy={80} r={76} fill={accent + '18'} stroke={accent + '55'} strokeWidth={1.2} />
                  <Circle cx={80} cy={80} r={54} fill={accent + '25'} />
                  <Circle cx={80} cy={80} r={34} fill="url(#pm_g)" />
                  <Circle cx={72} cy={72} r={5}  fill="#FFFFFF" opacity={0.35} />
                </Svg>
              </Pressable>
            </Animated.View>
          </View>

          <Animated.Text style={[pm.counter, counterStyle, { color: accent }]}>
            {count} / 108
          </Animated.Text>
          <Text style={pm.phaseLabel}>{PHASE_LABELS[phase]}</Text>

          {/* Progress mala dots */}
          <View style={pm.malaRow}>
            {Array.from({ length: 36 }, (_, i) => (
              <View
                key={i}
                style={[pm.malaDot, {
                  backgroundColor: i < Math.floor(count / 3)
                    ? accent
                    : accent + '33',
                  width: i % 9 === 0 ? 10 : 6,
                  height: i % 9 === 0 ? 10 : 6,
                  borderRadius: i % 9 === 0 ? 5 : 3,
                }]}
              />
            ))}
          </View>

          {count >= 108 && (
            <View style={pm.completeBanner}>
              <Text style={[pm.completeTxt, { color: accent }]}>✦ Mala zakończona. Pięknie. ✦</Text>
            </View>
          )}

          {/* Breathing steps */}
          <View style={pm.guideRow}>
            {['4s wdech', '2s zatrzymanie', '6s wydech'].map((g, i) => (
              <View key={i} style={[pm.guidePill, { borderColor: accent + '44', backgroundColor: accent + '12' }]}>
                <Text style={{ color: accent, fontSize: 11, fontWeight: '700' }}>{g}</Text>
              </View>
            ))}
          </View>
          <Text style={pm.guideHint}>Wzorzec oddechowy 4-2-6 aktywuje spokój układu nerwowego.</Text>
        </SafeAreaView>
      </View>
    </Modal>
  );
});

const pm = StyleSheet.create({
  overlay: { flex: 1 },
  safe: { flex: 1, alignItems: 'center', paddingHorizontal: 22 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: 10, marginBottom: 20 },
  modalTitle: { fontSize: 15, fontWeight: '700', color: '#F5F1EA', letterSpacing: 0.5 },
  affText: { fontSize: 16, fontStyle: 'italic', color: '#F5F1EA', lineHeight: 26, textAlign: 'center', paddingHorizontal: 8, marginBottom: 24 },
  orbWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  orbBtn: { alignItems: 'center', justifyContent: 'center' },
  counter: { fontSize: 32, fontWeight: '800', marginTop: 12, letterSpacing: 1 },
  phaseLabel: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4, marginBottom: 12 },
  malaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', paddingHorizontal: 16, marginVertical: 12 },
  malaDot: { borderRadius: 3 },
  completeBanner: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'rgba(244,114,182,0.15)', borderRadius: 14, marginBottom: 8 },
  completeTxt: { fontSize: 14, fontWeight: '700', letterSpacing: 1.2 },
  guideRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  guidePill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1 },
  guideHint: { fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 8, textAlign: 'center' },
});

// ─── AI generation controls ─────────────────────────────────────────────────
const GenControls = React.memo(({ tone, setTone, length, setLength, style, setStyle, accent, textColor, subColor, cardBg }: any) => {
  const ToggleRow = ({ label, options, value, onChange }: any) => (
    <View style={gc.row}>
      <Text style={[gc.rowLabel, { color: subColor }]}>{label}</Text>
      <View style={gc.pills}>
        {options.map((o: any) => (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            style={[gc.pill, {
              backgroundColor: value === o.id ? accent + '28' : 'transparent',
              borderColor: value === o.id ? accent + '88' : accent + '30',
            }]}
          >
            <Text style={[gc.pillText, { color: value === o.id ? accent : subColor }]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[gc.container, { backgroundColor: cardBg, borderColor: accent + '28' }]}>
      <LinearGradient colors={[accent + '0C', 'transparent']} style={StyleSheet.absoluteFill} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Layers color={accent} size={14} strokeWidth={1.8} />
        <Text style={[gc.title, { color: accent }]}>STEROWANIE GENEROWANIEM</Text>
      </View>
      <ToggleRow label="Ton" options={TONE_OPTIONS} value={tone} onChange={setTone} />
      <ToggleRow label="Długość" options={LENGTH_OPTIONS} value={length} onChange={setLength} />
      <ToggleRow label="Styl" options={STYLE_OPTIONS} value={style} onChange={setStyle} />
      <Text style={[gc.hint, { color: subColor }]}>Ustawienia wpływają na następne generowanie. Odśwież, aby zastosować.</Text>
    </View>
  );
});

const gc = StyleSheet.create({
  container: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden', gap: 10 },
  title: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rowLabel: { fontSize: 12, fontWeight: '600', width: 60 },
  pills: { flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap', justifyContent: 'flex-end' },
  pill: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  pillText: { fontSize: 11, fontWeight: '600' },
  hint: { fontSize: 11, lineHeight: 16, marginTop: 4 },
});

// ─── Affirmation series challenge cards ─────────────────────────────────────
const SeriesCard = React.memo(({ series, accent, textColor, subColor, cardBg, onStartDay, activeSeries }: any) => {
  const isActive = activeSeries === series.id;
  const today    = new Date().getDay();
  const dayIdx   = today === 0 ? 6 : today - 1;

  return (
    <View style={[sc.card, { borderColor: isActive ? series.color + '88' : series.color + '33', backgroundColor: cardBg }]}>
      <LinearGradient colors={[series.color + '16', 'transparent']} style={StyleSheet.absoluteFill} />
      <View style={sc.header}>
        <View style={[sc.iconBadge, { backgroundColor: series.color + '22', borderColor: series.color + '44' }]}>
          <Text style={{ fontSize: 16 }}>{series.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sc.title, { color: textColor }]}>{series.title}</Text>
          <Text style={[sc.desc, { color: subColor }]}>{series.desc}</Text>
        </View>
      </View>
      <View style={sc.daysRow}>
        {series.days.map((_: any, i: number) => (
          <View
            key={i}
            style={[sc.dayDot, {
              backgroundColor: i <= dayIdx && isActive ? series.color + '88' : series.color + '22',
              borderColor: series.color + '55',
              width: i === dayIdx ? 24 : 18,
              borderRadius: i === dayIdx ? 6 : 9,
            }]}
          >
            {i <= dayIdx && isActive && <Check size={8} color="#FFF" strokeWidth={3} />}
          </View>
        ))}
      </View>
      <Pressable
        onPress={() => onStartDay(series.id, series.days[dayIdx])}
        style={[sc.btn, { backgroundColor: series.color + '22', borderColor: series.color + '55' }]}
      >
        <Text style={[sc.btnText, { color: series.color }]}>{isActive ? `Dzień ${dayIdx + 1} — kontynuuj` : 'Rozpocznij wyzwanie'}</Text>
        <ArrowRight color={series.color} size={14} strokeWidth={1.8} />
      </Pressable>
    </View>
  );
});

const sc = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden', gap: 14 },
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconBadge: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  desc: { fontSize: 12, lineHeight: 18 },
  daysRow: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dayDot: { height: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  btnText: { fontSize: 13, fontWeight: '700' },
});

// ─── Journal entries (saved affirmations) ───────────────────────────────────
interface SavedAffirmation {
  id: string;
  text: string;
  category: string;
  date: string;
  reflection: string;
}

const AffirmationJournal = React.memo(({ saved, setSaved, accent, textColor, subColor, cardBg }: any) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  if (!saved || saved.length === 0) {
    return (
      <View style={[aj.empty, { backgroundColor: cardBg, borderColor: accent + '28' }]}>
        <BookOpen color={accent} size={22} strokeWidth={1.5} />
        <Text style={[aj.emptyTitle, { color: textColor }]}>Brak zapisanych afirmacji</Text>
        <Text style={[aj.emptyHint, { color: subColor }]}>Dotknij ♡ przy afirmacji, aby zapisać ją w dzienniku.</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {saved.map((item: SavedAffirmation) => (
        <View key={item.id} style={[aj.card, { backgroundColor: cardBg, borderColor: accent + '28' }]}>
          <LinearGradient colors={[accent + '0C', 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={aj.topRow}>
            <View style={[aj.catBadge, { backgroundColor: accent + '1A', borderColor: accent + '44' }]}>
              <Text style={{ color: accent, fontSize: 10, fontWeight: '700' }}>{item.category}</Text>
            </View>
            <Text style={[aj.dateText, { color: subColor }]}>{item.date}</Text>
          </View>
          <Text style={[aj.affText, { color: textColor }]}>„{item.text}"</Text>
          {editId === item.id ? (
            <View style={{ gap: 8 }}>
              <TextInput
                value={editText}
                onChangeText={setEditText}
                multiline
                placeholder="Twoja refleksja..."
                placeholderTextColor={subColor}
                style={[aj.input, { color: textColor, borderColor: accent + '44', backgroundColor: accent + '0A' }]}
              />
              <Pressable
                onPress={() => {
                  setSaved((prev: SavedAffirmation[]) =>
                    prev.map((s) => s.id === item.id ? { ...s, reflection: editText } : s)
                  );
                  setEditId(null);
                }}
                style={[aj.saveBtn, { backgroundColor: accent + '22', borderColor: accent + '55' }]}
              >
                <Text style={{ color: accent, fontSize: 13, fontWeight: '700' }}>Zapisz refleksję</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => { setEditId(item.id); setEditText(item.reflection); }}>
              <Text style={[aj.reflectionText, { color: item.reflection ? subColor : accent + 'AA' }]}>
                {item.reflection || '+ Dodaj swoją refleksję...'}
              </Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
});

const aj = StyleSheet.create({
  empty: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '600' },
  emptyHint: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden', gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  dateText: { fontSize: 11 },
  affText: { fontSize: 14.5, fontStyle: 'italic', lineHeight: 23 },
  reflectionText: { fontSize: 12.5, lineHeight: 20 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 20, minHeight: 72, textAlignVertical: 'top' },
  saveBtn: { paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
});

// ─── "Dla kogoś" modal ───────────────────────────────────────────────────────

// ─── Main screen ─────────────────────────────────────────────────────────────
export const AIDailyAffirmationsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { themeName, userData, favoriteAffirmations, toggleFavoriteAffirmation } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight    = currentTheme.background.startsWith('#F');
  const accent     = currentTheme.primary || ACCENT;
  const textColor  = isLight ? '#1A1410' : '#F5F1EA';
  const subColor   = isLight ? '#6A5A48' : '#B0A393';
  const cardBg     = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const divColor   = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)';

  const dailyPlan = SoulEngineService.generateDailyPlan();
  const mood      = dailyPlan.affirmationGuidance?.featured?.category || 'peace';
  const archetype = dailyPlan.archetype?.name || 'Mędrzec';
  const moonPhase = dailyPlan.moonPhase?.name || 'Księżyc';

  // Core state
  const [affirmations,  setAffirmations]  = useState<string[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [featured,      setFeatured]      = useState('');

  // Generation controls
  const [genTone,    setGenTone]    = useState('gentle');
  const [genLength,  setGenLength]  = useState('medium');
  const [genStyle,   setGenStyle]   = useState('mystical');
  const [showControls, setShowControls] = useState(false);

  // Modals
  const [showPractice, setShowPractice] = useState(false);
  const [showFsModal,  setShowFsModal]  = useState(false);
  const [fsNameInput,  setFsNameInput]  = useState('');
  const [forSomeone,   setForSomeone]   = useState(false);
  const [fsName,       setFsName]       = useState('');

  // Series
  const [activeSeries, setActiveSeries] = useState<string | null>(null);

  // Journal
  const [savedAffirmations, setSavedAffirmations] = useState<SavedAffirmation[]>([]);
  const [showJournal, setShowJournal] = useState(false);

  // Star favourite
  const [starred, setStarred] = useState(false);

  const categoryDescriptions = useMemo(() => ({
    all:         'Zbiór afirmacji dobranych do archetypu dnia, aktualnego nastroju i Twojej energii.',
    love:        'Zdania wspierające czułość, relacje i łagodne otwieranie serca.',
    abundance:   'Treści wspierające poczucie dostatku, zaufania i gotowości do przyjmowania.',
    healing:     'Łagodna praca z ciałem, emocjami i miejscami, które potrzebują uważności.',
    transform:   'Afirmacje towarzyszące metamorfozie i przejściu w nową wersję siebie.',
    protection:  'Słowa wzmacniające granice, bezpieczeństwo i zakorzenienie.',
    confidence:  'Afirmacje budujące fundament wewnętrznej siły i wiary w swoje wybory.',
    mission:     'Zdania porządkujące cele, powołanie i sens codziennych działań.',
    peace:       'Afirmacje porządkujące myśli, intuicję i kierunek działania.',
    energy:      'Afirmacje dla odzyskania rytmu, mocy i poczucia przepływu.',
  }), []);

  const generateAffirmations = async () => {
    setLoading(true);

    const zodiac = userData.birthDate
      ? (() => { try { return require('../features/horoscope/utils/astrology').getZodiacSign(userData.birthDate); } catch { return ''; } })()
      : '';

    const category     = activeCategory !== 'all' ? activeCategory : mood;
    const categoryLabels: Record<string, string> = {
      love:        'miłość i relacje',
      abundance:   'obfitość i dostatek',
      healing:     'uzdrowienie i regeneracja',
      transform:   'transformacja i zmiana',
      protection:  'ochrona i bezpieczeństwo',
      confidence:  'pewność siebie i moc',
      mission:     'misja i cel',
      peace:       'spokój, ukojenie i regulacja',
      energy:      'energia i witalność',
    };
    const categoryLabel = categoryLabels[category] || category;

    const toneLabels: Record<string, string> = {
      gentle: 'delikatnym, ciepłym i wspierającym',
      strong: 'mocnym, zdecydowanym i ugruntowanym',
      poetic: 'poetyckim, metaforycznym i obrazowym',
    };
    const lengthLabels: Record<string, string> = {
      short: 'krótkie (jedno zdanie, max 10 słów)',
      medium: 'średnie (jedno zdanie, 10-18 słów)',
      long: 'rozbudowane (dwa zdania, 20-30 słów)',
    };
    const styleLabels: Record<string, string> = {
      classic:  'klasycznym: jasnym, bezpośrednim i opartym na tradycji afirmacji',
      modern:   'nowoczesnym: psychologicznym, przyziemnym i osadzonym w ciele',
      mystical: 'mistycznym: z odniesieniami do natury, cykli i duszy',
    };

    const forPerson = forSomeone && fsName
      ? `Tworzysz afirmacje dla osoby o imieniu ${fsName}${zodiac ? ` (znak ${zodiac})` : ''}.`
      : userData.name
        ? `Tworzysz afirmacje dla ${userData.name}${zodiac ? `, osoby spod znaku ${zodiac}` : ''}.`
        : zodiac
          ? `Tworzysz afirmacje dla osoby spod znaku ${zodiac}.`
          : 'Tworzysz afirmacje dla osoby w duchowym procesie i wrażliwym momencie dnia.';

    const prompt = `Jesteś głębokim przewodnikiem duchowym tworzącym afirmacje, które naprawdę rezonują. ${forPerson}
Aktywny archetyp energetyczny: ${archetype}.${moonPhase ? ` Faza Księżyca: ${moonPhase}.` : ''}
Obszar afirmacji: ${categoryLabel}.
Ton: ${toneLabels[genTone] || genTone}.
Długość: ${lengthLabels[genLength] || genLength}.
Styl: ${styleLabels[genStyle] || genStyle}.

Wygeneruj 5 afirmacji, które:
- zaczynają się od "Ja", "Jestem", "Moje", "Moja", "Mój", "Mam" albo "Czuję"
- są konkretne, obrazowe i osadzone w ciele
- brzmią jak prawda, którą ktoś już przeczuwa, ale potrzebuje ją usłyszeć
- różnią się emocjonalnym ciężarem i tonem, ale tworzą spójną całość
- są eleganckie, spokojne i duchowo dojrzałe — nie banalne ani coachingowe

Odpowiedz WYŁĄCZNIE listą 5 afirmacji, każda w osobnej linii, bez numerów, bez wstępu i bez podsumowania.`;

    try {
      const text = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      const lines = text
        .split('\n')
        .filter((l: string) => l.trim())
        .map((l: string) => l.replace(/^\d+[\.\)]\s*/, '').replace(/^[-–•]\s*/, '').trim())
        .filter((l: string) => l.length > 10);
      setAffirmations(lines.slice(0, 5));
      setFeatured(lines[0] || '');
    } catch {
      const fallback = [
        'Jestem gotowa przyjąć dobro, które współbrzmi z moją prawdą i spokojem.',
        'Moja energia wraca do mnie wtedy, gdy wybieram obecność zamiast pośpiechu.',
        'Czuję, że moje granice chronią to, co we mnie najdelikatniejsze i najcenniejsze.',
        'Mam w sobie mądrość, która prowadzi mnie łagodnie, ale bardzo konkretnie.',
        'Moje serce może pozostać otwarte, nawet gdy wybieram siebie z większą stanowczością.',
      ];
      setAffirmations(fallback);
      setFeatured(fallback[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { generateAffirmations(); }, [activeCategory]);

  const shareAffirmation = async (text: string) => {
    try { await Share.share({ message: `"${text}"\n\n— Aethera` }); } catch {}
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Skopiowano', 'Afirmacja jest w schowku.');
  };

  const saveToJournal = (aff: string) => {
    const now  = new Date();
    const date = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
    const cat  = AFFIRMATION_CATEGORIES.find((c) => c.id === activeCategory)?.label || 'Wszystkie';
    const id   = `${Date.now()}_${aff.slice(0, 12)}`;
    setSavedAffirmations((prev) => {
      if (prev.some((s) => s.text === aff)) return prev;
      return [{ id, text: aff, category: cat, date, reflection: '' }, ...prev];
    });
    Alert.alert('Zapisano', 'Afirmacja trafiła do Twojego dziennika.');
  };

  const handleStartSeries = (seriesId: string, dayAffirmation: string) => {
    setActiveSeries(seriesId);
    setFeatured(dayAffirmation);
  };

  const activeCatData = AFFIRMATION_CATEGORIES.find((c) => c.id === activeCategory);
  const displayLabel  = forSomeone && fsName
    ? `AFIRMACJA DLA: ${fsName.toUpperCase()}`
    : 'AFIRMACJA DNIA';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[aa.container, { backgroundColor: isLight ? '#FDF0F8' : '#0A0510' }]}>
        <LinearGradient
          colors={isLight ? ['#FDF0F8', '#F7E4F2', '#F0D8EC'] : ['#0A0510', '#130818', '#1C0E24']}
          style={StyleSheet.absoluteFill}
        />

        {/* Background star particles */}
        <Svg width={SW} height={260} style={{ position: 'absolute', top: 0 }} opacity={isLight ? 0.10 : 0.16}>
          <G>
            {Array.from({ length: 18 }, (_, i) => (
              <Circle
                key={i}
                cx={(i * 97 + 30) % SW}
                cy={(i * 67 + 20) % 240}
                r={i % 5 === 0 ? 2.8 : i % 3 === 0 ? 1.8 : 1.0}
                fill={accent}
                opacity={0.6}
              />
            ))}
          </G>
        </Svg>

        <SafeAreaView style={aa.safeArea} edges={['top']}>
          {/* ── Header ── */}
          <View style={aa.header}>
            <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={aa.backBtn} hitSlop={14}>
              <ChevronLeft color={accent} size={28} strokeWidth={1.5} />
            </Pressable>
            <View style={aa.headerCenter}>
              <Typography variant="premiumLabel" color={accent}>Afirmacje AI</Typography>
              <Typography variant="screenTitle" style={{ color: textColor, marginTop: 2 }}>Codzienne słowa mocy</Typography>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Pressable onPress={() => setShowFsModal(true)} hitSlop={10} style={[aa.iconBtn, { borderColor: accent + '44' }]}>
                <Users color={accent} size={15} strokeWidth={1.8} />
              </Pressable>
              <Pressable onPress={() => setStarred((s) => !s)} hitSlop={10} style={[aa.iconBtn, { borderColor: accent + '44' }]}>
                <Star color={accent} size={15} fill={starred ? accent : 'transparent'} strokeWidth={1.8} />
              </Pressable>
              <Pressable onPress={generateAffirmations} hitSlop={10} style={[aa.iconBtn, { borderColor: accent + '44' }]}>
                <RefreshCw color={accent} size={15} strokeWidth={1.8} />
              </Pressable>
            </View>
          </View>

          {/* "Dla kogoś" banner */}
          {forSomeone && (
            <Animated.View entering={FadeIn.duration(300)} style={[aa.fsBanner, { backgroundColor: accent + '16', borderColor: accent + '44' }]}>
              <Users color={accent} size={13} strokeWidth={1.8} />
              <Text style={[aa.fsBannerText, { color: accent }]}>Afirmacje dla: {fsName}</Text>
              <Pressable onPress={() => { setForSomeone(false); setFsName(''); }} hitSlop={10}>
                <X color={accent} size={13} strokeWidth={2} />
              </Pressable>
            </Animated.View>
          )}

          <KeyboardAvoidingView
            behavior="padding"
            style={{ flex: 1 }}
            keyboardVerticalOffset={insets.top + 56}
          >
          <ScrollView
            contentContainerStyle={[aa.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') + 20 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Animated orb hero ── */}
            <Animated.View entering={FadeInDown.duration(500)} style={aa.orbSection}>
              <AnimatedPulseOrb accent={accent} />
              <View style={{ alignItems: 'center', gap: 6, marginTop: 8 }}>
                <Typography variant="premiumLabel" color={accent} style={{ textAlign: 'center' }}>
                  Spersonalizowane dla {forSomeone && fsName ? fsName : (userData.name || 'Ciebie')} · {archetype}
                </Typography>
                <View style={[aa.moonBadge, { backgroundColor: accent + '18', borderColor: accent + '44' }]}>
                  <Moon color={accent} size={10} strokeWidth={1.8} />
                  <Text style={[aa.moonBadgeText, { color: accent }]}>{moonPhase}</Text>
                </View>
                <Text style={[aa.orbSubtext, { color: subColor }]}>
                  Zatrzymaj się na moment i wybierz słowa, które dziś mają stać się Twoim wewnętrznym kierunkiem.
                </Text>
              </View>
            </Animated.View>

            {/* ── Insight card ── */}
            <Animated.View entering={FadeInDown.delay(80).duration(420)}>
              <View style={[aa.insightCard, { backgroundColor: cardBg, borderColor: accent + '24' }]}>
                <LinearGradient colors={[accent + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                <Typography variant="premiumLabel" color={accent}>Nastrój przewodni</Typography>
                <Text style={[aa.insightTitle, { color: textColor }]}>
                  {activeCategory === 'all'
                    ? 'Dzisiejsza sekwencja dopasowana do Twojej energii'
                    : `Przestrzeń: ${activeCatData?.label}`}
                </Text>
                <Text style={[aa.insightBody, { color: subColor }]}>
                  {categoryDescriptions[activeCategory] || categoryDescriptions.all}
                </Text>
              </View>
            </Animated.View>

            {/* ── Category selector ── */}
            <Animated.View entering={FadeInDown.delay(120).duration(420)}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={aa.catsRail}>
                {AFFIRMATION_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setActiveCategory(cat.id)}
                    style={[aa.catChip, {
                      borderColor: activeCategory === cat.id ? (cat.color || accent) : accent + '33',
                      backgroundColor: activeCategory === cat.id ? (cat.color || accent) + '22' : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                    }]}
                  >
                    <Text style={aa.catEmoji}>{cat.emoji}</Text>
                    <Text style={[aa.catLabel, { color: activeCategory === cat.id ? (cat.color || accent) : subColor }]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>

            {/* ── Generation controls toggle ── */}
            <Animated.View entering={FadeInDown.delay(140).duration(400)}>
              <Pressable
                onPress={() => setShowControls((s) => !s)}
                style={[aa.controlsToggle, { borderColor: accent + '33', backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)' }]}
              >
                <Layers color={accent} size={14} strokeWidth={1.8} />
                <Text style={[aa.controlsToggleText, { color: subColor }]}>
                  Sterowanie generowaniem — {TONE_OPTIONS.find((t) => t.id === genTone)?.label} · {STYLE_OPTIONS.find((s) => s.id === genStyle)?.label}
                </Text>
                <ArrowRight color={accent} size={13} strokeWidth={1.5} style={{ transform: [{ rotate: showControls ? '90deg' : '0deg' }] }} />
              </Pressable>
              {showControls && (
                <View style={{ marginTop: 8 }}>
                  <GenControls
                    tone={genTone} setTone={setGenTone}
                    length={genLength} setLength={setGenLength}
                    style={genStyle} setStyle={setGenStyle}
                    accent={accent} textColor={textColor} subColor={subColor} cardBg={cardBg}
                  />
                </View>
              )}
            </Animated.View>

            {/* ── Affirmations content ── */}
            {loading ? (
              <View style={aa.loadingWrap}>
                <ActivityIndicator color={accent} size="large" />
                <Text style={[aa.loadingText, { color: subColor }]}>Oracle układa dla Ciebie spokojny zestaw afirmacji...</Text>
              </View>
            ) : (
              <>
                {/* ── Today's showcase card ── */}
                {featured ? (
                  <Animated.View entering={FadeInDown.delay(150).duration(500)}>
                    <View style={[aa.featuredCard, { backgroundColor: cardBg, borderColor: accent + '55' }]}>
                      <LinearGradient colors={[accent + '22', accent + '08', 'transparent']} style={StyleSheet.absoluteFill} />
                      <View style={aa.featuredTopRow}>
                        <View style={[aa.featuredBadge, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
                          <Sparkles color={accent} size={11} strokeWidth={1.8} />
                          <Text style={[aa.featuredBadgeText, { color: accent }]}>{displayLabel}</Text>
                        </View>
                        <View style={[aa.moonPhaseBadge, { backgroundColor: accent + '15', borderColor: accent + '33' }]}>
                          <Moon color={accent} size={10} strokeWidth={1.5} />
                          <Text style={[aa.moonPhaseText, { color: accent }]}>{moonPhase}</Text>
                        </View>
                      </View>
                      <Text style={[aa.featuredText, { color: textColor }]}>„{featured}"</Text>
                      <Text style={[aa.featuredSubtext, { color: subColor }]}>
                        Powtórz ją rano, przed ważną decyzją albo wtedy, gdy chcesz wrócić do własnego środka.
                      </Text>
                      <View style={aa.featuredActions}>
                        <Pressable
                          onPress={() => saveToJournal(featured)}
                          style={[aa.actionBtn, { backgroundColor: accent + '18', borderColor: accent + '44' }]}
                        >
                          <BookOpen color={accent} size={14} strokeWidth={1.8} />
                          <Text style={[aa.actionBtnText, { color: accent }]}>Zapisz w Dzienniku</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => shareAffirmation(featured)}
                          style={[aa.actionBtn, { backgroundColor: accent + '18', borderColor: accent + '44' }]}
                        >
                          <Share2 color={accent} size={14} strokeWidth={1.8} />
                          <Text style={[aa.actionBtnText, { color: accent }]}>Podziel się</Text>
                        </Pressable>
                      </View>
                      <Pressable
                        onPress={() => setShowPractice(true)}
                        style={[aa.practiceBtn, { backgroundColor: accent, borderColor: accent }]}
                      >
                        <Flame color="#FFFFFF" size={15} strokeWidth={2} />
                        <Text style={aa.practiceBtnText}>108 powtórzeń — praktyka mala</Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                ) : null}

                {/* ── Affirmation list ── */}
                <Text style={[aa.sectionLabel, { color: accent }]}>✦ SEKWENCJA NA DZIŚ</Text>
                {affirmations.map((aff, idx) => {
                  const affId = `ai_${idx}_${aff.slice(0, 20)}`;
                  const isFav = favoriteAffirmations?.includes(affId);
                  return (
                    <Animated.View key={idx} entering={FadeInDown.delay(210 + idx * 60).duration(400)}>
                      <View style={[aa.affCard, { backgroundColor: cardBg, borderColor: accent + '28' }]}>
                        <LinearGradient
                          colors={[accent + '08', 'transparent']}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={StyleSheet.absoluteFill}
                        />
                        <Text style={[aa.affIndex, { color: accent }]}>{String(idx + 1).padStart(2, '0')}</Text>
                        <Text style={[aa.affText, { color: textColor }]}>{aff}</Text>
                        <View style={[aa.affDivider, { backgroundColor: divColor }]} />
                        <View style={aa.affActions}>
                          <Pressable onPress={() => toggleFavoriteAffirmation?.(affId)} hitSlop={10} style={aa.affActionBtn}>
                            <Heart color={isFav ? accent : subColor} size={16} fill={isFav ? accent : 'transparent'} strokeWidth={1.8} />
                          </Pressable>
                          <Pressable onPress={() => copyToClipboard(aff)} hitSlop={10} style={aa.affActionBtn}>
                            <Copy color={subColor} size={15} strokeWidth={1.8} />
                          </Pressable>
                          <Pressable onPress={() => shareAffirmation(aff)} hitSlop={10} style={aa.affActionBtn}>
                            <Share2 color={subColor} size={15} strokeWidth={1.8} />
                          </Pressable>
                          <Pressable onPress={() => saveToJournal(aff)} hitSlop={10} style={aa.affActionBtn}>
                            <BookOpen color={subColor} size={15} strokeWidth={1.8} />
                          </Pressable>
                          <Pressable onPress={() => setFeatured(aff)} hitSlop={10} style={aa.affActionBtn}>
                            <Sparkles color={featured === aff ? accent : subColor} size={15} strokeWidth={1.8} />
                          </Pressable>
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </>
            )}

            {/* ── Weekly calendar ── */}
            <Animated.View entering={FadeInDown.delay(380).duration(420)}>
              <Text style={[aa.sectionLabel, { color: accent }]}>✦ KALENDARZ TYGODNIOWY</Text>
              <WeekCalendar accent={accent} textColor={textColor} subColor={subColor} cardBg={cardBg} />
            </Animated.View>

            {/* ── Mantra dnia ── */}
            {featured ? (
              <Animated.View entering={FadeInDown.delay(420).duration(420)}>
                <View style={[aa.mantraCard, { backgroundColor: accent + '12', borderColor: accent + '44' }]}>
                  <LinearGradient colors={[accent + '1A', 'transparent']} style={StyleSheet.absoluteFill} />
                  <Text style={[aa.mantraEyebrow, { color: accent }]}>✦ MANTRA DNIA</Text>
                  <Text style={[aa.mantraWord, { color: textColor }]}>
                    {featured.split(' ').slice(0, 3).join(' ')}
                  </Text>
                  <Text style={[aa.mantraHint, { color: subColor }]}>
                    Wróć do tych słów w chwili rozproszenia. Trzy wyrazy wystarczą, żeby umysł wrócił do centrum.
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    {['Rano', 'Południe', 'Wieczór'].map((t) => (
                      <View key={t} style={[aa.mantraTimeBadge, { backgroundColor: accent + '18', borderColor: accent + '33' }]}>
                        <Text style={{ color: accent, fontSize: 11, fontWeight: '700' }}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Animated.View>
            ) : null}

            {/* ── 4-step practice guide ── */}
            <Animated.View entering={FadeInDown.delay(450).duration(420)}>
              <View style={[aa.practiceCard, { backgroundColor: cardBg, borderColor: accent + '28' }]}>
                <Text style={[aa.sectionLabel, { color: accent, marginBottom: 4 }]}>PRAKTYKA AFIRMACJI — 4 KROKI</Text>
                {[
                  { num: '1', title: 'Zatrzymaj się',       desc: 'Znajdź ciche miejsce. Trzy głębokie oddechy przed czytaniem.' },
                  { num: '2', title: 'Przeczytaj głośno',   desc: 'Twój głos niesie intencję dalej niż myśl. Mów wyraźnie.' },
                  { num: '3', title: 'Poczuj w ciele',      desc: 'Gdzie ta afirmacja ląduje? Klatka piersiowa? Brzuch? Gardło?' },
                  { num: '4', title: 'Zapisz reakcję',      desc: 'Jedna linijka w dzienniku — co poruszyło się po tym zdaniu.' },
                ].map((step, i) => (
                  <View
                    key={i}
                    style={[aa.practiceStep, {
                      borderTopColor: i > 0 ? divColor : 'transparent',
                      borderTopWidth: i > 0 ? 1 : 0,
                    }]}
                  >
                    <View style={[aa.practiceNum, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
                      <Text style={{ color: accent, fontSize: 12, fontWeight: '800' }}>{step.num}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[aa.practiceTitle, { color: textColor }]}>{step.title}</Text>
                      <Text style={[aa.practiceDesc, { color: subColor }]}>{step.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* ── Affirmation series / challenge ── */}
            <Animated.View entering={FadeInDown.delay(480).duration(420)} style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Target color={accent} size={14} strokeWidth={1.8} />
                <Text style={[aa.sectionLabel, { color: accent, marginBottom: 0 }]}>7-DNIOWE WYZWANIA</Text>
              </View>
              {CHALLENGE_SERIES.map((series) => (
                <SeriesCard
                  key={series.id}
                  series={series}
                  accent={accent}
                  textColor={textColor}
                  subColor={subColor}
                  cardBg={cardBg}
                  onStartDay={handleStartSeries}
                  activeSeries={activeSeries}
                />
              ))}
            </Animated.View>

            {/* ── Affirmation journal ── */}
            <Animated.View entering={FadeInDown.delay(510).duration(420)} style={{ gap: 10 }}>
              <Pressable
                onPress={() => setShowJournal((s) => !s)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <BookOpen color={accent} size={14} strokeWidth={1.8} />
                <Text style={[aa.sectionLabel, { color: accent, marginBottom: 0, flex: 1 }]}>
                  DZIENNIK AFIRMACJI {savedAffirmations.length > 0 ? `(${savedAffirmations.length})` : ''}
                </Text>
                <ArrowRight
                  color={accent} size={13} strokeWidth={1.5}
                  style={{ transform: [{ rotate: showJournal ? '90deg' : '0deg' }] }}
                />
              </Pressable>
              {showJournal && (
                <AffirmationJournal
                  saved={savedAffirmations}
                  setSaved={setSavedAffirmations}
                  accent={accent}
                  textColor={textColor}
                  subColor={subColor}
                  cardBg={cardBg}
                />
              )}
            </Animated.View>

            {/* ── Saved favorites ── */}
            {favoriteAffirmations && favoriteAffirmations.length > 0 && (
              <Animated.View entering={FadeInDown.delay(530).duration(420)}>
                <Text style={[aa.sectionLabel, { color: accent }]}>♡ MOJE ULUBIONE ({favoriteAffirmations.length})</Text>
                <View style={[aa.favCard, { backgroundColor: cardBg, borderColor: accent + '28' }]}>
                  <LinearGradient colors={[accent + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                  <Text style={[aa.favHint, { color: subColor }]}>
                    Ulubione afirmacje to te, które rezonują dłużej niż dzień. Wróć do nich w trudniejszych chwilach.
                  </Text>
                  <Text style={[aa.favCount, { color: accent }]}>{favoriteAffirmations.length} zapisanych afirmacji</Text>
                </View>
              </Animated.View>
            )}

            {/* ── Share as image preview ── */}
            {featured ? (
              <Animated.View entering={FadeInDown.delay(550).duration(420)}>
                <View style={[aa.sharePreviewCard, { borderColor: accent + '33' }]}>
                  <LinearGradient
                    colors={isLight ? ['#FDE8F4', '#F4D6ED'] : ['#1C0A28', '#280A30']}
                    style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                  />
                  <View style={aa.sharePreviewInner}>
                    <Text style={[aa.sharePreviewLabel, { color: accent + 'AA' }]}>✦ AETHERA</Text>
                    <Text style={[aa.sharePreviewText, { color: textColor }]}>„{featured}"</Text>
                    <View style={[aa.sharePreviewBar, { backgroundColor: accent + '44' }]} />
                    <Text style={[aa.sharePreviewSub, { color: subColor }]}>{moonPhase} · {archetype}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16 }}>
                    <Pressable
                      onPress={() => shareAffirmation(featured)}
                      style={[aa.shareBtn, { backgroundColor: accent, flex: 1 }]}
                    >
                      <Share2 color="#FFFFFF" size={14} strokeWidth={2} />
                      <Text style={aa.shareBtnText}>Udostępnij kartę</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => copyToClipboard(featured)}
                      style={[aa.shareBtn, { backgroundColor: accent + '22', borderColor: accent + '55', borderWidth: 1 }]}
                    >
                      <Copy color={accent} size={14} strokeWidth={2} />
                      <Text style={[aa.shareBtnText, { color: accent }]}>Kopiuj</Text>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            ) : null}

            {/* ── Info card ── */}
            <Animated.View entering={FadeInDown.delay(570).duration(420)}>
              <View style={[aa.infoCard, { backgroundColor: accent + '0E', borderColor: accent + '28' }]}>
                <Typography variant="cardTitle" style={{ color: textColor }}>Jak pracować z tym ekranem</Typography>
                <Text style={[aa.infoText, { color: subColor }]}>
                  Zacznij od jednej afirmacji, która porusza Cię najmocniej. Powtarzaj ją przez kilka oddechów, a resztę traktuj jak wspierającą sekwencję dla całego dnia.
                </Text>
              </View>
            </Animated.View>

            {/* ── What next ── */}
            <Animated.View entering={FadeInDown.delay(600).duration(420)} style={{ marginTop: 4 }}>
              <Text style={[aa.sectionLabel, { color: accent }]}>✦ CO DALEJ?</Text>
              {[
                { icon: Wind,    label: 'Oddech i regulacja',   sub: 'Połącz afirmację z techniką oddechową',         color: '#34D399', route: 'Breathwork' },
                { icon: Moon,    label: 'Medytacja z intencją', sub: 'Wejdź głębiej w wybraną afirmację',             color: '#A78BFA', route: 'Meditation' },
                { icon: BookOpen,label: 'Dziennik intencji',    sub: 'Zapisz, jak afirmacja pracuje w Tobie dziś',    color: accent,   route: 'JournalEntry', params: { type: 'reflection', prompt: 'Moja dzisiejsza afirmacja to... Jak ją czuję w ciele i co mi mówi?' } },
                { icon: Sparkles,label: 'Karty Intencji',       sub: 'Zamień afirmację w kartę-talizman',             color: '#FBBF24', route: 'IntentionCards' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => navigation.navigate(item.route as any, (item as any).params)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10, backgroundColor: cardBg, borderColor: item.color + '33', overflow: 'hidden' }}
                  >
                    <LinearGradient colors={[item.color + '14', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
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
            </Animated.View>

            <EndOfContentSpacer size="standard" />
          </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* ── 108 Repetitions practice modal ── */}
        <PracticeModal
          visible={showPractice}
          affirmation={featured}
          onClose={() => setShowPractice(false)}
          accent={accent}
          textColor={textColor}
          subColor={subColor}
        />

        {/* ── "Dla kogoś" bottom sheet modal ── */}
        <Modal visible={showFsModal} animationType="slide" transparent presentationStyle="overFullScreen">
          <Pressable style={aa.fsOverlay} onPress={() => setShowFsModal(false)}>
            <View />
          </Pressable>
          <View style={[aa.fsSheet, { backgroundColor: isLight ? '#FDF0F8' : '#1A0A24' }]}>
            <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFill} />
            <View style={[aa.fsHandle, { backgroundColor: accent + '44' }]} />
            <Text style={[aa.fsTitle, { color: textColor }]}>Afirmacje dla kogoś</Text>
            <Text style={[aa.fsHint, { color: subColor }]}>Wpisz imię osoby, dla której chcesz wygenerować afirmacje.</Text>
            <TextInput
              value={fsNameInput}
              onChangeText={setFsNameInput}
              placeholder="Imię osoby..."
              placeholderTextColor={subColor}
              style={[aa.fsInput, { color: textColor, borderColor: accent + '44', backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.07)' }]}
            />
            <Pressable
              onPress={() => {
                if (fsNameInput.trim()) {
                  setFsName(fsNameInput.trim());
                  setForSomeone(true);
                  setShowFsModal(false);
                  setTimeout(() => generateAffirmations(), 100);
                }
              }}
              style={[aa.fsCta, { backgroundColor: accent }]}
            >
              <Text style={aa.fsCtaText}>Generuj afirmacje</Text>
            </Pressable>
            <Pressable onPress={() => setShowFsModal(false)} style={{ alignItems: 'center', paddingTop: 8 }}>
              <Text style={{ color: subColor, fontSize: 13 }}>Anuluj</Text>
            </Pressable>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const aa = StyleSheet.create({
  container:           { flex: 1 },
  safeArea:            { flex: 1 },
  header:              { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingTop: 8, paddingBottom: 10 },
  backBtn:             { width: 40 },
  headerCenter:        { flex: 1, alignItems: 'center' },
  iconBtn:             { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  fsBanner:            { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 22, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  fsBannerText:        { fontSize: 12, fontWeight: '600', flex: 1 },
  scroll:              { paddingHorizontal: 22, paddingTop: 4, gap: 14 },
  orbSection:          { alignItems: 'center', paddingVertical: 10, gap: 8 },
  moonBadge:           { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  moonBadgeText:       { fontSize: 11, fontWeight: '600' },
  orbSubtext:          { fontSize: 13, lineHeight: 21, textAlign: 'center', paddingHorizontal: 10 },
  insightCard:         { borderRadius: 18, borderWidth: 1, padding: 18, gap: 8, overflow: 'hidden' },
  insightTitle:        { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  insightBody:         { fontSize: 13.5, lineHeight: 21 },
  catsRail:            { gap: 8, paddingVertical: 4 },
  catChip:             { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  catEmoji:            { fontSize: 14 },
  catLabel:            { fontSize: 12, fontWeight: '600' },
  controlsToggle:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  controlsToggleText:  { flex: 1, fontSize: 12, lineHeight: 18 },
  loadingWrap:         { alignItems: 'center', paddingVertical: 40, gap: 14 },
  loadingText:         { fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 24 },
  featuredCard:        { borderRadius: 24, borderWidth: 1.5, padding: 22, overflow: 'hidden', gap: 12 },
  featuredTopRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featuredBadge:       { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  featuredBadgeText:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  moonPhaseBadge:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  moonPhaseText:       { fontSize: 10, fontWeight: '600' },
  featuredText:        { fontSize: 21, fontWeight: '400', lineHeight: 33, fontStyle: 'italic' },
  featuredSubtext:     { fontSize: 13, lineHeight: 20 },
  featuredActions:     { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actionBtn:           { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  actionBtnText:       { fontSize: 12, fontWeight: '600' },
  practiceBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, marginTop: 2 },
  practiceBtnText:     { fontSize: 14, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  sectionLabel:        { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 8 },
  affCard:             { borderRadius: 18, borderWidth: 1, padding: 18, gap: 10, overflow: 'hidden' },
  affIndex:            { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  affText:             { fontSize: 15.5, lineHeight: 25, fontStyle: 'italic' },
  affDivider:          { height: 1, marginVertical: 2 },
  affActions:          { flexDirection: 'row', gap: 14, justifyContent: 'flex-end', alignItems: 'center' },
  affActionBtn:        { padding: 4 },
  mantraCard:          { borderRadius: 20, borderWidth: 1, padding: 20, overflow: 'hidden', gap: 10 },
  mantraEyebrow:       { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  mantraWord:          { fontSize: 22, fontWeight: '700', lineHeight: 30 },
  mantraHint:          { fontSize: 13, lineHeight: 21 },
  mantraTimeBadge:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  practiceCard:        { borderRadius: 20, borderWidth: 1, padding: 18, gap: 12 },
  practiceStep:        { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingTop: 12 },
  practiceNum:         { width: 28, height: 28, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  practiceTitle:       { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  practiceDesc:        { fontSize: 12.5, lineHeight: 19 },
  sharePreviewCard:    { borderRadius: 20, borderWidth: 1, overflow: 'hidden', gap: 0 },
  sharePreviewInner:   { padding: 24, alignItems: 'center', gap: 10 },
  sharePreviewLabel:   { fontSize: 11, fontWeight: '700', letterSpacing: 2.5 },
  sharePreviewText:    { fontSize: 17, fontStyle: 'italic', lineHeight: 28, textAlign: 'center' },
  sharePreviewBar:     { width: 40, height: 1.5, borderRadius: 1 },
  sharePreviewSub:     { fontSize: 11 },
  shareBtn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 14 },
  shareBtnText:        { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  favCard:             { borderRadius: 18, borderWidth: 1, padding: 18, overflow: 'hidden', gap: 8 },
  favHint:             { fontSize: 13, lineHeight: 21 },
  favCount:            { fontSize: 13, fontWeight: '700' },
  infoCard:            { borderRadius: 18, borderWidth: 1, padding: 18, gap: 8 },
  infoText:            { fontSize: 13, lineHeight: 21 },
  // "Dla kogoś" modal
  fsOverlay:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  fsSheet:             { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, gap: 14, overflow: 'hidden' },
  fsHandle:            { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  fsTitle:             { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  fsHint:              { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  fsInput:             { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, fontWeight: '500' },
  fsCta:               { paddingVertical: 15, borderRadius: 16, alignItems: 'center' },
  fsCtaText:           { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
