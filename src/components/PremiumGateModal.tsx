// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, Infinity as InfinityIcon, Sparkles, Moon } from 'lucide-react-native';
import { HapticsService } from '../core/services/haptics.service';

const { width: SW, height: SH } = Dimensions.get('window');

const GOLD = '#CEAE72';
const GOLD_LIGHT = '#E8C87A';
const SHEET_BG: [string, string, string] = ['#0E0A1A', '#160D2A', '#0E0A1A'];

// ── Context copy map ─────────────────────────────────────────────────────────
interface ContextCopy {
  headline: string;
  sub: string;
}

const CONTEXT_COPY: Record<string, ContextCopy> = {
  oracle: {
    headline: 'Twoja Wyrocznia ma więcej',
    sub: 'Pełna odpowiedź czeka. Wyrocznia dotknęła czegoś ważnego — nie zatrzymuj się w połowie drogi.',
  },
  tarot: {
    headline: 'Karty ujawniły coś dla ciebie',
    sub: 'Twój odczyt jest gotowy. Głębsza interpretacja tej karty wymaga otwartego dostępu.',
  },
  dreams: {
    headline: 'Symbol z twojego snu czeka',
    sub: 'Jungowska analiza tego symbolu jest gotowa — to nieprzypadkowy obraz.',
  },
  numerology: {
    headline: 'Twój kod liczbowy jest gotowy',
    sub: 'Interpretacja twojej matrycy numerologicznej została obliczona.',
  },
  palm: {
    headline: 'Linie twojej dłoni mówią',
    sub: 'Analiza palmistyczna ujawniła wzorzec, który warto poznać.',
  },
  rituals: {
    headline: 'Rytuał jest dla ciebie gotowy',
    sub: 'Ten rytuał wymaga pełnego dostępu. Twoja ścieżka jest wyznaczona.',
  },
  general: {
    headline: 'Odblokuj pełny dostęp',
    sub: 'Nieograniczona mądrość Oracle, wszystkie odczyty AI i premium rytuały.',
  },
};

// ── Props ─────────────────────────────────────────────────────────────────────
export interface PremiumGateModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToPaywall: () => void;
  context?: 'oracle' | 'tarot' | 'dreams' | 'numerology' | 'palm' | 'rituals' | 'general';
  previewText?: string;
  modeColor?: string;
}

// ── Main component ────────────────────────────────────────────────────────────
export const PremiumGateModal: React.FC<PremiumGateModalProps> = ({
  visible,
  onClose,
  onNavigateToPaywall,
  context = 'general',
  previewText,
  modeColor,
}) => {
  const copy = CONTEXT_COPY[context] ?? CONTEXT_COPY.general;
  const accentColor = modeColor ?? GOLD;

  // Sheet slide animation
  const sheetY = useSharedValue(SH);
  // Backdrop fade
  const backdropOpacity = useSharedValue(0);
  // Gold price pulse
  const pricePulse = useSharedValue(1);
  // CTA press scale
  const ctaScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.ease) });
      sheetY.value = withSpring(0, { damping: 18, stiffness: 120 });
      // Pulse the price number once it settles
      const timer = setTimeout(() => {
        pricePulse.value = withRepeat(
          withSequence(
            withTiming(1.06, { duration: 380, easing: Easing.out(Easing.ease) }),
            withTiming(1.0, { duration: 380, easing: Easing.in(Easing.ease) })
          ),
          3,
          false
        );
      }, 600);
      return () => clearTimeout(timer);
    } else {
      backdropOpacity.value = withTiming(0, { duration: 220 });
      sheetY.value = withTiming(SH, { duration: 300, easing: Easing.in(Easing.ease) });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const priceAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pricePulse.value }],
  }));

  const ctaAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const handleCtaPressIn = () => {
    ctaScale.value = withSpring(0.97, { damping: 18, stiffness: 260 });
  };

  const handleCtaPressOut = () => {
    ctaScale.value = withSpring(1, { damping: 18, stiffness: 260 });
  };

  const handleCtaPress = () => {
    void HapticsService.notify();
    onNavigateToPaywall();
  };

  const handleDismiss = () => {
    void HapticsService.impact('light');
    onClose();
  };

  const handleBackdropPress = () => {
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      {/* ── Sheet ─────────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.sheetWrapper, sheetStyle]} pointerEvents="box-none">
        <LinearGradient colors={SHEET_BG} style={styles.sheet} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
          {/* Top inner sheen */}
          <LinearGradient
            colors={['rgba(206,174,114,0.18)', 'transparent']}
            style={styles.sheetSheen}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
          />

          {/* Drag handle */}
          <View style={styles.dragHandle} />

          {/* ── Header zone ─────────────────────────────────────────────── */}
          <View style={styles.headerZone}>
            <Text style={styles.eyebrow}>✦ AETHERA ARCANA</Text>
            <Text style={styles.headline}>{copy.headline}</Text>
            <Text style={styles.subText}>{copy.sub}</Text>
          </View>

          {/* ── Blurred preview zone ─────────────────────────────────────── */}
          {!!previewText && (
            <View style={styles.previewZone}>
              <Text style={styles.previewText} numberOfLines={4}>
                {previewText}
              </Text>
              {/* Gradient overlay — fades text progressively */}
              <LinearGradient
                colors={['transparent', 'rgba(14,10,26,0.72)', '#0E0A1A']}
                style={styles.previewFade}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                pointerEvents="none"
              />
              <Text style={styles.ellipsisDots}>✦  ✦  ✦</Text>
            </View>
          )}

          {/* ── Mini benefits row ────────────────────────────────────────── */}
          <View style={styles.benefitsRow}>
            <BenefitPill icon={<InfinityIcon size={12} color={GOLD} />} label="Oracle bez limitu" />
            <BenefitPill icon={<Sparkles size={12} color={GOLD} />} label="Wszystkie odczyty AI" />
            <BenefitPill icon={<Moon size={12} color={GOLD} />} label="Rytuały premium" />
          </View>

          {/* ── Pricing block ─────────────────────────────────────────────── */}
          <View style={styles.pricingBlock}>
            <Text style={styles.pricingEyebrow}>ROCZNIE</Text>
            <Animated.Text style={[styles.priceMain, priceAnimStyle]}>149,99 zł</Animated.Text>
            <Text style={styles.priceSub}>tylko 12,50 zł miesięcznie · oszczędzasz 58%</Text>
            <Text style={styles.priceMonthly}>Miesięcznie: 29,99 zł</Text>
          </View>

          {/* ── Primary CTA ───────────────────────────────────────────────── */}
          <Animated.View style={[styles.ctaWrapper, ctaAnimStyle]}>
            <Pressable
              onPressIn={handleCtaPressIn}
              onPressOut={handleCtaPressOut}
              onPress={handleCtaPress}
            >
              <LinearGradient
                colors={['#D4A84B', '#CEAE72', '#B8933A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaButton}
              >
                {/* Inner shimmer line */}
                <View style={styles.ctaShimmer} pointerEvents="none" />
                <Text style={styles.ctaLabel}>ZACZNIJ 7 DNI GRATIS</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
          <Text style={styles.ctaSubNote}>Następnie 149,99 zł/rok · anuluj kiedy chcesz</Text>

          {/* ── Dismiss link ─────────────────────────────────────────────── */}
          <Pressable onPress={handleDismiss} style={styles.dismissBtn} hitSlop={14}>
            <Text style={styles.dismissText}>Może później</Text>
          </Pressable>

          {/* ── Trust row ────────────────────────────────────────────────── */}
          <View style={styles.trustRow}>
            <ShieldCheck size={14} color="rgba(255,255,255,0.38)" />
            <Text style={styles.trustText}>
              Gwarancja zwrotu przez 7 dni · Bez zobowiązań
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
};

// ── BenefitPill ───────────────────────────────────────────────────────────────
const BenefitPill: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <View style={styles.benefitPill}>
    {icon}
    <Text style={styles.benefitLabel}>{label}</Text>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const SHEET_TOP_RADIUS = 28;
const SHEET_HEIGHT = SH * 0.72;

const styles = StyleSheet.create({
  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },

  // Sheet wrapper — positioned at bottom of screen
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: SHEET_TOP_RADIUS,
    borderTopRightRadius: SHEET_TOP_RADIUS,
    paddingHorizontal: 24,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  sheetSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopLeftRadius: SHEET_TOP_RADIUS,
    borderTopRightRadius: SHEET_TOP_RADIUS,
  },

  // Drag handle
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },

  // Header
  headerZone: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 14,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 3,
    color: GOLD,
    fontWeight: '600',
    marginBottom: 10,
    opacity: 0.9,
  },
  headline: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 30,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  subText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  // Preview zone
  previewZone: {
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(206,174,114,0.18)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  previewText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.80)',
    lineHeight: 22,
    padding: 14,
    paddingBottom: 28,
  },
  previewFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  ellipsisDots: {
    fontSize: 11,
    color: GOLD,
    textAlign: 'center',
    paddingBottom: 10,
    opacity: 0.7,
    letterSpacing: 4,
  },

  // Benefits
  benefitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  benefitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(206,174,114,0.30)',
    backgroundColor: 'rgba(206,174,114,0.08)',
  },
  benefitLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },

  // Pricing
  pricingBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pricingEyebrow: {
    fontSize: 10,
    letterSpacing: 3,
    color: GOLD,
    fontWeight: '700',
    marginBottom: 6,
    opacity: 0.85,
  },
  priceMain: {
    fontSize: 32,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
    marginBottom: 4,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  priceSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.60)',
    marginBottom: 3,
  },
  priceMonthly: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.36)',
  },

  // CTA
  ctaWrapper: {
    marginBottom: 8,
  },
  ctaButton: {
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 12,
  },
  ctaShimmer: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.60)',
    borderRadius: 1,
  },
  ctaLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0E0A1A',
    letterSpacing: 1.5,
  },
  ctaSubNote: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.42)',
    textAlign: 'center',
    marginBottom: 16,
  },

  // Dismiss
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 16,
  },
  dismissText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.32)',
    fontWeight: '500',
  },

  // Trust row
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.38)',
  },
});
