// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Dimensions,
  Animated as RNAnimated, Easing as RNEasing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../core/config/firebase.config';
import { AuthService } from '../../core/services/auth.service';
import { hydrateUserProfile, useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { MoonStar, Mail, Lock, ArrowRight } from 'lucide-react-native';
import { Typography } from '../../components/Typography';

const { width: W, height: H } = Dimensions.get('window');

// ── Palette ────────────────────────────────────────────────────────────────────
const BG_DEEP     = '#07071A';
const BG_VIOLET   = '#0D0B1E';
const BG_INDIGO   = '#10112B';
const GOLD        = '#D4A843';
const GOLD_SOFT   = '#F0C96A';
const PURPLE_CORE = '#7C3AED';
const PURPLE_SOFT = '#A78BFA';
const WHITE_HIGH  = 'rgba(255,255,255,0.92)';
const WHITE_MED   = 'rgba(255,255,255,0.55)';
const WHITE_LOW   = 'rgba(255,255,255,0.28)';

// ── Floating particle (RNAnimated — no reanimated interop issues) ─────────────
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
          RNAnimated.timing(y, {
            toValue: -60,
            duration,
            easing: RNEasing.linear,
            useNativeDriver: true,
          }),
          RNAnimated.sequence([
            RNAnimated.timing(opacity, { toValue: 0.75, duration: 700, useNativeDriver: true }),
            RNAnimated.timing(opacity, { toValue: 0.75, duration: duration - 1400, useNativeDriver: true }),
            RNAnimated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => run());
    };
    run();
  }, []);

  return (
    <RNAnimated.View
      style={{
        position: 'absolute',
        left: x,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY: y }],
      }}
    />
  );
};

const PARTICLES = [
  { delay: 0,    x: W * 0.10, size: 2.5, duration: 6800,  color: PURPLE_SOFT },
  { delay: 900,  x: W * 0.24, size: 1.5, duration: 8200,  color: GOLD_SOFT },
  { delay: 1800, x: W * 0.40, size: 3,   duration: 5600,  color: PURPLE_SOFT },
  { delay: 2700, x: W * 0.58, size: 2,   duration: 7900,  color: GOLD_SOFT },
  { delay: 3600, x: W * 0.74, size: 2.5, duration: 6300,  color: PURPLE_SOFT },
  { delay: 500,  x: W * 0.87, size: 1.5, duration: 9100,  color: GOLD_SOFT },
  { delay: 1400, x: W * 0.33, size: 2,   duration: 7600,  color: PURPLE_SOFT },
  { delay: 4200, x: W * 0.62, size: 1.5, duration: 8700,  color: GOLD_SOFT },
  { delay: 2200, x: W * 0.92, size: 2,   duration: 6100,  color: PURPLE_SOFT },
  { delay: 3100, x: W * 0.18, size: 1.5, duration: 9400,  color: GOLD_SOFT },
];

// ── Orb pulse animation (RNAnimated) ─────────────────────────────────────────
const OrbPulse = () => {
  const ring1 = useRef(new RNAnimated.Value(1)).current;
  const ring2 = useRef(new RNAnimated.Value(1)).current;
  const r1Op  = useRef(new RNAnimated.Value(0.5)).current;
  const r2Op  = useRef(new RNAnimated.Value(0.3)).current;
  const glow  = useRef(new RNAnimated.Value(0.4)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.parallel([
          RNAnimated.timing(ring1, { toValue: 1.2, duration: 1800, useNativeDriver: true }),
          RNAnimated.timing(r1Op,  { toValue: 0.7, duration: 900,  useNativeDriver: true }),
        ]),
        RNAnimated.parallel([
          RNAnimated.timing(ring1, { toValue: 1.0, duration: 1800, useNativeDriver: true }),
          RNAnimated.timing(r1Op,  { toValue: 0.25, duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(ring2, { toValue: 1.45, duration: 2600, useNativeDriver: true }),
        RNAnimated.timing(r2Op,  { toValue: 0,    duration: 1300, useNativeDriver: true }),
        RNAnimated.timing(ring2, { toValue: 1.0,  duration: 0,    useNativeDriver: true }),
        RNAnimated.timing(r2Op,  { toValue: 0.3,  duration: 0,    useNativeDriver: true }),
      ])
    ).start();
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(glow, { toValue: 0.85, duration: 2000, useNativeDriver: true }),
        RNAnimated.timing(glow, { toValue: 0.3,  duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={ls.orbWrapper}>
      {/* outer dissipating ring */}
      <RNAnimated.View style={[ls.orbRingOuter, { transform: [{ scale: ring2 }], opacity: r2Op }]} />
      {/* inner pulse ring */}
      <RNAnimated.View style={[ls.orbRingInner, { transform: [{ scale: ring1 }], opacity: r1Op }]} />
      {/* core */}
      <View style={ls.orbCore}>
        <LinearGradient
          colors={['rgba(212,168,67,0.35)', 'rgba(124,58,237,0.50)', 'rgba(10,8,28,0.85)']}
          start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <RNAnimated.View style={[ls.orbGoldGlow, { opacity: glow }]} />
        <MoonStar color={GOLD} size={36} strokeWidth={1.2} />
      </View>
    </View>
  );
};

// ── Glow input (RNAnimated — uses non-native borderColor interpolation) ────────
const GlowInput = ({ focused, icon: Icon, children }) => {
  const anim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(167,139,250,0.18)', 'rgba(212,168,67,0.75)'],
  });
  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.04)', 'rgba(212,168,67,0.06)'],
  });
  const shadowOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  return (
    <RNAnimated.View style={[
      ls.inputWrapper,
      {
        borderColor,
        backgroundColor: bgColor,
        shadowOpacity,
        shadowColor: GOLD,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
        elevation: 0,
      },
    ]}>
      <View style={ls.inputIcon}>
        <Icon
          color={focused ? GOLD : PURPLE_SOFT + '80'}
          size={17}
          strokeWidth={1.6}
        />
      </View>
      {children}
    </RNAnimated.View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
export const LoginScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused,  setPassFocused]  = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const btnScale = useRef(new RNAnimated.Value(1)).current;

  const handleForgotPassword = async () => {
    // Use the email field value if already filled in, so user doesn't have to re-type
    const resetEmail = email.trim();
    if (!resetEmail) {
      Alert.alert(
        'Zapomniałem hasła',
        'Wpisz swój adres e-mail w pole powyżej, a następnie dotknij "Zapomniałem hasła" ponownie.',
      );
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      Alert.alert('Email wysłany', 'Sprawdź swoją skrzynkę pocztową.');
    } catch (e: any) {
      Alert.alert('Błąd', e?.message ?? 'Nie udało się wysłać e-maila.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Błąd', t('auth.email') + ' / ' + t('auth.password'));
      return;
    }
    RNAnimated.sequence([
      RNAnimated.timing(btnScale, { toValue: 0.95, duration: 70, useNativeDriver: true }),
      RNAnimated.timing(btnScale, { toValue: 1,    duration: 70, useNativeDriver: true }),
    ]).start();
    setLoading(true);
    try {
      const user = await AuthService.login(email.trim(), password);
      useAuthStore.getState().setUser({
        uid: user.uid,
        email: user.email ?? email.trim(),
        displayName: user.displayName ?? '',
        zodiacSign: '',
        archetype: '',
        avatarEmoji: '🌙',
        bio: '',
      });
      void hydrateUserProfile(user.uid);
      // Navigation handled automatically by AppNavigator (isLoggedIn state change)
    } catch (e: any) {
      const msg = e?.code === 'auth/invalid-credential'
        ? t('auth.errorInvalidCredential')
        : t('auth.errorConnection');
      Alert.alert('Błąd logowania', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG_DEEP }}>
      {/* Background gradient */}
      <LinearGradient
        colors={[BG_DEEP, BG_VIOLET, BG_INDIGO, '#0C0D2A']}
        locations={[0, 0.4, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glow blobs */}
      <View style={ls.blobTopLeft}   pointerEvents="none" />
      <View style={ls.blobBottomRight} pointerEvents="none" />

      {/* Floating particles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}
      </View>

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={ls.kav}
        >
          {/* ── Logo block ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(900)} style={ls.logoBlock}>
            <OrbPulse />

            <Animated.View entering={FadeIn.delay(400).duration(700)}>
              <Typography style={ls.logoWordmark}>AETHERA</Typography>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(550).duration(700)} style={{ width: '100%', alignItems: 'center' }}>
              <Typography
                style={ls.logoSubtitle}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {t('auth.subtitle', { defaultValue: 'Powrót do sanktuarium' })}
              </Typography>
            </Animated.View>

            {/* Decorative divider */}
            <Animated.View entering={FadeIn.delay(650).duration(600)} style={ls.divider}>
              <View style={ls.dividerLine} />
              <Typography style={ls.dividerDot}>✦</Typography>
              <View style={ls.dividerLine} />
            </Animated.View>
          </Animated.View>

          {/* ── Form card ── */}
          <Animated.View entering={FadeInUp.delay(350).duration(800)} style={ls.formCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.04)', 'rgba(124,58,237,0.04)', 'rgba(255,255,255,0.02)']}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Email */}
            <GlowInput focused={emailFocused} icon={Mail}>
              <TextInput
                style={ls.input}
                placeholder={t('auth.email', { defaultValue: 'Adres e-mail' })}
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </GlowInput>

            {/* Password */}
            <GlowInput focused={passFocused} icon={Lock}>
              <TextInput
                style={ls.input}
                placeholder={t('auth.password', { defaultValue: 'Hasło' })}
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
            </GlowInput>

            {/* Forgot password */}
            <Pressable
              onPress={handleForgotPassword}
              disabled={resetLoading}
              style={{ alignSelf: 'flex-end', paddingVertical: 4, marginBottom: 6, marginTop: -4 }}
            >
              <Typography style={{ color: PURPLE_SOFT, fontSize: 13, opacity: resetLoading ? 0.5 : 1 }}>
                {resetLoading ? 'Wysyłanie...' : 'Zapomniałem hasła'}
              </Typography>
            </Pressable>

            {/* Remember me */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
              <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: PURPLE_CORE, alignItems: 'center', justifyContent: 'center' }}>
                <Typography style={{ color: '#fff', fontSize: 13, lineHeight: 18 }}>✓</Typography>
              </View>
              <Typography style={{ color: WHITE_MED, fontSize: 13 }}>
                {t('auth.rememberMe', { defaultValue: 'Zapamietaj mnie' })}
              </Typography>
            </View>

            {/* Submit */}
            <RNAnimated.View style={[{ transform: [{ scale: btnScale }] }, ls.btnOuter]}>
              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
              >
                <LinearGradient
                  colors={['#9B6EF3', PURPLE_CORE, '#5B21B6']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={ls.btn}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Typography style={ls.btnText}>
                          {t('auth.loginButton', { defaultValue: 'Wejdź do sanktuarium' })}
                        </Typography>
                        <ArrowRight color="#fff" size={18} strokeWidth={2} />
                      </View>
                    )}
                </LinearGradient>
                {/* Button glow */}
                <View style={ls.btnGlow} pointerEvents="none" />
              </Pressable>
            </RNAnimated.View>

            {/* No account link */}
            <Pressable
              onPress={() => navigation.navigate('Register')}
              style={ls.linkRow}
            >
              <Typography style={ls.linkText}>
                {t('auth.noAccount', { defaultValue: 'Nie masz konta?' })}{' '}
              </Typography>
              <Typography style={ls.linkAccent}>
                {t('auth.register', { defaultValue: 'Zarejestruj się' })}
              </Typography>
            </Pressable>
          </Animated.View>

          {/* Bottom hint */}
          <Animated.View entering={FadeIn.delay(900).duration(700)} style={ls.bottomHint}>
            <Typography style={ls.bottomHintText}>
              ✦ &nbsp; Twoje dane są bezpieczne i prywatne &nbsp; ✦
            </Typography>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const ls = StyleSheet.create({
  kav: { flex: 1, justifyContent: 'center', paddingHorizontal: 26 },

  blobTopLeft: {
    position: 'absolute', top: -100, left: -90,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(109,40,217,0.20)',
  },
  blobBottomRight: {
    position: 'absolute', bottom: -110, right: -80,
    width: 340, height: 340, borderRadius: 170,
    backgroundColor: 'rgba(79,70,229,0.14)',
  },

  // Logo
  logoBlock: { alignItems: 'center', marginBottom: 32 },
  orbWrapper: {
    width: 86, height: 86,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  orbRingOuter: {
    position: 'absolute',
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 1, borderColor: GOLD + '30',
  },
  orbRingInner: {
    position: 'absolute',
    width: 104, height: 104, borderRadius: 52,
    borderWidth: 1.5, borderColor: PURPLE_SOFT + '50',
  },
  orbCore: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: GOLD + '55',
    overflow: 'hidden',
  },
  orbGoldGlow: {
    position: 'absolute',
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: GOLD + '28',
  },

  logoWordmark: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 8,
    color: WHITE_HIGH,
    textAlign: 'center',
  },
  logoSubtitle: {
    fontSize: 14,
    color: WHITE_MED,
    letterSpacing: 0.8,
    marginTop: 6,
    textAlign: 'center',
  },

  divider: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginTop: 20, width: '60%',
  },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: GOLD + '40' },
  dividerDot: { color: GOLD + 'AA', fontSize: 10 },

  // Form card
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.14)',
    borderRadius: 26,
    padding: 24,
    overflow: 'hidden',
    shadowColor: PURPLE_CORE,
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  // Input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  inputIcon: {
    paddingLeft: 16, paddingRight: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 17,
    color: WHITE_HIGH,
    fontSize: 15,
    letterSpacing: 0.2,
  },

  // Button
  btnOuter: { marginTop: 6, position: 'relative' },
  btn: {
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.5,
  },
  btnGlow: {
    position: 'absolute',
    bottom: -8, left: 24, right: 24, height: 18,
    borderRadius: 16,
    backgroundColor: 'transparent',
    shadowColor: PURPLE_CORE,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },

  linkRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 22,
  },
  linkText: { color: WHITE_LOW, fontSize: 14 },
  linkAccent: { color: PURPLE_SOFT, fontSize: 14, fontWeight: '600' },

  bottomHint: {
    alignItems: 'center',
    marginTop: 24,
    opacity: 0.5,
  },
  bottomHintText: {
    fontSize: 10, letterSpacing: 1.5, color: GOLD + 'BB',
  },
});
