import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, G } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { themes } from '../../../core/theme/tokens';
import { useAppStore } from '../../../store/useAppStore';
import { layout } from '../../../core/theme/designSystem';

interface MatrixChartProps {
  energies: {
    left: number;
    top: number;
    right: number;
    bottom: number;
    center: number;
  };
}

const NODE_COLORS = {
  center: '#CEAE72',    // Droga Życia — złoty
  top: '#A78BFA',       // Relacje / Duchowość — fioletowy
  right: '#60A5FA',     // Praca / Sprawczość — niebieski
  bottom: '#F472B6',    // Lekcja / Karma — różowy
  left: '#A78BFA',      // Relacje osobiste — fioletowy
};

export const MatrixChart = ({ energies }: MatrixChartProps) => {
  const { themeName } = useAppStore();
  const currentTheme = themes[themeName] || themes.dark;

  const screenWidth = layout.window.width;
  const size = Math.min(screenWidth - 40, 320);
  const padding = size * 0.15;
  const c = size / 2;

  const rotateY = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    rotateY.value = withRepeat(
      withSequence(
        withTiming(12, { duration: 10000 }),
        withTiming(-12, { duration: 10000 }),
      ),
      -1, false
    );
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-20, Math.min(20, e.translationY * 0.12));
      tiltY.value = Math.max(-25, Math.min(25, e.translationX * 0.12));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 800 });
      tiltY.value = withTiming(0, { duration: 800 });
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value + rotateY.value}deg` },
    ],
  }));

  const Point = ({ x, y, val, nodeColor }: { x: number, y: number, val: number, nodeColor: string }) => (
    <G>
      <Circle cx={x} cy={y} r={size * 0.065} fill={nodeColor + '22'} stroke={nodeColor} strokeWidth="2" />
      <SvgText
        x={x}
        y={y + (size * 0.022)}
        fill={nodeColor}
        fontSize={size * 0.05}
        fontWeight="900"
        textAnchor="middle"
      >
        {val}
      </SvgText>
    </G>
  );

  return (
    <GestureDetector gesture={panGesture}>
    <Animated.View style={[styles.container, animStyle]}>
      <Svg height={size} width={size}>
        {/* Outer Glow Lines */}
        <Line x1={c} y1={padding} x2={size - padding} y2={c} stroke={NODE_COLORS.top} strokeWidth="1" opacity="0.25" />
        <Line x1={size - padding} y1={c} x2={c} y2={size - padding} stroke={NODE_COLORS.right} strokeWidth="1" opacity="0.25" />
        <Line x1={c} y1={size - padding} x2={padding} y2={c} stroke={NODE_COLORS.bottom} strokeWidth="1" opacity="0.25" />
        <Line x1={padding} y1={c} x2={c} y2={padding} stroke={NODE_COLORS.left} strokeWidth="1" opacity="0.25" />

        {/* Square Border */}
        <Line x1={padding} y1={padding} x2={size - padding} y2={padding} stroke={currentTheme.primary} strokeWidth="0.5" strokeDasharray="3,6" opacity="0.3" />
        <Line x1={size - padding} y1={padding} x2={size - padding} y2={size - padding} stroke={currentTheme.primary} strokeWidth="0.5" strokeDasharray="3,6" opacity="0.3" />
        <Line x1={size - padding} y1={size - padding} x2={padding} y2={size - padding} stroke={currentTheme.primary} strokeWidth="0.5" strokeDasharray="3,6" opacity="0.3" />
        <Line x1={padding} y1={size - padding} x2={padding} y2={padding} stroke={currentTheme.primary} strokeWidth="0.5" strokeDasharray="3,6" opacity="0.3" />

        {/* Diagonal Lines */}
        <Line x1={padding} y1={padding} x2={size - padding} y2={size - padding} stroke={currentTheme.border} strokeWidth="0.5" opacity="0.6" />
        <Line x1={size - padding} y1={padding} x2={padding} y2={size - padding} stroke={currentTheme.border} strokeWidth="0.5" opacity="0.6" />

        {/* Main Points — każdy w swoim kolorze */}
        <Point x={c} y={padding} val={energies.top} nodeColor={NODE_COLORS.top} />
        <Point x={size - padding} y={c} val={energies.right} nodeColor={NODE_COLORS.right} />
        <Point x={c} y={size - padding} val={energies.bottom} nodeColor={NODE_COLORS.bottom} />
        <Point x={padding} y={c} val={energies.left} nodeColor={NODE_COLORS.left} />

        {/* Center Point - Droga Życia — złoty */}
        <Circle cx={c} cy={c} r={size * 0.1} fill={NODE_COLORS.center + '22'} stroke={NODE_COLORS.center} strokeWidth="2" />
        <Circle cx={c} cy={c} r={size * 0.08} fill={NODE_COLORS.center} opacity={0.12} />
        <SvgText
          x={c}
          y={c + (size * 0.025)}
          fill={NODE_COLORS.center}
          fontSize={size * 0.075}
          fontWeight="900"
          textAnchor="middle"
          fontFamily="serif"
        >
          {energies.center}
        </SvgText>
      </Svg>
    </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', marginVertical: 30 },
});
