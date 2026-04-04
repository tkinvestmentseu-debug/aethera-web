// @ts-nocheck
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import {
  View, StyleSheet, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, Pressable, Text, Keyboard
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Star, Moon, Eye, Compass, BookOpen, Check } from 'lucide-react-native';
import { useAppStore } from '../../../store/useAppStore';
import { CelestialBackdrop } from '../../../components/CelestialBackdrop';
import { PremiumButton } from '../../../components/PremiumButton';
import { layout } from '../../../core/theme/designSystem';
import { themes, ThemeName } from '../../../core/theme/tokens';
import { PremiumDatePickerSheet } from '../../../components/PremiumDatePickerSheet';

type BirthDateState = { day: number; month: number; year: number };
type OnboardingStep = 'welcome' | 'identity' | 'gender' | 'birth' | 'birth_place' | 'experience' | 'entry';
const STEPS: OnboardingStep[] = ['welcome', 'identity', 'gender', 'birth', 'birth_place', 'experience', 'entry'];

const GENDER_OPTIONS = [
  { id: 'woman',      label: 'Kobieta',          sub: 'Oracle zwróci się do Ciebie: Pani / Ty' },
  { id: 'man',        label: 'Mężczyzna',        sub: 'Oracle zwróci się do Ciebie: Pan / Ty' },
  { id: 'prefer_not', label: 'Wolę nie podawać', sub: 'Oracle używa formy neutralnej' },
];

const EXPERIENCE_OPTIONS = [
  { id: 'beginner', icon: Star, title: 'Dopiero wchodzę', description: 'Chcę prostego języka i spokojnego prowadzenia.' },
  { id: 'intermediate', icon: Moon, title: 'Już praktykuję', description: 'Szukam równowagi między intuicją i symboliczną głębią.' },
  { id: 'advanced', icon: Sparkles, title: 'Jestem głęboko w temacie', description: 'Potrzebuję bogatszych warstw i dojrzałego guidance.' },
];

const WORLDS_PREVIEW = [
  { icon: Compass, title: 'Dzisiaj', copy: 'Osobisty ton dnia i kolejne ruchy.' },
  { icon: Star, title: 'Światy', copy: 'Tarot, Horoskop, Rytuał i więcej.' },
  { icon: Eye, title: 'Oracle', copy: 'AI prowadzacy do konkretnego kroku.' },
  { icon: BookOpen, title: 'Profil', copy: 'Centrum ustawien i pamieci.' },
];

const STEP_NOTES: Record<OnboardingStep, string> = {
  welcome: 'Wejście zajmuje mniej niż 2 minuty.',
  identity: 'Imię pojawi się w centrum dnia i sesjach Oracle.',
  gender: 'Płeć wpływa na sposób, w jaki Oracle się do Ciebie zwraca.',
  birth: 'Data zasila astrologię i osobisty archetyp dnia.',
  birth_place: 'Miasto domknie głębszą warstwę astrologii.',
  experience: 'Ustawia głębię języka i rytm prowadzenia.',
  entry: 'Wszystko można zmienić w Profilu w dowolnym momencie.',
};

// Kroki z klawiatura — footer musi byc bezposrednio nad nia
const KEYBOARD_STEPS: OnboardingStep[] = ['identity', 'birth_place'];

export const OnboardingScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { setOnboarded, setUserData, themeName } = useAppStore();
  const theme = themes[themeName as ThemeName] || themes['dark'];
  const accent = theme.primary;
  const isLight = theme.background.startsWith('#F');
  const textPrimary = isLight ? '#1A1410' : '#F0EBE2';
  const textSecondary = isLight ? '#6A5A48' : 'rgba(240,235,226,0.68)';
  const textHint = isLight ? '#8A7060' : 'rgba(240,235,226,0.50)';
  const cardBgLow = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)';
  const cardBgMid = isLight ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.06)';
  const cardBgHigh = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.08)';
  const optionBgActive = isLight ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.12)';
  const checkBorder = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)';
  const progressTrackColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)';
  const inputBgColor = isLight ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.06)';
  const nameInputRef = useRef<TextInput>(null);
  const placeInputRef = useRef<TextInput>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState<BirthDateState>({ day: 1, month: 1, year: 1996 });
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced' | ''>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const currentStep = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const isKeyboardStep = KEYBOARD_STEPS.includes(currentStep);

  const formattedBirthDate = `${birthDate.year.toString().padStart(4,'0')}-${birthDate.month.toString().padStart(2,'0')}-${birthDate.day.toString().padStart(2,'0')}`;

  const birthDateValue = useMemo(() => {
    const d = new Date(birthDate.year, birthDate.month - 1, birthDate.day);
    return Number.isNaN(d.getTime()) ? new Date(1996, 0, 1) : d;
  }, [birthDate.day, birthDate.month, birthDate.year]);

  const birthDateParts = useMemo(() => ({
    day: birthDateValue.toLocaleDateString('pl-PL', { day: '2-digit' }),
    month: birthDateValue.toLocaleDateString('pl-PL', { month: 'long' }),
    year: birthDateValue.toLocaleDateString('pl-PL', { year: 'numeric' }),
  }), [birthDateValue]);

  const canContinue = useMemo(() => {
    switch (currentStep) {
      case 'welcome': return true;
      case 'identity': return name.trim().length >= 2;
      case 'gender': return Boolean(gender);
      case 'birth': return birthDate.year >= 1900;
      case 'birth_place': return birthPlace.trim().length >= 2;
      case 'experience': return Boolean(experienceLevel);
      case 'entry': return true;
      default: return false;
    }
  }, [birthDate.year, birthPlace, currentStep, experienceLevel, gender, name]);

  const finishOnboarding = () => {
    setUserData({
      name: name.trim(), gender, birthDate: formattedBirthDate, birthPlace: birthPlace.trim(),
      experienceLevel, primaryIntention: experienceLevel === 'advanced' ? 'Rozwój' : 'Spokój',
      currentFocus: experienceLevel === 'advanced' ? 'Orientacja symboliczna' : 'Spokojne wejście',
      spiritualGoals: ['Poznanie siebie'], preferredTone: experienceLevel === 'advanced' ? 'reflective' : 'gentle',
      preferredRitualCategory: 'Cleansing', soulPathState: experienceLevel === 'advanced' ? 'awakening' : 'reflecting',
    });
    setOnboarded(true);
  };

  const next = () => {
    if (!canContinue) return;
    Keyboard.dismiss();
    if (currentStep === 'entry') { finishOnboarding(); return; }
    setStepIndex(i => Math.min(i + 1, STEPS.length - 1));
  };
  const previous = () => { Keyboard.dismiss(); setStepIndex(i => Math.max(i - 1, 0)); };

  const renderStep = () => {
    if (currentStep === 'welcome') {
      return (
        <ScrollView style={ob.scroll} contentContainerStyle={ob.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={ob.logoHero}>
            <LinearGradient colors={[accent + '44', accent + '18']} style={ob.logoCircle}>
              <Sparkles color={accent} size={32} strokeWidth={1.5}/>
            </LinearGradient>
            <Text style={[ob.appName, { color: accent, fontSize: 22 }]}>Aethera DuniAI & Oracle</Text>
            <Text style={[ob.appSub, { color: textHint }]}>Sanktuarium AI, symboli i rytuału</Text>
          </View>
          <View style={[ob.heroCard, { backgroundColor: cardBgLow, borderColor: accent + '22' }]}>
            <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFill}/>
            <Text style={[ob.heroTitle, { color: textPrimary }]}>
              Sanktuarium stworzone, by prowadzić, nie przytłaczać.
            </Text>
            <Text style={[ob.heroBody, { color: '#5A4A38' }]}>
              Aethera łączy Tarot, astrologię, rytuały i inteligentnego Oracle w jeden spójny świat dostosowany do Twojego rytmu.
            </Text>
          </View>
          <View style={[ob.previewCard, { backgroundColor: cardBgMid, borderColor: accent + '18' }]}>
            <Text style={[ob.cardEyebrow, { color: accent }]}>CO ZNAJDZIESZ</Text>
            {WORLDS_PREVIEW.map(item => {
              const Icon = item.icon;
              return (
                <View key={item.title} style={ob.worldRow}>
                  <View style={[ob.worldIcon, { borderColor: accent + '33', backgroundColor: accent + '14' }]}>
                    <Icon color={accent} size={16} strokeWidth={1.8}/>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[ob.worldTitle, { color: accent }]}>{item.title}</Text>
                    <Text style={[ob.worldCopy, { color: textSecondary }]}>{item.copy}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={[ob.stepsCard, { backgroundColor: cardBgMid, borderColor: accent + '18' }]}>
            <Text style={[ob.cardEyebrow, { color: accent }]}>JAK WYGLĄDA WEJŚCIE</Text>
            <View style={ob.stepsRow}>
              {['Imię', 'Płeć', 'Data', 'Miasto', 'Poziom'].map((label, i) => (
                <View key={label} style={ob.stepDot}>
                  <View style={[ob.stepCircle, { borderColor: accent + '55', backgroundColor: accent + '18' }]}>
                    <Text style={[ob.stepNum, { color: accent }]}>{i + 1}</Text>
                  </View>
                  <Text style={[ob.stepLabel, { color: textHint }]}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
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
            <View style={[ob.stepIconBig, { borderColor: accent + '44', backgroundColor: accent + '18' }]}>
              {isName ? <Sparkles color={accent} size={24} strokeWidth={1.5}/> : <Compass color={accent} size={24} strokeWidth={1.5}/>}
            </View>
            <Text style={[ob.inputBigTitle, { color: textPrimary }]}>
              {isName ? 'Jak do Ciebie mówić?' : 'Skąd pochodzi Twoja mapa nieba?'}
            </Text>
            <Text style={[ob.inputBigSub, { color: textSecondary }]}>
              {isName
                ? 'Twoje imię pojawi się w centrum dnia, w Oracle i w najbardziej osobistych warstwach.'
                : 'Wystarczy nazwa miasta. To domknie głębszą warstwę astrologii i osobistego wykresu.'}
            </Text>
            <View style={[ob.inputBox, { backgroundColor: cardBgHigh, borderColor: accent + '33' }]}>
              <LinearGradient colors={[accent + '12', 'transparent']} style={StyleSheet.absoluteFill}/>
              <Text style={[ob.inputLabel, { color: accent }]}>
                {isName ? 'TWOJE IMIĘ' : 'MIASTO LUB MIEJSCOWOŚĆ'}
              </Text>
              <TextInput
                ref={isName ? nameInputRef : placeInputRef}
                style={[ob.textInput, { color: textPrimary, borderColor: accent + '33', backgroundColor: inputBgColor }]}
                placeholder={isName ? t('onboarding.namePlaceholder') : 'np. Warszawa, Kraków...'}
                placeholderTextColor="#A89A8A"
                value={isName ? name : birthPlace}
                onChangeText={isName ? setName : setBirthPlace}
                returnKeyType="done"
                onSubmitEditing={next}
                autoFocus
                autoCapitalize="words"
              />
              <Text style={[ob.inputHint, { color: textHint }]}>
                {isName ? 'Aethera będzie Cię tak witać każdego dnia.' : 'Wystarczy przybliżona lokalizacja.'}
              </Text>
            </View>
          </View>
        </ScrollView>
      );
    }

    if (currentStep === 'gender') {
      return (
        <ScrollView style={ob.scroll} contentContainerStyle={ob.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[ob.stepIconBig, { borderColor: accent + '44', backgroundColor: accent + '18', alignSelf: 'center' }]}>
            <Sparkles color={accent} size={24} strokeWidth={1.5}/>
          </View>
          <Text style={[ob.inputBigTitle, { color: textPrimary, textAlign: 'center', marginTop: 12 }]}>
            Jak się do Ciebie zwracać?
          </Text>
          <Text style={[ob.inputBigSub, { color: textSecondary, textAlign: 'center', marginBottom: 20 }]}>
            Oracle dostosuje ton i formę zwrotu do Twoich preferencji.
          </Text>
          {GENDER_OPTIONS.map(option => {
            const active = gender === option.id;
            return (
              <Pressable key={option.id} onPress={() => setGender(option.id)}>
                <View style={[ob.optionCard, {
                  backgroundColor: active ? optionBgActive : cardBgMid,
                  borderColor: active ? accent + '66' : accent + '22',
                }]}>
                  {active && <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFill}/>}
                  <View style={{ flex: 1 }}>
                    <Text style={[ob.optionTitle, { color: active ? accent : '#1A1410' }]}>{option.label}</Text>
                    <Text style={[ob.optionCopy, { color: textSecondary }]}>{option.sub}</Text>
                  </View>
                  <View style={[ob.optionCheck, { borderColor: active ? accent : checkBorder, backgroundColor: active ? accent : 'transparent' }]}>
                    {active && <Check color="#FFF" size={12} strokeWidth={3}/>}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      );
    }

    if (currentStep === 'birth') {
      return (
        <ScrollView style={ob.scroll} contentContainerStyle={ob.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[ob.stepIconBig, { borderColor: accent + '44', backgroundColor: accent + '18', alignSelf: 'center' }]}>
            <Moon color={accent} size={24} strokeWidth={1.5}/>
          </View>
          <Text style={[ob.inputBigTitle, { color: textPrimary, textAlign: 'center', marginTop: 12 }]}>
            Kiedy zaczęła się Twoja droga?
          </Text>
          <Text style={[ob.inputBigSub, { color: textSecondary, textAlign: 'center', marginBottom: 20 }]}>
            Data urodzenia łączy astrologię, archetyp i energię dnia w jeden spójny obraz.
          </Text>
          <View style={[ob.inputBox, { backgroundColor: cardBgHigh, borderColor: accent + '33' }]}>
            <LinearGradient colors={[accent + '12', 'transparent']} style={StyleSheet.absoluteFill}/>
            <Text style={[ob.inputLabel, { color: accent }]}>{t('onboarding.birthDate')}</Text>
            <Pressable onPress={() => setShowDatePicker(true)} style={ob.dateTrigger}>
              <View style={ob.dateRow}>
                {[
                  { val: birthDateParts.day, label: 'dzień' },
                  { val: birthDateParts.month, label: 'miesiąc' },
                  { val: birthDateParts.year, label: 'rok' },
                ].map(({ val, label }) => (
                  <View key={label} style={[ob.dateCol, label === 'miesiąc' && ob.dateColWide, { borderColor: accent + '44', backgroundColor: accent + '12' }]}>
                    <Text style={[ob.dateVal, { color: accent }]}>{val}</Text>
                    <Text style={[ob.dateLabel, { color: textHint }]}>{label}</Text>
                  </View>
                ))}
              </View>
              <Text style={[ob.inputHint, { color: textHint, textAlign: 'center', marginTop: 12 }]}>
                Dotknij, aby zmienić datę
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      );
    }

    if (currentStep === 'experience') {
      return (
        <ScrollView style={ob.scroll} contentContainerStyle={ob.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[ob.stepIconBig, { borderColor: accent + '44', backgroundColor: accent + '18', alignSelf: 'center' }]}>
            <Star color={accent} size={24} strokeWidth={1.5}/>
          </View>
          <Text style={[ob.inputBigTitle, { color: textPrimary, textAlign: 'center', marginTop: 12 }]}>
            Jak głęboko chcesz wejść?
          </Text>
          <Text style={[ob.inputBigSub, { color: textSecondary, textAlign: 'center', marginBottom: 20 }]}>
            To nie ocena. To sposób ustawienia głębokości języka i tempa prowadzenia.
          </Text>
          {EXPERIENCE_OPTIONS.map(option => {
            const active = experienceLevel === option.id;
            const Icon = option.icon;
            return (
              <Pressable key={option.id} onPress={() => setExperienceLevel(option.id as any)}>
                <View style={[ob.optionCard, {
                  backgroundColor: active ? optionBgActive : cardBgMid,
                  borderColor: active ? accent + '66' : accent + '22',
                }]}>
                  {active && <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFill}/>}
                  <View style={[ob.optionIcon, { borderColor: active ? accent + '55' : accent + '22', backgroundColor: active ? accent + '18' : accent + '0A' }]}>
                    <Icon color={accent} size={20} strokeWidth={1.8}/>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[ob.optionTitle, { color: active ? accent : '#1A1410' }]}>{option.title}</Text>
                    <Text style={[ob.optionCopy, { color: textSecondary }]}>{option.description}</Text>
                  </View>
                  <View style={[ob.optionCheck, { borderColor: active ? accent : checkBorder, backgroundColor: active ? accent : 'transparent' }]}>
                    {active && <Check color="#FFF" size={12} strokeWidth={3}/>}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      );
    }

    if (currentStep === 'entry') {
      return (
        <ScrollView style={ob.scroll} contentContainerStyle={ob.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={ob.entryLogo}>
            <LinearGradient colors={[accent + '44', accent + '18']} style={ob.entryLogoIcon}>
              <Sparkles color={accent} size={20} strokeWidth={1.5}/>
            </LinearGradient>
            <Text style={[ob.appName, { color: accent, fontSize: 18 }]}>Aethera DuniAI & Oracle</Text>
          </View>
          <Text style={[ob.inputBigTitle, { color: textPrimary, textAlign: 'center', marginTop: 4 }]}>
            Twoje sanktuarium jest gotowe.
          </Text>
          <Text style={[ob.inputBigSub, { color: textSecondary, textAlign: 'center', marginBottom: 20 }]}>
            Wszystko ustawione. Możesz teraz wejść i odkrywać swój osobisty świat.
          </Text>
          <View style={[ob.inputBox, { backgroundColor: cardBgHigh, borderColor: accent + '33' }]}>
            <LinearGradient colors={[accent + '12', 'transparent']} style={StyleSheet.absoluteFill}/>
            {[
              { label: 'Imię', value: name },
              { label: 'Forma zwrotu', value: GENDER_OPTIONS.find(o => o.id === gender)?.label || '' },
              { label: 'Data urodzenia', value: formattedBirthDate },
              { label: 'Miejsce urodzenia', value: birthPlace },
              { label: 'Poziom wejścia', value: EXPERIENCE_OPTIONS.find(o => o.id === experienceLevel)?.title || '' },
            ].map((row, i, arr) => (
              <View key={row.label} style={[ob.summaryRow, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: accent + '22' }]}>
                <Text style={[ob.summaryLabel, { color: accent }]}>{row.label}</Text>
                <Text style={[ob.summaryVal, { color: textPrimary }]}>{row.value}</Text>
              </View>
            ))}
          </View>
          <View style={ob.worldsGrid}>
            {WORLDS_PREVIEW.map(item => {
              const Icon = item.icon;
              return (
                <View key={item.title} style={[ob.worldPreviewCard, { backgroundColor: cardBgMid, borderColor: accent + '22' }]}>
                  <Icon color={accent} size={18} strokeWidth={1.8}/>
                  <Text style={[ob.worldTitle, { color: accent, marginTop: 8 }]}>{item.title}</Text>
                  <Text style={[ob.worldCopy, { color: textSecondary }]}>{item.copy}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      );
    }
    return null;
  };

  return (
    <View style={ob.container}>
      <CelestialBackdrop intensity="immersive"/>
      <LinearGradient colors={isLight ? ['#FAF6EE', '#F2E8D8'] as const : ['#0B0A14', '#0F0920'] as const} style={StyleSheet.absoluteFill}/>

      <KeyboardAvoidingView
        behavior="padding"
        style={ob.kav}
        keyboardVerticalOffset={0}
      >
        <SafeAreaView style={[ob.safeArea, { paddingTop: insets.top }]}>

          <View style={ob.topBar}>
            <Pressable onPress={previous} disabled={stepIndex === 0} hitSlop={14} style={ob.backBtn}>
              <Text style={[ob.backText, { color: stepIndex === 0 ? '#C0B0A0' : accent }]}>Wstecz</Text>
            </Pressable>
            <View style={[ob.progressTrack, { backgroundColor: progressTrackColor }]}>
              <View style={[ob.progressFill, { width: `${progress}%`, backgroundColor: accent }]}/>
            </View>
            <Text style={ob.stepCounter}>{stepIndex + 1}/{STEPS.length}</Text>
          </View>

          {/* Tresc ekranu */}
          <View style={ob.body}>
            {renderStep()}
          </View>

          {/*
            FOOTER — bezposrednio nad klawiatura.
            Na krokach z inputem KeyboardAvoidingView pushuje caly SafeAreaView
            w gore, wiec footer naturalnie laduje tuz nad klawiatura.
            paddingBottom uzywa insets.bottom tylko gdy klawiatura jest schowana.
          */}
          <View style={[
            ob.footer,
            { paddingBottom: isKeyboardStep ? 8 : Math.max(insets.bottom, 16) }
          ]}>
            <PremiumButton
              label={currentStep === 'entry' ? t('onboarding.enterAethera') : t('onboarding.continue_btn')}
              onPress={next}
              disabled={!canContinue}
            />
            <Text style={[ob.footerNote, { color: textHint }]}>{STEP_NOTES[currentStep]}</Text>
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

const ob = StyleSheet.create({
  container: { flex: 1 },
  kav: { flex: 1 },
  safeArea: { flex: 1 },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingTop: 6, paddingBottom: 12 },
  backBtn: { minWidth: 52 },
  backText: { fontSize: 14, fontWeight: '600' },
  progressTrack: { flex: 1, height: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  stepCounter: { minWidth: 28, textAlign: 'right', fontSize: 12, color: '#A89A8A' },

  body: { flex: 1, minHeight: 0 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16, gap: 14 },
  inputScrollContent: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16, flexGrow: 1 },

  // Footer — nie uczestniczy w flex scroll, lezy tuz nad klawiatura
  footer: { paddingHorizontal: 22, paddingTop: 10, gap: 8, backgroundColor: 'transparent' },
  footerNote: { textAlign: 'center', fontSize: 12, color: '#A89A8A', lineHeight: 18 },

  logoHero: { alignItems: 'center', paddingTop: 8, paddingBottom: 4, gap: 8 },
  logoCircle: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 32, fontWeight: '300', letterSpacing: 1 },
  appSub: { fontSize: 10, color: '#A89A8A', letterSpacing: 2.5, textTransform: 'uppercase' },

  heroCard: { borderRadius: 20, borderWidth: 1, padding: 22, overflow: 'hidden' },
  heroTitle: { fontSize: 20, fontWeight: '500', lineHeight: 28, marginBottom: 12 },
  heroBody: { fontSize: 15, lineHeight: 24 },

  previewCard: { borderRadius: 18, borderWidth: 1, padding: 18, overflow: 'hidden' },
  cardEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 14 },
  worldRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(169,122,57,0.1)' },
  worldIcon: { width: 36, height: 36, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  worldTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  worldCopy: { fontSize: 12, lineHeight: 17 },

  stepsCard: { borderRadius: 18, borderWidth: 1, padding: 18 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14 },
  stepDot: { alignItems: 'center', gap: 6 },
  stepCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 14, fontWeight: '700' },
  stepLabel: { fontSize: 11, color: '#8A7A6A' },

  inputStepCenter: { flex: 1, justifyContent: 'center', paddingTop: 20, gap: 16 },
  stepIconBig: { width: 60, height: 60, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  inputBigTitle: { fontSize: 24, fontWeight: '400', lineHeight: 32, letterSpacing: -0.3 },
  inputBigSub: { fontSize: 14, lineHeight: 22 },

  inputBox: { borderRadius: 20, borderWidth: 1, padding: 20, overflow: 'hidden' },
  inputLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 12 },
  textInput: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 18, letterSpacing: 0.2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  inputHint: { fontSize: 12, lineHeight: 18, marginTop: 10 },

  dateTrigger: { marginTop: 4 },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateCol: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 78, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  dateColWide: { flex: 1.5 },
  dateVal: { fontSize: 18, fontWeight: '600' },
  dateLabel: { fontSize: 11, marginTop: 4 },

  optionCard: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden' },
  optionIcon: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  optionCopy: { fontSize: 13, lineHeight: 19 },
  optionCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },

  entryLogo: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 8 },
  entryLogoIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { paddingVertical: 14 },
  summaryLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  summaryVal: { fontSize: 16, fontWeight: '400' },
  worldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  worldPreviewCard: { padding: 16, width: '47.5%', borderRadius: 16, borderWidth: 1 },
});