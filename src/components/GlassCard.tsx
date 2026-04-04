import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { AudioService } from '../core/services/audio.service';
import { HapticsService } from '../core/services/haptics.service';

export type GlassCardVariant =
  | 'default'
  | 'elevated'
  | 'field'
  | 'standard'
  | 'flat'
  | 'hero'
  | 'highlight';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  highlight?: boolean;
  variant?: GlassCardVariant;
}

export const GlassCard = ({ children, style, onPress, highlight, variant = 'default' }: GlassCardProps) => {
  const { themeName, experience } = useAppStore();
  const theme = getResolvedTheme(themeName);
  const scale = useSharedValue(1);
  const isLight = theme.background.startsWith('#F');

  const isHero = variant === 'hero';
  const isHighlight = variant === 'highlight' || !!highlight;
  const isFlatOrField = variant === 'flat' || variant === 'field';

  const handlePressIn = () => {
    if (onPress) {
      void HapticsService.impact(Haptics.ImpactFeedbackStyle.Light);
      AudioService.playTouchTone();
      const targetScale =
        experience.motionStyle === 'quiet' ? 0.998 :
        experience.motionStyle === 'minimal' ? 0.992 :
        experience.motionStyle === 'rich' ? 0.976 : 0.984;
      scale.value = withSpring(targetScale, { damping: 20, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (onPress) scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // ── Solid background colour (NO inner gradient — eliminates "tło w tle") ──
  const backgroundColor = isLight
    ? (isHero
        ? '#FFF8EE'
        : isHighlight
        ? '#FFF4E6'
        : isFlatOrField
        ? '#FDF8F2'
        : '#FDF5EB')
    : (isHero
        ? '#171C2E'
        : isHighlight
        ? '#14182C'
        : isFlatOrField
        ? '#111520'
        : '#13172A');

  // ── Border colour ──────────────────────────────────────────────────────────
  const borderColor = isHighlight
    ? theme.primary + 'CC'
    : isHero
    ? theme.primary + '99'
    : isFlatOrField
    ? (isLight ? 'rgba(122,93,46,0.20)' : 'rgba(255,255,255,0.09)')
    : isLight
    ? 'rgba(169,122,57,0.38)'
    : theme.primary + '66';

  const borderWidth = isHighlight ? 1.5 : isHero ? 1.5 : 1;

  // ── Sheen colour (horizontal shimmer at top of card) ──────────────────────
  const sheenColor = isLight
    ? 'rgba(255,220,140,0.80)'
    : isHighlight
    ? theme.primary + 'DD'
    : isHero
    ? theme.primary + 'BB'
    : theme.primary + '88';

  // ── Corner ornament colour ─────────────────────────────────────────────────
  const cornerColor = isHighlight
    ? theme.primary + 'CC'
    : isHero
    ? theme.primary + '99'
    : theme.primary + (isLight ? '55' : '66');
  const cornerColorDim = theme.primary + (isLight ? '30' : '38');

  // ── Accent top-corner tint for hero/highlight (subtle, not full-card) ─────
  const accentTintColors: [string, string, string] = isLight
    ? [theme.primary + '18', theme.primary + '06', 'transparent']
    : [theme.primary + '22', theme.primary + '08', 'transparent'];

  // ── Shadow / glow ─────────────────────────────────────────────────────────
  const shadowStyle = {
    shadowColor: isLight ? '#7B5C31' : theme.primary,
    shadowOffset: { width: 0, height: isHero || isHighlight ? 14 : 8 },
    shadowOpacity: isLight
      ? (isHighlight ? 0.22 : isHero ? 0.18 : 0.12)
      : (isHighlight ? 0.60 : isHero ? 0.42 : 0.28),
    shadowRadius: isHero || isHighlight ? 28 : 18,
    elevation: isHero || isHighlight ? 14 : 9,
  };

  const br = layout.radius.l;

  const topSheen = (
    <LinearGradient
      colors={['transparent', sheenColor, 'transparent'] as [string, string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.topSheen}
      pointerEvents="none"
    />
  );

  // Subtle top-left accent tint (tiny triangle of color, not full card gradient)
  const accentTint = (isHero || isHighlight) ? (
    <LinearGradient
      colors={accentTintColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.6, y: 0.6 }}
      style={[StyleSheet.absoluteFill, { borderRadius: br - 1 }]}
      pointerEvents="none"
    />
  ) : null;

  // Tiny rotated-square corner ornaments — give cards a mystical instrument feel
  const ornamentTR = (
    <View
      style={[styles.cornerTR, { borderColor: cornerColor }]}
      pointerEvents="none"
    />
  );
  const ornamentBL = (
    <View
      style={[styles.cornerBL, { borderColor: cornerColorDim }]}
      pointerEvents="none"
    />
  );

  const inner = (
    <>
      {accentTint}
      {topSheen}
      {ornamentTR}
      {ornamentBL}
      {children}
    </>
  );

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          borderRadius: br,
          borderWidth,
          borderColor,
          marginVertical: 5,
        },
        shadowStyle,
        style,
        { backgroundColor }, // always wins — prevents user style from overriding
      ]}
    >
      {onPress ? (
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{ width: '100%', borderRadius: br - 1, overflow: 'hidden', backgroundColor }}
        >
          {inner}
        </Pressable>
      ) : (
        <View style={{ width: '100%', borderRadius: br - 1, overflow: 'hidden', backgroundColor }}>
          {inner}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  topSheen: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    opacity: 0.70,
  },
  /** Top-right corner: two sides of a tiny diamond rotated 45° */
  cornerTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    opacity: 0.75,
  },
  /** Bottom-left corner: dimmer mirror */
  cornerBL: {
    position: 'absolute',
    bottom: 9,
    left: 10,
    width: 6,
    height: 6,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    opacity: 0.50,
  },
});
