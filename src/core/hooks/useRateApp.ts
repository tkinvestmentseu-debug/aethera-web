import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { useAppStore } from '../../store/useAppStore';

export function useRateApp() {
  const appOpenCount = useAppStore(s => s.appOpenCount);
  const hasRatedApp = useAppStore(s => s.hasRatedApp);
  const lastRatePromptDate = useAppStore(s => s.lastRatePromptDate);
  const incrementAppOpen = useAppStore(s => s.incrementAppOpen);
  const markAppRated = useAppStore(s => s.markAppRated);
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Increment on every app open
    incrementAppOpen();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasRatedApp || hasTriggered.current) return;

    // Show prompt on 7th, 15th, 30th open
    const triggerCounts = [7, 15, 30];
    if (!triggerCounts.includes(appOpenCount)) return;

    // Don't show if prompted in last 14 days
    if (lastRatePromptDate) {
      const daysSince = (Date.now() - new Date(lastRatePromptDate).getTime()) / 86400000;
      if (daysSince < 14) return;
    }

    hasTriggered.current = true;

    // Show after 3s delay
    const timer = setTimeout(async () => {
      try {
        // Try expo-store-review first (optional peer dependency)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const StoreReview: any = await import('expo-store-review' as any);
        const isAvailable = await StoreReview.isAvailableAsync();
        if (isAvailable) {
          await StoreReview.requestReview();
          markAppRated();
          return;
        }
      } catch (e) {
        // expo-store-review not installed — fall through to custom alert
      }

      // Fallback: custom alert
      Alert.alert(
        '✨ Podoba Ci się Aethera?',
        'Twoja ocena bardzo nam pomaga. Zajmie tylko chwilę!',
        [
          { text: 'Nie teraz', style: 'cancel' },
          { text: 'Przypomnij mi', onPress: () => markAppRated() },
          {
            text: '⭐ Oceń aplikację',
            onPress: () => {
              markAppRated();
              const storeUrl = Platform.OS === 'ios'
                ? 'https://apps.apple.com/app/aethera'
                : 'https://play.google.com/store/apps/details?id=com.aethera.duniAI';
              // Linking.openURL(storeUrl); // uncomment when store URLs are final
              void storeUrl; // prevent unused var warning until Linking is enabled
            },
          },
        ],
      );
    }, 3000);

    return () => clearTimeout(timer);
  }, [appOpenCount, hasRatedApp, lastRatePromptDate, markAppRated]);
}
