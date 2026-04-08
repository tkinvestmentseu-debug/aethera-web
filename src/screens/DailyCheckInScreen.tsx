// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  Dimensions, Pressable, ScrollView, StyleSheet, Text, View,
  TextInput, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withTiming, withSequence, withDelay, withSpring,
  Easing, FadeInDown, FadeInUp, interpolate, runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle, Path, G, Defs, RadialGradient, Stop, Line,
} from 'react-native-svg';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { HapticsService } from '../core/services/haptics.service';
import {
  Star, ChevronLeft, Check, Moon, Sun, BookOpen,
  Heart, Zap, Sparkles,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW, height: SH } = Dimensions.get('window');
const PAD = layout.padding.screen;
const ACCENT = '#CEAE72';

// ─── Mood definitions ─────────────────────────────────────────────────────────
const MOODS = [
  { id: 'Spokojny',     emoji: '😌', label: 'Spokojny',    color: '#60A5FA', desc: 'Cisza wewnętrzna',   orbColor: '#3B82F6' },
  { id: 'Radosny',      emoji: '😊', label: 'Radosny',     color: '#CEAE72', desc: 'Serce jest lekkie', orbColor: '#F59E0B' },
  { id: 'Zmęczony',     emoji: '😴', label: 'Zmęczony',    color: '#A78BFA', desc: 'Potrzebuję ciszy',  orbColor: '#7C3AED' },
  { id: 'Niespokojny',  emoji: '😰', label: 'Niespokojny', color: '#F97316', desc: 'Energia szuka ujścia', orbColor: '#EA580C' },
  { id: 'Inspirowany',  emoji: '✨', label: 'Inspirowany', color: '#34D399', desc: 'Płyną pomysły',     orbColor: '#059669' },
  { id: 'Wdzięczny',    emoji: '🙏', label: 'Wdzięczny',   color: '#F472B6', desc: 'Serce jest pełne', orbColor: '#DB2777' },
  { id: 'Smutny',       emoji: '😢', label: 'Smutny',      color: '#818CF8', desc: 'Potrzebuję czułości', orbColor: '#4F46E5' },
  { id: 'Skupiony',     emoji: '🎯', label: 'Skupiony',    color: '#6EE7B7', desc: 'Umysł jest jasny',  orbColor: '#10B981' },
  { id: 'Mistyczny',    emoji: '🔮', label: 'Mistyczny',   color: '#C084FC', desc: 'Wrota są otwarte',  orbColor: '#9333EA' },
];

// ─── Energy levels ────────────────────────────────────────────────────────────
const ENERGY_LEVELS = [
  { val: 1, label: 'Bardzo niska',   desc: 'Potrzebuję regeneracji',    color: '#E8705A', emoji: '🌑' },
  { val: 2, label: 'Niska',          desc: 'Lekkie zmęczenie',          color: '#F97316', emoji: '🌒' },
  { val: 3, label: 'Umiarkowana',    desc: 'Normalna codzienność',      color: '#CEAE72', emoji: '🌓' },
  { val: 4, label: 'Wysoka',         desc: 'Jestem gotowy/a działać',   color: '#34D399', emoji: '🌔' },
  { val: 5, label: 'Bardzo wysoka',  desc: 'Energia przepływa przez mnie', color: '#60A5FA', emoji: '🌕' },
];

// ─── Daily rotating prompts ───────────────────────────────────────────────────
const DAILY_PROMPTS = [
  'Co czujesz w tej chwili, gdy zatrzymujesz się na chwilę?',
  'Jaką jedną myśl chciałbyś/chciałabyś dziś uwolnić?',
  'Co jest dla Ciebie największą siłą w tej chwili?',
  'Jakie słowo najlepiej opisuje Twój stan wewnętrzny dziś?',
  'Co Twoje ciało próbuje Ci powiedzieć w tej chwili?',
  'Jaka emocja potrzebuje dziś Twojej uwagi?',
  'Czego Twoja dusza dziś szuka?',
];

// ─── Focus intentions ─────────────────────────────────────────────────────────
const FOCUS_CARDS = [
  { id: 'healing',     emoji: '💚', label: 'Uzdrowienie',  desc: 'Oddaj się regeneracji',   colors: ['#064E3B', '#065F46'] as [string,string] },
  { id: 'abundance',   emoji: '💛', label: 'Obfitość',     desc: 'Przyciągnij dobrobyt',    colors: ['#78350F', '#92400E'] as [string,string] },
  { id: 'love',        emoji: '💗', label: 'Miłość',       desc: 'Otwórz serce',            colors: ['#831843', '#9D174D'] as [string,string] },
  { id: 'clarity',     emoji: '🔵', label: 'Jasność',      desc: 'Oczyść umysł',            colors: ['#1E3A5F', '#1E40AF'] as [string,string] },
  { id: 'protection',  emoji: '🛡️', label: 'Ochrona',      desc: 'Wzmocnij tarczę',         colors: ['#312E81', '#3730A3'] as [string,string] },
  { id: 'growth',      emoji: '🌱', label: 'Wzrost',       desc: 'Rozwijaj się każdego dnia', colors: ['#14532D', '#166534'] as [string,string] },
];

// ─── Moon phase helper ────────────────────────────────────────────────────────
const getMoonPhase = (): { name: string; emoji: string } => {
  const knownNew = new Date('2000-01-06').getTime();
  const cycleMs  = 29.530588853 * 24 * 3600 * 1000;
  const phase    = ((Date.now() - knownNew) % cycleMs) / cycleMs;
  if (phase < 0.0625)  return { name: 'Nów',              emoji: '🌑' };
  if (phase < 0.1875)  return { name: 'Przybywający Sierp', emoji: '🌒' };
  if (phase < 0.3125)  return { name: 'Pierwsza Kwadra',  emoji: '🌓' };
  if (phase < 0.4375)  return { name: 'Przybywający Gib',  emoji: '🌔' };
  if (phase < 0.5625)  return { name: 'Pełnia',           emoji: '🌕' };
  if (phase < 0.6875)  return { name: 'Ubywający Gib',    emoji: '🌖' };
  if (phase < 0.8125)  return { name: 'Ostatnia Kwadra',  emoji: '🌗' };
  return                      { name: 'Ubywający Sierp',  emoji: '🌘' };
};

// ─── Completion particles ─────────────────────────────────────────────────────
const PARTICLE_COUNT = 18;

const SingleParticle = ({ angle, radius, delay, color }: {
  angle: number; radius: number; delay: number; color: string;
}) => {
  const x  = useSharedValue(SW / 2);
  const y  = useSharedValue(SH * 0.38);
  const op = useSharedValue(0);
  const sc = useSharedValue(0);

  useEffect(() => {
    const tx = SW / 2 + radius * Math.cos(angle);
    const ty = SH * 0.38 + radius * Math.sin(angle) - 40;
    x.value  = withDelay(delay, withTiming(tx, { duration: 700, easing: Easing.out(Easing.quad) }));
    y.value  = withDelay(delay, withTiming(ty, { duration: 700 }));
    op.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(300, withTiming(0, { duration: 400 })),
    ));
    sc.value = withDelay(delay, withSpring(1, { damping: 6, stiffness: 200 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute', left: x.value - 5, top: y.value - 5,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: color,
    opacity: op.value,
    transform: [{ scale: sc.value }],
  }));

  return <Animated.View style={style} pointerEvents="none" />;
};

const CompletionParticles = ({ accent }: { accent: string }) => {
  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      angle:  (i / PARTICLE_COUNT) * Math.PI * 2,
      radius: 80 + (i % 3) * 40,
      delay:  i * 30,
      color:  i % 3 === 0 ? accent : i % 3 === 1 ? '#A78BFA' : '#34D399',
    })),
    [accent],
  );

  return (
    <>
      {particles.map((p, i) => <SingleParticle key={i} {...p} />)}
    </>
  );
};

// ─── SoulOrb widget ───────────────────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SoulOrb = ({
  moodColor, energyLevel, isLight,
}: { moodColor: string; energyLevel: number; isLight: boolean }) => {
  const tiltX  = useSharedValue(-4);
  const tiltY  = useSharedValue(0);
  const ring1  = useSharedValue(0.7);
  const ring2  = useSharedValue(0.6);
  const ring3  = useSharedValue(0.5);
  const orbGlow = useSharedValue(0.8);
  const particleRot = useSharedValue(0);
  const particleRot2 = useSharedValue(0);

  const speed = 1 + (energyLevel - 1) * 0.4; // 1x–2.6x based on energy

  useEffect(() => {
    ring1.value = withRepeat(
      withSequence(withTiming(1, { duration: 2200 / speed }), withTiming(0.7, { duration: 2200 / speed })),
      -1, true,
    );
    ring2.value = withRepeat(
      withSequence(
        withDelay(400, withTiming(1, { duration: 2400 / speed })),
        withTiming(0.6, { duration: 2400 / speed }),
      ),
      -1, true,
    );
    ring3.value = withRepeat(
      withSequence(
        withDelay(800, withTiming(1, { duration: 2600 / speed })),
        withTiming(0.5, { duration: 2600 / speed }),
      ),
      -1, true,
    );
    orbGlow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1800 }), withTiming(0.75, { duration: 1800 })),
      -1, true,
    );
    particleRot.value  = withRepeat(withTiming(360, { duration: 6000 / speed, easing: Easing.linear }), -1, false);
    particleRot2.value = withRepeat(withTiming(-360, { duration: 9000 / speed, easing: Easing.linear }), -1, false);
  }, [speed]);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-20, Math.min(20, -4 + e.translationY * 0.18));
      tiltY.value = Math.max(-20, Math.min(20, e.translationX * 0.18));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-4, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: tiltX.value + 'deg' },
      { rotateY: tiltY.value + 'deg' },
    ],
  }));
  const ring1Style = useAnimatedStyle(() => ({
    opacity: ring1.value * 0.45,
    transform: [{ scale: 0.85 + ring1.value * 0.3 }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    opacity: ring2.value * 0.3,
    transform: [{ scale: 0.75 + ring2.value * 0.4 }],
  }));
  const ring3Style = useAnimatedStyle(() => ({
    opacity: ring3.value * 0.2,
    transform: [{ scale: 0.65 + ring3.value * 0.5 }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: orbGlow.value,
    transform: [{ scale: 0.92 + orbGlow.value * 0.1 }],
  }));
  const pRot1Style = useAnimatedStyle(() => ({
    transform: [{ rotateZ: particleRot.value + 'deg' }],
  }));
  const pRot2Style = useAnimatedStyle(() => ({
    transform: [{ rotateZ: particleRot2.value + 'deg' }],
  }));

  const SIZE = 180;
  const CX   = SIZE / 2;
  const CY   = SIZE / 2;
  const CORE = 36;

  // 6 orbiting particles
  const ORBIT_R1 = 62;
  const ORBIT_R2 = 78;
  const orbParticles1 = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return { x: CX + ORBIT_R1 * Math.cos(a), y: CY + ORBIT_R1 * Math.sin(a) };
  });
  const orbParticles2 = Array.from({ length: 4 }, (_, i) => {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    return { x: CX + ORBIT_R2 * Math.cos(a), y: CY + ORBIT_R2 * Math.sin(a) };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }, orbStyle]}>
        {/* Outer pulse rings */}
        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring3Style]}>
          <View style={{
            width: SIZE * 0.95, height: SIZE * 0.95, borderRadius: SIZE * 0.475,
            borderWidth: 1, borderColor: moodColor + '55',
            backgroundColor: moodColor + '08',
          }} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring2Style]}>
          <View style={{
            width: SIZE * 0.78, height: SIZE * 0.78, borderRadius: SIZE * 0.39,
            borderWidth: 1.2, borderColor: moodColor + '66',
            backgroundColor: moodColor + '0C',
          }} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring1Style]}>
          <View style={{
            width: SIZE * 0.62, height: SIZE * 0.62, borderRadius: SIZE * 0.31,
            borderWidth: 1.5, borderColor: moodColor + '88',
            backgroundColor: moodColor + '14',
          }} />
        </Animated.View>

        {/* Orbiting particles layer 2 */}
        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, pRot2Style]} pointerEvents="none">
          <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
            {orbParticles2.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={2.5}
                fill={moodColor} opacity={0.3 + (i % 2) * 0.2} />
            ))}
          </Svg>
        </Animated.View>

        {/* Orbiting particles layer 1 */}
        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, pRot1Style]} pointerEvents="none">
          <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
            {orbParticles1.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={3}
                fill={moodColor} opacity={0.45 + (i % 3) * 0.15} />
            ))}
          </Svg>
        </Animated.View>

        {/* Core sphere with RadialGradient */}
        <Animated.View style={glowStyle}>
          <Svg width={SIZE} height={SIZE}>
            <Defs>
              <RadialGradient id="orbCore" cx="40%" cy="35%" r="60%">
                <Stop offset="0%" stopColor={moodColor} stopOpacity={0.9} />
                <Stop offset="50%" stopColor={moodColor} stopOpacity={0.55} />
                <Stop offset="100%" stopColor={moodColor} stopOpacity={0.12} />
              </RadialGradient>
              <RadialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={moodColor} stopOpacity={0.2} />
                <Stop offset="100%" stopColor={moodColor} stopOpacity={0.0} />
              </RadialGradient>
            </Defs>
            {/* Glow halo */}
            <Circle cx={CX} cy={CY} r={CORE + 16} fill="url(#orbGlow)" />
            {/* Core */}
            <Circle cx={CX} cy={CY} r={CORE} fill="url(#orbCore)"
              shadowColor={moodColor} />
            {/* Specular highlight */}
            <Circle cx={CX - CORE * 0.28} cy={CY - CORE * 0.28} r={CORE * 0.2}
              fill="white" opacity={0.22} />
            <Circle cx={CX - CORE * 0.18} cy={CY - CORE * 0.22} r={CORE * 0.08}
              fill="white" opacity={0.45} />
          </Svg>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

// ─── Progress bar ─────────────────────────────────────────────────────────────
const StepProgressBar = ({
  step, total, accent, isLight,
}: { step: number; total: number; accent: string; isLight: boolean }) => {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming((step + 1) / total, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [step]);
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return (
    <View style={{
      height: 3, borderRadius: 2, backgroundColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)',
      overflow: 'hidden',
    }}>
      <Animated.View style={[{ height: 3, borderRadius: 2, backgroundColor: accent }, barStyle]} />
    </View>
  );
};

// ─── Step 1 — Mood Grid ───────────────────────────────────────────────────────
const AnimatedMoodCard = ({ m, index, selected, onSelect, isLight }: {
  m: typeof MOODS[0]; index: number; selected: string;
  onSelect: (id: string) => void; isLight: boolean;
}) => {
  const active    = selected === m.id;
  const textColor = isLight ? '#2A1E0F' : '#F5F1EA';
  const scale     = useSharedValue(1);
  const CARD_W    = (SW - PAD * 2 - 20) / 3;

  useEffect(() => {
    scale.value = active
      ? withSpring(1.06, { damping: 8, stiffness: 260 })
      : withSpring(1, { damping: 10, stiffness: 200 });
  }, [active]);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(320)}>
      <Animated.View style={cardStyle}>
      <Pressable
        onPress={() => { HapticsService.impact('light'); onSelect(m.id); }}
        style={[dc.moodCard, {
          width: CARD_W,
          borderColor: active ? m.color : m.color + '44',
          backgroundColor: active ? m.color + '22' : isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)',
          shadowColor: active ? m.color : 'transparent',
          shadowOpacity: active ? 0.4 : 0,
          shadowRadius: active ? 10 : 0,
          elevation: active ? 6 : 0,
        }]}>
        <Text style={dc.moodEmoji}>{m.emoji}</Text>
        <Text style={[dc.moodLabel, { color: active ? m.color : textColor }]}>{m.label}</Text>
        {active && <Text style={[dc.moodDesc, { color: m.color + 'CC' }]}>{m.desc}</Text>}
      </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const MoodGrid = ({
  selected, onSelect, isLight,
}: { selected: string; onSelect: (id: string) => void; isLight: boolean }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
    {MOODS.map((m, i) => (
      <AnimatedMoodCard key={m.id} m={m} index={i} selected={selected} onSelect={onSelect} isLight={isLight} />
    ))}
  </View>
);

// ─── Step 2 — Energy Scale ────────────────────────────────────────────────────
const AnimatedEnergySeg = ({ lvl, selected }: { lvl: typeof ENERGY_LEVELS[0]; selected: number }) => {
  const active = selected >= lvl.val;
  const segW   = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    segW.value = withDelay(
      (lvl.val - 1) * 80,
      withTiming(active ? 1 : 0, { duration: 360, easing: Easing.out(Easing.quad) }),
    );
  }, [active]);

  const segStyle = useAnimatedStyle(() => ({
    flex: segW.value,
    backgroundColor: lvl.color,
    opacity: 0.7 + segW.value * 0.3,
  }));

  return <Animated.View style={[dc.energySeg, segStyle]} />;
};

const EnergyScale = ({
  selected, onSelect, accent, isLight,
}: { selected: number; onSelect: (v: number) => void; accent: string; isLight: boolean }) => {
  const textColor = isLight ? '#2A1E0F' : '#F5F1EA';
  const subColor  = isLight ? '#6A5A48' : '#8A8080';
  const cardBg    = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)';

  return (
    <View style={{ gap: 10 }}>
      {/* Animated energy meter */}
      <View style={[dc.energyMeter, { backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)' }]}>
        {ENERGY_LEVELS.map((lvl) => (
          <AnimatedEnergySeg key={lvl.val} lvl={lvl} selected={selected} />
        ))}
      </View>

      {/* Level cards */}
      {ENERGY_LEVELS.map((lvl, i) => {
        const active = selected === lvl.val;
        return (
          <Animated.View key={lvl.val} entering={FadeInDown.delay(i * 60).duration(320)}>
            <Pressable
              onPress={() => { HapticsService.impact('light'); onSelect(lvl.val); }}
              style={[dc.energyCard, {
                backgroundColor: active ? lvl.color + '22' : cardBg,
                borderColor: active ? lvl.color : lvl.color + '33',
              }]}>
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: lvl.color + '22',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 18 }}>{lvl.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: active ? lvl.color : textColor, fontSize: 14, fontWeight: '700' }}>
                  {lvl.val} — {lvl.label}
                </Text>
                <Text style={{ color: subColor, fontSize: 12, lineHeight: 18 }}>{lvl.desc}</Text>
              </View>
              {active && (
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: lvl.color, alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={12} color="#FFF" />
                </View>
              )}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
};

// ─── Step 3 — Refleksja ───────────────────────────────────────────────────────
const ReflectionStep = ({
  reflection, onChangeReflection,
  gratitude, onChangeGratitude,
  intention, onChangeIntention,
  accent, isLight,
}: {
  reflection: string; onChangeReflection: (t: string) => void;
  gratitude: string; onChangeGratitude: (t: string) => void;
  intention: string; onChangeIntention: (t: string) => void;
  accent: string; isLight: boolean;
}) => {
  const textColor = isLight ? '#2A1E0F' : '#F5F1EA';
  const subColor  = isLight ? '#6A5A48' : '#8A8080';
  const cardBg    = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)';
  const cardBdr   = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.10)';
  const inputBg   = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const today  = new Date();
  const prompt = DAILY_PROMPTS[today.getDay()];

  return (
    <View style={{ gap: 14 }}>
      {/* Main reflection */}
      <Animated.View entering={FadeInDown.duration(360)}>
        <View style={[dc.reflCard, { backgroundColor: cardBg, borderColor: cardBdr }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <BookOpen size={14} color={accent} />
            <Text style={{ color: accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }}>MYŚLI DNIA</Text>
          </View>
          <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 10, fontStyle: 'italic' }}>
            {prompt}
          </Text>
          <TextInput
            style={[dc.reflInput, {
              color: textColor,
              backgroundColor: inputBg,
              borderColor: focusedField === 'reflection' ? accent + '77' : 'transparent',
            }]}
            placeholder="Zapisz swoje myśli…"
            placeholderTextColor={subColor + '88'}
            value={reflection}
            onChangeText={onChangeReflection}
            multiline
            textAlignVertical="top"
            onFocus={() => setFocusedField('reflection')}
            onBlur={() => setFocusedField(null)}
          />
        </View>
      </Animated.View>

      {/* Gratitude */}
      <Animated.View entering={FadeInDown.delay(100).duration(360)}>
        <View style={[dc.reflCard, { backgroundColor: cardBg, borderColor: cardBdr }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Heart size={14} color="#F472B6" />
            <Text style={{ color: '#F472B6', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }}>WDZIĘCZNOŚĆ</Text>
            <Text style={{ color: subColor, fontSize: 10, marginLeft: 'auto' }}>(opcjonalnie)</Text>
          </View>
          <TextInput
            style={[dc.reflInputShort, {
              color: textColor,
              backgroundColor: inputBg,
              borderColor: focusedField === 'gratitude' ? '#F472B688' : 'transparent',
            }]}
            placeholder="Za co jesteś dziś wdzięczny/a?"
            placeholderTextColor={subColor + '88'}
            value={gratitude}
            onChangeText={onChangeGratitude}
            returnKeyType="done"
            onFocus={() => setFocusedField('gratitude')}
            onBlur={() => setFocusedField(null)}
          />
        </View>
      </Animated.View>

      {/* Intention */}
      <Animated.View entering={FadeInDown.delay(200).duration(360)}>
        <View style={[dc.reflCard, { backgroundColor: cardBg, borderColor: cardBdr }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Zap size={14} color="#34D399" />
            <Text style={{ color: '#34D399', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }}>INTENCJA</Text>
            <Text style={{ color: subColor, fontSize: 10, marginLeft: 'auto' }}>(opcjonalnie)</Text>
          </View>
          <TextInput
            style={[dc.reflInputShort, {
              color: textColor,
              backgroundColor: inputBg,
              borderColor: focusedField === 'intention' ? '#34D39988' : 'transparent',
            }]}
            placeholder="Jaka jest Twoja intencja na dziś?"
            placeholderTextColor={subColor + '88'}
            value={intention}
            onChangeText={onChangeIntention}
            returnKeyType="done"
            onFocus={() => setFocusedField('intention')}
            onBlur={() => setFocusedField(null)}
          />
        </View>
      </Animated.View>
    </View>
  );
};

// ─── Step 4 — Focus Intention ─────────────────────────────────────────────────
const AnimatedFocusCard = ({ f, index, selected, onSelect, isLight }: {
  f: typeof FOCUS_CARDS[0]; index: number; selected: string;
  onSelect: (id: string) => void; isLight: boolean;
}) => {
  const active    = selected === f.id;
  const textColor = isLight ? '#2A1E0F' : '#F5F1EA';
  const CARD_W    = (SW - PAD * 2 - 12) / 2;
  const scale     = useSharedValue(1);

  useEffect(() => {
    scale.value = active
      ? withSpring(1.04, { damping: 8, stiffness: 260 })
      : withSpring(1, { damping: 10 });
  }, [active]);

  const cardSty = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(340)} style={{ width: CARD_W }}>
      <Animated.View style={cardSty}>
      <Pressable
        onPress={() => { HapticsService.impact('medium'); onSelect(f.id); }}
        style={{ borderRadius: 18, overflow: 'hidden' }}>
        <LinearGradient
          colors={active ? f.colors : [
            isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)',
            isLight ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.04)',
          ]}
          style={[dc.focusCard, {
            borderColor: active ? f.colors[0] + 'BB' : isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.10)',
            borderWidth: active ? 2 : 1,
          }]}>
          <Text style={{ fontSize: 28 }}>{f.emoji}</Text>
          <Text style={{ color: active ? '#FFF' : textColor, fontSize: 14, fontWeight: '800', marginTop: 4 }}>
            {f.label}
          </Text>
          <Text style={{ color: active ? 'rgba(255,255,255,0.75)' : isLight ? '#6A5A48' : '#8A8080', fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 2 }}>
            {f.desc}
          </Text>
          {active && <View style={dc.focusCheck}><Check size={12} color="#FFF" /></View>}
        </LinearGradient>
      </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const FocusGrid = ({
  selected, onSelect, accent, isLight,
}: { selected: string; onSelect: (id: string) => void; accent: string; isLight: boolean }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
    {FOCUS_CARDS.map((f, i) => (
      <AnimatedFocusCard key={f.id} f={f} index={i} selected={selected} onSelect={onSelect} isLight={isLight} />
    ))}
  </View>
);

// ─── Completion Screen ────────────────────────────────────────────────────────
const ORACLE_MESSAGES = [
  'Twoja dusza zapisała dzisiejszy ślad w kosmicznej księdze.',
  'To zameldowanie wzmacnia Twoje połączenie z wyższą jaźnią.',
  'Każde świadome zatrzymanie jest aktem duchowej odwagi.',
  'Twoja intencja na dziś staje się nasionem, które kiełkuje niewidocznie.',
  'Niebo widzi Twoje zameldowanie — jesteś w przepływie.',
  'Dzisiejsza refleksja jest darem dla jutrzejszego Ciebie.',
  'Zakotwiczyłeś/aś się w teraźniejszości. To wielkie dzieło duszy.',
];

const CompletionScreen = ({
  accent, isLight, navigation, mood, focusId,
}: {
  accent: string; isLight: boolean; navigation: any; mood: string; focusId: string;
}) => {
  const { t } = useTranslation();
  const checkScale = useSharedValue(0);
  const checkOp    = useSharedValue(0);
  const msgOp      = useSharedValue(0);

  const today   = new Date();
  const message = ORACLE_MESSAGES[today.getDay()];
  const moodObj = MOODS.find(m => m.id === mood);
  const focusObj = FOCUS_CARDS.find(f => f.id === focusId);

  useEffect(() => {
    checkScale.value = withDelay(100, withSpring(1, { damping: 6, stiffness: 200 }));
    checkOp.value    = withDelay(100, withTiming(1, { duration: 500 }));
    msgOp.value      = withDelay(600, withTiming(1, { duration: 700 }));
  }, []);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOp.value,
  }));
  const msgStyle = useAnimatedStyle(() => ({ opacity: msgOp.value }));

  const textColor = isLight ? '#2A1E0F' : '#F5F1EA';
  const subColor  = isLight ? '#6A5A48' : '#8A8080';
  const cardBg    = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)';
  const cardBdr   = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.10)';

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: PAD }}>
      <CompletionParticles accent={accent} />

      {/* Check circle */}
      <Animated.View style={checkStyle}>
        <LinearGradient
          colors={[accent, accent + 'BB']}
          style={dc.completionCheck}>
          <Check size={36} color="#1A1000" strokeWidth={3} />
        </LinearGradient>
      </Animated.View>

      <Animated.View style={[{ alignItems: 'center', gap: 6, marginTop: 20 }, msgStyle]}>
        <Text style={{ color: accent, fontSize: 10, fontWeight: '800', letterSpacing: 2.5 }}>
          ZAMELDOWANIE ZAKOŃCZONE
        </Text>
        <Text style={{ color: textColor, fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 4 }}>
          Świetnie, {moodObj ? moodObj.emoji : '✨'}
        </Text>
        {focusObj && (
          <Text style={{ color: subColor, fontSize: 13, textAlign: 'center', marginTop: 2 }}>
            Twoja intencja na dziś: <Text style={{ color: textColor, fontWeight: '700' }}>{focusObj.label}</Text>
          </Text>
        )}
      </Animated.View>

      {/* Oracle message */}
      <Animated.View style={[{
        marginTop: 28, width: '100%',
        backgroundColor: cardBg, borderWidth: 1, borderColor: accent + '44',
        borderRadius: 18, padding: 18, alignItems: 'center', gap: 8,
      }, msgStyle]}>
        <Sparkles size={18} color={accent} />
        <Text style={{ color: accent, fontSize: 9, fontWeight: '800', letterSpacing: 2 }}>PRZESŁANIE ORACLE</Text>
        <Text style={{ color: textColor, fontSize: 14, lineHeight: 22, textAlign: 'center', fontStyle: 'italic' }}>
          "{message}"
        </Text>
      </Animated.View>

      {/* Navigation options */}
      <Animated.View style={[{ width: '100%', gap: 10, marginTop: 28 }, msgStyle]}>
        <Pressable
          onPress={() => { HapticsService.impact('medium'); navigation.navigate('Journal'); }}
          style={[dc.navBtn, {
            backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.09)',
            borderColor: isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.12)',
          }]}>
          <BookOpen size={16} color={accent} />
          <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>Otwórz Dziennik</Text>
        </Pressable>
        <Pressable
          onPress={() => { HapticsService.impact('medium'); navigation.navigate('Portal'); }}
          style={[dc.navBtn, {
            backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.09)',
            borderColor: isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.12)',
          }]}>
          <Star size={16} color={accent} />
          <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>Przejdź do Portalu</Text>
        </Pressable>
        <Pressable
          onPress={() => { HapticsService.impact('light'); navigation.goBack(); }}
          style={{ alignSelf: 'center', paddingVertical: 8 }}>
          <Text style={{ color: subColor, fontSize: 13 }}>Wróć</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'mood',       title: 'Nastrój Duszy',    subtitle: 'Jak się czujesz w tej chwili?' },
  { id: 'energy',     title: 'Energia Ciała',     subtitle: 'Oceń swój poziom energii' },
  { id: 'reflection', title: 'Myśli Dnia',        subtitle: 'Zatrzymaj się i poobserwuj siebie' },
  { id: 'focus',      title: 'Rytuał Intencji',   subtitle: 'Wybierz fokus na dziś' },
];

export const DailyCheckInScreen = ({ navigation }: any) => {
  const insets  = useSafeAreaInsets();
    const dailyProgress = useAppStore(s => s.dailyProgress);
  const updateDailyProgress = useAppStore(s => s.updateDailyProgress);
  const { currentTheme, isLight } = useTheme();
  const accent  = ACCENT;

  const textColor = isLight ? '#2A1E0F' : '#F5F1EA';
  const subColor  = isLight ? '#6A5A48' : '#8A8080';
  const bgColors: [string, string, string] = isLight
    ? ['#FAF6EE', '#F5EDD8', '#FAF6EE']
    : ['#07060F', '#0E0B1A', '#07060F'];

  const scrollRef = useRef<ScrollView>(null);
  const moonPhase = useMemo(() => getMoonPhase(), []);
  const today     = useMemo(() => new Date(), []);
  const todayStr  = useMemo(() => fmtDate(today), []);
  const todayDisplay = useMemo(() => {
    const DN = ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'];
    const MN = ['Stycznia','Lutego','Marca','Kwietnia','Maja','Czerwca','Lipca','Sierpnia','Września','Października','Listopada','Grudnia'];
    return `${DN[today.getDay()]}, ${today.getDate()} ${MN[today.getMonth()]}`;
  }, []);

  // ── State ───────────────────────────────────────────────────────────────────
  const [step,       setStep]       = useState(0);
  const [mood,       setMood]       = useState('');
  const [energyVal,  setEnergyVal]  = useState(3);
  const [reflection, setReflection] = useState('');
  const [gratitude,  setGratitude]  = useState('');
  const [intention,  setIntention]  = useState('');
  const [focusId,    setFocusId]    = useState('');
  const [completed,  setCompleted]  = useState(false);

  // SoulOrb color
  const moodObj    = MOODS.find(m => m.id === mood);
  const orbColor   = moodObj?.orbColor ?? (isLight ? '#CEAE72' : '#7C3AED');
  const energyObj  = ENERGY_LEVELS.find(l => l.val === energyVal);

  // ── Keyboard ────────────────────────────────────────────────────────────────
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────
  const canProceed = useMemo(() => {
    if (step === 0) return mood.length > 0;
    if (step === 1) return energyVal > 0;
    if (step === 2) return true; // reflection optional
    if (step === 3) return focusId.length > 0;
    return true;
  }, [step, mood, energyVal, focusId]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (!canProceed) return;
    HapticsService.impact('light');
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      handleSubmit();
    }
  }, [canProceed, step]);

  const handleBack = useCallback(() => {
    HapticsService.impact('light');
    if (step > 0) {
      setStep(s => s - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [step]);

  const handleSubmit = useCallback(() => {
    HapticsService.notify();
    // Save to store
    if (updateDailyProgress) {
      updateDailyProgress(todayStr, {
        mood,
        energyLevel: energyVal,
        affirmationRead: true,
      });
    }
    setCompleted(true);
  }, [mood, energyVal, reflection, gratitude, intention, focusId, updateDailyProgress, todayStr]);

  // ── OrbColor animation ───────────────────────────────────────────────────────
  const headerBgOp = useSharedValue(1);

  // ── Ambient particles ────────────────────────────────────────────────────────
  const ambientRot = useSharedValue(0);
  useEffect(() => {
    ambientRot.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1, false,
    );
  }, []);
  const ambientStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: ambientRot.value + 'deg' }] }));

  const currentStep = STEPS[step];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
      <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} />

      {/* Ambient background stars */}
      {!isLight && (
        <Animated.View style={[StyleSheet.absoluteFill, ambientStyle]} pointerEvents="none">
          <Svg width={SW} height={SH} style={{ position: 'absolute' }}>
            <G opacity={0.25}>
              {Array.from({ length: 30 }, (_, i) => (
                <Circle
                  key={i}
                  cx={(i * 157 + 40) % SW}
                  cy={(i * 93 + 30) % SH}
                  r={i % 5 === 0 ? 1.5 : 0.8}
                  fill={orbColor}
                  opacity={0.3 + (i % 3) * 0.12}
                />
              ))}
            </G>
          </Svg>
        </Animated.View>
      )}

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {completed ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}>
            <CompletionScreen
              accent={accent}
              isLight={isLight}
              navigation={navigation}
              mood={mood}
              focusId={focusId}
            />
          </ScrollView>
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior="padding">
            {/* ── Cinematic Header ── */}
            <LinearGradient
              colors={isLight
                ? [accent + '18', accent + '08', 'transparent']
                : [orbColor + '20', orbColor + '08', 'transparent']}
              style={dc.cinHeader}>
              {/* Back button */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Pressable
                  onPress={step > 0 ? handleBack : () => navigation?.goBack?.()}
                  hitSlop={12} style={dc.headerBtn}>
                  <ChevronLeft size={22} color={accent} />
                </Pressable>
                <Text style={{ color: accent, fontSize: 11, fontWeight: '800', letterSpacing: 2 }}>
                  ✦ ZAMELDOWANIE DNIA
                </Text>
                <View style={[dc.moonBadge, {
                  backgroundColor: isLight ? accent + '18' : accent + '22',
                  borderColor: accent + '44',
                }]}>
                  <Text style={{ fontSize: 12 }}>{moonPhase.emoji}</Text>
                  <Text style={{ color: accent, fontSize: 8.5, fontWeight: '700' }}>{moonPhase.name}</Text>
                </View>
              </View>

              {/* Date */}
              <Text style={{ color: subColor, fontSize: 12.5, textAlign: 'center', marginBottom: 8, fontStyle: 'italic' }}>
                {todayDisplay}
              </Text>

              {/* Progress bar */}
              <StepProgressBar step={step} total={STEPS.length} accent={accent} isLight={isLight} />

              {/* Step indicators */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10 }}>
                {STEPS.map((s, i) => (
                  <View key={s.id} style={{
                    height: 6, width: i === step ? 28 : 8, borderRadius: 3,
                    backgroundColor: i < step ? accent : i === step ? accent : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)'),
                    opacity: i === step ? 1 : i < step ? 0.75 : 0.4,
                  }} />
                ))}
              </View>
            </LinearGradient>

            <ScrollView
              ref={scrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : insets.bottom + 100 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">

              {/* ── SoulOrb Hero ── */}
              <Animated.View entering={FadeInDown.duration(500)} style={{ alignItems: 'center', paddingVertical: 20 }}>
                <SoulOrb moodColor={orbColor} energyLevel={energyVal} isLight={isLight} />
                {mood.length > 0 && (
                  <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 8, alignItems: 'center' }}>
                    <Text style={{ color: moodObj?.color ?? accent, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>
                      {moodObj?.emoji} {mood}
                    </Text>
                    <Text style={{ color: subColor, fontSize: 11.5, marginTop: 2 }}>
                      Poziom energii: {energyObj?.emoji} {energyVal}/5
                    </Text>
                  </Animated.View>
                )}
              </Animated.View>

              {/* ── Step header ── */}
              <Animated.View
                key={`header-${step}`}
                entering={FadeInDown.duration(380)}
                style={{ paddingHorizontal: PAD, marginBottom: 16, alignItems: 'center' }}>
                <Text style={{ color: accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 4 }}>
                  KROK {step + 1} Z {STEPS.length}
                </Text>
                <Text style={{ color: textColor, fontSize: 22, fontWeight: '700', textAlign: 'center', letterSpacing: -0.3 }}>
                  {currentStep.title}
                </Text>
                <Text style={{ color: subColor, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 }}>
                  {currentStep.subtitle}
                </Text>
              </Animated.View>

              {/* ── Step content ── */}
              <Animated.View
                key={`content-${step}`}
                entering={FadeInUp.delay(80).duration(400)}
                style={{ paddingHorizontal: PAD }}>
                {step === 0 && (
                  <MoodGrid selected={mood} onSelect={setMood} isLight={isLight} />
                )}
                {step === 1 && (
                  <EnergyScale selected={energyVal} onSelect={setEnergyVal} accent={accent} isLight={isLight} />
                )}
                {step === 2 && (
                  <ReflectionStep
                    reflection={reflection}
                    onChangeReflection={setReflection}
                    gratitude={gratitude}
                    onChangeGratitude={setGratitude}
                    intention={intention}
                    onChangeIntention={setIntention}
                    accent={accent}
                    isLight={isLight}
                  />
                )}
                {step === 3 && (
                  <FocusGrid selected={focusId} onSelect={setFocusId} accent={accent} isLight={isLight} />
                )}
              </Animated.View>
            </ScrollView>

            {/* ── Footer CTA ── */}
            <View style={[dc.footer, {
              bottom: keyboardHeight > 0 ? keyboardHeight : insets.bottom + 8,
              backgroundColor: 'transparent',
            }]}>
              <Pressable
                onPress={handleNext}
                disabled={!canProceed}
                style={{ opacity: canProceed ? 1 : 0.45 }}>
                <LinearGradient
                  colors={canProceed ? [accent, accent + 'CC'] : [accent + '66', accent + '44']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={dc.nextBtn}>
                  <Text style={dc.nextBtnText}>
                    {step === STEPS.length - 1 ? 'Zamelduj się ✦' : 'Dalej'}
                  </Text>
                  {step < STEPS.length - 1 && (
                    <Text style={{ color: '#1A1000', fontSize: 15, fontWeight: '700', marginLeft: 4 }}>→</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
};

// ─── Helpers (reused from WeeklyReport) ──────────────────────────────────────
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

// ─── Styles ───────────────────────────────────────────────────────────────────
const dc = StyleSheet.create({
  cinHeader: {
    paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 16,
  },
  headerBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  moonBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1,
  },

  // Mood
  moodCard: {
    alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6,
    borderRadius: 18, borderWidth: 1.5, gap: 4,
    minHeight: 85,
  },
  moodEmoji: { fontSize: 24 },
  moodLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  moodDesc:  { fontSize: 9, textAlign: 'center', lineHeight: 13, paddingHorizontal: 2 },

  // Energy
  energyMeter: {
    flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 8,
  },
  energySeg: { height: 12, minWidth: 4, borderRadius: 3 },
  energyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12,
  },

  // Reflection
  reflCard: {
    borderRadius: 18, borderWidth: 1, padding: 16,
  },
  reflInput: {
    fontSize: 15, lineHeight: 24, minHeight: 100, textAlignVertical: 'top',
    borderRadius: 12, borderWidth: 1.5, padding: 12,
  },
  reflInputShort: {
    fontSize: 15, lineHeight: 24, minHeight: 44, textAlignVertical: 'top',
    borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10,
  },

  // Focus
  focusCard: {
    alignItems: 'center', paddingVertical: 20, paddingHorizontal: 12,
    borderRadius: 18, gap: 2,
  },
  focusCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },

  // Completion
  completionCheck: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: ACCENT, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },

  // Navigation
  navBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 14, borderRadius: 16, borderWidth: 1,
  },

  // Footer
  footer: {
    position: 'absolute', left: PAD, right: PAD, paddingVertical: 8,
  },
  nextBtn: {
    paddingVertical: 17, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
  },
  nextBtnText: {
    fontSize: 16, fontWeight: '800', color: '#1A1000', letterSpacing: 0.3,
  },
});
