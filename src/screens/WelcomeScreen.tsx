// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn, FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../components/Typography';
import { CelestialBackdrop } from '../components/CelestialBackdrop';
import { PremiumButton } from '../components/PremiumButton';
import {
  Sparkles, MoonStar, ArrowRight,
  Wand2, BookOpen, Sun, Globe, Flame, Star,
  Shield, Zap, Heart,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── STATIC PALETTE (dark luxury) ──────────────────────────────────────────────
const DEEP_BG      = '#08071A';
const VIOLET_MID   = '#150B2E';
const INDIGO_DEEP  = '#0D1535';
const GOLD         = '#D4A843';
const GOLD_SOFT    = '#F0C96A';
const GOLD_GLOW    = 'rgba(212,168,67,0.18)';
const PURPLE_CORE  = '#7C3AED';
const PURPLE_SOFT  = '#A78BFA';
const WHITE_HIGH   = 'rgba(255,255,255,0.92)';
const WHITE_MED    = 'rgba(255,255,255,0.60)';
const WHITE_LOW    = 'rgba(255,255,255,0.35)';

// ── Feature cards ─────────────────────────────────────────────────────────────
const FEATURE_CARDS = [
  {
    icon: Wand2,
    label: 'Oracle AI',
    desc: 'AI conversations tailored to your path and the energy of the day.',
    accent: '#A78BFA',
    gradFrom: '#A78BFA',
    gradTo: '#7C3AED',
  },
  {
    icon: BookOpen,
    label: 'Tarot & Readings',
    desc: 'Cards, numerology, horoscope, dreams — your entire symbolic universe.',
    accent: '#F9A8D4',
    gradFrom: '#F9A8D4',
    gradTo: '#EC4899',
  },
  {
    icon: Sun,
    label: 'Rituals & Practices',
    desc: 'Meditation, breathwork, affirmations — a daily journey back to yourself.',
    accent: '#6EE7B7',
    gradFrom: '#6EE7B7',
    gradTo: '#059669',
  },
];

// ── Why Aethera items ─────────────────────────────────────────────────────────
const WHY_ITEMS = [
  {
    icon: Shield,
    title: 'Private sanctuary',
    body: 'Your entries, dreams and intentions are yours alone — no one else sees them.',
    color: '#A78BFA',
  },
  {
    icon: Zap,
    title: 'AI understands context',
    body: 'Oracle knows your archetype, level and history — you never have to explain yourself again.',
    color: GOLD,
  },
  {
    icon: Heart,
    title: 'One coherent world',
    body: 'Tarot, astrology, rituals and journal form a path together — not just a set of tools.',
    color: '#F9A8D4',
  },
];

// ── Floating star particle ────────────────────────────────────────────────────
const STAR_DATA = [
  { x: 0.08, delay: 0,    size: 2, dur: 7000 },
  { x: 0.18, delay: 900,  size: 1.5, dur: 9000 },
  { x: 0.32, delay: 1800, size: 2.5, dur: 6500 },
  { x: 0.45, delay: 600,  size: 1.5, dur: 8500 },
  { x: 0.55, delay: 2400, size: 2, dur: 7500 },
  { x: 0.67, delay: 300,  size: 3, dur: 6000 },
  { x: 0.78, delay: 1500, size: 1.5, dur: 9500 },
  { x: 0.88, delay: 3000, size: 2, dur: 7200 },
  { x: 0.12, delay: 4200, size: 1.5, dur: 8000 },
  { x: 0.92, delay: 2100, size: 2.5, dur: 6800 },
  { x: 0.25, delay: 3600, size: 1.5, dur: 9200 },
  { x: 0.72, delay: 700,  size: 2, dur: 7800 },
  { x: 0.38, delay: 5100, size: 1.5, dur: 8300 },
  { x: 0.61, delay: 1200, size: 2, dur: 7400 },
  { x: 0.84, delay: 4500, size: 1.5, dur: 6200 },
];

const StarParticle = ({ x, delay, size, dur }) => {
  const translateY = useSharedValue(SCREEN_H + 30);
  const opacity    = useSharedValue(0);

  useEffect(() => {
    const run = () => {
      translateY.value = SCREEN_H + 30;
      opacity.value    = 0;
      translateY.value = withDelay(delay, withTiming(-60, { duration: dur, easing: Easing.linear }));
      opacity.value    = withDelay(delay, withSequence(
        withTiming(0.8, { duration: 600 }),
        withTiming(0.8, { duration: dur - 1200 }),
        withTiming(0, { duration: 600 }),
      ));
    };
    run();
    const interval = setInterval(run, dur + delay + 200);
    return () => clearInterval(interval);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        left: SCREEN_W * x,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Math.random() > 0.5 ? GOLD_SOFT : PURPLE_SOFT,
      }, style]}
    />
  );
};

// ── Animated logo orb (3-ring premium) ────────────────────────────────────────
const AnimatedLogoOrb = () => {
  const ring1Scale   = useSharedValue(1);
  const ring1Opacity = useSharedValue(0.25);
  const ring2Scale   = useSharedValue(0.9);
  const ring2Opacity = useSharedValue(0.15);
  const ring3Scale   = useSharedValue(0.85);
  const ring3Opacity = useSharedValue(0.08);
  const coreScale    = useSharedValue(1);
  const sparkleRot   = useSharedValue(0);
  const goldGlow     = useSharedValue(0.4);

  useEffect(() => {
    ring1Scale.value = withRepeat(withSequence(
      withTiming(1.15, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      withTiming(0.95, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
    ), -1, true);
    ring1Opacity.value = withRepeat(withSequence(
      withTiming(0.55, { duration: 1800 }),
      withTiming(0.18, { duration: 1800 }),
    ), -1, true);

    ring2Scale.value = withDelay(600, withRepeat(withSequence(
      withTiming(1.28, { duration: 2400 }),
      withTiming(0.88, { duration: 2400 }),
    ), -1, true));
    ring2Opacity.value = withDelay(600, withRepeat(withSequence(
      withTiming(0.30, { duration: 2400 }),
      withTiming(0.05, { duration: 2400 }),
    ), -1, true));

    ring3Scale.value = withDelay(1200, withRepeat(withSequence(
      withTiming(1.55, { duration: 3200 }),
      withTiming(0.85, { duration: 3200 }),
    ), -1, true));
    ring3Opacity.value = withDelay(1200, withRepeat(withSequence(
      withTiming(0.18, { duration: 3200 }),
      withTiming(0, { duration: 3200 }),
    ), -1, true));

    coreScale.value = withRepeat(withSequence(
      withTiming(1.07, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      withTiming(0.96, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
    ), -1, true);

    sparkleRot.value = withRepeat(
      withTiming(360, { duration: 14000, easing: Easing.linear }), -1, false,
    );
    goldGlow.value = withRepeat(withSequence(
      withTiming(0.85, { duration: 2200 }),
      withTiming(0.3, { duration: 2200 }),
    ), -1, true);
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));
  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring3Scale.value }],
    opacity: ring3Opacity.value,
  }));
  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coreScale.value }],
  }));
  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRot.value}deg` }],
  }));
  const goldGlowStyle = useAnimatedStyle(() => ({
    opacity: goldGlow.value,
  }));

  return (
    <View style={ws.orbWrapper}>
      {/* Outer glow ring 3 */}
      <Animated.View style={[ws.orbRing3, ring3Style]} />
      {/* Middle glow ring 2 */}
      <Animated.View style={[ws.orbRing2, ring2Style]} />
      {/* Inner pulse ring 1 */}
      <Animated.View style={[ws.orbRing1, ring1Style]} />

      {/* Core orb */}
      <Animated.View style={[ws.orbCore, coreStyle]}>
        <LinearGradient
          colors={['rgba(212,168,67,0.30)', 'rgba(124,58,237,0.40)', 'rgba(13,21,53,0.90)']}
          start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
          style={ws.orbCoreGradient}
        />
        {/* Gold glow overlay */}
        <Animated.View style={[ws.orbGoldGlow, goldGlowStyle]} />
        <MoonStar color={GOLD} size={40} strokeWidth={1.2} />
        {/* Sparkle orbit decoration */}
        <Animated.View style={[ws.sparkleOrbit, sparkleStyle]}>
          <View style={ws.sparkleOrbitDot} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

// ── Feature card (glassmorphism + staggered slide) ────────────────────────────
const FeatureCard = ({ card, index }) => {
  const Icon = card.icon;
  return (
    <Animated.View
      entering={FadeInUp.delay(700 + index * 130).duration(700)}
      style={ws.featureCard}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[ws.featureIconBox, { backgroundColor: card.accent + '20' }]}>
        <LinearGradient
          colors={[card.gradFrom + '40', card.gradTo + '20']}
          style={ws.featureIconGradient}
        />
        <Icon color={card.accent} size={22} strokeWidth={1.4} />
      </View>
      <View style={ws.featureCardText}>
        <Typography variant="microLabel" style={{ color: card.accent, marginBottom: 4, letterSpacing: 1.5 }}>
          {card.label}
        </Typography>
        <Typography variant="bodySmall" style={ws.featureDesc}>
          {card.desc}
        </Typography>
      </View>
      {/* Right accent line */}
      <View style={[ws.featureAccentLine, { backgroundColor: card.accent + '60' }]} />
    </Animated.View>
  );
};

// ── Why Aethera item ──────────────────────────────────────────────────────────
const WhyItem = ({ item, index }) => {
  const Icon = item.icon;
  return (
    <Animated.View
      entering={FadeInUp.delay(900 + index * 120).duration(650)}
      style={ws.whyRow}
    >
      <View style={[ws.whyIconBox, { backgroundColor: item.color + '15', borderColor: item.color + '35' }]}>
        <Icon color={item.color} size={18} strokeWidth={1.6} />
      </View>
      <View style={{ flex: 1 }}>
        <Typography variant="microLabel" style={{ color: item.color, marginBottom: 3, letterSpacing: 1 }}>
          {item.title}
        </Typography>
        <Typography variant="bodySmall" style={{ color: WHITE_MED, lineHeight: 19 }}>
          {item.body}
        </Typography>
      </View>
    </Animated.View>
  );
};

// ── Testimonial (cinematic) ───────────────────────────────────────────────────
const Testimonial = () => (
  <Animated.View entering={FadeInDown.delay(1100).duration(700)} style={ws.testimonialCard}>
    <LinearGradient
      colors={['rgba(212,168,67,0.06)', 'rgba(124,58,237,0.04)', 'transparent']}
      style={StyleSheet.absoluteFill}
    />
    <View style={ws.testimonialGoldLine} />
    <View style={ws.testimonialInner}>
      <View style={[ws.testimonialQuoteBox, { backgroundColor: GOLD + '18' }]}>
        <Flame color={GOLD} size={14} strokeWidth={1.5} />
      </View>
      <Typography variant="bodySmall" style={ws.testimonialText}>
        {'"Aethera is the first app where I truly felt that something was listening to me instead of just serving ready-made answers."'}
      </Typography>
      <View style={ws.testimonialAuthor}>
        <View style={[ws.testimonialDot, { backgroundColor: GOLD }]} />
        <Typography variant="microLabel" style={{ color: GOLD + 'CC', letterSpacing: 1 }}>
          {'User, 32 years old'}
        </Typography>
      </View>
    </View>
  </Animated.View>
);

// ── Last active section ────────────────────────────────────────────────────────
const LastActiveSection = ({ streaks }) => {
  const { t } = useTranslation();
  const lastDate = streaks?.lastCheckIn;
  if (!lastDate) return null;

  const formatted = (() => {
    try {
      const d = new Date(lastDate);
      return d.toLocaleDateString(
        t('common.localeCode', { defaultValue: 'en-US' }),
        { day: 'numeric', month: 'long', year: 'numeric' },
      );
    } catch {
      return lastDate;
    }
  })();

  return (
    <Animated.View
      entering={FadeInDown.delay(1200).duration(600)}
      style={ws.lastActiveCard}
    >
      <LinearGradient
        colors={[GOLD + '10', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Star color={GOLD} size={13} fill={GOLD} />
        <Typography variant="microLabel" style={{ color: GOLD, letterSpacing: 1.5 }}>
          {t('welcome.lastActive.label', { defaultValue: 'LAST ACTIVE' })}
        </Typography>
      </View>
      <Typography variant="bodySmall" style={{ color: WHITE_MED, marginTop: 6 }}>
        {formatted}
      </Typography>
      {streaks?.current > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <Flame color={GOLD} size={12} strokeWidth={1.5} />
          <Typography variant="microLabel" style={{ color: GOLD + 'CC' }}>
            {`${streaks.current} day streak`}
          </Typography>
        </View>
      )}
    </Animated.View>
  );
};

// ── Button glow wrapper ───────────────────────────────────────────────────────
const GlowButtonWrapper = ({ children, glowColor = PURPLE_CORE }) => (
  <View style={ws.glowButtonOuter}>
    <View style={[ws.glowButtonShadow, { shadowColor: glowColor }]} />
    {children}
  </View>
);

// ── Main component ────────────────────────────────────────────────────────────
interface WelcomeScreenProps {
  onPrimary: () => void;
  onSecondary: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPrimary, onSecondary }) => {
  const { t } = useTranslation();
    const isOnboarded = useAppStore(s => s.isOnboarded);
  const userData = useAppStore(s => s.userData);
  const streaks = useAppStore(s => s.streaks);
  const insets = useSafeAreaInsets();
  const themeName = useAppStore(s => s.themeName);
  const hasPartialProfile = Boolean(userData.name || userData.birthDate || userData.primaryIntention);
  const theme = getResolvedTheme(themeName);
  const accent = theme.primary;

  const localizedFeatureCards = FEATURE_CARDS.map((card, index) => ({
    ...card,
    label: t(`welcome.features.${index}.label`, { defaultValue: card.label }),
    desc: t(`welcome.features.${index}.desc`, { defaultValue: card.desc }),
  }));

  return (
    <View style={ws.container}>
      {/* Deep space gradient background */}
      <LinearGradient
        colors={[DEEP_BG, VIOLET_MID, INDIGO_DEEP, '#0A0820']}
        locations={[0, 0.35, 0.70, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glow blobs */}
      <View style={ws.glowBlobTopLeft} pointerEvents="none" />
      <View style={ws.glowBlobBottomRight} pointerEvents="none" />
      <View style={ws.glowBlobCenter} pointerEvents="none" />

      {/* Celestial backdrop */}
      <CelestialBackdrop intensity="immersive" />

      {/* Floating star particles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {STAR_DATA.map((p, i) => (
          <StarParticle key={i} {...p} />
        ))}
      </View>

      <SafeAreaView edges={['top']} style={ws.safeArea}>
        <ScrollView
          contentContainerStyle={[ws.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand wordmark */}
          <Animated.View entering={FadeIn.delay(100).duration(900)} style={ws.brandRow}>
            <Typography variant="microLabel" style={ws.brandWordmark}>
              {t('welcome.aethera', '✦ AETHERA')}
            </Typography>
            <Typography variant="microLabel" style={ws.brandSub}>
              {t('welcome.duniai_oracle', 'DuniAI & Oracle')}
            </Typography>
          </Animated.View>

          {/* Hero orb + label */}
          <Animated.View entering={FadeIn.delay(200).duration(1000)} style={ws.orbArea}>
            <AnimatedLogoOrb />
            <Animated.View entering={FadeInDown.delay(600).duration(700)} style={ws.orbLabelWrap}>
              <Typography variant="microLabel" style={ws.orbLabel}>
                {t('welcome.sanctuaryLabel', { defaultValue: '✦ PRIVATE SANCTUARY ✦' })}
              </Typography>
            </Animated.View>
          </Animated.View>

          {/* Headline block */}
          <Animated.View entering={FadeInUp.delay(450).duration(900)} style={ws.headlineBlock}>
            <Typography variant="microLabel" style={ws.headlineEyebrow}>
              {t('welcome.aethera_1', 'Aethera')}
            </Typography>
            <Typography
              variant="heading"
              style={ws.headlineTitle}
            >
              {t('welcome.hero.title', { defaultValue: 'Enter the sanctuary where AI meets intuition.' })}
            </Typography>
            <Typography variant="body" style={ws.headlineSubtitle}>
              {t('welcome.hero.subtitle', { defaultValue: 'A luxury space for readings, Oracle conversations, rituals, and symbolic guidance.' })}
            </Typography>
          </Animated.View>

          {/* Feature cards */}
          <View style={ws.featuresSection}>
            <Animated.View entering={FadeIn.delay(600).duration(600)}>
              <Typography variant="microLabel" style={ws.sectionLabel}>
                {t('welcome.features.heading', { defaultValue: 'WHAT YOU WILL FIND INSIDE' })}
              </Typography>
            </Animated.View>
            {localizedFeatureCards.map((card, i) => (
              <FeatureCard key={card.label} card={card} index={i} />
            ))}
          </View>

          {/* Why Aethera section */}
          <Animated.View entering={FadeIn.delay(800).duration(600)} style={ws.whySectionHeader}>
            <View style={ws.whySectionLine} />
            <Typography variant="microLabel" style={ws.sectionLabel}>
              {t('welcome.why_aethera', 'WHY AETHERA?')}
            </Typography>
            <View style={ws.whySectionLine} />
          </Animated.View>
          <View style={ws.whySection}>
            {WHY_ITEMS.map((item, i) => (
              <WhyItem key={item.title} item={item} index={i} />
            ))}
          </View>

          {/* Testimonial */}
          <Testimonial />

          {/* Last active */}
          {isOnboarded && (
            <LastActiveSection streaks={streaks} />
          )}

          {/* Continuity card */}
          <Animated.View
            entering={FadeInDown.delay(1200).duration(700)}
            style={ws.continuityCard}
          >
            <LinearGradient
              colors={[GOLD + '10', PURPLE_CORE + '08', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            <View style={ws.continuityGoldLine} />
            <View style={ws.continuityInner}>
              <Typography variant="microLabel" style={{ color: GOLD, letterSpacing: 1.5, marginBottom: 8 }}>
                {isOnboarded
                  ? t('welcome.continuity.returningLabel', { defaultValue: 'THE SANCTUARY REMEMBERS YOUR PATH' })
                  : hasPartialProfile
                    ? t('welcome.continuity.resumeLabel', { defaultValue: 'YOUR SETUP IS WAITING' })
                    : t('welcome.continuity.firstLabel', { defaultValue: 'FIRST ENTRY' })}
              </Typography>
              <Typography variant="bodySmall" style={{ color: WHITE_MED, lineHeight: 22 }}>
                {isOnboarded
                  ? t('welcome.continuity.returningBody', { defaultValue: 'When you return, you open the same calm place: daily guidance, active threads, saved dreams, and private insights.' })
                  : hasPartialProfile
                    ? t('welcome.continuity.resumeBody', { defaultValue: 'You can return exactly to the point where building your sanctuary was interrupted.' })
                    : t('welcome.continuity.firstBody', { defaultValue: 'A few conscious choices are enough for Aethera to begin responding in a tone aligned with you.' })}
              </Typography>
            </View>
          </Animated.View>

          {/* CTA buttons */}
          <Animated.View entering={FadeInDown.delay(1400).duration(800)} style={ws.bottomArea}>
            <GlowButtonWrapper glowColor={PURPLE_CORE}>
              <PremiumButton
                label={isOnboarded
                  ? t('welcome.cta.primaryReturning', { defaultValue: 'Return to the sanctuary' })
                  : t('welcome.cta.primaryNew', { defaultValue: 'Begin the journey' })}
                onPress={onPrimary}
              />
            </GlowButtonWrapper>

            <GlowButtonWrapper glowColor={'#4F46E5'}>
              <PremiumButton
                label={
                  isOnboarded
                    ? t('welcome.cta.secondaryReturning', { defaultValue: 'Open my guidance' })
                    : hasPartialProfile
                      ? t('welcome.cta.secondaryResume', { defaultValue: 'Return to setup' })
                      : t('welcome.cta.secondaryExplore', { defaultValue: 'Explore Aethera' })
                }
                onPress={onSecondary}
                variant="secondary"
                style={{ marginTop: 14 }}
              />
            </GlowButtonWrapper>

            <Pressable onPress={onPrimary} style={ws.inlineLink}>
              <Typography variant="bodySmall" style={{ color: WHITE_LOW }}>
                {t('welcome.inline', { defaultValue: 'Enter the sanctuary' })}
              </Typography>
              <ArrowRight color={GOLD + 'CC'} size={15} />
            </Pressable>
          </Animated.View>

          {/* Language hint */}
          <Animated.View entering={FadeIn.delay(1600).duration(700)} style={ws.langRow}>
            <Globe color={WHITE_LOW} size={11} strokeWidth={1.5} />
            <Typography variant="microLabel" style={ws.langText}>
              {t('welcome.languageHint', { defaultValue: 'Language: English  ·  Change in settings' })}
            </Typography>
          </Animated.View>

          {/* Terms */}
          <Animated.View entering={FadeIn.delay(1700).duration(700)} style={ws.termsRow}>
            <Typography variant="microLabel" style={ws.termsText}>
              {t('welcome.terms.prefix', { defaultValue: 'By using Aethera you accept ' })}
            </Typography>
            <Pressable hitSlop={8}>
              <Typography variant="microLabel" style={ws.termsLink}>
                {t('welcome.terms.terms', { defaultValue: 'Terms of Use' })}
              </Typography>
            </Pressable>
            <Typography variant="microLabel" style={ws.termsText}>
              {t('welcome.terms.and', { defaultValue: ' and ' })}
            </Typography>
            <Pressable hitSlop={8}>
              <Typography variant="microLabel" style={ws.termsLink}>
                {t('welcome.terms.privacy', { defaultValue: 'Privacy Policy' })}
              </Typography>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const ws = StyleSheet.create({
  container: { flex: 1, backgroundColor: DEEP_BG },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: layout.padding.screen,
    paddingTop: 16,
  },

  // Ambient glow blobs
  glowBlobTopLeft: {
    position: 'absolute', top: -120, left: -100,
    width: 340, height: 340, borderRadius: 170,
    backgroundColor: 'rgba(109,40,217,0.22)',
  },
  glowBlobBottomRight: {
    position: 'absolute', bottom: -80, right: -80,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(79,70,229,0.16)',
  },
  glowBlobCenter: {
    position: 'absolute', top: '30%', left: '25%',
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(212,168,67,0.05)',
  },

  // Brand
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brandWordmark: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 4,
    color: GOLD,
  },
  brandSub: {
    fontSize: 9,
    letterSpacing: 0.5,
    color: WHITE_LOW,
  },

  // Orb
  orbArea: { alignItems: 'center', marginVertical: 24 },
  orbWrapper: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbRing3: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 1,
    borderColor: GOLD + '20',
  },
  orbRing2: {
    position: 'absolute',
    width: 165, height: 165, borderRadius: 83,
    borderWidth: 1.5,
    borderColor: PURPLE_SOFT + '35',
  },
  orbRing1: {
    position: 'absolute',
    width: 145, height: 145, borderRadius: 73,
    borderWidth: 1,
    borderColor: GOLD + '45',
  },
  orbCore: {
    width: 118, height: 118, borderRadius: 59,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: GOLD + '55',
    overflow: 'hidden',
  },
  orbCoreGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 59,
  },
  orbGoldGlow: {
    position: 'absolute',
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: GOLD + '25',
  },
  sparkleOrbit: {
    position: 'absolute',
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'flex-start',
  },
  sparkleOrbitDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: GOLD,
    marginTop: 4,
    opacity: 0.8,
  },
  orbLabelWrap: { marginTop: 16 },
  orbLabel: {
    fontSize: 9,
    letterSpacing: 4,
    color: GOLD + 'CC',
    textAlign: 'center',
  },

  // Headline
  headlineBlock: { marginBottom: 28 },
  headlineEyebrow: {
    color: PURPLE_SOFT,
    letterSpacing: 3,
    marginBottom: 10,
  },
  headlineTitle: {
    fontSize: 33,
    fontWeight: '800',
    color: WHITE_HIGH,
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  headlineSubtitle: {
    color: WHITE_MED,
    lineHeight: 26,
    fontSize: 15,
  },

  // Features
  featuresSection: { marginBottom: 28 },
  sectionLabel: {
    letterSpacing: 2.5,
    color: GOLD + 'BB',
    marginBottom: 16,
    fontSize: 9.5,
    fontWeight: '700',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 12,
    gap: 14,
    overflow: 'hidden',
  },
  featureIconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  featureIconGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  featureCardText: { flex: 1 },
  featureDesc: { color: WHITE_MED, lineHeight: 20 },
  featureAccentLine: {
    position: 'absolute',
    right: 0, top: 16, bottom: 16,
    width: 2.5, borderRadius: 2,
  },

  // Why section
  whySectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 16,
  },
  whySectionLine: {
    flex: 1, height: 0.5,
    backgroundColor: GOLD + '40',
  },
  whySection: { marginBottom: 28 },
  whyRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 14, marginBottom: 16,
  },
  whyIconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
  },

  // Testimonial
  testimonialCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 20,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  testimonialGoldLine: {
    width: 3, backgroundColor: GOLD,
    borderTopLeftRadius: 20, borderBottomLeftRadius: 20,
  },
  testimonialInner: { flex: 1, padding: 18 },
  testimonialQuoteBox: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  testimonialText: {
    color: WHITE_MED, lineHeight: 24, fontStyle: 'italic', fontSize: 14,
  },
  testimonialAuthor: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14,
  },
  testimonialDot: { width: 5, height: 5, borderRadius: 3 },

  // Last active
  lastActiveCard: {
    padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: GOLD + '25',
    marginBottom: 20, overflow: 'hidden',
  },

  // Continuity card
  continuityCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 28,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  continuityGoldLine: {
    width: 3, backgroundColor: GOLD + 'AA',
    borderTopLeftRadius: 18, borderBottomLeftRadius: 18,
  },
  continuityInner: { flex: 1, padding: 18 },

  // Button glow
  glowButtonOuter: { position: 'relative' },
  glowButtonShadow: {
    position: 'absolute',
    bottom: -8, left: 20, right: 20, height: 20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 12,
  },

  // Bottom
  bottomArea: { marginBottom: 24 },
  inlineLink: {
    marginTop: 20,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },

  // Language
  langRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    marginBottom: 14, opacity: 0.6,
  },
  langText: { fontSize: 9.5, letterSpacing: 0.3, color: WHITE_LOW },

  // Terms
  termsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8, opacity: 0.65,
  },
  termsText: { fontSize: 9.5, lineHeight: 18, color: WHITE_LOW },
  termsLink: {
    fontSize: 9.5, lineHeight: 18,
    color: GOLD + 'BB', textDecorationLine: 'underline',
  },
});
