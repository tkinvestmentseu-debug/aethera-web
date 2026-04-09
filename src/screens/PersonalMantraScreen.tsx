// @ts-nocheck
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle as SvgCircle,
  Defs,
  RadialGradient as SvgRadialGradient,
  Stop,
  G,
  Path,
  Ellipse,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeInDown,
  FadeInUp,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  ChevronLeft,
  Star,
  Sparkles,
  RefreshCw,
  BookOpen,
  Bell,
  Heart,
  ArrowRight,
  NotebookPen,
  Wind,
  Check,
  RotateCcw,
  Zap,
} from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
// ─── Constants ───────────────────────────────────────────────────────────────

const ACCENT = '#F59E0B';
const REPEAT_TARGET = 108;

const MANTRA_CATEGORIES = [
  { id: 'clarity',   label: 'Klarowność',  emoji: '💫', color: '#60A5FA' },
  { id: 'love',      label: 'Miłość',      emoji: '💗', color: '#F472B6' },
  { id: 'abundance', label: 'Obfitość',    emoji: '✨', color: '#F59E0B' },
  { id: 'protection',label: 'Ochrona',     emoji: '🛡️', color: '#6EE7B7' },
  { id: 'healing',   label: 'Uzdrowienie', emoji: '🌿', color: '#34D399' },
  { id: 'power',     label: 'Moc',         emoji: '⚡', color: '#F97316' },
  { id: 'peace',     label: 'Spokój',      emoji: '🌊', color: '#818CF8' },
];

const BUILT_IN_MANTRAS: Record<string, string[]> = {
  clarity: [
    'Widzę jasno. Wybory przychodzą z głębi.',
    'Mój umysł jest spokojny jak jezioro bez fal.',
    'Znam odpowiedź. Czekam w ciszy, aż do mnie dotrze.',
    'Prawda mówi cicho. Jestem wystarczająco spokojny, by ją usłyszeć.',
    'Każdy krok odsłania mi kolejny krok.',
    'Rozróżniam to, co moje, od tego, co nabyłem.',
    'Moja percepcja jest darem. Używam jej z troską.',
    'Wybieram jasność ponad pewność.',
    'Im głębiej oddycham, tym wyraźniej widzę.',
    'Moje intuicje są precyzyjne. Ufam im.',
  ],
  love: [
    'Jestem miłością. Wypełniam nią każdą przestrzeń.',
    'Otwieram serce bez strachu przed utratą.',
    'Kocham i jestem kochany. To mój stan naturalny.',
    'Moje serce jest bezpieczne nawet wtedy, gdy się otwiera.',
    'Daję miłość z pełności, nie z lęku przed odrzuceniem.',
    'Miłość, którą oferuję, wraca do mnie pomnożona.',
    'Jestem godny głębokiego, spokojnego kochania.',
    'Każda relacja jest dla mnie nauczycielką.',
    'Noszę w sobie miłość, której szukam.',
    'Serce jest moim centrum. Wracam do niego zawsze.',
  ],
  abundance: [
    'Jestem otwarty na dobro, które płynie ku mnie.',
    'Życie wspiera moje potrzeby w najlepszy możliwy sposób.',
    'Obfitość jest moim naturalnym środowiskiem.',
    'Przyjmuję to, co dobre, z wdzięcznością i łatwością.',
    'Moje zasoby rosną, gdy działam z miejsca spokoju.',
    'Wszechświat jest szczodry. Jestem tego częścią.',
    'Wybieram perspektywę dostatku zamiast niedoboru.',
    'Jestem stworzony do rozkwitu.',
    'Im więcej daję autentycznie, tym więcej otrzymuję.',
    'Pieniądze przepływają przeze mnie swobodnie i z klasą.',
  ],
  protection: [
    'Jestem chroniony. Nic mi nie zagrozi bez mojej zgody.',
    'Moje granice są jasne i szanowane.',
    'Prowadzi mnie wyższa mądrość. Jestem bezpieczny.',
    'Oddaję to, co nie moje. Zatrzymuję tylko siebie.',
    'Moje pole energetyczne jest stabilne i silne.',
    'Spokój jest moją tarczą. Cisza jest moją mocą.',
    'Nie przejmuję cudzych ciężarów. Niosę swój z godnością.',
    'Każda negatywna energia mija mnie jak cień w słońcu.',
    'Jestem zakorzeniony. Nic mnie nie przeniesie bez mojej woli.',
    'Mam dostęp do ochrony, która przekracza mój rozum.',
  ],
  healing: [
    'Moje ciało wie, jak wracać do równowagi.',
    'Każdy wydech uwalnia to, co już mi nie służy.',
    'Uzdrowienie dzieje się w każdej chwili obecnej.',
    'Traktuję siebie z taką troską, jakiej udzieliłbym bliskiej osobie.',
    'Moje komórki pamiętają stan zdrowia. Wracają do niego.',
    'Przyjmuję uzdrowienie pełnymi garściami.',
    'Nie muszę rozumieć, żeby wracać do całości.',
    'Czas i spokój są moimi sprzymierzeńcami.',
    'Doceniam to, co działa w moim ciele.',
    'Jestem w procesie stawania się coraz bardziej sobą.',
  ],
  power: [
    'Działam ze spokojną pewnością siebie.',
    'Moja wola jest czysta i skierowana na to, co właściwe.',
    'Jestem zdolny do więcej, niż sobie wyobrażam.',
    'Moc rośnie w ciszy, zanim wyraża się w działaniu.',
    'Nie potrzebuję zgody, by być potężny.',
    'Moje słowa tworzą rzeczywistość. Wybieram je świadomie.',
    'Każda przeszkoda wzmacnia moją determinację.',
    'Działam, bo jestem gotowy. Nie czekam na idealny moment.',
    'Moje zasoby wewnętrzne są głębsze niż wszystkie zewnętrzne ograniczenia.',
    'Wypełniam przestrzeń, która do mnie należy.',
  ],
  peace: [
    'Jestem spokojny. W tym spokoju mam wszystko.',
    'Nie muszę kontrolować każdego wyniku.',
    'Oddech jest moim powrotem do domu.',
    'W ciszy odnajduję siebie.',
    'Puszczam to, czego nie mogę zmienić. Zajmuję się tym, co mogę.',
    'Mój spokój nie zależy od okoliczności zewnętrznych.',
    'Wybieram łagodność wobec siebie w każdej chwili.',
    'Cisza to nie pustka — to przestrzeń, z której rodzi się wszystko.',
    'Jestem zrównoważony, zakorzeniony i obecny.',
    'Mój wewnętrzny spokój jest nie do odebrania.',
  ],
};

// ─── Background SVG ───────────────────────────────────────────────────────────

const MantraBg = ({ isLight }: { isLight: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={
        isLight
          ? ['#FFFBEB', '#FEF3C7', '#FFFBEB']
          : ['#08060F', '#100C1C', '#0D0A18']
      }
      style={StyleSheet.absoluteFill}
    />
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgRadialGradient id="glow1" cx="30%" cy="25%" r="40%">
          <Stop offset="0%" stopColor={ACCENT} stopOpacity={isLight ? '0.08' : '0.12'} />
          <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </SvgRadialGradient>
        <SvgRadialGradient id="glow2" cx="75%" cy="70%" r="35%">
          <Stop offset="0%" stopColor="#818CF8" stopOpacity={isLight ? '0.06' : '0.10'} />
          <Stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
        </SvgRadialGradient>
      </Defs>
      <SvgCircle cx="30%" cy="25%" r="200" fill="url(#glow1)" />
      <SvgCircle cx="75%" cy="70%" r="180" fill="url(#glow2)" />
    </Svg>
  </View>
);

// ─── Animated Orb ─────────────────────────────────────────────────────────────

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

const MantraOrb = ({
  categoryColor,
  mantraText,
  isLight,
}: {
  categoryColor: string;
  mantraText: string;
  isLight: boolean;
}) => {
  const scale   = useSharedValue(0.92);
  const opacity = useSharedValue(0.55);
  const rot     = useSharedValue(0);
  const tiltX   = useSharedValue(-4);
  const tiltY   = useSharedValue(0);

  useEffect(() => {
    scale.value   = withRepeat(withSequence(withTiming(1.0, { duration: 2600 }), withTiming(0.92, { duration: 2600 })), -1, false);
    opacity.value = withRepeat(withSequence(withTiming(0.80, { duration: 2600 }), withTiming(0.55, { duration: 2600 })), -1, false);
    rot.value     = withRepeat(withTiming(360, { duration: 18000, easing: Easing.linear }), -1, false);
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      cancelAnimation(rot);
    };
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-20, Math.min(20, -4 + e.translationY * 0.2));
      tiltY.value = Math.max(-20, Math.min(20, e.translationX * 0.2));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-4, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: scale.value },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  const glowProps = useAnimatedProps(() => ({
    opacity: opacity.value,
    r: 62 + (scale.value - 0.92) * 30,
  }));

  const ORB_SIZE = 200;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ alignItems: 'center', justifyContent: 'center', height: ORB_SIZE + 40 }, outerStyle]}>
        <Svg width={ORB_SIZE} height={ORB_SIZE} viewBox={`0 0 ${ORB_SIZE} ${ORB_SIZE}`}>
          <Defs>
            <SvgRadialGradient id="orbCore" cx="40%" cy="35%" r="60%">
              <Stop offset="0%" stopColor={categoryColor} stopOpacity="0.35" />
              <Stop offset="60%" stopColor={ACCENT} stopOpacity="0.18" />
              <Stop offset="100%" stopColor={ACCENT} stopOpacity="0.05" />
            </SvgRadialGradient>
            <SvgRadialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={categoryColor} stopOpacity="0.0" />
              <Stop offset="70%" stopColor={categoryColor} stopOpacity="0.12" />
              <Stop offset="100%" stopColor={categoryColor} stopOpacity="0.30" />
            </SvgRadialGradient>
          </Defs>

          {/* Outer ambient ring */}
          <AnimatedCircle
            cx={ORB_SIZE / 2}
            cy={ORB_SIZE / 2}
            animatedProps={glowProps}
            fill="url(#orbGlow)"
          />

          {/* Core */}
          <SvgCircle cx={ORB_SIZE / 2} cy={ORB_SIZE / 2} r={58} fill="url(#orbCore)" />

          {/* Border ring */}
          <SvgCircle
            cx={ORB_SIZE / 2}
            cy={ORB_SIZE / 2}
            r={68}
            fill="none"
            stroke={categoryColor}
            strokeWidth={1.2}
            strokeOpacity={0.40}
            strokeDasharray="6 8"
          />

          {/* Outer dashed orbit */}
          <SvgCircle
            cx={ORB_SIZE / 2}
            cy={ORB_SIZE / 2}
            r={84}
            fill="none"
            stroke={ACCENT}
            strokeWidth={0.7}
            strokeOpacity={0.22}
            strokeDasharray="3 12"
          />

          {/* Specular glint */}
          <Ellipse
            cx={ORB_SIZE / 2 - 14}
            cy={ORB_SIZE / 2 - 20}
            rx={10}
            ry={6}
            fill="#fff"
            opacity={isLight ? 0.10 : 0.18}
          />
        </Svg>

        {/* Rotating ring overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { alignItems: 'center', justifyContent: 'center' },
            ringStyle,
          ]}
          pointerEvents="none"
        >
          <Svg width={ORB_SIZE} height={ORB_SIZE} viewBox={`0 0 ${ORB_SIZE} ${ORB_SIZE}`}>
            <SvgCircle
              cx={ORB_SIZE / 2}
              cy={ORB_SIZE / 2}
              r={75}
              fill="none"
              stroke={categoryColor}
              strokeWidth={0.8}
              strokeOpacity={0.28}
              strokeDasharray="1 16"
            />
          </Svg>
        </Animated.View>

        {/* Mantra text overlay */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
          ]}
          pointerEvents="none"
        >
          <Text
            style={{
              color: isLight ? '#6B5C3E' : '#FEF3C7',
              fontSize: 12,
              fontStyle: 'italic',
              textAlign: 'center',
              lineHeight: 18,
              opacity: 0.88,
            }}
            numberOfLines={4}
          >
            {mantraText}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

// ─── Progress Ring ────────────────────────────────────────────────────────────

const AnimatedRingCircle = Animated.createAnimatedComponent(SvgCircle);

const ProgressRing = ({ count, total, color }: { count: number; total: number; color: string }) => {
  const R = 48;
  const CIRCUM = 2 * Math.PI * R;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(count / total, { duration: 400 });
    return () => { cancelAnimation(progress); };
  }, [count]);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUM * (1 - progress.value),
  }));

  const SIZE = 110;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Track */}
        <SvgCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeOpacity={0.15}
        />
        {/* Progress */}
        <AnimatedRingCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={CIRCUM}
          animatedProps={ringProps}
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color, fontSize: 20, fontWeight: '700' }}>{count}</Text>
        <Text style={{ color, fontSize: 10, opacity: 0.6 }}>/ {total}</Text>
      </View>
    </View>
  );
};

// ─── Tap Ripple ───────────────────────────────────────────────────────────────

const TapRipple = ({ color }: { color: string }) => {
  const scale   = useSharedValue(0.6);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value   = withRepeat(withSequence(withTiming(1.4, { duration: 900 }), withTiming(0.6, { duration: 0 })), -1, false);
    opacity.value = withRepeat(withSequence(withTiming(0, { duration: 900 }), withTiming(0.5, { duration: 0 })), -1, false);
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 130,
          height: 130,
          borderRadius: 65,
          borderWidth: 2,
          borderColor: color,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
};

// ─── Demo saved mantras ───────────────────────────────────────────────────────

interface SavedMantra {
  id: string;
  text: string;
  category: string;
  createdAt: number;
  isAI?: boolean;
  repeatsDone?: number;
}

const DEMO_SAVED: SavedMantra[] = [
  { id: 'd1', text: 'Jestem miłością. Wypełniam nią każdą przestrzeń.', category: 'love', createdAt: Date.now() - 86400000 * 3, repeatsDone: 108 },
  { id: 'd2', text: 'Widzę jasno. Wybory przychodzą z głębi.', category: 'clarity', createdAt: Date.now() - 86400000 * 7, repeatsDone: 54 },
  { id: 'd3', text: 'Jestem otwarty na dobro, które płynie ku mnie.', category: 'abundance', createdAt: Date.now() - 86400000 * 14, repeatsDone: 108 },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const PersonalMantraScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets       = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const favoriteItems = useAppStore(s => s.favoriteItems);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const textColor  = isLight ? '#1C1917' : '#F5F3EF';
  const subColor   = isLight ? '#78716C' : '#A8A097';
  const cardBg     = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';
  const inputBg    = isLight ? 'rgba(255,248,234,0.92)' : 'rgba(255,255,255,0.07)';

  // ─ State ──────────────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string>('clarity');
  const [activeMantra, setActiveMantra]          = useState<string>('');
  const [repeatCount, setRepeatCount]            = useState<number>(0);
  const [practiceActive, setPracticeActive]       = useState<boolean>(false);
  const [practiceComplete, setPracticeComplete]   = useState<boolean>(false);

  const [intentionText, setIntentionText]         = useState<string>('');
  const [generating, setGenerating]               = useState<boolean>(false);
  const [generatedMantra, setGeneratedMantra]     = useState<string>('');

  const [savedMantras, setSavedMantras]           = useState<SavedMantra[]>(DEMO_SAVED);
  const [expandedId, setExpandedId]               = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  // ─ Derived ────────────────────────────────────────────────────────────────
  const activeCat = useMemo(
    () => MANTRA_CATEGORIES.find((c) => c.id === selectedCategory) ?? MANTRA_CATEGORIES[0],
    [selectedCategory],
  );

  const todayMantra = useMemo(() => {
    const dayIndex = new Date().getDay(); // 0-6
    const mantras  = BUILT_IN_MANTRAS[selectedCategory] ?? [];
    return mantras[dayIndex % mantras.length] ?? mantras[0] ?? '';
  }, [selectedCategory]);

  const isFav = useMemo(
    () => favoriteItems?.some((f: any) => f.id === 'mantra-personal') ?? false,
    [favoriteItems],
  );

  // ─ Favourite toggle ───────────────────────────────────────────────────────
  const toggleFav = useCallback(() => {
    if (isFav) {
      removeFavoriteItem?.('mantra-personal');
    } else {
      addFavoriteItem?.({
        id: 'mantra-personal',
        label: 'Mantra Osobista',
        sublabel: 'Generator i biblioteka mantr',
        route: 'PersonalMantra',
        icon: 'Sparkles',
        color: ACCENT,
        addedAt: Date.now(),
      });
    }
    HapticsService.impact('light');
  }, [isFav]);

  // ─ Practice ───────────────────────────────────────────────────────────────
  const startPractice = useCallback((mantraStr: string) => {
    if (!mantraStr) return;
    setActiveMantra(mantraStr);
    setRepeatCount(0);
    setPracticeActive(true);
    setPracticeComplete(false);
    HapticsService.impact('light');
    setTimeout(() => scrollRef.current?.scrollTo({ y: 420, animated: true }), 300);
  }, []);

  const handleTap = useCallback(() => {
    if (!practiceActive || practiceComplete) return;
    HapticsService.impact('light');
    setRepeatCount((prev) => {
      const next = prev + 1;
      if (next >= REPEAT_TARGET) {
        setPracticeComplete(true);
        HapticsService.impact('medium');
      }
      return next;
    });
  }, [practiceActive, practiceComplete]);

  const resetPractice = useCallback(() => {
    setRepeatCount(0);
    setPracticeComplete(false);
    HapticsService.impact('light');
  }, []);

  const endPractice = useCallback(() => {
    // save repeats to the saved mantra if it exists
    setSavedMantras((prev) =>
      prev.map((m) =>
        m.text === activeMantra ? { ...m, repeatsDone: (m.repeatsDone ?? 0) + repeatCount } : m,
      ),
    );
    setPracticeActive(false);
    setPracticeComplete(false);
    setRepeatCount(0);
    HapticsService.impact('light');
  }, [activeMantra, repeatCount]);

  // ─ AI generation ─────────────────────────────────────────────────────────
  const generateMantra = useCallback(async () => {
    if (!intentionText.trim()) {
      Alert.alert(t('personalMantra.wpisz_intencje', 'Wpisz intencję'), t('personalMantra.opisz_swoja_intencje_a_aethera', 'Opisz swoją intencję, a Aethera stworzy dla Ciebie mantrę.'));
      return;
    }
    setGenerating(true);
    setGeneratedMantra('');
    try {
      const zodiac    = userData?.zodiacSign ?? 'nieznany';
      const archetype = userData?.archetype  ?? 'nieznany';
      const categoryLabel = activeCat.label;

      const messages = [
        {
          role: 'user' as const,
          content: `Jesteś duchowym mistrzem języka polskiego specjalizującym się w tworzeniu osobistych mantr.

Stwórz jedną OSOBISTĄ MANTRĘ dla użytkownika na podstawie:
- Intencja: "${intentionText.trim()}"
- Kategoria: ${categoryLabel}
- Zodiak: ${zodiac}
- Archetyp: ${archetype}

ZASADY:
- Mantra ma być w języku użytkownika, 1-2 zdania, max 15 słów
- Powinna być afirmatywna, w czasie teraźniejszym ("Jestem...", "Mam...", "Tworzę...")
- Musi być konkretna, poetycka i rezonująca
- Użyj pięknego języka, ale bez banalności
- Zwróć TYLKO tekst mantry, bez żadnych objaśnień ani cudzysłowów`,
        },
      ];

      const response = await AiService.chatWithOracle(messages);
      const cleaned  = response
        .replace(/^["„"']|["„"']$/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .trim();
      setGeneratedMantra(cleaned);
    } catch {
      setGeneratedMantra('Jestem w harmonii z życiem. Każdy krok przybliża mnie do pełni.');
    } finally {
      setGenerating(false);
    }
  }, [intentionText, activeCat, userData]);

  const saveGeneratedMantra = useCallback(() => {
    if (!generatedMantra) return;
    const newMantra: SavedMantra = {
      id: `ai-${Date.now()}`,
      text: generatedMantra,
      category: selectedCategory,
      createdAt: Date.now(),
      isAI: true,
      repeatsDone: 0,
    };
    setSavedMantras((prev) => [newMantra, ...prev]);
    setGeneratedMantra('');
    setIntentionText('');
    HapticsService.impact('light');
    Alert.alert(t('personalMantra.zapisano', 'Zapisano ✦'), t('personalMantra.mantra_zostala_dodana_do_twojej', 'Mantra została dodana do Twojej biblioteki.'));
  }, [generatedMantra, selectedCategory]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1 }} edges={['top']}>

      <MantraBg isLight={isLight} />

      {/* ── Header ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: layout.padding.screen,
          paddingVertical: 12,
          zIndex: 10,
        }}
      >
        <Pressable
          onPress={() => goBackOrToMainTab(navigation, 'Worlds')}
          hitSlop={16}
          style={[styles.headerBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <ChevronLeft size={20} color={textColor} />
        </Pressable>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('personalMantra.mantra_osobista', 'Mantra Osobista')}</Text>
          <Text style={[styles.headerSub, { color: ACCENT }]}>{t('personalMantra.tradycja_dzwieku', '✦ TRADYCJA DŹWIĘKU ✦')}</Text>
        </View>

        <Pressable
          onPress={toggleFav}
          hitSlop={16}
          style={[styles.headerBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <Star size={18} color={isFav ? ACCENT : subColor} fill={isFav ? ACCENT : 'none'} />
        </Pressable>
      </View>

      {/* ── Scrollable content ── */}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          {/* ── Hero Orb ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(700)} style={{ alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
            <MantraOrb
              categoryColor={activeCat.color}
              mantraText={activeMantra || todayMantra}
              isLight={isLight}
            />
            <Text style={[styles.orbHint, { color: subColor }]}>
              {t('personalMantra.dotknij_i_przeciagni_by_poczuc', 'Dotknij i przeciągnij, by poczuć mantrę w przestrzeni')}
            </Text>
          </Animated.View>

          {/* ── Category selector ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Text style={[styles.sectionLabel, { color: ACCENT, paddingHorizontal: layout.padding.screen }]}>
              {t('personalMantra.kategoria', 'KATEGORIA')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: 4 }}
            >
              {MANTRA_CATEGORIES.map((cat) => {
                const active = cat.id === selectedCategory;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      setSelectedCategory(cat.id);
                      HapticsService.impact('light');
                    }}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: active ? cat.color + '22' : cardBg,
                        borderColor: active ? cat.color : cardBorder,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.catChipLabel,
                        { color: active ? cat.color : subColor, fontWeight: active ? '600' : '400' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* ── Mantra Dnia ── */}
          <Animated.View entering={FadeInDown.delay(280).duration(600)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 20 }}>
            <Text style={[styles.sectionLabel, { color: ACCENT }]}>{t('personalMantra.mantra_dnia', 'MANTRA DNIA')}</Text>
            <LinearGradient
              colors={
                isLight
                  ? [activeCat.color + '14', activeCat.color + '08']
                  : [activeCat.color + '18', activeCat.color + '09']
              }
              style={[styles.todayCard, { borderColor: activeCat.color + '40' }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>{activeCat.emoji}</Text>
                <Text style={[styles.todayCardEyebrow, { color: activeCat.color }]}>
                  {activeCat.label.toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.todayCardText, { color: textColor }]}>{todayMantra}</Text>
              <View style={{ flexDirection: 'row', marginTop: 14, gap: 10 }}>
                <Pressable
                  onPress={() => startPractice(todayMantra)}
                  style={[styles.todayBtn, { backgroundColor: activeCat.color + '20', borderColor: activeCat.color + '40' }]}
                >
                  <Zap size={14} color={activeCat.color} />
                  <Text style={[styles.todayBtnLabel, { color: activeCat.color }]}>{t('personalMantra.praktykuj', 'Praktykuj')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const mantras = BUILT_IN_MANTRAS[selectedCategory] ?? [];
                    const idx = mantras.indexOf(todayMantra);
                    // pick next
                    const next = mantras[(idx + 1) % mantras.length] ?? mantras[0];
                    setActiveMantra(next);
                    HapticsService.impact('light');
                  }}
                  style={[styles.todayBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
                >
                  <RefreshCw size={14} color={subColor} />
                  <Text style={[styles.todayBtnLabel, { color: subColor }]}>{t('personalMantra.inna', 'Inna')}</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Praktyka Mantry ── */}
          {practiceActive && (
            <Animated.View entering={FadeInDown.duration(500)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 24 }}>
              <Text style={[styles.sectionLabel, { color: ACCENT }]}>{t('personalMantra.praktyka_mantry', 'PRAKTYKA MANTRY')}</Text>
              <View style={[styles.practiceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {/* Mantra text */}
                <Text style={[styles.practiceMantraText, { color: textColor }]}>{activeMantra}</Text>

                <View style={{ height: 1, backgroundColor: cardBorder, marginVertical: 16 }} />

                {/* Ring + Tap */}
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                    {practiceActive && !practiceComplete && <TapRipple color={activeCat.color} />}
                    <ProgressRing count={repeatCount} total={REPEAT_TARGET} color={activeCat.color} />
                  </View>

                  <Pressable
                    onPress={handleTap}
                    disabled={practiceComplete}
                    style={[
                      styles.tapBtn,
                      {
                        backgroundColor: practiceComplete ? activeCat.color + '20' : activeCat.color,
                        borderColor: activeCat.color,
                        marginTop: 20,
                      },
                    ]}
                  >
                    {practiceComplete ? (
                      <Check size={22} color={activeCat.color} />
                    ) : (
                      <Text style={styles.tapBtnLabel}>DOTKNIJ ({REPEAT_TARGET - repeatCount})</Text>
                    )}
                  </Pressable>

                  {practiceComplete && (
                    <Animated.View entering={FadeInUp.duration(400)} style={{ alignItems: 'center', marginTop: 12 }}>
                      <Text style={{ color: activeCat.color, fontSize: 15, fontWeight: '600' }}>
                        {t('personalMantra.108_powtorzen_ukonczone', '108 powtórzeń ukończone ✦')}
                      </Text>
                      <Text style={{ color: subColor, fontSize: 12, marginTop: 4 }}>
                        {t('personalMantra.mantra_zakorzenil_sie_w_twoim', 'Mantra zakorzeniła się w Twoim polu energetycznym')}
                      </Text>
                    </Animated.View>
                  )}
                </View>

                {/* Controls */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    onPress={resetPractice}
                    style={[styles.practiceCtaSecondary, { borderColor: cardBorder, flex: 1 }]}
                  >
                    <RotateCcw size={15} color={subColor} />
                    <Text style={[styles.practiceCtaSecondaryLabel, { color: subColor }]}>{t('personalMantra.reset', 'Reset')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={endPractice}
                    style={[styles.practiceCtaPrimary, { backgroundColor: activeCat.color, flex: 2 }]}
                  >
                    <Text style={styles.practiceCtaPrimaryLabel}>{t('personalMantra.zakoncz_praktyke', 'Zakończ praktykę')}</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Generuj Własną ── */}
          <Animated.View entering={FadeInDown.delay(340).duration(600)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[styles.sectionLabel, { color: ACCENT }]}>{t('personalMantra.generuj_wlasna', 'GENERUJ WŁASNĄ')}</Text>
            <View style={[styles.generateCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Sparkles size={16} color={ACCENT} style={{ marginRight: 8 }} />
                <Text style={[styles.generateTitle, { color: textColor }]}>{t('personalMantra.mantra_od_aethery', 'Mantra od Aethery')}</Text>
              </View>
              <Text style={[styles.generateDesc, { color: subColor }]}>
                {t('personalMantra.opisz_swoja_intencje_lub_wyzwanie', 'Opisz swoją intencję lub wyzwanie. Aethera stworzy dla Ciebie spersonalizowaną mantrę opartą na Twoim profilu.')}
              </Text>

              <TextInput
                style={[
                  styles.intentionInput,
                  { backgroundColor: inputBg, borderColor: cardBorder, color: textColor },
                ]}
                placeholder={t('personalMantra.np_chce_uwolnic_sie_od', 'Np. Chcę uwolnić się od lęku i otworzyć na nowe możliwości...')}
                placeholderTextColor={subColor}
                value={intentionText}
                onChangeText={setIntentionText}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                returnKeyType="done"
                onSubmitEditing={generateMantra}
              />

              <Pressable
                onPress={generateMantra}
                disabled={generating}
                style={[
                  styles.generateBtn,
                  { backgroundColor: generating ? ACCENT + '60' : ACCENT },
                ]}
              >
                {generating ? (
                  <Text style={styles.generateBtnLabel}>{t('personalMantra.generowani_mantry', 'Generowanie mantry...')}</Text>
                ) : (
                  <>
                    <Sparkles size={16} color="#1C1917" />
                    <Text style={styles.generateBtnLabel}>{t('personalMantra.generuj_mantre_ai', 'Generuj mantrę AI')}</Text>
                  </>
                )}
              </Pressable>

              {/* Generated result */}
              {!!generatedMantra && (
                <Animated.View entering={FadeInDown.duration(400)} style={{ marginTop: 16 }}>
                  <LinearGradient
                    colors={[ACCENT + '18', ACCENT + '08']}
                    style={[styles.generatedCard, { borderColor: ACCENT + '40' }]}
                  >
                    <Text style={[styles.generatedLabel, { color: ACCENT }]}>{t('personalMantra.twoja_mantra', 'TWOJA MANTRA')}</Text>
                    <Text style={[styles.generatedText, { color: textColor }]}>{generatedMantra}</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                      <Pressable
                        onPress={() => startPractice(generatedMantra)}
                        style={[styles.todayBtn, { backgroundColor: ACCENT + '20', borderColor: ACCENT + '40', flex: 1 }]}
                      >
                        <Zap size={14} color={ACCENT} />
                        <Text style={[styles.todayBtnLabel, { color: ACCENT }]}>{t('personalMantra.praktykuj_1', 'Praktykuj')}</Text>
                      </Pressable>
                      <Pressable
                        onPress={saveGeneratedMantra}
                        style={[styles.todayBtn, { backgroundColor: cardBg, borderColor: cardBorder, flex: 1 }]}
                      >
                        <BookOpen size={14} color={subColor} />
                        <Text style={[styles.todayBtnLabel, { color: subColor }]}>{t('personalMantra.zapisz', 'Zapisz')}</Text>
                      </Pressable>
                    </View>
                  </LinearGradient>
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {/* ── Moja Biblioteka ── */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={[styles.sectionLabel, { color: ACCENT }]}>{t('personalMantra.moja_biblioteka', 'MOJA BIBLIOTEKA')}</Text>
              <Text style={[styles.sectionCount, { color: subColor }]}>{savedMantras.length} mantr</Text>
            </View>

            {savedMantras.length === 0 && (
              <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>📖</Text>
                <Text style={[styles.emptyTitle, { color: textColor }]}>{t('personalMantra.biblioteka_jest_pusta', 'Biblioteka jest pusta')}</Text>
                <Text style={[styles.emptyDesc, { color: subColor }]}>
                  {t('personalMantra.wygeneruj_mantre_ai_lub_zapisz', 'Wygeneruj mantrę AI lub zapisz ulubioną ze zbioru, by zobaczyć ją tutaj.')}
                </Text>
              </View>
            )}

            {savedMantras.map((mantra, index) => {
              const cat      = MANTRA_CATEGORIES.find((c) => c.id === mantra.category) ?? MANTRA_CATEGORIES[0];
              const isOpen   = expandedId === mantra.id;
              const dateStr  = new Date(mantra.createdAt).toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'short' });

              return (
                <Animated.View key={mantra.id} entering={FadeInDown.delay(index * 60).duration(500)}>
                  <Pressable
                    onPress={() => {
                      setExpandedId(isOpen ? null : mantra.id);
                      HapticsService.impact('light');
                    }}
                    style={[
                      styles.libraryCard,
                      {
                        backgroundColor: isOpen ? cat.color + '12' : cardBg,
                        borderColor: isOpen ? cat.color + '50' : cardBorder,
                        marginBottom: 10,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      {/* Category pill */}
                      <View style={[styles.catPill, { backgroundColor: cat.color + '22', borderColor: cat.color + '40' }]}>
                        <Text style={{ fontSize: 12 }}>{cat.emoji}</Text>
                      </View>

                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text
                          style={[styles.libraryMantraText, { color: textColor }]}
                          numberOfLines={isOpen ? undefined : 2}
                        >
                          {mantra.text}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 }}>
                          <Text style={[styles.libraryMeta, { color: subColor }]}>{dateStr}</Text>
                          {mantra.isAI && (
                            <View style={[styles.aiTag, { backgroundColor: ACCENT + '20', borderColor: ACCENT + '30' }]}>
                              <Text style={[styles.aiTagLabel, { color: ACCENT }]}>{t('personalMantra.ai', 'AI')}</Text>
                            </View>
                          )}
                          {(mantra.repeatsDone ?? 0) > 0 && (
                            <Text style={[styles.libraryMeta, { color: subColor }]}>
                              {mantra.repeatsDone ?? 0} powtórzeń
                            </Text>
                          )}
                        </View>
                      </View>

                      <View style={{ paddingLeft: 8 }}>
                        <Text style={{ color: subColor, fontSize: 16 }}>{isOpen ? '▲' : '▼'}</Text>
                      </View>
                    </View>

                    {/* Expanded actions */}
                    {isOpen && (
                      <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 14, flexDirection: 'row', gap: 8 }}>
                        <Pressable
                          onPress={() => startPractice(mantra.text)}
                          style={[styles.libraryBtn, { backgroundColor: cat.color + '22', borderColor: cat.color + '40', flex: 1 }]}
                        >
                          <Zap size={14} color={cat.color} />
                          <Text style={[styles.libraryBtnLabel, { color: cat.color }]}>{t('personalMantra.praktykuj_2', 'Praktykuj')}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setSavedMantras((prev) => prev.filter((m) => m.id !== mantra.id));
                            setExpandedId(null);
                            HapticsService.impact('light');
                          }}
                          style={[styles.libraryBtn, { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.20)', flex: 1 }]}
                        >
                          <Text style={{ color: '#EF4444', fontSize: 13 }}>{t('personalMantra.usun', 'Usuń')}</Text>
                        </Pressable>
                      </Animated.View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* ── Tradycja 108 ── */}
          <Animated.View entering={FadeInDown.delay(480).duration(600)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[styles.sectionLabel, { color: ACCENT }]}>{t('personalMantra.tradycja_108', 'TRADYCJA 108')}</Text>
            <LinearGradient
              colors={
                isLight
                  ? ['rgba(245,158,11,0.10)', 'rgba(245,158,11,0.05)']
                  : ['rgba(245,158,11,0.14)', 'rgba(245,158,11,0.06)']
              }
              style={[styles.traditionCard, { borderColor: ACCENT + '35' }]}
            >
              <Text style={{ fontSize: 28, textAlign: 'center', marginBottom: 10 }}>🙏</Text>
              <Text style={[styles.traditionTitle, { color: textColor }]}>{t('personalMantra.dlaczego_108', 'Dlaczego 108?')}</Text>
              <Text style={[styles.traditionText, { color: subColor }]}>
                Liczba 108 jest święta w wielu tradycjach — od hinduizmu przez buddyzm po
                jogę. W numerologii redukuje się do 9 (1+0+8), liczby pełni i zakończenia
                cyklu. W sanskrycie istnieje 108 upaniszadów, a w astrologii słońce jest
                108 razy większe od Ziemi.
              </Text>
              <View style={{ height: 1, backgroundColor: ACCENT + '25', marginVertical: 14 }} />
              <Text style={[styles.traditionText, { color: subColor }]}>
                Powtarzając mantrę 108 razy, tworzysz wzorzec wibracyjny w swoim polu
                energetycznym. Każde powtórzenie wzmacnia intencję i zakorzenuje ją
                głębiej w podświadomości. To nie repetycja — to medytacja przez dźwięk.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                {['Hinduizm', 'Buddyzm', 'Joga', 'Numerologia', 'Astrologia'].map((tag) => (
                  <View key={tag} style={[styles.tradTag, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '30' }]}>
                    <Text style={{ color: ACCENT, fontSize: 11 }}>{tag}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Przydatne mantry tematyczne ── */}
          <Animated.View entering={FadeInDown.delay(540).duration(600)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[styles.sectionLabel, { color: ACCENT }]}>ZBIÓR — {activeCat.label.toUpperCase()}</Text>
            <Text style={[styles.collectionDesc, { color: subColor }]}>
              Wybierz mantrę z kategorii {activeCat.label.toLowerCase()} i rozpocznij praktykę.
            </Text>

            {(BUILT_IN_MANTRAS[selectedCategory] ?? []).map((text, idx) => (
              <Animated.View key={idx} entering={FadeInDown.delay(idx * 50).duration(400)}>
                <Pressable
                  onPress={() => startPractice(text)}
                  style={[
                    styles.collectionItem,
                    {
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      borderLeftColor: activeCat.color,
                      borderLeftWidth: 3,
                    },
                  ]}
                >
                  <Text style={[styles.collectionItemText, { color: textColor }]}>{text}</Text>
                  <Zap size={14} color={activeCat.color} style={{ marginLeft: 8 }} />
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>

          {/* ── Co dalej ── */}
          <Animated.View entering={FadeInDown.delay(600).duration(600)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 28 }}>
            <Text style={[styles.sectionLabel, { color: ACCENT }]}>{t('personalMantra.co_dalej', 'CO DALEJ')}</Text>
            <View style={{ gap: 10 }}>
              {[
                {
                  icon: Heart,
                  color: '#F472B6',
                  title: 'Afirmacje',
                  desc: 'Wzmocnij mantrę codziennymi afirmacjami',
                  route: 'Affirmations',
                },
                {
                  icon: Wind,
                  color: '#818CF8',
                  title: 'Medytacja',
                  desc: 'Praktykuj mantrę podczas sesji medytacji',
                  route: 'Meditation',
                },
                {
                  icon: NotebookPen,
                  color: '#34D399',
                  title: 'Dziennik',
                  desc: 'Zapisz refleksje po praktyce mantry',
                  route: 'JournalEntry',
                },
              ].map(({ icon: Icon, color, title, desc, route }) => (
                <Pressable
                  key={route}
                  onPress={() => {
                    try { navigation.navigate(route); } catch {}
                    HapticsService.impact('light');
                  }}
                  style={[styles.nextCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                >
                  <View style={[styles.nextIcon, { backgroundColor: color + '22' }]}>
                    <Icon size={18} color={color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.nextTitle, { color: textColor }]}>{title}</Text>
                    <Text style={[styles.nextDesc, { color: subColor }]}>{desc}</Text>
                  </View>
                  <ArrowRight size={16} color={subColor} />
                </Pressable>
              ))}
            </View>
          </Animated.View>

          <EndOfContentSpacer />
        </ScrollView>
      </KeyboardAvoidingView>
        </SafeAreaView>
</View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 9,
    letterSpacing: 2.5,
    marginTop: 2,
  },
  orbHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
    letterSpacing: 0.2,
  },

  // Section labels
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  sectionCount: {
    fontSize: 11,
    opacity: 0.7,
  },

  // Category chips
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 5,
  },
  catChipLabel: {
    fontSize: 12,
  },

  // Today card
  todayCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  todayCardEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  todayCardText: {
    fontSize: 17,
    fontStyle: 'italic',
    lineHeight: 26,
    fontWeight: '500',
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  todayBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Practice card
  practiceCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  practiceMantraText: {
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: 28,
    fontWeight: '500',
    textAlign: 'center',
  },
  tapBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    minWidth: 180,
  },
  tapBtnLabel: {
    color: '#1C1917',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  practiceCtaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  practiceCtaSecondaryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  practiceCtaPrimary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  practiceCtaPrimaryLabel: {
    color: '#1C1917',
    fontSize: 13,
    fontWeight: '700',
  },

  // Generate card
  generateCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  generateTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  generateDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
    marginTop: 4,
  },
  intentionInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 80,
    marginBottom: 12,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  generateBtnLabel: {
    color: '#1C1917',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  generatedCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  generatedLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  generatedText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    fontWeight: '500',
  },

  // Library
  libraryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  catPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  libraryMantraText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  libraryMeta: {
    fontSize: 11,
    opacity: 0.7,
  },
  aiTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  aiTagLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  libraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  libraryBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },

  // Tradition
  traditionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  traditionTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  traditionText: {
    fontSize: 13,
    lineHeight: 21,
  },
  tradTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },

  // Collection
  collectionDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    marginTop: -4,
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  collectionItemText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Co dalej
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  nextIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  nextDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 18,
  },
});
