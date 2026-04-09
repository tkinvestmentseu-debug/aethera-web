// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import i18n from '../core/i18n';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  ActivityIndicator, Share, Dimensions, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
  BookOpen, ChevronRight, Compass, Eye, EyeOff,
  Flame, Heart, Layers, Moon, MoonStar, Sparkles, Star, Sun, Waves, Wind, X,
  Zap, Clock, CheckCircle2, Settings, Wand2, Globe2, Crown,
  Droplets, Brain, Feather, Music, Leaf, Cpu, Coffee,
  Gem, Music2, CalendarDays, Target, Calendar, Users, CheckSquare2, Search,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeInUp,
  useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withTiming, withSpring, Easing, interpolate,
} from 'react-native-reanimated';
import { useAppStore, GratitudeEntry } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { useTarotStore } from '../features/tarot/store/useTarotStore';
import { usePremiumStore } from '../store/usePremiumStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts, shadows } from '../core/theme/designSystem';
import { SoulEngineService } from '../core/services/soulEngine.service';
import { getDailyAffirmation, CATEGORY_COLORS, CATEGORY_LABELS } from '../features/portal/affirmations';
import { FavoriteItem, PortalWidget, WIDGET_META, WidgetId } from '../features/portal/types';
import { resolveUserFacingText } from '../core/utils/contentResolver';
import { HapticsService } from '../core/services/haptics.service';
import { generateDailyContent, isTodayContentFresh } from '../core/services/dailyContent.service';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Ellipse, Line, Path, Defs, RadialGradient, Stop, G, Rect } from 'react-native-svg';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { useTheme } from '../core/hooks/useTheme';

// ── Animated widget glow wrapper ──────────────────────────────
const AnimatedWidgetGlow = React.memo(({ color, children, style }: { color: string; children: React.ReactNode; style?: any }) => {
  const glow = useSharedValue(0.5);
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glow.value, [0, 1], [0.12, 0.55]),
    shadowRadius: interpolate(glow.value, [0, 1], [10, 26]),
  }));
  return (
    <Animated.View style={[{ borderRadius: 20, shadowColor: color, shadowOffset: { width: 0, height: 6 }, elevation: 14 }, glowStyle, style]}>
      {children}
    </Animated.View>
  );
});

// ── Shimmer bar ───────────────────────────────────────────────
const ShimmerBar = React.memo(({ colors }: { colors: [string, string, string] }) => {
  const shimX = useSharedValue(-1);
  useEffect(() => {
    shimX.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 0 }),
        withTiming(-1, { duration: 1800 }),
      ), -1, false,
    );
  }, []);
  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimX.value, [-1, 1], [-100, 100]) }],
  }));
  return (
    <View style={{ height: 3, overflow: 'hidden' }}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3 }} />
      <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, width: 60, backgroundColor: 'rgba(255,255,255,0.5)' }, barStyle]} />
    </View>
  );
});

// ── Glass widget card wrapper ─────────────────────────────────
const GlassWidgetCard = React.memo(({
  children, accentColor, isLight, style, onPress,
}: {
  children: React.ReactNode; accentColor: string; isLight: boolean; style?: any; onPress?: () => void;
}) => {
  const inner = (
    <BlurView
      intensity={isLight ? 52 : 32}
      tint={isLight ? 'light' : 'dark'}
      style={[{
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isLight ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.10)',
      }, style]}
    >
      <View style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.04)', borderRadius: 20 }}>
        {/* Top highlight edge */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: 'rgba(255,255,255,0.28)' }} pointerEvents="none" />
        {/* Accent top glow */}
        <LinearGradient
          colors={[accentColor + '18', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 44, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
          pointerEvents="none"
        />
        <View style={{ padding: 16 }}>
          {children}
        </View>
      </View>
    </BlurView>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[gwc.outer, { shadowColor: accentColor }]}>
        {inner}
      </Pressable>
    );
  }
  return <View style={[gwc.outer, { shadowColor: accentColor }]}>{inner}</View>;
});

const gwc = StyleSheet.create({
  outer: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10,
  },
});

// ── Pulsing number badge ──────────────────────────────────────
const PulsingNumber = React.memo(({ num, color }: { num: number; color: string }) => {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.95, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    );
  }, [num]);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[{ width: 56, height: 56, borderRadius: 20, backgroundColor: color + '22', borderWidth: 2, borderColor: color + '55', alignItems: 'center', justifyContent: 'center' }, s]}>
      <Text style={{ fontSize: 32, fontWeight: '900', color, letterSpacing: -2 }}>{num}</Text>
    </Animated.View>
  );
});

const { width: SW, height: SH } = Dimensions.get('window');
const ACCENT_DEFAULT = '#CEAE72';
const SP = layout.padding.screen; // 22

// ── Passive widget IDs (info-only, no navigation) ─────────────────────────────
const PASSIVE_IDS: string[] = ['energy', 'streak', 'archetype'];

// ─────────────────────────────────────────────────────────────────────────────
// AetherEye 3D interactive hero widget
// ─────────────────────────────────────────────────────────────────────────────
const AetherEye = React.memo(({ accent, isLight }: { accent: string; isLight: boolean }) => {
  const { t } = useTranslation();

  const irisRot     = useSharedValue(0);
  const irisRot2    = useSharedValue(0);
  const glowOpacity = useSharedValue(0.55);
  const rayOpacity  = useSharedValue(0.35);
  const shimmerX    = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    irisRot.value     = withRepeat(withTiming(360,  { duration: 18000, easing: Easing.linear }), -1, false);
    irisRot2.value    = withRepeat(withTiming(-360, { duration: 26000, easing: Easing.linear }), -1, false);
    glowOpacity.value = withRepeat(withSequence(withTiming(1.0, { duration: 3200 }), withTiming(0.32, { duration: 3200 })), -1, true);
    rayOpacity.value  = withRepeat(withSequence(withTiming(0.90, { duration: 2100 }), withTiming(0.10, { duration: 2100 })), -1, true);
    shimmerX.value    = withRepeat(withSequence(withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.sin) })), -1, true);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-22, Math.min(22, e.translationY * 0.13));
      tiltY.value = Math.max(-28, Math.min(28, e.translationX * 0.16));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 1000 });
      tiltY.value = withTiming(0, { duration: 1000 });
    });

  const tiltStyle  = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }],
  }));
  const glowStyle  = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const raysStyle  = useAnimatedStyle(() => ({ opacity: rayOpacity.value }));
  const irisStyle  = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${irisRot.value}deg` }] }));
  const iris2Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${irisRot2.value}deg` }] }));

  const H   = 230;
  const EX  = SW / 2;
  const EY  = 108;
  const EW  = 170;
  const EH  = 64;
  const IR  = 48;

  const eyePath = `M ${EX - EW},${EY} Q ${EX},${EY - EH} ${EX + EW},${EY} Q ${EX},${EY + EH} ${EX - EW},${EY} Z`;
  const irisSz  = IR * 2 + 6;
  const cc      = IR + 3;

  const irisSegs = Array.from({ length: 14 }, (_, i) => {
    const r = IR - 7;
    const a1 = (i / 14) * Math.PI * 2;
    const a2 = ((i + 0.65) / 14) * Math.PI * 2;
    return {
      d: `M ${cc + r * Math.cos(a1)},${cc + r * Math.sin(a1)} A ${r} ${r} 0 0 1 ${cc + r * Math.cos(a2)},${cc + r * Math.sin(a2)}`,
      color: i % 2 === 0 ? '#A78BFA' : accent,
      w: 2.8,
    };
  });

  const innerSegs = Array.from({ length: 10 }, (_, i) => {
    const r = IR - 18;
    const a1 = (i / 10) * Math.PI * 2;
    const a2 = ((i + 0.5) / 10) * Math.PI * 2;
    return {
      d: `M ${cc + r * Math.cos(a1)},${cc + r * Math.sin(a1)} A ${r} ${r} 0 0 1 ${cc + r * Math.cos(a2)},${cc + r * Math.sin(a2)}`,
    };
  });

  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const long = i % 2 === 0;
    return {
      x1: EX + (IR + 4)  * Math.cos(a), y1: EY + (IR + 4)  * Math.sin(a),
      x2: EX + (IR + (long ? 28 : 16)) * Math.cos(a), y2: EY + (IR + (long ? 28 : 16)) * Math.sin(a),
      w: long ? 1.8 : 1.2,
    };
  });

  const particles = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const bound = (EW * EH) / Math.sqrt(Math.pow(EH * ca, 2) + Math.pow(EW * sa, 2));
    const r = bound * 0.82;
    return { cx: EX + r * ca, cy: EY + r * sa, r: i % 4 === 0 ? 2.8 : (i % 2 === 0 ? 1.8 : 1.2) };
  });

  const lashes = Array.from({ length: 14 }, (_, i) => {
    const t   = (i + 0.5) / 14;
    const ex  = EX - EW + t * 2 * EW;
    const ey  = EY - 4 * EH * t * (1 - t);
    const ang = -Math.PI / 2 - (t - 0.5) * 1.1;
    const len = 7 + 6 * Math.sin(t * Math.PI);
    const w   = 0.9 + 0.8 * Math.sin(t * Math.PI);
    return { x1: ex, y1: ey, x2: ex + len * Math.cos(ang), y2: ey + len * Math.sin(ang), w };
  });

  const lowerLashes = Array.from({ length: 6 }, (_, i) => {
    const t   = (i + 1) / 8;
    const ex  = EX - EW * 0.7 + t * 2 * EW * 0.7;
    const ey  = EY + 3.5 * EH * t * (1 - t);
    const ang = Math.PI / 2 + (t - 0.5) * 0.7;
    const len = 3 + 2 * Math.sin(t * Math.PI);
    return { x1: ex, y1: ey, x2: ex + len * Math.cos(ang), y2: ey + len * Math.sin(ang) };
  });

  const eyeFill  = isLight ? '#F2E8D8' : '#0A0415';
  const irisBase = isLight ? '#2D1B5E' : '#0F0325';

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ height: H, width: '100%' }, tiltStyle]}>
        {/* Outer ambient glow */}
        <Animated.View style={[StyleSheet.absoluteFill, glowStyle]} pointerEvents="none">
          <Svg width={SW} height={H}>
            <Defs>
              <RadialGradient id="outerGlow" cx="50%" cy={`${(EY / H) * 100}%`} r="55%">
                <Stop offset="0%"   stopColor="#A78BFA" stopOpacity={0.40} />
                <Stop offset="40%"  stopColor={accent}  stopOpacity={0.18} />
                <Stop offset="100%" stopColor="#4C1D95" stopOpacity={0}    />
              </RadialGradient>
              <RadialGradient id="innerGlow" cx="50%" cy={`${(EY / H) * 100}%`} r="22%">
                <Stop offset="0%"   stopColor="#DDD6FE" stopOpacity={0.55} />
                <Stop offset="100%" stopColor="#A78BFA" stopOpacity={0}    />
              </RadialGradient>
            </Defs>
            <Ellipse cx={EX} cy={EY} rx={EW + 70} ry={EH + 80} fill="url(#outerGlow)" />
            <Ellipse cx={EX} cy={EY} rx={IR + 20}  ry={IR + 20}  fill="url(#innerGlow)" />
          </Svg>
        </Animated.View>

        {/* Base static SVG layer */}
        <Svg width={SW} height={H} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="irisFill" cx="45%" cy="40%" r="65%">
              <Stop offset="0%"   stopColor="#C4B5FD" stopOpacity={0.90} />
              <Stop offset="50%"  stopColor="#7C3AED" stopOpacity={0.80} />
              <Stop offset="100%" stopColor="#1E0640" stopOpacity={1}    />
            </RadialGradient>
            <RadialGradient id="eyeSclera" cx="30%" cy="35%" r="80%">
              <Stop offset="0%"   stopColor={isLight ? '#FFFFFF' : '#E8DFF5'} stopOpacity={isLight ? 0.95 : 0.65} />
              <Stop offset="60%"  stopColor={eyeFill} stopOpacity={1} />
              <Stop offset="100%" stopColor={isLight ? '#E8D8C0' : '#060118'} stopOpacity={1} />
            </RadialGradient>
          </Defs>
          <Path d={eyePath} fill="url(#eyeSclera)" />
          <Circle cx={EX} cy={EY} r={IR} fill={irisBase} />
          <Circle cx={EX} cy={EY} r={IR} fill="url(#irisFill)" />
          <Circle cx={EX} cy={EY} r={IR - 12} fill="none" stroke={accent + 'AA'} strokeWidth={1.2} />
          {particles.map((p, i) => (
            <Circle key={i} cx={p.cx} cy={p.cy} r={p.r}
              fill={i % 3 === 0 ? '#DDD6FE' : accent}
              opacity={0.45 + (i % 5) * 0.11}
            />
          ))}
          <Path d={eyePath} fill="none" stroke={accent + '88'} strokeWidth={2.2} />
          <Path d={eyePath} fill="none" stroke={accent + '33'} strokeWidth={4.0} />
          {lashes.map((l, i) => (
            <Line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={isLight ? '#3D1C6E' : accent + 'CC'} strokeWidth={l.w} strokeLinecap="round" />
          ))}
          {lowerLashes.map((l, i) => (
            <Line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={accent + '66'} strokeWidth={0.8} strokeLinecap="round" />
          ))}
          <Ellipse cx={EX - 30} cy={EY - EH * 0.35} rx={50} ry={8}
            fill="rgba(255,255,255,0.14)" />
        </Svg>

        {/* Outer rotating iris ring */}
        <Animated.View
          style={[{ position: 'absolute', left: EX - IR - 3, top: EY - IR - 3, width: irisSz, height: irisSz }, irisStyle]}
          pointerEvents="none"
        >
          <Svg width={irisSz} height={irisSz}>
            {irisSegs.map((seg, i) => (
              <Path key={i} d={seg.d} stroke={seg.color} strokeWidth={seg.w} fill="none" strokeLinecap="round" />
            ))}
          </Svg>
        </Animated.View>

        {/* Inner counter-rotating ring */}
        <Animated.View
          style={[{ position: 'absolute', left: EX - IR - 3, top: EY - IR - 3, width: irisSz, height: irisSz }, iris2Style]}
          pointerEvents="none"
        >
          <Svg width={irisSz} height={irisSz}>
            {innerSegs.map((seg, i) => (
              <Path key={i} d={seg.d} stroke={accent + 'BB'} strokeWidth={1.5} fill="none" strokeLinecap="round" />
            ))}
          </Svg>
        </Animated.View>

        {/* Pulsing rays */}
        <Animated.View style={[StyleSheet.absoluteFill, raysStyle]} pointerEvents="none">
          <Svg width={SW} height={H}>
            {rays.map((r, i) => (
              <Line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
                stroke={i % 3 === 0 ? '#DDD6FE' : (i % 3 === 1 ? '#A78BFA' : accent)}
                strokeWidth={r.w} strokeLinecap="round"
              />
            ))}
          </Svg>
        </Animated.View>

        {/* Pupil + specular highlights */}
        <Svg style={StyleSheet.absoluteFill} width={SW} height={H} pointerEvents="none">
          <Circle cx={EX} cy={EY} r={15} fill="#030108" />
          <Circle cx={EX} cy={EY} r={12} fill="#0A0220" />
          <Ellipse cx={EX - 6} cy={EY - 7} rx={5} ry={3.5} fill="rgba(255,255,255,0.82)" />
          <Circle cx={EX + 5} cy={EY + 5} r={2} fill="rgba(196,181,253,0.60)" />
          <Circle cx={EX} cy={EY} r={15} fill="none" stroke="rgba(167,139,250,0.30)" strokeWidth={1.5} />
        </Svg>

        {/* Brand text */}
        <View style={{ position: 'absolute', bottom: 8, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ fontSize: 15, fontWeight: '900', letterSpacing: 5.5, color: accent }}>{t('portal.aethera', '✦ AETHERA ✦')}</Text>
          <Text style={{ fontSize: 10, letterSpacing: 2, color: accent, opacity: 0.55, marginTop: 4 }}>{t('portal.twoj_mistyczny_portal', 'Twój mistyczny portal')}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Star particle background
// ─────────────────────────────────────────────────────────────────────────────
const STAR_POSITIONS = Array.from({ length: 22 }, (_, i) => ({
  x: Math.random() * SW,
  y: Math.random() * SH * 0.7,
  size: 8 + Math.random() * 10,
  delay: i * 280,
  duration: 4000 + Math.random() * 5000,
  drift: 12 + Math.random() * 24,
}));

const StarParticle = React.memo(({ x, y, size, delay, duration, drift }: typeof STAR_POSITIONS[0]) => {
  const opacity = useSharedValue(0.05);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: duration * 0.5 }),
        withTiming(0.08, { duration: duration * 0.5 }),
      ),
      -1, false
    );
    translateY.value = withRepeat(
      withSequence(
        withTiming(-drift, { duration }),
        withTiming(0, { duration }),
      ),
      -1, false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text style={[{ position: 'absolute', left: x, top: y, fontSize: size, color: ACCENT_DEFAULT }, style]}>
      ✦
    </Animated.Text>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Favorite tile component
// ─────────────────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Star, Moon, Sparkles, Heart, BookOpen, Flame, Zap, Eye, EyeOff, Sun,
  Compass, Clock, CheckCircle2, Waves, Wind, Layers, MoonStar, Droplets,
  Globe2, Brain, Feather, Music, Leaf, Cpu, Coffee, Wand2,
  Gem, Music2, CalendarDays, Target, Calendar, Users, CheckSquare2,
};

const FavTile = React.memo(({ item, onPress, onRemove }: { item: FavoriteItem; onPress: () => void; onRemove: () => void }) => {
  const Icon = ICON_MAP[item.icon] ?? Star;
  const [removing, setRemoving] = useState(false);
    const { isLight } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => { setRemoving(true); }}
      style={[ps.favTile, {
        borderColor: item.color + (isLight ? 'AA' : '66'),
        backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : item.color + '10',
        shadowColor: item.color,
        shadowOpacity: isLight ? 0.16 : 0.30,
        shadowRadius: isLight ? 8 : 12,
        shadowOffset: { width: 0, height: isLight ? 3 : 4 },
        elevation: isLight ? 4 : 6,
      }]}
    >
      <LinearGradient colors={isLight ? [item.color + '18', 'rgba(255,255,255,0)'] : [item.color + '28', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['transparent', item.color + '99', 'transparent'] as [string,string,string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1 }} pointerEvents="none" />
      <View style={[ps.favIcon, { backgroundColor: item.color + '28' }]}>
        <Icon color={item.color} size={18} strokeWidth={1.8} />
      </View>
      <Text style={[ps.favLabel, { color: item.color }]} numberOfLines={2}>{item.label}</Text>
      {removing && (
        <Pressable onPress={() => { onRemove(); setRemoving(false); }} style={ps.favRemoveBtn}>
          <X color="#fff" size={10} />
        </Pressable>
      )}
    </Pressable>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Checklist item component with spring animation
// ─────────────────────────────────────────────────────────────────────────────
const ChecklistItem = React.memo(({
  label, checked, onToggle, accent, textColor, cardBg, cardBorder,
}: {
  label: string; checked: boolean; onToggle: () => void;
  accent: string; textColor: string; cardBg: string; cardBorder: string;
}) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.92), withSpring(1));
    onToggle();
    void HapticsService.selection();
  };

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animStyle, { marginBottom: 10 }]}>
      <Pressable onPress={handlePress} style={[ps.checkRow, { backgroundColor: cardBg, borderColor: checked ? accent + '66' : cardBorder }]}>
        <LinearGradient
          colors={checked ? [accent + '14', 'transparent'] : ['transparent', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[ps.checkBox, { borderColor: checked ? accent : cardBorder, backgroundColor: checked ? accent + '22' : 'transparent' }]}>
          {checked && <Text style={{ color: accent, fontSize: 13, fontWeight: '800' }}>✓</Text>}
        </View>
        <Text style={[ps.checkLabel, {
          color: textColor,
          opacity: checked ? 0.50 : 1,
          textDecorationLine: checked ? 'line-through' : 'none',
        }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────
function getPortalGreeting(name: string): string {
  const h = new Date().getHours();
  const isEn = i18n.language?.startsWith('en');
  const n = name || (isEn ? 'Traveler' : 'Wędrowcze');
  if (h < 5)  return isEn ? `Good night, ${n} ✦` : `Dobranoc, ${n} ✦`;
  if (h < 10) return isEn ? `Good morning, ${n} ✦` : `Dobrego poranka, ${n} ✦`;
  if (h < 14) return i18n.language?.startsWith('en') ? `Good morning, ${n} ✦` : `Dzień dobry, ${n} ✦`;
  if (h < 18) return i18n.language?.startsWith('en') ? `Hello, ${n} ✦` : `Witaj, ${n} ✦`;
  return i18n.language?.startsWith('en') ? `Good evening, ${n} ✦` : `Dobrego wieczoru, ${n} ✦`;
}

function formatDate(): string {
  const d = new Date();
  if (i18n.language?.startsWith('en')) {
    return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  const days = ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'];
  const months = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getMoonPhase(date: Date): { name: string; emoji: string; illumination: number; advice: string } {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const day = date.getDate();
  const jd = 367 * y - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4) +
    Math.floor(275 * m / 9) + day + 1721013.5;
  const raw = ((jd - 2451549.5) / 29.53058867) % 1;
  const phase = raw < 0 ? raw + 1 : raw;

  const isEn = i18n.language?.startsWith('en');
  if (phase < 0.035 || phase >= 0.965) return {
    name: isEn ? 'New Moon' : 'Nów księżyca', emoji: '🌑', illumination: 0,
    advice: isEn ? 'A time for new intentions and fresh beginnings. Plant the seeds of your desires.' : 'Czas na nowe intencje i świeże początki. Zasiej ziarna swoich marzeń.',
  };
  if (phase < 0.15) return {
    name: isEn ? 'Waxing Crescent' : 'Sierp wschodzący', emoji: '🌒', illumination: Math.round(phase / 0.25 * 25),
    advice: isEn ? 'Energy is rising. Start acting in alignment with the intentions you set at the new moon.' : 'Energia wzrasta. Zacznij działać zgodnie z intencjami postawionymi na nowie.',
  };
  if (phase < 0.25) return {
    name: isEn ? 'First Quarter' : 'Kwadra pierwsza', emoji: '🌓', illumination: 50,
    advice: isEn ? 'A moment for decisions. Check what truly supports your goal.' : 'Moment podejmowania decyzji. Sprawdź, co rzeczywiście wspiera Twój cel.',
  };
  if (phase < 0.40) return {
    name: isEn ? 'Waxing Gibbous' : 'Garb wschodzący', emoji: '🌔', illumination: Math.round(50 + (phase - 0.25) / 0.25 * 40),
    advice: isEn ? 'Develop what you have planted. The energy is fertile and creative.' : 'Rozwijaj to, co zasadziłeś. Energia jest płodna i twórcza.',
  };
  if (phase < 0.60) return {
    name: isEn ? 'Full Moon' : 'Pełnia księżyca', emoji: '🌕', illumination: 100,
    advice: isEn ? 'The cycle reaches its climax. Release what no longer serves you and celebrate what has ripened.' : 'Kulminacja cyklu. Uwolnij to, co już nie służy. Świętuj swoje osiągnięcia.',
  };
  if (phase < 0.75) return {
    name: isEn ? 'Waning Gibbous' : 'Garb opadający', emoji: '🌖', illumination: Math.round(90 - (phase - 0.5) / 0.25 * 40),
    advice: isEn ? 'Gather the harvest and reflect on what this cycle has taught you.' : 'Zbierz plony i wyciągnij wnioski z tego cyklu.',
  };
  if (phase < 0.85) return {
    name: isEn ? 'Last Quarter' : 'Kwadra ostatnia', emoji: '🌗', illumination: 50,
    advice: isEn ? 'A time for letting go, healing, and cleansing.' : 'Czas na odpuszczanie, uzdrawianie i oczyszczenie.',
  };
  return {
    name: isEn ? 'Waning Crescent' : 'Sierp opadający', emoji: '🌘', illumination: Math.round(25 - (phase - 0.85) / 0.15 * 25),
    advice: isEn ? 'Quiet down and prepare for the next cycle. Rest and reflect.' : 'Wyciszenie i przygotowanie na nowy cykl. Odpoczywaj i reflektuj.',
  };
}

function getPersonalDay(birthDate: string): { num: number; meaning: string } {
  const today = new Date();
  let sum = today.getDate() + (today.getMonth() + 1) + today.getFullYear();
  if (birthDate) {
    const parts = birthDate.split('-');
    if (parts.length >= 3) {
      sum += parseInt(parts[1] || '1', 10) + parseInt(parts[2] || '1', 10);
    }
  }
  let n = sum;
  let iterations = 0;
  while (n > 9 && n !== 11 && n !== 22 && iterations < 20) {
    n = String(n).split('').reduce((a, d) => a + parseInt(d, 10), 0);
    iterations++;
  }
  const meanings: Record<number, string> = {
    1:  'Nowe początki — czas na działanie i inicjatywę',
    2:  'Harmonia i partnerstwo — słuchaj swojego serca',
    3:  'Ekspresja i radość — twórz i komunikuj się',
    4:  'Praca i struktura — buduj fundamenty',
    5:  'Zmiana i wolność — bądź elastyczny i otwarty',
    6:  'Miłość i odpowiedzialność — dbaj o bliskich',
    7:  'Refleksja i analiza — sięgnij w głąb siebie',
    8:  'Moc i obfitość — działaj z determinacją',
    9:  'Zakończenia i mądrość — uwolnij i podsumuj',
    11: 'Intuicja mistyczna — zaufaj wewnętrznemu głosowi',
    22: 'Mistrz budowniczy — wielkie plany w zasięgu ręki',
  };
  return { num: n, meaning: meanings[n] || 'Dzień transformacji i wewnętrznego wzrostu' };
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

// ─────────────────────────────────────────────────────────────────────────────
// Planetary positions (simplified ephemeris, deterministic per date)
// ─────────────────────────────────────────────────────────────────────────────
interface PlanetInfo {
  name: string; emoji: string; sign: string; signSymbol: string;
  isRetrograde: boolean; influence: string; color: string;
}

const ZODIAC_SIGNS_PL = ['Baran','Byk','Bliźnięta','Rak','Lew','Panna','Waga','Skorpion','Strzelec','Koziorożec','Wodnik','Ryby'];
const ZODIAC_SYMBOLS2 = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

function getPlanetSign(epochDays: number, period: number, offset: number): number {
  return Math.floor(((epochDays / period + offset) % 12 + 12) % 12);
}

function getPlanetaryPositions(date: Date): PlanetInfo[] {
  const epoch = new Date('2000-01-01');
  const d = Math.floor((date.getTime() - epoch.getTime()) / 86400000);

  // Approximate synodic periods (days) and 2000-epoch offsets for each planet
  const merc = getPlanetSign(d, 88,  0.2); // Mercury ~88 day orbit, cycles quickly
  const venu = getPlanetSign(d, 225, 2.7); // Venus ~225 day orbit
  const mars = getPlanetSign(d, 687, 1.3); // Mars ~687 day orbit
  const jupi = getPlanetSign(d, 4333, 4.1); // Jupiter ~11.86yr
  const satu = getPlanetSign(d, 10759, 9.5); // Saturn ~29.46yr

  // Retrograde: each planet has retrograde periods based on a secondary cycle
  const mercRx = ((d / 116) % 4) < 0.55; // Mercury retro ~3 times/year
  const venuRx = ((d / 584) % 4) < 0.35; // Venus retro every ~18 months
  const marsRx = ((d / 780) % 4) < 0.22; // Mars retro every ~26 months
  const jupiRx = ((d / 399) % 4) < 1.00; // Jupiter retro ~4 months/year
  const satuRx = ((d / 378) % 4) < 1.10; // Saturn retro ~4.5 months/year

  const INFLUENCES: Record<string, string[]> = {
    mercury: ['Komunikacja płynie łatwiej niż zwykle','Uważaj na nieporozumienia w słowach','Czas na jasność w myśleniu i wyrażaniu','Dokumenty i kontrakty sprzyjają dziś'],
    venus:   ['Relacje nabierają ciepła i harmonii','Piękno i sztuka przynoszą dziś regenerację','Czas na gesty miłości i doceniania','Wartości i finanse domagają się uwagi'],
    mars:    ['Energia działania i decyzji jest wysoka','Uważaj na impulsywność w reakcjach','Odwaga i inicjatywa są dziś nagradzane','Napięcia mogą wymagać rozładowania'],
    jupiter: ['Ekspansja i szanse otwierają się szerzej','Optymizm przynosi realne możliwości','Czas na wzrost i poszerzanie horyzontów','Nadmierne ambicje mogą przeszkadzać'],
    saturn:  ['Praca i dyscyplina przynoszą dziś plony','Fundamenty wymagają sprawdzenia','Struktury i plany długoterminowe sprzyjają','Cierpliwość jest dziś najważniejszą cnotą'],
  };

  const pick = (arr: string[], seed: number) => arr[seed % arr.length];
  const ds = d;

  return [
    { name: 'Merkury', emoji: '☿', sign: ZODIAC_SIGNS_PL[merc], signSymbol: ZODIAC_SYMBOLS2[merc], isRetrograde: mercRx, color: '#F59E0B', influence: pick(INFLUENCES.mercury, ds + 1) },
    { name: 'Wenus',   emoji: '♀', sign: ZODIAC_SIGNS_PL[venu], signSymbol: ZODIAC_SYMBOLS2[venu], isRetrograde: venuRx, color: '#F472B6', influence: pick(INFLUENCES.venus,   ds + 2) },
    { name: 'Mars',    emoji: '♂', sign: ZODIAC_SIGNS_PL[mars], signSymbol: ZODIAC_SYMBOLS2[mars], isRetrograde: marsRx, color: '#EF4444', influence: pick(INFLUENCES.mars,    ds + 3) },
    { name: 'Jowisz',  emoji: '♃', sign: ZODIAC_SIGNS_PL[jupi], signSymbol: ZODIAC_SYMBOLS2[jupi], isRetrograde: jupiRx, color: '#F97316', influence: pick(INFLUENCES.jupiter, ds + 4) },
    { name: 'Saturn',  emoji: '♄', sign: ZODIAC_SIGNS_PL[satu], signSymbol: ZODIAC_SYMBOLS2[satu], isRetrograde: satuRx, color: '#818CF8', influence: pick(INFLUENCES.saturn,  ds + 5) },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Astronomical events calendar 2026
// ─────────────────────────────────────────────────────────────────────────────
interface AstroEvent {
  date: string; title: string; subtitle: string; emoji: string;
  type: 'meteor' | 'eclipse' | 'conjunction' | 'solstice' | 'equinox' | 'supermoon';
  color: string;
}

const ASTRO_EVENTS_2026: AstroEvent[] = [
  { date: '2026-01-03', title: 'Kwadrantydy', subtitle: 'Szczyt roju meteorów · do 120/godz.', emoji: '🌠', type: 'meteor', color: '#60A5FA' },
  { date: '2026-02-17', title: 'Zaćmienie Słońca', subtitle: 'Obrączkowe · widoczne częściowo', emoji: '🌑', type: 'eclipse', color: '#F97316' },
  { date: '2026-03-20', title: 'Wiosenne Zrównanie Dnia i Nocy', subtitle: 'Równonoc · początek astrolog. wiosny', emoji: '🌱', type: 'equinox', color: '#34D399' },
  { date: '2026-04-05', title: 'Superpełnia Księżyca', subtitle: 'Księżyc w perigeum · wyjątkowo jasny', emoji: '🌕', type: 'supermoon', color: '#FBBF24' },
  { date: '2026-04-22', title: 'Lirydy', subtitle: 'Szczyt roju meteorów · do 18/godz.', emoji: '🌠', type: 'meteor', color: '#60A5FA' },
  { date: '2026-05-05', title: 'Eta Akwarydy', subtitle: 'Odłamki komety Halleya · do 50/godz.', emoji: '☄️', type: 'meteor', color: '#A78BFA' },
  { date: '2026-06-21', title: 'Przesilenie Letnie', subtitle: 'Najdłuższy dzień roku', emoji: '☀️', type: 'solstice', color: '#FBBF24' },
  { date: '2026-08-12', title: 'Całkowite Zaćmienie Słońca', subtitle: 'Widoczne w Azji i Arktyce', emoji: '🌑', type: 'eclipse', color: '#F97316' },
  { date: '2026-08-13', title: 'Perseidy', subtitle: 'Najsłynniejszy rój · do 100/godz.', emoji: '🌠', type: 'meteor', color: '#60A5FA' },
  { date: '2026-09-23', title: 'Jesienne Zrównanie', subtitle: 'Równonoc · waga dnia i nocy', emoji: '🍂', type: 'equinox', color: '#F59E0B' },
  { date: '2026-10-21', title: 'Orionidy', subtitle: 'Odłamki komety Halleya · do 25/godz.', emoji: '🌠', type: 'meteor', color: '#60A5FA' },
  { date: '2026-11-17', title: 'Leonidy', subtitle: 'Rój Lwa · do 15/godz.', emoji: '🌠', type: 'meteor', color: '#60A5FA' },
  { date: '2026-12-13', title: 'Geminidy', subtitle: 'Najlepszy rój roku · do 120/godz.', emoji: '✨', type: 'meteor', color: '#34D399' },
  { date: '2026-12-21', title: 'Przesilenie Zimowe', subtitle: 'Najkrótszy dzień · noc przesilenia', emoji: '🕯️', type: 'solstice', color: '#818CF8' },
];

function getUpcomingAstroEvents(date: Date, count = 3): (AstroEvent & { daysUntil: number })[] {
  const today = date.toISOString().split('T')[0];
  return ASTRO_EVENTS_2026
    .map(ev => {
      const d = Math.ceil((new Date(ev.date).getTime() - date.getTime()) / 86400000);
      return { ...ev, daysUntil: d };
    })
    .filter(ev => ev.daysUntil >= 0 && ev.daysUntil <= 90)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, count);
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic daily horoscope messages (30 per sign)
// ─────────────────────────────────────────────────────────────────────────────
const ZODIAC_HOROSCOPES: Record<string, string[]> = {
  aries: [
    'Twoja energia jest dziś wyjątkowo wysoka. Użyj jej, by podjąć decyzję, którą odkładałeś.',
    'Mars wzmacnia Twoją pewność siebie. Czas na rozmowę, której się bałeś.',
    'Intuicja prowadzi Cię ku właściwemu wyborowi. Ufaj pierwszemu impulsowi.',
    'Nowa możliwość pojawi się nieoczekiwanie. Bądź otwarty na niespodzianki.',
    'Twoja odwaga jest dziś zaraźliwa. Inspirujesz otoczenie samą swoją obecnością.',
    'Ogień w Tobie płonie jasno. Skoncentruj go na jednym ważnym projekcie.',
    'Stare wzorce odchodzą. Jesteś wolny, by pisać nowy rozdział swojej historii.',
    'Relacje przynoszą dziś radość i zrozumienie. Otwórz się na głębszą rozmowę.',
    'Twoja determinacja jest Twoją supermocą. Nie odpuszczaj.',
    'Czas na odwagę serca — powiedz to, co chcesz powiedzieć.',
    'Energia przemian otacza Cię jak złocista aura. Skorzystaj z niej.',
    'Wytrwałość przyniesie dziś owoce. Każdy mały krok ma znaczenie.',
    'Twój ogień przyciąga właściwych ludzi. Bądź autentyczny.',
    'Nowe spojrzenie na stary problem — rozwiązanie jest bliżej niż myślisz.',
    'Intuicja a logika są dziś w harmonii. Zaufaj obu.',
    'Twoja odwaga w wyrażaniu siebie otwiera nowe drzwi.',
    'Siła nie w głośności, lecz w pewności wewnętrznej. Pamiętaj o tym dziś.',
    'Mars sprzyja Twoim ambicjom. Działaj zdecydowanie i pewnie.',
    'Daj sobie chwilę ciszy — z głębi przyjdzie ważna odpowiedź.',
    'Twoja kreatywność jest dziś na szczycie. Stwórz coś pięknego.',
    'Odwaga to nie brak strachu — to działanie pomimo niego.',
    'Relacja, która Cię niepokoi, wymaga szczerej rozmowy. Masz siłę.',
    'Nowe projekty rozkwitają pod Twoją energią. Zacznij już dziś.',
    'Twoje pragnienia są legitymowane. Pozwól sobie pragnąć.',
    'Dzień sprzyja przełomom. Coś ważnego się zmienia.',
    'Twoja intuicja wskazuje właściwą ścieżkę. Podążaj za nią.',
    'Czas na dbanie o siebie — siła pochodzi z centrum.',
    'Spontaniczność przyniesie Ci dziś radosną niespodziankę.',
    'Twoja autentyczność jest Twoim największym atutem.',
    'Zakończ to, co zaczęte — poczujesz wielką ulgę i satysfakcję.',
  ],
  taurus: [
    'Twoja cierpliwość jest dziś Twoją największą siłą. Nie spiesz się.',
    'Wenus przynosi harmonię w relacjach i piękno w codziennych chwilach.',
    'Czas zakorzenić się i poczuć stabilność, którą sam w sobie nosisz.',
    'Twoja wytrwałość przyniesie wymierne efekty. Nie rezygnuj.',
    'Zmysłowość i uważność na piękno — celebruj dziś małe przyjemności.',
    'Finanse i zasoby wymagają Twojej uwagi. Planuj mądrze.',
    'Twoja lojalność jest ceniona przez tych, którym na niej zależy.',
    'Czas na odpoczynek i regenerację. Cisza to też siła.',
    'Nowe możliwości materialne są na wyciągnięcie ręki.',
    'Twoja niezawodność buduje zaufanie i otwiera nowe drzwi.',
    'Relacje wymagają troski i obecności — daj im dziś swój czas.',
    'Twój zmysł estetyczny jest dziś wyjątkowo wyostrzony.',
    'Stabilność, którą budujesz, jest fundamentem dla przyszłych marzeń.',
    'Dziś dobry dzień na praktyczne decyzje i długoterminowe plany.',
    'Twoja cierpliwość do wzrostu jest inspiracją dla innych.',
    'Czas zadbać o ciało — ruch, natura, dobry posiłek.',
    'Twoja obecność uspokaja i koi. Inni Cię potrzebują.',
    'Naucz się mówić "nie" z miłością — to chroni Twoją energię.',
    'Twój zmysł praktyczny znajdzie dziś eleganckie rozwiązanie.',
    'Czas zakwitnąć — jesteś gotowy na nowy etap.',
    'Wenus sprzyja miłości i pięknu. Otwórz się na oba.',
    'Twoja wytrwałość w dążeniu do celu jest godna podziwu.',
    'Mały luksus, na który zasługujesz — pozwól sobie dziś.',
    'Twoje fundamenty są mocne. Czas budować wyżej.',
    'Zaufaj swojemu ciału — mówi Ci coś ważnego.',
    'Spokój jest Twoją supermocą w chaotycznym dniu.',
    'Twoja lojalność wobec siebie jest równie ważna.',
    'Dziś sprzyja tworzeniu — rękodzieło, gotowanie, wyrażanie przez materię.',
    'Twoja wytrwałość i determinacja zostaną dziś nagrodzone.',
    'Wenus przynosi radość z prostych, codziennych piękności.',
  ],
  gemini: [
    'Twój umysł iskrzy dziś niezwykłymi pomysłami. Zapisz je wszystkie.',
    'Komunikacja jest dziś Twoim kluczem. Używaj słów z rozmysłem.',
    'Ciekawość prowadzi Cię ku fascynującym odkryciom.',
    'Dwie perspektywy — obie mają wartość. Zintegruj je.',
    'Twoja dowcipność rozświetla każdą rozmowę.',
    'Czas na uczenie się czegoś nowego i fascynującego.',
    'Twoje zdolności adaptacyjne są dziś Twoim największym atutem.',
    'Połączenia i spotkania przyniosą inspirację.',
    'Merkury wspiera Twoje zdolności komunikacyjne — pisz, mów, słuchaj.',
    'Twoja wszechstronność otwiera przed Tobą wiele ścieżek.',
    'Dziś dobry dzień na kreatywne pisanie lub wyrażanie myśli.',
    'Twój intelekt szuka nowego wyzwania — daj mu je.',
    'Rozmowa z niespodziewaną osobą przyniesie cenne spostrzeżenia.',
    'Twoja elastyczność myślenia jest Twoją supermocą.',
    'Czas na podróż — choćby tylko w wyobraźni.',
    'Twoja lekkość bycia jest darem dla otoczenia.',
    'Dziś sprzyja networkingowi i budowaniu nowych kontaktów.',
    'Twoja ciekawość jest iskrą, która roznieca pasje.',
    'Dwa projekty naraz — Bliźnięta to potrafią.',
    'Twój humor jest lekarstwem na każdą trudność.',
    'Czas zaktualizować wiedzę w dziedzinie, która Cię fascynuje.',
    'Twoje słowa mają moc — użyj jej mądrze.',
    'Spotkanie z bratnim duchem przyniesie Ci energię.',
    'Twoja zdolność do widzenia wielu perspektyw jest bezcenna.',
    'Dziś sprzyjają Ci krótkie podróże i nowe miejsca.',
    'Twój umysł potrzebuje zarówno stymulacji, jak i chwili ciszy.',
    'Nowe informacje zmienią Twój punkt widzenia na istotną kwestię.',
    'Twoja lekkość ukrywa głębię — pozwól innym ją odkryć.',
    'Merkury przynosi dziś jasność umysłu i zdolność rozwiązywania problemów.',
    'Twoja wielowymiarowość jest darem — nie ciężarem.',
  ],
  cancer: [
    'Twoja intuicja jest dziś wyjątkowo ostra. Ufaj przeczuciom.',
    'Dom i bliscy są źródłem Twojej siły. Zadbaj o te więzi.',
    'Emocje są Twoim kompasem — nie tłum ich, słuchaj.',
    'Księżyc wzmacnia Twoją emocjonalną głębię i empatię.',
    'Twoja troska o innych wraca do Ciebie w postaci miłości.',
    'Czas na stworzenie ciepłego azylu — w domu lub w sobie.',
    'Twoja pamięć emocjonalna zawiera ważne lekcje. Sięgnij po nie.',
    'Ochrona i opieka — Twoje naturalne dary — są dziś szczególnie cenne.',
    'Pozwól sobie na wrażliwość. To nie słabość, to siła.',
    'Twoja rodzina (z urodzenia lub z wyboru) Cię kocha.',
    'Czas uzdrowić stare rany — z łagodnością i cierpliwością.',
    'Twoja intuicja wskazuje, kto naprawdę jest po Twojej stronie.',
    'Empatia jest darem — dziś możesz nią komuś pomóc.',
    'Twój dom potrzebuje dziś Twojej uwagi i miłości.',
    'Czas na kreatywne gotowanie lub inne praktyki domowej alchemii.',
    'Twoja wrażliwość pozwala Ci dostrzec to, co inni pomijają.',
    'Granice ochronne są ważne — szanuj swoje potrzeby.',
    'Dziś dobry dzień na nostalgiczne powroty i refleksję.',
    'Twoja miłość jest sposobem na uzdrawianie — swoje i innych.',
    'Emocje potrzebują ujścia — pisz, płacz, tańcz.',
    'Twoje przeczucia są na wagę złota. Zanotuj je.',
    'Księżycowe energie wspierają Twój wewnętrzny świat.',
    'Czas na rozmowę z kimś, komu ufasz bezgranicznie.',
    'Twoja troska o siebie jest fundamentem, by troszczyć się o innych.',
    'Dom to nie miejsce — to uczucie bezpieczeństwa, które nosisz w sobie.',
    'Twoja intuicja jest dziś głosem wyższej mądrości.',
    'Emocjonalna dojrzałość, którą posiadasz, jest rzadkim darem.',
    'Czas zadbać o świat wewnętrzny — medytuj, śnij, fantazjuj.',
    'Twoja głębia emocjonalna przyciąga autentyczne połączenia.',
    'Dziś sprzyja budowaniu bezpiecznej przestrzeni dla siebie i bliskich.',
  ],
  leo: [
    'Twoje światło jest potrzebne światu. Nie chowaj go dziś.',
    'Słońce wypełnia Cię twórczą energią i pewnością siebie.',
    'Czas na wyrażenie siebie w pełni — bez przeprosin.',
    'Twoja hojność i ciepło powracają do Ciebie wielokrotnie.',
    'Liderskie zdolności są dziś szczególnie widoczne i cenione.',
    'Twoja radość życia jest darem dla tych wokół Ciebie.',
    'Czas na scenę — wystąp, przemów, zainspiruj.',
    'Twoja lojalność wobec bliskich jest wyjątkowa i cenna.',
    'Kreacja i ekspresja są dziś Twoimi sprzymierzeńcami.',
    'Twoja odwaga serca czyni Cię niepowtarzalnym.',
    'Czas zadbać o siebie z królewską starannością.',
    'Twój entuzjazm jest zaraźliwy i otwierający.',
    'Dziś dobry dzień na projektowanie, kreowanie, tworzenie.',
    'Twoja charyzma naturalnie przyciąga właściwe osoby.',
    'Czas na świętowanie siebie — każdego osiągnięcia, dużego i małego.',
    'Twoje serce jest sercem lwa — odważne i szczodre.',
    'Słońce wzmacnia Twoją wewnętrzną pewność siebie.',
    'Twoja twórcza wizja jest unikalna. Podziel się nią z światem.',
    'Czas na zabawę, śmiech i lekką stronę życia.',
    'Twoja siła inspiruje innych do bycia najlepszą wersją siebie.',
    'Uznanie, na które czekałeś, może przyjść dziś nieoczekiwanie.',
    'Twoja królewskość to nie duma — to godność i wewnętrzna pewność.',
    'Dziś sprzyjają Ci wystąpienia publiczne i dzielenie się wiedzą.',
    'Twoja miłość do życia jest Twoją największą siłą.',
    'Czas rozjaśnić komuś dzień — Twoja natura lwa na to pozwala.',
    'Twoja wierność sobie jest podstawą autentyczności.',
    'Słońce przynosi Ci energię do realizacji wielkich planów.',
    'Twoja kreatywność i pasja wspólnie tworzą magię.',
    'Czas na bycie w centrum — dzisiaj jest Twój dzień.',
    'Twoje serce wie, co jest dla Ciebie najważniejsze. Posłuchaj go.',
  ],
  virgo: [
    'Twoja uwaga na szczegóły sprawi, że dziś nic Ci nie umknie.',
    'Merkury wspiera Twoją analityczną zdolność i precyzję myślenia.',
    'Czas na porządkowanie — myśli, przestrzeni, planów.',
    'Twoja zdolność do doskonalenia jest dziś Twoją największą siłą.',
    'Służba innym przynosi Ci satysfakcję i głęboki sens.',
    'Czas na zdrowe nawyki — ciało jest świątynią duszy.',
    'Twoja skromność ukrywa wyjątkowe zdolności. Pozwól im zabłysnąć.',
    'Praktyczne rozwiązania są dziś na wyciągnięcie ręki.',
    'Twoja zdolność organizacji jest darem dla projektów i ludzi.',
    'Czas zakończyć to, co wisi niedokończone — poczujesz ulgę.',
    'Twoja precyzja i staranność są dziś w pełni cenione.',
    'Merkury przynosi jasność w sprawach wymagających analizy.',
    'Czas na refleksję nad swoją rutyną — co naprawdę Ci służy?',
    'Twoja dyskrecja buduje zaufanie i głębokie relacje.',
    'Dziś dobry dzień na planowanie i tworzenie systemów.',
    'Twoja krytyczność wobec siebie zasługuje na łagodność.',
    'Czas zadbać o zdrowie — prewencja jest mądrzejsza niż leczenie.',
    'Twoja analityczność pomoże dziś znaleźć ukryte rozwiązanie.',
    'Powoli i pewnie — Twoje podejście przynosi trwałe rezultaty.',
    'Czas na docenianie swojej pracy — jesteś bardziej zaawansowany niż myślisz.',
    'Twoja skrupulatność jest fundamentem Twojej wiarygodności.',
    'Dziś sprzyja porządkowaniu finansów i planowaniu budżetu.',
    'Twoja troska o szczegóły tworzy doskonałość.',
    'Czas na naukę nowej umiejętności praktycznej.',
    'Twoje zaangażowanie w codzienne obowiązki jest formą devotion.',
    'Merkury wspiera Twoją zdolność komunikacji z precyzją.',
    'Czas zadbać o relacje z tymi, którym naprawdę służysz.',
    'Twoja skromna mądrość jest rzadkim i cennym darem.',
    'Dziś dobry dzień na tworzenie list, planów i systemów.',
    'Twoja dyscyplina i wytrwałość budują fundamenty sukcesu.',
  ],
  libra: [
    'Harmonia, której szukasz, zaczyna się od równowagi wewnętrznej.',
    'Wenus przynosi piękno i łagodność w relacjach.',
    'Czas na dyplomatyczne rozwiązanie trudnej sytuacji.',
    'Twoja zdolność do widzenia obu stron jest dziś cennym darem.',
    'Sprawiedliwość i równowaga — dziś możesz je tworzyć.',
    'Twoja estetyczna wrażliwość otwiera Cię na piękno w codzienności.',
    'Partnerstwo i współpraca przyniosą dziś piękne efekty.',
    'Czas podjąć decyzję, której unikałeś — równowaga na to pozwala.',
    'Twoja charyzma i wdzięk przyciągają właściwych ludzi.',
    'Dziś dobry dzień na mediacje i łagodzenie konfliktów.',
    'Twoja potrzeba harmonii jest ważna — komunikuj ją.',
    'Wenus wspiera miłość, piękno i twórcze wyrażenie siebie.',
    'Czas na dbanie o estetykę przestrzeni i otoczenia.',
    'Twoja sprawiedliwość budzi szacunek i zaufanie.',
    'Dziś sprzyja nawiązywaniu nowych partnerstw.',
    'Twoja dyplomacja jest kluczem do rozwiązania napięć.',
    'Równowaga między dawaniem a braniem — sprawdź, jak stoisz.',
    'Twoja zdolność do kompromisu jest dziś szczególnie cenna.',
    'Czas na świętowanie piękna — sztuka, muzyka, natura.',
    'Twoja intuicja dotycząca relacji jest dziś wyjątkowo ostra.',
    'Wenus przynosi łagodność i uczuciowe ciepło.',
    'Czas na szczerą rozmowę o potrzebach w ważnej relacji.',
    'Twoja harmonia wewnętrzna jest fundamentem zewnętrznego piękna.',
    'Dziś dobry dzień na podejmowanie decyzji po rzetelnym ważeniu.',
    'Twoja obecność łagodzi napięcia i wnosi spokój.',
    'Czas zadbać o własną estetykę i wyrażenie siebie.',
    'Twoja wrażliwość na piękno jest duchowym darem.',
    'Wenus wspiera Twoją zdolność do kochania siebie.',
    'Dziś sprzyjają Ci spotkania z osobami, które inspirują.',
    'Twoja równowaga jest drogowskazem dla otoczenia.',
  ],
  scorpio: [
    'Twoja zdolność do transformacji jest dziś nieograniczona.',
    'Pluton wzmacnia Twoją intuicję i zdolność postrzegania ukrytych prawd.',
    'Czas zanurzyć się w tym, czego się boisz — tam jest skarb.',
    'Twoja intensywność jest supermocą, gdy skierujesz ją właściwie.',
    'Dziś dobry dzień na uzdrawianie starych ran i wzorców.',
    'Twoja lojalność jest absolutna — doceniaj tych, którzy ją odwzajemniają.',
    'Tajemnica, którą nosisz, jest gotowa się ujawnić.',
    'Twoja głębia emocjonalna pozwala Ci dotknąć sedna każdej sprawy.',
    'Czas na transformację — coś odchodzi, by zrobić miejsce na nowe.',
    'Twój instynkt przetrwania jest dziś Twoim kompasem.',
    'Pluton wspiera przemiany wewnętrzne i duchowe przebudzenia.',
    'Czas na zagłębienie się w temat, który fascynuje i niepokoi.',
    'Twoja zdolność do skupienia jest dziś niezwykłą siłą.',
    'Ujawnij prawdę — nawet jeśli jest niekomfortowa.',
    'Twoja pasja i intensywność tworzą magię, której inni nie potrafią.',
    'Dziś sprzyja pracy głębokiej i skupionej.',
    'Twoja intuicja zna odpowiedź. Zaufaj jej bez wahania.',
    'Czas na oczyszczenie z relacji lub wzorców, które Cię wyczerpują.',
    'Twoja zdolność do regeneracji po trudnościach jest niezwykła.',
    'Pluton przynosi możliwość głębokiej przemiany duszy.',
    'Czas zmierzyć się z cieniami — tam kryje się Twoja moc.',
    'Twoja magnetyczna aura przyciąga intensywne doświadczenia.',
    'Dziś dobry dzień na badanie nieznanych terytoriów duszy.',
    'Twoja determinacja jest absolutna — nic Cię nie zatrzyma.',
    'Czas na szczerość wobec siebie w kwestii, którą unikałeś.',
    'Twoja zdolność do transformacji czyni Cię feniksem.',
    'Pluton wspiera głębokie oczyszczenia i nowe narodziny.',
    'Twoja intensywność jest darem, gdy stosujesz ją świadomie.',
    'Dziś sprzyjają Ci medytacje na temat przemiany i śmierci ego.',
    'Twoja głębia jest nieskończona. Odkrywaj ją.',
  ],
  sagittarius: [
    'Twoja wolność ducha jest dziś w pełni rozkwicie.',
    'Jowisz przynosi obfitość, optymizm i rozszerzanie horyzontów.',
    'Czas na przygodę — nawet małą, w codzienności.',
    'Twoja filozofia życia inspiruje tych, którzy jej słuchają.',
    'Dziś dobry dzień na podróż — mentalną lub fizyczną.',
    'Twój optymizm jest zaraźliwy i leczniczy.',
    'Czas na poszukiwanie prawdy i sensu istnienia.',
    'Twoja szczerość jest odświeżająca — mów śmiało.',
    'Jowisz wspiera ekspansję i realizację wielkich marzeń.',
    'Czas zakwestionować przekonania, które Cię ograniczają.',
    'Twoja ciekawość świata jest darem, który Cię wzbogaca.',
    'Dziś sprzyja edukacji, nauce i poszerzaniu wiedzy.',
    'Twoja hojność ducha powraca do Ciebie w nieoczekiwany sposób.',
    'Czas na planowanie podróży lub nowego, ambitnego projektu.',
    'Twój zapał i entuzjazm porywają innych do działania.',
    'Jowisz przynosi nowe możliwości w obszarze kariery lub nauki.',
    'Czas na refleksję nad swoją filozofią i przekonaniami.',
    'Twoja miłość do wolności jest Twoją esencją — chroń ją.',
    'Dziś dobry dzień na długoterminowe planowanie i wizualizacje.',
    'Twoja bezpośredniość buduje zaufanie — nawet jeśli zaskakuje.',
    'Jowisz wzmacnia Twój optymizm i poczucie obfitości.',
    'Czas na eksplorację nowego systemu filozoficznego lub duchowego.',
    'Twoja otwartość na świat przyciąga piękne doświadczenia.',
    'Dziś sprzyjają Ci spotkania z ludźmi z innych kultur.',
    'Twoja zdolność do patrzenia na świat z szerokiej perspektywy jest darem.',
    'Czas zapalić nową iskrę pasji i podążyć za nią.',
    'Jowisz przynosi błogosławieństwo i hojność losu.',
    'Twoja wiara w dobre jutro jest siłą napędową Twojego życia.',
    'Dziś dobry dzień na marzenia i wyobrażanie sobie przyszłości.',
    'Twój ogień nigdy nie gaśnie — pamiętaj o tym w trudnych chwilach.',
  ],
  capricorn: [
    'Twoja determinacja i dyscyplina przyniosą dziś wymierne rezultaty.',
    'Saturn wspiera Twoje długoterminowe plany i strukturę.',
    'Czas na poważne, odpowiedzialne decyzje.',
    'Twoja ambicja jest fundamentem Twoich sukcesów.',
    'Dziś dobry dzień na budowanie czegoś trwałego i wartościowego.',
    'Twoja niezawodność jest Twoją mocną stroną.',
    'Saturn przynosi nagrodę za cierpliwą pracę i wytrwałość.',
    'Czas na przejrzenie długoterminowych celów i strategii.',
    'Twoja zdolność do odkładania gratyfikacji przynosi owoce.',
    'Dziś sprzyjają Ci sprawy zawodowe i finansowe.',
    'Twoje poczucie obowiązku jest cenione przez otoczenie.',
    'Saturn wzmacnia Twoją siłę charakteru w trudnych sytuacjach.',
    'Czas na budowanie reputacji i budowanie autorytetu.',
    'Twoja cierpliwość jest Twoją supermocą.',
    'Dziś dobry dzień na długoterminowe planowanie finansowe.',
    'Twój realizm jest fundamentem, na którym budujesz marzenia.',
    'Saturn przynosi mądrość przez doświadczenie.',
    'Czas docenić to, co już osiągnąłeś na swojej drodze.',
    'Twoja zdolność do koncentracji jest dziś wyjątkowa.',
    'Dziś sprzyjają Ci projekty wymagające cierpliwości i precyzji.',
    'Twoje poczucie odpowiedzialności buduje trwałe relacje.',
    'Saturn przynosi nagrody dla tych, którzy trwają.',
    'Czas na sprawdzenie, czy Twoje działania są zgodne z celami.',
    'Twoja wytrwałość jest przykładem dla tych wokół Ciebie.',
    'Dziś dobry dzień na budowanie fundamentów pod przyszłe sukcesy.',
    'Twój praktycyzm i realizm są dziś Twoimi najcenniejszymi narzędziami.',
    'Saturn wzmacnia Twoją zdolność do przekształcania trudności w siłę.',
    'Czas na prace związane z karierą i pozycją zawodową.',
    'Twoja ambicja, gdy opiera się na wartościach, tworzy dziedzictwo.',
    'Dziś sprzyjają Ci poważne zobowiązania i długoterminowe inwestycje.',
  ],
  aquarius: [
    'Twoja wizja przyszłości jest dziś wyjątkowo wyraźna.',
    'Uran przynosi nieoczekiwane odkrycia i przełomy myślowe.',
    'Czas na rewolucjonizowanie swojego podejścia do starego problemu.',
    'Twoja oryginalność jest darem dla świata.',
    'Dziś dobry dzień na działania na rzecz wspólnoty.',
    'Twoja humanitarność i troska o lepszy świat są inspirujące.',
    'Uran wspiera innowacje i niekonwencjonalne rozwiązania.',
    'Czas na tworzenie sieci wartościowych połączeń.',
    'Twoja niezależność myślenia jest Twoją supermocą.',
    'Dziś sprzyjają Ci technologie, nauka i nowe idee.',
    'Twoja zdolność do patrzenia z lotu ptaka jest rzadkim darem.',
    'Uran przynosi niespodziewane zwroty akcji — bądź elastyczny.',
    'Czas zakwestionować status quo i poszukać lepszej drogi.',
    'Twoja idealność napędza zmiany na lepsze.',
    'Dziś dobry dzień na networkowanie z podobnie myślącymi.',
    'Twoja oryginalność przyciąga tych, którzy cenią autentyczność.',
    'Uran wzmacnia Twoją intuicję i przeczucia o przyszłości.',
    'Czas na eksperymentowanie z nowym podejściem.',
    'Twoja troska o zbiorowość nie wyklucza troski o siebie.',
    'Dziś sprzyjają Ci projekty skupione na innowacji i zmianie.',
    'Twoja niezależność jest fundamentem Twojej wyjątkowości.',
    'Uran przynosi przełomowe spostrzeżenia.',
    'Czas podzielić się swoją wizją z osobami, które mogą ją realizować.',
    'Twoja zdolność do abstrakcyjnego myślenia jest bezcenna.',
    'Dziś dobry dzień na badanie alternatywnych możliwości.',
    'Twoje ideały są ważne — nie rezygnuj z nich dla wygody.',
    'Uran wspiera przemiany i rewolucyjne zmiany w Twoim życiu.',
    'Czas zaangażować się w działania, które zmieniają świat.',
    'Twoja oryginalność i otwartość umysłu otwierają nowe drzwi.',
    'Dziś sprzyjają Ci zarówno samotna refleksja, jak i wspólne działanie.',
  ],
  pisces: [
    'Twoja intuicja osiąga dziś wyjątkową głębię.',
    'Neptun zanurza Cię w świecie wyobraźni, muzyki i mistycyzmu.',
    'Czas na twórcze wyrażenie swoich najgłębszych uczuć.',
    'Twoje zdolności empatyczne są dziś wyjątkowo nasilone.',
    'Dziś dobry dzień na medytację, modlitwę i kontakt z sacrum.',
    'Twoja wyobraźnia jest portalem do głębokiej mądrości.',
    'Neptun przynosi inspiracje z nieoczekiwanych źródeł.',
    'Czas na snucie marzeń i realizację twórczych wizji.',
    'Twoja wrażliwość jest darem — broń jej z łagodnością.',
    'Dziś sprzyjają Ci sztuka, muzyka, duchowość.',
    'Twoje sny niosą ważne przesłania — zwróć na nie uwagę.',
    'Neptun wzmacnia Twoje zdolności artystyczne i intuicyjne.',
    'Czas na rozmowę z własną duszą w ciszy i skupieniu.',
    'Twoja zdolność do współczucia leczy serca.',
    'Dziś dobry dzień na tworzenie muzyki, poezji lub malarstwa.',
    'Twoja duchowa wrażliwość jest Twoim kompasem.',
    'Neptun przynosi jasność w sprawach duchowych i emocjonalnych.',
    'Czas pozwolić sobie na marzenia — nawet te wydające się nierealne.',
    'Twoja empatia jest supermocą, gdy chronisz siebie.',
    'Dziś sprzyjają Ci odosobnienie i kontemplacja.',
    'Twoja zdolność do roztapiania się w pięknie jest darem.',
    'Neptun wspiera Twoją więź z wyższą mądrością.',
    'Czas na uzdrawianie przez sztukę i ekspresję twórczą.',
    'Twoja miłość do piękna i harmonii tworzy cudowną rzeczywistość.',
    'Dziś dobry dzień na pracę z podświadomością.',
    'Twoja intuicja jest silniejsza niż logika — zaufaj jej.',
    'Neptun przynosi mistyczne doświadczenia i synchroniczności.',
    'Czas na integrację duchowości z codziennym życiem.',
    'Twoja zdolność do miłości bezwarunkowej jest rzadkim darem.',
    'Dziś sprzyjają Ci wszystkie praktyki duchowe i twórcze.',
  ],
};

function getDailyHoroscope(sign: string, dayOfYear: number): string {
  const messages = ZODIAC_HOROSCOPES[sign] || ZODIAC_HOROSCOPES['aries'];
  return messages[dayOfYear % messages.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// MiniStatCard — animated glow pulse sub-component
// ─────────────────────────────────────────────────────────────────────────────
const MiniStatCard = React.memo(({ item, cardBg, textColor }: { item: { id: string; emoji: string; label: string; value: string; color: string }; cardBg: string; textColor: string }) => {
  const glowAnim = useSharedValue(0.18);
  useEffect(() => {
    glowAnim.value = withRepeat(withSequence(withTiming(0.48, { duration: 1800 }), withTiming(0.18, { duration: 1800 })), -1, true);
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowAnim.value }));
  return (
    <View style={{ flex: 1, borderRadius: 20, borderWidth: 1.5, overflow: 'hidden', minHeight: 120, borderColor: item.color + '55', backgroundColor: cardBg,
      shadowColor: item.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 6,
      alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Top gradient band */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: item.color }} />
      {/* Animated glow background */}
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle, { backgroundColor: item.color + '33', borderRadius: 20 }]} />
      <LinearGradient colors={[item.color + '1A', 'transparent'] as const} style={StyleSheet.absoluteFill} />
      <Text style={{ fontSize: 32, marginBottom: 6 }}>{item.emoji}</Text>
      <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 6, color: item.color }}>{item.label}</Text>
      <Text style={{ fontSize: 22, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center', color: textColor }} numberOfLines={1}>{item.value}</Text>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen component
// ─────────────────────────────────────────────────────────────────────────────
export const PortalScreen = ({ navigation }: any) => {
  const userData = useAppStore(s => s.userData);
  const streaks = useAppStore(s => s.streaks);
  const dailyProgress = useAppStore(s => s.dailyProgress);
  const experience = useAppStore(s => s.experience);
  const favoriteItems = useAppStore(s => s.favoriteItems);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const dailyCache = useAppStore(s => s.dailyCache);
  const portalWidgets = useAppStore(s => s.portalWidgets);
  const gratitudeEntries = useAppStore(s => s.gratitudeEntries);
  const todayGratitude = gratitudeEntries.filter((e: GratitudeEntry) => e.date === new Date().toISOString().split('T')[0]);
  const breathworkSessions = useAppStore(s => s.breathworkSessions);
  const updateDailyProgress = useAppStore(s => s.updateDailyProgress);
  const dailyAiContent = useAppStore(s => s.dailyAiContent);
  const setDailyAiContent = useAppStore(s => s.setDailyAiContent);
  const { currentTheme, isLight, themeName, themeMode } = useTheme();
  const { entries } = useJournalStore();
  const { dailyDraw } = useTarotStore();
  const { isPremium } = usePremiumStore();
  const { t } = useTranslation();
  const tr = useCallback((key: string, pl: string, en: string, options?: Record<string, unknown>) => (
    t(key, { defaultValue: i18n.language?.startsWith('en') ? en : pl, ...options })
  ), [t]);
  const insets = useSafeAreaInsets();
  const accentColor = currentTheme.primary || ACCENT_DEFAULT;
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#5A3E22' : '#B0A393';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';

  const [dailyPlan] = useState(() => SoulEngineService.generateDailyPlan());
  const [copiedAffirmation, setCopiedAffirmation] = useState(false);
  const [affirmationIndex, setAffirmationIndex] = useState(0);
  const [aiContentLoading, setAiContentLoading] = useState(false);
  const copiedAffirmationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (copiedAffirmationTimerRef.current) clearTimeout(copiedAffirmationTimerRef.current); };
  }, []);

  // Brand shimmer animation
  const shimmerOp = useSharedValue(1);
  useEffect(() => {
    shimmerOp.value = withRepeat(withSequence(withTiming(0.65, { duration: 2200 }), withTiming(1.0, { duration: 2200 })), -1, true);
  }, []);
  const shimmerStyle = useAnimatedStyle(() => ({ opacity: shimmerOp.value }));

  const today = new Date().toISOString().split('T')[0];
  const todayProgress = dailyProgress[today] || {};
  const todayDate = new Date();
  const dayOfYear = getDayOfYear(todayDate);

  // Affirmation with ability to cycle to next
  const baseAffirmation = useMemo(() => getDailyAffirmation(today), [today]);
  const affirmation = useMemo(() => {
    if (affirmationIndex === 0) return baseAffirmation;
    const offset = affirmationIndex * 37;
    const nextDate = new Date(todayDate.getTime() + offset * 86400000);
    return getDailyAffirmation(nextDate.toISOString().split('T')[0]);
  }, [baseAffirmation, affirmationIndex, today]);
  const displayAffirmation = useMemo(() => {
    if (affirmationIndex === 0 && dailyAiContent?.date === new Date().toISOString().split('T')[0] &&
        dailyAiContent?.zodiacSign === zodiacSign && dailyAiContent.affirmation) {
      return { ...baseAffirmation, text: dailyAiContent.affirmation };
    }
    return affirmation;
  }, [affirmation, affirmationIndex, dailyAiContent, zodiacSign, baseAffirmation]);
  const catColor = CATEGORY_COLORS[affirmation.category] || accentColor;
  const categoryLabels = useMemo<Record<string, string>>(() => ({
    love: tr('portal.affirmationCategory.love', CATEGORY_LABELS.love, 'Love'),
    abundance: tr('portal.affirmationCategory.abundance', CATEGORY_LABELS.abundance, 'Abundance'),
    success: tr('portal.affirmationCategory.success', CATEGORY_LABELS.success, 'Success'),
    peace: tr('portal.affirmationCategory.peace', CATEGORY_LABELS.peace, 'Peace'),
  }), [tr]);
  const crystals = useMemo(() => ([
    { name: tr('portal.crystals.0.name', 'Ametyst', 'Amethyst'), color: '#9B59B6', benefit: tr('portal.crystals.0.benefit', 'Spokój, intuicja i duchowa jasność', 'Calm, intuition, and spiritual clarity') },
    { name: tr('portal.crystals.1.name', 'Różowy kwarc', 'Rose quartz'), color: '#FF8FAB', benefit: tr('portal.crystals.1.benefit', 'Miłość własna i otwarcie serca', 'Self-love and an open heart') },
    { name: tr('portal.crystals.2.name', 'Obsydian', 'Obsidian'), color: '#3C3C3C', benefit: tr('portal.crystals.2.benefit', 'Ochrona energetyczna i uziemienie', 'Energetic protection and grounding') },
    { name: tr('portal.crystals.3.name', 'Labradoryt', 'Labradorite'), color: '#4A90D9', benefit: tr('portal.crystals.3.benefit', 'Magia, transformacja i przebudzenie', 'Magic, transformation, and awakening') },
    { name: tr('portal.crystals.4.name', 'Cytryn', 'Citrine'), color: '#F4D03F', benefit: tr('portal.crystals.4.benefit', 'Energia, obfitość i manifestacja', 'Energy, abundance, and manifestation') },
    { name: tr('portal.crystals.5.name', 'Czarny turmalin', 'Black tourmaline'), color: '#2C2C2C', benefit: tr('portal.crystals.5.benefit', 'Ochrona i transformacja negatywnych energii', 'Protection and transformation of negative energies') },
    { name: tr('portal.crystals.6.name', 'Lapis lazuli', 'Lapis lazuli'), color: '#2C4E8A', benefit: tr('portal.crystals.6.benefit', 'Prawda, mądrość i wewnętrzny spokój', 'Truth, wisdom, and inner peace') },
    { name: tr('portal.crystals.7.name', 'Malachit', 'Malachite'), color: '#27AE60', benefit: tr('portal.crystals.7.benefit', 'Uzdrowienie serca i głęboka transformacja', 'Heart healing and deep transformation') },
    { name: tr('portal.crystals.8.name', 'Selenit', 'Selenite'), color: '#BDC3C7', benefit: tr('portal.crystals.8.benefit', 'Oczyszczenie, jasność i połączenie z wyższym ja', 'Cleansing, clarity, and connection with the higher self') },
    { name: tr('portal.crystals.9.name', 'Karneol', 'Carnelian'), color: '#E67E22', benefit: tr('portal.crystals.9.benefit', 'Energia twórcza, odwaga i żywotność', 'Creative energy, courage, and vitality') },
    { name: tr('portal.crystals.10.name', 'Amazonit', 'Amazonite'), color: '#48C9B0', benefit: tr('portal.crystals.10.benefit', 'Odwaga w komunikacji i wyrażaniu siebie', 'Courage in communication and self-expression') },
    { name: tr('portal.crystals.11.name', 'Sodalit', 'Sodalite'), color: '#2471A3', benefit: tr('portal.crystals.11.benefit', 'Logika, prawda i głęboka refleksja', 'Logic, truth, and deep reflection') },
    { name: tr('portal.crystals.12.name', 'Rodochrozyt', 'Rhodochrosite'), color: '#E91E8C', benefit: tr('portal.crystals.12.benefit', 'Uzdrowienie ran emocjonalnych i radość bycia', 'Healing emotional wounds and joy of being') },
    { name: tr('portal.crystals.13.name', 'Opal', 'Opal'), color: '#A0C4FF', benefit: tr('portal.crystals.13.benefit', 'Kreatywność, inspiracja i magiczna percepcja', 'Creativity, inspiration, and magical perception') },
  ]), [tr]);
  const chakras = useMemo(() => ([
    { name: 'Muladhara', polish: tr('portal.chakras.root', 'Korzeń', 'Root'), color: '#EF4444', emoji: '🔴', affirmation: tr('portal.chakras.rootAffirmation', 'Jestem bezpieczna i zakorzeniona.', 'I am safe and deeply rooted.') },
    { name: 'Svadhisthana', polish: tr('portal.chakras.sacral', 'Sakralny', 'Sacral'), color: '#F97316', emoji: '🟠', affirmation: tr('portal.chakras.sacralAffirmation', 'Moje emocje są moją siłą.', 'My emotions are part of my power.') },
    { name: 'Manipura', polish: tr('portal.chakras.solar', 'Splot słoneczny', 'Solar plexus'), color: '#EAB308', emoji: '🟡', affirmation: tr('portal.chakras.solarAffirmation', 'Noszę w sobie nieograniczoną moc.', 'I carry limitless power within me.') },
    { name: 'Anahata', polish: tr('portal.chakras.heart', 'Serce', 'Heart'), color: '#22C55E', emoji: '💚', affirmation: tr('portal.chakras.heartAffirmation', 'Moje serce jest otwarte na miłość.', 'My heart is open to love.') },
    { name: 'Vishuddha', polish: tr('portal.chakras.throat', 'Gardło', 'Throat'), color: '#3B82F6', emoji: '🔵', affirmation: tr('portal.chakras.throatAffirmation', 'Mówię swoją prawdę z odwagą.', 'I speak my truth with courage.') },
    { name: 'Ajna', polish: tr('portal.chakras.thirdEye', 'Trzecie oko', 'Third eye'), color: '#6366F1', emoji: '🟣', affirmation: tr('portal.chakras.thirdEyeAffirmation', 'Ufam swojej wewnętrznej mądrości.', 'I trust my inner wisdom.') },
    { name: 'Sahasrara', polish: tr('portal.chakras.crown', 'Korona', 'Crown'), color: '#A855F7', emoji: '💜', affirmation: tr('portal.chakras.crownAffirmation', 'Jestem połączona z Wszechświatem.', 'I am connected with the Universe.') },
  ]), [tr]);
  const breathSteps = useMemo(() => ([
    { label: tr('portal.breath.inhale', 'Wdech', 'Inhale'), dur: '4s', col: '#38BDF8' },
    { label: tr('portal.breath.hold', 'Zatrzymaj', 'Hold'), dur: '4s', col: '#818CF8' },
    { label: tr('portal.breath.exhale', 'Wydech', 'Exhale'), dur: '6s', col: '#34D399' },
  ]), [tr]);
  const forecastDays = useMemo(() => [
    tr('portal.forecast.today', 'Dziś', 'Today'),
    tr('portal.forecast.tomorrow', 'Jutro', 'Tomorrow'),
    tr('portal.forecast.dayAfter', 'Pojutrze', 'Day after'),
  ], [tr]);
  const quickLinks = useMemo(() => ([
    { label: tr('portal.quick.morningRitual.label', 'Poranny Rytuał', 'Morning Ritual'), emoji: '☀️', route: 'MorningRitual', color: '#F59E0B', desc: tr('portal.quick.morningRitual.desc', 'Oddech, mantra, wdzięczność', 'Breath, mantra, gratitude') },
    { label: tr('portal.quick.soundBath.label', 'Kąpiel Dźwiękowa', 'Sound Bath'), emoji: '🎵', route: 'SoundBath', color: '#CEAE72', desc: tr('portal.quick.soundBath.desc', 'Healing sounds — głęboki relaks', 'Healing sounds — deep relaxation') },
    { label: tr('portal.quick.journal.label', 'Dziennik', 'Journal'), emoji: '📖', route: 'Journal', color: '#34D399', desc: tr('portal.quick.journal.desc', 'Zapisz swoje myśli', 'Write down your thoughts') },
    { label: tr('portal.quick.tarot.label', 'Tarot', 'Tarot'), emoji: '🔮', route: 'DailyTarot', color: '#F472B6', desc: tr('portal.quick.tarot.desc', 'Karta dnia', 'Card of the day') },
    { label: tr('portal.quick.rituals.label', 'Rytuały', 'Rituals'), emoji: '🕯', route: 'RitualCategorySelection', color: '#FB923C', desc: tr('portal.quick.rituals.desc', 'Ceremonie i praktyki', 'Ceremonies and practices') },
    { label: tr('portal.quick.affirmations.label', 'Afirmacje', 'Affirmations'), emoji: '💫', route: 'Affirmations', color: '#60A5FA', desc: tr('portal.quick.affirmations.desc', 'Codzienne wzmocnienie', 'Daily reinforcement') },
    { label: tr('portal.quick.meditation.label', 'Medytacja', 'Meditation'), emoji: '🧘', route: 'Meditation', color: '#A78BFA', desc: tr('portal.quick.meditation.desc', 'Głęboki spokój', 'Deep calm') },
    { label: tr('portal.quick.dailyRitual.label', 'Rytuał AI', 'AI Ritual'), emoji: '🔥', route: 'DailyRitualAI', color: '#F97316', desc: tr('portal.quick.dailyRitual.desc', 'Rytuał prowadzony', 'Guided ritual') },
    { label: tr('portal.quick.energy.label', 'Energia', 'Energy'), emoji: '⚡', route: 'EnergyJournal', color: '#CEAE72', desc: tr('portal.quick.energy.desc', 'Śledź poziom energii', 'Track your energy level') },
    { label: tr('portal.quick.achievements.label', 'Osiągnięcia', 'Achievements'), emoji: '👑', route: 'Achievements', color: '#A78BFA', desc: tr('portal.quick.achievements.desc', 'Twoje trofea', 'Your trophies') },
    { label: tr('portal.quick.yearCard.label', 'Karta roku', 'Year card'), emoji: '🃏', route: 'YearCard', color: '#60A5FA', desc: tr('portal.quick.yearCard.desc', 'Numerologiczna karta', 'Numerological card') },
    { label: tr('portal.quick.palm.label', 'Odczyt Dłoni', 'Palm Reading'), emoji: '✋', route: 'PalmReading', color: '#F9A8D4', desc: tr('portal.quick.palm.desc', 'Linie dłoni — AI', 'Palm lines — AI') },
    { label: tr('portal.quick.beats.label', 'Fale Mózgowe', 'Brain Waves'), emoji: '🧠', route: 'BinauralBeats', color: '#818CF8', desc: tr('portal.quick.beats.desc', 'Delta/Theta/Alpha', 'Delta/Theta/Alpha') },
    { label: tr('portal.quick.crystalGrid.label', 'Siatka Kryształów', 'Crystal Grid'), emoji: '💎', route: 'CrystalGrid', color: '#A78BFA', desc: tr('portal.quick.crystalGrid.desc', 'Geometria energii', 'Geometry of energy') },
    { label: tr('portal.quick.aura.label', 'Czytanie Aury', 'Aura Reading'), emoji: '🌈', route: 'AuraReading', color: '#C084FC', desc: tr('portal.quick.aura.desc', 'Quiz auretyczny', 'Aura quiz') },
    { label: tr('portal.quick.manifestation.label', 'Manifestacja', 'Manifestation'), emoji: '🌟', route: 'Manifestation', color: '#F59E0B', desc: tr('portal.quick.manifestation.desc', 'Techniki 333/369/555', '333/369/555 techniques') },
    { label: tr('portal.quick.spiritAnimal.label', 'Zwierzę Mocy', 'Spirit Animal'), emoji: '🦋', route: 'SpiritAnimal', color: '#10B981', desc: tr('portal.quick.spiritAnimal.desc', 'Totemowy opiekun', 'Totemic guardian') },
    { label: tr('portal.quick.vedic.label', 'Jyotish', 'Jyotish'), emoji: '🪐', route: 'VedicAstrology', color: '#8B5CF6', desc: tr('portal.quick.vedic.desc', 'Astrologia wedyjska', 'Vedic astrology') },
    { label: tr('portal.quick.color.label', 'Terapia Barw', 'Color Therapy'), emoji: '🎨', route: 'ColorTherapy', color: '#EC4899', desc: tr('portal.quick.color.desc', 'Chromterapia i kolory', 'Chromotherapy and colors') },
    { label: tr('portal.quick.habits.label', 'Nawyki Duchowe', 'Spiritual Habits'), emoji: '🌟', route: 'SpiritualHabits', color: '#10B981', desc: tr('portal.quick.habits.desc', 'Śledź 12 praktyk', 'Track 12 practices') },
  ] as const), [tr]);
  const localizedZodiacInsight = useMemo(() => ({
    Aries: { element: tr('portal.zodiacInsight.aries.element', 'Ogień', 'Fire'), planet: tr('portal.zodiacInsight.aries.planet', 'Mars', 'Mars'), energy: tr('portal.zodiacInsight.aries.energy', 'Inicjatywa', 'Initiative'), advice: tr('portal.zodiacInsight.aries.advice', 'Twoja odwaga otwiera dziś drzwi, które przed innymi pozostają zamknięte. Działaj zdecydowanie — impuls jest właściwy.', 'Your courage opens doors today that remain closed to others. Act decisively — the impulse is right.') },
    Taurus: { element: tr('portal.zodiacInsight.taurus.element', 'Ziemia', 'Earth'), planet: tr('portal.zodiacInsight.taurus.planet', 'Wenus', 'Venus'), energy: tr('portal.zodiacInsight.taurus.energy', 'Trwałość', 'Stability'), advice: tr('portal.zodiacInsight.taurus.advice', 'Spokojne, pewne kroki mają dziś większą moc niż bieg. Daj sobie czas — to, co wartościowe, rośnie powoli.', 'Calm, steady steps have more power today than speed. Give yourself time — what is valuable grows slowly.') },
    Gemini: { element: tr('portal.zodiacInsight.gemini.element', 'Powietrze', 'Air'), planet: tr('portal.zodiacInsight.gemini.planet', 'Merkury', 'Mercury'), energy: tr('portal.zodiacInsight.gemini.energy', 'Komunikacja', 'Communication'), advice: tr('portal.zodiacInsight.gemini.advice', 'Słowa mają dziś wyjątkową moc. Zapisz myśl, która powraca — kryje w sobie ważne przesłanie.', 'Words carry unusual power today. Write down the thought that keeps returning — it carries an important message.') },
    Cancer: { element: tr('portal.zodiacInsight.cancer.element', 'Woda', 'Water'), planet: tr('portal.zodiacInsight.cancer.planet', 'Księżyc', 'Moon'), energy: tr('portal.zodiacInsight.cancer.energy', 'Intuicja', 'Intuition'), advice: tr('portal.zodiacInsight.cancer.advice', 'Twoje emocje są kompasem. Jeśli coś rezonuje głęboko w klatce piersiowej — zaufaj temu bezwarunkowo.', 'Your emotions are a compass. If something resonates deeply in your chest, trust it without reservation.') },
    Leo: { element: tr('portal.zodiacInsight.leo.element', 'Ogień', 'Fire'), planet: tr('portal.zodiacInsight.leo.planet', 'Słońce', 'Sun'), energy: tr('portal.zodiacInsight.leo.energy', 'Twórczość', 'Creativity'), advice: tr('portal.zodiacInsight.leo.advice', 'Bądź widoczny. Twój blask nie przyćmiewa innych — jest dla nich zaproszeniem do własnego rozkwitu.', 'Be visible. Your radiance does not dim others — it invites them into their own blooming.') },
    Virgo: { element: tr('portal.zodiacInsight.virgo.element', 'Ziemia', 'Earth'), planet: tr('portal.zodiacInsight.virgo.planet', 'Merkury', 'Mercury'), energy: tr('portal.zodiacInsight.virgo.energy', 'Precyzja', 'Precision'), advice: tr('portal.zodiacInsight.virgo.advice', 'Jeden konkretny, mały krok jest dziś wart więcej niż dziesięć zaplanowanych. Zacznij — reszta przyjdzie sama.', 'One concrete, small step is worth more today than ten planned ones. Begin — the rest will follow.') },
    Libra: { element: tr('portal.zodiacInsight.libra.element', 'Powietrze', 'Air'), planet: tr('portal.zodiacInsight.libra.planet', 'Wenus', 'Venus'), energy: tr('portal.zodiacInsight.libra.energy', 'Harmonia', 'Harmony'), advice: tr('portal.zodiacInsight.libra.advice', 'Szukaj równowagi między dawaniem a braniem. Relacja z sobą jest fundamentem każdej innej relacji.', 'Seek balance between giving and receiving. Your relationship with yourself is the foundation of every other bond.') },
    Scorpio: { element: tr('portal.zodiacInsight.scorpio.element', 'Woda', 'Water'), planet: tr('portal.zodiacInsight.scorpio.planet', 'Pluton', 'Pluto'), energy: tr('portal.zodiacInsight.scorpio.energy', 'Transformacja', 'Transformation'), advice: tr('portal.zodiacInsight.scorpio.advice', 'Nie bój się tego, co ukryte pod powierzchnią. To właśnie tam mieszka Twoja największa siła.', 'Do not fear what lies beneath the surface. That is exactly where your greatest strength lives.') },
    Sagittarius: { element: tr('portal.zodiacInsight.sagittarius.element', 'Ogień', 'Fire'), planet: tr('portal.zodiacInsight.sagittarius.planet', 'Jowisz', 'Jupiter'), energy: tr('portal.zodiacInsight.sagittarius.energy', 'Ekspansja', 'Expansion'), advice: tr('portal.zodiacInsight.sagittarius.advice', 'Rozszerz horyzont — odpowiedź, której szukasz, leży dalej niż myślisz. Zaufaj procesowi podróży.', 'Expand the horizon — the answer you seek lies farther than you think. Trust the journey.') },
    Capricorn: { element: tr('portal.zodiacInsight.capricorn.element', 'Ziemia', 'Earth'), planet: tr('portal.zodiacInsight.capricorn.planet', 'Saturn', 'Saturn'), energy: tr('portal.zodiacInsight.capricorn.energy', 'Dyscyplina', 'Discipline'), advice: tr('portal.zodiacInsight.capricorn.advice', 'Twoja wytrwałość jest cichą supermocą. Działaj spokojnie i nieustępliwie — efekty są już blisko.', 'Your perseverance is a quiet superpower. Move calmly and steadily — the results are already close.') },
    Aquarius: { element: tr('portal.zodiacInsight.aquarius.element', 'Powietrze', 'Air'), planet: tr('portal.zodiacInsight.aquarius.planet', 'Uran', 'Uranus'), energy: tr('portal.zodiacInsight.aquarius.energy', 'Innowacja', 'Innovation'), advice: tr('portal.zodiacInsight.aquarius.advice', 'Twoje niekonwencjonalne spojrzenie jest dokładnie tym, czego dziś potrzeba. Nie wpisuj się w schemat.', 'Your unconventional view is exactly what is needed today. Do not squeeze yourself into a pattern.') },
    Pisces: { element: tr('portal.zodiacInsight.pisces.element', 'Woda', 'Water'), planet: tr('portal.zodiacInsight.pisces.planet', 'Neptun', 'Neptune'), energy: tr('portal.zodiacInsight.pisces.energy', 'Wizja', 'Vision'), advice: tr('portal.zodiacInsight.pisces.advice', 'Twoja wrażliwość jest darem, nie słabością. Daj sobie dziś przestrzeń na ciszę i marzenie.', 'Your sensitivity is a gift, not a weakness. Give yourself space today for silence and dreaming.') },
  }), [tr]);
  const entryRituals = useMemo(() => ([
    { Icon: Heart, label: tr('portal.entry.gratitude.label', 'Wdzięczność', 'Gratitude'), sub: tr('portal.entry.gratitude.sub', 'Trzy rzeczy dziś', 'Three things today'), route: 'Gratitude', color: '#F472B6', emoji: '🙏', bg1: '#3B0020', bg2: '#1F0012' },
    { Icon: Star, label: tr('portal.entry.dailyCard.label', 'Karta dnia', 'Card of the day'), sub: tr('portal.entry.dailyCard.sub', 'Wróżba tarota', 'Tarot reading'), route: 'DailyTarot', color: '#CEAE72', emoji: '🔮', bg1: '#2A1A00', bg2: '#160D00' },
    { Icon: Flame, label: tr('portal.entry.aiRitual.label', 'Rytuał AI', 'AI ritual'), sub: tr('portal.entry.aiRitual.sub', 'Ceremonia prowadzona', 'Guided ceremony'), route: 'DailyRitualAI', color: '#F97316', emoji: '🔥', bg1: '#2A0E00', bg2: '#180800' },
    { Icon: BookOpen, label: tr('portal.entry.journal.label', 'Dziennik', 'Journal'), sub: tr('portal.entry.journal.sub', 'Zapisz refleksję', 'Save a reflection'), route: 'JournalEntry', color: '#34D399', emoji: '📖', bg1: '#002A1A', bg2: '#001510', params: { type: 'reflection' } },
    { Icon: Moon, label: tr('portal.entry.meditation.label', 'Medytacja', 'Meditation'), sub: tr('portal.entry.meditation.sub', 'Wyciszenie umysłu', 'Quieting the mind'), route: 'Meditation', color: '#A78BFA', emoji: '🧘', bg1: '#160A2A', bg2: '#0C0516' },
    { Icon: Sparkles, label: tr('portal.entry.affirmations.label', 'Afirmacje', 'Affirmations'), sub: tr('portal.entry.affirmations.sub', 'Codzienne wzmocnienie', 'Daily reinforcement'), route: 'Affirmations', color: '#60A5FA', emoji: '💫', bg1: '#001433', bg2: '#000A1F' },
    { Icon: Compass, label: tr('portal.entry.horoscope.label', 'Horoskop', 'Horoscope'), sub: tr('portal.entry.horoscope.sub', 'Twój znak dziś', 'Your sign today'), route: 'Horoscope', color: '#38BDF8', emoji: '⭐', bg1: '#00152A', bg2: '#000C18' },
    { Icon: EyeOff, label: tr('portal.entry.dreams.label', 'Sny', 'Dreams'), sub: tr('portal.entry.dreams.sub', 'Symbolarium snów', 'Dream symbolarium'), route: 'Dreams', color: '#818CF8', emoji: '🌙', bg1: '#0D0A2A', bg2: '#060418' },
  ]), [tr]);

  // Zodiac
  const zodiacSign = useMemo(() => {
    try {
      const { getZodiacSign } = require('../features/horoscope/utils/astrology');
      return getZodiacSign(userData.birthDate || '1990-01-01');
    } catch { return 'aries'; }
  }, [userData.birthDate]);

  useEffect(() => {
    if (!zodiacSign) return;
    if (isTodayContentFresh(zodiacSign)) return;
    let cancelled = false;
    setAiContentLoading(true);
    generateDailyContent(zodiacSign).then(content => {
      if (cancelled) return;
      if (content) setDailyAiContent(content);
      setAiContentLoading(false);
    });
    return () => { cancelled = true; };
  }, [zodiacSign]);

  const zodiacLabel = useMemo(() => {
    const labels: Record<string, string> = {
      aries: tr('portal.zodiac.aries', 'Baran', 'Aries'),
      taurus: tr('portal.zodiac.taurus', 'Byk', 'Taurus'),
      gemini: tr('portal.zodiac.gemini', 'Bliźnięta', 'Gemini'),
      cancer: tr('portal.zodiac.cancer', 'Rak', 'Cancer'),
      leo: tr('portal.zodiac.leo', 'Lew', 'Leo'),
      virgo: tr('portal.zodiac.virgo', 'Panna', 'Virgo'),
      libra: tr('portal.zodiac.libra', 'Waga', 'Libra'),
      scorpio: tr('portal.zodiac.scorpio', 'Skorpion', 'Scorpio'),
      sagittarius: tr('portal.zodiac.sagittarius', 'Strzelec', 'Sagittarius'),
      capricorn: tr('portal.zodiac.capricorn', 'Koziorożec', 'Capricorn'),
      aquarius: tr('portal.zodiac.aquarius', 'Wodnik', 'Aquarius'),
      pisces: tr('portal.zodiac.pisces', 'Ryby', 'Pisces'),
    };
    return labels[zodiacSign] || tr('portal.zodiac.yourSign', 'Twój znak', 'Your sign');
  }, [zodiacSign, tr]);

  const ZODIAC_SYMBOLS: Record<string, string> = {
    aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋', leo: '♌', virgo: '♍',
    libra: '♎', scorpio: '♏', sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
  };

  const ZODIAC_INSIGHT: Record<string, { element: string; planet: string; energy: string; advice: string }> = {
    Aries:       { element: 'Ogień',     planet: 'Mars',    energy: 'Inicjatywa',    advice: 'Twoja odwaga otwiera dziś drzwi, które przed innymi pozostają zamknięte. Działaj zdecydowanie — impuls jest właściwy.' },
    Taurus:      { element: 'Ziemia',    planet: 'Wenus',   energy: 'Trwałość',      advice: 'Spokojne, pewne kroki mają dziś większą moc niż bieg. Daj sobie czas — to, co wartościowe, rośnie powoli.' },
    Gemini:      { element: 'Powietrze', planet: 'Merkury', energy: 'Komunikacja',   advice: 'Słowa mają dziś wyjątkową moc. Zapisz myśl, która powraca — kryje w sobie ważne przesłanie.' },
    Cancer:      { element: 'Woda',      planet: 'Księżyc', energy: 'Intuicja',      advice: 'Twoje emocje są kompasem. Jeśli coś rezonuje głęboko w klatce piersiowej — zaufaj temu bezwarunkowo.' },
    Leo:         { element: 'Ogień',     planet: 'Słońce',  energy: 'Twórczość',     advice: 'Bądź widoczny. Twój blask nie przyćmiewa innych — jest dla nich zaproszeniem do własnego rozkwitu.' },
    Virgo:       { element: 'Ziemia',    planet: 'Merkury', energy: 'Precyzja',      advice: 'Jeden konkretny, mały krok jest dziś wart więcej niż dziesięć zaplanowanych. Zacznij — reszta przyjdzie sama.' },
    Libra:       { element: 'Powietrze', planet: 'Wenus',   energy: 'Harmonia',      advice: 'Szukaj równowagi między dawaniem a braniem. Relacja z sobą jest fundamentem każdej innej relacji.' },
    Scorpio:     { element: 'Woda',      planet: 'Pluton',  energy: 'Transformacja', advice: 'Nie bój się tego, co ukryte pod powierzchnią. To właśnie tam mieszka Twoja największa siła.' },
    Sagittarius: { element: 'Ogień',     planet: 'Jowisz',  energy: 'Ekspansja',     advice: 'Rozszerz horyzont — odpowiedź, której szukasz, leży dalej niż myślisz. Zaufaj procesowi podróży.' },
    Capricorn:   { element: 'Ziemia',    planet: 'Saturn',  energy: 'Dyscyplina',    advice: 'Twoja wytrwałość jest cichą supermocą. Działaj spokojnie i nieustępliwie — efekty są już blisko.' },
    Aquarius:    { element: 'Powietrze', planet: 'Uran',    energy: 'Innowacja',     advice: 'Twoje niekonwencjonalne spojrzenie jest dokładnie tym, czego dziś potrzeba. Nie wpisuj się w schemat.' },
    Pisces:      { element: 'Woda',      planet: 'Neptun',  energy: 'Wizja',         advice: 'Twoja wrażliwość jest darem, nie słabością. Daj sobie dziś przestrzeń na ciszę i marzenie.' },
  };

  const dailyHoroscope = useMemo(() => {
    // Use AI content if available and fresh for today
    if (dailyAiContent?.date === new Date().toISOString().split('T')[0] &&
        dailyAiContent?.zodiacSign === zodiacSign &&
        dailyAiContent.horoscope) {
      return dailyAiContent.horoscope;
    }
    if (i18n.language?.startsWith('en')) {
      return (localizedZodiacInsight[zodiacSign as keyof typeof localizedZodiacInsight] || localizedZodiacInsight.Aries).advice;
    }
    return getDailyHoroscope(zodiacSign, dayOfYear);
  }, [zodiacSign, dayOfYear, localizedZodiacInsight, dailyAiContent]);

  // Moon phase
  const moonPhase = useMemo(() => getMoonPhase(todayDate), [today]);

  // Numerology personal day
  const personalDay = useMemo(() => getPersonalDay(userData.birthDate || ''), [userData.birthDate, today]);

  // Day seed for deterministic pseudo-random
  const daySeed = useMemo(() => {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }, [today]);

  // Cosmic weather
  const cosmicWeather = useMemo(() => {
    const seed = daySeed;
    const overall = 3 + ((seed * 13 + seed % 7) % 3);
    const mental = 40 + ((seed * 17 + 3) % 55);
    const emotional = 40 + ((seed * 11 + 7) % 55);
    const spiritual = 40 + ((seed * 23 + 11) % 55);
    const labels = ['', '', 'Trudny dzień', 'Spokojny dzień', 'Dobry dzień', 'Wyjątkowy dzień'];
    const colors = ['', '', '#F87171', '#FBBF24', '#34D399', '#A78BFA'];
    return { overall, mental, emotional, spiritual, label: labels[overall] || 'Dobry dzień', color: colors[overall] || '#34D399' };
  }, [daySeed]);

  const zodiacSignsLocalized = useMemo(() => ([
    tr('portal.zodiac.aries', 'Baran', 'Aries'),
    tr('portal.zodiac.taurus', 'Byk', 'Taurus'),
    tr('portal.zodiac.gemini', 'Bliźnięta', 'Gemini'),
    tr('portal.zodiac.cancer', 'Rak', 'Cancer'),
    tr('portal.zodiac.leo', 'Lew', 'Leo'),
    tr('portal.zodiac.virgo', 'Panna', 'Virgo'),
    tr('portal.zodiac.libra', 'Waga', 'Libra'),
    tr('portal.zodiac.scorpio', 'Skorpion', 'Scorpio'),
    tr('portal.zodiac.sagittarius', 'Strzelec', 'Sagittarius'),
    tr('portal.zodiac.capricorn', 'Koziorożec', 'Capricorn'),
    tr('portal.zodiac.aquarius', 'Wodnik', 'Aquarius'),
    tr('portal.zodiac.pisces', 'Ryby', 'Pisces'),
  ]), [tr]);

  const planetaryPositions = useMemo(() => {
    const epoch = new Date('2000-01-01');
    const d = Math.floor((todayDate.getTime() - epoch.getTime()) / 86400000);
    const merc = getPlanetSign(d, 88, 0.2);
    const venu = getPlanetSign(d, 225, 2.7);
    const mars = getPlanetSign(d, 687, 1.3);
    const jupi = getPlanetSign(d, 4333, 4.1);
    const satu = getPlanetSign(d, 10759, 9.5);
    const mercRx = ((d / 116) % 4) < 0.65;
    const venuRx = ((d / 584) % 4) < 0.45;
    const marsRx = ((d / 780) % 4) < 0.22;
    const jupiRx = ((d / 399) % 4) < 1.0;
    const satuRx = ((d / 378) % 4) < 1.1;
    const influences: Record<string, string[]> = {
      mercury: [
        tr('portal.planets.mercury.0', 'Komunikacja płynie łatwiej niż zwykle', 'Communication flows more easily than usual'),
        tr('portal.planets.mercury.1', 'Uważaj na nieporozumienia w słowach', 'Watch for misunderstandings in words'),
        tr('portal.planets.mercury.2', 'Czas na jasność w myśleniu i wyrażaniu', 'Time for clarity in thinking and expression'),
        tr('portal.planets.mercury.3', 'Dokumenty i kontrakty sprzyjają dziś', 'Documents and contracts are supported today'),
      ],
      venus: [
        tr('portal.planets.venus.0', 'Relacje nabierają ciepła i harmonii', 'Relationships gain warmth and harmony'),
        tr('portal.planets.venus.1', 'Piękno i sztuka przynoszą dziś regenerację', 'Beauty and art bring restoration today'),
        tr('portal.planets.venus.2', 'Czas na gesty miłości i doceniania', 'Time for gestures of love and appreciation'),
        tr('portal.planets.venus.3', 'Wartości i finanse domagają się uwagi', 'Values and finances ask for attention'),
      ],
      mars: [
        tr('portal.planets.mars.0', 'Energia działania i decyzji jest wysoka', 'Energy for action and decisions is high'),
        tr('portal.planets.mars.1', 'Uważaj na impulsywność w reakcjach', 'Watch for impulsiveness in reactions'),
        tr('portal.planets.mars.2', 'Odwaga i inicjatywa są dziś nagradzane', 'Courage and initiative are rewarded today'),
        tr('portal.planets.mars.3', 'Napięcia mogą wymagać rozładowania', 'Tensions may need release'),
      ],
      jupiter: [
        tr('portal.planets.jupiter.0', 'Ekspansja i szanse otwierają się szerzej', 'Expansion and opportunities open more widely'),
        tr('portal.planets.jupiter.1', 'Optymizm przynosi realne możliwości', 'Optimism brings real possibilities'),
        tr('portal.planets.jupiter.2', 'Czas na wzrost i poszerzanie horyzontów', 'Time for growth and expanding horizons'),
        tr('portal.planets.jupiter.3', 'Nadmierne ambicje mogą przeszkadzać', 'Excessive ambition may get in the way'),
      ],
      saturn: [
        tr('portal.planets.saturn.0', 'Praca i dyscyplina przynoszą dziś plony', 'Work and discipline bear fruit today'),
        tr('portal.planets.saturn.1', 'Fundamenty wymagają sprawdzenia', 'Foundations require review'),
        tr('portal.planets.saturn.2', 'Struktury i plany długoterminowe sprzyjają', 'Structures and long-term plans are supported'),
        tr('portal.planets.saturn.3', 'Cierpliwość jest dziś najważniejszą cnotą', 'Patience is today’s most important virtue'),
      ],
    };
    const pick = (arr: string[], seed: number) => arr[seed % arr.length];
    return [
      { name: tr('portal.planetNames.mercury', 'Merkury', 'Mercury'), emoji: '☿', sign: zodiacSignsLocalized[merc], signSymbol: ZODIAC_SYMBOLS2[merc], isRetrograde: mercRx, color: '#F59E0B', influence: pick(influences.mercury, d + 1) },
      { name: tr('portal.planetNames.venus', 'Wenus', 'Venus'), emoji: '♀', sign: zodiacSignsLocalized[venu], signSymbol: ZODIAC_SYMBOLS2[venu], isRetrograde: venuRx, color: '#F472B6', influence: pick(influences.venus, d + 2) },
      { name: tr('portal.planetNames.mars', 'Mars', 'Mars'), emoji: '♂', sign: zodiacSignsLocalized[mars], signSymbol: ZODIAC_SYMBOLS2[mars], isRetrograde: marsRx, color: '#EF4444', influence: pick(influences.mars, d + 3) },
      { name: tr('portal.planetNames.jupiter', 'Jowisz', 'Jupiter'), emoji: '♃', sign: zodiacSignsLocalized[jupi], signSymbol: ZODIAC_SYMBOLS2[jupi], isRetrograde: jupiRx, color: '#F97316', influence: pick(influences.jupiter, d + 4) },
      { name: tr('portal.planetNames.saturn', 'Saturn', 'Saturn'), emoji: '♄', sign: zodiacSignsLocalized[satu], signSymbol: ZODIAC_SYMBOLS2[satu], isRetrograde: satuRx, color: '#818CF8', influence: pick(influences.saturn, d + 5) },
    ];
  }, [today, todayDate, tr, zodiacSignsLocalized]);

  const astroEvents = useMemo(() => ([
    { date: '2026-01-03', title: tr('portal.astroEvents.events.0.title', 'Kwadrantydy', 'Quadrantids'), subtitle: tr('portal.astroEvents.events.0.subtitle', 'Szczyt roju meteorów · do 120/godz.', 'Meteor shower peak · up to 120/hour'), emoji: '🌠', type: 'meteor' as const, color: '#60A5FA' },
    { date: '2026-02-17', title: tr('portal.astroEvents.events.1.title', 'Zaćmienie Słońca', 'Solar Eclipse'), subtitle: tr('portal.astroEvents.events.1.subtitle', 'Obrączkowe · widoczne częściowo', 'Annular · partially visible'), emoji: '🌑', type: 'eclipse' as const, color: '#F97316' },
    { date: '2026-03-20', title: tr('portal.astroEvents.events.2.title', 'Wiosenne Zrównanie Dnia i Nocy', 'Spring Equinox'), subtitle: tr('portal.astroEvents.events.2.subtitle', 'Równonoc · początek astrolog. wiosny', 'Equinox · beginning of astrological spring'), emoji: '🌱', type: 'equinox' as const, color: '#34D399' },
    { date: '2026-04-05', title: tr('portal.astroEvents.events.3.title', 'Superpełnia Księżyca', 'Super Full Moon'), subtitle: tr('portal.astroEvents.events.3.subtitle', 'Księżyc w perigeum · wyjątkowo jasny', 'Moon at perigee · exceptionally bright'), emoji: '🌕', type: 'supermoon' as const, color: '#FBBF24' },
    { date: '2026-04-22', title: tr('portal.astroEvents.events.4.title', 'Lirydy', 'Lyrids'), subtitle: tr('portal.astroEvents.events.4.subtitle', 'Szczyt roju meteorów · do 18/godz.', 'Meteor shower peak · up to 18/hour'), emoji: '🌠', type: 'meteor' as const, color: '#60A5FA' },
    { date: '2026-05-05', title: tr('portal.astroEvents.events.5.title', 'Eta Akwarydy', 'Eta Aquariids'), subtitle: tr('portal.astroEvents.events.5.subtitle', 'Odłamki komety Halleya · do 50/godz.', 'Halley comet debris · up to 50/hour'), emoji: '☄️', type: 'meteor' as const, color: '#A78BFA' },
    { date: '2026-06-21', title: tr('portal.astroEvents.events.6.title', 'Przesilenie Letnie', 'Summer Solstice'), subtitle: tr('portal.astroEvents.events.6.subtitle', 'Najdłuższy dzień roku', 'Longest day of the year'), emoji: '☀️', type: 'solstice' as const, color: '#FBBF24' },
    { date: '2026-08-12', title: tr('portal.astroEvents.events.7.title', 'Całkowite Zaćmienie Słońca', 'Total Solar Eclipse'), subtitle: tr('portal.astroEvents.events.7.subtitle', 'Widoczne w Azji i Arktyce', 'Visible in Asia and the Arctic'), emoji: '🌑', type: 'eclipse' as const, color: '#F97316' },
    { date: '2026-08-13', title: tr('portal.astroEvents.events.8.title', 'Perseidy', 'Perseids'), subtitle: tr('portal.astroEvents.events.8.subtitle', 'Najsłynniejszy rój · do 100/godz.', 'Most famous meteor shower · up to 100/hour'), emoji: '🌠', type: 'meteor' as const, color: '#60A5FA' },
    { date: '2026-09-23', title: tr('portal.astroEvents.events.9.title', 'Jesienne Zrównanie', 'Autumn Equinox'), subtitle: tr('portal.astroEvents.events.9.subtitle', 'Równonoc · waga dnia i nocy', 'Equinox · balance of day and night'), emoji: '🍂', type: 'equinox' as const, color: '#F59E0B' },
    { date: '2026-10-21', title: tr('portal.astroEvents.events.10.title', 'Orionidy', 'Orionids'), subtitle: tr('portal.astroEvents.events.10.subtitle', 'Odłamki komety Halleya · do 25/godz.', 'Halley comet debris · up to 25/hour'), emoji: '🌠', type: 'meteor' as const, color: '#60A5FA' },
    { date: '2026-11-17', title: tr('portal.astroEvents.events.11.title', 'Leonidy', 'Leonids'), subtitle: tr('portal.astroEvents.events.11.subtitle', 'Rój Lwa · do 15/godz.', 'Lion shower · up to 15/hour'), emoji: '🌠', type: 'meteor' as const, color: '#60A5FA' },
    { date: '2026-12-13', title: tr('portal.astroEvents.events.12.title', 'Geminidy', 'Geminids'), subtitle: tr('portal.astroEvents.events.12.subtitle', 'Najlepszy rój roku · do 120/godz.', 'Best shower of the year · up to 120/hour'), emoji: '✨', type: 'meteor' as const, color: '#34D399' },
    { date: '2026-12-21', title: tr('portal.astroEvents.events.13.title', 'Przesilenie Zimowe', 'Winter Solstice'), subtitle: tr('portal.astroEvents.events.13.subtitle', 'Najkrótszy dzień · noc przesilenia', 'Shortest day · night of solstice'), emoji: '🕯️', type: 'solstice' as const, color: '#818CF8' },
  ]), [tr]);

  const upcomingAstroEvents = useMemo(() => {
    return astroEvents
      .map(ev => ({
        ...ev,
        daysUntil: Math.ceil((new Date(ev.date).getTime() - todayDate.getTime()) / 86400000),
      }))
      .filter(ev => ev.daysUntil >= 0 && ev.daysUntil <= 90)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3);
  }, [todayDate, astroEvents]);

  // Energy rings
  const energyRings = useMemo(() => {
    const score = dailyPlan.energyScore;
    const p = Math.min(100, Math.max(0, score + ((daySeed * 7) % 20) - 10));
    const e = Math.min(100, Math.max(0, score + ((daySeed * 11) % 24) - 12));
    const s = Math.min(100, Math.max(0, score + ((daySeed * 17) % 28) - 14));
    return { physical: p, emotional: e, spiritual: s };
  }, [dailyPlan.energyScore, daySeed]);

  const showStars = experience.motionStyle !== 'quiet';

  const allWidgets = useMemo(
    () => [...portalWidgets].sort((a, b) => a.order - b.order),
    [portalWidgets]
  );

  const recentEntries = useMemo(() => entries.slice(-3).reverse(), [entries]);

  const handleCopyAffirmation = useCallback(() => {
    Share.share({ message: displayAffirmation.text });
    setCopiedAffirmation(true);
    void HapticsService.selection();
    if (copiedAffirmationTimerRef.current) clearTimeout(copiedAffirmationTimerRef.current);
    copiedAffirmationTimerRef.current = setTimeout(() => setCopiedAffirmation(false), 2000);
  }, [displayAffirmation.text]);

  const handleNextAffirmation = useCallback(() => {
    void HapticsService.selection();
    setAffirmationIndex(prev => prev + 1);
  }, []);

  const handleChecklistToggle = useCallback((key: string) => {
    updateDailyProgress(today, { [key]: !(todayProgress as any)[key] });
  }, [today, todayProgress, updateDailyProgress]);

  // ── Widget renderers ──────────────────────────────────────────────────────

  const renderPlanetaryPositions = () => (
    <Pressable onPress={() => navigation.navigate('AstroTransits')} style={[ps.planetCard, { backgroundColor: cardBg, borderColor: '#818CF844' }]}>
      <LinearGradient colors={['rgba(129,140,248,0.12)', 'rgba(99,102,241,0.06)', 'transparent'] as const} style={StyleSheet.absoluteFill} />
      <View style={{ gap: 6 }}>
        {planetaryPositions.map((planet, i) => (
          <View key={planet.name} style={[ps.planetRow, { borderColor: planet.color + '28' }]}>
            {/* Colored left accent bar */}
            <View style={[ps.planetAccentBar, { backgroundColor: planet.color }]} />
            {/* Large emoji badge */}
            <View style={[ps.planetEmojiBadge, { backgroundColor: planet.color + '1A' }]}>
              <Text style={{ fontSize: 22 }}>{planet.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={{ color: planet.color, fontSize: 15, fontWeight: '700' }}>{planet.name}</Text>
                <Text style={{ color: isLight ? '#5A3E22' : '#C4B5AA', fontSize: 13, fontWeight: '500' }}>
                  w
                </Text>
                <Text style={{ color: planet.color + 'CC', fontSize: 13, fontWeight: '600' }}>
                  {planet.sign} {planet.signSymbol}
                </Text>
                {planet.isRetrograde && (
                  <View style={[ps.retroPill, { backgroundColor: '#F87171' + '1A', borderColor: '#F87171' + '66' }]}>
                    <Text style={{ color: '#F87171', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>{t('portal.retro', '℞ RETRO')}</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: isLight ? '#5A3E22' : 'rgba(245,241,234,0.55)', fontSize: 11, lineHeight: 16, marginTop: 2 }} numberOfLines={1}>{planet.influence}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10, gap: 4 }}>
        <Text style={{ color: '#818CF8', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>{tr('portal.planetaryPositions.details', 'Tranzyty szczegółowo', 'Transit details')}</Text>
        <ChevronRight size={12} color="#818CF8" />
      </View>
    </Pressable>
  );

  const renderAstroEvents = () => (
    <View style={{ gap: 8 }}>
      {upcomingAstroEvents.length === 0 ? (
        <View style={[ps.wCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={{ color: isLight ? '#5A3E22' : 'rgba(245,241,234,0.55)', fontSize: 13, textAlign: 'center' }}>
            {tr('portal.astroEvents.empty', 'Brak wydarzeń w ciągu najbliższych 90 dni', 'No events in the next 90 days')}
          </Text>
        </View>
      ) : upcomingAstroEvents.map((event, i) => (
        <Animated.View key={event.date + i} entering={FadeInDown.delay(60 + i * 40).duration(260)}>
          <View style={[ps.astroEventCard, { backgroundColor: cardBg, borderColor: event.color + '55',
            shadowColor: event.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 5 }]}>
            <LinearGradient colors={[event.color + '18', event.color + '06', 'transparent'] as const} style={StyleSheet.absoluteFill} />
            {/* Left accent bar */}
            <View style={[ps.planetAccentBar, { backgroundColor: event.color, alignSelf: 'stretch', height: 'auto', width: 3, borderRadius: 3 }]} />
            <View style={{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: event.color + '22',
              borderWidth: 1, borderColor: event.color + '44', marginRight: 2 }}>
              <Text style={{ fontSize: 26 }}>{event.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <View style={{ paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 8, backgroundColor: event.color + '22', borderWidth: 1, borderColor: event.color + '44' }}>
                  <Text style={{ color: event.color, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }}>
                    {event.daysUntil === 0
                      ? tr('portal.astroEvents.today', 'DZIŚ', 'TODAY')
                      : event.daysUntil === 1
                        ? tr('portal.astroEvents.tomorrow', 'JUTRO', 'TOMORROW')
                        : tr('portal.astroEvents.inDays', 'ZA {{count}} DNI', 'IN {{count}} DAYS', { count: event.daysUntil })}
                  </Text>
                </View>
                <Text style={{ color: isLight ? '#5A3E22' : 'rgba(245,241,234,0.45)', fontSize: 10 }}>
                  {new Date(event.date).toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'long' })}
                </Text>
              </View>
              <Text style={{ color: textColor, fontSize: 14, fontWeight: '700', marginBottom: 2 }}>{event.title}</Text>
              <Text style={{ color: isLight ? '#5A3E22' : 'rgba(245,241,234,0.60)', fontSize: 12, lineHeight: 17 }}>{event.subtitle}</Text>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const renderDailyAffirmation = () => (
    <View style={[ps.affCard, { borderColor: catColor + '44' }]}>
      <LinearGradient colors={[catColor + '22', catColor + '08', 'transparent'] as const} style={StyleSheet.absoluteFill} />
      <View style={ps.affHeader}>
        <View style={[ps.affCatBadge, { backgroundColor: catColor + '22', borderColor: catColor + '44' }]}>
          <Text style={[ps.affCatText, { color: catColor }]}>✦ {categoryLabels[affirmation.category] || CATEGORY_LABELS[affirmation.category]}</Text>
        </View>
        <Text style={[ps.affEyebrow, { color: catColor }]}>{t('portal.afirmacja_dnia', '💫 AFIRMACJA DNIA')}</Text>
      </View>
      <Text style={[ps.affText, { color: textColor }]}>{displayAffirmation.text}</Text>
      <View style={ps.affFooter}>
        <Pressable onPress={handleCopyAffirmation} style={[ps.affBtn, { borderColor: catColor + '44', backgroundColor: catColor + '14' }]}>
          <Text style={{ color: catColor, fontSize: 12, fontWeight: '700' }}>
            {copiedAffirmation
              ? tr('portal.affirmation.copied', '✓ Skopiowano', '✓ Copied')
              : tr('portal.affirmation.copy', 'Kopiuj', 'Copy')}
          </Text>
        </Pressable>
        <Pressable onPress={handleNextAffirmation} style={[ps.affBtn, { borderColor: catColor + '44', backgroundColor: catColor + '14' }]}>
          <Text style={{ color: catColor, fontSize: 12, fontWeight: '700' }}>{tr('portal.affirmation.next', 'Następna →', 'Next →')}</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderMoonPhase = () => (
    <Pressable onPress={() => navigation.navigate('LunarCalendar')} style={[ps.wCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <LinearGradient colors={['#A78BFA14', 'transparent'] as const} style={StyleSheet.absoluteFill} />
      <View style={ps.wRow}>
        <View style={[ps.wIconWrap, { backgroundColor: '#A78BFA20' }]}>
          <Text style={{ fontSize: 30 }}>{moonPhase.emoji}</Text>
        </View>
        <View style={ps.wText}>
          <Text style={[ps.wEyebrow, { color: '#A78BFA' }]}>{tr('portal.moonPhase.eyebrow', '☽ FAZA KSIĘŻYCA', '☽ MOON PHASE')}</Text>
          <Text style={[ps.wTitle, { color: textColor }]}>{moonPhase.name}</Text>
          <Text style={[ps.wSub, { color: subColor }]}>{moonPhase.illumination}% {tr('portal.moonPhase.illumination', 'oświetlenia', 'illumination')}</Text>
        </View>
        <ChevronRight color={subColor} size={16} />
      </View>
      <View style={[ps.moonAdviceBox, { borderColor: '#A78BFA33', backgroundColor: '#A78BFA0A' }]}>
        <Text style={[ps.moonAdviceText, { color: subColor }]}>{moonPhase.advice}</Text>
      </View>
    </Pressable>
  );

  const renderTarotCard = () => (
    <Pressable onPress={() => navigation.navigate('DailyTarot')} style={[ps.wCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <LinearGradient colors={['#CEAE7214', 'transparent'] as const} style={StyleSheet.absoluteFill} />
      <View style={ps.wRow}>
        <View style={[ps.wIconWrap, { backgroundColor: '#CEAE7220' }]}>
          {dailyDraw ? (
            <View style={{ width: 32, height: 44, borderRadius: 6, backgroundColor: '#2D1760', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#CEAE7244' }}>
              <Text style={{ fontSize: 16 }}>🔮</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 26 }}>🃏</Text>
          )}
        </View>
        <View style={ps.wText}>
          <Text style={[ps.wEyebrow, { color: '#CEAE72' }]}>{tr('portal.tarot.eyebrow', '🃏 KARTA DNIA', '🃏 CARD OF THE DAY')}</Text>
          <Text style={[ps.wTitle, { color: textColor }]} numberOfLines={1}>
            {dailyDraw ? resolveUserFacingText(dailyDraw.card.name) : tr('portal.tarot.discoverCard', 'Odkryj kartę dnia', 'Reveal the card of the day')}
          </Text>
          <Text style={[ps.wSub, { color: subColor }]}>
            {dailyDraw
              ? (dailyDraw.isReversed
                ? tr('portal.tarot.reversedTap', 'Karta odwrócona · dotknij po interpretację', 'Reversed card · tap for interpretation')
                : tr('portal.tarot.uprightTap', 'Karta prosto · dotknij po interpretację', 'Upright card · tap for interpretation'))
              : tr('portal.tarot.tapToReveal', 'Dotknij, aby odsłonić swój symbol dnia', 'Tap to reveal your symbol of the day')}
          </Text>
        </View>
        <ChevronRight color={subColor} size={16} />
      </View>
    </Pressable>
  );

  const renderEnergy = () => {
    const score = dailyPlan.energyScore;
    const barW = (SW - SP * 2 - 40 - 32) * Math.min(score, 100) / 100;
    const eColor = score >= 70 ? '#34D399' : score >= 40 ? '#FBBF24' : '#F87171';
    return (
      <View style={[ps.wCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <LinearGradient colors={[eColor + '10', 'transparent'] as const} style={StyleSheet.absoluteFill} />
        <View style={ps.wRow}>
          <View style={[ps.wIconWrap, { backgroundColor: eColor + '20' }]}>
            <Zap color={eColor} size={22} strokeWidth={1.8} />
          </View>
          <View style={[ps.wText, { gap: 6 }]}>
            <Text style={[ps.wEyebrow, { color: eColor }]}>{tr('portal.energy.eyebrow', 'ENERGIA DNIA', 'ENERGY OF THE DAY')}</Text>
            <View style={[ps.barTrack, isLight && { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
              <View style={[ps.barFill, { width: barW, backgroundColor: eColor }]} />
            </View>
            <Text style={[ps.wSub, { color: subColor }]}>{score}% — {dailyPlan.archetype?.name || tr('portal.energy.yourArchetype', 'Twój archetyp', 'Your archetype')}</Text>
          </View>
          <Text style={[ps.energyScore, { color: eColor }]}>{score}%</Text>
        </View>
      </View>
    );
  };

  const renderStreak = () => (
    <View style={[ps.wCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <LinearGradient colors={['#FB923C14', 'transparent'] as const} style={StyleSheet.absoluteFill} />
      <View style={ps.wRow}>
        <View style={[ps.wIconWrap, { backgroundColor: '#FB923C20' }]}>
          <Flame color="#FB923C" size={22} strokeWidth={1.8} />
        </View>
        <View style={ps.wText}>
          <Text style={[ps.wEyebrow, { color: '#FB923C' }]}>{tr('portal.streak.eyebrow', 'PASMO OBECNOŚCI', 'PRESENCE STREAK')}</Text>
          <Text style={[ps.wTitle, { color: textColor }]}>{streaks.current} {tr('portal.streak.daysInRow', 'dni z rzędu', 'days in a row')}</Text>
          <Text style={[ps.wSub, { color: subColor }]}>{tr('portal.streak.record', 'Rekord', 'Record')}: {streaks.highest} {tr('portal.streak.days', 'dni', 'days')}</Text>
        </View>
        <View style={ps.streakBadge}>
          <Text style={ps.streakNum}>{streaks.current}</Text>
          <Text style={ps.streakFire}>🔥</Text>
        </View>
      </View>
    </View>
  );

  const renderHoroscope = () => {
    const insight = localizedZodiacInsight[zodiacSign as keyof typeof localizedZodiacInsight] || localizedZodiacInsight.Aries;
    const signKey = (zodiacSign || 'aries').toLowerCase();
    return (
      <Pressable onPress={() => navigation.navigate('Horoscope')} style={[ps.horoCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <LinearGradient colors={['#60A5FA18', '#7C3AED0A', 'transparent'] as const} style={StyleSheet.absoluteFill} />
        <View style={[ps.horoHeader, { borderBottomColor: cardBorder }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[ps.horoSymbolBadge, { backgroundColor: '#60A5FA20', borderColor: '#60A5FA44' }]}>
              <Text style={{ fontSize: 22, color: '#60A5FA' }}>{ZODIAC_SYMBOLS[signKey] || '♈'}</Text>
            </View>
            <View>
              <Text style={[ps.wEyebrow, { color: '#60A5FA' }]}>{tr('portal.horoscope.eyebrow', '✦ HOROSKOP DNIA', '✦ DAILY HOROSCOPE')}</Text>
              <Text style={[ps.horoSignName, { color: textColor }]}>{zodiacLabel}</Text>
            </View>
          </View>
          <ChevronRight color={subColor} size={18} />
        </View>
        <Text style={[ps.horoText, { color: isLight ? '#3A2C20' : '#E8DFD0' }]}>{dailyHoroscope}</Text>
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: cardBorder, marginHorizontal: 16 }} />
        <View style={{ flexDirection: 'row', gap: 8, padding: 12, paddingTop: 10 }}>
          {[
            { label: tr('portal.horoscope.element', 'Żywioł', 'Element'), value: insight.element },
            { label: tr('portal.horoscope.planet', 'Planeta', 'Planet'), value: insight.planet },
            { label: tr('portal.horoscope.energy', 'Energia', 'Energy'), value: insight.energy },
          ].map((item) => (
            <View key={item.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 10, backgroundColor: '#60A5FA0E', borderWidth: 1, borderColor: '#60A5FA22' }}>
              <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: '#60A5FA', marginBottom: 2 }}>{item.label.toUpperCase()}</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: isLight ? '#3A2C20' : '#E8DFD0' }}>{item.value}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginHorizontal: 16, marginBottom: 14, padding: 12, borderRadius: 12, backgroundColor: '#60A5FA0A', borderWidth: 1, borderColor: '#60A5FA1C' }}>
          <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 1.4, color: '#60A5FA', marginBottom: 5 }}>{tr('portal.horoscope.tip', '✦ WSKAZÓWKA NA DZIŚ', '✦ TODAY’S TIP')}</Text>
          <Text style={{ fontSize: 13, lineHeight: 20, fontStyle: 'italic', color: isLight ? '#4A3A28' : '#D8D0F0', fontWeight: '400' }}>{insight.advice}</Text>
        </View>
      </Pressable>
    );
  };

  const renderJournalPrompt = () => (
    <Pressable
      onPress={() => navigation.navigate('JournalEntry', { prompt: dailyPlan.journalPrompt, type: 'reflection' })}
      style={[ps.wCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
    >
      <LinearGradient colors={['#34D39914', 'transparent'] as const} style={StyleSheet.absoluteFill} />
      <View style={ps.wRow}>
        <View style={[ps.wIconWrap, { backgroundColor: '#34D39920' }]}>
          <BookOpen color="#34D399" size={22} strokeWidth={1.8} />
        </View>
        <View style={ps.wText}>
          <Text style={[ps.wEyebrow, { color: '#34D399' }]}>{tr('portal.journalPrompt.eyebrow', 'PROMPT DZIENNIKA', 'JOURNAL PROMPT')}</Text>
          <Text style={[ps.wTitle, { color: textColor }]} numberOfLines={2}>
            {dailyPlan.journalPrompt || tr('portal.journalPrompt.fallback', 'Co dziś chcesz zapamiętać?', 'What do you want to remember today?')}
          </Text>
        </View>
        <ChevronRight color={subColor} size={16} />
      </View>
    </Pressable>
  );

  const renderArchetype = () => (
    <View style={[ps.wCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <LinearGradient colors={['#FB923C14', 'transparent'] as const} style={StyleSheet.absoluteFill} />
      <View style={ps.wRow}>
        <View style={[ps.wIconWrap, { backgroundColor: '#FB923C20' }]}>
          <Text style={{ fontSize: 22 }}>🏛</Text>
        </View>
        <View style={ps.wText}>
          <Text style={[ps.wEyebrow, { color: '#FB923C' }]}>{tr('portal.archetype.eyebrow', 'ARCHETYP DNIA', 'ARCHETYPE OF THE DAY')}</Text>
          <Text style={[ps.wTitle, { color: textColor }]}>{dailyPlan.archetype?.name || tr('portal.archetype.fallback', 'Archetyp', 'Archetype')}</Text>
          <Text style={[ps.wSub, { color: subColor }]} numberOfLines={1}>
            {dailyPlan.archetype?.title || tr('portal.archetype.sub', 'Energia prowadząca ten dzień', 'The energy guiding this day')}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderNumerology = () => {
    let lifePathNum = '?';
    try {
      const { calculateMatrix } = require('../features/matrix/utils/numerology');
      const mat = calculateMatrix(userData.birthDate || '1995-01-01');
      lifePathNum = String(mat?.lifePath ?? '?');
    } catch { /* ignore */ }
    return (
      <Pressable onPress={() => navigation.navigate('Numerology')} style={[ps.wCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <LinearGradient colors={['#A78BFA14', 'transparent'] as const} style={StyleSheet.absoluteFill} />
        <View style={ps.wRow}>
          <View style={[ps.wIconWrap, { backgroundColor: '#A78BFA20' }]}>
            <Text style={{ fontSize: 22 }}>🔢</Text>
          </View>
          <View style={ps.wText}>
            <Text style={[ps.wEyebrow, { color: '#A78BFA' }]}>{tr('portal.numerology.eyebrow', 'NUMEROLOGIA', 'NUMEROLOGY')}</Text>
            <Text style={[ps.wTitle, { color: textColor }]}>{tr('portal.numerology.lifePath', 'Ścieżka życia', 'Life path')}: {lifePathNum}</Text>
            <Text style={[ps.wSub, { color: subColor }]}>{tr('portal.numerology.sub', 'Rok osobisty i wibracja dnia', 'Personal year and vibration of the day')}</Text>
          </View>
          <ChevronRight color={subColor} size={16} />
        </View>
      </Pressable>
    );
  };

  const renderRitual = () => {
    const ritual = dailyPlan.ritualGuidance?.featured;
    return (
      <Pressable
        onPress={() => ritual
          ? navigation.navigate('RitualDetail', { ritual, source: 'portal' })
          : navigation.navigate('RitualCategorySelection')}
        style={[ps.wCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
      >
        <LinearGradient colors={['#CEAE7214', 'transparent'] as const} style={StyleSheet.absoluteFill} />
        <View style={ps.wRow}>
          <View style={[ps.wIconWrap, { backgroundColor: '#CEAE7220' }]}>
            <Text style={{ fontSize: 22 }}>🕯</Text>
          </View>
          <View style={ps.wText}>
            <Text style={[ps.wEyebrow, { color: '#CEAE72' }]}>{tr('portal.ritual.eyebrow', '🕯️ RYTUAŁ DNIA', '🕯️ RITUAL OF THE DAY')}</Text>
            <Text style={[ps.wTitle, { color: textColor }]} numberOfLines={1}>
              {ritual?.title || tr('portal.ritual.choose', 'Wybierz rytuał dnia', 'Choose the ritual of the day')}
            </Text>
            <Text style={[ps.wSub, { color: subColor }]}>
              {ritual?.duration || tr('portal.ritual.defaultDuration', '5 min', '5 min')} · {ritual?.category || tr('portal.ritual.defaultCategory', 'Ceremonial', 'Ceremonial')}
            </Text>
          </View>
          <ChevronRight color={subColor} size={16} />
        </View>
      </Pressable>
    );
  };

  const renderDailyCrystal = () => {
    const crystal = crystals[daySeed % crystals.length];
    return (
      <Pressable onPress={() => navigation.navigate('CrystalBall', { mode: 'daily' })} style={[ps.wCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <LinearGradient colors={[(crystal.color + '14') as any, 'transparent'] as const} style={StyleSheet.absoluteFill} />
        <View style={ps.wRow}>
          <View style={[ps.wIconWrap, { backgroundColor: crystal.color + '20' }]}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: crystal.color, opacity: 0.85 }} />
          </View>
          <View style={ps.wText}>
            <Text style={[ps.wEyebrow, { color: crystal.color }]}>{tr('portal.crystals.eyebrow', 'KRYSZTAŁ DNIA', 'CRYSTAL OF THE DAY')}</Text>
            <Text style={[ps.wTitle, { color: textColor }]}>{crystal.name}</Text>
            <Text style={[ps.wSub, { color: subColor }]} numberOfLines={2}>{crystal.benefit}</Text>
          </View>
          <ChevronRight color={subColor} size={16} />
        </View>
      </Pressable>
    );
  };

  const renderChakraFocus = () => {
    const chakra = chakras[new Date().getDay() % chakras.length];
    return (
      <Pressable onPress={() => navigation.navigate('Chakra')} style={[ps.wCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <LinearGradient colors={[(chakra.color + '14') as any, 'transparent'] as const} style={StyleSheet.absoluteFill} />
        <View style={ps.wRow}>
          <View style={[ps.wIconWrap, { backgroundColor: chakra.color + '20' }]}>
            <Text style={{ fontSize: 26 }}>{chakra.emoji}</Text>
          </View>
          <View style={ps.wText}>
            <Text style={[ps.wEyebrow, { color: chakra.color }]}>{tr('portal.chakras.eyebrow', '⚡ CZAKRA DNIA', '⚡ CHAKRA OF THE DAY')}</Text>
            <Text style={[ps.wTitle, { color: textColor }]}>{chakra.polish}</Text>
            <Text style={[ps.wSub, { color: subColor, fontStyle: 'italic' }]} numberOfLines={1}>{chakra.affirmation}</Text>
          </View>
          <ChevronRight color={subColor} size={16} />
        </View>
      </Pressable>
    );
  };

  const renderBreathingReminder = () => {
    const sessionCount = breathworkSessions.length;
    return (
      <View style={[ps.wCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <LinearGradient colors={['#38BDF814', 'transparent'] as const} style={StyleSheet.absoluteFill} />
        <View style={ps.wRow}>
          <View style={[ps.wIconWrap, { backgroundColor: '#38BDF820' }]}>
            <Wind color="#38BDF8" size={22} strokeWidth={1.8} />
          </View>
          <View style={ps.wText}>
            <Text style={[ps.wEyebrow, { color: '#38BDF8' }]}>{tr('portal.breath.eyebrow', '🌬️ ODDECH', '🌬️ BREATH')}</Text>
            <Text style={[ps.wTitle, { color: textColor }]}>{tr('portal.breath.title', 'Wejdź w 3 świadome oddechy', 'Enter 3 conscious breaths')}</Text>
            <Text style={[ps.wSub, { color: subColor }]}>
              {sessionCount > 0
                ? tr('portal.breath.completedSessions', '{{count}} sessions completed', '{{count}} sessions completed', { count: sessionCount })
                : tr('portal.breath.subtitle', 'Świadomy oddech koi układ nerwowy', 'Conscious breathing calms the nervous system')}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {breathSteps.map((step) => (
            <View key={step.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, backgroundColor: step.col + '18', borderWidth: 1, borderColor: step.col + '44' }}>
              <Text style={{ color: step.col, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 }}>{step.label}</Text>
              <Text style={{ color: step.col, fontSize: 15, fontWeight: '800', marginTop: 2 }}>{step.dur}</Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={() => navigation.navigate('Breathwork')}
          style={{ marginTop: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#38BDF820', alignItems: 'center', borderWidth: 1, borderColor: '#38BDF844' }}
        >
          <Text style={{ color: '#38BDF8', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>{tr('portal.breath.start', 'Zacznij', 'Start')}</Text>
        </Pressable>
      </View>
    );
  };

  const renderEnergyForecast = () => {
    const scores = [0, 1, 2].map(offset => {
      const seed = daySeed + offset;
      return 45 + (seed * 17 + seed % 7 * 11) % 46;
    });
    return (
      <Pressable onPress={() => navigation.navigate('Reports')} style={[ps.wCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <LinearGradient colors={['#34D39914', 'transparent'] as const} style={StyleSheet.absoluteFill} />
        <View style={{ padding: 4 }}>
          <Text style={[ps.wEyebrow, { color: '#34D399', marginBottom: 12 }]}>{tr('portal.forecast.eyebrow', 'PROGNOZA ENERGII — 3 DNI', 'ENERGY FORECAST — 3 DAYS')}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {scores.map((score, i) => {
              const eColor = score >= 70 ? '#34D399' : score >= 40 ? '#FBBF24' : '#F87171';
              const barH = 4 + (score / 100) * 36;
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                  <View style={{ width: '100%', height: 40, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <View style={{ width: 20, height: barH, borderRadius: 4, backgroundColor: eColor, opacity: i === 0 ? 1 : 0.65 }} />
                  </View>
                  <Text style={{ color: eColor, fontSize: 13, fontWeight: '700' }}>{score}%</Text>
                  <Text style={{ color: subColor, fontSize: 10, fontWeight: '600' }}>{forecastDays[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderGratitudeStreak = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const allDates = [...new Set(gratitudeEntries.map((e: GratitudeEntry) => e.date))] as string[];
    const streak = (() => {
      const dates = [...allDates].sort().reverse();
      let s = 0;
      let cursor = new Date();
      for (const d of dates) {
        const expected = cursor.toISOString().split('T')[0];
        if (d === expected) { s++; cursor.setDate(cursor.getDate() - 1); }
        else break;
      }
      return s;
    })();
    const last7 = Array.from({ length: 7 }, (_, k) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - k));
      return allDates.includes(d.toISOString().split('T')[0]);
    });
    return (
      <Pressable onPress={() => navigation.navigate('Gratitude')} style={[ps.wCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <LinearGradient colors={['#F472B614', 'transparent'] as const} style={StyleSheet.absoluteFill} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={[ps.wIconWrap, { backgroundColor: '#F472B620' }]}>
            <Heart color="#F472B6" size={22} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[ps.wEyebrow, { color: '#F472B6' }]}>{tr('portal.gratitude.streak', 'PASMO WDZIĘCZNOŚCI', 'GRATITUDE STREAK')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={{ color: '#F472B6', fontSize: 36, fontWeight: '800', lineHeight: 42 }}>{streak}</Text>
              <Text style={{ color: subColor, fontSize: 13 }}>{t('portal.dni_wdziecznos', 'dni wdzięczności')}</Text>
            </View>
            <Text style={[ps.wSub, { color: subColor }]}>
              {todayGratitude.length > 0 ? `Dziś: ${todayGratitude.length} zapisów` : 'Dodaj dzisiaj swoje podziękowania'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 14, justifyContent: 'center' }}>
          {last7.map((active, k) => (
            <View key={k} style={{ width: 28, height: 8, borderRadius: 4, backgroundColor: active ? '#F472B6' : '#F472B630' }} />
          ))}
        </View>
      </Pressable>
    );
  };

  const WIDGET_RENDERERS: Record<WidgetId, () => React.ReactNode> = {
    daily_affirmation: renderDailyAffirmation,
    moon_phase: renderMoonPhase,
    tarot_card: renderTarotCard,
    energy: renderEnergy,
    streak: renderStreak,
    horoscope: renderHoroscope,
    journal_prompt: renderJournalPrompt,
    archetype: renderArchetype,
    numerology: renderNumerology,
    ritual: renderRitual,
    daily_crystal: renderDailyCrystal,
    chakra_focus: renderChakraFocus,
    breathing_reminder: renderBreathingReminder,
    energy_forecast: renderEnergyForecast,
    gratitude_streak: renderGratitudeStreak,
  };

  // ── Page state ────────────────────────────────────────────────────────────

  const [activePage, setActivePage] = useState(0);
  const pageScrollRef = useRef<ScrollView>(null);
  const goToPage = (page: number) => {
    pageScrollRef.current?.scrollTo({ x: page * SW, animated: true });
    setActivePage(page);
  };

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <View style={[ps.root, { backgroundColor: isLight ? '#FAF7F2' : '#07080F' }]}>

      {/* Animated star background */}
      {showStars && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {STAR_POSITIONS.map((star, i) => (
            <StarParticle key={i} {...star} />
          ))}
        </View>
      )}

      <SafeAreaView edges={['top']} style={ps.safe}>

        {/* Brand + settings row */}
        <Animated.View entering={FadeInDown.duration(280)} style={[ps.brandRow, { borderBottomColor: isLight ? 'rgba(169,122,57,0.14)' : 'rgba(206,174,114,0.12)' }]}>
          <Animated.View style={shimmerStyle}>
            <Text style={[ps.brandName, { color: isLight ? '#A97A39' : '#CEAE72' }]}>{t('portal.aethera_1', '✦ AETHERA')}</Text>
          </Animated.View>
          <Text style={[ps.brandTagline, { color: isLight ? '#8A6A40' : 'rgba(206,174,114,0.65)' }]}>
            {t('portal.duniai_oracle_twoj_portal', 'DuniAI & Oracle · Twój portal')}
          </Text>
          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable
              onPress={() => navigation.navigate('Search')}
              hitSlop={8}
              style={{ padding: 4, borderRadius: 8 }}
            >
              <Search size={18} color={isLight ? '#A97A39' : '#CEAE72'} strokeWidth={1.8} />
            </Pressable>
            <MusicToggleButton color={isLight ? '#A97A39' : '#CEAE72'} size={18} />
            {!isPremium && (
              <Pressable
                onPress={() => navigation.navigate('Paywall')}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
                  backgroundColor: 'rgba(206,174,114,0.12)',
                  borderWidth: 1, borderColor: 'rgba(206,174,114,0.35)',
                }}
              >
                <Crown size={13} color="#CEAE72" strokeWidth={1.8} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#CEAE72', letterSpacing: 0.3 }}>{t('portal.premium', 'Premium')}</Text>
              </Pressable>
            )}
            {isPremium && (
              <Pressable onPress={() => navigation.navigate('Paywall')} style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
                backgroundColor: 'rgba(206,174,114,0.12)',
                borderWidth: 1, borderColor: 'rgba(206,174,114,0.35)',
              }}>
                <Crown size={12} color="#CEAE72" strokeWidth={2} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#CEAE72', letterSpacing: 0.2 }}>{t('portal.mistrz', 'Mistrz')}</Text>
              </Pressable>
            )}
            <Pressable onPress={() => navigation.navigate('Profile')} style={{ padding: 4 }}>
              <Settings size={18} color={subColor} strokeWidth={1.8} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(250)} style={ps.header}>
          <View style={{ flex: 1 }}>
            <Text style={[ps.headerDate, { color: subColor }]}>{formatDate()}</Text>
            <Text style={[ps.headerGreet, { color: textColor }]}>{getPortalGreeting(userData.name)}</Text>
          </View>
        </Animated.View>

        {/* Page tabs — glass pill style */}
        <View style={[ps.pageTabs, { borderBottomColor: isLight ? 'rgba(139,100,42,0.18)' : 'rgba(255,255,255,0.07)' }]}>
          {[
            { label: t('portal.twoj_portal', '✦ Twój Portal'), idx: 0 },
            { label: t('portal.kosmos', '🪐 Kosmos'), idx: 1 },
          ].map(({ label, idx }) => {
            const active = activePage === idx;
            return (
              <Pressable key={idx} onPress={() => goToPage(idx)} style={[ps.pageTab, { borderBottomColor: 'transparent' }]}>
                {active && (
                  <LinearGradient
                    colors={[accentColor + '22', accentColor + '08']}
                    start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                    style={{ position: 'absolute', left: 6, right: 6, top: 4, bottom: 4, borderRadius: 10 }}
                    pointerEvents="none"
                  />
                )}
                <Text style={[ps.pageTabText, { color: active ? accentColor : subColor }]}>{label}</Text>
                {active && (
                  <LinearGradient
                    colors={[accentColor, accentColor + '55']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ position: 'absolute', bottom: 0, left: 16, right: 16, height: 2, borderRadius: 1 }}
                    pointerEvents="none"
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Two-page horizontal pager */}
        <ScrollView
          ref={pageScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => setActivePage(Math.round(e.nativeEvent.contentOffset.x / SW))}
          style={{ flex: 1 }}
        >

          {/* ═══════════ PAGE 1: TWÓJ PORTAL ═══════════ */}
          <ScrollView
            style={{ width: SW }}
            contentContainerStyle={[ps.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') + 90 }]}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            overScrollMode="never"
          >

          {/* ── 1. AetherEye 3D hero ── */}
          <Animated.View entering={FadeInDown.duration(320)} style={{ marginBottom: 8, marginHorizontal: -SP }}>
            <AetherEye accent={accentColor} isLight={isLight} />
          </Animated.View>

          {/* ── 2. Soul message / greeting card ── */}
          {!!dailyCache.soulMessage && (
            <Animated.View entering={FadeInDown.delay(50).duration(280)} style={{ marginBottom: 18, borderRadius: 18, overflow: 'hidden', shadowColor: accentColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 8 }}>
              <BlurView intensity={isLight ? 55 : 35} tint={isLight ? 'light' : 'dark'} style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: isLight ? 'rgba(255,255,255,0.72)' : accentColor + '28' }}>
                <View style={{ flexDirection: 'row', gap: 14, padding: 16, backgroundColor: isLight ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.04)' }}>
                  <LinearGradient colors={[accentColor + '18', 'transparent'] as const} style={StyleSheet.absoluteFill} />
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.28)' }} pointerEvents="none" />
                  <View style={[ps.soulBorder, { backgroundColor: accentColor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[ps.wEyebrow, { color: accentColor, marginBottom: 6 }]}>{t('portal.przeslanie_dnia', '✦ PRZESŁANIE DNIA')}</Text>
                    <Text style={[ps.soulText, { color: textColor }]}>{dailyCache.soulMessage}</Text>
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          )}

          {/* ══ DZISIEJSZE PRZESŁANIA ══ */}
          <Animated.View entering={FadeInDown.delay(90).duration(260)} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 3, color: subColor, marginBottom: 6 }}>{t('portal.dzisiejsze_przeslania', 'DZISIEJSZE PRZESŁANIA')}</Text>
                <LinearGradient colors={[accentColor, accentColor + '33']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 2, width: 48, borderRadius: 1 }} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: accentColor, opacity: 0.8 }}>
                {todayGratitude.length > 0
                  ? tr('portal.gratitude.todayCount', 'Dziś: {{count}} zapisów', 'Today: {{count}} entries', { count: todayGratitude.length })
                  : tr('portal.gratitude.emptyPrompt', 'Dodaj dzisiaj swoje podziękowania', 'Add your gratitude for today')}
              </Text>
            </View>
          </Animated.View>

          {/* ✦ HOROSKOP DNIA — Premium Blue/Indigo Card */}
          <Animated.View entering={FadeInDown.delay(110).duration(320)} style={{ marginBottom: 10 }}>
            <AnimatedWidgetGlow color="#3B82F6">
            <Pressable onPress={() => navigation.navigate('Horoscope')} style={{ borderRadius: 20, overflow: 'hidden' }}>
              <LinearGradient colors={isLight ? ['#EFF6FF', '#EDE9FE'] : ['#0C1A3D', '#0D1127', '#080B18']} style={{ borderRadius: 20 }}>
                <ShimmerBar colors={['#3B82F6', '#6366F1', '#8B5CF6']} />
                <Text style={{ position: 'absolute', right: 10, top: 10, fontSize: 80, opacity: isLight ? 0.04 : 0.06, color: '#60A5FA', lineHeight: 80 }} pointerEvents="none">{ZODIAC_SYMBOLS[zodiacSign] || '♈'}</Text>
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3B82F620', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#3B82F635' }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 2.2, color: '#60A5FA' }}>
                        {tr('portal.horoscope.eyebrow', '✦ HOROSKOP DNIA', '✦ DAILY HOROSCOPE')}
                        {dailyAiContent?.date === new Date().toISOString().split('T')[0] && ' · AI'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <Text style={{ fontSize: 22 }}>{ZODIAC_SYMBOLS[zodiacSign] || '♈'}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isLight ? '#3B82F6' : '#93C5FD', letterSpacing: 0.5 }}>{zodiacLabel}</Text>
                  </View>
                  <LinearGradient colors={['#3B82F6BB', '#6366F155', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1, marginBottom: 14 }} />
                  {aiContentLoading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#60A5FA" />
                      <Text style={{ fontSize: 12, color: '#60A5FA', opacity: 0.7 }}>{t('portal.pobieranie_swiezego_horoskopu', 'Pobieranie świeżego horoskopu...')}</Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 14, lineHeight: 22, color: isLight ? '#1E3A5F' : 'rgba(214,230,254,0.9)', fontWeight: '400', letterSpacing: 0.1 }}>{dailyHoroscope}</Text>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 6 }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 1.8, color: '#60A5FA', opacity: 0.75 }}>{tr('portal.horoscope.full', 'PEŁNY HOROSKOP →', 'FULL HOROSCOPE →')}</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
            </AnimatedWidgetGlow>
          </Animated.View>

          {/* ✦ AFIRMACJA DNIA — Premium Purple Card */}
          <Animated.View entering={FadeInDown.delay(145).duration(320)} style={{ marginBottom: 10 }}>
            <AnimatedWidgetGlow color={catColor}>
            <Pressable onPress={() => navigation.navigate('Affirmations')} style={{ borderRadius: 20, overflow: 'hidden' }}>
              <LinearGradient colors={isLight ? ['#FAF5FF', '#FDF4FF'] : ['#1A0D35', '#110A25', '#08060F']} style={{ borderRadius: 20 }}>
                <ShimmerBar colors={[catColor as string, (catColor + 'AA') as string, (catColor + '44') as string]} />
                <Text style={{ position: 'absolute', right: 14, top: 4, fontSize: 90, opacity: isLight ? 0.04 : 0.06, color: catColor, fontWeight: '900', lineHeight: 90 }} pointerEvents="none">❝</Text>
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: catColor + '20', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: catColor + '35' }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 2.2, color: catColor }}>{t('portal.afirmacja_dnia_1', '💫 AFIRMACJA DNIA')}</Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <Pressable onPress={handleNextAffirmation} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: catColor + '22', borderWidth: 1, borderColor: catColor + '44', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: catColor, fontSize: 16, fontWeight: '700' }}>↻</Text>
                    </Pressable>
                  </View>
                  <Text style={{ fontSize: 16, lineHeight: 26, fontStyle: 'italic', fontWeight: '600', color: isLight ? '#3B1F5E' : 'rgba(233,222,255,0.95)', letterSpacing: -0.2, marginBottom: 16 }}>"{displayAffirmation.text}"</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ backgroundColor: catColor + '22', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: catColor + '44' }}>
            <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: catColor }}>{categoryLabels[affirmation.category] || CATEGORY_LABELS[affirmation.category]}</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
            </AnimatedWidgetGlow>
          </Animated.View>

          {/* ✦ FAZA KSIĘŻYCA — Premium Midnight Card */}
          <Animated.View entering={FadeInDown.delay(110).duration(320)} style={{ marginBottom: 10 }}>
            <AnimatedWidgetGlow color="#6366F1">
            <View style={{ borderRadius: 20, overflow: 'hidden' }}>
              <LinearGradient colors={isLight ? ['#F0F4FF', '#EEF2FF'] : ['#0A0D22', '#0D1035', '#060710']} style={{ borderRadius: 20 }}>
                <ShimmerBar colors={['#6366F1', '#818CF8', '#A5B4FC']} />
                <Text style={{ position: 'absolute', right: 10, top: 6, fontSize: 70, opacity: isLight ? 0.05 : 0.08, lineHeight: 70 }} pointerEvents="none">{moonPhase.emoji}</Text>
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#6366F120', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#6366F135' }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 2.2, color: '#818CF8' }}>{t('portal.faza_ksiezyca', '☽ FAZA KSIĘŻYCA')}</Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isLight ? '#4338CA' : '#A5B4FC' }}>{moonPhase.illumination}% oświetlenia</Text>
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: isLight ? '#312E81' : '#EEF2FF', letterSpacing: -0.5, marginBottom: 6 }}>{moonPhase.name}</Text>
                  <LinearGradient colors={['#6366F1BB', '#818CF855', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1, marginBottom: 14 }} />
                  {/* Phase progress bar */}
                  <View style={{ height: 4, backgroundColor: isLight ? '#E0E7FF' : '#1E2045', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
                    <LinearGradient colors={['#6366F1', '#A5B4FC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 4, width: `${moonPhase.illumination}%`, borderRadius: 2 }} />
                  </View>
                  <Text style={{ fontSize: 14, lineHeight: 22, color: isLight ? '#312E81' : 'rgba(199,210,254,0.9)', fontWeight: '400' }}>{moonPhase.advice}</Text>
                </View>
              </LinearGradient>
            </View>
            </AnimatedWidgetGlow>
          </Animated.View>

          {/* ✦ WIBRACJA DNIA — Premium Gold Card */}
          <Animated.View entering={FadeInDown.delay(215).duration(320)} style={{ marginBottom: 10 }}>
            <AnimatedWidgetGlow color={accentColor}>
            <View style={{ borderRadius: 20, overflow: 'hidden' }}>
              <LinearGradient colors={isLight ? ['#FFFBEB', '#FEF3C7'] : ['#1C1400', '#160F00', '#0E0900']} style={{ borderRadius: 20 }}>
                <ShimmerBar colors={['#D97706', '#CEAE72', '#F59E0B']} />
                <Text style={{ position: 'absolute', right: -4, top: -16, fontSize: 100, opacity: isLight ? 0.05 : 0.07, color: accentColor, fontWeight: '900', lineHeight: 100 }} pointerEvents="none">{personalDay.num}</Text>
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: accentColor + '22', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: accentColor + '44' }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 2.2, color: accentColor }}>{tr('portal.vibration.eyebrow', '∞ WIBRACJA DNIA', '∞ VIBRATION OF THE DAY')}</Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: isLight ? '#92400E' : accentColor + 'CC' }}>{tr('portal.vibration.personalNumber', 'Liczba osobista', 'Personal number')}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                    <PulsingNumber num={personalDay.num} color={accentColor} />
                    <LinearGradient colors={[accentColor + 'BB', accentColor + '33', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ width: 2, height: 60, borderRadius: 1 }} />
                    <Text style={{ flex: 1, fontSize: 14, lineHeight: 22, color: isLight ? '#92400E' : 'rgba(253,230,138,0.85)', fontWeight: '500' }}>{personalDay.meaning}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
            </AnimatedWidgetGlow>
          </Animated.View>

          {/* ✦ KARTA TAROTA — Premium Teal/Gold Card */}
          <Animated.View entering={FadeInDown.delay(250).duration(320)} style={{ marginBottom: 10 }}>
            <AnimatedWidgetGlow color="#CEAE72">
            <Pressable onPress={() => navigation.navigate('DailyTarot')} style={{ borderRadius: 20, overflow: 'hidden' }}>
              <LinearGradient colors={isLight ? ['#F0FDF4', '#ECFDF5'] : ['#0A1A14', '#0D1610', '#060E09']} style={{ borderRadius: 20 }}>
                <ShimmerBar colors={['#059669', '#CEAE72', '#F59E0B']} />
                <Text style={{ position: 'absolute', right: 16, top: 8, fontSize: 63, opacity: isLight ? 0.05 : 0.08, lineHeight: 63 }} pointerEvents="none">🃏</Text>
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#CEAE7222', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#CEAE7235' }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 2.2, color: '#CEAE72' }}>{tr('portal.tarot.eyebrow', '🃏 KARTA TAROTA DNIA', '🃏 TAROT CARD OF THE DAY')}</Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    {!dailyDraw && (
                      <View style={{ backgroundColor: '#CEAE7222', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#CEAE7244' }}>
                        <Text style={{ color: '#CEAE72', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }}>{tr('portal.tarot.reveal', 'ODKRYJ →', 'REVEAL →')}</Text>
                      </View>
                    )}
                    {!!dailyDraw && (
                      <Text style={{ fontSize: 11, fontWeight: '600', color: isLight ? '#065F46' : '#6EE7B7' }}>{dailyDraw.isReversed ? tr('portal.tarot.reversed', 'Odwrócona', 'Reversed') : tr('portal.tarot.upright', 'Prosto', 'Upright')}</Text>
                    )}
                  </View>
                  {!!dailyDraw && (
                    <Text style={{ fontSize: 22, fontWeight: '700', color: isLight ? '#064E3B' : '#D1FAE5', letterSpacing: -0.3, marginBottom: 8 }}>{resolveUserFacingText(dailyDraw.card.name)}</Text>
                  )}
                  <LinearGradient colors={['#CEAE72BB', '#05966955', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1, marginBottom: 14 }} />
                  <Text style={{ fontSize: 14, lineHeight: 22, color: isLight ? '#064E3B' : 'rgba(209,250,229,0.85)', fontWeight: '400' }}>
                    {dailyDraw
                      ? `${resolveUserFacingText(dailyDraw.card.name)} — ${tr('portal.tarot.drawnBody', 'symbol prowadzący Cię przez ten dzień. Pozwól mu przemawiać do Twojej intuicji.', 'the symbol guiding you through this day. Let it speak to your intuition.')}`
                      : tr('portal.tarot.emptyBody', 'Twoja karta tarota na dziś czeka na odkrycie. Każdy dzień niesie swój unikalny symbol — poznaj przesłanie dla Twojej duszy.', 'Your tarot card for today is waiting to be revealed. Every day carries its own symbol — discover the message for your soul.')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 1.8, color: '#CEAE72', opacity: 0.75 }}>{tr('portal.tarot.fullReading', 'PEŁNY ODCZYT →', 'FULL READING →')}</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
            </AnimatedWidgetGlow>
          </Animated.View>

          {/* ── TWÓJ STAN DZIŚ — Premium Stats ── */}
          {(() => {
            const score  = dailyPlan.energyScore;
            const eColor = score >= 70 ? '#34D399' : score >= 40 ? '#FBBF24' : '#F87171';
            const allPassive = [
              { id: 'energy',    emoji: '⚡', label: tr('portal.state.energy', 'ENERGIA', 'ENERGY'), value: `${score}%`,                      color: eColor,    bg: isLight ? '#F0FDF4' : '#0A1F12' },
              { id: 'streak',    emoji: '🔥', label: tr('portal.state.streak', 'PASMO', 'STREAK'), value: `${streaks.current}`,              color: '#FB923C', bg: isLight ? '#FFF7ED' : '#1C1000' },
              { id: 'archetype', emoji: '🏛',  label: tr('portal.state.archetype', 'ARCHETYP', 'ARCHETYPE'), value: dailyPlan.archetype?.name || '—', color: '#A78BFA', bg: isLight ? '#FAF5FF' : '#12091F' },
            ];
            const shown = allPassive.filter(item => allWidgets.some((w: PortalWidget) => w.id === item.id));
            if (shown.length === 0) return null;
            return (
              <Animated.View entering={FadeInDown.delay(280).duration(300)} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 3, color: subColor }}>{tr('portal.statusToday', 'TWÓJ STAN DZIŚ', 'YOUR STATE TODAY')}</Text>
                  <LinearGradient colors={[accentColor + '00', accentColor + '44', accentColor + '00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1, flex: 1, marginHorizontal: 12 }} />
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {shown.map(item => (
                    <View key={item.id} style={{ flex: 1, borderRadius: 22, overflow: 'hidden', shadowColor: item.color, shadowOpacity: isLight ? 0.18 : 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}>
                      <LinearGradient colors={[item.bg, isLight ? '#FFFFFF' : '#000000']} style={{ borderRadius: 22 }}>
                        <LinearGradient colors={[item.color, item.color + '66']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 2.5 }} />
                        <View style={{ padding: 10, alignItems: 'center', minHeight: 88 }}>
                          <Text style={{ fontSize: 22, marginBottom: 6 }}>{item.emoji}</Text>
                          <Text style={{ fontSize: item.id === 'archetype' ? 12 : 22, fontWeight: '900', color: item.color, letterSpacing: -1, textAlign: 'center', lineHeight: item.id === 'archetype' ? 16 : 26, marginBottom: 4 }} numberOfLines={2}>{item.value}</Text>
                          {item.id === 'streak' && <Text style={{ fontSize: 10, fontWeight: '700', color: item.color, opacity: 0.8, letterSpacing: 0.5 }}>{tr('portal.streakDays', 'dni z rzędu', 'days in a row')}</Text>}
                          <Text style={{ fontSize: 8, fontWeight: '800', letterSpacing: 1.8, color: item.color, opacity: 0.65, marginTop: 4 }}>{item.label}</Text>
                        </View>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              </Animated.View>
            );
          })()}

          {/* Gold separator */}
          <View style={ps.goldSep}>
            <View style={[ps.goldSepLine, { backgroundColor: accentColor + '33' }]} />
            <Text style={[ps.goldSepGlyph, { color: accentColor }]}>✦</Text>
            <View style={[ps.goldSepLine, { backgroundColor: accentColor + '33' }]} />
          </View>

          {/* ── RYTUAŁY WEJŚCIA — Premium Tiles ── */}
          <Animated.View entering={FadeInDown.delay(310).duration(440)} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
              <View>
                <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 3, color: subColor, marginBottom: 6 }}>{tr('portal.entryRituals', 'RYTUAŁY WEJŚCIA', 'ENTRY RITUALS')}</Text>
                <LinearGradient colors={[accentColor, accentColor + '33']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 2, width: 40, borderRadius: 1 }} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: accentColor, opacity: 0.75 }}>8 {tr('portal.portals', 'portali', 'portals')}</Text>
            </View>
            <View style={ps.actionGrid}>
              {entryRituals.map((item, i) => (
                <Animated.View key={item.route + i} entering={FadeInUp.delay(330 + i * 35).duration(250)} style={ps.actionTileWrap}>
                  <Pressable
                    onPress={() => { void HapticsService.selection(); navigation.navigate(item.route as any, (item as any).params); }}
                    style={({ pressed }) => ({ borderRadius: 18, overflow: 'hidden', opacity: pressed ? 0.8 : 1, shadowColor: item.color, shadowOpacity: isLight ? 0.18 : 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 10 })}
                  >
                    <LinearGradient colors={isLight ? [item.color + '18', item.color + '08'] : [item.bg1, item.bg2]} style={{ borderRadius: 18, padding: 0 }}>
                      <LinearGradient colors={[item.color, item.color + '66']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 2.5, borderRadius: 0 }} />
                      <View style={{ padding: 12, alignItems: 'flex-start', minHeight: 100 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.color + '25', borderWidth: 1.5, borderColor: item.color + '45', alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: item.color, shadowOpacity: 0.5, shadowRadius: 8 }}>
                          <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                        </View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: isLight ? item.color : '#FFFFFF', letterSpacing: 0.1, marginBottom: 3 }}>{tr(`portal.entry.${item.route}.label`, item.label, ({
                        Gratitude: 'Gratitude',
                        DailyTarot: 'Card of the Day',
                        DailyRitualAI: 'AI Ritual',
                        JournalEntry: 'Journal',
                        Meditation: 'Meditation',
                        Affirmations: 'Affirmations',
                        Horoscope: 'Horoscope',
                        Dreams: 'Dreams',
                      } as any)[item.route] || item.label)}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '500', color: isLight ? item.color + 'AA' : item.color + 'BB', lineHeight: 16 }} numberOfLines={2}>{tr(`portal.entry.${item.route}.sub`, item.sub, ({
                        Gratitude: 'Three things today',
                        DailyTarot: 'Tarot insight',
                        DailyRitualAI: 'Guided ceremony',
                        JournalEntry: 'Write a reflection',
                        Meditation: 'Quiet the mind',
                        Affirmations: 'Daily reinforcement',
                        Horoscope: 'Your sign today',
                        Dreams: 'Dream symbolarium',
                      } as any)[item.route] || item.sub)}</Text>
                        <View style={{ position: 'absolute', bottom: 12, right: 12, width: 22, height: 22, borderRadius: 11, backgroundColor: item.color + '22', borderWidth: 1, borderColor: item.color + '44', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: item.color, fontSize: 11, fontWeight: '800' }}>→</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* ── 12. Favorites Section ── */}
          <Animated.View entering={FadeInDown.delay(320).duration(260)} style={{ marginBottom: 14 }}>
            <View style={ps.sectionHead}>
              <Text style={[ps.sectionTitle, { color: subColor }]}>{t('portal.favorites')}</Text>
              {favoriteItems.length > 0 && (
                <Text style={[ps.sectionSub, { color: accentColor }]}>{favoriteItems.length} {tr('portal.favorites.places', 'miejsc', 'places')}</Text>
              )}
            </View>
            {favoriteItems.length === 0 ? (
              <View style={[ps.favEmpty, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <Text style={{ fontSize: 22, marginBottom: 8 }}>✦</Text>
                <Text style={[ps.favEmptyTitle, { color: textColor }]}>{t('portal.add_favorites')}</Text>
                <Text style={[ps.favEmptyBody, { color: subColor }]}>
                  {t('portal.no_favorites')}
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ps.favScroll}>
                {favoriteItems.map(item => (
                  <FavTile
                    key={item.id}
                    item={item}
                    onPress={() => {
                      void HapticsService.selection();
                      navigation.navigate(item.route, item.params);
                    }}
                    onRemove={() => {
                      void HapticsService.impact('light');
                      removeFavoriteItem(item.id);
                    }}
                  />
                ))}
              </ScrollView>
            )}
          </Animated.View>

          {/* ── 13. Recent Journal Entries ── */}
          {recentEntries.length > 0 && (
            <Animated.View entering={FadeInDown.delay(340).duration(260)} style={{ marginBottom: 14 }}>
              <View style={ps.sectionHead}>
                <Text style={[ps.sectionTitle, { color: subColor }]}>{t('journal.yourHistory')}</Text>
                <Pressable onPress={() => navigation.navigate('Journal')}>
                  <Text style={[ps.sectionSub, { color: accentColor }]}>{t('common.seeAll')} →</Text>
                </Pressable>
              </View>
              {recentEntries.slice(0, 3).map((entry, i) => (
                <Animated.View key={entry.id || i} entering={FadeInUp.delay(350 + i * 40).duration(240)}>
                  <Pressable
                    onPress={() => navigation.navigate('JournalEntry', { entryId: entry.id })}
                    style={[ps.journalEntryRow, { backgroundColor: cardBg, borderColor: cardBorder, marginBottom: 8 }]}
                  >
                    <LinearGradient colors={['#34D39908', 'transparent'] as const} style={StyleSheet.absoluteFill} />
                    <View style={[ps.journalEntryDot, { backgroundColor: '#34D399' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[ps.journalEntryDate, { color: subColor }]}>
                        {new Date(entry.createdAt || entry.date || '').toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'short' })}
                      </Text>
                      <Text style={[ps.journalEntryText, { color: textColor }]} numberOfLines={2}>
                        {entry.content || entry.text || tr('portal.journal.emptyEntry', 'Wpis bez treści', 'Entry without content')}
                      </Text>
                    </View>
                    <ChevronRight color={subColor} size={14} />
                  </Pressable>
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {/* ── 14. Daily Practice Checklist ── */}
          <Animated.View entering={FadeInDown.delay(360).duration(260)} style={{ marginBottom: 14 }}>
            <View style={ps.sectionHead}>
              <Text style={[ps.sectionTitle, { color: subColor }]}>{tr('portal.practice.today', 'DZISIEJSZA PRAKTYKA', 'TODAY’S PRACTICE')}</Text>
              <Text style={[ps.sectionSub, { color: accentColor }]}>
                {[todayProgress.tarotDrawn, todayProgress.journalWritten, todayProgress.ritualCompleted, todayProgress.affirmationRead, (todayProgress as any).restAndReflection].filter(Boolean).length}/5
              </Text>
            </View>
            <View style={{ borderRadius: 20, overflow: 'hidden', shadowColor: accentColor, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 16, elevation: 7 }}>
            <BlurView intensity={isLight ? 50 : 30} tint={isLight ? 'light' : 'dark'} style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: isLight ? 'rgba(255,255,255,0.70)' : accentColor + '22' }}>
            <View style={[ps.checklistCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.04)', borderColor: 'transparent', borderWidth: 0 }]}>
              <LinearGradient colors={[accentColor + '10', 'transparent'] as const} style={StyleSheet.absoluteFill} />
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} pointerEvents="none" />
              <ChecklistItem
                label={tr('portal.practice.tarotCard', 'Karta Tarota', 'Tarot Card')}
                checked={!!todayProgress.tarotDrawn}
                onToggle={() => handleChecklistToggle('tarotDrawn')}
                accent={accentColor} textColor={textColor} cardBg={cardBg} cardBorder={cardBorder}
              />
              <ChecklistItem
                label={tr('portal.practice.journalEntry', 'Wpis w dzienniku', 'Journal Entry')}
                checked={!!todayProgress.journalWritten}
                onToggle={() => handleChecklistToggle('journalWritten')}
                accent={accentColor} textColor={textColor} cardBg={cardBg} cardBorder={cardBorder}
              />
              <ChecklistItem
                label={tr('portal.practice.ritualOrMeditation', 'Rytuał lub medytacja', 'Ritual or Meditation')}
                checked={!!todayProgress.ritualCompleted}
                onToggle={() => handleChecklistToggle('ritualCompleted')}
                accent={accentColor} textColor={textColor} cardBg={cardBg} cardBorder={cardBorder}
              />
              <ChecklistItem
                label={t('portal.afirmacja', 'Afirmacja')}
                checked={!!todayProgress.affirmationRead}
                onToggle={() => handleChecklistToggle('affirmationRead')}
                accent={accentColor} textColor={textColor} cardBg={cardBg} cardBorder={cardBorder}
              />
              <ChecklistItem
                label={t('portal.odpoczynek_i_refleksja', 'Odpoczynek i refleksja')}
                checked={!!(todayProgress as any).restAndReflection}
                onToggle={() => handleChecklistToggle('restAndReflection')}
                accent={accentColor} textColor={textColor} cardBg={cardBg} cardBorder={cardBorder}
              />
            </View>
            </BlurView>
            </View>
          </Animated.View>

          <EndOfContentSpacer size="compact" />
          </ScrollView>

          {/* ═══════════ PAGE 2: KOSMOS & NARZĘDZIA ═══════════ */}
          <ScrollView
            style={{ width: SW }}
            contentContainerStyle={[ps.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') + 90 }]}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            overScrollMode="never"
          >

          {/* ── Kosmos page header row ── */}
          <View style={ps.kosmosHeaderRow}>
            <View>
              <Text style={[ps.kosmosHeaderEyebrow, { color: isLight ? '#7C5E9A' : '#A78BFA' }]}>{t('portal.kosmos_1', '🌌 KOSMOS')}</Text>
              <Text style={[ps.kosmosHeaderTitle, { color: textColor }]}>{tr('portal.cosmos.title', 'Planety & Energia', 'Planets & Energy')}</Text>
            </View>
            <MusicToggleButton color={isLight ? '#7C5E9A' : '#A78BFA'} size={18} />
          </View>

          {/* ── 8. Cosmic Weather ── */}
          <Animated.View entering={FadeInDown.delay(210).duration(440)} style={{ marginBottom: 14 }}>
            <View style={ps.kosmosSectionHead}>
              <View style={{ flex: 1 }}>
                <Text style={[ps.kosmosSectionTitle, { color: cosmicWeather.color }]}>{t('portal.pogoda_kosmiczna', '🌌 POGODA KOSMICZNA')}</Text>
                <View style={ps.kosmosSectionUnderline}>
                  <LinearGradient colors={[cosmicWeather.color, cosmicWeather.color + '44', 'transparent'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 2, borderRadius: 1, width: '55%' }} />
                </View>
              </View>
              <Text style={[ps.sectionSub, { color: cosmicWeather.color }]}>{'★'.repeat(cosmicWeather.overall)}</Text>
            </View>
            <View style={{ borderRadius: 20, overflow: 'hidden', shadowColor: cosmicWeather.color, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.20, shadowRadius: 18, elevation: 8 }}>
              <BlurView intensity={isLight ? 50 : 30} tint={isLight ? 'light' : 'dark'} style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: isLight ? 'rgba(255,255,255,0.70)' : cosmicWeather.color + '30' }}>
                <Pressable onPress={() => navigation.navigate('CosmicWeather')} style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.04)' }}>
                  <LinearGradient colors={[cosmicWeather.color + '14', 'transparent'] as const} style={StyleSheet.absoluteFill} />
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} pointerEvents="none" />
                  <View style={[ps.wRow, { padding: 16 }]}>
                    <View style={[ps.wIconWrap, { backgroundColor: cosmicWeather.color + '22', borderWidth: 1, borderColor: cosmicWeather.color + '44' }]}>
                      <Text style={{ fontSize: 24 }}>🌌</Text>
                    </View>
                    <View style={ps.wText}>
                      <Text style={[ps.wEyebrow, { color: cosmicWeather.color }]}>{tr('portal.cosmos.energy', 'ENERGIA KOSMICZNA', 'COSMIC ENERGY')}</Text>
                      <Text style={[ps.wTitle, { color: textColor }]}>{cosmicWeather.label}</Text>
                      <View style={{ gap: 5, marginTop: 6 }}>
                        {[
                          { label: 'Umysł', val: cosmicWeather.mental, color: '#60A5FA' },
                          { label: 'Emocje', val: cosmicWeather.emotional, color: '#F472B6' },
                          { label: 'Duch', val: cosmicWeather.spiritual, color: '#A78BFA' },
                        ].map(aspect => (
                          <View key={aspect.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ color: aspect.color, fontSize: 10, fontWeight: '700', width: 40 }}>{aspect.label}</Text>
                            <View style={{ flex: 1, height: 4, backgroundColor: aspect.color + '22', borderRadius: 2, overflow: 'hidden' }}>
                              <View style={{ width: `${aspect.val}%`, height: '100%', backgroundColor: aspect.color, borderRadius: 2 }} />
                            </View>
                            <Text style={{ color: aspect.color, fontSize: 10, fontWeight: '600', width: 28, textAlign: 'right' }}>{aspect.val}%</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <ChevronRight color={subColor} size={16} />
                  </View>
                </Pressable>
              </BlurView>
            </View>
          </Animated.View>

          {/* ── 9. Planetary Positions ── */}
          <Animated.View entering={FadeInDown.delay(215).duration(440)} style={{ marginBottom: 14 }}>
            <View style={ps.kosmosSectionHead}>
              <View style={{ flex: 1 }}>
                <Text style={[ps.kosmosSectionTitle, { color: '#818CF8' }]}>{t('portal.planety_dzis', '🪐 PLANETY DZIŚ')}</Text>
                <View style={ps.kosmosSectionUnderline}>
                  <LinearGradient colors={['#818CF8', '#A78BFA', 'transparent'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 2, borderRadius: 1, width: '60%' }} />
                </View>
              </View>
              <Text style={[ps.sectionSub, { color: '#818CF8' }]}>
                {planetaryPositions.filter(p => p.isRetrograde).length > 0
                  ? `${planetaryPositions.filter(p => p.isRetrograde).map(p => p.name).join(', ')} retro`
                  : 'Brak retrogresji'}
              </Text>
            </View>
            {renderPlanetaryPositions()}
          </Animated.View>

          {/* ── 10. Energy Gauge (3 SVG rings) ── */}
          <Animated.View entering={FadeInDown.delay(220).duration(440)} style={{ marginBottom: 14 }}>
            <View style={ps.kosmosSectionHead}>
              <View style={{ flex: 1 }}>
                <Text style={[ps.kosmosSectionTitle, { color: '#34D399' }]}>{t('portal.poziom_energii', '⚡ POZIOM ENERGII')}</Text>
                <View style={ps.kosmosSectionUnderline}>
                  <LinearGradient colors={['#34D399', '#A78BFA', 'transparent'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 2, borderRadius: 1, width: '50%' }} />
                </View>
              </View>
              <Pressable onPress={() => navigation.navigate('DailyCheckIn')}>
                <Text style={[ps.sectionSub, { color: accentColor }]}>{t('portal.uzupelnij', 'Uzupełnij →')}</Text>
              </Pressable>
            </View>
            <View style={[ps.energyGaugeCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <LinearGradient colors={['#34D39910', '#A78BFA10', 'transparent'] as const} style={StyleSheet.absoluteFill} />
              <View style={ps.energyRingsRow}>
                {[
                  { label: 'Fizyczna', val: energyRings.physical, color: '#34D399', r: 36 },
                  { label: 'Emocjonalna', val: energyRings.emotional, color: '#F472B6', r: 36 },
                  { label: 'Duchowa', val: energyRings.spiritual, color: '#A78BFA', r: 36 },
                ].map((ring) => {
                  const circum = 2 * Math.PI * ring.r;
                  const dash = circum * Math.min(ring.val, 100) / 100;
                  return (
                    <View key={ring.label} style={{ alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 88, height: 88 }}>
                        <Svg width={88} height={88} viewBox="0 0 88 88">
                          <Circle cx={44} cy={44} r={ring.r} fill="none" stroke={ring.color + '22'} strokeWidth={8} />
                          <Circle
                            cx={44} cy={44} r={ring.r}
                            fill="none" stroke={ring.color} strokeWidth={8}
                            strokeDasharray={`${dash} ${circum - dash}`}
                            strokeLinecap="round"
                            transform={`rotate(-90 44 44)`}
                          />
                        </Svg>
                        <View style={{ position: 'absolute', top: 0, left: 0, width: 88, height: 88, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: ring.color, fontSize: 15, fontWeight: '800' }}>{ring.val}%</Text>
                        </View>
                      </View>
                      <Text style={{ color: subColor, fontSize: 10, fontWeight: '600', letterSpacing: 0.4, textAlign: 'center' }}>{ring.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>

          {/* ── 11. Numerology of the Day ── */}
          <Animated.View entering={FadeInDown.delay(280).duration(440)} style={{ marginBottom: 14 }}>
            <View style={ps.kosmosSectionHead}>
              <View style={{ flex: 1 }}>
                <Text style={[ps.kosmosSectionTitle, { color: '#A78BFA' }]}>{t('portal.numerologi', '🔢 NUMEROLOGIA')}</Text>
                <View style={ps.kosmosSectionUnderline}>
                  <LinearGradient colors={['#A78BFA', '#C4B5FD', 'transparent'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 2, borderRadius: 1, width: '45%' }} />
                </View>
              </View>
              <Text style={[ps.sectionSub, { color: '#A78BFA' }]}>{t('portal.dzien_osobisty', 'Dzień osobisty')}</Text>
            </View>
            <View style={{ borderRadius: 20, overflow: 'hidden', shadowColor: '#A78BFA', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.20, shadowRadius: 18, elevation: 8 }}>
              <BlurView intensity={isLight ? 50 : 30} tint={isLight ? 'light' : 'dark'} style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: isLight ? 'rgba(255,255,255,0.70)' : '#A78BFA30' }}>
                <Pressable onPress={() => navigation.navigate('Numerology')} style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.04)' }}>
                  <LinearGradient colors={['#A78BFA18', '#6366F10A', 'transparent'] as const} style={StyleSheet.absoluteFill} />
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} pointerEvents="none" />
                  <View style={[ps.numCard, { backgroundColor: 'transparent', borderColor: 'transparent', borderWidth: 0 }]}>
                    <View style={ps.numBadge}>
                      <LinearGradient
                        colors={[accentColor + 'CC', accentColor + '88'] as const}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={ps.numBadgeGrad}
                      >
                        <Text style={ps.numBadgeText}>{personalDay.num}</Text>
                      </LinearGradient>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[ps.wEyebrow, { color: '#A78BFA', marginBottom: 8 }]}>{t('portal.twoj_dzien_osobisty', 'TWÓJ DZIEŃ OSOBISTY')}</Text>
                      <Text style={[ps.numMeaning, { color: textColor }]}>{personalDay.meaning}</Text>
                    </View>
                    <ChevronRight color={subColor} size={16} />
                  </View>
                </Pressable>
              </BlurView>
            </View>
          </Animated.View>

          {/* ── 12. Astronomical Events (conditional) ── */}
          {upcomingAstroEvents.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300).duration(440)} style={{ marginBottom: 14 }}>
              <View style={ps.kosmosSectionHead}>
                <View style={{ flex: 1 }}>
                  <Text style={[ps.kosmosSectionTitle, { color: '#60A5FA' }]}>{t('portal.wydarzenia_astronomic', '✦ WYDARZENIA ASTRONOMICZNE')}</Text>
                  <View style={ps.kosmosSectionUnderline}>
                    <LinearGradient colors={['#60A5FA', '#38BDF8', 'transparent'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 2, borderRadius: 1, width: '70%' }} />
                  </View>
                </View>
                <Text style={[ps.sectionSub, { color: '#60A5FA' }]}>{t('portal.najblizsze_90_dni', 'Najbliższe 90 dni')}</Text>
              </View>
              {renderAstroEvents()}
            </Animated.View>
          )}

          {/* ── 3 ritual portal entry tiles ── */}
          <Animated.View entering={FadeInDown.delay(25).duration(260)}>
            <View style={ps.sectionHead}>
              <Text style={[ps.sectionTitle, { color: subColor }]}>{tr('portal.ritualPortals.title', 'PORTALE WEJŚCIA', 'ENTRY PORTALS')}</Text>
              <Text style={[ps.sectionSub, { color: accentColor }]}>{tr('portal.ritualPortals.sub', '3 komnaty na teraz', '3 chambers for now')}</Text>
            </View>
            <View style={ps.ritualPortalGrid}>
              {/* Karta dnia portal tile */}
              <View style={{ borderRadius: 22, overflow: 'hidden', shadowColor: '#CEAE72', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 8 }}>
                <BlurView intensity={isLight ? 50 : 30} tint={isLight ? 'light' : 'dark'} style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: isLight ? 'rgba(255,255,255,0.72)' : '#CEAE7230' }}>
                  <Pressable onPress={() => navigation.navigate('DailyTarot')} style={{ overflow: 'hidden' }}>
                    <View style={{ padding: 18, backgroundColor: isLight ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.04)' }}>
                      <LinearGradient colors={['#CEAE7220', 'transparent'] as const} style={StyleSheet.absoluteFill} />
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.32)' }} pointerEvents="none" />
                      <View style={[ps.ritualPortalIcon, { backgroundColor: '#CEAE721E', borderWidth: 1, borderColor: '#CEAE7244' }]}>
                        <Eye color="#CEAE72" size={18} strokeWidth={1.8} />
                      </View>
                      <Text style={[ps.ritualPortalLabel, { color: '#CEAE72' }]}>{tr('portal.ritualPortal.card.label', 'Karta dnia', 'Card of the day')}</Text>
                      <Text style={[ps.ritualPortalTitle, { color: textColor, letterSpacing: 0.4 }]}>{tr('portal.ritualPortal.card.title', 'Wejdź po symbol, który ustawia ton dnia.', 'Enter the symbol that sets the tone of the day.')}</Text>
                      <View style={ps.ritualPortalFoot}>
                        <Text style={[ps.ritualPortalMeta, { color: subColor }]}>{tr('portal.ritualPortal.card.meta', 'Reveal • interpretacja • integracja', 'Reveal • interpretation • integration')}</Text>
                        <ChevronRight color={subColor} size={14} />
                      </View>
                    </View>
                  </Pressable>
                </BlurView>
              </View>

              {/* Kryształ dnia portal tile */}
              <View style={{ borderRadius: 22, overflow: 'hidden', shadowColor: '#A78BFA', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 8 }}>
                <BlurView intensity={isLight ? 50 : 30} tint={isLight ? 'light' : 'dark'} style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: isLight ? 'rgba(255,255,255,0.72)' : '#A78BFA30' }}>
                  <Pressable onPress={() => navigation.navigate('CrystalBall', { mode: 'daily' })} style={{ overflow: 'hidden' }}>
                    <View style={{ padding: 18, backgroundColor: isLight ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.04)' }}>
                      <LinearGradient colors={['#A78BFA20', 'transparent'] as const} style={StyleSheet.absoluteFill} />
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.32)' }} pointerEvents="none" />
                      <View style={[ps.ritualPortalIcon, { backgroundColor: '#A78BFA1E', borderWidth: 1, borderColor: '#A78BFA44' }]}>
                        <Sparkles color="#A78BFA" size={18} strokeWidth={1.8} />
                      </View>
                      <Text style={[ps.ritualPortalLabel, { color: '#A78BFA' }]}>{tr('portal.ritualPortal.crystal.label', 'Kryształ dnia', 'Crystal of the day')}</Text>
                      <Text style={[ps.ritualPortalTitle, { color: textColor, letterSpacing: 0.4 }]}>{tr('portal.ritualPortal.crystal.title', 'Otwórz właściwości, mini-rytuał i spokojne prowadzenie energii.', 'Open the properties, mini ritual, and a calm current of guidance.')}</Text>
                      <View style={ps.ritualPortalFoot}>
                        <Text style={[ps.ritualPortalMeta, { color: subColor }]}>{tr('portal.ritualPortal.crystal.meta', 'Właściwości • rytuał • afirmacja', 'Properties • ritual • affirmation')}</Text>
                        <ChevronRight color={subColor} size={14} />
                      </View>
                    </View>
                  </Pressable>
                </BlurView>
              </View>

              {/* Oddech portal tile */}
              <View style={{ borderRadius: 22, overflow: 'hidden', shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 8 }}>
                <BlurView intensity={isLight ? 50 : 30} tint={isLight ? 'light' : 'dark'} style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: isLight ? 'rgba(255,255,255,0.72)' : '#38BDF830' }}>
                  <Pressable onPress={() => navigation.navigate('Breathwork')} style={{ overflow: 'hidden' }}>
                    <View style={{ padding: 18, backgroundColor: isLight ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.04)' }}>
                      <LinearGradient colors={['#38BDF820', 'transparent'] as const} style={StyleSheet.absoluteFill} />
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.32)' }} pointerEvents="none" />
                      <View style={[ps.ritualPortalIcon, { backgroundColor: '#38BDF81E', borderWidth: 1, borderColor: '#38BDF844' }]}>
                        <Wind color="#38BDF8" size={18} strokeWidth={1.8} />
                      </View>
                      <Text style={[ps.ritualPortalLabel, { color: '#38BDF8' }]}>{tr('portal.ritualPortal.breath.label', 'Oddech', 'Breath')}</Text>
                      <Text style={[ps.ritualPortalTitle, { color: textColor, letterSpacing: 0.4 }]}>{tr('portal.ritualPortal.breath.title', 'Wejdź w świadomy oddech, gdy potrzebujesz ukojenia.', 'Enter a conscious breath when you need soothing.')}</Text>
                      <View style={ps.ritualPortalFoot}>
                        <Text style={[ps.ritualPortalMeta, { color: subColor }]}>{t('portal.oczyszczen_spokoj_centrowani', 'Oczyszczenie • spokój • centrowanie')}</Text>
                        <ChevronRight color={subColor} size={14} />
                      </View>
                    </View>
                  </Pressable>
                </BlurView>
              </View>
            </View>
          </Animated.View>

          {/* ── Explore widgets ── */}
          <View style={ps.sectionHead}>
            <Text style={[ps.sectionTitle, { color: subColor }]}>{t('home.exploration')}</Text>
          </View>

          {allWidgets
            .filter(w => !PASSIVE_IDS.includes(w.id))
            .map((widget, index) => {
              const renderer = WIDGET_RENDERERS[widget.id];
              if (!renderer) return null;
              return (
                <Animated.View
                  key={widget.id}
                  entering={FadeInUp.delay(index * 55).duration(440)}
                  style={{ marginBottom: 10 }}
                >
                  {renderer()}
                </Animated.View>
              );
            })}

          {/* Gold separator */}
          <View style={[ps.goldSep, { marginVertical: 24 }]}>
            <View style={[ps.goldSepLine, { backgroundColor: accentColor + '33' }]} />
            <Text style={[ps.goldSepGlyph, { color: accentColor }]}>✦</Text>
            <View style={[ps.goldSepLine, { backgroundColor: accentColor + '33' }]} />
          </View>

          {/* ── 15. Quick Shortcuts Grid (18 tiles, 2 columns) ── */}
          <Animated.View entering={FadeInDown.delay(500).duration(260)}>
            <Text style={[ps.sectionTitle, { color: subColor, marginBottom: 14 }]}>{t('portal.quick_links')}</Text>
            <View style={ps.quickGrid}>
              {quickLinks.map((item, i) => (
                <Animated.View key={item.route + i} entering={FadeInUp.delay(520 + i * 35).duration(250)} style={ps.quickTileWrap}>
                  <Pressable
                    onPress={() => { void HapticsService.selection(); navigation.navigate(item.route as any); }}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.82 : 1,
                      borderRadius: 22,
                      overflow: 'hidden',
                      shadowColor: item.color,
                      shadowOpacity: pressed ? 0.10 : 0.28,
                      shadowRadius: 16,
                      shadowOffset: { width: 0, height: 6 },
                      elevation: 8,
                      minHeight: 120,
                    })}
                  >
                    <BlurView
                      intensity={isLight ? 48 : 28}
                      tint={isLight ? 'light' : 'dark'}
                      style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 1.5, borderColor: isLight ? 'rgba(255,255,255,0.72)' : item.color + '55' }}
                    >
                      <View style={{ paddingVertical: 18, paddingHorizontal: 16, alignItems: 'flex-start', minHeight: 120, backgroundColor: isLight ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.04)' }}>
                        <LinearGradient
                          colors={[item.color + '22', item.color + '08', 'transparent'] as const}
                          style={StyleSheet.absoluteFill}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        />
                        {/* top highlight */}
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.32)' }} pointerEvents="none" />
                        {/* Gradient top border */}
                        <LinearGradient
                          colors={['transparent', item.color + 'AA', 'transparent'] as [string,string,string]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1 }}
                          pointerEvents="none"
                        />
                        <View style={{ position: 'absolute', top: 8, right: 10, width: 6, height: 6, borderTopWidth: 1.4, borderRightWidth: 1.4, borderColor: item.color + '88' }} pointerEvents="none" />
                        {/* Icon circle with gradient */}
                        <LinearGradient
                          colors={[item.color + '40', item.color + '18']}
                          style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1, borderColor: item.color + '44' }}
                        >
                          <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
                        </LinearGradient>
                        <Text style={[ps.quickTileLabel, { color: item.color, letterSpacing: 0.5 }]}>{item.label}</Text>
                        <Text style={[ps.quickTileDesc, { color: subColor }]} numberOfLines={1}>{item.desc}</Text>
                      </View>
                    </BlurView>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          <EndOfContentSpacer size="compact" />
          </ScrollView>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const ps = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: SP, paddingTop: 6 },

  // Header
  brandRow: {
    paddingHorizontal: SP, paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 2,
    flexDirection: 'row', alignItems: 'center',
  },
  brandName: { fontSize: 12, fontWeight: '800', letterSpacing: 3.5 },
  brandTagline: { fontSize: 11, fontWeight: '400', letterSpacing: 0.2, flex: 1, marginLeft: 6 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SP, paddingTop: 6, paddingBottom: 16,
  },
  headerDate: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, marginBottom: 3, textTransform: 'uppercase' },
  headerGreet: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3 },

  // Section header
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },
  sectionSub: { fontSize: 11, fontWeight: '600' },

  // Kosmos page header
  kosmosHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, marginTop: 8,
  },
  kosmosHeaderEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.2, marginBottom: 2 },
  kosmosHeaderTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },

  // Kosmos premium section headers
  kosmosSectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 },
  kosmosSectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  kosmosSectionUnderline: { marginTop: 4 },

  // Premium planet rows
  planetCard: { borderRadius: 20, borderWidth: 1, padding: 14, overflow: 'hidden', ...shadows.soft },
  planetRow: {
    flexDirection: 'row', alignItems: 'center', gap: 0,
    borderRadius: 12, borderWidth: 1, overflow: 'hidden',
    marginBottom: 6,
  },
  planetAccentBar: { width: 3, alignSelf: 'stretch', borderRadius: 0 },
  planetEmojiBadge: {
    width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginRight: 10, borderRadius: 12,
  },
  retroPill: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    borderWidth: 1,
  },

  // Premium astro event cards
  astroEventCard: {
    borderRadius: 18, borderWidth: 1, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },

  // Soul message
  soulCard: { borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden', flexDirection: 'row', gap: 14 },
  soulBorder: { width: 3, borderRadius: 2, alignSelf: 'stretch' },
  soulText: { fontSize: 15, lineHeight: 24, fontStyle: 'italic', fontWeight: '500', letterSpacing: 0.1 },

  // Horoscope card
  horoCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 2, ...shadows.soft },
  horoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  horoSymbolBadge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  horoSignName: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2, marginTop: 2 },
  horoText: { fontSize: 15, lineHeight: 24, fontWeight: '400', letterSpacing: 0.1, padding: 16, paddingTop: 14 },

  // Numerology card
  numCard: { borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 16, ...shadows.soft },
  numBadge: { flexShrink: 0 },
  numBadgeGrad: { width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  numBadgeText: { fontSize: 32, fontWeight: '900', color: '#07080F' },
  numMeaning: { fontSize: 15, lineHeight: 23, fontWeight: '500', letterSpacing: 0.1 },

  // Moon phase advice box
  moonAdviceBox: { borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 12 },
  moonAdviceText: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  // Quick action tiles (2×4)
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 2 },
  actionTileWrap: { width: (SW - SP * 2 - 10) / 2 },
  actionTile: {
    borderRadius: 22, borderWidth: 1.5, overflow: 'hidden',
    paddingVertical: 18, paddingHorizontal: 16, alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 14, elevation: 6,
  },
  actionTileIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionTileLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2, marginBottom: 2 },
  actionTileSub: { fontSize: 11, fontWeight: '500', opacity: 0.75 },

  // Daily practice checklist
  checklistCard: { borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden', ...shadows.soft },
  checkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14, overflow: 'hidden',
  },
  checkBox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkLabel: { fontSize: 14, fontWeight: '500', flex: 1 },

  // Energy gauge
  energyGaugeCard: { borderRadius: 20, borderWidth: 1, padding: 20, overflow: 'hidden', ...shadows.soft },
  energyRingsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },

  // Journal entry rows
  journalEntryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14, overflow: 'hidden' },
  journalEntryDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  journalEntryDate: { fontSize: 10, fontWeight: '600', letterSpacing: 0.4, marginBottom: 4 },
  journalEntryText: { fontSize: 13, lineHeight: 19, fontWeight: '400' },

  // Favorites
  favScroll: { gap: 10, paddingRight: SP },
  favTile: { width: 88, height: 88, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden', padding: 8 },
  favIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  favLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2, textAlign: 'center', lineHeight: 13 },
  favRemoveBtn: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(239,68,68,0.8)', alignItems: 'center', justifyContent: 'center' },
  favEmpty: { borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', padding: 24, alignItems: 'center', marginBottom: 4 },
  favEmptyTitle: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  favEmptyBody: { fontSize: 13, textAlign: 'center', lineHeight: 20, opacity: 0.8 },

  // Widget cards
  wCard: { borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden', ...shadows.soft },
  wRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  wIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  wText: { flex: 1, gap: 3 },
  wEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.4 },
  wTitle: { fontSize: 16, fontWeight: '600', letterSpacing: -0.1 },
  wSub: { fontSize: 12, lineHeight: 18 },

  // Energy bar
  barTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3 },
  energyScore: { fontSize: 18, fontWeight: '700' },

  // Streak badge
  streakBadge: { alignItems: 'center' },
  streakNum: { fontSize: 22, fontWeight: '800', color: '#FB923C' },
  streakFire: { fontSize: 16 },

  // Affirmation card
  affCard: { borderRadius: 24, borderWidth: 1.5, padding: 22, overflow: 'hidden', ...shadows.medium },
  affHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  affCatBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  affCatText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  affEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  affText: { fontSize: 20, fontWeight: '500', lineHeight: 30, letterSpacing: -0.2, fontStyle: 'italic' },
  affFooter: { marginTop: 18, flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  affBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },

  // Daily insights horizontal strip
  insightTile: {
    width: 185, borderRadius: 20, borderWidth: 1, padding: 14, overflow: 'hidden',
    height: 150, justifyContent: 'space-between', ...shadows.soft,
  },
  insightIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  insightEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  insightTitle: { fontSize: 13, fontWeight: '600', lineHeight: 19, letterSpacing: -0.1 },
  insightJournalBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 8, paddingVertical: 5, paddingHorizontal: 10,
    borderRadius: 10, borderWidth: 1, alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.10)',
  },

  // Passive mini-cards
  miniCard: { borderRadius: 22, borderWidth: 1.5, padding: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  miniCardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  miniCardValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center' },

  // Golden separator
  goldSep: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  goldSepLine: { flex: 1, height: StyleSheet.hairlineWidth },
  goldSepGlyph: { fontSize: 14, fontWeight: '800' },

  // Ritual portal tiles
  ritualPortalGrid: { gap: 10, marginBottom: 8 },
  ritualPortalTile: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 16, elevation: 4 },
  ritualPortalIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ritualPortalLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 8, textTransform: 'uppercase' },
  ritualPortalTitle: { fontSize: 16, fontWeight: '600', lineHeight: 23, letterSpacing: -0.2 },
  ritualPortalFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  ritualPortalMeta: { flex: 1, fontSize: 11.5, lineHeight: 18, fontWeight: '500' },

  // Quick shortcuts grid
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickTileWrap: { width: (SW - SP * 2 - 10) / 2 },
  quickTile: {
    borderRadius: 22, borderWidth: 1.5, overflow: 'hidden',
    paddingVertical: 18, paddingHorizontal: 16, alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.24, shadowRadius: 16, elevation: 8,
    minHeight: 120,
  },
  quickTileLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2, marginBottom: 3 },
  quickTileDesc: { fontSize: 11, fontWeight: '500', opacity: 0.75 },

  // Page tabs
  pageTabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: SP },
  pageTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2 },
  pageTabText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

  // Message text widgets (full-width daily content cards)
  msgWidget: { borderRadius: 28, overflow: 'hidden', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.40, shadowRadius: 28, elevation: 14 },
  msgWidgetHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  msgWidgetBadge: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, flexShrink: 0 },
  msgWidgetNumBadge: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, flexShrink: 0 },
  msgWidgetNum: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  msgWidgetEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase' },
  msgWidgetSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 3 },
  msgWidgetDivider: { height: StyleSheet.hairlineWidth, marginBottom: 14 },
  msgWidgetText: { fontSize: 15, lineHeight: 24, fontWeight: '400', letterSpacing: 0.1 },
  msgWidgetTextItalic: { fontSize: 17, lineHeight: 26, fontWeight: '500', fontStyle: 'italic', letterSpacing: -0.1 },
});
