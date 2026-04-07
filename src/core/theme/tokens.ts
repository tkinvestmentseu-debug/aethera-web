export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDeep: string;
  secondary: string;
  background: string;
  backgroundSoft: string;
  backgroundElevated: string;
  surface: string;
  elevated: string;
  glassBackground: string;
  glassBorder: string;
  border: string;
  borderLight: string;
  text: string;
  textMuted: string;
  textSoft: string;
  glow: string;
  danger: string;
  success: string;
  gradientHero: [string, string, string];
  gradientSurface: [string, string];
  gradientAccent: [string, string];
  tabBarGradient: [string, string];
}

const darkSanctuary: ThemeColors = {
    primary: '#CEAE72',
    primaryLight: '#F5DFC0',
    primaryDeep: '#8B672F',
    secondary: '#8C96D8',
    background: '#06070C',
    backgroundSoft: '#0C111A',
    backgroundElevated: '#141A26',
    surface: '#101621',
    elevated: 'rgba(255, 255, 255, 0.10)',
    glassBackground: 'rgba(15, 21, 33, 0.92)',
    glassBorder: 'rgba(245, 239, 231, 0.22)',
    border: 'rgba(206, 174, 114, 0.30)',
    borderLight: 'rgba(245, 239, 231, 0.18)',
    text: '#F5F1EA',
    textMuted: 'rgba(245,241,234,0.88)',
    textSoft: 'rgba(245,241,234,0.94)',
    glow: 'rgba(206, 174, 114, 0.14)',
    danger: '#D7867C',
    success: '#84C8A0',
    gradientHero: ['#04050A', '#0E1521', '#171E30'],
    gradientSurface: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)'],
    gradientAccent: ['#F1D39A', '#A67B38'],
    tabBarGradient: ['rgba(6,7,12,0.97)', 'rgba(4,5,9,0.94)'],
};

const lightSanctuary: ThemeColors = {
  primary: '#A97A39',
  primaryLight: '#EACB9A',
  primaryDeep: '#65431C',
  secondary: '#7F91CD',
  background: '#EAE1D5',
  backgroundSoft: '#E2D8C9',
  backgroundElevated: '#F5EEE4',
  surface: '#FCF8F2',
  elevated: 'rgba(90, 70, 35, 0.18)',
  glassBackground: 'rgba(255, 255, 255, 0.99)',
  glassBorder: 'rgba(122, 95, 54, 0.45)',
  border: 'rgba(169, 122, 57, 0.40)',
  borderLight: 'rgba(122, 95, 54, 0.25)',
  text: '#1C150E',
  textMuted: 'rgba(28,21,14,0.78)',
  textSoft: 'rgba(28,21,14,0.88)',
  glow: 'rgba(229, 190, 118, 0.22)',
  danger: '#C66961',
  success: '#4E9E7C',
  gradientHero: ['#FFFEFB', '#F8F1E6', '#EEE3D2'],
  gradientSurface: ['rgba(255,255,255,0.94)', 'rgba(255,255,255,0.68)'],
  gradientAccent: ['#E8CD99', '#AF8242'],
  tabBarGradient: ['rgba(252,248,242,0.985)', 'rgba(246,238,226,0.96)'],
};

const goldenRitual: ThemeColors = {
  ...darkSanctuary,
  primary: '#D9B56D',
  primaryLight: '#F4DEB0',
  primaryDeep: '#A1752A',
  secondary: '#B77041',
  background: '#0B0704',
  backgroundSoft: '#150E08',
  backgroundElevated: '#1D140C',
  surface: '#171009',
  glassBackground: 'rgba(29, 20, 12, 0.82)',
  glassBorder: 'rgba(231, 195, 133, 0.22)',
  border: 'rgba(217, 181, 109, 0.36)',
  borderLight: 'rgba(255,255,255,0.16)',
  text: '#F7F0E5',
  textMuted: 'rgba(247,240,229,0.88)',
  textSoft: 'rgba(247,240,229,0.94)',
  glow: 'rgba(217, 181, 109, 0.16)',
  gradientHero: ['#090603', '#130B06', '#24160C'],
  gradientSurface: ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)'],
  gradientAccent: ['#F0D49B', '#B8893F'],
  tabBarGradient: ['rgba(11,7,4,0.97)', 'rgba(8,5,3,0.94)'],
};

const moonMist: ThemeColors = {
  ...darkSanctuary,
  primary: '#B4B8DE',
  primaryLight: '#E5E9FF',
  primaryDeep: '#7A80A7',
  secondary: '#94A3D8',
  background: '#070912',
  backgroundSoft: '#0E1220',
  backgroundElevated: '#141A2B',
  surface: '#111625',
  glassBackground: 'rgba(17, 22, 37, 0.82)',
  glassBorder: 'rgba(213, 220, 255, 0.22)',
  border: 'rgba(180, 184, 222, 0.28)',
  borderLight: 'rgba(255,255,255,0.14)',
  text: '#F2F4FB',
  textMuted: 'rgba(242,244,251,0.88)',
  textSoft: 'rgba(242,244,251,0.94)',
  glow: 'rgba(180, 184, 222, 0.12)',
  gradientHero: ['#06070E', '#101423', '#171C32'],
  gradientSurface: ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)'],
  gradientAccent: ['#D9DDF9', '#8F97C7'],
  tabBarGradient: ['rgba(7,9,18,0.97)', 'rgba(5,6,14,0.94)'],
};

const obsidianCrystal: ThemeColors = {
  ...darkSanctuary,
  primary: '#A78BFA',
  primaryLight: '#C4B5FD',
  primaryDeep: '#7C3AED',
  secondary: '#6D28D9',
  background: '#030208',
  backgroundSoft: '#07051A',
  backgroundElevated: '#0E0A28',
  surface: '#0B0820',
  glassBackground: 'rgba(14,10,40,0.90)',
  glassBorder: 'rgba(167,139,250,0.22)',
  border: 'rgba(167,139,250,0.32)',
  borderLight: 'rgba(196,181,253,0.16)',
  text: '#F0EEFF',
  textMuted: 'rgba(240,238,255,0.88)',
  textSoft: 'rgba(240,238,255,0.94)',
  glow: 'rgba(167,139,250,0.35)',
  gradientHero: ['#030208', '#080320', '#0D0530'],
  gradientSurface: ['rgba(167,139,250,0.10)', 'rgba(167,139,250,0.03)'],
  gradientAccent: ['#C4B5FD', '#7C3AED'],
  tabBarGradient: ['rgba(8,3,32,0.97)', 'rgba(3,2,10,0.99)'],
};

const dawnClarity: ThemeColors = {
  ...lightSanctuary,
  primary: '#9A7440',
  primaryLight: '#E8CFA8',
  primaryDeep: '#684720',
  secondary: '#8EA3D1',
  background: '#EAE1D4',
  backgroundSoft: '#DFD4C4',
  backgroundElevated: '#F5ECE0',
  surface: '#FDFBF8',
  elevated: 'rgba(120, 92, 54, 0.16)',
  glassBackground: 'rgba(255, 255, 255, 0.99)',
  glassBorder: 'rgba(140, 112, 72, 0.40)',
  border: 'rgba(157, 116, 64, 0.42)',
  borderLight: 'rgba(120, 92, 54, 0.26)',
  text: '#18130E',
  textMuted: 'rgba(24,19,14,0.78)',
  textSoft: 'rgba(24,19,14,0.88)',
  glow: 'rgba(231, 201, 141, 0.22)',
  gradientHero: ['#FFFDFC', '#F8F0E5', '#F0E4D2'],
  gradientSurface: ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.62)'],
  gradientAccent: ['#EBCF9A', '#B8894B'],
  tabBarGradient: ['rgba(253,250,244,0.985)', 'rgba(247,242,232,0.96)'],
};

const cosmicViolet: ThemeColors = {
  ...darkSanctuary,
  primary: '#C48CB3',
  primaryLight: '#E9D5FF',
  primaryDeep: '#8C5579',
  secondary: '#6366F1',
  background: '#080212',
  backgroundSoft: '#11081B',
  backgroundElevated: '#1A112A',
  surface: '#130A1E',
  glassBackground: 'rgba(26, 17, 42, 0.72)',
  glassBorder: 'rgba(196,140,179,0.22)',
  border: 'rgba(196, 140, 179, 0.4)',
  borderLight: 'rgba(255, 255, 255, 0.2)',
  text: '#F0EDE8',
  textMuted: 'rgba(240,237,232,0.88)',
  textSoft: 'rgba(240,237,232,0.92)',
  glow: 'rgba(196, 140, 179, 0.12)',
  gradientHero: ['#05020D', '#11081B', '#1E1236'],
  gradientSurface: ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)'],
  gradientAccent: ['#E0B1D1', '#8C5579'],
  tabBarGradient: ['rgba(8,2,18,0.97)', 'rgba(5,1,12,0.94)'],
};

const crimsonSoul: ThemeColors = {
  ...darkSanctuary,
  primary: '#F06292',
  primaryLight: '#FCB9D2',
  primaryDeep: '#B5365F',
  secondary: '#FF4081',
  background: '#0A0004',
  backgroundSoft: '#12000A',
  backgroundElevated: '#1E0012',
  surface: '#160009',
  glassBackground: 'rgba(30, 0, 18, 0.85)',
  glassBorder: 'rgba(240, 98, 146, 0.22)',
  border: 'rgba(240, 98, 146, 0.35)',
  borderLight: 'rgba(255,200,220,0.16)',
  text: '#FDF0F5',
  textMuted: 'rgba(253,240,245,0.88)',
  textSoft: 'rgba(253,240,245,0.94)',
  glow: 'rgba(240, 98, 146, 0.16)',
  danger: '#FF6B9B',
  success: '#7EDBB0',
  gradientHero: ['#060002', '#0E0007', '#1A000F'],
  gradientSurface: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'],
  gradientAccent: ['#FFB3CB', '#C7385C'],
  tabBarGradient: ['rgba(10,0,4,0.97)', 'rgba(7,0,3,0.94)'],
};

const forestDepth: ThemeColors = {
  ...darkSanctuary,
  primary: '#4ADE80',
  primaryLight: '#A7F3C0',
  primaryDeep: '#15803D',
  secondary: '#22C55E',
  background: '#000E05',
  backgroundSoft: '#001308',
  backgroundElevated: '#001C0B',
  surface: '#00180A',
  glassBackground: 'rgba(0, 28, 11, 0.85)',
  glassBorder: 'rgba(74, 222, 128, 0.22)',
  border: 'rgba(74, 222, 128, 0.32)',
  borderLight: 'rgba(160,255,190,0.14)',
  text: '#F0FFF4',
  textMuted: 'rgba(240,255,244,0.88)',
  textSoft: 'rgba(240,255,244,0.94)',
  glow: 'rgba(74, 222, 128, 0.14)',
  danger: '#FF8A80',
  success: '#34D399',
  gradientHero: ['#000802', '#001005', '#001A09'],
  gradientSurface: ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)'],
  gradientAccent: ['#86EFB0', '#1A8040'],
  tabBarGradient: ['rgba(0,14,5,0.97)', 'rgba(0,9,3,0.94)'],
};

const oceanDream: ThemeColors = {
  ...darkSanctuary,
  primary: '#22D3EE',
  primaryLight: '#A5F3FC',
  primaryDeep: '#0E7490',
  secondary: '#06B6D4',
  background: '#000C14',
  backgroundSoft: '#001020',
  backgroundElevated: '#00162A',
  surface: '#001220',
  glassBackground: 'rgba(0, 22, 42, 0.85)',
  glassBorder: 'rgba(34, 211, 238, 0.22)',
  border: 'rgba(34, 211, 238, 0.32)',
  borderLight: 'rgba(140,240,255,0.14)',
  text: '#F0FFFE',
  textMuted: 'rgba(240,255,254,0.88)',
  textSoft: 'rgba(240,255,254,0.94)',
  glow: 'rgba(34, 211, 238, 0.14)',
  danger: '#FF8A80',
  success: '#34D399',
  gradientHero: ['#000609', '#000E14', '#00161E'],
  gradientSurface: ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)'],
  gradientAccent: ['#67E8F9', '#0E7490'],
  tabBarGradient: ['rgba(0,12,20,0.97)', 'rgba(0,8,16,0.94)'],
};

// ── New theme: Sunrise Sanctum ──────────────────────────────────
const sunriseSanctum: ThemeColors = {
  ...darkSanctuary,
  primary: '#F59E0B',
  primaryLight: '#FCD34D',
  primaryDeep: '#B45309',
  secondary: '#F97316',
  background: '#0B0800',
  backgroundSoft: '#140E02',
  backgroundElevated: '#1E1504',
  surface: '#180F02',
  glassBackground: 'rgba(30, 21, 4, 0.88)',
  glassBorder: 'rgba(245, 158, 11, 0.22)',
  border: 'rgba(245, 158, 11, 0.34)',
  borderLight: 'rgba(255, 220, 100, 0.14)',
  text: '#FFF8ED',
  textMuted: 'rgba(255,248,237,0.88)',
  textSoft: 'rgba(255,248,237,0.94)',
  glow: 'rgba(245, 158, 11, 0.18)',
  gradientHero: ['#080500', '#100B01', '#1E1504'],
  gradientSurface: ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)'],
  gradientAccent: ['#FCD34D', '#B45309'],
  tabBarGradient: ['rgba(11,8,0,0.97)', 'rgba(8,6,0,0.94)'],
};

// ── Helper: create light variant of any dark theme ──────────────
function makeLightTheme(dark: ThemeColors, bg: string, bgSoft: string, bgEl: string, surf: string, textDark: string, textMutedDark: string, textSoftDark: string, tabBar: [string, string]): ThemeColors {
  return {
    ...dark,
    background: bg,
    backgroundSoft: bgSoft,
    backgroundElevated: bgEl,
    surface: surf,
    elevated: 'rgba(50,40,20,0.18)',
    glassBackground: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(0,0,0,0.16)',
    border: 'rgba(0,0,0,0.14)',
    borderLight: 'rgba(0,0,0,0.08)',
    text: textDark,
    textMuted: textMutedDark,
    textSoft: textSoftDark,
    gradientHero: [bgEl, bgSoft, bg],
    gradientSurface: ['rgba(255,255,255,1.0)', 'rgba(255,255,255,0.80)'],
    tabBarGradient: tabBar,
  };
}

const goldenRitualLight = makeLightTheme(goldenRitual, '#EAE1D4', '#DFD4C4', '#F4EBDC', '#FFFDF9', '#1A1005', 'rgba(26,16,5,0.88)', 'rgba(26,16,5,0.92)', ['rgba(248,242,232,0.985)', 'rgba(238,230,214,0.96)']);
const moonMistLight     = makeLightTheme(moonMist,     '#E8E9F2', '#DEE1ED', '#F2F3FA', '#FDFFFF', '#0D0E1A', 'rgba(13,14,26,0.88)', 'rgba(13,14,26,0.92)', ['rgba(238,240,248,0.985)', 'rgba(230,233,243,0.96)']);
const obsidianLight     = makeLightTheme(obsidianCrystal, '#EBE8FB', '#E0DBF5', '#F5F3FF', '#FEFEFF', '#0C0820', 'rgba(12,8,32,0.88)', 'rgba(12,8,32,0.92)', ['rgba(240,237,253,0.985)', 'rgba(232,228,250,0.96)']);
const cosmicVioletLight = makeLightTheme(cosmicViolet, '#EDE7F7', '#E2D9F0', '#F6F2FC', '#FEFCFF', '#110820', 'rgba(17,8,32,0.88)', 'rgba(17,8,32,0.92)', ['rgba(244,239,252,0.985)', 'rgba(236,229,248,0.96)']);
const crimsonSoulLight  = makeLightTheme(crimsonSoul,  '#F7E6EB', '#EED8DF', '#FBF1F5', '#FFFBFD', '#200010', 'rgba(32,0,16,0.88)', 'rgba(32,0,16,0.92)', ['rgba(252,240,245,0.985)', 'rgba(245,230,237,0.96)']);
const forestDepthLight  = makeLightTheme(forestDepth,  '#E6F5EA', '#DAEEDF', '#F2FCF5', '#FDFEFD', '#001A08', 'rgba(0,26,8,0.88)', 'rgba(0,26,8,0.92)', ['rgba(235,250,240,0.985)', 'rgba(224,244,231,0.96)']);
const oceanDreamLight   = makeLightTheme(oceanDream,   '#E5F6F6', '#D8EFF0', '#F0FBFB', '#FCFFFE', '#001414', 'rgba(0,20,20,0.88)', 'rgba(0,20,20,0.92)', ['rgba(234,248,248,0.985)', 'rgba(222,242,244,0.96)']);
const sunriseLight      = makeLightTheme(sunriseSanctum, '#EFE4D2', '#E6D7C2', '#F8EFDF', '#FFFDF9', '#1A0E00', 'rgba(26,14,0,0.88)', 'rgba(26,14,0,0.92)', ['rgba(248,240,226,0.985)', 'rgba(242,230,210,0.96)']);

// ── Theme mode: 'dark' | 'light' | 'auto' ───────────────────────
export type ThemeMode = 'dark' | 'light' | 'auto';

const lightThemeMap: Record<string, ThemeColors> = {
  goldenRitual: goldenRitualLight,
  moonMist: moonMistLight,
  obsidianCrystal: obsidianLight,
  cosmicViolet: cosmicVioletLight,
  crimsonSoul: crimsonSoulLight,
  forestDepth: forestDepthLight,
  oceanDream: oceanDreamLight,
  sunriseSanctum: sunriseLight,
  dawnClarity,   // already light
  light: lightSanctuary,
  dark: lightSanctuary,
  auto: dawnClarity,
};

const resolveAutoTheme = () => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 20 ? dawnClarity : nightSanctuary();
};

const nightSanctuary = () => darkSanctuary;

// Module-level active mode — synced from App.tsx via setActiveThemeMode()
// This allows all existing getResolvedTheme(themeName) calls to automatically
// respect the user's light/dark/auto preference without touching each call site.
let _activeThemeMode: ThemeMode = 'dark';
export const setActiveThemeMode = (mode: ThemeMode) => { _activeThemeMode = mode; };

export const getResolvedTheme = (themeName: string, themeMode?: ThemeMode, at: Date = new Date()): ThemeColors => {
  const mode = themeMode ?? _activeThemeMode;

  if (themeName === 'auto') {
    const hour = at.getHours();
    if (mode === 'auto') return hour >= 6 && hour < 20 ? dawnClarity : nightSanctuary();
    if (mode === 'light') return dawnClarity;
    return nightSanctuary();
  }

  const effectiveLight = mode === 'light' || (mode === 'auto' && at.getHours() >= 6 && at.getHours() < 20);
  if (effectiveLight) {
    return lightThemeMap[themeName] || lightSanctuary;
  }

  return themes[themeName] || darkSanctuary;
};

export const themes: Record<string, ThemeColors> = {
  auto: { ...resolveAutoTheme() },
  light: lightSanctuary,
  dark: darkSanctuary,
  goldenRitual,
  moonMist,
  obsidianCrystal,
  dawnClarity,
  cosmicViolet,
  crimsonSoul,
  forestDepth,
  oceanDream,
  sunriseSanctum,
};

export const syncAutoThemePalette = () => {
  Object.assign(themes.auto, resolveAutoTheme());
  return themes.auto;
};

export type ThemeName = keyof typeof themes;

// Spacing and radius structures
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// Shadow styles
/**
 * isLightBg — perceived luminance check (ITU-R BT.601).
 * Replaces the broken `background.startsWith('#F')` pattern which missed
 * light themes whose backgrounds start with '#E' (e.g. #EAE1D5, #EDE7F7).
 */
export function isLightBg(hex: string): boolean {
  if (!hex || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

export const shadow = {
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
};
