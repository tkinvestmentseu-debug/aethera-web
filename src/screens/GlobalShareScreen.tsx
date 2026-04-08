// @ts-nocheck
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import {
  ChevronLeft,
  Sliders,
  Star,
  Sparkles,
  Moon,
  Heart,
  MessageCircle,
  Send,
  Share2,
  Lock,
  User,
  X,
  Plus,
  CheckCircle2,
  Globe,
  Flame,
  BookOpen,
  Wind,
  MoonStar,
  Layers,
  Feather,
  Sun,
  Filter,
  ArrowUp,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { HapticsService } from '../core/services/haptics.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { FeedService } from '../core/services/community/feed.service';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const SP = layout.padding.screen; // 22

function formatFeedTimeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Teraz';
  if (min < 60) return `${min} min temu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h temu`;
  return `${Math.floor(h / 24)}d temu`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const ACCENT = '#CEAE72';

const POST_TYPES = {
  TAROT:      { id: 'TAROT',      label: 'Tarot',      color: '#F59E0B', emoji: '✦' },
  HOROSKOP:   { id: 'HOROSKOP',   label: 'Horoskop',   color: '#818CF8', emoji: '🌙' },
  MEDYTACJA:  { id: 'MEDYTACJA',  label: 'Medytacja',  color: '#10B981', emoji: '🧘' },
  SEN:        { id: 'SEN',        label: 'Sen',        color: '#A78BFA', emoji: '💤' },
  REFLEKSJA:  { id: 'REFLEKSJA',  label: 'Refleksja',  color: '#F97316', emoji: '🔥' },
  AFIRMACJA:  { id: 'AFIRMACJA',  label: 'Afirmacja',  color: '#EC4899', emoji: '💎' },
} as const;

type PostTypeKey = keyof typeof POST_TYPES;

const FILTER_CHIPS = [
  { id: 'ALL',       label: 'Wszystko',  count: 847 },
  { id: 'TAROT',     label: 'Tarot ✦',  count: 214 },
  { id: 'HOROSKOP',  label: 'Horoskop 🌙', count: 178 },
  { id: 'MEDYTACJA', label: 'Medytacja', count: 143 },
  { id: 'SEN',       label: 'Sny',       count: 132 },
  { id: 'REFLEKSJA', label: 'Refleksja', count: 97 },
  { id: 'AFIRMACJA', label: 'Afirmacja', count: 83 },
];

interface FeedPost {
  id: string;
  author: string;
  avatar: string;
  zodiac: string;
  country: string;
  type: PostTypeKey;
  content: string;
  timeAgo: string;
  reactions: { resonuje: number; prawda: number; czuje: number; comments: number };
  tarotCard?: string;
  tarotReversed?: boolean;
  horoscopeSign?: string;
  meditationDuration?: string;
  meditationTechnique?: string;
  anonymous?: boolean;
}

// Seed content for global feed — intentional demo data (no backend)
const SEED_POSTS: FeedPost[] = [
  {
    id: 'p1',
    author: 'Luna',
    avatar: '🌙',
    zodiac: 'Ryby',
    country: '🇵🇱',
    type: 'TAROT',
    content: 'Dziś wyciągnęłam Wieżę odwróconą i poczułam jak coś w środku się rozluźnia. Może to znak, że chaos, którego tak się bałam, jest właśnie tym, czego potrzebowałam, by się obudzić. Transformacja nie musi być straszna — może być wyzwoleniem.',
    timeAgo: '2 min temu',
    reactions: { resonuje: 312, prawda: 187, czuje: 94, comments: 28 },
    tarotCard: 'Wieża',
    tarotReversed: true,
  },
  {
    id: 'p2',
    author: 'Arion',
    avatar: '⚡',
    zodiac: 'Lew',
    country: '🇫🇷',
    type: 'HOROSKOP',
    content: 'Mars wchodzi do mojego ascendentu i czuję tę energię każdą komórką ciała. Czas działania. Czas odwagi. Czerwiec będzie miesiącem moich najodważniejszych decyzji — nie planuję tego zmieniać.',
    timeAgo: '7 min temu',
    reactions: { resonuje: 445, prawda: 231, czuje: 178, comments: 52 },
    horoscopeSign: 'Lew ♌',
  },
  {
    id: 'p3',
    author: 'Vera',
    avatar: '🌿',
    zodiac: 'Byk',
    country: '🇩🇪',
    type: 'MEDYTACJA',
    content: 'Dwadzieścia minut ciszy. Tylko oddech. Poczułam jak moje ciało przypomina sobie, czym jest spokój — nie jako brak problemu, ale jako wybór w jego obecności. Polecam technikę 4-7-8 każdemu, kto zmaga się z lękiem.',
    timeAgo: '15 min temu',
    reactions: { resonuje: 567, prawda: 289, czuje: 203, comments: 41 },
    meditationDuration: '20 min',
    meditationTechnique: '4-7-8 Oddech',
  },
  {
    id: 'p4',
    author: 'Solaris',
    avatar: '☀️',
    zodiac: 'Koziorożec',
    country: '🇬🇧',
    type: 'AFIRMACJA',
    content: 'Jestem wystarczająca. Nie kiedy skończę, nie kiedy osiągnę, nie kiedy zostanę zaakceptowana — teraz, w tej chwili, dokładnie taka jaka jestem. To nie jest optymizm. To jest prawda, którą wybrałam dziś rano.',
    timeAgo: '1 godz. temu',
    reactions: { resonuje: 789, prawda: 412, czuje: 334, comments: 67 },
  },
  {
    id: 'p5',
    author: 'Kira',
    avatar: '💎',
    zodiac: 'Wodnik',
    country: '🇸🇪',
    type: 'SEN',
    content: 'Śniłam o ogrodzie pełnym nieznanych kwiatów świecących od środka. Każdy kwiat miał inne imię i pytał mnie: czy mnie pamiętasz? Obudziłam się z poczuciem, że wszystkie zapomniane części siebie wołają, by je zobaczyć.',
    timeAgo: '2 godz. temu',
    reactions: { resonuje: 423, prawda: 198, czuje: 276, comments: 39 },
  },
  {
    id: 'p6',
    author: 'Mira',
    avatar: '🌺',
    zodiac: 'Panna',
    country: '🇧🇷',
    type: 'REFLEKSJA',
    content: 'Dziś zdałam sobie sprawę, że kontrola jest iluzją, którą kupujemy za cenę spokoju. Przez lata myślałam, że jeśli wszystko zaplanuję, nic mnie nie zaskoczy. Tymczasem zaskoczenie było jedyną drogą do tego, co prawdziwe.',
    timeAgo: '4 godz. temu',
    reactions: { resonuje: 534, prawda: 321, czuje: 289, comments: 74 },
  },
  {
    id: 'p7',
    author: 'Atlas',
    avatar: '🗺️',
    zodiac: 'Strzelec',
    country: '🇯🇵',
    type: 'TAROT',
    content: 'Gwiazda prosto. Dziś rano karta przywitała mnie ciepłem, którego szukałem od miesięcy. Po trudnym roku wreszcie czuję, że jest coś poza tym — nadzieja nie jako życzenie, ale jako kierunek. Idę tam.',
    timeAgo: '8 godz. temu',
    reactions: { resonuje: 678, prawda: 445, czuje: 312, comments: 88 },
    tarotCard: 'Gwiazda',
    tarotReversed: false,
  },
  {
    id: 'p8',
    author: 'Nyx',
    avatar: '🌑',
    zodiac: 'Skorpion',
    country: '🇵🇱',
    type: 'HOROSKOP',
    content: 'Pluton retrograde w moim ósmym domu. Inni boją się tej tranzycji — ja wiem, że przebudzenie zawsze przychodzi przez ciemność. Skorpion jest tutaj jak w domu. Transformacja to nie zniszczenie — to powrót do siebie.',
    timeAgo: '12 godz. temu',
    reactions: { resonuje: 391, prawda: 267, czuje: 198, comments: 55 },
    horoscopeSign: 'Skorpion ♏',
  },
  {
    id: 'p9',
    author: 'Ember',
    avatar: '🔥',
    zodiac: 'Baran',
    country: '🇺🇸',
    type: 'MEDYTACJA',
    content: 'Pierwszy raz w życiu siedziałam w ciszy przez 30 minut bez walki. Umysł próbował mnie zabrać tysiąc razy — a ja za każdym razem wracałam. To jest właśnie praktyka: nie brak myśli, ale niekończący się powrót do teraz.',
    timeAgo: '1 dzień temu',
    reactions: { resonuje: 612, prawda: 398, czuje: 271, comments: 93 },
    meditationDuration: '30 min',
    meditationTechnique: 'Vipassana',
  },
  {
    id: 'p10',
    author: 'Lyra',
    avatar: '🎵',
    zodiac: 'Waga',
    country: '🇮🇹',
    type: 'AFIRMACJA',
    content: 'Moje granice są aktem miłości. Nie zamykam się — chronię przestrzeń, w której mogę kochać głębiej, być bardziej obecna, dawać z pełni a nie z pustki. Nie przepraszam za to, czego potrzebuję.',
    timeAgo: '1 dzień temu',
    reactions: { resonuje: 734, prawda: 521, czuje: 387, comments: 102 },
  },
  {
    id: 'p11',
    author: 'Sol',
    avatar: '🌞',
    zodiac: 'Rak',
    country: '🇵🇱',
    type: 'SEN',
    content: 'Śniłem o oceanie, który mówił moim głosem. Pytał: czy wiesz, jak głęboki jesteś? Obudziłem się płacząc, ale z dziwnym pokojem. Może podświadomość wie o nas więcej niż chcemy przyjąć na jawie.',
    timeAgo: '2 dni temu',
    reactions: { resonuje: 456, prawda: 312, czuje: 423, comments: 61 },
  },
  {
    id: 'p12',
    author: 'Astrid',
    avatar: '⭐',
    zodiac: 'Bliźnięta',
    country: '🇸🇪',
    type: 'REFLEKSJA',
    content: 'Uświadomiłam sobie, że szukam odpowiedzi w kartach, gwiazdach, liczbach — i wszystkie one mówią to samo: odpowiedź jest już w tobie. Narzędzia są lustrami. Jedyna wyrocznia, której naprawdę ufam, to cisza wewnątrz.',
    timeAgo: '2 dni temu',
    reactions: { resonuje: 801, prawda: 634, czuje: 512, comments: 118 },
  },
];

const SEED_COMMENTS: Record<string, Array<{ id: string; author: string; avatar: string; text: string; likes: number }>> = {
  p1: [
    { id: 'c1', author: 'Arion', avatar: '⚡', text: 'To rezonuje ze mną głęboko. Wieża odwrócona często oznacza, że już przetrwałeś najgorsze.', likes: 14 },
    { id: 'c2', author: 'Vera', avatar: '🌿', text: 'Pięknie napisane. Transformacja przez akceptację, nie walkę.', likes: 9 },
    { id: 'c3', author: 'Kira', avatar: '💎', text: 'Czuję dokładnie to samo. Dziękuję za te słowa.', likes: 21 },
  ],
  p3: [
    { id: 'c1', author: 'Luna', avatar: '🌙', text: 'Technika 4-7-8 zmieniła moje poranki. Polecam też dodać 5 minut zanim wstaniesz z łóżka.', likes: 18 },
    { id: 'c2', author: 'Sol', avatar: '🌞', text: 'Spokój jako wybór — to zdanie zapiszę sobie w dzienniku.', likes: 32 },
  ],
  p7: [
    { id: 'c1', author: 'Nyx', avatar: '🌑', text: 'Gwiazda zawsze przychodzi po próbie. Cieszę się za Ciebie.', likes: 27 },
    { id: 'c2', author: 'Ember', avatar: '🔥', text: 'Nadzieja jako kierunek — to jest właśnie to. Zapisuję.', likes: 15 },
    { id: 'c3', author: 'Astrid', avatar: '⭐', text: 'Piękne. Strzelec i Gwiazda to połączenie, które mówi: leć.', likes: 11 },
    { id: 'c4', author: 'Lyra', avatar: '🎵', text: 'Trzymam kciuki za Twoją podróż. Jesteś gotowy.', likes: 8 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────
const GlobalShareBg = ({ isLight }: { isLight: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight
        ? ['#FAF7F2', '#F5EFE8', '#EFE8DF']
        : ['#08060F', '#0D0916', '#0A0812']}
      style={StyleSheet.absoluteFill}
    />
    {!isLight && (
      <>
        <View style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: '#A78BFA', opacity: 0.04 }} />
        <View style={{ position: 'absolute', top: 200, left: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: '#818CF8', opacity: 0.03 }} />
        <View style={{ position: 'absolute', bottom: 120, right: 20, width: 140, height: 140, borderRadius: 70, backgroundColor: '#EC4899', opacity: 0.03 }} />
      </>
    )}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED STAR PULSE (FAB decoration)
// ─────────────────────────────────────────────────────────────────────────────
const FabGlow = ({ accent }: { accent: string }) => {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.18, { duration: 1400 }), withTiming(1, { duration: 1400 })),
      -1,
      false,
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.35,
  }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 28 }, glowStyle, { backgroundColor: accent }]} />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPE BADGE
// ─────────────────────────────────────────────────────────────────────────────
const TypeBadge = ({ type }: { type: PostTypeKey }) => {
  const def = POST_TYPES[type];
  return (
    <View style={[s.typeBadge, { backgroundColor: def.color + '22', borderColor: def.color + '55' }]}>
      <Text style={[s.typeBadgeText, { color: def.color }]}>{def.emoji} {def.label.toUpperCase()}</Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAROT CARD MINI VISUAL
// ─────────────────────────────────────────────────────────────────────────────
const TarotMini = ({ card, reversed, isLight }: { card: string; reversed: boolean; isLight: boolean }) => (
  <View style={[s.tarotMini, { transform: reversed ? [{ rotate: '180deg' }] : [] }]}>
    <LinearGradient
      colors={['#1A1040', '#2D1B69', '#1A1040']}
      style={s.tarotMiniGrad}
    >
      <Text style={s.tarotMiniStar}>✦</Text>
      <Text style={s.tarotMiniName}>{card}</Text>
      <Text style={s.tarotMiniPos}>{reversed ? 'ODWRÓCONA' : 'PROSTO'}</Text>
    </LinearGradient>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// REACTION BUTTON
// ─────────────────────────────────────────────────────────────────────────────
const ReactionBtn = ({ emoji, count, label, onPress, active, color }: any) => {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSequence(withSpring(1.3, { damping: 6 }), withSpring(1, { damping: 8 }));
    HapticsService.impact();
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[s.reactionBtn, active && { backgroundColor: color + '20', borderColor: color + '60' }, aStyle]}>
        <Text style={s.reactionEmoji}>{emoji}</Text>
        <Text style={[s.reactionCount, active && { color }]}>{count}</Text>
        {label ? <Text style={[s.reactionLabel, active && { color }]}>{label}</Text> : null}
      </Animated.View>
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// POST CARD
// ─────────────────────────────────────────────────────────────────────────────
interface PostCardProps {
  post: FeedPost;
  isLight: boolean;
  index: number;
  onComment: (post: FeedPost) => void;
}

const PostCard = React.memo(({ post, isLight, index, onComment }: PostCardProps) => {
  const [reactions, setReactions] = useState(post.reactions);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const def = POST_TYPES[post.type];
  const cardBg = isLight ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.055)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.09)';
  const textColor = isLight ? '#1A1020' : '#F0EBF8';
  const subColor = isLight ? 'rgba(40,30,60,0.54)' : 'rgba(200,190,220,0.52)';

  const toggle = (key: 'resonuje' | 'prawda' | 'czuje') => {
    setActiveReaction(prev => prev === key ? null : key);
    setReactions(prev => ({
      ...prev,
      [key]: activeReaction === key ? prev[key] - 1 : prev[key] + 1,
    }));
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(14)}>
      <View style={[s.postCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        {/* Top accent line matching type color */}
        <LinearGradient
          colors={[def.color + '00', def.color + '88', def.color + '00']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.postCardAccentLine}
        />

        {/* Header row */}
        <View style={s.postHeader}>
          <View style={[s.avatarCircle, { backgroundColor: def.color + '22', borderColor: def.color + '55' }]}>
            <Text style={s.avatarEmoji}>{post.avatar}</Text>
          </View>
          <View style={s.postMeta}>
            <View style={s.postMetaRow}>
              <Text style={[s.authorName, { color: textColor }]}>{post.author}</Text>
              <Text style={s.countryFlag}>{post.country}</Text>
              {post.anonymous && <Text style={[s.anonBadge, { color: subColor }]}>🔒</Text>}
            </View>
            <View style={s.postMetaRow}>
              <Text style={[s.zodiacText, { color: subColor }]}>{post.zodiac}</Text>
              <Text style={[s.dotSep, { color: subColor }]}>·</Text>
              <Text style={[s.timeText, { color: subColor }]}>{post.timeAgo}</Text>
            </View>
          </View>
          <TypeBadge type={post.type} />
        </View>

        {/* Content */}
        <Text style={[s.postContent, { color: textColor }]}>{post.content}</Text>

        {/* Type-specific extras */}
        {post.type === 'TAROT' && post.tarotCard && (
          <View style={s.extrasRow}>
            <TarotMini card={post.tarotCard} reversed={!!post.tarotReversed} isLight={isLight} />
            <View style={s.tarotInfo}>
              <Text style={[s.tarotCardName, { color: def.color }]}>{post.tarotCard}</Text>
              <View style={[s.tarotPosBadge, {
                backgroundColor: post.tarotReversed ? '#F9731620' : '#10B98120',
                borderColor: post.tarotReversed ? '#F97316' : '#10B981',
              }]}>
                <Text style={[s.tarotPosText, { color: post.tarotReversed ? '#F97316' : '#10B981' }]}>
                  {post.tarotReversed ? '↓ Odwrócona' : '↑ Prosto'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {post.type === 'HOROSKOP' && post.horoscopeSign && (
          <View style={s.horoChip}>
            <MoonStar size={13} color="#818CF8" />
            <Text style={s.horoChipText}>{post.horoscopeSign}</Text>
          </View>
        )}

        {post.type === 'MEDYTACJA' && post.meditationDuration && (
          <View style={s.medChipsRow}>
            <View style={s.medChip}>
              <Clock size={11} color="#10B981" />
              <Text style={s.medChipText}>{post.meditationDuration}</Text>
            </View>
            {post.meditationTechnique && (
              <View style={s.medChip}>
                <Sparkles size={11} color="#10B981" />
                <Text style={s.medChipText}>{post.meditationTechnique}</Text>
              </View>
            )}
          </View>
        )}

        {/* Reactions */}
        <View style={s.reactionsRow}>
          <ReactionBtn
            emoji="✦"
            count={reactions.resonuje}
            label="Rezonuje"
            active={activeReaction === 'resonuje'}
            color={def.color}
            onPress={() => toggle('resonuje')}
          />
          <ReactionBtn
            emoji="💫"
            count={reactions.prawda}
            label="Prawda"
            active={activeReaction === 'prawda'}
            color={def.color}
            onPress={() => toggle('prawda')}
          />
          <ReactionBtn
            emoji="🌙"
            count={reactions.czuje}
            label="Czuję"
            active={activeReaction === 'czuje'}
            color={def.color}
            onPress={() => toggle('czuje')}
          />
          <View style={s.reactionsSpan} />
          <Pressable
            style={s.commentBtn}
            onPress={() => { HapticsService.impact(); onComment(post); }}
          >
            <MessageCircle size={13} color={subColor} />
            <Text style={[s.commentBtnText, { color: subColor }]}>{reactions.comments}</Text>
          </Pressable>
        </View>

        {/* Action row */}
        <View style={[s.actionRow, { borderTopColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.07)' }]}>
          <Pressable
            style={s.actionBtn}
            onPress={() => { HapticsService.impact(); onComment(post); }}
          >
            <MessageCircle size={13} color={subColor} strokeWidth={1.5} />
            <Text style={[s.actionBtnText, { color: subColor }]}>Komentuj</Text>
          </Pressable>
          <View style={[s.actionDivider, { backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)' }]} />
          <Pressable
            style={s.actionBtn}
            onPress={() => HapticsService.impact()}
          >
            <Share2 size={13} color={subColor} strokeWidth={1.5} />
            <Text style={[s.actionBtnText, { color: subColor }]}>Podziel się</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FILTER PANEL (bottom sheet)
// ─────────────────────────────────────────────────────────────────────────────
const FilterPanel = ({ visible, onClose, isLight }: { visible: boolean; onClose: () => void; isLight: boolean }) => {
  const [sortBy, setSortBy] = useState<'nowe' | 'popularne' | 'dzisiaj'>('nowe');
  const bg = isLight ? '#FFFFFF' : '#130D22';
  const textColor = isLight ? '#1A1020' : '#F0EBF8';
  const subColor = isLight ? 'rgba(40,30,60,0.54)' : 'rgba(200,190,220,0.52)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.09)';

  const SORTS = [
    { id: 'nowe',      label: 'Najnowsze' },
    { id: 'popularne', label: 'Najpopularniejsze' },
    { id: 'dzisiaj',   label: 'Tylko dziś' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.filterOverlay} onPress={onClose} />
      <View style={[s.filterSheet, { backgroundColor: bg, borderTopColor: cardBorder }]}>
        <View style={s.filterHandle} />
        <Text style={[s.filterTitle, { color: textColor }]}>Filtry i Sortowanie</Text>
        <Text style={[s.filterSection, { color: subColor }]}>SORTUJ WEDŁUG</Text>
        <View style={s.filterRow}>
          {SORTS.map(sort => (
            <Pressable
              key={sort.id}
              style={[s.filterChip, { borderColor: sortBy === sort.id ? ACCENT : cardBorder },
                sortBy === sort.id && { backgroundColor: ACCENT + '18' }]}
              onPress={() => { setSortBy(sort.id as any); HapticsService.impact(); }}
            >
              <Text style={[s.filterChipText, { color: sortBy === sort.id ? ACCENT : subColor }]}>{sort.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[s.filterSection, { color: subColor, marginTop: 16 }]}>KRAJ POCHODZENIA</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -SP }}>
          <View style={[s.filterRow, { paddingHorizontal: SP }]}>
            {['🌍 Wszystkie', '🇵🇱 Polska', '🇫🇷 Francja', '🇩🇪 Niemcy', '🇬🇧 UK', '🇸🇪 Szwecja', '🇧🇷 Brazylia', '🇯🇵 Japonia'].map(c => (
              <Pressable
                key={c}
                style={[s.filterChip, { borderColor: cardBorder }]}
                onPress={() => HapticsService.impact()}
              >
                <Text style={[s.filterChipText, { color: subColor }]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <Pressable
          style={[s.filterApplyBtn]}
          onPress={() => { HapticsService.impact(); onClose(); }}
        >
          <LinearGradient colors={['#CEAE72', '#B8944E']} style={s.filterApplyGrad}>
            <Text style={s.filterApplyText}>Zastosuj filtry</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSE MODAL
// ─────────────────────────────────────────────────────────────────────────────
const ComposeModal = ({ visible, onClose, onSubmit, isLight }: { visible: boolean; onClose: () => void; onSubmit: (post: FeedPost) => void; isLight: boolean }) => {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<PostTypeKey>('REFLEKSJA');
  const [text, setText] = useState('');
  const [tarotCardInput, setTarotCardInput] = useState('');
  const [tarotReversed, setTarotReversed] = useState(false);
  const [horoscopeSign, setHoroscopeSign] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const insets = useSafeAreaInsets();

  const bg = isLight ? '#FFFFFF' : '#130D22';
  const textColor = isLight ? '#1A1020' : '#F0EBF8';
  const subColor = isLight ? 'rgba(40,30,60,0.54)' : 'rgba(200,190,220,0.52)';
  const inputBg = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)';
  const inputBorder = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.09)';

  const ZODIAC_SIGNS = ['Baran', 'Byk', 'Bliźnięta', 'Rak', 'Lew', 'Panna', 'Waga', 'Skorpion', 'Strzelec', 'Koziorożec', 'Wodnik', 'Ryby'];

  const handleSend = () => {
    if (text.trim().length < 2) return;
    HapticsService.impact();
    const AVATARS = ['🌙', '⭐', '✨', '🌿', '💎', '🔥', '🌺', '🌊', '🕊️', '🌸'];
    const newPost: FeedPost = {
      id: `user_${Date.now()}`,
      author: isAnonymous ? 'Anonimowa dusza' : 'Ty',
      avatar: isAnonymous ? '🌫️' : AVATARS[Math.floor(Math.random() * AVATARS.length)],
      zodiac: '',
      country: '🇵🇱',
      type: selectedType,
      content: text.trim(),
      timeAgo: 'Teraz',
      reactions: { resonuje: 0, prawda: 0, czuje: 0, comments: 0 },
      anonymous: isAnonymous,
      ...(selectedType === 'TAROT' && tarotCardInput ? { tarotCard: tarotCardInput, tarotReversed } : {}),
      ...(selectedType === 'HOROSKOP' && horoscopeSign ? { horoscopeSign } : {}),
    };
    onSubmit(newPost);
    setText('');
    setTarotCardInput('');
    setHoroscopeSign('');
    setTarotReversed(false);
    setIsAnonymous(false);
    setSelectedType('REFLEKSJA');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable style={s.composeOverlay} onPress={onClose} />
        <View style={[s.composeSheet, { backgroundColor: bg, paddingBottom: insets.bottom + 16 }]}>
          <LinearGradient
            colors={[POST_TYPES[selectedType].color + '30', POST_TYPES[selectedType].color + '08']}
            style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}
            pointerEvents="none"
          />
          {/* Handle */}
          <View style={s.filterHandle} />

          {/* Header */}
          <View style={s.composeHeader}>
            <Text style={[s.composeTitle, { color: textColor }]}>Co chcesz podzielić się ze wspólnotą?</Text>
            <Pressable onPress={onClose} style={s.composeClose}>
              <X size={18} color={subColor} />
            </Pressable>
          </View>

          {/* Type selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -SP, marginBottom: 14 }}>
            <View style={[s.filterRow, { paddingHorizontal: SP }]}>
              {(Object.keys(POST_TYPES) as PostTypeKey[]).map(key => {
                const def = POST_TYPES[key];
                const active = selectedType === key;
                return (
                  <Pressable
                    key={key}
                    style={[s.composeTypeChip, {
                      backgroundColor: active ? def.color + '28' : 'transparent',
                      borderColor: active ? def.color : cardBorder,
                    }]}
                    onPress={() => { setSelectedType(key); HapticsService.impact(); }}
                  >
                    <Text style={[s.composeTypeText, { color: active ? def.color : subColor }]}>
                      {def.emoji} {def.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Text input */}
          <TextInput
            style={[s.composeInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
            placeholder="Podziel się swoją duchową chwilą, przemyśleniem, lub wglądem..."
            placeholderTextColor={subColor}
            multiline
            numberOfLines={4}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
            returnKeyType="done"
          />

          {/* Tarot extras */}
          {selectedType === 'TAROT' && (
            <View style={s.composeExtras}>
              <TextInput
                style={[s.composeSmallInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                placeholder="Nazwa karty (np. Gwiazda, Wieża...)"
                placeholderTextColor={subColor}
                value={tarotCardInput}
                onChangeText={setTarotCardInput}
                returnKeyType="done"
              />
              <Pressable
                style={[s.tarotToggle, { borderColor: tarotReversed ? '#F97316' : '#10B981' }]}
                onPress={() => { setTarotReversed(r => !r); HapticsService.impact(); }}
              >
                <Text style={[s.tarotToggleText, { color: tarotReversed ? '#F97316' : '#10B981' }]}>
                  {tarotReversed ? '↓ Odwrócona' : '↑ Prosto'} — kliknij, aby zmienić
                </Text>
              </Pressable>
            </View>
          )}

          {/* Horoscope sign selector */}
          {selectedType === 'HOROSKOP' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -SP, marginBottom: 10 }}>
              <View style={[s.filterRow, { paddingHorizontal: SP }]}>
                {ZODIAC_SIGNS.map(sign => (
                  <Pressable
                    key={sign}
                    style={[s.zodiacChip, {
                      borderColor: horoscopeSign === sign ? '#818CF8' : cardBorder,
                      backgroundColor: horoscopeSign === sign ? '#818CF820' : 'transparent',
                    }]}
                    onPress={() => { setHoroscopeSign(sign); HapticsService.impact(); }}
                  >
                    <Text style={[s.zodiacChipText, { color: horoscopeSign === sign ? '#818CF8' : subColor }]}>{sign}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Anonymous toggle + send */}
          <View style={s.composeBottom}>
            <Pressable
              style={[s.anonToggle, { borderColor: cardBorder, backgroundColor: isAnonymous ? '#CEAE7218' : 'transparent' }]}
              onPress={() => { setIsAnonymous(a => !a); HapticsService.impact(); }}
            >
              {isAnonymous ? <Lock size={14} color={ACCENT} /> : <User size={14} color={subColor} />}
              <Text style={[s.anonToggleText, { color: isAnonymous ? ACCENT : subColor }]}>
                {isAnonymous ? 'Anonimowo' : 'Publicznie'}
              </Text>
            </Pressable>
            <Pressable style={s.sendBtn} onPress={handleSend} disabled={text.trim().length < 2}>
              <LinearGradient colors={text.trim().length >= 2 ? ['#CEAE72', '#B8944E'] : ['#666', '#555']} style={s.sendBtnGrad}>
                <Send size={14} color="#FFF" />
                <Text style={s.sendBtnText}>Wyślij do Wspólnoty</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS MODAL
// ─────────────────────────────────────────────────────────────────────────────
const CommentsModal = ({
  post,
  visible,
  onClose,
  isLight,
}: { post: FeedPost | null; visible: boolean; onClose: () => void; isLight: boolean }) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const currentUser = useAuthStore(s => s.currentUser);
  const insets = useSafeAreaInsets();

  const bg = isLight ? '#FFFFFF' : '#130D22';
  const textColor = isLight ? '#1A1020' : '#F0EBF8';
  const subColor = isLight ? 'rgba(40,30,60,0.54)' : 'rgba(200,190,220,0.52)';
  const inputBg = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)';
  const inputBorder = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.09)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';

  useEffect(() => {
    if (!visible || !post) return;
    setComments([]);
    setLoadingComments(true);
    FeedService.getComments(post.id)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoadingComments(false));
  }, [visible, post?.id]);

  const sendComment = async () => {
    if (!commentText.trim() || !post || !currentUser) return;
    const text = commentText.trim();
    setCommentText('');
    await FeedService.addComment(post.id, { uid: currentUser.uid, displayName: currentUser.displayName ?? 'Dusza' }, text).catch(() => {});
    FeedService.getComments(post.id).then(setComments).catch(() => {});
  };

  if (!post) return null;
  const def = POST_TYPES[post.type];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable style={s.composeOverlay} onPress={onClose} />
        <View style={[s.commentsSheet, { backgroundColor: bg, paddingBottom: insets.bottom + 16 }]}>
          <View style={s.filterHandle} />

          {/* Post preview */}
          <View style={[s.commentPostPreview, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={s.postMetaRow}>
              <Text style={[s.authorName, { color: textColor, fontSize: 13 }]}>{post.avatar} {post.author}</Text>
              <TypeBadge type={post.type} />
            </View>
            <Text style={[s.commentPreviewText, { color: subColor }]} numberOfLines={2}>{post.content}</Text>
          </View>

          {/* Comments list */}
          <Text style={[s.commentsTitle, { color: textColor }]}>Komentarze ({comments.length})</Text>
          <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
            {loadingComments ? (
              <Text style={{ color: subColor, fontSize: 13, textAlign: 'center', paddingVertical: 16 }}>Ładowanie...</Text>
            ) : comments.length === 0 ? (
              <Text style={{ color: subColor, fontSize: 13, textAlign: 'center', paddingVertical: 16 }}>Bądź pierwszą osobą, która skomentuje ✦</Text>
            ) : (
              comments.map((c, i) => (
                <Animated.View key={c.id} entering={FadeInDown.delay(i * 50)} style={[s.commentItem, { borderBottomColor: cardBorder }]}>
                  <View style={[s.commentAvatar, { backgroundColor: def.color + '22' }]}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: def.color }}>{(c.authorName ?? '?').slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.commentAuthor, { color: textColor }]}>{c.authorName}</Text>
                    <Text style={[s.commentText, { color: subColor }]}>{c.text}</Text>
                  </View>
                </Animated.View>
              ))
            )}
          </ScrollView>

          {/* Input */}
          <View style={s.commentInputRow}>
            <TextInput
              style={[s.commentInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor, flex: 1 }]}
              placeholder="Napisz komentarz..."
              placeholderTextColor={subColor}
              value={commentText}
              onChangeText={setCommentText}
              returnKeyType="send"
              onSubmitEditing={sendComment}
            />
            <Pressable
              style={[s.commentSendBtn, { backgroundColor: commentText.trim().length >= 2 ? ACCENT : ACCENT + '44' }]}
              onPress={sendComment}
            >
              <Send size={15} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export const GlobalShareScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
    const currentUser = useAuthStore(s => s.currentUser);
  const textColor = isLight ? '#1A1020' : '#F0EBF8';
  const subColor = isLight ? 'rgba(40,30,60,0.54)' : 'rgba(200,190,220,0.52)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.09)';
  const cardBg = isLight ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.055)';

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const lastFbDocRef = useRef<any>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [commentPost, setCommentPost] = useState<FeedPost | null>(null);
  const [showLive, setShowLive] = useState(true);

  const filteredPosts = activeFilter === 'ALL'
    ? posts
    : posts.filter(p => p.type === activeFilter);

  useEffect(() => {
    // Load real posts from Firebase on mount
    if (currentUser) {
      setLoadingFeed(true);
      FeedService.getPosts(currentUser.uid).then(({ posts: fbPosts, lastDoc }) => {
        lastFbDocRef.current = lastDoc;
        // Map Firebase FeedPost to screen FeedPost shape
        setPosts(fbPosts.map(p => ({
          id: p.id,
          author: p.authorName,
          avatar: p.authorEmoji,
          zodiac: p.authorZodiac,
          country: '🌍',
          type: p.type as any,
          content: p.content,
          timeAgo: formatFeedTimeAgo(p.createdAt),
          reactions: { resonuje: p.reactions.resonuje, prawda: p.reactions.prawda, czuje: p.reactions.czuje, comments: p.commentCount },
          anonymous: false,
        })));
      }).catch(() => {}).finally(() => setLoadingFeed(false));
    } else {
      setLoadingFeed(false);
    }
  }, [currentUser?.uid]);

  const handleNewPost = (post: FeedPost) => {
    setPosts(prev => [post, ...prev]);
    HapticsService.notify();
    // Write to Firebase
    if (currentUser) {
      FeedService.createPost(
        { uid: currentUser.uid, displayName: currentUser.displayName, avatarEmoji: currentUser.avatarEmoji ?? '🌙', zodiacSign: currentUser.zodiacSign ?? '' },
        post.type as any,
        post.content,
      ).catch(() => {});
    }
  };

  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));

  const handleFabPress = () => {
    fabScale.value = withSequence(withSpring(0.88, { damping: 8 }), withSpring(1, { damping: 6 }));
    HapticsService.impact();
    setShowCompose(true);
  };

  const renderPost = useCallback(({ item, index }: { item: FeedPost; index: number }) => (
    <PostCard
      post={item}
      isLight={isLight}
      index={index}
      onComment={setCommentPost}
    />
  ), [isLight]);

  const keyExtractor = useCallback((item: FeedPost) => item.id, []);

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView edges={['top']} style={[s.safeArea, {}]}>

      <GlobalShareBg isLight={isLight} />

      {/* ── HEADER ── */}
      <Animated.View entering={FadeInDown.duration(380)} style={[s.header, { borderBottomColor: cardBorder }]}>
        <Pressable
          style={s.headerBack}
          onPress={() => { HapticsService.impact(); navigation.goBack(); }}
        >
          <ChevronLeft size={22} color={textColor} strokeWidth={1.8} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: textColor }]}>GLOBALNY STRUMIEŃ</Text>
          <View style={s.liveRow}>
            <View style={s.liveDot} />
            <Text style={[s.liveText, { color: subColor }]}>847 dusz online</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pressable
            onPress={() => {
              HapticsService.impact('light');
              if (isFavoriteItem('global-share')) { removeFavoriteItem('global-share'); } else { addFavoriteItem({ id: 'global-share', label: 'Globalny Strumień', route: 'GlobalShare', icon: 'Globe', color: ACCENT, addedAt: Date.now() }); }
            }}
            style={{ padding: 8 }}
          >
            <Star size={20} color="#F59E0B" fill={isFavoriteItem('global-share') ? '#F59E0B' : 'none'} />
          </Pressable>
          <Pressable
            style={[s.headerFilterBtn, { borderColor: cardBorder }]}
            onPress={() => { HapticsService.impact(); setShowFilter(true); }}
          >
            <Sliders size={17} color={textColor} strokeWidth={1.6} />
          </Pressable>
        </View>
      </Animated.View>

      {/* ── FILTER CHIPS ── */}
      <Animated.View entering={FadeInDown.delay(60).duration(340)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[s.filterChipList, { paddingHorizontal: SP }]}
          style={{ marginBottom: 6 }}
        >
          {FILTER_CHIPS.map(chip => {
            const active = activeFilter === chip.id;
            const typeColor = chip.id !== 'ALL' ? POST_TYPES[chip.id as PostTypeKey]?.color : ACCENT;
            return (
              <Pressable
                key={chip.id}
                style={[
                  s.filterTypeChip,
                  {
                    borderColor: active ? (typeColor ?? ACCENT) : cardBorder,
                    backgroundColor: active ? ((typeColor ?? ACCENT) + '18') : 'transparent',
                  },
                ]}
                onPress={() => { setActiveFilter(chip.id); HapticsService.impact(); }}
              >
                <Text style={[s.filterTypeChipText, { color: active ? (typeColor ?? ACCENT) : subColor, fontWeight: active ? '700' : '500' }]}>
                  {chip.label}
                </Text>
                <View style={[s.countBadge, { backgroundColor: active ? (typeColor ?? ACCENT) + '33' : cardBorder }]}>
                  <Text style={[s.countBadgeText, { color: active ? (typeColor ?? ACCENT) : subColor }]}>{chip.count}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* ── LIVE BANNER ── */}
      {showLive && (
        <Animated.View entering={FadeInDown.delay(100).duration(340)} style={[s.liveBanner, { borderColor: '#F59E0B44', backgroundColor: isLight ? '#FEF3C720' : '#F59E0B12' }]}>
          <Sparkles size={13} color="#F59E0B" />
          <Text style={s.liveBannerText}>Nowe posty co kilka sekund · Wspólnota jest aktywna</Text>
          <Pressable onPress={() => setShowLive(false)}>
            <X size={13} color={subColor} />
          </Pressable>
        </Animated.View>
      )}

      {/* ── FEED ── */}
      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        contentContainerStyle={[s.feedContent, { paddingHorizontal: SP }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40, opacity: 0.6 }}>
            <Globe size={40} color={isLight ? '#666' : '#888'} />
            <Text style={{ color: isLight ? '#666' : '#888', marginTop: 12, fontSize: 15, textAlign: 'center' }}>
              {loadingFeed ? 'Łączenie z kosmosem...' : 'Brak postów. Bądź pierwszą duszą!'}
            </Text>
          </View>
        }
        ListFooterComponent={
          <>
            {/* CO DALEJ? */}
            <View style={{ marginTop: 32 }}>
              <Text style={{ color: ACCENT, fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>CO DALEJ?</Text>
              {[
                { route: 'CommunityChat', icon: MessageCircle, label: 'Czaty Wspólnoty', sub: 'Rozmawiaj w czasie rzeczywistym', color: '#6366F1' },
                { route: 'SpiritualChallenges', icon: Flame, label: 'Wyzwania Ducha', sub: 'Podejmij transformacyjne wyzwanie', color: '#F97316' },
                { route: 'CommunityChronicle', icon: BookOpen, label: 'Kronika Wspólnoty', sub: 'Przeczytaj historię duchowej podróży', color: '#E879F9' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <Pressable key={i} onPress={() => navigation.navigate(item.route)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: item.color + '33' }}>
                    <Icon size={20} color={item.color} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: textColor, fontSize: 15, fontWeight: '600' }}>{item.label}</Text>
                      <Text style={{ color: subColor, fontSize: 13, marginTop: 2 }}>{item.sub}</Text>
                    </View>
                    <ChevronRight size={18} color={subColor} />
                  </Pressable>
                );
              })}
            </View>
            <EndOfContentSpacer variant="airy" />
          </>
        }
        initialNumToRender={5}
        maxToRenderPerBatch={6}
        windowSize={10}
      />

      {/* ── FAB COMPOSE BUTTON ── */}
      <Animated.View style={[s.fab, { bottom: insets.bottom + 82 }, fabStyle]}>
        <FabGlow accent={ACCENT} />
        <Pressable onPress={handleFabPress} style={s.fabInner}>
          <LinearGradient colors={['#CEAE72', '#C4983A', '#B8833A']} style={s.fabGrad}>
            <Feather size={20} color="#FFF" strokeWidth={2} />
            <Text style={s.fabText}>Podziel się</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* ── MODALS ── */}
      <FilterPanel visible={showFilter} onClose={() => setShowFilter(false)} isLight={isLight} />
      <ComposeModal visible={showCompose} onClose={() => setShowCompose(false)} onSubmit={handleNewPost} isLight={isLight} />
      <CommentsModal
        post={commentPost}
        visible={!!commentPost}
        onClose={() => setCommentPost(null)}
        isLight={isLight}
      />
        </SafeAreaView>
</View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SP,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBack: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  headerFilterBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 8,
  },

  // ── Filter chips (type selector)
  filterChipList: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
  },
  filterTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTypeChipText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 22,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Live banner
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: SP,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  liveBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#F59E0B',
    letterSpacing: 0.2,
  },

  // ── Feed
  feedContent: {
    paddingTop: 4,
    paddingBottom: 16,
  },

  // ── Post card
  postCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
  },
  postCardAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginTop: 4,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  postMeta: {
    flex: 1,
    gap: 3,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  countryFlag: {
    fontSize: 14,
  },
  anonBadge: {
    fontSize: 12,
  },
  zodiacText: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  dotSep: {
    fontSize: 11,
    opacity: 0.5,
  },
  timeText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.1,
    marginBottom: 12,
  },

  // ── Tarot mini
  extrasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tarotMini: {
    width: 52,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  tarotMiniGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  tarotMiniStar: {
    fontSize: 12,
    color: '#CEAE72',
    marginBottom: 2,
  },
  tarotMiniName: {
    fontSize: 8,
    color: '#F0EBF8',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  tarotMiniPos: {
    fontSize: 6,
    color: 'rgba(200,180,240,0.6)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tarotInfo: {
    gap: 6,
  },
  tarotCardName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tarotPosBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  tarotPosText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ── Horo chip
  horoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#818CF820',
    borderWidth: 1,
    borderColor: '#818CF844',
    marginBottom: 12,
  },
  horoChipText: {
    fontSize: 12,
    color: '#818CF8',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ── Meditation chips
  medChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  medChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#10B98120',
    borderWidth: 1,
    borderColor: '#10B98144',
  },
  medChipText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ── Reactions
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(180,170,200,0.7)',
  },
  reactionLabel: {
    fontSize: 10,
    color: 'rgba(180,170,200,0.5)',
    letterSpacing: 0.2,
  },
  reactionsSpan: {
    flex: 1,
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  commentBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Action row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  actionDivider: {
    width: 1,
    height: 18,
    borderRadius: 1,
  },

  // ── FAB
  fab: {
    position: 'absolute',
    right: SP,
    borderRadius: 28,
    overflow: 'visible',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  fabInner: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  fabGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 28,
  },
  fabText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },

  // ── Filter panel
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  filterSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: SP,
    paddingTop: 12,
    paddingBottom: 32,
  },
  filterHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150,140,170,0.4)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  filterSection: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  filterApplyBtn: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  filterApplyGrad: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 16,
  },
  filterApplyText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ── Compose modal
  composeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  composeSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SP,
    paddingTop: 12,
    overflow: 'hidden',
  },
  composeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  composeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  composeClose: {
    padding: 4,
    marginLeft: 8,
  },
  composeTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  composeTypeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  composeInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 100,
    marginBottom: 12,
  },
  composeExtras: {
    gap: 8,
    marginBottom: 12,
  },
  composeSmallInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  tarotToggle: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  tarotToggleText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  zodiacChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  zodiacChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  composeBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  anonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  anonToggleText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  sendBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  sendBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: 14,
  },
  sendBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Comments modal
  commentsSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SP,
    paddingTop: 12,
    maxHeight: '85%',
  },
  commentPostPreview: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  commentPreviewText: {
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  commentsTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.2,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  commentLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    padding: 2,
  },
  commentLikeCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  commentInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 13,
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
