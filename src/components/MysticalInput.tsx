/**
 * MysticalInput — an atmospheric text input for Aethera.
 *
 * Features:
 * - Gradient border that glows on focus (primary-color glow)
 * - Deep dark surface with subtle gradient background
 * - Animated border opacity transition on focus / blur
 * - Auto-scroll capability via onFocus callback
 * - Full TextInput API passthrough
 */
import React, { forwardRef, useRef, useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Animated as RNAnimated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';

interface MysticalInputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  /** Called when the input receives focus — use with useInputAutoScroll */
  onFocusScroll?: () => void;
}

export const MysticalInput = forwardRef<TextInput, MysticalInputProps>(
  ({ containerStyle, onFocus, onBlur, onFocusScroll, style, ...rest }, ref) => {
    const { themeName } = useAppStore();
    const theme = getResolvedTheme(themeName);
    const isLight = theme.background.startsWith('#F');
    const [focused, setFocused] = useState(false);

    // Animated border glow
    const glowAnim = useRef(new RNAnimated.Value(0)).current;

    const handleFocus = (e: any) => {
      setFocused(true);
      RNAnimated.timing(glowAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: false,
      }).start();
      onFocusScroll?.();
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setFocused(false);
      RNAnimated.timing(glowAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }).start();
      onBlur?.(e);
    };

    const borderColor = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [
        isLight ? 'rgba(169,122,57,0.28)' : theme.primary + '42',
        theme.primary + 'CC',
      ],
    });

    const shadowOpacity = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, isLight ? 0.22 : 0.55],
    });

    const bgTop = isLight ? 'rgba(255,253,247,0.98)' : 'rgba(10,14,24,0.96)';
    const bgBottom = isLight ? 'rgba(250,244,232,0.97)' : 'rgba(6,9,16,0.97)';

    return (
      <RNAnimated.View
        style={[
          styles.outerWrap,
          {
            borderColor,
            shadowColor: theme.primary,
            shadowOpacity,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 6 },
            elevation: focused ? 8 : 3,
          },
          containerStyle,
        ]}
      >
        {/* Deep gradient background */}
        <LinearGradient
          colors={[bgTop, bgBottom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: layout.radius.m - 1 }]}
          pointerEvents="none"
        />

        {/* Top shimmer on focus */}
        {focused && (
          <LinearGradient
            colors={['transparent', theme.primary + '70', 'transparent'] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topSheen}
            pointerEvents="none"
          />
        )}

        {/* Left accent bar (always visible, thicker on focus) */}
        <View
          style={[
            styles.leftBar,
            {
              backgroundColor: theme.primary,
              opacity: focused ? 0.85 : 0.30,
              height: focused ? '70%' : '40%',
            },
          ]}
          pointerEvents="none"
        />

        <TextInput
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={isLight ? 'rgba(43,34,25,0.38)' : 'rgba(245,241,234,0.32)'}
          style={[
            styles.input,
            {
              color: theme.text,
              paddingLeft: 20, // room for left bar
            },
            style,
          ]}
          {...rest}
        />
      </RNAnimated.View>
    );
  }
);

MysticalInput.displayName = 'MysticalInput';

const styles = StyleSheet.create({
  outerWrap: {
    borderRadius: layout.radius.m,
    borderWidth: 1,
    minHeight: 52,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topSheen: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
  },
  leftBar: {
    position: 'absolute',
    left: 0,
    top: '15%',
    width: 2.5,
    borderRadius: 2,
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    minHeight: 52,
    textAlignVertical: 'top',
  },
});
