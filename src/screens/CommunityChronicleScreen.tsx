// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import i18n from '../core/i18n';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Platform, Dimensions, Modal, KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, FadeInDown,
} from 'react-native-reanimated';
import {
  ChevronLeft, BookOpen, Heart, MessageCircle, Share2,
  Bookmark, Plus, X, Trophy, Eye, Send, Star,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { formatLocaleNumber } from '../core/utils/localeFormat';
import { useAppStore } from '../store/useAppStore';
import { HapticsService } from '../core/services/haptics.service';
import { useAuthStore } from '../store/useAuthStore';
import { ChroniclesService, Chronicle } from '../core/services/community/chronicles.service';
import { getResolvedTheme } from '../core/theme/tokens';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#E879F9';

const CATEGORIES = ['Wszystkie', 'Transformacje', 'Cuda', 'Synchroniczności', 'Uzdrowienia', 'Wizje'];

const ENTRIES = [
  { id: 1, author: 'Luna M.', initials: 'LM', color: '#818CF8', category: 'Transformacje', time: '2h temu',
    title: 'Jak 30 dni ciszy zmieniło moje życie', likes: 891, comments: 67, reads: 3421, bookmarked: false,
    body: 'Postanowiłam milczeć przez miesiąc. Nie dosłownie — ale zrezygnowałam ze wszystkich mediów społecznościowych, ograniczyłam rozmowy do minimum i spędzałam każdy wieczór w ciszy. To, co znalazłam w tej ciszy, zmieniło mój stosunek do własnych myśli na zawsze.' },
  { id: 2, author: 'Orion S.', initials: 'OS', color: '#34D399', category: 'Synchroniczności', time: '6h temu',
    title: 'Trzy przypadki, które przypadkami nie były', likes: 1234, comments: 92, reads: 5678, bookmarked: false,
    body: 'W ciągu jednego tygodnia spotkałem przypadkowo trzy osoby z poprzedniego życia — w trzech różnych miastach, w sytuacjach niemożliwych do zaplanowania. Każda z tych osób miała dla mnie konkretną wiadomość. Żadna z nich o tym nie wiedziała.' },
  { id: 3, author: 'Vera K.', initials: 'VK', color: '#F472B6', category: 'Uzdrowienia', time: '1d temu',
    title: 'Jak tarot pomógł mi zaakceptować stratę', likes: 673, comments: 44, reads: 2891, bookmarked: false,
    body: 'Po śmierci mamy szukałam odpowiedzi wszędzie. W końcu sięgnęłam po karty. Nie po wróżbę — po lustro. Karta Śmierci, która zwykle przeraża, przyniosła mi spokój, którego nie mogłam znaleźć przez rok żałoby.' },
  { id: 4, author: 'Ariel T.', initials: 'AT', color: '#FBBF24', category: 'Wizje', time: '2d temu',
    title: 'Medytacja, która przyniosła mi imię mojej opiekunki', likes: 534, comments: 38, reads: 2134, bookmarked: false,
    body: 'Podczas głębokiej medytacji zobaczyłam złotą postać. Powiedziała mi swoje imię i zostawiła mi symbol — trójkąt z okiem. Tydzień później znalazłam ten symbol w książce o starożytnej geometrii. Byłam wstrząśnięta.' },
  { id: 5, author: 'Sol R.', initials: 'SR', color: '#60A5FA', category: 'Cuda', time: '3d temu',
    title: 'Moja choroba cofnęła się po zbiorowej intencji', likes: 2341, comments: 156, reads: 12456, bookmarked: false,
    body: 'Lekarze powiedzieli mi "nie ma wyjaśnienia". Ale ja wiem — ta zmiana nastąpiła dokładnie trzy dni po tym, jak 847 osób ze społeczności wysłało zbiorową intencję uzdrowienia w moim kierunku. Liczby nie wyjaśnią tego, co czuję.' },
  { id: 6, author: 'Mira V.', initials: 'MV', color: '#E879F9', category: 'Transformacje', time: '4d temu',
    title: 'Praca z cieniem — rok później', likes: 1567, comments: 123, reads: 8901, bookmarked: false,
    body: 'Rok temu zaczęłam pracę z cieniem Jungowskim. Bałam się, że znajdę tam potwory. Znalazłam — ale okazały się być częściami mnie, które potrzebowały miłości. Ten rok był najtrudniejszy i najpiękniejszy w moim życiu.' },
];

const TRENDING_STORIES = [
  { title: 'Jak synchroniczność uratowała mi życie', reads: 34567, color: '#818CF8' },
  { title: '21 dni bez reaktywności — pełny raport', reads: 28901, color: '#34D399' },
  { title: 'Sen, który przepowiedział moje przebudzenie', reads: 22345, color: '#FBBF24' },
];

function formatTimeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min} min temu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h temu`;
  return `${Math.floor(h / 24)}d temu`;
}

const TOP_STORYTELLERS = [
  { name: 'Luna M.', stories: 34, color: '#818CF8' },
  { name: 'Vera K.', stories: 28, color: '#F472B6' },
  { name: 'Orion S.', stories: 22, color: '#34D399' },
  { name: 'Sol R.', stories: 19, color: '#60A5FA' },
  { name: 'Mira V.', stories: 17, color: '#E879F9' },
];

export const CommunityChronicleScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const textColor = isLight ? '#1C1008' : '#E8E0FF';
  const subColor = isLight ? 'rgba(28,16,8,0.55)' : 'rgba(232,224,255,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.10)';
    const currentUser = useAuthStore(s => s.currentUser);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Wszystkie');
  const [liked, setLiked] = useState({});
  const [bookmarked, setBookmarked] = useState({});
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyBody, setStoryBody] = useState('');
  const [storyCategory, setStoryCategory] = useState('Transformacje');
  const [commentModal, setCommentModal] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [publishSuccess, setPublishSuccess] = useState(false);
  const publishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = ChroniclesService.listenToChronicles(null, (chronicles: Chronicle[]) => {
      setLoadingEntries(false);
      setEntries(chronicles.map(c => ({
          id: c.id,
          author: c.authorName,
          initials: c.authorInitials,
          color: c.authorColor,
          category: c.category,
          time: formatTimeAgo(c.createdAt),
          title: c.title,
          likes: c.likes,
          comments: c.commentCount,
          reads: c.reads,
          bookmarked: false,
          body: c.body,
        })));
    });
    return () => { unsub(); if (publishTimerRef.current) clearTimeout(publishTimerRef.current); };
  }, []);

  const shimmerAnim = useSharedValue(0);
  const shimmerStyle = useAnimatedStyle(() => ({ opacity: 0.6 + shimmerAnim.value * 0.4 }));
  useEffect(() => {
    shimmerAnim.value = withRepeat(withSequence(withTiming(1, { duration: 2000 }), withTiming(0, { duration: 2000 })), -1, false);
  }, []);

  const INITIALS_COLORS = ['#818CF8', '#34D399', '#F472B6', '#FBBF24', '#60A5FA', '#E879F9'];

  const handlePublish = async () => {
    if (storyTitle.trim().length < 2) return;
    setShowWriteModal(false);
    setPublishSuccess(true);
    if (publishTimerRef.current) clearTimeout(publishTimerRef.current);
    publishTimerRef.current = setTimeout(() => setPublishSuccess(false), 3000);
    if (currentUser) {
      await ChroniclesService.createChronicle(
        { uid: currentUser.uid, displayName: currentUser.displayName },
        { title: storyTitle.trim(), body: storyBody.trim() || '...', category: storyCategory }
      ).catch(() => {});
    }
    setStoryTitle('');
    setStoryBody('');
  };

  const filtered = activeCategory === 'Wszystkie'
    ? entries : entries.filter(e => e.category === activeCategory);

  const featuredStory = ENTRIES.find(e => e.id === 5);

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={[styles.container, {}]} edges={['top']}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBackOrToMainTab(navigation, 'Portal')}>
          <ChevronLeft size={22} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('communityChronicle.kronika_wspolnoty', 'KRONIKA WSPÓLNOTY')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => {
            HapticsService.impact('light');
            if (isFavoriteItem('community-chronicle')) { removeFavoriteItem('community-chronicle'); } else { addFavoriteItem({ id: 'community-chronicle', label: 'Kronika Wspólnoty', route: 'CommunityChronicle', icon: 'BookOpen', color: ACCENT, addedAt: Date.now() }); }
          }} style={{ padding: 6 }}>
            <Star size={20} color="#F59E0B" fill={isFavoriteItem('community-chronicle') ? '#F59E0B' : 'none'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowWriteModal(true)}
            style={{ backgroundColor: ACCENT + '22', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ACCENT + '55' }}>
            <Plus size={16} color={ACCENT} />
          </TouchableOpacity>
        </View>
      </View>

      {publishSuccess && (
        <Animated.View entering={FadeInDown.duration(340)} style={{ marginHorizontal: 22, marginBottom: 8, backgroundColor: '#10B981' + '28', borderRadius: 12, borderWidth: 1, borderColor: '#10B981' + '60', paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 14 }}>✦</Text>
          <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '600', flex: 1 }}>{t('communityChronicle.historia_opublikowa_w_kronice_dziek', 'Historia opublikowana w Kronice! Dziękujemy za podzielenie się swoją podróżą.')}</Text>
        </Animated.View>
      )}

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

          {/* Featured story */}
          <Animated.View entering={FadeInDown.duration(600)} style={{ paddingHorizontal: 22, marginBottom: 20 }}>
            <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 10 }}>{t('communityChronicle.historia_tygodnia', 'HISTORIA TYGODNIA')}</Text>
            <LinearGradient colors={[featuredStory.color + '25', featuredStory.color + '10', 'transparent']}
              style={{ borderRadius: 20, padding: 20, borderWidth: 1, borderColor: featuredStory.color + '40', overflow: 'hidden' }}>
              <Animated.View style={[{ position: 'absolute', top: 0, right: 0, width: 160, height: 160, borderRadius: 80, backgroundColor: featuredStory.color + '10' }, shimmerStyle]} />
              <View style={{ backgroundColor: featuredStory.color + '20', alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 }}>
                <Text style={{ color: featuredStory.color, fontSize: 10, fontWeight: '700' }}>{featuredStory.category.toUpperCase()}</Text>
              </View>
              <Text style={{ color: textColor, fontSize: 17, fontWeight: '800', lineHeight: 26, marginBottom: 10 }}>{featuredStory.title}</Text>
              <Text style={{ color: subColor, fontSize: 13, lineHeight: 21 }} numberOfLines={3}>{featuredStory.body}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Eye size={13} color={subColor} />
                    <Text style={{ color: subColor, fontSize: 12 }}>{formatLocaleNumber(featuredStory.reads)}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Heart size={13} color={subColor} />
                  <Text style={{ color: subColor, fontSize: 12 }}>{featuredStory.likes}</Text>
                </View>
                <Text style={{ color: subColor, fontSize: 12, flex: 1, textAlign: 'right' }}>{featuredStory.author}</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Trending */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={{ paddingHorizontal: 22, marginBottom: 20 }}>
            <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 12 }}>{t('communityChronicle.najczescie_czytane', 'NAJCZĘŚCIEJ CZYTANE')}</Text>
            <View style={{ gap: 8 }}>
              {TRENDING_STORIES.map((t, i) => (
                <View key={i} style={{ backgroundColor: cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: cardBorder, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ color: t.color, fontSize: 20, fontWeight: '900', width: 32 }}>#{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>{t.title}</Text>
                          <Text style={{ color: subColor, fontSize: 11, marginTop: 3 }}>{formatLocaleNumber(t.reads)} {i18n.language?.startsWith('en') ? 'reads' : t('communityChronicle.czytan', 'czytań')}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Category filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 22, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingRight: 22 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: activeCategory === cat ? ACCENT + '25' : cardBg, borderWidth: 1, borderColor: activeCategory === cat ? ACCENT + '70' : cardBorder }}>
                  <Text style={{ color: activeCategory === cat ? ACCENT : subColor, fontSize: 12, fontWeight: '600' }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Entries */}
          <View style={{ paddingHorizontal: 22, gap: 12 }}>
            {filtered.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 40, opacity: 0.5 }}>
                <BookOpen size={40} color="#888" />
                <Text style={{ color: '#888', marginTop: 12, fontSize: 15, textAlign: 'center' }}>
                  {loadingEntries ? t('communityChronicle.ladowanie_kronik', 'Ładowanie kronik...') : t('communityChronicle.brak_historii', 'Brak historii w tej kategorii. Napisz pierwszą!')}
                </Text>
              </View>
            )}
            {filtered.map((entry, i) => (
              <Animated.View key={entry.id} entering={FadeInDown.delay(i * 80).duration(500)}>
                <View style={{ backgroundColor: cardBg, borderRadius: 18, borderWidth: 1, borderColor: cardBorder, overflow: 'hidden' }}>
                  <LinearGradient colors={[entry.color + '10', 'transparent']} style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: entry.color + '30', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: entry.color, fontSize: 12, fontWeight: '700' }}>{entry.initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>{entry.author}</Text>
                        <Text style={{ color: subColor, fontSize: 11 }}>{entry.time}</Text>
                      </View>
                      <View style={{ backgroundColor: entry.color + '20', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: entry.color, fontSize: 10, fontWeight: '600' }}>{entry.category}</Text>
                      </View>
                    </View>
                    {/* Image placeholder */}
                    <View style={{ height: 100, borderRadius: 12, backgroundColor: entry.color + '12', marginBottom: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: entry.color + '20' }}>
                      <BookOpen size={28} color={entry.color + '80'} />
                    </View>
                    <Text style={{ color: textColor, fontSize: 15, fontWeight: '700', marginBottom: 8, lineHeight: 22 }}>{entry.title}</Text>
                    <Text style={{ color: subColor, fontSize: 13, lineHeight: 20 }} numberOfLines={3}>{entry.body}</Text>
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, alignItems: 'center' }}>
                      <TouchableOpacity onPress={() => {
                          const nowLiked = !liked[entry.id];
                          setLiked(l => ({ ...l, [entry.id]: nowLiked }));
                          if (currentUser) ChroniclesService.toggleLike(entry.id, currentUser.uid).catch(() => {});
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Heart size={15} color={liked[entry.id] ? '#F472B6' : subColor} fill={liked[entry.id] ? '#F472B6' : 'none'} />
                        <Text style={{ color: subColor, fontSize: 12 }}>{entry.likes + (liked[entry.id] ? 1 : 0)}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setCommentModal(entry)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <MessageCircle size={15} color={subColor} />
                        <Text style={{ color: subColor, fontSize: 12 }}>{entry.comments}</Text>
                      </TouchableOpacity>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Eye size={15} color={subColor} />
                    <Text style={{ color: subColor, fontSize: 12 }}>{formatLocaleNumber(entry.reads)}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setBookmarked(b => ({ ...b, [entry.id]: !b[entry.id] }))}
                        style={{ marginLeft: 'auto' }}>
                        <Bookmark size={15} color={bookmarked[entry.id] ? ACCENT : subColor} fill={bookmarked[entry.id] ? ACCENT : 'none'} />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Top storytellers */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={{ paddingHorizontal: 22, marginTop: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Trophy size={14} color={ACCENT} />
              <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 2 }}>{t('communityChronicle.top_kronikarze', 'TOP KRONIKARZE')}</Text>
            </View>
            <View style={{ gap: 8 }}>
              {TOP_STORYTELLERS.map((s, i) => (
                <View key={i} style={{ backgroundColor: cardBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: cardBorder, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ color: s.color, fontSize: 18, fontWeight: '900', width: 28 }}>#{i + 1}</Text>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: s.color + '30', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: s.color, fontSize: 11, fontWeight: '700' }}>{s.name[0]}</Text>
                  </View>
                  <Text style={{ color: textColor, fontSize: 13, fontWeight: '600', flex: 1 }}>{s.name}</Text>
                  <Text style={{ color: subColor, fontSize: 12 }}>{s.stories} {t('communityChronicle.historii', 'historii')}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Write Modal */}
      <Modal visible={showWriteModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowWriteModal(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
            <KeyboardAvoidingView behavior="padding">
              <ScrollView
                style={{ maxHeight: '90%', backgroundColor: isLight ? '#FFFFFF' : '#12101E', borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
                keyboardShouldPersistTaps="handled"
                onStartShouldSetResponder={() => true}
              >
                <View style={{ padding: 24 }} onStartShouldSetResponder={() => true}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                    <Text style={{ color: textColor, fontSize: 18, fontWeight: '700' }}>{t('communityChronicle.napisz_swoja_historie', 'Napisz swoją historię')}</Text>
                    <TouchableOpacity onPress={() => setShowWriteModal(false)}>
                      <X size={20} color={subColor} />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8 }}>{t('communityChronicle.kategoria', 'KATEGORIA')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {CATEGORIES.slice(1).map(cat => (
                        <TouchableOpacity key={cat} onPress={() => setStoryCategory(cat)}
                          style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: storyCategory === cat ? ACCENT + '30' : cardBg, borderWidth: 1, borderColor: storyCategory === cat ? ACCENT + '70' : cardBorder }}>
                          <Text style={{ color: storyCategory === cat ? ACCENT : subColor, fontSize: 12 }}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  <TextInput value={storyTitle} onChangeText={setStoryTitle} placeholder={t('communityChronicle.tytul_historii', 'Tytuł historii...')}
                    placeholderTextColor={subColor}
                    style={{ color: textColor, backgroundColor: cardBg, borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: cardBorder, marginBottom: 12, fontWeight: '600' }} />
                  <TextInput value={storyBody} onChangeText={setStoryBody} multiline
                    placeholder={t('communityChronicle.opisz_swoje_doswiadcze_przelom_lub', 'Opisz swoje doświadczenie, przełom lub odkrycie...')}
                    placeholderTextColor={subColor}
                    style={{ color: textColor, backgroundColor: cardBg, borderRadius: 12, padding: 14, height: 180, textAlignVertical: 'top', fontSize: 14, lineHeight: 22, borderWidth: 1, borderColor: cardBorder, marginBottom: 20 }} />
                  <TouchableOpacity
                    onPress={handlePublish}
                    style={{ backgroundColor: storyTitle.trim().length >= 2 ? ACCENT : ACCENT + '66', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{t('communityChronicle.opublikuj_w_kronice', 'Opublikuj w Kronice')}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Comment Modal */}
      <Modal visible={!!commentModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setCommentModal(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
            <View
              style={{ backgroundColor: isLight ? '#FFFFFF' : '#12101E', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}
              onStartShouldSetResponder={() => true}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ color: textColor, fontSize: 16, fontWeight: '700' }}>{t('communityChronicle.komentarze', 'Komentarze')}</Text>
                <TouchableOpacity onPress={() => setCommentModal(null)}>
                  <X size={20} color={subColor} />
                </TouchableOpacity>
              </View>
              {[
                { initials: 'AK', text: 'To jedna z najpiękniejszych historii, jakie tu czytałam.' },
                { initials: 'PM', text: 'Dziękuję. Potrzebowałam tego dziś bardziej niż kiedykolwiek.' },
                { initials: 'JS', text: 'Wzruszyłam się. Proszę pisz więcej — masz rzadki dar słowa.' },
              ].map((c, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: ACCENT + '30', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '700' }}>{c.initials}</Text>
                  </View>
                  <Text style={{ color: textColor, fontSize: 13, flex: 1, lineHeight: 20 }}>{c.text}</Text>
                </View>
              ))}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TextInput value={commentText} onChangeText={setCommentText} placeholder={t('communityChronicle.twoj_komentarz', 'Twój komentarz...')}
                  placeholderTextColor={subColor}
                  style={{ flex: 1, color: textColor, backgroundColor: cardBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, borderWidth: 1, borderColor: cardBorder }} />
                <TouchableOpacity
                  onPress={() => { if (commentText.trim().length >= 2) setCommentText(''); }}
                  style={{ backgroundColor: ACCENT, borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
        </SafeAreaView>
</View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 14 },
  headerTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },
});
