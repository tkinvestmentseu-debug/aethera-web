// @ts-nocheck
import { AMBIENT_SOUND_OPTIONS, AudioService, BACKGROUND_MUSIC_OPTIONS } from '../core/services/audio.service';
import { TTSService } from '../core/services/tts.service';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Slider from '@react-native-community/slider';
import {
  StyleSheet, View, ScrollView, Pressable, Modal,
  TouchableOpacity, Text, Dimensions, Animated as RNAnimated
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { useJournalStore } from '../store/useJournalStore';
import { useOracleStore } from '../store/useOracleStore';
import { usePremiumStore } from '../store/usePremiumStore';
import { getResolvedTheme, ThemeName, ThemeMode } from '../core/theme/tokens';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { Typography } from '../components/Typography';
import { getZodiacSign, ZODIAC_SYMBOLS, ZODIAC_LABELS } from '../features/horoscope/utils/astrology';
import { SoulEngineService } from '../core/services/soulEngine.service';
import { CelestialBackdrop } from '../components/CelestialBackdrop';
import { layout, screenContracts, screenRhythm } from '../core/theme/designSystem';
import {
  Palette, Globe, Star, ChevronRight, Book, X, BarChart2,
  Sparkles, Flame, Moon, ScrollText, SlidersHorizontal,
  Vibrate, Waves, ImagePlus, RotateCcw, Shield, HelpCircle,
  Crown, Archive, Settings2, User, Feather, Music, Eye,
  ChevronDown, Check, Zap, Calendar, Compass, Sun, MessageCircle, BookOpen
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, ZoomIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, interpolate, Easing } from 'react-native-reanimated';
import { resolveUserFacingText } from '../core/utils/contentResolver';
import { LANGUAGE_OPTIONS } from '../core/i18n/languageOptions';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { HapticsService } from '../core/services/haptics.service';
import { AvatarService } from '../core/services/avatar.service';
import { useTarotStore } from '../features/tarot/store/useTarotStore';
import { TAROT_DECKS, getTarotDeckById } from '../features/tarot/data/decks';
import { AiService } from '../core/services/ai.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW, height: SH } = Dimensions.get('window');

// ── Animated components at MODULE LEVEL ──────────────────────
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ── Data constants ─────────────────────────────────────────────
const THEME_OPTIONS: { id: ThemeName; label: string; sub: string }[] = [
  { id: 'goldenRitual', label: 'Złoty rytuał', sub: 'Intensywne złoto na głębokiej czerni' },
  { id: 'moonMist', label: 'Księżycowa mgła', sub: 'Srebrne fiolety i chłodny błękit' },
  { id: 'dawnClarity', label: 'Świt i klarowność', sub: 'Miękkie złoto i poranna jasność' },
  { id: 'cosmicViolet', label: 'Kosmiczny fiolet', sub: 'Głęboka purpura i przestrzeń' },
  { id: 'crimsonSoul', label: 'Szkarłatna dusza', sub: 'Gorący róż i burgundowe noce' },
  { id: 'forestDepth', label: 'Głębia lasu', sub: 'Szmaragdowa zieleń i ciemna ziemia' },
  { id: 'oceanDream', label: 'Oceaniczny sen', sub: 'Cyjan i głębiny morza' },
  { id: 'sunriseSanctum', label: 'Sanktuarium świtu', sub: 'Bursztynowy amber i ciepły poranek' },
];

const GUIDANCE_OPTIONS = [
  { id: 'western_astrology', label: 'Astrologia zachodnia', sub: 'Znaki, domy i tranzyty' },
  { id: 'chinese_astrology', label: 'Astrologia chińska', sub: 'Żywioł, zwierzę i rytm roku' },
  { id: 'tarot', label: 'Tarot', sub: 'Karty jako główny język symboli' },
  { id: 'mixed', label: 'Prowadzenie mieszane', sub: 'Łączone sygnały wszystkich systemów' },
];

const BACKGROUND_OPTIONS = [
  { id: 'subtleCelestial', label: 'Subtelne niebo' },
  { id: 'softMist', label: 'Miękka mgła' },
  { id: 'sacredGeometry', label: 'Święta geometria' },
  { id: 'deepNight', label: 'Glęboka noc' },
  { id: 'goldenRitual', label: 'Złoty rytuał' },
  { id: 'minimalClean', label: 'Minimalna cisza' },
  { id: 'moonGlow', label: 'Księżycowy blask' },
] as const;

const MOTION_OPTIONS = [
  { id: 'minimal', label: 'Oszczędny', sub: 'Minimum animacji' },
  { id: 'standard', label: 'Wyważone', sub: 'Domyślny balans' },
  { id: 'rich', label: 'Pogłębiony', sub: 'Pełna płynność' },
  { id: 'quiet', label: 'Cichy', sub: 'Najspokojniejszy tryb' },
];

const SOUNDSCAPE_OPTIONS = [
  { id: 'forest', label: 'Las', emoji: '🌲' },
  { id: 'rain', label: 'Deszcz', emoji: '🌧' },
  { id: 'waves', label: 'Fale', emoji: '🌊' },
  { id: 'fire', label: 'Ogień', emoji: '🔥' },
  { id: 'ritual', label: 'Rytuał', emoji: '🕯' },
];

const MUSIC_CATEGORY_OPTIONS = [
  { id: 'relaxing',   label: 'Relaks',    emoji: '🌊' },
  { id: 'motivating', label: 'Energia',   emoji: '⚡' },
  { id: 'sleep',      label: 'Sen',       emoji: '🌙' },
  { id: 'focus',      label: 'Fokus',     emoji: '🎯' },
  { id: 'ritual',     label: 'Rytualny',  emoji: '🕯' },
  { id: 'celestial',  label: 'Kosmiczny', emoji: '✨' },
];

const PARTICLE_COUNT = 14;

// ── Floating particle component ────────────────────────────────
const FloatingParticle = React.memo(({ index, accent }: { index: number; accent: string }) => {
  const progress = useSharedValue(0);
  const size = 2 + (index % 3);
  const startX = (SW * (index / PARTICLE_COUNT));
  const startY = Math.random() * SH * 0.6;
  const duration = 6000 + index * 800;

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3, 0.7, 1], [0, 0.6, 0.6, 0]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -120]) },
      { translateX: interpolate(progress.value, [0, 0.5, 1], [0, (index % 2 === 0 ? 1 : -1) * 20, 0]) },
    ],
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        left: startX,
        top: startY,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: accent,
      }, animStyle]}
    />
  );
});

// ── Custom Toggle ──────────────────────────────────────────────
const CustomToggle = React.memo(({ value, onToggle, accent }: { value: boolean; onToggle: () => void; accent: string }) => {
  const anim = useRef(new RNAnimated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    RNAnimated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, tension: 60, friction: 8 }).start();
  }, [value]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(120,120,120,0.18)', accent + 'CC'] });
  return (
    <Pressable onPress={onToggle} style={{ width: 48, height: 28, borderRadius: 14, overflow: 'hidden', justifyContent: 'center' }}>
      <RNAnimated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: bgColor, borderRadius: 14 }} />
      <RNAnimated.View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF', transform: [{ translateX }], shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 4, elevation: 3 }} />
    </Pressable>
  );
});

// ── Avatar Pulse Ring + rotating zodiac arc ────────────────────
const AvatarPulseRing = React.memo(({ accent }: { accent: string }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);
  const rotate = useSharedValue(0);
  const rotateRev = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 1600, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 1600, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 1600 }),
        withTiming(0.7, { duration: 1600 }),
      ),
      -1,
      false,
    );
    rotate.value = withRepeat(withTiming(360, { duration: 14000, easing: Easing.linear }), -1, false);
    rotateRev.value = withRepeat(withTiming(-360, { duration: 22000, easing: Easing.linear }), -1, false);
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const innerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateRev.value}deg` }],
  }));

  // 12 tick marks around the outer ring
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const r = 75;
    const tickLen = i % 3 === 0 ? 8 : 4;
    return {
      x1: 80 + (r - tickLen) * Math.cos(angle),
      y1: 80 + (r - tickLen) * Math.sin(angle),
      x2: 80 + r * Math.cos(angle),
      y2: 80 + r * Math.sin(angle),
    };
  });

  return (
    <>
      {/* Outer rotating ring with ticks */}
      <Animated.View
        style={[{ position: 'absolute', width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center' }, outerRingStyle]}
        pointerEvents="none"
      >
        <View style={{ width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: accent + '44', borderStyle: 'dashed', position: 'absolute' }} />
        {ticks.map((t, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: t.x1,
              top: t.y1,
              width: 1.5,
              height: Math.sqrt((t.x2 - t.x1) ** 2 + (t.y2 - t.y1) ** 2),
              backgroundColor: accent + (i % 3 === 0 ? 'CC' : '55'),
              transformOrigin: '0 0',
              transform: [{ rotate: `${Math.atan2(t.y2 - t.y1, t.x2 - t.x1) + Math.PI / 2}rad` }],
            }}
          />
        ))}
      </Animated.View>
      {/* Inner counter-rotating ring */}
      <Animated.View
        style={[{ position: 'absolute', width: 142, height: 142, borderRadius: 71, borderWidth: 1, borderColor: accent + '30' }, innerRingStyle]}
        pointerEvents="none"
      />
      {/* Pulsing glow ring */}
      <Animated.View
        style={[{
          position: 'absolute',
          width: 130,
          height: 130,
          borderRadius: 65,
          borderWidth: 2,
          borderColor: accent,
        }, ringStyle]}
      />
    </>
  );
});

// ── Premium badge shimmer ──────────────────────────────────────
const ShimmerBadge = React.memo(({ label, accent }: { label: string; accent: string }) => {
  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.linear }), -1, false);
  }, []);
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-80, 80]) }],
    opacity: interpolate(shimmer.value, [0, 0.4, 0.6, 1], [0, 0.4, 0.4, 0]),
  }));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(206,174,114,0.12)', borderWidth: 1, borderColor: 'rgba(206,174,114,0.35)', overflow: 'hidden' }}>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: 60, backgroundColor: 'rgba(255,255,255,0.18)', transform: [{ skewX: '-20deg' }] }, shimmerStyle]} />
      <Crown color="#CEAE72" size={13} strokeWidth={1.8} />
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#CEAE72', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
});

// ── Logout Button ──────────────────────────────────────────────
const LogoutButton = React.memo(({ accent, isLight }: { accent: string; isLight: boolean }) => {
    const logout = useAuthStore(s => s.logout);
  const [confirming, setConfirming] = React.useState(false);

  const handlePress = () => {
    if (!confirming) { setConfirming(true); return; }
    logout();
  };

  React.useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <View style={{ paddingHorizontal: 18, marginTop: 24, marginBottom: 4 }}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
          paddingVertical: 15, borderRadius: 18,
          backgroundColor: confirming ? 'rgba(239,68,68,0.10)' : isLight ? 'rgba(240,228,210,0.90)' : 'rgba(255,255,255,0.04)',
          borderWidth: 1,
          borderColor: confirming ? 'rgba(239,68,68,0.45)' : isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)',
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <Text style={{ fontSize: 16 }}>🚪</Text>
        <Text style={{
          fontSize: 14, fontWeight: '600', letterSpacing: 0.3,
          color: confirming ? '#EF4444' : isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.40)',
        }}>
          {confirming ? 'Naciśnij ponownie, aby wylogować' : 'Wyloguj się'}
        </Text>
      </Pressable>
    </View>
  );
});

// ── Premium Card (glass) ───────────────────────────────────────
const PremiumCard = React.memo(({
  children, accent, isLight, style, delay = 0
}: { children: React.ReactNode; accent: string; isLight: boolean; style?: any; delay?: number }) => (
  <Animated.View
    entering={FadeInDown.delay(delay).duration(500)}
    style={[{
      marginHorizontal: 18,
      marginBottom: 10,
      borderRadius: 22,
      overflow: 'hidden',
      shadowColor: accent,
      shadowOpacity: isLight ? 0.14 : 0.28,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10,
    }, style]}
  >
    <BlurView
      intensity={isLight ? 55 : 35}
      tint={isLight ? 'light' : 'dark'}
      style={{
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderLeftWidth: 3,
        borderLeftColor: accent + 'CC',
        borderColor: isLight ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.10)',
      }}
    >
      {/* Inner glass layer */}
      <View style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.04)' }}>
        {/* Top gradient strip */}
        <LinearGradient
          colors={[accent + '55', accent + '11', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ height: 2, width: '100%' }}
        />
        {/* Top highlight edge */}
        <View style={{ position: 'absolute', top: 2, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.22)' }} pointerEvents="none" />
        {children}
      </View>
    </BlurView>
  </Animated.View>
));

// ── Section Header (premium) ───────────────────────────────────
const SectionHeader = React.memo(({ icon: Icon, label, color, delay = 0 }: { icon: any; label: string; color: string; delay?: number }) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={{ paddingHorizontal: 22, paddingTop: 26, paddingBottom: 10 }}>
    {/* Thin gradient divider line */}
    <LinearGradient
      colors={[color + '44', color + '22', 'transparent']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      style={{ height: 1, marginBottom: 14, borderRadius: 1 }}
    />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <LinearGradient
        colors={[color + '33', color + '14']}
        style={{ width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: color + '44', alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon color={color} size={17} strokeWidth={1.8} />
      </LinearGradient>
      <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 2.0, color, textTransform: 'uppercase', flex: 1 }}>{label}</Text>
      {/* Short accent bar */}
      <View style={{ width: 20, height: 2, backgroundColor: color + '50', borderRadius: 1 }} />
    </View>
  </Animated.View>
));

// ── Entry Row ──────────────────────────────────────────────────
const EntryRow = React.memo(({
  icon: Icon, label, value, onPress, accent, last = false, badge, textColor = '#1A1410', subColor = '#6B5B4E'
}: {
  icon: any; label: string; value?: string; onPress?: () => void;
  accent: string; last?: boolean; badge?: string; textColor?: string; subColor?: string;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [pStyles.entryRow, !last && pStyles.entryRowBorder, { opacity: pressed ? 0.78 : 1 }]}
  >
    <View style={[pStyles.entryIcon, { backgroundColor: accent + '14', borderColor: accent + '28' }]}>
      <Icon color={accent} size={16} strokeWidth={1.8} />
    </View>
    <View style={pStyles.entryText}>
      <Text style={[pStyles.entryLabel, { color: textColor }]}>{label}</Text>
      {value ? <Text style={[pStyles.entryValue, { color: subColor }]} numberOfLines={1}>{value}</Text> : null}
    </View>
    {badge ? (
      <View style={[pStyles.badge, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
        <Text style={[pStyles.badgeText, { color: accent }]}>{badge}</Text>
      </View>
    ) : null}
    {onPress ? <ChevronRight color={accent} size={15} strokeWidth={1.6} opacity={0.5} /> : null}
  </Pressable>
));

// ── Toggle Row ─────────────────────────────────────────────────
const ToggleRow = React.memo(({
  icon: Icon, label, value, onToggle, accent, last = false, textColor = '#1A1410', subColor = '#8A7060'
}: {
  icon: any; label: string; value: boolean; onToggle: () => void;
  accent: string; last?: boolean; textColor?: string; subColor?: string;
}) => (
  <View style={[pStyles.entryRow, !last && pStyles.entryRowBorder]}>
    <View style={[pStyles.entryIcon, { backgroundColor: accent + '14', borderColor: accent + '28' }]}>
      <Icon color={accent} size={16} strokeWidth={1.8} />
    </View>
    <View style={pStyles.entryText}>
      <Text style={[pStyles.entryLabel, { color: textColor }]}>{label}</Text>
      <Text style={[pStyles.entryValue, { color: subColor }]}>{value ? 'Włączone' : 'Wyłączone'}</Text>
    </View>
    <CustomToggle value={value} onToggle={onToggle} accent={accent} />
  </View>
));

// ── Bottom Modal ───────────────────────────────────────────────
const BottomModal = ({
  visible, onClose, title, children, accent
}: {
  visible: boolean; onClose: () => void; title: string;
  children: React.ReactNode; accent: string;
}) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={pStyles.modalBg} onPress={onClose} />
      <View style={[pStyles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={pStyles.modalHandle} />
        <View style={pStyles.modalTitleRow}>
          <Text style={pStyles.modalTitle}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <X color="#8A7A6A" size={22} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
};

// ── Helpers ────────────────────────────────────────────────────
const reduceToSingle = (n: number): number => {
  let v = n;
  while (v > 9 && v !== 11 && v !== 22) {
    v = String(v).split('').reduce((acc, d) => acc + Number(d), 0);
  }
  return v;
};

// ══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════
export const ProfileScreen = ({ navigation, route }: any) => {
  const musicVolume = useAppStore((s) => s.experience?.musicVolume ?? 0.5);
  const ambientVolume = useAppStore((s) => s.experience?.ambientVolume ?? 0.5);
  const setExperience = useAppStore((s) => s.setExperience);

  const handleMusicVolume = useCallback((v: number) => {
    setExperience({ musicVolume: v });
    AudioService.setUserInteracted(); AudioService.setMusicVolume(v);
  }, [setExperience]);

  const handleAmbientVolume = useCallback((v: number) => {
    setExperience({ ambientVolume: v });
    AudioService.setUserInteracted(); AudioService.setAmbientVolume(v);
  }, [setExperience]);

  const { t } = useTranslation();
  const tr = useCallback((key: string, pl: string, en: string, options?: Record<string, unknown>) => (
    t(key, { defaultValue: i18n.language?.startsWith('en') ? en : pl, ...options })
  ), [t]);

  const insets = useSafeAreaInsets();
    const setTheme = useAppStore(s => s.setTheme);
  const setThemeMode = useAppStore(s => s.setThemeMode);
  const userData = useAppStore(s => s.userData);
  const setLanguage = useAppStore(s => s.setLanguage);
  const setUserData = useAppStore(s => s.setUserData);
  const streaks = useAppStore(s => s.streaks);
  const language = useAppStore(s => s.language);
  const experience = useAppStore(s => s.experience);
  const ambientSoundEnabled = useAppStore(s => s.ambientSoundEnabled);
  const setAmbientSoundEnabled = useAppStore(s => s.setAmbientSoundEnabled);
  const audioRuntimeState = useAppStore(s => s.audioRuntimeState);
  const hapticsRuntimeState = useAppStore(s => s.hapticsRuntimeState);
  const meditationSessions = useAppStore(s => s.meditationSessions);
  const breathworkSessions = useAppStore(s => s.breathworkSessions);
  const { currentTheme, isLight, themeName, themeMode } = useTheme();
  const { entries } = useJournalStore();
  const { pastSessions } = useOracleStore();
  const { isPremium, subscriptionPlan } = usePremiumStore();
  const { selectedDeckId, setSelectedDeck } = useTarotStore();
  const accent = currentTheme.primary;
  const rowTextColor = isLight ? '#1A1410' : '#F0EBE2';
  const rowSubColor = isLight ? '#5A4A3A' : '#A09080';
  const audioDiagnostic = AudioService.getDiagnosticSnapshot();
  const activeMusicLabel = MUSIC_CATEGORY_OPTIONS.find((opt) => opt.id === audioDiagnostic.activeMusicCategory)?.label || 'Brak aktywnej ścieżki';
  const activeAmbientLabel = SOUNDSCAPE_OPTIONS.find((opt) => opt.id === audioDiagnostic.activeAmbientSoundscape)?.label || 'Brak aktywnego krajobrazu';

  const sign = userData.birthDate ? getZodiacSign(userData.birthDate) : null;
  const archetype = SoulEngineService.getArchetype(userData.birthDate ?? null);
  const selectedDeck = getTarotDeckById(selectedDeckId);
  const hasAvatar = Boolean(userData.avatarUri);
  const firstName = userData.name?.trim() || 'Wędrowcze';
  const savedDreams = useMemo(() => entries.filter(e => e.type === 'dream').length, [entries]);
  const practiceCount = meditationSessions.length + breathworkSessions.length;
  const favoriteEntries = useMemo(() => entries.filter(e => e.isFavorite).length, [entries]);
  const audioControlsLocked = audioRuntimeState === 'initializing' || audioRuntimeState === 'failed';

  const personalYear = useMemo(() => {
    if (!userData.birthDate) return null;
    const parts = userData.birthDate.split('-');
    const mm = Number(parts[1]);
    const dd = Number(parts[2]);
    return reduceToSingle(mm + dd + new Date().getFullYear());
  }, [userData.birthDate]);
  const monthlyVibration = useMemo(() => {
    if (!personalYear) return null;
    return String(reduceToSingle(personalYear + new Date().getMonth() + 1));
  }, [personalYear]);
  const personalDay = useMemo(() => {
    if (!personalYear) return null;
    const now = new Date();
    return reduceToSingle(personalYear + now.getMonth() + 1 + now.getDate());
  }, [personalYear]);

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  const [showTarotDeckModal, setShowTarotDeckModal] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false);
  const [showMotionModal, setShowMotionModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const THEMES_LIST: ThemeName[] = ['goldenRitual', 'moonMist', 'dawnClarity', 'cosmicViolet', 'crimsonSoul', 'forestDepth', 'oceanDream', 'sunriseSanctum'];

  const handlePickAvatar = useCallback(async () => {
    setAvatarBusy(true);
    try {
      const result = await AvatarService.pickAvatarFromLibrary();
      if (result.kind === 'success' && result.uri) { setUserData({ avatarUri: result.uri }); setShowAvatarModal(false); }
    } catch {}
    setAvatarBusy(false);
  }, [setUserData]);

  const handleRemoveAvatar = useCallback(() => {
    setUserData({ avatarUri: '' });
    setShowAvatarModal(false);
  }, [setUserData]);

  // Particle data (stable across renders)
  const particles = useMemo(() => Array.from({ length: PARTICLE_COUNT }, (_, i) => i), []);

  return (
    <View style={[pStyles.container, { backgroundColor: isLight ? '#F5EFE6' : '#07080E' }]}>
      <CelestialBackdrop intensity="soft" />

      {/* ── FLOATING PARTICLES ── */}
      <View style={pStyles.particlesLayer} pointerEvents="none">
        {particles.map((i) => (
          <FloatingParticle key={i} index={i} accent={accent} />
        ))}
      </View>

      <SafeAreaView edges={['top']} style={pStyles.safeArea}>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: screenContracts.bottomInset(insets.bottom, 'airy') }}
          showsVerticalScrollIndicator={false}
        >

        {/* ══ HERO HEADER ══ */}
        <View>
          <Animated.View entering={FadeIn.duration(600)}>
            <LinearGradient
              colors={isLight
                ? ['#FBF5E8', '#F5E8D0', '#EEE0C4', '#F5E8D0']
                : ['#0A0B14', '#0E1020', '#121628', '#0E1020']
              }
              style={{ paddingBottom: 0 }}
            >
              {/* Decorative radial glow behind avatar */}
              <View style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 340,
                alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden',
              }} pointerEvents="none">
                <View style={{
                  width: 280, height: 280, borderRadius: 140, marginTop: -40,
                  backgroundColor: accent + (isLight ? '22' : '18'),
                  shadowColor: accent, shadowOpacity: isLight ? 0.22 : 0.35,
                  shadowRadius: 60, elevation: 0,
                }} />
              </View>

              {/* Title bar */}
              <View style={{ paddingHorizontal: layout.padding.screen, paddingTop: 6, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Animated.View entering={FadeInDown.delay(50).duration(400)}>
                  <Text style={{ fontSize: 9, fontFamily: 'Raleway_700Bold', letterSpacing: 3.5, color: accent + 'CC', marginBottom: 2 }}>{t('profile.aethera', '✦ AETHERA')}</Text>
                  <Text style={{ fontSize: 22, fontFamily: 'Cinzel_600SemiBold', letterSpacing: 0.2, color: isLight ? '#1A1410' : '#F0EBE2' }}>
                    {tr('profile.title', 'Profil i Ustawienia', 'Profile & Settings')}
                  </Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Pressable
                    onPress={() => { HapticsService.impact('light'); navigation.navigate('Paywall'); }}
                  >
                    {isPremium
                      ? <ShimmerBadge label={subscriptionPlan === 'lifetime' ? 'Lifetime' : 'Premium'} accent={accent} />
                      : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(206,174,114,0.12)', borderWidth: 1, borderColor: 'rgba(206,174,114,0.38)' }}>
                          <Crown color="#CEAE72" size={13} strokeWidth={1.8} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#CEAE72', letterSpacing: 0.3 }}>{t('profile.premium', 'Premium')}</Text>
                        </View>
                      )
                    }
                  </Pressable>
                  <Pressable
                    onPress={() => navigation.navigate('NotificationsDetail')}
                    style={[pStyles.iconBtn, { backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.07)', borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.10)' }]}
                  >
                    <Settings2 color={rowSubColor} size={17} strokeWidth={1.8} />
                  </Pressable>
                </Animated.View>
              </View>

              {/* ── AVATAR + INFO ── */}
              <Animated.View entering={FadeInDown.delay(120).duration(600)} style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 6 }}>
                <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  {/* Dual ring glow */}
                  <View style={{ width: 136, height: 136, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ position: 'absolute', width: 136, height: 136, borderRadius: 68, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: accent + '30' }} />
                    <View style={{ position: 'absolute', width: 148, height: 148, borderRadius: 74, backgroundColor: 'transparent', borderWidth: 1, borderColor: accent + '18' }} />
                    <View style={{ position: 'absolute', width: 132, height: 132, borderRadius: 66, backgroundColor: accent + '14', shadowColor: accent, shadowOpacity: 0.60, shadowRadius: 26, elevation: 20 }} />
                    <AvatarPulseRing accent={accent} />
                    <Pressable onPress={() => setShowAvatarModal(true)} style={{ position: 'relative' }}>
                      <ProfileAvatar
                        uri={userData.avatarUri}
                        name={firstName}
                        fallbackText={firstName.charAt(0).toUpperCase()}
                        size={114}
                        primary={accent}
                        borderColor={accent + '90'}
                        backgroundColor={isLight ? '#FFF8EE' : '#151B2C'}
                        textColor={accent}
                      />
                      <View style={{
                        position: 'absolute', bottom: 3, right: 3,
                        width: 30, height: 30, borderRadius: 15,
                        backgroundColor: accent,
                        borderColor: isLight ? '#F5EFE6' : '#0A0B14', borderWidth: 2.5,
                        alignItems: 'center', justifyContent: 'center',
                        shadowColor: accent, shadowOpacity: 0.65, shadowRadius: 10, elevation: 8,
                      }}>
                        <Feather color="#FFF" size={11} strokeWidth={2.5} />
                      </View>
                    </Pressable>
                  </View>
                </View>

                {/* Name + streak inline */}
                <Text style={{ fontSize: 30, fontFamily: 'Cinzel_400Regular', letterSpacing: 1, color: isLight ? '#1A1410' : '#F5F1EA', marginBottom: 4 }}>
                  {firstName}
                </Text>
                {streaks.current > 0 && (
                  <Animated.View entering={ZoomIn.delay(350).duration(400)} style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: isLight ? 'rgba(251,146,60,0.12)' : 'rgba(251,146,60,0.15)', borderWidth: 1, borderColor: 'rgba(251,146,60,0.38)' }}>
                      <Flame size={13} color="#FB923C" strokeWidth={2.2} />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#FB923C', letterSpacing: 0.4 }}>
                        {streaks.current} dni passy
                      </Text>
                    </View>
                  </Animated.View>
                )}

                {/* Zodiac + archetype + premium pills */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 20, marginBottom: 6 }}>
                  {userData.birthDate && sign && (
                    <LinearGradient
                      colors={[accent + '30', accent + '14']}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: accent + '50' }}
                    >
                      <Text style={{ fontSize: 14 }}>{ZODIAC_SYMBOLS[sign] || '✦'}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: accent }}>
                        {ZODIAC_LABELS[sign] || sign}
                      </Text>
                    </LinearGradient>
                  )}
                  {archetype && (
                    <View style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.14)' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: rowSubColor }}>
                        {resolveUserFacingText(archetype.title)}
                      </Text>
                    </View>
                  )}
                  {isPremium && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(206,174,114,0.15)', borderWidth: 1, borderColor: 'rgba(206,174,114,0.36)' }}>
                      <Crown size={11} color="#CEAE72" strokeWidth={2.2} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#CEAE72', letterSpacing: 0.4 }}>
                        {subscriptionPlan === 'lifetime' ? 'Lifetime' : subscriptionPlan === 'yearly' ? 'Mistrz' : 'Dusza'}
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* ── STATS ROW ── */}
              <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 6, marginBottom: 22 }}>
                {/* Divider with gradient */}
                <LinearGradient colors={['transparent', accent + '40', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1, marginBottom: 16 }} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {[
                    { val: String(pastSessions.length), label: 'Sesje Oracle', icon: MessageCircle, color: accent, emoji: '🔮' },
                    { val: String(entries.length), label: 'Wpisy', icon: Book, color: accent, emoji: '📖' },
                    { val: String(practiceCount), label: 'Praktyki', icon: Waves, color: accent, emoji: '🌊' },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <View key={s.label} style={{ flex: 1, borderRadius: 20, overflow: 'hidden', shadowColor: accent, shadowOpacity: isLight ? 0.16 : 0.24, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 7 }}>
                        <BlurView intensity={isLight ? 60 : 40} tint={isLight ? 'light' : 'dark'} style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: isLight ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.12)' }}>
                          <View style={{ alignItems: 'center', paddingVertical: 16, paddingHorizontal: 6, backgroundColor: isLight ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.05)' }}>
                            {/* top highlight */}
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.35)' }} pointerEvents="none" />
                            <LinearGradient colors={[accent + '22', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, borderTopLeftRadius: 20, borderTopRightRadius: 20 }} pointerEvents="none" />
                            <Text style={{ fontSize: 18, marginBottom: 5 }}>{s.emoji}</Text>
                            <Text style={{ fontSize: 24, fontWeight: '800', color: accent, letterSpacing: -1 }}>{s.val}</Text>
                            <Text style={{ fontSize: 10, color: rowSubColor, fontWeight: '700', letterSpacing: 0.3, marginTop: 3, textAlign: 'center' }}>{s.label}</Text>
                          </View>
                        </BlurView>
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            </LinearGradient>
          </Animated.View>
        </View>

          {/* ── QUICK ACCESS TILES ── */}
          <Animated.View entering={FadeInDown.delay(60).duration(500)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 20, marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2.2, color: rowSubColor }}>{t('profile.szybki_dostep', 'SZYBKI DOSTĘP')}</Text>
              <View style={{ width: 32, height: 1, backgroundColor: accent + '40' }} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {([
                { emoji: '🎨', label: 'Motyw',       color: accent,      onPress: () => setShowThemeModal(true) },
                { emoji: '🌐', label: 'Język',        color: '#60A5FA',   onPress: () => setShowLanguageModal(true) },
                { emoji: '🃏', label: 'Talia',        color: '#F472B6',   onPress: () => setShowTarotDeckModal(true) },
                { emoji: '🖼',  label: 'Tło',          color: '#A78BFA',   onPress: () => setShowBgModal(true) },
                { emoji: '✨', label: 'Animacje',     color: '#34D399',   onPress: () => setShowMotionModal(true) },
                { emoji: '🧭', label: 'Prowadzenie',  color: '#FB923C',   onPress: () => setShowGuidanceModal(true) },
                { emoji: '📊', label: 'Raport',       color: '#60A5FA',   onPress: () => navigation.navigate('Reports') },
                { emoji: '🏆', label: 'Osiągnięcia',  color: '#FBBF24',   onPress: () => navigation.navigate('Achievements') },
              ]).map((item) => {
                const tileW = Math.floor((SW - layout.padding.screen * 2 - 30) / 4);
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => { void HapticsService.selection(); item.onPress(); }}
                    style={({ pressed }) => ({
                      width: tileW,
                      opacity: pressed ? 0.75 : 1,
                      borderRadius: 22,
                      overflow: 'hidden',
                      shadowColor: item.color,
                      shadowOpacity: pressed ? 0.04 : isLight ? 0.18 : 0.20,
                      shadowRadius: 12, shadowOffset: { width: 0, height: 5 },
                      elevation: 6,
                    })}
                  >
                    <BlurView
                      intensity={isLight ? 50 : 32}
                      tint={isLight ? 'light' : 'dark'}
                      style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: isLight ? 'rgba(255,255,255,0.72)' : item.color + '30' }}
                    >
                      <View style={{ alignItems: 'center', paddingVertical: 15, paddingHorizontal: 4, gap: 8, backgroundColor: isLight ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.04)' }}>
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.30)' }} pointerEvents="none" />
                        <LinearGradient
                          colors={[item.color + '33', item.color + '11']}
                          style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: item.color + '44' }}
                        >
                          <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
                        </LinearGradient>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: isLight ? '#3A2A1A' : item.color + 'EE', letterSpacing: 0.2, textAlign: 'center' }}>{item.label}</Text>
                      </View>
                    </BlurView>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* ── MEMBERSHIP CARD ── always navigates to Paywall */}
          <Animated.View entering={FadeInDown.delay(80).duration(500)} style={{ paddingHorizontal: 18, marginBottom: 6, marginTop: 10 }}>
            <Pressable
              onPress={() => { HapticsService.impact('light'); navigation.navigate('Paywall'); }}
              style={({ pressed }) => ({
                borderRadius: 24, overflow: 'hidden',
                borderWidth: 1.5, borderColor: isPremium ? 'rgba(206,174,114,0.45)' : 'rgba(206,174,114,0.40)',
                shadowColor: '#CEAE72',
                shadowOpacity: pressed ? 0.08 : (isLight ? 0.18 : 0.38),
                shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 14,
                opacity: pressed ? 0.94 : 1,
              })}
            >
              {isPremium ? (
                <LinearGradient
                  colors={isLight ? ['rgba(253,244,224,0.98)', 'rgba(243,222,172,0.80)', 'rgba(251,240,218,0.95)'] : ['#1F1208', '#341B09', '#1F1208']}
                  style={{ padding: 22 }}
                >
                  {/* Top shimmer line */}
                  <LinearGradient colors={['transparent', '#CEAE72', '#E8C87A', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1.5, marginBottom: 20 }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                    <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(206,174,114,0.22)', borderWidth: 2, borderColor: 'rgba(206,174,114,0.55)', alignItems: 'center', justifyContent: 'center', shadowColor: '#CEAE72', shadowOpacity: 0.55, shadowRadius: 16, elevation: 10 }}>
                      <Crown size={28} color="#CEAE72" strokeWidth={1.4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 19, fontWeight: '800', color: isLight ? '#3A2610' : '#F5EDD8', letterSpacing: 0.3 }}>
                        {subscriptionPlan === 'lifetime' ? '👑 Mistrz Lifetime' : subscriptionPlan === 'yearly' ? '⭐ Plan Mistrz' : '✨ Plan Dusza'}
                      </Text>
                      <Text style={{ fontSize: 12, color: isLight ? '#7A5222' : 'rgba(206,174,114,0.72)', marginTop: 3 }}>{t('profile.aktywne_czlonkostw_premium', 'Aktywne członkostwo Premium')}</Text>
                    </View>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(206,174,114,0.15)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(206,174,114,0.35)' }}>
                      <ChevronRight size={14} color="#CEAE72" strokeWidth={2.5} />
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                    {[{ label: 'Oracle', val: '∞', emoji: '🔮' }, { label: 'Tarot', val: '∞', emoji: '🃏' }, { label: 'Rytuały', val: 'AI', emoji: '✨' }].map((s) => (
                      <View key={s.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, backgroundColor: isLight ? 'rgba(206,174,114,0.12)' : 'rgba(206,174,114,0.09)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(206,174,114,0.28)' }}>
                        <Text style={{ fontSize: 14, marginBottom: 3 }}>{s.emoji}</Text>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: '#CEAE72', letterSpacing: -0.5 }}>{s.val}</Text>
                        <Text style={{ fontSize: 10, color: isLight ? '#7A5222' : 'rgba(206,174,114,0.68)', marginTop: 2, fontWeight: '600' }}>{s.label}</Text>
                      </View>
                    ))}
                  </View>
                  <LinearGradient colors={['rgba(206,174,114,0.08)', 'rgba(206,174,114,0.15)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 14, paddingVertical: 11, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(206,174,114,0.22)' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: isLight ? '#7A5222' : 'rgba(206,174,114,0.80)', letterSpacing: 0.3 }}>{t('profile.zarzadzaj_pakietem_uaktualnij_plan', 'Zarządzaj pakietem · uaktualnij plan')}</Text>
                    <ChevronRight size={14} color="#CEAE72" strokeWidth={2.2} />
                  </LinearGradient>
                </LinearGradient>
              ) : (
                <LinearGradient
                  colors={isLight ? ['rgba(253,244,222,0.97)', 'rgba(243,225,175,0.78)', 'rgba(250,238,210,0.96)'] : ['#1C0F04', '#321807', '#1C0F04']}
                  style={{ padding: 22 }}
                >
                  <LinearGradient colors={['transparent', '#CEAE72', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1, marginBottom: 20 }} />
                  {/* ODBLOKUJ badge */}
                  <View style={{ position: 'absolute', top: 18, right: 18, backgroundColor: isLight ? 'rgba(206,174,114,0.25)' : 'rgba(206,174,114,0.20)', borderWidth: 1, borderColor: 'rgba(206,174,114,0.50)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#CEAE72', letterSpacing: 1 }}>{t('profile.odblokuj', '✦ ODBLOKUJ')}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                    <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(206,174,114,0.18)', borderWidth: 2, borderColor: 'rgba(206,174,114,0.45)', alignItems: 'center', justifyContent: 'center', shadowColor: '#CEAE72', shadowOpacity: 0.40, shadowRadius: 14, elevation: 8 }}>
                      <Crown size={28} color="#CEAE72" strokeWidth={1.4} />
                    </View>
                    <View style={{ flex: 1, paddingRight: 64 }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: isLight ? '#3A2610' : '#F5EDD8', letterSpacing: 0.3 }}>{t('profile.aethera_premium', 'Aethera Premium')}</Text>
                      <Text style={{ fontSize: 12, color: isLight ? '#7A5222' : 'rgba(206,174,114,0.68)', marginTop: 3, lineHeight: 17 }}>
                        {t('profile.pelne_sanktuariu_duszy_bez_limitow', 'Pełne sanktuarium duszy — bez limitów')}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {['🔮 ∞ Oracle', '🌙 Analiza snów', '✨ Rytuały AI', '🎵 Sound Bath', '🌌 Matryca AI', '🃏 Tarot'].map((f) => (
                      <View key={f} style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, backgroundColor: isLight ? 'rgba(206,174,114,0.14)' : 'rgba(206,174,114,0.10)', borderWidth: 1, borderColor: 'rgba(206,174,114,0.28)' }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: isLight ? '#7A5520' : 'rgba(206,174,114,0.88)' }}>{f}</Text>
                      </View>
                    ))}
                  </View>
                  <LinearGradient colors={['#8A6818', '#CEAE72', '#E8C87A', '#CEAE72']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 16, paddingVertical: 15, alignItems: 'center', shadowColor: '#CEAE72', shadowOpacity: 0.50, shadowRadius: 12, elevation: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#1A0E04', letterSpacing: 0.5 }}>{t('profile.odkryj_plany_premium', '✦ Odkryj plany Premium')}</Text>
                  </LinearGradient>
                </LinearGradient>
              )}
            </Pressable>
          </Animated.View>

          {/* ── ROK OSOBISTY ── */}
          <SectionHeader icon={Calendar} label={t('profile.moj_rok_osobisty', 'Mój rok osobisty')} color={accent} delay={100} />
          <PremiumCard accent={accent} isLight={isLight} delay={110}>
            <EntryRow icon={Star} label={t('profile.rok_osobisty', 'Rok osobisty')} value={personalYear ? `Cykl ${personalYear} · ${personalYear === 1 ? 'Nowe początki' : personalYear === 2 ? 'Partnerstwo' : personalYear === 3 ? 'Ekspresja' : personalYear === 4 ? 'Praca' : personalYear === 5 ? 'Zmiana' : personalYear === 6 ? 'Miłość' : personalYear === 7 ? 'Duchowość' : personalYear === 8 ? 'Moc' : 'Spełnienie'}` : 'Uzupełnij datę'} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
            <EntryRow icon={Compass} label={t('profile.miesieczna_wibracja', 'Miesięczna wibracja')} value={monthlyVibration ? `Cykl ${monthlyVibration} · aktywna` : 'Brak daty'} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
            <EntryRow icon={Sun} label={t('profile.dzien_osobisty', 'Dzień osobisty')} value={personalDay ? `Cykl ${personalDay} · dziś` : '—'} accent={accent} last textColor={rowTextColor} subColor={rowSubColor} />
          </PremiumCard>

          {/* ── 1. TOŻSAMOŚĆ ── */}
          <SectionHeader icon={User} label={t('profile.tozsamosc', 'Tożsamość')} color={accent} delay={140} />
          <PremiumCard accent={accent} isLight={isLight} delay={150}>
            <EntryRow icon={User} label={t('profile.imie_i_profil', 'Imię i profil')} value={firstName} onPress={() => navigation.navigate('IdentitySetup')} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
            <EntryRow icon={Star} label={t('profile.znak_zodiaku', 'Znak zodiaku')} value={sign ? (ZODIAC_LABELS[sign] || sign) : 'Uzupełnij datę urodzenia'} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
            <EntryRow icon={Sparkles} label={t('profile.archetyp_dnia', 'Archetyp dnia')} value={archetype ? resolveUserFacingText(archetype.title) : 'Obliczany...'} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
            <EntryRow icon={Flame} label={t('profile.talia_tarota_1', 'Talia tarota')} value={selectedDeck?.name || 'Klasyczna'} onPress={() => setShowTarotDeckModal(true)} accent={accent} last textColor={rowTextColor} subColor={rowSubColor} />
          </PremiumCard>

          {/* ── 2. DOSTROJENIE ORACLE ── */}
          <SectionHeader icon={Sparkles} label={t('profile.dostrojeni_oracle', 'Dostrojenie Oracle')} color={accent} delay={180} />
          <PremiumCard accent={accent} isLight={isLight} delay={190}>
            <EntryRow icon={Globe} label={tr('profile.languageLabel', 'Język', 'Language')} value={LANGUAGE_OPTIONS.find(o => o.id === language)?.native || 'Polski'} onPress={() => setShowLanguageModal(true)} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
            <EntryRow icon={Sparkles} label={t('profile.nurt_guidance_1', 'Nurt guidance')} value={GUIDANCE_OPTIONS.find(o => o.id === userData.primaryGuidanceMode)?.label || 'Mieszane'} onPress={() => setShowGuidanceModal(true)} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
            <EntryRow icon={Flame} label={t('profile.talia_tarota_2', 'Talia tarota')} value={selectedDeck?.name || 'Klasyczna'} onPress={() => setShowTarotDeckModal(true)} accent={accent} last textColor={rowTextColor} subColor={rowSubColor} />
          </PremiumCard>

          {/* ── 3. DŹWIĘK & AURA ── */}
          <SectionHeader icon={Music} label={t('profile.dzwiek_i_aura', 'Dźwięk i aura')} color={accent} delay={220} />
          {/* Audio runtime status */}
          <Animated.View entering={FadeInDown.delay(225).duration(400)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, paddingHorizontal: 22 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: audioRuntimeState === 'ready' ? '#34D399' : audioRuntimeState === 'failed' ? '#F87171' : '#FBBF24' }} />
            <Text style={{ fontSize: 10, color: audioRuntimeState === 'ready' ? '#34D399' : audioRuntimeState === 'failed' ? '#F87171' : '#FBBF24', fontWeight: '700', letterSpacing: 0.8 }}>
              {audioRuntimeState === 'ready' ? 'AUDIO AKTYWNE' : audioRuntimeState === 'failed' ? 'AUDIO BŁĄD' : audioRuntimeState === 'initializing' ? 'ŁADOWANIE...' : 'AUDIO NIEAKTYWNE'}
            </Text>
          </Animated.View>

          {/* Studio doswiadczenia */}
          <Animated.View entering={FadeInDown.delay(230).duration(500)} style={{ marginHorizontal: 18, marginBottom: 10, borderRadius: 22, borderWidth: 1, borderColor: accent + '28', overflow: 'hidden' }}>
            <LinearGradient colors={[accent + '18', accent + '06', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
            <View style={{ borderLeftWidth: 3, borderLeftColor: accent + 'CC' }}>
              <LinearGradient colors={[accent + '44', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 2 }} />
              <View style={{ padding: 18 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2.0, color: accent, marginBottom: 8 }}>{t('profile.studio_doswiadcze', 'STUDIO DOŚWIADCZENIA')}</Text>
                <Text style={{ fontSize: 14, lineHeight: 22, color: rowTextColor, fontWeight: '600' }}>{t('profile.tu_ustawiasz_nie_tylko_glosnosc', 'Tu ustawiasz nie tylko głośność. Budujesz atmosferę całej aplikacji: muzykę, pejzaż tła, sygnały dotyku i poziom ceremonialności kontaktu.')}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {['muzyka', 'ambient', 'dotyk i sygnały'].map((chip) => (
                    <View key={chip} style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: accent + '30', backgroundColor: accent + '10' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: accent, letterSpacing: 0.5 }}>{chip}</Text>
                    </View>
                  ))}
                </View>
                {/* Live status */}
                <View style={{ marginTop: 16, borderRadius: 16, borderWidth: 1, borderColor: accent + '24', backgroundColor: isLight ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.04)', padding: 14 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: accent, marginBottom: 10 }}>{t('profile.live_status', 'LIVE STATUS')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['PRELOAD ' + (audioDiagnostic.preloadReady ? 'GOTOWY' : 'W TOKU'), 'MUZYKA ' + activeMusicLabel.toUpperCase(), 'AMBIENT ' + activeAmbientLabel.toUpperCase()].map((item) => (
                      <View key={item} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: accent + '28', backgroundColor: accent + '0E' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: rowTextColor, letterSpacing: 0.4 }}>{item}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={{ fontSize: 12, lineHeight: 19, color: rowSubColor, marginTop: 10 }}>{audioDiagnostic.lastAction || 'System audio czeka na pierwszą interakcję użytkownika.'}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <PremiumCard accent={accent} isLight={isLight} delay={240}>
            <ToggleRow icon={Music} label={t('profile.muzyka_tla', 'Muzyka tła')} value={experience.backgroundMusicEnabled} onToggle={() => { setExperience({ backgroundMusicEnabled: !experience.backgroundMusicEnabled }); }} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
            {/* Music volume */}
            <View style={{ paddingHorizontal: 18, paddingBottom: 8, opacity: experience.backgroundMusicEnabled ? 1 : 0.4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: currentTheme.textSoft }}>{t('profile.music_volume')}</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: accent }}>{Math.round(musicVolume * 100)}%</Text>
              </View>
              <Slider style={{ width: '100%', height: 36 }} minimumValue={0} maximumValue={1} step={0.01} value={musicVolume} onValueChange={handleMusicVolume} minimumTrackTintColor={accent} maximumTrackTintColor={isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'} thumbTintColor={accent} />
            </View>
            {/* Music category */}
            <View style={{ marginTop: 4, marginBottom: 4, opacity: experience.backgroundMusicEnabled ? 1 : 0.45, paddingHorizontal: 18 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: currentTheme.textSoft, marginBottom: 8 }}>{t('profile.styl_muzyki', 'STYL MUZYKI')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {MUSIC_CATEGORY_OPTIONS.map(opt => (
                  <Pressable key={opt.id} onPress={() => {
                    if (experience.backgroundMusicCategory === opt.id && experience.backgroundMusicEnabled) { setExperience({ backgroundMusicEnabled: false }); void AudioService.pauseBackgroundMusic(); }
                    else { setExperience({ backgroundMusicEnabled: true, backgroundMusicCategory: opt.id as any }); void AudioService.playBackgroundMusic(opt.id as any); }
                    HapticsService.selection();
                  }} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: (experience.backgroundMusicCategory === opt.id && experience.backgroundMusicEnabled) ? currentTheme.primary + '88' : currentTheme.borderLight, backgroundColor: (experience.backgroundMusicCategory === opt.id && experience.backgroundMusicEnabled) ? currentTheme.primary + '18' : 'transparent' }}>
                    <Text style={{ fontSize: 14 }}>{opt.emoji}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: (experience.backgroundMusicCategory === opt.id && experience.backgroundMusicEnabled) ? currentTheme.primary : currentTheme.textSoft }}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <ToggleRow icon={Waves} label={t('profile.ambient_rytualow', 'Ambient rytuałów')} value={ambientSoundEnabled} onToggle={() => { setAmbientSoundEnabled(!ambientSoundEnabled); }} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
            {/* Ambient volume */}
            <View style={{ paddingHorizontal: 18, paddingBottom: 8, opacity: ambientSoundEnabled ? 1 : 0.4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: currentTheme.textSoft }}>{t('profile.ambient_volume')}</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: accent }}>{Math.round(ambientVolume * 100)}%</Text>
              </View>
              <Slider style={{ width: '100%', height: 36 }} minimumValue={0} maximumValue={1} step={0.01} value={ambientVolume} onValueChange={handleAmbientVolume} minimumTrackTintColor={accent} maximumTrackTintColor={isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'} thumbTintColor={accent} />
            </View>
            {/* Soundscape */}
            <View style={{ marginTop: 4, marginBottom: 4, opacity: ambientSoundEnabled ? 1 : 0.45, paddingHorizontal: 18 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: currentTheme.textSoft, marginBottom: 8 }}>{t('profile.krajobraz_dzwiekowy', 'KRAJOBRAZ DŹWIĘKOWY')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {SOUNDSCAPE_OPTIONS.map(opt => (
                  <Pressable key={opt.id} onPress={() => {
                    if (experience.ambientSoundscape === opt.id && ambientSoundEnabled) { setAmbientSoundEnabled(false); void AudioService.pauseAmbientSound(); }
                    else { setAmbientSoundEnabled(true); setExperience({ ambientSoundscape: opt.id as any }); void AudioService.playAmbientSound(opt.id as any); }
                    HapticsService.selection();
                  }} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: (experience.ambientSoundscape === opt.id && ambientSoundEnabled) ? currentTheme.primary + '88' : currentTheme.borderLight, backgroundColor: (experience.ambientSoundscape === opt.id && ambientSoundEnabled) ? currentTheme.primary + '18' : 'transparent' }}>
                    <Text style={{ fontSize: 14 }}>{opt.emoji}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: (experience.ambientSoundscape === opt.id && ambientSoundEnabled) ? currentTheme.primary : currentTheme.textSoft }}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <ToggleRow icon={Sparkles} label={t('profile.dzwieki_dotyku', 'Dźwięki dotyku')} value={experience.touchSoundEnabled} onToggle={() => setExperience({ touchSoundEnabled: !experience.touchSoundEnabled })} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
            <ToggleRow icon={RotateCcw} label={t('profile.sygnal_domkniecia_rytualu', 'Sygnał domknięcia rytuału')} value={experience.ritualCompletionSoundEnabled} onToggle={() => setExperience({ ritualCompletionSoundEnabled: !experience.ritualCompletionSoundEnabled })} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
            <ToggleRow icon={Vibrate} label={t('profile.haptyka', 'Haptyka')} value={experience.hapticsEnabled} onToggle={() => setExperience({ hapticsEnabled: !experience.hapticsEnabled })} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
            {/* Test buttons */}
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 }}>
              <Pressable onPress={() => { HapticsService.impact('medium'); }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 14, borderWidth: 1, borderColor: currentTheme.primary + '44', backgroundColor: currentTheme.primary + '12' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: currentTheme.primary, letterSpacing: 0.5 }}>{tr('profile.testHaptics', 'TESTUJ HAPTYKĘ', 'TEST HAPTICS')}</Text>
              </Pressable>
              <Pressable onPress={() => { void AudioService.playRitualCompletionTone(); }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 14, borderWidth: 1, borderColor: currentTheme.primary + '44', backgroundColor: currentTheme.primary + '12' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: currentTheme.primary, letterSpacing: 0.5 }}>{tr('profile.testSound', 'TESTUJ DŹWIĘK', 'TEST SOUND')}</Text>
              </Pressable>
            </View>
            {/* Voice */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: currentTheme.borderLight }}>
              <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: accent, marginBottom: 4, marginTop: 12 }}>{tr('profile.voiceHeading', 'GŁOS LEKTORA', 'VOICE GUIDE')}</Text>
              <Text style={{ fontSize: 10, color: rowSubColor, marginBottom: 10 }}>{t('profile.azure_neural_tts_naturalny_ludzki', 'Azure Neural TTS — naturalny ludzki głos')}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {[{ id: 'nova', label: '🎙 Zofia', sub: 'Damski · Neural' }, { id: 'onyx', label: '🎙 Marek', sub: 'Męski · Neural' }].map((opt) => {
                  const active = (experience.narratorVoice ?? 'nova') === opt.id;
                  return (
                    <Pressable key={opt.id} onPress={() => { setExperience({ narratorVoice: opt.id as any }); TTSService.setVoice(opt.id as any); HapticsService.selection(); }} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, borderColor: active ? accent + 'AA' : currentTheme.borderLight, backgroundColor: active ? accent + '18' : 'transparent', alignItems: 'center', gap: 3 }}>
                      <Text style={{ fontSize: 15 }}>{opt.label.split(' ')[0]}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? accent : rowTextColor }}>{opt.label.split(' ').slice(1).join(' ')}</Text>
                      <Text style={{ fontSize: 10, color: rowSubColor }}>{opt.sub}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable onPress={() => { const voice = experience.narratorVoice ?? 'nova'; TTSService.setVoice(voice); void TTSService.speak('Witaj w Aetherze. Jestem Twoim duchowym przewodnikiem.', undefined, undefined, voice); HapticsService.impact('light'); }} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 14, borderWidth: 1, borderColor: accent + '44', backgroundColor: accent + '0E' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: accent, letterSpacing: 0.5 }}>{t('profile.posluchaj_probki', '▶ POSŁUCHAJ PRÓBKI')}</Text>
              </Pressable>
            </View>
            {/* Text scale */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: currentTheme.borderLight }}>
              <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: accent, marginBottom: 10, marginTop: 12 }}>{tr('profile.textSizeHeading', 'ROZMIAR TEKSTU', 'TEXT SIZE')}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[{ id: 0.85, label: 'A-', sub: 'Mały' }, { id: 1.0, label: 'A', sub: 'Standardowy' }, { id: 1.15, label: 'A+', sub: 'Duży' }].map((opt) => {
                  const active = (experience.textScale ?? 1.0) === opt.id;
                  return (
                    <Pressable key={opt.id} onPress={() => { setExperience({ textScale: opt.id }); HapticsService.selection(); }} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: active ? accent + 'AA' : currentTheme.borderLight, backgroundColor: active ? accent + '18' : 'transparent', alignItems: 'center', gap: 2 }}>
                      <Text style={{ fontSize: active ? 17 : 14, fontWeight: '700', color: active ? accent : rowTextColor }}>{opt.label}</Text>
                      <Text style={{ fontSize: 9, color: rowSubColor, letterSpacing: 0.4 }}>{opt.sub.toUpperCase()}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <EntryRow icon={SlidersHorizontal} label={t('profile.tryb_ruchu_1', 'Tryb ruchu')} value={MOTION_OPTIONS.find(m => m.id === experience.motionStyle)?.label || 'Wywazone'} onPress={() => setShowMotionModal(true)} accent={accent} last textColor={rowTextColor} subColor={rowSubColor} />
          </PremiumCard>

          {/* ── 4. MOTYW & WYGLĄD ── */}
          <SectionHeader icon={Palette} label={t('profile.motyw_i_wyglad', 'Motyw i wygląd')} color={accent} delay={280} />
          {/* Display mode */}
          <PremiumCard accent={accent} isLight={isLight} delay={290} style={{ marginBottom: 12 }}>
            <View style={{ padding: 16 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.6, color: accent, marginBottom: 12 }}>{t('profile.tryb_wyswietlan', 'TRYB WYŚWIETLANIA')}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {([{ id: 'auto' as ThemeMode, label: 'Auto', Icon: RotateCcw }, { id: 'light' as ThemeMode, label: 'Jasny', Icon: Sun }, { id: 'dark' as ThemeMode, label: 'Ciemny', Icon: Moon }]).map(({ id, label, Icon }) => {
                  const active = themeMode === id;
                  return (
                    <Pressable key={id} onPress={() => { setThemeMode(id); HapticsService.selection(); }} style={{ flex: 1, paddingVertical: 11, borderRadius: 16, alignItems: 'center', gap: 5, borderWidth: 1, backgroundColor: active ? accent + '1E' : 'transparent', borderColor: active ? accent + '66' : (isLight ? 'rgba(0,0,0,0.11)' : 'rgba(255,255,255,0.11)') }}>
                      <Icon color={active ? accent : rowSubColor} size={17} strokeWidth={active ? 2.2 : 1.6} />
                      <Text style={{ fontSize: 11, fontWeight: active ? '700' : '500', color: active ? accent : rowSubColor }}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </PremiumCard>

          {/* Theme grid */}
          <Animated.View entering={FadeInDown.delay(310).duration(500)} style={{ marginHorizontal: 18, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.8, color: rowSubColor }}>{t('profile.motyw_stylu', 'MOTYW STYLU')}</Text>
              {themeMode === 'auto' && <Text style={{ fontSize: 10, color: accent, fontWeight: '600' }}>{t('profile.tryb_auto_aktywny', 'Tryb auto aktywny')}</Text>}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {THEMES_LIST.map((themeId) => {
                const opt = THEME_OPTIONS.find(t => t.id === themeId);
                const resolved = getResolvedTheme(themeId);
                const active = themeName === themeId;
                const cardW = Math.floor((SW - 36 - 10) / 2);
                return (
                  <Pressable key={themeId} onPress={() => { setTheme(themeId); HapticsService.selection(); }} style={{ width: cardW, borderRadius: 22, overflow: 'hidden', borderWidth: active ? 2 : 1, borderColor: active ? resolved.primary : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'), shadowColor: active ? resolved.primary : '#000', shadowOpacity: active ? 0.40 : 0.06, shadowRadius: active ? 18 : 8, shadowOffset: { width: 0, height: 4 }, elevation: active ? 10 : 2 }}>
                    <LinearGradient colors={resolved.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 100, padding: 12 }}>
                      <LinearGradient colors={['transparent', resolved.primary + '88', 'transparent'] as [string,string,string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }} pointerEvents="none" />
                      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: active ? resolved.primary : resolved.primary + '55', alignItems: 'center', justifyContent: 'center', shadowColor: resolved.primary, shadowOpacity: 0.6, shadowRadius: 8, elevation: 4 }}>
                        {active ? <Check color={resolved.background} size={13} strokeWidth={3} /> : <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: resolved.primary + 'BB' }} />}
                      </View>
                      <View style={{ position: 'absolute', bottom: 10, right: 12, flexDirection: 'row', gap: 4 }}>
                        {[resolved.primary, resolved.secondary, resolved.primaryLight || resolved.backgroundElevated].map((c, ci) => (
                          <View key={ci} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.20)' }} />
                        ))}
                      </View>
                    </LinearGradient>
                    <View style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(12,10,20,0.96)', borderTopWidth: 1, borderTopColor: active ? resolved.primary + '44' : (isLight ? 'rgba(255,246,230,0.92)' : 'rgba(255,255,255,0.06)') }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: active ? resolved.primary : rowTextColor, letterSpacing: -0.1, marginBottom: 2 }} numberOfLines={1}>{opt?.label || themeId}</Text>
                      <Text style={{ fontSize: 10, color: rowSubColor, lineHeight: 14 }} numberOfLines={1}>{opt?.sub || ''}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          <PremiumCard accent={accent} isLight={isLight} delay={330}>
            <EntryRow icon={Eye} label={t('profile.tlo_sanktuariu_1', 'Tło sanktuarium')} value={BACKGROUND_OPTIONS.find(b => b.id === experience.backgroundStyle)?.label || 'Subtelne niebo'} onPress={() => setShowBgModal(true)} accent={accent} last textColor={rowTextColor} subColor={rowSubColor} />
          </PremiumCard>

          {/* ── 5. APLIKACJA ── */}
          <SectionHeader icon={Settings2} label={t('profile.aplikacja', 'Aplikacja')} color={accent} delay={360} />
          <PremiumCard accent={accent} isLight={isLight} delay={370}>
            {/* AI response length */}
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.8, color: accent, marginBottom: 12 }}>{t('profile.styl_odpowiedzi_ai', 'STYL ODPOWIEDZI AI')}</Text>
              {([
                { val: 'short', label: 'Krótko i konkretnie', desc: 'Zwięzłe, szybki wgląd' },
                { val: 'medium', label: 'Wyważone', desc: 'Balans głębi i skrótowości' },
                { val: 'deep', label: 'Głęboko i szczegółowo', desc: 'Pełne interpretacje z kontekstem' },
              ] as const).map((opt) => {
                const isAct = (experience.aiResponseLength ?? 'medium') === opt.val;
                return (
                  <Pressable key={opt.val} onPress={() => setExperience({ aiResponseLength: opt.val })} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8, borderColor: isAct ? accent : accent + '22', backgroundColor: isAct ? accent + '12' : 'transparent' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 2, color: isAct ? accent : rowTextColor }}>{opt.label}</Text>
                      <Text style={{ fontSize: 12, color: rowSubColor }}>{opt.desc}</Text>
                    </View>
                    {isAct && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} />}
                  </Pressable>
                );
              })}
            </View>
          </PremiumCard>

          {/* ── 6. KONTO ── */}
          <SectionHeader icon={Shield} label={t('profile.konto', 'Konto')} color={accent} delay={400} />
          <PremiumCard accent={accent} isLight={isLight} delay={410}>
            <EntryRow icon={HelpCircle} label={t('profile.przewodnik_po_aetherze_1', 'Przewodnik po Aetherze')} value="Jak korzystać" onPress={() => setShowGuideModal(true)} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
            <EntryRow icon={BarChart2} label={t('profile.raport_duszy', 'Raport duszy')} value="Wzory i podsumowania" onPress={() => navigation.navigate('Reports')} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
            <EntryRow icon={Star} label={t('profile.ulubione_wglady', 'Ulubione wglądy')} value={favoriteEntries === 0 ? 'Nic jeszcze nie zapisano' : `${favoriteEntries} zapisanych`} onPress={() => navigation.navigate('Journal')} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
            <EntryRow icon={BookOpen} label={t('profile.biblioteka_wiedzy', 'Biblioteka wiedzy')} value="Symbole i święta tradycja" onPress={() => navigation.navigate('Knowledge')} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
            <EntryRow icon={ScrollText} label={t('profile.kolejny_krok', 'Kolejny krok')} value="Zapisz kierunek" onPress={() => navigation.navigate('JournalEntry', { prompt: 'Jaki jest teraz mój najlepszy następny krok w Aetherze i czego naprawdę potrzebuję: ukojenia, wglądu, rytuału czy działania?', type: 'reflection' })} accent={accent} last textColor={rowTextColor} subColor={rowSubColor} />
          </PremiumCard>

          {/* ── WYLOGUJ ── */}
          <LogoutButton accent={accent} isLight={isLight} />

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>

      {/* ══ MODALS ══ */}

      {/* Tło */}
      <BottomModal visible={showBgModal} onClose={() => setShowBgModal(false)} title={t('profile.tlo_sanktuariu', 'Tło sanktuarium')} accent={accent}>
        {BACKGROUND_OPTIONS.map(opt => {
          const active = experience.backgroundStyle === opt.id;
          return (
            <Pressable key={opt.id} onPress={() => { setExperience({ backgroundStyle: opt.id }); setShowBgModal(false); }} style={[pStyles.modalOption, active && { borderColor: accent + '66', backgroundColor: accent + '10' }]}>
              <Text style={[pStyles.modalOptionLabel, { flex: 1 }, active && { color: accent }]}>{opt.label}</Text>
              {active && <Check color={accent} size={18} />}
            </Pressable>
          );
        })}
      </BottomModal>

      {/* Tryb ruchu */}
      <BottomModal visible={showMotionModal} onClose={() => setShowMotionModal(false)} title={t('profile.tryb_ruchu', 'Tryb ruchu')} accent={accent}>
        {MOTION_OPTIONS.map(opt => {
          const active = experience.motionStyle === opt.id;
          return (
            <Pressable key={opt.id} onPress={() => { setExperience({ motionStyle: opt.id as any }); setShowMotionModal(false); }} style={[pStyles.modalOption, active && { borderColor: accent + '66', backgroundColor: accent + '10' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[pStyles.modalOptionLabel, active && { color: accent }]}>{opt.label}</Text>
                <Text style={pStyles.modalOptionSub}>{opt.sub}</Text>
              </View>
              {active && <Check color={accent} size={18} />}
            </Pressable>
          );
        })}
      </BottomModal>

      {/* Język */}
      <BottomModal visible={showLanguageModal} onClose={() => setShowLanguageModal(false)} title={t('profile.jezyk', 'Język')} accent={accent}>
        {LANGUAGE_OPTIONS.map(opt => {
          const active = language === opt.id;
          return (
            <Pressable key={opt.id} onPress={() => { setLanguage(opt.id); setShowLanguageModal(false); }} style={[pStyles.modalOption, active && { borderColor: accent + '66', backgroundColor: accent + '10' }]}>
              <Text style={[pStyles.modalOptionLabel, { flex: 1 }, active && { color: accent }]}>{opt.native}</Text>
              {active && <Check color={accent} size={18} />}
            </Pressable>
          );
        })}
      </BottomModal>

      {/* Guidance */}
      <BottomModal visible={showGuidanceModal} onClose={() => setShowGuidanceModal(false)} title={t('profile.nurt_guidance', 'Nurt guidance')} accent={accent}>
        {GUIDANCE_OPTIONS.map(opt => {
          const active = userData.primaryGuidanceMode === opt.id;
          return (
            <Pressable key={opt.id} onPress={() => { setUserData({ primaryGuidanceMode: opt.id as any }); setShowGuidanceModal(false); }} style={[pStyles.modalOption, active && { borderColor: accent + '66', backgroundColor: accent + '10' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[pStyles.modalOptionLabel, active && { color: accent }]}>{opt.label}</Text>
                <Text style={pStyles.modalOptionSub}>{opt.sub}</Text>
              </View>
              {active && <Check color={accent} size={18} />}
            </Pressable>
          );
        })}
      </BottomModal>

      {/* Talia tarota */}
      <BottomModal visible={showTarotDeckModal} onClose={() => setShowTarotDeckModal(false)} title={t('profile.talia_tarota', 'Talia tarota')} accent={accent}>
        {TAROT_DECKS.map(deck => {
          const active = selectedDeckId === deck.id;
          return (
            <Pressable key={deck.id} onPress={() => { setSelectedDeck(deck.id); setShowTarotDeckModal(false); }} style={[pStyles.modalOption, active && { borderColor: accent + '66', backgroundColor: accent + '10' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[pStyles.modalOptionLabel, active && { color: accent }]}>{deck.name}</Text>
                {deck.description ? <Text style={pStyles.modalOptionSub} numberOfLines={1}>{deck.description}</Text> : null}
              </View>
              {active && <Check color={accent} size={18} />}
            </Pressable>
          );
        })}
      </BottomModal>

      {/* Avatar */}
      <BottomModal visible={showAvatarModal} onClose={() => setShowAvatarModal(false)} title={t('profile.portret_sanktuariu', 'Portret sanktuarium')} accent={accent}>
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <ProfileAvatar uri={userData.avatarUri} name={firstName} fallbackText={firstName.charAt(0).toUpperCase()} size={90} primary={accent} borderColor={accent + '44'} backgroundColor={isLight ? '#FFF8EE' : '#1A2236'} textColor={accent} />
        </View>
        <Pressable onPress={handlePickAvatar} disabled={avatarBusy} style={[pStyles.modalOption, { borderColor: accent + '44', backgroundColor: accent + '10' }]}>
          <ImagePlus color={accent} size={18} strokeWidth={1.8} />
          <Text style={[pStyles.modalOptionLabel, { flex: 1, marginLeft: 14, color: accent }]}>{hasAvatar ? 'Zmień zdjęcie' : 'Wybierz zdjęcie'}</Text>
        </Pressable>
        {hasAvatar && (
          <Pressable onPress={handleRemoveAvatar} style={[pStyles.modalOption, { borderColor: 'rgba(200,100,90,0.3)', backgroundColor: 'rgba(200,100,90,0.06)' }]}>
            <Text style={[pStyles.modalOptionLabel, { flex: 1, color: '#C66961' }]}>{t('profile.usun_portret', 'Usuń portret')}</Text>
          </Pressable>
        )}
      </BottomModal>

      {/* Przewodnik */}
      <BottomModal visible={showGuideModal} onClose={() => setShowGuideModal(false)} title={t('profile.przewodnik_po_aetherze', 'Przewodnik po Aetherze')} accent={accent}>
        <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16 }}>
          {[
            {
              emoji: '🏠', title: 'Portal — centrum dnia',
              body: 'Główna scena Twojego sanktuarium. Zawiera widget astralny, horoskop dnia, afirmację, kartę tarota i szybkie akcje. Personalizuj widżety przeciągając je.'
            },
            {
              emoji: '🌍', title: 'Światy — osiem domen',
              body: 'Tarot · Horoskop · Astrologia · Rytuały · Oczyszczanie · Wsparcie · Oracle · Sny. Każdy świat to oddzielna przestrzeń z własnymi narzędziami i energią.'
            },
            {
              emoji: '🔮', title: 'Oracle — AI prowadzący',
              body: 'Twój duchowy asystent oparty na AI. Zadaj pytanie, wybierz kontekst — Oracle odpowie z głębią i symboliką dostosowaną do Twojego profilu.'
            },
            {
              emoji: '🃏', title: 'Tarot i Wróżka',
              body: 'Karta dnia jest losowana deterministycznie — ta sama na dany dzień dla zachowania rytmu. Wróżka to pełna ceremonia z rozkładem kart i interpretacją AI.'
            },
            {
              emoji: '⭐', title: 'Horoskop i Astrologia',
              body: 'Horoskop zmienia się każdego dnia. W sekcji Astrologia znajdziesz tranzyty planet, biorytmy, numerologię i matrycę karmiczną opartą na Twojej dacie urodzenia.'
            },
            {
              emoji: '🕯', title: 'Rytuały i Oczyszczanie',
              body: 'Biblioteka 15+ praktyk ceremonialnych. Rytuał dnia jest dopasowany do aktualnej fazy księżyca i Twojej energii. Oczyszczanie to oddech, listy i uwolnienie.'
            },
            {
              emoji: '📔', title: 'Dziennik i Wspomnienia',
              body: 'Zapisuj sny, refleksje i odczyty. Zakładka Profil → Ulubione wglądy zestawia to, co oznaczyłeś gwiazdką. Wpisy budują Twój duchowy archiwum.'
            },
            {
              emoji: '⚙️', title: 'Ustawienia Profilu',
              body: 'Zmień motyw, język, talię tarota, głos lektora i dźwięki. Data urodzenia zasila astrologię — warto ją uzupełnić dla pełniejszych wskazówek.'
            },
          ].map((item, i) => (
            <View key={i} style={{
              marginBottom: 16, padding: 16, borderRadius: 18, borderWidth: 1,
              borderColor: accent + '28', backgroundColor: isLight ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.04)',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: accent, flex: 1 }}>{item.title}</Text>
              </View>
              <Text style={{ fontSize: 13, lineHeight: 20, color: isLight ? '#4A3520' : 'rgba(245,241,234,0.78)' }}>{item.body}</Text>
            </View>
          ))}
        </View>
      </BottomModal>

    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────
const pStyles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  particlesLayer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },

  heroGradientBg: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },

  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },

  // Entry rows
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, minHeight: 62 },
  entryRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(169,122,57,0.08)' },
  entryIcon: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  entryText: { flex: 1, marginLeft: 14 },
  entryLabel: { fontSize: 14, fontWeight: '500', letterSpacing: -0.1 },
  entryValue: { fontSize: 13, marginTop: 2, opacity: 0.92 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, borderWidth: 1, marginRight: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' },
  modalSheet: {
    backgroundColor: '#FAF6EE',
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    paddingHorizontal: 22, paddingTop: 12,
    maxHeight: '85%',
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 32, shadowOffset: { width: 0, height: -10 },
  },
  modalHandle: { width: 42, height: 4, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.12)', alignSelf: 'center', marginBottom: 16 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1410', letterSpacing: -0.2 },
  modalOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(169,122,57,0.15)',
    backgroundColor: 'rgba(255,255,255,0.82)',
    marginBottom: 10,
  },
  modalOptionLabel: { fontSize: 15, fontWeight: '500', color: '#1A1410' },
  modalOptionSub: { fontSize: 12, color: '#8A7060', marginTop: 3 },
});
