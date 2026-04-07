// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';
import {
  ChevronLeft,
  Wind,
  Brain,
  ArrowRight,
  Moon,
  Sparkles,
  Headphones,
  Armchair,
  Eye,
  History,
  Clock,
  Target,
  Star,
  Volume2,
  VolumeX,
  Layers,
  Zap,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Music2,
  Activity,
  Heart,
  Sun,
  X,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAudioCleanup } from '../core/hooks/useAudioCleanup';
import { AudioService, AMBIENT_SOUND_OPTIONS } from '../core/services/audio.service';
import type { AmbientSoundscape } from '../core/services/audio.service';
import { getResolvedTheme } from '../core/theme/tokens';
import { useAppStore } from '../store/useAppStore';
import { layout } from '../core/theme/designSystem';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');

// ── Types ─────────────────────────────────────────────────────────────────────

interface SessionHistoryEntry {
  id: AmbientSoundscape;
  secondId?: AmbientSoundscape | null;
  duration: number;
  date: string;
  intention?: string;
  moodBefore?: number;
  moodAfter?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DURATIONS = [
  { label: '5 min',  value: 5  },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '20 min', value: 20 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '∞',      value: 0  },
];

const SESSION_INTENTIONS = [
  { id: 'relaks',      label: 'Relaks',      emoji: '🛋️', color: '#67D1FF' },
  { id: 'sen',         label: 'Sen',         emoji: '🌙', color: '#8B5CF6' },
  { id: 'medytacja',   label: 'Medytacja',   emoji: '🧘', color: '#A78BFA' },
  { id: 'skupienie',   label: 'Skupienie',   emoji: '🎯', color: '#60A5FA' },
  { id: 'uzdrowienie', label: 'Uzdrowienie', emoji: '💚', color: '#34D399' },
  { id: 'oczyszczenie',label: 'Oczyszczenie',emoji: '🌊', color: '#4ADE80' },
];

const INTENTION_RECOMMENDATIONS: Record<string, AmbientSoundscape[]> = {
  relaks:       ['waves', 'forest'],
  sen:          ['night', 'rain'],
  medytacja:    ['ritual', 'cave'],
  skupienie:    ['cave', 'forest'],
  uzdrowienie:  ['waves', 'forest'],
  oczyszczenie: ['waves', 'rain'],
};

// Extended soundscape library (12 entries). IDs beyond core 8 reuse closest
// available AudioService key so playback works with existing audio files.
type SoundEntry = {
  id: AmbientSoundscape;
  label: string;
  emoji: string;
  accent: string;
  title: string;
  copy: string;
  category: 'natura' | 'ceremonia' | 'mistyczny';
};

const ALL_SOUNDSCAPES: SoundEntry[] = [
  { id: 'rain',   label: 'Deszcz',             emoji: '🌧️', accent: '#8FB7FF', category: 'natura',    title: 'Deszczowa regulacja',    copy: 'Miękkie wyhamowanie, sen i domknięcie nadmiaru bodźców.' },
  { id: 'waves',  label: 'Ocean',              emoji: '🌊', accent: '#67D1FF', category: 'natura',    title: 'Fale i koherencja',      copy: 'Równowaga, oddech i płynniejszy rytm układu nerwowego.' },
  { id: 'fire',   label: 'Ognisko',            emoji: '🔥', accent: '#F59E0B', category: 'natura',    title: 'Ogień i skupienie',      copy: 'Ciepło, obecność i mocniejsza koncentracja bez pośpiechu.' },
  { id: 'forest', label: 'Las',                emoji: '🌲', accent: '#34D399', category: 'natura',    title: 'Las i grunt',            copy: 'Stabilizacja, regeneracja i powrót do prostego centrum.' },
  { id: 'wind',   label: 'Wiatr',              emoji: '💨', accent: '#CBD5E1', category: 'natura',    title: 'Wiatr i reset',          copy: 'Przewietrzenie umysłu i lżejsze wyjście z przeciążenia.' },
  { id: 'night',  label: 'Noc',               emoji: '🌙', accent: '#A78BFA', category: 'natura',    title: 'Noc i ukojenie',         copy: 'Spokojne schodzenie z intensywności dnia w ciszę i miękkość.' },
  { id: 'cave',   label: 'Jaskinia',           emoji: '🪨', accent: '#B08968', category: 'natura',    title: 'Jaskinia i głębia',      copy: 'Kontener ciszy dla głębokiego skupienia i zejścia pod powierzchnię.' },
  { id: 'ritual', label: 'Rytuał',             emoji: '🕯️', accent: '#CEAE72', category: 'ceremonia', title: 'Rytualna komnata',       copy: 'Ceremonialne tło do praktyki, journalingu i czytania symboli.' },
  // Extra entries mapped to existing audio files
  { id: 'waves',  label: 'Misy tybetańskie',   emoji: '🔔', accent: '#DDD6FE', category: 'ceremonia', title: 'Misy tybetańskie',       copy: 'Wibracje mis wyrównują energię i wprowadzają w stan alfa.' },
  { id: 'ritual', label: 'Kryształowe misy',   emoji: '💎', accent: '#BAE6FD', category: 'ceremonia', title: 'Kryształowe misy',       copy: 'Czyste tony krystaliczne aktywują koherencję serca i głowy.' },
  { id: 'waves',  label: 'Wieloryby',          emoji: '🐋', accent: '#38BDF8', category: 'mistyczny', title: 'Pieśni wielorybów',      copy: 'Niskie, potężne głosy otwierają świadomość głębin i intuicji.' },
  { id: 'wind',   label: 'Wodospad',           emoji: '🏞️', accent: '#6EE7B7', category: 'natura',    title: 'Wodospad i oczyszczenie',copy: 'Potężny, ciągły szum wody wymywa napięcie z ciała i umysłu.' },
];

// Deduplicate by label — show unique entries in the full grid
const UNIQUE_SOUNDSCAPES = Array.from(
  new Map(ALL_SOUNDSCAPES.map((s) => [s.label, s])).values(),
);

const CHAKRA_MODES = [
  { id: 'muladhara',   name: 'Muladhara',   emoji: '🔴', color: '#EF4444', freq: '396 Hz', desc: 'Uziemienie i bezpieczeństwo' },
  { id: 'svadhisthana',name: 'Swadhisthana',emoji: '🟠', color: '#F97316', freq: '417 Hz', desc: 'Kreatywność i emocje' },
  { id: 'manipura',    name: 'Manipura',    emoji: '🟡', color: '#EAB308', freq: '528 Hz', desc: 'Wola i pewność siebie' },
  { id: 'anahata',     name: 'Anahata',     emoji: '💚', color: '#22C55E', freq: '639 Hz', desc: 'Miłość i współczucie' },
  { id: 'vishuddha',   name: 'Vishudda',    emoji: '🔵', color: '#3B82F6', freq: '741 Hz', desc: 'Komunikacja i prawda' },
  { id: 'ajna',        name: 'Ajna',        emoji: '🟣', color: '#8B5CF6', freq: '852 Hz', desc: 'Intuicja i jasnowidztwo' },
  { id: 'sahasrara',   name: 'Sahasrara',   emoji: '⚪', color: '#DDD6FE', freq: '963 Hz', desc: 'Jedność i transcendencja' },
];

const BENEFITS_EXPANDED = [
  {
    icon: Brain,
    color: '#A78BFA',
    title: 'Regulacja układu nerwowego',
    short: 'Dźwięk o niskiej częstotliwości aktywuje odpowiedź relaksacyjną i zwalnia rytm myśli.',
    full: 'Badania wykazują, że ciągłe, rytmiczne dźwięki natury obniżają poziom kortyzolu o 12–18% już po 10 minutach odsłuchu. Aktywują układ parasympatyczny — "rest and digest" — co przekłada się na niższe ciśnienie krwi, wolniejszy oddech i głębsze poczucie bezpieczeństwa w ciele.',
  },
  {
    icon: Moon,
    color: '#67D1FF',
    title: 'Poprawa jakości snu',
    short: 'Pejzaże nocne pomagają wyciszyć alert przed snem i wejść w głębszy odpoczynek.',
    full: 'Biały i różowy szum maskują nagłe dźwięki otoczenia, które powodują mikroprzebudzenia. Mózg przestaje monitorować "zagrożenia" środowiskowe i może wejść w fazę NREM III — głęboki sen regeneracyjny. Efekt jest zauważalny już po 3 nocach regularnego stosowania.',
  },
  {
    icon: Wind,
    color: '#34D399',
    title: 'Pogłębiona medytacja',
    short: 'Ciągły dźwięk blokuje rozpraszające myśli i ułatwia skupienie na wdechu i wydechu.',
    full: 'Zjawisko "entrainment" — synchronizacja fal mózgowych z rytmem zewnętrznym — pozwala na szybsze wejście w stan alpha (8–12 Hz) i theta (4–8 Hz). Praktykujący z dźwiękiem osiągają głębię medytacji 3× szybciej niż w ciszy.',
  },
  {
    icon: Heart,
    color: '#F472B6',
    title: 'Koherencja serca i mózgu',
    short: 'Częstotliwości mis i kryształu synchronizują rytm serca z aktywnością kory przedczołowej.',
    full: 'HeartMath Institute dokumentuje, że słuchanie dźwięków w paśmie 0,1 Hz (10-sekundowe pulsacje) zwiększa koherencję HRV (zmienność rytmu serca) — wskaźnik równowagi emocjonalnej i odporności na stres. Misy tybetańskie naturalnie emitują takie pulsacje poprzez bity akustyczne.',
  },
  {
    icon: Activity,
    color: '#FB923C',
    title: 'Redukcja bólu i napięcia',
    short: 'Wibracje dźwiękowe przenikają do tkanek, rozluźniając wzorce napięciowe.',
    full: 'Terapia wibracyjna dźwiękiem (VAT) wykazuje skuteczność w redukcji przewlekłego bólu mięśniowo-szkieletowego. Częstotliwości 40–60 Hz wnikają w tkankę głęboką i zwiększają mikrokrążenie, co przyspiesza regenerację po treningu i redukuje uczucie sztywności.',
  },
];

const PREP_STEPS = [
  { icon: Headphones, emoji: '🎧', text: 'Użyj słuchawek stereo dla najlepszego efektu immersji' },
  { icon: Armchair,   emoji: '💺', text: 'Usiądź wygodnie lub połóż się — rozluźnij każdą część ciała' },
  { icon: Eye,        emoji: '👁️', text: 'Zamknij oczy i skieruj uwagę na oddech przed rozpoczęciem' },
];

const EXTRAS: Record<string, string> = {
  rain: '🌧️', waves: '🌊', fire: '🔥', forest: '🌲',
  ritual: '🕯️', wind: '💨', night: '🌙', cave: '🪨',
};

const BREATHING_PHASES = ['Wdech', 'Zatrzymaj', 'Wydech', 'Zatrzymaj'];
const BREATHING_COUNTS = [4, 4, 4, 4]; // Box breathing counts (seconds)
const BREATHING_COLORS = ['#60A5FA', '#A78BFA', '#34D399', '#FBBF24'];

const DEMO_HISTORY: SessionHistoryEntry[] = [
  { id: 'forest', duration: 900,  date: new Date(Date.now() - 86400000).toISOString(),     intention: 'medytacja',   moodBefore: 3, moodAfter: 5 },
  { id: 'rain',   duration: 600,  date: new Date(Date.now() - 2 * 86400000).toISOString(), intention: 'sen',         moodBefore: 2, moodAfter: 4 },
  { id: 'waves',  duration: 1200, date: new Date(Date.now() - 3 * 86400000).toISOString(), intention: 'relaks',      moodBefore: 3, moodAfter: 5 },
  { id: 'ritual', duration: 1800, date: new Date(Date.now() - 5 * 86400000).toISOString(), intention: 'oczyszczenie',moodBefore: 2, moodAfter: 4 },
  { id: 'cave',   duration: 2700, date: new Date(Date.now() - 7 * 86400000).toISOString(), intention: 'skupienie',   moodBefore: 4, moodAfter: 5 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m} min ${s}s` : `${m} min`;
}

function formatRelativeDate(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Dzisiaj';
  if (days === 1) return 'Wczoraj';
  return `${days} dni temu`;
}

function moodEmoji(score: number): string {
  const map = ['', '😫', '😔', '😐', '🙂', '😌'];
  return map[Math.max(1, Math.min(5, score))] ?? '😐';
}

// ── Sub-components ─────────────────────────────────────────────────────────────

/** 3 concentric pulsing/rotating SVG rings — colour-matched to active soundscape */
const SoundVisualizer: React.FC<{ playing: boolean; accent: string }> = ({ playing, accent }) => {
  const rot1 = useSharedValue(0);
  const rot2 = useSharedValue(0);
  const rot3 = useSharedValue(0);
  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);
  const pulse3 = useSharedValue(1);

  useEffect(() => {
    if (playing) {
      rot1.value = withRepeat(withTiming(360, { duration: 6000, easing: Easing.linear }), -1, false);
      rot2.value = withRepeat(withTiming(-360, { duration: 9000, easing: Easing.linear }), -1, false);
      rot3.value = withRepeat(withTiming(360, { duration: 14000, easing: Easing.linear }), -1, false);
      pulse1.value = withRepeat(withSequence(withTiming(1.08, { duration: 900 }), withTiming(0.96, { duration: 900 })), -1, true);
      pulse2.value = withRepeat(withSequence(withTiming(1.05, { duration: 1200 }), withTiming(0.97, { duration: 1200 })), -1, true);
      pulse3.value = withRepeat(withSequence(withTiming(1.04, { duration: 1600 }), withTiming(0.98, { duration: 1600 })), -1, true);
    } else {
      rot1.value = withTiming(0, { duration: 800 });
      rot2.value = withTiming(0, { duration: 800 });
      rot3.value = withTiming(0, { duration: 800 });
      pulse1.value = withTiming(1, { duration: 500 });
      pulse2.value = withTiming(1, { duration: 500 });
      pulse3.value = withTiming(1, { duration: 500 });
    }
  }, [playing]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot1.value}deg` }, { scale: pulse1.value }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot2.value}deg` }, { scale: pulse2.value }],
  }));
  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot3.value}deg` }, { scale: pulse3.value }],
  }));

  const CX = 90;
  const CY = 90;

  return (
    <View style={{ width: 180, height: 180, alignSelf: 'center', marginVertical: 8 }}>
      {/* Ring 3 — outermost, slow */}
      <Animated.View style={[StyleSheet.absoluteFillObject, ring3Style]}>
        <Svg width={180} height={180}>
          <Circle cx={CX} cy={CY} r={78} stroke={accent + '28'} strokeWidth={1.5} fill="none" strokeDasharray="6 4" />
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <Circle
                key={`dot3-${angle}`}
                cx={CX + 78 * Math.cos(rad)}
                cy={CY + 78 * Math.sin(rad)}
                r={2.5}
                fill={accent + '55'}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* Ring 2 — middle, medium, counter-rotate */}
      <Animated.View style={[StyleSheet.absoluteFillObject, ring2Style]}>
        <Svg width={180} height={180}>
          <Circle cx={CX} cy={CY} r={58} stroke={accent + '44'} strokeWidth={1.8} fill="none" strokeDasharray="10 6" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <Circle
                key={`dot2-${angle}`}
                cx={CX + 58 * Math.cos(rad)}
                cy={CY + 58 * Math.sin(rad)}
                r={2}
                fill={accent + '77'}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* Ring 1 — inner, fast */}
      <Animated.View style={[StyleSheet.absoluteFillObject, ring1Style]}>
        <Svg width={180} height={180}>
          <Circle cx={CX} cy={CY} r={38} stroke={accent + '66'} strokeWidth={2} fill="none" strokeDasharray="5 3" />
          {[0, 90, 180, 270].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <Line
                key={`spoke-${angle}`}
                x1={CX + 30 * Math.cos(rad)}
                y1={CY + 30 * Math.sin(rad)}
                x2={CX + 36 * Math.cos(rad)}
                y2={CY + 36 * Math.sin(rad)}
                stroke={accent + 'AA'}
                strokeWidth={1.5}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* Centre glow orb */}
      <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: accent + (playing ? '22' : '0D'),
          borderWidth: 1.5, borderColor: accent + (playing ? '66' : '22'),
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Music2 color={accent + (playing ? 'FF' : '66')} size={18} strokeWidth={1.8} />
        </View>
      </View>
    </View>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export const SoundBathScreen: React.FC = () => {
  const { t } = useTranslation();
  useAudioCleanup();
  const navigation = useNavigation<any>();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  // colours
  const ACCENT       = '#A78BFA';
  const textColor    = isLight ? '#1A1410'              : '#F5F1EA';
  const subColor     = isLight ? '#6A5A48'              : '#B0A393';
  const cardBg       = isLight ? 'rgba(255,255,255,0.88)'     : 'rgba(255,255,255,0.05)';
  const cardBorder   = isLight ? 'rgba(100,70,20,0.14)'     : 'rgba(255,255,255,0.12)';
  const divColor     = isLight ? 'rgba(122,95,54,0.14)'     : 'rgba(255,255,255,0.07)';

  // ── Playback state ──
  const [active,  setActive]  = useState<AmbientSoundscape | null>(null);
  const [active2, setActive2] = useState<AmbientSoundscape | null>(null); // layer 2
  const [vol1,    setVol1]    = useState(1.0);
  const [vol2,    setVol2]    = useState(0.5);
  const [muted,   setMuted]   = useState(false);

  // ── UI state ──
  const [selectedDuration,  setSelectedDuration]  = useState<number>(15);
  const [selectedIntention, setSelectedIntention] = useState<string | null>(null);
  const [sessionHistory,    setSessionHistory]     = useState<SessionHistoryEntry[]>(DEMO_HISTORY);
  const [chakraMode,        setChakraMode]         = useState<string | null>(null);
  const [showChakraModal,   setShowChakraModal]    = useState(false);
  const [showLayerPanel,    setShowLayerPanel]     = useState(false);
  const [showBreathing,     setShowBreathing]      = useState(false);
  const [breathPhase,       setBreathPhase]        = useState(0);
  const [breathCount,       setBreathCount]        = useState(BREATHING_COUNTS[0]);
  const [expandedBenefit,   setExpandedBenefit]    = useState<number | null>(null);
  const [moodBefore,        setMoodBefore]         = useState<number | null>(null);
  const [showMoodModal,     setShowMoodModal]      = useState(false);
  const [pendingStop,       setPendingStop]        = useState(false);
  const [soundCategory,     setSoundCategory]      = useState<'wszystkie' | 'natura' | 'ceremonia' | 'mistyczny'>('wszystkie');
  const [timerRemaining,    setTimerRemaining]     = useState<number | null>(null);
  const [selectedSession,   setSelectedSession]    = useState<SessionHistoryEntry | null>(null);

  // ── Refs ──
  const sessionStartRef = useRef<number | null>(null);
  const lastActiveRef   = useRef<AmbientSoundscape | null>(null);
  const breathTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Derived ──
  const activeEntry = active
    ? UNIQUE_SOUNDSCAPES.find((s) => s.id === active && s.label !== 'Misy tybetańskie' && s.label !== 'Kryształowe misy' && s.label !== 'Wieloryby') ??
      UNIQUE_SOUNDSCAPES.find((s) => s.id === active)
    : null;

  const recommendations = selectedIntention
    ? (INTENTION_RECOMMENDATIONS[selectedIntention] ?? [])
    : [];

  const filteredSoundscapes = soundCategory === 'wszystkie'
    ? UNIQUE_SOUNDSCAPES
    : UNIQUE_SOUNDSCAPES.filter((s) => s.category === soundCategory);

  const gradientColors = isLight
    ? (['#F8F4FF', '#EDE6FF', '#E6EEFF'] as const)
    : (['#06070C', '#0E111B', '#141927'] as const);

  // ── Pre-warm all audio on screen mount to eliminate playback delay ──
  useEffect(() => {
    void AudioService.preloadBootAudio();
  }, []);

  // ── Session timer ──
  useEffect(() => {
    if (active && selectedDuration > 0) {
      const totalSecs = selectedDuration * 60;
      setTimerRemaining(totalSecs);
      sessionTimerRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(sessionTimerRef.current!);
            void handleStop(active);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!active) {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      setTimerRemaining(null);
    }
    return () => { if (sessionTimerRef.current) clearInterval(sessionTimerRef.current); };
  }, [active, selectedDuration]);

  // ── Breathing guide timer ──
  useEffect(() => {
    if (showBreathing && active) {
      let phase = 0;
      let count = BREATHING_COUNTS[0];
      setBreathPhase(0);
      setBreathCount(BREATHING_COUNTS[0]);
      breathTimerRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          phase = (phase + 1) % 4;
          count = BREATHING_COUNTS[phase];
          setBreathPhase(phase);
          setBreathCount(count);
        } else {
          setBreathCount(count);
        }
      }, 1000);
    } else {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    }
    return () => { if (breathTimerRef.current) clearInterval(breathTimerRef.current); };
  }, [showBreathing, active]);

  // ── Playback helpers ──
  const handleStop = useCallback(async (id: AmbientSoundscape) => {
    const elapsed = sessionStartRef.current
      ? Math.floor((Date.now() - sessionStartRef.current) / 1000)
      : 0;
    await AudioService.pauseAmbientSound();
    setActive(null);
    lastActiveRef.current = null;
    if (elapsed >= 30) {
      setPendingStop(true);
      setSessionHistory((prev) => [
        { id, duration: elapsed, date: new Date().toISOString(), intention: selectedIntention ?? undefined },
        ...prev.slice(0, 9),
      ]);
    }
    sessionStartRef.current = null;
  }, [selectedIntention]);

  const toggle = useCallback(async (id: AmbientSoundscape) => {
    if (active === id) {
      await handleStop(id);
    } else {
      await AudioService.playAmbientForSession(id);
      sessionStartRef.current = Date.now();
      lastActiveRef.current = id;
      setActive(id);
      if (!moodBefore) setShowMoodModal(true);
    }
  }, [active, handleStop, moodBefore]);

  const toggleLayer2 = useCallback(async (id: AmbientSoundscape) => {
    if (active2 === id) {
      setActive2(null);
    } else {
      setActive2(id);
    }
  }, [active2]);

  const toggleMute = useCallback(async () => {
    if (muted) {
      if (active) await AudioService.playAmbientForSession(active);
    } else {
      await AudioService.pauseAmbientSound();
    }
    setMuted((m) => !m);
  }, [muted, active]);

  // Timer display
  const timerDisplay = timerRemaining !== null
    ? formatDuration(timerRemaining)
    : selectedDuration > 0
      ? `${selectedDuration} min`
      : '∞';

  // Visualizer accent — use active soundscape colour, fallback to ACCENT
  const vizAccent = activeEntry?.accent ?? ACCENT;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={[styles.safe, {}]} edges={['top']}>

      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFillObject} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => goBackOrToMainTab(navigation, 'Worlds')}
          style={styles.backBtn}
          hitSlop={14}
        >
          <ChevronLeft color={ACCENT} size={28} strokeWidth={1.5} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerLabel, { color: ACCENT }]}>🎶 KĄPIEL DŹWIĘKOWA</Text>
          <Text style={[styles.headerTitle, { color: textColor }]}>Pejzaże zanurzenia</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <MusicToggleButton color={ACCENT} size={20} />
          <Pressable onPress={toggleMute} hitSlop={12}>
            {muted
              ? <VolumeX color={ACCENT} size={20} strokeWidth={1.8} />
              : <Volume2 color={ACCENT} size={20} strokeWidth={1.8} />
            }
          </Pressable>
          <Pressable
            onPress={() => { if (isFavoriteItem('soundbath')) { removeFavoriteItem('soundbath'); } else { addFavoriteItem({ id: 'soundbath', label: 'Kąpiel Dźwiękowa', route: 'SoundBath', icon: 'Waves', color: ACCENT, addedAt: new Date().toISOString() }); } }}
            hitSlop={12}
          >
            <Star
              color={isFavoriteItem('soundbath') ? ACCENT : ACCENT + '88'}
              size={20}
              strokeWidth={1.8}
              fill={isFavoriteItem('soundbath') ? ACCENT : 'none'}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero card ── */}
        <View style={[styles.heroCard, { borderColor: ACCENT + '33', backgroundColor: cardBg }]}>
          <LinearGradient colors={[ACCENT + '14', 'transparent']} style={StyleSheet.absoluteFillObject} />
          <Text style={[styles.eyebrow, { color: ACCENT }]}>✦ KĄPIEL DŹWIĘKOWA</Text>
          <Text style={[styles.title, { color: textColor }]}>Pejzaże zanurzenia</Text>
          <Text style={[styles.sub, { color: subColor }]}>
            To nie jest zwykła lista ambientów. Każdy krajobraz buduje inny stan: ukojenie, grunt, rytuał, fokus albo miękkie zejście z napięcia dnia.
          </Text>
          <View style={styles.heroChips}>
            {['sen i wyciszenie', 'rytuał i journaling', 'oddech i regulacja'].map((item) => (
              <View key={item} style={[styles.heroChip, { borderColor: ACCENT + '30', backgroundColor: ACCENT + '0D' }]}>
                <Text style={[styles.heroChipText, { color: isLight ? ACCENT : '#CDB9FF' }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ════════════════════════════════════════════════════════
            WIZUALIZATOR — 3D pulsing rings
        ════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(30).duration(500)}>
          <View style={[styles.vizContainer, { backgroundColor: cardBg, borderColor: vizAccent + '33' }]}>
            <LinearGradient
              colors={[vizAccent + '0D', 'transparent', vizAccent + '06']}
              style={StyleSheet.absoluteFillObject}
            />
            <SoundVisualizer playing={active !== null} accent={vizAccent} />
            {active ? (
              <View style={{ alignItems: 'center', marginTop: 4, gap: 4 }}>
                <Text style={[styles.vizLabel, { color: vizAccent }]}>
                  {activeEntry?.emoji ?? '🎵'} {activeEntry?.title ?? activeEntry?.label ?? ''}
                </Text>
                <Text style={[styles.vizSub, { color: subColor }]}>{timerDisplay}</Text>
                {showBreathing && active ? (
                  <View style={[styles.breathCard, { backgroundColor: BREATHING_COLORS[breathPhase] + '18', borderColor: BREATHING_COLORS[breathPhase] + '44' }]}>
                    <Text style={[styles.breathPhaseText, { color: BREATHING_COLORS[breathPhase] }]}>
                      {BREATHING_PHASES[breathPhase]}
                    </Text>
                    <Text style={[styles.breathCountText, { color: BREATHING_COLORS[breathPhase] }]}>
                      {breathCount}
                    </Text>
                  </View>
                ) : null}
                <Pressable
                  onPress={() => toggle(active)}
                  style={[styles.stopBtn, { borderColor: vizAccent + '55', backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)' }]}
                >
                  <Text style={[styles.stopBtnText, { color: vizAccent }]}>Zatrzymaj sesję</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={[styles.vizIdleText, { color: subColor }]}>Wybierz pejzaż, aby rozpocząć</Text>
            )}
          </View>
        </Animated.View>

        {/* ════════════════════════════════════════════════════════
            §1  PRZYGOTOWANIE DO SESJI
        ════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(60).duration(500)}>
          <Text style={[styles.sectionEyebrow, { color: ACCENT }]}>🧘 PRZYGOTOWANIE DO SESJI</Text>
          {PREP_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <View
                key={index}
                style={[
                  styles.prepRow,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                  index < PREP_STEPS.length - 1 && { marginBottom: 10 },
                ]}
              >
                <View style={[styles.prepNumber, { backgroundColor: ACCENT + '1A', borderColor: ACCENT + '33' }]}>
                  <Text style={[styles.prepNumberText, { color: ACCENT }]}>{index + 1}</Text>
                </View>
                <View style={[styles.prepIconWrap, { backgroundColor: ACCENT + '12' }]}>
                  <Icon color={ACCENT} size={16} strokeWidth={1.8} />
                </View>
                <Text style={[styles.prepText, { color: textColor }]}>{step.emoji} {step.text}</Text>
              </View>
            );
          })}
        </Animated.View>

        {/* ════════════════════════════════════════════════════════
            §2  CZAS SESJI — duration selector
        ════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)}>
          <View style={styles.sectionHeaderRow}>
            <Clock color={ACCENT} size={14} strokeWidth={2} />
            <Text style={[styles.sectionEyebrow, { color: ACCENT, marginBottom: 0, marginTop: 0 }]}>  CZAS SESJI</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.durationScroll}>
            {DURATIONS.map((d) => {
              const isSel = selectedDuration === d.value;
              return (
                <Pressable
                  key={d.value}
                  onPress={() => setSelectedDuration(d.value)}
                  style={[styles.durationChip, { backgroundColor: isSel ? ACCENT : cardBg, borderColor: isSel ? ACCENT : cardBorder }]}
                >
                  <Text style={[styles.durationChipText, { color: isSel ? '#FFFFFF' : subColor }]}>{d.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={[styles.durationHint, { color: subColor }]}>
            {selectedDuration > 0
              ? `Sesja zakończy się po ${selectedDuration} minutach z delikatnym dźwiękiem powiadomienia.`
              : 'Tryb nieskończony — pejzaż gra do ręcznego zatrzymania.'}
          </Text>
        </Animated.View>

        {/* ════════════════════════════════════════════════════════
            §3  INTENCJA SESJI
        ════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <View style={styles.sectionHeaderRow}>
            <Target color={ACCENT} size={14} strokeWidth={2} />
            <Text style={[styles.sectionEyebrow, { color: ACCENT, marginBottom: 0, marginTop: 0 }]}>  INTENCJA SESJI</Text>
          </View>
          <View style={styles.intentionGrid}>
            {SESSION_INTENTIONS.map((intention) => {
              const isSel = selectedIntention === intention.id;
              return (
                <Pressable
                  key={intention.id}
                  onPress={() => setSelectedIntention(isSel ? null : intention.id)}
                  style={[
                    styles.intentionTile,
                    {
                      backgroundColor: isSel ? intention.color + '20' : cardBg,
                      borderColor:     isSel ? intention.color : cardBorder,
                      shadowColor:     isSel ? intention.color : 'transparent',
                      shadowOpacity:   isSel ? 0.35 : 0,
                      shadowRadius:    isSel ? 12 : 0,
                      shadowOffset:    { width: 0, height: 0 },
                      elevation:       isSel ? 6 : 0,
                    },
                  ]}
                >
                  <Text style={styles.intentionEmoji}>{intention.emoji}</Text>
                  <Text style={[styles.intentionLabel, { color: isSel ? intention.color : textColor }]}>
                    {intention.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ════════════════════════════════════════════════════════
            §4  REKOMENDACJA DLA INTENCJI
        ════════════════════════════════════════════════════════ */}
        {selectedIntention ? (
          <Animated.View entering={FadeInDown.delay(30).duration(400)}>
            <View style={[styles.mixCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <LinearGradient
                colors={[(SESSION_INTENTIONS.find((i) => i.id === selectedIntention)?.color ?? ACCENT) + '12', 'transparent']}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={[styles.mixHeading, { color: textColor }]}>🔊 Połącz intencję z pejzażem</Text>
              <Text style={[styles.mixSub, { color: subColor }]}>Dla wybranej intencji najlepiej sprawdzają się:</Text>
              <View style={styles.mixPills}>
                {recommendations.map((rec) => {
                  const entry = UNIQUE_SOUNDSCAPES.find((s) => s.id === rec);
                  if (!entry) return null;
                  return (
                    <Pressable
                      key={rec}
                      onPress={() => toggle(rec)}
                      style={[styles.mixPill, { backgroundColor: entry.accent + '1A', borderColor: entry.accent + '44' }]}
                    >
                      <Text style={styles.mixPillEmoji}>{entry.emoji}</Text>
                      <Text style={[styles.mixPillText, { color: entry.accent }]}>{entry.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        ) : null}

        {/* ════════════════════════════════════════════════════════
            §5  TRYB CZAKR — chakra tuned bowls
        ════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(110).duration(500)}>
          <View style={styles.sectionHeaderRow}>
            <Zap color={ACCENT} size={14} strokeWidth={2} />
            <Text style={[styles.sectionEyebrow, { color: ACCENT, marginBottom: 0, marginTop: 0 }]}>  TRYB CZAKR</Text>
          </View>
          <View style={[styles.chakraHeroCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <LinearGradient colors={[ACCENT + '10', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.chakraHeroTitle, { color: textColor }]}>
                Misy nastrojone na częstotliwości czakr
              </Text>
              <Text style={[styles.chakraHeroSub, { color: subColor }]}>
                {chakraMode
                  ? `Aktywna: ${CHAKRA_MODES.find((c) => c.id === chakraMode)?.name ?? ''} — ${CHAKRA_MODES.find((c) => c.id === chakraMode)?.freq ?? ''}`
                  : 'Wybierz czakrę i uruchom odpowiedni pejzaż dźwiękowy'}
              </Text>
            </View>
            <Pressable
              onPress={() => setShowChakraModal(true)}
              style={[styles.chakraOpenBtn, { borderColor: ACCENT + '55', backgroundColor: ACCENT + '14' }]}
            >
              <Text style={[styles.chakraOpenBtnText, { color: ACCENT }]}>Wybierz</Text>
            </Pressable>
          </View>
          {chakraMode ? (
            <View style={styles.chakraRow}>
              {CHAKRA_MODES.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setChakraMode(c.id);
                    toggle('waves');
                  }}
                  style={[
                    styles.chakraDot,
                    { backgroundColor: c.color + (chakraMode === c.id ? 'EE' : '33'), borderColor: c.color },
                  ]}
                >
                  <Text style={{ fontSize: 12 }}>{c.emoji}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </Animated.View>

        {/* ════════════════════════════════════════════════════════
            §6  MIKSOWANIE — layer 2 soundscape
        ════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(120).duration(500)}>
          <Pressable
            onPress={() => setShowLayerPanel((v) => !v)}
            style={[styles.layerToggleRow, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <Layers color={ACCENT} size={16} strokeWidth={1.8} />
            <Text style={[styles.layerToggleLabel, { color: textColor }]}>Miksowanie warstw dźwięku</Text>
            {showLayerPanel
              ? <ChevronUp color={subColor} size={16} />
              : <ChevronDown color={subColor} size={16} />}
          </Pressable>

          {showLayerPanel ? (
            <Animated.View entering={FadeInDown.delay(0).duration(350)}>
              <View style={[styles.layerPanel, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.layerPanelTitle, { color: subColor }]}>
                  Wybierz drugi pejzaż i wyreguluj głośność każdej warstwy niezależnie.
                </Text>

                {/* Layer 1 volume */}
                <View style={styles.layerVolRow}>
                  <Text style={[styles.layerVolLabel, { color: textColor }]}>
                    {active ? `${activeEntry?.emoji ?? '🎵'} Warstwa 1: ${activeEntry?.label ?? active}` : 'Warstwa 1: brak'}
                  </Text>
                </View>

                {/* Layer 2 picker */}
                <Text style={[styles.layerPickerLabel, { color: subColor }]}>Warstwa 2:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                  {UNIQUE_SOUNDSCAPES.slice(0, 8).map((s) => {
                    const isSel2 = active2 === s.id;
                    return (
                      <Pressable
                        key={s.label}
                        onPress={() => toggleLayer2(s.id)}
                        style={[
                          styles.layer2Chip,
                          { backgroundColor: isSel2 ? s.accent + '22' : cardBg, borderColor: isSel2 ? s.accent : cardBorder },
                        ]}
                      >
                        <Text style={{ fontSize: 16 }}>{s.emoji}</Text>
                        <Text style={[styles.layer2ChipLabel, { color: isSel2 ? s.accent : subColor }]}>{s.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text style={[styles.layerNote, { color: subColor }]}>
                  Uwaga: podgląd miksowania — głośność warstwy 2 jest symulowana wizualnie. Pełne wsparcie wielokanałowe zależy od możliwości urządzenia.
                </Text>
              </View>
            </Animated.View>
          ) : null}
        </Animated.View>

        {/* ════════════════════════════════════════════════════════
            §7  PEJZAŻE DŹWIĘKOWE — full grid
        ════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(130).duration(500)}>
          <Text style={[styles.sectionEyebrow, { color: ACCENT }]}>🎵 PEJZAŻE DŹWIĘKOWE</Text>

          {/* Category filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
            {(['wszystkie', 'natura', 'ceremonia', 'mistyczny'] as const).map((cat) => {
              const isSel = soundCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSoundCategory(cat)}
                  style={[styles.catChip, { backgroundColor: isSel ? ACCENT + '22' : cardBg, borderColor: isSel ? ACCENT : cardBorder }]}
                >
                  <Text style={[styles.catChipText, { color: isSel ? ACCENT : subColor }]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.grid}>
            {filteredSoundscapes.map((s) => {
              const isOn  = active === s.id;
              const isRec = recommendations.includes(s.id);
              return (
                <Pressable
                  key={s.label}
                  onPress={() => toggle(s.id)}
                  style={[
                    styles.card,
                    {
                      backgroundColor: isOn ? s.accent + '14' : cardBg,
                      borderColor:     isOn ? s.accent + '66' : isRec ? s.accent + '44' : cardBorder,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[isOn ? s.accent + '16' : isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  {isRec && !isOn ? (
                    <View style={[styles.recBadge, { backgroundColor: s.accent + '22', borderColor: s.accent + '55' }]}>
                      <Text style={[styles.recBadgeText, { color: s.accent }]}>Polecane</Text>
                    </View>
                  ) : null}
                  <Text style={styles.emoji}>{s.emoji}</Text>
                  <Text style={[styles.cardLabel, isOn ? { color: s.accent } : { color: textColor }]}>{s.label}</Text>
                  <Text style={[styles.desc, { color: subColor }]}>{s.copy}</Text>
                  <Text style={[styles.miniMeta, { color: s.accent }]}>
                    {isOn ? 'Dotknij, aby zatrzymać' : 'Dotknij, aby wejść'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ════════════════════════════════════════════════════════
            §8  PRZEWODNIK ODDECHOWY — breathing guide toggle
        ════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(140).duration(500)}>
          <Pressable
            onPress={() => setShowBreathing((v) => !v)}
            style={[styles.breathToggleRow, { backgroundColor: showBreathing ? ACCENT + '18' : cardBg, borderColor: showBreathing ? ACCENT + '55' : cardBorder }]}
          >
            <View style={[styles.breathIconWrap, { backgroundColor: ACCENT + '16' }]}>
              <Wind color={ACCENT} size={18} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.breathToggleTitle, { color: textColor }]}>Przewodnik oddechowy</Text>
              <Text style={[styles.breathToggleSub, { color: subColor }]}>
                Box breathing 4-4-4-4 zsynchronizowany z sesją
              </Text>
            </View>
            <View style={[styles.breathToggleSwitch, { backgroundColor: showBreathing ? ACCENT : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)') }]}>
              <View style={[styles.breathToggleThumb, { alignSelf: showBreathing ? 'flex-end' : 'flex-start' }]} />
            </View>
          </Pressable>
          {showBreathing && !active ? (
            <Text style={[styles.breathNoSession, { color: subColor }]}>
              Uruchom pejzaż dźwiękowy, aby aktywować przewodnik oddechowy.
            </Text>
          ) : null}
        </Animated.View>

        {/* ════════════════════════════════════════════════════════
            §9  TIMER ZASYPIANIA — sleep timer info
        ════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <View style={[styles.sleepTimerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <LinearGradient colors={['#8B5CF6' + '0D', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <View style={[styles.sleepTimerIcon, { backgroundColor: '#8B5CF6' + '18' }]}>
              <Moon color="#8B5CF6" size={20} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sleepTimerTitle, { color: textColor }]}>Timer zasypiania</Text>
              <Text style={[styles.sleepTimerSub, { color: subColor }]}>
                Ustaw czas sesji na 30–60 min — przez ostatnie 5 minut pejzaż delikatnie wycisza się do zera, żeby nie przerywać snu.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ════════════════════════════════════════════════════════
            §10 TWOJE SESJE — session history
        ════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(160).duration(500)}>
          <View style={styles.sectionHeaderRow}>
            <History color={ACCENT} size={14} strokeWidth={2} />
            <Text style={[styles.sectionEyebrow, { color: ACCENT, marginBottom: 0, marginTop: 0 }]}>  TWOJE SESJE</Text>
          </View>
          {sessionHistory.length === 0 ? (
            <View style={[styles.emptyHistory, { borderColor: cardBorder, backgroundColor: cardBg }]}>
              <Text style={styles.emptyHistoryEmoji}>🎧</Text>
              <Text style={[styles.emptyHistoryTitle, { color: textColor }]}>Zacznij swoją pierwszą sesję</Text>
              <Text style={[styles.emptyHistorySub, { color: subColor }]}>
                Po co najmniej 30 sekundach odsłuchu Twoja sesja pojawi się tutaj.
              </Text>
            </View>
          ) : (
            sessionHistory.slice(0, 7).map((entry, index) => {
              const entryData = UNIQUE_SOUNDSCAPES.find((s) => s.id === entry.id);
              const accent = entryData?.accent ?? ACCENT;
              const emoji  = entryData?.emoji  ?? '🎵';
              const title  = entryData?.title  ?? entry.id;
              return (
                <Pressable
                  key={`${entry.id}-${entry.date}-${index}`}
                  onPress={() => setSelectedSession(entry)}
                  style={[
                    styles.historyCard,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                    index < sessionHistory.slice(0, 7).length - 1 && { marginBottom: 10 },
                  ]}
                >
                  <View style={[styles.historyIconWrap, { backgroundColor: accent + '18' }]}>
                    <Text style={styles.historyEmoji}>{emoji}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.historyName, { color: textColor }]}>{title}</Text>
                    <Text style={[styles.historySub, { color: subColor }]}>
                      {formatDuration(entry.duration)} · {formatRelativeDate(entry.date)}
                      {entry.intention ? ` · ${entry.intention}` : ''}
                    </Text>
                    {entry.moodBefore !== undefined && entry.moodAfter !== undefined ? (
                      <Text style={[styles.historyMood, { color: accent }]}>
                        Nastrój: {moodEmoji(entry.moodBefore)} → {moodEmoji(entry.moodAfter)}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View style={[styles.historyAccent, { backgroundColor: accent + '22' }]}>
                      <Text style={[styles.historyAccentText, { color: accent }]}>
                        {formatDuration(entry.duration)}
                      </Text>
                    </View>
                    <Text style={{ color: accent + 'AA', fontSize: 9, letterSpacing: 0.5 }}>Dotknij</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </Animated.View>

        {/* ════════════════════════════════════════════════════════
            §11 DLACZEGO TO DZIAŁA — expandable benefits
        ════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(180).duration(500)}>
          <View style={styles.sectionHeaderRow}>
            <BookOpen color={ACCENT} size={14} strokeWidth={2} />
            <Text style={[styles.sectionEyebrow, { color: ACCENT, marginBottom: 0, marginTop: 0 }]}>  DLACZEGO TO DZIAŁA</Text>
          </View>
          {BENEFITS_EXPANDED.map((item, i) => {
            const Icon = item.icon;
            const isExpanded = expandedBenefit === i;
            return (
              <Pressable
                key={item.title}
                onPress={() => setExpandedBenefit(isExpanded ? null : i)}
                style={[
                  styles.benefitCard,
                  { backgroundColor: cardBg, borderColor: isExpanded ? item.color + '55' : cardBorder },
                  i < BENEFITS_EXPANDED.length - 1 && { marginBottom: 10 },
                ]}
              >
                <LinearGradient
                  colors={isExpanded ? [item.color + '10', 'transparent'] : ['transparent', 'transparent']}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.benefitHeaderRow}>
                  <View style={[styles.benefitIcon, { backgroundColor: item.color + '18' }]}>
                    <Icon color={item.color} size={18} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.benefitTitle, { color: item.color }]}>{item.title}</Text>
                    <Text style={[styles.benefitShort, { color: subColor }]}>{item.short}</Text>
                  </View>
                  {isExpanded
                    ? <ChevronUp color={subColor} size={16} />
                    : <ChevronDown color={subColor} size={16} />}
                </View>
                {isExpanded ? (
                  <Text style={[styles.benefitFull, { color: subColor, borderTopColor: divColor }]}>
                    {item.full}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </Animated.View>

        {/* ════════════════════════════════════════════════════════
            §12 CO DALEJ?
        ════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text style={[styles.sectionEyebrow, { color: ACCENT }]}>✦ CO DALEJ?</Text>
          {[
            { icon: Wind,     label: 'Oddech i pranajama',    sub: 'Połącz dźwięk z technikami oddechowymi',    color: '#60A5FA', route: 'Breathwork'   },
            { icon: Brain,    label: 'Medytacja w ciszy',     sub: 'Wejdź głębiej po kąpieli dźwiękowej',       color: '#A78BFA', route: 'Meditation'   },
            { icon: Sparkles, label: 'Wyrocznia Aethery',     sub: 'Zapytaj wyrocznię po sesji relaksacji',     color: '#CEAE72', route: 'OraclePortal' },
            { icon: Sun,      label: 'Praktyki poranne',      sub: 'Rytuały na dobry początek dnia',            color: '#FBBF24', route: 'Rituals'      },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={item.route}
                onPress={() => navigation.navigate(item.route)}
                style={[styles.nextRow, { borderColor: item.color + '33', backgroundColor: cardBg }]}
              >
                <View style={[styles.nextIcon, { backgroundColor: item.color + '18' }]}>
                  <Icon color={item.color} size={17} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nextTitle, { color: textColor }]}>{item.label}</Text>
                  <Text style={[styles.nextSub, { color: subColor }]}>{item.sub}</Text>
                </View>
                <ArrowRight color={item.color} size={15} strokeWidth={1.5} />
              </Pressable>
            );
          })}
        </Animated.View>

        <EndOfContentSpacer size="standard" />
      </ScrollView>

      {/* ════════════════════════════════════════════════════════
          MODAL — Chakra selector
      ════════════════════════════════════════════════════════ */}
      <Modal visible={showChakraModal} transparent animationType="slide" onRequestClose={() => setShowChakraModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowChakraModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: isLight ? '#F8F4FF' : '#0F0C1A' }]}>
            <View style={[styles.modalHandle, { backgroundColor: isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)' }]} />
            <Text style={[styles.modalTitle, { color: textColor }]}>🎶 Misy nastrojone na czakry</Text>
            <Text style={[styles.modalSub, { color: subColor }]}>
              Wybierz czakrę — uruchomimy odpowiedni pejzaż dźwiękowy i wyświetlimy jej częstotliwość.
            </Text>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {CHAKRA_MODES.map((c) => {
                const isSel = chakraMode === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      setChakraMode(c.id);
                      toggle('waves');
                      setShowChakraModal(false);
                    }}
                    style={[
                      styles.chakraModalRow,
                      { backgroundColor: isSel ? c.color + '18' : 'transparent', borderColor: isSel ? c.color + '55' : 'transparent' },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.chakraModalName, { color: isSel ? c.color : textColor }]}>{c.name}</Text>
                      <Text style={[styles.chakraModalDesc, { color: subColor }]}>{c.desc}</Text>
                    </View>
                    <View style={[styles.chakraFreqBadge, { backgroundColor: c.color + '22', borderColor: c.color + '44' }]}>
                      <Text style={[styles.chakraFreqText, { color: c.color }]}>{c.freq}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ════════════════════════════════════════════════════════
          MODAL — Mood before session
      ════════════════════════════════════════════════════════ */}
      <Modal visible={showMoodModal} transparent animationType="fade" onRequestClose={() => setShowMoodModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowMoodModal(false)} />
          <View style={[styles.moodSheet, { backgroundColor: isLight ? '#F8F4FF' : '#0F0C1A' }]}>
            <View style={[styles.modalHandle, { backgroundColor: isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)' }]} />
            <Text style={[styles.moodTitle, { color: textColor }]}>Jak czujesz się teraz?</Text>
            <Text style={[styles.moodSub, { color: subColor }]}>Ocenimy zmianę po sesji.</Text>
            <View style={styles.moodRow}>
              {[1, 2, 3, 4, 5].map((score) => (
                <Pressable
                  key={score}
                  onPress={() => {
                    setMoodBefore(score);
                    setShowMoodModal(false);
                  }}
                  style={[styles.moodBtn, { borderColor: moodBefore === score ? ACCENT : cardBorder, backgroundColor: moodBefore === score ? ACCENT + '18' : cardBg }]}
                >
                  <Text style={styles.moodBtnEmoji}>{moodEmoji(score)}</Text>
                  <Text style={[styles.moodBtnScore, { color: subColor }]}>{score}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => setShowMoodModal(false)} style={styles.moodSkip}>
              <Text style={[styles.moodSkipText, { color: subColor }]}>Pomiń</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ════════════════════════════════════════════════════════
          MODAL — Session detail
      ════════════════════════════════════════════════════════ */}
      <Modal
        visible={selectedSession !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSession(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setSelectedSession(null)} />
          {selectedSession !== null && (() => {
            const sessData = UNIQUE_SOUNDSCAPES.find((s) => s.id === selectedSession.id);
            const sessAccent = sessData?.accent ?? ACCENT;
            const sessEmoji  = sessData?.emoji  ?? '🎵';
            const sessTitle  = sessData?.title  ?? selectedSession.id;
            return (
              <View style={[styles.modalSheet, { backgroundColor: isLight ? '#F8F4FF' : '#0F0C1A' }]}>
                <View style={[styles.modalHandle, { backgroundColor: isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)' }]} />

                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: sessAccent + '22', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24 }}>{sessEmoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: sessAccent, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 2 }}>SZCZEGÓŁY SESJI</Text>
                    <Text style={{ color: textColor, fontSize: 18, fontWeight: '700' }}>{sessTitle}</Text>
                  </View>
                  <Pressable onPress={() => setSelectedSession(null)} hitSlop={12}>
                    <X color={subColor} size={20} strokeWidth={1.8} />
                  </Pressable>
                </View>

                {/* Stats grid */}
                {[
                  { label: 'Data',      value: formatRelativeDate(selectedSession.date) },
                  { label: 'Czas trwania', value: formatDuration(selectedSession.duration) },
                  { label: 'Intencja',  value: selectedSession.intention ? selectedSession.intention.charAt(0).toUpperCase() + selectedSession.intention.slice(1) : '—' },
                ].map((row) => (
                  <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }}>
                    <Text style={{ color: subColor, fontSize: 13 }}>{row.label}</Text>
                    <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>{row.value}</Text>
                  </View>
                ))}

                {/* Mood change */}
                {selectedSession.moodBefore !== undefined && selectedSession.moodAfter !== undefined ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }}>
                    <Text style={{ color: subColor, fontSize: 13 }}>Zmiana nastroju</Text>
                    <Text style={{ color: sessAccent, fontSize: 15, fontWeight: '700' }}>
                      {moodEmoji(selectedSession.moodBefore)} → {moodEmoji(selectedSession.moodAfter)}
                    </Text>
                  </View>
                ) : null}

                {/* Repeat session button */}
                <Pressable
                  onPress={() => {
                    setSelectedSession(null);
                    toggle(selectedSession.id);
                    if (selectedSession.intention) setSelectedIntention(selectedSession.intention);
                  }}
                  style={{ marginTop: 22, borderRadius: 14, overflow: 'hidden' }}
                >
                  <LinearGradient
                    colors={[sessAccent + 'EE', sessAccent + 'AA']}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>Powtórz tę sesję</Text>
                    <ArrowRight color="#FFF" size={16} strokeWidth={2} />
                  </LinearGradient>
                </Pressable>
              </View>
            );
          })()}
        </View>
      </Modal>

        </SafeAreaView>
</View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:              { flex: 1 },
  header:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  backBtn:           { width: 40 },
  headerLabel:       { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  headerTitle:       { fontSize: 17, fontWeight: '600' },
  scroll:            { padding: layout.padding.screen, paddingBottom: 24, gap: 20 },
  sectionEyebrow:    { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 14, marginTop: 4 },
  sectionHeaderRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: 4 },

  // hero
  heroCard:          { borderRadius: 24, borderWidth: 1, padding: 22, overflow: 'hidden' },
  eyebrow:           { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  title:             { fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  sub:               { fontSize: 14.5, lineHeight: 23, marginTop: 12 },
  heroChips:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  heroChip:          { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  heroChipText:      { fontSize: 11, fontWeight: '700' },

  // visualizer
  vizContainer:      { borderRadius: 24, borderWidth: 1, padding: 20, overflow: 'hidden', alignItems: 'center' },
  vizLabel:          { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  vizSub:            { fontSize: 12, textAlign: 'center' },
  vizIdleText:       { fontSize: 13, textAlign: 'center', marginTop: 8, marginBottom: 4 },

  // breathing in viz
  breathCard:        { marginTop: 12, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 2 },
  breathPhaseText:   { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  breathCountText:   { fontSize: 32, fontWeight: '800' },

  // stop btn
  stopBtn:           { alignSelf: 'center', marginTop: 14, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  stopBtnText:       { fontSize: 12, fontWeight: '700' },

  // prep steps
  prepRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  prepNumber:        { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  prepNumberText:    { fontSize: 12, fontWeight: '800' },
  prepIconWrap:      { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  prepText:          { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '500' },

  // duration
  durationScroll:    { gap: 8, paddingBottom: 4 },
  durationChip:      { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  durationChipText:  { fontSize: 13, fontWeight: '700' },
  durationHint:      { fontSize: 12, lineHeight: 18, marginTop: 10 },

  // intention
  intentionGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  intentionTile:     { width: '47%', padding: 16, borderRadius: 18, borderWidth: 1, alignItems: 'center', gap: 8 },
  intentionEmoji:    { fontSize: 28 },
  intentionLabel:    { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  // mix card
  mixCard:           { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
  mixHeading:        { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  mixSub:            { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  mixPills:          { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  mixPill:           { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1 },
  mixPillEmoji:      { fontSize: 16 },
  mixPillText:       { fontSize: 12, fontWeight: '700' },

  // chakra
  chakraHeroCard:    { borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 12 },
  chakraHeroTitle:   { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  chakraHeroSub:     { fontSize: 12, lineHeight: 18 },
  chakraOpenBtn:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  chakraOpenBtnText: { fontSize: 12, fontWeight: '700' },
  chakraRow:         { flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'center' },
  chakraDot:         { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },

  // layer panel
  layerToggleRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  layerToggleLabel:  { flex: 1, fontSize: 14, fontWeight: '600' },
  layerPanel:        { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 10, gap: 12 },
  layerPanelTitle:   { fontSize: 12, lineHeight: 18 },
  layerVolRow:       { gap: 6 },
  layerVolLabel:     { fontSize: 13, fontWeight: '600' },
  layerPickerLabel:  { fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  layer2Chip:        { flexDirection: 'column', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  layer2ChipLabel:   { fontSize: 11, fontWeight: '600' },
  layerNote:         { fontSize: 11, lineHeight: 16, fontStyle: 'italic' },

  // category chips
  catChip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  catChipText:       { fontSize: 12, fontWeight: '700' },

  // sound grid
  grid:              { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card:              { width: '47%', padding: 18, borderRadius: 22, borderWidth: 1, overflow: 'hidden', minHeight: 210 },
  recBadge:          { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1, marginBottom: 8 },
  recBadgeText:      { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  emoji:             { fontSize: 34, marginBottom: 10 },
  cardLabel:         { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  desc:              { fontSize: 12.5, lineHeight: 19 },
  miniMeta:          { marginTop: 14, fontSize: 11.5, fontWeight: '700' },

  // breathing toggle
  breathToggleRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  breathIconWrap:    { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  breathToggleTitle: { fontSize: 14, fontWeight: '700' },
  breathToggleSub:   { fontSize: 12, lineHeight: 17, marginTop: 2 },
  breathToggleSwitch:{ width: 42, height: 24, borderRadius: 12, padding: 3, justifyContent: 'center' },
  breathToggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF' },
  breathNoSession:   { fontSize: 12, lineHeight: 18, marginTop: 8, textAlign: 'center' },

  // sleep timer
  sleepTimerCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden' },
  sleepTimerIcon:    { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sleepTimerTitle:   { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  sleepTimerSub:     { fontSize: 13, lineHeight: 19 },

  // session history
  emptyHistory:      { borderRadius: 18, borderWidth: 1, padding: 24, alignItems: 'center', gap: 8 },
  emptyHistoryEmoji: { fontSize: 32 },
  emptyHistoryTitle: { fontSize: 15, fontWeight: '700' },
  emptyHistorySub:   { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  historyCard:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  historyIconWrap:   { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  historyEmoji:      { fontSize: 22 },
  historyName:       { fontSize: 14, fontWeight: '700' },
  historySub:        { fontSize: 12, lineHeight: 17 },
  historyMood:       { fontSize: 11, fontWeight: '700' },
  historyAccent:     { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  historyAccentText: { fontSize: 11, fontWeight: '800' },

  // benefits expandable
  benefitCard:       { borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden' },
  benefitHeaderRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  benefitIcon:       { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  benefitTitle:      { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  benefitShort:      { fontSize: 13, lineHeight: 19, flex: 1 },
  benefitFull:       { fontSize: 13, lineHeight: 20, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },

  // co dalej
  nextRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  nextIcon:          { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nextTitle:         { fontSize: 14, fontWeight: '700' },
  nextSub:           { fontSize: 12, lineHeight: 18, marginTop: 2 },

  // modals
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.60)', justifyContent: 'flex-end' },
  modalSheet:        { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle:       { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle:        { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  modalSub:          { fontSize: 13, lineHeight: 19, marginBottom: 20 },
  chakraModalRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  chakraModalName:   { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  chakraModalDesc:   { fontSize: 12, lineHeight: 17 },
  chakraFreqBadge:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  chakraFreqText:    { fontSize: 11, fontWeight: '800' },

  // mood modal
  moodSheet:         { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, alignItems: 'center' },
  moodTitle:         { fontSize: 18, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  moodSub:           { fontSize: 13, lineHeight: 19, marginBottom: 20, textAlign: 'center' },
  moodRow:           { flexDirection: 'row', gap: 10, marginBottom: 16 },
  moodBtn:           { width: 52, height: 64, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  moodBtnEmoji:      { fontSize: 22 },
  moodBtnScore:      { fontSize: 11, fontWeight: '700' },
  moodSkip:          { paddingVertical: 8 },
  moodSkipText:      { fontSize: 13 },
});

export default SoundBathScreen;
