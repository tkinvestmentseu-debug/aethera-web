// @ts-nocheck
import { useNetworkStatus } from '../core/hooks/useNetworkStatus';
import { OfflineBanner } from '../components/OfflineBanner';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Share,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getResolvedTheme, isLightBg } from '../core/theme/tokens';
import { layout, luxury, screenContracts } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { OracleMode, OracleSessionKind, OracleMessage, useOracleStore } from '../store/useOracleStore';
import { useJournalStore } from '../store/useJournalStore';
import { usePremiumStore } from '../store/usePremiumStore';
import { PremiumGateModal } from '../components/PremiumGateModal';
import { Typography } from '../components/Typography';
import { SectionHeading } from '../components/SectionHeading';
import { PremiumButton } from '../components/PremiumButton';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { buildElegantShareMessage } from '../core/utils/share';
import { navigateToDashboardSurface } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import {
  ChevronLeft,
  Sparkles,
  Clock,
  X,
  HeartHandshake,
  Flame,
  MoonStar,
  Compass,
  ShieldAlert,
  BookmarkPlus,
  ScrollText,
  WandSparkles,
  ArrowRight,
  Star,
  CornerDownLeft,
  Mic,
} from 'lucide-react-native';
import { MusicToggleButton } from '../components/MusicToggleButton';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  useSharedValue,
  useAnimatedStyle,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AiService } from '../core/services/ai.service';
import { useKeyboardOpen } from '../hooks/useKeyboardOpen';
import { SpeakButton } from '../components/SpeakButton';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Defs, Ellipse, RadialGradient as SvgRadialGradient, Stop, Line, G } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Dimensions } from 'react-native';
import { useTheme } from '../core/hooks/useTheme';

const { width: OCS_W, height: OCS_H } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// STAR FIELD — 20 fixed stars, module-level positions for stability
// ─────────────────────────────────────────────────────────────────────────────
const STAR_DATA = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: (((i * 137.508 + 23) % OCS_W) + OCS_W) % OCS_W,
  y: (((i * 97.31 + 41) % (OCS_H * 0.85)) + OCS_H * 0.85) % (OCS_H * 0.85),
  size: 1 + (i % 3),
  delay: (i * 340) % 3200,
  duration: 1800 + (i % 7) * 400,
}));

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED SVG STAR — single twinkling star (module-level component)
// ─────────────────────────────────────────────────────────────────────────────
const TwinkleStar = React.memo(({ x, y, size, delay, duration }: typeof STAR_DATA[0]) => {
  const opacity = useSharedValue(0.05);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.05 + size * 0.08, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.02, { duration, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(opacity);
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFFFFF',
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// STAR FIELD LAYER
// ─────────────────────────────────────────────────────────────────────────────
const StarField = React.memo(() => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {STAR_DATA.map((s) => (
      <TwinkleStar key={s.id} {...s} />
    ))}
  </View>
));

// ─────────────────────────────────────────────────────────────────────────────
// ORACLE BACKGROUND (ambient orbs + star field)
// ─────────────────────────────────────────────────────────────────────────────
const OracleBackground = React.memo(({ modeColor, isLight }: { modeColor: string; isLight: boolean }) => {
  if (isLight) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Deep dark base gradient */}
      <LinearGradient
        colors={['#06050E', '#0B0717', '#08060F']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Star field */}
      <StarField />
      {/* Mode-color radial glow at top */}
      <Svg
        style={{ position: 'absolute', top: 0, left: 0, right: 0, width: OCS_W, height: OCS_H * 0.55 }}
        width={OCS_W}
        height={OCS_H * 0.55}
      >
        <Defs>
          <SvgRadialGradient id="glowTop" cx="50%" cy="0%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor={modeColor} stopOpacity="0.22" />
            <Stop offset="100%" stopColor={modeColor} stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Circle cx={OCS_W / 2} cy={0} r={OCS_W * 0.8} fill="url(#glowTop)" />
      </Svg>
      {/* Floating orb 1 — top-right */}
      <Svg
        style={{ position: 'absolute', top: OCS_H * 0.06, right: -OCS_W * 0.1, width: OCS_W * 0.55, height: OCS_W * 0.55 }}
        width={OCS_W * 0.55}
        height={OCS_W * 0.55}
      >
        <Defs>
          <SvgRadialGradient id="orb1" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={modeColor} stopOpacity="0.12" />
            <Stop offset="100%" stopColor={modeColor} stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Circle cx={OCS_W * 0.55 / 2} cy={OCS_W * 0.55 / 2} r={OCS_W * 0.55 / 2} fill="url(#orb1)" />
      </Svg>
      {/* Floating orb 2 — bottom-left */}
      <Svg
        style={{ position: 'absolute', bottom: OCS_H * 0.15, left: -OCS_W * 0.15, width: OCS_W * 0.50, height: OCS_W * 0.50 }}
        width={OCS_W * 0.50}
        height={OCS_W * 0.50}
      >
        <Defs>
          <SvgRadialGradient id="orb2" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#6D28D9" stopOpacity="0.10" />
            <Stop offset="100%" stopColor="#6D28D9" stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Circle cx={OCS_W * 0.50 / 2} cy={OCS_W * 0.50 / 2} r={OCS_W * 0.50 / 2} fill="url(#orb2)" />
      </Svg>
      {/* Subtle vignette from edges */}
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'transparent']}
        locations={[0, 0.35]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.45)']}
        locations={[0.65, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ORACLE ORB — Living breathing avatar (80px, 3 concentric rings)
// ─────────────────────────────────────────────────────────────────────────────
const OracleOrb = React.memo(({ modeColor, isTyping }: { modeColor: string; isTyping: boolean }) => {
  const outerRot   = useSharedValue(0);
  const middleRot  = useSharedValue(0);
  const innerScale = useSharedValue(1);
  const burstScale = useSharedValue(1);
  const burstOpacity = useSharedValue(0);
  const prevTyping = useRef(false);

  useEffect(() => {
    // Outer ring — slow clockwise 20s
    outerRot.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false,
    );
    // Middle ring — counter-clockwise 15s
    middleRot.value = withRepeat(
      withTiming(-360, { duration: 15000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(outerRot);
      cancelAnimation(middleRot);
      cancelAnimation(innerScale);
    };
  }, []);

  useEffect(() => {
    cancelAnimation(innerScale);
    if (isTyping) {
      // Fast pulse when typing — 0.8s cycle
      innerScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.88, { duration: 400, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
    } else {
      // Gentle breath 2.5s cycle
      innerScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1250, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.9, { duration: 1250, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );

      // If transitioning FROM typing → burst animation
      if (prevTyping.current) {
        burstOpacity.value = withSequence(
          withTiming(0.8, { duration: 120 }),
          withTiming(0, { duration: 600 }),
        );
        burstScale.value = withSequence(
          withTiming(1.5, { duration: 200, easing: Easing.out(Easing.quad) }),
          withTiming(1.0, { duration: 500, easing: Easing.out(Easing.quad) }),
        );
      }
    }
    prevTyping.current = isTyping;
  }, [isTyping]);

  const outerStyle  = useAnimatedStyle(() => ({ transform: [{ rotate: `${outerRot.value}deg` }] }));
  const middleStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${middleRot.value}deg` }] }));
  const innerStyle  = useAnimatedStyle(() => ({ transform: [{ scale: innerScale.value }] }));
  const burstStyle  = useAnimatedStyle(() => ({ transform: [{ scale: burstScale.value }], opacity: burstOpacity.value }));

  const ORB = 80;
  const cx = ORB / 2;
  const gold = isTyping ? '#F59E0B' : '#7C3AED';
  const goldLight = isTyping ? '#FBBF24' : '#A78BFA';

  return (
    <View style={{ width: ORB, height: ORB, alignItems: 'center', justifyContent: 'center' }}>
      {/* Burst ring (shown on AI response arrival) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: ORB / 2, borderWidth: 2, borderColor: goldLight },
          burstStyle,
        ]}
        pointerEvents="none"
      />
      {/* Outer rotating ring */}
      <Animated.View style={[StyleSheet.absoluteFill, outerStyle]}>
        <Svg width={ORB} height={ORB}>
          <Defs>
            <SvgRadialGradient id="orbGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={gold} stopOpacity="0.25" />
              <Stop offset="100%" stopColor={gold} stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>
          {/* Outer glow */}
          <Circle cx={cx} cy={cx} r={cx - 1} fill="url(#orbGlow)" />
          {/* Outer dashed ring */}
          <Circle
            cx={cx}
            cy={cx}
            r={cx - 2}
            fill="none"
            stroke={gold}
            strokeWidth={1.2}
            strokeDasharray="3 5"
            opacity={0.7}
          />
          {/* Tick marks on outer ring */}
          {[0, 60, 120, 180, 240, 300].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const r1 = cx - 4;
            const r2 = cx - 1;
            return (
              <Line
                key={i}
                x1={cx + r1 * Math.cos(rad)}
                y1={cx + r1 * Math.sin(rad)}
                x2={cx + r2 * Math.cos(rad)}
                y2={cx + r2 * Math.sin(rad)}
                stroke={gold}
                strokeWidth={1.5}
                opacity={0.9}
              />
            );
          })}
        </Svg>
      </Animated.View>
      {/* Middle counter-rotating ring */}
      <Animated.View style={[StyleSheet.absoluteFill, { margin: 10 }, middleStyle]}>
        <Svg width={ORB - 20} height={ORB - 20}>
          <Circle
            cx={(ORB - 20) / 2}
            cy={(ORB - 20) / 2}
            r={(ORB - 20) / 2 - 2}
            fill="none"
            stroke={goldLight}
            strokeWidth={1}
            strokeDasharray="2 6"
            opacity={0.55}
          />
          {/* Diamond markers on middle ring */}
          {[45, 135, 225, 315].map((deg, i) => {
            const r = (ORB - 20) / 2 - 2;
            const rad = (deg * Math.PI) / 180;
            const hx = (ORB - 20) / 2;
            return (
              <Circle
                key={i}
                cx={hx + r * Math.cos(rad)}
                cy={hx + r * Math.sin(rad)}
                r={2}
                fill={goldLight}
                opacity={0.85}
              />
            );
          })}
        </Svg>
      </Animated.View>
      {/* Inner pulsing circle */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: ORB - 34,
            height: ORB - 34,
            borderRadius: (ORB - 34) / 2,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          },
          innerStyle,
        ]}
      >
        <LinearGradient
          colors={isTyping ? ['#92400E', '#F59E0B', '#7C3AED'] : ['#1E1B4B', '#4C1D95', '#6D28D9']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={{ fontSize: 18, color: '#fff' }}>✦</Text>
      </Animated.View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ORACLE MEMORY BADGE — shows if past sessions exist
// ─────────────────────────────────────────────────────────────────────────────
const OracleMemoryBadge = React.memo(({ modeColor }: { modeColor: string }) => {
  const glow = useSharedValue(0.6);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    return () => cancelAnimation(glow);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: glow.value,
    shadowOpacity: glow.value * 0.6,
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(300).duration(600)}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'center',
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: modeColor + '55',
          backgroundColor: modeColor + '14',
          marginBottom: 10,
          shadowColor: modeColor,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
          elevation: 4,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 10, color: '#F59E0B', marginRight: 5 }}>✦</Text>
      <Text style={{ fontSize: 11, color: modeColor, fontWeight: '600', letterSpacing: 0.5 }}>
        Oracle Cię pamięta
      </Text>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ORACLE SPHERE 3D widget (used in empty state hero)
// ─────────────────────────────────────────────────────────────────────────────
const OracleSphere3D = React.memo(({ accent }: { accent: string }) => {
  const rot = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 12000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(rot);
  }, []);
  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-22, Math.min(22, e.translationY * 0.14));
      tiltY.value = Math.max(-22, Math.min(22, e.translationX * 0.14));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });
  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 500 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }],
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rot.value}deg` }],
  }));
  const sz = 90; const cx = sz / 2; const R = 28;
  return (
    <View style={{ height: 86, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={outerStyle}>
          <Svg width={sz} height={sz}>
            <Circle cx={cx} cy={cx} r={40} fill={accent + '0A'} />
            <Circle cx={cx} cy={cx} r={R} fill={accent + '18'} stroke={accent + '55'} strokeWidth={1.2} />
            <Ellipse cx={cx} cy={cx} rx={R} ry={R * 0.32} fill="none" stroke={accent + '44'} strokeWidth={0.8} />
            <Ellipse cx={cx} cy={cx} rx={R * 0.5} ry={R} fill="none" stroke={accent + '28'} strokeWidth={0.6} />
            <Circle cx={cx} cy={cx} r={4} fill={accent} opacity={0.95} />
          </Svg>
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, orbitStyle]}>
            <Svg width={sz} height={sz}>
              {[0, 1, 2, 3, 4, 5].map(i => {
                const a = (i / 6) * 2 * Math.PI;
                return <Circle key={i} cx={cx + 38 * Math.cos(a)} cy={cx + 38 * Math.sin(a) * 0.32} r={i % 2 === 0 ? 4 : 2.5} fill={accent} opacity={i % 2 === 0 ? 0.85 : 0.45} />;
              })}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// TYPING INDICATOR — wave-style dots + italic status text
// ─────────────────────────────────────────────────────────────────────────────
const TypingDots = React.memo(({ color }: { color: string }) => {
  const d1 = useSharedValue(0); const d2 = useSharedValue(0); const d3 = useSharedValue(0);
  const o1 = useSharedValue(0.4); const o2 = useSharedValue(0.4); const o3 = useSharedValue(0.4);
  const s1v = useSharedValue(1); const s2v = useSharedValue(1); const s3v = useSharedValue(1);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Wave sine motion (sequential, not bounce)
    const wave = withRepeat(
      withSequence(
        withTiming(-6, { duration: 300, easing: Easing.inOut(Easing.sin) }),
        withTiming(2, { duration: 200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    const glow = withRepeat(withSequence(withTiming(1.0, { duration: 300 }), withTiming(0.35, { duration: 400 })), -1, false);
    const scl  = withRepeat(withSequence(withTiming(1.25, { duration: 300 }), withTiming(0.85, { duration: 400 })), -1, false);

    d1.value = wave;
    d2.value = withDelay(140, wave);
    d3.value = withDelay(280, wave);
    o1.value = glow;
    o2.value = withDelay(140, glow);
    o3.value = withDelay(280, glow);
    s1v.value = scl;
    s2v.value = withDelay(140, scl);
    s3v.value = withDelay(280, scl);

    // Fade text in/out
    textOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.45, { duration: 600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );

    return () => {
      cancelAnimation(d1); cancelAnimation(d2); cancelAnimation(d3);
      cancelAnimation(o1); cancelAnimation(o2); cancelAnimation(o3);
      cancelAnimation(s1v); cancelAnimation(s2v); cancelAnimation(s3v);
      cancelAnimation(textOpacity);
    };
  }, []);

  // All useAnimatedStyle calls are unconditional at top level (Rules of Hooks compliant)
  const st1 = useAnimatedStyle(() => ({ transform: [{ translateY: d1.value }, { scale: s1v.value }], opacity: o1.value }));
  const st2 = useAnimatedStyle(() => ({ transform: [{ translateY: d2.value }, { scale: s2v.value }], opacity: o2.value }));
  const st3 = useAnimatedStyle(() => ({ transform: [{ translateY: d3.value }, { scale: s3v.value }], opacity: o3.value }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(300)} style={td.wrap}>
      {/* Oracle orb mini */}
      <View style={[td.miniOrb, { borderColor: color + '66', backgroundColor: color + '18' }]}>
        <Text style={{ fontSize: 8, color }}>✦</Text>
      </View>
      <View style={{ flex: 1, paddingLeft: 10 }}>
        {/* Shimmer placeholder bubble */}
        <View style={[td.shimmerBubble, { borderColor: color + '33', borderLeftColor: color }]}>
          <LinearGradient
            colors={[color + '08', color + '1A', color + '08']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Animated.View style={[td.dot, { backgroundColor: color }, st1]} />
            <Animated.View style={[td.dot, { backgroundColor: color, width: 11, height: 11, borderRadius: 5.5 }, st2]} />
            <Animated.View style={[td.dot, { backgroundColor: color }, st3]} />
          </View>
          <Animated.Text style={[td.statusText, { color: color + 'BB' }, textStyle]}>
            Wyrocznia szuka odpowiedzi...
          </Animated.Text>
        </View>
      </View>
    </Animated.View>
  );
});

const td = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  miniOrb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  shimmerBubble: {
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderLeftWidth: 2,
    paddingHorizontal: 18,
    paddingVertical: 14,
    overflow: 'hidden',
    gap: 8,
  },
  dot: { width: 9, height: 9, borderRadius: 4.5 },
  statusText: {
    fontSize: 12,
    fontStyle: 'italic',
    letterSpacing: 0.3,
    marginTop: 2,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ORACLE MODES / PRESETS / SUGGESTIONS
// ─────────────────────────────────────────────────────────────────────────────
const ORACLE_MODES: { id: OracleMode; label: string; copy: string; color: string; premium?: boolean }[] = [
  { id: 'gentle',      label: 'Delikatny',     copy: 'Miękkie prowadzenie i regulacja.',         color: '#F472B6' },
  { id: 'direct',      label: 'Bezpośredni',   copy: 'Jasny kierunek bez rozwadniania.',          color: '#60A5FA' },
  { id: 'ceremonial',  label: 'Ceremonialny',  copy: 'Rytuał, symbol i głębsza forma.',           color: '#F97316', premium: true },
  { id: 'mystical',    label: 'Mistyczny',     copy: 'Więcej warstw, obrazów i archetypów.',      color: '#A78BFA', premium: true },
  { id: 'therapeutic', label: 'Terapeutyczny', copy: 'Spokojne nazwanie napięcia i opieka.',      color: '#34D399', premium: true },
];

const MODE_ICONS: Record<string, string> = {
  gentle: '✦',
  direct: '◆',
  ceremonial: '⟁',
  mystical: '◉',
  therapeutic: '✿',
};

const ORACLE_SESSION_PRESETS: {
  id: OracleSessionKind;
  title: string;
  subtitle: string;
  icon: typeof Sparkles;
  prompt: string;
  suggestedMode: OracleMode;
}[] = [
  {
    id: 'morning',
    title: 'Poranek',
    subtitle: 'Ustaw ton dnia i jedną intencję.',
    icon: Compass,
    prompt: 'Przygotuj mnie na ten dzień i pokaż, na czym naprawdę warto się dziś skupić.',
    suggestedMode: 'direct',
  },
  {
    id: 'evening',
    title: 'Wieczór',
    subtitle: 'Domknij emocje i odzyskaj oddech.',
    icon: MoonStar,
    prompt: 'Pomóż mi domknąć ten dzień, nazwać najważniejszy wgląd i puścić to, co już nie musi iść ze mną dalej.',
    suggestedMode: 'gentle',
  },
  {
    id: 'crisis',
    title: 'Ukojenie',
    subtitle: 'Na momenty przeciążenia i chaosu.',
    icon: ShieldAlert,
    prompt: 'Czuję napięcie i potrzebuję prostego, spokojnego prowadzenia krok po kroku.',
    suggestedMode: 'therapeutic',
  },
  {
    id: 'manifestation',
    title: 'Manifestacja',
    subtitle: 'Nazwij kierunek i ruch na teraz.',
    icon: Flame,
    prompt: 'Pomóż mi zobaczyć, co naprawdę chcę przyciągnąć i jaki jeden ruch powinienem wykonać.',
    suggestedMode: 'ceremonial',
  },
  {
    id: 'integration',
    title: 'Integracja',
    subtitle: 'Połącz emocje, symbole i sens.',
    icon: HeartHandshake,
    prompt: 'Połącz w jedną opowieść to, co dziś poczułam lub poczułem, i pokaż, jaka lekcja przez to przechodzi.',
    suggestedMode: 'mystical',
  },
];

const DEFAULT_STARTER_PATHS = [
  'Nazwij, co dziś naprawdę domaga się uwagi.',
  'Pokaż, co pracuje pod tym napięciem.',
  'Czy to próg zmiany, czy sygnał zatrzymania?',
];

const DEFAULT_FOLLOW_UPS = [
  'Pogłęb ten wątek',
  'Przekształć to w zapis do dziennika',
  'Pokaż, jaka emocja stoi pod spodem',
  'Daj mi jeden konkretny krok na dziś',
];

const DOMAIN_SUGGESTION_MAP: Record<string, { entry: string[]; deepen: string[]; integrate: string[] }> = {
  tarot_reading: {
    entry: ['Co w tych kartach mówi najgłośniej?', 'Która karta niesie właściwy następny ruch?', 'Co w tym odczycie nadal pozostaje ukryte?'],
    deepen: ['Pogłęb ten odczyt', 'Pokaż ukryty wpływ z kart', 'Nazwij cień tej karty', 'Pokaż, co karta próbuje ochronić'],
    integrate: ['Zamień to w pytanie do dziennika', 'Nazwij jeden rytuał po tym rozkładzie', 'Daj mi jeden ruch po tym odczycie'],
  },
  astrology: {
    entry: ['Jak najlepiej wykorzystać dzisiejszą energię?', 'Na który obszar dnia najbardziej uważać?', 'Jak połączyć ten układ z jedną realną decyzją?'],
    deepen: ['Pogłęb astrologiczny sygnał', 'Powiedz, co dziś najbardziej wspiera', 'Nazwij napięcie między potrzebą a działaniem'],
    integrate: ['Przełóż to na decyzję', 'Zamień to w zapis do dziennika', 'Powiedz, czego dziś nie przyspieszać'],
  },
  chinese_astrology: {
    entry: ['Jak mój żywioł pracuje dziś w praktyce?', 'Co ten znak mówi o moim tempie i granicach?', 'Jak połączyć tę warstwę z codzienną decyzją?'],
    deepen: ['Pogłęb ten żywioł', 'Połącz znak z zachodnią astrologią', 'Nazwij ryzyko i moc tej energii'],
    integrate: ['Daj jeden ruch zgodny z tym rytmem', 'Powiedz, gdzie dziś zwolnić', 'Przełóż to na relację lub pracę'],
  },
  matrix: {
    entry: ['Która liczba pracuje dziś najmocniej?', 'Jak ten wzór przekłada się na relacje?', 'Jaki jeden ruch wynika z tej matrycy?'],
    deepen: ['Pogłęb liczbę centralną', 'Pokaż mój powtarzający się wzorzec', 'Nazwij lekcję ukrytą pod tą liczbą'],
    integrate: ['Nazwij lekcję i ruch', 'Zamień to w zapis do dziennika', 'Przełóż to na realną decyzję'],
  },
  dream: {
    entry: ['Co ten symbol próbuje mi powiedzieć?', 'Czy ten sen coś domyka, czy otwiera?', 'Jaki zapis warto zrobić po tym śnie?'],
    deepen: ['Pogłęb główny symbol', 'Nazwij emocję pod tym snem', 'Pokaż, co w śnie jest ostrzeżeniem, a co zaproszeniem'],
    integrate: ['Zapisz to jako pytanie do dziennika', 'Przełóż ten sen na ruch na dziś', 'Powiedz, co po tym śnie warto chronić'],
  },
  affirmation: {
    entry: ['Jak naprawdę wcielić to zdanie w życie?', 'Co blokuje przyjęcie tej afirmacji?', 'Jak połączyć ją z jednym małym ruchem?'],
    deepen: ['Pokaż opór wobec tej afirmacji', 'Nazwij zdanie, które boli bardziej niż wspiera', 'Powiedz, jak to brzmi w ciele'],
    integrate: ['Przełóż to na jeden mikro-krok', 'Zamień to w zapis do dziennika', 'Powiedz, czego dziś nie muszę udowadniać'],
  },
  numerology: {
    entry: ['Co ta liczba próbuje mi dziś uświadomić?', 'Jak ten układ przekłada się na relacje i pracę?', 'Jaki jeden ruch jest zgodny z moją drogą życia?'],
    deepen: ['Pogłęb drogę życia', 'Nazwij mój rok osobisty', 'Pokaż konflikt między moją liczbą a obecną sytuacją'],
    integrate: ['Przełóż to na relacje', 'Daj mi jeden numerologiczny krok', 'Nazwij decyzję zgodną z tą liczbą'],
  },
  compatibility: {
    entry: ['Co między nami najbardziej domaga się nazwania?', 'Jaki wzorzec relacyjny wraca najmocniej?', 'Jak rozmawiać bez eskalacji i utraty bliskości?'],
    deepen: ['Pogłęb dynamikę relacji', 'Pokaż ukryte napięcie', 'Nazwij nasze niezaspokojone potrzeby'],
    integrate: ['Nazwij język porozumienia', 'Daj nam jeden spokojny krok', 'Powiedz, czego nie warto dziś mówić w impulsie'],
  },
  partner_tarot: {
    entry: ['Co między nami mówi najgłośniej pod powierzchnią?', 'Jaki cień relacyjny wraca w tej więzi?', 'Jak czytać ten tarot bez wchodzenia w lęk?'],
    deepen: ['Pogłęb ten tarot dla dwojga', 'Nazwij ukryty wzorzec między nami', 'Pokaż, co wymaga rozmowy'],
    integrate: ['Daj jeden spokojny ruch po tym odczycie', 'Powiedz, jak chronić bliskość po tej prawdzie', 'Zamień to w pytanie do rozmowy'],
  },
  cleansing: {
    entry: ['Co naprawdę próbuję dziś puścić?', 'Czy to lęk, przeciążenie czy cudzy ciężar?', 'Jaki rytuał ochrony i uwolnienia jest teraz właściwy?'],
    deepen: ['Pogłęb to uwalnianie', 'Nazwij, co do mnie nie należy', 'Pokaż, gdzie trzymam napięcie wbrew sobie'],
    integrate: ['Daj rytuał ochrony', 'Przełóż to na zapis do dziennika', 'Powiedz, jak domknąć ten ciężar dziś wieczorem'],
  },
  knowledge: {
    entry: ['Wytłumacz mi ten symbol głębiej', 'Jak połączyć tę wiedzę z codziennym życiem?', 'Od którego mistycznego tematu warto zacząć dalej?'],
    deepen: ['Połącz to z archetypami', 'Wytłumacz symbolikę głębiej', 'Powiedz, z jakiej tradycji wyrasta ten motyw'],
    integrate: ['Pokaż praktyczne zastosowanie', 'Zaproponuj następny temat odkrywania', 'Nazwij najprostszy rytuał związany z tym motywem'],
  },
  stars: {
    entry: ['Jak czytać ten cykl Księżyca w praktyce?', 'Co ta konstelacja mówi symbolicznie?', 'Jak połączyć gwiazdy z decyzją na dziś?'],
    deepen: ['Pogłęb znaczenie fazy', 'Połącz to z astrologią zachodnią', 'Wyjaśnij spokojnie symbolikę nieba'],
    integrate: ['Daj jeden kosmiczny trop na dziś', 'Powiedz, co dziś zasiewać, a co domknąć', 'Przełóż to na rytm tygodnia'],
  },
  general: {
    entry: DEFAULT_STARTER_PATHS,
    deepen: ['Pogłęb ten wątek', 'Nazwij sedno tego napięcia', 'Pokaż, co wraca pod spodem'],
    integrate: DEFAULT_FOLLOW_UPS,
  },
};

const buildContextualSuggestions = (
  stage: 'entry' | 'follow',
  activeSource?: string,
  latestAssistantMessage?: string | null,
  contextSeed?: string | null,
  sessionKind?: OracleSessionKind
) => {
  const profile = DOMAIN_SUGGESTION_MAP[activeSource || 'general'] || DOMAIN_SUGGESTION_MAP.general;
  const message = (latestAssistantMessage || '').toLowerCase();
  const seed = (contextSeed || '').toLowerCase();
  const emotionalSignals = [
    message.includes('lęk') ? 'Nazwij łagodniej to, co dziś uruchamia lęk' : null,
    message.includes('relac') ? 'Pokaż, jak rozmawiać o tym bez obrony' : null,
    message.includes('decyz') ? 'Powiedz, jaki ruch jest dziś naprawdę dojrzały' : null,
    message.includes('gran') ? 'Nazwij granicę, której nie warto dziś oddawać' : null,
    message.includes('ciał') ? 'Przełóż to na sygnał z ciała i oddechu' : null,
  ].filter(Boolean) as string[];
  const contextSignals = [
    seed.includes('partner') || seed.includes('relac') ? 'Pokaż, czego ta relacja naprawdę dziś potrzebuje' : null,
    seed.includes('praca') || seed.includes('karier') ? 'Powiedz, jaki ruch zawodowy ma dziś najwięcej sensu' : null,
    seed.includes('lęk') || seed.includes('cięż') ? 'Nazwij, co warto dziś uwolnić zamiast dalej nieść' : null,
    seed.includes('miłość') || seed.includes('blisk') ? 'Pokaż, jak chronić bliskość bez utraty siebie' : null,
    seed.includes('sen') || seed.includes('symbol') ? 'Nazwij symbol, który nie powinien zostać pominięty' : null,
    seed.includes('liczb') || seed.includes('matry') ? 'Powiedz, która liczba lub oś jest dziś kluczowa' : null,
  ].filter(Boolean) as string[];
  const stageSignals = [
    sessionKind === 'crisis' ? 'Daj mi jeden najbezpieczniejszy krok na teraz' : null,
    sessionKind === 'manifestation' ? 'Nazwij działanie, które naprawdę zasila intencję' : null,
    sessionKind === 'evening' ? 'Powiedz, co warto dziś już puścić' : null,
    sessionKind === 'morning' ? 'Ułóż z tego jedną intencję na dziś' : null,
  ].filter(Boolean) as string[];

  if (stage === 'entry') {
    return [...contextSignals, ...stageSignals, ...profile.entry, ...emotionalSignals]
      .filter((value, index, self) => self.indexOf(value) === index)
      .slice(0, 5);
  }
  return [...contextSignals, ...stageSignals, ...profile.deepen, ...profile.integrate, ...emotionalSignals]
    .filter((value, index, self) => self.indexOf(value) === index)
    .slice(0, 6);
};

const resolveSourceLabel = (source?: string) => {
  if (source === 'tarot_reading') return 'Po odczycie tarota';
  if (source === 'home') return 'Z osobistego sanktuarium';
  if (source === 'oracle_tab') return 'Z wejścia Oracle';
  if (source === 'numerology') return 'Z numerologii';
  if (source === 'compatibility') return 'Z analizy relacji';
  if (source === 'cleansing') return 'Z oczyszczania';
  if (source === 'knowledge') return 'Z biblioteki mistycznej';
  if (source === 'stars') return 'Z gwiazd i kosmicznych cykli';
  if (source === 'chinese_astrology') return 'Z chińskiej astrologii';
  if (source === 'affirmation') return 'Z afirmacji';
  if (source === 'dream') return 'Ze snu';
  if (source === 'partner_tarot') return 'Z tarota relacyjnego';
  if (source === 'oracle_ritual') return 'Rytualne wejście';
  return 'Prywatna sesja';
};

const splitIntoSentences = (content: string) => {
  return content
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const SOURCE_BLOCK_TITLES: Record<string, [string, string, string]> = {
  tarot_reading:  ['Pole odczytu',     'Ukryte napięcie',    'Konkretny ruch'],
  partner_tarot:  ['Pole relacji',      'Węzeł między wami',  'Następny ruch'],
  dream:          ['Żywy symbol',       'Emocja pod spodem',  'Pytanie do niesienia'],
  cleansing:      ['Co ciągnie',        'Granica',            'Jeden krok uwolnienia'],
  ritual:         ['Intencja',          'Sekwencja',          'Domknięcie'],
  rituals:        ['Intencja',          'Sekwencja',          'Domknięcie'],
  oracle_ritual:  ['Próg ceremonii',    'Sekwencja',          'Domknięcie'],
  astrology:      ['Aktywny wzorzec',   'Osobiste znaczenie', 'Timing i decyzja'],
  horoscope:      ['Ton znaku',         'Relacyjna warstwa',  'Jeden ruch na dziś'],
  stars:          ['Aktywny cykl',      'Symboliczny timing', 'Kosmiczny trop'],
  numerology:     ['Aktywna liczba',    'Wzorzec zyciowy',    'Decyzja skalarna'],
  matrix:         ['Centrum matrycy',   'Os napiecia',        'Integracja'],
  compatibility:  ['Dynamika wiezi',    'Ukryty wezel',       'Ruch naprawczy'],
  affirmation:    ['Czy zdanie laduje', 'Gdzie jest opor',    'Wersja prawdziwsza'],
  journal:        ['Wzorzec w zapisie', 'Ukryte uczucie',     'Nastepne zdanie'],
  knowledge:      ['Symbol i tradycja', 'Glebsza logika',     'Praktyczne zastosowanie'],
  home:           ['Centrum dnia',      'Punkt napiecia',     'Jeden ruch'],
};

const buildOracleBlocks = (content: string, source?: string) => {
  const cleanContent = content
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^[•\-]\s+/gm, '✦ ')
    .replace(/\n[•\-]\s+/g, '\n✦ ')
    .trim();
  const paragraphs = cleanContent.split(/\n\n+/).map((p: string) => p.trim()).filter(Boolean);
  const sentences = splitIntoSentences(cleanContent);
  if (paragraphs.length >= 3) {
    return [
      { title: 'Obserwacja', body: paragraphs[0], icon: Sparkles, isFirst: true },
      { title: 'Głębsza warstwa', body: paragraphs.slice(1, paragraphs.length > 3 ? 3 : 2).join('\n\n'), icon: WandSparkles, isFirst: false },
      { title: 'Znaczenie i ruch', body: paragraphs.slice(paragraphs.length > 3 ? 3 : 2).join('\n\n'), icon: Flame, isFirst: false },
    ].filter((item: any) => item.body && item.body.length > 20);
  }
  const third = Math.max(2, Math.floor(sentences.length / 3));
  const getChunk = (s: number, e?: number) => sentences.slice(s, e).join(' ');
  return [
    { title: 'Obserwacja', body: getChunk(0, third) || cleanContent, icon: Sparkles, isFirst: true },
    { title: 'Wzorzec i sens', body: getChunk(third, third * 2) || 'Warto zatrzymać się przy tym, co wraca nie przez przypadek.', icon: WandSparkles, isFirst: false },
    { title: 'Ruch', body: getChunk(third * 2) || 'Jeden konkretny krok przywraca sprawczość.', icon: Flame, isFirst: false },
  ].filter((item: any) => item.body && item.body.length > 20);
};

// ─────────────────────────────────────────────────────────────────────────────
// HEADER ORB STRIP — compact orb + "WYROCZNIA" label for use in chat header
// ─────────────────────────────────────────────────────────────────────────────
const HeaderOrbStrip = React.memo(({ modeColor, isTyping }: { modeColor: string; isTyping: boolean }) => (
  <View style={{ alignItems: 'center', paddingBottom: 6, paddingTop: 2 }}>
    <OracleOrb modeColor={modeColor} isTyping={isTyping} />
    <Text
      style={{
        fontSize: 9,
        letterSpacing: 4,
        color: '#F59E0B',
        fontWeight: '700',
        marginTop: 4,
        opacity: 0.9,
      }}
    >
      WYROCZNIA
    </Text>
  </View>
));

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const OracleChatScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isOnline = useNetworkStatus();
  const { aiResponseLength: globalLength } = useAppStore((s) => s.experience);
  const [localResponseLength, setLocalResponseLength] = React.useState<'short' | 'medium' | 'deep'>(
    (globalLength as 'short' | 'medium' | 'deep') || 'medium'
  );
  const experience = useAppStore(s => s.experience);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight, themeName, themeMode } = useTheme();
  const keyboardOpen = useKeyboardOpen();
  const { isPremium, trackUsage, usage } = usePremiumStore();
  const [paywallVisible, setPaywallVisible] = React.useState(false);
  const [paywallPreview, setPaywallPreview] = React.useState('');
  const { addEntry } = useJournalStore();

  const initialContext = route.params?.context;
  const initialQuestion = route.params?.initialQuestion as string | undefined;
  const forceNewSession = route.params?.forceNewSession;
  const source = route.params?.source;
  const initialMode = route.params?.initialMode as OracleMode | undefined;
  const initialKind = route.params?.sessionKind as OracleSessionKind | undefined;
  const {
    currentSession,
    pastSessions,
    startSession,
    addMessage,
    endSession,
    loadSession,
    updateSessionMeta,
    deleteSession,
  } = useOracleStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [errorRetryLabel, setErrorRetryLabel] = useState('Spróbuj ponownie');
  const [fallbackPrompt, setFallbackPrompt] = useState('');
  const [pinnedMessageId, setPinnedMessageId] = useState('');
  const aiAvailability = AiService.getLaunchAvailabilityState();
  const aiAvailable = aiAvailability.available;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Main', { screen: 'Oracle' });
  };
  const scrollViewRef = useRef<ScrollView>(null);
  const modeRailRef = useRef<ScrollView>(null);
  const messageLayouts = useRef<Record<string, number>>({});
  const lastAutoScrolledAssistantId = useRef('');
  const glowAnim = useRef(new RNAnimated.Value(0)).current;
  const sendScaleAnim = useRef(new RNAnimated.Value(1)).current;
  const [inputFocused, setInputFocused] = useState(false);

  const messages = currentSession?.messages || [];
  const activeMode = currentSession?.mode || initialMode || 'gentle';
  const activeKind = currentSession?.kind || initialKind || 'general';
  const currentModeColor = ORACLE_MODES.find(m => m.id === activeMode)?.color || currentTheme.primary;

  // Has past sessions → show memory badge
  const hasPastSessions = pastSessions.length > 0;

  const handleInitialOracleResponse = async (contextMsg: string) => {
    setIsLoading(true);
    setErrorMessage('');
    setErrorTitle('');
    setErrorRetryLabel('Spróbuj ponownie');
    setFallbackPrompt('');
    try {
      const response = await AiService.chatWithOracleAdvanced([{ role: 'user', content: contextMsg }], undefined, {
        mode: initialMode || 'mystical',
        kind: initialKind || 'integration',
        source: source || 'tarot_reading',
        currentContext: contextMsg,
      });
      addMessage({ role: 'assistant', content: response });
    } catch (error) {
      const recovery = AiService.getGuidanceRecoveryState(error, 'oracle');
      setErrorTitle(recovery.title);
      setErrorMessage(recovery.body);
      setErrorRetryLabel(recovery.retryLabel);
      setFallbackPrompt(recovery.fallbackPrompt);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuestion && forceNewSession) {
      if (currentSession) endSession();
      startSession(
        { role: 'user', content: initialQuestion },
        'Moje pytanie',
        { mode: initialMode || 'gentle', kind: initialKind || 'general', source: 'oracle_portal' }
      );
      handleInitialOracleResponse(initialQuestion);
      return;
    }

    if (initialContext && forceNewSession) {
      if (currentSession) {
        endSession();
      }
      startSession(
        { role: 'user', content: initialContext, context: source || 'tarot_reading' },
        'Odbicie tarota',
        {
          mode: initialMode || 'mystical',
          kind: initialKind || 'integration',
          source: source || 'tarot_reading',
        }
      );
      handleInitialOracleResponse(initialContext);
      return;
    }

    if (!currentSession) {
      startSession(
        {
          role: 'assistant',
          content: 'Jestem tutaj spokojnie. Możesz wejść od pytania, emocji, symbolu albo od samego chaosu.',
        },
        'Komnata Oracle',
        {
          mode: initialMode || 'gentle',
          kind: initialKind || 'general',
          source: source || 'general',
        }
      );
    }
  }, []);

  const latestAssistantMessage = useMemo(() => {
    return [...messages].reverse().find((message) => message.role === 'assistant') || null;
  }, [messages]);
  const activeSource = currentSession?.source || source || 'general';
  const starterPaths = useMemo(
    () => buildContextualSuggestions('entry', activeSource, latestAssistantMessage?.content || null, currentSession?.messages?.[0]?.content || initialContext || '', activeKind),
    [activeKind, activeSource, currentSession?.messages, initialContext, latestAssistantMessage]
  );
  const followUps = useMemo(
    () => buildContextualSuggestions('follow', activeSource, latestAssistantMessage?.content || null, currentSession?.messages?.[0]?.content || initialContext || '', activeKind),
    [activeKind, activeSource, currentSession?.messages, initialContext, latestAssistantMessage]
  );
  const isResumedSession = Boolean(currentSession && currentSession.messages.length > 1 && !forceNewSession);
  const featuredPresets = useMemo(
    () => ORACLE_SESSION_PRESETS.filter((preset) => ['morning', 'crisis', 'integration'].includes(preset.id)),
    []
  );

  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage) return;

    const timeout = setTimeout(() => {
      if (latestMessage.role === 'assistant') {
        const y = messageLayouts.current[latestMessage.id];
        if (typeof y === 'number') {
          lastAutoScrolledAssistantId.current = latestMessage.id;
          scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 18), animated: true });
          return;
        }
      }
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 140);

    return () => clearTimeout(timeout);
  }, [messages]);

  if (!aiAvailable) {
    return (
      <View style={[styles.container, { backgroundColor: isLight ? currentTheme.background : '#07060F' }]}>
        <OracleBackground modeColor={currentModeColor} isLight={isLight} />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          {!isOnline && <OfflineBanner message={t('oracle.brak_polaczenia_ai_niedostepn', 'Brak polaczenia — AI niedostepne')} />}
          <View style={styles.header}>
            <Pressable onPress={handleBack} style={styles.backBtn}>
              <ChevronLeft color={currentTheme.primary} size={26} />
            </Pressable>
            <View style={styles.headerTitle}>
              <Typography variant="premiumLabel" color={currentTheme.primary}>{t('oracle.komnata_oracle', 'Komnata Oracle')}</Typography>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MusicToggleButton color={currentTheme.primary} size={18} />
              <Pressable
                onPress={() => {
                  void HapticsService.selection();
                  if (isFavoriteItem('oracle_chat')) {
                    removeFavoriteItem('oracle_chat');
                  } else {
                    addFavoriteItem({ id: 'oracle_chat', label: 'Oracle AI', sublabel: 'Komnata rozmowy', route: 'OracleChat', params: { source: 'portal', forceNewSession: true }, icon: 'Sparkles', color: currentTheme.primary, addedAt: new Date().toISOString() });
                  }
                }}
                style={[styles.backBtn, { alignItems: 'center', justifyContent: 'center' }]}
              >
                <Star color={currentTheme.primary} size={18} strokeWidth={1.8} fill={isFavoriteItem('oracle_chat') ? currentTheme.primary : 'none'} />
              </Pressable>
            </View>
          </View>
          <ScrollView ref={scrollViewRef} contentContainerStyle={[styles.chatScroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'airy') + 10 }]}>
            <SectionHeading
              eyebrow="Prywatna komnata"
              title={aiAvailability.title}
              subtitle={aiAvailability.body}
            />
            <View style={{ marginHorizontal: layout.padding.screen, marginVertical: 12, borderLeftWidth: 3, borderLeftColor: currentTheme.primary, paddingLeft: 16, paddingVertical: 14 }}>
              <Typography variant="premiumLabel" color={currentTheme.primary}>{t('oracle.na_ten_moment', 'Na ten moment')}</Typography>
              <Typography variant="bodyRefined" style={{ marginTop: 8, lineHeight: 24, opacity: 0.85 }}>
                {t('oracle.oracle_nie_przyjmie_dzis_nowej', 'Oracle nie przyjmie dziś nowej rozmowy. Nie ukrywamy tego pod ponownymi próbami ani pustym „spróbuj jeszcze raz".')}
              </Typography>
            </View>
            <View style={{ marginHorizontal: layout.padding.screen, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.07)' }}>
              <Typography variant="microLabel" color={currentTheme.primary} style={{ marginBottom: 8 }}>{t('oracle.co_mozesz_zrobic_zamiast_tego', 'CO MOŻESZ ZROBIĆ ZAMIAST TEGO')}</Typography>
              <Typography variant="bodySmall" style={{ lineHeight: 22, opacity: 0.72 }}>
                {aiAvailability.fallbackPrompt}
              </Typography>
            </View>
            <View style={{ gap: 12 }}>
              <PremiumButton
                label={aiAvailability.actionLabel}
                onPress={() => navigation.navigate('JournalEntry', { prompt: aiAvailability.fallbackPrompt, type: 'reflection' })}
              />
              <Pressable style={[styles.followUpChip, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', borderColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)' }]} onPress={handleBack}>
                <Typography variant="microLabel" color={currentTheme.primary}>{t('oracle.wroc_do_poprzednie_sciezki', 'Wróć do poprzedniej ścieżki')}</Typography>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  useEffect(() => {
    if (messages.length === 0 && !inputFocused) {
      const pulse = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(glowAnim, { toValue: 1, duration: 2200, useNativeDriver: false }),
          RNAnimated.timing(glowAnim, { toValue: 0, duration: 2200, useNativeDriver: false }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
    RNAnimated.timing(glowAnim, { toValue: inputFocused ? 1 : 0, duration: 300, useNativeDriver: false }).start();
  }, [messages.length, inputFocused]);

  const animateSend = () => {
    RNAnimated.sequence([
      RNAnimated.spring(sendScaleAnim, { toValue: 0.88, useNativeDriver: true, tension: 200, friction: 10 }),
      RNAnimated.spring(sendScaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 6 }),
    ]).start();
  };

  const sendMessage = async (overrideText?: string) => {
    const userText = (overrideText || input).trim();
    if (!userText || isLoading) return;

    if (!isPremium) {
      const allowed = trackUsage('oracle');
      if (!allowed) {
        const lastAssistant = messages.slice().reverse().find((m: any) => m.role === 'assistant');
        setPaywallPreview(lastAssistant?.content?.substring(0, 220) || '');
        setPaywallVisible(true);
        return;
      }
    }

    void HapticsService.impact(Haptics.ImpactFeedbackStyle.Light);
    if (!overrideText) {
      setInput('');
    }
    setIsLoading(true);
    setErrorMessage('');
    setErrorTitle('');
    setErrorRetryLabel('Spróbuj ponownie');
    setFallbackPrompt('');
    addMessage({ role: 'user', content: userText });

    const sessionHistory = currentSession?.messages.map((m) => ({ role: m.role, content: m.content })) || [];
    const conversation = [...sessionHistory, { role: 'user' as const, content: userText }];

    try {
      const response = await AiService.chatWithOracleAdvanced(conversation, undefined, {
        responseLength: localResponseLength,
        mode: currentSession?.mode || activeMode,
        kind: currentSession?.kind || activeKind,
        source: currentSession?.source || source || 'general',
        currentContext: initialContext,
      });
      addMessage({ role: 'assistant', content: response });
      void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const recovery = AiService.getGuidanceRecoveryState(error, 'oracle');
      setErrorTitle(recovery.title);
      setErrorMessage(recovery.body);
      setErrorRetryLabel(recovery.retryLabel);
      setFallbackPrompt(recovery.fallbackPrompt);
      if (!overrideText) {
        setInput(userText);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (mode: OracleMode, premium?: boolean) => {
    if (premium && !isPremium) {
      navigation.navigate('Paywall');
      return;
    }
    void HapticsService.selection();
    updateSessionMeta({ mode });
    const modeIndex = ORACLE_MODES.findIndex(m => m.id === mode);
    const chipW = 120;
    const offset = Math.max(0, modeIndex * chipW - layout.window.width / 2 + chipW / 2);
    modeRailRef.current?.scrollTo({ x: offset, animated: true });
  };

  const startPresetSession = (preset: typeof ORACLE_SESSION_PRESETS[number]) => {
    void HapticsService.impact(Haptics.ImpactFeedbackStyle.Medium);
    updateSessionMeta({
      kind: preset.id,
      mode: preset.suggestedMode,
      title: preset.title,
      source: 'oracle_ritual',
    });
    setInput(preset.prompt);
  };

  const saveInsightToJournal = useCallback((message: OracleMessage) => {
    addEntry({
      type: 'reflection',
      title: 'Zapis z Oracle',
      content: message.content,
      tags: ['oracle', activeKind, activeMode],
    });
    void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
  }, [addEntry, activeKind, activeMode]);

  const pinInsight = useCallback((message: OracleMessage) => {
    setPinnedMessageId(message.id);
    saveInsightToJournal(message);
  }, [saveInsightToJournal]);

  const convertToJournalPrompt = useCallback((message: OracleMessage) => {
    const prompt = buildOracleBlocks(message.content)[3]?.body || 'Co najbardziej poruszyło Cię w tej rozmowie?';
    navigation.navigate('JournalEntry', { prompt, type: 'reflection' });
  }, [navigation]);

  const convertToRitual = useCallback((message: OracleMessage) => {
    navigateToDashboardSurface(navigation, 'rituals', {
      category: activeKind === 'crisis' ? 'Cleansing' : activeKind === 'manifestation' ? 'Manifestation' : 'Love',
      oraclePrompt: message.content,
    });
  }, [navigation, activeKind]);

  const shareInsight = useCallback(async (message: OracleMessage) => {
    const blocks = buildOracleBlocks(message.content, currentSession?.source || source);
    const summary = blocks.map((block) => `${block.title}: ${block.body}`).join('\n\n');
    await Share.share({
      message: buildElegantShareMessage(
        'Wgląd z Oracle',
        summary,
        'Udostępnione z prywatnej komnaty Aethera DuniAI & Oracle.'
      ),
    });
  }, [currentSession, source]);

  // ── Render Oracle (assistant) message bubble ─────────────────────────────
  const renderAssistantMessage = useCallback((message: OracleMessage, index: number) => {
    const isShortMessage = message.content.trim().length < 200;
    const blocks = isShortMessage
      ? [{ title: 'Oracle', body: message.content.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').trim(), icon: Sparkles, isFirst: true }]
      : buildOracleBlocks(message.content, currentSession?.source || source);
    const modeData = ORACLE_MODES.find((m) => m.id === activeMode);
    const modeColor = modeData?.color || currentTheme.primary;

    // Stagger delay based on index (capped so late messages still appear quickly)
    const msgDelay = Math.min(index * 50, 300);

    return (
      <Animated.View
        key={message.id}
        entering={FadeInUp.delay(msgDelay).duration(520)}
        style={styles.assistantMessageWrap}
        onLayout={(event) => {
          messageLayouts.current[message.id] = event.nativeEvent.layout.y;
        }}
      >
        {/* Oracle eyebrow label with horizontal accent lines */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: modeColor, opacity: 0.25 }} />
          <Text style={{ fontSize: 9, color: modeColor, letterSpacing: 2.5, fontWeight: '700', opacity: 0.85 }}>
            ✦  ORACLE
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: modeColor, opacity: 0.25 }} />
        </View>

        {/* Message header: mini avatar + meta */}
        <View style={styles.assistantHeader}>
          <View style={[
            styles.oracleAvatar,
            {
              borderColor: modeColor + '88',
              backgroundColor: modeColor + '1A',
              shadowColor: modeColor,
              shadowOpacity: 0.50,
              shadowRadius: 10,
              elevation: 6,
            },
          ]}>
            <Sparkles color={modeColor} size={17} />
          </View>
          <View style={styles.assistantMeta}>
            <Typography variant="premiumLabel" color={modeColor}>
              Oracle · {modeData?.label || 'Sesja'}
            </Typography>
            <Typography variant="caption" style={{ marginTop: 4 }}>
              {resolveSourceLabel(currentSession?.source)}
            </Typography>
          </View>
          {/* Timestamp */}
          {message.createdAt && (
            <Text style={{ fontSize: 10, opacity: 0.38, color: isLight ? '#251D16' : '#F5F1EA' }}>
              {new Date(message.createdAt).getHours().toString().padStart(2, '0')}:{new Date(message.createdAt).getMinutes().toString().padStart(2, '0')}
            </Text>
          )}
        </View>

        {/* Premium dark gradient bubble with gold left-border accent */}
        <View
          style={[
            styles.assistantCard,
            {
              backgroundColor: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(14,10,28,0.94)',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: isLight ? 'rgba(139,100,42,0.25)' : 'rgba(255,255,255,0.07)',
              borderLeftWidth: 2.5,
              borderLeftColor: modeColor,
              overflow: 'hidden',
              shadowColor: modeColor,
              shadowOpacity: 0.18,
              shadowRadius: 16,
              shadowOffset: { width: -2, height: 4 },
              elevation: 6,
            },
          ]}
        >
          {/* Top shimmer stripe */}
          <LinearGradient
            colors={[modeColor + '55', modeColor + '00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 }}
            pointerEvents="none"
          />
          {/* Dark inner gradient (dark mode only) */}
          {!isLight && (
            <LinearGradient
              colors={['#1B1040', '#0D0820', '#12082A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          )}

          {blocks.map((block, blockIndex) => {
            const Icon = block.icon;
            return (
              <View
                key={`${message.id}-${block.title}`}
                style={[styles.oracleBlock, blockIndex > 0 && styles.oracleBlockDivider]}
              >
                {!isShortMessage && (
                  <View style={styles.oracleBlockTitle}>
                    <Icon
                      color={block.isFirst ? modeColor : (isLight ? 'rgba(100,80,50,0.7)' : 'rgba(200,190,170,0.7)')}
                      size={block.isFirst ? 18 : 14}
                    />
                    <Typography
                      variant="premiumLabel"
                      color={block.isFirst ? modeColor : (isLight ? 'rgba(100,80,50,0.75)' : 'rgba(200,190,170,0.75)')}
                      style={{ marginLeft: 10, fontSize: block.isFirst ? 13 : 11, letterSpacing: 1.2 }}
                    >
                      {block.title}
                    </Typography>
                  </View>
                )}
                {/* ✦ prefix on first block */}
                <Typography
                  variant="bodySmall"
                  style={[
                    styles.oracleBlockCopy,
                    {
                      fontSize: 15,
                      lineHeight: 27,
                      color: isLight ? 'rgba(26,20,12,0.88)' : 'rgba(238,232,255,0.92)',
                      fontWeight: block.isFirst ? '400' : '300',
                    },
                  ]}
                >
                  {block.isFirst ? '✦ ' : ''}{block.body}
                </Typography>
              </View>
            );
          })}
        </View>

        {/* Action chips */}
        <View style={styles.assistantActions}>
          {[
            { label: 'Zapisz', icon: BookmarkPlus, onPress: () => saveInsightToJournal(message) },
            { label: 'Udostępnij', icon: ArrowRight, onPress: () => shareInsight(message) },
            { label: 'Przypnij', icon: Sparkles, onPress: () => pinInsight(message) },
            { label: 'Do dziennika', icon: ScrollText, onPress: () => convertToJournalPrompt(message) },
            { label: 'Do rytuału', icon: WandSparkles, onPress: () => convertToRitual(message) },
          ].map(({ label, icon: ActionIcon, onPress: onActionPress }) => (
            <Pressable
              key={label}
              onPress={onActionPress}
              style={[
                styles.actionChip,
                {
                  backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.07)',
                  borderColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.09)',
                },
              ]}
            >
              <ActionIcon color={currentTheme.primary} size={13} />
              <Typography variant="microLabel" color={currentTheme.primary} style={{ marginLeft: 7 }}>{label}</Typography>
            </Pressable>
          ))}
          <SpeakButton
            text={buildOracleBlocks(message.content, source).map(b => b.body).join('. ')}
            color={currentModeColor}
          />
        </View>
      </Animated.View>
    );
  }, [activeMode, activeKind, currentTheme, isLight, source, currentSession, pinnedMessageId, saveInsightToJournal, shareInsight, pinInsight, convertToJournalPrompt, convertToRitual]);

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: isLight ? currentTheme.background : '#06050E' }]}>
      <OracleBackground modeColor={currentModeColor} isLight={isLight} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {!isOnline && <OfflineBanner message={t('oracle.brak_polaczenia_ai_niedostepn_1', 'Brak polaczenia — AI niedostepne')} />}

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <View style={[styles.header, { overflow: 'hidden' }]}>
          <LinearGradient
            colors={[currentModeColor + '1A', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={20}>
            <ChevronLeft color={currentTheme.primary} size={28} strokeWidth={1.5} />
          </Pressable>

          {/* Center — Orb + title */}
          <View style={styles.headerTitle}>
            {/* Compact living orb */}
            {!isLight && (
              <View style={{ marginBottom: 2 }}>
                <HeaderOrbStrip modeColor={currentModeColor} isTyping={isLoading} />
              </View>
            )}
            {isLight && (
              <Typography variant="premiumLabel" color={currentTheme.primary}>
                {t('oracle.komnata_oracle_1', '✦ Komnata Oracle')}
              </Typography>
            )}
            {/* Mode badge */}
            {(() => {
              const modeData = ORACLE_MODES.find((m) => m.id === activeMode);
              return modeData ? (
                <View style={[styles.modeBadge, { backgroundColor: modeData.color + '1A', borderColor: modeData.color + '44' }]}>
                  <View style={[styles.modeDot, { backgroundColor: modeData.color }]} />
                  <Typography variant="microLabel" color={modeData.color}>{modeData.label}</Typography>
                </View>
              ) : null;
            })()}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MusicToggleButton color={currentTheme.primary} size={18} />
            <Pressable onPress={() => setShowHistory((prev) => !prev)} style={styles.historyBtn}>
              {showHistory
                ? <X color={currentTheme.textSoft} size={20} />
                : <Clock color={currentTheme.primary} size={20} />
              }
            </Pressable>
          </View>
        </View>

        {/* Header separator */}
        <LinearGradient
          colors={['transparent', currentModeColor + '77', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 1 }}
          pointerEvents="none"
        />

        {/* ── HISTORY PANEL ───────────────────────────────────────────────── */}
        {showHistory ? (
          <ScrollView contentContainerStyle={styles.historyContent} showsVerticalScrollIndicator={false}>
            <SectionHeading
              eyebrow="Archiwum sesji"
              title={t('oracle.twoje_wczesniejs_rozmowy_z_oracle', 'Twoje wcześniejsze rozmowy z Oracle')}
              subtitle={t('oracle.wracaj_do_wgladow_ktore_nadal', 'Wracaj do wglądów, które nadal pracują pod powierzchnią. Każda sesja może zostać wznowiona.')}
            />
            {pastSessions.map((session, idx) => (
              <View key={session.id} style={{ borderBottomWidth: idx < pastSessions.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.07)' }}>
                <Pressable onPress={() => { loadSession(session.id); setShowHistory(false); }} style={{ paddingHorizontal: layout.padding.screen, paddingVertical: 14 }}>
                  <Typography variant="cardTitle">{session.title || 'Prywatna sesja'}</Typography>
                  <Typography variant="bodySmall" style={{ marginTop: 6, opacity: 0.6 }}>
                    {new Date(session.startedAt).toLocaleDateString()} • {session.messages.length} wiadomości • {resolveSourceLabel(session.source)}
                  </Typography>
                </Pressable>
                <Pressable
                  style={[styles.historyDelete, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : '#0F1320', borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)' }]}
                  onPress={() => deleteSession(session.id)}
                >
                  <X color={currentTheme.primary} size={16} />
                  <Typography variant="microLabel" color={currentTheme.primary} style={{ marginLeft: 8 }}>
                    {t('oracle.usun', 'Usuń')}
                  </Typography>
                </Pressable>
              </View>
            ))}
            {pastSessions.length === 0 && (
              <View style={{ paddingHorizontal: layout.padding.screen, paddingVertical: 24, alignItems: 'center' }}>
                <Typography variant="bodyRefined" align="center" style={{ opacity: 0.6 }}>
                  {t('oracle.twoje_archiwum_jest_jeszcze_puste', 'Twoje archiwum jest jeszcze puste. Pierwsza głębsza rozmowa zacznie budować pamięć tego miejsca.')}
                </Typography>
              </View>
            )}
            <PremiumButton label={t('oracle.zamknij_historie', 'Zamknij historię')} onPress={() => setShowHistory(false)} variant="secondary" style={{ marginTop: 20 }} />
          </ScrollView>
        ) : (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={[
                styles.chatScroll,
                { paddingBottom: keyboardOpen ? screenContracts.keyboardInset(insets.bottom, 'composer') : screenContracts.bottomInset(insets.bottom, 'tight') },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            >
              {/* ── EMPTY STATE HERO ──────────────────────────────────────── */}
              {messages.length <= 1 && !isLoading ? (
                <>
                  {/* Large glowing orb hero */}
                  <Animated.View entering={FadeIn.duration(900)} style={styles.emptyHeroWrap}>
                    <View style={[styles.emptyGlowRing, { width: 240, height: 240, borderRadius: 120, borderColor: currentModeColor + '18' }]} />
                    <View style={[styles.emptyGlowRing, { width: 180, height: 180, borderRadius: 90, borderColor: currentModeColor + '28' }]} />
                    <View style={[styles.emptyGlowRing, { width: 130, height: 130, borderRadius: 65, borderColor: currentModeColor + '40' }]} />
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <OracleSphere3D accent={currentModeColor} />
                    </View>
                  </Animated.View>

                  {/* Memory badge — only if past sessions exist */}
                  {hasPastSessions && (
                    <OracleMemoryBadge modeColor={currentModeColor} />
                  )}

                  {/* Title */}
                  <Animated.View entering={FadeInUp.delay(200).duration(700)} style={styles.emptyTitleWrap}>
                    <Typography variant="caption" color={currentModeColor} style={{ letterSpacing: 3, marginBottom: 14, opacity: 0.9 }}>
                      {t('oracle.prywatna_komnata', '✦  PRYWATNA KOMNATA')}
                    </Typography>
                    <Typography
                      variant="heroTitle"
                      align="center"
                      color={isLight ? '#1A1410' : '#F5F0FA'}
                      style={{ fontSize: 26, lineHeight: 36, fontWeight: '300', letterSpacing: 0.5 }}
                    >
                      Nazwij to, co naprawdę{'\n'}potrzebuje dziś odpowiedzi.
                    </Typography>
                    <Typography
                      variant="bodySmall"
                      align="center"
                      style={{ marginTop: 12, lineHeight: 22, opacity: 0.58, letterSpacing: 0.2 }}
                    >
                      Wystarczy napięcie, obraz albo relacja,{'\n'}która nie daje dziś spokoju.
                    </Typography>
                  </Animated.View>

                  {/* Divider */}
                  <Animated.View entering={FadeIn.delay(350).duration(600)} style={{ alignItems: 'center', marginVertical: 20 }}>
                    <LinearGradient
                      colors={['transparent', currentModeColor + 'AA', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ width: 180, height: 1 }}
                    />
                  </Animated.View>

                  {/* Mode selection */}
                  <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.emptyModeSection}>
                    <Typography variant="caption" color={currentTheme.textMuted} style={{ letterSpacing: 2.5, marginBottom: 12, paddingHorizontal: layout.padding.screen }}>
                      {t('oracle.ton_sesji', 'TON SESJI')}
                    </Typography>
                    <ScrollView
                      ref={modeRailRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.emptyModeRail}
                      directionalLockEnabled
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      disableScrollViewPanResponder={false}
                    >
                      {ORACLE_MODES.map((mode) => {
                        const active = activeMode === mode.id;
                        return (
                          <Pressable
                            key={mode.id}
                            onPress={() => handleModeChange(mode.id, mode.premium)}
                            style={({ pressed }) => ([
                              styles.emptyModePill,
                              {
                                backgroundColor: active ? mode.color + '22' : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)'),
                                borderColor: active ? mode.color + '77' : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'),
                                shadowColor: mode.color,
                                shadowOpacity: active ? 0.40 : 0,
                                shadowRadius: active ? 14 : 0,
                                elevation: active ? 6 : 0,
                                opacity: pressed ? 0.8 : 1,
                              },
                            ])}
                          >
                            {active && (
                              <LinearGradient
                                colors={[mode.color + '28', mode.color + '08']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                              />
                            )}
                            <Typography variant="microLabel" style={{ fontSize: 13 }}>{MODE_ICONS[mode.id] || '✦'}</Typography>
                            <Typography
                              variant="caption"
                              color={active ? mode.color : currentTheme.textSoft}
                              style={{ marginLeft: 6, fontWeight: active ? '600' : '400' }}
                            >
                              {mode.label}
                            </Typography>
                            {mode.premium && !active && (
                              <Typography variant="microLabel" color={currentModeColor} style={{ marginLeft: 4, opacity: 0.7 }}>✦</Typography>
                            )}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </Animated.View>

                  {/* Resumed session badge */}
                  {isResumedSession && (
                    <Animated.View entering={FadeInUp.delay(450).duration(500)} style={[styles.emptyResumedBadge, { backgroundColor: currentModeColor + '14', borderColor: currentModeColor + '35' }]}>
                      <View style={[styles.emptyResumedDot, { backgroundColor: currentModeColor }]} />
                      <Typography variant="microLabel" color={currentModeColor} style={{ marginLeft: 8, letterSpacing: 1.2 }}>
                        {t('oracle.wznowiona_sesja', 'WZNOWIONA SESJA')}
                      </Typography>
                    </Animated.View>
                  )}

                  {/* Prompt suggestions */}
                  <Animated.View entering={FadeInUp.delay(500).duration(700)} style={styles.emptyPromptsSection}>
                    <Typography variant="caption" color={currentTheme.textMuted} style={{ letterSpacing: 2.5, marginBottom: 16 }}>
                      {t('oracle.od_czego_mozesz_zaczac', 'OD CZEGO MOŻESZ ZACZĄĆ')}
                    </Typography>
                    {starterPaths.slice(0, 4).map((path, idx) => (
                      <Animated.View key={path} entering={FadeInUp.delay(560 + idx * 80).duration(500)}>
                        <Pressable
                          onPress={() => { animateSend(); sendMessage(path); }}
                          style={({ pressed }) => ([
                            styles.emptyPromptPill,
                            {
                              backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)',
                              borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.08)',
                              opacity: pressed ? 0.75 : 1,
                            },
                          ])}
                        >
                          <View style={[styles.emptyPromptAccent, { backgroundColor: currentModeColor }]} />
                          <Typography
                            variant="bodySmall"
                            color={isLight ? 'rgba(26,20,12,0.76)' : 'rgba(240,234,250,0.72)'}
                            style={{ flex: 1, lineHeight: 22, letterSpacing: 0.1 }}
                          >
                            {path}
                          </Typography>
                          <ArrowRight color={currentModeColor} size={14} strokeWidth={2} style={{ opacity: 0.7 }} />
                        </Pressable>
                      </Animated.View>
                    ))}
                  </Animated.View>

                  {/* Session presets */}
                  <Animated.View entering={FadeInUp.delay(700).duration(600)} style={styles.emptyPresetsSection}>
                    <Typography variant="caption" color={currentTheme.textMuted} style={{ letterSpacing: 2.5, marginBottom: 14 }}>
                      {t('oracle.tryb_sesji', 'TRYB SESJI')}
                    </Typography>
                    <View style={styles.emptyPresetsRow}>
                      {featuredPresets.map((preset) => {
                        const Icon = preset.icon;
                        const active = activeKind === preset.id;
                        const pColor = ORACLE_MODES.find(m => m.id === preset.suggestedMode)?.color || currentModeColor;
                        return (
                          <Pressable
                            key={preset.id}
                            onPress={() => startPresetSession(preset)}
                            style={({ pressed }) => ([
                              styles.emptyPresetCard,
                              {
                                backgroundColor: active ? pColor + '1A' : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)'),
                                borderColor: active ? pColor + '66' : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.08)'),
                                shadowColor: pColor,
                                shadowOpacity: active ? 0.35 : 0.08,
                                shadowRadius: active ? 16 : 4,
                                elevation: active ? 6 : 1,
                                opacity: pressed ? 0.8 : 1,
                              },
                            ])}
                          >
                            {active && (
                              <LinearGradient
                                colors={[pColor + '20', 'transparent']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                              />
                            )}
                            <View style={[styles.emptyPresetIcon, { backgroundColor: pColor + '20', borderColor: pColor + '44' }]}>
                              <Icon color={pColor} size={18} strokeWidth={1.6} />
                            </View>
                            <Typography
                              variant="microLabel"
                              color={active ? pColor : currentTheme.textSoft}
                              style={{ marginTop: 8, fontSize: 11, textAlign: 'center' }}
                            >
                              {preset.title}
                            </Typography>
                            {active && (
                              <View style={[styles.emptyPresetActiveDot, { backgroundColor: pColor }]} />
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  </Animated.View>
                </>
              ) : (
                /* ── COMPACT MODE RAIL (active chat) ─────────────────────── */
                <View style={styles.modeSection}>
                  <ScrollView
                    ref={modeRailRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.modeRailCompact}
                    directionalLockEnabled
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    disableScrollViewPanResponder={false}
                  >
                    {ORACLE_MODES.map((mode) => {
                      const active = activeMode === mode.id;
                      return (
                        <Pressable
                          key={mode.id}
                          onPress={() => handleModeChange(mode.id, mode.premium)}
                          style={[
                            styles.modeChip,
                            {
                              backgroundColor: active ? mode.color + '1A' : (isLight ? 'rgba(255,248,234,0.92)' : 'rgba(255,255,255,0.07)'),
                              borderColor: active ? mode.color + '66' : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)'),
                            },
                          ]}
                        >
                          <View style={[styles.modeDotSmall, { backgroundColor: active ? mode.color : mode.color + '55' }]} />
                          <Typography variant="caption" color={active ? mode.color : currentTheme.textSoft}>
                            {mode.label}
                          </Typography>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* ── MESSAGES ──────────────────────────────────────────────── */}
              {messages.map((message, index) => (
                message.role === 'assistant' ? (
                  renderAssistantMessage(message, index)
                ) : (
                  /* USER BUBBLE — white/cream with user initial avatar */
                  <Animated.View
                    key={message.id}
                    entering={FadeInUp.delay(index * 40).duration(420)}
                    style={styles.userWrap}
                  >
                    {/* User initial avatar */}
                    <View style={[styles.userAvatar, { overflow: 'hidden' }]}>
                      <LinearGradient
                        colors={[currentModeColor + 'CC', currentModeColor + '66']}
                        style={StyleSheet.absoluteFill}
                      />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>
                        Ty
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.userBubble,
                        {
                          backgroundColor: isLight
                            ? 'rgba(255,255,255,0.96)'
                            : 'rgba(240,234,255,0.10)',
                          borderColor: isLight
                            ? 'rgba(139,100,42,0.20)'
                            : currentModeColor + '3A',
                          borderTopRightRadius: 4,
                          shadowColor: isLight ? '#000' : currentModeColor,
                          shadowOpacity: isLight ? 0.10 : 0.25,
                          shadowRadius: 10,
                          elevation: 4,
                        },
                      ]}
                    >
                      <Typography
                        variant="bodySmall"
                        style={{
                          fontSize: 15.5,
                          lineHeight: 24,
                          color: isLight ? 'rgba(26,18,8,0.90)' : 'rgba(245,241,234,0.92)',
                        }}
                      >
                        {message.content}
                      </Typography>
                      {/* Timestamp */}
                      {message.createdAt && (
                        <Text style={{ fontSize: 10, opacity: 0.35, color: isLight ? '#251D16' : '#F5F1EA', marginTop: 4, textAlign: 'right' }}>
                          {new Date(message.createdAt).getHours().toString().padStart(2, '0')}:{new Date(message.createdAt).getMinutes().toString().padStart(2, '0')}
                        </Text>
                      )}
                    </View>
                  </Animated.View>
                )
              ))}

              {/* ── TYPING INDICATOR ──────────────────────────────────────── */}
              {isLoading && <TypingDots color={currentModeColor} />}

              {/* ── ERROR STATE ───────────────────────────────────────────── */}
              {errorMessage ? (
                <View style={{ marginHorizontal: layout.padding.screen, marginVertical: 10, padding: 18, borderRadius: 16, backgroundColor: isLight ? 'rgba(251,146,60,0.08)' : 'rgba(251,146,60,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(251,146,60,0.30)' }}>
                  <Typography variant="premiumLabel" color="#FB923C" align="center">
                    {errorTitle || 'Ta odpowiedź potrzebuje chwili'}
                  </Typography>
                  <Typography variant="bodySmall" align="center" style={{ marginTop: 8, lineHeight: 22, opacity: 0.78 }}>
                    {errorMessage}
                  </Typography>
                  {fallbackPrompt ? (
                    <Pressable
                      key={fallbackPrompt}
                      style={[styles.followUpChip, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', borderColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)' }]}
                      onPress={() => setInput(fallbackPrompt)}
                    >
                      <Typography variant="bodySmall" color={currentTheme.textSoft}>{fallbackPrompt}</Typography>
                      <ArrowRight color={currentTheme.primary} size={14} />
                    </Pressable>
                  ) : null}
                  <PremiumButton label={errorRetryLabel} onPress={() => sendMessage(input)} variant="secondary" style={{ marginTop: 14 }} />
                </View>
              ) : null}

              {/* ── FOLLOW-UP CHIPS ───────────────────────────────────────── */}
              {latestAssistantMessage && !isLoading && (
                <View style={styles.followUpSection}>
                  <Typography variant="premiumLabel" color={currentTheme.primary} style={{ marginBottom: 12 }}>
                    {t('oracle.co_dalej', 'Co dalej')}
                  </Typography>
                  {followUps.map((item) => (
                    <Pressable
                      key={item}
                      style={[
                        styles.followUpChip,
                        {
                          borderColor: currentModeColor + '55',
                          overflow: 'hidden',
                          shadowColor: currentModeColor,
                          shadowOpacity: 0.18,
                          shadowRadius: 10,
                          elevation: 4,
                          backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)',
                        },
                      ]}
                      onPress={() => { animateSend(); sendMessage(item); }}
                    >
                      <LinearGradient
                        colors={[currentModeColor + '18', 'transparent'] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <LinearGradient
                        colors={['transparent', currentModeColor + '77', 'transparent'] as [string, string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1 }}
                        pointerEvents="none"
                      />
                      <Typography variant="bodySmall" color={currentTheme.textSoft}>{item}</Typography>
                      <ArrowRight color={currentModeColor} size={14} />
                    </Pressable>
                  ))}
                </View>
              )}
              {!keyboardOpen ? <EndOfContentSpacer size="compact" /> : null}
            </ScrollView>

            {/* ── INPUT BAR — Sacred frosted glass design ────────────────── */}
            <View
              style={[
                styles.inputArea,
                {
                  paddingBottom: keyboardOpen
                    ? screenContracts.keyboardInset(insets.bottom, 'composer')
                    : Math.max(insets.bottom + 8, 16),
                  borderTopColor: 'transparent',
                  backgroundColor: isLight ? currentTheme.background : '#06050E',
                },
              ]}
            >
              {/* Mode pill */}
              <Animated.View
                key={activeMode}
                entering={FadeIn.duration(250)}
                style={[styles.modePill, { backgroundColor: currentModeColor + '1A', borderColor: currentModeColor + '55' }]}
              >
                <Typography variant="microLabel" color={currentModeColor}>
                  {MODE_ICONS[activeMode] || '✦'} {ORACLE_MODES.find(m => m.id === activeMode)?.label || 'Oracle'}
                </Typography>
              </Animated.View>

              {/* Composer shell */}
              <RNAnimated.View
                style={[
                  styles.composerShell,
                  {
                    backgroundColor: isLightBg(currentTheme.background)
                      ? 'rgba(255,248,240,0.80)'
                      : 'rgba(18,12,32,0.92)',
                    borderColor: inputFocused
                      ? currentModeColor + '88'
                      : isLightBg(currentTheme.background)
                        ? 'rgba(118,92,48,0.18)'
                        : currentModeColor + '33',
                    shadowColor: currentModeColor,
                    shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.55] }),
                    shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 22] }),
                    shadowOffset: { width: 0, height: -2 },
                    elevation: 14,
                  },
                ]}
              >
                {/* Inner gradient border shimmer */}
                <View style={styles.composerGradientBorder} pointerEvents="none">
                  <LinearGradient
                    colors={[currentModeColor + '28', currentModeColor + '08', currentModeColor + '18'] as const}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </View>

                {/* Response length chips */}
                <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 2 }}>
                  {([['short', 'Zwięźle'], ['medium', 'Balans'], ['deep', 'Głęboko']] as Array<['short' | 'medium' | 'deep', string]>).map(([val, lbl]) => (
                    <Pressable
                      key={val}
                      onPress={() => setLocalResponseLength(val)}
                      style={{
                        paddingHorizontal: 9,
                        paddingVertical: 3,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: localResponseLength === val
                          ? currentModeColor + 'BB'
                          : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.14)'),
                        backgroundColor: localResponseLength === val ? currentModeColor + '1A' : 'transparent',
                      }}
                    >
                      <Typography
                        variant="microLabel"
                        style={{ fontSize: 10 }}
                        color={localResponseLength === val ? currentModeColor : currentTheme.textMuted}
                      >
                        {lbl}
                      </Typography>
                    </Pressable>
                  ))}
                </View>

                {/* Text row */}
                <View style={[luxury.input(currentTheme), styles.inputContainer]}>
                  <TextInput
                    style={[styles.textInput, { color: isLight ? '#251D16' : '#F3EEE6' }]}
                    placeholder={t('oracle.napisz_co_naprawde_chcesz_dzis', 'Zapytaj Wyrocznię...')}
                    placeholderTextColor={currentTheme.textMuted}
                    value={input}
                    onChangeText={setInput}
                    multiline
                    maxLength={800}
                    scrollEnabled
                    returnKeyType="send"
                    blurOnSubmit={false}
                    onSubmitEditing={() => { animateSend(); sendMessage(); }}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                  />
                  {/* Microphone icon (visual only) */}
                  <View style={[styles.micBtn, { opacity: input.trim() ? 0.25 : 0.50 }]}>
                    <Mic color={currentModeColor} size={16} strokeWidth={1.8} />
                  </View>
                  {/* Send button — gradient circle */}
                  <Pressable
                    onPress={() => { animateSend(); sendMessage(); }}
                    disabled={input.trim().length < 2 || isLoading}
                    style={styles.sendBtn}
                  >
                    <RNAnimated.View
                      style={[
                        styles.sendBtnAnim,
                        {
                          transform: [{ scale: sendScaleAnim }],
                          shadowColor: currentModeColor,
                          shadowOpacity: input.trim() ? 0.70 : 0,
                          shadowRadius: input.trim() ? 16 : 0,
                          elevation: input.trim() ? 10 : 0,
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={
                          input.trim()
                            ? [currentModeColor, currentModeColor + 'BB'] as const
                            : (isLight
                              ? ['rgba(122,95,54,0.18)', 'rgba(255,255,255,0.88)'] as const
                              : ['#1A1F30', '#111520'] as const)
                        }
                        style={styles.sendInner}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <CornerDownLeft color={input.trim() ? '#0D0D14' : currentTheme.textMuted} size={18} />
                      </LinearGradient>
                    </RNAnimated.View>
                  </Pressable>
                </View>
              </RNAnimated.View>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* ── USAGE PILL ──────────────────────────────────────────────────── */}
        {!isPremium && usage.oracleMessagesToday > 0 && (
          <Animated.View entering={FadeInUp.duration(400)} style={{ position: 'absolute', top: 80, right: layout.padding.screen, zIndex: 50 }}>
            <Pressable
              onPress={() => navigation.navigate('Paywall', { context: 'oracle' })}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 12,
                backgroundColor: usage.oracleMessagesToday >= 3 ? '#7C2020' : 'rgba(206,174,114,0.15)',
                borderWidth: 1,
                borderColor: usage.oracleMessagesToday >= 3 ? '#EF4444' : 'rgba(206,174,114,0.35)',
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: usage.oracleMessagesToday >= 3 ? '#EF4444' : '#CEAE72' }} />
              <Text style={{ color: usage.oracleMessagesToday >= 3 ? '#FCA5A5' : '#CEAE72', fontSize: 10, fontWeight: '700' }}>
                {usage.oracleMessagesToday >= 3 ? 'Limit osiągnięty' : `${3 - usage.oracleMessagesToday} z 3`}
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* ── PREMIUM GATE MODAL ──────────────────────────────────────────── */}
        <PremiumGateModal
          visible={paywallVisible}
          onClose={() => setPaywallVisible(false)}
          onNavigateToPaywall={() => { setPaywallVisible(false); navigation.navigate('Paywall', { context: 'oracle' }); }}
          context="oracle"
          previewText={paywallPreview}
          modeColor={currentModeColor}
        />
      </SafeAreaView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen,
    minHeight: 76,
  },
  backBtn: { width: 40 },
  headerTitle: { flex: 1, alignItems: 'center' },
  historyBtn: { width: 40, alignItems: 'flex-end' },
  historyContent: { flexGrow: 1, paddingHorizontal: layout.padding.screen, paddingBottom: 80 },
  historyCard: { padding: 18, marginTop: 14 },
  historyDelete: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0F1320',
  },
  emptyHistoryCard: { padding: 20, marginTop: 14 },
  chatScroll: { flexGrow: 1, paddingHorizontal: layout.padding.screen, paddingBottom: 24 },
  resumedCard: { padding: 18, marginTop: 18 },
  modeSection: { marginTop: 8, marginBottom: 6 },
  modeChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0F1320',
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeChipActive: {
    borderColor: 'rgba(203,170,100,0.34)',
    backgroundColor: 'rgba(203,170,100,0.12)',
  },
  modeRail: { paddingTop: 12, paddingBottom: 2 },
  modeRailCompact: { paddingVertical: 2 },
  pathways: { marginTop: 14, marginBottom: 10, padding: 20 },
  entryLead: { marginTop: 8, lineHeight: 20, opacity: 0.78 },
  entryStack: { marginTop: 14, gap: 10 },
  entryCard: { padding: 18, minHeight: 112 },
  entryCardHeader: { flexDirection: 'row', alignItems: 'center' },
  entryCardCopy: { marginTop: 8, lineHeight: 20, opacity: 0.82 },
  pathCompactList: { marginTop: 10, gap: 8 },
  pathChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    minHeight: 54,
  },
  // ── Messages ────────────────────────────────────────────────────────────────
  assistantMessageWrap: { marginTop: 14 },
  assistantHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  assistantMeta: { flex: 1, marginLeft: 12 },
  oracleAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: '#0F1320',
  },
  assistantCard: { padding: 17, overflow: 'hidden' },
  sessionChamberDeck: { padding: 18, marginBottom: 14 },
  sessionChamberGrid: { gap: 10, marginTop: 12 },
  sessionChamberTile: { borderRadius: 18, borderWidth: 1, padding: 14, backgroundColor: '#0F1320' },
  sessionChamberCopy: { marginTop: 8, lineHeight: 22, opacity: 0.88 },
  modeAccentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: 1 },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
    alignSelf: 'center',
  },
  modeDot: { width: 7, height: 7, borderRadius: 3.5 },
  modeDotSmall: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  assistantLead: { marginTop: 10, lineHeight: 26, fontSize: 16 },
  assistantCopy: { marginTop: 10, lineHeight: 22, opacity: 0.82, fontSize: 15 },
  oracleBlock: { paddingVertical: 16 },
  oracleBlockDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.12)',
    marginTop: 10,
    paddingTop: 16,
  },
  oracleBlockTitle: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  oracleBlockCopy: { lineHeight: 28, opacity: 0.9, fontSize: 15, letterSpacing: 0.15 },
  assistantActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#0F1320',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  // User bubble
  userWrap: { alignItems: 'flex-end', marginTop: 16, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  userBubble: {
    maxWidth: '78%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderTopRightRadius: 4,
    borderWidth: 1,
  },
  loadingCard: { paddingVertical: 24, paddingHorizontal: 18, alignItems: 'center', marginTop: 12 },
  skeletonWrap: { marginTop: 16, paddingHorizontal: 4 },
  skeletonLine: { height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.10)', marginBottom: 10 },
  errorBanner: { marginTop: 18, padding: 18 },
  errorCopy: { marginTop: 10, lineHeight: 22, opacity: 0.82 },
  followUpSection: { marginTop: 12, marginBottom: 6 },
  followUpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginBottom: 10,
    minHeight: 52,
  },
  // Input area
  inputArea: {
    paddingHorizontal: layout.padding.screen,
    paddingTop: 6,
    paddingBottom: 0,
  },
  composerHint: {
    marginBottom: 2,
    opacity: 0.62,
    lineHeight: 15,
    paddingHorizontal: 6,
  },
  modePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 6,
    marginLeft: 2,
  },
  composerShell: {
    marginVertical: 0,
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderRadius: 22,
    overflow: 'hidden',
  },
  composerGradientBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 94,
    paddingTop: 8,
    paddingBottom: 8,
    textAlignVertical: 'top',
  },
  micBtn: {
    marginBottom: 6,
    marginRight: 4,
    padding: 4,
  },
  sendBtn: { marginLeft: 4, marginBottom: 2 },
  sendBtnAnim: { borderRadius: 20 },
  sendInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Premium empty state ────────────────────────────────────────────────────
  emptyHeroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 4,
    height: 260,
  },
  emptyGlowRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  emptyTitleWrap: {
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen + 6,
    marginBottom: 4,
  },
  emptyModeSection: {
    marginBottom: 8,
  },
  emptyModeRail: {
    paddingHorizontal: layout.padding.screen,
    paddingVertical: 4,
    gap: 8,
  },
  emptyModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  emptyResumedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 16,
    marginTop: 4,
  },
  emptyResumedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyPromptsSection: {
    paddingHorizontal: layout.padding.screen,
    marginBottom: 24,
    marginTop: 4,
  },
  emptyPromptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingRight: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  emptyPromptAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginRight: 14,
    marginLeft: 2,
    opacity: 0.85,
  },
  emptyPresetsSection: {
    paddingHorizontal: layout.padding.screen,
    marginBottom: 20,
  },
  emptyPresetsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  emptyPresetCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  emptyPresetIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPresetActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 6,
  },
});
