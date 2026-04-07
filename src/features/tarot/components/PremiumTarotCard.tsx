import React, { useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolate, 
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { themes } from '../../../core/theme/tokens';
import { layout } from '../../../core/theme/designSystem';
import { useAppStore } from '../../../store/useAppStore';
import { Typography } from '../../../components/Typography';

interface PremiumTarotCardProps {
  isFlipped: boolean;
  onPress?: () => void;
  cardName?: string;
  isReversed?: boolean;
}

export const PremiumTarotCard = ({ isFlipped, onPress, cardName, isReversed }: PremiumTarotCardProps) => {
    const themeName = useAppStore(s => s.themeName);
  const currentTheme = themes[themeName] || themes.dark;
  const flipValue = useSharedValue(0);

  useEffect(() => {
    flipValue.value = withTiming(isFlipped ? 1 : 0, { duration: 800 });
  }, [isFlipped]);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 1], [0, 180]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity: flipValue.value < 0.5 ? 1 : 0,
      zIndex: flipValue.value < 0.5 ? 1 : 0,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 1], [180, 360]);
    return {
      transform: [
        { rotateY: `${rotateY}deg` },
      ],
      opacity: flipValue.value >= 0.5 ? 1 : 0,
      zIndex: flipValue.value >= 0.5 ? 1 : 0,
    };
  });

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {/* Rewers (Tył) */}
      <Animated.View style={[styles.card, styles.cardBack, frontStyle, { borderColor: currentTheme.primary, backgroundColor: '#020205' }]}>
        <LinearGradient colors={['rgba(255,255,255,0.05)', 'transparent']} style={StyleSheet.absoluteFill} />
        <View style={[styles.innerBorder, { borderColor: 'rgba(212, 175, 55, 0.25)' }]}>
           <MaterialCommunityIcons name="auto-fix" size={40} color={currentTheme.primary} opacity={0.8} />
           <View style={styles.cardBackDecor}>
              <View style={[styles.decorLine, { backgroundColor: currentTheme.primary }]} />
              <Typography variant="microLabel" color={currentTheme.primary} style={{ fontSize: 9 }}>Połącz się</Typography>
              <View style={[styles.decorLine, { backgroundColor: currentTheme.primary }]} />
           </View>
        </View>
      </Animated.View>

      {/* Awers (Przód) */}
      <Animated.View style={[styles.card, styles.cardFront, backAnimatedStyle, { backgroundColor: '#FAF9F6', borderColor: currentTheme.primary }]}>
         <LinearGradient colors={['#FFFFFF', '#FAF9F6', '#F5F5F0']} style={StyleSheet.absoluteFill} />
         <View style={styles.frontGlow} />
         <View style={styles.cardFrontInner}>
            <View style={styles.illustrationPlaceholder}>
               <MaterialCommunityIcons name={isReversed ? "rotate-right" : "star-face"} size={64} color="#1C1917" opacity={0.85} />
            </View>
            <Typography variant="subtitle" color="#1C1917" align="center" numberOfLines={5} style={{ lineHeight: 29, fontSize: 20 }}>{cardName || 'Karta'}</Typography>
            <View style={[styles.divider, { backgroundColor: currentTheme.primary }]} />
            {isReversed && (
              <View style={[styles.reversedBadge, { backgroundColor: '#1C1917' }]}>
                <Typography variant="microLabel" color="#FFF" style={{ fontSize: 9 }}>Energia odwrócona</Typography>
              </View>
            )}
         </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { width: 202, height: 336, margin: 10 },
  card: { width: '100%', height: '100%', borderRadius: 16, position: 'absolute', backfaceVisibility: 'hidden', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.8, shadowRadius: 30, elevation: 20, overflow: 'hidden' },
  cardBack: { padding: 8, alignItems: 'center', justifyContent: 'center' },
  innerBorder: { width: '100%', height: '100%', borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderStyle: 'solid' },
  cardBackDecor: { flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 10 },
  decorLine: { width: 24, height: layout.hairline, opacity: 0.4 },
  cardFront: { padding: 6 },
  frontGlow: { position: 'absolute', top: -16, right: -6, width: 108, height: 108, borderRadius: 999, backgroundColor: 'rgba(212,175,55,0.07)' },
  cardFrontInner: { flex: 1, borderRadius: 10, borderWidth: layout.hairline, borderColor: 'rgba(28, 25, 23, 0.1)', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 24, paddingBottom: 22 },
  illustrationPlaceholder: { marginTop: 4, marginBottom: 16 },
  divider: { width: 30, height: 1, marginVertical: 16 },
  reversedBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
});
