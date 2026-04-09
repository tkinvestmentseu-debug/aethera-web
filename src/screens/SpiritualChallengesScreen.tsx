// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInDown, FadeIn } from 'react-native-reanimated';
import { ChevronLeft, Heart, Moon, Wind, Trophy, ChevronDown, ChevronUp, CheckCircle, Star } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { ChallengesService, Challenge as FBChallenge } from '../core/services/community/challenges.service';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#F97316';

const CHALLENGES = [
  {
    id: 'c1', title: '7 Dni Wdzięczności', days: 7, participants: 1892, completion: 67,
    icon: Heart, color: '#F59E0B', desc: 'Każdego dnia zapisz 3 rzeczy, za które jesteś wdzięczna(y).',
    benefits: ['Głębsze połączenie z teraźniejszością', 'Redukcja stresu i lęku', 'Wzrost poczucia szczęścia'],
    tips: ['Rób to rano — nastraja na cały dzień', 'Bądź konkretna(y), nie ogólna(y)'],
    task: 'Napisz dziś 3 szczegółowe rzeczy za które jesteś wdzięczna(y).',
  },
  {
    id: 'c2', title: '21 Dni Medytacji', days: 21, participants: 934, completion: 43,
    icon: Moon, color: '#6366F1', desc: 'Codziennie 10 minut ciszy i wyciszenia o stałej porze.',
    benefits: ['Spokój umysłu i równowaga emocjonalna', 'Lepsza jakość snu', 'Głębsza samoświadomość'],
    tips: ['Poranna medytacja działa najskuteczniej', 'Użyj słuchawek i aplikacji guided'],
    task: 'Siądź dziś w ciszy przez 10 minut. Obserwuj oddech bez oceniania.',
  },
  {
    id: 'c3', title: '30 Dni bez Reaktywności', days: 30, participants: 512, completion: 28,
    icon: Wind, color: '#10B981', desc: 'Zanim zareagujesz — zatrzymaj się. Wdech. Wybierz świadomie.',
    benefits: ['Spokojniejsze relacje i mniej konfliktów', 'Poczucie kontroli i siły', 'Głębsze połączenie ze sobą'],
    tips: ['Technika 4-sekundowego oddechu przed każdą odpowiedzią', 'Wieczorem oceń dzień — 0-10 punktów'],
    task: 'Dziś zwróć uwagę na 3 momenty, gdy chciałaś(eś) zareagować impulsywnie.',
  },
];

const RANKING = [
  { label: 'Dusza #1', info: '7-dniowa seria', stars: 7 },
  { label: 'Dusza #2', info: '21-dniowa seria', stars: 21 },
  { label: 'Dusza #3', info: '14-dniowa seria', stars: 14 },
  { label: 'Dusza #4', info: '5-dniowa seria', stars: 5 },
  { label: 'Dusza #5', info: '3-dniowa seria', stars: 3 },
];

export const SpiritualChallengesScreen = ({ navigation }) => {
  const { t } = useTranslation();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
    const currentUser = useAuthStore(s => s.currentUser);
  const tc = isLight ? '#1A1008' : '#F0ECE4';
  const sc = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';
  const cb = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const cbr = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)';

  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [checkedInIds, setCheckedInIds] = useState<string[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDays, setNewDays] = useState('');
  const [newTask, setNewTask] = useState('');
  const [createSent, setCreateSent] = useState(false);
  const createSentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Firebase: real participant counts & IDs keyed by challenge title (lowercased)
  const [fbChallenges, setFbChallenges] = useState<FBChallenge[]>([]);
  const [leaderboard, setLeaderboard] = useState(RANKING);

  useEffect(() => {
    ChallengesService.seedIfNeeded().catch(() => {});
    ChallengesService.getLeaderboard().then(lb => {
      if (lb.length > 0) setLeaderboard(lb.map(e => ({ label: e.displayName, info: `${e.days}-dniowa seria`, stars: e.streak })));
    }).catch(() => {});
    const unsub = ChallengesService.listenToChallenges(chs => {
      setFbChallenges(chs);
      // Restore joined state from Firebase
      if (currentUser) {
        const uid = currentUser.uid;
        Promise.all(chs.map(c => ChallengesService.getProgress(c.id, uid).then(prog => ({ c, prog })))).then(results => {
          const today = new Date().toISOString().split('T')[0];
          const newJoined: string[] = [];
          const newCheckedIn: string[] = [];
          for (const { c, prog } of results) {
            if (!prog) continue;
            const idx = CHALLENGES.findIndex(lc => lc.title.toLowerCase().includes(c.title.split(' ')[0].toLowerCase()));
            if (idx >= 0) {
              newJoined.push(CHALLENGES[idx].id);
              if (prog.completedDays?.includes(today)) newCheckedIn.push(CHALLENGES[idx].id);
            }
          }
          if (newJoined.length > 0) setJoinedIds(prev => [...new Set([...prev, ...newJoined])]);
          if (newCheckedIn.length > 0) setCheckedInIds(prev => [...new Set([...prev, ...newCheckedIn])]);
        }).catch(() => {});
      }
    });
    return () => { unsub(); if (createSentTimerRef.current) clearTimeout(createSentTimerRef.current); };
  }, []);

  const getFbChallenge = (staticId: string): FBChallenge | undefined => {
    const idx = CHALLENGES.findIndex(c => c.id === staticId);
    return fbChallenges[idx];
  };

  const toggleJoin = async (id: string) => {
    HapticsService.impact('medium');
    const isJoined = joinedIds.includes(id);
    setJoinedIds(prev => isJoined ? prev.filter(x => x !== id) : [...prev, id]);
    if (!isJoined && currentUser) {
      const fb = getFbChallenge(id);
      if (fb) ChallengesService.joinChallenge(fb.id, currentUser.uid, currentUser.displayName ?? 'Dusza').catch(() => {});
    }
  };

  const handleCheckIn = async (id: string) => {
    if (checkedInIds.includes(id)) return;
    HapticsService.impact('medium');
    setCheckedInIds(prev => [...prev, id]);
    if (currentUser) {
      const fb = getFbChallenge(id);
      if (fb) ChallengesService.checkIn(fb.id, currentUser.uid).catch(() => {});
    }
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    HapticsService.impact('medium');
    setCreateSent(true);
    if (currentUser) {
      ChallengesService.createCustom(
        { uid: currentUser.uid, displayName: currentUser.displayName },
        { title: newTitle.trim(), days: parseInt(newDays) || 7, task: newTask.trim() || newTitle.trim() }
      ).catch(() => {});
    }
    setNewTitle(''); setNewDays(''); setNewTask('');
    if (createSentTimerRef.current) clearTimeout(createSentTimerRef.current);
    createSentTimerRef.current = setTimeout(() => setCreateSent(false), 3000);
  };

  const totalParticipants = fbChallenges.length > 0
    ? fbChallenges.reduce((sum, c) => sum + (c.participantCount ?? 0), 0)
    : CHALLENGES.reduce((sum, c) => sum + c.participants, 0);

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <LinearGradient
        colors={isLight ? ['#FFF7ED', '#FFEDD5', currentTheme.background] : ['#0E0601', '#1A0A02', currentTheme.background]}
        style={StyleSheet.absoluteFill} pointerEvents="none"
      />
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={tc} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: tc }]}>{t('spiritualChallenges.wyzwania_ducha', 'Wyzwania Ducha')}</Text>
          <Text style={[styles.headerSub, { color: ACCENT }]}>{t('spiritualChallenges.transforma', 'TRANSFORMACJA')}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable onPress={() => {
            HapticsService.impact('light');
            if (isFavoriteItem('spiritual-challenges')) { removeFavoriteItem('spiritual-challenges'); } else { addFavoriteItem({ id: 'spiritual-challenges', label: 'Wyzwania Ducha', route: 'SpiritualChallenges', icon: 'Trophy', color: ACCENT, addedAt: Date.now() }); }
          }} style={{ padding: 6 }}>
            <Star size={20} color="#F59E0B" fill={isFavoriteItem('spiritual-challenges') ? '#F59E0B' : 'none'} />
          </Pressable>
          <Trophy size={20} color={ACCENT} />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: 20 }}>

          {/* Total stats */}
          <View style={[styles.statsBanner, { backgroundColor: ACCENT + '15', borderColor: ACCENT + '40' }]}>
            <Text style={[styles.statsBannerText, { color: ACCENT }]}>{totalParticipants.toLocaleString()} uczestników aktywnych wyzwań</Text>
          </View>

          {/* Challenge Cards */}
          {CHALLENGES.map((c, i) => {
            const Icon = c.icon;
            const joined = joinedIds.includes(c.id);
            const expanded = expandedId === c.id;
            const checkedIn = checkedInIds.includes(c.id);
            return (
              <Animated.View key={c.id} entering={FadeInDown.delay(i * 80)}>
                <View style={[styles.challengeCard, { backgroundColor: cb, borderColor: joined ? c.color + '80' : cbr }]}>
                  <LinearGradient colors={[c.color + '18', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  <View style={styles.challengeTop}>
                    <View style={[styles.challengeIcon, { backgroundColor: c.color + '22' }]}>
                      <Icon size={20} color={c.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.challengeTitle, { color: tc }]}>{c.title}</Text>
                      <Text style={[styles.challengeDesc, { color: sc }]} numberOfLines={1}>{c.desc}</Text>
                    </View>
                    <Pressable onPress={() => setExpandedId(expanded ? null : c.id)}>
                      {expanded ? <ChevronUp size={18} color={sc} /> : <ChevronDown size={18} color={sc} />}
                    </Pressable>
                  </View>

                  {/* Stats */}
                  <View style={styles.challengeStats}>
                    <Text style={[styles.challengeStat, { color: sc }]}>{c.days} dni</Text>
                    <Text style={[styles.challengeStat, { color: sc }]}>·</Text>
                    <Text style={[styles.challengeStat, { color: sc }]}>{(getFbChallenge(c.id)?.participantCount ?? c.participants).toLocaleString()} uczestników</Text>
                    <Text style={[styles.challengeStat, { color: sc }]}>·</Text>
                    <Text style={[styles.challengeStat, { color: c.color }]}>{c.completion}% ukończenia</Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={[styles.progressBar, { backgroundColor: cbr }]}>
                    <View style={[styles.progressFill, { width: `${c.completion}%`, backgroundColor: c.color }]} />
                  </View>

                  {/* Join */}
                  <Pressable onPress={() => toggleJoin(c.id)} style={[styles.joinBtn, { backgroundColor: joined ? c.color : 'transparent', borderColor: c.color }]}>
                    <Text style={[styles.joinText, { color: joined ? '#fff' : c.color }]}>{joined ? 'Dołączona(y) ✓' : 'Dołącz do wyzwania'}</Text>
                  </Pressable>

                  {/* Expanded */}
                  {expanded && (
                    <Animated.View entering={FadeIn} style={styles.expandedSection}>
                      <Text style={[styles.expandLabel, { color: c.color }]}>{t('spiritualChallenges.zadanie_na_dzis', 'ZADANIE NA DZIŚ')}</Text>
                      <Text style={[styles.expandTask, { color: tc }]}>{c.task}</Text>
                      <Text style={[styles.expandLabel, { color: c.color, marginTop: 12 }]}>{t('spiritualChallenges.korzysci', 'KORZYŚCI')}</Text>
                      {c.benefits.map((b, j) => (
                        <View key={j} style={styles.benefitRow}>
                          <Text style={{ color: c.color }}>✦</Text>
                          <Text style={[styles.benefitText, { color: tc }]}>{b}</Text>
                        </View>
                      ))}
                      <Text style={[styles.expandLabel, { color: c.color, marginTop: 12 }]}>{t('spiritualChallenges.wskazowki_spolecznos', 'WSKAZÓWKI SPOŁECZNOŚCI')}</Text>
                      {c.tips.map((t, j) => (
                        <Text key={j} style={[styles.tipText, { color: sc }]}>• {t}</Text>
                      ))}
                      {joined && (
                        <Pressable onPress={() => handleCheckIn(c.id)} style={[styles.checkInBtn, { backgroundColor: checkedIn ? '#10B981' : cbr, borderColor: checkedIn ? '#10B981' : cbr }]}>
                          <CheckCircle size={16} color={checkedIn ? '#fff' : sc} />
                          <Text style={[styles.checkInText, { color: checkedIn ? '#fff' : sc }]}>
                            {checkedIn ? 'Dzisiaj zaliczone ✓' : 'Zalicz dzisiejszy dzień'}
                          </Text>
                        </Pressable>
                      )}
                    </Animated.View>
                  )}
                </View>
              </Animated.View>
            );
          })}

          {/* Joined summary */}
          {joinedIds.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.sectionTitle, { color: sc }]}>{t('spiritualChallenges.twoje_wyzwania', 'TWOJE WYZWANIA')}</Text>
              {CHALLENGES.filter(c => joinedIds.includes(c.id)).map(c => (
                <View key={c.id} style={[styles.myChallenge, { backgroundColor: cb, borderColor: cbr }]}>
                  <View style={[styles.challengeColorDot, { backgroundColor: c.color }]} />
                  <Text style={[styles.myChallengeTitle, { color: tc }]}>{c.title}</Text>
                  <Text style={[styles.myChallengeProgress, { color: c.color }]}>
                    {checkedInIds.includes(c.id) ? 'Dzień 2 z ' : 'Dzień 1 z '}{c.days}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Ranking */}
          <Text style={[styles.sectionTitle, { color: sc, marginTop: 24 }]}>{t('spiritualChallenges.spoleczny_ranking', 'SPOŁECZNY RANKING')}</Text>
          {leaderboard.map((r, i) => (
            <View key={i} style={[styles.rankRow, { backgroundColor: cb, borderColor: cbr }]}>
              <Text style={[styles.rankNum, { color: ACCENT }]}>#{i + 1}</Text>
              <Text style={[styles.rankLabel, { color: tc }]}>{r.label}</Text>
              <Text style={[styles.rankInfo, { color: sc }]}>{r.info}</Text>
              <Text style={{ color: ACCENT }}>{'⭐'.repeat(Math.min(r.stars, 5))}</Text>
            </View>
          ))}

          {/* Create Challenge */}
          <Text style={[styles.sectionTitle, { color: sc, marginTop: 24 }]}>{t('spiritualChallenges.stworz_wyzwanie', 'STWÓRZ WYZWANIE')}</Text>
          <View style={[styles.createCard, { backgroundColor: cb, borderColor: cbr }]}>
            <TextInput value={newTitle} onChangeText={setNewTitle} placeholder={t('spiritualChallenges.nazwa_wyzwania', 'Nazwa wyzwania...')} placeholderTextColor={sc} style={[styles.createInput, { color: tc, borderColor: cbr }]} />
            <TextInput value={newDays} onChangeText={setNewDays} placeholder={t('spiritualChallenges.liczba_dni_np_14', 'Liczba dni (np. 14)...')} placeholderTextColor={sc} keyboardType="numeric" style={[styles.createInput, { color: tc, borderColor: cbr }]} />
            <TextInput value={newTask} onChangeText={setNewTask} placeholder={t('spiritualChallenges.codzienne_zadanie', 'Codzienne zadanie...')} placeholderTextColor={sc} multiline style={[styles.createInput, { color: tc, borderColor: cbr, minHeight: 64 }]} />
            <Pressable onPress={handleCreate} style={[styles.createBtn, { backgroundColor: ACCENT }]}>
              <Text style={styles.createBtnText}>{createSent ? 'Wyzwanie wysłane do weryfikacji ✦' : 'Wyślij wyzwanie'}</Text>
            </Pressable>
          </View>

          <EndOfContentSpacer />
        </ScrollView>
      </KeyboardAvoidingView>
        </SafeAreaView>
</View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingVertical: 12 },
  backBtn: { width: 38, height: 38, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 1 },
  statsBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  statsBannerText: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  challengeCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14, overflow: 'hidden' },
  challengeTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  challengeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  challengeTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  challengeDesc: { fontSize: 12, lineHeight: 18 },
  challengeStats: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  challengeStat: { fontSize: 12 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: 6, borderRadius: 3 },
  joinBtn: { paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  joinText: { fontSize: 14, fontWeight: '700' },
  expandedSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.12)' },
  expandLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  expandTask: { fontSize: 14, lineHeight: 20 },
  benefitRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  benefitText: { fontSize: 13, lineHeight: 19, flex: 1 },
  tipText: { fontSize: 12, lineHeight: 18, marginBottom: 4 },
  checkInBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 10, marginTop: 12 },
  checkInText: { fontSize: 14, fontWeight: '600' },
  myChallenge: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  challengeColorDot: { width: 10, height: 10, borderRadius: 5 },
  myChallengeTitle: { flex: 1, fontSize: 13, fontWeight: '600' },
  myChallengeProgress: { fontSize: 12, fontWeight: '700' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  rankNum: { fontSize: 14, fontWeight: '800', width: 28 },
  rankLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  rankInfo: { fontSize: 12 },
  createCard: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  createInput: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 13, textAlignVertical: 'top' },
  createBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
