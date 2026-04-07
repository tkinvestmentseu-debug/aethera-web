// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Dimensions, Pressable, ScrollView, StyleSheet, Text, View, TextInput,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence,
  withDelay, Easing, FadeInDown, FadeInUp, withSpring, interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle, Path, G, Line, Text as SvgText, Defs, RadialGradient, Stop,
  Polygon, Ellipse, ClipPath,
} from 'react-native-svg';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { HapticsService } from '../core/services/haptics.service';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import {
  Star, ChevronLeft, ChevronDown, ChevronRight, Sparkles, BookOpen,
  Moon, Heart, Zap, Sun, Snowflake, Wind, Leaf, ArrowRight, Eye,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#CEAE72';

// ─── Polish month names ────────────────────────────────────────────────────────
const MONTH_NAMES_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];
const MONTH_SHORT = [
  'STY', 'LUT', 'MAR', 'KWI', 'MAJ', 'CZE',
  'LIP', 'SIE', 'WRZ', 'PAŹ', 'LIS', 'GRU',
];

// ─── Season config ─────────────────────────────────────────────────────────────
const SEASON_COLORS = [
  '#60A5FA', '#60A5FA', '#34D399', // Jan Feb Mar
  '#34D399', '#34D399', '#F59E0B', // Apr May Jun
  '#F59E0B', '#F59E0B', '#F97316', // Jul Aug Sep
  '#F97316', '#F97316', '#60A5FA', // Oct Nov Dec
];

// ─── Personal year meanings ────────────────────────────────────────────────────
const YEAR_DATA: Record<number, {
  name: string; theme: string; keywords: string[];
  opportunity: string; challenge: string; color: string;
  affirmations: string[]; monthlyEnergy: number[];
}> = {
  1: {
    name: 'Rok Jedynki',
    theme: 'Nowe początki i inicjacja',
    keywords: ['Odwaga', 'Niezależność', 'Innowacja', 'Liderstwo', 'Start'],
    opportunity: 'Zasadź nasiona, które będą rosły przez cały 9-letni cykl. Każda decyzja podjęta teraz niesie ze sobą długoterminową wagę. Odważ się zacząć od zera — twój wewnętrzny kompas jest teraz wyjątkowo precyzyjny.',
    challenge: 'Opór przed zmianą i strach przed nieznanym mogą blokować naturalny przepływ energii Jedynki. Uważaj na izolację i egocentryzm — siła tego roku jest indywidualna, ale nie samotnicza.',
    color: '#FF6B6B',
    affirmations: [
      'Jestem gotowy/a na to, co nowe i nieznane.',
      'Moje odważne kroki wyznaczają kierunek na wiele lat.',
      'Zaczynam z czystego miejsca, pełen/pełna siły.',
    ],
    monthlyEnergy: [9, 7, 8, 8, 6, 7, 5, 6, 8, 7, 6, 5],
  },
  2: {
    name: 'Rok Dwójki',
    theme: 'Cierpliwość i partnerstwo',
    keywords: ['Współpraca', 'Intuicja', 'Cierpliwość', 'Harmonia', 'Słuchanie'],
    opportunity: 'Rok, w którym relacje i subtelne sygnały mówią głośniej niż czyny. Partnerstwa — osobiste i zawodowe — nabierają nowej głębi. Twoja wrażliwość jest darem, nie słabością.',
    challenge: 'Nadwrażliwość na opinie innych i skłonność do odkładania własnych potrzeb na dalszy plan. Dwójka uczy balansu między byciem dla siebie a byciem dla innych.',
    color: '#818CF8',
    affirmations: [
      'Moje granice są wyrazem szacunku do siebie i innych.',
      'Słucham subtelnych sygnałów, które prowadzą mnie do harmonii.',
      'W cierpliwości odnajduję swoją moc.',
    ],
    monthlyEnergy: [5, 7, 6, 8, 9, 7, 6, 8, 7, 5, 6, 7],
  },
  3: {
    name: 'Rok Trójki',
    theme: 'Ekspresja i twórcza radość',
    keywords: ['Kreatywność', 'Radość', 'Komunikacja', 'Ekspansja', 'Twórczość'],
    opportunity: 'Twój głos, słowa i twórczość niosą w tym roku szczególną wibrację. Pisz, maluj, śpiewaj, mów — każda forma ekspresji jest narzędziem transformacji. Sieć relacji może się powiększyć w nieprzewidywalny sposób.',
    challenge: 'Rozproszenie uwagi, niedokończone projekty i zbyt duże rozbieganie. Energia Trójki jest zaraźliwa, ale potrzebuje kanału, by nie rozlać się we wszystkich kierunkach jednocześnie.',
    color: '#F59E0B',
    affirmations: [
      'Moja twórczość jest mostem między mną a światem.',
      'Wyrażam siebie z odwagą i lekkością.',
      'Radość jest moim duchowym przewodnikiem w tym roku.',
    ],
    monthlyEnergy: [6, 7, 8, 9, 8, 7, 8, 9, 7, 6, 7, 8],
  },
  4: {
    name: 'Rok Czwórki',
    theme: 'Fundament i dyscyplina',
    keywords: ['Struktura', 'Praca', 'Stabilność', 'Dyscyplina', 'Fundament'],
    opportunity: 'To, co budujesz teraz — nawyki, relacje, projekty — ma szansę stać się trwałą częścią Twojego życia. Rok Czwórki nagradza wytrwałość i systematyczność. Skup się na tym, co naprawdę ważne.',
    challenge: 'Poczucie ciężkości, monotonii i zbyt dużej odpowiedzialności może przytłaczać. Unikaj sztywności myślenia — struktura ma służyć życiu, nie je więzić.',
    color: '#34D399',
    affirmations: [
      'Każdy krok, który stawiam, buduje coś trwałego.',
      'Moja dyscyplina jest aktem miłości do przyszłego siebie.',
      'Fundament, który dziś tworzę, dźwiga moje jutro.',
    ],
    monthlyEnergy: [7, 8, 7, 6, 7, 8, 9, 8, 7, 6, 7, 6],
  },
  5: {
    name: 'Rok Piątki',
    theme: 'Zmiana i wolność',
    keywords: ['Zmiana', 'Przygoda', 'Wolność', 'Ruch', 'Odkrycie'],
    opportunity: 'Rok dynamicznej transformacji — podróże, nowe środowiska, nieoczekiwane zwroty akcji. Trzymanie się dawnych schematów kosztuje podwójnie. Otwórz się na nielinearny rozwój.',
    challenge: 'Niecierpliwość, impulsywność i niestabilność mogą prowadzić do decyzji, których będziesz żałować. Zmiana dla zmiany nie zawsze jest wolnością — rozeznaj, co jest autentyczną potrzebą duszy.',
    color: '#60A5FA',
    affirmations: [
      'Zmiana niesie mi dokładnie to, czego potrzebuję.',
      'Jestem wolny/a, by pójść w kierunku prawdziwego siebie.',
      'Każda nowa droga zaczyna się od pierwszego odważnego kroku.',
    ],
    monthlyEnergy: [8, 9, 7, 8, 9, 8, 7, 8, 9, 8, 7, 6],
  },
  6: {
    name: 'Rok Szóstki',
    theme: 'Miłość i odpowiedzialność',
    keywords: ['Miłość', 'Dom', 'Harmonia', 'Rodzina', 'Zobowiązanie'],
    opportunity: 'Dom, relacje i więzy krwi wychodzą na pierwszy plan. Rok sprzyja tworzeniu i uzdrawianiu więzi, budowaniu harmonijnej przestrzeni życiowej. Miłość jako codzienny wybór, nie uczucie — to jest lekcja Szóstki.',
    challenge: 'Nadmierne poświęcanie się dla innych kosztem własnych potrzeb. Energia opiekuńcza Szóstki może stać się pułapką, jeśli zapomnisz o granicach i własnym centrum.',
    color: '#FB7185',
    affirmations: [
      'Daję z miejsca pełni, nie z miejsca lęku.',
      'Mój dom jest świątynią miłości i bezpieczeństwa.',
      'Troska o innych zaczyna się od troski o siebie.',
    ],
    monthlyEnergy: [7, 8, 9, 8, 7, 8, 9, 7, 8, 7, 6, 8],
  },
  7: {
    name: 'Rok Siódemki',
    theme: 'Refleksja i wewnętrzna mądrość',
    keywords: ['Duchowość', 'Mądrość', 'Medytacja', 'Analiza', 'Samotność'],
    opportunity: 'Rok wewnętrzny i głęboki. Więcej ciszy, mniej działania — to strategia na ten rok. Medytacja, filozofia, studia, odosobnienia mogą przynieść przełomowe wglądy. Twoja intuicja jest teraz wyjątkowo celna.',
    challenge: 'Izolacja, nadmierna analiza i melancholia mogą towarzyszyć temu rokowi. Pamiętaj: cisza ma służyć integracji, nie ucieczce od życia.',
    color: '#A78BFA',
    affirmations: [
      'W ciszy odnajduję swoją najgłębszą mądrość.',
      'Moje pytania są ważniejsze niż gotowe odpowiedzi.',
      'Wewnętrzne życie jest fundamentem zewnętrznej siły.',
    ],
    monthlyEnergy: [6, 7, 8, 9, 7, 8, 9, 7, 8, 6, 7, 8],
  },
  8: {
    name: 'Rok Ósemki',
    theme: 'Moc i manifestacja',
    keywords: ['Siła', 'Sukces', 'Manifestacja', 'Autorytet', 'Zbiory'],
    opportunity: 'Rok zbiorów — to, co siałeś przez lata, teraz może przynosić owoce. Decyzje materialne, zawodowe, finansowe mają wyjątkową wagę. Twój autorytet i pewność siebie mogą teraz działać jak magnes na możliwości.',
    challenge: 'Pokusa władzy dla samej władzy i materializm bez wymiaru duszy. Ósemka to nie tylko sukces zewnętrzny — to integracja siły z wartościami.',
    color: ACCENT,
    affirmations: [
      'Manifestuję z siły, nie z desperacji.',
      'Moja moc służy dobru mnie i innych.',
      'Zbieram owoce lat pracy z wdzięcznością i pokorą.',
    ],
    monthlyEnergy: [8, 9, 8, 7, 8, 9, 8, 7, 8, 9, 7, 8],
  },
  9: {
    name: 'Rok Dziewiątki',
    theme: 'Domknięcie i odpuszczenie',
    keywords: ['Zakończenie', 'Uzdrowienie', 'Odpuszczenie', 'Mądrość', 'Cykl'],
    opportunity: 'Rok domykania długich cykli. Odpuszczaj to, co nie służy — relacje, przekonania, projekty, tożsamości. To, co przetrwa ten rok, jest prawdziwe. Twoja dojrzałość i mądrość są teraz cennym darem dla innych.',
    challenge: 'Opór przed zakończeniem i trzymanie się tego, co skończyło się w duchu. Lęk przed pustką po zamknięciu rozdziału. Pamiętaj — Dziewiątka opróżnia przestrzeń dla nowego cyklu Jedynki.',
    color: '#E879F9',
    affirmations: [
      'Odpuszczam z wdzięcznością to, co wypełniło swoje zadanie.',
      'Zakończenie jest początkiem w przebraniu.',
      'Mądrość tego cyklu jest moim skarbem na następny.',
    ],
    monthlyEnergy: [9, 7, 8, 7, 6, 7, 8, 7, 6, 8, 7, 9],
  },
  11: {
    name: 'Rok Jedenastki',
    theme: 'Iluminacja i inspiracja',
    keywords: ['Intuicja', 'Iluminacja', 'Wibracja', 'Przesłanie', 'Mistycyzm'],
    opportunity: 'Rok mistyczny — intuicja na najwyższych obrotach, synchroniczności, duchowe przebudzenia. Twoje przesłanie ma siłę docierać do wielu. Zaufaj temu, czego nie możesz racjonalnie wyjaśnić.',
    challenge: 'Przeciążenie wrażliwością, wyczerpanie energetyczne i trudność w zakorzeinieniu mistycznych doświadczeń w codzienności.',
    color: '#67E8F9',
    affirmations: [
      'Moje intuicyjne wiedzenie jest precyzyjne i godne zaufania.',
      'Jestem kanałem wyższej mądrości dla siebie i świata.',
      'Iluminacja rośnie, gdy daję sobie czas na ciszę.',
    ],
    monthlyEnergy: [9, 8, 9, 8, 7, 8, 9, 8, 9, 7, 8, 9],
  },
  22: {
    name: 'Rok Dwudziestki Dwójki',
    theme: 'Mistrz Budowniczy',
    keywords: ['Wizja', 'Struktura', 'Misja', 'Manifestacja', 'Architektura'],
    opportunity: 'Rok dla budowniczych wielkich wizji — projektów, które mogą służyć wielu. Masz dostęp do kosmicznego planu i narzędzi do jego realizacji. Myśl w kategoriach dziedzictwa.',
    challenge: 'Ciężar odpowiedzialności mistrza może przytłaczać. Pamiętaj, że wielkie dzieła buduje się krok po kroku, nie jednym gestem.',
    color: '#FCD34D',
    affirmations: [
      'Buduję coś, co przetrwa mnie i służy innym.',
      'Moja wizja jest darem, który realizuję z pokorą.',
      'Każdy fundament, który kładę, jest aktem miłości do przyszłości.',
    ],
    monthlyEnergy: [8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9],
  },
};

// Monthly themes per personal year number
const MONTHLY_JOURNAL_PROMPTS = [
  'Co chcę zainicjować lub porzucić w tym miesiącu?',
  'Jakie sygnały wysyła mi moje ciało i intuicja?',
  'W jaki sposób wyrażam siebie twórczo w tym czasie?',
  'Co buduję i co wymaga moją trwałą uwagę?',
  'Jakich zmian lub nowych doświadczeń szukam?',
  'Jak dbam o swoje relacje i harmonię w otoczeniu?',
  'Co chcę zbadać, przemyśleć lub zrozumieć głębiej?',
  'Jakie decyzje i działania zbliżają mnie do moich celów?',
  'Co muszę domknąć lub wypuścić z rąk?',
  'Skąd w tym miesiącu czerpię energię do odnowy?',
  'Jaka wizja lub nadzieja prowadzi mnie naprzód?',
  'Jak integruję lekcje minionego cyklu?',
];

// ─── Compute personal year number ─────────────────────────────────────────────
function computePersonalYear(birthDate: string, referenceYear?: number): number {
  if (!birthDate) return 1;
  const parts = birthDate.split('-');
  if (parts.length < 3) return 1;
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const year = referenceYear ?? new Date().getFullYear();
  const sum = reduce(month) + reduce(day) + reduce(year);
  return reduceToRoot(sum);
}

function reduce(n: number): number {
  while (n > 9 && n !== 11 && n !== 22) {
    n = String(n).split('').reduce((s, d) => s + parseInt(d, 10), 0);
  }
  return n;
}

function reduceToRoot(n: number): number {
  if (n === 11 || n === 22) return n;
  while (n > 9) {
    n = String(n).split('').reduce((s, d) => s + parseInt(d, 10), 0);
  }
  return n;
}

// ─── YearWheelWidget ──────────────────────────────────────────────────────────
const WHEEL_SIZE = 240;
const WCX = WHEEL_SIZE / 2;
const WCY = WHEEL_SIZE / 2;
const OUTER_R = 108;
const INNER_R = 72;
const TEXT_R = 94;

function YearWheelWidget({ personalYear, currentMonth, yearData, isLight }: {
  personalYear: number; currentMonth: number; yearData: any; isLight?: boolean;
}) {
  const rotateOuter = useSharedValue(0);
  const pulse = useSharedValue(1);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    rotateOuter.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }), -1, false,
    );
    pulse.value = withRepeat(withSequence(
      withTiming(1.05, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      withTiming(1.0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
    ), -1, false);
    return () => { cancelAnimation(rotateOuter); cancelAnimation(pulse); };
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-20, Math.min(20, e.translationY * 0.25));
      tiltY.value = Math.max(-20, Math.min(20, e.translationX * 0.25));
    })
    .onEnd(() => {
      tiltX.value = withSpring(0);
      tiltY.value = withSpring(0);
    });

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateOuter.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // Build 12 month segments
  const segments = Array.from({ length: 12 }, (_, i) => {
    const startAngle = (i / 12) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((i + 1) / 12) * 2 * Math.PI - Math.PI / 2;
    const isCurrent = i === currentMonth;
    const color = SEASON_COLORS[i];
    const r = OUTER_R;
    const ri = INNER_R + 4;
    const gap = 0.02;
    const sa = startAngle + gap;
    const ea = endAngle - gap;
    const x1 = WCX + r * Math.cos(sa);
    const y1 = WCY + r * Math.sin(sa);
    const x2 = WCX + r * Math.cos(ea);
    const y2 = WCY + r * Math.sin(ea);
    const x3 = WCX + ri * Math.cos(ea);
    const y3 = WCY + ri * Math.sin(ea);
    const x4 = WCX + ri * Math.cos(sa);
    const y4 = WCY + ri * Math.sin(sa);
    const largeArc = ea - sa > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${ri} ${ri} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    // Text position
    const midAngle = (startAngle + endAngle) / 2;
    const tx = WCX + TEXT_R * Math.cos(midAngle);
    const ty = WCY + TEXT_R * Math.sin(midAngle);
    return { d, color, isCurrent, tx, ty, label: MONTH_SHORT[i], midAngle };
  });

  const accentColor = yearData?.color ?? ACCENT;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ width: WHEEL_SIZE, height: WHEEL_SIZE, alignSelf: 'center' }, wrapStyle]}>
        {/* Glow pulse */}
        <Animated.View style={[StyleSheet.absoluteFill, pulseStyle]}>
          <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
            <Defs>
              <RadialGradient id="wheelGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={accentColor} stopOpacity="0.22" />
                <Stop offset="55%" stopColor={accentColor} stopOpacity="0.06" />
                <Stop offset="100%" stopColor={accentColor} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={WCX} cy={WCY} r={OUTER_R + 14} fill="url(#wheelGlow)" />
          </Svg>
        </Animated.View>

        {/* Month segments */}
        <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} style={StyleSheet.absoluteFill}>
          {segments.map((seg, i) => (
            <G key={i}>
              <Path
                d={seg.d}
                fill={seg.isCurrent ? seg.color : `${seg.color}60`}
                stroke={seg.isCurrent ? '#FFFFFF' : `${seg.color}80`}
                strokeWidth={seg.isCurrent ? 2 : 0.8}
              />
              <SvgText
                x={seg.tx}
                y={seg.ty + 4}
                textAnchor="middle"
                fontSize={seg.isCurrent ? 8 : 7}
                fontWeight={seg.isCurrent ? 'bold' : 'normal'}
                fill={seg.isCurrent ? '#FFFFFF' : 'rgba(255,255,255,0.65)'}
              >
                {seg.label}
              </SvgText>
            </G>
          ))}

          {/* Inner circle base */}
          <Defs>
            <RadialGradient id="innerGrad" cx="40%" cy="35%" r="65%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
              <Stop offset="100%" stopColor={accentColor} stopOpacity="0.08" />
            </RadialGradient>
          </Defs>
          <Circle cx={WCX} cy={WCY} r={INNER_R} fill="url(#innerGrad)" stroke={`${accentColor}55`} strokeWidth={1.5} />

          {/* Sacred geometry inside */}
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * 2 * Math.PI;
            return (
              <Line key={i}
                x1={WCX} y1={WCY}
                x2={WCX + 48 * Math.cos(a)} y2={WCY + 48 * Math.sin(a)}
                stroke={accentColor} strokeWidth={0.5} strokeOpacity={0.3} />
            );
          })}
          <Circle cx={WCX} cy={WCY} r={30} fill="none" stroke={accentColor} strokeWidth={0.8} strokeOpacity={0.4} />
        </Svg>

        {/* Outer rotating decoration ring */}
        <Animated.View style={[StyleSheet.absoluteFill, outerRingStyle]}>
          <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
            <Circle cx={WCX} cy={WCY} r={OUTER_R + 8}
              fill="none" stroke={`${accentColor}44`} strokeWidth={1}
              strokeDasharray="3 9" />
            {Array.from({ length: 24 }, (_, i) => {
              const a = (i / 24) * 2 * Math.PI - Math.PI / 2;
              const ri = OUTER_R + 5;
              const ro = OUTER_R + 11;
              return (
                <Line key={i}
                  x1={WCX + ri * Math.cos(a)} y1={WCY + ri * Math.sin(a)}
                  x2={WCX + ro * Math.cos(a)} y2={WCY + ro * Math.sin(a)}
                  stroke={`${accentColor}55`} strokeWidth={i % 6 === 0 ? 1.5 : 0.8} />
              );
            })}
          </Svg>
        </Animated.View>

        {/* Center year number */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: accentColor, fontSize: 44, fontWeight: '900', letterSpacing: -1 }}>{personalYear}</Text>
          <Text style={{ color: isLight ? 'rgba(37,29,22,0.6)' : 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700', letterSpacing: 2.5, marginTop: -4 }}>ROK OSOBISTY</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Year Timeline SVG ─────────────────────────────────────────────────────────
function YearTimeline({ energies, currentMonth, accentColor, isLight }: {
  energies: number[]; currentMonth: number; accentColor: string; isLight: boolean;
}) {
  const TWIDTH = Math.max(SW * 1.6, 600);
  const TH = 80;
  const colW = TWIDTH / 12;

  // Build wave path
  const points = energies.map((e, i) => ({
    x: i * colW + colW / 2,
    y: TH - 8 - (e / 10) * (TH - 20),
  }));

  let wavePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cp1x = points[i - 1].x + colW / 3;
    const cp1y = points[i - 1].y;
    const cp2x = points[i].x - colW / 3;
    const cp2y = points[i].y;
    wavePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
  }
  const areaPath = wavePath + ` L ${points[11].x} ${TH} L ${points[0].x} ${TH} Z`;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
      <Svg width={TWIDTH} height={TH + 24}>
        <Defs>
          <RadialGradient id="waveGrad" cx="50%" cy="0%" r="100%">
            <Stop offset="0%" stopColor={accentColor} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={accentColor} stopOpacity="0.04" />
          </RadialGradient>
        </Defs>
        {/* Area fill */}
        <Path d={areaPath} fill="url(#waveGrad)" />
        {/* Wave line */}
        <Path d={wavePath} fill="none" stroke={accentColor} strokeWidth={2} strokeOpacity={0.8} />
        {/* Month labels + dots */}
        {points.map((p, i) => (
          <G key={i}>
            <Circle cx={p.x} cy={p.y} r={i === currentMonth ? 6 : 4}
              fill={i === currentMonth ? accentColor : `${accentColor}88`}
              stroke={i === currentMonth ? '#FFFFFF' : 'transparent'}
              strokeWidth={1.5} />
            <SvgText x={p.x} y={TH + 16} textAnchor="middle"
              fontSize={i === currentMonth ? 9 : 7.5}
              fontWeight={i === currentMonth ? 'bold' : 'normal'}
              fill={i === currentMonth ? accentColor : (isLight ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.45)')}>
              {MONTH_SHORT[i]}
            </SvgText>
          </G>
        ))}
        {/* Current month vertical line */}
        <Line
          x1={points[currentMonth].x} y1={0}
          x2={points[currentMonth].x} y2={TH}
          stroke={accentColor} strokeWidth={1} strokeOpacity={0.35}
          strokeDasharray="4 4" />
      </Svg>
    </ScrollView>
  );
}

// ─── Month accordion card ──────────────────────────────────────────────────────
function MonthCard({
  index, currentMonth, yearData, isLight, textColor, subColor, borderColor,
}: {
  index: number; currentMonth: number; yearData: any;
  isLight: boolean; textColor: string; subColor: string; borderColor: string;
}) {
  const [expanded, setExpanded] = useState(index === currentMonth);
  const isCurrent = index === currentMonth;
  const color = SEASON_COLORS[index];
  const energy = yearData?.monthlyEnergy?.[index] ?? 7;

  // Season name
  const seasonName =
    index < 2 || index === 11 ? 'Zima' :
    index < 5 ? 'Wiosna' :
    index < 8 ? 'Lato' : 'Jesień';

  const seasonGradients: Record<string, string[]> = {
    Wiosna: ['#34D39920', '#34D39908'],
    Lato: ['#F59E0B20', '#F59E0B08'],
    Jesień: ['#F9731620', '#F9731608'],
    Zima: ['#60A5FA20', '#60A5FA08'],
  };
  const gradColors = seasonGradients[seasonName] ?? ['transparent', 'transparent'];

  return (
    <View>
      <Pressable onPress={() => { setExpanded(v => !v); HapticsService.notify(); }}>
        <LinearGradient
          colors={isLight
            ? [isCurrent ? `${color}22` : 'rgba(255,255,255,0.88)', isCurrent ? `${color}0A` : 'rgba(0,0,0,0.01)']
            : [isCurrent ? `${color}18` : 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0)']}
          style={[styles.monthCard, {
            borderColor: isCurrent ? `${color}66` : borderColor,
            borderLeftColor: color,
            borderLeftWidth: 3,
          }]}
        >
          <View style={styles.monthCardRow}>
            <View style={[styles.monthNumber, { backgroundColor: `${color}22`, borderColor: `${color}44` }]}>
              <Text style={[styles.monthNumberText, { color }]}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.monthName, { color: textColor }]}>{MONTH_NAMES_PL[index]}</Text>
                {isCurrent && (
                  <View style={[styles.currentBadge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
                    <Text style={[styles.currentBadgeText, { color }]}>TERAZ</Text>
                  </View>
                )}
              </View>
              {/* Energy bar */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                {Array.from({ length: 10 }, (_, i) => (
                  <View key={i} style={{
                    width: 8, height: 4, borderRadius: 2,
                    backgroundColor: i < energy
                      ? (isCurrent ? color : `${color}99`)
                      : (isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)'),
                  }} />
                ))}
                <Text style={[styles.energyLabel, { color: subColor }]}>{seasonName}</Text>
              </View>
            </View>
            <ChevronDown size={16} color={subColor}
              style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} />
          </View>

          {expanded && (
            <View style={styles.monthExpanded}>
              <Text style={[styles.monthTheme, { color: subColor }]}>
                {MONTHLY_JOURNAL_PROMPTS[index]}
              </Text>
              <View style={[styles.monthPromptBox, {
                backgroundColor: isLight ? `${color}14` : `${color}10`,
                borderColor: `${color}33`,
              }]}>
                <Text style={[styles.monthPromptLabel, { color }]}>PYTANIE MIESIĄCA</Text>
                <Text style={[styles.monthPromptText, { color: textColor }]}>
                  {MONTHLY_JOURNAL_PROMPTS[index]}
                </Text>
              </View>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export const YearCardScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
  const textColor = isLight ? '#1A1A2E' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.5)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.06)';
  const borderColor = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)';

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  const personalYear = useMemo(() => {
    return computePersonalYear(userData?.birthDate || '', currentYear);
  }, [userData?.birthDate, currentYear]);

  const yearData = useMemo(() => {
    return YEAR_DATA[personalYear] ?? YEAR_DATA[1];
  }, [personalYear]);

  const accentColor = yearData?.color ?? ACCENT;

  const [intention, setIntention] = useState('');
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // ─── Star button ─────────────────────────────────────────────────────────
  const FAV_ID = 'year_card';
  const isStarred = isFavoriteItem(FAV_ID);
  const handleStar = useCallback(() => {
    HapticsService.notify();
    if (isStarred) {
      useAppStore.getState().removeFavoriteItem(FAV_ID);
    } else {
      addFavoriteItem({
        id: FAV_ID,
        label: 'Karta Roku',
        sublabel: 'Twój osobisty rok numerologiczny',
        route: 'YearCard',
        icon: 'Sparkles',
        color: accentColor,
        addedAt: new Date().toISOString(),
      });
    }
  }, [isStarred, addFavoriteItem, accentColor]);

  // ─── Navigate to Oracle with context ─────────────────────────────────────
  const handleOraclePress = useCallback(() => {
    HapticsService.notify();
    navigation.navigate('OracleChat', {
      context: `Mój osobisty rok numerologiczny to ${personalYear} — ${yearData?.name}. Temat roku: ${yearData?.theme}. Chcę głębiej zrozumieć energię tego roku i jak mogę najlepiej z niej korzystać.`,
    });
  }, [navigation, personalYear, yearData]);

  const bgColors = isLight
    ? ['#FAF7F0', `${accentColor}08`, '#FAF7F0']
    : ['#05030E', `${accentColor}0C`, '#05030E'];

  const displayMonths = showAllMonths
    ? Array.from({ length: 12 }, (_, i) => i)
    : Array.from({ length: 4 }, (_, i) => (currentMonth + i) % 12);

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView
      style={{ flex: 1}}
      edges={['top']}
    >

      <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.headerBtn} hitSlop={12}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>✦ KARTA ROKU</Text>
        <Pressable onPress={handleStar} style={styles.headerBtn} hitSlop={12}>
          <Star size={20} color={isStarred ? ACCENT : textColor} fill={isStarred ? ACCENT : 'none'} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 40, keyboardHeight + 40) }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero wheel ── */}
        <Animated.View entering={FadeInDown.springify()} style={styles.heroSection}>
          <YearWheelWidget
            personalYear={personalYear}
            currentMonth={currentMonth}
            yearData={yearData}
            isLight={isLight}
          />

          {/* Year name badge */}
          <View style={[styles.yearBadge, {
            borderColor: `${accentColor}55`,
            backgroundColor: isLight ? `${accentColor}18` : `${accentColor}12`,
          }]}>
            <Text style={[styles.yearBadgeName, { color: accentColor }]}>{yearData?.name}</Text>
            <Text style={[styles.yearBadgeTheme, { color: subColor }]}>{yearData?.theme}</Text>
          </View>
        </Animated.View>

        {/* ── Personal year section ── */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={[styles.section, { borderColor, backgroundColor: cardBg }]}>
          {/* Big year number */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
            <View style={[styles.bigYearBadge, {
              backgroundColor: isLight ? `${accentColor}18` : `${accentColor}14`,
              borderColor: `${accentColor}55`,
            }]}>
              <Text style={[styles.bigYearNumber, { color: accentColor }]}>{personalYear}</Text>
              <Text style={[styles.bigYearLabel, { color: subColor }]}>ROK</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>✦ TWÓJ ROK OSOBISTY</Text>
              <Text style={[styles.yearNameText, { color: accentColor, marginTop: 2 }]}>{yearData?.name}</Text>
              <Text style={[styles.yearThemeText, { color: subColor, marginTop: 4, lineHeight: 20 }]}>
                {yearData?.theme}
              </Text>
            </View>
          </View>

          {/* Keywords */}
          <View style={styles.keywordsRow}>
            {yearData?.keywords?.map((kw: string) => (
              <View key={kw} style={[styles.keyword, {
                backgroundColor: isLight ? `${accentColor}14` : `${accentColor}10`,
                borderColor: `${accentColor}44`,
              }]}>
                <Text style={[styles.keywordText, { color: accentColor }]}>{kw}</Text>
              </View>
            ))}
          </View>

          {/* Opportunity */}
          <View style={[styles.infoBlock, {
            backgroundColor: isLight ? `${accentColor}10` : `${accentColor}0C`,
            borderColor: `${accentColor}33`,
          }]}>
            <View style={styles.infoBlockHeader}>
              <Sparkles size={14} color={accentColor} />
              <Text style={[styles.infoBlockLabel, { color: accentColor }]}>SZANSA</Text>
            </View>
            <Text style={[styles.infoBlockText, { color: textColor, lineHeight: 22 }]}>
              {yearData?.opportunity}
            </Text>
          </View>

          {/* Challenge */}
          <View style={[styles.infoBlock, {
            backgroundColor: isLight ? 'rgba(251,113,133,0.08)' : 'rgba(251,113,133,0.06)',
            borderColor: 'rgba(251,113,133,0.25)',
            marginTop: 10,
          }]}>
            <View style={styles.infoBlockHeader}>
              <Zap size={14} color="#FB7185" />
              <Text style={[styles.infoBlockLabel, { color: '#FB7185' }]}>WYZWANIE</Text>
            </View>
            <Text style={[styles.infoBlockText, { color: textColor, lineHeight: 22 }]}>
              {yearData?.challenge}
            </Text>
          </View>
        </Animated.View>

        {/* ── Year Timeline ── */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.section, { borderColor, backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>✦ LINIA ENERGII ROKU</Text>
          <Text style={[styles.sectionSub, { color: subColor, marginBottom: 12 }]}>
            Miesięczna mapa energii osobistego roku
          </Text>
          <YearTimeline
            energies={yearData?.monthlyEnergy ?? Array(12).fill(7)}
            currentMonth={currentMonth}
            accentColor={accentColor}
            isLight={isLight}
          />
        </Animated.View>

        {/* ── Month-by-month forecast ── */}
        <Animated.View entering={FadeInDown.delay(250).springify()} style={[styles.section, { borderColor, backgroundColor: cardBg }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View>
              <Text style={[styles.sectionTitle, { color: textColor }]}>✦ PROGNOZA MIESIĘCZNA</Text>
              <Text style={[styles.sectionSub, { color: subColor }]}>Tap aby rozwinąć każdy miesiąc</Text>
            </View>
            <Pressable
              onPress={() => { setShowAllMonths(v => !v); HapticsService.notify(); }}
              style={[styles.toggleBtn, {
                backgroundColor: isLight ? `${accentColor}14` : `${accentColor}10`,
                borderColor: `${accentColor}44`,
              }]}
            >
              <Text style={[styles.toggleBtnText, { color: accentColor }]}>
                {showAllMonths ? 'Skróć' : 'Wszystkie'}
              </Text>
            </Pressable>
          </View>

          <View style={{ gap: 8 }}>
            {displayMonths.map((monthIndex) => (
              <MonthCard
                key={monthIndex}
                index={monthIndex}
                currentMonth={currentMonth}
                yearData={yearData}
                isLight={isLight}
                textColor={textColor}
                subColor={subColor}
                borderColor={borderColor}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── Affirmations for the year ── */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={[styles.section, { borderColor, backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>✦ AFIRMACJE ROKU</Text>
          <Text style={[styles.sectionSub, { color: subColor, marginBottom: 12 }]}>
            Słowa rezonujące z energią {yearData?.name?.toLowerCase()}
          </Text>
          {yearData?.affirmations?.map((aff: string, i: number) => (
            <View
              key={i}
              style={[styles.affCard, {
                backgroundColor: isLight ? `${accentColor}10` : `${accentColor}0C`,
                borderColor: `${accentColor}33`,
              }]}
            >
              <Text style={{ color: accentColor, fontSize: 16, marginRight: 10 }}>✦</Text>
              <Text style={[styles.affText, { color: textColor, lineHeight: 22 }]}>{aff}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── Life path integration ── */}
        {userData?.birthDate && (
          <Animated.View entering={FadeInDown.delay(350).springify()} style={[styles.section, { borderColor, backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>✦ INTEGRACJA Z ŚCIEŻKĄ ŻYCIA</Text>
            <Text style={[styles.infoBlockText, { color: subColor, lineHeight: 22, marginTop: 8 }]}>
              Rok osobisty {personalYear} wchodzi w interakcję z Twoją Ścieżką Życia, wzmacniając lub moderując jej naturalne tendencje. Sprawdź ekran Numerologii, aby zobaczyć pełną mapę swojego cyklu.
            </Text>
            <Pressable
              onPress={() => { navigation.navigate('Numerology'); HapticsService.notify(); }}
              style={[styles.cta, {
                backgroundColor: isLight ? `${accentColor}18` : `${accentColor}14`,
                borderColor: `${accentColor}55`,
              }]}
            >
              <Text style={[styles.ctaText, { color: accentColor }]}>Otwórz Numerologię</Text>
              <ChevronRight size={16} color={accentColor} />
            </Pressable>
          </Animated.View>
        )}

        {/* ── Oracle button ── */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 16 }}>
          <Pressable onPress={handleOraclePress}>
            <LinearGradient
              colors={isLight ? [`${accentColor}22`, `${accentColor}10`] : [`${accentColor}20`, `${accentColor}08`]}
              style={[styles.oracleBtn, { borderColor: `${accentColor}55` }]}
            >
              <Eye size={20} color={accentColor} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.oracleBtnTitle, { color: accentColor }]}>
                  Poznaj Swój Rok z Oracle
                </Text>
                <Text style={[styles.oracleBtnSub, { color: subColor }]}>
                  Głębsza rozmowa o energii roku {personalYear}
                </Text>
              </View>
              <ArrowRight size={18} color={accentColor} />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* ── Journal intention ── */}
        <Animated.View entering={FadeInDown.delay(450).springify()} style={[styles.section, { borderColor, backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>✦ INTENCJA NA ROK</Text>
          <Text style={[styles.sectionSub, { color: subColor, marginBottom: 12 }]}>
            Zapisz, jak chcesz przeżyć ten rok numerologiczny
          </Text>
          <TextInput
            value={intention}
            onChangeText={setIntention}
            multiline
            placeholder={`Co chcę wyrazić, zbudować lub domknąć w ${yearData?.name?.toLowerCase()}?`}
            placeholderTextColor={subColor}
            style={[styles.intentionInput, {
              color: textColor,
              backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)',
              borderColor,
            }]}
          />
          {intention.length > 0 && (
            <Pressable
              onPress={() => {
                HapticsService.notify();
                navigation.navigate('JournalEntry', {
                  type: 'reflection',
                  prefillContent: intention,
                  prompt: `Intencja na Rok ${personalYear} — ${yearData?.name}`,
                });
              }}
              style={[styles.cta, {
                marginTop: 10,
                backgroundColor: isLight ? `${accentColor}18` : `${accentColor}14`,
                borderColor: `${accentColor}55`,
              }]}
            >
              <BookOpen size={16} color={accentColor} />
              <Text style={[styles.ctaText, { color: accentColor, marginLeft: 8 }]}>
                Zapisz w Dzienniku
              </Text>
              <ChevronRight size={16} color={accentColor} />
            </Pressable>
          )}
        </Animated.View>

        {/* ── Practice tips ── */}
        <Animated.View entering={FadeInDown.delay(500).springify()} style={[styles.section, { borderColor, backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>✦ WSKAZÓWKI PRAKTYCZNE</Text>
          <Text style={[styles.sectionSub, { color: subColor, marginBottom: 12 }]}>
            Jak pracować z kartą roku
          </Text>
          {[
            {
              icon: '🌕',
              title: 'Rytuał miesięczny',
              body: 'Pierwszego dnia każdego miesiąca wróć do karty roku. Zapytaj siebie: jak energia tej karty objawia się teraz? Co chcę zintegrować przed kolejnym etapem?',
            },
            {
              icon: '🧭',
              title: 'Karta jako przewodnik decyzji',
              body: 'Gdy stajesz przed trudnym wyborem, zapytaj: „Która opcja jest w głębszej harmonii z energią mojej karty roku?" Nie szukaj gotowej odpowiedzi — szukaj wewnętrznego rezonansu.',
            },
            {
              icon: '📖',
              title: 'Dziennik cyklu',
              body: 'Co dwa tygodnie zapisz jedno zdanie: jak ta karta była obecna w Twoim życiu? Po roku powstanie kronika wewnętrznej transformacji.',
            },
          ].map((tip, i) => (
            <View
              key={i}
              style={[styles.tipCard, {
                backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)',
                borderColor,
              }]}
            >
              <Text style={{ fontSize: 26, marginRight: 12 }}>{tip.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tipTitle, { color: textColor }]}>{tip.title}</Text>
                <Text style={[styles.tipBody, { color: subColor, lineHeight: 20 }]}>{tip.body}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <EndOfContentSpacer />
      </ScrollView>
        </SafeAreaView>
</View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.padding.screen,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 16,
  },
  yearBadge: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  yearBadgeName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  yearBadgeTheme: {
    fontSize: 12,
    fontWeight: '400',
  },
  section: {
    marginHorizontal: layout.padding.screen,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '400',
  },
  bigYearBadge: {
    width: 68,
    height: 68,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bigYearNumber: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
  },
  bigYearLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: -2,
  },
  yearNameText: {
    fontSize: 15,
    fontWeight: '700',
  },
  yearThemeText: {
    fontSize: 13,
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  keyword: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  keywordText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  infoBlock: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  infoBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  infoBlockLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  infoBlockText: {
    fontSize: 13,
  },
  monthCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
  },
  monthCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthNumber: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  monthNumberText: {
    fontSize: 15,
    fontWeight: '800',
  },
  monthName: {
    fontSize: 14,
    fontWeight: '700',
  },
  currentBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  currentBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  energyLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  monthExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  monthTheme: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  monthPromptBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  monthPromptLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  monthPromptText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  affCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  affText: {
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipBody: {
    fontSize: 13,
  },
  oracleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  oracleBtnTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  oracleBtnSub: {
    fontSize: 12,
    marginTop: 2,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  intentionInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
});

export default YearCardScreen;
