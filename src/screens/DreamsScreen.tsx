// @ts-nocheck
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  StyleSheet, View, ScrollView, Pressable, TextInput,
  KeyboardAvoidingView, Keyboard, Platform, Text, Dimensions,
  Alert, TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, ChevronRight, Moon, Plus, Search, Sparkles,
  ArrowRight, BookOpen, Brain, Star, Eye, TrendingUp,
  Feather, Archive, Wand2, MoonStar, ScrollText, Trash2,
  Tag, RotateCcw, BarChart2, ChevronDown, ChevronUp, X,
  Sun, Zap, Heart, AlertTriangle, Repeat2, Lightbulb,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { DREAM_DICTIONARY } from '../features/dreams/data';
import { DREAMS_ROUTES } from '../features/dreams/routes';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { formatLocaleDate } from '../core/utils/localeFormat';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW, height: SH } = Dimensions.get('window');
const ACCENT = '#818CF8';

const extractSymbols = (text: string, symbols: Array<{ keyword: string }>) =>
  symbols.filter(s => text.toLowerCase().includes(s.keyword.toLowerCase())).slice(0, 6);

const getDailySymbol = (symbols: any[]) => {
  const d = new Date();
  const idx = (d.getFullYear() * 365 + d.getMonth() * 31 + d.getDate()) % symbols.length;
  return symbols[idx];
};

const getDailyPrompt = (prompts: string[]) => prompts[new Date().getDate() % prompts.length];

const getMoonAge = (): number => {
  const now = new Date();
  const jd = 367 * now.getFullYear()
    - Math.floor(7 * (now.getFullYear() + Math.floor((now.getMonth() + 10) / 12)) / 4)
    + Math.floor(275 * (now.getMonth() + 1) / 9)
    + now.getDate() + 1721013.5;
  return ((jd - 2451550.1) % 29.53058867 + 29.53058867) % 29.53058867;
};

const getMoonPhase = (phases: Array<{ max: number; emoji: string; label: string }>): { label: string; emoji: string; illumination: number } => {
  const age = getMoonAge();
  const illumination = Math.round(50 * (1 - Math.cos((age / 29.53058867) * 2 * Math.PI)));
  const found = phases.find(({ max }) => age < max) || phases[phases.length - 1];
  return { emoji: found.emoji, label: found.label, illumination };
};

const getCurrentMoonDreamData = (phaseName: string, moonDreamData: any[]) => {
  return moonDreamData.find(d => d.phase === phaseName) || moonDreamData[0];
};

// ── BACKGROUND ────────────────────────────────────────────────────────────────
const DreamsHeroBg = React.memo(({ isDark }: { isDark: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isDark ? ['#010208', '#030412', '#06081A'] : ['#F0F0FB', '#E8E4F8', '#DDD8F5']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={SH} style={StyleSheet.absoluteFill} opacity={isDark ? 0.26 : 0.14}>
      <G>
        <Path d={`M${SW * 0.72},48 C${SW * 0.60},56 ${SW * 0.54},74 ${SW * 0.60},92 C${SW * 0.48},86 ${SW * 0.44},68 ${SW * 0.54},48 Z`}
          fill={ACCENT} opacity={0.55} />
        <Circle cx={SW * 0.68} cy={70} r={38} stroke={ACCENT} strokeWidth={1.5} fill="none" opacity={0.38} />
        {Array.from({ length: 36 }, (_, i) => {
          const x = (i * 137 + 20) % SW;
          const y = (i * 89 + 10) % (SH * 0.82);
          const r = i % 7 === 0 ? 3.2 : i % 4 === 0 ? 2 : i % 2 === 0 ? 1.2 : 0.7;
          return <Circle key={i} cx={x} cy={y} r={r}
            fill={i % 7 === 0 ? ACCENT : i % 4 === 0 ? 'rgba(200,190,255,0.9)' : 'rgba(255,255,255,0.4)'}
            opacity={0.25 + (i % 5) * 0.1} />;
        })}
        {[0, 1, 2, 3, 4].map(i => (
          <Ellipse key={i} cx={SW * (0.1 + i * 0.22)} cy={SH * 0.45 + i * 28}
            rx={65 + i * 22} ry={18 + i * 6}
            stroke={ACCENT} strokeWidth={0.5} fill="none"
            opacity={0.15 - i * 0.02} strokeDasharray="4 8" />
        ))}
      </G>
    </Svg>
  </View>
));

// ── MOON GLOBE 3D ────────────────────────────────────────────────────────────
const MoonGlobe = React.memo(({ accent, isLight }: { accent: string; isLight?: boolean }) => {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const autoY = useSharedValue(0);

  useEffect(() => {
    autoY.value = withRepeat(
      withSequence(withTiming(15, { duration: 8000 }), withTiming(-15, { duration: 8000 })),
      -1, false,
    );
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-30, Math.min(30, e.translationY * 0.18));
      tiltY.value = Math.max(-30, Math.min(30, e.translationX * 0.18));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 500 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value + autoY.value}deg` },
    ],
  }));

  const STARS = Array.from({ length: 24 }, (_, i) => ({
    x: (i * 137 + 23) % 160,
    y: (i * 89 + 17) % 160,
    r: (i % 3 === 0) ? 2 : 1,
    op: 0.4 + (i % 5) * 0.1,
  })).filter(s => Math.hypot(s.x - 80, s.y - 80) > 63);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ height: 150, alignItems: 'center', justifyContent: 'center', marginVertical: 6 }, animStyle]}>
        <Svg width={150} height={150}>
          {STARS.map((s, i) => (
            <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={accent} opacity={s.op} />
          ))}
          <Circle cx={75} cy={75} r={60} fill={accent + '12'} />
          <Circle cx={75} cy={75} r={55} fill={accent + '18'} />
          <Circle cx={75} cy={75} r={50} fill={isLight ? '#C8C0A8' : '#E8DEC8'} stroke={accent} strokeWidth={1.5} />
          <Circle cx={58} cy={64} r={8} fill={isLight ? '#A89E88' : '#D4C9A8'} opacity={0.7} />
          <Circle cx={90} cy={85} r={6} fill={isLight ? '#A89E88' : '#D4C9A8'} opacity={0.6} />
          <Circle cx={70} cy={95} r={5} fill={isLight ? '#A89E88' : '#D4C9A8'} opacity={0.5} />
          <Circle cx={83} cy={53} r={5} fill={isLight ? '#A89E88' : '#D4C9A8'} opacity={0.55} />
          <Circle cx={92} cy={75} r={42} fill={isLight ? '#8A7A9A' : '#1A1228'} opacity={isLight ? 0.22 : 0.35} />
          <Circle cx={75} cy={75} r={68} fill="none" stroke={accent + '22'} strokeWidth={0.8} strokeDasharray="3,5" />
        </Svg>
      </Animated.View>
    </GestureDetector>
  );
});

// ── EMOTION BAR ────────────────────────────────────────────────────────────────
const EmotionBar = ({ label, emoji, count, total, color, isLight }: any) => {
  const sv = useSharedValue(0);
  useEffect(() => {
    sv.value = withTiming(total > 0 ? count / total : 0, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [count, total]);
  const barStyle = useAnimatedStyle(() => ({ width: `${sv.value * 100}%` }));
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor  = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <Text style={{ fontSize: 16, width: 24 }}>{emoji}</Text>
      <Text style={{ fontSize: 12, fontWeight: '700', color: textColor, width: 72 }}>{label}</Text>
      <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
        <Animated.View style={[{ height: 10, borderRadius: 5, backgroundColor: color }, barStyle]} />
      </View>
      <Text style={{ fontSize: 11, color: subColor, width: 22, textAlign: 'right' }}>{count}</Text>
    </View>
  );
};

// ── CLARITY SLIDER ────────────────────────────────────────────────────────────
const ClaritySlider = ({ value, onChange, accent, isLight }: any) => {
  const { t } = useTranslation(['dreams']);
  const STEPS = [1, 2, 3, 4, 5];
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';
  const labels = (t('form.clarityLabels', { ns: 'dreams', returnObjects: true }) as string[]) || [];
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
        {STEPS.map(step => (
          <Pressable key={step} onPress={() => onChange(step)} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <View style={{
              height: 36, borderRadius: 10, borderWidth: 1.5,
              backgroundColor: value >= step ? accent + '30' : 'transparent',
              borderColor: value >= step ? accent : isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)',
              alignItems: 'center', justifyContent: 'center',
              width: '100%',
            }}>
              <Text style={{ fontSize: 14, color: value >= step ? accent : subColor }}>{'★'}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      <Text style={{ fontSize: 10, color: subColor, textAlign: 'center', marginTop: 4 }}>
        {labels[(value - 1)] ?? t('form.clarityPlaceholder', { ns: 'dreams' })}
      </Text>
    </View>
  );
};

const DreamCalendar = ({
  dreamArchive, calendarMonth, onMonthChange,
  textColor, subColor, cardBg, cardBorder, isLight, onSelectEntry,
}: {
  dreamArchive: any[];
  calendarMonth: { year: number; month: number };
  onMonthChange: (m: { year: number; month: number }) => void;
  textColor: string; subColor: string; cardBg: string; cardBorder: string; isLight: boolean;
  onSelectEntry: (id: string) => void;
}) => {
  const { t } = useTranslation(['dreams']);
  const monthNames = (t('calendar.monthNames', { ns: 'dreams', returnObjects: true }) as string[]) || [];
  const weekdays = (t('calendar.weekdays', { ns: 'dreams', returnObjects: true }) as string[]) || [];
  const calendarStats = (t('calendar.stats', { ns: 'dreams', returnObjects: true }) as Array<{ id: string; label: string; icon: string }>) || [];
  const legendItems = (t('calendar.legend', { ns: 'dreams', returnObjects: true }) as Array<{ id: string; label: string }>) || [];
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { year, month } = calendarMonth;

  // Build grid
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const startOffset = firstDow === 0 ? 6 : firstDow - 1; // Mon-based offset
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map: day → dreams
  const dreamsByDay = useMemo(() => {
    const map: Record<number, any[]> = {};
    dreamArchive.forEach(e => {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(e);
      }
    });
    return map;
  }, [dreamArchive, year, month]);

  const selectedDreams = selectedDay ? (dreamsByDay[selectedDay] || []) : [];
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const prevMonth = () => {
    if (month === 0) onMonthChange({ year: year - 1, month: 11 });
    else onMonthChange({ year, month: month - 1 });
  };
  const nextMonth = () => {
    if (month === 11) onMonthChange({ year: year + 1, month: 0 });
    else onMonthChange({ year, month: month + 1 });
  };

  const totalDays = startOffset + daysInMonth;
  const gridCells = Math.ceil(totalDays / 7) * 7;
  const CELL_W = (SW - 44) / 7;

  // Monthly stats
  const daysWithDreams = Object.keys(dreamsByDay).length;
  const totalThisMonth = Object.values(dreamsByDay).reduce((acc, arr) => acc + arr.length, 0);
  const lucidThisMonth = dreamArchive.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month && e.tags?.includes('lucid');
  }).length;

  return (
    <Animated.View entering={FadeInDown.duration(250)}>
      {/* Month navigator */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: cardBorder, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={prevMonth} hitSlop={16} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color={ACCENT} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: textColor, fontSize: 17, fontWeight: '700' }}>{monthNames[month]}</Text>
          <Text style={{ color: subColor, fontSize: 11 }}>{year}</Text>
        </View>
        <Pressable onPress={nextMonth} hitSlop={16} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={18} color={ACCENT} />
        </Pressable>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {calendarStats.map(s => {
          const val = s.id === 'daysWithDreams'
            ? String(daysWithDreams)
            : s.id === 'entries'
              ? String(totalThisMonth)
              : String(lucidThisMonth);
          const color = s.id === 'daysWithDreams' ? ACCENT : s.id === 'entries' ? '#60A5FA' : '#34D399';
          return (
          <View key={s.label} style={{ flex: 1, backgroundColor: cardBg, borderRadius: 14, borderWidth: 1, borderColor: color + '33', paddingVertical: 12, alignItems: 'center', gap: 2, overflow: 'hidden' }}>
            <LinearGradient colors={[color + '12', 'transparent']} style={StyleSheet.absoluteFill} />
            <Text style={{ fontSize: 16 }}>{s.icon}</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color }}>{val}</Text>
            <Text style={{ fontSize: 9, color: subColor, textAlign: 'center' }}>{s.label}</Text>
          </View>
        )})}
      </View>

      {/* Weekday headers */}
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {weekdays.map(day => (
          <View key={day} style={{ width: CELL_W, alignItems: 'center', paddingVertical: 4 }}>
            <Text style={{ color: subColor, fontSize: 10, fontWeight: '700' }}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: cardBg, borderRadius: 18, borderWidth: 1, borderColor: cardBorder, padding: 4 }}>
        {Array.from({ length: gridCells }).map((_, idx) => {
          const dayNum = idx - startOffset + 1;
          const isValidDay = dayNum >= 1 && dayNum <= daysInMonth;
          const dreams = isValidDay ? (dreamsByDay[dayNum] || []) : [];
          const hasDreams = dreams.length > 0;
          const isToday = isCurrentMonth && isValidDay && dayNum === today.getDate();
          const isSelected = selectedDay === dayNum && isValidDay;
          const hasLucid = dreams.some(d => d.tags?.includes('lucid'));
          const hasNightmare = dreams.some(d => d.tags?.includes('koszmar'));

          return (
            <Pressable
              key={idx}
              onPress={() => isValidDay && setSelectedDay(isSelected ? null : dayNum)}
              style={{
                width: CELL_W, height: CELL_W + 4,
                alignItems: 'center', justifyContent: 'center',
                borderRadius: 10,
                backgroundColor: isSelected ? ACCENT + '33' : (isToday ? ACCENT + '18' : 'transparent'),
                borderWidth: isSelected ? 1.5 : isToday ? 1 : 0,
                borderColor: isSelected ? ACCENT + '88' : ACCENT + '55',
              }}
            >
              {isValidDay ? (
                <>
                  <Text style={{ fontSize: 13, fontWeight: hasDreams ? '700' : '400', color: isSelected ? ACCENT : (hasDreams ? textColor : subColor) }}>
                    {dayNum}
                  </Text>
                  {hasDreams && (
                    <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                      {hasLucid && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#34D399' }} />}
                      {hasNightmare && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#EF4444' }} />}
                      {!hasLucid && !hasNightmare && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: ACCENT }} />}
                    </View>
                  )}
                </>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 10, marginBottom: 16, paddingHorizontal: 4 }}>
        {legendItems.map(l => {
          const color = l.id === 'normal' ? ACCENT : l.id === 'lucid' ? '#34D399' : '#EF4444';
          return (
          <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
            <Text style={{ color: subColor, fontSize: 10 }}>{l.label}</Text>
          </View>
        )})}
      </View>

      {/* Selected day dreams */}
      {selectedDay !== null && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 }}>
              {t('calendar.monthDetailFormat', { ns: 'dreams', day: selectedDay, month: monthNames[month].toUpperCase() })}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: ACCENT + '30' }} />
          </View>
          {selectedDreams.length === 0 ? (
            <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: cardBorder, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginBottom: 8 }}>🌑</Text>
              <Text style={{ color: subColor, fontSize: 13 }}>{t('calendar.emptyDay', { ns: 'dreams' })}</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {selectedDreams.map((dream, i) => {
                const tagOpts = dream.tags?.slice(0, 2).map(t => DREAM_TAG_OPTIONS.find(o => o.id === t)).filter(Boolean) || [];
                return (
                  <Pressable key={dream.id} onPress={() => onSelectEntry(dream.id)}
                    style={{ backgroundColor: cardBg, borderRadius: 18, borderWidth: 1, borderColor: ACCENT + '33', padding: 16, overflow: 'hidden' }}>
                    <LinearGradient colors={[ACCENT + '12', 'transparent']} style={StyleSheet.absoluteFill} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18 }}>
                          {dream.tags?.includes('lucid') ? '💡' : dream.tags?.includes('koszmar') ? '😱' : '🌙'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: textColor, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{dream.title || t('tabs.0.label', { ns: 'dreams' })}</Text>
                        {dream.content && (
                          <Text style={{ color: subColor, fontSize: 12, marginTop: 2 }} numberOfLines={2}>{dream.content}</Text>
                        )}
                      </View>
                      <ChevronRight size={14} color={subColor} />
                    </View>
                    {tagOpts.length > 0 && (
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                        {tagOpts.map((t: any) => (
                          <View key={t.id} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: t.color + '22', borderWidth: 1, borderColor: t.color + '44' }}>
                            <Text style={{ color: t.color, fontSize: 10, fontWeight: '600' }}>{t.emoji} {t.label}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export const DreamsScreen = ({ navigation }: any) => {
  const { t } = useTranslation(['dreams', 'common']);
  const td = useCallback((key: string, options: any = {}) => t(key, { ns: 'dreams', ...options }), [t]);
  const tc = useCallback((key: string, options: any = {}) => t(key, { ns: 'common', ...options }), [t]);
  const insets = useSafeAreaInsets();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
  const { entries, addEntry, updateEntry, deleteEntry } = useJournalStore();
  const isDark = !isLight;
  const textColor  = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor   = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.60)';
  const cardBg     = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(96,165,250,0.18)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.10)';
  const dreamsData = useMemo(() => (td('data', { returnObjects: true }) as any) || {}, [td, i18n.language]);
  const tabItems = useMemo(() => (td('tabs', { returnObjects: true }) as Array<{ id: string; label: string; icon: string }>) || [], [td, i18n.language]);
  const dreamStats = useMemo(() => (td('sections.dreamStats', { returnObjects: true }) as Array<{ id: string; label: string; icon: string }>) || [], [td, i18n.language]);
  const patternStatsLabels = useMemo(() => (td('sections.patternStats', { returnObjects: true }) as Array<{ id: string; label: string; icon: string }>) || [], [td, i18n.language]);
  const moonStatsLabels = useMemo(() => (td('sections.moonStats', { returnObjects: true }) as Array<{ id: string; label: string; icon: string }>) || [], [td, i18n.language]);
  const lucidStatsLabels = useMemo(() => (td('sections.lucidStats', { returnObjects: true }) as Array<{ id: string; label: string; icon: string }>) || [], [td, i18n.language]);
  const emotionsMeta = dreamsData.emotions || [];
  const dreamTagOptions = dreamsData.dreamTagOptions || [];
  const symbolariumCats = dreamsData.symbolariumCategories || [];
  const extendedSymbols = dreamsData.extendedSymbols || [];
  const dailySymbols = dreamsData.dailySymbols || [];
  const nocturnalPrompts = dreamsData.nocturnalPrompts || [];
  const moonDreamDataSet = dreamsData.moonDreamData || [];
  const moonPhaseOptions = dreamsData.moonPhases || [];

  // ── Tab state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'sen' | 'symbolarium' | 'wzorce' | 'ksiezyc' | 'lucid' | 'kalendarz'>('sen');
  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });

  // ── New dream form state ──────────────────────────────────────────────────
  const [dreamTitle,   setDreamTitle]   = useState('');
  const [dreamContent, setDreamContent] = useState('');
  const [dreamEmotion, setDreamEmotion] = useState('');
  const [clarity,      setClarity]      = useState(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiResult,     setAiResult]     = useState('');
  const [showForm,     setShowForm]     = useState(false);

  // ── Symbolarium state ─────────────────────────────────────────────────────
  const [search,         setSearch]       = useState('');
  const [selectedCat,    setSelectedCat]  = useState('all');
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const tagsRailRef = useRef<ScrollView>(null);

  // ── Journal state ─────────────────────────────────────────────────────────
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Pattern AI state ──────────────────────────────────────────────────────
  const [patternLoading, setPatternLoading] = useState(false);
  const [patternResult,  setPatternResult]  = useState('');

  // ── Keyboard height ───────────────────────────────────────────────────────
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const scrollRef = useRef<ScrollView>(null);

  // ── Derived data ──────────────────────────────────────────────────────────
  const dreamArchive = useMemo(() => entries.filter(e => e.type === 'dream'), [entries]);
  const extractedSymbols = useMemo(() => extractSymbols(dreamContent, extendedSymbols), [dreamContent, extendedSymbols]);

  const filteredSymbolarium = useMemo(() => {
    let result = extendedSymbols;
    if (search.trim()) result = result.filter(s => s.keyword.toLowerCase().includes(search.toLowerCase()));
    if (selectedCat !== 'all') result = result.filter(s => s.cat === selectedCat);
    return result;
  }, [extendedSymbols, search, selectedCat]);

  const recurringSymbols = useMemo(() => {
    const counts: Record<string, number> = {};
    dreamArchive.forEach(entry => {
      extractSymbols(entry.content || entry.title || '', extendedSymbols).forEach(s => {
        counts[s.keyword] = (counts[s.keyword] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .filter(([, c]) => c > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([kw, count]) => ({ keyword: kw, count, symbol: extendedSymbols.find(d => d.keyword === kw) }));
  }, [dreamArchive, extendedSymbols]);

  const emotionStats = useMemo(() => {
    const counts: Record<string, number> = {};
    dreamArchive.forEach(e => { if (e.mood) counts[e.mood] = (counts[e.mood] || 0) + 1; });
    return emotionsMeta.map(em => ({ ...em, count: counts[em.id] || 0 }));
  }, [dreamArchive, emotionsMeta]);

  const tagStats = useMemo(() => {
    const counts: Record<string, number> = {};
    dreamArchive.forEach(e => {
      (e.tags || []).forEach(tag => { counts[tag] = (counts[tag] || 0) + 1; });
    });
    return dreamTagOptions.map(tag => ({ ...tag, count: counts[tag.id] || 0 }));
  }, [dreamArchive, dreamTagOptions]);

  const dreamStreak = useMemo(() => {
    if (dreamArchive.length === 0) return 0;
    const dates = dreamArchive.map(e => e.date.slice(0, 10)).sort().reverse();
    let streak = 0;
    let prev = new Date();
    prev.setHours(0, 0, 0, 0);
    for (const dateStr of dates) {
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      const diff = Math.round((prev.getTime() - d.getTime()) / 86400000);
      if (diff <= 1) { streak++; prev = d; } else break;
    }
    return streak;
  }, [dreamArchive]);

  const dailyPrompt  = useMemo(() => getDailyPrompt(nocturnalPrompts), [nocturnalPrompts]);
  const dailySymbol  = useMemo(() => getDailySymbol(dailySymbols), [dailySymbols]);
  const moonPhase    = useMemo(() => getMoonPhase(moonPhaseOptions), [moonPhaseOptions]);
  const moonDreamData = useMemo(() => getCurrentMoonDreamData(getMoonPhase(moonPhaseOptions).label, moonDreamDataSet), [moonDreamDataSet, moonPhaseOptions]);
  const aiAvailable  = AiService.isLaunchAvailable();

  const lucidCount     = useMemo(() => dreamArchive.filter(e => e.tags?.includes('lucid')).length, [dreamArchive]);
  const propheticCount = useMemo(() => dreamArchive.filter(e => e.tags?.includes('prorocze')).length, [dreamArchive]);

  // ── Tag toggle ────────────────────────────────────────────────────────────
  const toggleTag = useCallback((tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  }, []);

  // ── Save dream ────────────────────────────────────────────────────────────
  const saveDream = () => {
    if (dreamContent.trim().length < 2) return;
    try {
      HapticsService.notify();
    const title = dreamTitle.trim() || `${td('tabs.0.label')} ${formatLocaleDate(new Date())}`;
      const autoTags = extractedSymbols.map(s => s.keyword);
      addEntry({
        type:    'dream',
        title,
        content: dreamContent,
        mood:    dreamEmotion || undefined,
        energyLevel: clarity * 20,
        tags:    ['dream', ...selectedTags, ...autoTags],
      });
      setDreamTitle(''); setDreamContent(''); setDreamEmotion('');
      setClarity(3); setSelectedTags([]); setAiResult(''); setShowForm(false);
      setActiveTab('sen');
    } catch (e) {
      console.warn('[DreamsScreen] saveDream error:', e);
    }
    };

  // ── Interpret dream ───────────────────────────────────────────────────────
  const interpretDream = async () => {
    if (dreamContent.trim().length < 2) return;
    setAiLoading(true); setAiResult('');
    try {
      const promptParts = [
        td('ai.interpretPrompt.intro'),
        userData?.name ? td('ai.interpretPrompt.personPrefix', { name: userData.name }) : '',
        userData?.zodiacSign ? td('ai.interpretPrompt.zodiacPrefix', { sign: userData.zodiacSign }) : '',
        td('ai.interpretPrompt.dreamPrefix', { content: dreamContent }),
        dreamEmotion ? td('ai.interpretPrompt.emotionPrefix', { emotion: dreamEmotion }) : '',
        selectedTags.length > 0 ? td('ai.interpretPrompt.tagPrefix', { tags: selectedTags.join(', ') }) : '',
        selectedTags.includes('lucid') ? td('ai.interpretPrompt.lucidNote') : '',
        selectedTags.includes('powt') ? td('ai.interpretPrompt.repeatingNote') : '',
        td('ai.interpretPrompt.clarityPrefix', { clarity }),
        '',
        td('ai.interpretPrompt.instruction'),
        '',
        ...((td('ai.interpretPrompt.sectionDescriptions', { returnObjects: true }) as string[]) || []),
        '',
        td('ai.interpretPrompt.tone'),
      ].filter(Boolean);
      const resp = await AiService.chatWithOracle([{ role: 'user', content: promptParts.join('\n') }], i18n.language?.startsWith('en') ? 'en' : 'pl');
      setAiResult(resp);
    } catch {
      setAiResult(td('ai.interpretPrompt.fallback'));
    }
    setAiLoading(false);
  };

  // ── AI pattern analysis ───────────────────────────────────────────────────
  const analyzePatterns = async () => {
    if (dreamArchive.length < 2) return;
    setPatternLoading(true); setPatternResult('');
    try {
      const recentDreams = dreamArchive.slice(0, 7).map(d => `"${d.title}": ${d.content?.slice(0, 150) || ''}`).join('\n');
      const emotions = emotionStats.filter(e => e.count > 0).map(e => `${e.id}(${e.count}x)`).join(', ');
      const symbols = recurringSymbols.map(s => `${s.keyword}(${s.count}x)`).join(', ');
      const promptParts = [
        td('ai.patternPrompt.intro'),
        '',
        td('ai.patternPrompt.recentDreams', { count: Math.min(dreamArchive.length, 7) }),
        recentDreams,
        '',
        td('ai.patternPrompt.recurringSymbols', { symbols: symbols || td('ai.patternPrompt.none') }),
        td('ai.patternPrompt.dominantEmotions', { emotions: emotions || td('ai.patternPrompt.none') }),
        td('ai.patternPrompt.streak', { count: dreamStreak }),
        '',
        td('ai.patternPrompt.instruction'),
        '',
        ...((td('ai.patternPrompt.sectionDescriptions', { returnObjects: true }) as string[]) || []),
        '',
        td('ai.patternPrompt.tone'),
      ].filter(Boolean);
      const resp = await AiService.chatWithOracle([{ role: 'user', content: promptParts.join('\n') }], i18n.language?.startsWith('en') ? 'en' : 'pl');
      setPatternResult(resp);
    } catch {
      setPatternResult(td('ai.patternPrompt.fallback'));
    }
    setPatternLoading(false);
  };

  // ── Delete dream ──────────────────────────────────────────────────────────
  const handleDeleteDream = (id: string) => {
    Alert.alert(td('alerts.deleteTitle'), td('alerts.deleteBody'), [
      { text: tc('actions.cancel'), style: 'cancel' },
      { text: tc('actions.delete'), style: 'destructive', onPress: () => deleteEntry(id) },
    ]);
  };

  // ── Parsed AI sections ────────────────────────────────────────────────────
  const parsedAiSections = useMemo(() => {
    if (!aiResult) return [];
    const sectionKeys = (td('ai.interpretSections', { returnObjects: true }) as string[]) || [];
    const sectionDefs = [
      { key: sectionKeys[0], color: '#60A5FA' },
      { key: sectionKeys[1], color: '#A78BFA' },
      { key: sectionKeys[2], color: ACCENT },
      { key: sectionKeys[3], color: '#34D399' },
    ];
    return sectionDefs.map(sd => {
      const allKeys = sectionDefs.map(x => x.key + ':').join('|');
      const regex = new RegExp(`${sd.key}:\\s*([\\s\\S]*?)(?=(?:${allKeys})|$)`, 'i');
      const m = aiResult.match(regex);
      return { ...sd, text: m ? m[1].replace(/\*\*/g, '').replace(/\*/g, '').trim() : '' };
    }).filter(s => s.text.length > 0);
  }, [aiResult, td]);

  const parsedPatternSections = useMemo(() => {
    if (!patternResult) return [];
    const sectionKeys = (td('ai.patternSections', { returnObjects: true }) as string[]) || [];
    const sectionDefs = [
      { key: sectionKeys[0], color: '#FBBF24' },
      { key: sectionKeys[1], color: '#60A5FA' },
      { key: sectionKeys[2], color: '#A78BFA' },
      { key: sectionKeys[3], color: ACCENT },
      { key: sectionKeys[4], color: '#34D399' },
    ];
    return sectionDefs.map(sd => {
      const allKeys = sectionDefs.map(x => x.key + ':').join('|');
      const regex = new RegExp(`${sd.key}:\\s*([\\s\\S]*?)(?=(?:${allKeys})|$)`, 'i');
      const m = patternResult.match(regex);
      return { ...sd, text: m ? m[1].replace(/\*\*/g, '').replace(/\*/g, '').trim() : '' };
    }).filter(s => s.text.length > 0);
  }, [patternResult, td]);

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: isLight ? '#F0F0FB' : '#010208' }}>
      <DreamsHeroBg isDark={!isLight} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 10 : 0}
        >
          {/* ── MAIN SCROLL ──────────────────────────────────────────────────── */}
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[ds.scroll, {
              paddingTop: 0,
              paddingBottom: keyboardHeight > 0
                ? keyboardHeight + 120
                : screenContracts.bottomInset(insets.bottom, 'detail') + 80,
            }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            stickyHeaderIndices={[3]}
            removeClippedSubviews={true}
            overScrollMode="never"
          >

            {/* ── HEADER ─────────────────────────────────────────────────────── */}
            <View style={ds.header}>
              <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={ds.backBtn} hitSlop={14}>
                <ChevronLeft color={ACCENT} size={26} strokeWidth={1.6} />
              </Pressable>
              <View style={ds.headerCenter}>
                <Text style={[ds.headerEyebrow, { color: ACCENT }]}>{td('header.eyebrow')}</Text>
                <Text style={[ds.headerTitle, { color: textColor }]}>{td('header.title')}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Pressable
                  onPress={() => {
                    if (isFavoriteItem('dreams')) {
                      removeFavoriteItem('dreams');
                    } else {
                      addFavoriteItem({ id: td('header.favoriteId'), label: td('header.favoriteLabel'), route: DREAMS_ROUTES.dreams, params: {}, icon: 'Moon', color: ACCENT, addedAt: new Date().toISOString() });
                    }
                  }}
                  style={{ width: 32, height: 40, alignItems: 'center', justifyContent: 'center' }}
                  hitSlop={8}
                >
                  <Star color={isFavoriteItem('dreams') ? ACCENT : ACCENT + '88'} size={17} strokeWidth={1.8}
                    fill={isFavoriteItem('dreams') ? ACCENT : 'none'} />
                </Pressable>
                <Pressable
                  onPress={() => { setShowForm(true); setActiveTab('sen'); }}
                  style={[ds.addBtn, { borderColor: ACCENT + '44', backgroundColor: ACCENT + '14' }]}
                >
                  <Plus color={ACCENT} size={20} />
                </Pressable>
              </View>
            </View>

            {/* ── MOON GLOBE ─────────────────────────────────────────────────── */}
            <MoonGlobe accent={currentTheme.primary || ACCENT} isLight={isLight} />

            {/* ── MOON PHASE TEXT ──────────────────────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(12).duration(260)}>
              <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 }}>
                  {moonPhase.emoji} {moonPhase.label} · {moonPhase.illumination}% {td('moon.illuminationSuffix')}
                </Text>
                <Text style={{ color: subColor, fontSize: 11, marginTop: 2 }}>
                  {td('hero.metaLine', { dreams: dreamArchive.length, streak: dreamStreak, lucid: lucidCount })}
                </Text>
              </View>
            </Animated.View>

            {/* ── TAB BAR (sticky index 3) ──────────────────────────────────────── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled={true}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}>
              <View style={[ds.tabBar, {
                backgroundColor: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.35)',
                borderColor: cardBorder,
              }]}>
                {tabItems.map(tab => (
                  <Pressable
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    style={[ds.tab, activeTab === tab.id && { backgroundColor: ACCENT }]}
                  >
                    <Text style={{ fontSize: 13 }}>{tab.icon}</Text>
                    <Text style={[ds.tabText, { color: activeTab === tab.id ? '#FFF' : ACCENT + 'AA' }]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* ════════════════════════════════════════════════════════════════
                TAB: SEN — journal + new entry form
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'sen' && (
              <>
                {/* Stats row */}
                <Animated.View entering={FadeInDown.duration(250)}>
                  <View style={ds.statsRow}>
                    {dreamStats.map(s => {
                      const val = s.id === 'dreams' ? String(dreamArchive.length) : s.id === 'streak' ? String(dreamStreak) : String(lucidCount);
                      const color = s.id === 'dreams' ? ACCENT : s.id === 'streak' ? '#F97316' : '#34D399';
                      return (
                      <View key={s.label} style={[ds.statCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.12)', borderColor: color + '55' }]}>
                        <LinearGradient colors={[color + '10', 'transparent']} style={StyleSheet.absoluteFill} pointerEvents="none" />
                        <Text style={ds.statIcon}>{s.icon}</Text>
                        <Text style={[ds.statVal, { color }]}>{val}</Text>
                        <Text style={[ds.statLabel, { color: subColor }]}>{s.label}</Text>
                      </View>
                    )})}
                  </View>
                </Animated.View>

                {/* New entry CTA or form */}
                {!showForm ? (
                  <Animated.View entering={FadeInDown.delay(25).duration(260)}>
                    <Pressable
                      onPress={() => setShowForm(true)}
                      style={[ds.newDreamCta, { backgroundColor: cardBg, borderColor: ACCENT + '55' }]}
                    >
                      <LinearGradient colors={[ACCENT + '18', 'transparent']} style={StyleSheet.absoluteFillObject} />
                      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center' }}>
                        <Feather color={ACCENT} size={24} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: ACCENT, fontSize: 15, fontWeight: '700' }}>{td('form.ctaTitle')}</Text>
                        <Text style={{ color: subColor, fontSize: 13, marginTop: 3, lineHeight: 18 }}>{td('form.ctaSubtitle')}</Text>
                      </View>
                      <Plus color={ACCENT} size={22} strokeWidth={1.8} />
                    </Pressable>
                  </Animated.View>
                ) : (
                  <Animated.View entering={FadeInDown.delay(25).duration(280)}>
                    {/* ── DREAM FORM ──────────────────────────────────────── */}
                    <View style={[ds.formCard, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}>
                      <LinearGradient colors={[ACCENT + '16', 'transparent']} style={StyleSheet.absoluteFillObject as any} />

                      {/* Form header */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center' }}>
                          <Feather color={ACCENT} size={18} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[ds.eyebrow, { color: ACCENT, marginBottom: 1 }]}>{td('form.cardEyebrow')}</Text>
                          <Text style={{ fontSize: 11, color: subColor }}>{td('form.cardTitle')}</Text>
                        </View>
                        <Pressable onPress={() => { setShowForm(false); setAiResult(''); }} hitSlop={10}>
                          <X color={subColor} size={18} />
                        </Pressable>
                      </View>

                      {/* Daily prompt */}
                      <View style={[ds.promptChip, { backgroundColor: ACCENT + '0C', borderColor: ACCENT + '22' }]}>
                        <Moon color={ACCENT} size={12} />
                        <Text style={{ flex: 1, fontSize: 12, color: subColor, fontStyle: 'italic', lineHeight: 18 }}>{dailyPrompt}</Text>
                      </View>

                      {/* Title */}
                      <Text style={[ds.fieldLabel, { color: ACCENT }]}>{td('form.titleLabel')}</Text>
                      <TextInput
                        value={dreamTitle}
                        onChangeText={setDreamTitle}
                        placeholder={td('form.titlePlaceholder')}
                        placeholderTextColor={subColor}
                        returnKeyType="done"
                        style={[ds.titleInput, {
                          color: textColor,
                          backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)',
                          borderColor: cardBorder,
                        }]}
                      />

                      {/* Content */}
                      <Text style={[ds.fieldLabel, { color: ACCENT }]}>{td('form.contentLabel')}</Text>
                      <TextInput
                        value={dreamContent}
                        onChangeText={setDreamContent}
                        placeholder={td('form.contentPlaceholder')}
                        placeholderTextColor={subColor}
                        multiline
                        textAlignVertical="top"
                        returnKeyType="done"
                        style={[ds.contentInput, {
                          color: textColor,
                          backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)',
                          borderColor: cardBorder,
                        }]}
                      />

                      {/* Auto-detected symbols */}
                      {extractedSymbols.length > 0 && (
                        <View style={{ backgroundColor: ACCENT + '0A', borderRadius: 12, padding: 12, marginBottom: 14 }}>
                          <Text style={[ds.eyebrow, { color: ACCENT }]}>{td('form.detectedSymbols', { count: extractedSymbols.length })}</Text>
                          {extractedSymbols.map(s => (
                            <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ACCENT + '18' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={{ fontSize: 14 }}>{s.emoji}</Text>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>{s.keyword}</Text>
                              </View>
                              <Text style={{ fontSize: 11, color: subColor }}>{s.cat}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Emotion selector */}
                      <Text style={[ds.fieldLabel, { color: ACCENT }]}>{td('form.dominantEmotion')}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                        {emotionsMeta.map(em => {
                          const active = dreamEmotion === em.id;
                          return (
                            <Pressable
                              key={em.id}
                              onPress={() => setDreamEmotion(active ? '' : em.id)}
                              style={[ds.emotionChip, {
                                borderColor: active ? em.color : cardBorder,
                                backgroundColor: active ? em.color + '22' : 'transparent',
                              }]}
                            >
                              <Text style={{ fontSize: 14 }}>{em.emoji}</Text>
                              <Text style={[ds.emotionLabel, { color: active ? em.color : subColor }]}>{em.id}</Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* Clarity slider */}
                      <Text style={[ds.fieldLabel, { color: ACCENT }]}>{td('form.clarityLabel')}</Text>
                      <ClaritySlider value={clarity} onChange={setClarity} accent={ACCENT} isLight={isLight} />

                      {/* Dream tags */}
                      <Text style={[ds.fieldLabel, { color: ACCENT, marginTop: 14 }]}>{td('form.tagsLabel')}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
                        {dreamTagOptions.map(tag => {
                          const active = selectedTags.includes(tag.id);
                          return (
                            <Pressable
                              key={tag.id}
                              onPress={() => toggleTag(tag.id)}
                              style={[ds.toggleChip, {
                                borderColor: active ? tag.color : cardBorder,
                                backgroundColor: active ? tag.color + '1A' : 'transparent',
                              }]}
                            >
                              <Text style={{ fontSize: 12 }}>{tag.emoji}</Text>
                              <Text style={{ fontSize: 11, fontWeight: '600', color: active ? tag.color : subColor }}>
                                {tag.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* spacer so form content isn't hidden behind floating footer */}
                      <View style={{ height: 72 }} />
                    </View>
                  </Animated.View>
                )}

                {/* AI interpretation result */}
                {(aiLoading || aiResult) && (
                  <Animated.View entering={FadeInDown.delay(50).duration(260)}>
                    <View style={[ds.aiResultCard, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}>
                      <LinearGradient colors={[ACCENT + '18', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Brain color={ACCENT} size={18} strokeWidth={1.8} />
                        <Text style={[ds.eyebrow, { color: ACCENT, marginBottom: 0 }]}>{td('form.aiLabel')}</Text>
                      </View>
                      {aiLoading ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Text style={{ fontSize: 20 }}>🌙</Text>
                          <Text style={{ color: subColor, fontSize: 13, fontStyle: 'italic' }}>{td('form.aiLoading')}</Text>
                        </View>
                      ) : parsedAiSections.length > 0 ? (
                        <View style={{ gap: 10 }}>
                          {parsedAiSections.map((sec, i) => (
                            <Animated.View key={sec.key} entering={FadeInDown.delay(i * 80).duration(230)}>
                              <View style={{
                                borderRadius: 14, borderWidth: 1, borderLeftWidth: 3,
                                borderColor: sec.color + '33', borderLeftColor: sec.color,
                                padding: 12, gap: 4,
                                backgroundColor: sec.color + '08',
                              }}>
                                <Text style={{ color: sec.color, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }}>{sec.key}</Text>
                                <Text style={{ color: textColor, fontSize: 13.5, lineHeight: 21 }}>{sec.text}</Text>
                              </View>
                            </Animated.View>
                          ))}
                        </View>
                      ) : (
                        <Text style={{ color: textColor, fontSize: 14, lineHeight: 22 }}>{aiResult}</Text>
                      )}
                    </View>
                  </Animated.View>
                )}

                {/* Dream archive */}
                <Text style={[ds.sectionLabel, { color: ACCENT }]}>{td('archive.title', { count: dreamArchive.length })}</Text>

                {dreamArchive.length === 0 ? (
                  <Animated.View entering={FadeInDown.delay(25).duration(480)}>
                    <View style={[ds.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                      <Text style={ds.emptyMoon}>🌙</Text>
                      <Text style={[ds.emptyTitle, { color: ACCENT }]}>{td('form.emptyTitle')}</Text>
                      <Text style={[ds.emptySub, { color: subColor }]}>{td('form.emptyDescription')}</Text>
                      <Pressable onPress={() => setShowForm(true)}
                        style={[ds.emptyBtn, { backgroundColor: ACCENT }]}>
                        <Text style={ds.emptyBtnText}>{td('form.emptyCta')}</Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                ) : (
                  dreamArchive.map((entry, i) => {
                    const emotMeta = emotionsMeta.find(e => e.id === entry.mood);
                    const isExpanded = expandedId === entry.id;
                    const clarityLevel = entry.energyLevel ? Math.round(entry.energyLevel / 20) : 0;
                    const entryTags = (entry.tags || []).filter(t => t !== 'dream' && dreamTagOptions.find(o => o.id === t));
                    return (
                      <Animated.View key={entry.id} entering={FadeInDown.delay(i * 30).duration(250)}>
                        <View style={[ds.archiveCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                          <LinearGradient colors={[ACCENT + '14', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                          <Pressable onPress={() => navigation?.navigate(DREAMS_ROUTES.dreamDetail, { dream: entry })}>
                            <View style={ds.archiveTop}>
                              <View style={[ds.archiveIcon, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '33' }]}>
                                <Moon color={ACCENT} size={16} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[ds.archiveTitle, { color: textColor }]}>{entry.title}</Text>
                                <Text style={[ds.archiveDate, { color: subColor }]}>
                                  {new Date(entry.date).toLocaleDateString(getLocaleCode(), { weekday: 'long', day: 'numeric', month: 'long' })}
                                </Text>
                              </View>
                              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                {emotMeta && (
                                  <View style={[ds.emotBadge, { backgroundColor: emotMeta.color + '22', borderColor: emotMeta.color + '55' }]}>
                                    <Text style={{ fontSize: 12 }}>{emotMeta.emoji}</Text>
                                    <Text style={{ fontSize: 9, color: emotMeta.color, fontWeight: '700' }}>{emotMeta.id}</Text>
                                  </View>
                                )}
                                {clarityLevel > 0 && (
                                  <Text style={{ fontSize: 10, color: subColor }}>{'★'.repeat(clarityLevel)}{'☆'.repeat(5 - clarityLevel)}</Text>
                                )}
                              </View>
                              {isExpanded
                                ? <ChevronUp color={subColor} size={16} strokeWidth={1.8} />
                                : <ChevronDown color={subColor} size={16} strokeWidth={1.8} />
                              }
                            </View>
                          </Pressable>

                          {/* Preview */}
                          {!isExpanded && entry.content && (
                            <Text style={[ds.archiveContent, { color: subColor }]} numberOfLines={2}>
                              {entry.content}
                            </Text>
                          )}

                          {/* Tags row preview */}
                          {!isExpanded && entryTags.length > 0 && (
                            <View style={[ds.tagsRow, { marginTop: 4 }]}>
                              {entryTags.map(tag => {
                                const meta = dreamTagOptions.find(o => o.id === tag);
                                return meta ? (
                                  <View key={tag} style={[ds.tagPill, { backgroundColor: meta.color + '18', borderColor: meta.color + '44' }]}>
                                    <Text style={{ fontSize: 9 }}>{meta.emoji}</Text>
                                    <Text style={[ds.tagPillText, { color: meta.color }]}>{meta.label}</Text>
                                  </View>
                                ) : null;
                              })}
                            </View>
                          )}

                          {/* Expanded content */}
                          {isExpanded && (
                            <Animated.View entering={FadeInDown.duration(300)}>
                              {entry.content && (
                                <Text style={[ds.archiveContentFull, { color: textColor }]}>{entry.content}</Text>
                              )}
                              {/* All tags */}
                              {entryTags.length > 0 && (
                                <View style={ds.tagsRow}>
                                  {entryTags.map(tag => {
                                    const meta = dreamTagOptions.find(o => o.id === tag);
                                    return meta ? (
                                      <View key={tag} style={[ds.tagPill, { backgroundColor: meta.color + '18', borderColor: meta.color + '44' }]}>
                                        <Text style={{ fontSize: 10 }}>{meta.emoji}</Text>
                                        <Text style={[ds.tagPillText, { color: meta.color }]}>{meta.label}</Text>
                                      </View>
                                    ) : null;
                                  })}
                                </View>
                              )}
                              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                                <Pressable
                                  onPress={() => navigation?.navigate(DREAMS_ROUTES.dreamDetail, { dream: entry })}
                                  style={[ds.interpretBtn, { flex: 1, borderColor: ACCENT + '44', backgroundColor: ACCENT + '12' }]}
                                >
                                  <Sparkles color={ACCENT} size={13} />
                                  <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT }}>{td('form.detailsAndAi')}</Text>
                                </Pressable>
                                <Pressable
                                  onPress={() => handleDeleteDream(entry.id)}
                                  style={[ds.interpretBtn, { borderColor: '#E8705A44', backgroundColor: '#E8705A12' }]}
                                >
                                  <Trash2 color="#E8705A" size={13} />
                                </Pressable>
                              </View>
                            </Animated.View>
                          )}
                        </View>
                      </Animated.View>
                    );
                  })
                )}

                {/* Tips */}
                <Animated.View entering={FadeInDown.delay(25).duration(480)}>
                  <View style={[ds.tipsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <Text style={[ds.eyebrow, { color: ACCENT }]}>{td('archive.tipsTitle')}</Text>
                    {((td('archive.tips', { returnObjects: true }) as Array<[string, string]>) || []).map(([title, body], i) => (
                      <View key={title} style={[ds.tipRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ACCENT + '14' }]}>
                        <View style={[ds.tipNum, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '33' }]}>
                          <Text style={[ds.tipNumText, { color: ACCENT }]}>{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[ds.tipTitle, { color: textColor }]}>{title}</Text>
                          <Text style={[ds.tipText, { color: subColor }]}>{body}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TAB: SYMBOLARIUM — extended dictionary with categories
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'symbolarium' && (
              <>
                {/* Symbol dnia hero */}
                <Animated.View entering={FadeInDown.duration(250)}>
                  <View style={[ds.symbolDniaCard, { backgroundColor: cardBg, borderColor: dailySymbol.color + '55' }]}>
                    <LinearGradient colors={[dailySymbol.color + '22', dailySymbol.color + '08']} style={StyleSheet.absoluteFillObject as any} />
                    <View style={ds.symbolDniaHeader}>
                      <Text style={[ds.eyebrow, { color: dailySymbol.color, marginBottom: 0 }]}>{td('symbolarium.dailySymbolEyebrow')}</Text>
                      <View style={[ds.symbolDniaBadge, { backgroundColor: dailySymbol.color + '28', borderColor: dailySymbol.color + '55' }]}>
                        <Text style={{ fontSize: 22 }}>{dailySymbol.emoji}</Text>
                      </View>
                    </View>
                    <Text style={[ds.symbolDniaName, { color: dailySymbol.color }]}>{dailySymbol.name}</Text>
                    <Text style={[ds.symbolDniaDesc, { color: isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.72)' }]}>{dailySymbol.desc}</Text>
                  </View>
                </Animated.View>

                {/* Search */}
                <Animated.View entering={FadeInDown.delay(25).duration(250)}>
                  <View style={[ds.searchBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <Search color={ACCENT} size={16} />
                    <TextInput
                      value={search}
                      onChangeText={setSearch}
                      placeholder={td('symbolarium.searchPlaceholder')}
                      placeholderTextColor={subColor}
                      style={[ds.searchInput, { color: textColor }]}
                    />
                    {search.length > 0 && (
                      <Pressable onPress={() => setSearch('')} hitSlop={10}>
                        <X color={subColor} size={14} />
                      </Pressable>
                    )}
                  </View>
                </Animated.View>

                {/* Category chips */}
                <ScrollView ref={tagsRailRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ds.tagsRail}>
                  {symbolariumCats.map((cat, catIdx) => {
                    const active = selectedCat === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => {
                          setSelectedCat(cat.id);
                          const offset = Math.max(0, catIdx * 100 - SW / 2 + 50);
                          tagsRailRef.current?.scrollTo({ x: offset, animated: true });
                        }}
                        style={[ds.tagChip, {
                          backgroundColor: active ? ACCENT + '22' : cardBg,
                          borderColor: active ? ACCENT + '66' : cardBorder,
                        }]}
                      >
                        <Text style={ds.tagChipIcon}>{cat.icon}</Text>
                        <Text style={[ds.tagText, { color: active ? ACCENT : subColor, fontWeight: active ? '700' : '500' }]}>
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text style={[ds.sectionLabel, { color: ACCENT }]}>{td('symbolarium.title', { count: filteredSymbolarium.length })}</Text>

                {filteredSymbolarium.map((symbol, idx) => {
                  const isExpandedSym = expandedSymbol === symbol.id;
                  return (
                    <Animated.View key={symbol.id} entering={FadeInDown.delay(idx * 15).duration(300)}>
                      <View style={[ds.symbolCard, { backgroundColor: cardBg, borderColor: symbol.color + '33' }]}>
                        <LinearGradient colors={[symbol.color + '0C', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                        <Pressable onPress={() => setExpandedSymbol(isExpandedSym ? null : symbol.id)}>
                          <View style={ds.symbolTop}>
                            <View style={[ds.symbolIcon, { backgroundColor: symbol.color + '22', borderColor: symbol.color + '44' }]}>
                              <Text style={{ fontSize: 18 }}>{symbol.emoji}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[ds.symbolKeyword, { color: symbol.color }]}>{symbol.keyword}</Text>
                              <Text style={[ds.symbolTheme, { color: subColor }]}>{symbol.cat}</Text>
                            </View>
                            {isExpandedSym
                              ? <ChevronUp color={subColor} size={14} />
                              : <ChevronDown color={subColor} size={14} />
                            }
                          </View>
                        </Pressable>
                        <Text style={[ds.symbolMeaning, { color: textColor }]}>{symbol.meaning}</Text>

                        {isExpandedSym && (
                          <Animated.View entering={FadeInDown.duration(280)}>
                            {/* Jungian layer */}
                            <View style={{ borderRadius: 10, padding: 10, backgroundColor: '#A78BFA' + '0C', borderWidth: 1, borderColor: '#A78BFA' + '22', marginBottom: 8 }}>
                              <Text style={{ fontSize: 9, fontWeight: '800', color: '#A78BFA', letterSpacing: 1.4, marginBottom: 4 }}>{td('symbolarium.jungianLayer')}</Text>
                              <Text style={{ fontSize: 12.5, color: textColor, lineHeight: 19 }}>{symbol.jungian}</Text>
                            </View>
                            {/* Shadow layer */}
                            <View style={{ borderRadius: 10, padding: 10, backgroundColor: '#6B7280' + '0C', borderWidth: 1, borderColor: '#6B7280' + '22', marginBottom: 8 }}>
                              <Text style={{ fontSize: 9, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.4, marginBottom: 4 }}>{td('symbolarium.shadowLayer')}</Text>
                              <Text style={{ fontSize: 12.5, color: textColor, lineHeight: 19 }}>{symbol.shadow}</Text>
                            </View>
                          </Animated.View>
                        )}

                        <View style={[ds.symbolPrompt, { backgroundColor: symbol.color + '0C', borderColor: symbol.color + '22' }]}>
                          <Eye color={symbol.color} size={12} />
                          <Text style={[ds.symbolPromptText, { color: symbol.color }]}>{symbol.followUpPrompt}</Text>
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}

                {filteredSymbolarium.length === 0 && (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Text style={{ fontSize: 32, marginBottom: 10 }}>🔍</Text>
                      <Text style={{ color: ACCENT, fontSize: 14, fontWeight: '700' }}>{td('symbolarium.emptyTitle')}</Text>
                      <Text style={{ color: subColor, fontSize: 12, marginTop: 4 }}>{td('symbolarium.emptyDescription')}</Text>
                  </View>
                )}
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TAB: WZORCE — AI pattern analysis + statistics
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'wzorce' && (
              <>
                {/* Overview stats */}
                <Animated.View entering={FadeInDown.duration(250)}>
                  <View style={ds.statsRow}>
                    {patternStatsLabels.map(s => {
                      const val = s.id === 'saved' ? String(dreamArchive.length) : s.id === 'nightStreak' ? String(dreamStreak) : String(recurringSymbols.length);
                      const color = s.id === 'saved' ? ACCENT : s.id === 'nightStreak' ? '#F97316' : '#A78BFA';
                      return (
                      <View key={s.label} style={[ds.statCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.12)', borderColor: color + '55' }]}>
                        <LinearGradient colors={[color + '10', 'transparent']} style={StyleSheet.absoluteFill} pointerEvents="none" />
                        <Text style={ds.statIcon}>{s.icon}</Text>
                        <Text style={[ds.statVal, { color }]}>{val}</Text>
                        <Text style={[ds.statLabel, { color: subColor }]}>{s.label}</Text>
                      </View>
                    )})}
                  </View>
                </Animated.View>

                {/* AI pattern CTA */}
                {aiAvailable && dreamArchive.length >= 2 && (
                  <Animated.View entering={FadeInDown.delay(25).duration(260)}>
                    <Pressable
                      onPress={analyzePatterns}
                      disabled={patternLoading}
                      style={[ds.aiCard, { backgroundColor: cardBg, borderColor: ACCENT + '55' }]}
                    >
                      <LinearGradient colors={[ACCENT + '1A', 'transparent']} style={StyleSheet.absoluteFill} />
                      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center' }}>
                        <Brain color={ACCENT} size={22} strokeWidth={1.8} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[ds.aiTitle, { color: ACCENT }]}>
                          {patternLoading ? td('patterns.aiLoadingTitle') : td('patterns.aiTitle')}
                        </Text>
                        <Text style={[ds.aiSub, { color: subColor }]}>
                          {td('patterns.aiCardTitle')}
                        </Text>
                      </View>
                      {!patternLoading && <ArrowRight color={ACCENT} size={15} />}
                    </Pressable>
                  </Animated.View>
                )}

                {/* Pattern result */}
                {(patternLoading || patternResult) && (
                  <Animated.View entering={FadeInDown.delay(25).duration(260)}>
                    <View style={[ds.aiResultCard, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}>
                      <LinearGradient colors={[ACCENT + '18', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Sparkles color={ACCENT} size={18} />
                        <Text style={[ds.eyebrow, { color: ACCENT, marginBottom: 0 }]}>{td('patterns.mapTitle')}</Text>
                      </View>
                      {patternLoading ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Text style={{ fontSize: 20 }}>🔮</Text>
                          <Text style={{ color: subColor, fontSize: 13, fontStyle: 'italic' }}>{td('patterns.aiLoading')}</Text>
                        </View>
                      ) : parsedPatternSections.length > 0 ? (
                        <View style={{ gap: 10 }}>
                          {parsedPatternSections.map((sec, i) => (
                            <Animated.View key={sec.key} entering={FadeInDown.delay(i * 80).duration(230)}>
                              <View style={{
                                borderRadius: 14, borderWidth: 1, borderLeftWidth: 3,
                                borderColor: sec.color + '33', borderLeftColor: sec.color,
                                padding: 12, gap: 4, backgroundColor: sec.color + '08',
                              }}>
                                <Text style={{ color: sec.color, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }}>{sec.key}</Text>
                                <Text style={{ color: textColor, fontSize: 13.5, lineHeight: 21 }}>{sec.text}</Text>
                              </View>
                            </Animated.View>
                          ))}
                        </View>
                      ) : (
                        <Text style={{ color: textColor, fontSize: 14, lineHeight: 22 }}>{patternResult}</Text>
                      )}
                    </View>
                  </Animated.View>
                )}

                {/* Recurring symbols */}
                <Animated.View entering={FadeInDown.delay(50).duration(280)}>
                  <View style={[ds.patternsCard, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}>
                    <LinearGradient colors={[ACCENT + '18', 'transparent']} style={StyleSheet.absoluteFill} />
                    <View style={ds.patternsHeader}>
                      <RotateCcw color={ACCENT} size={16} />
                      <Text style={[ds.eyebrow, { color: ACCENT, marginBottom: 0 }]}>{td('patterns.recurringTitle')}</Text>
                    </View>
                    {recurringSymbols.length === 0 ? (
                      <Text style={{ color: subColor, fontSize: 13, fontStyle: 'italic' }}>
                        {td('patterns.recurringEmpty')}
                      </Text>
                    ) : (
                      recurringSymbols.map((s, i) => {
                        const sym = s.symbol;
                        return (
                          <View key={s.keyword} style={[ds.patternRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ACCENT + '18' }]}>
                            {sym && <Text style={{ fontSize: 18, marginRight: 8 }}>{sym.emoji}</Text>}
                            <View style={[ds.patternDot, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '33' }]}>
                              <Text style={[ds.patternNum, { color: ACCENT }]}>{s.count}×</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[ds.patternKeyword, { color: ACCENT }]}>{s.keyword}</Text>
                              <Text style={[ds.patternTheme, { color: subColor }]}>{sym?.cat || ''}</Text>
                            </View>
                            <Eye color={ACCENT} size={14} opacity={0.6} />
                          </View>
                        );
                      })
                    )}
                  </View>
                </Animated.View>

                {/* Emotion chart */}
                <Animated.View entering={FadeInDown.delay(70).duration(280)}>
                  <View style={[ds.patternsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <LinearGradient colors={[ACCENT + '12', 'transparent']} style={StyleSheet.absoluteFill} />
                    <View style={ds.patternsHeader}>
                      <BarChart2 color={ACCENT} size={16} />
                      <Text style={[ds.eyebrow, { color: ACCENT, marginBottom: 0 }]}>{td('patterns.emotionsTitle')}</Text>
                    </View>
                    {dreamArchive.length === 0 ? (
                      <Text style={{ color: subColor, fontSize: 13, fontStyle: 'italic' }}>
                        {td('patterns.emotionsEmpty')}
                      </Text>
                    ) : (
                      emotionStats
                        .filter(e => e.count > 0)
                        .sort((a, b) => b.count - a.count)
                        .map(e => (
                          <EmotionBar key={e.id} label={e.id} emoji={e.emoji} count={e.count}
                            total={dreamArchive.length} color={e.color} isLight={isLight} />
                        ))
                    )}
                  </View>
                </Animated.View>

                {/* Tag statistics */}
                <Animated.View entering={FadeInDown.delay(160).duration(440)}>
                  <View style={[ds.patternsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <View style={ds.patternsHeader}>
                      <Tag color={ACCENT} size={16} />
                      <Text style={[ds.eyebrow, { color: ACCENT, marginBottom: 0 }]}>{td('patterns.dreamTypesTitle')}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {tagStats.map(tag => (
                        <View key={tag.id} style={{
                          flexDirection: 'row', alignItems: 'center', gap: 5,
                          paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
                          backgroundColor: tag.color + '18', borderWidth: 1, borderColor: tag.color + '44',
                        }}>
                          <Text style={{ fontSize: 13 }}>{tag.emoji}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: tag.color }}>{tag.label}</Text>
                          <View style={{ backgroundColor: tag.color + '33', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: tag.color }}>{tag.count}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </Animated.View>

                {/* 7-day streak */}
                <Animated.View entering={FadeInDown.delay(200).duration(440)}>
                  <View style={[ds.patternsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <View style={ds.patternsHeader}>
                      <MoonStar color={ACCENT} size={16} />
                      <Text style={[ds.eyebrow, { color: ACCENT, marginBottom: 0 }]}>{td('patterns.streakTitle')}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {Array.from({ length: 7 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (6 - i));
                        const dateStr = d.toISOString().slice(0, 10);
                        const hasDream = dreamArchive.some(e => e.date.slice(0, 10) === dateStr);
                        const dayName = d.toLocaleDateString(getLocaleCode(), { weekday: 'short' });
                        return (
                          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                            <View style={{
                              width: 32, height: 32, borderRadius: 10,
                              backgroundColor: hasDream ? ACCENT + '40' : cardBg,
                              borderWidth: 1, borderColor: hasDream ? ACCENT : cardBorder,
                              alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Text style={{ fontSize: hasDream ? 15 : 10, color: hasDream ? ACCENT : subColor }}>
                                {hasDream ? '🌙' : d.getDate()}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 9, color: subColor }}>{dayName}</Text>
                          </View>
                        );
                      })}
                    </View>
                    <Text style={{ color: subColor, fontSize: 12, marginTop: 10, fontStyle: 'italic' }}>
                      {dreamStreak === 0
                        ? td('patterns.streakEmpty')
                        : td('patterns.streakActive', { count: dreamStreak })}
                    </Text>
                  </View>
                </Animated.View>

                {/* Navigation links */}
                <Animated.View entering={FadeInDown.delay(140).duration(440)}>
                  <View style={[ds.codalejCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                    <LinearGradient colors={[ACCENT + '12', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                    <Text style={[ds.eyebrow, { color: ACCENT }]}>{td('patterns.exploreTitle')}</Text>
                    {((td('patterns.nextActions', { returnObjects: true }) as Array<{ id: string; title: string; subtitle?: string }>) || []).map((item, idx, arr) => {
                      const route = item.id === 'shadow' ? 'ShadowWork' : item.id === 'moon' ? DREAMS_ROUTES.lunarCalendar : 'JournalEntry';
                      const params = item.id === 'journal' ? { prompt: item.subtitle } : undefined;
                      const Icon = item.id === 'shadow' ? Eye : item.id === 'moon' ? MoonStar : BookOpen;
                      const color = item.id === 'shadow' ? '#C084FC' : item.id === 'moon' ? ACCENT : '#60A5FA';
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => navigation?.navigate(route, params)}
                          style={[ds.codalejRow, idx < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ACCENT + '28' }]}
                        >
                          <View style={[ds.codalejIcon, { backgroundColor: color + '1A' }]}>
                            <Icon color={color} size={22} strokeWidth={1.6} />
                          </View>
                          <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={[ds.codalejLabel, { color: textColor }]}>{item.title}</Text>
                            <Text style={[ds.codalejSub, { color: subColor }]}>{item.subtitle}</Text>
                          </View>
                          <ArrowRight color={ACCENT + 'AA'} size={16} />
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TAB: KSIĘŻYC — Moon-dream connection
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'ksiezyc' && (
              <>
                {/* Current moon hero */}
                <Animated.View entering={FadeInDown.duration(250)}>
                  <View style={[ds.moonHeroCard, { backgroundColor: cardBg, borderColor: moonDreamData.color + '55' }]}>
                    <LinearGradient colors={[moonDreamData.color + '20', moonDreamData.color + '06']} style={StyleSheet.absoluteFillObject as any} />
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                      <View style={{ alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 44 }}>{moonDreamData.emoji}</Text>
                        <Text style={{ fontSize: 10, color: isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.50)', fontWeight: '600' }}>
                          {moonPhase.illumination}% iluminacji
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[ds.eyebrow, { color: moonDreamData.color, marginBottom: 4 }]}>{td('patterns.nowPrefix')}{moonDreamData.phase.toUpperCase()}</Text>
                        <Text style={{ fontSize: 17, fontWeight: '700', color: textColor, marginBottom: 4 }}>{moonDreamData.dreamType}</Text>
                        <Text style={{ fontSize: 13, color: subColor, lineHeight: 20 }}>{moonDreamData.description}</Text>
                      </View>
                    </View>
                    {/* Favorable badges */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      <View style={[ds.moonBadge, {
                        backgroundColor: moonDreamData.lucidFavorable ? '#34D399' + '22' : cardBg,
                        borderColor: moonDreamData.lucidFavorable ? '#34D399' + '66' : cardBorder,
                      }]}>
                        <Text style={{ fontSize: 12 }}>💡</Text>
                        <Text style={{ fontSize: 11, color: moonDreamData.lucidFavorable ? '#34D399' : subColor, fontWeight: '600' }}>
                          {td('moon.badges.lucid', { mark: moonDreamData.lucidFavorable ? '✓' : '—' })}
                        </Text>
                      </View>
                      <View style={[ds.moonBadge, {
                        backgroundColor: moonDreamData.propheticFavorable ? '#FBBF24' + '22' : cardBg,
                        borderColor: moonDreamData.propheticFavorable ? '#FBBF24' + '66' : cardBorder,
                      }]}>
                        <Text style={{ fontSize: 12 }}>🔮</Text>
                        <Text style={{ fontSize: 11, color: moonDreamData.propheticFavorable ? '#FBBF24' : subColor, fontWeight: '600' }}>
                          {td('moon.badges.prophetic', { mark: moonDreamData.propheticFavorable ? '✓' : '—' })}
                        </Text>
                      </View>
                    </View>
                    <View style={[ds.symbolPrompt, { backgroundColor: moonDreamData.color + '0C', borderColor: moonDreamData.color + '22' }]}>
                      <Moon color={moonDreamData.color} size={12} />
                      <Text style={[ds.symbolPromptText, { color: moonDreamData.color }]}>{moonDreamData.tip}</Text>
                    </View>
                  </View>
                </Animated.View>

                {/* Full cycle guide */}
                <Animated.View entering={FadeInDown.delay(25).duration(260)}>
                  <Text style={[ds.sectionLabel, { color: ACCENT, marginTop: 4 }]}>{td('moon.cycleTitle')}</Text>
                </Animated.View>

                {moonDreamDataSet.map((phaseData, idx) => {
                  const isCurrent = phaseData.phase === moonDreamData.phase;
                  return (
                    <Animated.View key={phaseData.phase} entering={FadeInDown.delay(idx * 30 + 60).duration(340)}>
                      <View style={[ds.moonPhaseCard, {
                        backgroundColor: isCurrent ? phaseData.color + '1A' : cardBg,
                        borderColor: isCurrent ? phaseData.color + '66' : cardBorder,
                        borderWidth: isCurrent ? 1.5 : 1,
                      }]}>
                        {isCurrent && <LinearGradient colors={[phaseData.color + '18', 'transparent']} style={StyleSheet.absoluteFillObject as any} />}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <Text style={{ fontSize: 26 }}>{phaseData.emoji}</Text>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={{ fontSize: 14, fontWeight: '700', color: isCurrent ? phaseData.color : textColor }}>
                                {phaseData.phase}
                              </Text>
                              {isCurrent && (
                                <View style={{ backgroundColor: phaseData.color + '33', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                                  <Text style={{ fontSize: 9, fontWeight: '800', color: phaseData.color }}>{tc('status.now')}</Text>
                                </View>
                              )}
                            </View>
                            <Text style={{ fontSize: 12, color: isCurrent ? phaseData.color + 'CC' : subColor, fontWeight: '600', marginTop: 1 }}>
                              {phaseData.dreamType}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                            {phaseData.lucidFavorable && <Text style={{ fontSize: 14 }}>💡</Text>}
                            {phaseData.propheticFavorable && <Text style={{ fontSize: 14 }}>🔮</Text>}
                          </View>
                        </View>
                        {isCurrent && (
                          <Text style={{ fontSize: 12, color: isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.65)', lineHeight: 18, marginTop: 8 }}>
                            {phaseData.description}
                          </Text>
                        )}
                      </View>
                    </Animated.View>
                  );
                })}

                {/* Personal moon stats */}
                <Animated.View entering={FadeInDown.delay(280).duration(440)}>
                  <View style={[ds.patternsCard, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}>
                    <LinearGradient colors={[ACCENT + '16', 'transparent']} style={StyleSheet.absoluteFill} />
                    <View style={ds.patternsHeader}>
                      <TrendingUp color={ACCENT} size={16} />
                      <Text style={[ds.eyebrow, { color: ACCENT, marginBottom: 0 }]}>{td('moon.lunarDreamsTitle')}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {moonStatsLabels.map(s => {
                        const val = s.id === 'lucid' ? String(lucidCount) : s.id === 'prophetic' ? String(propheticCount) : String(dreamStreak);
                        const color = s.id === 'lucid' ? '#34D399' : s.id === 'prophetic' ? '#FBBF24' : ACCENT;
                        return (
                        <View key={s.label} style={{ flex: 1, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: color + '10', borderWidth: 1, borderColor: color + '33' }}>
                          <Text style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</Text>
                          <Text style={{ fontSize: 20, fontWeight: '800', color }}>{val}</Text>
                          <Text style={{ fontSize: 9, color: subColor, textAlign: 'center' }}>{s.label}</Text>
                        </View>
                      )})}
                    </View>
                    <Text style={{ color: subColor, fontSize: 12, marginTop: 12, fontStyle: 'italic', lineHeight: 18 }}>
                      {td('moon.lunarDreamsNote')}
                    </Text>
                  </View>
                </Animated.View>

                {/* Lucid tips */}
                <Animated.View entering={FadeInDown.delay(320).duration(440)}>
                  <View style={[ds.tipsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <Text style={[ds.eyebrow, { color: ACCENT }]}>{td('moon.lucidTipsTitle')}</Text>
                    {((td('moon.lucidTips', { returnObjects: true }) as Array<[string, string]>) || []).map(([title, body], i) => (
                      <View key={title} style={[ds.tipRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ACCENT + '14' }]}>
                        <View style={[ds.tipNum, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '33' }]}>
                          <Text style={[ds.tipNumText, { color: ACCENT }]}>{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[ds.tipTitle, { color: textColor }]}>{title}</Text>
                          <Text style={[ds.tipText, { color: subColor }]}>{body}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </Animated.View>

                {/* Link to Lunar Calendar */}
                <Animated.View entering={FadeInDown.delay(360).duration(440)}>
                  <Pressable
                    onPress={() => navigation?.navigate(DREAMS_ROUTES.lunarCalendar)}
                    style={[ds.aiCard, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}
                  >
                    <LinearGradient colors={[ACCENT + '16', 'transparent']} style={StyleSheet.absoluteFill} />
                    <MoonStar color={ACCENT} size={22} strokeWidth={1.8} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[ds.aiTitle, { color: ACCENT }]}>{td('moon.lunarCalendarTitle')}</Text>
                      <Text style={[ds.aiSub, { color: subColor }]}>{td('moon.lunarCalendarDescription')}</Text>
                    </View>
                    <ArrowRight color={ACCENT} size={15} />
                  </Pressable>
                </Animated.View>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TAB: LUCID — świadome śnienie
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'lucid' && (
              <>
                {/* Stats */}
                <Animated.View entering={FadeInDown.duration(250)}>
                  <View style={ds.statsRow}>
                    {lucidStatsLabels.map(s => {
                      const val = s.id === 'lucidDreams'
                        ? String(lucidCount)
                        : s.id === 'nightStreak'
                          ? String(dreamStreak)
                          : (lucidCount > 0 ? Math.round((lucidCount / Math.max(dreamArchive.length, 1)) * 100) + '%' : '0%');
                      const color = s.id === 'lucidDreams' ? '#34D399' : s.id === 'nightStreak' ? ACCENT : '#FBBF24';
                      return (
                      <View key={s.label} style={[ds.statCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.12)', borderColor: color + '55' }]}>
                        <LinearGradient colors={[color + '10', 'transparent']} style={StyleSheet.absoluteFill} pointerEvents="none" />
                        <Text style={ds.statIcon}>{s.icon}</Text>
                        <Text style={[ds.statVal, { color }]}>{val}</Text>
                        <Text style={[ds.statLabel, { color: subColor }]}>{s.label}</Text>
                      </View>
                    )})}
                  </View>
                </Animated.View>

                {/* Intro */}
                <Animated.View entering={FadeInDown.delay(25).duration(260)}>
                  <View style={[ds.symbolCard, { backgroundColor: cardBg, borderColor: '#34D399' + '44', overflow: 'hidden' }]}>
                    <LinearGradient colors={['#34D39918', 'transparent']} style={StyleSheet.absoluteFill} />
                    <Text style={[ds.eyebrow, { color: '#34D399' }]}>{td('lucid.introEyebrow')}</Text>
                    <Text style={{ fontSize: 13, color: textColor, lineHeight: 21 }}>
                      {td('lucid.introBody')}
                    </Text>
                  </View>
                </Animated.View>

                {/* Techniques */}
                <Animated.View entering={FadeInDown.delay(25).duration(260)}>
                  <Text style={[ds.sectionLabel, { color: ACCENT }]}>{td('lucid.techniquesTitle')}</Text>
                </Animated.View>
                {((td('lucid.techniques', { returnObjects: true }) as Array<{ tag: string; icon: string; difficulty: string; title: string; desc: string; steps: string[] }>) || []).map((tech, i) => (
                  <Animated.View key={tech.tag} entering={FadeInDown.delay(80 + i * 40).duration(250)}>
                    <View style={[ds.symbolCard, { backgroundColor: cardBg, borderColor: tech.color + '44', overflow: 'hidden' }]}>
                      <LinearGradient colors={[tech.color + '14', 'transparent']} style={StyleSheet.absoluteFill} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: tech.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 20 }}>{tech.icon}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: tech.color + '33' }}>
                              <Text style={{ fontSize: 9, color: tech.color, fontWeight: '700' }}>{tech.tag}</Text>
                            </View>
                            <Text style={{ fontSize: 10, color: subColor }}>{tech.difficulty}</Text>
                          </View>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, marginTop: 3 }}>{tech.title}</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, color: subColor, lineHeight: 19, marginBottom: 12 }}>{tech.desc}</Text>
                      <View style={{ gap: 6 }}>
                        {tech.steps.map((step, si) => (
                          <View key={si} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: tech.color + '22', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                              <Text style={{ fontSize: 10, color: tech.color, fontWeight: '700' }}>{si + 1}</Text>
                            </View>
                            <Text style={{ fontSize: 12, color: textColor, lineHeight: 18, flex: 1 }}>{step}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </Animated.View>
                ))}

                {/* Reality checks */}
                <Animated.View entering={FadeInDown.delay(260).duration(260)}>
                  <Text style={[ds.sectionLabel, { color: ACCENT, marginTop: 8 }]}>{td('lucid.realityChecksTitle')}</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(280).duration(250)}>
                  <View style={[ds.symbolCard, { backgroundColor: cardBg, borderColor: '#FBBF24' + '44', overflow: 'hidden' }]}>
                    <LinearGradient colors={['#FBBF2414', 'transparent']} style={StyleSheet.absoluteFill} />
                    <Text style={[ds.eyebrow, { color: '#FBBF24' }]}>{td('lucid.realityChecksEyebrow')}</Text>
                    <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 12 }}>
                      {td('lucid.realityChecksBody')}
                    </Text>
                    {((td('lucid.realityChecks', { returnObjects: true }) as Array<{ icon: string; title: string; desc: string }>) || []).map((rc, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                        <Text style={{ fontSize: 22, marginTop: 1 }}>{rc.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{rc.title}</Text>
                          <Text style={{ fontSize: 11, color: subColor, lineHeight: 17, marginTop: 2 }}>{rc.desc}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </Animated.View>

                {/* Dream signs */}
                <Animated.View entering={FadeInDown.delay(320).duration(260)}>
                  <Text style={[ds.sectionLabel, { color: ACCENT, marginTop: 8 }]}>{td('lucid.dreamSignsTitle')}</Text>
                  <View style={[ds.symbolCard, { backgroundColor: cardBg, borderColor: ACCENT + '44', overflow: 'hidden' }]}>
                    <LinearGradient colors={[ACCENT + '14', 'transparent']} style={StyleSheet.absoluteFill} />
                    <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 12 }}>
                      {td('lucid.dreamSignsBody')}
                    </Text>
                    {recurringSymbols.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={{ fontSize: 30, marginBottom: 8 }}>🌙</Text>
                        <Text style={{ fontSize: 13, color: subColor, textAlign: 'center', lineHeight: 18 }}>
                          {td('lucid.dreamSignsEmpty')}
                        </Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {recurringSymbols.map(rs => (
                          <View key={rs.keyword} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: (rs.symbol?.color || ACCENT) + '22', borderWidth: 1, borderColor: (rs.symbol?.color || ACCENT) + '44' }}>
                            <Text style={{ fontSize: 12, color: rs.symbol?.color || ACCENT, fontWeight: '700' }}>{rs.keyword}</Text>
                            <Text style={{ fontSize: 10, color: subColor, marginTop: 2 }}>{td('lucid.dreamSignsCount', { count: rs.count })}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </Animated.View>

                {/* Tonight intention */}
                <Animated.View entering={FadeInDown.delay(360).duration(260)}>
                  <Text style={[ds.sectionLabel, { color: ACCENT, marginTop: 8 }]}>{td('lucid.tonightIntentionTitle')}</Text>
                  <View style={[ds.symbolCard, { backgroundColor: cardBg, borderColor: '#A78BFA' + '44', overflow: 'hidden' }]}>
                    <LinearGradient colors={['#A78BFA14', 'transparent']} style={StyleSheet.absoluteFill} />
                    {((td('lucid.tonightBlocks', { returnObjects: true }) as Array<{ title: string; steps: string[] }>) || []).map((block, bi) => (
                      <View key={bi} style={{ marginBottom: bi === 0 ? 16 : 0 }}>
                        <Text style={{ fontSize: 11, color: '#A78BFA', fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 }}>✦ {block.title.toUpperCase()}</Text>
                        {block.steps.map((s, si) => (
                          <View key={si} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                            <Text style={{ fontSize: 12, color: '#A78BFA' }}>·</Text>
                            <Text style={{ fontSize: 12, color: textColor, lineHeight: 18, flex: 1 }}>{s}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </Animated.View>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TAB: KALENDARZ — monthly dream calendar
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'kalendarz' && (
              <DreamCalendar
                dreamArchive={dreamArchive}
                calendarMonth={calendarMonth}
                onMonthChange={setCalendarMonth}
                textColor={textColor}
                subColor={subColor}
                cardBg={cardBg}
                cardBorder={cardBorder}
                isLight={isLight}
                onSelectEntry={(id) => {
                  const entry = dreamArchive.find(e => e.id === id);
                  if (entry) navigation?.navigate(DREAMS_ROUTES.dreamDetail, { dream: entry });
                  else { setExpandedId(id); setActiveTab('sen'); }
                }}
              />
            )}

            <EndOfContentSpacer size="standard" />
          </ScrollView>

          {/* FLOATING FORM FOOTER — action buttons when dream form is open */}
          {activeTab === 'sen' && showForm && (
            <View style={{
              position: 'absolute',
              left: layout.padding.screen,
              right: layout.padding.screen,
              bottom: keyboardHeight > 0 ? keyboardHeight : insets.bottom + 16,
              backgroundColor: isDark ? 'rgba(8,5,22,0.96)' : 'rgba(255,255,255,0.96)',
              flexDirection: 'row',
              gap: 10,
            }}>
              {aiAvailable && (
                <Pressable
                  onPress={interpretDream}
                  disabled={aiLoading || dreamContent.trim().length < 2}
                  style={[ds.aiBtn, {
                    flex: 1,
                    borderColor: ACCENT + '44',
                    backgroundColor: ACCENT + '14',
                    opacity: dreamContent.trim().length >= 2 ? 1 : 0.45,
                  }]}
                >
                  <Sparkles color={ACCENT} size={15} />
                  <Text style={[ds.aiBtnText, { color: ACCENT }]}>
                    {aiLoading ? td('form.analyzing') : td('form.interpret')}
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={saveDream}
                disabled={dreamContent.trim().length < 2}
                style={[ds.saveBtn, {
                  flex: 1,
                  backgroundColor: dreamContent.trim().length >= 2 ? ACCENT : ACCENT + '55',
                }]}
              >
                <Archive color="#FFF" size={15} />
                <Text style={ds.saveBtnText}>{td('form.saveDream')}</Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// ── StyleSheet ─────────────────────────────────────────────────────────────────
const ds = StyleSheet.create({
  // Layout
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  backBtn:      { width: 38 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow:{ fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  headerTitle:  { fontSize: 20, fontWeight: '700', marginTop: 2, letterSpacing: -0.3 },
  addBtn:       { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Tabs
  tabBar:  { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 4, gap: 4 },
  tab:     { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  tabText: { fontSize: 11, fontWeight: '600' },

  // Scroll
  scroll:       { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  eyebrow:      { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 4, marginBottom: 8 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 18, borderWidth: 1, gap: 4, overflow: 'hidden' },
  statIcon: { fontSize: 18, marginBottom: 2 },
  statVal:  { fontSize: 24, fontWeight: '800' },
  statLabel:{ fontSize: 9, textAlign: 'center', lineHeight: 13 },

  // New dream CTA
  newDreamCta: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, borderWidth: 1.2, paddingVertical: 18, paddingHorizontal: 16, overflow: 'hidden' },

  // Form
  formCard:     { borderRadius: 24, borderWidth: 1, padding: 18, overflow: 'hidden' },
  fieldLabel:   { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, marginTop: 14 },
  titleInput:   { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 4 },
  contentInput: { borderWidth: 1, borderRadius: 14, padding: 14, minHeight: 120, fontSize: 14, lineHeight: 22, textAlignVertical: 'top', marginBottom: 14 },
  promptChip:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 4 },

  // Emotions
  emotionChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  emotionLabel: { fontSize: 11, fontWeight: '600' },
  emotBadge:    { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },

  // Toggles
  toggleChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },

  // Buttons
  saveBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14, borderRadius: 14 },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  aiBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  aiBtnText:   { fontSize: 12, fontWeight: '600' },

  // AI result
  aiResultCard: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden' },

  // Archive
  archiveCard:        { borderRadius: 22, borderWidth: 1, padding: 16, overflow: 'hidden', marginBottom: 0 },
  archiveTop:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  archiveIcon:        { width: 36, height: 36, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  archiveTitle:       { fontSize: 14, fontWeight: '600' },
  archiveDate:        { fontSize: 11, marginTop: 2 },
  archiveContent:     { fontSize: 13, lineHeight: 20, marginBottom: 6 },
  archiveContentFull: { fontSize: 13.5, lineHeight: 22, marginBottom: 12 },
  interpretBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },

  // Tags
  tagsRow:     { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6 },
  tagPill:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  tagPillText: { fontSize: 10, fontWeight: '500' },

  // Symbol search
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, height: 24 },
  tagsRail:    { paddingHorizontal: 0, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  tagChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  tagChipIcon: { fontSize: 14 },
  tagText:     { fontSize: 12 },

  // Symbol cards
  symbolDniaCard:   { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden', marginBottom: 4 },
  symbolDniaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  symbolDniaBadge:  { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  symbolDniaName:   { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  symbolDniaDesc:   { fontSize: 13, lineHeight: 20 },
  symbolCard:       { borderRadius: 18, borderWidth: 1, padding: 14, overflow: 'hidden' },
  symbolTop:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  symbolIcon:       { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  symbolKeyword:    { fontSize: 15, fontWeight: '700' },
  symbolTheme:      { fontSize: 11, marginTop: 2 },
  symbolMeaning:    { fontSize: 13, lineHeight: 20, marginBottom: 10 },
  symbolPrompt:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: 10, borderRadius: 10, borderWidth: 1 },
  symbolPromptText: { flex: 1, fontSize: 12, lineHeight: 18, fontStyle: 'italic' },

  // Patterns
  patternsCard:   { borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden' },
  patternsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  patternRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  patternDot:     { width: 36, height: 22, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  patternNum:     { fontSize: 11, fontWeight: '800' },
  patternKeyword: { fontSize: 14, fontWeight: '600' },
  patternTheme:   { fontSize: 11, marginTop: 2 },

  // AI card
  aiCard:  { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden' },
  aiTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  aiSub:   { fontSize: 12, lineHeight: 18 },

  // Explore
  codalejCard: { borderRadius: 20, borderWidth: 1.2, padding: 16, overflow: 'hidden' },
  codalejRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  codalejIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  codalejLabel:{ fontSize: 15, fontWeight: '700' },
  codalejSub:  { fontSize: 12, marginTop: 3, lineHeight: 17 },

  // Tips
  tipsCard:   { borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden' },
  tipRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  tipNum:     { width: 26, height: 26, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  tipNumText: { fontSize: 11, fontWeight: '800' },
  tipTitle:   { fontSize: 13, fontWeight: '600', marginBottom: 3 },
  tipText:    { fontSize: 12, lineHeight: 18 },

  // Empty state
  emptyCard:    { borderRadius: 22, borderWidth: 1, padding: 28, alignItems: 'center', overflow: 'hidden' },
  emptyMoon:    { fontSize: 44, marginBottom: 12 },
  emptyTitle:   { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  emptySub:     { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn:     { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14 },
  emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // Night prompt
  nightPrompt:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  nightPromptText: { flex: 1, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  // Moon tab
  moonHeroCard:  { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden' },
  moonBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  moonPhaseCard: { borderRadius: 16, padding: 14, overflow: 'hidden' },
});
