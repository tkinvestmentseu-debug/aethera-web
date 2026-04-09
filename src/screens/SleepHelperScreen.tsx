// @ts-nocheck
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle as SvgCircle, G, Ellipse } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence,
  withDelay, FadeInDown,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ArrowRight, ChevronLeft, Moon, Play, Square, Star,
  BookOpen, Brain, Zap, CheckCircle2, Circle, Wind, Radio,
} from 'lucide-react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { MusicPicker } from '../components/MusicPicker';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { AudioService, BinauralFrequency } from '../core/services/audio.service';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW, height: SH } = Dimensions.get('window');
const ACCENT = '#818CF8';
const DURATIONS = [15, 30, 45, 60, 90];

// ── Sleep quality history types ─────────────────────────────────
interface SleepEntry {
  date: string; // YYYY-MM-DD
  rating: number; // 1-5
}

// ── Body scan steps ─────────────────────────────────────────────
interface BodyScanStep {
  label: string;
  bodyRegion: 'head' | 'shoulders' | 'torso' | 'arms' | 'belly' | 'hips' | 'legs' | 'feet';
  instruction: string;
}

const BODY_SCAN_STEPS: BodyScanStep[] = [
  { label: 'Oddech', bodyRegion: 'torso', instruction: 'Oddychaj powoli przez nos. Poczuj, jak klatka piersiowa unosi się i opada. Nie zmieniaj rytmu — obserwuj.' },
  { label: 'Głowa i twarz', bodyRegion: 'head', instruction: 'Przenieś uwagę na czoło. Rozluźnij brwi, szczękę, język. Niech usta lekko się rozchylą.' },
  { label: 'Ramiona i szyja', bodyRegion: 'shoulders', instruction: 'Poczuj ciężar ramion. Pozwól im opaść. Szyja miękka, oddech swobodny.' },
  { label: 'Klatka i plecy', bodyRegion: 'torso', instruction: 'Skieruj uwagę do klatki piersiowej. Poczuj bicie serca. Plecy stają się ciężkie i rozluźnione.' },
  { label: 'Ramiona i dłonie', bodyRegion: 'arms', instruction: 'Poczuj ręce od łokci po opuszki palców. Może pojawi się mrowienie lub ciepło. To znak rozluźnienia.' },
  { label: 'Brzuch', bodyRegion: 'belly', instruction: 'Brzuch miękki. Przy każdym wydechu odpuszczasz napięcie, które gromadziłaś przez cały dzień.' },
  { label: 'Biodra i okolice', bodyRegion: 'hips', instruction: 'Poczuj wagę bioder. Każde napięcie tu gromadzone przez długi czas — teraz możesz je puścić.' },
  { label: 'Uda i kolana', bodyRegion: 'legs', instruction: 'Przesuń uwagę wzdłuż nóg. Uda ciężkie, kolana rozluźnione, mięśnie spokojne.' },
  { label: 'Łydki i stopy', bodyRegion: 'feet', instruction: 'Poczuj stopy — każdy palec, podeszwy, pięty opierające się o materac. Całe ciało odpoczyna.' },
  { label: 'Całe ciało', bodyRegion: 'torso', instruction: 'Teraz poczuj całe ciało naraz — od stóp po czubek głowy. Jesteś bezpieczna. Możesz odpuścić i zasnąć.' },
];

// ── Checklist items ──────────────────────────────────────────────
const CHECKLIST_ITEMS = [
  { emoji: '📵', text: 'Telefon odłożony przynajmniej 30 min temu', icon: Circle },
  { emoji: '💡', text: 'Przyciemnione lub wyłączone światło', icon: Circle },
  { emoji: '🌡️', text: 'Chłodniejsza temperatura w sypialni', icon: Circle },
  { emoji: '📖', text: 'Kilka minut czytania lub journalingu', icon: Circle },
  { emoji: '🫁', text: 'Powolny oddech przez kilka minut', icon: Circle },
  { emoji: '🙏', text: 'Jedna myśl wdzięczności za ten dzień', icon: Circle },
];

// ── Dream intention suggestions ──────────────────────────────────
const INTENTION_SUGGESTIONS = [
  'Dziś wieczór zapraszam spokojny, regenerujący sen...',
  'Dziś w nocy moje sny przyniosą jasność i wgląd...',
  'Dziś wieczór proszę o sny pełne spokoju i piękna...',
  'Dziś noc jest dla mnie przestrzenią uzdrowienia...',
  'Zapraszam sny, które przynoszą odpowiedzi i spokój...',
  'Dziś w nocy moje podświadome przetwarza i leczy...',
  'Tej nocy pozwalam sobie w pełni odpocząć i odrodzić się...',
];

// ── Utilities ────────────────────────────────────────────────────
const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const getTodayKey = () => new Date().toISOString().slice(0, 10);
const getDateKey = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};
const getDayLabel = (dateKey: string) => {
  const days = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
  return days[new Date(dateKey + 'T12:00:00').getDay()];
};

// ── Aurora wave ─────────────────────────────────────────────────
const AuroraWave = ({ yOffset, color, duration }: { yOffset: number; color: string; duration: number }) => {
  const ty = useSharedValue(0);
  useEffect(() => {
    ty.value = withRepeat(withSequence(withTiming(-12, { duration }), withTiming(12, { duration })), -1, true);
  }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
  const path = `M 0,${yOffset} Q ${SW * 0.25},${yOffset - 18} ${SW * 0.5},${yOffset} Q ${SW * 0.75},${yOffset + 18} ${SW},${yOffset}`;
return (
    <Animated.View style={[StyleSheet.absoluteFill, st]} pointerEvents="none">
      <Svg width={SW} height={SH} style={StyleSheet.absoluteFill}>
        <Path d={path} stroke={color} strokeWidth={1.4} fill="none" opacity={0.5} />
      </Svg>
    </Animated.View>
  );
};

// ── Moon scene background ────────────────────────────────────────
const MoonScene = ({ isLight }: { isLight: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight ? ['#F0EEF8', '#EAE6F5', '#E4DFEF'] as const : ['#050510', '#0A0818', '#0F0C20'] as const}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={SH} style={StyleSheet.absoluteFill}>
      {isLight ? (
        <>
          {Array.from({ length: 20 }, (_, i) => (
            <SvgCircle key={i} cx={(i * 97 + 23) % SW} cy={(i * 73 + 40) % (SH * 0.6)} r={0.8} fill={ACCENT} opacity={0.12 + (i % 3) * 0.04} />
          ))}
          <SvgCircle cx={SW - 70} cy={110} r={55} fill={ACCENT} opacity={0.08} />
          <SvgCircle cx={SW - 70} cy={110} r={57} fill="none" stroke={ACCENT} strokeWidth={1.5} opacity={0.22} />
        </>
      ) : (
        <>
          {Array.from({ length: 50 }, (_, i) => (
            <SvgCircle key={i} cx={(i * 97 + 23) % SW} cy={(i * 73 + 40) % (SH * 0.75)} r={i % 4 === 0 ? 1.4 : 0.8} fill="#FFFFFF" opacity={0.35 + (i % 5) * 0.1} />
          ))}
          <SvgCircle cx={SW - 70} cy={110} r={55} fill="#E8E0FF" opacity={0.88} />
          <SvgCircle cx={SW - 38} cy={98} r={50} fill="#0A0818" />
          <SvgCircle cx={SW - 70} cy={110} r={57} fill="none" stroke="#818CF8" strokeWidth={1.5} opacity={0.18} />
        </>
      )}
    </Svg>
    <AuroraWave yOffset={SH * 0.45} color={ACCENT + '55'} duration={5200} />
    <AuroraWave yOffset={SH * 0.50} color="#A78BFA44" duration={6800} />
    <AuroraWave yOffset={SH * 0.55} color="#6366F133" duration={7400} />
  </View>
);

// ── Moon 3D Widget ──────────────────────────────────────────────
const MoonOrb3D = ({ isLight }: { isLight: boolean }) => {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const rot = useSharedValue(0);
  const pulse = useSharedValue(1);
  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 40000 }), -1, false);
    pulse.value = withRepeat(withSequence(withTiming(1.06, { duration: 3000 }), withTiming(0.96, { duration: 3000 })), -1, false);
  }, []);
  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-25, Math.min(25, e.translationY * 0.15));
      tiltY.value = Math.max(-25, Math.min(25, e.translationX * 0.15));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 1000 });
      tiltY.value = withTiming(0, { duration: 1000 });
    });
  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const orbitStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot.value}deg` }] }));
  const sz = 140; const cx = sz / 2; const R = 44;
return (
    <View style={{ height: 144, alignItems: 'center', justifyContent: 'center', marginVertical: 8 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={outerStyle}>
          <Animated.View style={pulseStyle}>
            <Svg width={sz} height={sz}>
              <SvgCircle cx={cx} cy={cx} r={62} fill={ACCENT + '08'} />
              <SvgCircle cx={cx} cy={cx} r={52} fill={ACCENT + '10'} />
              <SvgCircle cx={cx} cy={cx} r={R} fill={ACCENT + '22'} stroke={ACCENT + '55'} strokeWidth={1.2} />
              <SvgCircle cx={cx + R * 0.38} cy={cx - R * 0.12} r={R * 0.72} fill={isLight ? '#F0EEF8' : '#050510'} opacity={0.82} />
              <Ellipse cx={cx} cy={cx} rx={R} ry={R * 0.26} fill="none" stroke={ACCENT + '40'} strokeWidth={0.9} />
              <SvgCircle cx={cx} cy={cx} r={8} fill={ACCENT} opacity={0.6} />
            </Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, orbitStyle]}>
            <Svg width={sz} height={sz}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                const a = (i / 8) * 2 * Math.PI;
                return <SvgCircle key={i} cx={cx + 62 * Math.cos(a)} cy={cx + 62 * Math.sin(a) * 0.32} r={i % 2 === 0 ? 3.5 : 2} fill={ACCENT} opacity={i % 2 === 0 ? 0.85 : 0.45} />;
              })}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ── Body outline SVG ────────────────────────────────────────────
const BodyOutlineSVG = ({ highlight, isLight }: { highlight: BodyScanStep['bodyRegion']; isLight: boolean }) => {
  const bodyColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.22)';
  const hl = ACCENT;
  const isHead = highlight === 'head';
  const isShoulders = highlight === 'shoulders';
  const isTorso = highlight === 'torso';
  const isArms = highlight === 'arms';
  const isBelly = highlight === 'belly';
  const isHips = highlight === 'hips';
  const isLegs = highlight === 'legs';
  const isFeet = highlight === 'feet';

return (
    <Svg width={72} height={160} viewBox="0 0 72 160">
      {/* Head */}
      <SvgCircle cx={36} cy={14} r={12} fill={isHead ? hl + '55' : 'none'} stroke={isHead ? hl : bodyColor} strokeWidth={1.8} />
      {/* Neck */}
      <Path d="M32,26 L32,32 M40,26 L40,32" stroke={isShoulders ? hl : bodyColor} strokeWidth={1.6} />
      {/* Shoulders */}
      <Path d="M20,36 Q14,34 12,40 L12,58 Q14,62 20,62" fill="none" stroke={isShoulders ? hl : (isArms ? hl : bodyColor)} strokeWidth={1.8} />
      <Path d="M52,36 Q58,34 60,40 L60,58 Q58,62 52,62" fill="none" stroke={isShoulders ? hl : (isArms ? hl : bodyColor)} strokeWidth={1.8} />
      {/* Torso top */}
      <Path d="M22,32 L50,32 L54,38 L54,60 L50,64 L22,64 L18,60 L18,38 Z" fill={isTorso ? hl + '30' : 'none'} stroke={isTorso ? hl : bodyColor} strokeWidth={1.8} />
      {/* Belly */}
      <Path d="M22,64 L50,64 L50,80 L22,80 Z" fill={isBelly ? hl + '30' : 'none'} stroke={isBelly ? hl : bodyColor} strokeWidth={1.8} />
      {/* Hips */}
      <Path d="M20,80 L52,80 L54,92 L18,92 Z" fill={isHips ? hl + '30' : 'none'} stroke={isHips ? hl : bodyColor} strokeWidth={1.8} />
      {/* Left leg */}
      <Path d="M22,92 L20,128 L22,134 L28,134 L30,128 L30,92" fill={isLegs ? hl + '22' : 'none'} stroke={isLegs ? hl : bodyColor} strokeWidth={1.8} />
      {/* Right leg */}
      <Path d="M42,92 L40,128 L42,134 L48,134 L50,128 L50,92" fill={isLegs ? hl + '22' : 'none'} stroke={isLegs ? hl : bodyColor} strokeWidth={1.8} />
      {/* Left foot */}
      <Path d="M20,134 L16,138 L24,142 L30,140 L30,134" fill={isFeet ? hl + '30' : 'none'} stroke={isFeet ? hl : bodyColor} strokeWidth={1.8} />
      {/* Right foot */}
      <Path d="M42,134 L40,140 L48,142 L56,138 L52,134" fill={isFeet ? hl + '30' : 'none'} stroke={isFeet ? hl : bodyColor} strokeWidth={1.8} />
      {/* Arms */}
      <Path d="M18,38 L10,70 L12,74 L18,72 L22,60" fill={isArms ? hl + '22' : 'none'} stroke={isArms ? hl : bodyColor} strokeWidth={1.8} />
      <Path d="M54,38 L62,70 L60,74 L54,72 L50,60" fill={isArms ? hl + '22' : 'none'} stroke={isArms ? hl : bodyColor} strokeWidth={1.8} />
    </Svg>
  );
};

// ── Progress ring for checklist ──────────────────────────────────
const ProgressRing = ({ progress, size = 56 }: { progress: number; size?: number }) => {
  const R = (size - 6) / 2;
  const circumference = 2 * Math.PI * R;
  const strokeDash = circumference * Math.max(0, Math.min(1, progress));
return (
    <Svg width={size} height={size}>
      <SvgCircle cx={size / 2} cy={size / 2} r={R} stroke={ACCENT + '22'} strokeWidth={5} fill="none" />
      <SvgCircle
        cx={size / 2} cy={size / 2} r={R}
        stroke={ACCENT}
        strokeWidth={5}
        fill="none"
        strokeDasharray={`${strokeDash} ${circumference}`}
        strokeLinecap="round"
        rotation={-90}
        origin={`${size / 2}, ${size / 2}`}
      />
      <SvgCircle cx={size / 2} cy={size / 2} r={R - 8} fill={ACCENT + '18'} />
    </Svg>
  );
};

// ── 4-7-8 Breathing circle ───────────────────────────────────────
type BreathPhase478 = 'idle' | 'inhale' | 'hold' | 'exhale';

const BREATH_LABELS: Record<BreathPhase478, string> = {
  idle: 'Gotowa?',
  inhale: 'Wdech — 4',
  hold: 'Zatrzymaj — 7',
  exhale: 'Wydech — 8',
};

const BREATH_COLORS: Record<BreathPhase478, string> = {
  idle: ACCENT,
  inhale: '#A78BFA',
  hold: '#818CF8',
  exhale: '#6366F1',
};

// ── Main screen ─────────────────────────────────────────────────
export const SleepHelperScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const userData = useAppStore(s => s.userData);
  const experience = useAppStore(s => s.experience);
  const { currentTheme, isLight } = useTheme();
  const textColor = isLight ? '#1A1530' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(240,235,226,0.45)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(129,140,248,0.20)' : 'rgba(129,140,248,0.13)';
  const inputBg = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)';
  const isFav = isFavoriteItem('SleepHelper');

  // ── Timer state ──────────────────────────────────────────────
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(30 * 60);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;

  // ── Sleep history ────────────────────────────────────────────
  const [sleepHistory, setSleepHistory] = useState<SleepEntry[]>([]);
  const [todayRating, setTodayRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // ── Checklist ────────────────────────────────────────────────
  const [checkedItems, setCheckedItems] = useState<boolean[]>(CHECKLIST_ITEMS.map(() => false));

  // ── Body scan ────────────────────────────────────────────────
  const [scanActive, setScanActive] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanElapsed, setScanElapsed] = useState(0); // 0-30 within step
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const STEP_DURATION = 30; // seconds per body scan step

  // ── 4-7-8 breathing ─────────────────────────────────────────
  const [breath478Active, setBreath478Active] = useState(false);
  const [breath478Phase, setBreath478Phase] = useState<BreathPhase478>('idle');
  const [breath478Count, setBreath478Count] = useState(0); // seconds into current phase
  const [breath478Cycles, setBreath478Cycles] = useState(0);
  const breathRef478 = useRef<ReturnType<typeof setInterval> | null>(null);
  const breath478Scale = useSharedValue(1);
  const breath478Opacity = useSharedValue(0.6);
  const TARGET_CYCLES = 4;

  // ── Sleep Hz frequencies ──────────────────────────────────────
  const [activeSleepHz, setActiveSleepHz] = useState<BinauralFrequency | null>(null);
  // Track whether ambient was running before Hz was selected so we can restore it.
  const ambientWasRunningRef = useRef(false);

  // ── Dream intention ───────────────────────────────────────────
  const [intentionText, setIntentionText] = useState('');
  const [intentionInput, setIntentionInput] = useState('');
  const [pastIntentions, setPastIntentions] = useState<string[]>([]);
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const dailySuggestion = INTENTION_SUGGESTIONS[new Date().getDay() % INTENTION_SUGGESTIONS.length];

  // ── Preload all Hz tones upfront to avoid playback delay ─────
  useEffect(() => {
    void AudioService.warmBinauralTones(['174hz', '396hz', '432hz', '528hz', '639hz', '741hz', '852hz', '963hz', '40hz']);
  }, []);

  // ── Per-tile loading state (auto-hides after 500ms) ──────────
  const [loadingHz, setLoadingHz] = useState<BinauralFrequency | null>(null);
  const [hzError, setHzError] = useState<string | null>(null);
  const [sleepAiInsight, setSleepAiInsight] = useState<string>('');
  const [sleepAiLoading, setSleepAiLoading] = useState(false);

  const toggleSleepHz = async (freq: BinauralFrequency) => {
    HapticsService.impact('light');
    setHzError(null);

    if (activeSleepHz === freq) {
      // Deselect: stop binaural. If ambient was playing before Hz was selected,
      // restore it so the user gets back to ambient-only mode.
      try {
        // Stop only the binaural player without touching ambient via the low-level path
        await AudioService.stopBinauralToneOnly();
      } catch (_) {}
      setActiveSleepHz(null);
      // Restore ambient if it was running before Hz was selected
      if (ambientWasRunningRef.current) {
        void AudioService.playAmbientForSession(experience?.ambientSoundscape ?? 'forest');
      }
      return;
    }

    // Remember whether ambient is currently playing so we can restore it after binaural starts
    ambientWasRunningRef.current = running; // ambient runs whenever the timer is running

    // Show brief loading indicator, auto-clear after 500ms
    setLoadingHz(freq);
    const loadTimer = setTimeout(() => setLoadingHz(null), 500);
    try {
      // Stop any currently-playing binaural first
      if (activeSleepHz) {
        await AudioService.stopBinauralToneOnly();
      }
      // playBinauralTone pauses the ambient registry internally; we re-start
      // ambient afterwards if it should be co-playing.
      await AudioService.playBinauralTone(freq);
      setActiveSleepHz(freq);
      // If ambient timer is running, restore ambient layer alongside binaural
      if (running) {
        await AudioService.playAmbientForSession(experience?.ambientSoundscape ?? 'forest');
      }
    } catch (_) {
      setHzError('Nie udało się załadować dźwięku. Spróbuj ponownie.');
      setActiveSleepHz(null);
    } finally {
      clearTimeout(loadTimer);
      setLoadingHz(null);
    }
  };

  // ── Load persisted data ──────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const historyRaw = await AsyncStorage.getItem('sleep_history');
        if (historyRaw) {
          const history: SleepEntry[] = JSON.parse(historyRaw);
          setSleepHistory(history);
          const todayEntry = history.find(e => e.date === getTodayKey());
          if (todayEntry) setTodayRating(todayEntry.rating);
        }
        const intentionRaw = await AsyncStorage.getItem('dream_intentions');
        if (intentionRaw) {
          const intentions: string[] = JSON.parse(intentionRaw);
          setPastIntentions(intentions.slice(0, 3));
          if (intentions.length > 0) setIntentionText(intentions[0]);
        }
      } catch (_) {}
    };
    load();
  }, []);

  // Audio cleanup on blur
  useFocusEffect(useCallback(() => {
return () => {
      void AudioService.pauseBackgroundMusic();
      void AudioService.pauseAmbientSound();
      void AudioService.stopBinauralTone();
      setActiveSleepHz(null);
    };
  }, []));


  // ── Timer logic ──────────────────────────────────────────────
  const stopSleep = async () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    await deactivateKeepAwake();
    void AudioService.pauseAmbientSound();
    setRunning(false);
    setOverlayVisible(false);
    setRemaining(selectedDuration * 60);
    RNAnimated.timing(fadeAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start();
  };

  const startSleep = async () => {
    await activateKeepAwakeAsync();
    void AudioService.playAmbientForSession(experience?.ambientSoundscape ?? 'forest');
    const total = selectedDuration * 60;
    setRemaining(total);
    setRunning(true);
    let count = total;
    intervalRef.current = setInterval(() => {
      count -= 1;
      setRemaining(count);
      if (count <= 0) {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        setRunning(false);
        setOverlayVisible(true);
        void deactivateKeepAwake();
        RNAnimated.timing(fadeAnim, { toValue: 0.97, duration: 3000, useNativeDriver: true }).start();
      }
    }, 1000);
  };

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    void deactivateKeepAwake();
    void AudioService.pauseAmbientSound();
  }, []);

  const progress = running ? 1 - remaining / (selectedDuration * 60) : 0;

  // ── Sleep rating save ────────────────────────────────────────
  const saveRating = async (rating: number) => {
    setTodayRating(rating);
    HapticsService.impact('light');
    const today = getTodayKey();
    const updated = sleepHistory.filter(e => e.date !== today);
    updated.unshift({ date: today, rating });
    const trimmed = updated.slice(0, 30);
    setSleepHistory(trimmed);
    try {
      await AsyncStorage.setItem('sleep_history', JSON.stringify(trimmed));
    } catch (_) {}
  };

  const avgRating = sleepHistory.length > 0
    ? (sleepHistory.slice(0, 7).reduce((s, e) => s + e.rating, 0) / Math.min(sleepHistory.length, 7)).toFixed(1)
    : '—';

  // ── Body scan logic ──────────────────────────────────────────
  const startBodyScan = async () => {
    await activateKeepAwakeAsync();
    void AudioService.playAmbientForSession(experience?.ambientSoundscape ?? 'forest');
    setScanActive(true);
    setScanStep(0);
    setScanElapsed(0);
    HapticsService.impact('light');
    let step = 0;
    let elapsed = 0;
    scanRef.current = setInterval(() => {
      elapsed += 1;
      setScanElapsed(elapsed);
      if (elapsed >= STEP_DURATION) {
        elapsed = 0;
        setScanElapsed(0);
        if (step < BODY_SCAN_STEPS.length - 1) {
          step += 1;
          setScanStep(step);
          HapticsService.impact('light');
        } else {
          if (scanRef.current) clearInterval(scanRef.current);
          setScanActive(false);
          void deactivateKeepAwake();
          HapticsService.impact('medium');
        }
      }
    }, 1000);
  };

  const stopBodyScan = () => {
    if (scanRef.current) { clearInterval(scanRef.current); scanRef.current = null; }
    setScanActive(false);
    void AudioService.pauseAmbientSound();
    void deactivateKeepAwake();
  };

  useEffect(() => () => { if (scanRef.current) clearInterval(scanRef.current); }, []);

  const scanProgress = scanElapsed / STEP_DURATION;

  // ── 4-7-8 breathing logic ────────────────────────────────────
  const start478 = () => {
    setBreath478Active(true);
    setBreath478Phase('inhale');
    setBreath478Count(0);
    setBreath478Cycles(0);
    HapticsService.impact('light');
    // Animate: expand for inhale
    breath478Scale.value = withTiming(1.7, { duration: 4000, easing: Easing.out(Easing.ease) });
    breath478Opacity.value = withTiming(0.9, { duration: 4000 });
    let phase: BreathPhase478 = 'inhale';
    let count = 0;
    let cycles = 0;
    const PHASE_DURATIONS: Record<BreathPhase478, number> = { idle: 0, inhale: 4, hold: 7, exhale: 8 };
    breathRef478.current = setInterval(() => {
      count += 1;
      setBreath478Count(count);
      if (count >= PHASE_DURATIONS[phase]) {
        count = 0;
        setBreath478Count(0);
        if (phase === 'inhale') {
          phase = 'hold';
          setBreath478Phase('hold');
          // Hold — no scale change
        } else if (phase === 'hold') {
          phase = 'exhale';
          setBreath478Phase('exhale');
          // Shrink for exhale
          breath478Scale.value = withTiming(1.0, { duration: 8000, easing: Easing.in(Easing.ease) });
          breath478Opacity.value = withTiming(0.5, { duration: 8000 });
        } else if (phase === 'exhale') {
          cycles += 1;
          setBreath478Cycles(cycles);
          if (cycles >= TARGET_CYCLES) {
            if (breathRef478.current) clearInterval(breathRef478.current);
            setBreath478Active(false);
            setBreath478Phase('idle');
            breath478Scale.value = withTiming(1.0, { duration: 600 });
            breath478Opacity.value = withTiming(0.6, { duration: 600 });
            HapticsService.impact('medium');
          } else {
            phase = 'inhale';
            setBreath478Phase('inhale');
            breath478Scale.value = withTiming(1.7, { duration: 4000, easing: Easing.out(Easing.ease) });
            breath478Opacity.value = withTiming(0.9, { duration: 4000 });
            HapticsService.impact('light');
          }
        }
      }
    }, 1000);
  };

  const stop478 = () => {
    if (breathRef478.current) { clearInterval(breathRef478.current); breathRef478.current = null; }
    setBreath478Active(false);
    setBreath478Phase('idle');
    setBreath478Count(0);
    setBreath478Cycles(0);
    breath478Scale.value = withTiming(1.0, { duration: 600 });
    breath478Opacity.value = withTiming(0.6, { duration: 600 });
  };

  useEffect(() => () => { if (breathRef478.current) clearInterval(breathRef478.current); }, []);

  const breathCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath478Scale.value }],
    opacity: breath478Opacity.value,
  }));

  const currentPhaseLabel = BREATH_LABELS[breath478Phase];
  const currentPhaseColor = BREATH_COLORS[breath478Phase];

  // ── Dream intention save ──────────────────────────────────────
  const saveIntention = async () => {
    if (!intentionInput.trim()) return;
    const newText = intentionInput.trim();
    const updated = [newText, ...pastIntentions].slice(0, 3);
    setPastIntentions(updated);
    setIntentionText(newText);
    setIntentionInput('');
    setShowIntentionModal(false);
    try {
      await AsyncStorage.setItem('dream_intentions', JSON.stringify(updated));
    } catch (_) {}
    HapticsService.impact('light');
  };

  // ── Checklist progress ────────────────────────────────────────
  const checkedCount = checkedItems.filter(Boolean).length;
  const checkProgress = checkedCount / CHECKLIST_ITEMS.length;

  const fetchSleepAi = async () => {
    setSleepAiLoading(true);
    HapticsService.impact('light');
    try {
      const hzLabel = activeSleepHz ? activeSleepHz.toUpperCase() : "brak";
      const prompt = "Pomocnik snu. Wybrany czas: " + selectedDuration + " min. Aktywna czestotliwosc Hz: " + hzLabel + ". Ukonczone elementy listy: " + checkedCount + "/" + CHECKLIST_ITEMS.length + ". Napisz krotka (3-4 zdania) spersonalizowana wskazowke jak najglebiej zasnac tej nocy i co zaobserwowac podczas przejscia w sen.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setSleepAiInsight(result);
    } catch (e) {
      setSleepAiInsight("Blad pobierania wskazowki.");
    } finally {
      setSleepAiLoading(false);
    }
  };

return (
    <View style={[styles.root, { backgroundColor: currentTheme.background }]}>
      <MoonScene isLight={isLight} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} hitSlop={12}>
            <ChevronLeft size={22} color={textColor} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.eyebrow, { color: ACCENT + '99' }]}>{t('sleephelper.pomocnik_snu', 'POMOCNIK SNU')}</Text>
            <Text style={[styles.headerTitle, { color: textColor }]}>{t('sleephelper.zasypianie', 'Zasypianie')}</Text>
          </View>
          <Pressable
            hitSlop={12}
            onPress={() => {
              HapticsService.impact('light');
              if (isFav) { removeFavoriteItem('SleepHelper'); } else { addFavoriteItem({ id: 'SleepHelper', label: 'Zasypianie', route: 'SleepHelper', params: {}, icon: 'Moon', color: ACCENT, addedAt: new Date().toISOString() }); }
            }}
          >
            <Star size={18} color={isFav ? ACCENT : textColor} fill={isFav ? ACCENT : 'none'} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 3D Moon widget */}
          <MoonOrb3D isLight={isLight} />

          {/* ── Timer ── */}
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.timerText, { color: textColor }]}>{formatTime(remaining)}</Text>
            <Text style={[styles.timerSub, { color: subColor }]}>
              {running ? `Pozostało ${Math.ceil(remaining / 60)} min` : 'Ustaw czas i zacznij'}
            </Text>
          </View>

          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>

          {/* Duration chips */}
          <Text style={[styles.label, { color: subColor }]}>{t('sleephelper.czas_trwania', 'CZAS TRWANIA')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 6, marginBottom: 22 }}>
            {DURATIONS.map(min => {
              const active = min === selectedDuration;
            return (
                <Pressable
                  key={min}
                  onPress={() => { if (!running) { setSelectedDuration(min); setRemaining(min * 60); } }}
                  style={[
                    styles.chip, active && styles.chipActive, running && { opacity: 0.4 },
                    !active && { backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.06)', borderColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.09)' },
                  ]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive, !active && { color: subColor }]}>{min} min</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Main CTA */}
          <Pressable
            onPress={() => running ? stopSleep() : startSleep()}
            style={({ pressed }) => [styles.mainBtn, pressed && { opacity: 0.82 }]}
          >
            <LinearGradient
              colors={running ? ['#4338CA', '#3730A3'] as const : [ACCENT, '#6366F1'] as const}
              style={styles.mainBtnGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              {running ? <Square size={20} color="#FFF" fill="#FFF" /> : <Play size={20} color="#FFF" fill="#FFF" />}
              <Text style={styles.mainBtnText}>{running ? 'Zatrzymaj' : 'Rozpocznij zasypianie'}</Text>
            </LinearGradient>
          </Pressable>

          {/* Music */}
          <Text style={[styles.label, { color: subColor }]}>{t('sleephelper.muzyka_i_dzwieki', 'MUZYKA I DŹWIĘKI')}</Text>
          <MusicPicker accentColor={ACCENT} />

          {/* ────────────────────────────────────────────────────── */}
          {/* SECTION 1: 7-day sleep quality history                 */}
          {/* ────────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).duration(450)}>
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 28 }]}>
              <Text style={[styles.sectionEyebrow, { color: ACCENT + '99' }]}>{t('sleephelper.historia_snu_7_dni', 'HISTORIA SNU — 7 DNI')}</Text>

              {/* 7-day row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                {Array.from({ length: 7 }, (_, i) => {
                  const key = getDateKey(6 - i);
                  const entry = sleepHistory.find(e => e.date === key);
                  const isToday = key === getTodayKey();
                  const rating = isToday ? todayRating : (entry?.rating ?? 0);
                return (
                    <Pressable
                      key={key}
                      onPress={() => { if (isToday) saveRating(rating === 0 ? 3 : 0); }}
                      style={{ alignItems: 'center', gap: 4 }}
                    >
                      <Text style={{ fontSize: 10, color: subColor, fontWeight: '600' }}>{getDayLabel(key)}</Text>
                      <View style={[
                        styles.historyDot,
                        {
                          backgroundColor: rating > 0
                            ? (rating >= 4 ? '#67D1B2' : rating === 3 ? ACCENT : '#F472B6')
                            : (isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)'),
                          borderColor: isToday ? ACCENT : 'transparent',
                        },
                      ]}>
                        {rating > 0 && (
                          <Text style={{ fontSize: 10, color: '#FFF', fontWeight: '700' }}>{rating}</Text>
                        )}
                      </View>
                      {isToday && (
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: ACCENT }} />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Average + rate today */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <View>
                  <Text style={{ fontSize: 11, color: subColor, marginBottom: 2 }}>{t('sleephelper.srednia_7_dni', 'Średnia 7 dni')}</Text>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, letterSpacing: 1 }}>{avgRating}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 11, color: subColor, marginBottom: 4 }}>{t('sleephelper.ocen_ostatnia_noc', 'Oceń ostatnią noc')}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <Pressable
                        key={n}
                        onPress={() => saveRating(n)}
                        onPressIn={() => setHoverRating(n)}
                        onPressOut={() => setHoverRating(0)}
                        hitSlop={6}
                      >
                        <Star
                          size={26}
                          color={ACCENT}
                          fill={n <= (hoverRating > 0 ? hoverRating : todayRating) ? ACCENT : 'none'}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {todayRating > 0 && (
                <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, fontStyle: 'italic' }}>
                  {todayRating <= 2
                    ? 'Ciało potrzebuje więcej regeneracji. Dziś zadbaj o wczesne położenie.'
                    : todayRating === 3
                    ? 'Przeciętny sen. Sprawdź wieczorny rytuał i temperaturę w sypialni.'
                    : todayRating === 4
                    ? 'Dobra noc. Rytm snu jest na właściwej ścieżce.'
                    : 'Pięknie. Twoje ciało wie, czego potrzebuje i wdzięcznie odpowiada.'}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* ────────────────────────────────────────────────────── */}
          {/* SECTION 2: Bedtime ritual checklist                    */}
          {/* ────────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(280).duration(450)}>
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {/* Header row with progress ring */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <View>
                  <Text style={[styles.sectionEyebrow, { color: ACCENT + '99', marginBottom: 4 }]}>{t('sleephelper.rytual_przed_snem', 'RYTUAŁ PRZED SNEM')}</Text>
                  <Text style={{ fontSize: 13, color: textColor, fontWeight: '600' }}>{t('sleephelper.lista_gotowosci', 'Lista gotowości')}</Text>
                </View>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <ProgressRing progress={checkProgress} size={56} />
                  <View style={StyleSheet.absoluteFill}>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>
                        {checkedCount}/{CHECKLIST_ITEMS.length}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {CHECKLIST_ITEMS.map((item, i) => {
                const checked = checkedItems[i];
              return (
                  <Pressable
                    key={i}
                    onPress={() => {
                      HapticsService.impact('light');
                      setCheckedItems(prev => {
                        const next = [...prev];
                        next[i] = !next[i];
                        return next;
                      });
                    }}
                    style={[styles.checkRow, { borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.06)', borderBottomWidth: i < CHECKLIST_ITEMS.length - 1 ? 1 : 0 }]}
                  >
                    <Text style={{ fontSize: 18, width: 26 }}>{item.emoji}</Text>
                    <Text style={[styles.checkText, { color: checked ? textColor : subColor, textDecorationLine: checked ? 'line-through' : 'none', flex: 1 }]}>
                      {item.text}
                    </Text>
                    <View style={[
                      styles.checkCircle,
                      checked
                        ? { backgroundColor: ACCENT, borderColor: ACCENT }
                        : { backgroundColor: 'transparent', borderColor: isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)' },
                    ]}>
                      {checked && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' }} />}
                    </View>
                  </Pressable>
                );
              })}

              {checkedCount === CHECKLIST_ITEMS.length && (
                <View style={{ marginTop: 14, alignItems: 'center' }}>
                  <LinearGradient
                    colors={[ACCENT + '22', ACCENT + '11'] as const}
                    style={{ borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center' }}
                  >
                    <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '700', letterSpacing: 0.8 }}>
                      {t('sleephelper.gotowa_na_sen', '✦ Gotowa na sen')}
                    </Text>
                  </LinearGradient>
                </View>
              )}
            </View>
          </Animated.View>

          {/* ────────────────────────────────────────────────────── */}
          {/* SECTION 3: 4-7-8 Sleep Breathing                      */}
          {/* ────────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(360).duration(450)}>
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.sectionEyebrow, { color: ACCENT + '99' }]}>{t('sleephelper.oddech_4_7_8_sen', 'ODDECH 4-7-8 — SEN')}</Text>
              <Text style={{ fontSize: 13, color: textColor, fontWeight: '600', marginBottom: 6 }}>{t('sleephelper.technika_zasypiania', 'Technika zasypiania')}</Text>
              <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 18 }}>
                {t('sleephelper.wdech_4_s_zatrzymaj_7', 'Wdech 4 s → zatrzymaj 7 s → wydech 8 s. Cztery cykle aktywują układ przywspółczulny i obniżają poziom kortyzolu. Najlepsza technika oddechowa do zaśnięcia.')}
              </Text>

              {/* Animated circle */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
                  {/* Outer glow rings */}
                  <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                    <View style={{ width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: ACCENT + '18' }} />
                  </View>
                  <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                    <View style={{ width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: ACCENT + '25' }} />
                  </View>
                  {/* Animated breathing circle */}
                  <Animated.View style={[{
                    width: 80, height: 80, borderRadius: 40,
                    backgroundColor: currentPhaseColor + '44',
                    borderWidth: 2, borderColor: currentPhaseColor,
                    alignItems: 'center', justifyContent: 'center',
                  }, breathCircleStyle]}>
                    <Wind size={22} color={currentPhaseColor} />
                  </Animated.View>
                </View>

                {/* Phase label */}
                <Text style={{ fontSize: 16, fontWeight: '700', color: currentPhaseColor, marginBottom: 4, letterSpacing: 0.5 }}>
                  {currentPhaseLabel}
                </Text>
                {breath478Active && (
                  <Text style={{ fontSize: 12, color: subColor }}>
                    Cykl {breath478Cycles + 1} z {TARGET_CYCLES}
                  </Text>
                )}
                {!breath478Active && breath478Cycles >= TARGET_CYCLES && (
                  <Text style={{ fontSize: 12, color: '#67D1B2', fontWeight: '600' }}>
                    {t('sleephelper.ukonczono_cialo_jest_gotowe_na', '✦ Ukończono! Ciało jest gotowe na sen.')}
                  </Text>
                )}
              </View>

              {/* Cycle indicator dots */}
              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 18 }}>
                {Array.from({ length: TARGET_CYCLES }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 10, height: 10, borderRadius: 5,
                      backgroundColor: i < breath478Cycles ? ACCENT : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'),
                    }}
                  />
                ))}
              </View>

              {/* Start/stop button */}
              <Pressable
                onPress={() => breath478Active ? stop478() : start478()}
                style={({ pressed }) => [styles.subBtn, pressed && { opacity: 0.82 }]}
              >
                <LinearGradient
                  colors={breath478Active ? ['#4338CA', '#3730A3'] as const : [ACCENT + 'CC', '#6366F1CC'] as const}
                  style={styles.subBtnGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  {breath478Active ? <Square size={16} color="#FFF" fill="#FFF" /> : <Play size={16} color="#FFF" fill="#FFF" />}
                  <Text style={styles.subBtnText}>{breath478Active ? 'Zatrzymaj' : 'Rozpocznij 4-7-8'}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>

          {/* ────────────────────────────────────────────────────── */}
          {/* SECTION 4: Body scan                                   */}
          {/* ────────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(440).duration(450)}>
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.sectionEyebrow, { color: ACCENT + '99' }]}>{t('sleephelper.skanowanie_ciala', 'SKANOWANIE CIAŁA')}</Text>
              <Text style={{ fontSize: 13, color: textColor, fontWeight: '600', marginBottom: 6 }}>{t('sleephelper.guided_body_scan', 'Guided body scan')}</Text>
              <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 18 }}>
                {t('sleephelper.prowadzone_skupienie_uwagi_na_kolej', 'Prowadzone skupienie uwagi na kolejnych częściach ciała — 30 sekund na obszar. Zwalnia gonitwę myśli i głęboko relaksuje przed snem.')}
              </Text>

              {scanActive ? (
                <>
                  {/* Active scan view */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 20, marginBottom: 16 }}>
                    <BodyOutlineSVG highlight={BODY_SCAN_STEPS[scanStep].bodyRegion} isLight={isLight} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: ACCENT, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>
                        KROK {scanStep + 1} / {BODY_SCAN_STEPS.length}
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, marginBottom: 8 }}>
                        {BODY_SCAN_STEPS[scanStep].label}
                      </Text>
                      <Text style={{ fontSize: 13, color: subColor, lineHeight: 20 }}>
                        {BODY_SCAN_STEPS[scanStep].instruction}
                      </Text>
                      {/* Step progress */}
                      <View style={{ marginTop: 14, gap: 4 }}>
                        <View style={styles.progressBg}>
                          <View style={[styles.progressFill, { width: `${scanProgress * 100}%` as any }]} />
                        </View>
                        <Text style={{ fontSize: 11, color: subColor }}>{STEP_DURATION - scanElapsed}s do następnego obszaru</Text>
                      </View>
                    </View>
                  </View>

                  {/* Step dots */}
                  <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
                    {BODY_SCAN_STEPS.map((s, i) => (
                      <View
                        key={i}
                        style={{
                          width: 8, height: 8, borderRadius: 4,
                          backgroundColor: i < scanStep ? ACCENT : i === scanStep ? ACCENT + 'CC' : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'),
                        }}
                      />
                    ))}
                  </View>

                  <Pressable
                    onPress={stopBodyScan}
                    style={({ pressed }) => [styles.subBtn, pressed && { opacity: 0.82 }]}
                  >
                    <LinearGradient
                      colors={['#4338CA', '#3730A3'] as const}
                      style={styles.subBtnGrad}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                      <Square size={16} color="#FFF" fill="#FFF" />
                      <Text style={styles.subBtnText}>{t('sleephelper.zatrzymaj_skanowanie', 'Zatrzymaj skanowanie')}</Text>
                    </LinearGradient>
                  </Pressable>
                </>
              ) : (
                <>
                  {/* Preview body outline */}
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <BodyOutlineSVG highlight="torso" isLight={isLight} />
                    <Text style={{ fontSize: 12, color: subColor, marginTop: 8 }}>
                      {BODY_SCAN_STEPS.length} obszarów · {BODY_SCAN_STEPS.length * STEP_DURATION / 60} minut
                    </Text>
                  </View>
                  <Pressable
                    onPress={startBodyScan}
                    style={({ pressed }) => [styles.subBtn, pressed && { opacity: 0.82 }]}
                  >
                    <LinearGradient
                      colors={[ACCENT + 'CC', '#6366F1CC'] as const}
                      style={styles.subBtnGrad}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                      <Brain size={16} color="#FFF" />
                      <Text style={styles.subBtnText}>{t('sleephelper.skanowanie_ciala_1', 'Skanowanie ciała')}</Text>
                    </LinearGradient>
                  </Pressable>
                </>
              )}
            </View>
          </Animated.View>

          {/* ────────────────────────────────────────────────────── */}
          {/* SECTION 5: Therapeutic Hz frequencies                  */}
          {/* ────────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(500).duration(450)}>
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.sectionEyebrow, { color: ACCENT + '99' }]}>{t('sleephelper.czestotliw_terapeutyc', 'CZĘSTOTLIWOŚCI TERAPEUTYCZNE')}</Text>
              <Text style={{ fontSize: 13, color: textColor, fontWeight: '600', marginBottom: 6 }}>{t('sleephelper.fale_mozgowe_i_dzwieki_solfeggio', 'Fale mózgowe i dźwięki Solfeggio')}</Text>
              <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 14 }}>
                {t('sleephelper.dzwieki_binauralne_synchroniz_fale_', 'Dźwięki binauralne synchronizują fale mózgowe. Użyj słuchawek — tylko wtedy mózg odbierze pełen efekt binarny.')}
              </Text>

              {([
                { freq: '174hz' as BinauralFrequency, label: '174 Hz', desc: 'Uśmierzanie bólu · głęboki relaks', emoji: '🫁', cat: 'Relaks', catColor: '#34D399', deepDesc: 'Delta — fundament fizyczny. Redukuje ból i napięcie, przywraca stan głębokiego bezpieczeństwa w ciele.' },
                { freq: '396hz' as BinauralFrequency, label: '396 Hz', desc: 'Uwalnianie lęku · poczucie bezpieczeństwa', emoji: '🌿', cat: 'Uwolnienie', catColor: '#4ADE80', deepDesc: 'Solfeggio Ut — uwalnia wzorce strachu i poczucia winy. Aktywuje czakrę korzenia.' },
                { freq: '432hz' as BinauralFrequency, label: '432 Hz', desc: 'Naturalny rytm · spokój umysłu', emoji: '🌙', cat: 'Sen', catColor: '#818CF8', deepDesc: 'Naturalne strojenie — synchronizuje z rytmem Ziemi. Sprzyja spokojnemu zasypianiu i relaksacji.' },
                { freq: '528hz' as BinauralFrequency, label: '528 Hz', desc: 'Leczniczy · uzdrowienie i transformacja', emoji: '✨', cat: 'Uzdrowienie', catColor: '#F59E0B', deepDesc: 'Solfeggio Mi — "częstotliwość miłości". Wspiera naprawę DNA i głęboką transformację komórkową.' },
                { freq: '639hz' as BinauralFrequency, label: '639 Hz', desc: 'Otwarte serce · harmonia relacji', emoji: '💜', cat: 'Relacje', catColor: '#F9A8D4', deepDesc: 'Solfeggio Fa — otwiera czakrę serca i harmonizuje relacje. Pomaga w procesowaniu emocji przed snem.' },
                { freq: '741hz' as BinauralFrequency, label: '741 Hz', desc: 'Oczyszczanie pola · jasność umysłu', emoji: '🔮', cat: 'Oczyszczanie', catColor: '#60A5FA', deepDesc: 'Solfeggio Sol — oczyszcza umysł z toksycznych myśli i wzorców. Sprzyja higienie energetycznej.' },
                { freq: '852hz' as BinauralFrequency, label: '852 Hz', desc: 'Intuicja · przebudzenie wyższego ja', emoji: '👁️', cat: 'Intuicja', catColor: '#A78BFA', deepDesc: 'Solfeggio La — aktywuje trzecie oko i wzmaga świadomość w snach. Sprzyja lucidom dreaming.' },
                { freq: '963hz' as BinauralFrequency, label: '963 Hz', desc: 'Szyszynka · boska świadomość', emoji: '☀️', cat: 'Transcendencja', catColor: '#FDE68A', deepDesc: 'Solfeggio Si — aktywuje szyszynkę i stan jedności. Często używana podczas medytacji przed snem.' },
                { freq: '40hz' as BinauralFrequency, label: '40 Hz Gamma', desc: 'Skupienie · koncentracja i jasność', emoji: '⚡', cat: 'Skupienie', catColor: '#FFD700', deepDesc: 'Fale Gamma — hiperaktywacja poznawcza. Idealne przed pracą twórczą lub intensywnym planowaniem.' },
              ] as const).map(({ freq, label, desc, emoji, cat, catColor, deepDesc }) => {
                const isActive = activeSleepHz === freq;
              return (
                  <Pressable
                    key={freq}
                    onPress={() => toggleSleepHz(freq)}
                    style={{
                      borderRadius: 16, marginBottom: 8, overflow: 'hidden',
                      backgroundColor: isActive ? catColor + '18' : (isLight ? 'rgba(240,228,210,0.90)' : 'rgba(255,255,255,0.04)'),
                      borderWidth: isActive ? 1.5 : 1,
                      borderColor: isActive ? catColor + '88' : (isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)'),
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 14 }}>
                      <Text style={{ fontSize: 22, width: 30 }}>{emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: isActive ? catColor : textColor, letterSpacing: 0.3 }}>{label}</Text>
                          <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: catColor + '22', borderWidth: 1, borderColor: catColor + '44' }}>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: catColor, letterSpacing: 0.5 }}>{cat.toUpperCase()}</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11, color: subColor, marginTop: 1 }}>{desc}</Text>
                      </View>
                      <View style={{
                        width: 32, height: 32, borderRadius: 16,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isActive ? catColor : (loadingHz === freq ? catColor + '44' : (isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)')),
                      }}>
                        {loadingHz === freq
                          ? <ActivityIndicator size="small" color={catColor} />
                          : isActive
                            ? <Square size={13} color="#FFF" fill="#FFF" />
                            : <Play size={13} color={isLight ? '#555' : '#CCC'} fill={isLight ? '#555' : '#CCC'} />
                        }
                      </View>
                    </View>
                    {isActive && (
                      <View style={{ paddingHorizontal: 14, paddingBottom: 12, paddingTop: 0 }}>
                        <View style={{ height: 1, backgroundColor: catColor + '30', marginBottom: 9 }} />
                        <Text style={{ fontSize: 12, color: isLight ? '#3A3A3A' : '#D0C8BE', lineHeight: 18 }}>{deepDesc}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
              {hzError && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <Text style={{ fontSize: 11, color: '#F472B6', fontWeight: '600' }}>{hzError}</Text>
                </View>
              )}
              {activeSleepHz && !hzError && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <Radio size={13} color={ACCENT} />
                  <Text style={{ fontSize: 11, color: ACCENT, fontWeight: '600' }}>
                    Odtwarzanie: {activeSleepHz.toUpperCase()} · Użyj słuchawek
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* ────────────────────────────────────────────────────── */}
          {/* SECTION 6: Dream intention setter                      */}
          {/* ────────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(560).duration(450)}>
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.sectionEyebrow, { color: ACCENT + '99' }]}>{t('sleephelper.intencja_snow', 'INTENCJA SNÓW')}</Text>
              <Text style={{ fontSize: 13, color: textColor, fontWeight: '600', marginBottom: 6 }}>{t('sleephelper.zaproszeni_na_dzis_noc', 'Zaproszenie na dziś noc')}</Text>

              {/* Current intention */}
              <Pressable
                onPress={() => { setIntentionInput(intentionText || dailySuggestion); setShowIntentionModal(true); }}
                style={[styles.intentionBox, { backgroundColor: inputBg, borderColor: cardBorder }]}
              >
                <Moon size={16} color={ACCENT + '88'} style={{ marginBottom: 6 }} />
                <Text style={{ fontSize: 13, color: intentionText ? textColor : subColor, lineHeight: 20, fontStyle: intentionText ? 'normal' : 'italic' }}>
                  {intentionText || dailySuggestion}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 }}>
                  <Text style={{ fontSize: 11, color: ACCENT + '99', fontWeight: '600' }}>
                    {intentionText ? 'Zmień intencję' : 'Ustaw intencję'}
                  </Text>
                  <ArrowRight size={12} color={ACCENT + '99'} />
                </View>
              </Pressable>

              {/* Past intentions */}
              {pastIntentions.length > 0 && (
                <View style={{ marginTop: 14 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: subColor, marginBottom: 8 }}>
                    {t('sleephelper.poprzednie_intencje', 'POPRZEDNIE INTENCJE')}
                  </Text>
                  {pastIntentions.map((intention, i) => (
                    <Pressable
                      key={i}
                      onPress={() => setIntentionText(intention)}
                      style={[
                        styles.pastIntentionRow,
                        {
                          borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.06)',
                          borderBottomWidth: i < pastIntentions.length - 1 ? 1 : 0,
                        },
                      ]}
                    >
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT + '66', marginTop: 3 }} />
                      <Text style={{ flex: 1, fontSize: 12, color: subColor, lineHeight: 18 }} numberOfLines={2}>
                        {intention}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </Animated.View>

          {/* ────────────────────────────────────────────────────── */}
          {/* SECTION 6: Sleep tips card                             */}
          {/* ────────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(580).duration(450)}>
            <View style={[styles.tipsCard, { borderColor: ACCENT + '55', overflow: 'hidden', shadowColor: ACCENT, shadowOpacity: 0.22, shadowRadius: 14, elevation: 6 }]}>
              <LinearGradient colors={[ACCENT + '18', 'transparent'] as const} style={StyleSheet.absoluteFill} />
              <LinearGradient
                colors={['transparent', ACCENT + '88', 'transparent'] as [string, string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1 }}
                pointerEvents="none"
              />
              <Text style={[styles.tipsTitle, { color: textColor }]}>{t('sleephelper.wskazowki_na_dobry_sen', 'Wskazówki na dobry sen')}</Text>
              {[
                'Oddychaj powoli — 4 wdech, 8 wydech',
                'Rozluźnij szczękę, ramiona i dłonie',
                'Wyobraź sobie spokojne, ciemne miejsce',
                'Pozwól myślom odpłynąć bez oceniania',
                'Temperatura sypialni 18-20°C wspiera głęboki sen',
                'Ciemność stymuluje produkcję melatoniny',
              ].map((tip, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: ACCENT, marginTop: 7 }} />
                  <Text style={[styles.tipText, { color: subColor }]}>{tip}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ────────────────────────────────────────────────────── */}
          {/* SECTION 7: Co dalej?                                   */}
          {/* ────────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(640).duration(450)}>
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.sectionEyebrow, { color: ACCENT + '99' }]}>{t('sleephelper.co_dalej', 'CO DALEJ?')}</Text>

              {[
                { label: 'Archiwum snów', sub: 'Zapisz sen z tej nocy', icon: Moon, route: 'Dreams' },
                { label: 'Interpretor snów', sub: 'AI wyjaśni Twój sen', icon: Brain, route: 'DreamInterpreter' },
                { label: 'Kąpiel dźwiękowa', sub: 'Dźwięki do zasypiania', icon: Zap, route: 'SoundBath' },
                { label: 'Ćwiczenia oddechowe', sub: 'Pełna biblioteka oddechów', icon: Wind, route: 'Breathwork' },
                { label: 'Dziennik snów', sub: 'Przejrzyj swoje zapiski', icon: BookOpen, route: 'Journal' },
              ].map((item, i) => {
                const IconComp = item.icon;
              return (
                  <React.Fragment key={item.route}>
                    {i > 0 && <View style={{ height: 1, backgroundColor: isLight ? 'rgba(255,246,230,0.95)' : 'rgba(255,255,255,0.06)', marginHorizontal: -18 }} />}
                    <Pressable
                      onPress={() => { HapticsService.impact('light'); navigation.navigate(item.route); }}
                      style={({ pressed }) => [styles.codalejRow, { opacity: pressed ? 0.72 : 1 }]}
                    >
                      <View style={[styles.codalejIcon, { backgroundColor: ACCENT + '18' }]}>
                        <IconComp size={16} color={ACCENT} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{item.label}</Text>
                        <Text style={{ fontSize: 12, color: subColor, marginTop: 1 }}>{item.sub}</Text>
                      </View>
                      <ArrowRight size={16} color={ACCENT + '88'} />
                    </Pressable>
                  </React.Fragment>
                );
              })}
            </View>
          </Animated.View>

                    <View style={{ marginTop: 16, marginBottom: 8, borderRadius: 16, backgroundColor: "#818CF822", borderWidth: 1, borderColor: "#818CF8", padding: 16 }}>
            <Text style={{ color: "#818CF8", fontWeight: "700", fontSize: 13, letterSpacing: 1, marginBottom: 8 }}>{t('sleephelper.ai_wskazowka_senna', 'AI WSKAZOWKA SENNA')}</Text>
            {sleepAiInsight ? (
              <Text style={{ color: "#F0EBE2", fontSize: 14, lineHeight: 22 }}>{sleepAiInsight}</Text>
            ) : null}
            <Pressable onPress={fetchSleepAi} disabled={sleepAiLoading} style={{ marginTop: 12, backgroundColor: "#818CF8", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
              <Text style={{ color: "#1A1530", fontWeight: "700", fontSize: 14 }}>{sleepAiLoading ? "Analizuję..." : "Analizuj"}</Text>
            </Pressable>
          </View>
<EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>

      {/* Dream intention modal */}
      <Modal visible={showIntentionModal} transparent animationType="slide" onRequestClose={() => setShowIntentionModal(false)}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowIntentionModal(false)}>
            <Pressable
              onPress={e => e.stopPropagation()}
              style={[styles.modalSheet, { backgroundColor: isLight ? '#F4F0FC' : '#0F0C24' }]}
            >
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 20 }} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, marginBottom: 6 }}>{t('sleephelper.intencja_na_te_noc', 'Intencja na tę noc')}</Text>
              <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 16 }}>
                {t('sleephelper.napisz_jakie_sny_zapraszasz_lub', 'Napisz, jakie sny zapraszasz lub czego szukasz we śnie tej nocy.')}
              </Text>
              <TextInput
                value={intentionInput}
                onChangeText={setIntentionInput}
                placeholder={dailySuggestion}
                placeholderTextColor={subColor}
                style={[styles.intentionInput, { backgroundColor: inputBg, borderColor: cardBorder, color: textColor }]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
              <Pressable
                onPress={saveIntention}
                style={({ pressed }) => [styles.subBtn, { marginTop: 14 }, pressed && { opacity: 0.82 }]}
              >
                <LinearGradient
                  colors={[ACCENT, '#6366F1'] as const}
                  style={styles.subBtnGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.subBtnText}>{t('sleephelper.zapisz_intencje', 'Zapisz intencję')}</Text>
                </LinearGradient>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Sleep overlay */}
      <TouchableWithoutFeedback onPress={() => {
        RNAnimated.timing(fadeAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start();
        void stopSleep();
      }}>
        <RNAnimated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents={overlayVisible ? 'box-only' : 'none'}>
          <Moon size={52} color={ACCENT} opacity={0.6} />
          <Text style={styles.overlayTitle}>{t('sleephelper.dobranoc', 'Dobranoc')}</Text>
          <Text style={styles.overlaySub}>{t('sleephelper.dotknij_aby_obudzic', 'Dotknij, aby obudzić')}</Text>
        </RNAnimated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.5, marginBottom: 1 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  timerText: { fontSize: 72, fontWeight: '200', letterSpacing: 6 },
  timerSub: { fontSize: 13, marginTop: 4 },
  progressBg: {
    height: 3, backgroundColor: 'rgba(128,128,128,0.12)',
    borderRadius: 2, marginBottom: 26, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 2 },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 2.5, marginBottom: 10 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: { backgroundColor: ACCENT + '22', borderColor: ACCENT + '80' },
  chipText: { fontSize: 14, fontWeight: '500' },
  chipTextActive: { color: ACCENT, fontWeight: '700' },
  mainBtn: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 28,
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14, elevation: 8,
  },
  mainBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18,
  },
  mainBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: 0.4 },
  subBtn: {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  subBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
  },
  subBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },
  tipsCard: {
    backgroundColor: 'rgba(129,140,248,0.07)', borderWidth: 1,
    borderRadius: 18, padding: 18, marginBottom: 12,
  },
  tipsTitle: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: '#000000',
    alignItems: 'center', justifyContent: 'center', gap: 14, zIndex: 100,
  },
  overlayTitle: { fontSize: 34, fontWeight: '200', color: 'rgba(240,235,226,0.80)', letterSpacing: 5 },
  overlaySub: { fontSize: 13, color: 'rgba(240,235,226,0.32)', letterSpacing: 1.5 },
  sectionCard: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 12, overflow: 'hidden' },
  sectionEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.5, marginBottom: 14 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  checkText: { fontSize: 13, lineHeight: 19 },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  historyDot: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  intentionBox: {
    borderRadius: 14, borderWidth: 1, padding: 16,
  },
  pastIntentionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  codalejRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
  },
  codalejIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
  },
  intentionInput: {
    borderRadius: 14, borderWidth: 1, padding: 14,
    fontSize: 14, lineHeight: 22, minHeight: 100,
  },
});
