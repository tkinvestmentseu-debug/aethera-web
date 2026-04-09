// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Dimensions, Modal, Pressable, Alert,
  KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, FadeInDown, FadeIn, ZoomIn, cancelAnimation,
} from 'react-native-reanimated';
import {
  ChevronLeft, Plus, MapPin, Calendar, Lock, Globe, Heart,
  Star, Sparkles, ChevronDown, ChevronRight, Check, Zap,
} from 'lucide-react-native';
import {
  collection, addDoc, onSnapshot, query, orderBy, limit,
  serverTimestamp, doc, setDoc, getDoc, where, runTransaction,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../core/config/firebase.config';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { HapticsService } from '../core/services/haptics.service';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#8B5CF6';
const SP = 18;

// ─── Static data — hoisted to module level ───────────────────────────────────
const MILESTONE_CATEGORIES = [
  { id: 'awakening',     label: 'Przebudzenie',   emoji: '⚡', color: '#F59E0B' },
  { id: 'healing',       label: 'Uzdrowienie',    emoji: '💚', color: '#10B981' },
  { id: 'transformation',label: 'Transformacja',  emoji: '🦋', color: '#8B5CF6' },
  { id: 'relationship',  label: 'Relacja',         emoji: '💗', color: '#EC4899' },
  { id: 'spirituality',  label: 'Duchowość',       emoji: '🔮', color: '#818CF8' },
  { id: 'loss',          label: 'Utrata',          emoji: '🌑', color: '#6B7280' },
  { id: 'joy',           label: 'Radość',          emoji: '✨', color: '#FBBF24' },
  { id: 'work',          label: 'Praca',           emoji: '🌟', color: '#34D399' },
];

const COMMUNITY_REACTIONS = ['💫', '💗', '🌟'];

const SEED_MILESTONES = [
  {
    id: 'seed_m1', userId: 'seed_u1', displayName: 'Luna M.', emoji: '🌙',
    title: 'Pierwsza medytacja głęboka', category: 'spirituality',
    description: 'Po raz pierwszy osiągnęłam stan prawdziwej ciszy. Nic nie powiedziałam przez godzinę po.',
    date: new Date(Date.now() - 45 * 24 * 3600000).toISOString(), isPublic: true,
    reactions: { '💫': 14, '💗': 9, '🌟': 6 },
  },
  {
    id: 'seed_m2', userId: 'seed_u2', displayName: 'Orion S.', emoji: '☀️',
    title: 'Wybaczenie ojcu', category: 'healing',
    description: 'Trzy lata pracy wewnętrznej przyniosły owoc. To nie było dla niego — to było dla mnie.',
    date: new Date(Date.now() - 12 * 24 * 3600000).toISOString(), isPublic: true,
    reactions: { '💫': 33, '💗': 58, '🌟': 21 },
  },
  {
    id: 'seed_m3', userId: 'seed_u3', displayName: 'Vera K.', emoji: '🦋',
    title: 'Zmiana pracy — skok wiary', category: 'transformation',
    description: 'Odeszłam z korporacji bez drugiego miejsca. Wszechświat otworzył mi drzwi po trzech tygodniach.',
    date: new Date(Date.now() - 3 * 24 * 3600000).toISOString(), isPublic: true,
    reactions: { '💫': 47, '💗': 39, '🌟': 72 },
  },
];

const CHAPTER_GRADIENTS = [
  ['#7C3AED', '#4F46E5'],
  ['#0EA5E9', '#6366F1'],
  ['#10B981', '#059669'],
  ['#F59E0B', '#EF4444'],
];

// ─── Module-level memoized helpers ───────────────────────────────────────────
const getCategoryMeta = (catId) => MILESTONE_CATEGORIES.find(c => c.id === catId) || MILESTONE_CATEGORIES[2];

const formatDateShort = (iso) => {
  try {
    const d = new Date(iso);
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  } catch { return ''; }
};

const daysSince = (iso) => {
  try {
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  } catch { return 0; }
};

// ─── Animated timeline dot ───────────────────────────────────────────────────
const TimelineDot = React.memo(({ color }) => {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.3, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1, false,
    );
    return () => cancelAnimation(pulse);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2.3 - pulse.value,
  }));
  return (
    <View style={{ alignItems: 'center', width: 24 }}>
      <Animated.View style={[{ width: 14, height: 14, borderRadius: 7, backgroundColor: color, position: 'absolute' }, style]} />
      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: color }} />
    </View>
  );
});

// ─── Milestone Card (personal timeline) ─────────────────────────────────────
const MilestoneCard = React.memo(({ milestone, isLast, textColor, subColor, isLight, onDelete }) => {
  const cat = getCategoryMeta(milestone.category);
  const cardBg = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.05)';
  const borderColor = isLight ? 'rgba(139,100,42,0.15)' : 'rgba(255,255,255,0.07)';

  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: isLast ? 0 : 4 }}>
      {/* Timeline spine */}
      <View style={{ alignItems: 'center', width: 24 }}>
        <TimelineDot color={cat.color} />
        {!isLast && <View style={{ width: 2, flex: 1, backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', marginTop: 4 }} />}
      </View>
      {/* Card */}
      <View style={[sh.milestoneCard, { backgroundColor: cardBg, borderColor, flex: 1, marginBottom: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <View style={[sh.catBadge, { backgroundColor: cat.color + '20', borderColor: cat.color + '40' }]}>
            <Text style={{ fontSize: 12 }}>{cat.emoji}</Text>
            <Text style={{ color: cat.color, fontSize: 11, fontWeight: '700' }}>{cat.label}</Text>
          </View>
          <View style={{ flex: 1 }} />
          {milestone.isPublic ? (
            <Globe size={12} color={subColor} strokeWidth={1.8} />
          ) : (
            <Lock size={12} color={subColor} strokeWidth={1.8} />
          )}
          <Text style={{ color: subColor, fontSize: 11 }}>{formatDateShort(milestone.date)}</Text>
        </View>
        <Text style={{ color: textColor, fontSize: 15, fontWeight: '700', marginBottom: 4 }}>
          {milestone.title}
        </Text>
        {milestone.description ? (
          <Text style={{ color: subColor, fontSize: 13, lineHeight: 18 }} numberOfLines={3}>
            {milestone.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

// ─── Community Milestone Card ─────────────────────────────────────────────────
const CommunityMilestoneCard = React.memo(({ milestone, textColor, subColor, isLight, currentUserId, onReact, index }) => {
  const cat = getCategoryMeta(milestone.category);
  const cardBg = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.06)';
  const borderColor = isLight ? 'rgba(139,100,42,0.15)' : 'rgba(255,255,255,0.07)';

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(380)}>
      <View style={[sh.milestoneCard, { backgroundColor: cardBg, borderColor, marginBottom: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <View style={[sh.avatarCircle, { backgroundColor: cat.color + '25' }]}>
            <Text style={{ fontSize: 18 }}>{milestone.emoji || '🌟'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: textColor, fontSize: 14, fontWeight: '700' }}>{milestone.displayName}</Text>
            <Text style={{ color: subColor, fontSize: 11 }}>{formatDateShort(milestone.date)}</Text>
          </View>
          <View style={[sh.catBadge, { backgroundColor: cat.color + '18', borderColor: cat.color + '35' }]}>
            <Text style={{ fontSize: 11 }}>{cat.emoji}</Text>
            <Text style={{ color: cat.color, fontSize: 10, fontWeight: '700' }}>{cat.label}</Text>
          </View>
        </View>
        <Text style={{ color: textColor, fontSize: 15, fontWeight: '700', marginBottom: 5 }}>
          {milestone.title}
        </Text>
        {milestone.description ? (
          <Text style={{ color: subColor, fontSize: 13, lineHeight: 18, marginBottom: 10 }} numberOfLines={4}>
            {milestone.description}
          </Text>
        ) : null}
        {/* Reactions */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {COMMUNITY_REACTIONS.map(emoji => (
            <Pressable
              key={emoji}
              onPress={() => onReact(milestone.id, emoji)}
              style={[sh.reactBtn, {
                backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                borderColor: isLight ? 'rgba(139,100,42,0.15)' : 'rgba(255,255,255,0.08)',
              }]}
            >
              <Text style={{ fontSize: 14 }}>{emoji}</Text>
              <Text style={{ color: subColor, fontSize: 12 }}>
                {(milestone.reactions?.[emoji]) || 0}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Animated.View>
  );
});

// ─── Add Milestone Modal ───────────────────────────────────────────────────────
const AddMilestoneModal = React.memo(({ visible, onClose, onSubmit, textColor, subColor, isLight }) => {
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('spirituality');
  const [isPublic, setIsPublic] = useState(true);

  const inputBg = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
  const borderC = isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.12)';

  const handleSubmit = useCallback(() => {
    if (!title.trim()) { Alert.alert(t('soulJourneyMap.uzupelnij', 'Uzupełnij'), t('soulJourneyMap.podaj_tytul_kamienia_milowego', 'Podaj tytuł kamienia milowego.')); return; }
    onSubmit({ title: title.trim(), description: description.trim(), category, isPublic });
    setTitle(''); setDescription(''); setCategory('spirituality'); setIsPublic(true);
  }, [title, description, category, isPublic, onSubmit]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={[sh.modalSheet, { backgroundColor: isLight ? '#FAF8F5' : '#12101E' }]}>
          <View style={[sh.modalHandle, { backgroundColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }]} />
          <Text style={[sh.modalTitle, { color: textColor }]}>{t('soulJourneyMap.nowy_kamien_milowy', '🗺️ Nowy Kamień Milowy')}</Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('soulJourneyMap.co_sie_wydarzylo_np_pierwsze', 'Co się wydarzyło? (np. Pierwsze odwrócenie karty)')}
            placeholderTextColor={subColor}
            style={[sh.input, { backgroundColor: inputBg, borderColor: borderC, color: textColor }]}
            maxLength={100}
          />

          <Text style={[sh.fieldLabel, { color: subColor }]}>{t('soulJourneyMap.kategoria', 'Kategoria')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {MILESTONE_CATEGORIES.map(cat => (
                <Pressable
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  style={[sh.catPill, {
                    backgroundColor: category === cat.id ? cat.color + '25' : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)'),
                    borderColor: category === cat.id ? cat.color : borderC,
                  }]}
                >
                  <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                  <Text style={{ color: category === cat.id ? cat.color : subColor, fontSize: 12, fontWeight: '600' }}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('soulJourneyMap.opisz_to_wydarzenie_jak_sie', 'Opisz to wydarzenie — jak się czułeś/aś, co zrozumiałeś/aś?')}
            placeholderTextColor={subColor}
            multiline
            numberOfLines={4}
            style={[sh.input, { backgroundColor: inputBg, borderColor: borderC, color: textColor, height: 90, textAlignVertical: 'top' }]}
            maxLength={600}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <View>
              <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>
                {isPublic ? '🌐 Publiczny' : '🔒 Prywatny'}
              </Text>
              <Text style={{ color: subColor, fontSize: 11, marginTop: 1 }}>
                {isPublic ? 'Widoczny dla połączonych dusz' : 'Tylko dla Ciebie'}
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ true: ACCENT, false: isLight ? '#D1D5DB' : '#374151' }}
              thumbColor="#fff"
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={onClose} style={[sh.modalBtn, { borderColor: borderC, flex: 1 }]}>
              <Text style={{ color: subColor, fontSize: 15, fontWeight: '600' }}>{t('soulJourneyMap.anuluj', 'Anuluj')}</Text>
            </Pressable>
            <Pressable onPress={handleSubmit} style={[sh.modalBtn, { backgroundColor: ACCENT, borderColor: ACCENT, flex: 2 }]}>
              <MapPin size={16} color="#fff" strokeWidth={2} />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 6 }}>{t('soulJourneyMap.dodaj', 'Dodaj')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

// ─── Journey Stats Bar ────────────────────────────────────────────────────────
const JourneyStats = React.memo(({ milestones, joinedDate, textColor, subColor, isLight }) => {
  const stats = useMemo(() => {
    const total = milestones.length;
    const days = joinedDate ? daysSince(joinedDate) : 0;
    const catCounts = {};
    milestones.forEach(m => { catCounts[m.category] = (catCounts[m.category] || 0) + 1; });
    const topCatId = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'spirituality';
    const topCat = getCategoryMeta(topCatId);
    return { total, days, topCat };
  }, [milestones, joinedDate]);

  const cardBg = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.05)';
  const borderColor = isLight ? 'rgba(139,100,42,0.15)' : 'rgba(255,255,255,0.07)';

  return (
    <View style={[sh.statsRow, { backgroundColor: cardBg, borderColor }]}>
      {[
        { label: 'Dni podróży', value: stats.days, emoji: '📅' },
        { label: 'Kamienie', value: stats.total, emoji: '🗺️' },
        { label: 'Dominanta', value: stats.topCat.emoji, emoji: '' },
      ].map((s, idx) => (
        <View key={s.label + idx} style={[sh.statItem, idx < 2 && { borderRightWidth: 1, borderRightColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }]}>
          <Text style={{ color: textColor, fontSize: 22, fontWeight: '800' }}>
            {s.emoji}{s.value}
          </Text>
          <Text style={{ color: subColor, fontSize: 11, marginTop: 2 }}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const SoulJourneyMapScreen = ({ navigation }) => {
  const { currentTheme: theme, isLight } = useTheme();
  // Always dark/cosmic — premium adult design
  const { t } = useTranslation();
  const { currentUser } = useAuthStore();
  const userData = useAppStore(s => s.userData);

  const textColor = isLight ? '#1C1612' : '#F5F1EA';
  const subColor = isLight ? '#6B5E4E' : 'rgba(245,241,234,0.55)';

  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'community'
  const [myMilestones, setMyMilestones] = useState([]);
  const [communityMilestones, setCommunityMilestones] = useState(SEED_MILESTONES);
  const [showAdd, setShowAdd] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [currentChapter, setCurrentChapter] = useState('Rozdział 1: Przebudzenie');
  const [chapterInput, setChapterInput] = useState('');
  const [editingChapter, setEditingChapter] = useState(false);

  const uid = currentUser?.uid;

  // Load my milestones from Firebase
  useEffect(() => {
    if (!uid) return;
    try {
      const q = query(
        collection(db, 'soulJourneys', uid, 'milestones'),
        orderBy('date', 'desc'),
        limit(50),
      );
      const unsub = onSnapshot(q, snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMyMilestones(data);
      }, () => {});
      return () => unsub();
    } catch {}
  }, [uid]);

  // Load community public milestones
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'communityMilestones'),
        where('isPublic', '==', true),
        orderBy('date', 'desc'),
        limit(30),
      );
      const unsub = onSnapshot(q, snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (data.length > 0) setCommunityMilestones(data);
      }, () => {});
      return () => unsub();
    } catch {}
  }, []);

  // Load journey doc (chapter info)
  useEffect(() => {
    if (!uid) return;
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'soulJourneys', uid));
        if (snap.exists()) {
          setCurrentChapter(snap.data().currentChapter || 'Rozdział 1: Przebudzenie');
        }
      } catch {}
    };
    fetch();
  }, [uid]);

  const handleAddMilestone = useCallback(async ({ title, description, category, isPublic }) => {
    setShowAdd(false);
    HapticsService.impact('medium');
    const now = new Date().toISOString();
    const milestoneData = {
      userId: uid || 'anon',
      displayName: currentUser?.displayName || userData?.name || 'Dusza',
      emoji: userData?.archetype?.emoji || '🌟',
      title, description, category,
      date: now, isPublic,
      reactions: { '💫': 0, '💗': 0, '🌟': 0 },
    };
    try {
      if (uid) {
        await addDoc(collection(db, 'soulJourneys', uid, 'milestones'), milestoneData);
        if (isPublic) {
          await addDoc(collection(db, 'communityMilestones'), milestoneData);
        }
      } else {
        setMyMilestones(prev => [{ id: Date.now().toString(), ...milestoneData }, ...prev]);
      }
    } catch {
      Alert.alert(t('soulJourneyMap.blad', 'Błąd'), t('soulJourneyMap.nie_udalo_sie_zapisac_kamienia', 'Nie udało się zapisać kamienia milowego.'));
    }
  }, [uid, currentUser, userData]);

  const handleReact = useCallback(async (milestoneId, emoji) => {
    HapticsService.impact('medium');
    setCommunityMilestones(prev => prev.map(m => {
      if (m.id !== milestoneId) return m;
      return { ...m, reactions: { ...m.reactions, [emoji]: ((m.reactions?.[emoji]) || 0) + 1 } };
    }));
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'communityMilestones', milestoneId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const cur = snap.data().reactions?.[emoji] || 0;
        tx.update(ref, { [`reactions.${emoji}`]: cur + 1 });
      });
    } catch {}
  }, []);

  const handleSaveChapter = useCallback(async () => {
    const name = chapterInput.trim();
    if (!name) return;
    setCurrentChapter(name);
    setEditingChapter(false);
    setChapterInput('');
    if (uid) {
      try {
        await setDoc(doc(db, 'soulJourneys', uid), { currentChapter: name }, { merge: true });
      } catch {}
    }
  }, [chapterInput, uid]);

  const filteredCommunity = useMemo(() => {
    if (filterCat === 'all') return communityMilestones;
    return communityMilestones.filter(m => m.category === filterCat);
  }, [filterCat, communityMilestones]);

  const cardBg = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.05)';
  const borderColor = isLight ? 'rgba(139,100,42,0.15)' : 'rgba(255,255,255,0.08)';

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <LinearGradient
          colors={isLight
            ? ['rgba(139,92,246,0.06)', 'transparent']
            : ['rgba(139,92,246,0.14)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* Header */}
        <View style={[sh.header, { borderBottomColor: isLight ? 'rgba(139,100,42,0.12)' : 'rgba(255,255,255,0.07)' }]}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Social')} style={sh.backBtn}>
            <ChevronLeft size={22} color={textColor} strokeWidth={2} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[sh.headerTitle, { color: textColor }]}>{t('soulJourneyMap.mapa_duszy', '🗺️ Mapa Duszy')}</Text>
            <Text style={{ color: subColor, fontSize: 12 }}>{t('soulJourneyMap.twoja_duchowa_podroz', 'Twoja duchowa podróż')}</Text>
          </View>
          <Pressable onPress={() => setShowAdd(true)} style={[sh.fabSmall, { backgroundColor: ACCENT }]}>
            <Plus size={18} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Tab bar */}
        <View style={[sh.tabRow, { borderBottomColor: isLight ? 'rgba(139,100,42,0.10)' : 'rgba(255,255,255,0.06)' }]}>
          {[
            { key: 'my', label: 'Moja Podróż', emoji: '🗺️' },
            { key: 'community', label: 'Wspólnota', emoji: '🌐' },
          ].map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[sh.tabItem, activeTab === tab.key && { borderBottomColor: ACCENT, borderBottomWidth: 2 }]}
            >
              <Text style={{ fontSize: 15 }}>{tab.emoji}</Text>
              <Text style={{
                color: activeTab === tab.key ? ACCENT : subColor,
                fontSize: 14, fontWeight: activeTab === tab.key ? '700' : '500', marginLeft: 6,
              }}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SP, paddingBottom: 100 }}
        >
          {activeTab === 'my' ? (
            <>
              {/* Current Chapter Banner */}
              <Animated.View entering={FadeInDown.duration(400)} style={{ marginTop: 16, marginBottom: 12 }}>
                <LinearGradient
                  colors={CHAPTER_GRADIENTS[0]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={sh.chapterBanner}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 3 }}>
                      {t('soulJourneyMap.aktywny_rozdzial', 'AKTYWNY ROZDZIAŁ')}
                    </Text>
                    {editingChapter ? (
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <TextInput
                          value={chapterInput}
                          onChangeText={setChapterInput}
                          placeholder={t('soulJourneyMap.nazwa_rozdzialu', 'Nazwa rozdziału...')}
                          placeholderTextColor="rgba(255,255,255,0.5)"
                          style={[sh.chapterInput]}
                          autoFocus
                          onSubmitEditing={handleSaveChapter}
                        />
                        <Pressable onPress={handleSaveChapter} style={sh.checkBtn}>
                          <Check size={16} color="#fff" strokeWidth={2.5} />
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable onPress={() => { setChapterInput(currentChapter); setEditingChapter(true); }}>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{currentChapter}</Text>
                      </Pressable>
                    )}
                  </View>
                  <Text style={{ fontSize: 36 }}>📖</Text>
                </LinearGradient>
              </Animated.View>

              {/* Stats */}
              <JourneyStats
                milestones={myMilestones}
                joinedDate={currentUser?.metadata?.creationTime}
                textColor={textColor}
                subColor={subColor}
                isLight={isLight}
              />

              {/* Timeline */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 14 }}>
                <MapPin size={14} color={ACCENT} strokeWidth={2} />
                <Text style={{ color: textColor, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>
                  {t('soulJourneyMap.kamienie_milowe', 'KAMIENIE MILOWE')}
                </Text>
                <View style={{ flex: 1 }} />
                <Text style={{ color: subColor, fontSize: 12 }}>{myMilestones.length} łącznie</Text>
              </View>

              {myMilestones.length === 0 ? (
                <View style={sh.emptyState}>
                  <Text style={{ fontSize: 52, marginBottom: 14 }}>🗺️</Text>
                  <Text style={{ color: textColor, fontSize: 17, fontWeight: '700', marginBottom: 8 }}>
                    {t('soulJourneyMap.twoja_mapa_czeka', 'Twoja mapa czeka')}
                  </Text>
                  <Text style={{ color: subColor, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                    {t('soulJourneyMap.dodaj_pierwszy_kamien_milowy_moment', 'Dodaj pierwszy kamień milowy — moment przebudzenia, uzdrowienia lub transformacji.')}
                  </Text>
                  <Pressable onPress={() => setShowAdd(true)} style={[sh.fabSmall, { backgroundColor: ACCENT, marginTop: 18, paddingHorizontal: 20, width: 'auto', height: 'auto', paddingVertical: 10, borderRadius: 16 }]}>
                    <Plus size={16} color="#fff" strokeWidth={2.5} />
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 6 }}>{t('soulJourneyMap.dodaj_kamien', 'Dodaj Kamień')}</Text>
                  </Pressable>
                </View>
              ) : (
                myMilestones.map((m, idx) => (
                  <MilestoneCard
                    key={m.id + '_' + idx}
                    milestone={m}
                    isLast={idx === myMilestones.length - 1}
                    textColor={textColor}
                    subColor={subColor}
                    isLight={isLight}
                  />
                ))
              )}
            </>
          ) : (
            <>
              {/* Category filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14, marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
                <Pressable
                  onPress={() => setFilterCat('all')}
                  style={[sh.catPill, {
                    backgroundColor: filterCat === 'all' ? ACCENT + '25' : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)'),
                    borderColor: filterCat === 'all' ? ACCENT : (isLight ? 'rgba(139,100,42,0.15)' : 'rgba(255,255,255,0.08)'),
                  }]}
                >
                  <Text style={{ fontSize: 14 }}>🌐</Text>
                  <Text style={{ color: filterCat === 'all' ? ACCENT : subColor, fontSize: 12, fontWeight: '600' }}>{t('soulJourneyMap.wszystkie', 'Wszystkie')}</Text>
                </Pressable>
                {MILESTONE_CATEGORIES.map(cat => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setFilterCat(cat.id)}
                    style={[sh.catPill, {
                      backgroundColor: filterCat === cat.id ? cat.color + '25' : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)'),
                      borderColor: filterCat === cat.id ? cat.color : (isLight ? 'rgba(139,100,42,0.15)' : 'rgba(255,255,255,0.08)'),
                    }]}
                  >
                    <Text style={{ fontSize: 13 }}>{cat.emoji}</Text>
                    <Text style={{ color: filterCat === cat.id ? cat.color : subColor, fontSize: 12, fontWeight: '600' }}>{cat.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {filteredCommunity.length === 0 ? (
                <View style={sh.emptyState}>
                  <Text style={{ fontSize: 48, marginBottom: 14 }}>🌐</Text>
                  <Text style={{ color: textColor, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>{t('soulJourneyMap.brak_publicznyc_kamieni', 'Brak publicznych kamieni')}</Text>
                  <Text style={{ color: subColor, fontSize: 13, textAlign: 'center' }}>{t('soulJourneyMap.badz_pierwszya_podziel_sie_swoja', 'Bądź pierwszy/a — podziel się swoją chwilą przełomu.')}</Text>
                </View>
              ) : (
                filteredCommunity.map((m, idx) => (
                  <CommunityMilestoneCard
                    key={m.id + '_' + idx}
                    milestone={m}
                    textColor={textColor}
                    subColor={subColor}
                    isLight={isLight}
                    currentUserId={uid}
                    onReact={handleReact}
                    index={idx}
                  />
                ))
              )}
            </>
          )}
          <EndOfContentSpacer size="standard" />
        </ScrollView>

        {/* FAB */}
        <Pressable
          onPress={() => setShowAdd(true)}
          style={[sh.fab, { backgroundColor: ACCENT }]}
        >
          <Plus size={24} color="#fff" strokeWidth={2.5} />
        </Pressable>

        <AddMilestoneModal
          visible={showAdd}
          onClose={() => setShowAdd(false)}
          onSubmit={handleAddMilestone}
          textColor={textColor}
          subColor={subColor}
          isLight={isLight}
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
  fabSmall: {
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row',
  },
  fab: {
    position: 'absolute', bottom: 24, right: 22,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  tabRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, paddingBottom: 10,
  },
  chapterBanner: {
    borderRadius: 18, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  chapterInput: {
    flex: 1, color: '#fff', fontSize: 15, fontWeight: '700',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.5)', paddingBottom: 3,
  },
  checkBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row', borderRadius: 16, borderWidth: 1,
    marginBottom: 4, overflow: 'hidden',
  },
  statItem: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
  },
  milestoneCard: {
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  catBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
  },
  reactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1,
  },
  emptyState: {
    alignItems: 'center', paddingVertical: 56, paddingHorizontal: 32,
  },
  modalSheet: {
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
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
  fieldLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.8, marginBottom: 8 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1,
  },
  modalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 14, borderWidth: 1,
  },
});
