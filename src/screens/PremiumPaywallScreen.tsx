// @ts-nocheck
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Dimensions, Pressable, ScrollView, StyleSheet,
  Text, View, Animated as RNAnimated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, withDelay,
  Easing, interpolate, Extrapolate, ZoomIn,
} from 'react-native-reanimated';
import Svg, {
  Circle, Defs, RadialGradient, Stop,
  LinearGradient as SvgLinearGradient, Ellipse, G, Path,
} from 'react-native-svg';
import {
  ChevronLeft, Check, X, Crown, Sparkles, Infinity as InfinityIcon,
  Zap, Moon, Star, Shield, BookOpen, MessageCircle,
  HeartHandshake, Music, BrainCircuit, LayoutGrid, Clock,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { usePremiumStore } from '../store/usePremiumStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { HapticsService } from '../core/services/haptics.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Plan data ────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'free',
    name: 'Wolny',
    subtitle: 'Zacznij duchową podróż',
    emoji: '🌙',
    price: 'Bezpłatnie',
    priceSub: 'na zawsze',
    gradient: ['#1A1128', '#251840', '#1A1128'],
    accent: '#A78BFA',
    borderGlow: 'rgba(167,139,250,0.25)',
    badge: null,
    features: [
      { text: '3 pytania Oracle dziennie', ok: true },
      { text: '1 odczyt Tarota dziennie', ok: true },
      { text: 'Horoskop dzienny', ok: true },
      { text: 'Podstawowe medytacje', ok: true },
      { text: 'Dostęp do wspólnoty', ok: true },
      { text: 'Głęboki Oracle bez limitów', ok: false },
      { text: 'Analiza snów AI', ok: false },
      { text: 'Rytuały premium', ok: false },
      { text: 'Matryca przeznaczenia AI', ok: false },
    ],
  },
  {
    id: 'soul',
    name: 'Dusza',
    subtitle: 'Dla oddanej praktyki',
    emoji: '✨',
    price: '59,99 zł',
    priceSub: 'miesięcznie',
    gradient: ['#1C0F3A', '#2D1B6B', '#1C0F3A'],
    accent: '#C4B5FD',
    borderGlow: 'rgba(196,181,253,0.45)',
    badge: 'Popularny',
    badgeColor: '#C4B5FD',
    features: [
      { text: '15 pytań Oracle dziennie', ok: true },
      { text: 'Tarot bez limitu', ok: true },
      { text: 'Analiza snów AI', ok: true },
      { text: 'Rytuały premium + Księżycowe', ok: true },
      { text: 'Sound Bath & Binauralne', ok: true },
      { text: 'Matryca przeznaczenia AI', ok: true },
      { text: 'Historia i pamięć Oracle', ok: true },
      { text: 'Oracle bez limitów', ok: false },
      { text: 'Odczyty partnerskie zaawansowane', ok: false },
    ],
  },
  {
    id: 'master',
    name: 'Mistrz',
    subtitle: 'Pełne sanktuarium duszy',
    emoji: '👑',
    price: '499 zł',
    priceSub: 'rocznie · 41,58 zł/mies.',
    gradient: ['#1F140A', '#3D2408', '#1F140A'],
    accent: '#CEAE72',
    borderGlow: 'rgba(206,174,114,0.55)',
    badge: 'Najlepsza wartość',
    badgeColor: '#CEAE72',
    savings: 'Oszczędzasz 31%',
    features: [
      { text: 'Oracle bez limitów', ok: true },
      { text: 'Wszystkie funkcje Duszy', ok: true },
      { text: 'Zaawansowana Matryca + Numerologia', ok: true },
      { text: 'Odczyty partnerskie zaawansowane', ok: true },
      { text: 'Horoskop roczny AI', ok: true },
      { text: 'Wczesny dostęp do nowych funkcji', ok: true },
      { text: 'Priorytetowe wsparcie', ok: true },
      { text: 'Eksport dziennika PDF', ok: true },
      { text: 'Personalizowane rytuały AI', ok: true },
    ],
  },
] as const;

// ─── Animated background ──────────────────────────────────────────────────────

const CosmicBackground = React.memo(() => {
  const rot1 = useSharedValue(0);
  const rot2 = useSharedValue(0);
  const rot3 = useSharedValue(0);
  const pulse = useSharedValue(0.6);

  useEffect(() => {
    rot1.value = withRepeat(withTiming(360, { duration: 22000, easing: Easing.linear }), -1, false);
    rot2.value = withRepeat(withTiming(-360, { duration: 34000, easing: Easing.linear }), -1, false);
    rot3.value = withRepeat(withTiming(360, { duration: 48000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withSequence(
      withTiming(1.0, { duration: 3000 }),
      withTiming(0.4, { duration: 3000 }),
    ), -1, true);
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rot1.value}deg` }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rot2.value}deg` }],
  }));
  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rot3.value}deg` }],
  }));
  const coreStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: interpolate(pulse.value, [0.4, 1.0], [0.92, 1.08]) }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#060312', '#0D0822', '#140B30', '#0D0822', '#060312']}
        style={StyleSheet.absoluteFill}
      />
      {/* Core nebula glow */}
      <Animated.View style={[{ position: 'absolute', top: SH * 0.08, left: SW / 2 - 140, width: 280, height: 280, borderRadius: 140 }, coreStyle]}>
        <Svg width={280} height={280}>
          <Defs>
            <RadialGradient id="core" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
              <Stop offset="50%" stopColor="#6D28D9" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#4C1D95" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={140} cy={140} r={140} fill="url(#core)" />
        </Svg>
      </Animated.View>
      {/* Gold accent glow bottom */}
      <View style={{ position: 'absolute', bottom: SH * 0.1, right: SW * 0.1, width: 200, height: 200, borderRadius: 100 }}>
        <Svg width={200} height={200}>
          <Defs>
            <RadialGradient id="gold" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#CEAE72" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#CEAE72" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={100} cy={100} r={100} fill="url(#gold)" />
        </Svg>
      </View>
      {/* Rotating rings */}
      <View style={{ position: 'absolute', top: SH * 0.06, left: SW / 2 - 150, width: 300, height: 300 }}>
        <Animated.View style={[{ width: 300, height: 300, alignItems: 'center', justifyContent: 'center' }, ring1Style]}>
          <Svg width={300} height={300}>
            <Ellipse cx={150} cy={150} rx={145} ry={60} stroke="rgba(167,139,250,0.18)" strokeWidth={1} fill="none" />
          </Svg>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring2Style]}>
          <Svg width={300} height={300}>
            <Ellipse cx={150} cy={150} rx={120} ry={48} stroke="rgba(206,174,114,0.14)" strokeWidth={1} fill="none" />
          </Svg>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring3Style]}>
          <Svg width={300} height={300}>
            <Ellipse cx={150} cy={150} rx={100} ry={38} stroke="rgba(196,181,253,0.10)" strokeWidth={0.8} fill="none" />
          </Svg>
        </Animated.View>
      </View>
      {/* Star dots */}
      {[
        { x: SW * 0.1, y: SH * 0.12, r: 1.2, op: 0.7, color: '#C4B5FD' },
        { x: SW * 0.85, y: SH * 0.08, r: 1.5, op: 0.8, color: '#CEAE72' },
        { x: SW * 0.25, y: SH * 0.35, r: 1, op: 0.5, color: '#A78BFA' },
        { x: SW * 0.9, y: SH * 0.3, r: 1.2, op: 0.6, color: '#C4B5FD' },
        { x: SW * 0.05, y: SH * 0.6, r: 1, op: 0.4, color: '#CEAE72' },
        { x: SW * 0.95, y: SH * 0.55, r: 1.5, op: 0.7, color: '#A78BFA' },
        { x: SW * 0.4, y: SH * 0.15, r: 1, op: 0.6, color: '#CEAE72' },
        { x: SW * 0.7, y: SH * 0.45, r: 1.2, op: 0.5, color: '#C4B5FD' },
        { x: SW * 0.15, y: SH * 0.75, r: 1, op: 0.45, color: '#A78BFA' },
        { x: SW * 0.8, y: SH * 0.82, r: 1.5, op: 0.6, color: '#CEAE72' },
        { x: SW * 0.5, y: SH * 0.92, r: 1, op: 0.4, color: '#C4B5FD' },
        { x: SW * 0.35, y: SH * 0.68, r: 1.2, op: 0.55, color: '#A78BFA' },
      ].map((s, i) => (
        <View key={i} style={{
          position: 'absolute', left: s.x, top: s.y,
          width: s.r * 2, height: s.r * 2, borderRadius: s.r,
          backgroundColor: s.color, opacity: s.op,
        }} />
      ))}
    </View>
  );
});

// ─── Crown hero ───────────────────────────────────────────────────────────────

const CrownHero = React.memo(() => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(withSequence(
      withTiming(1.07, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      withTiming(1.0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
    ), -1, true);
    glow.value = withRepeat(withSequence(
      withTiming(1.0, { duration: 2500 }),
      withTiming(0.3, { duration: 2500 }),
    ), -1, true);
  }, []);

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={{ alignItems: 'center', paddingTop: 20, paddingBottom: 8 }}>
      <View style={{ position: 'relative', width: 100, height: 100, alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer glow rings */}
        <Animated.View style={[{
          position: 'absolute', width: 100, height: 100, borderRadius: 50,
          backgroundColor: 'transparent', borderWidth: 1,
          borderColor: 'rgba(206,174,114,0.2)',
        }, glowStyle]} />
        <Animated.View style={[{
          position: 'absolute', width: 80, height: 80, borderRadius: 40,
          backgroundColor: 'rgba(206,174,114,0.08)',
        }, glowStyle]} />
        {/* Crown */}
        <Animated.View style={[{
          width: 70, height: 70, borderRadius: 35,
          backgroundColor: 'rgba(206,174,114,0.12)',
          borderWidth: 1.5, borderColor: 'rgba(206,174,114,0.45)',
          alignItems: 'center', justifyContent: 'center',
        }, crownStyle]}>
          <Crown size={34} color="#CEAE72" strokeWidth={1.5} />
        </Animated.View>
      </View>
      <Animated.Text entering={FadeInDown.delay(300).duration(600)} style={{
        fontFamily: 'Cinzel-Bold', fontSize: 28, fontWeight: '800',
        color: '#F5EDD8', letterSpacing: 3, marginTop: 16, textAlign: 'center',
      }}>
        AETHERA PREMIUM
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(500).duration(600)} style={{
        fontSize: 15, color: 'rgba(196,181,253,0.75)', textAlign: 'center',
        marginTop: 6, letterSpacing: 0.3, lineHeight: 22, paddingHorizontal: 32,
      }}>
        Wybierz swój plan duchowego wzrostu
      </Animated.Text>
    </View>
  );
});

// ─── Plan card ────────────────────────────────────────────────────────────────

const PlanCard = React.memo(({
  plan, selected, onSelect, index,
}: {
  plan: typeof PLANS[number];
  selected: boolean;
  onSelect: () => void;
  index: number;
}) => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    glow.value = withTiming(selected ? 1 : 0, { duration: 350 });
    if (selected) {
      scale.value = withSequence(
        withTiming(0.96, { duration: 100 }),
        withTiming(1.03, { duration: 200 }),
        withTiming(1, { duration: 150 }),
      );
    }
  }, [selected]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: interpolate(glow.value, [0, 1], [0, 0.45]),
    shadowRadius: interpolate(glow.value, [0, 1], [0, 20]),
  }));
  const borderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.25, 1]),
  }));

  const isPremium = plan.id === 'master';
  const isSoul = plan.id === 'soul';

  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 120).duration(600)} style={{ marginBottom: 14 }}>
      <Pressable onPress={onSelect}>
        <Animated.View style={[{
          borderRadius: 22,
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? plan.accent : plan.borderGlow,
          overflow: 'hidden',
          shadowColor: plan.accent,
          shadowOffset: { width: 0, height: 8 },
          elevation: selected ? 12 : 4,
        }, cardStyle]}>
          <LinearGradient
            colors={selected
              ? (isPremium ? ['#2A1A06', '#4A2E0A', '#2A1A06'] as any
                : isSoul ? ['#1E0E48', '#341875', '#1E0E48'] as any
                : ['#1E1240', '#2D1B6B', '#1E1240'] as any)
              : plan.gradient as any}
            style={{ padding: 20 }}
          >
            {/* Badge */}
            {plan.badge && (
              <View style={{
                position: 'absolute', top: 14, right: 14,
                backgroundColor: plan.accent + '22',
                borderWidth: 1, borderColor: plan.accent + '66',
                borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
              }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: plan.accent, letterSpacing: 0.5 }}>
                  {plan.badge}
                </Text>
              </View>
            )}

            {/* Header — extra top padding when badge is present so badge doesn't overlap price */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14,
              marginTop: plan.badge ? 28 : 0,
            }}>
              <View style={{
                width: 48, height: 48, borderRadius: 24,
                backgroundColor: plan.accent + '18',
                borderWidth: 1, borderColor: plan.accent + '44',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 24 }}>{plan.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#F5EDD8', letterSpacing: 1 }}>
                  {plan.name}
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(196,181,253,0.6)', marginTop: 1 }}>
                  {plan.subtitle}
                </Text>
              </View>
              {/* Price — constrained column so it never overlaps the plan title */}
              <View style={{ alignItems: 'flex-end', flexShrink: 1, maxWidth: '42%' }}>
                <Text
                  style={{ fontSize: 18, fontWeight: '800', color: plan.accent }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {plan.price}
                </Text>
                <Text
                  style={{ fontSize: 10, color: 'rgba(196,181,253,0.55)', textAlign: 'right' }}
                  numberOfLines={2}
                >
                  {plan.priceSub}
                </Text>
                {plan.savings && (
                  <View style={{
                    marginTop: 3, backgroundColor: plan.accent + '28',
                    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: plan.accent }}>
                      {plan.savings}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: plan.accent + '22', marginBottom: 14 }} />

            {/* Features */}
            <View style={{ gap: 8 }}>
              {plan.features.map((f, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {f.ok ? (
                    <View style={{
                      width: 18, height: 18, borderRadius: 9,
                      backgroundColor: plan.accent + '28',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Check size={11} color={plan.accent} strokeWidth={2.5} />
                    </View>
                  ) : (
                    <View style={{
                      width: 18, height: 18, borderRadius: 9,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <X size={10} color="rgba(255,255,255,0.2)" strokeWidth={2} />
                    </View>
                  )}
                  <Text style={{
                    fontSize: 13, flex: 1, lineHeight: 18,
                    color: f.ok ? 'rgba(240,235,248,0.9)' : 'rgba(255,255,255,0.25)',
                    textDecorationLine: f.ok ? 'none' : 'line-through',
                  }}>
                    {f.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Selection indicator */}
            {selected && (
              <Animated.View entering={ZoomIn.duration(300)} style={{
                marginTop: 16, paddingVertical: 12, borderRadius: 14,
                backgroundColor: plan.accent + '18',
                borderWidth: 1, borderColor: plan.accent + '55',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: plan.accent, letterSpacing: 0.5 }}>
                  ✦ {plan.id === 'free' ? 'Plan aktywny' : 'Wybrany plan'}
                </Text>
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

// ─── Testimonial ──────────────────────────────────────────────────────────────

const Testimonial = React.memo(({ item, index }: { item: any; index: number }) => (
  <Animated.View entering={FadeInDown.delay(100 + index * 100).duration(500)} style={{
    width: SW * 0.7, marginRight: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(196,181,253,0.15)',
    borderRadius: 18, padding: 18,
  }}>
    <Text style={{ fontSize: 13, color: 'rgba(240,235,248,0.75)', lineHeight: 19, marginBottom: 12, fontStyle: 'italic' }}>
      „{item.text}"
    </Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ fontSize: 22 }}>{item.avatar}</Text>
      <View>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#C4B5FD' }}>{item.name}</Text>
        <Text style={{ fontSize: 11, color: 'rgba(196,181,253,0.5)' }}>{item.location}</Text>
      </View>
      <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: 2 }}>
        {Array(5).fill(0).map((_, i) => (
          <Star key={i} size={11} color="#CEAE72" fill="#CEAE72" />
        ))}
      </View>
    </View>
  </Animated.View>
));

// ─── Main screen ──────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { text: 'Aethera zmieniła mój poranek. Codzienne Oracle daje spokój, którego szukałam latami.', name: 'Maja K.', location: 'Warszawa', avatar: '🌙' },
  { text: 'Tarot i Matrix w jednym. Jakość odczytów AI jest niesamowita — naprawdę mnie rozumie.', name: 'Zofia W.', location: 'Kraków', avatar: '✨' },
  { text: 'Rytuały i afirmacje dopasowane do mojej energii. To sanktuarium dla duszy, nie zwykła aplikacja.', name: 'Ania M.', location: 'Gdańsk', avatar: '🔮' },
  { text: 'Plan roczny Mistrz — 499 zł za cały rok. Mniej niż kawa tygodniowo, a wartość nieporównywalna.', name: 'Kasia R.', location: 'Wrocław', avatar: '👑' },
];

export const PremiumPaywallScreen = ({ navigation }: any) => {
    const themeName = useAppStore(s => s.currentTheme);
  const { isPremium, subscriptionPlan, unlockPremium } = usePremiumStore();
  const [selectedPlan, setSelectedPlan] = useState<string>(isPremium ? (subscriptionPlan ?? 'free') : 'master');

  const handleSelect = useCallback((id: string) => {
    HapticsService.selection();
    setSelectedPlan(id);
  }, []);

  const handleCTA = useCallback(() => {
    if (selectedPlan === 'free') return;
    HapticsService.impact('medium');
    // In production: launch in-app purchase flow here
    // For now simulate unlock
    unlockPremium(selectedPlan === 'soul' ? 'monthly' : 'yearly');
    navigation.goBack();
  }, [selectedPlan, unlockPremium, navigation]);

  const ctaLabel = selectedPlan === 'free'
    ? 'Twój obecny plan'
    : selectedPlan === 'soul'
    ? 'Rozpocznij plan Dusza — 59,99 zł/mies.'
    : 'Rozpocznij plan Mistrz — 499 zł/rok';

  const ctaAccent = selectedPlan === 'soul' ? '#C4B5FD' : '#CEAE72';

  return (
    <View style={StyleSheet.absoluteFill}>
      <CosmicBackground />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Back button */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            position: 'absolute', top: 12, left: 16, zIndex: 10,
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronLeft size={22} color="rgba(240,235,248,0.8)" strokeWidth={1.8} />
        </Pressable>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 }}
        >
          {/* Hero */}
          <CrownHero />

          {/* Plans */}
          <View style={{ marginTop: 20 }}>
            {PLANS.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={selectedPlan === plan.id}
                onSelect={() => handleSelect(plan.id)}
                index={index}
              />
            ))}
          </View>

          {/* CTA Button */}
          {selectedPlan !== 'free' && (
            <Animated.View entering={FadeInUp.duration(500)} style={{ marginTop: 6, marginBottom: 24 }}>
              <Pressable onPress={handleCTA}>
                <LinearGradient
                  colors={selectedPlan === 'soul'
                    ? ['#6D28D9', '#8B5CF6', '#C4B5FD'] as any
                    : ['#92701A', '#CEAE72', '#E8C87A'] as any}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 18, borderRadius: 18,
                    alignItems: 'center', justifyContent: 'center',
                    shadowColor: ctaAccent, shadowOpacity: 0.5,
                    shadowRadius: 18, shadowOffset: { width: 0, height: 6 },
                    elevation: 12,
                  }}
                >
                  <Text style={{
                    fontSize: 15, fontWeight: '800', color: '#060312',
                    letterSpacing: 0.3, textAlign: 'center', paddingHorizontal: 16,
                  }}>
                    {ctaLabel}
                  </Text>
                </LinearGradient>
              </Pressable>
              <Text style={{
                textAlign: 'center', marginTop: 10,
                fontSize: 12, color: 'rgba(196,181,253,0.45)', lineHeight: 17,
              }}>
                Możesz anulować w dowolnym momencie.{'\n'}
                Przechowywane bezpiecznie przez Google Play / App Store.
              </Text>
            </Animated.View>
          )}

          {/* Why premium */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)} style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 11, fontWeight: '700', letterSpacing: 3, color: '#CEAE72',
              textAlign: 'center', marginBottom: 20,
            }}>
              DLACZEGO WARTO
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {[
                { icon: InfinityIcon, label: 'Nielimitowany Oracle', color: '#C084FC' },
                { icon: Moon, label: 'Rytuały Księżycowe', color: '#818CF8' },
                { icon: BrainCircuit, label: 'AI analizuje sny', color: '#6EE7B7' },
                { icon: Star, label: 'Matryca Przeznaczenia', color: '#CEAE72' },
                { icon: Music, label: 'Sound Bath & Binauralne', color: '#60A5FA' },
                { icon: HeartHandshake, label: 'Tarot Partnerski', color: '#F472B6' },
              ].map(({ icon: Icon, label, color }, i) => (
                <View key={i} style={{
                  width: (SW - 56) / 2,
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  padding: 14, borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                }}>
                  <View style={{
                    width: 34, height: 34, borderRadius: 17,
                    backgroundColor: color + '18',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={17} color={color} strokeWidth={1.8} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(240,235,248,0.75)', flex: 1, lineHeight: 16 }}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Testimonials */}
          <Animated.View entering={FadeInDown.delay(700).duration(600)} style={{ marginBottom: 28 }}>
            <Text style={{
              fontSize: 11, fontWeight: '700', letterSpacing: 3, color: '#CEAE72',
              textAlign: 'center', marginBottom: 16,
            }}>
              CO MÓWIĄ DUSZE
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 2 }}>
              {TESTIMONIALS.map((t, i) => <Testimonial key={i} item={t} index={i} />)}
            </ScrollView>
          </Animated.View>

          {/* Security badges */}
          <Animated.View entering={FadeInDown.delay(900).duration(600)} style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 8 }}>
            {[
              { icon: Shield, label: 'Bezpieczna płatność' },
              { icon: Clock, label: 'Anuluj kiedy chcesz' },
              { icon: HeartHandshake, label: '7-dniowy zwrot' },
            ].map(({ icon: Icon, label }, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                <Icon size={18} color="rgba(196,181,253,0.5)" strokeWidth={1.5} />
                <Text style={{ fontSize: 10, color: 'rgba(196,181,253,0.4)', textAlign: 'center', maxWidth: 70 }}>
                  {label}
                </Text>
              </View>
            ))}
          </Animated.View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
