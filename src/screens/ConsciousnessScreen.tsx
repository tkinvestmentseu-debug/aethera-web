// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import i18n from '../core/i18n';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Platform, Dimensions, Modal, KeyboardAvoidingView, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, FadeInDown, FadeIn,
} from 'react-native-reanimated';
import {
  ChevronLeft, Feather, Heart, MessageCircle, Share2,
  TrendingUp, Eye, Zap, Filter, Plus, X, Send,
} from 'lucide-react-native';
import { Svg, Circle, G, Rect, Defs } from 'react-native-svg';
import { AiService } from '../core/services/ai.service';
import { useTranslation } from 'react-i18next';
import { formatLocaleNumber } from '../core/utils/localeFormat';
import { useAppStore } from '../store/useAppStore';
import { FeedService, FeedPost } from '../core/services/community/feed.service';
import { useAuthStore } from '../store/useAuthStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#A78BFA';

const CATEGORIES = ['Wszystkie', 'Wizje', 'Sny', 'Znaki', 'Synchroniczności', 'Przemyślenia'];

const FEED_POSTS = [
  { id: 1, author: 'Luna M.', initials: 'LM', color: '#818CF8', category: 'Wizje', time: '5 min temu', likes: 47, comments: 12,
    content: 'Podczas medytacji zobaczyłam wielki ocean świadomości, gdzie każda fala to jedna myśl. Gdy przestałam walczyć z falami i po prostu na nich spoczęłam — nastała głęboka cisza. To była pierwsza chwila prawdziwego spokoju od miesięcy.' },
  { id: 2, author: 'Orion S.', initials: 'OS', color: '#34D399', category: 'Synchroniczności', time: '23 min temu', likes: 89, comments: 31,
    content: 'Trzeci raz w tym tygodniu widzę 11:11. Dzisiaj akurat w momencie, gdy myślałem o zmianie pracy. Może to znak, że pora działać? Wcześniej zignorowałem dwa poprzednie.' },
  { id: 3, author: 'Vera K.', initials: 'VK', color: '#F472B6', category: 'Przemyślenia', time: '1h temu', likes: 156, comments: 44,
    content: 'Odkrycie tygodnia: moje "problemy" to w 90% myśli, które interpretuję jako problemy. Sama rzeczywistość jest neutralna. To niesamowite, ile energii tracimy na narracje, które sami tworzymy.' },
  { id: 4, author: 'Ariel T.', initials: 'AT', color: '#FBBF24', category: 'Sny', time: '2h temu', likes: 63, comments: 18,
    content: 'Śniłam, że latam nad złotym miastem. Przewodnik powiedział mi: "Wysokość, na której latasz, odpowiada twojej odwadze w życiu na jawie." Po tym śnie zapisałam się na kurs, który odwlekałam od roku.' },
  { id: 5, author: 'Sol R.', initials: 'SR', color: '#60A5FA', category: 'Znaki', time: '3h temu', likes: 211, comments: 67,
    content: 'Biały motyl usiadł na mojej dłoni dokładnie w chwili, gdy trzymałem zdjęcie mamy (rok po jej odejściu). Czy wy też wierzycie, że duchy komunikują się przez naturę?' },
  { id: 6, author: 'Mira V.', initials: 'MV', color: '#E879F9', category: 'Wizje', time: '5h temu', likes: 334, comments: 92,
    content: 'Widzę pulsujące złote nici łączące ludzi w metrze. Każda nić to niewidzialna relacja — niektóre jasne i mocne, inne prawie przezroczyste. Może wszyscy jesteśmy bardziej połączeni niż nam się wydaje.' },
];

const TRENDING = [
  { tag: '#synchroniczność', count: 2341 },
  { tag: '#przebudzenie', count: 1892 },
  { tag: '#sny_lucidne', count: 1456 },
  { tag: '#znaki_wszechświata', count: 1234 },
  { tag: '#medytacja_głęboka', count: 987 },
];

const QUESTION = {
  text: 'Czy doświadczyłeś/aś dziś czegoś, co wydało Ci się nieprzypadkowe?',
  votes: { tak: 1847, nie: 342, nwiem: 567 },
};

const CONSCIOUSNESS_LEVEL = 73;

export const ConsciousnessScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { currentTheme, isLight } = useTheme();
  const currentUser = useAuthStore(s => s.currentUser);
  const textColor = isLight ? '#1C1008' : '#E8E0FF';
  const subColor = isLight ? 'rgba(28,16,8,0.55)' : 'rgba(232,224,255,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.10)';
  const [feedPosts, setFeedPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Wszystkie');
  const [liked, setLiked] = useState({});
  const [myVote, setMyVote] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postText, setPostText] = useState('');
  const [postCategory, setPostCategory] = useState('Przemyślenia');
  const [commentModal, setCommentModal] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const orb = useSharedValue(0.85);
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orb.value }],
    opacity: 0.6 + orb.value * 0.3,
  }));

  useEffect(() => {
    orb.value = withRepeat(withSequence(
      withTiming(1.12, { duration: 2200 }),
      withTiming(0.85, { duration: 2200 }),
    ), -1, false);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    setLoadingPosts(true);
    FeedService.getPosts(currentUser.uid)
      .then(({ posts: fbPosts }) => {
        if (fbPosts.length > 0) setFeedPosts(fbPosts.map(p => ({
          id: p.id,
          author: p.authorName,
          initials: (p.authorName || 'A').slice(0, 2).toUpperCase(),
          color: ({ TAROT: '#F59E0B', HOROSKOP: '#6366F1', MEDYTACJA: '#10B981', AFIRMACJA: '#FBBF24', SEN: '#818CF8', REFLEKSJA: '#8B5CF6' })[p.type] ?? '#6366F1',
          category: ({ TAROT: 'Wizje', HOROSKOP: 'Znaki', MEDYTACJA: 'Przemyślenia', AFIRMACJA: 'Przemyślenia', SEN: 'Sny', REFLEKSJA: 'Przemyślenia' })[p.type] ?? 'Przemyślenia',
          time: (() => {
            const diff = Date.now() - p.createdAt;
            const min = Math.floor(diff / 60000);
            if (min < 1) return 'teraz';
            if (min < 60) return `${min} min temu`;
            return `${Math.floor(min / 60)}h temu`;
          })(),
          likes: (p.reactions.resonuje + p.reactions.prawda + p.reactions.czuje),
          comments: p.commentCount,
          content: p.content,
        })));
      })
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
  }, [currentUser]);

  const filteredPosts = activeCategory === 'Wszystkie'
    ? feedPosts
    : feedPosts.filter(p => p.category === activeCategory);

  const totalVotes = QUESTION.votes.tak + QUESTION.votes.nie + QUESTION.votes.nwiem;

  const openComments = (post) => {
    setCommentModal(post);
    setComments([]);
    setLoadingComments(true);
    // Try to load real comments if post has a string id (Firebase)
    if (typeof post.id === 'string') {
      FeedService.getComments(post.id)
        .then(fbComments => setComments(fbComments))
        .catch(() => {})
        .finally(() => setLoadingComments(false));
    } else {
      setLoadingComments(false);
    }
  };

  const sendComment = async () => {
    if (!commentText.trim() || !commentModal || !currentUser) return;
    const text = commentText.trim();
    setCommentText('');
    if (typeof commentModal.id === 'string') {
      await FeedService.addComment(commentModal.id, { uid: currentUser.uid, displayName: currentUser.displayName ?? 'Dusza' }, text).catch(() => {});
      FeedService.getComments(commentModal.id).then(setComments).catch(() => {});
    } else {
      // Local-only fallback for seed posts
      const initials = (currentUser.displayName ?? 'Dusza').slice(0, 2).toUpperCase();
      setComments(prev => [...prev, { id: String(Date.now()), authorName: currentUser.displayName ?? 'Dusza', text, initials }]);
    }
  };

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={[styles.container, {}]} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBackOrToMainTab(navigation, 'Portal')}>
          <ChevronLeft size={22} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>ŚWIADOMOŚĆ ZBIOROWA</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MusicToggleButton color={ACCENT} size={19} />
          <TouchableOpacity onPress={() => setShowPostModal(true)}
            style={[styles.addBtn, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '55' }]}>
            <Plus size={16} color={ACCENT} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {/* Global Consciousness Meter */}
          <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 22 }}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Animated.View style={[{
                width: 120, height: 120, borderRadius: 60,
                backgroundColor: ACCENT + '22',
                borderWidth: 2, borderColor: ACCENT + '55',
                alignItems: 'center', justifyContent: 'center',
              }, orbStyle]}>
                <Text style={{ color: ACCENT, fontSize: 32, fontWeight: '800' }}>{CONSCIOUSNESS_LEVEL}</Text>
                <Text style={{ color: subColor, fontSize: 10, letterSpacing: 1 }}>ŚWIADOMOŚĆ</Text>
              </Animated.View>
              <Text style={{ color: textColor, fontSize: 14, fontWeight: '600', marginTop: 10 }}>
                Globalny Poziom Świadomości
              </Text>
              <Text style={{ color: subColor, fontSize: 12, textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                Wyliczany z aktywności 12,847 połączonych dusz
              </Text>
            </View>

            {/* Progress bar */}
            <View style={{ width: '100%', height: 6, backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <LinearGradient
                colors={[ACCENT, '#818CF8', '#60A5FA']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ width: `${CONSCIOUSNESS_LEVEL}%`, height: '100%', borderRadius: 3 }}
              />
            </View>

            {/* Stats row */}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
              {[
                { label: 'ONLINE', value: '12,847' },
                { label: 'POSTY DZIŚ', value: '2,341' },
                { label: 'REZONANS', value: '94%' },
              ].map(s => (
                <View key={s.label} style={{ alignItems: 'center', flex: 1, backgroundColor: cardBg, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: cardBorder }}>
                  <Text style={{ color: ACCENT, fontSize: 16, fontWeight: '800' }}>{s.value}</Text>
                  <Text style={{ color: subColor, fontSize: 9, letterSpacing: 1.2, marginTop: 2 }}>{s.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Daily question */}
          <Animated.View entering={FadeInDown.delay(150).duration(600)} style={{ marginHorizontal: 22, marginBottom: 20 }}>
            <LinearGradient
              colors={[ACCENT + '18', ACCENT + '08', 'transparent']}
              style={{ borderRadius: 16, padding: 16, borderWidth: 1, borderColor: ACCENT + '30' }}
            >
              <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 8 }}>PYTANIE DNIA</Text>
              <Text style={{ color: textColor, fontSize: 14, lineHeight: 22, marginBottom: 14 }}>{QUESTION.text}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { key: 'tak', label: 'Tak', color: '#34D399' },
                  { key: 'nie', label: 'Nie', color: '#F87171' },
                  { key: 'nwiem', label: 'Nie wiem', color: '#FBBF24' },
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setMyVote(opt.key)}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 10,
                      backgroundColor: myVote === opt.key ? opt.color + '30' : 'rgba(255,255,255,0.05)',
                      borderWidth: 1, borderColor: myVote === opt.key ? opt.color + '80' : 'rgba(255,255,255,0.10)',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: myVote === opt.key ? opt.color : subColor, fontSize: 12, fontWeight: '600' }}>{opt.label}</Text>
                    <Text style={{ color: subColor, fontSize: 10, marginTop: 2 }}>
                      {Math.round(QUESTION.votes[opt.key] / totalVotes * 100)}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Trending */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ paddingHorizontal: 22, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <TrendingUp size={14} color={ACCENT} />
              <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700', letterSpacing: 2 }}>TRENDY</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {TRENDING.map(t => (
                  <View key={t.tag} style={{ backgroundColor: cardBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: cardBorder }}>
                    <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600' }}>{t.tag}</Text>
                          <Text style={{ color: subColor, fontSize: 10 }}>{formatLocaleNumber(t.count)} {i18n.language?.startsWith('en') ? 'posts' : 'postów'}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </Animated.View>

          {/* Category filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 22, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingRight: 22 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                    backgroundColor: activeCategory === cat ? ACCENT + '25' : cardBg,
                    borderWidth: 1, borderColor: activeCategory === cat ? ACCENT + '70' : cardBorder,
                  }}
                >
                  <Text style={{ color: activeCategory === cat ? ACCENT : subColor, fontSize: 12, fontWeight: '600' }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Feed */}
          <View style={{ paddingHorizontal: 22, gap: 12 }}>
            {filteredPosts.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 32, opacity: 0.6 }}>
                <Text style={{ color: ACCENT, fontSize: 24 }}>✦</Text>
                <Text style={{ color: textColor, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                  {loadingPosts ? 'Łączenie ze zbiorową świadomością...' : 'Bądź pierwszą duszą, która podzieli się refleksją ✦'}
                </Text>
              </View>
            )}
            {filteredPosts.map((post, i) => (
              <Animated.View key={post.id} entering={FadeInDown.delay(i * 80).duration(500)}>
                <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: cardBorder, overflow: 'hidden' }}>
                  <LinearGradient
                    colors={[post.color + '12', 'transparent']}
                    style={{ padding: 16 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: post.color + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: post.color + '50' }}>
                        <Text style={{ color: post.color, fontSize: 12, fontWeight: '700' }}>{post.initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>{post.author}</Text>
                        <Text style={{ color: subColor, fontSize: 11 }}>{post.time}</Text>
                      </View>
                      <View style={{ backgroundColor: post.color + '20', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: post.color, fontSize: 10, fontWeight: '600' }}>{post.category}</Text>
                      </View>
                    </View>
                    <Text style={{ color: textColor, fontSize: 13, lineHeight: 21 }}>{post.content}</Text>
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                      <TouchableOpacity
                        onPress={() => setLiked(l => ({ ...l, [post.id]: !l[post.id] }))}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                      >
                        <Heart size={15} color={liked[post.id] ? '#F472B6' : subColor} fill={liked[post.id] ? '#F472B6' : 'none'} />
                        <Text style={{ color: subColor, fontSize: 12 }}>{post.likes + (liked[post.id] ? 1 : 0)}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => openComments(post)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                      >
                        <MessageCircle size={15} color={subColor} />
                        <Text style={{ color: subColor, fontSize: 12 }}>{post.comments}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => Share.share({ message: 'Odkryj Aethera — aplikację do duchowego rozwoju!' })}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                      >
                        <Share2 size={15} color={subColor} />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Most resonant */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={{ paddingHorizontal: 22, marginTop: 24, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Eye size={14} color={ACCENT} />
              <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700', letterSpacing: 2 }}>NAJBARDZIEJ REZONUJĄCE W TYM TYGODNIU</Text>
            </View>
            {feedPosts.filter((_, i) => i < 3).sort((a, b) => b.likes - a.likes).map((post, i) => (
              <View key={post.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: cardBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: cardBorder, marginBottom: 8 }}>
                <Text style={{ color: ACCENT, fontSize: 18, fontWeight: '800', width: 28 }}>#{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: textColor, fontSize: 12 }} numberOfLines={2}>{post.content}</Text>
                  <Text style={{ color: subColor, fontSize: 11, marginTop: 4 }}>{post.author} · {post.likes} rezonancji</Text>
                </View>
              </View>
            ))}
          </Animated.View>
          <EndOfContentSpacer />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Post Modal */}
      <Modal visible={showPostModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: isLight ? '#FFFFFF' : '#12101E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: textColor, fontSize: 16, fontWeight: '700' }}>Podziel się ze wspólnotą</Text>
              <TouchableOpacity onPress={() => setShowPostModal(false)}>
                <X size={20} color={subColor} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CATEGORIES.slice(1).map(cat => (
                  <TouchableOpacity key={cat} onPress={() => setPostCategory(cat)}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: postCategory === cat ? ACCENT + '30' : cardBg, borderWidth: 1, borderColor: postCategory === cat ? ACCENT + '70' : cardBorder }}>
                    <Text style={{ color: postCategory === cat ? ACCENT : subColor, fontSize: 12 }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TextInput
              multiline
              value={postText}
              onChangeText={setPostText}
              placeholder="Co chcesz podzielić ze wspólnotą?"
              placeholderTextColor={subColor}
              style={{ color: textColor, backgroundColor: cardBg, borderRadius: 12, padding: 14, height: 120, textAlignVertical: 'top', fontSize: 14, borderWidth: 1, borderColor: cardBorder, marginBottom: 16 }}
            />
            <TouchableOpacity
              onPress={() => {
                if (postText.trim()) {
                  const newPost = {
                    id: Date.now().toString(),
                    author: currentUser?.displayName ?? 'Ty',
                    initials: (currentUser?.displayName ?? 'Ty').slice(0, 2).toUpperCase(),
                    color: '#8B5CF6',
                    category: postCategory,
                    time: 'teraz',
                    likes: 0,
                    comments: 0,
                    content: postText.trim(),
                  };
                  setFeedPosts(prev => [newPost, ...prev]);
                  if (currentUser) {
                    FeedService.createPost({
                      authorId: currentUser.uid,
                      authorName: currentUser.displayName,
                      authorEmoji: currentUser.avatarEmoji ?? '🌙',
                      authorZodiac: '',
                      type: 'REFLEKSJA',
                      content: postText.trim(),
                    }).catch(() => {});
                  }
                }
                setShowPostModal(false);
                setPostText('');
              }}
              style={{ backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Wyślij do strumienia</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Comment Modal */}
      <Modal visible={!!commentModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: isLight ? '#FFFFFF' : '#12101E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: textColor, fontSize: 16, fontWeight: '700' }}>Komentarze</Text>
              <TouchableOpacity onPress={() => setCommentModal(null)}>
                <X size={20} color={subColor} />
              </TouchableOpacity>
            </View>
            {loadingComments ? (
              <Text style={{ color: subColor, fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>Ładowanie...</Text>
            ) : comments.length === 0 ? (
              <Text style={{ color: subColor, fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>Bądź pierwszą/pierwszym, kto skomentuje ✦</Text>
            ) : (
              comments.map((c, i) => (
                <View key={c.id ?? i} style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: ACCENT + '30', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '700' }}>{(c.authorName ?? c.initials ?? '?').slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '700', marginBottom: 2 }}>{c.authorName ?? ''}</Text>
                    <Text style={{ color: textColor, fontSize: 13, lineHeight: 20 }}>{c.text}</Text>
                  </View>
                </View>
              ))
            )}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Twój komentarz..."
                placeholderTextColor={subColor}
                returnKeyType="send"
                onSubmitEditing={sendComment}
                style={{ flex: 1, color: textColor, backgroundColor: cardBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, borderWidth: 1, borderColor: cardBorder }}
              />
              <TouchableOpacity onPress={sendComment}
                style={{ backgroundColor: ACCENT, borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }}>
                <Send size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
        </SafeAreaView>
</View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingVertical: 14,
  },
  headerTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  addBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
