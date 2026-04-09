// src/core/theme/designSystem.ts
import { Dimensions, StyleSheet } from 'react-native';
import { isLightBg } from './tokens';

const { width, height } = Dimensions.get('window');

// 1. Core Dimensions & Grid
export const layout = {
  window: { width, height },
  padding: {
    screen: 22,
    screenWide: 28,
    card: 16,
    cardLarge: 20,
    sectionGap: 28,
    sectionGapLarge: 40,
    itemGap: 14,
    chip: 12,
  },
  radius: {
    s: 12,
    m: 20,
    l: 26,
    xl: 40,
    round: 9999,
  },
  hairline: StyleSheet.hairlineWidth,
};

// 1.2 Responsive helpers
export const isTablet = width >= 600;
export const isLargeTablet = width >= 900;

/** Scale font size proportionally for larger screens */
export const rf = (base: number): number =>
  isLargeTablet ? Math.round(base * 1.25) : isTablet ? Math.round(base * 1.12) : base;

/** Responsive horizontal padding — grows on tablets */
export const rp = (base: number = layout.padding.screen): number =>
  isLargeTablet ? base * 2.2 : isTablet ? base * 1.5 : base;

/** Max content width (centers content on tablets) */
export const maxContentWidth = isLargeTablet ? 720 : isTablet ? 560 : width;

/** Number of grid columns based on screen width */
export const gridColumns = (minItemWidth: number): number =>
  Math.max(1, Math.floor(width / minItemWidth));

// 1.5 Luxury Styling
export const luxury = {
  glass: (theme: any) => ({
    backgroundColor: theme.glassBackground,
    borderColor: theme.glassBorder,
    borderWidth: layout.hairline,
    borderRadius: layout.radius.m,
    shadowColor: isLightBg(theme.background) ? '#7B5C31' : '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: isLightBg(theme.background) ? 0.08 : 0.2,
    shadowRadius: 28,
    elevation: 8,
  }),
  surface: (theme: any) => ({
    backgroundColor: theme.backgroundElevated || theme.surface,
    borderColor: theme.glassBorder,
    borderWidth: layout.hairline,
    borderRadius: layout.radius.m,
  }),
  button: (theme: any) => ({
    backgroundColor: theme.primary,
    borderRadius: layout.radius.round,
    height: 52,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 24,
  }),
  secondaryButton: (theme: any) => ({
    backgroundColor: isLightBg(theme.background) ? 'rgba(37,29,22,0.06)' : 'rgba(255,255,255,0.06)',
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: layout.radius.round,
    height: 48,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 24,
  }),
  input: (theme: any) => ({
    backgroundColor: isLightBg(theme.background)
      ? 'rgba(255,253,247,0.95)'
      : 'rgba(10,14,24,0.94)',
    borderColor: isLightBg(theme.background)
      ? 'rgba(169,122,57,0.32)'
      : theme.primary + '48',
    borderWidth: 1,
    borderRadius: layout.radius.m,
    minHeight: 52,
    paddingHorizontal: 18,
    paddingLeft: 20,
    color: theme.text,
    fontSize: 16,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isLightBg(theme.background) ? 0.08 : 0.18,
    shadowRadius: 12,
    elevation: 4,
  }),
  chip: (theme: any, active = false) => ({
    borderRadius: layout.radius.round,
    borderWidth: 1,
    borderColor: active ? theme.border : theme.glassBorder,
    backgroundColor: active ? theme.primary + (isLightBg(theme.background) ? '16' : '14') : isLightBg(theme.background) ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.04)',
    paddingHorizontal: 13,
    paddingVertical: 9,
  }),
};

export const screenRhythm = {
  topTight: 4,
  topStandard: 6,
  topHero: 8,
  bottomTight: 12,
  bottomStandard: 16,
  bottomWide: 22,
  endCompact: 36,
  endStandard: 80,
  endAiry: 100,
  modalInset: 12,
};

export const screenContracts = {
  bottomInset: (
    safeBottom: number,
    density: 'tight' | 'standard' | 'detail' | 'airy' = 'standard'
  ) => {
    const offset =
      density === 'tight'
        ? screenRhythm.bottomTight
        : density === 'detail'
          ? screenRhythm.bottomStandard + 2
          : density === 'airy'
            ? screenRhythm.bottomWide
            : screenRhythm.bottomStandard;
    return safeBottom + offset;
  },
  keyboardInset: (safeBottom: number, density: 'tight' | 'standard' | 'composer' = 'standard') => {
    const offset = density === 'tight' ? 12 : density === 'composer' ? 6 : 18;
    return safeBottom + offset;
  },
  footerInset: (safeBottom: number) => safeBottom + 4,
};

export const contentSafety = {
  cardPadding: 20,
  denseCardPadding: 20,
  compactMinHeight: 116,
  standardMinHeight: 136,
  roomyMinHeight: 156,
  chipMinHeight: 62,
  roomierChipMinHeight: 74,
};

// 2. Shadows & Glows (Refined Premium Depth)
export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 9,
  },
  hero: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 12,
  }),
  luminous: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 10,
  }),
  glowSubtle: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 5,
  }),
};

// 3. Typographical Hierarchy (Premium Editorial)
// Cinzel — elegant serif for headings/titles
// Raleway — refined sans-serif for body/labels
export const typography = StyleSheet.create({
  heroTitle: {
    fontSize: 32,
    fontFamily: 'Cinzel_700Bold',
    letterSpacing: -0.2,
    lineHeight: 40,
  },
  editorialHeader: {
    fontSize: 28,
    fontFamily: 'Cinzel_600SemiBold',
    letterSpacing: -0.1,
    lineHeight: 36,
  },
  screenTitle: {
    fontSize: 23,
    fontFamily: 'Cinzel_600SemiBold',
    letterSpacing: -0.1,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Cinzel_400Regular',
    letterSpacing: 0,
    lineHeight: 28,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Raleway_600SemiBold',
    letterSpacing: 0.5,
  },
  premiumLabel: {
    fontSize: 11,
    fontFamily: 'Raleway_700Bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  microLabel: {
    fontSize: 10,
    fontFamily: 'Raleway_600SemiBold',
    letterSpacing: 0.8,
    opacity: 0.68,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: 'Cinzel_400Regular',
    letterSpacing: 0,
    lineHeight: 26,
  },
  bodyRefined: {
    fontSize: 16,
    fontFamily: 'Raleway_400Regular',
    lineHeight: 26,
  },
  bodySmall: {
    fontSize: 14,
    fontFamily: 'Raleway_400Regular',
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontFamily: 'Raleway_500Medium',
    letterSpacing: 0.2,
    lineHeight: 20,
    opacity: 0.9,
  }
});
