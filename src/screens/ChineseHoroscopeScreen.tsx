// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  Path,
  Polygon,
  RadialGradient as SvgRadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Compass,
  Crown,
  Droplets,
  Eye,
  Flame,
  Globe,
  Heart,
  Leaf,
  Moon,
  Mountain,
  Sparkles,
  Star,
  Sun,
  TrendingUp,
  Users,
  Wind,
  X,
  Zap,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { CelestialBackdrop } from '../components/CelestialBackdrop';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { DateWheelPicker } from '../components/DateWheelPicker';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ACCENT = '#C9272D';
const GOLD = '#CEAE72';
const DEEP_RED = '#8B1A1A';
const CRIMSON = '#DC143C';

// ─── DATA: 12 ANIMALS ────────────────────────────────────────────────────────
const ANIMALS = [
  {
    id: 'rat',
    pl: 'Szczur',
    en: 'Rat',
    emoji: '🐀',
    element: 'water',
    yin_yang: 'Yang',
    rulingHours: '23:00 – 01:00',
    years: [1900, 1912, 1924, 1936, 1948, 1960, 1972, 1984, 1996, 2008, 2020, 2032],
    luckyNumbers: [2, 3, 6],
    unluckyNumbers: [5, 9],
    luckyColors: ['Niebieski', 'Złoty', 'Zielony'],
    unluckyColors: ['Żółty', 'Brązowy'],
    bestDirections: ['Północ', 'Północny-Wschód'],
    traits: ['Inteligentny', 'Adaptacyjny', 'Charyzmatyczny', 'Pracowity', 'Oszczędny', 'Przewidujący'],
    strengths: ['Doskonała pamięć', 'Zdolności przywódcze', 'Szybkie myślenie', 'Lojalność wobec bliskich'],
    challenges: ['Nadmierna krytyczność', 'Skłonność do plotek', 'Niepokój finansowy', 'Trudności z zaufaniem'],
    famous: ['William Shakespeare', 'Katy Perry', 'Prince Harry'],
    bestWith: ['dragon', 'monkey', 'ox'],
    worstWith: ['horse', 'rooster'],
    secretFriend: 'ox',
    trine: ['dragon', 'monkey'],
    description: 'Szczur to symbol inteligencji i zaradności. Osoby urodzone pod tym znakiem mają wyjątkową zdolność adaptacji i potrafią znaleźć rozwiązanie w każdej sytuacji.',
  },
  {
    id: 'ox',
    pl: 'Wół',
    en: 'Ox',
    emoji: '🐂',
    element: 'earth',
    yin_yang: 'Yin',
    rulingHours: '01:00 – 03:00',
    years: [1901, 1913, 1925, 1937, 1949, 1961, 1973, 1985, 1997, 2009, 2021, 2033],
    luckyNumbers: [1, 4, 9],
    unluckyNumbers: [3, 6],
    luckyColors: ['Biały', 'Żółty', 'Zielony'],
    unluckyColors: ['Niebieski', 'Czerwony'],
    bestDirections: ['Wschód', 'Północ'],
    traits: ['Wytrwały', 'Niezawodny', 'Silny', 'Metodyczny', 'Cierpliwy', 'Uczciwy'],
    strengths: ['Niezwykła siła woli', 'Odpowiedzialność', 'Zdolności organizacyjne', 'Wierność'],
    challenges: ['Upór', 'Brak elastyczności', 'Skłonność do chowania urazy', 'Powolne przystosowanie'],
    famous: ['Barack Obama', 'Princess Diana', 'Vincent van Gogh'],
    bestWith: ['rat', 'snake', 'rooster'],
    worstWith: ['tiger', 'dragon', 'horse', 'sheep'],
    secretFriend: 'rat',
    trine: ['snake', 'rooster'],
    description: 'Wół symbolizuje ciężką pracę i wytrwałość. Niezłomni i solidni, osiągają cele dzięki cierpliwości i determinacji.',
  },
  {
    id: 'tiger',
    pl: 'Tygrys',
    en: 'Tiger',
    emoji: '🐅',
    element: 'wood',
    yin_yang: 'Yang',
    rulingHours: '03:00 – 05:00',
    years: [1902, 1914, 1926, 1938, 1950, 1962, 1974, 1986, 1998, 2010, 2022, 2034],
    luckyNumbers: [1, 3, 4],
    unluckyNumbers: [6, 7, 8],
    luckyColors: ['Niebieski', 'Szary', 'Pomarańczowy'],
    unluckyColors: ['Złoty', 'Srebrny', 'Brązowy'],
    bestDirections: ['Południe', 'Wschód'],
    traits: ['Odważny', 'Pewny siebie', 'Charyzmatyczny', 'Ambicjonalny', 'Nieustępliwy', 'Szczodry'],
    strengths: ['Naturalne przywództwo', 'Odwaga w działaniu', 'Instynkt ochrony', 'Silna intuicja'],
    challenges: ['Impulsywność', 'Zbytnia pewność siebie', 'Trudność w słuchaniu', 'Szybkie znudzenie'],
    famous: ['Leonardo DiCaprio', 'Marilyn Monroe', 'Tom Cruise'],
    bestWith: ['horse', 'dog', 'pig'],
    worstWith: ['ox', 'tiger', 'snake', 'monkey'],
    secretFriend: 'pig',
    trine: ['horse', 'dog'],
    description: 'Tygrys to symbol odwagi i siły. Osoby urodzone pod tym znakiem przyciągają uwagę swoją energią i naturalnymi zdolnościami przywódczymi.',
  },
  {
    id: 'rabbit',
    pl: 'Królik',
    en: 'Rabbit',
    emoji: '🐇',
    element: 'wood',
    yin_yang: 'Yin',
    rulingHours: '05:00 – 07:00',
    years: [1903, 1915, 1927, 1939, 1951, 1963, 1975, 1987, 1999, 2011, 2023, 2035],
    luckyNumbers: [3, 4, 6],
    unluckyNumbers: [1, 7, 8],
    luckyColors: ['Różowy', 'Fioletowy', 'Czerwony'],
    unluckyColors: ['Ciemnożółty', 'Biały'],
    bestDirections: ['Wschód', 'Południe'],
    traits: ['Elegancki', 'Dyplomatyczny', 'Współczujący', 'Skrupulatny', 'Spokojny', 'Artystyczny'],
    strengths: ['Subtelna dyplomacja', 'Zdolności artystyczne', 'Empatia', 'Dobry smak estetyczny'],
    challenges: ['Unikanie konfliktów', 'Nadmierna wrażliwość', 'Melancholia', 'Brak asertywności'],
    famous: ['Albert Einstein', 'Angelina Jolie', 'Tiger Woods'],
    bestWith: ['sheep', 'monkey', 'dog', 'pig'],
    worstWith: ['snake', 'rooster'],
    secretFriend: 'dog',
    trine: ['sheep', 'pig'],
    description: 'Królik symbolizuje łaskę i spokój. Znani z dyplomacji i elegancji, potrafią tworzyć harmonijne otoczenie wokół siebie.',
  },
  {
    id: 'dragon',
    pl: 'Smok',
    en: 'Dragon',
    emoji: '🐉',
    element: 'earth',
    yin_yang: 'Yang',
    rulingHours: '07:00 – 09:00',
    years: [1904, 1916, 1928, 1940, 1952, 1964, 1976, 1988, 2000, 2012, 2024, 2036],
    luckyNumbers: [1, 6, 7],
    unluckyNumbers: [3, 8],
    luckyColors: ['Złoty', 'Srebrny', 'Szary'],
    unluckyColors: ['Niebieski', 'Zielony'],
    bestDirections: ['Zachód', 'Północny-Zachód'],
    traits: ['Majestatyczny', 'Energiczny', 'Inteligentny', 'Entuzjastyczny', 'Perfekcjonistyczny', 'Szczodry'],
    strengths: ['Wyjątkowa charyzma', 'Kreatywność', 'Determinacja', 'Zdolność inspirowania innych'],
    challenges: ['Niecierpliwość', 'Dominowanie', 'Perfekcjonizm', 'Trudność z porażką'],
    famous: ['Bruce Lee', 'Keanu Reeves', 'Rihanna'],
    bestWith: ['rat', 'monkey', 'rooster'],
    worstWith: ['ox', 'rabbit', 'dragon', 'dog'],
    secretFriend: 'rooster',
    trine: ['rat', 'monkey'],
    description: 'Smok to jedyne mityczne stworzenie w chińskim zodiaku — symbol siły, szczęścia i sukcesu. Osoby urodzone pod tym znakiem emanują wyjątkową energią.',
  },
  {
    id: 'snake',
    pl: 'Wąż',
    en: 'Snake',
    emoji: '🐍',
    element: 'fire',
    yin_yang: 'Yin',
    rulingHours: '09:00 – 11:00',
    years: [1905, 1917, 1929, 1941, 1953, 1965, 1977, 1989, 2001, 2013, 2025, 2037],
    luckyNumbers: [2, 8, 9],
    unluckyNumbers: [1, 6, 7],
    luckyColors: ['Czarny', 'Czerwony', 'Żółty'],
    unluckyColors: ['Biały', 'Złoty', 'Brązowy'],
    bestDirections: ['Południe', 'Północny-Wschód'],
    traits: ['Mądry', 'Intuicyjny', 'Elegancki', 'Analityczny', 'Tajemniczy', 'Uparty'],
    strengths: ['Głęboka intuicja', 'Strategiczne myślenie', 'Zdolności analityczne', 'Naturalna elegancja'],
    challenges: ['Zazdrość', 'Podejrzliwość', 'Chłód emocjonalny', 'Mściwość'],
    famous: ['Abraham Lincoln', 'Audrey Hepburn', 'Kim Kardashian'],
    bestWith: ['ox', 'rooster'],
    worstWith: ['tiger', 'rabbit', 'snake', 'sheep', 'pig'],
    secretFriend: 'monkey',
    trine: ['ox', 'rooster'],
    description: 'Wąż symbolizuje mądrość i intuicję. Te tajemnicze osoby posiadają głęboką wiedzę i potrafią dostrzec to, czego inni nie widzą.',
  },
  {
    id: 'horse',
    pl: 'Koń',
    en: 'Horse',
    emoji: '🐎',
    element: 'fire',
    yin_yang: 'Yang',
    rulingHours: '11:00 – 13:00',
    years: [1906, 1918, 1930, 1942, 1954, 1966, 1978, 1990, 2002, 2014, 2026, 2038],
    luckyNumbers: [2, 3, 7],
    unluckyNumbers: [1, 5, 6],
    luckyColors: ['Żółty', 'Zielony'],
    unluckyColors: ['Biały', 'Złoty', 'Niebieski'],
    bestDirections: ['Południe', 'Zachód'],
    traits: ['Wolny', 'Żywiołowy', 'Towarzyski', 'Niezależny', 'Optymistyczny', 'Otwarty'],
    strengths: ['Entuzjazm życiowy', 'Zdolności komunikacyjne', 'Silna intuicja', 'Odwaga w działaniu'],
    challenges: ['Niecierpliwość', 'Impulsywność', 'Egocentryzm', 'Brak wytrwałości'],
    famous: ['Freddie Mercury', 'Clint Eastwood', 'Emma Watson'],
    bestWith: ['tiger', 'sheep', 'dog'],
    worstWith: ['rat', 'ox', 'horse'],
    secretFriend: 'sheep',
    trine: ['tiger', 'dog'],
    description: 'Koń symbolizuje wolność i energię. Osoby urodzone pod tym znakiem kochają przygody i mają naturalne zdolności do pracy z ludźmi.',
  },
  {
    id: 'sheep',
    pl: 'Koza',
    en: 'Goat',
    emoji: '🐐',
    element: 'earth',
    yin_yang: 'Yin',
    rulingHours: '13:00 – 15:00',
    years: [1907, 1919, 1931, 1943, 1955, 1967, 1979, 1991, 2003, 2015, 2027, 2039],
    luckyNumbers: [2, 7, 9],
    unluckyNumbers: [3, 4, 6],
    luckyColors: ['Zielony', 'Czerwony', 'Fioletowy'],
    unluckyColors: ['Złoty', 'Kawowy', 'Ciemnobrązowy'],
    bestDirections: ['Północ', 'Wschód'],
    traits: ['Kreatywny', 'Troskliwy', 'Empatyczny', 'Pokojowy', 'Artystyczny', 'Marzycielski'],
    strengths: ['Twórcza wyobraźnia', 'Empatia i współczucie', 'Zdolności artystyczne', 'Wrażliwość'],
    challenges: ['Pesymizm', 'Uzależnienie od innych', 'Brak asertywności', 'Niska pewność siebie'],
    famous: ['Steve Jobs', 'Michelangelo', 'Nicole Kidman'],
    bestWith: ['rabbit', 'horse', 'pig'],
    worstWith: ['rat', 'ox', 'dog'],
    secretFriend: 'horse',
    trine: ['rabbit', 'pig'],
    description: 'Koza symbolizuje kreatywność i delikatność. Te wrażliwe osoby mają duszy artysty i naturalny talent do tworzenia piękna.',
  },
  {
    id: 'monkey',
    pl: 'Małpa',
    en: 'Monkey',
    emoji: '🐒',
    element: 'metal',
    yin_yang: 'Yang',
    rulingHours: '15:00 – 17:00',
    years: [1908, 1920, 1932, 1944, 1956, 1968, 1980, 1992, 2004, 2016, 2028, 2040],
    luckyNumbers: [1, 7, 8],
    unluckyNumbers: [2, 5, 9],
    luckyColors: ['Biały', 'Złoty', 'Niebieski'],
    unluckyColors: ['Czerwony', 'Różowy'],
    bestDirections: ['Północ', 'Wschód'],
    traits: ['Pomysłowy', 'Dowcipny', 'Inteligentny', 'Elastyczny', 'Ciekawski', 'Wesoły'],
    strengths: ['Błyskotliwa inteligencja', 'Zdolność rozwiązywania problemów', 'Elastyczność', 'Dowcip'],
    challenges: ['Niecierpliwość', 'Oportunizm', 'Nieukończone projekty', 'Manipulacja'],
    famous: ['Will Smith', 'Daniel Craig', 'Jennifer Aniston'],
    bestWith: ['rat', 'dragon', 'snake'],
    worstWith: ['tiger', 'pig'],
    secretFriend: 'snake',
    trine: ['rat', 'dragon'],
    description: 'Małpa symbolizuje inteligencję i kreatywność. Niezwykle pomysłowe osoby, które potrafią znaleźć wyjście z każdej sytuacji z uśmiechem.',
  },
  {
    id: 'rooster',
    pl: 'Kogut',
    en: 'Rooster',
    emoji: '🐓',
    element: 'metal',
    yin_yang: 'Yin',
    rulingHours: '17:00 – 19:00',
    years: [1909, 1921, 1933, 1945, 1957, 1969, 1981, 1993, 2005, 2017, 2029, 2041],
    luckyNumbers: [5, 7, 8],
    unluckyNumbers: [1, 3, 9],
    luckyColors: ['Złoty', 'Brązowy', 'Żółty'],
    unluckyColors: ['Czerwony', 'Zielony'],
    bestDirections: ['Zachód', 'Południe-Zachód'],
    traits: ['Precyzyjny', 'Zdyscyplinowany', 'Pracowity', 'Szczery', 'Obserwator', 'Ambitny'],
    strengths: ['Niezwykła dokładność', 'Zdolność obserwacji', 'Zaangażowanie w pracę', 'Szczerość'],
    challenges: ['Nadmierna krytyczność', 'Arogancja', 'Skłonność do chwalenia się', 'Nieelastyczność'],
    famous: ['Beyoncé', 'Britney Spears', 'Matthew McConaughey'],
    bestWith: ['ox', 'snake', 'dragon'],
    worstWith: ['rat', 'rabbit', 'horse', 'rooster', 'dog'],
    secretFriend: 'dragon',
    trine: ['ox', 'snake'],
    description: 'Kogut symbolizuje pewność siebie i obserwację. Te przezorne osoby mają wyjątkową zdolność dostrzegania szczegółów i dążenia do doskonałości.',
  },
  {
    id: 'dog',
    pl: 'Pies',
    en: 'Dog',
    emoji: '🐕',
    element: 'earth',
    yin_yang: 'Yang',
    rulingHours: '19:00 – 21:00',
    years: [1910, 1922, 1934, 1946, 1958, 1970, 1982, 1994, 2006, 2018, 2030, 2042],
    luckyNumbers: [3, 4, 9],
    unluckyNumbers: [1, 6, 7],
    luckyColors: ['Zielony', 'Czerwony', 'Fioletowy'],
    unluckyColors: ['Niebieski', 'Złoty'],
    bestDirections: ['Wschód', 'Południe'],
    traits: ['Lojalny', 'Sprawiedliwy', 'Szczery', 'Skromny', 'Opiekuńczy', 'Rozważny'],
    strengths: ['Absolutna lojalność', 'Silne poczucie sprawiedliwości', 'Empatia', 'Niezawodność'],
    challenges: ['Nadmierne martwienie się', 'Skłonność do cynizmu', 'Upartość', 'Izolacja'],
    famous: ['Madonna', 'Michael Jackson', 'Donald Trump'],
    bestWith: ['rabbit', 'tiger', 'horse'],
    worstWith: ['ox', 'sheep', 'rooster', 'dragon'],
    secretFriend: 'rabbit',
    trine: ['tiger', 'horse'],
    description: 'Pies symbolizuje lojalność i wierność. Osoby urodzone pod tym znakiem mają silne poczucie sprawiedliwości i są zawsze gotowe stanąć w obronie słabszych.',
  },
  {
    id: 'pig',
    pl: 'Świnia',
    en: 'Pig',
    emoji: '🐷',
    element: 'water',
    yin_yang: 'Yin',
    rulingHours: '21:00 – 23:00',
    years: [1911, 1923, 1935, 1947, 1959, 1971, 1983, 1995, 2007, 2019, 2031, 2043],
    luckyNumbers: [2, 5, 8],
    unluckyNumbers: [1, 3, 9],
    luckyColors: ['Żółty', 'Szary', 'Złoty', 'Brązowy'],
    unluckyColors: ['Czerwony', 'Niebieski', 'Zielony'],
    bestDirections: ['Wschód', 'Południe-Zachód'],
    traits: ['Szczodry', 'Uczciwy', 'Towarzyski', 'Spokojny', 'Przyjazny', 'Naiwny'],
    strengths: ['Wielka hojność', 'Szczerość i uczciwość', 'Pozytywne nastawienie', 'Zdolność do radości'],
    challenges: ['Naiwność', 'Materializm', 'Przesadna ufność', 'Upór'],
    famous: ['Arnold Schwarzenegger', 'Elton John', 'Hillary Clinton'],
    bestWith: ['tiger', 'rabbit', 'sheep'],
    worstWith: ['snake', 'monkey'],
    secretFriend: 'tiger',
    trine: ['rabbit', 'sheep'],
    description: 'Świnia symbolizuje szczodrość i uczciwość. Te życzliwe osoby mają dobre serce i potrafią cieszyć się życiem pełną piersią.',
  },
];

// ─── DATA: 5 ELEMENTS ────────────────────────────────────────────────────────
const ELEMENTS = [
  {
    id: 'wood',
    pl: 'Drewno',
    en: 'Wood',
    symbol: '木',
    color: '#4CAF50',
    lightColor: '#81C784',
    season: 'Wiosna',
    direction: 'Wschód',
    organ: 'Wątroba i Woreczek żółciowy',
    emotion: 'Gniew / Życzliwość',
    virtue: 'Życzliwość (Ren)',
    taste: 'Kwaśny',
    planet: 'Jowisz',
    years: [4, 5], // last digit of year
    qualities: ['Wzrost i ekspansja', 'Twórczość i wizja', 'Elastyczność i adaptacja', 'Naturalna siła'],
    guidance: 'Rok Drewna przynosi czas wzrostu i nowych początków. Siej nasiona projektów i pozwól im rosnąć naturalnym tempem.',
  },
  {
    id: 'fire',
    pl: 'Ogień',
    en: 'Fire',
    symbol: '火',
    color: '#FF5722',
    lightColor: '#FF8A65',
    season: 'Lato',
    direction: 'Południe',
    organ: 'Serce i Jelito cienkie',
    emotion: 'Radość / Miłość',
    virtue: 'Przyzwoitość (Li)',
    taste: 'Gorzki',
    planet: 'Mars',
    years: [6, 7],
    qualities: ['Pasja i entuzjazm', 'Dynamizm i energia', 'Iluminacja i oświecenie', 'Siła transformacji'],
    guidance: 'Rok Ognia to czas pasji i działania. Podążaj za sercem i nie bój się wyrażać swojej prawdy.',
  },
  {
    id: 'earth',
    pl: 'Ziemia',
    en: 'Earth',
    symbol: '土',
    color: '#FFC107',
    lightColor: '#FFD54F',
    season: 'Środek roku (przejścia)',
    direction: 'Centrum',
    organ: 'Śledziona i Żołądek',
    emotion: 'Zamyślenie / Empatia',
    virtue: 'Wiarygodność (Xin)',
    taste: 'Słodki',
    planet: 'Saturn',
    years: [8, 9],
    qualities: ['Stabilność i niezawodność', 'Troskliwość i opiekuńczość', 'Praktyczność', 'Centrowanie'],
    guidance: 'Rok Ziemi przynosi stabilność i fundamenty. Buduj mocne podstawy i dbaj o bliskie relacje.',
  },
  {
    id: 'metal',
    pl: 'Metal',
    en: 'Metal',
    symbol: '金',
    color: '#9E9E9E',
    lightColor: '#BDBDBD',
    season: 'Jesień',
    direction: 'Zachód',
    organ: 'Płuca i Jelito grube',
    emotion: 'Smutek / Odwaga',
    virtue: 'Sprawiedliwość (Yi)',
    taste: 'Ostry',
    planet: 'Wenus',
    years: [0, 1],
    qualities: ['Precyzja i doskonałość', 'Siła woli i determinacja', 'Elegancja i piękno', 'Sprawiedliwość'],
    guidance: 'Rok Metalu to czas porządkowania i doskonalenia. Skupiaj się na jakości, nie ilości.',
  },
  {
    id: 'water',
    pl: 'Woda',
    en: 'Water',
    symbol: '水',
    color: '#2196F3',
    lightColor: '#64B5F6',
    season: 'Zima',
    direction: 'Północ',
    organ: 'Nerki i Pęcherz moczowy',
    emotion: 'Strach / Mądrość',
    virtue: 'Mądrość (Zhi)',
    taste: 'Słony',
    planet: 'Merkury',
    years: [2, 3],
    qualities: ['Głęboka mądrość', 'Intuicja i percepcja', 'Przepływ i adaptacja', 'Duchowe połączenie'],
    guidance: 'Rok Wody przynosi głębię i refleksję. Czas na medytację, intuicję i wewnętrzną mądrość.',
  },
];

// ─── DATA: COMPATIBILITY MATRIX ──────────────────────────────────────────────
// Format: [love, friendship, work, communication] each 0-100
const COMPAT_MATRIX: Record<string, Record<string, [number, number, number, number]>> = {
  rat:     { rat: [75,70,80,72], ox: [92,88,85,90], tiger: [45,50,55,48], rabbit: [60,65,70,62], dragon: [95,90,92,88], snake: [70,72,75,68], horse: [30,35,40,32], sheep: [60,58,62,55], monkey: [90,88,92,85], rooster: [55,50,58,52], dog: [65,70,68,72], pig: [80,82,75,78] },
  ox:      { rat: [92,88,85,90], ox: [60,65,70,62], tiger: [30,35,38,32], rabbit: [65,70,68,72], dragon: [45,48,52,46], snake: [90,88,92,85], horse: [35,32,38,30], sheep: [40,38,42,36], monkey: [65,68,70,72], rooster: [88,90,85,92], dog: [70,72,68,75], pig: [75,78,72,80] },
  tiger:   { rat: [45,50,55,48], ox: [30,35,38,32], tiger: [55,58,60,52], rabbit: [70,72,75,68], dragon: [65,68,70,72], snake: [40,42,45,38], horse: [88,90,85,92], sheep: [60,62,58,65], monkey: [35,38,40,32], rooster: [50,48,52,46], dog: [90,88,92,85], pig: [80,82,78,85] },
  rabbit:  { rat: [60,65,70,62], ox: [65,70,68,72], tiger: [70,72,75,68], rabbit: [72,75,68,70], dragon: [55,52,58,50], snake: [45,48,50,42], horse: [70,72,75,68], sheep: [88,90,85,92], monkey: [80,78,82,75], rooster: [42,45,48,40], dog: [90,88,92,85], pig: [85,88,82,90] },
  dragon:  { rat: [95,90,92,88], ox: [45,48,52,46], tiger: [65,68,70,72], rabbit: [55,52,58,50], dragon: [68,65,70,62], snake: [72,75,78,70], horse: [70,72,75,68], sheep: [60,58,62,55], monkey: [90,88,92,85], rooster: [88,90,85,92], dog: [40,42,45,38], pig: [75,78,72,80] },
  snake:   { rat: [70,72,75,68], ox: [90,88,92,85], tiger: [40,42,45,38], rabbit: [45,48,50,42], dragon: [72,75,78,70], snake: [62,65,68,60], horse: [50,48,52,46], sheep: [45,42,48,40], monkey: [85,88,82,90], rooster: [88,90,85,92], dog: [60,62,58,65], pig: [35,38,40,32] },
  horse:   { rat: [30,35,40,32], ox: [35,32,38,30], tiger: [88,90,85,92], rabbit: [70,72,75,68], dragon: [70,72,75,68], snake: [50,48,52,46], horse: [60,62,65,58], sheep: [88,90,85,92], monkey: [65,68,70,72], rooster: [48,45,52,42], dog: [90,88,92,85], pig: [75,78,72,80] },
  sheep:   { rat: [60,58,62,55], ox: [40,38,42,36], tiger: [60,62,58,65], rabbit: [88,90,85,92], dragon: [60,58,62,55], snake: [45,42,48,40], horse: [88,90,85,92], sheep: [70,72,68,75], monkey: [72,75,78,70], rooster: [48,45,52,42], dog: [40,38,42,36], pig: [85,88,82,90] },
  monkey:  { rat: [90,88,92,85], ox: [65,68,70,72], tiger: [35,38,40,32], rabbit: [80,78,82,75], dragon: [90,88,92,85], snake: [85,88,82,90], horse: [65,68,70,72], sheep: [72,75,78,70], monkey: [72,68,75,65], rooster: [55,52,58,50], dog: [60,62,65,58], pig: [40,42,45,38] },
  rooster: { rat: [55,50,58,52], ox: [88,90,85,92], tiger: [50,48,52,46], rabbit: [42,45,48,40], dragon: [88,90,85,92], snake: [88,90,85,92], horse: [48,45,52,42], sheep: [48,45,52,42], monkey: [55,52,58,50], rooster: [62,65,68,60], dog: [40,38,42,36], pig: [65,68,70,72] },
  dog:     { rat: [65,70,68,72], ox: [70,72,68,75], tiger: [90,88,92,85], rabbit: [90,88,92,85], dragon: [40,42,45,38], snake: [60,62,58,65], horse: [90,88,92,85], sheep: [40,38,42,36], monkey: [60,62,65,58], rooster: [40,38,42,36], dog: [72,75,68,70], pig: [80,82,78,85] },
  pig:     { rat: [80,82,75,78], ox: [75,78,72,80], tiger: [80,82,78,85], rabbit: [85,88,82,90], dragon: [75,78,72,80], snake: [35,38,40,32], horse: [75,78,72,80], sheep: [85,88,82,90], monkey: [40,42,45,38], rooster: [65,68,70,72], dog: [80,82,78,85], pig: [70,72,75,68] },
};

// ─── DATA: PROVERBS ──────────────────────────────────────────────────────────
const PROVERBS = [
  {
    chinese: '千里之行，始於足下',
    pinyin: 'Qiān lǐ zhī xíng, shǐ yú zú xià',
    polish: 'Podróż tysiąca mil zaczyna się od jednego kroku.',
    explanation: 'Nawet największe przedsięwzięcia zaczynają się od małych działań. Nie czekaj na idealne warunki — zacznij teraz.',
    source: 'Laozi, Tao Te Ching',
  },
  {
    chinese: '學如逆水行舟，不進則退',
    pinyin: 'Xué rú nì shuǐ xíng zhōu, bù jìn zé tuì',
    polish: 'Nauka jest jak wiosłowanie pod prąd — jeśli nie posuwasz się naprzód, cofasz się.',
    explanation: 'Wiedza wymaga ciągłego wysiłku. Stagnacja w nauce jest w rzeczywistości cofaniem się.',
    source: 'Przysłowie ludowe',
  },
  {
    chinese: '知己知彼，百戰不殆',
    pinyin: 'Zhī jǐ zhī bǐ, bǎi zhàn bù dài',
    polish: 'Poznaj siebie i swojego przeciwnika, a wygrasz sto bitew.',
    explanation: 'Samoświadomość i rozumienie innych są kluczem do sukcesu w każdej dziedzinie życia.',
    source: 'Sun Tzu, Sztuka Wojny',
  },
  {
    chinese: '不經一番寒徹骨，焉得梅花撲鼻香',
    pinyin: 'Bù jīng yī fān hán chè gǔ, yān dé méihuā pū bí xiāng',
    polish: 'Bez mrozu przeszywającego kości, czy kwiat śliwy roztaczałby swój zapach?',
    explanation: 'Trudności i wyzwania kształtują charakter i prowadzą do prawdziwego rozkwitu.',
    source: 'Poeta Huang Boru',
  },
  {
    chinese: '吃一塹，長一智',
    pinyin: 'Chī yī qiàn, zhǎng yī zhì',
    polish: 'Każdy upadek uczy mądrości.',
    explanation: 'Błędy nie są porażkami — są nauczycielami. Każde niepowodzenie niesie ze sobą cenną lekcję.',
    source: 'Przysłowie ludowe',
  },
  {
    chinese: '物以類聚，人以群分',
    pinyin: 'Wù yǐ lèi jù, rén yǐ qún fēn',
    polish: 'Podobne przyciąga podobne; ludzie grupują się według charakteru.',
    explanation: 'Otaczasz się ludźmi podobnymi do siebie. Chcąc zmienić swoje otoczenie, zacznij od zmiany siebie.',
    source: 'I Ching (Księga Przemian)',
  },
  {
    chinese: '前事不忘，後事之師',
    pinyin: 'Qián shì bù wàng, hòu shì zhī shī',
    polish: 'Pamiętając przeszłość, mamy nauczyciela na przyszłość.',
    explanation: 'Historia jest największym nauczycielem. Refleksja nad przeszłością chroni przed powtarzaniem błędów.',
    source: 'Strategia i historia dynastii',
  },
  {
    chinese: '心靜自然涼',
    pinyin: 'Xīn jìng zìrán liáng',
    polish: 'Spokojne serce samo w sobie jest chłodne.',
    explanation: 'Spokój umysłu daje nam ochronę przed chaosem zewnętrznego świata. Wewnętrzna cisza jest prawdziwym schronieniem.',
    source: 'Tradycja Chan (Zen)',
  },
];

// ─── DATA: I CHING TRIGRAMS ───────────────────────────────────────────────────
const TRIGRAMS = [
  { name: 'Qian', pl: 'Niebo', symbol: '☰', lines: [1,1,1], meaning: 'Niebo, siła, ojciec, kreacja', element: 'metal', direction: 'Północno-Zachód' },
  { name: 'Kun', pl: 'Ziemia', symbol: '☷', lines: [0,0,0], meaning: 'Ziemia, receptywność, matka, odżywianie', element: 'earth', direction: 'Południowo-Zachód' },
  { name: 'Zhen', pl: 'Grzmot', symbol: '☳', lines: [1,0,0], meaning: 'Grzmot, pobudzenie, ruch, inicjatywa', element: 'wood', direction: 'Wschód' },
  { name: 'Xun', pl: 'Wiatr', symbol: '☴', lines: [0,1,1], meaning: 'Wiatr, łagodność, przenikliwość, przenikanie', element: 'wood', direction: 'Południowo-Wschód' },
  { name: 'Kan', pl: 'Woda', symbol: '☵', lines: [0,1,0], meaning: 'Woda, niebezpieczeństwo, głębia, księżyc', element: 'water', direction: 'Północ' },
  { name: 'Li', pl: 'Ogień', symbol: '☲', lines: [1,0,1], meaning: 'Ogień, jasność, piękno, słońce', element: 'fire', direction: 'Południe' },
  { name: 'Gen', pl: 'Góra', symbol: '☶', lines: [0,0,1], meaning: 'Góra, spokój, zatrzymanie, medytacja', element: 'earth', direction: 'Północno-Wschód' },
  { name: 'Dui', pl: 'Jezioro', symbol: '☱', lines: [1,1,0], meaning: 'Jezioro, radość, przyjemność, manifestacja', element: 'metal', direction: 'Zachód' },
];

// ─── DATA: MONTHLY ENERGY ────────────────────────────────────────────────────
const MONTH_ENERGIES = [
  { month: 'Sty', animal: 'ox', energy: 72, theme: 'Praca i fundamenty', lucky: false },
  { month: 'Lut', animal: 'tiger', energy: 85, theme: 'Odwaga i inicjatywa', lucky: true },
  { month: 'Mar', animal: 'rabbit', energy: 78, theme: 'Harmonia i spokój', lucky: false },
  { month: 'Kwi', animal: 'dragon', energy: 95, theme: 'Szczęście i sukces', lucky: true },
  { month: 'Maj', animal: 'snake', energy: 68, theme: 'Głęboka refleksja', lucky: false },
  { month: 'Cze', animal: 'horse', energy: 88, theme: 'Wolność i ekspansja', lucky: true },
  { month: 'Lip', animal: 'sheep', energy: 75, theme: 'Kreatywność i sztuka', lucky: false },
  { month: 'Sie', animal: 'monkey', energy: 82, theme: 'Innowacja i zmiany', lucky: true },
  { month: 'Wrz', animal: 'rooster', energy: 70, theme: 'Precyzja i analiza', lucky: false },
  { month: 'Paź', animal: 'dog', energy: 77, theme: 'Lojalność i ochrona', lucky: false },
  { month: 'Lis', animal: 'pig', energy: 90, theme: 'Dostatek i radość', lucky: true },
  { month: 'Gru', animal: 'rat', energy: 80, theme: 'Inteligencja i strategia', lucky: false },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────
function getAnimalFromYear(year: number): typeof ANIMALS[0] | null {
  if (!year || year < 1900) return null;
  const idx = (year - 1900) % 12;
  return ANIMALS[idx] ?? null;
}

function getElementFromYear(year: number): typeof ELEMENTS[0] | null {
  if (!year || year < 1900) return null;
  const lastDigit = year % 10;
  return ELEMENTS.find(e => e.years.includes(lastDigit)) ?? null;
}

function getCurrentChineseYear(): { year: number; animal: typeof ANIMALS[0]; element: typeof ELEMENTS[0] } {
  const now = new Date();
  const y = now.getFullYear();
  return {
    year: y,
    animal: getAnimalFromYear(y)!,
    element: getElementFromYear(y)!,
  };
}

function getDailyTrigram(): typeof TRIGRAMS[0] {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return TRIGRAMS[dayOfYear % 8];
}

function getCompatScore(a: string, b: string): number {
  const scores = COMPAT_MATRIX[a]?.[b];
  if (!scores) return 50;
  return Math.round((scores[0] + scores[1] + scores[2] + scores[3]) / 4);
}

function getElementColor(elementId: string): string {
  return ELEMENTS.find(e => e.id === elementId)?.color ?? GOLD;
}

// ─── LO SHU MAGIC SQUARE ─────────────────────────────────────────────────────
const LO_SHU = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];

// ─── ANIMAL 3D WIDGET ────────────────────────────────────────────────────────
const AnimalWidget3D = React.memo(({ animalId, accent, size = 200 }: { animalId: string; accent: string; size?: number }) => {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const pulse = useSharedValue(1);
  const glow  = useSharedValue(0.55);
  const spin  = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 2600 }), withTiming(1, { duration: 2600 })),
      -1, true,
    );
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1900 }), withTiming(0.4, { duration: 1900 })),
      -1, true,
    );
    spin.value = withRepeat(withTiming(360, { duration: 18000 }), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-22, Math.min(22, e.translationY * 0.14));
      tiltY.value = Math.max(-22, Math.min(22, e.translationX * 0.14));
    })
    .onEnd(() => {
      tiltX.value = withSpring(0, { damping: 8 });
      tiltY.value = withSpring(0, { damping: 8 });
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: pulse.value },
    ],
  }));

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
    opacity: 0.55,
  }));

  const innerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-spin.value * 0.6}deg` }],
    opacity: 0.4,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const animal = ANIMALS.find(a => a.id === animalId);
  const elColor = getElementColor(animal?.element ?? 'water');
  const S = size;
  const C = S / 2;
  const R1 = S * 0.46;  // outer ring
  const R2 = S * 0.38;  // middle ring
  const R3 = S * 0.28;  // inner circle

  // 12 tick marks on outer ring
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * Math.PI / 180;
    const r0 = R1 - 2;
    const r1l = i % 3 === 0 ? R1 - 8 : R1 - 5;
    return {
      x1: C + r0 * Math.cos(angle), y1: C + r0 * Math.sin(angle),
      x2: C + r1l * Math.cos(angle), y2: C + r1l * Math.sin(angle),
      major: i % 3 === 0,
    };
  });

  // 8 diamond ornaments on middle ring
  const diamonds = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 - 22.5) * Math.PI / 180;
    const x = C + R2 * Math.cos(angle);
    const y = C + R2 * Math.sin(angle);
    return { x, y, angle: i * 45 };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ width: S, height: S, alignItems: 'center', justifyContent: 'center' }, containerStyle]}>

        {/* Outer glow bloom */}
        <Animated.View style={[{
          position: 'absolute',
          width: S * 0.82,
          height: S * 0.82,
          borderRadius: S * 0.41,
          backgroundColor: accent + '18',
          shadowColor: accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 32,
          elevation: 16,
        }, glowStyle]} />

        {/* Element colour inner bloom */}
        <Animated.View style={[{
          position: 'absolute',
          width: S * 0.55,
          height: S * 0.55,
          borderRadius: S * 0.275,
          backgroundColor: elColor + '20',
          shadowColor: elColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 18,
        }, glowStyle]} />

        {/* Rotating outer ring (SVG) */}
        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, outerRingStyle]}>
          <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
            <Defs>
              <SvgRadialGradient id={`grad1_${animalId}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={accent} stopOpacity="0.5" />
                <Stop offset="100%" stopColor={accent} stopOpacity="0" />
              </SvgRadialGradient>
            </Defs>
            {/* Outer ring */}
            <Circle cx={C} cy={C} r={R1} fill="none" stroke={accent} strokeWidth="1.2" opacity="0.7" />
            {/* Tick marks */}
            {ticks.map((t, i) => (
              <Line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke={t.major ? GOLD : accent} strokeWidth={t.major ? 2 : 1} opacity={t.major ? 0.9 : 0.5}
              />
            ))}
            {/* Diamond ornaments */}
            {diamonds.map((d, i) => (
              <Polygon key={i}
                points={`${d.x},${d.y - 4} ${d.x + 3},${d.y} ${d.x},${d.y + 4} ${d.x - 3},${d.y}`}
                fill={i % 2 === 0 ? GOLD : accent} opacity="0.8"
              />
            ))}
          </Svg>
        </Animated.View>

        {/* Counter-rotating inner ring */}
        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, innerRingStyle]}>
          <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
            <Circle cx={C} cy={C} r={R2} fill="none" stroke={elColor} strokeWidth="1" strokeDasharray="4,6" opacity="0.6" />
            {/* 6 small stars on middle ring */}
            {Array.from({ length: 6 }, (_, i) => {
              const a = (i * 60 - 90) * Math.PI / 180;
              const x = C + R2 * Math.cos(a);
              const y = C + R2 * Math.sin(a);
              return <Circle key={i} cx={x} cy={y} r="2.5" fill={GOLD} opacity="0.85" />;
            })}
          </Svg>
        </Animated.View>

        {/* Static inner circle + gradient fill */}
        <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgRadialGradient id={`innerGrad_${animalId}`} cx="50%" cy="45%" r="50%">
              <Stop offset="0%" stopColor={accent} stopOpacity="0.28" />
              <Stop offset="60%" stopColor={elColor} stopOpacity="0.14" />
              <Stop offset="100%" stopColor="#000" stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>
          <Circle cx={C} cy={C} r={R3} fill={`url(#innerGrad_${animalId})`} />
          <Circle cx={C} cy={C} r={R3} fill="none" stroke={GOLD} strokeWidth="1.5" opacity="0.5" />
          {/* 4 cross-hair lines */}
          <Line x1={C - R3 + 6} y1={C} x2={C + R3 - 6} y2={C} stroke={GOLD} strokeWidth="0.5" opacity="0.3" />
          <Line x1={C} y1={C - R3 + 6} x2={C} y2={C + R3 - 6} stroke={GOLD} strokeWidth="0.5" opacity="0.3" />
        </Svg>

        {/* Large emoji — the star of the show */}
        <Text style={{
          fontSize: size * 0.38,
          lineHeight: size * 0.45,
          textAlign: 'center',
          // 3D shadow stack
          textShadowColor: accent,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 18,
        }}>
          {animal?.emoji ?? '✦'}
        </Text>

        {/* Animal name below emoji */}
        <View style={{
          position: 'absolute',
          bottom: S * 0.12,
          alignItems: 'center',
        }}>
          <Text style={{
            color: GOLD,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 3,
            opacity: 0.8,
          }}>
            {(animal?.id ?? '').toUpperCase()}
          </Text>
        </View>

      </Animated.View>
    </GestureDetector>
  );
});

// ─── ELEMENTS PENTAGON SVG ───────────────────────────────────────────────────
const ElementsPentagon = React.memo(({ userElementId, accent }: { userElementId: string; accent: string }) => {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 30000 }), -1, false);
  }, []);
  const rotStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  const SIZE = SW * 0.7;
  const CENTER = SIZE / 2;
  const RADIUS = SIZE * 0.36;
  const positions = [0, 1, 2, 3, 4].map(i => {
    const angle = (i * 72 - 90) * (Math.PI / 180);
    return { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) };
  });
  const elementOrder = ['wood', 'fire', 'earth', 'metal', 'water'];

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <Svg width={SIZE} height={SIZE}>
        {/* Destructive cycle (star pattern, inner) */}
        {[0,1,2,3,4].map(i => {
          const from = positions[i];
          const to = positions[(i + 2) % 5];
          return <Line key={`dest_${i}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#FF444422" strokeWidth="1.5" strokeDasharray="4,4"/>;
        })}
        {/* Generative cycle (pentagon) */}
        {[0,1,2,3,4].map(i => {
          const from = positions[i];
          const to = positions[(i + 1) % 5];
          const elColor = getElementColor(elementOrder[i]);
          return <Line key={`gen_${i}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={elColor} strokeWidth="2" opacity="0.7"/>;
        })}
        {/* Element nodes */}
        {elementOrder.map((elId, i) => {
          const pos = positions[i];
          const el = ELEMENTS.find(e => e.id === elId)!;
          const isUser = elId === userElementId;
          return (
            <React.Fragment key={elId}>
              <Circle cx={pos.x} cy={pos.y} r={isUser ? 28 : 22} fill={el.color + (isUser ? 'FF' : '40')} stroke={el.color} strokeWidth={isUser ? 2.5 : 1.5}/>
              <SvgText x={pos.x} y={pos.y + 5} textAnchor="middle" fontSize={isUser ? 18 : 15} fill="white" fontWeight={isUser ? 'bold' : 'normal'}>
                {el.symbol}
              </SvgText>
            </React.Fragment>
          );
        })}
        {/* Animated outer ring */}
        <Circle cx={CENTER} cy={CENTER} r={RADIUS + 18} fill="none" stroke={GOLD} strokeWidth="0.8" opacity="0.25" strokeDasharray="4,8"/>
      </Svg>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }, rotStyle]}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={CENTER} cy={CENTER} r={RADIUS + 12} fill="none" stroke={GOLD} strokeWidth="0.5" opacity="0.2" strokeDasharray="2,12"/>
        </Svg>
      </Animated.View>
    </View>
  );
});

// ─── ANIMATED ARC ────────────────────────────────────────────────────────────
const AnimatedArc = React.memo(({ score, color, size = 120, isLight }: { score: number; color: string; size?: number; isLight?: boolean }) => {
  const { t } = useTranslation();

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(score / 100, { duration: 1200 });
  }, [score]);

  const R = size * 0.4;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size/2} cy={size/2} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8}/>
        <AnimatedCircle
          cx={size/2} cy={size/2} r={R}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90, ${size/2}, ${size/2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Typography variant="heading" style={{ fontSize: 22, fontWeight: '700', color }}>{score}%</Typography>
        <Typography variant="micro" style={{ color: isLight ? 'rgba(37,29,22,0.6)' : 'rgba(255,255,255,0.6)', fontSize: 10 }}>{t('chineseHoroscope.zgodnosc', 'zgodność')}</Typography>
      </View>
    </View>
  );
});

// ─── LO SHU GRID ─────────────────────────────────────────────────────────────
const LoShuGrid = React.memo(({ accent }: { accent: string }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 168, alignSelf: 'center' }}>
    {LO_SHU.flat().map((num, i) => (
      <View key={i} style={{
        width: 52, height: 52,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: accent + '40',
        backgroundColor: num === 5 ? accent + '30' : 'rgba(255,255,255,0.05)',
      }}>
        <Typography variant="heading" style={{ fontSize: 20, fontWeight: '700', color: num === 5 ? accent : GOLD }}>{num}</Typography>
      </View>
    ))}
  </View>
));

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export const ChineseHoroscopeScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const { currentTheme, isLight, themeName: currentThemeName } = useTheme();
  const theme = currentTheme;

  const textColor = isLight ? '#1A1A2E' : '#F5EDD8';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(245,237,216,0.6)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.07)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)';
  const inputBg = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.08)';

  // Tab state
  const [activeTab, setActiveTab] = useState<'animal' | 'elements' | 'year' | 'compat' | 'wisdom'>('animal');

  // Animal tab state
  const [birthYearInput, setBirthYearInput] = useState(
    userData?.birthDate ? String(new Date(userData.birthDate).getFullYear()) : ''
  );
  // Birth date wheel picker for user (year drives animal calculation)
  const _initYear = userData?.birthDate ? new Date(userData.birthDate).getFullYear() : 1990;
  const [birthWheelDay,   setBirthWheelDay  ] = useState(1);
  const [birthWheelMonth, setBirthWheelMonth] = useState(1);
  const [birthWheelYear,  setBirthWheelYear ] = useState(_initYear);
  const [userAnimal, setUserAnimal] = useState<typeof ANIMALS[0] | null>(() => {
    if (userData?.birthDate) return getAnimalFromYear(new Date(userData.birthDate).getFullYear());
    return null;
  });
  const [userElement, setUserElement] = useState<typeof ELEMENTS[0] | null>(() => {
    if (userData?.birthDate) return getElementFromYear(new Date(userData.birthDate).getFullYear());
    return null;
  });
  const [expandedTrait, setExpandedTrait] = useState<number | null>(null);

  // "Dla kogoś" state
  const [forSomeone, setForSomeone] = useState(false);
  const [fsNameInput, setFsNameInput] = useState('');
  const [fsDayInput, setFsDayInput] = useState('');
  const [fsMonthInput, setFsMonthInput] = useState('');
  const [fsYearInput, setFsYearInput] = useState('');
  // DateWheelPicker state for "dla kogoś"
  const [fsPDay,   setFsPDay  ] = useState(1);
  const [fsPMonth, setFsPMonth] = useState(1);
  const [fsPYear,  setFsPYear ] = useState(1990);
  const [fsName, setFsName] = useState('');
  const [fsAnimal, setFsAnimal] = useState<typeof ANIMALS[0] | null>(null);
  const [showFsModal, setShowFsModal] = useState(false);

  // Elements tab
  const [expandedElement, setExpandedElement] = useState<string | null>(null);

  // Year tab
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Compatibility tab
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [aiCompatResult, setAiCompatResult] = useState('');
  const [aiCompatLoading, setAiCompatLoading] = useState(false);

  // Wisdom tab
  const [expandedProverb, setExpandedProverb] = useState<number | null>(null);
  const [expandedTrigram, setExpandedTrigram] = useState<number | null>(null);

  // Fortune tab
  const [fortunePeriod, setFortunePeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [fortuneResult, setFortuneResult] = useState<{ love: string; career: string; health: string; finance: string } | null>(null);
  const [fortuneLoading, setFortuneLoading] = useState(false);

  // Star button
  const isFav = isFavoriteItem('chinese_horoscope');

  const currentYear = getCurrentChineseYear();
  const dailyTrigram = getDailyTrigram();
  const activeAnimal = forSomeone ? fsAnimal : userAnimal;
  const activeElement = forSomeone && fsAnimal ? getElementFromYear(fsPYear || 0) : userElement;

  // Parse birth year
  const handleBirthYearSubmit = useCallback(() => {
    const y = parseInt(birthYearInput);
    if (y >= 1900 && y <= 2100) {
      const a = getAnimalFromYear(y);
      const e = getElementFromYear(y);
      setUserAnimal(a);
      setUserElement(e);
      HapticsService.notify();
    }
  }, [birthYearInput]);

  // "Dla kogoś" confirm
  const handleFsConfirm = useCallback(() => {
    if (!fsNameInput.trim() || !(fsPYear >= 1900)) return;
    const a = getAnimalFromYear(fsPYear);
    setFsAnimal(a);
    setFsName(fsNameInput.trim());
    // keep legacy string state in sync for any remaining usages
    setFsYearInput(String(fsPYear));
    setFsDayInput(String(fsPDay));
    setFsMonthInput(String(fsPMonth));
    setForSomeone(true);
    setShowFsModal(false);
    HapticsService.notify();
  }, [fsNameInput, fsPYear, fsPDay, fsPMonth]);

  const clearForSomeone = useCallback(() => {
    setForSomeone(false);
    setFsAnimal(null);
    setFsName('');
    setFsNameInput('');
    setFsDayInput('');
    setFsMonthInput('');
    setFsYearInput('');
  }, []);

  // Star toggle
  const handleStar = useCallback(() => {
    HapticsService.notify();
    if (isFav) {
      removeFavoriteItem('chinese_horoscope');
    } else {
      addFavoriteItem({ id: 'chinese_horoscope', label: 'Chiński Horoskop', route: 'ChineseHoroscope', params: {}, icon: 'Moon', color: ACCENT, addedAt: new Date().toISOString() });
    }
  }, [isFav, addFavoriteItem, removeFavoriteItem]);

  // AI Compatibility
  const handleAiCompat = useCallback(async () => {
    if (!activeAnimal || !selectedPartner) return;
    const partnerAnimal = ANIMALS.find(a => a.id === selectedPartner);
    if (!partnerAnimal) return;
    setAiCompatLoading(true);
    setAiCompatResult('');
    try {
      const messages = [
        {
          role: 'user' as const,
          content: `Jesteś mistrzem chińskiej astrologii. Dokonaj głębokiej analizy kompatybilności między znakiem ${activeAnimal.pl} (${activeAnimal.en}) a znakiem ${partnerAnimal.pl} (${partnerAnimal.en}) w chińskim zodiaku.

Uwzględnij:
- Element ${activeAnimal.pl}: ${activeAnimal.element}
- Element ${partnerAnimal.pl}: ${partnerAnimal.element}
- Yin/Yang obu znaków
- Dynamikę relacji miłosnej, przyjacielskiej i zawodowej
- Konkretne wskazówki jak poprawić relację

Napisz w języku użytkownika, głęboko i mądrze, około 150 słów.`,
        },
      ];
      const localizedMessages = i18n.language?.startsWith('en')
        ? [{
            role: 'user' as const,
            content: `You are a master of Chinese astrology. Create a deep compatibility reading between ${activeAnimal.en} (${activeAnimal.pl}) and ${partnerAnimal.en} (${partnerAnimal.pl}) in the Chinese zodiac.

Include:
- Element of ${activeAnimal.en}: ${activeAnimal.element}
- Element of ${partnerAnimal.en}: ${partnerAnimal.element}
- Yin/Yang polarity of both signs
- Romantic, friendly and professional dynamics
- Concrete ways to improve the relationship

Write in English, deep and wise, around 150 words.`,
          }]
        : messages;
      const result = await AiService.chatWithOracle(localizedMessages, i18n.language?.startsWith('en') ? 'en' : 'pl');
      setAiCompatResult(result);
    } catch {
      setAiCompatResult('Nie udało się połączyć z wyroczni. Spróbuj ponownie.');
    }
    setAiCompatLoading(false);
  }, [activeAnimal, selectedPartner]);

  const TABS = [
    { id: 'animal', label: 'Zwierzę', icon: Sparkles },
    { id: 'elements', label: 'Elementy', icon: Flame },
    { id: 'year', label: 'Rok', icon: Calendar },
    { id: 'compat', label: 'Zgodność', icon: Heart },
    { id: 'wisdom', label: 'Mądrość', icon: BookOpen },
    { id: 'fortune', label: 'Wyrocznia', icon: TrendingUp },
  ];

  // ── RENDER TABS ─────────────────────────────────────────────────────────────
  const renderAnimalTab = () => {
    const displayAnimal = activeAnimal;
    const displayElement = activeElement;

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* "Dla kogoś" banner */}
        {forSomeone && (
          <Animated.View entering={FadeInDown.duration(300)} style={[ch.fsBanner, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '60' }]}>
            <Users size={14} color={ACCENT} />
            <View style={{ flex: 1, marginLeft: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
              <Typography variant="body" style={{ color: ACCENT, fontSize: 13 }}>{t('chineseHoroscope.przegladas_dla', 'Przeglądasz dla:')}</Typography>
              <Typography variant="body" style={{ fontWeight: '700', color: ACCENT, fontSize: 13 }}>{fsName}</Typography>
            </View>
            <Pressable onPress={clearForSomeone} hitSlop={12}>
              <X size={16} color={ACCENT} />
            </Pressable>
          </Animated.View>
        )}

        {/* Birth year input */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)} style={[ch.card, { backgroundColor: cardBg, borderColor: cardBorder, marginHorizontal: layout.padding.screen }]}>
          <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD, letterSpacing: 2 }]}>{t('chineseHoroscope.data_urodzenia', 'DATA URODZENIA')}</Typography>
          <View style={{ marginTop: 10 }}>
            <DateWheelPicker
              day={birthWheelDay}
              month={birthWheelMonth}
              year={birthWheelYear}
              onChange={(d, m, y) => {
                setBirthWheelDay(d); setBirthWheelMonth(m); setBirthWheelYear(y);
                setBirthYearInput(String(y));
                const a = getAnimalFromYear(y);
                const e = getElementFromYear(y);
                setUserAnimal(a);
                setUserElement(e);
              }}
              textColor={textColor}
              accentColor={ACCENT}
              cardBg={inputBg}
            />
          </View>
          <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => {
              const a = getAnimalFromYear(birthWheelYear);
              const e = getElementFromYear(birthWheelYear);
              setUserAnimal(a); setUserElement(e); HapticsService.notify();
            }} style={[ch.calcBtn, { backgroundColor: ACCENT }]}>
              <Typography variant="body" style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{t('chineseHoroscope.oblicz', 'Oblicz')}</Typography>
            </Pressable>
          </View>
        </Animated.View>

        {/* Animal widget */}
        {displayAnimal ? (
          <>
            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={{ alignItems: 'center', marginVertical: 16 }}>
              <AnimalWidget3D animalId={displayAnimal.id} accent={ACCENT} size={170} />
              <Typography variant="heading" style={{ fontSize: 28, fontWeight: '800', color: GOLD, marginTop: 8, letterSpacing: 1 }}>
                {displayAnimal.pl}
              </Typography>
              <Typography variant="body" style={{ color: subColor, fontSize: 14 }}>{displayAnimal.en} · {displayAnimal.yin_yang}</Typography>
            </Animated.View>

            {/* Quick stats row */}
            <Animated.View entering={FadeInDown.duration(400).delay(150)} style={{ flexDirection: 'row', paddingHorizontal: layout.padding.screen, gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Element', value: displayElement?.pl ?? '—', color: displayElement?.color ?? GOLD },
                { label: 'Yin/Yang', value: displayAnimal.yin_yang, color: GOLD },
                { label: 'Godziny', value: displayAnimal.rulingHours, color: ACCENT },
              ].map((stat, i) => (
                <View key={i} style={[ch.statChip, { backgroundColor: cardBg, borderColor: stat.color + '50', flex: 1 }]}>
                  <Typography variant="micro" style={{ color: stat.color, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{stat.label.toUpperCase()}</Typography>
                  <Typography variant="body" style={{ color: textColor, fontSize: 11, fontWeight: '600', marginTop: 2, textAlign: 'center' }}>{stat.value}</Typography>
                </View>
              ))}
            </Animated.View>

            {/* Description */}
            <Animated.View entering={FadeInDown.duration(400).delay(200)} style={[ch.card, { backgroundColor: cardBg, borderColor: cardBorder, marginHorizontal: layout.padding.screen }]}>
              <Typography variant="body" style={{ color: textColor, lineHeight: 22, fontSize: 14 }}>{displayAnimal.description}</Typography>
            </Animated.View>

            {/* Lucky/Unlucky */}
            <Animated.View entering={FadeInDown.duration(400).delay(250)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 14 }}>
              <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.szczesliwe_liczby_i_kolory', 'SZCZĘŚLIWE LICZBY I KOLORY')}</Typography>
              <View style={[ch.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 8 }]}>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  {displayAnimal.luckyNumbers.map(n => (
                    <View key={n} style={[ch.numBadge, { backgroundColor: GOLD + '20', borderColor: GOLD + '50' }]}>
                      <Typography variant="body" style={{ color: GOLD, fontWeight: '700' }}>{n}</Typography>
                    </View>
                  ))}
                  <View style={{ flex: 1 }}/>
                  {displayAnimal.unluckyNumbers.map(n => (
                    <View key={n} style={[ch.numBadge, { backgroundColor: '#FF444420', borderColor: '#FF444450' }]}>
                      <Typography variant="body" style={{ color: '#FF6666', fontWeight: '700' }}>{n}</Typography>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {displayAnimal.luckyColors.map(c => (
                    <View key={c} style={[ch.colorChip, { backgroundColor: GOLD + '15', borderColor: GOLD + '40' }]}>
                      <Typography variant="micro" style={{ color: GOLD, fontSize: 11 }}>✓ {c}</Typography>
                    </View>
                  ))}
                  {displayAnimal.unluckyColors.map(c => (
                    <View key={c} style={[ch.colorChip, { backgroundColor: '#FF444415', borderColor: '#FF444440' }]}>
                      <Typography variant="micro" style={{ color: '#FF6666', fontSize: 11 }}>✗ {c}</Typography>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* Directions */}
            <Animated.View entering={FadeInDown.duration(400).delay(280)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 14 }}>
              <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.szczesliwe_kierunki', 'SZCZĘŚLIWE KIERUNKI')}</Typography>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {displayAnimal.bestDirections.map(d => (
                  <View key={d} style={[ch.dirChip, { backgroundColor: ACCENT + '20', borderColor: ACCENT + '50' }]}>
                    <Compass size={12} color={ACCENT} />
                    <Typography variant="micro" style={{ color: ACCENT, fontSize: 12, marginLeft: 4 }}>{d}</Typography>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Traits */}
            <Animated.View entering={FadeInDown.duration(400).delay(300)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 14 }}>
              <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.cechy_charakteru', 'CECHY CHARAKTERU')}</Typography>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {displayAnimal.traits.map((trait, i) => (
                  <View key={i} style={[ch.traitChip, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <Typography variant="micro" style={{ color: textColor, fontSize: 12 }}>{trait}</Typography>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Strengths & Challenges */}
            <Animated.View entering={FadeInDown.duration(400).delay(350)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 14, flexDirection: 'row', gap: 10 }}>
              <View style={[ch.card, { flex: 1, backgroundColor: '#22C55E10', borderColor: '#22C55E30' }]}>
                <Typography variant="microLabel" style={{ color: '#22C55E', fontSize: 10, letterSpacing: 1, marginBottom: 8 }}>{t('chineseHoroscope.mocne_strony', 'MOCNE STRONY')}</Typography>
                {displayAnimal.strengths.map((s, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 }}>
                    <Typography variant="body" style={{ color: '#22C55E', fontSize: 14, marginRight: 6, lineHeight: 18 }}>✦</Typography>
                    <Typography variant="body" style={{ color: textColor, fontSize: 12, lineHeight: 17, flex: 1 }}>{s}</Typography>
                  </View>
                ))}
              </View>
              <View style={[ch.card, { flex: 1, backgroundColor: '#F9730810', borderColor: '#F9730830' }]}>
                <Typography variant="microLabel" style={{ color: '#F97308', fontSize: 10, letterSpacing: 1, marginBottom: 8 }}>{t('chineseHoroscope.wyzwania', 'WYZWANIA')}</Typography>
                {displayAnimal.challenges.map((c, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 }}>
                    <Typography variant="body" style={{ color: '#F97308', fontSize: 14, marginRight: 6, lineHeight: 18 }}>◆</Typography>
                    <Typography variant="body" style={{ color: textColor, fontSize: 12, lineHeight: 17, flex: 1 }}>{c}</Typography>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Famous people */}
            <Animated.View entering={FadeInDown.duration(400).delay(400)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 14 }}>
              <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.znane_osoby_z_tym_znakiem', 'ZNANE OSOBY Z TYM ZNAKIEM')}</Typography>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {displayAnimal.famous.map((name, i) => (
                  <View key={i} style={[ch.famousChip, { backgroundColor: cardBg, borderColor: GOLD + '40' }]}>
                    <Crown size={10} color={GOLD} />
                    <Typography variant="micro" style={{ color: textColor, fontSize: 11, marginLeft: 4 }}>{name}</Typography>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Compatibility preview */}
            <Animated.View entering={FadeInDown.duration(400).delay(450)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 14 }}>
              <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.partnerzy_zodiakalni', 'PARTNERZY ZODIAKALNI')}</Typography>
              <View style={[ch.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 8 }]}>
                <View style={{ marginBottom: 8 }}>
                  <Typography variant="micro" style={{ color: '#22C55E', fontSize: 11, marginBottom: 6 }}>{t('chineseHoroscope.najlepsza_zgodnosc', '✦ NAJLEPSZA ZGODNOŚĆ')}</Typography>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {displayAnimal.bestWith.map(id => {
                      const a = ANIMALS.find(x => x.id === id);
                      return a ? (
                        <View key={id} style={[ch.animalPill, { backgroundColor: '#22C55E15', borderColor: '#22C55E40' }]}>
                          <Typography style={{ fontSize: 14 }}>{a.emoji}</Typography>
                          <Typography variant="micro" style={{ color: textColor, fontSize: 11, marginLeft: 4 }}>{a.pl}</Typography>
                        </View>
                      ) : null;
                    })}
                  </View>
                </View>
                <View>
                  <Typography variant="micro" style={{ color: '#FF6666', fontSize: 11, marginBottom: 6 }}>{t('chineseHoroscope.trudna_zgodnosc', '◆ TRUDNA ZGODNOŚĆ')}</Typography>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {displayAnimal.worstWith.map(id => {
                      const a = ANIMALS.find(x => x.id === id);
                      return a ? (
                        <View key={id} style={[ch.animalPill, { backgroundColor: '#FF444415', borderColor: '#FF444440' }]}>
                          <Typography style={{ fontSize: 14 }}>{a.emoji}</Typography>
                          <Typography variant="micro" style={{ color: textColor, fontSize: 11, marginLeft: 4 }}>{a.pl}</Typography>
                        </View>
                      ) : null;
                    })}
                  </View>
                </View>
                <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: cardBorder }}>
                  <Typography variant="micro" style={{ color: GOLD, fontSize: 11, marginBottom: 4 }}>{t('chineseHoroscope.sekretny_przyjaciel', '★ SEKRETNY PRZYJACIEL')}</Typography>
                  {(() => {
                    const sf = ANIMALS.find(x => x.id === displayAnimal.secretFriend);
                    return sf ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Typography style={{ fontSize: 18 }}>{sf.emoji}</Typography>
                        <Typography variant="body" style={{ color: GOLD, fontSize: 13, fontWeight: '600', marginLeft: 8 }}>{sf.pl} ({sf.en})</Typography>
                      </View>
                    ) : null;
                  })()}
                </View>
              </View>
            </Animated.View>
          </>
        ) : (
          <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', padding: 40, paddingTop: 20 }}>
            <Typography style={{ fontSize: 64 }}>🐉</Typography>
            <Typography variant="heading" style={{ color: GOLD, fontSize: 20, fontWeight: '700', marginTop: 12, textAlign: 'center' }}>
              {t('chineseHoroscope.wprowadz_rok_urodzenia', 'Wprowadź rok urodzenia')}
            </Typography>
            <Typography variant="body" style={{ color: subColor, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
              {t('chineseHoroscope.odkryj_swoj_chinski_znak_zodiakalny', 'Odkryj swój chiński znak zodiakalny i poznaj sekrety swojej energii')}
            </Typography>
          </Animated.View>
        )}
        <EndOfContentSpacer />
      </ScrollView>
    );
  };

  const renderElementsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 8 }}>
        <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.pentagram_pieciu_przemian', 'PENTAGRAM PIĘCIU PRZEMIAN')}</Typography>
        <Typography variant="body" style={{ color: subColor, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
          {t('chineseHoroscope.piec_elementow_tworza_cykl_tworczy', 'Pięć elementów tworzą cykl twórczy i niszczący — fundament chińskiej filozofii i medycyny.')}
        </Typography>
      </Animated.View>

      <ElementsPentagon userElementId={activeElement?.id ?? 'water'} accent={ACCENT} />

      {/* Legend */}
      <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 20, height: 2, backgroundColor: GOLD, opacity: 0.7 }} />
            <Typography variant="micro" style={{ color: subColor, fontSize: 11 }}>{t('chineseHoroscope.cykl_tworczy', 'Cykl twórczy →')}</Typography>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 20, height: 1, borderTopWidth: 1, borderTopColor: '#FF4444', borderStyle: 'dashed' }} />
            <Typography variant="micro" style={{ color: subColor, fontSize: 11 }}>{t('chineseHoroscope.cykl_niszczacy', 'Cykl niszczący ⋯')}</Typography>
          </View>
        </View>
      </View>

      {/* Current year element highlight */}
      {activeElement && (
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
          <LinearGradient
            colors={[activeElement.color + '30', activeElement.color + '10']}
            style={[ch.card, { borderColor: activeElement.color + '60' }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: activeElement.color + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: activeElement.color }}>
                <Typography style={{ fontSize: 24 }}>{activeElement.symbol}</Typography>
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="microLabel" style={{ color: activeElement.color, fontSize: 10, letterSpacing: 1.5 }}>{t('chineseHoroscope.twoj_element', 'TWÓJ ELEMENT')}</Typography>
                <Typography variant="heading" style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>{activeElement.pl}</Typography>
                <Typography variant="micro" style={{ color: subColor, fontSize: 12 }}>Planet: {activeElement.planet} · Pora: {activeElement.season}</Typography>
              </View>
            </View>
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: activeElement.color + '30' }}>
              <Typography variant="body" style={{ color: textColor, lineHeight: 20, fontSize: 13 }}>{activeElement.guidance}</Typography>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* All elements detailed */}
      {ELEMENTS.map((el, i) => {
        const isExpanded = expandedElement === el.id;
        const isUserEl = el.id === activeElement?.id;
        return (
          <Animated.View key={el.id} entering={FadeInDown.duration(400).delay(150 + i * 60)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 10 }}>
            <Pressable
              onPress={() => { setExpandedElement(isExpanded ? null : el.id); HapticsService.notify(); }}
              style={[ch.card, {
                backgroundColor: isUserEl ? el.color + '18' : cardBg,
                borderColor: isUserEl ? el.color + '70' : cardBorder,
              }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: el.color + '25', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: el.color + '60' }}>
                  <Typography style={{ fontSize: 20 }}>{el.symbol}</Typography>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography variant="heading" style={{ color: textColor, fontSize: 16, fontWeight: '700' }}>{el.pl}</Typography>
                  <Typography variant="micro" style={{ color: subColor, fontSize: 12 }}>{el.en} · {el.season} · {el.direction}</Typography>
                </View>
                {isUserEl && (
                  <View style={[ch.myBadge, { backgroundColor: el.color + '30', borderColor: el.color + '60' }]}>
                    <Typography variant="micro" style={{ color: el.color, fontSize: 10, fontWeight: '700' }}>{t('chineseHoroscope.twoj', 'TWÓJ')}</Typography>
                  </View>
                )}
                <ChevronRight size={16} color={subColor} style={{ marginLeft: 8, transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} />
              </View>
              {isExpanded && (
                <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: el.color + '30' }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: 'Organ', value: el.organ },
                      { label: 'Emocja', value: el.emotion },
                      { label: 'Cnota', value: el.virtue },
                      { label: 'Smak', value: el.taste },
                      { label: 'Planeta', value: el.planet },
                    ].map(item => (
                      <View key={item.label} style={[ch.detailPill, { backgroundColor: el.color + '12', borderColor: el.color + '35' }]}>
                        <Typography variant="micro" style={{ color: el.color, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 }}>{item.label.toUpperCase()}</Typography>
                        <Typography variant="body" style={{ color: textColor, fontSize: 12, marginTop: 2 }}>{item.value}</Typography>
                      </View>
                    ))}
                  </View>
                  <Typography variant="microLabel" style={{ color: el.color, fontSize: 10, letterSpacing: 1, marginBottom: 8 }}>{t('chineseHoroscope.jakosci_i_cechy', 'JAKOŚCI I CECHY')}</Typography>
                  {el.qualities.map((q, qi) => (
                    <View key={qi} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: el.color, marginRight: 10 }} />
                      <Typography variant="body" style={{ color: textColor, fontSize: 13, lineHeight: 18 }}>{q}</Typography>
                    </View>
                  ))}
                  <View style={{ marginTop: 10, padding: 12, backgroundColor: el.color + '12', borderRadius: 12, borderLeftWidth: 3, borderLeftColor: el.color }}>
                    <Typography variant="body" style={{ color: textColor, fontSize: 13, lineHeight: 19, fontStyle: 'italic' }}>{el.guidance}</Typography>
                  </View>
                </Animated.View>
              )}
            </Pressable>
          </Animated.View>
        );
      })}
      <EndOfContentSpacer />
    </ScrollView>
  );

  const renderYearTab = () => {
    const cy = currentYear;
    const currentMonthEnergy = MONTH_ENERGIES[selectedMonth];
    const monthAnimal = ANIMALS.find(a => a.id === currentMonthEnergy.animal);
    const todayAnimalIdx = (new Date().getDate() + new Date().getMonth() * 3) % 12;
    const todayAnimal = ANIMALS[todayAnimalIdx];

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Current year header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <LinearGradient
            colors={[ACCENT + '30', DEEP_RED + '20', 'transparent']}
            style={{ paddingHorizontal: layout.padding.screen, paddingVertical: 20 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: ACCENT + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GOLD + '60' }}>
                <Typography style={{ fontSize: 32 }}>{cy.animal?.emoji}</Typography>
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="microLabel" style={{ color: GOLD, letterSpacing: 2, fontSize: 10 }}>CHIŃSKI ROK {cy.year}</Typography>
                <Typography variant="heading" style={{ color: textColor, fontSize: 22, fontWeight: '800' }}>
                  Rok {cy.animal?.pl}
                </Typography>
                <Typography variant="body" style={{ color: subColor, fontSize: 13 }}>
                  Element: {cy.element?.pl} · {cy.animal?.yin_yang}
                </Typography>
              </View>
            </View>
            {cy.element && (
              <View style={{ marginTop: 14, padding: 14, backgroundColor: cy.element.color + '15', borderRadius: 12, borderLeftWidth: 3, borderLeftColor: cy.element.color }}>
                <Typography variant="body" style={{ color: textColor, lineHeight: 20, fontSize: 13 }}>{cy.element.guidance}</Typography>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Today's animal energy */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
          <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.energia_dzisiaj', 'ENERGIA DZISIAJ')}</Typography>
          <LinearGradient
            colors={[GOLD + '15', ACCENT + '10']}
            style={[ch.card, { borderColor: GOLD + '40', marginTop: 8 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Typography style={{ fontSize: 36 }}>{todayAnimal.emoji}</Typography>
              <View style={{ flex: 1 }}>
                <Typography variant="heading" style={{ color: textColor, fontSize: 17, fontWeight: '700' }}>
                  Dzień {todayAnimal.pl}
                </Typography>
                <Typography variant="body" style={{ color: subColor, fontSize: 13, lineHeight: 18 }}>
                  Godziny: {todayAnimal.rulingHours}
                </Typography>
                <Typography variant="body" style={{ color: textColor, fontSize: 13, marginTop: 6, lineHeight: 18 }}>
                  {todayAnimal.description}
                </Typography>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Month picker */}
        <Animated.View entering={FadeInDown.duration(400).delay(120)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 10 }}>
          <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.prognoza_miesieczna', 'PROGNOZA MIESIĘCZNA')}</Typography>
        </Animated.View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 8, paddingBottom: 4 }}>
          {MONTH_ENERGIES.map((me, i) => {
            const isActive = selectedMonth === i;
            const ma = ANIMALS.find(a => a.id === me.animal);
            return (
              <Pressable
                key={i}
                onPress={() => { setSelectedMonth(i); HapticsService.notify(); }}
                style={[ch.monthChip, {
                  backgroundColor: isActive ? ACCENT : cardBg,
                  borderColor: isActive ? ACCENT : cardBorder,
                }]}
              >
                <Typography style={{ fontSize: 16 }}>{ma?.emoji}</Typography>
                <Typography variant="micro" style={{ color: isActive ? '#fff' : textColor, fontSize: 11, fontWeight: isActive ? '700' : '400', marginTop: 2 }}>{me.month}</Typography>
                {me.lucky && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: GOLD, marginTop: 2 }} />}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Selected month detail */}
        <Animated.View entering={FadeInDown.duration(300)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 14 }}>
          <LinearGradient
            colors={[ACCENT + '20', cardBg as string]}
            style={[ch.card, { borderColor: ACCENT + '50' }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Typography style={{ fontSize: 32 }}>{monthAnimal?.emoji}</Typography>
              <View>
                <Typography variant="heading" style={{ color: GOLD, fontSize: 18, fontWeight: '700' }}>
                  {MONTH_ENERGIES[selectedMonth].month} — {monthAnimal?.pl}
                </Typography>
                <Typography variant="body" style={{ color: subColor, fontSize: 13 }}>
                  {MONTH_ENERGIES[selectedMonth].theme}
                </Typography>
              </View>
              {MONTH_ENERGIES[selectedMonth].lucky && (
                <View style={{ marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: GOLD + '25', borderRadius: 12, borderWidth: 1, borderColor: GOLD + '50' }}>
                  <Typography variant="micro" style={{ color: GOLD, fontSize: 10, fontWeight: '700' }}>{t('chineseHoroscope.szczesliwy', 'SZCZĘŚLIWY')}</Typography>
                </View>
              )}
            </View>
            {/* Energy bar */}
            <View style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Typography variant="micro" style={{ color: subColor, fontSize: 11 }}>{t('chineseHoroscope.energia_miesiaca', 'Energia miesiąca')}</Typography>
                <Typography variant="micro" style={{ color: GOLD, fontSize: 11, fontWeight: '700' }}>{MONTH_ENERGIES[selectedMonth].energy}%</Typography>
              </View>
              <View style={{ height: 6, backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ height: 6, width: `${MONTH_ENERGIES[selectedMonth].energy}%`, backgroundColor: GOLD, borderRadius: 3 }} />
              </View>
            </View>
            <Typography variant="body" style={{ color: textColor, fontSize: 13, lineHeight: 19 }}>
              {monthAnimal?.description}
            </Typography>
          </LinearGradient>
        </Animated.View>

        {/* Annual themes */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 14 }}>
          <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.prognoza_roczna_glowne_obszary', 'PROGNOZA ROCZNA — GŁÓWNE OBSZARY')}</Typography>
          {[
            { icon: TrendingUp, label: 'Kariera', color: '#3B82F6', text: `W roku ${cy.animal?.pl} kariera zyska na dynamice. Cechy ${cy.animal?.pl} — ${cy.animal?.traits.slice(0,3).join(', ')} — sprzyjają odważnym ruchom zawodowym.` },
            { icon: Heart, label: 'Miłość', color: '#EC4899', text: 'Relacje nabierają głębszego wymiaru. Czas otwartości i szczerości w związkach — buduj mosty zaufania.' },
            { icon: Zap, label: 'Zdrowie', color: '#22C55E', text: `Element ${cy.element?.pl} rządzi narządami: ${cy.element?.organ}. Dbaj o równowagę energetyczną.` },
            { icon: Star, label: 'Finanse', color: GOLD, text: 'Rok przynosi możliwości finansowe dla tych, którzy działają strategicznie i unikają impulsywnych decyzji.' },
            { icon: Globe, label: 'Duchowość', color: '#A78BFA', text: 'Czas głębszej refleksji i połączenia z własną intuicją. Tradycje duchowe przyniosą oparcie.' },
          ].map((theme, i) => (
            <Animated.View key={i} entering={FadeInDown.duration(350).delay(250 + i * 60)}>
              <LinearGradient
                colors={[theme.color + '12', 'transparent']}
                style={[ch.themeCard, { borderColor: theme.color + '35', marginBottom: 10 }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                    <theme.icon size={18} color={theme.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" style={{ color: theme.color, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>{theme.label}</Typography>
                    <Typography variant="body" style={{ color: textColor, fontSize: 13, lineHeight: 19 }}>{theme.text}</Typography>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          ))}
        </Animated.View>

        <EndOfContentSpacer />
      </ScrollView>
    );
  };

  const renderCompatTab = () => {
    const partnerAnimal = selectedPartner ? ANIMALS.find(a => a.id === selectedPartner) : null;
    const compatScores = (activeAnimal && selectedPartner)
      ? COMPAT_MATRIX[activeAnimal.id]?.[selectedPartner] ?? [50, 50, 50, 50]
      : null;
    const overallScore = compatScores ? Math.round(compatScores.reduce((a, b) => a + b, 0) / 4) : 0;

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Your animal reminder */}
        {activeAnimal && (
          <Animated.View entering={FadeInDown.duration(350)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
            <View style={[ch.card, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '50', flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              <Typography style={{ fontSize: 28 }}>{activeAnimal.emoji}</Typography>
              <View>
                <Typography variant="micro" style={{ color: ACCENT, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{t('chineseHoroscope.twoj_znak', 'TWÓJ ZNAK')}</Typography>
                <Typography variant="heading" style={{ color: textColor, fontSize: 18, fontWeight: '700' }}>{activeAnimal.pl}</Typography>
              </View>
              <ArrowRight size={16} color={subColor} style={{ marginLeft: 'auto' }} />
              <Typography style={{ fontSize: 28 }}>
                {partnerAnimal ? partnerAnimal.emoji : '❓'}
              </Typography>
            </View>
          </Animated.View>
        )}

        {/* Partner selection */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
          <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.wybierz_partnera', 'WYBIERZ PARTNERA')}</Typography>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {ANIMALS.map(animal => {
              const isSelected = selectedPartner === animal.id;
              const isSelf = animal.id === activeAnimal?.id;
              return (
                <Pressable
                  key={animal.id}
                  onPress={() => { setSelectedPartner(animal.id); HapticsService.notify(); setAiCompatResult(''); }}
                  style={[ch.animalSelectChip, {
                    backgroundColor: isSelected ? ACCENT : cardBg,
                    borderColor: isSelected ? ACCENT : isSelf ? GOLD + '50' : cardBorder,
                  }]}
                >
                  <Typography style={{ fontSize: 18 }}>{animal.emoji}</Typography>
                  <Typography variant="micro" style={{ color: isSelected ? '#fff' : textColor, fontSize: 10, marginTop: 2, textAlign: 'center' }}>
                    {animal.pl}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Compatibility result */}
        {compatScores && partnerAnimal && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            {/* Overall score */}
            <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
              <LinearGradient
                colors={[ACCENT + '25', DEEP_RED + '15']}
                style={[ch.card, { borderColor: ACCENT + '60', alignItems: 'center' }]}
              >
                <AnimatedArc score={overallScore} color={GOLD} size={130} isLight={isLight} />
                <Typography variant="heading" style={{ color: textColor, fontSize: 17, fontWeight: '700', marginTop: 8 }}>
                  {activeAnimal?.pl} & {partnerAnimal.pl}
                </Typography>
                <Typography variant="body" style={{ color: subColor, fontSize: 13, marginTop: 4 }}>
                  {overallScore >= 85 ? '✦ Wyjątkowa harmonia' : overallScore >= 70 ? '★ Dobra zgodność' : overallScore >= 55 ? '◆ Wymaga pracy' : '⚠ Duże wyzwania'}
                </Typography>
              </LinearGradient>
            </View>

            {/* Area scores */}
            <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
              <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.szczegolow_analiza', 'SZCZEGÓŁOWA ANALIZA')}</Typography>
              <View style={{ marginTop: 10, gap: 10 }}>
                {[
                  { label: 'Miłość i Romans', score: compatScores[0], icon: Heart, color: '#EC4899' },
                  { label: 'Przyjaźń', score: compatScores[1], icon: Users, color: '#3B82F6' },
                  { label: 'Praca i Cele', score: compatScores[2], icon: TrendingUp, color: '#22C55E' },
                  { label: 'Komunikacja', score: compatScores[3], icon: Globe, color: '#A78BFA' },
                ].map((area, i) => (
                  <Animated.View key={i} entering={FadeInDown.duration(350).delay(150 + i * 60)}>
                    <View style={[ch.card, { backgroundColor: area.color + '10', borderColor: area.color + '30' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <area.icon size={16} color={area.color} />
                        <Typography variant="body" style={{ color: textColor, fontSize: 13, fontWeight: '600', flex: 1 }}>{area.label}</Typography>
                        <Typography variant="body" style={{ color: area.color, fontSize: 15, fontWeight: '700' }}>{area.score}%</Typography>
                      </View>
                      <View style={{ height: 6, backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                        <View style={{ height: 6, width: `${area.score}%`, backgroundColor: area.color, borderRadius: 3 }} />
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>

            {/* Trine group */}
            {activeAnimal && (
              <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
                <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.trojkat_zodiaku_trojka_trojnika', 'TRÓJKĄT ZODIAKU — TRÓJKA TRÓJNIKA')}</Typography>
                <View style={[ch.card, { backgroundColor: GOLD + '10', borderColor: GOLD + '40', marginTop: 8 }]}>
                  <Typography variant="micro" style={{ color: subColor, fontSize: 12, lineHeight: 17, marginBottom: 10 }}>
                    {t('chineseHoroscope.zwierzeta_z_tego_samego_trojnika', 'Zwierzęta z tego samego trójnika mają głęboko zbliżone wartości i naturalne zrozumienie:')}
                  </Typography>
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                    {[activeAnimal.id, ...activeAnimal.trine].map(id => {
                      const a = ANIMALS.find(x => x.id === id);
                      return a ? (
                        <View key={id} style={{ alignItems: 'center', gap: 4 }}>
                          <Typography style={{ fontSize: 28 }}>{a.emoji}</Typography>
                          <Typography variant="micro" style={{ color: textColor, fontSize: 11 }}>{a.pl}</Typography>
                        </View>
                      ) : null;
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* AI Analysis button */}
            {!aiCompatResult ? (
              <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
                <Pressable onPress={handleAiCompat} disabled={aiCompatLoading} style={[ch.aiBtn, { backgroundColor: ACCENT, opacity: aiCompatLoading ? 0.7 : 1 }]}>
                  {aiCompatLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Sparkles size={16} color="#fff" />
                      <Typography variant="body" style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 8 }}>{t('chineseHoroscope.analiza_ai_glebszy_wglad', 'Analiza AI — Głębszy Wgląd')}</Typography>
                    </>
                  )}
                </Pressable>
              </View>
            ) : (
              <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
                <LinearGradient
                  colors={[ACCENT + '20', DEEP_RED + '15']}
                  style={[ch.card, { borderColor: ACCENT + '50' }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Sparkles size={14} color={GOLD} />
                    <Typography variant="microLabel" style={{ color: GOLD, letterSpacing: 1.5, fontSize: 10 }}>{t('chineseHoroscope.analiza_wyroczni', 'ANALIZA WYROCZNI')}</Typography>
                  </View>
                  <Typography variant="body" style={{ color: textColor, lineHeight: 22, fontSize: 13 }}>{aiCompatResult}</Typography>
                  <Pressable onPress={() => setAiCompatResult('')} style={{ marginTop: 12, alignSelf: 'flex-end' }}>
                    <Typography variant="micro" style={{ color: subColor, fontSize: 11 }}>{t('chineseHoroscope.odswiez_analize', 'Odśwież analizę')}</Typography>
                  </Pressable>
                </LinearGradient>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {!activeAnimal && (
          <View style={{ paddingHorizontal: layout.padding.screen, padding: 30, alignItems: 'center' }}>
            <Typography style={{ fontSize: 48 }}>🔮</Typography>
            <Typography variant="body" style={{ color: subColor, textAlign: 'center', marginTop: 12, lineHeight: 20 }}>
              {t('chineseHoroscope.wprowadz_rok_urodzenia_w_zakladce', 'Wprowadź rok urodzenia w zakładce Zwierzę, aby sprawdzić swoją zgodność')}
            </Typography>
          </View>
        )}

        <EndOfContentSpacer />
      </ScrollView>
    );
  };

  const renderWisdomTab = () => {
    const today = new Date();
    const todayTrigramIdx = (today.getDate() + today.getMonth() * 3 + today.getFullYear()) % 8;
    const todayTrigram = TRIGRAMS[todayTrigramIdx];

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* I Ching hexagram of the day */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
          <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.i_ching_trigram_dnia', 'I CHING — TRIGRAM DNIA')}</Typography>
          <LinearGradient
            colors={[GOLD + '18', ACCENT + '10']}
            style={[ch.card, { borderColor: GOLD + '50', marginTop: 8 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: GOLD + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GOLD + '60' }}>
                <Typography style={{ fontSize: 28 }}>{todayTrigram.symbol}</Typography>
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="heading" style={{ color: GOLD, fontSize: 20, fontWeight: '800' }}>{todayTrigram.name} — {todayTrigram.pl}</Typography>
                <Typography variant="body" style={{ color: subColor, fontSize: 12 }}>{todayTrigram.direction} · {todayTrigram.element}</Typography>
              </View>
            </View>
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: GOLD + '25' }}>
              <Typography variant="body" style={{ color: textColor, lineHeight: 20, fontSize: 13 }}>{todayTrigram.meaning}</Typography>
            </View>
            {/* Trigram lines visual */}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 14, justifyContent: 'center' }}>
              {todayTrigram.lines.map((line, li) => (
                <View key={li} style={{ flexDirection: 'row', gap: 3 }}>
                  {line === 1 ? (
                    <View style={{ width: 32, height: 5, backgroundColor: GOLD, borderRadius: 2.5 }} />
                  ) : (
                    <>
                      <View style={{ width: 14, height: 5, backgroundColor: GOLD, borderRadius: 2.5 }} />
                      <View style={{ width: 4 }} />
                      <View style={{ width: 14, height: 5, backgroundColor: GOLD, borderRadius: 2.5 }} />
                    </>
                  )}
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* All Trigrams */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
          <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.8_trygramow_fundament_i_ching', '8 TRYGRAMÓW — FUNDAMENT I CHING')}</Typography>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {TRIGRAMS.map((trig, i) => {
              const isExpanded = expandedTrigram === i;
              return (
                <Pressable
                  key={i}
                  onPress={() => { setExpandedTrigram(isExpanded ? null : i); HapticsService.notify(); }}
                  style={[ch.trigramChip, {
                    backgroundColor: isExpanded ? GOLD + '25' : cardBg,
                    borderColor: isExpanded ? GOLD + '70' : cardBorder,
                    width: (SW - layout.padding.screen * 2 - 8) / 2,
                  }]}
                >
                  <Typography style={{ fontSize: 22 }}>{trig.symbol}</Typography>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Typography variant="body" style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>{trig.name}</Typography>
                    <Typography variant="micro" style={{ color: subColor, fontSize: 11 }}>{trig.pl}</Typography>
                  </View>
                  {isExpanded && (
                    <Animated.View entering={FadeInDown.duration(250)} style={{ marginTop: 8, width: '100%' }}>
                      <Typography variant="body" style={{ color: textColor, fontSize: 12, lineHeight: 17 }}>{trig.meaning}</Typography>
                    </Animated.View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Lo Shu Magic Square */}
        <Animated.View entering={FadeInDown.duration(400).delay(160)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
          <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.lo_shu_magiczny_kwadrat', 'LO SHU — MAGICZNY KWADRAT')}</Typography>
          <View style={[ch.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 8, alignItems: 'center' }]}>
            <Typography variant="body" style={{ color: subColor, fontSize: 13, lineHeight: 18, marginBottom: 14, textAlign: 'center' }}>
              {t('chineseHoroscope.magiczny_kwadrat_lo_shu_legendarny', 'Magiczny kwadrat Lo Shu — legendarny symbol z rzeki Lo. Każdy rząd, kolumna i przekątna sumuje się do 15.')}
            </Typography>
            <LoShuGrid accent={ACCENT} />
            <View style={{ marginTop: 14, flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { num: 1, label: 'Woda — Kariera' },
                { num: 5, label: 'Ziemia — Centrum' },
                { num: 9, label: 'Ogień — Sława' },
              ].map(item => (
                <View key={item.num} style={[ch.loShuPill, { backgroundColor: ACCENT + '15', borderColor: ACCENT + '40' }]}>
                  <Typography variant="body" style={{ color: ACCENT, fontWeight: '700', fontSize: 12 }}>{item.num} — </Typography>
                  <Typography variant="body" style={{ color: textColor, fontSize: 12 }}>{item.label}</Typography>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Ba Zi — 4 Pillars */}
        <Animated.View entering={FadeInDown.duration(400).delay(220)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
          <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.ba_zi_cztery_filary_przeznacze', 'BA ZI — CZTERY FILARY PRZEZNACZENIA')}</Typography>
          <View style={[ch.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 8 }]}>
            <Typography variant="body" style={{ color: subColor, fontSize: 13, lineHeight: 18, marginBottom: 14 }}>
              {t('chineseHoroscope.ba_zi_osiem_znakow_analizuje', 'Ba Zi (osiem znaków) analizuje cztery filary: Rok, Miesiąc, Dzień i Godzinę narodzin. Każdy filar zawiera dwa znaki tworząc 8 znaków — mapę przeznaczenia.')}
            </Typography>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { label: 'Filar Roku', desc: 'Dziadkowie,\nwczesne życie', color: '#3B82F6' },
                { label: 'Filar Miesiąca', desc: 'Rodzice,\nmłodość', color: '#22C55E' },
                { label: 'Filar Dnia', desc: 'Ty sam,\nmałżeństwo', color: GOLD },
                { label: 'Filar Godziny', desc: 'Dzieci,\nstarość', color: '#EC4899' },
              ].map((pillar, i) => (
                <View key={i} style={[ch.pillarCard, { backgroundColor: pillar.color + '12', borderColor: pillar.color + '40', flex: 1 }]}>
                  <View style={{ height: 40, width: 32, borderRadius: 4, backgroundColor: pillar.color + '30', alignSelf: 'center', marginBottom: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: pillar.color + '60' }}>
                    <Typography style={{ fontSize: 11, color: pillar.color, fontWeight: '700' }}>天</Typography>
                    <Typography style={{ fontSize: 11, color: pillar.color, fontWeight: '700' }}>地</Typography>
                  </View>
                  <Typography variant="micro" style={{ color: pillar.color, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center' }}>{pillar.label.toUpperCase()}</Typography>
                  <Typography variant="micro" style={{ color: subColor, fontSize: 9, marginTop: 3, textAlign: 'center', lineHeight: 13 }}>{pillar.desc}</Typography>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Proverbs */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={{ paddingHorizontal: layout.padding.screen }}>
          <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.chinskie_przyslowia_i_madrosci', 'CHIŃSKIE PRZYSŁOWIA I MĄDROŚCI')}</Typography>
          {PROVERBS.map((prov, i) => {
            const isExpanded = expandedProverb === i;
            return (
              <View key={i}>
                <Pressable
                  onPress={() => { setExpandedProverb(isExpanded ? null : i); HapticsService.notify(); }}
                  style={[ch.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 10 }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: GOLD + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: GOLD + '40', flexShrink: 0 }}>
                      <Typography style={{ fontSize: 14, color: GOLD, fontWeight: '700' }}>{i + 1}</Typography>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="body" style={{ color: GOLD, fontSize: 14, fontStyle: 'italic', lineHeight: 20 }}>"{prov.polish}"</Typography>
                      <Typography variant="micro" style={{ color: subColor, fontSize: 11, marginTop: 3 }}>{prov.chinese} — {prov.pinyin}</Typography>
                    </View>
                    <ChevronRight size={14} color={subColor} style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }], marginTop: 4 }} />
                  </View>
                  {isExpanded && (
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: cardBorder }}>
                      <Typography variant="body" style={{ color: textColor, fontSize: 13, lineHeight: 19, marginBottom: 8 }}>{prov.explanation}</Typography>
                      <Typography variant="micro" style={{ color: subColor, fontSize: 11 }}>Źródło: {prov.source}</Typography>
                    </View>
                  )}
                </Pressable>
              </View>
            );
          })}
        </Animated.View>

        {/* Daily tip */}
        <Animated.View entering={FadeInDown.duration(400).delay(600)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 14 }}>
          <LinearGradient
            colors={[ACCENT + '22', DEEP_RED + '15']}
            style={[ch.card, { borderColor: ACCENT + '50' }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Eye size={16} color={GOLD} />
              <Typography variant="microLabel" style={{ color: GOLD, letterSpacing: 1.5, fontSize: 10 }}>{t('chineseHoroscope.madrosc_na_dzis', 'MĄDROŚĆ NA DZIŚ')}</Typography>
            </View>
            <Typography variant="body" style={{ color: textColor, lineHeight: 21, fontSize: 14, fontStyle: 'italic' }}>
              "{currentYear.animal?.pl && PROVERBS[new Date().getDate() % PROVERBS.length].polish}"
            </Typography>
            <Typography variant="micro" style={{ color: subColor, fontSize: 11, marginTop: 8 }}>
              W roku {currentYear.animal?.pl} — {currentYear.element?.guidance}
            </Typography>
          </LinearGradient>
        </Animated.View>

        <EndOfContentSpacer />
      </ScrollView>
    );
  };

  // ── AI FORTUNE HANDLER ───────────────────────────────────────────────────────
  const handleAiFortune = useCallback(async () => {
    if (!activeAnimal) return;
    setFortuneLoading(true);
    setFortuneResult(null);
    const periodLabels = { day: 'dzień', week: 'tydzień', month: 'miesiąc', year: 'rok' };
    try {
      const msgs = [{
        role: 'user' as const,
        content: `Jesteś mistrzem chińskiej astrologii i wyroczni. Stwórz przepowiednię dla znaku ${activeAnimal.pl} (${activeAnimal.en}, element: ${activeAnimal.element}, ${activeAnimal.yin_yang}) na najbliższy ${periodLabels[fortunePeriod]}.

Odpowiedz DOKŁADNIE w tym formacie (każda sekcja 2-3 zdania, w języku użytkownika, głęboko i inspirująco):

MIŁOŚĆ:
[przepowiednia]

KARIERA:
[przepowiednia]

ZDROWIE:
[przepowiednia]

FINANSE:
[przepowiednia]`,
      }];
      const raw = await AiService.chatWithOracle(msgs);
      const extract = (key: string) => {
        const m = raw.match(new RegExp(`${key}:\\s*\\n?([\\s\\S]*?)(?=\\n[A-ZŚĆŹŻĄĘŁÓŃ]+:|$)`));
        return m ? m[1].trim() : '';
      };
      setFortuneResult({
        love: extract('MIŁOŚĆ'),
        career: extract('KARIERA'),
        health: extract('ZDROWIE'),
        finance: extract('FINANSE'),
      });
    } catch {
      setFortuneResult({ love: '', career: '', health: '', finance: 'Nie udało się połączyć z wyrocznią. Spróbuj ponownie.' });
    }
    setFortuneLoading(false);
  }, [activeAnimal, fortunePeriod]);

  const renderFortuneTab = () => {
    const FORTUNE_CARDS = [
      { key: 'love', label: 'MIŁOŚĆ', icon: Heart, color: '#EC4899', value: fortuneResult?.love },
      { key: 'career', label: 'KARIERA', icon: TrendingUp, color: '#F97316', value: fortuneResult?.career },
      { key: 'health', label: 'ZDROWIE', icon: Leaf, color: '#22C55E', value: fortuneResult?.health },
      { key: 'finance', label: 'FINANSE', icon: Globe, color: GOLD, value: fortuneResult?.finance },
    ];
    const PERIODS = [
      { id: 'day', label: 'Dziś' },
      { id: 'week', label: 'Tydzień' },
      { id: 'month', label: 'Miesiąc' },
      { id: 'year', label: 'Rok' },
    ];
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 16, marginBottom: 12 }}>
          <Typography variant="microLabel" style={[ch.sectionLabel, { color: GOLD }]}>{t('chineseHoroscope.chinska_wyrocznia_ai', 'CHIŃSKA WYROCZNIA AI')}</Typography>
          <Typography variant="body" style={{ color: subColor, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
            {t('chineseHoroscope.personaliz_przepowied_oparta_na_ene', 'Personalizowana przepowiednia oparta na energii Twojego zwierzęcia i elementu')}
          </Typography>
        </Animated.View>

        {/* Period selector */}
        <Animated.View entering={FadeInDown.duration(400).delay(60)} style={{ flexDirection: 'row', paddingHorizontal: layout.padding.screen, gap: 8, marginBottom: 14 }}>
          {PERIODS.map(p => (
            <Pressable
              key={p.id}
              onPress={() => { setFortunePeriod(p.id as any); setFortuneResult(null); HapticsService.selection(); }}
              style={[ch.periodChip, {
                backgroundColor: fortunePeriod === p.id ? ACCENT : cardBg,
                borderColor: fortunePeriod === p.id ? ACCENT : cardBorder,
                flex: 1,
              }]}
            >
              <Typography variant="micro" style={{ color: fortunePeriod === p.id ? '#fff' : subColor, fontSize: 12, fontWeight: fortunePeriod === p.id ? '700' : '400', textAlign: 'center' }}>
                {p.label}
              </Typography>
            </Pressable>
          ))}
        </Animated.View>

        {/* Animal preview */}
        {activeAnimal ? (
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
            <LinearGradient
              colors={[ACCENT + '25', DEEP_RED + '12']}
              style={[ch.card, { borderColor: ACCENT + '50', flexDirection: 'row', alignItems: 'center', gap: 14 }]}
            >
              <Typography style={{ fontSize: 44 }}>{activeAnimal.emoji}</Typography>
              <View style={{ flex: 1 }}>
                <Typography variant="microLabel" style={{ color: GOLD, fontSize: 10, letterSpacing: 1.5 }}>{t('chineseHoroscope.twoj_znak_1', 'TWÓJ ZNAK')}</Typography>
                <Typography variant="heading" style={{ color: textColor, fontSize: 22, fontWeight: '800' }}>{activeAnimal.pl}</Typography>
                <Typography variant="micro" style={{ color: subColor, fontSize: 12 }}>{activeAnimal.element} · {activeAnimal.yin_yang}</Typography>
              </View>
            </LinearGradient>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(300)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
            <View style={[ch.card, { backgroundColor: cardBg, borderColor: cardBorder, alignItems: 'center', paddingVertical: 20 }]}>
              <Typography style={{ fontSize: 32 }}>🐉</Typography>
              <Typography variant="body" style={{ color: subColor, textAlign: 'center', marginTop: 8, fontSize: 13 }}>
                {t('chineseHoroscope.wroc_do_zakladki_zwierze_i', 'Wróć do zakładki Zwierzę i wprowadź rok urodzenia, aby odblokować przepowiednię')}
              </Typography>
            </View>
          </Animated.View>
        )}

        {/* Generate button */}
        <Animated.View entering={FadeInDown.duration(400).delay(140)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 16 }}>
          <Pressable
            onPress={handleAiFortune}
            disabled={!activeAnimal || fortuneLoading}
            style={({ pressed }) => [{ opacity: pressed || !activeAnimal ? 0.7 : 1 }]}
          >
            <LinearGradient
              colors={[ACCENT, DEEP_RED]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[ch.card, { alignItems: 'center', paddingVertical: 16, borderWidth: 0 }]}
            >
              {fortuneLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={18} color="#fff" />
                  <Typography variant="body" style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                    {t('chineseHoroscope.generuj_przepowied', 'Generuj Przepowiednię')}
                  </Typography>
                </View>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Fortune cards */}
        {fortuneResult && FORTUNE_CARDS.map((card, i) => {
          const CardIcon = card.icon;
          return (
            <Animated.View key={card.key} entering={FadeInDown.duration(400).delay(i * 80)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 10 }}>
              <LinearGradient
                colors={[card.color + '20', card.color + '08']}
                style={[ch.card, { borderColor: card.color + '45' }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: card.color + '25', alignItems: 'center', justifyContent: 'center' }}>
                    <CardIcon size={16} color={card.color} />
                  </View>
                  <Typography variant="microLabel" style={{ color: card.color, fontSize: 11, letterSpacing: 1.5 }}>{card.label}</Typography>
                </View>
                <Typography variant="body" style={{ color: textColor, lineHeight: 22, fontSize: 14 }}>
                  {card.value || '—'}
                </Typography>
              </LinearGradient>
            </Animated.View>
          );
        })}

        {/* Lo Shu tip */}
        <Animated.View entering={FadeInDown.duration(400).delay(500)} style={{ paddingHorizontal: layout.padding.screen, marginTop: 10 }}>
          <LinearGradient
            colors={[GOLD + '20', GOLD + '08']}
            style={[ch.card, { borderColor: GOLD + '40' }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Eye size={14} color={GOLD} />
              <Typography variant="microLabel" style={{ color: GOLD, fontSize: 10, letterSpacing: 1.5 }}>{t('chineseHoroscope.kwadrat_lo_shu', 'KWADRat LO SHU')}</Typography>
            </View>
            <View style={{ alignSelf: 'center', marginBottom: 10 }}>
              {LO_SHU.map((row, ri) => (
                <View key={ri} style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
                  {row.map((n, ci) => (
                    <View key={ci} style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: cardBg, borderWidth: 1, borderColor: GOLD + '40', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body" style={{ color: GOLD, fontWeight: '700', fontSize: 16 }}>{n}</Typography>
                    </View>
                  ))}
                </View>
              ))}
            </View>
            <Typography variant="micro" style={{ color: subColor, fontSize: 11, lineHeight: 16, textAlign: 'center' }}>
              {t('chineseHoroscope.magiczny_kwadrat_lo_shu_suma', 'Magiczny kwadrat Lo Shu — suma każdego wiersza, kolumny i przekątnej wynosi 15. Symbol harmonii i porządku kosmicznego.')}
            </Typography>
          </LinearGradient>
        </Animated.View>

        <EndOfContentSpacer />
      </ScrollView>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
      <LinearGradient
        colors={isLight ? ['#FFF8EE', '#FEF3E0', '#FFF8EE'] : ['#0C0608', '#180C14', '#0A0810']}
        style={StyleSheet.absoluteFill}
      />
      <CelestialBackdrop themeName={currentThemeName} />
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>

      {/* Header */}
      <View style={[ch.header, { borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.08)' }]}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Horoscope')} style={ch.headerBtn} hitSlop={16}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Typography variant="heading" style={{ color: GOLD, fontSize: 18, fontWeight: '800', letterSpacing: 1 }}>
            {t('chineseHoroscope.chinski_horoskop', '龙 CHIŃSKI HOROSKOP')}
          </Typography>
          <Typography variant="micro" style={{ color: subColor, fontSize: 10, letterSpacing: 1.5 }}>
            {t('chineseHoroscope.zodiak_wschodu', 'ZODIAK WSCHODU')}
          </Typography>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable onPress={() => setShowFsModal(true)} style={ch.headerBtn} hitSlop={12}>
            <Users size={18} color={forSomeone ? ACCENT : textColor} />
          </Pressable>
          <Pressable onPress={handleStar} style={ch.headerBtn} hitSlop={12}>
            <Star size={18} color={isFav ? GOLD : textColor} fill={isFav ? GOLD : 'transparent'} />
          </Pressable>
        </View>
      </View>

      {/* Tab bar */}
      <View style={[ch.tabBar, { borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.06)' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 4 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <Pressable
                key={tab.id}
                onPress={() => { setActiveTab(tab.id as any); HapticsService.notify(); }}
                style={[ch.tabItem, {
                  backgroundColor: isActive ? ACCENT : 'transparent',
                  borderColor: isActive ? ACCENT : 'transparent',
                }]}
              >
                <TabIcon size={13} color={isActive ? '#fff' : subColor} />
                <Typography variant="micro" style={{ color: isActive ? '#fff' : subColor, fontSize: 11, fontWeight: isActive ? '700' : '400', marginLeft: 5 }}>
                  {tab.label}
                </Typography>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'animal' && renderAnimalTab()}
        {activeTab === 'elements' && renderElementsTab()}
        {activeTab === 'year' && renderYearTab()}
        {activeTab === 'compat' && renderCompatTab()}
        {activeTab === 'wisdom' && renderWisdomTab()}
        {activeTab === 'fortune' && renderFortuneTab()}
      </View>

      {/* "Dla kogoś" Modal */}
      <Modal visible={showFsModal} transparent animationType="slide" onRequestClose={() => setShowFsModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={() => setShowFsModal(false)} />
          <LinearGradient
            colors={isLight ? ['#FFFFFF', '#F5F0E8'] : ['#1A0A0A', '#140610']}
            style={[ch.fsSheet, { borderTopColor: ACCENT + '40' }]}
          >
              <View style={ch.fsHandle} />
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                <View style={ch.fsSheetHeader}>
                  <Typography variant="heading" style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>
                    {t('chineseHoroscope.horoskop_dla_kogos', 'Horoskop dla kogoś')}
                  </Typography>
                  <Pressable onPress={() => setShowFsModal(false)} hitSlop={12}>
                    <X size={20} color={subColor} />
                  </Pressable>
                </View>
                <Typography variant="body" style={{ color: subColor, fontSize: 13, marginBottom: 18, lineHeight: 18 }}>
                  {t('chineseHoroscope.wprowadz_imie_i_date_urodzenia', 'Wprowadź imię i datę urodzenia osoby, dla której chcesz sprawdzić horoskop')}
                </Typography>
                <TextInput
                  style={[ch.fsInput, { backgroundColor: inputBg, borderColor: cardBorder, color: textColor }]}
                  value={fsNameInput}
                  onChangeText={setFsNameInput}
                  placeholder={t('chineseHoroscope.imie_osoby', 'Imię osoby')}
                  placeholderTextColor={subColor}
                  autoFocus
                  returnKeyType="next"
                />
                <View style={{ marginTop: 12 }}>
                  <DateWheelPicker
                    day={fsPDay}
                    month={fsPMonth}
                    year={fsPYear}
                    onChange={(d, m, y) => { setFsPDay(d); setFsPMonth(m); setFsPYear(y); }}
                    textColor={textColor}
                    accentColor={ACCENT}
                    cardBg={inputBg}
                  />
                </View>
                {/* Formatted date preview */}
                {true && (
                  <View style={{ marginTop: 8, paddingHorizontal: 4 }}>
                    <Typography variant="body" style={{ color: GOLD, fontSize: 12 }}>
                      Data: {String(fsPDay).padStart(2,'0')}.{String(fsPMonth).padStart(2,'0')}.{fsPYear}
                    </Typography>
                  </View>
                )}
                <Pressable
                  onPress={handleFsConfirm}
                  style={[ch.fsCtaBtn, { backgroundColor: ACCENT, opacity: !fsNameInput.trim() ? 0.5 : 1 }]}
                  disabled={!fsNameInput.trim()}
                >
                  <Typography variant="body" style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                    {t('chineseHoroscope.sprawdz_horoskop', 'Sprawdź horoskop')}
                  </Typography>
                </Pressable>
                {forSomeone && (
                  <Pressable onPress={() => { clearForSomeone(); setShowFsModal(false); }} style={{ marginTop: 12, alignItems: 'center' }}>
                    <Typography variant="body" style={{ color: subColor, fontSize: 13 }}>{t('chineseHoroscope.wroc_do_swojego_horoskopu', 'Wróć do swojego horoskopu')}</Typography>
                  </Pressable>
                )}
              </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
    </View>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const ch = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  themeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 2,
  },
  yearInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  calcBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statChip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  numBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  colorChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  dirChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  traitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  famousChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
  },
  animalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  fsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: layout.padding.screen,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  myBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  detailPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 80,
  },
  monthChip: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 52,
  },
  animalSelectChip: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    width: (SW - layout.padding.screen * 2 - 8 * 3) / 4,
  },
  aiBtn: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodChip: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  trigramChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  loShuPill: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillarCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  fsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  fsOverlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  fsSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderTopWidth: 1,
  },
  fsHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  fsSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fsInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  fsCtaBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});
