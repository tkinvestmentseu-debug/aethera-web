// @ts-nocheck
/**
 * CosmicBackground — animated starfield with twinkling, nebula orbs, and shooting stars.
 * Renders absolutely behind all content with pointerEvents="none".
 *
 * Usage:
 *   <CosmicBackground isLight={isLight} />
 */

import React, { useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';

// ── Module-level animated SVG primitives ──────────────────────
// MUST be at module level — never inside a component body
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

const { width: SW, height: SH } = Dimensions.get('window');

// ── Stable seeded star positions (deterministic, no Math.random on render) ──
const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: ((i * 127 + 43) % 97) / 97 * SW,
  y: ((i * 83 + 17) % 89) / 89 * SH,
  r: 0.8 + (i % 4) * 0.7,           // 0.8 / 1.5 / 2.2 / 2.9 px
  delay: i * 400,
  period: 3000 + (i * 600) % 5000,  // 3000–8000 ms
}));

// ── Nebula dots (larger, very low opacity, slowly drifting) ─────
const NEBULA = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  x: ((i * 211 + 31) % 91) / 91 * SW,
  y: ((i * 173 + 57) % 83) / 83 * SH,
  r: 4 + (i % 5),                   // 4–8 px
  baseOpacity: 0.05 + (i % 6) * 0.015, // 0.05–0.125
  driftX: ((i % 2 === 0) ? 1 : -1) * (8 + (i % 8)),   // ±8–15 px
  driftY: ((i % 3 === 0) ? 1 : -1) * (6 + (i % 7)),
  period: 20000 + i * 2500,          // 20–40 s
}));

// ── Shooting star definitions ────────────────────────────────────
const SHOOTING_STARS = [
  { id: 0, y: SH * 0.08, length: SW * 0.28, delay: 2000,  period: 18000 },
  { id: 1, y: SH * 0.22, length: SW * 0.22, delay: 9500,  period: 24000 },
  { id: 2, y: SH * 0.14, length: SW * 0.18, delay: 16000, period: 30000 },
  { id: 3, y: SH * 0.35, length: SW * 0.20, delay: 23000, period: 28000 },
];

// ── Single twinkling star ─────────────────────────────────────────
const TwinkleStar = React.memo(({ star, color }: { star: typeof STARS[number]; color: string }) => {
  const opacity = useSharedValue(0.05);

  useEffect(() => {
    opacity.value = withDelay(
      star.delay,
      withRepeat(
        withSequence(
          withTiming(0.05, { duration: star.period * 0.4 }),
          withTiming(0.75, { duration: star.period * 0.2 }),
          withTiming(0.05, { duration: star.period * 0.4 }),
        ),
        -1,
        false,
      ),
    );
    return () => { cancelAnimation(opacity); };
  }, []);

  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.value }));

  return (
    <AnimatedCircle
      cx={star.x}
      cy={star.y}
      r={star.r}
      fill={color}
      animatedProps={animatedProps}
    />
  );
});

// ── Single nebula orb — translates on outer Animated.View ────────
// NOTE: Per Reanimated constraint — transform and entering CANNOT be combined.
// We only use transform (translateX/Y) here, no entering prop.
const NebulaOrb = React.memo(({ orb, color }: { orb: typeof NEBULA[number]; color: string }) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  useEffect(() => {
    tx.value = withRepeat(
      withSequence(
        withTiming(orb.driftX, { duration: orb.period * 0.5 }),
        withTiming(0, { duration: orb.period * 0.5 }),
      ),
      -1,
      true,
    );
    ty.value = withRepeat(
      withSequence(
        withTiming(orb.driftY, { duration: orb.period * 0.45 }),
        withTiming(0, { duration: orb.period * 0.55 }),
      ),
      -1,
      true,
    );
    return () => {
      cancelAnimation(tx);
      cancelAnimation(ty);
    };
  }, []);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  return (
    <Animated.View style={[styles.nebulaOrb, { left: orb.x - orb.r, top: orb.y - orb.r, width: orb.r * 2, height: orb.r * 2, borderRadius: orb.r }, wrapStyle]}>
      <Svg width={orb.r * 2} height={orb.r * 2}>
        <Circle
          cx={orb.r}
          cy={orb.r}
          r={orb.r}
          fill={color}
          opacity={orb.baseOpacity}
        />
      </Svg>
    </Animated.View>
  );
});

// ── Single shooting star — slides across + fades ─────────────────
// Outer view handles translateX (transform), inner handles opacity
const ShootingStar = React.memo(({ ss, color }: { ss: typeof SHOOTING_STARS[number]; color: string }) => {
  const tx = useSharedValue(-ss.length - 60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const runShot = () => {
      tx.value = -ss.length - 60;
      opacity.value = 0;
      opacity.value = withDelay(ss.delay % ss.period, withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(0.9, { duration: 180 }),
        withTiming(0.9, { duration: ss.period * 0.06 }),
        withTiming(0, { duration: 260 }),
      ));
      tx.value = withDelay(ss.delay % ss.period, withTiming(SW + 60, { duration: ss.period * 0.08 }));
    };

    // First shot + looping repeat
    runShot();
    const interval = setInterval(() => {
      tx.value = -ss.length - 60;
      opacity.value = withSequence(
        withTiming(0.9, { duration: 160 }),
        withTiming(0.9, { duration: ss.period * 0.06 }),
        withTiming(0, { duration: 240 }),
      );
      tx.value = withTiming(SW + 60, { duration: ss.period * 0.08 });
    }, ss.period);

    return () => {
      clearInterval(interval);
      cancelAnimation(tx);
      cancelAnimation(opacity);
    };
  }, []);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    // Outer: handles translate
    <Animated.View style={[styles.shootingOuter, { top: ss.y, width: ss.length }, slideStyle]}>
      {/* Inner: handles opacity only — NEVER combine entering+transform on same Animated.View */}
      <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
        <Svg width={ss.length} height={2}>
          <Line
            x1={0} y1={1}
            x2={ss.length} y2={1}
            stroke={color}
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
});

// ── Main exported component ───────────────────────────────────────

interface CosmicBackgroundProps {
  isLight?: boolean;
  /** Reduce star count for lower-end devices */
  reduced?: boolean;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = React.memo(({ isLight = false, reduced = false }) => {
  // Color palette: dark mode → white/ice-blue stars; light mode → gold/amber at low opacity
  const starColor   = isLight ? 'rgba(139,100,42,1)'   : 'rgba(255,250,230,1)';
  const nebulaColor = isLight ? 'rgba(139,100,42,1)'   : 'rgba(160,180,255,1)';
  const shootColor  = isLight ? 'rgba(180,140,60,1)'   : 'rgba(220,235,255,1)';

  const stars  = reduced ? STARS.slice(0, 12)  : STARS;
  const nebula = reduced ? NEBULA.slice(0, 4)  : NEBULA;
  const shots  = reduced ? SHOOTING_STARS.slice(0, 1) : SHOOTING_STARS;

  return (
    <View style={styles.root} pointerEvents="none">
      {/* ── Layer 1: Twinkling stars (SVG canvas) ── */}
      <Svg style={StyleSheet.absoluteFill} width={SW} height={SH}>
        {stars.map(star => (
          <TwinkleStar key={star.id} star={star} color={starColor} />
        ))}
      </Svg>

      {/* ── Layer 2: Nebula drift orbs (Animated.View per orb) ── */}
      {nebula.map(orb => (
        <NebulaOrb key={orb.id} orb={orb} color={nebulaColor} />
      ))}

      {/* ── Layer 3: Shooting stars ── */}
      {shots.map(ss => (
        <ShootingStar key={ss.id} ss={ss} color={shootColor} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  nebulaOrb: {
    position: 'absolute',
    overflow: 'hidden',
  },
  shootingOuter: {
    position: 'absolute',
    height: 2,
    overflow: 'visible',
  },
});
