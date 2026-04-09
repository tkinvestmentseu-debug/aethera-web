// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, Dimensions, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Ellipse, Polygon, Line } from 'react-native-svg';
import { AudioService } from '../core/services/audio.service';
import { useAudioCleanup } from '../core/hooks/useAudioCleanup';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft,
  Star,
  Clock,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Leaf,
  Wind,
  Mountain,
  Flame,
  AlertTriangle,
  MessageCircle,
  PenLine,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#D97706';
const EARTH = '#92400E';
const TIMER_DURATION = 15 * 60; // 15 min meditation

// ── Background ────────────────────────────────────────────────────────────────

const EarthBg = ({ isLight }: { isLight: boolean }) => {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const pulse = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = e.translationX / SW * 10;
      tiltY.value = e.translationY / 300 * 8;
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 1000 });
      tiltY.value = withTiming(0, { duration: 1000 });
    });

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { rotateX: `${-tiltY.value}deg` },
      { rotateY: `${tiltX.value}deg` },
    ],
  }));

  const cx = SW / 2;
  const cy = 240;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={isLight ? ['#FEF3C7', '#FDE68A', '#FEF9EE'] : ['#0A0602', '#120A04', '#1A0E06']}
        style={StyleSheet.absoluteFill}
      />
      <GestureDetector gesture={pan}>
        <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
          <Svg width={SW} height={500} style={{ position: 'absolute', top: 0 }}>
            <Defs>
              <RadialGradient id="earthGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={ACCENT} stopOpacity={isLight ? '0.14' : '0.20'} />
                <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            {/* Core earth glow */}
            <Ellipse cx={cx} cy={cy} rx={180} ry={90} fill="url(#earthGlow)" />
            {/* Geometric root mandalas */}
            {[40, 75, 115, 160, 210].map((r, i) => (
              <Circle
                key={'m' + i}
                cx={cx}
                cy={cy}
                r={r}
                stroke={ACCENT}
                strokeWidth={i === 0 ? 1.2 : 0.7}
                fill="none"
                opacity={isLight ? 0.10 - i * 0.015 : 0.16 - i * 0.025}
                strokeDasharray={i % 2 === 0 ? `${r * 0.2} ${r * 0.3}` : undefined}
              />
            ))}
            {/* Hexagonal earth geometry */}
            {Array.from({ length: 6 }, (_, i) => {
              const angle = (i * 60 - 30) * Math.PI / 180;
              const r = 80;
              const x = cx + r * Math.cos(angle);
              const y = cy + r * Math.sin(angle);
              return (
                <G key={'hex' + i}>
                  <Circle cx={x} cy={y} r={5} fill={ACCENT} opacity={isLight ? 0.15 : 0.20} />
                  <Line x1={cx} y1={cy} x2={x} y2={y} stroke={ACCENT} strokeWidth={0.5} opacity={isLight ? 0.12 : 0.18} />
                </G>
              );
            })}
            {/* Root-like paths */}
            {[[-1, 1], [1, 1], [0, 1.2], [-0.7, 0.8], [0.7, 0.8]].map(([dx, dy], i) => (
              <Path
                key={'root' + i}
                d={`M${cx} ${cy + 30} Q${cx + dx * 40} ${cy + dy * 60} ${cx + dx * 70} ${cy + dy * 100}`}
                stroke={ACCENT}
                strokeWidth={1.2 - i * 0.1}
                fill="none"
                opacity={isLight ? 0.12 : 0.18}
                strokeLinecap="round"
              />
            ))}
            {/* Floating dust particles */}
            {Array.from({ length: 22 }, (_, i) => (
              <Circle
                key={'dp' + i}
                cx={(i * 181 + 25) % SW}
                cy={(i * 79 + 45) % 490}
                r={i % 4 === 0 ? 1.6 : 0.7}
                fill={ACCENT}
                opacity={isLight ? 0.10 : 0.15}
              />
            ))}
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ── Constants ─────────────────────────────────────────────────────────────────

const PREP_STEPS = [
  { id: 1, text: 'Wyraź intencję — czego szukasz w tej medycynie?' },
  { id: 2, text: 'Przygotuj fajkę kuripe (osobistą) lub tepi (od szamana)' },
  { id: 3, text: 'Stwórz ciszę — wyłącz telefon, ogranicz bodźce' },
  { id: 4, text: 'Usiądź lub kucnij wygodnie z wyprostowanym kręgosłupem' },
  { id: 5, text: 'Oddycha głęboko przez nos — przygotuj drogi oddechowe' },
];

const RITUAL_STEPS = [
  { num: 1, title: 'Przygotuj fajkę kuripe lub tepi', desc: 'Kuripe używasz sam, tepi wymaga asysty szamana lub partnera ceremonialnego.' },
  { num: 2, title: 'Ustal intencję', desc: 'Trzymaj intencję w umyśle lub wypowiedz ją cicho przed przyjęciem medycyny.' },
  { num: 3, title: 'Przyjmij medycynę', desc: 'Jeden rozdmuch w każde nozdrze. Wdech z dołu — powoli, nie walcz z impulsem.' },
  { num: 4, title: 'Oddychaj głęboko', desc: 'Przez usta jeśli to konieczne. Mocz, łzy lub dreszcze to normalna odpowiedź ciała.' },
  { num: 5, title: 'Medytuj w ciszy', desc: '15 minut siedzenia lub leżenia. Obserwuj co pojawia się bez interpretacji.' },
];

const BENEFITS = [
  { icon: Wind, title: 'Oczyszczenie energetyczne', desc: 'Rapé oczyszcza pole energetyczne z nagromadzonych napięć i ciężkich emocji.', color: '#F59E0B' },
  { icon: Mountain, title: 'Uziemienie', desc: 'Silne połączenie z Ziemią i Korzeniem — stabilizuje rozprozone myśli.', color: '#D97706' },
  { icon: Leaf, title: 'Czyszczenie sinusów', desc: 'Fizyczne oczyszczenie zatok i kanałów oddechowych z toksyn i wirusów.', color: '#A78BFA' },
  { icon: Flame, title: 'Połączenie z Ziemią', desc: 'Wzmacnia więź z duchem Ziemi i rdzenną mądrością przodków.', color: '#78716C' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export const RapeScreen = ({ navigation }: any) => {
    const themeName = useAppStore(s => s.themeName);
  const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
  const isDark = !isLight;
  const textColor = isLight ? '#3B1A00' : '#FDE68A';
  const subColor = isLight ? 'rgba(59,26,0,0.55)' : 'rgba(253,230,138,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.07)';
  const { t } = useTranslation();

  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [remaining, setRemaining] = useState(TIMER_DURATION);
  const [timerDone, setTimerDone] = useState(false);
  const [integrationNote, setIntegrationNote] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const intervalRef = useRef<any>(null);

  useAudioCleanup();

  useEffect(() => () => {
    clearInterval(intervalRef.current);
    AudioService.pauseAmbientSound().catch(() => {});
  }, []);

  const toggleCheck = (id: number) => {
    HapticsService.impact('light');
    setCheckedSteps(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const toggleTimer = () => {
    HapticsService.impact('light');
    if (timerRunning) {
      clearInterval(intervalRef.current);
      setTimerRunning(false);
      AudioService.pauseAmbientSound().catch(() => {});
    } else {
      if (remaining === 0) {
        setRemaining(TIMER_DURATION);
        setTimerDone(false);
      }
      setTimerRunning(true);
      AudioService.playAmbientForSession('forest').catch(() => {});
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setTimerRunning(false);
            setTimerDone(true);
            HapticsService.notify();
            AudioService.pauseAmbientSound().catch(() => {});
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setTimerRunning(false);
    setRemaining(TIMER_DURATION);
    setTimerDone(false);
    AudioService.pauseAmbientSound().catch(() => {});
  };

  const callOracle = async () => {
    HapticsService.impact('light');
    setAiLoading(true);
    setAiResponse('');
    try {
      const noteCtx = integrationNote ? ` Notatka integracyjna: "${integrationNote}".` : '';
      const messages = [
        {
          role: 'user' as const,
          content: `Przeprowadź mnie przez integrację ceremonii Rapé/Hapé.${noteCtx} Daj duchowe wsparcie, pytania do refleksji i mądrość szamańską. Odpowiedz w języku użytkownika, 3-4 zdania.`,
        },
      ];
      const resp = await AiService.chatWithOracle(messages);
      setAiResponse(resp);
    } catch {
      setAiResponse('Siądź z tym co się pojawiło. Ziemia przyjmuje to, co ciało wydala. Jesteś bezpieczny.');
    } finally {
      setAiLoading(false);
    }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const progress = 1 - remaining / TIMER_DURATION;

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <EarthBg isLight={isLight} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: subColor }]}>{t('rape.swiat_rytualow', 'ŚWIAT RYTUAŁÓW')}</Text>
          <Text style={[styles.title, { color: textColor }]}>{t('rape.rap_hap', 'Rapé / Hapé')}</Text>
        </View>
        <MusicToggleButton color={ACCENT} size={18} />
        <Pressable style={styles.iconBtn}>
          <Star size={18} color={ACCENT} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: 32 }}
      >
        {/* Description */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)}>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: ACCENT }]}>{t('rape.co_to_jest_rap_hap', 'Co to jest Rapé / Hapé?')}</Text>
            <Text style={[styles.bodyText, { color: subColor }]}>
              Rapé (wymawiane "ha-pé") to święta tabaka ceremonialna sporządzana przez rdzenne
              plemiona Amazonii z tytoniu Nicotiana rustica i roślin pomocniczych — ashes z
              kory, ziół leczniczych i świętych roślin. Stosowana przez szamanów Huni Kuin,
              Yawanapi i Katukina jako narzędzie oczyszczenia energetycznego, uziemienia,
              skupienia i połączenia z duchem Ziemi. Przyjmowana przez nozdrza przy pomocy
              fajki kuripe (osobistej) lub tepi (przez inną osobę).
            </Text>
          </View>
        </Animated.View>

        {/* Preparation checklist */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <Text style={[styles.sectionHeader, { color: textColor }]}>{t('rape.przygotowa_ceremonial', 'Przygotowanie ceremonialne')}</Text>
          {PREP_STEPS.map(step => (
            <Pressable
              key={step.id}
              onPress={() => toggleCheck(step.id)}
              style={[styles.checkRow, { borderColor: cardBorder }]}
            >
              <View style={[
                styles.checkBox,
                {
                  backgroundColor: checkedSteps.includes(step.id) ? ACCENT + '22' : 'transparent',
                  borderColor: checkedSteps.includes(step.id) ? ACCENT : cardBorder,
                },
              ]}>
                {checkedSteps.includes(step.id) && <CheckCircle2 size={14} color={ACCENT} />}
              </View>
              <Text style={[styles.checkText, {
                color: checkedSteps.includes(step.id) ? ACCENT : textColor,
                textDecorationLine: checkedSteps.includes(step.id) ? 'line-through' : 'none',
              }]}>
                {step.text}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Ritual Steps */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          <Text style={[styles.sectionHeader, { color: textColor }]}>{t('rape.kroki_ceremonii', 'Kroki ceremonii')}</Text>
          {RITUAL_STEPS.map(step => (
            <Animated.View
              key={step.num}
              entering={FadeInDown.delay(160 + step.num * 60).duration(360)}
              style={[styles.ritualCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <View style={[styles.numBadge, { backgroundColor: ACCENT + '22' }]}>
                <Text style={[styles.numText, { color: ACCENT }]}>{step.num}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ritualTitle, { color: textColor }]}>{step.title}</Text>
                <Text style={[styles.ritualDesc, { color: subColor }]}>{step.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Benefits */}
        <Animated.View entering={FadeInDown.delay(320).duration(400)}>
          <Text style={[styles.sectionHeader, { color: textColor }]}>{t('rape.korzysci_ceremonii', 'Korzyści ceremonii')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {BENEFITS.map((b, i) => (
              <Animated.View
                key={b.title}
                entering={FadeInDown.delay(320 + i * 60).duration(360)}
                style={[styles.benefitCard, {
                  backgroundColor: cardBg,
                  borderColor: b.color + '30',
                  width: (SW - layout.padding.screen * 2 - 10) / 2,
                }]}
              >
                <b.icon size={20} color={b.color} strokeWidth={1.5} />
                <Text style={[styles.benefitTitle, { color: textColor }]}>{b.title}</Text>
                <Text style={[styles.benefitDesc, { color: subColor }]}>{b.desc}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Meditation Timer */}
        <Animated.View entering={FadeInDown.delay(440).duration(400)}>
          <Text style={[styles.sectionHeader, { color: textColor }]}>{t('rape.medytacja_integracyj', 'Medytacja integracyjna')}</Text>
          <View style={[styles.timerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.progressTrack, { backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)' }]}>
              <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: ACCENT }]} />
            </View>
            <Text style={[styles.timerDisplay, { color: timerDone ? ACCENT : textColor }]}>
              {timerDone ? '✓ Medytacja ukończona' : fmt(remaining)}
            </Text>
            <Text style={[styles.timerSub, { color: subColor }]}>{t('rape.15_minut_cichej_medytacji', '15 minut cichej medytacji')}</Text>
            <View style={styles.timerRow}>
              <Pressable onPress={toggleTimer} style={[styles.timerBtn, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '44' }]}>
                {timerRunning
                  ? <Pause size={20} color={ACCENT} />
                  : <Play size={20} color={ACCENT} />}
                <Text style={[styles.timerBtnTxt, { color: ACCENT }]}>
                  {timerRunning ? 'Pauza' : timerDone ? 'Jeszcze raz' : 'Rozpocznij'}
                </Text>
              </Pressable>
              <Pressable onPress={resetTimer} style={[styles.timerBtnSm, { borderColor: cardBorder }]}>
                <RotateCcw size={16} color={subColor} />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Integration notes */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Text style={[styles.sectionHeader, { color: textColor }]}>{t('rape.notatki_integracyj', 'Notatki integracyjne')}</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <PenLine size={14} color={subColor} />
              <Text style={[{ fontSize: 12, color: subColor }]}>{t('rape.co_pojawilo_sie_w_medytacji', 'Co pojawiło się w medytacji?')}</Text>
            </View>
            <TextInput
              value={integrationNote}
              onChangeText={setIntegrationNote}
              placeholder={t('rape.zapisz_obserwacje_wizje_odczucia', 'Zapisz obserwacje, wizje, odczucia...')}
              placeholderTextColor={subColor}
              multiline
              style={[styles.noteInput, {
                color: textColor,
                borderColor: cardBorder,
                backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.03)',
              }]}
            />
          </View>
        </Animated.View>

        {/* AI Oracle */}
        <Animated.View entering={FadeInDown.delay(560).duration(400)}>
          <Pressable
            onPress={callOracle}
            style={[styles.oracleBtn, { borderColor: ACCENT + '40', backgroundColor: ACCENT + '10' }]}
          >
            <MessageCircle size={18} color={ACCENT} />
            <Text style={[styles.oracleBtnTxt, { color: ACCENT }]}>
              {aiLoading ? 'Wyrocznia przemawia...' : 'Wsparcie Oracle po ceremonii'}
            </Text>
          </Pressable>
          {!!aiResponse && (
            <View style={[styles.aiCard, { backgroundColor: cardBg, borderColor: ACCENT + '22' }]}>
              <Text style={[styles.bodyText, { color: textColor }]}>{aiResponse}</Text>
            </View>
          )}
        </Animated.View>

        {/* Disclaimer */}
        <Animated.View entering={FadeInDown.delay(620).duration(400)}>
          <View style={[styles.disclaimerCard, { backgroundColor: isLight ? 'rgba(234,179,8,0.06)' : 'rgba(234,179,8,0.08)', borderColor: 'rgba(234,179,8,0.25)' }]}>
            <AlertTriangle size={16} color="#EAB308" />
            <Text style={[styles.disclaimerText, { color: isLight ? '#78350F' : '#FDE68A' }]}>
              Rapé jest medycyną ceremonialną. Stosuj wyłącznie pod opieką doświadczonego
              szamana. Nie zalecane dla osób z problemami sercowo-naczyniowymi, ciężarnych
              i dzieci. Szanuj roślinę, jej tradycję i rdzenną mądrość z której pochodzi.
            </Text>
          </View>
        </Animated.View>

        <EndOfContentSpacer />
      </ScrollView>
        </SafeAreaView>
</View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionHeader: {
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  ritualCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  numBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    fontSize: 13,
    fontWeight: '800',
  },
  ritualTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  ritualDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  benefitCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  benefitTitle: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  benefitDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  timerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  timerDisplay: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 2,
  },
  timerSub: {
    fontSize: 12,
  },
  timerRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  timerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  timerBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
  },
  timerBtnSm: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  oracleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 20,
  },
  oracleBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
  },
  aiCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 10,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
