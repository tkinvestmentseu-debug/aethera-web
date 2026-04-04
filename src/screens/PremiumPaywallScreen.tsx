// @ts-nocheck
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  useAnimatedProps,
  runOnJS,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Defs, RadialGradient, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Sparkles,
  Stars,
  MoonStar,
  ScrollText,
  WandSparkles,
  HeartHandshake,
  ShieldCheck,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Infinity as InfinityIcon,
  LayoutGrid,
  BrainCircuit,
  Globe,
  Headphones,
  EyeOff,
  RefreshCw,
  Clock,
  Gift,
  BadgeCheck,
  Zap,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { usePremiumStore } from '../store/usePremiumStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { CelestialBackdrop } from '../components/CelestialBackdrop';
import { NebulaSignalPanel } from '../components/NebulaSignalPanel';
import { Typography } from '../components/Typography';
import { PremiumButton } from '../components/PremiumButton';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#CEAE72';

// ─── Data ──────────────────────────────────────────────────────────────────────

const MEMBERSHIP_BENEFITS = [
  {
    icon: Sparkles,
    title: 'Głębsze sesje Oracle',
    description: 'Bardziej intymne tryby prowadzenia, wielowarstwowe odpowiedzi i bogatsze ścieżki follow-up.',
  },
  {
    icon: ScrollText,
    title: 'Rozszerzone odczyty tarota',
    description: 'Bardziej złożone spready, pełniejsze dossier interpretacji i lepsze porównanie wcześniejszych sesji.',
  },
  {
    icon: MoonStar,
    title: 'Inteligencja snów i symboli',
    description: 'Głębsze śledzenie powracających motywów, emocji i podprogowych wzorców.',
  },
  {
    icon: WandSparkles,
    title: 'Rytuały i guidance premium',
    description: 'Praktyki dopasowane do energii dnia, bardziej osobiste rekomendacje i subtelne domknięcia sesji.',
  },
];

const PLAN_OPTIONS = [
  {
    id: 'monthly' as const,
    title: 'Miesięcznie',
    price: '29,99 zł',
    cadence: 'na miesiąc',
    pricePerMonth: '29,99 zł/mies.',
    note: 'Dobre, jeśli chcesz wejść w Aetherę bez długiego zobowiązania.',
    savings: null,
  },
  {
    id: 'yearly' as const,
    title: 'Rocznie',
    price: '149,99 zł',
    cadence: 'za rok',
    pricePerMonth: '12,50 zł/mies.',
    note: 'Najlepsza wartość dla codziennej praktyki i długiej pracy z Oracle.',
    badge: 'Najczęściej wybierany',
    savings: 'Oszczędzasz 58%',
  },
  {
    id: 'lifetime' as const,
    title: 'Lifetime',
    price: '349 zł',
    cadence: 'jednorazowo',
    pricePerMonth: 'Płacisz raz, masz zawsze',
    note: 'Stały dostęp do pełnego sanktuarium, bez odnawiania i bez pośpiechu.',
    savings: 'Najlepsza inwestycja',
  },
];

const TESTIMONIALS = [
  {
    text: 'Aethera zmieniła mój poranek. Codzienne prowadzenie Oracle daje mi spokój, którego szukałam przez lata.',
    name: 'Maja K.',
    location: 'Warszawa',
    stars: 5,
    avatar: '🌙',
  },
  {
    text: 'Tarot i Matrix w jednym miejscu. Jakość odczytów AI jest niesamowita — czuję że mnie naprawdę rozumie.',
    name: 'Zofia W.',
    location: 'Kraków',
    stars: 5,
    avatar: '✨',
  },
  {
    text: 'Rytuały i afirmacje dopasowane do mojej energii. To nie jest zwykła aplikacja — to sanktuarium dla duszy.',
    name: 'Ania M.',
    location: 'Gdańsk',
    stars: 5,
    avatar: '🔮',
  },
];

const PREMIUM_FEATURES = [
  {
    icon: InfinityIcon,
    title: 'Nieograniczony Oracle',
    desc: 'Bez dziennych limitów wiadomości. Rozmawiaj z Oracle o każdej porze.',
    color: '#C084FC',
  },
  {
    icon: LayoutGrid,
    title: 'Wszystkie rozkłady tarota',
    desc: 'Celtycki Krzyż, Gwiazda, Rok Przyszły i 12+ ekskluzywnych spreadów.',
    color: '#FB923C',
  },
  {
    icon: BrainCircuit,
    title: 'Odczyty AI',
    desc: 'Głębokie analizy snów, matrycy, palmistyki i biorhytmu z pełnym kontekstem.',
    color: '#34D399',
  },
  {
    icon: Globe,
    title: 'Wszystkie Światy',
    desc: 'Pełny dostęp do wszystkich 8 ścieżek duchowych i ich zaawansowanych modułów.',
    color: '#60A5FA',
  },
  {
    icon: Headphones,
    title: 'Priorytetowe wsparcie',
    desc: 'Dedykowany kanał wsparcia i pierwszeństwo w nowych funkcjach.',
    color: '#F472B6',
  },
  {
    icon: EyeOff,
    title: 'Bez reklam',
    desc: 'Czyste, spokojne doświadczenie — żadnych przerw w praktyce duchowej.',
    color: '#A78BFA',
  },
];

const COMPARISON_ROWS = [
  { feature: 'Wiadomości Oracle', free: '3 / dzień', premium: 'Bez limitu' },
  { feature: 'Odczyty tarota', free: '1 / dzień', premium: 'Bez limitu' },
  { feature: 'Rozkłady tarota', free: '3 podstawowe', premium: 'Wszystkie 15+' },
  { feature: 'Historia & Archiwum', free: '7 dni', premium: 'Bez limitu' },
  { feature: 'Odczyty AI (sny, palma)', free: '1 / tydzień', premium: 'Bez limitu' },
  { feature: 'Ekskluzywne światy', free: '—', premium: 'Wszystkie' },
  { feature: 'Tryby Oracle premium', free: '—', premium: 'Pełne 12 trybów' },
  { feature: 'Reklamy', free: 'Tak', premium: 'Nie' },
];

const FAQ_ITEMS = [
  {
    q: 'Czy mogę anulować w dowolnym momencie?',
    a: 'Tak — subskrypcję możesz anulować w ustawieniach App Store lub Google Play w dowolnym momencie. Dostęp premium pozostaje aktywny do końca opłaconego okresu.',
  },
  {
    q: 'Co obejmuje gwarancja zwrotu pieniędzy?',
    a: 'Oferujemy 7-dniową gwarancję satysfakcji. Jeśli w ciągu pierwszych 7 dni uznasz, że Aethera Premium nie spełnia Twoich oczekiwań, skontaktuj się z nami — zwrócimy pieniądze bez pytań.',
  },
  {
    q: 'Czy plan Lifetime obejmuje przyszłe funkcje?',
    a: 'Tak. Zakup Lifetime to jednorazowa płatność dająca dostęp do wszystkich obecnych i przyszłych funkcji premium — na zawsze, bez dodatkowych opłat.',
  },
];

// ─── Animated Cosmic Orb ──────────────────────────────────────────────────────

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

const CosmicOrb = ({ accent, isLight }: { accent: string; isLight: boolean }) => {
  const ring1Rot = useSharedValue(0);
  const ring2Rot = useSharedValue(0);
  const ring3Rot = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    ring1Rot.value = withRepeat(withTiming(360, { duration: 8000 }), -1, false);
    ring2Rot.value = withRepeat(withTiming(-360, { duration: 12000 }), -1, false);
    ring3Rot.value = withRepeat(withTiming(360, { duration: 18000 }), -1, false);
    pulseScale.value = withRepeat(withSequence(
      withTiming(1.06, { duration: 2200 }),
      withTiming(1.0, { duration: 2200 }),
    ), -1, true);
    glowOpacity.value = withRepeat(withSequence(
      withTiming(0.7, { duration: 1800 }),
      withTiming(0.3, { duration: 1800 }),
    ), -1, true);
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ring1Rot.value}deg` }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ring2Rot.value}deg` }],
  }));
  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ring3Rot.value}deg` }],
  }));
  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const ORB = 90;
  const CX = ORB;
  const CY = ORB;

  return (
    <View style={{ width: ORB * 2, height: ORB * 2, alignSelf: 'center' }}>
      {/* Glow background */}
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle, {
        borderRadius: ORB,
        backgroundColor: accent + '22',
        transform: [{ scale: 1.3 }],
      }]} />

      <Svg width={ORB * 2} height={ORB * 2} viewBox={`0 0 ${ORB * 2} ${ORB * 2}`}>
        <Defs>
          <RadialGradient id="orbGrad" cx="50%" cy="40%" r="55%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <Stop offset="45%" stopColor={accent} stopOpacity="0.38" />
            <Stop offset="100%" stopColor="#5B21B6" stopOpacity="0.55" />
          </RadialGradient>
        </Defs>

        {/* Core orb */}
        <Circle cx={CX} cy={CY} r={34} fill="url(#orbGrad)" />
        <Circle cx={CX} cy={CY} r={34} stroke={accent} strokeWidth={1} fill="none" opacity={0.5} />

        {/* Inner shimmer dot */}
        <Circle cx={CX - 10} cy={CY - 10} r={5} fill="#FFFFFF" opacity={0.22} />

        {/* Ring 1 — wide ellipse */}
        <G originX={CX} originY={CY}>
          <Ellipse cx={CX} cy={CY} rx={54} ry={16} stroke={accent} strokeWidth={1.2} fill="none" opacity={0.55} strokeDasharray="6 4" />
        </G>

        {/* Ring 2 — tilted ellipse */}
        <G originX={CX} originY={CY} rotation={60} origin={`${CX},${CY}`}>
          <Ellipse cx={CX} cy={CY} rx={66} ry={18} stroke={accent} strokeWidth={0.9} fill="none" opacity={0.38} strokeDasharray="4 6" />
        </G>

        {/* Ring 3 — outer orbit */}
        <G originX={CX} originY={CY} rotation={120} origin={`${CX},${CY}`}>
          <Ellipse cx={CX} cy={CY} rx={80} ry={20} stroke={'#C084FC'} strokeWidth={0.7} fill="none" opacity={0.28} strokeDasharray="3 7" />
        </G>

        {/* Orbital dots */}
        <Circle cx={CX + 54} cy={CY} r={3} fill={accent} opacity={0.7} />
        <Circle cx={CX - 54} cy={CY} r={2} fill={accent} opacity={0.5} />
        <Circle cx={CX} cy={CY - 66} r={2.5} fill={'#C084FC'} opacity={0.6} />
        <Circle cx={CX} cy={CY + 66} r={2} fill={'#60A5FA'} opacity={0.45} />
      </Svg>

      {/* Animated rings overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, ring1Style, { alignItems: 'center', justifyContent: 'center' }]}>
        <Svg width={ORB * 2} height={ORB * 2} viewBox={`0 0 ${ORB * 2} ${ORB * 2}`}>
          <Ellipse cx={CX} cy={CY} rx={54} ry={16} stroke={accent} strokeWidth={1.5} fill="none" opacity={0.45} />
        </Svg>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, ring2Style, { alignItems: 'center', justifyContent: 'center' }]}>
        <Svg width={ORB * 2} height={ORB * 2} viewBox={`0 0 ${ORB * 2} ${ORB * 2}`}>
          <G rotation={60} origin={`${CX},${CY}`}>
            <Ellipse cx={CX} cy={CY} rx={66} ry={18} stroke={'#A78BFA'} strokeWidth={1} fill="none" opacity={0.35} />
          </G>
        </Svg>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, ring3Style, { alignItems: 'center', justifyContent: 'center' }]}>
        <Svg width={ORB * 2} height={ORB * 2} viewBox={`0 0 ${ORB * 2} ${ORB * 2}`}>
          <G rotation={120} origin={`${CX},${CY}`}>
            <Ellipse cx={CX} cy={CY} rx={80} ry={20} stroke={'#60A5FA'} strokeWidth={0.8} fill="none" opacity={0.25} />
          </G>
        </Svg>
      </Animated.View>

      {/* Pulsing core */}
      <Animated.View style={[StyleSheet.absoluteFill, coreStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: accent, opacity: 0.85 }} />
      </Animated.View>
    </View>
  );
};

// ─── Countdown Timer ──────────────────────────────────────────────────────────

const useCountdown = (durationMs: number) => {
  const [remaining, setRemaining] = useState(durationMs);
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const CountdownCard = ({ accent, isLight }: { accent: string; isLight: boolean }) => {
  const time = useCountdown(24 * 3_600_000);
  const flash = useSharedValue(1);
  useEffect(() => {
    flash.value = withRepeat(withSequence(
      withTiming(0.65, { duration: 900 }),
      withTiming(1, { duration: 900 }),
    ), -1, true);
  }, []);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  return (
    <Animated.View entering={FadeInDown.delay(60).duration(600)} style={styles.countdownCard}>
      <LinearGradient
        colors={isLight ? ['rgba(206,174,114,0.08)', 'rgba(206,174,114,0.14)'] : ['rgba(206,174,114,0.10)', 'rgba(206,174,114,0.18)']}
        style={styles.countdownGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.countdownRow}>
          <Animated.View style={flashStyle}>
            <Clock color={accent} size={16} />
          </Animated.View>
          <Typography variant="microLabel" color={accent} style={{ marginLeft: 8, letterSpacing: 1 }}>
            OFERTA SPECJALNA KOŃCZY SIĘ ZA
          </Typography>
        </View>
        <Typography style={{ fontSize: 32, fontWeight: '700', color: accent, letterSpacing: 4, marginTop: 6, textAlign: 'center' }}>
          {time}
        </Typography>
        <Typography variant="caption" style={{ textAlign: 'center', opacity: 0.7, marginTop: 4 }}>
          Roczny plan ze zniżką 58% • Tylko przez ograniczony czas
        </Typography>
      </LinearGradient>
    </Animated.View>
  );
};

// ─── Feature Showcase ─────────────────────────────────────────────────────────

const FeatureCard = ({ item, index, isLight }: { item: typeof PREMIUM_FEATURES[0]; index: number; isLight: boolean }) => {
  const Icon = item.icon;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(500)}>
    <Animated.View
      style={[animStyle, styles.featureCard, {
        backgroundColor: isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.04)',
        borderColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)',
      }]}
    >
      <TouchableOpacity
        activeOpacity={0.82}
        onPressIn={() => { scale.value = withTiming(0.96, { duration: 100 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 180 }); }}
        style={styles.featureCardInner}
      >
        <View style={[styles.featureIconWrap, { backgroundColor: item.color + '18' }]}>
          <Icon color={item.color} size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Typography variant="cardTitle" style={{ marginBottom: 4 }}>{item.title}</Typography>
          <Typography variant="bodySmall" style={{ opacity: 0.75, lineHeight: 20 }}>{item.desc}</Typography>
        </View>
      </TouchableOpacity>
    </Animated.View>
    </Animated.View>
  );
};

// ─── Comparison Table ─────────────────────────────────────────────────────────

const ComparisonTable = ({ accent, isLight }: { accent: string; isLight: boolean }) => (
  <Animated.View entering={FadeInDown.delay(100).duration(600)} style={[styles.compTable, {
    backgroundColor: isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.03)',
    borderColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)',
  }]}>
    {/* Header */}
    <View style={[styles.compRow, styles.compHeader, { borderBottomColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }]}>
      <Typography variant="microLabel" style={[styles.compCell, { flex: 2 }]} color={accent}>
        FUNKCJA
      </Typography>
      <Typography variant="microLabel" style={styles.compCell} color={isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'}>
        FREE
      </Typography>
      <Typography variant="microLabel" style={styles.compCell} color={accent}>
        PREMIUM
      </Typography>
    </View>

    {COMPARISON_ROWS.map((row, i) => (
      <View
        key={row.feature}
        style={[styles.compRow, {
          borderBottomWidth: i < COMPARISON_ROWS.length - 1 ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
        }]}
      >
        <Typography variant="bodySmall" style={[styles.compCell, { flex: 2, opacity: 0.82 }]}>
          {row.feature}
        </Typography>
        <Typography variant="bodySmall" style={[styles.compCell, { opacity: 0.5 }]}>
          {row.free}
        </Typography>
        <View style={[styles.compCell, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
          {row.premium !== '—' && <Check color={accent} size={12} />}
          <Typography variant="bodySmall" color={accent} style={{ fontSize: 12 }}>
            {row.premium}
          </Typography>
        </View>
      </View>
    ))}
  </Animated.View>
);

// ─── Testimonial Card ─────────────────────────────────────────────────────────

const TestimonialCard = ({ item, index, isLight, accent }: { item: typeof TESTIMONIALS[0]; index: number; isLight: boolean; accent: string }) => (
  <Animated.View
    entering={FadeInDown.delay(index * 100).duration(550)}
    style={[styles.testimonialCard, {
      backgroundColor: isLight ? 'rgba(206,174,114,0.06)' : 'rgba(206,174,114,0.07)',
      borderColor: isLight ? 'rgba(206,174,114,0.20)' : 'rgba(206,174,114,0.18)',
    }]}
  >
    <View style={styles.testimonialHeader}>
      <View style={[styles.testimonialAvatar, { backgroundColor: accent + '20' }]}>
        <Typography style={{ fontSize: 20 }}>{item.avatar}</Typography>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Typography variant="cardTitle" style={{ marginBottom: 1 }}>{item.name}</Typography>
        <Typography variant="caption" style={{ opacity: 0.6 }}>{item.location}</Typography>
      </View>
      <Typography style={{ color: accent, fontSize: 14, letterSpacing: 1 }}>{'★'.repeat(item.stars)}</Typography>
    </View>
    <Typography variant="bodySmall" style={{ lineHeight: 22, opacity: 0.88, fontStyle: 'italic', marginTop: 10 }}>
      "{item.text}"
    </Typography>
  </Animated.View>
);

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

const FAQItem = ({ item, accent, isLight }: { item: typeof FAQ_ITEMS[0]; accent: string; isLight: boolean }) => {
  const [open, setOpen] = useState(false);
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  const toggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    height.value = withTiming(next ? 1 : 0, { duration: 280 });
    opacity.value = withTiming(next ? 1 : 0, { duration: 220 });
    HapticsService.impact(Haptics.ImpactFeedbackStyle.Light);
  }, [open]);

  const answerStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(height.value, [0, 1], [0, 200], Extrapolate.CLAMP),
    opacity: opacity.value,
    overflow: 'hidden',
  }));

  return (
    <View style={[styles.faqItem, {
      borderColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)',
      backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
    }]}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.78} style={styles.faqQuestion}>
        <Typography variant="cardTitle" style={{ flex: 1, lineHeight: 22 }}>{item.q}</Typography>
        {open
          ? <ChevronUp color={accent} size={18} />
          : <ChevronDown color={accent} size={18} />
        }
      </TouchableOpacity>
      <Animated.View style={answerStyle}>
        <Typography variant="bodySmall" style={styles.faqAnswer}>{item.a}</Typography>
      </Animated.View>
    </View>
  );
};

// ─── Guarantee Card ───────────────────────────────────────────────────────────

const GuaranteeCard = ({ accent, isLight }: { accent: string; isLight: boolean }) => (
  <Animated.View entering={ZoomIn.delay(80).duration(500)}>
    <LinearGradient
      colors={isLight
        ? ['rgba(206,174,114,0.10)', 'rgba(206,174,114,0.06)']
        : ['rgba(206,174,114,0.13)', 'rgba(206,174,114,0.07)']}
      style={[styles.guaranteeCard, {
        borderColor: accent + '35',
      }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.guaranteeHeader}>
        <View style={[styles.guaranteeIcon, { backgroundColor: accent + '20' }]}>
          <BadgeCheck color={accent} size={24} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Typography variant="premiumLabel" color={accent}>
            7-dniowy zwrot pieniędzy
          </Typography>
          <Typography variant="bodySmall" style={{ marginTop: 6, opacity: 0.82, lineHeight: 21 }}>
            Jeśli w ciągu 7 dni od zakupu uznasz, że Aethera Premium nie jest dla Ciebie — zwrócimy Ci pieniądze bez pytań i bez formalności.
          </Typography>
        </View>
      </View>
      <View style={styles.guaranteeFooter}>
        <Gift color={accent} size={13} opacity={0.7} />
        <Typography variant="caption" style={{ marginLeft: 6, opacity: 0.7 }}>
          Bez ryzyka · Bez pytań · Pełny zwrot
        </Typography>
      </View>
    </LinearGradient>
  </Animated.View>
);

// ─── Plan Selector ────────────────────────────────────────────────────────────

const PlanSelector = ({
  selectedPlan,
  setSelectedPlan,
  accent,
  isLight,
}: {
  selectedPlan: string;
  setSelectedPlan: (id: any) => void;
  accent: string;
  isLight: boolean;
}) => {
  const ringScale = useSharedValue(1);

  const onSelect = (id: string) => {
    setSelectedPlan(id);
    ringScale.value = withSequence(withTiming(0.96, { duration: 80 }), withTiming(1, { duration: 200 }));
    HapticsService.impact(Haptics.ImpactFeedbackStyle.Light);
  };

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: ringScale.value }] }));

  return (
    <Animated.View style={ringStyle}>
      {PLAN_OPTIONS.map((plan, idx) => {
        const active = selectedPlan === plan.id;
        return (
          <Animated.View key={plan.id} entering={FadeInUp.delay(idx * 70 + 240).duration(520)}>
            <Pressable
              onPress={() => onSelect(plan.id)}
              style={({ pressed }) => ({
                padding: 18,
                marginBottom: 10,
                borderRadius: 18,
                backgroundColor: active
                  ? isLight ? accent + '14' : accent + '17'
                  : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                borderWidth: active ? 1.8 : StyleSheet.hairlineWidth,
                borderColor: active
                  ? accent + '60'
                  : isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                opacity: pressed ? 0.84 : 1,
              })}
            >
              <View style={styles.planTopRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.planRadio, {
                      borderColor: active ? accent : isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)',
                    }]}>
                      {active && <View style={[styles.planRadioDot, { backgroundColor: accent }]} />}
                    </View>
                    <Typography variant="cardTitle">{plan.title}</Typography>
                  </View>
                  <Typography variant="bodySmall" style={{ marginTop: 8, opacity: 0.75 }}>
                    {plan.note}
                  </Typography>
                </View>
                {plan.id === 'yearly' ? (
                  <View style={[styles.trialBadge]}>
                    <Typography variant="microLabel" color="#fff" style={{ fontSize: 10 }}>
                      7 DNI GRATIS
                    </Typography>
                  </View>
                ) : plan.badge ? (
                  <View style={[styles.planBadge, { backgroundColor: accent }]}>
                    <Typography variant="microLabel" color="#1A0F00" style={{ fontSize: 10 }}>
                      {plan.badge}
                    </Typography>
                  </View>
                ) : null}
              </View>

              <View style={styles.planBottomRow}>
                <View>
                  <Typography style={{ fontSize: 28, fontWeight: '700', color: active ? accent : undefined }}>
                    {plan.price}
                  </Typography>
                  <Typography variant="caption" style={{ opacity: 0.6, marginTop: 2 }}>
                    {plan.pricePerMonth}
                  </Typography>
                </View>
                {plan.savings && (
                  <View style={[styles.savingsBadge, { backgroundColor: active ? accent + '25' : 'rgba(128,128,128,0.10)' }]}>
                    <Zap color={active ? accent : (isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)')} size={12} />
                    <Typography variant="microLabel" color={active ? accent : undefined} style={{ marginLeft: 4, fontSize: 11 }}>
                      {plan.savings}
                    </Typography>
                  </View>
                )}
              </View>
            </Pressable>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const CONTEXT_HEADLINES: Record<string, { title: string; sub: string }> = {
  oracle: { title: 'Twoja Wyrocznia\nma więcej do powiedzenia', sub: 'Kontynuuj tę rozmowę bez ograniczeń.' },
  tarot: { title: 'Karty ujawniły\ncoś ważnego dla ciebie', sub: 'Pełna interpretacja czeka na odblokowanie.' },
  dreams: { title: 'Symbol twojego snu\nczeka na analizę', sub: 'Jungowska głębia dostępna bez limitu.' },
  numerology: { title: 'Twój kod liczbowy\njest gotowy', sub: 'Pełna matryca i jej interpretacja.' },
  palm: { title: 'Twoje linie dłoni\nmają historię do opowiedzenia', sub: 'Palmistyczna analiza bez ograniczeń.' },
  general: { title: 'Aethera Arcana\nPełna mądrość bez granic', sub: 'Nieograniczony dostęp do Oracle, Tarota i wszystkich odczytów AI.' },
};

export const PremiumPaywallScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const context: string = route?.params?.context || 'general';
  const headlineData = CONTEXT_HEADLINES[context] || CONTEXT_HEADLINES.general;

  const { themeName } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');
  const { unlockPremium, startTrial, restorePurchases, usage } = usePremiumStore();
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  const [restoreMessage, setRestoreMessage] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const freeTierSignals = useMemo(() => [
    `Dziś wykorzystano ${usage.oracleMessagesToday}/3 darmowych wiadomości Oracle`,
    `Dziś wykonano ${usage.tarotReadingsToday}/1 darmowy odczyt tarota`,
    'Biblioteka zapisanych wglądów i głębsze warstwy guidance pozostają częścią członkostwa premium',
  ], [usage]);

  const handleSubscribe = (plan: 'monthly' | 'yearly' | 'lifetime') => {
    void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
    setRestoreMessage('');
    if (plan === 'yearly') {
      startTrial();
    } else {
      unlockPremium(plan);
    }
    navigation.goBack();
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    void HapticsService.impact(Haptics.ImpactFeedbackStyle.Medium);
    const success = await restorePurchases();
    setIsRestoring(false);

    if (success) {
      void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
      setRestoreMessage('Odnaleziono aktywne członkostwo i przywrócono dostęp premium.');
      navigation.goBack();
      return;
    }

    void HapticsService.notify(Haptics.NotificationFeedbackType.Warning);
    setRestoreMessage('Nie znaleziono aktywnego członkostwa. Jeśli korzystasz z innego konta sklepu, spróbuj ponownie z właściwego profilu.');
  };

  const selectedPlanData = PLAN_OPTIONS.find(p => p.id === selectedPlan);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <CelestialBackdrop intensity="immersive" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={16}>
            <ChevronLeft color={currentTheme.primary} size={24} />
          </Pressable>
          <Typography variant="premiumLabel" color={currentTheme.primary}>
            Aethera Premium
          </Typography>
          <Pressable onPress={handleRestore} style={styles.headerBtn} disabled={isRestoring}>
            {isRestoring ? (
              <ActivityIndicator size="small" color={currentTheme.primary} />
            ) : (
              <Typography variant="microLabel" color={currentTheme.primary}>
                Przywróć
              </Typography>
            )}
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Animated Hero Orb ── */}
          <Animated.View entering={FadeIn.duration(900)} style={styles.heroWrap}>
            <CosmicOrb accent={ACCENT} isLight={isLight} />
            <Typography variant="editorialHeader" align="center" style={{ marginTop: 22 }}>
              {headlineData.title}
            </Typography>
            <Typography variant="bodyRefined" align="center" style={styles.heroCopy}>
              {headlineData.sub}
            </Typography>
          </Animated.View>

          {/* ── Countdown Timer ── */}
          <CountdownCard accent={ACCENT} isLight={isLight} />

          {/* ── Usage signals ── */}
          <Animated.View entering={FadeInDown.delay(80).duration(700)}>
            <NebulaSignalPanel
              accent={currentTheme.primary}
              eyebrow="Premium Signal Deck"
              title="Członkostwo jako prywatne sanktuarium premium"
              description="Ta warstwa nie zastępuje obecnych funkcji. Dokłada głębszy kontekst, bardziej osobiste guidance i pełniejszą pamięć Twojej praktyki."
              stats={[
                { label: 'Oracle', value: `${usage.oracleMessagesToday}/3 free` },
                { label: 'Tarot', value: `${usage.tarotReadingsToday}/1 free` },
                { label: 'Plan', value: selectedPlanData?.title || 'Rocznie' },
                { label: 'Tryb', value: 'Deep access' },
              ]}
            />
          </Animated.View>

          {/* ── Free tier signals ── */}
          <Animated.View entering={FadeInDown.delay(120).duration(700)}>
            <View style={[styles.signalsCard, {
              borderLeftColor: currentTheme.primary,
              backgroundColor: isLight ? currentTheme.primary + '08' : currentTheme.primary + '0A',
            }]}>
              <Typography variant="premiumLabel" color={currentTheme.primary}>
                Co zmienia członkostwo
              </Typography>
              {freeTierSignals.map((signal) => (
                <View key={signal} style={styles.signalRow}>
                  <ShieldCheck color={currentTheme.primary} size={15} />
                  <Typography variant="bodySmall" style={styles.signalCopy}>{signal}</Typography>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── Restore message ── */}
          {restoreMessage ? (
            <View style={styles.restoreMsg}>
              <Typography variant="bodySmall" style={{ lineHeight: 22 }}>{restoreMessage}</Typography>
            </View>
          ) : null}

          {/* ── Premium Feature Showcase ── */}
          <View style={styles.sectionSpacing}>
            <Animated.View entering={FadeInDown.delay(60).duration(500)} style={styles.sectionHeader}>
              <Sparkles color={ACCENT} size={15} />
              <Typography variant="premiumLabel" color={ACCENT} style={{ marginLeft: 8 }}>
                CO DOSTAJESZ Z PREMIUM
              </Typography>
            </Animated.View>
            {PREMIUM_FEATURES.map((item, index) => (
              <FeatureCard key={item.title} item={item} index={index} isLight={isLight} />
            ))}
          </View>

          {/* ── Comparison Table ── */}
          <View style={styles.sectionSpacing}>
            <Animated.View entering={FadeInDown.delay(60).duration(500)} style={styles.sectionHeader}>
              <LayoutGrid color={ACCENT} size={15} />
              <Typography variant="premiumLabel" color={ACCENT} style={{ marginLeft: 8 }}>
                FREE VS PREMIUM
              </Typography>
            </Animated.View>
            <ComparisonTable accent={ACCENT} isLight={isLight} />
          </View>

          {/* ── Membership Benefits ── */}
          <Animated.View entering={FadeInUp.delay(180).duration(700)} style={[styles.benefitsCard, {
            borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
          }]}>
            {MEMBERSHIP_BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <View
                  key={benefit.title}
                  style={[styles.benefitRow, {
                    borderBottomWidth: index < MEMBERSHIP_BENEFITS.length - 1 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)',
                    backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                  }]}
                >
                  <View style={styles.benefitHeader}>
                    <View style={[styles.benefitIcon, { backgroundColor: currentTheme.primary + '15' }]}>
                      <Icon color={currentTheme.primary} size={18} />
                    </View>
                    <Typography variant="cardTitle" style={{ flex: 1 }}>{benefit.title}</Typography>
                  </View>
                  <Typography variant="bodySmall" style={styles.benefitCopy}>{benefit.description}</Typography>
                </View>
              );
            })}
          </Animated.View>

          {/* ── Plan Selector ── */}
          <View style={styles.sectionSpacing}>
            <Animated.View entering={FadeInDown.delay(60).duration(500)} style={styles.sectionHeader}>
              <Stars color={ACCENT} size={15} />
              <Typography variant="premiumLabel" color={ACCENT} style={{ marginLeft: 8 }}>
                WYBIERZ PLAN
              </Typography>
            </Animated.View>
            <PlanSelector
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              accent={ACCENT}
              isLight={isLight}
            />
          </View>

          {/* ── Included items list ── */}
          <View style={[styles.includedCard, {
            backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
            borderColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)',
          }]}>
            <Typography variant="premiumLabel" color={currentTheme.primary}>W środku otrzymujesz</Typography>
            {[
              'Więcej trybów Oracle i bardziej intymne prowadzenie',
              'Rozszerzone rozkłady tarota i głębsze dossier interpretacji',
              'Mocniejszą inteligencję archiwum snów, wpisów i wglądów',
              'Bardziej osobiste rekomendacje rytuałów, afirmacji i guidance',
            ].map((item) => (
              <View key={item} style={styles.comparisonRow}>
                <Check color={currentTheme.primary} size={14} />
                <Typography variant="bodySmall" style={styles.comparisonCopy}>{item}</Typography>
              </View>
            ))}
          </View>

          {/* ── Guarantee ── */}
          <View style={styles.sectionSpacing}>
            <Animated.View entering={FadeInDown.delay(60).duration(500)} style={styles.sectionHeader}>
              <BadgeCheck color={ACCENT} size={15} />
              <Typography variant="premiumLabel" color={ACCENT} style={{ marginLeft: 8 }}>
                GWARANCJA
              </Typography>
            </Animated.View>
            <GuaranteeCard accent={ACCENT} isLight={isLight} />
          </View>

          {/* ── Testimonials ── */}
          <View style={styles.sectionSpacing}>
            <Animated.View entering={FadeInDown.delay(60).duration(500)} style={styles.sectionHeader}>
              <HeartHandshake color={ACCENT} size={15} />
              <Typography variant="premiumLabel" color={ACCENT} style={{ marginLeft: 8 }}>
                CO MÓWIĄ UŻYTKOWNICY
              </Typography>
            </Animated.View>
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} item={t} index={i} isLight={isLight} accent={ACCENT} />
            ))}
          </View>

          {/* ── FAQ ── */}
          <View style={styles.sectionSpacing}>
            <Animated.View entering={FadeInDown.delay(60).duration(500)} style={styles.sectionHeader}>
              <WandSparkles color={ACCENT} size={15} />
              <Typography variant="premiumLabel" color={ACCENT} style={{ marginLeft: 8 }}>
                CZĘSTO ZADAWANE PYTANIA
              </Typography>
            </Animated.View>
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.q} item={item} accent={ACCENT} isLight={isLight} />
            ))}
          </View>

          {/* ── CTA ── */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.ctaSection}>
            <PremiumButton
              label={selectedPlan === 'yearly' ? 'ZACZNIJ 7 DNI GRATIS' : 'SUBSKRYBUJ MIESIĘCZNIE'}
              onPress={() => handleSubscribe(selectedPlan)}
              style={{ marginTop: 4 }}
            />
            <Typography variant="caption" style={{ textAlign: 'center', marginTop: 6, opacity: 0.6 }}>
              {selectedPlan === 'yearly'
                ? `Następnie ${selectedPlanData?.price} / rok · Anuluj kiedy chcesz`
                : `Następnie ${selectedPlanData?.price} · Anuluj kiedy chcesz`}
            </Typography>
            <PremiumButton
              label="Na razie zostaję przy wersji podstawowej"
              onPress={() => navigation.goBack()}
              variant="secondary"
              style={{ marginTop: 12 }}
            />
          </Animated.View>

          {/* ── Restore purchases link ── */}
          <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.restoreRow}>
            <RefreshCw color={isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'} size={13} />
            <TouchableOpacity onPress={handleRestore} disabled={isRestoring} style={{ marginLeft: 7 }}>
              <Typography variant="caption" style={{ opacity: 0.55, textDecorationLine: 'underline' }}>
                Przywróć zakupy
              </Typography>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Footer copy ── */}
          <View style={styles.footerCopy}>
            <HeartHandshake color={currentTheme.primary} size={16} />
            <Typography variant="caption" style={{ marginLeft: 10, flex: 1, lineHeight: 20 }}>
              Członkostwo ma pogłębiać doświadczenie, nie wywierać presji. Wejdź w premium wtedy, gdy chcesz, by Aethera stała się bardziej osobistą praktyką.
            </Typography>
          </View>

          <View style={{ height: 40 }} />
          <EndOfContentSpacer size="compact" />
        </ScrollView>

        {/* ── Floating bottom CTA (scroll-aware, always visible) ── */}
        <View style={[styles.floatingCta, {
          backgroundColor: isLight ? 'rgba(250,248,244,0.96)' : 'rgba(9,7,18,0.96)',
          borderTopColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)',
        }]}>
          <TouchableOpacity
            onPress={() => handleSubscribe(selectedPlan)}
            activeOpacity={0.88}
            style={[styles.floatingCtaBtn, { backgroundColor: ACCENT }]}
          >
            <Sparkles color="#1A0F00" size={16} />
            <Typography style={{ color: '#1A0F00', fontWeight: '700', fontSize: 15, marginLeft: 8 }}>
              {selectedPlan === 'yearly' ? 'ZACZNIJ 7 DNI GRATIS' : `Aktywuj Premium · ${selectedPlanData?.price ?? ''}`}
            </Typography>
          </TouchableOpacity>
          <Typography variant="caption" style={{ textAlign: 'center', marginTop: 6, opacity: 0.5 }}>
            {selectedPlan === 'yearly'
              ? `Następnie ${selectedPlanData?.price ?? '149,99 zł'} / rok · Anuluj kiedy chcesz`
              : 'Anuluj w dowolnym momencie · 7-dniowy zwrot pieniędzy'}
          </Typography>
        </View>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.padding.screen,
    height: 64,
  },
  headerBtn: {
    width: 64,
    minHeight: 36,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: layout.padding.screen,
    paddingBottom: 160,
  },
  heroWrap: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 22,
  },
  heroCopy: {
    marginTop: 14,
    maxWidth: 340,
    opacity: 0.84,
    lineHeight: 26,
  },
  // Countdown
  countdownCard: {
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ACCENT + '35',
  },
  countdownGrad: {
    padding: 18,
    borderRadius: 18,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Signals
  signalsCard: {
    padding: 20,
    marginBottom: 14,
    borderRadius: 16,
    borderLeftWidth: 3,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
  },
  signalCopy: {
    marginLeft: 10,
    flex: 1,
    lineHeight: 22,
    opacity: 0.82,
  },
  restoreMsg: {
    padding: 16,
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,165,0,0.09)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,165,0,0.28)',
  },
  // Section
  sectionSpacing: {
    marginTop: 8,
    marginBottom: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  // Feature cards
  featureCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
    overflow: 'hidden',
  },
  featureCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 14,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Comparison table
  compTable: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  compHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  compCell: {
    flex: 1,
    fontSize: 12,
  },
  // Benefits
  benefitsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  benefitRow: {
    padding: 18,
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitCopy: {
    marginTop: 12,
    lineHeight: 22,
    opacity: 0.8,
  },
  // Plan selector
  planTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  planRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  planBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 10,
    alignSelf: 'flex-start',
  },
  trialBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#22C55E',
  },
  planBottomRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  // Included card
  includedCard: {
    padding: 18,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
  },
  comparisonCopy: {
    marginLeft: 10,
    flex: 1,
    lineHeight: 22,
    opacity: 0.82,
  },
  // Guarantee
  guaranteeCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  guaranteeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  guaranteeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guaranteeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ACCENT + '25',
  },
  // Testimonials
  testimonialCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testimonialAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // FAQ
  faqItem: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    lineHeight: 22,
    opacity: 0.80,
  },
  // CTA
  ctaSection: {
    marginTop: 12,
    marginBottom: 4,
  },
  restoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  footerCopy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 18,
  },
  // Floating CTA
  floatingCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: layout.padding.screen,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  floatingCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 24,
  },
});
