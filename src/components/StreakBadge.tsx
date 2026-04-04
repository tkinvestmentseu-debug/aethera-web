// src/components/StreakBadge.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { Typography } from './Typography';
import { HapticsService } from '../core/services/haptics.service';

interface StreakBadgeProps {
  onPress?: () => void;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ onPress }) => {
  const streak = useAppStore((s) => s.streaks?.current ?? 0);
  const flameScale   = useRef(new Animated.Value(1)).current;
  const flameOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (streak < 3) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(flameScale,   { toValue: 1.18, duration: 700, useNativeDriver: true }),
          Animated.timing(flameOpacity, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(flameScale,   { toValue: 0.92, duration: 700, useNativeDriver: true }),
          Animated.timing(flameOpacity, { toValue: 0.7,  duration: 700, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [streak]);

  if (streak < 3) return null;

  return (
    <Pressable
      onPress={() => { HapticsService.selection(); onPress?.(); }}
      style={styles.container}
    >
      <Animated.Text style={[styles.flame, { transform: [{ scale: flameScale }], opacity: flameOpacity }]}>
        {String.fromCodePoint(0x1F525)}
      </Animated.Text>
      <View style={styles.textWrap}>
        <Typography variant="label" style={{ color: '#FF8C00', fontWeight: '700', fontSize: 15 }}>
          {String(streak)}
        </Typography>
        <Typography variant="caption" style={{ color: 'rgba(255,140,0,0.8)', fontSize: 10 }}>
          dni z rzędu
        </Typography>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,140,0,0.15)',
    borderColor: 'rgba(255,140,0,0.4)',
  },
  flame:   { fontSize: 18 },
  textWrap:{ alignItems: 'center' },
});
