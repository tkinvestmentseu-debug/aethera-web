import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Keyboard, Platform, Pressable, ScrollView, StyleSheet, View, Share } from 'react-native';
import { MysticalInput } from '../components/MysticalInput';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle as SvgCircle, Ellipse as TwinEllipse } from 'react-native-svg';
import { ArrowRight, Calendar, ChevronLeft, Clock3, Heart, MapPin, RotateCcw, Sparkles, Users, Star } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, luxury, screenContracts } from '../core/theme/designSystem';
import { Typography } from '../components/Typography';
import { StarBackground } from '../components/StarBackground';
import { calculateCompatibility, getEnergyMeaning } from '../features/matrix/utils/numerology';
import { MatrixChart } from '../features/matrix/components/MatrixChart';
import { useKeyboardOpen } from '../hooks/useKeyboardOpen';
import { goBackOrToMainTab, navigateToDashboardSurface } from '../navigation/navigationFallbacks';
import { PremiumDatePickerSheet } from '../components/PremiumDatePickerSheet';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { AiService } from '../core/services/ai.service';
import { buildCompatibilityShareMessage } from '../core/utils/share';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { useTheme } from '../core/hooks/useTheme';
const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);

const TWIN_STARS = [
  [-85,-75],[-55,-95],[25,-105],[75,-82],[98,-42],[102,12],[88,52],[60,82],
  [12,100],[-42,97],[-82,66],[-102,22],[-97,-22],[-78,-58],[42,-90],[90,32],
];

const TwinOrbit3D = React.memo(({ accent }: { accent: string }) => {
  const orbit1 = useSharedValue(0);
  const orbit2 = useSharedValue(180);
  const tiltX  = useSharedValue(-15);
  const tiltY  = useSharedValue(0);

  useEffect(() => {
    orbit1.value = withRepeat(withTiming(360, { duration: 9000, easing: Easing.linear }), -1, false);
    orbit2.value = withRepeat(withTiming(540, { duration: 9000, easing: Easing.linear }), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-22, Math.min(22, -15 + e.translationY * 0.25));
      tiltY.value = Math.max(-22, Math.min(22, e.translationX * 0.25));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-15, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }],
  }));

  const soul1Props = useAnimatedProps(() => ({
    cx: 72 * Math.cos(orbit1.value * Math.PI / 180),
    cy: 30 * Math.sin(orbit1.value * Math.PI / 180),
  }));
  const soul2Props = useAnimatedProps(() => ({
    cx: 72 * Math.cos(orbit2.value * Math.PI / 180),
    cy: 30 * Math.sin(orbit2.value * Math.PI / 180),
  }));

  return (
    <View style={{ alignItems: 'center', marginVertical: 14 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }, containerStyle]}>
          <Svg width={220} height={220} viewBox="-110 -110 220 220">
            <SvgCircle cx={0} cy={0} r={95} fill={accent} opacity={0.04} />
            {TWIN_STARS.map(([x, y], i) => (
              <SvgCircle key={i} cx={x} cy={y} r={i % 4 === 0 ? 1.8 : 0.9} fill="#fff" opacity={0.25 + (i % 3) * 0.1} />
            ))}
            <TwinEllipse cx={0} cy={0} rx={72} ry={30} fill="none" stroke={accent + '44'} strokeWidth={1} strokeDasharray="4 6" />
            <SvgCircle cx={0} cy={0} r={20} fill={accent} opacity={0.18} />
            <SvgCircle cx={0} cy={0} r={10} fill={accent} opacity={0.5} />
            <AnimatedSvgCircle animatedProps={soul1Props} r={10} fill={accent} opacity={0.9} />
            <AnimatedSvgCircle animatedProps={soul2Props} r={10} fill="#FF88CC" opacity={0.85} />
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

type SessionPartner = {
  name: string;
  birthDate: string;
  birthPlace?: string;
  birthTime?: string;
  gender?: 'on' | 'ona';
};

export const CompatibilityScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const localeCode = i18n.language?.startsWith('en') ? 'en-US' : 'pl-PL';
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const keyboardOpen = useKeyboardOpen();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const aiAvailable = AiService.isLaunchAvailable();
  const aiState = AiService.getLaunchAvailabilityState();

  const [partnerName, setPartnerName] = useState('');
  const [partnerGender, setPartnerGender] = useState<'on' | 'ona'>('ona');
  const [partnerBirthDate, setPartnerBirthDate] = useState('');
  const [partnerBirthPlace, setPartnerBirthPlace] = useState('');
  const [hasBirthTime, setHasBirthTime] = useState(false);
  const [birthTimeValue, setBirthTimeValue] = useState(() => new Date(1994, 5, 15, 12, 0));
  const [pickerMode, setPickerMode] = useState<'birthDate' | 'birthTime' | null>(null);
  const [sessionPartner, setSessionPartner] = useState<SessionPartner | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // dynamic colors
  const textColor   = isLight ? '#1A1A2E' : '#F0EBE2';
  const subColor    = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(240,235,226,0.65)';
  const dividerColor = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)';
  const surfaceBg   = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const surfaceBorder = isLight ? 'rgba(122,95,54,0.14)' : 'rgba(255,255,255,0.07)';
  const accentBg    = isLight ? currentTheme.primary + '12' : currentTheme.primary + '16';

  const focusIntoView = (y: number) => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - 140), animated: true }), 180);
  };

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => setKeyboardHeight(e.endCoordinates.height));
    const hide  = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  React.useEffect(() => {
    const seededName = route?.params?.seededPartnerName;
    const seededBirthDate = route?.params?.seededPartnerBirthDate;
    if (typeof seededName === 'string' && seededName && !partnerName) setPartnerName(seededName);
    if (typeof seededBirthDate === 'string' && seededBirthDate && !partnerBirthDate) setPartnerBirthDate(seededBirthDate);
  }, [partnerBirthDate, partnerName, route?.params?.seededPartnerBirthDate, route?.params?.seededPartnerName]);

  const birthTime = useMemo(() => {
    if (!hasBirthTime) return '';
    const hours = String(birthTimeValue.getHours()).padStart(2, '0');
    const minutes = String(birthTimeValue.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }, [hasBirthTime, birthTimeValue]);

  const compatibility = useMemo(() => {
    if (!userData.birthDate || !sessionPartner?.birthDate) return null;
    return calculateCompatibility(userData.birthDate, sessionPartner.birthDate);
  }, [sessionPartner, userData.birthDate]);

  const relationAreas = useMemo(() => {
    if (!compatibility) return null;
    const { center, right, top, bottom, left } = compatibility;
    return {
      milosc:       Math.min(99, Math.max(44, Math.round((center / 22) * 55 + (right / 22) * 30 + 14))),
      komunikacja:  Math.min(99, Math.max(44, Math.round((right / 22) * 55 + (top / 22) * 30 + 14))),
      wartosci:     Math.min(99, Math.max(44, Math.round((bottom / 22) * 55 + (left / 22) * 30 + 14))),
      wzrost:       Math.min(99, Math.max(44, Math.round((top / 22) * 55 + (center / 22) * 30 + 14))),
    };
  }, [compatibility]);

  const startSession = () => {
    if (!partnerName.trim() || !partnerBirthDate) return;
    setSessionPartner({
      name: partnerName.trim(),
      birthDate: partnerBirthDate,
      birthPlace: partnerBirthPlace.trim(),
      gender: partnerGender,
      birthTime,
    });
  };

  const resetSession = () => {
    setSessionPartner(null);
    setPartnerName('');
    setPartnerBirthDate('');
    setPartnerBirthPlace('');
    setHasBirthTime(false);
  };

  const partnerContext = sessionPartner
    ? [
        new Date(sessionPartner.birthDate).toLocaleDateString(localeCode),
        sessionPartner.birthPlace || null,
        sessionPartner.birthTime || null,
      ].filter(Boolean).join(' • ')
    : '';

  const relationshipNarrative = compatibility
    ? [
        `Centrum ${compatibility.center} pokazuje główny ton tej relacji. ${getEnergyMeaning(compatibility.center)} Między Wami najwięcej dzieje się tam, gdzie oboje próbujecie odzyskać spokój, wpływ lub bezpieczeństwo na swój własny sposób.`,
        `Oś relacji ${compatibility.right} opisuje, jak szybko rodzi się bliskość i gdzie najłatwiej o niedopowiedzenia. To nie jest wyrok o zgodności, tylko mapa tego, jak rozmawiać, kiedy napięcie rośnie.`,
        `Energia wspólnego działania ${compatibility.top} pokazuje, jak razem uruchamiacie ruch, decyzje i kierunek. Lekcja ${compatibility.bottom} przypomina, czego nie wolno spychać pod dywan, jeśli ta więź ma pozostać żywa i czytelna.`,
      ]
    : [];

  const compatibilityQuestions = compatibility && sessionPartner
    ? [
        `Co między nami najbardziej potrzebuje nazwania, jeśli wibracja relacji to ${compatibility.center}?`,
        `Jak rozmawiać z ${sessionPartner.name}, gdy aktywuje się oś relacji ${compatibility.right}?`,
        `Jaki spokojny krok pomoże nam pracować z lekcją ${compatibility.bottom} bez eskalacji?`,
      ]
    : [];

  const handleShare = async () => {
    if (!compatibility || !sessionPartner) return;
    await Share.share({
      message: buildCompatibilityShareMessage(
        sessionPartner.name,
        `Wibracja relacji ${compatibility.center}. ${getEnergyMeaning(compatibility.center)}`,
        relationshipNarrative,
      ),
    });
  };

  // Nav row items for "Co zrobić dalej"
  const nextStepNavRows = compatibility && sessionPartner ? [
    {
      key: 'journal',
      label: t('compatibility.zapisz_refleksje', 'Zapisz refleksję'),
      desc: t('compatibility.otworz_dziennik', 'Otwórz dziennik z gotowym pytaniem'),
      onPress: () => navigation.navigate('JournalEntry', {
        prompt: `Analizuję zgodność z osobą o imieniu ${sessionPartner?.name}. Wspólne centrum relacji daje ${compatibility.center}, oś relacji ${compatibility.right}, energia działania ${compatibility.top}, lekcja ${compatibility.bottom}.\n\n${compatibilityQuestions[0] ?? ''}`,
        type: 'reflection',
      }),
    },
    {
      key: 'numerology',
      label: 'Numerologia partnerska',
      desc: 'Sprawdź liczby tej relacji',
      onPress: () => navigation.navigate('Numerology'),
    },
    {
      key: 'partnerHoroscope',
      label: 'Partnerowy horoskop',
      desc: 'Astrologia tej więzi',
      onPress: () => navigation.navigate('PartnerHoroscope'),
    },
    {
      key: 'partnerMatrix',
      label: 'Matryca relacji',
      desc: 'Pogłębiony obraz energii',
      onPress: () => navigation.navigate('PartnerMatrix'),
    },
    {
      key: 'partnerTarot',
      label: 'Tarot relacyjny',
      desc: 'Karty dla tej pary',
      onPress: () => navigation.navigate('PartnerTarot'),
    },
    {
      key: 'share',
      label: t('compatibility.udostepnij_obraz', 'Udostępnij obraz relacji'),
      desc: t('compatibility.podziel_sie', 'Podziel się wynikiem'),
      onPress: handleShare,
    },
  ] : [];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient colors={currentTheme.gradientHero} style={StyleSheet.absoluteFill} />
      <StarBackground />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0}
          style={styles.safeArea}
        >
          <View style={styles.safeArea}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={[
                styles.scrollContent,
                !compatibility && { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 16 : screenContracts.bottomInset(insets.bottom, 'detail') + 66 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            >
              {/* ── Header ── */}
              <View style={styles.header}>
                <Pressable onPress={() => {
                  if (navigation.canGoBack()) { navigation.goBack(); return; }
                  navigateToDashboardSurface(navigation, 'horoscope');
                }} style={styles.backBtn} hitSlop={20}>
                  <ChevronLeft color={currentTheme.primary} size={30} strokeWidth={1.5} />
                </Pressable>
                <View style={styles.headerCopy}>
                  <Typography variant="premiumLabel" color={currentTheme.primary} style={styles.headerLabel}>{t('compatibility.relacje', 'Relacje')}</Typography>
                  <Typography variant="screenTitle">{t('compatibility.zgodnosc_energetyczna', 'Zgodność energetyczna')}</Typography>
                </View>
                <Pressable
                  onPress={() => { if (isFavoriteItem('compatibility')) { removeFavoriteItem('compatibility'); } else { addFavoriteItem({ id: 'compatibility', label: t('compatibility.zgodnosc', 'Zgodność'), sublabel: t('compatibility.zgodnosc_energetyczna', 'Zgodność energetyczna'), route: 'Compatibility', params: {}, icon: 'Heart', color: currentTheme.primary, addedAt: new Date().toISOString() }); } }}
                  style={[styles.backBtn, { alignItems: 'center', justifyContent: 'center' }]}
                  hitSlop={12}
                >
                  <Star color={isFavoriteItem('compatibility') ? currentTheme.primary : currentTheme.primary + '88'} size={18} strokeWidth={1.8} fill={isFavoriteItem('compatibility') ? currentTheme.primary : 'none'} />
                </Pressable>
              </View>

              {/* ── TwinOrbit3D hero — always prominent ── */}
              <TwinOrbit3D accent={currentTheme.primary} />

              {!compatibility ? (
                <Animated.View entering={FadeInDown.duration(800)}>

                  {/* ── Intro: clean italic description, no card box ── */}
                  <View style={styles.introSection}>
                    <Typography variant="premiumLabel" color={currentTheme.primary} style={{ marginBottom: 10 }}>{t('compatibility.sesja_polaczenia', 'Sesja połączenia')}</Typography>
                    <Typography variant="bodySmall" style={[styles.introCopy, { color: subColor }]}>
                      {t('compatibility.to_chwilowa_sesja_zgodnosci_wpisz', 'To chwilowa sesja zgodności. Wpisz tylko dane tej osoby — Aethera nie tworzy z nich nowego profilu ani nie nadpisuje Twojego kontekstu.')}
                    </Typography>
                  </View>

                  {/* ── Premium divider ── */}
                  <View style={[styles.premiumDivider, { backgroundColor: dividerColor }]} />

                  {/* ── Form: ritual of connection ── */}
                  <View style={styles.ritualForm}>

                    {/* icon circle + heading */}
                    <View style={[styles.formIconCircle, { borderColor: surfaceBorder, backgroundColor: accentBg }]}>
                      <Users color={currentTheme.primary} size={32} strokeWidth={1.5} />
                    </View>
                    <Typography variant="subtitle" style={[styles.formTitle, { color: textColor }]}>
                      {t('compatibility.dodaj_osobe', 'Dodaj osobę, z którą chcesz sprawdzić połączenie')}
                    </Typography>

                    {/* Gender selector */}
                    <View style={{ width: '100%', marginBottom: 20 }}>
                      <Typography variant="microLabel" color={currentTheme.primary} style={{ marginBottom: 10 }}>{t('compatibility.plec_partnera', 'Płeć partnera')}</Typography>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        {(['on', 'ona'] as const).map(g => (
                          <Pressable key={g} onPress={() => setPartnerGender(g)}
                            style={{
                              flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
                              alignItems: 'center',
                              borderColor: partnerGender === g ? currentTheme.primary : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.10)'),
                              backgroundColor: partnerGender === g ? accentBg : 'transparent',
                            }}>
                            <Typography variant="bodySmall" color={partnerGender === g ? currentTheme.primary : subColor}>
                              {g === 'on' ? '♂ On' : '♀ Ona'}
                            </Typography>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    {/* Name */}
                    <View style={styles.inputGroup}>
                      <Typography variant="label" style={[styles.fieldLabel, { color: textColor }]}>{t('compatibility.imie', 'Imię')}</Typography>
                      <MysticalInput
                        value={partnerName}
                        onChangeText={setPartnerName}
                        placeholder={t('compatibility.imie_tej_osoby', 'Imię tej osoby')}
                        placeholderTextColor={currentTheme.textMuted}
                        returnKeyType="done"
                        onFocusScroll={() => focusIntoView(180)}
                        style={{ color: currentTheme.text }}
                      />
                    </View>

                    {/* Birth date */}
                    <View style={styles.inputGroup}>
                      <Typography variant="label" style={[styles.fieldLabel, { color: textColor }]}>{t('compatibility.data_urodzenia', 'Data urodzenia')}</Typography>
                      <Pressable style={[luxury.input(currentTheme), styles.infoTrigger]} onPress={() => setPickerMode('birthDate')}>
                        <Calendar color={currentTheme.primary} size={20} strokeWidth={1.5} />
                        <Typography variant="bodyRefined" style={{ color: partnerBirthDate ? currentTheme.text : currentTheme.textMuted }}>
                          {partnerBirthDate ? new Date(partnerBirthDate).toLocaleDateString(localeCode) : t('compatibility.wybierz_date', 'Wybierz datę')}
                        </Typography>
                      </Pressable>
                    </View>

                    {/* Birth place */}
                    <View style={styles.inputGroup}>
                      <Typography variant="label" style={[styles.fieldLabel, { color: textColor }]}>{t('compatibility.miejsce_urodzenia', 'Miejsce urodzenia')}</Typography>
                      <MysticalInput
                        value={partnerBirthPlace}
                        onChangeText={setPartnerBirthPlace}
                        placeholder={t('compatibility.opcjonalnie', 'Opcjonalnie, jeśli je znasz')}
                        placeholderTextColor={currentTheme.textMuted}
                        returnKeyType="done"
                        onFocusScroll={() => focusIntoView(380)}
                        style={{ color: currentTheme.text }}
                      />
                    </View>

                    {/* Birth time */}
                    <View style={styles.inputGroup}>
                      <View style={styles.timeHeader}>
                        <Typography variant="label" style={[styles.fieldLabel, { color: textColor }]}>{t('compatibility.godzina_urodzenia', 'Godzina urodzenia')}</Typography>
                        <Pressable
                          style={[styles.timeChip, hasBirthTime && { borderColor: currentTheme.primary, backgroundColor: accentBg }]}
                          onPress={() => setHasBirthTime((value) => !value)}
                        >
                          <Typography variant="microLabel" color={hasBirthTime ? currentTheme.primary : subColor}>
                            {hasBirthTime ? 'Dodana' : 'Opcjonalna'}
                          </Typography>
                        </Pressable>
                      </View>
                      {hasBirthTime ? (
                        <Pressable style={[luxury.input(currentTheme), styles.infoTrigger]} onPress={() => setPickerMode('birthTime')}>
                          <Clock3 color={currentTheme.primary} size={20} strokeWidth={1.5} />
                          <Typography variant="bodyRefined">{birthTime}</Typography>
                        </Pressable>
                      ) : (
                        // inline note — no card wrapper
                        <Typography variant="bodySmall" style={[styles.optionalNote, { color: subColor }]}>
                          {t('compatibility.gdy_ja_znasz', 'Gdy ją znasz, pomoże dodać subtelniejszy kontekst astrologiczny do relacji. Do podstawowej zgodności nie jest wymagana.')}
                        </Typography>
                      )}
                    </View>
                  </View>
                </Animated.View>
              ) : (
                <Animated.View entering={FadeInUp.duration(800)} style={styles.resultsContainer}>

                  {/* ── Context: partner info — clean section ── */}
                  <View style={styles.contextSection}>
                    <View style={[styles.contextAccent, { backgroundColor: currentTheme.primary }]} />
                    <View style={{ flex: 1 }}>
                      <Typography variant="premiumLabel" color={currentTheme.primary} style={{ marginBottom: 6 }}>{t('compatibility.kontekst_tej_osoby', 'Kontekst tej osoby')}</Typography>
                      <Typography variant="subtitle" style={[styles.contextName, { color: textColor }]}>{sessionPartner?.name}</Typography>
                      {!!partnerContext && (
                        <Typography variant="bodySmall" style={[styles.contextMeta, { color: subColor }]}>{partnerContext}</Typography>
                      )}
                    </View>
                  </View>

                  <View style={[styles.premiumDivider, { backgroundColor: dividerColor }]} />

                  {/* ── Compat deck: subtle surface for numbers ── */}
                  <View style={[styles.compatDeck, { backgroundColor: surfaceBg, borderColor: surfaceBorder }]}>
                    <Typography variant="premiumLabel" color={currentTheme.primary} style={{ marginBottom: 6 }}>{t('compatibility.rdzen_sesji', 'Rdzeń tej sesji relacyjnej')}</Typography>
                    <Typography variant="bodySmall" style={[styles.compatLead, { color: subColor }]}>
                      {t('compatibility.to_nie_jest_suchy', 'To nie jest suchy wynik zgodności. To mapa napięcia, przyciągania i bezpiecznego rytmu.')}
                    </Typography>
                    <View style={[styles.compatDivider, { backgroundColor: dividerColor }]} />
                    <View style={styles.compatGrid}>
                      {[
                        { label: 'Centrum', value: compatibility.center },
                        { label: t('compatibility.relacje', 'Relacje'), value: compatibility.right },
                        { label: t('compatibility.lekcja', 'Lekcja'), value: compatibility.bottom },
                      ].map((item, idx) => (
                        <View key={item.label} style={[
                          styles.compatTile,
                          idx < 2 && { borderRightWidth: 1, borderRightColor: dividerColor },
                        ]}>
                          <Typography variant="microLabel" color={currentTheme.primary}>{item.label}</Typography>
                          <Typography variant="cardTitle" style={[{ marginTop: 8 }, { color: textColor }]}>{item.value}</Typography>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* ── Pair names ── */}
                  <View style={styles.pairNames}>
                    <Typography variant="subtitle" style={[styles.pairName, { color: textColor }]}>{userData.name?.trim() || 'Ty'}</Typography>
                    <View style={[styles.heartWrapper, { borderColor: surfaceBorder, backgroundColor: accentBg }]}>
                      <Heart color={currentTheme.primary} fill={currentTheme.primary} size={24} />
                    </View>
                    <Typography variant="subtitle" style={[styles.pairName, { color: textColor }]}>{partnerGender === 'on' ? '♂ ' : '♀ '}{sessionPartner?.name}</Typography>
                  </View>

                  {/* ── Matrix chart ── */}
                  <View style={styles.chartWrapper}>
                    <MatrixChart energies={compatibility} />
                  </View>

                  <View style={[styles.premiumDivider, { backgroundColor: dividerColor }]} />

                  {/* ── Result: clean large number display ── */}
                  <View style={styles.resultSection}>
                    <View style={styles.resultRow}>
                      <View style={[styles.resultIconBox, { backgroundColor: accentBg }]}>
                        <Sparkles color={currentTheme.primary} size={22} strokeWidth={1.5} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="microLabel" color={currentTheme.primary} style={{ marginBottom: 4 }}>{t('compatibility.energia_tej_relacji', 'Energia tej relacji')}</Typography>
                        <Typography variant="cardTitle" color={currentTheme.primary}>Wibracja {compatibility.center}</Typography>
                      </View>
                    </View>
                    <Typography variant="bodyRefined" style={[styles.resultBody, { color: subColor }]}>
                      {getEnergyMeaning(compatibility.center)} To napięcie między Wami warto czytać jako kierunek pracy, a nie sztywny wyrok.
                    </Typography>
                  </View>

                  <View style={[styles.premiumDivider, { backgroundColor: dividerColor }]} />

                  {/* ── Detail: clean rows with left accent ── */}
                  <View style={styles.detailSection}>
                    <Typography variant="premiumLabel" color={currentTheme.primary} style={{ marginBottom: 16 }}>{t('compatibility.szerszy_obraz_relacji', 'Szerszy obraz relacji')}</Typography>
                    {relationshipNarrative.map((paragraph, idx) => (
                      <View key={idx} style={[styles.detailRow, { borderLeftColor: currentTheme.primary + '55' }]}>
                        <Typography variant="bodySmall" style={[styles.detailCopy, { color: subColor }]}>
                          {paragraph}
                        </Typography>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.premiumDivider, { backgroundColor: dividerColor }]} />

                  {/* ── Journal reflection questions ── */}
                  {compatibilityQuestions.length > 0 && (
                    <View style={styles.questionsSection}>
                      <Typography variant="premiumLabel" color={currentTheme.primary} style={{ marginBottom: 4 }}>{t('compatibility.pytania_do_refleksji', 'Pytania do refleksji')}</Typography>
                      <Typography variant="bodySmall" style={[{ marginBottom: 16, color: subColor }]}>
                        {t('compatibility.otworz_jedno_z_nich_w', 'Otwórz jedno z nich w dzienniku i pozwól, by odpowiedź sama przyszła.')}
                      </Typography>
                      {compatibilityQuestions.map((question, idx) => (
                        <Pressable
                          key={idx}
                          style={[styles.questionRow, { borderBottomColor: dividerColor }]}
                          onPress={() => navigation.navigate('JournalEntry', {
                            prompt: `Analizuję zgodność z osobą o imieniu ${sessionPartner?.name}. Wspólne centrum relacji daje ${compatibility.center}, oś relacji ${compatibility.right}, energia działania ${compatibility.top}, lekcja ${compatibility.bottom}.\n\n${question}`,
                            type: 'reflection',
                          })}
                        >
                          <Typography variant="bodySmall" style={[styles.questionText, { color: textColor }]}>
                            {question}
                          </Typography>
                          <ArrowRight color={currentTheme.primary} size={16} strokeWidth={1.5} />
                        </Pressable>
                      ))}
                    </View>
                  )}

                  <View style={[styles.premiumDivider, { backgroundColor: dividerColor }]} />

                  {/* ── Obszary relacji: 4 scored cards ── */}
                  {relationAreas && (
                    <View style={styles.areasSection}>
                      <Typography variant="premiumLabel" color={currentTheme.primary} style={{ marginBottom: 4 }}>{t('compatibility.obszary_relacji', 'Obszary relacji')}</Typography>
                      <Typography variant="bodySmall" style={[{ marginBottom: 18, color: subColor }]}>
                        {t('compatibility.cztery_wymiary_waszej_wiezi_kazdy', 'Cztery wymiary Waszej więzi — każdy odczytany z wibracji tej pary.')}
                      </Typography>
                      {[
                        {
                          key: 'milosc',
                          label: t('compatibility.milosc', 'Miłość'),
                          color: '#E879A0',
                          pct: relationAreas.milosc,
                          desc: 'Głębokość emocjonalnego połączenia i zdolność do wzajemnej czułości. Im wyższa wibracja, tym silniejszy magnetyzm dusz — i tym ważniejsze, by nie gasić go codzienną rutyną. Miłość tu jest żywa, lecz wymaga świadomej pielęgnacji.',
                        },
                        {
                          key: 'komunikacja',
                          label: 'Komunikacja',
                          color: '#60A5FA',
                          pct: relationAreas.komunikacja,
                          desc: 'Jakość przepływu słów, intencji i milczenia między Wami. Energia relacji wskazuje, jak szybko pojawia się zrozumienie — i gdzie leży próg nieporozumień. Szczera rozmowa jest tu zarówno największym wyzwaniem, jak i największym darem.',
                        },
                        {
                          key: 'wartosci',
                          label: t('compatibility.wartosci', 'Wartości'),
                          color: '#34D399',
                          pct: relationAreas.wartosci,
                          desc: 'Spójność fundamentów — tego, co dla Was obojga naprawdę ważne. Gdzie wartości się pokrywają, relacja buduje się stabilnie i naturalnie. Rozbieżności nie muszą dzielić — jeśli są nazwane z szacunkiem, stają się źródłem wzajemnej mądrości.',
                        },
                        {
                          key: 'wzrost',
                          label: 'Wzrost',
                          color: '#FBBF24',
                          pct: relationAreas.wzrost,
                          desc: 'Potencjał wspólnego dojrzewania i ewolucji tej więzi w czasie. Relacje o wysokiej energii wzrostu prowokują nawzajem do przekraczania własnych granic — nie przez presję, lecz przez samo bycie w obecności tej drugiej osoby.',
                        },
                      ].map((area, idx) => (
                        <Animated.View
                          key={area.key}
                          entering={FadeInDown.delay(idx * 100).duration(500)}
                          style={[styles.areaCard, {
                            backgroundColor: surfaceBg,
                            borderColor: surfaceBorder,
                            borderLeftColor: area.color,
                          }]}
                        >
                          <View style={styles.areaCardLeft}>
                            <Typography variant="microLabel" style={{ color: area.color, marginBottom: 4 }}>{area.label.toUpperCase()}</Typography>
                            <Typography variant="bodySmall" style={[styles.areaDesc, { color: subColor }]}>{area.desc}</Typography>
                          </View>
                          <View style={[styles.areaScoreBox, { borderColor: area.color + '44', backgroundColor: area.color + '14' }]}>
                            <Typography variant="cardTitle" style={{ color: area.color, fontSize: 26 }}>{area.pct}</Typography>
                            <Typography variant="microLabel" style={{ color: area.color, opacity: 0.75, fontSize: 10 }}>%</Typography>
                          </View>
                        </Animated.View>
                      ))}
                    </View>
                  )}

                  <View style={[styles.premiumDivider, { backgroundColor: dividerColor }]} />

                  {/* ── Next steps: clean nav rows ── */}
                  <View style={styles.nextStepsSection}>
                    <Typography variant="premiumLabel" color={currentTheme.primary} style={{ marginBottom: 4 }}>{t('compatibility.pogleb_te_relacje_dalej', 'Pogłęb tę relację dalej')}</Typography>
                    <Typography variant="bodySmall" style={[{ marginBottom: 16, color: subColor }]}>
                      {t('compatibility.zobacz_te_wiez_z_kilku', 'Zobacz tę więź z kilku stron — dopiero połączenie warstw pokazuje pełniejszy obraz.')}
                    </Typography>
                    {nextStepNavRows.map((row, idx) => (
                      <Pressable
                        key={row.key}
                        style={[
                          styles.navRow,
                          { borderBottomColor: idx < nextStepNavRows.length - 1 ? dividerColor : 'transparent' },
                        ]}
                        onPress={row.onPress}
                      >
                        <View style={{ flex: 1 }}>
                          <Typography variant="bodyRefined" style={[styles.navRowLabel, { color: textColor }]}>{row.label}</Typography>
                          <Typography variant="caption" style={{ color: subColor, marginTop: 2 }}>{row.desc}</Typography>
                        </View>
                        <ArrowRight color={currentTheme.primary + 'AA'} size={16} strokeWidth={1.5} />
                      </Pressable>
                    ))}
                  </View>

                  <View style={[styles.premiumDivider, { backgroundColor: dividerColor }]} />

                  {/* ── Co dalej? quick links ── */}
                  <View style={styles.codalejSection}>
                    <Typography variant="premiumLabel" color={currentTheme.primary} style={{ marginBottom: 4 }}>{t('compatibility.co_dalej', 'Co dalej?')}</Typography>
                    <Typography variant="bodySmall" style={[{ marginBottom: 16, color: subColor }]}>
                      {t('compatibility.trzy_sciezki_ktore_prowadza_glebiej', 'Trzy ścieżki, które prowadzą głębiej w tajemnicę tej relacji.')}
                    </Typography>
                    {[
                      {
                        key: 'tarot',
                        icon: <Sparkles color={currentTheme.primary} size={18} strokeWidth={1.5} />,
                        label: t('compatibility.milosny_rozklad', 'Miłosny rozkład'),
                        desc: t('compatibility.karty_tarota', 'Karty Tarota dla tej pary'),
                        onPress: () => navigation.navigate('Tarot'),
                      },
                      {
                        key: 'journal',
                        icon: <MapPin color={currentTheme.primary} size={18} strokeWidth={1.5} />,
                        label: t('compatibility.wspólny_dziennik', 'Wspólny dziennik'),
                        desc: t('compatibility.zapisz_refleksje_relacji', 'Zapisz refleksję o tej relacji'),
                        onPress: () => navigation.navigate('JournalEntry', {
                          prompt: `Reflektuję nad relacją z ${sessionPartner?.name}. Co chcę powiedzieć tej osobie, czego jeszcze nie powiedziałem/am?`,
                          type: 'reflection',
                        }),
                      },
                      {
                        key: 'numerology',
                        icon: <ArrowRight color={currentTheme.primary} size={18} strokeWidth={1.5} />,
                        label: t('compatibility.glębsza_liczba', 'Głębsza liczba'),
                        desc: t('compatibility.numerologia_wiezi', 'Numerologia tej więzi'),
                        onPress: () => navigation.navigate('Numerology'),
                      },
                    ].map((item, idx, arr) => (
                      <Pressable
                        key={item.key}
                        style={[styles.codalejRow, { borderBottomColor: idx < arr.length - 1 ? dividerColor : 'transparent' }]}
                        onPress={item.onPress}
                      >
                        <View style={[styles.codalejIcon, { backgroundColor: accentBg }]}>{item.icon}</View>
                        <View style={{ flex: 1 }}>
                          <Typography variant="bodyRefined" style={[{ color: textColor, fontWeight: '500' }]}>{item.label}</Typography>
                          <Typography variant="caption" style={{ color: subColor, marginTop: 2 }}>{item.desc}</Typography>
                        </View>
                        <ArrowRight color={currentTheme.primary + 'AA'} size={16} strokeWidth={1.5} />
                      </Pressable>
                    ))}
                  </View>

                  {/* ── Reset ── */}
                  <Pressable style={styles.resetBtn} onPress={resetSession}>
                    <RotateCcw color={currentTheme.textMuted} size={14} />
                    <Typography variant="label" color={currentTheme.textMuted} style={styles.resetLabel}>{t('compatibility.sprawdz_inna_osobe', 'Sprawdź inną osobę')}</Typography>
                  </Pressable>
                </Animated.View>
              )}

              {!keyboardOpen ? <EndOfContentSpacer size="standard" /> : <View style={{ height: 26 }} />}
            </ScrollView>

            {/* ── Footer CTA (form state only) ── */}
            {!compatibility && (
              <View
                style={[
                  styles.footerBar,
                  {
                    paddingBottom: keyboardHeight > 0 ? Math.max(insets.bottom, 10) : Math.max(insets.bottom, 6),
                    marginBottom: keyboardHeight > 0 ? 8 : 0,
                    borderTopColor: dividerColor,
                    backgroundColor: isLight ? 'rgba(250,246,238,0.97)' : 'rgba(10,10,20,0.97)',
                  },
                ]}
              >
                {!partnerName.trim() || !partnerBirthDate ? (
                  <Typography variant="caption" style={[styles.footerHint, { color: subColor }]}>
                    {t('compatibility.uzupelnij_imie_i_date_urodzenia', 'Uzupełnij imię i datę urodzenia, aby otworzyć zgodność tej relacji.')}
                  </Typography>
                ) : null}
                <Pressable
                  style={[luxury.button(currentTheme), styles.footerButton, { opacity: partnerName.trim() && partnerBirthDate ? 1 : 0.45 }]}
                  onPress={startSession}
                  disabled={!partnerName.trim() || !partnerBirthDate}
                >
                  <Typography variant="premiumLabel" color={currentTheme.background}>{t('compatibility.pokaz_zgodnosc', 'Pokaż zgodność')}</Typography>
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <PremiumDatePickerSheet
        visible={pickerMode === 'birthDate'}
        mode="date"
        title={t('compatibility.data_urodzenia_tej_osoby', 'Data urodzenia tej osoby')}
        description={t('compatibility.to_nadal_jest_lekka_sesja', 'To nadal jest lekka sesja zgodności. Uzupełniasz tylko to, co potrzebne do czytelnego obrazu relacji.')}
        value={new Date(partnerBirthDate || '1995-01-01')}
        maximumDate={new Date()}
        onCancel={() => setPickerMode(null)}
        onConfirm={(value) => {
          setPartnerBirthDate(value.toISOString());
          setPickerMode(null);
        }}
      />
      <PremiumDatePickerSheet
        visible={pickerMode === 'birthTime'}
        mode="time"
        title={t('compatibility.godzina_urodzenia_tej_osoby', 'Godzina urodzenia tej osoby')}
        description={t('compatibility.pole_opcjonalne_dodaj_je_tylko', 'Pole opcjonalne. Dodaj je tylko wtedy, gdy chcesz subtelniejszego astrologicznego kontekstu.')}
        value={birthTimeValue}
        onCancel={() => setPickerMode(null)}
        onConfirm={(value) => {
          setBirthTimeValue(value);
          setPickerMode(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: layout.padding.screen, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', height: 84, marginBottom: 8, paddingTop: 8 },
  backBtn: { width: 44, alignItems: 'flex-start' },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerLabel: { marginBottom: 4 },

  // intro section — no card
  introSection: { marginBottom: 20 },
  introCopy: { fontStyle: 'italic', lineHeight: 24, opacity: 0.88 },

  // premium divider
  premiumDivider: { height: 1, marginVertical: 22 },

  // ritual form
  ritualForm: { alignItems: 'center', paddingBottom: 8 },
  formIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: layout.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  formTitle: { marginBottom: 28, textAlign: 'center' },
  inputGroup: { width: '100%', marginBottom: 20 },
  fieldLabel: { marginLeft: 4, marginBottom: 12 },
  infoTrigger: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  timeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeChip: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.16)',
    backgroundColor: 'rgba(128,128,128,0.07)',
  },
  // optional inline note
  optionalNote: { marginTop: 10, lineHeight: 21, fontStyle: 'italic', paddingHorizontal: 4 },

  // results
  resultsContainer: { alignItems: 'center', marginTop: 8, width: '100%' },

  // context section
  contextSection: { flexDirection: 'row', alignItems: 'flex-start', width: '100%', gap: 14 },
  contextAccent: { width: 3, borderRadius: 2, minHeight: 60, marginTop: 4 },
  contextName: { fontSize: 20, marginBottom: 4 },
  contextMeta: { lineHeight: 20 },

  // compat deck — subtle surface, reduced border
  compatDeck: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 0,
  },
  compatLead: { lineHeight: 22, marginBottom: 14 },
  compatDivider: { height: 1, marginBottom: 0 },
  compatGrid: { flexDirection: 'row' },
  compatTile: { flex: 1, paddingVertical: 18, paddingHorizontal: 14, alignItems: 'center' },

  // pair names
  pairNames: { flexDirection: 'row', alignItems: 'center', gap: 22, marginBottom: 20, marginTop: 4 },
  pairName: { fontSize: 22 },
  heartWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: layout.hairline,
  },
  chartWrapper: { marginVertical: 16 },

  // result section — clean large display
  resultSection: { width: '100%' },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  resultIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  resultBody: { lineHeight: 26 },

  // detail rows with left accent
  detailSection: { width: '100%' },
  detailRow: {
    borderLeftWidth: 3,
    paddingLeft: 14,
    marginBottom: 16,
  },
  detailCopy: { lineHeight: 24 },

  // question rows
  questionsSection: { width: '100%' },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  questionText: { flex: 1, lineHeight: 22 },

  // nav rows
  nextStepsSection: { width: '100%' },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  navRowLabel: { fontWeight: '500' },

  // obszary relacji
  areasSection: { width: '100%' },
  areaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 14,
  },
  areaCardLeft: { flex: 1 },
  areaDesc: { lineHeight: 20, marginTop: 4 },
  areaScoreBox: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 1,
  },

  // co dalej
  codalejSection: { width: '100%' },
  codalejRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  codalejIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // reset
  resetBtn: { marginTop: 28, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  resetLabel: { letterSpacing: 2 },

  // footer bar
  footerBar: {
    paddingHorizontal: layout.padding.screen,
    paddingTop: 12,
    borderTopWidth: layout.hairline,
    gap: 10,
  },
  footerHint: { textAlign: 'center', lineHeight: 18 },
  footerButton: { width: '100%' },
});
