// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '../core/utils/localeFormat';
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal,
  Alert, Dimensions, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft, Star, Flame, User, Heart, Frown, Briefcase, Feather,
  Trash2, BookOpen, Sparkles, Wind, Check,
} from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Ellipse, Path, G, Rect, Polygon } from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp,
  useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
  withDelay, Easing, interpolate, runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#F59E0B';

// ── RELEASE LETTER TYPES ──────────────────────────────────────
const LETTER_TARGETS = [
  { id: 'person',    label: 'Do osoby',           sub: 'Wpisz imię',        icon: User,    color: '#F87171', needsName: true },
  { id: 'past_self', label: 'Do siebie z przeszłości', sub: 'Twój dawny ja',  icon: Heart,   color: '#FB923C', needsName: false },
  { id: 'emotion',   label: 'Do emocji',           sub: 'Gniew, lęk, żal...',icon: Frown,   color: '#FBBF24', needsName: true },
  { id: 'situation', label: 'Do sytuacji',         sub: 'Wydarzenie, czas',  icon: Briefcase,color: '#A78BFA', needsName: true },
] as const;

const RELEASE_AFFIRMATIONS = [
  'Uwolnienie przynosi mi spokój głębszy niż jakiekolwiek słowa.',
  'To, co puściłam/em, było krokiem, nie moją istotą.',
  'Moje serce ma teraz więcej miejsca na to, co naprawdę moje.',
  'Jestem lżejsza/y. Jestem wolna/y. Jestem bezpieczna/a.',
  'Każde uwolnienie jest aktem miłości do siebie samej/ego.',
  'Puściłam/em to z miłością. Nie ma już nad mną władzy.',
  'Przestrzeń, którą stworzyłam/em, wypełni się nowym dobrem.',
  'Jestem gotowa/y na nowy rozdział — czysta karta, nowe możliwości.',
  'Ból, który nosiliłam/em, był nauczycielem. Teraz go wypuszczam.',
  'Moje uwolnienie jest kompletne. Jestem cała/y.',
];

// ── PARCHMENT WIDGET — 3D Pergamin z ogniem ────────────────────
const ScrollAndFlameWidget = React.memo(({ isDark }: { isDark: boolean }) => {
  const tiltX = useSharedValue(-8);
  const tiltY = useSharedValue(0);
  const pulse = useSharedValue(1);
  const flame1 = useSharedValue(0);
  const flame2 = useSharedValue(0);
  const particle1 = useSharedValue(0);
  const particle2 = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.04, { duration: 2800 }), withTiming(0.97, { duration: 2800 })),
      -1, false,
    );
    flame1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 500 }),
        withTiming(0.9, { duration: 400 }),
      ), -1, false,
    );
    flame2.value = withRepeat(
      withSequence(
        withDelay(200, withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })),
        withTiming(0.5, { duration: 400 }),
        withTiming(0.85, { duration: 500 }),
      ), -1, false,
    );
    particle1.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
    particle2.value = withRepeat(withDelay(600, withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) })), -1, false);
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tiltY.value = Math.max(-30, Math.min(30, e.translationX * 0.2));
      tiltX.value = Math.max(-30, Math.min(10, -8 + e.translationY * 0.16));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-8, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: pulse.value },
    ],
  }));

  const flame1Style = useAnimatedStyle(() => ({
    opacity: flame1.value,
    transform: [{ scaleY: flame1.value }],
  }));
  const flame2Style = useAnimatedStyle(() => ({
    opacity: flame2.value,
    transform: [{ scaleY: flame2.value }],
  }));
  const p1Style = useAnimatedStyle(() => ({
    opacity: interpolate(particle1.value, [0, 0.5, 1], [0, 1, 0]),
    transform: [{ translateY: -particle1.value * 40 }, { translateX: particle1.value * 8 }],
  }));
  const p2Style = useAnimatedStyle(() => ({
    opacity: interpolate(particle2.value, [0, 0.5, 1], [0, 1, 0]),
    transform: [{ translateY: -particle2.value * 30 }, { translateX: -particle2.value * 10 }],
  }));

  const S = 170;
  const cx = S / 2;

return (
    <GestureDetector gesture={panGesture}>
      <View style={{ height: S, alignItems: 'center', justifyContent: 'center', marginVertical: 4 }}>
        <Animated.View style={[{ width: S, height: S, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>
          <Svg width={S} height={S}>
            <Defs>
              <RadialGradient id="pergRg" cx="50%" cy="40%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#FEF3C7" stopOpacity="1" />
                <Stop offset="60%" stopColor="#FDE68A" stopOpacity="1" />
                <Stop offset="100%" stopColor="#D97706" stopOpacity="1" />
              </RadialGradient>
              <RadialGradient id="glowRg" cx="50%" cy="80%" rx="50%" ry="40%">
                <Stop offset="0%" stopColor={ACCENT} stopOpacity="0.6" />
                <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            {/* Glow beneath */}
            <Ellipse cx={cx} cy={S * 0.82} rx={48} ry={18} fill="url(#glowRg)" />
            {/* Parchment roll — curled top */}
            <Ellipse cx={cx} cy={44} rx={34} ry={8} fill="#D97706" opacity={0.7} />
            {/* Main parchment body */}
            <Rect x={cx - 34} y={44} width={68} height={70} rx={2} fill="url(#pergRg)" />
            {/* Text lines on parchment */}
            {[0, 1, 2, 3, 4].map((i) => (
              <Rect key={i} x={cx - 24} y={58 + i * 10} width={48 - (i % 3) * 8} height={3} rx={1.5}
                fill="#92400E" opacity={0.30} />
            ))}
            {/* Curled bottom */}
            <Ellipse cx={cx} cy={114} rx={34} ry={8} fill="#B45309" opacity={0.7} />
            {/* Wax seal */}
            <Circle cx={cx} cy={cx} r={10} fill={ACCENT} opacity={0.9} />
            <Circle cx={cx} cy={cx} r={6} fill="#92400E" opacity={0.8} />
          </Svg>

          {/* Animated flames at bottom of scroll */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 12 }, flame1Style]} pointerEvents="none">
            <Svg width={40} height={36}>
              <Path d="M20 34 C8 28 4 18 12 10 C14 18 18 16 20 10 C22 16 26 18 28 10 C36 18 32 28 20 34Z"
                fill="#F97316" opacity={0.85} />
            </Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 20 }, flame2Style]} pointerEvents="none">
            <Svg width={22} height={22}>
              <Path d="M11 20 C4 16 2 9 6 4 C7 9 9 8 11 4 C13 8 15 9 16 4 C20 9 18 16 11 20Z"
                fill="#FBBF24" opacity={0.9} />
            </Svg>
          </Animated.View>

          {/* Ash particles */}
          <Animated.View style={[{ position: 'absolute', bottom: 24, left: cx - 4, width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT + 'CC' }, p1Style]} pointerEvents="none" />
          <Animated.View style={[{ position: 'absolute', bottom: 24, right: cx - 8, width: 4, height: 4, borderRadius: 2, backgroundColor: '#FB923C99' }, p2Style]} pointerEvents="none" />
        </Animated.View>
      </View>
    </GestureDetector>
  );
});

// ── BURN ANIMATION OVERLAY ─────────────────────────────────────
const BurnOverlay = React.memo(({ visible, onComplete }: { visible: boolean; onComplete: () => void }) => {
  const flames = useSharedValue(0);
  const textOpacity = useSharedValue(1);
  const ashOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    flames.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) });
    textOpacity.value = withDelay(600, withTiming(0, { duration: 1200 }));
    ashOpacity.value = withDelay(1200, withTiming(1, { duration: 800 }));
    const t = setTimeout(() => onComplete(), 3200);
return () => clearTimeout(t);
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: flames.value,
  }));
  const ashStyle = useAnimatedStyle(() => ({
    opacity: ashOpacity.value,
  }));

  if (!visible) return null;
return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 100, alignItems: 'center', justifyContent: 'center' }, overlayStyle]}>
      <LinearGradient
        colors={['rgba(15,5,2,0.95)', 'rgba(30,10,2,0.98)', 'rgba(15,5,2,0.95)']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[{ alignItems: 'center' }, ashStyle]}>
        <Typography variant="displaySmall" style={{ color: ACCENT, fontSize: 40, marginBottom: 12 }}>✦</Typography>
        <Typography variant="headingMedium" style={{ color: '#FEF3C7', fontSize: 22, letterSpacing: 3, marginBottom: 8 }}>Uwolniono</Typography>
        <Typography variant="body" style={{ color: ACCENT + 'BB', fontSize: 14, letterSpacing: 1.5 }}>List oddany ogniowi</Typography>
      </Animated.View>
    </Animated.View>
  );
});

// ── MAIN SCREEN ────────────────────────────────────────────────
export const ReleaseLettersScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
    const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const releaseLetters = useAppStore(s => s.releaseLetters);
  const addReleaseLetter = useAppStore(s => s.addReleaseLetter);
  const { currentTheme, isLight } = useTheme();
  const isDark = !isLight;

  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [targetName, setTargetName] = useState('');
  const [letterText, setLetterText] = useState('');
  const [burnOverlayVisible, setBurnOverlayVisible] = useState(false);
  const [postReleaseAffirmations, setPostReleaseAffirmations] = useState<string[]>([]);
  const [showPostRelease, setShowPostRelease] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [releaseAiInsight, setReleaseAiInsight] = useState<string>('');
  const [releaseAiLoading, setReleaseAiLoading] = useState(false);

  const isFav = isFavoriteItem('release-letters');

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
return () => { show.remove(); hide.remove(); };
  }, []);

  const toggleFav = useCallback(() => {
    HapticsService.impact('light');
    if (isFav) {
      removeFavoriteItem('release-letters');
    } else {
      addFavoriteItem({ id: 'release-letters', label: 'Listy Uwolnienia', icon: 'Feather', color: ACCENT, route: 'ReleaseLetters', addedAt: new Date().toISOString() });
    }
  }, [isFav]);

  const handleTargetSelect = (target: typeof LETTER_TARGETS[number]) => {
    HapticsService.impact('light');
    setSelectedTarget(target.id);
    if (target.needsName) {
      setShowNameModal(true);
    } else {
      setTargetName('Do siebie z przeszłości');
    }
  };

  const confirmName = () => {
    setTargetName(nameInput || 'Odbiorca');
    setShowNameModal(false);
  };

  const handleSave = () => {
    if (letterText.trim().length < 2) { Alert.alert('Puste pole', 'Napisz coś w liście przed zapisaniem.'); return; }
    HapticsService.impact('medium');
    const tgt = LETTER_TARGETS.find(t => t.id === selectedTarget);
    addReleaseLetter({
      id: Date.now().toString(),
      target: tgt?.label ?? 'Odbiorca',
      name: targetName,
      date: formatLocaleDate(new Date()),
    });
    Alert.alert('Zachowano', 'List zapisany w pamięci — bez treści, tylko intencja.');
    setLetterText('');
  };

  const handleBurn = () => {
    if (!letterText.trim() || letterText.length < 20) {
      Alert.alert('Za krótki list', 'Napisz przynajmniej kilka zdań przed ceremonią spalenia.');
      return;
    }
    HapticsService.impact('heavy');
    setBurnOverlayVisible(true);
    const tgt = LETTER_TARGETS.find(t => t.id === selectedTarget);
    addReleaseLetter({
      id: Date.now().toString(),
      target: tgt?.label ?? 'Odbiorca',
      name: targetName,
      date: formatLocaleDate(new Date()),
    });
  };

  const handleBurnComplete = () => {
    setBurnOverlayVisible(false);
    setLetterText('');
    HapticsService.notify();
    const shuffled = [...RELEASE_AFFIRMATIONS].sort(() => Math.random() - 0.5);
    setPostReleaseAffirmations(shuffled.slice(0, 3));
    setShowPostRelease(true);
  };

  const textColor = isLight ? '#1C1410' : '#FEF3C7';
  const subColor = isLight ? 'rgba(28,20,16,0.55)' : 'rgba(254,243,199,0.55)';
  const { t } = useTranslation();
  const cardBg = isLight ? 'rgba(245,158,11,0.07)' : 'rgba(245,158,11,0.08)';
  const cardBorder = isLight ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.15)';

  const gradColors = isLight
    ? ['#FEF9EE', '#FDF4DA', '#FAE8B0']
    : ['#0C0906', '#14100A', '#1C1610'];

    const fetchReleaseAi = async () => {
    setReleaseAiLoading(true);
    HapticsService.notify();
    try {
      const tgt = LETTER_TARGETS.find(t => t.id === selectedTarget);
      const prompt = "List uwolnienia. Odbiorca: " + (tgt ? tgt.label : "nieznany") + ". Imie/opis: " + targetName + ". Dlugosc listu: " + letterText.length + " znakow. Napisz krotka (3-4 zdania) duchowa interpretacje tego aktu uwolnienia — co oznacza puscic ta osobe, emocje lub sytuacje, oraz jedno przeslanie dla uzytkownika na droge po ceremonii spalenia.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setReleaseAiInsight(result);
    } catch (e) {
      setReleaseAiInsight("Blad pobierania interpretacji.");
    } finally {
      setReleaseAiLoading(false);
    }
  };
return (
    <View style={{ flex: 1, backgroundColor: gradColors[0] }}>
      <LinearGradient colors={gradColors} style={StyleSheet.absoluteFill} />
      <BurnOverlay visible={burnOverlayVisible} onComplete={handleBurnComplete} />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={[styles.header, { paddingHorizontal: layout.padding.screen }]}>
            <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={styles.backBtn}>
              <ChevronLeft color={ACCENT} size={22} strokeWidth={2} />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Typography variant="microLabel" style={{ color: ACCENT, letterSpacing: 3.5, fontSize: 11 }}>
                {t('releaseLetters.eyebrow').toUpperCase()}
              </Typography>
            </View>
            <Pressable onPress={toggleFav} style={styles.backBtn}>
              <Star color={ACCENT} size={20} strokeWidth={2} fill={isFav ? ACCENT : 'none'} />
            </Pressable>
          </View>
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hero Widget */}
            <Animated.View entering={FadeInDown.delay(80).duration(500)}>
              <ScrollAndFlameWidget isDark={!isLight} />
              <Typography variant="body" style={{ color: subColor, textAlign: 'center', fontSize: 13, lineHeight: 20, marginTop: 4, marginBottom: 20 }}>
                Napisz list — puść go w ogień. Ceremonialne uwolnienie.
              </Typography>
            </Animated.View>

            {/* Target selection */}
            <Animated.View entering={FadeInDown.delay(160).duration(500)}>
              <Typography variant="microLabel" style={{ color: ACCENT, letterSpacing: 2.5, fontSize: 10, marginBottom: 12 }}>
                DO KOGO / CZEGO PISZESZ
              </Typography>
              <View style={styles.targetGrid}>
                {LETTER_TARGETS.map((t, i) => {
                  const Ic = t.icon;
                  const isSelected = selectedTarget === t.id;
return (
                    <Animated.View key={t.id} entering={FadeInDown.delay(200 + i * 50).duration(400)}>
                      <Pressable
                        onPress={() => handleTargetSelect(t)}
                        style={[styles.targetCard, {
                          backgroundColor: isSelected ? t.color + '22' : cardBg,
                          borderColor: isSelected ? t.color : cardBorder,
                        }]}
                      >
                        <View style={[styles.targetIcon, { backgroundColor: t.color + '22' }]}>
                          <Ic color={t.color} size={18} strokeWidth={1.8} />
                        </View>
                        <Typography variant="label" style={{ color: textColor, fontSize: 13, marginTop: 8, fontWeight: '600' }}>{t.label}</Typography>
                        <Typography variant="caption" style={{ color: subColor, fontSize: 11, marginTop: 2 }}>{t.sub}</Typography>
                        {isSelected && targetName ? (
                          <View style={[styles.nameBadge, { backgroundColor: t.color + '33' }]}>
                            <Typography variant="caption" style={{ color: t.color, fontSize: 10, fontWeight: '700' }}>{targetName}</Typography>
                          </View>
                        ) : null}
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.View>

            {/* Letter Input */}
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              <Typography variant="microLabel" style={{ color: ACCENT, letterSpacing: 2.5, fontSize: 10, marginBottom: 12, marginTop: 20 }}>
                TWÓJ LIST
              </Typography>
              <View style={[styles.letterContainer, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <LinearGradient
                  colors={isLight ? ['#FEF9EE', '#FDF4DA'] : ['rgba(28,20,8,0.7)', 'rgba(20,14,6,0.6)']}
                  style={StyleSheet.absoluteFill}
                />
                <TextInput
                  value={letterText}
                  onChangeText={setLetterText}
                  multiline
                  placeholder="Drogi/Droga... Chcę Ci powiedzieć..."
                  placeholderTextColor={subColor}
                  style={[styles.letterInput, { color: textColor }]}
                  textAlignVertical="top"
                />
                <View style={styles.charCounter}>
                  <Typography variant="caption" style={{ color: letterText.length >= 100 ? ACCENT : subColor, fontSize: 11 }}>
                    {letterText.length} znaków
                  </Typography>
                </View>
              </View>
            </Animated.View>

            {/* Action buttons */}
            <Animated.View entering={FadeInDown.delay(380).duration(500)}>
              <View style={styles.actionRow}>
                <Pressable
                  onPress={handleSave}
                  style={[styles.actionBtn, { borderColor: ACCENT + '44', backgroundColor: cardBg, flex: 1 }]}
                >
                  <BookOpen color={ACCENT} size={16} strokeWidth={2} />
                  <Typography variant="label" style={{ color: ACCENT, fontSize: 12, marginLeft: 6, fontWeight: '700' }}>ZACHOWAJ</Typography>
                </Pressable>
                <Pressable
                  onPress={handleBurn}
                  style={[styles.actionBtn, { flex: 1.4, marginLeft: 10 }]}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706', '#B45309']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                  />
                  <Flame color="#fff" size={16} strokeWidth={2} />
                  <Typography variant="label" style={{ color: '#fff', fontSize: 12, marginLeft: 6, fontWeight: '800', letterSpacing: 1 }}>CEREMONIALNIE SPAL</Typography>
                </Pressable>
              </View>
            </Animated.View>

            {/* Post-release affirmations */}
            {showPostRelease && postReleaseAffirmations.length > 0 && (
              <Animated.View entering={FadeInDown.duration(600)} style={{ marginTop: 24 }}>
                <Typography variant="microLabel" style={{ color: ACCENT, letterSpacing: 2.5, fontSize: 10, marginBottom: 12 }}>
                  AFIRMACJE PO UWOLNIENIU
                </Typography>
                {postReleaseAffirmations.map((aff, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(i * 100).duration(500)}>
                    <View style={[styles.affCard, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                      <Sparkles color={ACCENT} size={14} strokeWidth={1.8} style={{ marginRight: 10, flexShrink: 0 }} />
                      <Typography variant="body" style={{ color: textColor, fontSize: 14, lineHeight: 21, flex: 1 }}>{aff}</Typography>
                    </View>
                  </Animated.View>
                ))}
              </Animated.View>
            )}

            {/* History */}
            {releaseLetters.length > 0 && (
              <Animated.View entering={FadeInDown.delay(440).duration(500)} style={{ marginTop: 24 }}>
                <Typography variant="microLabel" style={{ color: ACCENT, letterSpacing: 2.5, fontSize: 10, marginBottom: 12 }}>
                  HISTORIA SPALONYCH LISTÓW
                </Typography>
                {releaseLetters.map((ltr, i) => (
                  <Animated.View key={ltr.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                    <View style={[styles.historyRow, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                      <Flame color={ACCENT} size={14} strokeWidth={2} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Typography variant="label" style={{ color: textColor, fontSize: 13 }}>{ltr.target}</Typography>
                        {ltr.name ? (
                          <Typography variant="caption" style={{ color: subColor, fontSize: 11 }}>{ltr.name}</Typography>
                        ) : null}
                      </View>
                      <Typography variant="caption" style={{ color: subColor, fontSize: 11 }}>{ltr.date}</Typography>
                    </View>
                  </Animated.View>
                ))}
              </Animated.View>
            )}

                        <View style={{ marginTop: 16, marginBottom: 8, borderRadius: 16, backgroundColor: "#F59E0B22", borderWidth: 1, borderColor: "#F59E0B", padding: 16 }}>
              <Text style={{ color: "#F59E0B", fontWeight: "700", fontSize: 13, letterSpacing: 1, marginBottom: 8 }}>AI INTERPRETACJA UWOLNIENIA</Text>
              {releaseAiInsight ? (
                <Text style={{ color: "#FEF3C7", fontSize: 14, lineHeight: 22 }}>{releaseAiInsight}</Text>
              ) : null}
              <Pressable onPress={fetchReleaseAi} disabled={releaseAiLoading} style={{ marginTop: 12, backgroundColor: "#F59E0B", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
                <Text style={{ color: "#1C1610", fontWeight: "700", fontSize: 14 }}>{releaseAiLoading ? "Interpretuję..." : "Interpretuj"}</Text>
              </Pressable>
            </View>
<EndOfContentSpacer />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Name Modal */}
      <Modal visible={showNameModal} transparent animationType="slide" onRequestClose={() => setShowNameModal(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowNameModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: isLight ? '#FEF9EE' : '#1C1610' }]}>
            <Typography variant="headingSmall" style={{ color: textColor, fontSize: 17, marginBottom: 16 }}>
              Do kogo / czego?
            </Typography>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="np. Mama, Złość, Praca w korporacji..."
              placeholderTextColor={subColor}
              returnKeyType="done"
              onSubmitEditing={confirmName}
              style={[styles.modalInput, { color: textColor, borderColor: cardBorder, backgroundColor: cardBg }]}
            />
            <Pressable onPress={confirmName} style={styles.modalCta}>
              <LinearGradient colors={[ACCENT, '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
              <Typography variant="label" style={{ color: '#fff', fontWeight: '800', letterSpacing: 1 }}>POTWIERDŹ</Typography>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', height: 52 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  targetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  targetCard: {
    width: (SW - layout.padding.screen * 2 - 10) / 2,
    borderRadius: 16, borderWidth: 1, padding: 14,
    alignItems: 'center',
  },
  targetIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  nameBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  letterContainer: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', minHeight: 180 },
  letterInput: { padding: 16, fontSize: 15, lineHeight: 24, minHeight: 180 },
  charCounter: { alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 10 },
  actionRow: { flexDirection: 'row', marginTop: 14 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 14, borderWidth: 1, overflow: 'hidden' },
  affCard: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, marginBottom: 16 },
  modalCta: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
