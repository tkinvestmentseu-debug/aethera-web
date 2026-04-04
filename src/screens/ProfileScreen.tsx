// @ts-nocheck
import { AMBIENT_SOUND_OPTIONS, AudioService, BACKGROUND_MUSIC_OPTIONS } from '../core/services/audio.service';
import { TTSService } from '../core/services/tts.service';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Slider from '@react-native-community/slider';
import {
  StyleSheet, View, ScrollView, Pressable, Modal,
  TouchableOpacity, Text, Dimensions, Animated as RNAnimated
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { useOracleStore } from '../store/useOracleStore';
import { usePremiumStore } from '../store/usePremiumStore';
import { getResolvedTheme, ThemeName, ThemeMode } from '../core/theme/tokens';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { Typography } from '../components/Typography';
import { getZodiacSign, ZODIAC_SYMBOLS, ZODIAC_LABELS } from '../features/horoscope/utils/astrology';
import { SoulEngineService } from '../core/services/soulEngine.service';
import { CelestialBackdrop } from '../components/CelestialBackdrop';
import { layout, screenContracts, screenRhythm } from '../core/theme/designSystem';
import {
  Palette, Globe, Star, ChevronRight, Book, X, BarChart2,
  Sparkles, Flame, Moon, ScrollText, SlidersHorizontal,
  Vibrate, Waves, ImagePlus, RotateCcw, Shield, HelpCircle,
  Crown, Archive, Settings2, User, Feather, Music, Eye,
  ChevronDown, Check, Zap, Calendar, Compass, Sun, MessageCircle, BookOpen
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { resolveUserFacingText } from '../core/utils/contentResolver';
import { LANGUAGE_OPTIONS } from '../core/i18n/languageOptions';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { HapticsService } from '../core/services/haptics.service';
import { AvatarService } from '../core/services/avatar.service';
import { useTarotStore } from '../features/tarot/store/useTarotStore';
import { TAROT_DECKS, getTarotDeckById } from '../features/tarot/data/decks';
import { AiService } from '../core/services/ai.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import * as Haptics from 'expo-haptics';

const { width: SW } = Dimensions.get('window');


const THEME_OPTIONS: { id: ThemeName; label: string; sub: string }[] = [
  { id: 'goldenRitual', label: 'Złoty rytuał', sub: 'Intensywne złoto na głębokiej czerni' },
  { id: 'moonMist', label: 'Księżycowa mgła', sub: 'Srebrne fiolety i chłodny błękit' },
  { id: 'dawnClarity', label: 'Świt i klarowność', sub: 'Miękkie złoto i poranna jasność' },
  { id: 'cosmicViolet', label: 'Kosmiczny fiolet', sub: 'Głęboka purpura i przestrzeń' },
  { id: 'crimsonSoul', label: 'Szkarłatna dusza', sub: 'Gorący róż i burgundowe noce' },
  { id: 'forestDepth', label: 'Głębia lasu', sub: 'Szmaragdowa zieleń i ciemna ziemia' },
  { id: 'oceanDream', label: 'Oceaniczny sen', sub: 'Cyjan i głębiny morza' },
  { id: 'sunriseSanctum', label: 'Sanktuarium świtu', sub: 'Bursztynowy amber i ciepły poranek' },
];

const GUIDANCE_OPTIONS = [
  { id: 'western_astrology', label: 'Astrologia zachodnia', sub: 'Znaki, domy i tranzyty' },
  { id: 'chinese_astrology', label: 'Astrologia chińska', sub: 'Żywioł, zwierzę i rytm roku' },
  { id: 'tarot', label: 'Tarot', sub: 'Karty jako główny język symboli' },
  { id: 'mixed', label: 'Prowadzenie mieszane', sub: 'Łączone sygnały wszystkich systemów' },
];

const BACKGROUND_OPTIONS = [
  { id: 'subtleCelestial', label: 'Subtelne niebo' },
  { id: 'softMist', label: 'Miękka mgła' },
  { id: 'sacredGeometry', label: 'Święta geometria' },
  { id: 'deepNight', label: 'Glęboka noc' },
  { id: 'goldenRitual', label: 'Złoty rytuał' },
  { id: 'minimalClean', label: 'Minimalna cisza' },
  { id: 'moonGlow', label: 'Księżycowy blask' },
] as const;

const MOTION_OPTIONS = [
  { id: 'minimal', label: 'Oszczędny', sub: 'Minimum animacji' },
  { id: 'standard', label: 'Wyważone', sub: 'Domyślny balans' },
  { id: 'rich', label: 'Pogłębiony', sub: 'Pełna płynność' },
  { id: 'quiet', label: 'Cichy', sub: 'Najspokojniejszy tryb' },
];

const SOUNDSCAPE_OPTIONS = [
  { id: 'forest', label: 'Las', emoji: '🌲' },
  { id: 'rain', label: 'Deszcz', emoji: '🌧' },
  { id: 'waves', label: 'Fale', emoji: '🌊' },
  { id: 'fire', label: 'Ogień', emoji: '🔥' },
  { id: 'ritual', label: 'Rytuał', emoji: '🕯' },
];

const MUSIC_CATEGORY_OPTIONS = [
  { id: 'relaxing',   label: 'Relaks',    emoji: '🌊' },
  { id: 'motivating', label: 'Energia',   emoji: '⚡' },
  { id: 'sleep',      label: 'Sen',       emoji: '🌙' },
  { id: 'focus',      label: 'Fokus',     emoji: '🎯' },
  { id: 'ritual',     label: 'Rytualny',  emoji: '🕯' },
  { id: 'celestial',  label: 'Kosmiczny', emoji: '✨' },
];

// ── Pomocnicze komponenty ─────────────────────────────────────

const SectionHeader = React.memo(({ icon: Icon, label, color }: { icon: any; label: string; color: string }) => (
  <View style={sStyles.sectionHeader}>
    <View style={[sStyles.sectionIconWrap, { backgroundColor: color + '18', borderColor: color + '33' }]}>
      <Icon color={color} size={17} strokeWidth={1.8} />
    </View>
    <Text style={[sStyles.sectionHeaderText, { color }]}>{label.toUpperCase()}</Text>
  </View>
));

const EntryRow = React.memo(({
  icon: Icon, label, value, onPress, accent, last = false, badge, textColor = '#1A1410', subColor = '#8A7060'
}: {
  icon: any; label: string; value?: string; onPress?: () => void;
  accent: string; last?: boolean; badge?: string; textColor?: string; subColor?: string;
}) => (
  <Pressable
    onPress={onPress}
    style={[sStyles.entryRow, !last && sStyles.entryRowBorder]}
  >
    <View style={[sStyles.entryIcon, { backgroundColor: accent + '14', borderColor: accent + '28' }]}>
      <Icon color={accent} size={16} strokeWidth={1.8} />
    </View>
    <View style={sStyles.entryText}>
      <Text style={[sStyles.entryLabel, { color: textColor }]}>{label}</Text>
      {value ? <Text style={[sStyles.entryValue, { color: subColor }]} numberOfLines={1}>{value}</Text> : null}
    </View>
    {badge ? (
      <View style={[sStyles.badge, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
        <Text style={[sStyles.badgeText, { color: accent }]}>{badge}</Text>
      </View>
    ) : null}
    {onPress ? <ChevronRight color={accent} size={16} strokeWidth={1.6} opacity={0.6} /> : null}
  </Pressable>
));

const CustomToggle = React.memo(({ value, onToggle, accent }: { value: boolean; onToggle: () => void; accent: string }) => {
  const anim = useRef(new RNAnimated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    RNAnimated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, tension: 60, friction: 8 }).start();
  }, [value]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(120,120,120,0.18)', accent + 'CC'] });
  return (
    <Pressable onPress={onToggle} style={{ width: 48, height: 28, borderRadius: 14, overflow: 'hidden', justifyContent: 'center' }}>
      <RNAnimated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: bgColor, borderRadius: 14 }} />
      <RNAnimated.View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF', transform: [{ translateX }], shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 4, elevation: 3 }} />
    </Pressable>
  );
});

const ToggleRow = React.memo(({
  icon: Icon, label, value, onToggle, accent, last = false, textColor = '#1A1410', subColor = '#8A7060'
}: {
  icon: any; label: string; value: boolean; onToggle: () => void;
  accent: string; last?: boolean; textColor?: string; subColor?: string;
}) => (
  <View style={[sStyles.entryRow, !last && sStyles.entryRowBorder]}>
    <View style={[sStyles.entryIcon, { backgroundColor: accent + '14', borderColor: accent + '28' }]}>
      <Icon color={accent} size={16} strokeWidth={1.8} />
    </View>
    <View style={sStyles.entryText}>
      <Text style={[sStyles.entryLabel, { color: textColor }]}>{label}</Text>
      <Text style={[sStyles.entryValue, { color: subColor }]}>{value ? 'Włączone' : 'Wyłączone'}</Text>
    </View>
    <CustomToggle value={value} onToggle={onToggle} accent={accent} />
  </View>
));

const SectionCard = React.memo(({ children, style, isLight = true }: { children: React.ReactNode; style?: any; isLight?: boolean }) => (
  <View style={[sStyles.sectionCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.07)', borderColor: isLight ? 'rgba(169,122,57,0.20)' : 'rgba(255,255,255,0.12)' }, style]}>{children}</View>
));

// ── Modal bazowy ──────────────────────────────────────────────
const BottomModal = ({
  visible, onClose, title, children, accent
}: {
  visible: boolean; onClose: () => void; title: string;
  children: React.ReactNode; accent: string;
}) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={sStyles.modalBg} onPress={onClose} />
      <View style={[sStyles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={sStyles.modalHandle} />
        <View style={sStyles.modalTitleRow}>
          <Text style={sStyles.modalTitle}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <X color="#8A7A6A" size={22} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
};

const reduceToSingle = (n: number): number => {
  let v = n;
  while (v > 9 && v !== 11 && v !== 22) {
    v = String(v).split('').reduce((acc, d) => acc + Number(d), 0);
  }
  return v;
};

// ── Glowny ekran ──────────────────────────────────────────────
export const ProfileScreen = ({ navigation, route }: any) => {
  const musicVolume = useAppStore((s) => s.experience?.musicVolume ?? 0.5);
  const ambientVolume = useAppStore((s) => s.experience?.ambientVolume ?? 0.5);
  const setExperience = useAppStore((s) => s.setExperience);

  const handleMusicVolume = useCallback((v: number) => {
    setExperience({ musicVolume: v });
    AudioService.setUserInteracted(); AudioService.setMusicVolume(v);
  }, [setExperience]);

  const handleAmbientVolume = useCallback((v: number) => {
    setExperience({ ambientVolume: v });
    AudioService.setUserInteracted(); AudioService.setAmbientVolume(v);
  }, [setExperience]);
  const { t } = useTranslation();
  const tr = useCallback((key: string, pl: string, en: string, options?: Record<string, unknown>) => (
    t(key, { defaultValue: i18n.language?.startsWith('en') ? en : pl, ...options })
  ), [t]);
  const insets = useSafeAreaInsets();
  const {
    themeName, themeMode, setTheme, setThemeMode, userData, setLanguage, setUserData,
    streaks, language, experience,
    ambientSoundEnabled, setAmbientSoundEnabled,
    audioRuntimeState, hapticsRuntimeState,
    meditationSessions, breathworkSessions,
  } = useAppStore();
  const { entries } = useJournalStore();
  const { pastSessions } = useOracleStore();
  const { isPremium } = usePremiumStore();
  const { selectedDeckId, setSelectedDeck } = useTarotStore();
  const currentTheme = useMemo(() => getResolvedTheme(themeName), [themeName]);
  const isLight = currentTheme.background.startsWith('#F');
  const accent = currentTheme.primary;
  const rowTextColor = isLight ? '#1A1410' : '#F0EBE2';
  const rowSubColor = isLight ? '#8A7060' : '#A09080';
  const aiAvailable = AiService.isLaunchAvailable();
  const aiState = AiService.getLaunchAvailabilityState();
  const audioDiagnostic = AudioService.getDiagnosticSnapshot();
  const aiDiagnostic = AiService.getProviderDiagnostic();
  const activeMusicLabel = MUSIC_CATEGORY_OPTIONS.find((opt) => opt.id === audioDiagnostic.activeMusicCategory)?.label || 'Brak aktywnej ścieżki';
  const activeAmbientLabel = SOUNDSCAPE_OPTIONS.find((opt) => opt.id === audioDiagnostic.activeAmbientSoundscape)?.label || 'Brak aktywnego krajobrazu';

  const sign = userData.birthDate ? getZodiacSign(userData.birthDate) : null;
  const archetype = SoulEngineService.getArchetype(userData.birthDate ?? null);
  const selectedDeck = getTarotDeckById(selectedDeckId);
  const hasAvatar = Boolean(userData.avatarUri);
  const firstName = userData.name?.trim() || 'Wędrowcze';
  const savedDreams = useMemo(() => entries.filter(e => e.type === 'dream').length, [entries]);
  const practiceCount = meditationSessions.length + breathworkSessions.length;
  const favoriteEntries = useMemo(() => entries.filter(e => e.isFavorite).length, [entries]);
  const audioControlsLocked = audioRuntimeState === 'initializing' || audioRuntimeState === 'failed';

  const personalYear = useMemo(() => {
    if (!userData.birthDate) return null;
    const parts = userData.birthDate.split('-');
    const mm = Number(parts[1]);
    const dd = Number(parts[2]);
    return reduceToSingle(mm + dd + new Date().getFullYear());
  }, [userData.birthDate]);
  const monthlyVibration = useMemo(() => {
    if (!personalYear) return null;
    return String(reduceToSingle(personalYear + new Date().getMonth() + 1));
  }, [personalYear]);
  const personalDay = useMemo(() => {
    if (!personalYear) return null;
    const now = new Date();
    return reduceToSingle(personalYear + now.getMonth() + 1 + now.getDate());
  }, [personalYear]);

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  const [showTarotDeckModal, setShowTarotDeckModal] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false);
  const [showMotionModal, setShowMotionModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const THEMES_LIST: ThemeName[] = ['goldenRitual', 'moonMist', 'dawnClarity', 'cosmicViolet', 'crimsonSoul', 'forestDepth', 'oceanDream', 'sunriseSanctum'];

  const handlePickAvatar = useCallback(async () => {
    setAvatarBusy(true);
    try {
    const result = await AvatarService.pickAvatarFromLibrary();
    if (result.kind === 'success' && result.uri) { setUserData({ avatarUri: result.uri }); setShowAvatarModal(false); }
    } catch {}
    setAvatarBusy(false);
  }, [setUserData]);

  const handleRemoveAvatar = useCallback(() => {
    setUserData({ avatarUri: '' });
    setShowAvatarModal(false);
  }, [setUserData]);

  return (
    <View style={[sStyles.container, { backgroundColor: isLight ? '#F7F1E8' : '#06070C' }]}>
      <CelestialBackdrop intensity="soft" />
      <SafeAreaView edges={['top']} style={sStyles.safeArea}>
        {/* ══ SCREEN HEADER ══ */}
        <Animated.View entering={FadeInDown.duration(300)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 6, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isLight ? 'rgba(169,122,57,0.14)' : 'rgba(206,174,114,0.12)' }}>
          <View>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2.5, color: accent }}>✦ AETHERA</Text>
            <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.4, color: isLight ? '#1A1410' : '#F0EBE2', marginTop: 2 }}>{tr('profile.title', 'Profil i Ustawienia', 'Profile & Settings')}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Pressable
              onPress={() => navigation.navigate('Achievements')}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: accent + '18', borderWidth: 1, borderColor: accent + '33', alignItems: 'center', justifyContent: 'center' }}
            >
              <Crown color={accent} size={17} strokeWidth={1.8} />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('NotificationsDetail')}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Settings2 color={rowSubColor} size={17} strokeWidth={1.8} />
            </Pressable>
          </View>
        </Animated.View>

        <ScrollView
          contentContainerStyle={[sStyles.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'airy') }]}
          showsVerticalScrollIndicator={false}
        >

          {/* ══ HERO — profil uzytkownika ══ */}
          <Animated.View entering={FadeInDown.duration(600)}>
            <View style={sStyles.heroWrap}>
              <LinearGradient
                colors={isLight ? ['#FBF6EE', '#F5ECD8'] : ['#0E1521', '#141A26']}
                style={sStyles.heroBg}
              />
              <View style={{ height: 3, backgroundColor: accent, borderRadius: 2, marginBottom: 12 }} />

              {/* Avatar */}
              <Pressable onPress={() => setShowAvatarModal(true)} style={sStyles.avatarWrap}>
                <ProfileAvatar
                  uri={userData.avatarUri}
                  name={firstName}
                  fallbackText={firstName.charAt(0).toUpperCase()}
                  size={96}
                  primary={accent}
                  borderColor={accent + '55'}
                  backgroundColor={isLight ? '#FFF8EE' : '#1A2236'}
                  textColor={accent}
                />
                <View style={[sStyles.avatarEditBadge, { backgroundColor: accent, borderColor: isLight ? '#F7F1E8' : '#06070C' }]}>
                  <Feather color="#FFF" size={11} strokeWidth={2.5} />
                </View>
              </Pressable>

              <View style={sStyles.heroInfo}>
                <Text style={[sStyles.heroName, { color: isLight ? '#1A1410' : '#F5F1EA' }]}>{firstName}</Text>
                {userData.birthDate ? (
                  <View style={[sStyles.heroBadge, { backgroundColor: accent + '14', borderColor: accent + '33' }]}>
                    <Text style={[sStyles.heroSign, { color: accent }]}>
                      {ZODIAC_SYMBOLS[sign! as keyof typeof ZODIAC_SYMBOLS] || ''} {ZODIAC_LABELS[sign!] || sign}
                    </Text>
                    {archetype ? (
                      <Text style={sStyles.heroArchetype}>· {resolveUserFacingText(archetype.title)}</Text>
                    ) : null}
                  </View>
                ) : null}
                <Text style={[sStyles.heroSub, { color: isLight ? '#8A7060' : '#9A8E80' }]}>
                  {userData.birthPlace || 'Dodaj miejsce urodzenia'}
                </Text>
              </View>

              {/* Stats strip */}
              <View style={[sStyles.statsStrip, { borderTopColor: isLight ? 'rgba(169,122,57,0.12)' : 'rgba(255,255,255,0.12)' }]}>
                {[
                  { val: String(streaks.current), label: t('common.streak'), icon: Flame },
                  { val: String(entries.length), label: 'Ślady', icon: Book },
                  { val: String(pastSessions.length), label: 'Podróże', icon: MessageCircle },
                  { val: String(practiceCount), label: t('profile.practiceCount'), icon: Waves },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <View key={s.label} style={[sStyles.statItem, { backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.06)', borderRadius: 12, paddingVertical: 8 }, i < 3 && { borderRightWidth: 1, borderRightColor: isLight ? 'rgba(169,122,57,0.12)' : 'rgba(255,255,255,0.12)' }]}>
                      <View style={[{ marginBottom: 6, width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: accent + '18' }]}><Icon color={accent} size={16} strokeWidth={1.8} /></View>
                      <Text style={[sStyles.statVal, { color: accent }]}>{s.val}</Text>
                      <Text style={sStyles.statLabel}>{s.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>

          {/* ══ QUICK ACCESS TILES ══ */}
          <Animated.View entering={FadeInDown.delay(30).duration(480)} style={{ marginTop: 16, marginBottom: 4 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.8, color: rowSubColor, paddingHorizontal: layout.padding.screen, marginBottom: 12 }}>SZYBKI DOSTĘP</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 10, paddingRight: layout.padding.screen + 4 }}>
              {([
                { emoji: '🎨', label: t('profile.theme'),    color: accent,      onPress: () => setShowThemeModal(true) },
                { emoji: '🌐', label: t('profile.language'),    color: '#60A5FA',   onPress: () => setShowLanguageModal(true) },
                { emoji: '🃏', label: 'Talia',    color: '#F472B6',   onPress: () => setShowTarotDeckModal(true) },
                { emoji: '🖼', label: 'Tło',      color: '#A78BFA',   onPress: () => setShowBgModal(true) },
                { emoji: '✨', label: 'Animacje', color: '#34D399',   onPress: () => setShowMotionModal(true) },
                { emoji: '🧭', label: 'Prowadzenie', color: '#FB923C', onPress: () => setShowGuidanceModal(true) },
                { emoji: '📊', label: 'Raport',   color: '#60A5FA',   onPress: () => navigation.navigate('Reports') },
                { emoji: '🏆', label: 'Osiąg.',   color: '#FBBF24',   onPress: () => navigation.navigate('Achievements') },
              ]).map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => { void HapticsService.selection(); item.onPress(); }}
                  style={({ pressed }) => ({
                    width: 76, alignItems: 'center', padding: 12,
                    borderRadius: 18, borderWidth: 1,
                    borderColor: item.color + '33', backgroundColor: isLight ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.05)',
                    opacity: pressed ? 0.8 : 1,
                    gap: 8,
                  })}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: item.color + '18', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: item.color, letterSpacing: 0.3, textAlign: 'center' }}>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ══ ROK OSOBISTY ══ */}
          <Animated.View entering={FadeInDown.delay(40).duration(500)}>
            <SectionHeader icon={Calendar} label="Mój rok osobisty" color={accent} />
            <SectionCard isLight={isLight}>
              <EntryRow icon={Star} label="Rok osobisty" value={personalYear ? `Cykl ${personalYear} · ${personalYear === 1 ? 'Nowe początki' : personalYear === 2 ? 'Partnerstwo' : personalYear === 3 ? 'Ekspresja' : personalYear === 4 ? 'Praca' : personalYear === 5 ? 'Zmiana' : personalYear === 6 ? 'Miłość' : personalYear === 7 ? 'Duchowość' : personalYear === 8 ? 'Moc' : 'Spełnienie'}` : 'Uzupełnij datę'} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
              <EntryRow icon={Compass} label="Miesięczna wibracja" value={monthlyVibration ? `Cykl ${monthlyVibration} · aktywna` : 'Brak daty'} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
              <EntryRow icon={Sun} label="Dzień osobisty" value={personalDay ? `Cykl ${personalDay} · dziś` : '—'} accent={accent} last textColor={rowTextColor} subColor={rowSubColor} />
            </SectionCard>
          </Animated.View>

          {/* ══ 1. OSOBISTE SANKTUARIUM ══ */}
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <SectionHeader icon={User} label="Osobiste sanktuarium" color={accent} />
            <SectionCard isLight={isLight}>
              <EntryRow icon={User} label="Imie i profil" value={firstName} onPress={() => navigation.navigate('IdentitySetup')} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
              <EntryRow icon={Star} label="Znak zodiaku" value={sign ? (ZODIAC_LABELS[sign] || sign) : 'Uzupełnij datę urodzenia'} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
              <EntryRow icon={Sparkles} label="Archetyp dnia" value={archetype ? resolveUserFacingText(archetype.title) : 'Obliczany...'} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
              <EntryRow icon={Flame} label="Talia tarota" value={selectedDeck?.name || 'Klasyczna'} onPress={() => setShowTarotDeckModal(true)} accent={accent} last textColor={rowTextColor} subColor={rowSubColor} />
            </SectionCard>
          </Animated.View>

          {/* ══ 2. WYGLAD I ATMOSFERA ══ */}
          <Animated.View entering={FadeInDown.delay(140).duration(500)}>
            <SectionHeader icon={Palette} label="Wygląd i atmosfera" color={accent} />
            {/* Display mode tile */}
            <SectionCard isLight={isLight} style={{ marginBottom: 10 }}>
              <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: rowSubColor, marginBottom: 10 }}>TRYB WYŚWIETLANIA</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {([
                    { id: 'auto' as ThemeMode, label: 'Auto', Icon: RotateCcw },
                    { id: 'light' as ThemeMode, label: 'Jasny', Icon: Sun },
                    { id: 'dark' as ThemeMode, label: 'Ciemny', Icon: Moon },
                  ]).map(({ id, label, Icon }) => {
                    const active = themeMode === id;
                    return (
                      <Pressable
                        key={id}
                        onPress={() => { setThemeMode(id); HapticsService.selection(); }}
                        style={{
                          flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center',
                          gap: 5, borderWidth: 1,
                          backgroundColor: active ? accent + '1E' : 'transparent',
                          borderColor: active ? accent + '66' : (isLight ? 'rgba(0,0,0,0.11)' : 'rgba(255,255,255,0.11)'),
                        }}
                      >
                        <Icon color={active ? accent : rowSubColor} size={17} strokeWidth={active ? 2.2 : 1.6} />
                        <Text style={{ fontSize: 11, fontWeight: active ? '700' : '500', color: active ? accent : rowSubColor }}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </SectionCard>
            {/* Inline theme grid */}
            <View style={{ marginHorizontal: 18, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: rowSubColor }}>MOTYW STYLU</Text>
                {themeMode === 'auto' && (
                  <Text style={{ fontSize: 10, color: accent, fontWeight: '600' }}>Tryb auto aktywny</Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {THEMES_LIST.map((themeId) => {
                  const opt = THEME_OPTIONS.find(t => t.id === themeId);
                  const resolved = getResolvedTheme(themeId);
                  const active = themeName === themeId;
                  const cardW = Math.floor((SW - 36 - 10) / 2);
                  return (
                    <Pressable
                      key={themeId}
                      onPress={() => { setTheme(themeId); HapticsService.selection(); }}
                      style={{
                        width: cardW, borderRadius: 20, overflow: 'hidden',
                        borderWidth: active ? 2 : 1,
                        borderColor: active ? resolved.primary : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'),
                        shadowColor: active ? resolved.primary : '#000',
                        shadowOpacity: active ? 0.35 : 0.08,
                        shadowRadius: active ? 14 : 8,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: active ? 8 : 2,
                      }}
                    >
                      {/* Gradient area */}
                      <LinearGradient
                        colors={resolved.gradientHero}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={{ height: 96, padding: 12 }}
                      >
                        {/* Top shimmer */}
                        <LinearGradient
                          colors={['transparent', resolved.primary + '88', 'transparent'] as [string,string,string]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 }}
                          pointerEvents="none"
                        />
                        {/* Active badge / primary dot */}
                        <View style={{
                          width: 28, height: 28, borderRadius: 14,
                          backgroundColor: active ? resolved.primary : resolved.primary + '55',
                          alignItems: 'center', justifyContent: 'center',
                          shadowColor: resolved.primary, shadowOpacity: 0.6, shadowRadius: 8, elevation: 4,
                        }}>
                          {active
                            ? <Check color={resolved.background} size={13} strokeWidth={3} />
                            : <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: resolved.primary + 'BB' }} />
                          }
                        </View>
                        {/* Color dots at bottom-right */}
                        <View style={{ position: 'absolute', bottom: 10, right: 12, flexDirection: 'row', gap: 4 }}>
                          {[resolved.primary, resolved.secondary, resolved.primaryLight || resolved.backgroundElevated].map((c, ci) => (
                            <View key={ci} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.20)' }} />
                          ))}
                        </View>
                      </LinearGradient>
                      {/* Label area */}
                      <View style={{
                        paddingHorizontal: 12, paddingVertical: 10,
                        backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(14,12,22,0.96)',
                        borderTopWidth: 1,
                        borderTopColor: active ? resolved.primary + '44' : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'),
                      }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: active ? resolved.primary : rowTextColor, letterSpacing: -0.1, marginBottom: 2 }} numberOfLines={1}>
                          {opt?.label || themeId}
                        </Text>
                        <Text style={{ fontSize: 10, color: rowSubColor, lineHeight: 14 }} numberOfLines={1}>
                          {opt?.sub || ''}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            {/* Background style */}
            <SectionCard isLight={isLight}>
              <EntryRow
                icon={Eye}
                label="Tło sanktuarium"
                value={BACKGROUND_OPTIONS.find(b => b.id === experience.backgroundStyle)?.label || 'Subtelne niebo'}
                onPress={() => setShowBgModal(true)}
                accent={accent}
                last
                textColor={rowTextColor}
                subColor={rowSubColor}
              />
            </SectionCard>
          </Animated.View>

          {/* ══ 3. DZWIEK I HAPTYKA ══ */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <SectionHeader icon={Music} label="Dźwięk i haptyka" color={accent} />
            {/* Runtime status */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: -4, paddingHorizontal: 22 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: audioRuntimeState === 'ready' ? '#34D399' : audioRuntimeState === 'failed' ? '#F87171' : '#FBBF24' }} />
              <Text style={{ fontSize: 11, color: audioRuntimeState === 'ready' ? '#34D399' : audioRuntimeState === 'failed' ? '#F87171' : '#FBBF24', fontWeight: '600', letterSpacing: 0.5 }}>
                {audioRuntimeState === 'ready' ? 'AUDIO AKTYWNE' : audioRuntimeState === 'failed' ? 'AUDIO BŁĄD' : audioRuntimeState === 'initializing' ? 'ŁADOWANIE...' : 'AUDIO NIEAKTYWNE'}
              </Text>
            </View>
                        <View style={{ marginHorizontal: 18, marginBottom: 10, borderRadius: 20, borderWidth: 1, borderColor: accent + '28', backgroundColor: isLight ? accent + '0D' : accent + '12', padding: 16, overflow: 'hidden' }}>
              <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.8, color: accent, marginBottom: 8 }}>STUDIO DOŚWIADCZENIA</Text>
              <Text style={{ fontSize: 15, lineHeight: 23, color: rowTextColor, fontWeight: '600' }}>Tu ustawiasz nie tylko głośność. Budujesz atmosferę całej aplikacji: muzykę, pejzaż tła, sygnały dotyku i poziom ceremonialności kontaktu.</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                {['muzyka', 'ambient', 'dotyk i sygnały'].map((chip) => (
                  <View key={chip} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: accent + '30', backgroundColor: accent + '10' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: accent, letterSpacing: 0.5 }}>{chip}</Text>
                  </View>
                ))}
              </View>
              <View style={{ marginTop: 16, gap: 10 }}>
                <View style={{ borderRadius: 18, borderWidth: 1, borderColor: accent + '24', backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.04)', padding: 14 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: accent, marginBottom: 10 }}>LIVE STATUS</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['PRELOAD ' + (audioDiagnostic.preloadReady ? 'GOTOWY' : 'W TOKU'), 'MUZYKA ' + activeMusicLabel.toUpperCase(), 'AMBIENT ' + activeAmbientLabel.toUpperCase()].map((item) => (
                      <View key={item} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: accent + '28', backgroundColor: accent + '0E' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: rowTextColor, letterSpacing: 0.4 }}>{item}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={{ fontSize: 12, lineHeight: 19, color: rowSubColor, marginTop: 10 }}>{audioDiagnostic.lastAction || 'System audio czeka na pierwszą interakcję użytkownika.'}</Text>
                </View>
                <View style={{ borderRadius: 18, borderWidth: 1, borderColor: accent + '22', backgroundColor: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.04)', padding: 14 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: accent, marginBottom: 10 }}>STATUS AI</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, color: rowTextColor, fontWeight: '600' }}>Provider: {aiDiagnostic.activeProvider || 'brak aktywnego providera'}</Text>
                  <Text style={{ fontSize: 12, lineHeight: 19, color: rowSubColor, marginTop: 6 }}>Skonfigurowane klucze: {Object.entries(aiDiagnostic.hasKeys).filter(([, ok]) => ok).map(([key]) => key).join(', ') || 'brak'}.</Text>
                  <Text style={{ fontSize: 12, lineHeight: 19, color: rowSubColor, marginTop: 4 }}>Ostatnia ścieżka rozpoznania: {(aiDiagnostic.attemptedProviders || []).join(' -> ') || 'brak prób w tej sesji'}.</Text>
                </View>
              </View>
            </View>
<SectionCard isLight={isLight}>
              <ToggleRow
                icon={Music}
                label="Muzyka tła"
                value={experience.backgroundMusicEnabled}
                onToggle={() => {
                  setExperience({ backgroundMusicEnabled: !experience.backgroundMusicEnabled });
                }}
                accent={accent}
                textColor={rowTextColor}
                subColor={rowSubColor}
              />
              {/* Music volume slider */}
              <View style={{ paddingHorizontal: 18, paddingBottom: 8, opacity: experience.backgroundMusicEnabled ? 1 : 0.4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: currentTheme.textSoft }}>{t('profile.music_volume')}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: accent }}>{Math.round(musicVolume * 100)}%</Text>
                </View>
                <Slider
                  style={{ width: '100%', height: 36 }}
                  minimumValue={0} maximumValue={1} step={0.01}
                  value={musicVolume}
                  onValueChange={handleMusicVolume}
                  minimumTrackTintColor={accent}
                  maximumTrackTintColor={isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'}
                  thumbTintColor={accent}
                />
              </View>
              {/* Music category selector */}
              <View style={{ marginTop: 4, marginBottom: 4, opacity: experience.backgroundMusicEnabled ? 1 : 0.45, paddingHorizontal: 18 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: currentTheme.textSoft, marginBottom: 8 }}>STYL MUZYKI</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {MUSIC_CATEGORY_OPTIONS.map(opt => (
                    <Pressable
                      key={opt.id}
                      onPress={() => {
                      if (experience.backgroundMusicCategory === opt.id && experience.backgroundMusicEnabled) {
                        setExperience({ backgroundMusicEnabled: false });
                        void AudioService.pauseBackgroundMusic();
                      } else {
                        setExperience({ backgroundMusicEnabled: true, backgroundMusicCategory: opt.id as any });
                        void AudioService.playBackgroundMusic(opt.id as any);
                      }
                      HapticsService.selection();
                    }}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 5,
                        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1,
                        borderColor: (experience.backgroundMusicCategory === opt.id && experience.backgroundMusicEnabled) ? currentTheme.primary + '88' : currentTheme.borderLight,
                        backgroundColor: (experience.backgroundMusicCategory === opt.id && experience.backgroundMusicEnabled) ? currentTheme.primary + '18' : 'transparent',
                      }}>
                      <Text style={{ fontSize: 14 }}>{opt.emoji}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: (experience.backgroundMusicCategory === opt.id && experience.backgroundMusicEnabled) ? currentTheme.primary : currentTheme.textSoft }}>{opt.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <ToggleRow
                icon={Waves}
                label="Ambient rytuałów"
                value={ambientSoundEnabled}
                onToggle={() => { setAmbientSoundEnabled(!ambientSoundEnabled); }}
                accent={accent}
                textColor={rowTextColor}
                subColor={rowSubColor}
              />
              {/* Ambient volume slider */}
              <View style={{ paddingHorizontal: 18, paddingBottom: 8, opacity: ambientSoundEnabled ? 1 : 0.4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: currentTheme.textSoft }}>{t('profile.ambient_volume')}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: accent }}>{Math.round(ambientVolume * 100)}%</Text>
                </View>
                <Slider
                  style={{ width: '100%', height: 36 }}
                  minimumValue={0} maximumValue={1} step={0.01}
                  value={ambientVolume}
                  onValueChange={handleAmbientVolume}
                  minimumTrackTintColor={accent}
                  maximumTrackTintColor={isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'}
                  thumbTintColor={accent}
                />
              </View>
              {/* Soundscape selector */}
              <View style={{ marginTop: 4, marginBottom: 4, opacity: ambientSoundEnabled ? 1 : 0.45, paddingHorizontal: 18 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: currentTheme.textSoft, marginBottom: 8 }}>KRAJOBRAZ DŹWIĘKOWY</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {SOUNDSCAPE_OPTIONS.map(opt => (
                    <Pressable
                      key={opt.id}
                      onPress={() => {
                      if (experience.ambientSoundscape === opt.id && ambientSoundEnabled) {
                        setAmbientSoundEnabled(false);
                        void AudioService.pauseAmbientSound();
                      } else {
                        setAmbientSoundEnabled(true);
                        setExperience({ ambientSoundscape: opt.id as any });
                        void AudioService.playAmbientSound(opt.id as any);
                      }
                      HapticsService.selection();
                    }}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 5,
                        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1,
                        borderColor: (experience.ambientSoundscape === opt.id && ambientSoundEnabled) ? currentTheme.primary + '88' : currentTheme.borderLight,
                        backgroundColor: (experience.ambientSoundscape === opt.id && ambientSoundEnabled) ? currentTheme.primary + '18' : 'transparent',
                      }}>
                      <Text style={{ fontSize: 14 }}>{opt.emoji}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: (experience.ambientSoundscape === opt.id && ambientSoundEnabled) ? currentTheme.primary : currentTheme.textSoft }}>{opt.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <ToggleRow
                icon={Sparkles}
                label="Dźwięki dotyku"
                value={experience.touchSoundEnabled}
                onToggle={() => setExperience({ touchSoundEnabled: !experience.touchSoundEnabled })}
                accent={accent}
                textColor={rowTextColor}
                subColor={rowSubColor}
              />
              <ToggleRow
                icon={RotateCcw}
                label="Sygnał domknięcia rytuału"
                value={experience.ritualCompletionSoundEnabled}
                onToggle={() => setExperience({ ritualCompletionSoundEnabled: !experience.ritualCompletionSoundEnabled })}
                accent={accent}
                textColor={rowTextColor}
                subColor={rowSubColor}
              />
              <ToggleRow
                icon={Vibrate}
                label="Haptyka"
                value={experience.hapticsEnabled}
                onToggle={() => setExperience({ hapticsEnabled: !experience.hapticsEnabled })}
                accent={accent}
                textColor={rowTextColor}
                subColor={rowSubColor}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, paddingHorizontal: 2 }}>
                <Pressable
                  onPress={() => { HapticsService.impact('medium'); }}
                  style={{
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
                    borderColor: currentTheme.primary + '44', backgroundColor: currentTheme.primary + '12',
                  }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: currentTheme.primary, letterSpacing: 0.5 }}>{tr('profile.testHaptics', 'TESTUJ HAPTYKĘ', 'TEST HAPTICS')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => { void AudioService.playRitualCompletionTone(); }}
                  style={{
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
                    borderColor: currentTheme.primary + '44', backgroundColor: currentTheme.primary + '12',
                  }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: currentTheme.primary, letterSpacing: 0.5 }}>{tr('profile.testSound', 'TESTUJ DŹWIĘK', 'TEST SOUND')}</Text>
                </Pressable>
              </View>
              {/* ── Narrator voice selector ── */}
              <View style={{ paddingHorizontal: 2, paddingTop: 12, paddingBottom: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: currentTheme.textSoft, marginBottom: 4 }}>{tr('profile.voiceHeading', 'GŁOS LEKTORA', 'VOICE GUIDE')}</Text>
                <Text style={{ fontSize: 10, color: rowSubColor, marginBottom: 10 }}>Azure Neural TTS — naturalny ludzki głos</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {[
                    { id: 'nova', label: '🎙 Zofia', sub: 'Damski · Neural' },
                    { id: 'onyx', label: '🎙 Marek', sub: 'Męski · Neural' },
                  ].map((opt) => {
                    const active = (experience.narratorVoice ?? 'nova') === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => {
                          setExperience({ narratorVoice: opt.id as any });
                          TTSService.setVoice(opt.id as any);
                          HapticsService.selection();
                        }}
                        style={{
                          flex: 1, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1,
                          borderColor: active ? accent + 'AA' : currentTheme.borderLight,
                          backgroundColor: active ? accent + '18' : 'transparent',
                          alignItems: 'center', gap: 3,
                        }}>
                        <Text style={{ fontSize: 15 }}>{opt.label.split(' ')[0]}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: active ? accent : rowTextColor }}>{opt.label.split(' ').slice(1).join(' ')}</Text>
                        <Text style={{ fontSize: 10, color: rowSubColor }}>{opt.sub}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  onPress={() => {
                    const voice = experience.narratorVoice ?? 'nova';
                    TTSService.setVoice(voice);
                    void TTSService.speak('Witaj w Aetherze. Jestem Twoim duchowym przewodnikiem.', undefined, undefined, voice);
                    HapticsService.impact('light');
                  }}
                  style={{
                    marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
                    borderColor: accent + '44', backgroundColor: accent + '0E',
                  }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: accent, letterSpacing: 0.5 }}>▶ POSŁUCHAJ PRÓBKI</Text>
                </Pressable>
              </View>
              {/* ── Text scale selector ── */}
              <View style={{ paddingHorizontal: 2, paddingTop: 12, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: currentTheme.borderLight, marginTop: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: currentTheme.textSoft, marginBottom: 10 }}>{tr('profile.textSizeHeading', 'ROZMIAR TEKSTU', 'TEXT SIZE')}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    { id: 0.85, label: 'A-', sub: 'Mały' },
                    { id: 1.0,  label: 'A',  sub: 'Standardowy' },
                    { id: 1.15, label: 'A+', sub: 'Duży' },
                  ].map((opt) => {
                    const active = (experience.textScale ?? 1.0) === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => { setExperience({ textScale: opt.id }); HapticsService.selection(); }}
                        style={{
                          flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1,
                          borderColor: active ? accent + 'AA' : currentTheme.borderLight,
                          backgroundColor: active ? accent + '18' : 'transparent',
                          alignItems: 'center', gap: 2,
                        }}>
                        <Text style={{ fontSize: active ? 17 : 14, fontWeight: '700', color: active ? accent : rowTextColor }}>{opt.label}</Text>
                        <Text style={{ fontSize: 9, color: rowSubColor, letterSpacing: 0.4 }}>{opt.sub.toUpperCase()}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <EntryRow
                icon={SlidersHorizontal}
                label="Tryb ruchu"
                value={MOTION_OPTIONS.find(m => m.id === experience.motionStyle)?.label || 'Wywazone'}
                onPress={() => setShowMotionModal(true)}
                accent={accent}
                last
                textColor={rowTextColor}
                subColor={rowSubColor}
              />
            </SectionCard>
          </Animated.View>

          {/* ══ 4. JĘZYK I PROWADZENIE ══ */}
          <Animated.View entering={FadeInDown.delay(260).duration(500)}>
            <SectionHeader icon={Globe} label={tr('profile.languageSection', 'Język i prowadzenie', 'Language & guidance')} color={accent} />
            <SectionCard isLight={isLight}>
              <EntryRow
                icon={Globe}
                label={tr('profile.languageLabel', 'Język', 'Language')}
                value={LANGUAGE_OPTIONS.find(o => o.id === language)?.native || tr('profile.languagePolish', 'Polski', 'Polish')}
                onPress={() => setShowLanguageModal(true)}
                accent={accent}
                textColor={rowTextColor}
                subColor={rowSubColor}
              />
              <EntryRow
                icon={Sparkles}
                label="Nurt guidance"
                value={GUIDANCE_OPTIONS.find(o => o.id === userData.primaryGuidanceMode)?.label || 'Mieszane'}
                onPress={() => setShowGuidanceModal(true)}
                accent={accent}
                last
                textColor={rowTextColor}
                subColor={rowSubColor}
              />
            </SectionCard>
          </Animated.View>

          {/* ══ 5. PAMIEC I ARCHIWA ══ */}
          <Animated.View entering={FadeInDown.delay(320).duration(500)}>
            <SectionHeader icon={Archive} label={tr('profile.memorySection', 'Pamięć i archiwa', 'Memory & archives')} color={accent} />
            <SectionCard isLight={isLight}>
              {entries.length === 0 ? (
                <Pressable
                  onPress={() => navigation.navigate('JournalEntry', { type: 'reflection' })}
                  style={{ marginBottom: 6, padding: 16, borderRadius: 16, backgroundColor: accent + '08', borderWidth: 1, borderColor: accent + '22', alignItems: 'center', gap: 8 }}
                >
                  <BookOpen color={accent} size={28} strokeWidth={1.5} />
                  <Typography variant="label" color={accent} style={{ textAlign: 'center' }}>Zacznij swoją podróż</Typography>
                  <Typography variant="caption" style={{ textAlign: 'center', opacity: 0.80, lineHeight: 18 }}>
                    {'Każdy wpis to ślad Twojej duszy.\nNapisz swój pierwszy wpis.'}
                  </Typography>
                  <View style={{ marginTop: 4, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: accent + '18', borderWidth: 1, borderColor: accent + '44' }}>
                    <Typography variant="microLabel" color={accent}>Napisz teraz →</Typography>
                  </View>
                </Pressable>
              ) : (
                <EntryRow icon={Book} label="Archiwum dziennika" value={`${entries.length} wpisów`} onPress={() => navigation.navigate('Journal')} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
              )}
              <EntryRow icon={BarChart2} label="Raport duszy" value="Wzory i podsumowania" onPress={() => navigation.navigate('Reports')} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
              <EntryRow icon={Star} label="Ulubione wglady" value={favoriteEntries === 0 ? 'Nic jeszcze nie zapisano' : `${favoriteEntries} zapisanych`} onPress={() => navigation.navigate('Journal')} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
              <EntryRow icon={BookOpen} label="Biblioteka wiedzy" value="Symbole i święta tradycja" onPress={() => navigation.navigate('Knowledge')} accent={accent} last textColor={rowTextColor} subColor={rowSubColor} />
            </SectionCard>
          </Animated.View>

          {/* ══ 6. CZLONKOSTWO ══ */}
          <Animated.View entering={FadeInDown.delay(380).duration(500)}>
            <SectionHeader icon={Crown} label="Członkostwo" color={accent} />
            <SectionCard isLight={isLight}>
              {isPremium ? (
                <View style={[sStyles.premiumBanner, { backgroundColor: accent + '14', borderColor: accent + '33' }]}>
                  <Crown color={accent} size={20} strokeWidth={1.8} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[sStyles.premiumBannerTitle, { color: accent }]}>Członkostwo Premium aktywne</Text>
                    <Text style={sStyles.premiumBannerSub}>Pełny dostęp do wszystkich światów i Oracle</Text>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => navigation.navigate('Paywall')}
                  style={[sStyles.premiumBanner, sStyles.premiumBannerCta, { backgroundColor: accent + '18', borderColor: accent + '44', shadowColor: accent, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }]}
                >
                  <LinearGradient colors={[accent + '28', accent + '10']} style={StyleSheet.absoluteFill} />
                  <Crown color={accent} size={20} strokeWidth={1.8} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[sStyles.premiumBannerTitle, { color: accent }]}>Odblokuj Premium</Text>
                    <Text style={sStyles.premiumBannerSub}>Głębsze sesje Oracle, bogatsze odczyty, pełna pamięć</Text>
                  </View>
                  <ChevronRight color={accent} size={18} />
                </Pressable>
              )}
            </SectionCard>
          </Animated.View>

          {/* ══ 7. POMOC I PRYWATNOSC ══ */}
          <Animated.View entering={FadeInDown.delay(440).duration(500)}>
            <SectionHeader icon={Shield} label="Pomoc i prywatność" color={accent} />
            <SectionCard isLight={isLight}>
              <EntryRow icon={HelpCircle} label="Przewodnik po Aetherze" value="Jak korzystać" onPress={() => setShowGuideModal(true)} accent={accent} textColor={rowTextColor} subColor={rowSubColor} />
              <EntryRow
                icon={ScrollText}
                label="Kolejny krok"
                value="Zapisz kierunek"
                onPress={() =>
                  navigation.navigate('JournalEntry', {
                    prompt: 'Jaki jest teraz mój najlepszy następny krok w Aetherze i czego naprawdę potrzebuję: ukojenia, wglądu, rytuału czy działania?',
                    type: 'reflection',
                  })
                }
                accent={accent}
                last
                textColor={rowTextColor}
                subColor={rowSubColor}
              />
            </SectionCard>
          </Animated.View>

          {/* STYL ODPOWIEDZI AI */}
              <View style={[sStyles.sectionCard, { marginTop: 8, marginBottom: 4 }]}>
                <Text style={[{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12, paddingHorizontal: 18, paddingTop: 14 }, { color: accent }]}>STYL ODPOWIEDZI AI</Text>
                <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                {([
                  { val: 'short', label: 'Krotko i konkretnie', desc: 'Zwiezle, szybki wglad' },
                  { val: 'medium', label: 'Wywazone', desc: 'Balans glebi i skrotowosci' },
                  { val: 'deep', label: 'Gleboko i szczegolowo', desc: 'Pelne interpretacje z kontekstem' },
                ] as const).map((opt) => {
                  const isAct = (experience.aiResponseLength ?? 'medium') === opt.val;
                  return (
                    <Pressable
                      key={opt.val}
                      onPress={() => setExperience({ aiResponseLength: opt.val })}
                      style={[sStyles.aiLengthOption, {
                        borderColor: isAct ? accent : accent + '22',
                        backgroundColor: isAct ? accent + '12' : 'transparent',
                        marginBottom: 8,
                      }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[sStyles.aiLengthLabel, { color: isAct ? accent : rowTextColor }]}>{opt.label}</Text>
                        <Text style={[sStyles.aiLengthDesc, { color: rowSubColor }]}>{opt.desc}</Text>
                      </View>
                      {isAct && <View style={[sStyles.aiLengthDot, { backgroundColor: accent }]} />}
                    </Pressable>
                  );
                })}
                </View>
              </View>
          <EndOfContentSpacer size="standard" />
        
              </ScrollView>
      </SafeAreaView>

      {/* ══ MODALS ══ */}


      {/* Tlo */}
      <BottomModal visible={showBgModal} onClose={() => setShowBgModal(false)} title="Tło sanktuarium" accent={accent}>
        {BACKGROUND_OPTIONS.map(opt => {
          const active = experience.backgroundStyle === opt.id;
          return (
            <Pressable key={opt.id} onPress={() => { setExperience({ backgroundStyle: opt.id }); setShowBgModal(false); }}
              style={[sStyles.modalOption, active && { borderColor: accent + '66', backgroundColor: accent + '10' }]}>
              <Text style={[sStyles.modalOptionLabel, { flex: 1 }, active && { color: accent }]}>{opt.label}</Text>
              {active && <Check color={accent} size={18} />}
            </Pressable>
          );
        })}
      </BottomModal>

      {/* Tryb ruchu */}
      <BottomModal visible={showMotionModal} onClose={() => setShowMotionModal(false)} title="Tryb ruchu" accent={accent}>
        {MOTION_OPTIONS.map(opt => {
          const active = experience.motionStyle === opt.id;
          return (
            <Pressable key={opt.id} onPress={() => { setExperience({ motionStyle: opt.id as any }); setShowMotionModal(false); }}
              style={[sStyles.modalOption, active && { borderColor: accent + '66', backgroundColor: accent + '10' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[sStyles.modalOptionLabel, active && { color: accent }]}>{opt.label}</Text>
                <Text style={sStyles.modalOptionSub}>{opt.sub}</Text>
              </View>
              {active && <Check color={accent} size={18} />}
            </Pressable>
          );
        })}
      </BottomModal>

      {/* Jezyk */}
      <BottomModal visible={showLanguageModal} onClose={() => setShowLanguageModal(false)} title="Język" accent={accent}>
        {LANGUAGE_OPTIONS.map(opt => {
          const active = language === opt.id;
          return (
            <Pressable key={opt.id} onPress={() => { setLanguage(opt.id); setShowLanguageModal(false); }}
              style={[sStyles.modalOption, active && { borderColor: accent + '66', backgroundColor: accent + '10' }]}>
              <Text style={[sStyles.modalOptionLabel, { flex: 1 }, active && { color: accent }]}>{opt.native}</Text>
              {active && <Check color={accent} size={18} />}
            </Pressable>
          );
        })}
      </BottomModal>

      {/* Guidance */}
      <BottomModal visible={showGuidanceModal} onClose={() => setShowGuidanceModal(false)} title="Nurt guidance" accent={accent}>
        {GUIDANCE_OPTIONS.map(opt => {
          const active = userData.primaryGuidanceMode === opt.id;
          return (
            <Pressable key={opt.id} onPress={() => { setUserData({ primaryGuidanceMode: opt.id as any }); setShowGuidanceModal(false); }}
              style={[sStyles.modalOption, active && { borderColor: accent + '66', backgroundColor: accent + '10' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[sStyles.modalOptionLabel, active && { color: accent }]}>{opt.label}</Text>
                <Text style={sStyles.modalOptionSub}>{opt.sub}</Text>
              </View>
              {active && <Check color={accent} size={18} />}
            </Pressable>
          );
        })}
      </BottomModal>

      {/* Talia tarota */}
      <BottomModal visible={showTarotDeckModal} onClose={() => setShowTarotDeckModal(false)} title="Talia tarota" accent={accent}>
        {TAROT_DECKS.map(deck => {
          const active = selectedDeckId === deck.id;
          return (
            <Pressable key={deck.id} onPress={() => { setSelectedDeck(deck.id); setShowTarotDeckModal(false); }}
              style={[sStyles.modalOption, active && { borderColor: accent + '66', backgroundColor: accent + '10' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[sStyles.modalOptionLabel, active && { color: accent }]}>{deck.name}</Text>
                {deck.description ? <Text style={sStyles.modalOptionSub} numberOfLines={1}>{deck.description}</Text> : null}
              </View>
              {active && <Check color={accent} size={18} />}
            </Pressable>
          );
        })}
      </BottomModal>

      {/* Avatar */}
      <BottomModal visible={showAvatarModal} onClose={() => setShowAvatarModal(false)} title="Portret sanktuarium" accent={accent}>
        <View style={sStyles.avatarPreview}>
          <ProfileAvatar
            uri={userData.avatarUri}
            name={firstName}
            fallbackText={firstName.charAt(0).toUpperCase()}
            size={90}
            primary={accent}
            borderColor={accent + '44'}
            backgroundColor={isLight ? '#FFF8EE' : '#1A2236'}
            textColor={accent}
          />
        </View>
        <Pressable onPress={handlePickAvatar} disabled={avatarBusy}
          style={[sStyles.modalOption, { borderColor: accent + '44', backgroundColor: accent + '10' }]}>
          <ImagePlus color={accent} size={18} strokeWidth={1.8} />
          <Text style={[sStyles.modalOptionLabel, { flex: 1, marginLeft: 14, color: accent }]}>
            {hasAvatar ? 'Zmień zdjęcie' : 'Wybierz zdjęcie'}
          </Text>
        </Pressable>
        {hasAvatar && (
          <Pressable onPress={handleRemoveAvatar}
            style={[sStyles.modalOption, { borderColor: 'rgba(200,100,90,0.3)', backgroundColor: 'rgba(200,100,90,0.06)' }]}>
            <Text style={[sStyles.modalOptionLabel, { flex: 1, color: '#C66961' }]}>Usuń portret</Text>
          </Pressable>
        )}
      </BottomModal>

      {/* Przewodnik */}
      <BottomModal visible={showGuideModal} onClose={() => setShowGuideModal(false)} title="Przewodnik po Aetherze" accent={accent}>
        {[
          ['Dzisiaj', 'Twój osobisty pulpit dnia z energią, tonem i dwoma ruchami.'],
          ['Światy', 'Osiem domen: Tarot, Horoskop, Astrologia, Rytuał, Oczyszczanie, Wsparcie, Oracle, Sen.'],
          ['Oracle', 'Inteligentna rozmowa prowadząca do konkretnego kroku.'],
          ['Profil', 'Centrum ustawień, archiwów i pamięci sanktuarium.'],
        ].map(([title, copy]) => (
          <View key={title} style={[sStyles.guideRow, { borderBottomColor: isLight ? 'rgba(169,122,57,0.1)' : 'rgba(255,255,255,0.12)' }]}>
            <Text style={[sStyles.guideTitle, { color: accent }]}>{title}</Text>
            <Text style={sStyles.guideCopy}>{copy}</Text>
          </View>
        ))}
      </BottomModal>

    </View>
  );
};

// ── Style ─────────────────────────────────────────────────────
const sStyles = StyleSheet.create({
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 },
  sectionBlock: { marginBottom: 24 },
  aiLengthOption: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1, marginBottom: 8,
  },
  aiLengthLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  aiLengthDesc: { fontSize: 12 },
  aiLengthDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  sectionDesc: { fontSize: 12, lineHeight: 18 },
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 0, gap: 0 },

  // Hero
  heroWrap: { marginBottom: 16, overflow: 'hidden' },
  heroBg: { ...StyleSheet.absoluteFillObject },
  avatarWrap: { alignSelf: 'center', marginTop: 36, marginBottom: 18, position: 'relative' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  heroInfo: { alignItems: 'center', paddingHorizontal: 24, gap: 6, paddingBottom: 4 },
  heroName: { fontSize: 30, fontWeight: '300', letterSpacing: -0.8, lineHeight: 36 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginTop: 8 },
  heroSign: { fontSize: 15, fontWeight: '600', letterSpacing: 0.4 },
  heroArchetype: { fontSize: 13, opacity: 0.88 },
  heroSub: { fontSize: 13, marginTop: 4, opacity: 0.82, letterSpacing: 0.1 },
  statsStrip: { flexDirection: 'row', marginTop: 24, borderTopWidth: 1, paddingTop: 18, paddingBottom: 22, paddingHorizontal: 12, gap: 4 },
  statItem: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 8, borderRadius: 12 },
  statVal: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, opacity: 0.85, letterSpacing: 0.4 },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingTop: 28, paddingBottom: 12 },
  sectionIconWrap: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sectionHeaderText: { fontSize: 12, fontWeight: '700', letterSpacing: 1.8 },
  sectionCard: { marginHorizontal: 18, marginBottom: 4, borderRadius: 20, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 8, overflow: 'hidden' },

  // Entry row
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, minHeight: 60 },
  entryRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(169,122,57,0.08)' },
  entryIcon: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  entryText: { flex: 1, marginLeft: 14 },
  entryLabel: { fontSize: 14, fontWeight: '500', letterSpacing: -0.1 },
  entryValue: { fontSize: 13, marginTop: 2, opacity: 0.92 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, borderWidth: 1, marginRight: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  // Premium banner
  premiumBanner: { flexDirection: 'row', alignItems: 'center', margin: 4, padding: 20, borderRadius: 18, borderWidth: 1 },
  premiumBannerCta: {},
  premiumBannerTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  premiumBannerSub: { fontSize: 12, color: '#8A7060', marginTop: 3 },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: '#FAF6EE',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 12,
    maxHeight: '85%',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30, shadowOffset: { width: 0, height: -8 },
  },
  modalHandle: { width: 40, height: 4, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.12)', alignSelf: 'center', marginBottom: 16 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1A1410', letterSpacing: -0.2 },
  modalOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(169,122,57,0.15)',
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
  },
  modalOptionLabel: { fontSize: 15, fontWeight: '500', color: '#1A1410' },
  modalOptionSub: { fontSize: 12, color: '#8A7060', marginTop: 3 },
  themeSwatches: { flexDirection: 'row', gap: 4 },
  swatch: { width: 18, height: 18, borderRadius: 9, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },

  // Avatar modal
  avatarPreview: { alignItems: 'center', paddingVertical: 20 },

  // Guide
  guideRow: { paddingVertical: 16, borderBottomWidth: 1 },
  guideTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3, marginBottom: 4 },
  guideCopy: { fontSize: 14, color: '#5A4A38', lineHeight: 21 },
});
