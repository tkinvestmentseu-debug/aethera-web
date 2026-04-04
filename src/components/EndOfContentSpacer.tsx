import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { screenRhythm } from '../core/theme/designSystem';

interface EndOfContentSpacerProps {
  size?: 'compact' | 'standard' | 'airy';
}

const HEIGHT_MAP = {
  compact: screenRhythm.endCompact,
  standard: screenRhythm.endStandard,
  airy: screenRhythm.endAiry,
} as const;

export const EndOfContentSpacer = ({ size = 'standard' }: EndOfContentSpacerProps) => {
  const insets = useSafeAreaInsets();
  return <View style={[styles.spacer, { height: HEIGHT_MAP[size] + Math.max(insets.bottom - 2, 0) }]} pointerEvents="none" />;
};

const styles = StyleSheet.create({
  spacer: {
    width: '100%',
  },
});
