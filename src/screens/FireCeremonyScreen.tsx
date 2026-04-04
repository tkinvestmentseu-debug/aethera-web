// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '../core/utils/localeFormat';
import {
  KeyboardAvoidingView, Keyboard, Platform, Pressable, ScrollView,
  StyleSheet, View, Dimensions, Text, TextInput, Alert, Modal, FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, Path, G, Ellipse, Defs, RadialGradient as SvgRadialGradient,
  Stop, Line, Rect,
} from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing, cancelAnimation,
  interpolate, useAnimatedProps,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Flame, Wind, Sparkles, ArrowRight,
  ChevronDown, ChevronUp, Clock, Check, Wand2, BookOpen,
  X, Plus,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#DC2626';
const ACCENT_LIGHT = '#FCA5A5';
const ACCENT_ORANGE = '#FF6B00';
const ACCENT_DARK = '#7F1D1D';

// ── SPARK DATA ──────────────────────────────────────────────────
const SPARKS = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  x: 80 + (i * 23 + 17) % 100,
  delay: (i * 400) % 3200,
  size: 1.5 + (i % 3) * 0.8,
  drift: ((i % 5) - 2) * 18,
}));

// ── ANIMATED FIRE SVG ────────────────────────────────────────────
const AnimatedFire3D = () => {
  const tiltX = useSharedValue(-6);
  const tiltY = useSharedValue(0);
  const pulse1 = useSharedValue(1.0);
  const pulse2 = useSharedValue(0.94);
  const pulse3 = useSharedValue(1.0);
  const flicker = useSharedValue(1.0);
  const glowOpacity = useSharedValue(0.5);
  const sparkY1 = useSharedValue(0);
  const sparkY2 = useSharedValue(0);
  const sparkY3 = useSharedValue(0);

  useEffect(() => {
    pulse1.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.96, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    );
    pulse2.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.90, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    );
    pulse3.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.88, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      ), -1, false,
    );
    flicker.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 120 }),
        withTiming(1.0, { duration: 180 }),
        withTiming(0.92, { duration: 90 }),
        withTiming(1.0, { duration: 220 }),
      ), -1, false,
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1400 }),
        withTiming(0.4, { duration: 1600 }),
      ), -1, false,
    );
    sparkY1.value = withRepeat(withTiming(-120, { duration: 1800, easing: Easing.out(Easing.cubic) }), -1, false);
    sparkY2.value = withRepeat(withTiming(-110, { duration: 2200, easing: Easing.out(Easing.cubic) }), -1, false);
    sparkY3.value = withRepeat(withTiming(-130, { duration: 1500, easing: Easing.out(Easing.cubic) }), -1, false);
    return () => {
      cancelAnimation(pulse1); cancelAnimation(pulse2); cancelAnimation(pulse3);
      cancelAnimation(flicker); cancelAnimation(glowOpacity);
      cancelAnimation(sparkY1); cancelAnimation(sparkY2); cancelAnimation(sparkY3);
    };
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-25, Math.min(25, -6 + e.translationY * 0.14));
      tiltY.value = Math.max(-25, Math.min(25, e.translationX * 0.14));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-6, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: flicker.value },
    ],
  }));
  const flame1Style = useAnimatedStyle(() => ({ transform: [{ scaleY: pulse1.value }, { scaleX: pulse2.value * 0.5 + 0.5 }] }));
  const flame2Style = useAnimatedStyle(() => ({ transform: [{ scaleY: pulse2.value }, { scaleX: pulse3.value * 0.4 + 0.6 }] }));
  const flame3Style = useAnimatedStyle(() => ({ transform: [{ scaleY: pulse3.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: 220, height: 260, alignItems: 'center', justifyContent: 'flex-end' }, outerStyle]}>
          {/* Glow halo */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10 }, glowStyle]}>
            <Svg width={220} height={260} viewBox="-110 -130 220 260">
              <Defs>
                <SvgRadialGradient id="glow" cx="50%" cy="100%" r="60%" fx="50%" fy="100%">
                  <Stop offset="0%" stopColor={ACCENT_ORANGE} stopOpacity={0.5} />
                  <Stop offset="50%" stopColor={ACCENT} stopOpacity={0.25} />
                  <Stop offset="100%" stopColor={ACCENT_DARK} stopOpacity={0} />
                </SvgRadialGradient>
                <SvgRadialGradient id="ember" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#FFF7ED" stopOpacity={0.9} />
                  <Stop offset="40%" stopColor="#FED7AA" stopOpacity={0.7} />
                  <Stop offset="100%" stopColor={ACCENT_ORANGE} stopOpacity={0} />
                </SvgRadialGradient>
              </Defs>
              <Ellipse cx={0} cy={80} rx={85} ry={28} fill="url(#glow)" />
              <Ellipse cx={0} cy={82} rx={44} ry={12} fill="url(#ember)" />
            </Svg>
          </Animated.View>

          {/* Outer flame */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-end' }, flame1Style]}>
            <Svg width={220} height={260} viewBox="-110 -130 220 260">
              <Defs>
                <SvgRadialGradient id="flameOuter" cx="50%" cy="80%" r="70%">
                  <Stop offset="0%" stopColor={ACCENT_ORANGE} stopOpacity={0.9} />
                  <Stop offset="50%" stopColor={ACCENT} stopOpacity={0.7} />
                  <Stop offset="100%" stopColor={ACCENT_DARK} stopOpacity={0} />
                </SvgRadialGradient>
              </Defs>
              <Path
                d="M 0,80 C -55,60 -70,20 -45,-20 C -30,-50 -18,-90 0,-125 C 18,-90 30,-50 45,-20 C 70,20 55,60 0,80 Z"
                fill="url(#flameOuter)"
                opacity={0.7}
              />
            </Svg>
          </Animated.View>

          {/* Mid flame */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-end' }, flame2Style]}>
            <Svg width={220} height={260} viewBox="-110 -130 220 260">
              <Defs>
                <SvgRadialGradient id="flameMid" cx="50%" cy="75%" r="65%">
                  <Stop offset="0%" stopColor="#FED7AA" stopOpacity={1.0} />
                  <Stop offset="40%" stopColor={ACCENT_ORANGE} stopOpacity={0.9} />
                  <Stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </SvgRadialGradient>
              </Defs>
              <Path
                d="M 0,80 C -38,55 -48,10 -28,-35 C -18,-65 -8,-95 0,-118 C 8,-95 18,-65 28,-35 C 48,10 38,55 0,80 Z"
                fill="url(#flameMid)"
                opacity={0.85}
              />
            </Svg>
          </Animated.View>

          {/* Inner core flame */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-end' }, flame3Style]}>
            <Svg width={220} height={260} viewBox="-110 -130 220 260">
              <Defs>
                <SvgRadialGradient id="flameCore" cx="50%" cy="70%" r="60%">
                  <Stop offset="0%" stopColor="#FFFBEB" stopOpacity={1.0} />
                  <Stop offset="30%" stopColor="#FEF3C7" stopOpacity={0.95} />
                  <Stop offset="70%" stopColor="#FDE68A" stopOpacity={0.7} />
                  <Stop offset="100%" stopColor={ACCENT_ORANGE} stopOpacity={0} />
                </SvgRadialGradient>
              </Defs>
              <Path
                d="M 0,75 C -20,50 -26,15 -12,-25 C -6,-55 -2,-80 0,-105 C 2,-80 6,-55 12,-25 C 26,15 20,50 0,75 Z"
                fill="url(#flameCore)"
                opacity={0.95}
              />
            </Svg>
          </Animated.View>

          {/* Sparks */}
          {SPARKS.slice(0, 8).map((sp, i) => (
            <SparkDot key={sp.id} spark={sp} index={i} />
          ))}

          {/* Ember base */}
          <Svg width={220} height={30} viewBox="-110 -15 220 30" style={{ position: 'absolute', bottom: 8 }}>
            <Ellipse cx={0} cy={0} rx={38} ry={10} fill={ACCENT_ORANGE} opacity={0.6} />
            <Ellipse cx={0} cy={0} rx={22} ry={6} fill="#FEF3C7" opacity={0.8} />
            <Ellipse cx={0} cy={0} rx={10} ry={3} fill="#FFFBEB" opacity={0.9} />
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const SparkDot = ({ spark, index }: { spark: any; index: number }) => {
  const y = useSharedValue(0);
  const opacity = useSharedValue(0.9);
  const x = useSharedValue(0);

  useEffect(() => {
    const startDelay = spark.delay;
    const timer = setTimeout(() => {
      y.value = withRepeat(withTiming(-(80 + index * 10), { duration: 1400 + index * 200, easing: Easing.out(Easing.quad) }), -1, false);
      opacity.value = withRepeat(
        withSequence(withTiming(0.9, { duration: 200 }), withTiming(0, { duration: 1200 })),
        -1, false,
      );
      x.value = withRepeat(
        withSequence(
          withTiming(spark.drift, { duration: 700 }),
          withTiming(-spark.drift * 0.4, { duration: 700 }),
        ), -1, true,
      );
    }, startDelay);
    return () => { clearTimeout(timer); cancelAnimation(y); cancelAnimation(opacity); cancelAnimation(x); };
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { translateX: x.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        bottom: 30 + (index % 4) * 8,
        left: 90 + (index * 7 + 3) % 42,
        width: spark.size * 2,
        height: spark.size * 2,
        borderRadius: spark.size,
        backgroundColor: index % 3 === 0 ? '#FEF3C7' : (index % 3 === 1 ? ACCENT_ORANGE : ACCENT_LIGHT),
      }, style]}
    />
  );
};

// ── FIRE BACKGROUND ──────────────────────────────────────────────
const FireBg = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={['#0A0605', '#150905', '#1E0C08', '#200D08']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={500} style={StyleSheet.absoluteFill} opacity={0.18}>
      <G>
        {[0, 1, 2, 3].map(i => (
          <Ellipse key={i} cx={SW * (0.15 + i * 0.24)} cy={280 + i * 35}
            rx={70 + i * 25} ry={40 + i * 18}
            fill={ACCENT_ORANGE} opacity={0.04 + i * 0.012} />
        ))}
        {Array.from({ length: 22 }, (_, i) => (
          <Circle key={'e' + i} cx={(i * 143 + 31) % SW} cy={(i * 97 + 20) % 480}
            r={i % 5 === 0 ? 1.5 : 0.6}
            fill={i % 3 === 0 ? '#FCA5A5' : ACCENT_ORANGE}
            opacity={0.15} />
        ))}
        <Path
          d={`M${SW / 2 - 40} 340 Q${SW / 2} 280 ${SW / 2 + 40} 340 L${SW / 2 + 30} 420 Q${SW / 2} 440 ${SW / 2 - 30} 420 Z`}
          stroke={ACCENT} strokeWidth={0.7} fill="none" opacity={0.15}
        />
      </G>
    </Svg>
  </View>
);

// ── DATA ─────────────────────────────────────────────────────────
const QUICK_INTENTIONS = [
  { label: 'Strach', emoji: '😨' },
  { label: 'Blokada', emoji: '🔒' },
  { label: 'Zły nawyk', emoji: '🔄' },
  { label: 'Stara rola', emoji: '🎭' },
  { label: 'Ból', emoji: '💔' },
  { label: 'Relacja', emoji: '🌿' },
];

const RITUAL_STEPS = [
  {
    id: 'step1',
    icon: '🕯️',
    title: 'Przygotowanie przestrzeni',
    short: 'Ustaw świecę lub ognisko, stwórz krąg ochronny.',
    desc: 'Znajdź spokojne miejsce. Zapal świecę lub ogień. Wyobraź sobie złoty krąg ochronny wokół siebie — żaden cień nie może przekroczyć tej granicy. Weź kilka głębokich oddechów i poczuj, jak przestrzeń staje się sacrum. Możesz powiedzieć: "Ta przestrzeń jest bezpieczna i święta."',
  },
  {
    id: 'step2',
    icon: '🌬️',
    title: 'Wejście w intencję',
    short: '3 głębokie oddechy, wizualizacja tego co chcesz przemienić.',
    desc: 'Zamknij oczy. Weź trzy powolne, głębokie oddechy. Przy każdym wydechu odpuszczaj napięcie. Wyobraź sobie to, co chcesz przemienić — pozwól mu przybrać kształt, kolor, może ciężar lub teksturę. Nie oceniaj — tylko obserwuj. Powiedz cicho: "Jestem gotów/gotowa do przemiany."',
  },
  {
    id: 'step3',
    icon: '🗣️',
    title: 'Wypowiedzenie słów mocy',
    short: 'Przeczytaj na głos słowa transformacji.',
    desc: 'Powiedz na głos (lub szeptem, jeśli wolisz):\n"Przynoszę do ognia to, co mnie ciąży.\nPrzynoszę mój strach, moją blokadę, mój ból.\nOgień nie niszczy — ogień przekształca.\nCo wchodzi jako ciemność, wychodzi jako światło.\nJestem gotowy/gotowa na przemianę."',
  },
  {
    id: 'step4',
    icon: '🔥',
    title: 'Wizualizacja płomienia',
    short: 'Animowany ogień pochłania to co pragniesz przemienić.',
    desc: 'Wróć do ognia na ekranie. Wyobraź sobie, że to czego się chcesz pozbyć — przyjmuje formę kartki papieru w Twoich rękach. Pisz mentalnie na tej kartce wszystko, co chcesz puścić. Widzisz jak ogień sięga ku kartce... Poczuj ciepło. Obserwuj jak płomień pochłania każde słowo, każde wspomnienie, każdy ciężar. Dym unosi się ku górze i znika.',
  },
  {
    id: 'step5',
    icon: '💨',
    title: 'Symboliczne spalenie',
    short: 'Puść intencję — ogień pochłania Twój ból.',
    desc: 'W tym momencie wyobraź sobie, że trzymasz w dłoniach wszystko, czego chcesz się pozbyć — skondensowane w jedną iskrę. Dmuchnij lekko na ekran (lub w stronę ognia). Poczuj jak ta iskra wchodzi w płomień i rozpuszcza się w ciepłym, złotym świetle. Co było ciężarem, staje się energią. Co było bólem, staje się siłą.',
  },
  {
    id: 'step6',
    icon: '🙏',
    title: 'Domknięcie i wdzięczność',
    short: 'Podziękowanie, zamknięcie rytuału.',
    desc: 'Połóż dłonie na sercu. Poczuj ciepło swoich rąk. Powiedz: "Dziękuję ogniowi za przemianę. Dziękuję sobie za odwagę. Przyjmuję to, co nowe, z otwartym sercem." Weź jeden głęboki oddech. Wyobraź sobie, że krąg ochronny powoli rozprasza się w złote, łagodne światło, które otacza Cię jak płaszcz. Ceremonia jest zakończona.',
  },
];

const POWER_WORDS = [
  'Jestem ogień — przekształcam wszystko, czego dotknę.',
  'Z każdym oddechem palę to, co mnie ogranicza. Z każdym wydechem rodzę się na nowo.',
  'Ogień we mnie jest starszy od strachu. Moja esencja jest niezniszczalna.',
  'Puszczam w płomień to, co mi nie służy. Zatrzymuję to, co jest moim darem.',
  'Jestem po drugiej stronie przemiany. To co boli, już staje się siłą.',
];

// ── MAIN SCREEN ───────────────────────────────────────────────────
export const FireCeremonyScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { themeName } = useAppStore();
  const theme = getResolvedTheme(themeName);
  const { t } = useTranslation();

  const [intention, setIntention] = useState('');
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [ceremonies, setCeremonies] = useState<{ id: string; date: string; intention: string }[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [oracleInput, setOracleInput] = useState('');
  const [oracleResponse, setOracleResponse] = useState('');
  const [oracleLoading, setOracleLoading] = useState(false);
  const [oracleHistory, setOracleHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [ceremonyActive, setCeremonyActive] = useState(false);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const ceremonyStepper = useSharedValue(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const toggleStep = (id: string) => {
    HapticsService.selection();
    setExpandedStep(prev => prev === id ? null : id);
  };

  const addQuickIntention = (label: string) => {
    HapticsService.selection();
    setIntention(prev => prev ? prev + ', ' + label.toLowerCase() : label.toLowerCase());
  };

  const startCeremony = () => {
    if (!intention.trim()) {
      Alert.alert('Brakuje intencji', 'Wpisz czego dotyczy Twoja ceremonia ognia.');
      return;
    }
    HapticsService.impact('medium');
    setActiveStepIdx(0);
    setCeremonyActive(true);
  };

  const nextCeremonyStep = () => {
    HapticsService.selection();
    if (activeStepIdx < RITUAL_STEPS.length - 1) {
      setActiveStepIdx(prev => prev + 1);
    } else {
      completeCeremony();
    }
  };

  const completeCeremony = () => {
    HapticsService.notify();
    const newEntry = {
      id: Date.now().toString(),
      date: formatLocaleDate(new Date()),
      intention: intention.trim(),
    };
    setCeremonies(prev => [newEntry, ...prev]);
    setCeremonyActive(false);
    setIntention('');
    Alert.alert('✦ Ceremonia zakończona', 'Ogień przyjął Twoją intencję. Przemiana się dokonała.');
  };

  const askOracle = async () => {
    if (!oracleInput.trim()) return;
    HapticsService.selection();
    const userMsg = oracleInput.trim();
    setOracleInput('');
    setOracleLoading(true);
    const newHistory = [...oracleHistory, { role: 'user' as const, content: userMsg }];
    setOracleHistory(newHistory);
    try {
      const reply = await AiService.chatWithOracle(newHistory, {
        mode: 'fire_ceremony',
        instruction: 'Jesteś duchowym przewodnikiem ceremonii ognia. Odpowiadaj w języku użytkownika, używając symboliki ognia, przemiany i oczyszczenia. Bądź konkretny, głęboki i wspierający.',
        language: 'pl',
      });
      setOracleResponse(reply);
      setOracleHistory([...newHistory, { role: 'assistant', content: reply }]);
    } catch {
      setOracleResponse('Ogień milczy. Spróbuj jeszcze raz.');
    } finally {
      setOracleLoading(false);
    }
  };

  const toggleFavorite = () => {
    HapticsService.selection();
    setIsFavorite(f => !f);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0605' }}>
      <FireBg />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={styles.backBtn}>
            <ChevronLeft color={ACCENT_LIGHT} size={22} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Typography variant="microLabel" style={{ color: ACCENT, letterSpacing: 3, fontSize: 11 }}>
              {t('fireCeremony.eyebrow').toUpperCase()}
            </Typography>
            <Typography variant="heading" style={{ color: '#FEF2F2', fontSize: 18, letterSpacing: 2 }}>
              {t('fireCeremony.title').toUpperCase()}
            </Typography>
          </View>
          <Pressable onPress={toggleFavorite} style={styles.backBtn}>
            <Star color={isFavorite ? '#FDE68A' : ACCENT_LIGHT} size={20} fill={isFavorite ? '#FDE68A' : 'none'} />
          </Pressable>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Hero Fire */}
            <Animated.View entering={FadeInDown.delay(100).duration(700)}>
              <View style={{ paddingHorizontal: layout.padding.screen }}>
                <AnimatedFire3D />
                <View style={styles.heroLabel}>
                  <Flame color={ACCENT} size={14} />
                  <Text style={styles.heroSubtext}>Dotknij ognia, by go pochylić</Text>
                </View>
              </View>
            </Animated.View>

            {/* Intention Section */}
            <Animated.View entering={FadeInDown.delay(200).duration(700)}>
              <View style={[styles.section, { marginHorizontal: layout.padding.screen }]}>
                <View style={styles.sectionHeader}>
                  <Flame color={ACCENT} size={15} />
                  <Typography variant="microLabel" style={styles.sectionTitle}>
                    INTENCJA CEREMONII
                  </Typography>
                </View>
                <TextInput
                  style={styles.intentionInput}
                  value={intention}
                  onChangeText={setIntention}
                  placeholder="Co chcesz przemienić przez ogień?"
                  placeholderTextColor="rgba(252,165,165,0.4)"
                  multiline
                  numberOfLines={3}
                />
                <View style={styles.quickChips}>
                  {QUICK_INTENTIONS.map(qi => (
                    <Pressable
                      key={qi.label}
                      onPress={() => addQuickIntention(qi.label)}
                      style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Text style={styles.chipEmoji}>{qi.emoji}</Text>
                      <Text style={styles.chipText}>{qi.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* Ritual Steps */}
            <Animated.View entering={FadeInDown.delay(300).duration(700)}>
              <View style={{ marginHorizontal: layout.padding.screen, marginBottom: 4 }}>
                <View style={styles.sectionHeader}>
                  <BookOpen color={ACCENT} size={15} />
                  <Typography variant="microLabel" style={styles.sectionTitle}>
                    RYTUAŁ KROK PO KROKU
                  </Typography>
                </View>
              </View>
              {RITUAL_STEPS.map((step, idx) => (
                <Animated.View key={step.id} entering={FadeInDown.delay(360 + idx * 60).duration(500)}>
                  <Pressable
                    onPress={() => toggleStep(step.id)}
                    style={({ pressed }) => [styles.stepCard, {
                      marginHorizontal: layout.padding.screen,
                      opacity: pressed ? 0.85 : 1,
                    }]}
                  >
                    <View style={styles.stepTop}>
                      <View style={styles.stepNum}>
                        <Text style={styles.stepNumText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.stepIcon}>{step.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <Text style={styles.stepShort}>{step.short}</Text>
                      </View>
                      {expandedStep === step.id
                        ? <ChevronUp color={ACCENT} size={16} />
                        : <ChevronDown color="rgba(252,165,165,0.5)" size={16} />}
                    </View>
                    {expandedStep === step.id && (
                      <View style={styles.stepDesc}>
                        <Text style={styles.stepDescText}>{step.desc}</Text>
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </Animated.View>

            {/* Power Words */}
            <Animated.View entering={FadeInDown.delay(500).duration(700)}>
              <View style={{ marginHorizontal: layout.padding.screen, marginTop: 20 }}>
                <View style={styles.sectionHeader}>
                  <Sparkles color={ACCENT_ORANGE} size={15} />
                  <Typography variant="microLabel" style={styles.sectionTitle}>
                    SŁOWA MOCY
                  </Typography>
                </View>
                {POWER_WORDS.map((pw, i) => (
                  <View key={i} style={styles.powerCard}>
                    <View style={[styles.powerDot, { backgroundColor: i % 2 === 0 ? ACCENT : ACCENT_ORANGE }]} />
                    <Text style={styles.powerText}>{pw}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Ceremony History */}
            {ceremonies.length > 0 && (
              <Animated.View entering={FadeInDown.delay(550).duration(700)}>
                <View style={{ marginHorizontal: layout.padding.screen, marginTop: 20 }}>
                  <View style={styles.sectionHeader}>
                    <Clock color={ACCENT} size={15} />
                    <Typography variant="microLabel" style={styles.sectionTitle}>
                      MUZEUM CEREMONII
                    </Typography>
                  </View>
                  {ceremonies.map(c => (
                    <View key={c.id} style={styles.histCard}>
                      <Text style={styles.histDate}>{c.date}</Text>
                      <Text style={styles.histIntention}>{c.intention}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Oracle */}
            <Animated.View entering={FadeInDown.delay(600).duration(700)}>
              <View style={{ marginHorizontal: layout.padding.screen, marginTop: 20 }}>
                <View style={styles.sectionHeader}>
                  <Wand2 color={ACCENT_ORANGE} size={15} />
                  <Typography variant="microLabel" style={styles.sectionTitle}>
                    WYROCZNIA OGNIA
                  </Typography>
                </View>
                <View style={styles.oracleCard}>
                  <Text style={styles.oracleHint}>Zapytaj o swoją przemianę</Text>
                  <View style={styles.oracleInputRow}>
                    <TextInput
                      style={styles.oracleInput}
                      value={oracleInput}
                      onChangeText={setOracleInput}
                      placeholder="Twoje pytanie do ognia..."
                      placeholderTextColor="rgba(252,165,165,0.35)"
                      multiline
                    />
                    <Pressable
                      onPress={askOracle}
                      disabled={oracleLoading || !oracleInput.trim()}
                      style={({ pressed }) => [styles.oracleSend, { opacity: pressed || oracleLoading ? 0.6 : 1 }]}
                    >
                      <Flame color="#fff" size={16} />
                    </Pressable>
                  </View>
                  {oracleLoading && (
                    <Text style={styles.oracleLoading}>Ogień przemawia...</Text>
                  )}
                  {!!oracleResponse && !oracleLoading && (
                    <View style={styles.oracleReply}>
                      <Text style={styles.oracleReplyText}>{oracleResponse}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>

            <EndOfContentSpacer />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Start Ceremony CTA */}
        <View style={[
          styles.ctaBar,
          {
            bottom: keyboardHeight > 0 ? keyboardHeight + 8 : insets.bottom + 16,
            position: 'absolute',
          },
        ]}>
          <Pressable
            onPress={startCeremony}
            style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <LinearGradient
              colors={['#DC2626', '#B91C1C', '#7F1D1D']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Flame color="#fff" size={18} />
              <Text style={styles.ctaText}>ROZPOCZNIJ CEREMONIĘ</Text>
              <ArrowRight color="#fff" size={16} />
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Ceremony Full-Screen Modal */}
      <Modal visible={ceremonyActive} animationType="fade" transparent={false}>
        <LinearGradient colors={['#0A0605', '#1E0C08', '#0A0605']} style={{ flex: 1 }}>
          <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <View style={styles.ceremonyHeader}>
              <Pressable onPress={() => setCeremonyActive(false)} style={styles.backBtn}>
                <X color={ACCENT_LIGHT} size={22} />
              </Pressable>
              <Text style={styles.ceremonyTitle}>CEREMONIA OGNIA</Text>
              <Text style={styles.ceremonyCounter}>{activeStepIdx + 1} / {RITUAL_STEPS.length}</Text>
            </View>

            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }}>
              <AnimatedFire3D />
              <View style={styles.ceremonyStepCard}>
                <Text style={styles.ceremonyStepIcon}>{RITUAL_STEPS[activeStepIdx].icon}</Text>
                <Text style={styles.ceremonyStepTitle}>{RITUAL_STEPS[activeStepIdx].title}</Text>
                <Text style={styles.ceremonyStepDesc}>{RITUAL_STEPS[activeStepIdx].desc}</Text>
              </View>
            </View>

            <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
              <Pressable
                onPress={nextCeremonyStep}
                style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.8 : 1 }]}
              >
                <LinearGradient
                  colors={['#DC2626', '#B91C1C', '#7F1D1D']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.ctaGradient}
                >
                  {activeStepIdx < RITUAL_STEPS.length - 1
                    ? <><Text style={styles.ctaText}>NASTĘPNY KROK</Text><ArrowRight color="#fff" size={16} /></>
                    : <><Check color="#fff" size={18} /><Text style={styles.ctaText}>ZAKOŃCZ CEREMONIĘ</Text></>}
                </LinearGradient>
              </Pressable>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(220,38,38,0.2)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(220,38,38,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  heroSubtext: {
    color: 'rgba(252,165,165,0.55)',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 8,
    backgroundColor: 'rgba(127,29,29,0.14)',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(220,38,38,0.18)',
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  sectionTitle: {
    color: ACCENT,
    letterSpacing: 2,
    fontSize: 10,
  },
  intentionInput: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(220,38,38,0.25)',
    borderRadius: 12,
    padding: 14,
    color: '#FEF2F2',
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  quickChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(220,38,38,0.13)',
    borderWidth: 0.5,
    borderColor: 'rgba(220,38,38,0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipEmoji: { fontSize: 13 },
  chipText: { color: ACCENT_LIGHT, fontSize: 12 },
  stepCard: {
    backgroundColor: 'rgba(127,29,29,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(220,38,38,0.15)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  stepTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(220,38,38,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: ACCENT_LIGHT, fontSize: 11, fontWeight: '600' },
  stepIcon: { fontSize: 18 },
  stepTitle: { color: '#FEF2F2', fontSize: 13.5, fontWeight: '600', marginBottom: 2 },
  stepShort: { color: 'rgba(252,165,165,0.6)', fontSize: 11.5 },
  stepDesc: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(220,38,38,0.15)',
  },
  stepDescText: { color: 'rgba(254,226,226,0.82)', fontSize: 13, lineHeight: 22 },
  powerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(127,29,29,0.12)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(220,38,38,0.12)',
  },
  powerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  powerText: { color: 'rgba(254,226,226,0.85)', fontSize: 13.5, lineHeight: 22, flex: 1, fontStyle: 'italic' },
  histCard: {
    backgroundColor: 'rgba(127,29,29,0.10)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(220,38,38,0.12)',
  },
  histDate: { color: ACCENT, fontSize: 10, letterSpacing: 1, marginBottom: 4 },
  histIntention: { color: 'rgba(254,226,226,0.75)', fontSize: 13 },
  oracleCard: {
    backgroundColor: 'rgba(127,29,29,0.14)',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(220,38,38,0.2)',
    padding: 16,
  },
  oracleHint: { color: 'rgba(252,165,165,0.55)', fontSize: 12, marginBottom: 10 },
  oracleInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  oracleInput: {
    flex: 1,
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(220,38,38,0.22)',
    padding: 12,
    color: '#FEF2F2',
    fontSize: 13,
    minHeight: 48,
    maxHeight: 110,
    textAlignVertical: 'top',
  },
  oracleSend: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oracleLoading: { color: 'rgba(252,165,165,0.5)', fontSize: 12, marginTop: 10, textAlign: 'center' },
  oracleReply: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(220,38,38,0.15)',
  },
  oracleReplyText: { color: 'rgba(254,226,226,0.88)', fontSize: 13.5, lineHeight: 24 },
  ctaBar: {
    left: layout.padding.screen,
    right: layout.padding.screen,
  },
  ctaBtn: { borderRadius: 16, overflow: 'hidden' },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  ctaText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1.5 },
  ceremonyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ceremonyTitle: { color: ACCENT_LIGHT, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  ceremonyCounter: { color: 'rgba(252,165,165,0.6)', fontSize: 12, width: 38, textAlign: 'right' },
  ceremonyStepCard: {
    backgroundColor: 'rgba(127,29,29,0.18)',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(220,38,38,0.2)',
    padding: 24,
    marginTop: 16,
    alignItems: 'center',
  },
  ceremonyStepIcon: { fontSize: 36, marginBottom: 12 },
  ceremonyStepTitle: { color: '#FEF2F2', fontSize: 18, fontWeight: '700', marginBottom: 14, textAlign: 'center' },
  ceremonyStepDesc: { color: 'rgba(254,226,226,0.82)', fontSize: 14, lineHeight: 24, textAlign: 'center' },
});
