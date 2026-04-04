export type MainTabScreen = 'Portal' | 'Today' | 'Worlds' | 'Oracle' | 'Notifications' | 'Profile' | 'Home';
export type DashboardSurface = 'ty' | 'tarot' | 'horoscope' | 'astrology' | 'support' | 'cleansing' | 'rituals';

const normalizeMainTabScreen = (screen: MainTabScreen): Exclude<MainTabScreen, 'Home' | 'Today'> => {
  if (screen === 'Home') return 'Worlds';
  if (screen === 'Today') return 'Portal';
  return screen as Exclude<MainTabScreen, 'Home' | 'Today'>;
};

export const navigateToMainTab = (navigation: any, screen: MainTabScreen, params?: Record<string, unknown>) => {
  navigation.navigate('Main', {
    screen: normalizeMainTabScreen(screen),
    params,
  });
};

export const navigateToDashboardSurface = (
  navigation: any,
  surface: DashboardSurface,
  params?: Record<string, unknown>,
) => {
  navigation.navigate('Main', {
    screen: 'Worlds',
    params: {
      surface,
      ...params,
    },
  });
};

export const goBackOrToMainTab = (navigation: any, screen: MainTabScreen, params?: Record<string, unknown>) => {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  navigateToMainTab(navigation, screen, params);
};
