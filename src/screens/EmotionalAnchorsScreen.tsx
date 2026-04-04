// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View, Dimensions, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Line, Polygon } from 'react-native-svg';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, Star, Anchor, Plus, X, CheckCircle2 } from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#0EA5E9';

const AnimCircle = Animated.createAnimatedComponent(Circle);

const AnchorBg = ({ isDark }: { isDark: boolean }) => {
  const tiltX = useSharedValue(0); const tiltY = useSharedValue(0);
  const pan = Gesture.Pan()
    .onUpdate(e => { tiltX.value = e.translationX / SW * 10; tiltY.value = e.translationY / 300 * 10; })
    .onEnd(() => { tiltX.value = withTiming(0, { duration: 800 }); tiltY.value = withTiming(0, { duration: 800 }); });
  const animStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 600 }, { rotateX: `${-tiltY.value}deg` }, { rotateY: `${tiltX.value}deg` }] }));
  const glow = useSharedValue(0.5);
  useEffect(() => { glow.value = withRepeat(withSequence(withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }), withTiming(0.5, { duration: 3000 })), -1); }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={isDark ? ['#040A12', '#060E1A', '#081220'] : ['#E0F2FE', '#EBF8FF', '#F0FBFF']} style={StyleSheet.absoluteFill} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
          <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
            <Svg width={SW} height={440} style={{ position: 'absolute', top: 20 }}>
              <Defs>
                <RadialGradient id="anchorGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={ACCENT} stopOpacity={isDark ? "0.22" : "0.10"} />
                  <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx={SW / 2} cy={190} r={130} fill="url(#anchorGlow)" />
              {[40, 70, 105].map((r, i) => (
                <Circle key={i} cx={SW / 2} cy={190} r={r} stroke={ACCENT} strokeWidth={0.6} fill="none"
                  opacity={isDark ? 0.18 - i * 0.04 : 0.08 - i * 0.02} />
              ))}
              {/* Anchor icon simplified */}
              <Circle cx={SW / 2} cy={168} r={10} stroke={ACCENT} strokeWidth={1.8} fill="none" opacity={isDark ? 0.35 : 0.2} />
              <Line x1={SW / 2} y1={178} x2={SW / 2} y2={220} stroke={ACCENT} strokeWidth={1.8} opacity={isDark ? 0.35 : 0.2} />
              <Line x1={SW / 2 - 20} y1={200} x2={SW / 2 + 20} y2={200} stroke={ACCENT} strokeWidth={1.5} opacity={isDark ? 0.3 : 0.15} />
              <Path d={`M${SW / 2 - 20},200 Q${SW / 2 - 28},216 ${SW / 2 - 16},220`} stroke={ACCENT} strokeWidth={1.5} fill="none" opacity={isDark ? 0.3 : 0.15} />
              <Path d={`M${SW / 2 + 20},200 Q${SW / 2 + 28},216 ${SW / 2 + 16},220`} stroke={ACCENT} strokeWidth={1.5} fill="none" opacity={isDark ? 0.3 : 0.15} />
              {Array.from({ length: 16 }, (_, i) => (
                <Circle key={'p' + i} cx={(i * 141 + 30) % SW} cy={(i * 93 + 40) % 420}
                  r={i % 4 === 0 ? 1.2 : 0.6} fill={ACCENT} opacity={isDark ? 0.12 : 0.05} />
              ))}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const PRESET_ANCHORS = [
  { id: 'a1', category: 'Bezpieczeństwo', icon: '🏠', text: 'Mój dom jest moim schronieniem. Jestem w nim bezpieczny/a.' },
  { id: 'a2', category: 'Miłość', icon: '💛', text: 'Kocham i jestem kochany/a. Miłość jest zawsze dostępna.' },
  { id: 'a3', category: 'Siła', icon: '⚡', text: 'Przetrwałem/am już gorsze rzeczy. Mam w sobie siłę.' },
  { id: 'a4', category: 'Natura', icon: '🌿', text: 'Ziemia pode mną jest zawsze. Jestem zakorzeniony/a.' },
  { id: 'a5', category: 'Oddech', icon: '💨', text: 'Póki oddycham, żyję. Jeden oddech naraz.' },
  { id: 'a6', category: 'Przeszłość', icon: '⭐', text: 'Miałem/am momenty radości i siły. Mogę je znów mieć.' },
];

const NLP_STEPS = [
  'Przypomnij sobie silny pozytywny stan (spokój, radość, pewność siebie)',
  'Wejdź w ten stan — poczuj go w ciele jak najbardziej intensywnie',
  'Gdy stan jest najsilniejszy — naciśnij mocno kciukiem na knykieć palca wskazującego',
  'Przytrzymaj 10-15 sekund i puść gdy stan opada',
  'Powtórz 3-5 razy wzmacniając kotwicę',
  'Test: naciśnij kotwicę — poczuj jak stan wraca natychmiast',
];

export const EmotionalAnchorsScreen = ({ navigation }: any) => {
  const { themeName, userData, addFavoriteItem, isFavoriteItem, removeFavoriteItem, emotionalAnchors, addEmotionalAnchor, removeEmotionalAnchor } = useAppStore();
  const currentTheme = getResolvedTheme(themeName, userData?.preferences?.colorScheme);
  const isDark = !currentTheme.background.startsWith('#F');
  const isLight = !isDark;
  const textColor = isLight ? '#021422' : '#E0F9FF';
  const subColor = isLight ? 'rgba(2,20,34,0.5)' : 'rgba(224,249,255,0.5)';
  const { t } = useTranslation();
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';

  const [activeTab, setActiveTab] = useState<'anchors' | 'nlp' | 'create'>('anchors');
  const [activeAnchors, setActiveAnchors] = useState<string[]>([]);
  const [doneNLP, setDoneNLP] = useState<number[]>([]);
  const [newAnchor, setNewAnchor] = useState('');

  const addAnchor = () => {
    if (!newAnchor.trim()) return;
    addEmotionalAnchor(newAnchor.trim());
    setNewAnchor('');
    HapticsService.impactMedium();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }} edges={['top']}>
      <AnchorBg isDark={isDark} />
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2 }}>{t('emotionalAnchors.eyebrow').toUpperCase()}</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>{t('emotionalAnchors.title')}</Text>
        </View>
        <Pressable style={styles.starBtn} hitSlop={12} onPress={() => { HapticsService.impact('light'); if (isFavoriteItem('emotional-anchors')) { removeFavoriteItem('emotional-anchors'); } else { addFavoriteItem({ id: 'emotional-anchors', label: 'Kotwice emocjonalne', route: 'EmotionalAnchors', params: {}, icon: 'Anchor', color: ACCENT, addedAt: new Date().toISOString() }); } }}>
          <Star size={18} color={isFavoriteItem('emotional-anchors') ? ACCENT : subColor} strokeWidth={1.8} fill={isFavoriteItem('emotional-anchors') ? ACCENT : 'none'} />
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {([['anchors', 'Kotwice'], ['nlp', 'Technika NLP'], ['create', 'Moje']] as const).map(([tab, label]) => {
          const active = activeTab === tab;
          return (
            <Pressable key={tab} onPress={() => { HapticsService.impactLight(); setActiveTab(tab); }}
              style={[styles.tabChip, active && { backgroundColor: ACCENT, borderColor: ACCENT }]}>
              <Text style={[styles.tabLabel, { color: active ? '#fff' : subColor }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen }}>
        {activeTab === 'anchors' && (
          <>
            <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
              Kotwice emocjonalne to zdania, obrazy lub gesty, które natychmiast przywracają spokój. Dotknij aby aktywować.
            </Text>
            {PRESET_ANCHORS.map((anchor, i) => {
              const active = activeAnchors.includes(anchor.id);
              return (
                <Animated.View key={anchor.id} entering={FadeInDown.delay(80 + i * 50).duration(400)}>
                  <Pressable onPress={() => { HapticsService.impactMedium(); setActiveAnchors(p => p.includes(anchor.id) ? p.filter(x => x !== anchor.id) : [...p, anchor.id]); }}
                    style={[styles.anchorCard, { backgroundColor: active ? ACCENT + '18' : cardBg, borderColor: active ? ACCENT + '44' : cardBorder }]}>
                    <View style={[styles.anchorIcon, { backgroundColor: active ? ACCENT + '22' : cardBorder + '33' }]}>
                      <Text style={{ fontSize: 20 }}>{anchor.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: subColor, fontSize: 10, letterSpacing: 1.5 }}>{anchor.category.toUpperCase()}</Text>
                      <Text style={{ color: textColor, fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>"{anchor.text}"</Text>
                    </View>
                    {active && <Anchor size={16} color={ACCENT} />}
                  </Pressable>
                </Animated.View>
              );
            })}
          </>
        )}

        {activeTab === 'nlp' && (
          <>
            <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
              Technika kotwiczenia NLP (neurolingwistyczna) — zaprogramuj ciało tak, by gesty natychmiast wywoływały pożądany stan.
            </Text>
            {NLP_STEPS.map((step, i) => {
              const done = doneNLP.includes(i);
              return (
                <Pressable key={i} onPress={() => { HapticsService.impactLight(); setDoneNLP(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]); }}
                  style={[styles.nlpStep, { backgroundColor: done ? ACCENT + '14' : cardBg, borderColor: done ? ACCENT + '33' : cardBorder }]}>
                  <View style={[styles.nlpNum, { backgroundColor: done ? ACCENT : ACCENT + '30' }]}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
                  </View>
                  <Text style={{ color: textColor, fontSize: 13, flex: 1, lineHeight: 20 }}>{step}</Text>
                  <CheckCircle2 size={16} color={done ? ACCENT : cardBorder} />
                </Pressable>
              );
            })}
          </>
        )}

        {activeTab === 'create' && (
          <>
            <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
              Stwórz własne kotwice — zdania, mantry lub obrazy które są dla ciebie znaczące.
            </Text>
            <View style={[styles.inputRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <TextInput value={newAnchor} onChangeText={setNewAnchor} placeholder="Moja osobista kotwica..." placeholderTextColor={subColor}
                style={{ color: textColor, fontSize: 14, flex: 1 }} />
              <Pressable onPress={addAnchor} style={[styles.addBtn, { backgroundColor: ACCENT }]}>
                <Plus size={18} color="#fff" />
              </Pressable>
            </View>
            {emotionalAnchors.map((anchor, i) => (
              <Animated.View key={i} entering={FadeInDown.duration(400)}>
                <View style={[styles.myAnchor, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Anchor size={14} color={ACCENT} />
                  <Text style={{ color: textColor, fontSize: 13, flex: 1, fontStyle: 'italic' }}>"{anchor}"</Text>
                  <Pressable onPress={() => removeEmotionalAnchor(anchor)}>
                    <X size={14} color={subColor} />
                  </Pressable>
                </View>
              </Animated.View>
            ))}
            {emotionalAnchors.length === 0 && (
              <Text style={{ color: subColor, fontSize: 13, textAlign: 'center', marginTop: 20 }}>Dodaj pierwszą kotwicę powyżej</Text>
            )}
          </>
        )}

        <EndOfContentSpacer />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingBottom: 12, gap: 12, paddingTop: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  starBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(14,165,233,0.3)', backgroundColor: 'rgba(14,165,233,0.08)' },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: layout.padding.screen, marginBottom: 12 },
  tabChip: { flex: 1, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(14,165,233,0.25)', backgroundColor: 'rgba(14,165,233,0.06)', alignItems: 'center' },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  anchorCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  anchorIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nlpStep: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 7 },
  nlpNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  addBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  myAnchor: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 7 },
});
