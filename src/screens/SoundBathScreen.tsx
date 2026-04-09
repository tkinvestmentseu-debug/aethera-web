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
import Reanimated, {
  FadeInDown,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient as SvgLinearGradient, Path, Stop, G } from 'react-native-svg';
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
import { AudioService } from '../core/services/audio.service';
import type { AmbientSoundscape } from '../core/services/audio.service';
import { getResolvedTheme } from '../core/theme/tokens';
import { useAppStore } from '../store/useAppStore';
import { layout } from '../core/theme/designSystem';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import { MusicToggleButton } from '../components/MusicToggleButton';

const { width: SW } = Dimensions.get('window');

// ── Module-level Reanimated components (NEVER inside component body) ───────────
const AnimatedPath = Reanimated.createAnimatedComponent(Path);
const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);

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

type SoundEntry = {
  id: AmbientSoundscape;
  label: string;
  emoji: string;
  accent: string;
  title: string;
  copy: string;
  category: 'natura' | 'ceremonia' | 'mistyczny';
  hz?: string;
  brainState?: string;
};

const ALL_SOUNDSCAPES: SoundEntry[] = [
  { id: 'rain',   label: 'Deszcz',             emoji: '🌧️', accent: '#8FB7FF', category: 'natura',    title: 'Deszczowa regulacja',    copy: 'Miękkie wyhamowanie, sen i domknięcie nadmiaru bodźców.',      hz: '7.83 Hz', brainState: 'Theta' },
  { id: 'waves',  label: 'Ocean',              emoji: '🌊', accent: '#67D1FF', category: 'natura',    title: 'Fale i koherencja',      copy: 'Równowaga, oddech i płynniejszy rytm układu nerwowego.',       hz: '432 Hz',  brainState: 'Alpha' },
  { id: 'fire',   label: 'Ognisko',            emoji: '🔥', accent: '#F59E0B', category: 'natura',    title: 'Ogień i skupienie',      copy: 'Ciepło, obecność i mocniejsza koncentracja bez pośpiechu.',   hz: '40 Hz',   brainState: 'Gamma' },
  { id: 'forest', label: 'Las',                emoji: '🌲', accent: '#34D399', category: 'natura',    title: 'Las i grunt',            copy: 'Stabilizacja, regeneracja i powrót do prostego centrum.',      hz: '528 Hz',  brainState: 'Alpha' },
  { id: 'wind',   label: 'Wiatr',              emoji: '💨', accent: '#CBD5E1', category: 'natura',    title: 'Wiatr i reset',          copy: 'Przewietrzenie umysłu i lżejsze wyjście z przeciążenia.',      hz: '174 Hz',  brainState: 'Delta' },
  { id: 'night',  label: 'Noc',               emoji: '🌙', accent: '#A78BFA', category: 'natura',    title: 'Noc i ukojenie',         copy: 'Spokojne schodzenie z intensywności dnia w ciszę i miękkość.', hz: '396 Hz',  brainState: 'Theta' },
  { id: 'cave',   label: 'Jaskinia',           emoji: '🪨', accent: '#B08968', category: 'natura',    title: 'Jaskinia i głębia',      copy: 'Kontener ciszy dla głębokiego skupienia i zejścia pod powierzchnię.', hz: '852 Hz', brainState: 'Theta' },
  { id: 'ritual', label: 'Rytuał',             emoji: '🕯️', accent: '#CEAE72', category: 'ceremonia', title: 'Rytualna komnata',       copy: 'Ceremonialne tło do praktyki, journalingu i czytania symboli.', hz: '963 Hz', brainState: 'Gamma' },
  { id: 'waves',  label: 'Misy tybetańskie',   emoji: '🔔', accent: '#DDD6FE', category: 'ceremonia', title: 'Misy tybetańskie',       copy: 'Wibracje mis wyrównują energię i wprowadzają w stan alfa.',     hz: '639 Hz',  brainState: 'Alpha' },
  { id: 'ritual', label: 'Kryształowe misy',   emoji: '💎', accent: '#BAE6FD', category: 'ceremonia', title: 'Kryształowe misy',       copy: 'Czyste tony krystaliczne aktywują koherencję serca i głowy.',   hz: '741 Hz',  brainState: 'Beta'  },
  { id: 'waves',  label: 'Wieloryby',          emoji: '🐋', accent: '#38BDF8', category: 'mistyczny', title: 'Pieśni wielorybów',      copy: 'Niskie, potężne głosy otwierają świadomość głębin i intuicji.', hz: '40 Hz',  brainState: 'Gamma' },
  { id: 'wind',   label: 'Wodospad',           emoji: '🏞️', accent: '#6EE7B7', category: 'natura',    title: 'Wodospad i oczyszczenie',copy: 'Potężny, ciągły szum wody wymywa napięcie z ciała i umysłu.',   hz: '528 Hz',  brainState: 'Alpha' },
];

const UNIQUE_SOUNDSCAPES = Array.from(
  new Map(ALL_SOUNDSCAPES.map((s) => [s.label, s])).values(),
);

const BRAIN_STATE_COLORS: Record<string, string> = {
  Delta: '#8B5CF6',
  Theta: '#A78BFA',
  Alpha: '#34D399',
  Beta:  '#60A5FA',
  Gamma: '#F59E0B',
};

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

const BREATHING_PHASES = ['Wdech', 'Zatrzymaj', 'Wydech', 'Zatrzymaj'];
const BREATHING_COUNTS = [4, 4, 4, 4];
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

// ── Sub-component: SoundOrb ────────────────────────────────────────────────────
// Central pulsing orb with frequency bars in semicircle — WOW design
// Rules followed: Animated.createAnimatedComponent at module level above,
//   outer Reanimated.View has no entering when it has transform (split)

const ORB_SIZE = 220;
const ORB_CX   = ORB_SIZE / 2;
const ORB_CY   = ORB_SIZE / 2;
const ORB_R    = 72;
const NUM_BARS = 32;

/** Returns SVG path for a single frequency bar at angle theta */
function barPath(theta: number, innerR: number, outerR: number, cx: number, cy: number): string {
  const x1 = cx + innerR * Math.cos(theta);
  const y1 = cy + innerR * Math.sin(theta);
  const x2 = cx + outerR * Math.cos(theta);
  const y2 = cy + outerR * Math.sin(theta);
  return `M${x1.toFixed(2)},${y1.toFixed(2)} L${x2.toFixed(2)},${y2.toFixed(2)}`;
}

const SoundOrb: React.FC<{ playing: boolean; accent: string; emoji: string }> = ({ playing, accent, emoji }) => {
  // Shared values for orb pulse and outer ring rotation
  const orbScale   = useSharedValue(1);
  const glowOpacity= useSharedValue(0.3);
  const rot1       = useSharedValue(0);
  const rot2       = useSharedValue(0);
  // 32 bar heights (0→1) — animated with staggered sine offsets
  const barHeights = useRef(
    Array.from({ length: NUM_BARS }, () => useSharedValue(0.2)),
  ).current;

  // Bar animation ticker — uses a phase counter on a shared value
  const barPhase = useSharedValue(0);

  useEffect(() => {
    if (playing) {
      // Orb pulse
      cancelAnimation(orbScale);
      cancelAnimation(glowOpacity);
      orbScale.value    = withRepeat(withSequence(withTiming(1.06, { duration: 1100, easing: Easing.inOut(Easing.sin) }), withTiming(0.96, { duration: 1100, easing: Easing.inOut(Easing.sin) })), -1, true);
      glowOpacity.value = withRepeat(withSequence(withTiming(0.65, { duration: 900 }), withTiming(0.28, { duration: 900 })), -1, true);
      // Ring rotation
      cancelAnimation(rot1);
      cancelAnimation(rot2);
      rot1.value = withRepeat(withTiming(360,  { duration: 8000,  easing: Easing.linear }), -1, false);
      rot2.value = withRepeat(withTiming(-360, { duration: 13000, easing: Easing.linear }), -1, false);
      // Bar heights — each bar gets a different sine phase
      barHeights.forEach((sv, i) => {
        cancelAnimation(sv);
        const delay    = (i / NUM_BARS) * 1800;
        const duration = 700 + (i % 7) * 120;
        const target   = 0.35 + 0.55 * Math.abs(Math.sin((i / NUM_BARS) * Math.PI));
        sv.value = withRepeat(
          withSequence(
            withTiming(target,                    { duration: duration + delay % 300 }),
            withTiming(0.15 + 0.25 * Math.random(), { duration: duration }),
          ),
          -1,
          true,
        );
      });
    } else {
      cancelAnimation(orbScale);
      cancelAnimation(glowOpacity);
      cancelAnimation(rot1);
      cancelAnimation(rot2);
      orbScale.value    = withTiming(1,    { duration: 600 });
      glowOpacity.value = withTiming(0.2,  { duration: 600 });
      rot1.value        = withTiming(0,    { duration: 800 });
      rot2.value        = withTiming(0,    { duration: 800 });
      barHeights.forEach((sv) => {
        cancelAnimation(sv);
        sv.value = withTiming(0.15, { duration: 600 });
      });
    }
  }, [playing]);

  // Animated styles for the orb (scale) and glow (opacity)
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot1.value}deg` }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot2.value}deg` }],
  }));

  // Animated props for each bar (strokeWidth changes to simulate height)
  // We use d (path) computed from a fixed geometry but the opacity changes
  // Bar visual: each bar is a radial line from innerR to outerR
  // Height is simulated by scaling outerR via barHeight sv
  const INNER_R = ORB_R + 16;
  const MAX_BAR = 36; // max extra length beyond inner radius

  return (
    <View style={{ width: ORB_SIZE, height: ORB_SIZE, alignSelf: 'center' }}>
      {/* Glow — outer wrapper, no entering (only opacity animates) */}
      <Reanimated.View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }, glowStyle]}>
        <View style={{
          width: ORB_R * 2 + 40,
          height: ORB_R * 2 + 40,
          borderRadius: ORB_R + 20,
          backgroundColor: accent + '44',
        }} />
      </Reanimated.View>

      {/* SVG layer — bars + rings */}
      <View style={StyleSheet.absoluteFillObject}>
        <Svg width={ORB_SIZE} height={ORB_SIZE}>
          <Defs>
            <SvgLinearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={accent} stopOpacity="0.9" />
              <Stop offset="0.5" stopColor={accent + 'EE'} stopOpacity="1" />
              <Stop offset="1" stopColor={accent + '66'} stopOpacity="0.7" />
            </SvgLinearGradient>
            <SvgLinearGradient id="orbGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={accent + 'CC'} stopOpacity="0.9" />
              <Stop offset="1" stopColor={accent + '44'} stopOpacity="0.5" />
            </SvgLinearGradient>
          </Defs>

          {/* Static frequency bars (32 bars, semicircle top half) */}
          {Array.from({ length: NUM_BARS }).map((_, i) => {
            // Spread bars across the full circle (360°)
            const theta = ((i / NUM_BARS) * Math.PI * 2) - Math.PI / 2;
            const barLen = MAX_BAR * (0.2 + 0.8 * Math.abs(Math.sin((i / NUM_BARS) * Math.PI * 2.3 + 0.5)));
            const x1 = ORB_CX + INNER_R * Math.cos(theta);
            const y1 = ORB_CY + INNER_R * Math.sin(theta);
            const x2 = ORB_CX + (INNER_R + barLen) * Math.cos(theta);
            const y2 = ORB_CY + (INNER_R + barLen) * Math.sin(theta);
            const opacity = playing ? (0.5 + 0.5 * Math.abs(Math.sin(i * 0.7))) : 0.2;
            return (
              <Line
                key={`bar-${i}`}
                x1={x1.toFixed(2)}
                y1={y1.toFixed(2)}
                x2={x2.toFixed(2)}
                y2={y2.toFixed(2)}
                stroke={accent}
                strokeWidth={playing ? 1.8 : 1.2}
                strokeOpacity={opacity}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      </View>

      {/* Outer dashed rotating ring — outer Reanimated.View has transform, no entering */}
      <Reanimated.View style={[StyleSheet.absoluteFillObject, ring1Style]}>
        <Svg width={ORB_SIZE} height={ORB_SIZE}>
          <Circle
            cx={ORB_CX}
            cy={ORB_CY}
            r={INNER_R + MAX_BAR + 10}
            stroke={accent + '33'}
            strokeWidth={1.2}
            fill="none"
            strokeDasharray="4 5"
          />
        </Svg>
      </Reanimated.View>

      {/* Inner counter-rotating ring */}
      <Reanimated.View style={[StyleSheet.absoluteFillObject, ring2Style]}>
        <Svg width={ORB_SIZE} height={ORB_SIZE}>
          <Circle
            cx={ORB_CX}
            cy={ORB_CY}
            r={INNER_R - 4}
            stroke={accent + '44'}
            strokeWidth={1}
            fill="none"
            strokeDasharray="8 6"
          />
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <Circle
                key={`dot-${angle}`}
                cx={ORB_CX + (INNER_R - 4) * Math.cos(rad)}
                cy={ORB_CY + (INNER_R - 4) * Math.sin(rad)}
                r={2.2}
                fill={accent + '88'}
              />
            );
          })}
        </Svg>
      </Reanimated.View>

      {/* Central orb — outer View (no transform), inner Reanimated.View (scale transform) */}
      <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
        <Reanimated.View style={orbStyle}>
          <View style={{
            width: ORB_R * 2,
            height: ORB_R * 2,
            borderRadius: ORB_R,
            overflow: 'hidden',
            borderWidth: 1.5,
            borderColor: accent + '88',
          }}>
            <LinearGradient
              colors={[accent + 'CC', accent + '55', accent + '22']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 40, textAlign: 'center' }}>{emoji}</Text>
            </View>
          </View>
        </Reanimated.View>
      </View>
    </View>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export const SoundBathScreen: React.FC = () => {
  const { t } = useTranslation();
  useAudioCleanup();
  const navigation = useNavigation<any>();
  const addFavoriteItem    = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem     = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);

  // Theme pattern — per memory rules
  const themeName = useAppStore(s => s.themeName);
  const theme     = getResolvedTheme(themeName);
  const isLight   = theme.background.startsWith('#F');

  const ACCENT     = '#A78BFA';
  const textColor  = isLight ? '#1A1410'                  : '#F5F1EA';
  const subColor   = isLight ? '#6A5A48'                  : '#B0A393';
  const cardBg     = isLight ? 'rgba(255,255,255,0.88)'   : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)'     : 'rgba(255,255,255,0.12)';
  const divColor   = isLight ? 'rgba(122,95,54,0.14)'     : 'rgba(255,255,255,0.07)';

  // ── Playback state ──
  const [active,  setActive]  = useState<AmbientSoundscape | null>(null);
  const [active2, setActive2] = useState<AmbientSoundscape | null>(null);
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
    : (['#05050F', '#0A0A18', '#0F0C1A'] as const);

  const vizAccent = activeEntry?.accent ?? ACCENT;
  const vizEmoji  = activeEntry?.emoji  ?? '🎵';

  // ── Pre-warm all audio on screen mount ──
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
      lastActiveRef.current   = id;
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

  const timerDisplay = timerRemaining !== null
    ? formatDuration(timerRemaining)
    : selectedDuration > 0
      ? `${selectedDuration} min`
      : '∞';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView style={sh.safe} edges={['top']}>
        <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFillObject} />

        {/* ── Header ── */}
        <View style={sh.header}>
          <Pressable
            onPress={() => goBackOrToMainTab(navigation, 'Worlds')}
            style={sh.backBtn}
            hitSlop={14}
          >
            <ChevronLeft color={ACCENT} size={28} strokeWidth={1.5} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[sh.headerLabel, { color: ACCENT }]}>{t('soundbath.kapiel_dzwiekowa', '🎶 KĄPIEL DŹWIĘKOWA')}</Text>
            <Text style={[sh.headerTitle, { color: textColor }]}>{t('soundbath.pejzaze_zanurzenia', 'Pejzaże zanurzenia')}</Text>
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
              onPress={() => {
                if (isFavoriteItem('soundbath')) {
                  removeFavoriteItem('soundbath');
                } else {
                  addFavoriteItem({ id: 'soundbath', label: 'Kąpiel Dźwiękowa', route: 'SoundBath', icon: 'Waves', color: ACCENT, addedAt: new Date().toISOString() });
                }
              }}
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

        <ScrollView contentContainerStyle={sh.scroll} showsVerticalScrollIndicator={false}>

          {/* ════════════════════════════════════════════════════════
              HERO ORB SECTION — WOW immersive visualizer
          ════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(30).duration(600)}>
            <View style={[sh.orbContainer, { borderColor: vizAccent + '30', backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(10,8,22,0.82)' }]}>
              {/* Deep gradient background inside orb container */}
              <LinearGradient
                colors={isLight
                  ? [vizAccent + '0D', 'transparent', vizAccent + '06']
                  : [vizAccent + '14', 'rgba(5,5,15,0.0)', vizAccent + '08']}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Main SoundOrb component */}
              <SoundOrb playing={active !== null} accent={vizAccent} emoji={vizEmoji} />

              {/* Hz / Brain state badge */}
              {activeEntry?.hz ? (
                <View style={sh.hzBadgeRow}>
                  <View style={[sh.hzBadge, { backgroundColor: vizAccent + '18', borderColor: vizAccent + '44' }]}>
                    <Text style={[sh.hzText, { color: vizAccent }]}>{activeEntry.hz}</Text>
                    {activeEntry?.title ? (
                      <Text style={[sh.hzSub, { color: vizAccent + 'AA' }]}>{activeEntry.title}</Text>
                    ) : null}
                  </View>
                  {activeEntry?.brainState ? (
                    <View style={[sh.brainBadge, { backgroundColor: (BRAIN_STATE_COLORS[activeEntry.brainState] ?? ACCENT) + '22', borderColor: (BRAIN_STATE_COLORS[activeEntry.brainState] ?? ACCENT) + '55' }]}>
                      <View style={[sh.brainDot, { backgroundColor: BRAIN_STATE_COLORS[activeEntry.brainState] ?? ACCENT }]} />
                      <Text style={[sh.brainText, { color: BRAIN_STATE_COLORS[activeEntry.brainState] ?? ACCENT }]}>{activeEntry.brainState}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* Active info + controls */}
              {active ? (
                <View style={{ alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <Text style={[sh.orbTitle, { color: vizAccent }]}>
                    {activeEntry?.label ?? ''} · {timerDisplay}
                  </Text>
                  {showBreathing && active ? (
                    <View style={[sh.breathCard, { backgroundColor: BREATHING_COLORS[breathPhase] + '18', borderColor: BREATHING_COLORS[breathPhase] + '44' }]}>
                      <Text style={[sh.breathPhaseText, { color: BREATHING_COLORS[breathPhase] }]}>
                        {BREATHING_PHASES[breathPhase]}
                      </Text>
                      <Text style={[sh.breathCountText, { color: BREATHING_COLORS[breathPhase] }]}>
                        {breathCount}
                      </Text>
                    </View>
                  ) : null}
                  <Pressable
                    onPress={() => toggle(active)}
                    style={[sh.stopBtn, { borderColor: vizAccent + '66', backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)' }]}
                  >
                    <Text style={[sh.stopBtnText, { color: vizAccent }]}>{t('soundbath.zatrzymaj_sesje', 'Zatrzymaj sesję')}</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={[sh.orbIdleText, { color: subColor }]}>{t('soundbath.wybierz_pejzaz_aby_rozpoczac', 'Wybierz pejzaż, aby rozpocząć')}</Text>
              )}
            </View>
          </Reanimated.View>

          {/* ════════════════════════════════════════════════════════
              SOUND SELECTION PILLS — horizontal scrolling glass pills
          ════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(60).duration(500)}>
            <View style={sh.sectionHeaderRow}>
              <Music2 color={ACCENT} size={14} strokeWidth={2} />
              <Text style={[sh.sectionEyebrow, { color: ACCENT, marginBottom: 0, marginTop: 0 }]}>  {t('soundbath.pejzaze_dzwiekowe_szybki_wybor', 'SZYBKI WYBÓR PEJZAŻU')}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sh.pillsScroll}>
              {UNIQUE_SOUNDSCAPES.map((s) => {
                const isOn = active === s.id;
                return (
                  <Pressable
                    key={s.label}
                    onPress={() => toggle(s.id)}
                    style={[
                      sh.soundPill,
                      {
                        backgroundColor: isOn ? s.accent + '22' : isLight ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.07)',
                        borderColor:     isOn ? s.accent         : isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.14)',
                        shadowColor:     isOn ? s.accent         : 'transparent',
                        shadowOpacity:   isOn ? 0.4              : 0,
                        shadowRadius:    isOn ? 10               : 0,
                        shadowOffset:    { width: 0, height: 0 },
                        elevation:       isOn ? 6                : 0,
                      },
                    ]}
                  >
                    <Text style={sh.pillEmoji}>{s.emoji}</Text>
                    <Text style={[sh.pillLabel, { color: isOn ? s.accent : textColor }]}>{s.label}</Text>
                    {s.hz ? (
                      <Text style={[sh.pillHz, { color: isOn ? s.accent + 'AA' : subColor }]}>{s.hz}</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Reanimated.View>

          {/* ════════════════════════════════════════════════════════
              §1 PRZYGOTOWANIE DO SESJI
          ════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(80).duration(500)}>
            <Text style={[sh.sectionEyebrow, { color: ACCENT }]}>{t('soundbath.przygotowa_do_sesji', '🧘 PRZYGOTOWANIE DO SESJI')}</Text>
            {PREP_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <View
                  key={index}
                  style={[
                    sh.prepRow,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                    index < PREP_STEPS.length - 1 && { marginBottom: 10 },
                  ]}
                >
                  <View style={[sh.prepNumber, { backgroundColor: ACCENT + '1A', borderColor: ACCENT + '33' }]}>
                    <Text style={[sh.prepNumberText, { color: ACCENT }]}>{index + 1}</Text>
                  </View>
                  <View style={[sh.prepIconWrap, { backgroundColor: ACCENT + '12' }]}>
                    <Icon color={ACCENT} size={16} strokeWidth={1.8} />
                  </View>
                  <Text style={[sh.prepText, { color: textColor }]}>{step.emoji} {step.text}</Text>
                </View>
              );
            })}
          </Reanimated.View>

          {/* ════════════════════════════════════════════════════════
              §2 CZAS SESJI
          ════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(95).duration(500)}>
            <View style={sh.sectionHeaderRow}>
              <Clock color={ACCENT} size={14} strokeWidth={2} />
              <Text style={[sh.sectionEyebrow, { color: ACCENT, marginBottom: 0, marginTop: 0 }]}>  {t('soundbath.czas_sesji', 'CZAS SESJI')}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sh.durationScroll}>
              {DURATIONS.map((d) => {
                const isSel = selectedDuration === d.value;
                return (
                  <Pressable
                    key={d.value}
                    onPress={() => setSelectedDuration(d.value)}
                    style={[sh.durationChip, { backgroundColor: isSel ? ACCENT : cardBg, borderColor: isSel ? ACCENT : cardBorder }]}
                  >
                    <Text style={[sh.durationChipText, { color: isSel ? '#FFFFFF' : subColor }]}>{d.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={[sh.durationHint, { color: subColor }]}>
              {selectedDuration > 0
                ? `Sesja zakończy się po ${selectedDuration} minutach z delikatnym dźwiękiem powiadomienia.`
                : 'Tryb nieskończony — pejzaż gra do ręcznego zatrzymania.'}
            </Text>
          </Reanimated.View>

          {/* ════════════════════════════════════════════════════════
              §3 INTENCJA SESJI
          ════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(110).duration(500)}>
            <View style={sh.sectionHeaderRow}>
              <Target color={ACCENT} size={14} strokeWidth={2} />
              <Text style={[sh.sectionEyebrow, { color: ACCENT, marginBottom: 0, marginTop: 0 }]}>  {t('soundbath.intencja_sesji', 'INTENCJA SESJI')}</Text>
            </View>
            <View style={sh.intentionGrid}>
              {SESSION_INTENTIONS.map((intention) => {
                const isSel = selectedIntention === intention.id;
                return (
                  <Pressable
                    key={intention.id}
                    onPress={() => setSelectedIntention(isSel ? null : intention.id)}
                    style={[
                      sh.intentionTile,
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
                    <Text style={sh.intentionEmoji}>{intention.emoji}</Text>
                    <Text style={[sh.intentionLabel, { color: isSel ? intention.color : textColor }]}>
                      {intention.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Reanimated.View>

          {/* ════════════════════════════════════════════════════════
              §4 REKOMENDACJA DLA INTENCJI
          ════════════════════════════════════════════════════════ */}
          {selectedIntention ? (
            <Reanimated.View entering={FadeInDown.delay(30).duration(400)}>
              <View style={[sh.mixCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <LinearGradient
                  colors={[(SESSION_INTENTIONS.find((i) => i.id === selectedIntention)?.color ?? ACCENT) + '12', 'transparent']}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={[sh.mixHeading, { color: textColor }]}>{t('soundbath.polacz_intencje_z_pejzazem', '🔊 Połącz intencję z pejzażem')}</Text>
                <Text style={[sh.mixSub, { color: subColor }]}>{t('soundbath.dla_wybranej_intencji_najlepiej_spr', 'Dla wybranej intencji najlepiej sprawdzają się:')}</Text>
                <View style={sh.mixPills}>
                  {recommendations.map((rec) => {
                    const entry = UNIQUE_SOUNDSCAPES.find((s) => s.id === rec);
                    if (!entry) return null;
                    return (
                      <Pressable
                        key={rec}
                        onPress={() => toggle(rec)}
                        style={[sh.mixPill, { backgroundColor: entry.accent + '1A', borderColor: entry.accent + '44' }]}
                      >
                        <Text style={sh.mixPillEmoji}>{entry.emoji}</Text>
                        <Text style={[sh.mixPillText, { color: entry.accent }]}>{entry.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Reanimated.View>
          ) : null}

          {/* ════════════════════════════════════════════════════════
              §5 TRYB CZAKR
          ════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(120).duration(500)}>
            <View style={sh.sectionHeaderRow}>
              <Zap color={ACCENT} size={14} strokeWidth={2} />
              <Text style={[sh.sectionEyebrow, { color: ACCENT, marginBottom: 0, marginTop: 0 }]}>  {t('soundbath.tryb_czakr', 'TRYB CZAKR')}</Text>
            </View>
            <View style={[sh.chakraHeroCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <LinearGradient colors={[ACCENT + '10', 'transparent']} style={StyleSheet.absoluteFillObject} />
              <View style={{ flex: 1 }}>
                <Text style={[sh.chakraHeroTitle, { color: textColor }]}>
                  {t('soundbath.misy_nastrojone_na_czestotliw_czakr', 'Misy nastrojone na częstotliwości czakr')}
                </Text>
                <Text style={[sh.chakraHeroSub, { color: subColor }]}>
                  {chakraMode
                    ? `Aktywna: ${CHAKRA_MODES.find((c) => c.id === chakraMode)?.name ?? ''} — ${CHAKRA_MODES.find((c) => c.id === chakraMode)?.freq ?? ''}`
                    : 'Wybierz czakrę i uruchom odpowiedni pejzaż dźwiękowy'}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowChakraModal(true)}
                style={[sh.chakraOpenBtn, { borderColor: ACCENT + '55', backgroundColor: ACCENT + '14' }]}
              >
                <Text style={[sh.chakraOpenBtnText, { color: ACCENT }]}>{t('soundbath.wybierz', 'Wybierz')}</Text>
              </Pressable>
            </View>
            {chakraMode ? (
              <View style={sh.chakraRow}>
                {CHAKRA_MODES.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      setChakraMode(c.id);
                      toggle('waves');
                    }}
                    style={[
                      sh.chakraDot,
                      { backgroundColor: c.color + (chakraMode === c.id ? 'EE' : '33'), borderColor: c.color },
                    ]}
                  >
                    <Text style={{ fontSize: 12 }}>{c.emoji}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </Reanimated.View>

          {/* ════════════════════════════════════════════════════════
              §6 MIKSOWANIE — layer 2 soundscape
          ════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(130).duration(500)}>
            <Pressable
              onPress={() => setShowLayerPanel((v) => !v)}
              style={[sh.layerToggleRow, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <Layers color={ACCENT} size={16} strokeWidth={1.8} />
              <Text style={[sh.layerToggleLabel, { color: textColor }]}>{t('soundbath.miksowanie_warstw_dzwieku', 'Miksowanie warstw dźwięku')}</Text>
              {showLayerPanel
                ? <ChevronUp color={subColor} size={16} />
                : <ChevronDown color={subColor} size={16} />}
            </Pressable>

            {showLayerPanel ? (
              <Reanimated.View entering={FadeInDown.delay(0).duration(350)}>
                <View style={[sh.layerPanel, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[sh.layerPanelTitle, { color: subColor }]}>
                    {t('soundbath.wybierz_drugi_pejzaz_i_wyreguluj', 'Wybierz drugi pejzaż i wyreguluj głośność każdej warstwy niezależnie.')}
                  </Text>
                  <View style={sh.layerVolRow}>
                    <Text style={[sh.layerVolLabel, { color: textColor }]}>
                      {active ? `${activeEntry?.emoji ?? '🎵'} Warstwa 1: ${activeEntry?.label ?? active}` : 'Warstwa 1: brak'}
                    </Text>
                  </View>
                  <Text style={[sh.layerPickerLabel, { color: subColor }]}>{t('soundbath.warstwa_2', 'Warstwa 2:')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                    {UNIQUE_SOUNDSCAPES.slice(0, 8).map((s) => {
                      const isSel2 = active2 === s.id;
                      return (
                        <Pressable
                          key={s.label}
                          onPress={() => toggleLayer2(s.id)}
                          style={[
                            sh.layer2Chip,
                            { backgroundColor: isSel2 ? s.accent + '22' : cardBg, borderColor: isSel2 ? s.accent : cardBorder },
                          ]}
                        >
                          <Text style={{ fontSize: 16 }}>{s.emoji}</Text>
                          <Text style={[sh.layer2ChipLabel, { color: isSel2 ? s.accent : subColor }]}>{s.label}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <Text style={[sh.layerNote, { color: subColor }]}>
                    {t('soundbath.uwaga_podglad_miksowania_glosnosc_w', 'Uwaga: podgląd miksowania — głośność warstwy 2 jest symulowana wizualnie. Pełne wsparcie wielokanałowe zależy od możliwości urządzenia.')}
                  </Text>
                </View>
              </Reanimated.View>
            ) : null}
          </Reanimated.View>

          {/* ════════════════════════════════════════════════════════
              §7 PEJZAŻE DŹWIĘKOWE — full grid
          ════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(140).duration(500)}>
            <Text style={[sh.sectionEyebrow, { color: ACCENT }]}>{t('soundbath.pejzaze_dzwiekowe', '🎵 PEJZAŻE DŹWIĘKOWE')}</Text>

            {/* Category filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
              {(['wszystkie', 'natura', 'ceremonia', 'mistyczny'] as const).map((cat) => {
                const isSel = soundCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSoundCategory(cat)}
                    style={[sh.catChip, { backgroundColor: isSel ? ACCENT + '22' : cardBg, borderColor: isSel ? ACCENT : cardBorder }]}
                  >
                    <Text style={[sh.catChipText, { color: isSel ? ACCENT : subColor }]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={sh.grid}>
              {filteredSoundscapes.map((s) => {
                const isOn  = active === s.id;
                const isRec = recommendations.includes(s.id);
                return (
                  <Pressable
                    key={s.label}
                    onPress={() => toggle(s.id)}
                    style={[
                      sh.card,
                      {
                        backgroundColor: isOn ? s.accent + '14' : cardBg,
                        borderColor:     isOn ? s.accent + '66' : isRec ? s.accent + '44' : cardBorder,
                        shadowColor:     isOn ? s.accent : 'transparent',
                        shadowOpacity:   isOn ? 0.3 : 0,
                        shadowRadius:    isOn ? 14 : 0,
                        shadowOffset:    { width: 0, height: 4 },
                        elevation:       isOn ? 8 : 0,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[isOn ? s.accent + '16' : isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', 'transparent']}
                      style={StyleSheet.absoluteFillObject}
                    />
                    {isRec && !isOn ? (
                      <View style={[sh.recBadge, { backgroundColor: s.accent + '22', borderColor: s.accent + '55' }]}>
                        <Text style={[sh.recBadgeText, { color: s.accent }]}>{t('soundbath.polecane', 'Polecane')}</Text>
                      </View>
                    ) : null}
                    {/* Large emoji */}
                    <View style={[sh.cardEmojiWrap, { backgroundColor: isOn ? s.accent + '22' : s.accent + '10', borderColor: isOn ? s.accent + '66' : s.accent + '22' }]}>
                      <Text style={sh.cardEmojiText}>{s.emoji}</Text>
                    </View>
                    <Text style={[sh.cardLabel, isOn ? { color: s.accent } : { color: textColor }]}>{s.label}</Text>
                    {/* Hz badge */}
                    {s.hz ? (
                      <View style={[sh.cardHzBadge, { backgroundColor: (BRAIN_STATE_COLORS[s.brainState ?? ''] ?? ACCENT) + '18' }]}>
                        <Text style={[sh.cardHzText, { color: BRAIN_STATE_COLORS[s.brainState ?? ''] ?? ACCENT }]}>
                          {s.hz} · {s.brainState}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={[sh.desc, { color: subColor }]}>{s.copy}</Text>
                    <Text style={[sh.miniMeta, { color: s.accent }]}>
                      {isOn ? 'Dotknij, aby zatrzymać' : 'Dotknij, aby wejść'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Reanimated.View>

          {/* ════════════════════════════════════════════════════════
              §8 PRZEWODNIK ODDECHOWY
          ════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(150).duration(500)}>
            <Pressable
              onPress={() => setShowBreathing((v) => !v)}
              style={[sh.breathToggleRow, { backgroundColor: showBreathing ? ACCENT + '18' : cardBg, borderColor: showBreathing ? ACCENT + '55' : cardBorder }]}
            >
              <View style={[sh.breathIconWrap, { backgroundColor: ACCENT + '16' }]}>
                <Wind color={ACCENT} size={18} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[sh.breathToggleTitle, { color: textColor }]}>{t('soundbath.przewodnik_oddechowy', 'Przewodnik oddechowy')}</Text>
                <Text style={[sh.breathToggleSub, { color: subColor }]}>
                  {t('soundbath.box_breathing_4_4_4', 'Box breathing 4-4-4-4 zsynchronizowany z sesją')}
                </Text>
              </View>
              <View style={[sh.breathToggleSwitch, { backgroundColor: showBreathing ? ACCENT : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)') }]}>
                <View style={[sh.breathToggleThumb, { alignSelf: showBreathing ? 'flex-end' : 'flex-start' }]} />
              </View>
            </Pressable>
            {showBreathing && !active ? (
              <Text style={[sh.breathNoSession, { color: subColor }]}>
                {t('soundbath.uruchom_pejzaz_dzwiekowy_aby_aktywo', 'Uruchom pejzaż dźwiękowy, aby aktywować przewodnik oddechowy.')}
              </Text>
            ) : null}
          </Reanimated.View>

          {/* ════════════════════════════════════════════════════════
              §9 TIMER ZASYPIANIA
          ════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(160).duration(500)}>
            <View style={[sh.sleepTimerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <LinearGradient colors={['#8B5CF6' + '0D', 'transparent']} style={StyleSheet.absoluteFillObject} />
              <View style={[sh.sleepTimerIcon, { backgroundColor: '#8B5CF6' + '18' }]}>
                <Moon color="#8B5CF6" size={20} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[sh.sleepTimerTitle, { color: textColor }]}>{t('soundbath.timer_zasypiania', 'Timer zasypiania')}</Text>
                <Text style={[sh.sleepTimerSub, { color: subColor }]}>
                  {t('soundbath.ustaw_czas_sesji_na_30', 'Ustaw czas sesji na 30–60 min — przez ostatnie 5 minut pejzaż delikatnie wycisza się do zera, żeby nie przerywać snu.')}
                </Text>
              </View>
            </View>
          </Reanimated.View>

          {/* ════════════════════════════════════════════════════════
              §10 TWOJE SESJE
          ════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(170).duration(500)}>
            <View style={sh.sectionHeaderRow}>
              <History color={ACCENT} size={14} strokeWidth={2} />
              <Text style={[sh.sectionEyebrow, { color: ACCENT, marginBottom: 0, marginTop: 0 }]}>  {t('soundbath.twoje_sesje', 'TWOJE SESJE')}</Text>
            </View>
            {sessionHistory.length === 0 ? (
              <View style={[sh.emptyHistory, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <Text style={sh.emptyHistoryEmoji}>🎧</Text>
                <Text style={[sh.emptyHistoryTitle, { color: textColor }]}>{t('soundbath.zacznij_swoja_pierwsza_sesje', 'Zacznij swoją pierwszą sesję')}</Text>
                <Text style={[sh.emptyHistorySub, { color: subColor }]}>
                  {t('soundbath.po_co_najmniej_30_sekundach', 'Po co najmniej 30 sekundach odsłuchu Twoja sesja pojawi się tutaj.')}
                </Text>
              </View>
            ) : (
              sessionHistory.slice(0, 7).map((entry, index) => {
                const entryData = UNIQUE_SOUNDSCAPES.find((s) => s.id === entry.id);
                const accent    = entryData?.accent ?? ACCENT;
                const emoji     = entryData?.emoji  ?? '🎵';
                const title     = entryData?.title  ?? entry.id;
                return (
                  <Pressable
                    key={`${entry.id}-${entry.date}-${index}`}
                    onPress={() => setSelectedSession(entry)}
                    style={[
                      sh.historyCard,
                      { backgroundColor: cardBg, borderColor: cardBorder },
                      index < sessionHistory.slice(0, 7).length - 1 && { marginBottom: 10 },
                    ]}
                  >
                    <View style={[sh.historyIconWrap, { backgroundColor: accent + '18' }]}>
                      <Text style={sh.historyEmoji}>{emoji}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[sh.historyName, { color: textColor }]}>{title}</Text>
                      <Text style={[sh.historySub, { color: subColor }]}>
                        {formatDuration(entry.duration)} · {formatRelativeDate(entry.date)}
                        {entry.intention ? ` · ${entry.intention}` : ''}
                      </Text>
                      {entry.moodBefore !== undefined && entry.moodAfter !== undefined ? (
                        <Text style={[sh.historyMood, { color: accent }]}>
                          Nastrój: {moodEmoji(entry.moodBefore)} → {moodEmoji(entry.moodAfter)}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <View style={[sh.historyAccent, { backgroundColor: accent + '22' }]}>
                        <Text style={[sh.historyAccentText, { color: accent }]}>
                          {formatDuration(entry.duration)}
                        </Text>
                      </View>
                      <Text style={{ color: accent + 'AA', fontSize: 9, letterSpacing: 0.5 }}>{t('soundbath.dotknij', 'Dotknij')}</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </Reanimated.View>

          {/* ════════════════════════════════════════════════════════
              §11 DLACZEGO TO DZIAŁA
          ════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(185).duration(500)}>
            <View style={sh.sectionHeaderRow}>
              <BookOpen color={ACCENT} size={14} strokeWidth={2} />
              <Text style={[sh.sectionEyebrow, { color: ACCENT, marginBottom: 0, marginTop: 0 }]}>  {t('soundbath.dlaczego_to_dziala', 'DLACZEGO TO DZIAŁA')}</Text>
            </View>
            {BENEFITS_EXPANDED.map((item, i) => {
              const Icon       = item.icon;
              const isExpanded = expandedBenefit === i;
              return (
                <Pressable
                  key={item.title}
                  onPress={() => setExpandedBenefit(isExpanded ? null : i)}
                  style={[
                    sh.benefitCard,
                    { backgroundColor: cardBg, borderColor: isExpanded ? item.color + '55' : cardBorder },
                    i < BENEFITS_EXPANDED.length - 1 && { marginBottom: 10 },
                  ]}
                >
                  <LinearGradient
                    colors={isExpanded ? [item.color + '10', 'transparent'] : ['transparent', 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={sh.benefitHeaderRow}>
                    <View style={[sh.benefitIcon, { backgroundColor: item.color + '18' }]}>
                      <Icon color={item.color} size={18} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[sh.benefitTitle, { color: item.color }]}>{item.title}</Text>
                      <Text style={[sh.benefitShort, { color: subColor }]}>{item.short}</Text>
                    </View>
                    {isExpanded
                      ? <ChevronUp color={subColor} size={16} />
                      : <ChevronDown color={subColor} size={16} />}
                  </View>
                  {isExpanded ? (
                    <Text style={[sh.benefitFull, { color: subColor, borderTopColor: divColor }]}>
                      {item.full}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </Reanimated.View>

          {/* ════════════════════════════════════════════════════════
              §12 CO DALEJ?
          ════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={[sh.sectionEyebrow, { color: ACCENT }]}>{t('soundbath.co_dalej', '✦ CO DALEJ?')}</Text>
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
                  style={[sh.nextRow, { borderColor: item.color + '33', backgroundColor: cardBg }]}
                >
                  <View style={[sh.nextIcon, { backgroundColor: item.color + '18' }]}>
                    <Icon color={item.color} size={17} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[sh.nextTitle, { color: textColor }]}>{item.label}</Text>
                    <Text style={[sh.nextSub, { color: subColor }]}>{item.sub}</Text>
                  </View>
                  <ArrowRight color={item.color} size={15} strokeWidth={1.5} />
                </Pressable>
              );
            })}
          </Reanimated.View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>

        {/* ════════════════════════════════════════════════════════
            MODAL — Chakra selector
        ════════════════════════════════════════════════════════ */}
        <Modal visible={showChakraModal} transparent animationType="slide" onRequestClose={() => setShowChakraModal(false)}>
          <View style={sh.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowChakraModal(false)} />
            <View style={[sh.modalSheet, { backgroundColor: isLight ? '#F8F4FF' : '#0F0C1A' }]}>
              <View style={[sh.modalHandle, { backgroundColor: isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)' }]} />
              <Text style={[sh.modalTitle, { color: textColor }]}>{t('soundbath.misy_nastrojone_na_czakry', '🎶 Misy nastrojone na czakry')}</Text>
              <Text style={[sh.modalSub, { color: subColor }]}>
                {t('soundbath.wybierz_czakre_uruchomimy_odpowiedn', 'Wybierz czakrę — uruchomimy odpowiedni pejzaż dźwiękowy i wyświetlimy jej częstotliwość.')}
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
                        sh.chakraModalRow,
                        { backgroundColor: isSel ? c.color + '18' : 'transparent', borderColor: isSel ? c.color + '55' : 'transparent' },
                      ]}
                    >
                      <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[sh.chakraModalName, { color: isSel ? c.color : textColor }]}>{c.name}</Text>
                        <Text style={[sh.chakraModalDesc, { color: subColor }]}>{c.desc}</Text>
                      </View>
                      <View style={[sh.chakraFreqBadge, { backgroundColor: c.color + '22', borderColor: c.color + '44' }]}>
                        <Text style={[sh.chakraFreqText, { color: c.color }]}>{c.freq}</Text>
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
          <View style={sh.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowMoodModal(false)} />
            <View style={[sh.moodSheet, { backgroundColor: isLight ? '#F8F4FF' : '#0F0C1A' }]}>
              <View style={[sh.modalHandle, { backgroundColor: isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)' }]} />
              <Text style={[sh.moodTitle, { color: textColor }]}>{t('soundbath.jak_czujesz_sie_teraz', 'Jak czujesz się teraz?')}</Text>
              <Text style={[sh.moodSub, { color: subColor }]}>{t('soundbath.ocenimy_zmiane_po_sesji', 'Ocenimy zmianę po sesji.')}</Text>
              <View style={sh.moodRow}>
                {[1, 2, 3, 4, 5].map((score) => (
                  <Pressable
                    key={score}
                    onPress={() => {
                      setMoodBefore(score);
                      setShowMoodModal(false);
                    }}
                    style={[sh.moodBtn, { borderColor: moodBefore === score ? ACCENT : cardBorder, backgroundColor: moodBefore === score ? ACCENT + '18' : cardBg }]}
                  >
                    <Text style={sh.moodBtnEmoji}>{moodEmoji(score)}</Text>
                    <Text style={[sh.moodBtnScore, { color: subColor }]}>{score}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={() => setShowMoodModal(false)} style={sh.moodSkip}>
                <Text style={[sh.moodSkipText, { color: subColor }]}>{t('soundbath.pomin', 'Pomiń')}</Text>
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
          <View style={sh.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setSelectedSession(null)} />
            {selectedSession !== null && (() => {
              const sessData   = UNIQUE_SOUNDSCAPES.find((s) => s.id === selectedSession.id);
              const sessAccent = sessData?.accent ?? ACCENT;
              const sessEmoji  = sessData?.emoji  ?? '🎵';
              const sessTitle  = sessData?.title  ?? selectedSession.id;
              return (
                <View style={[sh.modalSheet, { backgroundColor: isLight ? '#F8F4FF' : '#0F0C1A' }]}>
                  <View style={[sh.modalHandle, { backgroundColor: isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)' }]} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: sessAccent + '22', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 24 }}>{sessEmoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: sessAccent, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 2 }}>{t('soundbath.szczegoly_sesji', 'SZCZEGÓŁY SESJI')}</Text>
                      <Text style={{ color: textColor, fontSize: 18, fontWeight: '700' }}>{sessTitle}</Text>
                    </View>
                    <Pressable onPress={() => setSelectedSession(null)} hitSlop={12}>
                      <X color={subColor} size={20} strokeWidth={1.8} />
                    </Pressable>
                  </View>
                  {[
                    { label: 'Data',         value: formatRelativeDate(selectedSession.date) },
                    { label: 'Czas trwania', value: formatDuration(selectedSession.duration) },
                    { label: 'Intencja',     value: selectedSession.intention ? selectedSession.intention.charAt(0).toUpperCase() + selectedSession.intention.slice(1) : '—' },
                  ].map((row) => (
                    <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }}>
                      <Text style={{ color: subColor, fontSize: 13 }}>{row.label}</Text>
                      <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>{row.value}</Text>
                    </View>
                  ))}
                  {selectedSession.moodBefore !== undefined && selectedSession.moodAfter !== undefined ? (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }}>
                      <Text style={{ color: subColor, fontSize: 13 }}>{t('soundbath.zmiana_nastroju', 'Zmiana nastroju')}</Text>
                      <Text style={{ color: sessAccent, fontSize: 15, fontWeight: '700' }}>
                        {moodEmoji(selectedSession.moodBefore)} → {moodEmoji(selectedSession.moodAfter)}
                      </Text>
                    </View>
                  ) : null}
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
                      <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>{t('soundbath.powtorz_te_sesje', 'Powtórz tę sesję')}</Text>
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

const sh = StyleSheet.create({
  safe:              { flex: 1 },
  header:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  backBtn:           { width: 40 },
  headerLabel:       { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  headerTitle:       { fontSize: 17, fontWeight: '600' },
  scroll:            { padding: layout.padding.screen, paddingBottom: 24, gap: 20 },
  sectionEyebrow:    { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 14, marginTop: 4 },
  sectionHeaderRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: 4 },

  // ── WOW orb container ──
  orbContainer:      { borderRadius: 28, borderWidth: 1, padding: 22, overflow: 'hidden', alignItems: 'center', gap: 12 },

  // Hz / brain state badges
  hzBadgeRow:        { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 4 },
  hzBadge:           { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  hzText:            { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  hzSub:             { fontSize: 11, fontWeight: '500' },
  brainBadge:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  brainDot:          { width: 7, height: 7, borderRadius: 3.5 },
  brainText:         { fontSize: 12, fontWeight: '700' },

  orbTitle:          { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  orbIdleText:       { fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 4 },

  // breathing in viz
  breathCard:        { marginTop: 4, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 2 },
  breathPhaseText:   { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  breathCountText:   { fontSize: 32, fontWeight: '800' },

  // stop btn
  stopBtn:           { alignSelf: 'center', marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  stopBtnText:       { fontSize: 12, fontWeight: '700' },

  // ── Sound pills (horizontal) ──
  pillsScroll:       { gap: 10, paddingBottom: 4, paddingHorizontal: 2 },
  soundPill:         { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderWidth: 1, gap: 4, minWidth: 68 },
  pillEmoji:         { fontSize: 22 },
  pillLabel:         { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  pillHz:            { fontSize: 9, fontWeight: '600', letterSpacing: 0.4, textAlign: 'center' },

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

  // sound grid — WOW cards
  grid:              { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card:              { width: '47%', padding: 16, borderRadius: 22, borderWidth: 1, overflow: 'hidden', minHeight: 220 },
  cardEmojiWrap:     { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 10 },
  cardEmojiText:     { fontSize: 26 },
  cardHzBadge:       { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  cardHzText:        { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  recBadge:          { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1, marginBottom: 8 },
  recBadgeText:      { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  cardLabel:         { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  desc:              { fontSize: 12.5, lineHeight: 19, flex: 1 },
  miniMeta:          { marginTop: 10, fontSize: 11.5, fontWeight: '700' },

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
