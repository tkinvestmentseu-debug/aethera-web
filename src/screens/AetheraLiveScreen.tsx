// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput,
  StyleSheet, Dimensions, Modal, KeyboardAvoidingView,
  Pressable, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, FadeInDown, cancelAnimation, Easing,
} from 'react-native-reanimated';
import {
  ChevronLeft, Radio, Eye, Heart, Zap, Moon, Flame,
  Send, X, Check, Users, Clock, Star, Bell, BellOff,
  Play, Video,
} from 'lucide-react-native';
import {
  collection, addDoc, onSnapshot, query, orderBy, limit,
  serverTimestamp, updateDoc, doc, increment, Timestamp,
} from 'firebase/firestore';
import { db } from '../core/config/firebase.config';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { HapticsService } from '../core/services/haptics.service';
import { formatLocaleNumber } from '../core/utils/localeFormat';

const { width: SW } = Dimensions.get('window');

// ── Force dark ────────────────────────────────────────────────────────────────
const isLight = false;
const ACCENT = '#EF4444';
const SP = 18;
const BG = '#07080F';
const TEXT = '#F0EBE2';
const SUB = 'rgba(240,235,226,0.52)';
const CARD_BG = 'rgba(255,255,255,0.05)';
const CARD_BORDER = 'rgba(255,255,255,0.08)';

// ── Category filter options ──────────────────────────────────────────────────
const FILTER_CATS = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'Medytacja', label: 'Medytacja' },
  { id: 'Rytuał', label: 'Rytuał' },
  { id: 'Tarot', label: 'Tarot' },
  { id: 'Oracle', label: 'Oracle' },
  { id: 'Breathwork', label: 'Breathwork' },
  { id: 'Q&A', label: 'Q&A' },
  { id: 'Uzdrowienie', label: 'Uzdrowienie' },
];

// ── Session type badge colors ────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  Medytacja: '#818CF8', Rytuał: '#8B5CF6', Tarot: '#A78BFA',
  Oracle: '#C084FC', Breathwork: '#06B6D4', 'Q&A': '#10B981',
  Uzdrowienie: '#F59E0B', Astrologia: '#F472B6', Numerologia: '#FB923C',
  Wykład: '#60A5FA', Rozmowa: '#34D399',
};

const STREAM_CATEGORIES = [
  'Medytacja', 'Tarot', 'Astrologia', 'Uzdrowienie',
  'Rytuał', 'Oracle', 'Breathwork', 'Q&A', 'Numerologia', 'Wykład',
];

const REACTION_ICONS = [
  { key: 'fire', emoji: '🔥', label: 'Ogień' },
  { key: 'heart', emoji: '❤️', label: 'Serce' },
  { key: 'spark', emoji: '✨', label: 'Iskra' },
  { key: 'moon', emoji: '🌙', label: 'Księżyc' },
];

// ── Seed streams ─────────────────────────────────────────────────────────────
const SEED_STREAMS = [
  {
    id: 'seed_1', hostId: 'seed_host_1', hostName: 'Magdalena Kry', hostEmoji: '🔮',
    title: 'Medytacja Pełni — Uwolnienie Blokad', category: 'Medytacja',
    description: 'Wejdź w krąg intencji i uwolnij to, co Cię zatrzymuje.',
    status: 'live', startedAt: new Date(Date.now() - 18 * 60000),
    viewerCount: 214, peakViewers: 214,
    reactions: { fire: 87, heart: 156, spark: 201, moon: 63 },
    tags: ['pełnia', 'medytacja', 'uwolnienie'],
  },
  {
    id: 'seed_2', hostId: 'seed_host_2', hostName: 'Artur Sol', hostEmoji: '☀️',
    title: 'Tarot Wiosny — Odczyt dla Zbiorowości', category: 'Tarot',
    description: 'Zbiorowy odczyt kart — energia i wskazówka na nadchodzący sezon.',
    status: 'upcoming', scheduledAt: new Date(Date.now() + 35 * 60000),
    viewerCount: 0, peakViewers: 0,
    reactions: { fire: 0, heart: 0, spark: 0, moon: 0 },
    tags: ['tarot', 'wiosna', 'odczyt'],
  },
  {
    id: 'seed_3', hostId: 'seed_host_3', hostName: 'Luna Vega', hostEmoji: '🌙',
    title: 'Binaural & Healing — 528 Hz Uzdrowienie', category: 'Uzdrowienie',
    description: 'Sesja dźwiękowa ze świętymi częstotliwościami dla serca i duszy.',
    status: 'ended', startedAt: new Date(Date.now() - 4 * 3600000),
    viewerCount: 0, peakViewers: 389,
    reactions: { fire: 142, heart: 320, spark: 411, moon: 188 },
    tags: ['dźwięk', 'uzdrowienie', 'binaural'],
  },
];

// ── Seed schedule (today + tomorrow) ─────────────────────────────────────────
const SEED_SCHEDULE = [
  {
    id: 'sch_1', hostName: 'Magdalena Kry', hostEmoji: '🔮', hostFollowers: '2.4k',
    topic: 'Rytuał Nowego Księżyca', type: 'Rytuał', timeLabel: 'Teraz',
    timeMs: Date.now() - 5 * 60000, duration: '45 min', participants: 214,
    isLive: true, dayLabel: 'Dziś',
  },
  {
    id: 'sch_2', hostName: 'Artur Sol', hostEmoji: '☀️', hostFollowers: '1.8k',
    topic: 'Tarot Wiosny — Odczyt Zbiorowy', type: 'Tarot', timeLabel: '18:00',
    timeMs: Date.now() + 35 * 60000, duration: '60 min', participants: 0,
    isLive: false, dayLabel: 'Dziś',
  },
  {
    id: 'sch_3', hostName: 'Zosia Zen', hostEmoji: '🧘', hostFollowers: '890',
    topic: 'Breathwork Energetyczny', type: 'Breathwork', timeLabel: '20:30',
    timeMs: Date.now() + 2.5 * 3600000, duration: '30 min', participants: 0,
    isLive: false, dayLabel: 'Dziś',
  },
  {
    id: 'sch_4', hostName: 'Luna Vega', hostEmoji: '🌙', hostFollowers: '3.1k',
    topic: 'Medytacja Głębokiego Snu', type: 'Medytacja', timeLabel: '21:00',
    timeMs: Date.now() + 4 * 3600000, duration: '35 min', participants: 0,
    isLive: false, dayLabel: 'Dziś',
  },
  {
    id: 'sch_5', hostName: 'Dawid Swiat', hostEmoji: '🌍', hostFollowers: '560',
    topic: 'Q&A: Astrologia i Tranzyt Saturna', type: 'Q&A', timeLabel: '19:00',
    timeMs: Date.now() + 24 * 3600000, duration: '50 min', participants: 0,
    isLive: false, dayLabel: 'Jutro',
  },
  {
    id: 'sch_6', hostName: 'Arabella Star', hostEmoji: '⭐', hostFollowers: '4.2k',
    topic: 'Oracle Channel — Otwarty Kanał Przepowiedni', type: 'Oracle', timeLabel: '20:00',
    timeMs: Date.now() + 28 * 3600000, duration: '90 min', participants: 0,
    isLive: false, dayLabel: 'Jutro',
  },
];

// ── Seed featured hosts ───────────────────────────────────────────────────────
const SEED_HOSTS = [
  {
    id: 'host_1', name: 'Arabella Star', emoji: '⭐', specialty: 'Oracle & Channeling',
    followers: '4.2k', rating: 4.9, sessions: 48, badge: 'Mistrzyni',
  },
  {
    id: 'host_2', name: 'Magdalena Kry', emoji: '🔮', specialty: 'Rytuały Księżycowe',
    followers: '2.4k', rating: 4.8, sessions: 32, badge: 'Przewodniczka',
  },
  {
    id: 'host_3', name: 'Luna Vega', emoji: '🌙', specialty: 'Healing Sound 528Hz',
    followers: '3.1k', rating: 4.95, sessions: 61, badge: 'Uzdrowicielka',
  },
  {
    id: 'host_4', name: 'Artur Sol', emoji: '☀️', specialty: 'Tarot & Numerologia',
    followers: '1.8k', rating: 4.7, sessions: 25, badge: 'Jasnowidz',
  },
];

// ── Seed archive / replays ────────────────────────────────────────────────────
const SEED_ARCHIVE = [
  {
    id: 'arch_1', title: 'Equinox Ritual — Równonocna Ceremonia', host: 'Arabella Star', hostEmoji: '⭐',
    duration: '1h 12min', views: 1847, type: 'Rytuał', gradientColors: ['#4C1D95', '#7C3AED'],
  },
  {
    id: 'arch_2', title: 'Pełnia w Skorpionie — Medytacja Uwolnienia', host: 'Magdalena Kry', hostEmoji: '🔮',
    duration: '44 min', views: 2104, type: 'Medytacja', gradientColors: ['#1E1B4B', '#4338CA'],
  },
  {
    id: 'arch_3', title: '528 Hz Głębokie Uzdrowienie DNA', host: 'Luna Vega', hostEmoji: '🌙',
    duration: '55 min', views: 3211, type: 'Uzdrowienie', gradientColors: ['#064E3B', '#059669'],
  },
  {
    id: 'arch_4', title: 'Wiosenny Tarot — Zbiorowy Odczyt', host: 'Artur Sol', hostEmoji: '☀️',
    duration: '1h 3min', views: 987, type: 'Tarot', gradientColors: ['#78350F', '#D97706'],
  },
];

// ── Module-level animated component ──────────────────────────────────────────
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Pulsing LIVE dot ─────────────────────────────────────────────────────────
const LiveDot = React.memo(() => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(withSequence(
      withTiming(1.4, { duration: 700 }),
      withTiming(1, { duration: 700 }),
    ), -1, false);
    opacity.value = withRepeat(withSequence(
      withTiming(0.4, { duration: 700 }),
      withTiming(1, { duration: 700 }),
    ), -1, false);
    return () => { cancelAnimation(scale); cancelAnimation(opacity); };
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return (
    <Animated.View style={[{ width: 9, height: 9, borderRadius: 5, backgroundColor: ACCENT }, style]} />
  );
});

// ─── Floating reaction ────────────────────────────────────────────────────────
const FloatingReaction = React.memo(({ emoji, onDone }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const x = useRef(Math.random() * 60 - 30).current;
  useEffect(() => {
    translateY.value = withTiming(-200, { duration: 1800, easing: Easing.out(Easing.cubic) });
    opacity.value = withSequence(
      withTiming(1, { duration: 400 }),
      withTiming(0, { duration: 1400 }),
    );
    const t = setTimeout(onDone, 1900);
    return () => clearTimeout(t);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: x }],
    opacity: opacity.value,
  }));
  return (
    <Animated.Text style={[{ position: 'absolute', bottom: 10, left: SW / 2 - 20, fontSize: 28 }, style]}>
      {emoji}
    </Animated.Text>
  );
});

// ─── Live Now Banner ──────────────────────────────────────────────────────────
const LiveNowBanner = React.memo(({ streams, onPress }) => {
  const { t } = useTranslation();

  const liveStreams = streams.filter(s => s.status === 'live');
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (liveStreams.length === 0) return;
    pulse.value = withRepeat(
      withSequence(withTiming(1.015, { duration: 1400 }), withTiming(1, { duration: 1400 })),
      -1, false,
    );
    return () => cancelAnimation(pulse);
  }, [liveStreams.length]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  if (liveStreams.length === 0) return null;
  const totalViewers = liveStreams.reduce((sum, s) => sum + (s.viewerCount || 0), 0);
  return (
    <Animated.View style={[style, { marginHorizontal: SP, marginBottom: 14 }]}>
      <Pressable
        onPress={() => onPress && onPress(liveStreams[0])}
        style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: ACCENT + '50' }}
      >
        <LinearGradient
          colors={['rgba(239,68,68,0.22)', 'rgba(239,68,68,0.08)', 'rgba(0,0,0,0)']}
          style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: ACCENT + '50' }}>
            <Radio size={20} color={ACCENT} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <LiveDot />
              <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 }}>
                {liveStreams.length > 1 ? `${liveStreams.length} SESJE NA ŻYWO` : 'NA ŻYWO TERAZ'}
              </Text>
            </View>
            <Text style={{ color: TEXT, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
              {liveStreams[0].title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <Users size={11} color={SUB} strokeWidth={1.8} />
              <Text style={{ color: SUB, fontSize: 12 }}>{formatLocaleNumber(totalViewers)} uczestników</Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: ACCENT, borderRadius: 14 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{t('aetherLive.dolacz', 'Dołącz')}</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
});

// ─── Stream Card ──────────────────────────────────────────────────────────────
const StreamCard = React.memo(({ stream, onPress, index }) => {
  const { t } = useTranslation();

  const elapsed = stream.status === 'live'
    ? Math.floor((Date.now() - (stream.startedAt?.toDate?.() || stream.startedAt).getTime()) / 60000)
    : null;
  const countdown = stream.status === 'upcoming'
    ? Math.floor(((stream.scheduledAt?.toDate?.() || stream.scheduledAt).getTime() - Date.now()) / 60000)
    : null;
  const catColor = CAT_COLORS[stream.category] || ACCENT;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <Pressable onPress={onPress} style={[sh.streamCard, { backgroundColor: CARD_BG, borderColor: CARD_BORDER }]}>
        {stream.status === 'live' && (
          <LinearGradient
            colors={['rgba(239,68,68,0.08)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <LinearGradient
            colors={stream.status === 'live' ? ['#EF4444', '#B91C1C'] : ['#374151', '#1F2937']}
            style={sh.hostAvatar}
          >
            <Text style={{ fontSize: 26 }}>{stream.hostEmoji}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              {stream.status === 'live' && <LiveDot />}
              {stream.status === 'live' && (
                <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>{t('aetherLive.na_zywo', 'NA ŻYWO')}</Text>
              )}
              {stream.status === 'upcoming' && countdown !== null && (
                <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>
                  ZA {countdown} MIN
                </Text>
              )}
              {stream.status === 'ended' && (
                <Text style={{ color: SUB, fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>{t('aetherLive.zapis', 'ZAPIS')}</Text>
              )}
              <View style={[sh.catBadge, { backgroundColor: catColor + '18', borderColor: catColor + '40' }]}>
                <Text style={{ color: catColor, fontSize: 10, fontWeight: '600' }}>{stream.category}</Text>
              </View>
            </View>
            <Text style={{ color: TEXT, fontSize: 15, fontWeight: '700', marginBottom: 2 }} numberOfLines={1}>
              {stream.title}
            </Text>
            <Text style={{ color: SUB, fontSize: 12, lineHeight: 16 }} numberOfLines={1}>
              {stream.hostName}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Eye size={13} color={SUB} strokeWidth={1.8} />
            <Text style={{ color: SUB, fontSize: 12 }}>
              {stream.status === 'ended'
                ? `${formatLocaleNumber(stream.peakViewers)} szczyt`
                : `${formatLocaleNumber(stream.viewerCount)} oglądających`}
            </Text>
          </View>
          {elapsed !== null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={12} color={SUB} strokeWidth={1.8} />
              <Text style={{ color: SUB, fontSize: 11 }}>{elapsed} min</Text>
            </View>
          )}
          {stream.status === 'live' && (
            <Pressable style={[sh.joinBtn, { backgroundColor: ACCENT }]}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.8 }}>{t('aetherLive.dolacz_1', 'DOŁĄCZ')}</Text>
            </Pressable>
          )}
        </View>
        {stream.status !== 'upcoming' && (
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 10 }}>
            {REACTION_ICONS.map(r => (
              <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={{ fontSize: 13 }}>{r.emoji}</Text>
                <Text style={{ color: SUB, fontSize: 11 }}>{formatLocaleNumber(stream.reactions[r.key] || 0)}</Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

// ─── Schedule Card ────────────────────────────────────────────────────────────
const ScheduleCard = React.memo(({ session, reminded, onToggleReminder, index }) => {
  const { t } = useTranslation();

  const catColor = CAT_COLORS[session.type] || '#818CF8';
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(360)}>
      <View style={[sh.scheduleCard, { backgroundColor: CARD_BG, borderColor: session.isLive ? ACCENT + '40' : CARD_BORDER }]}>
        {session.isLive && (
          <LinearGradient
            colors={['rgba(239,68,68,0.08)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Time column */}
          <View style={{ width: 56, alignItems: 'center', gap: 3 }}>
            {session.isLive ? (
              <>
                <LiveDot />
                <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700', letterSpacing: 0.6, marginTop: 2 }}>{t('aetherLive.na_zywo_1', 'NA ŻYWO')}</Text>
              </>
            ) : (
              <Text style={{ color: catColor, fontSize: 15, fontWeight: '800' }}>{session.timeLabel}</Text>
            )}
            <Text style={{ color: SUB, fontSize: 10 }}>{session.dayLabel}</Text>
          </View>
          {/* Divider */}
          <View style={{ width: 1, height: 52, backgroundColor: session.isLive ? ACCENT + '40' : 'rgba(255,255,255,0.08)' }} />
          {/* Info */}
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: catColor + '20', borderWidth: 1, borderColor: catColor + '40' }}>
                <Text style={{ color: catColor, fontSize: 10, fontWeight: '700' }}>{session.type}</Text>
              </View>
              <Text style={{ color: SUB, fontSize: 11 }}>{session.duration}</Text>
              {session.participants > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Users size={10} color={SUB} strokeWidth={1.8} />
                  <Text style={{ color: SUB, fontSize: 11 }}>{formatLocaleNumber(session.participants)}</Text>
                </View>
              )}
            </View>
            <Text style={{ color: TEXT, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{session.topic}</Text>
            <Text style={{ color: SUB, fontSize: 12 }}>{session.hostEmoji} {session.hostName}</Text>
          </View>
          {/* Action */}
          {session.isLive ? (
            <Pressable style={{ paddingHorizontal: 12, paddingVertical: 7, backgroundColor: ACCENT, borderRadius: 12 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{t('aetherLive.dolacz_2', 'Dołącz')}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => { HapticsService.impact('medium'); onToggleReminder(session.id); }}
              style={{
                width: 36, height: 36, borderRadius: 18,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: reminded ? catColor + '22' : 'rgba(255,255,255,0.06)',
                borderWidth: 1, borderColor: reminded ? catColor + '50' : 'rgba(255,255,255,0.10)',
              }}
            >
              {reminded
                ? <Bell size={16} color={catColor} strokeWidth={2} />
                : <BellOff size={16} color={SUB} strokeWidth={2} />
              }
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
});

// ─── Host Card ────────────────────────────────────────────────────────────────
const HostCard = React.memo(({ host, followed, onToggleFollow, index }) => {
  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(380)}>
      <View style={[sh.hostCard, { backgroundColor: CARD_BG, borderColor: CARD_BORDER }]}>
        <LinearGradient
          colors={['rgba(129,140,248,0.06)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <LinearGradient
            colors={['#4338CA', '#7C3AED']}
            style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 28 }}>{host.emoji}</Text>
          </LinearGradient>
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: TEXT, fontSize: 15, fontWeight: '700' }}>{host.name}</Text>
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(129,140,248,0.18)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.35)' }}>
                <Text style={{ color: '#818CF8', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>{host.badge}</Text>
              </View>
            </View>
            <Text style={{ color: SUB, fontSize: 12 }}>{host.specialty}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 2, flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Users size={11} color={SUB} strokeWidth={1.8} />
                <Text style={{ color: SUB, fontSize: 11 }}>{host.followers} obserwujących</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Star size={11} color="#F59E0B" fill="#F59E0B" strokeWidth={1.8} />
                <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700' }}>{host.rating}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Video size={11} color={SUB} strokeWidth={1.8} />
                <Text style={{ color: SUB, fontSize: 11 }}>{host.sessions} sesji</Text>
              </View>
            </View>
          </View>
          <Pressable
            onPress={() => { HapticsService.impact('medium'); onToggleFollow(host.id); }}
            style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 1,
              backgroundColor: followed ? '#818CF8' : 'rgba(129,140,248,0.10)',
              borderColor: followed ? '#818CF8' : 'rgba(129,140,248,0.35)',
            }}
          >
            <Text style={{ color: followed ? '#fff' : '#818CF8', fontSize: 12, fontWeight: '700' }}>
              {followed ? 'Obserwujesz' : 'Obserwuj'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
});

// ─── Archive Card ─────────────────────────────────────────────────────────────
const ArchiveCard = React.memo(({ item, index }) => {
  const { t } = useTranslation();

  const catColor = CAT_COLORS[item.type] || '#818CF8';
  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(380)}>
      <Pressable style={[sh.archiveCard, { backgroundColor: CARD_BG, borderColor: CARD_BORDER }]}>
        <View style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 10 }}>
          <LinearGradient colors={item.gradientColors} style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 36 }}>{item.hostEmoji}</Text>
            <View style={{ position: 'absolute', bottom: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: 'rgba(0,0,0,0.62)', borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{item.duration}</Text>
            </View>
          </LinearGradient>
        </View>
        <View style={{ gap: 6 }}>
          <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: catColor + '20', borderWidth: 1, borderColor: catColor + '40', alignSelf: 'flex-start' }}>
            <Text style={{ color: catColor, fontSize: 9, fontWeight: '700' }}>{item.type}</Text>
          </View>
          <Text style={{ color: TEXT, fontSize: 13, fontWeight: '700', lineHeight: 18 }} numberOfLines={2}>{item.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: SUB, fontSize: 11 }}>{item.hostEmoji} {item.host}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Eye size={11} color={SUB} strokeWidth={1.8} />
              <Text style={{ color: SUB, fontSize: 11 }}>{formatLocaleNumber(item.views)}</Text>
            </View>
          </View>
        </View>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: catColor + '18', borderWidth: 1, borderColor: catColor + '35' }}>
          <Play size={13} color={catColor} fill={catColor} strokeWidth={2} />
          <Text style={{ color: catColor, fontSize: 12, fontWeight: '700' }}>{t('aetherLive.odtworz', 'Odtwórz')}</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
});

// ─── Go Live Modal ─────────────────────────────────────────────────────────────
const GoLiveModal = React.memo(({ visible, onClose, onSubmit }) => {
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Medytacja');
  const [description, setDescription] = useState('');
  const [scheduled, setScheduled] = useState(false);
  const inputBg = 'rgba(255,255,255,0.06)';
  const borderC = 'rgba(255,255,255,0.12)';

  const handleSubmit = () => {
    if (!title.trim()) { Alert.alert(t('aetherLive.uzupelnij', 'Uzupełnij'), t('aetherLive.podaj_tytul_transmisji', 'Podaj tytuł transmisji.')); return; }
    onSubmit({ title: title.trim(), category, description: description.trim(), scheduled });
    setTitle(''); setCategory('Medytacja'); setDescription(''); setScheduled(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={{ flex: 1 }}>
        <Pressable style={sh.modalOverlay} onPress={onClose} />
        <View style={[sh.modalSheet, { backgroundColor: '#12101E' }]}>
          <View style={[sh.modalHandle, { backgroundColor: 'rgba(255,255,255,0.20)' }]} />
          <Text style={[sh.modalTitle, { color: TEXT }]}>{t('aetherLive.rozpocznij_transmisje', '📡 Rozpocznij Transmisję')}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('aetherLive.tytul_sesji_na_zywo', 'Tytuł sesji na żywo...')}
            placeholderTextColor={SUB}
            style={[sh.input, { backgroundColor: inputBg, borderColor: borderC, color: TEXT }]}
            maxLength={80}
          />
          <Text style={[sh.fieldLabel, { color: SUB }]}>{t('aetherLive.kategoria', 'Kategoria')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {STREAM_CATEGORIES.map(cat => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[sh.catPill, {
                    backgroundColor: category === cat ? ACCENT : 'rgba(255,255,255,0.07)',
                    borderColor: category === cat ? ACCENT : borderC,
                  }]}
                >
                  <Text style={{ color: category === cat ? '#fff' : SUB, fontSize: 13, fontWeight: '600' }}>{cat}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('aetherLive.opis_sesji_opcjonalni', 'Opis sesji (opcjonalnie)...')}
            placeholderTextColor={SUB}
            multiline
            numberOfLines={3}
            style={[sh.input, sh.inputMulti, { backgroundColor: inputBg, borderColor: borderC, color: TEXT }]}
            maxLength={300}
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <Pressable onPress={onClose} style={[sh.modalBtn, { borderColor: borderC, flex: 1 }]}>
              <Text style={{ color: SUB, fontSize: 15, fontWeight: '600' }}>{t('aetherLive.anuluj', 'Anuluj')}</Text>
            </Pressable>
            <Pressable onPress={handleSubmit} style={[sh.modalBtn, { backgroundColor: ACCENT, borderColor: ACCENT, flex: 2 }]}>
              <Radio size={16} color="#fff" strokeWidth={2} />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 6 }}>{t('aetherLive.idz_na_zywo', 'Idź NA ŻYWO')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

// ─── Viewer Modal ──────────────────────────────────────────────────────────────
const ViewerModal = React.memo(({ stream, visible, onClose, currentUser }) => {
  const { t } = useTranslation();

  const [floatingReactions, setFloatingReactions] = useState([]);
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [liveReactions, setLiveReactions] = useState(stream?.reactions || { fire: 0, heart: 0, spark: 0, moon: 0 });
  const chatRef = useRef(null);
  const nextId = useRef(0);

  useEffect(() => {
    if (!visible || !stream?.id) return;
    const isReal = !stream.id.startsWith('seed_');
    if (!isReal) return;
    const qUnsub = onSnapshot(
      query(collection(db, 'aetheraLiveStreams', stream.id, 'questions'), orderBy('timestamp', 'desc'), limit(20)),
      snap => setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    );
    const cUnsub = onSnapshot(
      query(collection(db, 'aetheraLiveStreams', stream.id, 'chat'), orderBy('timestamp', 'asc'), limit(20)),
      snap => {
        setChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setTimeout(() => chatRef.current?.scrollToEnd?.({ animated: true }), 100);
      },
      () => {}
    );
    return () => { qUnsub(); cUnsub(); };
  }, [visible, stream?.id]);

  const handleReaction = async (reactionKey, emoji) => {
    HapticsService.impact('medium');
    const id = `r_${nextId.current++}`;
    setFloatingReactions(prev => [...prev, { id, emoji }]);
    setLiveReactions(prev => ({ ...prev, [reactionKey]: (prev[reactionKey] || 0) + 1 }));
    if (stream?.id && !stream.id.startsWith('seed_')) {
      try {
        await updateDoc(doc(db, 'aetheraLiveStreams', stream.id), {
          [`reactions.${reactionKey}`]: increment(1),
        });
      } catch {}
    }
  };

  const handleSendQuestion = async () => {
    if (!question.trim()) return;
    const text = question.trim();
    setQuestion('');
    if (stream?.id && !stream.id.startsWith('seed_')) {
      try {
        await addDoc(collection(db, 'aetheraLiveStreams', stream.id, 'questions'), {
          text, userId: currentUser?.uid || 'anon',
          displayName: currentUser?.displayName || 'Dusza',
          answered: false, timestamp: serverTimestamp(),
        });
      } catch {}
    } else {
      setQuestions(prev => [{ id: Date.now().toString(), text, userId: 'me', displayName: currentUser?.displayName || 'Ty', answered: false }, ...prev]);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    if (stream?.id && !stream.id.startsWith('seed_')) {
      try {
        await addDoc(collection(db, 'aetheraLiveStreams', stream.id, 'chat'), {
          text, userId: currentUser?.uid || 'anon',
          displayName: currentUser?.displayName || 'Dusza',
          timestamp: serverTimestamp(),
        });
      } catch {}
    } else {
      setChatMessages(prev => [...prev, { id: Date.now().toString(), text, displayName: currentUser?.displayName || 'Ty' }]);
    }
  };

  if (!stream) return null;
  const elapsed = stream.startedAt
    ? Math.floor((Date.now() - (stream.startedAt?.toDate?.() || stream.startedAt).getTime()) / 60000)
    : 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#08061A' }}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <LinearGradient
            colors={['rgba(239,68,68,0.18)', 'transparent']}
            style={{ paddingHorizontal: SP, paddingBottom: 12, paddingTop: 10 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={onClose} style={sh.backBtn}>
                <ChevronLeft size={22} color={TEXT} strokeWidth={2} />
              </Pressable>
              <Text style={{ fontSize: 26 }}>{stream.hostEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: TEXT, fontSize: 15, fontWeight: '700' }} numberOfLines={1}>{stream.title}</Text>
                <Text style={{ color: SUB, fontSize: 12 }}>{stream.hostName} · {elapsed} min na żywo</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                {stream.status === 'live' && <LiveDot />}
                <Eye size={14} color={SUB} strokeWidth={1.8} />
                <Text style={{ color: SUB, fontSize: 13, fontWeight: '600' }}>
                  {formatLocaleNumber(stream.viewerCount || 0)}
                </Text>
              </View>
            </View>
          </LinearGradient>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={{ flex: 1 }}>
            <ScrollView
              ref={chatRef}
              style={{ flex: 1, paddingHorizontal: SP }}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <Text style={[sh.sectionLabel, { color: SUB }]}>{t('aetherLive.czat_na_zywo', 'Czat na żywo')}</Text>
              {chatMessages.length === 0 && (
                <Text style={{ color: SUB, fontSize: 13, textAlign: 'center', marginVertical: 12 }}>{t('aetherLive.badz_pierwszya_napisz_cos', 'Bądź pierwszy/a — napisz coś! 🌟')}</Text>
              )}
              {chatMessages.map((msg, idx) => (
                <View key={msg.id + '_' + idx} style={sh.chatMsgRow}>
                  <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '700', marginRight: 5 }}>
                    {msg.displayName || 'Dusza'}:
                  </Text>
                  <Text style={{ color: TEXT, fontSize: 13, flex: 1 }}>{msg.text}</Text>
                </View>
              ))}
              <Text style={[sh.sectionLabel, { color: SUB, marginTop: 18 }]}>{t('aetherLive.pytania', 'Pytania')}</Text>
              {questions.map((q, idx) => (
                <View key={q.id + '_' + idx} style={[sh.questionCard, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }]}>
                  <Text style={{ color: TEXT, fontSize: 14, flex: 1 }}>{q.text}</Text>
                  {q.answered && <Check size={16} color="#10B981" strokeWidth={2.5} />}
                </View>
              ))}
            </ScrollView>

            <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
              {floatingReactions.map(r => (
                <FloatingReaction
                  key={r.id} emoji={r.emoji}
                  onDone={() => setFloatingReactions(prev => prev.filter(x => x.id !== r.id))}
                />
              ))}
            </View>

            <View style={[sh.viewerBottom, { backgroundColor: 'rgba(8,6,26,0.96)', borderColor: 'rgba(255,255,255,0.08)' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginBottom: 12 }}>
                {REACTION_ICONS.map(r => (
                  <Pressable key={r.key} onPress={() => handleReaction(r.key, r.emoji)} style={sh.reactionBtn}>
                    <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
                    <Text style={{ color: SUB, fontSize: 11 }}>{formatLocaleNumber(liveReactions[r.key] || 0)}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <TextInput
                  value={question} onChangeText={setQuestion}
                  placeholder={t('aetherLive.zadaj_pytanie_prowadzace', 'Zadaj pytanie prowadzącemu...')}
                  placeholderTextColor={SUB}
                  style={[sh.chatInput, { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.10)', color: TEXT, flex: 1 }]}
                  onSubmitEditing={handleSendQuestion}
                />
                <Pressable onPress={handleSendQuestion} style={[sh.sendBtn, { backgroundColor: '#F59E0B' }]}>
                  <Star size={16} color="#fff" strokeWidth={2} />
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={chatInput} onChangeText={setChatInput}
                  placeholder={t('aetherLive.wiadomosc_do_czatu', 'Wiadomość do czatu...')}
                  placeholderTextColor={SUB}
                  style={[sh.chatInput, { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.10)', color: TEXT, flex: 1 }]}
                  onSubmitEditing={handleSendChat}
                />
                <Pressable onPress={handleSendChat} style={[sh.sendBtn, { backgroundColor: ACCENT }]}>
                  <Send size={16} color="#fff" strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const AetheraLiveScreen = ({ navigation }) => {
  const { currentUser } = useAuthStore();
  const { t } = useTranslation();

  const [streams, setStreams] = useState(SEED_STREAMS);
  const [activeTab, setActiveTab] = useState('live');
  const [filterCat, setFilterCat] = useState('all');
  const [showGoLive, setShowGoLive] = useState(false);
  const [viewerStream, setViewerStream] = useState(null);
  const [liveCount, setLiveCount] = useState(214);
  const [remindedIds, setRemindedIds] = useState(new Set());
  const [followedIds, setFollowedIds] = useState(new Set());

  // Real-time Firebase listener
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'aetheraLiveStreams'),
        orderBy('startedAt', 'desc'),
        limit(30),
      );
      const unsub = onSnapshot(q, snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (data.length > 0) setStreams(data);
      }, () => {});
      return () => unsub();
    } catch {}
  }, []);

  // Fluctuating viewer count
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount(prev => Math.max(180, prev + Math.floor(Math.random() * 11) - 5));
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const handleGoLive = async ({ title, category, description, scheduled }) => {
    setShowGoLive(false);
    HapticsService.impact('medium');
    try {
      await addDoc(collection(db, 'aetheraLiveStreams'), {
        hostId: currentUser?.uid || 'anon',
        hostName: currentUser?.displayName || 'Dusza Aethery',
        hostEmoji: '📡', title, category, description,
        status: scheduled ? 'upcoming' : 'live',
        startedAt: serverTimestamp(),
        scheduledAt: scheduled ? Timestamp.fromMillis(Date.now() + 30 * 60000) : null,
        viewerCount: 0, peakViewers: 0,
        reactions: { fire: 0, heart: 0, spark: 0, moon: 0 },
        tags: [], duration: 0,
      });
      Alert.alert(t('aetherLive.jestes_na_zywo', '✦ Jesteś NA ŻYWO'), t('aetherLive.twoja_transmisja_jest_aktywna_witaj', 'Twoja transmisja jest aktywna. Witaj społeczność!'));
    } catch {
      Alert.alert(t('aetherLive.blad', 'Błąd'), t('aetherLive.nie_udalo_sie_uruchomic_transmisji', 'Nie udało się uruchomić transmisji. Spróbuj ponownie.'));
    }
  };

  const toggleReminder = useCallback((id) => {
    setRemindedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleFollow = useCallback((id) => {
    setFollowedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const filteredStreams = streams.filter(s => {
    if (s.status !== activeTab) return false;
    if (filterCat !== 'all' && s.category !== filterCat) return false;
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <LinearGradient
        colors={['rgba(239,68,68,0.10)', 'transparent', BG]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={[sh.header, { borderBottomColor: 'rgba(255,255,255,0.07)' }]}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Social')} style={sh.backBtn}>
            <ChevronLeft size={22} color={TEXT} strokeWidth={2} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[sh.headerTitle, { color: TEXT }]}>{t('aetherLive.aethera_live', '📡 Aethera Live')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <LiveDot />
              <Text style={{ color: SUB, fontSize: 12 }}>{formatLocaleNumber(liveCount)} oglądających na żywo</Text>
            </View>
          </View>
          <Pressable onPress={() => setShowGoLive(true)} style={[sh.goLiveBtn, { backgroundColor: ACCENT }]}>
            <Radio size={15} color="#fff" strokeWidth={2} />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', marginLeft: 5 }}>{t('aetherLive.idz_live', 'Idź LIVE')}</Text>
          </Pressable>
        </View>

        {/* ── Tab bar ── */}
        <View style={[sh.tabRow, { borderBottomColor: 'rgba(255,255,255,0.06)' }]}>
          {[
            { key: 'live', label: 'NA ŻYWO', emoji: '🔴' },
            { key: 'upcoming', label: 'PLANOWANE', emoji: '🗓' },
            { key: 'ended', label: 'ZAPISY', emoji: '📹' },
          ].map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => { setActiveTab(tab.key); setFilterCat('all'); }}
              style={[sh.tabItem, activeTab === tab.key && { borderBottomColor: ACCENT, borderBottomWidth: 2 }]}
            >
              <Text style={{ fontSize: 13 }}>{tab.emoji}</Text>
              <Text style={{
                color: activeTab === tab.key ? ACCENT : SUB,
                fontSize: 12, fontWeight: activeTab === tab.key ? '700' : '500',
                letterSpacing: 0.5, marginLeft: 4,
              }}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Category filter ── */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 48 }}
          contentContainerStyle={{ paddingHorizontal: SP, gap: 6, alignItems: 'center', paddingVertical: 8, flexDirection: 'row' }}
        >
          {FILTER_CATS.map(cat => {
            const active = filterCat === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setFilterCat(cat.id)}
                style={[sh.catChip, {
                  backgroundColor: active ? ACCENT + '18' : 'rgba(255,255,255,0.07)',
                  borderColor: active ? ACCENT + '50' : 'rgba(255,255,255,0.08)',
                }]}
              >
                <Text style={{ color: active ? ACCENT : SUB, fontSize: 12, fontWeight: active ? '700' : '500' }}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Scrollable content ── */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}>

          {/* Live Now Banner */}
          {activeTab === 'live' && (
            <LiveNowBanner streams={streams} onPress={(s) => setViewerStream(s)} />
          )}

          {/* Streams list */}
          <View style={{ paddingHorizontal: SP }}>
            {filteredStreams.length === 0 ? (
              <View style={sh.emptyState}>
                <Text style={{ fontSize: 48, marginBottom: 14 }}>
                  {activeTab === 'live' ? '📡' : activeTab === 'upcoming' ? '🗓' : '📹'}
                </Text>
                <Text style={{ color: TEXT, fontSize: 17, fontWeight: '700', marginBottom: 8 }}>
                  {activeTab === 'live' ? 'Brak aktywnych transmisji' : activeTab === 'upcoming' ? 'Brak planowanych sesji' : 'Brak zapisów'}
                </Text>
                <Text style={{ color: SUB, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                  {activeTab === 'live'
                    ? 'Bądź pierwszy/a — zacznij transmisję dla wspólnoty!'
                    : 'Planowane sesje pojawią się tutaj wkrótce.'}
                </Text>
                {activeTab === 'live' && (
                  <Pressable onPress={() => setShowGoLive(true)} style={[sh.goLiveBtn, { backgroundColor: ACCENT, marginTop: 20, paddingHorizontal: 24 }]}>
                    <Radio size={16} color="#fff" strokeWidth={2} />
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 6 }}>{t('aetherLive.idz_na_zywo_1', 'Idź NA ŻYWO')}</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              filteredStreams.map((stream, idx) => (
                <StreamCard
                  key={stream.id + '_' + idx}
                  stream={stream}
                  onPress={() => setViewerStream(stream)}
                  index={idx}
                />
              ))
            )}
          </View>

          {/* ── SCHEDULE (Live tab) ── */}
          {activeTab === 'live' && (
            <View style={{ marginTop: 20, paddingHorizontal: SP }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <View>
                  <Text style={{ color: SUB, fontSize: 9, fontWeight: '700', letterSpacing: 1.3, marginBottom: 3 }}>{t('aetherLive.harmonogra', '📅 HARMONOGRAM')}</Text>
                  <Text style={{ color: TEXT, fontSize: 17, fontWeight: '800' }}>{t('aetherLive.sesje_dzis_i_jutro', 'Sesje Dziś i Jutro')}</Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: CARD_BORDER }}>
                  <Text style={{ color: SUB, fontSize: 12, fontWeight: '600' }}>{SEED_SCHEDULE.length} sesji</Text>
                </View>
              </View>
              {SEED_SCHEDULE.map((session, idx) => (
                <ScheduleCard
                  key={session.id}
                  session={session}
                  reminded={remindedIds.has(session.id)}
                  onToggleReminder={toggleReminder}
                  index={idx}
                />
              ))}
            </View>
          )}

          {/* ── FEATURED HOSTS (Live tab) ── */}
          {activeTab === 'live' && (
            <View style={{ marginTop: 24, paddingHorizontal: SP }}>
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: SUB, fontSize: 9, fontWeight: '700', letterSpacing: 1.3, marginBottom: 3 }}>{t('aetherLive.prowadzacy', '✦ PROWADZĄCY')}</Text>
                <Text style={{ color: TEXT, fontSize: 17, fontWeight: '800' }}>{t('aetherLive.polecani_mistrzowie', 'Polecani Mistrzowie')}</Text>
              </View>
              {SEED_HOSTS.map((host, idx) => (
                <HostCard
                  key={host.id}
                  host={host}
                  followed={followedIds.has(host.id)}
                  onToggleFollow={toggleFollow}
                  index={idx}
                />
              ))}
            </View>
          )}

          {/* ── ARCHIVE / REPLAYS (Zapisy tab) ── */}
          {activeTab === 'ended' && (
            <View style={{ marginTop: 14, paddingHorizontal: SP }}>
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: SUB, fontSize: 9, fontWeight: '700', letterSpacing: 1.3, marginBottom: 3 }}>{t('aetherLive.archiwum', '📹 ARCHIWUM')}</Text>
                <Text style={{ color: TEXT, fontSize: 17, fontWeight: '800' }}>{t('aetherLive.nagrania_sesji', 'Nagrania Sesji')}</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {SEED_ARCHIVE.map((item, idx) => (
                  <View key={item.id} style={{ width: (SW - SP * 2 - 12) / 2 }}>
                    <ArchiveCard item={item} index={idx} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── UPCOMING: Stats strip + hints ── */}
          {activeTab === 'upcoming' && (
            <View style={{ marginTop: 20, paddingHorizontal: SP }}>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                {[
                  { icon: '🗓', label: 'Planowanych', value: String(SEED_SCHEDULE.filter(s => !s.isLive).length) },
                  { icon: '⭐', label: 'Mistrzów', value: String(SEED_HOSTS.length) },
                  { icon: '🔔', label: 'Przypomnień', value: String(remindedIds.size) },
                ].map((stat, i) => (
                  <View key={i} style={{ flex: 1, borderRadius: 16, borderWidth: 1, borderColor: CARD_BORDER, backgroundColor: CARD_BG, padding: 14, alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 22 }}>{stat.icon}</Text>
                    <Text style={{ color: TEXT, fontSize: 20, fontWeight: '800' }}>{stat.value}</Text>
                    <Text style={{ color: SUB, fontSize: 10, fontWeight: '600', textAlign: 'center' }}>{stat.label}</Text>
                  </View>
                ))}
              </View>
              <View style={{ borderRadius: 16, borderWidth: 1, borderColor: CARD_BORDER, backgroundColor: CARD_BG, padding: 16 }}>
                <Text style={{ color: TEXT, fontSize: 14, fontWeight: '700', marginBottom: 6 }}>{t('aetherLive.jak_korzystac_z_harmonogra', '💡 Jak korzystać z harmonogramu?')}</Text>
                <Text style={{ color: SUB, fontSize: 13, lineHeight: 20 }}>{t('aetherLive.dotknij_dzwonka_przy_sesji_aby', 'Dotknij dzwonka przy sesji, aby ustawić przypomnienie. Kiedy sesja się rozpocznie, zobaczysz banner "NA ŻYWO" w zakładce transmisji i będziesz mógł/mogła dołączyć jednym kliknięciem.')}</Text>
              </View>
            </View>
          )}

          <EndOfContentSpacer size="standard" />
        </ScrollView>

        {/* ── Modals ── */}
        <GoLiveModal
          visible={showGoLive}
          onClose={() => setShowGoLive(false)}
          onSubmit={handleGoLive}
        />
        <ViewerModal
          stream={viewerStream}
          visible={!!viewerStream}
          onClose={() => setViewerStream(null)}
          currentUser={currentUser}
        />
      </SafeAreaView>
    </View>
  );
};

const sh = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
  backBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  goLiveBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  tabRow: {
    flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingBottom: 9,
  },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1,
  },
  streamCard: {
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12, overflow: 'hidden',
  },
  hostAvatar: {
    width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center',
  },
  catBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1,
  },
  joinBtn: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 14,
  },
  emptyState: {
    alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32,
  },
  scheduleCard: {
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10, overflow: 'hidden',
  },
  hostCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 10, overflow: 'hidden',
  },
  archiveCard: {
    borderRadius: 16, borderWidth: 1, padding: 12, overflow: 'hidden',
  },
  modalOverlay: { flex: 1 },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingTop: 16,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18,
  },
  modalTitle: { fontSize: 19, fontWeight: '800', marginBottom: 18 },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, marginBottom: 14,
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  fieldLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.8, marginBottom: 8 },
  catPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1,
  },
  modalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 14, borderWidth: 1,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, marginTop: 4 },
  chatMsgRow: { flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap' },
  questionCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, gap: 8,
  },
  viewerBottom: {
    paddingHorizontal: SP, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  reactionBtn: { alignItems: 'center', gap: 2 },
  chatInput: {
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    fontSize: 13,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center',
  },
});

export default AetheraLiveScreen;
