// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  Pressable, ScrollView, StyleSheet, View, Dimensions, Text,
  TextInput, Alert, Modal, Keyboard, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle as SvgCircle, Ellipse, Path, G, Defs, RadialGradient as SvgRadialGradient,
  Stop, Line,
} from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing, cancelAnimation,
  interpolate, useAnimatedProps,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Moon, Eye, Clock, Brain, Sparkles, Zap,
  BookOpen, CheckSquare, Square, ChevronDown, ChevronUp, Hand,
  Wind, Layers, Target, TrendingUp,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AudioService } from '../core/services/audio.service';
import { AiService } from '../core/services/ai.service';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#7C3AED';
const ACCENT_LIGHT = '#DDD6FE';
const ACCENT_DARK = '#4C1D95';

// ── Animated SVG circle for portal ─────────────────────────────
const AnimSvgCircle = Animated.createAnimatedComponent(SvgCircle);

// ── DREAM PORTAL 3D ───────────────────────────────────────────────────────────
const PORTAL_STARS = Array.from({ length: 24 }, (_, i) => ({
  cx: (Math.cos((i / 24) * Math.PI * 2) * (70 + (i % 3) * 15)).toFixed(1),
  cy: (Math.sin((i / 24) * Math.PI * 2) * (70 + (i % 3) * 15)).toFixed(1),
  r: (0.6 + (i % 4) * 0.3).toFixed(1),
  op: (0.2 + (i % 5) * 0.08).toFixed(2),
}));

const DreamPortal3D = () => {
  const rot1   = useSharedValue(0);
  const rot2   = useSharedValue(360);
  const rot3   = useSharedValue(0);
  const pulse  = useSharedValue(0.92);
  const tiltX  = useSharedValue(-10);
  const tiltY  = useSharedValue(0);
  const glow   = useSharedValue(0);

  useEffect(() => {
    rot1.value  = withRepeat(withTiming(360,  { duration: 18000, easing: Easing.linear }), -1, false);
    rot2.value  = withRepeat(withTiming(0,    { duration: 12000, easing: Easing.linear }), -1, false);
    rot3.value  = withRepeat(withTiming(360,  { duration: 28000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withSequence(
      withTiming(1.06, { duration: 2800, easing: Easing.inOut(Easing.sine) }),
      withTiming(0.92, { duration: 2800, easing: Easing.inOut(Easing.sine) }),
    ), -1, false);
    glow.value  = withRepeat(withSequence(
      withTiming(1, { duration: 2000 }),
      withTiming(0, { duration: 2000 }),
    ), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-20, Math.min(20, -10 + e.translationY * 0.14));
      tiltY.value = Math.max(-20, Math.min(20, e.translationX * 0.14));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-10, { duration: 900, easing: Easing.out(Easing.cubic) });
      tiltY.value = withTiming(0,   { duration: 900, easing: Easing.out(Easing.cubic) });
    });

  const outerStyle  = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: pulse.value },
    ],
  }));
  const ring1Style  = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot1.value}deg` }] }));
  const ring2Style  = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot2.value}deg` }] }));
  const ring3Style  = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot3.value}deg` }] }));

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: 230, height: 230, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>
          {/* Static base layer */}
          <Svg width={230} height={230} viewBox="-115 -115 230 230" style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgRadialGradient id="portalCore" cx="50%" cy="50%" r="50%">
                <Stop offset="0%"   stopColor="#A78BFA" stopOpacity="0.9" />
                <Stop offset="40%"  stopColor="#7C3AED" stopOpacity="0.5" />
                <Stop offset="100%" stopColor="#1E0845" stopOpacity="0.0" />
              </SvgRadialGradient>
              <SvgRadialGradient id="portalOuter" cx="50%" cy="50%" r="50%">
                <Stop offset="0%"   stopColor="#4C1D95" stopOpacity="0.0" />
                <Stop offset="70%"  stopColor="#6D28D9" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#4C1D95" stopOpacity="0.5" />
              </SvgRadialGradient>
            </Defs>
            {/* Deep background circle */}
            <SvgCircle r={105} fill="#06030F" opacity={0.7} />
            {/* Portal outer glow */}
            <SvgCircle r={105} fill="url(#portalOuter)" />
            {/* Stars */}
            {PORTAL_STARS.map((s, i) => (
              <SvgCircle key={`ps${i}`} cx={s.cx} cy={s.cy} r={s.r} fill="#DDD6FE" opacity={s.op} />
            ))}
            {/* Portal core glow */}
            <SvgCircle r={52} fill="url(#portalCore)" />
            {/* Inner eye / iris */}
            <Ellipse cx={0} cy={0} rx={26} ry={18} fill="#3B0764" stroke="#A78BFA" strokeWidth={1.5} opacity={0.9} />
            <SvgCircle r={10} fill="#7C3AED" opacity={0.85} />
            <SvgCircle r={4}  fill="#1E0845" />
            {/* Specular dot */}
            <SvgCircle cx={-4} cy={-3} r={1.8} fill="#EDE9FE" opacity={0.8} />
          </Svg>

          {/* Ring 1 — slow, dashed outer */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring1Style]}>
            <Svg width={230} height={230} viewBox="-115 -115 230 230">
              <SvgCircle r={100} fill="none" stroke="#7C3AED" strokeWidth={1} strokeDasharray="6 10" opacity={0.55} />
              {Array.from({ length: 10 }, (_, i) => {
                const a = (i / 10) * Math.PI * 2;
                return <SvgCircle key={`r1${i}`} cx={(100 * Math.cos(a)).toFixed(1)} cy={(100 * Math.sin(a)).toFixed(1)} r={2.5} fill="#A78BFA" opacity={0.6} />;
              })}
            </Svg>
          </Animated.View>

          {/* Ring 2 — medium counter-rotating */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring2Style]}>
            <Svg width={230} height={230} viewBox="-115 -115 230 230">
              <SvgCircle r={76} fill="none" stroke="#6D28D9" strokeWidth={1.2} strokeDasharray="3 8" opacity={0.65} />
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i / 8) * Math.PI * 2;
                return <SvgCircle key={`r2${i}`} cx={(76 * Math.cos(a)).toFixed(1)} cy={(76 * Math.sin(a)).toFixed(1)} r={3} fill="#C4B5FD" opacity={0.5} />;
              })}
            </Svg>
          </Animated.View>

          {/* Ring 3 — inner slow drift */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring3Style]}>
            <Svg width={230} height={230} viewBox="-115 -115 230 230">
              <SvgCircle r={55} fill="none" stroke="#8B5CF6" strokeWidth={1.4} strokeDasharray="2 6" opacity={0.5} />
              {Array.from({ length: 6 }, (_, i) => {
                const a = (i / 6) * Math.PI * 2;
                return (
                  <Line
                    key={`r3l${i}`}
                    x1={0} y1={0}
                    x2={(55 * Math.cos(a)).toFixed(1)} y2={(55 * Math.sin(a)).toFixed(1)}
                    stroke="#A78BFA" strokeWidth={0.7} opacity={0.3}
                  />
                );
              })}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ── DREAM BACKGROUND ─────────────────────────────────────────────────────────
const DreamBg = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={['#0D0A1A', '#120E24', '#1A1030', '#0D0A1A']} style={StyleSheet.absoluteFill} />
    <Svg width={SW} height={500} style={StyleSheet.absoluteFill} opacity={0.3}>
      <G>
        {[0, 1, 2, 3, 4].map(i => (
          <Ellipse key={`fog${i}`} cx={SW * (0.15 + i * 0.18)} cy={180 + i * 50}
            rx={90 + i * 25} ry={55 + i * 18}
            fill="#7C3AED" opacity={0.03 + i * 0.012} />
        ))}
        {Array.from({ length: 28 }, (_, i) => (
          <SvgCircle key={`bgst${i}`}
            cx={(i * 131 + 17) % SW} cy={(i * 97 + 20) % 480}
            r={i % 7 === 0 ? 1.6 : 0.65} fill="#C4B5FD" opacity={0.18} />
        ))}
        <Path d={`M${SW * 0.5} 0 L${SW * 0.5} 500`} stroke="#A78BFA" strokeWidth={0.4} opacity={0.06} />
      </G>
    </Svg>
  </View>
);

// ── DATA ──────────────────────────────────────────────────────────────────────
const TECHNIQUES = [
  {
    id: 'wild',
    label: 'WILD',
    full: 'Wake Initiated Lucid Dream',
    icon: 'brain',
    color: '#7C3AED',
    difficulty: 4,
    desc: 'Bezpośrednie przejście ze stanu czuwania do snu świadomego — ciało zasypia, umysł pozostaje aktywny.',
    steps: [
      'Połóż się w wygodnej pozycji i rozluźnij całe ciało.',
      'Skupiaj uwagę na hipnagogicznych obrazach (mroczne wizje na granicy snu).',
      'Podążaj za obrazami bez angażowania się emocjonalnie — obserwuj.',
      'Gdy poczujesz paraliż senny lub "wciągnięcie", wejdź w sen świadomie.',
    ],
  },
  {
    id: 'mild',
    label: 'MILD',
    full: 'Mnemonic Induced Lucid Dream',
    icon: 'target',
    color: '#6D28D9',
    difficulty: 2,
    desc: 'Ustaw intencję tuż przed snem — mózg "zaprogramuje" moment rozpoznania snu.',
    steps: [
      'Zaraz przed zaśnięciem powtarzaj: "Następnym razem, gdy śnię, będę wiedzieć, że śnię."',
      'Wizualizuj poprzedni sen i wyobraź sobie, że uświadamiasz sobie, że śnisz.',
      'Trzymaj tę intencję w umyśle aż do zaśnięcia.',
      'Prowadź dziennik snów — wzmacnia połączenie z pamięcią snów.',
    ],
  },
  {
    id: 'reality',
    label: 'Reality Check',
    full: 'Sprawdzanie Rzeczywistości',
    icon: 'hand',
    color: '#5B21B6',
    difficulty: 1,
    desc: 'Wielokrotnie w ciągu dnia testuj rzeczywistość — nawyk przeniesie się do snu.',
    steps: [
      'Patrz na dłonie i licz palce — we śnie ich liczba się zmienia.',
      'Spróbuj pchnąć palec przez dłoń — we śnie to działa.',
      'Czytaj tekst, odwróć wzrok i przeczytaj ponownie — we śnie zmienia się.',
      'Sprawdzaj zegar dwa razy z rzędu — czas we śnie jest niespójny.',
    ],
  },
  {
    id: 'wbtb',
    label: 'WBTB',
    full: 'Wake Back to Bed',
    icon: 'layers',
    color: '#4C1D95',
    difficulty: 3,
    desc: 'Obudź się po 5-6 godzinach snu, pobądź aktywny przez 20-30 minut i wróć do snu.',
    steps: [
      'Ustaw budzik na 5-6 godzin po zaśnięciu.',
      'Po przebudzeniu czytaj o świadomym śnieniu przez 20-30 minut.',
      'Wróć do łóżka z silną intencją snu świadomego.',
      'Połącz z techniką WILD lub MILD dla najlepszych rezultatów.',
    ],
  },
];

const REALITY_CHECKS = [
  { id: 'hands',   label: 'Dłonie',    desc: 'Policz palce obu dłoni',      emoji: '✋', color: '#7C3AED' },
  { id: 'reading', label: 'Czytanie',  desc: 'Przeczytaj tekst dwa razy',   emoji: '📖', color: '#6D28D9' },
  { id: 'clock',   label: 'Zegar',     desc: 'Sprawdź czas dwa razy',       emoji: '🕐', color: '#5B21B6' },
  { id: 'switch',  label: 'Włącznik',  desc: 'Spróbuj włączyć światło',     emoji: '💡', color: '#4C1D95' },
  { id: 'nose',    label: 'Nos',       desc: 'Zatknij nos i spróbuj oddychać', emoji: '👃', color: '#7C3AED' },
  { id: 'mirror',  label: 'Lustro',    desc: 'Czy twoje odbicie jest normalne?', emoji: '🪞', color: '#6D28D9' },
];

const ADVANCED_TECHNIQUES = [
  {
    id: 'stabilize',
    label: 'Stabilizacja Snu',
    color: '#7C3AED',
    desc: 'Gdy sen zaczyna się rozmazywać, zatrzymaj się i krzyknij "Stabilizuj!" lub dotknij powierzchni.',
    tip: 'Angażuj zmysły — wąchaj, dotykaj, obracaj się wokół własnej osi.',
  },
  {
    id: 'spinning',
    label: 'Technika Spinning',
    color: '#6D28D9',
    desc: 'Obróć się wokół własnej osi — aktywuje propriocepcję i stabilizuje lub przenosi do nowego miejsca.',
    tip: 'Obracaj się szybko jak bąk, trzymając intencję nowej scenerii.',
  },
  {
    id: 'summon',
    label: 'Wołanie Postaci',
    color: '#5B21B6',
    desc: 'Wołaj lub wyobraź sobie konkretną postać za rogiem — umysł ją wygeneruje.',
    tip: 'Zamiast szukać wzrokiem, po prostu wiedz, że postać jest "za tobą".',
  },
];

// ── SMALL COMPONENTS ─────────────────────────────────────────────────────────
const StarRating = ({ count, max = 5 }: { count: number; max?: number }) => (
  <View style={{ flexDirection: 'row', gap: 3 }}>
    {Array.from({ length: max }, (_, i) => (
      <Star key={i} size={10} color={i < count ? ACCENT_LIGHT : '#4B5563'} fill={i < count ? ACCENT_LIGHT : 'transparent'} />
    ))}
  </View>
);

const TechniqueCard = ({ item }: { item: typeof TECHNIQUES[0] }) => {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => { setOpen(v => !v); HapticsService.selection(); }}
      style={{ backgroundColor: 'rgba(124,58,237,0.08)', borderRadius: 16, borderWidth: 1, borderColor: item.color + '44', marginBottom: 12, overflow: 'hidden' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 }}>
        <LinearGradient colors={[item.color, item.color + 'AA']} style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Brain size={20} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Text style={{ color: '#EDE9FE', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>{item.label}</Text>
            <StarRating count={item.difficulty} />
          </View>
          <Text style={{ color: '#A78BFA', fontSize: 11, letterSpacing: 1.5, marginBottom: 4 }}>{item.full.toUpperCase()}</Text>
          <Text style={{ color: 'rgba(221,214,254,0.7)', fontSize: 12, lineHeight: 17 }}>{item.desc}</Text>
        </View>
        <View>
          {open ? <ChevronUp size={18} color={ACCENT_LIGHT} /> : <ChevronDown size={18} color={ACCENT_LIGHT} />}
        </View>
      </View>
      {open && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={{ height: 1, backgroundColor: item.color + '33', marginBottom: 12 }} />
          {item.steps.map((step, idx) => (
            <View key={idx} style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: item.color + '33', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: ACCENT_LIGHT, fontSize: 10, fontWeight: '700' }}>{idx + 1}</Text>
              </View>
              <Text style={{ color: 'rgba(221,214,254,0.8)', fontSize: 13, lineHeight: 19, flex: 1 }}>{step}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
};

const RealityCheckCard = ({ item }: { item: typeof REALITY_CHECKS[0] }) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pulse = () => {
    scale.value = withSequence(withTiming(0.92, { duration: 100 }), withTiming(1, { duration: 200 }));
    HapticsService.impact('light');
  };
  return (
    <Pressable onPress={pulse} style={{ width: (SW - layout.padding.screen * 2 - 10) / 2, marginBottom: 10 }}>
      <Animated.View style={[style]}>
        <LinearGradient
          colors={[item.color + '22', item.color + '11']}
          style={{ borderRadius: 14, borderWidth: 1, borderColor: item.color + '44', padding: 14, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 28, marginBottom: 6 }}>{item.emoji}</Text>
          <Text style={{ color: '#EDE9FE', fontSize: 13, fontWeight: '700', marginBottom: 3 }}>{item.label}</Text>
          <Text style={{ color: 'rgba(221,214,254,0.65)', fontSize: 11, textAlign: 'center', lineHeight: 15 }}>{item.desc}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
export const LucidDreamingScreen = ({ navigation }: any) => {
  const insets    = useSafeAreaInsets();
  const { themeName, addFavoriteItem, removeFavoriteItem, isFavoriteItem, shadowWorkSessions } = useAppStore();
  const safeShadowWorkSessions = shadowWorkSessions ?? [];
  const theme     = getResolvedTheme(themeName);
  const { t } = useTranslation();

  const [intention, setIntention]   = useState('');
  const [savedInt, setSavedInt]     = useState('');
  const [isFav, setIsFav]           = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const [dreamAiInsight, setDreamAiInsight] = useState<string>("");
  const [dreamAiLoading, setDreamAiLoading] = useState(false);

  const fetchDreamInsight = async () => {
    if (dreamAiLoading) return;
    setDreamAiLoading(true);
    HapticsService.impact("medium");
    try {
      const intText = savedInt || "brak zapisanej intencji";
      const prompt = "Uzytkownik praktykuje swiadome snienie. Intencja snu: " + intText + ". Napisz krotka (3-4 zdania) porade jak dzis wejsc w swiadomy sen, co moze napotkac i jaka afirmacje powtarzac przed zasnieciem.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setDreamAiInsight(result);
    } catch (e) {
      setDreamAiInsight("Nie udalo sie pobrac porady. Sprobuj ponownie.");
    } finally {
      setDreamAiLoading(false);
    }
  };

  useEffect(() => {
    const favId = 'lucid-dreaming';
    setIsFav(isFavoriteItem(favId));
  }, []);

  const toggleFav = () => {
    const favId = 'lucid-dreaming';
    if (isFav) {
      removeFavoriteItem(favId);
    } else {
      addFavoriteItem({ id: favId, label: 'Świadome Śnienie', icon: 'Moon', color: ACCENT, route: 'LucidDreaming', addedAt: new Date().toISOString() });
    }
    setIsFav(v => !v);
    HapticsService.impact('medium');
  };

  const saveIntention = () => {
    if (!intention.trim()) return;
    setSavedInt(intention.trim());
    setIntention('');
    Keyboard.dismiss();
    HapticsService.notify();
    Alert.alert('Intencja zapisana', 'Twoja intencja snu została ustawiona. Dobranoc!');
  };

  const lucidCount   = safeShadowWorkSessions.length; // repurposing as example stat
  const todayDate    = new Date().toLocaleDateString(getLocaleCode(), { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0D0A1A' }} edges={['top']}>
      <DreamBg />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingVertical: 12, zIndex: 10 }}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={{ padding: 8, marginRight: 4 }}>
          <ChevronLeft size={22} color={ACCENT_LIGHT} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'rgba(167,139,250,0.7)', fontSize: 10, letterSpacing: 2.5 }}>{t('lucidDreaming.eyebrow').toUpperCase()}</Text>
          <Text style={{ color: '#EDE9FE', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 }}>{t('lucidDreaming.title')}</Text>
        </View>
        <Pressable onPress={toggleFav} style={{ padding: 8 }}>
          <Star size={20} color={isFav ? '#FBBF24' : ACCENT_LIGHT} fill={isFav ? '#FBBF24' : 'transparent'} />
        </Pressable>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>
        {/* Hero 3D Portal */}
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <DreamPortal3D />
          <Text style={{ color: 'rgba(167,139,250,0.6)', fontSize: 10, letterSpacing: 3, marginTop: 4 }}>DOTKNIJ I OBRÓĆ PORTAL</Text>
        </View>

        {/* Date / context */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: 'rgba(221,214,254,0.55)', fontSize: 12, letterSpacing: 1 }}>{todayDate}</Text>
        </View>

        {/* What is lucid dreaming */}
        <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 28 }}>
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text style={{ color: ACCENT_LIGHT, fontSize: 11, letterSpacing: 2.5, marginBottom: 10 }}>CZYM JEST ŚWIADOME ŚNIENIE</Text>
            <LinearGradient
              colors={['rgba(124,58,237,0.12)', 'rgba(76,29,149,0.08)']}
              style={{ borderRadius: 18, borderWidth: 1, borderColor: ACCENT + '33', padding: 18 }}
            >
              <Text style={{ color: 'rgba(221,214,254,0.85)', fontSize: 14, lineHeight: 22 }}>
                Świadome śnienie to stan, w którym zdajesz sobie sprawę, że śnisz, pozostając wewnątrz snu.
                Możesz wtedy aktywnie eksplorować przestrzeń senną, rozwiązywać problemy, ćwiczyć umiejętności
                i przeżywać doświadczenia niemożliwe na jawie.
              </Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Techniques */}
        <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 28 }}>
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text style={{ color: ACCENT_LIGHT, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>TECHNIKI WEJŚCIA</Text>
            {TECHNIQUES.map((t) => <TechniqueCard key={t.id} item={t} />)}
          </Animated.View>
        </View>

        {/* Reality checks */}
        <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 28 }}>
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text style={{ color: ACCENT_LIGHT, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>SYGNAŁY RZECZYWISTOŚCI</Text>
            <Text style={{ color: 'rgba(221,214,254,0.6)', fontSize: 12, lineHeight: 18, marginBottom: 14 }}>
              Wykonuj te testy wielokrotnie w ciągu dnia — nawyk przeniesie się do snu.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {REALITY_CHECKS.map((rc) => <RealityCheckCard key={rc.id} item={rc} />)}
            </View>
          </Animated.View>
        </View>

        {/* Intention Journal */}
        <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 28 }}>
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Text style={{ color: ACCENT_LIGHT, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>DZIENNIK INTENCJI</Text>
            {savedInt ? (
              <LinearGradient
                colors={['rgba(124,58,237,0.15)', 'rgba(76,29,149,0.08)']}
                style={{ borderRadius: 14, borderWidth: 1, borderColor: ACCENT + '44', padding: 16, marginBottom: 12 }}
              >
                <Text style={{ color: 'rgba(167,139,250,0.7)', fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>AKTUALNA INTENCJA</Text>
                <Text style={{ color: '#EDE9FE', fontSize: 14, lineHeight: 21 }}>"{savedInt}"</Text>
              </LinearGradient>
            ) : null}
            <TextInput
              value={intention}
              onChangeText={setIntention}
              placeholder="Czego chcesz doświadczyć tej nocy we śnie?"
              placeholderTextColor="rgba(167,139,250,0.4)"
              multiline
              style={{
                backgroundColor: 'rgba(124,58,237,0.08)',
                borderRadius: 14, borderWidth: 1, borderColor: ACCENT + '44',
                color: '#EDE9FE', fontSize: 14, lineHeight: 21,
                padding: 16, minHeight: 80, textAlignVertical: 'top',
                marginBottom: 12,
              }}
            />
            <Pressable
              onPress={saveIntention}
              style={{ borderRadius: 14, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={[ACCENT, ACCENT_DARK]}
                style={{ paddingVertical: 14, alignItems: 'center', borderRadius: 14 }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 }}>USTAW INTENCJĘ SNU</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>

        {/* Progress stats */}
        <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 28 }}>
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={{ color: ACCENT_LIGHT, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>MÓJ POSTĘP</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[
                { label: 'Sesje', value: String(lucidCount), icon: <Moon size={18} color={ACCENT} /> },
                { label: 'Ten tydzień', value: '0', icon: <TrendingUp size={18} color={ACCENT} /> },
                { label: 'Najlepszy', value: '0', icon: <Sparkles size={18} color={ACCENT} /> },
              ].map((stat) => (
                <LinearGradient
                  key={stat.label}
                  colors={['rgba(124,58,237,0.12)', 'rgba(76,29,149,0.06)']}
                  style={{ flex: 1, borderRadius: 14, borderWidth: 1, borderColor: ACCENT + '33', padding: 14, alignItems: 'center' }}
                >
                  {stat.icon}
                  <Text style={{ color: '#EDE9FE', fontSize: 22, fontWeight: '800', marginTop: 6 }}>{stat.value}</Text>
                  <Text style={{ color: 'rgba(167,139,250,0.7)', fontSize: 10, letterSpacing: 1 }}>{stat.label.toUpperCase()}</Text>
                </LinearGradient>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* Advanced techniques */}
        <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 28 }}>
          <Animated.View entering={FadeInDown.delay(350).springify()}>
            <Text style={{ color: ACCENT_LIGHT, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>TECHNIKI ZAAWANSOWANE</Text>
            {ADVANCED_TECHNIQUES.map((t) => (
              <LinearGradient
                key={t.id}
                colors={[t.color + '15', t.color + '08']}
                style={{ borderRadius: 16, borderWidth: 1, borderColor: t.color + '44', padding: 16, marginBottom: 12 }}
              >
                <Text style={{ color: '#EDE9FE', fontSize: 14, fontWeight: '700', marginBottom: 6, letterSpacing: 0.3 }}>{t.label}</Text>
                <Text style={{ color: 'rgba(221,214,254,0.75)', fontSize: 13, lineHeight: 19, marginBottom: 8 }}>{t.desc}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Sparkles size={13} color={t.color} style={{ marginTop: 1 }} />
                  <Text style={{ color: 'rgba(167,139,250,0.8)', fontSize: 12, lineHeight: 17, flex: 1 }}>{t.tip}</Text>
                </View>
              </LinearGradient>
            ))}
          </Animated.View>
        </View>

        {/* AI DREAM INSIGHT */}
        <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 28 }}>
          <Animated.View entering={FadeInDown.delay(380).springify()}>
            <Text style={{ color: ACCENT_LIGHT, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>{"AI PRZEWODNIK SNOW"}</Text>
            <LinearGradient
              colors={[ACCENT + "15", ACCENT_DARK + "08"]}
              style={{ borderRadius: 18, borderWidth: 1, borderColor: ACCENT + "44", padding: 18 }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ color: ACCENT_LIGHT, fontSize: 11, fontWeight: "700", letterSpacing: 1.5 }}>{"ORACLE SNOW"}</Text>
                <Pressable onPress={fetchDreamInsight} disabled={dreamAiLoading}
                  style={{ backgroundColor: ACCENT, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}>
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                    {dreamAiLoading ? "..." : "Porada na dzis"}
                  </Text>
                </Pressable>
              </View>
              {dreamAiInsight ? (
                <Text style={{ color: "rgba(221,214,254,0.9)", fontSize: 14, lineHeight: 22, fontStyle: "italic" }}>{dreamAiInsight}</Text>
              ) : (
                <Text style={{ color: "rgba(167,139,250,0.6)", fontSize: 13, lineHeight: 20 }}>
                  {"Ustaw intencje snu powyzej, a nastepnie nacisnij Porada na dzis aby uzyskac spersonalizowany przewodnik AI."}
                </Text>
              )}
            </LinearGradient>
          </Animated.View>
        </View>

        <EndOfContentSpacer />
      </ScrollView>
    </SafeAreaView>
  );
};
