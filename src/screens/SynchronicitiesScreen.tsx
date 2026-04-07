// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { ChevronLeft, Send, CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme, isLightBg } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { HapticsService } from '../core/services/haptics.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useAuthStore } from '../store/useAuthStore';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../core/config/firebase.config';

const { width: SW } = Dimensions.get('window');

const TAGS = [
  { id: 'liczby', label: 'Liczby', emoji: '🔢' },
  { id: 'widzenie', label: 'Widzenie', emoji: '👁' },
  { id: 'sen', label: 'Sen', emoji: '💭' },
  { id: 'znak', label: 'Znak', emoji: '🎯' },
  { id: 'przypadek', label: 'Przypadek', emoji: '🌀' },
];

const TAG_COLORS: Record<string, string> = {
  liczby: '#60A5FA',
  widzenie: '#A78BFA',
  sen: '#F472B6',
  znak: '#34D399',
  przypadek: '#FBBF24',
};

function timeAgo(ts: any, tFn?: (key: string, fallback: string) => string): string {
  const tr = tFn || ((_, fb) => fb);
  if (!ts) return tr('common.timeAgo.justNow', 'przed chwilą');
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return tr('common.timeAgo.justNow', 'przed chwilą');
  if (diff < 3600) return `${Math.floor(diff / 60)} ${tr('common.timeAgo.minAgo', 'min temu')}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${tr('common.timeAgo.hrAgo', 'godz. temu')}`;
  return `${Math.floor(diff / 86400)} ${tr('common.timeAgo.daysAgo', 'dni temu')}`;
}

export const SynchronicitiesScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const themeName = useAppStore(s => s.themeName);
  const theme = getResolvedTheme(themeName);
  const isLight = isLightBg(theme.background);
  const { currentUser } = useAuthStore();

  const tc = isLight ? '#1A1008' : '#F0ECE4';
  const sc = isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.18)' : 'rgba(255,255,255,0.10)';
  const inputBg = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)';

  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState('przypadek');
  const [sending, setSending] = useState(false);
  const [feltIds, setFeltIds] = useState<string[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'synchronicities'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.warn('Synchronicities snapshot error:', err));
    return () => unsub();
  }, []);

  const handlePost = useCallback(async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    HapticsService.impact('medium');
    try {
      await addDoc(collection(db, 'synchronicities'), {
        text: text.trim(),
        tag: selectedTag || 'przypadek',
        authorId: currentUser?.uid || 'anon',
        authorName: currentUser?.displayName || null,
        felt: 0,
        fulfilled: false,
        createdAt: serverTimestamp(),
      });
      setText('');
    } catch (e) {
      console.warn('Synchronicities post error:', e);
    } finally {
      setSending(false);
    }
  }, [text, selectedTag, sending, currentUser]);

  const handleFelt = useCallback(async (postId: string) => {
    if (feltIds.includes(postId)) return;
    HapticsService.notify();
    setFeltIds(prev => [...prev, postId]);
    try {
      const ref = doc(db, 'synchronicities', postId);
      await runTransaction(db, async tx => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        tx.update(ref, { felt: (snap.data().felt || 0) + 1 });
      });
    } catch (e) {
      console.warn('Synchronicities felt error:', e);
      setFeltIds(prev => prev.filter(id => id !== postId));
    }
  }, [feltIds]);

  const handleFulfilled = useCallback(async (postId: string) => {
    HapticsService.impact('medium');
    try {
      await updateDoc(doc(db, 'synchronicities', postId), { fulfilled: true });
    } catch (e) {
      console.warn('Synchronicities fulfilled error:', e);
    }
  }, []);

  const renderHeader = () => (
    <View style={styles.formContainer}>
      {/* Tag selector */}
      <View style={styles.tagRow}>
        {TAGS.map(tag => {
          const active = tag.id === selectedTag;
          const color = TAG_COLORS[tag.id] || '#8B5CF6';
          return (
            <Pressable
              key={tag.id}
              onPress={() => setSelectedTag(tag.id)}
              style={[
                styles.tagPill,
                {
                  backgroundColor: active
                    ? `${color}28`
                    : isLight ? 'rgba(139,100,42,0.07)' : 'rgba(255,255,255,0.06)',
                  borderColor: active
                    ? color
                    : isLight ? 'rgba(139,100,42,0.18)' : 'rgba(255,255,255,0.10)',
                },
              ]}
            >
              <Text style={styles.tagEmoji}>{tag.emoji}</Text>
              <Text style={[styles.tagLabel, { color: active ? color : sc }]}>{t(`synchronicities.tag_${tag.id}`, tag.label)}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Text input */}
      <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: cardBorder }]}>
        <TextInput
          value={text}
          onChangeText={t => setText(t.slice(0, 280))}
          placeholder={t('synchronicities.placeholder', 'Opisz synchroniczność którą doświadczyłeś...')}
          placeholderTextColor={sc}
          multiline
          style={[styles.input, { color: tc }]}
        />
        <Text style={[styles.charCount, { color: sc }]}>{text.length}/280</Text>
      </View>

      {/* Send button */}
      <Pressable
        onPress={handlePost}
        disabled={!text.trim() || sending}
        style={[styles.sendBtnWrap, { opacity: !text.trim() || sending ? 0.45 : 1 }]}
      >
        <LinearGradient
          colors={['#6D28D9', '#F59E0B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sendBtn}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <><Send size={15} color="#fff" /><Text style={styles.sendBtnText}>{t('synchronicities.shareBtn', 'Podziel się')}</Text></>
          }
        </LinearGradient>
      </Pressable>
    </View>
  );

  const renderItem = ({ item, index }) => {
    const tag = TAGS.find(t => t.id === item.tag) || TAGS[4];
    const tagColor = TAG_COLORS[item.tag] || '#8B5CF6';
    const felt = feltIds.includes(item.id);
    const isOwn = currentUser?.uid === item.authorId;

    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(400)}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: isOwn ? `${tagColor}55` : cardBorder,
              borderLeftColor: tagColor,
              borderLeftWidth: 3,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.tagBadge, { backgroundColor: `${tagColor}20`, borderColor: `${tagColor}40` }]}>
              <Text style={styles.tagBadgeEmoji}>{tag.emoji}</Text>
              <Text style={[styles.tagBadgeLabel, { color: tagColor }]}>{t(`synchronicities.tag_${tag.id}`, tag.label)}</Text>
            </View>
            <View style={styles.headerRight}>
              {item.fulfilled && (
                <View style={styles.fulfilledBadge}>
                  <CheckCircle size={12} color="#34D399" />
                  <Text style={styles.fulfilledText}>{t('synchronicities.fulfilled', 'Spełniło się')}</Text>
                </View>
              )}
              <Text style={[styles.timeText, { color: sc }]}>{timeAgo(item.createdAt, t)}</Text>
            </View>
          </View>

          <Text style={[styles.cardText, { color: tc }]}>{item.text}</Text>

          <View style={styles.cardFooter}>
            <Text style={[styles.authorText, { color: sc }]}>
              — {item.authorName || t('synchronicities.unknownSoul', 'Nieznana dusza')}
            </Text>
            <View style={styles.actions}>
              {isOwn && !item.fulfilled && (
                <Pressable onPress={() => handleFulfilled(item.id)} style={styles.fulfillBtn}>
                  <Text style={styles.fulfillBtnText}>{t('synchronicities.fulfillBtn', '✦ Spełniło się')}</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => handleFelt(item.id)}
                style={[styles.feltBtn, felt && styles.feltBtnActive]}
              >
                <Text style={styles.feltEmoji}>🌀</Text>
                <Text style={[styles.feltCount, { color: felt ? '#FBBF24' : sc }]}>
                  {item.felt || 0}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <Animated.View entering={ZoomIn.duration(500)} style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🌀</Text>
      <Text style={[styles.emptyText, { color: sc }]}>
        {t('synchronicities.emptyState', 'Podziel się synchronicznością którą ostatnio doświadczyłeś')}
      </Text>
    </Animated.View>
  );

  return (
    <LinearGradient
      colors={isLight ? ['#FDF6EE', '#EEF3FD'] : ['#080612', '#0A0E1E', '#080612']}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={tc} />
          </Pressable>
          <View style={styles.headerTitles}>
            <Text style={[styles.headerTitle, { color: tc }]}>{t('synchronicities.title', 'Synchroniczności')}</Text>
            <Text style={[styles.headerSub, { color: sc }]}>{t('synchronicities.subtitle', 'Znaczące zbieżności i znaki')}</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <FlatList
            data={posts}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.3 },
  headerSub: { fontSize: 12, marginTop: 2 },
  listContent: { paddingHorizontal: layout.padding.screen, paddingBottom: 40 },
  formContainer: { marginBottom: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagEmoji: { fontSize: 14 },
  tagLabel: { fontSize: 12, fontWeight: '600' },
  inputWrap: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    minHeight: 90,
  },
  input: { fontSize: 15, lineHeight: 22, minHeight: 70 },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 6 },
  sendBtnWrap: { alignSelf: 'flex-end', borderRadius: 22 },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 22,
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagBadgeEmoji: { fontSize: 12 },
  tagBadgeLabel: { fontSize: 11, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fulfilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  fulfilledText: { fontSize: 10, color: '#34D399', fontWeight: '700' },
  timeText: { fontSize: 11 },
  cardText: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorText: { fontSize: 12, fontStyle: 'italic', flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fulfillBtn: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fulfillBtnText: { fontSize: 11, color: '#F59E0B', fontWeight: '700' },
  feltBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.08)',
  },
  feltBtnActive: { backgroundColor: 'rgba(251,191,36,0.18)' },
  feltEmoji: { fontSize: 13 },
  feltCount: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
