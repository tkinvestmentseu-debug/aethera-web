// @ts-nocheck
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { useOracleStore } from '../store/useOracleStore';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import {
  ChevronLeft, Flame, Star, BookOpen, Moon, Zap, Award, TrendingUp, Calendar, Heart,
} from 'lucide-react-native';

const { width: SW } = Dimensions.get('window');

// ── Design tokens (always dark/cosmic) ──────────────────────────────────────
const BG       = '#070810';
const ACCENT   = '#A78BFA';
const GOLD     = '#F59E0B';
const CARD_BG  = 'rgba(255,255,255,0.06)';
const CARD_BDR = 'rgba(255,255,255,0.10)';
const TEXT     = '#F0ECF8';
const SUB      = 'rgba(255,255,255,0.45)';

// ── Seed timeline ────────────────────────────────────────────────────────────
const SEED_TIMELINE_EVENTS = [
  { date: 'Dziś',        icon: '🔮', text: 'Rozmowa z Wyrocznią',    color: '#A78BFA' },
  { date: 'Wczoraj',     icon: '🌙', text: 'Czytanie horoskopu',     color: '#818CF8' },
  { date: '2 dni temu',  icon: '📖', text: 'Nowy wpis w dzienniku',  color: '#34D399' },
  { date: '3 dni temu',  icon: '🃏', text: 'Rozkład Tarota',         color: '#F59E0B' },
  { date: '4 dni temu',  icon: '🧘', text: 'Medytacja — 18 minut',   color: '#60A5FA' },
  { date: '5 dni temu',  icon: '🕯️', text: 'Rytuał Oczyszczenia',   color: '#F472B6' },
  { date: 'Tydzień temu',icon: '🌿', text: 'Kąpiel Dźwiękowa',      color: '#34D399' },
  { date: '8 dni temu',  icon: '💎', text: 'Przewodnik Kryształów',  color: '#A78BFA' },
];

// ── Section label ────────────────────────────────────────────────────────────
const SectionLabel = ({ children }: { children: string }) => (
  <View style={sh.sectionLabelRow}>
    <Text style={sh.sectionLabelText}>{children}</Text>
    <View style={sh.sectionLabelLine} />
  </View>
);

// ── Metric card (hero strip) ─────────────────────────────────────────────────
const MetricCard = ({
  icon: Icon, iconColor, value, label,
}: {
  icon: any; iconColor: string; value: string | number; label: string;
}) => (
  <View style={[sh.metricCard, { borderColor: iconColor + '28' }]}>
    <LinearGradient
      colors={[iconColor + '28', iconColor + '10']}
      style={sh.metricIconWrap}
    >
      <Icon color={iconColor} size={18} strokeWidth={1.8} />
    </LinearGradient>
    <Text style={[sh.metricValue, { color: iconColor }]}>{value}</Text>
    <Text style={sh.metricLabel}>{label}</Text>
  </View>
);

// ── Main component ───────────────────────────────────────────────────────────
export const SpiritualProgressScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  // ── Store data ─────────────────────────────────────────────────────────────
  const streaks      = useAppStore(s => s.streaks);
  const dailyProgress = useAppStore(s => s.dailyProgress);
  const meditationSessions = useAppStore(s => s.meditationSessions);
  const breathworkSessions = useAppStore(s => s.breathworkSessions);
  const { entries } = useJournalStore();
  const { pastSessions } = useOracleStore();

  // ── Derived stats ──────────────────────────────────────────────────────────
  const practiceCount = meditationSessions.length + breathworkSessions.length;
  // Use a composite "XP" score as proxy (same approach as ProfileScreen levelInfo)
  const xp = useMemo(
    () => pastSessions.length * 30 + entries.length * 20 + practiceCount * 25 + streaks.current * 5,
    [pastSessions.length, entries.length, practiceCount, streaks.current],
  );
  const daysActive = Math.max(streaks.highest, entries.length > 0 ? 1 : 0);

  // ── Spiritual type ─────────────────────────────────────────────────────────
  const spiritualType = useMemo(() => {
    if (xp >= 1000) return { label: 'Mistrz Duszy',  emoji: '🌟', nextXp: null,  color: GOLD,    from: 1000 };
    if (xp >= 500)  return { label: 'Strażnik',       emoji: '🔮', nextXp: 1000, color: ACCENT,  from: 500  };
    if (xp >= 200)  return { label: 'Uczeń',          emoji: '✨', nextXp: 500,  color: '#60A5FA', from: 200 };
    return           { label: 'Poszukiwacz',          emoji: '🌱', nextXp: 200,  color: '#34D399', from: 0   };
  }, [xp]);

  // ── Weekly heatmap ─────────────────────────────────────────────────────────
  const weekDays = useMemo(() => {
    const days = [];
    const now = new Date();
    // Find Monday of current week
    const dow = now.getDay(); // 0 = Sun
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + mondayOffset + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const prog = dailyProgress[key];
      let level = 0;
      if (prog) {
        const keys = Object.keys(prog).filter(k => (prog as any)[k]);
        if (keys.length >= 4) level = 3;
        else if (keys.length >= 2) level = 2;
        else if (keys.length >= 1) level = 1;
      }
      days.push({ label: ['Pn','Wt','Śr','Cz','Pt','So','Nd'][i], level, key });
    }
    return days;
  }, [dailyProgress]);

  const heatmapColor = (level: number) => {
    if (level === 3) return ACCENT;
    if (level === 2) return ACCENT + 'AA';
    if (level === 1) return ACCENT + '55';
    return 'rgba(255,255,255,0.07)';
  };

  // ── Achievements ───────────────────────────────────────────────────────────
  const ACHIEVEMENTS = useMemo(() => [
    { id: 'first_journal',   emoji: '📖', title: 'Pierwsza Notatka',    desc: 'Napisałeś/aś swój pierwszy wpis',     unlocked: entries.length > 0,           color: '#34D399' },
    { id: 'week_streak',     emoji: '🔥', title: 'Tydzień Ognia',       desc: '7 dni z rzędu aktywności',            unlocked: streaks.current >= 7,           color: '#FB923C' },
    { id: 'moon_lover',      emoji: '🌙', title: 'Miłośnik Księżyca',   desc: 'Otworzyłeś/aś LunarCalendar',        unlocked: true,                           color: '#818CF8' },
    { id: 'oracle_seeker',   emoji: '🔮', title: 'Poszukiwacz Wyroczni',desc: '10+ rozmów z Wyrocznią',              unlocked: pastSessions.length >= 10,      color: ACCENT },
    { id: 'crystal_heart',   emoji: '💎', title: 'Kryształowe Serce',   desc: 'Dodałeś/aś kryształ do kolekcji',    unlocked: false,                          color: '#67E8F9' },
    { id: 'tarot_master',    emoji: '🃏', title: 'Mistrz Tarota',       desc: '50 losowań kart',                     unlocked: xp >= 1000,                     color: '#C084FC' },
    { id: 'meditation_monk', emoji: '🧘', title: 'Mnich Medytacji',     desc: '30 dni medytacji',                    unlocked: streaks.highest >= 30,          color: '#60A5FA' },
    { id: 'community_star',  emoji: '⭐', title: 'Gwiazda Wspólnoty',   desc: 'Aktywny/a w Wspólnocie',              unlocked: true,                           color: GOLD },
    { id: 'dream_weaver',    emoji: '💭', title: 'Tkacz Snów',          desc: '5+ zapisanych snów',                  unlocked: false,                          color: '#F472B6' },
    { id: 'ritual_keeper',   emoji: '🕯️', title: 'Strażnik Rytuałów',  desc: 'Ukończono 5 rytuałów',                unlocked: practiceCount >= 5,             color: '#FB923C' },
    { id: 'healer',          emoji: '✨', title: 'Uzdrowiciel',         desc: 'Sesja dźwiękowa ukończona',           unlocked: true,                           color: '#4ADE80' },
    { id: 'astro_sage',      emoji: '🌟', title: 'Mędrzec Gwiazd',      desc: 'Czytałeś/aś horoskop 7 dni',         unlocked: daysActive >= 7,                color: GOLD },
  ], [entries.length, streaks.current, streaks.highest, pastSessions.length, practiceCount, xp, daysActive]);

  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;

  // ── XP progress bar ────────────────────────────────────────────────────────
  const xpProgress = useMemo(() => {
    if (!spiritualType.nextXp) return 1;
    const range = spiritualType.nextXp - spiritualType.from;
    const done  = xp - spiritualType.from;
    return Math.min(1, Math.max(0, done / range));
  }, [xp, spiritualType]);

  // ── Animated XP bar ───────────────────────────────────────────────────────
  const xpAnim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.timing(xpAnim, {
      toValue: xpProgress,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [xpProgress]);
  const xpBarWidth = xpAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={sh.root}>
      <LinearGradient
        colors={['#0D0A1E', '#070810', '#07090F']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
      />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* ── Header ── */}
        <Animated.View entering={FadeInUp.duration(400)} style={sh.header}>
          <Pressable
            onPress={() => goBackOrToMainTab(navigation, 'Portal')}
            style={sh.backBtn}
          >
            <ChevronLeft color={ACCENT} size={22} strokeWidth={2} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={sh.headerTitle}>{t('spiritualProgress.postep_duchowy', 'POSTĘP DUCHOWY')}</Text>
          </View>
          {/* Spacer to balance back button */}
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >

          {/* ═══ 1. HERO STATS STRIP ═══ */}
          <Animated.View entering={FadeInDown.delay(60).duration(500)} style={sh.section}>
            <SectionLabel>{t('spiritualProgress.statystyki', 'STATYSTYKI')}</SectionLabel>
            <View style={sh.metricsRow}>
              <MetricCard icon={Flame}    iconColor="#FB923C" value={streaks.current}  label={t('spiritualProgress.passa_dni', 'Passa (dni)')} />
              <MetricCard icon={Zap}      iconColor={ACCENT}  value={xp}               label={t('spiritualProgress.punkty_xp', 'Punkty XP')}   />
              <MetricCard icon={BookOpen} iconColor="#34D399" value={entries.length}   label={t('spiritualProgress.wpisy', 'Wpisy')}        />
              <MetricCard icon={Moon}     iconColor="#818CF8" value={daysActive}       label={t('spiritualProgress.dni_aktywnosci', 'Dni aktywności')} />
            </View>
          </Animated.View>

          {/* ═══ 2. WEEKLY HEATMAP ═══ */}
          <Animated.View entering={FadeInDown.delay(120).duration(500)} style={sh.section}>
            <SectionLabel>{t('spiritualProgress.aktywnosc_tego_tygodnia', 'AKTYWNOŚĆ TEGO TYGODNIA')}</SectionLabel>
            <View style={sh.heatmapRow}>
              {weekDays.map((d, i) => (
                <View key={d.key} style={sh.heatmapCell}>
                  <View
                    style={[
                      sh.heatmapBox,
                      {
                        backgroundColor: heatmapColor(d.level),
                        shadowColor: d.level === 3 ? ACCENT : 'transparent',
                        shadowOpacity: d.level === 3 ? 0.6 : 0,
                        shadowRadius: d.level === 3 ? 8 : 0,
                        elevation: d.level === 3 ? 5 : 0,
                      },
                    ]}
                  >
                    {d.level === 3 && (
                      <View style={sh.heatmapGlow} />
                    )}
                  </View>
                  <Text style={sh.heatmapLabel}>{d.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ═══ 3. ACHIEVEMENT BADGES ═══ */}
          <Animated.View entering={FadeInDown.delay(180).duration(500)}>
            <View style={[sh.section, { paddingBottom: 0 }]}>
              <View style={sh.sectionHeaderRow}>
                <SectionLabel>{t('spiritualProgress.osiagnieci', 'OSIĄGNIĘCIA')}</SectionLabel>
                <View style={sh.badgeCountPill}>
                  <Text style={sh.badgeCountText}>{unlockedCount}/{ACHIEVEMENTS.length} odblokowanych</Text>
                </View>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 12 }}
            >
              {ACHIEVEMENTS.map((badge) => (
                <View
                  key={badge.id}
                  style={[
                    sh.badgeCard,
                    badge.unlocked
                      ? { borderColor: badge.color + '44', backgroundColor: badge.color + '10' }
                      : { borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)' },
                  ]}
                >
                  {/* Glow for unlocked */}
                  {badge.unlocked && (
                    <View style={[sh.badgeGlow, { backgroundColor: badge.color + '18' }]} />
                  )}
                  <View style={{ alignItems: 'center', gap: 6 }}>
                    <View style={[
                      sh.badgeEmojiWrap,
                      badge.unlocked
                        ? { backgroundColor: badge.color + '22', borderColor: badge.color + '55', shadowColor: badge.color, shadowOpacity: 0.4, shadowRadius: 8 }
                        : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' },
                    ]}>
                      <Text style={[sh.badgeEmoji, !badge.unlocked && { opacity: 0.35 }]}>
                        {badge.emoji}
                      </Text>
                      {!badge.unlocked && (
                        <View style={sh.badgeLockOverlay}>
                          <Text style={{ fontSize: 10 }}>🔒</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[
                      sh.badgeTitle,
                      { color: badge.unlocked ? badge.color : 'rgba(255,255,255,0.28)' },
                    ]} numberOfLines={2}>
                      {badge.title}
                    </Text>
                    <Text style={sh.badgeDesc} numberOfLines={2}>{badge.desc}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ═══ 4. JOURNEY TIMELINE ═══ */}
          <Animated.View entering={FadeInDown.delay(240).duration(500)} style={sh.section}>
            <SectionLabel>{t('spiritualProgress.twoja_podroz', 'TWOJA PODRÓŻ')}</SectionLabel>
            <View style={sh.timelineWrap}>
              {SEED_TIMELINE_EVENTS.map((ev, i) => (
                <View key={i} style={sh.timelineItem}>
                  {/* Left rail: dot + line */}
                  <View style={sh.timelineRail}>
                    <View style={[sh.timelineDot, { backgroundColor: ev.color, shadowColor: ev.color, shadowOpacity: 0.6, shadowRadius: 6, elevation: 4 }]} />
                    {i < SEED_TIMELINE_EVENTS.length - 1 && (
                      <View style={[sh.timelineLine, { backgroundColor: ev.color + '28' }]} />
                    )}
                  </View>
                  {/* Content */}
                  <View style={sh.timelineContent}>
                    <View style={sh.timelineRow}>
                      <Text style={sh.timelineIcon}>{ev.icon}</Text>
                      <Text style={[sh.timelineText, { color: TEXT }]}>{ev.text}</Text>
                    </View>
                    <Text style={[sh.timelineDate, { color: ev.color + 'CC' }]}>{ev.date}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ═══ 5. SPIRITUAL TYPE CARD ═══ */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={[sh.section, { paddingBottom: 4 }]}>
            <SectionLabel>{t('spiritualProgress.twoj_typ_duchowy', 'TWÓJ TYP DUCHOWY')}</SectionLabel>
            <View style={sh.typeCard}>
              <LinearGradient
                colors={[spiritualType.color + '22', spiritualType.color + '08', 'transparent']}
                style={StyleSheet.absoluteFillObject as any}
              />
              {/* Top accent line */}
              <LinearGradient
                colors={[spiritualType.color + '00', spiritualType.color, spiritualType.color + '00']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: 1.5, marginBottom: 18 }}
              />
              <View style={{ alignItems: 'center', marginBottom: 18 }}>
                <Text style={sh.typeEmoji}>{spiritualType.emoji}</Text>
                <Text style={[sh.typeLabel, { color: spiritualType.color }]}>
                  {spiritualType.label}
                </Text>
                <Text style={sh.typeSub}>{t('spiritualProgress.twoj_poziom_duchowy', 'Twój poziom duchowy')}</Text>
              </View>

              {/* XP row */}
              <View style={sh.xpRow}>
                <Zap color={spiritualType.color} size={14} strokeWidth={2} />
                <Text style={[sh.xpText, { color: spiritualType.color }]}>{xp} XP</Text>
                {spiritualType.nextXp && (
                  <Text style={sh.xpNext}>/ {spiritualType.nextXp} do następnego poziomu</Text>
                )}
              </View>

              {/* Progress bar */}
              {spiritualType.nextXp ? (
                <View style={sh.xpBarTrack}>
                  <RNAnimated.View
                    style={[
                      sh.xpBarFill,
                      { width: xpBarWidth, backgroundColor: spiritualType.color },
                    ]}
                  />
                </View>
              ) : (
                <View style={sh.xpBarTrack}>
                  <View style={[sh.xpBarFill, { width: '100%', backgroundColor: GOLD }]} />
                </View>
              )}

              {spiritualType.nextXp === null && (
                <Text style={[sh.xpMaxLabel, { color: GOLD }]}>{t('spiritualProgress.osiagnales_najwyzszy_poziom', '✦ Osiągnąłeś/aś najwyższy poziom')}</Text>
              )}
            </View>
          </Animated.View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ── StyleSheet ───────────────────────────────────────────────────────────────
const METRIC_W = Math.floor((SW - 40 - 9 * 3) / 4);

const sh = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(167,139,250,0.14)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(167,139,250,0.10)',
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13, fontWeight: '800', letterSpacing: 2.5,
    color: ACCENT,
  },

  section: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 8,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  sectionLabelText: {
    fontSize: 10, fontWeight: '800', letterSpacing: 2.2,
    color: 'rgba(167,139,250,0.70)',
  },
  sectionLabelLine: {
    flex: 1, height: 1,
    backgroundColor: 'rgba(167,139,250,0.14)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: 9,
  },
  metricCard: {
    width: METRIC_W,
    paddingVertical: 16, paddingHorizontal: 6,
    borderRadius: 18, borderWidth: 1,
    backgroundColor: CARD_BG,
    alignItems: 'center', gap: 6,
    shadowColor: ACCENT, shadowOpacity: 0.08, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  metricIconWrap: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  metricValue: {
    fontSize: 22, fontWeight: '800', letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 0.3,
    color: SUB, textAlign: 'center',
  },

  // Heatmap
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heatmapCell: {
    alignItems: 'center', gap: 6, flex: 1,
  },
  heatmapBox: {
    width: 36, height: 36,
    borderRadius: 10,
    overflow: 'hidden',
  },
  heatmapGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ACCENT + '33',
    borderRadius: 10,
  },
  heatmapLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 0.3,
    color: SUB,
  },

  // Badge
  badgeCountPill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: ACCENT + '18',
    borderWidth: 1, borderColor: ACCENT + '44',
    marginRight: 20,
    marginBottom: 14,
  },
  badgeCountText: {
    fontSize: 11, fontWeight: '800', color: ACCENT,
  },
  badgeCard: {
    width: 110, paddingVertical: 16, paddingHorizontal: 10,
    borderRadius: 20, borderWidth: 1,
    alignItems: 'center', gap: 0,
    overflow: 'hidden',
  },
  badgeGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 20,
  },
  badgeEmojiWrap: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, marginBottom: 8, elevation: 4,
  },
  badgeEmoji: { fontSize: 26 },
  badgeLockOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(10,8,22,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeTitle: {
    fontSize: 11, fontWeight: '800', textAlign: 'center',
    letterSpacing: 0.1, lineHeight: 15,
  },
  badgeDesc: {
    fontSize: 9, color: SUB, textAlign: 'center',
    lineHeight: 13, marginTop: 4,
  },

  // Timeline
  timelineWrap: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineRail: {
    width: 28,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12, height: 12, borderRadius: 6,
    marginTop: 4, zIndex: 2,
  },
  timelineLine: {
    width: 2, flex: 1, marginTop: 2, marginBottom: 2,
    borderRadius: 1,
  },
  timelineContent: {
    flex: 1, paddingBottom: 14, paddingLeft: 8,
  },
  timelineRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  timelineIcon: { fontSize: 16 },
  timelineText: {
    fontSize: 14, fontWeight: '600',
  },
  timelineDate: {
    fontSize: 11, fontWeight: '600', marginTop: 3,
    letterSpacing: 0.2,
  },

  // Spiritual type
  typeCard: {
    borderRadius: 24, borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.18)',
    overflow: 'hidden', paddingHorizontal: 22,
    paddingBottom: 22,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  typeEmoji: { fontSize: 48, marginBottom: 4 },
  typeLabel: {
    fontSize: 28, fontWeight: '800', letterSpacing: -0.5,
  },
  typeSub: {
    fontSize: 12, color: SUB, fontWeight: '600',
    letterSpacing: 0.3, marginTop: 4,
  },
  xpRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 10,
  },
  xpText: {
    fontSize: 15, fontWeight: '800',
  },
  xpNext: {
    fontSize: 11, color: SUB, fontWeight: '600',
  },
  xpBarTrack: {
    height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  xpBarFill: {
    height: 8, borderRadius: 4,
  },
  xpMaxLabel: {
    fontSize: 12, fontWeight: '700', textAlign: 'center',
    marginTop: 12, letterSpacing: 0.3,
  },
});

export default SpiritualProgressScreen;
