// @ts-nocheck
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Modal,
  TouchableOpacity, Dimensions, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, FlatList, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeInUp, ZoomIn,
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, interpolate, Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Text as SvgText, Path, Line, G, Defs, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';
import {
  ChevronLeft, Star, Sparkles, X, BookOpen, Brain,
  Wind, Scroll, RotateCcw, Save, Users, ChevronRight,
  FlipHorizontal2, Zap, MoonStar, Flame,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { useTranslation } from 'react-i18next';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#8B5CF6';

// ── DATA ──────────────────────────────────────────────────────────────────────

interface Rune {
  id: string;
  symbol: string;
  name: string;
  polish_name: string;
  meaning: string;
  reversed_meaning: string;
  color: string;
  element: 'ogień' | 'woda' | 'powietrze' | 'ziemia' | 'lód' | 'los';
  deity: string;
  tree: string;
  stone: string;
  aett: 1 | 2 | 3;
  aett_name: string;
  keywords: string[];
  meditation_breath: string;
}

const FUTHARK_RUNES: Rune[] = [
  // ── AETT 1: Freyra ──
  {
    id: 'fehu', symbol: 'ᚠ', name: 'Fehu', polish_name: 'Bogactwo',
    meaning: 'Fehu to runa obfitości, płynącej energii i materialnej siły twórczej. Symbolizuje nie tylko bogactwo zewnętrzne, ale i wewnętrzny potencjał, który szuka wyrazu w świecie. Jej pojawienie wskazuje na czas płodności i możliwości, które wymagają odwagi, by je pochwycić.',
    reversed_meaning: 'Zablokowany przepływ energii lub strata materialna. Czas refleksji nad wartościami i tym, co naprawdę liczy się w życiu.',
    color: '#F59E0B', element: 'ogień',
    deity: 'Freyr', tree: 'Buk', stone: 'Karbunkuł',
    aett: 1, aett_name: "Aett Freyra",
    keywords: ['bogactwo', 'obfitość', 'energia', 'potencjał'],
    meditation_breath: '4-4-4-4',
  },
  {
    id: 'uruz', symbol: 'ᚢ', name: 'Uruz', polish_name: 'Siła',
    meaning: 'Uruz jest runą dzikiej siły, zdrowia i pierwotnej witalności. To energia tura — nieokiełznana, potężna, pełna życia. Wskazuje na czas regeneracji, odwagi cielesnej i powrotu do korzeni własnej mocy.',
    reversed_meaning: 'Stagnacja lub choroba. Czas, by zadbać o ciało i nie tłumić swojej naturalnej siły.',
    color: '#EF4444', element: 'ziemia',
    deity: 'Thor', tree: 'Brzoza', stone: 'Karneol',
    aett: 1, aett_name: "Aett Freyra",
    keywords: ['siła', 'zdrowie', 'witalność', 'dzikość'],
    meditation_breath: '6-0-6-0',
  },
  {
    id: 'thurisaz', symbol: 'ᚦ', name: 'Thurisaz', polish_name: 'Cierń',
    meaning: 'Thurisaz to runa ochrony i destrukcji w służbie odrodzenia. Jak cierń, który rani, lecz chroni różę — jej pojawienie wskazuje na konieczność konfrontacji z tym, co blokuje drogę. To energia przełamywania oporu.',
    reversed_meaning: 'Działanie pochopne lub destrukcja bez celu. Uważaj na impulsywność i nieprzemyślane decyzje.',
    color: '#DC2626', element: 'ogień',
    deity: 'Thor / Olbrzym', tree: 'Głóg', stone: 'Szafir',
    aett: 1, aett_name: "Aett Freyra",
    keywords: ['ochrona', 'konfrontacja', 'siła', 'odrodzenie'],
    meditation_breath: '4-7-8-0',
  },
  {
    id: 'ansuz', symbol: 'ᚨ', name: 'Ansuz', polish_name: 'Słowo',
    meaning: 'Ansuz to runa boskiej mowy, komunikacji i mądrości Odyna. Wskazuje na czas, gdy słowa mają szczególną moc — warto słuchać głębiej, zarówno siebie, jak i otoczenia. Objawienia i przesłania są bliskie.',
    reversed_meaning: 'Zniekształcona komunikacja lub manipulacja słowem. Uważaj na dezinformację i sprawdzaj źródła.',
    color: '#3B82F6', element: 'powietrze',
    deity: 'Odyn', tree: 'Jesion', stone: 'Turkus',
    aett: 1, aett_name: "Aett Freyra",
    keywords: ['słowo', 'mądrość', 'komunikacja', 'objawienie'],
    meditation_breath: '5-5-5-5',
  },
  {
    id: 'raidho', symbol: 'ᚱ', name: 'Raidho', polish_name: 'Podróż',
    meaning: 'Raidho to runa podróży, rytmu i właściwego kursu. Nie tylko wskazuje na fizyczne przemieszczanie się, ale i na wewnętrzną wędrówkę ku przeznaczeniu. Wszystko zmierza we właściwym kierunku, gdy ta runa się pojawia.',
    reversed_meaning: 'Utknięcie, opóźnienia lub zboczenie z kursu. Czas ocenić, czy idziesz właściwą ścieżką.',
    color: '#F97316', element: 'powietrze',
    deity: 'Ing / Odyn', tree: 'Dąb', stone: 'Rubin',
    aett: 1, aett_name: "Aett Freyra",
    keywords: ['podróż', 'kierunek', 'rytm', 'przeznaczenie'],
    meditation_breath: '4-4-4-4',
  },
  {
    id: 'kenaz', symbol: 'ᚲ', name: 'Kenaz', polish_name: 'Pochodnia',
    meaning: 'Kenaz to runa pochodni wiedzy i twórczego ognia. Oświetla ciemność nieświadomości i daje narzędzia do transformacji surowego materiału w dzieło. Czas nauki, tworzenia i rozpalania wewnętrznego płomienia.',
    reversed_meaning: 'Zgaszona iskra lub strata zdolności twórczych. Wróć do tego, co naprawdę cię rozpala.',
    color: '#FBBF24', element: 'ogień',
    deity: 'Freya', tree: 'Sosna', stone: 'Bursztyn',
    aett: 1, aett_name: "Aett Freyra",
    keywords: ['wiedza', 'twórczość', 'ogień', 'oświecenie'],
    meditation_breath: '4-4-6-2',
  },
  {
    id: 'gebo', symbol: 'ᚷ', name: 'Gebo', polish_name: 'Dar',
    meaning: 'Gebo to runa daru i wzajemności, gdzie dawanie i otrzymywanie tworzą świętą równowagę. Pojawia się, gdy relacje wchodzą na nowy poziom głębi lub gdy ważny dar — materialny bądź duchowy — zbliża się do ciebie.',
    reversed_meaning: 'Gebo nie ma klasycznego odwrócenia — dar jest zawsze darem. Rozważaj jednak, czy twoja wymiana energii jest naprawdę zrównoważona.',
    color: '#EC4899', element: 'powietrze',
    deity: 'Odyn / Freya', tree: 'Jesion', stone: 'Opal',
    aett: 1, aett_name: "Aett Freyra",
    keywords: ['dar', 'wzajemność', 'relacje', 'równowaga'],
    meditation_breath: '5-0-5-0',
  },
  {
    id: 'wunjo', symbol: 'ᚹ', name: 'Wunjo', polish_name: 'Radość',
    meaning: 'Wunjo przynosi radość, harmonię i spełnienie. To runa, która wskazuje na czas, gdy trudności mijają i możemy cieszyć się owocami naszej pracy. Społeczność, przynależność i poczucie bycia na właściwym miejscu.',
    reversed_meaning: 'Blokada radości lub wyobcowanie. Poszukaj źródeł smutku i pozwól sobie na uzdrowienie.',
    color: '#A3E635', element: 'powietrze',
    deity: 'Odyn / Baldr', tree: 'Jesion', stone: 'Diament',
    aett: 1, aett_name: "Aett Freyra",
    keywords: ['radość', 'harmonia', 'spełnienie', 'wspólnota'],
    meditation_breath: '6-2-6-2',
  },
  // ── AETT 2: Hagalla ──
  {
    id: 'hagalaz', symbol: 'ᚺ', name: 'Hagalaz', polish_name: 'Grad',
    meaning: 'Hagalaz to runa niszczycielskiej siły natury, która otwiera drogę do odrodzenia. Jak grad, który niszczy plony, ale użyźnia ziemię — jej pojawienie zapowiada wstrząs, który w ostateczności przynosi oczyszczenie.',
    reversed_meaning: 'Hagalaz nie ma odwrócenia — zmiana jest nieuchronna. Pytanie brzmi, jak przyjmiesz to, co nadchodzi.',
    color: '#E2E8F0', element: 'lód',
    deity: 'Heimdall / Hel', tree: 'Cis', stone: 'Onyks',
    aett: 2, aett_name: "Aett Hagalla",
    keywords: ['chaos', 'odrodzenie', 'oczyszczenie', 'nieuchronność'],
    meditation_breath: '4-4-8-0',
  },
  {
    id: 'nauthiz', symbol: 'ᚾ', name: 'Nauthiz', polish_name: 'Konieczność',
    meaning: 'Nauthiz to runa konieczności i ograniczeń, które uczą cierpliwości i wytrwałości. W ciemności tej runy tkwi ziarno siły — to właśnie w najtrudniejszych chwilach odkrywamy, kim naprawdę jesteśmy.',
    reversed_meaning: 'Opór przed nieuniknionymi zmianami lub nadmierna zależność. Czas zaakceptować to, czego nie możesz zmienić.',
    color: '#64748B', element: 'lód',
    deity: 'Nornowie', tree: 'Buk', stone: 'Obsydian',
    aett: 2, aett_name: "Aett Hagalla",
    keywords: ['konieczność', 'cierpliwość', 'wytrwałość', 'ograniczenie'],
    meditation_breath: '4-4-4-4',
  },
  {
    id: 'isa', symbol: 'ᛁ', name: 'Isa', polish_name: 'Lód',
    meaning: 'Isa to runa lodu, zatrzymania i skupienia. Wszystko zastyga, by mogło zostać ujrzane w swojej istocie. Czas refleksji, introspekcji i cierpliwego oczekiwania — nie jest to pora na działanie, lecz na rozumienie.',
    reversed_meaning: 'Isa nie ma odwrócenia, lecz może wskazywać na nadmierne zamrożenie emocji lub stagnację wymagającą rozluźnienia.',
    color: '#BAE6FD', element: 'lód',
    deity: 'Verðandi (Norna)', tree: 'Alder', stone: 'Kryształ górski',
    aett: 2, aett_name: "Aett Hagalla",
    keywords: ['zatrzymanie', 'introspekcja', 'skupienie', 'oczekiwanie'],
    meditation_breath: '8-4-8-4',
  },
  {
    id: 'jera', symbol: 'ᛃ', name: 'Jera', polish_name: 'Plon',
    meaning: 'Jera to runa cyklów, plonów i naturalnego rytmu czasu. To co zostało zasiane, teraz dojrzewa. Cierpliwość i praca z naturalnymi cyklami przynoszą obfitość — wyniki działań stają się widoczne.',
    reversed_meaning: 'Jera nie ma odwrócenia — cykl trwa. Może jednak wskazywać na niecierpliwość lub próbę skrócenia naturalnego procesu.',
    color: '#86EFAC', element: 'ziemia',
    deity: 'Freyr / Freya', tree: 'Dąb', stone: 'Malachit',
    aett: 2, aett_name: "Aett Hagalla",
    keywords: ['cykl', 'plon', 'cierpliwość', 'owoce'],
    meditation_breath: '5-5-5-5',
  },
  {
    id: 'eihwaz', symbol: 'ᛇ', name: 'Eihwaz', polish_name: 'Cis',
    meaning: 'Eihwaz to runa cisu — drzewa, które łączy światy żywych i umarłych. Symbolizuje siłę, która trwa przez próby, wytrwałość i zdolność do transformacji przez śmierć tego, co było. Wskazuje na głębię, której nie widać na powierzchni.',
    reversed_meaning: 'Nieumiejętność puszczenia przeszłości lub strach przed konieczną transformacją. Zaufaj procesowi.',
    color: '#4ADE80', element: 'ziemia',
    deity: 'Odyn (Yggdrasil)', tree: 'Cis', stone: 'Jaspis',
    aett: 2, aett_name: "Aett Hagalla",
    keywords: ['wytrwałość', 'transformacja', 'głębia', 'połączenie'],
    meditation_breath: '4-7-8-0',
  },
  {
    id: 'perthro', symbol: 'ᛈ', name: 'Perthro', polish_name: 'Przeznaczenie',
    meaning: 'Perthro to runa losu, tajemnicy i ukrytych możliwości. Jak rzut kostką — kryje w sobie wszystkie potencjalności. Wskazuje na czas, gdy przeznaczenie ujawnia swoje karty i gdy warto zaufać niewidzialnemu.',
    reversed_meaning: 'Opór przed nieznanym lub lęk przed losem. Zaufaj, że to co się wyłania, ma swój cel.',
    color: '#A855F7', element: 'los',
    deity: 'Nornowie / Freya', tree: 'Jabłoń', stone: 'Akwamaryn',
    aett: 2, aett_name: "Aett Hagalla",
    keywords: ['los', 'tajemnica', 'możliwości', 'przeznaczenie'],
    meditation_breath: '6-6-6-6',
  },
  {
    id: 'algiz', symbol: 'ᛉ', name: 'Algiz', polish_name: 'Łoś',
    meaning: 'Algiz to runa ochrony i łączności z wyższą siłą. Jak poroże łosia wyciągniętego ku niebu — wskazuje na duchową opiekę i instynkt samozachowawczy. Czas zaufania intuicji i szukania schronienia w sacrum.',
    reversed_meaning: 'Osłabione granice lub otwarcie na niepożądane energetyczne wpływy. Wzmocnij swoją duchową ochronę.',
    color: '#C084FC', element: 'powietrze',
    deity: 'Heimdall', tree: 'Cisowe poroże', stone: 'Ametyst',
    aett: 2, aett_name: "Aett Hagalla",
    keywords: ['ochrona', 'intuicja', 'duchowość', 'granice'],
    meditation_breath: '4-4-6-2',
  },
  {
    id: 'sowilo', symbol: 'ᛊ', name: 'Sowilo', polish_name: 'Słońce',
    meaning: 'Sowilo to runa słońca, sukcesu i zwycięstwa nad ciemnością. Jej pojawienie przynosi klarowność, pewność siebie i zdolność do osiągania celów. Światło, które rozświetla każdą ciemność i nadaje kierunek.',
    reversed_meaning: 'Sowilo nie ma odwrócenia — słońce zawsze świeci. Może jednak wskazywać na potrzebę uznania własnego blasku.',
    color: '#FDE047', element: 'ogień',
    deity: 'Sol (bogini słońca)', tree: 'Jałowiec', stone: 'Rubin / Złoto',
    aett: 2, aett_name: "Aett Hagalla",
    keywords: ['sukces', 'klarowność', 'zwycięstwo', 'światło'],
    meditation_breath: '6-2-6-2',
  },
  // ── AETT 3: Tyra ──
  {
    id: 'tiwaz', symbol: 'ᛏ', name: 'Tiwaz', polish_name: 'Sprawiedliwość',
    meaning: 'Tiwaz to runa Tyra — boga sprawiedliwości i ofiary. Wskazuje na czas, gdy prawość jest ważniejsza niż wygoda, i gdy honorowe działanie prowadzi do zwycięstwa. Siła i odwaga służące wyższemu porządkowi.',
    reversed_meaning: 'Niesprawiedliwość lub działanie wbrew swoim wartościom. Czas powrotu do etycznego kompasu.',
    color: '#60A5FA', element: 'powietrze',
    deity: 'Tyr', tree: 'Dąb', stone: 'Koral',
    aett: 3, aett_name: "Aett Tyra",
    keywords: ['sprawiedliwość', 'honor', 'odwaga', 'prawość'],
    meditation_breath: '4-4-4-4',
  },
  {
    id: 'berkano', symbol: 'ᛒ', name: 'Berkano', polish_name: 'Brzoza',
    meaning: 'Berkano to runa brzozy — bogini macierzyństwa, odrodzenia i nowych początków. Wskazuje na czas narodzin, płodności i troskliwej opieki. Coś nowego przychodzi na świat lub wymaga pielęgnacji.',
    reversed_meaning: 'Stłumiony wzrost lub trudności w rodzeniu się nowego. Jakiej troski potrzebuje ten nowy kiełek?',
    color: '#6EE7B7', element: 'ziemia',
    deity: 'Frigg / Nerthus', tree: 'Brzoza', stone: 'Księżycowy kamień',
    aett: 3, aett_name: "Aett Tyra",
    keywords: ['narodziny', 'płodność', 'pielęgnacja', 'odrodzenie'],
    meditation_breath: '5-5-5-5',
  },
  {
    id: 'ehwaz', symbol: 'ᛖ', name: 'Ehwaz', polish_name: 'Koń',
    meaning: 'Ehwaz to runa konia — harmonijnego partnerstwa między jeźdźcem a wierzchowcem. Wskazuje na czas, gdy współpraca i zaufanie prowadzą dalej niż samodzielne działanie. Dusza i ciało, człowiek i siły nadprzyrodzone — razem.',
    reversed_meaning: 'Brak harmonii w partnerstwie lub nieufność. Zastanów się, gdzie brakuje synchronizacji.',
    color: '#F0ABFC', element: 'ziemia',
    deity: 'Freyr / Frigg', tree: 'Jesion / Dąb', stone: 'Ikaryt (piasek słoneczny)',
    aett: 3, aett_name: "Aett Tyra",
    keywords: ['partnerstwo', 'zaufanie', 'harmonia', 'podróż'],
    meditation_breath: '4-4-4-4',
  },
  {
    id: 'mannaz', symbol: 'ᛗ', name: 'Mannaz', polish_name: 'Człowiek',
    meaning: 'Mannaz to runa ludzkości i indywidualności zakorzenionej we wspólnocie. Wskazuje na czas samopoznania, refleksji nad swoim miejscem wśród innych i rozumienia wzajemnych zależności. Kim jesteś w oczach własnych i innych?',
    reversed_meaning: 'Izolacja, egoizm lub zagubienie własnej tożsamości. Powróć do głębszego rozumienia siebie.',
    color: '#FB923C', element: 'powietrze',
    deity: 'Odyn i Frigg (stworzyli człowieka)', tree: 'Jesion', stone: 'Bursztyn',
    aett: 3, aett_name: "Aett Tyra",
    keywords: ['człowiek', 'tożsamość', 'wspólnota', 'samopoznanie'],
    meditation_breath: '5-5-5-5',
  },
  {
    id: 'laguz', symbol: 'ᛚ', name: 'Laguz', polish_name: 'Woda',
    meaning: 'Laguz to runa wody — płynności, intuicji i nieświadomych głębi. Wskazuje na czas ufania uczuciom i podążania za naturalnym nurtem życia. Jak woda znajdująca swoją drogę — nie walcz, płyń.',
    reversed_meaning: 'Przytłoczenie emocjami lub utopienie się w nieświadomości. Potrzebujesz stałego gruntu pod nogami.',
    color: '#38BDF8', element: 'woda',
    deity: 'Nerthus / Njord', tree: 'Wierzba', stone: 'Perła / Akwamaryn',
    aett: 3, aett_name: "Aett Tyra",
    keywords: ['woda', 'intuicja', 'emocje', 'głębia'],
    meditation_breath: '6-0-6-0',
  },
  {
    id: 'ingwaz', symbol: 'ᛜ', name: 'Ingwaz', polish_name: 'Nasienie',
    meaning: 'Ingwaz to runa nasienia — skumulowanej potencjalności czekającej na właściwy moment, by eksplodować życiem. Wskazuje na wewnętrzne dojrzewanie, które niedługo ujawni swój efekt. Cierpliwe oczekiwanie zostanie nagrodzone.',
    reversed_meaning: 'Ingwaz nie ma odwrócenia — nasienie jest pełne. Może jednak wskazywać na blokadę procesu kiełkowania.',
    color: '#84CC16', element: 'ziemia',
    deity: 'Freyr (Ing)', tree: 'Jabłoń', stone: 'Jadeit',
    aett: 3, aett_name: "Aett Tyra",
    keywords: ['potencjał', 'dojrzewanie', 'kiełkowanie', 'wewnętrzna siła'],
    meditation_breath: '4-4-8-0',
  },
  {
    id: 'dagaz', symbol: 'ᛞ', name: 'Dagaz', polish_name: 'Świt',
    meaning: 'Dagaz to runa przełomu — świtu po najciemniejszej nocy. Wskazuje na transformację, przebudzenie i moment, gdy wszystko się zmienia. To runa paradoksu i transcendencji, gdzie przeciwieństwa łączą się w jedność.',
    reversed_meaning: 'Dagaz nie ma odwrócenia — świt zawsze nadejdzie. Może wskazywać na trudność zaakceptowania transformacji.',
    color: '#FCD34D', element: 'ogień',
    deity: 'Heimdall / Baldr', tree: 'Świerk', stone: 'Cytryn',
    aett: 3, aett_name: "Aett Tyra",
    keywords: ['przełom', 'świt', 'transformacja', 'przebudzenie'],
    meditation_breath: '6-2-6-2',
  },
  {
    id: 'othala', symbol: 'ᛟ', name: 'Othala', polish_name: 'Dziedzictwo',
    meaning: 'Othala to runa dziedzictwa, korzeni i tego, co przechodzi z pokolenia na pokolenie. Wskazuje na czas, gdy przeszłość dostarcza siły do budowania przyszłości. Rodzina, tradycja i święte miejsce zakorzenienia.',
    reversed_meaning: 'Uwięzienie przez przeszłość lub odcięcie od korzeni. Czas zbadać, co warte jest zachowania, a co puszczenia.',
    color: '#A78BFA', element: 'ziemia',
    deity: 'Odyn (Allfather)', tree: 'Hawthorn', stone: 'Rubin',
    aett: 3, aett_name: "Aett Tyra",
    keywords: ['dziedzictwo', 'korzenie', 'przodkowie', 'dom'],
    meditation_breath: '5-5-5-5',
  },
  // ── Wyrd (Blank) ──
  {
    id: 'wyrd', symbol: '⬡', name: 'Wyrd', polish_name: 'Przeznaczenie',
    meaning: 'Wyrd, runa pusta — wyraża to, co jeszcze nie ma kształtu, los ukryty poza zasięgiem wiedzy. Jej pojawienie mówi, że odpowiedź na twoje pytanie leży poza obecnym rozumieniem. Zaufaj przepływowi i otwórz się na nieznane.',
    reversed_meaning: 'Wyrd nie ma odwrócenia — wszystko jest możliwe, nic nie jest pewne.',
    color: '#94A3B8', element: 'los',
    deity: 'Nornowie (Urd, Verðandi, Skuld)', tree: 'Wszystkie drzewa', stone: 'Meteoryт / Labradoryt',
    aett: 1, aett_name: "Poza Aettami",
    keywords: ['tajemnica', 'potencjał', 'nieznane', 'zaufanie'],
    meditation_breath: '4-4-4-4',
  },
];

// ── SPREAD DEFINITIONS ─────────────────────────────────────────────────────────

interface Spread {
  id: string;
  name: string;
  polish_desc: string;
  count: number;
  positions: string[];
  layout_hint: string;
}

const SPREADS: Spread[] = [
  {
    id: '1',
    name: 'Jedna Runa',
    polish_desc: 'Jedno przesłanie na dziś lub odpowiedź na pytanie',
    count: 1,
    positions: ['Przesłanie'],
    layout_hint: 'single',
  },
  {
    id: '3',
    name: 'Trzy Runy',
    polish_desc: 'Przeszłość • Teraźniejszość • Przyszłość',
    count: 3,
    positions: ['Przeszłość', 'Teraźniejszość', 'Przyszłość'],
    layout_hint: 'row',
  },
  {
    id: 'celtic',
    name: 'Krzyż Celtycki',
    polish_desc: 'Sześć run — sytuacja, wyzwanie, fundament, przeszłość, możliwe przyszłości, wynik',
    count: 6,
    positions: ['Sytuacja', 'Wyzwanie', 'Fundament', 'Przeszłość', 'Przyszłość', 'Wynik'],
    layout_hint: 'cross',
  },
  {
    id: 'sword',
    name: 'Miecz',
    polish_desc: 'Pięć run w kształcie miecza — energia, kierunek, przeszkoda, siła, cel',
    count: 5,
    positions: ['Energia', 'Kierunek', 'Przeszkoda', 'Siła', 'Cel'],
    layout_hint: 'sword',
  },
  {
    id: 'aett',
    name: 'Aett',
    polish_desc: 'Osiem run — pełna mapa ośmiu kierunków twojego życia',
    count: 8,
    positions: ['Północ', 'Wschód', 'Południe', 'Zachód', 'Góra', 'Dół', 'Środek', 'Cel'],
    layout_hint: 'compass',
  },
];

// ── AETT GROUPINGS ─────────────────────────────────────────────────────────────

const AETT_INFO = [
  {
    number: 1,
    name: "Aett Freyra",
    deity: 'Freyr i Freya',
    theme: 'Stworzenie, obfitość i radość życia — pierwotne siły twórcze',
    color: '#F59E0B',
    runes: ['fehu','uruz','thurisaz','ansuz','raidho','kenaz','gebo','wunjo'],
  },
  {
    number: 2,
    name: "Aett Hagalla",
    deity: 'Heimdall',
    theme: 'Siły chaosu, cykl natury i prawa przeznaczenia',
    color: '#64748B',
    runes: ['hagalaz','nauthiz','isa','jera','eihwaz','perthro','algiz','sowilo'],
  },
  {
    number: 3,
    name: "Aett Tyra",
    deity: 'Tyr',
    theme: 'Ludzkie doświadczenie, społeczeństwo i duchowy porządek',
    color: '#60A5FA',
    runes: ['tiwaz','berkano','ehwaz','mannaz','laguz','ingwaz','dagaz','othala'],
  },
];

// ── JOURNAL ────────────────────────────────────────────────────────────────────

interface RuneJournalEntry {
  id: string;
  date: string;
  question: string;
  spreadName: string;
  runeIds: string[];
  reversedFlags: boolean[];
  interpretation: string;
  reflection: string;
}

// ── BACKGROUND ────────────────────────────────────────────────────────────────

const RuneBg = ({ isLight }: { isLight: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight ? ['#F5F0FF', '#EDE5FF', '#F8F4FF'] : ['#0A0610', '#0D0718', '#07040F']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={700} style={StyleSheet.absoluteFill} opacity={isLight ? 0.08 : 0.14}>
      <Circle cx={SW / 2} cy={320} r={220} stroke={ACCENT} strokeWidth={0.6} fill="none" strokeDasharray="6 12" />
      <Circle cx={SW / 2} cy={320} r={170} stroke={ACCENT} strokeWidth={0.4} fill="none" strokeDasharray="3 8" />
      <Circle cx={SW / 2} cy={320} r={80} stroke={ACCENT} strokeWidth={0.5} fill="none" />
      {Array.from({ length: 20 }, (_, i) => (
        <Circle key={i} cx={(i * 113 + 22) % SW} cy={(i * 79 + 40) % 680}
          r={i % 4 === 0 ? 1.4 : 0.6} fill={ACCENT} opacity={0.2} />
      ))}
    </Svg>
  </View>
);

// ── RUNE CIRCLE HERO ──────────────────────────────────────────────────────────

const RuneCircleHero = ({ isLight }: { isLight: boolean }) => {
  const R = 100;
  const cx = SW / 2;
  const cy = 130;
  const count = 8;
  const displayed = FUTHARK_RUNES.slice(0, count);
  const rotate = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(withTiming(360, { duration: 30000, easing: Easing.linear }), -1, false);
  }, []);

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <View style={{ height: 270, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SW} height={260}>
        <Circle cx={cx} cy={cy} r={R + 10} stroke={ACCENT} strokeWidth={0.7} fill="none" strokeDasharray="5 10" opacity={0.4} />
        <Circle cx={cx} cy={cy} r={R} stroke={ACCENT} strokeWidth={0.4} fill="none" opacity={0.25} />
        {displayed.map((rune, i) => {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          const x = cx + R * Math.cos(angle);
          const y = cy + R * Math.sin(angle);
          return (
            <React.Fragment key={rune.id}>
              <Circle cx={x} cy={y} r={22} fill={rune.color + '22'} stroke={rune.color + '55'} strokeWidth={0.8} />
              <SvgText x={x} y={y + 9} textAnchor="middle" fontSize={20} fill={rune.color} opacity={0.85}>
                {rune.symbol}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Circle cx={cx} cy={cy} r={32} fill={ACCENT + '18'} stroke={ACCENT + '44'} strokeWidth={1} />
        <SvgText x={cx} y={cy + 8} textAnchor="middle" fontSize={26} fill={ACCENT} opacity={0.9}>ᚠ</SvgText>
      </Svg>
      <View style={{ alignItems: 'center', marginTop: -10 }}>
        <Text style={{ color: isLight ? '#1A1410' : '#F5F1EA', fontSize: 22, fontWeight: '300', letterSpacing: 3 }}>
          WYROCZNIA RUN
        </Text>
        <Text style={{ color: ACCENT + 'BB', fontSize: 12, letterSpacing: 2, marginTop: 4 }}>
          ELDER FUTHARK · 24+1
        </Text>
      </View>
    </View>
  );
};

// ── RUNE BAG ANIMATION ─────────────────────────────────────────────────────────

const RuneBagCast = ({ casting, onCast }: { casting: boolean; onCast: () => void }) => {
  const shake = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (casting) {
      shake.value = withRepeat(withSequence(
        withTiming(8, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(0, { duration: 80 }),
      ), 3, false);
      glow.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.3, { duration: 200 }),
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 400 }),
      );
    }
  }, [casting]);

  const bagStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
    opacity: interpolate(glow.value, [0, 1], [0.85, 1]),
  }));

  return (
    <Animated.View style={[bagStyle, { alignItems: 'center', marginBottom: 12 }]}>
      <Svg width={80} height={90}>
        {/* Bag body */}
        <Path
          d="M15 35 Q10 30 12 20 Q15 8 40 6 Q65 8 68 20 Q70 30 65 35 L65 72 Q65 80 40 82 Q15 80 15 72 Z"
          fill={ACCENT + '30'}
          stroke={ACCENT + '88'}
          strokeWidth={1.5}
        />
        {/* Bag tie */}
        <Path
          d="M22 20 Q40 15 58 20"
          stroke={ACCENT}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
        />
        {/* Rune symbols peeking out */}
        <SvgText x={30} y={52} textAnchor="middle" fontSize={14} fill={ACCENT} opacity={0.7}>ᚠ</SvgText>
        <SvgText x={50} y={60} textAnchor="middle" fontSize={12} fill={'#F59E0B'} opacity={0.6}>ᚢ</SvgText>
        <SvgText x={40} y={70} textAnchor="middle" fontSize={10} fill={'#EC4899'} opacity={0.5}>ᚷ</SvgText>
        {/* Sparkle particles when casting */}
        {casting && (
          <>
            <Circle cx={25} cy={18} r={2} fill="#FDE047" opacity={0.9} />
            <Circle cx={55} cy={14} r={1.5} fill={ACCENT} opacity={0.8} />
            <Circle cx={40} cy={10} r={2.5} fill="#38BDF8" opacity={0.7} />
          </>
        )}
      </Svg>
    </Animated.View>
  );
};

// ── FLASHCARD STUDY ────────────────────────────────────────────────────────────

const RuneFlashcard = ({ rune, onNext, onPrev, index, total, isLight, textColor, subColor, cardBg, cardBorder }:
  { rune: Rune; onNext: () => void; onPrev: () => void; index: number; total: number; isLight: boolean; textColor: string; subColor: string; cardBg: string; cardBorder: string }) => {
  const [flipped, setFlipped] = useState(false);
  const flip = useSharedValue(0);

  const flipCard = () => {
    void HapticsService.selection();
    const next = !flipped;
    setFlipped(next);
    flip.value = withSpring(next ? 180 : 0, { damping: 14 });
  };

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${flip.value}deg` }],
    opacity: interpolate(flip.value, [0, 90, 180], [1, 0, 0]),
    position: 'absolute', width: '100%',
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${flip.value - 180}deg` }],
    opacity: interpolate(flip.value, [0, 90, 180], [0, 0, 1]),
    position: 'absolute', width: '100%',
  }));

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginBottom: 12 }}>
        {index + 1} / {total}  ·  DOTKNIJ KARTĘ BY ODWRÓCIĆ
      </Text>
      <Pressable onPress={flipCard} style={{ height: 220, width: SW - layout.padding.screen * 2 }}>
        <Animated.View style={[{ height: 220, width: '100%', borderRadius: 20, backgroundColor: isLight ? '#FAF7FF' : '#1A0B30', borderWidth: 1, borderColor: rune.color + '55', alignItems: 'center', justifyContent: 'center', padding: 20 }, frontStyle]}>
          <Text style={{ fontSize: 72, lineHeight: 88, color: rune.color }}>{rune.symbol}</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '300', letterSpacing: 2, marginTop: 4 }}>{rune.name}</Text>
          <View style={{ backgroundColor: rune.color + '22', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 }}>
            <Text style={{ color: rune.color, fontSize: 11, fontWeight: '600', letterSpacing: 1.2 }}>{rune.polish_name.toUpperCase()}</Text>
          </View>
          <Text style={{ color: subColor, fontSize: 10, marginTop: 12, letterSpacing: 0.8 }}>{rune.element.toUpperCase()} · {rune.aett_name.toUpperCase()}</Text>
        </Animated.View>
        <Animated.View style={[{ height: 220, width: '100%', borderRadius: 20, backgroundColor: isLight ? '#F0EAFF' : '#120820', borderWidth: 1, borderColor: rune.color + '55', padding: 20 }, backStyle]}>
          <Text style={{ color: subColor, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8 }}>SŁOWA KLUCZOWE</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {rune.keywords.map(kw => (
              <View key={kw} style={{ backgroundColor: rune.color + '20', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ color: rune.color, fontSize: 11 }}>{kw}</Text>
              </View>
            ))}
          </View>
          <Text style={{ color: subColor, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 4 }}>BÓSTWO · DRZEWO · KAMIEŃ</Text>
          <Text style={{ color: textColor, fontSize: 12, lineHeight: 18 }}>{rune.deity}  ·  {rune.tree}  ·  {rune.stone}</Text>
          <View style={{ borderTopWidth: 1, borderTopColor: rune.color + '33', marginTop: 10, paddingTop: 8 }}>
            <Text style={{ color: subColor, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 2 }}>MEDYTACJA</Text>
            <Text style={{ color: ACCENT, fontSize: 11 }}>Rytm oddechu: {rune.meditation_breath}</Text>
          </View>
        </Animated.View>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
        <Pressable onPress={onPrev} style={{ backgroundColor: cardBg, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: cardBorder }}>
          <Text style={{ color: subColor, fontSize: 13 }}>‹ Poprzednia</Text>
        </Pressable>
        <Pressable onPress={onNext} style={{ backgroundColor: ACCENT + '20', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: ACCENT + '55' }}>
          <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>Następna ›</Text>
        </Pressable>
      </View>
    </View>
  );
};

// ── MEDITATION VIEW ────────────────────────────────────────────────────────────

const RuneMeditation = ({ rune, isLight, textColor, subColor }: { rune: Rune; isLight: boolean; textColor: string; subColor: string }) => {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<'inhale'|'hold'|'exhale'|'pause'>('inhale');
  const [count, setCount] = useState(0);
  const circleScale = useSharedValue(0.6);
  const pulseOpacity = useSharedValue(0.3);
  const timerRef = useRef<any>(null);

  const phases = rune.meditation_breath.split('-').map(Number);
  const phaseLabels: ('inhale'|'hold'|'exhale'|'pause')[] = ['inhale','hold','exhale','pause'];
  const phaseNames = ['Wdech', 'Zatrzymanie', 'Wydech', 'Przerwa'];

  const startMeditation = () => {
    setActive(true);
    runPhase(0, 0);
  };

  const runPhase = (phaseIdx: number, cycle: number) => {
    const duration = phases[phaseIdx] * 1000;
    if (duration === 0) {
      const next = (phaseIdx + 1) % 4;
      const newCycle = next === 0 ? cycle + 1 : cycle;
      setCount(newCycle);
      timerRef.current = setTimeout(() => runPhase(next, newCycle), 50);
      return;
    }
    setPhase(phaseLabels[phaseIdx]);
    if (phaseIdx === 0) {
      circleScale.value = withTiming(1.0, { duration, easing: Easing.out(Easing.ease) });
      pulseOpacity.value = withTiming(0.7, { duration });
    } else if (phaseIdx === 2) {
      circleScale.value = withTiming(0.6, { duration, easing: Easing.in(Easing.ease) });
      pulseOpacity.value = withTiming(0.2, { duration });
    }
    timerRef.current = setTimeout(() => {
      const next = (phaseIdx + 1) % 4;
      const newCycle = next === 0 ? cycle + 1 : cycle;
      setCount(newCycle);
      runPhase(next, newCycle);
    }, duration);
  };

  const stopMeditation = () => {
    setActive(false);
    setPhase('inhale');
    setCount(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    circleScale.value = withSpring(0.6);
    pulseOpacity.value = withTiming(0.3, { duration: 400 });
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: circleScale.value }], opacity: pulseOpacity.value }));
  const phaseIndex = phaseLabels.indexOf(phase);

  return (
    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
      <Text style={{ color: subColor, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>MEDYTACJA Z RUNĄ</Text>
      <Text style={{ color: rune.color, fontSize: 48, lineHeight: 60, marginBottom: 4 }}>{rune.symbol}</Text>
      <Text style={{ color: isLight ? '#1A1410' : '#F5F1EA', fontSize: 16, fontWeight: '300', letterSpacing: 1.5, marginBottom: 16 }}>{rune.name} — {rune.polish_name}</Text>

      <View style={{ position: 'relative', width: 180, height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Animated.View style={[{
          width: 160, height: 160, borderRadius: 80,
          backgroundColor: rune.color + '18',
          borderWidth: 1.5, borderColor: rune.color + '55',
          position: 'absolute',
        }, circleStyle]} />
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: rune.color + '25', borderWidth: 1, borderColor: rune.color, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 36, color: rune.color }}>{rune.symbol}</Text>
        </View>
        {active && (
          <Text style={{ position: 'absolute', bottom: 8, color: isLight ? '#1A1410' : '#F5F1EA', fontSize: 13, fontWeight: '500' }}>
            {phaseNames[phaseIndex]}
          </Text>
        )}
      </View>

      <Text style={{ color: subColor, fontSize: 12, marginBottom: 6 }}>
        Rytm: {rune.meditation_breath} (wdech-zatrzymanie-wydech-przerwa)
      </Text>
      {active && (
        <Text style={{ color: rune.color, fontSize: 13, marginBottom: 10, fontWeight: '500' }}>
          Cykl {count + 1}
        </Text>
      )}

      <Pressable
        onPress={active ? stopMeditation : startMeditation}
        style={{ paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24, backgroundColor: active ? '#EF4444' + '22' : rune.color + '22', borderWidth: 1, borderColor: active ? '#EF4444' + '66' : rune.color + '66' }}
      >
        <Text style={{ color: active ? '#EF4444' : rune.color, fontSize: 14, fontWeight: '600', letterSpacing: 0.8 }}>
          {active ? 'Zatrzymaj' : 'Rozpocznij medytację'}
        </Text>
      </Pressable>

      <View style={{ marginTop: 20, paddingHorizontal: 24 }}>
        <Text style={{ color: subColor, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
          Wizualizuj symbolᛛ{rune.name} w złotym świetle przed sobą. Z każdym wdechem przyjmujesz jej energię. Z każdym wydechem uwalniasz opór.
        </Text>
      </View>
    </View>
  );
};

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────

export const RuneCastScreen: React.FC = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeName, addFavoriteItem, isFavoriteItem, removeFavoriteItem, userData } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');

  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.10)';

  // Cast state
  const [activeSpread, setActiveSpread] = useState<Spread>(SPREADS[1]);
  const [castResult, setCastResult] = useState<Rune[] | null>(null);
  const [reversedFlags, setReversedFlags] = useState<boolean[]>([]);
  const [allowReversed, setAllowReversed] = useState(true);
  const [casting, setCasting] = useState(false);
  const [question, setQuestion] = useState('');
  const [showSpreadModal, setShowSpreadModal] = useState(false);

  // UI tabs
  const [activeTab, setActiveTab] = useState<'cast' | 'library' | 'study' | 'aetts' | 'journal'>('cast');

  // Rune detail modal
  const [activeRune, setActiveRune] = useState<Rune | null>(null);
  const [showRuneModal, setShowRuneModal] = useState(false);
  const [showMeditationInModal, setShowMeditationInModal] = useState(false);

  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  // Study mode
  const [studyIndex, setStudyIndex] = useState(0);
  const studyRunes = FUTHARK_RUNES.filter(r => r.id !== 'wyrd');

  // Journal
  const [journalEntries, setJournalEntries] = useState<RuneJournalEntry[]>([]);
  const [showJournalSave, setShowJournalSave] = useState(false);
  const [journalReflection, setJournalReflection] = useState('');

  const isFav = isFavoriteItem('rune-cast');

  // ── CAST ────────────────────────────────────────────────────────────────────

  const castRunes = useCallback(() => {
    if (casting) return;
    void HapticsService.impact();
    setCasting(true);
    setAiInterpretation('');
    setCastResult(null);
    setTimeout(() => {
      const count = activeSpread.count;
      const pool = [...FUTHARK_RUNES];
      const shuffled = pool.sort(() => Math.random() - 0.5);
      const drawn = shuffled.slice(0, count);
      setCastResult(drawn);
      setReversedFlags(Array.from({ length: count }, () => allowReversed && Math.random() > 0.7));
      setCasting(false);
      void HapticsService.notify();
    }, 900);
  }, [casting, activeSpread, allowReversed]);

  // ── AI INTERPRETATION ────────────────────────────────────────────────────────

  const interpretWithAI = useCallback(async () => {
    if (!castResult || castResult.length === 0) return;
    void HapticsService.selection();
    setAiLoading(true);
    setShowAiModal(true);
    setAiInterpretation('');
    try {
      const runeDescriptions = castResult.map((r, i) => {
        const rev = reversedFlags[i] ? ' (ODWRÓCONA)' : '';
        const pos = activeSpread.positions[i];
        return `Pozycja "${pos}": ${r.name} (${r.polish_name})${rev} — ${rev ? r.reversed_meaning : r.meaning}`;
      }).join('\n');

      const questionPart = question.trim()
        ? `Pytanie zadane: "${question.trim()}"\n\n`
        : 'Ogólna interpretacja układu.\n\n';

      const messages = [
        {
          role: 'user' as const,
          content: `Jesteś mistrzem run nordyckich z głęboką znajomością Elder Futhark i mitologii nordyckiej. Zinterpretuj poniższy układ run w języku użytkownika, w stylu duchowym i poetyckim, odwołując się do mitów nordyckich, symboliki każdej runy i jej pozycji w układzie.\n\n${questionPart}Układ: ${activeSpread.name}\n\n${runeDescriptions}\n\nDaj pełną, inspirującą interpretację (4–6 akapitów). Na końcu dodaj jedno zdanie "Przesłanie dla ciebie:" jako kluczowy wniosek.`,
        },
      ];

      const response = await AiService.chatWithOracle(messages);
      setAiInterpretation(response);
    } catch (e) {
      setAiInterpretation('Przepraszam — nie udało się nawiązać połączenia z wyroczni. Zaufaj swojej własnej intuicji przy odczytaniu tych run.');
    } finally {
      setAiLoading(false);
    }
  }, [castResult, reversedFlags, activeSpread, question]);

  // ── JOURNAL SAVE ────────────────────────────────────────────────────────────

  const saveToJournal = useCallback(() => {
    if (!castResult) return;
    const entry: RuneJournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      question: question.trim() || 'Ogólny rozkład',
      spreadName: activeSpread.name,
      runeIds: castResult.map(r => r.id),
      reversedFlags,
      interpretation: aiInterpretation,
      reflection: journalReflection,
    };
    setJournalEntries(prev => [entry, ...prev]);
    setShowJournalSave(false);
    setJournalReflection('');
    void HapticsService.notify();
    Alert.alert('Zapisano', 'Twój rozkład run został zapisany w dzienniku.');
  }, [castResult, question, activeSpread, reversedFlags, aiInterpretation, journalReflection]);

  // ── MODAL OPEN/CLOSE ─────────────────────────────────────────────────────────

  const openRuneModal = useCallback((rune: Rune) => {
    void HapticsService.selection();
    setActiveRune(rune);
    setShowMeditationInModal(false);
    setShowRuneModal(true);
  }, []);

  const closeRuneModal = useCallback(() => {
    setShowRuneModal(false);
    setTimeout(() => setActiveRune(null), 300);
  }, []);

  // ── STAR FAVORITE ────────────────────────────────────────────────────────────

  const toggleFav = () => {
    void HapticsService.selection();
    if (isFav) {
      removeFavoriteItem('rune-cast');
    } else {
      addFavoriteItem({ id: 'rune-cast', label: 'Runy Futhark', route: 'RuneCast', params: {}, icon: 'Sparkles', color: ACCENT, addedAt: new Date().toISOString() });
    }
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────

  const TABS = [
    { id: 'cast', label: 'Rzut' },
    { id: 'library', label: 'Biblioteka' },
    { id: 'study', label: 'Nauka' },
    { id: 'aetts', label: 'Aetty' },
    { id: 'journal', label: 'Dziennik' },
  ] as const;

  return (
    <View style={[rc.container, { backgroundColor: isLight ? '#F5F0FF' : '#0A0610' }]}>
      <RuneBg isLight={isLight} />
      <SafeAreaView edges={['top']} style={rc.safe}>

        {/* HEADER */}
        <View style={rc.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={rc.iconBtn} hitSlop={20}>
            <ChevronLeft color={ACCENT} size={26} strokeWidth={1.6} />
          </Pressable>
          <View style={rc.headerCenter}>
            <Text style={[rc.headerEyebrow, { color: ACCENT }]}>✦ RUNY FUTHARK</Text>
            <Text style={[rc.headerTitle, { color: textColor }]}>Wyrocznia Run</Text>
          </View>
          <Pressable onPress={toggleFav} style={rc.iconBtn} hitSlop={12}>
            <Star color={isFav ? ACCENT : ACCENT + '88'} size={18} strokeWidth={1.8} fill={isFav ? ACCENT : 'none'} />
          </Pressable>
        </View>

        {/* TABS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={rc.tabRowWrap} contentContainerStyle={rc.tabRow}>
          {TABS.map(t => (
            <Pressable
              key={t.id}
              onPress={() => setActiveTab(t.id)}
              style={[rc.tab, activeTab === t.id && { borderBottomColor: ACCENT, borderBottomWidth: 2 }]}
            >
              <Text style={[rc.tabLabel, { color: activeTab === t.id ? ACCENT : subColor }]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView
          contentContainerStyle={{ paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') + 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO */}
          <Animated.View entering={FadeInDown.duration(500)}>
            <RuneCircleHero isLight={isLight} />
          </Animated.View>

          {/* ══════════════════════════════════════════════
              TAB: CAST
          ══════════════════════════════════════════════ */}
          {activeTab === 'cast' && (
            <>
              {/* Spread selector button */}
              <Animated.View entering={FadeInUp.duration(400).delay(60)} style={{ marginHorizontal: layout.padding.screen, marginBottom: 12 }}>
                <Pressable
                  onPress={() => setShowSpreadModal(true)}
                  style={[rc.spreadSelector, { backgroundColor: cardBg, borderColor: ACCENT + '55' }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>WYBRANY ROZKŁAD</Text>
                    <Text style={{ color: textColor, fontSize: 16, fontWeight: '300', marginTop: 2 }}>{activeSpread.name}</Text>
                    <Text style={{ color: subColor, fontSize: 12, marginTop: 2 }}>{activeSpread.polish_desc}</Text>
                  </View>
                  <ChevronRight color={ACCENT} size={18} strokeWidth={1.6} />
                </Pressable>
              </Animated.View>

              {/* Reversed toggle */}
              <Animated.View entering={FadeInUp.duration(400).delay(100)} style={[rc.reversedToggleRow, { marginHorizontal: layout.padding.screen }]}>
                <FlipHorizontal2 color={allowReversed ? ACCENT : subColor} size={16} strokeWidth={1.6} />
                <Text style={{ color: allowReversed ? textColor : subColor, fontSize: 13, flex: 1, marginLeft: 8 }}>Odwrócone runy</Text>
                <Pressable
                  onPress={() => { setAllowReversed(v => !v); void HapticsService.selection(); }}
                  style={[rc.toggleTrack, { backgroundColor: allowReversed ? ACCENT + '40' : cardBg, borderColor: allowReversed ? ACCENT : cardBorder }]}
                >
                  <View style={[rc.toggleThumb, { backgroundColor: allowReversed ? ACCENT : subColor, alignSelf: allowReversed ? 'flex-end' : 'flex-start' }]} />
                </Pressable>
              </Animated.View>

              {/* Question input */}
              <Animated.View entering={FadeInUp.duration(400).delay(130)} style={{ marginHorizontal: layout.padding.screen, marginBottom: 16 }}>
                <TextInput
                  value={question}
                  onChangeText={setQuestion}
                  placeholder="Zadaj pytanie wyroczni (opcjonalnie)..."
                  placeholderTextColor={subColor + '88'}
                  style={[rc.questionInput, { backgroundColor: cardBg, borderColor: cardBorder, color: textColor }]}
                  multiline
                />
              </Animated.View>

              {/* Rune bag + cast button */}
              <Animated.View entering={FadeInUp.duration(400).delay(160)} style={rc.castBtnWrap}>
                <RuneBagCast casting={casting} onCast={castRunes} />
                <Pressable onPress={castRunes} disabled={casting}>
                  <LinearGradient
                    colors={[ACCENT, '#6D28D9']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={rc.castBtn}
                  >
                    <Sparkles color="#fff" size={18} strokeWidth={1.8} />
                    <Text style={rc.castBtnText}>{casting ? 'Losowanie...' : 'RZUĆ RUNY'}</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              {/* Results */}
              {castResult && castResult.length > 0 && (
                <Animated.View entering={FadeInDown.duration(600)} style={{ marginHorizontal: layout.padding.screen }}>

                  {/* Position header strip */}
                  <View style={[rc.resultHeader, { backgroundColor: ACCENT + '14', borderColor: ACCENT + '30' }]}>
                    <Sparkles color={ACCENT} size={14} strokeWidth={1.6} />
                    <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600', letterSpacing: 1.2, marginLeft: 6 }}>
                      {activeSpread.name.toUpperCase()} · {castResult.length} {castResult.length === 1 ? 'RUNA' : 'RUNY'}
                    </Text>
                  </View>

                  {/* Rune stones */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={rc.stonesRow}>
                    {castResult.map((rune, i) => {
                      const isReversed = reversedFlags[i] ?? false;
                      const pos = activeSpread.positions[i];
                      return (
                        <Animated.View key={rune.id + i} entering={ZoomIn.duration(420).delay(i * 110)}>
                          <View style={{ alignItems: 'center' }}>
                            {activeSpread.count > 1 && (
                              <Text style={{ color: subColor, fontSize: 9, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4, textAlign: 'center', width: 96 }} numberOfLines={1}>{pos}</Text>
                            )}
                            <Pressable
                              onPress={() => openRuneModal(rune)}
                              style={[rc.runeStone, {
                                backgroundColor: isLight ? 'rgba(255,255,255,0.90)' : 'rgba(20,12,40,0.90)',
                                borderColor: rune.color + '66',
                              }]}
                            >
                              {isReversed && (
                                <View style={rc.reversedBadge}>
                                  <RotateCcw color="#EF4444" size={8} strokeWidth={2} />
                                  <Text style={rc.reversedBadgeText}>Odwr.</Text>
                                </View>
                              )}
                              <Text style={[rc.runeSymbolLarge, {
                                color: rune.color,
                                transform: isReversed ? [{ rotate: '180deg' }] : [],
                              }]}>
                                {rune.symbol}
                              </Text>
                              <Text style={[rc.runeNameSmall, { color: textColor }]} numberOfLines={1}>{rune.name}</Text>
                              <Text style={[rc.runePolishSmall, { color: subColor }]} numberOfLines={1}>{rune.polish_name}</Text>
                              <View style={{ backgroundColor: rune.color + '22', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, marginTop: 4 }}>
                                <Text style={{ color: rune.color, fontSize: 8, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' }}>{rune.element}</Text>
                              </View>
                            </Pressable>
                          </View>
                        </Animated.View>
                      );
                    })}
                  </ScrollView>

                  {/* Quick meanings strip */}
                  <View style={{ marginTop: 16, gap: 8 }}>
                    {castResult.map((rune, i) => {
                      const isReversed = reversedFlags[i] ?? false;
                      return (
                        <Animated.View key={rune.id + '_meaning_' + i} entering={FadeInDown.duration(400).delay(i * 80)}>
                          <Pressable
                            onPress={() => openRuneModal(rune)}
                            style={[rc.meaningCard, { backgroundColor: cardBg, borderColor: rune.color + '44', borderLeftColor: rune.color, borderLeftWidth: 3 }]}
                          >
                            <Text style={[rc.meaningCardSymbol, { color: rune.color, transform: isReversed ? [{ rotate: '180deg' }] : [] }]}>{rune.symbol}</Text>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                <Text style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>{rune.name}</Text>
                                <Text style={{ color: ACCENT, fontSize: 10 }}>· {rune.polish_name}</Text>
                                {isReversed && <View style={{ backgroundColor: '#EF444420', borderRadius: 4, paddingHorizontal: 4 }}><Text style={{ color: '#EF4444', fontSize: 9, fontWeight: '700' }}>ODWRÓCONA</Text></View>}
                              </View>
                              <Text style={{ color: subColor, fontSize: 12, lineHeight: 17 }} numberOfLines={2}>
                                {isReversed ? rune.reversed_meaning : rune.meaning}
                              </Text>
                            </View>
                          </Pressable>
                        </Animated.View>
                      );
                    })}
                  </View>

                  {/* AI interpretation button */}
                  <Animated.View entering={FadeInDown.duration(400).delay(300)}>
                    <Pressable
                      onPress={interpretWithAI}
                      style={[rc.aiCtaBtn, { borderColor: ACCENT + '55' }]}
                    >
                      <LinearGradient colors={[ACCENT + '25', '#6D28D9' + '25']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                      <Sparkles color={ACCENT} size={17} strokeWidth={1.6} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>Interpretuj Rozkład</Text>
                        <Text style={{ color: subColor, fontSize: 11, marginTop: 1 }}>Oracle AI analizuje układ run</Text>
                      </View>
                      <ChevronRight color={ACCENT} size={16} strokeWidth={1.6} />
                    </Pressable>
                  </Animated.View>

                  {/* Journal & Re-cast row */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <Pressable
                      onPress={() => setShowJournalSave(true)}
                      style={[rc.actionBtn, { flex: 1, backgroundColor: cardBg, borderColor: cardBorder }]}
                    >
                      <Save color={subColor} size={14} strokeWidth={1.6} />
                      <Text style={{ color: subColor, fontSize: 13 }}>Zapisz</Text>
                    </Pressable>
                    <Pressable
                      onPress={castRunes}
                      style={[rc.actionBtn, { flex: 1, backgroundColor: cardBg, borderColor: ACCENT + '55' }]}
                    >
                      <RotateCcw color={ACCENT} size={14} strokeWidth={1.6} />
                      <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '500' }}>Rzuć ponownie</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              )}

              {/* Empty state */}
              {!castResult && !casting && (
                <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ alignItems: 'center', paddingVertical: 32, marginHorizontal: layout.padding.screen }}>
                  <Text style={{ color: subColor, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                    Wybierz rozkład, sformułuj pytanie{'\n'}i rzuć runy, by ujawnić przesłanie.
                  </Text>
                </Animated.View>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════
              TAB: LIBRARY
          ══════════════════════════════════════════════ */}
          {activeTab === 'library' && (
            <Animated.View entering={FadeInDown.duration(400)} style={{ marginHorizontal: layout.padding.screen }}>
              <Text style={[rc.sectionTitle, { color: subColor }]}>24 RUNY ELDER FUTHARK + WYRD</Text>
              <View style={rc.libGrid}>
                {FUTHARK_RUNES.map((rune, i) => (
                  <Animated.View key={rune.id} entering={FadeInDown.duration(300).delay(i * 25)}>
                    <Pressable
                      onPress={() => openRuneModal(rune)}
                      style={[rc.libCell, { backgroundColor: cardBg, borderColor: rune.color + '44' }]}
                    >
                      <Text style={[rc.libSymbol, { color: rune.color }]}>{rune.symbol}</Text>
                      <Text style={[rc.libName, { color: textColor }]} numberOfLines={1}>{rune.name}</Text>
                      <Text style={[rc.libElement, { color: subColor }]} numberOfLines={1}>{rune.element}</Text>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* ══════════════════════════════════════════════
              TAB: STUDY (FLASHCARDS)
          ══════════════════════════════════════════════ */}
          {activeTab === 'study' && (
            <Animated.View entering={FadeInDown.duration(400)} style={{ marginHorizontal: layout.padding.screen }}>
              <View style={[rc.studyHeader, { backgroundColor: ACCENT + '14', borderColor: ACCENT + '30' }]}>
                <Brain color={ACCENT} size={16} strokeWidth={1.6} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '700', letterSpacing: 1.2 }}>FISZKI RUNICZNE</Text>
                  <Text style={{ color: subColor, fontSize: 11, marginTop: 1 }}>Dotknij kartę by zobaczyć znaczenie</Text>
                </View>
                <Text style={{ color: subColor, fontSize: 11 }}>{studyIndex + 1}/{studyRunes.length}</Text>
              </View>

              <RuneFlashcard
                rune={studyRunes[studyIndex]}
                index={studyIndex}
                total={studyRunes.length}
                isLight={isLight}
                textColor={textColor}
                subColor={subColor}
                cardBg={cardBg}
                cardBorder={cardBorder}
                onNext={() => setStudyIndex(v => (v + 1) % studyRunes.length)}
                onPrev={() => setStudyIndex(v => (v - 1 + studyRunes.length) % studyRunes.length)}
              />

              {/* Mini aett indicator */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 20, justifyContent: 'center' }}>
                {AETT_INFO.map(a => (
                  <View key={a.number} style={{ alignItems: 'center', gap: 3 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: a.color + (studyRunes[studyIndex]?.aett === a.number ? 'FF' : '44') }} />
                    <Text style={{ color: subColor, fontSize: 9, letterSpacing: 0.5 }}>Aett {a.number}</Text>
                  </View>
                ))}
              </View>

              {/* Meditation for studied rune */}
              <View style={[rc.studyMeditationCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Wind color={ACCENT} size={16} strokeWidth={1.6} />
                  <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>Medytacja z runą</Text>
                </View>
                <RuneMeditation
                  rune={studyRunes[studyIndex]}
                  isLight={isLight}
                  textColor={textColor}
                  subColor={subColor}
                />
              </View>
            </Animated.View>
          )}

          {/* ══════════════════════════════════════════════
              TAB: AETTS
          ══════════════════════════════════════════════ */}
          {activeTab === 'aetts' && (
            <Animated.View entering={FadeInDown.duration(400)} style={{ marginHorizontal: layout.padding.screen }}>
              <Text style={[rc.sectionTitle, { color: subColor }]}>TRZY AETTY — GRUPY RUNICZNE</Text>
              <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
                24 runy Elder Futhark dzielą się na trzy grupy — aetty. Każda jest pod patronatem innych bóstw i reprezentuje inny wymiar doświadczenia.
              </Text>

              {AETT_INFO.map((aett, ai) => (
                <Animated.View key={aett.number} entering={FadeInDown.duration(400).delay(ai * 100)}>
                  <View style={[rc.aettCard, { backgroundColor: cardBg, borderColor: aett.color + '44', borderLeftColor: aett.color }]}>
                    <View style={[rc.aettHeader, { backgroundColor: aett.color + '18' }]}>
                      <Text style={{ color: aett.color, fontSize: 18, fontWeight: '700', letterSpacing: 0.5 }}>{aett.name}</Text>
                      <Text style={{ color: aett.color + 'BB', fontSize: 11, marginTop: 2 }}>Patronat: {aett.deity}</Text>
                    </View>
                    <Text style={{ color: subColor, fontSize: 13, lineHeight: 19, margin: 14 }}>{aett.theme}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingBottom: 14 }}>
                      {aett.runes.map(runeId => {
                        const rune = FUTHARK_RUNES.find(r => r.id === runeId);
                        if (!rune) return null;
                        return (
                          <Pressable
                            key={runeId}
                            onPress={() => openRuneModal(rune)}
                            style={[rc.aettRuneChip, { backgroundColor: rune.color + '18', borderColor: rune.color + '55' }]}
                          >
                            <Text style={{ color: rune.color, fontSize: 18 }}>{rune.symbol}</Text>
                            <Text style={{ color: textColor, fontSize: 10, fontWeight: '600', marginTop: 2 }}>{rune.name}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </Animated.View>
              ))}

              {/* Wyrd special */}
              <Animated.View entering={FadeInDown.duration(400).delay(350)}>
                <View style={[rc.aettCard, { backgroundColor: cardBg, borderColor: '#94A3B844', borderLeftColor: '#94A3B8', marginTop: 8 }]}>
                  <View style={[rc.aettHeader, { backgroundColor: '#94A3B818' }]}>
                    <Text style={{ color: '#94A3B8', fontSize: 18, fontWeight: '700' }}>Wyrd — Pusta Runa</Text>
                    <Text style={{ color: '#94A3B8BB', fontSize: 11, marginTop: 2 }}>Poza podziałem aettów</Text>
                  </View>
                  <Text style={{ color: subColor, fontSize: 13, lineHeight: 19, margin: 14 }}>
                    Wyrd to runa bez symbolu — czyste przeznaczenie. Pojawiła się w tradycji runomantii jako symbol tego, co poza ludzkim rozumieniem. Niektórzy runiści nie uznają jej; inni traktują jako najsilniejszą spośród wszystkich.
                  </Text>
                  <Pressable
                    onPress={() => openRuneModal(FUTHARK_RUNES.find(r => r.id === 'wyrd')!)}
                    style={[rc.aettRuneChip, { backgroundColor: '#94A3B818', borderColor: '#94A3B855', marginHorizontal: 14, marginBottom: 14, width: 72 }]}
                  >
                    <Text style={{ color: '#94A3B8', fontSize: 22 }}>⬡</Text>
                    <Text style={{ color: textColor, fontSize: 10, fontWeight: '600', marginTop: 2 }}>Wyrd</Text>
                  </Pressable>
                </View>
              </Animated.View>
            </Animated.View>
          )}

          {/* ══════════════════════════════════════════════
              TAB: JOURNAL
          ══════════════════════════════════════════════ */}
          {activeTab === 'journal' && (
            <Animated.View entering={FadeInDown.duration(400)} style={{ marginHorizontal: layout.padding.screen }}>
              <Text style={[rc.sectionTitle, { color: subColor }]}>DZIENNIK RUNICZNY</Text>

              {journalEntries.length === 0 ? (
                <View style={[rc.emptyState, { borderColor: cardBorder }]}>
                  <Text style={{ fontSize: 36, marginBottom: 10 }}>ᛟ</Text>
                  <Text style={{ color: subColor, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                    Twój dziennik jest pusty.{'\n'}Wykonaj rozkład i zapisz go tutaj.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {journalEntries.map((entry, i) => {
                    const runes = entry.runeIds.map(id => FUTHARK_RUNES.find(r => r.id === id)).filter(Boolean);
                    const d = new Date(entry.date);
                    return (
                      <Animated.View key={entry.id} entering={FadeInDown.duration(300).delay(i * 60)}>
                        <View style={[rc.journalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600', letterSpacing: 0.8 }}>{entry.spreadName}</Text>
                            <Text style={{ color: subColor, fontSize: 11 }}>
                              {d.getDate()}.{String(d.getMonth() + 1).padStart(2, '0')}.{d.getFullYear()}
                            </Text>
                          </View>
                          {entry.question !== 'Ogólny rozkład' && (
                            <Text style={{ color: textColor, fontSize: 13, fontStyle: 'italic', marginBottom: 8, opacity: 0.85 }}>
                              „{entry.question}"
                            </Text>
                          )}
                          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                            {runes.map((r, ri) => (
                              <View key={ri} style={{ alignItems: 'center' }}>
                                <Text style={{ color: r.color, fontSize: 20, transform: entry.reversedFlags[ri] ? [{ rotate: '180deg' }] : [] }}>
                                  {r.symbol}
                                </Text>
                                <Text style={{ color: subColor, fontSize: 9, marginTop: 2 }}>{r.name}</Text>
                              </View>
                            ))}
                          </View>
                          {entry.reflection.length > 0 && (
                            <View style={{ borderTopWidth: 1, borderTopColor: cardBorder, paddingTop: 8, marginTop: 4 }}>
                              <Text style={{ color: subColor, fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 4 }}>REFLEKSJA</Text>
                              <Text style={{ color: textColor, fontSize: 12, lineHeight: 18 }}>{entry.reflection}</Text>
                            </View>
                          )}
                        </View>
                      </Animated.View>
                    );
                  })}
                </View>
              )}
            </Animated.View>
          )}

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>

      {/* ══════════════════════════════════════════════
          MODAL: SPREAD SELECTOR
      ══════════════════════════════════════════════ */}
      <Modal visible={showSpreadModal} transparent animationType="slide" onRequestClose={() => setShowSpreadModal(false)}>
        <View style={rc.bottomSheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSpreadModal(false)} />
          <View style={[rc.bottomSheet, { backgroundColor: isLight ? '#FAF7FF' : '#110A24' }]}>
            <View style={[rc.sheetHandle, { backgroundColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)' }]} />
            <Text style={[rc.sheetTitle, { color: textColor }]}>Wybierz Rozkład</Text>
            <Text style={{ color: subColor, fontSize: 12, marginBottom: 16, marginTop: -8 }}>Każdy rozkład ujawnia inny wymiar</Text>
            <View style={{ gap: 10 }}>
              {SPREADS.map(spread => (
                <Pressable
                  key={spread.id}
                  onPress={() => { setActiveSpread(spread); setCastResult(null); setShowSpreadModal(false); void HapticsService.selection(); }}
                  style={[rc.spreadOption, {
                    backgroundColor: activeSpread.id === spread.id ? ACCENT + '18' : cardBg,
                    borderColor: activeSpread.id === spread.id ? ACCENT + '66' : cardBorder,
                  }]}
                >
                  <View style={[rc.spreadCountBadge, { backgroundColor: ACCENT + '22' }]}>
                    <Text style={{ color: ACCENT, fontSize: 15, fontWeight: '700' }}>{spread.count}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>{spread.name}</Text>
                    <Text style={{ color: subColor, fontSize: 12, marginTop: 2 }}>{spread.polish_desc}</Text>
                    <Text style={{ color: ACCENT + '88', fontSize: 11, marginTop: 3 }}>
                      {spread.positions.join(' · ')}
                    </Text>
                  </View>
                  {activeSpread.id === spread.id && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT }} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL: AI INTERPRETATION
      ══════════════════════════════════════════════ */}
      <Modal visible={showAiModal} transparent animationType="fade" onRequestClose={() => setShowAiModal(false)}>
        <View style={rc.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => !aiLoading && setShowAiModal(false)} />
          <Animated.View entering={ZoomIn.duration(300)} style={[rc.aiModalCard, { backgroundColor: isLight ? '#FAF7FF' : '#110A24', borderColor: ACCENT + '44' }]}>
            <TouchableOpacity onPress={() => !aiLoading && setShowAiModal(false)} style={rc.modalClose}>
              <X color={subColor} size={20} strokeWidth={1.6} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 4 }}>
              <Sparkles color={ACCENT} size={18} strokeWidth={1.6} />
              <Text style={{ color: textColor, fontSize: 17, fontWeight: '300', letterSpacing: 1 }}>Interpretacja Oracle</Text>
            </View>

            {/* Drawn runes mini row */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {castResult?.map((r, i) => (
                <View key={i} style={{ alignItems: 'center' }}>
                  <Text style={{ color: r.color, fontSize: 22, transform: reversedFlags[i] ? [{ rotate: '180deg' }] : [] }}>{r.symbol}</Text>
                  <Text style={{ color: subColor, fontSize: 9, marginTop: 1 }}>{r.name}</Text>
                </View>
              ))}
            </View>

            <View style={[rc.aiDivider, { backgroundColor: ACCENT + '33' }]} />

            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {aiLoading ? (
                <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
                  <ActivityIndicator color={ACCENT} size="large" />
                  <Text style={{ color: subColor, fontSize: 13 }}>Wyrocznia przemawia...</Text>
                </View>
              ) : (
                <Text style={{ color: textColor, fontSize: 14, lineHeight: 24, paddingTop: 12 }}>
                  {aiInterpretation}
                </Text>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL: RUNE DETAIL
      ══════════════════════════════════════════════ */}
      <Modal visible={showRuneModal} transparent animationType="fade" onRequestClose={closeRuneModal}>
        <View style={rc.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeRuneModal} />
          {activeRune && (
            <Animated.View entering={ZoomIn.duration(300)} style={[rc.modalCard, { backgroundColor: isLight ? '#FAF7FF' : '#110A24', borderColor: activeRune.color + '55' }]}>
              <TouchableOpacity onPress={closeRuneModal} style={rc.modalClose}>
                <X color={subColor} size={20} strokeWidth={1.6} />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                {/* Symbol */}
                <Text style={[rc.modalSymbol, { color: activeRune.color }]}>{activeRune.symbol}</Text>
                <Text style={[rc.modalName, { color: textColor }]}>{activeRune.name}</Text>
                <Text style={[rc.modalPolish, { color: ACCENT }]}>{activeRune.polish_name}</Text>

                {/* Badges row */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 10 }}>
                  <View style={[rc.elementBadge, { backgroundColor: activeRune.color + '22', borderColor: activeRune.color + '55' }]}>
                    <Text style={[rc.elementBadgeText, { color: activeRune.color }]}>{activeRune.element.toUpperCase()}</Text>
                  </View>
                  <View style={[rc.elementBadge, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '44' }]}>
                    <Text style={[rc.elementBadgeText, { color: ACCENT }]}>{activeRune.aett_name.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Details grid */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                  {[
                    { label: 'BÓSTWO', value: activeRune.deity },
                    { label: 'DRZEWO', value: activeRune.tree },
                    { label: 'KAMIEŃ', value: activeRune.stone },
                  ].map(d => (
                    <View key={d.label} style={[rc.detailCell, { backgroundColor: cardBg, borderColor: cardBorder, flex: 1 }]}>
                      <Text style={{ color: subColor, fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginBottom: 3 }}>{d.label}</Text>
                      <Text style={{ color: textColor, fontSize: 11, fontWeight: '500', textAlign: 'center' }}>{d.value}</Text>
                    </View>
                  ))}
                </View>

                {/* Keywords */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, justifyContent: 'center' }}>
                  {activeRune.keywords.map(kw => (
                    <View key={kw} style={{ backgroundColor: activeRune.color + '18', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: activeRune.color + '33' }}>
                      <Text style={{ color: activeRune.color, fontSize: 11 }}>{kw}</Text>
                    </View>
                  ))}
                </View>

                <View style={[rc.modalDivider, { backgroundColor: activeRune.color + '33' }]} />

                {/* Meaning */}
                <Text style={[rc.modalSectionLabel, { color: subColor }]}>ZNACZENIE</Text>
                <Text style={[rc.modalMeaning, { color: textColor }]}>{activeRune.meaning}</Text>

                {/* Reversed */}
                <Text style={[rc.modalSectionLabel, { color: subColor, marginTop: 14 }]}>ODWRÓCONA</Text>
                <Text style={[rc.modalReversed, { color: subColor }]}>{activeRune.reversed_meaning}</Text>

                {/* Meditation rhythm */}
                <View style={[rc.meditationRow, { backgroundColor: activeRune.color + '14', borderColor: activeRune.color + '33' }]}>
                  <Wind color={activeRune.color} size={14} strokeWidth={1.6} />
                  <Text style={{ color: activeRune.color, fontSize: 12, marginLeft: 6, fontWeight: '500' }}>
                    Rytm oddechu: {activeRune.meditation_breath}
                  </Text>
                </View>

                {/* Meditation toggle button */}
                <Pressable
                  onPress={() => setShowMeditationInModal(v => !v)}
                  style={[rc.meditationToggleBtn, { borderColor: activeRune.color + '55', backgroundColor: activeRune.color + '14' }]}
                >
                  <Wind color={activeRune.color} size={14} strokeWidth={1.6} />
                  <Text style={{ color: activeRune.color, fontSize: 13, marginLeft: 6, fontWeight: '500' }}>
                    {showMeditationInModal ? 'Ukryj medytację' : 'Otwórz medytację z runą'}
                  </Text>
                </Pressable>

                {showMeditationInModal && (
                  <RuneMeditation rune={activeRune} isLight={isLight} textColor={textColor} subColor={subColor} />
                )}
              </ScrollView>
            </Animated.View>
          )}
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL: JOURNAL SAVE
      ══════════════════════════════════════════════ */}
      <Modal visible={showJournalSave} transparent animationType="slide" onRequestClose={() => setShowJournalSave(false)}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <View style={rc.bottomSheetOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowJournalSave(false)} />
            <View style={[rc.bottomSheet, { backgroundColor: isLight ? '#FAF7FF' : '#110A24' }]}>
              <View style={[rc.sheetHandle, { backgroundColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)' }]} />
              <Text style={[rc.sheetTitle, { color: textColor }]}>Zapisz w Dzienniku</Text>

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {castResult?.map((r, i) => (
                  <View key={i} style={{ alignItems: 'center' }}>
                    <Text style={{ color: r.color, fontSize: 22, transform: reversedFlags[i] ? [{ rotate: '180deg' }] : [] }}>{r.symbol}</Text>
                    <Text style={{ color: subColor, fontSize: 9 }}>{r.name}</Text>
                  </View>
                ))}
              </View>

              <Text style={{ color: subColor, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6 }}>TWOJA REFLEKSJA</Text>
              <TextInput
                value={journalReflection}
                onChangeText={setJournalReflection}
                placeholder="Co czujesz? Jakie myśli wzbudziły te runy?..."
                placeholderTextColor={subColor + '88'}
                style={[rc.journalInput, { backgroundColor: cardBg, borderColor: cardBorder, color: textColor }]}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <Pressable onPress={() => setShowJournalSave(false)} style={[rc.sheetBtn, { backgroundColor: cardBg, borderColor: cardBorder, flex: 1 }]}>
                  <Text style={{ color: subColor, fontSize: 14 }}>Anuluj</Text>
                </Pressable>
                <Pressable onPress={saveToJournal} style={{ flex: 2 }}>
                  <LinearGradient colors={[ACCENT, '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[rc.sheetBtn, { borderColor: 'transparent' }]}>
                    <Save color="#fff" size={14} strokeWidth={1.8} />
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 6 }}>Zapisz</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// ── STYLES ────────────────────────────────────────────────────────────────────

const rc = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingVertical: 10 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow: { fontSize: 10, fontWeight: '600', letterSpacing: 2.5 },
  headerTitle: { fontSize: 17, fontWeight: '300', letterSpacing: 1.2, marginTop: 2 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  // Tabs
  tabRowWrap: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(139,92,246,0.20)' },
  tabRow: { flexDirection: 'row', paddingHorizontal: layout.padding.screen },
  tab: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 13, fontWeight: '500', letterSpacing: 0.4 },

  // Spread selector
  spreadSelector: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },

  // Reversed toggle
  reversedToggleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  toggleTrack: { width: 42, height: 24, borderRadius: 12, borderWidth: 1, padding: 3, justifyContent: 'center' },
  toggleThumb: { width: 16, height: 16, borderRadius: 8 },

  // Question input
  questionInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, minHeight: 64, textAlignVertical: 'top' },

  // Cast
  castBtnWrap: { marginHorizontal: layout.padding.screen, marginBottom: 24, alignItems: 'center' },
  castBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, width: SW - layout.padding.screen * 2 },
  castBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.5 },

  // Result header strip
  resultHeader: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 14 },

  // Rune stones
  stonesRow: { flexDirection: 'row', gap: 10, paddingVertical: 4, paddingBottom: 8 },
  runeStone: {
    width: 96,
    minHeight: 118,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 2,
    overflow: 'hidden',
  },
  runeSymbolLarge: { fontSize: 44, lineHeight: 56 },
  runeNameSmall: { fontSize: 12, fontWeight: '600', marginTop: 2, textAlign: 'center', width: '100%' },
  runePolishSmall: { fontSize: 10, marginTop: 1, textAlign: 'center', width: '100%' },
  reversedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(239,68,68,0.18)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginBottom: 3 },
  reversedBadgeText: { color: '#EF4444', fontSize: 8, fontWeight: '700' },

  // Meaning cards
  meaningCard: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 },
  meaningCardSymbol: { fontSize: 28, lineHeight: 34, width: 34 },

  // Action buttons
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingVertical: 12 },

  // AI CTA
  aiCtaBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 16, overflow: 'hidden' },

  // Section title
  sectionTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 2, marginBottom: 14, marginTop: 4 },

  // Library grid
  libGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  libCell: {
    width: (SW - layout.padding.screen * 2 - 8 * 3) / 4,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  libSymbol: { fontSize: 26 },
  libName: { fontSize: 10, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  libElement: { fontSize: 9, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },

  // Study
  studyHeader: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  studyMeditationCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 20 },

  // Aetts
  aettCard: { borderWidth: 1, borderLeftWidth: 3, borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  aettHeader: { padding: 14 },
  aettRuneChip: { alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, overflow: 'hidden' },

  // Journal
  emptyState: { alignItems: 'center', padding: 40, borderWidth: 1, borderRadius: 16, borderStyle: 'dashed' },
  journalCard: { borderWidth: 1, borderRadius: 14, padding: 14 },
  journalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, minHeight: 100, textAlignVertical: 'top', marginBottom: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: {
    width: SW - 48,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    maxHeight: '88%',
  },
  aiModalCard: {
    width: SW - 40,
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    maxHeight: '85%',
  },
  modalClose: { position: 'absolute', top: 16, right: 16, padding: 4, zIndex: 10 },
  modalSymbol: { fontSize: 80, lineHeight: 96, marginTop: 8 },
  modalName: { fontSize: 22, fontWeight: '300', letterSpacing: 2, marginTop: 4 },
  modalPolish: { fontSize: 13, fontWeight: '600', letterSpacing: 1.5, marginTop: 2, textTransform: 'uppercase' },
  elementBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  elementBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  detailCell: { alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 6 },
  modalDivider: { width: '100%', height: 1, marginVertical: 14 },
  aiDivider: { width: '100%', height: 1, marginBottom: 4 },
  modalSectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, alignSelf: 'flex-start', marginBottom: 6 },
  modalMeaning: { fontSize: 14, lineHeight: 22, textAlign: 'left' },
  modalReversed: { fontSize: 13, lineHeight: 20, textAlign: 'left', fontStyle: 'italic' },
  meditationRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 12 },
  meditationToggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 12, paddingVertical: 10, marginTop: 10 },

  // Bottom sheet
  bottomSheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  bottomSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 32 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 19, fontWeight: '300', letterSpacing: 1, marginBottom: 14 },
  sheetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 12, paddingVertical: 13 },
  spreadOption: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 14 },
  spreadCountBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
