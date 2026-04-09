// @ts-nocheck
import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withRepeat, withSequence, withDelay, FadeIn, FadeInDown, FadeInUp,
  Easing, cancelAnimation, runOnJS,
} from 'react-native-reanimated';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../core/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import {
  calcZodiacSign, calcLifePath, calcAscendant, calcChineseZodiac,
} from '../core/utils/astroCalculations';
import { layout } from '../core/theme/designSystem';
import { HapticsService } from '../core/services/haptics.service';

const { width: SW, height: SH } = Dimensions.get('window');
const SP = layout.padding.screen;
const AUTO_ADVANCE_MS = 8000;

// ─── Chinese zodiac data ───────────────────────────────────────────────────────
const CHINESE_DATA: Record<string, { emoji: string; element: string; meaning: string; trait: string }> = {
  Szczur:   { emoji: '🐭', element: 'Woda',   meaning: 'Inteligentny strateg z niezwykłą zdolnością adaptacji. Zawsze znajdziesz wyjście z każdej sytuacji.', trait: 'Spryt' },
  Wół:      { emoji: '🐂', element: 'Ziemia', meaning: 'Niezachwiany filar siły i wytrwałości. Twoja cierpliwość buduje rzeczy, które trwają wieki.', trait: 'Wytrwałość' },
  Tygrys:   { emoji: '🐯', element: 'Drewno', meaning: 'Odważny wojownik z płonącym sercem. Rodzisz się, by prowadzić innych ku przemianie.', trait: 'Odwaga' },
  Królik:   { emoji: '🐰', element: 'Drewno', meaning: 'Delikatna dusza dyplomaty i artysty. Twoja łagodność jest formą głębokiej siły.', trait: 'Gracja' },
  Smok:     { emoji: '🐲', element: 'Ziemia', meaning: 'Mityczne stworzenie pełne magii i autorytetu. Twoja obecność zmienia każde pomieszczenie.', trait: 'Magia' },
  Wąż:      { emoji: '🐍', element: 'Ogień',  meaning: 'Mędrzec intuicji i głębokiej wiedzy. Widzisz to, czego inni nie dostrzegają.', trait: 'Mądrość' },
  Koń:      { emoji: '🐴', element: 'Ogień',  meaning: 'Wolny duch tętnicy i entuzjazmu. Życie jest dla Ciebie nieustanną przygodą.', trait: 'Wolność' },
  Koza:     { emoji: '🐐', element: 'Ziemia', meaning: 'Twórcza dusza o bogatym świecie wewnętrznym. Piękno widzisz wszędzie.', trait: 'Kreatywność' },
  Małpa:    { emoji: '🐒', element: 'Metal',  meaning: 'Błyskotliwy umysł pełen pomysłów i humoru. Rozwiązujesz problemy zanim inni je zauważą.', trait: 'Inteligencja' },
  Kogut:    { emoji: '🐓', element: 'Metal',  meaning: 'Perfekcjonista z wyjątkową dbałością o szczegóły. Twoja precyzja to dar.', trait: 'Precyzja' },
  Pies:     { emoji: '🐕', element: 'Ziemia', meaning: 'Wierna strażniczka serca i prawdy. Lojalność jest Twoją najwyższą wartością.', trait: 'Lojalność' },
  Świnia:   { emoji: '🐖', element: 'Woda',   meaning: 'Hojne serce przepełnione radością i obfitością. Przyciągasz błogosławieństwa do swojego życia.', trait: 'Obfitość' },
};

const ELEMENT_COLORS: Record<string, [string, string]> = {
  'Ogień':     ['#F97316', '#EF4444'],
  'Ziemia':    ['#10B981', '#059669'],
  'Powietrze': ['#6366F1', '#8B5CF6'],
  'Woda':      ['#3B82F6', '#6366F1'],
  'Drewno':    ['#22C55E', '#16A34A'],
  'Metal':     ['#94A3B8', '#64748B'],
};

const LIFE_PATH_COLORS: Record<number, [string, string]> = {
  1: ['#F97316', '#EF4444'], 2: ['#6366F1', '#8B5CF6'], 3: ['#F59E0B', '#F97316'],
  4: ['#10B981', '#059669'], 5: ['#8B5CF6', '#EC4899'], 6: ['#EC4899', '#F43F5E'],
  7: ['#818CF8', '#6366F1'], 8: ['#F59E0B', '#D97706'], 9: ['#A78BFA', '#7C3AED'],
  11: ['#CEAE72', '#F59E0B'], 22: ['#10B981', '#6366F1'], 33: ['#EC4899', '#A78BFA'],
};

// ─── Star field ────────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 36 }, (_, i) => ({
  x: (i * 137.5 + 23) % SW,
  y: (i * 89.3 + 17) % (SH * 0.7),
  s: 0.8 + (i % 5) * 0.5,
  o: 0.2 + (i % 7) * 0.1,
  delay: (i % 9) * 220,
}));

// ─── Single reveal card ────────────────────────────────────────────────────────
const RevealCard = React.memo(({
  colors, badge, emoji, title, subtitle, description, chips, challenge, delay,
}: {
  colors: [string, string];
  badge: string;
  emoji: string;
  title: string;
  subtitle?: string;
  description: string;
  chips?: string[];
  challenge?: string;
  delay: number;
}) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(700).springify().damping(16)}>
    <View style={s.card}>
      <LinearGradient
        colors={[colors[0] + '28', colors[1] + '0E', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      {/* top accent line */}
      <LinearGradient
        colors={['transparent', colors[0] + 'CC', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={s.cardLine}
      />
      <View style={s.cardTop}>
        <View style={[s.badgePill, { backgroundColor: colors[0] + '20', borderColor: colors[0] + '50' }]}>
          <Text style={[s.badgeText, { color: colors[0] }]}>{badge}</Text>
        </View>
      </View>
      <View style={s.cardBody}>
        <LinearGradient colors={[colors[0] + '45', colors[1] + '25']} style={s.emojiBox}>
          <Text style={s.emojiText}>{emoji}</Text>
        </LinearGradient>
        <View style={s.cardRight}>
          <Text style={s.cardTitle}>{title}</Text>
          {subtitle != null ? <Text style={[s.cardSubtitle, { color: colors[0] }]}>{subtitle}</Text> : null}
        </View>
      </View>
      <Text style={s.cardDesc}>{description}</Text>
      {chips != null && chips.length > 0 ? (
        <View style={s.chipsRow}>
          {chips.map((c, i) => (
            <View key={i} style={[s.chip, { borderColor: colors[0] + '50', backgroundColor: colors[0] + '14' }]}>
              <Text style={[s.chipText, { color: colors[0] }]}>{c}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {challenge != null ? (
        <View style={[s.challengeBox, { backgroundColor: colors[0] + '12', borderColor: colors[0] + '30' }]}>
          <Text style={[s.challengeLabel, { color: colors[0] }]}>{t('spiritualReveal.wyzwanie_duszy', '⚡ WYZWANIE DUSZY')}</Text>
          <Text style={s.challengeText}>{challenge}</Text>
        </View>
      ) : null}
    </View>
  </Animated.View>
));

// ─── Main screen ───────────────────────────────────────────────────────────────
export const SpiritualProfileRevealScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const userData = useAppStore(s => s.userData);
  const setUserData = useAppStore(s => s.setUserData);
  const setOnboarded = useAppStore(s => s.setOnboarded);

  const zodiac    = calcZodiacSign(userData.birthDate);
  const lifePath  = calcLifePath(userData.birthDate);
  const asc       = userData.birthTime ? calcAscendant(userData.birthDate, userData.birthTime) : null;
  const birthYear = userData.birthDate ? parseInt(userData.birthDate.split('-')[0], 10) : null;
  const chineseAnimal = birthYear ? calcChineseZodiac(birthYear) : null;
  const chineseData   = chineseAnimal ? CHINESE_DATA[chineseAnimal] : null;

  const zodiacColors  = ELEMENT_COLORS[zodiac?.element ?? 'Woda']      ?? ['#6366F1', '#8B5CF6'];
  const lpColors      = LIFE_PATH_COLORS[lifePath?.number ?? 7]        ?? ['#6366F1', '#8B5CF6'];
  const chColors      = ELEMENT_COLORS[chineseData?.element ?? 'Ziemia'] ?? ['#10B981', '#059669'];
  const ascColors     = ELEMENT_COLORS[asc?.element ?? 'Powietrze']    ?? ['#8B5CF6', '#6366F1'];

  // ── Animations ──
  const headerOpacity = useSharedValue(0);
  const headerY       = useSharedValue(20);
  const ctaScale      = useSharedValue(0.94);
  const progressWidth = useSharedValue(0);
  const starOpacity   = useSharedValue(0.5);

  const handleEnter = useCallback(() => {
    HapticsService.notify();
    setUserData({ profileRevealSeen: true });
    setOnboarded(true);
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }, [navigation, setUserData, setOnboarded]);

  useEffect(() => {
    HapticsService.notify();

    headerOpacity.value = withDelay(100, withTiming(1, { duration: 900 }));
    headerY.value       = withDelay(100, withSpring(0, { damping: 14, stiffness: 70 }));

    ctaScale.value = withDelay(
      900,
      withRepeat(
        withSequence(withTiming(1.04, { duration: 1600 }), withTiming(0.97, { duration: 1600 })),
        -1, false,
      ),
    );

    starOpacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 2200 }), withTiming(0.4, { duration: 2200 })),
      -1, false,
    );

    // Auto-advance progress bar
    progressWidth.value = withDelay(
      1200,
      withTiming(1, { duration: AUTO_ADVANCE_MS, easing: Easing.linear }, (finished) => {
        if (finished) runOnJS(handleEnter)();
      }),
    );

    return () => {
      cancelAnimation(ctaScale);
      cancelAnimation(starOpacity);
      cancelAnimation(progressWidth);
    };
  }, []);

  const headerStyle   = useAnimatedStyle(() => ({ opacity: headerOpacity.value, transform: [{ translateY: headerY.value }] }));
  const ctaStyle      = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }));
  const progressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value * 100}%` }));
  const starStyle     = useAnimatedStyle(() => ({ opacity: starOpacity.value }));

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* Deep space background */}
      <LinearGradient
        colors={['#050214', '#090528', '#07091C']}
        style={StyleSheet.absoluteFill}
      />

      {/* Radial glow behind content */}
      <View style={s.glowTop} />
      <View style={s.glowBottom} />

      {/* Star field */}
      <Animated.View style={[StyleSheet.absoluteFill, starStyle]} pointerEvents="none">
        {STARS.map((star, i) => (
          <View key={i} style={{
            position: 'absolute', top: star.y, left: star.x,
            width: star.s, height: star.s, borderRadius: star.s / 2,
            backgroundColor: `rgba(255,255,255,${star.o})`,
          }} />
        ))}
        {/* Gold accent stars */}
        {[0.12, 0.27, 0.55, 0.73, 0.88].map((xr, i) => (
          <View key={`g${i}`} style={{
            position: 'absolute',
            top: SH * [0.08, 0.22, 0.14, 0.31, 0.19][i],
            left: SW * xr,
            width: 2.5, height: 2.5, borderRadius: 1.5,
            backgroundColor: 'rgba(201,169,110,0.8)',
          }} />
        ))}
      </Animated.View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
        >
          {/* ── Header ── */}
          <Animated.View style={[s.header, headerStyle]}>
            <View style={s.eyebrowRow}>
              <View style={s.eyebrowLine} />
              <Text style={s.eyebrow}>{t('spiritualReveal.twoj_kosmiczny_portret', '✦  TWÓJ KOSMICZNY PORTRET  ✦')}</Text>
              <View style={s.eyebrowLine} />
            </View>
            <Text style={s.headerTitle}>
              {userData.name ? `Witaj, ${userData.name}` : 'Witaj w Aetherze'}
            </Text>
            <Text style={s.headerSub}>
              Gwiazdy odkryły Twoją unikalną duszę.{'\n'}Oto Twój profil duchowy.
            </Text>
          </Animated.View>

          {/* ── Zodiac ── */}
          {zodiac != null ? (
            <RevealCard
              delay={320}
              colors={zodiacColors}
              badge="ZNAK ZODIAKU"
              emoji={zodiac.emoji}
              title={zodiac.sign}
              subtitle={`${zodiac.element} · ${zodiac.ruling}`}
              description={zodiac.description}
              chips={zodiac.keywords}
            />
          ) : null}

          {/* ── Life Path ── */}
          {lifePath != null ? (
            <RevealCard
              delay={520}
              colors={lpColors}
              badge={`LICZBA ŻYCIA${lifePath.isMaster ? ' · MISTRZOWSKA' : ''}`}
              emoji={String(lifePath.number)}
              title={lifePath.title}
              description={lifePath.meaning}
              chips={lifePath.strengths}
              challenge={lifePath.challenge}
            />
          ) : null}

          {/* ── Chinese Zodiac ── */}
          {chineseData != null && chineseAnimal != null ? (
            <RevealCard
              delay={720}
              colors={chColors}
              badge="CHIŃSKI ZODIAK"
              emoji={chineseData.emoji}
              title={chineseAnimal}
              subtitle={`${chineseData.element} · ${chineseData.trait}`}
              description={chineseData.meaning}
              chips={[chineseData.element, chineseData.trait]}
            />
          ) : null}

          {/* ── Ascendant ── */}
          {asc != null ? (
            <RevealCard
              delay={920}
              colors={ascColors}
              badge="ASCENDENT · MASKA"
              emoji={asc.emoji}
              title={asc.sign}
              subtitle={t('spiritualReveal.jak_swiat_cie_postrzega', 'Jak świat Cię postrzega')}
              description={`Ascendent w ${asc.sign} nadaje Ci aurę ${
                asc.element === 'Ogień'     ? 'energii i pewności siebie' :
                asc.element === 'Ziemia'    ? 'spokoju i wiarygodności' :
                asc.element === 'Powietrze' ? 'lekkości i intelektu' :
                'głębi i intuicji'
              }. To Twoja "maska" — pierwsza warstwa, którą świat widzi zanim pozna Twoje prawdziwe serce.`}
            />
          ) : null}

          {/* ── CTA + progress ── */}
          <Animated.View entering={FadeInUp.delay(1100).duration(700)} style={s.ctaSection}>

            {/* auto-advance bar */}
            <View style={s.progressTrack}>
              <Animated.View style={[s.progressFill, progressStyle]} />
            </View>
            <Text style={s.progressHint}>{t('spiritualReveal.automatycz_wejscie_za_chwile', 'Automatyczne wejście za chwilę…')}</Text>

            <Animated.View style={ctaStyle}>
              <Pressable onPress={handleEnter} style={s.ctaBtn}>
                <LinearGradient
                  colors={['#7C3AED', '#5B21B6', '#3B0764']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={s.ctaBtnInner}
                >
                  <Text style={s.ctaEmoji}>✦</Text>
                  <Text style={s.ctaText}>{t('spiritualReveal.wejdz_do_aethery', 'Wejdź do Aethery')}</Text>
                  <Text style={s.ctaArrow}>→</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Text style={s.ctaHint}>
              {t('spiritualReveal.twoj_profil_jest_bezpieczny_zawsze', 'Twój profil jest bezpieczny. Zawsze możesz go edytować w ustawieniach.')}
            </Text>
          </Animated.View>

          <View style={{ height: insets.bottom + 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050214' },

  glowTop: {
    position: 'absolute', top: -100, left: SW / 2 - 180,
    width: 360, height: 360, borderRadius: 180,
    backgroundColor: 'rgba(124,58,237,0.14)',
  },
  glowBottom: {
    position: 'absolute', bottom: 100, left: SW / 2 - 140,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(37,99,235,0.10)',
  },

  scrollContent: {
    paddingHorizontal: SP,
    paddingBottom: 20,
  },

  // Header
  header: { paddingTop: 20, paddingBottom: 32, alignItems: 'center' },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  eyebrowLine: { flex: 1, height: 1, backgroundColor: 'rgba(201,169,110,0.25)' },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: 'rgba(201,169,110,0.8)' },
  headerTitle: {
    fontSize: 32, fontWeight: '700', color: '#FFFFFF',
    textAlign: 'center', letterSpacing: -0.5, lineHeight: 40,
    marginBottom: 10,
  },
  headerSub: {
    fontSize: 15, color: 'rgba(255,255,255,0.48)',
    textAlign: 'center', lineHeight: 24,
  },

  // Card
  card: {
    borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    padding: 20, marginBottom: 14, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35, shadowRadius: 24,
    elevation: 8,
  },
  cardLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
  },
  cardTop: { marginBottom: 14 },
  badgePill: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.8 },

  cardBody: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  emojiBox: {
    width: 76, height: 76, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  emojiText: { fontSize: 36 },
  cardRight: { flex: 1, marginLeft: 16 },
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  cardSubtitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginTop: 4, textTransform: 'uppercase' },

  cardDesc: { fontSize: 14, color: 'rgba(255,255,255,0.62)', lineHeight: 22, marginBottom: 14 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5 },
  chipText: { fontSize: 11, fontWeight: '600' },

  challengeBox: { borderRadius: 14, borderWidth: 1, padding: 13, marginTop: 10 },
  challengeLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.8, marginBottom: 5 },
  challengeText: { fontSize: 13, color: 'rgba(255,255,255,0.58)', lineHeight: 20 },

  // CTA
  ctaSection: { marginTop: 20, alignItems: 'center' },

  progressTrack: {
    width: '80%', height: 3, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden', marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(167,139,250,0.7)',
    borderRadius: 99,
  },
  progressHint: {
    fontSize: 11, color: 'rgba(255,255,255,0.28)', letterSpacing: 0.3,
    marginBottom: 20,
  },

  ctaBtn: {
    width: SW - SP * 2,
    borderRadius: 30, overflow: 'hidden',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 24, elevation: 10,
    marginBottom: 16,
  },
  ctaBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, paddingVertical: 19, paddingHorizontal: 28,
  },
  ctaEmoji: { fontSize: 18, color: 'rgba(255,255,255,0.8)' },
  ctaText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
  ctaArrow: { fontSize: 18, color: 'rgba(255,255,255,0.7)' },

  ctaHint: {
    fontSize: 11, color: 'rgba(255,255,255,0.28)',
    textAlign: 'center', lineHeight: 18, paddingHorizontal: 20,
  },
});
