// @ts-nocheck
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import {
  View, StyleSheet, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, Pressable, Keyboard,
  Animated as RNAnimated, Easing as RNEasing, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles, Star, Moon, Eye, Compass, BookOpen,
  Check, User, MapPin, Calendar, Zap, Heart, Sun,
} from 'lucide-react-native';
import { useAppStore } from '../../../store/useAppStore';
import { CelestialBackdrop } from '../../../components/CelestialBackdrop';
import { PremiumButton } from '../../../components/PremiumButton';
import { layout } from '../../../core/theme/designSystem';
import { themes, ThemeName } from '../../../core/theme/tokens';
import { PremiumDatePickerSheet } from '../../../components/PremiumDatePickerSheet';
import { Typography } from '../../../components/Typography';

const { width: W, height: H } = Dimensions.get('window');

// ── Palette (always dark luxury for onboarding) ────────────────────────────────
const GOLD        = '#D4A843';
const GOLD_SOFT   = '#F0C96A';
const GOLD_GLOW   = 'rgba(212,168,67,0.18)';
const PURPLE_CORE = '#7C3AED';
const PURPLE_SOFT = '#A78BFA';
const WHITE_HIGH  = 'rgba(255,255,255,0.92)';
const WHITE_MED   = 'rgba(255,255,255,0.58)';
const WHITE_LOW   = 'rgba(255,255,255,0.30)';
const GLASS_BG    = 'rgba(255,255,255,0.06)';
const GLASS_BORDER= 'rgba(255,255,255,0.12)';

// ── Step meta: icon, gradient colors, accent ─────────────────────────────────
type OnboardingStep = 'welcome' | 'identity' | 'gender' | 'birth' | 'birth_place' | 'experience' | 'spiritual_goals' | 'favorite_practice' | 'practice_frequency' | 'entry';
const STEPS: OnboardingStep[] = ['welcome', 'identity', 'gender', 'birth', 'birth_place', 'experience', 'spiritual_goals', 'favorite_practice', 'practice_frequency', 'entry'];

const STEP_META: Record<OnboardingStep, {
  icon: any; gradColors: [string, string, string]; accent: string; gradLoc: [number, number, number];
}> = {
  welcome:     { icon: Sparkles, gradColors: ['#10082A', '#0D1535', '#08071A'], accent: GOLD,        gradLoc: [0, 0.55, 1] },
  identity:    { icon: User,     gradColors: ['#0D0B22', '#120A30', '#08071A'], accent: PURPLE_SOFT, gradLoc: [0, 0.5, 1] },
  gender:      { icon: Heart,    gradColors: ['#0F0820', '#1A0930', '#08071A'], accent: '#F9A8D4',   gradLoc: [0, 0.5, 1] },
  birth:       { icon: Moon,     gradColors: ['#070B22', '#0C1438', '#08071A'], accent: '#93C5FD',   gradLoc: [0, 0.5, 1] },
  birth_place: { icon: MapPin,   gradColors: ['#0A1020', '#0D1530', '#08071A'], accent: '#6EE7B7',   gradLoc: [0, 0.5, 1] },
  experience:        { icon: Zap,     gradColors: ['#120820', '#1A0A2E', '#08071A'], accent: GOLD,        gradLoc: [0, 0.5, 1] },
  spiritual_goals:   { icon: Sparkles,gradColors: ['#07080E', '#0D0A22', '#07080E'], accent: PURPLE_SOFT, gradLoc: [0, 0.5, 1] },
  favorite_practice: { icon: Star,    gradColors: ['#07080E', '#0A0D22', '#07080E'], accent: PURPLE_SOFT, gradLoc: [0, 0.5, 1] },
  practice_frequency:{ icon: Moon,    gradColors: ['#07080E', '#0B0A22', '#07080E'], accent: PURPLE_SOFT, gradLoc: [0, 0.5, 1] },
  entry:             { icon: Sun,     gradColors: ['#12090A', '#1A0B10', '#08071A'], accent: GOLD,        gradLoc: [0, 0.5, 1] },
};

const STEP_NOTES: Record<OnboardingStep, string> = {
  welcome:     'Wejście zajmuje mniej niż 2 minuty.',
  identity:    'Imię pojawi się w centrum dnia i sesjach Oracle.',
  gender:      'Płeć wpływa na sposób, w jaki Oracle się do Ciebie zwraca.',
  birth:       'Data zasila astrologię i osobisty archetyp dnia.',
  birth_place: 'Miasto domknie głębszą warstwę astrologii.',
  experience:         'Ustawia głębię języka i rytm prowadzenia.',
  spiritual_goals:    'Możesz wybrać do 3 obszarów — Oracle skupi na nich swój przekaz.',
  favorite_practice:  'Aethera zaproponuje tę praktykę jako punkt wejścia każdego dnia.',
  practice_frequency: 'Dostosujemy powiadomienia i rytm prowadzenia do Twojego tempa.',
  entry:              'Wszystko można zmienić w Profilu w dowolnym momencie.',
};

const KEYBOARD_STEPS: OnboardingStep[] = ['identity', 'birth_place'];

// ── Data ──────────────────────────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { id: 'woman',      label: 'Kobieta',          sub: 'Oracle zwróci się do Ciebie: Pani / Ty', icon: '✦' },
  { id: 'man',        label: 'Mężczyzna',        sub: 'Oracle zwróci się do Ciebie: Pan / Ty',  icon: '✦' },
  { id: 'prefer_not', label: 'Wolę nie podawać', sub: 'Oracle używa formy neutralnej',           icon: '◈' },
];

const EXPERIENCE_OPTIONS = [
  { id: 'beginner',     icon: Star,     title: 'Dopiero wchodzę',         description: 'Chcę prostego języka i spokojnego prowadzenia.',        accent: '#6EE7B7' },
  { id: 'intermediate', icon: Moon,     title: 'Już praktykuję',          description: 'Szukam równowagi między intuicją i symboliczną głębią.', accent: PURPLE_SOFT },
  { id: 'advanced',     icon: Sparkles, title: 'Jestem głęboko w temacie',description: 'Potrzebuję bogatszych warstw i dojrzałego guidance.',    accent: GOLD },
];

// ── Personalization data ──────────────────────────────────────────────────────
const SPIRITUAL_GOAL_OPTIONS = [
  { id: 'Samopoznanie',    label: '🌱 Samopoznanie' },
  { id: 'Obfitość',        label: '💰 Obfitość' },
  { id: 'Uzdrowienie',     label: '💚 Uzdrowienie' },
  { id: 'Miłość',          label: '💜 Miłość' },
  { id: 'Spokój',          label: '☮️ Spokój' },
  { id: 'Transformacja',   label: '🦋 Transformacja' },
  { id: 'Dary mistyczne',  label: '🔮 Dary mistyczne' },
  { id: 'Przebudzenie',    label: '✨ Przebudzenie' },
];

const FAVORITE_PRACTICE_OPTIONS = [
  { id: 'Medytacja',   label: '🧘 Medytacja' },
  { id: 'Tarot',       label: '🃏 Tarot' },
  { id: 'Rytuały',     label: '🕯️ Rytuały' },
  { id: 'Astrologia',  label: '⭐ Astrologia' },
  { id: 'Dziennik',    label: '📖 Dziennik' },
  { id: 'Afirmacje',   label: '💫 Afirmacje' },
  { id: 'Dźwięk',      label: '🎵 Dźwięk' },
  { id: 'Wyrocznia',   label: '🔮 Wyrocznia' },
];

const PRACTICE_FREQUENCY_OPTIONS = [
  { id: 'Codziennie',              label: '🔥 Codziennie' },
  { id: 'Kilka razy w tygodniu',   label: '🌟 Kilka razy w tygodniu' },
  { id: 'Raz w tygodniu',          label: '🌙 Raz w tygodniu' },
  { id: 'Kiedy czuję potrzebę',    label: '✨ Kiedy czuję potrzebę' },
];

const PILL_BG         = 'rgba(167,139,250,0.12)';
const PILL_BORDER     = 'rgba(167,139,250,0.30)';
const PILL_BG_SEL     = 'rgba(167,139,250,0.25)';
const PILL_BORDER_SEL = 'rgba(167,139,250,0.80)';

const WORLDS_PREVIEW = [
  { icon: Compass,  title: 'Dzisiaj',  copy: 'Osobisty ton dnia i kolejne ruchy.', accent: GOLD },
  { icon: Star,     title: 'Światy',   copy: 'Tarot, Horoskop, Rytuał i więcej.',  accent: PURPLE_SOFT },
  { icon: Eye,      title: 'Oracle',   copy: 'AI prowadzący do konkretnego kroku.',accent: '#93C5FD' },
  { icon: BookOpen, title: 'Profil',   copy: 'Centrum ustawień i pamięci.',         accent: '#6EE7B7' },
];

// ── Glow Input (glassmorphism) ────────────────────────────────────────────────
const GlowInput = ({ focused, icon: Icon, accent, children }) => {
  const anim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.timing(anim, { toValue: focused ? 1 : 0, duration: 260, useNativeDriver: false }).start();
  }, [focused]);
  const borderColor = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['rgba(255,255,255,0.12)', accent + 'BB'],
  });
  const bgColor = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [GLASS_BG, accent + '0D'],
  });
  return (
    <RNAnimated.View style={[ob.inputWrapper, { borderColor, backgroundColor: bgColor }]}>
      {Icon && (
        <View style={ob.inputIcon}>
          <Icon color={focused ? accent : WHITE_LOW} size={16} strokeWidth={1.6} />
        </View>
      )}
      {children}
    </RNAnimated.View>
  );
};

// ── Premium gradient progress bar ────────────────────────────────────────────
const GradientProgressBar = ({ progress, accent }) => {
  const anim = useRef(new RNAnimated.Value(progress)).current;
  useEffect(() => {
    RNAnimated.timing(anim, {
      toValue: progress,
      duration: 500,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={ob.progressTrack}>
      <RNAnimated.View style={[ob.progressFill, { width }]}>
        <LinearGradient
          colors={[GOLD_SOFT, GOLD, accent, PURPLE_SOFT]}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Shimmer dot */}
        <View style={ob.progressShimmer} />
      </RNAnimated.View>
    </View>
  );
};

// ── Hero icon with glow ───────────────────────────────────────────────────────
const HeroIcon = ({ icon: Icon, accent, size = 64 }) => {
  const pulseScale = useRef(new RNAnimated.Value(1)).current;
  const glowOp     = useRef(new RNAnimated.Value(0.4)).current;

  useEffect(() => {
    RNAnimated.loop(RNAnimated.sequence([
      RNAnimated.timing(pulseScale, { toValue: 1.08, duration: 1800, useNativeDriver: true }),
      RNAnimated.timing(pulseScale, { toValue: 0.95, duration: 1800, useNativeDriver: true }),
    ])).start();
    RNAnimated.loop(RNAnimated.sequence([
      RNAnimated.timing(glowOp, { toValue: 0.85, duration: 2000, useNativeDriver: true }),
      RNAnimated.timing(glowOp, { toValue: 0.25, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    <View style={ob.heroIconWrapper}>
      <RNAnimated.View style={[ob.heroIconGlowOuter, { borderColor: accent + '30', transform: [{ scale: pulseScale }] }]} />
      <RNAnimated.View style={[ob.heroIconGlowInner, { borderColor: accent + '55', transform: [{ scale: pulseScale }] }]} />
      <View style={[ob.heroIconCore, { borderColor: accent + '70', backgroundColor: accent + '14' }]}>
        <LinearGradient
          colors={[accent + '28', accent + '0A', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
        <RNAnimated.View style={[ob.heroIconGlowFill, { backgroundColor: accent + '20', opacity: glowOp }]} />
        <Icon color={accent} size={size * 0.55} strokeWidth={1.3} />
      </View>
    </View>
  );
};

// ── Confetti star (entry step) ────────────────────────────────────────────────
const ConfettiStar = ({ x, delay, color }) => {
  const y       = useRef(new RNAnimated.Value(-10)).current;
  const opacity = useRef(new RNAnimated.Value(0)).current;
  const rotate  = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.delay(delay),
        RNAnimated.parallel([
          RNAnimated.timing(y,       { toValue: H * 0.6, duration: 4000, easing: RNEasing.linear, useNativeDriver: true }),
          RNAnimated.timing(rotate,  { toValue: 360,     duration: 4000, easing: RNEasing.linear, useNativeDriver: true }),
          RNAnimated.sequence([
            RNAnimated.timing(opacity, { toValue: 0.9, duration: 400, useNativeDriver: true }),
            RNAnimated.timing(opacity, { toValue: 0.9, duration: 3200, useNativeDriver: true }),
            RNAnimated.timing(opacity, { toValue: 0,   duration: 400, useNativeDriver: true }),
          ]),
        ]),
        RNAnimated.parallel([
          RNAnimated.timing(y,       { toValue: -10, duration: 0, useNativeDriver: true }),
          RNAnimated.timing(rotate,  { toValue: 0,   duration: 0, useNativeDriver: true }),
          RNAnimated.timing(opacity, { toValue: 0,   duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <RNAnimated.View style={{
      position: 'absolute', left: x,
      transform: [{ translateY: y }, { rotate: rotate.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }],
      opacity,
    }}>
      <Typography style={{ fontSize: 12, color }}>✦</Typography>
    </RNAnimated.View>
  );
};

const CONFETTI = [
  { x: W * 0.08, delay: 0,    color: GOLD },
  { x: W * 0.20, delay: 400,  color: PURPLE_SOFT },
  { x: W * 0.35, delay: 800,  color: GOLD_SOFT },
  { x: W * 0.50, delay: 200,  color: '#F9A8D4' },
  { x: W * 0.65, delay: 600,  color: GOLD },
  { x: W * 0.80, delay: 1000, color: PURPLE_SOFT },
  { x: W * 0.92, delay: 300,  color: GOLD_SOFT },
];

// ── Main Component ────────────────────────────────────────────────────────────
export const OnboardingScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const setOnboarded = useAppStore(s => s.setOnboarded);
  const setUserData = useAppStore(s => s.setUserData);
  const themeName = useAppStore(s => s.themeName);
  const theme  = themes[themeName as ThemeName] || themes['dark'];
  const nameInputRef  = useRef(null);
  const placeInputRef = useRef(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName]           = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [gender, setGender]       = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [placeFocused, setPlaceFocused] = useState(false);
  const [birthDate, setBirthDate] = useState({ day: 1, month: 1, year: 1996 });
  const [experienceLevel, setExperienceLevel] = useState('');
  const [spiritualGoals, setSpiritualGoals] = useState<string[]>([]);
  const [favoritePractice, setFavoritePractice] = useState('');
  const [practiceFrequency, setPracticeFrequency] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Step transition
  const slideX = useRef(new RNAnimated.Value(0)).current;
  const fadeV  = useRef(new RNAnimated.Value(1)).current;

  const currentStep = STEPS[stepIndex];
  const meta        = STEP_META[currentStep];
  const accent      = meta.accent;
  const progress    = ((stepIndex + 1) / STEPS.length) * 100;
  const isKeyboardStep = KEYBOARD_STEPS.includes(currentStep);

  const formattedBirthDate = `${birthDate.year.toString().padStart(4,'0')}-${birthDate.month.toString().padStart(2,'0')}-${birthDate.day.toString().padStart(2,'0')}`;

  const birthDateValue = useMemo(() => {
    const d = new Date(birthDate.year, birthDate.month - 1, birthDate.day);
    return Number.isNaN(d.getTime()) ? new Date(1996, 0, 1) : d;
  }, [birthDate.day, birthDate.month, birthDate.year]);

  const birthDateParts = useMemo(() => ({
    day:   birthDateValue.toLocaleDateString('pl-PL', { day: '2-digit' }),
    month: birthDateValue.toLocaleDateString('pl-PL', { month: 'long' }),
    year:  birthDateValue.toLocaleDateString('pl-PL', { year: 'numeric' }),
  }), [birthDateValue]);

  const canContinue = useMemo(() => {
    switch (currentStep) {
      case 'welcome':            return true;
      case 'identity':           return name.trim().length >= 2;
      case 'gender':             return Boolean(gender);
      case 'birth':              return birthDate.year >= 1900;
      case 'birth_place':        return birthPlace.trim().length >= 2;
      case 'experience':         return Boolean(experienceLevel);
      case 'spiritual_goals':    return spiritualGoals.length >= 1;
      case 'favorite_practice':  return Boolean(favoritePractice);
      case 'practice_frequency': return Boolean(practiceFrequency);
      case 'entry':              return true;
      default:                   return false;
    }
  }, [birthDate.year, birthPlace, currentStep, experienceLevel, favoritePractice, gender, name, practiceFrequency, spiritualGoals]);

  const finishOnboarding = () => {
    setUserData({
      name: name.trim(), gender, birthDate: formattedBirthDate, birthPlace: birthPlace.trim(),
      experienceLevel,
      primaryIntention: spiritualGoals[0] || (experienceLevel === 'advanced' ? 'Rozwój' : 'Spokój'),
      currentFocus:     spiritualGoals[0] || (experienceLevel === 'advanced' ? 'Orientacja symboliczna' : 'Spokojne wejście'),
      spiritualGoals:   spiritualGoals.length > 0 ? spiritualGoals : ['Poznanie siebie'],
      favoritePractice,
      practiceFrequency,
      preferredTone:    experienceLevel === 'advanced' ? 'reflective' : 'gentle',
      preferredRitualCategory: 'Cleansing',
      soulPathState:    experienceLevel === 'advanced' ? 'awakening' : 'reflecting',
    });
    setOnboarded(true);
  };

  const animateStep = (dir: 'next' | 'prev') => {
    const fromX = dir === 'next' ? W * 0.3 : -W * 0.3;
    slideX.setValue(fromX);
    fadeV.setValue(0);
    RNAnimated.parallel([
      RNAnimated.spring(slideX, { toValue: 0, tension: 75, friction: 12, useNativeDriver: true }),
      RNAnimated.timing(fadeV,  { toValue: 1, duration: 360, useNativeDriver: true }),
    ]).start();
  };

  const next = () => {
    if (!canContinue) return;
    Keyboard.dismiss();
    if (currentStep === 'entry') { finishOnboarding(); return; }
    animateStep('next');
    setStepIndex(i => Math.min(i + 1, STEPS.length - 1));
  };

  const previous = () => {
    Keyboard.dismiss();
    if (stepIndex === 0) return;
    animateStep('prev');
    setStepIndex(i => Math.max(i - 1, 0));
  };

  // ── Step content ─────────────────────────────────────────────────────────────
  const renderStep = () => {
    if (currentStep === 'welcome') {
      return (
        <ScrollView
          style={ob.scroll}
          contentContainerStyle={ob.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.delay(100).duration(700)} style={ob.stepHeroCenter}>
            <HeroIcon icon={meta.icon} accent={accent} size={64} />
            <Typography style={[ob.stepHeroTitle, { color: WHITE_HIGH }]}>
              Sanktuarium stworzone,{'\n'}by prowadzić, nie przytłaczać.
            </Typography>
            <Typography style={ob.stepHeroBody}>
              Aethera łączy Tarot, astrologię, rytuały i Oracle w jeden spójny świat dopasowany do Twojego rytmu.
            </Typography>
          </Animated.View>

          {/* Preview worlds */}
          <Animated.View entering={FadeInUp.delay(300).duration(700)} style={ob.glassSectionCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
              style={StyleSheet.absoluteFillObject}
            />
            <Typography style={[ob.sectionEyebrow, { color: accent }]}>CO ZNAJDZIESZ</Typography>
            {WORLDS_PREVIEW.map((item, i) => {
              const Icon = item.icon;
              return (
                <Animated.View key={item.title} entering={FadeInUp.delay(400 + i * 80).duration(500)} style={ob.worldRow}>
                  <View style={[ob.worldIconBox, { borderColor: item.accent + '40', backgroundColor: item.accent + '12' }]}>
                    <Icon color={item.accent} size={16} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography style={[ob.worldTitle, { color: item.accent }]}>{item.title}</Typography>
                    <Typography style={ob.worldCopy}>{item.copy}</Typography>
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* Steps overview */}
          <Animated.View entering={FadeInUp.delay(600).duration(700)} style={ob.glassSectionCard}>
            <LinearGradient
              colors={['rgba(212,168,67,0.07)', 'rgba(255,255,255,0.02)']}
              style={StyleSheet.absoluteFillObject}
            />
            <Typography style={[ob.sectionEyebrow, { color: GOLD }]}>JAK WYGLĄDA WEJŚCIE</Typography>
            <View style={ob.stepsPreviewRow}>
              {['Imię','Płeć','Data','Miasto','Poziom'].map((label, i) => (
                <View key={label} style={ob.stepPreviewDot}>
                  <View style={[ob.stepPreviewCircle, { borderColor: GOLD + '55', backgroundColor: GOLD + '14' }]}>
                    <Typography style={[ob.stepPreviewNum, { color: GOLD }]}>{i + 1}</Typography>
                  </View>
                  <Typography style={ob.stepPreviewLabel}>{label}</Typography>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      );
    }

    if (currentStep === 'identity' || currentStep === 'birth_place') {
      const isName = currentStep === 'identity';
      return (
        <ScrollView
          style={ob.scroll}
          contentContainerStyle={ob.inputScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={ob.inputStepCenter}>
            <Animated.View entering={ZoomIn.delay(100).duration(600)}>
              <HeroIcon icon={meta.icon} accent={accent} size={64} />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(250).duration(600)}>
              <Typography style={[ob.inputBigTitle, { color: WHITE_HIGH }]}>
                {isName ? 'Jak do Ciebie mówić?' : 'Skąd pochodzi Twoja mapa nieba?'}
              </Typography>
              <Typography style={ob.inputBigSub}>
                {isName
                  ? 'Twoje imię pojawi się w centrum dnia, w Oracle i w najbardziej osobistych warstwach.'
                  : 'Wystarczy nazwa miasta. To domknie głębszą warstwę astrologii i osobistego wykresu.'}
              </Typography>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(350).duration(600)} style={[ob.inputGlassBox, { borderColor: accent + '30' }]}>
              <LinearGradient
                colors={[accent + '12', 'transparent']}
                style={StyleSheet.absoluteFillObject}
              />
              <Typography style={[ob.inputGlassLabel, { color: accent }]}>
                {isName ? 'TWOJE IMIĘ' : 'MIASTO LUB MIEJSCOWOŚĆ'}
              </Typography>
              <GlowInput focused={isName ? nameFocused : placeFocused} icon={isName ? User : MapPin} accent={accent}>
                <TextInput
                  ref={isName ? nameInputRef : placeInputRef}
                  style={ob.textInput}
                  placeholder={isName ? t('onboarding.namePlaceholder', { defaultValue: 'np. Aleksandra' }) : 'np. Warszawa, Kraków...'}
                  placeholderTextColor={WHITE_LOW}
                  value={isName ? name : birthPlace}
                  onChangeText={isName ? setName : setBirthPlace}
                  returnKeyType="done"
                  onSubmitEditing={next}
                  autoFocus
                  autoCapitalize="words"
                  onFocus={() => isName ? setNameFocused(true) : setPlaceFocused(true)}
                  onBlur={() => isName ? setNameFocused(false) : setPlaceFocused(false)}
                />
              </GlowInput>
              <Typography style={ob.inputHint}>
                {isName ? 'Aethera będzie Cię tak witać każdego dnia.' : 'Wystarczy przybliżona lokalizacja.'}
              </Typography>
            </Animated.View>
          </View>
        </ScrollView>
      );
    }

    if (currentStep === 'gender') {
      return (
        <ScrollView style={ob.scroll} contentContainerStyle={ob.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={ZoomIn.delay(80).duration(600)} style={{ alignItems: 'center' }}>
            <HeroIcon icon={meta.icon} accent={accent} size={64} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Typography style={[ob.inputBigTitle, { color: WHITE_HIGH, textAlign: 'center', marginTop: 14 }]}>
              Jak się do Ciebie zwracać?
            </Typography>
            <Typography style={[ob.inputBigSub, { textAlign: 'center', marginBottom: 22 }]}>
              Oracle dostosuje ton i formę zwrotu do Twoich preferencji.
            </Typography>
          </Animated.View>
          {GENDER_OPTIONS.map((option, i) => {
            const active = gender === option.id;
            return (
              <Animated.View key={option.id} entering={FadeInUp.delay(280 + i * 100).duration(550)}>
                <Pressable onPress={() => setGender(option.id)}>
                  <View style={[ob.optionCard, {
                    backgroundColor: active ? accent + '14' : GLASS_BG,
                    borderColor: active ? accent + '70' : GLASS_BORDER,
                  }]}>
                    {active && (
                      <LinearGradient
                        colors={[accent + '18', 'transparent']}
                        style={StyleSheet.absoluteFillObject}
                      />
                    )}
                    <View style={[ob.optionIconBox, { borderColor: active ? accent + '55' : WHITE_LOW, backgroundColor: active ? accent + '18' : 'rgba(255,255,255,0.04)' }]}>
                      <Typography style={{ color: active ? accent : WHITE_LOW, fontSize: 16 }}>{option.icon}</Typography>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography style={[ob.optionTitle, { color: active ? accent : WHITE_HIGH }]}>
                        {option.label}
                      </Typography>
                      <Typography style={ob.optionCopy}>{option.sub}</Typography>
                    </View>
                    <View style={[ob.optionCheckCircle, {
                      borderColor: active ? accent : WHITE_LOW,
                      backgroundColor: active ? accent : 'transparent',
                    }]}>
                      {active && <Check color="#fff" size={11} strokeWidth={3} />}
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>
      );
    }

    if (currentStep === 'birth') {
      return (
        <ScrollView style={ob.scroll} contentContainerStyle={ob.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={ZoomIn.delay(80).duration(600)} style={{ alignItems: 'center' }}>
            <HeroIcon icon={meta.icon} accent={accent} size={64} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Typography style={[ob.inputBigTitle, { color: WHITE_HIGH, textAlign: 'center', marginTop: 14 }]}>
              Kiedy zaczęła się Twoja droga?
            </Typography>
            <Typography style={[ob.inputBigSub, { textAlign: 'center', marginBottom: 22 }]}>
              Data urodzenia łączy astrologię, archetyp i energię dnia w jeden spójny obraz.
            </Typography>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(320).duration(600)} style={[ob.inputGlassBox, { borderColor: accent + '30' }]}>
            <LinearGradient colors={[accent + '12', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <Typography style={[ob.inputGlassLabel, { color: accent }]}>
              {t('onboarding.birthDate', { defaultValue: 'DATA URODZENIA' })}
            </Typography>
            <Pressable onPress={() => setShowDatePicker(true)} style={ob.dateTrigger}>
              <View style={ob.dateRow}>
                {[
                  { val: birthDateParts.day,   label: 'dzień' },
                  { val: birthDateParts.month, label: 'miesiąc' },
                  { val: birthDateParts.year,  label: 'rok' },
                ].map(({ val, label }) => (
                  <View key={label} style={[ob.dateCol, label === 'miesiąc' && ob.dateColWide, { borderColor: accent + '44', backgroundColor: accent + '10' }]}>
                    <Typography style={[ob.dateVal, { color: accent }]}>{val}</Typography>
                    <Typography style={ob.dateLabel}>{label}</Typography>
                  </View>
                ))}
              </View>
              <Typography style={ob.dateTriggerHint}>Dotknij, aby zmienić datę</Typography>
            </Pressable>
          </Animated.View>
        </ScrollView>
      );
    }

    if (currentStep === 'experience') {
      return (
        <ScrollView style={ob.scroll} contentContainerStyle={ob.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={ZoomIn.delay(80).duration(600)} style={{ alignItems: 'center' }}>
            <HeroIcon icon={meta.icon} accent={accent} size={64} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Typography style={[ob.inputBigTitle, { color: WHITE_HIGH, textAlign: 'center', marginTop: 14 }]}>
              Jak głęboko chcesz wejść?
            </Typography>
            <Typography style={[ob.inputBigSub, { textAlign: 'center', marginBottom: 22 }]}>
              To nie ocena. To sposób ustawienia głębokości języka i tempa prowadzenia.
            </Typography>
          </Animated.View>
          {EXPERIENCE_OPTIONS.map((option, i) => {
            const active = experienceLevel === option.id;
            const Icon   = option.icon;
            return (
              <Animated.View key={option.id} entering={FadeInUp.delay(280 + i * 110).duration(580)}>
                <Pressable onPress={() => setExperienceLevel(option.id)}>
                  <View style={[ob.optionCard, {
                    backgroundColor: active ? option.accent + '12' : GLASS_BG,
                    borderColor: active ? option.accent + '70' : GLASS_BORDER,
                  }]}>
                    {active && (
                      <LinearGradient
                        colors={[option.accent + '18', 'transparent']}
                        style={StyleSheet.absoluteFillObject}
                      />
                    )}
                    <View style={[ob.optionIconBox, { borderColor: active ? option.accent + '55' : WHITE_LOW, backgroundColor: active ? option.accent + '18' : 'rgba(255,255,255,0.04)' }]}>
                      <Icon color={active ? option.accent : WHITE_LOW} size={19} strokeWidth={1.6} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography style={[ob.optionTitle, { color: active ? option.accent : WHITE_HIGH }]}>
                        {option.title}
                      </Typography>
                      <Typography style={ob.optionCopy}>{option.description}</Typography>
                    </View>
                    <View style={[ob.optionCheckCircle, {
                      borderColor: active ? option.accent : WHITE_LOW,
                      backgroundColor: active ? option.accent : 'transparent',
                    }]}>
                      {active && <Check color="#fff" size={11} strokeWidth={3} />}
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>
      );
    }

    // ── Spiritual Goals (multi-select, up to 3) ─────────────────────────────
    if (currentStep === 'spiritual_goals') {
      const toggleGoal = (id: string) => {
        setSpiritualGoals(prev => {
          if (prev.includes(id)) return prev.filter(g => g !== id);
          if (prev.length >= 3) return prev;
          return [...prev, id];
        });
      };
      return (
        <ScrollView style={ob.scroll} contentContainerStyle={ob.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={ZoomIn.delay(80).duration(600)} style={{ alignItems: 'center' }}>
            <HeroIcon icon={meta.icon} accent={accent} size={64} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Typography style={[ob.inputBigTitle, { color: WHITE_HIGH, textAlign: 'center', marginTop: 14 }]}>
              Twój cel duchowy
            </Typography>
            <Typography style={[ob.inputBigSub, { textAlign: 'center', marginBottom: 6 }]}>
              Co najbardziej chcesz rozwinąć?
            </Typography>
            <Typography style={[ob.inputHint, { textAlign: 'center', marginBottom: 18 }]}>
              Wybierz od 1 do 3 obszarów.
            </Typography>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(320).duration(600)} style={ob.pillGrid}>
            {SPIRITUAL_GOAL_OPTIONS.map((opt, i) => {
              const selected = spiritualGoals.includes(opt.id);
              return (
                <Animated.View key={opt.id} entering={FadeInDown.delay(380 + i * 50).duration(450)}>
                  <Pressable
                    onPress={() => toggleGoal(opt.id)}
                    style={[ob.pill, {
                      backgroundColor: selected ? PILL_BG_SEL : PILL_BG,
                      borderColor: selected ? PILL_BORDER_SEL : PILL_BORDER,
                    }]}
                  >
                    <Typography style={[ob.pillText, { color: selected ? WHITE_HIGH : WHITE_MED }]}>
                      {opt.label}
                    </Typography>
                    {selected && (
                      <View style={ob.pillCheck}>
                        <Check color={PURPLE_SOFT} size={11} strokeWidth={3} />
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>
        </ScrollView>
      );
    }

    // ── Favorite Practice (single select) ───────────────────────────────────
    if (currentStep === 'favorite_practice') {
      return (
        <ScrollView style={ob.scroll} contentContainerStyle={ob.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={ZoomIn.delay(80).duration(600)} style={{ alignItems: 'center' }}>
            <HeroIcon icon={meta.icon} accent={accent} size={64} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Typography style={[ob.inputBigTitle, { color: WHITE_HIGH, textAlign: 'center', marginTop: 14 }]}>
              Ulubiona praktyka
            </Typography>
            <Typography style={[ob.inputBigSub, { textAlign: 'center', marginBottom: 18 }]}>
              Jak lubisz praktykować?
            </Typography>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(320).duration(600)} style={ob.pillGrid}>
            {FAVORITE_PRACTICE_OPTIONS.map((opt, i) => {
              const selected = favoritePractice === opt.id;
              return (
                <Animated.View key={opt.id} entering={FadeInDown.delay(380 + i * 50).duration(450)}>
                  <Pressable
                    onPress={() => setFavoritePractice(opt.id)}
                    style={[ob.pill, {
                      backgroundColor: selected ? PILL_BG_SEL : PILL_BG,
                      borderColor: selected ? PILL_BORDER_SEL : PILL_BORDER,
                    }]}
                  >
                    <Typography style={[ob.pillText, { color: selected ? WHITE_HIGH : WHITE_MED }]}>
                      {opt.label}
                    </Typography>
                    {selected && (
                      <View style={ob.pillCheck}>
                        <Check color={PURPLE_SOFT} size={11} strokeWidth={3} />
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>
        </ScrollView>
      );
    }

    // ── Practice Frequency (single select) ──────────────────────────────────
    if (currentStep === 'practice_frequency') {
      return (
        <ScrollView style={ob.scroll} contentContainerStyle={ob.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={ZoomIn.delay(80).duration(600)} style={{ alignItems: 'center' }}>
            <HeroIcon icon={meta.icon} accent={accent} size={64} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Typography style={[ob.inputBigTitle, { color: WHITE_HIGH, textAlign: 'center', marginTop: 14 }]}>
              Częstotliwość praktyki
            </Typography>
            <Typography style={[ob.inputBigSub, { textAlign: 'center', marginBottom: 18 }]}>
              Jak często chcesz praktykować?
            </Typography>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(320).duration(600)}>
            {PRACTICE_FREQUENCY_OPTIONS.map((opt, i) => {
              const selected = practiceFrequency === opt.id;
              return (
                <Animated.View key={opt.id} entering={FadeInDown.delay(380 + i * 80).duration(500)}>
                  <Pressable onPress={() => setPracticeFrequency(opt.id)}>
                    <View style={[ob.freqCard, {
                      backgroundColor: selected ? PILL_BG_SEL : PILL_BG,
                      borderColor: selected ? PILL_BORDER_SEL : PILL_BORDER,
                    }]}>
                      {selected && (
                        <View style={[StyleSheet.absoluteFillObject, { borderRadius: 16, overflow: 'hidden' }]}>
                          <LinearGradient
                            colors={[PURPLE_CORE + '20', 'transparent']}
                            style={StyleSheet.absoluteFillObject}
                          />
                        </View>
                      )}
                      <Typography style={[ob.freqText, { color: selected ? WHITE_HIGH : WHITE_MED }]}>
                        {opt.label}
                      </Typography>
                      <View style={[ob.optionCheckCircle, {
                        borderColor: selected ? PURPLE_SOFT : WHITE_LOW,
                        backgroundColor: selected ? PURPLE_SOFT : 'transparent',
                      }]}>
                        {selected && <Check color="#fff" size={11} strokeWidth={3} />}
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>
        </ScrollView>
      );
    }

    if (currentStep === 'entry') {
      return (
        <ScrollView style={ob.scroll} contentContainerStyle={ob.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Confetti */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {CONFETTI.map((c, i) => <ConfettiStar key={i} {...c} />)}
          </View>

          <Animated.View entering={ZoomIn.delay(80).duration(700)} style={{ alignItems: 'center' }}>
            <HeroIcon icon={meta.icon} accent={GOLD} size={72} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(250).duration(700)}>
            <Typography style={[ob.inputBigTitle, { color: WHITE_HIGH, textAlign: 'center', marginTop: 14 }]}>
              Twoje sanktuarium jest gotowe.
            </Typography>
            <Typography style={[ob.inputBigSub, { textAlign: 'center', marginBottom: 22 }]}>
              Wszystko ustawione. Możesz teraz wejść i odkrywać swój osobisty świat.
            </Typography>
          </Animated.View>

          {/* Summary card */}
          <Animated.View entering={FadeInUp.delay(350).duration(700)} style={[ob.glassSectionCard, { borderColor: GOLD + '30' }]}>
            <LinearGradient colors={[GOLD + '10', 'transparent']} style={StyleSheet.absoluteFillObject} />
            {[
              { label: 'Imię',            value: name },
              { label: 'Forma zwrotu',    value: GENDER_OPTIONS.find(o => o.id === gender)?.label || '' },
              { label: 'Data urodzenia',  value: formattedBirthDate },
              { label: 'Miejsce',         value: birthPlace },
              { label: 'Poziom wejścia',  value: EXPERIENCE_OPTIONS.find(o => o.id === experienceLevel)?.title || '' },
            ].map((row, i, arr) => (
              <View key={row.label} style={[ob.summaryRow, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: GOLD + '22' }]}>
                <Typography style={[ob.summaryLabel, { color: GOLD }]}>{row.label}</Typography>
                <Typography style={ob.summaryVal}>{row.value}</Typography>
              </View>
            ))}
          </Animated.View>

          {/* Worlds grid */}
          <Animated.View entering={FadeInUp.delay(500).duration(700)}>
            <Typography style={[ob.sectionEyebrow, { color: GOLD, marginBottom: 12 }]}>TWOJE ŚWIATY</Typography>
            <View style={ob.worldsGrid}>
              {WORLDS_PREVIEW.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Animated.View key={item.title} entering={FadeIn.delay(600 + i * 80).duration(500)}>
                    <View style={[ob.worldPreviewCard, { borderColor: item.accent + '30', backgroundColor: item.accent + '08' }]}>
                      <LinearGradient colors={[item.accent + '14', 'transparent']} style={StyleSheet.absoluteFillObject} />
                      <Icon color={item.accent} size={20} strokeWidth={1.6} />
                      <Typography style={[ob.worldTitle, { color: item.accent, marginTop: 10 }]}>{item.title}</Typography>
                      <Typography style={ob.worldCopy}>{item.copy}</Typography>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>
      );
    }
    return null;
  };

  return (
    <View style={ob.container}>
      {/* Dynamic step background */}
      <LinearGradient
        key={currentStep}
        colors={meta.gradColors}
        locations={meta.gradLoc}
        style={StyleSheet.absoluteFill}
      />
      <CelestialBackdrop intensity="immersive" />

      {/* Accent glow blob for current step */}
      <View style={[ob.stepGlowBlob, { backgroundColor: accent + '10' }]} pointerEvents="none" />

      <KeyboardAvoidingView behavior="padding" style={ob.kav} keyboardVerticalOffset={0}>
        <SafeAreaView style={[ob.safeArea, { paddingTop: insets.top }]}>

          {/* Top bar */}
          <View style={ob.topBar}>
            <Pressable
              onPress={previous}
              disabled={stepIndex === 0}
              hitSlop={14}
              style={ob.backBtn}
            >
              <Typography style={[ob.backText, { color: stepIndex === 0 ? WHITE_LOW : accent }]}>
                Wstecz
              </Typography>
            </Pressable>

            <View style={{ flex: 1, paddingHorizontal: 12 }}>
              <GradientProgressBar progress={progress} accent={accent} />
            </View>

            <Typography style={ob.stepCounter}>
              {stepIndex + 1}/{STEPS.length}
            </Typography>
          </View>

          {/* Step content */}
          <View style={ob.body}>
            <RNAnimated.View
              style={[ob.stepSlide, { transform: [{ translateX: slideX }], opacity: fadeV }]}
            >
              {renderStep()}
            </RNAnimated.View>
          </View>

          {/* Footer */}
          <View style={[ob.footer, { paddingBottom: isKeyboardStep ? 8 : Math.max(insets.bottom, 16) }]}>
            {/* Glow shadow under button */}
            <View style={[ob.btnGlowShadow, { shadowColor: accent }]} />
            <PremiumButton
              label={currentStep === 'entry'
                ? t('onboarding.enterAethera', { defaultValue: 'Wejdź do Aethery' })
                : t('onboarding.continue_btn', { defaultValue: 'Dalej →' })}
              onPress={next}
              disabled={!canContinue}
            />
            {(currentStep === 'spiritual_goals' || currentStep === 'favorite_practice' || currentStep === 'practice_frequency') && (
              <Pressable onPress={() => { animateStep('next'); setStepIndex(i => Math.min(i + 1, STEPS.length - 1)); }} hitSlop={10}>
                <Typography style={ob.skipBtn}>Pomiń</Typography>
              </Pressable>
            )}
            <Typography style={ob.footerNote}>{STEP_NOTES[currentStep]}</Typography>
          </View>

        </SafeAreaView>
      </KeyboardAvoidingView>

      <PremiumDatePickerSheet
        visible={showDatePicker}
        mode="date"
        title="Data urodzenia"
        description="Zasili astrologię, archetyp i osobisty ton prowadzenia."
        value={birthDateValue}
        maximumDate={new Date()}
        onCancel={() => setShowDatePicker(false)}
        onConfirm={value => {
          setBirthDate({ day: value.getDate(), month: value.getMonth() + 1, year: value.getFullYear() });
          setShowDatePicker(false);
        }}
      />
    </View>
  );
};

const ITEM_H  = 50;
const VISIBLE = 5;

const ob = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08071A' },
  kav:       { flex: 1 },
  safeArea:  { flex: 1 },

  stepGlowBlob: {
    position: 'absolute', top: '20%', left: '10%',
    width: W * 0.7, height: W * 0.7, borderRadius: W * 0.35,
  },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 6, paddingBottom: 14,
  },
  backBtn: { minWidth: 56 },
  backText: { fontSize: 14, fontWeight: '600' },
  stepCounter: { minWidth: 30, textAlign: 'right', fontSize: 12, color: WHITE_LOW },

  // Progress bar
  progressTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  progressShimmer: {
    position: 'absolute', right: 0,
    width: 20, height: '100%',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 2,
  },

  // Body / scroll
  body:      { flex: 1, minHeight: 0 },
  stepSlide: { flex: 1 },
  scroll:    { flex: 1 },
  scrollContent: {
    paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16, gap: 14,
  },
  inputScrollContent: {
    paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16, flexGrow: 1,
  },

  // Footer
  footer: {
    paddingHorizontal: 22, paddingTop: 10, gap: 8,
    backgroundColor: 'transparent',
  },
  footerNote: {
    textAlign: 'center', fontSize: 12, color: WHITE_LOW, lineHeight: 18,
  },
  btnGlowShadow: {
    position: 'absolute', top: 10, left: 40, right: 40, height: 4,
    borderRadius: 4, backgroundColor: 'transparent',
    shadowOpacity: 0.5, shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  // Hero step layout
  stepHeroCenter: { alignItems: 'center', gap: 16 },
  stepHeroTitle: {
    fontSize: 24, fontWeight: '700',
    lineHeight: 34, textAlign: 'center',
    letterSpacing: -0.3,
  },
  stepHeroBody: {
    fontSize: 14, color: WHITE_MED,
    lineHeight: 22, textAlign: 'center',
  },

  // Hero icon
  heroIconWrapper: {
    width: 130, height: 130,
    alignItems: 'center', justifyContent: 'center',
  },
  heroIconGlowOuter: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 1,
  },
  heroIconGlowInner: {
    position: 'absolute',
    width: 98, height: 98, borderRadius: 49,
    borderWidth: 1.5,
  },
  heroIconCore: {
    width: 82, height: 82, borderRadius: 41,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  heroIconGlowFill: {
    position: 'absolute',
    width: 60, height: 60, borderRadius: 30,
  },

  // Glass section card
  glassSectionCard: {
    borderRadius: 20, borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
    padding: 18, overflow: 'hidden',
  },
  sectionEyebrow: {
    fontSize: 9.5, fontWeight: '700',
    letterSpacing: 2, marginBottom: 14,
  },

  // World rows
  worldRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  worldIconBox: {
    width: 36, height: 36, borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  worldTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  worldCopy:  { fontSize: 12, color: WHITE_MED, lineHeight: 17 },

  // Steps preview
  stepsPreviewRow: {
    flexDirection: 'row', justifyContent: 'space-around', marginTop: 10,
  },
  stepPreviewDot: { alignItems: 'center', gap: 6 },
  stepPreviewCircle: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  stepPreviewNum:   { fontSize: 14, fontWeight: '700' },
  stepPreviewLabel: { fontSize: 11, color: WHITE_LOW },

  // Input step
  inputStepCenter: {
    flex: 1, justifyContent: 'center',
    paddingTop: 16, gap: 18,
  },
  inputBigTitle: {
    fontSize: 24, fontWeight: '600',
    lineHeight: 33, letterSpacing: -0.3,
    color: WHITE_HIGH,
  },
  inputBigSub: {
    fontSize: 14, lineHeight: 22,
    color: WHITE_MED,
  },

  // Glass input box
  inputGlassBox: {
    borderRadius: 20, borderWidth: 1,
    backgroundColor: GLASS_BG,
    padding: 18, overflow: 'hidden',
  },
  inputGlassLabel: {
    fontSize: 9.5, fontWeight: '700',
    letterSpacing: 2, marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14,
    marginBottom: 0, overflow: 'hidden',
  },
  inputIcon: { paddingLeft: 14, paddingRight: 4 },
  textInput: {
    flex: 1,
    paddingHorizontal: 12, paddingVertical: 15,
    fontSize: 17, color: WHITE_HIGH, letterSpacing: 0.2,
  },
  inputHint: {
    fontSize: 12, color: WHITE_LOW, lineHeight: 18, marginTop: 10,
  },

  // Date picker trigger
  dateTrigger:     { marginTop: 4 },
  dateRow:         { flexDirection: 'row', gap: 10 },
  dateCol: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    minHeight: 76, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1,
  },
  dateColWide: { flex: 1.5 },
  dateVal:   { fontSize: 17, fontWeight: '600' },
  dateLabel: { fontSize: 11, color: WHITE_LOW, marginTop: 4 },
  dateTriggerHint: {
    textAlign: 'center', color: WHITE_LOW,
    fontSize: 12, marginTop: 12,
  },

  // Option cards
  optionCard: {
    borderRadius: 18, borderWidth: 1,
    padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    overflow: 'hidden',
  },
  optionIconBox: {
    width: 44, height: 44, borderRadius: 13,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  optionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  optionCopy:  { fontSize: 12, color: WHITE_MED, lineHeight: 18 },
  optionCheckCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },

  // Entry summary
  summaryRow: { paddingVertical: 13 },
  summaryLabel: { fontSize: 9.5, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  summaryVal:   { fontSize: 15, fontWeight: '400', color: WHITE_HIGH },

  // Worlds grid
  worldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  worldPreviewCard: {
    padding: 16, width: '47.5%',
    borderRadius: 16, borderWidth: 1,
    overflow: 'hidden',
  },

  // Personalization pills
  pillGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 11,
  },
  pillText: {
    fontSize: 14, fontWeight: '500',
  },
  pillCheck: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(167,139,250,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Frequency full-width cards
  freqCard: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5, borderRadius: 16,
    paddingHorizontal: 20, paddingVertical: 16,
    marginBottom: 10, overflow: 'hidden',
  },
  freqText: {
    fontSize: 16, fontWeight: '500',
  },

  // Skip button
  skipBtn: {
    textAlign: 'center', fontSize: 14,
    color: WHITE_LOW, paddingVertical: 4,
    letterSpacing: 0.2,
  },
});
