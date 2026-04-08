// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Brain, HeartPulse, Pause, Play, Sparkles, TimerReset, Waves, Wind, Shield, ArrowDownCircle, ArrowRight, Headphones, Moon, Zap, ChevronDown, ChevronUp, Star, Calendar, Music, CheckCircle2, Circle, Trash2 } from 'lucide-react-native';
import { Typography } from '../components/Typography';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { useAudioCleanup } from '../core/hooks/useAudioCleanup';
import { AudioService, type AmbientSoundscape } from '../core/services/audio.service';
import { HapticsService } from '../core/services/haptics.service';
import { useNavigation } from '@react-navigation/native';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { getLocaleCode } from '../core/utils/localeFormat';
import { useTheme } from '../core/hooks/useTheme';

interface BreathPattern {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  deeperDescription: string;
  inhale: number;
  hold: number;
  exhale: number;
  holdAfterExhale?: number;
  cyclesTarget: number;
  color: string;
  ambient: AmbientSoundscape;
  icon: React.ComponentType<any>;
  bestFor: string[];
  notes: string[];
}

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'rest';

const PATTERNS: BreathPattern[] = [
  { id: 'wim-hof', title: 'Wim Hof', eyebrow: '⚡ ENERGIA I ROZSZERZENIE', description: 'Dynamiczna praca oddechowa dla pobudzenia, witalności i rozszerzenia pojemności oddechu.', deeperDescription: 'Ta technika działa bardziej pobudzająco i daje wyraźne poczucie otwarcia w ciele. Dobrze sprawdza się rano, przed treningiem albo gdy czujesz spadek energii i chcesz odzyskać impuls.', inhale: 2, hold: 1, exhale: 2, holdAfterExhale: 1, cyclesTarget: 20, color: '#7FD8FF', ambient: 'cave', icon: Sparkles, bestFor: ['poranny reset', 'energia i mobilizacja', 'rozszerzenie oddechu'], notes: ['Nie wykonuj na pełnym przeciążeniu lub przed snem.', 'Jeśli pojawi się zawroty głowy, skróć sesję.', 'Najlepiej działa na siedząco lub półleżąco.'] },
  { id: 'box', title: 'Oddech pudełkowy', eyebrow: '🧊 RYTM, KONCENTRACJA, SPRAWCZOŚĆ', description: 'Stabilny wzór dla układu nerwowego, koncentracji i utrzymania wewnętrznego balansu.', deeperDescription: 'Technika znana z pracy z focussem i regulacją napięcia w sytuacjach zadaniowych. Daje poczucie porządku, rytmu i większej kontroli nad przeciążeniem.', inhale: 4, hold: 4, exhale: 4, holdAfterExhale: 4, cyclesTarget: 8, color: '#A78BFA', ambient: 'forest', icon: Brain, bestFor: ['praca i nauka', 'stres przed decyzją', 'uspokojenie chaosu'], notes: ['Idealna przed rozmową, spotkaniem lub blokiem pracy.', 'Jeśli zatrzymania są zbyt długie, skróć je o 1 sekundę.', 'Liczy się równość faz, nie szybkość.'] },
  { id: '478', title: '4-7-8', eyebrow: '🌙 WYHAMOWANIE I SPOKÓJ', description: 'Praktyka do redukcji pobudzenia, napięcia i wejścia w wieczorny rytm wyciszenia.', deeperDescription: 'Jedna z najlepszych technik na wieczór i momenty lękowego pobudzenia. Długi wydech obniża alarm w ciele i daje czytelny sygnał powrotu do bezpieczeństwa.', inhale: 4, hold: 7, exhale: 8, cyclesTarget: 6, color: '#F6A3B7', ambient: 'rain', icon: HeartPulse, bestFor: ['sen i bezsenność', 'wyciszenie po stresie', 'regulacja pobudzenia'], notes: ['Nie forsuj pełnych długości na początku.', 'Najważniejszy jest miękki, długi wydech.', 'Bardzo dobrze działa przy zgaszonym świetle i spokojnym tle.'] },
  { id: 'coherent', title: 'Oddech koherentny', eyebrow: '💚 SERCE, RÓWNOWAGA, REGULACJA', description: 'Miękki rytm 5-5 dla równowagi emocjonalnej i łagodnej regulacji organizmu.', deeperDescription: 'To technika najbardziej uniwersalna. Nie pobudza nadmiernie i nie usypia zbyt mocno, tylko przywraca spójność między ciałem, rytmem serca i oddechem.', inhale: 5, hold: 0, exhale: 5, cyclesTarget: 10, color: '#67D1B2', ambient: 'waves', icon: Waves, bestFor: ['codzienna regulacja', 'powrót do ciała', 'praca z emocjami'], notes: ['Dobra także w ciągu dnia, między zadaniami.', 'Brak zatrzymań ułatwia wejście osobom wrażliwym na napięcie.', 'Daje najlepszy efekt przy regularnym powtarzaniu.'] },
  { id: 'custom-soft', title: 'Custom soft reset', eyebrow: '🌿 ELASTYCZNY WZÓR POWROTU DO SPOKOJU', description: 'Autorski układ 6-2-6-2 dla miękkiego powrotu do centrum i łagodnej kontroli rytmu.', deeperDescription: 'To wariant pośredni między koherencją a głębszym resetem. Daje więcej struktury niż prosty oddech koherentny, ale nie przytłacza tak mocno jak dłuższe zatrzymania.', inhale: 6, hold: 2, exhale: 6, holdAfterExhale: 2, cyclesTarget: 7, color: '#F2BE5C', ambient: 'wind', icon: Wind, bestFor: ['popołudniowy reset', 'odzyskanie centrum', 'łagodne domknięcie napięcia'], notes: ['Dobrze działa po przeciążającym kontakcie.', 'Możesz używać go jako pomostu przed medytacją.', 'Jeśli ciało prosi o wolniej, wydłuż pauzy tylko odrobinę.'] },
  { id: 'nadi-shodhana', title: 'Nadi Shodhana', eyebrow: '🌀 RÓWNOWAGA I KLAROWNOŚĆ UMYSŁU', description: 'Pranajama naprzemiennych nozdrzy przywracająca równowagę między lewą i prawą półkulą.', deeperDescription: 'Jedna z najpiękniejszych technik jogi oddechowej. Nadi Shodhana czyści kanały energetyczne (nadi) i harmonizuje ciało subtelne. Szczególnie skuteczna przed medytacją lub decyzjami wymagającymi jasności.', inhale: 4, hold: 4, exhale: 4, holdAfterExhale: 0, cyclesTarget: 9, color: '#C084FC', ambient: 'forest', icon: Shield, bestFor: ['przed medytacją', 'balans lewej i prawej półkuli', 'klarowność i spokój'], notes: ['Wyobraź sobie naprzemienne nozdrza — lewa strona, prawa strona.', 'Każdy cykl: wdech lewą, zatrzymanie, wydech prawą, wdech prawą, zatrzymanie, wydech lewą.', 'Pracuj powoli — ta technika wynagradza cierpliwość.'] },
];

const PHASE_LABELS: Record<BreathPhase, string> = { idle: 'Przygotowanie', inhale: 'Wdech', hold: 'Zatrzymaj', exhale: 'Wydech', rest: 'Pauza' };
const formatBreath = (value: number) => String(Math.max(value, 0)).padStart(2, '0');

const AMBIENT_LABELS: Record<string, string> = {
  cave: 'Jaskinia i rozszerzenie',
  forest: 'Las i fokus',
  rain: 'Deszcz i wyhamowanie',
  waves: 'Fale i koherencja',
  wind: 'Wiatr i miękki reset',
};

const AMBIENT_OPTIONS: { id: AmbientSoundscape; label: string; emoji: string; color: string }[] = [
  { id: 'rain', label: 'Deszcz', emoji: '🌧️', color: '#7FD8FF' },
  { id: 'waves', label: 'Fale', emoji: '🌊', color: '#67D1B2' },
  { id: 'forest', label: 'Las', emoji: '🌲', color: '#34D399' },
  { id: 'wind', label: 'Wiatr', emoji: '🍃', color: '#F2BE5C' },
  { id: 'cave', label: 'Jaskinia', emoji: '🔮', color: '#A78BFA' },
];

interface TechniqueDetail {
  steps: string[];
  science: string;
  contra: string;
}

const TECHNIQUE_DETAILS: Record<string, TechniqueDetail> = {
  'wim-hof': {
    steps: [
      'Usiądź wygodnie lub połóż się. Wykonaj 30 szybkich, głębokich wdechów przez nos lub usta, każdy wydech swobodny.',
      'Po ostatnim wdechu zatrzymaj oddech na tyle długo, ile czujesz komfort — bez forsowania.',
      'Weź jeden pełny wdech i wstrzymaj go przez 15 sekund, czując rozszerzenie klatki piersiowej.',
      'Powtórz 3 rundy. Między rundami oddychaj normalnie przez 1-2 minuty.',
    ],
    science: 'Hiperwentylacja obniża stężenie CO₂ we krwi, co wydłuża tolerancję na bezdech i prowadzi do mierzalnego wzrostu adrenaliny i pH krwi.',
    contra: 'Nie wykonuj w wodzie, za kierownicą, w ciąży ani przy historii epilepsji lub chorób sercowo-naczyniowych.',
  },
  'box': {
    steps: [
      'Usiądź prosto, stopy płasko na podłodze. Wypuść całe powietrze przed pierwszym cyklem.',
      'Wdech przez nos licząc do 4 — równomierny, spokojny.',
      'Zatrzymaj oddech na 4 sekundy — ramiona luźne, bez napinania.',
      'Wydech przez usta 4 sekundy, potem pauza 4 sekundy. Powtórz 6-8 razy.',
    ],
    science: 'Równa długość faz aktywuje zarówno układ współczulny (wdech) jak i przywspółczulny (wydech), tworząc stan czujnego spokoju — potwierdzony w badaniach US Navy SEALs.',
    contra: 'Unikaj przy zawrotach głowy lub silnym niedrożnym nosie; dostosuj tempo do własnego komfortu.',
  },
  '478': {
    steps: [
      'Oprzyj czubek języka o podniebienie tuż za górnymi zębami — trzymaj go tam przez cały czas.',
      'Wydech całkowity przez usta z dźwiękiem "whoosh".',
      'Wdech przez nos cicho licząc do 4, następnie wstrzymaj oddech na 7 sekund.',
      'Wydech całkowicie przez usta z dźwiękiem "whoosh" licząc do 8. Powtórz 4 razy.',
    ],
    science: 'Przedłużony wydech stymuluje nerw błędny i aktywuje odpowiedź parasympatyczną, obniżając kortyzol i tętno szybciej niż większość technik relaksacyjnych.',
    contra: 'Pierwsze tygodnie ogranicz do 4 cykli; nie stosuj jako głównej techniki przy ciężkim astmie — długie zatrzymania mogą nasilić objawy.',
  },
  'coherent': {
    steps: [
      'Usiądź lub połóż się. Zamknij oczy i przez chwilę obserwuj naturalny oddech.',
      'Zacznij oddychać równomiernie: 5 sekund wdech przez nos.',
      '5 sekund wydech przez nos — bez zatrzymań, bez wysiłku.',
      'Kontynuuj przez 10 minut. Możesz wizualizować, jak serce otwiera się z każdym oddechem.',
    ],
    science: 'Częstotliwość 0,1 Hz (≈6 oddechów/min) synchronizuje rytm serca z baroreceptorami, maksymalizując HRV — wskaźnik zdrowia autonomicznego układu nerwowego.',
    contra: 'Jedna z najbezpieczniejszych technik; nieodpowiednia jedynie przy ekstremalnej senności lub zaburzeniach rytmu serca wymagających monitorowania.',
  },
  'custom-soft': {
    steps: [
      'Znajdź spokojną pozycję siedzącą. Rozluźnij szczękę i ramiona przed początkiem.',
      'Wdech nosem przez 6 sekund — wyobraź sobie, jak oddech wypełnia dolną część płuc.',
      'Krótka pauza 2 sekundy — spokojne zatrzymanie bez wysiłku.',
      'Wydech przez nos lub usta przez 6 sekund, potem 2 sekundy przerwy. Powtórz 7 razy.',
    ],
    science: 'Krótkie zatrzymania między fazami wzmacniają efekt wagutoniczny wydechu bez wywoływania hiperkapnii, co czyni tę technikę bezpieczną do codziennego użytku.',
    contra: 'Dostosuj prędkość faz do własnego rytmu; nie wymuszaj pełnych długości jeśli ciało prosi o wolniejsze tempo.',
  },
  'nadi-shodhana': {
    steps: [
      'Usiądź w wygodnej pozycji. Prawą rękę unieś — kciuk zamknie prawą nozdrze, palec serdeczny lewą.',
      'Zamknij prawą nozdrze kciukiem. Wdech lewą nozdrwią przez 4 sekundy.',
      'Zamknij obie nozdrza, zatrzymaj oddech na 4 sekundy.',
      'Otwórz prawą nozdrwię, wydech 4 sekundy. Wdech prawą, zatrzymaj, wydech lewą. To jeden cykl — powtórz 9 razy.',
    ],
    science: 'Naprzemienne drążenie nozdrzy przekierowuje przepływ powietrza, aktywując naprzemiennie prawą (aktywującą) i lewą (uspokajającą) półkulę mózgu, co potwierdzają badania EEG.',
    contra: 'Nie wykonuj przy zatkanych nozdrach (katar, infekcja) — może pogłębić dyskomfort; odłóż praktykę na czas ustąpienia objawów.',
  },
};

const SCIENCE_FACTS = [
  { title: 'Nerw błędny', fact: 'Wolny wydech aktywuje nerw błędny, obniżając ciśnienie krwi i spowalniając bicie serca o 10-20 uderzeń na minutę.', icon: Brain, color: '#34D399' },
  { title: 'HRV', fact: 'Oddech koherentny (5-6 oddechów/min) synchronizuje rytm serca, podnosząc HRV — marker zdrowia i odporności na stres.', icon: Activity, color: '#60A5FA' },
  { title: 'CO₂', fact: 'Trening tolerancji CO₂ uczy mózg lepiej regulować stres przez rozwijanie wytrzymałości na dyskomfort fizyczny.', icon: Wind, color: '#A78BFA' },
  { title: 'Kortyzol', fact: 'Codzienna 5-minutowa praktyka oddechowa redukuje kortyzol o do 23% w ciągu 4 tygodni regularnego stosowania.', icon: Sparkles, color: '#FBBF24' },
];

// ── Weekly program ─────────────────────────────────────────────────────────────
const WEEKLY_PROGRAM = [
  { day: 'Pon', dayFull: 'Poniedziałek', technique: 'box', rationale: 'Aktywacja i skupienie na nowy tydzień. Pudełko daje strukturę.', emoji: '🧊' },
  { day: 'Wt', dayFull: 'Wtorek', technique: 'wim-hof', rationale: 'Energia i wigor w środku tygodnia. Wim Hof pobudza vitality.', emoji: '⚡' },
  { day: 'Śr', dayFull: 'Środa', technique: 'coherent', rationale: 'Przerwa na regulację. Koherencja przywraca balans po intensywnym dniu.', emoji: '💚' },
  { day: 'Czw', dayFull: 'Czwartek', technique: 'nadi-shodhana', rationale: 'Balans półkul przed końcem tygodnia pracy. Klarowność umysłu.', emoji: '🌀' },
  { day: 'Pt', dayFull: 'Piątek', technique: 'custom-soft', rationale: 'Miękkie przejście w weekend. Soft reset uwalnia napięcie tygodnia.', emoji: '🌿' },
  { day: 'Sob', dayFull: 'Sobota', technique: 'coherent', rationale: 'Spokojny poranek. Koherencja sprzyja uważności i byciu tu i teraz.', emoji: '☀️' },
  { day: 'Nd', dayFull: 'Niedziela', technique: '478', rationale: 'Przygotowanie do snu i nowego tygodnia. 4-7-8 głęboko wycisza.', emoji: '🌙' },
];

// ── Integration steps (post-session ritual) ───────────────────────────────────
const INTEGRATION_STEPS = [
  {
    id: 'body-scan',
    title: 'Skan ciała',
    emoji: '🔍',
    color: '#67D1B2',
    desc: 'Zamknij oczy. Powoli przenoś uwagę od czubka głowy do palców stóp. Zauważ, co się zmieniło po sesji — może ciepło, lekkość, mrowienie.',
    duration: '2 min',
  },
  {
    id: 'journaling',
    title: 'Notatka po sesji',
    emoji: '📝',
    color: '#A78BFA',
    desc: 'Zapisz jedno zdanie: co zauważyłaś/eś podczas sesji? Jedna myśl, obraz lub odczucie, które zostało z Tobą.',
    duration: '1 min',
  },
  {
    id: 'gratitude',
    title: 'Wdzięczność',
    emoji: '🙏',
    color: '#FBBF24',
    desc: 'Powiedz sobie w myślach lub głośno: "Dziękuję ciału za tę chwilę." Trzy głębokie oddechy i powróć do dnia.',
    duration: '1 min',
  },
];

export const BreathworkScreen: React.FC = () => {
  const { t } = useTranslation();
  useAudioCleanup();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const themeName = useAppStore((state) => state.themeName);
  const themeMode = useAppStore((state) => state.themeMode);
  const { currentTheme, isLight } = useTheme();
  const theme = currentTheme;
  const divColor = isLight ? 'rgba(122,95,54,0.14)' : 'rgba(255,255,255,0.07)';
  const subBg = isLight ? 'rgba(240,228,210,0.90)' : 'rgba(255,255,255,0.05)';
  const sessionBg = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.09)';

  const breathworkSessions = useAppStore((state) => state.breathworkSessions);
  const deleteBreathworkSession = useAppStore((state) => state.deleteBreathworkSession);

  const [selectedId, setSelectedId] = useState(PATTERNS[0].id);
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [phaseSeconds, setPhaseSeconds] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [integrationStep, setIntegrationStep] = useState<number | null>(null);

  // Ambient selector during session
  const [sessionAmbient, setSessionAmbient] = useState<AmbientSoundscape | null>(null);

  // Weekly program expanded day
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Science facts expanded
  const [expandedFact, setExpandedFact] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sphere = useRef(new Animated.Value(0.7)).current;
  const scrollRef = useRef<ScrollView>(null);
  const sessionAnchorY = useRef(0);
  const lastTap = useRef<{ id: string; at: number }>({ id: '', at: 0 });

  const pattern = useMemo(() => PATTERNS.find((entry) => entry.id === selectedId) || PATTERNS[0], [selectedId]);
  const Icon = pattern.icon;

  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };
  const scrollToSession = () => setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(sessionAnchorY.current - 24, 0), animated: true }), 140);

  const animatePhase = useCallback((nextPhase: BreathPhase, duration: number) => {
    const targetScale = nextPhase === 'inhale' ? 1.08 : nextPhase === 'hold' ? 0.96 : nextPhase === 'exhale' ? 0.72 : 0.8;
    Animated.timing(sphere, { toValue: targetScale, duration: duration * 1000, useNativeDriver: true }).start();
  }, [sphere]);

  const stopSession = useCallback(async () => {
    clearTimer();
    setIsRunning(false);
    setPhase('idle');
    setPhaseSeconds(0);
    setCycleCount(0);
    sphere.setValue(0.7);
    await AudioService.pauseAmbientSound();
  }, [sphere]);

  const runStage = useCallback((nextPhase: BreathPhase, duration: number, onDone: () => void) => {
    setPhase(nextPhase);
    if (nextPhase !== 'idle') { void AudioService.playTouchTone('soft'); }
    setPhaseSeconds(duration);
    animatePhase(nextPhase, duration || 1);
if (nextPhase !== 'idle') void HapticsService.selection();
    const tick = (secondsLeft: number) => {
      if (secondsLeft <= 0) { onDone(); return; }
      timerRef.current = setTimeout(() => { setPhaseSeconds(secondsLeft - 1); tick(secondsLeft - 1); }, 1000);
    };
    tick(duration);
  }, [animatePhase]);

  const runCycle = useCallback((nextCycle: number) => {
    if (nextCycle > pattern.cyclesTarget) {
      void stopSession();
      setSessionCompleted(true);
      setIntegrationStep(0);
      return;
    }
    setCycleCount(nextCycle);
    runStage('inhale', pattern.inhale, () => {
      const afterHold = () => runStage('exhale', pattern.exhale, () => {
        if (pattern.holdAfterExhale && pattern.holdAfterExhale > 0) runStage('rest', pattern.holdAfterExhale, () => runCycle(nextCycle + 1));
        else runCycle(nextCycle + 1);
      });
      if (pattern.hold > 0) runStage('hold', pattern.hold, afterHold);
      else afterHold();
    });
  }, [pattern, runStage, stopSession]);

  const startSession = useCallback(async () => {
    await stopSession();
    setSessionCompleted(false);
    setIntegrationStep(null);
    setIsRunning(true);
    scrollToSession();
    const ambientToPlay = sessionAmbient;
    if (ambientToPlay) { await AudioService.playAmbientForSession(ambientToPlay); }
    runCycle(1);
  }, [pattern.ambient, sessionAmbient, runCycle, stopSession]);

const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    void AudioService.preloadBootAudio();
    return () => {
      mountedRef.current = false;
      clearTimer();
      void AudioService.pauseAmbientSound();
    };
  }, []);

  const choosePattern = (id: string) => {
    if (isRunning) return;
    const now = Date.now();
    const isDouble = lastTap.current.id === id && now - lastTap.current.at < 360;
    lastTap.current = { id, at: now };
    setSelectedId(id);
    setDetailExpanded(false);
    scrollToSession();
    if (isDouble) scrollToSession();
  };

  const formatSessionDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const MONTHS_S = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru']; return `${d.getDate()} ${MONTHS_S[d.getMonth()]}`;
    } catch {
      return dateStr;
    }
  };

  const recentSessions = breathworkSessions.slice(0, 3);
  const techniqueDetail = TECHNIQUE_DETAILS[selectedId];

  // ── MÓJ POSTĘP stats ────────────────────────────────────────────────────────
  const totalSessions = breathworkSessions.length;
  const totalMinutes = breathworkSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  const weeklyStreak = useMemo(() => {
    const now = new Date();
    let streak = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      if (breathworkSessions.some(s => s.date && s.date.startsWith(dayStr))) streak++;
      else if (i > 0) break;
    }
    return streak;
  }, [breathworkSessions]);

  const favTechnique = useMemo(() => {
    if (breathworkSessions.length === 0) return '—';
    const counts: Record<string, number> = {};
    breathworkSessions.forEach(s => { counts[s.technique] = (counts[s.technique] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  }, [breathworkSessions]);

  // ── Heat map — last 30 days ─────────────────────────────────────────────────
  const heatMapDays = useMemo(() => {
    const days: { date: string; count: number; label: string }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const count = breathworkSessions.filter(s => s.date && s.date.startsWith(dayStr)).length;
      days.push({ date: dayStr, count, label: d.getDate().toString() });
    }
    return days;
  }, [breathworkSessions]);

  const todayDayOfWeek = new Date().getDay(); // 0=Sun
  const currentWeekDayIndex = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1; // Mon=0

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={isLight ? ['#FCF6EF', '#F3EBDD', '#ECE3D7'] : ['#05060D', '#09111D', '#0F1830']} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={isLight ? [pattern.color + '12', 'transparent', pattern.color + '06'] : [pattern.color + '28', '#08101A', pattern.color + '10']} style={StyleSheet.absoluteFill} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView ref={scrollRef} contentContainerStyle={[styles.scrollContent, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') + 26 }]} showsVerticalScrollIndicator={false}>

          {/* Hero section — no card wrapper */}
          <View style={styles.heroSection}>
            <View style={styles.heroRow}>
              <View style={[styles.heroIcon, { backgroundColor: pattern.color + '18', borderColor: pattern.color + '44' }]}>
                <Icon color={pattern.color} size={26} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="premiumLabel" color={pattern.color}>{t('breathwork.title')}</Typography>
                <Typography variant="heroTitle" style={{ color: theme.text, marginTop: 6 }}>{t('breathwork.selectTechnique')}</Typography>
              </View>
              <MusicToggleButton color={pattern.color} size={19} />
            </View>
            <Typography variant="bodySmall" style={{ color: theme.textMuted, marginTop: 14 }}>Oddech to najstarszy instrument regulacji, jaki masz. Każda technika ma własny cel, własne tempo i własny kontekst — nie chodzi tu o odliczanie sekund, ale o świadome prowadzenie ciała w kierunku, którego teraz potrzebuje.</Typography>
          </View>

          {/* ══ MÓJ POSTĘP ══ */}
          <View style={styles.progressSection}>
            <Typography variant="premiumLabel" color={pattern.color} style={{ marginBottom: 14 }}>📊 MÓJ POSTĘP</Typography>
            <View style={styles.statsGrid}>
              {[
                { label: 'SESJE', value: totalSessions.toString(), sub: 'łącznie', color: pattern.color },
                { label: 'MINUTY', value: totalMinutes.toString(), sub: 'praktyki', color: '#67D1B2' },
                { label: 'SERIA', value: `${weeklyStreak}d`, sub: 'tygodniowa', color: '#FBBF24' },
                { label: 'ULUBIONA', value: favTechnique === '—' ? '—' : favTechnique.split(' ')[0], sub: 'technika', color: '#C084FC' },
              ].map((stat) => (
                <View key={stat.label} style={[styles.statCard, { backgroundColor: isLight ? stat.color + '22' : stat.color + '0D', borderColor: isLight ? stat.color + '66' : stat.color + '28' }]}>
                  <Typography variant="microLabel" color={stat.color}>{stat.label}</Typography>
                  <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                  <Typography variant="microLabel" color={theme.textMuted}>{stat.sub}</Typography>
                </View>
              ))}
            </View>
          </View>

          {/* Technique map — clean inline tiles */}
          <View style={styles.mapSection}>
            <Typography variant="premiumLabel" color={pattern.color}>🗺️ MAPA TECHNIKI</Typography>
            <View style={styles.mapGrid}>
              {[
                { label: 'NAJLEPSZY MOMENT', value: pattern.bestFor[0] },
                { label: 'PEJZAŻ SESJI', value: AMBIENT_LABELS[pattern.ambient] || pattern.ambient },
                { label: 'EFEKT KOŃCOWY', value: pattern.bestFor[1] || pattern.description },
              ].map((item) => (
                <View key={item.label} style={[styles.mapTile, { backgroundColor: subBg, borderColor: isLight ? pattern.color + '66' : pattern.color + '28' }]}>
                  <Typography variant="microLabel" color={pattern.color}>{item.label}</Typography>
                  <Typography variant="bodySmall" style={{ color: theme.text, marginTop: 8 }}>{item.value}</Typography>
                </View>
              ))}
            </View>
          </View>

          {/* Pattern selector rows — no GlassCard, clean rows with dividers */}
          <View style={styles.patternSection}>
            <Typography variant="premiumLabel" color={theme.textMuted} style={{ marginBottom: 12 }}>🌬️ {t('breathwork.selectTechnique')}</Typography>
            {PATTERNS.map((entry, index) => {
              const EntryIcon = entry.icon;
              const active = entry.id === selectedId;
              return (
                <Pressable
                  key={entry.id}
                  onPress={() => choosePattern(entry.id)}
                  disabled={isRunning}
                  style={[
                    styles.patternRow,
                    index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: divColor },
                    active && { backgroundColor: entry.color + '0C' },
                  ]}
                >
                  <View style={[styles.patternBadge, { backgroundColor: entry.color + '16' }]}>
                    <EntryIcon color={entry.color} size={18} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.patternTitleRow}>
                      <Typography variant="cardTitle" style={{ color: theme.text, flex: 1 }}>{entry.title}</Typography>
                      <Typography variant="premiumLabel" color={entry.color}>{`${entry.inhale}-${entry.hold}-${entry.exhale}${entry.holdAfterExhale ? `-${entry.holdAfterExhale}` : ''}`}</Typography>
                    </View>
                    <Typography variant="bodySmall" style={{ color: theme.textMuted }}>{entry.description}</Typography>
                    {active && (
                      <Typography variant="bodySmall" style={{ color: theme.textMuted, marginTop: 6 }}>{entry.deeperDescription}</Typography>
                    )}
                    <View style={styles.tagsRow}>
                      {entry.bestFor.map((tag) => (
                        <View key={tag} style={[styles.tag, { borderColor: entry.color + '30', backgroundColor: entry.color + '0D' }]}>
                          <Typography variant="microLabel" color={entry.color}>{tag}</Typography>
                        </View>
                      ))}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* ══ BREATHWORK + DŹWIĘK — ambient selector ══ */}
          <View style={[styles.ambientSection, { backgroundColor: subBg, borderColor: pattern.color + '28' }]}>
            <Typography variant="premiumLabel" color={pattern.color} style={{ marginBottom: 12 }}>🎵 BREATHWORK + DŹWIĘK</Typography>
            <Typography variant="bodySmall" style={{ color: theme.textMuted, marginBottom: 14 }}>Wybierz tło dźwiękowe na sesję. Dźwięk natury wspiera skupienie i reguluje napięcie układu nerwowego.</Typography>
            <View style={styles.ambientRow}>
              <Pressable
                onPress={() => { setSessionAmbient(null); HapticsService.impact('light'); }}
                style={[styles.ambientChip, { backgroundColor: sessionAmbient === null ? pattern.color + '22' : cardBg, borderColor: sessionAmbient === null ? pattern.color : cardBorder }]}
              >
                <Text style={[styles.ambientChipEmoji]}>🔇</Text>
                <Typography variant="microLabel" color={sessionAmbient === null ? pattern.color : theme.textMuted}>Auto</Typography>
              </Pressable>
              {AMBIENT_OPTIONS.map(opt => (
                <Pressable
                  key={opt.id}
                  onPress={() => { setSessionAmbient(opt.id); HapticsService.impact('light'); }}
                  style={[styles.ambientChip, { backgroundColor: sessionAmbient === opt.id ? opt.color + '22' : cardBg, borderColor: sessionAmbient === opt.id ? opt.color : cardBorder }]}
                >
                  <Text style={styles.ambientChipEmoji}>{opt.emoji}</Text>
                  <Typography variant="microLabel" color={sessionAmbient === opt.id ? opt.color : theme.textMuted}>{opt.label}</Typography>
                </Pressable>
              ))}
            </View>
            <Typography variant="microLabel" color={theme.textMuted} style={{ marginTop: 10 }}>
              {sessionAmbient
                ? `Wybrano: ${AMBIENT_OPTIONS.find(o => o.id === sessionAmbient)?.label}`
                : `Auto: ${AMBIENT_LABELS[pattern.ambient] || pattern.ambient}`
              }
            </Typography>
          </View>

          {/* Session area — subtle background, no heavy border box */}
          <View
            onLayout={(event) => { sessionAnchorY.current = event.nativeEvent.layout.y; }}
            style={[styles.sessionSection, { backgroundColor: sessionBg, borderTopWidth: 2, borderTopColor: pattern.color + '44' }]}
          >
            <Typography variant="premiumLabel" color={pattern.color}>{pattern.eyebrow}</Typography>
            <Typography variant="editorialHeader" style={{ color: theme.text, marginTop: 8 }}>{pattern.title}</Typography>
            <Typography variant="bodySmall" style={{ color: theme.textMuted, marginTop: 10 }}>{pattern.deeperDescription}</Typography>

            <View style={styles.phaseBoard}>
              <Animated.View style={[styles.phaseGlow, { backgroundColor: pattern.color, transform: [{ scale: sphere }] }]} />
              <Animated.View style={[styles.phaseCore, { borderColor: pattern.color + '55', backgroundColor: isLight ? 'rgba(255,248,235,0.88)' : 'rgba(255,255,255,0.10)', transform: [{ scale: sphere }] }]}>
                <Typography variant="premiumLabel" color={pattern.color}>{PHASE_LABELS[phase]}</Typography>
                <Typography variant="heroTitle" style={{ color: theme.text, fontSize: 38, lineHeight: 44 }}>{formatBreath(phaseSeconds)}</Typography>
                <Typography variant="bodySmall" style={{ color: theme.textMuted }}>cykl {cycleCount}/{pattern.cyclesTarget}</Typography>
              </Animated.View>
            </View>

            <View style={styles.railRow}>
              {[
                { label: t('breathwork.inhale'), value: pattern.inhale },
                { label: t('breathwork.hold'), value: pattern.hold },
                { label: t('breathwork.exhale'), value: pattern.exhale },
                { label: t('common.pause'), value: pattern.holdAfterExhale ?? 0 },
              ].map((item) => (
                <View key={item.label} style={[styles.railItem, { backgroundColor: subBg }]}>
                  <Typography variant="microLabel" color={pattern.color}>{item.label}</Typography>
                  <Typography variant="cardTitle" style={{ color: theme.text }}>{item.value}s</Typography>
                </View>
              ))}
            </View>

            <View style={styles.actionRow}>
              <Pressable onPress={isRunning ? stopSession : startSession} style={[styles.primaryAction, { backgroundColor: pattern.color }]}>
                {isRunning ? <Pause color="#fff" size={18} /> : <Play color="#fff" size={18} />}
                <Typography variant="button" style={styles.primaryText}>{isRunning ? t('breathwork.pause') : t('breathwork.start')}</Typography>
              </Pressable>
              <Pressable onPress={() => !isRunning && stopSession()} style={[styles.secondaryAction, { borderColor: pattern.color + '30' }]}>
                <TimerReset color={pattern.color} size={16} />
              </Pressable>
            </View>
          </View>

          {/* ══ INTEGRACJA PO SESJI ══ */}
          {sessionCompleted && (
            <View style={[styles.integrationSection, { backgroundColor: '#34D399' + '0A', borderColor: '#34D399' + '44' }]}>
              <Typography variant="premiumLabel" color="#34D399" style={{ marginBottom: 4 }}>✦ INTEGRACJA PO SESJI</Typography>
              <Typography variant="bodySmall" style={{ color: theme.textMuted, marginBottom: 16 }}>{t('breathwork.sessionComplete')}</Typography>
              {INTEGRATION_STEPS.map((step, idx) => {
                const done = integrationStep !== null && integrationStep > idx;
                const active = integrationStep === idx;
                return (
                  <Pressable
                    key={step.id}
                    onPress={() => { if (active) { setIntegrationStep(idx + 1); HapticsService.impact('medium'); } }}
                    style={[styles.integrationCard, { backgroundColor: step.color + (active ? '14' : '08'), borderColor: step.color + (active ? '55' : '22') }]}
                  >
                    <View style={[styles.integrationIconWrap, { backgroundColor: step.color + '18' }]}>
                      {done
                        ? <CheckCircle2 color={step.color} size={18} strokeWidth={2} />
                        : <Text style={{ fontSize: 18 }}>{step.emoji}</Text>
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Typography variant="label" style={{ color: theme.text, fontWeight: '700', flex: 1 }}>{step.title}</Typography>
                        <Typography variant="microLabel" color={step.color}>{step.duration}</Typography>
                      </View>
                      {active && (
                        <Typography variant="bodySmall" style={{ color: theme.textMuted, marginTop: 6, lineHeight: 21 }}>{step.desc}</Typography>
                      )}
                    </View>
                    {active && (
                      <View style={[styles.integrationArrow, { backgroundColor: step.color }]}>
                        <CheckCircle2 color="#fff" size={14} strokeWidth={2.5} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
              {integrationStep !== null && integrationStep >= INTEGRATION_STEPS.length && (
                <View style={[styles.integrationComplete, { backgroundColor: '#34D399' + '14', borderColor: '#34D399' + '44' }]}>
                  <Typography variant="bodySmall" style={{ color: theme.text, textAlign: 'center', lineHeight: 22 }}>
                    Integracja zakończona 🌿{'\n'}Twoje ciało i umysł są gotowe na resztę dnia.
                  </Typography>
                </View>
              )}
            </View>
          )}

          {/* How to use — clean rows, no card wrapper */}
          <View style={styles.notesSection}>
            <Typography variant="premiumLabel" color={pattern.color} style={{ marginBottom: 4 }}>✦ JAK KORZYSTAĆ Z TEJ TECHNIKI</Typography>
            {pattern.notes.map((copy, index) => (
              <View key={copy} style={[styles.noteRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: divColor }]}>
                <View style={[styles.stepBadge, { backgroundColor: pattern.color + '18' }]}>
                  <Typography variant="microLabel" color={pattern.color}>{`0${index + 1}`}</Typography>
                </View>
                <Typography variant="bodySmall" style={{ flex: 1, color: theme.textMuted }}>{copy}</Typography>
              </View>
            ))}
          </View>

          {/* ── Głębiej w tę technikę ── */}
          {techniqueDetail && (
            <View style={[styles.detailCard, { backgroundColor: subBg, borderColor: pattern.color + '30' }]}>
              <Pressable onPress={() => setDetailExpanded((v) => !v)} style={styles.detailHeader}>
                <View style={{ flex: 1 }}>
                  <Typography variant="premiumLabel" color={pattern.color}>🌬️ GŁĘBIEJ W TĘ TECHNIKĘ</Typography>
                  <Typography variant="bodySmall" style={{ color: theme.textMuted, marginTop: 4 }}>{pattern.title} — instrukcja krok po kroku</Typography>
                </View>
                {detailExpanded
                  ? <ChevronUp color={pattern.color} size={18} />
                  : <ChevronDown color={pattern.color} size={18} />
                }
              </Pressable>
              {detailExpanded && (
                <View style={styles.detailBody}>
                  <View style={[styles.detailDivider, { backgroundColor: pattern.color + '22' }]} />
                  <Typography variant="premiumLabel" color={pattern.color} style={{ marginBottom: 10 }}>KROKI</Typography>
                  {techniqueDetail.steps.map((step, i) => (
                    <View key={i} style={styles.detailStep}>
                      <View style={[styles.detailStepNum, { backgroundColor: pattern.color + '18' }]}>
                        <Typography variant="microLabel" color={pattern.color}>{i + 1}</Typography>
                      </View>
                      <Typography variant="bodySmall" style={{ flex: 1, color: theme.text, lineHeight: 22 }}>{step}</Typography>
                    </View>
                  ))}
                  <View style={[styles.detailDivider, { backgroundColor: pattern.color + '22', marginTop: 14 }]} />
                  <View style={styles.detailFactRow}>
                    <View style={[styles.detailFactIcon, { backgroundColor: '#34D39918' }]}>
                      <Brain color="#34D399" size={14} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="microLabel" color="#34D399">NAUKA</Typography>
                      <Typography variant="bodySmall" style={{ color: theme.textMuted, marginTop: 4, lineHeight: 20 }}>{techniqueDetail.science}</Typography>
                    </View>
                  </View>
                  <View style={[styles.detailFactRow, { marginTop: 10 }]}>
                    <View style={[styles.detailFactIcon, { backgroundColor: '#FBBF2418' }]}>
                      <Zap color="#FBBF24" size={14} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="microLabel" color="#FBBF24">PRZECIWWSKAZANIA</Typography>
                      <Typography variant="bodySmall" style={{ color: theme.textMuted, marginTop: 4, lineHeight: 20 }}>{techniqueDetail.contra}</Typography>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ══ PROGRAM TYGODNIOWY ══ */}
          <View style={styles.weeklySection}>
            <Typography variant="premiumLabel" color={pattern.color} style={{ marginBottom: 4 }}>📅 PROGRAM TYGODNIOWY</Typography>
            <Typography variant="bodySmall" style={{ color: theme.textMuted, marginBottom: 16 }}>Zróżnicowany plan na 7 dni — każda technika dobrana do rytmu i energii dnia.</Typography>
            {WEEKLY_PROGRAM.map((day, index) => {
              const dayPattern = PATTERNS.find(p => p.id === day.technique);
              const isToday = index === currentWeekDayIndex;
              const isExpanded = expandedDay === day.day;
              return (
                <Pressable
                  key={day.day}
                  onPress={() => { setExpandedDay(isExpanded ? null : day.day); HapticsService.impact('light'); }}
                  style={[
                    styles.weeklyDayRow,
                    index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: divColor },
                    isToday && { backgroundColor: (dayPattern?.color || pattern.color) + '0C' },
                  ]}
                >
                  <View style={[styles.weeklyDayBadge, {
                    backgroundColor: isToday ? (dayPattern?.color || pattern.color) + '22' : subBg,
                    borderColor: isToday ? (dayPattern?.color || pattern.color) + '55' : 'transparent',
                    borderWidth: isToday ? 1 : 0,
                  }]}>
                    <Typography variant="microLabel" color={isToday ? (dayPattern?.color || pattern.color) : theme.textMuted}>{day.day}</Typography>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 14 }}>{day.emoji}</Text>
                      <Typography variant="label" style={{ color: theme.text, fontWeight: '700' }}>{dayPattern?.title || day.technique}</Typography>
                      {isToday && <Typography variant="microLabel" color={dayPattern?.color || pattern.color}>← DZIŚ</Typography>}
                    </View>
                    {isExpanded && (
                      <Typography variant="bodySmall" style={{ color: theme.textMuted, marginTop: 6, lineHeight: 20 }}>{day.rationale}</Typography>
                    )}
                    {isExpanded && dayPattern && (
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {dayPattern.bestFor.map(tag => (
                          <View key={tag} style={[styles.tag, { borderColor: dayPattern.color + '30', backgroundColor: dayPattern.color + '0D' }]}>
                            <Typography variant="microLabel" color={dayPattern.color}>{tag}</Typography>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  {isExpanded
                    ? <ChevronUp color={theme.textMuted} size={14} />
                    : <ChevronDown color={theme.textMuted} size={14} />
                  }
                </Pressable>
              );
            })}
          </View>

          {/* ══ ODDECH I NAUKA ══ */}
          <View style={styles.scienceSection}>
            <Typography variant="premiumLabel" color={pattern.color} style={{ marginBottom: 4 }}>🧬 ODDECH I NAUKA</Typography>
            <Typography variant="bodySmall" style={{ color: theme.textMuted, marginBottom: 16 }}>Trzy fakty naukowe o tym, jak praca z oddechem zmienia ciało i mózg.</Typography>
            {SCIENCE_FACTS.slice(0, 3).map((item, i) => {
              const SciIcon = item.icon;
              const isExpanded = expandedFact === item.title;
              return (
                <Pressable
                  key={item.title}
                  onPress={() => { setExpandedFact(isExpanded ? null : item.title); HapticsService.impact('light'); }}
                  style={[
                    styles.scienceCard,
                    { backgroundColor: item.color + '0C', borderColor: item.color + '28' },
                    i > 0 && { marginTop: 10 },
                  ]}
                >
                  <View style={[styles.scienceIconWrap, { backgroundColor: item.color + '18' }]}>
                    <SciIcon color={item.color} size={16} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Typography variant="label" style={{ color: theme.text, fontWeight: '700', flex: 1 }}>{item.title}</Typography>
                      {isExpanded
                        ? <ChevronUp color={item.color} size={14} />
                        : <ChevronDown color={item.color} size={14} />
                      }
                    </View>
                    {isExpanded && (
                      <Typography variant="bodySmall" style={{ color: theme.textMuted, marginTop: 8, lineHeight: 22 }}>{item.fact}</Typography>
                    )}
                    {!isExpanded && (
                      <Typography variant="bodySmall" style={{ color: theme.textMuted, marginTop: 4 }} numberOfLines={1}>{item.fact}</Typography>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* ── Historia sesji ── */}
          <View style={styles.historySection}>
            <Typography variant="premiumLabel" color={pattern.color} style={{ marginBottom: 12 }}>📈 HISTORIA SESJI</Typography>
            {recentSessions.length === 0 ? (
              <View style={[styles.historyEmpty, { backgroundColor: subBg, borderColor: divColor }]}>
                <Typography variant="bodySmall" style={{ color: theme.textMuted, textAlign: 'center', lineHeight: 22 }}>
                  Twoje pierwsze sesje pojawią się tutaj.{'\n'}Każdy oddech zostawia ślad w tej historii.
                </Typography>
              </View>
            ) : (
              recentSessions.map((s, i) => {
                const techPattern = PATTERNS.find((p) => p.title === s.technique || p.id === s.technique);
                const accentColor = techPattern?.color || pattern.color;
                const TechIcon = techPattern?.icon || Wind;
                return (
                  <View
                    key={s.id}
                    style={[
                      styles.historyCard,
                      { backgroundColor: subBg, borderColor: accentColor + '28' },
                      i > 0 && { marginTop: 8 },
                    ]}
                  >
                    <View style={[styles.historyIconWrap, { backgroundColor: accentColor + '18' }]}>
                      <TechIcon color={accentColor} size={16} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="label" style={{ color: theme.text, fontWeight: '600' }}>{s.technique}</Typography>
                      <Typography variant="microLabel" color={theme.textMuted} style={{ marginTop: 3 }}>
                        {formatSessionDate(s.date)} · {s.durationMinutes} min · {s.cycles} cykli
                      </Typography>
                    </View>
                    <Pressable hitSlop={10} onPress={() => Alert.alert('Usuń sesję', 'Czy na pewno chcesz usunąć tę sesję?', [
                      { text: 'Anuluj', style: 'cancel' },
                      { text: 'Usuń', style: 'destructive', onPress: () => deleteBreathworkSession(s.id) },
                    ])}>
                      <Trash2 size={15} color={'#EF4444'} strokeWidth={1.6} />
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>

          {/* ══ TWOJE WZORCE — heat map ══ */}
          <View style={styles.heatMapSection}>
            <Typography variant="premiumLabel" color={pattern.color} style={{ marginBottom: 4 }}>🗓️ TWOJE WZORCE</Typography>
            <Typography variant="bodySmall" style={{ color: theme.textMuted, marginBottom: 16 }}>Aktywność oddechowa w ostatnich 30 dniach.</Typography>
            <View style={styles.heatMapGrid}>
              {heatMapDays.map((day, idx) => {
                const intensity = day.count === 0 ? 0 : day.count === 1 ? 1 : day.count === 2 ? 2 : 3;
                const bgColor = intensity === 0
                  ? (isLight ? 'rgba(255,246,230,0.92)' : 'rgba(255,255,255,0.06)')
                  : intensity === 1
                    ? pattern.color + '44'
                    : intensity === 2
                      ? pattern.color + '77'
                      : pattern.color;
                return (
                  <View
                    key={idx}
                    style={[styles.heatMapCell, { backgroundColor: bgColor }]}
                  />
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <Typography variant="microLabel" color={theme.textMuted}>Mniej</Typography>
              {[0, 1, 2, 3].map(lv => (
                <View key={lv} style={[styles.heatMapLegendCell, {
                  backgroundColor: lv === 0
                    ? (isLight ? 'rgba(255,246,230,0.92)' : 'rgba(255,255,255,0.06)')
                    : lv === 1 ? pattern.color + '44' : lv === 2 ? pattern.color + '77' : pattern.color,
                }]} />
              ))}
              <Typography variant="microLabel" color={theme.textMuted}>Więcej</Typography>
            </View>
            {breathworkSessions.length > 0 && (
              <Typography variant="microLabel" color={theme.textMuted} style={{ marginTop: 6 }}>
                {breathworkSessions.length} {breathworkSessions.length === 1 ? 'sesja' : breathworkSessions.length < 5 ? 'sesje' : 'sesji'} łącznie
              </Typography>
            )}
          </View>

          {/* ── Nauka o oddechu (full 4 facts) ── */}
          <View style={styles.scienceSection}>
            <Typography variant="premiumLabel" color={pattern.color} style={{ marginBottom: 16 }}>🧬 NAUKA O ODDECHU</Typography>
            {SCIENCE_FACTS.map((item, i) => {
              const SciIcon = item.icon;
              return (
                <View
                  key={item.title + '-full'}
                  style={[
                    styles.scienceCard,
                    { backgroundColor: item.color + '0C', borderColor: item.color + '28' },
                    i > 0 && { marginTop: 10 },
                  ]}
                >
                  <View style={[styles.scienceIconWrap, { backgroundColor: item.color + '18' }]}>
                    <SciIcon color={item.color} size={16} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="label" style={{ color: theme.text, fontWeight: '700' }}>{item.title}</Typography>
                    <Typography variant="bodySmall" style={{ color: theme.textMuted, marginTop: 5, lineHeight: 21 }}>{item.fact}</Typography>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── Co dalej? ── */}
          <View style={styles.whySection}>
            <Typography variant="premiumLabel" color={pattern.color} style={{ marginBottom: 12 }}>✦ CO DALEJ?</Typography>
            {[
              { icon: Headphones, label: 'Kąpiel dźwiękowa', sub: 'Pogłęb relaksację dźwiękiem', color: '#A78BFA', route: 'SoundBath' },
              { icon: Moon, label: 'Medytacja', sub: 'Wejdź w ciszę po oddechu', color: '#60A5FA', route: 'Meditation' },
              { icon: Sparkles, label: 'Wyrocznia', sub: 'Zapytaj o kolejny krok', color: pattern.color, route: 'OraclePortal' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.route}
                  onPress={() => navigation.navigate(item.route)}
                  style={[styles.nextLinkRow, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', borderColor: item.color + '33' }]}
                >
                  <View style={[styles.nextLinkIcon, { backgroundColor: item.color + '18' }]}>
                    <Icon color={item.color} size={17} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="label" style={{ fontWeight: '700', color: theme.text }}>{item.label}</Typography>
                    <Typography variant="bodySmall" style={{ color: theme.textMuted, marginTop: 2 }}>{item.sub}</Typography>
                  </View>
                  <ArrowRight color={item.color} size={15} strokeWidth={1.5} />
                </Pressable>
              );
            })}
          </View>

          {/* Why it works — clean rows, no card wrapper */}
          <View style={styles.whySection}>
            <Typography variant="premiumLabel" color={pattern.color} style={{ marginBottom: 4 }}>🔬 DLACZEGO TO DZIAŁA</Typography>
            <View style={styles.whyRow}>
              <ArrowDownCircle color={pattern.color} size={15} />
              <Typography variant="bodySmall" style={{ flex: 1, color: theme.textMuted }}>Zmiana długości wdechu i wydechu wpływa bezpośrednio na napięcie układu nerwowego, poziom pobudzenia i poczucie kontroli w ciele.</Typography>
            </View>
            <View style={[styles.whyRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: divColor }]}>
              <Shield color={pattern.color} size={15} />
              <Typography variant="bodySmall" style={{ flex: 1, color: theme.textMuted }}>Największą wartość daje regularność i łagodne wejście w rytm, a nie agresywne dociskanie oddechu.</Typography>
            </View>
          </View>

          <EndOfContentSpacer size="standard" />

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: layout.padding.screen, paddingTop: 8, gap: 28 },

  heroSection: { paddingTop: 4 },
  heroRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  heroIcon: { width: 56, height: 56, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // MÓJ POSTĘP
  progressSection: { gap: 0 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', borderRadius: 16, borderWidth: 1, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },

  mapSection: { gap: 0 },
  mapGrid: { gap: 10, marginTop: 14 },
  mapTile: { borderRadius: 16, borderWidth: 1, padding: 14 },

  patternSection: { gap: 0 },
  patternRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 16, paddingHorizontal: 4, borderRadius: 4 },
  patternBadge: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  patternTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },

  // Ambient selector
  ambientSection: { borderRadius: 20, borderWidth: 1, padding: 18 },
  ambientRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ambientChip: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', gap: 4, minWidth: 56 },
  ambientChipEmoji: { fontSize: 18 },

  sessionSection: { borderRadius: 24, padding: 22 },
  phaseBoard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28 },
  phaseGlow: { position: 'absolute', width: 236, height: 236, borderRadius: 118, opacity: 0.28 },
  phaseCore: { width: 212, height: 212, borderRadius: 106, borderWidth: 1.6, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center', gap: 4, shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  railRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  railItem: { flex: 1, minWidth: 72, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  primaryAction: { flex: 1, minHeight: 54, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', marginLeft: 10 },
  secondaryAction: { width: 56, minHeight: 54, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Integration
  integrationSection: { borderRadius: 22, borderWidth: 1, padding: 20, gap: 10 },
  integrationCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  integrationIconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  integrationArrow: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  integrationComplete: { borderRadius: 14, borderWidth: 1, padding: 16, alignItems: 'center', marginTop: 4 },

  notesSection: { gap: 0 },
  noteRow: { flexDirection: 'row', gap: 12, paddingVertical: 14, alignItems: 'flex-start' },
  stepBadge: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Weekly program
  weeklySection: { gap: 0 },
  weeklyDayRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 14, paddingHorizontal: 4, borderRadius: 4 },
  weeklyDayBadge: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  whySection: { gap: 0 },
  whyRow: { flexDirection: 'row', gap: 10, paddingVertical: 14, alignItems: 'flex-start' },
  nextLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  nextLinkIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Głębiej w tę technikę
  detailCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  detailBody: { paddingHorizontal: 18, paddingBottom: 18 },
  detailDivider: { height: 1, marginBottom: 14 },
  detailStep: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  detailStepNum: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  detailFactRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  detailFactIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Historia sesji
  historySection: { gap: 0 },
  historyEmpty: { borderWidth: 1, borderRadius: 16, padding: 24, alignItems: 'center' },
  historyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  historyIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Heat map
  heatMapSection: { gap: 0 },
  heatMapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  heatMapCell: { width: (layout.padding.screen ? (375 - layout.padding.screen * 2 - 5 * 6) / 7 : 42), height: 20, borderRadius: 5 },
  heatMapLegendCell: { width: 16, height: 16, borderRadius: 4 },

  // Nauka o oddechu
  scienceSection: { gap: 0 },
  scienceCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderWidth: 1, borderRadius: 16, padding: 14 },
  scienceIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
});
