import React from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Pressable, StyleSheet, ViewStyle, StyleProp, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Typography } from './Typography';
import { shadows } from '../core/theme/designSystem';
import { AudioService } from '../core/services/audio.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTheme } from '../core/hooks/useTheme';

interface PremiumButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const AnimPressable = Animated.createAnimatedComponent(Pressable);

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  style,
  disabled,
}) => {
  const { currentTheme: theme, isLight } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled) return;
    void HapticsService.impact(Haptics.ImpactFeedbackStyle.Light);
    AudioService.playTouchTone();
    scale.value = withSpring(0.96, { damping: 18, stiffness: 280 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 280 });
  };
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    if (disabled) return;
    onPress();
  };

  if (variant === 'primary') {
    return (
      <AnimPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animStyle, style, disabled && styles.disabled]}
        disabled={disabled}
      >
        {/* Outer glow halo */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 999,
              backgroundColor: theme.primary + '18',
              margin: -4,
            },
          ]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={theme.gradientAccent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            {
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: isLight ? 0.30 : 0.60,
              shadowRadius: 22,
              elevation: 12,
            },
          ]}
        >
          {/* Inner shimmer line at top */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 30,
              right: 30,
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.55)',
              borderRadius: 1,
            }}
            pointerEvents="none"
          />
          <Typography variant="premiumLabel" color={theme.background}>
            {label}
          </Typography>
        </LinearGradient>
      </AnimPressable>
    );
  }

  if (variant === 'secondary') {
    return (
      <AnimPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          animStyle,
          styles.secondaryButton,
          {
            borderColor: theme.primary + '70',
            shadowColor: theme.primary,
            shadowOpacity: isLight ? 0.15 : 0.30,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 4 },
            elevation: 5,
          },
          style,
          disabled && styles.disabled,
        ]}
        disabled={disabled}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 999,
              backgroundColor: theme.primary + (isLight ? '10' : '0E'),
            },
          ]}
          pointerEvents="none"
        />
        <Typography variant="premiumLabel" color={theme.primary}>
          {label}
        </Typography>
      </AnimPressable>
    );
  }

  // ghost
  return (
    <AnimPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animStyle, styles.ghostButton, style, disabled && styles.disabled]}
      disabled={disabled}
    >
      <Typography variant="premiumLabel" color={theme.primary}>
        {label}
      </Typography>
    </AnimPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    overflow: 'hidden',
  },
  secondaryButton: {
    height: 50,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  ghostButton: {
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  disabled: {
    opacity: 0.42,
  },
});
