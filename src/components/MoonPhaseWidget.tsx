// src/components/MoonPhaseWidget.tsx
// Mini widget fazy księżyca — dodaj do PortalScreen lub TodayScreen
// Używa logiki z LunarCalendarScreen (getMoonPhase)
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from './Typography';
import { HapticsService } from '../core/services/haptics.service';
import { useNavigation } from '@react-navigation/native';

// ---- Moon phase calculation (self-contained) ----
const MOON_PHASES = [
  { name: 'Nów',              emoji: '🌑', energy: 'Nowe początki' },
  { name: 'Przybywający Sierp', emoji: '🌒', energy: 'Wzrost intencji' },
  { name: 'Pierwsza Kwadra',  emoji: '🌓', energy: 'Działanie' },
  { name: 'Przybywający Garb', emoji: '🌔', energy: 'Kulminacja energii' },
  { name: 'Pełnia',           emoji: '🌕', energy: 'Szczyt mocy' },
  { name: 'Ubywający Garb',   emoji: '🌖', energy: 'Refleksja' },
  { name: 'Ostatnia Kwadra',  emoji: '🌗', energy: 'Uwalnianie' },
  { name: 'Ubywający Sierp',  emoji: '🌘', energy: 'Odpoczynek' },
];

function getMoonPhaseIndex(date: Date): number {
  const known    = new Date(2000, 0, 6).getTime(); // znany nów
  const synodic  = 29.53058867;                    // dni
  const elapsed  = (date.getTime() - known) / 86400000;
  const fraction = ((elapsed % synodic) + synodic) % synodic / synodic;
  return Math.floor(fraction * 8) % 8;
}

interface MoonPhaseWidgetProps {
  compact?: boolean;
  onPress?: () => void;
}

export const MoonPhaseWidget: React.FC<MoonPhaseWidgetProps> = ({ compact = false, onPress }) => {
  const navigation = useNavigation<any>();

  const phase = useMemo(() => {
    const idx = getMoonPhaseIndex(new Date());
    return MOON_PHASES[idx];
  }, []);

  const handlePress = () => {
    HapticsService.selection();
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('LunarCalendar');
    }
  };

  if (compact) {
    return (
      <Pressable onPress={handlePress} style={styles.compact}>
        <Typography style={{ fontSize: 22 }}>{phase.emoji}</Typography>
        <View>
          <Typography variant="caption" muted style={{ fontSize: 10, letterSpacing: 1 }}>
            KSIĘŻYC
          </Typography>
          <Typography variant="label" style={{ fontSize: 12 }}>
            {phase.name}
          </Typography>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} style={styles.full}>
      <Typography style={styles.moonEmoji}>{phase.emoji}</Typography>
      <View style={styles.info}>
        <Typography variant="caption" muted style={{ letterSpacing: 1.5, fontSize: 10 }}>
          FAZA KSIĘŻYCA
        </Typography>
        <Typography variant="heading" style={{ marginTop: 2 }}>
          {phase.name}
        </Typography>
        <Typography variant="caption" style={{ opacity: 0.6, marginTop: 2 }}>
          {phase.energy}
        </Typography>
      </View>
      <Typography variant="caption" style={{ opacity: 0.4 }}>›</Typography>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  full: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moonEmoji: {
    fontSize: 36,
  },
  info: {
    flex: 1,
  },
});
