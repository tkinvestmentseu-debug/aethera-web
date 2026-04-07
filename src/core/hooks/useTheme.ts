/**
 * useTheme — performance-optimized theme hook
 *
 * Uses Zustand's useShallow selector so screens ONLY re-render when
 * themeName or themeMode actually change — not on every store update.
 *
 * Replaces the verbose boilerplate in every screen:
 *   const { themeName, themeMode } = useAppStore();
 *   const currentTheme = getResolvedTheme(themeName, themeMode);
 *   const isLight = currentTheme.background.startsWith('#F');
 *
 * Usage:
 *   const { currentTheme, isLight } = useTheme();
 *   const { currentTheme, isLight, themeName, themeMode } = useTheme();
 */
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../store/useAppStore';
import { getResolvedTheme, isLightBg } from '../theme/tokens';

export interface ThemeResult {
  currentTheme: ReturnType<typeof getResolvedTheme>;
  isLight: boolean;
  themeName: string;
  themeMode: string;
}

export function useTheme(): ThemeResult {
  const { themeName, themeMode } = useAppStore(
    useShallow((s) => ({ themeName: s.themeName, themeMode: s.themeMode }))
  );
  const currentTheme = getResolvedTheme(themeName, themeMode);
  const isLight = isLightBg(currentTheme.background);
  return { currentTheme, isLight, themeName, themeMode };
}
