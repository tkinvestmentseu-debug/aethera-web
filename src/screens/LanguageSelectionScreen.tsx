// @ts-nocheck
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Animated as RNAnimated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ChevronRight, Globe2, Check, Sparkles, Info, ChevronDown, ChevronUp } from 'lucide-react-native';
import { I18nManager } from 'react-native';
import { isRTLLanguage } from '../core/i18n/languageOptions';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Typography } from '../components/Typography';
import { useAppStore } from '../store/useAppStore';
import { layout, screenContracts } from '../core/theme/designSystem';
import { LANGUAGE_OPTIONS } from '../core/i18n/languageOptions';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';

// ── Stała paleta "deep space" — ten ekran zawsze dark ──
const SPACE_BG = '#05030E';
const GOLD = '#CEB472';
const TEXT_PRIMARY = '#F5F1EA';
const TEXT_SUB = '#9A8F7E';

// ── 50 losowych gwiazd (seed statyczny, żeby nie losować przy każdym renderze) ──
const STARS = Array.from({ length: 50 }, (_, i) => ({
  cx: ((i * 137.508 + 23) % 390),
  cy: ((i * 97.3 + 11) % 220),
  r: i % 7 === 0 ? 1.5 : i % 3 === 0 ? 1.1 : 0.7,
  opacity: 0.3 + (i % 5) * 0.12,
}));

const LANGUAGE_DESCRIPTIONS: Record<string, { culture: string; note: string }> = {
  pl: {
    culture: 'Polska tradycja duchowa zakorzeniona w symbolice słowiańskiej i mistycyzmie. Pełne doświadczenie Aethera z lokalnym kontekstem.',
    note: 'Pełna wersja z lokalnym kontekstem kulturowym',
  },
  en: {
    culture: 'Access the widest library of esoteric knowledge, from Hermetic traditions to modern mindfulness.',
    note: 'Full version — globally referenced spiritual traditions',
  },
  es: {
    culture: 'La riqueza espiritual latina — chamanismo, astrología y tradiciones ancestrales de sanación.',
    note: 'Versión completa con contexto cultural latinoamericano',
  },
  pt: {
    culture: 'A espiritualidade do mundo lusófono — sincretismo, tradições ancestrais e sabedoria interior.',
    note: 'Versão completa com contexto cultural português',
  },
  de: {
    culture: 'Deutsche mystische Tradition — von Hildegard von Bingen bis zur modernen Achtsamkeit.',
    note: 'Vollständige Version mit kulturellem Kontext',
  },
  fr: {
    culture: 'La richesse spirituelle française — ésotérisme, alchimie et sagesse de l\'âme.',
    note: 'Version complète avec contexte culturel français',
  },
  it: {
    culture: 'La spiritualità italiana — rinascimento, ermetismo e tradizioni sapienziali mediterranee.',
    note: 'Versione completa con contesto culturale italiano',
  },
  ru: {
    culture: 'Русская духовная традиция — православный мистицизм, космизм и народная мудрость.',
    note: 'Полная версия с культурным контекстом',
  },
  ar: {
    culture: 'التراث الروحي العربي — الصوفية، التنجيم والحكمة الأزلية للشرق.',
    note: 'نسخة كاملة بالسياق الثقافي العربي',
  },
  ja: {
    culture: '日本の精神的伝統 — 禅、神道、そして自然と宇宙との調和。',
    note: '文化的背景を含む完全バージョン',
  },
};

const LANGUAGE_FEATURES: Record<string, string[]> = {
  pl: ['Pełne prowadzenie Oracle', 'Interpretacje tarota', 'Rytuały z kontekstem', 'Afirmacje', 'Numerologia i astrologia'],
  en: ['Full Oracle guidance', 'Tarot interpretations', 'Rituals & practices', 'Affirmations', 'Numerology & astrology'],
  es: ['Guía Oracle completa', 'Lecturas de tarot', 'Rituales y prácticas', 'Afirmaciones', 'Numerología y astrología'],
  pt: ['Guia Oracle completo', 'Leituras de tarot', 'Rituais e práticas', 'Afirmações', 'Numerologia e astrologia'],
  de: ['Vollständige Oracle-Führung', 'Tarot-Deutungen', 'Rituale & Praktiken', 'Affirmationen', 'Numerologie & Astrologie'],
  fr: ['Guide Oracle complet', 'Lectures de tarot', 'Rituels et pratiques', 'Affirmations', 'Numérologie et astrologie'],
  it: ['Guida Oracle completa', 'Letture dei tarocchi', 'Rituali e pratiche', 'Affermazioni', 'Numerologia e astrologia'],
  ru: ['Полное руководство Oracle', 'Чтения таро', 'Ритуалы и практики', 'Аффирмации', 'Нумерология и астрология'],
  ar: ['إرشاد Oracle كامل', 'قراءات التاروت', 'الطقوس والممارسات', 'التأكيدات', 'علم الأعداد والتنجيم'],
  ja: ['完全なOracleガイダンス', 'タロット読み', 'リチュアルと実践', 'アファメーション', '数秘術と占星術'],
};

const WHY_LANGUAGE_MATTERS = [
  { emoji: '🔮', title: 'Ton prowadzenia', desc: 'Język kształtuje głębokość rezonansu. Afirmacja po polsku trafia inaczej niż ta sama treść przetłumaczona z angielskiego.' },
  { emoji: '🌙', title: 'Kontekst kulturowy', desc: 'Tradycje duchowe mają swoje lokalne nuanse. Oracle AI rozumie je, gdy mówi w Twoim języku.' },
  { emoji: '✦', title: 'Zmiana w ustawieniach', desc: 'Możesz zmienić język w każdej chwili z poziomu Profilu. Ten wybór nie jest ostateczny.' },
];

export const LanguageSelectionScreen = ({ navigation, route }: any) => {
  // returnTo: 'Login' — gdy ekran jest wywoływany przed auth (nie z onboardingu)
  const returnTo: string | undefined = route?.params?.returnTo;
  const { t } = useTranslation();
  const tr = (pl: string, en: string) => (i18n.language?.startsWith('en') ? en : pl);
  const insets = useSafeAreaInsets();
    const setLanguage = useAppStore(s => s.setLanguage);
  // Ten ekran to onboarding — zawsze dark mode
  const accent = GOLD;
  const textColor = TEXT_PRIMARY;
  const subColor = TEXT_SUB;
  const cardBg = 'rgba(255,255,255,0.04)';
  const cardBorder = 'rgba(255,255,255,0.08)';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedInfo, setExpandedInfo] = useState(false);

  const handleSelect = (language: string) => {
    setSelectedId(language);
  };

  const handleContinue = () => {
    if (selectedId) {
      setLanguage(selectedId);
      // RTL support for Arabic
      const needsRTL = isRTLLanguage(selectedId);
      if (I18nManager.isRTL !== needsRTL) {
        I18nManager.forceRTL(needsRTL);
      }
      if (returnTo) {
        // Wywołany z auth flow — idź do wskazanego ekranu (Login)
        navigation.navigate(returnTo);
      } else if (navigation.canGoBack()) {
        // Wywołany z wnętrza aplikacji (np. Profil) — wróć
        navigation.goBack();
      } else {
        // Normalny onboarding — idź do IdentitySetup
        navigation.navigate('IdentitySetup');
      }
    }
  };

  const fullLangs = LANGUAGE_OPTIONS.filter(l => l.availability === 'full');
  const limitedLangs: typeof fullLangs = [];

  return (
    <View style={[styles.container, { backgroundColor: SPACE_BG }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'airy') + 90 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero full-width z SVG gwiazdami ── */}
          <Animated.View entering={FadeInDown.duration(600)}>
            <View style={styles.heroSection}>
              {/* Gwiazdy SVG */}
              <Svg style={StyleSheet.absoluteFill} viewBox="0 0 390 220">
                {STARS.map((s, i) => (
                  <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#CEB472" opacity={s.opacity} />
                ))}
              </Svg>
              {/* Ikona Globe */}
              <View style={styles.heroGlobeWrap}>
                <Globe2 color={GOLD} size={28} strokeWidth={1.5} />
              </View>
              <Typography
                variant="premiumLabel"
                style={styles.heroTitle}
              >
                {tr('WYBIERZ SWÓJ JĘZYK', 'CHOOSE YOUR LANGUAGE')}
              </Typography>
              <Typography
                variant="bodySmall"
                style={styles.heroSubtitle}
              >
                {tr(
                  'Język kształtuje ton prowadzenia AI, rytuałów i afirmacji.\nAethera mówi do Ciebie — nie tłumaczy.',
                  'Your language shapes AI guidance, rituals and affirmations.\nAethera speaks to you — not translates.',
                )}
              </Typography>

              {/* Expand: Dlaczego język ma znaczenie */}
              <Pressable
                onPress={() => setExpandedInfo(v => !v)}
                style={styles.whyRow}
              >
                <Info color={GOLD} size={13} strokeWidth={2} />
                <Typography variant="microLabel" color={GOLD} style={{ flex: 1 }}>
                  {tr('Dlaczego język ma znaczenie?', 'Why does language matter?')}
                </Typography>
                {expandedInfo ? <ChevronUp color={GOLD} size={13} /> : <ChevronDown color={GOLD} size={13} />}
              </Pressable>

              {expandedInfo && (
                <Animated.View entering={FadeInDown.duration(320)} style={{ gap: 12, paddingTop: 8 }}>
                  {WHY_LANGUAGE_MATTERS.map((item, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: GOLD + '14', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="bodyRefined">{item.emoji}</Typography>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="cardTitle" style={{ marginBottom: 3, color: TEXT_PRIMARY }}>
                          {item.title === 'Ton prowadzenia'
                            ? tr('Ton prowadzenia', 'Tone of guidance')
                            : item.title === 'Kontekst kulturowy'
                              ? tr('Kontekst kulturowy', 'Cultural context')
                              : item.title === 'Zmiana w ustawieniach'
                                ? tr('Zmiana w ustawieniach', 'Change in settings')
                                : item.title}
                        </Typography>
                        <Typography variant="bodySmall" style={{ opacity: 0.75, lineHeight: 19, color: TEXT_SUB }}>
                          {item.title === 'Ton prowadzenia'
                            ? tr(
                              'Język kształtuje głębokość rezonansu. Afirmacja po polsku trafia inaczej niż ta sama treść przetłumaczona z angielskiego.',
                              'Language changes the depth of resonance. An affirmation received in your own language lands differently.',
                            )
                            : item.title === 'Kontekst kulturowy'
                              ? tr(
                                'Tradycje duchowe mają swoje lokalne niuanse. Oracle AI rozumie je, gdy mówi w Twoim języku.',
                                'Spiritual traditions carry local nuance. Oracle AI understands it best when it speaks in your language.',
                              )
                              : tr(
                                'Możesz zmienić język w każdej chwili z poziomu Profilu. Ten wybór nie jest ostateczny.',
                                'You can change the language at any time from Profile. This choice is not final.',
                              )}
                        </Typography>
                      </View>
                    </View>
                  ))}
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {/* ── All languages ── */}
          <Animated.View entering={FadeInDown.delay(80).duration(520)}>
            <Typography variant="premiumLabel" color={GOLD} style={styles.sectionLabel}>
              {tr('10 języków · Pełna obsługa', '10 languages · Full support')}
            </Typography>
          </Animated.View>

          {fullLangs.map((item, idx) => {
            const info = LANGUAGE_DESCRIPTIONS[item.id];
            const features = LANGUAGE_FEATURES[item.id];
            const isSelected = selectedId === item.id;
            return (
              <Animated.View key={item.id} entering={FadeInDown.delay(100 + idx * 80).duration(440)}>
                <Pressable
                  onPress={() => handleSelect(item.id)}
                  style={[
                    styles.langCard,
                    {
                      borderColor: isSelected ? GOLD + '55' : cardBorder,
                      backgroundColor: isSelected ? GOLD + '15' : cardBg,
                      borderWidth: isSelected ? 1 : 1,
                      borderLeftWidth: isSelected ? 4 : 1,
                      borderLeftColor: isSelected ? GOLD : cardBorder,
                    },
                  ]}
                >
                  {isSelected && (
                    <LinearGradient
                      colors={[GOLD + '14', 'transparent']}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  {/* Top row */}
                  <View style={styles.langCardTop}>
                    <View style={{ flex: 1 }}>
                      <Typography variant="cardTitle" style={{ fontSize: 18, color: TEXT_PRIMARY }}>{item.native}</Typography>
                      {info && (
                        <Typography variant="bodySmall" style={{ marginTop: 4, opacity: 0.72, lineHeight: 19, color: TEXT_SUB }}>
                          {info.note}
                        </Typography>
                      )}
                    </View>
                    <View style={[
                      styles.selectCircle,
                      {
                        borderColor: isSelected ? GOLD : 'rgba(255,255,255,0.2)',
                        backgroundColor: isSelected ? GOLD : 'transparent',
                      },
                    ]}>
                      {isSelected && <Check color="#05030E" size={14} strokeWidth={2.5} />}
                    </View>
                  </View>

                  {/* Cultural note */}
                  {info && (
                    <Typography variant="bodySmall" style={{ marginTop: 10, lineHeight: 20, opacity: 0.8, color: TEXT_SUB }}>
                      {info.culture}
                    </Typography>
                  )}

                  {/* Features */}
                  {features && (
                    <View style={[styles.featuresRow, { borderTopColor: 'rgba(255,255,255,0.07)' }]}>
                      {features.map((f, fi) => (
                        <View key={fi} style={[styles.featureChip, {
                          backgroundColor: isSelected ? GOLD + '14' : 'rgba(255,255,255,0.05)',
                          borderColor: isSelected ? GOLD + '33' : 'transparent',
                        }]}>
                          <Sparkles color={isSelected ? GOLD : TEXT_SUB} size={10} strokeWidth={1.5} />
                          <Typography variant="microLabel" color={isSelected ? GOLD : TEXT_SUB}>{f}</Typography>
                        </View>
                      ))}
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}

          {/* ── Coming soon ── */}
          {limitedLangs.length > 0 && (
            <>
              <Animated.View entering={FadeInDown.delay(300).duration(520)}>
                <Typography variant="premiumLabel" color={GOLD} style={[styles.sectionLabel, { marginTop: 8 }]}>
                  {tr('Kolejne języki', 'More languages')}
                </Typography>
              </Animated.View>
              {limitedLangs.map((item, idx) => (
                <Animated.View key={item.id} entering={FadeInDown.delay(320 + idx * 60).duration(400)}>
                  <View style={[styles.langCard, { borderColor: cardBorder, backgroundColor: cardBg, opacity: 0.55 }]}>
                    <View style={styles.langCardTop}>
                      <View style={{ flex: 1 }}>
                        <Typography variant="cardTitle" style={{ color: TEXT_PRIMARY }}>{item.native}</Typography>
                        <Typography variant="bodySmall" style={{ marginTop: 4, opacity: 0.7, color: TEXT_SUB }}>{item.note}</Typography>
                      </View>
                      <View style={[styles.comingSoonBadge, { borderColor: GOLD + '33', backgroundColor: GOLD + '0C' }]}>
                        <Typography variant="microLabel" color={GOLD}>{tr('W przygotowaniu', 'Coming soon')}</Typography>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </>
          )}

          {/* ── Privacy note ── */}
          <Animated.View entering={FadeInDown.delay(400).duration(440)}>
            <View style={[styles.privacyCard, { borderColor: cardBorder, backgroundColor: cardBg }]}>
              <Typography variant="microLabel" color={TEXT_SUB} style={{ textAlign: 'center', lineHeight: 18 }}>
                {tr(
                  'Język można zmienić w dowolnym momencie w Profilu → Ustawienia.\nWybór nie wpływa na przechowywane dane.',
                  'You can change the language at any time in Profile → Settings.\nThis choice does not affect your saved data.',
                )}
              </Typography>
            </View>
          </Animated.View>

          <EndOfContentSpacer size="compact" />
        </ScrollView>

        {/* ── Gradient fade na dole ScrollView ── */}
        <View pointerEvents="none" style={styles.bottomFade}>
          <LinearGradient
            colors={['transparent', SPACE_BG]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* ── Fixed CTA ── */}
        {selectedId && (
          <Animated.View entering={FadeInUp.duration(320)} style={[styles.ctaBar, {
            paddingBottom: insets.bottom + 12,
            backgroundColor: 'rgba(5,3,14,0.97)',
            borderTopColor: 'rgba(206,180,114,0.15)',
            shadowColor: GOLD,
            shadowOpacity: 0.55,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: -4 },
            elevation: 16,
          }]}>
            <Pressable onPress={handleContinue} style={styles.ctaBtn}>
              <LinearGradient colors={[GOLD, GOLD + 'CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              <Typography variant="premiumLabel" color="#05030E" style={{ fontSize: 15 }}>
                {(fullLangs.find(l => l.id === selectedId)?.native || selectedId) + ' — ' + tr('KONTYNUUJ', 'CONTINUE')}
              </Typography>
              <ChevronRight color="#05030E" size={18} strokeWidth={2} />
            </Pressable>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: layout.padding.screen, paddingTop: 0 },

  // ── Hero section ──
  heroSection: {
    minHeight: 220,
    alignSelf: 'stretch',
    marginHorizontal: -layout.padding.screen,
    paddingHorizontal: layout.padding.screen,
    paddingTop: 28,
    paddingBottom: 20,
    marginBottom: 24,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    gap: 8,
  },
  heroGlobeWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(206,180,114,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(206,180,114,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  heroTitle: {
    color: '#F5F1EA',
    fontSize: 22,
    letterSpacing: 2.5,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#9A8F7E',
    lineHeight: 20,
    opacity: 0.88,
  },
  whyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(206,180,114,0.2)',
  },

  sectionLabel: { marginBottom: 12 },

  // ── Language cards ──
  langCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    overflow: 'hidden',
  },
  langCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  comingSoonBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  privacyCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginTop: 8,
  },

  // ── Gradient fade i CTA ──
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: layout.padding.screen,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
  },
});
