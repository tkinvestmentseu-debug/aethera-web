// @ts-nocheck
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '../core/utils/localeFormat';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet,
  View, Text, TextInput, Alert, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle as SvgCircle, Ellipse, Path, G, Defs, RadialGradient as SvgRadialGradient,
  Stop, Line,
} from 'react-native-svg';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, Star, Heart, Sparkles, MessageCircleHeart, BookHeart, History } from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import * as Haptics from 'expo-haptics';

const ACCENT = '#EC4899';
const BG_GRAD = ['#0E0709', '#160B0F', '#1C1016'] as const;

// ── INNER CHILD NEEDS ────────────────────────────────────────────────────────
const NEEDS = [
  { id: 'safety', label: 'Bezpieczeństwo', emoji: '🛡️', color: '#F97316' },
  { id: 'love', label: 'Miłość', emoji: '💗', color: '#EC4899' },
  { id: 'play', label: 'Zabawa', emoji: '🌈', color: '#FBBF24' },
  { id: 'limits', label: 'Granice', emoji: '🌿', color: '#34D399' },
  { id: 'seen', label: 'Widzialność', emoji: '✨', color: '#A78BFA' },
];

// ── REPARENTING EXERCISES ────────────────────────────────────────────────────
const EXERCISES = [
  { id: 'hold', title: 'Wewnętrzne trzymanie za rękę', desc: 'Zamknij oczy. Wyobraź sobie siebie jako małe dziecko. Podejdź do niego w myślach i weź je za rękę. Powiedz: „Jestem tu. Jesteś bezpieczny/a."', color: '#F97316' },
  { id: 'love_self', title: 'Mówienie „Kocham cię" do siebie', desc: 'Stań przed lustrem lub zamknij oczy. Trzy razy powiedz do siebie: „Kocham cię, [swoje imię]. Jesteś wystarczający/a."', color: '#EC4899' },
  { id: 'photo', title: 'Zdjęcie z dzieciństwa', desc: 'Wyobraź sobie swoje zdjęcie z dzieciństwa. Jakiego dziecka widzisz? Co czuło? Co potrzebowało usłyszeć? Napisz mu list.', color: '#FBBF24' },
  { id: 'parent_letter', title: 'List do rodzica', desc: 'Co chciałeś/aś powiedzieć swojemu rodzicowi, ale nie mogłeś/aś? Napisz ten list — bez cenzury, tylko dla siebie.', color: '#60A5FA' },
];

// ── INNER CHILD QUESTIONS ────────────────────────────────────────────────────
const QUESTIONS = [
  'Jak się teraz czujesz, małe dziecko?',
  'Czego najbardziej się bałeś/aś jako dziecko?',
  'Co sprawiało Ci największą radość w dzieciństwie?',
  'Kiedy czułeś/aś się kochany/a bezwarunkowo?',
  'Czego najbardziej potrzebowałeś/aś od dorosłych?',
  'Co chciałbyś/chciałabyś powiedzieć swojemu dziecięcemu ja teraz?',
];

// ── HERO SVG ─────────────────────────────────────────────────────────────────
const InnerChildHero = React.memo(() => {
  const pulse = useSharedValue(0.9);
  const rot = useSharedValue(0);
  const tiltX = useSharedValue(-5);
  const tiltY = useSharedValue(0);
  const particleRot = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withSequence(
      withTiming(1.08, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      withTiming(0.9, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
    ), -1, false);
    rot.value = withRepeat(withTiming(360, { duration: 18000, easing: Easing.linear }), -1, false);
    particleRot.value = withRepeat(withTiming(-360, { duration: 12000, easing: Easing.linear }), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-22, Math.min(22, -5 + e.translationY * 0.22));
      tiltY.value = Math.max(-22, Math.min(22, e.translationX * 0.22));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-5, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 500 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: pulse.value },
    ],
  }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot.value}deg` }] }));
  const pRingStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${particleRot.value}deg` }] }));

  const HEART_ANGLES = [0, 60, 120, 180, 240, 300];
  const PARTICLE_ANGLES = [0, 40, 80, 120, 160, 200, 240, 280, 320];

  return (
    <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={outerStyle}>
          <View style={{ width: 210, height: 210, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={210} height={210} viewBox="-105 -105 210 210" style={StyleSheet.absoluteFill}>
              <Defs>
                <SvgRadialGradient id="sphereGrad" cx="40%" cy="35%" r="55%">
                  <Stop offset="0%" stopColor="#FBCFE8" stopOpacity="0.7" />
                  <Stop offset="60%" stopColor="#EC4899" stopOpacity="0.3" />
                  <Stop offset="100%" stopColor="#831843" stopOpacity="0.05" />
                </SvgRadialGradient>
                <SvgRadialGradient id="childGrad" cx="45%" cy="30%" r="65%">
                  <Stop offset="0%" stopColor="#FDF2F8" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#F9A8D4" stopOpacity="0.7" />
                </SvgRadialGradient>
              </Defs>
              {/* Sphere glow */}
              <SvgCircle cx={0} cy={0} r={80} fill="url(#sphereGrad)" />
              <SvgCircle cx={0} cy={0} r={60} fill={ACCENT + '18'} stroke={ACCENT} strokeWidth={0.8} />
              {/* Child silhouette */}
              {/* Head */}
              <SvgCircle cx={0} cy={-28} r={14} fill="url(#childGrad)" />
              {/* Body */}
              <Path d="M-9,-14 Q-14,8 -10,28 Q0,32 10,28 Q14,8 9,-14 Z" fill="url(#childGrad)" />
              {/* Arms */}
              <Path d="M-9,-8 Q-28,-2 -30,8" stroke="#F9A8D4" strokeWidth={5} strokeLinecap="round" fill="none" />
              <Path d="M9,-8 Q28,-2 30,8" stroke="#F9A8D4" strokeWidth={5} strokeLinecap="round" fill="none" />
              {/* Legs */}
              <Path d="M-5,28 Q-8,42 -6,52" stroke="#F9A8D4" strokeWidth={5} strokeLinecap="round" fill="none" />
              <Path d="M5,28 Q8,42 6,52" stroke="#F9A8D4" strokeWidth={5} strokeLinecap="round" fill="none" />
            </Svg>
            {/* Orbiting hearts ring */}
            <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ringStyle]}>
              <Svg width={210} height={210} viewBox="-105 -105 210 210">
                {HEART_ANGLES.map((deg, i) => {
                  const rad = deg * Math.PI / 180;
                  const r = 75;
                  return (
                    <SvgCircle key={i} cx={r * Math.cos(rad)} cy={r * Math.sin(rad)}
                      r={i % 2 === 0 ? 5 : 3.5} fill={ACCENT} opacity={0.7} />
                  );
                })}
              </Svg>
            </Animated.View>
            {/* Outer particles ring */}
            <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, pRingStyle]}>
              <Svg width={210} height={210} viewBox="-105 -105 210 210">
                {PARTICLE_ANGLES.map((deg, i) => {
                  const rad = deg * Math.PI / 180;
                  const r = 95;
                  return (
                    <SvgCircle key={i} cx={r * Math.cos(rad)} cy={r * Math.sin(rad)}
                      r={2} fill="#FBCFE8" opacity={0.55} />
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

// ── SECTION HEADER ─────────────────────────────────────────────────────────
const SectionHeader = ({ label, accent }: { label: string; accent: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 28 }}>
    <View style={{ flex: 1, height: 1, backgroundColor: accent + '30' }} />
    <Text style={{ color: accent, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginHorizontal: 10 }}>
      {label}
    </Text>
    <View style={{ flex: 1, height: 1, backgroundColor: accent + '30' }} />
  </View>
);

// ── MAIN SCREEN ──────────────────────────────────────────────────────────────
export const InnerChildScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { themeName, addFavoriteItem, isFavoriteItem, removeFavoriteItem } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.58)';
  const { t } = useTranslation();
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.10)';

  const scrollRef = useRef<ScrollView>(null);
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null);
  const [letterText, setLetterText] = useState('');
  const [letterHistory, setLetterHistory] = useState<Array<{ id: string; text: string; date: string }>>([]);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [qAnswers, setQAnswers] = useState<string[]>(Array(QUESTIONS.length).fill(''));
  const [showHistory, setShowHistory] = useState(false);

  const isFav = isFavoriteItem ? isFavoriteItem('InnerChild') : false;

  const handleFav = () => {
    void HapticsService.impact();
    if (isFav) {
      removeFavoriteItem('InnerChild');
    } else if (addFavoriteItem) {
      addFavoriteItem({
        id: 'InnerChild',
        label: 'Wewnętrzne Dziecko',
        icon: 'Heart',
        color: ACCENT,
        route: 'InnerChild',
        addedAt: new Date().toISOString(),
      });
    }
  };

  const handleSaveLetter = () => {
    if (!letterText.trim()) return;
    void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
    setLetterHistory(prev => [{ id: `lc_${Date.now()}`, text: letterText.trim(), date: formatLocaleDate(new Date()) }, ...prev]);
    setLetterText('');
  };

  const handleAskOracle = async () => {
    if (!aiInput.trim()) return;
    void HapticsService.impact();
    setAiLoading(true);
    try {
      const msgs = [{
        role: 'user' as const,
        content: `Pracuję z moim wewnętrznym dzieckiem. Mam pytanie lub refleksję: "${aiInput}".
Odpowiedz jako duchowy przewodnik w stylu psychologii głębi i reparentingu.
Bądź ciepły, łagodny i konkretny. 3-4 zdania w języku użytkownika.`,
      }];
      const res = await AiService.chatWithOracle(msgs);
      setAiText(res);
    } catch { /* silent */ }
    setAiLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isLight ? '#FFF0F6' : BG_GRAD[0] }} edges={['top']}>
      <LinearGradient colors={isLight ? ['#FFF0F6', '#FFE4F0', '#FFF'] : BG_GRAD} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: 4 }]}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.headerBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: ACCENT }]}>{t('innerChild.title').toUpperCase()}</Text>
        </View>
        <Pressable onPress={handleFav} style={styles.headerBtn}>
          <Star size={20} color={ACCENT} fill={isFav ? ACCENT : 'none'} />
        </Pressable>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <View>
            <InnerChildHero />
          </View>
        </Animated.View>

        {/* Tagline */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: subColor, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              Każde dorosłe ja nosi w sobie dziecko, które wciąż czeka na miłość
            </Text>
          </View>
        </Animated.View>

        {/* NEEDS */}
        <SectionHeader label="TWOJE DZIECKO POTRZEBUJE" accent={ACCENT} />
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {NEEDS.map(need => {
              const active = selectedNeed === need.id;
              return (
                <Pressable key={need.id} onPress={() => { void HapticsService.impact(); setSelectedNeed(active ? null : need.id); }}
                  style={[styles.needCard, { borderColor: active ? need.color : cardBorder, backgroundColor: active ? need.color + '22' : cardBg }]}>
                  <Text style={{ fontSize: 22 }}>{need.emoji}</Text>
                  <Text style={{ color: active ? need.color : textColor, fontSize: 12, fontWeight: '600', marginTop: 4 }}>{need.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {selectedNeed && (
            <View style={[styles.card, { borderColor: (NEEDS.find(n => n.id === selectedNeed)?.color ?? ACCENT) + '40', marginTop: 12 }]}>
              <Text style={{ color: subColor, fontSize: 13, lineHeight: 20 }}>
                {selectedNeed === 'safety' && 'Twoje wewnętrzne dziecko potrzebuje bezpieczeństwa — pewności, że ktoś się nim zaopiekuje. Dziś bądź tą osobą dla siebie.'}
                {selectedNeed === 'love' && 'Miłość bezwarunkowa — bez zasług, bez warunków. Powiedz sobie dziś: „Kocham cię takim/taką, jakim/jaką jesteś."'}
                {selectedNeed === 'play' && 'Zabawa to podstawowe prawo dziecka. Czy dajesz sobie dziś pozwolenie na radość bez celu i oceniania?'}
                {selectedNeed === 'limits' && 'Zdrowe granice to akt miłości. Ochrona siebie to nie egoizm — to szacunek dla własnych potrzeb.'}
                {selectedNeed === 'seen' && 'Bycie widzianym i słyszanym — tego szuka każde dziecko. Dziś zauważ siebie. Twoje uczucia są prawdziwe.'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* LETTER */}
        <SectionHeader label="LIST DO WEWNĘTRZNEGO DZIECKA" accent={ACCENT} />
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={[styles.card, { borderColor: ACCENT + '30' }]}>
            <Text style={{ color: subColor, fontSize: 12, marginBottom: 8 }}>
              Napisz do siebie — do małego Ciebie. Co chcesz mu/jej powiedzieć?
            </Text>
            <TextInput
              style={[styles.textArea, { color: textColor, borderColor: ACCENT + '40' }]}
              placeholder="Drogi mały ja..."
              placeholderTextColor={subColor}
              multiline
              value={letterText}
              onChangeText={setLetterText}
            />
            <Pressable onPress={handleSaveLetter} style={[styles.ctaBtn, { backgroundColor: ACCENT }]}>
              <Text style={styles.ctaBtnText}>WYŚLIJ LIST ✦</Text>
            </Pressable>
          </View>
          {letterHistory.length > 0 && (
            <Pressable onPress={() => setShowHistory(!showHistory)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
              <History size={14} color={ACCENT} />
              <Text style={{ color: ACCENT, fontSize: 12 }}>Historia listów ({letterHistory.length})</Text>
            </Pressable>
          )}
          {showHistory && letterHistory.map(l => (
            <View key={l.id} style={[styles.card, { borderColor: ACCENT + '25', marginTop: 8 }]}>
              <Text style={{ color: subColor, fontSize: 11, marginBottom: 4 }}>{l.date}</Text>
              <Text style={{ color: textColor, fontSize: 13, lineHeight: 20 }}>{l.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* REPARENTING EXERCISES */}
        <SectionHeader label="ĆWICZENIA REPARENTINGOWE" accent={ACCENT} />
        {EXERCISES.map((ex, i) => (
          <Animated.View key={ex.id} entering={FadeInDown.delay(240 + i * 50).springify()}>
            <View style={[styles.card, { borderColor: ex.color + '40', borderLeftWidth: 3, borderLeftColor: ex.color }]}>
              <Text style={{ color: ex.color, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>ĆWICZENIE {i + 1}</Text>
              <Text style={{ color: textColor, fontSize: 14, fontWeight: '600', marginBottom: 6 }}>{ex.title}</Text>
              <Text style={{ color: subColor, fontSize: 13, lineHeight: 20 }}>{ex.desc}</Text>
            </View>
          </Animated.View>
        ))}

        {/* QUESTIONS ACCORDION */}
        <SectionHeader label="PYTANIA DO DZIECKA" accent={ACCENT} />
        {QUESTIONS.map((q, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(300 + i * 40).springify()}>
            <Pressable onPress={() => { void HapticsService.impact(); setExpandedQ(expandedQ === i ? null : i); }}
              style={[styles.card, { borderColor: expandedQ === i ? ACCENT + '60' : cardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: textColor, fontSize: 13, flex: 1, lineHeight: 20 }}>{q}</Text>
                <Text style={{ color: ACCENT, fontSize: 18 }}>{expandedQ === i ? '−' : '+'}</Text>
              </View>
              {expandedQ === i && (
                <TextInput
                  style={[styles.textArea, { color: textColor, borderColor: ACCENT + '40', marginTop: 10, minHeight: 60 }]}
                  placeholder="Twoja odpowiedź..."
                  placeholderTextColor={subColor}
                  multiline
                  value={qAnswers[i]}
                  onChangeText={v => setQAnswers(prev => { const n = [...prev]; n[i] = v; return n; })}
                />
              )}
            </Pressable>
          </Animated.View>
        ))}

        {/* AI ORACLE */}
        <SectionHeader label="ZAPYTAJ WYROCZNIĘ" accent={ACCENT} />
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={[styles.card, { borderColor: ACCENT + '40' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Sparkles size={16} color={ACCENT} />
              <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '700' }}>WYROCZNIA WEWNĘTRZNEGO DZIECKA</Text>
            </View>
            <TextInput
              style={[styles.textInput, { color: textColor, borderColor: ACCENT + '40' }]}
              placeholder="Co chcesz zapytać o swoje wewnętrzne dziecko?"
              placeholderTextColor={subColor}
              value={aiInput}
              onChangeText={setAiInput}
            />
            <Pressable onPress={handleAskOracle} disabled={aiLoading}
              style={[styles.ctaBtn, { backgroundColor: aiLoading ? ACCENT + '60' : ACCENT, marginTop: 10 }]}>
              <Text style={styles.ctaBtnText}>{aiLoading ? 'PYTAM...' : 'ZAPYTAJ ✦'}</Text>
            </Pressable>
            {!!aiText && (
              <View style={{ marginTop: 12, padding: 12, backgroundColor: ACCENT + '15', borderRadius: 10 }}>
                <Text style={{ color: textColor, fontSize: 13, lineHeight: 22 }}>{aiText}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        <EndOfContentSpacer />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen,
    paddingBottom: 8,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 2.5 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  needCard: {
    width: '30%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 4,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
  },
  ctaBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  ctaBtnText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
});
