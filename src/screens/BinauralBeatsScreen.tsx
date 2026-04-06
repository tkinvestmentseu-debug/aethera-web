// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  Animated, Pressable, ScrollView, StyleSheet,
  Text, View, Dimensions, Modal, TextInput,
} from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight, ChevronLeft, Headphones, Moon, Star, Sparkles,
  Wind, ChevronDown, ChevronUp, CheckCircle, Calendar,
  Sliders, Clock, Layers, BookOpen, Zap, Play, Pause, Square,
  Volume2, VolumeX, Music, Waves, Flame, Trees, CloudRain,
} from 'lucide-react-native';
import { useAudioCleanup } from '../core/hooks/useAudioCleanup';
import { useFocusEffect } from '@react-navigation/native';
import { AudioService } from '../core/services/audio.service';
import type { BinauralFrequency, AmbientSoundscape } from '../core/services/audio.service';
import { Typography } from '../components/Typography';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const VIZ_W = SW - 40;
const VIZ_H = 160;

// ─── brainwave states quick selector ──────────────────────────────────────────

interface BrainwaveState {
  id: string;
  symbol: string;
  name: string;
  range: string;
  hz: number; // binaural beat target Hz
  color: string;
  desc: string;
  use: string;
}

const BRAINWAVE_STATES: BrainwaveState[] = [
  { id: 'delta', symbol: 'δ', name: 'Delta', range: '0.5–4 Hz', hz: 2, color: '#6366F1', desc: 'Głęboki sen, regeneracja komórkowa, uwalnianie hormonu wzrostu. Stan nieświadomości.', use: 'Bezsenność, regeneracja, głęboki odpoczynek' },
  { id: 'theta', symbol: 'θ', name: 'Theta', range: '4–8 Hz', hz: 6, color: '#8B5CF6', desc: 'Medytacja głęboka, hipnagogiczny trans, przetwarzanie emocji, intuicja i kreatywność.', use: 'Medytacja, praca z traumą, kreatywność' },
  { id: 'alpha', symbol: 'α', name: 'Alpha', range: '8–14 Hz', hz: 10, color: '#06B6D4', desc: 'Relaksowana czujność, spokój bez senności. Mostek między świadomością a podświadomością.', use: 'Nauka, stres, równowaga, relaks' },
  { id: 'beta', symbol: 'β', name: 'Beta', range: '14–30 Hz', hz: 20, color: '#10B981', desc: 'Aktywna uwaga, logiczne myślenie, przetwarzanie informacji, skupienie na zadaniach.', use: 'Praca, nauka, koncentracja, energia' },
  { id: 'gamma', symbol: 'γ', name: 'Gamma', range: '30–100 Hz', hz: 40, color: '#F59E0B', desc: 'Wyższe funkcje poznawcze, synchronizacja całego mózgu, stany flow i świadomości szczytowej.', use: 'Skupienie szczytowe, medytacja Zen, flow' },
  { id: 'epsilon', symbol: 'ε', name: 'Epsilon', range: '< 0.5 Hz', hz: 0.5, color: '#EC4899', desc: 'Najgłębszy znany stan — opisywany w tradycji jogi jako samadhi. Granica snu i niebytu.', use: 'Samadhi, głęboka kontemplacja, nirwana' },
];

// ─── carrier frequencies ──────────────────────────────────────────────────────

interface CarrierFreq {
  id: string;
  hz: string;
  name: string;
  desc: string;
  color: string;
  tradition: string;
}

const CARRIER_FREQS: CarrierFreq[] = [
  { id: '136', hz: '136.1 Hz', name: 'OM — Nada Brahma', desc: 'Ton ziemski — częstotliwość roku tropikalnego Ziemi. Indukcja spokoju i kontemplacji. Stosowana w muzyce medytacyjnej Tybetu.', color: '#D97706', tradition: 'Tradycja wedyjska' },
  { id: '432', hz: '432 Hz', name: 'Harmonia natury', desc: 'Rezonuje z rezonansem Schumanna (7.83 Hz × 54). Uważana za "naturalny strój" wszechświata. Cieplejsza, głębsza barwa niż standard 440 Hz.', color: '#059669', tradition: 'Pitagorejska' },
  { id: '528', hz: '528 Hz', name: 'Miłość — DNA', desc: 'Jedna z częstotliwości Solfeggio. Badania sugerują korelację z enzymami naprawy DNA. Wywołuje poczucie wdzięczności i otwartości serca.', color: '#7C3AED', tradition: 'Solfeggio' },
  { id: '741', hz: '741 Hz', name: 'Intuicja — Ajna', desc: 'Stymuluje obszary intuicji i czystej ekspresji. Oczyszcza pole elektromagnetyczne, wspiera autentyczność i wyrażanie wewnętrznej prawdy.', color: '#2563EB', tradition: 'Solfeggio' },
];

// ─── guided programs ──────────────────────────────────────────────────────────

interface GuidedProgram {
  id: string;
  icon: string;
  name: string;
  desc: string;
  duration: number; // minutes
  brainwave: string;
  color: string;
  steps: { time: string; instruction: string }[];
}

const GUIDED_PROGRAMS: GuidedProgram[] = [
  {
    id: 'deep_sleep',
    icon: '🌙',
    name: 'Sen głęboki',
    desc: 'Stopniowe zejście przez Alpha → Theta → Delta. Idealne przed snem.',
    duration: 30,
    brainwave: 'Delta (2 Hz)',
    color: '#6366F1',
    steps: [
      { time: '0:00', instruction: 'Połóż się wygodnie. Zamknij oczy. Oddychaj głęboko przez nos.' },
      { time: '5:00', instruction: 'Poczuj jak ciężkość ogarnia ciało. Nogi odpuszczają napięcie.' },
      { time: '10:00', instruction: 'Umysł zwalnia. Myśli mijają jak chmury — nie zatrzymuj żadnej.' },
      { time: '20:00', instruction: 'Wchodzisz w głęboką ciszę. Pozwól ciału zasnąć.' },
    ],
  },
  {
    id: 'focus',
    icon: '🎯',
    name: 'Skupienie',
    desc: 'Aktywacja fal Beta dla precyzyjnej pracy umysłowej.',
    duration: 25,
    brainwave: 'Beta (20 Hz)',
    color: '#10B981',
    steps: [
      { time: '0:00', instruction: 'Usiądź prosto. Zdefiniuj jedno zadanie na tę sesję.' },
      { time: '3:00', instruction: 'Fale Beta aktywują korę przedczołową — centrum skupienia.' },
      { time: '10:00', instruction: 'Pracuj. Jeśli uwaga odpłynie — wróć do oddechu i zadania.' },
      { time: '23:00', instruction: 'Ostatnie 2 minuty: podsumuj co osiągnąłeś.' },
    ],
  },
  {
    id: 'meditation',
    icon: '🧘',
    name: 'Medytacja',
    desc: 'Theta 6 Hz — głęboka medytacja i dostęp do podświadomości.',
    duration: 20,
    brainwave: 'Theta (6 Hz)',
    color: '#8B5CF6',
    steps: [
      { time: '0:00', instruction: 'Przyjmij wygodną pozycję siedzącą. Wyprostuj kręgosłup.' },
      { time: '5:00', instruction: 'Obserwuj oddech. Nie kontroluj — tylko obserwuj naturalny rytm.' },
      { time: '10:00', instruction: 'Jesteś w Theta. Pozwól obrazom i intuicjom pojawiać się swobodnie.' },
      { time: '18:00', instruction: 'Powoli wracaj. Poczuj ciało, usłysz otoczenie. Otwórz oczy.' },
    ],
  },
  {
    id: 'creativity',
    icon: '🎨',
    name: 'Kreatywność',
    desc: 'Alpha–Theta 8–10 Hz — przestrzeń twórcza i stan przepływu.',
    duration: 30,
    brainwave: 'Alpha/Theta (8 Hz)',
    color: '#06B6D4',
    steps: [
      { time: '0:00', instruction: 'Przywołaj projekt lub problem twórczy. Wyobraź go sobie żywo.' },
      { time: '8:00', instruction: 'Puść kontrolę. Pozwól mózgowi łączyć idee bez cenzury.' },
      { time: '20:00', instruction: 'Stan alpha-theta: jesteś w przestrzeni "między". Rysuj lub notatki.' },
      { time: '28:00', instruction: 'Zapisz wszystkie pomysły zanim wyjdziesz z sesji.' },
    ],
  },
  {
    id: 'healing',
    icon: '💚',
    name: 'Uzdrowienie',
    desc: 'Alpha 10 Hz + nośna 528 Hz — regeneracja i harmonia systemu nerwowego.',
    duration: 25,
    brainwave: 'Alpha (10 Hz)',
    color: '#059669',
    steps: [
      { time: '0:00', instruction: 'Przyłóż dłonie na sercu. Poczuj jego bicie. Wdzięczność za życie.' },
      { time: '5:00', instruction: 'Wyobraź sobie zielone lub złote światło wypełniające ciało.' },
      { time: '15:00', instruction: 'Każdy oddech przynosi uzdrowienie. Każdy wydech — uwalnia.' },
      { time: '23:00', instruction: 'Podziękuj swojemu ciału. Ono pracuje dla Ciebie bez przerwy.' },
    ],
  },
];

// ─── soundscape options ───────────────────────────────────────────────────────

interface SoundscapeOpt {
  id: AmbientSoundscape | 'silence';
  label: string;
  icon: string;
  color: string;
}

const SOUNDSCAPE_OPTS: SoundscapeOpt[] = [
  { id: 'silence', label: 'Cisza', icon: '🔇', color: '#6B7280' },
  { id: 'rain', label: 'Deszcz', icon: '🌧', color: '#60A5FA' },
  { id: 'waves', label: 'Ocean', icon: '🌊', color: '#0EA5E9' },
  { id: 'forest', label: 'Las', icon: '🌲', color: '#34D399' },
  { id: 'fire', label: 'Ogień', icon: '🔥', color: '#FB923C' },
  { id: 'ritual', label: 'Rytuał', icon: '🪔', color: '#A78BFA' },
];

// ─── SVG Brainwave Visualizer ─────────────────────────────────────────────────

const generateSinePath = (
  width: number,
  height: number,
  amplitude: number,
  frequency: number,
  phase: number,
  offsetY: number,
): string => {
  const points: string[] = [];
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const y = offsetY + amplitude * Math.sin((i / steps) * Math.PI * 2 * frequency + phase);
    points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  return points.join(' ');
};

const BrainwaveViz = ({
  color, beatHz, active,
}: {
  color: string; beatHz: number; active: boolean;
}) => {
  const phaseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) { phaseAnim.setValue(0); return; }
    const speed = Math.max(800, 3000 - beatHz * 60);
    const loop = Animated.loop(
      Animated.timing(phaseAnim, { toValue: 1, duration: speed, useNativeDriver: false })
    );
    loop.start();
    return () => loop.stop();
  }, [active, beatHz]);

  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const id = phaseAnim.addListener(({ value }) => setPhase(value * Math.PI * 2));
    return () => phaseAnim.removeListener(id);
  }, []);

  const W = VIZ_W;
  const H = VIZ_H;
  const mid = H / 2;

  // Left ear wave (carrier)
  const leftPath = generateSinePath(W, H, 24, 3, phase, mid - 42);
  // Right ear wave (carrier + beat offset)
  const rightPath = generateSinePath(W, H, 24, 3, phase + Math.PI * 0.35, mid - 6);
  // Difference / beat wave
  const diffAmp = active ? 30 : 12;
  const diffPath = generateSinePath(W, H, diffAmp, 1.0, phase * 0.4, mid + 44);

  return (
    <View style={{ width: W, height: H, overflow: 'hidden' }}>
      <Svg width={W} height={H}>
        <Defs>
          <SvgLinearGradient id="leftGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0.1" />
            <Stop offset="0.5" stopColor={color} stopOpacity="0.55" />
            <Stop offset="1" stopColor={color} stopOpacity="0.1" />
          </SvgLinearGradient>
          <SvgLinearGradient id="rightGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0.08" />
            <Stop offset="0.5" stopColor={color} stopOpacity="0.40" />
            <Stop offset="1" stopColor={color} stopOpacity="0.08" />
          </SvgLinearGradient>
          <SvgLinearGradient id="diffGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0.0" />
            <Stop offset="0.5" stopColor={color} stopOpacity={active ? "0.9" : "0.3"} />
            <Stop offset="1" stopColor={color} stopOpacity="0.0" />
          </SvgLinearGradient>
        </Defs>

        {/* Left ear label */}
        <SvgText x={6} y={mid - 38} fontSize={9} fill={color} fillOpacity={0.5}>Ucho L</SvgText>
        {/* Left ear wave */}
        <Path d={leftPath} stroke="url(#leftGrad)" strokeWidth={1.5} fill="none" />

        {/* Right ear label */}
        <SvgText x={6} y={mid - 2} fontSize={9} fill={color} fillOpacity={0.45}>Ucho P</SvgText>
        {/* Right ear wave */}
        <Path d={rightPath} stroke="url(#rightGrad)" strokeWidth={1.5} fill="none" />

        {/* Separator line */}
        <Line x1={0} y1={mid + 22} x2={W} y2={mid + 22} stroke={color} strokeWidth={0.5} strokeOpacity={0.15} strokeDasharray="4 6" />

        {/* Beat wave label */}
        <SvgText x={6} y={mid + 40} fontSize={9} fill={color} fillOpacity={active ? 0.85 : 0.4}>Fala binauralna</SvgText>
        {/* Difference / beat wave */}
        <Path d={diffPath} stroke="url(#diffGrad)" strokeWidth={active ? 2.5 : 1.5} fill="none" />

        {/* Beat Hz label center */}
        <SvgText x={W / 2} y={H - 8} fontSize={11} fill={color} fillOpacity={0.7} textAnchor="middle" fontWeight="700">
          {active ? `${beatHz} Hz beat` : 'brak aktywnej sesji'}
        </SvgText>
      </Svg>
    </View>
  );
};

// ─── types ───────────────────────────────────────────────────────────────────

interface FreqData {
  id: BinauralFrequency;
  hz: string;
  label: string;
  subtitle: string;
  desc: string;
  benefits: string[];
  chakra: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  emoji: string;
  brainwave: string;
  brainwaveDesc: string;
  useCase: string;
  // extended
  scientificDesc: string;
  brainwaveState: string;
  recommendedActivities: string[];
}

interface BinauralSession {
  id: string;
  date: string;
  freqId: BinauralFrequency;
  freqLabel: string;
  durationSeconds: number;
  rating: number;
}

// ─── frequency data ───────────────────────────────────────────────────────────

const FREQS: FreqData[] = [
  {
    id: '40hz',
    hz: '40 Hz', label: 'Gamma', subtitle: 'Fale Gamma',
    emoji: '⚡',
    color: '#FFD700', gradientFrom: '#3D2E00', gradientTo: '#1A1200',
    desc: 'Najszybsze fale mózgowe związane z najwyższymi stanami świadomości, szczytową koncentracją i głęboką integracją informacji.',
    benefits: ['Ostra koncentracja', 'Lepsza pamięć robocza', 'Szybkie przetwarzanie', 'Stany flow'],
    chakra: '👁️ Trzecie Oko', brainwave: 'γ (Gamma)', brainwaveDesc: '30–100 Hz',
    useCase: 'Nauka, praca twórcza, medytacja Zen',
    scientificDesc: 'Fale Gamma (30–100 Hz) są korelowane z procesami integracji informacji w neuronauce poznawczej. Badania Francisca Vareli i in. (1999) wskazują na rolę synchronizacji 40 Hz w świadomości i łączeniu percepcji z pamięcią. Efekt binaural w paśmie Gamma wymaga różnicy częstotliwości min. 30 Hz między uszami.',
    brainwaveState: 'Hiperaktywacja poznawcza — szczytowe skupienie, synchronizacja obszarów mózgu',
    recommendedActivities: ['Uczenie się nowego materiału', 'Sesje twórcze i burze mózgów', 'Medytacja Vipassana i Zen', 'Praca wymagająca precyzji'],
  },
  {
    id: '174hz',
    hz: '174 Hz', label: 'Fundament', subtitle: 'Uziemienie',
    emoji: '🌍',
    color: '#CD7F32', gradientFrom: '#2E1800', gradientTo: '#130B00',
    desc: 'Najniższa z częstotliwości Solfeggio. Działa jak naturalny środek znieczulający — redukuje ból fizyczny i emocjonalny, budując poczucie bezpieczeństwa.',
    benefits: ['Redukcja bólu', 'Poczucie bezpieczeństwa', 'Uziemienie', 'Redukcja stresu'],
    chakra: '🔴 Muladhara', brainwave: 'δ (Delta)', brainwaveDesc: '0.5–4 Hz',
    useCase: 'Chroniczny ból, lęk, bezsenność',
    scientificDesc: '174 Hz należy do starożytnej skali Solfeggio, historycznie związanej z gregoriańskim chorałem. W kontekście neuronaukowym generuje stan Delta (0.5–4 Hz) — najgłębszy etap snu NREM, podczas którego zachodzi regeneracja komórkowa i konsolidacja pamięci proceduralnej.',
    brainwaveState: 'Delta — głęboka regeneracja, minimalna aktywność kortykalna',
    recommendedActivities: ['Głęboki sen regeneracyjny', 'Praca z przewlekłym bólem', 'Sesje uziemienia', 'Relaks przed snem'],
  },
  {
    id: '396hz',
    hz: '396 Hz', label: 'Wyzwolenie', subtitle: 'Uwalnianie blokad',
    emoji: '🔓',
    color: '#FF6B6B', gradientFrom: '#2E0808', gradientTo: '#130303',
    desc: 'Częstotliwość transformacji — rozkłada negatywne wzorce energetyczne, uwalnia głęboko zakorzeniony strach, winę i poczucie wstydu.',
    benefits: ['Uwalnianie strachu', 'Redukcja poczucia winy', 'Emocjonalne oczyszczenie', 'Siła wewnętrzna'],
    chakra: '🔴 Muladhara', brainwave: 'θ (Theta)', brainwaveDesc: '4–8 Hz',
    useCase: 'Trauma, blokady emocjonalne, poczucie winy',
    scientificDesc: 'Fale Theta (4–8 Hz) są dominujące w hipnagogicznym stanie przejścia między jawą a snem oraz podczas głębokiej medytacji. Badania wykazują ich związek z przetwarzaniem emocjonalnym w hipokampie i amygdale — obszarach krytycznych dla traumy i reakcji strachu.',
    brainwaveState: 'Theta — przetwarzanie emocji, dostęp do nieświadomości',
    recommendedActivities: ['Praca z traumą pod opieką terapeuty', 'Sesje uwalniania emocji', 'Głęboka medytacja', 'Pisanie dziennika po sesji'],
  },
  {
    id: '432hz',
    hz: '432 Hz', label: 'Uzdrowienie', subtitle: 'Harmonia natury',
    emoji: '🌿',
    color: '#78C878', gradientFrom: '#0A2E0A', gradientTo: '#041304',
    desc: 'Zwana "matematyką wszechświata" — rezonuje z naturalną częstotliwością Ziemi (8 Hz Schumann × 54). Wywołuje głęboki spokój i harmonię z naturą.',
    benefits: ['Głęboki spokój', 'Harmonia wewnętrzna', 'Redukcja lęku', 'Połączenie z naturą'],
    chakra: '💚 Anahata', brainwave: 'α (Alpha)', brainwaveDesc: '8–14 Hz',
    useCase: 'Medytacja, relaks, równowaga emocjonalna',
    scientificDesc: 'Alpha (8–14 Hz) pojawia się podczas relaksowanej czujności — zamknięte oczy, spokojny oddech, brak angażującego zadania. Rezonans Schumanna (7.83 Hz) to naturalna częstotliwość elektromagnetyczna wnęki ziemskiej, z którą 432 Hz jest powiązane przez wielokrotności harmoniczne.',
    brainwaveState: 'Alpha — relaksowana czujność, twórcza receptywność',
    recommendedActivities: ['Medytacja z otwartą uwagą', 'Joga i pranajama', 'Praca twórcza w spokoju', 'Łagodne spacery w naturze'],
  },
  {
    id: '528hz',
    hz: '528 Hz', label: 'Miłość', subtitle: 'Transformacja DNA',
    emoji: '💚',
    color: '#00E676', gradientFrom: '#002E10', gradientTo: '#001308',
    desc: 'Zwana "częstotliwością miłości i cudów". Badania sugerują jej rolę w naprawie DNA. Otwiera serce, transformuje i regeneruje na poziomie komórkowym.',
    benefits: ['Naprawa i regeneracja', 'Otwieranie serca', 'Transformacja', 'Głęboka miłość własna'],
    chakra: '💚 Anahata', brainwave: 'α (Alpha)', brainwaveDesc: '8–14 Hz',
    useCase: 'Leczenie ran emocjonalnych, miłość własna',
    scientificDesc: 'Badania Lenihandta (2009) sugerowały aktywność 528 Hz na enzymy naprawy DNA, jednak wyniki są kontrowersyjne i wymagają replikacji. Niezależnie, fale Alpha wywoływane binarnie w tym zakresie skutecznie redukują kortyzol i aktywują przywspółczulny układ nerwowy.',
    brainwaveState: 'Alpha – harmonizacja układu nerwowego, regeneracja',
    recommendedActivities: ['Automasaż z intencją uzdrawiania', 'Medytacja na Sercu', 'Pisanie listów do siebie', 'Kąpiel z solą i intencją'],
  },
  {
    id: '639hz',
    hz: '639 Hz', label: 'Połączenie', subtitle: 'Relacje i empatia',
    emoji: '🤝',
    color: '#87CEEB', gradientFrom: '#001A2E', gradientTo: '#000B13',
    desc: 'Częstotliwość harmonizowania relacji — poprawia komunikację, buduje empatię i zrozumienie. Leczy stare rany w związkach i wzmacnia więzi.',
    benefits: ['Poprawa relacji', 'Empatia', 'Lepsza komunikacja', 'Harmonia społeczna'],
    chakra: '🔵 Vishuddha', brainwave: 'β (Beta)', brainwaveDesc: '14–30 Hz',
    useCase: 'Konflikty w związkach, izolacja, brak empatii',
    scientificDesc: 'Beta (14–30 Hz) to stan aktywnej, skupionej uwagi i przetwarzania społecznego. Obszar 639 Hz jest stosowany w muzykoterapii relacyjnej jako tło dla ćwiczeń komunikacyjnych. Niższe pasmo Beta (~14–18 Hz) wspomaga empatię i odczyt sygnałów społecznych.',
    brainwaveState: 'Beta — aktywne przetwarzanie emocji społecznych',
    recommendedActivities: ['Medytacja z partnerem lub bliską osobą', 'Przygotowanie do trudnej rozmowy', 'Terapia par jako tło', 'Wizualizacja uzdrowienia relacji'],
  },
  {
    id: '741hz',
    hz: '741 Hz', label: 'Ekspresja', subtitle: 'Intuicja i czystość',
    emoji: '🔮',
    color: '#9370DB', gradientFrom: '#150A2E', gradientTo: '#090413',
    desc: 'Przebudza intuicję i wzmacnia wyrażanie siebie. Oczyszcza komórki z toksyn i elektromagnetycznych zanieczyszczeń. Sprzyja prawdzie i autentyczności.',
    benefits: ['Silna intuicja', 'Autentyczność', 'Oczyszczenie energetyczne', 'Twórcza ekspresja'],
    chakra: '🔵 Vishuddha', brainwave: 'β (Beta)', brainwaveDesc: '14–30 Hz',
    useCase: 'Blokada twórcza, brak autentyczności',
    scientificDesc: 'Wyższe Beta (20–30 Hz) aktywuje prefrontalną korę mózgową — ośrodek podejmowania decyzji, wyrażania siebie i autentyczności. 741 Hz wzmacnia ten proces akustycznie, działając jako stymulacja sensoryczna wspierająca aktywację układu dopaminergicznego.',
    brainwaveState: 'Beta wysoki — ekspresja, rozwiązywanie problemów',
    recommendedActivities: ['Pisanie, rysowanie, twórczość', 'Ćwiczenia z wyrażaniem emocji', 'Przygotowanie prezentacji', 'Sesje clarity journaling'],
  },
  {
    id: '852hz',
    hz: '852 Hz', label: 'Intuicja', subtitle: 'Trzecie Oko',
    emoji: '🌀',
    color: '#4169E1', gradientFrom: '#050A2E', gradientTo: '#020513',
    desc: 'Bezpośrednio stymuluje szyszynkę — "trzecie oko". Przebudza wyższe stany świadomości, wzmacnia jasnowidztwo i połączenie ze swoją wyższą jaźnią.',
    benefits: ['Przebudzenie duchowe', 'Jasnowidztwo', 'Głęboka medytacja', 'Wyższe stany'],
    chakra: '🟣 Ajna', brainwave: 'γ (Gamma)', brainwaveDesc: '30–100 Hz',
    useCase: 'Medytacja głęboka, rozwój duchowy',
    scientificDesc: 'Gamma w zakresie 30–80 Hz jest związana z mistycznymi stanami świadomości opisywanymi przez medytujących mnichów (Lutz et al., 2004, PNAS). Szyszynka wytwarza melatoninę i jest prawdopodobnym miejscem syntezy DMT — substancji psychodelicznej naturalnie obecnej w mózgu.',
    brainwaveState: 'Gamma wysoki — transcendentne doświadczenia, rozszerzona świadomość',
    recommendedActivities: ['Najgłębsza medytacja', 'Praca ze snami świadomymi (lucid dreaming)', 'Praktyki szamańskie', 'Sesje introspekcji przy ciemności'],
  },
  {
    id: '963hz',
    hz: '963 Hz', label: 'Korona', subtitle: 'Jedność z wszechświatem',
    emoji: '✨',
    color: '#E8D5FF', gradientFrom: '#1A0A2E', gradientTo: '#0A0413',
    desc: 'Najwyższa częstotliwość Solfeggio — brama do jedności i oświecenia. Aktywuje szyszynkę, łączy z polem morfogenetycznym i wyższą inteligencją.',
    benefits: ['Stan jedności', 'Oświecenie', 'Połączenie z wszechświatem', 'Głęboki spokój'],
    chakra: '⚪ Sahasrara', brainwave: 'γ (Gamma)', brainwaveDesc: '30–100 Hz',
    useCase: 'Najgłębsza medytacja, przebudzenie duchowe',
    scientificDesc: 'Najwyższa częstotliwość Solfeggio koreluje z Gamma w szerokim paśmie, gdzie synchronizacja obejmuje całą korę mózgową. Ten "binding frequency" jest związany z poczuciem jedności z otoczeniem — doświadczeniem opisywanym jako "ocean świadomości" w tradycjach Advaita Vedanty.',
    brainwaveState: 'Gamma — pełna synchronizacja kortykalna, stan niedualny',
    recommendedActivities: ['Ceremonialne medytacje', 'Praca z intencją duchową', 'Rytuały świętowania', 'Cisza i kontemplacja'],
  },
];

// ─── 7-day program ────────────────────────────────────────────────────────────

interface ProgramDay {
  day: number;
  freqId: BinauralFrequency;
  freqLabel: string;
  minutes: number;
  intention: string;
  emoji: string;
}

const SEVEN_DAY_PROGRAM: ProgramDay[] = [
  { day: 1, freqId: '174hz', freqLabel: 'Fundament', minutes: 30, emoji: '🌍', intention: 'Uziemienie i poczucie bezpieczeństwa — zacznij od fundamentów' },
  { day: 2, freqId: '396hz', freqLabel: 'Wyzwolenie', minutes: 20, emoji: '🔓', intention: 'Uwolnij blokady emocjonalne — pozwól staremu odejść' },
  { day: 3, freqId: '432hz', freqLabel: 'Uzdrowienie', minutes: 25, emoji: '🌿', intention: 'Harmonia i spokój — zestrojenie z rytmem natury' },
  { day: 4, freqId: '528hz', freqLabel: 'Miłość', minutes: 20, emoji: '💚', intention: 'Miłość własna i transformacja — serce się otwiera' },
  { day: 5, freqId: '639hz', freqLabel: 'Połączenie', minutes: 20, emoji: '🤝', intention: 'Relacje i empatia — uzdrowienie więzi' },
  { day: 6, freqId: '852hz', freqLabel: 'Intuicja', minutes: 25, emoji: '🌀', intention: 'Przebudzenie intuicji — słuchaj swojej wyższej jaźni' },
  { day: 7, freqId: '963hz', freqLabel: 'Korona', minutes: 30, emoji: '✨', intention: 'Jedność i integracja — pełny cykl przebudzenia' },
];

// ─── env tips ─────────────────────────────────────────────────────────────────

interface EnvTip {
  title: string;
  emoji: string;
  short: string;
  detail: string;
}

const ENV_TIPS: EnvTip[] = [
  {
    title: 'Słuchawki stereo',
    emoji: '🎧',
    short: 'Absolutna konieczność dla efektu binauralnego',
    detail: 'Efekt binaural powstaje TYLKO gdy lewe i prawe ucho słyszą różne częstotliwości niezależnie. Głośniki mieszają dźwięk zanim dotrze do uszu — efekt znika. Używaj zamkniętych słuchawek wokółusznych lub dousznych z dobrą izolacją.',
  },
  {
    title: 'Ciemne pomieszczenie',
    emoji: '🌑',
    short: 'Minimalizacja stymulacji wzrokowej',
    detail: 'Wzrok dominuje nad pozostałymi zmysłami i pochłania ogromne zasoby uwagi. Zaciemnione pomieszczenie (lub maska na oczy) pozwala mózgowi przekierować zasoby kognitywne na synchronizację fal i eksplorację wewnętrzną.',
  },
  {
    title: 'Pozycja leżąca',
    emoji: '🛋️',
    short: 'Ciało bez napięcia mięśniowego',
    detail: 'Napięcie mięśniowe wysyła do mózgu sygnały proprioceptywne, które utrzymują czuwanie. Leżenie na plecach z rękami wzdłuż ciała (savasana) minimalizuje te sygnały i ułatwia wejście w głębsze stany. Pod kolana możesz podłożyć wałek.',
  },
  {
    title: 'Temperatura 20–22°C',
    emoji: '🌡️',
    short: 'Optymalna strefa termiczna dla relaksu',
    detail: 'Zbyt ciepło prowadzi do ospałości i utrudnia skupienie; zbyt zimno aktywuje układ współczulny. 20–22°C z lekkim kocem to złoty środek — ciało może się rozluźnić bez przechłodzenia.',
  },
  {
    title: 'Minimum 20 minut',
    emoji: '⏱️',
    short: 'Czas potrzebny na synchronizację',
    detail: 'Efekt binaural entrainment jest stopniowy. Pierwsze 5–10 minut to faza wejścia. Głębokie stany mózgu (Theta, Delta) pojawiają się zwykle po 15–20 minutach ciągłej ekspozycji. Nie przerywaj sesji przed upływem 20 minut jeśli to możliwe.',
  },
  {
    title: 'Brak kofeiny 2h przed',
    emoji: '☕',
    short: 'Kofeina blokuje adenozyny receptory',
    detail: 'Kofeina antagonizuje adenozynę — neuroprzekaźnik budujący "presję senną" potrzebną do głębokich stanów Delta i Theta. Jeśli chcesz sesji regeneracyjnej lub medytacyjnej, unikaj kawy przez 2 godziny przed.',
  },
];

// ─── wave animation ───────────────────────────────────────────────────────────

const WaveAnimation = ({ color, active }: { color: string; active: boolean }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) { anim.setValue(0); return; }
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [active, anim]);

  return (
    <View style={wStyles.waveRow}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <Animated.View key={i} style={[wStyles.bar, {
          backgroundColor: color,
          opacity: active ? 0.8 : 0.2,
          transform: [{
            scaleY: active
              ? anim.interpolate({ inputRange: [0, 1], outputRange: [0.3 + (i % 4) * 0.2, 1.0 - (i % 3) * 0.1] })
              : 1,
          }],
          height: 4 + (i % 5) * 4,
        }]} />
      ))}
    </View>
  );
};

const wStyles = StyleSheet.create({
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 28 },
  bar: { width: 3, borderRadius: 2 },
});

// ─── FreqCard (expanded) ──────────────────────────────────────────────────────

const FreqCard = ({
  freq, isActive, onPress, isLight, textColor, subColor,
}: {
  freq: FreqData; isActive: boolean; onPress: () => void;
  isLight: boolean; textColor: string; subColor: string;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [showEffects, setShowEffects] = useState(false);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 12 }}>
      <Pressable onPress={handlePress}>
        <LinearGradient
          colors={
            isActive
              ? isLight
                ? [freq.color + '18', freq.color + '0A']
                : [freq.gradientFrom, freq.gradientTo]
              : isLight
                ? ['rgba(255,255,255,0.96)', 'rgba(245,240,232,0.92)']
                : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']
          }
          style={[
            styles.card,
            isActive && { borderColor: freq.color + (isLight ? '99' : '77'), shadowColor: freq.color, shadowOpacity: isLight ? 0.22 : 0.35, shadowRadius: 18, elevation: 9 },
            !isActive && { borderColor: isLight ? 'rgba(139,100,42,0.28)' : 'rgba(255,255,255,0.10)' },
          ]}
        >
          {isActive && (
            <LinearGradient
              colors={['transparent', freq.color + '99', 'transparent'] as [string, string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 }}
              pointerEvents="none"
            />
          )}
          {isActive && (
            <View style={{ position: 'absolute', top: 10, right: 14, width: 7, height: 7, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: freq.color + '88' }} pointerEvents="none" />
          )}

          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.hzPill, { backgroundColor: freq.color + '20', borderColor: freq.color + '50' }]}>
              <Text style={[styles.hzText, { color: freq.color }]}>{freq.hz}</Text>
            </View>
            <View style={[styles.brainwavePill, { backgroundColor: isLight ? 'rgba(255,246,230,0.95)' : 'rgba(255,255,255,0.06)', borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)' }]}>
              <Text style={[styles.brainwaveText, { color: isLight ? '#555' : '#C0B8B0' }]}>{freq.brainwave}</Text>
              <Text style={[styles.brainwaveRange, { color: isLight ? '#888' : '#807870' }]}>{freq.brainwaveDesc}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <Text style={styles.emoji}>{freq.emoji}</Text>
          </View>

          {/* Title */}
          <View style={styles.titleRow}>
            <View>
              <Text style={[styles.label, { color: isActive ? (isLight ? '#1A1208' : freq.color) : textColor }]}>{freq.label}</Text>
              <Text style={[styles.subtitle, { color: isLight ? 'rgba(0,0,0,0.62)' : subColor }]}>{freq.subtitle}</Text>
            </View>
            <WaveAnimation color={freq.color} active={isActive} />
          </View>

          {/* Description */}
          <Text style={[styles.desc, { color: isLight ? 'rgba(0,0,0,0.72)' : (isActive ? '#C0B8B0' : subColor) }]}>{freq.desc}</Text>

          {/* Benefits */}
          <View style={styles.benefitsRow}>
            {freq.benefits.map(b => (
              <View key={b} style={[styles.benefit, { borderColor: freq.color + (isLight ? '55' : '40'), backgroundColor: freq.color + (isLight ? '18' : '10') }]}>
                <Text style={[styles.benefitText, { color: freq.color }]}>{b}</Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={[styles.chakraText, { color: isLight ? 'rgba(0,0,0,0.65)' : subColor }]}>{freq.chakra}</Text>
            <Text style={[styles.useCaseText, { color: isLight ? 'rgba(0,0,0,0.55)' : '#807870' }]}>📌 {freq.useCase}</Text>
          </View>

          {/* EFEKTY FALI toggle */}
          <Pressable
            onPress={() => setShowEffects(v => !v)}
            style={[styles.effectsToggle, { borderColor: freq.color + '44', backgroundColor: freq.color + '0C' }]}
          >
            <Layers color={freq.color} size={12} strokeWidth={1.8} />
            <Text style={[styles.effectsToggleText, { color: freq.color }]}>
              {showEffects ? 'Zwiń efekty fali' : 'EFEKTY FALI'}
            </Text>
            {showEffects ? <ChevronUp color={freq.color} size={12} /> : <ChevronDown color={freq.color} size={12} />}
          </Pressable>

          {showEffects && (
            <View style={[styles.effectsPanel, { borderColor: freq.color + (isLight ? '44' : '33'), backgroundColor: freq.color + (isLight ? '0D' : '08') }]}>
              {/* Brainwave state diagram */}
              <View style={styles.effectsRow}>
                <Text style={[styles.effectsLabel, { color: freq.color }]}>Stan mózgu</Text>
                <Text style={[styles.effectsValue, { color: isLight ? '#1A1208' : (isActive ? '#F5F1EA' : subColor) }]}>{freq.brainwaveState}</Text>
              </View>
              {/* Scientific description */}
              <View style={[styles.effectsRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.effectsLabel, { color: freq.color }]}>Podstawy naukowe</Text>
                <Text style={[styles.effectsDesc, { color: isLight ? 'rgba(0,0,0,0.68)' : subColor }]}>{freq.scientificDesc}</Text>
              </View>
              {/* Recommended activities */}
              <Text style={[styles.effectsLabel, { color: freq.color, marginTop: 10, marginBottom: 8 }]}>Rekomendowane aktywności</Text>
              {freq.recommendedActivities.map((act, ai) => (
                <View key={ai} style={styles.activityRow}>
                  <View style={[styles.activityDot, { backgroundColor: freq.color }]} />
                  <Text style={[styles.activityText, { color: isLight ? 'rgba(0,0,0,0.68)' : subColor }]}>{act}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Active indicator */}
          {isActive && (
            <View style={[styles.playingBanner, { backgroundColor: freq.color + '18', borderTopColor: freq.color + '30' }]}>
              <View style={[styles.playingDot, { backgroundColor: freq.color }]} />
              <Text style={[styles.playingText, { color: freq.color }]}>ODTWARZANIE — dotknij aby zatrzymać</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

export const BinauralBeatsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  useAudioCleanup();
  const insets = useSafeAreaInsets();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const textColor = isLight ? '#1A1A1A' : '#F5F1EA';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : '#9A8E80';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.045)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.10)';
  const accentColor = isLight ? '#6D28D9' : '#FFD700';
  const isFav = isFavoriteItem('binaural-beats');

  // ─── playback state ───────────────────────────────────────────────────────────
  const [active, setActive] = useState<BinauralFrequency | null>(null);
  const [loading, setLoading] = useState<BinauralFrequency | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── mute toggle ─────────────────────────────────────────────────────────────
  const [isMuted, setIsMuted] = useState(false);
  const toggleMute = useCallback(async () => {
    if (isMuted) {
      // Un-mute: resume the active tone if one is selected
      if (active) await AudioService.playBinauralTone(active);
    } else {
      // Mute: stop audio AND clear active so a subsequent tile tap enters the
      // PLAY branch of toggle() rather than the STOP branch.
      await AudioService.stopBinauralTone();
      setActive(null);
    }
    setIsMuted((m) => !m);
  }, [isMuted, active]);

  // ─── blend state ─────────────────────────────────────────────────────────────
  const [blendPrimary, setBlendPrimary] = useState<BinauralFrequency>('432hz');
  const [blendSecondary, setBlendSecondary] = useState<BinauralFrequency>('528hz');
  const [blendActive, setBlendActive] = useState(false);
  const [showBlendModal, setShowBlendModal] = useState(false);
  const [blendRatio, setBlendRatio] = useState(50); // 0-100: % primary

  // ─── session history ──────────────────────────────────────────────────────────
  const [sessionHistory, setSessionHistory] = useState<BinauralSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // ─── 7-day program ────────────────────────────────────────────────────────────
  const [programDay, setProgramDay] = useState(1);
  const [showProgram, setShowProgram] = useState(false);

  // ─── env tips ─────────────────────────────────────────────────────────────────
  const [expandedTip, setExpandedTip] = useState<number | null>(null);
  const [showTips, setShowTips] = useState(false);

  // ─── session rating modal ─────────────────────────────────────────────────────
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingSession, setPendingSession] = useState<Omit<BinauralSession, 'rating'> | null>(null);
  const [sessionRating, setSessionRating] = useState(0);

  // ─── cleanup ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Preload all binaural tones immediately on mount (not waiting for focus)
    // so the first tap is instant with no audio-load delay.
    const ALL_FREQS: BinauralFrequency[] = ['40hz', '432hz', '528hz', '174hz', '396hz', '639hz', '741hz', '852hz', '963hz'];
    void AudioService.warmBinauralTones(ALL_FREQS);
    return () => {
      void AudioService.stopBinauralTone();
      AudioService.clearBinauralCache();
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, []);

  // ─── re-preload all binaural tones on screen focus (after navigating back) ─────
  useFocusEffect(
    useCallback(() => {
      const ALL_FREQS: BinauralFrequency[] = ['40hz', '432hz', '528hz', '174hz', '396hz', '639hz', '741hz', '852hz', '963hz'];
      void AudioService.warmBinauralTones(ALL_FREQS);
      return () => {
        void AudioService.stopBinauralTone();
        AudioService.clearBinauralCache();
        setActive(null);
      };
    }, [])
  );

  // ─── session timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (active) {
      setSessionSeconds(0);
      sessionTimerRef.current = setInterval(() => setSessionSeconds(s => s + 1), 1000);
    } else {
      if (sessionTimerRef.current) { clearInterval(sessionTimerRef.current); sessionTimerRef.current = null; }
    }
    return () => { if (sessionTimerRef.current) clearInterval(sessionTimerRef.current); };
  }, [active]);

  const formatSessionTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── toggle playback ──────────────────────────────────────────────────────────
  // Binaural tones bypass the global isMuted flag — the user explicitly chose
  // a frequency tile, so we always play regardless of mute state.
  const toggle = useCallback(async (id: BinauralFrequency) => {
    if (active === id && !isMuted) {
      // Second tap on the same active tile → stop
      const completedSeconds = sessionSeconds;
      const freq = FREQS.find(f => f.id === id);
      setLoading(id);
      await AudioService.stopBinauralTone();
      setActive(null);
      setLoading(null);
      if (completedSeconds > 30 && freq) {
        setPendingSession({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          freqId: id,
          freqLabel: freq.label,
          durationSeconds: completedSeconds,
        });
        setSessionRating(0);
        setShowRatingModal(true);
      }
      return;
    }
    // Always play — binaural intent ignores mute
    if (isMuted) setIsMuted(false);
    setLoading(id);
    await AudioService.stopBinauralTone();
    await AudioService.playBinauralTone(id);
    setActive(id);
    setLoading(null);
  }, [active, isMuted, sessionSeconds]);

  const saveSession = (r: number) => {
    if (!pendingSession) return;
    const session: BinauralSession = { ...pendingSession, rating: r };
    setSessionHistory(prev => [session, ...prev].slice(0, 7));
    setPendingSession(null);
    setShowRatingModal(false);
  };

  // ─── blend start ─────────────────────────────────────────────────────────────
  const startBlend = async () => {
    await AudioService.stopBinauralTone();
    await AudioService.playBinauralTone(blendPrimary);
    setBlendActive(true);
    setShowBlendModal(false);
  };

  const stopBlend = async () => {
    await AudioService.stopBinauralTone();
    setBlendActive(false);
  };

  const activeFreq = FREQS.find(f => f.id === active);
  const primaryFreq = FREQS.find(f => f.id === blendPrimary);
  const secondaryFreq = FREQS.find(f => f.id === blendSecondary);

  return (
    <View style={[styles.safe, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={isLight ? ['#F5F0FF', '#EDE6FF', '#F9F5FF'] : ['#05060A', '#080812', '#0A0818']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>

        {/* ─── Session Rating Modal ─── */}
        <Modal visible={showRatingModal} transparent animationType="fade" onRequestClose={() => setShowRatingModal(false)}>
          <View style={styles.ratingOverlay}>
            <View style={[styles.ratingSheet, { backgroundColor: isLight ? '#FDFBF7' : '#15121E', borderColor: cardBorder }]}>
              <Text style={[styles.ratingTitle, { color: textColor }]}>Jak oceniasz sesję?</Text>
              {pendingSession && (
                <Text style={[styles.ratingSubtitle, { color: subColor }]}>
                  {FREQS.find(f => f.id === pendingSession.freqId)?.emoji} {pendingSession.freqLabel} · {formatSessionTime(pendingSession.durationSeconds)}
                </Text>
              )}
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Pressable key={n} onPress={() => setSessionRating(n)} hitSlop={10}>
                    <Star size={32} color={accentColor} fill={n <= sessionRating ? accentColor : 'none'} strokeWidth={1.5} />
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={() => saveSession(sessionRating)}
                style={[styles.ratingConfirmBtn, { backgroundColor: accentColor }]}
              >
                <Text style={[styles.ratingConfirmText, { color: isLight ? '#FFF' : '#000' }]}>Zapisz sesję</Text>
              </Pressable>
              <Pressable onPress={() => setShowRatingModal(false)} style={{ marginTop: 10, alignItems: 'center' }}>
                <Text style={{ color: subColor, fontSize: 13 }}>Pomiń</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* ─── Blend Modal ─── */}
        <Modal visible={showBlendModal} transparent animationType="slide" onRequestClose={() => setShowBlendModal(false)}>
          <Pressable style={styles.blendOverlay} onPress={() => setShowBlendModal(false)} />
          <View style={[styles.blendSheet, { backgroundColor: isLight ? '#FDFBF7' : '#15121E', borderColor: cardBorder }]}>
            <View style={styles.blendHandle} />
            <Text style={[styles.blendTitle, { color: textColor }]}>SESJA CUSTOM — Mieszanie fal</Text>
            <Text style={[styles.blendSubtitle, { color: subColor }]}>
              Wybierz dwie częstotliwości do blendowania. Unikatowy efekt binauralny między ich stanami.
            </Text>
            {/* Primary picker */}
            <Text style={[styles.blendLabel, { color: accentColor }]}>Fala bazowa</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {FREQS.map(f => (
                <Pressable
                  key={f.id}
                  onPress={() => setBlendPrimary(f.id)}
                  style={[styles.blendChip, {
                    backgroundColor: blendPrimary === f.id ? f.color + '22' : cardBg,
                    borderColor: blendPrimary === f.id ? f.color : cardBorder,
                  }]}
                >
                  <Text style={{ fontSize: 13, color: blendPrimary === f.id ? f.color : subColor, fontWeight: '700' }}>
                    {f.emoji} {f.label}
                  </Text>
                  <Text style={{ fontSize: 10, color: subColor, marginTop: 2 }}>{f.hz}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {/* Secondary picker */}
            <Text style={[styles.blendLabel, { color: accentColor }]}>Fala uzupełniająca</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {FREQS.map(f => (
                <Pressable
                  key={f.id}
                  onPress={() => setBlendSecondary(f.id)}
                  style={[styles.blendChip, {
                    backgroundColor: blendSecondary === f.id ? f.color + '22' : cardBg,
                    borderColor: blendSecondary === f.id ? f.color : cardBorder,
                  }]}
                >
                  <Text style={{ fontSize: 13, color: blendSecondary === f.id ? f.color : subColor, fontWeight: '700' }}>
                    {f.emoji} {f.label}
                  </Text>
                  <Text style={{ fontSize: 10, color: subColor, marginTop: 2 }}>{f.hz}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {/* Description of blend */}
            {primaryFreq && secondaryFreq && (
              <View style={[styles.blendPreview, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.blendPreviewText, { color: textColor }]}>
                  {primaryFreq.emoji} {primaryFreq.label} + {secondaryFreq.emoji} {secondaryFreq.label}
                </Text>
                <Text style={[styles.blendPreviewDesc, { color: subColor }]}>
                  {primaryFreq.brainwaveState.split('—')[0].trim()} + {secondaryFreq.brainwaveState.split('—')[0].trim()}
                </Text>
              </View>
            )}
            <Pressable
              onPress={startBlend}
              style={[styles.blendStartBtn, { backgroundColor: accentColor }]}
            >
              <Sliders color={isLight ? '#FFF' : '#000'} size={15} />
              <Text style={[styles.blendStartText, { color: isLight ? '#FFF' : '#000' }]}>Rozpocznij blend</Text>
            </Pressable>
          </View>
        </Modal>

        {/* ─── Navigation Header ─── */}
        <View style={[styles.navHeader, { paddingTop: 4 }]}>
          <Pressable onPress={() => navigation ? goBackOrToMainTab(navigation, 'Worlds') : undefined} hitSlop={12}>
            <ChevronLeft color={accentColor} size={24} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Typography variant="premiumLabel" color={accentColor}>Świat Wsparcia</Typography>
            <Typography variant="screenTitle" style={{ color: textColor, marginTop: 2 }}>Fale Mózgowe</Typography>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <MusicToggleButton color={accentColor} size={18} />
            <Pressable onPress={toggleMute} hitSlop={12}>
              {isMuted
                ? <VolumeX color={accentColor} size={18} strokeWidth={1.8} />
                : <Volume2 color={accentColor + '88'} size={18} strokeWidth={1.8} />
              }
            </Pressable>
            <Pressable
              hitSlop={12}
              onPress={() => { if (isFav) { removeFavoriteItem('binaural-beats'); } else { addFavoriteItem({ id: 'binaural-beats', label: 'Fale Mózgowe', route: 'BinauralBeats', params: {}, icon: 'Zap', color: '#FFD700', addedAt: new Date().toISOString() }); } }}
            >
              <Star color={isFav ? '#FFD700' : (isLight ? '#6D28D9' : '#FFD70077')} size={18} fill={isFav ? '#FFD700' : 'none'} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Header card ─── */}
          <View style={[styles.header, { backgroundColor: cardBg, borderColor: isLight ? 'rgba(109,40,217,0.20)' : 'rgba(255,215,0,0.20)' }]}>
            <LinearGradient
              colors={isLight ? ['rgba(109,40,217,0.10)', 'rgba(147,112,219,0.05)', 'transparent'] : ['rgba(255,215,0,0.14)', 'rgba(147,112,219,0.08)', 'transparent']}
              style={StyleSheet.absoluteFillObject}
            />
            <Typography variant="premiumLabel" color={accentColor}>⚡ FREQ STUDIO</Typography>
            <Typography variant="heroTitle" style={{ color: textColor, fontSize: 28, lineHeight: 36, marginTop: 4 }}>
              Rytmy binauralne i stany świadomości
            </Typography>
            <Typography variant="bodyRefined" style={{ color: subColor, marginTop: 6, marginBottom: 14 }}>
              To nie jest zwykła playlista. Każda częstotliwość otwiera inny stan: regenerację, fokus, relaks, intuicję albo głębszą pracę duchową.
            </Typography>
            <View style={styles.headerPills}>
              <View style={[styles.headerPill, { borderColor: isLight ? 'rgba(109,40,217,0.20)' : 'rgba(255,215,0,0.18)', backgroundColor: isLight ? 'rgba(109,40,217,0.08)' : 'rgba(255,215,0,0.08)' }]}>
                <Text style={[styles.headerPillText, { color: isLight ? '#6D28D9' : '#F4D78A' }]}>delta • theta • alpha • gamma</Text>
              </View>
              <View style={[styles.headerPill, { borderColor: isLight ? 'rgba(109,40,217,0.20)' : 'rgba(255,215,0,0.18)', backgroundColor: isLight ? 'rgba(109,40,217,0.08)' : 'rgba(255,215,0,0.08)' }]}>
                <Text style={[styles.headerPillText, { color: isLight ? '#6D28D9' : '#F4D78A' }]}>najlepiej w słuchawkach stereo</Text>
              </View>
            </View>
            <View style={[styles.tipCard, { backgroundColor: isLight ? 'rgba(160,120,255,0.08)' : 'rgba(160,120,255,0.08)', borderColor: isLight ? 'rgba(160,120,255,0.25)' : 'rgba(160,120,255,0.2)' }]}>
              <Text style={styles.tipIcon}>🎧</Text>
              <Text style={[styles.tipText, { color: isLight ? '#7C3AED' : '#A090C8' }]}>
                Używaj słuchawek stereo dla pełnego efektu binauralnego. Dotknij kartę ponownie aby zatrzymać dźwięk.
              </Text>
            </View>
          </View>

          {/* ─── Active display ─── */}
          {(activeFreq || blendActive) && (
            <View style={[styles.activeBar, { borderColor: (activeFreq?.color || '#FFD700') + '44', backgroundColor: (activeFreq?.color || '#FFD700') + '08' }]}>
              <View style={[styles.activeDot, { backgroundColor: activeFreq?.color || '#FFD700' }]} />
              <View style={{ flex: 1 }}>
                <Typography variant="label" style={[styles.activeLabel, { color: activeFreq?.color || '#FFD700' }]}>
                  {blendActive
                    ? `${primaryFreq?.emoji} ${primaryFreq?.label} ⟷ ${secondaryFreq?.emoji} ${secondaryFreq?.label}`
                    : `${activeFreq?.emoji} ${activeFreq?.label} — ${activeFreq?.hz}`}
                </Typography>
                <Text style={{ fontSize: 11, color: (activeFreq?.color || '#FFD700') + '88', marginTop: 2 }}>
                  ⏱ {formatSessionTime(sessionSeconds)} aktywne
                </Text>
              </View>
              <Pressable
                onPress={() => blendActive ? stopBlend() : (activeFreq ? toggle(activeFreq.id) : undefined)}
                style={[styles.stopBtn, { borderColor: (activeFreq?.color || '#FFD700') + '60' }]}
              >
                <Text style={[styles.stopBtnText, { color: activeFreq?.color || '#FFD700' }]}>◼ Stop</Text>
              </Pressable>
            </View>
          )}

          {/* ─── Daily recommendation ─── */}
          <View style={[styles.infoBox, { backgroundColor: cardBg, borderColor: cardBorder, marginBottom: 16 }]}>
            <Sparkles color={accentColor} size={16} strokeWidth={1.6} />
            <Typography variant="premiumLabel" color={accentColor} style={{ marginTop: 8, marginBottom: 6 }}>🌟 REKOMENDACJA NA DZIŚ</Typography>
            <Typography variant="bodyRefined" style={{ color: subColor, lineHeight: 22 }}>
              {(() => {
                const h = new Date().getHours();
                if (h < 9) return 'Rano: 174 Hz (Fundament) lub 432 Hz (Uzdrowienie) — delikatne przebudzenie i harmonia na start dnia.';
                if (h < 13) return 'Przedpołudnie: 40 Hz (Gamma) lub 741 Hz (Ekspresja) — szczytowa koncentracja i kreatywność.';
                if (h < 17) return 'Popołudnie: 528 Hz (Miłość) lub 639 Hz (Połączenie) — dobry czas na pracę z sercem i relacjami.';
                if (h < 21) return 'Wieczór: 396 Hz (Wyzwolenie) lub 852 Hz (Intuicja) — uwalnianie napięcia i głęboka refleksja.';
                return 'Noc: 174 Hz (Fundament) lub 963 Hz (Korona) — głęboki spokój i sen regenerujący.';
              })()}
            </Typography>
          </View>

          {/* ─── PORADA PRZED SESJĄ ─── */}
          <View style={[styles.sectionContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Pressable onPress={() => setShowTips(v => !v)} style={styles.sectionToggle}>
              <View style={[styles.sectionIconCircle, { backgroundColor: accentColor + '18' }]}>
                <BookOpen color={accentColor} size={16} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionToggleLabel, { color: accentColor }]}>PORADA PRZED SESJĄ</Text>
                <Text style={[styles.sectionToggleSub, { color: subColor }]}>Środowisko, pozycja, czas trwania</Text>
              </View>
              {showTips ? <ChevronUp color={accentColor} size={16} /> : <ChevronDown color={accentColor} size={16} />}
            </Pressable>
            {showTips && (
              <View style={{ marginTop: 10, gap: 8 }}>
                {ENV_TIPS.map((tip, ti) => (
                  <Pressable
                    key={tip.title}
                    onPress={() => setExpandedTip(expandedTip === ti ? null : ti)}
                    style={[styles.tipExpCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', borderColor: expandedTip === ti ? accentColor + '44' : cardBorder }]}
                  >
                    <View style={styles.tipExpHeader}>
                      <Text style={styles.tipExpEmoji}>{tip.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.tipExpTitle, { color: textColor }]}>{tip.title}</Text>
                        <Text style={[styles.tipExpShort, { color: subColor }]}>{tip.short}</Text>
                      </View>
                      {expandedTip === ti ? <ChevronUp color={accentColor} size={14} /> : <ChevronDown color={subColor} size={14} />}
                    </View>
                    {expandedTip === ti && (
                      <Text style={[styles.tipExpDetail, { color: subColor }]}>{tip.detail}</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* ─── Frequency cards ─── */}
          <View style={[styles.sectionHeader, { marginTop: 20 }]}>
            <Text style={[styles.sectionTitle, { color: accentColor }]}>CZĘSTOTLIWOŚCI</Text>
          </View>
          <View style={styles.list}>
            {FREQS.map(f => (
              <FreqCard
                key={f.id} freq={f}
                isActive={active === f.id}
                onPress={() => toggle(f.id)}
                isLight={isLight}
                textColor={textColor}
                subColor={subColor}
              />
            ))}
          </View>

          {/* ─── SESJA CUSTOM ─── */}
          <View style={[styles.customBlock, { backgroundColor: cardBg, borderColor: isLight ? 'rgba(109,40,217,0.22)' : 'rgba(255,215,0,0.22)' }]}>
            <LinearGradient
              colors={isLight ? ['rgba(109,40,217,0.08)', 'transparent'] : ['rgba(255,215,0,0.10)', 'transparent']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Sliders color={accentColor} size={16} strokeWidth={1.8} />
              <Text style={[styles.customTitle, { color: accentColor }]}>SESJA CUSTOM</Text>
            </View>
            <Text style={[styles.customDesc, { color: subColor }]}>
              Połącz dwie częstotliwości — stwórz unikatowy stan między Theta a Alpha, Gamma a Beta lub dowolną kombinacją. Efekt binaural reaguje na różnicę częstotliwości.
            </Text>
            {blendActive ? (
              <View>
                <View style={styles.blendActiveRow}>
                  <View style={[styles.blendActivePill, { backgroundColor: (primaryFreq?.color || accentColor) + '18', borderColor: primaryFreq?.color || accentColor }]}>
                    <Text style={[styles.blendActivePillText, { color: primaryFreq?.color || accentColor }]}>
                      {primaryFreq?.emoji} {primaryFreq?.label}
                    </Text>
                  </View>
                  <Text style={{ color: subColor, fontSize: 16 }}>⟷</Text>
                  <View style={[styles.blendActivePill, { backgroundColor: (secondaryFreq?.color || accentColor) + '18', borderColor: secondaryFreq?.color || accentColor }]}>
                    <Text style={[styles.blendActivePillText, { color: secondaryFreq?.color || accentColor }]}>
                      {secondaryFreq?.emoji} {secondaryFreq?.label}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={stopBlend} style={[styles.customStopBtn, { borderColor: accentColor + '55' }]}>
                  <Text style={[styles.customStopText, { color: accentColor }]}>◼ Zatrzymaj blend</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setShowBlendModal(true)} style={[styles.customStartBtn, { backgroundColor: accentColor }]}>
                <Sliders color={isLight ? '#FFF' : '#000'} size={14} />
                <Text style={[styles.customStartText, { color: isLight ? '#FFF' : '#000' }]}>Konfiguruj blend</Text>
              </Pressable>
            )}
          </View>

          {/* ─── PROGRAM 7-dniowy ─── */}
          <View style={[styles.sectionContainer, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 16 }]}>
            <Pressable onPress={() => setShowProgram(v => !v)} style={styles.sectionToggle}>
              <View style={[styles.sectionIconCircle, { backgroundColor: accentColor + '18' }]}>
                <Calendar color={accentColor} size={16} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionToggleLabel, { color: accentColor }]}>PROGRAM 7-DNIOWY</Text>
                <Text style={[styles.sectionToggleSub, { color: subColor }]}>Strukturalny trening fal mózgowych</Text>
              </View>
              {showProgram ? <ChevronUp color={accentColor} size={16} /> : <ChevronDown color={accentColor} size={16} />}
            </Pressable>
            {showProgram && (
              <View style={{ marginTop: 14, gap: 10 }}>
                <Text style={[styles.programIntro, { color: subColor }]}>
                  Jeden tydzień — każdy dzień inna fala. Przejdź przez pełny spektrum od fundamentu (Delta) do Korony (Gamma), pozwalając mózgowi adaptować się stopniowo.
                </Text>
                {SEVEN_DAY_PROGRAM.map((pd) => {
                  const freq = FREQS.find(f => f.id === pd.freqId);
                  const isDone = pd.day < programDay;
                  const isToday = pd.day === programDay;
                  return (
                    <View
                      key={pd.day}
                      style={[
                        styles.programDayCard,
                        {
                          backgroundColor: isToday ? (freq?.color || accentColor) + '14' : cardBg,
                          borderColor: isToday ? (freq?.color || accentColor) + '55' : cardBorder,
                          opacity: isDone ? 0.6 : 1,
                        },
                      ]}
                    >
                      <View style={[styles.programDayBadge, { backgroundColor: isToday ? (freq?.color || accentColor) : (isDone ? '#4CAF50' : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)')) }]}>
                        {isDone
                          ? <CheckCircle color="#FFF" size={13} />
                          : <Text style={{ color: isToday ? '#FFF' : subColor, fontSize: 12, fontWeight: '700' }}>{pd.day}</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.programDayLabel, { color: isToday ? (freq?.color || accentColor) : textColor }]}>
                          Dzień {pd.day} — {pd.emoji} {pd.freqLabel}
                        </Text>
                        <Text style={[styles.programDayIntention, { color: subColor }]}>{pd.intention}</Text>
                        <Text style={[styles.programDayMeta, { color: subColor }]}>
                          <Clock size={10} color={subColor} /> {pd.minutes} minut
                        </Text>
                      </View>
                      {isToday && (
                        <Pressable
                          onPress={() => toggle(pd.freqId)}
                          style={[styles.programPlayBtn, { backgroundColor: (freq?.color || accentColor) + '22', borderColor: freq?.color || accentColor }]}
                        >
                          <Zap color={freq?.color || accentColor} size={14} />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  <Pressable
                    onPress={() => setProgramDay(d => Math.max(1, d - 1))}
                    style={[styles.programNavBtn, { borderColor: cardBorder }]}
                    disabled={programDay === 1}
                  >
                    <Text style={[styles.programNavText, { color: programDay === 1 ? subColor : textColor }]}>← Poprzedni</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setProgramDay(d => Math.min(7, d + 1))}
                    style={[styles.programNavBtn, { borderColor: cardBorder, flex: 1 }]}
                    disabled={programDay === 7}
                  >
                    <Text style={[styles.programNavText, { color: programDay === 7 ? subColor : accentColor }]}>Następny dzień →</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* ─── HISTORIA SESJI ─── */}
          <View style={[styles.sectionContainer, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 16 }]}>
            <Pressable onPress={() => setShowHistory(v => !v)} style={styles.sectionToggle}>
              <View style={[styles.sectionIconCircle, { backgroundColor: accentColor + '18' }]}>
                <Clock color={accentColor} size={16} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionToggleLabel, { color: accentColor }]}>HISTORIA SESJI</Text>
                <Text style={[styles.sectionToggleSub, { color: subColor }]}>
                  {sessionHistory.length > 0 ? `${sessionHistory.length} ostatnich sesji` : 'Brak jeszcze sesji'}
                </Text>
              </View>
              {showHistory ? <ChevronUp color={accentColor} size={16} /> : <ChevronDown color={accentColor} size={16} />}
            </Pressable>
            {showHistory && (
              <View style={{ marginTop: 10, gap: 8 }}>
                {sessionHistory.length === 0 ? (
                  <Text style={[styles.historyEmpty, { color: subColor }]}>
                    Twoje sesje pojawią się tutaj po zakończeniu odtwarzania (min. 30 sekund). Historia przechowuje 7 ostatnich sesji.
                  </Text>
                ) : (
                  sessionHistory.map((sess, si) => {
                    const freq = FREQS.find(f => f.id === sess.freqId);
                    const d = new Date(sess.date);
                    return (
                      <View key={sess.id} style={[styles.historyItem, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', borderColor: (freq?.color || accentColor) + '33' }]}>
                        <View style={[styles.historyDot, { backgroundColor: freq?.color || accentColor }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.historyLabel, { color: textColor }]}>
                            {freq?.emoji} {sess.freqLabel} · {formatSessionTime(sess.durationSeconds)}
                          </Text>
                          <Text style={[styles.historyDate, { color: subColor }]}>
                            {sess.date ? `${d.toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString(getLocaleCode(), { hour: '2-digit', minute: '2-digit' })}` : '—'}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={10} color={accentColor} fill={n <= sess.rating ? accentColor : 'none'} strokeWidth={1.5} />
                          ))}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>

          {/* ─── How it works ─── */}
          <View style={[styles.infoBox, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 16 }]}>
            <Typography variant="cardTitle" style={{ color: textColor }}>🧠 Jak działają rytmy binauralne?</Typography>
            <Typography variant="bodyRefined" style={{ color: subColor, marginTop: 10, marginBottom: 16, lineHeight: 22 }}>
              Gdy lewe ucho słyszy 200 Hz a prawe 210 Hz, mózg odbiera różnicę 10 Hz. Ten efekt, zwany synchronizacją hemisferyczną, pomaga wejść w pożądany stan bez substancji psychoaktywnych.
            </Typography>
            <View style={styles.infoGrid}>
              {[
                { wave: 'δ Delta', range: '0.5–4 Hz', state: 'Głęboki sen, regeneracja' },
                { wave: 'θ Theta', range: '4–8 Hz', state: 'Medytacja, kreatywność' },
                { wave: 'α Alpha', range: '8–14 Hz', state: 'Relaks, spokój' },
                { wave: 'β Beta', range: '14–30 Hz', state: 'Skupienie, aktywność' },
                { wave: 'γ Gamma', range: '30–100 Hz', state: 'Świadomość, integracja' },
              ].map(w => (
                <View key={w.wave} style={styles.waveRow}>
                  <Text style={[styles.waveSymbol, { color: textColor }]}>{w.wave}</Text>
                  <Text style={[styles.waveRange, { color: subColor }]}>{w.range}</Text>
                  <Text style={[styles.waveState, { color: subColor }]}>{w.state}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ─── CO DALEJ? ─── */}
          <View style={{ marginTop: 16, paddingHorizontal: 0 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.8, color: accentColor, marginBottom: 12 }}>✦ CO DALEJ?</Text>
            {[
              { icon: Wind, label: 'Pranajama i oddech', sub: 'Połącz z oddechem — Breathwork w tle sesji', color: '#34D399', route: 'Breathwork' },
              { icon: Headphones, label: 'Kąpiel dźwiękowa', sub: 'Kontynuuj immersję w pejzażach dźwięku', color: '#60A5FA', route: 'SoundBath' },
              { icon: Moon, label: 'Medytacja prowadzona', sub: 'Wejdź w głębszą ciszę po sesji fal', color: '#A78BFA', route: 'Meditation' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => navigation.navigate(item.route as any)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10,
                    backgroundColor: cardBg, borderColor: item.color + '33',
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: item.color + '18' }}>
                    <Icon color={item.color} size={17} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{item.label}</Text>
                    <Text style={{ fontSize: 12, color: subColor, marginTop: 2, lineHeight: 18 }}>{item.sub}</Text>
                  </View>
                  <ArrowRight color={item.color} size={15} strokeWidth={1.5} />
                </Pressable>
              );
            })}
          </View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  navHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  scroll: { padding: 20 },

  // Header
  header: { marginBottom: 24, borderRadius: 28, borderWidth: 1, padding: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  headerPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  headerPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  headerPillText: { fontSize: 11, fontWeight: '700' },
  tipCard: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'flex-start' },
  tipIcon: { fontSize: 20 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },

  // Active bar
  activeBar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 16 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  activeLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  stopBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  stopBtnText: { fontSize: 12, fontWeight: '700' },

  // Cards
  list: { gap: 0 },
  card: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', padding: 20, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  hzPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  hzText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  brainwavePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  brainwaveText: { fontSize: 11, fontWeight: '700' },
  brainwaveRange: { fontSize: 9, letterSpacing: 0.3 },
  emoji: { fontSize: 28 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  subtitle: { fontSize: 12, letterSpacing: 0.5 },
  desc: { fontSize: 13, lineHeight: 21, marginBottom: 14 },
  benefitsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  benefit: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  benefitText: { fontSize: 11, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chakraText: { fontSize: 12 },
  useCaseText: { fontSize: 11, flex: 1, textAlign: 'right' },
  playingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, marginHorizontal: -18, marginBottom: -18, paddingHorizontal: 18, paddingVertical: 10, borderTopWidth: 1 },
  playingDot: { width: 7, height: 7, borderRadius: 4 },
  playingText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },

  // Effects panel
  effectsToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  effectsToggleText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  effectsPanel: { marginTop: 12, borderRadius: 14, borderWidth: 1, padding: 16 },
  effectsRow: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(128,128,128,0.12)', paddingBottom: 12, marginBottom: 12 },
  effectsLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.0, marginBottom: 6 },
  effectsValue: { fontSize: 13.5, fontWeight: '600', lineHeight: 20 },
  effectsDesc: { fontSize: 12.5, lineHeight: 20 },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  activityDot: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
  activityText: { fontSize: 13, lineHeight: 20, flex: 1 },

  // Info box
  infoBox: { padding: 22, borderRadius: 24, borderWidth: 1 },
  infoGrid: { gap: 8 },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  waveSymbol: { fontSize: 13, fontWeight: '700', width: 55 },
  waveRange: { fontSize: 12, width: 75 },
  waveState: { fontSize: 12, flex: 1 },

  // Section containers (tips / history / program)
  sectionContainer: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
  sectionToggle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionIconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  sectionToggleLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.0 },
  sectionToggleSub: { fontSize: 12, marginTop: 2 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },

  // Env tips cards
  tipExpCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  tipExpHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipExpEmoji: { fontSize: 22, width: 30 },
  tipExpTitle: { fontSize: 14, fontWeight: '700' },
  tipExpShort: { fontSize: 12, marginTop: 2 },
  tipExpDetail: { fontSize: 13, lineHeight: 21, marginTop: 12 },

  // Custom blend
  customBlock: { borderRadius: 22, borderWidth: 1, padding: 20, overflow: 'hidden', marginTop: 0 },
  customTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  customDesc: { fontSize: 13.5, lineHeight: 22, marginBottom: 16 },
  customStartBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 22, alignSelf: 'flex-start' },
  customStartText: { fontSize: 13, fontWeight: '700' },
  customStopBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start', marginTop: 12 },
  customStopText: { fontSize: 13, fontWeight: '700' },
  blendActiveRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  blendActivePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  blendActivePillText: { fontSize: 13, fontWeight: '700' },

  // 7-day program
  programIntro: { fontSize: 13.5, lineHeight: 22, marginBottom: 6 },
  programDayCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  programDayBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  programDayLabel: { fontSize: 14, fontWeight: '700' },
  programDayIntention: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  programDayMeta: { fontSize: 11, marginTop: 4 },
  programPlayBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  programNavBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 14 },
  programNavText: { fontSize: 13, fontWeight: '600' },

  // Session history
  historyEmpty: { fontSize: 13, lineHeight: 21, fontStyle: 'italic' },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  historyDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  historyLabel: { fontSize: 13, fontWeight: '700' },
  historyDate: { fontSize: 11, marginTop: 2 },

  // Rating modal
  ratingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  ratingSheet: { width: '100%', borderRadius: 24, padding: 28, borderWidth: 1, alignItems: 'center' },
  ratingTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  ratingSubtitle: { fontSize: 13, marginBottom: 20 },
  ratingStars: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  ratingConfirmBtn: { width: '100%', height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  ratingConfirmText: { fontSize: 14, fontWeight: '700' },

  // Blend modal
  blendOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  blendSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 24, paddingBottom: 44 },
  blendHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.30)', alignSelf: 'center', marginBottom: 18 },
  blendTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1.0, marginBottom: 8 },
  blendSubtitle: { fontSize: 13.5, lineHeight: 21, marginBottom: 16 },
  blendLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.0, marginBottom: 10 },
  blendChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, marginRight: 8, alignItems: 'center', minWidth: 80 },
  blendPreview: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
  blendPreviewText: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  blendPreviewDesc: { fontSize: 12, lineHeight: 19 },
  blendStartBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 13, borderRadius: 22, alignSelf: 'stretch', justifyContent: 'center' },
  blendStartText: { fontSize: 14, fontWeight: '700' },
});

export default BinauralBeatsScreen;
