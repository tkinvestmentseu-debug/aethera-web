// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated as RNAnimated,
  Pressable, ScrollView, StyleSheet, View, Dimensions, Text,
  TextInput, Alert, Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing, cancelAnimation,
} from 'react-native-reanimated';
import {
  ChevronLeft, Star, Moon, Brain, Sparkles,
  ChevronDown, ChevronUp, TrendingUp,
} from 'lucide-react-native';
import { layout } from '../core/theme/designSystem';
import { useTheme } from '../core/hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';

const { width: SW } = Dimensions.get('window');
const ACCENT      = '#7C3AED';
const ACCENT_LIGHT = '#DDD6FE';
const ACCENT_DARK  = '#4C1D95';

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
  { id: 'hands',   label: 'Dłonie',    desc: 'Policz palce obu dłoni',         emoji: '✋', color: '#7C3AED' },
  { id: 'reading', label: 'Czytanie',  desc: 'Przeczytaj tekst dwa razy',      emoji: '📖', color: '#6D28D9' },
  { id: 'clock',   label: 'Zegar',     desc: 'Sprawdź czas dwa razy',          emoji: '🕐', color: '#5B21B6' },
  { id: 'switch',  label: 'Włącznik',  desc: 'Spróbuj włączyć światło',        emoji: '💡', color: '#4C1D95' },
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

// ── PULSING ORB HERO ──────────────────────────────────────────────────────────
const DreamOrbHero = () => {
  const pulse1 = useRef(new RNAnimated.Value(1)).current;
  const pulse2 = useRef(new RNAnimated.Value(1)).current;
  const pulse3 = useRef(new RNAnimated.Value(1)).current;
  const glow   = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulse1, { toValue: 1.08, duration: 2600, useNativeDriver: true, easing: (t) => Math.sin(t * Math.PI / 2) }),
        RNAnimated.timing(pulse1, { toValue: 1.00, duration: 2600, useNativeDriver: true, easing: (t) => Math.sin(t * Math.PI / 2) }),
      ])
    ).start();

    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulse2, { toValue: 1.14, duration: 3200, useNativeDriver: true }),
        RNAnimated.timing(pulse2, { toValue: 1.00, duration: 3200, useNativeDriver: true }),
      ])
    ).start();

    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulse3, { toValue: 1.22, duration: 4000, useNativeDriver: true }),
        RNAnimated.timing(pulse3, { toValue: 1.00, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(glow, { toValue: 1, duration: 2000, useNativeDriver: true }),
        RNAnimated.timing(glow, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    return () => {
      pulse1.stopAnimation();
      pulse2.stopAnimation();
      pulse3.stopAnimation();
      glow.stopAnimation();
    };
  }, []);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.38] });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 230, height: 230 }}>
      {/* Outermost ring */}
      <RNAnimated.View style={{
        position: 'absolute',
        width: 220, height: 220,
        borderRadius: 110,
        backgroundColor: '#4C1D95',
        opacity: glowOpacity,
        transform: [{ scale: pulse3 }],
      }} />
      {/* Middle ring */}
      <RNAnimated.View style={{
        position: 'absolute',
        width: 180, height: 180,
        borderRadius: 90,
        backgroundColor: '#6D28D9',
        opacity: 0.28,
        transform: [{ scale: pulse2 }],
      }} />
      {/* Inner glow ring */}
      <RNAnimated.View style={{
        position: 'absolute',
        width: 140, height: 140,
        borderRadius: 70,
        backgroundColor: '#7C3AED',
        opacity: 0.35,
        transform: [{ scale: pulse1 }],
      }} />
      {/* Core orb */}
      <LinearGradient
        colors={['#A78BFA', '#7C3AED', '#4C1D95', '#1E0845']}
        style={{
          width: 100, height: 100, borderRadius: 50,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9, shadowRadius: 24, elevation: 20,
        }}
      >
        {/* Iris detail */}
        <View style={{
          width: 54, height: 36, borderRadius: 27,
          backgroundColor: '#3B0764',
          borderWidth: 1.5, borderColor: '#A78BFA',
          alignItems: 'center', justifyContent: 'center',
          opacity: 0.9,
        }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#7C3AED', opacity: 0.85, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E0845' }} />
          </View>
        </View>
        {/* Specular */}
        <View style={{ position: 'absolute', top: 18, left: 26, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EDE9FE', opacity: 0.75 }} />
      </LinearGradient>
    </View>
  );
};

// ── STAR RATING ───────────────────────────────────────────────────────────────
const StarRating = ({ count, max = 5 }: { count: number; max?: number }) => (
  <View style={{ flexDirection: 'row', gap: 3 }}>
    {Array.from({ length: max }, (_, i) => (
      <Star key={i} size={10} color={i < count ? ACCENT_LIGHT : '#4B5563'} fill={i < count ? ACCENT_LIGHT : 'transparent'} />
    ))}
  </View>
);

// ── TECHNIQUE CARD ────────────────────────────────────────────────────────────
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

// ── REALITY CHECK CARD ────────────────────────────────────────────────────────
const RealityCheckCard = ({ item }: { item: typeof REALITY_CHECKS[0] }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPress = () => {
    scale.value = withSequence(withTiming(0.92, { duration: 100 }), withTiming(1, { duration: 200 }));
    HapticsService.impact('light');
  };
  return (
    <Pressable onPress={onPress} style={{ width: (SW - layout.padding.screen * 2 - 10) / 2, marginBottom: 10 }}>
      <Animated.View style={animStyle}>
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
  const insets = useSafeAreaInsets();
  const { currentTheme, isLight } = useTheme();
  const addFavoriteItem    = useAppStore(s => s.addFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const isFavoriteItem     = useAppStore(s => s.isFavoriteItem);
  const shadowWorkSessions = useAppStore(s => s.shadowWorkSessions);
  const safeShadowWorkSessions = shadowWorkSessions ?? [];
  const { t } = useTranslation();

  const [intention, setIntention] = useState('');
  const [savedInt, setSavedInt]   = useState('');
  const [isFav, setIsFav]         = useState(false);

  const scrollRef = useRef(null);
  const [dreamAiInsight, setDreamAiInsight]   = useState('');
  const [dreamAiLoading, setDreamAiLoading]   = useState(false);

  const fetchDreamInsight = async () => {
    if (dreamAiLoading) return;
    setDreamAiLoading(true);
    HapticsService.impact('medium');
    try {
      const intText = savedInt || 'brak zapisanej intencji';
      const prompt = 'Uzytkownik praktykuje swiadome snienie. Intencja snu: ' + intText + '. Napisz krotka (3-4 zdania) porade jak dzis wejsc w swiadomy sen, co moze napotkac i jaka afirmacje powtarzac przed zasnieciem.';
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setDreamAiInsight(result);
    } catch (e) {
      setDreamAiInsight('Nie udalo sie pobrac porady. Sprobuj ponownie.');
    } finally {
      setDreamAiLoading(false);
    }
  };

  useEffect(() => {
    setIsFav(isFavoriteItem('lucid-dreaming'));
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
    Alert.alert(
      t('lucidDreaming.intencja_zapisana', 'Intencja zapisana'),
      t('lucidDreaming.twoja_intencja_snu_zostala_ustawion', 'Twoja intencja snu została ustawiona. Dobranoc!')
    );
  };

  const lucidCount = safeShadowWorkSessions.length;
  const todayDate  = (() => { const d = new Date(); return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`; })();

  return (
    <View style={{ flex: 1, backgroundColor: isLight ? currentTheme.background : '#0D0A1A' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Background gradient */}
        <LinearGradient
          colors={['#0D0A1A', '#120E24', '#1A1030', '#0D0A1A']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingVertical: 12, zIndex: 10 }}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={{ padding: 8, marginRight: 4 }}>
            <ChevronLeft size={22} color={ACCENT_LIGHT} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(167,139,250,0.7)', fontSize: 10, letterSpacing: 2.5 }}>
              {t('lucidDreaming.eyebrow', 'ŚWIADOME ŚNIENIE').toUpperCase()}
            </Text>
            <Text style={{ color: '#EDE9FE', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 }}>
              {t('lucidDreaming.title', 'Lucid Dreaming')}
            </Text>
          </View>
          <Pressable onPress={toggleFav} style={{ padding: 8 }}>
            <Star size={20} color={isFav ? '#FBBF24' : ACCENT_LIGHT} fill={isFav ? '#FBBF24' : 'transparent'} />
          </Pressable>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>

          {/* Hero — Pulsing Dream Orb */}
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <DreamOrbHero />
            <Text style={{ color: 'rgba(167,139,250,0.6)', fontSize: 10, letterSpacing: 3, marginTop: 4 }}>
              {t('lucidDreaming.portal_hero_label', 'PORTAL DO SERWISU ŚWIADOMEGO')}
            </Text>
          </View>

          {/* Date */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ color: 'rgba(221,214,254,0.55)', fontSize: 12, letterSpacing: 1 }}>{todayDate}</Text>
          </View>

          {/* What is lucid dreaming */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 28 }}>
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <Text style={{ color: ACCENT_LIGHT, fontSize: 11, letterSpacing: 2.5, marginBottom: 10 }}>
                {t('lucidDreaming.czym_jest_swiadome_snienie', 'CZYM JEST ŚWIADOME ŚNIENIE')}
              </Text>
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
              <Text style={{ color: ACCENT_LIGHT, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>
                {t('lucidDreaming.techniki_wejscia', 'TECHNIKI WEJŚCIA')}
              </Text>
              {TECHNIQUES.map((tech) => <TechniqueCard key={tech.id} item={tech} />)}
            </Animated.View>
          </View>

          {/* Reality Checks */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 28 }}>
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Text style={{ color: ACCENT_LIGHT, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>
                {t('lucidDreaming.sygnaly_rzeczywist', 'SYGNAŁY RZECZYWISTOŚCI')}
              </Text>
              <Text style={{ color: 'rgba(221,214,254,0.6)', fontSize: 12, lineHeight: 18, marginBottom: 14 }}>
                {t('lucidDreaming.wykonuj_te_testy_wielokrotn_w', 'Wykonuj te testy wielokrotnie w ciągu dnia — nawyk przeniesie się do snu.')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {REALITY_CHECKS.map((rc) => <RealityCheckCard key={rc.id} item={rc} />)}
              </View>
            </Animated.View>
          </View>

          {/* Intention Journal */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 28 }}>
            <Animated.View entering={FadeInDown.delay(250).springify()}>
              <Text style={{ color: ACCENT_LIGHT, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>
                {t('lucidDreaming.dziennik_intencji', 'DZIENNIK INTENCJI')}
              </Text>
              {savedInt ? (
                <LinearGradient
                  colors={['rgba(124,58,237,0.15)', 'rgba(76,29,149,0.08)']}
                  style={{ borderRadius: 14, borderWidth: 1, borderColor: ACCENT + '44', padding: 16, marginBottom: 12 }}
                >
                  <Text style={{ color: 'rgba(167,139,250,0.7)', fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>
                    {t('lucidDreaming.aktualna_intencja', 'AKTUALNA INTENCJA')}
                  </Text>
                  <Text style={{ color: '#EDE9FE', fontSize: 14, lineHeight: 21 }}>"{savedInt}"</Text>
                </LinearGradient>
              ) : null}
              <TextInput
                value={intention}
                onChangeText={setIntention}
                placeholder={t('lucidDreaming.czego_chcesz_doswiadczy_tej_nocy', 'Czego chcesz doświadczyć tej nocy we śnie?')}
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
              <Pressable onPress={saveIntention} style={{ borderRadius: 14, overflow: 'hidden' }}>
                <LinearGradient
                  colors={[ACCENT, ACCENT_DARK]}
                  style={{ paddingVertical: 14, alignItems: 'center', borderRadius: 14 }}
                >
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 }}>
                    {t('lucidDreaming.ustaw_intencje_snu', 'USTAW INTENCJĘ SNU')}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>

          {/* Progress stats */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 28 }}>
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <Text style={{ color: ACCENT_LIGHT, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>
                {t('lucidDreaming.moj_postep', 'MÓJ POSTĘP')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[
                  { label: 'Sesje',       value: String(lucidCount), icon: <Moon size={18} color={ACCENT} /> },
                  { label: 'Ten tydzień', value: '0',                icon: <TrendingUp size={18} color={ACCENT} /> },
                  { label: 'Najlepszy',   value: '0',                icon: <Sparkles size={18} color={ACCENT} /> },
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
              <Text style={{ color: ACCENT_LIGHT, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>
                {t('lucidDreaming.techniki_zaawansowa', 'TECHNIKI ZAAWANSOWANE')}
              </Text>
              {ADVANCED_TECHNIQUES.map((tech) => (
                <LinearGradient
                  key={tech.id}
                  colors={[tech.color + '15', tech.color + '08']}
                  style={{ borderRadius: 16, borderWidth: 1, borderColor: tech.color + '44', padding: 16, marginBottom: 12 }}
                >
                  <Text style={{ color: '#EDE9FE', fontSize: 14, fontWeight: '700', marginBottom: 6, letterSpacing: 0.3 }}>{tech.label}</Text>
                  <Text style={{ color: 'rgba(221,214,254,0.75)', fontSize: 13, lineHeight: 19, marginBottom: 8 }}>{tech.desc}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                    <Sparkles size={13} color={tech.color} style={{ marginTop: 1 }} />
                    <Text style={{ color: 'rgba(167,139,250,0.8)', fontSize: 12, lineHeight: 17, flex: 1 }}>{tech.tip}</Text>
                  </View>
                </LinearGradient>
              ))}
            </Animated.View>
          </View>

          {/* AI Dream Guide */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 28 }}>
            <Animated.View entering={FadeInDown.delay(380).springify()}>
              <Text style={{ color: ACCENT_LIGHT, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>
                {'AI PRZEWODNIK SNÓW'}
              </Text>
              <LinearGradient
                colors={[ACCENT + '15', ACCENT_DARK + '08']}
                style={{ borderRadius: 18, borderWidth: 1, borderColor: ACCENT + '44', padding: 18 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ color: ACCENT_LIGHT, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>{'ORACLE SNÓW'}</Text>
                  <Pressable
                    onPress={fetchDreamInsight}
                    disabled={dreamAiLoading}
                    style={{ backgroundColor: ACCENT, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                      {dreamAiLoading ? '...' : 'Porada na dziś'}
                    </Text>
                  </Pressable>
                </View>
                {dreamAiInsight ? (
                  <Text style={{ color: 'rgba(221,214,254,0.9)', fontSize: 14, lineHeight: 22, fontStyle: 'italic' }}>
                    {dreamAiInsight}
                  </Text>
                ) : (
                  <Text style={{ color: 'rgba(167,139,250,0.6)', fontSize: 13, lineHeight: 20 }}>
                    {'Ustaw intencje snu powyżej, a następnie naciśnij Porada na dziś aby uzyskać spersonalizowany przewodnik AI.'}
                  </Text>
                )}
              </LinearGradient>
            </Animated.View>
          </View>

          <EndOfContentSpacer />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
