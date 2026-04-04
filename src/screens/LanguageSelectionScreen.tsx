// @ts-nocheck
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Animated as RNAnimated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ChevronRight, Globe2, Check, Sparkles, Info, ChevronDown, ChevronUp } from 'lucide-react-native';
import { I18nManager } from 'react-native';
import { isRTLLanguage } from '../core/i18n/languageOptions';
import { LinearGradient } from 'expo-linear-gradient';
import { CelestialBackdrop } from '../components/CelestialBackdrop';
import { Typography } from '../components/Typography';
import { SectionHeading } from '../components/SectionHeading';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { LANGUAGE_OPTIONS } from '../core/i18n/languageOptions';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';

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

export const LanguageSelectionScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const tr = (pl: string, en: string) => (i18n.language?.startsWith('en') ? en : pl);
  const insets = useSafeAreaInsets();
  const { themeName, setLanguage } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');
  const accent = currentTheme.primary;
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const cardBg = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';

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
      navigation.navigate('IdentitySetup');
    }
  };

  const fullLangs = LANGUAGE_OPTIONS.filter(l => l.availability === 'full');
  const limitedLangs: typeof fullLangs = [];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <CelestialBackdrop intensity="soft" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'airy') + 90 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <Animated.View entering={FadeInDown.duration(600)}>
            <View style={[styles.heroCard, { backgroundColor: isLight ? accent + '0A' : accent + '0D', borderColor: accent + '30', borderLeftColor: accent }]}>
              <View style={[styles.heroIcon, { backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.07)' }]}>
                <Globe2 color={accent} size={24} />
              </View>
              <Typography variant="premiumLabel" color={accent}>{tr('Wejście do sanktuarium', 'Entrance to the sanctuary')}</Typography>
              <Typography variant="bodyRefined" style={{ marginTop: 8, lineHeight: 24, opacity: 0.88 }}>
                {tr(
                  'Wybór języka wpływa na ton prowadzenia AI, interpretacje kart, rytuały i afirmacje. Aethera mówi do Ciebie — a nie tłumaczy z angielskiego.',
                  'Your language shapes the tone of AI guidance, card interpretations, rituals, and affirmations. Aethera speaks to you directly rather than translating from English.',
                )}
              </Typography>
              <Pressable
                onPress={() => setExpandedInfo(v => !v)}
                style={[styles.whyRow, { borderTopColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }]}
              >
                <Info color={accent} size={14} strokeWidth={2} />
                <Typography variant="microLabel" color={accent} style={{ flex: 1 }}>{tr('Dlaczego język ma znaczenie?', 'Why does language matter?')}</Typography>
                {expandedInfo ? <ChevronUp color={accent} size={14} /> : <ChevronDown color={accent} size={14} />}
              </Pressable>
              {expandedInfo && (
                <Animated.View entering={FadeInDown.duration(320)} style={{ gap: 12, paddingTop: 8 }}>
                  {WHY_LANGUAGE_MATTERS.map((item, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: accent + '12', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="bodyRefined">{item.emoji}</Typography>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="cardTitle" style={{ marginBottom: 3 }}>
                          {item.title === 'Ton prowadzenia'
                            ? tr('Ton prowadzenia', 'Tone of guidance')
                            : item.title === 'Kontekst kulturowy'
                              ? tr('Kontekst kulturowy', 'Cultural context')
                              : item.title === 'Zmiana w ustawieniach'
                                ? tr('Zmiana w ustawieniach', 'Change in settings')
                                : item.title}
                        </Typography>
                        <Typography variant="bodySmall" style={{ opacity: 0.75, lineHeight: 19 }}>
                          {item.title === 'Ton prowadzenia'
                            ? tr(
                              'Język kształtuje głębokość rezonansu. Afirmacja po polsku trafia inaczej niż ta sama treść przetłumaczona z angielskiego.',
                              'Language changes the depth of resonance. An affirmation received in your own language lands differently than one translated from another.',
                            )
                            : item.title === 'Kontekst kulturowy'
                              ? tr(
                                'Tradycje duchowe mają swoje lokalne niuanse. Oracle AI rozumie je, gdy mówi w Twoim języku.',
                                'Spiritual traditions carry local nuance. Oracle AI understands it best when it speaks in your language.',
                              )
                              : item.title === 'Zmiana w ustawieniach'
                                ? tr(
                                  'Możesz zmienić język w każdej chwili z poziomu Profilu. Ten wybór nie jest ostateczny.',
                                  'You can change the language at any time from Profile. This choice is not final.',
                                )
                                : item.desc}
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
            <Typography variant="premiumLabel" color={accent} style={styles.sectionLabel}>
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
                      borderColor: isSelected ? accent : cardBorder,
                      backgroundColor: isSelected ? accent + '0D' : cardBg,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                >
                  {isSelected && (
                    <LinearGradient
                      colors={[accent + '10', 'transparent']}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  {/* Top row */}
                  <View style={styles.langCardTop}>
                    <View style={{ flex: 1 }}>
                      <Typography variant="cardTitle" style={{ fontSize: 18 }}>{item.native}</Typography>
                      {info && (
                        <Typography variant="bodySmall" style={{ marginTop: 4, opacity: 0.72, lineHeight: 19 }}>
                          {info.note}
                        </Typography>
                      )}
                    </View>
                    <View style={[
                      styles.selectCircle,
                      {
                        borderColor: isSelected ? accent : cardBorder,
                        backgroundColor: isSelected ? accent : 'transparent',
                      },
                    ]}>
                      {isSelected && <Check color="#FFF" size={14} strokeWidth={2.5} />}
                    </View>
                  </View>

                  {/* Cultural note */}
                  {info && (
                    <Typography variant="bodySmall" style={{ marginTop: 10, lineHeight: 20, opacity: 0.8 }}>
                      {info.culture}
                    </Typography>
                  )}

                  {/* Features */}
                  {features && (
                    <View style={[styles.featuresRow, { borderTopColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }]}>
                      {features.map((f, fi) => (
                        <View key={fi} style={[styles.featureChip, { backgroundColor: isSelected ? accent + '14' : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)', borderColor: isSelected ? accent + '33' : 'transparent' }]}>
                          <Sparkles color={isSelected ? accent : subColor} size={10} strokeWidth={1.5} />
                          <Typography variant="microLabel" color={isSelected ? accent : subColor}>{f}</Typography>
                        </View>
                      ))}
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}

          {/* ── Coming soon ── */}
          <Animated.View entering={FadeInDown.delay(300).duration(520)}>
            <Typography variant="premiumLabel" color={accent} style={[styles.sectionLabel, { marginTop: 8 }]}>
              {tr('Kolejne języki', 'More languages')}
            </Typography>
          </Animated.View>

          {limitedLangs.map((item, idx) => (
            <Animated.View key={item.id} entering={FadeInDown.delay(320 + idx * 60).duration(400)}>
              <View style={[styles.langCard, { borderColor: cardBorder, backgroundColor: cardBg, opacity: 0.55 }]}>
                <View style={styles.langCardTop}>
                  <View style={{ flex: 1 }}>
                    <Typography variant="cardTitle">{item.native}</Typography>
                    <Typography variant="bodySmall" style={{ marginTop: 4, opacity: 0.7 }}>{item.note}</Typography>
                  </View>
                  <View style={[styles.comingSoonBadge, { borderColor: accent + '33', backgroundColor: accent + '0C' }]}>
                    <Typography variant="microLabel" color={accent}>{tr('W przygotowaniu', 'Coming soon')}</Typography>
                  </View>
                </View>
              </View>
            </Animated.View>
          ))}

          {/* ── Privacy note ── */}
          <Animated.View entering={FadeInDown.delay(400).duration(440)}>
            <View style={[styles.privacyCard, { borderColor: cardBorder, backgroundColor: cardBg }]}>
              <Typography variant="microLabel" color={subColor} style={{ textAlign: 'center', lineHeight: 18 }}>
                {tr(
                  'Język można zmienić w dowolnym momencie w Profilu → Ustawienia.\nWybór nie wpływa na przechowywane dane.',
                  'You can change the language at any time in Profile → Settings.\nThis choice does not affect your saved data.',
                )}
              </Typography>
            </View>
          </Animated.View>

          <EndOfContentSpacer size="compact" />
        </ScrollView>

        {/* ── Fixed CTA ── */}
        {selectedId && (
          <Animated.View entering={FadeInUp.duration(320)} style={[styles.ctaBar, { paddingBottom: insets.bottom + 12, backgroundColor: isLight ? 'rgba(250,246,238,0.97)' : 'rgba(8,6,18,0.97)', borderTopColor: cardBorder }]}>
            <Pressable onPress={handleContinue} style={styles.ctaBtn}>
              <LinearGradient colors={[accent, accent + 'CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              <Typography variant="premiumLabel" color="#000" style={{ fontSize: 15 }}>
                {(fullLangs.find(l => l.id === selectedId)?.native || selectedId) + ' — ' + tr('KONTYNUUJ', 'CONTINUE')}
              </Typography>
              <ChevronRight color="#000" size={18} strokeWidth={2} />
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
  scrollContent: { paddingHorizontal: layout.padding.screen, paddingTop: 8 },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 20,
    marginBottom: 24,
    gap: 4,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  whyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sectionLabel: { marginBottom: 12 },
  langCard: {
    borderRadius: 18,
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
