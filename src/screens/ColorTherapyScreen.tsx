// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Alert, Dimensions, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, G, Defs, RadialGradient as SvgRadialGradient, Stop,
  LinearGradient as SvgLinearGradient, Path, Ellipse, Line,
} from 'react-native-svg';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, Easing, useAnimatedProps,
  withSequence, interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Eye, Droplets, Zap, Wind, Heart,
  BookOpen, Sparkles, ArrowRight, Sun, Moon, Gem, Leaf,
  Palette, Activity, Cloud, Coffee, Apple, Flower2,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AudioService } from '../core/services/audio.service';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');

// ─── COLOR THERAPY DATA ──────────────────────────────────────────────────────

interface TherapyColor {
  id: string;
  name: string;
  nameEn: string;
  hex: string;
  hexLight: string;
  range: string;
  frequency: string;
  chakra: string;
  chakraEmoji: string;
  shortDesc: string;
  healingUses: string[];
  howToUse: string[];
  foods: string[];
  gemstones: string[];
  affirmation: string;
  emotion: string;
}

const THERAPY_COLORS: TherapyColor[] = [
  {
    id: 'red',
    name: 'Czerwony',
    nameEn: 'Red',
    hex: '#EF4444',
    hexLight: '#FEE2E2',
    range: '620–750 nm',
    frequency: '400–484 THz',
    chakra: 'Muladhara — Czakra Korzenia',
    chakraEmoji: '🔴',
    shortDesc: 'Witalność, uziemienie, instynkt przeżycia',
    healingUses: [
      'Pobudza krążenie krwi i zwiększa poziom energii',
      'Wzmacnia uziemienie i poczucie bezpieczeństwa',
      'Aktywuje instynkt przeżycia i siłę woli',
      'Wspiera przy anemii i chronicznym zmęczeniu',
    ],
    howToUse: [
      'Noś czerwone akcenty w odzieży w dni wymagające odwagi',
      'Medytuj wizualizując czerwone światło przepływające przez stopy',
      'Umieść czerwony kryształ (rubinit, czerwony jaspis) przy łóżku',
      'Jedz czerwone pokarmy rano, gdy potrzebujesz energii',
    ],
    foods: ['Pomidory', 'Truskawki', 'Wiśnie', 'Arbuzy', 'Czerwona papryka'],
    gemstones: ['Rubin', 'Czerwony Jaspis', 'Karneol', 'Granat'],
    affirmation: 'Jestem bezpieczna/y, zakorzeniona/y i pełna/y życiowej siły.',
    emotion: 'Odwaga i witalność',
  },
  {
    id: 'orange',
    name: 'Pomarańczowy',
    nameEn: 'Orange',
    hex: '#F97316',
    hexLight: '#FFEDD5',
    range: '590–620 nm',
    frequency: '484–508 THz',
    chakra: 'Svadhisthana — Czakra Sakralna',
    chakraEmoji: '🟠',
    shortDesc: 'Twórczość, seksualność, radość życia',
    healingUses: [
      'Pobudza twórczość i wyobraźnię',
      'Wspiera zdrowie układu rozrodczego',
      'Przynosi radość, entuzjazm i optymizm',
      'Pomaga przy blokadach emocjonalnych i traumach',
    ],
    howToUse: [
      'Otaczaj się pomarańczowymi detalami w przestrzeni twórczej',
      'Tańcz lub ruszaj biodrami przy pomarańczowym świetle',
      'Wizualizuj ciepłą pomarańczową kulę w okolicach brzucha',
      'Noś pomarańczowy kamień przy sobie podczas sesji twórczych',
    ],
    foods: ['Marchew', 'Dynia', 'Pomarańcze', 'Mango', 'Bataty'],
    gemstones: ['Karneol', 'Pomarańczowy Kalcyt', 'Bursztyn', 'Sardoniks'],
    affirmation: 'Moja twórczość płynie swobodnie i radość jest moim naturalnym stanem.',
    emotion: 'Radość i twórcza ekspresja',
  },
  {
    id: 'yellow',
    name: 'Żółty',
    nameEn: 'Yellow',
    hex: '#FBBF24',
    hexLight: '#FEF9C3',
    range: '570–590 nm',
    frequency: '508–526 THz',
    chakra: 'Manipura — Czakra Słonecznego Splotu',
    chakraEmoji: '🟡',
    shortDesc: 'Jasność umysłu, pewność siebie, sprawczość',
    healingUses: [
      'Wzmacnia koncentrację i logiczne myślenie',
      'Buduje pewność siebie i poczucie własnej wartości',
      'Wspiera trawienie i metabolizm',
      'Rozjaśnia nastrój przy stanach depresyjnych',
    ],
    howToUse: [
      'Pracuj w pomieszczeniu z żółtymi akcentami lub przy naturalnym świetle słonecznym',
      'Wizualizuj złote słońce w obszarze splotu słonecznego',
      'Noś żółte kamienie podczas ważnych prezentacji i rozmów',
      'Jedz żółte pokarmy na śniadanie, aby pobudzić umysł',
    ],
    foods: ['Banany', 'Cytryny', 'Kukurydza', 'Żółta papryka', 'Ananas'],
    gemstones: ['Cytryn', 'Żółty Topaz', 'Tygrysie Oko', 'Piryt'],
    affirmation: 'Jestem pewna/y siebie, sprawcza/y i mój umysł jest jasny jak słońce.',
    emotion: 'Pewność siebie i jasność',
  },
  {
    id: 'green',
    name: 'Zielony',
    nameEn: 'Green',
    hex: '#22C55E',
    hexLight: '#DCFCE7',
    range: '495–570 nm',
    frequency: '526–606 THz',
    chakra: 'Anahata — Czakra Serca',
    chakraEmoji: '💚',
    shortDesc: 'Uzdrawianie, równowaga, miłość do siebie',
    healingUses: [
      'Łagodzi napięcia emocjonalne i przynosi spokój',
      'Wspiera regenerację i procesy uzdrawiające ciało',
      'Otwiera serce na miłość bezwarunkową i współczucie',
      'Harmonizuje i przywraca równowagę na wszystkich poziomach',
    ],
    howToUse: [
      'Spędzaj czas w naturze — wśród drzew i zieleni',
      'Wizualizuj szmaragdowe światło wypełniające klatkę piersiową',
      'Umieść zielone rośliny w głównej przestrzeni życiowej',
      'Medytuj przyrodzie lub przy zielonych kamieniach',
    ],
    foods: ['Szpinak', 'Brokuły', 'Awokado', 'Ogórek', 'Kiwi'],
    gemstones: ['Szmaragd', 'Zielony Awenturyn', 'Malachit', 'Jadeitu'],
    affirmation: 'Moje serce jest otwarte, uzdrowione i pełne bezwarunkowej miłości.',
    emotion: 'Miłość i uzdrowienie',
  },
  {
    id: 'turquoise',
    name: 'Turkusowy',
    nameEn: 'Turquoise',
    hex: '#14B8A6',
    hexLight: '#CCFBF1',
    range: '475–495 nm',
    frequency: '606–631 THz',
    chakra: 'Vishuddha — Czakra Gardła (wyższy aspekt)',
    chakraEmoji: '🩵',
    shortDesc: 'Układ odpornościowy, komunikacja, ochrona',
    healingUses: [
      'Wzmacnia układ odpornościowy i procesy detoksykacji',
      'Wspiera klarowną i autentyczną komunikację',
      'Działa ochronnie na pole energetyczne',
      'Łagodzi stany zapalne i infekcje',
    ],
    howToUse: [
      'Noś turkusowy kamień na poziomie szyi lub klatki piersiowej',
      'Wizualizuj turkusowy przepływ chroniący ciało jak zbroja',
      'Pij wodę energetyzowaną przez turkusowy kryształ',
      'Medytuj przy morzu lub w pobliżu wody o turkusowym zabarwieniu',
    ],
    foods: ['Spirulina', 'Chlorella', 'Algi morskie', 'Miętowe zioła', 'Ogórek morski'],
    gemstones: ['Turkus', 'Chryzokola', 'Amazonit', 'Larimar'],
    affirmation: 'Jestem chroniona/y, moje ciało jest silne, a moje słowa niosą prawdę.',
    emotion: 'Ochrona i autentyczność',
  },
  {
    id: 'blue',
    name: 'Niebieski',
    nameEn: 'Blue',
    hex: '#3B82F6',
    hexLight: '#DBEAFE',
    range: '450–475 nm',
    frequency: '631–668 THz',
    chakra: 'Vishuddha — Czakra Gardła',
    chakraEmoji: '🔵',
    shortDesc: 'Spokój, komunikacja, głęboka prawda',
    healingUses: [
      'Uspokaja umysł i redukuje stres oraz lęk',
      'Otwiera na szczerą i wyrażającą siebie komunikację',
      'Obniża ciśnienie krwi i zwalnia rytm serca',
      'Pomaga przy bezsenności i nadpobudliwości',
    ],
    howToUse: [
      'Noś niebieski w sytuacjach wymagających spokoju i dyplomacji',
      'Umieść niebieskie elementy dekoracyjne w sypialni',
      'Wizualizuj niebieskie mroźne światło chłodzące gorące emocje',
      'Pij herbaty z niebieskich kwiatów — bławatek, lawenda',
    ],
    foods: ['Borówki', 'Jeżyny', 'Figi', 'Śliwki', 'Flasker morski'],
    gemstones: ['Lapis Lazuli', 'Akwamaryn', 'Błękitny Topaz', 'Angelit'],
    affirmation: 'Mówię swoją prawdę z miłością i spokojem. Jestem wysłuchana/y.',
    emotion: 'Spokój i prawda',
  },
  {
    id: 'indigo',
    name: 'Indygo',
    nameEn: 'Indigo',
    hex: '#6366F1',
    hexLight: '#E0E7FF',
    range: '425–450 nm',
    frequency: '668–700 THz',
    chakra: 'Ajna — Trzecie Oko',
    chakraEmoji: '🟣',
    shortDesc: 'Intuicja, trzecie oko, głęboki sen',
    healingUses: [
      'Pogłębia intuicję i percepcję pozazmysłową',
      'Wspiera głęboki, regeneracyjny sen i jasne sny',
      'Wzmacnia koncentrację i skupienie',
      'Pomaga przy migrenach i bólach głowy',
    ],
    howToUse: [
      'Medytuj przy świetle indygo lub granatowej świecy przed snem',
      'Wizualizuj indygo pulsujące w centrum czoła',
      'Noś indygo lub granatowe ubrania podczas praktyk duchowych',
      'Pisz dziennik snów przy indygo świetle zaraz po przebudzeniu',
    ],
    foods: ['Czarne jagody', 'Czarny ryż', 'Bakłażan', 'Aronia', 'Czarne porzeczki'],
    gemstones: ['Sodalit', 'Iolite', 'Tanzanit', 'Labradoryt'],
    affirmation: 'Moja intuicja jest mój kompasem. Ufam temu co widzę poza zasłoną.',
    emotion: 'Intuicja i wgląd',
  },
  {
    id: 'violet',
    name: 'Fioletowy',
    nameEn: 'Violet',
    hex: '#A855F7',
    hexLight: '#F3E8FF',
    range: '380–425 nm',
    frequency: '700–789 THz',
    chakra: 'Sahasrara — Czakra Korony',
    chakraEmoji: '💜',
    shortDesc: 'Duchowość, połączenie z boskością, transcendencja',
    healingUses: [
      'Otwiera na połączenie z wyższymi wymiarami świadomości',
      'Oczyszcza pole energetyczne i aurę',
      'Wspiera medytację i praktyki duchowe',
      'Łagodzi bóle głowy i napięcia czaszki',
    ],
    howToUse: [
      'Medytuj przy fioletowej świecy lub krysztale ametystowym',
      'Wizualizuj fioletowe lub białe światło wlewające się przez czubek głowy',
      'Stwórz ołtarz z fioletowymi elementami dla praktyk duchowych',
      'Używaj lawendowego olejku eterycznego przy medytacji',
    ],
    foods: ['Lawendowe ciasto', 'Fioletowe winogrona', 'Czosnek', 'Kapusta czerwona', 'Fioletowe ziemniaki'],
    gemstones: ['Ametyst', 'Czaroit', 'Fluoryt Fioletowy', 'Kunzit'],
    affirmation: 'Jestem połączona/y z boskim źródłem. Jestem instrumentem wyższej miłości.',
    emotion: 'Duchowe połączenie',
  },
  {
    id: 'pink',
    name: 'Różowy',
    nameEn: 'Pink',
    hex: '#EC4899',
    hexLight: '#FCE7F3',
    range: 'Mieszanina',
    frequency: 'Niewidmo (kompozyt)',
    chakra: 'Anahata — Serce (wyższy aspekt)',
    chakraEmoji: '🌸',
    shortDesc: 'Bezwarunkowa miłość, troska o siebie, delikatność',
    healingUses: [
      'Leczy rany emocjonalne i traumy sercowe',
      'Wspiera miłość własną i samowspółczucie',
      'Łagodzi gniew, agresję i napięcia relacyjne',
      'Działa jak energetyczny balsam na zranienia',
    ],
    howToUse: [
      'Zapal różową świecę podczas rytuałów miłości i uzdrowienia serca',
      'Noś różowy kwarc różowy przy sercu',
      'Wizualizuj różowe światło delikatnie otulające całe ciało',
      'Pisz liście miłości do siebie samej/samego przy różowym świetle',
    ],
    foods: ['Różowa grapefruit', 'Maliny', 'Truskawki', 'Hibiskus', 'Różany dżem'],
    gemstones: ['Kwarc Różowy', 'Rodochrozyt', 'Morganit', 'Inkit Różowy'],
    affirmation: 'Jestem godna/y miłości. Traktuję siebie z czułością i troską.',
    emotion: 'Miłość własna i uzdrowienie serca',
  },
  {
    id: 'gold',
    name: 'Złoty',
    nameEn: 'Gold',
    hex: '#F59E0B',
    hexLight: '#FEF3C7',
    range: 'Złoty odcień żółci',
    frequency: '510–520 THz',
    chakra: 'Manipura (wyższy aspekt) + Sahasrara',
    chakraEmoji: '✨',
    shortDesc: 'Boska mądrość, obfitość, królewski majestat',
    healingUses: [
      'Aktywuje wewnętrzną mądrość i autorytet duchowy',
      'Przyciąga obfitość i dobrobyt na wszystkich poziomach',
      'Wzmacnia aurę i chroni przed stratą energii',
      'Łączy ze swoim wyższym "ja" i przeznaczeniem',
    ],
    howToUse: [
      'Noś złotą biżuterię podczas ważnych decyzji i przełomowych momentów',
      'Wizualizuj złotą koronę świetlną wokół głowy podczas medytacji',
      'Używaj złotych dekali i świec podczas rytuałów obfitości',
      'Afirmuj przy złotym świetle o poranku z twarzą ku słońcu',
    ],
    foods: ['Kurkuma', 'Imbir', 'Miód', 'Żółtka jaj', 'Złota cytryna'],
    gemstones: ['Piryt', 'Złoty Tygrysie Oko', 'Kalcyt Złoty', 'Topaz Złoty'],
    affirmation: 'Jestem dzieckiem Wszechświata. Obfitość jest moim naturalnym prawem.',
    emotion: 'Mądrość i obfitość',
  },
  {
    id: 'silver',
    name: 'Srebrny',
    nameEn: 'Silver',
    hex: '#94A3B8',
    hexLight: '#F1F5F9',
    range: 'Odblask pełnego spektrum',
    frequency: 'Pełne spektrum odbite',
    chakra: 'Czakra Trzeciego Oka (księżycowy aspekt)',
    chakraEmoji: '🌙',
    shortDesc: 'Energia księżyca, refleksja, podświadomość',
    healingUses: [
      'Pogłębia połączenie z energią księżycową i cyklami natury',
      'Wspiera pracę z podświadomością i snami',
      'Oczyszcza i odbija negatywne energie',
      'Wzmacnia intuicję kobiecą i cykle hormonalne',
    ],
    howToUse: [
      'Pracuj ze srebrnymi narzędziami podczas pełni i nowiu księżyca',
      'Noś srebrną biżuterię podczas rytuałów księżycowych',
      'Wizualizuj srebrne księżycowe światło oczyszczające ciało',
      'Zapisuj sny i wizje przy srebrnym świetle świecy',
    ],
    foods: ['Gruszki', 'Biała kapusta', 'Cebula', 'Czosnek', 'Srebrna woda księżycowa'],
    gemstones: ['Kamień Księżycowy', 'Selenite', 'Labradoryt', 'Perła'],
    affirmation: 'Jestem w zgodzie z księżycowymi rytmami. Moja intuicja mnie prowadzi.',
    emotion: 'Intuicja księżycowa i refleksja',
  },
  {
    id: 'white',
    name: 'Biały',
    nameEn: 'White',
    hex: '#F8FAFC',
    hexLight: '#FFFFFF',
    range: 'Pełne spektrum (suma)',
    frequency: 'Suma wszystkich częstotliwości',
    chakra: 'Wszystkie czakry — jedność',
    chakraEmoji: '⬜',
    shortDesc: 'Czystość, całość, boskie światło',
    healingUses: [
      'Oczyszcza wszystkie poziomy ciała i pola energetycznego',
      'Przywraca poczucie niewinności i nowego początku',
      'Łączy wszystkie kolory — pełnia i integracja',
      'Chroni i wznosi wibrację do najwyższego poziomu',
    ],
    howToUse: [
      'Pal białe świece podczas ceremonii oczyszczenia i nowego początku',
      'Ubierz się całkowicie na biało podczas ważnych przejść duchowych',
      'Wizualizuj białe światło wypełniające każdą komórkę ciała',
      'Umieść biały kryształ górski jako centralny punkt ołtarza',
    ],
    foods: ['Kokos', 'Biała fasola', 'Kalafior', 'Biała czekolada', 'Ryż jaśminowy'],
    gemstones: ['Kryształ Górski', 'Selenite', 'Howlit', 'Opal Biały'],
    affirmation: 'Jestem czystym kanałem Bożego Światła. W mojej czystości jest moja moc.',
    emotion: 'Czystość i całość',
  },
];

// Healing color from date numerology
function getHealingColorForDate(date: Date): TherapyColor {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const digits = String(day + month + year).split('').map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  const reduced = sum > 12 ? (sum % 12 || 12) : sum;
  return THERAPY_COLORS[(reduced - 1) % THERAPY_COLORS.length];
}

// Condition → recommended color
interface Prescription {
  id: string;
  label: string;
  desc: string;
  colorIds: string[];
  icon: React.ComponentType<any>;
}

const PRESCRIPTIONS: Prescription[] = [
  { id: 'fatigue', label: 'Wyczerpanie i brak energii', desc: 'Gdy czujesz się ospała/y i bez sił', colorIds: ['red', 'orange', 'gold'], icon: Zap },
  { id: 'anxiety', label: 'Lęk i niepokój', desc: 'Gdy umysł nie daje spokoju i truchlejesz', colorIds: ['blue', 'green', 'indigo'], icon: Wind },
  { id: 'heartbreak', label: 'Ból serca lub odrzucenie', desc: 'Gdy miłość boli i potrzebujesz uzdrowienia', colorIds: ['pink', 'green', 'violet'], icon: Heart },
  { id: 'clarity', label: 'Brak jasności i decyzyjności', desc: 'Gdy nie wiesz czego chcesz ani w którą stronę iść', colorIds: ['yellow', 'indigo', 'white'], icon: Eye },
  { id: 'creativity', label: 'Blokada twórcza', desc: 'Gdy energia twórcza jest zablokowana', colorIds: ['orange', 'yellow', 'gold'], icon: Palette },
  { id: 'immunity', label: 'Osłabienie organizmu', desc: 'Gdy ciało wymaga wzmocnienia i ochrony', colorIds: ['turquoise', 'green', 'gold'], icon: Activity },
  { id: 'sleep', label: 'Problemy ze snem', desc: 'Gdy noce są niespokojne i trudno odpocząć', colorIds: ['indigo', 'violet', 'silver'], icon: Moon },
  { id: 'spirituality', label: 'Pragnienie głębszego połączenia', desc: 'Gdy tęsknisz za duchowym doświadczeniem', colorIds: ['violet', 'white', 'indigo'], icon: Sparkles },
  { id: 'abundance', label: 'Blokady w obfitości i finansach', desc: 'Gdy czujesz niedobór i utknięcie w stagnacji', colorIds: ['gold', 'yellow', 'green'], icon: Sun },
  { id: 'grounding', label: 'Rozkojarzenie i utraty kontaktu', desc: 'Gdy czujesz się oderwana/y i w chaosie', colorIds: ['red', 'turquoise', 'green'], icon: Leaf },
];

// ─── ANIMATED MANDALA ────────────────────────────────────────────────────────

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MANDALA_RINGS = [
  { r: 120, color: '#EF4444', opacity: 0.35, dur: 18000, dir: 1 },
  { r: 105, color: '#F97316', opacity: 0.40, dur: 15000, dir: -1 },
  { r:  90, color: '#FBBF24', opacity: 0.40, dur: 12000, dir: 1 },
  { r:  75, color: '#22C55E', opacity: 0.40, dur: 10000, dir: -1 },
  { r:  60, color: '#14B8A6', opacity: 0.45, dur: 9000,  dir: 1 },
  { r:  45, color: '#3B82F6', opacity: 0.45, dur: 8000,  dir: -1 },
  { r:  32, color: '#6366F1', opacity: 0.50, dur: 7000,  dir: 1 },
  { r:  20, color: '#A855F7', opacity: 0.55, dur: 6000,  dir: -1 },
  { r:  10, color: '#EC4899', opacity: 0.70, dur: 4000,  dir: 1 },
];

const MANDALA_SIZE = SW * 0.72;
const CX = MANDALA_SIZE / 2;

const ColorMandala = React.memo(() => {
  const r0 = useSharedValue(0);
  const r1 = useSharedValue(0);
  const r2 = useSharedValue(0);
  const r3 = useSharedValue(0);
  const r4 = useSharedValue(0);
  const r5 = useSharedValue(0);
  const r6 = useSharedValue(0);
  const r7 = useSharedValue(0);
  const r8 = useSharedValue(0);
  const rotations = [r0, r1, r2, r3, r4, r5, r6, r7, r8];
  const tiltX = useSharedValue(-4);
  const tiltY = useSharedValue(0);
  const pulse  = useSharedValue(0.92);

  useEffect(() => {
    MANDALA_RINGS.forEach((ring, i) => {
      rotations[i].value = withRepeat(
        withTiming(ring.dir * 360, { duration: ring.dur, easing: Easing.linear }),
        -1, false,
      );
    });
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 2400 }),
        withTiming(0.92, { duration: 2400 }),
      ), -1, false,
    );
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-20, Math.min(20, -4 + e.translationY * 0.22));
      tiltY.value = Math.max(-20, Math.min(20, e.translationX * 0.22));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-4, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: pulse.value },
    ],
  }));

  // Build petal paths per ring
  const petalPaths = (r: number, count: number, color: string, opacity: number) => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i * 360) / count;
      const rad = (angle * Math.PI) / 180;
      const px = CX + r * Math.cos(rad);
      const py = CX + r * Math.sin(rad);
      return (
        <Circle
          key={i}
          cx={px}
          cy={py}
          r={r * 0.22}
          fill={color}
          opacity={opacity * 0.6}
        />
      );
    });
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[outerStyle, { width: MANDALA_SIZE, height: MANDALA_SIZE, alignSelf: 'center', overflow: 'visible' }]}>
        <Svg width={MANDALA_SIZE} height={MANDALA_SIZE}>
          <Defs>
            <SvgRadialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <Stop offset="30%" stopColor="#F0F0FF" stopOpacity="0.7" />
              <Stop offset="65%" stopColor="#A855F7" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#06050F" stopOpacity="0" />
            </SvgRadialGradient>
            {MANDALA_RINGS.map((ring, i) => (
              <SvgLinearGradient key={`lg${i}`} id={`lg${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={ring.color} stopOpacity={String(ring.opacity + 0.1)} />
                <Stop offset="100%" stopColor={MANDALA_RINGS[(i + 1) % MANDALA_RINGS.length].color} stopOpacity={String(ring.opacity)} />
              </SvgLinearGradient>
            ))}
          </Defs>

          {/* Dark base */}
          <Circle cx={CX} cy={CX} r={130} fill="#06050F" opacity={0.6} />

          {/* Rainbow rings with petals */}
          {MANDALA_RINGS.map((ring, i) => (
            <G key={i}>
              <Circle
                cx={CX}
                cy={CX}
                r={ring.r}
                fill="none"
                stroke={ring.color}
                strokeWidth={ring.r > 60 ? 2.5 : 1.8}
                opacity={ring.opacity}
              />
              {petalPaths(ring.r, ring.r > 60 ? 8 : 6, ring.color, ring.opacity)}
            </G>
          ))}

          {/* Spoke lines */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            return (
              <Line
                key={`spoke${i}`}
                x1={CX + 12 * Math.cos(angle)}
                y1={CX + 12 * Math.sin(angle)}
                x2={CX + 125 * Math.cos(angle)}
                y2={CX + 125 * Math.sin(angle)}
                stroke="#FFFFFF"
                strokeWidth={0.5}
                opacity={0.15}
              />
            );
          })}

          {/* Central white light */}
          <Circle cx={CX} cy={CX} r={130} fill="url(#centerGlow)" />
          <Circle cx={CX} cy={CX} r={14} fill="#FFFFFF" opacity={0.9} />
          <Circle cx={CX} cy={CX} r={7} fill="#FFFFFF" opacity={1} />
        </Svg>
      </Animated.View>
    </GestureDetector>
  );
});

// ─── BACKGROUND ──────────────────────────────────────────────────────────────

const ColorTherapyBg = ({ isDark }: { isDark: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isDark
        ? ['#06030F', '#09050A', '#0D0616', '#12081A']
        : ['#FDF4FF', '#FAF0FF', '#F5E8FF', '#F0E0FF']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={700} style={[StyleSheet.absoluteFill, { opacity: isDark ? 0.12 : 0.07 }]}>
      {Array.from({ length: 18 }, (_, i) => (
        <Circle
          key={i}
          cx={(i * 113 + 30) % SW}
          cy={(i * 79 + 40) % 680}
          r={i % 4 === 0 ? 2 : 1}
          fill={THERAPY_COLORS[i % THERAPY_COLORS.length].hex}
          opacity={0.6}
        />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <Circle
          key={'ring' + i}
          cx={SW / 2}
          cy={250 + i * 60}
          r={80 + i * 30}
          fill="none"
          stroke={THERAPY_COLORS[(i * 2) % THERAPY_COLORS.length].hex}
          strokeWidth={0.6}
          opacity={0.25}
        />
      ))}
    </Svg>
  </View>
);

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

const SectionLabel = ({ label, color }: { label: string; color: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 8 }}>
    <View style={{ flex: 1, height: 1, backgroundColor: color, opacity: 0.25 }} />
    <Text style={{ color, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginHorizontal: 10 }}>
      {label}
    </Text>
    <View style={{ flex: 1, height: 1, backgroundColor: color, opacity: 0.25 }} />
  </View>
);

const FreqBadge = ({ label, value, color, isLight }: { label: string; value: string; color: string; isLight: boolean }) => (
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={{ color, fontSize: 14, fontWeight: '700' }}>{value}</Text>
    <Text style={{ color: isLight ? 'rgba(80,60,50,0.5)' : 'rgba(200,180,160,0.5)', fontSize: 10, marginTop: 2 }}>{label}</Text>
  </View>
);

const TagPill = ({ label, color }: { label: string; color: string }) => (
  <View style={{
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: color + '18', borderWidth: 1, borderColor: color + '40',
    marginRight: 6, marginBottom: 6,
  }}>
    <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{label}</Text>
  </View>
);

// ─── COLOR JOURNAL ENTRY ─────────────────────────────────────────────────────

interface ColorJournalEntry {
  date: string;
  colorId: string;
  note: string;
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export function ColorTherapyScreen({ navigation }) {
  const { t } = useTranslation();
    const userData = useAppStore(s => s.userData);
  const toggleFavoriteAffirmation = useAppStore(s => s.toggleFavoriteAffirmation);
  const favoriteItems = useAppStore(s => s.favoriteItems);
  const { currentTheme, isLight } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const isDark = !isLight;
  const accent   = '#A855F7';
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor  = isLight ? '#6A5A48' : '#B0A393';
  const cardBg    = isLight ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';

  const today = useMemo(() => new Date(), []);
  const todayColor = useMemo(() => getHealingColorForDate(today), []);

  const [selectedColor, setSelectedColor] = useState<TherapyColor | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('today');
  const [selectedMeditationColor, setSelectedMeditationColor] = useState<TherapyColor>(todayColor);
  const [meditationStep, setMeditationStep] = useState(0);
  const [isMeditating, setIsMeditating] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [breathingColor, setBreathingColor] = useState<TherapyColor>(todayColor);
  const [breathPhase, setBreathPhase] = useState<'idle'|'inhale'|'hold'|'exhale'>('idle');
  const [breathCount, setBreathCount] = useState(0);
  const breathTimer = useRef(null);
  const [journalEntries, setJournalEntries] = useState<ColorJournalEntry[]>([]);
  const [journalNote, setJournalNote] = useState('');
  const [journalColor, setJournalColor] = useState<TherapyColor>(todayColor);
  const [colorBreathTimer, setColorBreathTimer] = useState(0);
  const breathAnim = useSharedValue(0.8);
  const meditationAnim = useSharedValue(0);

  const isFavorited = useMemo(() =>
    favoriteItems?.some(f => f.id === 'ColorTherapy'),
    [favoriteItems],
  );

  const MEDITATION_STEPS = useMemo(() => [
    `Usiądź wygodnie z zamkniętymi oczami. Weź trzy głębokie oddechy i pozwól ciału się rozluźnić.`,
    `Wyobraź sobie przed sobą miękki kokon promieni w kolorze ${selectedMeditationColor.name.toLowerCase()}. Kolor ten otacza Cię delikatnie ze wszystkich stron.`,
    `Z każdym wdechem wchłaniasz kolor ${selectedMeditationColor.name.toLowerCase()} do swojego ciała. Widzisz jak wypełnia płuca, a potem cały tułów.`,
    `Kolor ${selectedMeditationColor.name.toLowerCase()} dotyka Twojej czakry ${selectedMeditationColor.chakra}. Czujesz jak energia zaczyna pulsować w tym miejscu.`,
    `${selectedMeditationColor.emotion} — pozwól tej jakości w sobie rozkwitnąć. Afirmacja: "${selectedMeditationColor.affirmation}"`,
    `Powoli wracaj do ciała. Poczuj oddech. Poczuj ziemię pod stopami. Kolor ${selectedMeditationColor.name.toLowerCase()} pozostaje jako dar dla Twojej duszy.`,
  ], [selectedMeditationColor]);

  // Breathing animation
  useEffect(() => {
    if (breathPhase === 'inhale') {
      breathAnim.value = withTiming(1.25, { duration: 4000 });
    } else if (breathPhase === 'exhale') {
      breathAnim.value = withTiming(0.75, { duration: 6000 });
    } else if (breathPhase === 'hold') {
      breathAnim.value = withTiming(1.25, { duration: 200 });
    } else {
      breathAnim.value = withTiming(0.85, { duration: 600 });
    }
  }, [breathPhase]);

  const breathAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathAnim.value }],
    opacity: interpolate(breathAnim.value, [0.75, 1.0, 1.25], [0.6, 0.9, 1.0]),
  }));

  const meditationAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(meditationAnim.value, [0, 1], [0, 1]),
    transform: [{ translateY: interpolate(meditationAnim.value, [0, 1], [10, 0]) }],
  }));

  const startColorBreath = useCallback(() => {
    if (breathPhase !== 'idle') {
      clearInterval(breathTimer.current);
      setBreathPhase('idle');
      setBreathCount(0);
      setColorBreathTimer(0);
      return;
    }
    HapticsService.notify();
    setBreathCount(0);
    const runCycle = (cycle: number) => {
      setBreathPhase('inhale');
      breathTimer.current = setTimeout(() => {
        setBreathPhase('hold');
        breathTimer.current = setTimeout(() => {
          setBreathPhase('exhale');
          breathTimer.current = setTimeout(() => {
            if (cycle >= 6) {
              setBreathPhase('idle');
              setBreathCount(7);
              HapticsService.notify();
            } else {
              setBreathCount(cycle + 1);
              runCycle(cycle + 1);
            }
          }, 6000);
        }, 1000);
      }, 4000);
    };
    runCycle(1);
  }, [breathPhase]);

  useEffect(() => () => clearInterval(breathTimer.current), []);

  const toggleSection = (id: string) => {
    setExpandedSection(prev => prev === id ? null : id);
  };

  const handleStarPress = () => {
    HapticsService.notify();
    toggleFavoriteAffirmation({
      id: 'ColorTherapy',
      label: 'Terapia Kolorem',
      sublabel: 'Chromotherapy i uzdrawianie',
      route: 'ColorTherapy',
      icon: 'Palette',
      color: accent,
      addedAt: Date.now(),
    });
  };

  const saveJournalEntry = () => {
    if (!journalNote.trim()) return;
    HapticsService.notify();
    const entry: ColorJournalEntry = {
      date: today.toISOString().split('T')[0],
      colorId: journalColor.id,
      note: journalNote.trim(),
    };
    setJournalEntries(prev => [entry, ...prev].slice(0, 30));
    setJournalNote('');
  };

  const BREATH_PHASE_LABELS = {
    idle: 'Dotknij sfery aby rozpocząć',
    inhale: 'Wdech — 4 sekundy',
    hold: 'Zatrzymaj — 1 sekunda',
    exhale: 'Wydech — 6 sekund',
  };

  const formatDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const SECTION_ITEMS = [
    { id: 'today',    label: 'KOLOR DNIA', emoji: '🌈' },
    { id: 'colors',   label: 'ENCYKLOPEDIA KOLORÓW', emoji: '🎨' },
    { id: 'meditate', label: 'MEDYTACJA KOLOREM', emoji: '🧘' },
    { id: 'prescribe',label: 'PRZEPIS KOLORYSTYCZNY', emoji: '💊' },
    { id: 'breathe',  label: 'ODDECH KOLOREM', emoji: '💨' },
    { id: 'journal',  label: 'DZIENNIK KOLORÓW', emoji: '📓' },
    { id: 'environ',  label: 'KOLORY W PRZESTRZENI', emoji: '🏠' },
    { id: 'aura',     label: 'AURA I KOLORY', emoji: '✨' },
  ];

  const ENV_ROOMS = [
    {
      room: 'Sypialnia',
      colors: ['Indygo', 'Fioletowy', 'Niebieski', 'Srebrny'],
      hexes: ['#6366F1', '#A855F7', '#3B82F6', '#94A3B8'],
      tip: 'Chłodne odcienie spowalniają myśli i przygotowują do snu. Unikaj czerwieni i pomarańczu.',
    },
    {
      room: 'Gabinet / Praca',
      colors: ['Żółty', 'Niebieski', 'Biały', 'Złoty'],
      hexes: ['#FBBF24', '#3B82F6', '#F8FAFC', '#F59E0B'],
      tip: 'Żółty pobudza kreatywność i koncentrację, niebieski minimalizuje stres przy długiej pracy.',
    },
    {
      room: 'Salon',
      colors: ['Zielony', 'Pomarańczowy', 'Złoty', 'Turkusowy'],
      hexes: ['#22C55E', '#F97316', '#F59E0B', '#14B8A6'],
      tip: 'Zieleń uspokaja i równoważy, pomarańcz sprzyja rozmowom i radosnej energii.',
    },
    {
      room: 'Kuchnia',
      colors: ['Czerwony', 'Pomarańczowy', 'Żółty'],
      hexes: ['#EF4444', '#F97316', '#FBBF24'],
      tip: 'Ciepłe kolory pobudzają apetyt i metabolizm — idealne dla przestrzeni wspólnych posiłków.',
    },
    {
      room: 'Łazienka',
      colors: ['Turkusowy', 'Niebieski', 'Biały', 'Zielony'],
      hexes: ['#14B8A6', '#3B82F6', '#F8FAFC', '#22C55E'],
      tip: 'Odcienie wody i bieli tworzą przestrzeń oczyszczenia i odnawiania energii.',
    },
    {
      room: 'Przestrzeń Rytuałów',
      colors: ['Fioletowy', 'Indygo', 'Złoty', 'Biały'],
      hexes: ['#A855F7', '#6366F1', '#F59E0B', '#F8FAFC'],
      tip: 'Fiolet i indygo pogłębiają praktykę, złoto aktywuje połączenie z boskością.',
    },
  ];

  const WARDROBE_TIPS = [
    { scenario: 'Ważna rozmowa lub prezentacja', colorName: 'Niebieski', hex: '#3B82F6', reason: 'Buduje zaufanie i spokojny autorytet' },
    { scenario: 'Randka i spotkanie romantyczne', colorName: 'Różowy', hex: '#EC4899', reason: 'Otwiera serce i emanuje delikatnym magnetyzmem' },
    { scenario: 'Rytuał lub medytacja', colorName: 'Fioletowy', hex: '#A855F7', reason: 'Wznosi wibrację i sprzyja połączeniu duchowemu' },
    { scenario: 'Potrzebujesz energii i odwagi', colorName: 'Czerwony', hex: '#EF4444', reason: 'Aktywuje wolę i siłę życiową' },
    { scenario: 'Twórczy projekt lub burza mózgów', colorName: 'Pomarańczowy', hex: '#F97316', reason: 'Odblokowuje wyobraźnię i radosną ekspresję' },
    { scenario: 'Dzień wymagający granic i ochrony', colorName: 'Turkusowy', hex: '#14B8A6', reason: 'Otacza polem ochronnym i wzmacnia odporność' },
    { scenario: 'Ceremonia lub ważne przejście', colorName: 'Biały', hex: '#F8FAFC', reason: 'Symbolizuje czystość intencji i nowy początek' },
    { scenario: 'Manifestacja i rytuał obfitości', colorName: 'Złoty', hex: '#F59E0B', reason: 'Przyciąga obfitość i wzmacnia aurę władzy' },
  ];

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={[styles.safe, {}]} edges={['top']}>

      <ColorTherapyBg isDark={!isLight} />

      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          onPress={() => goBackOrToMainTab(navigation, 'Worlds')}
          style={styles.headerBtn}
          hitSlop={10}
        >
          <ChevronLeft color={textColor} size={22} strokeWidth={2} />
        </Pressable>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Terapia Kolorem</Text>
          <Text style={[styles.headerSub, { color: subColor }]}>Chromotherapy · Uzdrawianie Światłem</Text>
        </View>

        <Pressable onPress={handleStarPress} style={styles.headerBtn} hitSlop={10}>
          <Star
            color={isFavorited ? '#FBBF24' : subColor}
            size={20}
            strokeWidth={2}
            fill={isFavorited ? '#FBBF24' : 'none'}
          />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── MANDALA HERO ──────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(700).delay(80)}>
          <View style={[styles.mandalaHeroCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.mandalaHint, { color: subColor }]}>
              Dotknij mandalę · przechyl dłonią
            </Text>
            <ColorMandala />
            <Text style={[styles.mandalaTagline, { color: textColor }]}>
              Każdy kolor to inny wymiar uzdrowienia
            </Text>
            <Text style={[styles.mandalaBody, { color: subColor }]}>
              Chromotherapy to starożytna sztuka używania świetlnych częstotliwości do harmonizowania ciała, umysłu i ducha. Każdy kolor wibruje w unikatowej częstotliwości, wpływając na konkretne czakry i aspekty naszej istoty.
            </Text>
          </View>
        </Animated.View>

        {/* ── SECTIONS ──────────────────────────────────────── */}
        {SECTION_ITEMS.map((section, sIdx) => (
          <Animated.View key={section.id} entering={FadeInDown.duration(500).delay(180 + sIdx * 60)}>
            {/* Section header toggle */}
            <Pressable
              onPress={() => toggleSection(section.id)}
              style={[styles.sectionToggle, {
                backgroundColor: cardBg,
                borderColor: expandedSection === section.id ? accent + '50' : cardBorder,
              }]}
            >
              <Text style={styles.sectionEmoji}>{section.emoji}</Text>
              <Text style={[styles.sectionToggleLabel, { color: textColor }]}>{section.label}</Text>
              <View style={[styles.sectionChevron, {
                backgroundColor: expandedSection === section.id ? accent + '20' : 'transparent',
              }]}>
                <Text style={{ color: accent, fontSize: 13, fontWeight: '700' }}>
                  {expandedSection === section.id ? '▲' : '▼'}
                </Text>
              </View>
            </Pressable>

            {/* ── TODAY'S COLOR ──────────────────────────────── */}
            {expandedSection === 'today' && section.id === 'today' && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <LinearGradient
                  colors={[todayColor.hex + '22', cardBg as any, 'transparent']}
                  style={[styles.todayCard, { borderColor: todayColor.hex + '40' }]}
                >
                  <View style={styles.todayColorDot}>
                    <View style={[styles.colorDot, { backgroundColor: todayColor.hex, width: 56, height: 56, borderRadius: 28 }]} />
                  </View>
                  <Text style={[styles.todayColorEmoji, { color: todayColor.hex }]}>{todayColor.chakraEmoji}</Text>
                  <Text style={[styles.todayColorName, { color: todayColor.hex }]}>{todayColor.name}</Text>
                  <Text style={[styles.todayColorSub, { color: subColor }]}>{todayColor.shortDesc}</Text>

                  <View style={[styles.freqRow, { borderColor: cardBorder }]}>
                    <FreqBadge label="ZAKRES" value={todayColor.range} color={todayColor.hex} isLight={isLight} />
                    <View style={[styles.freqDivider, { backgroundColor: cardBorder }]} />
                    <FreqBadge label="CZAKRA" value={todayColor.chakraEmoji} color={todayColor.hex} isLight={isLight} />
                    <View style={[styles.freqDivider, { backgroundColor: cardBorder }]} />
                    <FreqBadge label="EMOCJA" value={todayColor.emotion.split(' ')[0]} color={todayColor.hex} isLight={isLight} />
                  </View>

                  <SectionLabel label="WŁAŚCIWOŚCI LECZNICZE" color={todayColor.hex} />
                  {todayColor.healingUses.map((use, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={[styles.bullet, { backgroundColor: todayColor.hex }]} />
                      <Text style={[styles.bulletText, { color: textColor }]}>{use}</Text>
                    </View>
                  ))}

                  <SectionLabel label="JAK UŻYWAĆ DZIŚ" color={todayColor.hex} />
                  {todayColor.howToUse.map((tip, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Text style={{ color: todayColor.hex, fontSize: 13, marginRight: 8 }}>{i + 1}.</Text>
                      <Text style={[styles.bulletText, { color: subColor }]}>{tip}</Text>
                    </View>
                  ))}

                  <View style={[styles.affirmBox, { backgroundColor: todayColor.hex + '12', borderColor: todayColor.hex + '30' }]}>
                    <Text style={{ color: todayColor.hex, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>
                      AFIRMACJA DNIA
                    </Text>
                    <Text style={[styles.affirmText, { color: textColor }]}>
                      {todayColor.affirmation}
                    </Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* ── ENCYCLOPEDIA ──────────────────────────────── */}
            {expandedSection === 'colors' && section.id === 'colors' && (
              <Animated.View entering={FadeInDown.duration(400)}>
                {/* Color picker row */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                    {THERAPY_COLORS.map(tc => (
                      <Pressable
                        key={tc.id}
                        onPress={() => { HapticsService.notify(); setSelectedColor(tc); }}
                        style={[styles.colorChip, {
                          backgroundColor: tc.hex + '20',
                          borderColor: selectedColor?.id === tc.id ? tc.hex : tc.hex + '40',
                          borderWidth: selectedColor?.id === tc.id ? 2 : 1,
                        }]}
                      >
                        <View style={[styles.colorChipDot, { backgroundColor: tc.hex }]} />
                        <Text style={{ color: tc.hex, fontSize: 11, fontWeight: '600' }}>{tc.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                {/* Color detail card */}
                {selectedColor && (
                  <Animated.View entering={FadeInDown.duration(350)} key={selectedColor.id}>
                    <LinearGradient
                      colors={[selectedColor.hex + '18', cardBg as any, 'transparent']}
                      style={[styles.colorDetailCard, { borderColor: selectedColor.hex + '40' }]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <View style={[styles.colorDot, { backgroundColor: selectedColor.hex, width: 44, height: 44, borderRadius: 22, marginRight: 14 }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.colorDetailName, { color: selectedColor.hex }]}>{selectedColor.name}</Text>
                          <Text style={[styles.colorDetailSub, { color: subColor }]}>{selectedColor.shortDesc}</Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', marginBottom: 12, gap: 8 }}>
                        <View style={[styles.specChip, { backgroundColor: selectedColor.hex + '14', borderColor: selectedColor.hex + '30' }]}>
                          <Text style={{ color: selectedColor.hex, fontSize: 10, fontWeight: '700' }}>{selectedColor.range}</Text>
                        </View>
                        <View style={[styles.specChip, { backgroundColor: selectedColor.hex + '14', borderColor: selectedColor.hex + '30' }]}>
                          <Text style={{ color: selectedColor.hex, fontSize: 10, fontWeight: '700' }}>{selectedColor.chakraEmoji} {selectedColor.chakra.split('—')[0].trim()}</Text>
                        </View>
                      </View>

                      <SectionLabel label="ZASTOSOWANIA LECZNICZE" color={selectedColor.hex} />
                      {selectedColor.healingUses.map((u, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <View style={[styles.bullet, { backgroundColor: selectedColor.hex }]} />
                          <Text style={[styles.bulletText, { color: textColor }]}>{u}</Text>
                        </View>
                      ))}

                      <SectionLabel label="JAK WPROWADZIĆ DO ŻYCIA" color={selectedColor.hex} />
                      {selectedColor.howToUse.map((tip, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <Text style={{ color: selectedColor.hex, fontSize: 12, marginRight: 8 }}>✦</Text>
                          <Text style={[styles.bulletText, { color: subColor }]}>{tip}</Text>
                        </View>
                      ))}

                      <SectionLabel label="POKARMY KOLORU" color={selectedColor.hex} />
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                        {selectedColor.foods.map(f => <TagPill key={f} label={f} color={selectedColor.hex} />)}
                      </View>

                      <SectionLabel label="KAMIENIE SZLACHETNE" color={selectedColor.hex} />
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                        {selectedColor.gemstones.map(g => <TagPill key={g} label={g} color={selectedColor.hex} />)}
                      </View>

                      <View style={[styles.affirmBox, { backgroundColor: selectedColor.hex + '12', borderColor: selectedColor.hex + '30' }]}>
                        <Text style={{ color: selectedColor.hex, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>AFIRMACJA</Text>
                        <Text style={[styles.affirmText, { color: textColor }]}>{selectedColor.affirmation}</Text>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                )}

                {!selectedColor && (
                  <View style={[styles.emptyHint, { borderColor: cardBorder }]}>
                    <Text style={{ color: subColor, fontSize: 13, textAlign: 'center' }}>
                      Wybierz kolor powyżej, aby zobaczyć pełny profil terapeutyczny.
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}

            {/* ── COLOR MEDITATION ──────────────────────────── */}
            {expandedSection === 'meditate' && section.id === 'meditate' && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <View style={[styles.meditateCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.meditateIntro, { color: subColor }]}>
                    Wybierz kolor, w którego świetle chcesz się zanurzyć. Medytacja krokowa poprowadzi Cię przez wizualizację.
                  </Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                      {THERAPY_COLORS.map(tc => (
                        <Pressable
                          key={tc.id}
                          onPress={() => { HapticsService.notify(); setSelectedMeditationColor(tc); setMeditationStep(0); setIsMeditating(false); }}
                          style={[styles.colorChip, {
                            backgroundColor: tc.hex + '20',
                            borderColor: selectedMeditationColor.id === tc.id ? tc.hex : tc.hex + '40',
                            borderWidth: selectedMeditationColor.id === tc.id ? 2 : 1,
                          }]}
                        >
                          <View style={[styles.colorChipDot, { backgroundColor: tc.hex }]} />
                          <Text style={{ color: tc.hex, fontSize: 11, fontWeight: '600' }}>{tc.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>

                  {/* Meditation visualization circle */}
                  <View style={styles.meditationCircleWrap}>
                    <Svg width={160} height={160}>
                      <Defs>
                        <SvgRadialGradient id="medGlow" cx="50%" cy="50%" r="50%">
                          <Stop offset="0%" stopColor={selectedMeditationColor.hex} stopOpacity="0.9" />
                          <Stop offset="60%" stopColor={selectedMeditationColor.hex} stopOpacity="0.3" />
                          <Stop offset="100%" stopColor={selectedMeditationColor.hex} stopOpacity="0" />
                        </SvgRadialGradient>
                      </Defs>
                      <Circle cx={80} cy={80} r={72} fill="url(#medGlow)" />
                      <Circle cx={80} cy={80} r={50} fill={selectedMeditationColor.hex} opacity={0.25} />
                      <Circle cx={80} cy={80} r={30} fill={selectedMeditationColor.hex} opacity={0.45} />
                      <Circle cx={80} cy={80} r={14} fill={selectedMeditationColor.hex} opacity={0.85} />
                    </Svg>
                    <Text style={[styles.meditationColorLabel, { color: selectedMeditationColor.hex }]}>
                      {selectedMeditationColor.name}
                    </Text>
                    <Text style={[styles.meditationChakraLabel, { color: subColor }]}>
                      {selectedMeditationColor.chakraEmoji} {selectedMeditationColor.chakra}
                    </Text>
                  </View>

                  {/* Step display */}
                  {isMeditating && (
                    <View style={[styles.meditationStep, { backgroundColor: selectedMeditationColor.hex + '12', borderColor: selectedMeditationColor.hex + '30' }]}>
                      <Text style={{ color: selectedMeditationColor.hex, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>
                        KROK {meditationStep + 1} / {MEDITATION_STEPS.length}
                      </Text>
                      <Text style={[styles.meditationStepText, { color: textColor }]}>
                        {MEDITATION_STEPS[meditationStep]}
                      </Text>
                    </View>
                  )}

                  {/* Controls */}
                  <View style={styles.meditationControls}>
                    {!isMeditating ? (
                      <Pressable
                        onPress={() => {
                          HapticsService.notify();
                          setIsMeditating(true);
                          setMeditationStep(0);
                          void AudioService.playAmbientForSession('forest');
                        }}
                        style={[styles.meditationBtn, { backgroundColor: selectedMeditationColor.hex }]}
                      >
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Rozpocznij Medytację</Text>
                      </Pressable>
                    ) : (
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        {meditationStep > 0 && (
                          <Pressable
                            onPress={() => { HapticsService.notify(); setMeditationStep(s => s - 1); }}
                            style={[styles.meditationBtnSmall, { borderColor: selectedMeditationColor.hex + '60', backgroundColor: 'transparent' }]}
                          >
                            <Text style={{ color: selectedMeditationColor.hex, fontSize: 13, fontWeight: '600' }}>← Wstecz</Text>
                          </Pressable>
                        )}
                        {meditationStep < MEDITATION_STEPS.length - 1 ? (
                          <Pressable
                            onPress={() => { HapticsService.notify(); setMeditationStep(s => s + 1); }}
                            style={[styles.meditationBtnSmall, { backgroundColor: selectedMeditationColor.hex }]}
                          >
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Dalej →</Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            onPress={() => {
                              HapticsService.notify();
                              setIsMeditating(false);
                              setMeditationStep(0);
                              void AudioService.stopSessionAudioImmediately();
                            }}
                            style={[styles.meditationBtnSmall, { backgroundColor: selectedMeditationColor.hex }]}
                          >
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>✓ Zakończ</Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </Animated.View>
            )}

            {/* ── COLOR PRESCRIPTION ────────────────────────── */}
            {expandedSection === 'prescribe' && section.id === 'prescribe' && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.prescribeIntro, { color: subColor }]}>
                    Wybierz to, co Cię dręczy — dobierzemy kolor leczniczy dopasowany do Twojego stanu.
                  </Text>
                  {PRESCRIPTIONS.map((p, i) => {
                    const Icon = p.icon;
                    const isSelected = selectedPrescription?.id === p.id;
                    return (
                      <Animated.View key={p.id} entering={FadeInDown.duration(300).delay(i * 40)}>
                        <Pressable
                          onPress={() => { HapticsService.notify(); setSelectedPrescription(isSelected ? null : p); }}
                          style={[styles.prescriptionRow, {
                            backgroundColor: isSelected ? accent + '14' : 'transparent',
                            borderColor: isSelected ? accent + '50' : cardBorder,
                          }]}
                        >
                          <View style={[styles.prescriptionIcon, { backgroundColor: accent + '18' }]}>
                            <Icon color={accent} size={18} strokeWidth={2} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.prescriptionLabel, { color: textColor }]}>{p.label}</Text>
                            <Text style={[styles.prescriptionDesc, { color: subColor }]}>{p.desc}</Text>
                          </View>
                          <Text style={{ color: accent, fontSize: 14 }}>{isSelected ? '▲' : '▼'}</Text>
                        </Pressable>

                        {isSelected && (
                          <Animated.View entering={FadeInDown.duration(280)}>
                            <View style={[styles.prescriptionResult, { backgroundColor: accent + '08', borderColor: accent + '30' }]}>
                              <Text style={{ color: accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 }}>
                                PRZEPISANE KOLORY
                              </Text>
                              {p.colorIds.map((cid, ci) => {
                                const c = THERAPY_COLORS.find(t => t.id === cid);
                                if (!c) return null;
                                return (
                                  <View key={cid} style={[styles.prescribedColorRow, { borderColor: c.hex + '30' }]}>
                                    <View style={[styles.colorDot, { backgroundColor: c.hex, width: 32, height: 32, borderRadius: 16, marginRight: 12 }]} />
                                    <View style={{ flex: 1 }}>
                                      <Text style={[styles.prescribedColorName, { color: c.hex }]}>{ci + 1}. {c.name}</Text>
                                      <Text style={[styles.prescribedColorHint, { color: subColor }]}>{c.shortDesc}</Text>
                                    </View>
                                    <Text style={{ color: c.hex, fontSize: 10, fontWeight: '700' }}>{c.chakraEmoji}</Text>
                                  </View>
                                );
                              })}
                            </View>
                          </Animated.View>
                        )}
                      </Animated.View>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* ── COLOR BREATHING ───────────────────────────── */}
            {expandedSection === 'breathe' && section.id === 'breathe' && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.prescribeIntro, { color: subColor }]}>
                    Podczas wdechu wchłaniasz wybrany kolor leczniczy. Podczas wydechu uwalniasz szarość napięcia.
                  </Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                      {THERAPY_COLORS.map(tc => (
                        <Pressable
                          key={tc.id}
                          onPress={() => { if (breathPhase !== 'idle') return; HapticsService.notify(); setBreathingColor(tc); }}
                          style={[styles.colorChip, {
                            backgroundColor: tc.hex + '20',
                            borderColor: breathingColor.id === tc.id ? tc.hex : tc.hex + '40',
                            borderWidth: breathingColor.id === tc.id ? 2 : 1,
                          }]}
                        >
                          <View style={[styles.colorChipDot, { backgroundColor: tc.hex }]} />
                          <Text style={{ color: tc.hex, fontSize: 11, fontWeight: '600' }}>{tc.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>

                  {/* Breath sphere */}
                  <View style={{ alignItems: 'center', marginVertical: 16 }}>
                    <Pressable onPress={startColorBreath} hitSlop={16}>
                      <Animated.View style={[breathAnimStyle]}>
                        <Svg width={180} height={180}>
                          <Defs>
                            <SvgRadialGradient id="breathGlow" cx="50%" cy="50%" r="50%">
                              <Stop offset="0%" stopColor={breathingColor.hex} stopOpacity={breathPhase === 'idle' ? '0.6' : '0.95'} />
                              <Stop offset="50%" stopColor={breathingColor.hex} stopOpacity="0.35" />
                              <Stop offset="100%" stopColor={breathingColor.hex} stopOpacity="0" />
                            </SvgRadialGradient>
                          </Defs>
                          <Circle cx={90} cy={90} r={80} fill="url(#breathGlow)" />
                          <Circle cx={90} cy={90} r={54} fill={breathingColor.hex} opacity={breathPhase === 'idle' ? 0.25 : 0.5} />
                          <Circle cx={90} cy={90} r={32} fill={breathingColor.hex} opacity={breathPhase === 'idle' ? 0.4 : 0.8} />
                          <Circle cx={90} cy={90} r={12} fill="#FFFFFF" opacity={0.7} />
                        </Svg>
                      </Animated.View>
                    </Pressable>
                    <Text style={[styles.breathPhaseLabel, { color: breathingColor.hex }]}>
                      {BREATH_PHASE_LABELS[breathPhase]}
                    </Text>
                    {breathPhase === 'inhale' && (
                      <Text style={[styles.breathHint, { color: subColor }]}>
                        Wchłaniasz {breathingColor.name.toLowerCase()} — {breathingColor.emotion.toLowerCase()}
                      </Text>
                    )}
                    {breathPhase === 'exhale' && (
                      <Text style={[styles.breathHint, { color: subColor }]}>
                        Uwalniasz szarość napięcia i stresu
                      </Text>
                    )}
                    {breathCount > 0 && breathPhase === 'idle' && (
                      <Text style={{ color: accent, fontSize: 12, fontWeight: '600', marginTop: 8 }}>
                        {breathCount >= 7 ? '✓ Sesja zakończona — 6 oddechów koloru' : `Cykl ${breathCount} / 6`}
                      </Text>
                    )}
                  </View>

                  {/* Schema */}
                  <View style={[styles.breathSchema, { borderColor: cardBorder }]}>
                    <View style={styles.breathSchemaItem}>
                      <View style={[styles.breathSchemaDot, { backgroundColor: breathingColor.hex }]} />
                      <Text style={{ color: textColor, fontSize: 12 }}>Wdech 4s — kolor {breathingColor.name.toLowerCase()}</Text>
                    </View>
                    <View style={styles.breathSchemaItem}>
                      <View style={[styles.breathSchemaDot, { backgroundColor: '#9CA3AF' }]} />
                      <Text style={{ color: subColor, fontSize: 12 }}>Zatrzymaj 1s</Text>
                    </View>
                    <View style={styles.breathSchemaItem}>
                      <View style={[styles.breathSchemaDot, { backgroundColor: '#6B7280' }]} />
                      <Text style={{ color: subColor, fontSize: 12 }}>Wydech 6s — uwalniasz szarość</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* ── COLOR JOURNAL ─────────────────────────────── */}
            {expandedSection === 'journal' && section.id === 'journal' && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.prescribeIntro, { color: subColor }]}>
                    Notuj do jakich kolorów jesteś dziś przyciągana/y — Twoje ciało zawsze wie czego potrzebuje.
                  </Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                      {THERAPY_COLORS.map(tc => (
                        <Pressable
                          key={tc.id}
                          onPress={() => { HapticsService.notify(); setJournalColor(tc); }}
                          style={[styles.colorChip, {
                            backgroundColor: tc.hex + '20',
                            borderColor: journalColor.id === tc.id ? tc.hex : tc.hex + '40',
                            borderWidth: journalColor.id === tc.id ? 2 : 1,
                          }]}
                        >
                          <View style={[styles.colorChipDot, { backgroundColor: tc.hex }]} />
                          <Text style={{ color: tc.hex, fontSize: 11, fontWeight: '600' }}>{tc.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>

                  <TextInput
                    value={journalNote}
                    onChangeText={setJournalNote}
                    placeholder={`Dlaczego ${journalColor.name.toLowerCase()} mnie dziś przyciąga?`}
                    placeholderTextColor={subColor}
                    multiline
                    style={[styles.journalInput, {
                      color: textColor,
                      backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.05)',
                      borderColor: journalColor.hex + '40',
                    }]}
                  />

                  <Pressable
                    onPress={saveJournalEntry}
                    style={[styles.journalSaveBtn, { backgroundColor: journalColor.hex, opacity: journalNote.trim() ? 1 : 0.4 }]}
                  >
                    <BookOpen color="#fff" size={16} strokeWidth={2} />
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8 }}>Zapisz w dzienniku</Text>
                  </Pressable>

                  {journalEntries.length > 0 && (
                    <>
                      <SectionLabel label="HISTORIA" color={accent} />
                      {journalEntries.map((entry, i) => {
                        const c = THERAPY_COLORS.find(t => t.id === entry.colorId);
                        return (
                          <View key={i} style={[styles.journalHistoryRow, { borderColor: c?.hex + '30' || cardBorder }]}>
                            <View style={[styles.colorDot, { backgroundColor: c?.hex || accent, width: 28, height: 28, borderRadius: 14, marginRight: 10 }]} />
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                                <Text style={{ color: c?.hex || accent, fontSize: 12, fontWeight: '700' }}>{c?.name}</Text>
                                <Text style={{ color: subColor, fontSize: 11 }}>{formatDate(entry.date)}</Text>
                              </View>
                              <Text style={{ color: subColor, fontSize: 12, lineHeight: 18 }}>{entry.note}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </>
                  )}
                </View>
              </Animated.View>
            )}

            {/* ── ENVIRONMENTAL GUIDE ───────────────────────── */}
            {expandedSection === 'environ' && section.id === 'environ' && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.prescribeIntro, { color: subColor }]}>
                    Przestrzeń, w której żyjesz, nieustannie cię barwi. Oto jak używać kolorów w domu i szafie jako narzędzi uzdrowienia.
                  </Text>

                  <SectionLabel label="KOLORY W POMIESZCZENIACH" color={accent} />
                  {ENV_ROOMS.map((room, i) => (
                    <Animated.View key={room.room} entering={FadeInDown.duration(280).delay(i * 50)}>
                      <View style={[styles.roomCard, { backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)', borderColor: cardBorder }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={[styles.roomName, { color: textColor }]}>{room.room}</Text>
                          <View style={{ flexDirection: 'row', gap: 5 }}>
                            {room.hexes.map((hex, hi) => (
                              <View key={hi} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: hex }} />
                            ))}
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                          {room.colors.map((c, ci) => (
                            <TagPill key={ci} label={c} color={room.hexes[ci % room.hexes.length]} />
                          ))}
                        </View>
                        <Text style={{ color: subColor, fontSize: 12, lineHeight: 18 }}>{room.tip}</Text>
                      </View>
                    </Animated.View>
                  ))}

                  <SectionLabel label="KOLORY W SZAFIE — DOBÓR NA OKAZJĘ" color={accent} />
                  {WARDROBE_TIPS.map((wt, i) => (
                    <Animated.View key={wt.scenario} entering={FadeInDown.duration(280).delay(i * 40)}>
                      <View style={[styles.wardrobeRow, { borderColor: wt.hex + '30' }]}>
                        <View style={[styles.colorDot, { backgroundColor: wt.hex, width: 36, height: 36, borderRadius: 18, marginRight: 12 }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.wardrobeScenario, { color: textColor }]}>{wt.scenario}</Text>
                          <Text style={{ color: wt.hex, fontSize: 12, fontWeight: '700', marginTop: 2 }}>{wt.colorName}</Text>
                          <Text style={{ color: subColor, fontSize: 11, marginTop: 2 }}>{wt.reason}</Text>
                        </View>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* ── AURA LINK ─────────────────────────────────── */}
            {expandedSection === 'aura' && section.id === 'aura' && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.prescribeIntro, { color: subColor }]}>
                    Twoja aura emanuje kolorami, które odzwierciedlają stan energetyczny ciała i duszy. Odkryj dominujący kolor swojego pola energetycznego.
                  </Text>

                  <View style={[styles.auraPreview, { borderColor: accent + '40' }]}>
                    <Svg width={120} height={120}>
                      <Defs>
                        <SvgRadialGradient id="auraGrad" cx="50%" cy="50%" r="50%">
                          {THERAPY_COLORS.map((tc, i) => (
                            <Stop
                              key={tc.id}
                              offset={`${(i / (THERAPY_COLORS.length - 1)) * 100}%`}
                              stopColor={tc.hex}
                              stopOpacity={0.35 - i * 0.02}
                            />
                          ))}
                        </SvgRadialGradient>
                      </Defs>
                      <Circle cx={60} cy={60} r={55} fill="url(#auraGrad)" />
                      <Circle cx={60} cy={60} r={28} fill={accent} opacity={0.4} />
                      <Circle cx={60} cy={60} r={14} fill={accent} opacity={0.7} />
                      <Circle cx={60} cy={60} r={6} fill="#FFFFFF" opacity={0.9} />
                    </Svg>
                  </View>

                  <Text style={[styles.auraDesc, { color: subColor }]}>
                    Każda czakra emituje kolor. Gdy jesteś w równowadze, Twoja aura emanuje czystymi, jasnymi barwami. Blokady pojawiają się jako zaciemnione lub błotniste odcienie.
                  </Text>

                  {THERAPY_COLORS.slice(0, 7).map((tc, i) => (
                    <View key={tc.id} style={[styles.auraColorRow, { borderColor: tc.hex + '25' }]}>
                      <View style={[styles.colorDot, { backgroundColor: tc.hex, width: 26, height: 26, borderRadius: 13, marginRight: 10 }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: tc.hex, fontSize: 13, fontWeight: '700' }}>{tc.name} {tc.chakraEmoji}</Text>
                        <Text style={{ color: subColor, fontSize: 11, lineHeight: 16 }}>
                          {tc.chakra} · {tc.emotion}
                        </Text>
                      </View>
                    </View>
                  ))}

                  <Pressable
                    onPress={() => { HapticsService.notify(); navigation.navigate('AuraReading'); }}
                    style={[styles.auraBtn, { backgroundColor: accent }]}
                  >
                    <Sparkles color="#fff" size={16} strokeWidth={2} />
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8 }}>
                      Odczytaj kolor swojej aury
                    </Text>
                    <ArrowRight color="#fff" size={16} strokeWidth={2} style={{ marginLeft: 4 }} />
                  </Pressable>
                </View>
              </Animated.View>
            )}

          </Animated.View>
        ))}

        <EndOfContentSpacer size="standard" />
      </ScrollView>
        </SafeAreaView>
</View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen,
    paddingVertical: 10,
    gap: 8,
  },
  headerBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  mandalaHeroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    paddingTop: 14,
    marginBottom: 16,
    alignItems: 'center',
    overflow: 'visible',
  },
  mandalaHint: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '500',
    marginBottom: 14,
  },
  mandalaTagline: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  mandalaBody: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  sectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  sectionEmoji: {
    fontSize: 18,
  },
  sectionToggleLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  sectionChevron: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
  },
  todayColorDot: {
    alignItems: 'center',
    marginBottom: 8,
  },
  colorDot: {},
  todayColorEmoji: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 4,
  },
  todayColorName: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  todayColorSub: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 19,
  },
  freqRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  freqDivider: {
    width: 1,
  },
  affirmBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 8,
  },
  affirmText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
    paddingRight: 4,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },
  colorChipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  colorDetailCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  colorDetailName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  colorDetailSub: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  specChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  emptyHint: {
    borderWidth: 1,
    borderRadius: 14,
    borderStyle: 'dashed',
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  meditateCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  meditateIntro: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  meditationCircleWrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  meditationColorLabel: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  meditationChakraLabel: {
    fontSize: 11,
    marginTop: 3,
  },
  meditationStep: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginVertical: 14,
  },
  meditationStepText: {
    fontSize: 14,
    lineHeight: 22,
  },
  meditationControls: {
    alignItems: 'center',
    marginTop: 4,
  },
  meditationBtn: {
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 16,
  },
  meditationBtnSmall: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: 1.5,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  prescribeIntro: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  prescriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  prescriptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prescriptionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  prescriptionDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  prescriptionResult: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  prescribedColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  prescribedColorName: {
    fontSize: 13,
    fontWeight: '700',
  },
  prescribedColorHint: {
    fontSize: 11,
    marginTop: 2,
  },
  breathPhaseLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  breathHint: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  breathSchema: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  breathSchemaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breathSchemaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  journalInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 90,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  journalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    marginBottom: 12,
  },
  journalHistoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  roomCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  roomName: {
    fontSize: 14,
    fontWeight: '700',
  },
  wardrobeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  wardrobeScenario: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  auraPreview: {
    alignSelf: 'center',
    borderRadius: 70,
    borderWidth: 1,
    marginVertical: 14,
  },
  auraDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
    textAlign: 'center',
  },
  auraColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  auraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 16,
  },
});
