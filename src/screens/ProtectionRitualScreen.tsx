// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View, Dimensions, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Polygon, Line } from 'react-native-svg';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, Star, Shield, Zap, CheckCircle2, Gem } from 'lucide-react-native';
import { getResolvedTheme, isLightBg } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#7C3AED';
const SILVER = '#C4B5FD';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Contained Shield SVG Widget ───────────────────────────────────────────────
const ShieldWidget = ({ isDark }: { isDark: boolean }) => {
  const tiltX = useSharedValue(0); const tiltY = useSharedValue(0);
  const pan = Gesture.Pan()
    .onUpdate(e => { tiltX.value = e.translationX / 200 * 20; tiltY.value = e.translationY / 200 * 20; })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });
  const tiltStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { rotateX: `${-tiltY.value}deg` },
      { rotateY: `${tiltX.value}deg` },
    ],
  }));

  const pulse = useSharedValue(68);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(88, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(68, { duration: 2200 }),
      ), -1,
    );
  }, []);
  const pulseProps = useAnimatedProps(() => ({ r: pulse.value }));

  const W = 200; const H = 200; const CX = 100; const CY = 100;
  // Pentagon points centered in 200x200
  const penta = (cx: number, cy: number, r: number) =>
    Array.from({ length: 5 }, (_, i) => {
      const a = (i * 72 - 90) * Math.PI / 180;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(' ');

    const fetchProtAi = async () => {
    setProtAiLoading(true);
    HapticsService.impactLight();
    try {
      const prompt = "Rytual ochronny. Typ ochrony: " + activeTypeData.title + ". Wykonane kroki: " + doneSteps.length + "/" + RITUAL_STEPS.length + ". Napisz krotka (3-4 zdania) duchowa interpretacje co ten typ ochrony oznacza dla uzytkownika w tej chwili i jak wzmocnic tarcze.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setProtAiInsight(result);
    } catch (e) {
      setProtAiInsight("Blad pobierania interpretacji.");
    } finally {
      setProtAiLoading(false);
    }
  };
return (
    <View style={{ alignItems: 'center', marginVertical: 12 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[tiltStyle, { width: W, height: H }]}>
          <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <Defs>
              <RadialGradient id="sg" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={ACCENT} stopOpacity={isDark ? '0.40' : '0.20'} />
                <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            {/* Glow */}
            <AnimatedCircle cx={CX} cy={CY} animatedProps={pulseProps} fill="url(#sg)" />
            {/* Concentric rings */}
            {[28, 48, 68].map((r, i) => (
              <Circle key={i} cx={CX} cy={CY} r={r} stroke={SILVER} strokeWidth={0.6} fill="none"
                strokeDasharray={`${r * 0.5} ${r * 0.25}`}
                opacity={isDark ? 0.30 - i * 0.06 : 0.14 - i * 0.03} />
            ))}
            {/* Outer pentagon */}
            <Polygon points={penta(CX, CY, 72)} stroke={SILVER} strokeWidth={1.4}
              fill={ACCENT} fillOpacity={isDark ? 0.14 : 0.07} opacity={0.85} />
            {/* Inner pentagon */}
            <Polygon points={penta(CX, CY, 54)} stroke={SILVER} strokeWidth={0.7}
              fill="none" opacity={isDark ? 0.55 : 0.30} />
            {/* Star-of-protection nodes */}
            {Array.from({ length: 6 }, (_, i) => {
              const a = (i * 60 - 90) * Math.PI / 180;
                const fetchProtAi = async () => {
    setProtAiLoading(true);
    HapticsService.impactLight();
    try {
      const prompt = "Rytual ochronny. Typ ochrony: " + activeTypeData.title + ". Wykonane kroki: " + doneSteps.length + "/" + RITUAL_STEPS.length + ". Napisz krotka (3-4 zdania) duchowa interpretacje co ten typ ochrony oznacza dla uzytkownika w tej chwili i jak wzmocnic tarcze.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setProtAiInsight(result);
    } catch (e) {
      setProtAiInsight("Blad pobierania interpretacji.");
    } finally {
      setProtAiLoading(false);
    }
  };
return (
                <Circle key={'s' + i}
                  cx={CX + 22 * Math.cos(a)} cy={CY + 22 * Math.sin(a)}
                  r={2.8} fill={SILVER} opacity={isDark ? 0.55 : 0.30} />
              );
            })}
            {/* Centre dot */}
            <Circle cx={CX} cy={CY} r={9} fill={ACCENT} opacity={isDark ? 0.55 : 0.35} />
            <Circle cx={CX - 3} cy={CY - 3} r={3} fill="#fff" opacity={0.4} />
            {/* Particle dust */}
            {Array.from({ length: 14 }, (_, i) => (
              <Circle key={'p' + i}
                cx={(i * 131 + 30) % W} cy={(i * 97 + 20) % H}
                r={i % 4 === 0 ? 1.4 : 0.7} fill={SILVER} opacity={isDark ? 0.18 : 0.08} />
            ))}
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const PROTECTION_TYPES = [
  { id: 'energy', icon: '⚡', color: '#F59E0B', title: 'Energetyczna', fullTitle: 'Ochrona energetyczna', desc: 'Tarcza przed wampirami energetycznymi i negatywnymi wpływami z otoczenia.' },
  { id: 'psychic', icon: '🔮', color: '#818CF8', title: 'Psychiczna', fullTitle: 'Ochrona psychiczna', desc: 'Bariera przed negatywnymi myślami, chronicznym stresem i lękiem.' },
  { id: 'space', icon: '🏠', color: '#34D399', title: 'Przestrzeni', fullTitle: 'Ochrona przestrzeni', desc: 'Oczyszczenie i zabezpieczenie domu oraz miejsca pracy.' },
  { id: 'aura', icon: '✨', color: '#F472B6', title: 'Aury', fullTitle: 'Wzmocnienie aury', desc: 'Przywrócenie jasności i siły twojego pola energetycznego.' },
];

const RITUAL_STEPS = [
  { n: 1, title: 'Grounding – uziemienie', icon: '🌍', color: '#34D399', desc: 'Stań boso na podłodze (lub wyobraź sobie korzenie). 3 oddechy. Poczuj ziemię pod stopami.' },
  { n: 2, title: 'Centrum mocy', icon: '🌟', color: '#FBBF24', desc: 'Połóż dłonie na klatce piersiowej. Wyobraź sobie jasne złote światło rosnące od środka.' },
  { n: 3, title: 'Budowanie tarczy', icon: '🛡️', color: '#A78BFA', desc: 'Wyobraź sobie sferę czystego białego/złotego światła otaczającą cię całkowicie.' },
  { n: 4, title: 'Wzmocnienie', icon: '⚡', color: '#F59E0B', desc: 'Powiedz: "Jestem chroniony. Wybieram co wchodzi do mojego pola. Nic negatywnego mnie nie dotyczy."' },
  { n: 5, title: 'Zamknięcie i zakotwiczenie', icon: '⚓', color: '#60A5FA', desc: 'Wyobraź sobie tarczę jako stały element — jest z tobą zawsze, doskonalona z każdym rytualem.' },
];

const CRYSTALS = [
  { name: 'Turmalin czarny', use: 'Blokuje negatywną energię i złe intencje', color: '#374151' },
  { name: 'Ametyst', use: 'Oczyszcza aurę i chroni przed stresem', color: '#7C3AED' },
  { name: 'Obsydian', use: 'Silna ochrona, odkrywa ukryte prawdy', color: '#0C0A09' },
  { name: 'Labradoryt', use: 'Tarcza magiczna, wzmacnia intuicję', color: '#0EA5E9' },
];

export const ProtectionRitualScreen = ({ navigation }: any) => {
    const themeName = useAppStore(s => s.themeName);
  const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const currentTheme = getResolvedTheme(themeName, userData?.preferences?.colorScheme);
  const isLight = isLightBg(currentTheme.background);
  const isDark = !isLight;
  const textColor = isLight ? '#150B2E' : '#F0EEFF';
  const subColor = isLight ? 'rgba(21,11,46,0.55)' : 'rgba(240,238,255,0.55)';
  const { t } = useTranslation();
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.09)';

  const [activeType, setActiveType] = useState<string>('energy');
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [activated, setActivated] = useState(false);
  const [protAiInsight, setProtAiInsight] = useState<string>('');
  const [protAiLoading, setProtAiLoading] = useState(false);

  const activeTypeData = PROTECTION_TYPES.find(p => p.id === activeType) ?? PROTECTION_TYPES[0];
  const allDone = doneSteps.length === RITUAL_STEPS.length;

    const fetchProtAi = async () => {
    setProtAiLoading(true);
    HapticsService.impactLight();
    try {
      const prompt = "Rytual ochronny. Typ ochrony: " + activeTypeData.title + ". Wykonane kroki: " + doneSteps.length + "/" + RITUAL_STEPS.length + ". Napisz krotka (3-4 zdania) duchowa interpretacje co ten typ ochrony oznacza dla uzytkownika w tej chwili i jak wzmocnic tarcze.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setProtAiInsight(result);
    } catch (e) {
      setProtAiInsight("Blad pobierania interpretacji.");
    } finally {
      setProtAiLoading(false);
    }
  };
return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      {/* Full-screen background gradient */}
      <LinearGradient
        colors={isDark ? ['#060310', '#0A0518', '#100824'] : ['#F0EEFF', '#EDE8FF', '#E8E0FF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: ACCENT, fontSize: 10, letterSpacing: 2, fontWeight: '700' }}>{t('protectionRitual.rytual_ochronny', 'RYTUAŁ OCHRONNY')}</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>{t('protectionRitual.tarcza_ochronna', 'Tarcza ochronna')}</Text>
        </View>
        <Pressable style={styles.starBtn} hitSlop={12} onPress={() => { HapticsService.impact('light'); if (isFavoriteItem('protection-ritual')) { removeFavoriteItem('protection-ritual'); } else { addFavoriteItem({ id: 'protection-ritual', label: 'Tarcza ochronna', route: 'ProtectionRitual', params: {}, icon: 'Shield', color: ACCENT, addedAt: new Date().toISOString() }); } }}>
          <Star size={18} color={isFavoriteItem('protection-ritual') ? ACCENT : subColor} strokeWidth={1.8} fill={isFavoriteItem('protection-ritual') ? ACCENT : 'none'} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: 96 }}>

        {/* ── Shield SVG (contained, not fullscreen) ── */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={[styles.shieldContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <LinearGradient
              colors={[ACCENT + '16', 'transparent']}
              style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
            />
            <ShieldWidget isDark={isDark} />
            <Text style={{ color: ACCENT, fontSize: 11, letterSpacing: 2, fontWeight: '700', textAlign: 'center', marginTop: -4, marginBottom: 12 }}>
              {t('protectionRitual.pole_energetycz', 'POLE ENERGETYCZNE')}
            </Text>
          </View>
        </Animated.View>

        {/* ── Protection type selector ── */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <Text style={styles.sectionLabel(ACCENT)}>{t('protectionRitual.typ_ochrony', 'TYP OCHRONY')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {PROTECTION_TYPES.map(pt => {
              const active = activeType === pt.id;
                const fetchProtAi = async () => {
    setProtAiLoading(true);
    HapticsService.impactLight();
    try {
      const prompt = "Rytual ochronny. Typ ochrony: " + activeTypeData.title + ". Wykonane kroki: " + doneSteps.length + "/" + RITUAL_STEPS.length + ". Napisz krotka (3-4 zdania) duchowa interpretacje co ten typ ochrony oznacza dla uzytkownika w tej chwili i jak wzmocnic tarcze.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setProtAiInsight(result);
    } catch (e) {
      setProtAiInsight("Blad pobierania interpretacji.");
    } finally {
      setProtAiLoading(false);
    }
  };
return (
                <Pressable
                  key={pt.id}
                  onPress={() => { HapticsService.impactLight(); setActiveType(pt.id); }}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: active ? pt.color + '22' : cardBg,
                      borderColor: active ? pt.color : cardBorder,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>{pt.icon}</Text>
                  <Text style={{ color: active ? pt.color : subColor, fontSize: 12, fontWeight: '700' }}>{pt.title}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Active type detail card */}
          <View style={[styles.typeDetail, { backgroundColor: activeTypeData.color + '12', borderColor: activeTypeData.color + '35' }]}>
            <LinearGradient
              colors={[activeTypeData.color + '18', 'transparent']}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Text style={{ fontSize: 22 }}>{activeTypeData.icon}</Text>
              <Text style={{ color: textColor, fontSize: 15, fontWeight: '700' }}>{activeTypeData.fullTitle}</Text>
            </View>
            <Text style={{ color: subColor, fontSize: 13, lineHeight: 20 }}>{activeTypeData.desc}</Text>
          </View>
        </Animated.View>

        {/* ── Ritual steps ── */}
        <Animated.View entering={FadeInDown.delay(140).duration(400)}>
          <Text style={styles.sectionLabel(ACCENT)}>{t('protectionRitual.kroki_rytualu', 'KROKI RYTUAŁU')}</Text>
          <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 12 }}>
            {t('protectionRitual.5_minutowy_rytual_budowania_tarczy', '5-minutowy rytuał budowania tarczy. Wykonuj rano lub gdy czujesz się narażony/a.')}
          </Text>
          {RITUAL_STEPS.map((step, i) => {
            const done = doneSteps.includes(step.n);
              const fetchProtAi = async () => {
    setProtAiLoading(true);
    HapticsService.impactLight();
    try {
      const prompt = "Rytual ochronny. Typ ochrony: " + activeTypeData.title + ". Wykonane kroki: " + doneSteps.length + "/" + RITUAL_STEPS.length + ". Napisz krotka (3-4 zdania) duchowa interpretacje co ten typ ochrony oznacza dla uzytkownika w tej chwili i jak wzmocnic tarcze.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setProtAiInsight(result);
    } catch (e) {
      setProtAiInsight("Blad pobierania interpretacji.");
    } finally {
      setProtAiLoading(false);
    }
  };
return (
              <Animated.View key={step.n} entering={FadeInDown.delay(180 + i * 55).duration(400)}>
                <Pressable
                  onPress={() => {
                    HapticsService.impactLight();
                    setDoneSteps(p => p.includes(step.n) ? p.filter(x => x !== step.n) : [...p, step.n]);
                  }}
                  style={[
                    styles.stepCard,
                    {
                      backgroundColor: done ? step.color + '14' : cardBg,
                      borderColor: done ? step.color + '55' : cardBorder,
                    },
                  ]}
                >
                  {done && (
                    <LinearGradient
                      colors={[step.color + '18', 'transparent']}
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                  )}
                  <View style={[styles.stepNum, { backgroundColor: done ? step.color : step.color + '28' }]}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{step.n}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <Text style={{ fontSize: 16 }}>{step.icon}</Text>
                      <Text style={{ color: textColor, fontSize: 14, fontWeight: '700' }}>{step.title}</Text>
                    </View>
                    <Text style={{ color: subColor, fontSize: 12, lineHeight: 18 }}>{step.desc}</Text>
                  </View>
                  <CheckCircle2 size={18} color={done ? step.color : cardBorder} />
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* ── Crystal recommendations ── */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text style={styles.sectionLabel(ACCENT)}>{t('protectionRitual.krysztaly_ochronne', 'KRYSZTAŁY OCHRONNE')}</Text>
          <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 12 }}>
            {t('protectionRitual.krysztaly_wzmacniaja_rytualna_tarcz', 'Kryształy wzmacniają rytualną tarczę. Trzymaj je przy sobie lub w przestrzeni.')}
          </Text>
          {CRYSTALS.map((c, i) => (
            <Animated.View key={c.name} entering={FadeInDown.delay(420 + i * 50).duration(400)}>
              <View style={[styles.crystalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.crystalGem, { backgroundColor: c.color + '22', borderColor: c.color + '55' }]}>
                  <Gem size={14} color={c.color === '#0C0A09' && !isLight ? '#888' : c.color} strokeWidth={1.6} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: textColor, fontSize: 14, fontWeight: '700' }}>{c.name}</Text>
                  <Text style={{ color: subColor, fontSize: 12, lineHeight: 18, marginTop: 2 }}>{c.use}</Text>
                </View>
                <View style={[styles.crystalDot, { backgroundColor: c.color }]} />
              </View>
            </Animated.View>
          ))}

          <View style={[styles.crystalTip, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '28' }]}>
            <Shield size={14} color={ACCENT} />
            <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, flex: 1 }}>
              {t('protectionRitual.przed_uzyciem_oczysc_krysztaly_w', 'Przed użyciem oczyść kryształy w świetle księżyca lub solą morską przez noc. Programuj intencją ochrony.')}
            </Text>
          </View>
        </Animated.View>

                <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 16, backgroundColor: "#7C3AED22", borderWidth: 1, borderColor: "#7C3AED", padding: 16 }}>
          <Text style={{ color: "#7C3AED", fontWeight: "700", fontSize: 13, letterSpacing: 1, marginBottom: 8 }}>{t('protectionRitual.ai_interpreta_ochrony', 'AI INTERPRETACJA OCHRONY')}</Text>
          {protAiInsight ? (
            <Text style={{ color: "#E5E7EB", fontSize: 14, lineHeight: 22 }}>{protAiInsight}</Text>
          ) : null}
          <Pressable onPress={fetchProtAi} disabled={protAiLoading} style={{ marginTop: 12, backgroundColor: "#7C3AED", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{protAiLoading ? "Interpretuję..." : "Interpretuj"}</Text>
          </Pressable>
        </View>
<EndOfContentSpacer />
      </ScrollView>

      {/* ── Fixed "Aktywuj" button at bottom ── */}
      <View style={[styles.activateBar, { backgroundColor: currentTheme.background + 'EE' }]}>
        <Pressable
          onPress={() => {
            if (!allDone) {
              Alert.alert(t('protectionRitual.wykonaj_rytual', 'Wykonaj rytuał'), t('protectionRitual.zaznacz_wszystkie_kroki_rytualu_aby', 'Zaznacz wszystkie kroki rytuału aby aktywować tarczę ochronną.'));
              return;
            }
            HapticsService.notify();
            setActivated(true);
            Alert.alert(t('protectionRitual.tarcza_aktywna', 'Tarcza aktywna ✦'), t('protectionRitual.twoja_tarcza_ochronna_jest_aktywna', 'Twoja tarcza ochronna jest aktywna. Jesteś chroniony/a.'));
          }}
          style={[
            styles.activateBtn,
            {
              backgroundColor: allDone ? ACCENT : (isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)'),
              borderColor: allDone ? ACCENT + '88' : cardBorder,
            },
          ]}
        >
          <Shield size={18} color={allDone ? '#fff' : subColor} strokeWidth={1.8} />
          <Text style={{ color: allDone ? '#fff' : subColor, fontSize: 15, fontWeight: '700' }}>
            {activated ? 'Tarcza aktywna ✦' : 'Aktywuj tarczę'}
          </Text>
          {!allDone && (
            <Text style={{ color: subColor, fontSize: 12 }}>({doneSteps.length}/{RITUAL_STEPS.length} kroków)</Text>
          )}
        </Pressable>
      </View>
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
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)', backgroundColor: 'rgba(124,58,237,0.08)',
  },
  shieldContainer: {
    borderRadius: 22, borderWidth: 1, alignItems: 'center',
    paddingTop: 16, marginBottom: 20, overflow: 'hidden',
  },
  sectionLabel: (color: string) => ({
    color, fontSize: 11, fontWeight: '700', letterSpacing: 1.8,
    marginBottom: 10, marginTop: 4,
  }),
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, borderWidth: 1,
  },
  typeDetail: {
    padding: 14, borderRadius: 16, borderWidth: 1, marginTop: 10, marginBottom: 18, overflow: 'hidden',
  },
  stepCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10, overflow: 'hidden',
  },
  stepNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  crystalCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  crystalGem: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  crystalDot: { width: 10, height: 10, borderRadius: 5 },
  crystalTip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 8,
  },
  activateBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: layout.padding.screen, paddingTop: 12, paddingBottom: 24,
  },
  activateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 20, borderWidth: 1,
  },
});
