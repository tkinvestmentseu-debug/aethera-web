import './src/core/patchNativeText';
import './src/core/patchNativeTextInput';
import './src/core/patchNativeAlert';
// patchReactCreateElement removed — it hooked React.createElement globally and ran
// recursive string translation on EVERY prop of EVERY component render (thousands/sec).
// Screens use explicit useTranslation() instead.
import React, { useEffect, useRef, useState } from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SplashIntroScreen } from './src/screens/SplashIntroScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AppState, Text, View } from 'react-native';
import './src/core/i18n';
import i18n from './src/core/i18n';
import { I18nextProvider } from 'react-i18next';
import { useAppStore } from './src/store/useAppStore';
import { getResolvedTheme, syncAutoThemePalette, setActiveThemeMode, isLightBg } from './src/core/theme/tokens';
import { isFullySupportedLanguage } from './src/core/i18n/languageOptions';
import { AudioService } from './src/core/services/audio.service';
import { AiService } from './src/core/services/ai.service';
import { TTSService } from './src/core/services/tts.service';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unknown root error' };
  }

  componentDidCatch(error: Error) {
    console.error('[Aethera] Root crash:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#120c0a', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#ceae72', fontSize: 14, fontWeight: '700', marginBottom: 12 }}>Aethera Root Error</Text>
          <Text style={{ color: '#f5f1ea', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>{this.state.message}</Text>
        </View>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

export default function App() {
  const themeName = useAppStore((state) => state.themeName);
  const themeMode = useAppStore((state) => state.themeMode);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const ambientSoundEnabled = useAppStore((state) => state.ambientSoundEnabled);
  const experience = useAppStore((state) => state.experience);
  const isOnboarded = useAppStore((state) => state.isOnboarded);
  const [splashVisible, setSplashVisible] = useState(true);
  const hasBootstrappedRef = useRef(false);
  const [, setThemeRefresh] = useState(0);
  const resolvedTheme = getResolvedTheme(themeName);
  const statusStyle = isLightBg(resolvedTheme.background) ? 'dark' : 'light';

  // setActiveThemeMode is now called synchronously inside setThemeMode store action.
  // This effect is kept as a safety backup for app-startup hydration.
  useEffect(() => {
    setActiveThemeMode(themeMode);
  }, [themeMode]);

  // Auto-theme timer: fires when time crosses 06:00 or 20:00.
  // Depends on themeMode (not themeName) — was the original bug.
  useEffect(() => {
    if (themeMode !== 'auto') return;
    syncAutoThemePalette();
    setThemeRefresh((v) => v + 1);
    const now = new Date();
    const next = new Date(now);
    const h = now.getHours();
    if (h < 6) next.setHours(6, 0, 0, 0);
    else if (h < 20) next.setHours(20, 0, 0, 0);
    else { next.setDate(next.getDate() + 1); next.setHours(6, 0, 0, 0); }
    const tid = setTimeout(() => { syncAutoThemePalette(); setThemeRefresh((v) => v + 1); }, Math.max(next.getTime() - now.getTime(), 1000));
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') { syncAutoThemePalette(); setThemeRefresh((v) => v + 1); } });
    return () => { sub.remove(); clearTimeout(tid); };
  }, [themeMode]);

  useEffect(() => {
    if (!isFullySupportedLanguage(language)) {
      setLanguage('pl');
    } else {
      // Sync i18n with persisted language on app start
      if (i18n.language !== language) {
        i18n.changeLanguage(language);
      }
    }
  }, [language, setLanguage]);

  useEffect(() => {
    AudioService.applyPreferences({
      ambientEnabled: ambientSoundEnabled,
      ambientSoundscape: experience.ambientSoundscape,
      backgroundMusicEnabled: experience.backgroundMusicEnabled,
      backgroundMusicCategory: experience.backgroundMusicCategory,
      touchSoundEnabled: experience.touchSoundEnabled,
      hapticsEnabled: experience.hapticsEnabled,
      ritualCompletionSoundEnabled: experience.ritualCompletionSoundEnabled,
      motionStyle: experience.motionStyle,
    });
    TTSService.setVoice(experience.narratorVoice ?? 'nova');
  }, [ambientSoundEnabled, experience]);

  useEffect(() => {
    if (hasBootstrappedRef.current) return;
    hasBootstrappedRef.current = true;

    void (async () => {
      AiService.resetProviderResolution();
      void AiService.probeLaunchAvailability(true);
      await AudioService.init();
      AudioService.setUserInteracted();
      await AudioService.primeSessionAudio(
        experience.backgroundMusicCategory,
        experience.ambientSoundscape,
        ['deepMeditation', 'celestial', 'relaxing', 'nature'],
      );
      await AudioService.preloadBootAudio();
    })();
  }, [experience.ambientSoundscape, experience.backgroundMusicCategory]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={i18n}>
        <SafeAreaProvider>
          <RootErrorBoundary>
            <StatusBar style={statusStyle} translucent backgroundColor="transparent" />
            {splashVisible
              ? <SplashIntroScreen onDone={() => setSplashVisible(false)} />
              : <AppNavigator />
            }
          </RootErrorBoundary>
        </SafeAreaProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}
