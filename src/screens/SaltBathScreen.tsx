// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, Dimensions, Text, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import { AudioService } from '../core/services/audio.service';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, Star, Droplets, Clock, CheckCircle2, Play, Pause, RotateCcw } from 'lucide-react-native';
import { getResolvedTheme, isLightBg } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#06B6D4';
const TEAL = '#0E7490';

const AnimCircle = Animated.createAnimatedComponent(Circle);
const AnimEllipse = Animated.createAnimatedComponent(Ellipse);

const WaterBg = ({ isDark }: { isDark: boolean }) => {
  const tiltX = useSharedValue(0); const tiltY = useSharedValue(0);
  const pan = Gesture.Pan()
    .onUpdate(e => { tiltX.value = e.translationX / SW * 10; tiltY.value = e.translationY / 300 * 10; })
    .onEnd(() => { tiltX.value = withTiming(0, { duration: 800 }); tiltY.value = withTiming(0, { duration: 800 }); });
  const animStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 600 }, { rotateX: `${-tiltY.value}deg` }, { rotateY: `${tiltX.value}deg` }] }));
  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);
  useEffect(() => {
    wave1.value = withRepeat(withSequence(withTiming(12, { duration: 2000, easing: Easing.inOut(Easing.sin) }), withTiming(-12, { duration: 2000 })), -1);
    wave2.value = withRepeat(withSequence(withTiming(-10, { duration: 2500, easing: Easing.inOut(Easing.sin) }), withTiming(10, { duration: 2500 })), -1);
  }, []);
  const rx1 = useAnimatedProps(() => ({ rx: 140 + wave1.value }));
  const rx2 = useAnimatedProps(() => ({ rx: 120 + wave2.value }));

return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={isDark ? ['#020C10', '#040E18', '#061220'] : ['#E0F7FA', '#E8F5FF', '#EFF5FF']} style={StyleSheet.absoluteFill} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
          <Svg width={SW} height={480} style={{ position: 'absolute', top: 20 }}>
            <Defs>
              <RadialGradient id="waterGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={ACCENT} stopOpacity={isDark ? "0.25" : "0.12"} />
                <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Ellipse cx={SW / 2} cy={300} rx={180} ry={80} fill="url(#waterGlow)" />
            <AnimEllipse cx={SW / 2} cy={290} animatedProps={rx1} ry={50} fill={ACCENT} opacity={isDark ? 0.08 : 0.05} />
            <AnimEllipse cx={SW / 2} cy={310} animatedProps={rx2} ry={40} fill={ACCENT} opacity={isDark ? 0.06 : 0.03} />
            {[30, 60, 100, 140, 185].map((ry, i) => (
              <Ellipse key={i} cx={SW / 2} cy={300} rx={ry * 1.6} ry={ry} stroke={ACCENT} strokeWidth={0.6} fill="none"
                opacity={isDark ? 0.18 - i * 0.03 : 0.08 - i * 0.015} strokeDasharray={`${ry * 0.4} ${ry * 0.2}`} />
            ))}
            {/* Droplets */}
            {[[SW / 2, 160], [SW / 2 - 60, 200], [SW / 2 + 60, 190], [SW / 2 - 30, 230], [SW / 2 + 30, 215]].map(([cx, cy], i) => (
              <G key={'d' + i}>
                <Circle cx={cx} cy={cy} r={5 + i * 1.5} fill={ACCENT} opacity={isDark ? 0.12 - i * 0.02 : 0.06 - i * 0.01} />
                <Path d={`M${cx},${cy - 10} C${cx - 4},${cy - 5} ${cx - 6},${cy + 2} ${cx},${cy + 8} C${cx + 6},${cy + 2} ${cx + 4},${cy - 5} ${cx},${cy - 10}`}
                  fill={ACCENT} opacity={isDark ? 0.22 : 0.1} />
              </G>
            ))}
            {Array.from({ length: 18 }, (_, i) => (
              <Circle key={'p' + i} cx={(i * 139 + 40) % SW} cy={(i * 97 + 50) % 460}
                r={i % 4 === 0 ? 1.5 : 0.7} fill={ACCENT} opacity={isDark ? 0.15 : 0.06} />
            ))}
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const PROTOCOLS = [
  {
    id: 'cleanse', title: 'Oczyszczanie', duration: 20, color: '#06B6D4',
    ingredients: ['2 garście soli himalajskiej', 'Kilka kropel olejku lawendowego', 'Garść płatków róży (opcjonalnie)'],
    intention: 'Oczyszczam się ze wszystkiego, co mnie ogranicza. Sól zabiera ze mną stare wzorce.',
    steps: ['Napuść ciepłą wodę (38-40°C)', 'Dodaj sól i mieszaj zgodnie z ruchem słońca', 'Wejdź i zanurz się', 'Wizualizuj jak woda pochłania negatywną energię', 'Wypuść wodę i wyobraź sobie jak wszystko odpływa'],
  },
  {
    id: 'healing', title: 'Uzdrowienie', duration: 30, color: '#34D399',
    ingredients: ['Sól Epsom (magnez)', 'Kilka kropel olejku eukaliptusowego', 'Liść laurowy z intencją'],
    intention: 'Każda komórka mojego ciała regeneruje się i wraca do zdrowia.',
    steps: ['Dodaj 2-3 garście soli Epsom', 'Dorzuć olejek i wdychaj parę głęboko', 'Połóż się i oddychaj przez brzuch', 'Skup się na rejonie wymagającym uzdrowienia', 'Wyjdź powoli, natrzyj ciało ręcznikiem'],
  },
  {
    id: 'empower', title: 'Wzmocnienie', duration: 15, color: '#F59E0B',
    ingredients: ['Sól morska gruba', 'Olejek różany lub jaśminowy', 'Kilka płatków złotej nagietki'],
    intention: 'Jestem silny/a, piękny/a i w pełni sobą. Moja energia rozkwita.',
    steps: ['Napuść wodę z solą i kwiatami', 'Wejdź z afirmacją mocy', 'Masuj ciało zgodnie z ruchem serca', 'Wizualizuj złote światło wnikające w ciało', 'Wyjdź i stań w świetle przez chwilę'],
  },
];

export const SaltBathScreen = ({ navigation }: any) => {
    const themeName = useAppStore(s => s.themeName);
  const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const currentTheme = getResolvedTheme(themeName, userData?.preferences?.colorScheme);
  const isLight = isLightBg(currentTheme.background);
  const isDark = !isLight;
  const textColor = isLight ? '#042630' : '#E0F9FF';
  const subColor = isLight ? 'rgba(4,38,48,0.5)' : 'rgba(224,249,255,0.5)';
  const { t } = useTranslation();
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';

  const [activeProtocol, setActiveProtocol] = useState(PROTOCOLS[0]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [remaining, setRemaining] = useState(PROTOCOLS[0].duration * 60);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [saltAiInsight, setSaltAiInsight] = useState<string>('');
  const [saltAiLoading, setSaltAiLoading] = useState(false);
  const intervalRef = useRef<any>(null);

  // Map protocol id to ambient soundscape
  const getAmbientForProtocol = (pid: string): 'waves' | 'rain' | 'forest' => {
    if (pid === 'healing') return 'forest';
    if (pid === 'empower') return 'rain';
    return 'waves';
  };

  useEffect(() => {
    setRemaining(activeProtocol.duration * 60);
    setTimerRunning(false); setDoneSteps([]);
    clearInterval(intervalRef.current);
    // Stop any ambient sound when switching protocol
    if (soundPlaying) {
      AudioService.pauseAmbientSound().catch(() => {});
      setSoundPlaying(false);
    }
  }, [activeProtocol.id]);

  const toggleTimer = () => {
    if (timerRunning) {
      clearInterval(intervalRef.current);
      setTimerRunning(false);
      AudioService.pauseAmbientSound().catch(() => {});
      setSoundPlaying(false);
    } else {
      if (remaining === 0) setRemaining(activeProtocol.duration * 60);
      setTimerRunning(true);
      const soundscape = getAmbientForProtocol(activeProtocol.id);
      AudioService.playAmbientForSession(soundscape).catch(() => {});
      setSoundPlaying(true);
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setTimerRunning(false);
            setSoundPlaying(false);
            AudioService.pauseAmbientSound().catch(() => {});
            HapticsService.notify();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };
  useEffect(() => () => {
    clearInterval(intervalRef.current);
    AudioService.pauseAmbientSound().catch(() => {});
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const progress = 1 - remaining / (activeProtocol.duration * 60);

    const fetchSaltAi = async () => {
    setSaltAiLoading(true);
    HapticsService.impact('light');
    try {
      const prompt = "Kapiel solna. Protokol: " + activeProtocol.title + ". Czas trwania: " + activeProtocol.duration + " min. Intencja: " + activeProtocol.intention + ". Napisz krotka (3-4 zdania) duchowa interpretacje co ten protokol oczyszczenia oznacza dla ciala i energii uzytkownika oraz jedno afirmatywne przeslanie na czas kapieli.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setSaltAiInsight(result);
    } catch (e) {
      setSaltAiInsight("Blad pobierania interpretacji.");
    } finally {
      setSaltAiLoading(false);
    }
  };
return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <WaterBg isDark={isDark} />
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2 }}>{t('saltBath.eyebrow').toUpperCase()}</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>{t('saltBath.title')}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <MusicToggleButton color={ACCENT} size={18} />
          <Pressable
            style={styles.starBtn}
            hitSlop={12}
            onPress={() => { HapticsService.impact('light'); if (isFavoriteItem('salt-bath')) { removeFavoriteItem('salt-bath'); } else { addFavoriteItem({ id: 'salt-bath', label: 'Kąpiel Solna', route: 'SaltBath', params: {}, icon: 'Droplets', color: ACCENT, addedAt: new Date().toISOString() }); } }}
          >
            <Star size={18} color={isFavoriteItem('salt-bath') ? ACCENT : subColor} strokeWidth={1.8} fill={isFavoriteItem('salt-bath') ? ACCENT : 'none'} />
          </Pressable>
        </View>
      </View>

      {/* Protocol selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 10, marginBottom: 12 }}>
        {PROTOCOLS.map(p => (
          <Pressable key={p.id} onPress={() => { HapticsService.impact('light'); setActiveProtocol(p); }}
            style={[styles.protocolChip, { borderColor: activeProtocol.id === p.id ? p.color : 'rgba(6,182,212,0.2)', backgroundColor: activeProtocol.id === p.id ? p.color + '22' : 'rgba(6,182,212,0.06)' }]}>
            <Text style={{ color: activeProtocol.id === p.id ? p.color : subColor, fontSize: 13, fontWeight: '700' }}>{p.title}</Text>
            <Text style={{ color: subColor, fontSize: 11 }}>{p.duration} min</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen }}>
        {/* Timer */}
        <Animated.View entering={FadeInDown.delay(60).duration(500)}>
          <View style={[styles.timerCard, { backgroundColor: activeProtocol.color + '14', borderColor: activeProtocol.color + '30' }]}>
            <Text style={{ color: textColor, fontSize: 50, fontWeight: '100', letterSpacing: 4 }}>{fmt(remaining)}</Text>
            <Text style={{ color: subColor, fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>{activeProtocol.duration} MINUT RYTUAŁU</Text>
            <View style={styles.timerBtns}>
              <Pressable onPress={toggleTimer} style={[styles.timerBtn, { backgroundColor: activeProtocol.color }]}>
                {timerRunning ? <Pause size={20} color="#fff" /> : <Play size={20} color="#fff" />}
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{timerRunning ? 'Pauza' : 'Start'}</Text>
              </Pressable>
              <Pressable onPress={() => {
                clearInterval(intervalRef.current);
                setTimerRunning(false);
                setSoundPlaying(false);
                AudioService.pauseAmbientSound().catch(() => {});
                setRemaining(activeProtocol.duration * 60);
              }}
                style={[styles.timerBtnSmall, { borderColor: activeProtocol.color + '44' }]}>
                <RotateCcw size={16} color={activeProtocol.color} />
              </Pressable>
            </View>
            {soundPlaying && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Droplets size={12} color={activeProtocol.color} />
                <Text style={{ color: activeProtocol.color, fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>
                  AMBIENT: {getAmbientForProtocol(activeProtocol.id).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={[styles.progressBar, { backgroundColor: activeProtocol.color + '22' }]}>
              <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: activeProtocol.color }]} />
            </View>
          </View>
        </Animated.View>

        <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginTop: 16, marginBottom: 8 }}>{t('saltBath.skladniki', 'SKŁADNIKI')}</Text>
        {activeProtocol.ingredients.map((ing, i) => (
          <View key={i} style={[styles.ingRow, { borderColor: cardBorder }]}>
            <Droplets size={12} color={activeProtocol.color} />
            <Text style={{ color: textColor, fontSize: 13 }}>{ing}</Text>
          </View>
        ))}

        <View style={[styles.intentionCard, { backgroundColor: activeProtocol.color + '12', borderColor: activeProtocol.color + '25' }]}>
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>{t('saltBath.intencja', 'INTENCJA')}</Text>
          <Text style={{ color: textColor, fontSize: 14, lineHeight: 22, fontStyle: 'italic' }}>"{activeProtocol.intention}"</Text>
        </View>

        <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginTop: 16, marginBottom: 8 }}>{t('saltBath.kroki', 'KROKI')}</Text>
        {activeProtocol.steps.map((step, i) => {
          const done = doneSteps.includes(i);
return (
            <Pressable key={i} onPress={() => { HapticsService.impact('light'); setDoneSteps(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]); }}
              style={[styles.stepRow, { backgroundColor: done ? activeProtocol.color + '14' : cardBg, borderColor: done ? activeProtocol.color + '33' : cardBorder }]}>
              <View style={[styles.stepNum, { backgroundColor: done ? activeProtocol.color : activeProtocol.color + '33' }]}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
              </View>
              <Text style={{ color: textColor, fontSize: 13, flex: 1, lineHeight: 20 }}>{step}</Text>
              <CheckCircle2 size={16} color={done ? activeProtocol.color : cardBorder} />
            </Pressable>
          );
        })}

                <View style={{ marginTop: 16, marginBottom: 8, borderRadius: 16, backgroundColor: "#06B6D422", borderWidth: 1, borderColor: "#06B6D4", padding: 16 }}>
          <Text style={{ color: "#06B6D4", fontWeight: "700", fontSize: 13, letterSpacing: 1, marginBottom: 8 }}>{t('saltBath.ai_interpreta_kapieli', 'AI INTERPRETACJA KAPIELI')}</Text>
          {saltAiInsight ? (
            <Text style={{ color: "#E0F9FF", fontSize: 14, lineHeight: 22 }}>{saltAiInsight}</Text>
          ) : null}
          <Pressable onPress={fetchSaltAi} disabled={saltAiLoading} style={{ marginTop: 12, backgroundColor: "#06B6D4", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
            <Text style={{ color: "#042630", fontWeight: "700", fontSize: 14 }}>{saltAiLoading ? "Interpretuję..." : "Interpretuj"}</Text>
          </Pressable>
        </View>
<EndOfContentSpacer />
      </ScrollView>
        </SafeAreaView>
</View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingBottom: 12, gap: 12, paddingTop: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  starBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(6,182,212,0.3)', backgroundColor: 'rgba(6,182,212,0.08)' },
  protocolChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 2 },
  timerCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 16 },
  timerBtns: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  timerBtn: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  timerBtnSmall: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  progressBar: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1 },
  intentionCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 6 },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
