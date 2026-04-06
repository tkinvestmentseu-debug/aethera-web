import React, { useEffect, useRef } from 'react';
import { useAuthStore, hydrateUserProfile } from '../store/useAuthStore';
import { AuthService } from '../core/services/auth.service';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { BlurView } from 'expo-blur';
import { AppState, Pressable, StyleSheet, Text, View, Animated as RNAnimated, InteractionManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Compass, Sparkles, Wand2, UserRound, Globe2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
// ─── Static imports — all screens bundled at startup ────────────────────────
// DO NOT use React.lazy() here. Expo Go / Reanimated require all worklets and
// gesture handlers to be registered in the initial bundle. Lazy loading causes
// crashes because native Reanimated runtime isn't ready when a chunk loads.
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { DailyCheckInScreen } from '../screens/DailyCheckInScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { PortalScreen } from '../screens/PortalScreen';
import { OraclePortalScreen } from '../screens/OraclePortalScreen';
import { SocialScreen } from '../screens/SocialScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const WelcomeScreenW = ws(WelcomeScreen);
const DailyCheckInScreenW = ws(DailyCheckInScreen);

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

// ─── Beautiful App Loading Screen ─────────────────────────────────────────────
// Shown while Firebase verifies the session. NavigationContainer stays mounted
// the whole time — only the registered screen list changes, which prevents the
// navigator from remounting and breaking in-flight animations.
const AppLoadingScreen = () => {
  const pulseAnim = useRef(new RNAnimated.Value(0)).current;
  const fadeAnim  = useRef(new RNAnimated.Value(0)).current;
  const ringAnim  = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }).start();
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
    RNAnimated.loop(
      RNAnimated.timing(ringAnim, { toValue: 1, duration: 3200, useNativeDriver: true })
    ).start();
  }, []);

  const starScale   = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.14] });
  const starOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1.0] });
  const glowOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.0, 0.18] });
  const ringRotate  = ringAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ringRotate2 = ringAnim.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  return (
    <View style={{ flex: 1, backgroundColor: '#06070C', alignItems: 'center', justifyContent: 'center' }}>
      {/* Ambient glow halo */}
      <RNAnimated.View style={{
        position: 'absolute', width: 220, height: 220, borderRadius: 110,
        backgroundColor: '#CEAE72', opacity: glowOpacity,
        transform: [{ scale: starScale }],
      }} />
      {/* Outer rotating ring */}
      <RNAnimated.View style={{
        position: 'absolute', width: 160, height: 160, borderRadius: 80,
        borderWidth: 1, borderColor: 'rgba(206,174,114,0.28)',
        transform: [{ rotate: ringRotate }],
      }}>
        <View style={{ position: 'absolute', top: -3, left: 78, width: 6, height: 6, borderRadius: 3, backgroundColor: '#CEAE72', opacity: 0.9 }} />
        <View style={{ position: 'absolute', bottom: -3, right: 78, width: 4, height: 4, borderRadius: 2, backgroundColor: '#CEAE72', opacity: 0.5 }} />
      </RNAnimated.View>
      {/* Inner counter-rotating ring */}
      <RNAnimated.View style={{
        position: 'absolute', width: 110, height: 110, borderRadius: 55,
        borderWidth: 1, borderColor: 'rgba(206,174,114,0.18)',
        borderStyle: 'dashed',
        transform: [{ rotate: ringRotate2 }],
      }} />
      {/* Central ✦ symbol */}
      <RNAnimated.Text style={{
        fontSize: 68,
        color: '#CEAE72',
        opacity: starOpacity,
        transform: [{ scale: starScale }],
        textShadowColor: 'rgba(206,174,114,0.7)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 28,
      }}>✦</RNAnimated.Text>
      {/* App name */}
      <RNAnimated.Text style={{
        color: 'rgba(206,174,114,0.80)',
        fontSize: 14, letterSpacing: 6, marginTop: 24, fontWeight: '300',
        opacity: fadeAnim,
      }}>AETHERA</RNAnimated.Text>
      <RNAnimated.Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          color: 'rgba(206,174,114,0.42)',
          fontSize: 10, letterSpacing: 2, marginTop: 5, fontWeight: '300',
          opacity: fadeAnim,
        }}
      >DuniAI & Oracle</RNAnimated.Text>
    </View>
  );
};
// ─── Raised Social Center Button ─────────────────────────────────────────────
const SocialTabButton = ({ children, onPress, accessibilityState, style }: any) => {
  const focused = accessibilityState?.selected;
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;
  const glowAnim = useRef(new RNAnimated.Value(0)).current;
  const { t } = useTranslation();
  const { currentTheme: theme, isLight } = useTheme();
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
            ? [accent, '#C084FC', accent + 'BB']
            : isLight ? ['rgba(240,230,220,0.95)', 'rgba(255,248,235,0.98)', 'rgba(235,225,210,0.92)'] : ['#2A1F4A', '#1A1230', '#110C22']}
          style={{
            width: 48, height: 48, borderRadius: 24,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 2,
            borderColor: focused ? accent : isLight ? accent + '55' : '#7C3AED55',
            shadowColor: accent, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: focused ? 0.7 : 0.4, shadowRadius: 14, elevation: 10,
          }}
        >
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Globe2 color={focused ? (isLight ? '#fff' : '#fff') : accent} size={18} strokeWidth={focused ? 2 : 1.5} />
            <View style={{
              position: 'absolute',
              bottom: -3, right: -3,
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: '#F472B6',
              borderWidth: 1.5, borderColor: focused ? (isLight ? accent : '#fff') : (isLight ? 'rgba(180,160,130,0.6)' : '#1A1230'),
            }} />
          </View>
        </LinearGradient>
        <Text style={{ color: focused ? accent : accent + 'BB', fontSize: 9, fontWeight: '700', marginTop: 3, letterSpacing: 0.2 }}>
          {'Wspólnota'}
        </Text>
      </RNAnimated.View>
    </Pressable>
  );
};


// --- Stable lazy screen getters ---
const lazy_PortalScreen_0 = () => ws(require('../screens/PortalScreen').PortalScreen);
const lazy_HomeScreen_1 = () => ws(require('../screens/HomeScreen').HomeScreen);
const lazy_SocialScreen_2 = () => ws(require('../screens/SocialScreen').SocialScreen);
const lazy_OraclePortalScreen_3 = () => ws(require('../screens/OraclePortalScreen').OraclePortalScreen);
const lazy_ProfileScreen_4 = () => ws(require('../screens/ProfileScreen').ProfileScreen);
const lazy_LanguageSelectionScreen_5 = () => require('../screens/LanguageSelectionScreen').LanguageSelectionScreen;
const lazy_LoginScreen_6 = () => require('../screens/auth/LoginScreen').LoginScreen;
const lazy_RegisterScreen_7 = () => require('../screens/auth/RegisterScreen').RegisterScreen;
const lazy_LanguageSelectionScreen_8 = () => ws(require('../screens/LanguageSelectionScreen').LanguageSelectionScreen);
const lazy_IdentitySetupScreen_9 = () => ws(require('../screens/IdentitySetupScreen').IdentitySetupScreen);
const lazy_MagicEntryScreen_10 = () => ws(require('../screens/MagicEntryScreen').MagicEntryScreen);
const lazy_OnboardingScreen_11 = () => ws(require('../features/onboarding/screens/OnboardingScreen').OnboardingScreen);
const lazy_SplashIntroScreen_12 = () => ws(require('../screens/SplashIntroScreen').SplashIntroScreen);
const lazy_HoroscopeScreen_13 = () => ws(require('../screens/HoroscopeScreen').HoroscopeScreen);
const lazy_MatrixScreen_14 = () => ws(require('../screens/MatrixScreen').MatrixScreen);
const lazy_TarotDeckSelectionScreen_15 = () => ws(require('../screens/TarotDeckSelectionScreen').TarotDeckSelectionScreen);
const lazy_TarotScreen_16 = () => ws(require('../screens/TarotScreen').TarotScreen);
const lazy_DailyTarotScreen_17 = () => ws(require('../screens/DailyTarotScreen').DailyTarotScreen);
const lazy_WrozkaScreen_18 = () => ws(require('../screens/WrozkaScreen').WrozkaScreen);
const lazy_ReadingDetailScreen_19 = () => ws(require('../screens/ReadingDetailScreen').ReadingDetailScreen);
const lazy_CompatibilityScreen_20 = () => ws(require('../screens/CompatibilityScreen').CompatibilityScreen);
const lazy_ZodiacAtlasScreen_21 = () => ws(require('../screens/ZodiacAtlasScreen').ZodiacAtlasScreen);
const lazy_DailyRitualAIScreen_22 = () => ws(require('../screens/DailyRitualAIScreen').DailyRitualAIScreen);
const lazy_EnergyJournalScreen_23 = () => ws(require('../screens/EnergyJournalScreen').EnergyJournalScreen);
const lazy_AchievementsScreen_24 = () => ws(require('../screens/AchievementsScreen').AchievementsScreen);
const lazy_YearCardScreen_25 = () => ws(require('../screens/YearCardScreen').YearCardScreen);
const lazy_CheckInModalScreen_26 = () => ws(require('../screens/CheckInModalScreen').CheckInModalScreen);
const lazy_AIDailyAffirmationsScreen_27 = () => ws(require('../screens/AIDailyAffirmationsScreen').AIDailyAffirmationsScreen);
const lazy_DreamInterpreterScreen_28 = () => ws(require('../screens/DreamInterpreterScreen').DreamInterpreterScreen);
const lazy_BiorhythmScreen_29 = () => ws(require('../screens/BiorhythmScreen').BiorhythmScreen);
const lazy_BinauralBeatsScreen_30 = () => ws(require('../screens/BinauralBeatsScreen').BinauralBeatsScreen);
const lazy_WeeklyReportScreen_31 = () => ws(require('../screens/WeeklyReportScreen').WeeklyReportScreen);
const lazy_IntentionCardsScreen_32 = () => ws(require('../screens/IntentionCardsScreen').IntentionCardsScreen);
const lazy_PartnerJournalScreen_33 = () => ws(require('../screens/PartnerJournalScreen').PartnerJournalScreen);
const lazy_AffirmationsScreen_34 = () => ws(require('../screens/AffirmationsScreen').AffirmationsScreen);
const lazy_JournalScreen_35 = () => ws(require('../screens/JournalScreen').JournalScreen);
const lazy_JournalEntryScreen_36 = () => ws(require('../screens/JournalEntryScreen').JournalEntryScreen);
const lazy_ReportsScreen_37 = () => ws(require('../screens/ReportsScreen').ReportsScreen);
const lazy_RitualCategorySelectionScreen_38 = () => ws(require('../screens/RitualCategorySelectionScreen').RitualCategorySelectionScreen);
const lazy_RitualsScreen_39 = () => ws(require('../screens/RitualsScreen').RitualsScreen);
const lazy_RitualDetailScreen_40 = () => ws(require('../screens/RitualDetailScreen').RitualDetailScreen);
const lazy_JourneysScreen_41 = () => ws(require('../screens/JourneysScreen').JourneysScreen);
const lazy_DreamsScreen_42 = () => ws(require('../screens/DreamsScreen').DreamsScreen);
const lazy_DreamDetailScreen_43 = () => ws(require('../screens/DreamDetailScreen').DreamDetailScreen);
const lazy_NumerologyScreen_44 = () => ws(require('../screens/NumerologyScreen').NumerologyScreen);
const lazy_CleansingScreen_45 = () => ws(require('../screens/CleansingScreen').CleansingScreen);
const lazy_KnowledgeScreen_46 = () => ws(require('../screens/KnowledgeScreen').KnowledgeScreen);
const lazy_StarsScreen_47 = () => ws(require('../screens/StarsScreen').StarsScreen);
const lazy_PartnerTarotScreen_48 = () => ws(require('../screens/PartnerTarotScreen').PartnerTarotScreen);
const lazy_PartnerHoroscopeScreen_49 = () => ws(require('../screens/PartnerHoroscopeScreen').PartnerHoroscopeScreen);
const lazy_PartnerMatrixScreen_50 = () => ws(require('../screens/PartnerMatrixScreen').PartnerMatrixScreen);
const lazy_MilestoneShareScreen_51 = () => ws(require('../screens/MilestoneShareScreen').MilestoneShareScreen);
const lazy_PremiumPaywallScreen_52 = () => ws(require('../screens/PremiumPaywallScreen').PremiumPaywallScreen);
const lazy_OracleChatScreen_53 = () => ws(require('../screens/OracleChatScreen').OracleChatScreen);
const lazy_ChineseHoroscopeScreen_54 = () => ws(require('../screens/ChineseHoroscopeScreen').ChineseHoroscopeScreen);
const lazy_GuidancePreferenceScreen_55 = () => ws(require('../screens/GuidancePreferenceScreen').GuidancePreferenceScreen);
const lazy_MeditationScreen_56 = () => ws(require('../screens/MeditationScreen').MeditationScreen);
const lazy_BreathworkScreen_57 = () => ws(require('../screens/BreathworkScreen').BreathworkScreen);
const lazy_MorningRitualScreen_58 = () => ws(require('../screens/MorningRitualScreen').MorningRitualScreen);
const lazy_ChakraScreen_59 = () => ws(require('../screens/ChakraScreen').ChakraScreen);
const lazy_ShadowWorkScreen_60 = () => ws(require('../screens/ShadowWorkScreen').ShadowWorkScreen);
const lazy_GratitudeScreen_61 = () => ws(require('../screens/GratitudeScreen').GratitudeScreen);
const lazy_LunarCalendarScreen_62 = () => ws(require('../screens/LunarCalendarScreen').LunarCalendarScreen);
const lazy_SoundBathScreen_63 = () => ws(require('../screens/SoundBathScreen').SoundBathScreen);
const lazy_SleepHelperScreen_64 = () => ws(require('../screens/SleepHelperScreen').SleepHelperScreen);
const lazy_CrystalBallScreen_65 = () => ws(require('../screens/CrystalBallScreen').CrystalBallScreen);
const lazy_DowsingRodsScreen_66 = () => ws(require('../screens/DowsingRodsScreen').DowsingRodsScreen);
const lazy_PalmReadingScreen_67 = () => ws(require('../screens/PalmReadingScreen').PalmReadingScreen);
const lazy_AngelNumbersScreen_68 = () => ws(require('../screens/AngelNumbersScreen').AngelNumbersScreen);
const lazy_AstrologyCyclesScreen_69 = () => ws(require('../screens/AstrologyCyclesScreen').AstrologyCyclesScreen);
const lazy_RuneCastScreen_70 = () => ws(require('../screens/RuneCastScreen').RuneCastScreen);
const lazy_HerbalAlchemyScreen_71 = () => ws(require('../screens/HerbalAlchemyScreen').HerbalAlchemyScreen);
const lazy_AuraReadingScreen_72 = () => ws(require('../screens/AuraReadingScreen').AuraReadingScreen);
const lazy_CrystalGridScreen_73 = () => ws(require('../screens/CrystalGridScreen').CrystalGridScreen);
const lazy_CrystalGuideScreen_74 = () => ws(require('../screens/CrystalGuideScreen').CrystalGuideScreen);
const lazy_IChingScreen_75 = () => ws(require('../screens/IChingScreen').IChingScreen);
const lazy_SoulContractScreen_76 = () => ws(require('../screens/SoulContractScreen').SoulContractScreen);
const lazy_PersonalMantraScreen_77 = () => ws(require('../screens/PersonalMantraScreen').PersonalMantraScreen);
const lazy_TarotJournalScreen_78 = () => ws(require('../screens/TarotJournalScreen').TarotJournalScreen);
const lazy_CosmicWeatherScreen_79 = () => ws(require('../screens/CosmicWeatherScreen').CosmicWeatherScreen);
const lazy_VedicAstrologyScreen_80 = () => ws(require('../screens/VedicAstrologyScreen').VedicAstrologyScreen);
const lazy_SpiritAnimalScreen_81 = () => ws(require('../screens/SpiritAnimalScreen').SpiritAnimalScreen);
const lazy_ColorTherapyScreen_82 = () => ws(require('../screens/ColorTherapyScreen').ColorTherapyScreen);
const lazy_DivineTimingScreen_83 = () => ws(require('../screens/DivineTimingScreen').DivineTimingScreen);
const lazy_ManifestationScreen_84 = () => ws(require('../screens/ManifestationScreen').default);
const lazy_MoonRitualScreen_85 = () => ws(require('../screens/MoonRitualScreen').default);
const lazy_TarotSpreadBuilderScreen_86 = () => ws(require('../screens/TarotSpreadBuilderScreen').default);
const lazy_PastLifeScreen_87 = () => ws(require('../screens/PastLifeScreen').PastLifeScreen);
const lazy_AstroTransitsScreen_88 = () => ws(require('../screens/AstroTransitsScreen').default);
const lazy_SacredGeometryScreen_89 = () => ws(require('../screens/SacredGeometryScreen').default);
const lazy_SpiritualProfileScreen_90 = () => ws(require('../screens/SpiritualProfileScreen').SpiritualProfileScreen);
const lazy_ElementalMagicScreen_91 = () => ws(require('../screens/ElementalMagicScreen').default);
const lazy_TodayScreen_92 = () => ws(require('../screens/TodayScreen').TodayScreen);
const lazy_NotificationsScreen_93 = () => ws(require('../screens/NotificationsScreen').NotificationsScreen);
const lazy_EnergyCircleScreen_94 = () => ws(require('../screens/EnergyCircleScreen').EnergyCircleScreen);
const lazy_CommunityTarotScreen_95 = () => ws(require('../screens/CommunityTarotScreen').CommunityTarotScreen);
const lazy_LiveRitualsScreen_96 = () => ws(require('../screens/LiveRitualsScreen').LiveRitualsScreen);
const lazy_SoulMatchScreen_97 = () => ws(require('../screens/SoulMatchScreen').SoulMatchScreen);
const lazy_DreamSymbolsScreen_98 = () => ws(require('../screens/DreamSymbolsScreen').DreamSymbolsScreen);
const lazy_CommunityAffirmationScreen_99 = () => ws(require('../screens/CommunityAffirmationScreen').CommunityAffirmationScreen);
const lazy_SpiritualChallengesScreen_100 = () => ws(require('../screens/SpiritualChallengesScreen').SpiritualChallengesScreen);
const lazy_IntentionChamberScreen_101 = () => ws(require('../screens/IntentionChamberScreen').IntentionChamberScreen);
const lazy_ConsciousnessScreen_102 = () => ws(require('../screens/ConsciousnessScreen').ConsciousnessScreen);
const lazy_SoulMentorsScreen_103 = () => ws(require('../screens/SoulMentorsScreen').SoulMentorsScreen);
const lazy_CosmicPortalsScreen_104 = () => ws(require('../screens/CosmicPortalsScreen').CosmicPortalsScreen);
const lazy_CommunityChronicleScreen_105 = () => ws(require('../screens/CommunityChronicleScreen').CommunityChronicleScreen);
const lazy_GlobalShareScreen_106 = () => ws(require('../screens/GlobalShareScreen').GlobalShareScreen);
const lazy_CommunityChatScreen_107 = () => ws(require('../screens/CommunityChatScreen').CommunityChatScreen);
const lazy_RitualSessionScreen_108 = () => ws(require('../screens/RitualSessionScreen').RitualSessionScreen);
const lazy_LucidDreamingScreen_109 = () => ws(require('../screens/LucidDreamingScreen').LucidDreamingScreen);
const lazy_SleepRitualScreen_110 = () => ws(require('../screens/SleepRitualScreen').SleepRitualScreen);
const lazy_FireCeremonyScreen_111 = () => ws(require('../screens/FireCeremonyScreen').FireCeremonyScreen);
const lazy_AncestralConnectionScreen_112 = () => ws(require('../screens/AncestralConnectionScreen').AncestralConnectionScreen);
const lazy_ReleaseLettersScreen_113 = () => ws(require('../screens/ReleaseLettersScreen').ReleaseLettersScreen);
const lazy_ProtectionRitualScreen_114 = () => ws(require('../screens/ProtectionRitualScreen').ProtectionRitualScreen);
const lazy_SaltBathScreen_115 = () => ws(require('../screens/SaltBathScreen').SaltBathScreen);
const lazy_InnerChildScreen_116 = () => ws(require('../screens/InnerChildScreen').InnerChildScreen);
const lazy_AnxietyReliefScreen_117 = () => ws(require('../screens/AnxietyReliefScreen').AnxietyReliefScreen);
const lazy_SelfCompassionScreen_118 = () => ws(require('../screens/SelfCompassionScreen').SelfCompassionScreen);
const lazy_HealingFrequenciesScreen_119 = () => ws(require('../screens/HealingFrequenciesScreen').HealingFrequenciesScreen);
const lazy_EmotionalAnchorsScreen_120 = () => ws(require('../screens/EmotionalAnchorsScreen').EmotionalAnchorsScreen);
const lazy_LifeWheelScreen_121 = () => ws(require('../screens/LifeWheelScreen').LifeWheelScreen);
const lazy_SoulArchetypeScreen_122 = () => ws(require('../screens/SoulArchetypeScreen').SoulArchetypeScreen);
const lazy_NatalChartScreen_123 = () => ws(require('../screens/NatalChartScreen').NatalChartScreen);
const lazy_RetrogradesScreen_124 = () => ws(require('../screens/RetrogradesScreen').RetrogradesScreen);
const lazy_SignMeditationScreen_125 = () => ws(require('../screens/SignMeditationScreen').SignMeditationScreen);
const lazy_SanangaScreen_126 = () => ws(require('../screens/SanangaScreen').SanangaScreen);
const lazy_RapeScreen_127 = () => ws(require('../screens/RapeScreen').RapeScreen);
const lazy_MantraGeneratorScreen_128 = () => ws(require('../screens/MantraGeneratorScreen').MantraGeneratorScreen);
const lazy_AnnualForecastScreen_129 = () => ws(require('../screens/AnnualForecastScreen').AnnualForecastScreen);
const lazy_VisionBoardScreen_130 = () => ws(require('../screens/VisionBoardScreen').VisionBoardScreen);
const lazy_SpiritualHabitsScreen_131 = () => ws(require('../screens/SpiritualHabitsScreen').SpiritualHabitsScreen);
const lazy_AstroNoteScreen_132 = () => ws(require('../screens/AstroNoteScreen').AstroNoteScreen);
const lazy_NightSymbolatorScreen_133 = () => ws(require('../screens/NightSymbolatorScreen').NightSymbolatorScreen);
const lazy_NumerologyDetailScreen_134 = () => ws(require('../screens/NumerologyDetailScreen').NumerologyDetailScreen);
const lazy_SearchScreen_135 = () => ws(require('../screens/SearchScreen').SearchScreen);


const MainTabs = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { currentTheme, isLight } = useTheme();
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
      <Tab.Screen name="Portal" getComponent={lazy_PortalScreen_0}
        options={{ tabBarLabel: ({ focused, color }) => renderTabLabel(t('nav.portal'), focused, color, Sparkles) }} />
      <Tab.Screen name="Worlds" getComponent={lazy_HomeScreen_1}
        options={{ tabBarLabel: ({ focused, color }) => renderTabLabel(t('tabs.worlds'), focused, color, Compass) }} />
      <Tab.Screen name="Social" getComponent={lazy_SocialScreen_2}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => <SocialTabButton {...props} />,
        }}
      />
      <Tab.Screen name="Oracle" getComponent={lazy_OraclePortalScreen_3}
        options={{ tabBarLabel: ({ focused, color }) => renderTabLabel(t('nav.oracle'), focused, color, Wand2) }} />
      <Tab.Screen name="Profile" getComponent={lazy_ProfileScreen_4}
        options={{ tabBarLabel: ({ focused, color }) => renderTabLabel(t('nav.profile'), focused, color, UserRound) }} />
    </Tab.Navigator>
  );
};

const MainTabsW = ws(MainTabs);

export const AppNavigator = () => {
  const isOnboarded = useAppStore(state => state.isOnboarded);
  const languageChosen = useAppStore(state => state.languageChosen);
  const setAudioRuntime = useAppStore(state => state.setAudioRuntime);
  const setHapticsRuntime = useAppStore(state => state.setHapticsRuntime);
  
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const authLoading = useAuthStore(state => state.loading);
  const setUser = useAuthStore(state => state.setUser);

  // Bootstrap Firebase auth listener + safety timeout
  useEffect(() => {
    // Safety net: if Firebase doesn't call back within 6s, treat as logged-out.
    // Prevents AppLoadingScreen from showing forever on bad networks.
    const safetyTimer = setTimeout(() => {
      if (useAuthStore.getState().loading) {
        setUser(null);
      }
    }, 3500);

    const unsub = AuthService.onAuthChanged(async (firebaseUser) => {
      clearTimeout(safetyTimer);
      try {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            displayName: firebaseUser.displayName ?? '',
            zodiacSign: '',
            archetype: '',
            avatarEmoji: '🌙',
            bio: '',
          });
          void hydrateUserProfile(firebaseUser.uid);
        } else {
          setUser(null);
        }
      } catch {
        // On network error, treat as logged-out so user can retry
        setUser(null);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsub();
    };
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


  // ─── Single NavigationContainer — never unmounts ──────────────────────────
  // Using React Navigation's recommended auth pattern: conditional screen groups
  // inside ONE navigator. This prevents NavigationContainer from remounting when
  // auth state changes (which would break SplashIntroScreen's timer callbacks).
  return (
    <NavigationContainer
      onStateChange={() => {
        // Defer audio ops until AFTER navigation animation finishes — prevents 2-3s lag
        InteractionManager.runAfterInteractions(() => {
          try {
            void AudioService.stopBinauralTone();
            void AudioService.pauseAmbientSound();
            const state = useAppStore.getState();
            if (state.experience.backgroundMusicEnabled) {
              void AudioService.playBackgroundMusic();
            }
          } catch {}
        });
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 220,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: false,
          gestureResponseDistance: { start: 16 },
          freezeOnBlur: true,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        {authLoading ? (
          // Firebase resolving session — show beautiful loading screen
          <Stack.Screen name="AppLoading" component={AppLoadingScreen} options={{ animation: 'none', gestureEnabled: false }} />
        ) : !isLoggedIn ? (
          // Not authenticated — show language choice (first time) then login/register
          <Stack.Group screenOptions={{ animation: 'fade', gestureEnabled: false }}>
            {!languageChosen && (
              <Stack.Screen name="LanguageChoice" getComponent={lazy_LanguageSelectionScreen_5} initialParams={{ returnTo: 'Login' }} options={{ animation: 'fade' }} />
            )}
            <Stack.Screen name="Login" getComponent={lazy_LoginScreen_6} options={{ animation: 'fade' }} />
            <Stack.Screen name="Register" getComponent={lazy_RegisterScreen_7} options={{ animation: 'slide_from_right' }} />
          </Stack.Group>
        ) : !isOnboarded ? (
          // App.tsx already shows SplashIntro for all users on launch — skip duplicate splash.
          // Go straight to LanguageSelection as the first onboarding step.
          <Stack.Group screenOptions={{ animation: 'fade' }}>
            <Stack.Screen name="LanguageSelection" getComponent={lazy_LanguageSelectionScreen_8} options={{ animation: 'fade' }} />
            <Stack.Screen name="IdentitySetup" getComponent={lazy_IdentitySetupScreen_9} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="MagicEntry" getComponent={lazy_MagicEntryScreen_10} options={{ animation: 'fade' }} />
            <Stack.Screen name="Onboarding" getComponent={lazy_OnboardingScreen_11} />
            <Stack.Screen name="SplashIntro" getComponent={lazy_SplashIntroScreen_12} options={{ animation: 'fade' }} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabsW} />
            <Stack.Screen name="Horoscope" getComponent={lazy_HoroscopeScreen_13} />
            <Stack.Screen name="Matrix" getComponent={lazy_MatrixScreen_14} />
            <Stack.Screen name="TarotDeckSelection" getComponent={lazy_TarotDeckSelectionScreen_15} />
            <Stack.Screen name="Tarot" getComponent={lazy_TarotScreen_16} options={{ gestureEnabled: true, fullScreenGestureEnabled: true }} />
            <Stack.Screen name="DailyTarot" getComponent={lazy_DailyTarotScreen_17} />
            <Stack.Screen name="Wrozka" getComponent={lazy_WrozkaScreen_18} options={{ gestureEnabled: true, fullScreenGestureEnabled: true }} />
            <Stack.Screen name="ReadingDetail" getComponent={lazy_ReadingDetailScreen_19} />
            <Stack.Screen name="Compatibility" getComponent={lazy_CompatibilityScreen_20} />
            <Stack.Screen name="ZodiacAtlas" getComponent={lazy_ZodiacAtlasScreen_21} />
            <Stack.Screen name="DailyRitualAI" getComponent={lazy_DailyRitualAIScreen_22} />
            <Stack.Screen name="EnergyJournal" getComponent={lazy_EnergyJournalScreen_23} />
            <Stack.Screen name="Achievements" getComponent={lazy_AchievementsScreen_24} />
            <Stack.Screen name="YearCard" getComponent={lazy_YearCardScreen_25} />
            <Stack.Screen name="DailyCheckIn" component={DailyCheckInScreenWrapper} />
            <Stack.Screen name="CheckInModal" getComponent={lazy_CheckInModalScreen_26} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="AIDailyAffirmations" getComponent={lazy_AIDailyAffirmationsScreen_27} />
            <Stack.Screen name="DreamInterpreter" getComponent={lazy_DreamInterpreterScreen_28} />
            <Stack.Screen name="Biorhythm" getComponent={lazy_BiorhythmScreen_29} />
            <Stack.Screen name="BinauralBeats" getComponent={lazy_BinauralBeatsScreen_30} />
            <Stack.Screen name="WeeklyReport" getComponent={lazy_WeeklyReportScreen_31} />
            <Stack.Screen name="IntentionCards" getComponent={lazy_IntentionCardsScreen_32} />
            <Stack.Screen name="PartnerJournal" getComponent={lazy_PartnerJournalScreen_33} />
            <Stack.Screen name="Affirmations" getComponent={lazy_AffirmationsScreen_34} />
            <Stack.Screen name="Journal" getComponent={lazy_JournalScreen_35} />
            <Stack.Screen name="JournalEntry" getComponent={lazy_JournalEntryScreen_36} options={{ gestureEnabled: true, fullScreenGestureEnabled: true }} />
            <Stack.Screen name="Reports" getComponent={lazy_ReportsScreen_37} />
            <Stack.Screen name="RitualCategorySelection" getComponent={lazy_RitualCategorySelectionScreen_38} />
            <Stack.Screen name="Rituals" getComponent={lazy_RitualsScreen_39} />
            <Stack.Screen name="RitualDetail" getComponent={lazy_RitualDetailScreen_40} />
            <Stack.Screen name="Journeys" getComponent={lazy_JourneysScreen_41} />
            <Stack.Screen name="Dreams" getComponent={lazy_DreamsScreen_42} />
            <Stack.Screen name="DreamDetail" getComponent={lazy_DreamDetailScreen_43} />
            <Stack.Screen name="Numerology" getComponent={lazy_NumerologyScreen_44} />
            <Stack.Screen name="Cleansing" getComponent={lazy_CleansingScreen_45} />
            <Stack.Screen name="Knowledge" getComponent={lazy_KnowledgeScreen_46} />
            <Stack.Screen name="Stars" getComponent={lazy_StarsScreen_47} />
            <Stack.Screen name="PartnerTarot" getComponent={lazy_PartnerTarotScreen_48} />
            <Stack.Screen name="PartnerHoroscope" getComponent={lazy_PartnerHoroscopeScreen_49} />
            <Stack.Screen name="PartnerMatrix" getComponent={lazy_PartnerMatrixScreen_50} />
            <Stack.Screen name="MilestoneShare" getComponent={lazy_MilestoneShareScreen_51} />
            <Stack.Screen name="Paywall" getComponent={lazy_PremiumPaywallScreen_52} />
            <Stack.Screen name="OracleChat" getComponent={lazy_OracleChatScreen_53} options={{ gestureEnabled: true, fullScreenGestureEnabled: true }} />
            <Stack.Screen name="ChineseHoroscope" getComponent={lazy_ChineseHoroscopeScreen_54} />
            <Stack.Screen name="GuidancePreference" getComponent={lazy_GuidancePreferenceScreen_55} />
            <Stack.Screen name="LanguageSelection" getComponent={lazy_LanguageSelectionScreen_8} />
            <Stack.Screen name="IdentitySetup" getComponent={lazy_IdentitySetupScreen_9} />
            <Stack.Screen name="Meditation" getComponent={lazy_MeditationScreen_56} />
            <Stack.Screen name="Breathwork" getComponent={lazy_BreathworkScreen_57} />
            <Stack.Screen name="MorningRitual" getComponent={lazy_MorningRitualScreen_58} />
            <Stack.Screen name="Chakra" getComponent={lazy_ChakraScreen_59} />
            <Stack.Screen name="ShadowWork" getComponent={lazy_ShadowWorkScreen_60} options={{ gestureEnabled: true, fullScreenGestureEnabled: true }} />
            <Stack.Screen name="Gratitude" getComponent={lazy_GratitudeScreen_61} />
            <Stack.Screen name="LunarCalendar" getComponent={lazy_LunarCalendarScreen_62} />
            <Stack.Screen name="SoundBath" getComponent={lazy_SoundBathScreen_63} />
            <Stack.Screen name="Social" getComponent={lazy_SocialScreen_2} />
            <Stack.Screen name="SleepHelper" getComponent={lazy_SleepHelperScreen_64} />
            <Stack.Screen name="CrystalBall" getComponent={lazy_CrystalBallScreen_65} />
            <Stack.Screen name="DowsingRods" getComponent={lazy_DowsingRodsScreen_66} />
            <Stack.Screen name="PalmReading" getComponent={lazy_PalmReadingScreen_67} />
            <Stack.Screen name="AngelNumbers" getComponent={lazy_AngelNumbersScreen_68} />
            <Stack.Screen name="AstrologyCycles" getComponent={lazy_AstrologyCyclesScreen_69} />
            <Stack.Screen name="RuneCast" getComponent={lazy_RuneCastScreen_70} />
            <Stack.Screen name="HerbalAlchemy" getComponent={lazy_HerbalAlchemyScreen_71} />
            <Stack.Screen name="AuraReading" getComponent={lazy_AuraReadingScreen_72} />
            <Stack.Screen name="CrystalGrid" getComponent={lazy_CrystalGridScreen_73} />
            <Stack.Screen name="CrystalGuide" getComponent={lazy_CrystalGuideScreen_74} />
            <Stack.Screen name="IChing" getComponent={lazy_IChingScreen_75} />
            <Stack.Screen name="SoulContract" getComponent={lazy_SoulContractScreen_76} />
            <Stack.Screen name="PersonalMantra" getComponent={lazy_PersonalMantraScreen_77} />
            <Stack.Screen name="TarotJournal" getComponent={lazy_TarotJournalScreen_78} />
            <Stack.Screen name="CosmicWeather" getComponent={lazy_CosmicWeatherScreen_79} />
            <Stack.Screen name="VedicAstrology" getComponent={lazy_VedicAstrologyScreen_80} />
            <Stack.Screen name="SpiritAnimal" getComponent={lazy_SpiritAnimalScreen_81} />
            <Stack.Screen name="ColorTherapy" getComponent={lazy_ColorTherapyScreen_82} />
            <Stack.Screen name="DivineTiming" getComponent={lazy_DivineTimingScreen_83} />
            <Stack.Screen name="Manifestation" getComponent={lazy_ManifestationScreen_84} />
            <Stack.Screen name="MoonRitual" getComponent={lazy_MoonRitualScreen_85} />
            <Stack.Screen name="TarotSpreadBuilder" getComponent={lazy_TarotSpreadBuilderScreen_86} />
            <Stack.Screen name="PastLife" getComponent={lazy_PastLifeScreen_87} />
            <Stack.Screen name="AstroTransits" getComponent={lazy_AstroTransitsScreen_88} />
            <Stack.Screen name="SacredGeometry" getComponent={lazy_SacredGeometryScreen_89} />
            <Stack.Screen name="SpiritualProfile" getComponent={lazy_SpiritualProfileScreen_90} />
            <Stack.Screen name="ElementalMagic" getComponent={lazy_ElementalMagicScreen_91} />
            <Stack.Screen name="Today" getComponent={lazy_TodayScreen_92} />
            <Stack.Screen name="NotificationsDetail" getComponent={lazy_NotificationsScreen_93} />
            <Stack.Screen name="EnergyCircle" getComponent={lazy_EnergyCircleScreen_94} />
            <Stack.Screen name="CommunityTarot" getComponent={lazy_CommunityTarotScreen_95} />
            <Stack.Screen name="LiveRituals" getComponent={lazy_LiveRitualsScreen_96} />
            <Stack.Screen name="SoulMatch" getComponent={lazy_SoulMatchScreen_97} />
            <Stack.Screen name="DreamSymbols" getComponent={lazy_DreamSymbolsScreen_98} />
            <Stack.Screen name="CommunityAffirmation" getComponent={lazy_CommunityAffirmationScreen_99} />
            <Stack.Screen name="SpiritualChallenges" getComponent={lazy_SpiritualChallengesScreen_100} />
            <Stack.Screen name="IntentionChamber" getComponent={lazy_IntentionChamberScreen_101} />
            <Stack.Screen name="Consciousness" getComponent={lazy_ConsciousnessScreen_102} />
            <Stack.Screen name="SoulMentors" getComponent={lazy_SoulMentorsScreen_103} />
            <Stack.Screen name="CosmicPortals" getComponent={lazy_CosmicPortalsScreen_104} />
            <Stack.Screen name="CommunityChronicle" getComponent={lazy_CommunityChronicleScreen_105} />
            <Stack.Screen name="GlobalShare" getComponent={lazy_GlobalShareScreen_106} />
            <Stack.Screen name="CommunityChat" getComponent={lazy_CommunityChatScreen_107} />
            <Stack.Screen name="RitualSession" getComponent={lazy_RitualSessionScreen_108} />
            <Stack.Screen name="LucidDreaming" getComponent={lazy_LucidDreamingScreen_109} />
            <Stack.Screen name="SleepRitual" getComponent={lazy_SleepRitualScreen_110} />
            <Stack.Screen name="FireCeremony" getComponent={lazy_FireCeremonyScreen_111} />
            <Stack.Screen name="AncestralConnection" getComponent={lazy_AncestralConnectionScreen_112} />
            <Stack.Screen name="ReleaseLetters" getComponent={lazy_ReleaseLettersScreen_113} />
            <Stack.Screen name="ProtectionRitual" getComponent={lazy_ProtectionRitualScreen_114} />
            <Stack.Screen name="SaltBath" getComponent={lazy_SaltBathScreen_115} />
            <Stack.Screen name="InnerChild" getComponent={lazy_InnerChildScreen_116} />
            <Stack.Screen name="AnxietyRelief" getComponent={lazy_AnxietyReliefScreen_117} />
            <Stack.Screen name="SelfCompassion" getComponent={lazy_SelfCompassionScreen_118} />
            <Stack.Screen name="HealingFrequencies" getComponent={lazy_HealingFrequenciesScreen_119} />
            <Stack.Screen name="EmotionalAnchors" getComponent={lazy_EmotionalAnchorsScreen_120} />
            <Stack.Screen name="LifeWheel" getComponent={lazy_LifeWheelScreen_121} />
            <Stack.Screen name="SoulArchetype" getComponent={lazy_SoulArchetypeScreen_122} />
            <Stack.Screen name="NatalChart" getComponent={lazy_NatalChartScreen_123} />
            <Stack.Screen name="Retrogrades" getComponent={lazy_RetrogradesScreen_124} />
            <Stack.Screen name="SignMeditation" getComponent={lazy_SignMeditationScreen_125} />
            <Stack.Screen name="Sananga" getComponent={lazy_SanangaScreen_126} />
            <Stack.Screen name="Rape" getComponent={lazy_RapeScreen_127} />
            <Stack.Screen name="MantraGenerator" getComponent={lazy_MantraGeneratorScreen_128} />
            <Stack.Screen name="AnnualForecast" getComponent={lazy_AnnualForecastScreen_129} />
            <Stack.Screen name="VisionBoard" getComponent={lazy_VisionBoardScreen_130} />
            <Stack.Screen name="SpiritualHabits" getComponent={lazy_SpiritualHabitsScreen_131} />
            <Stack.Screen name="AstroNote" getComponent={lazy_AstroNoteScreen_132} />
            <Stack.Screen name="NightSymbolator" getComponent={lazy_NightSymbolatorScreen_133} />
            <Stack.Screen name="NumerologyDetail" getComponent={lazy_NumerologyDetailScreen_134} />
            <Stack.Screen name="Search" getComponent={lazy_SearchScreen_135} options={{ animation: 'slide_from_bottom', gestureEnabled: true }} />
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
