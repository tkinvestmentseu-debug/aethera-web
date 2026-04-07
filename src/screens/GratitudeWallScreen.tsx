// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { ChevronLeft, Heart, Send } from 'lucide-react-native';
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
} from 'firebase/firestore';
import { db } from '../core/config/firebase.config';

const { width: SW } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'milosc', label: 'Miłość', emoji: '💖' },
  { id: 'natura', label: 'Natura', emoji: '🌿' },
  { id: 'ludzie', label: 'Ludzie', emoji: '🤝' },
  { id: 'moment', label: 'Chwila', emoji: '✨' },
  { id: 'zmiana', label: 'Zmiana', emoji: '🦋' },
];

function timeAgo(ts: any): string {
  if (!ts) return 'przed chwilą';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'przed chwilą';
  if (diff < 3600) return `${Math.floor(diff / 60)} min temu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} godz. temu`;
  return `${Math.floor(diff / 86400)} dni temu`;
}

export const GratitudeWallScreen = ({ navigation }) => {
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
  const [selectedCat, setSelectedCat] = useState('milosc');
  const [isAnon, setIsAnon] = useState(false);
  const [sending, setSending] = useState(false);
  const [likedIds, setLikedIds] = useState<string[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'gratitudePosts'),
      orderBy('createdAt', 'desc'),
      limit(40)
    );
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.warn('GratitudeWall snapshot error:', err));
    return () => unsub();
  }, []);

  const handlePost = useCallback(async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    HapticsService.impact('medium');
    try {
      await addDoc(collection(db, 'gratitudePosts'), {
        text: text.trim(),
        category: selectedCat,
        authorId: currentUser?.uid || 'anon',
        authorName: isAnon ? null : (currentUser?.displayName || t('gratitudeWall.anonSoul', 'Anonimowa dusza')),
        isAnon,
        hearts: 0,
        createdAt: serverTimestamp(),
      });
      setText('');
    } catch (e) {
      console.warn('GratitudeWall post error:', e);
    } finally {
      setSending(false);
    }
  }, [text, selectedCat, isAnon, sending, currentUser]);

  const handleHeart = useCallback(async (postId: string) => {
    if (likedIds.includes(postId)) return;
    HapticsService.notify();
    setLikedIds(prev => [...prev, postId]);
    try {
      const ref = doc(db, 'gratitudePosts', postId);
      await runTransaction(db, async tx => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        tx.update(ref, { hearts: (snap.data().hearts || 0) + 1 });
      });
    } catch (e) {
      console.warn('GratitudeWall heart error:', e);
      setLikedIds(prev => prev.filter(id => id !== postId));
    }
  }, [likedIds]);

  const catObj = CATEGORIES.find(c => c.id === selectedCat) || CATEGORIES[0];

  const renderHeader = () => (
    <View style={styles.formContainer}>
      {/* Category pills */}
      <View style={styles.catRow}>
        {CATEGORIES.map(cat => {
          const active = cat.id === selectedCat;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCat(cat.id)}
              style={[
                styles.catPill,
                {
                  backgroundColor: active
                    ? 'rgba(139,92,246,0.25)'
                    : isLight ? 'rgba(139,100,42,0.08)' : 'rgba(255,255,255,0.07)',
                  borderColor: active
                    ? '#8B5CF6'
                    : isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.12)',
                },
              ]}
            >
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={[styles.catLabel, { color: active ? '#C4B5FD' : sc }]}>{t(`gratitudeWall.cat_${cat.id}`, cat.label)}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Text input */}
      <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: cardBorder }]}>
        <TextInput
          value={text}
          onChangeText={v => setText(v.slice(0, 140))}
          placeholder={t('gratitudeWall.placeholder', 'Za co jesteś dziś wdzięczny?') + ' ' + catObj.emoji}
          placeholderTextColor={sc}
          multiline
          style={[styles.input, { color: tc }]}
        />
        <Text style={[styles.charCount, { color: sc }]}>{text.length}/140</Text>
      </View>

      {/* Anon toggle + send */}
      <View style={styles.formFooter}>
        <View style={styles.anonRow}>
          <Text style={[styles.anonLabel, { color: sc }]}>{t('gratitudeWall.anonLabel', 'Anonimowo')}</Text>
          <Switch
            value={isAnon}
            onValueChange={setIsAnon}
            trackColor={{ false: 'rgba(139,92,246,0.3)', true: '#8B5CF6' }}
            thumbColor={isAnon ? '#C4B5FD' : '#E5E7EB'}
          />
        </View>
        <Pressable
          onPress={handlePost}
          disabled={!text.trim() || sending}
          style={[
            styles.sendBtn,
            { opacity: !text.trim() || sending ? 0.45 : 1 },
          ]}
        >
          <LinearGradient
            colors={['#8B5CF6', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sendBtnGrad}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <><Send size={15} color="#fff" /><Text style={styles.sendBtnText}>{t('gratitudeWall.sendBtn', 'Wyślij')}</Text></>
            }
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );

  const renderItem = ({ item, index }) => {
    const cat = CATEGORIES.find(c => c.id === item.category);
    const liked = likedIds.includes(item.id);
    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(400)}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeEmoji}>{cat?.emoji || '✨'}</Text>
              <Text style={[styles.catBadgeLabel, { color: '#A78BFA' }]}>{cat ? t(`gratitudeWall.cat_${cat.id}`, cat.label) : ''}</Text>
            </View>
            <Text style={[styles.timeText, { color: sc }]}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={[styles.cardText, { color: tc }]}>{item.text}</Text>
          <View style={styles.cardFooter}>
            <Text style={[styles.authorText, { color: sc }]}>
              — {item.isAnon || !item.authorName ? t('gratitudeWall.anonSoul', 'Anonimowa dusza') : item.authorName}
            </Text>
            <Pressable
              onPress={() => handleHeart(item.id)}
              style={[styles.heartBtn, liked && styles.heartBtnActive]}
            >
              <Heart size={14} color={liked ? '#F87171' : sc} fill={liked ? '#F87171' : 'none'} />
              <Text style={[styles.heartCount, { color: liked ? '#F87171' : sc }]}>
                {item.hearts || 0}
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <Animated.View entering={ZoomIn.duration(500)} style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>✨</Text>
      <Text style={[styles.emptyText, { color: sc }]}>
        {t('gratitudeWall.emptyState', 'Bądź pierwszą osobą która podzieli się wdzięcznością')}
      </Text>
    </Animated.View>
  );

  return (
    <LinearGradient
      colors={isLight ? ['#FDF6EE', '#F5EFE6'] : ['#0C0818', '#120920', '#0C0818']}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={tc} />
          </Pressable>
          <View style={styles.headerTitles}>
            <Text style={[styles.headerTitle, { color: tc }]}>{t('gratitudeWall.title', 'Tablica Wdzięczności')}</Text>
            <Text style={[styles.headerSub, { color: sc }]}>{t('gratitudeWall.subtitle', 'Podziel się wdzięcznością ze wspólnotą')}</Text>
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
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: '600' },
  inputWrap: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    minHeight: 80,
  },
  input: { fontSize: 15, lineHeight: 22, minHeight: 60 },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 6 },
  formFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  anonLabel: { fontSize: 13 },
  sendBtn: { borderRadius: 22 },
  sendBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
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
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  catBadgeEmoji: { fontSize: 14 },
  catBadgeLabel: { fontSize: 12, fontWeight: '600' },
  timeText: { fontSize: 11 },
  cardText: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorText: { fontSize: 12, fontStyle: 'italic' },
  heartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(248,113,113,0.08)',
  },
  heartBtnActive: { backgroundColor: 'rgba(248,113,113,0.16)' },
  heartCount: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
