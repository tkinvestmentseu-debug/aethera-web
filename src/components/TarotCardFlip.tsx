// @ts-nocheck
import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  runOnJS,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, { Circle, Line, Path, Polygon, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticsService } from '../core/services/haptics.service';

const SW = Dimensions.get('window').width;
const CARD_W = SW - 48;
const CARD_H = CARD_W * 1.73;
const ACCENT = '#CEAE72';

// ── Particle config ────────────────────────────────────────────────────────────
const PARTICLE_COUNT = 8;
const PARTICLE_ANGLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => (i / PARTICLE_COUNT) * 2 * Math.PI);

// ── Module-level Animated components (MUST be at module level) ─────────────────
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// ── Sacred geometry back ────────────────────────────────────────────────────────
const CardBackGeometry = React.memo(({ accent, size }: { accent: string; size: number }) => {
  const cx = size / 2;
  const r1 = size * 0.38;
  const r2 = size * 0.26;
  const r3 = size * 0.14;
  const pts = (n: number, r: number, offset = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * 2 * Math.PI + offset;
      return `${cx + r * Math.cos(a)},${cx + r * Math.sin(a)}`;
    }).join(' ');
  return (
    <Svg width={size} height={size} style={{ position: 'absolute' }}>
      <Circle cx={cx} cy={cx} r={size * 0.48} fill={accent + '08'} />
      <Circle cx={cx} cy={cx} r={r1} fill="none" stroke={accent + '33'} strokeWidth={0.8} />
      <Polygon points={pts(6, r1, 0)} fill="none" stroke={accent + '44'} strokeWidth={0.7} />
      <Polygon points={pts(6, r1, Math.PI / 6)} fill="none" stroke={accent + '30'} strokeWidth={0.6} />
      <Circle cx={cx} cy={cx} r={r2} fill="none" stroke={accent + '44'} strokeWidth={0.8} />
      <Polygon points={pts(3, r2, 0)} fill="none" stroke={accent + '55'} strokeWidth={0.9} />
      <Polygon points={pts(3, r2, Math.PI)} fill="none" stroke={accent + '40'} strokeWidth={0.8} />
      <Circle cx={cx} cy={cx} r={r3} fill={accent + '22'} stroke={accent + '66'} strokeWidth={1} />
      <Circle cx={cx} cy={cx} r={4} fill={accent} opacity={0.9} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * 2 * Math.PI;
        return (
          <Circle
            key={i}
            cx={cx + r1 * 0.72 * Math.cos(a)}
            cy={cx + r1 * 0.72 * Math.sin(a)}
            r={2.5}
            fill={accent}
            opacity={0.5}
          />
        );
      })}
    </Svg>
  );
});

// ── Rotating outer ring on card back ──────────────────────────────────────────
const RotatingRing = React.memo(({ accent, size }: { accent: string; size: number }) => {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 22000, easing: Easing.linear }), -1, false);
    return () => { cancelAnimation(rot); };
  }, []);
  const rotStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot.value}deg` }] }));
  const cx = size / 2;
  const r = size * 0.46;
  const tickCount = 24;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, rotStyle]}>
      <Svg width={size} height={size}>
        {Array.from({ length: tickCount }, (_, i) => {
          const a = (i / tickCount) * 2 * Math.PI;
          const x1 = cx + (r - 4) * Math.cos(a);
          const y1 = cx + (r - 4) * Math.sin(a);
          const x2 = cx + r * Math.cos(a);
          const y2 = cx + r * Math.sin(a);
          const isDiamond = i % 6 === 0;
          if (isDiamond) {
            const dmx = cx + (r + 5) * Math.cos(a);
            const dmy = cx + (r + 5) * Math.sin(a);
            return (
              <G key={i}>
                <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent + '66'} strokeWidth={1} />
                <Circle cx={dmx} cy={dmy} r={2.5} fill={accent} opacity={0.8} />
              </G>
            );
          }
          return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent + '33'} strokeWidth={0.7} />;
        })}
      </Svg>
    </Animated.View>
  );
});

// ── Shimmer sweep on card back ─────────────────────────────────────────────────
const ShimmerSweep = React.memo(({ cardW, cardH }: { cardW: number; cardH: number }) => {
  const shimX = useSharedValue(-cardW);
  useEffect(() => {
    const loop = () => {
      shimX.value = -cardW;
      shimX.value = withDelay(
        600,
        withTiming(cardW * 1.5, { duration: 900, easing: Easing.out(Easing.quad) }, () => {
          shimX.value = withDelay(2100, withTiming(cardW * 1.5, { duration: 0 }));
        })
      );
    };
    loop();
    const interval = setInterval(loop, 3600);
    return () => clearInterval(interval);
  }, []);
  const shimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimX.value }],
  }));
  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { overflow: 'hidden' },
        shimStyle,
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['transparent', 'rgba(206,174,114,0.18)', 'rgba(255,255,255,0.22)', 'rgba(206,174,114,0.18)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: cardW * 0.5, height: cardH, transform: [{ skewX: '-15deg' }] }}
      />
    </Animated.View>
  );
});

// ── Single particle ────────────────────────────────────────────────────────────
const Particle = React.memo(({ angle, color, delay }: { angle: number; color: string; delay: number }) => {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 500 })
      )
    );
    return () => {
      cancelAnimation(progress);
      cancelAnimation(opacity);
    };
  }, []);

  const dist = 70 + Math.random() * 40;
  const dx = dist * Math.cos(angle);
  const dy = dist * Math.sin(angle);

  const particleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, dx]) },
      { translateY: interpolate(progress.value, [0, 1], [0, dy]) },
      { scale: interpolate(progress.value, [0, 0.3, 1], [0.5, 1.2, 0.3]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
        },
        particleStyle,
      ]}
    />
  );
});

// ── Particle burst container ───────────────────────────────────────────────────
const ParticleBurst = React.memo(({ active, accent }: { active: boolean; accent: string }) => {
  if (!active) return null;
  const colors = [accent, '#FFFFFF', accent + 'CC', '#F0C060', '#E8A840'];
  return (
    <View style={{ position: 'absolute', alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
      {PARTICLE_ANGLES.map((angle, i) => (
        <Particle key={i} angle={angle} color={colors[i % colors.length]} delay={i * 30} />
      ))}
    </View>
  );
});

// ── Holographic shimmer overlay (reacts to pan) ────────────────────────────────
const HoloShimmer = React.memo(({ cardW, cardH, accent }: { cardW: number; cardH: number; accent: string }) => {
  const shimmerX = useSharedValue(0.5);
  const shimmerY = useSharedValue(0.5);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      shimmerX.value = Math.max(0, Math.min(1, 0.5 + e.translationX / cardW));
      shimmerY.value = Math.max(0, Math.min(1, 0.5 + e.translationY / cardH));
    })
    .onEnd(() => {
      shimmerX.value = withSpring(0.5, { damping: 15 });
      shimmerY.value = withSpring(0.5, { damping: 15 });
    });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      Math.abs(shimmerX.value - 0.5) + Math.abs(shimmerY.value - 0.5),
      [0, 0.5],
      [0.08, 0.28]
    ),
    transform: [
      { translateX: interpolate(shimmerX.value, [0, 1], [-cardW * 0.3, cardW * 0.3]) },
      { translateY: interpolate(shimmerY.value, [0, 1], [-cardH * 0.3, cardH * 0.3]) },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: 16 }]} pointerEvents="box-none">
        {/* Outer wrapper handles gesture, inner animated view handles visual */}
        <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]} pointerEvents="none">
          <LinearGradient
            colors={[
              'transparent',
              accent + '44',
              'rgba(255,255,255,0.35)',
              accent + '22',
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export interface TarotCardFlipProps {
  cardName: string;
  cardSymbol: string;
  cardMeaning: string;
  cardColor: [string, string];
  isReversed?: boolean;
  onFlip?: () => void;
  autoFlip?: boolean;
  isLight?: boolean;
  accent?: string;
  /** When true, shows the card face-up (flipped); when false shows the back */
  isFlipped?: boolean;
  /** Actual deck card image — when provided, replaces the emoji/text face */
  imageSource?: number | { uri: string };
}

export const TarotCardFlip = React.memo(({
  cardName,
  cardSymbol,
  cardMeaning,
  cardColor,
  isReversed = false,
  onFlip,
  autoFlip = false,
  isLight = false,
  accent = ACCENT,
  isFlipped: externalFlipped,
  imageSource,
}: TarotCardFlipProps) => {
  // flipProgress: 0 = back face visible, 1 = front face visible
  const flipProgress = useSharedValue(externalFlipped ? 1 : 0);
  const glowScale = useSharedValue(1);
  const [showParticles, setShowParticles] = React.useState(false);
  const [revealed, setRevealed] = React.useState(externalFlipped ?? false);
  const autoFlipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fireHaptics = useCallback(() => { HapticsService.impact('medium'); }, []);
  const triggerParticles = useCallback(() => {
    setShowParticles(true);
    const t = setTimeout(() => setShowParticles(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const triggerFlip = useCallback(() => {
    // Phase 1: 0→0.5 (back rotates to 90° edge-on, disappears)
    flipProgress.value = withTiming(0.5, { duration: 280, easing: Easing.in(Easing.quad) }, () => {
      runOnJS(setRevealed)(true);
      runOnJS(fireHaptics)();
      // Phase 2: 0.5→1 (front springs in from -90° to 0°)
      flipProgress.value = withSpring(1, { damping: 12, stiffness: 120 }, () => {
        runOnJS(triggerParticles)();
      });
    });
    glowScale.value = withSequence(
      withTiming(1.06, { duration: 300 }),
      withSpring(1, { damping: 10 })
    );
  }, [fireHaptics, triggerParticles]);

  // Sync with external flipped state
  useEffect(() => {
    if (externalFlipped === undefined) return;
    if (externalFlipped && flipProgress.value < 0.5) {
      triggerFlip();
    } else if (!externalFlipped && flipProgress.value > 0.5) {
      flipProgress.value = withTiming(0.5, { duration: 280, easing: Easing.in(Easing.quad) }, () => {
        flipProgress.value = withSpring(0, { damping: 12, stiffness: 120 });
        runOnJS(setRevealed)(false);
      });
    }
  }, [externalFlipped]);

  useEffect(() => {
    if (autoFlip) {
      autoFlipTimer.current = setTimeout(() => triggerFlip(), 1000);
    }
    return () => {
      if (autoFlipTimer.current) clearTimeout(autoFlipTimer.current);
      cancelAnimation(flipProgress);
      cancelAnimation(glowScale);
    };
  }, []);

  const handlePress = useCallback(() => {
    if (revealed) {
      // flip back: 1→0.5→0
      flipProgress.value = withTiming(0.5, { duration: 280, easing: Easing.in(Easing.quad) }, () => {
        runOnJS(setRevealed)(false);
        flipProgress.value = withSpring(0, { damping: 12, stiffness: 120 });
      });
    } else {
      triggerFlip();
    }
    onFlip?.();
  }, [revealed, onFlip, triggerFlip]);

  // ── Animated styles ──────────────────────────────────────────────────────────
  // Back face: visible fp 0→0.5, rotates from 0°→90° (edge-on), hidden after 0.5
  const backFaceStyle = useAnimatedStyle(() => {
    const fp = flipProgress.value;
    const rot = Math.min(fp * 180, 90); // 0 at fp=0, 90 at fp=0.5
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rot}deg` }],
      opacity: fp < 0.5 ? 1 : 0,
    };
  });

  // Front face: hidden fp < 0.5, rotates from -90°→0° as fp goes 0.5→1
  const frontFaceStyle = useAnimatedStyle(() => {
    const fp = flipProgress.value;
    const rot = Math.max((fp - 1) * 180, -90); // -90 at fp=0.5, 0 at fp=1
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rot}deg` }],
      opacity: fp >= 0.5 ? 1 : 0,
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  const cardW = CARD_W;
  const cardH = CARD_H;

  return (
    <Pressable onPress={handlePress} style={{ width: cardW, height: cardH, alignSelf: 'center' }}>
      {/* Outer glow wrapper */}
      <Animated.View style={[{ width: cardW, height: cardH, position: 'relative' }, glowStyle]}>
        {/* Ambient glow shadow */}
        <View
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 8,
            bottom: 8,
            borderRadius: 16,
            backgroundColor: 'transparent',
            shadowColor: revealed ? (cardColor[0] || accent) : accent,
            shadowOpacity: isLight ? 0.25 : 0.5,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 0 },
            elevation: 12,
          }}
          pointerEvents="none"
        />

        {/* ── CARD BACK (sacred geometry, before flip) ── */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0, left: 0,
              width: cardW,
              height: cardH,
              borderRadius: 16,
              overflow: 'hidden',
              borderWidth: 1.5,
              borderColor: accent + '55',
            },
            backFaceStyle,
          ]}
        >
          <LinearGradient
            colors={isLight ? ['#FBF5E6', '#F0E6D0', '#E8D8BE'] : ['#0C0A14', '#181028', '#0F0820']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Sacred geometry centered */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <CardBackGeometry accent={accent} size={cardW * 0.72} />
          </View>

          {/* Rotating outer ring */}
          <RotatingRing accent={accent} size={cardW} />

          {/* Shimmer sweep */}
          <ShimmerSweep cardW={cardW} cardH={cardH} />

          {/* Center text */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 4, color: accent, opacity: 0.8 }}>✦ AETHERA ✦</Text>
          </View>

          {/* Bottom hint */}
          <View style={{ position: 'absolute', bottom: 22, left: 0, right: 0, alignItems: 'center' }} pointerEvents="none">
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2.5, color: accent + 'AA' }}>
              DOTKNIJ BY ODSŁONIĆ
            </Text>
          </View>

          {/* Gold border glow */}
          <View
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: accent + '66',
            }}
            pointerEvents="none"
          />
        </Animated.View>

        {/* ── CARD FRONT (revealed card content) ── */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0, left: 0,
              width: cardW,
              height: cardH,
              borderRadius: 16,
              overflow: 'hidden',
              borderWidth: 1.5,
              borderColor: accent + '66',
            },
            frontFaceStyle,
          ]}
        >
          {imageSource ? (
            /* ── IMAGE MODE: show actual deck card ── */
            <>
              <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#0a0614' }} />
              <Image
                source={imageSource}
                style={[
                  { width: cardW, height: cardH, borderRadius: 14 },
                  isReversed ? { transform: [{ rotate: '180deg' }] } : null,
                ]}
                resizeMode="cover"
              />
              {/* Reversed badge */}
              {isReversed && (
                <View style={{ position: 'absolute', top: 14, alignSelf: 'center', backgroundColor: 'rgba(220,60,60,0.85)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5, zIndex: 10 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#FFF' }}>ODWRÓCONA</Text>
                </View>
              )}
              {/* Subtle name banner at bottom */}
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 16, paddingTop: 32, alignItems: 'center', background: 'transparent' }}>
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={StyleSheet.absoluteFillObject} />
                <Text style={{ fontSize: 15, fontFamily: 'Cinzel_600SemiBold', letterSpacing: 1.5, color: '#FFFFFF', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }}>{cardName}</Text>
              </View>
              <HoloShimmer cardW={cardW} cardH={cardH} accent={accent} />
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, borderWidth: 1.5, borderColor: accent + '55' }} pointerEvents="none" />
            </>
          ) : (
            /* ── TEXT/EMOJI MODE: original design ── */
            <>
              {/* Gradient background */}
              <LinearGradient
                colors={[cardColor[0], cardColor[1], cardColor[0] + 'CC']}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Dark overlay for contrast */}
              <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.22)', borderRadius: 16 }} />
              {/* Reversed badge */}
              {isReversed && (
                <View style={{ position: 'absolute', top: 14, alignSelf: 'center', backgroundColor: 'rgba(220,60,60,0.85)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5, zIndex: 10 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#FFF' }}>ODWRÓCONA</Text>
                </View>
              )}
              {/* Card content */}
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24, transform: isReversed ? [{ rotate: '180deg' }] : [] }}>
                <View style={{ width: 60, height: 1.5, backgroundColor: 'rgba(255,255,255,0.5)', marginBottom: 24, borderRadius: 1 }} />
                <Text style={{ fontSize: 60, marginBottom: 20, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }}>{cardSymbol}</Text>
                <Text style={{ fontSize: 22, fontFamily: 'Cinzel_600SemiBold', letterSpacing: 2, color: '#FFFFFF', textAlign: 'center', marginBottom: 12, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }}>{cardName}</Text>
                <View style={{ width: 40, height: 1, backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: 14 }} />
                <Text style={{ fontSize: 13, fontFamily: 'Raleway_400Regular', fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20 }}>{cardMeaning}</Text>
                <View style={{ width: 60, height: 1.5, backgroundColor: 'rgba(255,255,255,0.5)', marginTop: 24, borderRadius: 1 }} />
              </View>
              <HoloShimmer cardW={cardW} cardH={cardH} accent={accent} />
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, borderWidth: 1.5, borderColor: accent + '88' }} pointerEvents="none" />
            </>
          )}
        </Animated.View>

        {/* ── Particle burst (after reveal) ── */}
        <View
          style={{
            position: 'absolute',
            top: cardH / 2,
            left: cardW / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          pointerEvents="none"
        >
          <ParticleBurst active={showParticles} accent={accent} />
        </View>
      </Animated.View>
    </Pressable>
  );
});

export default TarotCardFlip;
