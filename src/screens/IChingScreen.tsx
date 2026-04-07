// @ts-nocheck
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  Dimensions,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path, Text as SvgText, G } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import {
  ChevronLeft,
  Sparkles,
  Star,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Eye,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { useAppStore } from '../store/useAppStore';
import { layout } from '../core/theme/designSystem';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
// ── Constants ─────────────────────────────────────────────────────────────────

const { width: SW } = Dimensions.get('window');
const ACCENT = '#CEAE72';

// ── Line Types ─────────────────────────────────────────────────────────────────

type LineType = 'YANG' | 'YIN' | 'MOVING_YANG' | 'MOVING_YIN';

// Sum of 3 coins (heads=3, tails=2): 6=mov_yin 7=yang 8=yin 9=mov_yang
function sumToLine(sum: number): LineType {
  if (sum === 6) return 'MOVING_YIN';
  if (sum === 7) return 'YANG';
  if (sum === 8) return 'YIN';
  return 'MOVING_YANG';
}

function isYang(lt: LineType) {
  return lt === 'YANG' || lt === 'MOVING_YANG';
}

function isMoving(lt: LineType) {
  return lt === 'MOVING_YANG' || lt === 'MOVING_YIN';
}

// ── Trigrams ───────────────────────────────────────────────────────────────────

const TRIGRAMS = [
  { symbol: '☰', name: 'Niebo',  chinese: 'Qian', element: 'siła, twórczość',    color: '#CEAE72' },
  { symbol: '☷', name: 'Ziemia', chinese: 'Kun',  element: 'przyjęcie, oddanie', color: '#A3B899' },
  { symbol: '☳', name: 'Grzmot', chinese: 'Zhen', element: 'pobudzenie, ruch',   color: '#F4A261' },
  { symbol: '☵', name: 'Woda',   chinese: 'Kan',  element: 'niebezpieczeństwo, przepływ', color: '#7EC8E3' },
  { symbol: '☶', name: 'Góra',   chinese: 'Gen',  element: 'zatrzymanie, medytacja', color: '#8B9560' },
  { symbol: '☴', name: 'Wiatr',  chinese: 'Xun',  element: 'łagodność, przenikanie', color: '#C4E0C0' },
  { symbol: '☲', name: 'Ogień',  chinese: 'Li',   element: 'jasność, piękno',    color: '#E07A5F' },
  { symbol: '☱', name: 'Jezioro',chinese: 'Dui',  element: 'radość, otwartość', color: '#74AECF' },
];

// ── Hexagram Data ──────────────────────────────────────────────────────────────

interface Hexagram {
  number: number;
  name: string;
  polishName: string;
  symbol: string;
  upperTrigram: string;
  lowerTrigram: string;
  lines: LineType[]; // 6 lines, bottom to top
  meaning: string;
  actionGuidance: string;
  caution: string;
  changing: string;
}

// lines[0] = bottom line, lines[5] = top line
// YANG=solid, YIN=broken
const HEXAGRAMS: Hexagram[] = [
  {
    number: 1,
    name: 'Qian',
    polishName: 'Siła Nieba',
    symbol: '䷀',
    upperTrigram: 'Niebo',
    lowerTrigram: 'Niebo',
    lines: ['YANG','YANG','YANG','YANG','YANG','YANG'],
    meaning: 'Czysta, nieograniczona siła twórcza. Sześć linii yang symbolizuje pełnię energii i potencjału. To czas inicjacji wielkich dzieł i odważnego działania.',
    actionGuidance: 'Działaj z pewnością siebie. To właściwy moment na podejmowanie wielkich inicjatyw. Twoja energia jest na szczycie — kieruj ją ku swoim celom.',
    caution: 'Unikaj arogancji i przekraczania własnych granic. Zbyt gwałtowny ruch może prowadzić do upadku.',
    changing: 'Jeśli któraś linia się zmienia, niebo pragnie korekty kursu. Zatrzymaj się i przemyśl kierunek.',
  },
  {
    number: 2,
    name: 'Kun',
    polishName: 'Oddanie Ziemi',
    symbol: '䷁',
    upperTrigram: 'Ziemia',
    lowerTrigram: 'Ziemia',
    lines: ['YIN','YIN','YIN','YIN','YIN','YIN'],
    meaning: 'Czysta receptywność i oddanie. Ziemia przyjmuje wszystko bez osądzania i odżywia wszelkie życie. Czas na pokorę, słuchanie i wspieranie innych.',
    actionGuidance: 'Bądź wsparciem dla tych, którzy potrzebują pomocy. Nie narzucaj własnej woli — płyń z nurtem, nie przeciw niemu.',
    caution: 'Nie ulegaj bierności do tego stopnia, że tracisz siebie. Receptywność to moc, nie słabość.',
    changing: 'Zmiana linii wskazuje, że receptywność musi ustąpić miejsca działaniu. Ucz się też inicjatywy.',
  },
  {
    number: 3,
    name: 'Zhun',
    polishName: 'Trudny Początek',
    symbol: '䷂',
    upperTrigram: 'Woda',
    lowerTrigram: 'Grzmot',
    lines: ['YANG','YIN','YIN','YIN','YANG','YIN'],
    meaning: 'Woda nad Grzmotem — narodziny pośród chaosu. Jak roślina przebijająca się przez twardą ziemię, nowe przedsięwzięcie wymaga wytrwałości i pomocników.',
    actionGuidance: 'Szukaj mentorów i sojuszników. Nie działaj sam w tej chwili — organizacja i cierpliwość są kluczem do przezwyciężenia trudności.',
    caution: 'Nie poddawaj się frustracją. Trudności na początku drogi są naturalną częścią procesu wzrostu.',
    changing: 'Ruchome linie oznaczają, że coś zmienia się w naturze wyzwań. Bądź elastyczny wobec nowych przeszkód.',
  },
  {
    number: 4,
    name: 'Meng',
    polishName: 'Młodość',
    symbol: '䷃',
    upperTrigram: 'Góra',
    lowerTrigram: 'Woda',
    lines: ['YIN','YANG','YIN','YIN','YIN','YANG'],
    meaning: 'Góra nad Wodą — młody struyk u stóp góry. Symbol dziecięcej niewiedzy i szczerości szukania. Uczeń musi wykazać prawdziwe pragnienie wiedzy.',
    actionGuidance: 'Przyznaj się do swojej niewiedzy i szukaj mądrości z pokorą. Nauczyciel pojawi się, gdy uczeń będzie gotowy.',
    caution: 'Nie oczekuj, że mądrość sama do ciebie przyjdzie. Fałszywa pewność siebie blokuje prawdziwe uczenie się.',
    changing: 'Zmieniające się linie sugerują, że poziom zrozumienia rośnie. Jesteś gotowy na głębszą naukę.',
  },
  {
    number: 5,
    name: 'Xu',
    polishName: 'Oczekiwanie',
    symbol: '䷄',
    upperTrigram: 'Woda',
    lowerTrigram: 'Niebo',
    lines: ['YANG','YANG','YANG','YIN','YANG','YIN'],
    meaning: 'Woda nad Niebem — deszcz się gromadzi, ale jeszcze nie pada. Czas cierpliwego czekania z pewnością, że właściwy moment nadejdzie.',
    actionGuidance: 'Nie śpiesz się. Utrzymuj gotowość wewnętrzną. Jedz, odpoczywaj, pielęgnuj relacje — czas oczekiwania ma swoją wartość.',
    caution: 'Unikaj działania przedwcześnie z niecierpliwości. Siła jest po twojej stronie, ale jej czas jeszcze nie nadszedł.',
    changing: 'Ruchome linie sygnalizują, że oczekiwanie dobiega końca. Przygotuj się na działanie.',
  },
  {
    number: 6,
    name: 'Song',
    polishName: 'Konflikt',
    symbol: '䷅',
    upperTrigram: 'Niebo',
    lowerTrigram: 'Woda',
    lines: ['YIN','YANG','YIN','YANG','YANG','YANG'],
    meaning: 'Niebo i Woda ciągną w przeciwnych kierunkach — konflikt. Dwie siły o równej mocy zderzają się. Nawet wygranie sporu może być pyrrusowym zwycięstwem.',
    actionGuidance: 'Szukaj mediacji i kompromisu zamiast walki. Wycofaj się z połowy drogi, zanim spór eskaluje. Wygranie tej batalii może cię kosztować więcej niż jej unikanie.',
    caution: 'Nie upieraj się przy swojej racji za wszelką cenę. Duma może zniszczyć to, co prawdziwie cenisz.',
    changing: 'Zmieniające się linie wskazują możliwość przełamania impasu. Mediator może teraz pomóc.',
  },
  {
    number: 7,
    name: 'Shi',
    polishName: 'Armia',
    symbol: '䷆',
    upperTrigram: 'Ziemia',
    lowerTrigram: 'Woda',
    lines: ['YIN','YANG','YIN','YIN','YIN','YIN'],
    meaning: 'Ziemia nad Wodą — armia w polu. Symbol zorganizowanej siły pod mądrym przywódcą. Dyscyplina i jedność grupy decydują o wyniku.',
    actionGuidance: 'Przyjmij rolę lidera lub zaufaj liderowi, który zasługuje na to miano. Zorganizuj swoje zasoby i działaj metodycznie, krok po kroku.',
    caution: 'Nie stosuj siły dla samej siły. Każda militarna kampania musi mieć jasny cel i moralne uzasadnienie.',
    changing: 'Ruchome linie oznaczają konieczność zmiany strategii. Słuchaj doradców.',
  },
  {
    number: 8,
    name: 'Bi',
    polishName: 'Jedność',
    symbol: '䷇',
    upperTrigram: 'Woda',
    lowerTrigram: 'Ziemia',
    lines: ['YIN','YIN','YIN','YIN','YANG','YIN'],
    meaning: 'Woda nad Ziemią — woda spływa i łączy się z innymi strumieniami. Czas budowania sojuszy i wspólnoty. Siła pochodzi z połączenia z innymi.',
    actionGuidance: 'Szukaj ludzi, z którymi możesz współpracować. Buduj mosty, nie mury. Zbliżenie do właściwych osób otworzy nowe możliwości.',
    caution: 'Nie dołączaj do grupy z przymusu ani z desperacji. Wybieraj sojuszników mądrze.',
    changing: 'Zmieniające się linie sugerują, że sojusz jest w trakcie formowania. Bądź otwarty na nowych sprzymierzeńców.',
  },
  {
    number: 11,
    name: 'Tai',
    polishName: 'Harmonia',
    symbol: '䷊',
    upperTrigram: 'Ziemia',
    lowerTrigram: 'Niebo',
    lines: ['YANG','YANG','YANG','YIN','YIN','YIN'],
    meaning: 'Ziemia nad Niebem — co wydaje się odwrócone, jest właściwe. Energia nieba wznosi się ku ziemi, a ziemia opada ku niebu — wzajemne przenikanie i harmonia.',
    actionGuidance: 'To czas prosperity i płodności. Działaj, planuj, realizuj marzenia. Energia świata sprzyja twoim dążeniom.',
    caution: 'Nie popadaj w samozadowolenie. Harmonia nie trwa wiecznie — doceniaj ją i pielęgnuj.',
    changing: 'Ruchome linie oznaczają, że harmonia jest w ruchu. Coś zmienia się na lepsze — otwórz się na to.',
  },
  {
    number: 12,
    name: 'Pi',
    polishName: 'Stagnacja',
    symbol: '䷋',
    upperTrigram: 'Niebo',
    lowerTrigram: 'Ziemia',
    lines: ['YIN','YIN','YIN','YANG','YANG','YANG'],
    meaning: 'Niebo nad Ziemią — obydwie energie oddalają się od siebie. Brak komunikacji i przepływu. Stagnacja, blokada i odizolowanie.',
    actionGuidance: 'Nie walcz z nurtem — poczekaj. Wewnętrzna praca, refleksja i zachowanie zasobów to właściwa strategia w czasie blokady.',
    caution: 'Nie podejmuj wielkich inicjatyw — warunki zewnętrzne im nie sprzyjają. Zachowaj siły na lepsze czasy.',
    changing: 'Ruchome linie sygnalizują przełamanie blokady. Stagnacja zaczyna ustępować.',
  },
  {
    number: 17,
    name: 'Sui',
    polishName: 'Podążanie',
    symbol: '䷐',
    upperTrigram: 'Jezioro',
    lowerTrigram: 'Grzmot',
    lines: ['YANG','YIN','YIN','YANG','YANG','YIN'],
    meaning: 'Jezioro nad Grzmotem — piorun ucicha wieczorem, a jezioro spokojnie odzwierciedla gwiazdy. Czas adaptacji i podążania za naturalnym porządkiem.',
    actionGuidance: 'Dostosuj się do aktualnej sytuacji z gracją. Prowadź, będąc gotowym podążać. Elastyczność przyniesie ci teraz więcej niż upór.',
    caution: 'Nie trać własnej tożsamości w procesie adaptacji. Podążanie za innymi nie oznacza rezygnacji z siebie.',
    changing: 'Ruchome linie sugerują, że kierunek podążania się zmienia. Sprawdź, czy nadal idziesz właściwą ścieżką.',
  },
  {
    number: 18,
    name: 'Gu',
    polishName: 'Naprawianie',
    symbol: '䷑',
    upperTrigram: 'Góra',
    lowerTrigram: 'Wiatr',
    lines: ['YIN','YANG','YIN','YIN','YANG','YANG'],
    meaning: 'Góra nad Wiatrem — wiatr uwięziony pod górą staje się stęchły. Symbol zepsucia i konieczności naprawy tego, co zostało zaniedbane.',
    actionGuidance: 'Skieruj uwagę na problemy, które długo ignorowałeś. Oczyszczenie i reorganizacja są teraz niezbędne. Naprawa wymaga wysiłku, ale przyniesie odnowę.',
    caution: 'Nie odkładaj działania. Zaniedbanie teraz sprawi, że problem urośnie do rozmiarów nie do opanowania.',
    changing: 'Ruchome linie oznaczają, że naprawczy proces jest w toku. Doceń każdy postęp.',
  },
  {
    number: 29,
    name: 'Kan',
    polishName: 'Niebezpieczeństwo',
    symbol: '䷜',
    upperTrigram: 'Woda',
    lowerTrigram: 'Woda',
    lines: ['YIN','YANG','YIN','YIN','YANG','YIN'],
    meaning: 'Woda podwojona — otchłań na otchłani. Jak rzeka przepływa przez niebezpieczne wąwozy, tak człowiek musi przejść przez trudności, pozostając wiernym sobie.',
    actionGuidance: 'Trzymaj się swoich wartości jak rzeka swojego koryta. Nie próbuj uciec — przepłyń przez to. Konsekwencja i uczciwość są twoją tratwą.',
    caution: 'Unikaj ryzykownych decyzji w tym czasie. Nie daj się ponieść panice — woda zawsze znajdzie wyjście.',
    changing: 'Ruchome linie sygnalizują wyjście z niebezpieczeństwa. Trudności się kończą — wytrwaj.',
  },
  {
    number: 30,
    name: 'Li',
    polishName: 'Piękno Ognia',
    symbol: '䷝',
    upperTrigram: 'Ogień',
    lowerTrigram: 'Ogień',
    lines: ['YANG','YIN','YANG','YANG','YIN','YANG'],
    meaning: 'Ogień podwojony — płomień płonie tym jaśniej, im mocniej się do czegoś przyczepia. Jasność, piękno i zależność. Światło potrzebuje paliwa.',
    actionGuidance: 'Rozjaśnij swoje środowisko. Twoja klarowność umysłu może oświetlić drogę innym. Dbaj o to, co cię zasila — relacje, pasje, zdrowie.',
    caution: 'Ogień bez kontroli niszczy. Jasność bez pokory oślepia. Pilnuj, by twoje światło nie spalało innych.',
    changing: 'Ruchome linie oznaczają, że jasność zmienia kierunek. Coś nowego wychodzi na światło dzienne.',
  },
  {
    number: 63,
    name: 'Jiji',
    polishName: 'Po Wypełnieniu',
    symbol: '䷾',
    upperTrigram: 'Woda',
    lowerTrigram: 'Ogień',
    lines: ['YANG','YIN','YANG','YIN','YANG','YIN'],
    meaning: 'Woda nad Ogniem — jeden z rzadkich hexagramów pełnej równowagi. Każda linia jest na właściwym miejscu. Symbol wypełnienia, ale też początku nowego cyklu.',
    actionGuidance: 'Doceniaj to, co osiągnąłeś. Jednak nie spoczywaj na laurach — wypełnienie to jednocześnie ziarno nowego początku.',
    caution: 'Uważaj na pychę po sukcesie. Równowaga jest krucha — małe zaniedbanie może zmącić spokój.',
    changing: 'Ruchome linie wskazują, że nowy cykl się zaczyna. Przygotuj się na zmianę.',
  },
  {
    number: 64,
    name: 'Weiji',
    polishName: 'Przed Wypełnieniem',
    symbol: '䷿',
    upperTrigram: 'Ogień',
    lowerTrigram: 'Woda',
    lines: ['YIN','YANG','YIN','YANG','YIN','YANG'],
    meaning: 'Ogień nad Wodą — wszystko zdaje się na właściwym miejscu, ale cel jeszcze nie osiągnięty. Ostatni krok przed wypełnieniem jest najważniejszy.',
    actionGuidance: 'Jesteś blisko celu — nie rezygnuj teraz. Zachowaj skupienie i ostrożność w końcowym etapie. Przejście wymaga całkowitej uważności.',
    caution: 'Nie lekceważ ostatnich przeszkód. Pośpiech w ostatniej fazie może zniszczyć cały wysiłek.',
    changing: 'Ruchome linie oznaczają, że finisz jest bliski. Działaj z precyzją i spokojem.',
  },
];

// ── Helper: find hexagram by lines ────────────────────────────────────────────

function linesMatch(a: LineType[], b: LineType[]): boolean {
  return a.every((l, i) => {
    const aY = isYang(l);
    const bY = isYang(b[i]);
    return aY === bY;
  });
}

function findHexagram(lines: LineType[]): Hexagram {
  const match = HEXAGRAMS.find(h => linesMatch(h.lines, lines));
  return match ?? HEXAGRAMS[Math.floor(Math.random() * HEXAGRAMS.length)];
}

// ── Throw History ──────────────────────────────────────────────────────────────

interface ThrowRecord {
  id: string;
  hexagram: Hexagram;
  lines: LineType[];
  date: string;
  question?: string;
}

// ── Coin SVG ───────────────────────────────────────────────────────────────────

const COIN_R = 28;

const CoinSvg = ({ isHeads, accent }: { isHeads: boolean; accent: string }) => (
  <Svg width={COIN_R * 2} height={COIN_R * 2}>
    <Circle cx={COIN_R} cy={COIN_R} r={COIN_R - 2} fill={isHeads ? accent : '#2A2A3A'} stroke={accent} strokeWidth={2} />
    <SvgText
      x={COIN_R}
      y={COIN_R + 8}
      textAnchor="middle"
      fontSize={22}
      fill={isHeads ? '#2A2A3A' : accent}
    >
      {isHeads ? '☯' : '○'}
    </SvgText>
  </Svg>
);

// ── Hexagram Line SVG ──────────────────────────────────────────────────────────

const HexLine = ({ type, delay }: { type: LineType; delay: number }) => {
  const yang = isYang(type);
  const moving = isMoving(type);
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(300)} style={styles.hexLine}>
      {yang ? (
        <View style={[styles.yangLine, moving && styles.movingLine]} />
      ) : (
        <View style={styles.yinLineRow}>
          <View style={[styles.yinSegment, moving && styles.movingLine]} />
          <View style={styles.yinGap} />
          <View style={[styles.yinSegment, moving && styles.movingLine]} />
        </View>
      )}
      {moving && <View style={styles.movingDot} />}
    </Animated.View>
  );
};

// ── AnimatedCoin ───────────────────────────────────────────────────────────────

const AnimatedCoin = ({ isHeads, spinning, delay, accent }: {
  isHeads: boolean;
  spinning: boolean;
  delay: number;
  accent: string;
}) => {
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (spinning) {
      rotate.value = withDelay(
        delay,
        withSequence(
          withTiming(360 * 4, { duration: 800 }),
          withTiming(0, { duration: 0 }),
        ),
      );
      scale.value = withDelay(
        delay,
        withSequence(
          withSpring(1.3, { damping: 4 }),
          withSpring(1, { damping: 6 }),
        ),
      );
    }
  }, [spinning]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={animStyle}>
      <CoinSvg isHeads={isHeads} accent={accent} />
    </Animated.View>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────────

export function IChingScreen({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
    const userData = useAppStore(s => s.userData);
  const favoriteItems = useAppStore(s => s.favoriteItems);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const textColor = isLight ? '#1A1A2E' : '#EDE8F0';
  const subColor = isLight ? 'rgba(30,20,60,0.55)' : 'rgba(220,210,240,0.55)';
  const borderColor = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)';

  // Coin state
  const [coinHeads, setCoinHeads] = useState([false, false, false]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lines, setLines] = useState<LineType[]>([]);
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [history, setHistory] = useState<ThrowRecord[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  // Favorite
  const isFav = favoriteItems?.some(f => f.id === 'iching');

  const toggleFav = () => {
    HapticsService.impact('light');
    if (isFav) {
      removeFavoriteItem('iching');
    } else {
      addFavoriteItem({
        id: 'iching',
        label: 'I Ching',
        sublabel: 'Wyrocznia Przemian',
        route: 'IChing',
        icon: 'BookOpen',
        color: ACCENT,
        addedAt: new Date().toISOString(),
      });
    }
  };

  // Generate random line from 3 coin throws
  const throwOneLine = (): LineType => {
    const coins = [
      Math.random() < 0.5 ? 3 : 2,
      Math.random() < 0.5 ? 3 : 2,
      Math.random() < 0.5 ? 3 : 2,
    ];
    return sumToLine(coins[0] + coins[1] + coins[2]);
  };

  const handleThrow = () => {
    if (isSpinning) return;
    HapticsService.impact('heavy');
    setIsSpinning(true);
    setAiResponse('');
    setActiveHistoryId(null);

    const newHeads = [Math.random() < 0.5, Math.random() < 0.5, Math.random() < 0.5];
    setCoinHeads(newHeads);

    // Build 6 lines
    const newLines: LineType[] = Array.from({ length: 6 }, () => throwOneLine());

    setTimeout(() => {
      setIsSpinning(false);
      setLines(newLines);
      const hex = findHexagram(newLines);
      setHexagram(hex);
      HapticsService.impact('medium');

      // Save to history
      const record: ThrowRecord = {
        id: Date.now().toString(),
        hexagram: hex,
        lines: newLines,
        date: new Date().toLocaleString(getLocaleCode(), { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }),
        question: question || undefined,
      };
      setHistory(prev => [record, ...prev].slice(0, 5));
    }, 1200);
  };

  const handleAiInterpretation = async () => {
    if (!hexagram || aiLoading) return;
    HapticsService.impact('medium');
    setAiLoading(true);
    try {
      const movingLines = lines
        .map((l, i) => (isMoving(l) ? `linia ${i + 1} (od dołu)` : null))
        .filter(Boolean)
        .join(', ');

      const messages = [
        {
          role: 'system',
          content: 'Jesteś mistrzem I Ching — Księgi Przemian. Dajesz głębokie, poetyckie i praktyczne interpretacje heksagramów. Odpowiadasz w języku użytkownika, łącząc starożytną mądrość z realnymi pytaniami konsultanta.',
        },
        {
          role: 'user',
          content: `Wylosowałem heksagram ${hexagram.number}: ${hexagram.name} — "${hexagram.polishName}".
${movingLines ? `Ruchome linie: ${movingLines}.` : 'Brak ruchomych linii.'}
${question ? `Moje pytanie: ${question}` : ''}

Proszę o głęboką interpretację I Ching w języku użytkownika (ok. 150 słów). Połącz symbolikę heksagramu z moją sytuacją, wskaż, co zmiana linii oznacza dla transformacji, i zakończ konkretną wskazówką działania.`,
        },
      ];

      const response = await AiService.chatWithOracle(messages);
      setAiResponse(response || 'Brak odpowiedzi wyroczni. Spróbuj ponownie.');
    } catch {
      setAiResponse('Wyrocznia milczy w tej chwili. Zapytaj ponownie.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleHistoryTap = (record: ThrowRecord) => {
    HapticsService.impact('light');
    setActiveHistoryId(record.id);
    setLines(record.lines);
    setHexagram(record.hexagram);
    setQuestion(record.question || '');
    setAiResponse('');
  };

  const handleReset = () => {
    HapticsService.impact('light');
    setLines([]);
    setHexagram(null);
    setAiResponse('');
    setCoinHeads([false, false, false]);
    setActiveHistoryId(null);
  };

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView edges={['top']} style={[styles.root, {}]}>

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.headerBtn} hitSlop={8}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.eyebrow, { color: ACCENT }]}>I CHING</Text>
          <Text style={[styles.headerTitle, { color: textColor }]}>Wyrocznia Przemian</Text>
        </View>
        <Pressable onPress={toggleFav} style={styles.headerBtn} hitSlop={8}>
          <Star size={22} color={ACCENT} fill={isFav ? ACCENT : 'transparent'} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Card */}
          <Animated.View entering={FadeInDown.delay(60).duration(500)}>
            <LinearGradient
              colors={isLight ? ['#FBF5E8', '#F2E4C4'] : ['#1C1528', '#251E38']}
              style={[styles.heroCard, { borderColor }]}
            >
              <Text style={styles.heroSymbol}>☯</Text>
              <Text style={[styles.heroTitle, { color: textColor }]}>Księga Przemian</Text>
              <Text style={[styles.heroDesc, { color: subColor }]}>
                I Ching to jedna z najstarszych na świecie wyroczni, licząca ponad 3000 lat. Opiera się na 64
                heksagramach — kombinacjach linii yang (━━) i yin (━ ━) — opisujących każdy możliwy stan
                wszechświata. Rzut monetami pozwala dostroić się do aktualnej energii i otrzymać wskazówkę
                z nieśmiertelnej Księgi Przemian.
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Coin Throw Section */}
          <Animated.View entering={FadeInDown.delay(120).duration(500)}>
            <Text style={[styles.sectionLabel, { color: ACCENT }]}>RZUT MONETAMI</Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              {/* Coins */}
              <View style={styles.coinsRow}>
                {coinHeads.map((h, i) => (
                  <AnimatedCoin
                    key={i}
                    isHeads={h}
                    spinning={isSpinning}
                    delay={i * 120}
                    accent={ACCENT}
                  />
                ))}
              </View>
              <Text style={[styles.coinHint, { color: subColor }]}>
                {isSpinning
                  ? 'Monety w locie...'
                  : lines.length
                  ? 'Monety przemówiły'
                  : '☯ = yang (głowa)   ○ = yin (orzeł)'}
              </Text>
              {/* Action buttons */}
              <View style={styles.throwBtnRow}>
                <Pressable
                  onPress={handleThrow}
                  disabled={isSpinning}
                  style={({ pressed }) => [styles.throwBtn, { opacity: pressed || isSpinning ? 0.6 : 1 }]}
                >
                  <LinearGradient
                    colors={['#CEAE72', '#A8864E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.throwBtnGrad}
                  >
                    <Sparkles size={18} color="#1A1A2E" />
                    <Text style={styles.throwBtnText}>Rzuć monety</Text>
                  </LinearGradient>
                </Pressable>
                {lines.length > 0 && (
                  <Pressable onPress={handleReset} style={styles.resetBtn}>
                    <RefreshCw size={18} color={ACCENT} />
                  </Pressable>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Hexagram Display */}
          {lines.length === 6 && hexagram && (
            <Animated.View entering={FadeInDown.delay(80).duration(500)}>
              <Text style={[styles.sectionLabel, { color: ACCENT }]}>HEKSAGRAM</Text>
              <LinearGradient
                colors={isLight ? ['#FBF5E8', '#F4ECD8'] : ['#1C1528', '#251E38']}
                style={[styles.hexCard, { borderColor }]}
              >
                {/* Lines displayed bottom-to-top visually (reverse) */}
                <View style={styles.hexLinesContainer}>
                  {[...lines].reverse().map((l, i) => (
                    <HexLine key={i} type={l} delay={i * 200} />
                  ))}
                </View>

                <View style={styles.hexInfo}>
                  <Text style={[styles.hexNumber, { color: ACCENT }]}>#{hexagram.number}</Text>
                  <Text style={[styles.hexName, { color: textColor }]}>{hexagram.name}</Text>
                  <Text style={[styles.hexPolish, { color: subColor }]}>{hexagram.polishName}</Text>
                  <Text style={[styles.hexTrigramRow, { color: subColor }]}>
                    {hexagram.upperTrigram} nad {hexagram.lowerTrigram}
                  </Text>
                </View>

                {/* Meaning */}
                <View style={[styles.hexSection, { borderColor }]}>
                  <Text style={[styles.hexSectionLabel, { color: ACCENT }]}>ZNACZENIE</Text>
                  <Text style={[styles.hexSectionText, { color: textColor }]}>{hexagram.meaning}</Text>
                </View>

                <View style={[styles.hexSection, { borderColor }]}>
                  <Text style={[styles.hexSectionLabel, { color: ACCENT }]}>WSKAZÓWKA DZIAŁANIA</Text>
                  <Text style={[styles.hexSectionText, { color: textColor }]}>{hexagram.actionGuidance}</Text>
                </View>

                <View style={[styles.hexSection, { borderColor }]}>
                  <Text style={[styles.hexSectionLabel, { color: '#E07A5F' }]}>PRZESTROGA</Text>
                  <Text style={[styles.hexSectionText, { color: textColor }]}>{hexagram.caution}</Text>
                </View>

                {lines.some(isMoving) && (
                  <View style={[styles.hexSection, { borderColor }]}>
                    <Text style={[styles.hexSectionLabel, { color: '#74AECF' }]}>RUCHOME LINIE</Text>
                    <Text style={[styles.hexSectionText, { color: textColor }]}>{hexagram.changing}</Text>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>
          )}

          {/* Question Input */}
          {lines.length === 6 && (
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <Text style={[styles.sectionLabel, { color: ACCENT }]}>TWOJE PYTANIE</Text>
              <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[styles.inputLabel, { color: subColor }]}>Co chcesz zapytać I Ching?</Text>
                <TextInput
                  style={[styles.questionInput, { color: textColor, borderColor }]}
                  value={question}
                  onChangeText={t => setQuestion(t.slice(0, 120))}
                  placeholder="Wpisz swoje pytanie (opcjonalnie)..."
                  placeholderTextColor={subColor}
                  multiline
                  maxLength={120}
                />
                <Text style={[styles.charCount, { color: subColor }]}>{question.length}/120</Text>
              </View>
            </Animated.View>
          )}

          {/* AI Interpretation */}
          {lines.length === 6 && hexagram && (
            <Animated.View entering={FadeInDown.delay(120).duration(500)}>
              <Text style={[styles.sectionLabel, { color: ACCENT }]}>INTERPRETACJA AI</Text>
              <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                <Pressable
                  onPress={handleAiInterpretation}
                  disabled={aiLoading}
                  style={({ pressed }) => [styles.aiBtn, { opacity: pressed || aiLoading ? 0.6 : 1 }]}
                >
                  <LinearGradient
                    colors={['#1C1528', '#251E38']}
                    style={styles.aiBtnGrad}
                  >
                    <Eye size={18} color={ACCENT} />
                    <Text style={[styles.aiBtnText, { color: ACCENT }]}>
                      {aiLoading ? 'Wyrocznia przemawia...' : 'Poproś o interpretację AI'}
                    </Text>
                  </LinearGradient>
                </Pressable>

                {aiResponse.length > 0 && (
                  <Animated.View entering={FadeInDown.delay(0).duration(400)}>
                    <LinearGradient
                      colors={[ACCENT + '22', ACCENT + '08']}
                      style={[styles.aiResponseCard, { borderColor: ACCENT + '44' }]}
                    >
                      <Sparkles size={14} color={ACCENT} style={{ marginBottom: 8 }} />
                      <Text style={[styles.aiResponseText, { color: textColor }]}>{aiResponse}</Text>
                    </LinearGradient>
                  </Animated.View>
                )}
              </View>
            </Animated.View>
          )}

          {/* History */}
          {history.length > 0 && (
            <Animated.View entering={FadeInDown.delay(140).duration(500)}>
              <Text style={[styles.sectionLabel, { color: ACCENT }]}>HISTORIA RZUTÓW</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
                {history.map(record => (
                  <Pressable
                    key={record.id}
                    onPress={() => handleHistoryTap(record)}
                    style={({ pressed }) => [
                      styles.historyChip,
                      {
                        backgroundColor:
                          activeHistoryId === record.id
                            ? ACCENT + '22'
                            : cardBg,
                        borderColor:
                          activeHistoryId === record.id ? ACCENT : borderColor,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.historyChipNum, { color: ACCENT }]}>#{record.hexagram.number}</Text>
                    <Text style={[styles.historyChipName, { color: textColor }]}>{record.hexagram.polishName}</Text>
                    <Text style={[styles.historyChipDate, { color: subColor }]}>{record.date}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Trigrams Guide */}
          <Animated.View entering={FadeInDown.delay(160).duration(500)}>
            <Text style={[styles.sectionLabel, { color: ACCENT }]}>OSIEM TRYGRAMÓW (BA GUA)</Text>
            <View style={styles.trigramGrid}>
              {TRIGRAMS.map((t, i) => (
                <Animated.View
                  key={t.chinese}
                  entering={FadeInDown.delay(180 + i * 50).duration(400)}
                  style={[styles.trigramCard, { backgroundColor: cardBg, borderColor }]}
                >
                  <Text style={[styles.trigramSymbol, { color: t.color }]}>{t.symbol}</Text>
                  <Text style={[styles.trigramName, { color: textColor }]}>{t.name}</Text>
                  <Text style={[styles.trigramChinese, { color: subColor }]}>{t.chinese}</Text>
                  <Text style={[styles.trigramElement, { color: subColor }]}>{t.element}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Co dalej */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={[styles.sectionLabel, { color: ACCENT }]}>CO DALEJ</Text>
            {[
              { icon: Sparkles, label: 'Wyrocznia AI', sub: 'Rozmowa z Wyrocznią', route: 'OraclePortal', color: '#A78BFA' },
              { icon: BookOpen, label: 'Runy Futhark', sub: 'Starożytne symbole', route: 'RuneCast', color: '#74AECF' },
              { icon: Eye, label: 'Karty Aniołów', sub: 'Boskie przesłania', route: 'AngelNumbers', color: '#34D399' },
            ].map(({ icon: Icon, label, sub, route, color }, i) => (
              <Pressable
                key={route}
                onPress={() => { HapticsService.impact('light'); navigation.navigate(route); }}
                style={({ pressed }) => [
                  styles.nextCard,
                  { backgroundColor: cardBg, borderColor, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <LinearGradient
                  colors={[color + '22', color + '08']}
                  style={styles.nextIconBg}
                >
                  <Icon size={22} color={color} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nextLabel, { color: textColor }]}>{label}</Text>
                  <Text style={[styles.nextSub, { color: subColor }]}>{sub}</Text>
                </View>
                <ArrowRight size={18} color={subColor} />
              </Pressable>
            ))}
          </Animated.View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </KeyboardAvoidingView>
        </SafeAreaView>
</View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const PAD = layout.padding.screen;

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5 },
  headerTitle: { fontSize: 17, fontWeight: '600', marginTop: 2 },

  scroll: { paddingHorizontal: PAD, paddingBottom: 20 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
    marginTop: 20,
    marginBottom: 10,
  },

  // Hero
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 4,
  },
  heroSymbol: { fontSize: 48, marginBottom: 8 },
  heroTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  heroDesc: { fontSize: 14, lineHeight: 22, textAlign: 'center' },

  // Card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 4,
  },

  // Coins
  coinsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 14,
  },
  coinHint: { textAlign: 'center', fontSize: 13, marginBottom: 16 },

  throwBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  throwBtn: { flex: 1 },
  throwBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  throwBtnText: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  resetBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(206,174,114,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hexagram display
  hexCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 4,
  },
  hexLinesContainer: {
    marginBottom: 16,
    gap: 6,
    alignItems: 'center',
    width: 160,
  },
  hexLine: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 14,
    width: 160,
  },
  yangLine: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  yinLineRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  yinSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  yinGap: { width: 16 },
  movingLine: { backgroundColor: '#74AECF' },
  movingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#74AECF',
    marginLeft: 6,
  },

  hexInfo: { alignItems: 'center', marginBottom: 16 },
  hexNumber: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  hexName: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  hexPolish: { fontSize: 14, marginTop: 2 },
  hexTrigramRow: { fontSize: 12, marginTop: 4 },

  hexSection: {
    width: '100%',
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: 1,
  },
  hexSectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  hexSectionText: { fontSize: 14, lineHeight: 22 },

  // Question
  inputLabel: { fontSize: 12, marginBottom: 8 },
  questionInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 4 },

  // AI
  aiBtn: { marginBottom: 4 },
  aiBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  aiBtnText: { fontSize: 15, fontWeight: '600' },
  aiResponseCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 14,
  },
  aiResponseText: { fontSize: 14, lineHeight: 23 },

  // History
  historyScroll: { paddingVertical: 4, paddingBottom: 8, gap: 10 },
  historyChip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 110,
  },
  historyChipNum: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  historyChipName: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  historyChipDate: { fontSize: 11, marginTop: 2 },

  // Trigrams
  trigramGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  trigramCard: {
    width: (SW - PAD * 2 - 10) / 2,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'flex-start',
  },
  trigramSymbol: { fontSize: 28, marginBottom: 6 },
  trigramName: { fontSize: 15, fontWeight: '700' },
  trigramChinese: { fontSize: 12, marginTop: 1 },
  trigramElement: { fontSize: 12, marginTop: 4, lineHeight: 16 },

  // Co dalej
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  nextIconBg: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLabel: { fontSize: 15, fontWeight: '700' },
  nextSub: { fontSize: 13, marginTop: 2 },
});
