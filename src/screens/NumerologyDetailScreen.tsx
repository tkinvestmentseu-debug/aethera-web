// @ts-nocheck
import React, { useState, useCallback, useRef } from 'react';
import Animated, {
  FadeInDown, FadeInUp, ZoomIn,
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Infinity as InfinityIcon, Sparkles, Hash, Sun, Calendar,
  TrendingUp, Star, Heart, Eye, Zap, BarChart3,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');

const GOLD = '#CEAE72';
const GOLD2 = '#E8C97A';
const DEEP_BG = ['#030209', '#07040F', '#0A0616'] as const;

// ─── Numerology calculation helpers ──────────────────────────────────────────

function reduceToSingleOrMaster(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce((s, d) => s + parseInt(d, 10), 0);
  }
  return n;
}

function calcLifePath(dateStr: string): number {
  // dateStr: DD.MM.YYYY
  const parts = dateStr.split('.');
  if (parts.length !== 3) return 0;
  const [dd, mm, yyyy] = parts.map(Number);
  if (!dd || !mm || !yyyy) return 0;
  const sum = String(dd).split('').reduce((s, d) => s + parseInt(d, 10), 0)
    + String(mm).split('').reduce((s, d) => s + parseInt(d, 10), 0)
    + String(yyyy).split('').reduce((s, d) => s + parseInt(d, 10), 0);
  return reduceToSingleOrMaster(sum);
}

const LETTER_VALUES: Record<string, number> = {
  a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,
  j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,
  s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8,
  ą:1,ć:3,ę:5,ł:3,ń:5,ó:6,ś:1,ź:8,ż:8,
};
const VOWELS = new Set(['a','e','i','o','u','y','ą','ę','ó']);

function nameToNumbers(name: string): number[] {
  return name.toLowerCase().replace(/\s/g,'').split('').map(c => LETTER_VALUES[c] ?? 0).filter(Boolean);
}

function calcExpression(name: string): number {
  const nums = nameToNumbers(name);
  if (!nums.length) return 0;
  return reduceToSingleOrMaster(nums.reduce((s,n) => s+n, 0));
}

function calcSoulUrge(name: string): number {
  const vowelNums = name.toLowerCase().replace(/\s/g,'').split('')
    .filter(c => VOWELS.has(c))
    .map(c => LETTER_VALUES[c] ?? 0).filter(Boolean);
  if (!vowelNums.length) return 0;
  return reduceToSingleOrMaster(vowelNums.reduce((s,n) => s+n, 0));
}

function calcPersonalYear(dateStr: string, year: number): number {
  const parts = dateStr.split('.');
  if (parts.length !== 3) return 0;
  const dd = Number(parts[0]);
  const mm = Number(parts[1]);
  const sum = String(dd).split('').reduce((s, d) => s + parseInt(d, 10), 0)
    + String(mm).split('').reduce((s, d) => s + parseInt(d, 10), 0)
    + String(year).split('').reduce((s, d) => s + parseInt(d, 10), 0);
  return reduceToSingleOrMaster(sum);
}

function calcPersonalMonth(personalYear: number, month: number): number {
  return reduceToSingleOrMaster(personalYear + month);
}

function calcPersonalDay(personalMonth: number, day: number): number {
  return reduceToSingleOrMaster(personalMonth + day);
}

// ─── Number meanings data ─────────────────────────────────────────────────────

interface NumberMeaning {
  title: string;
  keywords: string;
  meaning: string;
  traits: string[];
  compatible: string[];
  famous: string;
  color: string[];
}

const NUMBER_MEANINGS: Record<number, NumberMeaning> = {
  1: {
    title: 'Przywódca', keywords: 'Inicjatywa · Siła · Niezależność',
    meaning: 'Jesteś pionierem i innowatorem. Twoja energia to energia początku — tworzysz nowe ścieżki tam, gdzie inni widzą tylko mur. Masz naturalne predyspozycje do przywództwa i silną wolę, by realizować swoje marzenia.',
    traits: ['Determinacja','Kreatywność','Odwaga','Ambicja','Niezależność'],
    compatible: ['1','3','5'],
    famous: 'Steve Jobs, Lady Gaga, Martin Luther King',
    color: ['#EF4444','#DC2626'],
  },
  2: {
    title: 'Mediator', keywords: 'Harmonia · Współpraca · Intuicja',
    meaning: 'Twoja moc leży w zdolności do łączenia ludzi i budowania mostów tam, gdzie inni budują mury. Doskonale czujesz potrzeby innych i masz rzadki dar dyplomacji. Twoja intuicja jest niezwykłym kompasem w relacjach.',
    traits: ['Wrażliwość','Empatia','Dyplomacja','Cierpliwość','Lojalność'],
    compatible: ['2','4','6','8'],
    famous: 'Barack Obama, Jennifer Aniston, Tony Blair',
    color: ['#6366F1','#8B5CF6'],
  },
  3: {
    title: 'Twórca', keywords: 'Ekspresja · Radość · Kreatywność',
    meaning: 'Masz dar wyrażania siebie w sposób, który inspiruje i podnosi innych na duchu. Twoja twórczość jest naturalnym przepływem duszy. Życie z trójką to życie w trybie artysty — pełne koloru, wyrazu i autentycznej radości.',
    traits: ['Kreatywność','Optymizm','Ekspresja','Charyzma','Entuzjazm'],
    compatible: ['1','3','5','9'],
    famous: 'David Bowie, Cate Blanchett, Snoop Dogg',
    color: ['#F59E0B','#D97706'],
  },
  4: {
    title: 'Budowniczy', keywords: 'Porządek · Stabilność · Praca',
    meaning: 'Twoja siła to solidne fundamenty. Budujesz nie na piasku, lecz na skale. Masz niezwykłą zdolność do organizacji, planowania i konsekwentnej pracy nad celami długoterminowymi. Jesteś filarem, na którym opierają się inni.',
    traits: ['Pracowitość','Rzetelność','Organizacja','Wytrwałość','Odpowiedzialność'],
    compatible: ['2','4','6','8'],
    famous: 'Bill Gates, Oprah Winfrey, Keanu Reeves',
    color: ['#10B981','#059669'],
  },
  5: {
    title: 'Podróżnik', keywords: 'Wolność · Zmiana · Przygoda',
    meaning: 'Twoje serce bije rytmem wolności i odkryć. Piątka to energia zmiany, adaptacji i nieustannego ruchu. Masz magnetyczną osobowość i naturalną ciekawość świata, która przyciąga do ciebie niezwykłych ludzi i sytuacje.',
    traits: ['Przygoda','Adaptacja','Wolność','Charyzma','Ciekawość'],
    compatible: ['1','3','5','7'],
    famous: 'Mick Jagger, Angelina Jolie, Abraham Lincoln',
    color: ['#F97316','#EA580C'],
  },
  6: {
    title: 'Opiekun', keywords: 'Miłość · Obowiązek · Harmonia',
    meaning: 'Twoja dusza pragnie troszczyć się o innych i tworzyć piękne, harmonijne środowiska. Szóstka to energia bezwarunkowej miłości i głębokiej odpowiedzialności za bliskich. Masz naturalny talent do uzdrawiania i wspierania.',
    traits: ['Opiekuńczość','Lojalność','Odpowiedzialność','Harmonia','Współczucie'],
    compatible: ['2','4','6','9'],
    famous: 'John Lennon, Michael Jackson, Diana Spencer',
    color: ['#EC4899','#DB2777'],
  },
  7: {
    title: 'Mistyk', keywords: 'Mądrość · Analiza · Duchowość',
    meaning: 'Jesteś poszukiwaczem głębszej prawdy. Twój umysł nie zadowala się powierzchownością — pragniesz rozumieć mechanizmy ukryte za zasłoną rzeczywistości. Siódemka to energia duchowego poznania i mistycznej mądrości.',
    traits: ['Intuicja','Analiza','Duchowość','Mądrość','Introspekcja'],
    compatible: ['3','5','7'],
    famous: 'Albert Einstein, Stephen Hawking, Nikola Tesla',
    color: ['#7C3AED','#6D28D9'],
  },
  8: {
    title: 'Władca', keywords: 'Moc · Sukces · Abundancja',
    meaning: 'Ósemka to liczba nieskończonej obfitości — symbol leżący poziomo. Masz naturalne predyspozycje do zarządzania zasobami i budowania materialnego sukcesu. Twoja siła manifestacji jest wyjątkowa gdy działasz z integralności.',
    traits: ['Ambicja','Siła','Realizm','Przywództwo','Determinacja'],
    compatible: ['2','4','6','8'],
    famous: 'Pablo Picasso, Richard Branson, Matt Damon',
    color: ['#D97706','#B45309'],
  },
  9: {
    title: 'Humanista', keywords: 'Miłość · Mądrość · Służba',
    meaning: 'Dziewiątka to najwyższa liczba cyklu — energia zakończenia i powszechnej miłości. Masz szerokie serce i wizję wykraczającą poza jednostkowe ego. Jesteś tu, by służyć i inspirować całą ludzkość swoją mądrością.',
    traits: ['Altruizm','Mądrość','Wizjonerstwo','Empatia','Inspiracja'],
    compatible: ['3','6','9'],
    famous: 'Mahatma Gandhi, Mother Teresa, Yoko Ono',
    color: ['#059669','#047857'],
  },
  11: {
    title: 'Oświecony', keywords: 'Intuicja · Wizja · Inspiracja',
    meaning: 'Jedenastka to liczba mistrzowska — mostek między światem materialnym a duchowym. Masz rzadki dar bezpośredniego dostępu do wyższej świadomości. Jesteś kanałem inspiracji dla innych, gdy ufasz swojej głębokiej intuicji.',
    traits: ['Intuicja','Inspiracja','Duchowość','Wrażliwość','Wizjonerstwo'],
    compatible: ['2','11','22'],
    famous: 'Michelle Obama, Edgar Allan Poe, Nikola Tesla',
    color: ['#8B5CF6','#7C3AED'],
  },
  22: {
    title: 'Mistrz Budowniczy', keywords: 'Wizja · Manifestacja · Dziedzictwo',
    meaning: 'Dwudziesta druga to potężna liczba mistrzowska — zdolność do manifestowania wielkich wizji w rzeczywistości materialnej. Masz potencjał do tworzenia dzieł, które przetrwają pokolenia i zmienią bieg historii.',
    traits: ['Manifestacja','Wizja','Przywództwo','Dyscyplina','Mądrość'],
    compatible: ['4','8','22'],
    famous: 'Dalai Lama, Guru Nanak, Paul McCartney',
    color: ['#CEAE72','#B8966A'],
  },
  33: {
    title: 'Mistrz Nauczyciel', keywords: 'Miłość · Mądrość · Uzdrawianie',
    meaning: 'Trzydziesta trzecia to najwyższa liczba mistrzowska — czysta energie bezwarunkowej miłości i duchowego nauczania. Twoje powołanie to uzdrawianie i podnoszenie świadomości zbiorowej. Ta ścieżka wymaga pełnego poświęcenia.',
    traits: ['Uzdrawianie','Nauczanie','Miłość','Mądrość','Poświęcenie'],
    compatible: ['6','11','33'],
    famous: 'Francis of Assisi, Stephen King, John Lennon',
    color: ['#F472B6','#EC4899'],
  },
};

const DEFAULT_MEANING: NumberMeaning = {
  title: 'Tajemnica', keywords: 'Głębia · Potencjał · Transformacja',
  meaning: 'Ta liczba kryje w sobie unikalne, głęboko osobiste przesłanie. Jej moc objawia się stopniowo, gdy jesteś gotów przyjąć jej lekcję.',
  traits: ['Głębia','Transformacja','Potencjał'],
  compatible: [],
  famous: '',
  color: [GOLD, '#B8966A'],
};

function getMeaning(n: number): NumberMeaning {
  return NUMBER_MEANINGS[n] ?? DEFAULT_MEANING;
}

// ─── Number Card Component ────────────────────────────────────────────────────

const NumberCard = ({ num, title, subtitle, meaning, entering, delay = 0, isLight }: {
  num: number; title: string; subtitle: string; meaning: NumberMeaning;
  entering?: any; delay?: number; isLight?: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';

  return (
    <Animated.View entering={(entering ?? FadeInDown).delay(delay)} style={[styles.card, isLight && { borderColor: 'rgba(139,100,42,0.22)', backgroundColor: 'rgba(255,255,255,0.92)' }]}>
      <LinearGradient
        colors={isLight ? ['rgba(255,255,255,0.95)', 'rgba(255,248,235,0.90)'] as const : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'] as const}
        style={styles.cardGradient}
      >
        <Pressable onPress={() => setExpanded(e => !e)} style={styles.cardHeader}>
          <LinearGradient colors={meaning.color as any} style={styles.numBadge}>
            <Text style={styles.numBadgeText}>{num}</Text>
          </LinearGradient>
          <View style={styles.cardHeaderText}>
            <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
            <Text style={[styles.cardSubtitle, { color: subColor }]}>{subtitle}</Text>
            <Text style={styles.cardKeywords}>{meaning.title} · {meaning.keywords}</Text>
          </View>
          <Text style={[styles.expandIcon, { color: GOLD }]}>{expanded ? '▲' : '▼'}</Text>
        </Pressable>

        {expanded && (
          <Animated.View entering={FadeInDown.duration(250)} style={styles.cardBody}>
            <View style={[styles.divider, isLight && { backgroundColor: 'rgba(0,0,0,0.10)' }]} />
            <Text style={[styles.meaningText, { color: textColor }]}>{meaning.meaning}</Text>

            <Text style={styles.sectionLabel}>CECHY</Text>
            <View style={styles.traitsRow}>
              {meaning.traits.map(t => (
                <View key={t} style={[styles.trait, isLight && { backgroundColor: 'rgba(0,0,0,0.06)', borderColor: 'rgba(139,100,42,0.20)' }]}>
                  <Text style={[styles.traitText, { color: subColor }]}>{t}</Text>
                </View>
              ))}
            </View>

            {meaning.compatible.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>ZGODNOŚĆ</Text>
                <View style={styles.traitsRow}>
                  {meaning.compatible.map(c => (
                    <LinearGradient key={c} colors={[GOLD + '33', GOLD + '11']} style={styles.compatBadge}>
                      <Text style={styles.compatText}>{c}</Text>
                    </LinearGradient>
                  ))}
                </View>
              </>
            )}

            {meaning.famous ? (
              <>
                <Text style={styles.sectionLabel}>PRZYKŁADY</Text>
                <Text style={[styles.famousText, { color: subColor }]}>{meaning.famous}</Text>
              </>
            ) : null}
          </Animated.View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

// ─── Cycle Card (personal year/month/day) ───────────────────────────────────

const CycleCard = ({ label, num, icon: Icon, color, delay = 0, isLight }: {
  label: string; num: number; icon: any; color: string; delay?: number; isLight?: boolean;
}) => {
  const meaning = getMeaning(num);
  const cycleSubColor = isLight ? 'rgba(37,29,22,0.45)' : 'rgba(255,255,255,0.45)';
  const cycleTitleColor = isLight ? 'rgba(37,29,22,0.6)' : 'rgba(255,255,255,0.60)';
  return (
    <Animated.View entering={ZoomIn.delay(delay)} style={[styles.cycleCard, isLight && { borderColor: 'rgba(139,100,42,0.18)' }]}>
      <LinearGradient colors={[color + '22', color + '08']} style={styles.cycleCardInner}>
        <Icon color={color} size={18} strokeWidth={1.8} />
        <Text style={[styles.cycleNum, { color }]}>{num || '—'}</Text>
        <Text style={[styles.cycleLabel, { color: cycleSubColor }]}>{label}</Text>
        <Text style={[styles.cycleTitle, { color: cycleTitleColor }]}>{num ? meaning.title : '...'}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const NumerologyDetailScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';

  // ─ Input state ─
  const [birthInput, setBirthInput] = useState(() => {
    // Pre-fill from profile if available
    const bd = userData?.birthDate ?? '';
    if (!bd) return '';
    // bd might be ISO or DD.MM.YYYY
    if (bd.includes('T') || bd.includes('-')) {
      const d = new Date(bd);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2,'0');
        const mm = String(d.getMonth()+1).padStart(2,'0');
        const yyyy = d.getFullYear();
        return `${dd}.${mm}.${yyyy}`;
      }
    }
    return bd;
  });
  const [nameInput, setNameInput] = useState(() =>
    [userData?.name, userData?.lastName].filter(Boolean).join(' ').trim()
  );

  // ─ Results state ─
  const [results, setResults] = useState<{
    lifePath: number; expression: number; soulUrge: number;
    personalYear: number; personalMonth: number; personalDay: number;
  } | null>(null);

  // ─ AI reading ─
  const [aiReading, setAiReading] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // ─ Pulsing gold glow on header ─
  const glow = useSharedValue(0.5);
  React.useEffect(() => {
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 2500 }), withTiming(0.4, { duration: 2500 })),
      -1, false,
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * (isLight ? 0.07 : 0.22) }));

  // ─ Auto-format date input DD.MM.YYYY ─
  const handleDateChange = useCallback((text: string) => {
    let cleaned = text.replace(/[^\d.]/g, '');
    // auto-insert dots
    if (cleaned.length === 2 && birthInput.length === 1) cleaned += '.';
    if (cleaned.length === 5 && birthInput.length === 4) cleaned += '.';
    if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
    setBirthInput(cleaned);
  }, [birthInput]);

  // ─ Calculate ─
  const handleCalculate = useCallback(() => {
    HapticsService.impact('medium');
    const bd = birthInput.trim();
    if (!bd || bd.length < 8) return;

    const now = new Date();
    const lp = calcLifePath(bd);
    if (!lp) return;

    const expr = calcExpression(nameInput);
    const soul = calcSoulUrge(nameInput);
    const py = calcPersonalYear(bd, now.getFullYear());
    const pm = calcPersonalMonth(py, now.getMonth() + 1);
    const today = now.getDate();
    const pd = calcPersonalDay(pm, today);

    setResults({ lifePath: lp, expression: expr, soulUrge: soul, personalYear: py, personalMonth: pm, personalDay: pd });
    setAiReading('');
  }, [birthInput, nameInput]);

  // ─ AI Reading ─
  const handleAiReading = useCallback(async () => {
    if (!results) return;
    HapticsService.notify();
    setAiLoading(true);
    try {
      const prompt = `Jesteś mistrzem numerologii. Użytkownik ma:
- Liczbę Życiowej Drogi: ${results.lifePath}
- Liczbę Wyrazu: ${results.expression}
- Liczbę Duszy: ${results.soulUrge}
- Rok Osobisty: ${results.personalYear}
- Miesiąc Osobisty: ${results.personalMonth}
- Dzień Osobisty: ${results.personalDay}
${nameInput ? `- Imię: ${nameInput}` : ''}
${birthInput ? `- Data urodzenia: ${birthInput}` : ''}

Napisz głęboki, spersonalizowany odczyt numerologiczny (ok. 200 słów).
Zacznij od najważniejszego spostrzeżenia. Połącz wszystkie liczby w jedną narrację.
Wskaż konkretne energię aktywne w tym momencie (rok/miesiąc/dzień osobisty).
Bądź bezpośredni, ciepły, duchowy — nie ogólnikowy.`;

      const messages = [{ role: 'user' as const, content: prompt }];
      const reply = await AiService.chatWithOracle(messages);
      setAiReading(reply || 'Nie udało się wygenerować odczytu.');
    } catch {
      setAiReading('Nie udało się połączyć z Oracle. Spróbuj ponownie.');
    } finally {
      setAiLoading(false);
    }
  }, [results, nameInput, birthInput]);

  const bgColors = isLight
    ? (['#FAF6EE', '#F2E8D8', '#EDE0CA'] as const)
    : (DEEP_BG as any);

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView edges={['top']} style={{ flex: 1 }}>

      <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} />

      {/* ── Subtle background glow ── */}
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle, { pointerEvents: 'none' }]}>
        <LinearGradient
          colors={['transparent', GOLD + '44', 'transparent']}
          style={{ position: 'absolute', top: '20%', left: '10%', right: '10%', height: '40%', borderRadius: 300 }}
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0}
      >
        {/* ── Header ── */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={styles.backBtn} hitSlop={20}>
            <ChevronLeft color={GOLD} size={26} strokeWidth={2} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.headerIconRow}>
              <InfinityIcon color={GOLD} size={20} strokeWidth={1.8} />
              <Text style={styles.headerLabel}>NUMEROLOGIA</Text>
              <InfinityIcon color={GOLD} size={20} strokeWidth={1.8} />
            </View>
            <Text style={[styles.headerTitle, { color: textColor }]}>Sprawdź swoją liczbę</Text>
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >

          {/* ── Input Card ── */}
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.inputCard}>
            <LinearGradient
              colors={['rgba(206,174,114,0.12)', 'rgba(206,174,114,0.04)']}
              style={styles.inputCardGradient}
            >
              <Text style={[styles.inputLabel, { color: GOLD }]}>DATA URODZENIA</Text>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: GOLD + '44', backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)' }]}
                placeholder="DD.MM.YYYY"
                placeholderTextColor={isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'}
                value={birthInput}
                onChangeText={handleDateChange}
                keyboardType="numeric"
                maxLength={10}
                returnKeyType="next"
              />
              <Text style={[styles.inputLabel, { color: GOLD, marginTop: 14 }]}>IMIĘ I NAZWISKO <Text style={styles.optionalTag}>(opcjonalne)</Text></Text>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: GOLD + '44', backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)' }]}
                placeholder="Twoje imię i nazwisko"
                placeholderTextColor={isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'}
                value={nameInput}
                onChangeText={setNameInput}
                autoCapitalize="words"
                returnKeyType="done"
              />

              <Pressable
                onPress={handleCalculate}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1, marginTop: 20 }]}
              >
                <LinearGradient
                  colors={[GOLD, GOLD2, GOLD]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.calcBtn}
                >
                  <Hash color="#1A1200" size={18} strokeWidth={2.5} />
                  <Text style={styles.calcBtnText}>OBLICZ LICZBY</Text>
                  <Sparkles color="#1A1200" size={16} strokeWidth={2} />
                </LinearGradient>
              </Pressable>
            </LinearGradient>
          </Animated.View>

          {/* ── Results ── */}
          {results && (
            <>
              {/* Life Path — biggest card */}
              <Animated.View entering={FadeInUp.delay(60).duration(400)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 4 }}>
                <Text style={[styles.sectionTitle, { color: GOLD }]}>LICZBA ŻYCIOWEJ DROGI</Text>
              </Animated.View>
              <View style={{ paddingHorizontal: layout.padding.screen }}>
                <NumberCard
                  num={results.lifePath}
                  title={`Droga Życia: ${results.lifePath}`}
                  subtitle="Twoja główna wibracja i misja"
                  meaning={getMeaning(results.lifePath)}
                  entering={FadeInDown}
                  delay={80}
                  isLight={isLight}
                />
              </View>

              {/* Expression & Soul */}
              {nameInput.trim().length > 0 && (
                <>
                  <Animated.View entering={FadeInUp.delay(120).duration(400)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 16 }}>
                    <Text style={[styles.sectionTitle, { color: GOLD }]}>LICZBY IMIENIA</Text>
                  </Animated.View>
                  <View style={{ paddingHorizontal: layout.padding.screen }}>
                    {results.expression > 0 && (
                      <NumberCard
                        num={results.expression}
                        title={`Liczba Wyrazu: ${results.expression}`}
                        subtitle="Jak wyrażasz się wobec świata"
                        meaning={getMeaning(results.expression)}
                        entering={FadeInDown}
                        delay={140}
                        isLight={isLight}
                      />
                    )}
                    {results.soulUrge > 0 && (
                      <NumberCard
                        num={results.soulUrge}
                        title={`Liczba Duszy: ${results.soulUrge}`}
                        subtitle="Głębsza potrzeba i pragnienie serca"
                        meaning={getMeaning(results.soulUrge)}
                        entering={FadeInDown}
                        delay={180}
                        isLight={isLight}
                      />
                    )}
                  </View>
                </>
              )}

              {/* Personal cycles */}
              <Animated.View entering={FadeInUp.delay(200).duration(400)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 16 }}>
                <Text style={[styles.sectionTitle, { color: GOLD }]}>CYKLE OSOBISTE</Text>
              </Animated.View>
              <View style={styles.cyclesRow}>
                <CycleCard label="Rok" num={results.personalYear} icon={Sun} color="#F59E0B" delay={220} isLight={isLight} />
                <CycleCard label="Miesiąc" num={results.personalMonth} icon={Calendar} color="#8B5CF6" delay={260} isLight={isLight} />
                <CycleCard label="Dzień" num={results.personalDay} icon={Star} color="#06B6D4" delay={300} isLight={isLight} />
              </View>

              {/* AI Oracle reading */}
              <Animated.View entering={FadeInUp.delay(320).duration(400)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 20 }}>
                <Text style={[styles.sectionTitle, { color: GOLD }]}>ODCZYT ORACLE</Text>
                <Pressable
                  onPress={handleAiReading}
                  disabled={aiLoading}
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1, marginTop: 8 }]}
                >
                  <LinearGradient
                    colors={['rgba(206,174,114,0.18)', 'rgba(206,174,114,0.06)']}
                    style={styles.oracleBtn}
                  >
                    {aiLoading ? (
                      <ActivityIndicator color={GOLD} size="small" />
                    ) : (
                      <Sparkles color={GOLD} size={18} strokeWidth={1.8} />
                    )}
                    <Text style={styles.oracleBtnText}>
                      {aiLoading ? 'Oracle czyta twoje liczby...' : aiReading ? 'Odśwież odczyt Oracle' : 'Wygeneruj odczyt Oracle'}
                    </Text>
                  </LinearGradient>
                </Pressable>

                {aiReading ? (
                  <Animated.View entering={FadeInDown.duration(400)} style={styles.aiCard}>
                    <LinearGradient
                      colors={['rgba(206,174,114,0.10)', 'rgba(206,174,114,0.03)']}
                      style={styles.aiCardInner}
                    >
                      <View style={styles.aiHeader}>
                        <InfinityIcon color={GOLD} size={16} strokeWidth={1.8} />
                        <Text style={[styles.aiLabel, { color: GOLD }]}>ORACLE NUMEROLOGICZNY</Text>
                      </View>
                      <Text style={[styles.aiText, { color: textColor }]}>{aiReading}</Text>
                    </LinearGradient>
                  </Animated.View>
                ) : null}
              </Animated.View>
            </>
          )}

          {/* ── Empty state hint ── */}
          {!results && (
            <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.hintBox}>
              <LinearGradient
                colors={['rgba(206,174,114,0.08)', 'rgba(206,174,114,0.02)']}
                style={styles.hintInner}
              >
                <InfinityIcon color={GOLD + '88'} size={32} strokeWidth={1.2} />
                <Text style={[styles.hintTitle, { color: GOLD }]}>Jak to działa?</Text>
                <Text style={[styles.hintText, { color: subColor }]}>
                  Wprowadź datę urodzenia w formacie DD.MM.YYYY.{'\n'}
                  Opcjonalnie dodaj imię i nazwisko, aby obliczyć Liczbę Wyrazu i Duszy.{'\n\n'}
                  Każda z twoich liczb to unikalny kod wibracyjny — mapa twojej duszy i aktualnych energii.
                </Text>
                <View style={styles.hintTiles}>
                  {[
                    { icon: TrendingUp, label: 'Droga Życia', sub: 'Twoja misja' },
                    { icon: Eye, label: 'Wyraz', sub: 'Jak wyglądasz' },
                    { icon: Heart, label: 'Dusza', sub: 'Co pragniesz' },
                    { icon: Zap, label: 'Cykl roku', sub: 'Aktualna energia' },
                    { icon: BarChart3, label: 'Cykl dnia', sub: 'Dzisiejsza wibracja' },
                  ].map(({ icon: Icon, label, sub }) => (
                    <View key={label} style={styles.hintTile}>
                      <Icon color={GOLD} size={16} strokeWidth={1.8} />
                      <Text style={[styles.hintTileLabel, { color: textColor }]}>{label}</Text>
                      <Text style={[styles.hintTileSub, { color: subColor }]}>{sub}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </KeyboardAvoidingView>
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
  backBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(206,174,114,0.10)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '700',
    color: GOLD,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 4,
  },

  // Input card
  inputCard: {
    marginHorizontal: layout.padding.screen,
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GOLD + '28',
  },
  inputCardGradient: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  optionalTag: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '400',
    opacity: 0.6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    gap: 10,
  },
  calcBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#1A1200',
  },

  // Number card
  card: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardGradient: {
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  numBadge: {
    width: 52, height: 52,
    borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  numBadgeText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F0EBE2',
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  cardKeywords: {
    fontSize: 11,
    color: GOLD,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  expandIcon: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 14,
  },
  meaningText: {
    fontSize: 13.5,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.82)',
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '700',
    color: GOLD,
    marginBottom: 8,
  },
  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 14,
  },
  trait: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  traitText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.80)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  compatBadge: {
    width: 38, height: 38,
    borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: GOLD + '44',
  },
  compatText: {
    fontSize: 14,
    fontWeight: '800',
    color: GOLD,
  },
  famousText: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.62)',
    fontStyle: 'italic',
    lineHeight: 19,
  },

  // Section title
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '800',
    marginBottom: 10,
  },

  // Cycles row
  cyclesRow: {
    flexDirection: 'row',
    paddingHorizontal: layout.padding.screen,
    gap: 10,
    marginTop: 4,
  },
  cycleCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cycleCardInner: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 5,
  },
  cycleNum: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  cycleLabel: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
  },
  cycleTitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.60)',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Oracle / AI
  oracleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: GOLD + '33',
    marginBottom: 12,
  },
  oracleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.4,
  },
  aiCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GOLD + '28',
  },
  aiCardInner: {
    padding: 18,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiLabel: {
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '800',
  },
  aiText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0.2,
  },

  // Hint box
  hintBox: {
    marginHorizontal: layout.padding.screen,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GOLD + '22',
  },
  hintInner: {
    padding: 24,
    alignItems: 'center',
  },
  hintTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 13.5,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },
  hintTiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    width: '100%',
  },
  hintTile: {
    alignItems: 'center',
    width: (SW - layout.padding.screen * 2 - 48 - 10 * 4) / 3,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(206,174,114,0.08)',
    borderWidth: 1,
    borderColor: GOLD + '22',
    gap: 4,
  },
  hintTileLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  hintTileSub: {
    fontSize: 9.5,
    textAlign: 'center',
    lineHeight: 13,
  },
});
