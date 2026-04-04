// @ts-nocheck
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  KeyboardAvoidingView, Keyboard, Platform, Pressable, ScrollView, StyleSheet, View, Text, TextInput,
  Share, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle as SvgCircle, G, Ellipse as SvgEllipse } from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import {
  ChevronLeft, Star, Heart, Sparkles, BookOpen, ArrowRight, Waves, MoonStar,
  NotebookPen, Trophy, Share2, Search, TrendingUp, Quote, Trash2,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { useAppStore, GratitudeEntry } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { MysticalInput } from '../components/MysticalInput';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const ACCENT = '#FBBF24';

const GratitudeBg = ({ isDark }: { isDark: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isDark ? ['#0A0804', '#120E06', '#1A1408'] : ['#FFFBEB', '#FEFCE8', '#FFF9E6']}
      style={StyleSheet.absoluteFill}
    />
  </View>
);

// ── HEART BLOOM 3D ────────────────────────────────────────────
const ORBIT_ANGLES = [0, 60, 120, 180, 240, 300];

const HeartBloom3D = React.memo(({ accent }: { accent: string }) => {
  const bloom  = useSharedValue(0.85);
  const rot    = useSharedValue(0);
  const tiltX  = useSharedValue(-6);
  const tiltY  = useSharedValue(0);

  useEffect(() => {
    bloom.value = withRepeat(withSequence(withTiming(1.0, { duration: 2800 }), withTiming(0.85, { duration: 2800 })), -1, false);
    rot.value   = withRepeat(withTiming(360, { duration: 22000, easing: Easing.linear }), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-20, Math.min(20, -6 + e.translationY * 0.25));
      tiltY.value = Math.max(-20, Math.min(20, e.translationX * 0.25));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-6, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 520 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }, { scale: bloom.value }],
  }));
  const orbitStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot.value}deg` }] }));

  const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={outerStyle}>
          <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={200} height={200} viewBox="-100 -100 200 200" style={StyleSheet.absoluteFill}>
              {PETAL_ANGLES.map((deg, i) => (
                <G key={i} transform={`rotate(${deg})`}>
                  <SvgEllipse cx={0} cy={-38} rx={14} ry={26} fill={accent + '55'} stroke={accent} strokeWidth={1.2} />
                </G>
              ))}
              <SvgCircle cx={0} cy={0} r={18} fill={accent} opacity={0.25} />
              <SvgCircle cx={0} cy={0} r={10} fill={accent} opacity={0.7} />
            </Svg>
            <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, orbitStyle]}>
              <Svg width={200} height={200} viewBox="-100 -100 200 200">
                {ORBIT_ANGLES.map((deg, i) => {
                  const rad = deg * Math.PI / 180;
                  return (
                    <SvgCircle key={i} cx={72 * Math.cos(rad)} cy={72 * Math.sin(rad)} r={i === 0 ? 5 : 3} fill={accent} opacity={0.65} />
                  );
                })}
              </Svg>
            </Animated.View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

interface InspirationCard {
  title: string;
  body: string;
  color: string;
}

const INSPIRATION_CARDS: InspirationCard[] = [
  {
    title: 'Ciało jako dar',
    body: 'Twoje ciało pracuje dla Ciebie bez przerwy — każdy oddech to akt troski, który odbywa się bez Twojej świadomości. Dziś zatrzymaj się przy jednej jego funkcji i poczuj, jak wiele dostałaś lub dostałeś za darmo.',
    color: '#F472B6',
  },
  {
    title: 'Ciche wsparcie',
    body: 'Ktoś w Twoim otoczeniu daje Ci coś stałego — obecność, słowo, gest, który bierzesz za pewnik. Wdzięczność dla tej osoby, wypowiedziana choćby w myśli, wzmacnia więź silniej niż wiele słów.',
    color: '#FBBF24',
  },
  {
    title: 'Złota chwila dnia',
    body: 'Każdy dzień ma swój jeden moment, który — gdybyś go zauważyła lub zauważył — mógłby stać się kotwicą dobra. Nie musi być wielki: wystarczy herbata, promień słońca, cisza przed odpowiedzią.',
    color: '#34D399',
  },
  {
    title: 'Bezpieczna przestrzeń',
    body: 'Miejsce, do którego wracasz, to nie tylko ściany — to suma decyzji, które pozwoliły Ci stworzyć choćby minimalną ostoję spokoju. Wdzięczność za bezpieczny kąt to wdzięczność za własną siłę sprawczą.',
    color: '#60A5FA',
  },
  {
    title: 'Dar, który dajesz',
    body: 'Coś, co dla Ciebie jest naturalne, dla kogoś innego może być właśnie tym, czego szuka: spokój, słuch, umiejętność, patrzenie wprost. Twoje talenty nie są tylko Twoje — są też dla innych.',
    color: '#A78BFA',
  },
  {
    title: 'Natura jako nauczyciel',
    body: 'Drzewo nie walczy z wiatrem, a fala nie tłumaczy się z głośności. Natura jest wzorem trwania bez dramatyzmu — i dziś przyniosła Ci jeden taki obrazek. Co w niej widziałaś lub widziałeś?',
    color: '#6EE7B7',
  },
  {
    title: 'Trudność, która uczyła',
    body: 'To, co Cię kiedyś złamało, jest teraz częścią Twojej głębi — i nie byłabyś lub byłbyś tą osobą bez tamtego doświadczenia. Wdzięczność za trudność to jeden z najtwardszych, ale też najbardziej wyzwalających aktów odwagi.',
    color: '#F97316',
  },
  {
    title: 'Mistrz w drodze',
    body: 'Ktoś przekazał Ci wiedzę, postawę albo pytanie, które zmieniło Twój kierunek — może to był nauczyciel, może obcy człowiek, może książka. Pamiętasz tę osobę? Nosi w sobie ślad Twojej drogi.',
    color: '#FBBF24',
  },
];

// ── WEEKLY WISDOM QUOTES ────────────────────────────────────────────────────
const WEEKLY_QUOTES = [
  { text: 'Wdzięczność zamienia to, co mamy, w wystarczająco dużo.', author: 'Melody Beattie' },
  { text: 'Cichym sekretem głębokiej radości jest wdzięczność za to, co jest — nie za to, co będzie.', author: 'Aethera' },
  { text: 'Kiedy wyrażamy wdzięczność, musimy nigdy zapominać, że największe uznanie nie polega na wypowiadaniu słów, ale na życiu nimi.', author: 'John F. Kennedy' },
  { text: 'Wdzięczność jest najzdrowszą ze wszystkich ludzkich emocji. Im wyrażasz więcej wdzięczności za to, co masz, tym więcej będziesz miał za co być wdzięcznym.', author: 'Zig Ziglar' },
  { text: 'Dwa rodzaje wdzięczności: nagłe zachwycenie się pięknem tego, co masz, i spokojne odczuwanie, że to wystarczy.', author: 'Aethera' },
  { text: 'Wdzięczność jest nie tylko największą z cnót, ale też rodzicem wszystkich pozostałych.', author: 'Cyceron' },
  { text: 'Serce skupione na wdzięczności nie ma miejsca na pretensje. To jest wybór, który można podjąć każdego ranka.', author: 'Aethera' },
];

// ── DEEP GRATITUDE PROMPTS ──────────────────────────────────────────────────
const DEEP_PROMPTS = [
  {
    q: 'Czego nauczyłeś/nauczyłaś się z czegoś trudnego?',
    hint: 'Pomyśl o wyzwaniu, które zmieniło Cię na lepsze — nawet jeśli wtedy bolało.',
    color: '#F97316',
  },
  {
    q: 'Kto zmienił Twoje życie i nigdy o tym nie wie?',
    hint: 'Może to przypadkowy człowiek, nauczyciel, autor książki — ktoś, kto nie zdaje sobie sprawy ze swojego wpływu.',
    color: '#A78BFA',
  },
  {
    q: 'Za co w sobie jesteś wdzięczny/wdzięczna?',
    hint: 'Własna siła, cecha charakteru, coś, co w sobie cenisz — nawet jeśli rzadko o tym mówisz.',
    color: '#34D399',
  },
];

export const GratitudeScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeName, gratitudeEntries, addGratitudeEntry, deleteGratitudeEntry, addFavoriteItem, isFavoriteItem, removeFavoriteItem, userData } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');
  const isDark = !isLight;
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor  = isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.60)';
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.10)';
  const aiAvailable = AiService.isLaunchAvailable();
  const aiState = AiService.getLaunchAvailabilityState();

  const today = new Date().toISOString().split('T')[0];
  const todayEntries = gratitudeEntries.filter(e => e.date === today);
  const todayEntry = todayEntries[0];
  const [slots, setSlots] = useState<string[]>(() => {
    if (todayEntry) return [...todayEntry.items, '', '', ''].slice(0, 3);
    return ['', '', ''];
  });
  const [saved, setSaved] = useState(todayEntry != null);
  const [aiReflection, setAiReflection] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Deep gratitude prompts state
  const [deepAnswers, setDeepAnswers] = useState<string[]>(['', '', '']);
  const [deepSaved, setDeepSaved] = useState<boolean[]>([false, false, false]);
  const [activeDeepIdx, setActiveDeepIdx] = useState<number | null>(null);

  // 30-day challenge state
  const [challengeDays, setChallengeDays] = useState<Set<string>>(new Set());

  // Favorites toggle state
  const [favoriteEntryIds, setFavoriteEntryIds] = useState<Set<string>>(new Set());

  // Pattern analysis
  const [patternText, setPatternText] = useState('');
  const [patternLoading, setPatternLoading] = useState(false);

  // Keyboard height
  const [keyboardH, setKeyboardH] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => setKeyboardH(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardH(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const focusIntoView = (y: number) => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(y - 150, 0), animated: true }), 180);
  };

  const inspirationCard = useMemo(() => INSPIRATION_CARDS[new Date().getDate() % INSPIRATION_CARDS.length], []);

  // Weekly quote — changes each week
  const weeklyQuote = useMemo(() => {
    const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    return WEEKLY_QUOTES[weekNum % WEEKLY_QUOTES.length];
  }, []);

  const streak = useMemo(() => {
    let s = 0;
    const d = new Date();
    for (let i = 0; i < 30; i++) {
      const ds = new Date(d); ds.setDate(ds.getDate() - i);
      const key = ds.toISOString().split('T')[0];
      if (gratitudeEntries.some(e => e.date === key)) s++; else break;
    }
    return s;
  }, [gratitudeEntries]);

  const last7 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      return { key, done: gratitudeEntries.some(e => e.date === key) };
    });
  }, [gratitudeEntries]);

  // 30-day challenge grid — last 30 days
  const challengeGrid = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().split('T')[0];
      const done = gratitudeEntries.some(e => e.date === key) || challengeDays.has(key);
      return { key, done, dayNum: i + 1 };
    });
  }, [gratitudeEntries, challengeDays]);

  const challengeCompletion = useMemo(() => {
    const done = challengeGrid.filter(d => d.done).length;
    return Math.round((done / 30) * 100);
  }, [challengeGrid]);

  const toggleChallengeDay = useCallback((key: string) => {
    void HapticsService.impact();
    setChallengeDays(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const toggleFavoriteEntry = useCallback((id: string) => {
    void HapticsService.impact();
    setFavoriteEntryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const favoriteEntries = useMemo(() =>
    gratitudeEntries.filter(e => favoriteEntryIds.has(e.id)),
    [gratitudeEntries, favoriteEntryIds]
  );

  const handleSave = async () => {
    const filled = slots.filter(s => s.trim().length > 0);
    if (filled.length === 0) return;
    void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
    if (!saved) {
      const entry: GratitudeEntry = {
        id: `gr_${Date.now()}`,
        date: today,
        items: filled,
      };
      addGratitudeEntry(entry);
    }
    setSaved(true);
    if (aiAvailable && filled.length > 0) {
      setAiLoading(true);
      try {
        const personLine = userData?.name ? `${userData.name} jest wdzięczna/wdzięczny za:` : 'Ta osoba jest wdzięczna za:';
        const streakLine = streak > 1 ? ` To już ${streak}. dzień z rzędu praktyki wdzięczności.` : '';
        const msgs = [{
          role: 'user' as const,
          content: `${personLine} ${filled.map((f, i) => `${i + 1}. ${f}`).join('; ')}.${streakLine}

Napisz głęboką, osobistą refleksję (3-4 zdania) która:
— Odnosi się konkretnie do tego, za co dana osoba jest wdzięczna — nie ogólnie
— Pokazuje, dlaczego właśnie te rzeczy są głęboko znaczące w jej życiu
— Poszerza ten moment wdzięczności w kierunku duchowego przebudzenia
— Kończy się jednym zdaniem, które będzie chciało się zapamiętać

Pisz w języku użytkownika, ciepło i precyzyjnie — jakbyś pisał do kogoś bliskiego.`,
        }];
        const localizedMsgs = i18n.language?.startsWith('en')
          ? [{
              role: 'user' as const,
              content: `Here is what this person is grateful for:\n${gratitudeEntries.flatMap(e => e.items).slice(-12).map((it, i) => `${i + 1}. ${it}`).join('\n')}\n\nWrite one short reflection that:\n- Refers directly to what this person is grateful for\n- Shows why these things matter deeply in their life\n- Expands this gratitude toward spiritual awakening\n- Ends with one memorable sentence\n\nWrite in English, warm and precise, as if writing to someone close.`,
            }]
          : msgs;
        const res = await AiService.chatWithOracle(localizedMsgs, i18n.language?.startsWith('en') ? 'en' : 'pl');
        setAiReflection(res);
      } catch { /* silent */ }
      setAiLoading(false);
    }
  };

  const handleAnalyzePatterns = async () => {
    if (gratitudeEntries.length < 3) {
      Alert.alert('Za mało wpisów', 'Potrzebujesz co najmniej 3 wpisów wdzięczności, by zobaczyć wzorce.');
      return;
    }
    setPatternLoading(true);
    try {
      const allItems = gratitudeEntries.flatMap(e => e.items).slice(-60);
      const msgs = [{
        role: 'user' as const,
        content: `Oto lista rzeczy, za które ta osoba jest wdzięczna (ostatnie wpisy):
${allItems.map((it, i) => `${i + 1}. ${it}`).join('\n')}

Przeanalizuj te wpisy i wskaż:
1. Trzy powtarzające się tematy lub kategorie (np. relacje, natura, ciało, praca)
2. Co mówią o tym, co ta osoba naprawdę ceni w życiu
3. Jedno zaskakujące spostrzeżenie lub ślepa plamka — czego brakuje w liście wdzięczności

Pisz w języku użytkownika, zwięźle i celnie — 4-5 zdań łącznie.`,
      }];
      const localizedMsgs = i18n.language?.startsWith('en')
        ? [{
            role: 'user' as const,
            content: `Here is the list of things this person is grateful for:\n${allItems.map((it, i) => `${i + 1}. ${it}`).join('\n')}\n\nAnalyse these entries and indicate:\n1. Three recurring themes or categories\n2. What they reveal about what this person truly values\n3. One surprising insight or blind spot\n\nWrite in English, concise and sharp, in 4-5 sentences total.`,
          }]
        : msgs;
      const res = await AiService.chatWithOracle(localizedMsgs, i18n.language?.startsWith('en') ? 'en' : 'pl');
      setPatternText(res);
    } catch {
      setPatternText(i18n.language?.startsWith('en') ? 'Patterns of gratitude reveal themselves gradually. Your entries already carry the story of what you truly value — return in a few days for the next reading.' : 'Wzorce wdzięczności ujawniają się stopniowo. W Twoich wpisach kryje się opowieść o tym, co naprawdę cenisz — wróć za kilka dni po kolejny odczyt.');
    }
    setPatternLoading(false);
  };

  const handleShare = async () => {
    const filled = slots.filter(s => s.trim().length > 0);
    if (filled.length === 0 && !todayEntry) {
      Alert.alert('Brak wpisu', 'Najpierw zapisz dzisiejszą wdzięczność.');
      return;
    }
    const items = filled.length > 0 ? filled : (todayEntry?.items || []);
    const dateStr = new Date().toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'long', year: 'numeric' });
    const shareText = `✦ WDZIĘCZNOŚĆ — ${dateStr}\n\n${items.map((it, i) => `${i + 1}. ${it}`).join('\n')}${aiReflection ? `\n\n${aiReflection}` : ''}\n\n— zapisano w Aethera`;
    try {
      await Share.share({ message: shareText, title: 'Moja wdzięczność — Aethera' });
    } catch { /* silent */ }
  };

  return (
    <View style={[gr.container, { backgroundColor: currentTheme.background }]}>
      <GratitudeBg isDark={!isLight} />
      <SafeAreaView edges={['top']} style={gr.safe}>
        <View style={gr.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Home')} style={gr.backBtn} hitSlop={20}>
            <ChevronLeft color={ACCENT} size={26} strokeWidth={1.6} />
          </Pressable>
          <View style={gr.headerCenter}>
            <Typography variant="premiumLabel" color={ACCENT}>{t('home.worlds.support')}</Typography>
            <Typography variant="screenTitle" style={{ marginTop: 3 }}>{t('gratitude.title')}</Typography>
          </View>
          <Pressable
            onPress={() => { if (isFavoriteItem('gratitude')) { removeFavoriteItem('gratitude'); } else { addFavoriteItem({ id: 'gratitude', label: 'Wdzięczność', route: 'Gratitude', params: {}, icon: 'Heart', color: ACCENT, addedAt: new Date().toISOString() }); } }}
            style={[gr.backBtn, { alignItems: 'center', justifyContent: 'center' }]}
            hitSlop={12}
          >
            <Star color={isFavoriteItem('gratitude') ? ACCENT : ACCENT + '88'} size={18} strokeWidth={1.8} fill={isFavoriteItem('gratitude') ? ACCENT : 'none'} />
          </Pressable>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[gr.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') + 8 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            {/* HEART BLOOM 3D */}
            <HeartBloom3D accent={ACCENT} />

            {/* STAT RAIL */}
            <Animated.View entering={FadeInDown.duration(500)} style={gr.statRail}>
              {[
                { label: 'Pasmo', val: `${streak}d` },
                { label: t('common.today'), val: todayEntries.length > 0 ? '✓' : '—' },
                { label: t('common.streak'), val: String(gratitudeEntries.length) },
                { label: t('gratitude.streak'), val: `${challengeCompletion}%` },
              ].map((s, i) => (
                <View key={i} style={[gr.statItem, { backgroundColor: cardBg }]}>
                  <Text style={[gr.statVal, { color: ACCENT }]}>{s.val}</Text>
                  <Text style={[gr.statLabel, { color: subColor }]}>{s.label}</Text>
                </View>
              ))}
            </Animated.View>

            {/* 7-DAY STREAK */}
            <Animated.View entering={FadeInDown.delay(60).duration(500)} style={[gr.streakRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {last7.map((d, i) => (
                <View key={i} style={[gr.streakDot, { backgroundColor: d.done ? ACCENT : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)') }]} />
              ))}
            </Animated.View>

            {/* PRZESŁANIE TYGODNIA */}
            <Animated.View entering={FadeInDown.delay(70).duration(500)} style={[gr.quoteCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
              <LinearGradient colors={[ACCENT + '12', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <View style={gr.quoteHeader}>
                <Quote color={ACCENT} size={14} strokeWidth={1.6} />
                <Text style={[gr.quoteLabel, { color: ACCENT }]}>PRZESŁANIE TYGODNIA</Text>
              </View>
              <Text style={[gr.quoteText, { color: textColor }]}>"{weeklyQuote.text}"</Text>
              <Text style={[gr.quoteAuthor, { color: subColor }]}>— {weeklyQuote.author}</Text>
            </Animated.View>

            {/* INSPIRACJA DO WDZIĘCZNOŚCI */}
            <Animated.View entering={FadeInDown.delay(80).duration(500)} style={[gr.inspCard, { backgroundColor: cardBg, borderColor: inspirationCard.color + '44' }]}>
              <LinearGradient colors={[inspirationCard.color + '18', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <View style={gr.inspHeader}>
                <Sparkles color={inspirationCard.color} size={14} strokeWidth={1.6} />
                <Text style={[gr.inspLabel, { color: inspirationCard.color }]}>🌸 {t('gratitude.inspiration').toUpperCase()}</Text>
              </View>
              <Text style={[gr.inspTitle, { color: isLight ? '#1A1A1A' : '#F0EBE2' }]}>{inspirationCard.title}</Text>
              <Text style={[gr.inspBody, { color: subColor }]}>{inspirationCard.body}</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(90).duration(500)} style={[gr.ritualCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
              <LinearGradient colors={[ACCENT + '18', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <Typography variant="premiumLabel" color={ACCENT}>✦ OŁTARZ WDZIĘCZNOŚCI</Typography>
              <Text style={[gr.ritualLead, { color: textColor }]}>Najpierw nazwij to, co miękkie i ciche. Potem uchwyć to, co trwa mimo chaosu — relację, chwilę, łaskę. Na końcu zostaw jedno zdanie, do którego chcesz wrócić jutro.</Text>
              <View style={gr.ritualSteps}>
                {[
                  'Nazwij jedną drobną rzecz, która dziś Cię podtrzymała.',
                  'Dodaj coś większego: relację, dar, moment łaski albo ocalenia.',
                  'Zapisz to tak, jakbyś chciała lub chciał zapamiętać ten dzień na długo.',
                ].map((step, index) => (
                  <View key={step} style={[gr.ritualStep, { borderColor: ACCENT + '20' }]}>
                    <View style={[gr.ritualStepBadge, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '28' }]}>
                      <Text style={[gr.ritualStepBadgeText, { color: ACCENT }]}>{index + 1}</Text>
                    </View>
                    <Text style={[gr.ritualStepText, { color: subColor }]}>{step}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* GRATITUDE SLOTS */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <View style={gr.sectionHeader}>
                <Text style={[gr.sectionTitle, { color: subColor }]}>💛 {t('gratitude.items_today').toUpperCase()}</Text>
                <Pressable onPress={handleShare} style={[gr.shareBtn, { borderColor: ACCENT + '44' }]} hitSlop={10}>
                  <Share2 color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={[gr.shareBtnText, { color: ACCENT }]}>Udostępnij</Text>
                </Pressable>
              </View>
              {slots.map((val, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <Text style={[gr.slotNum, { color: ACCENT, marginTop: 14 }]}>{i + 1}</Text>
                  <MysticalInput
                    value={val}
                    onChangeText={(t) => { const ns = [...slots]; ns[i] = t; setSlots(ns); setSaved(false); }}
                    placeholder="Jestem wdzięczna za..."
                    multiline
                    editable={!saved}
                    containerStyle={{ flex: 1 }}
                    style={{ minHeight: 52, fontSize: 14, lineHeight: 22, color: textColor }}
                    onFocusScroll={() => focusIntoView(430 + i * 120)}
                  />
                </View>
              ))}
            </Animated.View>

            {/* spacer so content isn't hidden behind floating footer */}
            {!saved && <View style={{ height: 80 }} />}

            {/* AI REFLECTION */}
            {saved && (
              <Animated.View entering={FadeInDown.duration(500)} style={[gr.reflCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                <LinearGradient colors={[ACCENT + '10', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                <BookOpen color={ACCENT} size={16} strokeWidth={1.6} />
                {aiLoading ? (
                  <Text style={[gr.reflText, { color: subColor }]}>Generuję refleksję...</Text>
                ) : aiReflection ? (
                  <Text style={[gr.reflText, { color: textColor }]}>{aiReflection}</Text>
                ) : (
                  <Pressable onPress={() => {
                    if (!aiAvailable) {
                      navigation.navigate('JournalEntry', { prompt: aiState.fallbackPrompt, type: 'reflection' });
                      return;
                    }
                    handleSave();
                  }}>
                    <Text style={[gr.reflText, { color: ACCENT }]}>Dotknij, by otrzymać poetycką refleksję ✦</Text>
                  </Pressable>
                )}
              </Animated.View>
            )}

            {/* ── WDZIĘCZNOŚĆ GŁĘBOKA ──────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(105).duration(500)}>
              <Text style={[gr.sectionTitle, { color: subColor, marginTop: 24 }]}>🌿 WDZIĘCZNOŚĆ GŁĘBOKA</Text>
              <Text style={[gr.sectionDesc, { color: subColor }]}>Trzy pytania, które prowadzą poza codzienną listę.</Text>
              {DEEP_PROMPTS.map((dp, idx) => (
                <View key={idx} style={[gr.deepCard, { backgroundColor: cardBg, borderColor: dp.color + '44' }]}>
                  <LinearGradient colors={[dp.color + '14', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                  <Pressable
                    onPress={() => setActiveDeepIdx(activeDeepIdx === idx ? null : idx)}
                    style={gr.deepHeader}
                  >
                    <View style={[gr.deepBadge, { backgroundColor: dp.color + '20', borderColor: dp.color + '40' }]}>
                      <Text style={[gr.deepBadgeNum, { color: dp.color }]}>{idx + 1}</Text>
                    </View>
                    <Text style={[gr.deepQ, { color: textColor }]}>{dp.q}</Text>
                    <ArrowRight color={dp.color} size={15} strokeWidth={1.6} style={{ transform: [{ rotate: activeDeepIdx === idx ? '90deg' : '0deg' }] }} />
                  </Pressable>
                  {activeDeepIdx === idx && (
                    <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 8 }}>
                      <Text style={[gr.deepHint, { color: subColor }]}>{dp.hint}</Text>
                      <MysticalInput
                        value={deepAnswers[idx]}
                        onChangeText={(t) => { const na = [...deepAnswers]; na[idx] = t; setDeepAnswers(na); }}
                        placeholder="Twoja refleksja..."
                        multiline
                        editable={!deepSaved[idx]}
                        style={{ minHeight: 72, fontSize: 14, lineHeight: 22, color: textColor, marginTop: 8 }}
                        onFocusScroll={() => focusIntoView(600 + idx * 160)}
                      />
                      {!deepSaved[idx] && deepAnswers[idx].trim().length >= 2 && (
                        <Pressable
                          onPress={() => {
                            const ns = [...deepSaved]; ns[idx] = true; setDeepSaved(ns);
                            void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
                          }}
                          style={[gr.deepSaveBtn, { backgroundColor: dp.color }]}
                        >
                          <Text style={gr.deepSaveBtnText}>Zapisz refleksję</Text>
                        </Pressable>
                      )}
                      {deepSaved[idx] && (
                        <Text style={[gr.deepSavedLabel, { color: dp.color }]}>✓ Zapisano</Text>
                      )}
                    </Animated.View>
                  )}
                </View>
              ))}
            </Animated.View>

            {/* ── 30-DNIOWE WYZWANIE ───────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(110).duration(500)} style={[gr.challengeCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
              <LinearGradient colors={[ACCENT + '14', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <View style={gr.challengeHeader}>
                <Trophy color={ACCENT} size={16} strokeWidth={1.6} />
                <Text style={[gr.sectionTitle, { color: ACCENT, marginBottom: 0 }]}>30-DNIOWE WYZWANIE</Text>
                <View style={[gr.challengePct, { backgroundColor: ACCENT + '22' }]}>
                  <Text style={[gr.challengePctText, { color: ACCENT }]}>{challengeCompletion}%</Text>
                </View>
              </View>
              <Text style={[gr.challengeDesc, { color: subColor }]}>Zaznacz każdy dzień, w którym praktykowałaś/eś wdzięczność. Dotknij kratki, by ją zaznaczyć.</Text>
              <View style={gr.challengeGrid}>
                {challengeGrid.map((day) => (
                  <Pressable
                    key={day.key}
                    onPress={() => toggleChallengeDay(day.key)}
                    style={[
                      gr.challengeCell,
                      {
                        backgroundColor: day.done ? ACCENT : (isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'),
                        borderColor: day.done ? ACCENT : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'),
                      },
                    ]}
                  >
                    <Text style={[gr.challengeCellNum, { color: day.done ? '#fff' : subColor }]}>{day.dayNum}</Text>
                  </Pressable>
                ))}
              </View>
              {challengeCompletion >= 100 && (
                <View style={[gr.challengeCompleteRow, { backgroundColor: ACCENT + '22' }]}>
                  <Trophy color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={[gr.challengeCompleteText, { color: ACCENT }]}>Brawo! Ukończyłaś/eś 30-dniowe wyzwanie wdzięczności!</Text>
                </View>
              )}
            </Animated.View>

            {/* ── WZORCE WDZIĘCZNOŚCI ──────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(115).duration(500)} style={[gr.patternCard, { backgroundColor: cardBg, borderColor: '#A78BFA44' }]}>
              <LinearGradient colors={['#A78BFA14', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <View style={gr.patternHeader}>
                <TrendingUp color="#A78BFA" size={16} strokeWidth={1.6} />
                <Text style={[gr.sectionTitle, { color: '#A78BFA', marginBottom: 0 }]}>WZORCE WDZIĘCZNOŚCI</Text>
              </View>
              <Text style={[gr.patternDesc, { color: subColor }]}>AI przeanalizuje Twoje poprzednie wpisy i pokaże, co naprawdę cenisz w życiu.</Text>
              {patternText ? (
                <Animated.View entering={FadeInDown.duration(400)}>
                  <Text style={[gr.patternText, { color: textColor }]}>{patternText}</Text>
                </Animated.View>
              ) : (
                <Pressable
                  onPress={handleAnalyzePatterns}
                  disabled={patternLoading || gratitudeEntries.length < 3}
                  style={[gr.patternBtn, { backgroundColor: patternLoading ? '#A78BFA55' : '#A78BFA', opacity: gratitudeEntries.length < 3 ? 0.45 : 1 }]}
                >
                  {patternLoading ? (
                    <Text style={gr.patternBtnText}>Analizuję wzorce...</Text>
                  ) : (
                    <>
                      <Search color="#fff" size={14} strokeWidth={2} />
                      <Text style={gr.patternBtnText}>
                        {gratitudeEntries.length < 3 ? 'Potrzebujesz 3+ wpisów' : 'Odkryj moje wzorce'}
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(130).duration(500)} style={[gr.integrationCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Typography variant="premiumLabel" color={ACCENT}>🌿 INTEGRACJA</Typography>
              <Text style={[gr.integrationText, { color: subColor }]}>Wdzięczność działa najmocniej wtedy, gdy nie jest listą obowiązków. Traktuj ją jak codzienny zapis tego, co mimo napięcia dalej pozostaje żywe, piękne albo prawdziwe. Zapisane słowo staje się kotwicą na trudniejsze dni.</Text>
            </Animated.View>

            {/* ── ULUBIONE WPISY ───────────────────────────────────── */}
            {favoriteEntries.length > 0 && (
              <Animated.View entering={FadeInDown.duration(500)}>
                <Text style={[gr.sectionTitle, { color: subColor, marginTop: 24 }]}>⭐ ULUBIONE WPISY</Text>
                {favoriteEntries.map((e) => (
                  <View key={e.id} style={[gr.histRow, { borderColor: ACCENT + '44', backgroundColor: ACCENT + '08' }]}>
                    <View style={gr.histRowHeader}>
                      <Text style={[gr.histDate, { color: ACCENT + 'AA' }]}>{e.date}</Text>
                      <Pressable onPress={() => toggleFavoriteEntry(e.id)} hitSlop={10}>
                        <Star color={ACCENT} size={14} fill={ACCENT} strokeWidth={1.6} />
                      </Pressable>
                    </View>
                    {e.items.map((item, i) => (
                      <Text key={i} style={[gr.histText, { color: textColor }]}>· {item}</Text>
                    ))}
                  </View>
                ))}
              </Animated.View>
            )}

            {/* HISTORY */}
            {gratitudeEntries.length > 0 && (
              <Animated.View entering={FadeInDown.delay(120).duration(500)}>
                <Text style={[gr.sectionTitle, { color: subColor, marginTop: 24 }]}>📖 {t('gratitude.pastEntries').toUpperCase()}</Text>
                {gratitudeEntries.slice(-6).reverse().map((e) => (
                  <View key={e.id} style={[gr.histRow, { borderColor: cardBorder }]}>
                    <View style={gr.histRowHeader}>
                      <Text style={[gr.histDate, { color: ACCENT + 'AA' }]}>{e.date}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Pressable onPress={() => toggleFavoriteEntry(e.id)} hitSlop={10}>
                          <Star
                            color={ACCENT}
                            size={14}
                            fill={favoriteEntryIds.has(e.id) ? ACCENT : 'none'}
                            strokeWidth={1.6}
                          />
                        </Pressable>
                        <Pressable hitSlop={10} onPress={() => Alert.alert('Usuń wpis', 'Czy na pewno chcesz usunąć ten wpis wdzięczności?', [
                          { text: 'Anuluj', style: 'cancel' },
                          { text: 'Usuń', style: 'destructive', onPress: () => deleteGratitudeEntry(e.id) },
                        ])}>
                          <Trash2 size={14} color={'#EF4444'} strokeWidth={1.6} />
                        </Pressable>
                      </View>
                    </View>
                    {e.items.map((item, i) => (
                      <Text key={i} style={[gr.histText, { color: textColor }]}>· {item}</Text>
                    ))}
                  </View>
                ))}
              </Animated.View>
            )}

            {/* CO DALEJ? */}
            <Animated.View entering={FadeInDown.delay(140).duration(500)} style={[gr.nextCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[gr.sectionTitle, { color: subColor, marginBottom: 14 }]}>✦ CO DALEJ?</Text>
              {[
                {
                  label: 'Kąpiel dźwiękowa',
                  sub: 'Pogłęb wdzięczność dźwiękiem',
                  route: 'SoundBath',
                  params: {},
                  color: '#60A5FA',
                  Icon: Waves,
                },
                {
                  label: 'Medytacja wdzięczności',
                  sub: 'Serce otwarte na to, co jest',
                  route: 'Meditation',
                  params: {},
                  color: '#F472B6',
                  Icon: MoonStar,
                },
                {
                  label: 'Dziennik tygodnia',
                  sub: 'Za co jesteś najbardziej wdzięczna w tym tygodniu?',
                  route: 'JournalEntry',
                  params: { prompt: 'Za co jesteś najbardziej wdzięczna w tym tygodniu?', type: 'reflection' },
                  color: ACCENT,
                  Icon: NotebookPen,
                },
              ].map((item, i) => (
                <Pressable
                  key={item.route + i}
                  onPress={() => navigation.navigate(item.route as any, item.params)}
                  style={[gr.nextRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: cardBorder }]}
                >
                  <View style={[gr.nextIconWrap, { backgroundColor: item.color + '18', borderColor: item.color + '30' }]}>
                    <item.Icon color={item.color} size={16} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[gr.nextLabel, { color: isLight ? '#1A1A1A' : '#F0EBE2' }]}>{item.label}</Text>
                    <Text style={[gr.nextSub, { color: subColor }]} numberOfLines={1}>{item.sub}</Text>
                  </View>
                  <ArrowRight color={item.color} size={16} strokeWidth={1.6} />
                </Pressable>
              ))}
            </Animated.View>

            <EndOfContentSpacer size="standard" />
          </ScrollView>

          {/* FLOATING SAVE FOOTER */}
          {!saved && (
            <View style={{
              position: 'absolute',
              left: layout.padding.screen,
              right: layout.padding.screen,
              bottom: keyboardH > 0 ? keyboardH : insets.bottom + 16,
              backgroundColor: isDark ? 'rgba(8,5,22,0.96)' : 'rgba(255,255,255,0.96)',
            }}>
              <Pressable
                onPress={handleSave}
                style={[gr.saveBtn, { backgroundColor: ACCENT }]}
              >
                <Heart color="#fff" size={16} strokeWidth={2} />
                <Text style={gr.saveBtnText}>{t('gratitude.save')}</Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const gr = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  scroll: { paddingTop: 8, paddingHorizontal: layout.padding.screen },
  statRail: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  statVal: { fontSize: 15, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 2, letterSpacing: 0.3 },
  streakRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  streakDot: { width: 28, height: 28, borderRadius: 14 },
  // Weekly quote
  quoteCard: { borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  quoteHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  quoteLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  quoteText: { fontSize: 15, lineHeight: 24, fontStyle: 'italic', fontWeight: '500' },
  quoteAuthor: { fontSize: 12, marginTop: 8, textAlign: 'right' },
  // Inspiration card
  inspCard: { borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 20, overflow: 'hidden' },
  inspHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  inspLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  inspTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  inspBody: { fontSize: 13, lineHeight: 21 },
  insCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 20, overflow: 'hidden' },
  insText: { flex: 1, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  ritualCard: { borderRadius: 26, padding: 18, borderWidth: 1, marginBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  ritualLead: { marginTop: 10, fontSize: 15, lineHeight: 24, fontWeight: '600' },
  ritualSteps: { marginTop: 14, gap: 10 },
  ritualStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  ritualStepBadge: { width: 28, height: 28, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ritualStepBadgeText: { fontSize: 12, fontWeight: '800' },
  ritualStepText: { flex: 1, fontSize: 12.5, lineHeight: 19 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  sectionDesc: { fontSize: 12.5, lineHeight: 19, marginTop: -6, marginBottom: 12 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  shareBtnText: { fontSize: 11, fontWeight: '600' },
  slotRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  slotNum: { fontSize: 18, fontWeight: '700', width: 22 },
  slotInput: { flex: 1, fontSize: 14, lineHeight: 22, minHeight: 44 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 16 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  reflCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, padding: 16, borderWidth: 1, marginTop: 16, overflow: 'hidden' },
  reflText: { flex: 1, fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  // Deep gratitude prompts
  deepCard: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 10, overflow: 'hidden' },
  deepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deepBadge: { width: 28, height: 28, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  deepBadgeNum: { fontSize: 12, fontWeight: '800' },
  deepQ: { flex: 1, fontSize: 13.5, fontWeight: '600', lineHeight: 20 },
  deepHint: { fontSize: 12, lineHeight: 18, fontStyle: 'italic', marginBottom: 2 },
  deepSaveBtn: { borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  deepSaveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  deepSavedLabel: { textAlign: 'center', marginTop: 8, fontSize: 13, fontWeight: '600' },
  // 30-day challenge
  challengeCard: { borderRadius: 22, borderWidth: 1, padding: 18, marginTop: 8, marginBottom: 8, overflow: 'hidden' },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  challengePct: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  challengePctText: { fontSize: 12, fontWeight: '700' },
  challengeDesc: { fontSize: 12.5, lineHeight: 19, marginBottom: 14 },
  challengeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  challengeCell: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  challengeCellNum: { fontSize: 11, fontWeight: '600' },
  challengeCompleteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, borderRadius: 12, padding: 12 },
  challengeCompleteText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  // Pattern analysis
  patternCard: { borderRadius: 22, borderWidth: 1, padding: 18, marginTop: 8, marginBottom: 8, overflow: 'hidden' },
  patternHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  patternDesc: { fontSize: 12.5, lineHeight: 19, marginBottom: 14 },
  patternText: { fontSize: 14, lineHeight: 23 },
  patternBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 13 },
  patternBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  integrationCard: { borderRadius: 24, borderWidth: 1, padding: 18, marginTop: 16, overflow: 'hidden' },
  integrationText: { marginTop: 10, fontSize: 13.5, lineHeight: 22 },
  histRow: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10, borderRadius: 10, paddingHorizontal: 4, marginBottom: 2 },
  histRowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  histDate: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  histText: { fontSize: 13, lineHeight: 20 },
  // Co dalej
  nextCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginTop: 20, overflow: 'hidden' },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  nextIconWrap: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  nextLabel: { fontSize: 14, fontWeight: '600' },
  nextSub: { fontSize: 12, lineHeight: 17 },
});
