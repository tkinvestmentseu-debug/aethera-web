// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions, Pressable, ScrollView, StyleSheet, Text,
  TextInput, View, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Defs, RadialGradient, Stop, G } from 'react-native-svg';
import {
  CheckCircle2, Circle as CircleIcon, Sun, Wind, Sparkles, Target,
  Music, Heart, Star, ChevronLeft, ChevronRight, SkipForward,
} from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat,
  withSequence, interpolate, FadeInDown, FadeIn,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { layout } from '../core/theme/designSystem';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';

const { width: SW } = Dimensions.get('window');

// ─── Module-level animated components ───────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Constants ───────────────────────────────────────────────────────────────
const CIRCLE_R = 90;
const CIRCLE_CIRCUM = 2 * Math.PI * CIRCLE_R;
const CX = SW / 2 - 40;
const CY = 120;

const DURATIONS = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '20 min', value: 20 },
  { label: '30 min', value: 30 },
];

const ROUNDS_MAP: Record<number, number> = { 5: 4, 10: 6, 20: 12, 30: 16 };

const STAGES = [
  { id: 'breath',      label: 'Oddech',       desc: 'Przebudzenie ciała',   icon: Wind },
  { id: 'affirmation', label: 'Afirmacja',    desc: 'Nastawienie umysłu',   icon: Sparkles },
  { id: 'intention',   label: 'Intencja dnia',desc: 'Kierunek energii',     icon: Target },
  { id: 'mantra',      label: 'Mantra',       desc: 'Wibracja duszy',       icon: Music },
  { id: 'gratitude',   label: 'Wdzięczność',  desc: 'Otwieranie serca',     icon: Heart },
];

const AFFIRMATIONS = [
  'Jestem pełen/pełna energii i gotowości na nowy tydzień.',
  'Moja kreatywność płynie swobodnie i obficie.',
  'Jestem w doskonałej harmonii z rytmem Wszechświata.',
  'Przyciągam obfitość i błogosławieństwo w każdej formie.',
  'Moje serce jest otwarte na miłość i wdzięczność.',
  'Odpoczywam i regeneruję się z pełną świadomością.',
  'Jestem połączony/a ze swoją duszą i wyższym celem.',
];

const MANTRAS: Record<string, { text: string; meaning: string }> = {
  aries:       { text: 'Ram Ram Ram',           meaning: 'Ogień i odwaga' },
  taurus:      { text: 'Shreem Shreem',          meaning: 'Obfitość' },
  gemini:      { text: 'Aim Aim',                meaning: 'Mądrość' },
  cancer:      { text: 'Chandrama',              meaning: 'Spokój' },
  leo:         { text: 'Hrim Hrim',              meaning: 'Moc i przywództwo' },
  virgo:       { text: 'Aim Hreem',              meaning: 'Uzdrowienie' },
  libra:       { text: 'Shreem Kleem',           meaning: 'Harmonia' },
  scorpio:     { text: 'Om Namah Shivaya',        meaning: 'Transformacja' },
  sagittarius: { text: 'Om Gurave',              meaning: 'Ekspansja' },
  capricorn:   { text: 'Om Shanicharaya',        meaning: 'Dyscyplina' },
  aquarius:    { text: 'Om Vishnave',            meaning: 'Oświecenie' },
  pisces:      { text: 'Om Namo Narayanaya',     meaning: 'Połączenie' },
};

const STAGE_GRADIENTS = [
  ['#0D0B1E', '#1A0A3D'] as const,
  ['#1A0A1E', '#3D0A1A'] as const,
  ['#1A0A1E', '#3D0A1A'] as const,
  ['#1A100A', '#3D2A0A'] as const,
  ['#1A100A', '#3D2A0A'] as const,
  ['#1A1500', '#3D3200', '#F59E0B22'] as const,
];

const STAGE_GRADIENTS_LIGHT = [
  ['#E8E4F4', '#D4C8F0'] as const,
  ['#F4E4EE', '#F0C8DC'] as const,
  ['#F4E4EE', '#F0C8DC'] as const,
  ['#F4EEE0', '#F0DCBC'] as const,
  ['#F4EEE0', '#F0DCBC'] as const,
  ['#FFF8E4', '#FFF0B8'] as const,
];

// ─── Moon phase helper ────────────────────────────────────────────────────────
function getMoonPhase(date: Date): { name: string; icon: string; progress: number } {
  const ref = new Date('2000-01-06T18:14:00Z');
  const diff = (date.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24);
  const cycle = ((diff % 29.53059) + 29.53059) % 29.53059;
  const p = cycle / 29.53059;
  if (p < 0.03 || p > 0.97) return { name: 'Nów', icon: '🌑', progress: p };
  if (p < 0.22) return { name: 'Przybywający sierp', icon: '🌒', progress: p };
  if (p < 0.28) return { name: 'Pierwsza kwadra', icon: '🌓', progress: p };
  if (p < 0.47) return { name: 'Przybywający garb', icon: '🌔', progress: p };
  if (p < 0.53) return { name: 'Pełnia', icon: '🌕', progress: p };
  if (p < 0.72) return { name: 'Ubywający garb', icon: '🌖', progress: p };
  if (p < 0.78) return { name: 'Ostatnia kwadra', icon: '🌗', progress: p };
  return { name: 'Ubywający sierp', icon: '🌘', progress: p };
}

function getTodayAffirmation(): string {
  const dow = new Date().getDay(); // 0=Sun
  const idx = dow === 0 ? 6 : dow - 1;
  return AFFIRMATIONS[idx];
}

export function MorningRitualScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { themeName, userData, meditationSessions, addMeditationSession, gratitudeEntries, addGratitudeEntry, addFavoriteItem, isFavoriteItem, removeFavoriteItem } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');

  const today = new Date().toISOString().slice(0, 10);
  const todayMs = Date.now();
  const moonPhase = getMoonPhase(new Date());
  const affirmation = getTodayAffirmation();
  const zodiac = (userData?.zodiacSign || 'aries').toLowerCase();
  const mantraData = MANTRAS[zodiac] || MANTRAS.aries;
  const userName = userData?.name || '';

  // ── Global state ──────────────────────────────────────────────────────────
  const [stage, setStage] = useState(-1); // -1 = welcome
  const [duration, setDuration] = useState(10);
  const [startTime, setStartTime] = useState<number>(0);
  const [completedStages, setCompletedStages] = useState<number[]>([]);

  // ── Stage 1: Breath ───────────────────────────────────────────────────────
  const [breathPhase, setBreathPhase] = useState<'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2'>('idle');
  const [breathTick, setBreathTick] = useState(0);
  const [breathRound, setBreathRound] = useState(0);
  const [breathRunning, setBreathRunning] = useState(false);
  const breathIntervalRef = useRef<any>(null);
  const breathCircleScale = useSharedValue(0.7);
  const totalRounds = ROUNDS_MAP[duration] || 6;

  // box breathing 4-4-4-4
  const BREATH_SEQ: [string, number][] = [['inhale', 4], ['hold1', 4], ['exhale', 4], ['hold2', 4]];
  const breathPhaseIndex = useRef(0);
  const breathRoundRef = useRef(0);

  const advanceBreath = useCallback(() => {
    const nextPi = (breathPhaseIndex.current + 1) % BREATH_SEQ.length;
    breathPhaseIndex.current = nextPi;
    const [ph] = BREATH_SEQ[nextPi];
    setBreathPhase(ph as any);
    setBreathTick(BREATH_SEQ[nextPi][1]);
    if (nextPi === 0) {
      breathRoundRef.current += 1;
      setBreathRound(r => r + 1);
      if (breathRoundRef.current >= totalRounds) {
        clearInterval(breathIntervalRef.current);
        setBreathRunning(false);
        setTimeout(() => goToNextStage(1), 600);
      }
    }
    if (ph === 'inhale') breathCircleScale.value = withTiming(1.0, { duration: 4000 });
    if (ph === 'hold1') breathCircleScale.value = withTiming(1.0, { duration: 100 });
    if (ph === 'exhale') breathCircleScale.value = withTiming(0.65, { duration: 4000 });
    if (ph === 'hold2') breathCircleScale.value = withTiming(0.65, { duration: 100 });
  }, [totalRounds]);

  const startBreath = useCallback(() => {
    setBreathRunning(true);
    setBreathPhase('inhale');
    setBreathTick(4);
    breathRoundRef.current = 0;
    breathPhaseIndex.current = 0;
    breathCircleScale.value = withTiming(1.0, { duration: 4000 });
    const ticker = setInterval(() => {
      setBreathTick(t => {
        if (t <= 1) { advanceBreath(); return BREATH_SEQ[breathPhaseIndex.current][1]; }
        return t - 1;
      });
    }, 1000);
    breathIntervalRef.current = ticker;
  }, [advanceBreath]);

  const breathCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathCircleScale.value }],
  }));

  // ── Stage 2: Affirmation ──────────────────────────────────────────────────
  const [affTaps, setAffTaps] = useState(0);
  const [affTimer, setAffTimer] = useState(45);
  const affTimerRef = useRef<any>(null);
  const affPulse = useSharedValue(1);

  const affPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: affPulse.value }],
    opacity: interpolate(affPulse.value, [0.95, 1.05], [0.6, 1]),
  }));

  // ── Stage 3: Intention ────────────────────────────────────────────────────
  const [intention1, setIntention1] = useState('');
  const [intention2, setIntention2] = useState('');
  const [intentionAI, setIntentionAI] = useState('');
  const [intentionLoading, setIntentionLoading] = useState(false);

  // ── Stage 4: Mantra ───────────────────────────────────────────────────────
  const [mantraCount, setMantraCount] = useState(0);
  const [mantraTimer, setMantraTimer] = useState(120);
  const [mantraRunning, setMantraRunning] = useState(false);
  const mantraTimerRef = useRef<any>(null);
  const mantraDot = useSharedValue(1);

  const mantraDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mantraDot.value }],
    opacity: interpolate(mantraDot.value, [0.85, 1.15], [0.5, 1]),
  }));

  // ── Stage 5: Gratitude ───────────────────────────────────────────────────
  const existingGratitude = gratitudeEntries.find(e => e.date === today);
  const [grat1, setGrat1] = useState(existingGratitude?.items[0] || '');
  const [grat2, setGrat2] = useState(existingGratitude?.items[1] || '');
  const [grat3, setGrat3] = useState(existingGratitude?.items[2] || '');

  // ── Completion state ──────────────────────────────────────────────────────
  const [totalMinutes, setTotalMinutes] = useState(0);
  const raysScale = useSharedValue(0);
  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ scale: raysScale.value }],
    opacity: interpolate(raysScale.value, [0, 1], [0.3, 1]),
  }));

  // confetti (12 fixed shared values — must not use hooks in array map)
  const cd0 = useSharedValue(0); const cd1 = useSharedValue(0); const cd2 = useSharedValue(0);
  const cd3 = useSharedValue(0); const cd4 = useSharedValue(0); const cd5 = useSharedValue(0);
  const cd6 = useSharedValue(0); const cd7 = useSharedValue(0); const cd8 = useSharedValue(0);
  const cd9 = useSharedValue(0); const cd10 = useSharedValue(0); const cd11 = useSharedValue(0);
  const confettiDots = [cd0, cd1, cd2, cd3, cd4, cd5, cd6, cd7, cd8, cd9, cd10, cd11];

  // ─── Streak count (meditation sessions) ──────────────────────────────────
  const streak = meditationSessions.filter(s => s.technique === 'Poranny Rytuał').length;

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const goToNextStage = useCallback((from: number) => {
    setCompletedStages(prev => [...prev, from]);
    void HapticsService.notify();
    setStage(from + 1);
  }, []);

  const skipStage = useCallback(() => {
    const cur = stage;
    clearInterval(breathIntervalRef.current);
    clearInterval(affTimerRef.current);
    clearInterval(mantraTimerRef.current);
    goToNextStage(cur);
  }, [stage, goToNextStage]);

  // ── Lifecycle: stage entry effects ───────────────────────────────────────
  useEffect(() => {
    if (stage === 0) { setStartTime(Date.now()); }

    if (stage === 1) {
      // breath starts
    }
    if (stage === 2) {
      // affirmation pulse
      affPulse.value = withRepeat(withSequence(withTiming(1.05, { duration: 1800 }), withTiming(0.95, { duration: 1800 })), -1, true);
      affTimerRef.current = setInterval(() => {
        setAffTimer(t => {
          if (t <= 1) {
            clearInterval(affTimerRef.current);
            goToNextStage(2);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    if (stage === 3) {
      // intention
    }
    if (stage === 4) {
      // mantra metronome 72bpm ≈ 833ms
      mantraDot.value = withRepeat(withSequence(withTiming(1.15, { duration: 416 }), withTiming(0.85, { duration: 416 })), -1, true);
      setMantraRunning(true);
      mantraTimerRef.current = setInterval(() => {
        setMantraTimer(t => {
          if (t <= 1) {
            clearInterval(mantraTimerRef.current);
            goToNextStage(4);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    if (stage === 5) {
      clearInterval(mantraTimerRef.current);
    }
    if (stage === 6) {
      const elapsed = Math.round((Date.now() - startTime) / 60000);
      setTotalMinutes(elapsed || duration);
      addMeditationSession({ duration: elapsed || duration, technique: 'Poranny Rytuał', date: today });
      raysScale.value = withRepeat(withSequence(withTiming(1.0, { duration: 1200 }), withTiming(0.88, { duration: 1200 })), -1, true);
      confettiDots.forEach((dot, i) => {
        dot.value = withRepeat(withSequence(withTiming(1, { duration: 900 + i * 120 }), withTiming(0, { duration: 300 })), -1, false);
      });
    }
    return () => {
      clearInterval(breathIntervalRef.current);
      clearInterval(affTimerRef.current);
      clearInterval(mantraTimerRef.current);
    };
  }, [stage]);

  // ── AI intention helper ───────────────────────────────────────────────────
  const boostIntention = useCallback(async () => {
    if (!intention1) return;
    setIntentionLoading(true);
    try {
      const msgs = [
        { role: 'system', content: 'Jesteś mistrzem intencji i manifestacji. Odpowiadasz krótko i inspirująco w języku użytkownika.' },
        { role: 'user', content: `Moja intencja na dziś: "${intention1}". Chcę stworzyć: "${intention2}". Wzmocnij moją intencję jednym mocnym zdaniem (max 30 słów) i zaproponuj konkretny krok działania (max 20 słów).` },
      ];
      const res = await AiService.chatWithOracle(msgs);
      setIntentionAI(res.trim());
    } catch {
      setIntentionAI('Twoja intencja ma moc. Idź w kierunku, który czujesz sercem.');
    } finally {
      setIntentionLoading(false);
    }
  }, [intention1, intention2]);

  // ── Gratitude save ────────────────────────────────────────────────────────
  const finishRitual = useCallback(() => {
    const items = [grat1, grat2, grat3].filter(Boolean);
    if (items.length > 0) {
      if (existingGratitude) {
        // already exists, skip
      } else {
        addGratitudeEntry({ id: `grat-${Date.now()}`, date: today, items });
      }
    }
    goToNextStage(5);
  }, [grat1, grat2, grat3, existingGratitude]);

  // ── Background gradient ───────────────────────────────────────────────────
  const gradientIdx = stage < 0 ? 0 : Math.min(stage, STAGE_GRADIENTS.length - 1);
  const colors = isLight ? STAGE_GRADIENTS_LIGHT[gradientIdx] : STAGE_GRADIENTS[gradientIdx];

  const textColor = isLight ? '#1A1410' : '#F0EAF8';
  const subColor = isLight ? '#6A5A48' : '#A898C8';
  const goldColor = '#F59E0B';
  const cardBg = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)';

  // ── Progress bar ──────────────────────────────────────────────────────────
  const renderProgressBar = () => {
    if (stage < 0) return null;
    return (
      <View style={s.progressBar}>
        {STAGES.map((_, i) => (
          <View key={i} style={[s.progressSeg, {
            backgroundColor: i < stage ? goldColor : i === stage ? goldColor + 'BB' : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)'),
          }]} />
        ))}
      </View>
    );
  };

  // ── Welcome screen (stage -1) ─────────────────────────────────────────────
  if (stage < 0) return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <LinearGradient colors={colors} style={StyleSheet.absoluteFill} />

      {/* Ambient glow rings */}
      <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-start', paddingTop: 80 }]} pointerEvents="none">
        <Svg width={SW} height={320} style={{ position: 'absolute', top: 40 }}>
          <Defs>
            <RadialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={goldColor} stopOpacity={isLight ? "0.18" : "0.30"} />
              <Stop offset="100%" stopColor={goldColor} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={SW / 2} cy={140} r={160} fill="url(#sunGlow)" />
          {[60, 90, 120].map((r, i) => (
            <Circle key={i} cx={SW / 2} cy={140} r={r} stroke={goldColor}
              strokeWidth={0.7} fill="none" opacity={isLight ? 0.10 - i * 0.02 : 0.18 - i * 0.04} />
          ))}
        </Svg>
      </Animated.View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={s.backBtn}>
            <ChevronLeft size={22} color={textColor} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: textColor }]}>Poranny Rytuał</Text>
          </View>
          <MusicToggleButton color={goldColor} size={20} />
          <Pressable
            onPress={() => {
              HapticsService.notify();
              if (isFavoriteItem('morning-ritual')) {
                removeFavoriteItem('morning-ritual');
              } else {
                addFavoriteItem({ id: 'morning-ritual', label: 'Poranny Rytuał', route: 'MorningRitual', params: {}, icon: 'Sun', color: '#F9A854', addedAt: new Date().toISOString() });
              }
            }}
            style={s.starBtn}
          >
            <Star size={20} color={goldColor} fill={isFavoriteItem('morning-ritual') ? goldColor : 'none'} />
          </Pressable>
        </View>

        {/* Hero greeting */}
        <Animated.View entering={FadeInDown.delay(60).duration(600)} style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Text style={{ fontSize: 52, marginBottom: 8 }}>
            {new Date().getHours() < 12 ? '☀️' : '🌤️'}
          </Text>
          <Text style={{ color: goldColor, fontSize: 24, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' }}>
            {new Date().getHours() < 12 ? 'Dobry Poranek' : 'Dzień dobry'}
            {userName ? `,\n${userName}` : ''}
          </Text>
          <Text style={{ color: subColor, fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 21 }}>
            Każdy poranek to nowy rozdział Twojej duszy.
          </Text>
          <View style={[s.moonBadge, { borderColor: goldColor + '44', backgroundColor: goldColor + '14', marginTop: 12 }]}>
            <Text style={[s.moonBadgeText, { color: goldColor }]}>{moonPhase.icon} {moonPhase.name}</Text>
          </View>
        </Animated.View>

        {/* Stats strip */}
        <Animated.View entering={FadeInDown.delay(120).duration(500)}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'SERIA', value: `${streak}d`, color: '#F59E0B' },
              { label: 'ETAPY', value: '5', color: '#34D399' },
              { label: 'MINUTY', value: `${duration}`, color: '#60A5FA' },
            ].map(stat => (
              <View key={stat.label} style={{ flex: 1, borderRadius: 14, borderWidth: 1, borderColor: stat.color + '30', backgroundColor: stat.color + '0C', paddingVertical: 12, alignItems: 'center', gap: 2 }}>
                <Text style={{ color: stat.color, fontSize: 20, fontWeight: '800' }}>{stat.value}</Text>
                <Text style={{ color: subColor, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Duration selector */}
        <Animated.View entering={FadeInDown.delay(180).duration(500)} style={[s.card, { borderColor: cardBorder, backgroundColor: cardBg }]}>
          <Text style={[s.cardLabel, { color: subColor }]}>CZAS TRWANIA</Text>
          <View style={s.durationRow}>
            {DURATIONS.map(d => (
              <Pressable key={d.value} onPress={() => setDuration(d.value)} style={[s.durationChip, {
                borderColor: duration === d.value ? goldColor : cardBorder,
                backgroundColor: duration === d.value ? goldColor + '22' : 'transparent',
              }]}>
                <Text style={[s.durationChipText, { color: duration === d.value ? goldColor : subColor }]}>{d.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Stage list */}
        <Animated.View entering={FadeInDown.delay(240).duration(500)} style={[s.card, { borderColor: cardBorder, backgroundColor: cardBg }]}>
          <Text style={[s.cardLabel, { color: subColor }]}>ETAPY PRAKTYKI</Text>
          {STAGES.map((st, i) => {
            const Icon = st.icon;
            const done = completedStages.includes(i);
            return (
              <View key={st.id} style={[s.stageRow, { opacity: done ? 0.5 : 1 }]}>
                <View style={[s.stageIconWrap, { backgroundColor: done ? '#34D39920' : goldColor + '20', borderColor: done ? '#34D39940' : goldColor + '40' }]}>
                  {done
                    ? <CheckCircle2 size={16} color="#34D399" />
                    : <Icon size={16} color={goldColor} />
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.stageName, { color: textColor }]}>{st.label}</Text>
                  <Text style={[s.stageDesc, { color: subColor }]}>{st.desc}</Text>
                </View>
                {done
                  ? <Text style={{ color: '#34D399', fontSize: 10, fontWeight: '700' }}>✓</Text>
                  : <CircleIcon size={18} color={subColor} opacity={0.4} />
                }
              </View>
            );
          })}
        </Animated.View>

        {/* Start button */}
        <Animated.View entering={FadeInDown.delay(320).duration(500)} style={{ marginTop: 8 }}>
          <Pressable onPress={() => { void HapticsService.selection(); setStage(0); }} style={s.startBtn}>
            <LinearGradient colors={['#F59E0B', '#D97706', '#B45309']} style={s.startBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Sun size={20} color="#1A0A00" />
              <Text style={s.startBtnText}>Rozpocznij Rytuał ✦</Text>
            </LinearGradient>
          </Pressable>
          <Text style={{ color: subColor, fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 17 }}>
            5 etapów · oddech, afirmacja, intencja, mantra, wdzięczność
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );

  // ── Completion screen (stage 6) ───────────────────────────────────────────
  if (stage >= 6) return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <LinearGradient colors={isLight ? STAGE_GRADIENTS_LIGHT[5] : STAGE_GRADIENTS[5]} style={StyleSheet.absoluteFill} />
      {/* Rays */}
      <Animated.View style={[StyleSheet.absoluteFill, raysStyle]} pointerEvents="none">
        <Svg width={SW} height={SW} style={{ position: 'absolute', top: 60, left: 0 }}>
          {Array.from({ length: 16 }, (_, i) => {
            const angle = (i * 22.5) * Math.PI / 180;
            return <Line key={i} x1={SW / 2} y1={140} x2={SW / 2 + Math.cos(angle) * 180} y2={140 + Math.sin(angle) * 180} stroke={goldColor} strokeWidth={1.5} opacity={0.4} />;
          })}
        </Svg>
      </Animated.View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: layout.padding.screen }}>
        <Text style={[s.completionTitle, { color: goldColor }]}>✨ Rytuał Ukończony!</Text>
        <View style={[s.completionCard, { borderColor: goldColor + '44', backgroundColor: cardBg }]}>
          <Text style={[s.completionStat, { color: textColor }]}>⏱ Czas: {totalMinutes} min</Text>
          <Text style={[s.completionStat, { color: textColor }]}>✅ Etapy: 5/5</Text>
          <Text style={[s.completionStat, { color: textColor }]}>🔥 Seria: {streak + 1} dni</Text>
        <Text style={[s.completionStat, { color: goldColor, marginTop: 6, fontSize: 13, fontWeight: '600', fontStyle: 'italic' }]}>
          Twoja praktyka zostawia ślad w kosmicznej księdze.
        </Text>
        </View>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={[s.startBtn, { marginTop: 32 }]}>
          <LinearGradient colors={['#F59E0B', '#D97706']} style={s.startBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={s.startBtnText}>Wróć do Portalu</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  // ── Active stages 0-5 ─────────────────────────────────────────────────────
  const PHASE_LABELS: Record<string, string> = { idle: 'Przygotowanie', inhale: 'WDECH', hold1: 'TRZYMAJ', exhale: 'WYDECH', hold2: 'TRZYMAJ' };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <LinearGradient colors={colors} style={StyleSheet.absoluteFill} />
      {/* Header */}
      <View style={[s.header, { paddingHorizontal: layout.padding.screen }]}>
        <Pressable onPress={() => { clearInterval(breathIntervalRef.current); clearInterval(affTimerRef.current); clearInterval(mantraTimerRef.current); setStage(-1); }} style={s.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <Text style={[s.headerTitle, { color: textColor, flex: 1 }]}>
          {STAGES[stage]?.label || 'Poranny Rytuał'}
        </Text>
        <Pressable onPress={skipStage} style={s.skipBtn}>
          <SkipForward size={18} color={subColor} />
        </Pressable>
      </View>
      {renderProgressBar()}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">

          {/* STAGE 0: transition */}
          {stage === 0 && (
            <Animated.View entering={FadeIn.duration(600)} style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={[s.stageBigLabel, { color: goldColor }]}>Rytuał Poranny</Text>
              <Text style={[s.stageSub, { color: subColor }]}>Zacznij od oddechu. Wejdź w rytm ciała.</Text>
              <Pressable onPress={() => setStage(1)} style={[s.startBtn, { marginTop: 40, alignSelf: 'center' }]}>
                <LinearGradient colors={['#F59E0B', '#D97706']} style={s.startBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Wind size={18} color="#1A0A00" />
                  <Text style={s.startBtnText}>Zacznij oddech</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* STAGE 1: Breath */}
          {stage === 1 && (
            <Animated.View entering={FadeIn.duration(500)} style={{ alignItems: 'center', paddingTop: 20 }}>
              <Text style={[s.eyebrow, { color: subColor }]}>ODDECH PUDEŁKOWY 4-4-4-4</Text>
              <Text style={[s.roundLabel, { color: subColor }]}>Runda {Math.min(breathRound + 1, totalRounds)} z {totalRounds}</Text>
              {/* Breathing circle */}
              <View style={{ width: SW - 80, height: 260, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={SW - 80} height={260}>
                  <Circle cx={(SW - 80) / 2} cy={130} r={CIRCLE_R} stroke={goldColor + '22'} strokeWidth={2} fill="none" />
                  <Circle cx={(SW - 80) / 2} cy={130} r={CIRCLE_R - 12} stroke={goldColor + '44'} strokeWidth={1} fill="none" strokeDasharray="6 10" />
                </Svg>
                <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, breathCircleStyle]}>
                  <View style={[s.breathCircleInner, { borderColor: goldColor + '66' }]} />
                </Animated.View>
                <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={[s.breathPhaseLabel, { color: goldColor }]}>{PHASE_LABELS[breathPhase]}</Text>
                  {breathPhase !== 'idle' && <Text style={[s.breathTick, { color: textColor }]}>{breathTick}</Text>}
                </View>
              </View>
              {!breathRunning ? (
                <Pressable onPress={startBreath} style={[s.startBtn, { alignSelf: 'center' }]}>
                  <LinearGradient colors={['#F59E0B', '#D97706']} style={s.startBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={s.startBtnText}>Zacznij oddech</Text>
                  </LinearGradient>
                </Pressable>
              ) : (
                <Text style={[s.breathHint, { color: subColor }]}>Oddychaj spokojnie...</Text>
              )}
            </Animated.View>
          )}

          {/* STAGE 2: Affirmation */}
          {stage === 2 && (
            <Animated.View entering={FadeIn.duration(500)} style={{ alignItems: 'center', paddingTop: 24 }}>
              <Text style={[s.eyebrow, { color: subColor }]}>AFIRMACJA DNIA</Text>
              <Animated.View style={[s.affGlow, affPulseStyle, { backgroundColor: goldColor + '18', borderColor: goldColor + '30' }]}>
                <Text style={[s.affText, { color: goldColor }]}>{affirmation}</Text>
              </Animated.View>
              <Text style={[s.affInstruction, { color: subColor }]}>Powtórz na głos 3 razy</Text>
              <Text style={[s.affTimer, { color: subColor }]}>Auto: {affTimer}s</Text>
              <Pressable onPress={() => {
                const next = affTaps + 1;
                setAffTaps(next);
                void HapticsService.selection();
                if (next >= 3) {
                  clearInterval(affTimerRef.current);
                  goToNextStage(2);
                }
              }} style={[s.affBtn, { borderColor: goldColor + '55', backgroundColor: goldColor + '14' }]}>
                <Text style={[s.affBtnText, { color: goldColor }]}>Powtórzyłem/am ({affTaps}/3)</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* STAGE 3: Intention */}
          {stage === 3 && (
            <Animated.View entering={FadeIn.duration(500)} style={{ paddingTop: 16 }}>
              <Text style={[s.eyebrow, { color: subColor, textAlign: 'center' }]}>INTENCJA DNIA</Text>
              <Text style={[s.stageDesc, { color: subColor, textAlign: 'center', marginBottom: 20 }]}>Nadaj kierunek swojej energii na dziś</Text>
              <Text style={[s.inputLabel, { color: subColor }]}>Jaka jest moja intencja na dziś?</Text>
              <TextInput
                style={[s.textInput, { color: textColor, borderColor: cardBorder, backgroundColor: cardBg }]}
                value={intention1}
                onChangeText={setIntention1}
                placeholder="Moja intencja..."
                placeholderTextColor={subColor + '88'}
                multiline
              />
              <Text style={[s.inputLabel, { color: subColor, marginTop: 12 }]}>Co chcę stworzyć lub doświadczyć?</Text>
              <TextInput
                style={[s.textInput, { color: textColor, borderColor: cardBorder, backgroundColor: cardBg }]}
                value={intention2}
                onChangeText={setIntention2}
                placeholder="Chcę doświadczyć..."
                placeholderTextColor={subColor + '88'}
                multiline
              />
              <Pressable onPress={boostIntention} disabled={intentionLoading || !intention1} style={[s.aiBtn, { borderColor: goldColor + '55', backgroundColor: goldColor + '14', opacity: !intention1 ? 0.4 : 1 }]}>
                <Sparkles size={16} color={goldColor} />
                <Text style={[s.aiBtnText, { color: goldColor }]}>{intentionLoading ? 'Generuję...' : 'AI Wzmocnienie'}</Text>
              </Pressable>
              {!!intentionAI && (
                <Animated.View entering={FadeIn.duration(400)} style={[s.aiResult, { borderColor: goldColor + '44', backgroundColor: goldColor + '0D' }]}>
                  <Text style={[s.aiResultText, { color: textColor }]}>{intentionAI}</Text>
                </Animated.View>
              )}
              <Pressable onPress={() => goToNextStage(3)} style={[s.startBtn, { alignSelf: 'center', marginTop: 20 }]}>
                <LinearGradient colors={['#F59E0B', '#D97706']} style={s.startBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.startBtnText}>Zatwierdź intencję</Text>
                  <ChevronRight size={18} color="#1A0A00" />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* STAGE 4: Mantra */}
          {stage === 4 && (
            <Animated.View entering={FadeIn.duration(500)} style={{ alignItems: 'center', paddingTop: 24 }}>
              <Text style={[s.eyebrow, { color: subColor }]}>MANTRA ZODIAKU</Text>
              <Text style={[s.mantraText, { color: goldColor }]}>{mantraData.text}</Text>
              <Text style={[s.mantraMeaning, { color: subColor }]}>{mantraData.meaning}</Text>
              <Text style={[s.affInstruction, { color: subColor }]}>Recytuj z nami</Text>
              {/* Metronome dot */}
              <Animated.View style={[s.mantraDot, { backgroundColor: goldColor }, mantraDotStyle]} />
              <Text style={[s.mantraCount, { color: textColor }]}>{mantraCount} / 108</Text>
              <Text style={[s.affTimer, { color: subColor }]}>Auto: {mantraTimer}s</Text>
              <Pressable onPress={() => {
                const next = mantraCount + 1;
                setMantraCount(next);
                void HapticsService.selection();
                if (next >= 108) goToNextStage(4);
              }} style={[s.affBtn, { borderColor: goldColor + '55', backgroundColor: goldColor + '14' }]}>
                <Text style={[s.affBtnText, { color: goldColor }]}>Recytowałem/am (+1)</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* STAGE 5: Gratitude */}
          {stage === 5 && (
            <Animated.View entering={FadeIn.duration(500)} style={{ paddingTop: 16 }}>
              <Text style={[s.eyebrow, { color: subColor, textAlign: 'center' }]}>WDZIĘCZNOŚĆ</Text>
              <Text style={[s.stageDesc, { color: subColor, textAlign: 'center', marginBottom: 20 }]}>Otwórz serce na trzy dary dnia</Text>
              {[{ val: grat1, set: setGrat1 }, { val: grat2, set: setGrat2 }, { val: grat3, set: setGrat3 }].map((g, i) => (
                <View key={i}>
                  <Text style={[s.inputLabel, { color: subColor }]}>Jestem wdzięczny/a za... ({i + 1})</Text>
                  <TextInput
                    style={[s.textInput, { color: textColor, borderColor: cardBorder, backgroundColor: cardBg }]}
                    value={g.val}
                    onChangeText={g.set}
                    placeholder="Za co jesteś wdzięczny/a?"
                    placeholderTextColor={subColor + '88'}
                    maxLength={80}
                  />
                  <Text style={[s.charCount, { color: subColor }]}>{g.val.length}/80</Text>
                </View>
              ))}
              <Pressable onPress={finishRitual} style={[s.startBtn, { alignSelf: 'center', marginTop: 24 }]}>
                <LinearGradient colors={['#F59E0B', '#D97706']} style={s.startBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Heart size={18} color="#1A0A00" />
                  <Text style={s.startBtnText}>Zakończ Rytuał</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          <EndOfContentSpacer />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  skipBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  starBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', letterSpacing: 0.5 },
  progressBar: { flexDirection: 'row', gap: 4, paddingHorizontal: layout.padding.screen, marginBottom: 4 },
  progressSeg: { flex: 1, height: 3, borderRadius: 2 },
  timeGreeting: { fontSize: 22, fontWeight: '700', marginBottom: 8, letterSpacing: 0.3 },
  moonBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 20 },
  moonBadgeText: { fontSize: 13, fontWeight: '600' },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 },
  cardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 12 },
  durationRow: { flexDirection: 'row', gap: 8 },
  durationChip: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  durationChipText: { fontSize: 13, fontWeight: '600' },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(128,128,128,0.10)' },
  stageIconWrap: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stageName: { fontSize: 14, fontWeight: '600' },
  stageDesc: { fontSize: 12, marginTop: 2 },
  startBtn: { borderRadius: 14, overflow: 'hidden', width: SW - layout.padding.screen * 2 },
  startBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#1A0A00' },
  stageBigLabel: { fontSize: 28, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  stageSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5, marginBottom: 8 },
  roundLabel: { fontSize: 14, marginBottom: 16 },
  breathCircleInner: { width: 160, height: 160, borderRadius: 80, borderWidth: 2 },
  breathPhaseLabel: { fontSize: 18, fontWeight: '700', letterSpacing: 3 },
  breathTick: { fontSize: 36, fontWeight: '200', marginTop: 4 },
  breathHint: { fontSize: 14, marginTop: 12 },
  affGlow: { borderWidth: 1, borderRadius: 20, padding: 24, marginVertical: 20, alignItems: 'center', width: SW - layout.padding.screen * 2 },
  affText: { fontSize: 20, fontWeight: '600', textAlign: 'center', lineHeight: 30 },
  affInstruction: { fontSize: 13, marginBottom: 8 },
  affTimer: { fontSize: 12, marginBottom: 16, opacity: 0.6 },
  affBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  affBtnText: { fontSize: 15, fontWeight: '600' },
  inputLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 6 },
  textInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 72, textAlignVertical: 'top' },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignSelf: 'flex-start', marginTop: 12 },
  aiBtnText: { fontSize: 14, fontWeight: '600' },
  aiResult: { borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 12 },
  aiResultText: { fontSize: 14, lineHeight: 22 },
  mantraText: { fontSize: 28, fontWeight: '700', letterSpacing: 3, marginVertical: 16, textAlign: 'center' },
  mantraMeaning: { fontSize: 13, letterSpacing: 1, marginBottom: 16 },
  mantraDot: { width: 16, height: 16, borderRadius: 8, marginVertical: 16 },
  mantraCount: { fontSize: 22, fontWeight: '200', marginBottom: 4 },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 2, marginBottom: 10 },
  completionTitle: { fontSize: 28, fontWeight: '700', letterSpacing: 1, marginBottom: 24 },
  completionCard: { borderWidth: 1, borderRadius: 16, padding: 24, gap: 12, width: SW - layout.padding.screen * 2 },
  completionStat: { fontSize: 17, fontWeight: '500' },
});
