// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

// Single skeleton bone with shimmer
export const SkeletonBone: React.FC<SkeletonProps> = ({ width = '100%', height = 16, borderRadius = 8, style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: 'rgba(167,139,250,0.2)' }, { opacity }, style]}
    />
  );
};

// Pre-built card skeleton
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[sk.card, style]}>
    <View style={sk.row}>
      <SkeletonBone width={44} height={44} borderRadius={22} />
      <View style={{ flex: 1, gap: 8, marginLeft: 12 }}>
        <SkeletonBone width="60%" height={14} />
        <SkeletonBone width="40%" height={11} />
      </View>
    </View>
    <SkeletonBone height={12} style={{ marginTop: 14 }} />
    <SkeletonBone width="85%" height={12} style={{ marginTop: 8 }} />
    <SkeletonBone width="70%" height={12} style={{ marginTop: 8 }} />
  </View>
);

// List of skeleton cards
export const SkeletonList: React.FC<{ count?: number; cardStyle?: ViewStyle }> = ({ count = 3, cardStyle }) => (
  <View style={{ gap: 12 }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} style={cardStyle} />
    ))}
  </View>
);

// Skeleton for a stat row (4 metric cards)
export const SkeletonStats: React.FC = () => (
  <View style={sk.statsRow}>
    {[0,1,2,3].map(i => (
      <View key={i} style={sk.statCard}>
        <SkeletonBone width={32} height={32} borderRadius={16} style={{ alignSelf: 'center' }} />
        <SkeletonBone width="70%" height={20} style={{ marginTop: 8, alignSelf: 'center' }} />
        <SkeletonBone width="50%" height={11} style={{ marginTop: 6, alignSelf: 'center' }} />
      </View>
    ))}
  </View>
);

const sk = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  row: { flexDirection: 'row', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
});
