// @ts-nocheck
import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Text,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  TextInput,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Compass, MoonStar, Sparkles, Stars, Layers, Moon, ChevronDown, ChevronUp, ArrowRight, Check, Info, RefreshCw, Zap, BookOpen, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, G, Line, Path, Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg';
import { CelestialBackdrop } from '../components/CelestialBackdrop';
import { SectionHeading } from '../components/SectionHeading';
import { Typography } from '../components/Typography';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SW } = Dimensions.get('window');

// ─── COMPASS POINTS ──────────────────────────────────────────────────────────
const COMPASS_POINTS = [
  { label: 'Mądrość',   angle: 0,   color: '#A78BFA', id: 'western_astrology' },
  { label: 'Empatia',   angle: 45,  color: '#F472B6', id: 'tarot' },
  { label: 'Wyzwanie',  angle: 90,  color: '#EF4444', id: 'dreams' },
  { label: 'Wsparcie',  angle: 135, color: '#34D399', id: 'chinese_astrology' },
  { label: 'Analiza',   angle: 180, color: '#60A5FA', id: 'numerology' },
  { label: 'Intuicja',  angle: 225, color: '#FBBF24', id: 'mixed' },
  { label: 'Działanie', angle: 270, color: '#F97316', id: 'tarot' },
  { label: 'Harmonia',  angle: 315, color: '#818CF8', id: 'western_astrology' },
];

// ─── GUIDANCE COMPASS SVG WIDGET ─────────────────────────────────────────────
const GuidanceCompass = React.memo(({ selectedId, accent, isLight }: { selectedId: string | null; accent: string; isLight: boolean }) => {
  const rot    = useSharedValue(0);
  const tiltX  = useSharedValue(0);
  const tiltY  = useSharedValue(0);
  const glow   = useSharedValue(0.6);
  const pulse  = useSharedValue(1.0);

  useEffect(() => {
    rot.value   = withRepeat(withTiming(360, { duration: 30000, easing: Easing.linear }), -1, false);
    glow.value  = withRepeat(withSequence(withTiming(1.0, { duration: 2500 }), withTiming(0.4, { duration: 2500 })), -1, false);
    pulse.value = withRepeat(withSequence(withTiming(1.15, { duration: 1600 }), withTiming(0.9, { duration: 1600 })), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-25, Math.min(25, e.translationY * 0.16));
      tiltY.value = Math.max(-25, Math.min(25, e.translationX * 0.16));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }],
  }));
  const rotStyle   = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const glowStyle  = useAnimatedStyle(() => ({ opacity: glow.value }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const sz = 200; const cx = sz / 2; const OR = 78; const IR = 44; const LR = 86;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ width: sz, height: sz, alignSelf: 'center', marginVertical: 8 }, outerStyle]}>
        {/* Ambient glow */}
        <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
          <Svg width={sz} height={sz}>
            <Defs>
              <RadialGradient id="cglow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%"   stopColor={accent} stopOpacity="0.22" />
                <Stop offset="100%" stopColor={accent} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={cx} cy={cx} r={94} fill="url(#cglow)" />
          </Svg>
        </Animated.View>

        {/* Rotating outer decoration ring */}
        <Animated.View style={[StyleSheet.absoluteFill, rotStyle]}>
          <Svg width={sz} height={sz}>
            {/* Outer ring with tick marks */}
            <Circle cx={cx} cy={cx} r={OR + 8} fill="none" stroke={accent + '25'} strokeWidth={1} strokeDasharray="4 8" />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => {
              const rad = (a * Math.PI) / 180;
              return (
                <Line key={a}
                  x1={cx + (OR + 2)  * Math.cos(rad)} y1={cx + (OR + 2)  * Math.sin(rad)}
                  x2={cx + (OR + 14) * Math.cos(rad)} y2={cx + (OR + 14) * Math.sin(rad)}
                  stroke={accent + (a % 90 === 0 ? '60' : '28')} strokeWidth={a % 90 === 0 ? 1.5 : 0.7}
                />
              );
            })}
          </Svg>
        </Animated.View>

        {/* Static base */}
        <Svg width={sz} height={sz} style={StyleSheet.absoluteFill}>
          {/* Rings */}
          <Circle cx={cx} cy={cx} r={OR} fill="none" stroke={accent + '30'} strokeWidth={1} />
          <Circle cx={cx} cy={cx} r={IR} fill={isLight ? accent + '0C' : accent + '08'} stroke={accent + '40'} strokeWidth={1.2} />
          {/* Cross hairs */}
          <Line x1={cx - OR} y1={cx} x2={cx + OR} y2={cx} stroke={accent + '18'} strokeWidth={0.7} />
          <Line x1={cx} y1={cx - OR} x2={cx} y2={cx + OR} stroke={accent + '18'} strokeWidth={0.7} />
          {/* Diagonal cross */}
          {[45, 135].map(a => {
            const rad = (a * Math.PI) / 180;
            return <Line key={a} x1={cx - OR * Math.cos(rad)} y1={cx - OR * Math.sin(rad)} x2={cx + OR * Math.cos(rad)} y2={cx + OR * Math.sin(rad)} stroke={accent + '12'} strokeWidth={0.5} />;
          })}
          {/* Compass point dots */}
          {COMPASS_POINTS.map(pt => {
            const rad    = ((pt.angle - 90) * Math.PI) / 180;
            const px     = cx + LR * Math.cos(rad);
            const py     = cx + LR * Math.sin(rad);
            const active = selectedId && OPTIONS_IDS_MAP[pt.id] === selectedId;
            return (
              <G key={pt.angle}>
                <Circle cx={px} cy={py} r={active ? 7 : 4.5} fill={pt.color} opacity={active ? 1 : 0.45} />
                {active && <Circle cx={px} cy={py} r={11} fill="none" stroke={pt.color} strokeWidth={1.2} opacity={0.6} />}
              </G>
            );
          })}
        </Svg>

        {/* Pulsing center orb */}
        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, pulseStyle]}>
          <Svg width={28} height={28}>
            <Defs>
              <RadialGradient id="corb" cx="50%" cy="50%" r="50%">
                <Stop offset="0%"   stopColor="#fff"   stopOpacity="0.7" />
                <Stop offset="50%"  stopColor={accent} stopOpacity="1" />
                <Stop offset="100%" stopColor={accent} stopOpacity="0.5" />
              </RadialGradient>
            </Defs>
            <Circle cx={14} cy={14} r={12} fill="url(#corb)" />
            <Circle cx={14} cy={14} r={5}  fill="#fff" opacity={0.5} />
          </Svg>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});

// Map option IDs for active compass point detection
const OPTIONS_IDS_MAP: Record<string, string> = {
  western_astrology: 'western_astrology',
  chinese_astrology: 'chinese_astrology',
  tarot: 'tarot',
  mixed: 'mixed',
  numerology: 'numerology',
  dreams: 'dreams',
};

const OPTIONS = [
  {
    id: 'western_astrology',
    title: 'Astrologia zachodnia',
    description: 'Jeśli chcesz, by znak, rytm dnia i astrologiczne interpretacje były Twoim głównym wejściem.',
    richDescription: 'Astrologia zachodnia to jeden z najstarszych systemów rozumienia duszy przez pryzmat nieba. Twój znak Słońca, ascendent, Księżyc i planety tworzą unikalny wzorzec energetyczny — mapę Twojego życia. Codzienne przewodnictwo będzie oparte na aktualnych tranzytach, fazach Księżyca i horoskopalnych rytmach.',
    experience: [
      'Poranny horoscope dostosowany do Twojego znaku',
      'Lunarne fazy jako wskazówki dla rytuałów',
      'Astrologiczne tło dla tarotowych odczytów',
      'Kompatybilność oparta na kartach urodzenia',
    ],
    icon: Stars,
    intention: 'Rozwój',
    gradientColors: ['#1A0A3D', '#2D1B69'],
    accentColor: '#A78BFA',
    homePreview: 'Dzisiejszy tranzyt · Faza Księżyca · Horoskop dnia',
    oraclePreviews: [
      'Merkury tranzytuje przez Twój ascendent tej nocy — pojawią się nowe słowa dla starych uczuć. Napisz to, o czym bałeś/aś się mówić.',
      'Księżyc w Wodniku aktywuje Twoją sferę relacji. Nie szukaj kompromisu — szukaj prawdziwego dialogu.',
      'Mars wchodzi w trygon z Twoim Słońcem. Ten tydzień nie jest dla cierpliwości — jest dla działania z precyzją.',
    ],
    pairsWith: ['tarot', 'mixed'],
    pairNote: 'Doskonale łączy się z Tarotem (symboliczne pogłębienie tranzytów) i Mieszanym prowadzeniem (pełna elastyczność).',
  },
  {
    id: 'chinese_astrology',
    title: 'Astrologia chińska',
    description: 'Jeśli bardziej przemawia do Ciebie żywioł, cykl i spokojniejsza warstwa energetyczna.',
    richDescription: 'Chińska astrologia opiera się na 12-letnim cyklu zwierząt i pięciu żywiołach — Drewnie, Ogniu, Ziemi, Metalu i Wodzie. To system głęboko zakorzeniony w harmonii z naturą i kosmicznym przepływem chi. Twój znak zwierzęcy i żywioł roku urodzenia tworzą unikalny profil energetyczny, który Aethera będzie interpretować każdego dnia.',
    experience: [
      'Dzienny odczyt na podstawie Twojego znaku zwierzęcego',
      'Pięć żywiołów jako filtr dla praktyk energetycznych',
      'Cykliczne przepowiednie i okna korzystnych działań',
      'Harmonijne dopasowanie aktywności do żywiołu dnia',
    ],
    icon: MoonStar,
    intention: 'Spokój',
    gradientColors: ['#0A2A1A', '#0D3D2A'],
    accentColor: '#34D399',
    homePreview: 'Twój żywioł · Energia dnia · Cykl zwierzęcy',
    oraclePreviews: [
      'Żywioł Drewna tego dnia prosi o ekspansję z korzeniami — rośnij w górę, ale pamiętaj, skąd wyrosłeś/aś.',
      'Yin Metal dominuje energię tygodnia. Czas na precyzję, selekcję i trzymanie granic bez tłumaczenia się.',
      'Twój znak Smoka wchodzi w rezonans z rokiem Węża. Mądrość i cierpliwość to Twoje największe narzędzia tego sezonu.',
    ],
    pairsWith: ['numerology', 'mixed'],
    pairNote: 'Najlepiej rezonuje z Numerologią (cykle i liczby uzupełniają żywioły) i Mieszanym prowadzeniem.',
  },
  {
    id: 'tarot',
    title: 'Tarot',
    description: 'Jeśli chcesz zaczynać od symboli, pytań i bardziej ceremonialnych odczytów.',
    richDescription: 'Tarot to język symboli i archetypalnych wzorców. Każda karta jest lustrem, w którym dusza rozpoznaje swoje własne pytania i odpowiedzi. Prowadzenie przez Tarot oznacza, że Aethera będzie zaczynać Twój dzień od karty — jej znaczenia, pytania i propozycji ceremonialnego wejścia w dzień. Archetyp Szarlatana towarzyszy nowym początkom, Świat — dopełnieniu.',
    experience: [
      'Karta dnia jako centralny punkt porannego rytuału',
      'Rozbudowane odczyty dla ważnych momentów',
      'Ceremonialne wskazówki pracy z kartą',
      'Symboliczne powiązania z innymi modułami Aethery',
    ],
    icon: Sparkles,
    intention: 'Miłość',
    gradientColors: ['#2A0A1A', '#4D1535'],
    accentColor: '#F472B6',
    homePreview: 'Karta dnia · Archetyp · Ceremonia poranna',
    oraclePreviews: [
      'Dziś wylosowałeś/aś Kapłankę. Ona nie odpowiada — ona pyta. Jakie pytanie boisz się zadać samemu sobie?',
      'Wieża się pojawia. Nie jako katastrofa — jako konieczność. Co w Twoim życiu wymaga rozebrania, by nowe mogło wstać?',
      'Gwiazda mówi: ufaj. Nie innym — ufaj kierunkowi, który czujesz cicho, zanim głowa zacznie argumentować.',
    ],
    pairsWith: ['western_astrology', 'dreams'],
    pairNote: 'Najgłębiej rezonuje z Astrologią zachodnią (karty i tranzyt) oraz Snami i podświadomością (archetypy Jungowskie).',
  },
  {
    id: 'mixed',
    title: 'Mieszane prowadzenie',
    description: 'Jeśli chcesz, by Aethera łączyła astrologię, tarot, afirmacje i Oracle bez jednego dominującego filtru.',
    richDescription: 'Mieszane prowadzenie to podejście synkretyczne — Aethera integruje astrologię zachodnią, wschodnią, tarot, numerologię i czyszczenie energetyczne w jeden spójny, płynny rytm. Żaden system nie dominuje — to Ty jesteś filtrem. Oracle i AI rozpoznają Twój nastrój, fazę życia i potrzebę, dobierając właściwe narzędzie w danym momencie.',
    experience: [
      'Zróżnicowane wejścia — każdy dzień inaczej',
      'Oracle jako centralny przewodnik',
      'Pełna elastyczność eksploracji',
      'Afirmacje, tarot i astrologia przeplatają się naturalnie',
    ],
    icon: Compass,
    intention: 'Rozwój',
    gradientColors: ['#1A1A0A', '#2D2D1B'],
    accentColor: '#FBBF24',
    homePreview: 'Oracle dnia · Karta · Afirmacja · Horoskop',
    oraclePreviews: [
      'Dziś Merkury tranzytuje, a Księżyc jest w pełni — to nie przypadek, że czujesz więcej niż zwykle. Pozwól sobie czuć.',
      'Karta Siły z Venusem w trygonie — moc nie krzyczy. Twoja siła jest dziś w spokojnej konsekwencji.',
      'Wibracja 8 i Wieża razem mówią: czas na decyzję, której unikałeś/aś. Energia jest po Twojej stronie.',
    ],
    pairsWith: ['western_astrology', 'tarot', 'numerology'],
    pairNote: 'Kompatybilne z każdym trybem Oracle — szczególnie dobrze sprawuje się z Mędrzec i Wizjoner trybami.',
  },
  {
    id: 'numerology',
    title: 'Numerologia',
    description: 'Jeśli chcesz odkrywać siebie przez liczby, wibracje i matrycę przeznaczenia.',
    richDescription: 'Numerologia to starożytna nauka o liczbach jako języku duszy. Twoja data urodzenia zawiera zakodowaną ścieżkę życiową, wyzwania i dary. Liczba ścieżki życia, liczba duszy i liczba osobowości tworzą unikalną matrycę. Aethera będzie codziennie obliczać wibrację dnia i łączyć ją z Twoim osobistym profilem numerologicznym.',
    experience: [
      'Wibracja dnia obliczona z daty i Twojej liczby ścieżki',
      'Matryca przeznaczenia jako mapa głębokiej pracy',
      'Numerologiczne okna dla ważnych decyzji',
      'Cykle osobiste — rok, miesiąc, dzień — interpretowane na bieżąco',
    ],
    icon: Layers,
    intention: 'Mądrość',
    gradientColors: ['#0A1A2A', '#1B2D4D'],
    accentColor: '#60A5FA',
    homePreview: 'Wibracja dnia · Matryca · Cykl osobisty',
    oraclePreviews: [
      'Dziś wibracja 7 — liczba wglądu i ciszy. Odpowiedź, której szukasz, nie jest w internecie. Jest w spokoju.',
      'Twoja liczba ścieżki 3 wchodzi w rezonans z rokiem 5. Ekspresja spotyka zmianę. Co masz do powiedzenia światu?',
      'Cykl miesięczny kończy się dla Ciebie za 4 dni. Nie zaczynaj nowych projektów — domknij stare z gracją.',
    ],
    pairsWith: ['chinese_astrology', 'tarot'],
    pairNote: 'Perfekcyjnie uzupełnia Astrologię chińską (cykle żywiołów i liczb) oraz Tarot (numerologia kart Tarota).',
  },
  {
    id: 'dreams',
    title: 'Sny i podświadomość',
    description: 'Jeśli chcesz eksplorować sny, archetypy i nieświadome wzorce jako główne źródło mądrości.',
    richDescription: 'Sny są królewską drogą do podświadomości — tak mówił Jung. Praca ze snami to jedna z najpotężniejszych praktyk duchowych, umożliwiająca dialog z głębszymi warstwami jaźni. Aethera będzie towarzyszyć Ci wieczorem i rankiem — ułatwiając zapis snów, ich interpretację przez pryzmat archetypów, symboli i emocji.',
    experience: [
      'Wieczorny rytuał przed snem — intencja + oddech',
      'Ranny zapis i interpretacja snów przez Oracle',
      'Symbolarium — słownik archetypowych obrazów',
      'Praca z cieniem i podświadomymi wzorcami',
    ],
    icon: Moon,
    intention: 'Intuicja',
    gradientColors: ['#0A0A2A', '#1B1B4D'],
    accentColor: '#818CF8',
    homePreview: 'Sen nocy · Symbol · Archetyp · Cień',
    oraclePreviews: [
      'Woda w snach zawsze mówi o emocjach. Czy ta woda była spokojna czy wzburzona? Co chcesz powiedzieć sobie o tym, co czujesz?',
      'Pościg we śnie — klasyczny cień. Czego unikasz w codziennym życiu, co wraca w nocy pod inną twarzą?',
      'Dom we śnie to Twoja psyche. Które pokoje były zamknięte? Co leżało za tamtymi drzwiami?',
    ],
    pairsWith: ['tarot', 'western_astrology'],
    pairNote: 'Tworzy wyjątkową parę z Tarotem (archetypy) i Astrologią zachodnią (Księżyc jako symbol snów).',
  },
];

// Oracle mode compatibility matrix
const ORACLE_MODE_PAIRS: Record<string, string[]> = {
  western_astrology: ['Wróżka', 'Mędrzec', 'Wizjoner'],
  chinese_astrology: ['Mędrzec', 'Nauczyciel'],
  tarot: ['Wróżka', 'Psycholog', 'Wizjoner'],
  mixed: ['Mędrzec', 'Wizjoner', 'Psycholog', 'Wróżka'],
  numerology: ['Mędrzec', 'Nauczyciel', 'Wróżka'],
  dreams: ['Psycholog', 'Wizjoner', 'Nauczyciel'],
};

// Spiritual signature calculation from birthdate
function calcSpiritualSignature(birthDate: string): { primary: string; secondary: string; reasoning: string } | null {
  if (!birthDate) return null;
  try {
    const d = new Date(birthDate);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    let lifePathRaw = day + month + year;
    while (lifePathRaw > 9) { lifePathRaw = String(lifePathRaw).split('').reduce((s, c) => s + Number(c), 0); }
    const dayMod = day % 6;
    const styles = OPTIONS.map(o => o.id);
    const primaryIndex = lifePathRaw % styles.length;
    const secondaryIndex = (primaryIndex + dayMod + 1) % styles.length;
    const primary = OPTIONS[primaryIndex];
    const secondary = OPTIONS[secondaryIndex];
    const reasonings: Record<string, string> = {
      '1': 'Ścieżka Jedynki wskazuje na natywnego lidera, który najlepiej uczy się przez bezpośrednie doświadczenie symboliczne.',
      '2': 'Ścieżka Dwójki sugeruje głęboką wrażliwość i intuicję — systemy, które mówią językiem odczuć, rezonują najsilniej.',
      '3': 'Ścieżka Trójki to dusze ekspresji — narracja, symbol i opowieść są naturalnym językiem prowadzenia.',
      '4': 'Ścieżka Czwórki wskazuje na budowlańca — struktury, cykle i systemy z jasną logiką są najlepszym wejściem.',
      '5': 'Ścieżka Piątki to dusze zmiany — wielokanałowe, synkretyczne podejście rezonuje z tą energią.',
      '6': 'Ścieżka Szóstki kieruje ku harmonii i relacjom — systemy kosmiczne, które mówią o połączeniu, działają najsilniej.',
      '7': 'Ścieżka Siódemki to mistyk — głębia, tajemnica i introspekcja są naturalnym środowiskiem tych dusz.',
      '8': 'Ścieżka Ósemki wskazuje na manifestatora — systemy z wyraźnym przełożeniem na realne działanie.',
      '9': 'Ścieżka Dziewiątki to humanista — wielkie narracje i archetypy o przemijaniu i przebudzeniu.',
    };
    return {
      primary: primary.id,
      secondary: secondary.id,
      reasoning: reasonings[String(lifePathRaw)] || 'Twój unikalny wzorzec wskazuje na naturalne połączenie z tym systemem.',
    };
  } catch { return null; }
}

export const GuidancePreferenceScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const setUserData = useAppStore(s => s.setUserData);
  const setOnboarded = useAppStore(s => s.setOnboarded);
  const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor  = isLight ? '#6A5A48' : '#9A8E80';
  const cardBg    = isLight ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.03)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.08)';
  const inputBg   = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [compatOpen, setCompatOpen] = useState(false);
  const [sigOpen, setSigOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [impactOpen, setImpactOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Style history (simulated — in production these would come from store)
  const [styleHistory] = useState<string[]>(['tarot', 'western_astrology', 'mixed'].slice(0, 3));

  // Advanced customization sliders
  const [depthVal, setDepthVal] = useState(0.5);
  const [directnessVal, setDirectnessVal] = useState(0.5);
  const [focusVal, setFocusVal] = useState(0.5);

  const scrollRef = useRef<ScrollView>(null);

  const spiritualSig = useMemo(() => calcSpiritualSignature(userData.birthDate || ''), [userData.birthDate]);

  const handleSelect = (option: typeof OPTIONS[number]) => {
    HapticsService.impact('light');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (selectedId === option.id) {
      setExpandedId(expandedId === option.id ? null : option.id);
    } else {
      setSelectedId(option.id);
      setExpandedId(option.id);
    }
  };

  const handleContinue = () => {
    if (!selectedId) return;
    const option = OPTIONS.find(o => o.id === selectedId);
    if (!option) return;
    HapticsService.impact('light');
    setUserData({
      currentFocus: option.title,
      primaryIntention: option.intention,
      primaryGuidanceMode: option.id as any,
      preferredRitualCategory: option.id === 'tarot' ? 'Cleansing' : option.id === 'western_astrology' ? 'Manifestation' : 'Love',
    });
    setOnboarded(true);
  };

  const selectedOption = OPTIONS.find(o => o.id === selectedId);
  const oracleModes = selectedId ? (ORACLE_MODE_PAIRS[selectedId] || []) : [];

  // Impact comparison question
  const IMPACT_QUESTION = 'Czuję się zagubiony/a i nie wiem, w którą stronę iść.';
  const IMPACT_ANSWERS: Record<string, string> = {
    western_astrology: 'Mars jest retrograde w Twoim 12. domu, co zaciemnia kierunek działania. Merkury wychodzi z cienia 8 dnia — poczekaj na ten moment i nie podejmuj wielkich decyzji przed nim.',
    chinese_astrology: 'Żywioł Wody dominuje tę porę roku — zgubienie jest naturalnym stanem przed nowym nurtem. Daj sobie przestrzeń jak rzeka, która szuka nowego koryta.',
    tarot: 'Hermit na dziś. Nie szukasz drogi na zewnątrz — szukasz latarni, którą sam/a nosisz. Wróć do jednej wartości, która jest pewna, i zacznij stamtąd.',
    mixed: 'Wibracja 7, Hermit i Księżyc w Rybach składają się dziś w jedno: czas wewnętrzny, nie działania. Usiądź z tym zagubieniem — ono jest informacją.',
    numerology: 'Jesteś w dniu wibracji 7 w miesiącu 4. To głęboka introspekcja wewnątrz struktury. Odpowiedź na pytanie "gdzie iść" przyjdzie przez "kim jestem" — nie przez plany.',
    dreams: 'Zagubienie często pojawia się, gdy ignorujemy sygnały z podświadomości. Jakie sny miałeś/aś ostatnio? Tam może być mapa, której szukasz.',
  };

  const sliderLabelStyle = { fontSize: 11, color: subColor, fontWeight: '600' as const };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <CelestialBackdrop intensity="medium" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: screenContracts.bottomInset(insets.bottom, 'airy') + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HEADER ── */}
          <Animated.View entering={FadeInDown.duration(600)}>
            <SectionHeading
              eyebrow="Główny sposób prowadzenia"
              title={t('guidancePref.od_czego_aethera_ma_zaczynac', 'Od czego Aethera ma zaczynać Twoje codzienne guidance?')}
              subtitle={t('guidancePref.to_nie_zamyka_cie_na', 'To nie zamyka Cię na inne moduły. Ustawia tylko główny filtr, przez który aplikacja będzie proponować pierwszy krok dnia.')}
            />
          </Animated.View>

          {/* ── GUIDANCE COMPASS WIDGET ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={{ alignItems: 'center', marginBottom: 8 }}>
            <GuidanceCompass selectedId={selectedId} accent={currentTheme.primary} isLight={isLight} />
            {/* Compass point labels */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 4 }}>
              {COMPASS_POINTS.slice(0, 4).map(pt => {
                const active = selectedId === pt.id;
                return (
                  <View key={pt.angle} style={{
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    backgroundColor: active ? pt.color + '22' : isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: active ? pt.color + '55' : isLight ? 'rgba(122,95,54,0.14)' : 'rgba(255,255,255,0.08)',
                  }}>
                    <Typography variant="microLabel" style={{ color: active ? pt.color : isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.45)', fontSize: 10 }}>
                      {pt.label}
                    </Typography>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          {/* ── PROGRESS INDICATOR ── */}
          <Animated.View entering={FadeInDown.delay(140).duration(500)} style={{
            marginBottom: 16,
            backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)',
            borderRadius: 14,
            padding: 14,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: isLight ? 'rgba(139,100,42,0.32)' : 'rgba(255,255,255,0.07)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Typography variant="microLabel" style={{ color: isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.50)', letterSpacing: 1.2 }}>
                {t('guidancePref.konfigurac', 'KONFIGURACJA')}
              </Typography>
              <Typography variant="microLabel" style={{ color: selectedId ? currentTheme.primary : isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.35)', letterSpacing: 0.8 }}>
                {selectedId ? '1/1 ustawione' : '0/1 ustawione'}
              </Typography>
            </View>
            <View style={{ height: 4, backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <View style={{ height: 4, width: selectedId ? '100%' : '0%', backgroundColor: currentTheme.primary, borderRadius: 2 }} />
            </View>
            {!!selectedId && (
              <Typography variant="microLabel" style={{ color: currentTheme.primary, marginTop: 6, fontSize: 11 }}>
                ✓ Wybrany styl: {OPTIONS.find(o => o.id === selectedId)?.title ?? selectedId}
              </Typography>
            )}
          </Animated.View>

          {/* ── OPTIONS ── */}
          {OPTIONS.map((option, index) => {
            const Icon = option.icon;
            const isSelected = selectedId === option.id;
            const isExpanded = expandedId === option.id;

            return (
              <Animated.View
                key={option.id}
                entering={FadeInDown.delay(index * 80).duration(500)}
                style={[
                  styles.cardWrapper,
                  isSelected && {
                    shadowColor: option.accentColor,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.35,
                    shadowRadius: 20,
                    elevation: 12,
                  },
                ]}
              >
                <Pressable
                  onPress={() => handleSelect(option)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
                >
                  <View
                    style={[
                      styles.optionCard,
                      {
                        borderColor: isSelected
                          ? option.accentColor + '80'
                          : isLight ? 'rgba(122,95,54,0.14)' : 'rgba(255,255,255,0.07)',
                        borderWidth: isSelected ? 1.5 : StyleSheet.hairlineWidth,
                        backgroundColor: isLight ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.03)',
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={isSelected
                        ? [option.accentColor + '18', option.accentColor + '06', 'transparent']
                        : ['transparent', 'transparent']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />

                    <View style={styles.cardMainRow}>
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor: isSelected
                              ? option.accentColor + '22'
                              : isLight ? 'rgba(255,248,234,0.92)' : 'rgba(255,255,255,0.06)',
                            borderColor: isSelected ? option.accentColor + '50' : 'transparent',
                            borderWidth: isSelected ? 1 : 0,
                          },
                        ]}
                      >
                        <LinearGradient
                          colors={isSelected
                            ? [option.gradientColors[0], option.gradientColors[1]]
                            : ['transparent', 'transparent']}
                          style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                        />
                        <Icon
                          color={isSelected ? option.accentColor : currentTheme.primary}
                          size={24}
                          strokeWidth={1.4}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.titleRow}>
                          <Typography
                            variant="cardTitle"
                            style={{ color: isSelected ? option.accentColor : undefined }}
                          >
                            {option.title}
                          </Typography>
                          {isSelected && (
                            <View style={[styles.checkBadge, { backgroundColor: option.accentColor }]}>
                              <Check color="#000" size={10} strokeWidth={2.5} />
                            </View>
                          )}
                        </View>
                        <Typography
                          variant="bodySmall"
                          style={{ marginTop: 5, lineHeight: 19, opacity: 0.72 }}
                        >
                          {option.description}
                        </Typography>
                      </View>

                      <View style={styles.chevronBox}>
                        {isExpanded
                          ? <ChevronUp color={isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.35)'} size={16} />
                          : <ChevronDown color={isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.25)'} size={16} />}
                      </View>
                    </View>

                    {isExpanded && (
                      <View style={styles.expandedSection}>
                        <View style={[styles.expandDivider, { backgroundColor: option.accentColor + '30' }]} />

                        <Typography
                          variant="bodySmall"
                          style={{ lineHeight: 22, opacity: 0.80, marginBottom: 16, color: textColor }}
                        >
                          {option.richDescription}
                        </Typography>

                        <View style={[styles.experienceBlock, { backgroundColor: option.accentColor + '0C', borderColor: option.accentColor + '25', borderWidth: 1, borderRadius: 14 }]}>
                          <Typography
                            variant="microLabel"
                            style={{ color: option.accentColor, marginBottom: 10, letterSpacing: 1.2 }}
                          >
                            {t('guidancePref.co_poczujesz', 'CO POCZUJESZ')}
                          </Typography>
                          {option.experience.map((item, i) => (
                            <View key={i} style={styles.experienceRow}>
                              <View style={[styles.experienceDot, { backgroundColor: option.accentColor }]} />
                              <Typography variant="bodySmall" style={{ flex: 1, lineHeight: 20, opacity: 0.82, color: textColor }}>
                                {item}
                              </Typography>
                            </View>
                          ))}
                        </View>

                        <View style={[styles.previewBlock, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.08)' }]}>
                          <Typography
                            variant="microLabel"
                            style={{ color: isLight ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.45)', marginBottom: 6, letterSpacing: 1.0 }}
                          >
                            {t('guidancePref.widok_glowny', 'WIDOK GŁÓWNY')}
                          </Typography>
                          <Typography
                            variant="bodySmall"
                            style={{ color: option.accentColor, opacity: 0.88, letterSpacing: 0.3 }}
                          >
                            {option.homePreview}
                          </Typography>
                        </View>
                      </View>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}

          {/* ── PREVIEW SECTION ── */}
          {selectedOption && (
            <Animated.View entering={FadeInDown.delay(80).duration(500)} style={{ marginTop: 8 }}>
              <Pressable
                onPress={() => { HapticsService.impact('light'); LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setPreviewOpen(v => !v); }}
                style={[styles.sectionToggle, {
                  backgroundColor: isLight ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.04)',
                  borderColor: selectedOption.accentColor + '40',
                }]}
              >
                <View style={styles.sectionToggleRow}>
                  <View style={[styles.sectionToggleIcon, { backgroundColor: selectedOption.accentColor + '18' }]}>
                    <Sparkles color={selectedOption.accentColor} size={16} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="microLabel" style={{ color: selectedOption.accentColor, letterSpacing: 1.2 }}>{t('guidancePref.przyklady_oracle', 'PRZYKŁADY ORACLE')}</Typography>
                    <Typography variant="bodySmall" style={{ opacity: 0.65, marginTop: 2, color: textColor }}>Jak brzmi {selectedOption.title} w praktyce</Typography>
                  </View>
                  {previewOpen ? <ChevronUp color={subColor} size={16} /> : <ChevronDown color={subColor} size={16} />}
                </View>

                {previewOpen && (
                  <View style={styles.previewContent}>
                    <View style={[styles.previewDivider, { backgroundColor: selectedOption.accentColor + '30' }]} />
                    <Typography variant="bodySmall" style={{ opacity: 0.65, marginBottom: 14, lineHeight: 20, color: textColor }}>
                      Tak Oracle mówi, gdy prowadzenie jest ustawione na {selectedOption.title}. Każda odpowiedź nosi inny ton i perspektywę.
                    </Typography>
                    {selectedOption.oraclePreviews.map((preview, i) => (
                      <Animated.View key={i} entering={FadeInDown.delay(i * 80).duration(400)}>
                        <View style={[styles.oraclePreviewCard, {
                          backgroundColor: isLight ? 'rgba(255,255,255,0.55)' : selectedOption.accentColor + '08',
                          borderColor: i === 0 ? selectedOption.accentColor + '50' : selectedOption.accentColor + '22',
                          borderLeftWidth: i === 0 ? 3 : 1,
                        }]}>
                          <View style={styles.oraclePreviewTop}>
                            <View style={[styles.oracleNumBadge, { backgroundColor: selectedOption.accentColor + '20', borderColor: selectedOption.accentColor + '44' }]}>
                              <Typography variant="microLabel" style={{ color: selectedOption.accentColor }}>{i + 1}</Typography>
                            </View>
                            <Typography variant="microLabel" style={{ color: selectedOption.accentColor, letterSpacing: 0.8 }}>
                              {i === 0 ? 'PRZYKŁAD PORANNY' : i === 1 ? 'PRZYKŁAD TYGODNIOWY' : 'PRZYKŁAD SEZONOWY'}
                            </Typography>
                          </View>
                          <Typography variant="bodySmall" style={{ lineHeight: 22, opacity: i === 0 ? 0.90 : 0.75, fontStyle: 'italic', color: textColor }}>
                            "{preview}"
                          </Typography>
                        </View>
                      </Animated.View>
                    ))}
                  </View>
                )}
              </Pressable>
            </Animated.View>
          )}

          {/* ── COMPATIBILITY HINTS ── */}
          {selectedOption && (
            <Animated.View entering={FadeInDown.delay(120).duration(500)} style={{ marginTop: 8 }}>
              <Pressable
                onPress={() => { HapticsService.impact('light'); LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setCompatOpen(v => !v); }}
                style={[styles.sectionToggle, {
                  backgroundColor: isLight ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.04)',
                  borderColor: '#34D39940',
                }]}
              >
                <View style={styles.sectionToggleRow}>
                  <View style={[styles.sectionToggleIcon, { backgroundColor: '#34D39918' }]}>
                    <Zap color="#34D399" size={16} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="microLabel" style={{ color: '#34D399', letterSpacing: 1.2 }}>{t('guidancePref.kompatybil', 'KOMPATYBILNOŚĆ')}</Typography>
                    <Typography variant="bodySmall" style={{ opacity: 0.65, marginTop: 2, color: textColor }}>{t('guidancePref.pary_stylow_i_tryby_oracle', 'Pary stylów i tryby Oracle')}</Typography>
                  </View>
                  {compatOpen ? <ChevronUp color={subColor} size={16} /> : <ChevronDown color={subColor} size={16} />}
                </View>

                {compatOpen && (
                  <View style={styles.previewContent}>
                    <View style={[styles.previewDivider, { backgroundColor: '#34D39930' }]} />
                    <Typography variant="bodySmall" style={{ opacity: 0.72, marginBottom: 14, lineHeight: 22, color: textColor }}>
                      {selectedOption.pairNote}
                    </Typography>

                    <Typography variant="microLabel" style={{ color: '#34D399', letterSpacing: 1.2, marginBottom: 10 }}>
                      {t('guidancePref.kompatybil_tryby_oracle', 'KOMPATYBILNE TRYBY ORACLE')}
                    </Typography>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                      {oracleModes.map(mode => (
                        <View key={mode} style={[styles.modeChip, { backgroundColor: '#34D39914', borderColor: '#34D39940' }]}>
                          <Typography variant="microLabel" style={{ color: '#34D399' }}>{mode}</Typography>
                        </View>
                      ))}
                    </View>

                    <Typography variant="microLabel" style={{ color: subColor, letterSpacing: 1.0, marginBottom: 10 }}>
                      {t('guidancePref.dobrze_laczy_sie_z', 'DOBRZE ŁĄCZY SIĘ Z')}
                    </Typography>
                    <View style={{ gap: 8 }}>
                      {selectedOption.pairsWith.map(pairedId => {
                        const paired = OPTIONS.find(o => o.id === pairedId);
                        if (!paired) return null;
                        const PairIcon = paired.icon;
                        return (
                          <View key={pairedId} style={[styles.pairRow, { borderColor: paired.accentColor + '30', backgroundColor: paired.accentColor + '08' }]}>
                            <View style={[styles.pairIconWrap, { backgroundColor: paired.accentColor + '18' }]}>
                              <PairIcon color={paired.accentColor} size={14} strokeWidth={1.5} />
                            </View>
                            <Typography variant="bodySmall" style={{ color: textColor, opacity: 0.82, flex: 1 }}>
                              {paired.title}
                            </Typography>
                            <View style={[styles.pairAccentDot, { backgroundColor: paired.accentColor }]} />
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          )}

          {/* ── SPIRITUAL SIGNATURE ── */}
          <Animated.View entering={FadeInDown.delay(160).duration(500)} style={{ marginTop: 8 }}>
            <Pressable
              onPress={() => { HapticsService.impact('light'); LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setSigOpen(v => !v); }}
              style={[styles.sectionToggle, {
                backgroundColor: isLight ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.04)',
                borderColor: '#F472B640',
              }]}
            >
              <View style={styles.sectionToggleRow}>
                <View style={[styles.sectionToggleIcon, { backgroundColor: '#F472B618' }]}>
                  <User color="#F472B6" size={16} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="microLabel" style={{ color: '#F472B6', letterSpacing: 1.2 }}>{t('guidancePref.twoja_duchowa_sygnatura', 'TWOJA DUCHOWA SYGNATURA')}</Typography>
                  <Typography variant="bodySmall" style={{ opacity: 0.65, marginTop: 2, color: textColor }}>{t('guidancePref.rekomendac_obliczona_z_daty_urodzen', 'Rekomendacja obliczona z daty urodzenia')}</Typography>
                </View>
                {sigOpen ? <ChevronUp color={subColor} size={16} /> : <ChevronDown color={subColor} size={16} />}
              </View>

              {sigOpen && (
                <View style={styles.previewContent}>
                  <View style={[styles.previewDivider, { backgroundColor: '#F472B630' }]} />
                  {spiritualSig ? (
                    <>
                      <Typography variant="bodySmall" style={{ lineHeight: 22, opacity: 0.75, marginBottom: 16, color: textColor }}>
                        {spiritualSig.reasoning}
                      </Typography>

                      {[
                        { label: 'STYL PODSTAWOWY', id: spiritualSig.primary, badge: '★' },
                        { label: 'STYL UZUPEŁNIAJĄCY', id: spiritualSig.secondary, badge: '◎' },
                      ].map(({ label, id, badge }) => {
                        const opt = OPTIONS.find(o => o.id === id);
                        if (!opt) return null;
                        const SigIcon = opt.icon;
                        return (
                          <View key={id} style={[styles.sigCard, { backgroundColor: opt.accentColor + '10', borderColor: opt.accentColor + '40' }]}>
                            <LinearGradient colors={[opt.accentColor + '14', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                            <View style={styles.sigCardTop}>
                              <Typography variant="microLabel" style={{ color: opt.accentColor, letterSpacing: 1.2 }}>{label}</Typography>
                              <Text style={[styles.sigBadge, { color: opt.accentColor }]}>{badge}</Text>
                            </View>
                            <View style={styles.sigCardRow}>
                              <View style={[styles.sigIconWrap, { backgroundColor: opt.accentColor + '20' }]}>
                                <SigIcon color={opt.accentColor} size={20} strokeWidth={1.4} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Typography variant="cardTitle" style={{ color: opt.accentColor }}>{opt.title}</Typography>
                                <Typography variant="bodySmall" style={{ opacity: 0.70, marginTop: 4, lineHeight: 19, color: textColor }}>{opt.description}</Typography>
                              </View>
                            </View>
                            <Pressable
                              onPress={() => { HapticsService.impact('light'); setSelectedId(id); setExpandedId(id); }}
                              style={[styles.sigApplyBtn, { borderColor: opt.accentColor + '44', backgroundColor: opt.accentColor + '14' }]}
                            >
                              <Typography variant="microLabel" style={{ color: opt.accentColor, letterSpacing: 1 }}>{t('guidancePref.zastosuj_ten_styl', 'ZASTOSUJ TEN STYL')}</Typography>
                              <ArrowRight color={opt.accentColor} size={12} strokeWidth={2} />
                            </Pressable>
                          </View>
                        );
                      })}
                    </>
                  ) : (
                    <View style={[styles.sigNoData, { backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)', borderColor: '#F472B622' }]}>
                      <Typography variant="bodySmall" style={{ opacity: 0.65, textAlign: 'center', lineHeight: 22, color: textColor }}>
                        {t('guidancePref.uzupelnij_date_urodzenia_w_profilu', 'Uzupełnij datę urodzenia w profilu, by obliczyć Twoją duchową sygnaturę i zobaczyć rekomendowany styl prowadzenia.')}
                      </Typography>
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          </Animated.View>

          {/* ── STYLE HISTORY ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ marginTop: 8 }}>
            <Pressable
              onPress={() => { HapticsService.impact('light'); LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setHistoryOpen(v => !v); }}
              style={[styles.sectionToggle, {
                backgroundColor: isLight ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.04)',
                borderColor: '#FBBF2440',
              }]}
            >
              <View style={styles.sectionToggleRow}>
                <View style={[styles.sectionToggleIcon, { backgroundColor: '#FBBF2418' }]}>
                  <RefreshCw color="#FBBF24" size={16} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="microLabel" style={{ color: '#FBBF24', letterSpacing: 1.2 }}>{t('guidancePref.historia_stylow', 'HISTORIA STYLÓW')}</Typography>
                  <Typography variant="bodySmall" style={{ opacity: 0.65, marginTop: 2, color: textColor }}>{t('guidancePref.ostatnio_wyprobowan_style_prowadzen', 'Ostatnio wypróbowane style prowadzenia')}</Typography>
                </View>
                {historyOpen ? <ChevronUp color={subColor} size={16} /> : <ChevronDown color={subColor} size={16} />}
              </View>

              {historyOpen && (
                <View style={styles.previewContent}>
                  <View style={[styles.previewDivider, { backgroundColor: '#FBBF2430' }]} />
                  {styleHistory.length === 0 ? (
                    <Typography variant="bodySmall" style={{ opacity: 0.60, textAlign: 'center', color: textColor }}>
                      {t('guidancePref.nie_masz_jeszcze_historii_stylow', 'Nie masz jeszcze historii stylów. Wybierz swój pierwszy styl poniżej.')}
                    </Typography>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {styleHistory.map((histId, i) => {
                        const histOpt = OPTIONS.find(o => o.id === histId);
                        if (!histOpt) return null;
                        const HIcon = histOpt.icon;
                        const isActive = selectedId === histId;
                        return (
                          <Animated.View key={histId} entering={FadeInDown.delay(i * 60).duration(400)}>
                            <View style={[styles.historyRow, {
                              backgroundColor: isActive ? histOpt.accentColor + '10' : isLight ? 'rgba(240,228,210,0.90)' : 'rgba(255,255,255,0.04)',
                              borderColor: isActive ? histOpt.accentColor + '50' : isLight ? 'rgba(122,95,54,0.14)' : 'rgba(255,255,255,0.07)',
                            }]}>
                              <View style={[styles.historyNumBadge, { backgroundColor: '#FBBF2418', borderColor: '#FBBF2440' }]}>
                                <Typography variant="microLabel" style={{ color: '#FBBF24' }}>{i + 1}</Typography>
                              </View>
                              <View style={[styles.historyIconWrap, { backgroundColor: histOpt.accentColor + '18' }]}>
                                <HIcon color={histOpt.accentColor} size={16} strokeWidth={1.5} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Typography variant="bodySmall" style={{ color: textColor, fontWeight: '600' }}>{histOpt.title}</Typography>
                                <Typography variant="caption" style={{ color: subColor, marginTop: 2 }}>
                                  {i === 0 ? 'Ostatnio używany' : i === 1 ? 'Poprzedni styl' : 'Wcześniejszy styl'}
                                </Typography>
                              </View>
                              <Pressable
                                onPress={() => { HapticsService.impact('light'); setSelectedId(histId); setExpandedId(histId); }}
                                style={[styles.historySwitch, { borderColor: histOpt.accentColor + '44', backgroundColor: histOpt.accentColor + '12' }]}
                              >
                                <Typography variant="microLabel" style={{ color: histOpt.accentColor, letterSpacing: 0.8 }}>
                                  {isActive ? 'AKTYWNY' : 'PRZEŁĄCZ'}
                                </Typography>
                              </Pressable>
                            </View>
                          </Animated.View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          </Animated.View>

          {/* ── IMPACT VISUALIZATION ── */}
          <Animated.View entering={FadeInDown.delay(240).duration(500)} style={{ marginTop: 8 }}>
            <Pressable
              onPress={() => { HapticsService.impact('light'); LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setImpactOpen(v => !v); }}
              style={[styles.sectionToggle, {
                backgroundColor: isLight ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.04)',
                borderColor: '#60A5FA40',
              }]}
            >
              <View style={styles.sectionToggleRow}>
                <View style={[styles.sectionToggleIcon, { backgroundColor: '#60A5FA18' }]}>
                  <Info color="#60A5FA" size={16} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="microLabel" style={{ color: '#60A5FA', letterSpacing: 1.2 }}>{t('guidancePref.wizualizac_wplywu', 'WIZUALIZACJA WPŁYWU')}</Typography>
                  <Typography variant="bodySmall" style={{ opacity: 0.65, marginTop: 2, color: textColor }}>{t('guidancePref.to_samo_pytanie_rozne_style', 'To samo pytanie, różne style — porównaj tony')}</Typography>
                </View>
                {impactOpen ? <ChevronUp color={subColor} size={16} /> : <ChevronDown color={subColor} size={16} />}
              </View>

              {impactOpen && (
                <View style={styles.previewContent}>
                  <View style={[styles.previewDivider, { backgroundColor: '#60A5FA30' }]} />
                  <View style={[styles.impactQuestion, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', borderColor: '#60A5FA28' }]}>
                    <Typography variant="microLabel" style={{ color: '#60A5FA', letterSpacing: 1, marginBottom: 6 }}>{t('guidancePref.pytanie', 'PYTANIE')}</Typography>
                    <Typography variant="bodySmall" style={{ lineHeight: 21, fontStyle: 'italic', opacity: 0.85, color: textColor }}>
                      "{IMPACT_QUESTION}"
                    </Typography>
                  </View>
                  <Typography variant="microLabel" style={{ color: subColor, letterSpacing: 1, marginBottom: 12, marginTop: 4 }}>
                    {t('guidancePref.odpowiedzi_wedlug_stylu', 'ODPOWIEDZI WEDŁUG STYLU')}
                  </Typography>
                  <View style={{ gap: 10 }}>
                    {OPTIONS.slice(0, 4).map((opt, i) => {
                      const answer = IMPACT_ANSWERS[opt.id];
                      const isHighlighted = selectedId === opt.id;
                      return (
                        <Animated.View key={opt.id} entering={FadeInDown.delay(i * 70).duration(400)}>
                          <View style={[styles.impactCard, {
                            borderColor: isHighlighted ? opt.accentColor + '55' : opt.accentColor + '22',
                            backgroundColor: isHighlighted ? opt.accentColor + '0C' : isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                            borderLeftWidth: isHighlighted ? 3 : 1,
                          }]}>
                            <View style={styles.impactCardTop}>
                              <View style={[styles.impactStyleBadge, { backgroundColor: opt.accentColor + '20', borderColor: opt.accentColor + '44' }]}>
                                <Typography variant="microLabel" style={{ color: opt.accentColor, letterSpacing: 0.8 }}>{opt.title}</Typography>
                              </View>
                              {isHighlighted && (
                                <View style={[styles.impactActiveBadge, { backgroundColor: opt.accentColor + '22' }]}>
                                  <Typography variant="microLabel" style={{ color: opt.accentColor, letterSpacing: 0.6 }}>{t('guidancePref.wybrany', 'WYBRANY')}</Typography>
                                </View>
                              )}
                            </View>
                            <Typography variant="bodySmall" style={{ lineHeight: 21, opacity: isHighlighted ? 0.90 : 0.68, marginTop: 8, fontStyle: 'italic', color: textColor }}>
                              "{answer}"
                            </Typography>
                          </View>
                        </Animated.View>
                      );
                    })}
                  </View>
                </View>
              )}
            </Pressable>
          </Animated.View>

          {/* ── ADVANCED CUSTOMIZATION ── */}
          <Animated.View entering={FadeInDown.delay(280).duration(500)} style={{ marginTop: 8 }}>
            <Pressable
              onPress={() => { HapticsService.impact('light'); LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setAdvancedOpen(v => !v); }}
              style={[styles.sectionToggle, {
                backgroundColor: isLight ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.04)',
                borderColor: '#A78BFA40',
              }]}
            >
              <View style={styles.sectionToggleRow}>
                <View style={[styles.sectionToggleIcon, { backgroundColor: '#A78BFA18' }]}>
                  <BookOpen color="#A78BFA" size={16} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="microLabel" style={{ color: '#A78BFA', letterSpacing: 1.2 }}>{t('guidancePref.zaawansowa_dostosowan', 'ZAAWANSOWANE DOSTOSOWANIE')}</Typography>
                  <Typography variant="bodySmall" style={{ opacity: 0.65, marginTop: 2, color: textColor }}>{t('guidancePref.glebokosc_bezposredn_fokus', 'Głębokość, bezpośredniość, fokus')}</Typography>
                </View>
                {advancedOpen ? <ChevronUp color={subColor} size={16} /> : <ChevronDown color={subColor} size={16} />}
              </View>

              {advancedOpen && (
                <View style={styles.previewContent}>
                  <View style={[styles.previewDivider, { backgroundColor: '#A78BFA30' }]} />
                  <Typography variant="bodySmall" style={{ opacity: 0.72, lineHeight: 22, marginBottom: 20 }}>
                    {t('guidancePref.dostosuj_niuanse_tonu_oracle_niezal', 'Dostosuj niuanse tonu Oracle niezależnie od wybranego stylu prowadzenia. Suwaki wpływają na to, jak szczegółowe, bezpośrednie i duchowe będą odpowiedzi.')}
                  </Typography>

                  {/* Depth Slider */}
                  <View style={styles.sliderBlock}>
                    <View style={styles.sliderLabelRow}>
                      <Typography variant="bodySmall" style={[sliderLabelStyle, { color: textColor }]}>{t('guidancePref.glebokosc', 'Głębokość')}</Typography>
                      <View style={[styles.sliderValueBadge, { backgroundColor: '#A78BFA18', borderColor: '#A78BFA40' }]}>
                        <Typography variant="microLabel" style={{ color: '#A78BFA' }}>
                          {depthVal < 0.35 ? 'Powierzchownie' : depthVal > 0.65 ? 'Głęboko' : 'Zrównoważony'}
                        </Typography>
                      </View>
                    </View>
                    <View style={styles.sliderEndLabels}>
                      <Typography variant="caption" style={{ color: subColor }}>{t('guidancePref.powierzcho', 'Powierzchownie')}</Typography>
                      <Typography variant="caption" style={{ color: subColor }}>{t('guidancePref.gleboko', 'Głęboko')}</Typography>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={1}
                      value={depthVal}
                      onValueChange={setDepthVal}
                      minimumTrackTintColor="#A78BFA"
                      maximumTrackTintColor={isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}
                      thumbTintColor="#A78BFA"
                    />
                    <Typography variant="caption" style={{ color: subColor, lineHeight: 18, marginTop: 4 }}>
                      {depthVal < 0.35
                        ? 'Krótkie, praktyczne wskazówki bez zagłębiania się w teorię i archetypy.'
                        : depthVal > 0.65
                        ? 'Pełne interpretacje z odniesieniami do mitologii, psychologii i symboliki.'
                        : 'Zrównoważona mieszanka praktyki i głębszego kontekstu.'}
                    </Typography>
                  </View>

                  {/* Directness Slider */}
                  <View style={[styles.sliderBlock, { marginTop: 20 }]}>
                    <View style={styles.sliderLabelRow}>
                      <Typography variant="bodySmall" style={[sliderLabelStyle, { color: textColor }]}>{t('guidancePref.bezposredn', 'Bezpośredniość')}</Typography>
                      <View style={[styles.sliderValueBadge, { backgroundColor: '#F472B618', borderColor: '#F472B640' }]}>
                        <Typography variant="microLabel" style={{ color: '#F472B6' }}>
                          {directnessVal < 0.35 ? 'Łagodnie' : directnessVal > 0.65 ? 'Wprost' : 'Asertywnie'}
                        </Typography>
                      </View>
                    </View>
                    <View style={styles.sliderEndLabels}>
                      <Typography variant="caption" style={{ color: subColor }}>{t('guidancePref.lagodnie', 'Łagodnie')}</Typography>
                      <Typography variant="caption" style={{ color: subColor }}>{t('guidancePref.wprost', 'Wprost')}</Typography>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={1}
                      value={directnessVal}
                      onValueChange={setDirectnessVal}
                      minimumTrackTintColor="#F472B6"
                      maximumTrackTintColor={isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}
                      thumbTintColor="#F472B6"
                    />
                    <Typography variant="caption" style={{ color: subColor, lineHeight: 18, marginTop: 4 }}>
                      {directnessVal < 0.35
                        ? 'Oracle ostrożnie sugeruje, używa metafor i pyta, zamiast twierdzić.'
                        : directnessVal > 0.65
                        ? 'Oracle mówi prosto, bez owijania w bawełnę. Konkretne obserwacje i wezwania.'
                        : 'Oracle balansuje między miękkim pytaniem a wyraźną obserwacją.'}
                    </Typography>
                  </View>

                  {/* Focus Slider */}
                  <View style={[styles.sliderBlock, { marginTop: 20 }]}>
                    <View style={styles.sliderLabelRow}>
                      <Typography variant="bodySmall" style={[sliderLabelStyle, { color: textColor }]}>{t('guidancePref.fokus', 'Fokus')}</Typography>
                      <View style={[styles.sliderValueBadge, { backgroundColor: '#60A5FA18', borderColor: '#60A5FA40' }]}>
                        <Typography variant="microLabel" style={{ color: '#60A5FA' }}>
                          {focusVal < 0.35 ? 'Praktycznie' : focusVal > 0.65 ? 'Duchowo' : 'Integralnie'}
                        </Typography>
                      </View>
                    </View>
                    <View style={styles.sliderEndLabels}>
                      <Typography variant="caption" style={{ color: subColor }}>{t('guidancePref.praktyczni', 'Praktycznie')}</Typography>
                      <Typography variant="caption" style={{ color: subColor }}>{t('guidancePref.duchowo', 'Duchowo')}</Typography>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={1}
                      value={focusVal}
                      onValueChange={setFocusVal}
                      minimumTrackTintColor="#60A5FA"
                      maximumTrackTintColor={isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}
                      thumbTintColor="#60A5FA"
                    />
                    <Typography variant="caption" style={{ color: subColor, lineHeight: 18, marginTop: 4 }}>
                      {focusVal < 0.35
                        ? 'Wskazówki skupione na działaniu — konkretne kroki, nie wizje.'
                        : focusVal > 0.65
                        ? 'Oracle koncentruje się na znaczeniu, symbolice i połączeniu z czymś większym.'
                        : 'Równowaga między działaniem a sensem — spirytualne analizy z praktycznym wyjściem.'}
                    </Typography>
                  </View>

                  <View style={[styles.advancedSummary, { backgroundColor: '#A78BFA0C', borderColor: '#A78BFA28' }]}>
                    <Typography variant="microLabel" style={{ color: '#A78BFA', letterSpacing: 1.2, marginBottom: 8 }}>{t('guidancePref.twoj_profil_prowadzeni', 'TWÓJ PROFIL PROWADZENIA')}</Typography>
                    <Typography variant="bodySmall" style={{ lineHeight: 22, opacity: 0.78 }}>
                      {selectedOption ? selectedOption.title : 'Nie wybrano'} · {depthVal < 0.35 ? 'Powierzchownie' : depthVal > 0.65 ? 'Głęboko' : 'Zrównoważony'} · {directnessVal < 0.35 ? 'Łagodnie' : directnessVal > 0.65 ? 'Wprost' : 'Asertywnie'} · {focusVal < 0.35 ? 'Praktycznie' : focusVal > 0.65 ? 'Duchowo' : 'Integralnie'}
                    </Typography>
                  </View>
                </View>
              )}
            </Pressable>
          </Animated.View>

          {/* ── AETHERA'S APPROACH INFO CARD ── */}
          <Animated.View entering={FadeInUp.delay(300).duration(600)} style={{ marginTop: 24 }}>
            <View style={[styles.infoCard, {
              backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)',
              borderColor: isLight ? 'rgba(139,100,42,0.32)' : 'rgba(255,255,255,0.07)',
            }]}>
              <View style={styles.infoRow}>
                <Sparkles color={currentTheme.primary} size={16} strokeWidth={1.5} style={{ marginRight: 10, marginTop: 1 }} />
                <Typography variant="microLabel" style={{ color: currentTheme.primary, letterSpacing: 1.1 }}>
                  {t('guidancePref.podejscie_aethery', 'PODEJŚCIE AETHERY')}
                </Typography>
              </View>
              <Typography variant="bodySmall" style={{ lineHeight: 22, opacity: 0.75, marginTop: 8 }}>
                To jest punkt startowy, nie ograniczenie. Możesz w każdej chwili eksplorować wszystkie moduły — astrologie, tarot, sny, numerologię — niezależnie od wybranego filtru. Wybór wpływa tylko na to, co Aethera proponuje jako pierwsze wejście w dzień.
              </Typography>
            </View>
          </Animated.View>

          {/* ── BACK LINK ── */}
          <Pressable
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('IdentitySetup')}
            style={styles.inlineBack}
          >
            <Typography variant="caption" color={currentTheme.primary}>
              {t('guidancePref.wroc_do_danych_osobistych', 'Wróć do danych osobistych')}
            </Typography>
          </Pressable>

          <EndOfContentSpacer size="compact" />
        </ScrollView>

        {/* ── CONTINUE BUTTON ── */}
        {selectedId && (
          <Animated.View
            entering={FadeInUp.duration(400)}
            style={[
              styles.continueWrapper,
              { paddingBottom: Math.max(insets.bottom + 12, 24), backgroundColor: isLight ? 'rgba(250,248,244,0.97)' : 'rgba(8,6,16,0.97)' },
            ]}
          >
            <Pressable
              onPress={handleContinue}
              style={({ pressed }) => [styles.continueBtn, { opacity: pressed ? 0.88 : 1 }]}
            >
              <LinearGradient
                colors={[currentTheme.primary, currentTheme.primary + 'BB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
              <Typography variant="premiumLabel" color="#000" style={{ letterSpacing: 0.8 }}>
                Zaczynam z: {selectedOption?.title}
              </Typography>
              <ArrowRight color="#000" size={18} strokeWidth={2} />
            </Pressable>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: layout.padding.screen,
    paddingBottom: 140,
  },
  cardWrapper: {
    marginTop: 12,
    borderRadius: 20,
  },
  optionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 18,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronBox: {
    paddingTop: 4,
    paddingLeft: 4,
    flexShrink: 0,
  },
  expandedSection: {
    marginTop: 16,
  },
  expandDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 14,
    borderRadius: 1,
  },
  experienceBlock: {
    padding: 14,
    marginBottom: 12,
  },
  experienceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  experienceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },
  previewBlock: {
    padding: 12,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineBack: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  continueWrapper: {
    paddingHorizontal: layout.padding.screen,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.10)',
  },
  continueBtn: {
    height: 62,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 18,
    elevation: 10,
  },
  // ── New section styles ──
  sectionToggle: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  sectionToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionToggleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  previewContent: {
    marginTop: 14,
  },
  previewDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 14,
    borderRadius: 1,
  },
  oraclePreviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  oraclePreviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  oracleNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  pairIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pairAccentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sigCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sigCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sigBadge: {
    fontSize: 18,
  },
  sigCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  sigIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sigApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
  },
  sigNoData: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  historyNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  historyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  historySwitch: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  impactQuestion: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  impactCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  impactCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  impactStyleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  impactActiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sliderBlock: {
    gap: 4,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sliderValueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  sliderEndLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  advancedSummary: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 20,
  },
});
