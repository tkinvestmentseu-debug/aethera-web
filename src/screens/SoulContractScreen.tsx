// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, View, Dimensions, Text,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Ellipse, Line, Polygon } from 'react-native-svg';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, withSpring, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Sparkles, ArrowRight,
  Heart, Eye, Flame, BookOpen, Shield, Activity,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#E879F9';

// ─────────────────────────────────────────────────────────────────
// NUMEROLOGY UTILITIES
// ─────────────────────────────────────────────────────────────────
const digitSum = (n: number): number => {
  let s = 0;
  String(Math.abs(n)).split('').forEach((c) => { s += parseInt(c, 10); });
  return s;
};

const reduceToSingle = (n: number): number => {
  if (n === 11 || n === 22) return n;
  while (n > 9) {
    n = digitSum(n);
    if (n === 11 || n === 22) return n;
  }
  return n;
};

const parseBirthDate = (birthDate: string | undefined) => {
  if (!birthDate) return null;
  // Try YYYY-MM-DD and DD.MM.YYYY
  let day: number, month: number, year: number;
  if (birthDate.includes('-')) {
    const parts = birthDate.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else if (birthDate.includes('.')) {
    const parts = birthDate.split('.');
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  } else {
    return null;
  }
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return { day, month, year };
};

const calcLifePath = (day: number, month: number, year: number): number => {
  const total = digitSum(day) + digitSum(month) + digitSum(year);
  return reduceToSingle(total);
};

// Destiny = full birth date all digits summed together
const calcDestinyNumber = (day: number, month: number, year: number): number => {
  const total = digitSum(day) + digitSum(month) + digitSum(year);
  return reduceToSingle(total);
};

// Soul Urge = sum of vowel letter values in name
const LETTER_VALS: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
  J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8,
};
const NAME_VOWELS = new Set(['A','E','I','O','U','Y']);

const calcSoulUrge = (name: string): number => {
  const up = (name || '').toUpperCase().replace(/[^A-Z]/g, '');
  const sum = up.split('').filter(c => NAME_VOWELS.has(c)).reduce((s, c) => s + (LETTER_VALS[c] || 0), 0);
  return sum === 0 ? 1 : reduceToSingle(sum);
};

// Expression = sum of all letter values in name
const calcExpressionNumber = (name: string): number => {
  const up = (name || '').toUpperCase().replace(/[^A-Z]/g, '');
  const sum = up.split('').reduce((s, c) => s + (LETTER_VALS[c] || 0), 0);
  return sum === 0 ? 1 : reduceToSingle(sum);
};

const calcKarmicDebt = (day: number, month: number): number | null => {
  const raw = day + month;
  if ([13, 14, 16, 19].includes(raw)) return raw;
  return null;
};

const calcPersonalYear = (day: number, month: number): number => {
  const currentYear = new Date().getFullYear();
  return reduceToSingle(day + month + digitSum(currentYear));
};

const getMissingNumbers = (day: number, month: number, year: number): number[] => {
  const digits = new Set(
    `${day}${month}${year}`.split('').map(Number).filter((d) => d !== 0)
  );
  const missing: number[] = [];
  for (let i = 1; i <= 9; i++) {
    if (!digits.has(i)) missing.push(i);
  }
  return missing;
};

// ─────────────────────────────────────────────────────────────────
// DATA MAPS
// ─────────────────────────────────────────────────────────────────
const LIFE_PATH_DATA: Record<number, {
  name: string; element: string; color: string; crystal: string;
  shadow: string; gift: string; theme: string; desc: string;
}> = {
  1: {
    name: 'Pionier', element: 'Ogień', color: '#FF6B6B', crystal: 'Rubin',
    shadow: 'Arogancja i izolacja', gift: 'Przywództwo i odwaga', theme: 'Samodzielność i innowacja',
    desc: 'Przyszłeś/aś na Ziemię, aby torować nowe ścieżki. Twoja dusza jest silna, niezależna i gotowa prowadzić innych. Uczysz się ufać własnej sile bez odcinania się od serca.',
  },
  2: {
    name: 'Dyplomata', element: 'Woda', color: '#4ECDC4', crystal: 'Księżycowy Kamień',
    shadow: 'Nadmierna zależność i bierność', gift: 'Empatia i harmonia', theme: 'Współpraca i miłość',
    desc: 'Twoja dusza przyszła, by łączyć i leczyć relacje. Posiadasz dar wyczuwania energii innych ludzi. Uczysz się stawiać swoje potrzeby obok potrzeb bliskich, a nie zamiast nich.',
  },
  3: {
    name: 'Twórca', element: 'Powietrze', color: '#FFD93D', crystal: 'Cytron',
    shadow: 'Rozproszenie i powierzchowność', gift: 'Ekspresja i radość', theme: 'Twórczość i komunikacja',
    desc: 'Masz w sobie kosmiczny dar wyrażania prawdy poprzez sztukę, słowo i radość. Twoja dusza przyszła rozświetlić świat. Uczysz się kanalizować energię twórczą z dyscypliną i głębią.',
  },
  4: {
    name: 'Architekt', element: 'Ziemia', color: '#95E1D3', crystal: 'Jaspis',
    shadow: 'Sztywność i opór przed zmianą', gift: 'Niezawodność i precyzja', theme: 'Porządek i fundament',
    desc: 'Twoja dusza jest fundamentem, na którym inni budują swoje życie. Jesteś tutaj, by tworzyć trwałe struktury — w pracy, rodzinie i wartościach. Uczysz się elastyczności bez utraty stabilności.',
  },
  5: {
    name: 'Odkrywca', element: 'Eter', color: '#F38181', crystal: 'Akwamaryn',
    shadow: 'Ucieczka i nieodpowiedzialność', gift: 'Wolność i adaptacja', theme: 'Doświadczenie i przemiana',
    desc: 'Twoja dusza spragniona jest wolności i nowych doświadczeń. Przyszłeś/aś, by poznawać świat we wszystkich jego wymiarach. Uczysz się, że prawdziwa wolność rodzi się wewnątrz, nie na zewnątrz.',
  },
  6: {
    name: 'Opiekun', element: 'Ziemia', color: '#AA96DA', crystal: 'Różowy Kwarc',
    shadow: 'Kontrola i perfekcjonizm', gift: 'Bezwarunkowa miłość', theme: 'Służba i piękno',
    desc: 'Twoja dusza jest uosobieniem troski i piękna. Przyszłeś/aś, aby kochać głęboko i stwarzać harmonię wokół siebie. Uczysz się dawać z miłości, nie z lęku przed odrzuceniem.',
  },
  7: {
    name: 'Mędrzec', element: 'Woda', color: '#FCBAD3', crystal: 'Ametyst',
    shadow: 'Izolacja i cynizm', gift: 'Głęboka intuicja i mądrość', theme: 'Poszukiwanie prawdy',
    desc: 'Twoja dusza jest wiecznym poszukiwaczem sensu i mistycznych prawd. Posiadasz naturalny dostęp do wiedzy duchowej. Uczysz się dzielić wewnętrznym światem zamiast chować się za intelektem.',
  },
  8: {
    name: 'Biznesmen', element: 'Ziemia', color: '#FFFFD2', crystal: 'Onyx',
    shadow: 'Materializm i despotyzm', gift: 'Manifestacja i autorytet', theme: 'Moc i obfitość',
    desc: 'Przyszłeś/aś po mistrzostwo w świecie materialnym i spirytualizację władzy. Twoja dusza uczy się, że prawdziwa siła służy wszystkim. Masz dar przekształcania energii w realne rezultaty.',
  },
  9: {
    name: 'Humanista', element: 'Ogień', color: '#A8E6CF', crystal: 'Larimar',
    shadow: 'Gorycz i niedokończone sprawy', gift: 'Bezgraniczne współczucie', theme: 'Służba ludzkości',
    desc: 'Twoja dusza jest starą i mądrą duszą, która przyszła zakończyć wielki cykl. Masz głębię empatii i naturalny dar uzdrawiania innych. Uczysz się puszczać, przebaczać i zamykać stare rozdziały.',
  },
  11: {
    name: 'Iluminat', element: 'Eter', color: '#E879F9', crystal: 'Selenyt',
    shadow: 'Lęk i nadwrażliwość', gift: 'Natchnienie i intuicja mistyczna', theme: 'Oświecenie i inspiracja',
    desc: 'Jesteś nośnikiem kosmicznego światła. Twoja dusza przyszła inspirować całe pokolenia poprzez kanałowanie wyższych prawd. Uczysz się uziemienia, by nie spalić się od intensywności własnej energii.',
  },
  22: {
    name: 'Budowniczy Świata', element: 'Ziemia', color: '#60A5FA', crystal: 'Lazuryt',
    shadow: 'Przytłoczenie i porzucenie misji', gift: 'Manifestacja na wielką skalę', theme: 'Transformacja rzeczywistości',
    desc: 'Twoja dusza niesie najtrudniejszy i najświętszy kontrakt — zmienić świat materialny zgodnie z wizją wyższych sfer. Posiadasz moc urzeczywistniania duchowych ideałów w formie. Uczysz się cierpliwości i wiary.',
  },
};

const SOUL_URGE_NAMES: Record<number, string> = {
  1: 'Pionier', 2: 'Dyplomata', 3: 'Twórca', 4: 'Architekt', 5: 'Odkrywca',
  6: 'Opiekun', 7: 'Mędrzec', 8: 'Biznesmen', 9: 'Humanista', 11: 'Iluminat', 22: 'Architekt Świata',
};

const DESTINY_DESC: Record<number, string> = {
  1: 'Twoja misja w tym życiu to przywództwo i pionierstwo — otwierasz drzwi, przez które inni wchodzą.',
  2: 'Twoja misja w tym życiu to budowanie mostów między ludźmi i tworzenie harmonii tam, gdzie jest podział.',
  3: 'Twoja misja w tym życiu to wyrażanie siebie z odwagą — poprzez sztukę, słowo lub po prostu autentyczną obecność.',
  4: 'Twoja misja w tym życiu to budowanie trwałych fundamentów — dla siebie, rodziny i społeczności.',
  5: 'Twoja misja w tym życiu to przekraczanie granic i inspirowanie innych do wolności poprzez własne doświadczenie.',
  6: 'Twoja misja w tym życiu to opieka i piękno — uzdrawiasz serca i tworzysz przestrzenie harmonii.',
  7: 'Twoja misja w tym życiu to dociekanie prawdy i dzielenie się mądrością z tymi, którzy są gotowi słuchać.',
  8: 'Twoja misja w tym życiu to opanowanie materii i użycie dobrobytu jako narzędzia służby.',
  9: 'Twoja misja w tym życiu to ukończenie wielkiego cyklu — uzdrowienie, przebaczenie i przekazanie mądrości.',
  11: 'Twoja misja w tym życiu to bycie kanałem wyższych prawd, które inspirują innych do przebudzenia.',
  22: 'Twoja misja w tym życiu to transformowanie świata materialnego w oparciu o duchowe zasady na wielką skalę.',
};

const KARMIC_DEBT_DESC: Record<number, { title: string; desc: string }> = {
  13: {
    title: 'Dług 13 — Niezależność',
    desc: 'W poprzednich wcieleniach unikałeś/aś pracy i odpowiedzialności. Teraz uczysz się dyscypliny, wytrwałości i budowania własnej ścieżki krok po kroku.',
  },
  14: {
    title: 'Dług 14 — Wolność',
    desc: 'Nadużyłeś/aś wolności lub kontrolowałeś/aś innych. Teraz uczysz się odpowiedzialnej wolności — korzystania z życia z uważnością i bez uzależnień.',
  },
  16: {
    title: 'Dług 16 — Ego',
    desc: 'W poprzednich wcieleniach pycha i zarozumiałość spowodowały upadki. Teraz uczysz się pokory, autentyczności i budowania ego na duchowych fundamentach.',
  },
  19: {
    title: 'Dług 19 — Samolubstwo',
    desc: 'W poprzednich wcieleniach stawiałeś/aś siebie ponad innych. Teraz uczysz się prawdziwej niezależności połączonej ze służbą i wzajemną pomocą.',
  },
};

const KARMIC_LESSON_MAP: Record<number, string> = {
  1: 'Rozwijać pewność siebie i inicjatywę — przestać czekać na pozwolenie innych.',
  2: 'Uczyć się cierpliwości, dyplomacji i otwartości na współpracę.',
  3: 'Wyrażać siebie autentycznie — twórczość, komunikacja i radość życia.',
  4: 'Budować porządek, dyscyplinę i długoterminowe plany zamiast chaosu.',
  5: 'Zaakceptować zmiany i przygody zamiast uciekać od nowych doświadczeń.',
  6: 'Nauczyć się troszczyć — zarówno o siebie, jak i o innych.',
  7: 'Rozwijać wewnętrzną mądrość, samotność jako dar i duchowe poszukiwania.',
  8: 'Opanować relację z pieniędzmi, władzą i autorytetem.',
  9: 'Praktykować bezwarunkowe współczucie i umiejętność puszczania przeszłości.',
};

const PERSONAL_YEAR_DESC: Record<number, { phase: string; desc: string }> = {
  1: { phase: 'Rok Nowych Początków', desc: 'Energia siewu i odważnych startów. Wszystko, co zasiejesz teraz, będzie rosło przez następne 9 lat. Działaj odważnie.' },
  2: { phase: 'Rok Relacji i Cierpliwości', desc: 'Czas budowania głębszych połączeń i czekania na owoce. Intuicja jest Twoim głównym narzędziem.' },
  3: { phase: 'Rok Ekspresji', desc: 'Twórcza energia eksploduje. Pisz, tańcz, mów, śpiewaj — wyrażaj siebie w każdej możliwej formie.' },
  4: { phase: 'Rok Pracy i Fundamentów', desc: 'Czas budowania trwałych struktur. Wymagający, ale każdy wysiłek zostaje w kamieniu. Buduj solidnie.' },
  5: { phase: 'Rok Zmian i Wolności', desc: 'Przełomowy rok pełen niespodziewanych zwrotów. Bądź elastyczny/a i otwórz się na zupełnie nowe doświadczenia.' },
  6: { phase: 'Rok Harmonii i Domu', desc: 'Skupiasz się na rodzinie, zdrowiu i pięknie. Rok odpowiedzialności, miłości i naprawiania tego, co wymaga uwagi.' },
  7: { phase: 'Rok Refleksji i Ducha', desc: 'Wejście w głąb siebie. Medytacja, nauka, samotność jako dar — to rok mistycznych odkryć i wewnętrznego dojrzewania.' },
  8: { phase: 'Rok Manifestacji i Mocy', desc: 'Wszystko, co zbudowałeś/aś przez 7 lat, teraz przynosi owoce. Rok materialnych sukcesów i wpływu.' },
  9: { phase: 'Rok Zamknięcia Cyklu', desc: 'Czas kończenia, puszczania i oczyszczania. Przebaczaj, żegnaj, zwalniaj miejsce. Nowy cykl 9-letni stoi za drzwiami.' },
  11: { phase: 'Rok Iluminacji', desc: 'Intensywny rok duchowego przebudzenia. Intuicja jest silna, uważaj na przeciążenie energetyczne.' },
  22: { phase: 'Rok Budowniczego', desc: 'Rzadki rok ogromnego potencjału manifestacji. Twoje wizje mogą stać się rzeczywistością na dużą skalę.' },
};

const ZODIAC_ARCHETYPES: Record<string, {
  archetype: string; shadow: string; gift: string; animal: string; element: string; crystal: string;
}> = {
  Aries: {
    archetype: 'Wojownik', shadow: 'Impulsywność i agresja', gift: 'Odwaga i inicjatywa',
    animal: 'Orzeł', element: 'Ogień', crystal: 'Rubin',
  },
  Taurus: {
    archetype: 'Strażnik', shadow: 'Upartość i materializm', gift: 'Niezawodność i zmysłowość',
    animal: 'Niedźwiedź', element: 'Ziemia', crystal: 'Szmaragd',
  },
  Gemini: {
    archetype: 'Magik', shadow: 'Rozproszenie i dwulicowość', gift: 'Komunikacja i adaptacja',
    animal: 'Delfin', element: 'Powietrze', crystal: 'Agat',
  },
  Cancer: {
    archetype: 'Opiekun', shadow: 'Manipulacja przez emocje', gift: 'Intuicja i głęboka troska',
    animal: 'Delfin Rzeki', element: 'Woda', crystal: 'Perła',
  },
  Leo: {
    archetype: 'Władca', shadow: 'Pycha i potrzeba uwagi', gift: 'Hojność i charyzma',
    animal: 'Lew', element: 'Ogień', crystal: 'Złoty Topaz',
  },
  Virgo: {
    archetype: 'Mędrzec', shadow: 'Perfekcjonizm i nadkrytyczność', gift: 'Analiza i służba',
    animal: 'Sowa', element: 'Ziemia', crystal: 'Jadeit',
  },
  Libra: {
    archetype: 'Kochanek', shadow: 'Brak decyzyjności i zależność', gift: 'Harmonia i piękno',
    animal: 'Łabędź', element: 'Powietrze', crystal: 'Różowy Kwarc',
  },
  Scorpio: {
    archetype: 'Transformator', shadow: 'Obsesja i manipulacja', gift: 'Głęboka transformacja i moc',
    animal: 'Feniks', element: 'Woda', crystal: 'Obsydian',
  },
  Sagittarius: {
    archetype: 'Poszukiwacz', shadow: 'Brak zobowiązań i hipokryzja', gift: 'Wizja i mądrość filozoficzna',
    animal: 'Koń', element: 'Ogień', crystal: 'Lapis Lazuli',
  },
  Capricorn: {
    archetype: 'Rządca', shadow: 'Zimność i obsesja sukcesu', gift: 'Ambicja i dyscyplina',
    animal: 'Ibis', element: 'Ziemia', crystal: 'Onyks',
  },
  Aquarius: {
    archetype: 'Rewolucjonista', shadow: 'Oderwanie i ekstremizm', gift: 'Innowacja i humanitaryzm',
    animal: 'Motyl', element: 'Powietrze', crystal: 'Akwamaryn',
  },
  Pisces: {
    archetype: 'Mistyk', shadow: 'Ucieczka od rzeczywistości', gift: 'Współczucie i połączenie z Boskim',
    animal: 'Wieloryb', element: 'Woda', crystal: 'Ametyst',
  },
};

// ─────────────────────────────────────────────────────────────────
// 3D MANDALA WIDGET
// Each rotating ring is its own Animated.View wrapping its own Svg,
// stacked absolutely — the proven pattern from ChakraScreen.
// ─────────────────────────────────────────────────────────────────
const MANDALA_PETALS = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return { x: 64 * Math.cos(a), y: 64 * Math.sin(a) };
});
const MANDALA_INNER = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2;
  return { x: 38 * Math.cos(a), y: 38 * Math.sin(a) };
});
const MANDALA_STARS_PTS = Array.from({ length: 18 }, (_, i) => ({
  x: ((i * 131 + 23) % 200) - 100,
  y: ((i * 97 + 47) % 200) - 100,
  r: i % 4 === 0 ? 1.8 : 0.9,
  op: 0.2 + (i % 5) * 0.06,
}));

const MANDALA_SIZE = 200;

const SoulMandala3D = React.memo(({ accent }: { accent: string }) => {
  const rot1  = useSharedValue(0);
  const rot2  = useSharedValue(0);
  const pulse = useSharedValue(0.9);
  const tiltX = useSharedValue(-8);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    rot1.value  = withRepeat(withTiming(360,  { duration: 22000, easing: Easing.linear }), -1, false);
    rot2.value  = withRepeat(withTiming(-360, { duration: 15000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withSequence(withTiming(1.06, { duration: 3200 }), withTiming(0.9, { duration: 3200 })), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-22, Math.min(22, -8 + e.translationY * 0.15));
      tiltY.value = Math.max(-22, Math.min(22, e.translationX * 0.15));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-8, { duration: 900 });
      tiltY.value = withTiming(0,  { duration: 900 });
    });

  const tiltStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: pulse.value },
    ],
  }));
  const ring1Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot1.value}deg` }] }));
  const ring2Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot2.value}deg` }] }));

  const S = MANDALA_SIZE;
  const half = S / 2;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ width: S, height: S, alignSelf: 'center' }, tiltStyle]}>

        {/* Layer 0 — static: stars + outer ring + spokes + center */}
        <Svg width={S} height={S} style={StyleSheet.absoluteFill}>
          <G transform={`translate(${half},${half})`}>
            {MANDALA_STARS_PTS.map((s, i) => (
              <Circle key={'ms' + i} cx={s.x} cy={s.y} r={s.r} fill={accent} opacity={s.op} />
            ))}
            <Circle cx={0} cy={0} r={92} stroke={accent} strokeWidth={0.5} fill="none" opacity={0.18} />
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return (
                <Line key={'sp' + i}
                  x1={20 * Math.cos(a)} y1={20 * Math.sin(a)}
                  x2={88 * Math.cos(a)} y2={88 * Math.sin(a)}
                  stroke={accent} strokeWidth={0.4} opacity={0.12}
                />
              );
            })}
            <Circle cx={0} cy={0} r={18} fill={accent} opacity={0.15} />
            <Circle cx={0} cy={0} r={10} fill={accent} opacity={0.30} />
            <Circle cx={0} cy={0} r={4} fill="#FFFFFF" opacity={0.70} />
          </G>
        </Svg>

        {/* Layer 1 — rotating petal ring */}
        <Animated.View style={[StyleSheet.absoluteFill, ring1Style]} pointerEvents="none">
          <Svg width={S} height={S}>
            <G transform={`translate(${half},${half})`}>
              {MANDALA_PETALS.map((p, i) => (
                <G key={'p' + i} transform={`translate(${p.x},${p.y})`}>
                  <Ellipse rx={12} ry={20} fill={accent} opacity={0.10} />
                  <Circle cx={0} cy={0} r={4} fill={accent} opacity={0.22} />
                </G>
              ))}
              <Circle cx={0} cy={0} r={70} stroke={accent} strokeWidth={0.6} fill="none" opacity={0.14} strokeDasharray="4 8" />
            </G>
          </Svg>
        </Animated.View>

        {/* Layer 2 — counter-rotating hexagram */}
        <Animated.View style={[StyleSheet.absoluteFill, ring2Style]} pointerEvents="none">
          <Svg width={S} height={S}>
            <G transform={`translate(${half},${half})`}>
              {MANDALA_INNER.map((p, i) => (
                <Line key={'ip' + i}
                  x1={MANDALA_INNER[i].x} y1={MANDALA_INNER[i].y}
                  x2={MANDALA_INNER[(i + 3) % 6].x} y2={MANDALA_INNER[(i + 3) % 6].y}
                  stroke={accent} strokeWidth={0.8} opacity={0.25}
                />
              ))}
              <Circle cx={0} cy={0} r={42} stroke={accent} strokeWidth={0.5} fill="none" opacity={0.20} />
            </G>
          </Svg>
        </Animated.View>

      </Animated.View>
    </GestureDetector>
  );
});

// ─────────────────────────────────────────────────────────────────
// BACKGROUND
// ─────────────────────────────────────────────────────────────────
const SoulBg = ({ isLight }: { isLight: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight ? ['#FDF4FF', '#FAF0FF', '#F6E8FF'] : ['#07030F', '#0C0518', '#110820']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={700} style={StyleSheet.absoluteFill} opacity={isLight ? 0.08 : 0.14}>
      <G>
        {/* Sacred geometry circles */}
        <Circle cx={SW / 2} cy={200} r={140} stroke={ACCENT} strokeWidth={0.6} fill="none" />
        <Circle cx={SW / 2} cy={200} r={100} stroke={ACCENT} strokeWidth={0.4} fill="none" />
        <Circle cx={SW / 2} cy={200} r={60}  stroke={ACCENT} strokeWidth={0.5} fill="none" />
        {/* Star dust */}
        {Array.from({ length: 24 }, (_, i) => (
          <Circle key={'bg' + i} cx={(i * 149 + 30) % SW} cy={(i * 113 + 40) % 680}
            r={i % 6 === 0 ? 1.8 : 0.8} fill={ACCENT} opacity={0.15 + (i % 4) * 0.04} />
        ))}
        {/* Subtle triangle */}
        <Polygon
          points={`${SW / 2},80 ${SW / 2 - 90},260 ${SW / 2 + 90},260`}
          stroke={ACCENT} strokeWidth={0.5} fill="none" opacity={0.12}
        />
        <Polygon
          points={`${SW / 2},320 ${SW / 2 - 90},140 ${SW / 2 + 90},140`}
          stroke={ACCENT} strokeWidth={0.5} fill="none" opacity={0.10}
        />
      </G>
    </Svg>
  </View>
);

// ─────────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────────
const SectionHeader = ({ label, isLight }: { label: string; isLight: boolean }) => (
  <Animated.View entering={FadeInDown.delay(80).duration(600)} style={{ marginBottom: 12, marginTop: 28 }}>
    <Text style={{
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 2.5,
      color: ACCENT,
      opacity: 0.85,
    }}>
      {label}
    </Text>
    <View style={{ height: 1, backgroundColor: ACCENT, opacity: 0.15, marginTop: 6, borderRadius: 1 }} />
  </Animated.View>
);

// ─────────────────────────────────────────────────────────────────
// NUMBER BADGE
// ─────────────────────────────────────────────────────────────────
const NumberBadge = ({ number, color }: { number: number; color: string }) => (
  <View style={{
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 1.5, borderColor: color + '60',
    backgroundColor: color + '18',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  }}>
    <Text style={{ fontSize: 22, fontWeight: '800', color, letterSpacing: -1 }}>
      {number}
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────
// PRACTICE TILE
// ─────────────────────────────────────────────────────────────────
const PracticeTile = ({
  icon: Icon, label, sublabel, route, navigation, isLight, delay = 0,
}: any) => {
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const textColor = isLight ? '#1A0A2E' : '#F0E8FF';
  const subColor  = isLight ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.45)';

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)}>
      <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1.0); }}
        onPress={() => { HapticsService.impact('light'); navigation.navigate(route); }}
        style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: cardBg,
          borderRadius: 14, padding: 14, marginBottom: 10,
          borderWidth: 1, borderColor: ACCENT + '22',
        }}
      >
        <LinearGradient
          colors={[ACCENT + '28', ACCENT + '10']}
          style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
        >
          <Icon size={20} color={ACCENT} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{label}</Text>
          <Text style={{ fontSize: 12, color: subColor, marginTop: 2 }}>{sublabel}</Text>
        </View>
        <ArrowRight size={16} color={ACCENT} opacity={0.6} />
      </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────
export const SoulContractScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
  const textColor = isLight ? '#1A0A2E' : '#F0E8FF';
  const subColor  = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.50)';
  const cardBg    = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const cardBorder = ACCENT + '22';

  const [starred, setStarred] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReading, setAiReading] = useState('');

  // ── Parse birth data ──────────────────────────────────────────
  const birthData = useMemo(() => parseBirthDate(userData?.birthDate), [userData?.birthDate]);

  const nums = useMemo(() => {
    if (!birthData) return null;
    const { day, month, year } = birthData;
    const userName = userData?.name || '';
    return {
      lifePath: calcLifePath(day, month, year),
      soulUrge: calcSoulUrge(userName),
      destiny: calcDestinyNumber(day, month, year),
      karmicDebt: calcKarmicDebt(day, month),
      personalYear: calcPersonalYear(day, month),
      missing: getMissingNumbers(day, month, year),
    };
  }, [birthData, userData?.name]);

  const lifePathData = nums ? LIFE_PATH_DATA[nums.lifePath] : null;
  const personalYearData = nums ? PERSONAL_YEAR_DESC[nums.personalYear] : null;

  const zodiacKey = userData?.zodiacSign ?? '';
  const archetype = ZODIAC_ARCHETYPES[zodiacKey] ?? null;

  // ── Format birth date display ─────────────────────────────────
  const birthDisplay = useMemo(() => {
    if (!birthData) return null;
    const { day, month, year } = birthData;
    const months = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
    return `${day} ${months[month - 1]} ${year}`;
  }, [birthData]);

  // ── Star button pulse ─────────────────────────────────────────
  const starScale = useSharedValue(1);
  const starStyle = useAnimatedStyle(() => ({ transform: [{ scale: starScale.value }] }));

  const handleStar = () => {
    HapticsService.impact('medium');
    starScale.value = withSequence(withSpring(1.4), withSpring(1.0));
    setStarred((s) => !s);
  };

  // ── AI Reading ────────────────────────────────────────────────
  const generateReading = async () => {
    if (aiLoading) return;
    HapticsService.impact('medium');
    setAiLoading(true);
    try {
      const lp = nums ? nums.lifePath : '?';
      const py = nums ? nums.personalYear : '?';
      const name = userData?.name ?? 'Poszukiwacz/ka';
      const zodiac = zodiacKey || 'nieznany';
      const arch = archetype?.archetype ?? 'Mistyk';
      const gift = archetype?.gift ?? 'intuicja';
      const birthYear = birthData?.year ?? '';

      const messages = [
        {
          role: 'user' as const,
          content: i18n.language?.startsWith('en') ? `You are Aethera's mystical guide. Write a personalized Soul Contract reading, about 200 words, for ${name}.

Data:
- Life Path: ${lp}
- Personal Year: ${py}
- Zodiac sign: ${zodiac}
- Soul archetype: ${arch}
- Archetype gift: ${gift}
- Birth year: ${birthYear}

Begin with "Your Soul Contract says..." and describe: the main karmic lesson, the soul mission, the current energetic phase (personal year ${py}), the gift to develop, and one concrete action for now. Style: poetic, deep, warm and supportive. No headings, one cohesive text.` : `Jesteś mistycznym przewodnikiem Aethery. Napisz w języku użytkownika spersonalizowany odczyt Kontraktu Duszy (200 słów) dla osoby o imieniu ${name}.

Dane:
- Ścieżka życia (Life Path): ${lp}
- Rok osobisty: ${py}
- Znak zodiaku: ${zodiac}
- Archetyp duszy: ${arch}
- Dar archetypu: ${gift}
- Rok urodzenia: ${birthYear}

Zacznij od "Twój Kontrakt Duszy mówi..." i opisz: główną lekcję karmiczną, misję duszy, aktualną fazę energetyczną (rok osobisty ${py}), dar, który masz rozwinąć oraz jedno konkretne działanie na teraz. Styl poetycki i głęboki, ciepły i wspierający. Bez nagłówków, jeden spójny tekst.`,
        },
      ];
      const result = await AiService.chatWithOracle(messages, i18n.language?.startsWith('en') ? 'en' : 'pl');
      setAiReading(result || (i18n.language?.startsWith('en') ? 'Your Soul Contract whispers: you are here for something deeper than you think. Trust this moment.' : 'Kontrakt Duszy szepcze: jesteś tutaj po coś głębszego niż myślisz. Zaufaj tej chwili.'));
    } catch {
      setAiReading(i18n.language?.startsWith('en') ? 'The universe is speaking through silence. Come back in a moment with an open heart.' : 'Wszechświat mówi przez ciszę. Wróć tu za chwilę z otwartym sercem.');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Lesson cards from missing numbers ─────────────────────────
  const lessonCards = useMemo(() => {
    if (!nums) return [];
    return nums.missing.slice(0, 3).map((n) => ({
      number: n,
      lesson: KARMIC_LESSON_MAP[n] ?? 'Odkryć ukryte aspekty tej energii.',
    }));
  }, [nums]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView edges={['top']} style={{ flex: 1}}>

      <SoulBg isLight={isLight} />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: 8 }]}>
        <Pressable
          onPress={() => { HapticsService.impact('light'); goBackOrToMainTab(navigation, 'Worlds'); }}
          style={styles.headerBtn}
          hitSlop={12}
        >
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.eyebrow, { color: ACCENT }]}>{t('soulContract.swiat_ty', 'ŚWIAT TY')}</Text>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('soulContract.kontrakt_duszy', 'Kontrakt Duszy')}</Text>
        </View>
        <Animated.View style={starStyle}>
          <Pressable onPress={handleStar} style={styles.headerBtn} hitSlop={12}>
            <Star size={20} color={ACCENT} fill={starred ? ACCENT : 'transparent'} />
          </Pressable>
        </Animated.View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO CARD ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(60).duration(700)}>
          <LinearGradient
            colors={isLight ? ['#F9E8FF', '#F3D4FE', '#EBC5FD'] : ['#1C0830', '#240C3C', '#1A0828']}
            style={[styles.heroCard, { borderColor: ACCENT + '30' }]}
          >
            <SoulMandala3D accent={ACCENT} />
            <Text style={[styles.heroText, { color: textColor }]}>
              {t('soulContract.kontrakt_duszy_to_mapa_lekcji', 'Kontrakt Duszy to mapa lekcji, które wybrałeś/aś przed przyjściem na Ziemię — wzorce karmiczne, misja, talenty i wyzwania zakorzenione w Twojej dacie urodzenia.')}
            </Text>
            {birthDisplay ? (
              <View style={styles.birthRow}>
                <Sparkles size={13} color={ACCENT} style={{ marginRight: 6 }} />
                <Text style={[styles.birthText, { color: ACCENT }]}>{birthDisplay}</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => navigation.navigate('Profile')}
                style={[styles.setBirthBtn, { borderColor: ACCENT + '50' }]}
              >
                <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>
                  {t('soulContract.ustaw_date_urodzenia_w_profilu', 'Ustaw datę urodzenia w profilu →')}
                </Text>
              </Pressable>
            )}
          </LinearGradient>
        </Animated.View>

        {/* ── NO BIRTH DATA PLACEHOLDER ─────────────────────── */}
        {!birthData && (
          <Animated.View entering={FadeInDown.delay(120).duration(600)}>
            <View style={[styles.placeholderCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Eye size={28} color={ACCENT} style={{ marginBottom: 10 }} />
              <Text style={[styles.placeholderTitle, { color: textColor }]}>{t('soulContract.twoj_kontrakt_czeka', 'Twój kontrakt czeka')}</Text>
              <Text style={[styles.placeholderDesc, { color: subColor }]}>
                {t('soulContract.dodaj_date_urodzenia_w_ustawienia', 'Dodaj datę urodzenia w ustawieniach profilu, aby odblokować pełną mapę karmiczną, liczby duszy i archetype.')}
              </Text>
              <Pressable
                onPress={() => navigation.navigate('Profile')}
                style={[styles.placeholderBtn, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '44' }]}
              >
                <Text style={{ color: ACCENT, fontWeight: '700', fontSize: 14 }}>{t('soulContract.przejdz_do_profilu', 'Przejdź do profilu')}</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* MAPA KARMICZNA — only when birth data available     */}
        {/* ════════════════════════════════════════════════════ */}
        {nums && (
          <>
            <SectionHeader label={t('soulContract.mapa_karmiczna', 'MAPA KARMICZNA')} isLight={isLight} />

            {/* a. Liczba Duszy ──────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <LinearGradient
                colors={isLight ? ['#F7E8FF', '#F0D8FE'] : ['#18082A', '#1E0C34']}
                style={[styles.mapCard, { borderColor: ACCENT + '28' }]}
              >
                <View style={styles.mapCardHeader}>
                  <NumberBadge number={nums.soulUrge} color={ACCENT} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.mapLabel, { color: subColor }]}>{t('soulContract.liczba_duszy', 'LICZBA DUSZY')}</Text>
                    <Text style={[styles.mapName, { color: textColor }]}>
                      {SOUL_URGE_NAMES[nums.soulUrge] ?? 'Poszukiwacz'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.mapDesc, { color: subColor }]}>
                  Liczba duszy ujawnia Twoje najgłębsze pragnienia i motywacje ukryte za codzienną maską. To głos Twojej duszy — czego naprawdę pragniesz? Co Cię napędza od środka, niezależnie od oczekiwań świata? Numer {nums.soulUrge} wskazuje: {SOUL_URGE_NAMES[nums.soulUrge] ?? 'Poszukiwacz'}.
                </Text>
              </LinearGradient>
            </Animated.View>

            {/* b. Liczba Przeznaczenia ──────────────────────── */}
            <Animated.View entering={FadeInDown.delay(150).duration(500)}>
              <LinearGradient
                colors={isLight ? ['#EEE8FF', '#E4D8FE'] : ['#130A28', '#190E34']}
                style={[styles.mapCard, { borderColor: '#A78BFA' + '28' }]}
              >
                <View style={styles.mapCardHeader}>
                  <NumberBadge number={nums.destiny} color="#A78BFA" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.mapLabel, { color: subColor }]}>{t('soulContract.liczba_przeznacze', 'LICZBA PRZEZNACZENIA')}</Text>
                    <Text style={[styles.mapName, { color: textColor }]}>{t('soulContract.misja_zyciowa', 'Misja życiowa')}</Text>
                  </View>
                </View>
                <Text style={[styles.mapDesc, { color: subColor }]}>
                  {DESTINY_DESC[nums.destiny] ?? `Twoja misja w tym życiu jest wyjątkowa i wielowymiarowa. Liczba ${nums.destiny} kieruje Twoją drogą.`}
                </Text>
              </LinearGradient>
            </Animated.View>

            {/* c. Dług Karmiczny ───────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              {nums.karmicDebt ? (
                <LinearGradient
                  colors={isLight ? ['#FFE8F7', '#FED8F0'] : ['#280818', '#340C22']}
                  style={[styles.mapCard, { borderColor: '#F472B6' + '30' }]}
                >
                  <View style={styles.mapCardHeader}>
                    <View style={[styles.debtBadge, { borderColor: '#F472B6' + '60', backgroundColor: '#F472B6' + '18' }]}>
                      <Flame size={20} color="#F472B6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.mapLabel, { color: subColor }]}>{t('soulContract.dlug_karmiczny', 'DŁUG KARMICZNY')}</Text>
                      <Text style={[styles.mapName, { color: textColor }]}>
                        {KARMIC_DEBT_DESC[nums.karmicDebt]?.title ?? `Wzorzec ${nums.karmicDebt}`}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.mapDesc, { color: subColor }]}>
                    {KARMIC_DEBT_DESC[nums.karmicDebt]?.desc ?? 'Masz specyficzne karmiczne zadanie do wypełnienia w tym wcieleniu.'}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={[styles.mapCard, { backgroundColor: cardBg, borderColor: '#34D399' + '30', borderWidth: 1 }]}>
                  <View style={styles.mapCardHeader}>
                    <View style={[styles.debtBadge, { borderColor: '#34D399' + '60', backgroundColor: '#34D399' + '18' }]}>
                      <Shield size={20} color="#34D399" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.mapLabel, { color: subColor }]}>{t('soulContract.dlug_karmiczny_1', 'DŁUG KARMICZNY')}</Text>
                      <Text style={[styles.mapName, { color: '#34D399' }]}>{t('soulContract.czyste_konto', 'Czyste Konto')}</Text>
                    </View>
                  </View>
                  <Text style={[styles.mapDesc, { color: subColor }]}>
                    {t('soulContract.nie_niesiesz_specyficzn_dlugu_karmi', 'Nie niesiesz specyficznego długu karmicznego z poprzednich wcieleń. Twoja dusza przyszła tutaj ze stosunkowo czystym kontem, co daje Ci większą wolność w kreowaniu własnej ścieżki.')}
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* d. Ścieżka Życia ────────────────────────────── */}
            {lifePathData && (
              <Animated.View entering={FadeInDown.delay(250).duration(600)}>
                <LinearGradient
                  colors={isLight
                    ? [lifePathData.color + '22', lifePathData.color + '10', '#F8F0FF']
                    : [lifePathData.color + '18', '#1A0828']}
                  style={[styles.lifePathCard, { borderColor: lifePathData.color + '40' }]}
                >
                  <View style={styles.mapCardHeader}>
                    <NumberBadge number={nums.lifePath} color={lifePathData.color} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.mapLabel, { color: subColor }]}>{t('soulContract.sciezka_zycia', 'ŚCIEŻKA ŻYCIA')}</Text>
                      <Text style={[styles.lifePathName, { color: lifePathData.color }]}>
                        {lifePathData.name}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.mapDesc, { color: subColor, marginBottom: 14 }]}>
                    {lifePathData.desc}
                  </Text>
                  <View style={styles.lifePathGrid}>
                    {[
                      { label: 'Żywioł', value: lifePathData.element },
                      { label: 'Kryształ', value: lifePathData.crystal },
                      { label: 'Kolor', value: lifePathData.color },
                      { label: 'Temat', value: lifePathData.theme },
                    ].map((item) => (
                      <View key={item.label} style={[styles.lpTag, { borderColor: lifePathData.color + '40', backgroundColor: lifePathData.color + '12' }]}>
                        <Text style={{ fontSize: 9, color: subColor, letterSpacing: 1 }}>{item.label.toUpperCase()}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: textColor, marginTop: 2 }}>
                          {item.label === 'Kolor' ? '●' : item.value}
                        </Text>
                        {item.label === 'Kolor' && (
                          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: lifePathData.color, marginTop: 2 }} />
                        )}
                      </View>
                    ))}
                  </View>
                  <View style={[styles.shadowGiftRow, { borderColor: lifePathData.color + '25' }]}>
                    <View style={styles.shadowGiftItem}>
                      <Text style={[styles.sgLabel, { color: subColor }]}>{t('soulContract.cien', 'CIEŃ')}</Text>
                      <Text style={[styles.sgValue, { color: textColor }]}>{lifePathData.shadow}</Text>
                    </View>
                    <View style={[styles.sgDivider, { backgroundColor: lifePathData.color + '30' }]} />
                    <View style={styles.shadowGiftItem}>
                      <Text style={[styles.sgLabel, { color: subColor }]}>{t('soulContract.dar', 'DAR')}</Text>
                      <Text style={[styles.sgValue, { color: textColor }]}>{lifePathData.gift}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* e. Rok Duszy ────────────────────────────────── */}
            {personalYearData && (
              <Animated.View entering={FadeInDown.delay(300).duration(500)}>
                <LinearGradient
                  colors={isLight ? ['#FFF8E8', '#FFF0D4'] : ['#201408', '#2C1C0A']}
                  style={[styles.mapCard, { borderColor: '#FBBF24' + '30' }]}
                >
                  <View style={styles.mapCardHeader}>
                    <NumberBadge number={nums.personalYear} color="#FBBF24" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.mapLabel, { color: subColor }]}>ROK DUSZY {new Date().getFullYear()}</Text>
                      <Text style={[styles.mapName, { color: '#FBBF24' }]}>{personalYearData.phase}</Text>
                    </View>
                  </View>
                  <Text style={[styles.mapDesc, { color: subColor }]}>{personalYearData.desc}</Text>
                </LinearGradient>
              </Animated.View>
            )}

            {/* ── LEKCJE KARMICZNE ─────────────────────────── */}
            {lessonCards.length > 0 && (
              <>
                <SectionHeader label={t('soulContract.lekcje_karmiczne', 'LEKCJE KARMICZNE')} isLight={isLight} />
                <Animated.View entering={FadeInDown.delay(80).duration(600)}>
                  <Text style={[styles.sectionIntro, { color: subColor }]}>
                    {t('soulContract.czego_twoja_dusza_przyszla_sie', 'Czego Twoja dusza przyszła się tu nauczyć? Brakujące liczby w dacie urodzenia wskazują energie, z którymi musisz świadomie pracować.')}
                  </Text>
                </Animated.View>
                {lessonCards.map((card, i) => (
                  <Animated.View key={card.number} entering={FadeInDown.delay(100 + i * 80).duration(500)}>
                    <LinearGradient
                      colors={isLight ? ['#F0E8FF', '#E8D8FE', '#EEE0FF'] : ['#160A2C', '#1E0E38', '#160A2C']}
                      style={[styles.lessonCard, { borderColor: ACCENT + '28' }]}
                    >
                      <View style={styles.lessonBadge}>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: ACCENT }}>{card.number}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.lessonLabel, { color: subColor }]}>LEKCJA #{i + 1}</Text>
                        <Text style={[styles.lessonText, { color: textColor }]}>{card.lesson}</Text>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                ))}
                {lessonCards.length === 0 && (
                  <View style={[styles.mapCard, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1, alignItems: 'center', paddingVertical: 20 }]}>
                    <Sparkles size={24} color={ACCENT} style={{ marginBottom: 8 }} />
                    <Text style={[styles.mapDesc, { color: subColor, textAlign: 'center' }]}>
                      {t('soulContract.twoja_data_urodzenia_zawiera_wszyst', 'Twoja data urodzenia zawiera wszystkie cyfry 1–9. To rzadki wzorzec świadczący o bardzo zaawansowanej duszy z bogatym dorobkiem poprzednich wcieleń.')}
                    </Text>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* ── ARCHETYP DUSZY ─────────────────────────────────── */}
        {archetype && (
          <>
            <SectionHeader label={t('soulContract.archetyp_duszy', 'ARCHETYP DUSZY')} isLight={isLight} />
            <Animated.View entering={FadeInDown.delay(100).duration(600)}>
              <LinearGradient
                colors={isLight ? ['#F4E8FF', '#ECE0FE', '#F0E4FF'] : ['#1A083A', '#220C46', '#1A083A']}
                style={[styles.archetypeCard, { borderColor: ACCENT + '35' }]}
              >
                {/* Header */}
                <View style={styles.archetypeHeader}>
                  <LinearGradient
                    colors={[ACCENT + '30', ACCENT + '10']}
                    style={styles.archetypeIcon}
                  >
                    <Eye size={26} color={ACCENT} />
                  </LinearGradient>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.mapLabel, { color: subColor }]}>
                      {zodiacKey.toUpperCase()} — ARCHETYP
                    </Text>
                    <Text style={[styles.archetypeName, { color: textColor }]}>{archetype.archetype}</Text>
                  </View>
                </View>

                {/* Grid of attributes */}
                <View style={styles.archetypeGrid}>
                  {[
                    { label: 'Żywioł', value: archetype.element, color: '#60A5FA' },
                    { label: 'Kryształ', value: archetype.crystal, color: ACCENT },
                    { label: 'Zwierzę', value: archetype.animal, color: '#34D399' },
                  ].map((attr) => (
                    <View key={attr.label} style={[styles.attrTag, { borderColor: attr.color + '35', backgroundColor: attr.color + '10' }]}>
                      <Text style={{ fontSize: 9, color: subColor, letterSpacing: 1 }}>{attr.label.toUpperCase()}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: attr.color, marginTop: 3 }}>{attr.value}</Text>
                    </View>
                  ))}
                </View>

                {/* Shadow & Gift */}
                <View style={[styles.shadowGiftRow, { borderColor: ACCENT + '20', marginTop: 14 }]}>
                  <View style={styles.shadowGiftItem}>
                    <Text style={[styles.sgLabel, { color: subColor }]}>{t('soulContract.cien_1', 'CIEŃ')}</Text>
                    <Text style={[styles.sgValue, { color: textColor }]}>{archetype.shadow}</Text>
                  </View>
                  <View style={[styles.sgDivider, { backgroundColor: ACCENT + '25' }]} />
                  <View style={styles.shadowGiftItem}>
                    <Text style={[styles.sgLabel, { color: subColor }]}>{t('soulContract.dar_1', 'DAR')}</Text>
                    <Text style={[styles.sgValue, { color: textColor }]}>{archetype.gift}</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </>
        )}

        {/* ── AI ODCZYT KONTRAKTU ─────────────────────────────── */}
        <SectionHeader label={t('soulContract.ai_odczyt_kontraktu', 'AI ODCZYT KONTRAKTU')} isLight={isLight} />

        {!aiReading && (
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <Pressable
              onPress={generateReading}
              disabled={aiLoading}
              style={{ marginBottom: 16 }}
            >
              <LinearGradient
                colors={[ACCENT, '#C026D3', '#9333EA']}
                style={styles.aiBtn}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {aiLoading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.aiBtnText}>{t('soulContract.odczytywan_kontraktu', 'Odczytywanie kontraktu...')}</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Sparkles size={18} color="#fff" />
                    <Text style={styles.aiBtnText}>{t('soulContract.wygeneruj_pelny_odczyt_kontraktu', 'Wygeneruj pełny odczyt kontraktu')}</Text>
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {aiReading && (
          <Animated.View entering={FadeIn.duration(700)}>
            <LinearGradient
              colors={isLight ? ['#F4E8FF', '#ECD8FE'] : ['#1E0838', '#280A42']}
              style={[styles.aiReadingCard, { borderColor: ACCENT + '35' }]}
            >
              <View style={styles.aiReadingHeader}>
                <LinearGradient
                  colors={[ACCENT + '30', ACCENT + '10']}
                  style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}
                >
                  <Sparkles size={18} color={ACCENT} />
                </LinearGradient>
                <Text style={[styles.aiReadingLabel, { color: textColor }]}>{t('soulContract.twoj_kontrakt_duszy', 'Twój Kontrakt Duszy')}</Text>
              </View>
              <Text style={[styles.aiReadingText, { color: subColor }]}>{aiReading}</Text>
              <Pressable
                onPress={() => { setAiReading(''); }}
                style={{ marginTop: 14, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Text style={{ fontSize: 12, color: ACCENT, opacity: 0.7 }}>{t('soulContract.wygeneruj_ponownie', 'Wygeneruj ponownie')}</Text>
                <ArrowRight size={12} color={ACCENT} opacity={0.7} />
              </Pressable>
            </LinearGradient>
          </Animated.View>
        )}

        {/* ── PRAKTYKI INTEGRACYJNE ───────────────────────────── */}
        <SectionHeader label={t('soulContract.praktyki_integracyj', 'PRAKTYKI INTEGRACYJNE')} isLight={isLight} />

        <PracticeTile
          icon={Activity}
          label={t('soulContract.medytacja_kontraktu', 'Medytacja kontraktu')}
          sublabel="15 min — wizualizacja ścieżki duszy"
          route="Meditation"
          navigation={navigation}
          isLight={isLight}
          delay={60}
        />
        <PracticeTile
          icon={BookOpen}
          label={t('soulContract.dziennik_lekcji', 'Dziennik lekcji')}
          sublabel="Zapisz refleksję nad swoimi lekcjami karmicznymi"
          route="JournalEntry"
          navigation={navigation}
          isLight={isLight}
          delay={120}
        />
        <PracticeTile
          icon={Sparkles}
          label={t('soulContract.krysztal_dopasowani', 'Kryształ dopasowania')}
          sublabel={lifePathData ? `Twój kryształ: ${lifePathData.crystal}` : 'Odkryj swój kamień ścieżki'}
          route="Affirmations"
          navigation={navigation}
          isLight={isLight}
          delay={180}
        />
        <PracticeTile
          icon={Heart}
          label={t('soulContract.afirmacja_duszy', 'Afirmacja duszy')}
          sublabel="Afirmacje dopasowane do Twojej ścieżki"
          route="Affirmations"
          navigation={navigation}
          isLight={isLight}
          delay={240}
        />

        {/* ── OCHRONA ENERGETYCZNA ────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={{ marginTop: 8 }}>
          <LinearGradient
            colors={isLight ? ['#E8F5E9', '#D4EDE6'] : ['#06140A', '#0A1E10']}
            style={[styles.protectionCard, { borderColor: '#34D399' + '30' }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Shield size={22} color="#34D399" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.protectionTitle, { color: textColor }]}>{t('soulContract.ochrona_energetycz', 'Ochrona energetyczna')}</Text>
                <Text style={[styles.protectionText, { color: subColor }]}>
                  Znając swój kontrakt, możesz świadomie pracować z karmą zamiast ją nieświadomie powtarzać. Każda lekcja, którą rozpoznajesz i akceptujesz, zmniejsza jej energetyczny ciężar. Świadomość to pierwsza forma ochrony.
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <EndOfContentSpacer size="standard" />
      </ScrollView>
        </SafeAreaView>
</View>
  );
};

export default SoulContractScreen;

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  // Hero
  heroCard: {
    borderRadius: 20,
    padding: 24,
    paddingTop: 20,
    marginBottom: 4,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
  },
  heroText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.82,
    marginTop: 14,
    marginBottom: 14,
    fontStyle: 'italic',
  },
  birthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: ACCENT + '15',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ACCENT + '30',
  },
  birthText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  setBirthBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  // Placeholder
  placeholderCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  placeholderTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderDesc: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  placeholderBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
  },
  // Map cards
  mapCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  mapLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 3,
  },
  mapName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  mapDesc: {
    fontSize: 13,
    lineHeight: 21,
    opacity: 0.88,
  },
  debtBadge: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  // Life Path card
  lifePathCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  lifePathName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  lifePathGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  lpTag: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  shadowGiftRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  shadowGiftItem: {
    flex: 1,
    padding: 12,
  },
  sgLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  sgValue: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  sgDivider: {
    width: 1,
  },
  // Section intro
  sectionIntro: {
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 14,
    opacity: 0.80,
    fontStyle: 'italic',
  },
  // Lesson cards
  lessonCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
  },
  lessonBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: ACCENT + '20',
    borderWidth: 1.5,
    borderColor: ACCENT + '50',
    alignItems: 'center', justifyContent: 'center',
  },
  lessonLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 3,
  },
  lessonText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  // Archetype
  archetypeCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  archetypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  archetypeIcon: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  archetypeName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  archetypeGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  attrTag: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  // AI section
  aiBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  aiReadingCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  aiReadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  aiReadingLabel: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  aiReadingText: {
    fontSize: 14,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  // Protection
  protectionCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  protectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  protectionText: {
    fontSize: 13,
    lineHeight: 21,
    opacity: 0.85,
  },
});
