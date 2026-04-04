import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Typography } from './Typography';
import { useFavoriteAffirmationsStore } from '../store/useFavoriteAffirmationsStore';
import { HapticsService } from '../core/services/haptics.service';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { useTranslation } from 'react-i18next';

export const FavoriteAffirmationsDeck: React.FC = () => {
  const { t } = useTranslation();
  const { themeName } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';

  const favorites              = useFavoriteAffirmationsStore((s) => s.favorites);
  const [index, setIndex]      = useState(0);
  const opacity                = useSharedValue(1);

  if (favorites.length === 0) {
    return (
      <View style={{ padding: 20, alignItems: 'center', marginBottom: 24, borderRadius: 24, backgroundColor: cardBg, borderWidth: StyleSheet.hairlineWidth, borderColor: cardBorder }}>
        <Typography style={{ fontSize: 28, marginBottom: 8 }}>{"<3"}</Typography>
        <Typography variant="bodySmall" muted style={{ textAlign: 'center' }}>
          {t('affirmations.favoriteDeckEmpty', {
            defaultValue: 'Your deck is empty.\nAdd affirmations with the heart icon.',
          })}
        </Typography>
      </View>
    );
  }

  const next = () => {
    opacity.value = withTiming(0, { duration: 150 }, () => {
      setIndex((i) => (i + 1) % favorites.length);
      opacity.value = withTiming(1, { duration: 250 });
    });
    HapticsService.selection();
  };

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={{ marginBottom: 24 }}>
      <Typography variant="title" style={{ marginBottom: 12 }}>
        {t('affirmations.favoriteDeckTitle', { defaultValue: 'My Deck' })}
      </Typography>
      <Pressable onPress={next}>
        <Animated.View style={[animStyle, styles.card, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: StyleSheet.hairlineWidth }]}>
          <Typography variant="caption" muted style={{ textAlign: 'center', letterSpacing: 1.5 }}>
            {index + 1} / {favorites.length}
          </Typography>
          <Typography variant="heading" style={{ textAlign: 'center', lineHeight: 32, marginTop: 12 }}>
            {favorites[index]}
          </Typography>
          <Typography variant="caption" muted style={{ textAlign: 'center', marginTop: 16 }}>
            {t('common.tapToContinue', { defaultValue: 'Tap to continue' })}
          </Typography>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: 28, borderRadius: 24, minHeight: 180, justifyContent: 'center' },
});
