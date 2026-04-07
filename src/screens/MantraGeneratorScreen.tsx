// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Line,
  Path,
  Defs,
  RadialGradient as SvgRadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  FadeInDown,
  FadeInUp,
  Easing,
} from 'react-native-reanimated';
import {
  ChevronLeft,
  Star,
  Sparkles,
  Music2,
  Volume2,
  BookmarkPlus,
  Wind,
  Flame,
  Heart,
  ArrowRight,
  RefreshCw,
  Clock,
  Sun,
  Moon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTheme } from '../core/hooks/useTheme';
// ─── Constants ───────────────────────────────────────────────────────────────

const { width: SW } = Dimensions.get('window');
const ACCENT = '#F59E0B';
const BG_GRADIENT = ['#0D0B1E', '#1A0A3D', '#0B0F2E'];

const INTENTIONS = [
  { id: 'spokoj',      label: 'Spokój',      color: '#38BDF8', emoji: '🌊' },
  { id: 'obfitosc',   label: 'Obfitość',    color: '#10B981', emoji: '✨' },
  { id: 'milosc',     label: 'Miłość',      color: '#F472B6', emoji: '💗' },
  { id: 'uzdrowienie',label: 'Uzdrowienie', color: '#818CF8', emoji: '🌿' },
  { id: 'ochrona',    label: 'Ochrona',     color: '#F97316', emoji: '🛡' },
  { id: 'przebudzenie',label: 'Przebudzenie',color: '#FBBF24',emoji: '🔥' },
] as const;

const ENERGY_STATES = [
  { id: 'niski',        label: 'Niski',         icon: Moon },
  { id: 'zrownowazony', label: 'Zrównoważony',  icon: Wind },
  { id: 'wysoki',       label: 'Wysoki',         icon: Sun },
] as const;

const CO_DALEJ_CARDS = [
  { title: 'Medytacja',   desc: 'Praktykuj z mantrą w ciszy',        route: 'Meditation',  Icon: Wind,    color: '#818CF8' },
  { title: 'Rytuały',     desc: 'Wpleć mantrę w ceremonię',          route: 'Rituals',     Icon: Flame,   color: '#F97316' },
  { title: 'Pranajama',   desc: 'Zsynchronizuj mantrę z oddechem',   route: 'Breathwork',  Icon: Heart,   color: '#38BDF8' },
];

// ─── Rotating SVG Mandala ─────────────────────────────────────────────────────

const MandalaBg = ({ accent }: { accent: string }) => {
  const rot = useSharedValue(0);
  const rot2 = useSharedValue(0);

  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 18000, easing: Easing.linear }), -1, false);
    rot2.value = withRepeat(withTiming(-360, { duration: 26000, easing: Easing.linear }), -1, false);
  }, []);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));
  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot2.value}deg` }],
  }));

  const cx = SW / 2;
  const cy = 170;
  const R = 110;

  const petals = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 2 * Math.PI;
    const x1 = cx + Math.cos(angle) * (R * 0.35);
    const y1 = cy + Math.sin(angle) * (R * 0.35);
    const x2 = cx + Math.cos(angle) * R;
    const y2 = cy + Math.sin(angle) * R;
    const cpX = cx + Math.cos(angle + 0.4) * (R * 0.7);
    const cpY = cy + Math.sin(angle + 0.4) * (R * 0.7);
    return `M${x1},${y1} Q${cpX},${cpY} ${x2},${y2}`;
  });

  const spokes6 = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * 2 * Math.PI;
    return { x1: cx + Math.cos(a) * 28, y1: cy + Math.sin(a) * 28, x2: cx + Math.cos(a) * 80, y2: cy + Math.sin(a) * 80 };
  });

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <Svg width={SW} height={340} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Defs>
          <SvgRadialGradient id="mandalaBg" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={accent} stopOpacity={0.12} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
          </SvgRadialGradient>
        </Defs>
        {/* Static outer glow */}
        <Circle cx={cx} cy={cy} r={R + 20} fill="url(#mandalaBg)" />
        <Circle cx={cx} cy={cy} r={R + 24} stroke={accent} strokeWidth={0.5} fill="none" opacity={0.2} strokeDasharray="3 12" />

        </Svg>

      {/* Layer 1: outer rotating SVG (React Native Reanimated + SVG) */}
      <Animated.View style={[StyleSheet.absoluteFill, outerStyle, { top: 0, left: 0 }]} pointerEvents="none">
        <Svg width={SW} height={340} style={{ position: 'absolute', top: 0, left: 0 }}>
          {petals.map((d, i) => (
            <Path key={i} d={d} stroke={accent} strokeWidth={0.9} fill="none" opacity={0.3 - i * 0.01} strokeLinecap="round" />
          ))}
          <Circle cx={cx} cy={cy} r={R} stroke={accent} strokeWidth={0.7} fill="none" opacity={0.22} strokeDasharray="5 9" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * 2 * Math.PI;
            return <Circle key={i} cx={cx + Math.cos(a) * R} cy={cy + Math.sin(a) * R} r={2.5} fill={accent} opacity={0.5} />;
          })}
        </Svg>
      </Animated.View>

      {/* Layer 2: inner counter-rotating */}
      <Animated.View style={[StyleSheet.absoluteFill, innerStyle, { top: 0, left: 0 }]} pointerEvents="none">
        <Svg width={SW} height={340} style={{ position: 'absolute', top: 0, left: 0 }}>
          <Circle cx={cx} cy={cy} r={72} stroke={accent} strokeWidth={0.8} fill="none" opacity={0.28} strokeDasharray="2 6" />
          <Circle cx={cx} cy={cy} r={50} stroke={accent} strokeWidth={0.6} fill="none" opacity={0.20} strokeDasharray="3 8" />
          {spokes6.map((s, i) => (
            <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={accent} strokeWidth={0.7} opacity={0.35} />
          ))}
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * 2 * Math.PI;
            return <Circle key={i} cx={cx + Math.cos(a) * 50} cy={cy + Math.sin(a) * 50} r={3} fill={accent} opacity={0.55} />;
          })}
        </Svg>
      </Animated.View>

      {/* Static center eye */}
      <Svg width={SW} height={340} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
        <Circle cx={cx} cy={cy} r={22} fill={accent + '18'} stroke={accent + '66'} strokeWidth={1.2} />
        <Circle cx={cx} cy={cy} r={10} fill={accent + '33'} stroke={accent + '99'} strokeWidth={1} />
        <Circle cx={cx} cy={cy} r={4} fill={accent} opacity={0.92} />
      </Svg>
    </View>
  );
};

// ─── Saved Mantra Card ────────────────────────────────────────────────────────

interface MantraResult {
  sanskrit: string;
  phonetic: string;
  meaning: string;
  affirmation: string;
  timing: string;
  intention: string;
  intentionColor: string;
}

const SavedMantraCard = ({ item, isLight, index }: { item: MantraResult; isLight: boolean; index: number }) => (
  <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
    <LinearGradient
      colors={isLight ? ['#F5F0FF', '#EDE8FF'] : ['rgba(129,140,248,0.10)', 'rgba(13,11,30,0.60)']}
      style={[styles.savedCard, { borderColor: item.intentionColor + '44' }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <View style={[styles.savedIntentionPill, { backgroundColor: item.intentionColor + '22', borderColor: item.intentionColor + '55' }]}>
          <Text style={[styles.savedIntentionText, { color: item.intentionColor }]}>{item.intention}</Text>
        </View>
        <View style={[styles.savedTimingPill, { backgroundColor: ACCENT + '18' }]}>
          <Clock color={ACCENT} size={10} strokeWidth={2} />
          <Text style={styles.savedTimingText}>{item.timing}</Text>
        </View>
      </View>
      <Text style={[styles.savedSanskrit, { color: isLight ? '#1A1028' : ACCENT }]}>{item.sanskrit}</Text>
      <Text style={[styles.savedPhonetic, { color: isLight ? '#5A4A78' : 'rgba(255,255,255,0.55)' }]}>{item.phonetic}</Text>
      <Text style={[styles.savedMeaning, { color: isLight ? '#3A2858' : 'rgba(255,255,255,0.70)' }]}>{item.meaning}</Text>
    </LinearGradient>
  </Animated.View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const MantraGeneratorScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const savedMantras = useAppStore(s => s.savedMantras);
  const addSavedMantra = useAppStore(s => s.addSavedMantra);
  const { isLight } = useTheme();
  const [selectedIntention, setSelectedIntention] = useState<string>('spokoj');
  const [energyState, setEnergyState] = useState<string>('zrownowazony');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MantraResult | null>(null);
  const [audioMessage, setAudioMessage] = useState('');
  const starred = isFavoriteItem('mantra-generator');

  const scrollRef = useRef<ScrollView>(null);
  const audioMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (audioMessageTimerRef.current) clearTimeout(audioMessageTimerRef.current); };
  }, []);

  const activeIntention = INTENTIONS.find(i => i.id === selectedIntention) ?? INTENTIONS[0];

  // ── Generate mantra via AI ──
  const handleGenerate = useCallback(async () => {
    HapticsService.impact('medium');
    setIsLoading(true);
    setResult(null);
    setAudioMessage('');
    try {
      const energyLabel = ENERGY_STATES.find(e => e.id === energyState)?.label ?? 'Zrównoważony';
      const keywordPart = focusKeyword.trim() ? `Słowo klucz użytkownika: "${focusKeyword.trim()}".` : '';
      const prompt = `Jesteś mistrzem mantr wedyjskich. Na podstawie poniższego profilu wygeneruj spersonalizowaną mantrę.

Intencja: ${activeIntention.label}
Stan energetyczny: ${energyLabel}
${keywordPart}

Odpowiedz WYŁĄCZNIE w tym formacie JSON (bez markdown, bez komentarzy):
{
  "sanskrit": "mantra w sanskrycie (3-7 sylab, autentyczna lub neo-wedyjska)",
  "phonetic": "zapis fonetyczny w języku użytkownika (jak wymawiać)",
  "meaning": "znaczenie w języku użytkownika (1-2 zdania)",
  "affirmation": "afirmacja partnerska w języku użytkownika (1 zdanie zaczynające się od 'Jestem' lub 'Otwieram')",
  "timing": "rano / wieczorem / rano i wieczorem"
}`;

      const messages = [{ role: 'user' as const, content: prompt }];
      const raw = await AiService.chatWithOracle(messages);

      // Parse JSON from response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      const parsed = JSON.parse(jsonMatch[0]);

      const mantra: MantraResult = {
        sanskrit: parsed.sanskrit ?? 'Om Shanti Om',
        phonetic: parsed.phonetic ?? 'Om Szan-ti Om',
        meaning: parsed.meaning ?? 'Mantra pokoju i harmonii.',
        affirmation: parsed.affirmation ?? 'Jestem spokojny i zakorzeniony.',
        timing: parsed.timing ?? 'rano i wieczorem',
        intention: activeIntention.label,
        intentionColor: activeIntention.color,
      };
      setResult(mantra);
      HapticsService.impact('medium');
      setTimeout(() => scrollRef.current?.scrollTo({ y: 500, animated: true }), 300);
    } catch (err) {
      console.warn('[MantraGenerator] AI error:', err);
      // Fallback mantra
      setResult({
        sanskrit: 'Om Śānti Hṛdayam',
        phonetic: 'Om Szan-ti Hri-da-jam',
        meaning: 'Pokój serca — mantra przywołująca ciszę wewnętrznego centrum.',
        affirmation: 'Jestem cisza pomiędzy myślami.',
        timing: 'rano i wieczorem',
        intention: activeIntention.label,
        intentionColor: activeIntention.color,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedIntention, energyState, focusKeyword, activeIntention]);

  // ── Save mantra to persistent store ──
  const handleSave = useCallback(() => {
    if (!result) return;
    HapticsService.impact('medium');
    addSavedMantra({ ...result, id: `mantra_${Date.now()}`, createdAt: Date.now() });
    setResult(null);
  }, [result, addSavedMantra]);

  // ── Audio placeholder ──
  const handleAudio = useCallback(() => {
    HapticsService.impact('medium');
    setAudioMessage('Naciśnij i trzymaj aby recytować • Skupiony oddech synchronizuje powtórzenia');
    if (audioMessageTimerRef.current) clearTimeout(audioMessageTimerRef.current);
    audioMessageTimerRef.current = setTimeout(() => setAudioMessage(''), 4000);
  }, []);

  // ── Star / favorite ──
  const handleStar = useCallback(() => {
    HapticsService.impact('medium');
    if (isFavoriteItem('mantra-generator')) {
      removeFavoriteItem('mantra-generator');
    } else {
      addFavoriteItem({
        id: 'mantra-generator',
        label: 'Generator Mantry',
        sublabel: 'Twój sakralny generator mantr',
        route: 'MantraGenerator',
        icon: 'Music2',
        color: '#818CF8',
        addedAt: Date.now(),
      });
    }
  }, [addFavoriteItem, removeFavoriteItem, isFavoriteItem]);

  // ── Derived colors ──
  const textColor = isLight ? '#1A1028' : '#F0ECF8';
  const subColor = isLight ? '#5A4A78' : 'rgba(255,255,255,0.60)';
  const cardBg = isLight ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(129,140,248,0.25)' : 'rgba(129,140,248,0.20)';
  const inputBg = isLight ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.07)';
  const inputBorder = isLight ? 'rgba(129,140,248,0.35)' : 'rgba(129,140,248,0.28)';

  return (
<View style={{ flex: 1, backgroundColor: isLight ? '#F0ECF8' : '#0D0B1E' }}>
  <SafeAreaView edges={['top']} style={[styles.safe, {}]}>

      {/* Background gradient */}
      <LinearGradient
        colors={isLight ? ['#F0ECF8', '#E8E0F8', '#EEE8FF'] : BG_GRADIENT}
        style={StyleSheet.absoluteFill}
      />

      {/* Rotating mandala hero background */}
      <MandalaBg accent={activeIntention.color} />

      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingHorizontal: layout.padding.screen }]}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={styles.backBtn} hitSlop={12}>
          <ChevronLeft color={isLight ? '#5A4A78' : 'rgba(255,255,255,0.70)'} size={22} strokeWidth={2} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerEyebrow, { color: activeIntention.color }]}>TWOJA ŚCIEŻKA DŹWIĘKOWA</Text>
          <Text style={[styles.headerTitle, { color: textColor }]}>Generator Mantry</Text>
        </View>
        <Pressable onPress={handleStar} hitSlop={12}>
          <Star
            color={starred ? ACCENT : (isLight ? '#9080B8' : 'rgba(255,255,255,0.50)')}
            fill={starred ? ACCENT : 'none'}
            size={20}
            strokeWidth={1.8}
          />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingHorizontal: layout.padding.screen }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero spacer for mandala */}
          <View style={{ height: 200 }} />

          {/* ── SUBTITLE ── */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: 28 }}>
            <Text style={[styles.heroSubtitle, { color: subColor }]}>
              Wybierz intencję, stan energetyczny i słowo klucz — AI stworzy Twoją spersonalizowaną mantrę wedyjską.
            </Text>
          </Animated.View>

          {/* ── INTENTION SELECTOR ── */}
          <Animated.View entering={FadeInDown.delay(160).springify()} style={{ marginBottom: 24 }}>
            <Text style={[styles.sectionLabel, { color: isLight ? '#7B6FAA' : 'rgba(255,255,255,0.45)' }]}>INTENCJA</Text>
            <View style={styles.intentionGrid}>
              {INTENTIONS.map((intention) => {
                const isActive = selectedIntention === intention.id;
                return (
                  <Pressable
                    key={intention.id}
                    onPress={() => {
                      HapticsService.impact('medium');
                      setSelectedIntention(intention.id);
                    }}
                    style={[
                      styles.intentionChip,
                      {
                        borderColor: isActive ? intention.color : (isLight ? 'rgba(129,140,248,0.25)' : 'rgba(255,255,255,0.14)'),
                        backgroundColor: isActive
                          ? intention.color + '22'
                          : (isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.05)'),
                      },
                    ]}
                  >
                    <Text style={styles.intentionEmoji}>{intention.emoji}</Text>
                    <Text style={[styles.intentionLabel, { color: isActive ? intention.color : subColor }]}>
                      {intention.label}
                    </Text>
                    {isActive && (
                      <View style={[styles.intentionActiveDot, { backgroundColor: intention.color }]} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* ── ENERGY STATE ── */}
          <Animated.View entering={FadeInDown.delay(220).springify()} style={{ marginBottom: 24 }}>
            <Text style={[styles.sectionLabel, { color: isLight ? '#7B6FAA' : 'rgba(255,255,255,0.45)' }]}>STAN ENERGETYCZNY</Text>
            <View style={styles.energyRow}>
              {ENERGY_STATES.map((state) => {
                const isActive = energyState === state.id;
                const IconC = state.icon;
                return (
                  <Pressable
                    key={state.id}
                    onPress={() => {
                      HapticsService.impact('medium');
                      setEnergyState(state.id);
                    }}
                    style={[
                      styles.energyPill,
                      {
                        borderColor: isActive ? ACCENT : (isLight ? 'rgba(129,140,248,0.25)' : 'rgba(255,255,255,0.14)'),
                        backgroundColor: isActive
                          ? ACCENT + '1E'
                          : (isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.05)'),
                        flex: 1,
                      },
                    ]}
                  >
                    <IconC color={isActive ? ACCENT : subColor} size={14} strokeWidth={2} />
                    <Text style={[styles.energyLabel, { color: isActive ? ACCENT : subColor }]}>{state.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* ── FOCUS KEYWORD ── */}
          <Animated.View entering={FadeInDown.delay(280).springify()} style={{ marginBottom: 28 }}>
            <Text style={[styles.sectionLabel, { color: isLight ? '#7B6FAA' : 'rgba(255,255,255,0.45)' }]}>SŁOWO KLUCZ (OPCJONALNE)</Text>
            <TextInput
              value={focusKeyword}
              onChangeText={setFocusKeyword}
              placeholder="np. wdzięczność, transformacja, spokój…"
              placeholderTextColor={isLight ? 'rgba(90,74,120,0.45)' : 'rgba(255,255,255,0.28)'}
              style={[
                styles.keywordInput,
                {
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
                  color: textColor,
                },
              ]}
              maxLength={40}
            />
          </Animated.View>

          {/* ── GENERATE BUTTON ── */}
          <Animated.View entering={FadeInDown.delay(340).springify()} style={{ marginBottom: 28 }}>
            <Pressable
              onPress={handleGenerate}
              disabled={isLoading}
              style={({ pressed }) => [styles.generateBtn, { opacity: pressed ? 0.88 : 1 }]}
            >
              <LinearGradient
                colors={[activeIntention.color, ACCENT, activeIntention.color + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateBtnInner}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Sparkles color="#FFF" size={18} strokeWidth={2} />
                    <Text style={styles.generateBtnText}>Wygeneruj Mantrę</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── RESULT CARD ── */}
          {result && (
            <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: 28 }}>
              <LinearGradient
                colors={isLight
                  ? ['#F8F4FF', '#F0EAFF', '#EBE4FF']
                  : ['rgba(129,140,248,0.14)', 'rgba(30,20,60,0.90)', 'rgba(13,11,30,0.95)']}
                style={[styles.resultCard, { borderColor: result.intentionColor + '55' }]}
              >
                {/* Intention badge */}
                <View style={[styles.resultBadgeRow]}>
                  <View style={[styles.resultIntentionBadge, { backgroundColor: result.intentionColor + '22', borderColor: result.intentionColor + '55' }]}>
                    <Text style={[styles.resultIntentionText, { color: result.intentionColor }]}>{result.intention}</Text>
                  </View>
                  <View style={[styles.resultTimingBadge, { backgroundColor: ACCENT + '1A', borderColor: ACCENT + '44' }]}>
                    <Clock color={ACCENT} size={11} strokeWidth={2} />
                    <Text style={[styles.resultTimingText, { color: ACCENT }]}>{result.timing}</Text>
                  </View>
                </View>

                {/* Decorative divider */}
                <View style={[styles.resultDivider, { backgroundColor: result.intentionColor + '33' }]} />

                {/* Sanskrit mantra — hero text */}
                <Text style={[styles.resultSanskrit, { color: isLight ? '#2A1860' : ACCENT }]}>
                  {result.sanskrit}
                </Text>

                {/* Phonetic */}
                <Text style={[styles.resultPhonetic, { color: isLight ? '#6B52A0' : 'rgba(255,255,255,0.52)' }]}>
                  {result.phonetic}
                </Text>

                <View style={[styles.resultDivider, { backgroundColor: result.intentionColor + '22', marginVertical: 14 }]} />

                {/* Meaning */}
                <Text style={[styles.resultMeaningLabel, { color: isLight ? '#7B6FAA' : 'rgba(255,255,255,0.38)' }]}>ZNACZENIE</Text>
                <Text style={[styles.resultMeaning, { color: isLight ? '#2A1860' : 'rgba(255,255,255,0.82)' }]}>
                  {result.meaning}
                </Text>

                {/* Affirmation */}
                <LinearGradient
                  colors={[result.intentionColor + '14', result.intentionColor + '08']}
                  style={[styles.resultAffirmBox, { borderColor: result.intentionColor + '33' }]}
                >
                  <Text style={[styles.resultAffirmLabel, { color: result.intentionColor }]}>AFIRMACJA PARTNERSKA</Text>
                  <Text style={[styles.resultAffirmText, { color: isLight ? '#1A1028' : 'rgba(255,255,255,0.88)' }]}>
                    {result.affirmation}
                  </Text>
                </LinearGradient>

                {/* Action buttons */}
                <View style={styles.resultActions}>
                  {/* Audio play placeholder */}
                  <Pressable
                    onPress={handleAudio}
                    style={[styles.resultActionBtn, { borderColor: result.intentionColor + '55', backgroundColor: result.intentionColor + '14' }]}
                  >
                    <Volume2 color={result.intentionColor} size={16} strokeWidth={2} />
                    <Text style={[styles.resultActionText, { color: result.intentionColor }]}>Recytuj</Text>
                  </Pressable>

                  {/* Regenerate */}
                  <Pressable
                    onPress={handleGenerate}
                    disabled={isLoading}
                    style={[styles.resultActionBtn, { borderColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.18)', backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)' }]}
                  >
                    <RefreshCw color={isLight ? '#7B6FAA' : 'rgba(255,255,255,0.55)'} size={16} strokeWidth={2} />
                    <Text style={[styles.resultActionText, { color: isLight ? '#7B6FAA' : 'rgba(255,255,255,0.55)' }]}>Nowa</Text>
                  </Pressable>

                  {/* Save */}
                  <Pressable
                    onPress={handleSave}
                    style={[styles.resultActionBtn, { borderColor: ACCENT + '55', backgroundColor: ACCENT + '14' }]}
                  >
                    <BookmarkPlus color={ACCENT} size={16} strokeWidth={2} />
                    <Text style={[styles.resultActionText, { color: ACCENT }]}>{t('common.save')}</Text>
                  </Pressable>
                </View>

                {/* Audio message */}
                {!!audioMessage && (
                  <Animated.View entering={FadeInUp.springify()} style={[styles.audioMessage, { backgroundColor: result.intentionColor + '18', borderColor: result.intentionColor + '33' }]}>
                    <Music2 color={result.intentionColor} size={13} strokeWidth={2} />
                    <Text style={[styles.audioMessageText, { color: result.intentionColor }]}>{audioMessage}</Text>
                  </Animated.View>
                )}
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── SAVED MANTRAS ── */}
          {savedMantras.length > 0 && (
            <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: 28 }}>
              <Text style={[styles.sectionLabel, { color: isLight ? '#7B6FAA' : 'rgba(255,255,255,0.45)', marginBottom: 12 }]}>
                ZAPISANE MANTRY ({savedMantras.length})
              </Text>
              {savedMantras.map((item, index) => (
                <SavedMantraCard key={index} item={item} isLight={isLight} index={index} />
              ))}
            </Animated.View>
          )}

          {/* ── CO DALEJ? ── */}
          <Animated.View entering={FadeInDown.delay(60).springify()} style={{ marginBottom: 8 }}>
            <Text style={[styles.sectionLabel, { color: isLight ? '#7B6FAA' : 'rgba(255,255,255,0.45)', marginBottom: 12 }]}>CO DALEJ?</Text>
            {CO_DALEJ_CARDS.map((card, i) => {
              const IconC = card.Icon;
              return (
                <Animated.View key={card.route} entering={FadeInDown.delay(80 + i * 60).springify()}>
                  <Pressable
                    onPress={() => {
                      HapticsService.impact('medium');
                      navigation.navigate(card.route);
                    }}
                    style={({ pressed }) => [styles.coDalejCard, {
                      borderColor: pressed ? card.color + '55' : (isLight ? 'rgba(129,140,248,0.20)' : 'rgba(255,255,255,0.10)'),
                      backgroundColor: pressed
                        ? card.color + '12'
                        : (isLight ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.05)'),
                    }]}
                  >
                    <View style={[styles.coDalejIcon, { backgroundColor: card.color + '22', borderColor: card.color + '44' }]}>
                      <IconC color={card.color} size={18} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.coDalejTitle, { color: textColor }]}>{card.title}</Text>
                      <Text style={[styles.coDalejDesc, { color: subColor }]}>{card.desc}</Text>
                    </View>
                    <ArrowRight color={card.color} size={16} strokeWidth={1.8} opacity={0.7} />
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </KeyboardAvoidingView>
        </SafeAreaView>
</View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    zIndex: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  content: {
    paddingBottom: 24,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
    marginBottom: 10,
  },
  // Intention grid
  intentionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intentionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.2,
    minWidth: (SW - layout.padding.screen * 2 - 8 * 2) / 3,
  },
  intentionEmoji: {
    fontSize: 14,
  },
  intentionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  intentionActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
  },
  // Energy state
  energyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  energyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1.2,
  },
  energyLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  // Keyword input
  keywordInput: {
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  // Generate button
  generateBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  generateBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
  },
  generateBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Result card
  resultCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 22,
    overflow: 'hidden',
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  resultBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  resultIntentionBadge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  resultIntentionText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  resultTimingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  resultTimingText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  resultDivider: {
    height: 1,
    borderRadius: 1,
    marginBottom: 16,
  },
  resultSanskrit: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 42,
  },
  resultPhonetic: {
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  resultMeaningLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  resultMeaning: {
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0.2,
    marginBottom: 16,
  },
  resultAffirmBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
  },
  resultAffirmLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  resultAffirmText: {
    fontSize: 15,
    lineHeight: 23,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resultActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  resultActionText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  audioMessageText: {
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.2,
    flex: 1,
  },
  // Saved mantras
  savedCard: {
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 16,
    marginBottom: 10,
  },
  savedIntentionPill: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
  },
  savedIntentionText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  savedTimingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  savedTimingText: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  savedSanskrit: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 2.5,
    marginBottom: 4,
    lineHeight: 28,
  },
  savedPhonetic: {
    fontSize: 12,
    letterSpacing: 1.2,
    fontStyle: 'italic',
    marginBottom: 5,
  },
  savedMeaning: {
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  // Co dalej
  coDalejCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  coDalejIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coDalejTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  coDalejDesc: {
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
});
