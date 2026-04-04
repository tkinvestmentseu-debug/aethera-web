import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { AudioService } from '../services/audio.service';

/**
 * Automatycznie zatrzymuje ambient sound i binaural tone gdy ekran traci fokus.
 * Dodaj do kazdego ekranu z odtwarzaniem audio.
 */
export const useAudioCleanup = (): void => {
  useFocusEffect(
    useCallback(() => {
      return () => {
        void AudioService.pauseAmbientSound();
        void AudioService.stopBinauralTone();
      };
    }, [])
  );
};