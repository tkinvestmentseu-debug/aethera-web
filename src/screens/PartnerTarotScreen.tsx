// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import i18n from '../core/i18n';
import Animated, {
  FadeInDown, FadeInUp, ZoomIn, ZoomInEasyDown,
  withRepeat, withTiming, withSequence, withSpring, withDelay,
  useSharedValue, useAnimatedStyle, interpolate, Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import {
  Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, TextInput, View, Dimensions, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, Ellipse, Path, Rect, Defs, RadialGradient as SvgRadialGradient,
  LinearGradient as SvgLinearGradient, Stop, Line, G, Text as SvgText, Polygon,
} from 'react-native-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight, BookOpen, Calendar, ChevronLeft, ChevronDown, ChevronUp,
  Crown, Eye, Flame, Heart, HeartHandshake, History, Infinity as InfinityIcon,
  MessageCircle, Moon, Plus, Sparkles, Star, Stars, Sun, Shield,
  Users, Wand2, Zap, RefreshCw, Save, Layers, BarChart2,
  CheckCircle, Clock, Gift, Music, TrendingUp,
} from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '../core/utils/localeFormat';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { CelestialBackdrop } from '../components/CelestialBackdrop';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { PremiumDatePickerSheet } from '../components/PremiumDatePickerSheet';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { ALL_CARDS } from '../features/tarot/data/cards';
import { getTarotDeckById } from '../features/tarot/data/decks';
import { TarotCardVisual } from '../features/tarot/components/TarotCardVisual';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW, height: SH } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────────────────────────
const ACCENT   = '#E8705A';
const ROSE     = '#F472B6';
const GOLD     = '#CEAE72';
const LAVENDER = '#B8A4D4';
const CRIMSON  = '#C4536A';
const DEEP_BG  = ['#140818', '#200E2A', '#0E1428'] as const;

const CARD_W = SW * 0.38;
const CARD_H = CARD_W * 1.62;

// ─── Helper: Life-path number ─────────────────────────────────────────────────
const calcLifePath = (dateStr: string): number => {
  if (!dateStr) return 0;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 0;
    let sum = String(d.getFullYear()).split('').reduce((a, b) => a + Number(b), 0)
      + (d.getMonth() + 1)
      + d.getDate();
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      sum = String(sum).split('').reduce((a, b) => a + Number(b), 0);
    }
    return sum;
  } catch { return 0; }
};

const calcCompatNumber = (d1: string, d2: string): number => {
  const lp1 = calcLifePath(d1);
  const lp2 = calcLifePath(d2);
  if (!lp1 || !lp2) return 0;
  let total = lp1 + lp2;
  while (total > 9 && total !== 11 && total !== 22 && total !== 33) {
    total = String(total).split('').reduce((a, b) => a + Number(b), 0);
  }
  return total;
};

const ZODIAC_SIGNS = [
  { name: 'Baran', symbol: '♈', dateRange: '21.03–19.04', element: 'Ogień' },
  { name: 'Byk', symbol: '♉', dateRange: '20.04–20.05', element: 'Ziemia' },
  { name: 'Bliźnięta', symbol: '♊', dateRange: '21.05–20.06', element: 'Powietrze' },
  { name: 'Rak', symbol: '♋', dateRange: '21.06–22.07', element: 'Woda' },
  { name: 'Lew', symbol: '♌', dateRange: '23.07–22.08', element: 'Ogień' },
  { name: 'Panna', symbol: '♍', dateRange: '23.08–22.09', element: 'Ziemia' },
  { name: 'Waga', symbol: '♎', dateRange: '23.09–22.10', element: 'Powietrze' },
  { name: 'Skorpion', symbol: '♏', dateRange: '23.10–21.11', element: 'Woda' },
  { name: 'Strzelec', symbol: '♐', dateRange: '22.11–21.12', element: 'Ogień' },
  { name: 'Koziorożec', symbol: '♑', dateRange: '22.12–19.01', element: 'Ziemia' },
  { name: 'Wodnik', symbol: '♒', dateRange: '20.01–18.02', element: 'Powietrze' },
  { name: 'Ryby', symbol: '♓', dateRange: '19.02–20.03', element: 'Woda' },
];

const getZodiacFromDate = (dateStr: string) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return ZODIAC_SIGNS[0];
  if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return ZODIAC_SIGNS[1];
  if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return ZODIAC_SIGNS[2];
  if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return ZODIAC_SIGNS[3];
  if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return ZODIAC_SIGNS[4];
  if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return ZODIAC_SIGNS[5];
  if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return ZODIAC_SIGNS[6];
  if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return ZODIAC_SIGNS[7];
  if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return ZODIAC_SIGNS[8];
  if ((m === 12 && day >= 22) || (m === 1 && day <= 19)) return ZODIAC_SIGNS[9];
  if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return ZODIAC_SIGNS[10];
  return ZODIAC_SIGNS[11];
};

const getMoonPhaseLabel = (dateStr: string): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const refNew = new Date('2000-01-06').getTime();
  const diff = d.getTime() - refNew;
  const cycle = 29.53058867 * 24 * 3600 * 1000;
  const phase = ((diff % cycle) + cycle) % cycle;
  const frac = phase / cycle;
  if (frac < 0.0625) return '🌑 Nów';
  if (frac < 0.1875) return '🌒 Przybywający Sierp';
  if (frac < 0.3125) return '🌓 Pierwsza Kwadra';
  if (frac < 0.4375) return '🌔 Przybywający Garb';
  if (frac < 0.5625) return '🌕 Pełnia';
  if (frac < 0.6875) return '🌖 Ubywający Garb';
  if (frac < 0.8125) return '🌗 Ostatnia Kwadra';
  if (frac < 0.9375) return '🌘 Ubywający Sierp';
  return '🌑 Nów';
};

const drawRandomCards = (count: number) => {
  if (!ALL_CARDS || ALL_CARDS.length === 0) return [];
  const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(card => ({
    card,
    isReversed: Math.random() > 0.7,
    revealed: false,
    position: '',
  }));
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const SPREAD_TYPES = [
  {
    id: 'zwiazek',
    name: 'Związek',
    subtitle: '5 kart',
    cardCount: 5,
    icon: HeartHandshake,
    color: ACCENT,
    positions: ['Przeszłość', 'Ty', 'Partner', 'Wyzwanie', 'Potencjał'],
    desc: 'Pełny odczyt dynamiki relacji — korzenie, obecny stan i potencjał.',
  },
  {
    id: 'milosc',
    name: 'Miłość',
    subtitle: '3 karty',
    cardCount: 3,
    icon: Heart,
    color: ROSE,
    positions: ['Co Cię łączy', 'Co Was wyzwala', 'Dar relacji'],
    desc: 'Trzy karty odsłaniające rdzeń waszego połączenia.',
  },
  {
    id: 'wyzwanie',
    name: 'Wyzwanie',
    subtitle: '4 karty',
    cardCount: 4,
    icon: Zap,
    color: GOLD,
    positions: ['Źródło napięcia', 'Twoje potrzeby', 'Potrzeby partnera', 'Droga naprzód'],
    desc: 'Cztery karty analizujące trudności i jak je przekształcić.',
  },
  {
    id: 'przyszlosc',
    name: 'Przyszłość',
    subtitle: '3 karty',
    cardCount: 3,
    icon: Stars,
    color: LAVENDER,
    positions: ['Najbliższy miesiąc', 'Wyzwanie', 'Szansa'],
    desc: 'Horyzont relacji — co was czeka i na co zwrócić uwagę.',
  },
  {
    id: 'dusza',
    name: 'Dusza',
    subtitle: '7 kart',
    cardCount: 7,
    icon: Sparkles,
    color: '#A78BFA',
    positions: ['Dusze', 'Kontrakt', 'Ty w relacji', 'Partner w relacji', 'Cień', 'Dar', 'Przeznaczenie'],
    desc: 'Najgłębszy odczyt duszy pary — kontrakt duchowy i wspólna misja.',
  },
];

const SYNASTRY_AREAS = [
  { key: 'Komunikacja', icon: MessageCircle, color: '#60A5FA' },
  { key: 'Wartości', icon: Shield, color: '#34D399' },
  { key: 'Namiętność', icon: Flame, color: '#F97316' },
  { key: 'Wzrost', icon: TrendingUp, color: '#A78BFA' },
  { key: 'Zaufanie', icon: CheckCircle, color: GOLD },
  { key: 'Radość', icon: Gift, color: ROSE },
];

const RELATIONSHIP_PHASES = [
  { id: 'Zakochanie', emoji: '✨', color: '#F472B6', desc: 'Intensywna faza przyciągania i idealizacji. Wasza para żyje bliskością pierwszego odkrycia.', hint: 'Pielęgnujcie tę jakość świeżości — ona nie musi zniknąć.' },
  { id: 'Budowanie', emoji: '🌱', color: '#34D399', desc: 'Czas budowania zaufania, nawyków i głębszej znajomości wzajemnych potrzeb.', hint: 'Małe, codzienne wybory tworzą fundament na lata.' },
  { id: 'Dojrzałość', emoji: '∞', color: '#8B5CF6', desc: 'Dojrzała bliskość, akceptacja różnic i świadome wybieranie siebie nawzajem.', hint: 'Dojrzałość to nie koniec romansu — to jego głębsza forma.' },
  { id: 'Transformacja', emoji: '🦋', color: '#E8C97A', desc: 'Relacja przechodzi przez zmianę — jedno lub oboje z Was rośnie w nowym kierunku.', hint: 'Transformacja parze przynosi siłę, jeśli przechodzicie przez nią razem.' },
  { id: 'Kryzys', emoji: '⚡', color: '#F59E0B', desc: 'Napięcia i konflikty testują to, co zbudowaliście. Kryzys to sygnał, nie wyrok.', hint: 'Każdy kryzys niesie pytanie: czego ta relacja potrzebuje, żeby przetrwać?' },
  { id: 'Uzdrowienie', emoji: '💙', color: '#60A5FA', desc: 'Para leczy rany — indywidualne lub wzajemne. Czas wrażliwości i odwagi.', hint: 'Uzdrowienie wymaga mówienia prawdy z sercem otwartym na drugiego człowieka.' },
];

const COMPAT_MEANINGS: Record<number, { title: string; desc: string; color: string }> = {
  1: { title: 'Para Pionierów', desc: 'Silna indywidualność obu partnerów. Wasza więź jest iskrząca i wymaga szacunku dla wzajemnej autonomii.', color: '#F59E0B' },
  2: { title: 'Para Harmonii', desc: 'Zbudowani do partnerstwa — intuicja działa między Wami niemal bez słów. Wyczuwacie potrzeby drugiej osoby.', color: '#60A5FA' },
  3: { title: 'Para Twórcza', desc: 'Razem generujecie radość, kreatywność i ekspresję. Wasze połączenie jest żywe i inspirujące.', color: '#A78BFA' },
  4: { title: 'Para Budowniczych', desc: 'Macie siłę budowania czegoś trwałego razem. Lojalność i wytrwałość są Waszą wspólną mocą.', color: '#34D399' },
  5: { title: 'Para Wolności', desc: 'Wasze połączenie żyje dynamiką, zmianą i przygodą. Dla trwałości potrzebujecie wspólnej kotwicy.', color: '#F97316' },
  6: { title: 'Para Opiekunów', desc: 'Macie naturalną potrzebę troski o siebie nawzajem. Wasza relacja może być głęboko uzdrawiająca.', color: '#EC4899' },
  7: { title: 'Para Duchowa', desc: 'Połączyła Was nie tylko chemia, ale coś głębszego — wspólna potrzeba rozumienia i prawdy.', color: '#8B5CF6' },
  8: { title: 'Para Siły', desc: 'Razem macie ogromną moc sprawczą. Kluczem jest, by wybierać też po prostu bycie razem.', color: '#D97706' },
  9: { title: 'Para Mądrości', desc: 'Wasza relacja niesie głębię, empatię i wzniosły wymiar. Macie szansę na więź dotykającą sensu.', color: '#C084FC' },
  11: { title: 'Para Intuicji (Mistrz 11)', desc: 'Liczba mistrzowska — Wasza więź działa na poziomie nadzmysłowym. Silna telepatia emocjonalna.', color: '#FDE68A' },
  22: { title: 'Para Architektów (Mistrz 22)', desc: 'Zdolni zbudować razem coś naprawdę trwałego i znaczącego. Rzadkie i cenne połączenie.', color: '#6EE7B7' },
  33: { title: 'Para Uzdrowicieli (Mistrz 33)', desc: 'Najwyższa liczba mistrzowska. Wasza relacja może dotykać uzdrowienia wielu ludzi dookoła Was.', color: '#F9A8D4' },
};

const RELATIONSHIP_ARCHETYPES = [
  { id: 'lustro', name: 'Lustro', icon: Eye, color: '#A78BFA', desc: 'Oboje odbijają swoje ukryte części — relacja jest zwierciadłem duszy każdego z Was.' },
  { id: 'katalizator', name: 'Katalizator', icon: Flame, color: '#F97316', desc: 'Relacja przyspiesza wzrost duszy — Wasza bliskość wyzwala to, co chciało się wyłonić.' },
  { id: 'uzdrowiciel', name: 'Uzdrowiciel', icon: Heart, color: '#F472B6', desc: 'Miłość leczy dawne rany — bycie razem jest procesem powrotu do pełni.' },
  { id: 'nauczyciel', name: 'Nauczyciel', icon: BookOpen, color: '#60A5FA', desc: 'Każde z Was jest przewodnikiem drugiego — ta relacja uczy tego, czego nie nauczyła Cię samotność.' },
  { id: 'wojownik', name: 'Wojownicy', icon: Shield, color: '#34D399', desc: 'Razem stajecie się niezłomni — połączenie daje siłę stawić czoła światu.' },
  { id: 'alchemik', name: 'Alchemicy', icon: Crown, color: GOLD, desc: 'Razem przemieniacie wszystko, czego dotykacie. Wasza para ma moc twórczą.' },
];

const DEEP_QUESTIONS = [
  { q: 'Co sprawia, że ta relacja jest dla mnie wyjątkowa?', hint: 'Odpowiedź leży w tym, co czujesz, kiedy jesteś naprawdę sobą przy tej osobie.', color: ACCENT },
  { q: 'Kiedy czuję się najbardziej kochany/a w tej relacji?', hint: 'Język miłości objawia się w chwilach, nie w deklaracjach.', color: ROSE },
  { q: 'Co chciałbym/chciałabym, żeby ta osoba wiedziała o mnie?', hint: 'Sekrety, które nosimy, budują mury. Słowa prawdy budują mosty.', color: GOLD },
  { q: 'Jaki strach hamuje mnie przed pełną bliskością?', hint: 'Strach przed porzuceniem jest często ukrytym pragnieniem głębszej więzi.', color: LAVENDER },
  { q: 'Co w tej relacji chcę pielęgnować przez najbliższy rok?', hint: 'Intencja wypowiedziana na głos staje się zaproszeniem dla wszechświata.', color: '#34D399' },
  { q: 'Jaka wersja siebie wyłania się tylko przy tej osobie?', hint: 'Relacja jest lustrem — pokazuje, kim możemy się stać.', color: '#F97316' },
  { q: 'Co ta relacja leczy we mnie?', hint: 'Miłość przychodzi nie tylko by nas radować, lecz by uzdrawiać rany zbyt stare, by je pamiętać.', color: '#8B5CF6' },
  { q: 'Czego uczę się od partnera?', hint: 'Najbliższe nam osoby są naszymi najlepszymi nauczycielami — jeśli chcemy słuchać.', color: '#60A5FA' },
  { q: 'Jakie granice chcę postawić dla dobra tej relacji?', hint: 'Granica to nie odrzucenie — to zaproszenie do głębszego szacunku.', color: '#EC4899' },
  { q: 'Co ta relacja mówi mi o mojej własnej duszy?', hint: 'Każda miłość jest wyprawą w głąb siebie ukrytą w byciu razem z kimś innym.', color: '#A78BFA' },
];

const LOVE_LANGUAGE_QUIZ = [
  {
    q: 'Co sprawia mi największą radość w związku?',
    options: [
      { text: 'Kiedy partner mówi: "kocham Cię"', lang: 'Słowa afirmacji' },
      { text: 'Wspólne spędzone chwile', lang: 'Czas jakości' },
      { text: 'Niespodzianki i prezenty', lang: 'Prezenty' },
      { text: 'Pomoc w codziennych sprawach', lang: 'Akty służby' },
      { text: 'Przytulenie i dotyk', lang: 'Dotyk fizyczny' },
    ],
  },
  {
    q: 'Kiedy czuję się najbardziej zaniedbany/a?',
    options: [
      { text: 'Gdy partner nie mówi mi, że mnie ceni', lang: 'Słowa afirmacji' },
      { text: 'Gdy spędzamy razem za mało czasu', lang: 'Czas jakości' },
      { text: 'Gdy partner zapomina o ważnych datach', lang: 'Prezenty' },
      { text: 'Gdy muszę sam/a radzić sobie z problemami', lang: 'Akty służby' },
      { text: 'Gdy brakuje mi fizycznej bliskości', lang: 'Dotyk fizyczny' },
    ],
  },
  {
    q: 'Jak wyrażam miłość do partnera?',
    options: [
      { text: 'Mówię mu/jej jak wiele dla mnie znaczy', lang: 'Słowa afirmacji' },
      { text: 'Planuję wspólne aktywności', lang: 'Czas jakości' },
      { text: 'Kupuję małe niespodzianki', lang: 'Prezenty' },
      { text: 'Robię rzeczy, które ułatwiają mu/jej życie', lang: 'Akty służby' },
      { text: 'Dotykam, tulę, trzymam za rękę', lang: 'Dotyk fizyczny' },
    ],
  },
  {
    q: 'Co najbardziej pamiętam z pięknych chwil w relacji?',
    options: [
      { text: 'Słowa, które ktoś do mnie powiedział', lang: 'Słowa afirmacji' },
      { text: 'To, że byliśmy razem i obecni', lang: 'Czas jakości' },
      { text: 'Symboliczny gest lub podarunek', lang: 'Prezenty' },
      { text: 'To, że ktoś mi pomógł bez proszenia', lang: 'Akty służby' },
      { text: 'Fizyczną bliskość i ciepło', lang: 'Dotyk fizyczny' },
    ],
  },
  {
    q: 'Co chciałbym/chciałabym, aby partner robił częściej?',
    options: [
      { text: 'Wyrażał/a swoje uczucia słowami', lang: 'Słowa afirmacji' },
      { text: 'Planował/a z wyprzedzeniem tylko dla nas dwoje', lang: 'Czas jakości' },
      { text: 'Pamiętał/a o małych wyjątkowych chwilach', lang: 'Prezenty' },
      { text: 'Inicjował/a pomoc zanim o nią poproszę', lang: 'Akty służby' },
      { text: 'Był/a fizycznie blisko — głaskał/a, przytulał/a', lang: 'Dotyk fizyczny' },
    ],
  },
];

const LOVE_LANG_DESCS: Record<string, { desc: string; color: string; emoji: string }> = {
  'Słowa afirmacji': { desc: 'Czerpiesz siłę ze słów — komplemety, podziękowania i wyraźne "kocham Cię" są dla Ciebie fundamentem bezpieczeństwa w relacji.', color: ROSE, emoji: '💬' },
  'Czas jakości': { desc: 'Twoja miłość karmi się obecnością — nie chodzi o ilość czasu, lecz o jakość uwagi. Chcesz być naprawdę ważny/a, nie tylko "w pobliżu".', color: '#60A5FA', emoji: '⏰' },
  'Prezenty': { desc: 'Symbol i gest mówią Ci: "myślałem/am o Tobie". Nie chodzi o wartość materialną, lecz o to, że ktoś pamiętał i się postarał.', color: GOLD, emoji: '🎁' },
  'Akty służby': { desc: 'Miłość w działaniu — gdy ktoś odciąża Cię z obowiązków lub inicjuje pomoc, czujesz się naprawdę kochany/a.', color: '#34D399', emoji: '🤝' },
  'Dotyk fizyczny': { desc: 'Twoje ciało wie, że jest kochane, przez fizyczną bliskość — od trzymania za rękę po głębokie objęcie. Dotyk to Twój język bezpieczeństwa.', color: ACCENT, emoji: '🤗' },
};

const WEEKLY_ENERGY = [
  { day: 'Pon', energy: 'Rozmowa', color: '#60A5FA', hint: 'Dobry czas na trudną, ale ważną rozmowę.' },
  { day: 'Wt', energy: 'Czułość', color: ROSE, hint: 'Drobne gesty mają dziś ogromną moc.' },
  { day: 'Śr', energy: 'Przestrzeń', color: LAVENDER, hint: 'Daj sobie i partnerowi chwilę oddechu.' },
  { day: 'Czw', energy: 'Decyzja', color: GOLD, hint: 'Odpowiedni moment na podjęcie wspólnej decyzji.' },
  { day: 'Pt', energy: 'Radość', color: '#34D399', hint: 'Szukajcie razem czegoś, co Was śmieszy lub zachwyca.' },
  { day: 'Sob', energy: 'Głębia', color: '#8B5CF6', hint: 'Czas na prawdziwą bliskość bez pośpiechu.' },
  { day: 'Nd', energy: 'Odnowa', color: ACCENT, hint: 'Zacznijcie nowy tydzień z wspólną intencją.' },
];

const RELATIONSHIP_TIPS = [
  { title: 'Słuchaj z sercem', icon: Heart, color: ROSE, tip: 'Kiedy partner mówi, odłóż telefon i wejdź w jego świat bez przygotowywania odpowiedzi.' },
  { title: 'Pytaj zamiast zakładać', icon: MessageCircle, color: '#60A5FA', tip: 'Każde "Co miałeś/miałaś na myśli?" buduje więcej bliskości niż tysiąc domysłów.' },
  { title: 'Pielęgnuj rytuały', icon: Sparkles, color: GOLD, tip: 'Małe, powtarzalne rytuały — poranną kawę razem, wieczorny spacer — są klejnotem trwałości.' },
  { title: 'Daj przestrzeń', icon: Sun, color: '#34D399', tip: 'Każde z Was potrzebuje bycia sobą poza relacją. Autonomia wzmacnia, nie osłabia więzi.' },
  { title: 'Wyrażaj wdzięczność', icon: Star, color: LAVENDER, tip: 'Powiedz głośno, za co jesteś wdzięczny/a. Wdzięczność jest nawozem dla miłości.' },
  { title: 'Wybaczaj świadomie', icon: Shield, color: ACCENT, tip: 'Wybaczenie to nie zapomnienie — to decyzja, by nie nosić tego ciężaru dłużej niż musisz.' },
];

const DAILY_AFFIRMATIONS_COUPLE = [
  'Nasza miłość rośnie każdego dnia, gdy wybieramy siebie nawzajem.',
  'Między nami płynie energia wzajemnego szacunku i głębokiej czułości.',
  'Jesteśmy dla siebie bezpieczną przystanią w każdej burzy.',
  'Nasza relacja jest żywą, oddychającą istotą, którą razem pielęgnujemy.',
  'Widzimy się nawzajem — naprawdę, głęboko, bez maski.',
  'Nasze różnice są siłą, nie słabością naszego związku.',
  'Wybieramy komunikację zamiast milczenia, bliskość zamiast muru.',
  'Razem tworzymy przestrzeń, w której każde z nas może być sobą.',
  'Nasza miłość jest mądrością zebraną przez obie dusze razem.',
  'Ufamy procesowi naszej relacji — każdy etap przynosi swój dar.',
  'Jesteśmy wdzięczni za siebie nawzajem każdego ranka.',
  'Nasze serca rozmawiają nawet wtedy, gdy milczymy.',
  'Ta relacja jest jednym z najpiękniejszych darów naszego życia.',
  'Wybieram widzieć w moim partnerze to, co najlepsze.',
  'Razem jesteśmy większym "my" niż suma dwóch "ja".',
  'Budujemy miłość, która przetrwa — codziennie, krok po kroku.',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const TabBar = ({ active, onChange, isLight }: { active: number; onChange: (i: number) => void; isLight: boolean }) => {
  const TABS = [
    { label: 'Odczyt', icon: Wand2 },
    { label: 'Profil', icon: Users },
    { label: 'Historia', icon: History },
    { label: 'Mądrość', icon: Sparkles },
  ];
  return (
    <View style={[tabBarStyles.wrap, { backgroundColor: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(20,8,24,0.92)', borderColor: isLight ? 'rgba(139,100,42,0.32)' : 'rgba(255,255,255,0.08)' }]}>
      {TABS.map((tab, i) => {
        const Icon = tab.icon;
        const isActive = active === i;
        return (
          <Pressable key={tab.label} style={tabBarStyles.item} onPress={() => { onChange(i); HapticsService.selection(); }}>
            <Icon size={18} color={isActive ? ACCENT : (isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.40)')} />
            <Typography variant="microLabel" style={{ color: isActive ? ACCENT : (isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.40)'), fontSize: 10, marginTop: 2, fontWeight: isActive ? '700' : '400' }}>
              {tab.label}
            </Typography>
            {isActive && (
              <View style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, backgroundColor: ACCENT, borderRadius: 1 }} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const tabBarStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderBottomWidth: 1, paddingBottom: 2 },
  item: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2, position: 'relative' },
});

// ─── Relationship Orb 3D Widget ───────────────────────────────────────────────
const RelationshipOrb3D = ({ isLight }: { isLight: boolean }) => {
  const rot1   = useSharedValue(0);
  const rot2   = useSharedValue(0);
  const pulse  = useSharedValue(1);
  const tiltX  = useSharedValue(0);
  const tiltY  = useSharedValue(0);
  const glow   = useSharedValue(0.5);

  useEffect(() => {
    rot1.value  = withRepeat(withTiming(360, { duration: 12000 }), -1, false);
    rot2.value  = withRepeat(withTiming(-360, { duration: 18000 }), -1, false);
    pulse.value = withRepeat(withSequence(withTiming(1.07, { duration: 2400 }), withTiming(0.95, { duration: 2400 })), -1, false);
    glow.value  = withRepeat(withSequence(withTiming(1, { duration: 3000 }), withTiming(0.3, { duration: 3000 })), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-22, Math.min(22, e.translationY * 0.14));
      tiltY.value = Math.max(-22, Math.min(22, e.translationX * 0.14));
    })
    .onEnd(() => {
      tiltX.value = withSpring(0, { damping: 12 });
      tiltY.value = withSpring(0, { damping: 12 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));
  const orbit1Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot1.value}deg` }] }));
  const orbit2Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot2.value}deg` }] }));
  const pulseStyle  = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const glowStyle   = useAnimatedStyle(() => ({ opacity: glow.value }));

  const sz = 180;
  const cx = sz / 2;

  return (
    <View style={{ height: sz, alignItems: 'center', justifyContent: 'center', marginVertical: 8 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: sz, height: sz }, outerStyle]}>

          {/* Glow halo */}
          <Animated.View style={[StyleSheet.absoluteFill, glowStyle, { alignItems: 'center', justifyContent: 'center' }]}>
            <Svg width={sz} height={sz}>
              <Defs>
                <SvgRadialGradient id="orbHalo" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%"   stopColor={ROSE}   stopOpacity="0.28" />
                  <Stop offset="45%"  stopColor={ACCENT} stopOpacity="0.12" />
                  <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
                </SvgRadialGradient>
              </Defs>
              <Circle cx={cx} cy={cx} r={80} fill="url(#orbHalo)" />
            </Svg>
          </Animated.View>

          {/* Pulsing core */}
          <Animated.View style={[StyleSheet.absoluteFill, pulseStyle, { alignItems: 'center', justifyContent: 'center' }]}>
            <Svg width={sz} height={sz}>
              <Defs>
                <SvgRadialGradient id="core" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%"   stopColor={ROSE}   stopOpacity="0.45" />
                  <Stop offset="60%"  stopColor={CRIMSON} stopOpacity="0.18" />
                  <Stop offset="100%" stopColor={CRIMSON} stopOpacity="0" />
                </SvgRadialGradient>
              </Defs>
              <Circle cx={cx} cy={cx} r={36} fill="url(#core)" />
              {/* Two overlapping hearts (circles) */}
              <Circle cx={cx - 10} cy={cx} r={12} fill={ROSE + '30'} stroke={ROSE + '80'} strokeWidth={1.2} />
              <Circle cx={cx + 10} cy={cx} r={12} fill={ROSE + '30'} stroke={ROSE + '80'} strokeWidth={1.2} />
              <Circle cx={cx} cy={cx} r={6} fill={ROSE} opacity={0.92} />
              {/* Specular */}
              <Circle cx={cx - 1.5} cy={cx - 1.5} r={2} fill="white" opacity={0.65} />
            </Svg>
          </Animated.View>

          {/* Orbit ring 1 — rose petals */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, orbit1Style]}>
            <Svg width={sz} height={sz}>
              <Ellipse cx={cx} cy={cx} rx={62} ry={24} fill="none" stroke={ROSE + '50'} strokeWidth={1.2} strokeDasharray="5 4" />
              {[0, 1, 2, 3, 4].map(i => {
                const a = (i / 5) * 2 * Math.PI;
                const px = cx + 62 * Math.cos(a);
                const py = cx + 24 * Math.sin(a);
                return <Circle key={i} cx={px} cy={py} r={i % 2 === 0 ? 5.5 : 3.5} fill={ROSE} opacity={i % 2 === 0 ? 0.9 : 0.55} />;
              })}
            </Svg>
          </Animated.View>

          {/* Orbit ring 2 — gold stars */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, orbit2Style]}>
            <Svg width={sz} height={sz}>
              <Ellipse cx={cx} cy={cx} rx={50} ry={50} fill="none" stroke={GOLD + '38'} strokeWidth={0.9} />
              {[0, 1, 2].map(i => {
                const a = (i / 3) * 2 * Math.PI;
                const px = cx + 50 * Math.cos(a);
                const py = cx + 50 * Math.sin(a);
                return <Circle key={i} cx={px} cy={py} r={3.5} fill={GOLD} opacity={0.72} />;
              })}
            </Svg>
          </Animated.View>

          {/* Outer ring decoration */}
          <Svg width={sz} height={sz} style={{ position: 'absolute' }}>
            <Circle cx={cx} cy={cx} r={76} fill="none" stroke={LAVENDER + '28'} strokeWidth={0.8} strokeDasharray="3 6" />
          </Svg>

        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ─── Flipping Card ────────────────────────────────────────────────────────────
const FlipCard = ({ entry, deck, index, onReveal }: { entry: any; deck: any; index: number; onReveal: (i: number) => void }) => {
  const flip = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180], Extrapolation.CLAMP)}deg` }],
    backfaceVisibility: 'hidden',
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${interpolate(flip.value, [0, 1], [180, 360], Extrapolation.CLAMP)}deg` }],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0, left: 0,
  }));

  const handlePress = () => {
    if (entry.revealed) return;
    flip.value = withSpring(1, { damping: 14, stiffness: 80 });
    onReveal(index);
    HapticsService.notify();
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 120).springify()} style={{ alignItems: 'center', marginBottom: 8 }}>
      {entry.position ? (
        <Typography variant="microLabel" style={{ color: LAVENDER, fontSize: 9, letterSpacing: 1.5, marginBottom: 6, textTransform: 'uppercase' }}>
          {entry.position}
        </Typography>
      ) : null}
      <Pressable onPress={handlePress} style={{ width: CARD_W, height: CARD_H }}>
        {/* Back face */}
        <Animated.View style={[{ width: CARD_W, height: CARD_H }, frontStyle]}>
          <LinearGradient
            colors={['#1A0A22', '#2E1040', '#1A0A22']}
            style={{ width: CARD_W, height: CARD_H, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ROSE + '44' }}
          >
            <Svg width={CARD_W * 0.7} height={CARD_H * 0.7}>
              <Defs>
                <SvgRadialGradient id={`bg${index}`} cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={ROSE} stopOpacity="0.22" />
                  <Stop offset="100%" stopColor={ROSE} stopOpacity="0" />
                </SvgRadialGradient>
              </Defs>
              <Circle cx="50%" cy="50%" r="45%" fill={`url(#bg${index})`} />
              <Path d="M50,20 C60,5 80,10 80,28 C80,46 50,60 50,60 C50,60 20,46 20,28 C20,10 40,5 50,20 Z" fill={ROSE + '66'} stroke={ROSE} strokeWidth="1" transform="translate(-10,10)" />
            </Svg>
            <Typography variant="microLabel" style={{ color: ROSE + 'AA', fontSize: 9, letterSpacing: 2, marginTop: 8 }}>DOTKNIJ ABY ODKRYĆ</Typography>
          </LinearGradient>
        </Animated.View>
        {/* Front face */}
        <Animated.View style={[{ width: CARD_W, height: CARD_H }, backStyle]}>
          {entry.revealed && entry.card ? (
            <TarotCardVisual deck={deck} card={entry.card} isReversed={entry.isReversed} size="medium" />
          ) : (
            <View style={{ width: CARD_W, height: CARD_H, borderRadius: 16, backgroundColor: '#200E2A' }} />
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

// ─── Score Bar ────────────────────────────────────────────────────────────────
const ScoreBar = ({ label, icon: Icon, color, score, isLight }: { label: string; icon: any; color: string; score: number; isLight: boolean }) => {
  const width = useSharedValue(0);
  useEffect(() => { width.value = withDelay(300, withTiming(score, { duration: 900 })); }, [score]);
  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
    backgroundColor: color,
    height: 6,
    borderRadius: 3,
  }));
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon size={14} color={color} />
          <Typography variant="body" style={{ color: isLight ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.75)', fontSize: 13 }}>{label}</Typography>
        </View>
        <Typography variant="microLabel" style={{ color, fontSize: 12, fontWeight: '700' }}>{score}%</Typography>
      </View>
      <View style={{ backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
        <Animated.View style={barStyle} />
      </View>
    </View>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionLabel = ({ text, color, isLight }: { text: string; color?: string; isLight: boolean }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 6 }}>
    <View style={{ flex: 1, height: 1, backgroundColor: color ? color + '30' : (isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)') }} />
    <Typography variant="microLabel" style={{ color: color || (isLight ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.45)'), fontSize: 10, letterSpacing: 2 }}>{text}</Typography>
    <View style={{ flex: 1, height: 1, backgroundColor: color ? color + '30' : (isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)') }} />
  </View>
);

// ─── Daily Couple Affirmation Banner ──────────────────────────────────────────
const AffirmationBanner = ({ isLight }: { isLight: boolean }) => {
  const idx = useMemo(() => {
    const d = new Date();
    return (d.getFullYear() * 31 + d.getMonth() * 7 + d.getDate()) % DAILY_AFFIRMATIONS_COUPLE.length;
  }, []);
  const textColor = isLight ? '#1A1A2E' : '#F0EBF4';
  return (
    <View style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 14, marginTop: 4 }}>
      <LinearGradient colors={isLight ? ['#F9EEF7', '#F5E8F2'] : [ROSE + '18', CRIMSON + '0A']}
        style={{ paddingVertical: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 18, borderColor: ROSE + '33' }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: ROSE + '22', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Typography style={{ fontSize: 18 }}>💞</Typography>
        </View>
        <Typography style={{ color: textColor, fontSize: 12.5, lineHeight: 20, flex: 1, fontStyle: 'italic' }}>
          {DAILY_AFFIRMATIONS_COUPLE[idx]}
        </Typography>
      </LinearGradient>
    </View>
  );
};

// ─── Couple Hero Banner ────────────────────────────────────────────────────────
const CoupleHero = ({
  myName, partnerName, myZodiac, partnerZodiac, compatNum, compatInfo, isLight,
}: {
  myName: string; partnerName: string;
  myZodiac: typeof ZODIAC_SIGNS[0] | null;
  partnerZodiac: typeof ZODIAC_SIGNS[0] | null;
  compatNum: number;
  compatInfo: { title: string; desc: string; color: string } | null;
  isLight: boolean;
}) => {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.15, { duration: 900 }), withTiming(0.9, { duration: 900 })), -1, false);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const textColor = isLight ? '#1A1A2E' : '#F0EBF4';
  const subC = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.50)';
  if (!myName && !partnerName) return null;
  return (
    <View style={{ borderRadius: 22, overflow: 'hidden', marginBottom: 16 }}>
      <LinearGradient
        colors={isLight ? ['#FDF0F5', '#F8E8EF', '#FDF0F5'] : [ROSE + '1A', ACCENT + '12', CRIMSON + '0A']}
        style={{ padding: 20, borderWidth: 1, borderRadius: 22, borderColor: ROSE + '33', alignItems: 'center' }}>
        {/* Name row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          {/* My side */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: ACCENT + '28', alignItems: 'center', justifyContent: 'center', marginBottom: 6, borderWidth: 1.5, borderColor: ACCENT + '55' }}>
              <Typography style={{ fontSize: 22 }}>{myZodiac?.symbol || '✦'}</Typography>
            </View>
            <Typography style={{ color: textColor, fontSize: 13, fontWeight: '700' }}>{myName || 'Ty'}</Typography>
            {myZodiac && <Typography style={{ color: subC, fontSize: 10 }}>{myZodiac.name}</Typography>}
          </View>
          {/* Heart center */}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Animated.View style={pulseStyle}>
              <Typography style={{ fontSize: 28 }}>💞</Typography>
            </Animated.View>
            {compatNum > 0 && (
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: (compatInfo?.color || ROSE) + '28', borderWidth: 1, borderColor: (compatInfo?.color || ROSE) + '55' }}>
                <Typography style={{ color: compatInfo?.color || ROSE, fontSize: 13, fontWeight: '800' }}>{compatNum}</Typography>
              </View>
            )}
          </View>
          {/* Partner side */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: ROSE + '28', alignItems: 'center', justifyContent: 'center', marginBottom: 6, borderWidth: 1.5, borderColor: ROSE + '55' }}>
              <Typography style={{ fontSize: 22 }}>{partnerZodiac?.symbol || '♥'}</Typography>
            </View>
            <Typography style={{ color: textColor, fontSize: 13, fontWeight: '700' }}>{partnerName || 'Partner'}</Typography>
            {partnerZodiac && <Typography style={{ color: subC, fontSize: 10 }}>{partnerZodiac.name}</Typography>}
          </View>
        </View>
        {/* Compat title */}
        {compatInfo && (
          <View style={{ paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, backgroundColor: compatInfo.color + '20', borderWidth: 1, borderColor: compatInfo.color + '40' }}>
            <Typography style={{ color: compatInfo.color, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>{compatInfo.title}</Typography>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

// ─── Premium Spread Card ───────────────────────────────────────────────────────
const SpreadCard = ({ spread, isActive, onPress, isLight }: { spread: typeof SPREAD_TYPES[0]; isActive: boolean; onPress: () => void; isLight: boolean }) => {
  const SpIcon = spread.icon;
  const textColor = isLight ? '#1A1A2E' : '#F0EBF4';
  const subC = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.50)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.07)';
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 10 }}>
      <LinearGradient
        colors={isActive ? [spread.color + '28', spread.color + '12'] : ['transparent', 'transparent']}
        style={{
          borderRadius: 18, borderWidth: isActive ? 1.5 : 1,
          borderColor: isActive ? spread.color + '66' : cardBorder,
          backgroundColor: isActive ? undefined : cardBg,
          paddingVertical: 14, paddingHorizontal: 16,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: spread.color + (isActive ? '30' : '18'), alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <SpIcon size={20} color={spread.color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Typography style={{ color: isActive ? spread.color : textColor, fontSize: 15, fontWeight: '700' }}>{spread.name}</Typography>
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: spread.color + '22' }}>
                <Typography style={{ color: spread.color, fontSize: 9, fontWeight: '700' }}>{spread.subtitle}</Typography>
              </View>
            </View>
            <Typography style={{ color: subC, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{spread.desc}</Typography>
          </View>
          <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: isActive ? spread.color + '88' : cardBorder, alignItems: 'center', justifyContent: 'center' }}>
            {isActive && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: spread.color }} />}
          </View>
        </View>
        {/* Positions row - only when active */}
        {isActive && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: spread.color + '22' }}>
            {spread.positions.map((pos, i) => (
              <View key={i} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: spread.color + '18', borderWidth: 1, borderColor: spread.color + '40' }}>
                <Typography style={{ color: spread.color, fontSize: 10 }}>{i + 1}. {pos}</Typography>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
};

// ─── Glass Card ───────────────────────────────────────────────────────────────
const GCard = ({ children, style, isLight, accentBorder }: { children: React.ReactNode; style?: any; isLight: boolean; accentBorder?: string }) => (
  <View style={[{
    backgroundColor: isLight ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: accentBorder ? accentBorder + '44' : (isLight ? 'rgba(122,95,54,0.14)' : 'rgba(255,255,255,0.07)'),
    borderRadius: 20,
    padding: 18,
  }, style]}>
    {children}
  </View>
);

// ─── Profile Card ─────────────────────────────────────────────────────────────
const ProfileCard = ({
  name, birthDate, isLight, accentColor, label, onEditBirth, onEditName,
}: {
  name: string; birthDate: string; isLight: boolean; accentColor: string;
  label: string; onEditBirth?: () => void; onEditName?: () => void;
}) => {
  const zodiac = getZodiacFromDate(birthDate);
  const lp = calcLifePath(birthDate);
  const moon = getMoonPhaseLabel(birthDate);
  const textColor = isLight ? '#1A1A2E' : '#F0EBF4';
  const subC = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';

  return (
    <GCard isLight={isLight} accentBorder={accentColor} style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: accentColor + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: accentColor + '55' }}>
          <Typography style={{ fontSize: 20 }}>{zodiac?.symbol || '✦'}</Typography>
        </View>
        <View style={{ flex: 1 }}>
          <Typography variant="microLabel" style={{ color: accentColor, fontSize: 9, letterSpacing: 1.5, marginBottom: 2 }}>{label}</Typography>
          <Typography variant="heading" style={{ color: textColor, fontSize: 16, fontWeight: '700' }}>{name || '—'}</Typography>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Pressable onPress={onEditBirth} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Typography style={{ color: subC, fontSize: 12 }}>Data urodzenia</Typography>
          <Typography style={{ color: textColor, fontSize: 12, fontWeight: '600' }}>
                            {birthDate ? formatLocaleDate(birthDate) : (i18n.language?.startsWith('en') ? 'Add' : 'Dodaj')}
          </Typography>
        </Pressable>
        {zodiac && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Typography style={{ color: subC, fontSize: 12 }}>Znak zodiaku</Typography>
            <Typography style={{ color: textColor, fontSize: 12, fontWeight: '600' }}>{zodiac.symbol} {zodiac.name} · {zodiac.element}</Typography>
          </View>
        )}
        {lp > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Typography style={{ color: subC, fontSize: 12 }}>Liczba ścieżki życia</Typography>
            <Typography style={{ color: accentColor, fontSize: 13, fontWeight: '700' }}>{lp}</Typography>
          </View>
        )}
        {birthDate && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Typography style={{ color: subC, fontSize: 12 }}>Księżyc urodzenia</Typography>
            <Typography style={{ color: textColor, fontSize: 12 }}>{moon}</Typography>
          </View>
        )}
      </View>
    </GCard>
  );
};

// ─── Reading History Entry ────────────────────────────────────────────────────
const HistoryEntry = ({ entry, isLight, onDelete }: { entry: any; isLight: boolean; onDelete: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  const textColor = isLight ? '#1A1A2E' : '#F0EBF4';
  const subC = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';
  const spread = SPREAD_TYPES.find(s => s.id === entry.spreadId) || SPREAD_TYPES[0];
  const SpreadIcon = spread.icon;

  return (
    <GCard isLight={isLight} style={{ marginBottom: 12 }}>
      <Pressable onPress={() => setExpanded(e => !e)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: spread.color + '20', alignItems: 'center', justifyContent: 'center' }}>
            <SpreadIcon size={16} color={spread.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Typography style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>{spread.name}</Typography>
            <Typography style={{ color: subC, fontSize: 11 }}>{entry.partnerName} · {entry.dateLabel}</Typography>
          </View>
          {expanded ? <ChevronUp size={16} color={subC} /> : <ChevronDown size={16} color={subC} />}
        </View>
        {/* Key cards preview */}
        {entry.cards?.slice(0, 3).length > 0 && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            {entry.cards.slice(0, 3).map((c: any, i: number) => (
              <View key={i} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: spread.color + '18', borderRadius: 8, borderWidth: 1, borderColor: spread.color + '40' }}>
                <Typography style={{ color: spread.color, fontSize: 10, fontWeight: '600' }}>{c.name || '—'}</Typography>
              </View>
            ))}
          </View>
        )}
      </Pressable>
      {expanded && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.06)' }}>
          {entry.summary ? (
            <Typography style={{ color: subC, fontSize: 13, lineHeight: 20 }}>{entry.summary}</Typography>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
            <Pressable onPress={onDelete} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#EF444418' }}>
              <Typography style={{ color: '#EF4444', fontSize: 12 }}>Usuń</Typography>
            </Pressable>
          </View>
        </View>
      )}
    </GCard>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const PartnerTarotScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState(0);

  // ── Partner data ──
  const [partnerName, setPartnerName]           = useState('');
  const [partnerBirth, setPartnerBirth]         = useState('');
  const [myBirthDate, setMyBirthDate]           = useState(userData?.birthDate || '');
  const [showPartnerPicker, setShowPartnerPicker] = useState(false);
  const [showMyPicker, setShowMyPicker]         = useState(false);
  const [editingPartnerName, setEditingPartnerName] = useState(false);
  const [partnerNameDraft, setPartnerNameDraft] = useState('');
  const [relPhase, setRelPhase]                 = useState('Budowanie');

  // ── Spread state ──
  const [selectedSpreadId, setSelectedSpreadId] = useState('zwiazek');
  const [drawnCards, setDrawnCards]             = useState<any[]>([]);
  const [readingStarted, setReadingStarted]     = useState(false);
  const [question, setQuestion]                 = useState('');
  const [perspective, setPerspective]           = useState<'me' | 'partner'>('me');

  // ── AI state ──
  const [aiLoading, setAiLoading]               = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [aiSummary, setAiSummary]               = useState('');
  const [summaryLoading, setSummaryLoading]     = useState(false);

  // ── History ──
  const [readings, setReadings]                 = useState<any[]>([]);
  const [patternAnalysis, setPatternAnalysis]   = useState('');
  const [patternLoading, setPatternLoading]     = useState(false);

  // ── Wisdom tab ──
  const [expandedQ, setExpandedQ]               = useState<number | null>(null);
  const [qAiResp, setQAiResp]                   = useState<Record<number, string>>({});
  const [qLoading, setQLoading]                 = useState<number | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers]           = useState<string[]>([]);
  const [loveLanguage, setLoveLanguage]         = useState<string | null>(null);
  const [dailyCardDrawn, setDailyCardDrawn]     = useState<any | null>(null);

  // ── Synastry scores ──
  const synastryScores = useMemo(() => {
    if (!myBirthDate || !partnerBirth) {
      return { Komunikacja: 0, Wartości: 0, Namiętność: 0, Wzrost: 0, Zaufanie: 0, Radość: 0 };
    }
    const lp1 = calcLifePath(myBirthDate);
    const lp2 = calcLifePath(partnerBirth);
    const seed = (lp1 * 13 + lp2 * 7) % 100;
    return {
      Komunikacja: 55 + ((lp1 + lp2 * 3) % 45),
      Wartości:    50 + ((lp1 * 2 + lp2) % 48),
      Namiętność:  60 + ((lp1 + lp2 + seed) % 38),
      Wzrost:      52 + ((lp2 * 4) % 42),
      Zaufanie:    58 + ((lp1 * lp2) % 40),
      Radość:      56 + ((seed + lp1) % 42),
    };
  }, [myBirthDate, partnerBirth]);

  const compatNum = useMemo(() => calcCompatNumber(myBirthDate, partnerBirth), [myBirthDate, partnerBirth]);
  const compatInfo = compatNum > 0 ? (COMPAT_MEANINGS[compatNum] || COMPAT_MEANINGS[9]) : null;
  const selectedSpread = useMemo(() => SPREAD_TYPES.find(s => s.id === selectedSpreadId) || SPREAD_TYPES[0], [selectedSpreadId]);
  const activePhase = useMemo(() => RELATIONSHIP_PHASES.find(p => p.id === relPhase) || RELATIONSHIP_PHASES[1], [relPhase]);
  const myName = userData?.name?.trim() || 'Ty';
  const partnerDisplay = partnerName.trim() || 'Partner/ka';
  const isFav = isFavoriteItem('partner_tarot');

  const deck = useMemo(() => getTarotDeckById('golden_sanctuary'), []);

  // Daily affirmation
  const dailyAff = useMemo(() => {
    const idx = new Date().getDate() % DAILY_AFFIRMATIONS_COUPLE.length;
    return DAILY_AFFIRMATIONS_COUPLE[idx];
  }, []);

  // Daily card for couple
  const drawDailyCard = () => {
    const idx = new Date().getDate() % ALL_CARDS.length;
    setDailyCardDrawn(ALL_CARDS[idx]);
    HapticsService.notify();
  };

  // ── Handlers ──

  const handleStartReading = () => {
    if (!partnerName.trim()) {
      Alert.alert('Uzupełnij profil', 'Podaj imię swojego partnera/ki, aby rozpocząć odczyt.');
      return;
    }
    const cards = drawRandomCards(selectedSpread.cardCount);
    const withPositions = cards.map((c, i) => ({ ...c, position: selectedSpread.positions[i] || '' }));
    setDrawnCards(withPositions);
    setReadingStarted(true);
    setAiInterpretation('');
    setAiSummary('');
    HapticsService.notify();
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 200);
  };

  const handleRevealCard = (index: number) => {
    setDrawnCards(prev => prev.map((c, i) => i === index ? { ...c, revealed: true } : c));
  };

  const revealAll = () => {
    setDrawnCards(prev => prev.map(c => ({ ...c, revealed: true })));
    HapticsService.notify();
  };

  const handleAiInterpretation = async () => {
    const revealedCards = drawnCards.filter(c => c.revealed);
    if (revealedCards.length === 0 || aiLoading) return;
    setAiLoading(true);
    setAiInterpretation('');
    try {
      const cardList = revealedCards.map((c, i) =>
        `${selectedSpread.positions[i] || 'Karta ' + (i + 1)}: ${c.card?.name || c.card?.id}${c.isReversed ? ' (odwrócona)' : ''}`
      ).join('\n');
      const promptText = `Jesteś mistycznym tarot-coachem relacyjnym. Wykonaj głęboki odczyt kart dla pary w języku użytkownika.

Para: ${myName} i ${partnerDisplay}.
Rozkład: ${selectedSpread.name} (${selectedSpread.cardCount} kart).
Faza relacji: ${relPhase}.
${question.trim() ? 'Pytanie pary: ' + question.trim() : ''}
Perspektywa: ${perspective === 'me' ? myName : partnerDisplay}.

Karty:
${cardList}

Wykonaj interpretację każdej karty w kontekście relacyjnym — co ona mówi o dynamice między nimi, o nieświadomych wzorcach, o potencjale. Bądź ciepły, głęboki i konkretny. Każdą kartę opisz 2–3 zdaniami. Na końcu dodaj krótki PRZESŁANIE DLA PARY (2 zdania).`;

      const messages = [{ role: 'user' as const, content: promptText }];
      const result = await AiService.chatWithOracle(messages);
      setAiInterpretation(result);
    } catch (e) {
      setAiInterpretation('Nie udało się uzyskać interpretacji. Spróbuj ponownie.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSummary = async () => {
    if (summaryLoading) return;
    setSummaryLoading(true);
    setAiSummary('');
    try {
      const prompt = i18n.language?.startsWith('en') ? `As a relationship oracle, write a deep energetic synthesis for the couple ${myName} and ${partnerDisplay}.
Relationship phase: ${relPhase}.
${myBirthDate ? 'Birth date ' + myName + ': ' + formatLocaleDate(myBirthDate) + '.' : ''}
${partnerBirth ? 'Birth date ' + partnerDisplay + ': ' + formatLocaleDate(partnerBirth) + '.' : ''}
${compatNum > 0 ? 'Compatibility number: ' + compatNum + '.' : ''}

Write 3-4 sentences: what this pair brings into each other’s life, what their mission is as a bond, and one concrete message for now. Be poetic, warm and precise.` : `Jako oracle relacyjny napisz w języku użytkownika głęboką syntezę energetyczną dla pary: ${myName} i ${partnerDisplay}.
Faza relacji: ${relPhase}.
${myBirthDate ? (i18n.language?.startsWith('en') ? 'Birth date ' : 'Data urodzenia ') + myName + ': ' + formatLocaleDate(myBirthDate) + '.' : ''}
${partnerBirth ? (i18n.language?.startsWith('en') ? 'Birth date ' : 'Data urodzenia ') + partnerDisplay + ': ' + formatLocaleDate(partnerBirth) + '.' : ''}
${compatNum > 0 ? 'Liczba kompatybilności: ' + compatNum + '.' : ''}

Napisz 3–4 zdania: co ta para wnosi do siebie nawzajem, jaka jest ich misja jako związek i jedno konkretne przesłanie na teraz. Bądź poetycki, ciepły i precyzyjny.`;
      const messages = [{ role: 'user' as const, content: prompt }];
      const result = await AiService.chatWithOracle(messages, i18n.language?.startsWith('en') ? 'en' : 'pl');
      setAiSummary(result);
    } catch {
      setAiSummary('Nie udało się wygenerować syntezy.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const saveReading = () => {
    if (drawnCards.length === 0) return;
    const entry = {
      id: Date.now().toString(),
      spreadId: selectedSpreadId,
      partnerName: partnerDisplay,
        dateLabel: formatLocaleDate(new Date()),
      cards: drawnCards.filter(c => c.revealed).map(c => ({ name: c.card?.id || '—' })),
      summary: aiInterpretation.slice(0, 200) || '',
    };
    setReadings(prev => [entry, ...prev]);
    HapticsService.notify();
    Alert.alert('Zapisano', 'Odczyt został zapisany w historii.');
  };

  const deleteReading = (id: string) => {
    setReadings(prev => prev.filter(r => r.id !== id));
  };

  const resetReading = () => {
    setReadingStarted(false);
    setDrawnCards([]);
    setAiInterpretation('');
    setAiSummary('');
  };

  const handlePatternAnalysis = async () => {
    if (readings.length === 0 || patternLoading) return;
    setPatternLoading(true);
    setPatternAnalysis('');
    try {
      const summary = readings.slice(0, 5).map(r =>
        `${r.dateLabel}: rozkład ${r.spreadId}, karty: ${r.cards.map((c: any) => c.name).join(', ')}`
      ).join('\n');
      const prompt = `Przeanalizuj wzorzec z odczytów tarota dla pary ${myName} i ${partnerDisplay}:\n${summary}\n\nCo te odczyty mówią o dominujących wzorcach w tej relacji? Odpowiedz w 3–4 zdaniach w języku użytkownika.`;
      const messages = [{ role: 'user' as const, content: prompt }];
      const result = await AiService.chatWithOracle(messages);
      setPatternAnalysis(result);
    } catch {
      setPatternAnalysis('Nie udało się wygenerować analizy.');
    } finally {
      setPatternLoading(false);
    }
  };

  const handleDeepQuestion = async (idx: number) => {
    if (qAiResp[idx] || qLoading === idx) return;
    setQLoading(idx);
    try {
      const q = DEEP_QUESTIONS[idx];
      const prompt = `Jesteś duchowym przewodnikiem relacyjnym. Odpowiedz głęboko i metaforycznie na pytanie refleksyjne:

Pytanie: "${q.q}"
Para: ${myName} i ${partnerDisplay}.
${relPhase ? 'Faza relacji: ' + relPhase + '.' : ''}

Daj odpowiedź w 3–4 zdaniach w języku użytkownika — nie dawaj gotowej odpowiedzi, lecz zaproszenie do głębszego myślenia. Bądź ciepły, subtelny, poetycki.`;
      const messages = [{ role: 'user' as const, content: prompt }];
      const result = await AiService.chatWithOracle(messages);
      setQAiResp(prev => ({ ...prev, [idx]: result }));
    } catch {
      setQAiResp(prev => ({ ...prev, [idx]: 'Spróbuj ponownie.' }));
    } finally {
      setQLoading(null);
    }
  };

  const handleQuizAnswer = (lang: string) => {
    const next = [...quizAnswers, lang];
    setQuizAnswers(next);
    if (next.length === LOVE_LANGUAGE_QUIZ.length) {
      // Count most frequent
      const counts: Record<string, number> = {};
      next.forEach(l => { counts[l] = (counts[l] || 0) + 1; });
      const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      setLoveLanguage(winner);
      HapticsService.notify();
    }
  };

  const handleFavorite = () => {
    HapticsService.notify();
    if (isFav) {
      removeFavoriteItem('partner_tarot');
    } else {
      addFavoriteItem({ id: 'partner_tarot', label: 'Tarot dla Par', sublabel: 'Relacyjny odczyt', route: 'PartnerTarot', icon: 'HeartHandshake', color: ACCENT, addedAt: Date.now() });
    }
  };

  // ── Theme vars ──
  const textColor = isLight ? '#1A1A2E' : '#F0EBF4';
  const subColor  = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';
  const cardBg    = isLight ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.055)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.07)';

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB: Odczyt
  // ─────────────────────────────────────────────────────────────────────────────
  const renderReadingTab = () => (
    <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: 20 }}>

      {/* Daily Affirmation */}
      <Animated.View entering={FadeInDown.delay(20).springify()}>
        <AffirmationBanner isLight={isLight} />
      </Animated.View>

      {/* Hero Orb */}
      <Animated.View entering={FadeInDown.delay(50).springify()}>
        <RelationshipOrb3D isLight={isLight} />
      </Animated.View>

      {/* Couple Hero */}
      {(partnerName || myBirthDate) && (
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <CoupleHero
            myName={myName}
            partnerName={partnerDisplay}
            myZodiac={getZodiacFromDate(myBirthDate)}
            partnerZodiac={getZodiacFromDate(partnerBirth)}
            compatNum={compatNum}
            compatInfo={compatInfo}
            isLight={isLight}
          />
        </Animated.View>
      )}

      {/* Partner Setup */}
      {!readingStarted && (
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <SectionLabel text="KONFIGURACJA" isLight={isLight} color={ACCENT} />
          <GCard isLight={isLight} accentBorder={ACCENT} style={{ marginBottom: 16 }}>
            <Typography variant="microLabel" style={{ color: ACCENT, fontSize: 9, letterSpacing: 1.5, marginBottom: 10 }}>IMIĘ PARTNERA / PARTNERKI</Typography>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TextInput
                value={partnerName}
                onChangeText={setPartnerName}
                placeholder="Wpisz imię..."
                placeholderTextColor={subColor}
                style={{ flex: 1, color: textColor, fontSize: 16, fontWeight: '600', paddingVertical: 4 }}
              />
              <Heart size={18} color={partnerName ? ROSE : subColor} />
            </View>
            <View style={{ height: 1, backgroundColor: cardBorder, marginTop: 10 }} />
            <Pressable onPress={() => setShowPartnerPicker(true)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Calendar size={15} color={LAVENDER} />
                <Typography style={{ color: subColor, fontSize: 13 }}>Data urodzenia partnera</Typography>
              </View>
              <Typography style={{ color: partnerBirth ? textColor : LAVENDER, fontSize: 13, fontWeight: '600' }}>
                        {partnerBirth ? formatLocaleDate(partnerBirth) : (i18n.language?.startsWith('en') ? 'Choose' : 'Wybierz')}
              </Typography>
            </Pressable>
            {!myBirthDate && (
              <>
                <View style={{ height: 1, backgroundColor: cardBorder, marginTop: 10 }} />
                <Pressable onPress={() => setShowMyPicker(true)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Calendar size={15} color={ACCENT} />
                    <Typography style={{ color: subColor, fontSize: 13 }}>Moja data urodzenia</Typography>
                  </View>
                  <Typography style={{ color: myBirthDate ? textColor : ACCENT, fontSize: 13, fontWeight: '600' }}>
                        {myBirthDate ? formatLocaleDate(myBirthDate) : (i18n.language?.startsWith('en') ? 'Choose' : 'Wybierz')}
                  </Typography>
                </Pressable>
              </>
            )}
          </GCard>

          {/* Perspective toggle */}
          <SectionLabel text="PERSPEKTYWA" isLight={isLight} color={LAVENDER} />
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {(['me', 'partner'] as const).map(p => (
              <Pressable key={p} onPress={() => setPerspective(p)} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: perspective === p ? ACCENT + '22' : cardBg, borderWidth: 1, borderColor: perspective === p ? ACCENT + '66' : cardBorder }}>
                <Typography style={{ color: perspective === p ? ACCENT : subColor, fontSize: 13, fontWeight: perspective === p ? '700' : '400' }}>
                  {p === 'me' ? `✦ ${myName}` : `♥ ${partnerDisplay}`}
                </Typography>
              </Pressable>
            ))}
          </View>

          {/* Spread selector */}
          <SectionLabel text="RODZAJ ROZKŁADU" isLight={isLight} color={GOLD} />
          <View style={{ marginBottom: 16 }}>
            {SPREAD_TYPES.map(sp => (
              <SpreadCard
                key={sp.id}
                spread={sp}
                isActive={sp.id === selectedSpreadId}
                onPress={() => { setSelectedSpreadId(sp.id); HapticsService.selection(); }}
                isLight={isLight}
              />
            ))}
          </View>

          {/* Relationship phase */}
          <SectionLabel text="FAZA RELACJI" isLight={isLight} color={ROSE} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
            {RELATIONSHIP_PHASES.map(ph => (
              <Pressable key={ph.id} onPress={() => { setRelPhase(ph.id); HapticsService.selection(); }}
                style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: relPhase === ph.id ? ph.color + '20' : cardBg, borderWidth: 1, borderColor: relPhase === ph.id ? ph.color + '55' : cardBorder, minWidth: 90 }}>
                <Typography style={{ fontSize: 16 }}>{ph.emoji}</Typography>
                <Typography style={{ color: relPhase === ph.id ? ph.color : subColor, fontSize: 11, fontWeight: relPhase === ph.id ? '700' : '400', marginTop: 3 }}>{ph.id}</Typography>
              </Pressable>
            ))}
          </ScrollView>

          {/* Question input */}
          <SectionLabel text="PYTANIE (OPCJONALNIE)" isLight={isLight} />
          <GCard isLight={isLight} style={{ marginBottom: 20 }}>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="Co chcesz wiedzieć o tej relacji?"
              placeholderTextColor={subColor}
              multiline
              style={{ color: textColor, fontSize: 14, lineHeight: 22, minHeight: 64 }}
            />
          </GCard>

          {/* Start button */}
          <Pressable onPress={handleStartReading}
            style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 8 }}>
            <LinearGradient colors={[CRIMSON, ACCENT, ROSE + 'CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
              <Wand2 size={20} color="white" />
              <Typography style={{ color: 'white', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }}>Rozpocznij Odczyt</Typography>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {/* Active Reading */}
      {readingStarted && (
        <Animated.View entering={FadeInDown.springify()}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Typography style={{ color: ACCENT, fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>{selectedSpread.name.toUpperCase()}</Typography>
              <Typography style={{ color: textColor, fontSize: 18, fontWeight: '700' }}>{myName} & {partnerDisplay}</Typography>
            </View>
            <Pressable onPress={resetReading} style={{ padding: 8, borderRadius: 10, backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}>
              <RefreshCw size={16} color={subColor} />
            </Pressable>
          </View>

          {/* Phase badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: activePhase.color + '15', borderWidth: 1, borderColor: activePhase.color + '40', alignSelf: 'flex-start' }}>
            <Typography style={{ fontSize: 15 }}>{activePhase.emoji}</Typography>
            <Typography style={{ color: activePhase.color, fontSize: 12, fontWeight: '600' }}>{activePhase.id}</Typography>
          </View>

          {/* Cards grid */}
          <SectionLabel text="KARTY ROZKŁADU" isLight={isLight} color={ROSE} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginBottom: 20 }}>
            {drawnCards.map((entry, i) => (
              <FlipCard key={i} entry={entry} deck={deck} index={i} onReveal={handleRevealCard} />
            ))}
          </View>

          {/* Reveal all */}
          {drawnCards.some(c => !c.revealed) && (
            <Pressable onPress={revealAll} style={{ paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: ROSE + '18', borderWidth: 1, borderColor: ROSE + '44', marginBottom: 16 }}>
              <Typography style={{ color: ROSE, fontSize: 14, fontWeight: '600' }}>Odkryj wszystkie karty</Typography>
            </Pressable>
          )}

          {/* AI Interpretation */}
          {drawnCards.some(c => c.revealed) && (
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <SectionLabel text="INTERPRETACJA AI" isLight={isLight} color={LAVENDER} />
              <Pressable onPress={handleAiInterpretation} disabled={aiLoading}
                style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
                <LinearGradient colors={[LAVENDER + '33', ACCENT + '22']} style={{ paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: LAVENDER + '44', borderRadius: 16 }}>
                  <Sparkles size={18} color={LAVENDER} />
                  <Typography style={{ color: textColor, fontSize: 14, fontWeight: '600', flex: 1 }}>
                    {aiLoading ? 'Oracle czyta karty...' : 'Uzyskaj interpretację Oracle'}
                  </Typography>
                  {!aiLoading && <ArrowRight size={16} color={LAVENDER} />}
                </LinearGradient>
              </Pressable>

              {aiInterpretation.length > 0 && (
                <Animated.View entering={FadeInDown.springify()}>
                  <GCard isLight={isLight} accentBorder={LAVENDER} style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Sparkles size={15} color={LAVENDER} />
                      <Typography variant="microLabel" style={{ color: LAVENDER, fontSize: 10, letterSpacing: 1.5 }}>ORACLE MÓWI</Typography>
                    </View>
                    <Typography style={{ color: isLight ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 24 }}>
                      {aiInterpretation}
                    </Typography>
                  </GCard>
                </Animated.View>
              )}

              {/* Save button */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                <Pressable onPress={saveReading} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: GOLD + '18', borderWidth: 1, borderColor: GOLD + '44' }}>
                  <Save size={15} color={GOLD} />
                  <Typography style={{ color: GOLD, fontSize: 13, fontWeight: '600' }}>Zapisz odczyt</Typography>
                </Pressable>
                <Pressable onPress={resetReading} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: ACCENT + '18', borderWidth: 1, borderColor: ACCENT + '44' }}>
                  <RefreshCw size={15} color={ACCENT} />
                  <Typography style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>Nowy odczyt</Typography>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      )}

      <EndOfContentSpacer />
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB: Profile
  // ─────────────────────────────────────────────────────────────────────────────
  const renderProfileTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: 20 }}>
      <Animated.View entering={FadeInDown.delay(50).springify()} style={{ height: 12 }} />

      {/* Profile cards */}
      <SectionLabel text="PROFILE PARY" isLight={isLight} color={ACCENT} />
      <ProfileCard
        name={myName}
        birthDate={myBirthDate}
        isLight={isLight}
        accentColor={ACCENT}
        label="MOJE DANE"
        onEditBirth={() => setShowMyPicker(true)}
      />
      <ProfileCard
        name={partnerDisplay}
        birthDate={partnerBirth}
        isLight={isLight}
        accentColor={ROSE}
        label="PROFIL PARTNERA"
        onEditBirth={() => setShowPartnerPicker(true)}
      />

      {/* Compatibility summary */}
      {compatNum > 0 && compatInfo && (
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <SectionLabel text="KOMPATYBILNOŚĆ NUMEROLOGICZNA" isLight={isLight} color={GOLD} />
          <LinearGradient colors={[compatInfo.color + '20', compatInfo.color + '08']} style={{ borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: compatInfo.color + '44' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: compatInfo.color + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: compatInfo.color + '60' }}>
                <Typography style={{ color: compatInfo.color, fontSize: 24, fontWeight: '800' }}>{compatNum}</Typography>
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="microLabel" style={{ color: compatInfo.color, fontSize: 10, letterSpacing: 1.5 }}>LICZBA KOMPATYBILNOŚCI</Typography>
                <Typography style={{ color: textColor, fontSize: 18, fontWeight: '700' }}>{compatInfo.title}</Typography>
              </View>
            </View>
            <Typography style={{ color: isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 22 }}>
              {compatInfo.desc}
            </Typography>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Synastry scores */}
      {myBirthDate && partnerBirth ? (
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <SectionLabel text="SYNASTRIA — 6 OBSZARÓW" isLight={isLight} color={LAVENDER} />
          <GCard isLight={isLight} accentBorder={LAVENDER} style={{ marginBottom: 16 }}>
            {SYNASTRY_AREAS.map((area, i) => (
              <ScoreBar
                key={area.key}
                label={area.key}
                icon={area.icon}
                color={area.color}
                score={synastryScores[area.key as keyof typeof synastryScores] || 72}
                isLight={isLight}
              />
            ))}
          </GCard>
        </Animated.View>
      ) : (
        <GCard isLight={isLight} style={{ marginBottom: 16, alignItems: 'center', padding: 24 }}>
          <Layers size={28} color={subColor} />
          <Typography style={{ color: subColor, fontSize: 13, marginTop: 10, textAlign: 'center' }}>
            Podaj daty urodzenia obojga, aby zobaczyć synastrię
          </Typography>
        </GCard>
      )}

      {/* Relationship phase */}
      <SectionLabel text="FAZA RELACJI" isLight={isLight} color={ROSE} />
      <GCard isLight={isLight} accentBorder={activePhase.color} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
          <Typography style={{ fontSize: 32 }}>{activePhase.emoji}</Typography>
          <View style={{ flex: 1 }}>
            <Typography style={{ color: activePhase.color, fontSize: 16, fontWeight: '700' }}>{activePhase.id}</Typography>
            <Typography style={{ color: isLight ? 'rgba(0,0,0,0.70)' : 'rgba(255,255,255,0.70)', fontSize: 13, lineHeight: 20, marginTop: 4 }}>
              {activePhase.desc}
            </Typography>
          </View>
        </View>
        <View style={{ paddingVertical: 10, paddingHorizontal: 14, backgroundColor: activePhase.color + '15', borderRadius: 12, borderWidth: 1, borderColor: activePhase.color + '30' }}>
          <Typography style={{ color: activePhase.color, fontSize: 12, lineHeight: 18, fontStyle: 'italic' }}>
            ✦ {activePhase.hint}
          </Typography>
        </View>
        {/* Phase selector */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {RELATIONSHIP_PHASES.map(ph => (
            <Pressable key={ph.id} onPress={() => { setRelPhase(ph.id); HapticsService.selection(); }}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: relPhase === ph.id ? ph.color + '22' : cardBg, borderWidth: 1, borderColor: relPhase === ph.id ? ph.color + '55' : cardBorder }}>
              <Typography style={{ color: relPhase === ph.id ? ph.color : subColor, fontSize: 11, fontWeight: relPhase === ph.id ? '700' : '400' }}>
                {ph.emoji} {ph.id}
              </Typography>
            </Pressable>
          ))}
        </View>
      </GCard>

      {/* AI Synthesis */}
      <SectionLabel text="SYNTEZA ENERGETYCZNA" isLight={isLight} color={ACCENT} />
      <Pressable onPress={handleAiSummary} disabled={summaryLoading}
        style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
        <LinearGradient colors={[ACCENT + '28', CRIMSON + '18']} style={{ paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, borderColor: ACCENT + '44' }}>
          <Sparkles size={18} color={ACCENT} />
          <Typography style={{ color: textColor, fontSize: 14, fontWeight: '600', flex: 1 }}>
            {summaryLoading ? 'Generowanie syntezy...' : 'Uzyskaj Syntezę Oracle'}
          </Typography>
          {!summaryLoading && <ArrowRight size={16} color={ACCENT} />}
        </LinearGradient>
      </Pressable>

      {aiSummary.length > 0 && (
        <Animated.View entering={FadeInDown.springify()}>
          <GCard isLight={isLight} accentBorder={ACCENT} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Sparkles size={14} color={ACCENT} />
              <Typography variant="microLabel" style={{ color: ACCENT, fontSize: 10, letterSpacing: 1.5 }}>SYNTEZA RELACJI</Typography>
            </View>
            <Typography style={{ color: isLight ? 'rgba(0,0,0,0.80)' : 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 24, fontStyle: 'italic' }}>
              {aiSummary}
            </Typography>
          </GCard>
        </Animated.View>
      )}

      {/* Moon phase comparison */}
      {myBirthDate && partnerBirth && (
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <SectionLabel text="KSIĘŻYC URODZENIA" isLight={isLight} color={LAVENDER} />
          <GCard isLight={isLight} accentBorder={LAVENDER} style={{ marginBottom: 16 }}>
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Moon size={14} color={ACCENT} />
                  <Typography style={{ color: subColor, fontSize: 13 }}>{myName}</Typography>
                </View>
                <Typography style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>{getMoonPhaseLabel(myBirthDate)}</Typography>
              </View>
              <View style={{ height: 1, backgroundColor: cardBorder }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Moon size={14} color={ROSE} />
                  <Typography style={{ color: subColor, fontSize: 13 }}>{partnerDisplay}</Typography>
                </View>
                <Typography style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>{getMoonPhaseLabel(partnerBirth)}</Typography>
              </View>
            </View>
          </GCard>
        </Animated.View>
      )}

      <EndOfContentSpacer />
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB: Historia
  // ─────────────────────────────────────────────────────────────────────────────
  const renderHistoryTab = () => {
    const daysSince = readings.length > 0
      ? Math.floor((Date.now() - parseInt(readings[readings.length - 1].id)) / (1000 * 3600 * 24))
      : null;
    const spreadCounts: Record<string, number> = {};
    readings.forEach(r => { spreadCounts[r.spreadId] = (spreadCounts[r.spreadId] || 0) + 1; });

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: 20 }}>
        <Animated.View entering={FadeInDown.delay(50).springify()} style={{ height: 12 }} />

        {/* Stats strip */}
        {readings.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <GCard isLight={isLight} style={{ flex: 1, alignItems: 'center', padding: 14 }}>
                <Typography style={{ color: ACCENT, fontSize: 22, fontWeight: '800' }}>{readings.length}</Typography>
                <Typography style={{ color: subColor, fontSize: 11, marginTop: 2 }}>Odczytów</Typography>
              </GCard>
              {daysSince !== null && (
                <GCard isLight={isLight} style={{ flex: 1, alignItems: 'center', padding: 14 }}>
                  <Typography style={{ color: ROSE, fontSize: 22, fontWeight: '800' }}>{daysSince}</Typography>
                  <Typography style={{ color: subColor, fontSize: 11, marginTop: 2 }}>Dni razem</Typography>
                </GCard>
              )}
              <GCard isLight={isLight} style={{ flex: 1, alignItems: 'center', padding: 14 }}>
                <Typography style={{ color: GOLD, fontSize: 22, fontWeight: '800' }}>
                  {Object.values(spreadCounts).length > 0 ? Object.entries(spreadCounts).sort((a, b) => b[1] - a[1])[0][0].slice(0, 4) : '—'}
                </Typography>
                <Typography style={{ color: subColor, fontSize: 11, marginTop: 2 }}>Fav. rozkład</Typography>
              </GCard>
            </View>
          </Animated.View>
        )}

        {/* Spread popularity */}
        {readings.length > 1 && (
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <SectionLabel text="ULUBIONE ROZKŁADY" isLight={isLight} color={GOLD} />
            <GCard isLight={isLight} style={{ marginBottom: 16 }}>
              {SPREAD_TYPES.filter(s => spreadCounts[s.id]).map(s => {
                const SpIcon = s.icon;
                const cnt = spreadCounts[s.id] || 0;
                const pct = Math.round((cnt / readings.length) * 100);
                return (
                  <View key={s.id} style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <SpIcon size={13} color={s.color} />
                      <Typography style={{ color: textColor, fontSize: 12, flex: 1 }}>{s.name}</Typography>
                      <Typography style={{ color: s.color, fontSize: 12, fontWeight: '700' }}>{cnt}×</Typography>
                    </View>
                    <View style={{ height: 5, backgroundColor: cardBg, borderRadius: 3, overflow: 'hidden' }}>
                      <Animated.View entering={FadeInDown.delay(200).springify()} style={{ width: `${pct}%`, height: 5, backgroundColor: s.color + 'AA', borderRadius: 3 }} />
                    </View>
                  </View>
                );
              })}
            </GCard>
          </Animated.View>
        )}

        {/* Pattern analysis */}
        {readings.length >= 2 && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <SectionLabel text="WZORZEC RELACJI" isLight={isLight} color={LAVENDER} />
            <Pressable onPress={handlePatternAnalysis} disabled={patternLoading}
              style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
              <LinearGradient colors={[LAVENDER + '28', '#8B5CF618']} style={{ paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, borderColor: LAVENDER + '44' }}>
                <BarChart2 size={18} color={LAVENDER} />
                <Typography style={{ color: textColor, fontSize: 14, fontWeight: '600', flex: 1 }}>
                  {patternLoading ? 'Analizuję wzorce...' : 'Analiza wzorców odczytów'}
                </Typography>
                {!patternLoading && <ArrowRight size={16} color={LAVENDER} />}
              </LinearGradient>
            </Pressable>
            {patternAnalysis.length > 0 && (
              <Animated.View entering={FadeInDown.springify()}>
                <GCard isLight={isLight} accentBorder={LAVENDER} style={{ marginBottom: 16 }}>
                  <Typography style={{ color: isLight ? 'rgba(0,0,0,0.80)' : 'rgba(255,255,255,0.82)', fontSize: 13, lineHeight: 22, fontStyle: 'italic' }}>
                    {patternAnalysis}
                  </Typography>
                </GCard>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Reading list */}
        <SectionLabel text="ZAPISANE ODCZYTY" isLight={isLight} color={ACCENT} />
        {readings.length === 0 ? (
          <GCard isLight={isLight} style={{ alignItems: 'center', paddingVertical: 36 }}>
            <History size={32} color={subColor} />
            <Typography style={{ color: subColor, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
              Brak zapisanych odczytów.{'\n'}Wykonaj odczyt w zakładce Odczyt i go zapisz.
            </Typography>
          </GCard>
        ) : (
          readings.map(entry => (
            <HistoryEntry
              key={entry.id}
              entry={entry}
              isLight={isLight}
              onDelete={() => deleteReading(entry.id)}
            />
          ))
        )}

        <EndOfContentSpacer />
      </ScrollView>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB: Mądrość
  // ─────────────────────────────────────────────────────────────────────────────
  const renderWisdomTab = () => {
    const currentQ = quizAnswers.length < LOVE_LANGUAGE_QUIZ.length ? LOVE_LANGUAGE_QUIZ[quizAnswers.length] : null;
    const llInfo = loveLanguage ? LOVE_LANG_DESCS[loveLanguage] : null;

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: 20 }}>
        <Animated.View entering={FadeInDown.delay(50).springify()} style={{ height: 12 }} />

        {/* Daily affirmation */}
        <SectionLabel text="AFIRMACJA DNIA DLA PARY" isLight={isLight} color={ROSE} />
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <LinearGradient colors={[CRIMSON + '28', ROSE + '18', ACCENT + '18']} style={{ borderRadius: 20, padding: 22, marginBottom: 20, borderWidth: 1, borderColor: ROSE + '44' }}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: ROSE + '25', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={22} color={ROSE} />
              </View>
            </View>
            <Typography style={{ color: isLight ? '#2A0A1A' : '#FAF0F4', fontSize: 16, lineHeight: 26, textAlign: 'center', fontStyle: 'italic', fontWeight: '500' }}>
              "{dailyAff}"
            </Typography>
          </LinearGradient>
        </Animated.View>

        {/* Daily couple card */}
        <SectionLabel text="KARTA DNIA DLA PARY" isLight={isLight} color={GOLD} />
        {dailyCardDrawn ? (
          <Animated.View entering={ZoomInEasyDown.springify()}>
            <GCard isLight={isLight} accentBorder={GOLD} style={{ marginBottom: 20, alignItems: 'center', paddingVertical: 20 }}>
              <TarotCardVisual deck={deck} card={dailyCardDrawn} size="medium" />
              <Typography style={{ color: GOLD, fontSize: 14, fontWeight: '700', marginTop: 14 }}>{dailyCardDrawn.id}</Typography>
              <Typography style={{ color: subColor, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                Energetyczny przewodnik Waszego dnia jako pary.
              </Typography>
            </GCard>
          </Animated.View>
        ) : (
          <Pressable onPress={drawDailyCard} style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 20 }}>
            <LinearGradient colors={[GOLD + '22', ACCENT + '15']} style={{ paddingVertical: 20, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: GOLD + '44', borderRadius: 18 }}>
              <Sparkles size={24} color={GOLD} />
              <Typography style={{ color: textColor, fontSize: 15, fontWeight: '600' }}>Wylosuj kartę dnia dla pary</Typography>
              <Typography style={{ color: subColor, fontSize: 12 }}>Jedna karta — wspólny kierunek</Typography>
            </LinearGradient>
          </Pressable>
        )}

        {/* Relationship archetypes */}
        <SectionLabel text="ARCHETYP RELACJI" isLight={isLight} color={LAVENDER} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {RELATIONSHIP_ARCHETYPES.map((arch, i) => {
            const ArchIcon = arch.icon;
            const isSelected = selectedArchetype === arch.id;
            return (
              <Animated.View key={arch.id} entering={FadeInDown.delay(i * 80).springify()} style={{ width: (SW - layout.padding.screen * 2 - 10) / 2 }}>
                <Pressable onPress={() => { setSelectedArchetype(isSelected ? null : arch.id); HapticsService.selection(); }}
                  style={{ borderRadius: 16, overflow: 'hidden' }}>
                  <LinearGradient colors={[arch.color + (isSelected ? '30' : '18'), arch.color + '08']}
                    style={{ padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: isSelected ? arch.color + '66' : arch.color + '30', gap: 8 }}>
                    <ArchIcon size={22} color={arch.color} />
                    <Typography style={{ color: textColor, fontSize: 14, fontWeight: '700' }}>{arch.name}</Typography>
                    <Typography style={{ color: subColor, fontSize: 11, lineHeight: 17 }}>{arch.desc}</Typography>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Deep questions */}
        <SectionLabel text="PYTANIA DO POGŁĘBIENIA RELACJI" isLight={isLight} color={ACCENT} />
        <View style={{ gap: 10, marginBottom: 20 }}>
          {DEEP_QUESTIONS.map((dq, i) => {
            const isOpen = expandedQ === i;
            const resp = qAiResp[i];
            const isLoading = qLoading === i;
            return (
              <Animated.View key={i} entering={FadeInDown.delay(i * 60).springify()}>
                <GCard isLight={isLight} accentBorder={isOpen ? dq.color : undefined} style={{ padding: 16 }}>
                  <Pressable onPress={() => { setExpandedQ(isOpen ? null : i); HapticsService.selection(); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: dq.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography style={{ color: dq.color, fontSize: 11, fontWeight: '700' }}>{i + 1}</Typography>
                    </View>
                    <Typography style={{ color: textColor, fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 20 }}>{dq.q}</Typography>
                    {isOpen ? <ChevronUp size={15} color={subColor} /> : <ChevronDown size={15} color={subColor} />}
                  </Pressable>
                  {isOpen && (
                    <View style={{ marginTop: 12 }}>
                      <View style={{ paddingVertical: 10, paddingHorizontal: 14, backgroundColor: dq.color + '12', borderRadius: 12, borderWidth: 1, borderColor: dq.color + '30', marginBottom: 12 }}>
                        <Typography style={{ color: dq.color, fontSize: 12, lineHeight: 20, fontStyle: 'italic' }}>
                          ✦ {dq.hint}
                        </Typography>
                      </View>
                      {resp ? (
                        <Typography style={{ color: subColor, fontSize: 13, lineHeight: 22 }}>{resp}</Typography>
                      ) : (
                        <Pressable onPress={() => handleDeepQuestion(i)} disabled={!!isLoading}
                          style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: dq.color + '18', borderRadius: 12, borderWidth: 1, borderColor: dq.color + '44', alignItems: 'center' }}>
                          <Typography style={{ color: dq.color, fontSize: 13, fontWeight: '600' }}>
                            {isLoading ? 'Oracle myśli...' : 'Zapytaj Oracle o refleksję'}
                          </Typography>
                        </Pressable>
                      )}
                    </View>
                  )}
                </GCard>
              </Animated.View>
            );
          })}
        </View>

        {/* Love language quiz */}
        <SectionLabel text="TWÓJ JĘZYK MIŁOŚCI" isLight={isLight} color={ROSE} />
        {loveLanguage && llInfo ? (
          <Animated.View entering={ZoomIn.springify()}>
            <LinearGradient colors={[llInfo.color + '28', llInfo.color + '10']} style={{ borderRadius: 20, padding: 22, marginBottom: 20, borderWidth: 1, borderColor: llInfo.color + '55' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: llInfo.color + '30', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography style={{ fontSize: 26 }}>{llInfo.emoji}</Typography>
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="microLabel" style={{ color: llInfo.color, fontSize: 10, letterSpacing: 1.5 }}>TWÓJ DOMINUJĄCY JĘZYK</Typography>
                  <Typography style={{ color: textColor, fontSize: 18, fontWeight: '700' }}>{loveLanguage}</Typography>
                </View>
              </View>
              <Typography style={{ color: isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 22 }}>
                {llInfo.desc}
              </Typography>
              <Pressable onPress={() => { setQuizAnswers([]); setLoveLanguage(null); }} style={{ marginTop: 14, alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: llInfo.color + '18', borderWidth: 1, borderColor: llInfo.color + '44' }}>
                <Typography style={{ color: llInfo.color, fontSize: 12 }}>Zrób quiz ponownie</Typography>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        ) : currentQ ? (
          <Animated.View entering={FadeInDown.springify()}>
            <GCard isLight={isLight} accentBorder={ROSE} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Typography variant="microLabel" style={{ color: ROSE, fontSize: 10, letterSpacing: 1.5 }}>
                  PYTANIE {quizAnswers.length + 1} / {LOVE_LANGUAGE_QUIZ.length}
                </Typography>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {LOVE_LANGUAGE_QUIZ.map((_, qi) => (
                    <View key={qi} style={{ width: 20, height: 4, borderRadius: 2, backgroundColor: qi < quizAnswers.length ? ROSE : (qi === quizAnswers.length ? ROSE + '55' : cardBorder) }} />
                  ))}
                </View>
              </View>
              <Typography style={{ color: textColor, fontSize: 15, fontWeight: '600', lineHeight: 24, marginBottom: 16 }}>
                {currentQ.q}
              </Typography>
              <View style={{ gap: 8 }}>
                {currentQ.options.map((opt, oi) => (
                  <Pressable key={oi} onPress={() => { handleQuizAnswer(opt.lang); HapticsService.selection(); }}
                    style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: ROSE + '55', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography style={{ color: ROSE, fontSize: 11, fontWeight: '700' }}>{oi + 1}</Typography>
                    </View>
                    <Typography style={{ color: textColor, fontSize: 13, flex: 1, lineHeight: 20 }}>{opt.text}</Typography>
                  </Pressable>
                ))}
              </View>
            </GCard>
          </Animated.View>
        ) : (
          <Pressable onPress={() => setQuizAnswers([])} style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
            <LinearGradient colors={[ROSE + '22', CRIMSON + '15']} style={{ paddingVertical: 18, alignItems: 'center', gap: 8, borderRadius: 16, borderWidth: 1, borderColor: ROSE + '44' }}>
              <Heart size={22} color={ROSE} />
              <Typography style={{ color: textColor, fontSize: 15, fontWeight: '600' }}>Odkryj swój język miłości</Typography>
              <Typography style={{ color: subColor, fontSize: 12 }}>5 krótkich pytań</Typography>
            </LinearGradient>
          </Pressable>
        )}

        {/* Weekly energy */}
        <SectionLabel text="ENERGIA TYGODNIA DLA PARY" isLight={isLight} color={GOLD} />
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <GCard isLight={isLight} accentBorder={GOLD} style={{ marginBottom: 20 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {WEEKLY_ENERGY.map((we, i) => {
                const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
                return (
                  <Animated.View key={we.day} entering={FadeInDown.delay(i * 50).springify()}
                    style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: isToday ? we.color + '22' : 'transparent', borderWidth: isToday ? 1.5 : 1, borderColor: isToday ? we.color + '66' : (isLight ? 'rgba(255,246,230,0.92)' : 'rgba(255,255,255,0.06)'), minWidth: 72 }}>
                    <Typography style={{ color: isToday ? we.color : subColor, fontSize: 10, fontWeight: '600', letterSpacing: 0.8 }}>{we.day}</Typography>
                    <Typography style={{ color: isToday ? we.color : textColor, fontSize: 12, fontWeight: '700', marginTop: 4 }}>{we.energy}</Typography>
                    {isToday && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: we.color, marginTop: 4 }} />}
                  </Animated.View>
                );
              })}
            </ScrollView>
            {/* Today's hint */}
            {(() => {
              const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
              const today = WEEKLY_ENERGY[todayIdx];
              return (
                <View style={{ marginTop: 14, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: today.color + '12', borderRadius: 12, borderWidth: 1, borderColor: today.color + '30' }}>
                  <Typography style={{ color: today.color, fontSize: 12, lineHeight: 18, fontStyle: 'italic' }}>
                    ✦ Dziś: {today.hint}
                  </Typography>
                </View>
              );
            })()}
          </GCard>
        </Animated.View>

        {/* Relationship tips */}
        <SectionLabel text="WSKAZÓWKI DLA PARY" isLight={isLight} color={ACCENT} />
        <View style={{ gap: 10, marginBottom: 20 }}>
          {RELATIONSHIP_TIPS.map((tip, i) => {
            const TipIcon = tip.icon;
            return (
              <Animated.View key={i} entering={FadeInDown.delay(i * 70).springify()}>
                <LinearGradient colors={[tip.color + '18', tip.color + '08']}
                  style={{ borderRadius: 16, padding: 16, borderWidth: 1, borderColor: tip.color + '30', flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: tip.color + '22', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TipIcon size={16} color={tip.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography style={{ color: textColor, fontSize: 14, fontWeight: '700', marginBottom: 4 }}>{tip.title}</Typography>
                    <Typography style={{ color: subColor, fontSize: 12, lineHeight: 20 }}>{tip.tip}</Typography>
                  </View>
                </LinearGradient>
              </Animated.View>
            );
          })}
        </View>

        <EndOfContentSpacer />
      </ScrollView>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
      <LinearGradient
        colors={isLight ? ['#FDF8FF', '#F5EEF8', '#FDF8FF'] : ['#140818', '#200E2A', '#0E1428']}
        style={StyleSheet.absoluteFill}
      />
      {!isLight && <CelestialBackdrop />}
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: 6 }]}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.headerBtn} hitSlop={16}>
          <ChevronLeft size={22} color={isLight ? '#1A1A2E' : '#F0EBF4'} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Typography variant="microLabel" style={{ color: ACCENT, fontSize: 9, letterSpacing: 2.5, marginBottom: 1 }}>
            RELACYJNY TAROT
          </Typography>
          <Typography style={{ color: isLight ? '#1A1A2E' : '#F0EBF4', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 }}>
            {partnerName ? `${myName} & ${partnerName}` : 'Tarot dla Par'}
          </Typography>
        </View>
        <Pressable onPress={handleFavorite} style={[styles.headerBtn, { backgroundColor: isFav ? ROSE + '22' : 'transparent' }]} hitSlop={16}>
          <Star size={18} color={isFav ? ROSE : (isLight ? '#1A1A2E' : '#F0EBF4')} fill={isFav ? ROSE : 'transparent'} />
        </Pressable>
      </View>

      {/* Tab bar */}
      <TabBar active={activeTab} onChange={setActiveTab} isLight={isLight} />

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {activeTab === 0 && renderReadingTab()}
        {activeTab === 1 && renderProfileTab()}
        {activeTab === 2 && renderHistoryTab()}
        {activeTab === 3 && renderWisdomTab()}
      </View>

      {/* Date pickers */}
      <PremiumDatePickerSheet
        visible={showPartnerPicker}
        mode="date"
        value={partnerBirth ? new Date(partnerBirth) : new Date(2000, 0, 1)}
        maximumDate={new Date()}
        onCancel={() => setShowPartnerPicker(false)}
        onConfirm={date => { setPartnerBirth(date.toISOString().split('T')[0]); setShowPartnerPicker(false); }}
        title={`Data urodzenia — ${partnerDisplay}`}
      />
      <PremiumDatePickerSheet
        visible={showMyPicker}
        mode="date"
        value={myBirthDate ? new Date(myBirthDate) : new Date(1990, 0, 1)}
        maximumDate={new Date()}
        onCancel={() => setShowMyPicker(false)}
        onConfirm={date => { setMyBirthDate(date.toISOString().split('T')[0]); setShowMyPicker(false); }}
        title="Moja data urodzenia"
      />
    </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen,
    paddingBottom: 10,
    gap: 8,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    flex: 1,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  ctaBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },
  phaseHint: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  archetypeCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  quizOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  historyEmpty: {
    alignItems: 'center',
    paddingVertical: 36,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  affCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
  },
  affText: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  weekDayCell: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 72,
  },
  tipCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  perspectiveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  startBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 8,
  },
  startBtnInner: {
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  cardPositionLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  compatBadge: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  compatBadgeNum: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  moonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loveResultCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
  },
  loveResultIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizProgress: {
    flexDirection: 'row',
    gap: 4,
  },
  quizProgressDot: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  deepQCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  deepQHint: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  historyStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  spreadBarWrap: {
    marginBottom: 10,
  },
  spreadBarTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  patternBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  patternBtnInner: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  synastryWrap: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
});

export default PartnerTarotScreen;
