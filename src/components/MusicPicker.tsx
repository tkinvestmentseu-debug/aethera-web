import React from 'react';
import { ScrollView, Pressable, StyleSheet, View } from 'react-native';
import { Music2, Wind } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from './Typography';
import { AudioService } from '../core/services/audio.service';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { useTheme } from '../core/hooks/useTheme';
const MUSIC_OPTIONS = [
  { id: 'relaxing',   label: '528 Hz',  sublabel: 'Relaks' },
  { id: 'sleep',      label: '432 Hz',  sublabel: 'Sen' },
  { id: 'focus',      label: '40 Hz',   sublabel: 'Fokus' },
  { id: 'ritual',     label: '396 Hz',  sublabel: 'Rytuał' },
  { id: 'celestial',  label: '963 Hz',  sublabel: 'Kosmiczny' },
  { id: 'motivating', label: '741 Hz',  sublabel: 'Motywacja' },
];

const AMBIENT_OPTIONS = [
  { id: 'rain',    label: 'Deszcz' },
  { id: 'waves',   label: 'Ocean' },
  { id: 'fire',    label: 'Ogień' },
  { id: 'forest',  label: 'Las' },
  { id: 'ritual',  label: 'Rytuał' },
];

interface MusicPickerProps {
  accentColor?: string;
}

export const MusicPicker = ({ accentColor }: MusicPickerProps) => {
  const { t } = useTranslation();
  const { experience, ambientSoundEnabled, setExperience, setAmbientSoundEnabled } = useAppStore();
  const { currentTheme, isLight } = useTheme();
  const accent = accentColor || currentTheme.primary;
  const cardBg = isLight ? 'rgba(122,95,54,0.08)' : 'rgba(255,255,255,0.06)';
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.50)' : 'rgba(255,255,255,0.55)';

  const activeMusic = experience.backgroundMusicCategory;
  const activeAmbient = experience.ambientSoundscape;

  const selectMusic = async (id: string) => {
    setExperience({ backgroundMusicCategory: id as any, backgroundMusicEnabled: true });
    await AudioService.applyPreferences({
      ...experience,
      backgroundMusicEnabled: true,
      backgroundMusicCategory: id as any,
      ambientSoundscape: experience.ambientSoundscape,
    });
  };

  const selectAmbient = async (id: string) => {
    const newEnabled = activeAmbient === id ? !ambientSoundEnabled : true;
    setExperience({ ambientSoundscape: id as any });
    setAmbientSoundEnabled(newEnabled);
    await AudioService.applyPreferences({
      ...experience,
      ambientSoundscape: id as any,
      ambientEnabled: newEnabled,
    });
  };

  return (
    <View>
      {/* Music row */}
      <View style={styles.sectionRow}>
        <Music2 color={accent} size={13} />
        <Typography variant="microLabel" color={subColor} style={{ marginLeft: 6 }}>
          {t('musicPicker.music', { defaultValue: 'MUZYKA' })}
        </Typography>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {MUSIC_OPTIONS.map(opt => {
          const active = activeMusic === opt.id && experience.backgroundMusicEnabled;
          return (
            <Pressable
              key={opt.id}
              onPress={() => selectMusic(opt.id)}
              style={[
                styles.chip,
                { backgroundColor: active ? accent + '28' : cardBg, borderColor: active ? accent : accent + '33' },
              ]}
            >
              <Typography variant="label" color={active ? accent : textColor} style={{ fontSize: 12, fontWeight: active ? '700' : '400' }}>
                {opt.label}
              </Typography>
              <Typography variant="microLabel" color={subColor} style={{ fontSize: 10, marginTop: 1 }}>
                {t(`musicPicker.musicOptions.${opt.id}.sublabel`, { defaultValue: opt.sublabel })}
              </Typography>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Ambient row */}
      <View style={[styles.sectionRow, { marginTop: 10 }]}>
        <Wind color={accent} size={13} />
        <Typography variant="microLabel" color={subColor} style={{ marginLeft: 6 }}>
          {t('musicPicker.ambient', { defaultValue: 'AMBIENT' })}
        </Typography>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {AMBIENT_OPTIONS.map(opt => {
          const active = activeAmbient === opt.id && ambientSoundEnabled;
          return (
            <Pressable
              key={opt.id}
              onPress={() => selectAmbient(opt.id)}
              style={[
                styles.chip,
                { backgroundColor: active ? accent + '28' : cardBg, borderColor: active ? accent : accent + '33' },
              ]}
            >
              <Typography variant="label" color={active ? accent : textColor} style={{ fontSize: 12, fontWeight: active ? '700' : '400' }}>
                {t(`musicPicker.ambientOptions.${opt.id}.label`, { defaultValue: opt.label })}
              </Typography>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 68,
  },
});
