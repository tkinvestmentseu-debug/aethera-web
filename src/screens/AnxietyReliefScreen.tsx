// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, Dimensions, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Wind, Heart, Brain, CheckCircle2, Zap,
  Eye, Snowflake, Activity, Footprints, Phone, Droplets,
} from 'lucide-react-native';
import { getResolvedTheme, isLightBg } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#10B981';

const AnimCircle = Animated.createAnimatedComponent(Circle);

const CalmBg = ({ isDark }: { isDark: boolean }) => {
  const tiltX = useSharedValue(0); const tiltY = useSharedValue(0);
  const pan = Gesture.Pan()
    .onUpdate(e => { tiltX.value = e.translationX / SW * 10; tiltY.value = e.translationY / 300 * 10; })
    .onEnd(() => { tiltX.value = withTiming(0, { duration: 800 }); tiltY.value = withTiming(0, { duration: 800 }); });
  const animStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 600 }, { rotateX: `${-tiltY.value}deg` }, { rotateY: `${tiltX.value}deg` }] }));
  const expand = useSharedValue(80);
  useEffect(() => { expand.value = withRepeat(withSequence(withTiming(120, { duration: 4000, easing: Easing.inOut(Easing.sin) }), withTiming(80, { duration: 4000 })), -1); }, []);
  const expandProps = useAnimatedProps(() => ({ r: expand.value }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={isDark ? ['#021510', '#031C14', '#03201A'] : ['#ECFDF5', '#F0FDF9', '#F5FFFC']} style={StyleSheet.absoluteFill} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
          <Svg width={SW} height={460} style={{ position: 'absolute', top: 20 }}>
            <Defs>
              <RadialGradient id="calmGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={ACCENT} stopOpacity={isDark ? "0.22" : "0.10"} />
                <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <AnimCircle cx={SW / 2} cy={190} animatedProps={expandProps} fill="url(#calmGlow)" />
            {[35, 60, 90, 120].map((r, i) => (
              <Circle key={i} cx={SW / 2} cy={190} r={r} stroke={ACCENT} strokeWidth={0.7} fill="none"
                opacity={isDark ? 0.20 - i * 0.04 : 0.08 - i * 0.015} />
            ))}
            <Circle cx={SW / 2} cy={190} r={30} fill={ACCENT} opacity={isDark ? 0.10 : 0.06} />
            <Path d={`M${SW / 2 - 16},${190} L${SW / 2},${190 - 16} L${SW / 2 + 16},${190} L${SW / 2},${190 + 16} Z`}
              fill={ACCENT} opacity={isDark ? 0.28 : 0.15} />
            {Array.from({ length: 18 }, (_, i) => (
              <Circle key={'p' + i} cx={(i * 137 + 40) % SW} cy={(i * 89 + 60) % 440}
                r={i % 5 === 0 ? 1.3 : 0.6} fill={ACCENT} opacity={isDark ? 0.12 : 0.05} />
            ))}
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

type TechniqueId = '54321' | 'box' | 'butterfly' | 'cold' | 'lion' | 'body';

const TECHNIQUES: Array<{
  id: TechniqueId;
  Icon: any;
  color: string;
  title: string;
  desc: string;
  badge: string;
}> = [
  {
    id: '54321', Icon: Eye, color: '#10B981', title: 'Technika 5-4-3-2-1',
    desc: 'Uziemienie przez zmysły: nazwij 5 rzeczy które widzisz, 4 które czujesz, 3 słyszysz, 2 wąchujesz, 1 smakujesz.',
    badge: 'Uziemienie',
  },
  {
    id: 'box', Icon: Wind, color: '#06B6D4', title: 'Oddech skrzynkowy',
    desc: 'Wdech 4s → Zatrzymaj 4s → Wydech 4s → Zatrzymaj 4s. Powtórz 4 razy.',
    badge: 'Oddech',
  },
  {
    id: 'butterfly', Icon: Heart, color: '#A78BFA', title: 'Motyl EMDR',
    desc: 'Skrzyżuj ramiona na klatce. Na zmianę stukaj w ramiona (L-P-L-P). Uwalnia napięcie traumatyczne.',
    badge: 'EMDR',
  },
  {
    id: 'cold', Icon: Snowflake, color: '#60A5FA', title: 'Zimna woda',
    desc: 'Twarz w zimnej wodzie przez 30 sekund aktywuje odpowiedź nurka — natychmiastowe uspokojenie.',
    badge: 'Refleks nurka',
  },
  {
    id: 'lion', Icon: Wind, color: '#F59E0B', title: 'Oddech lwa',
    desc: 'Wdech nosem, wydech ustami z "HA" wyrzucając wszystko. Rozluźnia szczękę i gardło.',
    badge: 'Rozluźnienie',
  },
  {
    id: 'body', Icon: Activity, color: '#F472B6', title: 'Ruch uwalniający',
    desc: 'Potrząśnij całym ciałem przez 30 sekund. Lęk jest napięciem — uwolnij go ruchem.',
    badge: 'Ruch',
  },
];

const CRISIS_STEPS = [
  { text: 'Zatrzymaj się. Nie musisz nic teraz robić.', Icon: Zap },
  { text: 'Połóż dłoń na klatce piersiowej. Poczuj swoje serce.', Icon: Heart },
  { text: 'Powiedz sobie: "To minie. Jestem bezpieczny/a."', Icon: Brain },
  { text: 'Weź 3 głębokie oddechy przeponowe.', Icon: Wind },
  { text: 'Nazwij 5 rzeczy wokół ciebie (zakotwiczenie).', Icon: Eye },
  { text: 'Wypij szklankę zimnej wody powoli.', Icon: Droplets },
  { text: 'Zadzwoń do kogoś lub wyjdź na krótki spacer.', Icon: Phone },
];

const DAILY_HABITS = [
  { Icon: Brain, color: '#F59E0B', title: 'Poranek bez telefonu', desc: '15 minut na siebie przed sprawdzeniem powiadomień' },
  { Icon: Footprints, color: '#10B981', title: '10 min spaceru', desc: 'Natura i ruch obniżają kortyzol o 20%' },
  { Icon: Wind, color: '#60A5FA', title: 'Detox wieczorny', desc: 'Brak ekranów 1h przed snem' },
  { Icon: Heart, color: '#F472B6', title: 'Dziennik myśli', desc: '3 rzeczy za które jesteś wdzięczny + 1 niepokój' },
];

export const AnxietyReliefScreen = ({ navigation }: any) => {
    const themeName = useAppStore(s => s.themeName);
  const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const currentTheme = getResolvedTheme(themeName, userData?.preferences?.colorScheme);
  const isDark = !isLightBg(currentTheme.background);
  const isLight = !isDark;
  const textColor = isLight ? '#012A1A' : '#E8FFF6';
  const subColor = isLight ? 'rgba(1,42,26,0.55)' : 'rgba(232,255,246,0.55)';
  const { t } = useTranslation();
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.09)';

  const [activeTab, setActiveTab] = useState<'techniques' | 'crisis' | 'habits'>('techniques');
  const [activeTech, setActiveTech] = useState<string | null>(null);
  const [doneCrisis, setDoneCrisis] = useState<number[]>([]);
  const [doneHabits, setDoneHabits] = useState<number[]>([]);

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <CalmBg isDark={isDark} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: ACCENT, fontSize: 10, letterSpacing: 2, fontWeight: '700' }}>WSPARCIE EMOCJONALNE</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>Ulga w lęku</Text>
        </View>
        <Pressable style={styles.starBtn} hitSlop={12} onPress={() => { HapticsService.impact('light'); if (isFavoriteItem('anxiety-relief')) { removeFavoriteItem('anxiety-relief'); } else { addFavoriteItem({ id: 'anxiety-relief', label: 'Ulga w lęku', route: 'AnxietyRelief', params: {}, icon: 'Wind', color: ACCENT, addedAt: new Date().toISOString() }); } }}>
          <Star size={18} color={isFavoriteItem('anxiety-relief') ? ACCENT : subColor} strokeWidth={1.8} fill={isFavoriteItem('anxiety-relief') ? ACCENT : 'none'} />
        </Pressable>
      </View>

      {/* Tab row */}
      <View style={styles.tabRow}>
        {([
          ['techniques', 'Techniki'],
          ['crisis', 'SOS'],
          ['habits', 'Nawyki'],
        ] as const).map(([tab, label]) => {
          const active = activeTab === tab;
          const isSOS = tab === 'crisis';
          return (
            <Pressable
              key={tab}
              onPress={() => { HapticsService.impactLight(); setActiveTab(tab); }}
              style={[
                styles.tabChip,
                isSOS && { borderColor: 'rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.07)' },
                active && !isSOS && { backgroundColor: ACCENT, borderColor: ACCENT },
                active && isSOS && { backgroundColor: '#EF4444', borderColor: '#EF4444' },
              ]}
            >
              {isSOS && !active && <Zap size={12} color="#EF4444" />}
              <Text style={[
                styles.tabLabel,
                { color: active ? '#fff' : (isSOS ? '#EF4444' : subColor) },
              ]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen }}>

        {/* ── TECHNIQUES TAB ── */}
        {activeTab === 'techniques' && (
          <>
            <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 14 }}>
              Sprawdzone techniki terapeutyczne do szybkiego obniżenia poziomu lęku. Wybierz technikę, aby zobaczyć instrukcję.
            </Text>
            {TECHNIQUES.map((tech, i) => {
              const { Icon } = tech;
              const isActive = activeTech === tech.id;
              return (
                <Animated.View key={tech.id} entering={FadeInDown.delay(60 + i * 50).duration(400)}>
                  <Pressable
                    onPress={() => { HapticsService.impactLight(); setActiveTech(tech.id === activeTech ? null : tech.id); }}
                    style={[
                      styles.techCard,
                      {
                        backgroundColor: isActive ? tech.color + '14' : cardBg,
                        borderColor: isActive ? tech.color + '60' : cardBorder,
                      },
                    ]}
                  >
                    {isActive && (
                      <LinearGradient
                        colors={[tech.color + '18', 'transparent']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                      />
                    )}
                    <View style={[styles.techIconWrap, { backgroundColor: tech.color + '20', borderColor: tech.color + '40' }]}>
                      <Icon size={22} color={tech.color} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <Text style={{ color: textColor, fontSize: 14, fontWeight: '700', flex: 1 }}>{tech.title}</Text>
                        <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: tech.color + '22' }}>
                          <Text style={{ color: tech.color, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>{tech.badge.toUpperCase()}</Text>
                        </View>
                      </View>
                      {isActive && (
                        <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginTop: 4 }}>{tech.desc}</Text>
                      )}
                      {!isActive && (
                        <Text style={{ color: subColor, fontSize: 12 }} numberOfLines={1}>{tech.desc}</Text>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </>
        )}

        {/* ── CRISIS / SOS TAB ── */}
        {activeTab === 'crisis' && (
          <>
            {/* SOS Banner */}
            <View style={styles.sosBanner}>
              <LinearGradient
                colors={['rgba(239,68,68,0.18)', 'rgba(239,68,68,0.08)']}
                style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <View style={styles.sosIconWrap}>
                  <Zap size={18} color="#EF4444" />
                </View>
                <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }}>NAPAD LĘKU?</Text>
              </View>
              <Text style={{ color: isLight ? 'rgba(180,20,20,0.75)' : 'rgba(252,165,165,0.9)', fontSize: 13, lineHeight: 20 }}>
                Wykonaj poniższe kroki jeden po drugim. Każdy zaznaczony krok obniża poziom kortyzolu. Jesteś bezpieczny/a.
              </Text>
            </View>

            {CRISIS_STEPS.map((step, i) => {
              const done = doneCrisis.includes(i);
              const { Icon } = step;
              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    HapticsService.impactLight();
                    setDoneCrisis(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
                  }}
                  style={[
                    styles.crisisStep,
                    {
                      backgroundColor: done ? '#EF444414' : cardBg,
                      borderColor: done ? '#EF444440' : cardBorder,
                    },
                  ]}
                >
                  <View style={[styles.crisisNum, { backgroundColor: done ? '#EF4444' : 'rgba(239,68,68,0.18)' }]}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{i + 1}</Text>
                  </View>
                  <View style={[styles.crisisIconWrap, { backgroundColor: done ? '#EF444422' : cardBg, borderColor: done ? '#EF444435' : cardBorder }]}>
                    <Icon size={14} color={done ? '#EF4444' : subColor} strokeWidth={1.8} />
                  </View>
                  <Text style={{ color: textColor, fontSize: 13, flex: 1, lineHeight: 20 }}>{step.text}</Text>
                  <CheckCircle2 size={16} color={done ? '#EF4444' : cardBorder} />
                </Pressable>
              );
            })}

            {doneCrisis.length === CRISIS_STEPS.length && (
              <Animated.View entering={FadeInDown.duration(500)} style={[styles.crisisDone, { backgroundColor: ACCENT + '14', borderColor: ACCENT + '35' }]}>
                <Heart size={18} color={ACCENT} />
                <Text style={{ color: ACCENT, fontSize: 14, fontWeight: '700', flex: 1 }}>
                  Brawo — przeszłeś/przeszłaś przez wszystkie kroki. To wymaga odwagi.
                </Text>
              </Animated.View>
            )}
          </>
        )}

        {/* ── HABITS TAB ── */}
        {activeTab === 'habits' && (
          <>
            <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
              Małe codzienne nawyki budują odporność na stres i redukują chroniczny lęk. Zaznaczaj ukończone dziś.
            </Text>
            {DAILY_HABITS.map((habit, i) => {
              const done = doneHabits.includes(i);
              const { Icon } = habit;
              return (
                <Animated.View key={i} entering={FadeInDown.delay(60 + i * 60).duration(400)}>
                  <Pressable
                    onPress={() => {
                      HapticsService.impactLight();
                      setDoneHabits(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
                    }}
                    style={[
                      styles.habitCard,
                      {
                        backgroundColor: done ? habit.color + '14' : cardBg,
                        borderColor: done ? habit.color + '45' : cardBorder,
                      },
                    ]}
                  >
                    {done && (
                      <LinearGradient
                        colors={[habit.color + '18', 'transparent']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                      />
                    )}
                    <View style={[styles.habitIconWrap, { backgroundColor: habit.color + '20', borderColor: habit.color + '40' }]}>
                      <Icon size={20} color={habit.color} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: textColor, fontSize: 14, fontWeight: '700' }}>{habit.title}</Text>
                      <Text style={{ color: subColor, fontSize: 12, lineHeight: 18, marginTop: 2 }}>{habit.desc}</Text>
                    </View>
                    <View style={[styles.habitCheck, { backgroundColor: done ? habit.color : 'transparent', borderColor: done ? habit.color : cardBorder }]}>
                      {done && <CheckCircle2 size={14} color="#fff" />}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}

            {/* Progress card */}
            {doneHabits.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400)} style={[styles.progressCard, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '30' }]}>
                <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '700' }}>
                  {doneHabits.length} / {DAILY_HABITS.length} nawyków dziś ukończonych
                </Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(doneHabits.length / DAILY_HABITS.length) * 100}%`, backgroundColor: ACCENT }]} />
                </View>
              </Animated.View>
            )}
          </>
        )}

        <EndOfContentSpacer />
      </ScrollView>
        </SafeAreaView>
</View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: layout.padding.screen, paddingBottom: 12, gap: 12, paddingTop: 6,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  starBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', backgroundColor: 'rgba(16,185,129,0.08)',
  },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: layout.padding.screen, marginBottom: 14 },
  tabChip: {
    flex: 1, flexDirection: 'row', paddingVertical: 8, borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)', backgroundColor: 'rgba(16,185,129,0.06)',
    alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  tabLabel: { fontSize: 12, fontWeight: '700' },
  // Techniques
  techCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10, overflow: 'hidden',
  },
  techIconWrap: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  // Crisis
  sosBanner: {
    padding: 18, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.35)',
    marginBottom: 16, overflow: 'hidden',
  },
  sosIconWrap: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  crisisStep: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  crisisNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  crisisIconWrap: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  crisisDone: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 4,
  },
  // Habits
  habitCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10, overflow: 'hidden',
  },
  habitIconWrap: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  habitCheck: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  progressCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 4, gap: 10 },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: 'rgba(16,185,129,0.15)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
});
