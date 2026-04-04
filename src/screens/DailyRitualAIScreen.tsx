// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions, ActivityIndicator, TextInput, Share, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { ArrowRight, BookOpen, CheckCircle2, ChevronLeft, Clock, Droplets, Flame, Moon, Sparkles, Star, Sun, Wind, Zap, Share2, Headphones, Leaf } from 'lucide-react-native';
import { HapticsService } from '../core/services/haptics.service';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { SoulEngineService } from '../core/services/soulEngine.service';
import { AiService } from '../core/services/ai.service';
import { screenContracts } from '../core/theme/designSystem';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import { getLocaleCode } from '../core/utils/localeFormat';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#F97316';

// ─── FlameOrb ─────────────────────────────────────────────────────────────────
const FlameOrb = () => {
  const pulse = useSharedValue(1);
  const rot = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.08, { duration: 1500 }), withTiming(0.94, { duration: 1500 })), -1, true);
    rot.value = withRepeat(withTiming(360, { duration: 12000 }), -1, false);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const rotStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot.value}deg` }] }));
  const size = 116;
  const center = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[StyleSheet.absoluteFill, pulseStyle]}>
        <Svg width={size} height={size}>
          <Circle cx={center} cy={center} r={52} fill={ACCENT + '14'} stroke={ACCENT + '44'} strokeWidth={1.5} />
          <Circle cx={center} cy={center} r={34} fill={ACCENT + '24'} />
          <Circle cx={center} cy={center} r={18} fill={ACCENT} opacity={0.92} />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, rotStyle]}>
        <Svg width={size} height={size}>
          {[0, 1, 2, 3, 4, 5].map(index => {
            const angle = (index / 6) * 2 * Math.PI;
            return <Circle key={index} cx={center + 50 * Math.cos(angle)} cy={center + 50 * Math.sin(angle)} r={4} fill={ACCENT} opacity={0.45} />;
          })}
        </Svg>
      </Animated.View>
    </View>
  );
};

// ─── Day window helper ────────────────────────────────────────────────────────
const getDayWindow = () => {
  const hour = new Date().getHours();
  if (hour < 11) return { label: 'Poranek', icon: Sun, intro: 'To dobra pora na ustawienie tonu dnia, zanim energia rozproszy się na zewnątrz.' };
  if (hour < 18) return { label: 'Środek dnia', icon: Sparkles, intro: 'Teraz rytuał ma porządkować i wzmacniać to, co już jest w ruchu.' };
  return { label: 'Wieczór', icon: Moon, intro: 'Wieczorny rytuał nie służy napędzaniu. Ma domknąć dzień i oddać układowi więcej ciszy.' };
};

// ─── Planetary hour helper ────────────────────────────────────────────────────
const getPlanetaryData = () => {
  const dow = new Date().getDay(); // 0=Sun…6=Sat
  const hour = new Date().getHours();
  // Day rulers (classical order)
  const DAY_RULERS = ['Słońce', 'Księżyc', 'Mars', 'Merkury', 'Jowisz', 'Wenus', 'Saturn'];
  const DAY_RULER_EMOJIS = ['☀️', '🌙', '♂️', '☿', '♃', '♀', '♄'];
  const DAY_QUALITIES = [
    'ekspresja, witalność, manifest',
    'intuicja, emocje, cykl',
    'odwaga, inicjatywa, moc',
    'komunikacja, myśl, zmiana',
    'ekspansja, obfitość, mądrość',
    'miłość, harmonia, piękno',
    'dyscyplina, granice, struktura',
  ];
  // Planetary hours sequence starting from day ruler
  const CHALDEAN = ['Saturn', 'Jowisz', 'Mars', 'Słońce', 'Wenus', 'Merkury', 'Księżyc'];
  const CHALDEAN_EMOJIS = ['♄', '♃', '♂️', '☀️', '♀', '☿', '🌙'];
  const dayRulerIdx = [0, 2, 4, 6, 1, 5, 3][dow]; // Sun=0,Mon=2,Tue=4,Wed=6,Thu=1,Fri=5,Sat=3 → Chaldean index
  const hourRulerIdx = (dayRulerIdx + hour) % 7;
  return {
    dayRuler: DAY_RULERS[dow],
    dayRulerEmoji: DAY_RULER_EMOJIS[dow],
    dayQuality: DAY_QUALITIES[dow],
    planetaryHour: CHALDEAN[hourRulerIdx],
    planetaryHourEmoji: CHALDEAN_EMOJIS[hourRulerIdx],
  };
};

// ─── Moon phase (same algorithm as LunarCalendarScreen) ──────────────────────
const getMoonPhaseLabel = (): { name: string; emoji: string; desc: string } => {
  const now = new Date();
  const jd = 367 * now.getFullYear()
    - Math.floor(7 * (now.getFullYear() + Math.floor((now.getMonth() + 10) / 12)) / 4)
    + Math.floor(275 * (now.getMonth() + 1) / 9)
    + now.getDate() + 1721013.5;
  const cycle = ((jd - 2451550.1) / 29.530588853) % 1;
  const p = cycle < 0 ? cycle + 1 : cycle;
  if (p < 0.0625 || p >= 0.9375) return { name: 'Nów', emoji: '🌑', desc: 'Siej intencje i nowe początki' };
  if (p < 0.1875) return { name: 'Sierp rosnący', emoji: '🌒', desc: 'Buduj, inicjuj i rozwijaj' };
  if (p < 0.3125) return { name: 'Pierwsza kwadra', emoji: '🌓', desc: 'Działaj zdecydowanie' };
  if (p < 0.4375) return { name: 'Garb rosnący', emoji: '🌔', desc: 'Dopracuj i zintegruj' };
  if (p < 0.5625) return { name: 'Pełnia', emoji: '🌕', desc: 'Kulminacja — uwalniaj i świętuj' };
  if (p < 0.6875) return { name: 'Garb malejący', emoji: '🌖', desc: 'Analizuj i ucz się' };
  if (p < 0.8125) return { name: 'Ostatnia kwadra', emoji: '🌗', desc: 'Oczyszczaj i kończ' };
  return { name: 'Sierp malejący', emoji: '🌘', desc: 'Odpoczywaj i zamykaj cykle' };
};

// ─── Season helper ────────────────────────────────────────────────────────────
const getCurrentSeason = (): 'wiosna' | 'lato' | 'jesień' | 'zima' => {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'wiosna';
  if (m >= 6 && m <= 8) return 'lato';
  if (m >= 9 && m <= 11) return 'jesień';
  return 'zima';
};

// ─── Seasonal rituals ─────────────────────────────────────────────────────────
const SEASONAL_RITUALS: Record<string, { title: string; emoji: string; desc: string; duration: string }[]> = {
  wiosna: [
    { title: 'Rytuał nasion intencji', emoji: '🌱', desc: 'Zapisz 3 zamierzenia na kartce, zakop ją symbolicznie lub spal.', duration: '8 min' },
    { title: 'Kąpiel kwiatowa', emoji: '🌸', desc: 'Dodaj płatki kwiatów do kąpieli, wizualizując nowy początek.', duration: '20 min' },
    { title: 'Spacer budzenia', emoji: '🌿', desc: 'Idź boso po trawie, świadomie dotykając ziemi stopami.', duration: '10 min' },
    { title: 'Oczyszczenie wiosenne', emoji: '🪴', desc: 'Otwórz okna, oskrzydl przestrzeń szałwią lub dymem kadzidła.', duration: '15 min' },
  ],
  lato: [
    { title: 'Rytuał słońca południa', emoji: '☀️', desc: 'Stań w pełnym słońcu przez 5 minut, oddychając głęboko.', duration: '8 min' },
    { title: 'Ognisko intencji', emoji: '🔥', desc: 'Wrzuć do ognia (świecy) kartkę z tym, czego chcesz więcej.', duration: '12 min' },
    { title: 'Kąpiel w wodzie żywej', emoji: '🌊', desc: 'Zanurzenie w wodzie bieżącej z intencją oczyszczenia.', duration: '20 min' },
    { title: 'Medytacja o wschodzie słońca', emoji: '🌅', desc: 'Obserwuj wschód słońca w ciszy, bez telefonu.', duration: '15 min' },
  ],
  jesień: [
    { title: 'Rytuał puszczania', emoji: '🍂', desc: 'Napisz, czego się pozbywasz — spuść kartkę z prądem wody.', duration: '10 min' },
    { title: 'Rytuał zbiorów', emoji: '🍎', desc: 'Wymień 7 osiągnięć z ostatnich 3 miesięcy. Poczuj wdzięczność.', duration: '12 min' },
    { title: 'Ognisko domknięcia', emoji: '🕯️', desc: 'Zapal jedną świecę na każdą rzecz, którą chcesz zamknąć.', duration: '20 min' },
    { title: 'Kąpiel ziołowa', emoji: '🌾', desc: 'Szałwia, rozmaryn i sól w kąpieli — oczyszcza i chroni.', duration: '25 min' },
  ],
  zima: [
    { title: 'Rytuał ciszy wewnętrznej', emoji: '❄️', desc: 'Siedź w kompletnej ciszy przez 10 min. Nic nie rób.', duration: '10 min' },
    { title: 'Kontemplacja przy świecy', emoji: '🕯️', desc: 'Patrz w płomień, pozwalając myślom odpłynąć jak dym.', duration: '15 min' },
    { title: 'Rytuał snu uzdrowiciela', emoji: '🌙', desc: 'Przed snem namień ciało olejkiem lawendy, oddychając 4-7-8.', duration: '12 min' },
    { title: 'Dzień odciętego rytuału', emoji: '🌨️', desc: 'Jeden dzień bez ekranów — tylko ciszę, herbatę i refleksję.', duration: '1 dzień' },
  ],
};

// ─── Ingredients per energy tone ─────────────────────────────────────────────
const INGREDIENTS: Record<string, { emoji: string; name: string; purpose: string }[]> = {
  cicha: [
    { emoji: '🕯️', name: 'Biała świeca', purpose: 'Spokój i czystość' },
    { emoji: '💧', name: 'Woda źródlana', purpose: 'Oczyszczenie przestrzeni' },
    { emoji: '🌿', name: 'Lawenda', purpose: 'Wyciszenie umysłu' },
    { emoji: '🪨', name: 'Księżycowy kamień', purpose: 'Intuicja i refleksja' },
    { emoji: '📿', name: 'Czysty dziennik', purpose: 'Zapis wewnętrznych słów' },
  ],
  skupiona: [
    { emoji: '🕯️', name: 'Żółta świeca', purpose: 'Jasność i koncentracja' },
    { emoji: '🔶', name: 'Cytryn', purpose: 'Wzmocnienie woli' },
    { emoji: '🌿', name: 'Rozmaryn', purpose: 'Pamięć i precyzja' },
    { emoji: '📝', name: 'Notatnik intencji', purpose: 'Zapis celów' },
    { emoji: '🔲', name: 'Obsydian', purpose: 'Uziemienie i granice' },
  ],
  intensywna: [
    { emoji: '🕯️', name: 'Czerwona świeca', purpose: 'Moc i transformacja' },
    { emoji: '🌶️', name: 'Czarny pieprz', purpose: 'Ochrona i wzmocnienie' },
    { emoji: '🍃', name: 'Szałwia', purpose: 'Oczyszczenie przestrzeni' },
    { emoji: '💎', name: 'Granat lub hematyt', purpose: 'Korzenienie siły' },
    { emoji: '🥁', name: 'Bęben lub kieliszek dźwiękowy', purpose: 'Aktywacja energii' },
  ],
  świętująca: [
    { emoji: '🕯️', name: 'Złota lub różowa świeca', purpose: 'Radość i wdzięczność' },
    { emoji: '🌸', name: 'Kwiaty lub płatki', purpose: 'Piękno i ekspansja' },
    { emoji: '🍯', name: 'Miód', purpose: 'Słodycz i obfitość' },
    { emoji: '💛', name: 'Cytryn lub bursztyn', purpose: 'Manifestacja i celebracja' },
    { emoji: '🎶', name: 'Ulubiona muzyka', purpose: 'Podniesienie wibracją' },
  ],
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export const DailyRitualAIScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeName, userData, dailyProgress, updateDailyProgress } = useAppStore();
  const theme = getResolvedTheme(themeName);
  const isLight = theme.background.startsWith('#F');
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#9A8E80';
  const cardBg = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(20,15,10,0.88)';
  const borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)';

  const dailyPlan = useMemo(() => SoulEngineService.generateDailyPlan(), []);
  const today = new Date().toISOString().split('T')[0];
  const alreadyDone = dailyProgress[today]?.ritualCompleted;
  const timeWindow = getDayWindow();
  const TimeIcon = timeWindow.icon;
  const planetaryData = useMemo(() => getPlanetaryData(), []);
  const moonInfo = useMemo(() => getMoonPhaseLabel(), []);
  const season = useMemo(() => getCurrentSeason(), []);

  // ── Core state ──────────────────────────────────────────────────────────────
  const [ritualText, setRitualText] = useState('');
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [finished, setFinished] = useState(alreadyDone || false);
  const [energyTone, setEnergyTone] = useState<'cicha' | 'skupiona' | 'intensywna' | 'świętująca'>('skupiona');
  const [ritualNote, setRitualNote] = useState('');
  const [showTimer, setShowTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(12 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<any>(null);

  // ── Energia przed/po ────────────────────────────────────────────────────────
  const [energyBefore, setEnergyBefore] = useState<number>(0); // 0 = not set
  const [energyAfter, setEnergyAfter] = useState<number>(0);

  // ── Intencja w 9 słowach ────────────────────────────────────────────────────
  const [intention9, setIntention9] = useState('');
  const [intention9Saved, setIntention9Saved] = useState(false);
  const wordCount9 = intention9.trim().split(/\s+/).filter(Boolean).length;

  // ── Lista składników checkboxes ─────────────────────────────────────────────
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const ingredients = INGREDIENTS[energyTone] || INGREDIENTS.skupiona;

  // ── Przewodnik audio / tryb prowadzenia ─────────────────────────────────────
  const [guideMode, setGuideMode] = useState(false);

  // ── Rytuały sezonowe ─────────────────────────────────────────────────────────
  const seasonalRituals = SEASONAL_RITUALS[season];
  const seasonEmoji = { wiosna: '🌱', lato: '☀️', jesień: '🍂', zima: '❄️' }[season];
  const seasonLabel = { wiosna: 'WIOSNA', lato: 'LATO', jesień: 'JESIEŃ', zima: 'ZIMA' }[season];

  // ── Ritual meta ─────────────────────────────────────────────────────────────
  const ritualMeta = useMemo(() => {
    const featured = dailyPlan.ritualGuidance?.featured;
    return {
      title: featured?.title || 'Rytuał intencji i domknięcia',
      category: featured?.category || timeWindow.label,
      duration: featured?.duration || '12 min',
      whyToday: dailyPlan.ritualGuidance?.whyToday || 'Dzisiejszy rytuał ma nie tylko prowadzić, ale też porządkować to, co naprawdę domaga się uwagi.',
      suggestedAction: dailyPlan.ritualGuidance?.completionPrompt || 'Po praktyce zapisz jedno zdanie o tym, co się uspokoiło lub wyostrzyło.',
    };
  }, [dailyPlan, timeWindow.label]);

  const ritualSteps = useMemo(() => [
    {
      step: 1,
      title: 'Przygotowanie przestrzeni',
      duration: '2 min',
      desc: 'Wycisz telefon, otwórz trochę przestrzeni wokół siebie i zdecyduj, czego dziś nie wpuszczasz do rytuału.',
    },
    {
      step: 2,
      title: 'Nazwanie intencji',
      duration: '2 min',
      desc: `Powiedz wprost, o co prosisz ten moment. Nie ogólnie. Jednym zdaniem, które naprawdę da się poczuć w ciele.`,
    },
    {
      step: 3,
      title: 'Główna praktyka',
      duration: '6 min',
      desc: ritualMeta.whyToday,
    },
    {
      step: 4,
      title: 'Domknięcie i integracja',
      duration: '2 min',
      desc: ritualMeta.suggestedAction,
    },
  ], [ritualMeta.whyToday, ritualMeta.suggestedAction]);

  const ENERGY_TONES = [
    { id: 'cicha' as const, emoji: '🌑', label: 'Cicha', desc: 'Spokój, introspekcja' },
    { id: 'skupiona' as const, emoji: '🌒', label: 'Skupiona', desc: 'Precyzja, klarowność' },
    { id: 'intensywna' as const, emoji: '🌕', label: 'Intensywna', desc: 'Moc, transformacja' },
    { id: 'świętująca' as const, emoji: '🌟', label: 'Świętująca', desc: 'Radość, ekspansja' },
  ];

  // ── Ceremonial properties ────────────────────────────────────────────────────
  const dayOfWeek = ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'][new Date().getDay()];
  const ceremonialProperties = [
    { label: 'Dzień', value: dayOfWeek, sub: planetaryData.dayRuler + ' — ' + planetaryData.dayQuality, color: ACCENT },
    { label: 'Faza', value: dailyPlan.moonPhase?.icon || '🌙', sub: dailyPlan.moonPhase?.name || 'Księżyc', color: '#818CF8' },
    { label: 'Energia', value: `${dailyPlan.energyScore || 70}%`, sub: 'poziom dnia', color: '#34D399' },
    { label: 'Archetyp', value: dailyPlan.archetype?.emoji || '✦', sub: dailyPlan.archetype?.name || 'Mędrzec', color: '#F59E0B' },
  ];

  // ── Generate ritual ──────────────────────────────────────────────────────────
  const generateRitual = async () => {
    setLoading(true);
    const moonPhase = dailyPlan.moonPhase?.name || 'pełnia';
    const archetype = dailyPlan.archetype?.name || 'Mędrzec';
    const energy = dailyPlan.energyScore || 70;
    const prompt = [
      `Wygeneruj luksusowy, konkretny rytuał dnia w języku użytkownika dla użytkownika ${userData.name || 'wędrowca'}.`,
      `Pora dnia: ${timeWindow.label}.`,
      `Faza księżyca: ${moonPhase}.`,
      `Archetyp dnia: ${archetype}.`,
      `Poziom energii: ${energy}%.`,
      `Ton energetyczny wybrany przez użytkownika: ${energyTone}.`,
      'Format: tytuł rytuału, potem 4 krótkie akapity: sens, przygotowanie, główna praktyka, domknięcie.',
      'Maksymalnie 180 słów. Bez markdown.',
    ].join(' ');
    try {
      const text = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setRitualText(text);
    } catch {
      setRitualText(`Rytuał ${archetype} na ${moonPhase}. Najpierw zwolnij oddech i nazwij jedną intencję na dziś. Potem wykonaj jeden prosty gest: zapal świecę, połóż dłoń na sercu albo otwórz okno, żeby świadomie zmienić energię przestrzeni. W głównej części skup się na jednym pytaniu: czego naprawdę dziś potrzebuję więcej, a czego mniej? Na końcu zamknij rytuał wdzięcznością i zapisem jednego zdania, które zostaje z Tobą po tej praktyce.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void generateRitual(); }, []);

  const toggleStep = (step: number) => {
    setCompletedSteps(prev => prev.includes(step) ? prev.filter(item => item !== step) : [...prev, step]);
  };

  const finishRitual = () => {
    updateDailyProgress(today, {
      ritualCompleted: true,
      ...(energyBefore > 0 ? { energyBefore } : {}),
      ...(energyAfter > 0 ? { energyAfter } : {}),
    });
    setFinished(true);
    HapticsService.impact('heavy');
    if (timerRunning) { clearInterval(timerRef.current); setTimerRunning(false); }
  };

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); setTimerRunning(false); HapticsService.impact('medium'); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Share ritual ─────────────────────────────────────────────────────────────
  const handleShare = async () => {
    HapticsService.impact('light');
    const dow = new Date().toLocaleDateString(getLocaleCode(), { weekday: 'long', day: 'numeric', month: 'long' });
    const intentionLine = intention9Saved && intention9.trim() ? `\n✨ Moja intencja: "${intention9.trim()}"` : '';
    const energyLine = energyBefore > 0 ? `\n⚡ Energia przed: ${energyBefore}/5` : '';
    const energyAfterLine = energyAfter > 0 ? `  →  po: ${energyAfter}/5` : '';
    const msg = [
      `🕯️ RYTUAŁ DNIA — ${dow.toUpperCase()}`,
      ``,
      `${ritualMeta.title}`,
      `Ton: ${ENERGY_TONES.find(t => t.id === energyTone)?.label || energyTone}`,
      `Pora: ${timeWindow.label}  •  Faza księżyca: ${moonInfo.emoji} ${moonInfo.name}`,
      intentionLine,
      energyLine + energyAfterLine,
      ``,
      ritualText ? ritualText.slice(0, 280) + '…' : '',
      ``,
      `— Aethera, duchowy przewodnik`,
    ].filter(l => l !== null).join('\n');
    await Share.share({ message: msg });
  };

  // ── Save intention ───────────────────────────────────────────────────────────
  const saveIntention = () => {
    if (wordCount9 !== 9) return;
    HapticsService.impact('medium');
    setIntention9Saved(true);
  };

  // ── Toggle ingredient checkbox ───────────────────────────────────────────────
  const toggleIngredient = (name: string) => {
    HapticsService.impact('light');
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#FDF6EE' : '#0A0603' }]}>
      <LinearGradient colors={isLight ? ['#FDF6EE', '#F5E8D0'] : ['#0A0603', '#160A05', '#200F08']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Today')} style={styles.backBtn} hitSlop={14}>
            <ChevronLeft color={ACCENT} size={28} strokeWidth={1.5} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.eyebrow, { color: ACCENT }]}>🕯️ RYTUAŁ DNIA</Text>
            <Text style={[styles.title, { color: textColor }]}>Prowadzenie ceremonialne</Text>
          </View>
          <Pressable onPress={handleShare} hitSlop={12} style={styles.shareHeaderBtn}>
            <Share2 color={ACCENT} size={20} strokeWidth={1.6} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
          keyboardVerticalOffset={insets.top + 56}
        >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <Animated.View entering={FadeInDown.duration(520)} style={styles.heroCard}>
            <FlameOrb />
            <View style={[styles.timePill, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '30' }]}>
              <TimeIcon color={ACCENT} size={15} strokeWidth={1.8} />
              <Text style={[styles.timeText, { color: ACCENT }]}>{timeWindow.label}</Text>
            </View>
            <Text style={[styles.heroTitle, { color: textColor }]}>{ritualMeta.title}</Text>
            <Text style={[styles.heroSub, { color: subColor }]}>{timeWindow.intro}</Text>
          </Animated.View>

          {/* ── ASTROLOGICZNY KONTEKST ── */}
          <Animated.View entering={FadeInDown.delay(60).duration(520)}>
            <View style={[styles.ritualCard, { backgroundColor: cardBg, borderColor: '#818CF8' + '40' }]}>
              <LinearGradient colors={['#818CF8' + '14', 'transparent']} style={StyleSheet.absoluteFill} />
              <Text style={[styles.cardEyebrow, { color: '#818CF8' }]}>🔭 ASTROLOGICZNY KONTEKST</Text>
              <Text style={[{ fontSize: 12.5, color: subColor, lineHeight: 19, marginBottom: 14 }]}>
                Każda chwila nosi swój własny energetyczny podpis.
              </Text>
              <View style={{ gap: 10 }}>
                {/* Planetary hour */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: ACCENT + '0C', borderWidth: 1, borderColor: ACCENT + '28' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 22 }}>{planetaryData.planetaryHourEmoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: ACCENT, letterSpacing: 1.2 }}>GODZINA PLANETARNA</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor, marginTop: 2 }}>{planetaryData.planetaryHour}</Text>
                    <Text style={{ fontSize: 12, color: subColor, marginTop: 1 }}>Wpływa na energię każdego rytuału</Text>
                  </View>
                </View>
                {/* Moon phase */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: '#818CF8' + '0C', borderWidth: 1, borderColor: '#818CF8' + '28' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#818CF8' + '18', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 22 }}>{moonInfo.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#818CF8', letterSpacing: 1.2 }}>FAZA KSIĘŻYCA</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor, marginTop: 2 }}>{moonInfo.name}</Text>
                    <Text style={{ fontSize: 12, color: subColor, marginTop: 1 }}>{moonInfo.desc}</Text>
                  </View>
                </View>
                {/* Day ruler */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: '#F59E0B' + '0C', borderWidth: 1, borderColor: '#F59E0B' + '28' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#F59E0B' + '18', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 22 }}>{planetaryData.dayRulerEmoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#F59E0B', letterSpacing: 1.2 }}>WŁADCA DNIA</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor, marginTop: 2 }}>{planetaryData.dayRuler} — {dayOfWeek}</Text>
                    <Text style={{ fontSize: 12, color: subColor, marginTop: 1 }}>{planetaryData.dayQuality}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── DLACZEGO WŁAŚNIE TERAZ (meta card) ── */}
          <Animated.View entering={FadeInDown.delay(70).duration(520)}>
            <View style={[styles.metaCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
              <LinearGradient colors={[ACCENT + '18', 'transparent']} style={StyleSheet.absoluteFill} />
              <Text style={[styles.cardEyebrow, { color: ACCENT }]}>DLACZEGO WŁAŚNIE TERAZ</Text>
              <Text style={[styles.cardBody, { color: textColor }]}>{ritualMeta.whyToday}</Text>
              <View style={styles.metaRow}>
                {[
                  { label: 'Kategoria', value: ritualMeta.category },
                  { label: 'Czas', value: ritualMeta.duration },
                  { label: 'Księżyc', value: dailyPlan.moonPhase?.icon || '🌙' },
                ].map((item, index) => (
                  <View key={item.label} style={[styles.metaCell, index > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: ACCENT + '26' }]}>
                    <Text style={[styles.metaValue, { color: ACCENT }]}>{item.value}</Text>
                    <Text style={[styles.metaLabel, { color: subColor }]}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* ── ENERGIA PRZED RYTUAŁEM ── */}
          <Animated.View entering={FadeInDown.delay(75).duration(520)}>
            <View style={[styles.ritualCard, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.cardEyebrow, { color: '#34D399' }]}>⚡ ENERGIA PRZED RYTUAŁEM</Text>
              <Text style={[{ fontSize: 13, color: subColor, lineHeight: 19, marginBottom: 14 }]}>
                Oceń swój poziom energii przed wejściem w ceremonię.
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map(n => {
                  const active = energyBefore === n;
                  const EMOJIS = ['😶', '😕', '😐', '🙂', '✨'];
                  const LABELS = ['Bardzo niska', 'Niska', 'Średnia', 'Dobra', 'Wysoka'];
                  return (
                    <Pressable
                      key={n}
                      onPress={() => { HapticsService.impact('light'); setEnergyBefore(n); }}
                      style={{
                        flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16,
                        borderWidth: 1.5,
                        borderColor: active ? '#34D399' : '#34D399' + '33',
                        backgroundColor: active ? '#34D399' + '22' : 'transparent',
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{EMOJIS[n - 1]}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: active ? '#34D399' : subColor, marginTop: 4 }}>{n}</Text>
                      {active && <Text style={{ fontSize: 9, color: '#34D399', marginTop: 2, textAlign: 'center', paddingHorizontal: 2 }}>{LABELS[n - 1]}</Text>}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Animated.View>

          {/* ── TON ENERGETYCZNY ── */}
          <Animated.View entering={FadeInDown.delay(80).duration(520)}>
            <View style={[styles.ritualCard, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.cardEyebrow, { color: ACCENT }]}>⚡ TON ENERGETYCZNY</Text>
              <Text style={[{ fontSize: 13, lineHeight: 19, marginBottom: 12 }, { color: subColor }]}>Dobierz ceremonię do swojego stanu.</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ENERGY_TONES.map((t) => {
                  const active = energyTone === t.id;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => { setEnergyTone(t.id); setRitualText(''); setCheckedIngredients(new Set()); }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: active ? ACCENT : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'), backgroundColor: active ? ACCENT + '18' : 'transparent' }}
                    >
                      <Text style={{ fontSize: 16 }}>{t.emoji}</Text>
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: active ? '700' : '500', color: active ? ACCENT : (isLight ? '#1A1410' : '#F5F1EA') }}>{t.label}</Text>
                        <Text style={{ fontSize: 10, color: subColor }}>{t.desc}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              {ritualText === '' && !loading && (
                <Pressable onPress={generateRitual} style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: ACCENT + '14', borderWidth: 1, borderColor: ACCENT + '40' }}>
                  <Sparkles color={ACCENT} size={15} strokeWidth={1.8} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: ACCENT }}>Wygeneruj rytuał</Text>
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* ── LISTA SKŁADNIKÓW ── */}
          <Animated.View entering={FadeInDown.delay(90).duration(520)}>
            <View style={[styles.ritualCard, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.cardEyebrow, { color: '#34D399' }]}>🌿 LISTA SKŁADNIKÓW</Text>
              <Text style={[{ fontSize: 12.5, color: subColor, lineHeight: 19, marginBottom: 14 }]}>
                Przygotuj te elementy przed rytuałem tonu „{ENERGY_TONES.find(t => t.id === energyTone)?.label}".
              </Text>
              <View style={{ gap: 10 }}>
                {ingredients.map(ing => {
                  const done = checkedIngredients.has(ing.name);
                  return (
                    <Pressable
                      key={ing.name}
                      onPress={() => toggleIngredient(ing.name)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 12,
                        padding: 12, borderRadius: 14, borderWidth: 1,
                        borderColor: done ? '#34D399' + '55' : borderColor,
                        backgroundColor: done ? '#34D399' + '10' : (isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.025)'),
                      }}
                    >
                      <View style={{ width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: done ? '#34D399' : borderColor, backgroundColor: done ? '#34D399' + '20' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                        {done && <Text style={{ fontSize: 14 }}>✓</Text>}
                      </View>
                      <Text style={{ fontSize: 20 }}>{ing.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: done ? '#34D399' : textColor }}>{ing.name}</Text>
                        <Text style={{ fontSize: 11, color: subColor, marginTop: 2 }}>{ing.purpose}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={{ fontSize: 11, color: subColor, marginTop: 12, textAlign: 'center' }}>
                {checkedIngredients.size}/{ingredients.length} przygotowanych
              </Text>
            </View>
          </Animated.View>

          {/* ── INTENCJA W 9 SŁOWACH ── */}
          <Animated.View entering={FadeInDown.delay(95).duration(520)}>
            <View style={[styles.ritualCard, { backgroundColor: cardBg, borderColor: '#F59E0B' + '44' }]}>
              <LinearGradient colors={['#F59E0B' + '10', 'transparent']} style={StyleSheet.absoluteFill} />
              <Text style={[styles.cardEyebrow, { color: '#F59E0B' }]}>✨ INTENCJA W DOKŁADNIE 9 SŁOWACH</Text>
              <Text style={[{ fontSize: 12.5, color: subColor, lineHeight: 19, marginBottom: 12 }]}>
                Dziewięć słów tworzy kompletną myśl — wyraź intencję tego rytuału precyzyjnie.
              </Text>
              {intention9Saved ? (
                <View style={{ padding: 16, borderRadius: 16, backgroundColor: '#F59E0B' + '14', borderWidth: 1, borderColor: '#F59E0B' + '44', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 20 }}>✨</Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: textColor, textAlign: 'center', lineHeight: 23, fontStyle: 'italic' }}>„{intention9}"</Text>
                  <Pressable onPress={() => setIntention9Saved(false)} hitSlop={8}>
                    <Text style={{ fontSize: 12, color: '#F59E0B', marginTop: 4 }}>Edytuj intencję</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <TextInput
                    value={intention9}
                    onChangeText={setIntention9}
                    placeholder="Wpisz dokładnie 9 słów swojej intencji..."
                    placeholderTextColor={subColor + '80'}
                    multiline
                    style={{
                      color: textColor, fontSize: 15, lineHeight: 24,
                      borderWidth: 1.5, borderColor: wordCount9 === 9 ? '#F59E0B' : (wordCount9 > 9 ? '#E8705A' : '#F59E0B' + '44'),
                      borderRadius: 14, padding: 14, minHeight: 72,
                      backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                      textAlignVertical: 'top',
                    }}
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <Text style={{ fontSize: 13, color: wordCount9 === 9 ? '#34D399' : wordCount9 > 9 ? '#E8705A' : subColor, fontWeight: '600' }}>
                      {wordCount9} / 9 słów {wordCount9 === 9 ? '✓' : wordCount9 > 9 ? '— za dużo' : ''}
                    </Text>
                    <Pressable
                      onPress={saveIntention}
                      disabled={wordCount9 !== 9}
                      style={{ paddingHorizontal: 18, paddingVertical: 9, borderRadius: 12, backgroundColor: wordCount9 === 9 ? '#F59E0B' : '#F59E0B' + '44' }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>Zatwierdź intencję</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </Animated.View>

          {/* ── TEKST RYTUAŁU ── */}
          <Animated.View entering={FadeInDown.delay(120).duration(520)}>
            <View style={[styles.ritualCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.ritualHeader}>
                <Text style={[styles.cardEyebrow, { color: ACCENT }]}>📜 TEKST RYTUAŁU</Text>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <Pressable onPress={() => setGuideMode(v => !v)} hitSlop={10}>
                    <Headphones color={guideMode ? ACCENT : subColor} size={18} strokeWidth={1.8} />
                  </Pressable>
                  <Pressable onPress={generateRitual} hitSlop={10}>
                    <Text style={[styles.refreshText, { color: ACCENT }]}>↻ Odśwież</Text>
                  </Pressable>
                </View>
              </View>
              {guideMode && (
                <View style={{ marginBottom: 10, padding: 10, borderRadius: 12, backgroundColor: ACCENT + '10', borderWidth: 1, borderColor: ACCENT + '30', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Headphones color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={{ fontSize: 12, color: ACCENT, fontWeight: '600', flex: 1 }}>
                    Tryb prowadzenia aktywny — czytaj tekst na głos, wolno i z pauzami.
                  </Text>
                </View>
              )}
              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator color={ACCENT} size="large" />
                  <Text style={[styles.loadingText, { color: subColor }]}>Oracle układa rytuał do Twojego tonu dnia...</Text>
                </View>
              ) : (
                <Text style={[styles.ritualText, { color: textColor, fontSize: guideMode ? 18 : 15, lineHeight: guideMode ? 32 : 25 }]}>
                  {ritualText}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* ── PRZEBIEG KROK PO KROKU ── */}
          <Animated.View entering={FadeInDown.delay(170).duration(540)}>
            <Text style={[styles.sectionTitle, { color: ACCENT }]}>✦ PRZEBIEG KROK PO KROKU</Text>
            {ritualSteps.map((step, index) => {
              const done = completedSteps.includes(step.step) || finished;
              return (
                <Animated.View key={step.step} entering={FadeInUp.delay(210 + index * 45).duration(420)}>
                  <Pressable onPress={() => !finished && toggleStep(step.step)} style={[styles.stepCard, { backgroundColor: done ? ACCENT + '12' : cardBg, borderColor: done ? ACCENT + '50' : borderColor }]}>
                    <View style={[styles.stepBadge, { backgroundColor: done ? ACCENT : ACCENT + '18' }]}>
                      {done ? <CheckCircle2 color="#FFF" size={16} /> : <Text style={[styles.stepBadgeText, { color: ACCENT }]}>{step.step}</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stepTitle, { color: done ? ACCENT : textColor }]}>{step.title}</Text>
                      <Text style={[styles.stepDuration, { color: subColor }]}>{step.duration}</Text>
                      <Text style={[styles.stepDesc, { color: subColor }]}>{step.desc}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>

          {!finished && completedSteps.length >= 3 && (
            <Animated.View entering={FadeInUp.duration(420)}>
              <Pressable onPress={finishRitual} style={[styles.finishButton, { backgroundColor: ACCENT }]}>
                <Flame color="#FFF" size={18} />
                <Text style={styles.finishButtonText}>Zakończ rytuał</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* ── ENERGIA PO RYTUALE ── */}
          {(finished || completedSteps.length >= 2) && (
            <Animated.View entering={FadeInDown.duration(480)}>
              <View style={[styles.ritualCard, { backgroundColor: cardBg, borderColor: '#A78BFA' + '44' }]}>
                <Text style={[styles.cardEyebrow, { color: '#A78BFA' }]}>⚡ ENERGIA PO RYTUALE</Text>
                <Text style={[{ fontSize: 13, color: subColor, lineHeight: 19, marginBottom: 14 }]}>
                  Jak zmieniła się Twoja energia po ceremonii?
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5].map(n => {
                    const active = energyAfter === n;
                    const EMOJIS = ['😶', '😕', '😐', '🙂', '✨'];
                    const LABELS = ['Bardzo niska', 'Niska', 'Średnia', 'Dobra', 'Wysoka'];
                    return (
                      <Pressable
                        key={n}
                        onPress={() => { HapticsService.impact('light'); setEnergyAfter(n); }}
                        style={{
                          flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16,
                          borderWidth: 1.5,
                          borderColor: active ? '#A78BFA' : '#A78BFA' + '33',
                          backgroundColor: active ? '#A78BFA' + '22' : 'transparent',
                        }}
                      >
                        <Text style={{ fontSize: 22 }}>{EMOJIS[n - 1]}</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: active ? '#A78BFA' : subColor, marginTop: 4 }}>{n}</Text>
                        {active && <Text style={{ fontSize: 9, color: '#A78BFA', marginTop: 2, textAlign: 'center', paddingHorizontal: 2 }}>{LABELS[n - 1]}</Text>}
                      </Pressable>
                    );
                  })}
                </View>
                {energyBefore > 0 && energyAfter > 0 && (
                  <View style={{ marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: energyAfter >= energyBefore ? '#34D399' + '14' : '#F97316' + '14', borderWidth: 1, borderColor: energyAfter >= energyBefore ? '#34D399' + '44' : '#F97316' + '44', alignItems: 'center' }}>
                    <Text style={{ fontSize: 22 }}>{energyAfter > energyBefore ? '📈' : energyAfter === energyBefore ? '⚖️' : '📉'}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, marginTop: 6 }}>
                      {energyAfter > energyBefore
                        ? `Energia wzrosła o ${energyAfter - energyBefore} punkt${energyAfter - energyBefore > 1 ? 'y' : ''}!`
                        : energyAfter === energyBefore
                        ? 'Energia pozostała na tym samym poziomie.'
                        : `Energia opadła o ${energyBefore - energyAfter} punkt${energyBefore - energyAfter > 1 ? 'y' : ''}. Rytuał mógł uruchomić głębsze oczyszczenie.`}
                    </Text>
                    <Text style={{ fontSize: 12, color: subColor, marginTop: 4, textAlign: 'center' }}>
                      {energyBefore} / 5 → {energyAfter} / 5
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* ── UKOŃCZENIE ── */}
          {finished && (
            <Animated.View entering={FadeInUp.duration(480)}>
              <View style={[styles.doneCard, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '40' }]}>
                <Text style={styles.doneIcon}>🔥</Text>
                <Text style={[styles.doneTitle, { color: ACCENT }]}>Rytuał został domknięty</Text>
                <Text style={[styles.doneBody, { color: subColor }]}>{ritualMeta.suggestedAction}</Text>
                <Pressable
                  onPress={() => navigation.navigate('JournalEntry', { type: 'reflection', prompt: `Wykonałam/em rytuał dnia. Co realnie zmieniło się we mnie po tej praktyce i co chcę zachować do końca dnia?` })}
                  style={[styles.journalCta, { borderColor: ACCENT + '38', backgroundColor: ACCENT + '0E' }]}
                >
                  <BookOpen color={ACCENT} size={16} strokeWidth={1.8} />
                  <Text style={[styles.journalCtaText, { color: ACCENT }]}>Zapisz integrację po rytuale</Text>
                  <ArrowRight color={ACCENT} size={14} />
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* ── SUGEROWANE DZIAŁANIE PO PRAKTYCE ── */}
          <Animated.View entering={FadeInDown.delay(260).duration(520)}>
            <View style={[styles.supportCard, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.cardEyebrow, { color: ACCENT }]}>🌿 SUGEROWANE DZIAŁANIE PO PRAKTYCE</Text>
              <Text style={[styles.cardBody, { color: textColor }]}>{ritualMeta.suggestedAction}</Text>
            </View>
          </Animated.View>

          {/* ── WŁAŚCIWOŚCI CEREMONII ── */}
          <Animated.View entering={FadeInDown.delay(290).duration(520)}>
            <View style={[styles.ritualCard, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.cardEyebrow, { color: ACCENT }]}>⚗️ WŁAŚCIWOŚCI CEREMONII</Text>
              <Text style={[{ fontSize: 12.5, lineHeight: 19, color: subColor, marginBottom: 14 }]}>Każda pora i dzień nosi inną energię rytualną.</Text>
              <View style={{ gap: 10 }}>
                {ceremonialProperties.map(p => (
                  <View key={p.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: p.color + '0C', borderWidth: 1, borderColor: p.color + '28' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: p.color + '18', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 20 }}>{p.value}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: p.color, letterSpacing: 1.2 }}>{p.label.toUpperCase()}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: textColor, marginTop: 2 }}>{p.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* ── STOPER CEREMONII ── */}
          <Animated.View entering={FadeInDown.delay(310).duration(520)}>
            <View style={[styles.ritualCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.cardEyebrow, { color: ACCENT }]}>⏱️ STOPER CEREMONII</Text>
                <Pressable onPress={() => setShowTimer(v => !v)} hitSlop={10}>
                  <Text style={{ fontSize: 12, color: ACCENT, fontWeight: '600' }}>{showTimer ? 'Ukryj' : 'Pokaż'}</Text>
                </Pressable>
              </View>
              {showTimer && (
                <View style={{ alignItems: 'center', gap: 16 }}>
                  <View style={{ width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: ACCENT + '50', backgroundColor: ACCENT + '0C', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 36, fontWeight: '800', color: ACCENT, letterSpacing: -1 }}>{formatTime(timerSeconds)}</Text>
                    <Text style={{ fontSize: 11, color: subColor }}>pozostało</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {[5,8,12,20].map(min => (
                      <Pressable key={min} onPress={() => { setTimerSeconds(min * 60); setTimerRunning(false); }} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: timerSeconds === min * 60 ? ACCENT : ACCENT + '33', backgroundColor: timerSeconds === min * 60 ? ACCENT + '18' : 'transparent' }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT }}>{min}m</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable onPress={() => setTimerRunning(v => !v)} style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: ACCENT, alignItems: 'center' }}>
                      <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>{timerRunning ? '⏸ Pauza' : '▶ Start'}</Text>
                    </Pressable>
                    <Pressable onPress={() => { setTimerRunning(false); setTimerSeconds(12 * 60); }} style={{ paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: ACCENT + '44', alignItems: 'center' }}>
                      <Text style={{ color: ACCENT, fontWeight: '700' }}>↺</Text>
                    </Pressable>
                  </View>
                </View>
              )}
              {!showTimer && (
                <Text style={{ fontSize: 13, color: subColor, lineHeight: 20 }}>Ustaw stoper, by wejść w rytuał bez myślenia o czasie. Wybierz czas, naciśnij start i poddaj się ceremonii.</Text>
              )}
            </View>
          </Animated.View>

          {/* ── NOTATKA RYTUALNA ── */}
          <Animated.View entering={FadeInDown.delay(330).duration(520)}>
            <View style={[styles.ritualCard, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.cardEyebrow, { color: ACCENT }]}>✏️ NOTATKA PRZED CEREMONIĄ</Text>
              <Text style={[{ fontSize: 12.5, color: subColor, lineHeight: 19, marginBottom: 10 }]}>Co przynoszę do tego rytuału? Co chcę zostawić za sobą?</Text>
              <TextInput
                value={ritualNote}
                onChangeText={setRitualNote}
                placeholder="Napisz kilka słów przed wejściem w ceremonię..."
                placeholderTextColor={subColor + '90'}
                multiline
                numberOfLines={4}
                style={{ color: textColor, fontSize: 14, lineHeight: 22, borderWidth: 1, borderColor: ACCENT + '30', borderRadius: 14, padding: 14, minHeight: 90, backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', textAlignVertical: 'top' }}
              />
              {ritualNote.length > 0 && (
                <Pressable onPress={() => navigation.navigate('JournalEntry', { type: 'ritual', prompt: ritualNote })} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: ACCENT + '0F', borderWidth: 1, borderColor: ACCENT + '30', alignSelf: 'flex-start' }}>
                  <BookOpen color={ACCENT} size={14} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>Przenieś do dziennika</Text>
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* ── RYTUAŁY SEZONOWE ── */}
          <Animated.View entering={FadeInDown.delay(345).duration(520)}>
            <View style={[styles.ritualCard, { backgroundColor: cardBg, borderColor: '#60A5FA' + '44' }]}>
              <Text style={[styles.cardEyebrow, { color: '#60A5FA' }]}>{seasonEmoji} RYTUAŁY SEZONOWE — {seasonLabel}</Text>
              <Text style={[{ fontSize: 12.5, color: subColor, lineHeight: 19, marginBottom: 14 }]}>
                Dodatkowe rytuały harmonizujące z obecną porą roku.
              </Text>
              <View style={{ gap: 10 }}>
                {seasonalRituals.map((r, idx) => (
                  <Animated.View key={r.title} entering={FadeInUp.delay(idx * 50).duration(380)}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 16, backgroundColor: '#60A5FA' + '0A', borderWidth: 1, borderColor: '#60A5FA' + '28' }}>
                      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#60A5FA' + '18', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{r.title}</Text>
                        <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginTop: 4 }}>{r.desc}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                          <Clock color={subColor} size={11} strokeWidth={1.6} />
                          <Text style={{ fontSize: 11, color: subColor }}>{r.duration}</Text>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* ── HISTORIA RYTMU OSTATNICH 7 DNI ── */}
          <Animated.View entering={FadeInDown.delay(350).duration(520)}>
            <View style={[styles.ritualCard, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.cardEyebrow, { color: ACCENT }]}>📅 TWÓJ RYTM CEREMONII</Text>
              <Text style={[{ fontSize: 12.5, color: subColor, marginBottom: 14, lineHeight: 19 }]}>Regularność rytuału jest sama w sobie praktyką.</Text>
              <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - (6 - i));
                  const key = d.toISOString().split('T')[0];
                  const done = dailyProgress[key]?.ritualCompleted;
                  const isToday = i === 6;
                  const dayLabel = ['Nd','Pn','Wt','Śr','Cz','Pt','So'][d.getDay()];
                  return (
                    <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: done ? ACCENT : isToday ? ACCENT + '22' : isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)', borderWidth: isToday ? 1.5 : 0, borderColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
                        {done ? <Text style={{ fontSize: 16 }}>🔥</Text> : isToday ? <Flame color={ACCENT} size={16} strokeWidth={1.5} /> : <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)' }} />}
                      </View>
                      <Text style={{ fontSize: 9, fontWeight: '600', color: isToday ? ACCENT : subColor }}>{dayLabel}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>

          {/* ── DZIELENIE RYTUAŁEM ── */}
          <Animated.View entering={FadeInDown.delay(360).duration(520)}>
            <Pressable onPress={handleShare} style={[styles.shareCard, { backgroundColor: ACCENT + '10', borderColor: ACCENT + '44' }]}>
              <LinearGradient colors={[ACCENT + '18', ACCENT + '06']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Share2 color={ACCENT} size={22} strokeWidth={1.7} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>Podziel się rytuałem</Text>
                <Text style={{ fontSize: 12.5, color: subColor, lineHeight: 18, marginTop: 3 }}>
                  Wygeneruj piękne podsumowanie dzisiejszej ceremonii do udostępnienia.
                </Text>
              </View>
              <ArrowRight color={ACCENT} size={16} strokeWidth={1.6} />
            </Pressable>
          </Animated.View>

          {/* ── CO DALEJ ── */}
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.8, color: ACCENT, marginBottom: 12 }}>✦ CO DALEJ?</Text>
            {[
              { icon: BookOpen, label: 'Dziennik po rytuale', sub: 'Zapisz, co zmieniło się po ceremonii', color: ACCENT, route: 'JournalEntry', params: { type: 'ritual', prompt: 'Po dzisiejszym rytuale czuję... i przynoszę ze sobą...' } },
              { icon: Sparkles, label: 'Wyrocznia Aethery', sub: 'Zapytaj o znaczenie rytuału w tej chwili życia', color: '#A78BFA', route: 'OraclePortal' },
              { icon: Moon, label: 'Medytacja domknięcia', sub: 'Zamknij ceremonię ciszą i oddechem', color: '#60A5FA', route: 'Meditation' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => navigation.navigate(item.route as any, (item as any).params)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10, backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)', borderColor: item.color + '33' }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: item.color + '18' }}>
                    <Icon color={item.color} size={17} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: isLight ? '#1A1A1A' : '#F5F1EA' }}>{item.label}</Text>
                    <Text style={{ fontSize: 12, color: isLight ? 'rgba(0,0,0,0.55)' : 'rgba(245,241,234,0.60)', marginTop: 2, lineHeight: 18 }}>{item.sub}</Text>
                  </View>
                  <ArrowRight color={item.color} size={15} strokeWidth={1.5} />
                </Pressable>
              );
            })}
          </View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingTop: 8, paddingBottom: 10 },
  backBtn: { width: 40 },
  shareHeaderBtn: { width: 40, alignItems: 'flex-end' },
  headerCenter: { flex: 1, alignItems: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  title: { fontSize: 18, fontWeight: '600' },
  scroll: { paddingHorizontal: 22, paddingTop: 4, gap: 14 },
  heroCard: { alignItems: 'center', paddingVertical: 12, gap: 12 },
  timePill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  timeText: { fontSize: 13, fontWeight: '700' },
  heroTitle: { fontSize: 24, lineHeight: 30, fontWeight: '700', textAlign: 'center' },
  heroSub: { fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 320 },
  metaCard: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden' },
  cardEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 8 },
  cardBody: { fontSize: 14, lineHeight: 22 },
  metaRow: { flexDirection: 'row', marginTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.10)', paddingTop: 14 },
  metaCell: { flex: 1, alignItems: 'center' },
  metaValue: { fontSize: 16, fontWeight: '700' },
  metaLabel: { fontSize: 11, marginTop: 4 },
  ritualCard: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden' },
  ritualHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  refreshText: { fontSize: 13, fontWeight: '700' },
  loadingWrap: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  loadingText: { fontSize: 14 },
  ritualText: { fontSize: 15, lineHeight: 25 },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  stepCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  stepBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stepBadgeText: { fontSize: 14, fontWeight: '800' },
  stepTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  stepDuration: { fontSize: 12, marginBottom: 4 },
  stepDesc: { fontSize: 13, lineHeight: 20 },
  finishButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, paddingVertical: 16 },
  finishButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  doneCard: { borderRadius: 22, borderWidth: 1, padding: 22, alignItems: 'center' },
  doneIcon: { fontSize: 42, marginBottom: 8 },
  doneTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  doneBody: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  journalCta: { marginTop: 16, width: '100%', borderWidth: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  journalCtaText: { flex: 1, fontSize: 14, fontWeight: '700' },
  supportCard: { borderRadius: 22, borderWidth: 1, padding: 18 },
  shareCard: { borderRadius: 22, borderWidth: 1, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden' },
});
