// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput,
  StyleSheet, Dimensions, Modal, Pressable, Alert,
  KeyboardAvoidingView, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle, Line, G } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, FadeInDown, FadeIn, ZoomIn, cancelAnimation, Easing,
} from 'react-native-reanimated';
import {
  ChevronLeft, Plus, Star, Flame, Wind, Droplets, Mountain,
  Check, Globe, Users, MessageCircle, Send, Filter,
} from 'lucide-react-native';
import {
  collection, addDoc, onSnapshot, query, orderBy, limit,
  serverTimestamp, doc, getDoc, setDoc, updateDoc, runTransaction, where,
} from 'firebase/firestore';
import { db } from '../core/config/firebase.config';
import { useTheme } from '../core/hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { HapticsService } from '../core/services/haptics.service';
import { formatLocaleNumber } from '../core/utils/localeFormat';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#F59E0B';
const SP = 18;

// ─── Static astrology data — hoisted to module level ─────────────────────────
const ZODIAC_SIGNS = [
  { id: 'aries',       name: 'Baran',       emoji: '♈', element: 'fire',  dates: '21.03–19.04', color: '#EF4444', constellation: [[0,0],[0.4,0.3],[0.8,0],[1,0.5]] },
  { id: 'taurus',      name: 'Byk',         emoji: '♉', element: 'earth', dates: '20.04–20.05', color: '#10B981', constellation: [[0,0.5],[0.3,0],[0.6,0.5],[1,0.3]] },
  { id: 'gemini',      name: 'Bliźnięta',   emoji: '♊', element: 'air',   dates: '21.05–20.06', color: '#F59E0B', constellation: [[0,0],[0.5,0.5],[1,0],[0.5,1]] },
  { id: 'cancer',      name: 'Rak',         emoji: '♋', element: 'water', dates: '21.06–22.07', color: '#60A5FA', constellation: [[0,0.5],[0.4,0],[0.8,0.5],[1,0.2]] },
  { id: 'leo',         name: 'Lew',         emoji: '♌', element: 'fire',  dates: '23.07–22.08', color: '#EF4444', constellation: [[0,0.2],[0.3,0],[0.6,0.3],[1,0],[0.8,0.7]] },
  { id: 'virgo',       name: 'Panna',       emoji: '♍', element: 'earth', dates: '23.08–22.09', color: '#10B981', constellation: [[0,0],[0.4,0.4],[0.8,0.2],[1,0.6]] },
  { id: 'libra',       name: 'Waga',        emoji: '♎', element: 'air',   dates: '23.09–22.10', color: '#F59E0B', constellation: [[0,0.5],[0.5,0],[1,0.5],[0,0.5]] },
  { id: 'scorpio',     name: 'Skorpion',    emoji: '♏', element: 'water', dates: '23.10–21.11', color: '#60A5FA', constellation: [[0,0.3],[0.3,0],[0.6,0.4],[1,0.2],[0.8,0.8]] },
  { id: 'sagittarius', name: 'Strzelec',    emoji: '♐', element: 'fire',  dates: '22.11–21.12', color: '#EF4444', constellation: [[0,1],[0.5,0],[1,0.5],[0.3,0.6]] },
  { id: 'capricorn',   name: 'Koziorożec',  emoji: '♑', element: 'earth', dates: '22.12–19.01', color: '#10B981', constellation: [[0,0],[0.5,0.5],[1,0],[0.5,1]] },
  { id: 'aquarius',    name: 'Wodnik',      emoji: '♒', element: 'air',   dates: '20.01–18.02', color: '#F59E0B', constellation: [[0,0.3],[0.4,0],[0.7,0.4],[1,0.1]] },
  { id: 'pisces',      name: 'Ryby',        emoji: '♓', element: 'water', dates: '19.02–20.03', color: '#60A5FA', constellation: [[0,0],[0.5,0.5],[1,0],[0.5,1]] },
];

const ELEMENTS = [
  { id: 'fire',  name: 'Ogień',  emoji: '🔥', color: '#EF4444', signs: ['aries', 'leo', 'sagittarius'] },
  { id: 'earth', name: 'Ziemia', emoji: '🌍', color: '#10B981', signs: ['taurus', 'virgo', 'capricorn'] },
  { id: 'air',   name: 'Powietrze', emoji: '💨', color: '#F59E0B', signs: ['gemini', 'libra', 'aquarius'] },
  { id: 'water', name: 'Woda',   emoji: '💧', color: '#60A5FA', signs: ['cancer', 'scorpio', 'pisces'] },
];

const POST_CATEGORIES = ['Doświadczenia', 'Pytania', 'Rytuały', 'Synchroniczności', 'Tarot'];

// Hardcoded weekly transit data — updated manually or via AI
const WEEKLY_TRANSITS = [
  { planet: 'Mars', sign: 'Baran',    isRetrograde: false, energy: '🔥 Napędza', advice: 'Czas na odważne działania i inicjatywę. Zainicjuj nowe projekty.' },
  { planet: 'Wenus', sign: 'Byk',     isRetrograde: false, energy: '💚 Harmonizuje', advice: 'Skup się na związkach i dobrach materialnych. Dbaj o ciało.' },
  { planet: 'Merkury', sign: 'Bliźnięta', isRetrograde: false, energy: '💨 Klaruje', advice: 'Świetny czas na rozmowy, pisanie i uczenie się nowych rzeczy.' },
  { planet: 'Księżyc', sign: 'Rak',   isRetrograde: false, energy: '🌙 Pogłębia', advice: 'Emocje są intensywne. Zadbaj o bezpieczeństwo i dom.' },
  { planet: 'Saturn', sign: 'Ryby',   isRetrograde: true,  energy: '🌊 Testuje', advice: 'Retrograd ujawnia granice. Sprawdź co wymaga przepracowania.' },
];

const SIGN_WEEKLY_RITUAL = {
  aries: 'Zapal czerwoną świecę i wypowiedz intencję nowego początku.',
  taurus: 'Pracuj z kryształem zielonego awenturynu dla manifestacji.',
  gemini: 'Napisz list do siebie z przyszłości — za 1 rok.',
  cancer: 'Kąpiel z solą morską i lawendą dla oczyszczenia emocji.',
  leo: 'Słoneczna medytacja — 10 minut ze wzrokiem w kierunku wschodu.',
  virgo: 'Stwórz listę 5 rzeczy które chcesz zorganizować w życiu.',
  libra: 'Ćwiczenie równowagi: 5 minut na jednej nodze z oddechem.',
  scorpio: 'Rytuał spalania — napisz co chcesz uwolnić i spal papier.',
  sagittarius: 'Wyznacz cel na następny miesiąc i narysuj mapę kroków.',
  capricorn: 'Medytacja z kamieniem obsydianowym dla gruntowania energii.',
  aquarius: 'Wizualizacja lepszego świata — jaką zmianę chcesz wnieść?',
  pisces: 'Sesja automatycznego pisania przy muzyce instrumentalnej.',
};

const SIGN_WEEKLY_THEME = {
  aries: 'Nowe Początki i Odwaga',
  taurus: 'Zakorzenienie i Obfitość',
  gemini: 'Komunikacja i Ciekawość',
  cancer: 'Uzdrowienie Emocjonalne',
  leo: 'Ekspresja i Twórczość',
  virgo: 'Doskonalenie i Porządek',
  libra: 'Harmonia i Sprawiedliwość',
  scorpio: 'Transformacja i Głębia',
  sagittarius: 'Ekspansja i Przygoda',
  capricorn: 'Dyscyplina i Sukces',
  aquarius: 'Innowacja i Wolność',
  pisces: 'Intuicja i Współczucie',
};

const SEED_POSTS = [
  {
    id: 'seed_p1', signId: 'aries', userId: 'seed_u1', displayName: 'Ares M.', emoji: '♈',
    text: 'Ten tydzień jest niesamowity dla Barana! Mars w swoim znaku daje mi tyle energii. Zaczęłam nowy projekt, o którym myślałam od roku.',
    category: 'Doświadczenia', timestamp: new Date(Date.now() - 2 * 3600000),
    likes: ['u2', 'u3', 'u4'],
  },
  {
    id: 'seed_p2', signId: 'aries', userId: 'seed_u2', displayName: 'Ignis K.', emoji: '🔥',
    text: 'Pytanie do kręgu: jak pracujecie z energią złości? Czasem moja energia Barana jest trudna do opanowania.',
    category: 'Pytania', timestamp: new Date(Date.now() - 5 * 3600000),
    likes: ['u1'],
  },
];

// ─── Module-level helpers ─────────────────────────────────────────────────────
const getSignById = (id) => ZODIAC_SIGNS.find(s => s.id === id) || ZODIAC_SIGNS[0];

const getElementForSign = (signId) => ELEMENTS.find(el => el.signs.includes(signId)) || ELEMENTS[0];

const formatTimeAgo = (ts) => {
  try {
    const ms = Date.now() - (ts?.toDate?.() || new Date(ts)).getTime();
    const min = Math.floor(ms / 60000);
    if (min < 60) return `${min} min temu`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h temu`;
    return `${Math.floor(h / 24)}d temu`;
  } catch { return ''; }
};

// ─── Constellation SVG ────────────────────────────────────────────────────────
const ConstellationSVG = React.memo(({ points, color, size = 80 }) => {
  const scaled = points.map(([x, y]) => [x * size, y * size]);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {scaled.map((pt, i) => i < scaled.length - 1 ? (
        <Line
          key={`line_${i}`}
          x1={pt[0]} y1={pt[1]}
          x2={scaled[i + 1][0]} y2={scaled[i + 1][1]}
          stroke={color} strokeWidth={1} strokeOpacity={0.5}
        />
      ) : null)}
      {scaled.map((pt, i) => (
        <Circle key={`dot_${i}`} cx={pt[0]} cy={pt[1]} r={2.5} fill={color} fillOpacity={0.9} />
      ))}
    </Svg>
  );
});

// ─── Sign Grid Card ───────────────────────────────────────────────────────────
const SignGridCard = React.memo(({ sign, isSelected, onPress, memberCount, isLight, textColor, subColor }) => {
  const el = getElementForSign(sign.id);
  const cardBg = isSelected
    ? sign.color + '22'
    : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)');
  const borderColor = isSelected ? sign.color : (isLight ? 'rgba(139,100,42,0.15)' : 'rgba(255,255,255,0.07)');

  return (
    <Pressable onPress={onPress} style={[sh.signGridCard, { backgroundColor: cardBg, borderColor }]}>
      <Text style={{ fontSize: 22, marginBottom: 3 }}>{sign.emoji}</Text>
      <Text style={{ color: textColor, fontSize: 12, fontWeight: '700' }}>{sign.name}</Text>
      <View style={[sh.elemBadge, { backgroundColor: el.color + '20' }]}>
        <Text style={{ fontSize: 9 }}>{el.emoji}</Text>
        <Text style={{ color: el.color, fontSize: 9, fontWeight: '600' }}>{el.name}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 }}>
        <Users size={9} color={subColor} strokeWidth={2} />
        <Text style={{ color: subColor, fontSize: 9 }}>{memberCount || 0}</Text>
      </View>
    </Pressable>
  );
});

// ─── Post Card ────────────────────────────────────────────────────────────────
const PostCard = React.memo(({ post, textColor, subColor, isLight, currentUserId, onLike, index }) => {
  const isLiked = (post.likes || []).includes(currentUserId);
  const cardBg = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.05)';
  const borderColor = isLight ? 'rgba(139,100,42,0.15)' : 'rgba(255,255,255,0.07)';

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(360)}>
      <View style={[sh.postCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <View style={[sh.avatarCircle, { backgroundColor: ACCENT + '22' }]}>
            <Text style={{ fontSize: 16 }}>{post.emoji || '⭐'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: textColor, fontSize: 14, fontWeight: '700' }}>{post.displayName}</Text>
            <Text style={{ color: subColor, fontSize: 11 }}>{formatTimeAgo(post.timestamp)}</Text>
          </View>
          <View style={[sh.catChip, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '35' }]}>
            <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700' }}>{post.category}</Text>
          </View>
        </View>
        <Text style={{ color: textColor, fontSize: 14, lineHeight: 20 }}>{post.text}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 }}>
          <Pressable onPress={() => onLike(post.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Star
              size={16}
              color={isLiked ? '#F59E0B' : subColor}
              fill={isLiked ? '#F59E0B' : 'transparent'}
              strokeWidth={2}
            />
            <Text style={{ color: isLiked ? ACCENT : subColor, fontSize: 13, fontWeight: '600' }}>
              {(post.likes || []).length}
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
});

// ─── Transit Card ─────────────────────────────────────────────────────────────
const TransitCard = React.memo(({ transit, textColor, subColor, isLight }) => {
  const { t } = useTranslation();

  const cardBg = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const borderColor = isLight ? 'rgba(139,100,42,0.15)' : 'rgba(255,255,255,0.07)';
  return (
    <View style={[sh.transitCard, { backgroundColor: cardBg, borderColor }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Text style={{ color: textColor, fontSize: 14, fontWeight: '700' }}>{transit.planet}</Text>
        <Text style={{ color: subColor, fontSize: 13 }}>w {transit.sign}</Text>
        {transit.isRetrograde && (
          <View style={[sh.retroBadge]}>
            <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '700' }}>{t('astroCircle.retro', '℞ RETRO')}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 13 }}>{transit.energy}</Text>
      </View>
      <Text style={{ color: subColor, fontSize: 12, lineHeight: 17 }}>{transit.advice}</Text>
    </View>
  );
});

// ─── Create Post Modal ────────────────────────────────────────────────────────
const CreatePostModal = React.memo(({ visible, onClose, onSubmit, textColor, subColor, isLight }) => {
  const { t } = useTranslation();

  const [text, setText] = useState('');
  const [category, setCategory] = useState('Doświadczenia');

  const inputBg = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
  const borderC = isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.12)';

  const handleSubmit = useCallback(() => {
    if (!text.trim()) { Alert.alert(t('astroCircle.napisz_cos', 'Napisz coś'), t('astroCircle.podziel_sie_swoim_doswiadcze_z', 'Podziel się swoim doświadczeniem z kręgiem.')); return; }
    onSubmit({ text: text.trim(), category });
    setText(''); setCategory('Doświadczenia');
  }, [text, category, onSubmit]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={[sh.modalSheet, { backgroundColor: isLight ? '#FAF8F5' : '#12101E' }]}>
          <View style={[sh.modalHandle, { backgroundColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }]} />
          <Text style={[sh.modalTitle, { color: textColor }]}>{t('astroCircle.podziel_sie_z_kregiem', '✨ Podziel się z Kręgiem')}</Text>
          <Text style={[sh.fieldLabel, { color: subColor }]}>{t('astroCircle.kategoria', 'Kategoria')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {POST_CATEGORIES.map(cat => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[sh.catPill, {
                    backgroundColor: category === cat ? ACCENT + '25' : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)'),
                    borderColor: category === cat ? ACCENT : borderC,
                  }]}
                >
                  <Text style={{ color: category === cat ? ACCENT : subColor, fontSize: 13, fontWeight: '600' }}>{cat}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('astroCircle.co_chcesz_podzielic_sie_z', 'Co chcesz podzielić się z kręgiem swojego znaku?')}
            placeholderTextColor={subColor}
            multiline
            numberOfLines={5}
            style={[sh.input, { backgroundColor: inputBg, borderColor: borderC, color: textColor, height: 110, textAlignVertical: 'top' }]}
            maxLength={600}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={onClose} style={[sh.modalBtn, { borderColor: borderC, flex: 1 }]}>
              <Text style={{ color: subColor, fontSize: 15, fontWeight: '600' }}>{t('astroCircle.anuluj', 'Anuluj')}</Text>
            </Pressable>
            <Pressable onPress={handleSubmit} style={[sh.modalBtn, { backgroundColor: ACCENT, borderColor: ACCENT, flex: 2 }]}>
              <Send size={16} color="#fff" strokeWidth={2} />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 6 }}>{t('astroCircle.opublikuj', 'Opublikuj')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const AstroCircleScreen = ({ navigation }) => {
  const { currentTheme: theme, isLight } = useTheme();
  const { t } = useTranslation();
  const { currentUser } = useAuthStore();
  const userData = useAppStore(s => s.userData);

  const textColor = isLight ? '#1C1612' : '#F5F1EA';
  const subColor = isLight ? '#6B5E4E' : 'rgba(245,241,234,0.55)';

  // Determine user's sign from store
  const userSignId = useMemo(() => {
    const sign = userData?.zodiacSign?.toLowerCase() || 'aries';
    const found = ZODIAC_SIGNS.find(s => s.name.toLowerCase() === sign || s.id === sign);
    return found?.id || 'aries';
  }, [userData?.zodiacSign]);

  const userSign = useMemo(() => getSignById(userSignId), [userSignId]);
  const userElement = useMemo(() => getElementForSign(userSignId), [userSignId]);

  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'all' | 'elements'
  const [viewingSignId, setViewingSignId] = useState(userSignId);
  const [posts, setPosts] = useState(SEED_POSTS.filter(p => p.signId === userSignId));
  const [filterCat, setFilterCat] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [circleMemberCounts, setCircleMemberCounts] = useState({});
  const [weeklyChallengeDone, setWeeklyChallengeDone] = useState(false);
  const [activeElementId, setActiveElementId] = useState(userElement.id);

  const uid = currentUser?.uid;
  const viewingSign = useMemo(() => getSignById(viewingSignId), [viewingSignId]);

  // Load posts for viewing sign
  useEffect(() => {
    const signId = viewingSignId;
    const fallback = SEED_POSTS.filter(p => p.signId === signId);
    try {
      const q = query(
        collection(db, 'astroCirclePosts', signId, 'posts'),
        orderBy('timestamp', 'desc'),
        limit(30),
      );
      const unsub = onSnapshot(q, snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPosts(data.length > 0 ? data : fallback);
      }, () => setPosts(fallback));
      return () => unsub();
    } catch {
      setPosts(fallback);
    }
  }, [viewingSignId]);

  // Load member counts for circles
  useEffect(() => {
    const fetchCounts = async () => {
      const counts = {};
      for (const sign of ZODIAC_SIGNS) {
        try {
          const snap = await getDoc(doc(db, 'astroCircles', sign.id));
          counts[sign.id] = snap.exists() ? (snap.data().members?.length || 0) : Math.floor(Math.random() * 200 + 50);
        } catch {
          counts[sign.id] = Math.floor(Math.random() * 200 + 50);
        }
      }
      setCircleMemberCounts(counts);
    };
    fetchCounts();
  }, []);

  // Register user in their circle
  useEffect(() => {
    if (!uid) return;
    const register = async () => {
      try {
        const ref = doc(db, 'astroCircles', userSignId);
        const snap = await getDoc(ref);
        const members = snap.exists() ? (snap.data().members || []) : [];
        if (!members.includes(uid)) {
          await setDoc(ref, {
            sign: userSignId,
            members: [...members, uid],
            activeNow: (snap.data()?.activeNow || 0) + 1,
            lastPost: serverTimestamp(),
            weeklyTheme: SIGN_WEEKLY_THEME[userSignId] || '',
            weeklyRitual: SIGN_WEEKLY_RITUAL[userSignId] || '',
          }, { merge: true });
        }
      } catch {}
    };
    register();
  }, [uid, userSignId]);

  const handleCreatePost = useCallback(async ({ text, category }) => {
    setShowCreate(false);
    HapticsService.impact('medium');
    const postData = {
      signId: viewingSignId,
      userId: uid || 'anon',
      displayName: currentUser?.displayName || userData?.name || 'Dusza',
      emoji: viewingSign.emoji,
      text,
      category,
      timestamp: serverTimestamp(),
      likes: [],
    };
    try {
      await addDoc(collection(db, 'astroCirclePosts', viewingSignId, 'posts'), postData);
    } catch {
      setPosts(prev => [{ id: Date.now().toString(), ...postData, timestamp: new Date() }, ...prev]);
    }
  }, [viewingSignId, uid, currentUser, userData, viewingSign]);

  const handleLike = useCallback(async (postId) => {
    if (!uid) return;
    HapticsService.impact('medium');
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const likes = p.likes || [];
      const isLiked = likes.includes(uid);
      return { ...p, likes: isLiked ? likes.filter(x => x !== uid) : [...likes, uid] };
    }));
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'astroCirclePosts', viewingSignId, 'posts', postId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const likes = snap.data().likes || [];
        const isLiked = likes.includes(uid);
        tx.update(ref, { likes: isLiked ? likes.filter(x => x !== uid) : [...likes, uid] });
      });
    } catch {}
  }, [uid, viewingSignId]);

  const handleCompleteChallenge = useCallback(() => {
    setWeeklyChallengeDone(true);
    HapticsService.notify();
    Alert.alert(t('astroCircle.wyzwanie_ukonczone', '✦ Wyzwanie ukończone!'), t('astroCircle.twoja_energia_zostala_zanotowana_w', 'Twoja energia została zanotowana w kręgu.'));
  }, []);

  const filteredPosts = useMemo(() => {
    if (filterCat === 'all') return posts;
    return posts.filter(p => p.category === filterCat);
  }, [filterCat, posts]);

  const elementSigns = useMemo(() => {
    const el = ELEMENTS.find(e => e.id === activeElementId);
    return el ? ZODIAC_SIGNS.filter(s => el.signs.includes(s.id)) : [];
  }, [activeElementId]);

  const cardBg = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.05)';
  const borderColor = isLight ? 'rgba(139,100,42,0.15)' : 'rgba(255,255,255,0.08)';

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <LinearGradient
          colors={isLight
            ? [userSign.color + '10', 'transparent']
            : [userSign.color + '1A', 'transparent']}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* Header */}
        <View style={[sh.header, { borderBottomColor: isLight ? 'rgba(139,100,42,0.12)' : 'rgba(255,255,255,0.07)' }]}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Social')} style={sh.backBtn}>
            <ChevronLeft size={22} color={textColor} strokeWidth={2} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[sh.headerTitle, { color: textColor }]}>
              {userSign.emoji} Kręgi Astro
            </Text>
            <Text style={{ color: subColor, fontSize: 12 }}>
              Twój krąg: {userSign.name} · {userElement.emoji} {userElement.name}
            </Text>
          </View>
          <Pressable onPress={() => setShowCreate(true)} style={[sh.fabSmall, { backgroundColor: ACCENT }]}>
            <Plus size={18} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Tab bar */}
        <View style={[sh.tabRow, { borderBottomColor: isLight ? 'rgba(139,100,42,0.10)' : 'rgba(255,255,255,0.06)' }]}>
          {[
            { key: 'my', label: 'Mój Krąg', emoji: userSign.emoji },
            { key: 'all', label: 'Wszystkie', emoji: '♾️' },
            { key: 'elements', label: 'Żywioły', emoji: '🌿' },
          ].map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => {
                setActiveTab(tab.key);
                if (tab.key === 'my') setViewingSignId(userSignId);
              }}
              style={[sh.tabItem, activeTab === tab.key && { borderBottomColor: ACCENT, borderBottomWidth: 2 }]}
            >
              <Text style={{ fontSize: 14 }}>{tab.emoji}</Text>
              <Text style={{
                color: activeTab === tab.key ? ACCENT : subColor,
                fontSize: 13, fontWeight: activeTab === tab.key ? '700' : '500', marginLeft: 5,
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
          {/* ─── MY CIRCLE TAB ─── */}
          {activeTab === 'my' && (
            <>
              {/* Hero Banner */}
              <Animated.View entering={ZoomIn.duration(500)} style={{ marginTop: 16, marginBottom: 14 }}>
                <LinearGradient
                  colors={[userSign.color + 'CC', userSign.color + '55']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={sh.heroBanner}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 }}>
                      {t('astroCircle.twoj_krag_astro', 'TWÓJ KRĄG ASTRO')}
                    </Text>
                    <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 4 }}>
                      {userSign.emoji} {userSign.name}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                      {userSign.dates}
                    </Text>
                    <View style={[sh.elemBadgeHero, { backgroundColor: userElement.color + '40' }]}>
                      <Text style={{ fontSize: 13 }}>{userElement.emoji}</Text>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{userElement.name}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 }}>
                      <Users size={13} color="rgba(255,255,255,0.7)" strokeWidth={2} />
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                        {formatLocaleNumber(circleMemberCounts[userSignId] || 0)} członków
                      </Text>
                    </View>
                  </View>
                  <ConstellationSVG
                    points={userSign.constellation}
                    color="rgba(255,255,255,0.7)"
                    size={80}
                  />
                </LinearGradient>
              </Animated.View>

              {/* Weekly Theme & Ritual */}
              <View style={[sh.weeklyCard, { backgroundColor: cardBg, borderColor }]}>
                <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>{t('astroCircle.temat_tygodnia', '✦ TEMAT TYGODNIA')}</Text>
                <Text style={{ color: textColor, fontSize: 16, fontWeight: '800', marginBottom: 8 }}>
                  {SIGN_WEEKLY_THEME[userSignId] || 'Duchowy Rozwój'}
                </Text>
                <Text style={{ color: subColor, fontSize: 13, lineHeight: 18 }}>
                  {SIGN_WEEKLY_RITUAL[userSignId] || 'Medytuj codziennie przez 10 minut.'}
                </Text>
                <Pressable
                  onPress={handleCompleteChallenge}
                  style={[sh.challengeBtn, {
                    backgroundColor: weeklyChallengeDone ? '#10B981' : ACCENT,
                    marginTop: 12,
                  }]}
                >
                  {weeklyChallengeDone
                    ? <Check size={16} color="#fff" strokeWidth={2.5} />
                    : <Star size={16} color="#fff" strokeWidth={2} />}
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', marginLeft: 6 }}>
                    {weeklyChallengeDone ? 'Ukończono!' : 'Zaznacz jako ukończone'}
                  </Text>
                </Pressable>
              </View>

              {/* Transits */}
              <Text style={[sh.sectionLabel, { color: subColor }]}>{t('astroCircle.tranzyty_tygodnia', 'TRANZYTY TYGODNIA')}</Text>
              {WEEKLY_TRANSITS.map((t, idx) => (
                <TransitCard key={t.planet + idx} transit={t} textColor={textColor} subColor={subColor} isLight={isLight} />
              ))}

              {/* Posts */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10 }}>
                <Text style={[sh.sectionLabel, { color: subColor }]}>{t('astroCircle.posty_kregu', 'POSTY KRĘGU')}</Text>
                <Pressable onPress={() => setShowCreate(true)} style={[sh.fabSmall, { backgroundColor: ACCENT + '20', borderWidth: 1, borderColor: ACCENT }]}>
                  <Plus size={15} color={ACCENT} strokeWidth={2.5} />
                </Pressable>
              </View>

              {/* Category filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 7 }}>
                {['all', ...POST_CATEGORIES].map(cat => (
                  <Pressable
                    key={cat}
                    onPress={() => setFilterCat(cat)}
                    style={[sh.catChip, {
                      backgroundColor: filterCat === cat ? ACCENT + '22' : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)'),
                      borderColor: filterCat === cat ? ACCENT : (isLight ? 'rgba(139,100,42,0.15)' : 'rgba(255,255,255,0.08)'),
                    }]}
                  >
                    <Text style={{ color: filterCat === cat ? ACCENT : subColor, fontSize: 12, fontWeight: filterCat === cat ? '700' : '500' }}>
                      {cat === 'all' ? 'Wszystkie' : cat}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {filteredPosts.length === 0 ? (
                <View style={sh.emptyState}>
                  <Text style={{ fontSize: 42, marginBottom: 12 }}>💬</Text>
                  <Text style={{ color: textColor, fontSize: 16, fontWeight: '700', marginBottom: 6 }}>{t('astroCircle.brak_postow', 'Brak postów')}</Text>
                  <Text style={{ color: subColor, fontSize: 13, textAlign: 'center' }}>Bądź pierwszy/a — podziel się z kręgiem {userSign.name}!</Text>
                </View>
              ) : (
                filteredPosts.map((post, idx) => (
                  <PostCard
                    key={post.id + '_' + idx}
                    post={post}
                    textColor={textColor}
                    subColor={subColor}
                    isLight={isLight}
                    currentUserId={uid}
                    onLike={handleLike}
                    index={idx}
                  />
                ))
              )}
            </>
          )}

          {/* ─── ALL CIRCLES TAB ─── */}
          {activeTab === 'all' && (
            <>
              <Text style={{ color: textColor, fontSize: 16, fontWeight: '800', marginTop: 16, marginBottom: 14 }}>{t('astroCircle.wszystkie_12_kregow', '♾️ Wszystkie 12 Kręgów')}</Text>
              <View style={sh.signGrid}>
                {ZODIAC_SIGNS.map((sign, idx) => (
                  <SignGridCard
                    key={sign.id + '_' + idx}
                    sign={sign}
                    isSelected={viewingSignId === sign.id}
                    onPress={() => setViewingSignId(sign.id)}
                    memberCount={circleMemberCounts[sign.id]}
                    isLight={isLight}
                    textColor={textColor}
                    subColor={subColor}
                  />
                ))}
              </View>

              {/* Viewing sign posts */}
              <View style={[sh.weeklyCard, { backgroundColor: cardBg, borderColor, marginTop: 16 }]}>
                <Text style={{ color: textColor, fontSize: 16, fontWeight: '800' }}>
                  {viewingSign.emoji} Krąg {viewingSign.name}
                </Text>
                <Text style={{ color: subColor, fontSize: 12, marginTop: 3 }}>
                  {viewingSign.dates} · {formatLocaleNumber(circleMemberCounts[viewingSignId] || 0)} członków
                </Text>
              </View>
              {filteredPosts.map((post, idx) => (
                <PostCard
                  key={post.id + '_all_' + idx}
                  post={post}
                  textColor={textColor}
                  subColor={subColor}
                  isLight={isLight}
                  currentUserId={uid}
                  onLike={handleLike}
                  index={idx}
                />
              ))}
            </>
          )}

          {/* ─── ELEMENTS TAB ─── */}
          {activeTab === 'elements' && (
            <>
              <Text style={{ color: textColor, fontSize: 16, fontWeight: '800', marginTop: 16, marginBottom: 14 }}>{t('astroCircle.grupy_zywiolow', '🌿 Grupy Żywiołów')}</Text>
              {/* Element selector */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
                {ELEMENTS.map(el => (
                  <Pressable
                    key={el.id}
                    onPress={() => setActiveElementId(el.id)}
                    style={[sh.elemTab, {
                      backgroundColor: activeElementId === el.id ? el.color + '25' : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)'),
                      borderColor: activeElementId === el.id ? el.color : (isLight ? 'rgba(139,100,42,0.15)' : 'rgba(255,255,255,0.08)'),
                    }]}
                  >
                    <Text style={{ fontSize: 16 }}>{el.emoji}</Text>
                    <Text style={{ color: activeElementId === el.id ? el.color : subColor, fontSize: 13, fontWeight: '700' }}>
                      {el.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Signs in element */}
              {(() => {
                const el = ELEMENTS.find(e => e.id === activeElementId);
                return el ? (
                  <LinearGradient
                    colors={[el.color + '22', el.color + '08']}
                    style={[sh.elementBanner, { borderColor: el.color + '40' }]}
                  >
                    <Text style={{ color: textColor, fontSize: 18, fontWeight: '800', marginBottom: 4 }}>
                      {el.emoji} {el.name}
                    </Text>
                    <Text style={{ color: subColor, fontSize: 12, marginBottom: 14 }}>
                      Wspólna energia: {elementSigns.map(s => s.name).join(', ')}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      {elementSigns.map(sign => (
                        <Pressable
                          key={sign.id}
                          onPress={() => { setViewingSignId(sign.id); setActiveTab('all'); }}
                          style={[sh.elemSignCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.08)', borderColor: sign.color + '50' }]}
                        >
                          <Text style={{ fontSize: 24, marginBottom: 4 }}>{sign.emoji}</Text>
                          <Text style={{ color: textColor, fontSize: 12, fontWeight: '700' }}>{sign.name}</Text>
                          <Text style={{ color: subColor, fontSize: 10 }}>
                            {formatLocaleNumber(circleMemberCounts[sign.id] || 0)} os.
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </LinearGradient>
                ) : null;
              })()}

              {/* Cross-element posts (same element signs) */}
              <Text style={[sh.sectionLabel, { color: subColor, marginTop: 18 }]}>{t('astroCircle.posty_zywiolu', 'POSTY ŻYWIOŁU')}</Text>
              {filteredPosts.map((post, idx) => (
                <PostCard
                  key={post.id + '_el_' + idx}
                  post={post}
                  textColor={textColor}
                  subColor={subColor}
                  isLight={isLight}
                  currentUserId={uid}
                  onLike={handleLike}
                  index={idx}
                />
              ))}
            </>
          )}

          <EndOfContentSpacer size="standard" />
        </ScrollView>

        {/* FAB */}
        <Pressable
          onPress={() => setShowCreate(true)}
          style={[sh.fab, { backgroundColor: ACCENT }]}
        >
          <Plus size={24} color="#fff" strokeWidth={2.5} />
        </Pressable>

        <CreatePostModal
          visible={showCreate}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreatePost}
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
  heroBanner: {
    borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  elemBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start',
  },
  elemBadgeHero: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 8, alignSelf: 'flex-start',
  },
  weeklyCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14,
  },
  challengeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: 14,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10,
  },
  transitCard: {
    borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8,
  },
  retroBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.30)',
  },
  signGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  signGridCard: {
    width: (SW - SP * 2 - 8 * 3) / 4,
    borderRadius: 14, borderWidth: 1, padding: 10,
    alignItems: 'center',
  },
  postCard: {
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10,
  },
  avatarCircle: {
    width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center',
  },
  catChip: {
    paddingHorizontal: 11, paddingVertical: 5, borderRadius: 12, borderWidth: 1,
  },
  elemTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1,
  },
  elementBanner: {
    borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 4,
  },
  elemSignCard: {
    flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center',
  },
  catPill: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1,
  },
  emptyState: {
    alignItems: 'center', paddingVertical: 48, paddingHorizontal: 28,
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
  modalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 14, borderWidth: 1,
  },
});
