// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, Dimensions, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Line } from 'react-native-svg';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, Star, RotateCcw, AlertTriangle, CheckCircle2, Zap, Shield, Calendar, ChevronRight } from 'lucide-react-native';
import { getResolvedTheme, isLightBg } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { getLocaleCode } from '../core/utils/localeFormat';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#E879F9';

const AnimCircle = Animated.createAnimatedComponent(Circle);

const RetrogradeBg = ({ isDark }: { isDark: boolean }) => {
  const tiltX = useSharedValue(0); const tiltY = useSharedValue(0);
  const pan = Gesture.Pan()
    .onUpdate(e => { tiltX.value = e.translationX / SW * 10; tiltY.value = e.translationY / 300 * 10; })
    .onEnd(() => { tiltX.value = withTiming(0, { duration: 800 }); tiltY.value = withTiming(0, { duration: 800 }); });
  const animStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 600 }, { rotateX: `${-tiltY.value}deg` }, { rotateY: `${tiltX.value}deg` }] }));
  const retroRot = useSharedValue(0);
  useEffect(() => { retroRot.value = withRepeat(withTiming(-360, { duration: 20000, easing: Easing.linear }), -1, false); }, []);
  const retroStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${retroRot.value}deg` }] }));

return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={isDark ? ['#0A0214', '#0F0420', '#14062A'] : ['#FDF4FF', '#FAF0FF', '#F8ECFF']} style={StyleSheet.absoluteFill} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
          <Svg width={SW} height={440} style={{ position: 'absolute', top: 20 }}>
            <Defs>
              <RadialGradient id="retroGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={ACCENT} stopOpacity={isDark ? "0.22" : "0.10"} />
                <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={SW / 2} cy={190} r={130} fill="url(#retroGlow)" />
          </Svg>
          <Animated.View style={[{ position: 'absolute', left: SW / 2 - 120, top: 70 }, retroStyle]}>
            <Svg width={240} height={240}>
              {[50, 80, 110].map((r, i) => (
                <Circle key={i} cx={120} cy={120} r={r} stroke={ACCENT} strokeWidth={0.6} fill="none"
                  strokeDasharray={`${r * 0.5} ${r * 0.3}`} opacity={isDark ? 0.20 - i * 0.04 : 0.08 - i * 0.015} />
              ))}
              {[0, 60, 120, 180, 240, 300].map((deg, i) => {
                const a = deg * Math.PI / 180;
                const r = 80;
                const x = 120 + r * Math.cos(a);
                const y = 120 + r * Math.sin(a);
                return <Circle key={'p' + i} cx={x} cy={y} r={3} fill={ACCENT} opacity={isDark ? 0.3 : 0.12} />;
              })}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ─── 2025 retrograde date windows ──────────────────────────────────────────
// planetId → array of { start, end } date strings (YYYY-MM-DD)
const RETROGRADE_WINDOWS: Record<string, { start: string; end: string }[]> = {
  mercury: [
    { start: '2025-01-16', end: '2025-02-07' },
    { start: '2025-05-15', end: '2025-06-07' },
    { start: '2025-09-09', end: '2025-10-02' },
    { start: '2025-12-24', end: '2026-01-14' },
  ],
  venus:   [{ start: '2025-03-01', end: '2025-04-12' }],
  mars:    [{ start: '2024-12-06', end: '2025-02-23' }],
  jupiter: [{ start: '2025-11-11', end: '2026-03-10' }],
  saturn:  [{ start: '2025-07-13', end: '2025-11-27' }],
};

const isCurrentlyRetrograde = (planetId: string): boolean => {
  const today = new Date();
  const windows = RETROGRADE_WINDOWS[planetId] ?? [];
  return windows.some(w => {
    const start = new Date(w.start);
    const end = new Date(w.end);
    return today >= start && today <= end;
  });
};

const getActiveWindow = (planetId: string): { start: string; end: string } | null => {
  const today = new Date();
  const windows = RETROGRADE_WINDOWS[planetId] ?? [];
  return windows.find(w => {
    const start = new Date(w.start);
    const end = new Date(w.end);
    return today >= start && today <= end;
  }) ?? null;
};

const getNextWindow = (planetId: string): { start: string; end: string } | null => {
  const today = new Date();
  const windows = RETROGRADE_WINDOWS[planetId] ?? [];
  const future = windows.filter(w => new Date(w.end) > today);
  const notActive = future.filter(w => new Date(w.start) > today);
  return notActive[0] ?? null;
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'long' });
};

const RETROGRADES = [
  {
    id: 'mercury',
    planet: 'Merkury ☿', symbol: '☿', color: '#93C5FD', frequency: '3-4x/rok', duration: '3 tygodnie',
    affects: ['Komunikacja', 'Technologia', 'Umowy', 'Podróże'],
    avoid: ['Podpisywania umów', 'Ważnych zakupów tech', 'Rozpoczynania nowych projektów'],
    embrace: ['Przemyślenia', 'Rewizji planów', 'Nawiązania starych kontaktów'],
    weeklyFocus: [
      { week: 'Tydzień 1', focus: 'Zidentyfikuj nierozwiązane sprawy i cofnij się do niedokończonych projektów' },
      { week: 'Tydzień 2', focus: 'Przeglądaj umowy, wiadomości i plany podróży. Sprawdzaj dwa razy każdy szczegół' },
      { week: 'Tydzień 3', focus: 'Czas na pojednanie i odświeżenie starych relacji biznesowych' },
    ],
    desc: 'Najsłynniejsza retrogradacja. Planety komunikacji, transportu i myślenia wstecznego.',
    tipExtra: 'Zapisuj wszystkie ważne ustalenia na piśmie i rób dodatkowe kopie danych.',
  },
  {
    id: 'venus',
    planet: 'Wenus ♀', symbol: '♀', color: '#FDA4AF', frequency: '1x/1.5 roku', duration: '6 tygodni',
    affects: ['Miłość', 'Finanse', 'Piękno', 'Wartości'],
    avoid: ['Nowych związków', 'Dużych zakupów', 'Operacji plastycznych'],
    embrace: ['Refleksji nad wartościami', 'Ponownej oceny relacji', 'Samopoznania'],
    weeklyFocus: [
      { week: 'Tydzień 1-2', focus: 'Cofnij się ku pytaniu: co naprawdę cenię w relacjach i finansach?' },
      { week: 'Tydzień 3-4', focus: 'Rozwiąż niedomówienia w bliskich relacjach. Stare miłości powracają' },
      { week: 'Tydzień 5-6', focus: 'Integracja — wyciągnij wnioski i zaktualizuj listę swoich wartości' },
    ],
    desc: 'Czas rewizji tego, co kochamy i cenimy. Stare miłości mogą wracać.',
    tipExtra: 'Unikaj impulsywnych decyzji finansowych — oceń zakupy po zakończeniu Rx.',
  },
  {
    id: 'mars',
    planet: 'Mars ♂', symbol: '♂', color: '#FCA5A5', frequency: '1x/2 lata', duration: '10 tygodni',
    affects: ['Energia', 'Działanie', 'Seksualność', 'Konflikty'],
    avoid: ['Agresywnych działań', 'Konfliktów', 'Ryzykownych projektów'],
    embrace: ['Refleksji nad motywacją', 'Planowania strategicznego', 'Odpoczynku'],
    weeklyFocus: [
      { week: 'Tydzień 1-2', focus: 'Przeglądaj projekty, które utknęły — znajdź ich rzeczywisty hamulec' },
      { week: 'Tydzień 3-6', focus: 'Planuj strategicznie, ale wstrzymaj się od agresywnych kroków naprzód' },
      { week: 'Tydzień 7-10', focus: 'Odpoczynek regeneruje siłę do działania po zakończeniu Rx' },
    ],
    desc: 'Energia działania się cofa. Czas na strategię, nie agresywne działanie.',
    tipExtra: 'Ćwicz, ale łagodnie — joga, spacery zamiast intensywnych treningów bojowych.',
  },
  {
    id: 'jupiter',
    planet: 'Jowisz ♃', symbol: '♃', color: '#FDE68A', frequency: '1x/rok', duration: '4 miesiące',
    affects: ['Wzrost', 'Obfitość', 'Filozofia', 'Podróże'],
    avoid: ['Przesadnego optymizmu', 'Rozpraszania energii'],
    embrace: ['Wewnętrznego wzrostu', 'Weryfikacji przekonań'],
    weeklyFocus: [
      { week: 'Miesiąc 1', focus: 'Sprawdź, które przekonania o obfitości Cię ograniczają, nie wspierają' },
      { week: 'Miesiąc 2', focus: 'Przeglądaj plany długoterminowe — czy nadal są zgodne z Twoją duszą?' },
      { week: 'Miesiąc 3-4', focus: 'Głęboka praca filozoficzna — co chcesz naprawdę rozwinąć?' },
    ],
    desc: 'Jowiszowe błogosławieństwo skierowane do wewnątrz. Wzrost przez introspekcję.',
    tipExtra: 'Czytaj, medytuj, podróżuj wewnętrznie — to Twój czas mistrzowskiej nauki.',
  },
  {
    id: 'saturn',
    planet: 'Saturn ♄', symbol: '♄', color: '#D1D5DB', frequency: '1x/rok', duration: '4.5 miesiąca',
    affects: ['Struktura', 'Kariera', 'Karma', 'Obowiązki'],
    avoid: ['Unikania odpowiedzialności', 'Odkładania na potem'],
    embrace: ['Pracy nad karmicznymi lekcjami', 'Budowania fundamenów'],
    weeklyFocus: [
      { week: 'Miesiąc 1', focus: 'Oceń struktury życia — co trzyma, a co wali się z własnej winy?' },
      { week: 'Miesiąc 2', focus: 'Karmiczne rewizje — rozlicz stare zaległości i pokonaj prokrastynację' },
      { week: 'Miesiąc 3-4', focus: 'Buduj nowe fundamenty — powoli, konsekwentnie, trwale' },
    ],
    desc: 'Karma wraca. Czas rozliczyć stare długi i naprawić struktury.',
    tipExtra: 'Nie skracaj drogi — Saturna nie można przekupić. Rób swoją pracę rzetelnie.',
  },
];

const SURVIVAL_TIPS = [
  { emoji: '💾', tip: 'Rób kopie zapasowe — szczególnie podczas Merkury Rx' },
  { emoji: '📋', tip: 'Czytaj umowy dwa razy przed podpisaniem' },
  { emoji: '⏰', tip: 'Daj więcej czasu na dojazdy i komunikację' },
  { emoji: '🔄', tip: '"Re-" to słowo klucz: przeglądaj, rewiduj, wracaj' },
  { emoji: '🧘', tip: 'Traktuj Rx jako czas wewnętrznej pracy, nie przerwy' },
  { emoji: '📞', tip: 'Odezwij się do starych przyjaciół — retrogradacje je przynoszą' },
  { emoji: '✍️', tip: 'Zapisuj sny i intuicje — podczas Rx mają głębsze znaczenie' },
  { emoji: '🌊', tip: 'Płyń z prądem zamiast walczyć — opór tylko wzmacnia trudności' },
];

export const RetrogradesScreen = ({ navigation }: any) => {
    const themeName = useAppStore(s => s.themeName);
  const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const currentTheme = getResolvedTheme(themeName, userData?.preferences?.colorScheme);
  const isLight = isLightBg(currentTheme.background);
  const isDark = !isLight;
  const textColor = isLight ? '#1A0030' : '#FDF4FF';
  const subColor = isLight ? 'rgba(26,0,48,0.5)' : 'rgba(253,244,255,0.5)';
  const { t } = useTranslation();
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';

  const [expanded, setExpanded] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [retroAiInsight, setRetroAiInsight] = useState<string>('');
  const [retroAiLoading, setRetroAiLoading] = useState(false);
  const tipFlatRef = useRef<FlatList>(null);

  // Auto-advance tip carousel
  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex(prev => {
        const next = (prev + 1) % SURVIVAL_TIPS.length;
        tipFlatRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);
return () => clearInterval(id);
  }, []);

  const activeRetrogrades = RETROGRADES.filter(r => isCurrentlyRetrograde(r.id));
  const inactiveRetrogrades = RETROGRADES.filter(r => !isCurrentlyRetrograde(r.id));

    const fetchRetroAi = async () => {
    setRetroAiLoading(true);
    HapticsService.impact('light');
    try {
      const activeNames = activeRetrogrades.map(r => r.planet).join(", ") || "brak aktywnych";
      const prompt = "Aktywne retrogradacje teraz: " + activeNames + ". Liczba aktywnych: " + activeRetrogrades.length + ". Napisz krotka (3-4 zdania) interpretacje aktualnej energii retrogradacyjnej i jedno praktyczne zalecenie na ten czas dla uzytkownika.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setRetroAiInsight(result);
    } catch (e) {
      setRetroAiInsight("Blad pobierania interpretacji.");
    } finally {
      setRetroAiLoading(false);
    }
  };
return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <RetrogradeBg isDark={isDark} />
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2 }}>{t('retrogrades.eyebrow', 'ASTROLOGIA').toUpperCase()}</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>{t('retrogrades.title', 'Retrogradacje')}</Text>
        </View>
        <Pressable
          style={styles.starBtn}
          hitSlop={12}
          onPress={() => { HapticsService.impact('light'); if (isFavoriteItem('retrogrades')) { removeFavoriteItem('retrogrades'); } else { addFavoriteItem({ id: 'retrogrades', label: 'Retrogradacje', route: 'Retrogrades', params: {}, icon: 'Star', color: ACCENT, addedAt: new Date().toISOString() }); } }}
        >
          <Star size={18} color={isFavoriteItem('retrogrades') ? ACCENT : subColor} strokeWidth={1.8} fill={isFavoriteItem('retrogrades') ? ACCENT : 'none'} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen }}>
        <Animated.View entering={FadeInDown.delay(60).duration(500)}>
          <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
            Retrogradacja (Rx) to optyczna iluzja wstecznego ruchu planety. W astrologii oznacza czas refleksji, rewizji i pracy wewnętrznej.
          </Text>
        </Animated.View>

        {/* ── AKTYWNE TERAZ section ──────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginBottom: 10 }}>AKTYWNE TERAZ</Text>
          {activeRetrogrades.length === 0 ? (
            <View style={[styles.noActiveCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <CheckCircle2 size={20} color="#6EE7B7" style={{ marginBottom: 6 }} />
              <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>Brak aktywnych retrogradacji</Text>
              <Text style={{ color: subColor, fontSize: 12, textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                Wszystkie planety poruszają się naprzód. Korzystaj z tej energii do rozpoczynania nowych projektów!
              </Text>
            </View>
          ) : (
            activeRetrogrades.map((ret, i) => {
              const win = getActiveWindow(ret.id);
return (
                <Animated.View key={ret.id + '_active'} entering={FadeInDown.delay(120 + i * 40).duration(400)}>
                  <View style={[styles.activeCard, { backgroundColor: ret.color + '14', borderColor: ret.color + '40' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={[styles.activeIcon, { backgroundColor: ret.color + '25' }]}>
                        <Text style={{ color: ret.color, fontSize: 20, fontWeight: '800' }}>{ret.symbol}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ color: textColor, fontSize: 15, fontWeight: '700' }}>{ret.planet}</Text>
                          <View style={[styles.rxBadge, { backgroundColor: ret.color + '22', borderColor: ret.color + '55' }]}>
                            <Zap size={9} color={ret.color} />
                            <Text style={{ color: ret.color, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>Rx AKTYWNA</Text>
                          </View>
                        </View>
                        {win && (
                          <Text style={{ color: subColor, fontSize: 11, marginTop: 2 }}>
                            <Calendar size={10} color={subColor} /> {formatDate(win.start)} — {formatDate(win.end)}
                          </Text>
                        )}
                      </View>
                      <RotateCcw size={14} color={ret.color} />
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
                      {ret.affects.map(a => (
                        <View key={a} style={[styles.tag, { backgroundColor: ret.color + '18', borderColor: ret.color + '30' }]}>
                          <Text style={{ color: ret.color, fontSize: 10 }}>{a}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={{ color: subColor, fontSize: 12, lineHeight: 18, marginTop: 8 }}>{ret.desc}</Text>
                  </View>
                </Animated.View>
              );
            })
          )}
        </Animated.View>

        {/* ── All planets expandable list ────────────────────────── */}
        <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginTop: 20, marginBottom: 10 }}>WSZYSTKIE PLANETY</Text>

        {RETROGRADES.map((ret, i) => {
          const isActive = isCurrentlyRetrograde(ret.id);
          const win = getActiveWindow(ret.id);
          const nextWin = getNextWindow(ret.id);
          const isOpen = expanded === ret.planet;

return (
            <Animated.View key={ret.planet} entering={FadeInDown.delay(80 + i * 50).duration(400)}>
              <Pressable onPress={() => { HapticsService.impact('light'); setExpanded(isOpen ? null : ret.planet); }}
                style={[styles.retCard, { backgroundColor: isOpen ? ret.color + '12' : cardBg, borderColor: isOpen ? ret.color + '40' : cardBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: isOpen ? 10 : 0 }}>
                  <View style={[styles.retIcon, { backgroundColor: ret.color + '22' }]}>
                    <Text style={{ color: ret.color, fontSize: 18, fontWeight: '700' }}>{ret.symbol}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: textColor, fontSize: 15, fontWeight: '700' }}>{ret.planet}</Text>
                      {isActive && (
                        <View style={[styles.rxSmallBadge, { backgroundColor: ret.color + '22', borderColor: ret.color + '55' }]}>
                          <Text style={{ color: ret.color, fontSize: 8, fontWeight: '800' }}>Rx</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: subColor, fontSize: 11 }}>
                      {ret.frequency} · {ret.duration}
                      {isActive && win ? ` · do ${formatDate(win.end)}` : nextWin ? ` · następna: ${formatDate(nextWin.start)}` : ''}
                    </Text>
                  </View>
                  <RotateCcw size={14} color={isOpen ? ret.color : subColor} />
                </View>

                {isOpen && (
                  <>
                    <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 10 }}>{ret.desc}</Text>

                    {/* UNIKAJ / WYKORZYSTAJ */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                      <View style={[styles.listBox, { borderColor: '#EF444433', backgroundColor: '#EF444412' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                          <AlertTriangle size={12} color="#EF4444" />
                          <Text style={{ color: '#EF4444', fontSize: 10, letterSpacing: 1 }}>UNIKAJ</Text>
                        </View>
                        {ret.avoid.map(a => <Text key={a} style={{ color: textColor, fontSize: 11, lineHeight: 18 }}>• {a}</Text>)}
                      </View>
                      <View style={[styles.listBox, { borderColor: ret.color + '33', backgroundColor: ret.color + '10' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                          <CheckCircle2 size={12} color={ret.color} />
                          <Text style={{ color: ret.color, fontSize: 10, letterSpacing: 1 }}>WYKORZYSTAJ</Text>
                        </View>
                        {ret.embrace.map(e => <Text key={e} style={{ color: textColor, fontSize: 11, lineHeight: 18 }}>• {e}</Text>)}
                      </View>
                    </View>

                    {/* Weekly / monthly focus */}
                    <Text style={{ color: subColor, fontSize: 10, letterSpacing: 1.2, marginBottom: 8 }}>PLAN TYGODNIOWY</Text>
                    {ret.weeklyFocus.map((wf, wi) => (
                      <View key={wi} style={[styles.weekRow, { borderLeftColor: ret.color + '80', backgroundColor: ret.color + '08' }]}>
                        <Text style={{ color: ret.color, fontSize: 10, fontWeight: '700', marginBottom: 2 }}>{wf.week}</Text>
                        <Text style={{ color: textColor, fontSize: 12, lineHeight: 18 }}>{wf.focus}</Text>
                      </View>
                    ))}

                    {/* Dates block */}
                    {(win || nextWin) && (
                      <View style={[styles.datesBlock, { backgroundColor: ret.color + '0C', borderColor: ret.color + '25' }]}>
                        <Calendar size={13} color={ret.color} />
                        <View style={{ flex: 1 }}>
                          {win
                            ? <Text style={{ color: textColor, fontSize: 12 }}>Aktywna: <Text style={{ color: ret.color, fontWeight: '700' }}>{formatDate(win.start)} — {formatDate(win.end)}</Text></Text>
                            : <Text style={{ color: textColor, fontSize: 12 }}>Następna: <Text style={{ color: ret.color, fontWeight: '700' }}>{formatDate(nextWin!.start)} — {formatDate(nextWin!.end)}</Text></Text>
                          }
                          <Text style={{ color: subColor, fontSize: 11, marginTop: 2 }}>Czas trwania: {ret.duration}</Text>
                        </View>
                      </View>
                    )}

                    {/* Extra tip */}
                    <View style={[styles.extraTip, { backgroundColor: ret.color + '0A', borderColor: ret.color + '20' }]}>
                      <Shield size={12} color={ret.color} />
                      <Text style={{ color: textColor, fontSize: 12, lineHeight: 18, flex: 1 }}>{ret.tipExtra}</Text>
                    </View>

                    {/* Tags */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                      {ret.affects.map(a => (
                        <View key={a} style={[styles.tag, { backgroundColor: ret.color + '18', borderColor: ret.color + '30' }]}>
                          <Text style={{ color: ret.color, fontSize: 10 }}>{a}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </Pressable>
            </Animated.View>
          );
        })}

        {/* ── Survival tip carousel ──────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginTop: 20, marginBottom: 10 }}>
            {t('retrogrades.survivalGuide', 'PRZEWODNIK PRZETRWANIA')}
          </Text>
          <View style={[styles.carouselWrap, { borderColor: ACCENT + '25', backgroundColor: ACCENT + '06' }]}>
            <FlatList
              ref={tipFlatRef}
              data={SURVIVAL_TIPS}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, idx) => String(idx)}
              onScrollToIndexFailed={() => {}}
              renderItem={({ item, index }) => (
                <View style={[styles.tipSlide, { width: SW - layout.padding.screen * 2 - 32 }]}>
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>{item.emoji}</Text>
                  <Text style={{ color: textColor, fontSize: 14, lineHeight: 22, textAlign: 'center' }}>{item.tip}</Text>
                </View>
              )}
            />
            {/* Dot indicators */}
            <View style={styles.dotRow}>
              {SURVIVAL_TIPS.map((_, i) => (
                <View key={i} style={[styles.dot, {
                  backgroundColor: i === tipIndex ? ACCENT : ACCENT + '33',
                  width: i === tipIndex ? 16 : 6,
                }]} />
              ))}
            </View>
          </View>
        </Animated.View>

                <View style={{ marginTop: 16, marginBottom: 8, borderRadius: 16, backgroundColor: "#E879F922", borderWidth: 1, borderColor: "#E879F9", padding: 16 }}>
          <Text style={{ color: "#E879F9", fontWeight: "700", fontSize: 13, letterSpacing: 1, marginBottom: 8 }}>AI INTERPRETACJA RETROGRADACJI</Text>
          {retroAiInsight ? (
            <Text style={{ color: "#FDF4FF", fontSize: 14, lineHeight: 22 }}>{retroAiInsight}</Text>
          ) : null}
          <Pressable onPress={fetchRetroAi} disabled={retroAiLoading} style={{ marginTop: 12, backgroundColor: "#E879F9", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
            <Text style={{ color: "#1A0030", fontWeight: "700", fontSize: 14 }}>{retroAiLoading ? "Analizuję..." : "Analizuj"}</Text>
          </Pressable>
        </View>
<EndOfContentSpacer />
      </ScrollView>
        </SafeAreaView>
</View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingBottom: 12, gap: 12, paddingTop: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  starBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232,121,249,0.3)', backgroundColor: 'rgba(232,121,249,0.08)' },
  noActiveCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center', marginBottom: 8 },
  activeCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 8 },
  activeIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rxBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  rxSmallBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5, borderWidth: 1 },
  retCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 8 },
  retIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listBox: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  weekRow: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 6, marginBottom: 6, borderRadius: 4 },
  datesBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 8, marginBottom: 6 },
  extraTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 4 },
  carouselWrap: { borderRadius: 18, borderWidth: 1, paddingVertical: 20, paddingHorizontal: 16, marginBottom: 8 },
  tipSlide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 14 },
  dot: { height: 6, borderRadius: 3 },
});
