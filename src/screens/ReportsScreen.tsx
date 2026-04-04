// @ts-nocheck
import React, { useMemo, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator, Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getLocaleCode } from '../core/utils/localeFormat';
import Svg, {
  Polyline, Circle as SvgCircle, Line as SvgLine, Polygon,
  Text as SvgText, Path, Rect, G, Defs, RadialGradient as SvgRadialGradient,
  Stop, ClipPath,
} from 'react-native-svg';
import { useAppStore } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { PatternInsightService } from '../core/services/patternInsight.service';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { Typography } from '../components/Typography';
import {
  Brain, ChevronLeft, Sparkles, TrendingUp, Compass, Star, HeartHandshake,
  ShieldAlert, ArrowRight, WandSparkles, Orbit, MoonStar, Gem, Waves, Crown,
  BarChart3, Hash, Clock, Trophy, Share2, Flame, Calendar, Zap, Target,
  TrendingDown, Minus, BookOpen, Activity, Sun, Wind, Droplets, Eye,
  Users, Music, Layers, RefreshCw,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { MoodConstellation } from '../features/profile/components/MoodConstellation';
import { getMoonPhase } from '../core/utils/date';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { resolveUserFacingText } from '../core/utils/contentResolver';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');

interface SoulReportSection {
  title: string;
  content: string;
  icon: string;
}

// ── Mood Chart (7-day SVG polyline) ──────────────────────────────
const MOOD_SCORE: Record<string, number> = {
  Znakomita: 5, excellent: 5,
  Dobra: 4, good: 4,
  Spokojna: 3, neutral: 3,
  Słaba: 2, bad: 2,
  Trudna: 1, terrible: 1,
};

const MoodChart = ({ entries, accent, textColor, subColor }: any) => {
  const W = SW - 44;
  const H = 90;
  const PAD = 12;
  const chartW = W - PAD * 2;
  const chartH = H - PAD * 2;

  const points = useMemo(() => {
    const now = Date.now();
    const days: number[] = Array(7).fill(3);
    for (const entry of entries) {
      if (!entry.mood || !entry.createdAt) continue;
      const diff = Math.floor((now - new Date(entry.createdAt).getTime()) / 86400000);
      if (diff >= 0 && diff < 7) {
        const score = MOOD_SCORE[entry.mood] ?? 3;
        days[6 - diff] = Math.max(days[6 - diff], score);
      }
    }
    return days.map((score, i) => {
      const x = PAD + (i / 6) * chartW;
      const y = PAD + chartH - ((score - 1) / 4) * chartH;
      return { x, y, score };
    });
  }, [entries]);

  const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ');
  const dayLabels = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
  const today = new Date().getDay();
  const labelsOrdered = Array(7).fill(0).map((_, i) => {
    const dayIdx = (today - 6 + i + 7) % 7;
    return dayLabels[dayIdx === 0 ? 6 : dayIdx - 1];
  });

  return (
    <View style={{ marginVertical: 12 }}>
      <Svg width={W} height={H + 20}>
        {[1, 2, 3, 4, 5].map(level => {
          const gy = PAD + chartH - ((level - 1) / 4) * chartH;
          return <SvgLine key={level} x1={PAD} y1={gy} x2={W - PAD} y2={gy} stroke={accent + '14'} strokeWidth={0.7} />;
        })}
        <Polyline
          points={`${PAD},${H - PAD} ${polylineStr} ${W - PAD},${H - PAD}`}
          fill={accent + '18'}
          stroke="none"
        />
        <Polyline points={polylineStr} fill="none" stroke={accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <SvgCircle key={i} cx={p.x} cy={p.y} r={4} fill={accent} opacity={0.9} />
        ))}
        {labelsOrdered.map((lbl, i) => {
          const x = PAD + (i / 6) * chartW;
          return <SvgText key={i} x={x} y={H + 16} fontSize="10" fill={subColor} textAnchor="middle">{lbl}</SvgText>;
        })}
      </Svg>
    </View>
  );
};

// ── Radar / Spider Chart (SVG hexagon) ────────────────────────────
const RadarChart = ({ scores, labels, accent, subColor }: { scores: number[]; labels: string[]; accent: string; subColor: string }) => {
  const SIZE = 130;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 48;
  const n = scores.length;

  const getPoint = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const outerPts = Array(n).fill(0).map((_, i) => getPoint(i, R));
  const scorePts = scores.map((s, i) => getPoint(i, (s / 10) * R));
  const outerStr = outerPts.map(p => `${p.x},${p.y}`).join(' ');
  const scoreStr = scorePts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={{ alignItems: 'center', marginVertical: 12 }}>
      <Svg width={SIZE} height={SIZE + 30}>
        {[0.25, 0.5, 0.75, 1].map(frac => {
          const pts = Array(n).fill(0).map((_, i) => getPoint(i, R * frac));
          const str = pts.map(p => `${p.x},${p.y}`).join(' ');
          return <Polygon key={frac} points={str} fill="none" stroke={accent + '20'} strokeWidth={0.7} />;
        })}
        {outerPts.map((p, i) => (
          <SvgLine key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={accent + '20'} strokeWidth={0.7} />
        ))}
        <Polygon points={scoreStr} fill={accent + '28'} stroke={accent} strokeWidth={1.5} />
        {scorePts.map((p, i) => (
          <SvgCircle key={i} cx={p.x} cy={p.y} r={3.5} fill={accent} opacity={0.9} />
        ))}
        {outerPts.map((p, i) => {
          const lx = cx + (R + 10) * Math.cos((Math.PI * 2 * i) / n - Math.PI / 2);
          const ly = cy + (R + 10) * Math.sin((Math.PI * 2 * i) / n - Math.PI / 2);
          return <SvgText key={i} x={lx} y={ly + 3} fontSize="9" fill={subColor} textAnchor="middle">{labels[i]}</SvgText>;
        })}
      </Svg>
    </View>
  );
};

// ── Hero Stats Arc (SVG progress arc) ─────────────────────────────
const HeroStatsArc = ({ pct, accent, textColor, subColor, level }: any) => {
  const SZ = 130;
  const cx = SZ / 2;
  const cy = SZ / 2;
  const R = 52;
  const strokeW = 8;
  const FULL = 2 * Math.PI * R;
  const clampedPct = Math.min(1, Math.max(0, pct));
  const arcLen = clampedPct * FULL * 0.75; // 270° arc
  const startAngle = 135 * (Math.PI / 180);

  // Build arc path for 270° sweep starting at 135°
  const describeArc = (frac: number) => {
    const sweep = frac * 270 * (Math.PI / 180);
    const endAngle = startAngle + sweep;
    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle);
    const y2 = cy + R * Math.sin(endAngle);
    const largeArc = sweep > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: SZ, height: SZ }}>
      <Svg width={SZ} height={SZ}>
        <Path
          d={describeArc(1)}
          fill="none"
          stroke={accent + '18'}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {clampedPct > 0 && (
          <Path
            d={describeArc(clampedPct)}
            fill="none"
            stroke={accent}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        )}
        <SvgText x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill={accent}>
          Poz. {level}
        </SvgText>
        <SvgText x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fill={subColor}>
          {Math.round(clampedPct * 100)}% XP
        </SvgText>
      </Svg>
    </View>
  );
};

// ── 7-Day Practice Grid ────────────────────────────────────────────
const PRACTICE_ICONS: Record<string, string> = {
  tarot: '🃏',
  oracle: '🔮',
  meditation: '🧘',
  reflection: '📓',
  gratitude: '🙏',
  ritual: '🕯',
  dream: '🌙',
  shadow_work: '🌑',
};

const WeekGrid = ({ entries, meditationSessions, breathworkSessions, accent, subColor, cardBg }: any) => {
  const now = Date.now();
  const DAY_LABELS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
  const todayDow = new Date().getDay(); // 0=Sun

  // Build day index 0..6 (0=6 days ago, 6=today)
  const days = Array(7).fill(null).map((_, i) => {
    const dayOffset = 6 - i;
    const date = new Date(now - dayOffset * 86400000);
    const dow = date.getDay();
    const label = DAY_LABELS[dow === 0 ? 6 : dow - 1];
    const dateStr = date.toISOString().split('T')[0];
    const practices: string[] = [];

    // Journal entries
    for (const e of entries) {
      if (!e.createdAt) continue;
      const eDate = new Date(e.createdAt).toISOString().split('T')[0];
      if (eDate === dateStr) {
        const icon = PRACTICE_ICONS[e.type] || '📝';
        if (!practices.includes(icon)) practices.push(icon);
      }
    }
    // Meditation sessions
    for (const s of (meditationSessions || [])) {
      if (!s.date) continue;
      const sDate = new Date(s.date).toISOString().split('T')[0];
      if (sDate === dateStr && !practices.includes('🧘')) practices.push('🧘');
    }
    // Breathwork
    for (const s of (breathworkSessions || [])) {
      if (!s.date) continue;
      const sDate = new Date(s.date).toISOString().split('T')[0];
      if (sDate === dateStr && !practices.includes('💨')) practices.push('💨');
    }

    return { label, practices, isToday: i === 6 };
  });

  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {days.map((day, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            alignItems: 'center',
            backgroundColor: day.practices.length > 0 ? accent + '16' : cardBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: day.isToday ? accent + '55' : (day.practices.length > 0 ? accent + '30' : 'rgba(128,128,128,0.12)'),
            paddingVertical: 8,
            paddingHorizontal: 2,
            minHeight: 72,
          }}
        >
          <Typography style={{ fontSize: 9, color: subColor, marginBottom: 5 }}>{day.label}</Typography>
          {day.practices.length === 0 ? (
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(128,128,128,0.18)', marginTop: 4 }} />
          ) : (
            day.practices.slice(0, 3).map((icon, j) => (
              <Typography key={j} style={{ fontSize: 12, lineHeight: 17 }}>{icon}</Typography>
            ))
          )}
          {day.isToday && (
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: accent, marginTop: 4 }} />
          )}
        </View>
      ))}
    </View>
  );
};

// ── Practice Distribution SVG Bar Chart ───────────────────────────
const DistributionBarChart = ({ data, accent, subColor, cardBg }: any) => {
  if (!data || data.length === 0) return null;
  const CHART_W = SW - 44 - 28;
  const CHART_H = 120;
  const BAR_GAP = 10;
  const barW = Math.max(20, (CHART_W - BAR_GAP * (data.length - 1)) / data.length);
  const maxVal = Math.max(...data.map((d: any) => d.minutes), 1);

  return (
    <View style={{ marginVertical: 8 }}>
      <Svg width={CHART_W} height={CHART_H + 32}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(frac => {
          const y = CHART_H - frac * CHART_H;
          return (
            <SvgLine key={frac} x1={0} y1={y} x2={CHART_W} y2={y}
              stroke={accent + '10'} strokeWidth={0.7} strokeDasharray="3,3" />
          );
        })}
        {/* Bars */}
        {data.map((d: any, i: number) => {
          const barH = Math.max(4, (d.minutes / maxVal) * CHART_H);
          const x = i * (barW + BAR_GAP);
          const y = CHART_H - barH;
          return (
            <G key={d.label}>
              <Rect x={x} y={y} width={barW} height={barH} rx={6} fill={d.color + 'CC'} />
              <Rect x={x} y={y} width={barW} height={Math.min(barH, 10)} rx={6} fill={d.color} />
              <SvgText x={x + barW / 2} y={CHART_H + 14} textAnchor="middle" fontSize="9" fill={subColor}>
                {d.label.substring(0, 5)}
              </SvgText>
              <SvgText x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="9" fill={d.color}>
                {d.minutes}m
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

// ── Streak Calendar (12 weeks GitHub-style) ────────────────────────
const StreakCalendar = ({ entries, meditationSessions, breathworkSessions, accent, subColor }: any) => {
  const WEEKS = 12;
  const DAYS = 7;
  const CELL = Math.floor((SW - 44 - 24) / WEEKS) - 2;
  const now = Date.now();

  // Build activity map: dateStr → count
  const activityMap: Record<string, number> = {};
  for (const e of entries) {
    if (!e.createdAt) continue;
    const d = new Date(e.createdAt).toISOString().split('T')[0];
    activityMap[d] = (activityMap[d] || 0) + 1;
  }
  for (const s of (meditationSessions || [])) {
    if (!s.date) continue;
    const d = new Date(s.date).toISOString().split('T')[0];
    activityMap[d] = (activityMap[d] || 0) + 1;
  }
  for (const s of (breathworkSessions || [])) {
    if (!s.date) continue;
    const d = new Date(s.date).toISOString().split('T')[0];
    activityMap[d] = (activityMap[d] || 0) + 1;
  }

  // Build grid: last 12 weeks * 7 days
  const totalDays = WEEKS * DAYS;
  const grid: { date: string; count: number }[][] = [];
  const todayDate = new Date(now);
  // Align to start of week (Monday)
  const todayDow = todayDate.getDay();
  const daysToMonday = todayDow === 0 ? 6 : todayDow - 1;
  // Start from totalDays - 1 days ago
  const startOffset = totalDays - 1;

  for (let week = 0; week < WEEKS; week++) {
    const col: { date: string; count: number }[] = [];
    for (let day = 0; day < DAYS; day++) {
      const daysAgo = startOffset - (week * DAYS + day);
      const cellDate = new Date(now - daysAgo * 86400000);
      const dateStr = cellDate.toISOString().split('T')[0];
      col.push({ date: dateStr, count: activityMap[dateStr] || 0 });
    }
    grid.push(col);
  }

  const getColor = (count: number) => {
    if (count === 0) return 'rgba(128,128,128,0.10)';
    if (count === 1) return accent + '40';
    if (count === 2) return accent + '70';
    if (count <= 4) return accent + 'AA';
    return accent;
  };

  const SVG_W = SW - 44;
  const SVG_H = DAYS * (CELL + 2) + 16;

  return (
    <View style={{ marginVertical: 8 }}>
      <Svg width={SVG_W} height={SVG_H}>
        {grid.map((col, wi) =>
          col.map((cell, di) => (
            <Rect
              key={`${wi}-${di}`}
              x={wi * (CELL + 2)}
              y={di * (CELL + 2)}
              width={CELL}
              height={CELL}
              rx={2}
              fill={getColor(cell.count)}
            />
          ))
        )}
      </Svg>
      {/* Legend */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
        <Typography style={{ fontSize: 9, color: subColor }}>Mniej</Typography>
        {[0, 1, 2, 3, 4].map(level => (
          <View
            key={level}
            style={{ width: CELL, height: CELL, borderRadius: 2, backgroundColor: getColor(level) }}
          />
        ))}
        <Typography style={{ fontSize: 9, color: subColor }}>Więcej</Typography>
      </View>
    </View>
  );
};

// ── Growth Indicator Arrow ─────────────────────────────────────────
const GrowthArrow = ({ trend, accent, subColor }: { trend: 'up' | 'down' | 'stable'; accent: string; subColor: string }) => {
  const color = trend === 'up' ? '#34D399' : trend === 'down' ? '#FB7185' : subColor;
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  return <Icon color={color} size={16} strokeWidth={2} />;
};

// ── Word Cloud Component ───────────────────────────────────────────
const WordCloud = ({ words, accent, subColor, cardBg }: any) => {
  if (!words || words.length === 0) return null;
  const maxCount = words[0]?.[1] || 1;
  const sizes = [26, 22, 19, 17, 15, 13, 12, 12, 11, 11];
  const opacities = [1, 0.9, 0.82, 0.75, 0.68, 0.62, 0.56, 0.52, 0.48, 0.45];

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingVertical: 8 }}>
      {words.map(([word, count]: [string, number], i: number) => {
        const fontSize = sizes[i] || 11;
        const opacity = opacities[i] || 0.45;
        const scale = 0.6 + (count / maxCount) * 0.4;
        return (
          <View
            key={word}
            style={{
              backgroundColor: accent + '16',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: accent + '28',
            }}
          >
            <Typography style={{ fontSize, fontWeight: '700', color: accent, opacity, letterSpacing: 0.4 }}>
              {word}
            </Typography>
          </View>
        );
      })}
    </View>
  );
};

// ── Moon Phase Calculator (next events) ───────────────────────────
const getNextMoonEvents = () => {
  const now = new Date();
  const SYNODIC = 29.53058867;
  // Known new moon reference: Jan 11, 2024
  const refNewMoon = new Date('2024-01-11T11:57:00Z');
  const daysSinceRef = (now.getTime() - refNewMoon.getTime()) / 86400000;
  const currentPhase = ((daysSinceRef % SYNODIC) + SYNODIC) % SYNODIC;

  const daysToNewMoon = currentPhase < 0.5 ? 0.5 - currentPhase : SYNODIC - currentPhase + 0.5;
  const daysToFullMoon = currentPhase < SYNODIC / 2 ? SYNODIC / 2 - currentPhase : SYNODIC * 1.5 - currentPhase;
  const daysToFirstQ = currentPhase < SYNODIC * 0.25 ? SYNODIC * 0.25 - currentPhase : SYNODIC * 1.25 - currentPhase;
  const daysToLastQ = currentPhase < SYNODIC * 0.75 ? SYNODIC * 0.75 - currentPhase : SYNODIC * 1.75 - currentPhase;

  const fmt = (d: Date) => d.toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'long' });
  const addDays = (n: number) => new Date(now.getTime() + n * 86400000);

  const events = [
    { label: 'Nów — nowe początki', date: addDays(daysToNewMoon), icon: '🌑', days: Math.ceil(daysToNewMoon), color: '#6366F1' },
    { label: 'Pełnia — kulminacja', date: addDays(daysToFullMoon), icon: '🌕', days: Math.ceil(daysToFullMoon), color: '#F59E0B' },
    { label: 'Pierwsza kwadra', date: addDays(daysToFirstQ), icon: '🌓', days: Math.ceil(daysToFirstQ), color: '#818CF8' },
    { label: 'Ostatnia kwadra', date: addDays(daysToLastQ), icon: '🌗', days: Math.ceil(daysToLastQ), color: '#94A3B8' },
  ].sort((a, b) => a.days - b.days).slice(0, 4);

  return events.map(e => ({ ...e, dateStr: fmt(e.date) }));
};

// ── Numerological resonance days ──────────────────────────────────
const getNumerologicalDays = (userData: any) => {
  const now = new Date();
  const results: { label: string; dateStr: string; icon: string; days: number; color: string }[] = [];

  // Personal day = (birth month + birth day + current year + month + day) reduced
  const reduce = (n: number): number => {
    while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
      n = String(n).split('').reduce((s, d) => s + parseInt(d), 0);
    }
    return n;
  };

  const birthDate = userData?.birthDate ? new Date(userData.birthDate) : null;
  if (!birthDate) return results;

  for (let d = 0; d < 7; d++) {
    const day = new Date(now.getTime() + d * 86400000);
    const sum = birthDate.getMonth() + 1 + birthDate.getDate() + day.getFullYear() + (day.getMonth() + 1) + day.getDate();
    const num = reduce(sum);
    if (num === 1 || num === 8 || num === 11 || num === 22) {
      const fmt = day.toLocaleDateString(getLocaleCode(), { weekday: 'long', day: 'numeric', month: 'long' });
      const labels: Record<number, string> = { 1: 'Dzień nowego startu (1)', 8: 'Dzień obfitości (8)', 11: 'Dzień intuicji (11)', 22: 'Dzień manifestacji (22)' };
      const colors: Record<number, string> = { 1: '#34D399', 8: '#F59E0B', 11: '#818CF8', 22: '#F472B6' };
      results.push({ label: labels[num], dateStr: fmt, icon: '✦', days: d, color: colors[num] });
    }
  }
  return results.slice(0, 3);
};

// ── Planetary ingress stubs (simplified) ──────────────────────────
const COSMIC_EVENTS_STATIC = [
  { label: 'Merkury — retrograde', dateStr: 'Za ok. 18 dni', icon: '☿', color: '#94A3B8' },
  { label: 'Wenus wchodzi w Byki', dateStr: 'Za ok. 12 dni', icon: '♀', color: '#F472B6' },
  { label: 'Mars — sextyl Słońca', dateStr: 'Za ok. 5 dni', icon: '♂', color: '#FB7185' },
];

export const ReportsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    themeName, streaks, userData, meditationSessions, breathworkSessions,
    gratitudeEntries, dailyProgress, addFavoriteItem, isFavoriteItem, removeFavoriteItem,
  } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');
  const accent = currentTheme.primary;
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const dividerColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const rowBg = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)';
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const aiAvailable = AiService.isLaunchAvailable();
  const { entries: _entries } = useJournalStore();
  const entries = _entries ?? [];
  const moonPhase = getMoonPhase();
  const [soulReport, setSoulReport] = useState<SoulReportSection[] | null>(null);
  const [isGeneratingSoul, setIsGeneratingSoul] = useState(false);
  const [soulReportError, setSoulReportError] = useState<string | null>(null);
  const [weeklyInsights, setWeeklyInsights] = useState<string | null>(null);
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);

  const stats = useMemo(() => {
    const total = entries.length;
    const moods = entries.reduce((acc: Record<string, number>, entry) => {
      if (entry.mood) acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {});
    const tarotCount = entries.filter((entry) => entry.type === 'tarot').length;
    const reflectionCount = entries.filter((entry) => entry.type === 'reflection' || entry.type === 'gratitude').length;
    const dreamCount = entries.filter((entry) => entry.type === 'dream').length;
    const shadowCount = entries.filter((entry) => entry.type === 'shadow_work').length;
    const oracleCount = entries.filter((entry) => entry.type === 'oracle').length;
    return { total, moods, tarotCount, reflectionCount, dreamCount, shadowCount, oracleCount };
  }, [entries]);

  const weeklyInsight = useMemo(() => PatternInsightService.generateWeeklyInsight(), [entries]);
  const topMoods = useMemo(() => Object.entries(stats.moods).sort((a, b) => b[1] - a[1]).slice(0, 4), [stats.moods]);

  // ── SŁOWA KLUCZE — word frequency from journal entries ─────────
  const keyWords = useMemo(() => {
    const STOP_WORDS = new Set(['i', 'w', 'z', 'na', 'do', 'że', 'się', 'to', 'nie', 'jak', 'ale', 'już', 'po', 'o', 'a', 'się', 'mi', 'je', 'tak', 'co', 'mnie', 'mam', 'jej', 'jego', 'ten', 'ta', 'te', 'przez', 'dla', 'jest', 'są', 'być', 'który', 'która', 'które', 'tego', 'tej', 'tym', 'była', 'był', 'być', 'we', 'ze', 'bo', 'czy', 'chcę', 'może', 'sobie', 'by', 'też', 'gdy', 'lub', 'właśnie', 'więc']);
    const freq: Record<string, number> = {};
    for (const entry of entries) {
      const text = (entry.content || entry.text || '') as string;
      const words = text.toLowerCase().replace(/[^\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s]/g, '').split(/\s+/);
      for (const word of words) {
        if (word.length < 4 || STOP_WORDS.has(word)) continue;
        freq[word] = (freq[word] || 0) + 1;
      }
    }
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [entries]);

  // ── CZAS PRAKTYKI — practice time breakdown ────────────────────
  const practiceStats = useMemo(() => {
    const sessionMin = (meditationSessions || []).reduce((s: number, sess: any) => s + Math.round((sess.duration || 0) / 60), 0);
    const breathMin = (breathworkSessions || []).reduce((s: number, sess: any) => s + Math.round((sess.duration || 0) / 60), 0);
    const oracleCount = entries.filter((e) => e.type === 'oracle' || e.type === 'tarot').length;
    const ritualCount = entries.filter((e) => e.type === 'ritual').length;
    const journalCount = entries.filter((e) => e.type === 'reflection' || e.type === 'gratitude').length;
    const total = sessionMin + breathMin + oracleCount * 5 + ritualCount * 15 + journalCount * 3;
    return [
      { label: 'Medytacja', minutes: sessionMin, color: '#818CF8' },
      { label: 'Oddech', minutes: breathMin, color: '#34D399' },
      { label: 'Wyrocznia', minutes: oracleCount * 5, color: accent },
      { label: 'Rytuały', minutes: ritualCount * 15, color: '#F59E0B' },
      { label: 'Dziennik', minutes: journalCount * 3, color: '#F472B6' },
    ].filter(r => r.minutes > 0).map(r => ({ ...r, pct: total > 0 ? r.minutes / total : 0 }));
  }, [entries, meditationSessions, breathworkSessions, accent]);

  // ── SPIRITUAL LEVEL — based on total practice count ────────────
  const spiritualLevel = useMemo(() => {
    const totalSessions = (meditationSessions || []).length + (breathworkSessions || []).length;
    const totalEntries = entries.length;
    const streak = streaks.current;
    const xp = totalEntries * 10 + totalSessions * 20 + streak * 5;
    const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];
    let level = 1;
    for (let i = 0; i < thresholds.length; i++) {
      if (xp >= thresholds[i]) level = i + 1;
    }
    const nextThreshold = thresholds[Math.min(level, thresholds.length - 1)] || 10000;
    const prevThreshold = thresholds[level - 1] || 0;
    const pct = nextThreshold > prevThreshold ? (xp - prevThreshold) / (nextThreshold - prevThreshold) : 1;
    const levelNames = ['Poszukujący', 'Wędrownik', 'Adept', 'Inicjowany', 'Praktykujący', 'Strażnik', 'Mistrz', 'Iluminowany', 'Archont', 'Nieśmiertelny'];
    return { level, pct: Math.min(1, pct), xp, name: levelNames[Math.min(level - 1, levelNames.length - 1)] };
  }, [entries, meditationSessions, breathworkSessions, streaks]);

  // ── TOTAL PRACTICE DAYS — unique calendar days with any activity ──
  const totalPracticeDays = useMemo(() => {
    const days = new Set<string>();
    for (const e of entries) {
      if (e.createdAt) days.add(new Date(e.createdAt).toISOString().split('T')[0]);
    }
    for (const s of (meditationSessions || [])) {
      if (s.date) days.add(new Date(s.date).toISOString().split('T')[0]);
    }
    for (const s of (breathworkSessions || [])) {
      if (s.date) days.add(new Date(s.date).toISOString().split('T')[0]);
    }
    return days.size;
  }, [entries, meditationSessions, breathworkSessions]);

  // ── PERSONAL RECORDS ───────────────────────────────────────────
  const personalRecords = useMemo(() => {
    // Longest streak = stored in store
    const longestStreak = streaks.highest;

    // Most active week — find week with most entries
    const weekCounts: Record<string, number> = {};
    for (const e of entries) {
      if (!e.createdAt) continue;
      const d = new Date(e.createdAt);
      const weekStart = new Date(d);
      const dow = d.getDay();
      weekStart.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
      const key = weekStart.toISOString().split('T')[0];
      weekCounts[key] = (weekCounts[key] || 0) + 1;
    }
    const mostActiveWeekEntry = Object.entries(weekCounts).sort((a, b) => b[1] - a[1])[0];
    const mostActiveWeekCount = mostActiveWeekEntry ? mostActiveWeekEntry[1] : 0;
    const mostActiveWeekDate = mostActiveWeekEntry
      ? new Date(mostActiveWeekEntry[0]).toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'long' })
      : null;

    // Most used feature
    const typeCounts: Record<string, number> = {};
    for (const e of entries) {
      if (e.type) typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
    }
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    const typeLabels: Record<string, string> = {
      tarot: 'Tarot', oracle: 'Wyrocznia', reflection: 'Dziennik', gratitude: 'Wdzięczność',
      dream: 'Sny', shadow_work: 'Cień', ritual: 'Rytuały', matrix: 'Matryca',
    };
    const mostUsedFeature = topType ? (typeLabels[topType[0]] || topType[0]) : null;
    const mostUsedCount = topType ? topType[1] : 0;

    // Favorite tarot card — most frequent card in tarot entries
    const cardCounts: Record<string, number> = {};
    for (const e of entries) {
      if (e.type === 'tarot' && e.title) {
        cardCounts[e.title] = (cardCounts[e.title] || 0) + 1;
      }
    }
    const topCard = Object.entries(cardCounts).sort((a, b) => b[1] - a[1])[0];
    const favoriteCard = topCard ? topCard[0] : null;
    const favoriteCardCount = topCard ? topCard[1] : 0;

    // Most common dream symbol — from dream entries, pick most frequent word
    const dreamWordCounts: Record<string, number> = {};
    const STOP = new Set(['się', 'nie', 'jak', 'że', 'ale', 'już', 'mnie', 'przez', 'jest', 'być']);
    for (const e of entries) {
      if (e.type !== 'dream') continue;
      const text = (e.content || e.text || '') as string;
      for (const w of text.toLowerCase().replace(/[^\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s]/g, '').split(/\s+/)) {
        if (w.length < 4 || STOP.has(w)) continue;
        dreamWordCounts[w] = (dreamWordCounts[w] || 0) + 1;
      }
    }
    const topDreamWord = Object.entries(dreamWordCounts).sort((a, b) => b[1] - a[1])[0];
    const topDreamSymbol = topDreamWord ? topDreamWord[0] : null;

    return { longestStreak, mostActiveWeekCount, mostActiveWeekDate, mostUsedFeature, mostUsedCount, favoriteCard, favoriteCardCount, topDreamSymbol };
  }, [entries, streaks]);

  // ── GROWTH INDICATORS — 30-day vs previous 30-day trends ──────
  const growthIndicators = useMemo(() => {
    const now = Date.now();
    const last30 = entries.filter(e => e.createdAt && (now - new Date(e.createdAt).getTime()) < 30 * 86400000).length;
    const prev30 = entries.filter(e => {
      if (!e.createdAt) return false;
      const age = now - new Date(e.createdAt).getTime();
      return age >= 30 * 86400000 && age < 60 * 86400000;
    }).length;

    const last30Sess = (meditationSessions || []).filter((s: any) => s.date && (now - new Date(s.date).getTime()) < 30 * 86400000).length;
    const prev30Sess = (meditationSessions || []).filter((s: any) => {
      if (!s.date) return false;
      const age = now - new Date(s.date).getTime();
      return age >= 30 * 86400000 && age < 60 * 86400000;
    }).length;

    const last30Breath = (breathworkSessions || []).filter((s: any) => s.date && (now - new Date(s.date).getTime()) < 30 * 86400000).length;
    const prev30Breath = (breathworkSessions || []).filter((s: any) => {
      if (!s.date) return false;
      const age = now - new Date(s.date).getTime();
      return age >= 30 * 86400000 && age < 60 * 86400000;
    }).length;

    const getTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
      if (current > previous * 1.1) return 'up';
      if (current < previous * 0.9) return 'down';
      return 'stable';
    };
    const getDelta = (current: number, previous: number) => {
      if (previous === 0 && current === 0) return '0';
      if (previous === 0) return `+${current}`;
      const delta = current - previous;
      return delta > 0 ? `+${delta}` : String(delta);
    };

    return [
      {
        label: 'Aktywność w dzienniku',
        icon: BookOpen,
        current: last30,
        previous: prev30,
        trend: getTrend(last30, prev30),
        delta: getDelta(last30, prev30),
        color: '#F472B6',
      },
      {
        label: 'Sesje medytacyjne',
        icon: Activity,
        current: last30Sess,
        previous: prev30Sess,
        trend: getTrend(last30Sess, prev30Sess),
        delta: getDelta(last30Sess, prev30Sess),
        color: '#818CF8',
      },
      {
        label: 'Ćwiczenia oddechu',
        icon: Wind,
        current: last30Breath,
        previous: prev30Breath,
        trend: getTrend(last30Breath, prev30Breath),
        delta: getDelta(last30Breath, prev30Breath),
        color: '#34D399',
      },
      {
        label: 'Streak ogólny',
        icon: Flame,
        current: streaks.current,
        previous: streaks.current > 0 ? Math.max(0, streaks.current - 3) : 0,
        trend: streaks.current > 0 ? 'up' : 'stable',
        delta: streaks.current > 0 ? `+${streaks.current}` : '0',
        color: '#F59E0B',
      },
    ];
  }, [entries, meditationSessions, breathworkSessions, streaks]);

  // ── NEXT MOON + COSMIC EVENTS ──────────────────────────────────
  const nextMoonEvents = useMemo(() => getNextMoonEvents(), []);
  const numeroDays = useMemo(() => getNumerologicalDays(userData), [userData]);

  // ── PRZEŁOMOWE MOMENTY — highlights ────────────────────────────
  const breakthroughMoments = useMemo(() => {
    const now = Date.now();
    const last7 = entries.filter(e => e.createdAt && (now - new Date(e.createdAt).getTime()) < 7 * 86400000);
    const bestMoodEntry = [...last7].sort((a, b) => (MOOD_SCORE[b.mood] || 3) - (MOOD_SCORE[a.mood] || 3))[0];
    const bestDay = bestMoodEntry
      ? new Date(bestMoodEntry.createdAt).toLocaleDateString(getLocaleCode(), { weekday: 'long' })
      : null;
    const biggestWin = stats.total > 0
      ? stats.tarotCount > stats.reflectionCount
        ? 'Symbolika tarota dominuje — połącz karty z dziennikiem'
        : 'Regularne wpisy budują czytelny wzorzec energii'
      : 'Zacznij od pierwszego wpisu, żeby uruchomić raport';
    const patternNoticed = weeklyInsight.frequentArchetypes.length > 0
      ? `Wracający archetyp: ${resolveUserFacingText(weeklyInsight.frequentArchetypes[0])}`
      : 'Za mało danych — dodaj więcej wpisów';
    const nextWeekRec = weeklyInsight.averageEnergy < 45
      ? 'Priorytet: odzyskanie spokoju i prostszy rytm dnia'
      : 'Skieruj energię w jeden konkretny projekt lub intencję';
    return { bestDay, biggestWin, patternNoticed, nextWeekRec };
  }, [entries, stats, weeklyInsight]);

  const primaryFocus = useMemo(() => {
    if (stats.total === 0) {
      return {
        title: 'Raport potrzebuje pierwszych śladów, żeby naprawdę zaczął prowadzić.',
        body: 'Gdy pojawi się choć kilka wpisów, nastrojów i rytuałów, ta warstwa zamieni się w wyraźny odczyt wzoru, a nie pustą dekorację.',
        action: 'Zacznij od wpisu',
        onPress: () => navigation.navigate('JournalEntry'),
      };
    }
    if (weeklyInsight.averageEnergy < 45) {
      return {
        title: 'Najmocniej wraca przeciążenie i potrzeba odzyskania gruntu.',
        body: 'Ten raport nie ma zawstydzać. Ma powiedzieć wprost, że system potrzebuje mniej nacisku, a więcej prostoty, regulacji i bezpiecznego rytmu.',
        action: 'Zapisz, co dziś odpuszczasz',
        onPress: () => navigation.navigate('JournalEntry', { type: 'reflection', prompt: 'Co mnie teraz najbardziej przeciąża i jaki jeden ruch może dziś odzyskać grunt?' }),
      };
    }
    if (stats.tarotCount > stats.reflectionCount) {
      return {
        title: 'Symbole są u Ciebie silniejsze niż zwykły opis dnia.',
        body: 'To dobry znak, ale pełnia raportu pojawia się dopiero wtedy, gdy połączysz karty z codziennym językiem, ciałem i decyzjami.',
        action: 'Połącz karty z dziennikiem',
        onPress: () => navigation.navigate('JournalEntry', { type: 'reflection', prompt: 'Który motyw z ostatnich odczytów tarota naprawdę wraca w moim codziennym życiu?' }),
      };
    }
    return {
      title: 'Najważniejszy jest nie sam insight, tylko to, co z nim zrobisz.',
      body: 'Raport premium nie kończy się na obserwacji. Powinien prowadzić do jednej praktyki, pytania albo decyzji, którą da się ponieść dalej.',
      action: 'Zapisz wzór w dzienniku',
      onPress: () => navigation.navigate('JournalEntry', {
        type: 'reflection',
        prompt: `Dominująca energia to ${weeklyInsight.dominantMood}. Co naprawdę wraca w moich wpisach, nastrojach i decyzjach z ostatnich dni?`,
      }),
    };
  }, [navigation, stats.reflectionCount, stats.tarotCount, stats.total, weeklyInsight.averageEnergy, weeklyInsight.dominantMood]);

  const dominantMoodLabel = useMemo(() => {
    const labelMap: Record<string, string> = {
      Znakomita: t('reports.excellent'), Dobra: t('reports.good'), Spokojna: t('reports.calm'), Słaba: t('reports.weak'), Trudna: t('reports.difficult'),
      excellent: t('reports.excellent'), good: t('reports.good'), neutral: t('reports.calm'), bad: t('reports.weak'), terrible: t('reports.difficult'),
    };
    return labelMap[weeklyInsight.dominantMood] || weeklyInsight.dominantMood;
  }, [t, weeklyInsight.dominantMood]);

  const premiumSignals = useMemo(() => ([
    {
      title: 'Tempo układu wewnętrznego',
      body: weeklyInsight.averageEnergy < 45
        ? 'System jest bardziej w trybie przetrwania niż ekspansji. Priorytetem nie jest większa produktywność, tylko odzyskanie prostego gruntu.'
        : 'Układ ma zasób, ale potrzebuje wyraźnego kierunku. To dobry moment na mniej decyzji i więcej konsekwencji w jednym wybranym ruchu.',
    },
    {
      title: 'Najmocniejszy motyw powrotu',
      body: weeklyInsight.frequentArchetypes.length > 0
        ? `Najbardziej wracają symbole: ${weeklyInsight.frequentArchetypes.map((item) => resolveUserFacingText(item)).join(', ')}. To nie dekoracja, tylko powtarzający się język Twojego systemu.`
        : 'Raport czeka jeszcze na wyraźniejszy materiał. Gdy dojdą kolejne wpisy i odczyty, ta sekcja zacznie pokazywać realny wzór, a nie tylko pojedyncze momenty.',
    },
    {
      title: 'Co warto ochronić',
      body: stats.total > 0
        ? 'Największą wartością nie jest liczba wpisów, tylko to, że wracasz do siebie regularnie. Chroń rytm, który już istnieje, zamiast ciągle wymyślać nowy początek.'
        : 'Najpierw zbuduj jeden mały rytuał powrotu. Dopiero potem raport zacznie mieć wagę i naprawdę osobisty charakter.',
    },
  ]), [stats.total, weeklyInsight.averageEnergy, weeklyInsight.frequentArchetypes]);

  const generateSoulReport = async () => {
    if (!aiAvailable || isGeneratingSoul) return;
    setIsGeneratingSoul(true);
    setSoulReportError(null);
    try {
      const prompt = [
        'Wygeneruj Raport Duszy w języku użytkownika.',
        `Dominująca energia: ${weeklyInsight.dominantMood}.`,
        `Średnia energia: ${weeklyInsight.averageEnergy}%.`,
        `Wpisy: ${entries.length}.`,
        `Streak: ${streaks.current} dni.`,
        'Odpowiedz wyłącznie jako JSON z polami: motyw, wyzwanie, moc, kierunek, praktyka, pytanie.',
      ].join(' ');
      const raw = await AiService.chatWithOracleAdvanced([{ role: 'user', content: prompt }], undefined, { mode: 'direct', kind: 'integration', source: 'reports' });
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setSoulReport([
        { icon: '🌟', title: 'Motyw przewodni', content: parsed.motyw || '' },
        { icon: '⚡', title: 'Wyzwanie duszy', content: parsed.wyzwanie || '' },
        { icon: '💎', title: 'Moc duszy', content: parsed.moc || '' },
        { icon: '🧭', title: 'Kierunek na ten tydzień', content: parsed.kierunek || '' },
        { icon: '🌿', title: 'Praktyka integracyjna', content: parsed.praktyka || '' },
        { icon: '🔮', title: 'Pytanie refleksyjne', content: parsed.pytanie || '' },
      ]);
    } catch {
      setSoulReportError('Raport Duszy jest chwilowo niedostępny. Spróbuj ponownie za chwilę.');
    } finally {
      setIsGeneratingSoul(false);
    }
  };

  // ── GENERATE WEEKLY AI INSIGHTS ──────────────────────────────────
  const generateWeeklyInsights = async () => {
    if (!aiAvailable || isGeneratingWeekly) return;
    setIsGeneratingWeekly(true);
    try {
      const now = Date.now();
      const last7 = entries.filter(e => e.createdAt && (now - new Date(e.createdAt).getTime()) < 7 * 86400000);
      const moodSummary = Object.entries(
        last7.reduce((acc: Record<string, number>, e) => {
          if (e.mood) acc[e.mood] = (acc[e.mood] || 0) + 1;
          return acc;
        }, {})
      ).map(([m, c]) => `${m}: ${c}`).join(', ');

      const practiceTypes = [...new Set(last7.map(e => e.type).filter(Boolean))].join(', ');
      const totalThisWeek = last7.length;
      const streak = streaks.current;
      const name = userData?.name || 'Wędrownik';

      const prompt = `Jesteś mistycznym przewodnikiem duchowym. Napisz Raport Duchowy Tygodnia dla ${name} w języku użytkownika.

Dane z tego tygodnia:
- Łączna aktywność: ${totalThisWeek} wpisów/sesji
- Nastroje: ${moodSummary || 'brak danych'}
- Praktyki: ${practiceTypes || 'brak'}
- Streak: ${streak} dni z rzędu
- Dominująca energia: ${weeklyInsight.dominantMood}
- Średnia energia: ${weeklyInsight.averageEnergy}%

Napisz 3-4 zdania osobistego raportu duchowego. Użyj poetyckiego, ale konkretnego języka. Wskaż jeden wzorzec, jedno ostrzeżenie i jedną rekomendację. Nie używaj nagłówków ani wypunktowania — tylko płynny tekst.`;

      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setWeeklyInsights(result);
    } catch {
      setWeeklyInsights('Chwilowo brak połączenia z Wyrocznią. Spróbuj ponownie za moment.');
    } finally {
      setIsGeneratingWeekly(false);
    }
  };

  // ── EKSPORT RAPORTU ────────────────────────────────────────────
  const handleShareReport = async () => {
    const name = userData?.name ? `${userData.name} — ` : '';
    const lines = [
      `✦ RAPORT DUSZY AETHERA`,
      `${name}${new Date().toLocaleDateString(getLocaleCode(), { year: 'numeric', month: 'long', day: 'numeric' })}`,
      ``,
      `POZIOM DUCHOWY: ${spiritualLevel.name} (Poz. ${spiritualLevel.level})`,
      `DOMINUJĄCA ENERGIA: ${dominantMoodLabel}`,
      `ŚREDNIA ENERGIA: ${weeklyInsight.averageEnergy}%`,
      `STREAK: ${streaks.current} dni (rekord: ${streaks.highest})`,
      `DNI PRAKTYKI: ${totalPracticeDays}`,
      `WPISY: ${stats.total}`,
      ``,
      `NAJWAŻNIEJSZY WZORZEC:`,
      primaryFocus.title,
      ``,
      `PRZEŁOMOWE MOMENTY:`,
      breakthroughMoments.bestDay ? `• Najlepszy dzień: ${breakthroughMoments.bestDay}` : '',
      `• Największy postęp: ${breakthroughMoments.biggestWin}`,
      `• Wzorzec: ${breakthroughMoments.patternNoticed}`,
      `• Rekomendacja: ${breakthroughMoments.nextWeekRec}`,
      ``,
      ...(personalRecords.longestStreak > 0 ? [
        `REKORDY OSOBISTE:`,
        `• Najdłuższy streak: ${personalRecords.longestStreak} dni`,
        personalRecords.mostUsedFeature ? `• Ulubiona praktyka: ${personalRecords.mostUsedFeature} (${personalRecords.mostUsedCount}×)` : '',
        personalRecords.favoriteCard ? `• Karta tarota: ${personalRecords.favoriteCard}` : '',
        ``,
      ] : []),
      ...(keyWords.length > 0 ? [`SŁOWA KLUCZE: ${keyWords.slice(0, 5).map(([w]) => w).join(' · ')}`, ``] : []),
      ...(weeklyInsights ? [`RAPORT DUCHOWY TYGODNIA:`, weeklyInsights, ``] : []),
      ...(soulReport ? [`RAPORT DUSZY:`, ...soulReport.map(s => `${s.title}: ${s.content}`), ``] : []),
      `Wygenerowano w aplikacji Aethera ✦`,
    ].filter(l => l !== null && l !== undefined);
    try {
      await Share.share({ message: lines.join('\n') });
    } catch { /* ignore */ }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {!isLight && (
        <LinearGradient colors={['#04060D', '#0C1120', '#131A2F']} style={StyleSheet.absoluteFill} />
      )}
      {!isLight && (
        <LinearGradient colors={[accent + '10', 'transparent', '#00000055']} style={StyleSheet.absoluteFill} />
      )}
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={styles.backBtn} hitSlop={20}>
            <ChevronLeft color={accent} size={30} strokeWidth={1.5} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Typography variant="premiumLabel" color={accent} style={{ marginBottom: 4 }}>{t('reports.pathAnalysis')}</Typography>
            <Typography variant="screenTitle">Raport Duszy</Typography>
          </View>
          <Pressable
            onPress={() => { if (isFavoriteItem('reports')) { removeFavoriteItem('reports'); } else { addFavoriteItem({ id: 'reports', label: 'Raporty duszy', route: 'Reports', params: {}, icon: 'Sparkles', color: accent, addedAt: new Date().toISOString() }); } }}
            style={{ width: 44, alignItems: 'center', justifyContent: 'center' }}
            hitSlop={12}
          >
            <Star color={isFavoriteItem('reports') ? accent : accent + '88'} size={18} strokeWidth={1.8} fill={isFavoriteItem('reports') ? accent : 'none'} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') }]}
          showsVerticalScrollIndicator={false}
        >

          {/* ── 1. HERO STATS BANNER ────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(560)}>
            <Typography variant="premiumLabel" color={accent} style={styles.sectionEyebrow}>Twój profil duchowy</Typography>
            <View style={[styles.heroBanner, {
              backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
              borderColor: isLight ? 'rgba(0,0,0,0.07)' : accent + '22',
            }]}>
              {/* Left: arc + level */}
              <View style={{ alignItems: 'center', marginRight: 16 }}>
                <HeroStatsArc
                  pct={spiritualLevel.pct}
                  accent={accent}
                  textColor={textColor}
                  subColor={subColor}
                  level={spiritualLevel.level}
                />
                <Typography variant="microLabel" color={accent} style={{ marginTop: 4, textAlign: 'center' }}>
                  {spiritualLevel.name}
                </Typography>
                <Typography style={{ fontSize: 10, color: subColor, marginTop: 2 }}>
                  {spiritualLevel.xp} XP
                </Typography>
              </View>
              {/* Right: 4 stats */}
              <View style={{ flex: 1, gap: 10 }}>
                {[
                  { label: 'Dni praktyki', value: String(totalPracticeDays), icon: Calendar, color: '#818CF8' },
                  { label: 'Streak', value: `${streaks.current} dni`, icon: Flame, color: '#F59E0B' },
                  { label: 'Sesji łącznie', value: String((meditationSessions || []).length + (breathworkSessions || []).length + entries.length), icon: Activity, color: '#34D399' },
                  { label: 'Rekord streak', value: `${streaks.highest} dni`, icon: Trophy, color: accent },
                ].map(item => (
                  <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: item.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                      <item.icon color={item.color} size={14} strokeWidth={1.8} />
                    </View>
                    <View>
                      <Typography style={{ fontSize: 14, fontWeight: '700', color: textColor, lineHeight: 18 }}>{item.value}</Typography>
                      <Typography style={{ fontSize: 10, color: subColor }}>{item.label}</Typography>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Inline stat pills */}
            <View style={styles.statPillRow}>
              {[
                { label: 'Wpisy', value: String(stats.total), Icon: Orbit },
                { label: 'Streak', value: `${streaks.current} dni`, Icon: Sparkles },
                { label: 'Energia', value: `${weeklyInsight.averageEnergy}%`, Icon: TrendingUp },
                { label: 'Księżyc', value: moonPhase.icon || '🌙', Icon: MoonStar },
              ].map((item) => (
                <View key={item.label} style={[styles.statPill, { backgroundColor: accent + '12', borderColor: accent + '28' }]}>
                  <item.Icon color={accent} size={13} strokeWidth={1.8} />
                  <Typography variant="cardTitle" style={{ marginTop: 6, fontSize: 15, color: textColor }}>{item.value}</Typography>
                  <Typography variant="microLabel" color={accent} style={{ marginTop: 2 }}>{item.label}</Typography>
                </View>
              ))}
            </View>
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── WEEKLY CORE / DOMINANT MOOD ──────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(40).duration(560)}>
            <Typography variant="premiumLabel" color={accent} style={styles.sectionEyebrow}>Rdzeń tygodnia</Typography>
            <Typography variant="editorialHeader" style={[styles.moodTitle, { color: textColor }]}>{dominantMoodLabel}</Typography>
            <Typography variant="bodySmall" style={[styles.moodCopy, { color: subColor }]}>
              To jest dominująca warstwa, przez którą warto czytać resztę raportu. Nie kolejny dekoracyjny insight, tylko nazwa głównego tonu, który porządkuje decyzje, relacje i poziom energii.
            </Typography>
            <View style={styles.inlineChipRow}>
              {['energia ' + weeklyInsight.averageEnergy + '%', 'wpisy ' + stats.total, 'streak ' + streaks.current + ' dni'].map((chip) => (
                <View key={chip} style={[styles.inlineChip, { borderColor: accent + '28', backgroundColor: accent + '0E' }]}>
                  <Typography variant="microLabel" color={accent}>{chip}</Typography>
                </View>
              ))}
            </View>
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── 2. THIS WEEK OVERVIEW — 7-day grid ───────────────────── */}
          <Animated.View entering={FadeInUp.delay(55).duration(560)}>
            <View style={styles.sectionHead}>
              <Calendar color={accent} size={18} strokeWidth={1.6} />
              <Typography variant="premiumLabel" color={accent} style={{ marginLeft: 10 }}>Tydzień w pigułce</Typography>
            </View>
            <Typography variant="bodySmall" style={{ color: subColor, marginBottom: 14, lineHeight: 20 }}>
              Które dni były aktywne — i jakie praktyki zostały wykonane. Ikony pokazują rodzaj aktywności duchowej.
            </Typography>
            <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }]}>
              <WeekGrid
                entries={entries}
                meditationSessions={meditationSessions}
                breathworkSessions={breathworkSessions}
                accent={accent}
                subColor={subColor}
                cardBg={cardBg}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {Object.entries(PRACTICE_ICONS).slice(0, 6).map(([type, icon]) => (
                  <View key={type} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Typography style={{ fontSize: 11 }}>{icon}</Typography>
                    <Typography style={{ fontSize: 9, color: subColor }}>{
                      { tarot: 'Tarot', oracle: 'Wyrocznia', meditation: 'Medytacja', reflection: 'Dziennik', gratitude: 'Wdzięczność', ritual: 'Rytuał' }[type] || type
                    }</Typography>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── WYKRES NASTROJU — 7-day mood chart ───────────────────── */}
          <Animated.View entering={FadeInUp.delay(65).duration(560)}>
            <View style={styles.sectionHead}>
              <BarChart3 color={accent} size={18} strokeWidth={1.6} />
              <Typography variant="premiumLabel" color={accent} style={{ marginLeft: 10 }}>Wykres nastroju — 7 dni</Typography>
            </View>
            <Typography variant="bodySmall" style={{ color: subColor, marginBottom: 8, lineHeight: 20 }}>
              Emocjonalny łuk tygodnia — jak zmieniała się Twoja energia od poniedziałku do dziś.
            </Typography>
            <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }]}>
              {entries.length > 0 ? (
                <MoodChart entries={entries} accent={accent} textColor={textColor} subColor={subColor} />
              ) : (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Typography variant="bodySmall" style={{ color: subColor }}>Dodaj wpisy z nastrojami, aby zobaczyć wykres</Typography>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 }}>
                {['1', '2', '3', '4', '5'].map(level => (
                  <View key={level} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent, opacity: Number(level) / 5 }} />
                    <Typography variant="microLabel" color={subColor}>{['Trudna', 'Słaba', 'Spokojna', 'Dobra', 'Świetna'][Number(level) - 1]}</Typography>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── 3. PRACTICE DISTRIBUTION CHART ───────────────────────── */}
          <Animated.View entering={FadeInUp.delay(75).duration(560)}>
            <View style={styles.sectionHead}>
              <Layers color={accent} size={18} strokeWidth={1.6} />
              <Typography variant="premiumLabel" color={accent} style={{ marginLeft: 10 }}>Rozkład praktyki</Typography>
            </View>
            <Typography variant="bodySmall" style={{ color: subColor, marginBottom: 14, lineHeight: 20 }}>
              Wizualny podział czasu między różne formy pracy duchowej.
            </Typography>
            {practiceStats.length > 0 ? (
              <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)', paddingBottom: 16 }]}>
                <DistributionBarChart data={practiceStats} accent={accent} subColor={subColor} cardBg={cardBg} />
                {/* Stacked bars below */}
                {practiceStats.map((row, i) => (
                  <Animated.View key={row.label} entering={FadeInUp.delay(75 + i * 40).duration(400)} style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.color }} />
                        <Typography variant="microLabel" style={{ color: textColor }}>{row.label}</Typography>
                      </View>
                      <Typography variant="microLabel" style={{ color: subColor }}>{row.minutes} min ({Math.round(row.pct * 100)}%)</Typography>
                    </View>
                    <View style={[styles.practiceBarBg, { backgroundColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }]}>
                      <View style={[styles.practiceBarFill, { width: `${Math.round(row.pct * 100)}%`, backgroundColor: row.color }]} />
                    </View>
                  </Animated.View>
                ))}
              </View>
            ) : (
              <Typography variant="bodySmall" style={{ color: subColor }}>
                Zacznij medytować, pisać w dzienniku i korzystać z Oracle — dane pojawią się tu automatycznie.
              </Typography>
            )}
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── 4. STREAK CALENDAR — 12-week contribution grid ────────── */}
          <Animated.View entering={FadeInUp.delay(85).duration(560)}>
            <View style={styles.sectionHead}>
              <Flame color={accent} size={18} strokeWidth={1.6} />
              <Typography variant="premiumLabel" color={accent} style={{ marginLeft: 10 }}>Kalendarz aktywności — 12 tygodni</Typography>
            </View>
            <Typography variant="bodySmall" style={{ color: subColor, marginBottom: 14, lineHeight: 20 }}>
              Każda komórka to jeden dzień. Im głębszy kolor, tym więcej aktywności w tym dniu.
            </Typography>
            <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }]}>
              <StreakCalendar
                entries={entries}
                meditationSessions={meditationSessions}
                breathworkSessions={breathworkSessions}
                accent={accent}
                subColor={subColor}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <View style={{ alignItems: 'center' }}>
                <Typography style={{ fontSize: 20, fontWeight: '700', color: accent }}>{streaks.current}</Typography>
                <Typography style={{ fontSize: 10, color: subColor }}>Aktualny streak</Typography>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Typography style={{ fontSize: 20, fontWeight: '700', color: textColor }}>{streaks.highest}</Typography>
                <Typography style={{ fontSize: 10, color: subColor }}>Rekord</Typography>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Typography style={{ fontSize: 20, fontWeight: '700', color: '#34D399' }}>{totalPracticeDays}</Typography>
                <Typography style={{ fontSize: 10, color: subColor }}>Dni praktyki</Typography>
              </View>
            </View>
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── 5. AI WEEKLY INSIGHTS ─────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(90).duration(560)}>
            <View style={styles.sectionHead}>
              <WandSparkles color={accent} size={18} strokeWidth={1.8} />
              <Typography variant="premiumLabel" color={accent} style={{ marginLeft: 10 }}>Raport duchowy tygodnia</Typography>
            </View>
            <Typography variant="bodySmall" style={{ color: subColor, marginBottom: 16, lineHeight: 20 }}>
              Spersonalizowana analiza AI — wzorzec, ostrzeżenie i kierunek, wygenerowane na podstawie Twojej aktywności z ostatnich 7 dni.
            </Typography>

            {!weeklyInsights && !isGeneratingWeekly && (
              <Pressable
                onPress={generateWeeklyInsights}
                style={({ pressed }) => [styles.soulCta, { opacity: pressed ? 0.82 : 1, marginBottom: 0 }]}
              >
                <LinearGradient
                  colors={[accent + 'DD', accent + 'AA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject as any}
                />
                <Sparkles color="#fff" size={16} strokeWidth={1.8} />
                <Typography variant="cardTitle" style={{ color: '#fff', marginLeft: 10, fontSize: 15 }}>
                  Wygeneruj raport tygodnia
                </Typography>
                <ArrowRight color="#fff" size={16} style={{ marginLeft: 'auto' } as any} />
              </Pressable>
            )}

            {isGeneratingWeekly && (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={accent} />
                <Typography variant="bodySmall" color={accent} style={{ marginLeft: 12 }}>
                  Analiza tygodniowych wzorców...
                </Typography>
              </View>
            )}

            {weeklyInsights && (
              <Animated.View entering={FadeInDown.duration(480)}>
                <View style={[styles.weeklyInsightCard, {
                  backgroundColor: isLight ? accent + '08' : accent + '0D',
                  borderColor: accent + '30',
                }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: accent + '20', alignItems: 'center', justifyContent: 'center' }}>
                      <WandSparkles color={accent} size={14} strokeWidth={1.8} />
                    </View>
                    <Typography variant="premiumLabel" color={accent}>Wyrocznia mówi</Typography>
                  </View>
                  <Typography variant="bodySmall" style={{ color: textColor, lineHeight: 26, fontStyle: 'italic' }}>
                    "{weeklyInsights}"
                  </Typography>
                  <Pressable onPress={() => setWeeklyInsights(null)} style={{ alignSelf: 'flex-end', marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <RefreshCw color={subColor} size={12} strokeWidth={1.8} />
                    <Typography style={{ fontSize: 11, color: subColor }}>Wygeneruj ponownie</Typography>
                  </Pressable>
                </View>
              </Animated.View>
            )}
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── 6. PERSONAL RECORDS ───────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(100).duration(560)}>
            <View style={styles.sectionHead}>
              <Trophy color={accent} size={18} strokeWidth={1.6} />
              <Typography variant="premiumLabel" color={accent} style={{ marginLeft: 10 }}>Rekordy osobiste</Typography>
            </View>
            <Typography variant="bodySmall" style={{ color: subColor, marginBottom: 14, lineHeight: 20 }}>
              Najlepsze wyniki na Twojej duchowej ścieżce — ślady największych zaangażowań.
            </Typography>
            <View style={{ gap: 10 }}>
              {[
                {
                  icon: '🔥',
                  label: 'Najdłuższy streak',
                  value: personalRecords.longestStreak > 0 ? `${personalRecords.longestStreak} dni` : 'Jeszcze nie osiągnięto',
                  sub: 'Rekordowa seria praktyki bez przerwy',
                  color: '#F59E0B',
                  available: true,
                },
                {
                  icon: '📅',
                  label: 'Najbardziej aktywny tydzień',
                  value: personalRecords.mostActiveWeekCount > 0
                    ? `${personalRecords.mostActiveWeekCount} aktywności`
                    : 'Brak danych',
                  sub: personalRecords.mostActiveWeekDate ? `Tydzień od ${personalRecords.mostActiveWeekDate}` : 'Zacznij praktykę regularnie',
                  color: '#818CF8',
                  available: personalRecords.mostActiveWeekCount > 0,
                },
                {
                  icon: '⭐',
                  label: 'Ulubiona praktyka',
                  value: personalRecords.mostUsedFeature
                    ? `${personalRecords.mostUsedFeature} (${personalRecords.mostUsedCount}×)`
                    : 'Brak danych',
                  sub: 'Forma aktywności, do której wracasz najczęściej',
                  color: accent,
                  available: !!personalRecords.mostUsedFeature,
                },
                {
                  icon: '🃏',
                  label: 'Ulubiona karta tarota',
                  value: personalRecords.favoriteCard
                    ? `${personalRecords.favoriteCard} (${personalRecords.favoriteCardCount}×)`
                    : 'Brak odczytów tarota',
                  sub: 'Karta, która pojawia się w Twoich odczytach najczęściej',
                  color: '#F472B6',
                  available: !!personalRecords.favoriteCard,
                },
                {
                  icon: '🌙',
                  label: 'Symbol snów',
                  value: personalRecords.topDreamSymbol || 'Brak wpisów snów',
                  sub: 'Słowo pojawiające się najczęściej w Twoim dzienniku snów',
                  color: '#6366F1',
                  available: !!personalRecords.topDreamSymbol,
                },
              ].map((record, idx) => (
                <Animated.View key={record.label} entering={FadeInUp.delay(100 + idx * 50).duration(420)}>
                  <View style={[styles.recordCard, {
                    backgroundColor: record.available ? (record.color + '0D') : cardBg,
                    borderColor: record.available ? (record.color + '30') : (isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'),
                  }]}>
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: record.color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                      <Typography style={{ fontSize: 20 }}>{record.icon}</Typography>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography style={{ fontSize: 10, color: record.available ? record.color : subColor, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>
                        {record.label}
                      </Typography>
                      <Typography style={{ fontSize: 15, fontWeight: '700', color: record.available ? textColor : subColor, marginBottom: 2 }}>
                        {record.value}
                      </Typography>
                      <Typography style={{ fontSize: 11, color: subColor, lineHeight: 16 }}>
                        {record.sub}
                      </Typography>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── 7. GROWTH INDICATORS ──────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(115).duration(560)}>
            <View style={styles.sectionHead}>
              <TrendingUp color={accent} size={18} strokeWidth={1.6} />
              <Typography variant="premiumLabel" color={accent} style={{ marginLeft: 10 }}>Wskaźniki wzrostu — 30 dni</Typography>
            </View>
            <Typography variant="bodySmall" style={{ color: subColor, marginBottom: 14, lineHeight: 20 }}>
              Porównanie ostatnich 30 dni z poprzednimi 30 dniami. Strzałka wskazuje kierunek zmiany.
            </Typography>
            <View style={{ gap: 10 }}>
              {growthIndicators.map((item, idx) => (
                <Animated.View key={item.label} entering={FadeInUp.delay(115 + idx * 45).duration(420)}>
                  <View style={[styles.growthCard, {
                    backgroundColor: cardBg,
                    borderColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)',
                  }]}>
                    <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: item.color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <item.icon color={item.color} size={18} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography style={{ fontSize: 10, color: subColor, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>
                        {item.label}
                      </Typography>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Typography style={{ fontSize: 18, fontWeight: '700', color: textColor }}>
                          {item.current}
                        </Typography>
                        <GrowthArrow trend={item.trend} accent={accent} subColor={subColor} />
                        <View style={{
                          paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
                          backgroundColor: item.trend === 'up' ? '#34D39920' : item.trend === 'down' ? '#FB718520' : 'rgba(128,128,128,0.10)',
                        }}>
                          <Typography style={{
                            fontSize: 11, fontWeight: '600',
                            color: item.trend === 'up' ? '#34D399' : item.trend === 'down' ? '#FB7185' : subColor,
                          }}>
                            {item.delta}
                          </Typography>
                        </View>
                      </View>
                      <Typography style={{ fontSize: 10, color: subColor, marginTop: 2 }}>
                        Poprzednie 30 dni: {item.previous}
                      </Typography>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── 8. UPCOMING COSMIC EVENTS ─────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(125).duration(560)}>
            <View style={styles.sectionHead}>
              <MoonStar color={accent} size={18} strokeWidth={1.6} />
              <Typography variant="premiumLabel" color={accent} style={{ marginLeft: 10 }}>Nadchodzące wydarzenia kosmiczne</Typography>
            </View>
            <Typography variant="bodySmall" style={{ color: subColor, marginBottom: 14, lineHeight: 20 }}>
              Najbliższe fazy księżyca, daty numerologiczne i zjawiska planetarne — przygotuj swoje intencje z wyprzedzeniem.
            </Typography>

            {/* Moon phase events */}
            <Typography variant="microLabel" color={accent} style={{ marginBottom: 10, letterSpacing: 1.5 }}>FAZY KSIĘŻYCA</Typography>
            <View style={{ gap: 8, marginBottom: 18 }}>
              {nextMoonEvents.map((event, idx) => (
                <Animated.View key={event.label} entering={FadeInUp.delay(125 + idx * 40).duration(380)}>
                  <View style={[styles.cosmicEventRow, {
                    backgroundColor: event.days <= 3 ? (event.color + '12') : cardBg,
                    borderColor: event.days <= 3 ? (event.color + '40') : (isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'),
                  }]}>
                    <Typography style={{ fontSize: 22, marginRight: 12 }}>{event.icon}</Typography>
                    <View style={{ flex: 1 }}>
                      <Typography style={{ fontSize: 12, fontWeight: '600', color: textColor, marginBottom: 2 }}>
                        {event.label}
                      </Typography>
                      <Typography style={{ fontSize: 11, color: subColor }}>{event.dateStr}</Typography>
                    </View>
                    <View style={{
                      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
                      backgroundColor: event.days <= 3 ? (event.color + '20') : 'rgba(128,128,128,0.08)',
                    }}>
                      <Typography style={{ fontSize: 11, fontWeight: '700', color: event.days <= 3 ? event.color : subColor }}>
                        {event.days <= 0 ? 'Dziś' : `za ${event.days}d`}
                      </Typography>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>

            {/* Numerological power days */}
            {numeroDays.length > 0 && (
              <>
                <Typography variant="microLabel" color={accent} style={{ marginBottom: 10, letterSpacing: 1.5 }}>DNI NUMEROLOGICZNE</Typography>
                <View style={{ gap: 8, marginBottom: 18 }}>
                  {numeroDays.map((day, idx) => (
                    <View key={idx} style={[styles.cosmicEventRow, {
                      backgroundColor: day.color + '10',
                      borderColor: day.color + '35',
                    }]}>
                      <Typography style={{ fontSize: 18, marginRight: 12 }}>{day.icon}</Typography>
                      <View style={{ flex: 1 }}>
                        <Typography style={{ fontSize: 12, fontWeight: '600', color: textColor, marginBottom: 2 }}>{day.label}</Typography>
                        <Typography style={{ fontSize: 11, color: subColor }}>{day.dateStr}</Typography>
                      </View>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: day.color + '18' }}>
                        <Typography style={{ fontSize: 11, fontWeight: '700', color: day.color }}>
                          {day.days === 0 ? 'Dziś' : `za ${day.days}d`}
                        </Typography>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Static planetary events */}
            <Typography variant="microLabel" color={accent} style={{ marginBottom: 10, letterSpacing: 1.5 }}>PLANETY</Typography>
            <View style={{ gap: 8 }}>
              {COSMIC_EVENTS_STATIC.map((event, idx) => (
                <View key={idx} style={[styles.cosmicEventRow, {
                  backgroundColor: cardBg,
                  borderColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)',
                }]}>
                  <Typography style={{ fontSize: 20, marginRight: 12 }}>{event.icon}</Typography>
                  <View style={{ flex: 1 }}>
                    <Typography style={{ fontSize: 12, fontWeight: '600', color: textColor, marginBottom: 2 }}>{event.label}</Typography>
                    <Typography style={{ fontSize: 11, color: subColor }}>{event.dateStr}</Typography>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── 9. JOURNAL WORD CLOUD ─────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(130).duration(560)}>
            <View style={styles.sectionHead}>
              <Hash color={accent} size={18} strokeWidth={1.6} />
              <Typography variant="premiumLabel" color={accent} style={{ marginLeft: 10 }}>Chmura słów — dziennik</Typography>
            </View>
            <Typography variant="bodySmall" style={{ color: subColor, marginBottom: 14, lineHeight: 20 }}>
              Najczęstsze słowa z wszystkich Twoich wpisów — tematy, które wracają bez zaproszenia. Im większe, tym częstsze.
            </Typography>
            <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }]}>
              {keyWords.length > 0 ? (
                <WordCloud words={keyWords} accent={accent} subColor={subColor} cardBg={cardBg} />
              ) : (
                <View style={{ paddingVertical: 28, alignItems: 'center' }}>
                  <Typography style={{ fontSize: 32, marginBottom: 10 }}>📝</Typography>
                  <Typography variant="bodySmall" style={{ color: subColor, textAlign: 'center', lineHeight: 20 }}>
                    Napisz kilka wpisów z refleksjami, żeby zobaczyć powtarzające się tematy i symbole.
                  </Typography>
                </View>
              )}
            </View>
            {keyWords.length > 0 && (
              <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {keyWords.slice(0, 5).map(([word, count], i) => {
                  const sizes = [22, 19, 17, 15, 13];
                  const fontSize = sizes[i] || 13;
                  const opacity = 1 - i * 0.12;
                  return (
                    <View key={word} style={[styles.wordChip, { backgroundColor: accent + '18', borderColor: accent + '30' }]}>
                      <Typography style={{ fontSize, fontWeight: '700', color: accent, opacity, letterSpacing: 0.3 }}>{word}</Typography>
                      <View style={{ backgroundColor: accent + '28', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 }}>
                        <Typography style={{ fontSize: 10, color: accent }}>{count}×</Typography>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── PRZEŁOMOWE MOMENTY ─────────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(140).duration(560)}>
            <View style={styles.sectionHead}>
              <Trophy color={accent} size={18} strokeWidth={1.6} />
              <Typography variant="premiumLabel" color={accent} style={{ marginLeft: 10 }}>Przełomowe momenty</Typography>
            </View>
            <Typography variant="bodySmall" style={{ color: subColor, marginBottom: 14, lineHeight: 20 }}>
              Najlepsze punkty tygodnia i wskazanie, co warto zabrać dalej.
            </Typography>
            {[
              { label: 'Najlepszy dzień', value: breakthroughMoments.bestDay || 'Brak danych', color: '#34D399', icon: '🌟' },
              { label: 'Największy postęp', value: breakthroughMoments.biggestWin, color: accent, icon: '💎' },
              { label: 'Wzorzec', value: breakthroughMoments.patternNoticed, color: '#F59E0B', icon: '🔁' },
              { label: 'Rekomendacja na przyszły tydzień', value: breakthroughMoments.nextWeekRec, color: '#818CF8', icon: '🧭' },
            ].map((item) => (
              <View key={item.label} style={[styles.breakthroughRow, { backgroundColor: item.color + '0D', borderLeftColor: item.color }]}>
                <Typography style={{ fontSize: 18, marginRight: 10 }}>{item.icon}</Typography>
                <View style={{ flex: 1 }}>
                  <Typography variant="microLabel" style={{ color: item.color, marginBottom: 4 }}>{item.label.toUpperCase()}</Typography>
                  <Typography variant="bodySmall" style={{ color: textColor, lineHeight: 20 }}>{item.value}</Typography>
                </View>
              </View>
            ))}
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── Primary focus ─────────────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(150).duration(560)}>
            <Typography variant="premiumLabel" color={accent} style={styles.sectionEyebrow}>Najważniejszy wzór na teraz</Typography>
            <Typography variant="bodyRefined" style={[styles.focusTitle, { color: textColor }]}>{primaryFocus.title}</Typography>
            <Typography variant="bodySmall" style={[styles.focusCopy, { color: subColor }]}>{primaryFocus.body}</Typography>
            <Pressable style={styles.inlineAction} onPress={primaryFocus.onPress}>
              <Typography variant="microLabel" color={accent}>{primaryFocus.action}</Typography>
              <ArrowRight color={accent} size={14} />
            </Pressable>
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── Three axes ────────────────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(160).duration(560)}>
            <Typography variant="premiumLabel" color={accent} style={styles.sectionEyebrow}>Trzy osie tygodnia</Typography>
            {[
              { key: 'RDZEŃ', color: accent, text: `${dominantMoodLabel} i motyw, który wraca częściej niż pojedynczy epizod.` },
              { key: 'NAPIĘCIE', color: '#F97316', text: weeklyInsight.averageEnergy < 45 ? 'Przeciążenie i odzyskiwanie gruntu.' : 'Potrzeba skupienia, żeby zasób nie rozproszył się na zbyt wiele kierunków.' },
              { key: 'INTEGRACJA', color: '#34D399', text: `${primaryFocus.action}. To właśnie ten ruch ma dziś największą wagę praktyczną.` },
            ].map((axis) => (
              <View key={axis.key} style={[styles.axisRow, { borderLeftColor: axis.color }]}>
                <Typography variant="microLabel" color={axis.color} style={{ marginBottom: 6 }}>{axis.key}</Typography>
                <Typography variant="bodySmall" style={[styles.axisText, { color: subColor }]}>{axis.text}</Typography>
              </View>
            ))}
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── Weekly reading ────────────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(170).duration(560)}>
            <View style={styles.sectionHead}>
              <Brain color={accent} size={18} strokeWidth={1.6} />
              <Typography variant="cardTitle" color={accent} style={{ marginLeft: 10 }}>Odczyt tygodnia</Typography>
            </View>
            <View style={styles.readingGrid}>
              <View style={styles.readingCol}>
                <Typography variant="microLabel" style={{ color: subColor, marginBottom: 6 }}>Dominująca energia</Typography>
                <Typography variant="subtitle" style={{ fontSize: 18, color: textColor }}>{dominantMoodLabel}</Typography>
                <Typography variant="bodySmall" style={{ marginTop: 4, color: subColor }}>Średni poziom: {weeklyInsight.averageEnergy}%</Typography>
              </View>
              <View style={[styles.readingDivider, { backgroundColor: dividerColor }]} />
              <View style={styles.readingCol}>
                <Typography variant="microLabel" style={{ color: subColor, marginBottom: 6 }}>Archetypy</Typography>
                {weeklyInsight.frequentArchetypes.length > 0
                  ? weeklyInsight.frequentArchetypes.map((item) => (
                    <Typography key={item} variant="bodySmall" style={{ marginBottom: 4, color: textColor }}>• {resolveUserFacingText(item)}</Typography>
                  ))
                  : <Typography variant="bodySmall" style={{ color: subColor }}>Brak wystarczających danych</Typography>
                }
              </View>
            </View>
            <View style={[styles.focusBox, { borderLeftColor: accent, backgroundColor: accent + '0A' }]}>
              <Typography variant="microLabel" color={accent} style={{ marginBottom: 8 }}>Sugerowany fokus</Typography>
              <Typography variant="bodyRefined" style={{ lineHeight: 24, fontSize: 15, color: textColor }}>{weeklyInsight.suggestedFocus}</Typography>
            </View>
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── Premium report layers (3 rows) ────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(180).duration(560)}>
            <Typography variant="premiumLabel" color={accent} style={styles.sectionEyebrow}>Raport premium warstwowy</Typography>
            {[
              { Icon: Gem, label: 'Rdzeń', desc: 'Dominująca energia i motyw, który spina ten tydzień od środka.' },
              { Icon: Waves, label: 'Przepływ', desc: 'Jak zmienia się nastrój, regulacja i kierunek wewnętrzny.' },
              { Icon: Crown, label: 'Domknięcie', desc: 'Jedna decyzja, która przenosi insight do realnego działania.' },
            ].map((row) => (
              <View key={row.label} style={[styles.layerRow, { backgroundColor: rowBg, borderBottomColor: dividerColor }]}>
                <View style={[styles.layerIconWrap, { backgroundColor: accent + '14' }]}>
                  <row.Icon color={accent} size={16} strokeWidth={1.7} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="cardTitle" style={{ color: textColor, marginBottom: 3 }}>{row.label}</Typography>
                  <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 20 }}>{row.desc}</Typography>
                </View>
              </View>
            ))}
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── Strengths / distractors (two horizontal rows) ─────────── */}
          <Animated.View entering={FadeInUp.delay(200).duration(560)}>
            <View style={[styles.signalRow, { borderLeftColor: '#34D399', backgroundColor: isLight ? 'rgba(52,211,153,0.06)' : 'rgba(52,211,153,0.06)' }]}>
              <View style={styles.signalRowHead}>
                <HeartHandshake color="#34D399" size={16} strokeWidth={1.7} />
                <Typography variant="premiumLabel" color="#34D399" style={{ marginLeft: 8 }}>To wzmacnia</Typography>
              </View>
              <Typography variant="bodySmall" style={[styles.signalRowText, { color: subColor }]}>
                Regularność, prosty zapis po rytuale i nazywanie emocji bez natychmiastowej potrzeby naprawiania wszystkiego.
              </Typography>
            </View>
            <View style={[styles.signalRow, { borderLeftColor: '#F97316', backgroundColor: isLight ? 'rgba(249,115,22,0.05)' : 'rgba(249,115,22,0.05)' }]}>
              <View style={styles.signalRowHead}>
                <ShieldAlert color="#F97316" size={16} strokeWidth={1.7} />
                <Typography variant="premiumLabel" color="#F97316" style={{ marginLeft: 8 }}>To rozprasza</Typography>
              </View>
              <Typography variant="bodySmall" style={[styles.signalRowText, { color: subColor }]}>
                Nadmierne skakanie między bodźcami, odczytami i inspiracjami bez chwili integracji i bez jednego realnego ruchu w codzienności.
              </Typography>
            </View>
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── Premium signals (3 rows) ──────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(220).duration(560)}>
            {premiumSignals.map((item) => (
              <View key={item.title} style={[styles.signalRow, { borderLeftColor: accent, backgroundColor: rowBg }]}>
                <Typography variant="premiumLabel" color={accent} style={{ marginBottom: 6 }}>{item.title}</Typography>
                <Typography variant="bodySmall" style={{ lineHeight: 22, color: subColor }}>{item.body}</Typography>
              </View>
            ))}
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── Mood landscape ────────────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(235).duration(560)}>
            <View style={styles.sectionHead}>
              <TrendingUp color={accent} size={18} strokeWidth={1.6} />
              <Typography variant="premiumLabel" color={accent} style={{ marginLeft: 10 }}>Krajobraz emocjonalny</Typography>
            </View>
            {topMoods.length > 0 ? topMoods.map(([mood, count]) => {
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <View key={mood} style={styles.moodRow}>
                  <Typography variant="bodyRefined" style={[styles.moodName, { color: textColor }]}>{mood}</Typography>
                  <View style={styles.moodBarContainer}>
                    <View style={[styles.moodBarBg, { backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }]}>
                      <View style={[styles.moodBarFill, { width: `${pct}%`, backgroundColor: accent }]} />
                    </View>
                  </View>
                  <Typography variant="label" style={[styles.moodPct, { color: subColor }]}>{pct}%</Typography>
                </View>
              );
            }) : (
              <Typography variant="bodySmall" style={{ color: subColor, marginTop: 8 }}>
                Gdy pojawi się więcej wpisów, raport pokaże dominujące emocje i ich powtarzalność.
              </Typography>
            )}
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── Mood constellation ────────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(260).duration(560)} style={styles.constellationSection}>
            <Typography variant="premiumLabel" color={accent} style={styles.sectionEyebrow}>Konstelacja nastrojów</Typography>
            <MoodConstellation entries={entries} />
            <Typography variant="bodySmall" align="center" style={{ marginTop: 18, lineHeight: 22, color: subColor }}>
              To wizualny ślad Twojej wewnętrznej pogody. Nie ocenia. Pokazuje, które stany wracają częściej niż myślisz.
            </Typography>
          </Animated.View>

          {/* ── Soul Report CTA / generated report ───────────────────── */}
          {aiAvailable ? (
            <Animated.View entering={FadeInDown.delay(320).duration(560)}>
              <View style={[styles.divider, { backgroundColor: dividerColor }]} />

              {!soulReport && !isGeneratingSoul ? (
                <>
                  <View style={styles.sectionHead}>
                    <WandSparkles color={accent} size={18} strokeWidth={1.8} />
                    <Typography variant="premiumLabel" color={accent} style={{ marginLeft: 10 }}>Raport Duszy</Typography>
                  </View>
                  <Typography variant="bodySmall" style={{ marginBottom: 20, lineHeight: 22, color: subColor }}>
                    Spersonalizowana analiza wzorców, energii i kierunku na ten tydzień, generowana na podstawie Twojej aktywności w sanktuarium.
                  </Typography>
                  <Pressable onPress={generateSoulReport} style={({ pressed }) => [styles.soulCta, { opacity: pressed ? 0.82 : 1 }]}>
                    <LinearGradient
                      colors={[accent, accent + 'CC']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject as any}
                    />
                    <Brain color="#fff" size={18} strokeWidth={1.8} />
                    <Typography variant="cardTitle" style={{ color: '#fff', marginLeft: 10, fontSize: 15 }}>Wygeneruj Raport Duszy</Typography>
                    <ArrowRight color="#fff" size={16} style={{ marginLeft: 'auto' } as any} />
                  </Pressable>
                </>
              ) : null}

              {isGeneratingSoul ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="small" color={accent} />
                  <Typography variant="bodySmall" color={accent} style={{ marginLeft: 12 }}>Czytamy Twój wzór i składamy raport...</Typography>
                </View>
              ) : null}

              {soulReportError ? (
                <Typography variant="bodySmall" color="#FB7185" style={{ textAlign: 'center', paddingVertical: 10 }}>{soulReportError}</Typography>
              ) : null}

              {soulReport ? (
                <>
                  <View style={styles.sectionHead}>
                    <WandSparkles color={accent} size={18} strokeWidth={1.8} />
                    <Typography variant="premiumLabel" color={accent} style={{ marginLeft: 10 }}>Raport Duszy</Typography>
                  </View>
                  {soulReport.map((section, index) => (
                    <Animated.View key={section.title} entering={FadeInUp.delay(index * 70).duration(420)}>
                      <View style={[styles.soulSection, { borderLeftColor: accent }]}>
                        <View style={styles.soulSectionHead}>
                          <Typography variant="cardTitle" style={{ fontSize: 16 }}>{section.icon}</Typography>
                          <Typography variant="premiumLabel" color={accent} style={{ marginLeft: 8 }}>{section.title}</Typography>
                        </View>
                        <Typography variant="bodySmall" style={{ lineHeight: 24, color: subColor, paddingLeft: 24 }}>{section.content}</Typography>
                      </View>
                    </Animated.View>
                  ))}
                  <Pressable onPress={() => setSoulReport(null)} style={styles.regenerateBtn}>
                    <Typography variant="caption" style={{ color: subColor }}>Wygeneruj ponownie</Typography>
                  </Pressable>
                </>
              ) : null}
            </Animated.View>
          ) : null}

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── 10. EXPORT / SHARE REPORT ─────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(340).duration(560)}>
            <View style={styles.sectionHead}>
              <Share2 color={accent} size={18} strokeWidth={1.6} />
              <Typography variant="premiumLabel" color={accent} style={{ marginLeft: 10 }}>Eksport i udostępnianie</Typography>
            </View>
            <Typography variant="bodySmall" style={{ color: subColor, marginBottom: 16, lineHeight: 20 }}>
              Wygeneruj podsumowanie tygodnia z nastrojami, rekordami, słowami kluczami i raportem duszy — gotowe do udostępnienia lub zachowania.
            </Typography>

            {/* Share summary card preview */}
            <View style={[styles.exportPreviewCard, {
              backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
              borderColor: accent + '25',
            }]}>
              <LinearGradient
                colors={isLight ? [accent + '08', 'transparent'] : [accent + '0A', 'transparent']}
                style={StyleSheet.absoluteFillObject as any}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                <Typography style={{ fontSize: 16 }}>✦</Typography>
                <Typography style={{ fontSize: 13, fontWeight: '700', color: accent, letterSpacing: 2 }}>AETHERA — RAPORT DUSZY</Typography>
              </View>
              <View style={{ gap: 6 }}>
                {[
                  { label: 'Poziom', value: `${spiritualLevel.name} (Poz. ${spiritualLevel.level})` },
                  { label: 'Streak', value: `${streaks.current} dni (rekord: ${streaks.highest})` },
                  { label: 'Dominująca energia', value: dominantMoodLabel },
                  { label: 'Dni praktyki', value: String(totalPracticeDays) },
                  ...(personalRecords.mostUsedFeature ? [{ label: 'Ulubiona praktyka', value: personalRecords.mostUsedFeature }] : []),
                  ...(keyWords.length > 0 ? [{ label: 'Słowa klucze', value: keyWords.slice(0, 3).map(([w]) => w).join(' · ') }] : []),
                ].map(row => (
                  <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography style={{ fontSize: 11, color: subColor }}>{row.label}</Typography>
                    <Typography style={{ fontSize: 12, fontWeight: '600', color: textColor }}>{row.value}</Typography>
                  </View>
                ))}
              </View>
              <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 12 }} />
              <Typography style={{ fontSize: 10, color: subColor, textAlign: 'center', letterSpacing: 1 }}>
                {new Date().toLocaleDateString(getLocaleCode(), { year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </View>

            {/* Share button */}
            <Pressable
              onPress={handleShareReport}
              style={({ pressed }) => [styles.exportBtn, {
                borderColor: accent + '40',
                backgroundColor: isLight ? accent + '10' : accent + '10',
                opacity: pressed ? 0.82 : 1,
                marginTop: 12,
              }]}
            >
              <Share2 color={accent} size={16} strokeWidth={1.8} />
              <Typography variant="cardTitle" style={{ color: accent, marginLeft: 10, fontSize: 14 }}>
                Udostępnij raport tygodnia
              </Typography>
              <ArrowRight color={accent + '88'} size={14} style={{ marginLeft: 'auto' } as any} />
            </Pressable>

            {/* Copy to clipboard hint */}
            <Typography style={{ fontSize: 11, color: subColor, textAlign: 'center', marginTop: 10, lineHeight: 18 }}>
              Raport zostanie skopiowany jako czytelny tekst — możesz wkleić go do notatek, wiadomości lub innej aplikacji.
            </Typography>
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── Closing editorial ─────────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(380).duration(560)}>
            <Typography variant="premiumLabel" color={accent} style={styles.sectionEyebrow}>Warstwa premium raportu</Typography>
            <Typography variant="bodyRefined" style={[styles.closingLead, { color: textColor }]}>
              To nie ma być lista obserwacji. To ma być czytelna kompozycja: co wraca, co się domaga uwagi i jaki ruch naprawdę domyka ten tydzień.
            </Typography>
            <Typography variant="bodySmall" style={[styles.closingCopy, { color: subColor }]}>
              Jeśli traktujesz ten ekran jak panel dowodzenia, powinien po jednej minucie zostawić jasność, a nie tylko estetyczne wrażenie. Dlatego każda sekcja ma prowadzić do decyzji, nie do samego podziwiania insightu.
            </Typography>
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── Practical next actions ────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(400).duration(560)}>
            <View style={styles.sectionHead}>
              <Compass color={accent} size={18} strokeWidth={1.7} />
              <Typography variant="premiumLabel" color={accent} style={{ marginLeft: 8 }}>Co z tego wynika praktycznie</Typography>
            </View>
            {[
              'Zobacz, która energia wraca częściej niż pozostałe.',
              'Potraktuj ją jako temat tygodnia, nie jednorazowy epizod.',
              'Zamień raport w jedno pytanie do Oracle albo jeden uczciwy wpis.',
            ].map((item) => (
              <View key={item} style={styles.actionRow}>
                <View style={[styles.actionDot, { backgroundColor: accent }]} />
                <Typography variant="bodySmall" style={{ flex: 1, lineHeight: 22, color: textColor }}>{item}</Typography>
              </View>
            ))}
          </Animated.View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, height: 80, marginBottom: 10 },
  backBtn: { width: 44, alignItems: 'flex-start' },
  scrollContent: { flexGrow: 1, paddingHorizontal: layout.padding.screen, paddingTop: 10 },

  // Section structure
  sectionEyebrow: { marginBottom: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  divider: { height: 1, marginVertical: 28 },

  // Hero banner
  heroBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 20 },

  // Hero intro
  heroTitle: { lineHeight: 34, marginBottom: 12 },
  heroCopy: { lineHeight: 24, marginBottom: 18 },
  statPillRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  statPill: { flex: 1, minWidth: '22%', borderRadius: 16, borderWidth: 1, padding: 12, alignItems: 'center' },

  // Core mood
  moodTitle: { lineHeight: 34, marginBottom: 12 },
  moodCopy: { lineHeight: 24, marginBottom: 14 },
  inlineChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  inlineChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },

  // Mood chart card
  chartCard: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 4 },

  // Word chips
  wordChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },

  // Practice time bars
  practiceBarBg: { height: 8, borderRadius: 4, width: '100%', overflow: 'hidden' },
  practiceBarFill: { height: '100%', borderRadius: 4 },

  // Breakthrough moments
  breakthroughRow: { flexDirection: 'row', alignItems: 'flex-start', borderLeftWidth: 3, paddingLeft: 14, paddingVertical: 12, marginBottom: 10, borderRadius: 4 },

  // Primary focus
  focusTitle: { lineHeight: 30, marginBottom: 10 },
  focusCopy: { lineHeight: 22, marginBottom: 14 },
  inlineAction: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(128,128,128,0.22)' },

  // Three axes — left accent bar rows
  axisRow: { borderLeftWidth: 3, paddingLeft: 14, paddingVertical: 10, marginBottom: 12 },
  axisText: { lineHeight: 22 },

  // Weekly reading
  readingGrid: { flexDirection: 'row', marginBottom: 16 },
  readingCol: { flex: 1 },
  readingDivider: { width: 1, marginHorizontal: 16 },
  focusBox: { borderLeftWidth: 3, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 4 },

  // Layer rows (premium report)
  layerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, marginBottom: 8, borderBottomWidth: 0 },
  layerIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Signal rows
  signalRow: { borderLeftWidth: 3, paddingLeft: 14, paddingVertical: 12, marginBottom: 12, borderRadius: 4 },
  signalRowHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  signalRowText: { lineHeight: 22 },

  // Mood landscape
  moodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  moodName: { width: 100, fontWeight: '600', fontSize: 14 },
  moodBarContainer: { flex: 1, marginHorizontal: 14 },
  moodBarBg: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden' },
  moodBarFill: { height: '100%', borderRadius: 3 },
  moodPct: { width: 40, textAlign: 'right', fontSize: 12 },

  // Constellation
  constellationSection: { alignItems: 'center', marginBottom: 4 },

  // Soul report CTA
  soulCta: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderRadius: 18, overflow: 'hidden' },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },

  // Soul report sections
  soulSection: { borderLeftWidth: 3, paddingLeft: 14, paddingVertical: 10, marginBottom: 16 },
  soulSectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  regenerateBtn: { paddingVertical: 12, alignItems: 'center' },

  // Weekly insights card
  weeklyInsightCard: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 4 },

  // Personal records
  recordCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 14 },

  // Growth indicators
  growthCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14 },

  // Cosmic events
  cosmicEventRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14 },

  // Export preview
  exportPreviewCard: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden', marginBottom: 0 },

  // Export button
  exportBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },

  // Closing
  closingLead: { lineHeight: 28, marginBottom: 12 },
  closingCopy: { lineHeight: 23 },

  // Actions
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  actionDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
});
