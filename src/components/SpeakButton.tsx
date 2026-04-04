import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, cancelAnimation, SharedValue,
} from 'react-native-reanimated';
import { Typography } from './Typography';
import { TTSService } from '../core/services/tts.service';

interface SpeakButtonProps {
  text: string;
  color?: string;
  compact?: boolean;
}

// Single animated bar component — avoids hook-in-loop violation
const WaveBar = ({ sv, color, compact }: { sv: SharedValue<number>; color: string; compact: boolean }) => {
  const aStyle = useAnimatedStyle(() => ({
    height: (compact ? 10 : 13) * sv.value,
    opacity: 0.5 + sv.value * 0.5,
  }));
  return <Animated.View style={[aStyle, { width: compact ? 2 : 2.5, borderRadius: 2, backgroundColor: color }]} />;
};

export const SpeakButton = ({ text, color = '#A97A39', compact = false }: SpeakButtonProps) => {
  const [speaking, setSpeaking] = useState(false);

  // 5 fixed bars — declared at top level, no loops at hook call sites
  const b0 = useSharedValue(0.35);
  const b1 = useSharedValue(0.35);
  const b2 = useSharedValue(0.35);
  const b3 = useSharedValue(0.35);
  const b4 = useSharedValue(0.35);
  const bars = [b0, b1, b2, b3, b4];

  useEffect(() => {
    return () => { TTSService.stop(); };
  }, []);

  const startWave = () => {
    const durations = [260, 340, 200, 380, 280];
    bars.forEach((bar, i) => {
      bar.value = withRepeat(
        withSequence(
          withTiming(0.85 + (i % 2) * 0.1, { duration: durations[i] }),
          withTiming(0.15 + (i % 3) * 0.08, { duration: durations[i] }),
        ), -1, true
      );
    });
  };

  const stopWave = () => {
    bars.forEach(bar => { cancelAnimation(bar); bar.value = withSpring(0.35); });
  };

  const handlePress = async () => {
    if (speaking) {
      await TTSService.stop();
      setSpeaking(false);
      stopWave();
      return;
    }
    setSpeaking(true);
    startWave();
    TTSService.speak(
      text,
      () => { setSpeaking(false); stopWave(); },
      undefined,
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.chip,
        compact && styles.chipCompact,
        { borderColor: color + (speaking ? '77' : '44'), backgroundColor: color + (speaking ? '22' : '12') },
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, height: compact ? 14 : 16 }}>
        {bars.map((sv, i) => (
          <WaveBar key={i} sv={sv} color={color} compact={compact} />
        ))}
      </View>
      {!compact && (
        <Typography variant="microLabel" color={color} style={{ marginLeft: 8 }}>
          {speaking ? 'Zatrzymaj' : 'Słuchaj'}
        </Typography>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
  },
  chipCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
