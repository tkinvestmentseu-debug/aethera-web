// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeInDown,
  FadeInUp,
  Easing,
} from 'react-native-reanimated';
import {
  ChevronLeft,
  Star,
  Sparkles,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Hash,
  Moon,
  Zap,
  Globe2,
  ArrowRight,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SW } = Dimensions.get('window');
const ACCENT_GOLD = '#F59E0B';
const ACCENT_SILVER = '#94A3B8';
const BG_GRADIENT = ['#0A0A1E', '#0D1533', '#091228'];

// ─── Personal Year Data ───────────────────────────────────────────────────────

const YEAR_THEMES: Record<number, { theme: string; desc: string; energy: string }> = {
  1: { theme: 'Nowe początki', desc: 'Rok siania ziaren i odważnych starć z nieznanym.', energy: 'Pionierska' },
  2: { theme: 'Współpraca', desc: 'Rok budowania mostów, cierpliwości i dyplomacji.', energy: 'Receptywna' },
  3: { theme: 'Ekspresja', desc: 'Rok twórczości, komunikacji i radości z życia.', energy: 'Twórcza' },
  4: { theme: 'Stabilność', desc: 'Rok budowania solidnych fundamentów i dyscypliny.', energy: 'Budująca' },
  5: { theme: 'Wolność', desc: 'Rok zmian, przygód i wychodzenia poza granice.', energy: 'Dynamiczna' },
  6: { theme: 'Miłość i rodzina', desc: 'Rok harmonii, odpowiedzialności i służby bliskim.', energy: 'Pielęgnująca' },
  7: { theme: 'Duchowość', desc: 'Rok introspekcji, wiedzy i głębokiej refleksji.', energy: 'Analityczna' },
  8: { theme: 'Obfitość', desc: 'Rok manifestacji, władzy i materialnych osiągnięć.', energy: 'Manifestacyjna' },
  9: { theme: 'Zakończenia', desc: 'Rok domknięcia cykli, transformacji i przebaczenia.', energy: 'Transformacyjna' },
  11: { theme: 'Intuicja mistrzowska', desc: 'Rok nadrzędnej intuicji, inspiracji i duchowego przesłania.', energy: 'Iluminacyjna' },
  22: { theme: 'Mistrz budowniczy', desc: 'Rok tworzenia trwałych dzieł na wielką skalę.', energy: 'Architektoniczna' },
};

const LUCKY_ELEMENTS: Record<number, { kolor: string; kamien: string; liczba: string; kierunek: string; dzien: string }> = {
  1:  { kolor: 'Czerwony',   kamien: 'Rubin',        liczba: '1', kierunek: 'Wschód',   dzien: 'Niedziela'   },
  2:  { kolor: 'Srebrny',    kamien: 'Perła',         liczba: '2', kierunek: 'Zachód',   dzien: 'Poniedziałek' },
  3:  { kolor: 'Złoty',      kamien: 'Cytryn',        liczba: '3', kierunek: 'Południe', dzien: 'Środa'       },
  4:  { kolor: 'Zielony',    kamien: 'Szmaragd',      liczba: '4', kierunek: 'Północ',   dzien: 'Sobota'      },
  5:  { kolor: 'Turkusowy',  kamien: 'Akwamaryn',     liczba: '5', kierunek: 'Centrum',  dzien: 'Środa'       },
  6:  { kolor: 'Różowy',     kamien: 'Róż. Kwarc',    liczba: '6', kierunek: 'Zachód',   dzien: 'Piątek'      },
  7:  { kolor: 'Fioletowy',  kamien: 'Ametyst',       liczba: '7', kierunek: 'Północ',   dzien: 'Poniedziałek' },
  8:  { kolor: 'Czarny',     kamien: 'Obsydian',      liczba: '8', kierunek: 'Wschód',   dzien: 'Sobota'      },
  9:  { kolor: 'Biały',      kamien: 'Kryształ',      liczba: '9', kierunek: 'Południe', dzien: 'Wtorek'      },
  11: { kolor: 'Srebrny',    kamien: 'Selenite',      liczba: '11', kierunek: 'Zachód',  dzien: 'Poniedziałek' },
  22: { kolor: 'Złoty',      kamien: 'Złoty Kwarc',   liczba: '22', kierunek: 'Wschód',  dzien: 'Sobota'      },
};

const QUARTERS = [
  { id: 'q1', label: 'Q1', season: 'Wiosna', months: 'Sty – Mar', icon: '🌱', themeText: 'Czas siewu intencji', action: 'Ustal trzy priorytety roku. Medytuj o nowym początku.' },
  { id: 'q2', label: 'Q2', season: 'Lato',   months: 'Kwi – Cze', icon: '☀️', themeText: 'Ekspansja i rozkwit',  action: 'Działaj odważnie. Realizuj plan z Q1 z pełną energią.' },
  { id: 'q3', label: 'Q3', season: 'Jesień', months: 'Lip – Wrz', icon: '🍂', themeText: 'Zbieranie owoców',      action: 'Weryfikuj postępy. Świętuj małe sukcesy i kalibruj kurs.' },
  { id: 'q4', label: 'Q4', season: 'Zima',   months: 'Paź – Gru', icon: '❄️', themeText: 'Refleksja i zamknięcie', action: 'Zamknij cykl z wdzięcznością. Przygotuj pole pod nowy rok.' },
];

const PLANET_BY_SIGN: Record<string, { planets: string[]; interpretations: string[] }> = {
  aries:       { planets: ['Mars', 'Słońce', 'Jowisz'],   interpretations: ['Twój rządzący Mars napędza odwagę i inicjatywę.', 'Słońce wzmacnia twoją tożsamość i liderstwo.', 'Jowisz przynosi szczęście w nowych przedsięwzięciach.'] },
  taurus:      { planets: ['Wenus', 'Saturn', 'Merkury'], interpretations: ['Wenus sprzyja miłości i materialnym darom.', 'Saturn buduje trwałe wartości i cierpliwość.', 'Merkury otwiera nowe kanały komunikacji.'] },
  gemini:      { planets: ['Merkury', 'Wenus', 'Mars'],   interpretations: ['Merkury wyostrza umysł i zdolność uczenia się.', 'Wenus przyciąga harmonijne relacje.', 'Mars pobudza do decyzji i działania.'] },
  cancer:      { planets: ['Księżyc', 'Neptun', 'Wenus'], interpretations: ['Księżyc pogłębia emocjonalną inteligencję.', 'Neptun otwiera wrota intuicji.', 'Wenus sprzyja bliskości i domowemu szczęściu.'] },
  leo:         { planets: ['Słońce', 'Jowisz', 'Mars'],   interpretations: ['Słońce wzmacnia twoją aurę i charyzmat.', 'Jowisz rozszerza możliwości twórczej ekspresji.', 'Mars daje energię i determinację.'] },
  virgo:       { planets: ['Merkury', 'Saturn', 'Wenus'], interpretations: ['Merkury pogłębia analizę i precyzję działania.', 'Saturn nagradza rzetelność i porządek.', 'Wenus wnosi łagodność w relacje zawodowe.'] },
  libra:       { planets: ['Wenus', 'Jowisz', 'Saturn'],  interpretations: ['Wenus sprzyja partnerstwu i estetyce.', 'Jowisz wnosi równowagę i optymizm.', 'Saturn uczy odpowiedzialnych decyzji.'] },
  scorpio:     { planets: ['Pluton', 'Mars', 'Neptun'],   interpretations: ['Pluton przyspiesza głęboką transformację.', 'Mars daje odwagę do wejścia w cień.', 'Neptun otwiera mistyczne warstwy percepcji.'] },
  sagittarius: { planets: ['Jowisz', 'Mars', 'Słońce'],   interpretations: ['Jowisz poszerza horyzonty i szczęście.', 'Mars fuji entuzjazm i dynamikę poszukiwań.', 'Słońce oświetla twoją duchową ścieżkę.'] },
  capricorn:   { planets: ['Saturn', 'Mars', 'Merkury'],  interpretations: ['Saturn nagradza wytrwałość i ambicje.', 'Mars daje cel i wolę działania.', 'Merkury optymalizuje strategię i planowanie.'] },
  aquarius:    { planets: ['Uran', 'Saturn', 'Jowisz'],   interpretations: ['Uran przynosi przełomy i nieoczekiwane zmiany.', 'Saturn utrzymuje spójność innowacji.', 'Jowisz wspiera wiz­jonerskie projekty.'] },
  pisces:      { planets: ['Neptun', 'Jowisz', 'Księżyc'],interpretations: ['Neptun głębi wrażliwość i wyobraźnię.', 'Jowisz rozszerza duchową mądrość.', 'Księżyc spaja emocje z intuicją.'] },
};

const MONTH_NAMES_PL = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcPersonalYear(birthDate: string): number {
  if (!birthDate) return 1;
  // Parse DD.MM.YYYY or YYYY-MM-DD
  let day = 0, month = 0;
  if (birthDate.includes('-')) {
    const parts = birthDate.split('-');
    day = parseInt(parts[2], 10);
    month = parseInt(parts[1], 10);
  } else if (birthDate.includes('.')) {
    const parts = birthDate.split('.');
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  }
  if (!day || !month) return 1;

  const year = new Date().getFullYear();
  const digits = `${day}${month}${year}`.split('').map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);

  // Check master numbers before reducing
  while (sum > 9 && sum !== 11 && sum !== 22) {
    sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0);
  }
  return sum || 1;
}

function getMonthEnergy(personalYear: number, monthIndex: number): number {
  // Returns 0-100, derived deterministically
  const base = ((personalYear * 7 + monthIndex * 13) % 60) + 30;
  return Math.min(100, base);
}

function getEnergyColor(energy: number): string {
  if (energy >= 70) return ACCENT_GOLD;
  if (energy >= 45) return '#34D399';
  return '#60A5FA';
}

function getEnergyLabel(energy: number): string {
  if (energy >= 70) return 'Wysoka';
  if (energy >= 45) return 'Średnia';
  return 'Niska';
}

function normalizeSign(sign: string): string {
  const map: Record<string, string> = {
    baran: 'aries', byk: 'taurus', bliźnięta: 'gemini', bliznięta: 'gemini', rak: 'cancer',
    lew: 'leo', panna: 'virgo', waga: 'libra', skorpion: 'scorpio',
    strzelec: 'sagittarius', koziorożec: 'capricorn', wodnik: 'aquarius', ryby: 'pisces',
  };
  const lc = (sign || '').toLowerCase().trim();
  return map[lc] || lc;
}

// ─── Background ───────────────────────────────────────────────────────────────

const AnnualBg = () => {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 40000, easing: Easing.linear }), -1, false);
  }, []);
  const rotStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, rotStyle]}>
        <Svg width={SW} height={SW} style={{ position: 'absolute', top: 60, left: (SW - SW) / 2 }} opacity={0.10}>
          <Defs>
            <RadialGradient id="rg" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={ACCENT_GOLD} stopOpacity={0.6} />
              <Stop offset="100%" stopColor={ACCENT_GOLD} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <G>
            {[100, 140, 180].map((r, i) => (
              <Circle key={i} cx={SW / 2} cy={SW / 2} r={r} stroke={ACCENT_GOLD} strokeWidth={0.6} fill="none" strokeDasharray={i === 1 ? '3 9' : '1 5'} />
            ))}
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * 30) * Math.PI / 180;
              return <Line key={'l' + i} x1={SW / 2 + Math.cos(a) * 100} y1={SW / 2 + Math.sin(a) * 100} x2={SW / 2 + Math.cos(a) * 180} y2={SW / 2 + Math.sin(a) * 180} stroke={ACCENT_GOLD} strokeWidth={0.4} opacity={0.5} />;
            })}
          </G>
        </Svg>
      </Animated.View>
      {/* Stars */}
      <Svg width={SW} height={700} style={StyleSheet.absoluteFill} opacity={0.25}>
        {Array.from({ length: 24 }, (_, i) => (
          <Circle key={'s' + i} cx={(i * 131 + 17) % SW} cy={(i * 97 + 30) % 680} r={i % 7 === 0 ? 1.4 : 0.7} fill="#FFFFFF" />
        ))}
      </Svg>
    </View>
  );
};

// ─── Personal Year Badge ──────────────────────────────────────────────────────

const PersonalYearBadge = ({ year }: { year: number }) => {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.06, { duration: 2000 }), withTiming(0.97, { duration: 2000 })), -1, false);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Animated.View style={pulseStyle}>
      <View style={styles.badgeOuter}>
        <LinearGradient colors={['rgba(245,158,11,0.18)', 'rgba(245,158,11,0.06)']} style={styles.badgeGradient} />
        <Text style={styles.badgeNumber}>{year}</Text>
      </View>
    </Animated.View>
  );
};

// ─── Quarter Accordion Card ───────────────────────────────────────────────────

const QuarterCard = ({ q, personalYear, isLight }: { q: typeof QUARTERS[0]; personalYear: number; isLight: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const textColor = isLight ? '#1A1028' : '#F0ECF8';
  const subColor = isLight ? '#4A3A68' : 'rgba(255,255,255,0.60)';
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const border = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(245,158,11,0.20)';

  const toggle = () => {
    HapticsService.impact('medium');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(v => !v);
  };

  return (
    <Pressable onPress={toggle} style={[styles.quarterCard, { backgroundColor: cardBg, borderColor: border }]}>
      <LinearGradient
        colors={expanded ? ['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.03)'] : ['transparent', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <View style={styles.quarterHeader}>
        <View style={styles.quarterLeft}>
          <Text style={styles.quarterSeason}>{q.icon} {q.season}</Text>
          <Text style={[styles.quarterMonths, { color: subColor }]}>{q.months}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.quarterLabel, { color: ACCENT_GOLD }]}>{q.label}</Text>
          {expanded ? <ChevronUp size={16} color={ACCENT_GOLD} /> : <ChevronDown size={16} color={ACCENT_GOLD} />}
        </View>
      </View>
      {expanded && (
        <View style={styles.quarterBody}>
          <Text style={[styles.quarterTheme, { color: textColor }]}>{q.themeText}</Text>
          <Text style={[styles.quarterAction, { color: subColor }]}>{q.action}</Text>
        </View>
      )}
    </Pressable>
  );
};

// ─── Monthly Energy Bar ───────────────────────────────────────────────────────

const MonthCard = ({ month, index, personalYear, isLight }: { month: string; index: number; personalYear: number; isLight: boolean }) => {
  const energy = getMonthEnergy(personalYear, index);
  const color = getEnergyColor(energy);
  const label = getEnergyLabel(energy);
  const cardBg = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
  const textColor = isLight ? '#1A1028' : '#F0ECF8';
  const subColor = isLight ? '#5A4A78' : 'rgba(255,255,255,0.50)';

  return (
    <View style={[styles.monthCard, { backgroundColor: cardBg }]}>
      <Text style={[styles.monthName, { color: textColor }]}>{month}</Text>
      <View style={styles.monthBarBg}>
        <View style={[styles.monthBarFill, { width: `${energy}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.monthLabel, { color: subColor }]}>{label}</Text>
    </View>
  );
};

// ─── Lucky Element Chip ───────────────────────────────────────────────────────

const LuckyChip = ({ label, value, isLight }: { label: string; value: string; isLight: boolean }) => {
  const bg = isLight ? 'rgba(245,158,11,0.10)' : 'rgba(245,158,11,0.12)';
  const border = isLight ? 'rgba(245,158,11,0.30)' : 'rgba(245,158,11,0.30)';
  const textColor = isLight ? '#92400E' : ACCENT_GOLD;
  const subColor = isLight ? '#78350F' : 'rgba(245,158,11,0.70)';

  return (
    <View style={[styles.luckyChip, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.luckyLabel, { color: subColor }]}>{label}</Text>
      <Text style={[styles.luckyValue, { color: textColor }]}>{value}</Text>
    </View>
  );
};

// ─── AI Result Section ────────────────────────────────────────────────────────

function parseAiSections(text: string): Array<{ title: string; body: string; color: string }> {
  const COLORS = [ACCENT_GOLD, '#818CF8', '#34D399', '#F472B6', '#60A5FA'];
  const lines = text.split('\n').filter(l => l.trim());
  const sections: Array<{ title: string; body: string; color: string }> = [];
  let current: { title: string; body: string[]; color: string } | null = null;

  lines.forEach((line, idx) => {
    const isHeader = /^[A-ZŁŚĆŹŻĄĘÓŃ][A-ZŁŚĆŹŻĄĘÓŃ\s]+:/.test(line.trim()) || line.startsWith('##') || line.startsWith('**');
    if (isHeader) {
      if (current) sections.push({ title: current.title, body: current.body.join('\n'), color: current.color });
      const title = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/:$/, '').trim();
      current = { title, body: [], color: COLORS[sections.length % COLORS.length] };
    } else if (current) {
      current.body.push(line.trim());
    } else {
      current = { title: 'Wizja Roku', body: [line.trim()], color: COLORS[0] };
    }
  });
  if (current) sections.push({ title: current.title, body: current.body.join('\n'), color: current.color });
  return sections.slice(0, 6);
}

// ─── CO DALEJ Cards ───────────────────────────────────────────────────────────

const CO_DALEJ = [
  { title: 'Numerologia', desc: 'Odkryj swój kod liczbowy', route: 'Numerology', Icon: Hash, color: '#818CF8' },
  { title: 'Kalendarz Księżyca', desc: 'Synchro­nizuj z fazami księżyca', route: 'LunarCalendar', Icon: Moon, color: '#60A5FA' },
  { title: 'Rytuały', desc: 'Rytuał zgodny z energią roku', route: 'Rituals', Icon: Sparkles, color: ACCENT_GOLD },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const AnnualForecastScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { themeName, userData, addFavoriteItem, isFavoriteItem, removeFavoriteItem } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');

  const personalYear = calcPersonalYear(userData?.birthDate || '');
  const yearInfo = YEAR_THEMES[personalYear] || YEAR_THEMES[1];
  const lucky = LUCKY_ELEMENTS[personalYear] || LUCKY_ELEMENTS[1];
  const normalizedSign = normalizeSign(userData?.zodiacSign || '');
  const planets = PLANET_BY_SIGN[normalizedSign] || PLANET_BY_SIGN['aries'];

  const starred = isFavoriteItem('annual-forecast');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<Array<{ title: string; body: string; color: string }>>([]);

  const textColor = isLight ? '#1A1028' : '#F0ECF8';
  const subColor = isLight ? '#4A3A68' : 'rgba(255,255,255,0.60)';
  const cardBg = isLight ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.08)';
  const currentYear = new Date().getFullYear();

  // ── Star handler ──
  const handleStar = useCallback(() => {
    HapticsService.impact('medium');
    if (isFavoriteItem('annual-forecast')) {
      removeFavoriteItem('annual-forecast');
    } else {
      addFavoriteItem({
        id: 'annual-forecast',
        label: 'Roczna Wizja',
        sublabel: `Rok ${currentYear} · Liczba ${personalYear}`,
        route: 'AnnualForecast',
        icon: 'CalendarDays',
        color: '#6366F1',
        addedAt: Date.now(),
      });
    }
  }, [addFavoriteItem, removeFavoriteItem, isFavoriteItem, personalYear, currentYear]);

  // ── AI forecast ──
  const handleGenerate = useCallback(async () => {
    if (loading) return;
    HapticsService.impact('medium');
    setLoading(true);
    try {
      const name = userData?.name || 'Użytkownik';
      const sign = userData?.zodiacSign || 'nieznany';
      const birth = userData?.birthDate || 'nieznana';

      const messages = [
        {
          role: 'user' as const,
          content: `Stwórz spersonalizowaną roczną prognozę astro-numerologiczną dla osoby o imieniu ${name}, znaku zodiaku ${sign}, dacie urodzenia ${birth}, Roku Osobistym ${personalYear} (${yearInfo.theme}) dla roku ${currentYear}.

Odpowiedz w języku użytkownika w następujących sekcjach (każda z nagłówkiem zakończonym ':'):

DOMINUJĄCY TEMAT ROKU:
(2-3 zdania o głównym przesłaniu roku)

TRZY GŁÓWNE WYZWANIA:
(lista 3 wyzwań, każde 1 zdanie)

TRZY SZANSE:
(lista 3 szans i możliwości, każde 1 zdanie)

SZCZĘŚLIWE MIESIĄCE:
(wymień 3 miesiące z krótkim wyjaśnieniem)

ZALECANA PRAKTYKA DUCHOWA:
(jedna konkretna praktyka dopasowana do energii roku)

Odpowiedź powinna być zwięzła, mistyczna i inspirująca.`,
        },
      ];

      const response = await AiService.chatWithOracle(messages);
      const parsed = parseAiSections(response);
      setAiResult(parsed);
    } catch (err) {
      console.warn('[AnnualForecast] AI error:', err);
      setAiResult([{ title: 'Wizja Roku', body: 'Nie udało się wygenerować prognozy. Spróbuj ponownie.', color: ACCENT_SILVER }]);
    } finally {
      setLoading(false);
    }
  }, [loading, userData, personalYear, yearInfo, currentYear]);

  return (
    <View style={{ flex: 1, backgroundColor: isLight ? currentTheme.background : '#0A0A1E' }}>
      {!isLight && <AnnualBg />}
      {isLight && <LinearGradient colors={['#F8F4FF', '#EFF4FF', '#F4F8FF']} style={StyleSheet.absoluteFill} />}

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={styles.headerBtn} hitSlop={12}>
            <ChevronLeft size={22} color={isLight ? '#1A1028' : '#F0ECF8'} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerEyebrow, { color: isLight ? '#6366F1' : ACCENT_GOLD }]}>ROCZNA WIZJA</Text>
            <Text style={[styles.headerTitle, { color: textColor }]}>{currentYear}</Text>
          </View>
          <Pressable onPress={handleStar} style={styles.headerBtn} hitSlop={12}>
            <Star size={20} color={ACCENT_GOLD} fill={starred ? ACCENT_GOLD : 'none'} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Personal Year Badge */}
          <Animated.View entering={FadeInDown.delay(60).duration(500)} style={styles.badgeSection}>
            <PersonalYearBadge year={personalYear} />
            <View style={{ alignItems: 'center', marginTop: 16, gap: 4 }}>
              <Text style={[styles.yearThemeTitle, { color: textColor }]}>{yearInfo.theme}</Text>
              <Text style={[styles.yearThemeDesc, { color: subColor }]}>{yearInfo.desc}</Text>
              <View style={[styles.energyTag, { borderColor: isLight ? 'rgba(99,102,241,0.30)' : 'rgba(245,158,11,0.30)' }]}>
                <Text style={[styles.energyTagText, { color: isLight ? '#6366F1' : ACCENT_GOLD }]}>ENERGIA: {yearInfo.energy.toUpperCase()}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Lucky Elements */}
          <Animated.View entering={FadeInDown.delay(140).duration(500)}>
            <Text style={[styles.sectionLabel, { color: isLight ? '#6366F1' : ACCENT_GOLD }]}>SZCZĘŚLIWE ELEMENTY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.luckyRow}>
              <LuckyChip label="Kolor" value={lucky.kolor} isLight={isLight} />
              <LuckyChip label="Kamień" value={lucky.kamien} isLight={isLight} />
              <LuckyChip label="Liczba" value={lucky.liczba} isLight={isLight} />
              <LuckyChip label="Kierunek" value={lucky.kierunek} isLight={isLight} />
              <LuckyChip label="Dzień" value={lucky.dzien} isLight={isLight} />
            </ScrollView>
          </Animated.View>

          {/* Quarterly Forecast */}
          <Animated.View entering={FadeInDown.delay(220).duration(500)}>
            <Text style={[styles.sectionLabel, { color: isLight ? '#6366F1' : ACCENT_GOLD }]}>KWARTALNE PROGNOZY</Text>
            <View style={{ gap: 10 }}>
              {QUARTERS.map((q, i) => (
                <QuarterCard key={q.id} q={q} personalYear={personalYear} isLight={isLight} />
              ))}
            </View>
          </Animated.View>

          {/* Monthly Energy Timeline */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Text style={[styles.sectionLabel, { color: isLight ? '#6366F1' : ACCENT_GOLD }]}>ENERGIA MIESIĘCZNA</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthRow}>
              {MONTH_NAMES_PL.map((m, i) => (
                <MonthCard key={m} month={m} index={i} personalYear={personalYear} isLight={isLight} />
              ))}
            </ScrollView>
          </Animated.View>

          {/* Planetary Influence */}
          <Animated.View entering={FadeInDown.delay(380).duration(500)}>
            <Text style={[styles.sectionLabel, { color: isLight ? '#6366F1' : ACCENT_GOLD }]}>PLANETY ROKU</Text>
            <View style={{ gap: 10 }}>
              {planets.planets.map((planet, i) => (
                <View key={planet} style={[styles.planetCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <LinearGradient
                    colors={['rgba(245,158,11,0.08)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                  />
                  <View style={[styles.planetBadge, { backgroundColor: isLight ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.18)' }]}>
                    <Text style={[styles.planetBadgeText, { color: ACCENT_GOLD }]}>{planet[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planetName, { color: textColor }]}>{planet}</Text>
                    <Text style={[styles.planetDesc, { color: subColor }]}>{planets.interpretations[i]}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* AI Forecast Generation */}
          <Animated.View entering={FadeInDown.delay(460).duration(500)}>
            <Text style={[styles.sectionLabel, { color: isLight ? '#6366F1' : ACCENT_GOLD }]}>PEŁNA ROCZNA WIZJA AI</Text>

            {aiResult.length === 0 && (
              <Pressable
                onPress={handleGenerate}
                disabled={loading}
                style={({ pressed }) => [styles.generateBtn, pressed && { opacity: 0.75 }]}
              >
                <LinearGradient colors={['rgba(245,158,11,0.22)', 'rgba(245,158,11,0.10)']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <View style={{ borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)', borderRadius: 16, ...StyleSheet.absoluteFillObject }} />
                {loading ? (
                  <ActivityIndicator color={ACCENT_GOLD} size="small" />
                ) : (
                  <>
                    <Sparkles size={20} color={ACCENT_GOLD} />
                    <Text style={styles.generateBtnText}>Generuj Roczną Wizję</Text>
                  </>
                )}
              </Pressable>
            )}

            {aiResult.length > 0 && (
              <View style={{ gap: 12 }}>
                {aiResult.map((section, i) => (
                  <Animated.View key={section.title} entering={FadeInDown.delay(i * 80).duration(400)}>
                    <View style={[styles.aiCard, { backgroundColor: cardBg, borderColor: cardBorder, borderLeftColor: section.color, borderLeftWidth: 3 }]}>
                      <Text style={[styles.aiCardTitle, { color: section.color }]}>{section.title}</Text>
                      <Text style={[styles.aiCardBody, { color: subColor }]}>{section.body}</Text>
                    </View>
                  </Animated.View>
                ))}
                <Pressable
                  onPress={handleGenerate}
                  disabled={loading}
                  style={({ pressed }) => [styles.regenerateBtn, pressed && { opacity: 0.75 }]}
                >
                  {loading ? <ActivityIndicator color={ACCENT_SILVER} size="small" /> : (
                    <Text style={[styles.regenerateBtnText, { color: subColor }]}>↺ Wygeneruj ponownie</Text>
                  )}
                </Pressable>
              </View>
            )}
          </Animated.View>

          {/* CO DALEJ */}
          <Animated.View entering={FadeInDown.delay(540).duration(500)}>
            <Text style={[styles.sectionLabel, { color: isLight ? '#6366F1' : ACCENT_GOLD }]}>CO DALEJ?</Text>
            <View style={{ gap: 10 }}>
              {CO_DALEJ.map(({ title, desc, route, Icon, color }) => (
                <Pressable
                  key={route}
                  onPress={() => { HapticsService.impact('medium'); navigation.navigate(route); }}
                  style={({ pressed }) => [styles.codalejCard, { backgroundColor: cardBg, borderColor: cardBorder, opacity: pressed ? 0.78 : 1 }]}
                >
                  <LinearGradient colors={[`${color}14`, 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  <View style={[styles.codalejIcon, { backgroundColor: `${color}22` }]}>
                    <Icon size={18} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.codalejTitle, { color: textColor }]}>{title}</Text>
                    <Text style={[styles.codalejDesc, { color: subColor }]}>{desc}</Text>
                  </View>
                  <ArrowRight size={16} color={isLight ? 'rgba(0,0,0,0.30)' : 'rgba(255,255,255,0.30)'} />
                </Pressable>
              ))}
            </View>
          </Animated.View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
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
    paddingVertical: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  scroll: {
    paddingHorizontal: layout.padding.screen,
    paddingTop: 8,
    gap: 28,
  },
  // Badge
  badgeSection: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  badgeOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: ACCENT_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: ACCENT_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.50,
    shadowRadius: 18,
    elevation: 12,
  },
  badgeGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
  },
  badgeNumber: {
    fontSize: 52,
    fontWeight: '800',
    color: ACCENT_GOLD,
    lineHeight: 58,
  },
  yearThemeTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  yearThemeDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: SW * 0.75,
    marginTop: 2,
  },
  energyTag: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 10,
  },
  energyTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  // Section labels
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginBottom: 12,
  },
  // Lucky chips
  luckyRow: {
    paddingRight: 8,
    gap: 8,
  },
  luckyChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 72,
  },
  luckyLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  luckyValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Quarters
  quarterCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 14,
  },
  quarterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quarterLeft: {
    gap: 2,
  },
  quarterSeason: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F0ECF8',
  },
  quarterMonths: {
    fontSize: 12,
  },
  quarterLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  quarterBody: {
    marginTop: 12,
    gap: 6,
  },
  quarterTheme: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  quarterAction: {
    fontSize: 13,
    lineHeight: 19,
  },
  // Months
  monthRow: {
    paddingRight: 8,
    gap: 8,
  },
  monthCard: {
    width: 64,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 6,
  },
  monthName: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  monthBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  monthBarFill: {
    height: 4,
    borderRadius: 2,
  },
  monthLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  // Planets
  planetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
  },
  planetBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planetBadgeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  planetName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  planetDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  // AI
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 58,
  },
  generateBtnText: {
    color: ACCENT_GOLD,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  aiCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
  },
  aiCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  aiCardBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  regenerateBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  regenerateBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // CO DALEJ
  codalejCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
  },
  codalejIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codalejTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  codalejDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
});
