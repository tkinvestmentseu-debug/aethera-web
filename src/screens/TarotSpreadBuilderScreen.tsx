// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, Ellipse, G, Line, Path, Rect, Text as SvgText, Defs, RadialGradient, Stop,
} from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing, cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Sparkles, BookOpen, ChevronDown, ChevronUp,
  Shuffle, Eye, Clock, ArrowRight, X, Plus, Trash2, Wand2, History,
  Library, HelpCircle, MessageCircle, ChevronRight,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '../core/utils/localeFormat';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#EC4899';

// ── BACKGROUND ─────────────────────────────────────────────────
const TarotSpreadBg = ({ isDark }: { isDark: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isDark ? ['#0D0510', '#140820', '#1A0A18'] : ['#FFF0F6', '#FDF2F8', '#FFF5F8']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={700} style={StyleSheet.absoluteFill} opacity={isDark ? 0.14 : 0.08}>
      <G>
        {[80, 160, 240, 320, 400, 480, 560, 640].map((y, i) => (
          <Circle key={i} cx={SW / 2} cy={y} r={60 + i * 8}
            stroke={ACCENT} strokeWidth={0.5} fill="none" opacity={0.3 - i * 0.025} />
        ))}
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const x = SW / 2 + 90 * Math.cos(a);
          const y = 280 + 90 * Math.sin(a);
          return <Circle key={'p' + i} cx={x} cy={y} r={2} fill={ACCENT} opacity={0.25} />;
        })}
        {Array.from({ length: 20 }, (_, i) => (
          <Circle key={'s' + i} cx={(i * 113 + 30) % SW} cy={(i * 89 + 40) % 680}
            r={(i % 4 === 0) ? 1.2 : 0.6} fill={ACCENT} opacity={0.10} />
        ))}
      </G>
    </Svg>
  </View>
);

// ── 3D TAROT SPREAD WIDGET ─────────────────────────────────────
const CARD_POSITIONS = [
  { x: 0,   y: 0,   label: 'Centrum' },
  { x: -52, y: 0,   label: 'Lewo' },
  { x: 52,  y: 0,   label: 'Prawo' },
  { x: 0,   y: -60, label: 'Góra' },
  { x: 0,   y: 60,  label: 'Dół' },
];

const SpreadWidget3D = React.memo(({ accent }: { accent: string }) => {
  const tiltX   = useSharedValue(-6);
  const tiltY   = useSharedValue(0);
  const pulse   = useSharedValue(0.95);
  const rot     = useSharedValue(0);
  const flip    = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withSequence(
      withTiming(1.04, { duration: 2600 }),
      withTiming(0.95, { duration: 2600 })
    ), -1, false);
    rot.value = withRepeat(withTiming(360, { duration: 24000, easing: Easing.linear }), -1, false);
    flip.value = withRepeat(withSequence(
      withTiming(180, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
      withTiming(360, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
    ), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-22, Math.min(22, -6 + e.translationY * 0.2));
      tiltY.value = Math.max(-22, Math.min(22, e.translationX * 0.2));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-6, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: pulse.value },
    ],
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rot.value}deg` }],
  }));

  const SPARKLES = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { x: 105 * Math.cos(a), y: 105 * Math.sin(a) };
  });

  return (
    <View style={{ alignItems: 'center', marginVertical: 12 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: 240, height: 240, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>
          <Svg width={240} height={240} viewBox="-120 -120 240 240" style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="cardGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                <Stop offset="100%" stopColor={accent} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={0} cy={0} r={108} fill="url(#cardGlow)" />
            {[96, 76].map((r, i) => (
              <Circle key={i} cx={0} cy={0} r={r}
                stroke={accent} strokeWidth={0.6} fill="none" opacity={0.18 + i * 0.06}
                strokeDasharray={i === 0 ? '6 10' : '2 8'} />
            ))}
            {CARD_POSITIONS.map((pos, i) => (
              <G key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                <Rect x={-11} y={-16} width={22} height={32} rx={2}
                  fill={accent} opacity={i === 0 ? 0.22 : 0.14} />
                <Rect x={-11} y={-16} width={22} height={32} rx={2}
                  stroke={accent} strokeWidth={0.8} fill="none" opacity={0.55} />
                <Line x1={-7} y1={-11} x2={7} y2={-11} stroke={accent} strokeWidth={0.5} opacity={0.4} />
                <Line x1={-7} y1={-7} x2={7} y2={-7} stroke={accent} strokeWidth={0.5} opacity={0.3} />
                <Circle cx={0} cy={2} r={4} stroke={accent} strokeWidth={0.6} fill="none" opacity={0.5} />
                <SvgText x={0} y={20} textAnchor="middle" fill={accent} fontSize={5} opacity={0.7}>
                  {i + 1}
                </SvgText>
              </G>
            ))}
            <Line x1={-52} y1={0} x2={52} y2={0} stroke={accent} strokeWidth={0.6} opacity={0.25} strokeDasharray="3 5" />
            <Line x1={0} y1={-60} x2={0} y2={60} stroke={accent} strokeWidth={0.6} opacity={0.25} strokeDasharray="3 5" />
          </Svg>
          <Animated.View style={[{ position: 'absolute', width: 240, height: 240, alignItems: 'center', justifyContent: 'center' }, orbitStyle]}>
            <Svg width={240} height={240} viewBox="-120 -120 240 240" style={StyleSheet.absoluteFill}>
              {SPARKLES.map((s, i) => (
                <Circle key={i} cx={s.x} cy={s.y} r={i % 3 === 0 ? 1.8 : 1.0}
                  fill={accent} opacity={i % 4 === 0 ? 0.55 : 0.28} />
              ))}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

// ── DATA ───────────────────────────────────────────────────────
const PRESET_SPREADS = [
  { id: 'single', name: 'Jednotkowa', cards: 1, icon: '✦', purpose: 'Jedna odpowiedź, jedno przesłanie dnia', color: '#EC4899' },
  { id: 'three',  name: 'Trzecia droga', cards: 3, icon: '⟁', purpose: 'Przeszłość, teraźniejszość, przyszłość', color: '#A78BFA' },
  { id: 'celtic', name: 'Krzyż celtycki', cards: 10, icon: '✛', purpose: 'Pełna analiza sytuacji życiowej', color: '#60A5FA' },
  { id: 'horseshoe', name: 'Podkowa', cards: 7, icon: '∪', purpose: 'Przegląd situacji i nadchodzących zmian', color: '#34D399' },
  { id: 'year',   name: 'Rok', cards: 12, icon: '◉', purpose: '12 miesięcy, 12 energii przewodnich', color: '#FBBF24' },
  { id: 'relationship', name: 'Związek', cards: 6, icon: '⋈', purpose: 'Dynamika relacji między dwiema osobami', color: '#F87171' },
  { id: 'decision', name: 'Decyzja', cards: 5, icon: '⚖', purpose: 'Pros & cons dwóch ścieżek wyboru', color: '#FB923C' },
  { id: 'custom', name: 'Własny', cards: 0, icon: '✎', purpose: 'Zbuduj swój unikalny układ', color: '#E879F9' },
];

const PRESET_POSITIONS: Record<string, { label: string; meaning: string }[]> = {
  single: [
    { label: 'Przesłanie', meaning: 'Energia lub przesłanie, które niesie ten dzień lub pytanie' },
  ],
  three: [
    { label: 'Przeszłość', meaning: 'Co minęło i nadal wpływa na sytuację' },
    { label: 'Teraźniejszość', meaning: 'Aktualna energia i punkt, w którym jesteś' },
    { label: 'Przyszłość', meaning: 'Możliwy kierunek, jeśli utrzymasz obecny kurs' },
  ],
  celtic: [
    { label: 'Sytuacja', meaning: 'Serce sprawy — główna energia pytania' },
    { label: 'Przeszkoda', meaning: 'Co staje ci na drodze lub sprawia trudność' },
    { label: 'Cel świadomy', meaning: 'To, czego świadomie pragniesz lub się obawiasz' },
    { label: 'Korzeń', meaning: 'Nieświadome podstawy i przyczyny sytuacji' },
    { label: 'Przeszłość', meaning: 'Co minęło i ma wpływ na dziś' },
    { label: 'Przyszłość', meaning: 'Nadchodzące energy, jeśli nic nie zmienisz' },
    { label: 'Ty', meaning: 'Jak postrzegasz siebie w tej sytuacji' },
    { label: 'Otoczenie', meaning: 'Jak inni widzą ciebie lub sytuację' },
    { label: 'Nadzieje i lęki', meaning: 'Twoje najgłębsze marzenia i obawy' },
    { label: 'Wynik', meaning: 'Potencjalny ostateczny efekt obecnej ścieżki' },
  ],
  horseshoe: [
    { label: 'Przeszłość', meaning: 'Korzenie i skąd przychodzisz' },
    { label: 'Teraźniejszość', meaning: 'Gdzie jesteś teraz' },
    { label: 'Ukryte wpływy', meaning: 'Energia działająca pod powierzchnią' },
    { label: 'Przeszkody', meaning: 'Co blokuje lub utrudnia' },
    { label: 'Otoczenie', meaning: 'Wpływ ludzi wokół ciebie' },
    { label: 'Rada', meaning: 'Co powinieneś zrobić lub rozważyć' },
    { label: 'Wynik', meaning: 'Prawdopodobny skutek obecnej ścieżki' },
  ],
  year: Array.from({ length: 12 }, (_, i) => {
    const months = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
                    'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
    return { label: months[i], meaning: `Dominująca energia miesiąca ${months[i]}` };
  }),
  relationship: [
    { label: 'Twoja energia', meaning: 'Kim jesteś w tej relacji' },
    { label: 'Ich energia', meaning: 'Kim jest druga osoba w relacji' },
    { label: 'Połączenie', meaning: 'Co łączy was razem' },
    { label: 'Wyzwanie', meaning: 'Główne wyzwanie dla relacji' },
    { label: 'Potrzeby', meaning: 'Czego każde z was potrzebuje' },
    { label: 'Potencjał', meaning: 'Dokąd może zmierzać relacja' },
  ],
  decision: [
    { label: 'Sytuacja', meaning: 'Serce decyzji do podjęcia' },
    { label: 'Ścieżka A', meaning: 'Energia pierwszej opcji' },
    { label: 'Ścieżka B', meaning: 'Energia drugiej opcji' },
    { label: 'Rada', meaning: 'Wskazówka mądrości dla ciebie' },
    { label: 'Wynik', meaning: 'Potencjalny efekt najlepszego wyboru' },
  ],
};

const TAROT_CARDS = [
  'Głupiec', 'Mag', 'Kapłanka', 'Cesarzowa', 'Cesarz', 'Hierofant',
  'Kochankowie', 'Rydwan', 'Siła', 'Pustelnik', 'Koło Fortuny', 'Sprawiedliwość',
  'Wisielec', 'Śmierć', 'Umiarkowanie', 'Diabeł', 'Wieża', 'Gwiazda',
  'Księżyc', 'Słońce', 'Sąd', 'Świat',
  'As Buław', '2 Buław', '3 Buław', '4 Buław', '5 Buław', '6 Buław',
  '7 Buław', '8 Buław', '9 Buław', '10 Buław', 'Paź Buław', 'Rycerz Buław',
  'Królowa Buław', 'Król Buław',
  'As Kielichów', '2 Kielichów', '3 Kielichów', '4 Kielichów', '5 Kielichów',
  '6 Kielichów', '7 Kielichów', '8 Kielichów', '9 Kielichów', '10 Kielichów',
  'Paź Kielichów', 'Rycerz Kielichów', 'Królowa Kielichów', 'Król Kielichów',
  'As Mieczy', '2 Mieczy', '3 Mieczy', '4 Mieczy', '5 Mieczy', '6 Mieczy',
  '7 Mieczy', '8 Mieczy', '9 Mieczy', '10 Mieczy', 'Paź Mieczy', 'Rycerz Mieczy',
  'Królowa Mieczy', 'Król Mieczy',
  'As Pentakli', '2 Pentakli', '3 Pentakli', '4 Pentakli', '5 Pentakli',
  '6 Pentakli', '7 Pentakli', '8 Pentakli', '9 Pentakli', '10 Pentakli',
  'Paź Pentakli', 'Rycerz Pentakli', 'Królowa Pentakli', 'Król Pentakli',
];

const QUESTION_TEMPLATES = [
  { prefix: 'W jakiej dziedzinie', placeholder: 'np. kariery, relacji, zdrowia...' },
  { prefix: 'Co powinienem zrozumieć o', placeholder: 'np. obecnej sytuacji, uczuciach...' },
  { prefix: 'Jak rozwinąć', placeholder: 'np. odwagę, cierpliwość, intuicję...' },
  { prefix: 'Co blokuje', placeholder: 'np. moje postępy, realizację marzeń...' },
];

const ORACLE_CHIPS = [
  'Jak czytać układ krzyżowy?',
  'Co oznacza wielokrotny Major Arcana?',
  'Jakie pytanie najlepiej sformułować?',
  'Jak interpretować odwrócone karty w układzie?',
];

const LEARNING_SECTIONS = [
  {
    title: 'Czym jest pozycja w układzie',
    content: `Każda pozycja w układzie tarota nosi określone znaczenie, które nadaje kontekst wyciągniętej karcie. Karta sama w sobie jest energią — pozycja określa, w jakiej roli ta energia działa w twoim życiu.\n\nNa przykład karta Śmierć w pozycji "Przeszłość" oznacza zakończenie pewnego rozdziału, które już się dokonało i stworzyło miejsce dla czegoś nowego. Ta sama karta w pozycji "Wyzwanie" wskazuje, że trudność polega właśnie na gotowości do transformacji i puszczenia starego.\n\nPrzed ułożeniem kart warto jasno rozumieć, co każda pozycja oznacza. Zapisz to, zanim zaczniesz — a po dobraniu zastanów się, jak karta rezonuje z tą konkretną rolą, a nie z ogólnym znaczeniem.`,
  },
  {
    title: 'Jak czytać odwrócone karty',
    content: `Odwrócona karta (rewersja) nie oznacza automatycznie "złej" energii. Istnieje kilka podejść do rewersji i warto wybrać jedno, które jest dla ciebie spójne:\n\n1. Osłabienie: Energia karty jest obecna, ale działa słabiej lub jest zablokowana.\n2. Internalizacja: Zamiast działać na zewnątrz, energia zwraca się do wewnątrz — refleksja zamiast działania.\n3. Cień: Pojawia się trudniejsza strona archetypii karty — np. Mag odwrócony to manipulacja zamiast twórczości.\n4. Opóźnienie: Energia karty jest aktualna, ale wymaga czasu lub konkretnego działania, zanim się ujawni.\n\nNiezależnie od podejścia, odwrócona karta zawsze zasługuje na głębszą refleksję, nie tylko szybką etykietę "negatywna".`,
  },
  {
    title: 'Synteza kart',
    content: `Prawdziwa moc tarota objawia się nie w pojedynczych kartach, lecz w ich wzajemnych połączeniach. Kiedy masz kilka kart obok siebie, zadaj sobie pytanie:\n\n• Jaki element dominuje (ogień/buławy, woda/kielichy, powietrze/miecze, ziemia/pentakle)?\n• Ile kart Major Arcana — to sygnał dużych, karmicznych energii.\n• Czy karty opowiadają historię — napięcie, punkt zwrotny, rozwiązanie?\n• Jakie liczby się powtarzają (np. dwa 3-ki to energia wzrostu i ekspansji).\n• Czy karty "patrzą" w tym samym kierunku — może to sugerować przepływ lub konflikt energii.\n\nSynteza to najtrudniejsza i najpiękniejsza część czytania tarota. Daj sobie czas na odczucie całego obrazu, zanim zaczniesz analizować każdą kartę osobno.`,
  },
  {
    title: 'Czas w tarocie',
    content: `Tarot nie jest narzędziem do przewidywania dat — jest mapą energii, które działają teraz lub mogą działać w przyszłości. Istnieją jednak pewne tradycyjne skojarzenia:\n\n• Buławy (ogień) — szybkie energie, dni do tygodni\n• Kielichy (woda) — emocjonalne energie, tygodnie do miesięcy\n• Miecze (powietrze) — intelektualne energie, zmienność, brak stałego czasu\n• Pentakle (ziemia) — powolne, materialne energie, miesiące do lat\n• Major Arcana — poza zwykłym czasem; oznaczają ważne cykle karmiczne\n\nKiedy ktoś pyta "kiedy", odpowiedź tarota brzmi: "gdy będziesz gotowy i gdy podejmiesz właściwe działania". Czas jest elastyczny — twoje wybory kształtują jego bieg.`,
  },
  {
    title: 'Pytania, których unikać',
    content: `Tarot daje najlepsze odpowiedzi na pytania otwarte, eksploracyjne. Unikaj pytań, które:\n\n• Oczekują odpowiedzi tak/nie — tarot nie daje prostych binarnych odpowiedzi\n• Pytają za kogoś innego bez jego wiedzy i zgody — to naruszenie granic energetycznych\n• Są zadawane z pozycji lęku, nie ciekawości — np. "Czy umrę?" zamiast "Co mogę zrozumieć o swoim zdrowiu?"\n• Powtarzają to samo pytanie, bo nie podobała się poprzednia odpowiedź — karty widzą tę dynamikę\n• Są zbyt ogólne — np. "Powiedz mi o moim życiu" daje rozmytą, ogólnikową odpowiedź\n\nNajlepsze pytania zaczynają się od: "Co mogę zrozumieć...", "Jak rozwinąć...", "Co mi służy w kontekście...", "Czego nie widzę w...", "Jaka lekcja kryje się w..."`,
  },
];

type DrawnCard = { card: string; reversed: boolean };
type SpreadHistoryItem = {
  id: string;
  date: string;
  spreadName: string;
  firstCard: string;
  question: string;
};

// ── SVG SPREAD VISUALIZER ──────────────────────────────────────
const SpreadVisualizer = ({
  positions, textColor, accent,
}: {
  positions: { label: string; meaning: string }[];
  textColor: string;
  accent: string;
}) => {
  const count = positions.length;
  const CARD_W = 32;
  const CARD_H = 48;
  const cols = count <= 3 ? count : count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / cols);
  const H = rows * 70 + 20;
  const W = SW - 40;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {positions.map((pos, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cellW = W / cols;
        const cx = cellW * col + cellW / 2;
        const cy = row * 70 + 44;
        return (
          <G key={i}>
            <Rect
              x={cx - CARD_W / 2} y={cy - CARD_H / 2}
              width={CARD_W} height={CARD_H} rx={3}
              fill={accent} opacity={0.12}
              stroke={accent} strokeWidth={0.8}
            />
            <SvgText x={cx} y={cy - 4} textAnchor="middle"
              fill={accent} fontSize={10} fontWeight="600" opacity={0.9}>
              {i + 1}
            </SvgText>
            <SvgText x={cx} y={cy + 14} textAnchor="middle"
              fill={textColor} fontSize={6} opacity={0.6}>
              {pos.label.length > 9 ? pos.label.slice(0, 8) + '…' : pos.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
};

// ── Section header with accent bar ──────────────────────────────
const SectionHeader = ({ label, accent: a }: { label: string; accent: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
    <LinearGradient
      colors={[a, a + '55']}
      start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      style={{ width: 3, height: 17, borderRadius: 2 }}
    />
    <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2.5, color: a }}>{label}</Text>
  </View>
);

// ── MAIN SCREEN ────────────────────────────────────────────────
export default function TarotSpreadBuilderScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const isDark = !isLight;
  const textColor  = isLight ? '#1A1410' : '#F5F1EA';
  const subColor   = isLight ? '#6A5A48' : '#B0A393';
  const cardBg     = isLight ? 'rgba(240,228,210,0.90)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';
  const accent     = ACCENT;

  const scrollRef = useRef<ScrollView>(null);

  // Spread selection
  const [selectedSpreadId, setSelectedSpreadId] = useState('three');

  // Custom positions
  const [customPositions, setCustomPositions] = useState<{ label: string; meaning: string }[]>([
    { label: 'Karta 1', meaning: '' },
  ]);
  const [customLabelEdit, setCustomLabelEdit] = useState<Record<number, string>>({});

  // Question
  const [questionTemplate, setQuestionTemplate] = useState(0);
  const [questionSuffix, setQuestionSuffix] = useState('');
  const [freeQuestion, setFreeQuestion] = useState('');
  const [useTemplate, setUseTemplate] = useState(true);

  // Draw
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [shuffled, setShuffled] = useState(false);

  // Oracle AI
  const [oracleInput, setOracleInput] = useState('');
  const [oracleLoading, setOracleLoading] = useState(false);
  const [oracleResponse, setOracleResponse] = useState('');

  // History
  const [spreadHistory, setSpreadHistory] = useState<SpreadHistoryItem[]>([]);

  // Learning
  const [expandedLearn, setExpandedLearn] = useState<number | null>(null);

  // Spread save
  const [savedSpreads, setSavedSpreads] = useState<{ name: string; positions: { label: string; meaning: string }[] }[]>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveSpreadName, setSaveSpreadName] = useState('');

  const activePositions = useMemo(() => {
    if (selectedSpreadId === 'custom') return customPositions;
    return PRESET_POSITIONS[selectedSpreadId] ?? [];
  }, [selectedSpreadId, customPositions]);

  const fullQuestion = useMemo(() => {
    if (!useTemplate) return freeQuestion;
    const tpl = QUESTION_TEMPLATES[questionTemplate];
    return `${tpl.prefix} ${questionSuffix}`.trim();
  }, [useTemplate, questionTemplate, questionSuffix, freeQuestion]);

  const handleShuffleAndDraw = useCallback(() => {
    HapticsService.notify();
    const deck = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
    const count = activePositions.length || 1;
    const drawn: DrawnCard[] = Array.from({ length: count }, (_, i) => ({
      card: deck[i % deck.length],
      reversed: Math.random() < 0.3,
    }));
    setDrawnCards(drawn);
    setShuffled(true);
  }, [activePositions]);

  const handleInterpret = useCallback(() => {
    if (drawnCards.length === 0) return;
    const spread = PRESET_SPREADS.find(s => s.id === selectedSpreadId);
    const cardList = drawnCards.map((dc, i) => {
      const pos = activePositions[i] || { label: `Karta ${i + 1}`, meaning: '' };
      return `${pos.label}: ${dc.card}${dc.reversed ? ' (odwrócona)' : ''}`;
    }).join(', ');
    const msg = `Układ tarota: ${spread?.name || 'Własny'}.\nPytanie: ${fullQuestion || 'bez pytania'}.\nKarty: ${cardList}.\nProszę o interpretację tego układu tarota w kontekście pytania, uwzględniając pozycje i znaczenia kart.`;
    navigation.navigate('OracleChat', { initialMessage: msg });
  }, [drawnCards, activePositions, selectedSpreadId, fullQuestion, navigation]);

  const handleSaveCustomSpread = useCallback(() => {
    if (!saveSpreadName.trim()) return;
    setSavedSpreads(prev => [...prev, { name: saveSpreadName.trim(), positions: [...customPositions] }]);
    setSaveModalVisible(false);
    setSaveSpreadName('');
    HapticsService.notify();
  }, [saveSpreadName, customPositions]);

  const addCustomPosition = useCallback(() => {
    if (customPositions.length >= 12) {
      Alert.alert(t('tarotSpreadBuilder.maksimum', 'Maksimum'), t('tarotSpreadBuilder.uklad_moze_miec_maksymalni_12', 'Układ może mieć maksymalnie 12 pozycji.'));
      return;
    }
    setCustomPositions(prev => [...prev, { label: `Karta ${prev.length + 1}`, meaning: '' }]);
  }, [customPositions]);

  const removeCustomPosition = useCallback((idx: number) => {
    setCustomPositions(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const updateCustomLabel = useCallback((idx: number, val: string) => {
    setCustomPositions(prev => prev.map((p, i) => i === idx ? { ...p, label: val } : p));
  }, []);

  const handleOracleAsk = useCallback(async (chipText?: string) => {
    const question = chipText || oracleInput;
    if (!question.trim()) return;
    setOracleLoading(true);
    setOracleResponse('');
    HapticsService.notify();
    try {
      const spread = PRESET_SPREADS.find(s => s.id === selectedSpreadId);
      const cardContext = drawnCards.length > 0
        ? `Wyciągnięte karty: ${drawnCards.map((dc, i) => `${activePositions[i]?.label || i + 1}: ${dc.card}${dc.reversed ? ' (odwrócona)' : ''}`).join(', ')}.`
        : '';
      const messages = [{
        role: 'user' as const,
        content: `Jestem użytkownikiem aplikacji Aethera i pracuję z tarotem. Wybrałem układ: ${spread?.name || 'własny'}. ${cardContext} Pytanie do wyroczni: ${question}`,
      }];
      const resp = await AiService.chatWithOracle(messages);
      setOracleResponse(resp);
    } catch {
      setOracleResponse('Wyrocznia milczy w tej chwili. Spróbuj ponownie za moment.');
    } finally {
      setOracleLoading(false);
    }
  }, [oracleInput, selectedSpreadId, drawnCards, activePositions]);

  const handleAddToHistory = useCallback(() => {
    if (drawnCards.length === 0) return;
    const spread = PRESET_SPREADS.find(s => s.id === selectedSpreadId);
    const item: SpreadHistoryItem = {
      id: Date.now().toString(),
      date: formatLocaleDate(new Date()),
      spreadName: spread?.name || 'Własny',
      firstCard: drawnCards[0]?.card || '—',
      question: fullQuestion || 'Bez pytania',
    };
    setSpreadHistory(prev => [item, ...prev.slice(0, 4)]);
    HapticsService.notify();
    Alert.alert(t('tarotSpreadBuilder.zapisano', 'Zapisano'), t('tarotSpreadBuilder.uklad_dodany_do_historii', 'Układ dodany do historii.'));
  }, [drawnCards, selectedSpreadId, fullQuestion]);

  const s = useMemo(() => StyleSheet.create({
    safe: { flex: 1 },
    scroll: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: layout.padding.screen, paddingTop: 8, paddingBottom: 12,
    },
    headerTitle: { flex: 1, alignItems: 'center' },
    section: { marginHorizontal: layout.padding.screen, marginTop: 24 },
    sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2.2, color: accent, marginBottom: 12 },
    card: {
      backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder,
      borderRadius: 16, padding: 16, marginBottom: 10,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    presetChip: {
      borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8,
      marginRight: 10, borderWidth: 1,
    },
    drawnCardRow: {
      borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1,
      flexDirection: 'row', alignItems: 'flex-start',
    },
    numberBadge: {
      width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
      marginRight: 12, marginTop: 2,
    },
    oracleInput: {
      borderWidth: 1, borderRadius: 14, padding: 14, minHeight: 80,
      fontSize: 14, textAlignVertical: 'top',
    },
    chip: {
      borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
      marginRight: 8, marginBottom: 8, borderWidth: 1,
    },
    btn: {
      borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12,
    },
    btnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
    historyItem: {
      borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1,
      flexDirection: 'row', alignItems: 'center',
    },
    learnItem: {
      borderRadius: 16, borderWidth: 1, marginBottom: 10, overflow: 'hidden',
    },
    learnHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: 16,
    },
    learnBody: { paddingHorizontal: 16, paddingBottom: 16 },
    customPositionRow: {
      flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    },
    posInput: {
      flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
      paddingVertical: 8, fontSize: 13, marginRight: 8,
    },
    templateBtn: {
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
      marginRight: 8, marginBottom: 8, borderWidth: 1,
    },
    qInput: {
      borderWidth: 1, borderRadius: 14, padding: 14, minHeight: 64,
      fontSize: 14, textAlignVertical: 'top', marginTop: 10,
    },
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center', alignItems: 'center',
    },
    modalBox: {
      width: SW - 48, borderRadius: 20, padding: 24, borderWidth: 1,
    },
    modalInput: {
      borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 14, marginTop: 12, marginBottom: 16,
    },
    divider: { height: 1, marginVertical: 20, opacity: 0.12 },
  }), [cardBg, cardBorder, subColor]);

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={[s.safe, {}]} edges={['top']}>

      <TarotSpreadBg isDark={!isLight} />

      {/* HEADER */}
      <View style={s.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Oracle')} hitSlop={12}>
          <ChevronLeft size={24} color={textColor} />
        </Pressable>
        <View style={s.headerTitle}>
          <Typography variant="title" style={{ color: textColor, fontSize: 17, fontWeight: '700' }}>
            {t('tarotSpreadBuilder.budowniczy_ukladow', 'Budowniczy Układów')}
          </Typography>
          <Typography variant="caption" style={{ color: subColor, fontSize: 11, marginTop: 2 }}>
            {t('tarotSpreadBuilder.tarot_uklad_interpreta', 'TAROT • UKŁAD • INTERPRETACJA')}
          </Typography>
        </View>
        <Pressable onPress={() => { if (isFavoriteItem('tarot_spread_builder')) { removeFavoriteItem('tarot_spread_builder'); } else { addFavoriteItem({ id: 'tarot_spread_builder', label: 'Kreator Układów', route: 'TarotSpreadBuilder', params: {}, icon: 'Layers', color: accent, addedAt: new Date().toISOString() }); } }} hitSlop={12}>
          <Star size={22} color={accent} fill={isFavoriteItem?.('tarot_spread_builder') ? accent : 'none'} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={insets.top + 60}
      >
        <ScrollView ref={scrollRef} style={s.scroll} showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}>

          {/* 3D WIDGET + HERO */}
          <SpreadWidget3D accent={accent} />
          <View style={{ alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <View style={{ width: 28, height: 1, backgroundColor: accent + '44' }} />
              <Typography style={{ color: accent, fontSize: 10, fontWeight: '700', letterSpacing: 2 }}>{t('tarotSpreadBuilder.budowniczy_ukladow_1', 'BUDOWNICZY UKŁADÓW')}</Typography>
              <View style={{ width: 28, height: 1, backgroundColor: accent + '44' }} />
            </View>
            <Typography style={{ color: textColor, fontSize: 21, fontWeight: '800', textAlign: 'center', lineHeight: 28, marginBottom: 6, letterSpacing: -0.3 }}>
              {t('tarotSpreadBuilder.zaprojektu_swoj_rozklad_tarota', 'Zaprojektuj swój rozkład tarota')}
            </Typography>
            <Typography style={{ color: subColor, fontSize: 13, lineHeight: 20, textAlign: 'center' }}>
              {t('tarotSpreadBuilder.wybierz_uklad_sformuluj_pytanie_i', 'Wybierz układ, sformułuj pytanie i pozwól kartom przemówić.')}
            </Typography>
          </View>

          {/* ── WHAT IS THIS — description card ── */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={{ marginHorizontal: layout.padding.screen, marginTop: 20, marginBottom: 4 }}>
            <LinearGradient
              colors={isLight
                ? ['rgba(236,72,153,0.10)', 'rgba(236,72,153,0.04)']
                : ['rgba(236,72,153,0.14)', 'rgba(236,72,153,0.04)']}
              style={{
                borderRadius: 22, borderWidth: 1,
                borderColor: accent + (isLight ? '28' : '33'),
                padding: 20, overflow: 'hidden',
              }}
            >
              {/* Title row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: accent + '1E', alignItems: 'center', justifyContent: 'center' }}>
                  <Wand2 size={18} color={accent} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 1 }}>{t('tarotSpreadBuilder.co_to_jest', 'CO TO JEST?')}</Text>
                  <Text style={{ color: textColor, fontSize: 14, fontWeight: '700' }}>{t('tarotSpreadBuilder.narzedzie_do_budowy_odczytow', 'Narzędzie do budowy odczytów')}</Text>
                </View>
              </View>

              <Text style={{ color: subColor, fontSize: 13, lineHeight: 21, marginBottom: 18 }}>
                Układ tarota to mapa pozycji kart — każda pozycja ma swoje znaczenie (np. „Przeszłość", „Przeszkoda", „Wynik"). Budowniczy pozwala Ci wybrać gotowy układ lub stworzyć własny, dopasowany do Twojego pytania.
              </Text>

              {/* 3-step guide */}
              {[
                { n: '1', label: 'Wybierz układ', desc: 'Gotowe układy (3 karty, Krzyż Celtycki, Rok) lub zbuduj własny do 12 pozycji.', color: '#EC4899' },
                { n: '2', label: 'Sformułuj pytanie', desc: 'Konkretne pytanie skupia energię kart — im wyraźniejsze, tym głębszy odczyt.', color: '#A78BFA' },
                { n: '3', label: 'Dobierz karty i interpretuj', desc: 'Każda pozycja zostanie odsłonięta z opisem. Możesz też zapytać Oracle AI.', color: '#60A5FA' },
              ].map((step) => (
                <View key={step.n} style={{ flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: step.color + '22', borderWidth: 1, borderColor: step.color + '55', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                    <Text style={{ color: step.color, fontSize: 11, fontWeight: '800' }}>{step.n}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textColor, fontSize: 13, fontWeight: '700', marginBottom: 2 }}>{step.label}</Text>
                    <Text style={{ color: subColor, fontSize: 12, lineHeight: 18 }}>{step.desc}</Text>
                  </View>
                </View>
              ))}

              {/* Pro tip */}
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 4, paddingTop: 14, borderTopWidth: 1, borderTopColor: accent + '1A' }}>
                <Sparkles size={13} color={accent} style={{ marginTop: 2 }} />
                <Text style={{ color: accent + 'CC', fontSize: 12, lineHeight: 18, flex: 1, fontStyle: 'italic' }}>
                  {t('tarotSpreadBuilder.wskazowka_uklad_wlasny_umozliwia_ci', 'Wskazówka: Układ „Własny" umożliwia Ci nadanie każdej pozycji własnej nazwy i znaczenia — idealny do głębokiej pracy duchowej.')}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* PRESET SPREADS */}
          <View style={[s.section, { marginTop: 28 }]}>
            <SectionHeader label={t('tarotSpreadBuilder.wybierz_uklad', 'WYBIERZ UKŁAD')} accent={accent} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}>
              {PRESET_SPREADS.map(spread => {
                const active = selectedSpreadId === spread.id;
                return (
                  <Pressable key={spread.id} onPress={() => {
                    setSelectedSpreadId(spread.id);
                    setDrawnCards([]);
                    setShuffled(false);
                    HapticsService.notify();
                  }}>
                    <LinearGradient
                      colors={active
                        ? [spread.color + '36', spread.color + '1A', spread.color + '0A']
                        : [cardBg, cardBg]}
                      start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                      style={[s.presetChip, {
                        borderColor: active ? spread.color + 'AA' : cardBorder,
                        minWidth: 108,
                        paddingVertical: 14,
                        borderWidth: active ? 1.5 : 1,
                      }]}>
                      {active && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, backgroundColor: spread.color, borderTopLeftRadius: 14, borderTopRightRadius: 14 }} />}
                      <Typography style={{ fontSize: 26, textAlign: 'center', marginBottom: 6 }}>
                        {spread.icon}
                      </Typography>
                      <Typography style={{ color: active ? spread.color : textColor, fontSize: 12, fontWeight: '800', textAlign: 'center', letterSpacing: 0.2 }}>
                        {spread.name}
                      </Typography>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: active ? spread.color : subColor, opacity: 0.7 }} />
                        <Typography style={{ color: active ? spread.color : subColor, fontSize: 10, textAlign: 'center', fontWeight: '600', opacity: 0.9 }}>
                          {spread.cards === 0 ? 'do 12' : `${spread.cards} ${spread.cards === 1 ? 'karta' : 'kart'}`}
                        </Typography>
                      </View>
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </ScrollView>
            {selectedSpreadId !== 'custom' && (() => {
              const sel = PRESET_SPREADS.find(p => p.id === selectedSpreadId);
              return sel ? (
                <Animated.View entering={FadeInDown.duration(300)}>
                  <LinearGradient
                    colors={[sel.color + '20', sel.color + '08']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[s.card, { marginTop: 14, borderColor: sel.color + '44', flexDirection: 'row', alignItems: 'center', gap: 14 }]}
                  >
                    <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: sel.color + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: sel.color + '44' }}>
                      <Typography style={{ fontSize: 22 }}>{sel.icon}</Typography>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography style={{ color: sel.color, fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: 2 }}>
                        {sel.cards === 0 ? 'DO 12 KART' : `${sel.cards} ${sel.cards === 1 ? 'KARTA' : 'KART'}`}
                      </Typography>
                      <Typography style={{ color: textColor, fontSize: 14, fontWeight: '700', marginBottom: 3 }}>
                        {sel.name}
                      </Typography>
                      <Typography style={{ color: subColor, fontSize: 12, lineHeight: 18 }}>
                        {sel.purpose}
                      </Typography>
                    </View>
                  </LinearGradient>
                </Animated.View>
              ) : null;
            })()}
          </View>

          {/* CUSTOM SPREAD BUILDER */}
          {selectedSpreadId === 'custom' && (
            <Animated.View entering={FadeInDown.duration(400)} style={[s.section, { marginTop: 28 }]}>
              <SectionHeader label={t('tarotSpreadBuilder.budowniczy_wlasnego_ukladu', 'BUDOWNICZY WŁASNEGO UKŁADU')} accent={accent} />
              {customPositions.map((pos, i) => (
                <LinearGradient
                  key={i}
                  colors={[accent + '0E', accent + '05']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 12, borderWidth: 1, borderColor: accent + '28', marginBottom: 8, paddingVertical: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center' }}
                >
                  <View style={[s.numberBadge, { backgroundColor: accent + '28', borderWidth: 1, borderColor: accent + '44', marginTop: 0 }]}>
                    <Typography style={{ color: accent, fontSize: 12, fontWeight: '800' }}>{i + 1}</Typography>
                  </View>
                  <TextInput
                    style={[s.posInput, {
                      color: textColor,
                      borderColor: accent + '2A',
                      backgroundColor: isLight ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.25)',
                    }]}
                    value={pos.label}
                    onChangeText={v => updateCustomLabel(i, v)}
                    placeholder={`Nazwa pozycji ${i + 1}…`}
                    placeholderTextColor={subColor}
                  />
                  {customPositions.length > 1 && (
                    <Pressable onPress={() => removeCustomPosition(i)} hitSlop={8}>
                      <Trash2 size={18} color="#F87171" />
                    </Pressable>
                  )}
                </LinearGradient>
              ))}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <Pressable
                  onPress={addCustomPosition}
                  style={[s.chip, { borderColor: accent, backgroundColor: accent + '14' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Plus size={14} color={accent} />
                    <Typography style={{ color: accent, fontSize: 13, fontWeight: '600' }}>
                      {t('tarotSpreadBuilder.dodaj_pozycje', 'Dodaj pozycję')}
                    </Typography>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => setSaveModalVisible(true)}
                  style={[s.chip, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                  <Typography style={{ color: textColor, fontSize: 13 }}>{t('tarotSpreadBuilder.zapisz_uklad', 'Zapisz układ')}</Typography>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* SPREAD LAYOUT VISUALIZER */}
          {activePositions.length > 0 && (
            <View style={[s.section, { marginTop: 28 }]}>
              <SectionHeader label={t('tarotSpreadBuilder.wizualizac_ukladu', 'WIZUALIZACJA UKŁADU')} accent={accent} />
              <View style={[s.card, { paddingHorizontal: 8 }]}>
                <SpreadVisualizer
                  positions={activePositions}
                  textColor={textColor}
                  accent={accent}
                />
              </View>
            </View>
          )}

          {/* QUESTION FORMULATOR */}
          <View style={[s.section, { marginTop: 28 }]}>
            <SectionHeader label={t('tarotSpreadBuilder.sformuluj_pytanie', 'SFORMUŁUJ PYTANIE')} accent={accent} />
            {/* Segmented control */}
            <View style={{ flexDirection: 'row', backgroundColor: cardBg, borderRadius: 14, borderWidth: 1, borderColor: cardBorder, padding: 3, marginBottom: 12 }}>
              <Pressable onPress={() => { setUseTemplate(true); HapticsService.notify(); }} style={{ flex: 1 }}>
                <LinearGradient
                  colors={useTemplate ? [accent, accent + 'BB'] : ['transparent', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 11, paddingVertical: 9, alignItems: 'center' }}>
                  <Typography style={{ color: useTemplate ? '#fff' : subColor, fontSize: 13, fontWeight: '700', letterSpacing: 0.2 }}>
                    {t('tarotSpreadBuilder.z_szablonu', 'Z szablonu')}
                  </Typography>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={() => { setUseTemplate(false); HapticsService.notify(); }} style={{ flex: 1 }}>
                <LinearGradient
                  colors={!useTemplate ? [accent, accent + 'BB'] : ['transparent', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 11, paddingVertical: 9, alignItems: 'center' }}>
                  <Typography style={{ color: !useTemplate ? '#fff' : subColor, fontSize: 13, fontWeight: '700', letterSpacing: 0.2 }}>
                    {t('tarotSpreadBuilder.wlasne_pytanie', 'Własne pytanie')}
                  </Typography>
                </LinearGradient>
              </Pressable>
            </View>
            {useTemplate ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 22, paddingTop: 8 }}>
                  {QUESTION_TEMPLATES.map((tpl, i) => (
                    <Pressable key={i} onPress={() => setQuestionTemplate(i)}>
                      <View style={[s.chip, {
                        borderColor: questionTemplate === i ? accent : cardBorder,
                        backgroundColor: questionTemplate === i ? accent + '18' : cardBg,
                      }]}>
                        <Typography style={{ color: questionTemplate === i ? accent : subColor, fontSize: 12 }}>
                          {tpl.prefix}…
                        </Typography>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
                <TextInput
                  style={[s.qInput, { color: textColor, borderColor: cardBorder, backgroundColor: cardBg }]}
                  value={questionSuffix}
                  onChangeText={setQuestionSuffix}
                  placeholder={QUESTION_TEMPLATES[questionTemplate].placeholder}
                  placeholderTextColor={subColor}
                  multiline
                />
                {questionSuffix.trim().length > 0 && (
                  <Animated.View entering={FadeInDown.duration(250)}>
                    <View style={[s.card, { marginTop: 10, borderColor: accent + '30', backgroundColor: accent + '0A' }]}>
                      <Typography style={{ color: subColor, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 }}>
                        {t('tarotSpreadBuilder.twoje_pytanie', 'TWOJE PYTANIE')}
                      </Typography>
                      <Typography style={{ color: textColor, fontSize: 14, lineHeight: 22 }}>
                        {fullQuestion}
                      </Typography>
                    </View>
                  </Animated.View>
                )}
              </>
            ) : (
              <TextInput
                style={[s.qInput, { color: textColor, borderColor: cardBorder, backgroundColor: cardBg }]}
                value={freeQuestion}
                onChangeText={setFreeQuestion}
                placeholder={t('tarotSpreadBuilder.napisz_swoje_pytanie_do_tarota', 'Napisz swoje pytanie do tarota…')}
                placeholderTextColor={subColor}
                multiline
              />
            )}
          </View>

          {/* DRAW & INTERPRET */}
          <View style={[s.section, { marginTop: 28 }]}>
            <SectionHeader label={t('tarotSpreadBuilder.ciagnij_karty', 'CIĄGNIJ KARTY')} accent={accent} />

            {activePositions.length === 0 && selectedSpreadId === 'custom' && (
              <View style={[s.card, { borderColor: accent + '30' }]}>
                <Typography style={{ color: subColor, fontSize: 13, textAlign: 'center' }}>
                  {t('tarotSpreadBuilder.dodaj_co_najmniej_jedna_pozycje', 'Dodaj co najmniej jedną pozycję w swoim układzie powyżej.')}
                </Typography>
              </View>
            )}

            {(activePositions.length > 0 || selectedSpreadId !== 'custom') && (
              <Pressable onPress={handleShuffleAndDraw}>
                <LinearGradient
                  colors={[accent, accent + 'CC']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[s.btn, { flexDirection: 'row', gap: 10 }]}>
                  <Shuffle size={18} color="#fff" />
                  <Typography style={s.btnText}>{t('tarotSpreadBuilder.tasuj_i_ciagnij', 'Tasuj i ciągnij')}</Typography>
                </LinearGradient>
              </Pressable>
            )}

            {shuffled && drawnCards.map((dc, i) => {
              const pos = activePositions[i] || { label: `Karta ${i + 1}`, meaning: '' };
              const cardColor = dc.reversed ? '#F87171' : accent;
              return (
                <Animated.View key={i} entering={FadeInDown.delay(i * 80).duration(350)}>
                  <LinearGradient
                    colors={[cardColor + '18', cardColor + '08']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[s.drawnCardRow, { borderColor: cardColor + '40', overflow: 'hidden' }]}
                  >
                    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: cardColor + 'AA' }} />
                    <View style={[s.numberBadge, { backgroundColor: cardColor + '28', borderWidth: 1, borderColor: cardColor + '44', marginLeft: 8 }]}>
                      <Typography style={{ color: cardColor, fontSize: 12, fontWeight: '800' }}>
                        {i + 1}
                      </Typography>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography style={{ color: cardColor, fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: 3 }}>
                        {pos.label.toUpperCase()}
                      </Typography>
                      <Typography style={{ color: textColor, fontSize: 15, fontWeight: '700', marginBottom: dc.reversed ? 3 : 0 }}>
                        {dc.card}
                      </Typography>
                      {dc.reversed && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F87171' }} />
                          <Typography style={{ color: '#F87171', fontSize: 11, fontWeight: '600' }}>{t('tarotSpreadBuilder.odwrocona', 'odwrócona')}</Typography>
                        </View>
                      )}
                      {pos.meaning ? (
                        <Typography style={{ color: subColor, fontSize: 12, lineHeight: 18 }}>
                          {pos.meaning}
                        </Typography>
                      ) : null}
                    </View>
                  </LinearGradient>
                </Animated.View>
              );
            })}

            {shuffled && drawnCards.length > 0 && (
              <Animated.View entering={FadeInUp.delay(drawnCards.length * 80).duration(350)}>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  <Pressable onPress={handleInterpret} style={{ flex: 1 }}>
                    <LinearGradient
                      colors={[accent, accent + 'AA']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[s.btn, { flexDirection: 'row', gap: 8 }]}>
                      <Wand2 size={16} color="#fff" />
                      <Typography style={s.btnText}>{t('tarotSpreadBuilder.interpretu_z_wyrocznia', 'Interpretuj z Wyrocznią')}</Typography>
                    </LinearGradient>
                  </Pressable>
                  <Pressable onPress={handleAddToHistory}
                    style={[s.btn, { paddingHorizontal: 14, backgroundColor: cardBg,
                      borderWidth: 1, borderColor: cardBorder }]}>
                    <History size={18} color={subColor} />
                  </Pressable>
                </View>
              </Animated.View>
            )}
          </View>

          {/* SPREAD HISTORY */}
          <View style={[s.section, { marginTop: 28 }]}>
            <SectionHeader label={t('tarotSpreadBuilder.historia_ukladow', 'HISTORIA UKŁADÓW')} accent={accent} />
            {spreadHistory.length === 0 ? (
              <View style={[s.card, { alignItems: 'center', paddingVertical: 20 }]}>
                <History size={28} color={subColor} style={{ marginBottom: 8 }} />
                <Typography style={{ color: subColor, fontSize: 13, textAlign: 'center' }}>
                  Twoje ukończone układy pojawią się tutaj.{'\n'}Ciągnij karty i zapisz wynik.
                </Typography>
              </View>
            ) : (
              spreadHistory.map((item, i) => (
                <Animated.View key={item.id} entering={FadeInDown.delay(i * 60).duration(300)}>
                  <LinearGradient
                    colors={[accent + '12', accent + '06']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[s.historyItem, { borderColor: accent + '30' }]}
                  >
                    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: accent + '88', borderTopLeftRadius: 14, borderBottomLeftRadius: 14 }} />
                    <View style={[s.numberBadge, { backgroundColor: accent + '1A', marginLeft: 8 }]}>
                      <BookOpen size={14} color={accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <Typography style={{ color: textColor, fontSize: 13, fontWeight: '700' }}>
                          {item.spreadName}
                        </Typography>
                        <View style={{ backgroundColor: accent + '18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Typography style={{ color: accent, fontSize: 10, fontWeight: '600' }}>{item.date}</Typography>
                        </View>
                      </View>
                      <Typography style={{ color: accent + 'CC', fontSize: 12, fontWeight: '500' }} numberOfLines={1}>
                        ✦ {item.firstCard}
                      </Typography>
                      {item.question !== 'Bez pytania' && (
                        <Typography style={{ color: subColor, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                          {item.question}
                        </Typography>
                      )}
                    </View>
                  </LinearGradient>
                </Animated.View>
              ))
            )}
          </View>

          {/* LEARNING LIBRARY */}
          <View style={[s.section, { marginTop: 28 }]}>
            <SectionHeader label={t('tarotSpreadBuilder.biblioteka_wiedzy', 'BIBLIOTEKA WIEDZY')} accent={accent} />
            {LEARNING_SECTIONS.map((sec, i) => (
              <View key={i} style={[s.learnItem, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <Pressable style={s.learnHeader} onPress={() => {
                  setExpandedLearn(expandedLearn === i ? null : i);
                  HapticsService.notify();
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                    <Library size={16} color={accent} />
                    <Typography style={{ color: textColor, fontSize: 14, fontWeight: '600', flex: 1 }}>
                      {sec.title}
                    </Typography>
                  </View>
                  {expandedLearn === i
                    ? <ChevronUp size={16} color={subColor} />
                    : <ChevronDown size={16} color={subColor} />
                  }
                </Pressable>
                {expandedLearn === i && (
                  <Animated.View entering={FadeInDown.duration(280)} style={s.learnBody}>
                    <View style={{ height: 1, backgroundColor: cardBorder, marginBottom: 14 }} />
                    <Typography style={{ color: subColor, fontSize: 13, lineHeight: 22 }}>
                      {sec.content}
                    </Typography>
                  </Animated.View>
                )}
              </View>
            ))}
          </View>

          {/* ORACLE AI */}
          <View style={[s.section, { marginTop: 28 }]}>
            <SectionHeader label={t('tarotSpreadBuilder.wyrocznia_ukladow', 'WYROCZNIA UKŁADÓW')} accent={accent} />
            <LinearGradient
              colors={isLight ? ['#FDF4DC', '#FAF0E0'] : [accent + '1A', accent + '08']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[s.card, { borderColor: accent + '35', padding: 0, overflow: 'hidden' }]}
            >
              <LinearGradient
                colors={[accent + '28', accent + '14']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: accent + '22' }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: accent + '28', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: accent + '55' }}>
                  <Wand2 size={16} color={accent} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography style={{ color: accent, fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: 2 }}>{t('tarotSpreadBuilder.ai_wyrocznia', 'AI WYROCZNIA')}</Typography>
                  <Typography style={{ color: textColor, fontSize: 14, fontWeight: '700' }}>
                    {t('tarotSpreadBuilder.zapytaj_wyrocznie_o_uklad', 'Zapytaj wyrocznię o układ')}
                  </Typography>
                </View>
              </LinearGradient>
              <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                {ORACLE_CHIPS.map((chip, i) => (
                  <Pressable key={i} onPress={() => handleOracleAsk(chip)}
                    style={[s.chip, { borderColor: accent + '40', backgroundColor: accent + '10' }]}>
                    <Typography style={{ color: accent, fontSize: 12 }}>{chip}</Typography>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={[s.oracleInput, { color: textColor, borderColor: cardBorder, backgroundColor: cardBg }]}
                value={oracleInput}
                onChangeText={setOracleInput}
                placeholder={t('tarotSpreadBuilder.zadaj_pytanie_dotyczace_ukladu_inte', 'Zadaj pytanie dotyczące układu, interpretacji lub kart…')}
                placeholderTextColor={subColor}
                multiline
              />
              <Pressable onPress={() => handleOracleAsk()} disabled={oracleLoading || !oracleInput.trim()}>
                <LinearGradient
                  colors={oracleLoading || !oracleInput.trim() ? (isLight ? ['#C0B8AF', '#ABA39A'] : ['#888', '#666']) : [accent, accent + 'AA']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[s.btn, { flexDirection: 'row', gap: 10 }]}>
                  <Sparkles size={16} color="#fff" />
                  <Typography style={s.btnText}>
                    {oracleLoading ? 'Wyrocznia mówi…' : 'Zapytaj wyrocznię'}
                  </Typography>
                </LinearGradient>
              </Pressable>
              {oracleResponse.length > 0 && (
                <Animated.View entering={FadeInDown.duration(400)}>
                  <View style={{ marginTop: 14 }}>
                    <View style={{ height: 1, backgroundColor: cardBorder, marginBottom: 14 }} />
                    <Typography style={{ color: accent, fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: 8 }}>
                      {t('tarotSpreadBuilder.odpowiedz_wyroczni', 'ODPOWIEDŹ WYROCZNI')}
                    </Typography>
                    <Typography style={{ color: textColor, fontSize: 14, lineHeight: 24 }}>
                      {oracleResponse}
                    </Typography>
                  </View>
                </Animated.View>
              )}
              </View>
            </LinearGradient>
          </View>

          <EndOfContentSpacer />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* SAVE SPREAD MODAL */}
      <Modal visible={saveModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { backgroundColor: currentTheme.background, borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Typography style={{ color: textColor, fontSize: 16, fontWeight: '700' }}>
                {t('tarotSpreadBuilder.zapisz_uklad_1', 'Zapisz układ')}
              </Typography>
              <Pressable onPress={() => setSaveModalVisible(false)} hitSlop={10}>
                <X size={20} color={subColor} />
              </Pressable>
            </View>
            <Typography style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 4 }}>
              {t('tarotSpreadBuilder.nadaj_swojemu_ukladowi_unikalna_naz', 'Nadaj swojemu układowi unikalną nazwę, aby łatwo go znaleźć w przyszłości.')}
            </Typography>
            <TextInput
              style={[s.modalInput, { color: textColor, borderColor: cardBorder, backgroundColor: cardBg }]}
              value={saveSpreadName}
              onChangeText={setSaveSpreadName}
              placeholder={t('tarotSpreadBuilder.nazwa_ukladu', 'Nazwa układu…')}
              placeholderTextColor={subColor}
              autoFocus
            />
            <Pressable onPress={handleSaveCustomSpread} disabled={!saveSpreadName.trim()}>
              <LinearGradient
                colors={saveSpreadName.trim() ? [accent, accent + 'BB'] : (isLight ? ['#C0B8AF', '#ABA39A'] : ['#888', '#666'])}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[s.btn, { marginTop: 0 }]}>
                <Typography style={s.btnText}>{t('tarotSpreadBuilder.zapisz_uklad_2', 'Zapisz układ')}</Typography>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
        </SafeAreaView>
</View>
  );
}
