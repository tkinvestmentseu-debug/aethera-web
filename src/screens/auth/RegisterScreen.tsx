// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
  Animated as RNAnimated, Easing as RNEasing, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { AuthService } from '../../core/services/auth.service';
import { hydrateUserProfile, useAuthStore } from '../../store/useAuthStore';
import { EmailService } from '../../core/services/email.service';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { MoonStar, User, MapPin, Mail, Lock, Check, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { Typography } from '../../components/Typography';

const { width: W, height: H } = Dimensions.get('window');

// ── Palette ────────────────────────────────────────────────────────────────────
const BG_DEEP     = '#07071A';
const BG_VIOLET   = '#0D0B1E';
const BG_INDIGO   = '#0F1030';
const GOLD        = '#D4A843';
const GOLD_SOFT   = '#F0C96A';
const PURPLE_CORE = '#7C3AED';
const PURPLE_SOFT = '#A78BFA';
const WHITE_HIGH  = 'rgba(255,255,255,0.92)';
const WHITE_MED   = 'rgba(255,255,255,0.55)';
const WHITE_LOW   = 'rgba(255,255,255,0.28)';

// ── Zodiac calculation ────────────────────────────────────────────────────────
const ZODIAC_DATA = [
  { sign: 'Koziorożec', emoji: '🌙', archetype: 'Strażnik',    fromM: 12, fromD: 22 },
  { sign: 'Wodnik',     emoji: '⚡', archetype: 'Wizjoner',    fromM: 1,  fromD: 20 },
  { sign: 'Ryby',       emoji: '🕊️', archetype: 'Mistyk',     fromM: 2,  fromD: 19 },
  { sign: 'Baran',      emoji: '🔥', archetype: 'Wojownik',    fromM: 3,  fromD: 21 },
  { sign: 'Byk',        emoji: '🌿', archetype: 'Twórca',      fromM: 4,  fromD: 20 },
  { sign: 'Bliźnięta',  emoji: '✨', archetype: 'Poszukiwacz', fromM: 5,  fromD: 21 },
  { sign: 'Rak',        emoji: '🌊', archetype: 'Uzdrowiciel', fromM: 6,  fromD: 21 },
  { sign: 'Lew',        emoji: '🌺', archetype: 'Wizjoner',    fromM: 7,  fromD: 23 },
  { sign: 'Panna',      emoji: '🌸', archetype: 'Mędrzec',     fromM: 8,  fromD: 23 },
  { sign: 'Waga',       emoji: '🦋', archetype: 'Strażnik',    fromM: 9,  fromD: 23 },
  { sign: 'Skorpion',   emoji: '🔮', archetype: 'Mistyk',      fromM: 10, fromD: 23 },
  { sign: 'Strzelec',   emoji: '💫', archetype: 'Poszukiwacz', fromM: 11, fromD: 22 },
];

function getZodiacData(month, day) {
  for (let i = ZODIAC_DATA.length - 1; i >= 0; i--) {
    const z = ZODIAC_DATA[i];
    if (month > z.fromM || (month === z.fromM && day >= z.fromD)) return z;
  }
  return ZODIAC_DATA[0];
}

const MONTHS = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień',
];

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

// ── Wheel picker ──────────────────────────────────────────────────────────────
const ITEM_H  = 50;
const VISIBLE = 5;

const WheelPicker = ({ items, selectedIndex, onChange }) => {
  const scrollRef   = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
    }, 80);
    return () => clearTimeout(t);
  }, []);

  const handleMomentumScrollEnd = useCallback((e) => {
    const offset  = e.nativeEvent.contentOffset.y;
    const index   = Math.round(offset / ITEM_H);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    onChange(clamped);
  }, [items.length, onChange]);

  return (
    <View style={[rs.wheel, { height: ITEM_H * VISIBLE }]}>
      <LinearGradient
        colors={['rgba(7,7,26,0.95)', 'transparent']}
        style={[rs.wheelFade, { top: 0 }]}
        pointerEvents="none"
      />
      <View style={rs.wheelBand} pointerEvents="none" />
      <LinearGradient
        colors={['transparent', 'rgba(7,7,26,0.95)']}
        style={[rs.wheelFade, { bottom: 0 }]}
        pointerEvents="none"
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        nestedScrollEnabled
      >
        {items.map((item, i) => {
          const active = i === selectedIndex;
          return (
            <View key={i} style={{ height: ITEM_H, justifyContent: 'center', alignItems: 'center' }}>
              <Typography style={[rs.wheelItem, active && rs.wheelItemActive]}>
                {item}
              </Typography>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ── Glow input ────────────────────────────────────────────────────────────────
const GlowInput = ({ focused, icon: Icon, children }) => {
  const anim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.timing(anim, { toValue: focused ? 1 : 0, duration: 240, useNativeDriver: false }).start();
  }, [focused]);

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(167,139,250,0.18)', 'rgba(212,168,67,0.72)'],
  });
  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.04)', 'rgba(212,168,67,0.05)'],
  });

  return (
    <RNAnimated.View style={[rs.inputWrapper, { borderColor, backgroundColor: bgColor }]}>
      {Icon && (
        <View style={rs.inputIcon}>
          <Icon color={focused ? GOLD : PURPLE_SOFT + '70'} size={16} strokeWidth={1.6} />
        </View>
      )}
      {children}
    </RNAnimated.View>
  );
};

// ── Step progress indicator ───────────────────────────────────────────────────
const StepIndicator = ({ step }) => {
  const prog = useRef(new RNAnimated.Value(step === 1 ? 0.5 : 1)).current;
  useEffect(() => {
    RNAnimated.timing(prog, {
      toValue: step === 1 ? 0.5 : 1,
      duration: 400,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: false,
    }).start();
  }, [step]);

  const progWidth = prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={rs.progressSection}>
      {/* Track */}
      <View style={rs.progressTrack}>
        <RNAnimated.View style={[rs.progressFill, { width: progWidth }]}>
          <LinearGradient
            colors={[GOLD_SOFT, GOLD, PURPLE_SOFT]}
            start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        </RNAnimated.View>
      </View>
      {/* Drops */}
      <View style={rs.stepsDotsRow}>
        {[1, 2].map(n => {
          const done    = step > n;
          const active  = step === n;
          return (
            <View key={n} style={rs.stepDotWrap}>
              <View style={[
                rs.stepDrop,
                done   && rs.stepDropDone,
                active && rs.stepDropActive,
              ]}>
                {done
                  ? <Check color="#fff" size={10} strokeWidth={3} />
                  : <Typography style={[rs.stepNum, active && { color: '#fff' }]}>{n}</Typography>
                }
              </View>
              <Typography style={rs.stepDotLabel}>
                {n === 1 ? 'Konto' : 'Profil'}
              </Typography>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ── Floating particle ─────────────────────────────────────────────────────────
const Particle = ({ delay, x, size, duration, color }) => {
  const y       = useRef(new RNAnimated.Value(H + 20)).current;
  const opacity = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    const run = () => {
      y.setValue(H + 20);
      opacity.setValue(0);
      RNAnimated.sequence([
        RNAnimated.delay(delay),
        RNAnimated.parallel([
          RNAnimated.timing(y, { toValue: -60, duration, easing: RNEasing.linear, useNativeDriver: true }),
          RNAnimated.sequence([
            RNAnimated.timing(opacity, { toValue: 0.7, duration: 600, useNativeDriver: true }),
            RNAnimated.timing(opacity, { toValue: 0.7, duration: duration - 1200, useNativeDriver: true }),
            RNAnimated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => run());
    };
    run();
  }, []);
  return (
    <RNAnimated.View style={{
      position: 'absolute', left: x, width: size, height: size,
      borderRadius: size / 2, backgroundColor: color, opacity,
      transform: [{ translateY: y }],
    }} />
  );
};

const PARTICLES = [
  { delay: 0,    x: W * 0.08, size: 2,   duration: 7200, color: PURPLE_SOFT },
  { delay: 1200, x: W * 0.30, size: 2.5, duration: 8600, color: GOLD_SOFT },
  { delay: 2400, x: W * 0.52, size: 1.5, duration: 6400, color: PURPLE_SOFT },
  { delay: 3600, x: W * 0.72, size: 2,   duration: 9000, color: GOLD_SOFT },
  { delay: 800,  x: W * 0.88, size: 1.5, duration: 7600, color: PURPLE_SOFT },
  { delay: 4000, x: W * 0.20, size: 2,   duration: 8100, color: GOLD_SOFT },
  { delay: 1600, x: W * 0.62, size: 1.5, duration: 6900, color: PURPLE_SOFT },
  { delay: 2900, x: W * 0.44, size: 2,   duration: 7400, color: GOLD_SOFT },
];

// ── Screen ────────────────────────────────────────────────────────────────────
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

export const RegisterScreen = ({ navigation }: any) => {
  const { t }       = useTranslation();
    const language = useAppStore(s => s.language);
  const [step, setStep] = useState(1);

  // Step 1
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused,  setPassFocused]  = useState(false);

  // Step 2
  const [displayName,  setDisplayName]  = useState('');
  const [birthPlace,   setBirthPlace]   = useState('');
  const [nameFocused,  setNameFocused]  = useState(false);
  const [placeFocused, setPlaceFocused] = useState(false);

  const [dayIdx,   setDayIdx]   = useState(0);
  const [monthIdx, setMonthIdx] = useState(0);
  const [yearIdx,  setYearIdx]  = useState(18);

  const [loading, setLoading] = useState(false);

  // Slide animation — outer wrapper only (no transform+entering mix)
  const slideX = useRef(new RNAnimated.Value(0)).current;
  const fadeV  = useRef(new RNAnimated.Value(1)).current;

  const animateIn = (direction: 'left' | 'right') => {
    const fromX = direction === 'right' ? W * 0.35 : -W * 0.35;
    slideX.setValue(fromX);
    fadeV.setValue(0);
    RNAnimated.parallel([
      RNAnimated.spring(slideX, { toValue: 0, tension: 70, friction: 11, useNativeDriver: true }),
      RNAnimated.timing(fadeV,  { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  };

  // Derived
  const selectedDay   = dayIdx + 1;
  const selectedMonth = monthIdx + 1;
  const selectedYear  = parseInt(YEARS[yearIdx], 10);
  const zodiacInfo    = getZodiacData(selectedMonth, selectedDay);
  const maxDays       = daysInMonth(selectedMonth, selectedYear);
  const dayItems      = Array.from({ length: maxDays }, (_, i) => String(i + 1).padStart(2, '0'));

  useEffect(() => {
    if (dayIdx >= maxDays) setDayIdx(maxDays - 1);
  }, [monthIdx, yearIdx]);

  const birthDateStr = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`;

  const goToStep2 = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Błąd', t('auth.email') + ' i ' + t('auth.password'));
      return;
    }
    if (password.length < 6) {
      Alert.alert('Błąd', t('auth.errorWeakPassword', { defaultValue: 'Hasło musi mieć co najmniej 6 znaków.' }));
      return;
    }
    setStep(2);
    animateIn('right');
  };

  const goToStep1 = () => {
    setStep(1);
    animateIn('left');
  };

  const handleRegister = async () => {
    if (!displayName.trim()) {
      Alert.alert('Błąd', t('auth.displayName', { defaultValue: 'Podaj imię' }));
      return;
    }
    setLoading(true);
    try {
      const trimmedName = displayName.trim();
      const user = await AuthService.register({
        email, password,
        displayName: trimmedName,
        zodiacSign:  zodiacInfo.sign,
        archetype:   zodiacInfo.archetype,
        avatarEmoji: zodiacInfo.emoji,
        birthDate:   birthDateStr,
        birthPlace:  birthPlace.trim() || undefined,
      });
      EmailService.sendWelcome({
        to: email.trim(),
        displayName: trimmedName,
        zodiacSign:  zodiacInfo.sign,
        zodiacEmoji: zodiacInfo.emoji,
        lang: language,
      }).catch(() => {});
      EmailService.sendAdminNotification({
        displayName: trimmedName,
        email:       email.trim(),
        zodiacSign:  zodiacInfo.sign,
        zodiacEmoji: zodiacInfo.emoji,
        lang:        language,
        source:      'app',
      }).catch((e) => console.warn('[Aethera] Admin notification failed:', e));
      useAuthStore.getState().setUser({
        uid: user.uid,
        email: user.email ?? email.trim(),
        displayName: trimmedName,
        zodiacSign: zodiacInfo.sign,
        archetype: zodiacInfo.archetype,
        avatarEmoji: zodiacInfo.emoji,
        bio: '',
        birthDate: birthDateStr,
        birthPlace: birthPlace.trim() || undefined,
      });
      void hydrateUserProfile(user.uid);
      // Navigation handled automatically by AppNavigator (isLoggedIn state change)
    } catch (e: any) {
      if (e?.code === 'auth/email-already-in-use') {
        Alert.alert(
          t('auth.errorEmailInUse'),
          t('auth.errorEmailInUseDetail') || 'Ten adres email jest już zarejestrowany.',
          [
            { text: t('auth.goToLogin') || 'Zaloguj się', onPress: () => navigation.navigate('Login') },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else {
        const msg = e?.code === 'auth/weak-password'
          ? t('auth.errorWeakPassword')
          : t('auth.errorConnection');
        Alert.alert('Błąd', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG_DEEP }}>
      <LinearGradient
        colors={[BG_DEEP, BG_VIOLET, BG_INDIGO, '#0C0E2C']}
        locations={[0, 0.4, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={rs.blobTopRight}   pointerEvents="none" />
      <View style={rs.blobBottomLeft} pointerEvents="none" />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}
      </View>

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={rs.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <Animated.View entering={FadeInDown.delay(100).duration(800)} style={rs.logoBlock}>
              <View style={rs.orbCore}>
                <LinearGradient
                  colors={['rgba(212,168,67,0.32)', 'rgba(124,58,237,0.48)', 'rgba(10,8,28,0.8)']}
                  start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <MoonStar color={GOLD} size={28} strokeWidth={1.3} />
              </View>
              <Typography style={rs.logoWordmark}>AETHERA</Typography>
              <Typography style={rs.logoSub}>
                {t('auth.createAccount', { defaultValue: 'Stwórz swoje sanktuarium' })}
              </Typography>
            </Animated.View>

            {/* Step indicator */}
            <Animated.View entering={FadeIn.delay(300).duration(700)}>
              <StepIndicator step={step} />
            </Animated.View>

            {/* Animated step content */}
            <RNAnimated.View style={[{ transform: [{ translateX: slideX }], opacity: fadeV }]}>
              {step === 1 ? (
                /* ── Step 1 ── */
                <Animated.View entering={FadeIn.duration(400)} style={rs.card}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.04)', 'rgba(124,58,237,0.03)', 'rgba(255,255,255,0.02)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Typography style={rs.cardTitle}>
                    {t('auth.step1', { defaultValue: 'Dane konta' })}
                  </Typography>
                  <Typography style={rs.cardSub}>
                    Bezpieczny dostęp do Twojego sanktuarium.
                  </Typography>

                  <GlowInput focused={emailFocused} icon={Mail}>
                    <TextInput
                      style={rs.input}
                      placeholder={t('auth.email', { defaultValue: 'Adres e-mail' })}
                      placeholderTextColor={WHITE_LOW}
                      value={email} onChangeText={setEmail}
                      keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                      onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)}
                    />
                  </GlowInput>

                  <GlowInput focused={passFocused} icon={Lock}>
                    <TextInput
                      style={rs.input}
                      placeholder={t('auth.password', { defaultValue: 'Hasło (min. 6 znaków)' })}
                      placeholderTextColor={WHITE_LOW}
                      value={password} onChangeText={setPassword}
                      secureTextEntry
                      onFocus={() => setPassFocused(true)} onBlur={() => setPassFocused(false)}
                    />
                  </GlowInput>

                  <Pressable
                    onPress={goToStep2}
                    style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
                  >
                    <LinearGradient
                      colors={['#9B6EF3', PURPLE_CORE, '#5B21B6']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={rs.btn}
                    >
                      <Typography style={rs.btnText}>
                        {t('auth.nextStep', { defaultValue: 'Dalej' })}
                      </Typography>
                      <ArrowRight color="#fff" size={18} strokeWidth={2} />
                    </LinearGradient>
                    <View style={rs.btnGlow} pointerEvents="none" />
                  </Pressable>
                </Animated.View>
              ) : (
                /* ── Step 2 ── */
                <Animated.View entering={FadeIn.duration(400)} style={rs.card}>
                  <LinearGradient
                    colors={['rgba(212,168,67,0.04)', 'rgba(124,58,237,0.03)', 'rgba(255,255,255,0.02)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Typography style={rs.cardTitle}>
                    {t('auth.step2', { defaultValue: 'Twój profil' })}
                  </Typography>
                  <Typography style={rs.cardSub}>
                    Oracle potrzebuje kilku szczegółów, by mówić do Ciebie osobiście.
                  </Typography>

                  <GlowInput focused={nameFocused} icon={User}>
                    <TextInput
                      style={rs.input}
                      placeholder={t('auth.displayName', { defaultValue: 'Twoje imię' })}
                      placeholderTextColor={WHITE_LOW}
                      value={displayName} onChangeText={setDisplayName}
                      autoCapitalize="words"
                      onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)}
                    />
                  </GlowInput>

                  {/* Date of birth */}
                  <Typography style={rs.sectionLabel}>Data urodzenia</Typography>
                  <View style={rs.wheelRow}>
                    <View style={rs.wheelColNarrow}>
                      <Typography style={rs.wheelLabel}>Dzień</Typography>
                      <WheelPicker items={dayItems} selectedIndex={dayIdx} onChange={setDayIdx} />
                    </View>
                    <View style={rs.wheelColWide}>
                      <Typography style={rs.wheelLabel}>Miesiąc</Typography>
                      <WheelPicker items={MONTHS} selectedIndex={monthIdx} onChange={setMonthIdx} />
                    </View>
                    <View style={rs.wheelColNarrow}>
                      <Typography style={rs.wheelLabel}>Rok</Typography>
                      <WheelPicker items={YEARS} selectedIndex={yearIdx} onChange={setYearIdx} />
                    </View>
                  </View>

                  {/* Zodiac badge */}
                  <View style={rs.zodiacBadge}>
                    <LinearGradient
                      colors={[PURPLE_CORE + '22', GOLD + '14']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={rs.zodiacEmojiBox}>
                      <Typography style={rs.zodiacEmoji}>{zodiacInfo.emoji}</Typography>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography style={rs.zodiacSign}>{zodiacInfo.sign}</Typography>
                      <Typography style={rs.zodiacArchetype}>{zodiacInfo.archetype}</Typography>
                    </View>
                    <View style={[rs.zodiacGoldDot, { backgroundColor: GOLD }]} />
                  </View>

                  {/* Birth place */}
                  <Typography style={rs.sectionLabel}>Miejsce urodzenia</Typography>
                  <GlowInput focused={placeFocused} icon={MapPin}>
                    <TextInput
                      style={rs.input}
                      placeholder="Miasto, kraj (opcjonalnie)"
                      placeholderTextColor={WHITE_LOW}
                      value={birthPlace} onChangeText={setBirthPlace}
                      onFocus={() => setPlaceFocused(true)} onBlur={() => setPlaceFocused(false)}
                    />
                  </GlowInput>

                  <Pressable
                    onPress={handleRegister}
                    disabled={loading}
                    style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
                  >
                    <LinearGradient
                      colors={[GOLD, '#C49030', PURPLE_CORE]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={rs.btn}
                    >
                      {loading
                        ? <ActivityIndicator color="#fff" />
                        : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Typography style={rs.btnText}>
                              {t('auth.registerButton', { defaultValue: 'Stwórz sanktuarium' })}
                            </Typography>
                            <Check color="#fff" size={18} strokeWidth={2.5} />
                          </View>
                        )}
                    </LinearGradient>
                    <View style={[rs.btnGlow, { shadowColor: GOLD }]} pointerEvents="none" />
                  </Pressable>

                  <Pressable onPress={goToStep1} style={rs.backRow}>
                    <ArrowLeft color={WHITE_LOW} size={14} strokeWidth={1.8} />
                    <Typography style={rs.backText}>
                      {t('auth.backStep', { defaultValue: 'Wróć' })}
                    </Typography>
                  </Pressable>
                </Animated.View>
              )}
            </RNAnimated.View>

            {/* Login link */}
            <Animated.View entering={FadeIn.delay(700).duration(700)}>
              <Pressable
                onPress={() => navigation.navigate('Login')}
                style={rs.bottomLink}
              >
                <Typography style={rs.linkText}>
                  {t('auth.hasAccount', { defaultValue: 'Masz już konto?' })}{' '}
                </Typography>
                <Typography style={rs.linkAccent}>
                  {t('auth.login', { defaultValue: 'Zaloguj się' })}
                </Typography>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const rs = StyleSheet.create({
  scrollContainer: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },

  blobTopRight: {
    position: 'absolute', top: -70, right: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(109,40,217,0.18)',
  },
  blobBottomLeft: {
    position: 'absolute', bottom: -90, left: -80,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(91,33,182,0.12)',
  },

  logoBlock: { alignItems: 'center', marginBottom: 20 },
  orbCore: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: GOLD + '50',
    overflow: 'hidden', marginBottom: 14,
    shadowColor: GOLD,
    shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 0 },
  },
  logoWordmark: {
    fontSize: 26, fontWeight: '800', letterSpacing: 7, color: WHITE_HIGH,
  },
  logoSub: { fontSize: 13, color: WHITE_MED, marginTop: 5, letterSpacing: 0.5 },

  // Progress
  progressSection: { marginBottom: 22 },
  progressTrack: {
    height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden', marginBottom: 14,
  },
  progressFill: { height: '100%', borderRadius: 2, overflow: 'hidden' },
  stepsDotsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
  },
  stepDotWrap: { alignItems: 'center', gap: 6 },
  stepDrop: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDropActive: {
    backgroundColor: 'rgba(124,58,237,0.40)',
    borderColor: PURPLE_SOFT,
  },
  stepDropDone: {
    backgroundColor: GOLD + '30',
    borderColor: GOLD,
  },
  stepNum: { color: WHITE_LOW, fontSize: 13, fontWeight: '700' },
  stepDotLabel: { fontSize: 10, color: WHITE_LOW, letterSpacing: 0.5 },

  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.13)',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: PURPLE_CORE,
    shadowOpacity: 0.15,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardTitle: {
    fontSize: 18, fontWeight: '700', color: WHITE_HIGH,
    letterSpacing: 0.3, marginBottom: 4,
  },
  cardSub: {
    fontSize: 13, color: WHITE_MED, marginBottom: 18, lineHeight: 20,
  },

  // Input
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 15, marginBottom: 13, overflow: 'hidden',
  },
  inputIcon: { paddingLeft: 15, paddingRight: 4 },
  input: {
    flex: 1,
    paddingHorizontal: 11, paddingVertical: 16,
    color: WHITE_HIGH, fontSize: 15,
  },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2,
    color: PURPLE_SOFT + '90', marginBottom: 10, marginTop: 4,
    textTransform: 'uppercase',
  },

  // Wheel
  wheelRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  wheelColNarrow: { flex: 1, alignItems: 'center' },
  wheelColWide: { flex: 1.8, alignItems: 'center' },
  wheelLabel: {
    fontSize: 9.5, fontWeight: '700', letterSpacing: 1.5,
    color: PURPLE_SOFT + '70', marginBottom: 5, textTransform: 'uppercase',
  },
  wheel: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.14)',
  },
  wheelFade: {
    position: 'absolute', left: 0, right: 0, height: ITEM_H * 2, zIndex: 2,
  },
  wheelBand: {
    position: 'absolute',
    top: ITEM_H * 2, height: ITEM_H,
    left: 0, right: 0,
    backgroundColor: 'rgba(124,58,237,0.16)',
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: 'rgba(124,58,237,0.45)',
    zIndex: 1,
  },
  wheelItem: { color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center' },
  wheelItemActive: { color: WHITE_HIGH, fontSize: 15, fontWeight: '700' },

  // Zodiac badge
  zodiacBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212,168,67,0.28)',
    padding: 14, marginBottom: 16, overflow: 'hidden',
  },
  zodiacEmojiBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(212,168,67,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  zodiacEmoji: { fontSize: 26 },
  zodiacSign: { color: GOLD_SOFT, fontSize: 16, fontWeight: '700' },
  zodiacArchetype: { color: WHITE_MED, fontSize: 12, marginTop: 2 },
  zodiacGoldDot: { width: 6, height: 6, borderRadius: 3, opacity: 0.7 },

  // Button
  btn: {
    borderRadius: 16, paddingVertical: 17,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 10, marginTop: 6,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  btnGlow: {
    position: 'absolute',
    bottom: -8, left: 24, right: 24, height: 18,
    borderRadius: 16, backgroundColor: 'transparent',
    shadowColor: PURPLE_CORE,
    shadowOpacity: 0.5, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },

  backRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, marginTop: 16,
  },
  backText: { color: WHITE_LOW, fontSize: 14 },

  bottomLink: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginBottom: 8,
  },
  linkText: { color: WHITE_LOW, fontSize: 14 },
  linkAccent: { color: PURPLE_SOFT, fontSize: 14, fontWeight: '600' },
});
