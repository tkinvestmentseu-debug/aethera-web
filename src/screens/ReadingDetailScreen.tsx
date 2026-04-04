// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Share,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  FadeInDown,
  FadeInUp,
  FadeIn,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Path,
  G,
  Line,
  Rect,
  Text as SvgText,
  Defs,
  RadialGradient as SvgRadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
  Polygon,
} from 'react-native-svg';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { useTarotStore } from '../features/tarot/store/useTarotStore';
import { useJournalStore } from '../store/useJournalStore';
import {
  Star,
  ChevronLeft,
  Share2,
  BookOpen,
  RotateCw,
  Sparkles,
  Moon,
  Sun,
  Flame,
  Droplets,
  Wind,
  Mountain,
  Wand2,
  Heart,
  Briefcase,
  Brain,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Layers,
  Crown,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const CARD_W = SW - layout.padding.screen * 2;
const TAROT_CARD_W = 200;
const TAROT_CARD_H = 320;

// ─── Roman numeral helper ─────────────────────────────────────────────────────

const toRoman = (n: number): string => {
  if (!n || n <= 0 || n > 21) return '';
  const vals = [10, 9, 5, 4, 1];
  const syms = ['X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  let num = n;
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) { result += syms[i]; num -= vals[i]; }
  }
  return result;
};

// ─── Card suit data ───────────────────────────────────────────────────────────

const SUIT_DATA: Record<string, { color: string; element: string; elementIcon: string; meaning: string }> = {
  wands:    { color: '#F59E0B', element: 'Ogień', elementIcon: '🔥', meaning: 'Wola, ambicja, kreatywność i duch przedsiębiorczości' },
  cups:     { color: '#60A5FA', element: 'Woda', elementIcon: '💧', meaning: 'Emocje, intuicja, relacje i przepływ uczuć' },
  swords:   { color: '#A78BFA', element: 'Powietrze', elementIcon: '💨', meaning: 'Umysł, komunikacja, konflikty i prawda' },
  pentacles:{ color: '#34D399', element: 'Ziemia', elementIcon: '🌿', meaning: 'Materia, ciało, finanse i manifestacja' },
  major:    { color: GOLD,      element: 'Eter',  elementIcon: '✦',  meaning: 'Wielkie arkana — energie archetypiczne i karmiczne lekcje' },
};

const getSuitData = (cardName: string, arcanaType: string) => {
  if (arcanaType === 'major') return SUIT_DATA.major;
  const n = cardName.toLowerCase();
  if (n.includes('wand') || n.includes('różdżk')) return SUIT_DATA.wands;
  if (n.includes('cup') || n.includes('kielich')) return SUIT_DATA.cups;
  if (n.includes('sword') || n.includes('miecz')) return SUIT_DATA.swords;
  if (n.includes('pentacle') || n.includes('pentakl') || n.includes('denar')) return SUIT_DATA.pentacles;
  return SUIT_DATA.major;
};

// ─── Arcana type resolver ─────────────────────────────────────────────────────

const getArcanaType = (cardNumber: number | undefined): 'major' | 'minor' => {
  if (cardNumber !== undefined && cardNumber >= 0 && cardNumber <= 21) return 'major';
  return 'minor';
};

// ─── Tarot keyword themes ─────────────────────────────────────────────────────

const CARD_KEYWORDS: Record<string, string[]> = {
  fool:        ['Nowy początek', 'Spontaniczność', 'Wolność', 'Naiwność', 'Odwaga'],
  magician:    ['Wola', 'Sprawczość', 'Manifest', 'Umiejętności', 'Alchemia'],
  priestess:   ['Intuicja', 'Tajemnica', 'Nieświadomość', 'Cisza', 'Mądrość'],
  empress:     ['Obfitość', 'Płodność', 'Natura', 'Troska', 'Zmysłowość'],
  emperor:     ['Struktura', 'Władza', 'Stabilność', 'Ojcostwo', 'Dyscyplina'],
  hierophant:  ['Tradycja', 'Nauczyciel', 'Doktryna', 'Rytuał', 'Instytucja'],
  lovers:      ['Miłość', 'Wybór', 'Wartości', 'Związek', 'Harmonia'],
  chariot:     ['Determinacja', 'Kontrola', 'Sukces', 'Podróż', 'Opanowanie'],
  strength:    ['Siła wewnętrzna', 'Odwaga', 'Cierpliwość', 'Łagodność', 'Wiara'],
  hermit:      ['Samotność', 'Refleksja', 'Poszukiwanie', 'Światło', 'Przewodnik'],
  wheel:       ['Los', 'Cykle', 'Zmiana', 'Karma', 'Obrót'],
  justice:     ['Prawda', 'Prawo', 'Równowaga', 'Karma', 'Odpowiedzialność'],
  hanged:      ['Ofiara', 'Oczekiwanie', 'Inny kąt', 'Zawieszenie', 'Oświecenie'],
  death:       ['Transformacja', 'Zakończenie', 'Przejście', 'Zmiana', 'Odrodzenie'],
  temperance:  ['Harmonia', 'Balans', 'Umiarkowanie', 'Cierpliwość', 'Alchemia'],
  devil:       ['Przywiązanie', 'Iluzja', 'Materializm', 'Cień', 'Wyzwolenie'],
  tower:       ['Rewolucja', 'Objawienie', 'Chaos', 'Rozpad', 'Wolność'],
  star:        ['Nadzieja', 'Inspiracja', 'Uzdrowienie', 'Gwiazdy', 'Wiara'],
  moon:        ['Iluzja', 'Lęk', 'Podświadomość', 'Intuicja', 'Cykl'],
  sun:         ['Radość', 'Sukces', 'Jasność', 'Dziecięcość', 'Energia'],
  judgment:    ['Przebudzenie', 'Odrodzenie', 'Powołanie', 'Przebaczenie', 'Ocena'],
  world:       ['Spełnienie', 'Integracja', 'Pełnia', 'Podróż', 'Zwieńczenie'],
};

const getKeywords = (cardName: string): string[] => {
  const n = cardName.toLowerCase();
  for (const [key, kws] of Object.entries(CARD_KEYWORDS)) {
    if (n.includes(key)) return kws;
  }
  return ['Przemiana', 'Refleksja', 'Energia', 'Intuicja', 'Ścieżka'];
};

// ─── Interpretation tab data ──────────────────────────────────────────────────

const INTERP_TABS = [
  { id: 'general',     label: 'OGÓLNE',       icon: Sparkles,  color: GOLD },
  { id: 'love',        label: 'MIŁOŚĆ',        icon: Heart,     color: '#F472B6' },
  { id: 'career',      label: 'KARIERA',       icon: Briefcase, color: '#60A5FA' },
  { id: 'spirit',      label: 'DUCHOWOŚĆ',     icon: Moon,      color: '#A78BFA' },
  { id: 'reversed',    label: 'ODWRÓCONA',     icon: RotateCw,  color: '#F59E0B' },
];

const buildInterpretations = (cardName: string, isReversed: boolean): Record<string, string> => {
  const n = cardName.toLowerCase();

  const general = (() => {
    if (n.includes('fool') || n.includes('głupiec'))
      return 'Głupiec zaprasza Cię do skoku w nieznane. Czas porzucić to, co znane, i zaufać podróży. Niezaplanowane początki często okazują się najpiękniejszymi.';
    if (n.includes('magician') || n.includes('mag'))
      return 'Masz wszystkie narzędzia, których potrzebujesz. Magia nie jest w przedmiotach — jest w Twojej intencji i skoncentrowanej woli. Działaj teraz.';
    if (n.includes('death') || n.includes('śmierć'))
      return 'To nie koniec — to transformacja. Karta Śmierci oznacza wielkie przejście: coś musi umrzeć, by nowe mogło narodzić się w pełnej mocy.';
    if (n.includes('lovers') || n.includes('zakochan') || n.includes('kochank'))
      return 'Stanąłeś przed ważnym wyborem — nie tylko w miłości, ale w wartościach. Karta Zakochanych pyta: co naprawdę cenisz? Wybierz z serca, nie z lęku.';
    if (n.includes('star') || n.includes('gwiazda'))
      return 'Po ciemności zawsze przychodzi gwiazda. Ten kard niesie nadzieję i uzdrowienie — zaufaj, że wszechświat ma plan lepszy niż ten, który sobie wyobrażasz.';
    if (n.includes('moon') || n.includes('księżyc'))
      return 'Nie wszystko jest takie, jakim się wydaje. Księżyc odsłania to, co ukryte — iluzje, lęki, nieświadome wzorce. Czas przyglądnąć się temu, czego unikasz.';
    if (n.includes('sun') || n.includes('słońce'))
      return 'Radość, sukces i jasność — Słońce przynosi najlepszą energię tarota. Twoje starania zostaną nagrodzone, a Twoje światło zaczyna świecić jasno.';
    return 'Ta karta zaprasza Cię do głębszego spojrzenia na sytuację. Jej energia wskazuje na obszar wymagający świadomej uwagi i intencjonalnego działania.';
  })();

  const love = (() => {
    if (n.includes('lovers') || n.includes('zakochan'))
      return 'W miłości karta ta sugeruje ważny wybór lub szczyt połączenia. Związek może wkroczyć na nowy poziom głębi — ale tylko gdy obie strony są szczere wobec siebie.';
    if (n.includes('moon') || n.includes('księżyc'))
      return 'W miłości Księżyc ostrzega przed złudzeniami. Możliwe, że partner lub Ty sami nie pokazujecie prawdziwego oblicza. Komunikacja i szczerość są kluczowe.';
    if (n.includes('empress') || n.includes('cesarzow'))
      return 'Cesarzowa w miłości oznacza czas rozkwitu — troskliwych związków, zmysłowości i obfitości uczuć. Pozwól sobie kochać i być kochanym/ą bez warunków.';
    if (n.includes('tower') || n.includes('wieża'))
      return 'Wieża może oznaczać wstrząs w związku — objawienie, które coś zmienia na zawsze. Choć bolesne, odsłania prawdę i tworzy przestrzeń dla autentycznej miłości.';
    return 'W sferze miłości ta karta wskazuje na potrzebę autentyczności i otwartości. Czas wyrazić to, co czujesz, i wysłuchać tego, czego nie jest powiedziane wprost.';
  })();

  const career = (() => {
    if (n.includes('magician') || n.includes('mag'))
      return 'W pracy Mag oznacza czas manifestacji. Twoje umiejętności są gotowe — zacznij działać, bo warunki nigdy nie będą idealne. Sprawczość jest teraz w Twoich rękach.';
    if (n.includes('emperor') || n.includes('cesarz'))
      return 'Cesarz w karierze sugeruje czas budowania struktur, przywódczości i odpowiedzialności. Możliwy awans lub nowa rola wymagająca dojrzałości i dyscypliny.';
    if (n.includes('wheel') || n.includes('koło'))
      return 'Koło Fortuny w karierze zapowiada zmianę — nowe możliwości lub nieoczekiwane zwroty. Bądź elastyczny/a i gotowy/a skorzystać z szansy, gdy się pojawi.';
    if (n.includes('hermit') || n.includes('pustelnik'))
      return 'Pustelnik w pracy sugeruje potrzebę wyciszenia i refleksji nad swoją ścieżką zawodową. Czas samodzielnej pracy, głębokiego skupienia i wewnętrznego przewodnictwa.';
    return 'W karierze ta karta wskazuje na ważny moment decyzji lub działania. Kieruj się wartościami, nie tylko wynikami — autentyczna praca przynosi trwały sukces.';
  })();

  const spirit = (() => {
    if (n.includes('priestess') || n.includes('papieżyca'))
      return 'Kapłanka to mistyczka tarota. Jej obecność zaprasza do pogłębienia praktyki intuicji, medytacji i słuchania głosu duszy. Odpowiedzi są w ciszy, nie w hałasie świata.';
    if (n.includes('hermit') || n.includes('pustelnik'))
      return 'Pustelnik w duchowości to zaproszenie do odosobnienia i poszukiwania wewnętrznego światła. Nauczyciel jest w środku — szukaj go w ciszy, samotności i refleksji.';
    if (n.includes('world') || n.includes('świat'))
      return 'Świat oznacza integrację — wszystkich aspektów siebie, wszystkich doświadczeń, wszystkich lekcji. Jesteś bliski/a pełni cyklu i możesz poczuć sakralną całość.';
    if (n.includes('judgment') || n.includes('sąd'))
      return 'Sąd Ostateczny to duchowe przebudzenie — usłyszenie wewnętrznego wołania i odpowiedź na powołanie. Czas zaakceptować siebie w pełni i wkroczyć w nowy etap świadomości.';
    return 'Duchowo ta karta zaprasza do głębszego badania swojej wewnętrznej prawdy. Jakie przekonania cię ograniczają? Co chcesz zintegrować na ścieżce świadomości?';
  })();

  const reversed = isReversed
    ? (() => {
        return `W pozycji odwróconej energia tej karty ulega interioryzacji lub blokadzie. ${general.replace('Czas', 'Zamiast działać').slice(0, 80)}... Sprawdź, czemu ta energia jest zablokowana lub skierowana do wewnątrz. Często odwrócona karta wskazuje na opór wobec lekcji, którą niesie jej prosta pozycja.`;
      })()
    : 'Ta karta w pozycji prostej działa w pełnej, zewnętrznej mocy. Jej odwrócona interpretacja mogłaby sugerować wewnętrzny wymiar tej samej energii lub opór przed jej przyjęciem.';

  return { general, love, career, spirit, reversed };
};

// ─── Affirmation for card ─────────────────────────────────────────────────────

const getCardAffirmation = (cardName: string): string => {
  const n = cardName.toLowerCase();
  if (n.includes('fool') || n.includes('głupiec')) return 'Ufam procesowi życia. Każdy nowy początek jest zaproszeniem do odkrycia siebie na nowo. Staję z otwartym sercem wobec nieznanego.';
  if (n.includes('magician') || n.includes('mag')) return 'Mam wszystko, czego potrzebuję, by tworzyć swoje życie. Moja wola jest czysta, moje intencje jasne, a moje działania pełne mocy.';
  if (n.includes('star') || n.includes('gwiazda')) return 'Ufam, że wszechświat działa dla mojego dobra. Nadzieja jest moim codziennym aktem wiary. Jestem prowadzony/a do mojego przeznaczenia.';
  if (n.includes('sun') || n.includes('słońce')) return 'Moje serce jest pełne radości i wdzięczności. Świecę własnym światłem i pozwalam innym cieszyć się moim ciepłem.';
  if (n.includes('moon') || n.includes('księżyc')) return 'Akceptuję tajemnicę i cień jako część mojej pełni. Moja intuicja jest moim kompasem w ciemności.';
  if (n.includes('death') || n.includes('śmierć')) return 'Witam zmiany z otwartymi ramionami. Każde zakończenie rodzi nowy początek. Transformacja jest moją naturą.';
  if (n.includes('lovers') || n.includes('zakochan')) return 'Wybieram miłość — do siebie i innych. Moje relacje opierają się na autentyczności i wzajemnym szanowaniu.';
  return 'Jestem na właściwej ścieżce. Każda karta jest zwierciadłem mojej duszy — patrzę w nie z odwagą i ciekawością.';
};

// ─── Related cards data ───────────────────────────────────────────────────────

const RELATED_CARDS = [
  { name: 'Kapłanka', emoji: '🌙', color: '#818CF8', desc: 'Intuicja i tajemnica' },
  { name: 'Cesarzowa', emoji: '🌸', color: '#F472B6', desc: 'Obfitość i płodność' },
  { name: 'Koło Fortuny', emoji: '⚙️', color: '#F59E0B', desc: 'Cykl i los' },
  { name: 'Gwiazda', emoji: '⭐', color: '#60A5FA', desc: 'Nadzieja i uzdrowienie' },
  { name: 'Moc', emoji: '🦁', color: '#EF4444', desc: 'Siła i łagodność' },
  { name: 'Świat', emoji: '🌍', color: '#34D399', desc: 'Pełnia i integracja' },
];

const getRelatedCards = (cardName: string) => {
  // Return 3 pseudo-random related cards based on card name hash
  const hash = cardName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const i1 = hash % RELATED_CARDS.length;
  const i2 = (hash + 2) % RELATED_CARDS.length;
  const i3 = (hash + 4) % RELATED_CARDS.length;
  return [RELATED_CARDS[i1], RELATED_CARDS[i2], RELATED_CARDS[i3]];
};

// ─── 3D Tarot Card Viewer ─────────────────────────────────────────────────────

const TarotCard3D = ({
  cardName,
  isReversed,
  suitColor,
  arcanaType,
  cardNumber,
  isLight,
}: {
  cardName: string; isReversed: boolean; suitColor: string;
  arcanaType: 'major' | 'minor'; cardNumber: number; isLight: boolean;
}) => {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 100 });
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = interpolate(e.translationY, [-100, 100], [18, -18]);
      tiltY.value = interpolate(e.translationX, [-100, 100], [-18, 18]);
    })
    .onEnd(() => {
      tiltX.value = withSpring(0, { damping: 14 });
      tiltY.value = withSpring(0, { damping: 14 });
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: scale.value },
      { rotate: isReversed ? '180deg' : '0deg' },
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0, 0.25]),
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-TAROT_CARD_W, TAROT_CARD_W]) }],
  }));

  const roman = arcanaType === 'major' ? toRoman(cardNumber) : '';

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.tarotCard3DWrapper, containerStyle]}>
        {/* Card shadow */}
        <View style={[styles.tarotCardShadow, { shadowColor: suitColor }]} />

        <Svg width={TAROT_CARD_W} height={TAROT_CARD_H} viewBox={`0 0 ${TAROT_CARD_W} ${TAROT_CARD_H}`}>
          <Defs>
            <SvgLinearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={isLight ? '#F8F4EE' : '#1A0F2E'} stopOpacity="1" />
              <Stop offset="100%" stopColor={isLight ? '#EDE0CC' : '#0E0720'} stopOpacity="1" />
            </SvgLinearGradient>
            <SvgLinearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={suitColor} stopOpacity="1" />
              <Stop offset="50%" stopColor={GOLD} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={suitColor} stopOpacity="1" />
            </SvgLinearGradient>
            <SvgRadialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={suitColor} stopOpacity="0.18" />
              <Stop offset="100%" stopColor={suitColor} stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>

          {/* Card background */}
          <Rect x="0" y="0" width={TAROT_CARD_W} height={TAROT_CARD_H} rx="16" ry="16" fill="url(#cardBg)" />

          {/* Outer gold frame */}
          <Rect x="4" y="4" width={TAROT_CARD_W - 8} height={TAROT_CARD_H - 8}
            rx="14" ry="14" fill="none" stroke="url(#frameGrad)" strokeWidth="2.5" opacity="0.9" />

          {/* Inner frame */}
          <Rect x="10" y="10" width={TAROT_CARD_W - 20} height={TAROT_CARD_H - 20}
            rx="10" ry="10" fill="none" stroke={suitColor} strokeWidth="0.8" opacity="0.4" />

          {/* Inner glow */}
          <Rect x="10" y="10" width={TAROT_CARD_W - 20} height={TAROT_CARD_H - 20}
            rx="10" ry="10" fill="url(#innerGlow)" />

          {/* Arcana badge at top */}
          <Rect x="14" y="14" width={86} height={20} rx="6" ry="6"
            fill={suitColor} fillOpacity="0.20" />
          <SvgText x="57" y="27" textAnchor="middle" fontSize="9" fontWeight="600"
            fill={suitColor} opacity="0.9" letterSpacing="1.5">
            {arcanaType === 'major' ? 'WIELKA ARKANA' : 'MAŁA ARKANA'}
          </SvgText>

          {/* Roman numeral (Major Arcana only) */}
          {roman ? (
            <SvgText x={TAROT_CARD_W / 2} y="68" textAnchor="middle" fontSize="22"
              fontWeight="700" fill={suitColor} opacity="0.55" letterSpacing="3">
              {roman}
            </SvgText>
          ) : null}

          {/* Central ornamental illustration */}
          {/* Outer circle */}
          <Circle cx={TAROT_CARD_W / 2} cy={TAROT_CARD_H / 2 - 20}
            r="62" fill="none" stroke={suitColor} strokeWidth="1" opacity="0.35" />
          <Circle cx={TAROT_CARD_W / 2} cy={TAROT_CARD_H / 2 - 20}
            r="56" fill="none" stroke={suitColor} strokeWidth="0.5" opacity="0.20" />

          {/* Inner radial pattern — 8 petals */}
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
            const x1 = TAROT_CARD_W / 2 + Math.cos(a) * 18;
            const y1 = TAROT_CARD_H / 2 - 20 + Math.sin(a) * 18;
            const x2 = TAROT_CARD_W / 2 + Math.cos(a) * 52;
            const y2 = TAROT_CARD_H / 2 - 20 + Math.sin(a) * 52;
            return (
              <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={suitColor} strokeWidth="0.8" opacity="0.30" />
            );
          })}

          {/* Center star / symbol */}
          <Polygon
            points={`${TAROT_CARD_W / 2},${TAROT_CARD_H / 2 - 20 - 22} ${TAROT_CARD_W / 2 + 8},${TAROT_CARD_H / 2 - 20 - 8} ${TAROT_CARD_W / 2 + 22},${TAROT_CARD_H / 2 - 20 - 6} ${TAROT_CARD_W / 2 + 12},${TAROT_CARD_H / 2 - 20 + 8} ${TAROT_CARD_W / 2 + 14},${TAROT_CARD_H / 2 - 20 + 24} ${TAROT_CARD_W / 2},${TAROT_CARD_H / 2 - 20 + 16} ${TAROT_CARD_W / 2 - 14},${TAROT_CARD_H / 2 - 20 + 24} ${TAROT_CARD_W / 2 - 12},${TAROT_CARD_H / 2 - 20 + 8} ${TAROT_CARD_W / 2 - 22},${TAROT_CARD_H / 2 - 20 - 6} ${TAROT_CARD_W / 2 - 8},${TAROT_CARD_H / 2 - 20 - 8}`}
            fill={suitColor}
            fillOpacity="0.25"
            stroke={suitColor}
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />

          {/* Corner ornaments */}
          {[
            [18, 38], [TAROT_CARD_W - 18, 38],
            [18, TAROT_CARD_H - 50], [TAROT_CARD_W - 18, TAROT_CARD_H - 50],
          ].map(([cx, cy], i) => (
            <Circle key={i} cx={cx} cy={cy} r="3.5" fill={suitColor} fillOpacity="0.45" />
          ))}

          {/* Card name at bottom */}
          <Rect x="12" y={TAROT_CARD_H - 46} width={TAROT_CARD_W - 24} height={32}
            rx="8" ry="8" fill={suitColor} fillOpacity="0.18" />
          <SvgText
            x={TAROT_CARD_W / 2}
            y={TAROT_CARD_H - 25}
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            fill={isLight ? '#3B2400' : '#F5E6CC'}
            opacity="0.95"
            letterSpacing="1.2"
          >
            {cardName.toUpperCase().slice(0, 22)}
          </SvgText>

          {/* Reversed indicator */}
          {isReversed ? (
            <>
              <Rect x={TAROT_CARD_W - 52} y="14" width={38} height="18" rx="5" ry="5"
                fill="#EF4444" fillOpacity="0.25" />
              <SvgText x={TAROT_CARD_W - 33} y="26.5" textAnchor="middle" fontSize="8"
                fontWeight="700" fill="#EF4444" opacity="0.9" letterSpacing="0.5">
                ODW.
              </SvgText>
            </>
          ) : null}
        </Svg>

        {/* Shimmer overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            shimmerStyle,
            {
              width: 60,
              backgroundColor: 'rgba(255,255,255,0.35)',
              borderRadius: 16,
              transform: [{ skewX: '-20deg' }],
            },
          ]}
          pointerEvents="none"
        />
      </Animated.View>
    </GestureDetector>
  );
};

// ─── Keyword chip ─────────────────────────────────────────────────────────────

const KeywordChip = ({
  label, index, suitColor, isLight,
}: {
  label: string; index: number; suitColor: string; isLight: boolean;
}) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 80, withSpring(1, { damping: 14, stiffness: 130 }));
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style}>
      <View style={[styles.keyword, {
        backgroundColor: suitColor + (isLight ? '18' : '22'),
        borderColor: suitColor + '40',
      }]}>
        <Text style={[styles.keywordText, { color: suitColor }]}>{label}</Text>
      </View>
    </Animated.View>
  );
};

// ─── Energy bar ───────────────────────────────────────────────────────────────

const EnergyBar = ({
  label1, label2, value, color, isLight,
}: {
  label1: string; label2: string; value: number; color: string; isLight: boolean;
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(400, withTiming(value, { duration: 1000, easing: Easing.out(Easing.quad) }));
  }, []);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[styles.energyLabel, { color: isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)' }]}>
          {label1}
        </Text>
        <Text style={[styles.energyLabel, { color: isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)' }]}>
          {label2}
        </Text>
      </View>
      <View style={[styles.energyTrack, { backgroundColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }]}>
        <Animated.View style={[styles.energyFill, fillStyle, { backgroundColor: color }]} />
      </View>
    </View>
  );
};

// ─── AI Oracle section ────────────────────────────────────────────────────────

const AIOracleSection = ({
  cardName, isReversed, position, suitColor, isLight,
}: {
  cardName: string; isReversed: boolean; position: string;
  suitColor: string; isLight: boolean;
}) => {
  const [aiText, setAiText] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sections, setSections] = useState<{ title: string; text: string }[]>([]);

  const cardBg = isLight ? 'rgba(255,252,245,0.96)' : 'rgba(12,8,22,0.90)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)';
  const subText = isLight ? 'rgba(0,0,0,0.50)' : 'rgba(255,255,255,0.50)';
  const bodyText = isLight ? 'rgba(0,0,0,0.82)' : 'rgba(255,255,255,0.82)';

  const parseAIResponse = (text: string) => {
    const result: { title: string; text: string }[] = [];
    const sectionTitles = ['PRZESŁANIE', 'WEZWANIE DO DZIAŁANIA', 'PYTANIE DO REFLEKSJI'];
    for (const title of sectionTitles) {
      const regex = new RegExp(`${title}[:\\s]*([\\s\\S]*?)(?=${sectionTitles.filter(t => t !== title).join('|')}|$)`, 'i');
      const match = text.match(regex);
      if (match) result.push({ title, text: match[1].trim() });
    }
    if (result.length === 0) {
      result.push({ title: 'PRZESŁANIE', text: text.slice(0, 300) });
    }
    return result;
  };

  const handleAskOracle = async () => {
    HapticsService.impact('medium');
    setLoading(true);
    setExpanded(true);
    try {
      const prompt = `Jesteś Oracle Aethera — mistycznym przewodnikiem tarota. Wykonaj głęboki odczyt dla karty "${cardName}"${isReversed ? ' (ODWRÓCONA)' : ''}, pozycja: "${position || 'ogólna'}".

Odpowiedz w języku użytkownika używając DOKŁADNIE tej struktury:

PRZESŁANIE:
[2-3 zdania o głównym duchowym przesłaniu tej karty w tej sytuacji]

WEZWANIE DO DZIAŁANIA:
[1-2 konkretne, poetyckie kroki, które osoba może podjąć]

PYTANIE DO REFLEKSJI:
[Jedno głębokie pytanie otwarte do medytacji]

Bądź poetycki, głęboki i osobisty. Unikaj banalnych sformułowań.`;

      const messages = [{ role: 'user' as const, content: prompt }];
      const response = await AiService.chatWithOracle(messages);
      const parsed = parseAIResponse(response);
      setSections(parsed);
      setAiText(response);
    } catch (e) {
      setSections([{
        title: 'PRZESŁANIE',
        text: 'Karta przemawia przez ciszę. Zamknij oczy i pozwól, by jej energia dotarła do Twojego serca bez słów.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const SECTION_COLORS = [suitColor, '#A78BFA', '#60A5FA'];

  return (
    <View>
      {!expanded ? (
        <Pressable
          onPress={handleAskOracle}
          style={({ pressed }) => [
            styles.oracleBtn,
            { borderColor: suitColor + '50', backgroundColor: suitColor + '10', opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <LinearGradient
            colors={[suitColor + '18', suitColor + '06']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Wand2 color={suitColor} size={18} strokeWidth={1.5} />
          <Text style={[styles.oracleBtnText, { color: suitColor }]}>
            Poproś Oracle o głęboki odczyt
          </Text>
          <ArrowRight color={suitColor} size={16} strokeWidth={1.5} />
        </Pressable>
      ) : loading ? (
        <View style={[styles.oracleLoading, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ActivityIndicator color={suitColor} size="small" />
          <Text style={[styles.oracleLoadingText, { color: subText }]}>Oracle medytuje…</Text>
        </View>
      ) : (
        <View style={[styles.oracleResult, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <LinearGradient
            colors={[suitColor + '14', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.cardHeader, { marginBottom: 16 }]}>
            <Sparkles color={suitColor} size={15} strokeWidth={1.5} />
            <Text style={[styles.cardHeaderLabel, { color: subText }]}>GŁĘBOKI ODCZYT ORACLE</Text>
          </View>
          {sections.map((sec, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(i * 120).duration(500)}
              style={[styles.oracleSection, { borderLeftColor: SECTION_COLORS[i % 3] }]}
            >
              <Text style={[styles.oracleSectionTitle, { color: SECTION_COLORS[i % 3] }]}>
                {sec.title}
              </Text>
              <Text style={[styles.oracleSectionText, { color: bodyText }]}>{sec.text}</Text>
            </Animated.View>
          ))}
          <Pressable onPress={handleAskOracle} style={styles.oracleRetry}>
            <RefreshCw color={subText} size={14} strokeWidth={1.5} />
            <Text style={[styles.oracleRetryText, { color: subText }]}>Nowy odczyt</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export const ReadingDetailScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeName, userData, favoriteItems, addFavoriteItem, removeFavoriteItem } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');

  const {
    activeSpread,
    drawnCards,
    userQuestion,
    moodBefore,
    pastReadings,
  } = useTarotStore();
  const { addEntry } = useJournalStore();

  // Card selection — use route param or first drawn card
  const paramCard = route?.params?.card;
  const paramPosition = route?.params?.position || 'Pozycja 1';
  const firstCard = drawnCards?.[0];
  const activeCardEntry = paramCard || firstCard;
  const cardObj = activeCardEntry?.card || activeCardEntry;
  const cardName: string = cardObj?.name || cardObj?.namePl || 'Karta Tarota';
  const cardNumber: number = cardObj?.number ?? 0;
  const [isReversed, setIsReversed] = useState<boolean>(activeCardEntry?.isReversed ?? false);

  const arcanaType = getArcanaType(cardNumber);
  const suitData = getSuitData(cardName, arcanaType);
  const suitColor = suitData.color;
  const keywords = getKeywords(cardName);
  const affirmation = getCardAffirmation(cardName);
  const relatedCards = getRelatedCards(cardName);
  const interpretations = buildInterpretations(cardName, isReversed);

  const [activeTab, setActiveTab] = useState('general');
  const [journalText, setJournalText] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);
  const isFav = favId !== null;
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const journalSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (journalSavedTimerRef.current) clearTimeout(journalSavedTimerRef.current); };
  }, []);

  const userName = userData?.name || 'Wędrowiec';
  const roman = arcanaType === 'major' ? toRoman(cardNumber) : '';

  // Past readings with this card
  const cardHistory = useMemo(() => {
    if (!pastReadings?.length) return [];
    return pastReadings
      .filter(r => r.cards?.some((c: any) => (c.card?.name || c.name || '').toLowerCase().includes(cardName.toLowerCase().slice(0, 6))))
      .slice(0, 3)
      .map(r => ({
        date: new Date(r.date || Date.now()).toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'long' }),
        spread: r.spread?.name || 'Odczyt',
      }));
  }, [pastReadings, cardName]);

  const handleFavorite = () => {
    HapticsService.impact('light');
    if (isFav && favId) {
      removeFavoriteItem(favId);
      setFavId(null);
    } else {
      const newId = `reading-${cardName}-${Date.now()}`;
      addFavoriteItem?.({
        id: newId,
        label: cardName,
        sublabel: arcanaType === 'major' ? 'Wielka Arkana' : 'Mała Arkana',
        route: 'ReadingDetail',
        params: { card: activeCardEntry, position: paramPosition },
        icon: 'Star',
        color: suitColor,
        addedAt: new Date().toISOString(),
      });
      setFavId(newId);
    }
  };

  const handleShare = async () => {
    HapticsService.impact('light');
    try {
      await Share.share({
        message: `✦ ${cardName.toUpperCase()} — Odczyt Tarota\n\n${isReversed ? '[ODWRÓCONA] ' : ''}${interpretations.general.slice(0, 120)}…\n\nOdkryj swój odczyt w Aethera → aethera.app`,
      });
    } catch {}
  };

  const handleSaveJournal = () => {
    if (!journalText.trim()) return;
    HapticsService.impact('medium');
    addEntry?.({
      id: `tarot-reflection-${Date.now()}`,
      content: `[Karta: ${cardName}${isReversed ? ' — ODWRÓCONA' : ''}]\n\n${journalText}`,
      date: new Date().toISOString(),
      type: 'tarot',
      mood: moodBefore || undefined,
    });
    setJournalSaved(true);
    setJournalText('');
    if (journalSavedTimerRef.current) clearTimeout(journalSavedTimerRef.current);
    journalSavedTimerRef.current = setTimeout(() => setJournalSaved(false), 3000);
  };

  // Theme vars
  const cardBg = isLight ? 'rgba(255,252,245,0.96)' : 'rgba(12,8,22,0.90)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)';
  const subText = isLight ? 'rgba(0,0,0,0.50)' : 'rgba(255,255,255,0.50)';
  const bodyText = isLight ? 'rgba(0,0,0,0.82)' : 'rgba(255,255,255,0.82)';
  const divColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const inputBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';

  const activeTabData = INTERP_TABS.find(t => t.id === activeTab);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Background */}
      <LinearGradient
        colors={
          isLight
            ? ['#F8F3EE', '#F0E8F5', '#ECE4F5']
            : ['#070410', '#0C0620', '#130A28']
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient card glow */}
      <View
        style={[styles.cardGlow, { backgroundColor: suitColor + '18' }]}
        pointerEvents="none"
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => { if (navigation.canGoBack()) navigation.goBack(); else navigation.navigate('Main'); }}
            style={styles.headerBtn}
            hitSlop={20}
          >
            <ChevronLeft color={currentTheme.primary} size={26} strokeWidth={1.5} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: subText }]}>✦ TWÓJ ODCZYT</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable onPress={handleShare} hitSlop={16}>
              <Share2 color={subText} size={20} strokeWidth={1.5} />
            </Pressable>
            <Pressable onPress={handleFavorite} hitSlop={16}>
              <Star
                color={isFav ? GOLD : subText}
                size={20}
                strokeWidth={1.5}
                fill={isFav ? GOLD : 'none'}
              />
            </Pressable>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
          keyboardVerticalOffset={insets.top + 56}
        >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom + 40, 56) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── 3D Card Hero ─── */}
          <Animated.View entering={FadeInDown.duration(700).springify()} style={styles.heroSection}>
            <TarotCard3D
              cardName={cardName}
              isReversed={isReversed}
              suitColor={suitColor}
              arcanaType={arcanaType}
              cardNumber={cardNumber}
              isLight={isLight}
            />

            {/* Hint text */}
            <Text style={[styles.heroHint, { color: subText }]}>
              Przeciągnij kartę, by poczuć jej głębię
            </Text>
          </Animated.View>

          {/* ─── Card Identity Section ─── */}
          <Animated.View entering={FadeInUp.delay(150).duration(600)}>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <LinearGradient
                colors={[suitColor + '10', 'transparent']}
                style={StyleSheet.absoluteFill}
              />

              {/* Name row */}
              <View style={styles.identityNameRow}>
                <View style={{ flex: 1 }}>
                  {roman ? (
                    <Text style={[styles.romanNumeral, { color: suitColor }]}>{roman}</Text>
                  ) : null}
                  <Text style={[styles.cardTitle, { color: currentTheme.primary }]}>{cardName}</Text>
                  <Text style={[styles.cardSubtitle, { color: subText }]}>
                    {arcanaType === 'major' ? 'Wielka Arkana' : 'Mała Arkana'} · {suitData.element} {suitData.elementIcon}
                  </Text>
                </View>

                {/* Upright/Reversed toggle */}
                <Pressable
                  onPress={() => { setIsReversed(r => !r); HapticsService.impact('light'); }}
                  style={[
                    styles.reversedToggle,
                    {
                      backgroundColor: isReversed ? '#EF444420' : suitColor + '18',
                      borderColor: isReversed ? '#EF4444' + '50' : suitColor + '50',
                    },
                  ]}
                >
                  <RotateCw color={isReversed ? '#EF4444' : suitColor} size={14} strokeWidth={1.8} />
                  <Text style={[styles.reversedToggleText, { color: isReversed ? '#EF4444' : suitColor }]}>
                    {isReversed ? 'Odwrócona' : 'Prosta'}
                  </Text>
                </Pressable>
              </View>

              <View style={[styles.divider, { backgroundColor: divColor }]} />

              {/* Suit meaning */}
              <View style={[styles.suitMeaningBox, { backgroundColor: suitColor + '10', borderColor: suitColor + '30' }]}>
                <Text style={[styles.suitMeaningText, { color: suitColor }]}>{suitData.meaning}</Text>
              </View>

              {/* Detail row: position */}
              {paramPosition ? (
                <View style={styles.identityDetailRow}>
                  <Text style={[styles.identityKey, { color: subText }]}>Pozycja</Text>
                  <Text style={[styles.identityVal, { color: bodyText }]}>{paramPosition}</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>

          {/* ─── Keywords + Energy Bar ─── */}
          <Animated.View entering={FadeInUp.delay(220).duration(600)}>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <Layers color={suitColor} size={14} strokeWidth={1.5} />
                <Text style={[styles.cardHeaderLabel, { color: subText }]}>KLUCZOWE TEMATY</Text>
              </View>

              <View style={styles.keywordsRow}>
                {keywords.map((kw, i) => (
                  <KeywordChip
                    key={i}
                    label={kw}
                    index={i}
                    suitColor={suitColor}
                    isLight={isLight}
                  />
                ))}
              </View>

              <View style={[styles.divider, { backgroundColor: divColor }]} />

              {/* Energy polarity bars */}
              <View style={{ gap: 14, marginTop: 4 }}>
                <EnergyBar
                  label1="Aktywna"
                  label2="Pasywna"
                  value={arcanaType === 'major' ? 0.65 : 0.45}
                  color={suitColor}
                  isLight={isLight}
                />
                <EnergyBar
                  label1="Światło"
                  label2="Cień"
                  value={isReversed ? 0.35 : 0.68}
                  color={isReversed ? '#EF4444' : GOLD}
                  isLight={isLight}
                />
              </View>
            </View>
          </Animated.View>

          {/* ─── Interpretation Tabs ─── */}
          <Animated.View entering={FadeInUp.delay(290).duration(600)}>
            {/* Tab bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabBar}
            >
              {INTERP_TABS.map(tab => {
                const isActive = activeTab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => { setActiveTab(tab.id); HapticsService.impact('light'); }}
                    style={[
                      styles.tab,
                      {
                        backgroundColor: isActive ? tab.color + '22' : 'transparent',
                        borderColor: isActive ? tab.color + '60' : divColor,
                      },
                    ]}
                  >
                    <TabIcon color={isActive ? tab.color : subText} size={12} strokeWidth={1.8} />
                    <Text style={[styles.tabLabel, { color: isActive ? tab.color : subText }]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Tab content */}
            <Animated.View
              key={activeTab}
              entering={FadeIn.duration(350)}
              style={[
                styles.tabContent,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  borderLeftColor: activeTabData?.color || suitColor,
                },
              ]}
            >
              <LinearGradient
                colors={[(activeTabData?.color || suitColor) + '08', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.cardHeader}>
                {activeTabData ? <activeTabData.icon color={activeTabData.color} size={14} strokeWidth={1.5} /> : null}
                <Text style={[styles.cardHeaderLabel, { color: subText }]}>
                  {activeTabData?.label}
                </Text>
              </View>
              <Text style={[styles.tabBody, { color: bodyText }]}>
                {interpretations[activeTab] || interpretations.general}
              </Text>
            </Animated.View>
          </Animated.View>

          {/* ─── AI Deep Reading ─── */}
          <Animated.View entering={FadeInUp.delay(360).duration(600)}>
            <Text style={[styles.sectionLabel, { color: subText }]}>ORACLE AI</Text>
            <AIOracleSection
              cardName={cardName}
              isReversed={isReversed}
              position={paramPosition}
              suitColor={suitColor}
              isLight={isLight}
            />
          </Animated.View>

          {/* ─── Affirmation ─── */}
          <Animated.View entering={FadeInUp.delay(420).duration(600)}>
            <View style={[styles.affirmCard, { borderColor: suitColor + '35' }]}>
              <LinearGradient
                colors={[suitColor + '18', suitColor + '06', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.cardHeader}>
                <Crown color={suitColor} size={14} strokeWidth={1.5} />
                <Text style={[styles.cardHeaderLabel, { color: subText }]}>AFIRMACJA KARTY</Text>
              </View>
              <Text style={[styles.affirmText, { color: bodyText }]}>✦ {affirmation}</Text>
            </View>
          </Animated.View>

          {/* ─── Related Cards ─── */}
          <Animated.View entering={FadeInUp.delay(480).duration(600)}>
            <Text style={[styles.sectionLabel, { color: subText }]}>POWIĄZANE KARTY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedRow}
            >
              {relatedCards.map((rc, i) => (
                <Pressable
                  key={i}
                  onPress={() => HapticsService.impact('light')}
                  style={[
                    styles.relatedCard,
                    { backgroundColor: cardBg, borderColor: rc.color + '40' },
                  ]}
                >
                  <LinearGradient
                    colors={[rc.color + '16', 'transparent']}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.relatedEmoji}>{rc.emoji}</Text>
                  <Text style={[styles.relatedName, { color: currentTheme.primary }]}>{rc.name}</Text>
                  <Text style={[styles.relatedDesc, { color: subText }]}>{rc.desc}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ─── Reading History ─── */}
          {cardHistory.length > 0 && (
            <Animated.View entering={FadeInUp.delay(530).duration(600)}>
              <Pressable
                onPress={() => { setHistoryExpanded(e => !e); HapticsService.impact('light'); }}
                style={[styles.historyHeader, { borderColor: cardBorder }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <BookOpen color={subText} size={14} strokeWidth={1.5} />
                  <Text style={[styles.cardHeaderLabel, { color: subText }]}>
                    HISTORIA POJAWIEŃ ({cardHistory.length})
                  </Text>
                </View>
                {historyExpanded
                  ? <ChevronUp color={subText} size={16} strokeWidth={1.5} />
                  : <ChevronDown color={subText} size={16} strokeWidth={1.5} />}
              </Pressable>

              {historyExpanded && (
                <Animated.View entering={FadeInDown.duration(350)}>
                  <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
                    {cardHistory.map((entry, i) => (
                      <View
                        key={i}
                        style={[
                          styles.historyRow,
                          i < cardHistory.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: divColor },
                        ]}
                      >
                        <View style={[styles.historyDot, { backgroundColor: suitColor }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.historyDate, { color: bodyText }]}>{entry.date}</Text>
                          <Text style={[styles.historySpread, { color: subText }]}>{entry.spread}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              )}
            </Animated.View>
          )}

          {/* ─── Journal Entry CTA ─── */}
          <Animated.View entering={FadeInUp.delay(590).duration(600)}>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <LinearGradient
                colors={['rgba(212,175,55,0.06)', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.cardHeader}>
                <BookOpen color={GOLD} size={14} strokeWidth={1.5} />
                <Text style={[styles.cardHeaderLabel, { color: subText }]}>ZANOTUJ REFLEKSJĘ</Text>
              </View>
              <TextInput
                value={journalText}
                onChangeText={setJournalText}
                placeholder="Co ta karta mówi do Ciebie teraz? Jakie uczucia, obrazy lub wspomnienia się pojawiają?"
                placeholderTextColor={subText}
                multiline
                style={[styles.journalInput, {
                  backgroundColor: inputBg,
                  borderColor: divColor,
                  color: bodyText,
                }]}
              />
              <Pressable
                onPress={handleSaveJournal}
                disabled={!journalText.trim() || journalSaved}
                style={({ pressed }) => [
                  styles.journalSaveBtn,
                  {
                    backgroundColor: journalSaved ? (suitColor + '22') : suitColor + '18',
                    borderColor: journalSaved ? suitColor : (suitColor + '50'),
                    opacity: (!journalText.trim() && !journalSaved) ? 0.4 : (pressed ? 0.8 : 1),
                  },
                ]}
              >
                {journalSaved
                  ? <Check color={suitColor} size={15} strokeWidth={2} />
                  : <BookOpen color={suitColor} size={15} strokeWidth={1.5} />}
                <Text style={[styles.journalSaveBtnText, { color: suitColor }]}>
                  {journalSaved ? 'Zapisano w dzienniku' : 'Zapisz refleksję'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* ─── Share CTA ─── */}
          <Animated.View entering={FadeInUp.delay(650).duration(700)}>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [styles.shareBtn, { opacity: pressed ? 0.88 : 1 }]}
            >
              <LinearGradient
                colors={[suitColor, suitColor + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
              <Share2 color={isLight ? '#000' : '#FFF'} size={18} strokeWidth={1.8} />
              <Text style={[styles.shareBtnText, { color: isLight ? '#000' : '#FFF' }]}>
                Udostępnij odczyt
              </Text>
            </Pressable>
          </Animated.View>

          <View style={{ height: 20 }} />
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  cardGlow: {
    position: 'absolute',
    top: 40,
    left: SW * 0.15,
    width: SW * 0.7,
    height: SW * 0.7,
    borderRadius: SW * 0.35,
    opacity: 0.35,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.padding.screen,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1.8 },

  scroll: {
    paddingHorizontal: layout.padding.screen,
    paddingTop: 8,
    gap: 14,
  },

  // Hero section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  tarotCard3DWrapper: {
    width: TAROT_CARD_W,
    height: TAROT_CARD_H,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  tarotCardShadow: {
    position: 'absolute',
    bottom: -10,
    left: 20,
    right: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 6,
  },
  heroHint: { fontSize: 11, fontStyle: 'italic' },

  // Cards
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
  },
  cardHeaderLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 14 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.6,
    marginBottom: 8,
    marginTop: 4,
  },

  // Identity section
  identityNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  romanNumeral: { fontSize: 12, fontWeight: '700', letterSpacing: 3, marginBottom: 2 },
  cardTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  cardSubtitle: { fontSize: 12, marginTop: 3, fontWeight: '500' },

  reversedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  reversedToggleText: { fontSize: 11, fontWeight: '600' },

  suitMeaningBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  suitMeaningText: { fontSize: 12, lineHeight: 18, fontStyle: 'italic', fontWeight: '500' },

  identityDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  identityKey: { fontSize: 12, fontWeight: '500' },
  identityVal: { fontSize: 13, fontWeight: '600' },

  // Keywords
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keyword: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  keywordText: { fontSize: 12, fontWeight: '600' },

  // Energy bars
  energyLabel: { fontSize: 11, fontWeight: '500' },
  energyTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  energyFill: { height: '100%', borderRadius: 3 },

  // Tabs
  tabBar: {
    gap: 8,
    paddingBottom: 10,
    paddingRight: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  tabContent: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
    padding: 18,
    overflow: 'hidden',
  },
  tabBody: { fontSize: 14, lineHeight: 24, fontWeight: '400' },

  // Oracle AI section
  oracleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  oracleBtnText: { flex: 1, fontSize: 14, fontWeight: '600' },
  oracleLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  oracleLoadingText: { fontSize: 13, fontStyle: 'italic' },
  oracleResult: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    overflow: 'hidden',
  },
  oracleSection: {
    borderLeftWidth: 3,
    paddingLeft: 14,
    marginBottom: 16,
    gap: 6,
  },
  oracleSectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  oracleSectionText: { fontSize: 14, lineHeight: 23 },
  oracleRetry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  oracleRetryText: { fontSize: 12 },

  // Affirmation card
  affirmCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
  },
  affirmText: { fontSize: 14, lineHeight: 23, fontStyle: 'italic', fontWeight: '500' },

  // Related cards
  relatedRow: { gap: 10, paddingRight: 4 },
  relatedCard: {
    width: 120,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  relatedEmoji: { fontSize: 28 },
  relatedName: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  relatedDesc: { fontSize: 10, textAlign: 'center', lineHeight: 14 },

  // History
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 0,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyDate: { fontSize: 13, fontWeight: '600' },
  historySpread: { fontSize: 12, marginTop: 2 },

  // Journal
  journalInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  journalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  journalSaveBtnText: { fontSize: 13, fontWeight: '600' },

  // Share CTA
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  shareBtnText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
});
