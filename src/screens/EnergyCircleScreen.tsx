// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeInDown, FadeIn } from 'react-native-reanimated';
import { ChevronLeft, Globe2, Users, Clock, Zap, Check, Play, Pause, Music, Volume2, VolumeX, Send, Heart, Flame, Wind, Star } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AudioService } from '../core/services/audio.service';
import { TTSService } from '../core/services/tts.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import { formatLocaleNumber } from '../core/utils/localeFormat';
import { useAuthStore } from '../store/useAuthStore';
import { CirclesService } from '../core/services/community/circles.service';
import { useTheme } from '../core/hooks/useTheme';
const SYNC_MUSIC_OPTIONS = [
  { id: 'waves', label: 'Fale', emoji: '🌊', color: '#67D1B2' },
  { id: 'forest', label: 'Las', emoji: '🌲', color: '#34D399' },
  { id: 'cave', label: 'Kryształ', emoji: '🔮', color: '#A78BFA' },
  { id: 'rain', label: 'Deszcz', emoji: '🌧️', color: '#7FD8FF' },
  { id: 'ritual', label: 'Rytuał', emoji: '🕯️', color: '#F59E0B' },
];

const ACCENT = '#6366F1';
const SEED_INTENTIONS = [
  { id: 'i1', author: 'Luna', emoji: '🌙', text: 'Wysyłam spokój wszystkim duszom w tym kręgu 💜', time: '3 min temu' },
  { id: 'i2', author: 'Arion', emoji: '⚡', text: 'Niech ta energia dotrze do tych, którzy jej najbardziej potrzebują', time: '7 min temu' },
  { id: 'i3', author: 'Vera', emoji: '🌿', text: 'Obecna. Uziemiona. Wdzięczna za ten moment wspólnoty ✦', time: '12 min temu' },
  { id: 'i4', author: 'Solaris', emoji: '☀️', text: 'Wyobrażam sobie złotą nić łączącą nas wszystkich ponad granicami', time: '18 min temu' },
];

function formatIntentionTime(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'teraz';
  if (min < 60) return `${min} min temu`;
  return `${Math.floor(min / 60)}h temu`;
}

const SESSIONS = [
  { id: 1, topic: 'Uziemienie i spokój wewnętrzny', host: 'Aria Sol', time: '20:00', participants: 384, type: 'UZIEMIENIE', color: '#10B981' },
  { id: 2, topic: 'Krąg Miłości — serce i relacje', host: 'Luna Voss', time: '21:30', participants: 217, type: 'MIŁOŚĆ', color: '#EC4899' },
  { id: 3, topic: 'Oczyszczenie przed pełnią', host: 'Ember Kiran', time: '23:00', participants: 156, type: 'OCZYSZCZANIE', color: '#F59E0B' },
];
const TYPES = ['WSZYSTKIE', 'UZIEMIENIE', 'MIŁOŚĆ', 'OCZYSZCZANIE', 'WIZJA'];
const BREATH = [{ label: 'Wdech', d: 4000, c: '#6366F1' }, { label: 'Zatrzymaj', d: 4000, c: '#8B5CF6' }, { label: 'Wydech', d: 6000, c: '#10B981' }];

export const EnergyCircleScreen = ({ navigation }) => {
  const { t } = useTranslation();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { isLight } = useTheme();
    const currentUser = useAuthStore(s => s.currentUser);
  const tc = isLight ? '#1A1008' : '#F0ECE4';
  const sc = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';
  const cb = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const cbr = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)';

  const [joined, setJoined] = useState(false);
  const [filter, setFilter] = useState('WSZYSTKIE');
  const [energy, setEnergy] = useState(72);
  const [bph, setBph] = useState(0);
  const [bactive, setBactive] = useState(false);
  const [syncMusic, setSyncMusic] = useState('waves');
  const [musicMuted, setMusicMuted] = useState(false);
  const [narratorSpoken, setNarratorSpoken] = useState(false);
  const [liveCount, setLiveCount] = useState(1247);
  const [sessionCounts, setSessionCounts] = useState({ 1: 384, 2: 217, 3: 156 });
  const [joinSeconds, setJoinSeconds] = useState(0);
  const joinTimerRef = useRef(null);
  const [intentions, setIntentions] = useState(SEED_INTENTIONS);
  const [intentionInput, setIntentionInput] = useState('');
  const [totalSessionCount, setTotalSessionCount] = useState(7);
  const [totalMinutes, setTotalMinutes] = useState(148);

  const pulse = useSharedValue(0.95);
  const ring = useSharedValue(0.2);
  const breath = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.07, { duration: 3000 }), withTiming(0.95, { duration: 3000 })), -1, false);
    ring.value = withRepeat(withSequence(withTiming(0.65, { duration: 3000 }), withTiming(0.12, { duration: 3000 })), -1, false);
  }, []);

  useEffect(() => {
    if (!bactive) { breath.value = withTiming(1, { duration: 600 }); return; }
    let ph = 0;
    const step = () => { setBph(ph % 3); breath.value = withTiming(ph % 3 === 2 ? 0.82 : 1.28, { duration: BREATH[ph % 3].d }); ph++; };
    step();
    let tid = null;
    const sched = (n) => { tid = setTimeout(() => { step(); sched(n + 1); }, BREATH[(n - 1) % 3].d); };
    sched(1);
    return () => clearTimeout(tid);
  }, [bactive]);

  const ps = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const rs = useAnimatedStyle(() => ({ opacity: ring.value }));
  const bs = useAnimatedStyle(() => ({ transform: [{ scale: breath.value }] }));

  // Subscribe to real-time circle data and intentions
  useEffect(() => {
    const unsubCircle = CirclesService.listenToCircle(circle => {
      setLiveCount(prev => Math.max(1, circle.participantCount));
    });
    const unsubIntentions = CirclesService.listenToIntentions(fbIntentions => {
      if (fbIntentions.length > 0) {
        setIntentions(fbIntentions.map(i => ({
          id: i.id, author: i.authorName, emoji: i.authorEmoji,
          text: i.text, time: formatIntentionTime(i.createdAt),
        })));
      }
    });
    // Check if user is already in circle
    if (currentUser) {
      CirclesService.isInCircle(currentUser.uid).then(inCircle => { if (inCircle) setJoined(true); }).catch(() => {});
    }
    return () => { unsubCircle(); unsubIntentions(); };
  }, []);

  // Simulate live session participant count fluctuations (SESSIONS are local-only)
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionCounts(prev => ({
        1: Math.max(370, prev[1] + Math.floor(Math.random() * 5) - 2),
        2: Math.max(200, prev[2] + Math.floor(Math.random() * 5) - 2),
        3: Math.max(140, prev[3] + Math.floor(Math.random() * 3) - 1),
      }));
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  // Join/leave Firebase circle when state changes
  useEffect(() => {
    if (!currentUser) return;
    if (joined) {
      CirclesService.joinCircle({ uid: currentUser.uid, displayName: currentUser.displayName }).catch(() => {});
    } else {
      CirclesService.leaveCircle(currentUser.uid).catch(() => {});
    }
  }, [joined]);

  // Timer when user joins/leaves
  useEffect(() => {
    if (joined) {
      setJoinSeconds(0);
      joinTimerRef.current = setInterval(() => {
        setJoinSeconds(s => s + 1);
      }, 1000);
    } else {
      if (joinTimerRef.current) { clearInterval(joinTimerRef.current); joinTimerRef.current = null; }
      if (joinSeconds > 30) {
        setTotalSessionCount(c => c + 1);
        setTotalMinutes(m => m + Math.floor(joinSeconds / 60));
      }
    }
    return () => { if (joinTimerRef.current) clearInterval(joinTimerRef.current); };
  }, [joined]);

  // Sync music — play/stop when joined changes
  useEffect(() => {
    if (joined && !musicMuted) {
      AudioService.playAmbientForSession(syncMusic);
      if (!narratorSpoken) {
        setTimeout(() => {
          TTSService.speak('Witaj w kręgu. Oddychaj razem z tysiącami dusz na całym świecie. Pozwól, by energia przepływała swobodnie.');
          setNarratorSpoken(true);
        }, 1200);
      }
    } else {
      AudioService.pauseAmbientSound();
    }
    return () => { if (joined) AudioService.pauseAmbientSound(); };
  }, [joined, syncMusic, musicMuted]);

  const toggleMute = () => {
    const next = !musicMuted;
    setMusicMuted(next);
    if (next) AudioService.pauseAmbientSound();
    else if (joined) AudioService.playAmbientForSession(syncMusic);
    HapticsService.impact('light');
  };

  const sessions = filter === 'WSZYSTKIE' ? SESSIONS : SESSIONS.filter(s => s.type === filter);

  return (
    <View style={{ flex: 1, backgroundColor: isLight ? '#F0EEFF' : '#070714' }}>
      <LinearGradient colors={isLight ? [ACCENT + '18', 'transparent'] : [ACCENT + '30', '#070714']} style={StyleSheet.absoluteFill} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingVertical: 12 }}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} hitSlop={14}><ChevronLeft color={ACCENT} size={26} strokeWidth={1.8} /></Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: tc, fontSize: 17, fontWeight: '700' }}>{t('energyCircle.krag_energetycz', 'Krąg Energetyczny')}</Text>
            <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 1.8 }}>{t('energyCircle.synchronic_medytacja', 'SYNCHRONICZNA MEDYTACJA')}</Text>
          </View>
          <Pressable onPress={() => {
            HapticsService.impact('light');
            if (isFavoriteItem('energy-circle')) { removeFavoriteItem('energy-circle'); } else { addFavoriteItem({ id: 'energy-circle', label: 'Krąg Energetyczny', route: 'EnergyCircle', icon: 'Globe2', color: ACCENT, addedAt: Date.now() }); }
          }} style={{ width: 30, alignItems: 'flex-end' }}>
            <Star size={20} color="#F59E0B" fill={isFavoriteItem('energy-circle') ? '#F59E0B' : 'none'} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

          {/* Animated orb */}
          <View style={{ alignItems: 'center', marginVertical: 8, height: 220, justifyContent: 'center' }}>
            {[300, 260, 220].map((d, i) => (
              <Animated.View key={i} style={[{ position: 'absolute', width: d, height: d, borderRadius: d / 2, borderWidth: 1, borderColor: ACCENT + ['28', '45', '70'][i] }, i === 0 ? rs : {}]} />
            ))}
            <Animated.View style={[bs, { width: 170, height: 170, borderRadius: 85, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }]}>
              <LinearGradient colors={[ACCENT + 'EE', ACCENT + '66']} style={StyleSheet.absoluteFill} />
              <Animated.View style={ps}><Globe2 color="#fff" size={34} strokeWidth={1.4} /></Animated.View>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 }}>{formatLocaleNumber(liveCount)}</Text>
              <Text style={{ color: isLight ? 'rgba(37,29,22,0.8)' : 'rgba(255,255,255,0.8)', fontSize: 9, letterSpacing: 1.4 }}>{t('energyCircle.dusz_teraz', 'DUSZ TERAZ')}</Text>
            </Animated.View>
          </View>

          {/* Breath guide */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ paddingHorizontal: layout.padding.screen }}>
            <LinearGradient colors={[ACCENT + '28', ACCENT + '0A']} style={{ borderRadius: 20, borderWidth: 1, borderColor: ACCENT + '50', padding: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View>
                  <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: 4 }}>{t('energyCircle.przewodnik_oddechu', 'PRZEWODNIK ODDECHU')}</Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: bactive ? BREATH[bph].c : tc }}>
                    {bactive ? BREATH[bph].label : 'Synchronizuj oddech'}
                  </Text>
                </View>
                <Pressable onPress={() => { setBactive(a => !a); HapticsService.impact('medium'); }}
                  style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: bactive ? ACCENT : ACCENT + '28', borderColor: ACCENT + '66' }}>
                  {bactive ? <Pause color="#fff" size={18} /> : <Play color={ACCENT} size={18} />}
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {BREATH.map((p, i) => (
                  <View key={i} style={{ flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center', backgroundColor: bactive && bph === i ? p.c + '28' : 'transparent', borderColor: bactive && bph === i ? p.c : cbr }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: bactive && bph === i ? p.c : sc }}>{p.label} {p.d / 1000}s</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Join */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 14 }}>
            <Pressable onPress={() => { setJoined(j => !j); HapticsService.notify(); }}>
              <LinearGradient colors={joined ? ['#10B981', '#059669'] : [ACCENT, '#818CF8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                {joined ? <Check color="#fff" size={20} /> : <Users color="#fff" size={20} />}
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{joined ? 'Dołączono do kręgu ✦' : 'Dołącz do kręgu'}</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Synchronized music selection */}
          <Animated.View entering={FadeIn.duration(400)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 14 }}>
            <LinearGradient colors={['rgba(99,102,241,0.12)', 'rgba(99,102,241,0.04)']} style={{ borderRadius: 20, borderWidth: 1, borderColor: ACCENT + '40', padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Music color={ACCENT} size={14} />
                  <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 1.8 }}>{t('energyCircle.wspolna_muzyka_sesji', 'WSPÓLNA MUZYKA SESJI')}</Text>
                </View>
                {joined && (
                  <Pressable onPress={toggleMute} style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: musicMuted ? ACCENT + '28' : ACCENT, borderWidth: 1, borderColor: ACCENT + '60' }}>
                    {musicMuted ? <VolumeX color={ACCENT} size={14} /> : <Volume2 color="#fff" size={14} />}
                  </Pressable>
                )}
              </View>
              <Text style={{ color: sc, fontSize: 11, marginBottom: 10 }}>{t('energyCircle.wszyscy_uczestnicy_slysza_te_sama', 'Wszyscy uczestnicy słyszą tę samą ścieżkę dźwiękową')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>
                {SYNC_MUSIC_OPTIONS.map(opt => (
                  <Pressable key={opt.id} onPress={() => { setSyncMusic(opt.id); HapticsService.impact('light'); if (joined && !musicMuted) AudioService.playAmbientForSession(opt.id); }}
                    style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 4, minWidth: 68, backgroundColor: syncMusic === opt.id ? opt.color + '28' : cb, borderColor: syncMusic === opt.id ? opt.color : cbr }}>
                    <Text style={{ fontSize: 18 }}>{opt.emoji}</Text>
                    <Text style={{ color: syncMusic === opt.id ? opt.color : sc, fontSize: 10, fontWeight: '700' }}>{opt.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </LinearGradient>
          </Animated.View>

          {/* Energy share */}
          {joined && (
            <Animated.View entering={FadeIn.duration(400)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 14 }}>
              <View style={{ borderRadius: 18, borderWidth: 1, padding: 18, backgroundColor: cb, borderColor: cbr }}>
                <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: 12 }}>{t('energyCircle.podziel_sie_swoja_energia', 'PODZIEL SIĘ SWOJĄ ENERGIĄ')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  <Text style={{ color: ACCENT, fontSize: 40, fontWeight: '800', width: 60 }}>{energy}</Text>
                  <View style={{ flex: 1, height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)' }}>
                    <LinearGradient colors={[ACCENT, '#10B981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: '100%', width: `${energy}%` }} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[20, 40, 60, 80, 100].map(v => (
                    <Pressable key={v} onPress={() => { setEnergy(v); HapticsService.impact('light'); }}
                      style={{ flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, alignItems: 'center', backgroundColor: energy === v ? ACCENT + '28' : cb, borderColor: energy === v ? ACCENT : cbr }}>
                      <Text style={{ color: energy === v ? ACCENT : sc, fontSize: 12, fontWeight: '700' }}>{v}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* Community energy */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 22 }}>
            <Text style={{ color: sc, fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 }}>{t('energyCircle.energia_zbiorowa_ostatnie_24h', 'ENERGIA ZBIOROWA — OSTATNIE 24H')}</Text>
            <View style={{ borderRadius: 18, borderWidth: 1, padding: 18, backgroundColor: cb, borderColor: cbr }}>
              {[{ l: 'Spokój', v: 78, c: '#10B981' }, { l: 'Klarowność', v: 65, c: ACCENT }, { l: 'Miłość', v: 82, c: '#EC4899' }, { l: 'Siła', v: 59, c: '#F59E0B' }].map(({ l, v, c }) => (
                <View key={l} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: tc, fontSize: 13, fontWeight: '600' }}>{l}</Text>
                    <Text style={{ color: c, fontSize: 13, fontWeight: '700' }}>{v}%</Text>
                  </View>
                  <View style={{ height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: c + '22' }}>
                    <View style={{ height: '100%', width: `${v}%`, backgroundColor: c, borderRadius: 4 }} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Session filter */}
          <View style={{ marginTop: 22 }}>
            <Text style={{ color: sc, fontSize: 9, fontWeight: '700', letterSpacing: 1.8, paddingHorizontal: layout.padding.screen, marginBottom: 10 }}>{t('energyCircle.nadchodzac_sesje', 'NADCHODZĄCE SESJE')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 8 }}>
              {TYPES.map(tp => (
                <Pressable key={tp} onPress={() => setFilter(tp)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, backgroundColor: filter === tp ? ACCENT + '28' : cb, borderColor: filter === tp ? ACCENT : cbr }}>
                  <Text style={{ color: filter === tp ? ACCENT : sc, fontSize: 11, fontWeight: '700' }}>{tp}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Session cards */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 12, gap: 10 }}>
            {sessions.map((sess, i) => (
              <Animated.View key={sess.id} entering={FadeInDown.delay(i * 80).duration(400)}>
                <LinearGradient colors={[sess.color + '1A', sess.color + '08']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderColor: sess.color + '44' }}>
                  <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3.5, backgroundColor: sess.color, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }} />
                  <View style={{ flex: 1, paddingLeft: 10 }}>
                    <Text style={{ color: sess.color, fontSize: 9, fontWeight: '700', letterSpacing: 1.6, marginBottom: 3 }}>{sess.type}</Text>
                    <Text style={{ color: tc, fontSize: 14, fontWeight: '700', marginBottom: 2 }}>{sess.topic}</Text>
                    <Text style={{ color: sc, fontSize: 12 }}>z {sess.host} · {sessionCounts[sess.id] ?? sess.participants} os.</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, backgroundColor: sess.color + '22', borderColor: sess.color + '44' }}>
                      <Clock size={11} color={sess.color} /><Text style={{ color: sess.color, fontSize: 12, fontWeight: '700' }}>{sess.time}</Text>
                    </View>
                    <Pressable onPress={() => HapticsService.impact('light')} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, backgroundColor: sess.color + '22', borderColor: sess.color + '44' }}>
                      <Text style={{ color: sess.color, fontSize: 11, fontWeight: '700' }}>{t('energyCircle.dolacz', 'Dołącz')}</Text>
                    </Pressable>
                  </View>
                </LinearGradient>
              </Animated.View>
            ))}
          </View>

          {/* Active session badge */}
          {joined && (
            <Animated.View entering={FadeIn.duration(400)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 14 }}>
              <LinearGradient colors={['rgba(16,185,129,0.18)', 'rgba(16,185,129,0.06)']} style={{ borderRadius: 18, borderWidth: 1, borderColor: '#10B981' + '50', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#10B981' + '28', alignItems: 'center', justifyContent: 'center' }}>
                  <Flame color="#10B981" size={22} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#10B981', fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: 2 }}>{t('energyCircle.aktywna_sesja', 'AKTYWNA SESJA')}</Text>
                  <Text style={{ color: tc, fontSize: 20, fontWeight: '800' }}>
                    {String(Math.floor(joinSeconds / 60)).padStart(2, '0')}:{String(joinSeconds % 60).padStart(2, '0')}
                  </Text>
                  <Text style={{ color: sc, fontSize: 11, marginTop: 1 }}>{t('energyCircle.twoja_energia_plynie_do_kregu', 'Twoja energia płynie do kręgu')}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#10B981', fontSize: 22, fontWeight: '800' }}>{energy}%</Text>
                  <Text style={{ color: sc, fontSize: 9 }}>{t('energyCircle.udzial', 'udział')}</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Community intentions board */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 22 }}>
            <Text style={{ color: sc, fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 }}>{t('energyCircle.intencje_wspolnoty', 'INTENCJE WSPÓLNOTY')}</Text>
            <View style={{ borderRadius: 18, borderWidth: 1, backgroundColor: cb, borderColor: cbr, overflow: 'hidden' }}>
              {intentions.slice(0, 4).map((item, i) => (
                <View key={item.id} style={{ flexDirection: 'row', gap: 10, padding: 14, borderBottomWidth: i < Math.min(intentions.length, 4) - 1 ? 1 : 0, borderBottomColor: cbr }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                      <Text style={{ color: tc, fontSize: 12, fontWeight: '700' }}>{item.author}</Text>
                      <Text style={{ color: sc, fontSize: 10 }}>{item.time}</Text>
                    </View>
                    <Text style={{ color: sc, fontSize: 12, lineHeight: 18 }}>{item.text}</Text>
                  </View>
                </View>
              ))}
              {/* Input row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: cbr }}>
                <Wind color={ACCENT} size={16} strokeWidth={1.5} />
                <TextInput
                  value={intentionInput}
                  onChangeText={setIntentionInput}
                  placeholder={t('energyCircle.wyslij_intencje_do_kregu', 'Wyślij intencję do kręgu...')}
                  placeholderTextColor={sc}
                  style={{ flex: 1, color: tc, fontSize: 13, paddingVertical: 4 }}
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    if (!intentionInput.trim() || !currentUser) return;
                    HapticsService.impact('light');
                    CirclesService.addIntention({ uid: currentUser.uid, displayName: currentUser.displayName, avatarEmoji: currentUser.avatarEmoji ?? '✨' }, intentionInput.trim()).catch(() => {});
                    setIntentionInput('');
                  }}
                />
                <Pressable onPress={() => {
                  if (!intentionInput.trim() || !currentUser) return;
                  HapticsService.impact('light');
                  CirclesService.addIntention({ uid: currentUser.uid, displayName: currentUser.displayName, avatarEmoji: currentUser.avatarEmoji ?? '✨' }, intentionInput.trim()).catch(() => {});
                  setIntentionInput('');
                }} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: intentionInput.trim() ? ACCENT : ACCENT + '44', alignItems: 'center', justifyContent: 'center' }}>
                  <Send color="#fff" size={14} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 22 }}>
            <Text style={{ color: sc, fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 }}>{t('energyCircle.twoje_statystyki', 'TWOJE STATYSTYKI')}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[{ l: 'Sesje', v: String(totalSessionCount), I: Users }, { l: 'Minuty', v: String(totalMinutes), I: Clock }, { l: 'Energia', v: `${energy}%`, I: Zap }].map(({ l, v, I }) => (
                <View key={l} style={{ flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, alignItems: 'center', backgroundColor: cb, borderColor: cbr }}>
                  <I color={ACCENT} size={18} strokeWidth={1.5} />
                  <Text style={{ color: ACCENT, fontSize: 22, fontWeight: '800', marginTop: 6 }}>{v}</Text>
                  <Text style={{ color: sc, fontSize: 10, marginTop: 2 }}>{l}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* CO DALEJ */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={{ color: sc, fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 }}>{t('energyCircle.co_dalej', '✦ CO DALEJ?')}</Text>
            {[
              { label: 'Oddech grupowy', sub: 'Zsynchronizuj się z innymi', color: '#6366F1', route: 'BreathworkScreen' },
              { label: 'Czat wspólnoty', sub: 'Podziel się przeżyciem', color: '#EC4899', route: 'CommunityChatScreen' },
              { label: 'Medytacja', sub: 'Pogłęb swoją praktykę', color: '#10B981', route: 'Meditation' },
            ].map(item => (
              <Pressable key={item.label} onPress={() => { try { navigation.navigate(item.route); } catch (_) {} HapticsService.impact('light'); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8, backgroundColor: cb, borderColor: item.color + '33' }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: item.color + '18', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart color={item.color} size={16} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: tc, fontSize: 14, fontWeight: '700' }}>{item.label}</Text>
                  <Text style={{ color: sc, fontSize: 11 }}>{item.sub}</Text>
                </View>
                <ChevronLeft color={sc} size={16} style={{ transform: [{ rotate: '180deg' }] }} />
              </Pressable>
            ))}
          </View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
