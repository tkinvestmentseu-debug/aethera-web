// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dimensions, Image, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View, Share,
} from 'react-native';
import { RIDER_WAITE_IMAGE_MAP } from '../features/tarot/data/riderWaiteImages';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Star as SvgStar } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, FadeInDown, interpolate,
} from 'react-native-reanimated';
import {
  ChevronLeft, Star, Sparkles, Heart, MessageCircle, Send, Info, X,
  Share2, Edit2,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
import { collection, addDoc, onSnapshot, query, orderBy, limit, doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../core/config/firebase.config';
import { useAuthStore } from '../store/useAuthStore';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#F59E0B';

const CARD_NAMES = ['Mag','Kapłanka','Cesarzowa','Cesarz','Papież','Kochankowie','Rydwan','Siła','Pustelnik','Koło Fortuny','Sprawiedliwość','Wisielec','Śmierć','Umiarkowanie','Diabeł','Wieża','Gwiazda','Księżyc','Słońce','Sąd','Świat','Głupiec'];

const INITIAL_INTERPRETATIONS = [
  { id: '1', author: '🌙', name: 'Marzena K.', text: 'Ta karta przynosi wieść o odrodzeniu — zaufaj procesowi i pozwól gwiazdom prowadzić.', likes: 47, time: '2h temu', reactions: { '💛': 12, '✨': 8, '🌸': 5 } },
  { id: '2', author: '☀️', name: 'Tomasz W.', text: 'Gwiazda mówi nam: nadzieja nie jest słabością. To odwaga widzenia piękna nawet w trudnych chwilach.', likes: 31, time: '3h temu', reactions: { '💛': 7, '✨': 14, '🌸': 3 } },
  { id: '3', author: '🌸', name: 'Agnieszka P.', text: 'Yin energia tej karty zaprasza do introspekcji. Przyjmij wodę jako symbol oczyszczenia.', likes: 28, time: '5h temu', reactions: { '💛': 9, '✨': 4, '🌸': 11 } },
  { id: '4', author: '🦋', name: 'Radek M.', text: 'XVII Gwiazda po Wieży oznacza, że po każdym rozpadzie przychodzi świt nowego rozdziału.', likes: 19, time: '7h temu', reactions: { '💛': 3, '✨': 6, '🌸': 2 } },
  { id: '5', author: '🔮', name: 'Hanna S.', text: 'Gwiazda zaprasza do pracy z wodą — rytuał kąpieli lub medytacja przy wodzie będą teraz szczególnie mocne.', likes: 14, time: '9h temu', reactions: { '💛': 5, '✨': 2, '🌸': 7 } },
];

const PAST_CARDS = [
  { id: 'p1', name: 'Księżyc', num: 'XVIII', color: '#818CF8' },
  { id: 'p2', name: 'Siła', num: 'XI', color: '#F97316' },
  { id: 'p3', name: 'Kochan.', num: 'VI', color: '#EC4899' },
  { id: 'p4', name: 'Hermit', num: 'IX', color: '#10B981' },
  { id: 'p5', name: 'Koło', num: 'X', color: '#6366F1' },
];

const FILTER_OPTIONS = ['Wszystkie', 'Najbardziej rezonujące', 'Najnowsze'];

export const CommunityTarotScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { currentTheme, isLight } = useTheme();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore(s => s.currentUser);
  const textColor = isLight ? '#1A1A0A' : '#FFF9EC';
  const subColor = isLight ? 'rgba(26,26,10,0.55)' : 'rgba(255,249,236,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.07)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.10)';

  const [flipped, setFlipped] = useState(false);
  const [interpretations, setInterpretations] = useState(INITIAL_INTERPRETATIONS);
  const [inputText, setInputText] = useState('');
  const [reactions, setReactions] = useState({ heart: 891, star: 654, flower: 796 });
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [aiExplanation, setAiExplanation] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Wszystkie');
  const [myInterpretationId, setMyInterpretationId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const todayCardIdx = useMemo(() => {
    const d = new Date();
    return (d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()) % 22;
  }, []);

  const flipValue = useSharedValue(0);
  const glowPulse = useSharedValue(0.7);

  useEffect(() => {
    glowPulse.value = withRepeat(withSequence(withTiming(1, { duration: 2000 }), withTiming(0.7, { duration: 2000 })), -1, false);
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(15),
    );
    const unsub = onSnapshot(q, (snap) => {
      const tarotPosts = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.type === 'TAROT');
      if (tarotPosts.length > 0) {
        setInterpretations(tarotPosts.map(p => ({
          id: p.id,
          author: p.authorEmoji ?? '✦',
          name: p.authorName,
          text: p.content,
          likes: (p.reactions?.resonuje ?? 0) + (p.reactions?.prawda ?? 0),
          time: (() => {
            const diff = Date.now() - (p.createdAt instanceof Timestamp ? p.createdAt.toMillis() : Date.now());
            const min = Math.floor(diff / 60000);
            if (min < 1) return 'teraz';
            if (min < 60) return `${min} min temu`;
            return `${Math.floor(min / 60)}h temu`;
          })(),
          reactions: { '💛': p.reactions?.resonuje ?? 0, '✨': p.reactions?.prawda ?? 0, '🌸': p.reactions?.czuje ?? 0 },
        })));
      }
    }, () => {});
    return () => unsub();
  }, []);

  const cardFrontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${interpolate(flipValue.value, [0, 1], [0, 180])}deg` }],
    backfaceVisibility: 'hidden',
  }));
  const cardBackStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${interpolate(flipValue.value, [0, 1], [180, 360])}deg` }],
    backfaceVisibility: 'hidden',
    position: 'absolute',
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowPulse.value }));

  const handleFlip = () => {
    HapticsService.impact();
    flipValue.value = withSpring(flipped ? 0 : 1, { damping: 15 });
    setFlipped(!flipped);
  };

  const submitInterpretation = () => {
    if (inputText.trim().length < 2) return;
    HapticsService.impact();
    const newId = Date.now().toString();
    setInterpretations(prev => [{
      id: newId, author: '✨', name: 'Ty',
      text: inputText.trim(), likes: 0, time: 'teraz',
      reactions: { '💛': 0, '✨': 0, '🌸': 0 },
    }, ...prev]);
    setMyInterpretationId(newId);
    if (currentUser && inputText.trim()) {
      addDoc(collection(db, 'posts'), {
        type: 'TAROT',
        content: inputText.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        authorEmoji: currentUser.avatarEmoji ?? '✦',
        authorZodiac: '',
        reactions: { resonuje: 0, prawda: 0, czuje: 0 },
        commentCount: 0,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    }
    setInputText('');
  };

  const toggleLike = (id: string) => {
    HapticsService.impact();
    setLikedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setInterpretations(prev => prev.map(it => it.id === id
      ? { ...it, likes: likedIds.includes(id) ? it.likes - 1 : it.likes + 1 }
      : it
    ));
    if (!likedIds.includes(id)) {
      const ref = doc(db, 'posts', id);
      runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists()) {
          const r = snap.data().reactions ?? {};
          tx.update(ref, { 'reactions.resonuje': (r.resonuje ?? 0) + 1 });
        }
      }).catch(() => {});
    }
  };

  const addReaction = (key: 'heart' | 'star' | 'flower') => {
    HapticsService.impact();
    setReactions(prev => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const addInterpretationReaction = (id: string, emoji: string) => {
    HapticsService.impact();
    setInterpretations(prev => prev.map(it =>
      it.id === id ? { ...it, reactions: { ...it.reactions, [emoji]: (it.reactions[emoji] || 0) + 1 } } : it
    ));
  };

  const handleShare = async (text: string) => {
    try {
      await Share.share({ message: `"${text}" — Tarot Wspólnoty Aethera` });
    } catch {}
  };

  const handleEditSave = (id: string) => {
    if (editText.trim().length < 2) return;
    setInterpretations(prev => prev.map(it =>
      it.id === id ? { ...it, text: editText.trim() } : it
    ));
    setEditingId(null);
    setEditText('');
  };

  const loadAiExplanation = async () => {
    setLoadingAi(true);
    HapticsService.impact();
    try {
      const res = await AiService.chatWithOracle([
        { role: 'user', content: 'Wyjaśnij krótko (2-3 zdania) dlaczego karta Gwiazda XVII pojawia się dziś jako karta dnia dla globalnej społeczności duchowej. Odpowiedz w języku użytkownika.' }
      ]);
      setAiExplanation(res);
    } catch {
      setAiExplanation('Gwiazda XVII pojawia się dziś, by przypomnieć nam o wrodzonej nadziei i odnowieniu. Zbiorowa energia wspólnoty potrzebuje teraz powrotu do ufności w wyższy plan wszechświata.');
    }
    setLoadingAi(false);
  };

  const filteredInterpretations = [...interpretations].sort((a, b) => {
    if (activeFilter === 'Najbardziej rezonujące') return b.likes - a.likes;
    if (activeFilter === 'Najnowsze') return a.time === 'teraz' ? -1 : 1;
    return 0;
  });

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={[styles.safe, {}]} edges={['top']}>

      <LinearGradient
        colors={isLight ? ['#FFFBEB', '#FEF3C7', currentTheme.background] : ['#12090A', '#1A0E05', currentTheme.background]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('communityTarot.tarot_wspolnoty', 'Tarot Wspólnoty')}</Text>
        <Star size={20} color={ACCENT} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.scroll}
        >

          {/* Hero Card */}
          <View style={styles.heroSection}>
            <Animated.View style={glowStyle}>
              <View style={[styles.glowRing, { borderColor: ACCENT + '40' }]} />
            </Animated.View>
            <Pressable onPress={handleFlip} style={styles.cardWrapper}>
              <Animated.View style={[styles.tarotCard, { borderColor: ACCENT + '50' }, cardFrontStyle]}>
                <Image
                  source={RIDER_WAITE_IMAGE_MAP[String(todayCardIdx)]}
                  style={{ width: '100%', height: '100%', borderRadius: 14 }}
                  resizeMode="cover"
                />
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, backgroundColor: 'rgba(0,0,0,0.45)' }}>
                  <Text style={[styles.cardName, { color: '#FFF' }]}>{CARD_NAMES[todayCardIdx]}</Text>
                  <Text style={[styles.cardHint, { color: 'rgba(255,255,255,0.7)' }]}>{t('communityTarot.dotknij_by_obrocic', 'Dotknij, by obrócić')}</Text>
                </View>
              </Animated.View>
              <Animated.View style={[styles.tarotCard, { backgroundColor: ACCENT + '25', borderColor: ACCENT + '70', alignItems: 'center', justifyContent: 'center' }, cardBackStyle]}>
                <Text style={[styles.cardMeaning, { color: textColor }]}>{t('communityTarot.nadzieja_odnowienie_wiara_w_przyszl', 'Nadzieja · Odnowienie · Wiara w przyszłość')}</Text>
              </Animated.View>
            </Pressable>
          </View>

          {/* Tags */}
          <View style={styles.tagRow}>
            {['NADZIEJA', 'ODNOWIENIE', 'KIERUNEK'].map(t => (
              <View key={t} style={[styles.tag, { backgroundColor: ACCENT + '20', borderColor: ACCENT + '40' }]}>
                <Text style={[styles.tagText, { color: ACCENT }]}>{t}</Text>
              </View>
            ))}
          </View>

          {/* Stats */}
          <Text style={[styles.cardStats, { color: subColor }]}>{t('communityTarot.127_interpreta_energia_yin_3', '127 interpretacji · energia Yin · 3 841 odczytań')}</Text>

          {/* Reactions */}
          <View style={[styles.reactionRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {([['💛', 'heart'], ['✨', 'star'], ['🌸', 'flower']] as const).map(([emoji, key]) => (
              <Pressable key={key} onPress={() => addReaction(key)} style={styles.reactionBtn}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={[styles.reactionCount, { color: textColor }]}>{reactions[key]}</Text>
              </Pressable>
            ))}
          </View>

          {/* AI Explanation */}
          <Pressable onPress={loadAiExplanation} style={[styles.aiBtn, { borderColor: ACCENT + '50' }]}>
            <Info size={14} color={ACCENT} />
            <Text style={[styles.aiBtnText, { color: ACCENT }]}>{loadingAi ? 'Analizuję...' : 'Dlaczego ta karta?'}</Text>
          </Pressable>
          {!!aiExplanation && (
            <Animated.View entering={FadeInDown} style={[styles.aiCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Text style={[styles.aiText, { color: textColor, flex: 1 }]}>{aiExplanation}</Text>
                <Pressable onPress={() => setAiExplanation('')} style={{ padding: 2 }}>
                  <X size={16} color={subColor} />
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Filter chips */}
          <View style={styles.filterRow}>
            {FILTER_OPTIONS.map(opt => (
              <Pressable
                key={opt}
                onPress={() => setActiveFilter(opt)}
                style={[styles.filterChip, {
                  backgroundColor: activeFilter === opt ? ACCENT + '22' : cardBg,
                  borderColor: activeFilter === opt ? ACCENT + '60' : cardBorder,
                }]}
              >
                <Text style={[styles.filterChipText, { color: activeFilter === opt ? ACCENT : subColor }]}>{opt}</Text>
              </Pressable>
            ))}
          </View>

          {/* Interpretations */}
          <Text style={[styles.sectionTitle, { color: textColor }]}>{t('communityTarot.interpreta_wspolnoty', 'Interpretacje Wspólnoty')}</Text>
          {filteredInterpretations.map((item, i) => (
            <Animated.View key={item.id} entering={FadeInDown.delay(i * 60)} style={[styles.interpCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.interpHeader}>
                <Text style={styles.avatar}>{item.author}</Text>
                <Text style={[styles.interpName, { color: textColor }]}>{item.name}</Text>
                <Text style={[styles.interpTime, { color: subColor }]}>{item.time}</Text>
                {item.id === myInterpretationId && (
                  <Pressable onPress={() => { setEditingId(item.id); setEditText(item.text); }} style={{ padding: 4 }}>
                    <Edit2 size={14} color={ACCENT} />
                  </Pressable>
                )}
              </View>
              {editingId === item.id ? (
                <View style={{ gap: 8 }}>
                  <TextInput
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    style={[styles.interpInput, { color: textColor, borderColor: cardBorder }]}
                    autoFocus
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable onPress={() => handleEditSave(item.id)} style={[styles.editSaveBtn, { backgroundColor: ACCENT }]}>
                      <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>{t('communityTarot.zapisz', 'Zapisz')}</Text>
                    </Pressable>
                    <Pressable onPress={() => { setEditingId(null); setEditText(''); }} style={[styles.editSaveBtn, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
                      <Text style={{ color: subColor, fontSize: 12 }}>{t('communityTarot.anuluj', 'Anuluj')}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Text style={[styles.interpText, { color: textColor }]}>{item.text}</Text>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
                <Pressable onPress={() => toggleLike(item.id)} style={styles.likeRow}>
                  <Heart size={14} color={likedIds.includes(item.id) ? '#EC4899' : subColor} fill={likedIds.includes(item.id) ? '#EC4899' : 'none'} />
                  <Text style={[styles.likeCount, { color: subColor }]}> {item.likes}</Text>
                </Pressable>
                {/* Per-interpretation emoji reactions */}
                {(['💛', '✨', '🌸'] as const).map(emoji => (
                  <Pressable key={emoji} onPress={() => addInterpretationReaction(item.id, emoji)} style={styles.miniReactionBtn}>
                    <Text style={{ fontSize: 13 }}>{emoji}</Text>
                    <Text style={[{ fontSize: 11, color: subColor }]}>{item.reactions?.[emoji] ?? 0}</Text>
                  </Pressable>
                ))}
                <Pressable onPress={() => handleShare(item.text)} style={{ marginLeft: 'auto', padding: 4 }}>
                  <Share2 size={14} color={subColor} />
                </Pressable>
              </View>
            </Animated.View>
          ))}

          {/* Submit */}
          <View style={[styles.submitCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('communityTarot.dodaj_swoja_interpreta', 'Dodaj swoją interpretację...')}
              placeholderTextColor={subColor}
              multiline
              onSubmitEditing={() => { if (inputText.trim().length >= 2) submitInterpretation(); }}
              style={[styles.interpInput, { color: textColor, borderColor: cardBorder }]}
            />
            <Pressable onPress={submitInterpretation} style={[styles.sendBtn, { backgroundColor: ACCENT }]}>
              <Send size={16} color="#FFF" />
            </Pressable>
          </View>

          {/* Past Cards */}
          <Text style={[styles.sectionTitle, { color: textColor }]}>{t('communityTarot.poprzednie_karty_tygodnia', 'Poprzednie Karty Tygodnia')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pastRow} contentContainerStyle={{ gap: 10 }}>
            {PAST_CARDS.map(pc => (
              <View key={pc.id} style={[styles.pastCard, { backgroundColor: pc.color + '20', borderColor: pc.color + '50' }]}>
                <Text style={[styles.pastNum, { color: pc.color }]}>{pc.num}</Text>
                <Text style={[styles.pastName, { color: pc.color }]}>{pc.name}</Text>
              </View>
            ))}
          </ScrollView>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </KeyboardAvoidingView>
        </SafeAreaView>
</View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingVertical: 12, justifyContent: 'space-between' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  scroll: { paddingHorizontal: layout.padding.screen },
  heroSection: { alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 8 },
  glowRing: { position: 'absolute', width: 200, height: 280, borderRadius: 16, borderWidth: 20, opacity: 0.3 },
  cardWrapper: { zIndex: 2 },
  tarotCard: { width: 160, height: 240, borderRadius: 16, borderWidth: 2, overflow: 'hidden' },
  cardNum: { fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  cardName: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  cardMeaning: { fontSize: 13, textAlign: 'center', lineHeight: 20, padding: 12 },
  cardHint: { fontSize: 10, letterSpacing: 0.8 },
  tagRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8, marginBottom: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  tagText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  cardStats: { textAlign: 'center', fontSize: 12, marginBottom: 14 },
  reactionRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  reactionBtn: { alignItems: 'center', gap: 4 },
  reactionEmoji: { fontSize: 22 },
  reactionCount: { fontSize: 13, fontWeight: '600' },
  aiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingVertical: 9, marginBottom: 10 },
  aiBtnText: { fontSize: 13, fontWeight: '600' },
  aiCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  aiText: { fontSize: 13, lineHeight: 20 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  interpCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  interpHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  avatar: { fontSize: 20 },
  interpName: { fontSize: 13, fontWeight: '600', flex: 1 },
  interpTime: { fontSize: 11 },
  interpText: { fontSize: 13, lineHeight: 19 },
  likeRow: { flexDirection: 'row', alignItems: 'center' },
  likeCount: { fontSize: 12 },
  miniReactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  submitCard: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  interpInput: { flex: 1, fontSize: 13, lineHeight: 19, minHeight: 64, borderWidth: 1, borderRadius: 10, padding: 10 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  editSaveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  pastRow: { marginBottom: 12 },
  pastCard: { width: 76, height: 110, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 4 },
  pastNum: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  pastName: { fontSize: 10, fontWeight: '600' },
});
