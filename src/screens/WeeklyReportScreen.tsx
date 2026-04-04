// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  Dimensions, Pressable, ScrollView, StyleSheet, Text, View,
  ActivityIndicator, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withTiming, withSequence, withDelay, withSpring,
  Easing, FadeInDown, interpolate, runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle, Path, G, Line, Defs, RadialGradient, Stop, Polygon, Text as SvgText, Rect,
} from 'react-native-svg';
import { useAppStore } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import {
  Star, ChevronLeft, ChevronRight, BookOpen, Moon, Zap, Heart,
  Flame, TrendingUp, Sparkles, Award, RefreshCw,
} from 'lucide-react-native';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { resolveUserFacingText } from '../core/utils/contentResolver';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

const { width: SW } = Dimensions.get('window');
const ACCENT = '#CEAE72';
const PAD = layout.padding.screen;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const isoWeek = (d: Date): number => {
  const tmp = new Date(d.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

const getWeekDates = (offset: number): Date[] => {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // 0=Mon
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

const MOOD_SCORE: Record<string, number> = {
  Znakomita: 95, Dobra: 78, Jasność: 95, Przepływ: 78,
  Spokojna: 65, Miękkość: 65, Slaba: 40, Mgła: 40, Trudna: 25, Napięcie: 25,
  Spokojny: 65, Radosny: 90, Zmęczony: 35, Niespokojny: 30,
  Inspirowany: 88, Wdzięczny: 85, Smutny: 25, Skupiony: 75, Mistyczny: 80,
};
const MOOD_COLOR = (score: number) => {
  'worklet';
  return score >= 80 ? '#34D399' : score >= 60 ? '#CEAE72' : score >= 40 ? '#F97316' : '#E8705A';
};

const getDayAbbr = () => {
  const value = i18n.t('weeklyReport.dayAbbr', {
    returnObjects: true,
    defaultValue: ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'],
  });
  return Array.isArray(value) ? value.map((item) => String(item)) : ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
};
const DAY_EMOJI: Record<number, string> = { 0: '😊', 1: '😌', 2: '😴', 3: '😰', 4: '✨', 5: '🙏', 6: '😢' };

// ─── CosmicCompass widget ─────────────────────────────────────────────────────
const DIMENSIONS_8 = [
  { label: 'Ciało',     short: 'C',  angle: 0   },
  { label: 'Duch',      short: 'D',  angle: 45  },
  { label: 'Umysł',     short: 'U',  angle: 90  },
  { label: 'Serce',     short: 'Se', angle: 135 },
  { label: 'Relacje',   short: 'R',  angle: 180 },
  { label: 'Praca',     short: 'P',  angle: 225 },
  { label: 'Kreat.',    short: 'K',  angle: 270 },
  { label: 'Intuicja',  short: 'I',  angle: 315 },
];

const CosmicCompass = ({
  accent, scores, weekNum, weekLabel, isLight,
}: {
  accent: string; scores: number[]; weekNum: number; weekLabel: string; isLight: boolean;
}) => {
  const tiltX = useSharedValue(-6);
  const tiltY = useSharedValue(0);
  const ringRot = useSharedValue(0);
  const pulse   = useSharedValue(1);

  useEffect(() => {
    ringRot.value = withRepeat(withTiming(360, { duration: 22000, easing: Easing.linear }), -1, false);
    pulse.value   = withRepeat(
      withSequence(withTiming(1.05, { duration: 2200 }), withTiming(1, { duration: 2200 })),
      -1, true,
    );
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-24, Math.min(24, -6 + e.translationY * 0.2));
      tiltY.value = Math.max(-24, Math.min(24, e.translationX * 0.2));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-6, { duration: 950 });
      tiltY.value = withTiming(0, { duration: 950 });
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: tiltX.value + 'deg' },
      { rotateY: tiltY.value + 'deg' },
    ],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: ringRot.value + 'deg' }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const SIZE  = 220;
  const CX    = SIZE / 2;
  const CY    = SIZE / 2;
  const OUTER = 90;
  const textColor = isLight ? '#2A1E0F' : '#F5F1EA';

  const spokes = DIMENSIONS_8.map((dim, i) => {
    const rad    = (dim.angle - 90) * (Math.PI / 180);
    const score  = scores[i] ?? 0.5;
    const barLen = OUTER * 0.7 * score;
    const tipX   = CX + barLen * Math.cos(rad);
    const tipY   = CY + barLen * Math.sin(rad);
    const labX   = CX + (OUTER + 14) * Math.cos(rad);
    const labY   = CY + (OUTER + 14) * Math.sin(rad);
    return { ...dim, tipX, tipY, labX, labY, score, barLen };
  });

  const polygonPoints = spokes
    .map(s => `${s.tipX},${s.tipY}`)
    .join(' ');

  // Dashed ring ticks (36 per ring)
  const ringTicks = Array.from({ length: 36 }, (_, i) => {
    const a   = (i * 10) * (Math.PI / 180);
    const isMajor = i % 9 === 0;
    const r1  = OUTER + 12;
    const r2  = OUTER + (isMajor ? 20 : 16);
    return {
      key: i,
      x1: CX + r1 * Math.cos(a), y1: CY + r1 * Math.sin(a),
      x2: CX + r2 * Math.cos(a), y2: CY + r2 * Math.sin(a),
      sw: isMajor ? 1.6 : 0.7, so: isMajor ? 0.9 : 0.4,
    };
  });

  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }, cardStyle]}>
          {/* Static SVG base */}
          <Svg width={SIZE} height={SIZE}>
            <Defs>
              <RadialGradient id="cmpBg" cx="50%" cy="40%" r="55%">
                <Stop offset="0%" stopColor={accent} stopOpacity={0.22} />
                <Stop offset="100%" stopColor={accent} stopOpacity={0.03} />
              </RadialGradient>
              <RadialGradient id="cmpCore" cx="50%" cy="40%" r="50%">
                <Stop offset="0%" stopColor={accent} stopOpacity={0.9} />
                <Stop offset="100%" stopColor={accent} stopOpacity={0.4} />
              </RadialGradient>
            </Defs>
            {/* Background disc */}
            <Circle cx={CX} cy={CY} r={OUTER} fill="url(#cmpBg)" stroke={accent} strokeWidth={1.4} strokeOpacity={0.5} />
            {/* Grid rings */}
            {[0.25, 0.5, 0.75, 1].map((f, idx) => (
              <Circle key={idx} cx={CX} cy={CY} r={OUTER * 0.7 * f} fill="none"
                stroke={accent} strokeWidth={0.6} strokeOpacity={0.22} />
            ))}
            {/* Spoke lines (background) */}
            {spokes.map((s, i) => (
              <Line key={i}
                x1={CX} y1={CY}
                x2={CX + OUTER * 0.7 * Math.cos((s.angle - 90) * Math.PI / 180)}
                y2={CY + OUTER * 0.7 * Math.sin((s.angle - 90) * Math.PI / 180)}
                stroke={accent} strokeWidth={0.7} strokeOpacity={0.25}
              />
            ))}
            {/* Score polygon */}
            <Polygon points={polygonPoints} fill={accent + '28'} stroke={accent} strokeWidth={1.5} strokeOpacity={0.75} />
            {/* Score dots */}
            {spokes.map((s, i) => (
              <Circle key={i} cx={s.tipX} cy={s.tipY} r={3.5}
                fill={accent} opacity={0.85} />
            ))}
            {/* Center glow */}
            <Circle cx={CX} cy={CY} r={18} fill="url(#cmpCore)" />
            <Circle cx={CX} cy={CY} r={10} fill={accent} opacity={0.95} />
            {/* Week number in center */}
            <SvgText x={CX} y={CY + 4} textAnchor="middle" fontSize={9} fontWeight="700"
              fill={isLight ? '#2A1E0F' : '#05050B'} opacity={0.9}>
              {`W${weekNum}`}
            </SvgText>
            {/* Direction labels */}
            {spokes.map((s, i) => (
              <SvgText
                key={i}
                x={s.labX} y={s.labY + 4}
                textAnchor="middle"
                fontSize={8}
                fontWeight="600"
                fill={accent}
                opacity={0.85}
              >
                {s.short}
              </SvgText>
            ))}
          </Svg>
          {/* Rotating outer ring */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ringStyle]} pointerEvents="none">
            <Svg width={SIZE} height={SIZE}>
              {ringTicks.map(t => (
                <Line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                  stroke={accent} strokeWidth={t.sw} strokeOpacity={t.so} />
              ))}
              <Circle cx={CX} cy={CY} r={OUTER + 22} fill="none"
                stroke={accent} strokeWidth={1} strokeOpacity={0.3}
                strokeDasharray="4,6" />
            </Svg>
          </Animated.View>
          {/* Pulse glow */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, pulseStyle]} pointerEvents="none">
            <View style={{
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: accent + '30',
              shadowColor: accent, shadowOpacity: 0.6, shadowRadius: 10,
            }} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      <Text style={{ color: accent, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 4 }}>
        {weekLabel}
      </Text>
    </View>
  );
};

// ─── Mood Trend Chart (SVG) ───────────────────────────────────────────────────
const CHART_W = SW - PAD * 2 - 32;
const MOOD_BAR_MAX_H = 90;

const MoodBar = ({ score, index, colWidth, isLight }: {
  score: number; index: number; colWidth: number; isLight: boolean;
}) => {
  const bw = useSharedValue(0);
  const textColor = isLight ? '#4A3728' : '#B0A49A';
  const moodEmoji = score >= 80 ? '😊' : score >= 60 ? '😌' : score >= 40 ? '😐' : '😔';

  useEffect(() => {
    bw.value = withDelay(index * 80, withTiming(score, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, [score]);

  const barStyle = useAnimatedStyle(() => ({
    height: (bw.value / 100) * MOOD_BAR_MAX_H,
    backgroundColor: MOOD_COLOR(bw.value),
  }));

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
      <Animated.View style={[{ width: colWidth * 0.55, borderRadius: 4, minHeight: 4 }, barStyle]} />
      <Text style={{ fontSize: 14 }}>{moodEmoji}</Text>
          <Text style={{ color: textColor, fontSize: 9, fontWeight: '600' }}>{getDayAbbr()[index]}</Text>
    </View>
  );
};

const MoodTrendChart = ({
  scores, accent, isLight,
}: { scores: number[]; accent: string; isLight: boolean }) => {
  const COL_W   = CHART_W / 7;
  const avgScore = scores.reduce((a, b) => a + b, 0) / 7;
  const avgY     = MOOD_BAR_MAX_H - (avgScore / 100) * MOOD_BAR_MAX_H;

  return (
    <View style={{ gap: 6 }}>
      <Text style={[wr.sectionTitle, { color: isLight ? '#2A1E0F' : '#F5F1EA' }]}>NASTRÓJ TYGODNIA</Text>
      <View style={[wr.card, {
        backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)',
        borderColor: isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.10)',
        padding: 16,
      }]}>
        {/* Average line label */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 20, height: 1.5, backgroundColor: accent, opacity: 0.7 }} />
            <Text style={{ color: accent, fontSize: 10, fontWeight: '600' }}>
              Śr. {Math.round(avgScore)}%
            </Text>
          </View>
        </View>
        {/* Bar chart area */}
        <View style={{ height: MOOD_BAR_MAX_H + 28, flexDirection: 'row', alignItems: 'flex-end' }}>
          {scores.map((score, i) => (
            <MoodBar key={i} score={score} index={i} colWidth={COL_W} isLight={isLight} />
          ))}
        </View>
        {/* Avg line overlay using SVG */}
        <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', top: 38, paddingHorizontal: 16 }]}>
          <Svg width={CHART_W} height={MOOD_BAR_MAX_H} style={{ position: 'absolute', top: 0 }}>
            <Line
              x1={0} y1={avgY} x2={CHART_W} y2={avgY}
              stroke={accent} strokeWidth={1.2} strokeOpacity={0.55}
              strokeDasharray="5,4"
            />
          </Svg>
        </View>
      </View>
    </View>
  );
};

// ─── Practice Timeline ────────────────────────────────────────────────────────
const PRACTICE_TYPES = [
  { key: 'journal',    emoji: '📓', label: 'Dziennik',  color: '#60A5FA' },
  { key: 'meditation', emoji: '🧘', label: 'Medytacja', color: '#A78BFA' },
  { key: 'tarot',      emoji: '🃏', label: 'Tarot',     color: '#CEAE72' },
  { key: 'ritual',     emoji: '🕯️', label: 'Rytuał',    color: '#F472B6' },
  { key: 'oracle',     emoji: '🔮', label: 'Oracle',    color: '#34D399' },
];

const PracticeDot = ({ color, delay, isLight }: { color: string; delay: number; isLight: boolean }) => {
  const sv = useSharedValue(0);

  useEffect(() => {
    sv.value = withDelay(delay, withSpring(1, { damping: 8, stiffness: 260 }));
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sv.value }],
    opacity: sv.value,
  }));

  return (
    <Animated.View style={[{
      width: 16, height: 16, borderRadius: 8,
      backgroundColor: color,
      shadowColor: color, shadowOpacity: 0.6, shadowRadius: 4,
    }, dotStyle]} />
  );
};

const PracticeTimeline = ({
  grid, accent, isLight,
}: { grid: Record<string, boolean[]>; accent: string; isLight: boolean }) => {
  const textColor = isLight ? '#2A1E0F' : '#F5F1EA';
  const subColor  = isLight ? '#6A5A48' : '#8A8080';

  return (
    <View style={{ gap: 6 }}>
      <Text style={[wr.sectionTitle, { color: textColor }]}>PRAKTYKI TYGODNIA</Text>
      <View style={[wr.card, {
        backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)',
        borderColor: isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.10)',
        padding: 14,
        gap: 10,
      }]}>
        {/* Day header */}
        <View style={{ flexDirection: 'row', paddingLeft: 72 }}>
          {getDayAbbr().map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: subColor, fontSize: 9, fontWeight: '700' }}>{d}</Text>
            </View>
          ))}
        </View>
        {/* Rows */}
        {PRACTICE_TYPES.map((pt, ri) => (
          <View key={pt.key} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 72, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 14 }}>{pt.emoji}</Text>
              <Text style={{ color: subColor, fontSize: 9, fontWeight: '600', flex: 1 }}>{pt.label}</Text>
            </View>
            {Array.from({ length: 7 }, (_, ci) => {
              const hasIt = grid[pt.key]?.[ci] ?? false;
              return (
                <View key={ci} style={{ flex: 1, alignItems: 'center' }}>
                  {hasIt ? (
                    <PracticeDot color={pt.color} delay={(ri * 7 + ci) * 40} isLight={isLight} />
                  ) : (
                    <View style={{
                      width: 8, height: 8, borderRadius: 4,
                      backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)',
                    }} />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Energy Radar Chart ───────────────────────────────────────────────────────
const RADAR_AXES = [
  { label: 'Fizyczna',    angle: -90  },
  { label: 'Emocjonalna', angle: -30  },
  { label: 'Duchowa',     angle: 30   },
  { label: 'Mentalna',    angle: 90   },
  { label: 'Kreatywna',   angle: 150  },
  { label: 'Społeczna',   angle: 210  },
];

// Module-level constants so worklets can capture them safely
const RADAR_SIZE = SW - PAD * 2 - 32;
const RADAR_CX   = RADAR_SIZE / 2;
const RADAR_CY   = RADAR_SIZE / 2 + 10;
const RADAR_R    = Math.min(RADAR_SIZE / 2, 100) - 28;
const RADAR_RADS = [-90, -30, 30, 90, 150, 210].map(a => a * (Math.PI / 180));

function makeRadarPolygon(scores: number[], frac: number): string {
  'worklet';
  return scores.map((v, i) => {
    const val = v * frac;
    return `${RADAR_CX + RADAR_R * val * Math.cos(RADAR_RADS[i])},${RADAR_CY + RADAR_R * val * Math.sin(RADAR_RADS[i])}`;
  }).join(' ');
}

const EnergyRadar = ({
  current, previous, accent, isLight,
}: { current: number[]; previous: number[]; accent: string; isLight: boolean }) => {
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
  }, [JSON.stringify(current)]);

  const SIZE = RADAR_SIZE;
  const CX   = RADAR_CX;
  const CY   = RADAR_CY;
  const R    = RADAR_R;

  // For static rendering (axis lines, labels), use module-level helpers
  const getPoint = (scores: number[], idx: number, frac: number = 1) => {
    const rad = RADAR_RADS[idx];
    const val = scores[idx] * frac;
    return { x: CX + R * val * Math.cos(rad), y: CY + R * val * Math.sin(rad) };
  };

  const curPolyStyle = useAnimatedProps(() => ({
    points: makeRadarPolygon(current, progress.value),
  }));
  const prevPolyStyle = useAnimatedProps(() => ({
    points: makeRadarPolygon(previous, progress.value),
  }));

  const textColor = isLight ? '#2A1E0F' : '#F5F1EA';
  const gridColor = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)';

  return (
    <View style={{ gap: 6 }}>
      <Text style={[wr.sectionTitle, { color: textColor }]}>MAPA ENERGII</Text>
      <View style={[wr.card, {
        backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)',
        borderColor: isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.10)',
        padding: 16,
      }]}>
        <Svg width={SIZE} height={SIZE * 0.85}>
          <Defs>
            <RadialGradient id="rdrGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={accent} stopOpacity={0.15} />
              <Stop offset="100%" stopColor={accent} stopOpacity={0.0} />
            </RadialGradient>
          </Defs>
          {/* Grid rings */}
          {[0.25, 0.5, 0.75, 1].map((f, i) => (
            <Polygon
              key={i}
              points={makeRadarPolygon(Array(6).fill(f), 1)}
              fill={i === 3 ? "url(#rdrGrad)" : "none"}
              stroke={gridColor}
              strokeWidth={i === 3 ? 1.2 : 0.8}
            />
          ))}
          {/* Axis lines */}
          {RADAR_AXES.map((ax, i) => {
            const p = getPoint(Array(6).fill(1), i);
            return <Line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y}
              stroke={gridColor} strokeWidth={0.9} />;
          })}
          {/* Previous week polygon */}
          <AnimatedPolygon
            animatedProps={prevPolyStyle}
            fill="rgba(129,140,248,0.12)"
            stroke="#818CF8"
            strokeWidth={1.3}
            strokeOpacity={0.6}
          />
          {/* Current week polygon */}
          <AnimatedPolygon
            animatedProps={curPolyStyle}
            fill={accent + '25'}
            stroke={accent}
            strokeWidth={2}
            strokeOpacity={0.85}
          />
          {/* Axis labels */}
          {RADAR_AXES.map((ax, i) => {
            const p = getPoint(Array(6).fill(1.22), i);
            return (
              <SvgText key={i} x={p.x} y={p.y + 4}
                textAnchor="middle" fontSize={9} fontWeight="600"
                fill={isLight ? '#4A3728' : '#B0A49A'}>
                {ax.label}
              </SvgText>
            );
          })}
        </Svg>
        {/* Legend */}
        <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 18, height: 2, backgroundColor: accent, borderRadius: 1 }} />
            <Text style={{ color: isLight ? '#4A3728' : '#B0A49A', fontSize: 10, fontWeight: '600' }}>Ten tydzień</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 18, height: 2, backgroundColor: '#818CF8', borderRadius: 1 }} />
            <Text style={{ color: isLight ? '#4A3728' : '#B0A49A', fontSize: 10, fontWeight: '600' }}>Poprzedni</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── Top Moments ─────────────────────────────────────────────────────────────
const TopMoments = ({
  bestMoodDay, longestMedMin, mostJournalWords, accent, isLight,
}: {
  bestMoodDay: string; longestMedMin: number; mostJournalWords: number;
  accent: string; isLight: boolean;
}) => {
  const textColor = isLight ? '#2A1E0F' : '#F5F1EA';
  const subColor  = isLight ? '#6A5A48' : '#8A8080';
  const cardBg    = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)';
  const cardBdr   = isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.10)';

  const items = [
    { emoji: '⭐', label: 'Najlepszy dzień', value: bestMoodDay || '—', color: '#CEAE72' },
    { emoji: '🧘', label: 'Najdłuższa medytacja', value: longestMedMin > 0 ? `${longestMedMin} min` : '—', color: '#A78BFA' },
    { emoji: '📓', label: 'Rekord słów', value: mostJournalWords > 0 ? `${mostJournalWords} słów` : '—', color: '#60A5FA' },
  ];

  return (
    <View style={{ gap: 6 }}>
      <Text style={[wr.sectionTitle, { color: textColor }]}>SZCZYTOWE MOMENTY</Text>
      <View style={{ gap: 8 }}>
        {items.map((item, i) => (
          <View key={i}>
            <View style={[wr.card, {
              backgroundColor: cardBg, borderColor: cardBdr,
              flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
            }]}>
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: item.color + '22',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: subColor, fontSize: 10, fontWeight: '600', letterSpacing: 0.8 }}>
                  {item.label.toUpperCase()}
                </Text>
                <Text style={{ color: textColor, fontSize: 15, fontWeight: '700', marginTop: 2 }}>
                  {item.value}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Achievements ─────────────────────────────────────────────────────────────
const BADGE_TEMPLATES = [
  { id: 'perfect_week', emoji: '🏆', label: 'Perfekcyjny tydzień', condition: (stats) => stats.practiceDays >= 7 },
  { id: 'streak5',      emoji: '🔥', label: 'Pasmo 5 dni',         condition: (stats) => stats.currentStreak >= 5 },
  { id: 'journal3',     emoji: '📝', label: 'Pisarz duszy',         condition: (stats) => stats.journalDays >= 3 },
  { id: 'medit3',       emoji: '🧘', label: 'Medytujący',           condition: (stats) => stats.meditDays >= 3 },
  { id: 'mood_up',      emoji: '📈', label: 'Wzrost nastroju',      condition: (stats) => stats.moodTrend > 0 },
  { id: 'explorer',     emoji: '🌟', label: 'Odkrywca rytuałów',    condition: (stats) => stats.ritualDays >= 2 },
];

const Achievements = ({
  stats, accent, isLight,
}: { stats: any; accent: string; isLight: boolean }) => {
  const unlocked = BADGE_TEMPLATES.filter(b => b.condition(stats));
  if (unlocked.length === 0) return null;

  const textColor = isLight ? '#2A1E0F' : '#F5F1EA';
  const cardBg    = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)';
  const cardBdr   = isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.10)';

  return (
    <View style={{ gap: 6 }}>
      <Text style={[wr.sectionTitle, { color: textColor }]}>ODZNAKI TYGODNIA</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {unlocked.map((b, i) => (
          <View key={b.id}>
            <LinearGradient
              colors={[accent + '22', accent + '0A']}
              style={[wr.card, {
                borderColor: accent + '55',
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 14, paddingVertical: 10, gap: 8,
              }]}>
              <Text style={{ fontSize: 22 }}>{b.emoji}</Text>
              <Text style={{ color: textColor, fontSize: 12, fontWeight: '700' }}>{b.label}</Text>
            </LinearGradient>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── AI Insights Card ─────────────────────────────────────────────────────────
const AIInsightsCard = ({
  weekDates, moodScores, practiceDays, userData, accent, isLight,
}: {
  weekDates: Date[]; moodScores: number[]; practiceDays: number;
  userData: any; accent: string; isLight: boolean;
}) => {
  const [loading, setLoading]   = useState(false);
  const [insight, setInsight]   = useState<string | null>(null);
  const [error, setError]       = useState(false);
  const textColor = isLight ? '#2A1E0F' : '#F5F1EA';
  const subColor  = isLight ? '#6A5A48' : '#8A8080';
  const cardBg    = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)';

  const fetchInsight = async () => {
    setLoading(true);
    setError(false);
    try {
      const avgMood = Math.round(moodScores.reduce((a, b) => a + b, 0) / 7);
      const localeCode = getLocaleCode();
      const dayAbbr = getDayAbbr();
      const weekStr = weekDates.map(d => d.toLocaleDateString(localeCode, { weekday: 'short', day: 'numeric', month: 'short' })).join(', ');
      const messages = [
        {
          role: 'system',
          content: i18n.t(
            'weeklyReport.oracle.systemPrompt',
            'Jesteś duchowym przewodnikiem Oracle w aplikacji Aethera. Mówisz z ciepłą, mistyczną energią. Jesteś zwięzły i głęboki — każde zdanie ma znaczenie.',
          ) as string,
        },
        {
          role: 'user',
          content: i18n.t(
            'weeklyReport.oracle.userPrompt',
            `Przeanalizuj mój tydzień duchowy:
- Imię: ${userData?.name || 'Wędrowiec'}
- Tydzień: ${weekStr}
- Dni praktyki: ${practiceDays}/7
- Średni nastrój: ${avgMood}%
- Nastroje dzienne: ${moodScores.map((s, i) => `${dayAbbr[i]}: ${s}%`).join(', ')}

Napisz:
1. Krótkie PRZESŁANIE DUSZY — poetycki, osobisty wgląd w ten tydzień (2-3 zdania)
2. OBSERWACJA 1: konkretna obserwacja z danych
3. OBSERWACJA 2: wzorzec energetyczny
4. OBSERWACJA 3: co czeka na uwagę
5. TYDZIEŃ PRZED TOBĄ: jedno zdanie wytycznej

Format: używaj nagłówków PRZESŁANIE DUSZY:, OBSERWACJA 1:, OBSERWACJA 2:, OBSERWACJA 3:, TYDZIEŃ PRZED TOBĄ:`,
          ) as string,
        },
      ];
      const resp = await AiService.chatWithOracle(messages, i18n.language?.slice(0, 2) || 'pl');
      setInsight(resp);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!insight && !loading) {
    return (
      <Pressable
        onPress={() => { HapticsService.impact('medium'); fetchInsight(); }}
        style={[wr.card, {
          backgroundColor: cardBg,
          borderColor: accent + '55',
          alignItems: 'center',
          padding: 20, gap: 10,
        }]}>
        <Sparkles size={28} color={accent} />
        <Text style={{ color: textColor, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
          Poznaj swój tydzień z Oracle
        </Text>
        <Text style={{ color: subColor, fontSize: 12.5, textAlign: 'center', lineHeight: 19 }}>
          Odkryj głębszy sens swojego tygodnia — wzorce, lekcje i wskazówki na przyszłość
        </Text>
        <LinearGradient
          colors={[accent, accent + 'BB']}
          style={{ paddingHorizontal: 28, paddingVertical: 11, borderRadius: 999, marginTop: 4 }}>
          <Text style={{ color: '#1A1000', fontSize: 13.5, fontWeight: '700' }}>Wezwij Oracle ✦</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  if (loading) {
    return (
      <View style={[wr.card, {
        backgroundColor: cardBg, borderColor: accent + '44',
        padding: 24, alignItems: 'center', gap: 12,
      }]}>
        <ActivityIndicator color={accent} size="small" />
        <Text style={{ color: subColor, fontSize: 13, fontStyle: 'italic' }}>
          Oracle analizuje Twój tydzień…
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[wr.card, {
        backgroundColor: cardBg, borderColor: accent + '44',
        padding: 20, gap: 10,
      }]}>
        <Text style={{ color: '#E8705A', fontSize: 13, textAlign: 'center' }}>
          Nie udało się połączyć z Oracle. Spróbuj ponownie.
        </Text>
        <Pressable onPress={() => { HapticsService.impact('light'); fetchInsight(); }}
          style={{ alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} color={accent} />
            <Text style={{ color: accent, fontSize: 13, fontWeight: '600' }}>Ponów</Text>
          </View>
        </Pressable>
      </View>
    );
  }

  // Parse sections
  const sections = [
    { key: 'PRZESŁANIE DUSZY', color: accent },
    { key: 'OBSERWACJA 1',     color: '#60A5FA' },
    { key: 'OBSERWACJA 2',     color: '#A78BFA' },
    { key: 'OBSERWACJA 3',     color: '#34D399' },
    { key: 'TYDZIEŃ PRZED TOBĄ', color: '#F472B6' },
  ];

  const parsed = sections.map(s => {
    const regex = new RegExp(`${s.key}:\\s*([\\s\\S]*?)(?=(?:${sections.map(x => x.key + ':').join('|')})|$)`, 'i');
    const m = insight?.match(regex);
    return { ...s, text: m ? m[1].trim() : '' };
  }).filter(s => s.text.length > 0);

  return (
    <View style={{ gap: 10 }}>
      {parsed.map((s, i) => (
        <View key={s.key}>
          <View style={[wr.card, {
            backgroundColor: cardBg,
            borderColor: s.color + '44',
            borderLeftWidth: 3,
            borderLeftColor: s.color,
            padding: 14, gap: 5,
          }]}>
            <Text style={{ color: s.color, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }}>
              {s.key.toUpperCase()}
            </Text>
            <Text style={{ color: textColor, fontSize: 13.5, lineHeight: 21 }}>
              {s.text}
            </Text>
          </View>
        </View>
      ))}
      <Pressable
        onPress={() => { HapticsService.impact('light'); setInsight(null); }}
        style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 }}>
        <RefreshCw size={12} color={subColor} />
        <Text style={{ color: subColor, fontSize: 11 }}>Odśwież</Text>
      </Pressable>
    </View>
  );
};

// ─── Weekly Affirmation ───────────────────────────────────────────────────────
const WEEK_AFFIRMATIONS = [
  'Każdy dzień tego tygodnia jest krokiem ku pełniejszemu "ja".',
  'Noszę w sobie mądrość wszystkich przeżytych chwil.',
  'Otwieram się na lekcje, które przynosi mi ten czas.',
  'Moja dusza rośnie w rytmie codziennych praktyk.',
  'Jestem dokładnie tam, gdzie powinienem/powinnam być.',
  'Ten tydzień ujawni mi piękno mojej wewnętrznej podróży.',
  'Z każdą chwilą staję się bliżej siebie.',
  'Duchowość to nie cel — to sposób bycia w każdej chwili.',
];

const WeeklyAffirmationCard = ({
  weekNum, accent, isLight,
}: { weekNum: number; accent: string; isLight: boolean }) => {
  const affirmation = WEEK_AFFIRMATIONS[weekNum % WEEK_AFFIRMATIONS.length];
  const pulse = useSharedValue(0.92);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 2600 }), withTiming(0.92, { duration: 2600 })),
      -1, true,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={{ gap: 6 }}>
      <Text style={[wr.sectionTitle, { color: isLight ? '#2A1E0F' : '#F5F1EA' }]}>AFIRMACJA TYGODNIA</Text>
      <LinearGradient
        colors={[accent + '22', accent + '0A', 'transparent']}
        style={[wr.card, { borderColor: accent + '55', padding: 22, alignItems: 'center', gap: 10 }]}>
        <Animated.View style={glowStyle}>
          <Text style={{ fontSize: 28 }}>✦</Text>
        </Animated.View>
        <Text style={{
          color: isLight ? '#2A1E0F' : '#F5F1EA',
          fontSize: 15.5, fontStyle: 'italic', textAlign: 'center',
          lineHeight: 25, letterSpacing: 0.3,
        }}>
          "{affirmation}"
        </Text>
      </LinearGradient>
    </View>
  );
};

// ─── Summary Stats Row ────────────────────────────────────────────────────────
const StatMiniCard = ({
  label, value, emoji, color, isLight,
}: { label: string; value: string; emoji: string; color: string; isLight: boolean }) => (
  <View style={[wr.statCard, {
    backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)',
    borderColor: color + '33',
  }]}>
    <Text style={{ fontSize: 18 }}>{emoji}</Text>
    <Text style={{ color: color, fontSize: 16, fontWeight: '800' }}>{value}</Text>
    <Text style={{ color: isLight ? '#6A5A48' : '#8A8080', fontSize: 9, fontWeight: '600', textAlign: 'center', lineHeight: 13 }}>
      {label}
    </Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const WeeklyReportScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets   = useSafeAreaInsets();
  const { themeName, userData, meditationSessions, breathworkSessions,
          streaks, dailyProgress, addFavoriteItem, isFavoriteItem, removeFavoriteItem } = useAppStore();
  const { entries: journalEntries } = useJournalStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight  = currentTheme.background.startsWith('#F');
  const accent   = ACCENT;
  const textColor = isLight ? '#2A1E0F' : '#F5F1EA';
  const subColor  = isLight ? '#6A5A48' : '#8A8080';
  const cardBg    = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)';
  const cardBdr   = isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.10)';
  const bgColors: [string, string, string] = isLight
    ? ['#FAF6EE', '#F5EDD8', '#FAF6EE']
    : ['#07060F', '#0E0B1A', '#07060F'];

  const [weekOffset, setWeekOffset] = useState(0);

  const weekDates  = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const weekNum    = useMemo(() => isoWeek(weekDates[0]), [weekDates]);
  const weekLabel  = useMemo(() => {
  const localeCode = getLocaleCode();
  const start = weekDates[0].toLocaleDateString(localeCode, { day: 'numeric', month: 'short' });
  const end   = weekDates[6].toLocaleDateString(localeCode, { day: 'numeric', month: 'short' });
    return `${start} — ${end}`;
  }, [weekDates]);

  // ── Data computations ───────────────────────────────────────────────────────
  const weekDateStrs = useMemo(() => weekDates.map(fmtDate), [weekDates]);

  const moodScores = useMemo(() =>
    weekDateStrs.map(d => {
      const dp  = dailyProgress[d];
      if (!dp?.mood) return 50;
      return MOOD_SCORE[dp.mood] ?? 50;
    }),
    [weekDateStrs, dailyProgress],
  );

  const prevWeekDates   = useMemo(() => getWeekDates(weekOffset - 1), [weekOffset]);
  const prevWeekStrs    = useMemo(() => prevWeekDates.map(fmtDate), [prevWeekDates]);

  const practiceDays = useMemo(() =>
    weekDateStrs.filter(d => {
      const dp = dailyProgress[d];
      return dp && (dp.tarotDrawn || dp.journalWritten || dp.ritualCompleted || dp.affirmationRead);
    }).length,
    [weekDateStrs, dailyProgress],
  );

  const journalDays = useMemo(() =>
    weekDateStrs.filter(d => dailyProgress[d]?.journalWritten).length,
    [weekDateStrs, dailyProgress],
  );

  const meditDays = useMemo(() =>
    weekDateStrs.filter(d =>
      meditationSessions.some(s => s.date === d)
    ).length,
    [weekDateStrs, meditationSessions],
  );

  const ritualDays = useMemo(() =>
    weekDateStrs.filter(d => dailyProgress[d]?.ritualCompleted).length,
    [weekDateStrs, dailyProgress],
  );

  const avgMoodScore = useMemo(() =>
    Math.round(moodScores.reduce((a, b) => a + b, 0) / 7),
    [moodScores],
  );

  const moodTrend = useMemo(() => {
    const prevScores = prevWeekStrs.map(d => {
      const dp = dailyProgress[d];
      if (!dp?.mood) return 50;
      return MOOD_SCORE[dp.mood] ?? 50;
    });
    const prevAvg = prevScores.reduce((a, b) => a + b, 0) / 7;
    return avgMoodScore - prevAvg;
  }, [avgMoodScore, prevWeekStrs, dailyProgress]);

  const longestMedMin = useMemo(() => {
    const thisWeek = meditationSessions.filter(s => weekDateStrs.includes(s.date));
    if (thisWeek.length === 0) return 0;
    return Math.max(...thisWeek.map(s => s.durationMinutes));
  }, [meditationSessions, weekDateStrs]);

  const mostJournalWords = useMemo(() => {
    if (!journalEntries) return 0;
    const thisWeek = journalEntries.filter(e => weekDateStrs.includes(e.date?.slice(0, 10)));
    if (thisWeek.length === 0) return 0;
    return Math.max(...thisWeek.map(e => (e.content || '').split(/\s+/).filter(Boolean).length));
  }, [journalEntries, weekDateStrs]);

  const bestMoodDay = useMemo(() => {
    let best = -1, bestIdx = -1;
    moodScores.forEach((s, i) => { if (s > best) { best = s; bestIdx = i; } });
    if (bestIdx < 0) return '—';
    return weekDates[bestIdx].toLocaleDateString(localeCode, { weekday: 'long', day: 'numeric', month: 'short' });
  }, [moodScores, weekDates]);

  const practiceGrid = useMemo(() => ({
    journal:    weekDateStrs.map(d => !!dailyProgress[d]?.journalWritten),
    meditation: weekDateStrs.map(d => meditationSessions.some(s => s.date === d)),
    tarot:      weekDateStrs.map(d => !!dailyProgress[d]?.tarotDrawn),
    ritual:     weekDateStrs.map(d => !!dailyProgress[d]?.ritualCompleted),
    oracle:     weekDateStrs.map(d => !!dailyProgress[d]?.affirmationRead),
  }), [weekDateStrs, dailyProgress, meditationSessions]);

  // Compass scores — derived from various data points (0.0 – 1.0)
  const compassScores = useMemo(() => {
    const breathDays = weekDateStrs.filter(d =>
      breathworkSessions?.some(s => s.date === d)
    ).length;
    return [
      Math.min(1, (breathDays + practiceDays * 0.15) / 7),   // Ciało
      Math.min(1, (practiceDays / 7) * 0.9 + 0.1),           // Duch
      Math.min(1, journalDays / 7 + 0.2),                     // Umysł
      Math.min(1, avgMoodScore / 100),                        // Serce
      Math.min(1, 0.4 + (practiceDays / 7) * 0.4),           // Relacje
      Math.min(1, ritualDays / 7 + 0.3),                      // Praca
      Math.min(1, journalDays / 7 * 0.6 + 0.25),             // Kreatywność
      Math.min(1, meditDays / 7 + 0.2),                      // Intuicja
    ];
  }, [weekDateStrs, breathworkSessions, practiceDays, journalDays, avgMoodScore, ritualDays, meditDays]);

  const radarCurrent = useMemo(() => [
    Math.min(1, practiceDays / 7),
    Math.min(1, avgMoodScore / 100),
    Math.min(1, meditationSessions.filter(s => weekDateStrs.includes(s.date)).length / 7 + 0.1),
    Math.min(1, journalDays / 7 + 0.2),
    Math.min(1, ritualDays / 7 + 0.25),
    Math.min(1, 0.5 + (practiceDays / 7) * 0.3),
  ], [practiceDays, avgMoodScore, journalDays, ritualDays, meditationSessions, weekDateStrs]);

  const radarPrevious = useMemo(() => {
    const pd = prevWeekStrs.filter(d => {
      const dp = dailyProgress[d];
      return dp && (dp.tarotDrawn || dp.journalWritten || dp.ritualCompleted);
    }).length;
    const pm = meditationSessions.filter(s => prevWeekStrs.includes(s.date)).length;
    const pj = prevWeekStrs.filter(d => dailyProgress[d]?.journalWritten).length;
    const pr = prevWeekStrs.filter(d => dailyProgress[d]?.ritualCompleted).length;
    const prevScores = prevWeekStrs.map(d => {
      const dp = dailyProgress[d];
      return dp?.mood ? (MOOD_SCORE[dp.mood] ?? 50) : 50;
    });
    const pmAvg = prevScores.reduce((a, b) => a + b, 0) / 7;
    return [
      Math.min(1, pd / 7),
      Math.min(1, pmAvg / 100),
      Math.min(1, pm / 7 + 0.1),
      Math.min(1, pj / 7 + 0.2),
      Math.min(1, pr / 7 + 0.25),
      Math.min(1, 0.5 + (pd / 7) * 0.3),
    ];
  }, [prevWeekStrs, dailyProgress, meditationSessions]);

  const achieveStats = useMemo(() => ({
    practiceDays, journalDays, meditDays, ritualDays,
    currentStreak: streaks.current, moodTrend,
  }), [practiceDays, journalDays, meditDays, ritualDays, streaks, moodTrend]);

  const isFav = isFavoriteItem('weekly-report');

  const handleAddFavorite = () => {
    HapticsService.impact('light');
    if (isFav) {
      removeFavoriteItem('weekly-report');
    } else {
      addFavoriteItem({ id: 'weekly-report', label: resolveUserFacingText('Raport Tygodniowy'), route: 'WeeklyReport', params: {}, icon: 'TrendingUp', color: ACCENT, addedAt: new Date().toISOString() });
    }
  };

  const moodTrendStr = moodTrend > 0
    ? `+${Math.round(moodTrend)}%`
    : `${Math.round(moodTrend)}%`;
  const moodTrendColor = moodTrend >= 0 ? '#34D399' : '#E8705A';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
      <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} />

      {/* Ambient stars */}
      {!isLight && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={SW} height={800} style={{ position: 'absolute', top: 0 }}>
            <G opacity={0.35}>
              {Array.from({ length: 40 }, (_, i) => (
                <Circle
                  key={i}
                  cx={(i * 137.5 + 20) % SW}
                  cy={(i * 89.3 + 15) % 700}
                  r={i % 5 === 0 ? 1.6 : 0.9}
                  fill={accent}
                  opacity={0.3 + (i % 4) * 0.1}
                />
              ))}
            </G>
          </Svg>
        </View>
      )}

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* ── Header ── */}
        <View style={wr.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} hitSlop={14} style={wr.headerBtn}>
            <ChevronLeft size={22} color={accent} />
          </Pressable>
          <Text style={[wr.headerTitle, { color: textColor }]}>✦ RAPORT TYGODNIOWY</Text>
          <Pressable onPress={handleAddFavorite} hitSlop={14} style={wr.headerBtn}>
            <Star size={20} color={accent} fill={isFav ? accent : 'transparent'} strokeWidth={1.5} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}>

          {/* ── Week Selector ── */}
          <View style={wr.weekSelector}>
            <Pressable
              onPress={() => { HapticsService.impact('light'); setWeekOffset(o => o - 1); }}
              style={[wr.weekArrow, { borderColor: accent + '44', backgroundColor: accent + '11' }]}>
              <ChevronLeft size={18} color={accent} />
            </Pressable>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ color: accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
                TYDZIEŃ {weekNum}
              </Text>
              <Text style={{ color: subColor, fontSize: 12.5, fontWeight: '500', marginTop: 2 }}>
                {weekLabel}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                if (weekOffset < 0) { HapticsService.impact('light'); setWeekOffset(o => o + 1); }
              }}
              style={[wr.weekArrow, {
                borderColor: weekOffset < 0 ? accent + '44' : accent + '22',
                backgroundColor: weekOffset < 0 ? accent + '11' : accent + '08',
                opacity: weekOffset < 0 ? 1 : 0.4,
              }]}>
              <ChevronRight size={18} color={accent} />
            </Pressable>
          </View>

          {/* ── CosmicCompass Widget ── */}
          <Animated.View entering={FadeInDown.duration(500)}>
            <CosmicCompass
              accent={accent}
              scores={compassScores}
              weekNum={weekNum}
              weekLabel={weekLabel}
              isLight={isLight}
            />
          </Animated.View>

          {/* Dimension labels row */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            {DIMENSIONS_8.map((d, i) => (
              <View key={d.label} style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: 8, paddingVertical: 3,
                borderRadius: 999, borderWidth: 1,
                borderColor: accent + '33',
                backgroundColor: accent + '0A',
              }}>
                <View style={{
                  width: 7, height: 7, borderRadius: 3.5,
                  backgroundColor: accent,
                  opacity: 0.5 + compassScores[i] * 0.5,
                }} />
                <Text style={{ color: isLight ? '#6A5A48' : '#A09085', fontSize: 9.5, fontWeight: '600' }}>
                  {d.label}
                </Text>
              </View>
            ))}
          </View>

          {/* ── Summary Stats Row ── */}
          <Animated.View entering={FadeInDown.delay(80).duration(400)}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              <StatMiniCard
                label={'Dni\npraktyki'}
                value={`${practiceDays}/7`}
                emoji="🌟"
                color={accent}
                isLight={isLight}
              />
              <StatMiniCard
                label={'Seria\ndni'}
                value={`${streaks.current}`}
                emoji="🔥"
                color="#F97316"
                isLight={isLight}
              />
              <StatMiniCard
                label={'Nastrój\nśredni'}
                value={`${avgMoodScore}%`}
                emoji="💫"
                color={moodTrendColor}
                isLight={isLight}
              />
              <StatMiniCard
                label={'Wpisy\ndziennik'}
                value={`${journalDays}`}
                emoji="📓"
                color="#60A5FA"
                isLight={isLight}
              />
            </View>
          </Animated.View>

          {/* Trend pill */}
          {Math.abs(moodTrend) >= 1 && (
            <Animated.View entering={FadeInDown.delay(120).duration(380)}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 6, marginBottom: 20,
              }}>
                <TrendingUp size={14} color={moodTrendColor} />
                <Text style={{ color: moodTrendColor, fontSize: 12, fontWeight: '700' }}>
                  Nastrój {moodTrend > 0 ? 'wzrósł' : 'spadł'} o {Math.abs(Math.round(moodTrend))}% względem poprzedniego tygodnia
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ── Mood Trend Chart ── */}
          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={{ marginBottom: 20 }}>
            <MoodTrendChart scores={moodScores} accent={accent} isLight={isLight} />
          </Animated.View>

          {/* ── Practice Timeline ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ marginBottom: 20 }}>
            <PracticeTimeline grid={practiceGrid} accent={accent} isLight={isLight} />
          </Animated.View>

          {/* ── Energy Radar ── */}
          <Animated.View entering={FadeInDown.delay(240).duration(400)} style={{ marginBottom: 20 }}>
            <EnergyRadar
              current={radarCurrent}
              previous={radarPrevious}
              accent={accent}
              isLight={isLight}
            />
          </Animated.View>

          {/* ── AI Oracle Insights ── */}
          <Animated.View entering={FadeInDown.delay(280).duration(400)} style={{ marginBottom: 20 }}>
            <Text style={[wr.sectionTitle, { color: textColor, marginBottom: 6 }]}>ORACLE INSIGHTS</Text>
            <AIInsightsCard
              weekDates={weekDates}
              moodScores={moodScores}
              practiceDays={practiceDays}
              userData={userData}
              accent={accent}
              isLight={isLight}
            />
          </Animated.View>

          {/* ── Top Moments ── */}
          <Animated.View entering={FadeInDown.delay(320).duration(400)} style={{ marginBottom: 20 }}>
            <TopMoments
              bestMoodDay={bestMoodDay}
              longestMedMin={longestMedMin}
              mostJournalWords={mostJournalWords}
              accent={accent}
              isLight={isLight}
            />
          </Animated.View>

          {/* ── Achievements ── */}
          <Animated.View entering={FadeInDown.delay(360).duration(400)} style={{ marginBottom: 20 }}>
            <Achievements stats={achieveStats} accent={accent} isLight={isLight} />
          </Animated.View>

          {/* ── Weekly Affirmation ── */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={{ marginBottom: 20 }}>
            <WeeklyAffirmationCard weekNum={weekNum} accent={accent} isLight={isLight} />
          </Animated.View>

          {/* ── Bottom actions ── */}
          <Animated.View entering={FadeInDown.delay(440).duration(400)}>
            <View style={[wr.card, {
              backgroundColor: cardBg, borderColor: cardBdr,
              flexDirection: 'row', justifyContent: 'space-around',
              padding: 16,
            }]}>
              {[
                { emoji: '📓', label: 'Dziennik', route: 'Journal' },
                { emoji: '🧘', label: 'Medytacja', route: 'Meditation' },
                { emoji: '🔮', label: 'Oracle', route: 'OraclePortal' },
              ].map((action, i) => (
                <Pressable
                  key={action.route}
                  onPress={() => { HapticsService.impact('light'); navigation.navigate(action.route); }}
                  style={{ alignItems: 'center', gap: 5 }}>
                  <View style={{
                    width: 42, height: 42, borderRadius: 21,
                    backgroundColor: accent + '18',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 18 }}>{action.emoji}</Text>
                  </View>
                  <Text style={{ color: subColor, fontSize: 10.5, fontWeight: '600' }}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          <EndOfContentSpacer />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const wr = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: PAD, paddingTop: 8, paddingBottom: 12,
  },
  headerTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 2.2 },
  headerBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  weekSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 8, paddingHorizontal: 4,
  },
  weekArrow: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 2,
  },
  card: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  statCard: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, paddingHorizontal: 4, gap: 4,
  },
});
