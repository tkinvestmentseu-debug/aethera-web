import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View,
  Dimensions, Text, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Line, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, Star, Users, Play, Pause, RotateCcw, CheckCircle2, Circle as CircleIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getResolvedTheme, isLightBg } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { AudioService } from '../core/services/audio.service';
import { useAudioCleanup } from '../core/hooks/useAudioCleanup';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#6EE7B7';
const RITUAL_DURATION = 11 * 60; // 11 minutes in seconds
const CIRCLE_R = 90;
const CIRCLE_CIRCUM = 2 * Math.PI * CIRCLE_R;

const AnimCircle = Animated.createAnimatedComponent(Circle);

// ─── Background ────────────────────────────────────────────────────────────────
const AncestralBg = ({ isDark }: { isDark: boolean }) => {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = (e.translationX / SW) * 12;
      tiltY.value = (e.translationY / 300) * 12;
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { rotateX: `${-tiltY.value}deg` },
      { rotateY: `${tiltX.value}deg` },
    ],
  }));

  const pulse = useSharedValue(0.55);
  const rotate = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.55, { duration: 3500 }),
      ),
      -1,
    );
    rotate.value = withRepeat(withTiming(360, { duration: 40000, easing: Easing.linear }), -1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={isDark ? ['#020A04', '#050F06', '#071208'] : ['#EEF8F3', '#E0F4EA', '#D4EFE2']}
        style={StyleSheet.absoluteFill}
      />
      <GestureDetector gesture={pan}>
        <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
          <Svg width={SW} height={480} style={{ position: 'absolute', top: 0 }}>
            <Defs>
              <RadialGradient id="moonGlow" cx="50%" cy="30%" r="40%">
                <Stop offset="0%" stopColor={ACCENT} stopOpacity={isDark ? '0.18' : '0.12'} />
                <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="rootGlow" cx="50%" cy="90%" r="40%">
                <Stop offset="0%" stopColor={ACCENT} stopOpacity={isDark ? '0.14' : '0.08'} />
                <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Moon circle */}
            <Circle cx={SW / 2} cy={80} r={44} fill="url(#moonGlow)" />
            <Circle cx={SW / 2} cy={80} r={32} fill="none" stroke={ACCENT}
              strokeWidth={1} opacity={isDark ? 0.22 : 0.14} />
            <Circle cx={SW / 2} cy={80} r={24} fill={ACCENT} opacity={isDark ? 0.06 : 0.04} />

            {/* Root glow */}
            <Ellipse cx={SW / 2} cy={460} rx={180} ry={70} fill="url(#rootGlow)" />

            {/* Tree trunk */}
            <Path
              d={`M ${SW / 2} 440 C ${SW / 2 - 4} 380 ${SW / 2 + 4} 340 ${SW / 2} 290`}
              stroke={ACCENT} strokeWidth={3} fill="none" opacity={isDark ? 0.28 : 0.18}
            />

            {/* Main branches */}
            <Path d={`M ${SW / 2} 320 Q ${SW / 2 - 60} 280 ${SW / 2 - 100} 240`}
              stroke={ACCENT} strokeWidth={2} fill="none" opacity={isDark ? 0.22 : 0.14} />
            <Path d={`M ${SW / 2} 310 Q ${SW / 2 + 60} 270 ${SW / 2 + 100} 230`}
              stroke={ACCENT} strokeWidth={2} fill="none" opacity={isDark ? 0.22 : 0.14} />
            <Path d={`M ${SW / 2} 335 Q ${SW / 2 - 35} 300 ${SW / 2 - 55} 268`}
              stroke={ACCENT} strokeWidth={1.5} fill="none" opacity={isDark ? 0.16 : 0.10} />
            <Path d={`M ${SW / 2} 330 Q ${SW / 2 + 35} 295 ${SW / 2 + 55} 265`}
              stroke={ACCENT} strokeWidth={1.5} fill="none" opacity={isDark ? 0.16 : 0.10} />

            {/* Roots */}
            <Path d={`M ${SW / 2} 440 Q ${SW / 2 - 50} 460 ${SW / 2 - 90} 470`}
              stroke={ACCENT} strokeWidth={2} fill="none" opacity={isDark ? 0.18 : 0.10} />
            <Path d={`M ${SW / 2} 440 Q ${SW / 2 + 50} 458 ${SW / 2 + 90} 468`}
              stroke={ACCENT} strokeWidth={2} fill="none" opacity={isDark ? 0.18 : 0.10} />
            <Path d={`M ${SW / 2} 440 Q ${SW / 2 - 20} 475 ${SW / 2 - 30} 490`}
              stroke={ACCENT} strokeWidth={1.5} fill="none" opacity={isDark ? 0.14 : 0.08} />

            {/* Ancestor node halos */}
            {[
              [SW / 2, 220, 14],
              [SW / 2 - 100, 240, 11],
              [SW / 2 + 100, 230, 11],
              [SW / 2 - 55, 268, 9],
              [SW / 2 + 55, 265, 9],
            ].map(([cx, cy, r], i) => (
              <G key={i}>
                <Circle cx={cx} cy={cy} r={Number(r) + 6} fill={ACCENT} opacity={isDark ? 0.06 : 0.04} />
                <Circle cx={cx} cy={cy} r={Number(r)} fill={ACCENT} opacity={isDark ? 0.18 : 0.10} />
              </G>
            ))}

            {/* Floating particles */}
            {Array.from({ length: 24 }, (_, i) => (
              <Circle
                key={'p' + i}
                cx={(i * 157 + 20) % SW}
                cy={(i * 97 + 40) % 460}
                r={i % 5 === 0 ? 1.4 : 0.7}
                fill={ACCENT}
                opacity={isDark ? 0.16 : 0.08}
              />
            ))}
          </Svg>

          {/* Pulse overlay */}
          <Animated.View style={[StyleSheet.absoluteFill, pulseStyle]} pointerEvents="none">
            <Svg width={SW} height={480} style={{ position: 'absolute', top: 0 }}>
              <Circle cx={SW / 2} cy={80} r={40} fill="none"
                stroke={ACCENT} strokeWidth={0.8} opacity={0.3} />
              <Circle cx={SW / 2} cy={80} r={50} fill="none"
                stroke={ACCENT} strokeWidth={0.5} opacity={0.15} />
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ─── Tree node types ────────────────────────────────────────────────────────────
type TreeNode = {
  id: string;
  label: string;
  name: string;
  row: number; // 0=self, 1=parents, 2=grandparents
  col: number;
};

const INITIAL_TREE: TreeNode[] = [
  { id: 'self', label: 'Ja', name: '', row: 0, col: 0 },
  { id: 'mother', label: 'Matka', name: '', row: 1, col: -1 },
  { id: 'father', label: 'Ojciec', name: '', row: 1, col: 1 },
  { id: 'gm_m', label: 'Babcia\n(mat.)', name: '', row: 2, col: -2 },
  { id: 'gf_m', label: 'Dziadek\n(mat.)', name: '', row: 2, col: -0.5 },
  { id: 'gm_f', label: 'Babcia\n(ojc.)', name: '', row: 2, col: 0.5 },
  { id: 'gf_f', label: 'Dziadek\n(ojc.)', name: '', row: 2, col: 2 },
];

const ROW_Y: Record<number, number> = { 0: 30, 1: 120, 2: 215 };
const NODE_R = { 0: 26, 1: 22, 2: 18 };

// ─── Ancestral symbols ─────────────────────────────────────────────────────────
const SYMBOLS = [
  { id: 'tree',    icon: '🌳', label: 'Drzewo',     desc: 'Symbol ciągłości pokoleń i korzeni. Drzewo genealogiczne łączy przeszłość z teraźniejszością — twoje korzenie dają ci siłę do wzrostu.' },
  { id: 'candle',  icon: '🕯️', label: 'Światło',    desc: 'Płomień świecy symbolizuje ducha przodków — nie gaśnie, lecz przekazywany jest z rąk do rąk. Ich światło żyje w tobie.' },
  { id: 'flower',  icon: '🌸', label: 'Kwiat',      desc: 'Kwiat przodków oznacza rozkwit darów rodzinnych. Każdy płatek to talent i cecha odziedziczona po linii krwi.' },
  { id: 'water',   icon: '🌊', label: 'Woda',       desc: 'Woda symbolizuje przepływ wspomnień i emocji przez pokolenia. Oczyszcza i leczy wzorce, które nie służą już twojemu wzrostowi.' },
  { id: 'fire',    icon: '🔥', label: 'Ogień',      desc: 'Ogień przodków to pasja, wola przetrwania i transformacja. Niesie w sobie siłę wszystkich, którzy pokonali przeciwności losu.' },
  { id: 'star',    icon: '⭐', label: 'Gwiazda',    desc: 'Gwiazda to duch przodka, który przeszedł na drugą stronę. Patrzą na nas z góry — prowadzą naszą intuicję i chronią w nocy.' },
  { id: 'moon',    icon: '🌙', label: 'Księżyc',    desc: 'Księżyc reprezentuje cykliczną mądrość kobiecą i nocne objawienia. Przodkinie przekazywały przez niego tajemnice intuicji i uzdrawiania.' },
  { id: 'snake',   icon: '🐍', label: 'Wąż',        desc: 'Wąż symbolizuje transformację, shed starych skór i odrodzenie. Przodkowie znali go jako strażnika progów między światami.' },
  { id: 'spiral',  icon: '🌀', label: 'Spirala',    desc: 'Spirala to symbol ewolucji duszy przez pokolenia. Każde życie to kolejny okrąg — powrót do centrum, ale na wyższym poziomie.' },
  { id: 'mountain',icon: '⛰️', label: 'Góra',       desc: 'Góra to miejsce, gdzie niebo spotyka ziemię. Przodkowie wspinali się na szczyty, by usłyszeć głos bóstw i nieść mądrość do doliny.' },
  { id: 'owl',     icon: '🦉', label: 'Sowa',       desc: 'Sowa to posłaniec między światem żywych i umarłych. Widzenie w ciemności — dar przekazywany przez linie krwi tym, co szukają mądrości.' },
  { id: 'compass', icon: '🧭', label: 'Kompas',     desc: 'Kompas symbolizuje wewnętrzny kierunek, który przodkowie zostawili w naszych genach. Gdy się gubisz, wróć do wartości swojej linii.' },
  { id: 'crystal', icon: '💎', label: 'Kryształ',   desc: 'Kryształ gromadzi i przekazuje energię przez pokolenia. Kamień przekazywany z rąk do rąk niesie w sobie wspomnienia i intencje przodków.' },
  { id: 'drum',    icon: '🥁', label: 'Bęben',      desc: 'Rytm bębna to bicie serca ziemi. Przodkowie drumowali, by wejść w trans i nawiązać kontakt ze światem duchów, przywołując uzdrowienie.' },
  { id: 'feather', icon: '🪶', label: 'Pióro',      desc: 'Pióro łączy ziemię z niebem — symbol wolności ducha i przekazów z wyższych wymiarów. Nos je z sobą jako przypomnienie o skrzydłach przodków.' },
];

// ─── Ritual steps ─────────────────────────────────────────────────────────────
const RITUAL_STEPS = [
  { id: 1, title: 'Przygotowanie przestrzeni', desc: 'Zapal świecę lub kadzidło. Umieść zdjęcie, przedmiot lub symbol przodka. Usiądź wygodnie, zamknij oczy przez chwilę.' },
  { id: 2, title: 'Oddech uziemienia', desc: 'Wykonaj 3 głębokie oddechy. Z każdym wydechem poczuj, jak twoje stopy zakorzeniają się głębiej w ziemi przodków.' },
  { id: 3, title: 'Otwarcie połączenia', desc: 'Wyobraź sobie złoty korzeń biegnący przez ciebie do przodków. Powiedz w myślach: „Przywołuję mądrość i miłość moich przodków."' },
  { id: 4, title: 'Cisza i słuchanie', desc: 'Trwaj w ciszy 11 minut z timerem. Obserwuj obrazy, uczucia, słowa, które się pojawiają. Nie oceniaj — po prostu przyjmuj.' },
  { id: 5, title: 'Wdzięczność i zamknięcie', desc: 'Podziękuj przodkom za geny, zdolności i lekcje, które ci zostawili. Powiedz: „Dziękuję i zamykam połączenie. Niosę waszą mądrość w sercu." Ugaś świecę.' },
];

// ─── Main screen ───────────────────────────────────────────────────────────────
export const AncestralConnectionScreen = ({ navigation }: { navigation: any }) => {
  const { t } = useTranslation();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const isDark = !isLightBg(currentTheme.background);
  const textColor = isLight ? '#0A2010' : '#E8F8EF';
  const subColor = isLight ? 'rgba(10,32,16,0.5)' : 'rgba(232,248,239,0.5)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';
  const insets = useSafeAreaInsets();

  useAudioCleanup();

  const isFav = isFavoriteItem('ancestral-connection');
  const toggleFav = () => {
    HapticsService.impactLight();
    if (isFav) {
      removeFavoriteItem('ancestral-connection');
    } else {
      addFavoriteItem({
        id: 'ancestral-connection',
        label: 'Połączenie z Przodkami',
        sublabel: 'Rytuał ancestralny',
        route: 'AncestralConnection',
        icon: '🌳',
        color: ACCENT,
        addedAt: new Date().toISOString(),
      });
    }
  };

  // ── Sections state ──────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<'tree' | 'message' | 'timer' | 'gratitude' | 'symbols' | 'ritual'>('tree');

  const scrollRef = useRef<ScrollView>(null);

  // ── Tree state ──────────────────────────────────────────────────────────────
  const [tree, setTree] = useState<TreeNode[]>(INITIAL_TREE);
  const [editNode, setEditNode] = useState<TreeNode | null>(null);
  const [editInput, setEditInput] = useState('');

  const openEdit = (node: TreeNode) => {
    setEditNode(node);
    setEditInput(node.name);
    HapticsService.impactLight();
  };
  const saveEdit = () => {
    if (!editNode || editInput.trim().length < 2) return;
    setTree(prev => prev.map(n => n.id === editNode.id ? { ...n, name: editInput.trim() } : n));
    setEditNode(null);
    HapticsService.impactMedium();
  };

  // ── AI Message state ────────────────────────────────────────────────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  const invokeAncestors = async () => {
    setAiLoading(true);
    HapticsService.impactMedium();
    try {
      const result = await AiService.chatWithOracle([{
        role: 'user',
        content:
          'Wciel się w zbiorowy głos mądrych przodków — pełen ciepła, spokoju i głębokiej wiedzy pokoleń. ' +
          'Przekaż mi przesłanie od linii moich przodków. ' +
          'Mów poetyckim, symbolicznym językiem — jak szept lasu albo echo dawnych pieśni. ' +
          'Nawiąż do motywów drzewa, korzeni, ognia i ciągłości życia. ' +
          'Przesłanie ma być krótkie (4–5 zdań), pełne miłości i mądrości, bez ogólników.',
      }]);
      setAiMessage(result);
    } catch {
      setAiMessage(
        'Stoisz na korzeniach, których nie widzisz — lecz które cię podtrzymują. ' +
        'Wszystko, czego się boisz, my już przeżyliśmy za ciebie. ' +
        'Idź naprzód z naszą siłą w sercu — jesteś owocem wszystkich naszych marzeń.',
      );
    }
    setAiLoading(false);
  };

  // ── Timer state ─────────────────────────────────────────────────────────────
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSecs, setTimerSecs] = useState(RITUAL_DURATION);
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const strokeProg = useSharedValue(0);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCLE_CIRCUM * (1 - strokeProg.value),
  }));

  const startTimer = async () => {
    if (timerDone) return;
    HapticsService.impactMedium();
    await AudioService.playAmbientForSession('forest');
    setTimerRunning(true);
    const elapsed = RITUAL_DURATION - timerSecs;
    strokeProg.value = withTiming(1, {
      duration: timerSecs * 1000,
      easing: Easing.linear,
    });
    timerRef.current = setInterval(() => {
      setTimerSecs(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimerRunning(false);
          setTimerDone(true);
          HapticsService.notify();
          void AudioService.playRitualCompletionTone();
          void AudioService.pauseAmbientSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    strokeProg.value = withTiming(strokeProg.value, { duration: 200 });
    void AudioService.pauseAmbientSound();
    HapticsService.impactLight();
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerDone(false);
    setTimerSecs(RITUAL_DURATION);
    strokeProg.value = withTiming(0, { duration: 400 });
    void AudioService.pauseAmbientSound();
    HapticsService.impactLight();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (gratitudeSavedTimerRef.current) clearTimeout(gratitudeSavedTimerRef.current);
    };
  }, []);

  const timerMins = Math.floor(timerSecs / 60);
  const timerSecsPart = timerSecs % 60;
  const timerLabel = `${String(timerMins).padStart(2, '0')}:${String(timerSecsPart).padStart(2, '0')}`;

  // ── Gratitude state ─────────────────────────────────────────────────────────
  const [gratitudes, setGratitudes] = useState([
    { to: '', text: '' },
    { to: '', text: '' },
    { to: '', text: '' },
  ]);
  const [gratitudeSaved, setGratitudeSaved] = useState(false);
  const gratitudeSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveGratitudes = () => {
    HapticsService.impactMedium();
    setGratitudeSaved(true);
    if (gratitudeSavedTimerRef.current) clearTimeout(gratitudeSavedTimerRef.current);
    gratitudeSavedTimerRef.current = setTimeout(() => setGratitudeSaved(false), 3000);
  };

  // ── Symbol state ────────────────────────────────────────────────────────────
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const activeSymbolData = SYMBOLS.find(s => s.id === activeSymbol);

  // ── Ritual steps state ──────────────────────────────────────────────────────
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const toggleStep = (id: number) => {
    HapticsService.impactLight();
    setCheckedSteps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // ── Tab config ──────────────────────────────────────────────────────────────
  const TABS: Array<{ id: typeof activeSection; label: string }> = [
    { id: 'tree', label: 'Drzewo' },
    { id: 'message', label: 'Przesłanie' },
    { id: 'timer', label: 'Timer' },
    { id: 'gratitude', label: 'Wdzięczność' },
    { id: 'symbols', label: 'Symbole' },
    { id: 'ritual', label: 'Rytuał' },
  ];

  // ── Helpers for tree layout ─────────────────────────────────────────────────
  const TREE_W = SW - layout.padding.screen * 2;
  const nodeX = (col: number) => TREE_W / 2 + col * (TREE_W / 5);

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <AncestralBg isDark={isDark} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={styles.iconBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2 }}>
            {t('ancestralConnection.polaczenie', 'POŁĄCZENIE')}
          </Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>
            {t('ancestralConnection.przodkowie', 'Przodkowie')}
          </Text>
        </View>
        <Pressable onPress={toggleFav} style={[styles.iconBtn, { borderWidth: 1, borderColor: isFav ? ACCENT + '66' : 'rgba(110,231,183,0.2)', backgroundColor: isFav ? ACCENT + '18' : 'transparent' }]}>
          <Star size={18} color={ACCENT} fill={isFav ? ACCENT : 'none'} />
        </Pressable>
      </View>

      {/* Tab rail */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRail}
        style={{ flexGrow: 0 }}
        keyboardShouldPersistTaps="handled"
      >
        {TABS.map(tab => {
          const active = activeSection === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => { HapticsService.impactLight(); setActiveSection(tab.id); }}
              style={[styles.tabChip, active && { backgroundColor: ACCENT, borderColor: ACCENT }]}
            >
              <Text style={[styles.tabLabel, { color: active ? '#020A04' : subColor }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
      >
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingTop: 8 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── SECTION: ANCESTOR TREE ── */}
        {activeSection === 'tree' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={[styles.sectionDesc, { color: subColor }]}>
              {t('ancestralConnection.dotknij_wezla_drzewa_aby_dodac', 'Dotknij węzła drzewa, aby dodać imię przodka. Trzy pokolenia — ty, rodzice i dziadkowie.')}
            </Text>

            {/* SVG Tree Canvas */}
            <View style={[styles.treeCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Svg width={TREE_W} height={280}>
                {/* Connection lines */}
                {/* self → mother/father */}
                <Line
                  x1={nodeX(0)} y1={ROW_Y[0] + NODE_R[0]}
                  x2={nodeX(-1)} y2={ROW_Y[1] - NODE_R[1]}
                  stroke={ACCENT} strokeWidth={1} opacity={0.3}
                />
                <Line
                  x1={nodeX(0)} y1={ROW_Y[0] + NODE_R[0]}
                  x2={nodeX(1)} y2={ROW_Y[1] - NODE_R[1]}
                  stroke={ACCENT} strokeWidth={1} opacity={0.3}
                />
                {/* mother → her parents */}
                <Line
                  x1={nodeX(-1)} y1={ROW_Y[1] + NODE_R[1]}
                  x2={nodeX(-2)} y2={ROW_Y[2] - NODE_R[2]}
                  stroke={ACCENT} strokeWidth={1} opacity={0.3}
                />
                <Line
                  x1={nodeX(-1)} y1={ROW_Y[1] + NODE_R[1]}
                  x2={nodeX(-0.5)} y2={ROW_Y[2] - NODE_R[2]}
                  stroke={ACCENT} strokeWidth={1} opacity={0.3}
                />
                {/* father → his parents */}
                <Line
                  x1={nodeX(1)} y1={ROW_Y[1] + NODE_R[1]}
                  x2={nodeX(0.5)} y2={ROW_Y[2] - NODE_R[2]}
                  stroke={ACCENT} strokeWidth={1} opacity={0.3}
                />
                <Line
                  x1={nodeX(1)} y1={ROW_Y[1] + NODE_R[1]}
                  x2={nodeX(2)} y2={ROW_Y[2] - NODE_R[2]}
                  stroke={ACCENT} strokeWidth={1} opacity={0.3}
                />

                {/* Nodes */}
                {tree.map(node => {
                  const cx = nodeX(node.col);
                  const cy = ROW_Y[node.row];
                  const r = NODE_R[node.row as 0 | 1 | 2];
                  const hasName = node.name.length > 0;
                  return (
                    <G key={node.id}>
                      <Circle cx={cx} cy={cy} r={r + 4} fill={ACCENT} opacity={0.06} />
                      <Circle
                        cx={cx} cy={cy} r={r}
                        fill={hasName ? ACCENT + '33' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.88)')}
                        stroke={hasName ? ACCENT : (isDark ? 'rgba(110,231,183,0.25)' : 'rgba(110,231,183,0.35)')}
                        strokeWidth={1.2}
                      />
                    </G>
                  );
                })}
              </Svg>

              {/* Overlay pressable nodes */}
              <View style={[StyleSheet.absoluteFill, { top: 0 }]}>
                {tree.map(node => {
                  const cx = nodeX(node.col);
                  const cy = ROW_Y[node.row];
                  const r = NODE_R[node.row as 0 | 1 | 2];
                  const hasName = node.name.length > 0;
                  return (
                    <Pressable
                      key={node.id}
                      onPress={() => openEdit(node)}
                      style={{
                        position: 'absolute',
                        left: cx - r,
                        top: cy - r,
                        width: r * 2,
                        height: r * 2,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: node.row === 0 ? 8 : 7, color: hasName ? textColor : subColor, textAlign: 'center' }} numberOfLines={1}>
                        {hasName ? node.name.split(' ')[0] : '+'}
                      </Text>
                    </Pressable>
                  );
                })}

                {/* Row labels */}
                {[
                  { row: 0, label: 'Ja' },
                  { row: 1, label: 'Rodzice' },
                  { row: 2, label: 'Dziadkowie' },
                ].map(({ row, label }) => (
                  <Text
                    key={row}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: ROW_Y[row] - 8,
                      fontSize: 9,
                      color: subColor,
                      letterSpacing: 1,
                    }}
                  >
                    {label}
                  </Text>
                ))}
              </View>
            </View>

            {/* Node list below tree */}
            <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginTop: 16, marginBottom: 8 }}>
              {t('ancestralConnection.dodane_imiona', 'DODANE IMIONA')}
            </Text>
            {tree.filter(n => n.name).map((node, i) => (
              <Animated.View key={node.id} entering={FadeInDown.delay(i * 60).duration(300)}>
                <Pressable
                  onPress={() => openEdit(node)}
                  style={[styles.nameRow, { backgroundColor: cardBg, borderColor: cardBorder }]}
                >
                  <View style={[styles.nameDot, { backgroundColor: ACCENT + '33', borderColor: ACCENT + '55' }]}>
                    <Text style={{ fontSize: 10, color: ACCENT }}>🌿</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>{node.name}</Text>
                    <Text style={{ color: subColor, fontSize: 11 }}>{node.label}</Text>
                  </View>
                  <Text style={{ color: subColor, fontSize: 11 }}>{t('ancestralConnection.edytuj', 'Edytuj')}</Text>
                </Pressable>
              </Animated.View>
            ))}
            {tree.filter(n => !n.name).length > 0 && (
              <Text style={{ color: subColor, fontSize: 12, lineHeight: 18, marginTop: 8 }}>
                {t('ancestralConnection.dotknij_wezla_w_drzewie_lub', 'Dotknij węzła w drzewie lub pustego miejsca, aby dodać imię przodka.')}
              </Text>
            )}
          </Animated.View>
        )}

        {/* ── SECTION: ANCESTRAL MESSAGE ── */}
        {activeSection === 'message' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={[styles.sectionDesc, { color: subColor }]}>
              {t('ancestralConnection.nacisnij_przycisk_by_przywolac_prze', 'Naciśnij przycisk, by przywołać przesłanie od linii twoich przodków. Głos AI-Oracle wyrazi ich zbiorową mądrość.')}
            </Text>

            <Pressable
              onPress={invokeAncestors}
              disabled={aiLoading}
              style={[styles.invokeBtn, { opacity: aiLoading ? 0.7 : 1 }]}
            >
              <LinearGradient
                colors={[ACCENT + 'CC', '#34D399', '#10B981']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.invokeBtnInner}
              >
                <Text style={styles.invokeBtnIcon}>🌳</Text>
                <Text style={styles.invokeBtnLabel}>
                  {aiLoading ? 'Słucham przodków...' : 'Przywołaj przodków'}
                </Text>
                <Text style={[styles.invokeBtnSub, { color: 'rgba(2,10,4,0.65)' }]}>
                  {aiLoading ? 'Trwa połączenie z linią przodków' : 'Otrzymaj ich przesłanie'}
                </Text>
              </LinearGradient>
            </Pressable>

            {aiMessage ? (
              <Animated.View entering={FadeInDown.duration(500)}>
                <View style={[styles.messageCard, { backgroundColor: ACCENT + '0E', borderColor: ACCENT + '33' }]}>
                  <Text style={{ color: ACCENT, fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>
                    {t('ancestralConnection.glos_przodkow', 'GŁOS PRZODKÓW')}
                  </Text>
                  <Text style={{ color: textColor, fontSize: 15, lineHeight: 26, fontStyle: 'italic' }}>
                    "{aiMessage}"
                  </Text>
                </View>
              </Animated.View>
            ) : null}

            {!aiMessage && !aiLoading && (
              <View style={[styles.placeholderCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🌿</Text>
                <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, textAlign: 'center' }}>
                  {t('ancestralConnection.kazda_rodzina_niesie_w_sobie', 'Każda rodzina niesie w sobie głębię pokoleń. Twoi przodkowie mają dla ciebie słowo — naciśnij, by usłyszeć.')}
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* ── SECTION: MEMORY RITUAL TIMER ── */}
        {activeSection === 'timer' && (
          <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center' }}>
            <Text style={[styles.sectionDesc, { color: subColor, textAlign: 'center' }]}>
              {t('ancestralConnection.11_minutowa_cisza_dla_przodkow', '11-minutowa cisza dla przodków. Pozwól myślom przepłynąć i wsłuchaj się w to, co lineaż chce ci przekazać.')}
            </Text>

            {/* Circular progress */}
            <View style={styles.timerCircleWrap}>
              <Svg width={240} height={240}>
                <Defs>
                  <RadialGradient id="timerGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor={ACCENT} stopOpacity="0.15" />
                    <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                {/* Background glow */}
                <Circle cx={120} cy={120} r={110} fill="url(#timerGlow)" />
                {/* Track */}
                <Circle
                  cx={120} cy={120} r={CIRCLE_R}
                  stroke={isDark ? 'rgba(110,231,183,0.12)' : 'rgba(110,231,183,0.22)'}
                  strokeWidth={6}
                  fill="none"
                />
                {/* Progress arc */}
                <AnimCircle
                  cx={120} cy={120} r={CIRCLE_R}
                  stroke={ACCENT}
                  strokeWidth={6}
                  fill="none"
                  strokeDasharray={CIRCLE_CIRCUM}
                  strokeLinecap="round"
                  rotation="-90"
                  origin="120,120"
                  animatedProps={animatedCircleProps}
                />
              </Svg>

              {/* Timer label in center */}
              <View style={styles.timerLabelAbsolute}>
                {timerDone ? (
                  <>
                    <Text style={{ fontSize: 28 }}>✓</Text>
                    <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '700', marginTop: 4 }}>
                      {t('ancestralConnection.zakonczono', 'Zakończono')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={{ color: textColor, fontSize: 36, fontWeight: '300', letterSpacing: 2 }}>
                      {timerLabel}
                    </Text>
                    <Text style={{ color: subColor, fontSize: 11, marginTop: 2 }}>
                      {t('ancestralConnection.cisza_rytualna', 'cisza rytualna')}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Controls */}
            {!timerDone ? (
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                <Pressable
                  onPress={timerRunning ? pauseTimer : startTimer}
                  style={[styles.timerBtn, { backgroundColor: ACCENT }]}
                >
                  {timerRunning
                    ? <Pause size={22} color="#020A04" />
                    : <Play size={22} color="#020A04" />
                  }
                </Pressable>
                <Pressable onPress={resetTimer} style={[styles.timerBtn, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
                  <RotateCcw size={20} color={subColor} />
                </Pressable>
              </View>
            ) : (
              <View style={{ alignItems: 'center', gap: 12, marginTop: 8 }}>
                <Text style={{ color: ACCENT, fontSize: 16, fontWeight: '700' }}>
                  {t('ancestralConnection.rytual_zakonczony', '✓ Rytuał zakończony')}
                </Text>
                <Text style={{ color: subColor, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                  {t('ancestralConnection.dziekujesz_przodkom_za_ich_obecnosc', 'Dziękujesz przodkom za ich obecność. Ich mądrość jest teraz w twoim sercu.')}
                </Text>
                <Pressable onPress={resetTimer} style={[styles.timerResetBtn, { borderColor: ACCENT + '44' }]}>
                  <RotateCcw size={16} color={ACCENT} />
                  <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>{t('ancestralConnection.powtorz_rytual', 'Powtórz rytuał')}</Text>
                </Pressable>
              </View>
            )}

            <View style={[styles.timerInfoCard, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 24 }]}>
              <Text style={{ color: ACCENT, fontSize: 11, letterSpacing: 1.5, marginBottom: 6 }}>{t('ancestralConnection.dlaczego_11_minut', 'DLACZEGO 11 MINUT?')}</Text>
              <Text style={{ color: subColor, fontSize: 13, lineHeight: 20 }}>
                {t('ancestralConnection.liczba_11_to_w_numerologi', 'Liczba 11 to w numerologii liczba intuicji i połączenia z wyższymi wymiarami. 11 minut ciszy otwiera bramę między teraźniejszością a pamięcią przodków.')}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── SECTION: GRATITUDE CARDS ── */}
        {activeSection === 'gratitude' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={[styles.sectionDesc, { color: subColor }]}>
              {t('ancestralConnection.napisz_slowa_wdziecznos_do_trzech', 'Napisz słowa wdzięczności do trzech przodków. Wyraź, za co jesteś im wdzięczny/-a.')}
            </Text>

            {gratitudes.map((g, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(i * 80).duration(400)}>
                <View style={[styles.gratCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <View style={[styles.gratNum, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '44' }]}>
                      <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
                    </View>
                    <TextInput
                      value={g.to}
                      onChangeText={val => setGratitudes(prev => prev.map((x, j) => j === i ? { ...x, to: val } : x))}
                      placeholder={t('ancestralConnection.dla_kogo_imie_lub_relacja', 'Dla kogo? (imię lub relacja)')}
                      placeholderTextColor={subColor}
                      returnKeyType="done"
                      onFocus={() => {
                        setTimeout(() => scrollRef.current?.scrollTo({ y: 120 + i * 180, animated: true }), 200);
                      }}
                      style={[styles.gratToInput, { color: textColor, borderColor: cardBorder }]}
                    />
                  </View>
                  <TextInput
                    value={g.text}
                    onChangeText={val => setGratitudes(prev => prev.map((x, j) => j === i ? { ...x, text: val } : x))}
                    placeholder={t('ancestralConnection.twoje_slowa_wdziecznos', 'Twoje słowa wdzięczności...')}
                    placeholderTextColor={subColor}
                    multiline
                    returnKeyType="done"
                    onFocus={() => {
                      setTimeout(() => scrollRef.current?.scrollTo({ y: 160 + i * 180, animated: true }), 200);
                    }}
                    style={[styles.gratTextInput, { color: textColor, borderColor: cardBorder }]}
                  />
                </View>
              </Animated.View>
            ))}

            <Pressable
              onPress={saveGratitudes}
              style={[styles.saveBtn, { backgroundColor: gratitudeSaved ? '#10B981' : ACCENT }]}
            >
              <Text style={{ color: '#020A04', fontSize: 15, fontWeight: '700' }}>
                {gratitudeSaved ? '✓ Zapisano z miłością' : 'Zachowaj wdzięczność'}
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* ── SECTION: ANCESTRAL SYMBOLS ── */}
        {activeSection === 'symbols' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={[styles.sectionDesc, { color: subColor }]}>
              {t('ancestralConnection.dotknij_symbolu_by_poznac_jego', 'Dotknij symbolu, by poznać jego znaczenie w tradycji ancestralnej.')}
            </Text>

            <View style={styles.symbolGrid}>
              {SYMBOLS.map((sym, i) => {
                const isActive = activeSymbol === sym.id;
                return (
                  <Animated.View key={sym.id} entering={FadeInDown.delay(50 + i * 55).duration(350)} style={styles.symbolCellWrap}>
                    <Pressable
                      onPress={() => { HapticsService.impactLight(); setActiveSymbol(isActive ? null : sym.id); }}
                      style={[
                        styles.symbolChip,
                        {
                          backgroundColor: isActive ? ACCENT + '22' : cardBg,
                          borderColor: isActive ? ACCENT + '66' : cardBorder,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 28, marginBottom: 4 }}>{sym.icon}</Text>
                      <Text style={{ color: isActive ? ACCENT : textColor, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                        {sym.label}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            {activeSymbolData && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <View style={[styles.symbolDetail, { backgroundColor: ACCENT + '0D', borderColor: ACCENT + '33' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Text style={{ fontSize: 26 }}>{activeSymbolData.icon}</Text>
                    <Text style={{ color: ACCENT, fontSize: 16, fontWeight: '700' }}>{activeSymbolData.label}</Text>
                  </View>
                  <Text style={{ color: textColor, fontSize: 14, lineHeight: 22 }}>
                    {activeSymbolData.desc}
                  </Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* ── SECTION: CONNECTION RITUAL STEPS ── */}
        {activeSection === 'ritual' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={[styles.sectionDesc, { color: subColor }]}>
              {t('ancestralConnection.5_etapowy_rytual_polaczenia_z', '5-etapowy rytuał połączenia z przodkami. Wykonuj go wieczorem przy świecy w spokojnym miejscu.')}
            </Text>

            <View style={[styles.progressBar, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={[styles.progressFill, { width: `${(checkedSteps.length / RITUAL_STEPS.length) * 100}%`, backgroundColor: ACCENT }]} />
              <Text style={[styles.progressLabel, { color: subColor }]}>
                {checkedSteps.length}/{RITUAL_STEPS.length} ukończonych
              </Text>
            </View>

            {RITUAL_STEPS.map((step, i) => {
              const done = checkedSteps.includes(step.id);
              return (
                <Animated.View key={step.id} entering={FadeInDown.delay(60 + i * 70).duration(400)}>
                  <Pressable
                    onPress={() => toggleStep(step.id)}
                    style={[
                      styles.stepCard,
                      {
                        backgroundColor: done ? ACCENT + '14' : cardBg,
                        borderColor: done ? ACCENT + '44' : cardBorder,
                      },
                    ]}
                  >
                    <View style={{ marginTop: 2 }}>
                      {done
                        ? <CheckCircle2 size={22} color={ACCENT} />
                        : <CircleIcon size={22} color={subColor} />
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <View style={[styles.stepNumBadge, { backgroundColor: done ? ACCENT : ACCENT + '33' }]}>
                          <Text style={{ color: done ? '#020A04' : ACCENT, fontSize: 11, fontWeight: '700' }}>{step.id}</Text>
                        </View>
                        <Text style={{ color: textColor, fontSize: 14, fontWeight: '700', flex: 1 }}>
                          {step.title}
                        </Text>
                      </View>
                      <Text style={{ color: subColor, fontSize: 12, lineHeight: 18 }}>{step.desc}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}

            {checkedSteps.length === RITUAL_STEPS.length && (
              <Animated.View entering={FadeInDown.duration(500)}>
                <View style={[styles.completionCard, { backgroundColor: ACCENT + '14', borderColor: ACCENT + '44' }]}>
                  <Text style={{ fontSize: 24, marginBottom: 6 }}>🌳</Text>
                  <Text style={{ color: ACCENT, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
                    {t('ancestralConnection.rytual_ukonczony', 'Rytuał ukończony')}
                  </Text>
                  <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, textAlign: 'center' }}>
                    {t('ancestralConnection.polaczyles_sie_ze_swoja_linia', 'Połączyłeś się ze swoją linią przodków. Ich mądrość jest teraz częścią ciebie.')}
                  </Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        )}

        <EndOfContentSpacer />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* ── MODAL: Edit tree node ── */}
      <Modal
        visible={editNode !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditNode(null)}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 20 : 40}
        >
        <Pressable style={styles.modalOverlay} onPress={() => setEditNode(null)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: isDark ? '#0D1F10' : '#F0FAF4', borderColor: ACCENT + '33' }]} onPress={(e) => e.stopPropagation()}>
            <Text style={{ color: subColor, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>
              {t('ancestralConnection.edytuj_przodka', 'EDYTUJ PRZODKA')}
            </Text>
            <Text style={{ color: textColor, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
              {editNode?.label}
            </Text>
            <TextInput
              value={editInput}
              onChangeText={setEditInput}
              placeholder={t('ancestralConnection.imie_i_nazwisko', 'Imię i nazwisko...')}
              placeholderTextColor={subColor}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveEdit}
              style={[styles.modalInput, { color: textColor, borderColor: ACCENT + '44', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(240,228,210,0.90)' }]}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Pressable
                onPress={() => setEditNode(null)}
                style={[styles.modalBtn, { backgroundColor: cardBg, borderColor: cardBorder, flex: 1 }]}
              >
                <Text style={{ color: subColor, fontSize: 14, fontWeight: '600' }}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={saveEdit}
                style={[styles.modalBtn, { backgroundColor: ACCENT, flex: 1 }]}
              >
                <Text style={{ color: '#020A04', fontSize: 14, fontWeight: '700' }}>{t('common.save')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
        </SafeAreaView>
</View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen,
    paddingBottom: 12,
    gap: 12,
    paddingTop: 6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRail: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: layout.padding.screen,
    paddingBottom: 12,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(110,231,183,0.25)',
    backgroundColor: 'rgba(110,231,183,0.06)',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },

  // Tree
  treeCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  nameDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Message
  invokeBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  invokeBtnInner: {
    paddingVertical: 22,
    alignItems: 'center',
    gap: 4,
  },
  invokeBtnIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  invokeBtnLabel: {
    color: '#020A04',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  invokeBtnSub: {
    fontSize: 12,
  },
  messageCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 8,
  },
  placeholderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 8,
  },

  // Timer
  timerCircleWrap: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  timerLabelAbsolute: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerResetBtn: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  timerInfoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    width: '100%',
  },

  // Gratitude
  gratCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  gratNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gratToInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    borderBottomWidth: 1,
    paddingVertical: 4,
  },
  gratTextInput: {
    fontSize: 13,
    lineHeight: 20,
    minHeight: 70,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    textAlignVertical: 'top',
  },
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 8,
  },

  // Symbols
  symbolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  symbolCellWrap: {
    width: (SW - layout.padding.screen * 2 - 10 * 2) / 3,
  },
  symbolChip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  symbolDetail: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },

  // Ritual steps
  progressBar: {
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 10,
    opacity: 0.4,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  stepNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  modalSheet: {
    width: SW - 32,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  modalInput: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  modalBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
  },
});
