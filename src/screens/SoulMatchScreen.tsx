// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dimensions, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput,
  StyleSheet, Text, View, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withSequence, withTiming, FadeInDown, withSpring, cancelAnimation,
} from 'react-native-reanimated';
import {
  ChevronLeft, Heart, Star, Users, Zap, Sparkles, Send,
  Moon, Clock, Filter, ArrowRight, MessageCircle, Flame,
  Wind, Droplets, Leaf, Info,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getResolvedTheme } from '../core/theme/tokens';
import { useAuthStore } from '../store/useAuthStore';
import { SoulsService } from '../core/services/community/souls.service';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#EC4899';

// Element colors
const ELEM_COLOR: Record<string, string> = {
  'Ogień':   '#F97316',
  'Woda':    '#6366F1',
  'Ziemia':  '#10B981',
  'Powietrze': '#A78BFA',
};

// Zodiac → Element
const ZODIAC_ELEMENT: Record<string, string> = {
  'Baran': 'Ogień', 'Lew': 'Ogień', 'Strzelec': 'Ogień',
  'Byk': 'Ziemia', 'Panna': 'Ziemia', 'Koziorożec': 'Ziemia',
  'Bliźnięta': 'Powietrze', 'Waga': 'Powietrze', 'Wodnik': 'Powietrze',
  'Rak': 'Woda', 'Skorpion': 'Woda', 'Ryby': 'Woda',
};

// Element compatibility scores
const ELEM_COMPAT: Record<string, Record<string, number>> = {
  'Ogień':     { 'Ogień': 92, 'Powietrze': 85, 'Woda': 68, 'Ziemia': 72 },
  'Woda':      { 'Woda': 93, 'Ziemia': 84, 'Ogień': 68, 'Powietrze': 70 },
  'Ziemia':    { 'Ziemia': 91, 'Woda': 84, 'Powietrze': 67, 'Ogień': 72 },
  'Powietrze': { 'Powietrze': 94, 'Ogień': 85, 'Ziemia': 67, 'Woda': 70 },
};

// Archetype pair bonuses (0-8)
const ARCH_BONUS: Record<string, Record<string, number>> = {
  'Mistyk':     { 'Mistyk': 8, 'Uzdrowiciel': 7, 'Mędrzec': 5, 'Twórca': 4, 'Wojownik': 2, 'Wizjoner': 6 },
  'Wojownik':   { 'Wojownik': 5, 'Wizjoner': 7, 'Twórca': 6, 'Mędrzec': 3, 'Mistyk': 2, 'Uzdrowiciel': 4 },
  'Mędrzec':    { 'Mędrzec': 8, 'Mistyk': 5, 'Wizjoner': 6, 'Twórca': 5, 'Wojownik': 3, 'Uzdrowiciel': 4 },
  'Twórca':     { 'Twórca': 7, 'Wojownik': 6, 'Wizjoner': 7, 'Uzdrowiciel': 5, 'Mistyk': 4, 'Mędrzec': 5 },
  'Uzdrowiciel':{ 'Uzdrowiciel': 9, 'Mistyk': 7, 'Mędrzec': 4, 'Twórca': 5, 'Wojownik': 4, 'Wizjoner': 5 },
  'Wizjoner':   { 'Wizjoner': 8, 'Wojownik': 7, 'Mędrzec': 6, 'Twórca': 7, 'Mistyk': 6, 'Uzdrowiciel': 5 },
};

function calcCompat(userSign: string, userArch: string, profSign: string, profArch: string): number {
  const uElem = ZODIAC_ELEMENT[userSign] || 'Woda';
  const pElem = ZODIAC_ELEMENT[profSign] || 'Ziemia';
  const base = (ELEM_COMPAT[uElem]?.[pElem]) ?? 70;
  const bonus = (ARCH_BONUS[userArch]?.[profArch]) ?? 3;
  return Math.min(99, Math.round(base + bonus));
}

// Module-level animated circle
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RAW_PROFILES = [
  { id: '1',  name: 'Marzena',   sign: 'Ryby',        archetype: 'Mistyk',      emoji: '🌙', traits: ['intuicja', 'głębia', 'uzdrawianie'], desc: 'Twoje energie płyną tym samym rytmem. Intuicja i wewnętrzna mądrość łączą was silną nicią.', spiritual: 96, emotional: 91, energetic: 88 },
  { id: '2',  name: 'Tomasz',    sign: 'Baran',        archetype: 'Wojownik',    emoji: '☀️', traits: ['odwaga', 'działanie', 'siła'],         desc: 'Komplementarna polarność — ogień i woda tworzą parę pełną namiętności i dynamiki.', spiritual: 72, emotional: 68, energetic: 75 },
  { id: '3',  name: 'Agnieszka', sign: 'Bliźnięta',   archetype: 'Twórca',      emoji: '🦋', traits: ['kreatywność', 'ekspresja', 'radość'],   desc: 'Wspólna pasja do sztuki i wyrazu tworzy silną rezonancję dusz, rozpalając wyobraźnię.', spiritual: 84, emotional: 88, energetic: 82 },
  { id: '4',  name: 'Rafał',     sign: 'Skorpion',     archetype: 'Mędrzec',     emoji: '🔮', traits: ['mądrość', 'transformacja', 'prawda'],   desc: 'Oboje szukacie prawdy za zasłoną — głębokie połączenie intelektualne i duchowe.', spiritual: 78, emotional: 74, energetic: 70 },
  { id: '5',  name: 'Kasia',     sign: 'Ryby',         archetype: 'Uzdrowiciel', emoji: '🌸', traits: ['empatia', 'wizja', 'troskliwość'],      desc: 'Dwie dusze wody — niezwykła harmonia energetyczna i wzajemne uzdrawianie.', spiritual: 94, emotional: 97, energetic: 90 },
  { id: '6',  name: 'Marek',     sign: 'Strzelec',     archetype: 'Wizjoner',    emoji: '🌟', traits: ['wolność', 'ekspansja', 'optymizm'],     desc: 'Twój żywioł spotyka ogień — wspólna misja poszerzania granic świadomości.', spiritual: 83, emotional: 79, energetic: 87 },
  { id: '7',  name: 'Zofia',     sign: 'Panna',        archetype: 'Mędrzec',     emoji: '🍃', traits: ['precyzja', 'analiza', 'porządek'],      desc: 'Mądrość ziemi i wody — stabilne i głębokie połączenie budowane krok po kroku.', spiritual: 82, emotional: 85, energetic: 78 },
  { id: '8',  name: 'Adrian',    sign: 'Lew',          archetype: 'Wojownik',    emoji: '🦁', traits: ['liderstwo', 'charyzma', 'ochrona'],     desc: 'Ognista charyzma spotyka twoją głębię — wzajemna inspiracja i silna polarność.', spiritual: 70, emotional: 66, energetic: 74 },
  { id: '9',  name: 'Natalia',   sign: 'Waga',         archetype: 'Twórca',      emoji: '⚖️', traits: ['harmonia', 'piękno', 'równowaga'],     desc: 'Dwie estetyczne dusze — wspólne dążenie do piękna i wewnętrznej harmonii.', spiritual: 86, emotional: 90, energetic: 84 },
  { id: '10', name: 'Piotr',     sign: 'Koziorożec',   archetype: 'Mędrzec',     emoji: '🏔️', traits: ['dyscyplina', 'ambicja', 'cierpliwość'], desc: 'Mądrość ziemi i głębia wody — fundamentalne połączenie o długotrwałym potencjale.', spiritual: 81, emotional: 83, energetic: 79 },
  { id: '11', name: 'Ewa',       sign: 'Rak',          archetype: 'Uzdrowiciel', emoji: '🌊', traits: ['troska', 'rodzina', 'intuicja'],         desc: 'Dwie intuicyjne dusze wody — emocjonalna głębia i wzajemne uzdrawianie serc.', spiritual: 95, emotional: 98, energetic: 91 },
  { id: '12', name: 'Kamil',     sign: 'Wodnik',       archetype: 'Wizjoner',    emoji: '⚡', traits: ['innowacja', 'rewolucja', 'niezależność'], desc: 'Wizja i intuicja — spotkanie umysłu przyszłości z sercem głębin.', spiritual: 77, emotional: 71, energetic: 80 },
  { id: '13', name: 'Dominika',  sign: 'Byk',          archetype: 'Uzdrowiciel', emoji: '🌺', traits: ['stabilność', 'zmysłowość', 'wytrwałość'], desc: 'Ziemia i woda — stabilna miłość pielęgnująca twój wzrost duchowy.', spiritual: 88, emotional: 92, energetic: 85 },
  { id: '14', name: 'Łukasz',    sign: 'Bliźnięta',   archetype: 'Twórca',      emoji: '🎭', traits: ['ciekawość', 'elastyczność', 'komunikacja'], desc: 'Powietrze i woda — dialog dusz, pełen inspiracji i wzajemnego zrozumienia.', spiritual: 75, emotional: 78, energetic: 73 },
  { id: '15', name: 'Monika',    sign: 'Strzelec',     archetype: 'Mistyk',      emoji: '🔥', traits: ['duchowość', 'przygoda', 'mądrość'],     desc: 'Mistyczna podróż wspólnie — dwa serca szukające wyższych prawd i sensu.', spiritual: 89, emotional: 86, energetic: 84 },
];

const ICE_BREAKERS = [
  'Jakie jest Twoje ulubione ćwiczenie medytacyjne?',
  'Czy miałeś/aś kiedyś sny prorocze?',
  'Która faza księżyca najbardziej na Ciebie wpływa?',
  'Jaki jest Twój znak rosnący?',
  'Czym jest dla Ciebie duchowość?',
  'Jakie miejsce w naturze przywraca Ci energię?',
  'Czy wierzysz w przeznaczenie dusz?',
  'Jaką mantrę powtarzasz w trudnych chwilach?',
];

const ARCHETYPES = ['WSZYSTKIE', 'MISTYK', 'WOJOWNIK', 'MĘDRZEC', 'TWÓRCA', 'UZDROWICIEL', 'WIZJONER'];
const SORTS = ['Najwyższy rezonans', 'Element', 'Najnowsi'];

const ARC_R = 54;
const ARC_CIRCUM = 2 * Math.PI * ARC_R;

function getIceBreaker(id: string): string {
  const idx = parseInt(id, 10) % ICE_BREAKERS.length;
  return ICE_BREAKERS[idx];
}

function ElementBadge({ element, size = 'sm' }: { element: string; size?: 'sm' | 'md' }) {
  const color = ELEM_COLOR[element] || ACCENT;
  const icons: Record<string, any> = {
    'Ogień': Flame, 'Woda': Droplets, 'Ziemia': Leaf, 'Powietrze': Wind,
  };
  const Icon = icons[element] || Sparkles;
  const pad = size === 'md' ? { paddingHorizontal: 10, paddingVertical: 4 } : { paddingHorizontal: 8, paddingVertical: 3 };
  const fs = size === 'md' ? 11 : 10;
  return (
    <View style={[styles.elemBadge, { backgroundColor: color + '22', borderColor: color + '55' }, pad]}>
      <Icon size={fs} color={color} />
      <Text style={[styles.elemBadgeText, { color, fontSize: fs }]}>{element}</Text>
    </View>
  );
}

export const SoulMatchScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
    const currentUser = useAuthStore(s => s.currentUser);
  const textColor  = isLight ? '#1A0010' : '#FFF0F8';
  const subColor   = isLight ? 'rgba(26,0,16,0.55)' : 'rgba(255,240,248,0.55)';
  const cardBg     = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.11)';
  const tabBg      = isLight ? 'rgba(255,248,234,0.92)' : 'rgba(255,255,255,0.08)';
  const inputBg    = isLight ? 'rgba(255,248,234,0.92)' : 'rgba(255,255,255,0.07)';

  const [activeTab, setActiveTab] = useState<'odkryj' | 'polaczone' | 'historia'>('odkryj');
  const [filter, setFilter] = useState('WSZYSTKIE');
  const [sort, setSort]   = useState('Najwyższy rezonans');
  const [showSort, setShowSort] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [intentionInputs, setIntentionInputs] = useState<Record<string, string>>({});
  const [sentIntentions, setSentIntentions] = useState<Array<{
    id: string; name: string; compat: number; question: string; date: string;
  }>>([]);
  const [browseCount, setBrowseCount] = useState(15);

  const userSign    = userData?.zodiacSign || 'Ryby';
  const userArch    = userData?.archetype  || 'Mistyk';
  const userElement = ZODIAC_ELEMENT[userSign] || 'Woda';

  // Compute profiles with real compat
  const profiles = useMemo(() => RAW_PROFILES.map(p => ({
    ...p,
    compat: calcCompat(userSign, userArch, p.sign, p.archetype),
    element: ZODIAC_ELEMENT[p.sign] || 'Ziemia',
  })), [userSign, userArch]);

  // Average resonance
  const avgResonance = useMemo(() => Math.round(profiles.reduce((s, p) => s + p.compat, 0) / profiles.length), [profiles]);

  // Filtered + sorted list
  const displayProfiles = useMemo(() => {
    let list = [...profiles];
    if (filter !== 'WSZYSTKIE') {
      list = list.filter(p => p.archetype.toUpperCase() === filter);
    }
    if (sort === 'Najwyższy rezonans') list.sort((a, b) => b.compat - a.compat);
    else if (sort === 'Element') list.sort((a, b) => a.element.localeCompare(b.element));
    // else Najnowsi — keep original order
    return list;
  }, [profiles, filter, sort]);

  const connectedProfiles = useMemo(() => profiles.filter(p => connectedIds.includes(p.id)), [profiles, connectedIds]);

  // Load real connections from Firebase on mount
  useEffect(() => {
    if (!currentUser) return;
    SoulsService.getConnections(currentUser.uid)
      .then(ids => { if (ids.length > 0) setConnectedIds(ids); })
      .catch(() => {});
  }, [currentUser]);

  // Arc animation
  const energyArc  = useSharedValue(0);
  const auraScale  = useSharedValue(1);
  const auraOpacity = useSharedValue(0.5);

  useEffect(() => {
    energyArc.value = withTiming(1, { duration: 2200 });
    auraScale.value = withRepeat(withSequence(withTiming(1.14, { duration: 2800 }), withTiming(1, { duration: 2800 })), -1, false);
    auraOpacity.value = withRepeat(withSequence(withTiming(0.85, { duration: 2800 }), withTiming(0.45, { duration: 2800 })), -1, false);
    return () => {
      cancelAnimation(energyArc);
      cancelAnimation(auraScale);
      cancelAnimation(auraOpacity);
    };
  }, []);

  const auraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: auraScale.value }],
    opacity: auraOpacity.value,
  }));

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: ARC_CIRCUM - energyArc.value * ARC_CIRCUM * (avgResonance / 100),
  }));

  const handleExpand = (id: string) => {
    HapticsService.impact();
    setBrowseCount(c => c + 1);
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getDateStr = () => {
    const d = new Date();
    return `${d.getDate()}.${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleConnect = (profile: typeof profiles[0]) => {
    HapticsService.notify();
    if (!connectedIds.includes(profile.id)) {
      setConnectedIds(prev => [...prev, profile.id]);
      const iceBreaker = getIceBreaker(profile.id);
      setSentIntentions(prev => [{
        id: profile.id,
        name: profile.name,
        compat: profile.compat,
        question: iceBreaker,
        date: getDateStr(),
      }, ...prev]);
      // Write connection to Firebase
      if (currentUser) {
        SoulsService.connect(currentUser.uid, profile.id, iceBreaker).catch(() => {});
      }
    }
    setExpandedId(null);
  };

  const handleSendMessage = (profileId: string) => {
    const msg = intentionInputs[profileId]?.trim();
    if (!msg || msg.length < 2) return;
    HapticsService.notify();
    const prof = profiles.find(p => p.id === profileId);
    if (prof) {
      setSentIntentions(prev => [{
        id: prof.id, name: prof.name, compat: prof.compat, question: msg, date: getDateStr(),
      }, ...prev]);
    }
    setIntentionInputs(prev => ({ ...prev, [profileId]: '' }));
    // Navigate to private chat
    if (currentUser && navigation) {
      const roomId = [currentUser.uid, profileId].sort().join('_');
      navigation.navigate('CommunityChat', { roomId, roomName: prof?.name ?? 'Soul' });
    }
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderResonanceMeter = () => (
    <Animated.View entering={FadeInDown.delay(50)} style={styles.resonanceWrap}>
      <Animated.View style={[styles.auraRing, { borderColor: ACCENT + '30' }, auraStyle]} />
      <View style={styles.arcContainer}>
        <Svg width={148} height={148} viewBox="0 0 148 148">
          <Circle cx={74} cy={74} r={ARC_R} fill="none" stroke={ACCENT + '20'} strokeWidth={9} />
          <AnimatedCircle
            cx={74} cy={74} r={ARC_R}
            fill="none" stroke={ACCENT} strokeWidth={9}
            strokeDasharray={ARC_CIRCUM}
            animatedProps={arcProps}
            strokeLinecap="round"
            transform="rotate(-90 74 74)"
          />
        </Svg>
        <View style={styles.arcCenter}>
          <Text style={[styles.arcPercent, { color: ACCENT }]}>{avgResonance}%</Text>
          <Text style={[styles.arcLabel, { color: subColor }]}>{t('soulMatch.rezonans', 'rezonans')}</Text>
        </View>
      </View>
      <Text style={[styles.resonanceTitle, { color: textColor }]}>{t('soulMatch.twoj_kosmiczny_rezonans', 'Twój Kosmiczny Rezonans')}</Text>
      <Text style={[styles.resonanceSub, { color: subColor }]}>{t('soulMatch.srednie_dopasowani_z_duszami_w', 'Średnie dopasowanie z duszami w galaktyce')}</Text>
    </Animated.View>
  );

  const renderUserCard = () => (
    <Animated.View entering={FadeInDown.delay(120)}>
      <LinearGradient
        colors={[ACCENT + '28', ACCENT + '10']}
        style={[styles.userCard, { borderColor: ACCENT + '45' }]}
      >
        <Text style={[styles.userCardLabel, { color: ACCENT }]}>{t('soulMatch.twoj_profil_duszy', 'TWÓJ PROFIL DUSZY')}</Text>
        <View style={styles.userCardRow}>
          <View style={[styles.userAvatar, { borderColor: ACCENT + '60', backgroundColor: ACCENT + '22' }]}>
            <Text style={styles.userAvatarEmoji}>✨</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userCardName, { color: textColor }]}>{userData?.name || 'Poszukiwacz'}</Text>
            <Text style={[styles.userCardSub, { color: subColor }]}>{userSign} · {userArch}</Text>
          </View>
          <ElementBadge element={userElement} size="md" />
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderFilters = () => (
    <Animated.View entering={FadeInDown.delay(160)}>
      <View style={styles.sortRow}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('soulMatch.dusze_w_rezonansie', 'Dusze w Rezonansie')}</Text>
        <Pressable onPress={() => setShowSort(!showSort)}
          style={[styles.sortBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Filter size={12} color={subColor} />
          <Text style={[styles.sortBtnText, { color: subColor }]}>{sort}</Text>
        </Pressable>
      </View>
      {showSort && (
        <Animated.View entering={FadeInDown} style={[styles.sortDropdown, { backgroundColor: isLight ? '#FFF' : '#1E0612', borderColor: cardBorder }]}>
          {SORTS.map(s => (
            <Pressable key={s} onPress={() => { setSort(s); setShowSort(false); }}
              style={[styles.sortItem, sort === s && { backgroundColor: ACCENT + '18' }]}>
              <Text style={[styles.sortItemText, { color: sort === s ? ACCENT : textColor }]}>{s}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ gap: 8, paddingRight: layout.padding.screen }}>
        {ARCHETYPES.map(chip => (
          <Pressable key={chip} onPress={() => setFilter(chip)}
            style={[styles.chip, { borderColor: filter === chip ? ACCENT : cardBorder },
              filter === chip && { backgroundColor: ACCENT + '22' }]}>
            <Text style={[styles.chipText, { color: filter === chip ? ACCENT : subColor }]}>{chip}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderCompatBreakdown = (profile: typeof profiles[0]) => (
    <View style={styles.breakdownGrid}>
      {[
        { label: 'Duchowa', value: profile.spiritual },
        { label: 'Emocjonalna', value: profile.emotional },
        { label: 'Energetyczna', value: profile.energetic },
      ].map(({ label, value }) => (
        <View key={label} style={styles.breakdownItem}>
          <Text style={[styles.breakdownLabel, { color: subColor }]}>{label}</Text>
          <View style={[styles.breakdownBar, { backgroundColor: cardBorder }]}>
            <View style={[styles.breakdownFill, { width: `${value}%`, backgroundColor: ELEM_COLOR[profile.element] || ACCENT }]} />
          </View>
          <Text style={[styles.breakdownPct, { color: textColor }]}>{value}%</Text>
        </View>
      ))}
    </View>
  );

  const renderProfileCard = (profile: typeof profiles[0], index: number) => {
    const expanded  = expandedId === profile.id;
    const connected = connectedIds.includes(profile.id);
    const elemColor = ELEM_COLOR[profile.element] || ACCENT;

    return (
      <Animated.View key={profile.id} entering={FadeInDown.delay(200 + index * 60)}>
        <Pressable onPress={() => handleExpand(profile.id)}
          style={[styles.matchCard, { backgroundColor: cardBg, borderColor: expanded ? ACCENT + '50' : cardBorder }]}>
          {/* Header row */}
          <View style={styles.matchRow}>
            <View style={[styles.avatar, { backgroundColor: elemColor + '22', borderColor: elemColor + '55' }]}>
              <Text style={styles.avatarEmoji}>{profile.emoji}</Text>
            </View>
            <View style={styles.matchInfo}>
              <View style={styles.matchNameRow}>
                <Text style={[styles.matchName, { color: textColor }]}>{profile.name}</Text>
                <ElementBadge element={profile.element} />
              </View>
              <Text style={[styles.matchSub, { color: subColor }]}>{profile.sign} · {profile.archetype}</Text>
              <View style={styles.compatRow}>
                <View style={[styles.compatBar, { backgroundColor: cardBorder }]}>
                  <View style={[styles.compatFill, { width: `${profile.compat}%`, backgroundColor: profile.compat >= 85 ? '#10B981' : profile.compat >= 70 ? ACCENT : '#F97316' }]} />
                </View>
                <Text style={[styles.compatPct, { color: profile.compat >= 85 ? '#10B981' : ACCENT }]}>{profile.compat}%</Text>
              </View>
            </View>
          </View>

          {/* Expanded */}
          {expanded && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.expandedContent}>
              {/* Description */}
              <Text style={[styles.expandDesc, { color: subColor }]}>{profile.desc}</Text>

              {/* Traits */}
              <View style={styles.traitRow}>
                {profile.traits.map(tr => (
                  <View key={tr} style={[styles.traitChip, { backgroundColor: elemColor + '18', borderColor: elemColor + '45' }]}>
                    <Text style={[styles.traitText, { color: elemColor }]}>{tr}</Text>
                  </View>
                ))}
              </View>

              {/* Compatibility Breakdown */}
              <Text style={[styles.breakdownTitle, { color: subColor }]}>{t('soulMatch.analiza_rezonansu', 'ANALIZA REZONANSU')}</Text>
              {renderCompatBreakdown(profile)}

              {/* Ice-breaker */}
              <View style={[styles.iceBreakerBox, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '35' }]}>
                <MessageCircle size={13} color={ACCENT} />
                <Text style={[styles.iceBreakerText, { color: subColor }]}>{getIceBreaker(profile.id)}</Text>
              </View>

              {/* Action */}
              {!connected ? (
                <Pressable onPress={() => handleConnect(profile)}
                  style={[styles.connectBtn, { backgroundColor: ACCENT }]}>
                  <Send size={14} color="#FFF" />
                  <Text style={styles.connectText}>{t('soulMatch.wyslij_kosmiczna_intencje', 'Wyślij Kosmiczną Intencję')}</Text>
                </Pressable>
              ) : (
                <View style={[styles.sentBadge, { borderColor: '#10B981' + '55', backgroundColor: '#10B981' + '12' }]}>
                  <Sparkles size={13} color="#10B981" />
                  <Text style={[styles.sentText, { color: '#10B981' }]}>{t('soulMatch.intencja_wyslana', 'Intencja wysłana ✦')}</Text>
                </View>
              )}
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  const renderStats = () => (
    <Animated.View entering={FadeInDown.delay(180)}>
      <View style={[styles.statsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Text style={[styles.statsSectionTitle, { color: textColor }]}>{t('soulMatch.kosmiczne_statystyki', 'KOSMICZNE STATYSTYKI')}</Text>
        <View style={styles.statsRow}>
          {[
            { label: 'Przeglądane', value: browseCount },
            { label: 'Połączenia', value: connectedIds.length },
            { label: 'Śr. rezonans', value: `${avgResonance}%` },
          ].map(({ label, value }) => (
            <View key={label} style={styles.statItem}>
              <Text style={[styles.statValue, { color: ACCENT }]}>{value}</Text>
              <Text style={[styles.statLabel, { color: subColor }]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );

  const renderHowItWorks = () => (
    <Animated.View entering={FadeInDown.delay(220)}>
      <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.infoHeader}>
          <Info size={15} color={ACCENT} />
          <Text style={[styles.infoTitle, { color: textColor }]}>{t('soulMatch.jak_dziala_dopasowani', 'JAK DZIAŁA DOPASOWANIE?')}</Text>
        </View>
        {[
          '✦ Porównujemy żywioły Waszych znaków zodiaku — spójność elementów daje bazę rezonansu.',
          '✦ Analizujemy pary archetypów dusz, które naturalnie wzajemnie się uzupełniają.',
          '✦ Wynik łączy kompatybilność duchową, emocjonalną i energetyczną w jeden procent.',
        ].map((line, i) => (
          <Text key={i} style={[styles.infoLine, { color: subColor }]}>{line}</Text>
        ))}
      </View>
    </Animated.View>
  );

  const renderQuickLinks = () => (
    <Animated.View entering={FadeInDown.delay(260)}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>{t('soulMatch.co_dalej', '✦ CO DALEJ?')}</Text>
      <View style={styles.quickLinksRow}>
        {[
          { label: 'Krąg Energii', sub: 'Wspólna praktyka', route: 'EnergyCircle', color: '#A78BFA', icon: Zap },
          { label: 'Czat Duszy', sub: 'Rozmowy wspólnoty', route: 'CommunityChat', color: '#6366F1', icon: Users },
          { label: 'Wyrocznia', sub: 'Zapytaj o połączenie', route: 'OracleChat', color: ACCENT, icon: Sparkles },
        ].map(({ label, sub, route, color, icon: Icon }) => (
          <Pressable key={route} onPress={() => navigation.navigate(route)}
            style={[styles.quickCard, { backgroundColor: color + '15', borderColor: color + '40' }]}>
            <Icon size={20} color={color} />
            <Text style={[styles.quickCardLabel, { color: textColor }]}>{label}</Text>
            <Text style={[styles.quickCardSub, { color: subColor }]}>{sub}</Text>
            <ArrowRight size={12} color={color} />
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );

  // ─── Tabs content ─────────────────────────────────────────────────────────

  const renderOdkryjTab = () => (
    <>
      {renderResonanceMeter()}
      {renderUserCard()}
      {renderFilters()}
      {displayProfiles.map((p, i) => renderProfileCard(p, i))}
      {renderStats()}
      {renderHowItWorks()}
      {renderQuickLinks()}
      <EndOfContentSpacer size="standard" />
    </>
  );

  const renderPolaczoneTab = () => (
    <>
      {connectedProfiles.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(80)} style={styles.emptyState}>
          <Moon size={40} color={subColor} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>{t('soulMatch.brak_polaczen', 'Brak połączeń')}</Text>
          <Text style={[styles.emptySub, { color: subColor }]}>{t('soulMatch.wyslij_kosmiczna_intencje_do_profil', 'Wyślij Kosmiczną Intencję do profilu w zakładce ODKRYJ, aby nawiązać połączenie duszy.')}</Text>
        </Animated.View>
      ) : (
        connectedProfiles.map((p, i) => {
          const elemColor = ELEM_COLOR[p.element] || ACCENT;
          return (
            <Animated.View key={p.id} entering={FadeInDown.delay(80 + i * 60)}>
              <View style={[styles.connectedCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.connectedHeader}>
                  <View style={[styles.avatar, { backgroundColor: elemColor + '22', borderColor: elemColor + '55' }]}>
                    <Text style={styles.avatarEmoji}>{p.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.matchName, { color: textColor }]}>{p.name}</Text>
                    <Text style={[styles.matchSub, { color: subColor }]}>{p.sign} · {p.archetype}</Text>
                  </View>
                  <Text style={[styles.compatPctLg, { color: '#10B981' }]}>{p.compat}%</Text>
                </View>
                <Pressable onPress={() => navigation.navigate('EnergyCircle')}
                  style={[styles.connectedBtn, { backgroundColor: '#A78BFA' + '22', borderColor: '#A78BFA' + '55' }]}>
                  <Zap size={13} color="#A78BFA" />
                  <Text style={[styles.connectedBtnText, { color: '#A78BFA' }]}>{t('soulMatch.wspolna_medytacja', 'Wspólna medytacja')}</Text>
                </Pressable>
                <View style={[styles.intentionInputRow, { backgroundColor: inputBg, borderColor: cardBorder }]}>
                  <TextInput
                    style={[styles.intentionInput, { color: textColor }]}
                    placeholder={t('soulMatch.napisz_intencje', 'Napisz intencję...')}
                    placeholderTextColor={subColor}
                    value={intentionInputs[p.id] || ''}
                    onChangeText={v => setIntentionInputs(prev => ({ ...prev, [p.id]: v }))}
                    multiline={false}
                    returnKeyType="send"
                    onSubmitEditing={() => handleSendMessage(p.id)}
                  />
                  <Pressable onPress={() => handleSendMessage(p.id)} style={styles.intentionSendBtn}>
                    <Send size={16} color={ACCENT} />
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          );
        })
      )}
      <EndOfContentSpacer size="standard" />
    </>
  );

  const renderHistoriaTab = () => (
    <>
      {sentIntentions.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(80)} style={styles.emptyState}>
          <Clock size={40} color={subColor} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>{t('soulMatch.brak_historii', 'Brak historii')}</Text>
          <Text style={[styles.emptySub, { color: subColor }]}>{t('soulMatch.wyslane_intencje_i_wiadomosci_pojaw', 'Wysłane intencje i wiadomości pojawią się tutaj jako oś czasu Twoich kosmicznych połączeń.')}</Text>
        </Animated.View>
      ) : (
        sentIntentions.map((intent, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(60 + i * 50)}>
            <View style={[styles.timelineItem, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={[styles.timelineDot, { backgroundColor: ACCENT }]} />
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={[styles.timelineName, { color: textColor }]}>{intent.name}</Text>
                  <Text style={[styles.timelineCompat, { color: '#10B981' }]}>{intent.compat}%</Text>
                </View>
                <Text style={[styles.timelineQuestion, { color: subColor }]}>"{intent.question}"</Text>
                <Text style={[styles.timelineDate, { color: subColor }]}>{intent.date}</Text>
              </View>
            </View>
          </Animated.View>
        ))
      )}
      <EndOfContentSpacer size="standard" />
    </>
  );

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={[styles.safe, {}]} edges={['top']}>

      <LinearGradient
        colors={isLight ? ['#FDF2F8', '#FCE7F3', currentTheme.background] : ['#12040A', '#1E0612', currentTheme.background]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('soulMatch.kosmiczne_dopasowani', 'Kosmiczne Dopasowanie')}</Text>
        <Heart size={20} color={ACCENT} />
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: tabBg, borderColor: cardBorder }]}>
        {([
          { key: 'odkryj', label: 'ODKRYJ' },
          { key: 'polaczone', label: `POŁĄCZONE${connectedIds.length > 0 ? ` (${connectedIds.length})` : ''}` },
          { key: 'historia', label: 'HISTORIA' },
        ] as Array<{ key: 'odkryj' | 'polaczone' | 'historia'; label: string }>).map(tab => (
          <Pressable key={tab.key} onPress={() => { setActiveTab(tab.key); HapticsService.impact(); }}
            style={styles.tabItem}>
            <Text style={[styles.tabLabel, {
              color: activeTab === tab.key ? ACCENT : subColor,
              fontWeight: activeTab === tab.key ? '700' : '500',
            }]}>{tab.label}</Text>
            {activeTab === tab.key && <View style={[styles.tabUnderline, { backgroundColor: ACCENT }]} />}
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'odkryj'    && renderOdkryjTab()}
          {activeTab === 'polaczone' && renderPolaczoneTab()}
          {activeTab === 'historia'  && renderHistoriaTab()}
        </ScrollView>
      </KeyboardAvoidingView>
        </SafeAreaView>
</View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.padding.screen, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: 0.4 },

  tabBar: {
    flexDirection: 'row', marginHorizontal: layout.padding.screen,
    borderRadius: 14, borderWidth: 1, marginBottom: 4, overflow: 'hidden',
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, position: 'relative' },
  tabLabel: { fontSize: 11, letterSpacing: 0.6 },
  tabUnderline: { position: 'absolute', bottom: 0, left: 10, right: 10, height: 2, borderRadius: 1 },

  scroll: { paddingHorizontal: layout.padding.screen, paddingTop: 8 },

  // Resonance meter
  resonanceWrap: { alignItems: 'center', marginBottom: 16, paddingTop: 4 },
  auraRing: { position: 'absolute', width: 178, height: 178, borderRadius: 89, borderWidth: 1.5 },
  arcContainer: { alignItems: 'center', justifyContent: 'center', width: 148, height: 148 },
  arcCenter: { position: 'absolute', alignItems: 'center' },
  arcPercent: { fontSize: 30, fontWeight: '800' },
  arcLabel: { fontSize: 11, marginTop: 1, letterSpacing: 0.5 },
  resonanceTitle: { fontSize: 15, fontWeight: '700', marginTop: 10 },
  resonanceSub: { fontSize: 12, marginTop: 3, textAlign: 'center' },

  // User card
  userCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 14 },
  userCardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8 },
  userCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  userAvatarEmoji: { fontSize: 22 },
  userCardName: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  userCardSub: { fontSize: 12 },

  // Sort + filters
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  sortBtnText: { fontSize: 11 },
  sortDropdown: { borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: 'hidden', zIndex: 10 },
  sortItem: { paddingHorizontal: 14, paddingVertical: 10 },
  sortItemText: { fontSize: 13, fontWeight: '600' },
  chipScroll: { marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.7 },

  // Profile card
  matchCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 22 },
  matchInfo: { flex: 1 },
  matchNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  matchName: { fontSize: 15, fontWeight: '700' },
  matchSub: { fontSize: 12, marginBottom: 6 },
  compatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compatBar: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  compatFill: { height: 5, borderRadius: 3 },
  compatPct: { fontSize: 12, fontWeight: '700', width: 34 },
  compatPctLg: { fontSize: 16, fontWeight: '800' },

  // Expanded
  expandedContent: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.12)' },
  expandDesc: { fontSize: 13, lineHeight: 20, marginBottom: 10 },
  traitRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  traitChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  traitText: { fontSize: 11, fontWeight: '600' },
  breakdownTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  breakdownGrid: { gap: 6, marginBottom: 12 },
  breakdownItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownLabel: { fontSize: 11, width: 90 },
  breakdownBar: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  breakdownFill: { height: 4, borderRadius: 2 },
  breakdownPct: { fontSize: 11, fontWeight: '700', width: 30, textAlign: 'right' },
  iceBreakerBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 12 },
  iceBreakerText: { flex: 1, fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  connectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, padding: 13 },
  connectText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  sentBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 12, padding: 11 },
  sentText: { fontSize: 13, fontWeight: '700' },

  // Element badge
  elemBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, borderWidth: 1 },
  elemBadgeText: { fontWeight: '700', letterSpacing: 0.3 },

  // Stats
  statsCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  statsSectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11 },

  // Info / how it works
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  infoTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  infoLine: { fontSize: 12, lineHeight: 20, marginBottom: 4 },

  // Quick links
  quickLinksRow: { flexDirection: 'row', gap: 8, marginBottom: 14, marginTop: 6 },
  quickCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center', gap: 5 },
  quickCardLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  quickCardSub: { fontSize: 10, textAlign: 'center' },

  // Connected tab
  connectedCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  connectedHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  connectedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 10 },
  connectedBtnText: { fontSize: 12, fontWeight: '700' },
  intentionInputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4 },
  intentionInput: { flex: 1, fontSize: 13, paddingVertical: 8 },
  intentionSendBtn: { padding: 6 },

  // History tab
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  timelineContent: { flex: 1 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  timelineName: { fontSize: 14, fontWeight: '700' },
  timelineCompat: { fontSize: 12, fontWeight: '700' },
  timelineQuestion: { fontSize: 12, lineHeight: 18, fontStyle: 'italic', marginBottom: 4 },
  timelineDate: { fontSize: 10 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
