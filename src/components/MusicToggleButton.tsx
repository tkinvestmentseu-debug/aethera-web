// @ts-nocheck
import React from 'react';
import { Pressable } from 'react-native';
import { Volume2, VolumeX } from 'lucide-react-native';
import { AudioService } from '../core/services/audio.service';
import { getResolvedTheme } from '../core/theme/tokens';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../core/hooks/useTheme';
export const MusicToggleButton = ({ color = '#A78BFA', size = 20 }: { color?: string; size?: number }) => {
  const enabled = useAppStore(s => s.experience?.backgroundMusicEnabled ?? true);
  const setExperience = useAppStore(s => s.setExperience);
  const { isLight } = useTheme();
  const toggle = () => {
    const next = !enabled;
    setExperience({ backgroundMusicEnabled: next });
    AudioService.setMusicEnabled(next);
  };

  return (
    <Pressable
      onPress={toggle}
      hitSlop={12}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isLight ? 'rgba(255,250,242,0.96)' : 'rgba(255,255,255,0.07)',
        borderWidth: isLight ? 1 : 0,
        borderColor: isLight ? 'rgba(122,95,54,0.22)' : 'transparent',
      }}
    >
      {enabled
        ? <Volume2 color={color} size={size} strokeWidth={1.8} />
        : <VolumeX color={color} size={size} strokeWidth={1.8} />
      }
    </Pressable>
  );
};
