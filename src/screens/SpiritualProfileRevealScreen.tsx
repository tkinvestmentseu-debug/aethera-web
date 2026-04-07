// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withRepeat, withSequence, withDelay, FadeIn, FadeInDown, FadeInUp,
  Easing, cancelAnimation,
} from 'react-native-reanimated';
import { Sparkles, Star, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../core/hooks/useTheme';
import { calcZodiacSign, calcLifePath, calcAscendant } from '../core/utils/astroCalculations';
import { layout } from '../core/theme/designSystem';
import { HapticsService } from '../core/services/haptics.service';

const { width: SW, height: SH } = Dimensions.get('window');
const SP = layout.padding.screen;

// Element colors
const ELEMENT_COLORS: Record<string, [string, string]> = {
  'Ogień':     ['#F97316', '#EF4444'],
  'Ziemia':    ['#10B981', '#059669'],
  'Powietrze': ['#6366F1', '#8B5CF6'],
  'Woda':      ['#3B82F6', '#6366F1'],
};

const LIFE_PATH_COLORS: Record<number, [string, string]> = {
  1: ['#F97316', '#EF4444'], 2: ['#6366F1', '#8B5CF6'], 3: ['#F59E0B', '#F97316'],
  4: ['#10B981', '#059669'], 5: ['#8B5CF6', '#EC4899'], 6: ['#EC4899', '#F43F5E'],
  7: ['#818CF8', '#6366F1'], 8: ['#F59E0B', '#D97706'], 9: ['#A78BFA', '#7C3AED'],
  11: ['#CEAE72', '#F59E0B'], 22: ['#10B981', '#6366F1'], 33: ['#EC4899', '#A78BFA'],
};

// Star field decoration
const STARS = Array.from({ length: 28 }, (_, i) => ({
  x: Math.random() * SW,
  y: Math.random() * SH * 0.6,
  s: 1 + Math.random() * 2,
  o: 0.3 + Math.random() * 0.6,
}));

export const SpiritualProfileRevealScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const userData = useAppStore(s => s.userData);
  const setUserData = useAppStore(s => s.setUserData);
  const setOnboarded = useAppStore(s => s.setOnboarded);
  const { isLight } = useTheme();

  // Compute from stored data (already calculated in IdentitySetupScreen)
  const zodiac = calcZodiacSign(userData.birthDate);
  const lifePath = calcLifePath(userData.birthDate);
  const asc = userData.birthTime ? calcAscendant(userData.birthDate, userData.birthTime) : null;

  const zodiacColors = ELEMENT_COLORS[zodiac?.element ?? 'Woda'] ?? ['#6366F1', '#8B5CF6'];
  const lpColors = LIFE_PATH_COLORS[lifePath?.number ?? 7] ?? ['#6366F1', '#8B5CF6'];
  const ascColors = ELEMENT_COLORS[asc?.element ?? 'Powietrze'] ?? ['#8B5CF6', '#6366F1'];

  // Animations
  const headerScale = useSharedValue(0.85);
  const headerOpacity = useSharedValue(0);
  const ctaGlow = useSharedValue(1);
  const starPulse = useSharedValue(0.6);

  useEffect(() => {
    HapticsService.notify();
    headerScale.value = withSpring(1, { damping: 14, stiffness: 80 });
    headerOpacity.value = withTiming(1, { duration: 700 });
    ctaGlow.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 1600 }), withTiming(0.98, { duration: 1600 })),
      -1, false,
    );
    starPulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 2000 }), withTiming(0.5, { duration: 2000 })),
      -1, false,
    );
    return () => {
      cancelAnimation(ctaGlow);
      cancelAnimation(starPulse);
    };
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaGlow.value }],
  }));

  const handleEnter = () => {
    HapticsService.notify();
    setUserData({ profileRevealSeen: true });
    setOnboarded(true);
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* Deep space background */}
      <LinearGradient
        colors={['#050318', '#0A052A', '#070B20']}
        style={StyleSheet.absoluteFill}
      />

      {/* Stars */}
      {STARS.map((star, i) => (
        <View key={i} style={{
          position: 'absolute', top: star.y, left: star.x,
          width: star.s, height: star.s, borderRadius: star.s / 2,
          backgroundColor: `rgba(255,255,255,${star.o})`,
        }} />
      ))}

      {/* Radial glow */}
      <View style={s.glowCircle} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SP, paddingBottom: insets.bottom + 40 }}
        >
          {/* ── Header ── */}
          <Animated.View style={[s.header, headerStyle]}>
            <Text style={s.eyebrow}>{t('spiritualReveal.eyebrow', '✦ TWOJ KOSMICZNY PORTRET')}</Text>
            <Text style={s.title}>
              {userData.name
                ? `${userData.name},\n${t('spiritualReveal.starsKnowYou', 'Gwiazdy cie znaja')}`
                : t('spiritualReveal.title', 'Gwiazdy cie znaja')}
            </Text>
            <Text style={s.subtitle}>
              {t('spiritualReveal.subtitle', 'Twoj unikalny profil duchowy — odkryty przez daty, cyfry i niebo.')}
            </Text>
          </Animated.View>

          {/* ── ZNAK ZODIAKU ── */}
          {zodiac && (
            <Animated.View entering={FadeInDown.delay(300).duration(600).springify()}>
              <View style={s.card}>
                <LinearGradient
                  colors={[zodiacColors[0] + '22', zodiacColors[1] + '0C', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['transparent', zodiacColors[0] + 'AA', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.cardTopLine}
                />

                <View style={s.cardHeader}>
                  <View style={[s.badgePill, { backgroundColor: zodiacColors[0] + '22', borderColor: zodiacColors[0] + '55' }]}>
                    <Text style={[s.badgeText, { color: zodiacColors[0] }]}>{t('spiritualReveal.zodiacBadge', 'ZNAK ZODIAKU')}</Text>
                  </View>
                  <Text style={[s.datesText, { color: 'rgba(255,255,255,0.4)' }]}>{zodiac.dates}</Text>
                </View>

                <View style={s.cardMain}>
                  <LinearGradient
                    colors={[zodiacColors[0] + '40', zodiacColors[1] + '20']}
                    style={s.signCircle}
                  >
                    <Text style={s.signEmoji}>{zodiac.emoji}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1, marginLeft: 18 }}>
                    <Text style={s.signName}>{zodiac.sign}</Text>
                    <View style={s.elementRow}>
                      <LinearGradient
                        colors={zodiacColors}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={s.elementPill}
                      >
                        <Text style={s.elementText}>{zodiac.element} · {zodiac.ruling}</Text>
                      </LinearGradient>
                    </View>
                  </View>
                </View>

                <Text style={s.cardDesc}>{zodiac.description}</Text>

                <View style={s.keywordRow}>
                  {zodiac.keywords.map((kw, i) => (
                    <View key={i} style={[s.kwChip, { borderColor: zodiacColors[0] + '55', backgroundColor: zodiacColors[0] + '14' }]}>
                      <Text style={[s.kwText, { color: zodiacColors[0] }]}>{kw}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── LICZBA ŻYCIA ── */}
          {lifePath && (
            <Animated.View entering={FadeInDown.delay(480).duration(600).springify()}>
              <View style={s.card}>
                <LinearGradient
                  colors={[lpColors[0] + '22', lpColors[1] + '0C', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['transparent', lpColors[0] + 'AA', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.cardTopLine}
                />

                <View style={s.cardHeader}>
                  <View style={[s.badgePill, { backgroundColor: lpColors[0] + '22', borderColor: lpColors[0] + '55' }]}>
                    <Text style={[s.badgeText, { color: lpColors[0] }]}>{t('spiritualReveal.lifePathBadge', 'LICZBA ZYCIA')}{lifePath.isMaster ? t('spiritualReveal.master', ' · MISTRZOWSKA') : ''}</Text>
                  </View>
                </View>

                <View style={s.cardMain}>
                  <LinearGradient
                    colors={[lpColors[0] + '45', lpColors[1] + '25']}
                    style={[s.signCircle, { borderRadius: 20 }]}
                  >
                    <Text style={[s.signEmoji, { fontWeight: '900', fontSize: 36, color: '#fff' }]}>{lifePath.number}</Text>
                    {lifePath.isMaster && (
                      <Text style={{ position: 'absolute', bottom: 4, fontSize: 8, color: lpColors[0], fontWeight: '800' }}>✦</Text>
                    )}
                  </LinearGradient>
                  <View style={{ flex: 1, marginLeft: 18 }}>
                    <Text style={s.signName}>{lifePath.title}</Text>
                    <View style={s.elementRow}>
                      {lifePath.strengths.slice(0, 2).map((str, i) => (
                        <View key={i} style={[s.kwChip, { borderColor: lpColors[0] + '55', backgroundColor: lpColors[0] + '14', marginTop: 0, marginRight: 6 }]}>
                          <Text style={[s.kwText, { color: lpColors[0] }]}>{str}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                <Text style={s.cardDesc}>{lifePath.meaning}</Text>

                <View style={[s.challengeBox, { backgroundColor: lpColors[0] + '12', borderColor: lpColors[0] + '30' }]}>
                  <Text style={[s.challengeLabel, { color: lpColors[0] }]}>{t('spiritualReveal.soulChallenge', '⚡ WYZWANIE DUSZY')}</Text>
                  <Text style={s.challengeText}>{lifePath.challenge}</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── ASCENDENT ── */}
          {asc && (
            <Animated.View entering={FadeInDown.delay(660).duration(600).springify()}>
              <View style={s.card}>
                <LinearGradient
                  colors={[ascColors[0] + '22', ascColors[1] + '0C', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['transparent', ascColors[0] + 'AA', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.cardTopLine}
                />

                <View style={s.cardHeader}>
                  <View style={[s.badgePill, { backgroundColor: ascColors[0] + '22', borderColor: ascColors[0] + '55' }]}>
                    <Text style={[s.badgeText, { color: ascColors[0] }]}>{t('spiritualReveal.ascendantBadge', 'ASCENDENT · MASKA')}</Text>
                  </View>
                </View>

                <View style={s.cardMain}>
                  <LinearGradient
                    colors={[ascColors[0] + '40', ascColors[1] + '20']}
                    style={s.signCircle}
                  >
                    <Text style={s.signEmoji}>{asc.emoji}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1, marginLeft: 18 }}>
                    <Text style={s.signName}>{asc.sign}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 3, lineHeight: 18 }}>
                      Jak świat cię postrzega na pierwszy rzut oka
                    </Text>
                  </View>
                </View>

                <Text style={s.cardDesc}>
                  Ascendent w {asc.sign} nadaje Ci aurę {asc.element === 'Ogień' ? 'energii i pewności siebie' : asc.element === 'Ziemia' ? 'spokoju i wiarygodności' : asc.element === 'Powietrze' ? 'lekkości i intelektu' : 'głębi i intuicji'}. To Twoja "maska" — pierwsza warstwa, którą świat widzi zanim pozna Twoje prawdziwe serce.
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ── CTA ── */}
          <Animated.View
            entering={FadeInUp.delay(800).duration(600)}
            style={{ marginTop: 28 }}
          >
            <Animated.View style={ctaStyle}>
              <Pressable onPress={handleEnter} style={s.ctaBtn}>
                <LinearGradient
                  colors={['#7C3AED', '#6D28D9', '#4C1D95']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.ctaBtnInner}
                >
                  <Sparkles color="#fff" size={18} strokeWidth={1.8} />
                  <Text style={s.ctaText}>{t('spiritualReveal.ctaButton', 'Wejdz do Aethery ✦')}</Text>
                  <ChevronRight color="rgba(255,255,255,0.7)" size={18} strokeWidth={2.5} />
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Text style={s.ctaHint}>
              {t('spiritualReveal.ctaHint', 'Twoj profil jest bezpieczny i szyfrowany. Zawsze mozesz go edytowac w ustawieniach.')}
            </Text>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050318' },
  glowCircle: {
    position: 'absolute', top: -80, left: SW / 2 - 160,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(124,58,237,0.12)',
  },

  // Header
  header: { paddingTop: 16, paddingBottom: 28, alignItems: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2.5, color: 'rgba(196,181,253,0.7)', marginBottom: 12 },
  title: { fontSize: 30, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, lineHeight: 38 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 10, lineHeight: 22, paddingHorizontal: 12 },

  // Card
  card: {
    borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 20, marginBottom: 16, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 6,
  },
  cardTopLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  badgePill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  datesText: { fontSize: 10, fontWeight: '600' },

  cardMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  signCircle: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  signEmoji: { fontSize: 38 },
  signName: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  elementRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  elementPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  elementText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  cardDesc: { fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 22, marginBottom: 14 },

  keywordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  kwChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  kwText: { fontSize: 11, fontWeight: '600' },

  challengeBox: { borderRadius: 14, borderWidth: 1, padding: 12, marginTop: 4 },
  challengeLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.8, marginBottom: 5 },
  challengeText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },

  // CTA
  ctaBtn: { borderRadius: 30, overflow: 'hidden', marginBottom: 14 },
  ctaBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18, paddingHorizontal: 28,
  },
  ctaText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  ctaHint: { fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 18 },
});
