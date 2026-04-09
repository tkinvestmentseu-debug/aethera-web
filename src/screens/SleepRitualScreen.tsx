// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, Dimensions, Text, TextInput, AppState } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Ellipse, Line } from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, Star, Moon, CheckCircle2, Clock, Zap, Wind, Heart } from 'lucide-react-native';
import { getResolvedTheme, isLightBg } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#6366F1';

const AnimCircle = Animated.createAnimatedComponent(Circle);

const SleepBg = ({ isDark }: { isDark: boolean }) => {
  const tiltX = useSharedValue(0); const tiltY = useSharedValue(0);
  const pan = Gesture.Pan()
    .onUpdate(e => { tiltX.value = e.translationX / SW * 10; tiltY.value = e.translationY / 300 * 10; })
    .onEnd(() => { tiltX.value = withTiming(0, { duration: 800 }); tiltY.value = withTiming(0, { duration: 800 }); });
  const animStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 600 }, { rotateX: `${-tiltY.value}deg` }, { rotateY: `${tiltX.value}deg` }] }));
  const glow = useSharedValue(70);
  useEffect(() => { glow.value = withRepeat(withSequence(withTiming(90, { duration: 3000, easing: Easing.inOut(Easing.sin) }), withTiming(70, { duration: 3000 })), -1); }, []);
  const glowProps = useAnimatedProps(() => ({ r: glow.value }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={isDark ? ['#030310', '#060420', '#08052A'] : ['#EBF0FF', '#F0EEFF', '#F6F0FF']} style={StyleSheet.absoluteFill} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
          <Svg width={SW} height={480} style={{ position: 'absolute', top: 20 }}>
            <Defs>
              <RadialGradient id="moonAura" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={ACCENT} stopOpacity={isDark ? "0.25" : "0.12"} />
                <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <AnimCircle cx={SW / 2} cy={180} animatedProps={glowProps} fill="url(#moonAura)" />
            {[50, 80, 110, 140].map((r, i) => (
              <Circle key={i} cx={SW / 2} cy={180} r={r} stroke={ACCENT} strokeWidth={0.5} fill="none"
                strokeDasharray={`${r * 0.4} ${r * 0.2}`} opacity={isDark ? 0.2 - i * 0.04 : 0.1 - i * 0.02} />
            ))}
            <Circle cx={SW / 2} cy={180} r={36} fill={isDark ? '#0D0B28' : '#EBF0FF'} opacity={0.9} />
            <Circle cx={SW / 2} cy={180} r={30} fill={isDark ? '#E2E8FF' : '#B8C5FF'} opacity={isDark ? 0.75 : 0.6} />
            <Circle cx={SW / 2 + 10} cy={175} r={22} fill={isDark ? '#030310' : '#EBF0FF'} opacity={0.85} />
            {[
              [20, 60], [SW - 30, 80], [40, 160], [SW - 50, 200], [80, 280], [SW - 80, 320],
              [120, 380], [SW - 20, 400], [60, 440], [SW - 100, 100],
            ].map(([cx, cy], i) => (
              <Circle key={'s' + i} cx={cx} cy={cy} r={i % 3 === 0 ? 1.5 : 0.8} fill="#E2E8FF" opacity={isDark ? 0.3 : 0.12} />
            ))}
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const PROTOCOL_STEPS = [
  { id: '1', time: '21:00', icon: '📵', title: 'Odłóż telefon', desc: 'Zakończ czas przed ekranem. Włącz tryb samolotowy lub DND.' },
  { id: '2', time: '21:15', icon: '🍵', title: 'Herbata wieczorna', desc: 'Rumianek, lipa lub melisa. Pij powoli, bez pośpiechu.' },
  { id: '3', time: '21:30', icon: '🛁', title: 'Kąpiel lub prysznic', desc: 'Ciepła woda obniża temperaturę ciała po wyjściu, co przyspiesza zasypianie.' },
  { id: '4', time: '21:45', icon: '📖', title: 'Lektura lub dziennik', desc: 'Czytaj coś spokojnego lub zapisz myśli, by "opróżnić głowę".' },
  { id: '5', time: '22:00', icon: '🧘', title: 'Skanowanie ciała', desc: '10 minut świadomej relaksacji od stóp do głowy.' },
  { id: '6', time: '22:10', icon: '🌙', title: 'Afirmacja snu', desc: 'Powtórz intencję snu i wdychaj głęboko 4-7-8.' },
  { id: '7', time: '22:15', icon: '💤', title: 'Sen', desc: 'Połóż się w ciemności, chłodzie, ciszy. Dobranoc.' },
];

const BODY_SCAN = [
  { region: 'Stopy i łydki', cue: 'Poczuj ciężar stóp na materacu. Rozluźnij palce, pięty, łydki...' },
  { region: 'Uda i biodra', cue: 'Pozwól udom opaść. Rozluźnij mięśnie ud, poczuj ciepło bioder...' },
  { region: 'Brzuch i plecy', cue: 'Oddech rozszerza brzuch. Plecy opadają w materac z każdym wydechem...' },
  { region: 'Klatka piersiowa', cue: 'Serce bije spokojnie. Ramiona opadają. Klatka rozszerza się swobodnie...' },
  { region: 'Szyja i ramiona', cue: 'Rozluźnij szczękę, język, czoło. Każde napięcie odpływa...' },
  { region: 'Głowa i twarz', cue: 'Umysł spoczywa. Jesteś bezpieczny. Możesz spokojnie zasnąć...' },
];

export const SleepRitualScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
    const themeName = useAppStore(s => s.themeName);
  const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const currentTheme = getResolvedTheme(themeName, userData?.preferences?.colorScheme);
  const isLight = isLightBg(currentTheme.background);
  const isDark = !isLight;
  const textColor = isLight ? '#0E0C2A' : '#EEF0FF';
  const subColor = isLight ? 'rgba(14,12,42,0.5)' : 'rgba(238,240,255,0.5)';
  const { t } = useTranslation();
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';

  const [activeTab, setActiveTab] = useState<'protocol' | 'scan' | 'breath'>('protocol');
  const [doneSteps, setDoneSteps] = useState<string[]>([]);
  const [scanStep, setScanStep] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'idle'>('idle');
  const [breathCount, setBreathCount] = useState(4);
  const intervalRef = useRef<any>(null);

  const breathScale = useSharedValue(1);
  const breathAnim = useAnimatedStyle(() => ({ transform: [{ scale: breathScale.value }] }));

  const startBreath = () => {
    setBreathPhase('inhale');
    setBreathCount(4);
    breathScale.value = withTiming(1.5, { duration: 4000 });
    let sec = 0;
    intervalRef.current = setInterval(() => {
      sec++;
      if (sec < 4) { setBreathCount(4 - sec); }
      else if (sec === 4) { setBreathPhase('hold'); setBreathCount(7); breathScale.value = 1.5; }
      else if (sec < 11) { setBreathCount(11 - sec); }
      else if (sec === 11) { setBreathPhase('exhale'); setBreathCount(8); breathScale.value = withTiming(1, { duration: 8000 }); }
      else if (sec < 19) { setBreathCount(19 - sec); }
      else { setBreathPhase('idle'); clearInterval(intervalRef.current); }
    }, 1000);
  };
  useEffect(() => () => clearInterval(intervalRef.current), []);

  const PHASE_LABELS = { inhale: 'WDECH', hold: 'ZATRZYMAJ', exhale: 'WYDECH', idle: 'DOTKNIJ ABY ZACZĄĆ' };
  const PHASE_COLORS = { inhale: '#818CF8', hold: '#A78BFA', exhale: '#60A5FA', idle: ACCENT };

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <SleepBg isDark={isDark} />
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2 }}>{t('sleepRitual.eyebrow').toUpperCase()}</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>{t('sleepRitual.title')}</Text>
        </View>
        <Pressable style={styles.starBtn} hitSlop={12} onPress={() => { HapticsService.impact('light'); if (isFavoriteItem('sleep-ritual')) { removeFavoriteItem('sleep-ritual'); } else { addFavoriteItem({ id: 'sleep-ritual', label: 'Rytuał snu', route: 'SleepRitual', params: {}, icon: 'Moon', color: ACCENT, addedAt: new Date().toISOString() }); } }}>
          <Star size={18} color={isFavoriteItem('sleep-ritual') ? ACCENT : subColor} strokeWidth={1.8} fill={isFavoriteItem('sleep-ritual') ? ACCENT : 'none'} />
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {([['protocol', t('sleepRitual.tabProtocol')], ['scan', t('sleepRitual.tabScan')], ['breath', t('sleepRitual.tabBreath')]] as const).map(([tab, label]) => {
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
        {activeTab === 'protocol' && (
          <>
            <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
              {t('sleepRitual.7_krokowy_protokol_wieczorny_przygo', '7-krokowy protokół wieczorny przygotowuje ciało i umysł do głębokiego, regenerującego snu.')}
            </Text>
            {PROTOCOL_STEPS.map((step, i) => {
              const done = doneSteps.includes(step.id);
              return (
                <Animated.View key={step.id} entering={FadeInDown.delay(80 + i * 50).duration(400)}>
                  <Pressable onPress={() => { HapticsService.impactLight(); setDoneSteps(p => p.includes(step.id) ? p.filter(x => x !== step.id) : [...p, step.id]); }}
                    style={[styles.stepCard, { backgroundColor: done ? ACCENT + '18' : cardBg, borderColor: done ? ACCENT + '44' : cardBorder }]}>
                    <View style={[styles.timeTag, { backgroundColor: ACCENT + '22' }]}>
                      <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700' }}>{step.time}</Text>
                    </View>
                    <Text style={{ fontSize: 20 }}>{step.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>{step.title}</Text>
                      <Text style={{ color: subColor, fontSize: 12, lineHeight: 18 }}>{step.desc}</Text>
                    </View>
                    <CheckCircle2 size={20} color={done ? ACCENT : cardBorder} />
                  </Pressable>
                </Animated.View>
              );
            })}
          </>
        )}

        {activeTab === 'scan' && (
          <>
            <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
              {t('sleepRitual.progresywn_relaksacja_miesni_przejd', 'Progresywna relaksacja mięśni. Przejdź przez każdy region ciała, zatrzymując się na 30-60 sekund.')}
            </Text>
            {BODY_SCAN.map((item, i) => {
              const active = scanStep === i;
              const done = scanStep > i;
              return (
                <Animated.View key={i} entering={FadeInDown.delay(80 + i * 50).duration(400)}>
                  <Pressable onPress={() => setScanStep(i)}
                    style={[styles.scanCard, { backgroundColor: active ? ACCENT + '22' : done ? cardBg : cardBg, borderColor: active ? ACCENT + '66' : cardBorder }]}>
                    <View style={[styles.scanNum, { backgroundColor: active ? ACCENT : done ? ACCENT + '44' : cardBorder }]}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>{item.region}</Text>
                      {active && <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginTop: 4 }}>{item.cue}</Text>}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
            <Pressable onPress={() => setScanStep(0)} style={[styles.resetBtn, { borderColor: ACCENT + '44' }]}>
              <Text style={{ color: ACCENT, fontSize: 13 }}>{t('sleepRitual.zacznij_od_nowa', 'Zacznij od nowa')}</Text>
            </Pressable>
          </>
        )}

        {activeTab === 'breath' && (
          <View style={{ alignItems: 'center', paddingTop: 20 }}>
            <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 30 }}>
              {t('sleepRitual.technika_4_7_8_aktywuje', 'Technika 4-7-8 aktywuje nerw błędny i usypia ciało w ciągu kilku cykli.')}
            </Text>
            <Animated.View style={[breathAnim, { marginBottom: 30 }]}>
              <Pressable onPress={() => { if (breathPhase === 'idle') startBreath(); }}
                style={[styles.breathCircle, { backgroundColor: (PHASE_COLORS[breathPhase] || ACCENT) + '22', borderColor: (PHASE_COLORS[breathPhase] || ACCENT) + '66' }]}>
                <Text style={{ color: PHASE_COLORS[breathPhase] || ACCENT, fontSize: 14, fontWeight: '700', letterSpacing: 2 }}>{PHASE_LABELS[breathPhase]}</Text>
                {breathPhase !== 'idle' && <Text style={{ color: textColor, fontSize: 40, fontWeight: '200', marginTop: 4 }}>{breathCount}</Text>}
              </Pressable>
            </Animated.View>
            <View style={[styles.breathInfo, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
                {[['4s', 'Wdech'], ['7s', 'Zatrzymaj'], ['8s', 'Wydech']].map(([time, label]) => (
                  <View key={label} style={{ alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: ACCENT, fontSize: 22, fontWeight: '200' }}>{time}</Text>
                    <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1 }}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={{ color: subColor, fontSize: 12, textAlign: 'center', marginTop: 16 }}>
              {t('sleepRitual.wykonaj_4_cykle_przed_snem', 'Wykonaj 4 cykle przed snem. Za każdym razem jest łatwiej.')}
            </Text>
          </View>
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
  starBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', backgroundColor: 'rgba(99,102,241,0.08)' },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: layout.padding.screen, marginBottom: 12 },
  tabChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)', backgroundColor: 'rgba(99,102,241,0.06)' },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  stepCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  timeTag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  scanCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  scanNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  resetBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  breathCircle: { width: 180, height: 180, borderRadius: 90, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  breathInfo: { borderRadius: 16, borderWidth: 1, padding: 20, width: '100%' },
});
