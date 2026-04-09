// @ts-nocheck
import { useNetworkStatus } from '../core/hooks/useNetworkStatus';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, Text, Dimensions, TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient, RadialGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Line, G, Ellipse, Text as SvgText, Defs, Stop } from 'react-native-svg';
import {
  ArrowRight, Compass, Flame, HeartHandshake,
  MoonStar, ShieldAlert, Sparkles, Clock, BookOpen,
  Brain, Zap, Star, Moon, Heart, Wind, ScrollText,
  MessageCircle, History, ChevronDown, ChevronUp,
  TrendingUp, Award, Calendar, Lightbulb, HelpCircle,
  Users, Send, Briefcase, Leaf, Infinity, RefreshCw,
  Eye, Map, Sunset, Feather, Layers,
} from 'lucide-react-native';
import Animated, {
  FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withTiming, withSequence, withDelay,
  Easing, interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { useOracleStore } from '../store/useOracleStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { AiService } from '../core/services/ai.service';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');

// ── AURORA ORB — animated glow blob ──────────────────────────
const AuroraOrb = React.memo(({ size, x, y, color, delay = 0 }: { size: number; x: number; y: number; color: string; delay?: number }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.10);
  useEffect(() => {
    scale.value = withDelay(delay, withRepeat(withSequence(
      withTiming(1.35, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      withTiming(1.0, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
    ), -1, false));
    opacity.value = withDelay(delay, withRepeat(withSequence(
      withTiming(0.22, { duration: 5000 }),
      withTiming(0.08, { duration: 5000 }),
    ), -1, false));
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return (
    <Animated.View pointerEvents="none" style={[animStyle, {
      position: 'absolute',
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
    }]} />
  );
});

// ── TEMATYCZNE TŁO SVG — Oracle ──────────────────────────────
const OracleHeroBg = ({ isDark }: { isDark: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isDark ? ['#04030A', '#080616', '#0C0820'] : ['#F9F5FF', '#F2EAFF', '#EBE0FF']}
      style={StyleSheet.absoluteFill}
    />
    {/* Animated aurora orbs */}
    <AuroraOrb size={380} x={SW * 0.15} y={180} color="#7C3AED" delay={0} />
    <AuroraOrb size={300} x={SW * 0.88} y={320} color="#2563EB" delay={1800} />
    <AuroraOrb size={260} x={SW * 0.55} y={560} color="#DB2777" delay={3200} />
    <AuroraOrb size={200} x={SW * 0.08} y={480} color="#A78BFA" delay={900} />
    {/* SVG rings */}
    <Svg width={SW} height="100%" style={StyleSheet.absoluteFill} opacity={isDark ? 0.18 : 0.10}>
      <G>
        <Circle cx={SW / 2} cy={220} r={170} stroke="#A78BFA" strokeWidth={0.8} fill="none" strokeDasharray="4 10" />
        <Circle cx={SW / 2} cy={220} r={115} stroke="#A78BFA" strokeWidth={0.6} fill="none" strokeDasharray="2 7" />
        <Circle cx={SW / 2} cy={220} r={62} stroke="#C4B5FD" strokeWidth={1.2} fill="none" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30) * Math.PI / 180;
          return (
            <Line key={i}
              x1={SW/2 + Math.cos(a)*62} y1={220 + Math.sin(a)*62}
              x2={SW/2 + Math.cos(a)*170} y2={220 + Math.sin(a)*170}
              stroke="#A78BFA" strokeWidth={0.4} opacity={0.6}
            />
          );
        })}
        {Array.from({ length: 24 }, (_, i) => (
          <Circle key={'s'+i} cx={(i*137+30)%SW} cy={(i*89+50)%700} r={i%4===0?2.2:i%2===0?1.2:0.7} fill="#DDD6FE" opacity={0.15+i%3*0.08} />
        ))}
      </G>
    </Svg>
  </View>
);

// ── PULSING RING — hero orb animation ────────────────────────
const PulsingRings = React.memo(({ accent }: { accent: string }) => {
  const s1 = useSharedValue(1); const o1 = useSharedValue(0.7);
  const s2 = useSharedValue(1); const o2 = useSharedValue(0.5);
  useEffect(() => {
    s1.value = withRepeat(withTiming(2.6, { duration: 2400, easing: Easing.out(Easing.ease) }), -1, false);
    o1.value = withRepeat(withTiming(0, { duration: 2400 }), -1, false);
    s2.value = withDelay(1200, withRepeat(withTiming(2.6, { duration: 2400, easing: Easing.out(Easing.ease) }), -1, false));
    o2.value = withDelay(1200, withRepeat(withTiming(0, { duration: 2400 }), -1, false));
  }, []);
  const a1 = useAnimatedStyle(() => ({ transform: [{ scale: s1.value }], opacity: o1.value }));
  const a2 = useAnimatedStyle(() => ({ transform: [{ scale: s2.value }], opacity: o2.value }));
  return (
    <>
      <Animated.View pointerEvents="none" style={[a1, { position: 'absolute', width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderColor: accent }]} />
      <Animated.View pointerEvents="none" style={[a2, { position: 'absolute', width: 76, height: 76, borderRadius: 38, borderWidth: 1.5, borderColor: accent + 'BB' }]} />
    </>
  );
});

// ── ORACLE MODES ─────────────────────────────────────────────
const ORACLE_MODES = [
  {
    id: 'gentle',
    label: 'Łagodny Oracle',
    eyebrow: 'PRZEWODNIK',
    color: '#60A5FA',
    Icon: Heart,
    desc: 'Spokojne rozmowy, bez nacisku. Łagodna przestrzeń do eksploracji uczuć i potrzeb.',
    cta: 'Spokojne wejście',
    prompt: 'Chcę porozmawiać spokojnie i bez oceniania. Pomóż mi się zorientować, co teraz czuję.',
    sessionKind: 'gentle',
    guideWhen: 'Gdy jesteś zmęczony/a, zagubiony/a lub po prostu potrzebujesz kogoś, kto wysłucha bez oceniania. Idealny na co dzień i w chwilach kryzysu emocjonalnego.',
  },
  {
    id: 'growth',
    label: 'Oracle Rozwoju',
    eyebrow: 'MENTOR',
    color: '#34D399',
    Icon: Zap,
    desc: 'Konkretne wyzwania i pytania napędowe. Dla osób gotowych na zmianę.',
    cta: 'Rozwój i działanie',
    prompt: 'Chcę pracować nad konkretną zmianą w moim życiu. Zadaj mi pytania, które mnie popchnę do przodu.',
    sessionKind: 'growth',
    guideWhen: 'Gdy czujesz stagnację i chcesz się ruszyć z miejsca. Dobry do pracy nad konkretnym celem, nawykiem lub decyzją.',
  },
  {
    id: 'shadow',
    label: 'Praca z Cieniem',
    eyebrow: 'GŁĘBIA',
    color: '#F472B6',
    Icon: ShieldAlert,
    desc: 'Jungowska praca z nieświadomymi wzorcami. Nie dla osób szukających prostych odpowiedzi.',
    cta: 'Wejdź w głąb',
    prompt: 'Chcę pracować z moim cieniem. Pomóż mi zobaczyć nieświadome wzorce, które powtarzam.',
    sessionKind: 'shadow',
    guideWhen: 'Gdy dostrzegasz powtarzające się wzorce w życiu, relacjach lub reakcjach i chcesz zrozumieć ich głęboką przyczynę.',
  },
  {
    id: 'astro',
    label: 'Oracle Astrologii',
    eyebrow: 'NIEBO',
    color: '#CEAE72',
    Icon: MoonStar,
    desc: 'Interpretacja tranzytów, progresji i kontekstu kosmicznego dla Twojej sytuacji.',
    cta: 'Zapytaj gwiazdy',
    prompt: 'Chcę zrozumieć, co mówi niebo o mojej obecnej sytuacji i kierunku.',
    sessionKind: 'astrology',
    guideWhen: 'Gdy chcesz zrozumieć kosmiczny kontekst swoich doświadczeń lub szukasz zewnętrznego punktu odniesienia dla decyzji.',
  },
  {
    id: 'dream',
    label: 'Oracle Snów',
    eyebrow: 'PODŚWIADOMOŚĆ',
    color: '#818CF8',
    Icon: Moon,
    desc: 'Symboliczna interpretacja snów, archetypów i obrazów nocy.',
    cta: 'Opowiedz sen',
    prompt: 'Chcę zinterpretować sen lub powtarzający się symbol z mojego życia wewnętrznego.',
    sessionKind: 'dream',
    guideWhen: 'Gdy sen Cię niepokoił lub zaintrygował. Idealny rano, zanim obrazy snu wyblakną.',
  },
  {
    id: 'relationship',
    label: 'Oracle Relacji',
    eyebrow: 'POŁĄCZENIE',
    color: '#FB923C',
    Icon: HeartHandshake,
    desc: 'Dynamika par, wzorce przywiązania i języki miłości.',
    cta: 'Relacje i więź',
    prompt: 'Chcę zrozumieć dynamikę w ważnej dla mnie relacji lub wzorce, które powtarzam w związkach.',
    sessionKind: 'relationship',
    guideWhen: 'Gdy masz trudności w relacji, konflikt lub chcesz głębiej zrozumieć swój styl przywiązania i wzorce partnerskie.',
  },
];

const EXPERT_MODES = [
  {
    id: 'tarot_reading',
    label: 'Odczyt Tarota',
    color: '#A97A39',
    Icon: ScrollText,
    desc: 'Głęboka interpretacja kart — od codziennej do całkowitego rzutu na rok.',
    cta: 'Zacznij odczyt',
    prompt: 'Chcę głęboki odczyt tarota dla mojej obecnej sytuacji życiowej.',
    sessionKind: 'tarot',
    guideWhen: 'Gdy szukasz szerszego wglądu w sytuację lub chcesz symbolicznie spojrzeć na swój czas.',
  },
  {
    id: 'numerology_session',
    label: 'Sesja Numerologiczna',
    color: '#7B6FAA',
    Icon: Brain,
    desc: 'Liczby życia, ścieżki i cykle numerologiczne w kontekście Twojego pytania.',
    cta: 'Analiza liczb',
    prompt: 'Chcę pracować z moją numerologią — zrozumieć wzorce w liczbach mojego życia.',
    sessionKind: 'numerology',
    guideWhen: 'Gdy chcesz odkryć ukryte wzorce w datach i liczbach swojego życia, lub zrozumieć swój obecny cykl.',
  },
  {
    id: 'ritual_guidance',
    label: 'Prowadzenie Rytuału',
    color: '#E8705A',
    Icon: Flame,
    desc: 'Spersonalizowany rytuał stworzony na bazie Twojej sytuacji i intencji.',
    cta: 'Stwórz rytuał',
    prompt: 'Potrzebuję prowadzonego rytuału dopasowanego do mojej aktualnej potrzeby lub intencji.',
    sessionKind: 'ritual',
    guideWhen: 'Gdy przechodzisz przez przejście (zakończenie, nowy początek, pełnia księżyca) i chcesz nadać mu ceremonialną formę.',
  },
  {
    id: 'affirmation_session',
    label: 'Sesja Afirmacji',
    color: '#4A9FA5',
    Icon: Wind,
    desc: 'Spersonalizowane afirmacje i mantry zbudowane z Twoich własnych słów.',
    cta: 'Twoje afirmacje',
    prompt: 'Chcę stworzyć osobiste afirmacje pasujące do mojego aktualnego wyzwania.',
    sessionKind: 'affirmation',
    guideWhen: 'Gdy chcesz wzmocnić pozytywne nastawienie lub przepisać ograniczające przekonania własnymi słowami.',
  },
];

// ── PYTANIA PRZEWODNIE ────────────────────────────────────────
const GUIDED_QUESTIONS = [
  { category: 'Relacje', color: '#FB923C', emoji: '💞', questions: [
    'Dlaczego powtarzam ten sam wzorzec w relacjach?',
    'Czego naprawdę szukam w bliskości?',
    'Jak mogę lepiej wyrażać swoje potrzeby?',
  ]},
  { category: 'Praca', color: '#34D399', emoji: '⚡', questions: [
    'Co powstrzymuje mnie przed realizacją mojego powołania?',
    'Jak znaleźć balans między pracą a odpoczynkiem?',
    'Co daje mi prawdziwe poczucie sensu zawodowego?',
  ]},
  { category: 'Duchowość', color: '#A78BFA', emoji: '✨', questions: [
    'Jaką lekcję niesie moja obecna sytuacja?',
    'W czym muszę zaufać procesowi?',
    'Co chce się we mnie obudzić w tym czasie?',
  ]},
  { category: 'Zdrowie', color: '#60A5FA', emoji: '🌿', questions: [
    'Jakie emocje noszę w ciele?',
    'Czego potrzebuje moje ciało, czego mu odmawiałem/am?',
    'Jak mogę lepiej zadbać o siebie?',
  ]},
  { category: 'Finanse', color: '#CEAE72', emoji: '🪙', questions: [
    'Jakie przekonania o pieniądzach przejąłem/am z domu?',
    'Czego się boję w kontekście bezpieczeństwa materialnego?',
    'Co blokuje mój przepływ obfitości?',
  ]},
  { category: 'Sny', color: '#818CF8', emoji: '🌙', questions: [
    'Co powtarzający się obraz mówi o mojej podświadomości?',
    'Jaki symbol z mojego snu nosi ważne przesłanie?',
    'Czego się boję, że śni mi się nocami?',
  ]},
  { category: 'Intuicja', color: '#F472B6', emoji: '🔮', questions: [
    'Czego naprawdę chcę, pod warstwą tego, czego powinienem/am chcieć?',
    'Jaka decyzja wydaje się słuszna, nawet jeśli nie umiem jej uzasadnić?',
    'Co mówi mi cicho moja intuicja od dłuższego czasu?',
  ]},
  { category: 'Lęki', color: '#F97316', emoji: '🌑', questions: [
    'Czego naprawdę się boję pod tym konkretnym lękiem?',
    'Jak ten strach chroni mnie przed czymś głębszym?',
    'Co by się stało, gdybym zrobił/a to, czego się boję?',
  ]},
];

// ── DAILY ORACLE WISDOM ──────────────────────────────────────
const ORACLE_DAILY_WISDOMS = [
  'Twoja wrażliwość nie jest słabością — to precyzyjny instrument do poruszania się w świecie.',
  'To, czego unikasz, czeka na Ciebie w ciemności. Ale to, czego szukasz, też tam jest.',
  'Cisza nie jest brakiem odpowiedzi — często jest odpowiedzią, której się boisz.',
  'Każda blokada to zaproszenie do głębszego spojrzenia na siebie.',
  'Moc nie polega na braku strachu, ale na działaniu mimo niego.',
  'Granice, które stawiasz, mówią światu, czego naprawdę pragniesz.',
  'Twoje rany nie definiują Cię — ale zrozumienie ich zmienia wszystko.',
  'To, co powtarza się w Twoim życiu, chce być w końcu usłyszane.',
  'Nie szukaj odpowiedzi na zewnątrz — Oracle tylko odbija to, co już wiesz.',
  'Zmiana nie zaczyna się od decyzji — zaczyna się od odwagi do zobaczenia prawdy.',
  'Integracja cienia to nie walka z ciemnością — to zaproszenie jej do domu.',
  'Twoje relacje są zwierciadłem Twojego stosunku do siebie.',
];

// ── MAIN SCREEN ───────────────────────────────────────────────
export const OraclePortalScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const isOnline = useNetworkStatus();
  const { t } = useTranslation();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { isLight } = useTheme();
  const { currentSession, pastSessions } = useOracleStore();
  const isDark = !isLight;
  const accent = '#A78BFA';
  const firstName = userData.name?.trim() || 'Wędrowcze';
  const sessionCount = (currentSession ? 1 : 0) + pastSessions.length;
  const lastSession = currentSession || pastSessions[0];
  const [activeTab, setActiveTab] = useState<'wejście' | 'tryby' | 'historia'>('wejście');
  const [intentionText, setIntentionText] = useState('');

  // New section states
  const [ceremonialMode, setCeremonialMode] = useState(false);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCeremonialModal, setShowCeremonialModal] = useState(false);
  const [ceremonialIntention, setCeremonialIntention] = useState('');

  const textColor = isLight ? '#1A1410' : '#F0EAF8';
  const subColor = isLight ? '#6A4A8A' : '#9A8AC0';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,92,180,0.38)' : 'rgba(167,139,250,0.30)';

  // Daily oracle wisdom — deterministic per day
  const dailyWisdomIdx = new Date().getDate() % ORACLE_DAILY_WISDOMS.length;
  const dailyWisdom = ORACLE_DAILY_WISDOMS[dailyWisdomIdx];

  // Stats computed from pastSessions
  const thisWeekSessions = pastSessions.filter(s => {
    if (!s.startedAt) return false;
    const d = new Date(s.startedAt);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;

  const avgMessages = pastSessions.length > 0
    ? Math.round(pastSessions.reduce((sum, s) => sum + (s.messages?.length || 0), 0) / pastSessions.length)
    : 0;

  const modeCounts: Record<string, number> = {};
  pastSessions.forEach(s => {
    const k = s.sessionKind || s.initialMode || 'general';
    modeCounts[k] = (modeCounts[k] || 0) + 1;
  });
  const favoriteMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0];
  const favModeLabel = favoriteMode
    ? (ORACLE_MODES.find(m => m.sessionKind === favoriteMode[0] || m.id === favoriteMode[0])?.label
       || EXPERT_MODES.find(m => m.sessionKind === favoriteMode[0] || m.id === favoriteMode[0])?.label
       || favoriteMode[0])
    : null;

  // Last 5 questions from pastSessions (first user message)
  const lastQuestions = pastSessions
    .slice(0, 10)
    .map(s => {
      const firstUserMsg = s.messages?.find(m => m.role === 'user');
      if (!firstUserMsg) return null;
      return {
        text: firstUserMsg.content || firstUserMsg.text || '',
        date: s.startedAt || '',
        id: s.id,
      };
    })
    .filter(q => q && q.text.length > 0)
    .slice(0, 5);

  const openSession = (prompt: string, mode: string, kind: string) => {
    const finalPrompt = ceremonialMode
      ? `[TRYB CEREMONIALNY: Proszę o rytualne i ceremonialne prowadzenie. Intencja: "${ceremonialIntention || 'Otwartość na wgląd'}". Pytanie/kontekst:] ${prompt}`
      : prompt;
    navigation.navigate('OracleChat', {
      context: finalPrompt, source: 'oracle_tab',
      forceNewSession: true, sessionKind: kind, initialMode: mode,
    });
  };

  return (
    <View style={[op.container, { backgroundColor: isLight ? '#FAF6FF' : '#06050C' }]}>
      <OracleHeroBg isDark={!isLight} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}>
      <SafeAreaView edges={['top']} style={op.safeArea}>

        {/* ── TABS ── */}
        <View style={[op.tabBar, { backgroundColor: isLight ? 'rgba(167,139,250,0.08)' : 'rgba(167,139,250,0.10)', borderColor: accent + '33' }]}>
          {([
            { id: 'wejście', label: 'Wejście', Icon: Sparkles },
            { id: 'tryby', label: 'Tryby', Icon: Layers },
            { id: 'historia', label: 'Historia', Icon: History },
          ] as const).map(({ id: tab, label, Icon }) => (
            <Pressable key={tab} onPress={() => setActiveTab(tab as any)}
              style={[op.tab, activeTab === tab && { backgroundColor: accent }]}>
              {activeTab === tab && (
                <LinearGradient colors={[accent, accent + 'CC']} style={StyleSheet.absoluteFill} />
              )}
              <Icon color={activeTab === tab ? (isLight ? '#1A1410' : '#FFF') : accent + 'BB'} size={13} strokeWidth={activeTab === tab ? 2.0 : 1.6} />
              <Text style={[op.tabText, { color: activeTab === tab ? (isLight ? '#1A1410' : '#FFF') : accent + 'BB' }]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[op.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'tight') + 24 }]}
          showsVerticalScrollIndicator={false}
        >

          {/* ── OFFLINE CARD ── */}
          {!isOnline && (
            <Animated.View entering={FadeInDown.duration(400)}>
              <View style={[op.offlineCard, { backgroundColor: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.25)' }]}>
                <View style={op.offlineHeader}>
                  <Sparkles color="#F97316" size={18} strokeWidth={1.8} />
                  <Text style={op.offlineEyebrow}>{t('oracle.oracle_w_ciszy', '✦ ORACLE W CISZY')}</Text>
                </View>
                <Text style={[op.offlineTitle, { color: textColor }]}>{t('oracle.polaczenie_z_oracle_chwilowo_niedos', 'Połączenie z Oracle chwilowo niedostępne')}</Text>
                <Text style={[op.offlineBody, { color: subColor }]}>
                  {t('oracle.oracle_powroci_gdy_polaczenie_zosta', 'Oracle powróci, gdy połączenie zostanie przywrócone. W tym czasie możesz przeglądać tryby lub zapisać intencję w dzienniku.')}
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('Journal')}
                  style={op.offlineBtn}
                >
                  <Text style={op.offlineBtnText}>{t('common.retry')}</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* ── TAB: WEJŚCIE ── */}
          {activeTab === 'wejście' && (
            <>
              {/* Hero */}
              <Animated.View entering={FadeInDown.duration(500)}>
                <View style={[op.hero, { borderColor: accent + '55', backgroundColor: isLight ? 'rgba(167,139,250,0.06)' : 'rgba(167,139,250,0.08)' }]}>
                  <LinearGradient colors={[accent + '30', accent + '12', 'transparent']} style={StyleSheet.absoluteFill} />
                  <LinearGradient
                    colors={['transparent', accent + 'DD', 'transparent'] as [string,string,string]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 }}
                    pointerEvents="none"
                  />
                  <View style={{ position: 'absolute', top: 10, right: 40, width: 8, height: 8, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: accent + '88' }} pointerEvents="none" />
                  <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <PulsingRings accent={accent} />
                    <View style={[op.heroOrb, { backgroundColor: accent + '22', borderColor: accent + '55', marginBottom: 0 }]}>
                      <Sparkles color={accent} size={32} strokeWidth={1.3} />
                    </View>
                  </View>
                  <Pressable
                    onPress={() => { if (isFavoriteItem('oracle_portal')) { removeFavoriteItem('oracle_portal'); } else { addFavoriteItem({ id: 'oracle_portal', label: 'Oracle Portal', route: 'Oracle', params: {}, icon: 'Sparkles', color: accent, addedAt: new Date().toISOString() }); } }}
                    style={{ position: 'absolute', top: 12, right: 12, padding: 8 }}
                    hitSlop={8}
                  >
                    <Star
                      color={isFavoriteItem('oracle_portal') ? accent : accent + '88'}
                      size={16} strokeWidth={1.8}
                      fill={isFavoriteItem('oracle_portal') ? accent : 'none'}
                    />
                  </Pressable>
                  <Text style={[op.heroEyebrow, { color: accent, letterSpacing: 3.5 }]}>{t('oracle.aethera_oracle', '✦ AETHERA ORACLE')}</Text>
                  <Text style={[op.heroTitle, { color: textColor, fontSize: 28, fontWeight: '200', letterSpacing: -1.0 }]}>Twoja prywatna{'\n'}komnata rozmowy.</Text>
                  <Text style={[op.heroSub, { color: subColor }]}>
                    {t('oracle.oracle_to_przewodnik_ktory_nie', 'Oracle to przewodnik, który nie daje gotowych odpowiedzi — pomaga Ci dojść do własnych. Każda sesja to przestrzeń bez oceny.')}
                  </Text>
                  <View style={op.heroStats}>
                    <View style={[op.statPill, { borderColor: accent + '33', backgroundColor: accent + '12' }]}>
                      <Clock color={accent} size={12} />
                      <Text style={[op.statText, { color: accent }]}>{sessionCount} sesji</Text>
                    </View>
                    {lastSession && (
                      <View style={[op.statPill, { borderColor: cardBorder, backgroundColor: 'transparent' }]}>
                        <Text style={[op.statText, { color: subColor }]}>
                          Ostatnia: {lastSession.title || 'Prywatna sesja'}
                        </Text>
                      </View>
                    )}
                    {ceremonialMode && (
                      <View style={[op.statPill, { borderColor: '#CEAE72' + '55', backgroundColor: '#CEAE72' + '18' }]}>
                        <Text style={[op.statText, { color: '#CEAE72' }]}>{t('oracle.ceremonial', '🕯️ Ceremonial')}</Text>
                      </View>
                    )}
                  </View>
                  <Pressable
                    onPress={() => !isOnline ? undefined : openSession(`Pomóż mi nazwać jeden spokojny krok na dziś, ${firstName}.`, 'gentle', 'general')}
                    style={[op.heroCta, { backgroundColor: 'transparent', overflow: 'hidden', opacity: isOnline ? 1 : 0.45 }]}
                  >
                    <LinearGradient
                      colors={[accent, '#7C3AED', accent + 'CC']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Sparkles color="#FFF" size={16} strokeWidth={1.8} />
                    <Text style={[op.heroCtaText, { color: '#FFF' }]}>{t('oracle.startSession')}</Text>
                    <ArrowRight color="#FFF" size={18} />
                  </Pressable>
                </View>
              </Animated.View>

              {/* ── ORACLE DNIA ── */}
              <Animated.View entering={FadeInDown.delay(60).duration(450)}>
                <View style={[op.oracleDayCard, { backgroundColor: isLight ? 'rgba(167,139,250,0.08)' : 'rgba(167,139,250,0.10)', borderColor: accent + '44' }]}>
                  <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFill} />
                  <View style={op.oracleDayHeader}>
                    <View style={[op.oracleDayOrb, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
                      <Sparkles color={accent} size={16} strokeWidth={1.8} />
                    </View>
                    <Text style={[op.sectionEyebrow, { color: accent, marginBottom: 0 }]}>{t('oracle.oracle_dnia', '✦ ORACLE DNIA')}</Text>
                  </View>
                  <Text style={[op.oracleDayText, { color: textColor }]}>"{dailyWisdom}"</Text>
                  <Text style={[op.oracleDaySub, { color: subColor }]}>{t('oracle.codziennie_nowe_przeslanie_odswiez_', 'Codziennie nowe przesłanie · Odśwież jutro')}</Text>
                </View>
              </Animated.View>

              {/* ── OSTATNIA SESJA ── */}
              {lastSession && (
                <Animated.View entering={FadeInDown.delay(80).duration(450)}>
                  <View style={[op.lastSessionCard, { backgroundColor: cardBg, borderColor: accent + '35' }]}>
                    <LinearGradient colors={[accent + '12', 'transparent']} style={StyleSheet.absoluteFill} />
                    <Text style={[op.sectionEyebrow, { color: accent }]}>{t('oracle.ostatnia_sesja', '📖 OSTATNIA SESJA')}</Text>
                    <View style={op.lastSessionRow}>
                      <View style={[op.lastSessionIcon, { backgroundColor: accent + '20', borderColor: accent + '44' }]}>
                        <MessageCircle color={accent} size={18} strokeWidth={1.8} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[op.lastSessionTitle, { color: textColor }]} numberOfLines={1}>
                          {lastSession.title || 'Sesja Oracle'}
                        </Text>
                        <Text style={[op.lastSessionMeta, { color: subColor }]}>
                          {lastSession.messages?.length || 0} wiadomości
                          {lastSession.startedAt ? ' · ' + new Date(lastSession.startedAt).toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        </Text>
                        {(() => {
                          const firstUserMsg = lastSession.messages?.find(m => m.role === 'user');
                          const snippet = firstUserMsg ? (firstUserMsg.content || firstUserMsg.text || '') : null;
                          if (!snippet) return null;
                          return (
                            <Text style={[op.lastSessionSnippet, { color: subColor }]} numberOfLines={2}>
                              "{snippet.length > 90 ? snippet.slice(0, 90) + '…' : snippet}"
                            </Text>
                          );
                        })()}
                      </View>
                    </View>
                    <Pressable
                      onPress={() => navigation.navigate('OracleChat', { sessionId: lastSession.id })}
                      style={[op.lastSessionBtn, { backgroundColor: accent + '22', borderColor: accent + '44' }]}
                    >
                      <Text style={[op.lastSessionBtnText, { color: accent }]}>{t('oracle.continueSession')}</Text>
                      <ArrowRight color={accent} size={13} />
                    </Pressable>
                  </View>
                </Animated.View>
              )}

              {/* ── TRYB CEREMONIALNY ── */}
              <Animated.View entering={FadeInDown.delay(100).duration(450)}>
                <View style={[op.ceremonialCard, {
                  backgroundColor: ceremonialMode
                    ? (isLight ? 'rgba(206,174,114,0.10)' : 'rgba(206,174,114,0.12)')
                    : cardBg,
                  borderColor: ceremonialMode ? '#CEAE72' + '55' : cardBorder,
                }]}>
                  <LinearGradient
                    colors={ceremonialMode ? ['#CEAE72' + '20', 'transparent'] : ['transparent', 'transparent']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={op.ceremonialHeader}>
                    <View style={[op.ceremonialIconWrap, {
                      backgroundColor: ceremonialMode ? '#CEAE72' + '28' : accent + '14',
                      borderColor: ceremonialMode ? '#CEAE72' + '55' : cardBorder,
                    }]}>
                      <Flame color={ceremonialMode ? '#CEAE72' : accent} size={20} strokeWidth={1.6} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[op.sectionEyebrow, { color: ceremonialMode ? '#CEAE72' : accent, marginBottom: 2 }]}>
                        {t('oracle.tryb_ceremonial', '🕯️ TRYB CEREMONIALNY')}
                      </Text>
                      <Text style={[op.ceremonialDesc, { color: subColor }]}>
                        {ceremonialMode
                          ? 'Aktywny — sesje otrzymają rytualną oprawę'
                          : 'Dodaje intencję i oprawę ceremonialną do sesji'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        if (!ceremonialMode) setShowCeremonialModal(true);
                        else setCeremonialMode(false);
                      }}
                      style={[op.ceremonialToggle, {
                        backgroundColor: ceremonialMode ? '#CEAE72' : (isLight ? 'rgba(255,246,230,0.92)' : 'rgba(255,255,255,0.08)'),
                        borderColor: ceremonialMode ? '#CEAE72' : cardBorder,
                      }]}
                    >
                      <Text style={[op.ceremonialToggleText, { color: ceremonialMode ? '#FFF' : subColor }]}>
                        {ceremonialMode ? 'WŁ' : 'WYŁ'}
                      </Text>
                    </Pressable>
                  </View>
                  {ceremonialMode && ceremonialIntention.trim() ? (
                    <View style={[op.ceremonialIntentionBadge, { borderColor: '#CEAE72' + '33', backgroundColor: '#CEAE72' + '10' }]}>
                      <Text style={[op.ceremonialIntentionText, { color: '#CEAE72' }]}>
                        Intencja: "{ceremonialIntention}"
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Animated.View>

              {/* ── PYTANIA PRZEWODNIE ── */}
              <Animated.View entering={FadeInDown.delay(130).duration(450)}>
                <View style={[op.questionsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <LinearGradient colors={[accent + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                  <Text style={[op.sectionEyebrow, { color: accent }]}>{t('oracle.pytania_przewodnie', '💡 PYTANIA PRZEWODNIE')}</Text>
                  <Text style={[op.questionsSub, { color: subColor }]}>{t('oracle.dotknij_pytania_by_uzyc_go', 'Dotknij pytania, by użyć go w sesji')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                    {GUIDED_QUESTIONS.map(cat => (
                      <Pressable
                        key={cat.category}
                        onPress={() => setSelectedCategory(selectedCategory === cat.category ? null : cat.category)}
                        style={[op.categoryChip, {
                          borderColor: selectedCategory === cat.category ? cat.color : cat.color + '55',
                          backgroundColor: selectedCategory === cat.category ? cat.color + '22' : 'transparent',
                        }]}
                      >
                        <Text style={{ fontSize: 13 }}>{cat.emoji}</Text>
                        <Text style={[op.categoryChipText, { color: selectedCategory === cat.category ? cat.color : subColor }]}>
                          {cat.category}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  {selectedCategory && (() => {
                    const cat = GUIDED_QUESTIONS.find(c => c.category === selectedCategory);
                    if (!cat) return null;
                    return (
                      <View style={{ gap: 8, marginTop: 10 }}>
                        {cat.questions.map((q, qi) => (
                          <Pressable
                            key={qi}
                            onPress={() => !isOnline ? undefined : openSession(q, 'gentle', 'general')}
                            style={[op.questionRow, {
                              borderColor: cat.color + '33',
                              backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)',
                              opacity: isOnline ? 1 : 0.45,
                            }]}
                          >
                            <LinearGradient colors={[cat.color + '14', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                            <View style={[op.questionDot, { backgroundColor: cat.color }]} />
                            <Text style={[op.questionText, { color: textColor }]} numberOfLines={2}>{q}</Text>
                            <ArrowRight color={cat.color} size={14} opacity={0.8} />
                          </Pressable>
                        ))}
                      </View>
                    );
                  })()}
                </View>
              </Animated.View>

              {/* ── STATYSTYKI ORACLE ── */}
              {sessionCount > 0 && (
                <Animated.View entering={FadeInDown.delay(160).duration(450)}>
                  <View style={[op.statsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <LinearGradient colors={[accent + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                    <Text style={[op.sectionEyebrow, { color: accent }]}>{t('oracle.statystyki_oracle', '📊 STATYSTYKI ORACLE')}</Text>
                    <View style={op.statsGrid}>
                      <View style={[op.statBlock, { borderColor: accent + '22', backgroundColor: accent + '08' }]}>
                        <Text style={[op.statBlockNum, { color: accent }]}>{sessionCount}</Text>
                        <Text style={[op.statBlockLabel, { color: subColor }]}>{t('oracle.sesji_lacznie', 'Sesji łącznie')}</Text>
                      </View>
                      <View style={[op.statBlock, { borderColor: '#34D399' + '22', backgroundColor: '#34D399' + '08' }]}>
                        <Text style={[op.statBlockNum, { color: '#34D399' }]}>{thisWeekSessions}</Text>
                        <Text style={[op.statBlockLabel, { color: subColor }]}>{t('oracle.ten_tydzien', 'Ten tydzień')}</Text>
                      </View>
                      <View style={[op.statBlock, { borderColor: '#60A5FA' + '22', backgroundColor: '#60A5FA' + '08' }]}>
                        <Text style={[op.statBlockNum, { color: '#60A5FA' }]}>{avgMessages || '—'}</Text>
                        <Text style={[op.statBlockLabel, { color: subColor }]}>{t('oracle.sr_wiadomosci', 'Śr. wiadomości')}</Text>
                      </View>
                      <View style={[op.statBlock, { borderColor: '#FB923C' + '22', backgroundColor: '#FB923C' + '08' }]}>
                        <Text style={[op.statBlockNum, { color: '#FB923C', fontSize: 11 }]} numberOfLines={1}>
                          {favModeLabel ? favModeLabel.split(' ').slice(0, 2).join('\n') : '—'}
                        </Text>
                        <Text style={[op.statBlockLabel, { color: subColor }]}>{t('oracle.ulubiony_tryb', 'Ulubiony tryb')}</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* ── MOJE PYTANIA ── */}
              {lastQuestions.length > 0 && (
                <Animated.View entering={FadeInDown.delay(190).duration(450)}>
                  <View style={[op.myQuestionsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <LinearGradient colors={[accent + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                    <Text style={[op.sectionEyebrow, { color: accent }]}>{t('oracle.moje_pytania', '🗂 MOJE PYTANIA')}</Text>
                    <Text style={[op.questionsSub, { color: subColor }]}>{t('oracle.ostatnie_pytania_z_twoich_sesji', 'Ostatnie pytania z Twoich sesji')}</Text>
                    {lastQuestions.map((q, i) => (
                      <Pressable
                        key={i}
                        onPress={() => navigation.navigate('OracleChat', { initialQuestion: q.text, forceNewSession: true, source: 'oracle_portal' })}
                        style={[op.myQRow, { borderColor: cardBorder, backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.03)' }]}
                      >
                        <View style={[op.myQNum, { backgroundColor: accent + '18' }]}>
                          <Text style={[op.myQNumText, { color: accent }]}>{i + 1}</Text>
                        </View>
                        <Text style={[op.myQText, { color: textColor }]} numberOfLines={2}>{q.text}</Text>
                        <ArrowRight color={subColor} size={13} opacity={0.5} />
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}

              {/* Chambers Card */}
              <Animated.View entering={FadeInDown.delay(220).duration(450)}>
                <View style={[op.chambersCard, { backgroundColor: cardBg, borderColor: accent + '30' }]}>
                  <LinearGradient colors={[accent + '14', 'transparent']} style={StyleSheet.absoluteFill} />
                  <Text style={[op.sectionEyebrow, { color: accent }]}>{t('oracle.szybkie_wejscia', '⚡ SZYBKIE WEJŚCIA')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                    {([
                      { label: 'Pytanie dnia', eyebrow: 'CODZIENNIE', desc: 'Nazwij jedno pytanie, z którym wchodzisz w ten dzień', color: '#CEAE72', Icon: Compass, kind: 'daily', prompt: `Pomóż mi nazwać jedno ważne pytanie na dziś, ${firstName}.` },
                      { label: 'Tarot AI', eyebrow: 'SYMBOLE', desc: 'Karta i jej przesłanie dla Ciebie w tym momencie', color: '#F472B6', Icon: ScrollText, kind: 'tarot', prompt: `Chcę głęboki odczyt jednej karty tarota dla mojej aktualnej sytuacji, ${firstName}.` },
                      { label: 'Praca z cieniem', eyebrow: 'GŁĘBIA', desc: 'Eksploracja wzorców, które powtarzają się w Twoim życiu', color: '#818CF8', Icon: ShieldAlert, kind: 'shadow', prompt: `Chcę pracować z moim cieniem — pomóż mi zobaczyć wzorzec, który powtarzam.` },
                      { label: 'Rytuał prowadzony', eyebrow: 'INTENCJA', desc: 'Spersonalizowana ceremonia stworzona dla Twojej potrzeby', color: '#FB923C', Icon: Flame, kind: 'ritual', prompt: `Potrzebuję prowadzonego rytuału dopasowanego do mojej aktualnej intencji.` },
                    ] as const).map((item, i) => {
                      const tileW = (SW - layout.padding.screen * 2 - 36 - 10) / 2;
                      return (
                        <Pressable
                          key={item.label}
                          onPress={() => !isOnline ? undefined : openSession(item.prompt, item.kind, item.kind)}
                          style={{
                            width: tileW, borderRadius: 20, borderWidth: 1, overflow: 'hidden',
                            borderColor: item.color + '55',
                            opacity: isOnline ? 1 : 0.45,
                            minHeight: 136,
                          }}
                        >
                          <LinearGradient
                            colors={[item.color + '30', item.color + '10', 'transparent']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                          />
                          <LinearGradient
                            colors={['transparent', item.color + 'AA', 'transparent'] as [string,string,string]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 }}
                            pointerEvents="none"
                          />
                          <View style={{ position: 'absolute', top: 8, right: 10, width: 7, height: 7, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: item.color + '70' }} pointerEvents="none" />
                          <View style={{ padding: 14, gap: 7 }}>
                            <View style={{
                              width: 44, height: 44, borderRadius: 14,
                              backgroundColor: item.color + '28', borderWidth: 1, borderColor: item.color + '55',
                              alignItems: 'center', justifyContent: 'center',
                              shadowColor: item.color, shadowOpacity: 0.45, shadowRadius: 8, elevation: 4,
                            }}>
                              <item.Icon color={item.color} size={20} strokeWidth={1.6} />
                            </View>
                            <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: item.color }}>{item.eyebrow}</Text>
                            <Text style={{ fontSize: 13, fontWeight: '800', letterSpacing: -0.1, color: textColor }}>{item.label}</Text>
                            <Text style={{ fontSize: 11, lineHeight: 16, color: subColor, opacity: 0.9 }}>{item.desc}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </Animated.View>

              {/* How it works */}
              <Animated.View entering={FadeInDown.delay(260).duration(400)}>
                <View style={[op.howCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[op.sectionEyebrow, { color: accent }]}>{t('oracle.jak_dziala_oracle', '🔮 JAK DZIAŁA ORACLE')}</Text>
                  {[
                    { step: '01', title: 'Wybierz tryb', desc: 'Każdy tryb daje Oracle inny kontekst i cel rozmowy.' },
                    { step: '02', title: 'Zadaj pytanie', desc: 'Im konkretniejsze pytanie, tym głębsza i trafniejsza odpowiedź.' },
                    { step: '03', title: 'Idź głębiej', desc: 'Oracle zadaje pytania napędowe i prowadzi do konkretnego kroku.' },
                  ].map((s, i) => (
                    <View key={s.step} style={[op.howStep, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: cardBorder }]}>
                      <View style={[op.howNum, { backgroundColor: accent + '20', borderColor: accent + '44' }]}>
                        <Text style={[op.howNumText, { color: accent }]}>{s.step}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[op.howTitle, { color: textColor }]}>{s.title}</Text>
                        <Text style={[op.howDesc, { color: subColor }]}>{s.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>
            </>
          )}

          {/* ── TAB: TRYBY ── */}
          {activeTab === 'tryby' && (
            <>
              <Animated.View entering={FadeInDown.duration(400)}>
                <Text style={[op.tabSectionTitle, { color: textColor }]}>{t('oracle.tryby_specjalist', 'Tryby specjalistyczne')}</Text>
                <Text style={[op.tabSectionSub, { color: subColor }]}>{t('oracle.kazdy_tryb_aktywuje_inny_profil', 'Każdy tryb aktywuje inny profil Oracle — inny kontekst, inne pytania, inny cel.')}</Text>
              </Animated.View>

              {/* 2-col grid for 6 specialist modes */}
              <Animated.View entering={FadeInDown.delay(60).duration(400)}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {ORACLE_MODES.map((mode) => {
                    const modeW = (SW - 40 - 10) / 2;
                    return (
                      <Pressable
                        key={mode.id}
                        onPress={() => !isOnline ? undefined : openSession(mode.prompt, mode.id, mode.sessionKind)}
                        style={{ width: modeW, borderRadius: 22, borderWidth: 1, overflow: 'hidden',
                          borderColor: mode.color + '55',
                          opacity: isOnline ? 1 : 0.45, minHeight: 168,
                          shadowColor: mode.color, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
                        }}
                      >
                        <LinearGradient
                          colors={[mode.color + '2C', mode.color + '10', 'transparent']}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                        />
                        <LinearGradient
                          colors={['transparent', mode.color + 'CC', 'transparent'] as [string,string,string]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 }}
                          pointerEvents="none"
                        />
                        <View style={{ position: 'absolute', top: 9, right: 11, width: 7, height: 7, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: mode.color + '70' }} pointerEvents="none" />
                        <View style={{ padding: 14, flex: 1, gap: 6 }}>
                          <View style={{
                            width: 46, height: 46, borderRadius: 15,
                            backgroundColor: mode.color + '2C', borderWidth: 1, borderColor: mode.color + '66',
                            alignItems: 'center', justifyContent: 'center',
                            shadowColor: mode.color, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5,
                          }}>
                            <mode.Icon color={mode.color} size={21} strokeWidth={1.5} />
                          </View>
                          <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: mode.color }}>{mode.eyebrow}</Text>
                          <Text style={{ fontSize: 13, fontWeight: '800', letterSpacing: -0.1, color: textColor }}>{mode.label}</Text>
                          <Text style={{ fontSize: 11, lineHeight: 16, color: subColor }} numberOfLines={3}>{mode.desc}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: mode.color }}>{mode.cta}</Text>
                            <ArrowRight color={mode.color} size={11} />
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>

              <Text style={[op.tabSectionTitle, { color: textColor, marginTop: 20 }]}>{t('oracle.tryby_eksperckie', 'Tryby eksperckie')}</Text>

              {/* 2-col grid for 4 expert modes */}
              <Animated.View entering={FadeInDown.delay(120).duration(400)}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {EXPERT_MODES.map((mode) => {
                    const modeW = (SW - 40 - 10) / 2;
                    return (
                      <Pressable
                        key={mode.id}
                        onPress={() => !isOnline ? undefined : openSession(mode.prompt, mode.id, mode.sessionKind)}
                        style={{ width: modeW, borderRadius: 22, borderWidth: 1, overflow: 'hidden',
                          borderColor: mode.color + '55',
                          opacity: isOnline ? 1 : 0.45, minHeight: 155,
                          shadowColor: mode.color, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
                        }}
                      >
                        <LinearGradient
                          colors={[mode.color + '2C', mode.color + '10', 'transparent']}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                        />
                        <LinearGradient
                          colors={['transparent', mode.color + 'CC', 'transparent'] as [string,string,string]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 }}
                          pointerEvents="none"
                        />
                        <View style={{ position: 'absolute', top: 9, right: 11, width: 7, height: 7, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: mode.color + '70' }} pointerEvents="none" />
                        <View style={{ padding: 14, flex: 1, gap: 6 }}>
                          <View style={{
                            width: 46, height: 46, borderRadius: 15,
                            backgroundColor: mode.color + '2C', borderWidth: 1, borderColor: mode.color + '66',
                            alignItems: 'center', justifyContent: 'center',
                            shadowColor: mode.color, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5,
                          }}>
                            <mode.Icon color={mode.color} size={21} strokeWidth={1.5} />
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: '800', letterSpacing: -0.1, color: textColor }}>{mode.label}</Text>
                          <Text style={{ fontSize: 11, lineHeight: 16, color: subColor }} numberOfLines={3}>{mode.desc}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: mode.color }}>{mode.cta}</Text>
                            <ArrowRight color={mode.color} size={11} />
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>

              {/* ── PRZEWODNIK PO TRYBACH ── */}
              <Animated.View entering={FadeInDown.delay((ORACLE_MODES.length + EXPERT_MODES.length) * 70).duration(420)}>
                <View style={[op.guideCard, { backgroundColor: cardBg, borderColor: accent + '30' }]}>
                  <LinearGradient colors={[accent + '12', 'transparent']} style={StyleSheet.absoluteFill} />
                  <Text style={[op.sectionEyebrow, { color: accent }]}>{t('oracle.przewodnik_po_trybach', '📚 PRZEWODNIK PO TRYBACH')}</Text>
                  <Text style={[op.guideIntro, { color: subColor }]}>{t('oracle.kiedy_uzyc_kazdego_trybu', 'Kiedy użyć każdego trybu?')}</Text>
                  {[...ORACLE_MODES, ...EXPERT_MODES].map((mode, i) => (
                    <View key={mode.id}>
                      <Pressable
                        onPress={() => setExpandedGuide(expandedGuide === mode.id ? null : mode.id)}
                        style={[op.guideRow, {
                          borderColor: mode.color + '33',
                          backgroundColor: expandedGuide === mode.id ? mode.color + '12' : 'transparent',
                          borderTopWidth: i > 0 ? StyleSheet.hairlineWidth : 0,
                          borderTopColor: cardBorder,
                        }]}
                      >
                        <View style={[op.guideRowIcon, { backgroundColor: mode.color + '20', borderColor: mode.color + '44' }]}>
                          <mode.Icon color={mode.color} size={16} strokeWidth={1.8} />
                        </View>
                        <Text style={[op.guideRowLabel, { color: textColor }]}>{mode.label}</Text>
                        {expandedGuide === mode.id
                          ? <ChevronUp color={subColor} size={16} />
                          : <ChevronDown color={subColor} size={16} />
                        }
                      </Pressable>
                      {expandedGuide === mode.id && (
                        <Animated.View entering={FadeInDown.duration(300)}>
                          <View style={[op.guideExpanded, { borderColor: mode.color + '22', backgroundColor: mode.color + '08' }]}>
                            <Text style={[op.guideExpandedText, { color: subColor }]}>{mode.guideWhen || mode.desc}</Text>
                            <Pressable
                              onPress={() => !isOnline ? undefined : openSession(mode.prompt, mode.id, mode.sessionKind || mode.id)}
                              style={[op.guideExpandedBtn, { backgroundColor: mode.color + '20', borderColor: mode.color + '44' }]}
                            >
                              <Text style={[op.guideExpandedBtnText, { color: mode.color }]}>{t('oracle.wyprobuj_ten_tryb', 'Wypróbuj ten tryb')}</Text>
                              <ArrowRight color={mode.color} size={12} />
                            </Pressable>
                          </View>
                        </Animated.View>
                      )}
                    </View>
                  ))}
                </View>
              </Animated.View>

              {/* ── INTENCJA DNIA ── */}
              <Animated.View entering={FadeInDown.delay((ORACLE_MODES.length + EXPERT_MODES.length) * 70 + 60).duration(420)}>
                <View style={[op.intentionCard, { backgroundColor: cardBg, borderColor: accent + '40' }]}>
                  <LinearGradient colors={[accent + '14', 'transparent']} style={StyleSheet.absoluteFill} />
                  <Text style={[op.sectionEyebrow, { color: accent }]}>{t('oracle.intencja_dnia', '🕯️ INTENCJA DNIA')}</Text>
                  <Text style={[op.intentionTitle, { color: textColor }]}>{t('oracle.zanim_wejdziesz_w_sesje_ustaw', 'Zanim wejdziesz w sesję, ustaw intencję.')}</Text>
                  <TextInput
                    value={intentionText}
                    onChangeText={setIntentionText}
                    placeholder={t('oracle.napisz_co_chcesz_przeniesc_w', 'Napisz, co chcesz przenieść w tę rozmowę…')}
                    placeholderTextColor={subColor + 'AA'}
                    multiline
                    style={[op.intentionInput, {
                      color: textColor,
                      backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)',
                      borderColor: accent + '30',
                    }]}
                  />
                  <Pressable
                    onPress={() => {
                      if (intentionText.trim()) {
                        navigation.navigate('JournalEntry', {
                          type: 'reflection',
                          prompt: 'Moja intencja przed sesją Oracle: ' + intentionText,
                        });
                      }
                    }}
                    style={[op.intentionBtn, { backgroundColor: accent, opacity: intentionText.trim() ? 1 : 0.45 }]}
                  >
                    <BookOpen color="#FFF" size={15} strokeWidth={2} />
                    <Text style={op.intentionBtnText}>{t('common.save')}</Text>
                  </Pressable>
                </View>
              </Animated.View>
            </>
          )}

          {/* ── TAB: HISTORIA ── */}
          {activeTab === 'historia' && (
            <>
              {(currentSession || pastSessions.length > 0) ? (
                <>
                  <Text style={[op.tabSectionTitle, { color: textColor }]}>{t('oracle.twoje_sesje', 'Twoje sesje')}</Text>
                  {currentSession && (
                    <Animated.View entering={FadeInDown.duration(400)}>
                      <Pressable
                        onPress={() => navigation.navigate('OracleChat', { sessionId: currentSession.id })}
                        style={[op.historyRow, { borderColor: accent + '55', backgroundColor: isLight ? '#FFF8EE' : '#171C2E' }]}
                      >
                        <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFill} />
                        <View style={[op.historyIcon, { backgroundColor: accent + '22' }]}>
                          <MessageCircle color={accent} size={18} strokeWidth={1.8} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[op.historyBadge, { color: accent }]}>{t('oracle.aktywna_sesja', 'AKTYWNA SESJA')}</Text>
                          <Text style={[op.historyTitle, { color: textColor }]} numberOfLines={1}>{currentSession.title || 'Sesja w toku'}</Text>
                          <Text style={[op.historySub, { color: subColor }]}>{currentSession.messages?.length || 0} wiadomości</Text>
                        </View>
                        <ArrowRight color={accent} size={16} />
                      </Pressable>
                    </Animated.View>
                  )}
                  {pastSessions.slice(0, 12).map((session, i) => {
                    const sessionModeColor = ORACLE_MODES.find(m => m.id === session.initialMode || m.sessionKind === session.sessionKind)?.color || accent;
                    const firstUserMsg = session.messages?.find(m => m.role === 'user');
                    const snippet = firstUserMsg ? (firstUserMsg.content || firstUserMsg.text || '') : null;
                    return (
                      <Animated.View key={session.id} entering={FadeInDown.delay(i * 50).duration(380)}>
                        <Pressable
                          onPress={() => navigation.navigate('OracleChat', { sessionId: session.id })}
                          style={[op.historyRow, { borderColor: sessionModeColor + '44', backgroundColor: 'transparent' }]}
                        >
                          <LinearGradient
                            colors={[sessionModeColor + '16', sessionModeColor + '06', 'transparent']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                          />
                          <View style={[op.historyIcon, { backgroundColor: sessionModeColor + '20', borderWidth: 1, borderColor: sessionModeColor + '44' }]}>
                            <History color={sessionModeColor} size={16} strokeWidth={1.8} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[op.historyTitle, { color: textColor }]} numberOfLines={1}>{session.title || 'Sesja Oracle'}</Text>
                            {snippet ? (
                              <Text style={[op.historySub, { color: subColor }]} numberOfLines={1}>"{snippet.length > 50 ? snippet.slice(0, 50) + '…' : snippet}"</Text>
                            ) : null}
                            <Text style={[op.historySub, { color: subColor, opacity: 0.6, fontSize: 10 }]}>
                              {session.messages?.length || 0} wiad. · {session.startedAt ? new Date(session.startedAt).toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'short' }) : ''}
                            </Text>
                          </View>
                          <ArrowRight color={sessionModeColor} size={14} opacity={0.7} />
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </>
              ) : (
                <Animated.View entering={FadeInDown.duration(400)}>
                  <View style={[op.emptyState, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                    <Text style={{ fontSize: 40, marginBottom: 12 }}>✦</Text>
                    <Text style={[op.emptyTitle, { color: textColor }]}>{t('oracle.noHistory')}</Text>
                    <Text style={[op.emptySub, { color: subColor }]}>
                      {t('oracle.twoje_rozmowy_z_oracle_pojawia', 'Twoje rozmowy z Oracle pojawią się tutaj. Zacznij pierwszą sesję, aby zbudować osobisty zapis podróży.')}
                    </Text>
                    <Pressable
                      onPress={() => setActiveTab('wejście')}
                      style={[op.emptyBtn, { backgroundColor: accent }]}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>{t('oracle.zacznij_pierwsza_sesje', 'Zacznij pierwszą sesję')}</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              )}
            </>
          )}

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>
      </KeyboardAvoidingView>

      {/* ── CEREMONIAL MODE MODAL ── */}
      <Modal visible={showCeremonialModal} transparent animationType="fade" onRequestClose={() => setShowCeremonialModal(false)}>
        <Pressable style={op.modalOverlay} onPress={() => setShowCeremonialModal(false)}>
          <Pressable style={[op.modalSheet, { backgroundColor: isLight ? '#FAF6EE' : '#12101C', borderColor: '#CEAE72' + '44' }]} onPress={e => e.stopPropagation()}>
            <LinearGradient colors={['#CEAE72' + '18', 'transparent']} style={StyleSheet.absoluteFill} />
            <Text style={[op.modalTitle, { color: '#CEAE72' }]}>{t('oracle.tryb_ceremonial_1', '🕯️ Tryb Ceremonialny')}</Text>
            <Text style={[op.modalBody, { color: subColor }]}>
              {t('oracle.tryb_ceremonial_dodaje_intencje_i', 'Tryb ceremonialny dodaje intencję i rytualną oprawę do każdej sesji Oracle. Ustaw intencję na ten czas — to co chcesz przenieść, otworzyć lub zamknąć.')}
            </Text>
            <TextInput
              value={ceremonialIntention}
              onChangeText={setCeremonialIntention}
              placeholder={t('oracle.moja_intencja_na_ten_czas', 'Moja intencja na ten czas ceremonialny…')}
              placeholderTextColor={subColor + '88'}
              multiline
              style={[op.intentionInput, {
                color: textColor,
                backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)',
                borderColor: '#CEAE72' + '44',
                marginBottom: 4,
              }]}
            />
            <View style={op.modalBtnRow}>
              <Pressable onPress={() => setShowCeremonialModal(false)} style={[op.modalBtnSecondary, { borderColor: cardBorder }]}>
                <Text style={[op.modalBtnSecondaryText, { color: subColor }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={() => { setCeremonialMode(true); setShowCeremonialModal(false); }}
                style={[op.modalBtnPrimary, { backgroundColor: '#CEAE72' }]}
              >
                <Flame color="#FFF" size={15} />
                <Text style={op.modalBtnPrimaryText}>{t('oracle.aktywuj_ceremonie', 'Aktywuj ceremonię')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────────
const op = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 4, gap: 12 },

  tabBar: {
    flexDirection: 'row', borderWidth: 1, borderRadius: 22, marginHorizontal: 20,
    marginVertical: 10, overflow: 'hidden', padding: 4, gap: 3,
    shadowColor: '#A78BFA', shadowOpacity: 0.20, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 18, flexDirection: 'row', gap: 5, overflow: 'hidden' },
  tabText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  hero: {
    borderRadius: 28, borderWidth: 1, padding: 28, overflow: 'hidden',
    alignItems: 'center',
    shadowColor: '#A78BFA', shadowOpacity: 0.35, shadowRadius: 30, shadowOffset: { width: 0, height: 14 }, elevation: 12,
  },
  heroOrb: {
    width: 76, height: 76, borderRadius: 38, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  heroEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2.5, marginBottom: 6 },
  heroTitle: { fontSize: 26, fontWeight: '300', letterSpacing: -0.8, textAlign: 'center', lineHeight: 34, marginBottom: 10 },
  heroSub: { fontSize: 13, lineHeight: 24, textAlign: 'center', marginBottom: 16, opacity: 0.85 },
  heroStats: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statText: { fontSize: 11, fontWeight: '600' },
  heroCta: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 13,
    borderRadius: 999, width: '100%', justifyContent: 'center',
  },
  heroCtaText: { fontSize: 15, fontWeight: '700' },

  sectionEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 2.2, marginBottom: 14 },

  // Oracle Day
  oracleDayCard: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden', gap: 10 },
  oracleDayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  oracleDayOrb: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  oracleDayText: { fontSize: 15, lineHeight: 26, fontStyle: 'italic', fontWeight: '300', letterSpacing: 0.2 },
  oracleDaySub: { fontSize: 11, opacity: 0.6 },

  // Last Session
  lastSessionCard: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden', gap: 12 },
  lastSessionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  lastSessionIcon: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  lastSessionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  lastSessionMeta: { fontSize: 12, marginBottom: 6, opacity: 0.75 },
  lastSessionSnippet: { fontSize: 12, lineHeight: 18, fontStyle: 'italic', opacity: 0.7 },
  lastSessionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1, alignSelf: 'flex-start' },
  lastSessionBtnText: { fontSize: 12, fontWeight: '700' },

  // Ceremonial
  ceremonialCard: { borderRadius: 22, borderWidth: 1, padding: 16, overflow: 'hidden' },
  ceremonialHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ceremonialIconWrap: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ceremonialDesc: { fontSize: 12, lineHeight: 17 },
  ceremonialToggle: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1, flexShrink: 0 },
  ceremonialToggleText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  ceremonialIntentionBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, marginTop: 10 },
  ceremonialIntentionText: { fontSize: 12, fontStyle: 'italic', lineHeight: 18 },

  // Guided Questions
  questionsCard: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden', gap: 10 },
  questionsSub: { fontSize: 12, marginTop: -8, marginBottom: 4, opacity: 0.8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  categoryChipText: { fontSize: 12, fontWeight: '600' },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 12, overflow: 'hidden' },
  questionDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  questionText: { flex: 1, fontSize: 13, lineHeight: 19 },

  // Stats
  statsCard: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  statBlock: { flex: 1, minWidth: '44%', borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center', gap: 4 },
  statBlockNum: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  statBlockLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center', letterSpacing: 0.3 },

  // My Questions
  myQuestionsCard: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden', gap: 8 },
  myQRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 12 },
  myQNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  myQNumText: { fontSize: 11, fontWeight: '800' },
  myQText: { flex: 1, fontSize: 13, lineHeight: 18 },

  // Guide
  guideCard: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden', gap: 4 },
  guideIntro: { fontSize: 12, marginBottom: 8, opacity: 0.8 },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 0 },
  guideRowIcon: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  guideRowLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  guideExpanded: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 6, gap: 10 },
  guideExpandedText: { fontSize: 13, lineHeight: 20 },
  guideExpandedBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, alignSelf: 'flex-start' },
  guideExpandedBtnText: { fontSize: 12, fontWeight: '700' },

  chambersCard: { borderRadius: 24, borderWidth: 1, padding: 18, overflow: 'hidden' },
  chambersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chamberTile: {
    width: (SW - 40 - 28 - 10) / 2, borderRadius: 18, borderWidth: 1,
    padding: 14, overflow: 'hidden', gap: 8,
  },
  chamberIcon: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chamberLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  chamberDesc: { fontSize: 11, lineHeight: 16, opacity: 0.8 },

  howCard: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden' },
  howStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  howNum: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  howNumText: { fontSize: 11, fontWeight: '800' },
  howTitle: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  howDesc: { fontSize: 12, lineHeight: 18, opacity: 0.8 },

  tabSectionTitle: { fontSize: 20, fontWeight: '300', letterSpacing: -0.5, marginTop: 8, marginBottom: 4 },
  tabSectionSub: { fontSize: 13, lineHeight: 19, marginBottom: 14, opacity: 0.8 },

  modeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, borderWidth: 1,
    padding: 18, overflow: 'hidden',
    shadowColor: '#A78BFA', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  modeIcon: { width: 54, height: 54, borderRadius: 27, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  modeEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 },
  modeLabel: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  modeDesc: { fontSize: 12, lineHeight: 17, opacity: 0.8 },
  modeCta: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, flexShrink: 0,
  },
  modeCtaText: { fontSize: 11, fontWeight: '700' },

  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, borderWidth: 1,
    padding: 16, overflow: 'hidden',
    shadowColor: '#A78BFA', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  historyIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  historyBadge: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 },
  historyTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  historySub: { fontSize: 12, opacity: 0.7 },

  emptyState: {
    borderRadius: 22, borderWidth: 1, borderStyle: 'dashed', padding: 32,
    alignItems: 'center', marginTop: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 13, lineHeight: 20, textAlign: 'center', opacity: 0.8, marginBottom: 24 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },

  offlineCard: {
    borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden', gap: 8,
  },
  offlineHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 2 },
  offlineEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 2.0, color: '#F97316' },
  offlineTitle: { fontSize: 15, fontWeight: '700', lineHeight: 22 },
  offlineBody: { fontSize: 13, lineHeight: 20, opacity: 0.85 },
  offlineBtn: {
    alignSelf: 'flex-start', marginTop: 4,
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
    backgroundColor: 'rgba(249,115,22,0.18)', borderWidth: 1, borderColor: 'rgba(249,115,22,0.35)',
  },
  offlineBtnText: { fontSize: 13, fontWeight: '700', color: '#F97316' },

  intentionCard: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden', gap: 10, marginTop: 8 },
  intentionTitle: { fontSize: 14, lineHeight: 20, fontWeight: '500', marginBottom: 4, opacity: 0.9 },
  intentionInput: {
    borderWidth: 1, borderRadius: 14, padding: 14,
    fontSize: 14, lineHeight: 22, minHeight: 80, textAlignVertical: 'top',
  },
  intentionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 18, paddingVertical: 11, borderRadius: 999, alignSelf: 'flex-start',
  },
  intentionBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { borderRadius: 28, borderWidth: 1, padding: 24, margin: 16, overflow: 'hidden', gap: 14 },
  modalTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  modalBody: { fontSize: 13, lineHeight: 21, textAlign: 'center' },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtnSecondary: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  modalBtnSecondaryText: { fontSize: 14, fontWeight: '600' },
  modalBtnPrimary: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 14 },
  modalBtnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
