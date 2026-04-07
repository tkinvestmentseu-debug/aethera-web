import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, Line } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Typography } from './Typography';
import { useTheme } from '../core/hooks/useTheme';

interface NebulaSignalStat {
  label: string;
  value: string;
}

interface NebulaSignalPanelProps {
  accent: string;
  eyebrow: string;
  title: string;
  description: string;
  stats: NebulaSignalStat[];
}

export const NebulaSignalPanel = ({
  accent,
  eyebrow,
  title,
  description,
  stats,
}: NebulaSignalPanelProps) => {
  const { isLight } = useTheme();
  const cardBg = isLight ? 'rgba(122,95,54,0.08)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)';

  const spin = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: 26000, easing: Easing.linear }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, []);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${spin.value}deg` }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + pulse.value * 0.35,
    transform: [{ scale: 0.92 + pulse.value * 0.1 }],
  }));

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: StyleSheet.hairlineWidth }]}>
      <LinearGradient
        colors={[accent + '22', accent + '08', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topRow}>
        <View style={styles.copyCol}>
          <Typography variant="premiumLabel" color={accent}>
            {eyebrow}
          </Typography>
          <Typography variant="cardTitle" style={styles.title}>
            {title}
          </Typography>
          <Typography variant="bodySmall" style={styles.description}>
            {description}
          </Typography>
        </View>
        <View style={styles.orbWrap}>
          <Animated.View style={[styles.halo, haloStyle, { backgroundColor: accent + '26' }]} />
          <Svg width={92} height={92}>
            <Circle cx={46} cy={46} r={24} fill={accent + '1F'} stroke={accent + '55'} strokeWidth={1.2} />
            <Ellipse cx={46} cy={46} rx={30} ry={10} fill="none" stroke={accent + '44'} strokeWidth={1} />
            <Ellipse cx={46} cy={46} rx={14} ry={30} fill="none" stroke={accent + '28'} strokeWidth={0.9} />
            <Circle cx={46} cy={46} r={4} fill={accent} />
          </Svg>
          <Animated.View style={[StyleSheet.absoluteFill, styles.orbitLayer, orbitStyle]}>
            <Svg width={92} height={92}>
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const angle = (index / 6) * 2 * Math.PI;
                return (
                  <Circle
                    key={index}
                    cx={46 + Math.cos(angle) * 34}
                    cy={46 + Math.sin(angle) * 12}
                    r={index % 2 === 0 ? 3.5 : 2}
                    fill={accent}
                    opacity={index % 2 === 0 ? 0.9 : 0.45}
                  />
                );
              })}
              <Line x1={18} y1={46} x2={74} y2={46} stroke={accent + '26'} strokeWidth={1} />
            </Svg>
          </Animated.View>
        </View>
      </View>

      <View style={styles.statsRow}>
        {stats.slice(0, 4).map((stat) => (
          <View key={stat.label} style={[styles.statChip, { borderColor: accent + '22' }]}>
            <Typography variant="microLabel" color={accent} style={styles.statLabel}>
              {stat.label}
            </Typography>
            <Typography variant="bodyRefined" style={styles.statValue}>
              {stat.value}
            </Typography>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  copyCol: {
    flex: 1,
  },
  title: {
    marginTop: 8,
    lineHeight: 24,
  },
  description: {
    marginTop: 8,
    lineHeight: 22,
    opacity: 0.82,
  },
  orbWrap: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  orbitLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  statChip: {
    minWidth: '47%',
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  statLabel: {
    letterSpacing: 0.8,
  },
  statValue: {
    marginTop: 6,
    fontSize: 15,
  },
});
