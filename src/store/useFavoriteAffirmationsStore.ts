// src/store/useFavoriteAffirmationsStore.ts
// Ulubione afirmacje — własna talia użytkownika
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoriteAffirmationsState {
  favorites: string[];          // teksty afirmacji
  addFavorite: (text: string) => void;
  removeFavorite: (text: string) => void;
  isFavorite: (text: string) => boolean;
  clearFavorites: () => void;
}

export const useFavoriteAffirmationsStore = create<FavoriteAffirmationsState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (text) =>
        set((s) => ({ favorites: s.favorites.includes(text) ? s.favorites : [...s.favorites, text] })),
      removeFavorite: (text) =>
        set((s) => ({ favorites: s.favorites.filter((f) => f !== text) })),
      isFavorite: (text) => get().favorites.includes(text),
      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: 'favorite-affirmations-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// -------------------------------------------------------
// Komponent FavoritesAffirmationsDeck.tsx
// Dodaj do AffirmationsScreen — sekcja "Moja talia"
// -------------------------------------------------------

/*
import React, { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring, withTiming
} from 'react-native-reanimated';
import { GlassCard } from './GlassCard';
import { Typography } from './Typography';
import { useFavoriteAffirmationsStore } from '../store/useFavoriteAffirmationsStore';
import { HapticsService } from '../core/services/haptics.service';

const { width } = Dimensions.get('window');

export const FavoriteAffirmationsDeck: React.FC = () => {
  const favorites = useFavoriteAffirmationsStore((s) => s.favorites);
  const [index, setIndex] = useState(0);
  const translateX = useSharedValue(0);
  const opacity    = useSharedValue(1);

  if (favorites.length === 0) {
    return (
      <GlassCard style={{ padding: 20, alignItems: 'center' }}>
        <Typography style={{ fontSize: 28, marginBottom: 8 }}>♡</Typography>
        <Typography variant="bodySmall" muted style={{ textAlign: 'center' }}>
          Twoja talia jest pusta.{'\n'}Dodaj afirmacje przez ikonę ♡.
        </Typography>
      </GlassCard>
    );
  }

  const next = () => {
    opacity.value = withTiming(0, { duration: 150 }, () => {
      setIndex((i) => (i + 1) % favorites.length);
      opacity.value = withTiming(1, { duration: 250 });
    });
    HapticsService.selection();
  };

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{ marginBottom: 24 }}>
      <Typography variant="sectionTitle" style={{ marginBottom: 12 }}>♡ Moja Talia</Typography>
      <Pressable onPress={next}>
        <Animated.View style={animStyle}>
          <GlassCard style={styles.card}>
            <Typography variant="caption" muted style={{ textAlign: 'center', letterSpacing: 1.5 }}>
              {index + 1} / {favorites.length}
            </Typography>
            <Typography
              variant="subheading"
              style={{ textAlign: 'center', lineHeight: 32, marginTop: 12 }}
            >
              {favorites[index]}
            </Typography>
            <Typography variant="caption" muted style={{ textAlign: 'center', marginTop: 16 }}>
              Dotknij aby przejść dalej
            </Typography>
          </GlassCard>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 28,
    borderRadius: 24,
    minHeight: 180,
    justifyContent: 'center',
  },
});
*/
