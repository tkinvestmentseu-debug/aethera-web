// @ts-nocheck
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import { SectionHeading } from '../components/SectionHeading';
import {
  Sparkles, MoonStar, ArrowRight,
  Wand2, BookOpen, Sun, Globe, Flame, Star,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';

// ── Feature cards ─────────────────────────────────────────────────────────────
const FEATURE_CARDS = [
  {
    icon: Wand2,
    label: 'Oracle AI',
    desc: 'Rozmowy z AI dopasowane do Twojej ścieżki i energii dnia.',
    accent: '#A78BFA',
    accentBg: '#A78BFA',
  },
  {
    icon: BookOpen,
    label: 'Tarot & Odczyty',
    desc: 'Karty, numerologia, horoskop, sny — cały symboliczny wszechświat.',
    accent: '#F9A8D4',
    accentBg: '#F9A8D4',
  },
  {
    icon: Sun,
    label: 'Rytuały & Praktyki',
    desc: 'Medytacja, oddech, afirmacje — codzienna podróż ku sobie.',
    accent: '#6EE7B7',
    accentBg: '#6EE7B7',
  },
];

// ── Animated logo orb ─────────────────────────────────────────────────────────
const AnimatedLogoOrb = ({ accent, isLight }) => {
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const ringScale = useSharedValue(0.9);
  const ringOpacity = useSharedValue(0);
  const sparkleRotate = useSharedValue(0);

  useEffect(() => {
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.92, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 1600 }),
        withTiming(0.22, { duration: 1600 }),
      ), -1, true,
    );
    ringScale.value = withDelay(400, withRepeat(
      withSequence(
        withTiming(1.3, { duration: 2200 }),
        withTiming(0.92, { duration: 2200 }),
      ), -1, true,
    ));
    ringOpacity.value = withDelay(400, withRepeat(
      withSequence(
        withTiming(0.3, { duration: 2200 }),
        withTiming(0.0, { duration: 2200 }),
      ), -1, true,
    ));
    sparkleRotate.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }), -1, false,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));
  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotate.value}deg` }],
  }));

  return (
    <View style={styles.orbWrapper}>
      <Animated.View style={[styles.glowRingOuter, { borderColor: accent + '20' }, ringStyle]} />
      <Animated.View style={[styles.glowRing, { borderColor: accent + '55' }, glowStyle]} />
      <Animated.View
        entering={FadeIn.delay(300).duration(900)}
        style={[
          styles.symbolHalo,
          {
            borderColor: isLight ? accent + '30' : accent + '28',
            backgroundColor: isLight ? accent + '10' : accent + '0B',
          },
        ]}
      >
        <MoonStar color={accent} size={32} strokeWidth={1.3} />
        <Animated.View style={[styles.innerSpark, sparkleStyle]}>
          <Sparkles color={accent + 'BB'} size={14} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

// ── Feature card ──────────────────────────────────────────────────────────────
const FeatureCard = ({ card, index, isLight, accent }) => {
  const Icon = card.icon;
  const cardBg = isLight ? card.accentBg + '10' : card.accentBg + '0E';
  const cardBorder = isLight ? card.accentBg + '25' : card.accentBg + '22';

  return (
    <Animated.View
      entering={FadeInUp.delay(600 + index * 120).duration(700)}
      style={[styles.featureCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
    >
      <View style={[styles.featureIconBox, { backgroundColor: card.accentBg + '20' }]}>
        <Icon color={card.accent} size={20} strokeWidth={1.5} />
      </View>
      <View style={styles.featureCardText}>
        <Typography variant="microLabel" color={card.accent} style={{ marginBottom: 4 }}>
          {card.label}
        </Typography>
        <Typography variant="bodySmall" style={[styles.featureDesc, { opacity: isLight ? 0.72 : 0.75 }]}>
          {card.desc}
        </Typography>
      </View>
    </Animated.View>
  );
};

// ── Testimonial ───────────────────────────────────────────────────────────────
const Testimonial = ({ isLight, accent }) => (
  <Animated.View
    entering={FadeInDown.delay(1000).duration(700)}
    style={[
      styles.testimonialCard,
      {
        borderLeftColor: accent,
        backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)',
        borderColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)',
      },
    ]}
  >
    <View style={[styles.testimonialQuoteIcon, { backgroundColor: accent + '18' }]}>
      <Flame color={accent} size={14} strokeWidth={1.5} />
    </View>
    <Typography variant="bodySmall" style={[styles.testimonialText, { opacity: isLight ? 0.82 : 0.80 }]}>
      {i18n.language?.startsWith('en')
        ? '"Aethera is the first app where I truly felt that something was listening to me instead of just serving ready-made answers."'
        : '"Aethera to pierwsza aplikacja, w której poczułam, że coś naprawdę mnie słucha — a nie tylko podaje gotowe odpowiedzi."'}
    </Typography>
    <View style={styles.testimonialAuthorRow}>
      <View style={[styles.testimonialDot, { backgroundColor: accent }]} />
      <Typography variant="microLabel" color={accent} style={{ opacity: 0.85 }}>
        {i18n.language?.startsWith('en') ? 'User, 32 years old' : 'Użytkowniczka, 32 lata'}
      </Typography>
    </View>
  </Animated.View>
);

// ── Last active section ────────────────────────────────────────────────────────
const LastActiveSection = ({ streaks, isLight, accent }) => {
  const { t } = useTranslation();
  const lastDate = streaks?.lastCheckIn;
  if (!lastDate) return null;

  const formatted = (() => {
    try {
      const d = new Date(lastDate);
      return d.toLocaleDateString(
        t('common.localeCode', { defaultValue: i18n.language?.startsWith('en') ? 'en-US' : 'pl-PL' }) as string,
        { day: 'numeric', month: 'long', year: 'numeric' },
      );
    } catch {
      return lastDate;
    }
  })();

  return (
    <Animated.View
      entering={FadeInDown.delay(1200).duration(600)}
      style={[
        styles.lastActiveCard,
        {
          backgroundColor: isLight ? accent + '0A' : accent + '0D',
          borderColor: isLight ? accent + '22' : accent + '20',
        },
      ]}
    >
      <View style={styles.lastActiveRow}>
        <Star color={accent} size={14} fill={accent} />
        <Typography variant="microLabel" color={accent} style={{ marginLeft: 8 }}>
          {t('welcome.lastActive.label', { defaultValue: i18n.language?.startsWith('en') ? 'LAST ACTIVE' : 'OSTATNIO AKTYWNA' })}
        </Typography>
      </View>
      <Typography variant="bodySmall" style={[{ marginTop: 6, opacity: isLight ? 0.75 : 0.72 }]}>
        {formatted}
      </Typography>
      {streaks?.current > 0 && (
        <View style={styles.streakRow}>
          <Flame color={accent} size={12} strokeWidth={1.5} />
          <Typography variant="microLabel" color={accent} style={{ marginLeft: 6 }}>
            {t('welcome.lastActive.streak', {
              count: streaks.current,
              defaultValue: i18n.language?.startsWith('en')
                ? `${streaks.current} day streak`
                : `${streaks.current} ${streaks.current === 1 ? 'dzień' : 'dni'} z rzędu`,
            })}
          </Typography>
        </View>
      )}
    </Animated.View>
  );
};

// ── Brand wordmark ────────────────────────────────────────────────────────────
const AetheraBrand = ({ accent, subColor }) => (
  <View style={styles.brandRow}>
    <Typography
      variant="microLabel"
      style={[styles.brandWordmark, { color: '#A97A39' }]}
    >
      ✦ AETHERA
    </Typography>
    <Typography variant="microLabel" style={[styles.brandSub, { color: subColor }]}>
      DuniAI & Oracle
    </Typography>
  </View>
);

// ── Main component ────────────────────────────────────────────────────────────
interface WelcomeScreenProps {
  onPrimary: () => void;
  onSecondary: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPrimary, onSecondary }) => {
  const { t } = useTranslation();
  const { themeName, isOnboarded, userData, streaks } = useAppStore();
  const theme = getResolvedTheme(themeName);
  const isLight = theme.background.startsWith('#F');
  const insets = useSafeAreaInsets();
  const hasPartialProfile = Boolean(userData.name || userData.birthDate || userData.primaryIntention);
  const accent = theme.primary;
  const subColor = isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)';
  const textMuted = isLight ? 'rgba(0,0,0,0.38)' : 'rgba(255,255,255,0.38)';
  const localizedFeatureCards = FEATURE_CARDS.map((card, index) => ({
    ...card,
    label: t(`welcome.features.${index}.label`, { defaultValue: card.label }),
    desc: t(`welcome.features.${index}.desc`, { defaultValue: card.desc }),
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CelestialBackdrop intensity="immersive" />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand row */}
          <Animated.View entering={FadeIn.delay(100).duration(800)} style={styles.brandContainer}>
            <AetheraBrand accent={accent} subColor={subColor} />
          </Animated.View>

          {/* Animated logo orb */}
          <Animated.View entering={FadeIn.delay(200).duration(900)} style={styles.orbArea}>
            <AnimatedLogoOrb accent={accent} isLight={isLight} />
            <Animated.View entering={FadeInDown.delay(500).duration(700)} style={styles.orbLabel}>
              <Typography variant="premiumLabel" color={accent}>
                {t('welcome.sanctuaryLabel', { defaultValue: i18n.language?.startsWith('en') ? 'PRIVATE SANCTUARY' : 'PRYWATNE SANKTUARIUM' })}
              </Typography>
            </Animated.View>
          </Animated.View>

          {/* Headline */}
          <Animated.View entering={FadeInUp.delay(400).duration(900)} style={styles.headlineBlock}>
            <SectionHeading
              eyebrow="Aethera"
              title={t('welcome.hero.title', { defaultValue: i18n.language?.startsWith('en') ? 'Enter the sanctuary where AI meets intuition.' : 'Wejdź do sanktuarium, w którym AI spotyka intuicję.' })}
              subtitle={t('welcome.hero.subtitle', { defaultValue: i18n.language?.startsWith('en') ? 'A luxury space for readings, Oracle conversations, rituals, and symbolic guidance.' : 'Luksusowa przestrzeń dla odczytów, rozmów z Oracle, rytuałów i symbolicznego prowadzenia.' })}
            />
          </Animated.View>

          {/* Feature preview cards */}
          <Animated.View entering={FadeInUp.delay(500).duration(700)} style={styles.featuresSection}>
            <Typography variant="microLabel" color={accent} style={styles.sectionLabel}>
              {t('welcome.features.heading', { defaultValue: i18n.language?.startsWith('en') ? 'WHAT YOU WILL FIND INSIDE' : 'CO ZNAJDZIESZ W ŚRODKU' })}
            </Typography>
            {localizedFeatureCards.map((card, i) => (
              <FeatureCard
                key={card.label}
                card={card}
                index={i}
                isLight={isLight}
                accent={accent}
              />
            ))}
          </Animated.View>

          {/* Testimonial */}
          <Testimonial isLight={isLight} accent={accent} />

          {/* Last active — only when onboarded */}
          {isOnboarded && (
            <LastActiveSection streaks={streaks} isLight={isLight} accent={accent} />
          )}

          {/* Continuity card */}
          <Animated.View
            entering={FadeInDown.delay(1100).duration(700)}
            style={[
              styles.continuityCard,
              {
                borderLeftColor: accent,
                backgroundColor: isLight ? accent + '08' : accent + '0B',
                borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
              },
            ]}
          >
            <Typography variant="microLabel" color={accent}>
              {isOnboarded
                ? t('welcome.continuity.returningLabel', { defaultValue: i18n.language?.startsWith('en') ? 'The sanctuary remembers your path' : 'Sanktuarium pamięta Twoją ścieżkę' })
                : hasPartialProfile
                  ? t('welcome.continuity.resumeLabel', { defaultValue: i18n.language?.startsWith('en') ? 'Your setup is waiting' : 'Twoja konfiguracja czeka' })
                  : t('welcome.continuity.firstLabel', { defaultValue: i18n.language?.startsWith('en') ? 'First entry' : 'Pierwsze wejście' })}
            </Typography>
            <Typography variant="bodySmall" style={styles.continuityCopy}>
              {isOnboarded
                ? t('welcome.continuity.returningBody', { defaultValue: i18n.language?.startsWith('en') ? 'When you return, you open the same calm place: daily guidance, active threads, saved dreams, and private insights.' : 'Wracając, otwierasz to samo spokojne miejsce: dzienny przekaz, aktywne wątki, zapisane sny i prywatne wglądy.' })
                : hasPartialProfile
                  ? t('welcome.continuity.resumeBody', { defaultValue: i18n.language?.startsWith('en') ? 'You can return exactly to the point where building your sanctuary was interrupted.' : 'Możesz wrócić dokładnie do momentu, w którym przerwano tworzenie Twojego sanktuarium.' })
                  : t('welcome.continuity.firstBody', { defaultValue: i18n.language?.startsWith('en') ? 'A few conscious choices are enough for Aethera to begin responding in a tone aligned with you.' : 'Kilka świadomych wyborów wystarczy, by Aethera zaczęła odpowiadać tonem dopasowanym do Ciebie.' })}
            </Typography>
          </Animated.View>

          {/* CTA buttons */}
          <Animated.View entering={FadeInDown.delay(1300).duration(800)} style={styles.bottomArea}>
            <PremiumButton
              label={isOnboarded
                ? t('welcome.cta.primaryReturning', { defaultValue: i18n.language?.startsWith('en') ? 'Return to the sanctuary' : 'Wróć do sanktuarium' })
                : t('welcome.cta.primaryNew', { defaultValue: i18n.language?.startsWith('en') ? 'Begin the journey' : 'Rozpocznij podróż' })}
              onPress={onPrimary}
            />
            <PremiumButton
              label={
                isOnboarded
                  ? t('welcome.cta.secondaryReturning', { defaultValue: i18n.language?.startsWith('en') ? 'Open my guidance' : 'Otwórz moje prowadzenie' })
                  : hasPartialProfile
                    ? t('welcome.cta.secondaryResume', { defaultValue: i18n.language?.startsWith('en') ? 'Return to setup' : 'Wróć do konfiguracji' })
                    : t('welcome.cta.secondaryExplore', { defaultValue: i18n.language?.startsWith('en') ? 'Explore Aethera' : 'Poznaj wnętrze Aethery' })
              }
              onPress={onSecondary}
              variant="secondary"
              style={{ marginTop: 14 }}
            />

            <Pressable onPress={onPrimary} style={styles.inlineLink}>
              <Typography variant="bodySmall" color={theme.textSoft}>
                {t('welcome.inline', { defaultValue: i18n.language?.startsWith('en') ? 'Enter the sanctuary' : 'Wejdź do sanktuarium' })}
              </Typography>
              <ArrowRight color={accent} size={16} />
            </Pressable>
          </Animated.View>

          {/* Language hint */}
          <Animated.View entering={FadeIn.delay(1500).duration(700)} style={styles.langRow}>
            <Globe color={subColor} size={12} strokeWidth={1.5} />
            <Typography variant="microLabel" style={[styles.langText, { color: subColor }]}>
              {t('welcome.languageHint', { defaultValue: i18n.language?.startsWith('en') ? 'Language: English  ·  Change in settings' : 'Język: Polski  ·  Zmień w ustawieniach' })}
            </Typography>
          </Animated.View>

          {/* Terms & Privacy */}
          <Animated.View entering={FadeIn.delay(1600).duration(700)} style={styles.termsRow}>
            <Typography variant="microLabel" style={[styles.termsText, { color: textMuted }]}>
              {t('welcome.terms.prefix', { defaultValue: i18n.language?.startsWith('en') ? 'By using Aethera you accept ' : 'Używając Aethery akceptujesz ' })}
            </Typography>
            <Pressable hitSlop={8}>
              <Typography variant="microLabel" style={[styles.termsLink, { color: accent, opacity: 0.8 }]}>
                {t('welcome.terms.terms', { defaultValue: i18n.language?.startsWith('en') ? 'Terms of Use' : 'Warunki użytkowania' })}
              </Typography>
            </Pressable>
            <Typography variant="microLabel" style={[styles.termsText, { color: textMuted }]}>
              {t('welcome.terms.and', { defaultValue: i18n.language?.startsWith('en') ? ' and ' : ' i ' })}
            </Typography>
            <Pressable hitSlop={8}>
              <Typography variant="microLabel" style={[styles.termsLink, { color: accent, opacity: 0.8 }]}>
                {t('welcome.terms.privacy', { defaultValue: i18n.language?.startsWith('en') ? 'Privacy Policy' : 'Politykę prywatności' })}
              </Typography>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: layout.padding.screen,
    paddingTop: 16,
    gap: 0,
  },

  // Brand row
  brandContainer: { marginBottom: 8 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandWordmark: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3.5,
  },
  brandSub: {
    fontSize: 9,
    letterSpacing: 0.5,
    opacity: 0.7,
  },

  // Logo orb
  orbArea: {
    alignItems: 'center',
    marginVertical: 20,
  },
  orbWrapper: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRingOuter: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
  },
  glowRing: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 1.5,
  },
  symbolHalo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(128,128,128,0.07)',
  },
  innerSpark: {
    position: 'absolute',
    top: 22,
    right: 22,
  },
  orbLabel: {
    marginTop: 16,
  },

  // Headline
  headlineBlock: {
    marginBottom: 24,
  },

  // Features
  featuresSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    marginBottom: 14,
    letterSpacing: 2,
    opacity: 0.9,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 14,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureCardText: {
    flex: 1,
  },
  featureDesc: {
    lineHeight: 20,
  },

  // Testimonial
  testimonialCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: 20,
  },
  testimonialQuoteIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  testimonialText: {
    lineHeight: 24,
    fontStyle: 'italic',
  },
  testimonialAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  testimonialDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  // Last active
  lastActiveCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  lastActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  // Continuity card
  continuityCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: 28,
  },
  continuityCopy: {
    marginTop: 10,
    lineHeight: 24,
    opacity: 0.8,
  },

  // Bottom CTA
  bottomArea: {
    marginBottom: 24,
  },
  inlineLink: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  // Language row
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
    opacity: 0.75,
  },
  langText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },

  // Terms
  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginBottom: 8,
    opacity: 0.8,
  },
  termsText: {
    fontSize: 10,
    lineHeight: 18,
  },
  termsLink: {
    fontSize: 10,
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
});
