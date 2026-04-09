// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, Dimensions, FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, ZoomIn, FadeIn,
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, cancelAnimation,
} from 'react-native-reanimated';
import {
  ChevronLeft, Users, Moon, MessageCircle, Music,
  Play, Square, Send, Star,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme, isLightBg } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { HapticsService } from '../core/services/haptics.service';
import { AudioService } from '../core/services/audio.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useAuthStore } from '../store/useAuthStore';
import {
  collection, onSnapshot, doc, setDoc, deleteDoc,
  addDoc, query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../core/config/firebase.config';

const { width: SW } = Dimensions.get('window');
const ORB_SIZE = SW * 0.56;

// ── Meditation groups ──────────────────────────────────────────────────────────
const GROUPS = [
  { id: 'morning',   label: 'Poranek',       sub: 'Codziennie 7:00',  emoji: '🌅', color: '#F59E0B', time: '07:00' },
  { id: 'noon',      label: 'Południe',       sub: 'Codziennie 12:00', emoji: '☀️', color: '#06B6D4', time: '12:00' },
  { id: 'evening',   label: 'Wieczór',        sub: 'Codziennie 21:00', emoji: '🌙', color: '#8B5CF6', time: '21:00' },
  { id: 'healing',   label: 'Uzdrawianie',    sub: 'Otwarta sesja',    emoji: '💚', color: '#10B981', time: 'open'  },
  { id: 'deepfocus', label: 'Głęboki fokus',  sub: 'Otwarta sesja',    emoji: '🎯', color: '#6366F1', time: 'open'  },
  { id: 'silence',   label: 'Milczenie',      sub: 'Otwarta sesja',    emoji: '🤫', color: '#94A3B8', time: 'open'  },
];

// ── Music options ──────────────────────────────────────────────────────────────
const MUSIC_OPTIONS = [
  { id: 'deepMeditation', label: 'Głęboka',    emoji: '🔮' },
  { id: 'healing',        label: 'Uzdrawianie', emoji: '💚' },
  { id: 'celestial',      label: 'Kosmiczna',   emoji: '✨' },
  { id: 'nature',         label: 'Natura',       emoji: '🌿' },
  { id: 'relaxing',       label: 'Relaks',       emoji: '🌊' },
  { id: 'zen',            label: 'Zen',          emoji: '☯️' },
];

const DAILY_INTENTIONS = [
  'Otwieram serce na miłość i obfitość',
  'Jestem spokojny i zakorzeniony',
  'Uwalniam to, co mnie nie służy',
  'Przyciągam pozytywną energię',
  'Jestem wdzięczny za wszystko co mam',
  'Ufam procesowi życia',
  'Jestem połączony z całym wszechświatem',
];

function formatMMSS(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── TABS ──────────────────────────────────────────────────────────────────────
type Tab = 'meditate' | 'chat' | 'music';

export const GroupMeditationScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const themeName = useAppStore(s => s.themeName);
  const theme = getResolvedTheme(themeName);
  const isLight = isLightBg(theme.background);
  const { currentUser } = useAuthStore();

  const tc = isLight ? '#1A1008' : '#F0ECE4';
  const sc = isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.18)' : 'rgba(255,255,255,0.10)';

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('meditate');
  const [selectedGroup, setSelectedGroup] = useState<string>('evening');
  const [joined, setJoined] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [meditatorNames, setMeditatorNames] = useState<string[]>([]);
  const [personalTimer, setPersonalTimer] = useState(0);
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatListRef = useRef<FlatList>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const todayIntention = DAILY_INTENTIONS[new Date().getDay()];
  const group = GROUPS.find(g => g.id === selectedGroup) ?? GROUPS[2];

  // ── Animations ─────────────────────────────────────────────────────────────
  const pulse = useSharedValue(1);
  const ring1 = useSharedValue(1);
  const ring2 = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 2200 }), withTiming(1, { duration: 2200 })),
      -1, false
    );
    ring1.value = withRepeat(withTiming(1.28, { duration: 3400 }), -1, true);
    ring2.value = withRepeat(withTiming(1.48, { duration: 5200 }), -1, true);
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(ring1);
      cancelAnimation(ring2);
    };
  }, []);

  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const ring1Style = useAnimatedStyle(() => ({ transform: [{ scale: ring1.value }], opacity: 2 - ring1.value }));
  const ring2Style = useAnimatedStyle(() => ({ transform: [{ scale: ring2.value }], opacity: (2 - ring2.value) * 0.5 }));

  // ── Firebase: active meditators in selected group ──────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'activeMeditations'),
      snap => {
        const docs = snap.docs.map(d => d.data()).filter(d => d.groupId === selectedGroup);
        setActiveCount(docs.length);
        setMeditatorNames(docs.map(d => d.name).filter(Boolean).slice(0, 6));
      },
      err => console.warn('GroupMeditation snapshot:', err)
    );
    return () => unsub();
  }, [selectedGroup]);

  // ── Firebase: live chat for selected group ─────────────────────────────────
  useEffect(() => {
    const q = query(
      collection(db, 'meditationChat', selectedGroup, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(40)
    );
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .reverse();
      setChatMessages(msgs);
      setTimeout(() => chatListRef.current?.scrollToEnd?.({ animated: true }), 100);
    }, err => console.warn('Chat snapshot:', err));
    return () => unsub();
  }, [selectedGroup]);

  // ── Personal timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (joined) {
      timerRef.current = setInterval(() => setPersonalTimer(p => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setPersonalTimer(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [joined]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (joined && currentUser?.uid) {
        deleteDoc(doc(db, 'activeMeditations', currentUser.uid)).catch(() => {});
      }
      if (isMusicPlaying) {
        AudioService.pauseAmbientSound();
      }
    };
  }, [joined, currentUser, isMusicPlaying]);

  // ── Join group ──────────────────────────────────────────────────────────────
  const handleJoin = useCallback(async () => {
    if (!currentUser) return;
    HapticsService.impact('medium');
    try {
      await setDoc(doc(db, 'activeMeditations', currentUser.uid), {
        joinedAt: serverTimestamp(),
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Dusza',
        groupId: selectedGroup,
      });
      setJoined(true);
    } catch (e) {
      console.warn('GroupMeditation join error:', e);
    }
  }, [currentUser, selectedGroup]);

  const handleLeave = useCallback(async () => {
    if (!currentUser) return;
    HapticsService.impact('medium');
    try {
      await deleteDoc(doc(db, 'activeMeditations', currentUser.uid));
      setJoined(false);
    } catch (e) {
      console.warn('GroupMeditation leave error:', e);
    }
  }, [currentUser]);

  // ── Music control ────────────────────────────────────────────────────────────
  const handleMusicToggle = useCallback(async (musicId: string) => {
    HapticsService.impact('medium');
    if (isMusicPlaying && selectedMusic === musicId) {
      await AudioService.pauseAmbientSound();
      setIsMusicPlaying(false);
    } else {
      setSelectedMusic(musicId);
      await AudioService.playMusicForSession(musicId as any);
      setIsMusicPlaying(true);
    }
  }, [isMusicPlaying, selectedMusic]);

  // ── Send chat message ────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatSending || !currentUser) return;
    setChatSending(true);
    setChatInput('');
    HapticsService.impact('medium');
    try {
      await addDoc(collection(db, 'meditationChat', selectedGroup, 'messages'), {
        text,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Dusza',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Chat send error:', e);
    } finally {
      setChatSending(false);
    }
  }, [chatInput, chatSending, currentUser, selectedGroup]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <LinearGradient
      colors={isLight ? ['#FDF6EE', '#EDE8F5'] : ['#080612', '#0E0A1E', '#080612']}
      style={s.flex}
    >
      <SafeAreaView style={s.flex} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
            <ChevronLeft size={24} color={tc} />
          </Pressable>
          <View style={s.headerTitles}>
            <Text style={[s.headerTitle, { color: tc }]}>{t('groupMeditation.title', 'Grupowa Medytacja')}</Text>
            <Text style={[s.headerSub, { color: sc }]}>{group.emoji} {group.label} · {group.sub}</Text>
          </View>
          <View style={[s.countBadge, { borderColor: group.color + '55', backgroundColor: group.color + '22' }]}>
            <Users size={12} color={group.color} />
            <Text style={[s.countBadgeText, { color: group.color }]}>{activeCount}</Text>
          </View>
        </View>

        {/* Tab bar */}
        <View style={[s.tabBar, { borderBottomColor: cardBorder }]}>
          {([
            { id: 'meditate', label: 'Medytacja', icon: <Moon size={14} color={activeTab === 'meditate' ? group.color : sc} /> },
            { id: 'chat',     label: 'Czat',      icon: <MessageCircle size={14} color={activeTab === 'chat' ? group.color : sc} /> },
            { id: 'music',    label: 'Muzyka',    icon: <Music size={14} color={activeTab === 'music' ? group.color : sc} /> },
          ] as { id: Tab; label: string; icon: any }[]).map(tab => (
            <Pressable
              key={tab.id}
              onPress={() => { setActiveTab(tab.id); HapticsService.impact('medium'); }}
              style={[s.tabItem, activeTab === tab.id && { borderBottomColor: group.color, borderBottomWidth: 2 }]}
            >
              {tab.icon}
              <Text style={[s.tabLabel, { color: activeTab === tab.id ? group.color : sc }]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── TAB: MEDITATE ── */}
        {activeTab === 'meditate' && (
          <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Group selector */}
            <Animated.View entering={FadeInDown.duration(350)} style={s.groupRow}>
              {GROUPS.map(g => (
                <Pressable
                  key={g.id}
                  onPress={() => { if (!joined) { setSelectedGroup(g.id); HapticsService.impact('medium'); } }}
                  style={[
                    s.groupPill,
                    { borderColor: g.color + (selectedGroup === g.id ? 'AA' : '33'),
                      backgroundColor: selectedGroup === g.id ? g.color + '22' : cardBg },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>{g.emoji}</Text>
                  <View>
                    <Text style={[s.groupPillLabel, { color: selectedGroup === g.id ? g.color : tc }]}>{g.label}</Text>
                    <Text style={[s.groupPillSub, { color: sc }]}>{g.sub}</Text>
                  </View>
                </Pressable>
              ))}
            </Animated.View>

            {/* Orb */}
            <View style={s.orbContainer}>
              <Animated.View style={[s.orbRing2, ring2Style, { borderColor: group.color + '30' }]} />
              <Animated.View style={[s.orbRing1, ring1Style, { borderColor: group.color + '55' }]} />
              <Animated.View style={[s.orbWrap, orbStyle]}>
                <LinearGradient
                  colors={[group.color + 'BB', group.color + '88', group.color + '55']}
                  style={s.orb}
                >
                  <Text style={s.orbCount}>{activeCount}</Text>
                  <Text style={s.orbLabel}>{t('groupMeditation.peopleMeditating', 'medytuje teraz')}</Text>
                  {joined && <Text style={s.timerText}>{formatMMSS(personalTimer)}</Text>}
                </LinearGradient>
              </Animated.View>
            </View>

            {/* Joined badge */}
            {joined && (
              <Animated.View entering={ZoomIn.duration(400)} style={[s.joinedBadge, { backgroundColor: group.color + '22', borderColor: group.color + '55' }]}>
                <Star size={12} color={group.color} fill={group.color} />
                <Text style={[s.joinedText, { color: group.color }]}>
                  {t('groupMeditation.meditatingWith', 'Medytujesz razem ze wspólnotą')}
                </Text>
              </Animated.View>
            )}

            {/* Intention */}
            <Animated.View entering={FadeInDown.delay(150).duration(400)} style={[s.intentionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[s.intentionLabel, { color: sc }]}>{t('groupMeditation.dailyIntention', 'Intencja dnia')}</Text>
              <Text style={[s.intentionText, { color: tc }]}>"{todayIntention}"</Text>
            </Animated.View>

            {/* Active meditators */}
            {meditatorNames.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[s.namesCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={s.namesHeader}>
                  <Users size={14} color={group.color} />
                  <Text style={[s.namesTitle, { color: sc }]}>{t('groupMeditation.activeMeditators', 'Aktywni medytujący')}</Text>
                </View>
                <View style={s.namesPills}>
                  {meditatorNames.map((name, i) => (
                    <View key={i} style={[s.namePill, { backgroundColor: group.color + '22' }]}>
                      <Text style={[s.namePillText, { color: group.color }]}>{name}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Join / Leave */}
            <Animated.View entering={FadeInDown.delay(280).duration(400)} style={s.btnWrap}>
              {!joined ? (
                <Pressable onPress={handleJoin}>
                  <LinearGradient
                    colors={[group.color, group.color + 'AA']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.joinBtn}
                  >
                    <Play size={18} color="#fff" fill="#fff" />
                    <Text style={s.joinBtnText}>{t('groupMeditation.joinBtn', 'Dołącz do kręgu')}</Text>
                  </LinearGradient>
                </Pressable>
              ) : (
                <Pressable onPress={handleLeave} style={[s.leaveBtn, { borderColor: group.color + '44' }]}>
                  <Square size={16} color={sc} />
                  <Text style={[s.leaveBtnText, { color: sc }]}>{t('groupMeditation.leaveBtn', 'Zakończ medytację')}</Text>
                </Pressable>
              )}
            </Animated.View>

            <EndOfContentSpacer size="standard" />
          </ScrollView>
        )}

        {/* ── TAB: CHAT ── */}
        {activeTab === 'chat' && (
          <KeyboardAvoidingView
            style={s.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={insets.bottom + 60}
          >
            <FlatList
              ref={chatListRef}
              data={chatMessages}
              keyExtractor={item => item.id}
              contentContainerStyle={s.chatList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => chatListRef.current?.scrollToEnd?.({ animated: false })}
              ListEmptyComponent={
                <Animated.View entering={FadeIn.duration(400)} style={s.chatEmpty}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
                  <Text style={[s.chatEmptyText, { color: sc }]}>Bądź pierwszą osobą, która napisze wiadomość w tym kręgu</Text>
                </Animated.View>
              }
              renderItem={({ item }) => {
                const isOwn = item.authorId === currentUser?.uid;
                return (
                  <View style={[s.chatBubbleWrap, isOwn && s.chatBubbleWrapOwn]}>
                    {!isOwn && (
                      <Text style={[s.chatAuthor, { color: group.color }]}>{item.authorName || 'Dusza'}</Text>
                    )}
                    <View style={[
                      s.chatBubble,
                      { backgroundColor: isOwn ? group.color + 'CC' : cardBg, borderColor: isOwn ? 'transparent' : cardBorder },
                    ]}>
                      <Text style={[s.chatText, { color: isOwn ? '#fff' : tc }]}>{item.text}</Text>
                    </View>
                  </View>
                );
              }}
            />
            <View style={[s.chatInputRow, { backgroundColor: cardBg, borderTopColor: cardBorder }]}>
              <TextInput
                style={[s.chatInput, { color: tc }]}
                placeholder="Napisz wiadomość..."
                placeholderTextColor={sc}
                value={chatInput}
                onChangeText={setChatInput}
                multiline
                maxLength={300}
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
              />
              <Pressable
                onPress={handleSendMessage}
                disabled={chatSending || !chatInput.trim()}
                style={[s.chatSendBtn, { backgroundColor: chatInput.trim() ? group.color : group.color + '44' }]}
              >
                <Send size={16} color="#fff" />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* ── TAB: MUSIC ── */}
        {activeTab === 'music' && (
          <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.duration(350)}>
              <Text style={[s.musicTitle, { color: tc }]}>Muzyka do medytacji</Text>
              <Text style={[s.musicSub, { color: sc }]}>Wybierz ścieżkę dźwiękową dla swojej sesji</Text>
            </Animated.View>

            {MUSIC_OPTIONS.map((m, i) => {
              const isActive = selectedMusic === m.id && isMusicPlaying;
              return (
                <Animated.View key={m.id} entering={FadeInDown.delay(i * 60).duration(300)}>
                  <Pressable
                    onPress={() => handleMusicToggle(m.id)}
                    style={[s.musicCard, { backgroundColor: isActive ? group.color + '22' : cardBg, borderColor: isActive ? group.color + '88' : cardBorder }]}
                  >
                    <View style={[s.musicIcon, { backgroundColor: isActive ? group.color + '33' : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)') }]}>
                      <Text style={{ fontSize: 26 }}>{m.emoji}</Text>
                    </View>
                    <View style={s.musicInfo}>
                      <Text style={[s.musicName, { color: isActive ? group.color : tc }]}>{m.label}</Text>
                      <Text style={[s.musicStatus, { color: sc }]}>
                        {isActive ? '▶ Odtwarzanie...' : 'Dotknij aby odtworzyć'}
                      </Text>
                    </View>
                    {isActive && (
                      <View style={[s.musicActiveDot, { backgroundColor: group.color }]} />
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}

            <View style={[s.musicHint, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Music size={14} color={sc} />
              <Text style={[s.musicHintText, { color: sc }]}>
                Muzyka odtwarza się przez głośnik urządzenia. Możesz dołączyć do kręgu medytacyjnego i jednocześnie słuchać muzyki.
              </Text>
            </View>

            <EndOfContentSpacer size="standard" />
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const s = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: layout.padding.screen, paddingVertical: 12, gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.3 },
  headerSub: { fontSize: 12, marginTop: 2 },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1,
  },
  countBadgeText: { fontSize: 12, fontWeight: '700' },
  // Tab bar
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1,
    paddingHorizontal: layout.padding.screen,
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10,
  },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  // Scroll
  scrollContent: {
    paddingHorizontal: layout.padding.screen,
    alignItems: 'center', paddingBottom: 40, paddingTop: 12,
  },
  // Groups
  groupRow: {
    width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8,
  },
  groupPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1,
  },
  groupPillLabel: { fontSize: 13, fontWeight: '700' },
  groupPillSub: { fontSize: 10, marginTop: 1 },
  // Orb
  orbContainer: {
    width: ORB_SIZE, height: ORB_SIZE,
    alignItems: 'center', justifyContent: 'center', marginVertical: 16,
  },
  orbRing1: {
    position: 'absolute', width: ORB_SIZE, height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2, borderWidth: 1.5,
  },
  orbRing2: {
    position: 'absolute', width: ORB_SIZE, height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2, borderWidth: 1,
  },
  orbWrap: {
    width: ORB_SIZE * 0.70, height: ORB_SIZE * 0.70,
    borderRadius: ORB_SIZE * 0.35, overflow: 'hidden',
  },
  orb: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: ORB_SIZE * 0.35,
  },
  orbCount: { fontSize: 46, fontWeight: '800', color: '#fff' },
  orbLabel: { fontSize: 12, color: 'rgba(255,255,255,0.80)', textAlign: 'center', marginTop: 4 },
  timerText: { fontSize: 20, color: '#FDE68A', fontWeight: '700', marginTop: 8, letterSpacing: 3 },
  // Badges
  joinedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 14, borderWidth: 1,
  },
  joinedText: { fontSize: 13, fontWeight: '600' },
  // Cards
  intentionCard: {
    width: '100%', borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 12,
  },
  intentionLabel: { fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  intentionText: { fontSize: 16, lineHeight: 25, fontStyle: 'italic', fontWeight: '500' },
  namesCard: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14 },
  namesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  namesTitle: { fontSize: 13, fontWeight: '600' },
  namesPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  namePill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  namePillText: { fontSize: 12, fontWeight: '600' },
  // Buttons
  btnWrap: { width: '100%', marginTop: 8 },
  joinBtn: {
    borderRadius: 28, paddingVertical: 15, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  joinBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  leaveBtn: {
    borderRadius: 28, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  leaveBtnText: { fontSize: 15, fontWeight: '600' },
  // Chat
  chatList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  chatEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  chatEmptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 260 },
  chatBubbleWrap: { marginBottom: 10, maxWidth: '80%', alignSelf: 'flex-start' },
  chatBubbleWrapOwn: { alignSelf: 'flex-end' },
  chatAuthor: { fontSize: 11, fontWeight: '700', marginBottom: 3, marginLeft: 4 },
  chatBubble: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  chatText: { fontSize: 14, lineHeight: 20 },
  chatInputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, borderTopWidth: 1,
  },
  chatInput: { flex: 1, fontSize: 14, maxHeight: 80, paddingVertical: 8 },
  chatSendBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  // Music
  musicTitle: { fontSize: 20, fontWeight: '700', alignSelf: 'flex-start', marginBottom: 4 },
  musicSub: { fontSize: 13, alignSelf: 'flex-start', marginBottom: 16 },
  musicCard: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10,
  },
  musicIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  musicInfo: { flex: 1 },
  musicName: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  musicStatus: { fontSize: 12 },
  musicActiveDot: { width: 8, height: 8, borderRadius: 4 },
  musicHint: {
    width: '100%', flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 8,
  },
  musicHintText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
