// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View, Dimensions, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Heart as SvgHeart } from 'react-native-svg';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, Star, Heart } from 'lucide-react-native';
import { getResolvedTheme, isLightBg } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#F472B6';

const AnimCircle = Animated.createAnimatedComponent(Circle);

const CompassionBg = ({ isDark }: { isDark: boolean }) => {
  const tiltX = useSharedValue(0); const tiltY = useSharedValue(0);
  const pan = Gesture.Pan()
    .onUpdate(e => { tiltX.value = e.translationX / SW * 10; tiltY.value = e.translationY / 300 * 10; })
    .onEnd(() => { tiltX.value = withTiming(0, { duration: 800 }); tiltY.value = withTiming(0, { duration: 800 }); });
  const animStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 600 }, { rotateX: `${-tiltY.value}deg` }, { rotateY: `${tiltX.value}deg` }] }));
  const heartbeat = useSharedValue(1);
  useEffect(() => { heartbeat.value = withRepeat(withSequence(withTiming(1.15, { duration: 300 }), withTiming(1, { duration: 300 }), withTiming(1.08, { duration: 200 }), withTiming(1, { duration: 600 })), -1); }, []);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartbeat.value }] }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={isDark ? ['#0E040C', '#14050F', '#1A0613'] : ['#FFF0F7', '#FFF5FA', '#FFFAFD']} style={StyleSheet.absoluteFill} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
          <Svg width={SW} height={440} style={{ position: 'absolute', top: 20 }}>
            <Defs>
              <RadialGradient id="heartGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={ACCENT} stopOpacity={isDark ? "0.22" : "0.10"} />
                <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={SW / 2} cy={190} r={130} fill="url(#heartGlow)" />
            {[40, 70, 100].map((r, i) => (
              <Circle key={i} cx={SW / 2} cy={190} r={r} stroke={ACCENT} strokeWidth={0.6} fill="none"
                opacity={isDark ? 0.18 - i * 0.04 : 0.08 - i * 0.02} />
            ))}
            {Array.from({ length: 18 }, (_, i) => (
              <Circle key={'p' + i} cx={(i * 139 + 30) % SW} cy={(i * 97 + 50) % 420}
                r={i % 4 === 0 ? 1.2 : 0.6} fill={ACCENT} opacity={isDark ? 0.12 : 0.05} />
            ))}
          </Svg>
          <Animated.View style={[{ position: 'absolute', left: SW / 2 - 28, top: 162 }, heartStyle]}>
            <Heart size={56} color={ACCENT} fill={ACCENT} opacity={isDark ? 0.35 : 0.2} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const PILLARS = [
  { icon: '🧠', title: 'Uważność', color: '#818CF8', desc: 'Obserwuj swój ból bez dramatyzowania ani ignorowania. Tylko: "To boli. To jest trudne."' },
  { icon: '🌍', title: 'Wspólne człowieczeństwo', color: '#34D399', desc: 'Twoje cierpienie jest częścią bycia człowiekiem. Nie jesteś sam/a. Inni też to przeżywają.' },
  { icon: '💗', title: 'Życzliwość dla siebie', color: ACCENT, desc: 'Traktuj siebie tak, jak traktowałbyś/łabyś najlepszego przyjaciela w tej samej sytuacji.' },
];

const AFFIRMATIONS = [
  'Zasługuję na miłość — szczególnie od siebie.',
  'Moje wady czynią mnie człowiekiem, nie porażką.',
  'Mogę się mylić i nadal być wartościową osobą.',
  'Traktuję siebie z troską, której potrzebuję.',
  'Jestem wystarczający/a dokładnie taki/taka jaki/jaka jestem.',
  'Ból jest częścią życia, a ja mogę przez niego przejść.',
];

const PRACTICES = [
  { title: 'List do siebie', icon: '✉️', desc: 'Napisz do siebie list jak do bliskiego przyjaciela, który cierpi tak jak ty teraz.' },
  { title: 'Gesty serdeczności', icon: '🤲', desc: 'Połóż dłoń na sercu. Poczuj ciepło. Powiedz: "Jestem tu dla siebie."' },
  { title: 'Przerwa na współczucie', icon: '⏸️', desc: '1 minuta: "To jest moment cierpienia. Cierpienie jest częścią życia. Niech będę dla siebie życzliwy/a."' },
];

const COMPASSION_BODY_PRACTICES = [
  { icon: '🫀', title: 'Dłoń na sercu',      desc: 'Połóż obie dłonie na mostku. Oddychaj powoli — poczuj ciepło pod rękami przez 60 sekund.' },
  { icon: '🌊', title: 'Oddech kojący',       desc: 'Wdech 4s → zatrzymanie 4s → wydech 6s. Powtórz 5 razy. Aktywuje nerw błędny.' },
  { icon: '🪞', title: 'Spojrzenie w lustro', desc: 'Patrz sobie w oczy przez 30 sekund. Powiedz cicho: „Zasługuję na moją troskę."' },
  { icon: '🌿', title: 'Skan ciała',          desc: 'Zamknij oczy. Przesuń uwagę od stóp do głowy — zauważ napięcie bez oceniania.' },
  { icon: '🫂', title: 'Uścisk siebie',       desc: 'Skrzyżuj ręce na piersi. Delikatnie uciśnij ramiona — jak byś przytulał/a kogoś bliskiego.' },
  { icon: '✋', title: 'Gest uwalniania',     desc: 'Otwórz zaciśnięte dłonie ku górze. Wyobraź sobie, że uwalniasz ból w przestrzeń.' },
];

const COMPASSION_JOURNAL_PROMPTS = [
  'Co teraz przeżywam i jak to odczuwam w ciele?',
  'Czy powiedziałbym/powiedziałabym to samo bliskiej osobie? Dlaczego nie sobie?',
  'Jaka część mnie potrzebuje dziś najwięcej troski?',
  'Co mnie trzyma z dala od samowspółczucia — lęk, wstyd, przekonanie?',
  'Jeden mały gest życzliwości wobec siebie, który zrobię dziś.',
];

export const SelfCompassionScreen = ({ navigation }: any) => {
    const themeName = useAppStore(s => s.themeName);
  const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const currentTheme = getResolvedTheme(themeName, userData?.preferences?.colorScheme);
  const isLight = isLightBg(currentTheme.background);
  const isDark = !isLight;
  const textColor = isLight ? '#2D0020' : '#FFF0F7';
  const subColor = isLight ? 'rgba(45,0,32,0.5)' : 'rgba(255,240,247,0.5)';
  const { t } = useTranslation();
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';

  const [activeTab, setActiveTab] = useState<'pillars' | 'affirmations' | 'practices'>('pillars');
  const [letterText, setLetterText] = useState('');
  const [aiLetter, setAiLetter] = useState('');
  const [loading, setLoading] = useState(false);

  const generateLetter = async () => {
    if (!letterText.trim()) return;
    setLoading(true); HapticsService.impactMedium();
    try {
      const result = await AiService.chatWithOracle([{
        role: 'user',
        content: `Napisz krótki, ciepły list z pozycji współczującego przyjaciela do osoby, która przeżywa: "${letterText}". List ma być pełen empatii, bez oceniania, z delikatnym przypomnieniem o wartości tej osoby. Max 4 zdania.`
      }]);
      setAiLetter(result);
    } catch { setAiLetter('Drogi/a przyjacielu/ółko — to co czujesz jest realne i ważne. Zasługujesz na wsparcie i łagodność — przede wszystkim od siebie. Jesteś wystarczający/a.'); }
    setLoading(false);
  };

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <CompassionBg isDark={isDark} />
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2 }}>{t('selfCompassion.eyebrow').toUpperCase()}</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>{t('selfCompassion.title')}</Text>
        </View>
        <Pressable style={styles.starBtn} hitSlop={12} onPress={() => { HapticsService.impact('light'); if (isFavoriteItem('self-compassion')) { removeFavoriteItem('self-compassion'); } else { addFavoriteItem({ id: 'self-compassion', label: 'Współczucie dla siebie', route: 'SelfCompassion', params: {}, icon: 'Heart', color: ACCENT, addedAt: new Date().toISOString() }); } }}>
          <Star size={18} color={isFavoriteItem('self-compassion') ? ACCENT : subColor} strokeWidth={1.8} fill={isFavoriteItem('self-compassion') ? ACCENT : 'none'} />
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {([['pillars', 'Filary'], ['affirmations', 'Afirmacje'], ['practices', 'Ćwiczenia']] as const).map(([tab, label]) => {
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
        {activeTab === 'pillars' && (
          <>
            <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
              Współczucie dla siebie to nie słabość — to najsilniejsza forma odporności. Opiera się na 3 filarach Kristin Neff.
            </Text>
            {PILLARS.map((p, i) => (
              <Animated.View key={p.title} entering={FadeInDown.delay(80 + i * 80).duration(500)}>
                <View style={[styles.pillarCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <LinearGradient colors={[p.color + '18', p.color + '06']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <Text style={{ fontSize: 28 }}>{p.icon}</Text>
                    <Text style={{ color: textColor, fontSize: 17, fontWeight: '700' }}>{p.title}</Text>
                  </View>
                  <Text style={{ color: subColor, fontSize: 13, lineHeight: 20 }}>{p.desc}</Text>
                </View>
              </Animated.View>
            ))}
          </>
        )}

        {activeTab === 'affirmations' && (
          <>
            {AFFIRMATIONS.map((aff, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(80 + i * 50).duration(400)}>
                <View style={[styles.affCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Heart size={12} color={ACCENT} fill={ACCENT} />
                  <Text style={{ color: textColor, fontSize: 14, lineHeight: 22, flex: 1, fontStyle: 'italic' }}>"{aff}"</Text>
                </View>
              </Animated.View>
            ))}
          </>
        )}

        {activeTab === 'practices' && (
          <>
            <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginBottom: 8 }}>PRAKTYKI UWAŻNOŚCI</Text>
            {PRACTICES.map((pr, i) => (
              <Animated.View key={pr.title} entering={FadeInDown.delay(80 + i * 60).duration(400)}>
                <View style={[styles.practiceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={{ fontSize: 26 }}>{pr.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textColor, fontSize: 15, fontWeight: '700' }}>{pr.title}</Text>
                    <Text style={{ color: subColor, fontSize: 12, lineHeight: 18, marginTop: 4 }}>{pr.desc}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}

            <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginTop: 20, marginBottom: 8 }}>PRAKTYKI CIAŁA</Text>
            {COMPASSION_BODY_PRACTICES.map((bp, i) => (
              <Animated.View key={bp.title} entering={FadeInDown.delay(200 + i * 55).duration(400)}>
                <View style={[styles.practiceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={{ fontSize: 24 }}>{bp.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textColor, fontSize: 14, fontWeight: '700' }}>{bp.title}</Text>
                    <Text style={{ color: subColor, fontSize: 12, lineHeight: 18, marginTop: 3 }}>{bp.desc}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}

            <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginTop: 20, marginBottom: 8 }}>PYTANIA DO REFLEKSJI</Text>
            {COMPASSION_JOURNAL_PROMPTS.map((prompt, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(400 + i * 50).duration(400)}>
                <View style={[styles.affCard, { backgroundColor: cardBg, borderColor: cardBorder, marginBottom: 8 }]}>
                  <Text style={{ color: ACCENT, fontSize: 16, marginTop: 1 }}>✦</Text>
                  <Text style={{ flex: 1, color: subColor, fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>{prompt}</Text>
                </View>
              </Animated.View>
            ))}

            <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginTop: 20, marginBottom: 8 }}>LIST DO SIEBIE (AI)</Text>
            <View style={[styles.inputBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <TextInput
                value={letterText}
                onChangeText={setLetterText}
                placeholder="Co teraz przeżywasz? Co cię boli lub martwi?"
                placeholderTextColor={subColor}
                multiline
                style={{ color: textColor, fontSize: 14, lineHeight: 22, minHeight: 80 }}
              />
            </View>
            <Pressable onPress={generateLetter} disabled={loading || !letterText.trim()}
              style={[styles.genBtn, { backgroundColor: loading ? ACCENT + '66' : ACCENT }]}>
              <Heart size={15} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{loading ? 'Piszę...' : 'Napisz list'}</Text>
            </Pressable>
            {aiLetter ? (
              <Animated.View entering={FadeInDown.duration(500)}>
                <View style={[styles.letterCard, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '28' }]}>
                  <Text style={{ color: textColor, fontSize: 14, lineHeight: 22, fontStyle: 'italic' }}>{aiLetter}</Text>
                </View>
              </Animated.View>
            ) : null}
          </>
        )}
        <EndOfContentSpacer />
      </ScrollView>
        </SafeAreaView>
</View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingBottom: 12, gap: 12, paddingTop: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  starBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(244,114,182,0.3)', backgroundColor: 'rgba(244,114,182,0.08)' },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: layout.padding.screen, marginBottom: 12 },
  tabChip: { flex: 1, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(244,114,182,0.25)', backgroundColor: 'rgba(244,114,182,0.06)', alignItems: 'center' },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  pillarCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, overflow: 'hidden' },
  affCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  practiceCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  inputBox: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  genBtn: { flexDirection: 'row', gap: 8, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  letterCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 8 },
});