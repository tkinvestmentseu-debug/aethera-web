// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, Dimensions, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Line } from 'react-native-svg';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, Star, Music, Play, Pause, RotateCcw } from 'lucide-react-native';
import { getResolvedTheme, isLightBg } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AudioService, type BinauralFrequency } from '../core/services/audio.service';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#8B5CF6';

const AnimCircle = Animated.createAnimatedComponent(Circle);

const FreqBg = ({ isDark, activeColor }: { isDark: boolean; activeColor: string }) => {
  const tiltX = useSharedValue(0); const tiltY = useSharedValue(0);
  const pan = Gesture.Pan()
    .onUpdate(e => { tiltX.value = e.translationX / SW * 10; tiltY.value = e.translationY / 300 * 10; })
    .onEnd(() => { tiltX.value = withTiming(0, { duration: 800 }); tiltY.value = withTiming(0, { duration: 800 }); });
  const animStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 600 }, { rotateX: `${-tiltY.value}deg` }, { rotateY: `${tiltX.value}deg` }] }));
  const wave = useSharedValue(0);
  useEffect(() => { wave.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.linear }), -1, false); }, []);
  const pulse = useSharedValue(60);
  useEffect(() => { pulse.value = withRepeat(withSequence(withTiming(100, { duration: 1200, easing: Easing.out(Easing.sin) }), withTiming(60, { duration: 1200 })), -1); }, []);
  const pulseProps = useAnimatedProps(() => ({ r: pulse.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={isDark ? ['#070412', '#0C0620', '#100830'] : ['#F5F0FF', '#F8F2FF', '#FBF5FF']} style={StyleSheet.absoluteFill} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
          <Svg width={SW} height={460} style={{ position: 'absolute', top: 20 }}>
            <Defs>
              <RadialGradient id="freqGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={activeColor} stopOpacity={isDark ? "0.25" : "0.12"} />
                <Stop offset="100%" stopColor={activeColor} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <AnimCircle cx={SW / 2} cy={190} animatedProps={pulseProps} fill="url(#freqGlow)" />
            {[25, 50, 80, 115].map((r, i) => (
              <Circle key={i} cx={SW / 2} cy={190} r={r} stroke={activeColor} strokeWidth={0.8} fill="none"
                opacity={isDark ? 0.22 - i * 0.04 : 0.10 - i * 0.02}
                strokeDasharray={i % 2 === 0 ? undefined : `${r * 0.4} ${r * 0.2}`} />
            ))}
            {/* Sound wave lines */}
            {Array.from({ length: 7 }, (_, i) => {
              const y = 190 + (i - 3) * 18;
              const amp = Math.max(0, 35 - Math.abs(i - 3) * 10);
              return <Line key={'w' + i} x1={SW / 2 - amp} y1={y} x2={SW / 2 + amp} y2={y} stroke={activeColor} strokeWidth={1.5} opacity={isDark ? 0.25 : 0.12} />;
            })}
            {Array.from({ length: 18 }, (_, i) => (
              <Circle key={'p' + i} cx={(i * 137 + 30) % SW} cy={(i * 91 + 50) % 440}
                r={i % 5 === 0 ? 1.3 : 0.6} fill={activeColor} opacity={isDark ? 0.12 : 0.05} />
            ))}
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const FREQUENCIES = [
  { hz: 174, name: 'Ulga od bólu', color: '#EF4444', chakra: 'Fundament', desc: 'Najniższa częstotliwość Solfeggio. Usuwa ból fizyczny i emocjonalny. Poczucie bezpieczeństwa.' },
  { hz: 285, name: 'Regeneracja tkanek', color: '#F97316', chakra: 'Sakralna', desc: 'Naprawia uszkodzone tkanki i pola energetyczne. Restrukturyzuje komórki.' },
  { hz: 396, name: 'Uwalnianie lęku', color: '#FBBF24', chakra: 'Splot słoneczny', desc: 'Oczyszcza poczucie winy i strach. Transformuje żal w radość.' },
  { hz: 417, name: 'Oczyszczanie', color: '#34D399', chakra: 'Sercowa', desc: 'Ułatwia zmiany i odejście od trudnych doświadczeń. Czyści traumatyczne ślady.' },
  { hz: 528, name: 'Miłość i uzdrowienie', color: '#60A5FA', chakra: 'Gardłowa', desc: '"Częstotliwość miłości". Naprawia DNA, przywraca harmonię i spokój.' },
  { hz: 639, name: 'Relacje', color: '#818CF8', chakra: 'Trzeciego oka', desc: 'Harmonizuje relacje, buduje tolerancję i empatię. Przyciąga miłość.' },
  { hz: 741, name: 'Ekspresja', color: '#A78BFA', chakra: 'Koronna', desc: 'Oczyszcza toksyny i pola elektromagnetyczne. Budzi intuicję.' },
  { hz: 852, name: 'Intuicja', color: '#C084FC', chakra: 'Ponad-koronna', desc: 'Powrót do porządku duchowego. Przebudzenie wewnętrznej siły.' },
  { hz: 963, name: 'Połączenie', color: '#E879F9', chakra: 'Kosmiczna', desc: 'Aktywuje szyszynkę i system pinealny. Połączenie z wyższą świadomością.' },
];

// Hz -> BinauralFrequency key mapping
const HZ_TO_BINAURAL: Record<number, BinauralFrequency> = {
  174: '174hz', 396: '396hz', 528: '528hz',
  639: '639hz', 741: '741hz', 852: '852hz', 963: '963hz',
};

export const HealingFrequenciesScreen = ({ navigation }: any) => {
    const themeName = useAppStore(s => s.themeName);
  const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const currentTheme = getResolvedTheme(themeName, userData?.preferences?.colorScheme);
  const isDark = !isLightBg(currentTheme.background);
  const isLight = !isDark;
  const textColor = isLight ? '#1A0840' : '#F5F0FF';
  const subColor = isLight ? 'rgba(26,8,64,0.5)' : 'rgba(245,240,255,0.5)';
  const { t } = useTranslation();
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';

  const [selected, setSelected] = useState(FREQUENCIES[4]); // 528 Hz default
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<any>(null);

  const toggleTimer = () => {
    if (timerRunning) {
      clearInterval(intervalRef.current);
      setTimerRunning(false);
      void AudioService.stopBinauralTone();
    } else {
      const binKey = HZ_TO_BINAURAL[selected.hz];
      if (binKey) { void AudioService.playBinauralTone(binKey); }
      setTimerRunning(true);
      intervalRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    }
  };
  useEffect(() => () => { clearInterval(intervalRef.current); void AudioService.stopBinauralTone(); }, []);

  // Stop binaural when leaving screen
  useFocusEffect(useCallback(() => {
    return () => { void AudioService.stopBinauralTone(); };
  }, []));

  // Stop binaural on frequency change while running
  useEffect(() => {
    if (timerRunning) {
      const binKey = HZ_TO_BINAURAL[selected.hz];
      if (binKey) { void AudioService.playBinauralTone(binKey); }
    }
  }, [selected]);
  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <FreqBg isDark={isDark} activeColor={selected.color} />
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2 }}>{t('healingFrequencies.eyebrow').toUpperCase()}</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>{t('healingFrequencies.title')}</Text>
        </View>
        <Pressable style={styles.starBtn} hitSlop={12} onPress={() => { HapticsService.impact('light'); if (isFavoriteItem('healing-frequencies')) { removeFavoriteItem('healing-frequencies'); } else { addFavoriteItem({ id: 'healing-frequencies', label: 'Częstotliwości uzdrawiające', route: 'HealingFrequencies', params: {}, icon: 'Music', color: ACCENT, addedAt: new Date().toISOString() }); } }}>
          <Star size={18} color={isFavoriteItem('healing-frequencies') ? ACCENT : subColor} strokeWidth={1.8} fill={isFavoriteItem('healing-frequencies') ? ACCENT : 'none'} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen }}>
        {/* Active frequency display */}
        <Animated.View entering={FadeInDown.delay(60).duration(500)}>
          <View style={[styles.activeCard, { backgroundColor: selected.color + '16', borderColor: selected.color + '33' }]}>
            <Text style={{ color: selected.color, fontSize: 52, fontWeight: '100', letterSpacing: 2 }}>{selected.hz}</Text>
            <Text style={{ color: selected.color, fontSize: 13, letterSpacing: 3, marginTop: -4 }}>Hz</Text>
            <Text style={{ color: textColor, fontSize: 18, fontWeight: '700', marginTop: 8 }}>{selected.name}</Text>
            <Text style={{ color: subColor, fontSize: 12, letterSpacing: 2, marginBottom: 8 }}>CZAKRA {selected.chakra.toUpperCase()}</Text>
            <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 16 }}>{selected.desc}</Text>
            <View style={styles.timerRow}>
              <Text style={{ color: textColor, fontSize: 28, fontWeight: '200', letterSpacing: 2 }}>{fmt(elapsed)}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={toggleTimer} style={[styles.playBtn, { backgroundColor: selected.color }]}>
                  {timerRunning ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" />}
                </Pressable>
                <Pressable onPress={() => { clearInterval(intervalRef.current); setTimerRunning(false); setElapsed(0); }}
                  style={[styles.resetBtn, { borderColor: selected.color + '44' }]}>
                  <RotateCcw size={16} color={selected.color} />
                </Pressable>
              </View>
            </View>
            <Text style={{ color: subColor, fontSize: 11 }}>Słuchaj z słuchawkami dla najlepszych efektów</Text>
          </View>
        </Animated.View>

        <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginTop: 16, marginBottom: 10 }}>SKALA SOLFEGGIO</Text>
        {FREQUENCIES.map((freq, i) => (
          <Animated.View key={freq.hz} entering={FadeInDown.delay(80 + i * 40).duration(400)}>
            <Pressable onPress={() => { HapticsService.impactLight(); setSelected(freq); }}
              style={[styles.freqRow, { backgroundColor: selected.hz === freq.hz ? freq.color + '18' : cardBg, borderColor: selected.hz === freq.hz ? freq.color + '44' : cardBorder }]}>
              <View style={[styles.freqBadge, { backgroundColor: freq.color + '22', borderColor: freq.color + '33' }]}>
                <Text style={{ color: freq.color, fontSize: 13, fontWeight: '800' }}>{freq.hz}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>{freq.name}</Text>
                <Text style={{ color: subColor, fontSize: 11 }}>{freq.chakra}</Text>
              </View>
              {selected.hz === freq.hz && <Music size={16} color={freq.color} />}
            </Pressable>
          </Animated.View>
        ))}

        <EndOfContentSpacer />
      </ScrollView>
        </SafeAreaView>
</View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingBottom: 12, gap: 12, paddingTop: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  starBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', backgroundColor: 'rgba(139,92,246,0.08)' },
  activeCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 8 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  playBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  resetBtn: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  freqRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 7 },
  freqBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, minWidth: 52, alignItems: 'center' },
});
