// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Dimensions, Pressable, ScrollView, StyleSheet, Text, View, TextInput, ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay,
  Easing, FadeInDown, FadeInUp, withSpring, interpolate, runOnJS, useAnimatedProps,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle, Path, G, Line, Text as SvgText, Defs, RadialGradient, Stop,
  Polygon, Ellipse, LinearGradient as SvgLinearGradient,
} from 'react-native-svg';
import { useAppStore } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import {
  Star, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Sparkles, Globe, Moon,
  BookOpen, Flame, Zap, Wind, Compass, Map, Trophy, Check, Circle as CircleIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { getLocalizedJourneyPhases, type JourneyPhase } from '../features/journeys/data';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW, height: SH } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── RUNE SYMBOLS FOR OUTER RING ────────────────────────────────────────────
const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ'];

// ─── SPIRAL PATH CALCULATION ────────────────────────────────────────────────
const WIDGET_H = 240;
const CX = SW / 2;
const CY = WIDGET_H / 2;
const getSpiralPoint = (t: number) => {
  const a = 0.8;
  const b = 12;
  const r = a + b * t;
  const x = CX + r * Math.cos(t);
  const y = CY + r * Math.sin(t) * 0.55;
  return { x, y };
};

const MILESTONE_T_VALUES = [0.4, 1.1, 1.8, 2.5, 3.2, 3.9, 4.6];
const MILESTONE_POSITIONS = MILESTONE_T_VALUES.map((t) => getSpiralPoint(t));

// ─── SOUL PATH WIDGET ────────────────────────────────────────────────────────
function SoulPathWidget({ currentPhase, isLight, phases, t }: { currentPhase: number; isLight: boolean; phases: JourneyPhase[]; t: (key: string, pl: string, en: string, options?: Record<string, unknown>) => string }) {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const particleAngle = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 24000, easing: Easing.linear }),
      -1,
      false,
    );
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    particleAngle.value = withRepeat(
      withTiming(360, { duration: 6000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = interpolate(e.translationX, [-SW / 2, SW / 2], [-12, 12]);
      tiltY.value = interpolate(e.translationY, [-WIDGET_H / 2, WIDGET_H / 2], [-8, 8]);
    })
    .onEnd(() => {
      tiltX.value = withSpring(0);
      tiltY.value = withSpring(0);
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${-tiltY.value}deg` },
      { rotateY: `${tiltX.value}deg` },
    ],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Build spiral path
  const steps = 80;
  let spiralD = '';
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 5.0;
    const { x, y } = getSpiralPoint(t);
    spiralD += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }

  const bgColor = isLight ? '#FAF6EE' : '#06040F';
  const ringColor = isLight ? 'rgba(180,150,100,0.3)' : 'rgba(206,174,114,0.25)';

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ width: SW, height: WIDGET_H, overflow: 'hidden' }, containerStyle]}>
        <LinearGradient
          colors={isLight ? ['#FAF0E6', '#F2E8D8', '#EDE0C6'] : ['#08051A', '#0D0825', '#08051A']}
          style={{ flex: 1 }}
        >
          <Svg width={SW} height={WIDGET_H}>
            <Defs>
              <RadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#CEAE72" stopOpacity="0.35" />
                <Stop offset="100%" stopColor="#CEAE72" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="phaseGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={phases[currentPhase - 1].color} stopOpacity="0.9" />
                <Stop offset="60%" stopColor={phases[currentPhase - 1].color} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={phases[currentPhase - 1].color} stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Background glow */}
            <Circle cx={CX} cy={CY} r={90} fill="url(#glowGrad)" />

            {/* Outer rune ring — static rings */}
            <Circle cx={CX} cy={CY} r={108} stroke={ringColor} strokeWidth={1} fill="none" strokeDasharray="3 6" />
            <Circle cx={CX} cy={CY} r={115} stroke={ringColor} strokeWidth={0.5} fill="none" />

            {/* Rune symbols around ring */}
            {RUNES.slice(0, 12).map((r, i) => {
              const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
              const rx = CX + 107 * Math.cos(angle);
              const ry = CY + 107 * Math.sin(angle) * 0.72;
              return (
                <SvgText
                  key={i}
                  x={rx}
                  y={ry + 4}
                  fontSize={9}
                  fill={isLight ? 'rgba(120,90,60,0.5)' : 'rgba(206,174,114,0.45)'}
                  textAnchor="middle"
                  fontFamily="serif"
                >
                  {r}
                </SvgText>
              );
            })}

            {/* Spiral path glow (thick) */}
            <Path
              d={spiralD}
              stroke={isLight ? 'rgba(180,140,80,0.18)' : 'rgba(206,174,114,0.12)'}
              strokeWidth={8}
              fill="none"
              strokeLinecap="round"
            />
            {/* Spiral path main */}
            <Path
              d={spiralD}
              stroke={isLight ? '#B8922A' : '#CEAE72'}
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
              strokeDasharray="4 3"
              opacity={0.65}
            />

            {/* Milestone orbs */}
            {MILESTONE_POSITIONS.map((pos, i) => {
              const phase = phases[i];
              const completed = i + 1 < currentPhase;
              const isCurrent = i + 1 === currentPhase;
              const dim = i + 1 > currentPhase;
              const r = isCurrent ? 10 : completed ? 7 : 5;
              return (
                <G key={i}>
                  {isCurrent && (
                    <Circle cx={pos.x} cy={pos.y} r={18} fill="url(#phaseGlow)" />
                  )}
                  {completed && (
                    <Circle cx={pos.x} cy={pos.y} r={10} fill={phase.color} opacity={0.25} />
                  )}
                  <Circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r}
                    fill={dim ? 'transparent' : phase.color}
                    stroke={phase.color}
                    strokeWidth={isCurrent ? 2 : 1}
                    opacity={dim ? 0.3 : 1}
                  />
                  {completed && (
                    <SvgText x={pos.x} y={pos.y + 4} fontSize={8} fill="#fff" textAnchor="middle">✓</SvgText>
                  )}
                  {isCurrent && (
                    <SvgText x={pos.x} y={pos.y + 3.5} fontSize={7} fill="#fff" textAnchor="middle">{phase.symbol}</SvgText>
                  )}
                  <SvgText
                    x={pos.x}
                    y={pos.y - 14}
                    fontSize={7.5}
                    fill={isLight ? 'rgba(80,60,40,0.7)' : 'rgba(220,200,160,0.7)'}
                    textAnchor="middle"
                  >
                    {i + 1}
                  </SvgText>
                </G>
              );
            })}

            {/* Orbiting particles along spiral */}
            {[0, 0.15, 0.3].map((offset, pi) => {
              const tVal = ((Date.now() / 1000 * 0.18) % 5.0) + offset * 5.0;
              const pPos = getSpiralPoint(tVal % 5.0);
              return (
                <Circle
                  key={pi}
                  cx={pPos.x}
                  cy={pPos.y}
                  r={2.5}
                  fill="#CEAE72"
                  opacity={0.7 - pi * 0.2}
                />
              );
            })}

            {/* Center label */}
            <SvgText
              x={CX}
              y={CY - 6}
              fontSize={9}
              fill={isLight ? 'rgba(80,60,40,0.5)' : 'rgba(206,174,114,0.5)'}
              textAnchor="middle"
              fontFamily="serif"
              letterSpacing={2}
            >
              {t('journeysScreen.widgetLabel', 'PODRÓŻ DUSZY', 'SOUL PATH')}
            </SvgText>
            <SvgText
              x={CX}
              y={CY + 8}
              fontSize={14}
              fill={isLight ? '#7A5A2A' : '#CEAE72'}
              textAnchor="middle"
              fontFamily="serif"
            >
              {phases[currentPhase - 1].symbol}
            </SvgText>
          </Svg>
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
}

// ─── MILESTONE MAP ───────────────────────────────────────────────────────────
function MilestoneMap({
  currentPhase, onSelect, isLight, phases,
}: {
  currentPhase: number;
  onSelect: (n: number) => void;
  isLight: boolean;
  phases: JourneyPhase[];
}) {
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 800 }),
        withTiming(1.0, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  const NODE_W = 40;
  const LINE_W = SW - layout.padding.screen * 2 - phases.length * NODE_W;
  const segW = LINE_W / (phases.length - 1);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingVertical: 12 }}>
      {phases.map((ph, i) => {
        const completed = ph.id < currentPhase;
        const isCurrent = ph.id === currentPhase;
        const dim = ph.id > currentPhase;
        return (
          <View key={ph.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => { HapticsService.notify(); onSelect(ph.id); }} style={{ alignItems: 'center', width: NODE_W }}>
              <Animated.View style={isCurrent ? pulseStyle : undefined}>
                <View style={{
                  width: isCurrent ? 32 : 24,
                  height: isCurrent ? 32 : 24,
                  borderRadius: isCurrent ? 16 : 12,
                  backgroundColor: dim ? 'transparent' : ph.color,
                  borderWidth: 2,
                  borderColor: ph.color,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: dim ? 0.35 : 1,
                  shadowColor: isCurrent ? ph.color : 'transparent',
                  shadowOpacity: isCurrent ? 0.6 : 0,
                  shadowRadius: isCurrent ? 8 : 0,
                  elevation: isCurrent ? 6 : 0,
                }}>
                  {completed && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
                  {isCurrent && <Text style={{ color: '#fff', fontSize: 11 }}>{ph.symbol}</Text>}
                  {dim && <Text style={{ color: ph.color, fontSize: 9, opacity: 0.5 }}>{ph.id}</Text>}
                </View>
              </Animated.View>
              <Text style={{
                fontSize: 8,
                color: dim ? (isLight ? 'rgba(80,60,40,0.35)' : 'rgba(220,200,160,0.35)') : (isLight ? '#5A4020' : '#CEAE72'),
                marginTop: 4,
                textAlign: 'center',
                fontWeight: isCurrent ? '700' : '400',
              }} numberOfLines={1}>{ph.id}</Text>
            </Pressable>
            {i < phases.length - 1 && (
              <View style={{
                width: 28,
                height: 1.5,
                backgroundColor: phases[i + 1].id <= currentPhase
                  ? (isLight ? 'rgba(160,120,60,0.5)' : 'rgba(206,174,114,0.4)')
                  : (isLight ? 'rgba(160,120,60,0.15)' : 'rgba(206,174,114,0.12)'),
                marginBottom: 16,
              }} />
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── PHASE CARD ──────────────────────────────────────────────────────────────
function PhaseCard({
  phase, isExpanded, onToggle, currentPhase, isLight, t,
}: {
  phase: JourneyPhase;
  isExpanded: boolean;
  onToggle: () => void;
  currentPhase: number;
  isLight: boolean;
  t: (key: string, pl: string, en: string, options?: Record<string, unknown>) => string;
}) {
  const isCurrent = phase.id === currentPhase;
  const completed = phase.id < currentPhase;
  const dim = phase.id > currentPhase;
  const phaseSecondaryName = phase.nameEn && phase.nameEn !== phase.name ? phase.nameEn : null;

  const cardBg = isLight
    ? (isCurrent ? `${phase.color}18` : 'rgba(255,255,255,0.88)')
    : (isCurrent ? `${phase.color}18` : 'rgba(255,255,255,0.05)');
  const cardBorder = isCurrent ? `${phase.color}60` : (isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)');
  const textColor = isLight ? '#2A1A0A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(50,30,10,0.55)' : 'rgba(220,200,160,0.55)';

  return (
    <Animated.View entering={FadeInDown.delay(phase.id * 60).springify()}>
      <Pressable
        onPress={onToggle}
        style={{
          backgroundColor: cardBg,
          borderWidth: 1,
          borderColor: cardBorder,
          borderRadius: 16,
          marginHorizontal: layout.padding.screen,
          marginBottom: 10,
          overflow: 'hidden',
          opacity: dim ? 0.55 : 1,
        }}
      >
        {isCurrent && (
          <View style={{ height: 2, backgroundColor: phase.color, opacity: 0.7 }} />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
          {/* Phase number badge */}
          <View style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: completed ? phase.color : (isCurrent ? phase.color : 'transparent'),
            borderWidth: 2, borderColor: phase.color,
            alignItems: 'center', justifyContent: 'center',
            marginRight: 12,
          }}>
            {completed
              ? <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>
              : <Text style={{ color: isCurrent ? '#fff' : phase.color, fontSize: 13, fontWeight: '700' }}>{phase.id}</Text>
            }
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, flex: 1 }}>
                {phase.name}
              </Text>
              {isCurrent && (
                <View style={{ backgroundColor: phase.color, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
                    {t('journeysScreen.phaseActive', 'AKTYWNA', 'ACTIVE')}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 11, color: subColor, marginTop: 2 }}>
              {phaseSecondaryName ? `${phaseSecondaryName} · ` : ''}{phase.durationHint}
            </Text>
          </View>

          <Text style={{ fontSize: 20 }}>{phase.emoji}</Text>
          {isExpanded
            ? <ChevronUp size={16} color={subColor} style={{ marginLeft: 8 }} />
            : <ChevronDown size={16} color={subColor} style={{ marginLeft: 8 }} />
          }
        </View>

        {isExpanded && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 16 }}>
            {/* Description */}
            <Text style={{ fontSize: 13, color: subColor, lineHeight: 20, marginBottom: 12 }}>
              {phase.description}
            </Text>

            {/* Themes */}
            <Text style={{ fontSize: 10, color: phase.color, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>
              {t('journeysScreen.phaseThemes', 'TEMATY', 'THEMES')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {phase.themes.map((t) => (
                <View key={t} style={{
                  backgroundColor: `${phase.color}22`,
                  borderRadius: 10,
                  paddingHorizontal: 10, paddingVertical: 4,
                  borderWidth: 1, borderColor: `${phase.color}44`,
                }}>
                  <Text style={{ fontSize: 11, color: phase.color, fontWeight: '600' }}>{t}</Text>
                </View>
              ))}
            </View>

            {/* Practices */}
            <Text style={{ fontSize: 10, color: phase.color, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>
              {t('journeysScreen.phasePractices', 'PRAKTYKI', 'PRACTICES')}
            </Text>
            {phase.practices.map((p) => (
              <View key={p} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: phase.color, marginRight: 8 }} />
                <Text style={{ fontSize: 12, color: subColor }}>{p}</Text>
              </View>
            ))}

            {/* Journal prompts */}
            <Text style={{ fontSize: 10, color: phase.color, fontWeight: '700', letterSpacing: 1.5, marginTop: 10, marginBottom: 6 }}>
              {t('journeysScreen.phasePrompts', 'PYTANIA DO DZIENNIKA', 'JOURNAL QUESTIONS')}
            </Text>
            {phase.prompts.map((pr, i) => (
              <View key={i} style={{
                backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)',
                borderRadius: 10, padding: 10, marginBottom: 6,
                borderLeftWidth: 3, borderLeftColor: phase.color,
              }}>
                <Text style={{ fontSize: 12, color: textColor, lineHeight: 18, fontStyle: 'italic' }}>{pr}</Text>
              </View>
            ))}

            {/* Associations */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <View style={{ flex: 1, backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10 }}>
                <Text style={{ fontSize: 9, color: subColor, letterSpacing: 1 }}>
                  {t('journeysScreen.phaseCrystal', 'KAMIEŃ', 'CRYSTAL')}
                </Text>
                <Text style={{ fontSize: 11, color: textColor, marginTop: 3 }}>{phase.crystalHint}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10 }}>
                <Text style={{ fontSize: 9, color: subColor, letterSpacing: 1 }}>
                  {t('journeysScreen.phaseElement', 'ŻYWIOŁ', 'ELEMENT')}
                </Text>
                <Text style={{ fontSize: 11, color: textColor, marginTop: 3 }}>{phase.elementHint}</Text>
              </View>
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
function ProgressBar({ value, color, isLight }: { value: number; color: string; isLight: boolean }) {
  const anim = useSharedValue(0);
  useEffect(() => {
    anim.value = withTiming(value, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [value]);
  const barStyle = useAnimatedStyle(() => ({ width: `${anim.value}%` }));
  return (
    <View style={{ height: 6, backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', borderRadius: 3, backgroundColor: color }, barStyle]} />
    </View>
  );
}

// ─── STAT PILL ───────────────────────────────────────────────────────────────
function StatPill({ icon, value, label, color, isLight }: any) {
  const textColor = isLight ? '#2A1A0A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(50,30,10,0.5)' : 'rgba(220,200,160,0.5)';
  return (
    <View style={{
      flex: 1,
      backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)',
      borderRadius: 14, padding: 12, alignItems: 'center',
      borderWidth: 1, borderColor: isLight ? 'rgba(139,100,42,0.32)' : 'rgba(255,255,255,0.07)',
    }}>
      <Text style={{ fontSize: 20, marginBottom: 4 }}>{icon}</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>{value}</Text>
      <Text style={{ fontSize: 10, color: subColor, textAlign: 'center', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// ─── SKELETON LOADER ─────────────────────────────────────────────────────────
function SkeletonLoader({ isLight }: { isLight: boolean }) {
  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, []);
  const shimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
  }));
  return (
    <View style={{ padding: layout.padding.screen }}>
      {[80, 60, 100, 45].map((h, i) => (
        <Animated.View
          key={i}
          style={[{
            height: h, borderRadius: 10, marginBottom: 10,
            backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)',
          }, shimStyle]}
        />
      ))}
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export const JourneysScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const meditationSessions = useAppStore(s => s.meditationSessions) ?? [];
  const { entries: journalEntries } = useJournalStore();
  const { currentTheme, isLight } = useTheme();
  const tr = useCallback((key: string, pl: string, en: string, options?: Record<string, unknown>) => (
    t(key, {
      defaultValue: i18n.language?.startsWith('en') ? en : pl,
      ...options,
    })
  ), [t]);
  const localizedPhases = useMemo(() => getLocalizedJourneyPhases(), [i18n.language]);

  const textColor = isLight ? '#2A1A0A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(50,30,10,0.55)' : 'rgba(220,200,160,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';
  const goldColor = isLight ? '#8B6914' : '#CEAE72';

  // Derive current phase from practice data
  const totalSessions = meditationSessions.length + journalEntries.length;
  const currentPhase = useMemo(() => {
    if (totalSessions < 5) return 1;
    if (totalSessions < 15) return 2;
    if (totalSessions < 30) return 3;
    if (totalSessions < 50) return 4;
    if (totalSessions < 75) return 5;
    if (totalSessions < 110) return 6;
    return 7;
  }, [totalSessions]);

  const daysInPhase = useMemo(() => Math.max(1, Math.floor(totalSessions * 0.6)), [totalSessions]);
  const totalDays = useMemo(() => Math.max(daysInPhase, meditationSessions.length + Math.floor(journalEntries.length * 0.5)), [meditationSessions, journalEntries, daysInPhase]);
  const phaseProgress = useMemo(() => {
    const thresholds = [0, 5, 15, 30, 50, 75, 110, 999];
    const low = thresholds[currentPhase - 1];
    const high = thresholds[currentPhase];
    return Math.min(100, Math.round(((totalSessions - low) / (high - low)) * 100));
  }, [currentPhase, totalSessions]);

  const [expandedPhase, setExpandedPhase] = useState<number | null>(currentPhase);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const isFavJourneys = isFavoriteItem('journeys');
  const handleAddFavorite = useCallback(() => {
    HapticsService.notify();
    if (isFavoriteItem('journeys')) {
      removeFavoriteItem('journeys');
    } else {
      addFavoriteItem?.({
        id: 'journeys',
        label: tr('journeysScreen.favoriteLabel', 'Podróże Duszy', 'Soul journeys'),
        sublabel: tr(
          'journeysScreen.favoriteSublabel',
          'Faza {{phase}}: {{phaseName}}',
          'Phase {{phase}}: {{phaseName}}',
          { phase: currentPhase, phaseName: localizedPhases[currentPhase - 1].name },
        ),
        route: 'Journeys',
        icon: 'Globe',
        color: localizedPhases[currentPhase - 1].color,
        addedAt: new Date().toISOString(),
      });
    }
  }, [currentPhase, addFavoriteItem, removeFavoriteItem, isFavoriteItem, localizedPhases]);

  const handleAskOracle = useCallback(async () => {
    HapticsService.notify();
    setAiLoading(true);
    setAiError('');
    setAiResponse('');
    try {
      const phase = localizedPhases[currentPhase - 1];
      const name = userData?.name || 'Wędrowcu';
      const zodiac = userData?.zodiacSign || '';
      const messages = [
        {
          role: 'user' as const,
          content: t(
            'journeysScreen.oraclePrompt',
            'Jestem {{name}}{{zodiacPart}}. Jestem na etapie duchowym "{{phaseName}}" (faza {{phaseId}} z 7) od {{daysInPhase}} dni. Opis etapu: {{phaseDescription}}... Całkowita liczba praktyk: {{totalSessions}}. Proszę, daj mi głęboki wgląd i wskazówkę na ten etap mojej podróży duchowej. Bądź konkretny, ciepły i inspirujący. Odpowiedź w aktualnym języku aplikacji, 4-5 zdań.',
            {
              name,
              zodiacPart: zodiac
                ? `, ${tr('journeysScreen.zodiacLabel', 'znak zodiaku', 'zodiac sign')}: ${zodiac}`
                : '',
              phaseName: phase.name,
              phaseId: phase.id,
              daysInPhase,
              phaseDescription: phase.description.substring(0, 120),
              totalSessions,
            },
          ),
        },
      ];
      const resp = await AiService.chatWithOracle(messages, i18n.language?.slice(0, 2) || 'pl');
      setAiResponse(resp);
    } catch (e) {
      setAiError(tr('journeysScreen.oracleError', 'Nie udało się połączyć z Oracle. Spróbuj ponownie.', 'Oracle could not be reached. Please try again.'));
    } finally {
      setAiLoading(false);
    }
  }, [currentPhase, daysInPhase, totalSessions, userData]);

  const phase = localizedPhases[currentPhase - 1];
  const completedPhases = currentPhase - 1;

  const bgColors = isLight
    ? ['#FAF6EE', '#F5EFE2', '#FAF6EE'] as const
    : ['#06040F', '#0B0720', '#06040F'] as const;

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <LinearGradient colors={bgColors} style={{ flex: 1 }}>
        {/* ── Header ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: layout.padding.screen, paddingTop: 8, paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.07)',
        }}>
          <Pressable
            onPress={() => { if (navigation.canGoBack()) navigation.goBack(); else navigation.navigate('Main'); }}
            style={{ padding: 6, marginRight: 8 }}
          >
            <ChevronLeft size={22} color={textColor} />
          </Pressable>

          <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: goldColor, letterSpacing: 2 }}>
            ✦ {tr('journeysScreen.headerTitle', 'PODRÓŻE DUSZY', 'SOUL JOURNEYS')}
          </Text>

          <Pressable onPress={handleAddFavorite} style={{ padding: 8 }}>
            <Star size={20} color={goldColor} fill={isFavJourneys ? goldColor : 'none'} />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        >
          {/* ── 3D Soul Path Widget ── */}
          <SoulPathWidget currentPhase={currentPhase} isLight={isLight} phases={localizedPhases} t={tr} />

          {/* ── Current Phase Banner ── */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={{
            marginHorizontal: layout.padding.screen,
            marginTop: 18,
            borderRadius: 18,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: `${phase.color}50`,
          }}>
            <LinearGradient
              colors={isLight
                ? [`${phase.color}20`, `${phase.color}08`]
                : [`${phase.color}28`, `${phase.color}0A`]}
              style={{ padding: 16 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View style={{
                  width: 42, height: 42, borderRadius: 21,
                  backgroundColor: phase.color,
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 12,
                  shadowColor: phase.color, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
                }}>
                  <Text style={{ color: '#fff', fontSize: 18 }}>{phase.symbol}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: phase.color, fontWeight: '700', letterSpacing: 1.5 }}>
                    {tr('journeysScreen.phaseMeta', 'FAZA {{phase}} Z 7', 'PHASE {{phase}} OF 7', { phase: currentPhase })}
                  </Text>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: textColor }}>
                    {phase.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: subColor }}>
                    {phase.nameEn && phase.nameEn !== phase.name ? `${phase.nameEn} · ` : ''}{tr('journeysScreen.daysInPhase', '{{count}} dni w tej fazie', '{{count}} days in this phase', { count: daysInPhase })}
                  </Text>
                </View>
                <Text style={{ fontSize: 28 }}>{phase.emoji}</Text>
              </View>

              <Text style={{ fontSize: 13, color: subColor, lineHeight: 20, marginBottom: 12 }}>
                {phase.description.substring(0, 180)}...
              </Text>

              <Text style={{ fontSize: 10, color: subColor, marginBottom: 6, letterSpacing: 1 }}>
                {tr('journeysScreen.progressLabel', 'POSTĘP DO NASTĘPNEJ FAZY · {{progress}}%', 'PROGRESS TO THE NEXT PHASE · {{progress}}%', { progress: phaseProgress })}
              </Text>
              <ProgressBar value={phaseProgress} color={phase.color} isLight={isLight} />
            </LinearGradient>
          </Animated.View>

          {/* ── Stats Row ── */}
          <Animated.View entering={FadeInDown.delay(160).springify()} style={{
            flexDirection: 'row', gap: 10,
            marginHorizontal: layout.padding.screen, marginTop: 14,
          }}>
            <StatPill icon="🌟" value={completedPhases} label={tr('journeysScreen.stats.completed', 'Fazy ukończone', 'Completed phases')} color={goldColor} isLight={isLight} />
            <StatPill icon="🔥" value={totalDays} label={tr('journeysScreen.stats.days', 'Dni na ścieżce', 'Days on the path')} color={phase.color} isLight={isLight} />
            <StatPill icon="📿" value={totalSessions} label={tr('journeysScreen.stats.sessions', 'Praktyk łącznie', 'Practices total')} color="#3498DB" isLight={isLight} />
          </Animated.View>

          {/* ── Milestone Map ── */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={{
            marginTop: 20,
            marginHorizontal: layout.padding.screen,
            backgroundColor: cardBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: cardBorder,
            paddingTop: 14,
          }}>
            <Text style={{ fontSize: 10, color: goldColor, fontWeight: '700', letterSpacing: 2, paddingHorizontal: 14, marginBottom: 2 }}>
              {tr('journeysScreen.milestones', 'MAPA MILESTONES', 'MILESTONE MAP')}
            </Text>
            <MilestoneMap
              currentPhase={currentPhase}
              onSelect={(n) => {
                setExpandedPhase(n === expandedPhase ? null : n);
                scrollRef.current?.scrollTo({ y: 550, animated: true });
              }}
              isLight={isLight}
              phases={localizedPhases}
            />
          </Animated.View>

          {/* ── AI Journey Guide ── */}
          <Animated.View entering={FadeInDown.delay(250).springify()} style={{
            marginHorizontal: layout.padding.screen,
            marginTop: 18,
            borderRadius: 18,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: isLight ? 'rgba(206,174,114,0.3)' : 'rgba(206,174,114,0.25)',
          }}>
            <LinearGradient
              colors={isLight ? ['#FAF0DC', '#F8EBD0'] : ['#12100A', '#1A1508']}
              style={{ padding: 16 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Sparkles size={18} color={goldColor} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{tr('journeysScreen.oracleGuideTitle', 'Przewodnik Oracle', 'Oracle Guide')}</Text>
              </View>
              <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 12 }}>
                {tr('journeysScreen.oracleGuideBody', 'Zapytaj Oracle o swój obecny etap duchowy. Otrzymasz spersonalizowaną wskazówkę uwzględniającą Twoją fazę, doświadczenie i dane astrologiczne.', 'Ask Oracle about your current spiritual stage. You will receive personalized guidance shaped by your phase, experience, and astrological data.')}
              </Text>

              <Pressable
                onPress={handleAskOracle}
                disabled={aiLoading}
                style={{
                  backgroundColor: goldColor,
                  borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  opacity: aiLoading ? 0.7 : 1,
                }}
              >
                {aiLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                    <Sparkles size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{tr('journeysScreen.oracleGuideCta', 'Zapytaj Oracle o swoją podróż', 'Ask Oracle about your journey')}</Text>
                  </>
                }
              </Pressable>

              {aiLoading && <SkeletonLoader isLight={isLight} />}

              {!!aiError && (
                <View style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(231,76,60,0.12)', borderRadius: 10 }}>
                  <Text style={{ fontSize: 12, color: '#E74C3C' }}>{aiError}</Text>
                </View>
              )}

              {!!aiResponse && !aiLoading && (
                <Animated.View
                  entering={FadeInDown.springify()}
                  style={{
                    marginTop: 14, padding: 14,
                    backgroundColor: isLight ? 'rgba(206,174,114,0.12)' : 'rgba(206,174,114,0.08)',
                    borderRadius: 14,
                    borderLeftWidth: 3,
                    borderLeftColor: goldColor,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 10, color: goldColor, fontWeight: '700', letterSpacing: 1.5 }}>{tr('journeysScreen.oracleSpeaks', 'ORACLE MÓWI', 'ORACLE SPEAKS')}</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: textColor, lineHeight: 22, fontStyle: 'italic' }}>
                    {aiResponse}
                  </Text>
                </Animated.View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ── 7 Phase Cards ── */}
          <View style={{ marginTop: 22 }}>
            <Animated.View entering={FadeInDown.delay(300).springify()} style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: layout.padding.screen, marginBottom: 14,
            }}>
              <Map size={16} color={goldColor} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: goldColor, letterSpacing: 2 }}>{tr('journeysScreen.allPhases', '7 ETAPÓW ŚCIEŻKI', '7 STAGES OF THE PATH')}</Text>
            </Animated.View>

            {localizedPhases.map((ph) => (
              <PhaseCard
                key={ph.id}
                phase={ph}
                isExpanded={expandedPhase === ph.id}
                onToggle={() => {
                  HapticsService.notify();
                  setExpandedPhase(expandedPhase === ph.id ? null : ph.id);
                }}
                currentPhase={currentPhase}
                isLight={isLight}
                t={tr}
              />
            ))}
          </View>

          {/* ── Journal Integration ── */}
          <Animated.View entering={FadeInDown.delay(420).springify()} style={{
            marginHorizontal: layout.padding.screen,
            marginTop: 20,
            borderRadius: 18,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: isLight ? 'rgba(52,152,219,0.3)' : 'rgba(52,152,219,0.25)',
          }}>
            <LinearGradient
              colors={isLight ? ['rgba(52,152,219,0.08)', 'rgba(52,152,219,0.02)'] : ['rgba(52,152,219,0.12)', 'rgba(52,152,219,0.03)']}
              style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}
            >
              <BookOpen size={24} color="#3498DB" style={{ marginRight: 14 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{tr('journeysScreen.journalTitle', 'Dziennik podróży', 'Journey journal')}</Text>
                <Text style={{ fontSize: 11, color: subColor, marginTop: 2 }}>
                  {tr('journeysScreen.journalBody', 'Zapisz refleksję z etapu {{phase}}: {{name}}', 'Write a reflection from phase {{phase}}: {{name}}', { phase: currentPhase, name: phase.name })}
                </Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate('Journal')}
                style={{
                  backgroundColor: '#3498DB',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{tr('journeysScreen.write', 'Pisz', 'Write')}</Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>

          {/* ── Phase Prompt of the Day ── */}
          <Animated.View entering={FadeInDown.delay(460).springify()} style={{
            marginHorizontal: layout.padding.screen,
            marginTop: 16,
            borderRadius: 18,
            overflow: 'hidden',
          }}>
            <LinearGradient
              colors={isLight
                ? [`${phase.color}14`, `${phase.color}06`]
                : [`${phase.color}20`, `${phase.color}08`]}
              style={{ padding: 16 }}
            >
              <Text style={{ fontSize: 10, color: phase.color, fontWeight: '700', letterSpacing: 2, marginBottom: 8 }}>
                {tr('journeysScreen.questionOfDay', 'PYTANIE DNIA · FAZA {{phase}}', 'QUESTION OF THE DAY · PHASE {{phase}}', { phase: currentPhase })}
              </Text>
              <Text style={{ fontSize: 15, color: textColor, fontStyle: 'italic', lineHeight: 24, fontWeight: '500' }}>
                "{phase.prompts[new Date().getDay() % 3]}"
              </Text>
              <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' }}>
                <Pressable
                  onPress={() => navigation.navigate('Journal')}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: `${phase.color}22`,
                    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
                  }}
                >
                  <Text style={{ fontSize: 11, color: phase.color, fontWeight: '600', marginRight: 4 }}>{tr('journeysScreen.answerInJournal', 'Odpowiedz w dzienniku', 'Answer in journal')}</Text>
                  <ChevronRight size={12} color={phase.color} />
                </Pressable>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Path Summary Footer ── */}
          <Animated.View entering={FadeInDown.delay(500).springify()} style={{
            marginHorizontal: layout.padding.screen,
            marginTop: 16,
            padding: 16,
            backgroundColor: cardBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: cardBorder,
          }}>
            <Text style={{ fontSize: 10, color: goldColor, fontWeight: '700', letterSpacing: 2, marginBottom: 12 }}>{tr('journeysScreen.summary', 'PODSUMOWANIE ŚCIEŻKI', 'PATH SUMMARY')}</Text>
            {localizedPhases.map((ph) => {
              const done = ph.id < currentPhase;
              const active = ph.id === currentPhase;
              return (
                <View key={ph.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{
                    width: 18, height: 18, borderRadius: 9,
                    backgroundColor: done ? ph.color : (active ? ph.color : 'transparent'),
                    borderWidth: 1.5, borderColor: ph.color,
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 10,
                    opacity: active || done ? 1 : 0.35,
                  }}>
                    {done && <Text style={{ color: '#fff', fontSize: 8 }}>✓</Text>}
                    {active && <Text style={{ color: '#fff', fontSize: 7 }}>{ph.symbol}</Text>}
                  </View>
                  <Text style={{
                    flex: 1,
                    fontSize: 12,
                    color: done || active ? textColor : subColor,
                    fontWeight: active ? '700' : '400',
                    opacity: done || active ? 1 : 0.5,
                  }}>
                    {ph.id}. {ph.name}
                  </Text>
                  {active && (
                    <View style={{ backgroundColor: ph.color, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ color: '#fff', fontSize: 8, fontWeight: '700' }}>{phaseProgress}%</Text>
                    </View>
                  )}
                  {done && <Text style={{ fontSize: 11, color: ph.color }}>✓</Text>}
                </View>
              );
            })}
          </Animated.View>

          <EndOfContentSpacer />
        </ScrollView>
      </LinearGradient>
        </SafeAreaView>
</View>
  );
};
