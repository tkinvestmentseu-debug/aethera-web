import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../core/hooks/useTheme';

interface CelestialBackdropProps {
  intensity?: 'soft' | 'medium' | 'immersive';
}

const { width: W, height: H } = Dimensions.get('window');
const CX = W / 2;

// ── Pre-computed star positions ────────────────────────────────

const DEEP_STARS = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  x: Math.abs(i * 1009 + i * i * 23) % Math.round(W),
  y: Math.abs(i * 1013 + i * i * 19) % Math.round(H),
  r: i % 8 === 0 ? 2.0 : i % 4 === 0 ? 1.4 : 0.85,
  op: 0.26 + (i % 7) * 0.09,
}));

const SUBTLE_STARS = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  x: Math.abs(i * 1031 + i * i * 17) % Math.round(W),
  y: Math.abs(i * 997 + i * i * 13) % Math.round(H),
  r: i % 5 === 0 ? 1.4 : 0.85,
  op: 0.10 + (i % 5) * 0.04,
}));

// ── Sacred geometry: Flower of Life ───────────────────────────
const GR = W * 0.12;
const GCX = CX;
const GCY = H * 0.30;
const GEO_PETALS = Array.from({ length: 6 }, (_, k) => {
  const angle = (k * Math.PI * 2) / 6;
  return { id: k, cx: GCX + GR * Math.cos(angle), cy: GCY + GR * Math.sin(angle) };
});

// ── Golden ritual rays ─────────────────────────────────────────
const RAY_OX = CX;
const RAY_OY = H * 0.04;
const RAY_ANGLES = [-70, -55, -40, -25, -12, 0, 12, 25, 40, 55, 70];
const GOLDEN_RAYS = RAY_ANGLES.map((deg, i) => {
  const rad = (deg * Math.PI) / 180;
  const len = H * 1.4;
  return {
    id: i,
    endX: RAY_OX + len * Math.sin(rad),
    endY: RAY_OY + len * Math.cos(rad),
    op: 0.22 - Math.abs(deg) * 0.0016,
    sw: 1.4 - Math.abs(deg) * 0.007,
  };
});

// ── Bright accent stars for deepNight ─────────────────────────
const BRIGHT_STARS = [
  { x: W * 0.18, y: H * 0.10 },
  { x: W * 0.80, y: H * 0.07 },
  { x: W * 0.54, y: H * 0.23 },
  { x: W * 0.12, y: H * 0.39 },
  { x: W * 0.92, y: H * 0.32 },
  { x: W * 0.68, y: H * 0.52 },
];

export const CelestialBackdrop: React.FC<CelestialBackdropProps> = ({ intensity = 'medium' }) => {
  const { experience } = useAppStore();
  const { currentTheme: theme, isLight } = useTheme();
  const motionFactor =
    experience.motionStyle === 'quiet' ? 0.65
    : experience.motionStyle === 'minimal' ? 0.8
    : experience.motionStyle === 'rich' ? 1.15
    : 1;

  const bs = experience.backgroundStyle;
  const intMult = intensity === 'soft' ? 0.72 : intensity === 'immersive' ? 1.28 : 1.0;

  const starColor = isLight ? 'rgba(130,100,50,1)' : 'rgba(255,248,230,1)';
  const geoColor = theme.primary;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ── Base gradient ── */}
      <LinearGradient colors={theme.gradientHero} style={StyleSheet.absoluteFill} />

      {/* ══════════════════════════════════════════════════════════
          DEEP NIGHT — dense starfield with bright accent stars
      ══════════════════════════════════════════════════════════ */}
      {bs === 'deepNight' && (
        <>
          <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
            {DEEP_STARS.map(s => (
              <Circle
                key={s.id}
                cx={s.x} cy={s.y}
                r={s.r * intMult}
                fill={starColor}
                opacity={s.op * intMult}
              />
            ))}
            {BRIGHT_STARS.map((s, i) => (
              <G key={i}>
                <Circle cx={s.x} cy={s.y} r={3.0} fill={starColor} opacity={0.95} />
                <Line x1={s.x - 12} y1={s.y} x2={s.x + 12} y2={s.y} stroke={starColor} strokeWidth={0.6} opacity={0.45} />
                <Line x1={s.x} y1={s.y - 12} x2={s.x} y2={s.y + 12} stroke={starColor} strokeWidth={0.6} opacity={0.45} />
              </G>
            ))}
          </Svg>
          {/* Deep darkness vignette from edges */}
          <LinearGradient
            colors={isLight
              ? ['rgba(120,94,56,0.10)', 'transparent'] as const
              : ['rgba(0,0,0,0.58)', 'transparent'] as const}
            locations={[0, 0.3]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={isLight
              ? ['transparent', 'rgba(120,94,56,0.12)'] as const
              : ['transparent', 'rgba(0,0,0,0.68)'] as const}
            locations={[0.7, 1]}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          SACRED GEOMETRY — Flower of Life / Metatron's Cube
      ══════════════════════════════════════════════════════════ */}
      {bs === 'sacredGeometry' && (
        <Svg
          style={[StyleSheet.absoluteFill, { opacity: isLight ? 0.18 : 0.24 }]}
          width={W}
          height={H}
        >
          {/* Outer boundary circles */}
          <Circle cx={GCX} cy={GCY} r={GR * 2.6} stroke={geoColor} strokeWidth={0.6} fill="none" opacity={0.40} />
          <Circle cx={GCX} cy={GCY} r={GR * 2.0} stroke={geoColor} strokeWidth={0.7} fill="none" opacity={0.55} />
          {/* Main center circle */}
          <Circle cx={GCX} cy={GCY} r={GR} stroke={geoColor} strokeWidth={0.9} fill="none" opacity={1} />
          {/* 6 petal circles */}
          {GEO_PETALS.map(p => (
            <Circle key={p.id} cx={p.cx} cy={p.cy} r={GR} stroke={geoColor} strokeWidth={0.9} fill="none" opacity={0.92} />
          ))}
          {/* Spoke lines from center to each petal */}
          {GEO_PETALS.map(p => (
            <Line key={`s${p.id}`} x1={GCX} y1={GCY} x2={p.cx} y2={p.cy} stroke={geoColor} strokeWidth={0.55} opacity={0.65} />
          ))}
          {/* Hexagonal ring connecting adjacent petals */}
          {GEO_PETALS.map((p, i) => {
            const next = GEO_PETALS[(i + 1) % 6];
            return <Line key={`h${i}`} x1={p.cx} y1={p.cy} x2={next.cx} y2={next.cy} stroke={geoColor} strokeWidth={0.55} opacity={0.65} />;
          })}
          {/* Triangle 1 (petals 0,2,4) */}
          {([0, 2, 4] as const).map((k, i) => {
            const p1 = GEO_PETALS[k];
            const p2 = GEO_PETALS[(k + 2) % 6];
            return <Line key={`t1${i}`} x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy} stroke={geoColor} strokeWidth={0.45} opacity={0.50} />;
          })}
          {/* Triangle 2 (petals 1,3,5) */}
          {([1, 3, 5] as const).map((k, i) => {
            const p1 = GEO_PETALS[k];
            const p2 = GEO_PETALS[(k + 2) % 6];
            return <Line key={`t2${i}`} x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy} stroke={geoColor} strokeWidth={0.45} opacity={0.50} />;
          })}
        </Svg>
      )}

      {/* ══════════════════════════════════════════════════════════
          GOLDEN RITUAL — radiating sun rays + concentric circles
      ══════════════════════════════════════════════════════════ */}
      {bs === 'goldenRitual' && (
        <>
          <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
            {GOLDEN_RAYS.map(r => (
              <Line
                key={r.id}
                x1={RAY_OX} y1={RAY_OY}
                x2={r.endX} y2={r.endY}
                stroke={geoColor}
                strokeWidth={Math.max(0.3, r.sw)}
                opacity={r.op * intMult}
              />
            ))}
            {/* Concentric circles at ray origin */}
            <Circle cx={RAY_OX} cy={RAY_OY} r={W * 0.42} stroke={geoColor} strokeWidth={0.8} fill="none" opacity={0.28 * intMult} />
            <Circle cx={RAY_OX} cy={RAY_OY} r={W * 0.22} stroke={geoColor} strokeWidth={0.8} fill="none" opacity={0.38 * intMult} />
            <Circle cx={RAY_OX} cy={RAY_OY} r={W * 0.08} stroke={geoColor} strokeWidth={1.0} fill="none" opacity={0.55 * intMult} />
          </Svg>
          {/* Golden warm glow at top */}
          <View
            style={{
              position: 'absolute',
              width: W * 1.2,
              height: W * 0.9,
              borderRadius: W * 0.6,
              top: -W * 0.5,
              left: W * 0.5 - W * 0.6,
              backgroundColor: geoColor + '16',
            }}
          />
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          MOON GLOW — large moon at upper-right with halos
      ══════════════════════════════════════════════════════════ */}
      {bs === 'moonGlow' && (
        <>
          <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
            {/* Outer glow halos */}
            <Circle cx={W * 0.76} cy={H * 0.14} r={W * 0.58} fill="rgba(190,210,255,0.035)" />
            <Circle cx={W * 0.76} cy={H * 0.14} r={W * 0.48} fill="rgba(195,215,255,0.055)" />
            <Circle cx={W * 0.76} cy={H * 0.14} r={W * 0.38} fill="rgba(200,220,255,0.08)" />
            {/* Moon body */}
            <Circle
              cx={W * 0.76} cy={H * 0.14}
              r={W * 0.28}
              fill={isLight ? 'rgba(205,218,255,0.28)' : 'rgba(198,215,255,0.22)'}
            />
            {/* Lighter inner region */}
            <Circle
              cx={W * 0.76 - W * 0.05} cy={H * 0.14 - H * 0.01}
              r={W * 0.22}
              fill={isLight ? 'rgba(225,235,255,0.20)' : 'rgba(220,232,255,0.16)'}
            />
            {/* Moon border */}
            <Circle
              cx={W * 0.76} cy={H * 0.14}
              r={W * 0.28}
              stroke="rgba(200,215,255,0.40)"
              strokeWidth={0.9}
              fill="none"
            />
            {/* Silver reflection column */}
            <Line
              x1={W * 0.76} y1={H * 0.14 + W * 0.3}
              x2={CX * 0.9} y2={H * 0.88}
              stroke="rgba(200,215,255,0.07)"
              strokeWidth={W * 0.09}
            />
          </Svg>
          {/* Blue atmospheric tint */}
          <LinearGradient
            colors={isLight ? ['rgba(180,200,255,0.12)', 'transparent'] as const : ['rgba(60,80,140,0.14)', 'transparent'] as const}
            locations={[0, 0.5]}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          SOFT MIST — layered fog from bottom half
      ══════════════════════════════════════════════════════════ */}
      {bs === 'softMist' && (
        <>
          <LinearGradient
            colors={isLight
              ? ['transparent', 'rgba(255,255,255,0.38)', 'rgba(255,255,255,0.68)'] as const
              : ['transparent', 'rgba(210,225,245,0.12)', 'rgba(210,225,245,0.24)'] as const}
            locations={[0.28, 0.60, 1]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={isLight
              ? ['transparent', 'rgba(255,255,255,0.56)'] as const
              : ['transparent', 'rgba(200,215,240,0.16)'] as const}
            locations={[0.50, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* Floating mist ellipses at bottom */}
          <View
            style={{
              position: 'absolute',
              bottom: H * 0.05,
              left: -W * 0.3,
              width: W * 1.6,
              height: H * 0.22,
              borderRadius: H * 0.11,
              backgroundColor: isLight ? 'rgba(255,255,255,0.28)' : 'rgba(200,218,245,0.10)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: H * 0.18,
              left: -W * 0.2,
              width: W * 1.4,
              height: H * 0.14,
              borderRadius: H * 0.07,
              backgroundColor: isLight ? 'rgba(255,255,255,0.18)' : 'rgba(200,218,245,0.07)',
            }}
          />
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          MINIMAL CLEAN — single perfect circle + cross
      ══════════════════════════════════════════════════════════ */}
      {bs === 'minimalClean' && (
        <Svg
          style={[StyleSheet.absoluteFill, { opacity: isLight ? 0.16 : 0.20 }]}
          width={W}
          height={H}
        >
          <Circle cx={CX} cy={H * 0.38} r={W * 0.40} stroke={geoColor} strokeWidth={0.9} fill="none" />
          <Circle cx={CX} cy={H * 0.38} r={W * 0.26} stroke={geoColor} strokeWidth={0.6} fill="none" opacity={0.65} />
          <Circle cx={CX} cy={H * 0.38} r={W * 0.12} stroke={geoColor} strokeWidth={0.5} fill="none" opacity={0.45} />
          <Line x1={CX - W * 0.52} y1={H * 0.38} x2={CX + W * 0.52} y2={H * 0.38} stroke={geoColor} strokeWidth={0.5} opacity={0.45} />
          <Line x1={CX} y1={H * 0.38 - W * 0.52} x2={CX} y2={H * 0.38 + W * 0.52} stroke={geoColor} strokeWidth={0.5} opacity={0.45} />
        </Svg>
      )}

      {/* ══════════════════════════════════════════════════════════
          SUBTLE CELESTIAL (default) — stars + orbital rings
      ══════════════════════════════════════════════════════════ */}
      {(bs === 'subtleCelestial' || !['deepNight','sacredGeometry','goldenRitual','moonGlow','softMist','minimalClean'].includes(bs)) && (
        <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
          {SUBTLE_STARS.map(s => (
            <Circle
              key={s.id}
              cx={s.x} cy={s.y}
              r={s.r * intMult}
              fill={starColor}
              opacity={s.op * intMult}
            />
          ))}
          {/* Large orbital ring (partially off screen top-right) */}
          <Circle
            cx={W * 0.82} cy={H * 0.14}
            r={W * 0.62}
            stroke={isLight ? 'rgba(120,94,56,0.14)' : 'rgba(255,255,255,0.10)'}
            strokeWidth={0.9}
            fill="none"
          />
          <Circle
            cx={W * 0.82} cy={H * 0.14}
            r={W * 0.42}
            stroke={isLight ? 'rgba(120,94,56,0.11)' : 'rgba(255,255,255,0.08)'}
            strokeWidth={0.7}
            fill="none"
          />
          <Circle
            cx={W * 0.82} cy={H * 0.14}
            r={W * 0.24}
            stroke={isLight ? 'rgba(120,94,56,0.09)' : 'rgba(255,255,255,0.06)'}
            strokeWidth={0.6}
            fill="none"
          />
          {/* Small ring bottom-left */}
          <Circle
            cx={W * 0.14} cy={H * 0.76}
            r={W * 0.16}
            stroke={isLight ? 'rgba(120,94,56,0.08)' : 'rgba(255,255,255,0.05)'}
            strokeWidth={0.5}
            fill="none"
          />
        </Svg>
      )}

      {/* ── Common atmospheric elements (all styles) ── */}

      {/* Top vignette */}
      <LinearGradient
        colors={isLight
          ? ['rgba(120,94,56,0.05)', 'transparent'] as const
          : ['rgba(0,0,0,0.14)', 'transparent'] as const}
        locations={[0, 0.32]}
        style={StyleSheet.absoluteFill}
      />
      {/* Bottom vignette */}
      <LinearGradient
        colors={isLight
          ? ['transparent', 'rgba(120,94,56,0.07)'] as const
          : ['transparent', 'rgba(0,0,0,0.20)'] as const}
        locations={[0.68, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Primary ambient orb (top-right) */}
      {bs !== 'minimalClean' && (
        <View style={[styles.orbPrimary]}>
          <Animated.View
            entering={FadeIn.duration(Math.round(1400 / motionFactor))}
            style={[
              styles.fill,
              {
                backgroundColor: bs === 'goldenRitual'
                  ? theme.primary + '14'
                  : bs === 'moonGlow'
                    ? 'rgba(170,195,255,0.10)'
                    : theme.glow,
                borderRadius: 999,
              },
            ]}
          />
        </View>
      )}

      {/* Secondary orb (bottom-left) */}
      {bs !== 'minimalClean' && bs !== 'deepNight' && (
        <View style={[styles.orbSecondary]}>
          <Animated.View
            entering={FadeIn.duration(Math.round(1600 / motionFactor))}
            style={[styles.fill, { backgroundColor: theme.primary + '0C', borderRadius: 999 }]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject },
  orbPrimary: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 999,
    top: -100,
    right: -100,
    opacity: 0.9,
  },
  orbSecondary: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 999,
    bottom: 50,
    left: -80,
    opacity: 0.8,
  },
});
