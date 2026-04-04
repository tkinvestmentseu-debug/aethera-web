// @ts-nocheck
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { DailyCheckInScreen } from './DailyCheckInScreen';
import { useTranslation } from 'react-i18next';

export const CheckInModalScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const type  = route?.params?.type || 'morning';
  const { updateDailyProgress, addGratitudeEntry } = useAppStore();

  const handleComplete = (data: { mood: string; energy: number; note?: string }) => {
    const today = new Date().toISOString().split('T')[0];
    updateDailyProgress(today, {
      mood:        data.mood,
      energyLevel: data.energy,
      ...(type === 'morning'
        ? { checkInShownMorning: true }
        : { checkInShownEvening: true }),
    });
    if (data.note && type === 'morning') {
      addGratitudeEntry?.({
        id:           Math.random().toString(36).substr(2, 9),
        date:         today,
        items:        [data.note],
        aiReflection: undefined,
      });
    }
    navigation.goBack();
  };

  const handleSkip = () => {
    const today = new Date().toISOString().split('T')[0];
    updateDailyProgress(today, {
      ...(type === 'morning'
        ? { checkInShownMorning: true }
        : { checkInShownEvening: true }),
    });
    navigation.goBack();
  };

  return (
    <DailyCheckInScreen
      type={type}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
};