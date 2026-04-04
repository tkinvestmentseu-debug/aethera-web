// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Line,
  G,
  Defs,
  RadialGradient,
  Stop,
  Polygon,
  Path,
} from 'react-native-svg';
import { useTranslation } from 'react-i18next';

const { width: SW, height: SH } = Dimensions.get('window');

const GOLD = '#CEAE72';
const GOLD_DIM = '#CEAE7266';
const GOLD_FAINT = '#CEAE7222';
const SPLASH_DURATION = 4200; // ms before onDone fires

// ─── Metatron's Cube geometry ────────────────────────────────────────────────
// 13 circles: 1 center + 6 inner ring + 6 outer ring
const R_INNER = 44;
const R_OUTER = 88;
const CIRCLE_R = 22;

const CENTER = { cx: 0, cy: 0 };

const INNER_NODES = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2;
  return { cx: R_INNER * Math.cos(a), cy: R_INNER * Math.sin(a) };
});

const OUTER_NODES = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
  return { cx: R_OUTER * Math.cos(a), cy: R_OUTER * Math.sin(a) };
});

// All node connections for the star-pattern inside Metatron's Cube
const ALL_NODES = [CENTER, ...INNER_NODES, ...OUTER_NODES];

// Star-of-David lines connecting inner nodes
const INNER_LINES: [number, number][] = [
  [1, 3], [1, 5], [3, 5], // first triangle (skip every other inner)
  [2, 4], [2, 6], [4, 6], // second triangle
];

// Cross-connections from center to outer nodes
const CENTER_TO_OUTER: [number, number][] = [
  [0, 7], [0, 8], [0, 9], [0, 10], [0, 11], [0, 12],
];

// Inner to outer connections
const INNER_TO_OUTER: [number, number][] = [
  [1, 7], [1, 12], [2, 7], [2, 8], [3, 8], [3, 9],
  [4, 9], [4, 10], [5, 10], [5, 11], [6, 11], [6, 12],
];

// ─── Star particle data (40 stars) ──────────────────────────────────────────
const STAR_DATA = [
  { x: 0.04, y: 0.06, size: 1.6, delay: 0 },   { x: 0.92, y: 0.04, size: 2.0, delay: 180 },
  { x: 0.14, y: 0.12, size: 2.4, delay: 300 },  { x: 0.86, y: 0.16, size: 1.4, delay: 500 },
  { x: 0.08, y: 0.26, size: 1.8, delay: 150 },  { x: 0.96, y: 0.30, size: 2.2, delay: 420 },
  { x: 0.02, y: 0.44, size: 1.6, delay: 260 },  { x: 0.98, y: 0.48, size: 1.8, delay: 380 },
  { x: 0.06, y: 0.60, size: 2.0, delay: 210 },  { x: 0.94, y: 0.64, size: 2.4, delay: 560 },
  { x: 0.04, y: 0.76, size: 1.4, delay: 320 },  { x: 0.90, y: 0.80, size: 1.8, delay: 640 },
  { x: 0.10, y: 0.90, size: 2.2, delay: 440 },  { x: 0.84, y: 0.94, size: 1.6, delay: 280 },
  { x: 0.22, y: 0.04, size: 1.8, delay: 470 },  { x: 0.74, y: 0.06, size: 2.0, delay: 190 },
  { x: 0.30, y: 0.10, size: 1.4, delay: 370 },  { x: 0.66, y: 0.08, size: 2.4, delay: 520 },
  { x: 0.18, y: 0.96, size: 1.8, delay: 340 },  { x: 0.78, y: 0.92, size: 1.4, delay: 460 },
  { x: 0.38, y: 0.02, size: 2.0, delay: 230 },  { x: 0.58, y: 0.02, size: 1.6, delay: 590 },
  { x: 0.20, y: 0.36, size: 1.4, delay: 610 },  { x: 0.80, y: 0.34, size: 1.8, delay: 170 },
  { x: 0.16, y: 0.52, size: 2.2, delay: 490 },  { x: 0.82, y: 0.54, size: 1.4, delay: 250 },
  { x: 0.24, y: 0.70, size: 1.6, delay: 410 },  { x: 0.76, y: 0.74, size: 2.0, delay: 330 },
  { x: 0.32, y: 0.84, size: 1.8, delay: 580 },  { x: 0.68, y: 0.86, size: 1.4, delay: 140 },
  { x: 0.42, y: 0.96, size: 2.2, delay: 550 },  { x: 0.56, y: 0.94, size: 1.6, delay: 400 },
  { x: 0.46, y: 0.06, size: 1.8, delay: 270 },  { x: 0.52, y: 0.98, size: 2.0, delay: 360 },
  { x: 0.28, y: 0.22, size: 1.4, delay: 430 },  { x: 0.70, y: 0.20, size: 1.8, delay: 120 },
  { x: 0.34, y: 0.78, size: 2.0, delay: 510 },  { x: 0.62, y: 0.82, size: 1.6, delay: 295 },
  { x: 0.48, y: 0.14, size: 2.2, delay: 455 },  { x: 0.50, y: 0.88, size: 1.4, delay: 220 },
];

// ─── TwinkleStar component ───────────────────────────────────────────────────
const TwinkleStar = ({ x, y, size, delay }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    const dur1 = 700 + (delay % 500);
    const dur2 = 900 + (delay % 600);
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.0, { duration: dur1 }),
          withTiming(0.3, { duration: dur2 }),
        ),
        -1,
        true,
      ),
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.0, { duration: 800 }),
          withTiming(0.5, { duration: 800 }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x * SW - size / 2,
          top: y * SH - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFFFFF',
        },
        style,
      ]}
    />
  );
};

// ─── RotatingSacredGeometry ──────────────────────────────────────────────────
const RotatingSacredGeometry = () => {
  const rotation = useSharedValue(0);
  const counterRot = useSharedValue(0);
  const pulse = useSharedValue(0.92);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false,
    );
    counterRot.value = withRepeat(
      withTiming(-360, { duration: 18000, easing: Easing.linear }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.92, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 1800 }),
        withTiming(0.30, { duration: 1800 }),
      ),
      -1,
      true,
    );
  }, []);

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }));

  const innerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${counterRot.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: glowOpacity.value,
  }));

  const SIZE = 220;
  const half = SIZE / 2;

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer glow aura */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: SIZE + 60,
            height: SIZE + 60,
            borderRadius: (SIZE + 60) / 2,
            backgroundColor: GOLD + '0A',
          },
          glowStyle,
        ]}
      />

      {/* Three concentric ambient rings (static) */}
      <Svg
        width={SIZE + 80}
        height={SIZE + 80}
        viewBox={`${-half - 40} ${-half - 40} ${SIZE + 80} ${SIZE + 80}`}
        style={StyleSheet.absoluteFill}
      >
        <Circle cx={0} cy={0} r={half + 35} fill="none" stroke={GOLD + '18'} strokeWidth={1} />
        <Circle cx={0} cy={0} r={half + 20} fill="none" stroke={GOLD + '26'} strokeWidth={0.8} />
        <Circle cx={0} cy={0} r={half + 8}  fill="none" stroke={GOLD + '35'} strokeWidth={0.6} />
      </Svg>

      {/* Outer rotating ring (12 node circles) */}
      <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, outerRingStyle]}>
        <Svg width={SIZE} height={SIZE} viewBox={`${-half} ${-half} ${SIZE} ${SIZE}`}>
          {/* Outer dashed orbit circle */}
          <Circle cx={0} cy={0} r={R_OUTER} fill="none" stroke={GOLD + '40'} strokeWidth={0.8} strokeDasharray="3 9" />
          {/* 12 outer node dots */}
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const r = R_OUTER + CIRCLE_R;
            return (
              <Circle
                key={i}
                cx={r * Math.cos(a)}
                cy={r * Math.sin(a)}
                r={CIRCLE_R}
                fill="none"
                stroke={GOLD + '55'}
                strokeWidth={0.7}
              />
            );
          })}
          {/* Cross-connections center → outer */}
          {CENTER_TO_OUTER.map(([a, b], i) => (
            <Line
              key={`co${i}`}
              x1={ALL_NODES[a].cx} y1={ALL_NODES[a].cy}
              x2={ALL_NODES[b].cx} y2={ALL_NODES[b].cy}
              stroke={GOLD + '30'} strokeWidth={0.5}
            />
          ))}
          {/* Inner→Outer connections */}
          {INNER_TO_OUTER.map(([a, b], i) => (
            <Line
              key={`io${i}`}
              x1={ALL_NODES[a].cx} y1={ALL_NODES[a].cy}
              x2={ALL_NODES[b].cx} y2={ALL_NODES[b].cy}
              stroke={GOLD + '28'} strokeWidth={0.4}
            />
          ))}
        </Svg>
      </Animated.View>

      {/* Inner counter-rotating ring */}
      <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, innerRingStyle]}>
        <Svg width={SIZE} height={SIZE} viewBox={`${-half} ${-half} ${SIZE} ${SIZE}`}>
          {/* Inner orbit circle */}
          <Circle cx={0} cy={0} r={R_INNER} fill="none" stroke={GOLD + '50'} strokeWidth={1} strokeDasharray="2 5" />
          {/* 6 inner circles */}
          {INNER_NODES.map((n, i) => (
            <Circle
              key={i}
              cx={n.cx} cy={n.cy}
              r={CIRCLE_R}
              fill="none"
              stroke={GOLD + '70'}
              strokeWidth={0.8}
            />
          ))}
          {/* Star-of-David lines */}
          {INNER_LINES.map(([a, b], i) => (
            <Line
              key={`il${i}`}
              x1={ALL_NODES[a].cx} y1={ALL_NODES[a].cy}
              x2={ALL_NODES[b].cx} y2={ALL_NODES[b].cy}
              stroke={GOLD + '60'} strokeWidth={0.9}
            />
          ))}
        </Svg>
      </Animated.View>

      {/* Center static SVG: RadialGradient orb + 8-pointed gem */}
      <Svg width={SIZE} height={SIZE} viewBox={`${-half} ${-half} ${SIZE} ${SIZE}`}>
        <Defs>
          <RadialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"  stopColor={GOLD}    stopOpacity={0.85} />
            <Stop offset="40%" stopColor={GOLD}    stopOpacity={0.40} />
            <Stop offset="100%" stopColor={GOLD}   stopOpacity={0.0} />
          </RadialGradient>
          <RadialGradient id="gemGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"  stopColor="#FFFFFF" stopOpacity={0.95} />
            <Stop offset="60%" stopColor={GOLD}    stopOpacity={0.80} />
            <Stop offset="100%" stopColor={GOLD}   stopOpacity={0.30} />
          </RadialGradient>
        </Defs>

        {/* Center orb glow */}
        <Circle cx={0} cy={0} r={38} fill="url(#orbGrad)" />
        <Circle cx={0} cy={0} r={CIRCLE_R} fill="none" stroke={GOLD + '80'} strokeWidth={1.2} />
        <Circle cx={0} cy={0} r={14} fill="none" stroke={GOLD + 'AA'} strokeWidth={0.8} />

        {/* 8-pointed star gem */}
        <Polygon
          points="0,-18 5,-5 18,0 5,5 0,18 -5,5 -18,0 -5,-5"
          fill="url(#gemGrad)"
          stroke={GOLD + 'CC'}
          strokeWidth={0.6}
        />
        {/* Inner gem highlight */}
        <Polygon
          points="0,-10 3,-3 10,0 3,3 0,10 -3,3 -10,0 -3,-3"
          fill="#FFFFFF"
          opacity={0.40}
        />
        {/* Very center dot */}
        <Circle cx={0} cy={0} r={3} fill="#FFFFFF" opacity={0.95} />
      </Svg>
    </View>
  );
};

// ─── Animated progress bar ───────────────────────────────────────────────────
const ProgressBar = ({ delay = 2000, duration = 2000 }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(SW - 64, { duration, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    width: progress.value,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, barStyle]}>
        <LinearGradient
          colors={['transparent', GOLD, GOLD + 'CC', GOLD, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Shimmer tip */}
      <Animated.View style={[styles.progressTip, barStyle]} />
    </View>
  );
};

// ─── Floating golden particle (drifting) ────────────────────────────────────
const FloatingParticle = ({ x, y, size, delay, speed }) => {
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: 1000 }),
          withTiming(0.10, { duration: 1400 }),
        ),
        -1,
        true,
      ),
    );
    ty.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-14, { duration: speed, easing: Easing.inOut(Easing.sin) }),
          withTiming(14,  { duration: speed, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x * SW,
          top: y * SH,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: GOLD,
        },
        style,
      ]}
    />
  );
};

const FLOAT_PARTICLES = [
  { x: 0.12, y: 0.30, size: 3.5, delay: 0,   speed: 2800 },
  { x: 0.82, y: 0.25, size: 2.5, delay: 400, speed: 3200 },
  { x: 0.28, y: 0.72, size: 3.0, delay: 200, speed: 2600 },
  { x: 0.74, y: 0.68, size: 2.0, delay: 600, speed: 3600 },
  { x: 0.50, y: 0.14, size: 2.8, delay: 300, speed: 2400 },
  { x: 0.88, y: 0.50, size: 2.2, delay: 500, speed: 3000 },
  { x: 0.06, y: 0.82, size: 3.2, delay: 700, speed: 2900 },
  { x: 0.62, y: 0.88, size: 1.8, delay: 150, speed: 3400 },
  { x: 0.38, y: 0.18, size: 2.4, delay: 450, speed: 2700 },
  { x: 0.20, y: 0.55, size: 2.0, delay: 350, speed: 3100 },
];

// ─── Main SplashIntroScreen ──────────────────────────────────────────────────
interface Props {
  onDone?: () => void;
  navigation?: any;
}

export const SplashIntroScreen = ({ onDone, navigation }: Props) => {
  const { t } = useTranslation();
  const doneRef = useRef(false);

  // Master screen fade-out
  const screenOpacity = useSharedValue(1);

  // Logo text animations
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(24);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(16);
  const taglineOpacity = useSharedValue(0);
  const geometryOpacity = useSharedValue(0);
  const progressOpacity = useSharedValue(0);

  const fireOnDone = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (onDone) {
      onDone();
    } else if (navigation) {
      try { navigation.replace('LanguageSelection'); } catch { navigation.navigate('Onboarding'); }
    }
  };

  useEffect(() => {
    // 1. Sacred geometry fades in immediately
    geometryOpacity.value = withTiming(1, { duration: 800 });

    // 2. Logo appears at 600ms
    logoOpacity.value = withDelay(600, withTiming(1, { duration: 700 }));
    logoTranslateY.value = withDelay(600, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }));

    // 3. "DuniAI & Oracle" subtitle at 1100ms
    subtitleOpacity.value = withDelay(1100, withTiming(1, { duration: 600 }));
    subtitleTranslateY.value = withDelay(1100, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));

    // 4. Tagline at 1600ms
    taglineOpacity.value = withDelay(1600, withTiming(0.78, { duration: 700 }));

    // 5. Progress bar container visible at 2000ms
    progressOpacity.value = withDelay(1900, withTiming(1, { duration: 300 }));

    // 6. Auto-navigate after SPLASH_DURATION
    const tid = setTimeout(() => {
      screenOpacity.value = withTiming(0, { duration: 500 }, (finished) => {
        if (finished) runOnJS(fireOnDone)();
      });
    }, SPLASH_DURATION);

    return () => clearTimeout(tid);
  }, []);

  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));
  const geoStyle = useAnimatedStyle(() => ({ opacity: geometryOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const progressContainerStyle = useAnimatedStyle(() => ({ opacity: progressOpacity.value }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      {/* Deep cosmic background */}
      <LinearGradient
        colors={['#050208', '#0A0514', '#0D0820']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle radial bloom at center */}
      <View style={styles.centerBloom} />

      {/* 40 twinkling star particles */}
      {STAR_DATA.map((star, i) => (
        <TwinkleStar key={i} x={star.x} y={star.y} size={star.size} delay={star.delay} />
      ))}

      {/* 10 floating golden particles */}
      {FLOAT_PARTICLES.map((p, i) => (
        <FloatingParticle
          key={`fp${i}`}
          x={p.x} y={p.y} size={p.size} delay={p.delay} speed={p.speed}
        />
      ))}

      {/* Rotating Metatron's Cube — centered at ~40% from top */}
      <Animated.View style={[styles.geometryContainer, geoStyle]}>
        <RotatingSacredGeometry />
      </Animated.View>

      {/* Text block below geometry */}
      <View style={styles.textContainer}>
        {/* ✦ AETHERA */}
        <Animated.View style={logoStyle}>
          <Text style={styles.logoMark}>✦</Text>
          <Text style={styles.logoText}>AETHERA</Text>
        </Animated.View>

        {/* Thin divider line */}
        <Animated.View style={[styles.dividerWrap, subtitleStyle]}>
          <View style={styles.dividerLeft} />
          <View style={styles.dividerDot} />
          <View style={styles.dividerRight} />
        </Animated.View>

        {/* DuniAI & Oracle */}
        <Animated.View style={subtitleStyle}>
          <Text style={styles.subtitleText}>DuniAI & Oracle</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={taglineStyle}>
          <Text style={styles.taglineText}>Sanktuarium AI, symboli i rytuału</Text>
        </Animated.View>
      </View>

      {/* Bottom golden progress bar */}
      <Animated.View style={[styles.progressContainer, progressContainerStyle]}>
        <ProgressBar delay={100} duration={2100} />
        <Text style={styles.progressLabel}>Inicjowanie sfery duchowej…</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050208',
  },

  centerBloom: {
    position: 'absolute',
    width: SH * 0.55,
    height: SH * 0.55,
    borderRadius: SH * 0.275,
    top: SH * 0.18,
    left: SW / 2 - (SH * 0.275),
    backgroundColor: GOLD + '06',
  },

  geometryContainer: {
    position: 'absolute',
    top: SH * 0.13,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textContainer: {
    position: 'absolute',
    bottom: SH * 0.20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  logoMark: {
    fontSize: 22,
    color: GOLD,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 4,
    opacity: 0.95,
  },
  logoText: {
    fontSize: 38,
    fontWeight: '200',
    color: GOLD,
    letterSpacing: 10,
    textAlign: 'center',
  },

  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLeft: {
    flex: 1,
    height: 0.8,
    backgroundColor: GOLD + '50',
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GOLD,
    marginHorizontal: 10,
    opacity: 0.85,
  },
  dividerRight: {
    flex: 1,
    height: 0.8,
    backgroundColor: GOLD + '50',
  },

  subtitleText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#E8DEC8',
    letterSpacing: 4,
    textAlign: 'center',
  },

  taglineText: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: '400',
    color: '#B8A88A',
    letterSpacing: 1.5,
    textAlign: 'center',
  },

  progressContainer: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  progressTrack: {
    width: SW - 64,
    height: 1.5,
    backgroundColor: GOLD + '1A',
    borderRadius: 1,
    overflow: 'visible',
    marginBottom: 12,
  },
  progressFill: {
    height: 1.5,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressTip: {
    position: 'absolute',
    top: -3,
    height: 7,
    width: 7,
    borderRadius: 3.5,
    backgroundColor: GOLD,
    opacity: 0.9,
    // translateX by barWidth is not trivially doable without separate shared value,
    // so we leave the tip as part of the fill end via LinearGradient
    display: 'none',
  },
  progressLabel: {
    fontSize: 10,
    color: GOLD + '88',
    letterSpacing: 2,
    textAlign: 'center',
  },
});
