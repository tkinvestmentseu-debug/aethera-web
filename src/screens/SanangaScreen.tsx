// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, Dimensions, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Ellipse, Line } from 'react-native-svg';
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
  Eye,
  Clock,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Leaf,
  Wind,
  Sparkles,
  AlertTriangle,
  MessageCircle,
  Music2,
  VolumeX,
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
const ACCENT = '#22C55E';
const DARK_GREEN = '#15803D';
const TIMER_DURATION = 20 * 60; // 20 min integration

// ── Background ────────────────────────────────────────────────────────────────

const ForestBg = ({ isLight }: { isLight: boolean }) => {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const sway = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = e.translationX / SW * 12;
      tiltY.value = e.translationY / 300 * 10;
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-6, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
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

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={isLight ? ['#E8F5E9', '#C8E6C9', '#DCEDC8'] : ['#020C06', '#04140A', '#061A0E']}
        style={StyleSheet.absoluteFill}
      />
      <GestureDetector gesture={pan}>
        <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
          <Svg width={SW} height={500} style={{ position: 'absolute', top: 0 }}>
            <Defs>
              <RadialGradient id="forestGlow" cx="50%" cy="40%" r="50%">
                <Stop offset="0%" stopColor={ACCENT} stopOpacity={isLight ? '0.12' : '0.18'} />
                <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            {/* Canopy glow */}
            <Ellipse cx={cx} cy={180} rx={220} ry={100} fill="url(#forestGlow)" />
            {/* Tree trunks */}
            {[[-90, 0.9], [-50, 0.7], [0, 1], [50, 0.75], [90, 0.85]].map(([dx, scale], i) => (
              <G key={'trunk' + i}>
                <Path
                  d={`M${cx + dx} 500 L${cx + dx - 8 * scale} 260 L${cx + dx} 240 L${cx + dx + 8 * scale} 260 Z`}
                  fill={DARK_GREEN}
                  opacity={isLight ? 0.15 : 0.25}
                />
                {/* Leaves */}
                {[-30, -18, -6, 6, 18, 30].map((ly, j) => (
                  <Ellipse
                    key={'leaf' + j}
                    cx={cx + dx + (j % 2 === 0 ? -12 : 12)}
                    cy={240 - j * 18}
                    rx={20 * scale}
                    ry={10 * scale}
                    fill={ACCENT}
                    opacity={isLight ? 0.10 : 0.13}
                  />
                ))}
              </G>
            ))}
            {/* Botanical circles */}
            {[60, 100, 150, 210].map((r, i) => (
              <Circle
                key={'bc' + i}
                cx={cx}
                cy={300}
                r={r}
                stroke={ACCENT}
                strokeWidth={0.6}
                fill="none"
                opacity={isLight ? 0.08 - i * 0.015 : 0.14 - i * 0.025}
                strokeDasharray={`${r * 0.3} ${r * 0.4}`}
              />
            ))}
            {/* Floating particles */}
            {Array.from({ length: 24 }, (_, i) => (
              <Circle
                key={'p' + i}
                cx={(i * 167 + 30) % SW}
                cy={(i * 83 + 40) % 480}
                r={i % 5 === 0 ? 1.8 : 0.8}
                fill={ACCENT}
                opacity={isLight ? 0.12 : 0.18}
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
  { id: 1, text: 'Wyraź intencję — co chcesz oczyścić lub zobaczyć?' },
  { id: 2, text: 'Stwórz świętą przestrzeń — świece, kadzidła, ołtarz' },
  { id: 3, text: 'Przygotuj wygodne miejsce do leżenia' },
  { id: 4, text: 'Oczyść przestrzeń kadzidłem — palo santo lub szałwia' },
  { id: 5, text: 'Wejdź w stan medytacyjny, oddychaj świadomie' },
];

const RITUAL_STEPS = [
  { num: 1, title: 'Połóż się wygodnie', desc: 'Znajdź bezpieczną, poziomą powierzchnię. Rozluźnij ciało, zamknij oczy.' },
  { num: 2, title: 'Reguluj oddech', desc: 'Głębokie, spokojne oddechy przez nos. Pozwól ciału wejść w stan receptywności.' },
  { num: 3, title: 'Nałóż krople', desc: 'Pomocnik lub szaman nakłada jedną kroplę do każdego oka. Trzymaj oczy otwarte.' },
  { num: 4, title: 'Zostań z dyskomfortem', desc: 'Pieczenie jest normalną częścią oczyszczenia. Oddychaj, nie walcz. Ono mija.' },
  { num: 5, title: 'Czas integracji 20 min', desc: 'Leż spokojnie. Obserwuj wizje, odczucia i emocje bez oceniania. Niech pojawia się.' },
];

const BENEFITS = [
  { icon: Eye, title: 'Oczyszczenie wzroku duchowego', desc: 'Sananga oczyszcza "panema" — duchowy brud zasłaniający jasnowidztwo i intuicję.', color: '#34D399' },
  { icon: Sparkles, title: 'Usunięcie ciemności i panema', desc: 'Tradycja Yawanapi — usuwa energetyczne blokady z pola widzenia i percepcji.', color: '#86EFAC' },
  { icon: Wind, title: 'Wzmocnienie intencji', desc: 'Ceremonia z Sanangą amplifikuje siłę intencji ustawionej przed rytuałem.', color: '#4ADE80' },
  { icon: Leaf, title: 'Połączenie z naturą', desc: 'Roślinny nauczyciel przywraca więź z inteligencją i duchem dżungli.', color: '#22D3EE' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export const SanangaScreen = ({ navigation }: any) => {
    const themeName = useAppStore(s => s.themeName);
  const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
  const isDark = !isLight;
  const textColor = isLight ? '#052E16' : '#D1FAE5';
  const subColor = isLight ? 'rgba(5,46,22,0.55)' : 'rgba(209,250,229,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.07)';
  const { t } = useTranslation();

  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [remaining, setRemaining] = useState(TIMER_DURATION);
  const [timerDone, setTimerDone] = useState(false);
  const [soundPlaying, setSoundPlaying] = useState(false);
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
    } else {
      if (remaining === 0) {
        setRemaining(TIMER_DURATION);
        setTimerDone(false);
      }
      setTimerRunning(true);
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setTimerRunning(false);
            setTimerDone(true);
            HapticsService.notify();
            AudioService.pauseAmbientSound().catch(() => {});
            setSoundPlaying(false);
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
  };

  const toggleSound = () => {
    HapticsService.impact('light');
    if (soundPlaying) {
      AudioService.pauseAmbientSound().catch(() => {});
      setSoundPlaying(false);
    } else {
      AudioService.playAmbientForSession('forest').catch(() => {});
      setSoundPlaying(true);
    }
  };

  const callOracle = async () => {
    HapticsService.impact('light');
    setAiLoading(true);
    setAiResponse('');
    try {
      const messages = [
        {
          role: 'user' as const,
          content: 'Przeprowadź mnie przez integrację ceremonii Sananga. Daj mi duchowe wsparcie, pytania refleksyjne i mądrość amazońską. Odpowiedz w języku użytkownika, 3-4 zdania.',
        },
      ];
      const resp = await AiService.chatWithOracle(messages);
      setAiResponse(resp);
    } catch {
      setAiResponse('Oddychaj. Każda ceremonialna łza oczyszcza to, co ukryte. Integruj w spokoju.');
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

      <ForestBg isLight={isLight} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: subColor }]}>{t('sananga.swiat_rytualow', 'ŚWIAT RYTUAŁÓW')}</Text>
          <Text style={[styles.title, { color: textColor }]}>{t('sananga.sananga', 'Sananga')}</Text>
        </View>
        <MusicToggleButton color={ACCENT} size={18} />
        <Pressable onPress={toggleSound} style={styles.iconBtn}>
          {soundPlaying
            ? <Music2 size={18} color={ACCENT} />
            : <VolumeX size={18} color={subColor} />}
        </Pressable>
        <Pressable style={styles.iconBtn}>
          <Star size={18} color={ACCENT} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: 32 }}
      >
        {/* What is Sananga */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)}>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: ACCENT }]}>{t('sananga.co_to_jest_sananga', 'Co to jest Sananga?')}</Text>
            <Text style={[styles.bodyText, { color: subColor }]}>
              Sananga to święte krople oczne sporządzane z kory i korzenia amazońskiego krzewu
              Tabernaemontana undulata. Używana przez rdzenne plemiona Yawanapi i Matsés jako
              narzędzie oczyszczenia duchowego wzroku, usunięcia "panema" — energetycznego brudu
              który blokuje percepcję i intencję — oraz wzmocnienia ostrości myślenia i łowieckiej
              intuicji. Ceremonia towarzyszy często większym praktykom szamańskim.
            </Text>
          </View>
        </Animated.View>

        {/* Preparation checklist */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <Text style={[styles.sectionHeader, { color: textColor }]}>{t('sananga.przygotowa_ceremonial', 'Przygotowanie ceremonialne')}</Text>
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
          <Text style={[styles.sectionHeader, { color: textColor }]}>{t('sananga.kroki_rytualu', 'Kroki rytuału')}</Text>
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

        {/* Eye-drop procedure */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)}>
          <Text style={[styles.sectionHeader, { color: textColor }]}>{t('sananga.procedura_zakrapiani_oczu', 'Procedura zakrapiania oczu')}</Text>
          <View style={[styles.card, { backgroundColor: isLight ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.08)', borderColor: ACCENT + '30' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Eye size={18} color={ACCENT} />
              <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>{t('sananga.krok_po_kroku', 'KROK PO KROKU')}</Text>
            </View>
            {[
              { num: '1', title: 'Umyj dłonie', desc: 'Dokładnie umyj ręce mydłem przed kontaktem z oczami lub buteleczką Sanangii. Higiena jest kluczowa.' },
              { num: '2', title: 'Przyjmij pozycję', desc: 'Połóż się na plecach lub odchyl głowę do tyłu. Patrz w górę, delikatnie odciągnij dolną powiekę kciukiem lub palcem wskazującym.' },
              { num: '3', title: 'Nałóż jedną kroplę', desc: 'Pomocnik trzyma pipetę lub buteleczkę ok. 2–3 cm nad okiem. Wyciśnij JEDNĄ kroplę do wewnętrznego kącika oka lub na odsłoniętą spojówkę. Nie dotykaj gałki ocznej końcówką.' },
              { num: '4', title: 'Zamknij oko', desc: 'Zamknij oko i delikatnie naciśnij kącik przy nosie (kanalik łzowy) przez 30 sekund, aby zmniejszyć wchłanianie ogólnoustrojowe.' },
              { num: '5', title: 'Powtórz dla drugiego oka', desc: 'Nałóż kroplę do drugiego oka. Intensywność pieczenia jest normalna — to oczyszczenie. Oddychaj głęboko, nie trzyj oczu.' },
              { num: '6', title: 'Łzy i wydzielina', desc: 'Oczy będą łzawić i może pojawić się wydzielina z nosa — to naturalny proces oczyszczenia. Pozwól temu przepłynąć bez oporu.' },
            ].map((item) => (
              <View key={item.num} style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '800' }}>{item.num}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: textColor, fontSize: 13.5, fontWeight: '700', marginBottom: 2 }}>{item.title}</Text>
                  <Text style={{ color: subColor, fontSize: 12.5, lineHeight: 18 }}>{item.desc}</Text>
                </View>
              </View>
            ))}
            <View style={{ borderTopWidth: 1, borderColor: ACCENT + '22', marginTop: 4, paddingTop: 12, flexDirection: 'row', gap: 8 }}>
              <AlertTriangle size={15} color="#FBBF24" />
              <Text style={{ color: isLight ? '#78350F' : '#FDE68A', fontSize: 12, flex: 1, lineHeight: 17 }}>
                {t('sananga.sananga_nie_jest_produktem_medyczny', 'Sananga nie jest produktem medycznym. Stosuj wyłącznie w ramach ceremonii duchowej pod nadzorem doświadczonego szamana lub przewodnika. Nie stosuj przy aktywnych infekcjach oczu.')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Benefits */}
        <Animated.View entering={FadeInDown.delay(320).duration(400)}>
          <Text style={[styles.sectionHeader, { color: textColor }]}>{t('sananga.korzysci_duchowe', 'Korzyści duchowe')}</Text>
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

        {/* Integration Timer */}
        <Animated.View entering={FadeInDown.delay(440).duration(400)}>
          <Text style={[styles.sectionHeader, { color: textColor }]}>{t('sananga.czas_integracji', 'Czas integracji')}</Text>
          <View style={[styles.timerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {/* Progress bar */}
            <View style={[styles.progressTrack, { backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)' }]}>
              <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: ACCENT }]} />
            </View>
            <Text style={[styles.timerDisplay, { color: timerDone ? ACCENT : textColor }]}>
              {timerDone ? '✓ Integracja ukończona' : fmt(remaining)}
            </Text>
            <Text style={[styles.timerSub, { color: subColor }]}>{t('sananga.20_minut_spokojnej_integracji', '20 minut spokojnej integracji')}</Text>
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

        {/* AI Oracle */}
        <Animated.View entering={FadeInDown.delay(520).duration(400)}>
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
        <Animated.View entering={FadeInDown.delay(580).duration(400)}>
          <View style={[styles.disclaimerCard, { backgroundColor: isLight ? 'rgba(234,179,8,0.06)' : 'rgba(234,179,8,0.08)', borderColor: 'rgba(234,179,8,0.25)' }]}>
            <AlertTriangle size={16} color="#EAB308" />
            <Text style={[styles.disclaimerText, { color: isLight ? '#78350F' : '#FDE68A' }]}>
              Sananga jest medycyną ceremonialną. Stosuj wyłącznie pod opieką doświadczonego
              szamana lub curandero. Nie stosuj bez przygotowania, intencji i bezpiecznej
              przestrzeni. Szanuj tę roślinę i jej tradycję.
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
