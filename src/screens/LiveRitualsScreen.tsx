// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert, Dimensions, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, FadeInDown, withSpring, interpolate, Extrapolation,
} from 'react-native-reanimated';
import {
  ChevronLeft, Flame, MoonStar, Zap, Globe2, Clock, Users,
  X, ChevronRight, Trophy, Plus, Droplets, Wind, Star,
  BookmarkPlus, CheckCircle2, Edit3, Trash2, Lock, Unlock,
  LayoutGrid, Radio, Archive, Waves, Sparkles,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { RitualsService, Ritual as FBRitual } from '../core/services/community/rituals.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#DC2626';
const P = layout.padding.screen;

const TYPE_COLORS: Record<string, string> = {
  KSIĘŻYC: '#818CF8',
  OGIEŃ: '#F97316',
  CZAKRY: '#10B981',
  MEDYTACJA: '#6366F1',
  WODA: '#38BDF8',
};

// Initial countdown values in seconds; negative = already live
const INITIAL_SECONDS: Record<string, number> = {
  'r1': -1,
  'r2': -1,
  'r3': -1,
  'r4': 12 * 60,
  'r5': 28 * 60,
  'r6': 80 * 60 + 15 * 60,
  'r7': 165 * 60,
  'r8': 210 * 60 + 30 * 60,
  'r9': 24 * 60 * 60 + 9 * 60 * 60,
  'r10': 24 * 60 * 60 + 14 * 60 * 60 + 30 * 60,
  'r11': 24 * 60 * 60 + 18 * 60 * 60,
  'r12': 24 * 60 * 60 + 21 * 60 * 60 + 15 * 60,
};

const RITUALS_BASE = [
  {
    id: 'r1',
    title: 'Nowy Księżyc — Rytuał Uwalniania',
    host: 'Katarzyna M.',
    participants: 234,
    type: 'KSIĘŻYC',
    icon: MoonStar,
    color: TYPE_COLORS.KSIĘŻYC,
    live: true,
    desc: 'Uwolnij to, co Cię blokuje podczas mocy nowiu. Przynieś kartkę papieru i coś do pisania. W tym rytuale pracujemy z energią pustki i odnowienia.',
    tips: [
      'Zapał świecę w kolorze białym lub czarnym',
      'Napisz na kartce to, co chcesz uwolnić',
      'Spalisz kartkę na końcu rytuału w bezpiecznym miejscu',
    ],
    element: 'Woda',
    duration: 45,
    maxParticipants: 500,
  },
  {
    id: 'r2',
    title: 'Ogniste Oczyszczanie Aury',
    host: 'Marcin K.',
    participants: 89,
    type: 'OGIEŃ',
    icon: Flame,
    color: TYPE_COLORS.OGIEŃ,
    live: true,
    desc: 'Praca z energią ognia do oczyszczania pola energetycznego. Pełna obecność wymagana. Jedna z najsilniejszych praktyk grupowych.',
    tips: [
      'Miej dostęp do otwartego okna przed sesją',
      'Postaw szklankę wody obok siebie',
      'Zamknij oczy i podążaj za głosem prowadzącego',
    ],
    element: 'Ogień',
    duration: 30,
    maxParticipants: 100,
  },
  {
    id: 'r3',
    title: 'Zbiorowe Pole Ciszy',
    host: 'Zofia B.',
    participants: 412,
    type: 'MEDYTACJA',
    icon: Globe2,
    color: TYPE_COLORS.MEDYTACJA,
    live: true,
    desc: 'Milczenie jako praktyka. Dołącz do setek ludzi siedzących razem w ciszy. Energia zbiorowa wzmacnia każdą indywidualną sesję.',
    tips: [
      'Stwórz ciche i ciemne miejsce do siedzenia',
      'Nie nastawiaj żadnych alarmów na czas sesji',
      'Po sesji zostań jeszcze kilka minut w spokoju',
    ],
    element: 'Przestrzeń',
    duration: 20,
    maxParticipants: 1000,
  },
  {
    id: 'r4',
    title: 'Aktywacja Czakry Serca',
    host: 'Irena W.',
    participants: 157,
    type: 'CZAKRY',
    icon: Zap,
    color: TYPE_COLORS.CZAKRY,
    live: false,
    desc: 'Otwórz i zrównoważ czakrę serca przez oddech, wizualizację i mantry. Praca z miłością bezwarunkową.',
    tips: [
      'Usiądź wygodnie ze skrzyżowanymi nogami',
      'Połóż dłonie na sercu i oddychaj głęboko',
      'Przygotuj się na głębokie emocje — to normalne',
    ],
    element: 'Powietrze',
    duration: 35,
    maxParticipants: 200,
  },
  {
    id: 'r5',
    title: 'Kąpiel Dźwiękowa — Kryształy',
    host: 'Dominika R.',
    participants: 178,
    type: 'WODA',
    icon: Waves,
    color: TYPE_COLORS.WODA,
    live: false,
    desc: 'Zanurzenie w dźwiękach mis kryształowych i gongów. Sesja rezonansowa, która harmonizuje pole energetyczne.',
    tips: [
      'Połóż się na macie lub w łóżku',
      'Używaj słuchawek dla pełnego efektu',
      'Nie planuj niczego przez godzinę po sesji',
    ],
    element: 'Woda',
    duration: 60,
    maxParticipants: 50,
  },
  {
    id: 'r6',
    title: 'Nocna Medytacja Grupowa',
    host: 'Aleksandra P.',
    participants: 312,
    type: 'MEDYTACJA',
    icon: Globe2,
    color: TYPE_COLORS.MEDYTACJA,
    live: false,
    desc: 'Głęboka medytacja w pełnym ciszy zbiorowym polu. Jedna z najpotężniejszych praktyk tygodnia. Wielka moc synchornizacji.',
    tips: [
      'Stwórz ciemne, ciche miejsce',
      'Użyj słuchawek dla głębszego doświadczenia',
      'Nie nastawiaj żadnego alarmu na czas trwania',
    ],
    element: 'Przestrzeń',
    duration: 45,
    maxParticipants: 1000,
  },
  {
    id: 'r7',
    title: 'Rytuał Pełni Księżyca',
    host: 'Katarzyna M.',
    participants: 489,
    type: 'KSIĘŻYC',
    icon: MoonStar,
    color: TYPE_COLORS.KSIĘŻYC,
    live: false,
    desc: 'Celebracja pełni z intencjami wdzięczności i manifestacji. Wielka moc zbiorowej synchronizacji z cyklem księżycowym.',
    tips: [
      'Wyjdź na zewnątrz jeśli możesz, aby zobaczyć księżyc',
      'Przygotuj kryształy lub przedmioty do ładowania',
      'Napisz listę wdzięczności z przynajmniej 10 punktami',
    ],
    element: 'Woda',
    duration: 50,
    maxParticipants: 500,
  },
  {
    id: 'r8',
    title: 'Oddech Uzdrawiający Wim Hofa',
    host: 'Piotr N.',
    participants: 203,
    type: 'OGIEŃ',
    icon: Wind,
    color: TYPE_COLORS.OGIEŃ,
    live: false,
    desc: 'Praca z energią przez intensywny oddech aktywujący naturalny potencjał uzdrawiający. Sesja dla zaawansowanych.',
    tips: [
      'Wykonuj tylko w pozycji leżącej lub siedzącej',
      'Nigdy nie wykonuj w wodzie ani podczas prowadzenia',
      'Może wystąpić mrowienie — to normalna reakcja',
    ],
    element: 'Ogień',
    duration: 30,
    maxParticipants: 100,
  },
  {
    id: 'r9',
    title: 'Oczyszczanie Szałwią — Poranek',
    host: 'Marta L.',
    participants: 67,
    type: 'OGIEŃ',
    icon: Flame,
    color: TYPE_COLORS.OGIEŃ,
    live: false,
    desc: 'Naucz się prawidłowo oczyszczać przestrzeń szałwią i innymi ziołami w rytuale grupowym.',
    tips: [
      'Przygotuj szałwię lub kadzidło wieczorem',
      'Otwórz wszystkie okna przed rytuałem',
      'Zacznij od wejścia i poruszaj się zgodnie z ruchem wskazówek zegara',
    ],
    element: 'Ogień',
    duration: 25,
    maxParticipants: 50,
  },
  {
    id: 'r10',
    title: 'Immersja Wodna — Wyobraźnia',
    host: 'Zofia B.',
    participants: 94,
    type: 'WODA',
    icon: Droplets,
    color: TYPE_COLORS.WODA,
    live: false,
    desc: 'Wizualizowana podróż przez wodne światy. Płynne prowadzenie, głęboki trans, regeneracja ciała energetycznego.',
    tips: [
      'Możesz siedzieć lub leżeć',
      'Wyobraź sobie, że jesteś zanurzony w ciepłej, czystej wodzie',
      'Oddychaj spokojnie przez cały czas trwania',
    ],
    element: 'Woda',
    duration: 40,
    maxParticipants: 200,
  },
  {
    id: 'r11',
    title: 'Wieczorne Uziemienie Czakr',
    host: 'Irena W.',
    participants: 135,
    type: 'CZAKRY',
    icon: Zap,
    color: TYPE_COLORS.CZAKRY,
    live: false,
    desc: 'Kompleksowy przegląd i harmonizacja wszystkich 7 czakr. Idealne na koniec dnia — usuwa energię zebraną przez cały dzień.',
    tips: [
      'Przeprowadź krótki skan ciała przed sesją',
      'Miej w pobliżu kryształy jeśli pracujesz z nimi',
      'Sesja może wywołać sen — to pożądany efekt',
    ],
    element: 'Ziemia',
    duration: 55,
    maxParticipants: 300,
  },
  {
    id: 'r12',
    title: 'Rytuał Nocy i Gwiazd',
    host: 'Marcin K.',
    participants: 271,
    type: 'KSIĘŻYC',
    icon: Star,
    color: TYPE_COLORS.KSIĘŻYC,
    live: false,
    desc: 'Kontemplacja nocnego nieba jako droga do wewnętrznej ciszy. Astralna podróż przez konstelacje.',
    tips: [
      'Wyjdź na zewnątrz lub usiądź przy oknie',
      'Znajdź jedną gwiazdę i skupiaj na niej wzrok przez 5 minut',
      'Pozwól myślom odpłynąć jak chmury',
    ],
    element: 'Przestrzeń',
    duration: 35,
    maxParticipants: 500,
  },
];

const ARCHIVE = [
  { id: 'a1', title: 'Ekwinkoncja Wiosenna — Nowy Cykl', date: '31 mar 2026', duration: 60, participants: 782, host: 'Katarzyna M.' },
  { id: 'a2', title: 'Kąpiel Dźwiękowa — Głęboki Sen', date: '28 mar 2026', duration: 45, participants: 234, host: 'Dominika R.' },
  { id: 'a3', title: 'Ogniste Przebudzenie Czakry Splotu', date: '25 mar 2026', duration: 30, participants: 156, host: 'Marcin K.' },
  { id: 'a4', title: 'Pełnia Marca — Rytuał Wdzięczności', date: '22 mar 2026', duration: 50, participants: 921, host: 'Irena W.' },
  { id: 'a5', title: 'Zbiorowe Milczenie — Niedziela', date: '20 mar 2026', duration: 20, participants: 503, host: 'Zofia B.' },
];

const LEADERBOARD = [
  { rank: 1, name: 'Katarzyna M.', sessions: 47, emoji: '🥇' },
  { rank: 2, name: 'Marcin K.', sessions: 38, emoji: '🥈' },
  { rank: 3, name: 'Irena W.', sessions: 31, emoji: '🥉' },
  { rank: 4, name: 'Zofia B.', sessions: 24, emoji: '4' },
  { rank: 5, name: 'Dominika R.', sessions: 19, emoji: '5' },
];

const FILTER_CHIPS = ['WSZYSTKIE', 'KSIĘŻYC', 'OGIEŃ', 'CZAKRY', 'MEDYTACJA', 'WODA'];
const DURATION_OPTS = [15, 30, 45, 60, 90];
const MAX_PART_OPTS = [10, 25, 50, 100, 0]; // 0 = ∞
const HOUR_OPTS = Array.from({ length: 24 }, (_, i) => i);
const MIN_OPTS = [0, 15, 30, 45];

function formatSeconds(sec: number): string {
  if (sec <= 0) return 'Na żywo';
  if (sec >= 86400) {
    const h = Math.floor(sec / 3600);
    if (h >= 24) return `Jutro ${String(h - 24).padStart(2, '0')}:${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}`;
    return `Za ${h}h ${Math.floor((sec % 3600) / 60)}min`;
  }
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `Za ${h}h ${m}min`;
  return `Za ${m} min`;
}

function getIconName(type: string): string {
  const map: Record<string, string> = {
    KSIĘŻYC: 'MoonStar', OGIEŃ: 'Flame', CZAKRY: 'Zap', MEDYTACJA: 'Globe2', WODA: 'Waves',
  };
  return map[type] || 'Sparkles';
}

// ─── Main Component ────────────────────────────────────────────────────────────
const TYPE_ICONS: Record<string, any> = {
  KSIĘŻYC: MoonStar, OGIEŃ: Flame, CZAKRY: Zap, MEDYTACJA: Globe2, WODA: Waves,
};

export const LiveRitualsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
    const currentUser = useAuthStore(s => s.currentUser);
  const textColor = isLight ? '#1A0505' : '#FFF5F5';
  const subColor = isLight ? 'rgba(26,5,5,0.52)' : 'rgba(255,245,245,0.52)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.07)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.10)';
  const sheetBg = isLight ? '#FFF5F5' : '#1A0808';

  // ── Tab state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'live' | 'mine' | 'archive'>('live');
  const [filter, setFilter] = useState('WSZYSTKIE');

  // ── Countdown engine ──────────────────────────────────────────────────────
  const [seconds, setSeconds] = useState<Record<string, number>>({ ...INITIAL_SECONDS });
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => { if (next[id] > 0) next[id] -= 1; });
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Participant fluctuation ───────────────────────────────────────────────
  const [partDelta, setPartDelta] = useState<Record<string, number>>({});
  useEffect(() => {
    const ticker = setInterval(() => {
      const delta: Record<string, number> = {};
      RITUALS_BASE.forEach(r => { delta[r.id] = Math.floor(Math.random() * 5) - 2; });
      setPartDelta(delta);
    }, 5000);
    return () => clearInterval(ticker);
  }, []);

  // ── Joined & created ──────────────────────────────────────────────────────
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [createdRituals, setCreatedRituals] = useState<any[]>([]);
  // Firebase real participant counts keyed by ritual ID
  const [fbParticipants, setFbParticipants] = useState<Record<string, number>>({});

  const seededRef = useRef(false);
  const joinedCheckRef = useRef(false);

  useEffect(() => {
    if (!currentUser) return;
    if (!seededRef.current) {
      seededRef.current = true;
      RitualsService.seedRitualsIfNeeded({ uid: currentUser.uid, displayName: currentUser.displayName }).catch(() => {});
    }
    const unsub = RitualsService.listenToRituals((fbRituals: FBRitual[]) => {
      const participantMap: Record<string, number> = {};
      fbRituals.forEach(r => { participantMap[r.id] = r.participantCount; });
      setFbParticipants(participantMap);
      // Add any user-created rituals from Firebase not in RITUALS_BASE
      const baseIds = RITUALS_BASE.map(r => r.id);
      const newFbRituals = fbRituals.filter(r => !baseIds.includes(r.id));
      setCreatedRituals(newFbRituals.map(r => ({
        id: r.id, title: r.title, host: r.hostName,
        participants: r.participantCount, type: r.type,
        icon: TYPE_ICONS[r.type] || Sparkles, color: TYPE_COLORS[r.type] || ACCENT,
        live: r.isLive, desc: r.description, tips: r.tips,
        element: r.element, duration: r.duration, maxParticipants: r.maxParticipants,
        isCreated: true,
      })));
      // Check which rituals user joined — only once on first snapshot
      if (!joinedCheckRef.current) {
        joinedCheckRef.current = true;
        Promise.all(fbRituals.map(r => RitualsService.isParticipant(r.id, currentUser.uid).then(yes => yes ? r.id : null)))
          .then(results => {
            const joined = results.filter(Boolean) as string[];
            if (joined.length > 0) {
              setJoinedIds(joined);
            }
          })
          .catch(() => {});
      }
    });
    return () => { unsub(); };
  }, [currentUser?.uid]);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [selectedRitual, setSelectedRitual] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // ── Create form state ─────────────────────────────────────────────────────
  const [cTitle, setCTitle] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cCategory, setCCategory] = useState('KSIĘŻYC');
  const [cDuration, setCDuration] = useState(30);
  const [cMaxPart, setCMaxPart] = useState(50);
  const [cHour, setCHour] = useState(20);
  const [cMin, setCMin] = useState(0);
  const [cPublic, setCPublic] = useState(true);

  // ── Animations ────────────────────────────────────────────────────────────
  const livePulse = useSharedValue(1);
  useEffect(() => {
    livePulse.value = withRepeat(
      withSequence(withTiming(1.5, { duration: 750 }), withTiming(1, { duration: 750 })),
      -1, false,
    );
  }, []);
  const liveDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: livePulse.value }],
    opacity: interpolate(livePulse.value, [1, 1.5], [0.9, 0.2], Extrapolation.CLAMP),
  }));

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getCountdown = (id: string) => formatSeconds(seconds[id] ?? -1);
  const isLive = (id: string) => (seconds[id] ?? -1) <= 0;
  const getParticipants = (r: any) => fbParticipants[r.id] !== undefined ? fbParticipants[r.id] : Math.max(1, r.participants + (partDelta[r.id] || 0));

  const openDetail = (r: any) => {
    HapticsService.impact();
    setSelectedRitual(r);
    setShowDetail(true);
  };

  const enterRitual = (r: any) => {
    HapticsService.notify();
    setShowDetail(false);
    const { icon: _icon, ...ritualParams } = r;
    navigation.navigate('RitualSession', { ritual: { ...ritualParams, iconName: getIconName(r.type) } });
  };

  const toggleJoin = (id: string) => {
    HapticsService.impact();
    const isJoined = joinedIds.includes(id);
    setJoinedIds(prev => isJoined ? prev.filter(x => x !== id) : [...prev, id]);
    if (!currentUser) return;
    if (isJoined) {
      RitualsService.leaveRitual(id, currentUser.uid).catch(() => {});
    } else {
      RitualsService.joinRitual(id, { uid: currentUser.uid, displayName: currentUser.displayName }).catch(() => {});
    }
  };

  const submitCreate = () => {
    if (!cTitle.trim()) return;
    HapticsService.notify();
    // Write to Firebase
    if (currentUser) {
      RitualsService.createRitual(
        { uid: currentUser.uid, displayName: currentUser.displayName },
        { title: cTitle.trim(), type: cCategory, description: cDesc.trim() || 'Rytuał stworzony przez użytkownika.', duration: cDuration, element: 'Przestrzeń', maxParticipants: cMaxPart === 0 ? 9999 : cMaxPart }
      ).catch(() => {});
    }
    setShowCreate(false);
    setCTitle(''); setCDesc(''); setCCategory('KSIĘŻYC'); setCDuration(30);
    setCMaxPart(50); setCHour(20); setCMin(0); setCPublic(true);
  };

  const deleteCreated = (id: string) => {
    HapticsService.impact();
    setCreatedRituals(prev => prev.filter(r => r.id !== id));
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const allRituals = [...RITUALS_BASE, ...createdRituals];
  const liveRituals = allRituals.filter(r => isLive(r.id));
  const filteredRituals = allRituals.filter(r =>
    (filter === 'WSZYSTKIE' || r.type === filter),
  );
  const featured = allRituals.slice(0, 3);
  const joinedRituals = allRituals.filter(r => joinedIds.includes(r.id));
  const totalParticipants = allRituals.reduce((s, r) => s + getParticipants(r), 0);
  const totalMinutes = ARCHIVE.reduce((s, a) => s + a.duration, 0) + allRituals.filter(r => isLive(r.id)).reduce((s, r) => s + r.duration, 0);

  // ── Progress for live ─────────────────────────────────────────────────────
  const getLiveProgress = (r: any) => {
    const elapsed = Math.abs(seconds[r.id] || 0);
    return Math.min(1, elapsed / (r.duration * 60));
  };

  // ─── RENDER HELPERS ────────────────────────────────────────────────────────

  const RitualCard = useCallback(({ r, index }: { r: any; index: number }) => {
    const Icon = r.icon;
    const cd = getCountdown(r.id);
    const live = isLive(r.id);
    const parts = getParticipants(r);
    const progress = live ? getLiveProgress(r) : 0;
    return (
      <View>
        <Pressable onPress={() => openDetail(r)}
          style={[styles.ritualCard, { backgroundColor: cardBg, borderColor: live ? ACCENT + '55' : cardBorder },
            live && { shadowColor: ACCENT, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5 }]}>
          <LinearGradient
            colors={[r.color + '18', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <View style={[styles.cardStripe, { backgroundColor: r.color }]} />
          <View style={[styles.cardIconCircle, { backgroundColor: r.color + '25', borderColor: r.color + '40' }]}>
            <Icon size={20} color={r.color} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              {live
                ? <View style={[styles.liveBadge, { backgroundColor: ACCENT }]}>
                    <View style={styles.liveDotSmall} />
                    <Text style={styles.liveBadgeText}>{t('liveRituals.live', 'LIVE')}</Text>
                  </View>
                : <View style={[styles.countdownPill, { backgroundColor: r.color + '22', borderColor: r.color + '44' }]}>
                    <Clock size={9} color={r.color} />
                    <Text style={[styles.countdownText, { color: r.color }]}>{cd}</Text>
                  </View>
              }
              <View style={[styles.typeBadge, { backgroundColor: r.color + '18', borderColor: r.color + '33' }]}>
                <Text style={[styles.typeText, { color: r.color }]}>{r.type}</Text>
              </View>
            </View>
            <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>{r.title}</Text>
            <Text style={[styles.cardHost, { color: subColor }]}>prowadzi: {r.host}</Text>
            <View style={styles.cardMetaRow}>
              <Users size={10} color={subColor} />
              <Text style={[styles.cardMeta, { color: subColor }]}> {parts}</Text>
              {r.maxParticipants < 9999 && (
                <Text style={[styles.cardMeta, { color: subColor }]}>/{r.maxParticipants}</Text>
              )}
              <Text style={[styles.cardMeta, { color: subColor, marginLeft: 8 }]}>· {r.duration} min</Text>
              {r.element && <Text style={[styles.cardMeta, { color: subColor, marginLeft: 8 }]}>· {r.element}</Text>}
            </View>
            {live && (
              <View style={styles.progressBarWrap}>
                <View style={[styles.progressBarTrack, { backgroundColor: cardBorder }]}>
                  <View style={[styles.progressBarFill, { backgroundColor: ACCENT, width: `${Math.round(progress * 100)}%` }]} />
                </View>
                <Text style={[styles.progressLabel, { color: ACCENT }]}>{Math.round(progress * 100)}%</Text>
              </View>
            )}
          </View>
          <Pressable onPress={() => enterRitual(r)}
            style={[styles.enterBtn, { backgroundColor: r.color }]}>
            <Text style={styles.enterBtnText}>{t('liveRituals.wejdz', 'Wejdź')}</Text>
            <ChevronRight size={12} color="#FFF" />
          </Pressable>
        </Pressable>
      </View>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardBg, cardBorder, textColor, subColor, seconds, partDelta, fbParticipants, joinedIds]);

  // ─── TABS CONTENT ──────────────────────────────────────────────────────────

  const renderLiveTab = () => (
    <>
      {/* Hero banner */}
      <Animated.View entering={FadeInDown.delay(60)} style={[styles.heroBanner, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '44' }]}>
        <LinearGradient colors={[ACCENT + '30', ACCENT + '08']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={styles.heroBannerLeft}>
          <View style={styles.liveDotWrapper}>
            <Animated.View style={[styles.liveDotRing, { borderColor: ACCENT }, liveDotStyle]} />
            <View style={[styles.liveDotCore, { backgroundColor: ACCENT }]} />
          </View>
          <View>
            <Text style={[styles.heroBannerCount, { color: ACCENT }]}>{liveRituals.length} RYTUAŁÓW NA ŻYWO</Text>
            <Text style={[styles.heroBannerSub, { color: subColor }]}>{totalParticipants.toLocaleString()} uczestników łącznie</Text>
          </View>
        </View>
        <View style={[styles.heroBannerPill, { backgroundColor: ACCENT }]}>
          <Radio size={10} color="#FFF" />
          <Text style={styles.heroBannerPillText}>{t('liveRituals.na_zywo', 'NA ŻYWO')}</Text>
        </View>
      </Animated.View>

      {/* Polecane strip */}
      <Animated.View entering={FadeInDown.delay(120)}>
        <Text style={[styles.sectionLabel, { color: textColor }]}>{t('liveRituals.dzis_polecane', '✦ DZIŚ POLECANE')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: P }}>
          {featured.map((r, i) => {
            const Icon = r.icon;
            const live = isLive(r.id);
            return (
              <Pressable key={r.id} onPress={() => openDetail(r)}
                style={[styles.featCard, { backgroundColor: cardBg, borderColor: live ? ACCENT + '55' : r.color + '44' }]}>
                <LinearGradient colors={[r.color + '30', r.color + '08']} style={StyleSheet.absoluteFill} />
                {live && <View style={[styles.featLiveDot, { backgroundColor: ACCENT }]} />}
                <View style={[styles.featIconCircle, { backgroundColor: r.color + '30' }]}>
                  <Icon size={22} color={r.color} />
                </View>
                <Text style={[styles.featTitle, { color: textColor }]} numberOfLines={2}>{r.title}</Text>
                <Text style={[styles.featHost, { color: subColor }]}>{r.host}</Text>
                <View style={styles.featFooter}>
                  <Users size={9} color={subColor} />
                  <Text style={[styles.featParts, { color: subColor }]}> {getParticipants(r)}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Filter chips */}
      <Animated.View entering={FadeInDown.delay(160)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ marginTop: 18 }} contentContainerStyle={{ gap: 8, paddingRight: P }}>
          {FILTER_CHIPS.map(chip => {
            const active = filter === chip;
            const chipColor = chip === 'WSZYSTKIE' ? ACCENT : (TYPE_COLORS[chip] || ACCENT);
            return (
              <Pressable key={chip} onPress={() => { HapticsService.impact(); setFilter(chip); }}
                style={[styles.chip, { borderColor: active ? chipColor : cardBorder },
                  active && { backgroundColor: chipColor + '22' }]}>
                <Text style={[styles.chipText, { color: active ? chipColor : subColor }]}>{chip}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Ritual cards */}
      <View style={{ marginTop: 14 }}>
        {filteredRituals.map((r, i) => <RitualCard key={r.id} r={r} index={i} />)}
      </View>

      {/* Leaderboard */}
      <Animated.View entering={FadeInDown.delay(200)} style={{ marginTop: 28 }}>
        <View style={styles.leaderHeaderRow}>
          <Trophy size={14} color={ACCENT} />
          <Text style={[styles.sectionLabel, { color: textColor, marginBottom: 0, marginLeft: 6 }]}>{t('liveRituals.mistrzowie_rytualow', 'MISTRZOWIE RYTUAŁÓW')}</Text>
        </View>
        {LEADERBOARD.map((l, i) => (
          <Animated.View key={l.name} entering={FadeInDown.delay(220 + i * 50)}>
            <View style={[styles.leaderItem, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={[styles.leaderRankBadge,
                l.rank === 1 ? { backgroundColor: '#F59E0B' + '33', borderColor: '#F59E0B' }
                : l.rank === 2 ? { backgroundColor: '#94A3B8' + '33', borderColor: '#94A3B8' }
                : l.rank === 3 ? { backgroundColor: '#CD7C2E' + '33', borderColor: '#CD7C2E' }
                : { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={styles.leaderEmoji}>{l.rank <= 3 ? l.emoji : l.rank}</Text>
              </View>
              <Text style={[styles.leaderName, { color: textColor }]}>{l.name}</Text>
              <View style={[styles.leaderSessionsChip, { backgroundColor: ACCENT + '20', borderColor: ACCENT + '40' }]}>
                <Text style={[styles.leaderSessionsText, { color: ACCENT }]}>{l.sessions} sesji</Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </Animated.View>

      {/* CO DALEJ */}
      {renderCoDalej()}
    </>
  );

  const renderMineTab = () => (
    <>
      <Animated.View entering={FadeInDown.delay(60)}>
        <Pressable onPress={() => setShowCreate(true)}
          style={[styles.createBigBtn, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '44' }]}>
          <LinearGradient colors={[ACCENT + '28', ACCENT + '06']} style={StyleSheet.absoluteFill} />
          <Plus size={20} color={ACCENT} />
          <Text style={[styles.createBigBtnText, { color: ACCENT }]}>{t('liveRituals.stworz_rytual', 'STWÓRZ RYTUAŁ')}</Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100)}>
        <Text style={[styles.sectionLabel, { color: textColor }]}>AKTYWNE ({joinedRituals.length})</Text>
        {joinedRituals.length === 0
          ? <View style={[styles.emptyState, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Users size={32} color={subColor} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyTitle, { color: textColor }]}>{t('liveRituals.nie_dolaczono_do_zadnego_rytualu', 'Nie dołączono do żadnego rytuału')}</Text>
              <Text style={[styles.emptySub, { color: subColor }]}>{t('liveRituals.przejdz_do_zakladki_na_zywo', 'Przejdź do zakładki NA ŻYWO i naciśnij "Wejdź"')}</Text>
            </View>
          : joinedRituals.map((r, i) => {
              const Icon = r.icon;
              return (
                <Animated.View key={r.id} entering={FadeInDown.delay(120 + i * 50)}>
                  <View style={[styles.mineCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <View style={[styles.cardStripe, { backgroundColor: r.color }]} />
                    <View style={[styles.cardIconCircle, { backgroundColor: r.color + '25', borderColor: r.color + '40', marginLeft: 8 }]}>
                      <Icon size={18} color={r.color} />
                    </View>
                    <View style={styles.mineCardBody}>
                      <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>{r.title}</Text>
                      <Text style={[styles.cardHost, { color: subColor }]}>{r.host} · {r.duration} min</Text>
                    </View>
                    <Pressable onPress={() => toggleJoin(r.id)}
                      style={[styles.exitBtn, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '44' }]}>
                      <Text style={[styles.exitBtnText, { color: ACCENT }]}>{t('liveRituals.wyjdz', 'Wyjdź')}</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              );
            })
        }
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180)}>
        <Text style={[styles.sectionLabel, { color: textColor, marginTop: 20 }]}>STWORZONE PRZEZE MNIE ({createdRituals.length})</Text>
        {createdRituals.length === 0
          ? <View style={[styles.emptyState, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <LayoutGrid size={32} color={subColor} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyTitle, { color: textColor }]}>{t('liveRituals.brak_wlasnych_rytualow', 'Brak własnych rytuałów')}</Text>
              <Text style={[styles.emptySub, { color: subColor }]}>{t('liveRituals.nacisnij_stworz_rytual_powyzej', 'Naciśnij "STWÓRZ RYTUAŁ" powyżej')}</Text>
            </View>
          : createdRituals.map((r, i) => {
              const Icon = r.icon;
              return (
                <Animated.View key={r.id} entering={FadeInDown.delay(200 + i * 50)}>
                  <View style={[styles.mineCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <View style={[styles.cardStripe, { backgroundColor: r.color }]} />
                    <View style={[styles.cardIconCircle, { backgroundColor: r.color + '25', borderColor: r.color + '40', marginLeft: 8 }]}>
                      <Icon size={18} color={r.color} />
                    </View>
                    <View style={styles.mineCardBody}>
                      <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>{r.title}</Text>
                      <Text style={[styles.cardHost, { color: subColor }]}>
                        {r.type} · {r.duration} min · {r.isPublic ? 'Publiczny' : 'Prywatny'}
                      </Text>
                      <Text style={[styles.cardHost, { color: subColor }]}>
                        Zaplanowany: {String(r.scheduledHour).padStart(2, '0')}:{String(r.scheduledMin).padStart(2, '0')}
                      </Text>
                    </View>
                    <View style={styles.mineActions}>
                      <Pressable
                        onPress={() => Alert.alert(
                          'Edytuj rytuał',
                          'Co chcesz zrobić?',
                          [
                            { text: t('common.cancel'), style: 'cancel' },
                            { text: 'Usuń z harmonogramu', style: 'destructive', onPress: () => deleteCreated(r.id) },
                          ],
                        )}
                        style={styles.mineActionBtn}
                      >
                        <Edit3 size={14} color={subColor} />
                      </Pressable>
                      <Pressable onPress={() => deleteCreated(r.id)} style={styles.mineActionBtn}>
                        <Trash2 size={14} color={ACCENT} />
                      </Pressable>
                    </View>
                  </View>
                </Animated.View>
              );
            })
        }
      </Animated.View>
    </>
  );

  const renderArchiveTab = () => (
    <>
      <Animated.View entering={FadeInDown.delay(60)}>
        <Text style={[styles.sectionLabel, { color: textColor }]}>{t('liveRituals.zakonczone_rytualy', 'ZAKOŃCZONE RYTUAŁY')}</Text>
        {ARCHIVE.map((a, i) => (
          <Animated.View key={a.id} entering={FadeInDown.delay(80 + i * 60)}>
            <View style={[styles.archiveCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.archiveLeft}>
                <CheckCircle2 size={20} color="#10B981" />
                <View style={styles.archiveInfo}>
                  <Text style={[styles.archiveTitle, { color: textColor }]}>{a.title}</Text>
                  <Text style={[styles.archiveMeta, { color: subColor }]}>
                    {a.date} · {a.duration} min · {a.participants} uczestników
                  </Text>
                  <Text style={[styles.archiveMeta, { color: subColor }]}>prowadził: {a.host}</Text>
                </View>
              </View>
              <Pressable onPress={() => HapticsService.impact()}
                style={[styles.replayBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.replayText, { color: subColor }]}>{t('liveRituals.ponow', 'Ponów')}</Text>
              </Pressable>
            </View>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Stats strip */}
      <Animated.View entering={FadeInDown.delay(400)} style={{ marginTop: 24 }}>
        <Text style={[styles.sectionLabel, { color: textColor }]}>{t('liveRituals.wspolnota_dzis', 'WSPÓLNOTA DZIŚ')}</Text>
        <View style={styles.statsStrip}>
          {[
            { label: 'Uczestników', value: totalParticipants.toLocaleString() },
            { label: 'Ukończonych', value: '4' },
            { label: 'Minut praktyki', value: totalMinutes.toString() },
          ].map((s, i) => (
            <Animated.View key={s.label} entering={FadeInDown.delay(420 + i * 50)}
              style={[styles.statChip, { backgroundColor: ACCENT + '14', borderColor: ACCENT + '35' }]}>
              <Text style={[styles.statVal, { color: ACCENT }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: subColor }]}>{s.label}</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {renderCoDalej()}
    </>
  );

  const renderCoDalej = () => (
    <Animated.View entering={FadeInDown.delay(440)} style={{ marginTop: 28 }}>
      <Text style={[styles.sectionLabel, { color: textColor }]}>{t('liveRituals.co_dalej', '✦ CO DALEJ?')}</Text>
      {[
        { label: 'Krąg Energii', sub: 'Grupowa synchronizacja', route: 'EnergyCircle', color: '#10B981', Icon: Sparkles },
        { label: 'Czat Wspólnoty', sub: 'Połącz się z innymi', route: 'CommunityChat', color: '#6366F1', Icon: Users },
        { label: 'Medytacja', sub: 'Indywidualna praktyka', route: 'Meditation', color: '#818CF8', Icon: Globe2 },
      ].map((item, i) => (
        <Animated.View key={item.route} entering={FadeInDown.delay(460 + i * 50)}>
          <Pressable onPress={() => { HapticsService.impact(); navigation.navigate(item.route as any); }}
            style={[styles.nextCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <LinearGradient colors={[item.color + '20', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <View style={[styles.nextIcon, { backgroundColor: item.color + '25' }]}>
              <item.Icon size={18} color={item.color} />
            </View>
            <View style={styles.nextBody}>
              <Text style={[styles.nextLabel, { color: textColor }]}>{item.label}</Text>
              <Text style={[styles.nextSub, { color: subColor }]}>{item.sub}</Text>
            </View>
            <ChevronRight size={16} color={subColor} />
          </Pressable>
        </Animated.View>
      ))}
    </Animated.View>
  );

  // ─── MODALS ────────────────────────────────────────────────────────────────

  const renderDetailModal = () => {
    if (!selectedRitual) return null;
    const r = selectedRitual;
    const Icon = r.icon;
    const live = isLive(r.id);
    const progress = live ? getLiveProgress(r) : 0;
    const parts = getParticipants(r);
    const bookmarked = joinedIds.includes(r.id);
    return (
      <Modal visible={showDetail} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={[styles.modalSheet, { backgroundColor: sheetBg }]}>
              <View style={[styles.detailTop, { borderBottomColor: cardBorder }]}>
                <View style={[styles.detailIconCircle, { backgroundColor: r.color + '25', borderColor: r.color + '50' }]}>
                  <Icon size={28} color={r.color} />
                </View>
                <View style={styles.detailTitleArea}>
                  <View style={styles.detailBadgeRow}>
                    {live
                      ? <View style={[styles.liveBadge, { backgroundColor: ACCENT }]}><View style={styles.liveDotSmall} /><Text style={styles.liveBadgeText}>{t('liveRituals.live_1', 'LIVE')}</Text></View>
                      : <View style={[styles.typeBadge, { backgroundColor: r.color + '20', borderColor: r.color + '40' }]}><Text style={[styles.typeText, { color: r.color }]}>{r.type}</Text></View>
                    }
                    <Text style={[styles.typeText, { color: subColor, marginLeft: 8 }]}>{r.duration} min · {r.element}</Text>
                  </View>
                  <Text style={[styles.detailTitle, { color: textColor }]}>{r.title}</Text>
                  <Text style={[styles.cardHost, { color: subColor }]}>prowadzi: {r.host}</Text>
                </View>
                <Pressable onPress={() => setShowDetail(false)} style={styles.closeBtn}>
                  <X size={20} color={subColor} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {live && (
                  <View style={styles.detailProgressWrap}>
                    <View style={styles.detailProgressRow}>
                      <Text style={[styles.cardMeta, { color: subColor }]}>{t('liveRituals.postep_sesji', 'Postęp sesji')}</Text>
                      <Text style={[styles.cardMeta, { color: ACCENT }]}>{Math.round(progress * 100)}%</Text>
                    </View>
                    <View style={[styles.progressBarTrack, { backgroundColor: cardBorder, marginBottom: 0 }]}>
                      <View style={[styles.progressBarFill, { backgroundColor: ACCENT, width: `${Math.round(progress * 100)}%` }]} />
                    </View>
                  </View>
                )}

                <Text style={[styles.detailDesc, { color: subColor }]}>{r.desc}</Text>

                <Text style={[styles.detailPrepTitle, { color: textColor }]}>{t('liveRituals.jak_sie_przygotowa', 'Jak się przygotować:')}</Text>
                {r.tips.map((tip: string, i: number) => (
                  <View key={i} style={styles.tipRow}>
                    <View style={[styles.tipNumBadge, { backgroundColor: r.color + '25' }]}>
                      <Text style={[styles.tipNum, { color: r.color }]}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.tipText, { color: textColor }]}>{tip}</Text>
                  </View>
                ))}

                <View style={styles.detailPartsRow}>
                  <Text style={[styles.detailPrepTitle, { color: textColor }]}>{t('liveRituals.uczestnicy', 'Uczestnicy:')}</Text>
                  <View style={styles.avatarRow}>
                    {['🧘', '🌙', '✨'].map((em, i) => (
                      <View key={i} style={[styles.avatarChip, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                        <Text style={styles.avatarEmoji}>{em}</Text>
                      </View>
                    ))}
                    <Text style={[styles.cardMeta, { color: subColor, marginLeft: 6 }]}>i {parts - 3} innych</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.detailFooter}>
                <Pressable onPress={() => toggleJoin(r.id)}
                  style={[styles.bookmarkBtn, { backgroundColor: bookmarked ? ACCENT + '22' : cardBg, borderColor: bookmarked ? ACCENT : cardBorder }]}>
                  <BookmarkPlus size={18} color={bookmarked ? ACCENT : subColor} />
                </Pressable>
                <Pressable onPress={() => enterRitual(r)}
                  style={[styles.detailEnterBtn, { backgroundColor: r.color }]}>
                  <Text style={styles.detailEnterText}>{t('liveRituals.wejdz_do_rytualu', 'Wejdź do rytuału')}</Text>
                  <ChevronRight size={16} color="#FFF" />
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  };

  const renderCreateModal = () => (
    <Modal visible={showCreate} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={[styles.modalSheet, { backgroundColor: sheetBg }]}>
            <View style={[styles.createHeader, { borderBottomColor: cardBorder }]}>
              <Text style={[styles.detailTitle, { color: textColor }]}>{t('liveRituals.stworz_rytual_1', 'Stwórz Rytuał')}</Text>
              <Pressable onPress={() => setShowCreate(false)} style={styles.closeBtn}>
                <X size={20} color={subColor} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              <TextInput
                value={cTitle} onChangeText={setCTitle}
                placeholder={t('liveRituals.nazwa_rytualu', 'Nazwa rytuału...')} placeholderTextColor={subColor}
                style={[styles.createInput, { color: textColor, backgroundColor: cardBg, borderColor: cardBorder }]}
              />

              <Text style={[styles.formLabel, { color: subColor }]}>{t('liveRituals.kategoria', 'KATEGORIA')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
                {['KSIĘŻYC', 'OGIEŃ', 'CZAKRY', 'MEDYTACJA', 'WODA'].map(cat => {
                  const col = TYPE_COLORS[cat];
                  const active = cCategory === cat;
                  return (
                    <Pressable key={cat} onPress={() => setCCategory(cat)}
                      style={[styles.chip, { borderColor: active ? col : cardBorder }, active && { backgroundColor: col + '22' }]}>
                      <Text style={[styles.chipText, { color: active ? col : subColor }]}>{cat}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <TextInput
                value={cDesc} onChangeText={setCDesc}
                placeholder={t('liveRituals.opis_i_instrukcje', 'Opis i instrukcje...')} placeholderTextColor={subColor}
                multiline numberOfLines={3}
                style={[styles.createInput, { color: textColor, backgroundColor: cardBg, borderColor: cardBorder, minHeight: 72, textAlignVertical: 'top' }]}
              />

              <Text style={[styles.formLabel, { color: subColor }]}>{t('liveRituals.czas_trwania_min', 'CZAS TRWANIA (MIN)')}</Text>
              <View style={styles.optRow}>
                {DURATION_OPTS.map(d => {
                  const active = cDuration === d;
                  return (
                    <Pressable key={d} onPress={() => setCDuration(d)}
                      style={[styles.optChip, { borderColor: active ? ACCENT : cardBorder }, active && { backgroundColor: ACCENT + '22' }]}>
                      <Text style={[styles.optChipText, { color: active ? ACCENT : subColor }]}>{d}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.formLabel, { color: subColor }]}>{t('liveRituals.godzina_startu', 'GODZINA STARTU')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 8 }}>
                {HOUR_OPTS.map(h => {
                  const active = cHour === h;
                  return (
                    <Pressable key={h} onPress={() => setCHour(h)}
                      style={[styles.optChipSm, { borderColor: active ? ACCENT : cardBorder }, active && { backgroundColor: ACCENT + '22' }]}>
                      <Text style={[styles.optChipSmText, { color: active ? ACCENT : subColor }]}>{String(h).padStart(2, '0')}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Text style={[styles.formLabel, { color: subColor }]}>{t('liveRituals.minuty_startu', 'MINUTY STARTU')}</Text>
              <View style={styles.optRow}>
                {MIN_OPTS.map(m => {
                  const active = cMin === m;
                  return (
                    <Pressable key={m} onPress={() => setCMin(m)}
                      style={[styles.optChip, { borderColor: active ? ACCENT : cardBorder }, active && { backgroundColor: ACCENT + '22' }]}>
                      <Text style={[styles.optChipText, { color: active ? ACCENT : subColor }]}>{String(m).padStart(2, '0')}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.formLabel, { color: subColor }]}>{t('liveRituals.maks_uczestniko', 'MAKS. UCZESTNIKÓW')}</Text>
              <View style={styles.optRow}>
                {MAX_PART_OPTS.map(n => {
                  const active = cMaxPart === n;
                  return (
                    <Pressable key={n} onPress={() => setCMaxPart(n)}
                      style={[styles.optChip, { borderColor: active ? ACCENT : cardBorder }, active && { backgroundColor: ACCENT + '22' }]}>
                      <Text style={[styles.optChipText, { color: active ? ACCENT : subColor }]}>{n === 0 ? '∞' : n}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.formLabel, { color: subColor }]}>{t('liveRituals.widocznosc', 'WIDOCZNOŚĆ')}</Text>
              <View style={styles.toggleRow}>
                <Pressable onPress={() => setCPublic(true)}
                  style={[styles.toggleOpt, { borderColor: cPublic ? ACCENT : cardBorder }, cPublic && { backgroundColor: ACCENT + '18' }]}>
                  <Unlock size={14} color={cPublic ? ACCENT : subColor} />
                  <Text style={[styles.toggleOptText, { color: cPublic ? ACCENT : subColor }]}>{t('liveRituals.publiczny', 'Publiczny')}</Text>
                </Pressable>
                <Pressable onPress={() => setCPublic(false)}
                  style={[styles.toggleOpt, { borderColor: !cPublic ? ACCENT : cardBorder }, !cPublic && { backgroundColor: ACCENT + '18' }]}>
                  <Lock size={14} color={!cPublic ? ACCENT : subColor} />
                  <Text style={[styles.toggleOptText, { color: !cPublic ? ACCENT : subColor }]}>{t('liveRituals.tylko_zaproszeni', 'Tylko zaproszeni')}</Text>
                </Pressable>
              </View>
            </ScrollView>

            <Pressable onPress={submitCreate}
              style={[styles.submitBtn, { backgroundColor: ACCENT }, !cTitle.trim() && { opacity: 0.5 }]}>
              <Plus size={16} color="#FFF" />
              <Text style={styles.submitBtnText}>{t('liveRituals.utworz_rytual', 'Utwórz Rytuał')}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

  // ─── MAIN RENDER ───────────────────────────────────────────────────────────
  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={[styles.safe, {}]} edges={['top']}>

      <LinearGradient
        colors={isLight ? ['#FFF1F1', '#FFE4E6', currentTheme.background] : ['#150404', '#1E0505', currentTheme.background]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('liveRituals.rytualy_na_zywo', 'Rytuały na Żywo')}</Text>
        <Pressable onPress={() => setShowCreate(true)}
          style={[styles.addBtn, { backgroundColor: ACCENT + '20', borderColor: ACCENT + '50' }]}>
          <Plus size={16} color={ACCENT} />
        </Pressable>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: cardBorder }]}>
        {([
          { key: 'live', label: 'NA ŻYWO', Icon: Radio },
          { key: 'mine', label: 'MOJE', Icon: BookmarkPlus },
          { key: 'archive', label: 'ARCHIWUM', Icon: Archive },
        ] as const).map(tab => {
          const active = activeTab === tab.key;
          return (
            <Pressable key={tab.key} onPress={() => { HapticsService.impact(); setActiveTab(tab.key); }}
              style={styles.tabItem}>
              <tab.Icon size={14} color={active ? ACCENT : subColor} />
              <Text style={[styles.tabLabel, { color: active ? ACCENT : subColor }]}>{tab.label}</Text>
              {active && <View style={[styles.tabUnderline, { backgroundColor: ACCENT }]} />}
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: 20 }]}>
        {activeTab === 'live' && renderLiveTab()}
        {activeTab === 'mine' && renderMineTab()}
        {activeTab === 'archive' && renderArchiveTab()}
        <EndOfContentSpacer size="standard" />
      </ScrollView>

      {renderDetailModal()}
      {renderCreateModal()}
        </SafeAreaView>
</View>
  );
};

// ─── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: P, paddingVertical: 12, justifyContent: 'space-between' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  addBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1, marginHorizontal: P },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3, position: 'relative' },
  tabLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  tabUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderRadius: 1 },

  scroll: { paddingHorizontal: P, paddingTop: 16 },

  heroBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 18, overflow: 'hidden' },
  heroBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  heroBannerCount: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  heroBannerSub: { fontSize: 11, marginTop: 1 },
  heroBannerPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  heroBannerPillText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  liveDotWrapper: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  liveDotRing: { position: 'absolute', width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  liveDotCore: { width: 8, height: 8, borderRadius: 4 },
  liveDotSmall: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFF', marginRight: 3 },

  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },

  featCard: { width: (SW - P * 2 - 20) * 0.54, borderRadius: 16, borderWidth: 1, padding: 14, overflow: 'hidden', position: 'relative' },
  featLiveDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },
  featIconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  featTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4, lineHeight: 17 },
  featHost: { fontSize: 10, marginBottom: 6 },
  featFooter: { flexDirection: 'row', alignItems: 'center' },
  featParts: { fontSize: 10 },

  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  ritualCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 0, marginBottom: 10, overflow: 'hidden', minHeight: 80 },
  cardStripe: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  cardIconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginLeft: 10 },
  cardBody: { flex: 1, paddingVertical: 10, paddingHorizontal: 10 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  liveBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  countdownPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, borderWidth: 1 },
  countdownText: { fontSize: 9, fontWeight: '700' },
  typeBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, borderWidth: 1 },
  typeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  cardTitle: { fontSize: 13, fontWeight: '700', marginBottom: 1 },
  cardHost: { fontSize: 10, marginBottom: 3 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center' },
  cardMeta: { fontSize: 10 },
  progressBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  progressBarTrack: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  progressBarFill: { height: 3, borderRadius: 2 },
  progressLabel: { fontSize: 9, fontWeight: '700', width: 28, textAlign: 'right' },
  enterBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, margin: 10, marginLeft: 4 },
  enterBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  leaderHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  leaderItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8, gap: 12 },
  leaderRankBadge: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  leaderEmoji: { fontSize: 14 },
  leaderName: { flex: 1, fontSize: 14, fontWeight: '600' },
  leaderSessionsChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  leaderSessionsText: { fontSize: 12, fontWeight: '700' },

  nextCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8, gap: 12, overflow: 'hidden' },
  nextIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  nextBody: { flex: 1 },
  nextLabel: { fontSize: 14, fontWeight: '700', marginBottom: 1 },
  nextSub: { fontSize: 11 },

  createBigBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20, overflow: 'hidden' },
  createBigBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },

  mineCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: 'hidden', minHeight: 68 },
  mineCardBody: { flex: 1, paddingVertical: 10, paddingHorizontal: 10 },
  mineActions: { flexDirection: 'row', gap: 6, marginRight: 10 },
  mineActionBtn: { padding: 8 },
  exitBtn: { marginRight: 10, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1 },
  exitBtnText: { fontSize: 11, fontWeight: '700' },

  emptyState: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 14, fontWeight: '600', marginBottom: 6, textAlign: 'center' },
  emptySub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },

  archiveCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  archiveLeft: { flex: 1, flexDirection: 'row', gap: 12 },
  archiveInfo: { flex: 1 },
  archiveTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  archiveMeta: { fontSize: 10, marginBottom: 1 },
  replayBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  replayText: { fontSize: 10, fontWeight: '600' },

  statsStrip: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statChip: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center' },
  statVal: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, textAlign: 'center' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 34 },

  detailTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingBottom: 14, marginBottom: 14, borderBottomWidth: 1 },
  detailIconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  detailTitleArea: { flex: 1 },
  detailBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  closeBtn: { padding: 4 },

  detailProgressWrap: { marginBottom: 12 },
  detailProgressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailDesc: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  detailPrepTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  detailPartsRow: { marginTop: 10 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  avatarChip: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarEmoji: { fontSize: 16 },
  detailFooter: { flexDirection: 'row', gap: 10, marginTop: 16 },
  bookmarkBtn: { width: 50, height: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  detailEnterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, padding: 15 },
  detailEnterText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  tipRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  tipNumBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  tipNum: { fontSize: 11, fontWeight: '800' },
  tipText: { fontSize: 13, lineHeight: 19, flex: 1 },

  createHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, marginBottom: 14, borderBottomWidth: 1 },
  createInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 13, marginBottom: 14 },
  formLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 },
  optRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  optChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  optChipText: { fontSize: 13, fontWeight: '700' },
  optChipSm: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  optChipSmText: { fontSize: 11, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  toggleOpt: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1, padding: 12 },
  toggleOptText: { fontSize: 12, fontWeight: '700' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, padding: 16, marginTop: 6 },
  submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
