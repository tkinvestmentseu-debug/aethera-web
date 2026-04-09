// @ts-nocheck
import React, { useRef, useState, useMemo, useCallback } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  TextInput, Dimensions, ActivityIndicator,
  KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { MysticalInput } from '../components/MysticalInput';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
  useAnimatedProps,
} from 'react-native-reanimated';
import Svg, { Circle, G, Ellipse, Path, Defs, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';
import {
  ChevronLeft, Sparkles, Moon, Brain, ArrowRight, BookOpen, Layers, CalendarDays,
  Search, BarChart2, Tag, Star, Users, Eye, Zap, CheckSquare, Square,
  ChevronDown, ChevronUp, Lightbulb,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { DREAM_DICTIONARY } from '../features/dreams/data';
import { screenContracts } from '../core/theme/designSystem';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { AiService } from '../core/services/ai.service';
import { SoulEngineService } from '../core/services/soulEngine.service';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '../core/utils/localeFormat';
import i18n from '../core/i18n';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#818CF8';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Moon phase math ─────────────────────────────────────────────────────────
const getMoonAge = () => {
  const known = new Date('2000-01-06');
  const now = new Date();
  const diff = (now.getTime() - known.getTime()) / 86400000;
  return diff % 29.53;
};

const getMoonPhase = (date?: Date) => {
  const known = new Date('2000-01-06');
  const target = date || new Date();
  const diff = (target.getTime() - known.getTime()) / 86400000;
  const moonAge = diff % 29.53;
  if (moonAge < 3.7)  return { name: 'Nów',               emoji: '🌑', dreamTip: 'Sny o nowych początkach i ukrytych możliwościach' };
  if (moonAge < 7.4)  return { name: 'Rosnący',           emoji: '🌒', dreamTip: 'Sny ujawniają, co chcesz przyciągnąć do życia' };
  if (moonAge < 11.1) return { name: 'Kwadra rosnąca',    emoji: '🌓', dreamTip: 'Sny testują twoją determinację i wewnętrzną moc' };
  if (moonAge < 14.8) return { name: 'Gibbous',           emoji: '🌔', dreamTip: 'Sny przynoszą przełomowe wglądy i objawienia' };
  if (moonAge < 18.5) return { name: 'Pełnia',            emoji: '🌕', dreamTip: 'Sny pełni są intensywne — emocje, archetypy, objawienia' };
  if (moonAge < 22.1) return { name: 'Zanikający',        emoji: '🌖', dreamTip: 'Sny pomagają puścić to, co już nie służy' };
  if (moonAge < 25.8) return { name: 'Kwadra zanikająca', emoji: '🌗', dreamTip: 'Sny przepracowują dawne wzorce i rany' };
  return                     { name: 'Sierp zanikający',  emoji: '🌘', dreamTip: 'Sny zbierają mądrość cyklu — głęboka intuicja' };
};

// ─── Quality chips ────────────────────────────────────────────────────────────
const QUALITY_CHIPS = [
  { id: 'GŁĘBOKI',        tip: 'Sen głęboki regeneruje psyche i przetwarza emocje dnia.' },
  { id: 'NIESPOKOJNY',    tip: 'Niepokój w snach często sygnalizuje nierozwiązane napięcia.' },
  { id: 'FRAGMENTARYCZNY',tip: 'Fragmenty to mozaika z kilku cykli REM — każdy kawałek ma wagę.' },
  { id: 'LUCYDNY',        tip: 'Świadomy sen daje możliwość pracy z symbolami w czasie rzeczywistym.' },
  { id: 'BEZ SNÓW',       tip: 'Brak wspomnień snów może oznaczać bardzo głęboki sen NREM lub zmęczenie.' },
];

// ─── Dream type tags ─────────────────────────────────────────────────────────
const DREAM_TYPE_TAGS = [
  { id: 'Proroczy',      color: '#F59E0B', icon: '🔮' },
  { id: 'Astralny',      color: '#818CF8', icon: '✦' },
  { id: 'Lękowy',        color: '#F87171', icon: '🌑' },
  { id: 'Twórczy',       color: '#34D399', icon: '✨' },
  { id: 'Wspomnieniowy', color: '#60A5FA', icon: '🌊' },
  { id: 'Symboliczny',   color: '#C084FC', icon: '🌿' },
];

// ─── Mood options ─────────────────────────────────────────────────────────────
const MOOD_OPTIONS = [
  { id: 'radosny',    emoji: '😊', label: 'Radosny' },
  { id: 'spokojny',   emoji: '😌', label: 'Spokojny' },
  { id: 'smutny',     emoji: '😔', label: 'Smutny' },
  { id: 'lękliwy',    emoji: '😰', label: 'Lękliwy' },
  { id: 'zdziwiony',  emoji: '😲', label: 'Zaskoczony' },
  { id: 'tajemniczy', emoji: '🌙', label: 'Tajemniczy' },
  { id: 'intensywny', emoji: '🔥', label: 'Intensywny' },
  { id: 'nostalgiczny',emoji: '💫', label: 'Nostalgiczny' },
];

// ─── Jungian archetypes ───────────────────────────────────────────────────────
const ARCHETYPES = [
  { name: 'Anima/Animus', icon: '⚤',  desc: 'Wewnętrzna kobiecość/męskość w snach', color: '#C084FC',
    keywords: ['kobieta','mężczyzna','miłość','partner','piękność','siła'],
    dreamSign: 'Postać płci przeciwnej, która przyciąga lub niepokoi' },
  { name: 'Cień',         icon: '🌑', desc: 'Odrzucone części siebie pojawiają się w snach', color: '#6366F1',
    keywords: ['ciemność','potwór','wróg','strach','uciekam','ściga'],
    dreamSign: 'Prześladowca, mroczna postać, własne odbicie które atakuje' },
  { name: 'Jaźń',         icon: '✦',  desc: 'Symbol integracji i centrum psyche', color: ACCENT,
    keywords: ['światło','całość','spokój','centrum','złoto','kryształ'],
    dreamSign: 'Mandala, symbol okrągłości, poczucie absolutnej pełni' },
  { name: 'Wielka Matka', icon: '🌿', desc: 'Opiekuńczość, natura, płodność lub pożerająca moc', color: '#34D399',
    keywords: ['matka','ziemia','natura','las','rzeka','dom','karmienie'],
    dreamSign: 'Wielka kobieta, natura jako żywa istota, dom jako labirynt' },
  { name: 'Trickster',    icon: '🃏', desc: 'Przekorny bóg chaosu i twórczej zmiany', color: '#F59E0B',
    keywords: ['żart','chaos','nieoczekiwane','sztuczka','clown','dziwne'],
    dreamSign: 'Postać która wszystko odwraca, absurdalne sytuacje, czarny humor' },
  { name: 'Persona',      icon: '🎭', desc: 'Maska społeczna — kim jesteś dla innych', color: '#60A5FA',
    keywords: ['praca','ocena','publiczność','wystąpienie','ubranie','wygląd'],
    dreamSign: 'Bycie obserwowanym, egzamin, nieodpowiedni strój, scena publiczna' },
];

// ─── Extended quick symbol dictionary (30+ common symbols) ────────────────────
const QUICK_SYMBOLS = [
  { symbol: 'Woda',      meaning: 'Emocje, podświadomość, oczyszczenie lub strach przed uczuciami', color: '#60A5FA', icon: '💧' },
  { symbol: 'Ogień',     meaning: 'Transformacja, pasja, gniew lub duchowe przebudzenie', color: '#F97316', icon: '🔥' },
  { symbol: 'Latanie',   meaning: 'Pragnienie wolności, wzniesienie się ponad problemy, perspektywa', color: '#818CF8', icon: '🦋' },
  { symbol: 'Upadanie',  meaning: 'Utrata kontroli, lęk przed porażką, potrzeba uziemienia', color: '#6366F1', icon: '⬇️' },
  { symbol: 'Dom',       meaning: 'Jaźń, psyche, różne pokoje = różne aspekty osobowości', color: '#FBBF24', icon: '🏠' },
  { symbol: 'Wąż',       meaning: 'Transformacja, mądrość, uzdrowienie lub ukryte zagrożenie', color: '#34D399', icon: '🐍' },
  { symbol: 'Śmierć',    meaning: 'Zakończenie i nowy początek, transformacja, zmiana', color: '#C084FC', icon: '🌒' },
  { symbol: 'Dziecko',   meaning: 'Potencjał, niewinność, nowe projekty lub wewnętrzne dziecko', color: '#F472B6', icon: '👶' },
  { symbol: 'Pościg',    meaning: 'Unikanie czegoś w życiu, strach przed odpowiedzialnością', color: '#F87171', icon: '🏃' },
  { symbol: 'Zęby',      meaning: 'Komunikacja, wygląd, lęk o ocenę lub utratę kontroli', color: '#A78BFA', icon: '🦷' },
  { symbol: 'Drzewa',    meaning: 'Wzrost, siły korzenne, połączenie z naturą i przodkami', color: '#6EE7B7', icon: '🌳' },
  { symbol: 'Droga',     meaning: 'Życiowa podróż, decyzje do podjęcia, kierunek rozwoju', color: '#FBBF24', icon: '🛤️' },
  { symbol: 'Góra',      meaning: 'Wyzwanie, aspiracje, wysiłek konieczny do osiągnięcia celu', color: '#94A3B8', icon: '⛰️' },
  { symbol: 'Most',      meaning: 'Przejście między etapami, decyzja, połączenie dwóch światów', color: '#60A5FA', icon: '🌉' },
  { symbol: 'Ptak',      meaning: 'Dusza, wolność, wiadomość ze sfery duchowej lub nadchodząca zmiana', color: '#818CF8', icon: '🕊️' },
  { symbol: 'Lustro',    meaning: 'Samoobraz, prawda o sobie, konfrontacja z własnym odbiciem', color: '#C084FC', icon: '🪞' },
  { symbol: 'Noc',       meaning: 'Podświadomość, tajemnica, ukryte aspekty siebie', color: '#6366F1', icon: '🌑' },
  { symbol: 'Słońce',    meaning: 'Świadomość, energia życiowa, sukces, witalne siły', color: '#FBBF24', icon: '☀️' },
  { symbol: 'Księżyc',   meaning: 'Intuicja, cykl, kobiecość, ukryta strona psyche', color: '#818CF8', icon: '🌙' },
  { symbol: 'Klucz',     meaning: 'Dostęp do nowej wiedzy, rozwiązanie problemu, wejście na nowy etap', color: '#F59E0B', icon: '🔑' },
  { symbol: 'Labirynt',  meaning: 'Poszukiwanie swojej drogi, kompleksowe decyzje, zagubienie w sobie', color: '#A78BFA', icon: '🌀' },
  { symbol: 'Zwierzę',   meaning: 'Instynkty, totemiczne energie, surowa siła natury i intuicji', color: '#34D399', icon: '🐺' },
  { symbol: 'Morze',     meaning: 'Głębia emocji, nieświadomość zbiorowa, bezmiar możliwości', color: '#60A5FA', icon: '🌊' },
  { symbol: 'Burza',     meaning: 'Silne emocje, nadchodzący przełom lub oczyszczające napięcie', color: '#94A3B8', icon: '⛈️' },
  { symbol: 'Złoto',     meaning: 'Wartość jaźni, skarb wewnętrzny, osiągnięcie i spełnienie', color: '#FBBF24', icon: '✨' },
  { symbol: 'Jaskinia',  meaning: 'Cofnięcie do korzeni, spotkanie z nieświadomością, inicjacja', color: '#6366F1', icon: '🕳️' },
  { symbol: 'Lot',       meaning: 'Transcendencja, wyzwolenie z ograniczeń, perspektywa duchowa', color: '#818CF8', icon: '🚀' },
  { symbol: 'Krew',      meaning: 'Żywotność, więzy rodzinne, ofiara lub gruntowna zmiana', color: '#F87171', icon: '❤️' },
  { symbol: 'Bagno',     meaning: 'Utknięcie, nierozwiązane emocje, obszar do oczyszczenia', color: '#6EE7B7', icon: '🌿' },
  { symbol: 'Głos',      meaning: 'Wewnętrzna mądrość, wezwanie duszy lub pominięte przesłanie', color: '#C084FC', icon: '🗣️' },
  { symbol: 'Szkoła',    meaning: 'Nauka, ocena samego siebie, powrót do nierozwiązanych lekcji', color: '#60A5FA', icon: '🏫' },
  { symbol: 'Świątynia', meaning: 'Sacrum, kontakt z boskością, centra głębokiej duchowości', color: '#FBBF24', icon: '⛩️' },
];

// ─── Recurring dream themes ───────────────────────────────────────────────────
const RECURRING_THEMES = [
  { id: 'falling',   label: 'Upadanie lub spadanie', icon: '⬇️',  color: '#6366F1' },
  { id: 'flying',    label: 'Latanie lub unoszenie się', icon: '🕊️', color: '#818CF8' },
  { id: 'teeth',     label: 'Wypadające zęby', icon: '🦷',       color: '#A78BFA' },
  { id: 'chase',     label: 'Bycie ściganym', icon: '🏃',         color: '#F87171' },
  { id: 'exam',      label: 'Egzamin lub test', icon: '📝',       color: '#FBBF24' },
  { id: 'naked',     label: 'Nagość w miejscu publicznym', icon: '😳', color: '#F472B6' },
  { id: 'lost',      label: 'Zgubienie się lub błądzenie', icon: '🗺️', color: '#60A5FA' },
  { id: 'death',     label: 'Śmierć lub umieranie', icon: '🌒',   color: '#C084FC' },
  { id: 'water',     label: 'Powódź lub tonięcie', icon: '🌊',    color: '#34D399' },
  { id: 'ex',        label: 'Była osoba lub relacja', icon: '💔', color: '#F87171' },
  { id: 'late',      label: 'Spóźnienie się na coś', icon: '⏰',   color: '#F59E0B' },
  { id: 'frozen',    label: 'Paraliż — nie mogę się ruszyć', icon: '🧊', color: '#6366F1' },
];

// ─── Lucid dreaming techniques ────────────────────────────────────────────────
const LUCID_TECHNIQUES = [
  {
    id: 'MILD',
    name: 'MILD',
    full: 'Mnemonic Induction of Lucid Dreams',
    desc: 'Przed snem wielokrotnie powtarzaj: "Będę pamiętać, że śnię." Gdy budzisz się po śnie, zapisz go, a następnie przez 20-30 minut zwizualizuj siebie jak uświadamiasz sobie, że śnisz.',
    steps: ['Obudź się po 5-6 godzinach snu', 'Zapisz treść snu w dzienniku', 'Przez 20 min czytaj notatkę i wizualizuj uświadomienie się', 'Zasypiając powtarzaj afirmację "Wiem, że śnię"'],
    difficulty: 'Łatwy',
    color: '#34D399',
  },
  {
    id: 'WILD',
    name: 'WILD',
    full: 'Wake Initiated Lucid Dream',
    desc: 'Przejście bezpośrednio z czuwania do snu lucydnego z zachowaniem świadomości. Ciało zasypia, ale umysł pozostaje przytomny. Zaawansowana technika.',
    steps: ['Połóż się po 5-6 godzinach snu lub drzemki', 'Rozluźnij całe ciało stopniowo', 'Obserwuj obrazy hipnagogiczne bez angażowania się', 'Pozwól ciału zasnąć zachowując świadomość umysłu'],
    difficulty: 'Zaawansowany',
    color: '#818CF8',
  },
  {
    id: 'DILD',
    name: 'DILD',
    full: 'Dream Initiated Lucid Dream',
    desc: 'Uświadomienie sobie że śnisz wewnątrz snu, poprzez rozpoznanie nierealistycznych elementów. Najbardziej naturalny i najczęstszy sposób.',
    steps: ['Ćwicz regularne kontrole rzeczywistości w ciągu dnia', 'Pytaj siebie co 2 godziny: czy śnię?', 'Sprawdzaj dłonie, zegary, napisy (zmienia się w snach)', 'Nawyk przeniesie się do świata snu'],
    difficulty: 'Naturalny',
    color: '#F59E0B',
  },
];

const REALITY_CHECKS = [
  { check: 'Sprawdź dłonie', tip: 'W snach dłonie mają za dużo lub za mało palców, wyglądają dziwacznie', icon: '✋' },
  { check: 'Przeczytaj tekst', tip: 'Napisy i cyfry zmieniają się przy ponownym czytaniu w snach', icon: '📖' },
  { check: 'Sprawdź zegar', tip: 'Czas na zegarze jest niestabilny lub niemożliwy w snach', icon: '⏰' },
  { check: 'Szczypnij nos', tip: 'W snach możesz oddychać mimo zatkniętego nosa', icon: '👃' },
  { check: 'Przypomnij ostatnie kroki', tip: 'Zapytaj: "Jak tu dotarłem?" — w snach brak logicznego początku', icon: '🔄' },
];

const PRE_SLEEP_RITUAL = [
  'Wyłącz ekrany 30 minut przed snem',
  'Zapisz intencję snu: "Tej nocy uświadomię sobie, że śnię"',
  'Przeczytaj wczorajszy sen w dzienniku',
  'Zrób 5 kontroli rzeczywistości przed snem',
  'Medytuj 10 minut na temat bycia świadomym',
  'Połóż dziennik snów obok łóżka',
];

// ─── Jungian deep questions ────────────────────────────────────────────────────
const JUNGIAN_QUESTIONS = [
  'Jaka część Ciebie — którą zwykle odrzucasz — mogła się pojawić w tej postaci lub symbolu?',
  'Gdybyś miał/a porozmawiać z najważniejszą postacią ze snu, co chciałbyś/chciałabyś powiedzieć?',
  'Jakie uczucie pozostało w ciele po przebudzeniu i gdzie je czujesz fizycznie?',
  'Czy ten obraz snu pojawia się w jakiejś formie w Twoim życiu na jawie?',
  'Co musiałoby się stać w Twoim życiu, żeby ten sen skończył się inaczej?',
];

// ─── Animated Moon Hero component ─────────────────────────────────────────────
const DreamMoonHero = ({ isLight }: { isLight: boolean }) => {
  const { t } = useTranslation();

  const breathScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.00, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      ), -1, false
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.25, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      ), -1, false
    );
  }, []);

  const moonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const moonPhaseInfo = getMoonPhase();

  const STARS = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    cx: ((i * 137.5) % (SW - 40)) + 20,
    cy: ((i * 89 + 12) % 130) + 10,
    r: i % 7 === 0 ? 2.2 : i % 3 === 0 ? 1.5 : 1,
    opacity: 0.15 + (i % 5) * 0.1,
    color: i % 4 === 0 ? ACCENT : '#FFFFFF',
  })), []);

  return (
    <Animated.View entering={FadeInDown.duration(600)} style={[di.moonHeroCard, { backgroundColor: isLight ? 'rgba(238,232,255,0.92)' : 'rgba(8,5,20,0.94)', borderColor: ACCENT + '33' }]}>
      <LinearGradient colors={isLight ? ['#EEE8FF', '#E8E0FF'] : ['#0C0820', '#050310']} style={StyleSheet.absoluteFill} />
      {/* Star field */}
      <Svg width={SW - 44} height={160} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
        {STARS.map((s, i) => (
          <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.color} opacity={s.opacity} />
        ))}
        {/* Orbital ring */}
        <Ellipse cx={(SW - 44) / 2} cy={80} rx={62} ry={62} stroke={ACCENT} strokeWidth={0.6} fill="none" opacity={0.18} strokeDasharray="4 8" />
      </Svg>
      {/* Moon body */}
      <View style={di.moonHeroCenter}>
        <Animated.View style={[di.moonGlowRing, glowStyle, { borderColor: ACCENT }]} />
        <Animated.View style={[di.moonBody, moonStyle]}>
          <Text style={di.moonHeroEmoji}>{moonPhaseInfo.emoji}</Text>
        </Animated.View>
      </View>
      <View style={di.moonHeroText}>
        <Text style={[di.moonHeroEyebrow, { color: ACCENT }]}>{t('dreamInterpreter.brama_snu', 'BRAMA SNU')}</Text>
        <Text style={[di.moonHeroTitle, { color: isLight ? '#1A1428' : '#F0EAFF' }]}>{t('dreamInterpreter.nie_szukasz_etykiety_otwierasz_zapi', 'Nie szukasz etykiety. Otwierasz zapis nocnej symboliki.')}</Text>
        <View style={di.moonPhasePill}>
          <Text style={[di.moonHeroPhaseName, { color: ACCENT }]}>{moonPhaseInfo.name}</Text>
          <Text style={[di.moonHeroTip, { color: isLight ? '#6A5A88' : '#B0A3C8' }]}>{moonPhaseInfo.dreamTip}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

export const DreamInterpreterScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { isLight } = useTheme();
  const { addEntry, entries } = useJournalStore();
  const textColor  = isLight ? '#1A1410' : '#F5F1EA';
  const subColor   = isLight ? '#6A5A48' : '#B0A49A';
  const cardBg     = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(10,8,22,0.88)';
  const scrollRef  = useRef(null);

  // Core dream states
  const [dreamText,       setDreamText]       = useState('');
  const [interpretation,  setInterpretation]  = useState('');
  const [detectedSymbols, setDetectedSymbols] = useState<any[]>([]);
  const [questions,       setQuestions]       = useState<string[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [saved,           setSaved]           = useState(false);
  const [sleepQuality,    setSleepQuality]    = useState<string>('GŁĘBOKI');
  const [savedSymbols,    setSavedSymbols]    = useState<Set<string>>(new Set());

  // Enhanced input states
  const [selectedMood,     setSelectedMood]     = useState<string>('');
  const [lucidityRating,   setLucidityRating]   = useState<number>(0);

  // Type tags
  const [selectedDreamTypes, setSelectedDreamTypes] = useState<Set<string>>(new Set());

  // Symbol dictionary
  const [symbolSearch,    setSymbolSearch]    = useState('');
  const [showSymbolDict,  setShowSymbolDict]  = useState(false);
  const [expandedSymbol,  setExpandedSymbol]  = useState<string>('');

  // Recurring themes tracker
  const [checkedThemes,   setCheckedThemes]   = useState<Record<string, number>>({});
  const [showRecurring,   setShowRecurring]   = useState(false);

  // Lucid dreaming guide
  const [showLucidGuide,  setShowLucidGuide]  = useState(false);
  const [activeLucidTech, setActiveLucidTech] = useState<string>('MILD');
  const [showRealityChecks, setShowRealityChecks] = useState(false);

  // Archetypes detection
  const [detectedArchetypes, setDetectedArchetypes] = useState<any[]>([]);

  // History expand
  const [expandedHistId,  setExpandedHistId]  = useState<string>('');

  const moonPhaseInfo = getMoonPhase();

  // Last 7 AI interpretations from journal history
  const recentDreamInterpretations = useMemo(() => {
    return entries
      .filter(e => e.type === 'dream' && e.content)
      .slice(0, 7)
      .map(e => {
        const parts = e.content?.split('\n\nInterpretacja:\n') || ['', ''];
        const dreamSnippet = (parts[0] || '').slice(0, 60);
        const interpFull   = (parts[1] || '');
        const interpSnippet = interpFull.slice(0, 120);
        const dateObj = new Date(e.date);
        const dateLabel = dateObj.toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'short' });
        const moonPhase = getMoonPhase(dateObj);
        const moodTag = (e.tags || []).find(t => MOOD_OPTIONS.some(m => m.id === t));
        const moodEmoji = moodTag ? (MOOD_OPTIONS.find(m => m.id === moodTag)?.emoji || '🌙') : '🌙';
        return { id: e.id, dateLabel, dreamSnippet, interpSnippet, interpFull, moonPhase, moodEmoji };
      });
  }, [entries]);

  // Symbol frequency from history — SVG bar chart data
  const symbolFrequency = useMemo(() => {
    const allDreamEntries = entries.filter(e => e.type === 'dream' && e.tags);
    const freq: Record<string, number> = {};
    allDreamEntries.forEach(e => {
      (e.tags || []).forEach(tag => {
        if (tag !== 'dream' && !QUALITY_CHIPS.some(c => c.id.toLowerCase() === tag)) {
          freq[tag] = (freq[tag] || 0) + 1;
        }
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([symbol, count]) => ({ symbol, count }));
  }, [entries]);

  const focusIntoView = (y = 260) => requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: Math.max(y - 140, 0), animated: true }));
  const detectSymbols = (text: string) => DREAM_DICTIONARY.filter(s => text.toLowerCase().includes(s.keyword.toLowerCase())).slice(0, 5);

  const detectArchetypes = useCallback((text: string) => {
    const lower = text.toLowerCase();
    return ARCHETYPES.filter(a => a.keywords.some(k => lower.includes(k))).slice(0, 3);
  }, []);

  const toggleDreamType = useCallback((id: string) => {
    setSelectedDreamTypes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleRecurringTheme = useCallback((id: string) => {
    setCheckedThemes(prev => {
      const current = prev[id] || 0;
      if (current > 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: 1 };
    });
  }, []);

  const incrementTheme = useCallback((id: string) => {
    setCheckedThemes(prev => ({ ...prev, [id]: (prev[id] || 1) + 1 }));
  }, []);

  const filteredQuickSymbols = useMemo(() => {
    if (!symbolSearch.trim()) return QUICK_SYMBOLS;
    const q = symbolSearch.toLowerCase();
    return QUICK_SYMBOLS.filter(s =>
      s.symbol.toLowerCase().includes(q) || s.meaning.toLowerCase().includes(q)
    );
  }, [symbolSearch]);

  const interpretDream = async () => {
    if (!dreamText.trim()) return;
    setLoading(true);
    focusIntoView(360);
    const symbols = detectSymbols(dreamText);
    setDetectedSymbols(symbols);
    const found = detectArchetypes(dreamText);
    setDetectedArchetypes(found);
    const symbolsText = symbols.map(s => `${s.keyword} (${s.emotionalTheme})`).join(', ');
    const dailyPlan = SoulEngineService.generateDailyPlan();
    const archetype = dailyPlan.archetype?.name || '';
    const moonPhase = dailyPlan.moonPhase?.name || '';
    const zodiac = userData.birthDate ? (() => { try { const { getZodiacSign } = require('../features/horoscope/utils/astrology'); return getZodiacSign(userData.birthDate); } catch { return ''; } })() : '';
    const personLine = userData.name ? `Sen ${userData.name}a${zodiac ? ` (znak: ${zodiac})` : ''}.` : zodiac ? `Sen osoby spod znaku ${zodiac}.` : 'Sen wędrowca duchowego.';
    const qualityLine = sleepQuality !== 'GŁĘBOKI' ? ` Jakość snu: ${sleepQuality}.` : '';
    const dreamTypeLine = selectedDreamTypes.size > 0 ? ` Typ snu: ${Array.from(selectedDreamTypes).join(', ')}.` : '';
    const moodLine = selectedMood ? ` Nastrój po śnie: ${MOOD_OPTIONS.find(m => m.id === selectedMood)?.label || selectedMood}.` : '';
    const lucidLine = lucidityRating > 0 ? ` Poziom lucydności: ${lucidityRating}/5.` : '';
    const archetypeLine = found.length > 0 ? ` Rozpoznane archetypy: ${found.map(a => a.name).join(', ')}.` : '';
    const prompt = `Jesteś głębokim interpretatorem snów łączącym psychologię Jungowską, tradycję archetypową i intuicję duchową. ${personLine}${qualityLine}${dreamTypeLine}${moodLine}${lucidLine}${moonPhase ? ` Faza Księżyca tej nocy: ${moonPhase}.` : ''}${archetype ? ` Aktywny archetyp dnia: ${archetype}.` : ''}${archetypeLine}

Treść snu:
"${dreamText}"
${symbolsText ? `
Rozpoznane symbole w tym śnie: ${symbolsText}.` : ''}

Zinterpretuj ten sen głęboko i precyzyjnie. Odpowiedz używając DOKŁADNIE tych nagłówków:

INTERPRETACJA:
[Co ten sen naprawdę komunikuje tej osobie z jej podświadomości? Jakie ukryte lęki, pragnienia lub nierozwiązane kwestie w nim żyją? Użyj konkretnych obrazów ze snu — nie pisz ogólnie. 4-5 zdań poetycko-psychologicznych.]

ENERGIA:
[Jaka dominująca emocja lub energia pulsuje w tym śnie? Jakie odczucie pozostało? Jedna lub dwie zdania precyzyjnego opisu emocjonalnego tonu.]

PRZESŁANIE:
[Jakie konkretne przesłanie lub impuls do działania niesie ten sen dla tej osoby teraz, w jej aktualnym życiu? Co chce ona usłyszeć od siebie samej przez ten obraz? 2-3 zdania.]

PYTANIA:
[3 głębokie pytania do samorefleksji, które pomogą osobie dalej eksplorować materiał snu. Każde pytanie w osobnej linii, zaczynając od znaku zapytania ?]

Pisz w języku użytkownika. Bądź konkretny — każde zdanie powinno dotyczyć TEGO snu, nie mogłoby pasować do innego.`;
    const localizedPrompt = i18n.language?.startsWith('en')
      ? prompt
          .replace('Zinterpretuj ten sen głęboko i precyzyjnie. Odpowiedz używając DOKŁADNIE tych nagłówków:', 'Interpret this dream deeply and precisely. Respond using EXACTLY these headings:')
          .replace('INTERPRETACJA:', 'INTERPRETATION:')
          .replace('ENERGIA:', 'ENERGY:')
          .replace('PRZESŁANIE:', 'MESSAGE:')
          .replace('PYTANIA:', 'QUESTIONS:')
          .replace('Pisz w języku użytkownika. Bądź konkretny — każde zdanie powinno dotyczyć TEGO snu, nie mogłoby pasować do innego.', 'Write in English. Be specific — every sentence should belong to THIS dream, not just any dream.')
      : prompt;
    try {
      const text = await AiService.chatWithOracle([{ role: 'user', content: localizedPrompt }], i18n.language?.startsWith('en') ? 'en' : 'pl');
      const iMatch = text.match(/(?:INTERPRETACJA|INTERPRETATION):\s*([\s\S]*?)(?=(?:ENERGIA|ENERGY):|$)/);
      const qMatch = text.match(/(?:PYTANIA|QUESTIONS):\s*([\s\S]*?)$/);
      setInterpretation((iMatch?.[1]?.trim() || text).replace(/^(?:PRZESŁANIE|MESSAGE):[\s\S]*?(?=(?:PYTANIA|QUESTIONS):|$)/, '').trim());
      const qLines = (qMatch?.[1] || '').split('\n').filter((l: string) => l.includes('?')).map((l: string) => l.replace(/^[?•\-\d.]\s*/, '').trim()).filter(Boolean);
      setQuestions(qLines.slice(0, 3));
    } catch {
      setInterpretation(i18n.language?.startsWith('en') ? 'This dream carries an important clue. The images that return most strongly point toward parts of life asking for attention, tenderness and integration.' : 'Ten sen niesie ważny trop. Obrazy, które wracają najmocniej, wskazują na obszary życia domagające się uwagi, czułości i integracji.');
      setQuestions([
        i18n.language?.startsWith('en') ? 'What in this dream moved you most, and why does this image keep returning?' : 'Co w tym śnie poruszyło Cię najmocniej i dlaczego właśnie ten obraz wraca?',
        i18n.language?.startsWith('en') ? 'What emotion remained in your body after waking?' : 'Jaka emocja została w ciele po przebudzeniu?',
        i18n.language?.startsWith('en') ? 'Which motif from the dream already exists in your waking life?' : 'Który motyw ze snu już istnieje w Twoim życiu na jawie?',
      ]);
    }
    setLoading(false);
  };

  const saveDream = () => {
    addEntry({
      type: 'dream',
      title: (i18n.language?.startsWith('en') ? 'Dream · ' : 'Sen · ') + formatLocaleDate(new Date()),
      content: dreamText + (interpretation ? '\n\nInterpretacja:\n' + interpretation : ''),
      tags: ['dream', sleepQuality.toLowerCase(), ...(selectedMood ? [selectedMood] : []), ...Array.from(selectedDreamTypes), ...detectedSymbols.map(s => s.keyword)],
    });
    setSaved(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const toggleSaveSymbol = (keyword: string) => {
    setSavedSymbols(prev => {
      const next = new Set(prev);
      if (next.has(keyword)) next.delete(keyword); else next.add(keyword);
      return next;
    });
  };

  const activeTip = QUALITY_CHIPS.find(c => c.id === sleepQuality)?.tip ?? '';

  const isFav = isFavoriteItem('dream-interpreter');
  const handleAddFavorite = () => {
    if (isFav) {
      removeFavoriteItem('dream-interpreter');
    } else {
      addFavoriteItem({
        id: 'dream-interpreter',
        label: 'Sennik AI',
        sublabel: 'Interpretacja snów',
        route: 'DreamInterpreter',
        icon: 'Moon',
        color: ACCENT,
        addedAt: new Date().toISOString(),
      });
    }
  };

  const activeLucidData = LUCID_TECHNIQUES.find(t => t.id === activeLucidTech);

  return (
    <View style={[di.container, { backgroundColor: isLight ? '#F0EEF8' : '#040308' }]}>
      <LinearGradient colors={isLight ? ['#F0EEF8', '#E8E4F8'] : ['#040308', '#080618', '#0C0A20']} style={StyleSheet.absoluteFill} />
      <Svg width={SW} height={250} style={{ position: 'absolute', top: 0 }} opacity={0.18}>
        <G>
          <Circle cx={SW * 0.72} cy={70} r={50} fill="none" stroke={ACCENT} strokeWidth={1.5} opacity={0.4} />
          {Array.from({ length: 18 }, (_, i) => <Circle key={i} cx={(i * 139 + 25) % SW} cy={(i * 89 + 15) % 230} r={i % 5 === 0 ? 2 : 1} fill={i % 4 === 0 ? ACCENT : 'white'} opacity={0.2 + (i % 3) * 0.1} />)}
          {[0, 1, 2].map(i => <Ellipse key={i} cx={SW / 2} cy={160 + i * 40} rx={70 - i * 15} ry={16 + i * 6} stroke={ACCENT} strokeWidth={0.5} fill="none" opacity={0.2} strokeDasharray="3 6" />)}
        </G>
      </Svg>

      <SafeAreaView style={di.safeArea} edges={['top']}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          <View style={di.header}>
            <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={di.backBtn} hitSlop={14}>
              <ChevronLeft color={ACCENT} size={28} strokeWidth={1.5} />
            </Pressable>
            <View style={di.headerCenter}>
              <Text style={[di.eyebrow, { color: ACCENT }]}>{t('dreamInterpreter.sennik_ai', 'SENNIK AI')}</Text>
              <Text style={[di.title, { color: textColor }]}>{t('dreamInterpreter.interpretu_sen', 'Interpretuj sen')}</Text>
            </View>
            <Pressable onPress={handleAddFavorite} style={di.starBtn} hitSlop={14}>
              <Star color={ACCENT} size={20} strokeWidth={1.6} fill={isFav ? ACCENT : 'none'} />
            </Pressable>
          </View>

          <ScrollView ref={scrollRef} contentContainerStyle={[di.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') + 20 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">

            {/* ── Animated Moon Hero ── */}
            <DreamMoonHero isLight={isLight} />

            {/* ── JAKOŚĆ SNU ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(60)}>
              <View style={[di.sectionCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                <LinearGradient colors={[ACCENT + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                <Text style={[di.sectionEyebrow, { color: ACCENT }]}>{t('dreamInterpreter.jakosc_snu', '🌙 JAKOŚĆ SNU')}</Text>
                <Text style={[di.sectionSubtitle, { color: subColor }]}>{t('dreamInterpreter.jak_wygladal_twoj_sen_tej', 'Jak wyglądał Twój sen tej nocy?')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={di.qualityRow}>
                  {QUALITY_CHIPS.map(chip => {
                    const active = sleepQuality === chip.id;
                    return (
                      <Pressable
                        key={chip.id}
                        onPress={() => setSleepQuality(chip.id)}
                        style={[di.qualityChip, { backgroundColor: active ? ACCENT + '28' : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)'), borderColor: active ? ACCENT : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.14)') }]}
                      >
                        <Text style={[di.qualityChipText, { color: active ? ACCENT : subColor, fontWeight: active ? '700' : '500' }]}>{chip.id}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {activeTip ? <Text style={[di.qualityTip, { color: subColor }]}>{activeTip}</Text> : null}
              </View>
            </Animated.View>

            {/* ── NASTRÓJ + LUCYDNOŚĆ ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(80)}>
              <View style={[di.sectionCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                <LinearGradient colors={[ACCENT + '0A', 'transparent']} style={StyleSheet.absoluteFill} />
                <Text style={[di.sectionEyebrow, { color: ACCENT }]}>{t('dreamInterpreter.nastroj_i_lucydnosc', '💭 NASTRÓJ I LUCYDNOŚĆ')}</Text>
                <Text style={[di.sectionSubtitle, { color: subColor }]}>{t('dreamInterpreter.jaki_nastroj_przewazal_w_snie', 'Jaki nastrój przeważał w śnie?')}</Text>
                <View style={di.moodGrid}>
                  {MOOD_OPTIONS.map(m => {
                    const active = selectedMood === m.id;
                    return (
                      <Pressable key={m.id} onPress={() => setSelectedMood(active ? '' : m.id)}
                        style={[di.moodChip, { backgroundColor: active ? ACCENT + '2A' : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)'), borderColor: active ? ACCENT : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)') }]}>
                        <Text style={di.moodEmoji}>{m.emoji}</Text>
                        <Text style={[di.moodLabel, { color: active ? ACCENT : subColor, fontWeight: active ? '700' : '500' }]}>{m.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={di.lucidRow}>
                  <Eye color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={[di.lucidLabel, { color: ACCENT }]}>{t('dreamInterpreter.lucydnosc', 'LUCYDNOŚĆ')}</Text>
                  <Text style={[di.lucidSub, { color: subColor }]}>{lucidityRating}/5</Text>
                </View>
                <View style={di.lucidStars}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <Pressable key={n} onPress={() => setLucidityRating(n === lucidityRating ? 0 : n)} hitSlop={8}>
                      <Star size={28} color={n <= lucidityRating ? ACCENT : (isLight ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.20)')} fill={n <= lucidityRating ? ACCENT : 'none'} strokeWidth={1.4} />
                    </Pressable>
                  ))}
                  {lucidityRating > 0 && (
                    <Text style={[di.lucidRatingLabel, { color: subColor }]}>
                      {lucidityRating === 1 ? 'Chwila świadomości' : lucidityRating === 2 ? 'Przebłysk lucydności' : lucidityRating === 3 ? 'Częściowo świadomy' : lucidityRating === 4 ? 'Mocno lucydny' : 'Pełna kontrola'}
                    </Text>
                  )}
                </View>
              </View>
            </Animated.View>

            {/* ── TYPY SNÓW ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(95)}>
              <View style={[di.sectionCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                <LinearGradient colors={[ACCENT + '08', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={di.sectionHeaderRow}>
                  <Tag color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={[di.sectionEyebrow, { color: ACCENT }]}>{t('dreamInterpreter.typy_snow', 'TYPY SNÓW')}</Text>
                </View>
                <Text style={[di.sectionSubtitle, { color: subColor }]}>{t('dreamInterpreter.wybierz_jeden_lub_wiecej_typow', 'Wybierz jeden lub więcej typów, które pasują do Twojego snu.')}</Text>
                <View style={di.dreamTypeGrid}>
                  {DREAM_TYPE_TAGS.map(dt => {
                    const active = selectedDreamTypes.has(dt.id);
                    return (
                      <Pressable key={dt.id} onPress={() => toggleDreamType(dt.id)}
                        style={[di.dreamTypeChip, { backgroundColor: active ? dt.color + '28' : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)'), borderColor: active ? dt.color : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)') }]}>
                        <Text style={di.dreamTypeIcon}>{dt.icon}</Text>
                        <Text style={[di.dreamTypeText, { color: active ? dt.color : subColor, fontWeight: active ? '700' : '500' }]}>{dt.id}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Animated.View>

            {/* ── FAZA KSIĘŻYCA ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(110)}>
              <View style={[di.moonCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                <LinearGradient colors={[ACCENT + '0E', 'transparent']} style={StyleSheet.absoluteFill} />
                <Text style={[di.sectionEyebrow, { color: ACCENT }]}>{t('dreamInterpreter.faza_ksiezyca_przy_snie', '🌕 FAZA KSIĘŻYCA PRZY ŚNIE')}</Text>
                <View style={di.moonRow}>
                  <Text style={di.moonEmoji}>{moonPhaseInfo.emoji}</Text>
                  <View style={di.moonInfo}>
                    <Text style={[di.moonPhaseName, { color: textColor }]}>{moonPhaseInfo.name}</Text>
                    <Text style={[di.moonTip, { color: subColor }]}>{moonPhaseInfo.dreamTip}</Text>
                  </View>
                </View>
                <Pressable onPress={() => navigation.navigate('LunarCalendar')} style={[di.moonLinkBtn, { borderColor: ACCENT + '44' }]}>
                  <CalendarDays color={ACCENT} size={14} />
                  <Text style={[di.moonLinkText, { color: ACCENT }]}>{t('dreamInterpreter.pelny_kalendarz_ksiezycowy', 'Pełny kalendarz księżycowy')}</Text>
                  <ArrowRight color={ACCENT} size={13} />
                </Pressable>
              </View>
            </Animated.View>

            {/* ── OPISZ SEN (enhanced input) ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(125)}>
              <View style={[di.inputCard, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}>
                <LinearGradient colors={[ACCENT + '14', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={di.inputLabelRow}>
                  <Text style={[di.inputLabel, { color: ACCENT }]}>{t('dreamInterpreter.opisz_swoj_sen', 'OPISZ SWÓJ SEN')}</Text>
                  <Text style={[di.charCounter, { color: dreamText.length > 800 ? '#F87171' : subColor }]}>{dreamText.length}/1200</Text>
                </View>
                <Text style={[di.inputBody, { color: subColor }]}>{t('dreamInterpreter.zapisz_obrazy_tak_jak_wracaja', 'Zapisz obrazy tak, jak wracają. Nie poprawiaj ich na siłę. Szczegóły, które wydają się dziwne, często niosą najmocniejsze znaczenie.')}</Text>
                <MysticalInput value={dreamText} onChangeText={t => setDreamText(t.slice(0, 1200))} placeholder={t('dreamInterpreter.opisz_sen_ktory_wciaz_z', 'Opisz sen, który wciąż z Tobą zostaje. Nie musisz pamiętać wszystkiego — wystarczy jeden obraz, jedno uczucie...')} placeholderTextColor={subColor} multiline onFocusScroll={() => focusIntoView()} textAlignVertical="top" style={{ color: textColor, minHeight: 110, fontSize: 15, lineHeight: 24 }} />
                {detectedSymbols.length > 0 && !loading && (
                  <View style={di.symbolsRow}>
                    <Text style={[di.symbolsLabel, { color: ACCENT }]}>{t('dreamInterpreter.wykryte', 'Wykryte:')}</Text>
                    {detectedSymbols.map(s => <View key={s.id} style={[di.symbolChip, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '33' }]}><Text style={[di.symbolChipText, { color: ACCENT }]}>{s.keyword}</Text></View>)}
                  </View>
                )}
                <Pressable onPress={interpretDream} disabled={!dreamText.trim() || loading}
                  style={[di.interpretBtn, { backgroundColor: dreamText.trim() && !loading ? ACCENT : ACCENT + '55' }]}>
                  {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Sparkles color="#FFF" size={16} />}
                  <Text style={di.interpretBtnText}>{loading ? 'Interpretuję...' : 'Interpretuj sen'}</Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* ── WYNIK INTERPRETACJI ── */}
            {interpretation && !loading && (
              <Animated.View entering={FadeInDown.duration(500)}>
                <View style={[di.resultCard, { borderColor: ACCENT + '66', shadowColor: ACCENT, shadowOpacity: 0.32, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 9 }]}>
                  <LinearGradient colors={[ACCENT + '24', 'transparent', ACCENT + '0A'] as const} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
                  <LinearGradient colors={['transparent', ACCENT + 'AA', 'transparent'] as [string,string,string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 }} pointerEvents="none" />
                  <View style={{ position: 'absolute', top: 10, right: 16, width: 8, height: 8, borderTopWidth: 1.8, borderRightWidth: 1.8, borderColor: ACCENT + '88' }} pointerEvents="none" />
                  <View style={{ position: 'absolute', bottom: 10, left: 16, width: 8, height: 8, borderBottomWidth: 1.8, borderLeftWidth: 1.8, borderColor: ACCENT + '55' }} pointerEvents="none" />
                  <View style={di.resultHeader}>
                    <Moon color={ACCENT} size={18} />
                    <Text style={[di.resultLabel, { color: ACCENT }]}>{t('dreamInterpreter.interpreta_oracle', 'INTERPRETACJA ORACLE')}</Text>
                  </View>
                  <Text style={[di.resultBody, { color: textColor }]}>{interpretation}</Text>

                  {/* Detected archetypes in result */}
                  {detectedArchetypes.length > 0 && (
                    <>
                      <Text style={[di.symbolsTitle, { color: ACCENT }]}>{t('dreamInterpreter.archetypy_w_tym_snie', '🔮 ARCHETYPY W TYM ŚNIE')}</Text>
                      {detectedArchetypes.map(a => (
                        <View key={a.name} style={[di.archetypeResultCard, { backgroundColor: a.color + (isLight ? '12' : '1C'), borderColor: a.color + '30' }]}>
                          <Text style={di.archetypeResultIcon}>{a.icon}</Text>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={[di.archetypeResultName, { color: a.color }]}>{a.name}</Text>
                            <Text style={[di.archetypeResultSign, { color: subColor }]}>{a.dreamSign}</Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}

                  {detectedSymbols.length > 0 && (
                    <>
                      <Text style={[di.symbolsTitle, { color: ACCENT }]}>{t('dreamInterpreter.symbole_slownika', '💭 SYMBOLE SŁOWNIKA')}</Text>
                      {detectedSymbols.map(s => (
                        <View key={s.id} style={[di.symbolDetailCard, { backgroundColor: isLight ? 'rgba(129,140,248,0.07)' : 'rgba(129,140,248,0.10)', borderColor: ACCENT + '30' }]}>
                          <View style={di.symbolDetailHeader}>
                            <Text style={[di.symbolKeyword, { color: ACCENT }]}>{s.keyword}</Text>
                            <Pressable onPress={() => toggleSaveSymbol(s.keyword)} style={[di.saveSymbolBtn, { backgroundColor: savedSymbols.has(s.keyword) ? ACCENT + '28' : 'transparent', borderColor: ACCENT + '55' }]}>
                              <Text style={[di.saveSymbolBtnText, { color: ACCENT }]}>{savedSymbols.has(s.keyword) ? '✓ Zapisano' : 'Zapisz symbol'}</Text>
                            </Pressable>
                          </View>
                          <Text style={[di.symbolMeaning, { color: subColor }]}>{s.emotionalTheme}</Text>
                          <Text style={[di.symbolBody, { color: textColor }]}>{s.meaning}</Text>
                        </View>
                      ))}
                    </>
                  )}

                  {questions.length > 0 && (
                    <>
                      <Text style={[di.questionsTitle, { color: ACCENT }]}>{t('dreamInterpreter.pytania_do_refleksji', 'PYTANIA DO REFLEKSJI')}</Text>
                      {questions.map((q, i) => (
                        <Pressable key={i} onPress={() => navigation.navigate('JournalEntry', { prompt: q, type: 'dream' })} style={[di.questionRow, { borderColor: ACCENT + '28' }]}>
                          <Text style={[di.questionText, { color: textColor }]}>{q}</Text>
                          <ArrowRight color={ACCENT} size={14} />
                        </Pressable>
                      ))}
                    </>
                  )}

                  <View style={[di.integrationCard, { borderColor: ACCENT + '26', backgroundColor: ACCENT + '10' }]}>
                    <Text style={[di.integrationTitle, { color: ACCENT }]}>{t('dreamInterpreter.po_interpreta', 'PO INTERPRETACJI')}</Text>
                    <Text style={[di.integrationBody, { color: subColor }]}>{t('dreamInterpreter.zatrzymaj_jedno_zdanie_z_odczytu', 'Zatrzymaj jedno zdanie z odczytu i przenieś je do dziennika. Sen zaczyna działać dopiero wtedy, gdy dostaje miejsce w codzienności.')}</Text>
                  </View>
                  {!saved
                    ? <Pressable onPress={saveDream} style={[di.saveBtn, { borderColor: ACCENT + '55', backgroundColor: ACCENT + '14' }]}><Brain color={ACCENT} size={16} /><Text style={[di.saveBtnText, { color: ACCENT }]}>{t('dreamInterpreter.zapisz_w_archiwum_snow', 'Zapisz w archiwum snów')}</Text></Pressable>
                    : <View style={di.savedBadge}><Text style={[di.savedText, { color: ACCENT }]}>{t('dreamInterpreter.zapisano_w_archiwum', '✓ Zapisano w archiwum')}</Text></View>
                  }
                </View>
              </Animated.View>
            )}

            {/* ── PYTANIA POGŁĘBIAJĄCE (JUNGIAN) ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(145)}>
              <View style={[di.sectionCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                <LinearGradient colors={[ACCENT + '0C', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={di.sectionHeaderRow}>
                  <Brain color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={[di.sectionEyebrow, { color: ACCENT }]}>{t('dreamInterpreter.pytania_poglebiaja', 'PYTANIA POGŁĘBIAJĄCE')}</Text>
                </View>
                <Text style={[di.sectionSubtitle, { color: subColor }]}>{t('dreamInterpreter.5_jungowskic_pytan_ktore_pomagaja', '5 Jungowskich pytań, które pomagają zejść głębiej z materiałem snu.')}</Text>
                {JUNGIAN_QUESTIONS.map((q, i) => (
                  <Pressable key={i} onPress={() => navigation.navigate('JournalEntry', { prompt: q, type: 'dream' })}
                    style={[di.jungianRow, { borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.09)', borderBottomWidth: i < JUNGIAN_QUESTIONS.length - 1 ? StyleSheet.hairlineWidth : 0 }]}>
                    <View style={[di.jungianNum, { backgroundColor: ACCENT + '20', borderColor: ACCENT + '40' }]}>
                      <Text style={[di.jungianNumText, { color: ACCENT }]}>{i + 1}</Text>
                    </View>
                    <Text style={[di.jungianText, { color: textColor }]}>{q}</Text>
                    <ArrowRight color={ACCENT} size={14} strokeWidth={1.6} />
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* ── SŁOWNIK SYMBOLI (30+ searchable grid) ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(165)}>
              <View style={[di.sectionCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                <LinearGradient colors={[ACCENT + '08', 'transparent']} style={StyleSheet.absoluteFill} />
                <Pressable onPress={() => setShowSymbolDict(!showSymbolDict)} style={di.sectionHeaderRow}>
                  <Search color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={[di.sectionEyebrow, { color: ACCENT, flex: 1 }]}>{t('dreamInterpreter.slownik_symboli', 'SŁOWNIK SYMBOLI')}</Text>
                  <Text style={[di.dictCount, { color: subColor }]}>{QUICK_SYMBOLS.length} symboli</Text>
                  {showSymbolDict ? <ChevronUp color={ACCENT} size={16} /> : <ChevronDown color={ACCENT} size={16} />}
                </Pressable>
                <Text style={[di.sectionSubtitle, { color: subColor }]}>{t('dreamInterpreter.30_najczestsz_symboli_snow_dotknij', '30+ najczęstszych symboli snów. Dotknij symbol po rozwinięciu, aby zobaczyć pełne znaczenie.')}</Text>
                {showSymbolDict && (
                  <Animated.View entering={FadeInDown.duration(300)}>
                    <View style={[di.dictSearchRow, { backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.06)', borderColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)' }]}>
                      <Search color={subColor} size={14} strokeWidth={1.6} />
                      <TextInput value={symbolSearch} onChangeText={setSymbolSearch} placeholder={t('dreamInterpreter.szukaj_symbolu', 'Szukaj symbolu...')} placeholderTextColor={subColor} style={[di.dictSearchInput, { color: textColor }]} />
                      {symbolSearch.length > 0 && (
                        <Pressable onPress={() => setSymbolSearch('')} hitSlop={8}>
                          <Text style={{ color: subColor, fontSize: 16 }}>×</Text>
                        </Pressable>
                      )}
                    </View>
                    {/* Symbol grid */}
                    <View style={di.symbolGrid}>
                      {filteredQuickSymbols.map(s => {
                        const isExpanded = expandedSymbol === s.symbol;
                        return (
                          <Pressable key={s.symbol} onPress={() => setExpandedSymbol(isExpanded ? '' : s.symbol)}
                            style={[di.symbolGridCell, { backgroundColor: isExpanded ? s.color + '22' : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)'), borderColor: isExpanded ? s.color + '60' : (isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)') }]}>
                            <Text style={di.symbolGridIcon}>{s.icon}</Text>
                            <Text style={[di.symbolGridName, { color: isExpanded ? s.color : textColor }]}>{s.symbol}</Text>
                            {isExpanded && (
                              <Animated.View entering={FadeInDown.duration(200)} style={di.symbolGridMeaning}>
                                <Text style={[di.symbolGridMeaningText, { color: subColor }]}>{s.meaning}</Text>
                              </Animated.View>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                    {filteredQuickSymbols.length === 0 && (
                      <Text style={[di.sectionSubtitle, { color: subColor, textAlign: 'center', paddingVertical: 12 }]}>Brak wyników dla "{symbolSearch}"</Text>
                    )}
                  </Animated.View>
                )}
              </View>
            </Animated.View>

            {/* ── POWTARZAJĄCE SIĘ SNY ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(185)}>
              <View style={[di.sectionCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                <LinearGradient colors={[ACCENT + '08', 'transparent']} style={StyleSheet.absoluteFill} />
                <Pressable onPress={() => setShowRecurring(!showRecurring)} style={di.sectionHeaderRow}>
                  <CheckSquare color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={[di.sectionEyebrow, { color: ACCENT, flex: 1 }]}>{t('dreamInterpreter.powtarzaja_sie_sny', 'POWTARZAJĄCE SIĘ SNY')}</Text>
                  <Text style={[di.dictCount, { color: subColor }]}>{Object.keys(checkedThemes).length} zaznaczonych</Text>
                  {showRecurring ? <ChevronUp color={ACCENT} size={16} /> : <ChevronDown color={ACCENT} size={16} />}
                </Pressable>
                <Text style={[di.sectionSubtitle, { color: subColor }]}>{t('dreamInterpreter.zaznacz_motywy_ktore_regularnie_pow', 'Zaznacz motywy, które regularnie powracają w Twoich snach. Dotknij licznik, aby zwiększyć częstotliwość.')}</Text>
                {showRecurring && (
                  <Animated.View entering={FadeInDown.duration(300)} style={{ gap: 8 }}>
                    {RECURRING_THEMES.map(theme => {
                      const checked = !!checkedThemes[theme.id];
                      const count = checkedThemes[theme.id] || 0;
                      return (
                        <View key={theme.id} style={[di.recurringRow, { borderColor: checked ? theme.color + '40' : (isLight ? 'rgba(122,95,54,0.14)' : 'rgba(255,255,255,0.08)'), backgroundColor: checked ? theme.color + '0E' : 'transparent' }]}>
                          <Pressable onPress={() => toggleRecurringTheme(theme.id)} hitSlop={8}>
                            {checked
                              ? <CheckSquare color={theme.color} size={20} strokeWidth={1.8} />
                              : <Square color={subColor} size={20} strokeWidth={1.6} />
                            }
                          </Pressable>
                          <Text style={di.recurringIcon}>{theme.icon}</Text>
                          <Text style={[di.recurringLabel, { color: checked ? textColor : subColor, fontWeight: checked ? '600' : '400', flex: 1 }]}>{theme.label}</Text>
                          {checked && (
                            <Pressable onPress={() => incrementTheme(theme.id)} style={[di.recurringCount, { backgroundColor: theme.color + '22', borderColor: theme.color + '44' }]}>
                              <Text style={[di.recurringCountText, { color: theme.color }]}>{count}×</Text>
                            </Pressable>
                          )}
                        </View>
                      );
                    })}
                    {Object.keys(checkedThemes).length > 0 && (
                      <View style={[di.recurringInsight, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '30' }]}>
                        <Text style={[di.recurringInsightText, { color: ACCENT }]}>
                          {t('dreamInterpreter.powtarzaja_sie_sny_czesto_wskazuja', 'Powtarzające się sny często wskazują na nierozwiązane napięcia lub ważne przesłanie podświadomości. Rozważ pracę z cieniem lub sesję z Oracle.')}
                        </Text>
                      </View>
                    )}
                  </Animated.View>
                )}
              </View>
            </Animated.View>

            {/* ── ARCHETYPY JUNGOWSKIE ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(200)}>
              <View style={[di.sectionCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                <LinearGradient colors={[ACCENT + '08', 'transparent']} style={StyleSheet.absoluteFill} />
                <Text style={[di.sectionEyebrow, { color: ACCENT }]}>{t('dreamInterpreter.archetypy_w_snach', '📖 ARCHETYPY W SNACH')}</Text>
                <Text style={[di.sectionSubtitle, { color: subColor }]}>{t('dreamInterpreter.6_jungowskic_wzorcow_kazdy_niesie', '6 Jungowskich wzorców — każdy niesie inną energię i przesłanie')}</Text>
                <View style={di.archetypesGrid}>
                  {ARCHETYPES.map(a => (
                    <View key={a.name} style={[di.archetypeCard, { backgroundColor: a.color + (isLight ? '14' : '1A'), borderColor: a.color + '30' }]}>
                      <Text style={di.archetypeIcon}>{a.icon}</Text>
                      <Text style={[di.archetypeName, { color: a.color }]}>{a.name}</Text>
                      <Text style={[di.archetypeDesc, { color: subColor }]}>{a.desc}</Text>
                      <Text style={[di.archetypeDreamSign, { color: a.color + 'AA' }]}>{a.dreamSign}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* ── WZORCE SNÓW (SVG bar chart) ── */}
            {symbolFrequency.length > 0 && (
              <Animated.View entering={FadeInDown.duration(500).delay(215)}>
                <View style={[di.sectionCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                  <LinearGradient colors={[ACCENT + '08', 'transparent']} style={StyleSheet.absoluteFill} />
                  <View style={di.sectionHeaderRow}>
                    <BarChart2 color={ACCENT} size={14} strokeWidth={1.8} />
                    <Text style={[di.sectionEyebrow, { color: ACCENT }]}>{t('dreamInterpreter.wzorce_snow', 'WZORCE SNÓW')}</Text>
                  </View>
                  <Text style={[di.sectionSubtitle, { color: subColor }]}>{t('dreamInterpreter.najczestsz_symbole_w_twoim_archiwum', 'Najczęstsze symbole w Twoim archiwum snów.')}</Text>
                  {/* SVG chart */}
                  <Svg width={SW - 88} height={symbolFrequency.length * 36 + 8} style={{ marginTop: 4 }}>
                    {symbolFrequency.map((item, i) => {
                      const maxCount = symbolFrequency[0].count;
                      const maxBarW = SW - 88 - 90 - 28;
                      const barW = Math.max((item.count / maxCount) * maxBarW, 8);
                      const y = i * 36 + 4;
                      return (
                        <G key={item.symbol}>
                          <Path d={`M${90},${y + 10} L${90 + barW},${y + 10} L${90 + barW},${y + 22} L${90},${y + 22} Z`} fill={ACCENT} opacity={0.7 - i * 0.08} rx={4} />
                          <Path d={`M${90},${y + 10} L${90 + maxBarW},${y + 10} L${90 + maxBarW},${y + 22} L${90},${y + 22} Z`} fill={isLight ? 'rgba(122,95,54,0.14)' : 'rgba(255,255,255,0.08)'} rx={4} />
                          <Path d={`M${90},${y + 10} L${90 + barW},${y + 10} L${90 + barW},${y + 22} L${90},${y + 22} Z`} fill={ACCENT} opacity={0.7 - i * 0.08} rx={4} />
                        </G>
                      );
                    })}
                  </Svg>
                  {/* Labels overlay */}
                  {symbolFrequency.map((item, i) => {
                    const maxCount = symbolFrequency[0].count;
                    const maxBarW = SW - 88 - 90 - 28;
                    const barW = Math.max((item.count / maxCount) * maxBarW, 8);
                    return (
                      <View key={item.symbol + '_label'} style={[di.patternBarRow, { marginTop: i === 0 ? -(symbolFrequency.length * 36 + 4) : 0 }]}>
                        <Text style={[di.patternBarLabel, { color: textColor }]}>{item.symbol}</Text>
                        <View style={{ flex: 1 }} />
                        <Text style={[di.patternBarCount, { color: ACCENT }]}>{item.count}×</Text>
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* ── HISTORIA INTERPRETACJI (7 entries, expandable) ── */}
            {recentDreamInterpretations.length > 0 && (
              <Animated.View entering={FadeInDown.duration(500).delay(230)}>
                <View style={[di.sectionCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                  <LinearGradient colors={[ACCENT + '08', 'transparent']} style={StyleSheet.absoluteFill} />
                  <View style={di.sectionHeaderRow}>
                    <BookOpen color={ACCENT} size={14} strokeWidth={1.8} />
                    <Text style={[di.sectionEyebrow, { color: ACCENT }]}>{t('dreamInterpreter.historia_snow', 'HISTORIA SNÓW')}</Text>
                    <Text style={[di.dictCount, { color: subColor }]}>{recentDreamInterpretations.length} zapisanych</Text>
                  </View>
                  <Text style={[di.sectionSubtitle, { color: subColor }]}>{t('dreamInterpreter.ostatnie_7_snow_z_archiwum', 'Ostatnie 7 snów z archiwum. Dotknij, aby rozwinąć interpretację.')}</Text>
                  {recentDreamInterpretations.map((item, i) => {
                    const expanded = expandedHistId === item.id;
                    return (
                      <Pressable key={item.id} onPress={() => setExpandedHistId(expanded ? '' : item.id)}
                        style={[di.histCard, { backgroundColor: isLight ? 'rgba(129,140,248,0.06)' : 'rgba(129,140,248,0.08)', borderColor: ACCENT + (expanded ? '44' : '28'), marginBottom: i < recentDreamInterpretations.length - 1 ? 10 : 0 }]}>
                        <View style={di.histCardHeader}>
                          <Text style={[di.histDate, { color: ACCENT }]}>{item.dateLabel}</Text>
                          <View style={di.histMoonBadge}>
                            <Text style={di.histMoodEmoji}>{item.moodEmoji}</Text>
                            <Text style={di.histMoonEmoji}>{item.moonPhase.emoji}</Text>
                            <Text style={[di.histMoonName, { color: subColor }]}>{item.moonPhase.name}</Text>
                          </View>
                          {expanded ? <ChevronUp color={ACCENT} size={14} /> : <ChevronDown color={subColor} size={14} />}
                        </View>
                        {item.dreamSnippet ? (
                          <Text style={[di.histDream, { color: subColor }]} numberOfLines={expanded ? undefined : 1}>"{item.dreamSnippet}..."</Text>
                        ) : null}
                        {expanded && item.interpFull ? (
                          <Animated.View entering={FadeInDown.duration(250)} style={[di.histExpandBody, { borderTopColor: ACCENT + '20' }]}>
                            <Text style={[di.histInterp, { color: textColor }]}>{item.interpFull}</Text>
                          </Animated.View>
                        ) : (!expanded && item.interpSnippet) ? (
                          <Text style={[di.histInterp, { color: textColor }]} numberOfLines={2}>{item.interpSnippet}...</Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* ── LUCID DREAMING GUIDE ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(250)}>
              <View style={[di.sectionCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                <LinearGradient colors={[ACCENT + '0A', 'transparent']} style={StyleSheet.absoluteFill} />
                <Pressable onPress={() => setShowLucidGuide(!showLucidGuide)} style={di.sectionHeaderRow}>
                  <Lightbulb color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={[di.sectionEyebrow, { color: ACCENT, flex: 1 }]}>{t('dreamInterpreter.sny_lucydne_poradnik', 'SNY LUCYDNE — PORADNIK')}</Text>
                  {showLucidGuide ? <ChevronUp color={ACCENT} size={16} /> : <ChevronDown color={ACCENT} size={16} />}
                </Pressable>
                <Text style={[di.sectionSubtitle, { color: subColor }]}>{t('dreamInterpreter.techniki_wprowadzen_sie_w_swiadomy', 'Techniki wprowadzenia się w świadomy sen: WILD, MILD, DILD oraz kontrole rzeczywistości.')}</Text>
                {showLucidGuide && (
                  <Animated.View entering={FadeInDown.duration(350)} style={{ gap: 14 }}>
                    {/* Technique selector */}
                    <View style={di.lucidTechRow}>
                      {LUCID_TECHNIQUES.map(t => (
                        <Pressable key={t.id} onPress={() => setActiveLucidTech(t.id)}
                          style={[di.lucidTechChip, { backgroundColor: activeLucidTech === t.id ? t.color + '28' : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)'), borderColor: activeLucidTech === t.id ? t.color : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)') }]}>
                          <Text style={[di.lucidTechChipText, { color: activeLucidTech === t.id ? t.color : subColor, fontWeight: activeLucidTech === t.id ? '700' : '500' }]}>{t.id}</Text>
                          <Text style={[di.lucidDiffBadge, { color: activeLucidTech === t.id ? t.color : subColor }]}>{t.difficulty}</Text>
                        </Pressable>
                      ))}
                    </View>
                    {/* Active technique details */}
                    {activeLucidData && (
                      <Animated.View entering={FadeInDown.duration(300)} key={activeLucidTech} style={[di.lucidDetailCard, { backgroundColor: activeLucidData.color + (isLight ? '10' : '18'), borderColor: activeLucidData.color + '30' }]}>
                        <Text style={[di.lucidDetailTitle, { color: activeLucidData.color }]}>{activeLucidData.name} — {activeLucidData.full}</Text>
                        <Text style={[di.lucidDetailDesc, { color: textColor }]}>{activeLucidData.desc}</Text>
                        <Text style={[di.lucidStepsTitle, { color: activeLucidData.color }]}>{t('dreamInterpreter.kroki', 'KROKI:')}</Text>
                        {activeLucidData.steps.map((step, si) => (
                          <View key={si} style={di.lucidStepRow}>
                            <View style={[di.lucidStepNum, { backgroundColor: activeLucidData.color + '22', borderColor: activeLucidData.color + '40' }]}>
                              <Text style={[di.lucidStepNumText, { color: activeLucidData.color }]}>{si + 1}</Text>
                            </View>
                            <Text style={[di.lucidStepText, { color: textColor }]}>{step}</Text>
                          </View>
                        ))}
                      </Animated.View>
                    )}
                    {/* Reality checks */}
                    <Pressable onPress={() => setShowRealityChecks(!showRealityChecks)} style={[di.realityChecksHeader, { borderColor: ACCENT + '30' }]}>
                      <Eye color={ACCENT} size={14} />
                      <Text style={[di.sectionEyebrow, { color: ACCENT, flex: 1 }]}>{t('dreamInterpreter.kontrole_rzeczywist', 'KONTROLE RZECZYWISTOŚCI')}</Text>
                      {showRealityChecks ? <ChevronUp color={ACCENT} size={14} /> : <ChevronDown color={ACCENT} size={14} />}
                    </Pressable>
                    {showRealityChecks && (
                      <Animated.View entering={FadeInDown.duration(250)} style={{ gap: 8 }}>
                        {REALITY_CHECKS.map((rc, i) => (
                          <View key={i} style={[di.rcRow, { backgroundColor: isLight ? 'rgba(129,140,248,0.06)' : 'rgba(129,140,248,0.09)', borderColor: ACCENT + '20' }]}>
                            <Text style={di.rcIcon}>{rc.icon}</Text>
                            <View style={{ flex: 1, gap: 2 }}>
                              <Text style={[di.rcName, { color: textColor }]}>{rc.check}</Text>
                              <Text style={[di.rcTip, { color: subColor }]}>{rc.tip}</Text>
                            </View>
                          </View>
                        ))}
                      </Animated.View>
                    )}
                    {/* Pre-sleep ritual */}
                    <View style={[di.preSleepCard, { backgroundColor: ACCENT + '0E', borderColor: ACCENT + '28' }]}>
                      <Text style={[di.preSleepTitle, { color: ACCENT }]}>{t('dreamInterpreter.rytual_przed_snem', '🌙 RYTUAŁ PRZED SNEM')}</Text>
                      {PRE_SLEEP_RITUAL.map((step, i) => (
                        <View key={i} style={di.preSleepRow}>
                          <View style={[di.preSleepDot, { backgroundColor: ACCENT }]} />
                          <Text style={[di.preSleepText, { color: textColor }]}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  </Animated.View>
                )}
              </View>
            </Animated.View>

            {/* ── CO DALEJ? ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(270)}>
              <View style={[di.sectionCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                <LinearGradient colors={[ACCENT + '0A', 'transparent']} style={StyleSheet.absoluteFill} />
                <Text style={[di.sectionEyebrow, { color: ACCENT }]}>{t('dreamInterpreter.co_dalej', '✦ CO DALEJ?')}</Text>
                <Text style={[di.sectionSubtitle, { color: subColor }]}>{t('dreamInterpreter.pogleb_prace_z_materialem_snu', 'Pogłęb pracę z materiałem snu')}</Text>
                <Pressable onPress={() => navigation.navigate('LunarCalendar')} style={[di.nextStepRow, { borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.09)' }]}>
                  <View style={[di.nextStepIcon, { backgroundColor: '#818CF8' + '22' }]}><CalendarDays color="#818CF8" size={18} /></View>
                  <View style={di.nextStepText}><Text style={[di.nextStepTitle, { color: textColor }]}>{t('dreamInterpreter.kalendarz_ksiezycowy', 'Kalendarz księżycowy')}</Text><Text style={[di.nextStepSub, { color: subColor }]}>{t('dreamInterpreter.powiaz_sen_z_energia_ksiezyca', 'Powiąż sen z energią Księżyca')}</Text></View>
                  <ArrowRight color={subColor} size={16} />
                </Pressable>
                <Pressable onPress={() => navigation.navigate('ShadowWork')} style={[di.nextStepRow, { borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.09)' }]}>
                  <View style={[di.nextStepIcon, { backgroundColor: '#6366F1' + '22' }]}><Layers color="#6366F1" size={18} /></View>
                  <View style={di.nextStepText}><Text style={[di.nextStepTitle, { color: textColor }]}>{t('dreamInterpreter.praca_z_cieniem', 'Praca z cieniem')}</Text><Text style={[di.nextStepSub, { color: subColor }]}>{t('dreamInterpreter.eksploruj_odrzucone_aspekty_siebie', 'Eksploruj odrzucone aspekty siebie')}</Text></View>
                  <ArrowRight color={subColor} size={16} />
                </Pressable>
                <Pressable
                  onPress={() => navigation.navigate('JournalEntry', { prompt: dreamText ? `Refleksja nad snem: ${dreamText.slice(0, 80)}...` : 'Zapis snu i moich refleksji', type: 'dream' })}
                  style={[di.nextStepRow, { borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.09)', borderBottomWidth: 0 }]}>
                  <View style={[di.nextStepIcon, { backgroundColor: '#34D399' + '22' }]}><BookOpen color="#34D399" size={18} /></View>
                  <View style={di.nextStepText}><Text style={[di.nextStepTitle, { color: textColor }]}>{t('dreamInterpreter.dziennik_refleksji', 'Dziennik refleksji')}</Text><Text style={[di.nextStepSub, { color: subColor }]}>{t('dreamInterpreter.zapisz_przemyslen_w_dzienniku', 'Zapisz przemyślenia w dzienniku')}</Text></View>
                  <ArrowRight color={subColor} size={16} />
                </Pressable>
              </View>
            </Animated.View>

            <EndOfContentSpacer size="standard" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const di = StyleSheet.create({
  container:          { flex: 1 },
  safeArea:           { flex: 1 },
  header:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingTop: 8, paddingBottom: 10 },
  backBtn:            { width: 40 },
  starBtn:            { width: 40, alignItems: 'flex-end' },
  headerCenter:       { flex: 1, alignItems: 'center' },
  eyebrow:            { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  title:              { fontSize: 18, fontWeight: '600' },
  scroll:             { paddingHorizontal: 22, paddingTop: 4, gap: 16 },

  // ── animated moon hero ──
  moonHeroCard:       { borderRadius: 26, borderWidth: 1, overflow: 'hidden', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 22 },
  moonHeroCenter:     { alignItems: 'center', marginBottom: 14 },
  moonGlowRing:       { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 1, top: -8, alignSelf: 'center' },
  moonBody:           { alignItems: 'center', justifyContent: 'center', width: 84, height: 84, borderRadius: 42 },
  moonHeroEmoji:      { fontSize: 60 },
  moonHeroText:       { gap: 6 },
  moonHeroEyebrow:    { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  moonHeroTitle:      { fontSize: 17, fontWeight: '600', lineHeight: 25 },
  moonPhasePill:      { gap: 3, marginTop: 4 },
  moonHeroPhaseName:  { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  moonHeroTip:        { fontSize: 13, lineHeight: 20 },

  // input
  inputCard:          { borderRadius: 22, borderWidth: 1, padding: 20, overflow: 'hidden', gap: 12 },
  inputLabelRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputLabel:         { fontSize: 10, fontWeight: '700', letterSpacing: 1.8 },
  charCounter:        { fontSize: 11, fontWeight: '500' },
  inputBody:          { fontSize: 13.5, lineHeight: 21 },
  input:              { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, lineHeight: 24, minHeight: 140, backgroundColor: 'rgba(255,255,255,0.05)' },
  symbolsRow:         { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  symbolsLabel:       { fontSize: 11, fontWeight: '600' },
  symbolChip:         { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  symbolChipText:     { fontSize: 11, fontWeight: '600' },
  interpretBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  interpretBtnText:   { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // mood & lucidity
  moodGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodChip:           { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  moodEmoji:          { fontSize: 14 },
  moodLabel:          { fontSize: 12, letterSpacing: 0.3 },
  lucidRow:           { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  lucidLabel:         { fontSize: 10, fontWeight: '700', letterSpacing: 1.8 },
  lucidSub:           { fontSize: 12 },
  lucidStars:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lucidRatingLabel:   { fontSize: 12, marginLeft: 4 },

  // result
  resultCard:         { borderRadius: 22, borderWidth: 1, padding: 20, overflow: 'hidden', gap: 14 },
  resultHeader:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultLabel:        { fontSize: 10, fontWeight: '700', letterSpacing: 1.8 },
  resultBody:         { fontSize: 16, lineHeight: 28 },
  symbolsTitle:       { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginTop: 4 },

  // archetype result cards
  archetypeResultCard:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 6 },
  archetypeResultIcon:  { fontSize: 22, marginTop: 1 },
  archetypeResultName:  { fontSize: 14, fontWeight: '700' },
  archetypeResultSign:  { fontSize: 12, lineHeight: 17 },

  // enhanced symbol detail cards
  symbolDetailCard:   { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6, marginBottom: 8 },
  symbolDetailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  symbolKeyword:      { fontSize: 15, fontWeight: '700' },
  symbolMeaning:      { fontSize: 11 },
  symbolBody:         { fontSize: 13, lineHeight: 20 },
  saveSymbolBtn:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  saveSymbolBtnText:  { fontSize: 11, fontWeight: '600' },

  symbolDetail:       { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12, gap: 3 },

  questionsTitle:     { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginTop: 4 },
  questionRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  questionText:       { flex: 1, fontSize: 14, lineHeight: 20 },
  integrationCard:    { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  integrationTitle:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.8 },
  integrationBody:    { fontSize: 13.5, lineHeight: 21 },
  saveBtn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  saveBtnText:        { fontSize: 14, fontWeight: '600' },
  savedBadge:         { alignItems: 'center', paddingVertical: 10 },
  savedText:          { fontSize: 14, fontWeight: '600' },

  // shared section card
  sectionCard:        { borderRadius: 22, borderWidth: 1, padding: 20, overflow: 'hidden', gap: 12 },
  sectionEyebrow:     { fontSize: 10, fontWeight: '700', letterSpacing: 1.8 },
  sectionSubtitle:    { fontSize: 13, lineHeight: 20, marginTop: -4 },
  sectionHeaderRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },

  // sleep quality chips
  qualityRow:         { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  qualityChip:        { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  qualityChipText:    { fontSize: 11, letterSpacing: 0.6 },
  qualityTip:         { fontSize: 12.5, lineHeight: 19, fontStyle: 'italic' },

  // dream type tags
  dreamTypeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dreamTypeChip:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  dreamTypeIcon:      { fontSize: 13 },
  dreamTypeText:      { fontSize: 12, letterSpacing: 0.4 },

  // moon phase card
  moonCard:           { borderRadius: 22, borderWidth: 1, padding: 20, overflow: 'hidden', gap: 14 },
  moonRow:            { flexDirection: 'row', alignItems: 'center', gap: 16 },
  moonEmoji:          { fontSize: 42 },
  moonInfo:           { flex: 1, gap: 4 },
  moonPhaseName:      { fontSize: 17, fontWeight: '700' },
  moonTip:            { fontSize: 13.5, lineHeight: 20 },
  moonLinkBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, alignSelf: 'flex-start' },
  moonLinkText:       { fontSize: 13, fontWeight: '600' },

  // Jungian questions
  jungianRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  jungianNum:         { width: 26, height: 26, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  jungianNumText:     { fontSize: 11, fontWeight: '800' },
  jungianText:        { flex: 1, fontSize: 13.5, lineHeight: 20 },

  // symbol dictionary grid
  dictSearchRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  dictSearchInput:    { flex: 1, fontSize: 14, padding: 0 },
  dictRow:            { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  dictSymbolBadge:    { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  dictSymbolName:     { fontSize: 12, fontWeight: '700' },
  dictMeaning:        { flex: 1, fontSize: 12.5, lineHeight: 19 },
  dictCount:          { fontSize: 11, marginRight: 6 },
  symbolGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symbolGridCell:     { borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center', width: (SW - 44 - 40 - 8 * 2) / 3, gap: 4 },
  symbolGridIcon:     { fontSize: 22 },
  symbolGridName:     { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  symbolGridMeaning:  { marginTop: 4 },
  symbolGridMeaningText: { fontSize: 10, lineHeight: 15, textAlign: 'center' },

  // recurring themes
  recurringRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1 },
  recurringIcon:      { fontSize: 18 },
  recurringLabel:     { fontSize: 13.5, lineHeight: 19 },
  recurringCount:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, minWidth: 36, alignItems: 'center' },
  recurringCountText: { fontSize: 12, fontWeight: '700' },
  recurringInsight:   { borderRadius: 14, borderWidth: 1, padding: 12, marginTop: 4 },
  recurringInsightText: { fontSize: 13, lineHeight: 20 },

  // symbol frequency bars (legacy layout support)
  patternBarRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  patternBarLabel:    { width: 80, fontSize: 12.5, fontWeight: '600' },
  patternBarBg:       { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  patternBarFill:     { height: '100%', borderRadius: 4 },
  patternBarCount:    { width: 28, fontSize: 12, fontWeight: '700', textAlign: 'right' },

  // interpretation history
  histCard:           { borderRadius: 14, borderWidth: 1, padding: 12, gap: 5 },
  histCardHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  histDate:           { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, flex: 1 },
  histMoonBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  histMoonEmoji:      { fontSize: 14 },
  histMoodEmoji:      { fontSize: 14 },
  histMoonName:       { fontSize: 11 },
  histDream:          { fontSize: 12, fontStyle: 'italic' },
  histInterp:         { fontSize: 13, lineHeight: 19 },
  histExpandBody:     { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, marginTop: 4 },

  // archetype grid
  archetypesGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  archetypeCard:      { width: (SW - 44 - 20 - 10) / 2, borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
  archetypeIcon:      { fontSize: 26 },
  archetypeName:      { fontSize: 13, fontWeight: '700' },
  archetypeDesc:      { fontSize: 12, lineHeight: 18 },
  archetypeDreamSign: { fontSize: 11, lineHeight: 16, fontStyle: 'italic', marginTop: 2 },

  // lucid dreaming guide
  lucidTechRow:       { flexDirection: 'row', gap: 8 },
  lucidTechChip:      { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center', gap: 3 },
  lucidTechChipText:  { fontSize: 14, fontWeight: '700' },
  lucidDiffBadge:     { fontSize: 9, letterSpacing: 0.5 },
  lucidDetailCard:    { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  lucidDetailTitle:   { fontSize: 13, fontWeight: '700', lineHeight: 19 },
  lucidDetailDesc:    { fontSize: 13.5, lineHeight: 21 },
  lucidStepsTitle:    { fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },
  lucidStepRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  lucidStepNum:       { width: 24, height: 24, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  lucidStepNumText:   { fontSize: 11, fontWeight: '800' },
  lucidStepText:      { flex: 1, fontSize: 13, lineHeight: 20 },
  realityChecksHeader:{ flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, paddingTop: 12, marginTop: 2 },
  rcRow:              { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderWidth: 1, padding: 10 },
  rcIcon:             { fontSize: 20, marginTop: 1 },
  rcName:             { fontSize: 13, fontWeight: '600' },
  rcTip:              { fontSize: 12, lineHeight: 18 },
  preSleepCard:       { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  preSleepTitle:      { fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },
  preSleepRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  preSleepDot:        { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  preSleepText:       { flex: 1, fontSize: 13, lineHeight: 20 },

  // co dalej next steps
  nextStepRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  nextStepIcon:       { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nextStepText:       { flex: 1, gap: 2 },
  nextStepTitle:      { fontSize: 14, fontWeight: '600' },
  nextStepSub:        { fontSize: 12, lineHeight: 17 },
});
