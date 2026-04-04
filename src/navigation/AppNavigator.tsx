import React, { useEffect, useRef } from 'react';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { useAuthStore, hydrateUserProfile } from '../store/useAuthStore';
import { AuthService } from '../core/services/auth.service';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { BlurView } from 'expo-blur';
import { AppState, Pressable, StyleSheet, Text, View, Animated as RNAnimated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Compass, Sparkles, Wand2, UserRound, Globe2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

// ─── Static imports — all screens bundled at startup ────────────────────────
// DO NOT use React.lazy() here. Expo Go / Reanimated require all worklets and
// gesture handlers to be registered in the initial bundle. Lazy loading causes
// crashes because native Reanimated runtime isn't ready when a chunk loads.
import { HomeScreen } from '../screens/HomeScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { PortalScreen } from '../screens/PortalScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { OraclePortalScreen } from '../screens/OraclePortalScreen';
import { TarotScreen } from '../screens/TarotScreen';
import { TarotDeckSelectionScreen } from '../screens/TarotDeckSelectionScreen';
import { MatrixScreen } from '../screens/MatrixScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HoroscopeScreen } from '../screens/HoroscopeScreen';
import { ReadingDetailScreen } from '../screens/ReadingDetailScreen';
import { CompatibilityScreen } from '../screens/CompatibilityScreen';
import { ZodiacAtlasScreen } from '../screens/ZodiacAtlasScreen';
import { AffirmationsScreen } from '../screens/AffirmationsScreen';
import { JournalScreen } from '../screens/JournalScreen';
import { JournalEntryScreen } from '../screens/JournalEntryScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { RitualsScreen } from '../screens/RitualsScreen';
import { RitualDetailScreen } from '../screens/RitualDetailScreen';
import { RitualCategorySelectionScreen } from '../screens/RitualCategorySelectionScreen';
import { JourneysScreen } from '../screens/JourneysScreen';
import { DreamsScreen } from '../screens/DreamsScreen';
import { DreamDetailScreen } from '../screens/DreamDetailScreen';
import { PremiumPaywallScreen } from '../screens/PremiumPaywallScreen';
import { MilestoneShareScreen } from '../screens/MilestoneShareScreen';
import { OracleChatScreen } from '../screens/OracleChatScreen';
import { ChineseHoroscopeScreen } from '../screens/ChineseHoroscopeScreen';
import { DailyTarotScreen } from '../screens/DailyTarotScreen';
import { WrozkaScreen } from '../screens/WrozkaScreen';
import { NumerologyScreen } from '../screens/NumerologyScreen';
import { CleansingScreen } from '../screens/CleansingScreen';
import { KnowledgeScreen } from '../screens/KnowledgeScreen';
import { MeditationScreen } from '../screens/MeditationScreen';
import { BreathworkScreen } from '../screens/BreathworkScreen';
import { ChakraScreen } from '../screens/ChakraScreen';
import { ShadowWorkScreen } from '../screens/ShadowWorkScreen';
import { GratitudeScreen } from '../screens/GratitudeScreen';
import { LunarCalendarScreen } from '../screens/LunarCalendarScreen';
import { SoundBathScreen } from '../screens/SoundBathScreen';
import { SocialScreen } from '../screens/SocialScreen';
import { SleepHelperScreen } from '../screens/SleepHelperScreen';
import { CrystalBallScreen } from '../screens/CrystalBallScreen';
import { DowsingRodsScreen } from '../screens/DowsingRodsScreen';
import { PalmReadingScreen } from '../screens/PalmReadingScreen';
import { StarsScreen } from '../screens/StarsScreen';
import { PartnerTarotScreen } from '../screens/PartnerTarotScreen';
import { PartnerHoroscopeScreen } from '../screens/PartnerHoroscopeScreen';
import { PartnerMatrixScreen } from '../screens/PartnerMatrixScreen';
import { GuidancePreferenceScreen } from '../screens/GuidancePreferenceScreen';
import { LanguageSelectionScreen } from '../screens/LanguageSelectionScreen';
import { OnboardingScreen } from '../features/onboarding/screens/OnboardingScreen';
import { IdentitySetupScreen } from '../screens/IdentitySetupScreen';
import { SplashIntroScreen } from '../screens/SplashIntroScreen';
import { DailyRitualAIScreen } from '../screens/DailyRitualAIScreen';
import { EnergyJournalScreen } from '../screens/EnergyJournalScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { YearCardScreen } from '../screens/YearCardScreen';
import { CheckInModalScreen } from '../screens/CheckInModalScreen';
import { DailyCheckInScreen } from '../screens/DailyCheckInScreen';
import { AIDailyAffirmationsScreen } from '../screens/AIDailyAffirmationsScreen';
import { DreamInterpreterScreen } from '../screens/DreamInterpreterScreen';
import { BiorhythmScreen } from '../screens/BiorhythmScreen';
import { BinauralBeatsScreen } from '../screens/BinauralBeatsScreen';
import { WeeklyReportScreen } from '../screens/WeeklyReportScreen';
import { IntentionCardsScreen } from '../screens/IntentionCardsScreen';
import { PartnerJournalScreen } from '../screens/PartnerJournalScreen';
import { AngelNumbersScreen } from '../screens/AngelNumbersScreen';
import { AstrologyCyclesScreen } from '../screens/AstrologyCyclesScreen';
import { RuneCastScreen } from '../screens/RuneCastScreen';
import { HerbalAlchemyScreen } from '../screens/HerbalAlchemyScreen';
import { AuraReadingScreen } from '../screens/AuraReadingScreen';
import { CrystalGridScreen } from '../screens/CrystalGridScreen';
import { IChingScreen } from '../screens/IChingScreen';
import { SoulContractScreen } from '../screens/SoulContractScreen';
import { PersonalMantraScreen } from '../screens/PersonalMantraScreen';
import { TarotJournalScreen } from '../screens/TarotJournalScreen';
import { CosmicWeatherScreen } from '../screens/CosmicWeatherScreen';
import { VedicAstrologyScreen } from '../screens/VedicAstrologyScreen';
import { SpiritAnimalScreen } from '../screens/SpiritAnimalScreen';
import { ColorTherapyScreen } from '../screens/ColorTherapyScreen';
import { DivineTimingScreen } from '../screens/DivineTimingScreen';
import ManifestationScreen from '../screens/ManifestationScreen';
import MoonRitualScreen from '../screens/MoonRitualScreen';
import TarotSpreadBuilderScreen from '../screens/TarotSpreadBuilderScreen';
import { PastLifeScreen } from '../screens/PastLifeScreen';
import AstroTransitsScreen from '../screens/AstroTransitsScreen';
import SacredGeometryScreen from '../screens/SacredGeometryScreen';
import { SpiritualProfileScreen } from '../screens/SpiritualProfileScreen';
import ElementalMagicScreen from '../screens/ElementalMagicScreen';
import { MagicEntryScreen } from '../screens/MagicEntryScreen';
import { EnergyCircleScreen } from '../screens/EnergyCircleScreen';
import { CommunityTarotScreen } from '../screens/CommunityTarotScreen';
import { LiveRitualsScreen } from '../screens/LiveRitualsScreen';
import { SoulMatchScreen } from '../screens/SoulMatchScreen';
import { DreamSymbolsScreen } from '../screens/DreamSymbolsScreen';
import { CommunityAffirmationScreen } from '../screens/CommunityAffirmationScreen';
import { SpiritualChallengesScreen } from '../screens/SpiritualChallengesScreen';
import { IntentionChamberScreen } from '../screens/IntentionChamberScreen';
import { ConsciousnessScreen } from '../screens/ConsciousnessScreen';
import { SoulMentorsScreen } from '../screens/SoulMentorsScreen';
import { CosmicPortalsScreen } from '../screens/CosmicPortalsScreen';
import { CommunityChronicleScreen } from '../screens/CommunityChronicleScreen';
import { GlobalShareScreen } from '../screens/GlobalShareScreen';
import { CommunityChatScreen } from '../screens/CommunityChatScreen';
import { RitualSessionScreen } from '../screens/RitualSessionScreen';
import { LucidDreamingScreen } from '../screens/LucidDreamingScreen';
import { SleepRitualScreen } from '../screens/SleepRitualScreen';
import { FireCeremonyScreen } from '../screens/FireCeremonyScreen';
import { AncestralConnectionScreen } from '../screens/AncestralConnectionScreen';
import { ReleaseLettersScreen } from '../screens/ReleaseLettersScreen';
import { ProtectionRitualScreen } from '../screens/ProtectionRitualScreen';
import { SaltBathScreen } from '../screens/SaltBathScreen';
import { InnerChildScreen } from '../screens/InnerChildScreen';
import { AnxietyReliefScreen } from '../screens/AnxietyReliefScreen';
import { SelfCompassionScreen } from '../screens/SelfCompassionScreen';
import { HealingFrequenciesScreen } from '../screens/HealingFrequenciesScreen';
import { EmotionalAnchorsScreen } from '../screens/EmotionalAnchorsScreen';
import { LifeWheelScreen } from '../screens/LifeWheelScreen';
import { SoulArchetypeScreen } from '../screens/SoulArchetypeScreen';
import { NatalChartScreen } from '../screens/NatalChartScreen';
import { RetrogradesScreen } from '../screens/RetrogradesScreen';
import { SignMeditationScreen } from '../screens/SignMeditationScreen';
import { SanangaScreen } from '../screens/SanangaScreen';
import { RapeScreen } from '../screens/RapeScreen';
import { MantraGeneratorScreen } from '../screens/MantraGeneratorScreen';
import { AnnualForecastScreen } from '../screens/AnnualForecastScreen';
import { VisionBoardScreen } from '../screens/VisionBoardScreen';
import { CrystalGuideScreen } from '../screens/CrystalGuideScreen';
import { MorningRitualScreen } from '../screens/MorningRitualScreen';
import { SpiritualHabitsScreen } from '../screens/SpiritualHabitsScreen';
import { AstroNoteScreen } from '../screens/AstroNoteScreen';
import { NightSymbolatorScreen } from '../screens/NightSymbolatorScreen';
import { NumerologyDetailScreen } from '../screens/NumerologyDetailScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { AudioService } from '../core/services/audio.service';
import { HapticsService } from '../core/services/haptics.service';

// ─── Screen-level crash protection ───────────────────────────────────────────
// Wraps each screen so a single render error never crashes the whole app.

const ScreenErrorFallback = ({ onReset }: { onReset: () => void }) => {
  const nav = useNavigation<any>();
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, backgroundColor: '#06070C', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ color: 'rgba(206,174,114,0.60)', fontSize: 11, letterSpacing: 2, marginBottom: 14 }}>
        {t('common.screenErrorTitle', { defaultValue: 'SCREEN ERROR' })}
      </Text>
      <Text style={{ color: '#F5F1EA', fontSize: 15, textAlign: 'center', lineHeight: 23, marginBottom: 28 }}>
        {t('common.screenErrorBody', { defaultValue: 'This screen hit a problem.\nGo back and try again.' })}
      </Text>
      <Pressable
        onPress={() => { onReset(); try { if (nav.canGoBack()) nav.goBack(); else nav.navigate('Main'); } catch {} }}
        style={{ paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(206,174,114,0.50)', backgroundColor: 'rgba(206,174,114,0.10)' }}
      >
        <Text style={{ color: '#CEAE72', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 }}>
          {`← ${t('common.back', { defaultValue: 'Back' })}`}
        </Text>
      </Pressable>
    </View>
  );
};

class ScreenErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn('[Aethera] Screen crash caught:', error.message);
  }
  reset = () => this.setState({ hasError: false });
  render() {
    if (this.state.hasError) return <ScreenErrorFallback onReset={this.reset} />;
    return this.props.children as React.ReactElement;
  }
}

function ws<T extends React.ComponentType<any>>(Screen: T): T {
  return ((props: any) => (
    <ScreenErrorBoundary>
      <Screen {...props} />
    </ScreenErrorBoundary>
  )) as unknown as T;
}

// Wrap every screen with error boundary
const HomeScreenW = ws(HomeScreen);
const TodayScreenW = ws(TodayScreen);
const PortalScreenW = ws(PortalScreen);
const NotificationsScreenW = ws(NotificationsScreen);
const OraclePortalScreenW = ws(OraclePortalScreen);
const TarotScreenW = ws(TarotScreen);
const TarotDeckSelectionScreenW = ws(TarotDeckSelectionScreen);
const MatrixScreenW = ws(MatrixScreen);
const ProfileScreenW = ws(ProfileScreen);
const HoroscopeScreenW = ws(HoroscopeScreen);
const ReadingDetailScreenW = ws(ReadingDetailScreen);
const CompatibilityScreenW = ws(CompatibilityScreen);
const ZodiacAtlasScreenW = ws(ZodiacAtlasScreen);
const AffirmationsScreenW = ws(AffirmationsScreen);
const JournalScreenW = ws(JournalScreen);
const JournalEntryScreenW = ws(JournalEntryScreen);
const ReportsScreenW = ws(ReportsScreen);
const RitualsScreenW = ws(RitualsScreen);
const RitualDetailScreenW = ws(RitualDetailScreen);
const RitualCategorySelectionScreenW = ws(RitualCategorySelectionScreen);
const JourneysScreenW = ws(JourneysScreen);
const DreamsScreenW = ws(DreamsScreen);
const DreamDetailScreenW = ws(DreamDetailScreen);
const PremiumPaywallScreenW = ws(PremiumPaywallScreen);
const MilestoneShareScreenW = ws(MilestoneShareScreen);
const OracleChatScreenW = ws(OracleChatScreen);
const ChineseHoroscopeScreenW = ws(ChineseHoroscopeScreen);
const DailyTarotScreenW = ws(DailyTarotScreen);
const WrozkaScreenW = ws(WrozkaScreen);
const NumerologyScreenW = ws(NumerologyScreen);
const CleansingScreenW = ws(CleansingScreen);
const KnowledgeScreenW = ws(KnowledgeScreen);
const MeditationScreenW = ws(MeditationScreen);
const BreathworkScreenW = ws(BreathworkScreen);
const MorningRitualScreenW = ws(MorningRitualScreen);
const ChakraScreenW = ws(ChakraScreen);
const ShadowWorkScreenW = ws(ShadowWorkScreen);
const GratitudeScreenW = ws(GratitudeScreen);
const LunarCalendarScreenW = ws(LunarCalendarScreen);
const SoundBathScreenW = ws(SoundBathScreen);
const SocialScreenW = ws(SocialScreen);
const SleepHelperScreenW = ws(SleepHelperScreen);
const CrystalBallScreenW = ws(CrystalBallScreen);
const DowsingRodsScreenW = ws(DowsingRodsScreen);
const PalmReadingScreenW = ws(PalmReadingScreen);
const StarsScreenW = ws(StarsScreen);
const PartnerTarotScreenW = ws(PartnerTarotScreen);
const PartnerHoroscopeScreenW = ws(PartnerHoroscopeScreen);
const PartnerMatrixScreenW = ws(PartnerMatrixScreen);
const GuidancePreferenceScreenW = ws(GuidancePreferenceScreen);
const LanguageSelectionScreenW = ws(LanguageSelectionScreen);
const OnboardingScreenW = ws(OnboardingScreen);
const IdentitySetupScreenW = ws(IdentitySetupScreen);
const SplashIntroScreenW = ws(SplashIntroScreen);
const DailyRitualAIScreenW = ws(DailyRitualAIScreen);
const EnergyJournalScreenW = ws(EnergyJournalScreen);
const AchievementsScreenW = ws(AchievementsScreen);
const YearCardScreenW = ws(YearCardScreen);
const CheckInModalScreenW = ws(CheckInModalScreen);
const AIDailyAffirmationsScreenW = ws(AIDailyAffirmationsScreen);
const DreamInterpreterScreenW = ws(DreamInterpreterScreen);
const BiorhythmScreenW = ws(BiorhythmScreen);
const BinauralBeatsScreenW = ws(BinauralBeatsScreen);
const WeeklyReportScreenW = ws(WeeklyReportScreen);
const IntentionCardsScreenW = ws(IntentionCardsScreen);
const PartnerJournalScreenW = ws(PartnerJournalScreen);
const AngelNumbersScreenW = ws(AngelNumbersScreen);
const AstrologyCyclesScreenW = ws(AstrologyCyclesScreen);
const RuneCastScreenW = ws(RuneCastScreen);
const HerbalAlchemyScreenW = ws(HerbalAlchemyScreen);
const AuraReadingScreenW = ws(AuraReadingScreen);
const CrystalGridScreenW = ws(CrystalGridScreen);
const CrystalGuideScreenW = ws(CrystalGuideScreen);
const IChingScreenW = ws(IChingScreen);
const SoulContractScreenW = ws(SoulContractScreen);
const PersonalMantraScreenW = ws(PersonalMantraScreen);
const TarotJournalScreenW = ws(TarotJournalScreen);
const CosmicWeatherScreenW = ws(CosmicWeatherScreen);
const VedicAstrologyScreenW = ws(VedicAstrologyScreen);
const SpiritAnimalScreenW = ws(SpiritAnimalScreen);
const ColorTherapyScreenW = ws(ColorTherapyScreen);
const DivineTimingScreenW = ws(DivineTimingScreen);
const ManifestationScreenW = ws(ManifestationScreen);
const MoonRitualScreenW = ws(MoonRitualScreen);
const TarotSpreadBuilderScreenW = ws(TarotSpreadBuilderScreen);
const PastLifeScreenW = ws(PastLifeScreen);
const AstroTransitsScreenW = ws(AstroTransitsScreen);
const SacredGeometryScreenW = ws(SacredGeometryScreen);
const SpiritualProfileScreenW = ws(SpiritualProfileScreen);
const ElementalMagicScreenW = ws(ElementalMagicScreen);
const MagicEntryScreenW = ws(MagicEntryScreen);
const EnergyCircleScreenW = ws(EnergyCircleScreen);
const CommunityTarotScreenW = ws(CommunityTarotScreen);
const LiveRitualsScreenW = ws(LiveRitualsScreen);
const SoulMatchScreenW = ws(SoulMatchScreen);
const DreamSymbolsScreenW = ws(DreamSymbolsScreen);
const CommunityAffirmationScreenW = ws(CommunityAffirmationScreen);
const SpiritualChallengesScreenW = ws(SpiritualChallengesScreen);
const IntentionChamberScreenW = ws(IntentionChamberScreen);
const ConsciousnessScreenW = ws(ConsciousnessScreen);
const SoulMentorsScreenW = ws(SoulMentorsScreen);
const CosmicPortalsScreenW = ws(CosmicPortalsScreen);
const CommunityChronicleScreenW = ws(CommunityChronicleScreen);
const GlobalShareScreenW = ws(GlobalShareScreen);
const CommunityChatScreenW = ws(CommunityChatScreen);
const RitualSessionScreenW = ws(RitualSessionScreen);
const LucidDreamingScreenW = ws(LucidDreamingScreen);
const SleepRitualScreenW = ws(SleepRitualScreen);
const FireCeremonyScreenW = ws(FireCeremonyScreen);
const AncestralConnectionScreenW = ws(AncestralConnectionScreen);
const ReleaseLettersScreenW = ws(ReleaseLettersScreen);
const ProtectionRitualScreenW = ws(ProtectionRitualScreen);
const SaltBathScreenW = ws(SaltBathScreen);
const InnerChildScreenW = ws(InnerChildScreen);
const AnxietyReliefScreenW = ws(AnxietyReliefScreen);
const SelfCompassionScreenW = ws(SelfCompassionScreen);
const HealingFrequenciesScreenW = ws(HealingFrequenciesScreen);
const EmotionalAnchorsScreenW = ws(EmotionalAnchorsScreen);
const LifeWheelScreenW = ws(LifeWheelScreen);
const SoulArchetypeScreenW = ws(SoulArchetypeScreen);
const NatalChartScreenW = ws(NatalChartScreen);
const RetrogradesScreenW = ws(RetrogradesScreen);
const SignMeditationScreenW = ws(SignMeditationScreen);
const SanangaScreenW = ws(SanangaScreen);
const RapeScreenW = ws(RapeScreen);
const MantraGeneratorScreenW = ws(MantraGeneratorScreen);
const AnnualForecastScreenW = ws(AnnualForecastScreen);
const VisionBoardScreenW = ws(VisionBoardScreen);
const SpiritualHabitsScreenW = ws(SpiritualHabitsScreen);
const AstroNoteScreenW = ws(AstroNoteScreen);
const NightSymbolatorScreenW = ws(NightSymbolatorScreen);
const NumerologyDetailScreenW = ws(NumerologyDetailScreen);
const WelcomeScreenW = ws(WelcomeScreen);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


const DailyCheckInScreenWrapper = (props: any) => (
  <DailyCheckInScreen
    {...props}
    type="daily"
    onComplete={() => props.navigation.goBack()}
    onSkip={() => props.navigation.goBack()}
  />
);

const WelcomeScreenWrapper = (props: any) => (
  <WelcomeScreenW
    {...props}
    onPrimary={() => {
      try { props.navigation.navigate('Main'); } catch {}
    }}
    onSecondary={() => {
      try { props.navigation.navigate('Onboarding'); } catch {}
    }}
  />
);
// ─── Raised Social Center Button ─────────────────────────────────────────────
const SocialTabButton = ({ children, onPress, accessibilityState, style }: any) => {
  const focused = accessibilityState?.selected;
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;
  const glowAnim = useRef(new RNAnimated.Value(0)).current;
  const { themeName } = useAppStore();
  const { t } = useTranslation();
  const theme = getResolvedTheme(themeName);
  const accent = theme.primary || '#CEAE72';

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        RNAnimated.timing(glowAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePress = () => {
    RNAnimated.sequence([
      RNAnimated.timing(scaleAnim, { toValue: 0.88, duration: 100, useNativeDriver: true }),
      RNAnimated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
    ]).start();
    onPress?.();
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });
  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });

  return (
    <Pressable onPress={handlePress} style={[style, { alignItems: 'center', justifyContent: 'flex-start', flex: 1, paddingTop: 4 }]}>
      <RNAnimated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        {/* Glow ring */}
        <RNAnimated.View pointerEvents="none" style={{
          position: 'absolute', top: -6, width: 56, height: 56, borderRadius: 28,
          backgroundColor: accent, opacity: glowOpacity, transform: [{ scale: glowScale }],
        }} />
        {/* Button body */}
        <LinearGradient
          colors={focused
            ? [accent, accent + 'DD', accent + 'BB']
            : ['#2A1F4A', '#1A1230', '#110C22']}
          style={{
            width: 48, height: 48, borderRadius: 24,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 2,
            borderColor: focused ? accent : accent + '66',
            shadowColor: accent, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: focused ? 0.7 : 0.4, shadowRadius: 14, elevation: 10,
          }}
        >
          <Globe2 color={focused ? '#fff' : accent} size={21} strokeWidth={focused ? 2 : 1.5} />
        </LinearGradient>
        <Text style={{ color: focused ? accent : accent + 'BB', fontSize: 9, fontWeight: '700', marginTop: 3, letterSpacing: 0.2 }}>
          {t('tabs.community', { defaultValue: 'Community' })}
        </Text>
      </RNAnimated.View>
    </Pressable>
  );
};

const MainTabs = () => {
  const { themeName } = useAppStore();
  const insets = useSafeAreaInsets();
  const currentTheme = getResolvedTheme(themeName);
  const { t } = useTranslation();

  const isLight = currentTheme.background.startsWith('#F');
  const inactiveColor = isLight ? 'rgba(80,60,40,0.42)' : 'rgba(255,255,255,0.38)';
  const renderTabLabel = (label: string, focused: boolean, color: string, icon: React.ComponentType<any>) => {
    const Icon = icon;
    return (
      <View style={{ alignItems: 'center', gap: 3, paddingTop: 6 }}>
        <View style={{
          width: 46, height: 26, borderRadius: 13,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: focused ? currentTheme.primary + (isLight ? '1C' : '24') : 'transparent',
          borderWidth: focused ? 1 : 0,
          borderColor: focused ? currentTheme.primary + '40' : 'transparent',
        }}>
          <Icon color={focused ? currentTheme.primary : inactiveColor} size={17} strokeWidth={focused ? 2.2 : 1.5} />
        </View>
        <Text style={{ fontSize: 9, fontWeight: focused ? '700' : '500', color: focused ? currentTheme.primary : inactiveColor, letterSpacing: 0.2 }}>
          {label}
        </Text>
      </View>
    );
  };

  return (
      <Tab.Navigator
        backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        lazy: true,
        freezeOnBlur: true,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          height: 58 + Math.max(insets.bottom, 4),
          elevation: 0,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          overflow: 'visible',
          paddingTop: 4,
          paddingBottom: Math.max(insets.bottom, 4),
          paddingHorizontal: 4,
          shadowColor: '#000',
          shadowOpacity: isLight ? 0.14 : 0.45,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView tint={isLight ? 'light' : 'dark'} intensity={60} style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={isLight
                ? ['rgba(255,255,255,0.88)', 'rgba(252,248,240,0.92)']
                : ['rgba(20,16,30,0.92)', 'rgba(14,10,22,0.96)']}
              style={[StyleSheet.absoluteFillObject, { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderLeftWidth: 0, borderRightWidth: 0, borderBottomWidth: 0, borderColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)' }]}
            />
            {/* Top shimmer line */}
            <LinearGradient
              colors={['transparent', currentTheme.primary + '66', currentTheme.primary + 'AA', currentTheme.primary + '66', 'transparent'] as const}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', top: 0, left: 40, right: 40, height: 1, opacity: 0.90 }}
            />
          </View>
        ),
        tabBarActiveTintColor: currentTheme.primary,
        tabBarInactiveTintColor: isLight ? 'rgba(80,60,40,0.42)' : 'rgba(255,255,255,0.38)',
        tabBarShowLabel: true,
        tabBarItemStyle: { paddingVertical: 0, minHeight: 0, minWidth: 0, flex: 1, justifyContent: 'center', alignItems: 'center' },
        tabBarIconStyle: { display: 'none' },
        sceneStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Tab.Screen name="Portal" component={PortalScreenW}
        options={{ tabBarLabel: ({ focused, color }) => renderTabLabel(t('nav.portal'), focused, color, Sparkles) }} />
      <Tab.Screen name="Worlds" component={HomeScreenW}
        options={{ tabBarLabel: ({ focused, color }) => renderTabLabel(t('tabs.worlds'), focused, color, Compass) }} />
      <Tab.Screen name="Social" component={SocialScreenW}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => <SocialTabButton {...props} />,
        }}
      />
      <Tab.Screen name="Oracle" component={OraclePortalScreenW}
        options={{ tabBarLabel: ({ focused, color }) => renderTabLabel(t('nav.oracle'), focused, color, Wand2) }} />
      <Tab.Screen name="Profile" component={ProfileScreenW}
        options={{ tabBarLabel: ({ focused, color }) => renderTabLabel(t('nav.profile'), focused, color, UserRound) }} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { isOnboarded, setAudioRuntime, setHapticsRuntime } = useAppStore();
  const { isLoggedIn, loading: authLoading, setUser } = useAuthStore();

  // Bootstrap Firebase auth listener
  useEffect(() => {
    const unsub = AuthService.onAuthChanged(async (firebaseUser) => {
      if (firebaseUser) {
        await hydrateUserProfile(firebaseUser.uid);
      } else {
        setUser(null);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsubscribeAudioState = AudioService.subscribeRuntimeStatus((status) => {
      setAudioRuntime(status.state, status.message);
    });
    const unsubscribeHapticsState = HapticsService.subscribeRuntimeStatus((status) => {
      setHapticsRuntime(status.state, status.message);
    });

    const syncAudio = async () => {
      const state = useAppStore.getState();
      await AudioService.init();
      AudioService.setUserInteracted(); // allow auto-play on app launch
      HapticsService.syncEnabledState(state.experience.hapticsEnabled);
      AudioService.applyPreferences({
        ambientEnabled: state.ambientSoundEnabled,
        ambientSoundscape: state.experience.ambientSoundscape,
        backgroundMusicEnabled: state.experience.backgroundMusicEnabled,
        backgroundMusicCategory: state.experience.backgroundMusicCategory,
        touchSoundEnabled: state.experience.touchSoundEnabled,
        hapticsEnabled: state.experience.hapticsEnabled,
        ritualCompletionSoundEnabled: state.experience.ritualCompletionSoundEnabled,
        motionStyle: state.experience.motionStyle,
        musicVolume: state.experience.musicVolume ?? 0.5,
        ambientVolume: state.experience.ambientVolume ?? 0.5,
      });
    };

    void syncAudio();

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      void AudioService.setAppActive(nextState === 'active');
    });

    return () => {
      unsubscribeAudioState();
      unsubscribeHapticsState();
      appStateSubscription.remove();
    };
  }, [setAudioRuntime, setHapticsRuntime]);

  // Auth loading splash
  if (authLoading) {
    return (
      <LinearGradient colors={['#0D0D1A', '#1A0D2E']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#A78BFA', fontSize: 36, fontWeight: '800' }}>✦</Text>
      </LinearGradient>
    );
  }

  // Auth gate — show Login/Register if not logged in
  if (!isLoggedIn) {
    const AuthStack = createNativeStackNavigator();
    return (
      <NavigationContainer>
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer
      onStateChange={async () => {
        // Stop only session-specific audio on screen change; background music persists
        try {
          await AudioService.stopBinauralTone();
          await AudioService.pauseAmbientSound();
          // Restore background music if it should be playing
          const state = useAppStore.getState();
          if (state.experience.backgroundMusicEnabled) {
            void AudioService.playBackgroundMusic();
          }
        } catch {}
      }}
    >
      <Stack.Navigator
        initialRouteName={isOnboarded ? "Main" : "SplashIntro"}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 280,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: false,
          gestureResponseDistance: { start: 16 },
          freezeOnBlur: true,
        }}
      >
        {!isOnboarded ? (
          <Stack.Group screenOptions={{ animation: 'fade' }}>
            <Stack.Screen name="SplashIntro" component={SplashIntroScreenW} options={{ animation: 'fade' }} />
            <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreenW} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="IdentitySetup" component={IdentitySetupScreenW} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="MagicEntry" component={MagicEntryScreenW} options={{ animation: 'fade' }} />
            <Stack.Screen name="Onboarding" component={OnboardingScreenW} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Horoscope" component={HoroscopeScreenW} />
            <Stack.Screen name="Matrix" component={MatrixScreenW} />
            <Stack.Screen name="TarotDeckSelection" component={TarotDeckSelectionScreenW} />
            <Stack.Screen name="Tarot" component={TarotScreenW} options={{ gestureEnabled: true, fullScreenGestureEnabled: true }} />
            <Stack.Screen name="DailyTarot" component={DailyTarotScreenW} />
            <Stack.Screen name="Wrozka" component={WrozkaScreenW} options={{ gestureEnabled: true, fullScreenGestureEnabled: true }} />
            <Stack.Screen name="ReadingDetail" component={ReadingDetailScreenW} />
            <Stack.Screen name="Compatibility" component={CompatibilityScreenW} />
            <Stack.Screen name="ZodiacAtlas" component={ZodiacAtlasScreenW} />
            <Stack.Screen name="DailyRitualAI" component={DailyRitualAIScreenW} />
            <Stack.Screen name="EnergyJournal" component={EnergyJournalScreenW} />
            <Stack.Screen name="Achievements" component={AchievementsScreenW} />
            <Stack.Screen name="YearCard" component={YearCardScreenW} />
            <Stack.Screen name="DailyCheckIn" component={DailyCheckInScreenWrapper} />
            <Stack.Screen name="CheckInModal" component={CheckInModalScreenW} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="AIDailyAffirmations" component={AIDailyAffirmationsScreenW} />
            <Stack.Screen name="DreamInterpreter" component={DreamInterpreterScreenW} />
            <Stack.Screen name="Biorhythm" component={BiorhythmScreenW} />
            <Stack.Screen name="BinauralBeats" component={BinauralBeatsScreenW} />
            <Stack.Screen name="WeeklyReport" component={WeeklyReportScreenW} />
            <Stack.Screen name="IntentionCards" component={IntentionCardsScreenW} />
            <Stack.Screen name="PartnerJournal" component={PartnerJournalScreenW} />
            <Stack.Screen name="Affirmations" component={AffirmationsScreenW} />
            <Stack.Screen name="Journal" component={JournalScreenW} />
            <Stack.Screen name="JournalEntry" component={JournalEntryScreenW} options={{ gestureEnabled: true, fullScreenGestureEnabled: true }} />
            <Stack.Screen name="Reports" component={ReportsScreenW} />
            <Stack.Screen name="RitualCategorySelection" component={RitualCategorySelectionScreenW} />
            <Stack.Screen name="Rituals" component={RitualsScreenW} />
            <Stack.Screen name="RitualDetail" component={RitualDetailScreenW} />
            <Stack.Screen name="Journeys" component={JourneysScreenW} />
            <Stack.Screen name="Dreams" component={DreamsScreenW} />
            <Stack.Screen name="DreamDetail" component={DreamDetailScreenW} />
            <Stack.Screen name="Numerology" component={NumerologyScreenW} />
            <Stack.Screen name="Cleansing" component={CleansingScreenW} />
            <Stack.Screen name="Knowledge" component={KnowledgeScreenW} />
            <Stack.Screen name="Stars" component={StarsScreenW} />
            <Stack.Screen name="PartnerTarot" component={PartnerTarotScreenW} />
            <Stack.Screen name="PartnerHoroscope" component={PartnerHoroscopeScreenW} />
            <Stack.Screen name="PartnerMatrix" component={PartnerMatrixScreenW} />
            <Stack.Screen name="MilestoneShare" component={MilestoneShareScreenW} />
            <Stack.Screen name="Paywall" component={PremiumPaywallScreenW} />
            <Stack.Screen name="OracleChat" component={OracleChatScreenW} options={{ gestureEnabled: true, fullScreenGestureEnabled: true }} />
            <Stack.Screen name="ChineseHoroscope" component={ChineseHoroscopeScreenW} />
            <Stack.Screen name="GuidancePreference" component={GuidancePreferenceScreenW} />
            <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreenW} />
            <Stack.Screen name="IdentitySetup" component={IdentitySetupScreenW} />
            <Stack.Screen name="Meditation" component={MeditationScreenW} />
            <Stack.Screen name="Breathwork" component={BreathworkScreenW} />
            <Stack.Screen name="MorningRitual" component={MorningRitualScreenW} />
            <Stack.Screen name="Chakra" component={ChakraScreenW} />
            <Stack.Screen name="ShadowWork" component={ShadowWorkScreenW} options={{ gestureEnabled: true, fullScreenGestureEnabled: true }} />
            <Stack.Screen name="Gratitude" component={GratitudeScreenW} />
            <Stack.Screen name="LunarCalendar" component={LunarCalendarScreenW} />
            <Stack.Screen name="SoundBath" component={SoundBathScreenW} />
            <Stack.Screen name="Social" component={SocialScreenW} />
            <Stack.Screen name="SleepHelper" component={SleepHelperScreenW} />
            <Stack.Screen name="CrystalBall" component={CrystalBallScreenW} />
            <Stack.Screen name="DowsingRods" component={DowsingRodsScreenW} />
            <Stack.Screen name="PalmReading" component={PalmReadingScreenW} />
            <Stack.Screen name="AngelNumbers" component={AngelNumbersScreenW} />
            <Stack.Screen name="AstrologyCycles" component={AstrologyCyclesScreenW} />
            <Stack.Screen name="RuneCast" component={RuneCastScreenW} />
            <Stack.Screen name="HerbalAlchemy" component={HerbalAlchemyScreenW} />
            <Stack.Screen name="AuraReading" component={AuraReadingScreenW} />
            <Stack.Screen name="CrystalGrid" component={CrystalGridScreenW} />
            <Stack.Screen name="CrystalGuide" component={CrystalGuideScreenW} />
            <Stack.Screen name="IChing" component={IChingScreenW} />
            <Stack.Screen name="SoulContract" component={SoulContractScreenW} />
            <Stack.Screen name="PersonalMantra" component={PersonalMantraScreenW} />
            <Stack.Screen name="TarotJournal" component={TarotJournalScreenW} />
            <Stack.Screen name="CosmicWeather" component={CosmicWeatherScreenW} />
            <Stack.Screen name="VedicAstrology" component={VedicAstrologyScreenW} />
            <Stack.Screen name="SpiritAnimal" component={SpiritAnimalScreenW} />
            <Stack.Screen name="ColorTherapy" component={ColorTherapyScreenW} />
            <Stack.Screen name="DivineTiming" component={DivineTimingScreenW} />
            <Stack.Screen name="Manifestation" component={ManifestationScreenW} />
            <Stack.Screen name="MoonRitual" component={MoonRitualScreenW} />
            <Stack.Screen name="TarotSpreadBuilder" component={TarotSpreadBuilderScreenW} />
            <Stack.Screen name="PastLife" component={PastLifeScreenW} />
            <Stack.Screen name="AstroTransits" component={AstroTransitsScreenW} />
            <Stack.Screen name="SacredGeometry" component={SacredGeometryScreenW} />
            <Stack.Screen name="SpiritualProfile" component={SpiritualProfileScreenW} />
            <Stack.Screen name="ElementalMagic" component={ElementalMagicScreenW} />
            <Stack.Screen name="Today" component={TodayScreenW} />
            <Stack.Screen name="NotificationsDetail" component={NotificationsScreenW} />
            <Stack.Screen name="EnergyCircle" component={EnergyCircleScreenW} />
            <Stack.Screen name="CommunityTarot" component={CommunityTarotScreenW} />
            <Stack.Screen name="LiveRituals" component={LiveRitualsScreenW} />
            <Stack.Screen name="SoulMatch" component={SoulMatchScreenW} />
            <Stack.Screen name="DreamSymbols" component={DreamSymbolsScreenW} />
            <Stack.Screen name="CommunityAffirmation" component={CommunityAffirmationScreenW} />
            <Stack.Screen name="SpiritualChallenges" component={SpiritualChallengesScreenW} />
            <Stack.Screen name="IntentionChamber" component={IntentionChamberScreenW} />
            <Stack.Screen name="Consciousness" component={ConsciousnessScreenW} />
            <Stack.Screen name="SoulMentors" component={SoulMentorsScreenW} />
            <Stack.Screen name="CosmicPortals" component={CosmicPortalsScreenW} />
            <Stack.Screen name="CommunityChronicle" component={CommunityChronicleScreenW} />
            <Stack.Screen name="GlobalShare" component={GlobalShareScreenW} />
            <Stack.Screen name="CommunityChat" component={CommunityChatScreenW} />
            <Stack.Screen name="RitualSession" component={RitualSessionScreenW} />
            <Stack.Screen name="LucidDreaming" component={LucidDreamingScreenW} />
            <Stack.Screen name="SleepRitual" component={SleepRitualScreenW} />
            <Stack.Screen name="FireCeremony" component={FireCeremonyScreenW} />
            <Stack.Screen name="AncestralConnection" component={AncestralConnectionScreenW} />
            <Stack.Screen name="ReleaseLetters" component={ReleaseLettersScreenW} />
            <Stack.Screen name="ProtectionRitual" component={ProtectionRitualScreenW} />
            <Stack.Screen name="SaltBath" component={SaltBathScreenW} />
            <Stack.Screen name="InnerChild" component={InnerChildScreenW} />
            <Stack.Screen name="AnxietyRelief" component={AnxietyReliefScreenW} />
            <Stack.Screen name="SelfCompassion" component={SelfCompassionScreenW} />
            <Stack.Screen name="HealingFrequencies" component={HealingFrequenciesScreenW} />
            <Stack.Screen name="EmotionalAnchors" component={EmotionalAnchorsScreenW} />
            <Stack.Screen name="LifeWheel" component={LifeWheelScreenW} />
            <Stack.Screen name="SoulArchetype" component={SoulArchetypeScreenW} />
            <Stack.Screen name="NatalChart" component={NatalChartScreenW} />
            <Stack.Screen name="Retrogrades" component={RetrogradesScreenW} />
            <Stack.Screen name="SignMeditation" component={SignMeditationScreenW} />
            <Stack.Screen name="Sananga" component={SanangaScreenW} />
            <Stack.Screen name="Rape" component={RapeScreenW} />
            <Stack.Screen name="MantraGenerator" component={MantraGeneratorScreenW} />
            <Stack.Screen name="AnnualForecast" component={AnnualForecastScreenW} />
            <Stack.Screen name="VisionBoard" component={VisionBoardScreenW} />
            <Stack.Screen name="SpiritualHabits" component={SpiritualHabitsScreenW} />
            <Stack.Screen name="AstroNote" component={AstroNoteScreenW} />
            <Stack.Screen name="NightSymbolator" component={NightSymbolatorScreenW} />
            <Stack.Screen name="NumerologyDetail" component={NumerologyDetailScreenW} />
            <Stack.Screen name="Welcome" component={WelcomeScreenWrapper} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabShell: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
  },
  tabLabelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingTop: 4,
    paddingHorizontal: 12,
    paddingBottom: 4,
    borderRadius: 24,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontWeight: '700',
    letterSpacing: 0.35,
  },
  tabIndicator: {
    width: 18,
    height: 2,
    borderRadius: 999,
    marginTop: 0,
    opacity: 0.15,
    backgroundColor: 'transparent',
  },
});
