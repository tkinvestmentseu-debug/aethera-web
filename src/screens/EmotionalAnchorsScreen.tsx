// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Pressable, ScrollView, StyleSheet, View,
  Dimensions, Text, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Line, Polygon } from 'react-native-svg';
import Animated, {
  FadeInDown, FadeIn, FadeOut,
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withSequence, withTiming, withSpring,
  Easing, cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, Star, Anchor, Plus, X, CheckCircle2, Play, Square, Edit3, Trash2 } from 'lucide-react-native';
import { layout } from '../core/theme/designSystem';
import { useTheme } from '../core/hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#0EA5E9';
const ACCENT_GLOW = '#38BDF8';

// ─── Module-level animated components ───────────────────────────────────────
const AnimCircle = Animated.createAnimatedComponent(Circle);

// ─── Category filter options ─────────────────────────────────────────────────
const CATEGORIES = ['Wszystkie', 'Bezpieczeństwo', 'Miłość', 'Siła', 'Natura', 'Oddech', 'Przeszłość'];

// ─── Preset emoji options for create tab ─────────────────────────────────────
const PRESET_EMOJIS = ['🌟', '💫', '🌿', '💎', '🔥', '🌊'];

const PRESET_ANCHORS = [
  { id: 'a1', category: 'Bezpieczeństwo', icon: '🏠', text: 'Mój dom jest moim schronieniem. Jestem w nim bezpieczny/a.' },
  { id: 'a2', category: 'Miłość',         icon: '💛', text: 'Kocham i jestem kochany/a. Miłość jest zawsze dostępna.' },
  { id: 'a3', category: 'Siła',           icon: '⚡', text: 'Przetrwałem/am już gorsze rzeczy. Mam w sobie siłę.' },
  { id: 'a4', category: 'Natura',         icon: '🌿', text: 'Ziemia pode mną jest zawsze. Jestem zakorzeniony/a.' },
  { id: 'a5', category: 'Oddech',         icon: '💨', text: 'Póki oddycham, żyję. Jeden oddech naraz.' },
  { id: 'a6', category: 'Przeszłość',     icon: '⭐', text: 'Miałem/am momenty radości i siły. Mogę je znów mieć.' },
];

const NLP_STEPS = [
  { label: 'Przypomnij sobie silny pozytywny stan (spokój, radość, pewność siebie)', timed: false },
  { label: 'Wejdź w ten stan — poczuj go w ciele jak najbardziej intensywnie',       timed: false },
  { label: 'Gdy stan jest najsilniejszy — naciśnij mocno kciukiem na knykieć palca wskazującego', timed: false },
  { label: 'Przytrzymaj kotwicę — odliczamy razem z tobą',                           timed: true  },
  { label: 'Powtórz 3-5 razy wzmacniając kotwicę',                                   timed: false },
  { label: 'Test: naciśnij kotwicę — poczuj jak stan wraca natychmiast',             timed: false },
];

// ─── Background component ────────────────────────────────────────────────────
const AnchorBg = ({ isDark }: { isDark: boolean }) => {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = e.translationX / SW * 10;
      tiltY.value = e.translationY / 300 * 10;
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 800 });
      tiltY.value = withTiming(0, { duration: 800 });
    });
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${-tiltY.value}deg` },
      { rotateY: `${tiltX.value}deg` },
    ],
  }));
  const glow = useSharedValue(0.5);
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1,   { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 3000 }),
      ),
      -1,
    );
    return () => { cancelAnimation(glow); };
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={isDark ? ['#040A12', '#060E1A', '#081220'] : ['#E0F2FE', '#EBF8FF', '#F0FBFF']}
        style={StyleSheet.absoluteFill}
      />
      <GestureDetector gesture={pan}>
        <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
          <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
            <Svg width={SW} height={440} style={{ position: 'absolute', top: 20 }}>
              <Defs>
                <RadialGradient id="anchorGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={ACCENT} stopOpacity={isDark ? '0.22' : '0.10'} />
                  <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx={SW / 2} cy={190} r={130} fill="url(#anchorGlow)" />
              {[40, 70, 105].map((r, i) => (
                <Circle key={i} cx={SW / 2} cy={190} r={r} stroke={ACCENT} strokeWidth={0.6} fill="none"
                  opacity={isDark ? 0.18 - i * 0.04 : 0.08 - i * 0.02} />
              ))}
              <Circle cx={SW / 2} cy={168} r={10} stroke={ACCENT} strokeWidth={1.8} fill="none" opacity={isDark ? 0.35 : 0.2} />
              <Line x1={SW / 2} y1={178} x2={SW / 2} y2={220} stroke={ACCENT} strokeWidth={1.8} opacity={isDark ? 0.35 : 0.2} />
              <Line x1={SW / 2 - 20} y1={200} x2={SW / 2 + 20} y2={200} stroke={ACCENT} strokeWidth={1.5} opacity={isDark ? 0.3 : 0.15} />
              <Path d={`M${SW / 2 - 20},200 Q${SW / 2 - 28},216 ${SW / 2 - 16},220`} stroke={ACCENT} strokeWidth={1.5} fill="none" opacity={isDark ? 0.3 : 0.15} />
              <Path d={`M${SW / 2 + 20},200 Q${SW / 2 + 28},216 ${SW / 2 + 16},220`} stroke={ACCENT} strokeWidth={1.5} fill="none" opacity={isDark ? 0.3 : 0.15} />
              {Array.from({ length: 16 }, (_, i) => (
                <Circle key={'p' + i}
                  cx={(i * 141 + 30) % SW} cy={(i * 93 + 40) % 420}
                  r={i % 4 === 0 ? 1.2 : 0.6} fill={ACCENT}
                  opacity={isDark ? 0.12 : 0.05}
                />
              ))}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ─── Animated hero anchor icon ───────────────────────────────────────────────
const HeroAnchor = ({ isDark, activeCount, myCount, nlpCount }: {
  isDark: boolean; activeCount: number; myCount: number; nlpCount: number;
}) => {
  const pulse = useSharedValue(1);
  const glowOp = useSharedValue(0.4);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.10, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.00, { duration: 1800 }),
      ), -1,
    );
    glowOp.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.40, { duration: 1800 }),
      ), -1,
    );
    return () => { cancelAnimation(pulse); cancelAnimation(glowOp); };
  }, []);

  const outerStyle = useAnimatedStyle(() => ({ opacity: glowOp.value }));
  const innerStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const textColor = isDark ? '#E0F9FF' : '#021422';
  const subColor  = isDark ? 'rgba(224,249,255,0.5)' : 'rgba(2,20,34,0.5)';

  return (
    <View style={styles.heroContainer}>
      {/* Outer glow ring — no transform here */}
      <Animated.View style={[styles.heroGlow, outerStyle]} />
      {/* Inner icon — scale only */}
      <Animated.View style={[styles.heroIconWrap, innerStyle]}>
        <LinearGradient
          colors={[ACCENT + 'CC', ACCENT_GLOW + '99']}
          style={styles.heroIconGrad}
        >
          <Anchor size={32} color="#fff" strokeWidth={2} />
        </LinearGradient>
      </Animated.View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Aktywne', value: activeCount, color: ACCENT },
          { label: 'Moje',    value: myCount,     color: '#A78BFA' },
          { label: 'Sesji NLP', value: nlpCount,  color: '#34D399' },
        ].map((s, i) => (
          <View key={i} style={styles.statItem}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: subColor }]}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Wave-pulse animation on anchor card ─────────────────────────────────────
const AnchorWave = ({ active }: { active: boolean }) => {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      scale.value = 0.6;
      opacity.value = 0.7;
      scale.value = withRepeat(
        withSequence(
          withTiming(1.7, { duration: 900, easing: Easing.out(Easing.quad) }),
          withTiming(0.6, { duration: 0 }),
        ), -1,
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 900, easing: Easing.out(Easing.quad) }),
          withTiming(0.7, { duration: 0 }),
        ), -1,
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = withTiming(0.6, { duration: 200 });
      opacity.value = withTiming(0,   { duration: 200 });
    }
  }, [active]);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  if (!active) return null;
  return <Animated.View style={[styles.waveRing, waveStyle]} />;
};

// ─── Countdown ring for NLP timer ────────────────────────────────────────────
const CountdownRing = ({ seconds, total }: { seconds: number; total: number }) => {
  const R = 34;
  const CIRC = 2 * Math.PI * R;
  const progress = seconds / total;
  const strokeDash = CIRC * progress;

  return (
    <View style={styles.countdownWrap}>
      <Svg width={84} height={84}>
        <Circle cx={42} cy={42} r={R} stroke="rgba(14,165,233,0.15)" strokeWidth={5} fill="none" />
        <Circle cx={42} cy={42} r={R}
          stroke={seconds <= 3 ? '#F87171' : ACCENT}
          strokeWidth={5} fill="none"
          strokeDasharray={`${strokeDash} ${CIRC}`}
          strokeLinecap="round"
          transform="rotate(-90 42 42)"
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.countdownNum, { color: seconds <= 3 ? '#F87171' : ACCENT }]}>
            {seconds}
          </Text>
          <Text style={{ color: 'rgba(14,165,233,0.7)', fontSize: 9, marginTop: 1 }}>{t('emotionalAnchors.sek', 'sek')}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Pulsing "hold" circle ────────────────────────────────────────────────────
const HoldCircle = ({ active }: { active: boolean }) => {
  const sc = useSharedValue(1);
  const op = useSharedValue(1);
  useEffect(() => {
    if (active) {
      sc.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 700, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.00, { duration: 700 }),
        ), -1,
      );
      op.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 700 }),
          withTiming(1.0, { duration: 700 }),
        ), -1,
      );
    } else {
      cancelAnimation(sc);
      cancelAnimation(op);
      sc.value = withTiming(1, { duration: 200 });
      op.value = withTiming(1, { duration: 200 });
    }
  }, [active]);

  const outerOpStyle = useAnimatedStyle(() => ({ opacity: op.value }));
  const innerScStyle = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));

  if (!active) return null;
  return (
    <View style={styles.holdCircleWrap}>
      {/* outer opacity layer — no transform */}
      <Animated.View style={[styles.holdCircleOuter, outerOpStyle]}>
        {/* inner scale layer */}
        <Animated.View style={[styles.holdCircleInner, innerScStyle]}>
          <Text style={{ fontSize: 28 }}>⚓</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export const EmotionalAnchorsScreen = ({ navigation }: any) => {
  const { currentTheme, isLight } = useTheme();
  const isDark = !isLight;

  const addFavoriteItem    = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem     = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const emotionalAnchors   = useAppStore(s => s.emotionalAnchors);
  const addEmotionalAnchor    = useAppStore(s => s.addEmotionalAnchor);
  const removeEmotionalAnchor = useAppStore(s => s.removeEmotionalAnchor);

  const { t } = useTranslation();

  const textColor = isLight ? '#021422' : '#E0F9FF';
  const subColor  = isLight ? 'rgba(2,20,34,0.5)' : 'rgba(224,249,255,0.5)';
  const cardBg    = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<'anchors' | 'nlp' | 'create'>('anchors');

  // ── Anchors tab state ──
  const [activeAnchors,  setActiveAnchors]  = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('Wszystkie');

  // ── NLP tab state ──
  const [nlpSessionActive,  setNlpSessionActive]  = useState(false);
  const [nlpCurrentStep,    setNlpCurrentStep]    = useState(0);
  const [doneNLP,           setDoneNLP]           = useState<number[]>([]);
  const [nlpTimerActive,    setNlpTimerActive]    = useState(false);
  const [nlpTimerSeconds,   setNlpTimerSeconds]   = useState(12);
  const [nlpSessions,       setNlpSessions]       = useState(0);
  const nlpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Create tab state ──
  const [newAnchor,   setNewAnchor]   = useState('');
  const [newEmoji,    setNewEmoji]    = useState('🌟');
  const [editingIdx,  setEditingIdx]  = useState<number | null>(null);
  const [editText,    setEditText]    = useState('');
  const MAX_ANCHORS = 10;

  // ── NLP timer helpers ─────────────────────────────────────────────────────
  const startNlpTimer = useCallback(() => {
    if (nlpTimerRef.current) clearInterval(nlpTimerRef.current);
    setNlpTimerSeconds(12);
    setNlpTimerActive(true);

    let remaining = 12;
    nlpTimerRef.current = setInterval(() => {
      remaining -= 1;
      setNlpTimerSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(nlpTimerRef.current);
        nlpTimerRef.current = null;
        setNlpTimerActive(false);
        HapticsService.notify();
        // auto-advance to step 5 (index 4)
        setNlpCurrentStep(4);
        setDoneNLP(p => p.includes(3) ? p : [...p, 3]);
      }
    }, 1000);
  }, []);

  const stopNlpTimer = useCallback(() => {
    if (nlpTimerRef.current) {
      clearInterval(nlpTimerRef.current);
      nlpTimerRef.current = null;
    }
    setNlpTimerActive(false);
    setNlpTimerSeconds(12);
  }, []);

  useEffect(() => {
    return () => {
      if (nlpTimerRef.current) clearInterval(nlpTimerRef.current);
    };
  }, []);

  const startNlpSession = () => {
    setNlpSessionActive(true);
    setNlpCurrentStep(0);
    setDoneNLP([]);
    setNlpTimerActive(false);
    setNlpTimerSeconds(12);
    HapticsService.impactMedium();
  };

  const finishNlpSession = () => {
    stopNlpTimer();
    setNlpSessionActive(false);
    setNlpCurrentStep(0);
    setNlpSessions(p => p + 1);
    HapticsService.notify();
    Alert.alert(t('emotionalAnchors.sesja_zakonczona', 'Sesja zakończona!'), t('emotionalAnchors.kotwica_nlp_ustawiona_przetestuj_ja', 'Kotwica NLP ustawiona. Przetestuj ją naciskając knykieć.'));
  };

  const handleStepPress = (index: number) => {
    if (!nlpSessionActive) return;
    HapticsService.impactLight();

    if (index === 3) {
      // timed step
      if (!nlpTimerActive) {
        startNlpTimer();
      } else {
        stopNlpTimer();
      }
      return;
    }

    setDoneNLP(p => p.includes(index) ? p.filter(x => x !== index) : [...p, index]);
    if (index < NLP_STEPS.length - 1) {
      setNlpCurrentStep(index + 1);
    }
  };

  // ── Create tab helpers ─────────────────────────────────────────────────────
  const addAnchor = () => {
    if (!newAnchor.trim()) return;
    if (emotionalAnchors.length >= MAX_ANCHORS) {
      Alert.alert('Limit kotwic', `Możesz dodać maksymalnie ${MAX_ANCHORS} własnych kotwic.`);
      return;
    }
    addEmotionalAnchor(`${newEmoji} ${newAnchor.trim()}`);
    setNewAnchor('');
    HapticsService.impactMedium();
  };

  const saveEdit = (original: string) => {
    if (!editText.trim()) return;
    removeEmotionalAnchor(original);
    addEmotionalAnchor(editText.trim());
    setEditingIdx(null);
    setEditText('');
    HapticsService.impactLight();
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredAnchors = categoryFilter === 'Wszystkie'
    ? PRESET_ANCHORS
    : PRESET_ANCHORS.filter(a => a.category === categoryFilter);

  const activeCount = activeAnchors.length;
  const myCount     = emotionalAnchors.length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <AnchorBg isDark={isDark} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2 }}>
            {t('emotionalAnchors.eyebrow', 'NLP').toUpperCase()}
          </Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>
            {t('emotionalAnchors.title', 'Kotwice emocjonalne')}
          </Text>
        </View>

        {/* Active badge */}
        {activeCount > 0 && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>{activeCount}</Text>
          </View>
        )}

        <Pressable
          style={styles.starBtn}
          hitSlop={12}
          onPress={() => {
            HapticsService.impact('light');
            if (isFavoriteItem('emotional-anchors')) {
              removeFavoriteItem('emotional-anchors');
            } else {
              addFavoriteItem({
                id: 'emotional-anchors',
                label: 'Kotwice emocjonalne',
                route: 'EmotionalAnchors',
                params: {},
                icon: 'Anchor',
                color: ACCENT,
                addedAt: new Date().toISOString(),
              });
            }
          }}
        >
          <Star
            size={18}
            color={isFavoriteItem('emotional-anchors') ? ACCENT : subColor}
            strokeWidth={1.8}
            fill={isFavoriteItem('emotional-anchors') ? ACCENT : 'none'}
          />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {([['anchors', 'Kotwice'], ['nlp', 'Technika NLP'], ['create', 'Moje']] as const).map(([tab, label]) => {
          const active = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => { HapticsService.impactLight(); setActiveTab(tab); }}
              style={[styles.tabChip, active && { backgroundColor: ACCENT, borderColor: ACCENT }]}
            >
              <Text style={[styles.tabLabel, { color: active ? '#fff' : subColor }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen }}>

        {/* ══════ ANCHORS TAB ══════ */}
        {activeTab === 'anchors' && (
          <>
            {/* Hero section */}
            <HeroAnchor
              isDark={isDark}
              activeCount={activeCount}
              myCount={myCount}
              nlpCount={nlpSessions}
            />

            {/* Category filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 14 }}
              contentContainerStyle={{ gap: 8, paddingRight: 22 }}
            >
              {CATEGORIES.map(cat => {
                const sel = categoryFilter === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => { setCategoryFilter(cat); HapticsService.impactLight(); }}
                    style={[
                      styles.catChip,
                      { borderColor: sel ? ACCENT : cardBorder, backgroundColor: sel ? ACCENT + '22' : 'transparent' },
                    ]}
                  >
                    <Text style={[styles.catChipText, { color: sel ? ACCENT : subColor }]}>{cat}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 12 }}>
              {t('emotionalAnchors.dotknij_kotwicy_aby_ja_aktywowac', 'Dotknij kotwicy aby ją aktywować — poczuj jak stan wraca.')}
            </Text>

            {filteredAnchors.map((anchor, i) => {
              const active = activeAnchors.includes(anchor.id);
              return (
                <Animated.View key={anchor.id} entering={FadeInDown.delay(60 + i * 50).duration(380)}>
                  <Pressable
                    onPress={() => {
                      HapticsService.impactMedium();
                      setActiveAnchors(p =>
                        p.includes(anchor.id) ? p.filter(x => x !== anchor.id) : [...p, anchor.id]
                      );
                    }}
                    style={[
                      styles.anchorCard,
                      {
                        backgroundColor: active ? ACCENT + '18' : cardBg,
                        borderColor:     active ? ACCENT + '55' : cardBorder,
                      },
                    ]}
                  >
                    {/* Wave animation overlay */}
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                      <AnchorWave active={active} />
                    </View>

                    <View style={[styles.anchorIcon, { backgroundColor: active ? ACCENT + '22' : cardBorder + '33' }]}>
                      <Text style={{ fontSize: 20 }}>{anchor.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: subColor, fontSize: 10, letterSpacing: 1.5 }}>
                        {anchor.category.toUpperCase()}
                      </Text>
                      <Text style={{ color: textColor, fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>
                        "{anchor.text}"
                      </Text>
                    </View>
                    {active && (
                      <View style={styles.activeIndicator}>
                        <Anchor size={14} color="#fff" strokeWidth={2} />
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </>
        )}

        {/* ══════ NLP TAB ══════ */}
        {activeTab === 'nlp' && (
          <>
            <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
              {t('emotionalAnchors.technika_kotwiczeni_nlp_zaprogramu_', 'Technika kotwiczenia NLP — zaprogramuj ciało tak, by gesty natychmiast wywoływały pożądany stan.')}
            </Text>

            {/* Start / Finish session button */}
            {!nlpSessionActive ? (
              <Animated.View entering={FadeIn.duration(350)}>
                <Pressable onPress={startNlpSession} style={styles.nlpStartBtn}>
                  <LinearGradient colors={[ACCENT, ACCENT_GLOW]} style={styles.nlpStartGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Play size={18} color="#fff" />
                    <Text style={styles.nlpStartText}>{t('emotionalAnchors.rozpocznij_sesje_nlp', 'Rozpocznij sesję NLP')}</Text>
                  </LinearGradient>
                </Pressable>
                {nlpSessions > 0 && (
                  <Text style={{ color: subColor, fontSize: 12, textAlign: 'center', marginTop: 6 }}>
                    Wykonane sesje: {nlpSessions}
                  </Text>
                )}
              </Animated.View>
            ) : (
              <Animated.View entering={FadeIn.duration(300)}>
                <Pressable onPress={finishNlpSession} style={[styles.nlpStartBtn, { marginBottom: 8 }]}>
                  <View style={[styles.nlpStartGrad, { backgroundColor: '#34D399', borderRadius: 14 }]}>
                    <Square size={16} color="#fff" />
                    <Text style={styles.nlpStartText}>{t('emotionalAnchors.zakoncz_sesje', 'Zakończ sesję')}</Text>
                  </View>
                </Pressable>
              </Animated.View>
            )}

            {/* Pulsing hold circle — shown when timer active */}
            {nlpTimerActive && (
              <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
                <HoldCircle active={nlpTimerActive} />
              </Animated.View>
            )}

            {/* Steps */}
            {NLP_STEPS.map((step, i) => {
              const done    = doneNLP.includes(i);
              const current = nlpSessionActive && nlpCurrentStep === i;
              const isTimedStep = step.timed;
              const timerRunning = isTimedStep && nlpTimerActive;

              return (
                <Pressable
                  key={i}
                  onPress={() => handleStepPress(i)}
                  style={[
                    styles.nlpStep,
                    {
                      backgroundColor: current
                        ? ACCENT + '1A'
                        : done
                          ? ACCENT + '10'
                          : cardBg,
                      borderColor: current
                        ? ACCENT + '66'
                        : done
                          ? ACCENT + '33'
                          : cardBorder,
                      borderWidth: current ? 1.5 : 1,
                    },
                  ]}
                >
                  <View style={[styles.nlpNum, { backgroundColor: done ? ACCENT : current ? ACCENT + '50' : ACCENT + '30' }]}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textColor, fontSize: 13, lineHeight: 20 }}>{step.label}</Text>
                    {current && isTimedStep && (
                      <Text style={{ color: ACCENT, fontSize: 11, marginTop: 4 }}>
                        {timerRunning ? 'Przytrzymaj — odliczamy…' : 'Naciśnij aby rozpocząć odliczanie'}
                      </Text>
                    )}
                  </View>

                  {/* Countdown ring replaces checkbox for timed step */}
                  {isTimedStep && current ? (
                    <CountdownRing seconds={nlpTimerSeconds} total={12} />
                  ) : (
                    <CheckCircle2 size={16} color={done ? ACCENT : cardBorder} />
                  )}
                </Pressable>
              );
            })}
          </>
        )}

        {/* ══════ CREATE TAB ══════ */}
        {activeTab === 'create' && (
          <>
            {/* Progress header */}
            <View style={styles.createProgress}>
              <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>
                {emotionalAnchors.length}/{MAX_ANCHORS} kotwic stworzonych
              </Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${(emotionalAnchors.length / MAX_ANCHORS) * 100}%` as any },
                  ]}
                />
              </View>
            </View>

            <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 12 }}>
              {t('emotionalAnchors.stworz_wlasne_kotwice_zdania_mantry', 'Stwórz własne kotwice — zdania, mantry lub obrazy które są dla ciebie znaczące.')}
            </Text>

            {/* Emoji picker */}
            <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginBottom: 8 }}>
              {t('emotionalAnchors.wybierz_emoji', 'WYBIERZ EMOJI')}
            </Text>
            <View style={styles.emojiRow}>
              {PRESET_EMOJIS.map(emoji => (
                <Pressable
                  key={emoji}
                  onPress={() => { setNewEmoji(emoji); HapticsService.impactLight(); }}
                  style={[
                    styles.emojiChip,
                    {
                      backgroundColor: newEmoji === emoji ? ACCENT + '22' : cardBg,
                      borderColor:     newEmoji === emoji ? ACCENT : cardBorder,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{emoji}</Text>
                </Pressable>
              ))}
            </View>

            {/* Input row */}
            <View style={[styles.inputRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={{ fontSize: 18, marginRight: 4 }}>{newEmoji}</Text>
              <TextInput
                value={newAnchor}
                onChangeText={setNewAnchor}
                placeholder={t('emotionalAnchors.moja_osobista_kotwica', 'Moja osobista kotwica...')}
                placeholderTextColor={subColor}
                style={{ color: textColor, fontSize: 14, flex: 1 }}
                returnKeyType="done"
                onSubmitEditing={addAnchor}
              />
              <Pressable
                onPress={addAnchor}
                style={[styles.addBtn, { backgroundColor: ACCENT, opacity: newAnchor.trim() ? 1 : 0.45 }]}
              >
                <Plus size={18} color="#fff" />
              </Pressable>
            </View>

            {/* Custom anchors list */}
            {emotionalAnchors.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>⚓</Text>
                <Text style={{ color: subColor, fontSize: 13, textAlign: 'center' }}>
                  {t('emotionalAnchors.dodaj_pierwsza_kotwice_powyzej', 'Dodaj pierwszą kotwicę powyżej')}
                </Text>
              </View>
            ) : (
              emotionalAnchors.map((anchor, i) => (
                <Animated.View key={`${anchor}-${i}`} entering={FadeInDown.duration(350)}>
                  {editingIdx === i ? (
                    /* Inline edit mode */
                    <View style={[styles.myAnchor, { backgroundColor: cardBg, borderColor: ACCENT + '55' }]}>
                      <TextInput
                        value={editText}
                        onChangeText={setEditText}
                        style={{ color: textColor, fontSize: 13, flex: 1 }}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={() => saveEdit(anchor)}
                      />
                      <Pressable onPress={() => saveEdit(anchor)} hitSlop={8}>
                        <CheckCircle2 size={18} color={ACCENT} />
                      </Pressable>
                      <Pressable onPress={() => setEditingIdx(null)} hitSlop={8}>
                        <X size={16} color={subColor} />
                      </Pressable>
                    </View>
                  ) : (
                    <View style={[styles.myAnchor, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                      <Text style={{ color: textColor, fontSize: 13, flex: 1, fontStyle: 'italic' }}>
                        "{anchor}"
                      </Text>
                      <Pressable
                        onPress={() => { setEditingIdx(i); setEditText(anchor); HapticsService.impactLight(); }}
                        hitSlop={8}
                        style={{ marginRight: 6 }}
                      >
                        <Edit3 size={14} color={subColor} />
                      </Pressable>
                      <Pressable
                        onPress={() => { removeEmotionalAnchor(anchor); HapticsService.impactLight(); }}
                        hitSlop={8}
                      >
                        <Trash2 size={14} color='#F87171' />
                      </Pressable>
                    </View>
                  )}
                </Animated.View>
              ))
            )}
          </>
        )}

        <EndOfContentSpacer />
      </ScrollView>
        </SafeAreaView>
</View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: layout.padding.screen, paddingBottom: 12, gap: 12, paddingTop: 6,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  starBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(14,165,233,0.3)', backgroundColor: 'rgba(14,165,233,0.08)',
  },
  activeBadge: {
    minWidth: 22, height: 22, borderRadius: 11, backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  activeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: layout.padding.screen, marginBottom: 12 },
  tabChip: {
    flex: 1, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.25)', backgroundColor: 'rgba(14,165,233,0.06)', alignItems: 'center',
  },
  tabLabel: { fontSize: 12, fontWeight: '600' },

  // Hero
  heroContainer: { alignItems: 'center', paddingVertical: 20, marginBottom: 8 },
  heroGlow: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    backgroundColor: ACCENT, opacity: 0.12,
  },
  heroIconWrap: { marginBottom: 16 },
  heroIconGrad: {
    width: 78, height: 78, borderRadius: 39,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 14,
    elevation: 10,
  },
  statsRow: { flexDirection: 'row', gap: 28 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 1 },

  // Category chips
  catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  catChipText: { fontSize: 12, fontWeight: '600' },

  // Anchor cards
  anchorCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10, overflow: 'hidden',
  },
  anchorIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  activeIndicator: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
  },

  // Wave ring
  waveRing: {
    position: 'absolute', top: '50%', left: '50%',
    width: 200, height: 200, borderRadius: 100,
    marginLeft: -100, marginTop: -100,
    borderWidth: 2, borderColor: ACCENT,
  },

  // NLP
  nlpStartBtn: { marginBottom: 16, borderRadius: 14, overflow: 'hidden' },
  nlpStartGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, paddingHorizontal: 20,
  },
  nlpStartText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  nlpStep: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  nlpNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Countdown
  countdownWrap: { width: 84, height: 84, position: 'relative' },
  countdownNum: { fontSize: 22, fontWeight: '800' },

  // Hold circle
  holdCircleWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  holdCircleOuter: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2.5, borderColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 16,
    elevation: 8,
  },
  holdCircleInner: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: ACCENT + '22',
    alignItems: 'center', justifyContent: 'center',
  },

  // Create tab
  createProgress: { marginBottom: 12 },
  progressBarBg: {
    height: 5, borderRadius: 3, backgroundColor: 'rgba(14,165,233,0.15)',
    marginTop: 6, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 3, backgroundColor: ACCENT },
  emojiRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  emojiChip: { width: 48, height: 48, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10, borderRadius: 14, borderWidth: 1, marginBottom: 14,
  },
  addBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  myAnchor: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 13, borderRadius: 13, borderWidth: 1, marginBottom: 8,
  },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
});
