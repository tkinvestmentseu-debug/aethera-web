import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { TarotBackground } from '../components/ThematicBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brain, ChevronLeft, History, MoonStar, Sparkles, Flame, HeartHandshake, CheckCircle2, Trash2, RotateCcw, Shield, Orbit, SunMedium, Star, ArrowRight, Users, BookOpen } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import Svg, { G, Rect, Path } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTarotStore } from '../features/tarot/store/useTarotStore';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { Typography } from '../components/Typography';
import { SPREADS } from '../features/tarot/data/spreads';
import { PremiumButton } from '../components/PremiumButton';
import { resolveUserFacingText } from '../core/utils/contentResolver';
import { AudioService } from '../core/services/audio.service';
import { getTarotDeckById } from '../features/tarot/data/decks';
import { TarotCardVisual } from '../features/tarot/components/TarotCardVisual';
import { AiService } from '../core/services/ai.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { buildTarotRevealSummary } from '../features/tarot/utils/tarotInterpretation';
import { HapticsService } from '../core/services/haptics.service';
import { usePremiumStore } from '../store/usePremiumStore';
import { PremiumGateModal } from '../components/PremiumGateModal';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { formatLocaleDate } from '../core/utils/localeFormat';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { useTheme } from '../core/hooks/useTheme';
const ACCENT = '#CEAE72';

const MAJOR_ARCANA: { name: string; numeral: string; meaning: string; action: string }[] = [
  { name: 'Mag', numeral: 'I', meaning: 'Mag przypomina, że masz wszystkie narzędzia, których potrzebujesz — wystarczy świadoma wola i skupienie. Czas przekształcić intencję w ruch.', action: 'Zacznij jeden projekt, który czekał na odpowiedni moment.' },
  { name: 'Kapłanka', numeral: 'II', meaning: 'Kapłanka strzeże progu między tym, co widzialne, a tym, co głęboko intuicyjne. Dziś mówi głośniej milczenie niż słowa.', action: 'Poświęć 10 minut na cichy wgląd — bez ekranu, bez słów.' },
  { name: 'Cesarzowa', numeral: 'III', meaning: 'Cesarzowa niesie energię płodności, zmysłowości i troski o siebie. To dzień, w którym ciało i ziemia mówią równie głośno co umysł.', action: 'Zadbaj o jedno zmysłowe doświadczenie — spacer, dobry posiłek, dotyk natury.' },
  { name: 'Cesarz', numeral: 'IV', meaning: 'Cesarz uosabia strukturę, która wzmacnia, nie ogranicza. Porządek i jasne granice są dziś Twoją duchową praktyką.', action: 'Wyznacz jeden wyraźny priorytet i nie rozpraszaj się na boki.' },
  { name: 'Hierofant', numeral: 'V', meaning: 'Hierofant prowadzi ku tradycji i głębszemu sensowi rytuału. Dziś pytanie nie brzmi "co robić", lecz "dlaczego to jest ważne".', action: 'Odwiedź lub odtwórz rytuał, który niesie dla Ciebie prawdziwe znaczenie.' },
  { name: 'Kochankowie', numeral: 'VI', meaning: 'Kochankowie mówią o wyborze, który wymaga pełnego zaangażowania serca — nie tylko umysłu. Autentyczność jest dziś stawką.', action: 'Zadaj sobie jedno uczciwe pytanie: "Czego naprawdę pragnę?"' },
  { name: 'Rydwan', numeral: 'VII', meaning: 'Rydwan symbolizuje triumf woli nad rozproszeniem. Zwycięstwo przychodzi dziś nie przez siłę, lecz przez skupioną determinację.', action: 'Dokończ jedno zadanie, które odkładałeś z powodu braku impetu.' },
  { name: 'Siła', numeral: 'VIII', meaning: 'Siła mówi o odwadze miękkiej i cierpliwej — tej, która oswaja, nie podbija. Dziś jesteś mocniejszy niż myślisz.', action: 'Podejdź do trudnej sytuacji z łagodnością zamiast z opancerzeniem.' },
  { name: 'Pustelnik', numeral: 'IX', meaning: 'Pustelnik zaprasza do samotności, która oświeca, nie izoluje. Głęboka odpowiedź czeka w środku, nie na zewnątrz.', action: 'Zrób krótki wieczorny rachunek sumienia w dzienniku lub w ciszy.' },
  { name: 'Koło Fortuny', numeral: 'X', meaning: 'Koło Fortuny przypomina, że zmiana jest jedyną stałą. To, co się dziś obraca, otwiera nowy cykl — nie zamyka starego.', action: 'Zaakceptuj jeden element życia, na który nie masz wpływu.' },
  { name: 'Sprawiedliwość', numeral: 'XI', meaning: 'Sprawiedliwość wymaga równowagi i uczciwości — wobec innych i wobec siebie. Każda decyzja dziś niesie długie echo.', action: 'Przejrzyj jedno zobowiązanie: czy nadal jest uczciwe wobec Twoich wartości?' },
  { name: 'Wisielec', numeral: 'XII', meaning: 'Wisielec uczy, że rezygnacja z kontroli jest formą mądrości. Dzień zawieszenia przynosi wglądy niedostępne w biegu.', action: 'Pozwól sobie nie wiedzieć przez chwilę — bez szukania natychmiastowej odpowiedzi.' },
  { name: 'Śmierć', numeral: 'XIII', meaning: 'Śmierć w Tarocie to transformacja — koniec pewnego etapu, który oczyszcza pole dla nowego. Dziś coś dobiega końca, by mogło się narodzić.', action: 'Odpuść jedną rzecz, osobę lub przekonanie, które wiesz, że już Ci nie służy.' },
  { name: 'Umiarkowanie', numeral: 'XIV', meaning: 'Umiarkowanie miesza przeciwieństwa w złoty środek. Harmonia nie jest kompromisem — to alchemia z dwóch biegunów.', action: 'Znajdź jeden obszar, gdzie możesz działać z większą cierpliwością i subtelnością.' },
  { name: 'Diabeł', numeral: 'XV', meaning: 'Diabeł ujawnia to, co nas wiąże przez własny wybór. Uzależnienie, strach i iluzja tracą moc w momencie, gdy je nazwiesz.', action: 'Zidentyfikuj jedną przekonanie, które Cię ogranicza — i napisz jego nową wersję.' },
  { name: 'Wieża', numeral: 'XVI', meaning: 'Wieża burzy to, co zbudowane na fałszywym fundamencie. Nagłe odkrycie lub zmiana są tu łaską, nie karą.', action: 'Sprawdź jeden obszar życia, który utrzymujesz ze strachu, nie z sensu.' },
  { name: 'Gwiazda', numeral: 'XVII', meaning: 'Gwiazda niesie spokojną pewność, że po burzy zawsze pojawia się światło. Nadzieja dziś nie jest naiwnością — jest drogowskazem.', action: 'Zrób jeden gest pielęgnowania siebie lub kogoś bliskiego.' },
  { name: 'Księżyc', numeral: 'XVIII', meaning: 'Księżyc illuminuje sny, cienie i lęki, które domagają się uwagi. Niewyraźność dnia ma swoją wewnętrzną logikę — zaufaj jej.', action: 'Zapisz jeden sen, obraz lub niejasne przeczucie — nie analizuj, tylko zanotuj.' },
  { name: 'Słońce', numeral: 'XIX', meaning: 'Słońce przynosi radość bez zastrzeżeń i jasność, która przegania wątpliwości. Dziś pozwól sobie świecić autentycznie.', action: 'Zrób coś wyłącznie dla przyjemności — bez wydajności, bez uzasadnienia.' },
  { name: 'Sąd', numeral: 'XX', meaning: 'Sąd wzywa do przebudzenia i odpowiedzi na głębsze powołanie. To moment rozliczenia — nie z winy, lecz z gotowości do nowego życia.', action: 'Zapytaj siebie: "Czy żyję zgodnie z tym, kim naprawdę chcę być?"' },
  { name: 'Świat', numeral: 'XXI', meaning: 'Świat oznacza zakończenie pełnego cyklu i gotowość do wejścia w nowy. Integracja wszystkich lekcji tworzy nowy punkt wyjścia.', action: 'Świętuj jeden sukces lub zamknięty etap — choćby małym gestem wdzięczności.' },
  { name: 'Głupiec', numeral: '0', meaning: 'Głupiec rusza w drogę bez lęku przed nieznanym. Energia początku i spontanicznej ufności jest dziś Twoim największym zasobem.', action: 'Zrób jeden nieplanowany krok w kierunku, który budzi Twoją ciekawość.' },
];

const MOODS = [
  { id: 'excellent', icon: Sparkles, label: 'Otwartość',  copy: 'Czuję gotowość i przestrzeń na znak.',  color: '#34D399' },
  { id: 'good',      icon: SunMedium, label: 'Spokój',    copy: 'Jest we mnie oddech i klarowność.',      color: '#60A5FA' },
  { id: 'peaceful',  icon: MoonStar,  label: 'Miękkość',  copy: 'Potrzebuję łagodnego odczytu.',          color: '#A78BFA' },
  { id: 'weak',      icon: Shield,    label: 'Niepewność', copy: 'Szukam jasności i bezpiecznego oparcia.', color: '#FBBF24' },
  { id: 'difficult', icon: Flame,     label: 'Napięcie',  copy: 'Wchodzę z ciężarem lub pilnością.',      color: '#F87171' },
];

const SPREAD_COLORS: Record<string, string> = {
  'single_card': '#CEAE72',
  'three_card': '#60A5FA',
  'celtic_cross': '#A78BFA',
  'love_spread': '#F472B6',
  'shadow_work': '#F87171',
  'weekly': '#34D399',
};

const getSpreadIcon = (spreadId: string) => {
  if (spreadId === 'love_spread') return HeartHandshake;
  if (spreadId === 'shadow_work') return Flame;
  if (spreadId === 'celtic_cross') return Orbit;
  if (spreadId === 'weekly') return Star;
  return MoonStar;
};



const TarotGlobe = React.memo(({ accent, isDark }: { accent: string; isDark: boolean }) => {
  const rotY = useSharedValue(0);
  const tiltX = useSharedValue(0);
  useEffect(() => {
    rotY.value = withRepeat(
      withSequence(withTiming(25, { duration: 12000 }), withTiming(-25, { duration: 12000 })),
      -1, false
    );
  }, []);
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-30, Math.min(30, e.translationX * 0.15));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 800 });
    });
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { rotateY: rotY.value + tiltX.value + 'deg' },
      { rotateX: '-12deg' },
    ],
  }));
  const CARD_COUNT = 7;
  const CARD_W = 38;
  const CARD_H = 64;
  const ARC_R = 110;
  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ height: 120, alignItems: 'center', justifyContent: 'flex-end', marginVertical: 8 }, animStyle]}>
        <Svg width={300} height={120}>
          {Array.from({ length: CARD_COUNT }, (_, i) => {
            const angle = -30 + i * 10;
            const rad = (angle * Math.PI) / 180;
            const cx = 150 + ARC_R * Math.sin(rad);
            const cy = 110 - ARC_R * (1 - Math.cos(rad));
            const isCenter = i === 3;
            const tx = cx - CARD_W / 2;
            const ty = cy - CARD_H / 2;
            const hw = CARD_W / 2;
            const hh = CARD_H / 2;
            const tr = 'translate(' + tx + ',' + ty + ') rotate(' + angle + ',' + hw + ',' + hh + ')';
            const starD = 'M' + hw + ' ' + (hh-5) + ' L' + (hw+3) + ' ' + hh + ' L' + (hw+7) + ' ' + hh + ' L' + (hw+4) + ' ' + (hh+3) + ' L' + (hw+5) + ' ' + (hh+8) + ' L' + hw + ' ' + (hh+5) + ' L' + (hw-5) + ' ' + (hh+8) + ' L' + (hw-4) + ' ' + (hh+3) + ' L' + (hw-7) + ' ' + hh + ' L' + (hw-3) + ' ' + hh + ' Z';
            return (
              <G key={i} transform={tr}>
                <Rect x={0} y={0} width={CARD_W} height={CARD_H} rx={6} ry={6}
                  fill={isDark ? '#1A1228' : '#F5F0E8'}
                  stroke={isCenter ? accent : accent + '55'}
                  strokeWidth={isCenter ? 2 : 1}
                />
                <Rect x={3} y={3} width={CARD_W - 6} height={CARD_H - 6} rx={4} ry={4}
                  fill='none'
                  stroke={isCenter ? accent + 'AA' : accent + '33'}
                  strokeWidth={0.7}
                />
                <Path
                  d={starD}
                  fill={isCenter ? accent : accent + '44'}
                  opacity={0.8}
                />
              </G>
            );
          })}
        </Svg>
      </Animated.View>
    </GestureDetector>
  );
});

export const TarotScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const tr = (key: string, pl: string, en: string, options?: Record<string, unknown>) =>
    t(key, { defaultValue: i18n.language?.startsWith('en') ? en : pl, ...options });
  const insets = useSafeAreaInsets();
    const experience = useAppStore(s => s.experience);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const isDark = !isLight;
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.60)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.10)';
  const accent = ACCENT;
  const {
    activeSpread, drawnCards, userQuestion, moodBefore,
    setActiveSpread, setUserQuestion, setMoodBefore,
    drawCard, resetReading, selectedDeckId, setSelectedDeck, pastReadings, deleteReading,
  } = useTarotStore();
  const { isPremium, trackUsage } = usePremiumStore();
  const [tarotPaywallVisible, setTarotPaywallVisible] = useState(false);
  const [forSomeone, setForSomeone] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerBirth, setPartnerBirth] = useState('');
  const [showForSomeoneModal, setShowForSomeoneModal] = useState(false);
  const [showPreparation, setShowPreparation] = useState(false);
  const [inputCardY, setInputCardY] = useState(0);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [revealState, setRevealState] = useState<{
    slotIndex: number; phase: 'consulting' | 'revealed';
    cardName: string; meaning: string; isReversed: boolean; card: any;
  } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const routeDeckId = route.params?.deckId;
  useEffect(() => { if (routeDeckId && routeDeckId !== selectedDeckId) setSelectedDeck(routeDeckId); }, [routeDeckId, selectedDeckId, setSelectedDeck]);

  const deck = getTarotDeckById(routeDeckId || selectedDeckId);
  const aiAvailable = AiService.isLaunchAvailable();
  const aiState = AiService.getLaunchAvailabilityState();
  const selectedSpreadMeta = useMemo(() => activeSpread ? SPREADS.find(s => s.id === activeSpread.id) || activeSpread : null, [activeSpread]);

  useEffect(() => {
    if (!revealState || revealState.phase !== 'consulting') return;
    const t = setTimeout(() => setRevealState(c => c ? { ...c, phase: 'revealed' } : c), 1200);
    return () => clearTimeout(t);
  }, [revealState]);

  const startReading = (spread: any) => {
    void HapticsService.impact('medium');
    AudioService.playTransitionAmbience();
    setActiveSpread(spread);
    setShowPreparation(true);
  };

  const handleDraw = (index: number) => {
    const drawn = drawCard(index);
    if (!drawn) return;
    void HapticsService.notify();
    setRevealState({
      slotIndex: index, phase: 'consulting',
      cardName: resolveUserFacingText(drawn.card.name),
      meaning: buildTarotRevealSummary({ question: userQuestion, spread: activeSpread, card: drawn.card, isReversed: drawn.isReversed, slotIndex: index, mode: activeSpread?.id === 'love_spread' ? 'partner' : 'solo' }),
      isReversed: drawn.isReversed, card: drawn.card,
    });
  };

  // ── SPREAD SELECTION ─────────────────────────────────────
  const [showSpreads, setShowSpreads] = useState(false);

  const hubEntries = useMemo(() => ([
    { id: 'wrozka', icon: Brain, color: '#60A5FA', label: tr('tarot.hub.oracle.label', 'Wróżka AI', 'AI Oracle'), desc: tr('tarot.hub.oracle.desc', 'Intymna rozmowa z wirtualną wróżką — pytaj o wszystko, bez formy i bez oceniania.', 'An intimate conversation with a virtual oracle — ask anything, without rigid form or judgment.'), onPress: () => navigation.navigate('Wrozka') },
    { id: 'relacyjny', icon: HeartHandshake, color: '#F472B6', label: tr('tarot.hub.relational.label', 'Tarot relacyjny', 'Relational Tarot'), desc: tr('tarot.hub.relational.desc', 'Odczyt dla dwojga — odsłania więź, napięcie i to, czego żadne z was nie mówi wprost.', 'A reading for two — revealing the bond, tension, and what neither of you says directly.'), onPress: () => navigation.navigate('PartnerTarot') },
    { id: 'biblioteka', icon: BookOpen, color: '#34D399', label: tr('tarot.hub.decks.label', 'Biblioteka talii', 'Deck Library'), desc: tr('tarot.hub.decks.desc', 'Wybierz talię, która rezonuje z Tobą dziś — każda wnosi inny klimat ceremonii.', 'Choose the deck that resonates with you today — each one brings a different ceremonial tone.'), onPress: () => navigation.navigate('TarotDeckSelection') },
    { id: 'rok', icon: Star, color: '#FBBF24', label: tr('tarot.hub.yearCard.label', 'Karta roku', 'Year Card'), desc: tr('tarot.hub.yearCard.desc', 'Jeden archetypowy symbol na cały rok numerologiczny — kompas, nie wyrok.', 'One archetypal symbol for the whole numerological year — a compass, not a verdict.'), onPress: () => navigation.navigate('YearCard') },
    { id: 'archiwum', icon: History, color: ACCENT, label: tr('tarot.hub.archive.label', 'Archiwum odczytów', 'Reading Archive'), desc: tr('tarot.hub.archive.desc', 'Wszystkie przeszłe konsultacje — wróć do symboli, które już raz Cię dotknęły.', 'All past consultations — return to the symbols that already touched you once.'), onPress: () => setShowHistoryModal(true) },
  ] as const), [navigation, tr]);

  const renderSpreadSelection = () => (
    <ScrollView style={ts.selectionContainer} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: screenContracts.bottomInset(insets.bottom, 'airy') }}>

      {/* TOP BAR */}
      <View style={[ts.topBar, { paddingHorizontal: layout.padding.screen }]}>
        <Pressable onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('TarotDeckSelection')} style={ts.topAction}>
          <ChevronLeft color={ACCENT} size={18} />
          <Typography variant="microLabel" color={ACCENT} style={{ marginLeft: 4 }}>{tr('tarot.decks', 'Talie', 'Decks')}</Typography>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <MusicToggleButton color={ACCENT} size={17} />
          <Pressable onPress={() => setShowForSomeoneModal(true)} style={ts.topAction}>
            <Users color={forSomeone ? ACCENT : ACCENT + '55'} size={17} strokeWidth={1.8} fill={forSomeone ? ACCENT + '33' : 'none'} />
          </Pressable>
          <Pressable onPress={() => { if (isFavoriteItem('tarot')) { removeFavoriteItem('tarot'); } else { addFavoriteItem({ id: 'tarot', label: 'Tarot', route: 'Tarot', params: {}, icon: 'Star', color: ACCENT, addedAt: new Date().toISOString() }); } }} style={ts.topAction}>
            <Star color={isFavoriteItem('tarot') ? ACCENT : ACCENT + '88'} size={17} strokeWidth={1.8} fill={isFavoriteItem('tarot') ? ACCENT : 'none'} />
          </Pressable>
          <Pressable onPress={() => setShowHistoryModal(true)} style={ts.topAction}>
            <History color={ACCENT} size={17} />
          </Pressable>
        </View>
      </View>

      {forSomeone && (
        <View style={[ts.forSomeoneBanner, { marginHorizontal: layout.padding.screen }]}>
          <Users color={ACCENT} size={13} strokeWidth={1.8} />
          <Typography variant="microLabel" color={ACCENT} style={{ marginLeft: 6 }}>{tr('tarot.readingFor', 'Odczyt dla', 'Reading for')}: {partnerName}</Typography>
        </View>
      )}

      {/* HERO */}
      <Animated.View entering={FadeInDown.duration(700)} style={ts.hubHero}>
        <LinearGradient
          colors={isLight ? ['#FAF5E4', '#F5EDD0', 'transparent'] as any : ['#1A1228', '#120D1E', 'transparent'] as any}
          style={StyleSheet.absoluteFillObject as any}
        />
        <TarotGlobe accent={accent} isDark={!isLight} />
        <Typography variant="premiumLabel" color={ACCENT} style={{ letterSpacing: 3, marginTop: 4 }}>{t('tarot.tarot', '✦ TAROT ✦')}</Typography>
        <Typography variant="heroTitle" style={[ts.hubHeroTitle, { color: isLight ? '#1A1A1A' : '#F0EBE2' }]}>{tr('tarot.chamber', 'Komnata Tarota', 'Tarot Chamber')}</Typography>
        <Typography variant="bodySmall" style={[ts.hubHeroTagline, { color: isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)' }]}>
          {tr('tarot.heroCopy', 'Karty nie kłamią — mówią tym, czego jeszcze nie śmiesz powiedzieć na głos.', 'The cards do not lie — they speak what you still do not dare to say aloud.')}
        </Typography>
      </Animated.View>

      {/* TON DNIA */}
      <View style={[ts.hubToneDnia, { paddingHorizontal: layout.padding.screen }]}>
        <View style={[ts.hubToneDivider, { backgroundColor: ACCENT + '55' }]} />
        <Typography variant="microLabel" color={ACCENT} style={{ marginHorizontal: 10, letterSpacing: 2 }}>{tr('tarot.toneOfDay', '🌙 TON DNIA', '🌙 TONE OF THE DAY')}</Typography>
        <View style={[ts.hubToneDivider, { backgroundColor: ACCENT + '33' }]} />
      </View>
      <Typography variant="bodySmall" style={[ts.hubToneText, { paddingHorizontal: layout.padding.screen, color: isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.65)' }]}>
        {tr('tarot.toneCopy', 'Energia dziś sprzyja pytaniom o kierunek — nie o gotową odpowiedź. Pozwól karcie wskazać, a nie potwierdzić to, co już wiesz.', 'Today’s energy favors questions about direction, not ready-made answers. Let the card point the way instead of confirming what you already know.')}
      </Typography>

      {/* ── KARTA DNIA (rotating Major Arcana) ── */}
      {(() => {
        const dayIndex = new Date().getDate() % 22;
        const card = MAJOR_ARCANA[dayIndex];
        return (
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 18 }}>
            <View style={{ borderRadius: 20, borderWidth: 1, borderColor: ACCENT + '30', backgroundColor: isLight ? 'rgba(206,174,114,0.06)' : 'rgba(206,174,114,0.07)', overflow: 'hidden', padding: 18 }}>
              <LinearGradient colors={isLight ? ['rgba(206,174,114,0.08)', 'transparent'] as any : ['rgba(206,174,114,0.12)', 'transparent'] as any} style={StyleSheet.absoluteFillObject as any} />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Typography variant="microLabel" color={ACCENT} style={{ fontSize: 12, fontWeight: '800' }}>{card.numeral}</Typography>
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="microLabel" color={ACCENT} style={{ letterSpacing: 2, marginBottom: 2 }}>🎴 {t('tarot.cardOfDay')}</Typography>
                  <Typography variant="cardTitle" style={{ color: isLight ? '#1A1A1A' : '#F0EBE2', fontSize: 17, fontWeight: '700' }}>{card.name}</Typography>
                </View>
              </View>
              <Typography variant="bodySmall" style={{ color: isLight ? 'rgba(0,0,0,0.70)' : 'rgba(240,235,226,0.80)', lineHeight: 22, marginBottom: 12 }}>{card.meaning}</Typography>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: ACCENT, marginTop: 8, flexShrink: 0 }} />
                <Typography variant="caption" style={{ color: ACCENT, flex: 1, lineHeight: 19, fontWeight: '600' }}>{card.action}</Typography>
              </View>
            </View>
          </Animated.View>
        );
      })()}

      {/* PRIMARY ACTIONS */}
      <View style={[ts.hubPrimaryRow, { paddingHorizontal: layout.padding.screen }]}>
        <Animated.View entering={FadeInUp.delay(80).duration(500)} style={{ flex: 1 }}>
          <Pressable onPress={() => navigation.navigate('DailyTarot')} style={ts.hubPrimaryTile}>
            <LinearGradient colors={[ACCENT + '30', ACCENT + '10']} style={[StyleSheet.absoluteFillObject as any, { borderRadius: 20 }]} />
            <View style={[ts.hubPrimaryIcon, { backgroundColor: ACCENT + '22' }]}>
              <MoonStar color={ACCENT} size={22} strokeWidth={1.6} />
            </View>
            <View style={{ gap: 3 }}>
              <Typography variant="cardTitle" style={{ color: isLight ? '#1A1A1A' : '#F0EBE2', fontSize: 14 }} numberOfLines={2}>{tr('tarot.dailyCardLabel', '🃏 Karta dnia', '🃏 Card of the day')}</Typography>
              <Typography variant="caption" style={{ color: isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.5)', lineHeight: 17 }} numberOfLines={2}>{tr('tarot.dailyCardSub', 'Jeden symbol, jeden ton', 'One symbol, one tone')}</Typography>
            </View>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).duration(500)} style={{ flex: 1 }}>
          <Pressable onPress={() => setShowSpreads(v => !v)} style={ts.hubPrimaryTile}>
            <LinearGradient colors={['#A78BFA30', '#A78BFA10']} style={[StyleSheet.absoluteFillObject as any, { borderRadius: 20 }]} />
            <View style={[ts.hubPrimaryIcon, { backgroundColor: '#A78BFA22' }]}>
              <Sparkles color="#A78BFA" size={22} strokeWidth={1.6} />
            </View>
            <View style={{ gap: 3 }}>
              <Typography variant="cardTitle" style={{ color: isLight ? '#1A1A1A' : '#F0EBE2', fontSize: 14 }} numberOfLines={2}>✨ {t('tarot.newReading')}</Typography>
              <Typography variant="caption" style={{ color: isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.5)', lineHeight: 17 }} numberOfLines={2}>{t('tarot.chooseSpread')}</Typography>
            </View>
          </Pressable>
        </Animated.View>
      </View>

      {/* SPREADS (expanded) */}
      {showSpreads && (
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 6 }}>
          <Typography variant="premiumLabel" color={ACCENT} style={{ marginBottom: 12 }}>{t('tarot.chooseSpread')}</Typography>
          {SPREADS.map((item, index) => {
            const Icon = getSpreadIcon(item.id);
            const spreadColor = SPREAD_COLORS[item.id] || ACCENT;
            return (
              <Animated.View key={item.id} entering={FadeInUp.delay(index * 60).duration(420)}>
                <Pressable style={[ts.hubSpreadRow, { borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.07)' }]} onPress={() => { setShowSpreads(false); startReading(item); }}>
                  <View style={[ts.hubSpreadIcon, { backgroundColor: spreadColor + '20' }]}>
                    <Icon color={spreadColor} size={18} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Typography variant="cardTitle" style={{ color: spreadColor, fontSize: 14 }}>{item.name}</Typography>
                    <Typography variant="caption" style={{ color: isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.5)', marginTop: 2 }}>{item.description}</Typography>
                  </View>
                  <View style={[ts.spreadBadge, { backgroundColor: spreadColor + '18', borderColor: spreadColor + '33' }]}>
                    <Typography variant="microLabel" color={spreadColor}>{item.slots.length} kart</Typography>
                  </View>
                  <ArrowRight color={spreadColor} size={14} style={{ marginLeft: 10 }} />
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>
      )}

      {/* INNE WEJŚCIA */}
      <View style={[ts.hubSectionHeader, { paddingHorizontal: layout.padding.screen }]}>
        <Typography variant="premiumLabel" color={ACCENT} style={{ letterSpacing: 2 }}>⚡ {t('tarot.yourTools')}</Typography>
      </View>

      <View style={{ paddingHorizontal: layout.padding.screen }}>
        {hubEntries.map((entry, index) => {
          const Icon = entry.icon;
          const isLast = index === hubEntries.length - 1;
          return (
            <Animated.View key={entry.id} entering={FadeInUp.delay(200 + index * 70).duration(450)}>
              <Pressable style={[ts.hubEntryRow, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.07)' }]} onPress={entry.onPress}>
                <View style={[ts.hubEntryIcon, { backgroundColor: entry.color + '1A' }]}>
                  <Icon color={entry.color} size={20} strokeWidth={1.7} />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Typography variant="cardTitle" style={{ color: isLight ? '#1A1A1A' : '#F0EBE2', fontSize: 15 }}>{entry.label}</Typography>
                  <Typography variant="caption" style={{ color: isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.50)', marginTop: 3, lineHeight: 18 }}>{entry.desc}</Typography>
                </View>
                <ArrowRight color={isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.30)'} size={16} />
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* ── CO DALEJ? quick links ── */}
      <Animated.View entering={FadeInDown.delay(350).duration(500)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 8, marginBottom: 4 }}>
        <View style={[ts.hubSectionHeader, { borderBottomWidth: 0, paddingHorizontal: 0 }]}>
          <Typography variant="premiumLabel" color={ACCENT} style={{ letterSpacing: 2 }}>{t('tarot.co_dalej', '✦ CO DALEJ?')}</Typography>
        </View>
        {[
          { label: tr('tarot.next.numerology.label', 'Numerologia — odkryj swój cykl', 'Numerology — discover your cycle'), sub: tr('tarot.next.numerology.sub', 'Liczby i energia aktualnego okresu', 'Numbers and the energy of the current period'), route: 'Numerology', color: '#A78BFA', icon: BookOpen },
          { label: tr('tarot.next.stars.label', 'Obserwatorium — mapa nieba', 'Observatory — sky map'), sub: tr('tarot.next.stars.sub', 'Gwiazdy i konfiguracje planetarne', 'Stars and planetary configurations'), route: 'Stars', color: '#60A5FA', icon: Star },
          { label: tr('tarot.next.journal.label', 'Dziennik — co karta mówi o cyklu?', 'Journal — what does the card say about the cycle?'), sub: tr('tarot.next.journal.sub', 'Co karta dnia mówi mi o moim obecnym cyklu życia?', 'What does the card of the day tell me about my current life cycle?'), route: 'JournalEntry', params: { prompt: tr('tarot.next.journal.prompt', 'Co karta dnia mówi mi o moim obecnym cyklu życia?', 'What does the card of the day tell me about my current life cycle?'), type: 'tarot' }, color: ACCENT, icon: BookOpen },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <Pressable
              key={item.route + i}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: i < 2 ? StyleSheet.hairlineWidth : 0, borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.07)' }}
              onPress={() => navigation.navigate(item.route as any, (item as any).params)}
            >
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: item.color + '1A', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Icon color={item.color} size={18} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="cardTitle" style={{ color: isLight ? '#1A1A1A' : '#F0EBE2', fontSize: 14 }}>{item.label}</Typography>
                <Typography variant="caption" style={{ color: isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.50)', marginTop: 2 }}>{item.sub}</Typography>
              </View>
              <ArrowRight color={isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.30)'} size={15} />
            </Pressable>
          );
        })}
      </Animated.View>

      <EndOfContentSpacer size="airy" />
    </ScrollView>
  );

  // ── PREPARATION ───────────────────────────────────────────
  const renderPreparation = () => (
    <ScrollView ref={scrollRef} contentContainerStyle={[ts.prepContainer, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') }]} showsVerticalScrollIndicator={false}>
      <View style={ts.topBar}>
        <Pressable onPress={resetReading} style={ts.topAction}>
          <ChevronLeft color={ACCENT} size={18} />
          <Typography variant="microLabel" color={ACCENT} style={{ marginLeft: 6 }}>{tr('common.back', 'Wróć', 'Back')}</Typography>
        </Pressable>
        <Typography variant="microLabel" color={ACCENT}>{tr('tarot.preparation', 'Przygotowanie', 'Preparation')}</Typography>
        <Pressable onPress={() => setShowForSomeoneModal(true)} style={ts.topAction}>
          <Users color={forSomeone ? ACCENT : ACCENT + '55'} size={16} strokeWidth={1.8} fill={forSomeone ? ACCENT + '33' : 'none'} />
        </Pressable>
      </View>
      {forSomeone && (
        <View style={ts.forSomeoneBanner}>
          <Users color={ACCENT} size={13} strokeWidth={1.8} />
          <Typography variant="microLabel" color={ACCENT} style={{ marginLeft: 6 }}>{tr('tarot.readingFor', 'Odczyt dla', 'Reading for')}: {partnerName}</Typography>
        </View>
      )}

      <Animated.View entering={FadeIn.duration(800)} style={ts.ceremonyHero}>
        <LinearGradient
          colors={(isLight ? ['#F5F0FF', '#EDE6FF', '#E6DCFF'] : ['#1A0A2E', '#0D0618', '#13082A']) as any}
          style={{ borderRadius: 20, paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center', width: '100%' }}
        >
          <View style={[ts.ceremonyHalo, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : '#0F1320', borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(206,174,114,0.25)' }]}>
            <Brain color={ACCENT} size={32} strokeWidth={1.1} />
          </View>
          <Typography variant="editorialHeader" style={ts.ceremonyTitle}>{tr('tarot.ceremony.title', 'Najpierw przyjmij pytanie w ciszy. Potem pozwól talii odpowiedzieć.', 'First receive the question in silence. Then allow the deck to answer.')}</Typography>
          <Typography variant="bodySmall" style={ts.ceremonyCopy}>{tr('tarot.ceremony.copy', 'Aethera zapamiętuje ton Twojego pytania i energię chwili — zanim rozpocznie ceremonię odsłonięcia kart.', 'Aethera remembers the tone of your question and the energy of the moment before beginning the ceremony of revealing the cards.')}</Typography>
        </LinearGradient>
      </Animated.View>

      <View style={[ts.prepDeckCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.08)', borderWidth: 1, borderRadius: 16 }]}>
        <View style={ts.prepDeckRow}>
          <TarotCardVisual deck={deck} faceDown size="small" subtitle={t('tarot.talia_aktywna', 'Talia aktywna')} />
          <View style={{ flex: 1 }}>
            <Typography variant="premiumLabel" color={ACCENT}>{deck.name}</Typography>
            <Typography variant="bodySmall" style={ts.prepDeckCopy}>{deck.description}</Typography>
          </View>
        </View>
      </View>

      <View style={ts.inputCard} onLayout={(e) => setInputCardY(e.nativeEvent.layout.y)}>
        <Typography variant="premiumLabel" color={ACCENT}>{tr('tarot.questionOrIntention', 'Pytanie lub intencja', 'Question or intention')}</Typography>
        <TextInput style={[ts.textInput, { color: currentTheme.text, borderColor: ACCENT + '55', backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)' }]}
          placeholder={tr('tarot.questionPlaceholder', 'Napisz, co naprawdę chcesz dziś zrozumieć', 'Write what you truly want to understand today')} placeholderTextColor={currentTheme.textMuted}
          multiline value={userQuestion} onChangeText={setUserQuestion}
          onFocus={() => setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, inputCardY - 60), animated: true }), 350)} />
      </View>

      <Typography variant="premiumLabel" color={ACCENT} style={{ marginTop: 22, marginBottom: 14 }}>{tr('tarot.entryEnergy', 'Z jakiej energii wchodzisz?', 'From which energy are you entering?')}</Typography>
      <View style={ts.moodGrid}>
        {MOODS.map(mood => {
          const active = moodBefore === mood.id;
          const Icon = mood.icon;
          return (
            <Pressable key={mood.id} onPress={() => { void HapticsService.selection(); AudioService.playTouchTone(); setMoodBefore(mood.id); }}
              style={[ts.moodCard, { backgroundColor: cardBg, borderColor: cardBorder }, active && { borderColor: mood.color, backgroundColor: mood.color + '18' }]}>
              <Icon color={active ? mood.color : currentTheme.textMuted} size={20} style={{ alignSelf: 'center' }} />
              <Typography variant="bodySmall" style={[ts.moodLabel, active && { color: mood.color }]}>{mood.label}</Typography>
              <Typography variant="caption" style={ts.moodCopy}>{mood.copy}</Typography>
            </Pressable>
          );
        })}
      </View>

      <PremiumButton label={tr('tarot.startRevealCeremony', 'Rozpocznij ceremonię odsłonięcia', 'Begin the reveal ceremony')} onPress={() => {
        if (forSomeone && partnerName.trim() && partnerBirth.trim()) {
          setUserQuestion(userQuestion.trim() + ' ' + tr('tarot.forSomeonePrompt', `Odczyt jest przeznaczony dla osoby o imieniu ${partnerName}, urodzonej ${partnerBirth}.`, `This reading is intended for a person named ${partnerName}, born on ${partnerBirth}.`));
        }
        setShowPreparation(false);
      }} disabled={!userQuestion.trim() || !moodBefore} style={{ marginTop: 24 }} />
      <EndOfContentSpacer size="compact" />
    </ScrollView>
  );

  // ── DECK (reading) ────────────────────────────────────────
  const renderDeck = () => (
    <ScrollView contentContainerStyle={[ts.deskContainer, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') + 4 }]} showsVerticalScrollIndicator={false}>
      <View style={ts.topBar}>
        <Pressable onPress={resetReading} style={ts.topAction}>
          <ChevronLeft color={ACCENT} size={18} />
          <Typography variant="microLabel" color={ACCENT} style={{ marginLeft: 6 }}>{t('tarot.zmien_spread', 'Zmień spread')}</Typography>
        </Pressable>
        <Typography variant="microLabel" color={ACCENT}>{selectedSpreadMeta?.name}</Typography>
      </View>

      <Animated.View entering={FadeInDown.duration(700)} style={ts.deckHero}>
        <Typography variant="premiumLabel" color={ACCENT}>{deck.name}</Typography>
        <Typography variant="heroTitle" style={{ marginTop: 8, textAlign: 'center' }}>{t('tarot.talia_jest_gotowa_na_twoje', 'Talia jest gotowa na Twoje pytanie.')}</Typography>
        <Typography variant="bodySmall" style={ts.deckCopy}>{t('tarot.dotknij_pozycji_ktora_chcesz_odslon', 'Dotknij pozycji, którą chcesz odsłonić. Aethera wyłoni kartę i dopiero potem wprowadzi ją do rozkładu.')}</Typography>
      </Animated.View>

      <View style={ts.deckPresence}>
        {[0, 1, 2, 3, 4].map(i => (
          <View key={i} style={[ts.presenceCard, { zIndex: 5 - Math.abs(i - 2), transform: [{ rotate: `${(i - 2) * 5}deg` }, { translateX: (i - 2) * 10 }, { translateY: Math.abs(i - 2) * 2.5 }] }]}>
            <TarotCardVisual deck={deck} faceDown size="small" subtitle={t('tarot.talia_w_konsultacj', 'Talia w konsultacji')} />
          </View>
        ))}
      </View>

      <View style={ts.questionStrip}>
        <Typography variant="microLabel" color={ACCENT}>{t('tarot.przyjete_pytanie', 'Przyjęte pytanie')}</Typography>
        <Typography variant="bodySmall" style={{ marginTop: 8, lineHeight: 22 }}>{userQuestion}</Typography>
      </View>

      <View style={ts.deckSectionHeader}>
        <Typography variant="premiumLabel" color={ACCENT}>{t('tarot.mapa_rozkladu', 'Mapa rozkładu')}</Typography>
        <Typography variant="bodySmall" style={ts.deckSectionCopy}>{t('tarot.kazda_pozycja_jest_osobnym_polem', 'Każda pozycja jest osobnym polem znaczenia. Nie losuj wszystkiego naraz. Wejdź w układ karta po karcie.')}</Typography>
      </View>

      <View style={ts.cardDesk}>
        {selectedSpreadMeta?.slots.map((slot, index) => {
          const drawn = drawnCards.find(e => e.slotIndex === index);
          return (
            <Animated.View key={index} entering={FadeInUp.delay(index * 120).duration(580)} style={ts.slotWrapper}>
              <Pressable onPress={() => handleDraw(index)} disabled={!!drawn} style={ts.slotPress}>
                <View style={[ts.slotCard, drawn
                  ? { backgroundColor: ACCENT + '12', borderColor: ACCENT + '30', borderWidth: 1 }
                  : { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.08)', borderWidth: 1 }
                ]}>
                  {drawn ? (
                    <View style={ts.drawnContent}>
                      <TarotCardVisual deck={deck} card={drawn.card} isReversed={drawn.isReversed} size="small" subtitle={drawn.isReversed ? t('tarot.reversed') : t('tarot.upright')} />
                      <Typography variant="bodySmall" style={{ marginTop: 10, textAlign: 'center' }}>{resolveUserFacingText(drawn.card.name)}</Typography>
                    </View>
                  ) : (
                    <View style={ts.emptySlot}>
                      <Typography variant="microLabel" color={ACCENT}>Pozycja {index + 1}</Typography>
                      <Typography variant="cardTitle" style={{ marginTop: 10, textAlign: 'center' }}>{slot.label}</Typography>
                      <Typography variant="bodySmall" style={{ marginTop: 8, textAlign: 'center', opacity: 0.75 }}>{slot.description}</Typography>
                    </View>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {drawnCards.length > 0 && drawnCards.length === selectedSpreadMeta?.slots.length && (
        <Animated.View entering={FadeIn.delay(300).duration(600)}>
          <View style={[ts.synthesisBlock, { borderColor: ACCENT + '44', backgroundColor: ACCENT + '08' }]}>
            <LinearGradient colors={[ACCENT + '18', 'transparent']} style={StyleSheet.absoluteFillObject as any}/>
            <Typography variant="premiumLabel" color={ACCENT}>{t('tarot.synteza_rozkladu', 'SYNTEZA ROZKLADU')}</Typography>
            <Typography variant="editorialHeader" style={[ts.synthesisTitle, { color: isLight ? '#251D16' : '#F5F1EA' }]}>
              {drawnCards.filter(card => card.isReversed).length > 1
                ? 'Napiecie — kilka kart niesie energie wymagajaca pracy'
                : drawnCards.filter(card => card.isReversed).length === 1
                ? 'Jeden punkt oporu w silnym przeplywi energii'
                : 'Czysty przeplyw — wszystkie karty wchodza prosto'}
            </Typography>
            <Typography variant="bodySmall" style={[ts.synthesisCopy, { color: subColor }]}>
              {selectedSpreadMeta?.name} ({String(drawnCards.length)} kart) gotowy do interpretacji.
            </Typography>
            <View style={ts.synthesisStats}>
              <View style={ts.synthesisStatItem}>
                <Typography variant="cardTitle" color={ACCENT}>{String(drawnCards.length)}</Typography>
                <Typography variant="caption">{t('tarot.kart', 'Kart')}</Typography>
              </View>
              <View style={ts.synthesisStatDiv}/>
              <View style={ts.synthesisStatItem}>
                <Typography variant="cardTitle" color={drawnCards.filter(card => card.isReversed).length > 0 ? '#F87171' : '#34D399'}>
                  {String(drawnCards.filter(card => card.isReversed).length)}
                </Typography>
                <Typography variant="caption">{t('tarot.odwrocone', 'Odwrocone')}</Typography>
              </View>
              <View style={ts.synthesisStatDiv}/>
              <View style={ts.synthesisStatItem}>
                <Typography variant="cardTitle" color={ACCENT}>{selectedSpreadMeta?.name?.slice(0,8) || ''}</Typography>
                <Typography variant="caption">{t('tarot.rozklad', 'Rozklad')}</Typography>
              </View>
            </View>
          </View>
        </Animated.View>
      )}
      {drawnCards.length === selectedSpreadMeta?.slots.length && (
        <Animated.View entering={FadeIn.duration(600)} style={ts.deskFooter}>
          <Typography variant="caption" style={ts.footerHint}>{t('tarot.wszystkie_pozycje_odsloniete_rozkla', 'Wszystkie pozycje odsłonięte. Rozkład gotowy do interpretacji.')}</Typography>
          <PremiumButton label={t('tarot.otworz_dossier_interpreta', 'Otwórz dossier interpretacji')} onPress={() => {
            if (!isPremium && !trackUsage('tarot')) {
              setTarotPaywallVisible(true);
              return;
            }
            navigation.navigate('ReadingDetail');
          }} />
          <Pressable
            style={ts.inlineGuide}
            onPress={() =>
              navigation.navigate('JournalEntry', {
                prompt: `Rozkład ${selectedSpreadMeta?.name} jest już odsłonięty. Która karta najmocniej domaga się interpretacji i jakie pytanie naprawdę otwiera ten odczyt?`,
                type: 'tarot',
              })
            }
          >
            <Typography variant="microLabel" color={ACCENT}>{t('tarot.zapisz_intencje_przed_odczytem', 'Zapisz intencję przed odczytem')}</Typography>
          </Pressable>
        </Animated.View>
      )}
      <EndOfContentSpacer size="compact" />
    </ScrollView>
  );

  return (
    <View style={[ts.container, { backgroundColor: currentTheme.background }]}>
      <TarotBackground color={ACCENT} isLight={isLight} />
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={insets.top + (Platform.OS === 'android' ? 24 : 0)} style={{ flex: 1 }}>
        <SafeAreaView edges={['top']} style={ts.safe}>
          {!activeSpread ? renderSpreadSelection() : showPreparation ? renderPreparation() : renderDeck()}
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* REVEAL MODAL */}
      <Modal visible={!!revealState} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setRevealState(null)}>
        <View style={[ts.modalOverlay, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 18 }]}>
          <Pressable style={StyleSheet.absoluteFillObject as any} onPress={() => setRevealState(null)} />
          <View style={[ts.modalShell, { backgroundColor: currentTheme.backgroundElevated, borderColor: currentTheme.glassBorder }]}>
            {revealState ? (
              revealState.phase === 'consulting' ? (
                <Animated.View entering={FadeIn.duration(400)} style={ts.modalStage}>
                  <Typography variant="premiumLabel" color={ACCENT}>{t('tarot.talia_przyjmuje_pytanie', 'Talia przyjmuje pytanie')}</Typography>
                  <Typography variant="bodySmall" style={ts.modalCopy}>{userQuestion}</Typography>
                  <View style={ts.modalFan}>
                    {[0, 1, 2, 3, 4].map(i => (
                      <View key={i} style={[ts.modalFanItem, { zIndex: 5 - Math.abs(i - 2), transform: [{ rotate: `${(i - 2) * 8}deg` }, { translateX: (i - 2) * 12 }, { translateY: Math.abs(i - 2) * 4 }] }]}>
                        <TarotCardVisual deck={deck} faceDown size="small" subtitle={t('tarot.przywolani', 'Przywołanie')} />
                      </View>
                    ))}
                  </View>
                  <Typography variant="caption" style={[ts.modalCopy, { opacity: 0.65 }]}>{t('tarot.karta_wylania_sie_z_talii', 'Karta wyłania się z talii spokojnie.')}</Typography>
                </Animated.View>
              ) : (
                <Animated.View entering={FadeInDown.duration(500)} style={ts.modalStage}>
                  <Typography variant="premiumLabel" color={ACCENT}>Karta {(revealState?.slotIndex || 0) + 1} z {selectedSpreadMeta?.slots?.length || 0}</Typography>
                  <View style={{ marginTop: 18 }}>
                    <TarotCardVisual deck={deck} card={revealState.card} isReversed={revealState.isReversed} size="large" subtitle={revealState.isReversed ? 'Energia odwrócona' : 'Energia karty'} />
                  </View>
                  <Typography variant="editorialHeader" style={{ marginTop: 16, textAlign: 'center' }}>{revealState.cardName}</Typography>
                  <Typography variant="bodySmall" style={ts.modalCopy}>{revealState.meaning}</Typography>
                  <Pressable style={[ts.acceptReveal, { backgroundColor: ACCENT }]} onPress={() => setRevealState(null)}>
                    <CheckCircle2 color={currentTheme.background} size={16} />
                    <Typography variant="premiumLabel" color={currentTheme.background} style={{ marginLeft: 10 }}>{t('tarot.wprowadz_karte_do_rozkladu', 'Wprowadź kartę do rozkładu')}</Typography>
                  </Pressable>
                </Animated.View>
              )
            ) : null}
          </View>
        </View>
      </Modal>

      {/* HISTORY MODAL */}
      <Modal visible={showHistoryModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowHistoryModal(false)}>
        <View style={[ts.modalOverlay, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 18 }]}>
          <Pressable style={StyleSheet.absoluteFillObject as any} onPress={() => setShowHistoryModal(false)} />
          <View style={[ts.historyShell, { backgroundColor: currentTheme.backgroundElevated, borderColor: currentTheme.glassBorder }]}>
            <Typography variant="premiumLabel" color={ACCENT}>{t('tarot.archiwum_tarota', 'Archiwum tarota')}</Typography>
            <Typography variant="bodySmall" style={ts.historyIntro}>{t('tarot.historia_twoich_odczytow_usun_jesli', 'Historia Twoich odczytów. Usuń, jeśli nie chcesz już trzymać zapisu.')}</Typography>
            <ScrollView contentContainerStyle={{ gap: 10, paddingTop: 14, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
              {pastReadings.map((r, idx) => (
                <View key={r.id} style={[{ padding: 16, borderRadius: 14, backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.08)' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Typography variant="premiumLabel" color={ACCENT}>{r.spread.name}</Typography>
                    <Typography variant="bodySmall" style={{ marginTop: 6, opacity: 0.78 }}>{r.question || (i18n.language?.startsWith('en') ? 'Reading without a question' : 'Odczyt bez pytania')} • {formatLocaleDate(r.date)}</Typography>
                    </View>
                    <Pressable style={[ts.deleteBtn, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)' }]} onPress={() => deleteReading(r.id)}>
                      <Trash2 color={ACCENT} size={15} />
                    </Pressable>
                  </View>
                </View>
              ))}
              {pastReadings.length === 0 && (
                <View style={{ padding: 16 }}>
                  <Typography variant="bodySmall" style={{ opacity: 0.75 }}>{t('tarot.brak_zapisanych_odczytow', 'Brak zapisanych odczytów.')}</Typography>
                </View>
              )}
            </ScrollView>
            <Pressable style={ts.historyClose} onPress={() => setShowHistoryModal(false)}>
              <RotateCcw color={ACCENT} size={15} />
              <Typography variant="premiumLabel" color={ACCENT} style={{ marginLeft: 10 }}>{t('tarot.zamknij_archiwum', 'Zamknij archiwum')}</Typography>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* FOR SOMEONE MODAL */}
      <Modal visible={showForSomeoneModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowForSomeoneModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setShowForSomeoneModal(false)}>
          <Pressable onPress={e => e.stopPropagation()} style={[ts.forSomeoneSheet, { backgroundColor: currentTheme.backgroundElevated, overflow: 'hidden', borderTopColor: ACCENT + '44', borderTopWidth: 1, borderLeftColor: ACCENT + '22', borderLeftWidth: 1, borderRightColor: ACCENT + '22', borderRightWidth: 1 }]}>
            <LinearGradient colors={[ACCENT + '18', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: ACCENT + '44', alignSelf: 'center', marginBottom: 18 }} />
            <Typography variant="cardTitle" style={{ color: currentTheme.text, marginBottom: 4 }}>{t('tarot.forSomeoneTitle')}</Typography>
            <Typography variant="bodySmall" style={{ color: currentTheme.textMuted, marginBottom: 20 }}>{t('tarot.enterName')}</Typography>

            <TextInput
              value={partnerName}
              onChangeText={setPartnerName}
              placeholder={t('tarot.imie_osoby', 'Imię osoby...')}
              placeholderTextColor={currentTheme.textMuted}
              style={[ts.fsInput, { color: currentTheme.text, borderColor: ACCENT + '44', backgroundColor: cardBg }]}
            />
            <TextInput
              value={partnerBirth}
              onChangeText={setPartnerBirth}
              placeholder={t('tarot.data_urodzenia_np_1990_05', 'Data urodzenia (np. 1990-05-15)...')}
              placeholderTextColor={currentTheme.textMuted}
              keyboardType="numbers-and-punctuation"
              style={[ts.fsInput, { color: currentTheme.text, borderColor: ACCENT + '44', backgroundColor: cardBg, marginTop: 10 }]}
            />

            {forSomeone && (
              <Pressable onPress={() => { setForSomeone(false); setShowForSomeoneModal(false); }} style={[ts.fsCta, { backgroundColor: 'rgba(255,100,100,0.2)', borderColor: '#FB7185', borderWidth: 1, marginTop: 12 }]}>
                <Typography variant="caption" style={{ color: '#FB7185', fontWeight: '600' }}>{t('tarot.wylacz_tryb_dla_kogos', 'Wyłącz tryb "Dla kogoś"')}</Typography>
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                if (partnerName.trim() && partnerBirth.trim()) {
                  setForSomeone(true);
                  setShowForSomeoneModal(false);
                }
              }}
              style={[ts.fsCta, { backgroundColor: ACCENT, marginTop: forSomeone ? 10 : 16 }]}
            >
              <Typography variant="caption" style={{ color: '#FFF', fontWeight: '700' }}>{t('tarot.potwierdz', 'Potwierdź')}</Typography>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Tarot Paywall Gate */}
      <PremiumGateModal
        visible={tarotPaywallVisible}
        onClose={() => setTarotPaywallVisible(false)}
        onNavigateToPaywall={() => { setTarotPaywallVisible(false); navigation.navigate('Paywall', { context: 'tarot' }); }}
        context="tarot"
      />
    </View>
  );
};

const ts = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  selectionContainer: { flex: 1, paddingTop: 4 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, marginTop: 10, marginBottom: 10 },
  topAction: { flexDirection: 'row', alignItems: 'center' },
  selectionCopy: { marginTop: 14, lineHeight: 24, opacity: 0.82 },
  globeShell: { borderRadius: 26, borderWidth: 1, borderColor: 'rgba(206,174,114,0.22)', backgroundColor: 'rgba(206,174,114,0.05)', marginVertical: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  selectionManifest: { borderRadius: 22, borderWidth: 1, borderColor: 'rgba(206,174,114,0.22)', backgroundColor: 'rgba(206,174,114,0.06)', padding: 18, marginBottom: 16, overflow: 'hidden' },
  selectionManifestGrid: { gap: 10, marginTop: 12 },
  selectionManifestTile: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(206,174,114,0.16)', backgroundColor: 'rgba(206,174,114,0.05)', padding: 14 },
  selectionManifestTitle: { fontSize: 15 }, // color set inline: isLight ? '#251D16' : '#F5F1EA'
  selectionManifestCopy: { marginTop: 6, lineHeight: 20, opacity: 0.82 },
  deckFan: { height: 210, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 20 },
  fanCard: { position: 'absolute' },
  relCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(244,114,182,0.34)', padding: 20, overflow: 'hidden', gap: 0, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  relCopy: { marginTop: 5, lineHeight: 20, opacity: 0.78 },
  spreadCard: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 26, borderWidth: 1, padding: 20, marginBottom: 14, gap: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  spreadIconWrap: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  spreadText: { flex: 1 },
  spreadName: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  spreadDesc: { lineHeight: 20, opacity: 0.78 },
  spreadMeta: { flexDirection: 'row', gap: 8, marginTop: 10 },
  spreadBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  prepContainer: { paddingHorizontal: layout.padding.screen },
  ceremonyHero: { alignItems: 'center', marginTop: 20, marginBottom: 14 },
  ceremonyHalo: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F1320', borderWidth: 1, borderColor: 'rgba(206,174,114,0.25)' },
  ceremonyTitle: { marginTop: 20, textAlign: 'center', lineHeight: 30 },
  ceremonyCopy: { marginTop: 12, lineHeight: 22, opacity: 0.75, textAlign: 'center' },
  prepDeckCard: { padding: 18, marginBottom: 8 },
  prepDeckRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  prepDeckCopy: { marginTop: 8, lineHeight: 20, opacity: 0.78 },
  inputCard: { padding: 16, marginTop: 16 },
  textInput: { marginTop: 10, minHeight: 72, fontSize: 16, lineHeight: 24, textAlignVertical: 'top', borderRadius: 14, borderWidth: 1, padding: 14 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moodCard: { width: '30%', minWidth: 96, borderRadius: 20, borderWidth: 1, paddingVertical: 16, paddingHorizontal: 10 },
  moodLabel: { marginTop: 10, textAlign: 'center', fontWeight: '600', fontSize: 13 },
  moodCopy: { marginTop: 6, textAlign: 'center', lineHeight: 17, opacity: 0.72 },
  deskContainer: { paddingHorizontal: layout.padding.screen },
  deckHero: { alignItems: 'center', marginTop: 16, marginBottom: 18, paddingHorizontal: 8 },
  deckSectionHeader: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(206,174,114,0.18)', backgroundColor: 'rgba(206,174,114,0.05)', padding: 16, marginBottom: 14 },
  deckSectionCopy: { marginTop: 8, lineHeight: 22, opacity: 0.82 },
  deckCopy: { marginTop: 12, lineHeight: 23, opacity: 0.78, textAlign: 'center' },
  deckPresence: { height: 152, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  presenceCard: { position: 'absolute' },
  questionStrip: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(206,174,114,0.24)', backgroundColor: 'rgba(206,174,114,0.08)', padding: 16, marginBottom: 18 },
  cardDesk: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  slotWrapper: { width: (layout.window.width - 64) / 2 },
  slotPress: { width: '100%' },
  slotCard: { minHeight: 252, padding: 18, justifyContent: 'center', borderRadius: 24 },
  emptySlot: { alignItems: 'center' },
  drawnContent: { alignItems: 'center' },
  deskFooter: { marginTop: 18, gap: 12 },
  footerHint: { opacity: 0.7, lineHeight: 19, textAlign: 'center', marginBottom: 4 },
  inlineGuide: { alignItems: 'center', paddingVertical: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,4,9,0.84)', justifyContent: 'center', paddingHorizontal: 22 },
  modalShell: { borderRadius: 28, borderWidth: 1, paddingHorizontal: 22, paddingVertical: 24 },
  modalStage: { alignItems: 'center' },
  modalCopy: { marginTop: 12, lineHeight: 22, opacity: 0.8, textAlign: 'center' },
  modalFan: { height: 162, width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  modalFanItem: { position: 'absolute' },
  acceptReveal: { minHeight: 52, borderRadius: 999, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 20 },
  synthesisBlock: { borderRadius: 24, borderWidth: 1, padding: 22, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  synthesisTitle: { marginTop: 10, lineHeight: 28 },
  synthesisCopy: { marginTop: 8, lineHeight: 20, opacity: 0.8, color: 'rgba(245,241,234,0.8)', marginBottom: 14 },
  synthesisStats: { flexDirection: 'row', alignItems: 'center', paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(206,174,114,0.2)' },
  synthesisStatItem: { flex: 1, alignItems: 'center', gap: 4 },
  synthesisStatDiv: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: 'rgba(206,174,114,0.25)' },
  historyShell: { borderRadius: 28, borderWidth: 1, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 16, maxHeight: '84%' },
  historyIntro: { marginTop: 8, lineHeight: 20, opacity: 0.75 },
  deleteBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  historyClose: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, minHeight: 46 },
  forSomeoneBanner: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: ACCENT + '18', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 14, borderWidth: 1, borderColor: ACCENT + '33' },
  forSomeoneSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  fsInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  fsCta: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center' },
  // ── HUB styles ────────────────────────────────────────────
  hubHero: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: layout.padding.screen, marginTop: 0, overflow: 'hidden' },
  hubHeroTitle: { fontSize: 26, fontWeight: '700', marginTop: 10, letterSpacing: 0.5 },
  hubHeroTagline: { marginTop: 8, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  hubToneDnia: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 6 },
  hubToneDivider: { flex: 1, height: 1 },
  hubToneText: { fontSize: 14, lineHeight: 22, marginBottom: 18, fontStyle: 'italic' },
  hubPrimaryRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  hubPrimaryTile: { flex: 1, flexDirection: 'column', alignItems: 'flex-start', borderRadius: 20, paddingVertical: 18, paddingHorizontal: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(206,174,114,0.20)', gap: 10 },
  hubPrimaryIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  hubSpreadRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  hubSpreadIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  hubSectionHeader: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(206,174,114,0.20)', marginBottom: 4 },
  hubEntryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  hubEntryIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
