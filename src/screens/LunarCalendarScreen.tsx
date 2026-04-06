// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform, Dimensions, Text, TextInput,
} from 'react-native';
import { MysticalInput } from '../components/MysticalInput';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Ellipse as SvgEllipse } from 'react-native-svg';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, ChevronRight, Star, X, BookOpen, ArrowRight, Moon, Sun, Zap, Users, Wind, Flame, Trash2 } from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { useAppStore, LunarIntent } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
// ── ANIMOWANA SCENA KSIĘŻYCA ─────────────────────────────────
const LunarOrbScene = ({ phase, accent }: { phase: number; accent: string }) => {
  const moonAngle = useSharedValue(0);
  useEffect(() => {
    moonAngle.value = withRepeat(withTiming(360, { duration: 30000, easing: Easing.linear }), -1, false);
  }, []);
  const moonStyle = useAnimatedStyle(() => {
    const rad = moonAngle.value * Math.PI / 180;
    return { transform: [{ translateX: 68 * Math.cos(rad) }, { translateY: 24 * Math.sin(rad) }] };
  });
  const S = 180; const cx = S / 2;
  const lit = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
    const fetchLunarAi = async () => {
    setLunarAiLoading(true);
    HapticsService.notify();
    try {
      const prompt = "Aktualna faza ksiezica: " + todayPhaseName + ". Oswietlenie: " + todayIllumination + "%. Ksiezyc w znaku: " + todayMoonSign.name + " (" + todayMoonSign.element + "). Napisz krotka (3-4 zdania) interpretacje energii tego dnia w kontekscie fazy i znaku ksiezyca oraz jeden praktyczny rytual do wykonania dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setLunarAiInsight(result);
    } catch (e) {
      setLunarAiInsight("Blad pobierania interpretacji.");
    } finally {
      setLunarAiLoading(false);
    }
  };
return (
    <View style={{ height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
      <Svg width={S} height={S}>
        {[...Array(40)].map((_, i) => (
          <Circle key={i} cx={(i * 37 + 11) % S} cy={(i * 53 + 7) % S}
            r={i % 5 === 0 ? 1.8 : 0.9}
            fill="white" opacity={0.2 + (i % 4) * 0.12} />
        ))}
        <Circle cx={cx} cy={cx} r={22} fill="#1A3A5C" />
        <Circle cx={cx} cy={cx} r={22} fill="none" stroke="#4B9CD3" strokeWidth={2} />
        <Circle cx={cx - 6} cy={cx - 4} r={7} fill="#2A6B3A" opacity={0.7} />
        <Circle cx={cx + 8} cy={cx + 6} r={5} fill="#2A6B3A" opacity={0.6} />
        <SvgEllipse cx={cx} cy={cx} rx={68} ry={24} fill="none" stroke={accent + "44"} strokeWidth={0.8} strokeDasharray="4 8" />
      </Svg>
      <Animated.View style={[{ position: 'absolute', width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }, moonStyle]}>
        <Svg width={20} height={20}>
          <Circle cx={10} cy={10} r={9} fill="#E8E0C8" />
          <Circle cx={10} cy={10} r={8} fill="#0A0A1A" opacity={phase > 0.05 && phase < 0.95 ? 0.85 : 0} />
        </Svg>
      </Animated.View>
    </View>
  );
};


const { width: SW } = Dimensions.get('window');
const ACCENT = '#C4B5FD';

// ── MOON PHASE ALGORITHM ──────────────────────────────────────
function getMoonPhase(year: number, month: number, day: number): number {
  const jd = julianDate(year, month, day);
  const ref = 2451550.1;
  const cycle = 29.530588853;
  const phase = ((jd - ref) % cycle) / cycle;
  return phase < 0 ? phase + 1 : phase;
}

function julianDate(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function phaseIcon(phase: number): string {
  if (phase < 0.0625 || phase >= 0.9375) return '🌑';
  if (phase < 0.1875) return '🌒';
  if (phase < 0.3125) return '🌓';
  if (phase < 0.4375) return '🌔';
  if (phase < 0.5625) return '🌕';
  if (phase < 0.6875) return '🌖';
  if (phase < 0.8125) return '🌗';
  return '🌘';
}

function phaseName(phase: number): string {
  if (phase < 0.0625 || phase >= 0.9375) return 'Nów';
  if (phase < 0.1875) return 'Sierp rosnący';
  if (phase < 0.3125) return 'Pierwsza kwadra';
  if (phase < 0.4375) return 'Garb rosnący';
  if (phase < 0.5625) return 'Pełnia';
  if (phase < 0.6875) return 'Garb malejący';
  if (phase < 0.8125) return 'Ostatnia kwadra';
  return 'Sierp malejący';
}

function isNewMoon(phase: number): boolean { return phase < 0.06 || phase >= 0.94; }
function isFullMoon(phase: number): boolean { return phase >= 0.44 && phase < 0.56; }

const PHASE_ENERGIES: Record<string, { mode: string; desc: string; activity: string }> = {
  'Nów':             { mode: 'Intencje', desc: 'Czas sadzenia nasion, nowych początków i ciszy wewnętrznej. Idealne na wyznaczanie intencji.', activity: 'Napisz intencję na ten cykl. Zapal świecę i powiedz ją na głos.' },
  'Sierp rosnący':   { mode: 'Działanie', desc: 'Energia buduje się i rośnie. Zacznij działania związane z Twoimi intencjami.', activity: 'Zrób jeden konkretny krok w kierunku intencji z nówu.' },
  'Pierwsza kwadra': { mode: 'Działanie', desc: 'Połowa drogi do pełni — czas pokonywania przeszkód i wzmocnienia wysiłku.', activity: 'Zmierz się z jedną trudnością, którą odkładałaś.' },
  'Garb rosnący':    { mode: 'Działanie', desc: 'Energia na szczycie wzrostu. Końcowy sprint przed kulminacją.', activity: 'Dopnij szczegóły projektów, które chcesz domknąć przy pełni.' },
  'Pełnia':          { mode: 'Refleksja', desc: 'Kulminacja i oświecenie. Czas na świętowanie, wdzięczność i uwolnienie tego, co nie służy.', activity: 'Zapisz uwolnienie. Co chcesz puścić? Co się spełniło z intencji nówu?' },
  'Garb malejący':   { mode: 'Refleksja', desc: 'Czas wdzięczności i integracji tego, co otrzymałaś podczas pełni.', activity: 'Napisz 3 rzeczy, za które jesteś wdzięczna w tym cyklu.' },
  'Ostatnia kwadra': { mode: 'Odpoczynek', desc: 'Czas puszczania, posprzątania energetycznego i przygotowania na nowy cykl.', activity: 'Oczyść przestrzeń — fizyczną i emocjonalną. Puść co nie służy.' },
  'Sierp malejący':  { mode: 'Odpoczynek', desc: 'Najgłębsza cisza przed nowym początkiem. Czas wycofania i regeneracji.', activity: 'Medytuj w ciszy. Nie planuj — po prostu bądź.' },
};

// ── 13 KSIĘŻYCÓW — CELTYCKI RYTM ROKU ────────────────────────
const THIRTEEN_MOONS = [
  { num: 1,  name: 'Księżyc Dębu',        approxMonth: 'Grudzień–Styczeń', element: 'Ziemia', color: '#8B6F47', symbol: '🌳', desc: 'Czas zakorzenienia i cichej siły. Dąb przetrwa każdą burzę — Ty też.' },
  { num: 2,  name: 'Księżyc Jarzębiny',   approxMonth: 'Styczeń–Luty',     element: 'Ogień',  color: '#E8524A', symbol: '🔥', desc: 'Ochrona i wizja. Jarzębina strzeże progu między światami.' },
  { num: 3,  name: 'Księżyc Jesiona',     approxMonth: 'Luty–Marzec',      element: 'Woda',   color: '#4A8FD4', symbol: '🌊', desc: 'Połączenie nieba z ziemią. Jesion rośnie między przestrzeniami.' },
  { num: 4,  name: 'Księżyc Olchy',       approxMonth: 'Marzec–Kwiecień',  element: 'Ogień',  color: '#E8944A', symbol: '🌱', desc: 'Pewność siebie i ochrona serca. Olcha nie boi się mokrych korzeni.' },
  { num: 5,  name: 'Księżyc Wierzby',     approxMonth: 'Kwiecień–Maj',     element: 'Woda',   color: '#68C5A8', symbol: '🌿', desc: 'Intuicja i płynność. Wierzba ugina się, ale nigdy się nie łamie.' },
  { num: 6,  name: 'Księżyc Głogu',       approxMonth: 'Maj–Czerwiec',     element: 'Powietrze', color: '#C4B5FD', symbol: '🌸', desc: 'Oczyszczenie i nadzieja. Głóg kwitnie między zimą a wiosną.' },
  { num: 7,  name: 'Księżyc Dębu (Pełni)',approxMonth: 'Czerwiec–Lipiec',  element: 'Ziemia', color: '#86EFAC', symbol: '☀️', desc: 'Szczyt mocy solarnej. Czas pełnej ekspresji i radości istnienia.' },
  { num: 8,  name: 'Księżyc Ostrokrzewu', approxMonth: 'Lipiec–Sierpień',  element: 'Ogień',  color: '#FB923C', symbol: '⚡', desc: 'Kierownictwo i odwaga. Ostrokrzew rządzi drugą połową roku.' },
  { num: 9,  name: 'Księżyc Leszczyny',   approxMonth: 'Sierpień–Wrzesień',element: 'Powietrze', color: '#FCD34D', symbol: '🌰', desc: 'Mądrość i twórczość. Leszczynadaje orzechy wiedzy.' },
  { num: 10, name: 'Księżyc Winorośli',   approxMonth: 'Wrzesień–Październik', element: 'Woda', color: '#A78BFA', symbol: '🍇', desc: 'Zbieranie plonów. Czas radości z tego, co wzeszło.' },
  { num: 11, name: 'Księżyc Bluszczu',    approxMonth: 'Październik–Listopad', element: 'Ziemia', color: '#6EE7B7', symbol: '🍃', desc: 'Wytrwałość i pamięć przodków. Bluszcz trzyma się, gdy inne drzewa śpią.' },
  { num: 12, name: 'Księżyc Trzciny',     approxMonth: 'Listopad',         element: 'Woda',   color: '#60A5FA', symbol: '🎋', desc: 'Przepływ słowa i pieśni. Trzcina śpiewa w wietrze.' },
  { num: 13, name: 'Księżyc Czarnego Bzu',approxMonth: 'Listopad–Grudzień',element: 'Powietrze', color: '#F472B6', symbol: '🌙', desc: 'Przemiana i koniec cyklu. Czarny bez otwiera bramę do początku.' },
];

// ── 8 FAZ — SZCZEGÓŁOWY PRZEWODNIK DZIAŁAŃ ───────────────────
const PHASE_GUIDE = [
  {
    icon: '🌑', name: 'Nów', phase: 'Nowy Cykl', color: '#8B5CF6',
    actions: [
      { title: 'Cisza i nasłuchiwanie', desc: 'Usiądź w ciemności przez 5 minut bez żadnego celu. Pozwól Sobie po prostu być.' },
      { title: 'Intencja pisana ręcznie', desc: 'Napisz jedną intencję na cały cykl. Używaj czasu teraźniejszego: "Jestem..." nie "Będę...".' },
      { title: 'Ziarno rytuału', desc: 'Zakop, posadź lub narysuj symbol swojej intencji. Nadaj jej fizyczną formę w świecie materii.' },
    ],
  },
  {
    icon: '🌒', name: 'Sierp rosnący', phase: 'Budzenie', color: '#7C3AED',
    actions: [
      { title: 'Pierwszy krok', desc: 'Zrób najdrobniejszą możliwą akcję związaną z intencją nówu. Małość nie obniża wartości gestu.' },
      { title: 'Poszukaj wsparcia', desc: 'Zapytaj jedną osobę o pomoc lub perspektywę. Wzrost nigdy nie dzieje się w izolacji.' },
      { title: 'Przejrzyj przeszkody', desc: 'Nazwij jedną rzecz, która mogłaby Cię zatrzymać. Wiedza o przeszkodzie to połowa jej pokonania.' },
    ],
  },
  {
    icon: '🌓', name: 'Pierwsza kwadra', phase: 'Wyzwanie', color: '#6366F1',
    actions: [
      { title: 'Zmierz się z oporem', desc: 'Zrób coś, co odkładałaś. Pierwsza kwadra daje energię do przełamania stagnacji.' },
      { title: 'Zrewiduj plan', desc: 'Sprawdź, czy ścieżka, którą wybrałaś, jest nadal właściwa. Korekta kursu to mądrość, nie słabość.' },
      { title: 'Celebruj odwagę', desc: 'Wróć do tego, co udało Ci się zacząć. Każ sobie to uznać — głośno, świadomie.' },
    ],
  },
  {
    icon: '🌔', name: 'Garb rosnący', phase: 'Dopełnianie', color: '#3B82F6',
    actions: [
      { title: 'Sprint domknięcia', desc: 'Zamknij wszystkie otwarte sprawy, które chcesz zakończyć przed pełnią. Energia jest teraz na szczycie.' },
      { title: 'Zaufanie procesowi', desc: 'Odpuść kontrolę detali. Zrobiłaś już większość — teraz pozwól temu dojrzeć samo.' },
      { title: 'Wdzięczność z wyprzedzeniem', desc: 'Podziękuj za spełnienie, zanim przyjdzie. Wdzięczność przyspiesza manifestację.' },
    ],
  },
  {
    icon: '🌕', name: 'Pełnia', phase: 'Kulminacja', color: '#FCD34D',
    actions: [
      { title: 'Uwolnienie pisemne', desc: 'Napisz, co chcesz puścić — i spalić lub zasypać ziemią. Rytuał fizyczny wzmacnia intencję.' },
      { title: 'Świętowanie', desc: 'Zrób coś, co sprawia Ci prawdziwą radość. Pełnia jest dla świętowania, nie tylko pracy.' },
      { title: 'Medytacja pod gwiazdami', desc: 'Wyjdź na zewnątrz i poczuj księżyc. Twoje ciało reaguje na jego siłę grawitacyjną.' },
    ],
  },
  {
    icon: '🌖', name: 'Garb malejący', phase: 'Integracja', color: '#10B981',
    actions: [
      { title: 'Trzy rzeczy wdzięczności', desc: 'Konkretne, nie ogólne. Nie "jestem wdzięczna za rodzinę" ale "za tę jedną rozmowę w środę".' },
      { title: 'Dzielenie się wiedzą', desc: 'Przekaż komuś coś, czego się nauczyłaś w tym cyklu. Wiedza dzielona głębiej wchodzi.' },
      { title: 'Odpoczynek bez wstydu', desc: 'Energia maleje — to naturalne. Pozwól ciału zwalniać bez interpretowania tego jako porażki.' },
    ],
  },
  {
    icon: '🌗', name: 'Ostatnia kwadra', phase: 'Puszczanie', color: '#6EE7B7',
    actions: [
      { title: 'Energetyczne sprzątanie', desc: 'Posprzątaj przestrzeń fizyczną i cyfrową. Wyrzuć, co nie służy. Uwolnij miejsce.' },
      { title: 'Przebaczenie', desc: 'Napisz imię kogoś lub czegoś, czemu chcesz przebaczyć — włącznie ze sobą. Nie musisz wysyłać listu.' },
      { title: 'Planowanie intencji', desc: 'Zastanów się, co chciałabyś siać w następnym nówiu. Jeszcze nie czas na decyzje, ale na nasłuchiwanie.' },
    ],
  },
  {
    icon: '🌘', name: 'Sierp malejący', phase: 'Regeneracja', color: '#A78BFA',
    actions: [
      { title: 'Cisza bez planu', desc: 'Zrób coś bezproduktywnego i nie przepraszaj za to. Regeneracja jest pracą.' },
      { title: 'Sny i intuicja', desc: 'Trzymaj notes przy łóżku. Księżyc zanikający otwiera kanał między świadomym a nieświadomym.' },
      { title: 'Gotowość na nowy cykl', desc: 'Zapytaj się: co chcę, żeby było inne w następnym cyklu? Jedna prosta odpowiedź wystarczy.' },
    ],
  },
];

// ── EKLIPSY I PORTALE ─────────────────────────────────────────
// Approximate dates for next eclipses from reference date 2026
const ECLIPSES = [
  {
    date: '2026-02-17',
    type: 'Zaćmienie księżyca',
    kind: 'Częściowe',
    icon: '🌑',
    color: '#A78BFA',
    visible: 'Europa, Afryka, część Azji',
    ritual: 'Zaćmienie księżyca to czas intensywnego uwolnienia. Zapisz trzy rzeczy, którym mówisz "dosyć" — i spalić je lub zakopać. Portale zaćmień przyspieszają zmiany, których unikamy.',
    guidance: ['Unikaj ważnych decyzji podczas zaćmienia', 'Zamiast działać — obserwuj co się pojawia', 'Po zaćmieniu daj sobie 48h na integrację'],
  },
  {
    date: '2026-08-12',
    type: 'Zaćmienie słońca',
    kind: 'Całkowite',
    icon: '🌞',
    color: '#FCD34D',
    visible: 'Arktyka, Grenlandia, Islandia',
    ritual: 'Zaćmienie słońca to nów wzmocniony do granic możliwości. Intencje postawione podczas zaćmienia słonecznego mają moc całorocznych. Napisz jedną fundamentalną prośbę do wszechświata.',
    guidance: ['Największe intencje tego roku warto sadzić właśnie teraz', 'Zaćmienie aktywuje osie domy w Twoim horoskopie', 'Efekty mogą pojawić się 6 miesięcy później'],
  },
  {
    date: '2027-02-06',
    type: 'Zaćmienie księżyca',
    kind: 'Półcieniowe',
    icon: '🌕',
    color: '#6EE7B7',
    visible: 'Ameryki, Europa, Afryka',
    ritual: 'Zaćmienie półcieniowe działa subtelnie, ale głęboko. To czas, gdy nieświadome wzorce wynurzają się na powierzchnię. Medytuj i obserwuj, co pojawia się bez zaproszenia.',
    guidance: ['Zwróć uwagę na sny przez 3 noce wokół daty', 'Wzorce relacyjne wymagają szczególnej uwagi', 'Łagodne rytuały wodne są szczególnie efektywne'],
  },
];

// ── WPŁYW ZNAKU KSIĘŻYCA NA ŻYWIOŁY ──────────────────────────
const MOON_SIGN_ELEMENT_GUIDE = {
  Ogień: {
    signs: 'Baran, Lew, Strzelec',
    color: '#FB7340',
    icon: '🔥',
    when: 'Księżyc w znakach ognia',
    effect: 'Wzrost energii, inicjatywy i odwagi. Doskonały czas na zaczęcie nowych projektów, publiczne wystąpienia i działania wymagające śmiałości.',
    caution: 'Impulsywność i skłonność do konfliktu są podwyższone. Unikaj nieprzemyślanych słów.',
    ritual: 'Rytuał ognia: zapal świecę koloru swojego znaku i mów intencje na głos z mocą.',
    bestFor: ['Nowe projekty', 'Rozmowy wymagające odwagi', 'Ćwiczenia fizyczne'],
  },
  Ziemia: {
    signs: 'Byk, Panna, Koziorożec',
    color: '#86EFAC',
    icon: '🌍',
    when: 'Księżyc w znakach ziemi',
    effect: 'Czas praktyczności, uziemienia i trwałych decyzji. Finanse, zdrowie i struktura codziennego życia są pod dobrą gwiazdą.',
    caution: 'Skłonność do zbyt dużej powolności i oporu przed zmianą. Elastyczność warto świadomie kultywować.',
    ritual: 'Rytuał ziemi: wyjdź boso na zewnątrz, dotknij gleby i powiedz jedno zdanie wdzięczności za swoje ciało.',
    bestFor: ['Decyzje finansowe', 'Praca z ciałem', 'Planowanie długoterminowe'],
  },
  Powietrze: {
    signs: 'Bliźnięta, Waga, Wodnik',
    color: '#93C5FD',
    icon: '💨',
    when: 'Księżyc w znakach powietrza',
    effect: 'Rozkwit komunikacji, idei i relacji społecznych. Czas na trudne rozmowy — słowa płyną łatwiej i są lepiej słyszane.',
    caution: 'Umysłowe przeciążenie i rozproszenie. Medytacja skupienia przynosi szczególnie dobre efekty.',
    ritual: 'Rytuał powietrza: napisz list do siebie z przyszłości, wyjdź na zewnątrz i przeczytaj go na głos.',
    bestFor: ['Ważne rozmowy', 'Nauka', 'Twórcze pisanie'],
  },
  Woda: {
    signs: 'Rak, Skorpion, Ryby',
    color: '#67E8F9',
    icon: '🌊',
    when: 'Księżyc w znakach wody',
    effect: 'Najgłębsza intuicja i empatia. Sny są niezwykle wyraźne. Praca z emocjami i nieświadomością przynosi przełomy.',
    caution: 'Wrażliwość emocjonalna jest podwyższona. Chroń swoje granice energetyczne i unikaj drenujących rozmów.',
    ritual: 'Rytuał wody: weź świadomą kąpiel z solą morską. Podczas kąpieli wizualizuj obmywanie wszelkich obciążeń.',
    bestFor: ['Praca z emocjami', 'Medytacja i modlitwa', 'Rytuały oczyszczania'],
  },
};

// ── MEDYTACJE LUNARNE PER FAZA ────────────────────────────────
const LUNAR_MEDITATIONS: Record<string, { title: string; duration: string; steps: string[] }> = {
  'Nów': {
    title: 'Medytacja Nowego Początku',
    duration: '15 minut',
    steps: [
      'Usiądź wygodnie w ciemności lub przy minimalnym świetle. Zamknij oczy i weź trzy głębokie oddechy.',
      'Wyobraź sobie, że jesteś ziarnem w ciemnej, żyznej ziemi. Nie musisz nic robić — tylko istnieć i ufać.',
      'Powoli poczuj ciepło wokół siebie. Zadaj sobie pytanie: co chcę, żeby wzeszło w tym cyklu? Nie analizuj — słuchaj.',
      'Pozwól, aby odpowiedź pojawiła się jako obraz, słowo lub uczucie. Przyjmij ją bez oceniania.',
      'Powoli wróć do oddechu. Zanim otworzysz oczy, podziękuj ciemności za to, że pozwala na nowe początki.',
    ],
  },
  'Sierp rosnący': {
    title: 'Medytacja Wzrastania',
    duration: '12 minut',
    steps: [
      'Stań lub usiądź wyprostowana. Poczuj siłę grawitacji łączącą Cię z ziemią.',
      'Wyobraź sobie, że Twoja intencja z nówu jest rośliną przebijającą się przez ziemię. Widzisz pierwszy zielony kiełek.',
      'Z każdym wdechem kiełek rośnie wyżej. Z każdym wydechem zakorzenia się głębiej. Oba kierunki są ważne.',
      'Zapytaj roślinę: czego potrzebujesz ode mnie? Jakie działanie powinienem podjąć?',
      'Powróć do ciała i zanotuj jedną odpowiedź, którą usłyszałaś.',
    ],
  },
  'Pełnia': {
    title: 'Medytacja Księżycowej Pełni',
    duration: '20 minut',
    steps: [
      'Jeśli możesz, stań przy oknie lub na zewnątrz w blasku pełni. Poczuj światło księżyca na swojej skórze.',
      'Wyobraź sobie, że srebrane światło przepływa przez całe Twoje ciało — od czubka głowy po podeszwy stóp.',
      'Pozwól światłu ujawnić to, co chcesz uwolnić. Nie walcz — tylko obserwuj, co się pojawia.',
      'Powiedz na głos (lub w myśli): "Puszczam [to, co się pojawiło]. Dziękuję za naukę. Jestem wolna."',
      'Poczuj lekkość po uwolnieniu. Podziękuj księżycowi. Wróć powoli do codzienności.',
    ],
  },
  'Ostatnia kwadra': {
    title: 'Medytacja Głębokiego Oczyszczenia',
    duration: '18 minut',
    steps: [
      'Połóż się lub usiądź. Weź trzy powolne oddechy z wydłużonym wydechem.',
      'Wyobraź sobie starą rzekę, która powoli unosi ze sobą wszystko, czego już nie potrzebujesz.',
      'Obserwuj, jak rzeka bierze: zmęczenie, stare przekonania, niespełnione oczekiwania, urazy.',
      'Nie musisz decydować, co rzeka bierze — ona wie sama. Ufaj procesowi.',
      'Zostań z uczuciem lekkości. Podziękuj rzece za służbę. Poczuj gotowość na nowy cykl.',
    ],
  },
};

// ── RYTUAŁY KOLEKTYWNE ────────────────────────────────────────
const COLLECTIVE_RITUALS = [
  {
    name: 'Krąg Intencji',
    moon: 'Nów',
    icon: '⭕',
    color: '#A78BFA',
    participants: '3-8 osób',
    duration: '45–60 minut',
    desc: 'Każda osoba siada w kręgu ze świecą swojego koloru. Po kolei każda mówi jedną intencję na ten cykl — tylko sformułowaną pozytywnie. Pozostałe osoby milczą i świadczą. Na koniec wszyscy zapalają świece od jednej — symbolizując, że każda intencja jest częścią większego światła.',
    steps: ['Przygotuj: świece, notes, ciszę', 'Każda osoba mówi intencję (max 2 minuty)', 'Pozostałe osoby świadczą w ciszy', 'Wspólne zapalenie świec', 'Wspólna minuta ciszy i wdzięczności'],
  },
  {
    name: 'Uwolnienie Pełni',
    moon: 'Pełnia',
    icon: '🌕',
    color: '#FCD34D',
    participants: '2-12 osób',
    duration: '30–45 minut',
    desc: 'Każda osoba pisze na papierze jedno lub kilka rzeczy, które chce uwolnić. Można pisać anonimowo. Papierki są zbierane i wspólnie spalane w bezpiecznym naczyniu. Dym unoszący się ku niebu symbolizuje transformację — nie zniszczenie, ale przemianę.',
    steps: ['Każda osoba pisze uwolnienie (anonimowo lub nie)', 'Papierki wkładane są do naczynia', 'Wspólne zapalenie z intencją', 'Obserwacja dymu i cisza', 'Podzielenie się jednym słowem opisującym stan po rytuale'],
  },
  {
    name: 'Medytacja Lunarnych Snów',
    moon: 'Sierp malejący',
    icon: '🌙',
    color: '#C4B5FD',
    participants: '2-6 osób',
    duration: '60–90 minut',
    desc: 'Wieczorny krąg senny — uczestnicy spotykają się, by podzielić się snami z ostatnich 3 dni. Nie ma interpretacji ani oceniania. Każdy opowiada swój sen jak historię. Następnie wszyscy razem medytują przez 15 minut z intencją "zobaczenia tego, co pokazuje ciemność".',
    steps: ['Herbata i wyciszenie przed spotkaniem', 'Każda osoba opowiada jeden sen bez interpretacji', 'Reszta grupy milczy i słucha', 'Wspólna medytacja ciemności (15 min)', 'Zapisanie jednego przesłania ze snu'],
  },
  {
    name: 'Taniec Żywiołów',
    moon: 'Pełnia lub Pierwsza kwadra',
    icon: '💃',
    color: '#F472B6',
    participants: '4-20 osób',
    duration: '45–75 minut',
    desc: 'Ruchowy rytuał grupowy dedykowany czterem żywiołom. Muzyka zmienia się co 10 minut — kolejno: Ziemia (bębny), Woda (flety), Ogień (szybkie rytmy), Powietrze (smyczki). Każdy tańczy żywioł tak, jak go odczuwa ciałem — bez choreografii, bez oceniania. Na końcu wszyscy zatrzymują się i milczą przez 3 minuty.',
    steps: ['Ziemia: powolny taniec uziemiony (10 min)', 'Woda: płynne fale i spirale (10 min)', 'Ogień: dynamika i siła (10 min)', 'Powietrze: lekkość i spontan (10 min)', 'Wspólna cisza i oddech'],
  },
];

// ── BACKGROUND ────────────────────────────────────────────────
const LunarBg = ({ isDark }: { isDark: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isDark ? ['#040414', '#07071E', '#0A0C28'] : ['#EEF3FF', '#F2F6FF', '#F8FAFF']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={500} style={StyleSheet.absoluteFill} opacity={isDark ? 0.2 : 0.12}>
      <G>
        <Circle cx={SW - 60} cy={80} r={55} fill="#C4B5FD" opacity={0.1} />
        <Circle cx={SW - 60} cy={80} r={44} fill="none" stroke="#C4B5FD" strokeWidth={0.8} opacity={0.3} />
        {Array.from({ length: 24 }, (_, i) => (
          <Circle key={i} cx={(i * 137 + 20) % SW} cy={(i * 79 + 30) % 460}
            r={i % 5 === 0 ? 2 : i % 3 === 0 ? 1.2 : 0.6}
            fill="#C4B5FD" opacity={0.2 + (i % 4) * 0.04} />
        ))}
        <Circle cx={SW / 2} cy={180} r={140} stroke="#C4B5FD" strokeWidth={0.4} fill="none" strokeDasharray="3 9" opacity={0.2} />
        <Circle cx={SW / 2} cy={180} r={100} stroke="#C4B5FD" strokeWidth={0.3} fill="none" strokeDasharray="2 7" opacity={0.15} />
      </G>
    </Svg>
  </View>
);

// ── LUNAR ORBIT 3D ────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const LunarOrbit3D = ({ accent }: { accent: string }) => {
  const orbit = useSharedValue(0);
  const tiltX = useSharedValue(-18);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    orbit.value = withRepeat(withTiming(360, { duration: 12000, easing: Easing.linear }), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-25, Math.min(25, -18 + e.translationY * 0.25));
      tiltY.value = Math.max(-25, Math.min(25, e.translationX * 0.25));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-18, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));

  const moon1Props = useAnimatedProps(() => ({
    cx: 78 * Math.cos(orbit.value * Math.PI / 180),
    cy: 32 * Math.sin(orbit.value * Math.PI / 180),
  }));
  const moon2Props = useAnimatedProps(() => ({
    cx: 78 * Math.cos(orbit.value * Math.PI / 180) - 4,
    cy: 32 * Math.sin(orbit.value * Math.PI / 180) - 4,
  }));

  const STARS = [
    [-88,-70],[-60,-90],[20,-100],[70,-82],[95,-40],[100,10],[85,55],[55,85],
    [10,98],[-40,95],[-80,68],[-100,20],[-95,-25],[-75,-55],[40,-88],[88,35],
  ];

    const fetchLunarAi = async () => {
    setLunarAiLoading(true);
    HapticsService.notify();
    try {
      const prompt = "Aktualna faza ksiezica: " + todayPhaseName + ". Oswietlenie: " + todayIllumination + "%. Ksiezyc w znaku: " + todayMoonSign.name + " (" + todayMoonSign.element + "). Napisz krotka (3-4 zdania) interpretacje energii tego dnia w kontekscie fazy i znaku ksiezyca oraz jeden praktyczny rytual do wykonania dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setLunarAiInsight(result);
    } catch (e) {
      setLunarAiInsight("Blad pobierania interpretacji.");
    } finally {
      setLunarAiLoading(false);
    }
  };
return (
    <View style={{ alignItems: 'center', marginVertical: 12 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }, containerStyle]}>
          <Svg width={220} height={220} viewBox="-110 -110 220 220">
            <Circle cx={0} cy={0} r={95} fill={accent} opacity={0.04} />
            {STARS.map(([x, y], i) => (
              <Circle key={i} cx={x} cy={y} r={i % 4 === 0 ? 1.8 : 0.9} fill="#fff" opacity={0.25 + (i % 3) * 0.12} />
            ))}
            <SvgEllipse cx={0} cy={0} rx={78} ry={32} fill="none" stroke={accent + '44'} strokeWidth={1} strokeDasharray="4 6" />
            <Circle cx={0} cy={0} r={28} fill={accent} opacity={0.2} />
            <Circle cx={0} cy={0} r={22} fill="#1B3A6B" stroke={accent} strokeWidth={1.5} />
            <SvgEllipse cx={-7} cy={-7} rx={8} ry={5} fill="#2A6FCA" opacity={0.5} />
            <AnimatedCircle animatedProps={moon1Props} r={9} fill="#D4D0C0" />
            <AnimatedCircle animatedProps={moon2Props} r={4} fill="#fff" opacity={0.4} />
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const LUNAR_RHYTHM_PHASES = [
  {
    icon: '🌑',
    name: 'Nów',
    color: '#A78BFA',
    title: 'Sianie intencji',
    desc: 'Ciemność sprzyja skupieniu. Siej nasiona nowych pragnień — to moment ciszy i wewnętrznego usłyszenia siebie.',
  },
  {
    icon: '🌓',
    name: 'Rosnący',
    color: '#818CF8',
    title: 'Budowanie energii',
    desc: 'Światło wraca stopniowo. Podejmuj działania, rozwijaj plany i pozwól rosnąć temu, co zainicjowałaś w nówiu.',
  },
  {
    icon: '🌕',
    name: 'Pełnia',
    color: '#FCD34D',
    title: 'Kulminacja i uwolnienie',
    desc: 'Szczyt energii. Świętuj, bądź wdzięczna i świadomie puść to, co nie służy już Twojemu wzrostowi.',
  },
  {
    icon: '🌗',
    name: 'Zanikający',
    color: '#6EE7B7',
    title: 'Integracja i odpoczynek',
    desc: 'Czas refleksji i wyciszenia. Integruj doświadczenia minionego cyklu i regeneruj się przed nowym początkiem.',
  },
];

const MONTH_NAMES = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
const DAY_LABELS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

// ── ILLUMINATION CALCULATOR ────────────────────────────────────
function getIllumination(phase: number): number {
  // illumination goes 0→1→0 over the cycle
  if (phase < 0.5) return phase * 2;
    const fetchLunarAi = async () => {
    setLunarAiLoading(true);
    HapticsService.notify();
    try {
      const prompt = "Aktualna faza ksiezica: " + todayPhaseName + ". Oswietlenie: " + todayIllumination + "%. Ksiezyc w znaku: " + todayMoonSign.name + " (" + todayMoonSign.element + "). Napisz krotka (3-4 zdania) interpretacje energii tego dnia w kontekscie fazy i znaku ksiezyca oraz jeden praktyczny rytual do wykonania dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setLunarAiInsight(result);
    } catch (e) {
      setLunarAiInsight("Blad pobierania interpretacji.");
    } finally {
      setLunarAiLoading(false);
    }
  };
return (1 - phase) * 2;
}

// ── SPECIAL MOON NAME ─────────────────────────────────────────
function getSpecialMoonName(year: number, month: number, day: number): string | null {
  const phase = getMoonPhase(year, month, day);
  if (!isFullMoon(phase)) return null;
  const monthIdx = month - 1;
  const names = [
    'Księżyc Wilka', 'Księżyc Śniegu', 'Księżyc Robaków', 'Księżyc Różowy',
    'Księżyc Kwiatów', 'Księżyc Truskawek', 'Księżyc Jelenia', 'Księżyc Jesiotra',
    'Księżyc Kukurydzy', 'Księżyc Żniwny', 'Księżyc Bobra', 'Księżyc Zimny',
  ];
  // Super Moon: full moon when moon is close to perigee (approximate: 3 times a year)
  // We'll approximate by checking if it's Jan, Mar, or Nov full moons
  const superMonths = [0, 2, 10];
  if (superMonths.includes(monthIdx)) return `Super ${names[monthIdx]}`;
  return names[monthIdx];
}

// ── MOON SIGN APPROXIMATION ───────────────────────────────────
// Moon moves ~13.2°/day, through all 12 signs in ~27.3 days
// Reference: Moon in Aries around Jan 1, 2000
const ZODIAC_SIGNS_PL = [
  { name: 'Baran',      emoji: '♈', element: 'Ogień',    color: '#EF4444', start: 0 },
  { name: 'Byk',        emoji: '♉', element: 'Ziemia',   color: '#84CC16', start: 30 },
  { name: 'Bliźnięta',  emoji: '♊', element: 'Powietrze',color: '#F59E0B', start: 60 },
  { name: 'Rak',        emoji: '♋', element: 'Woda',     color: '#60A5FA', start: 90 },
  { name: 'Lew',        emoji: '♌', element: 'Ogień',    color: '#FB923C', start: 120 },
  { name: 'Panna',      emoji: '♍', element: 'Ziemia',   color: '#A3E635', start: 150 },
  { name: 'Waga',       emoji: '♎', element: 'Powietrze',color: '#F472B6', start: 180 },
  { name: 'Skorpion',   emoji: '♏', element: 'Woda',     color: '#C084FC', start: 210 },
  { name: 'Strzelec',   emoji: '♐', element: 'Ogień',    color: '#FCD34D', start: 240 },
  { name: 'Koziorożec', emoji: '♑', element: 'Ziemia',   color: '#6EE7B7', start: 270 },
  { name: 'Wodnik',     emoji: '♒', element: 'Powietrze',color: '#67E8F9', start: 300 },
  { name: 'Ryby',       emoji: '♓', element: 'Woda',     color: '#A78BFA', start: 330 },
];

function getMoonZodiacSign(year: number, month: number, day: number) {
  const jd = julianDate(year, month, day);
  // Moon sidereal period 27.321661 days; reference JD 2451545.0 (J2000) moon at ~0° ecliptic
  const daysSinceRef = jd - 2451545.0;
  const moonLon = ((daysSinceRef / 27.321661) * 360) % 360;
  const lon = moonLon < 0 ? moonLon + 360 : moonLon;
  const signIdx = Math.floor(lon / 30) % 12;
  return ZODIAC_SIGNS_PL[signIdx];
}

// ── MOON SIGN EMOTIONAL GUIDE ─────────────────────────────────
const MOON_SIGN_EMOTIONAL: Record<string, { emotion: string; guidance: string; avoid: string; affirmation: string }> = {
  'Baran':      { emotion: 'Impulsywność i entuzjazm. Energia działa intensywnie.', guidance: 'Działaj odważnie, ale daj sobie chwilę przed impulsywną decyzją.', avoid: 'Unikaj kłótni i pochopnych słów — wrażliwość na krytykę jest podwyższona.', affirmation: 'Moja odwaga otwiera nowe drzwi.' },
  'Byk':        { emotion: 'Spokój, zmysłowość i potrzeba komfortu. Czas uziemienia.', guidance: 'Zadbaj o przyjemności cielesne: jedzenie, dotyk, piękno, natura.', avoid: 'Unikaj nagłych zmian i chaosu — potrzebujesz stabilności.', affirmation: 'Jestem zakorzeniona i bezpieczna w swoim ciele.' },
  'Bliźnięta':  { emotion: 'Ciekawość, gadatliwość i mentalne pobudzenie.', guidance: 'Pisz, rozmawiaj, ucz się. Myśli płyną szybko — notuj je.', avoid: 'Unikaj powierzchowności — zatrzymaj się przy jednej myśli zamiast skakać.', affirmation: 'Mój umysł jest ostry i pełen światła.' },
  'Rak':        { emotion: 'Głęboka wrażliwość, nostalgía i potrzeba bezpieczeństwa.', guidance: 'Zadbaj o dom i bliskich. Intuicja jest teraz wyjątkowo trafna.', avoid: 'Unikaj drenujących rozmów — granice energetyczne są kluczowe.', affirmation: 'Moje emocje są moją mądrością.' },
  'Lew':        { emotion: 'Radość, kreatywność i potrzeba uznania.', guidance: 'Wyrażaj siebie artystycznie. Świętuj, bądź widoczna.', avoid: 'Unikaj ego-pułapek i dramatu wokół uznania.', affirmation: 'Moje serce promieniuje i przyciąga radość.' },
  'Panna':      { emotion: 'Analityczność i krytycyzm — zarówno wobec siebie, jak i innych.', guidance: 'Organizuj, planuj, zadbaj o zdrowie i codzienne rytuały.', avoid: 'Unikaj nadmiernej samokrytyki — doskonałość nie istnieje.', affirmation: 'Jestem wystarczająca dokładnie taka, jaka jestem.' },
  'Waga':       { emotion: 'Harmonia, estetyka i dążenie do sprawiedliwości.', guidance: 'Idealne na trudne rozmowy — słowa płyną dyplomatycznie.', avoid: 'Unikaj niezdecydowania i odkładania decyzji na wieczny potem.', affirmation: 'Wybory, które podejmuję, przynoszą równowagę.' },
  'Skorpion':   { emotion: 'Intensywność emocjonalna i głębia. Tajemnice wychodzą na jaw.', guidance: 'Praca z cieniem, transformacja, głęboka terapia lub rytuał uwalniający.', avoid: 'Unikaj obsesji i podejrzliwości wobec innych.', affirmation: 'Transformacja jest moją supermocą.' },
  'Strzelec':   { emotion: 'Optymizm, swoboda i filozoficzne pytania.', guidance: 'Rozszerz perspektywę — podróże, nauka, duchy przodków.', avoid: 'Unikaj obiecywania zbyt wiele — entuzjazm może być większy niż możliwości.', affirmation: 'Wszechświat otwiera przede mną szerokie horyzonty.' },
  'Koziorożec': { emotion: 'Ambicja, odpowiedzialność i praktyczne myślenie.', guidance: 'Praca nad celami długoterminowymi. Czas na decyzje strukturalne.', avoid: 'Unikaj zimności i izolowania się — emocje potrzebują przestrzeni.', affirmation: 'Buduję trwałe fundamenty dla swojego życia.' },
  'Wodnik':     { emotion: 'Oryginalność, dystans emocjonalny i myślenie humanistyczne.', guidance: 'Czas na innowacje, przyjaźnie, działanie na rzecz wspólnoty.', avoid: 'Unikaj odcinania się od własnych potrzeb emocjonalnych.', affirmation: 'Moja wyjątkowość jest darem dla świata.' },
  'Ryby':       { emotion: 'Wrażliwość, empatia i granica między rzeczywistościami.', guidance: 'Medytacja, sny, duchowość, muzyka. Czas magii i marzycielstwa.', avoid: 'Unikaj ucieczki w iluzje lub nadmiernego poświęcenia dla innych.', affirmation: 'Moja intuicja prowadzi mnie przez głębiny.' },
};

// ── BIODYNAMIC PLANTING CALENDAR ─────────────────────────────
const PLANTING_PHASES = [
  {
    phase: 'Nów',
    icon: '🌑',
    color: '#A78BFA',
    plant: 'Sadzenie liściowych warzyw i ziół aromatycznych. Energia wchodzi w liście.',
    avoid: 'Unikaj sadzenia korzeniowych warzyw i owoców — brak energii w tych częściach rośliny.',
    harvest: 'Nie zbieraj — rośliny mają mniej soków. Idealne na suszenie ziół.',
    water: 'Woda słabiej wchłaniana. Podlewaj umiarkowanie.',
    ritual: 'Zakop nasiono z intencją — zarówno ogrodową, jak i duchową.',
    bestPlants: ['Sałata', 'Szpinak', 'Bazylia', 'Mięta', 'Pietruszka (nać)'],
  },
  {
    phase: 'Sierp rosnący',
    icon: '🌒',
    color: '#818CF8',
    plant: 'Najlepszy czas na sadzenie owocujących warzyw i roślin z nasionami na zewnątrz.',
    avoid: 'Unikaj przesadzania korzeni — mogą nie przyjąć się równie dobrze.',
    harvest: 'Zbiory smakowitsze, soki bardziej skoncentrowane i aromatyczne.',
    water: 'Woda wchłaniana dobrze. Intensywne podlewanie.',
    ritual: 'Sadź z myślą o wzroście — fizycznym i wewnętrznym.',
    bestPlants: ['Pomidory', 'Ogórki', 'Cukinia', 'Fasola', 'Groch'],
  },
  {
    phase: 'Pełnia',
    icon: '🌕',
    color: '#FCD34D',
    plant: 'Idealne na sadzenie roślin korzeniowych — marchew, burak, rzodkiewka.',
    avoid: 'Unikaj przycinania — rośliny są pełne soków i mogą nadmiernie "krwawić".',
    harvest: 'Szczyt aromatu i smaku. Najlepszy czas na zbiór owoców i warzyw do jedzenia.',
    water: 'Rośliny mogą pochłonąć zbyt dużo wody. Ogranicz podlewanie.',
    ritual: 'Zbierz owoce ziemi jako wyraz wdzięczności za to, co wzeszło.',
    bestPlants: ['Marchew', 'Burak', 'Cebula', 'Czosnek', 'Ziemniaki'],
  },
  {
    phase: 'Zanikający',
    icon: '🌗',
    color: '#6EE7B7',
    plant: 'Czas na prace ziemne: przekopywanie, kompostowanie, ulepszanie gleby.',
    avoid: 'Unikaj sadzenia czegokolwiek nowego — energie nie wspierają wzrostu.',
    harvest: 'Zbiory do przechowania lub suszenia. Rośliny trzymają wartości odżywcze dłużej.',
    water: 'Minimalne podlewanie. Pozwól glebie odpocząć.',
    ritual: 'Usuń z ogrodu to, co obumierające — symboliczna praca uwolnienia.',
    bestPlants: ['Prace ziemne', 'Kompost', 'Przycinanie uschniętych gałęzi', 'Głęboki mulcz'],
  },
];

// ── PERSONAL BIRTH MOON PHASE ────────────────────────────────
const BIRTH_MOON_MEANINGS: Record<string, { title: string; desc: string; gifts: string[]; shadow: string; path: string }> = {
  'Nów': {
    title: 'Dusza Nowego Początku',
    desc: 'Urodziłaś się w czasie ciszy i wewnętrznego skupienia. Twoja natura niesie ze sobą dar intuicji i zdolność do odczuwania tego, co jeszcze niewidoczne.',
    gifts: ['Silna intuicja', 'Zdolność do nowych początków', 'Naturalny mistycyzm', 'Subtelna percepcja'],
    shadow: 'Tendencja do wycofania się i trudności z wyrażaniem emocji na zewnątrz.',
    path: 'Twoja ścieżka wiedzie przez świadome kultywowanie ciszy i słuchanie wewnętrznego głosu.',
  },
  'Sierp rosnący': {
    title: 'Dusza Wzrostu',
    desc: 'Twoja dusza jest wiecznie młoda i pełna możliwości. Budzisz się do świata z entuzjazmem i gotowością na przygody.',
    gifts: ['Entuzjazm i energia', 'Zdolność do nauki', 'Optymizm', 'Szybkie budowanie relacji'],
    shadow: 'Niecierpliwość i trudność z kończeniem rozpoczętych projektów.',
    path: 'Naucz się świętować proces, nie tylko cel.',
  },
  'Pierwsza kwadra': {
    title: 'Dusza Działania',
    desc: 'Urodziłaś się w środku kryzysu wzrostu — Twoja natura jest zdeterminowana i nie boi się wyzwań.',
    gifts: ['Siła woli', 'Determinacja', 'Zdolność do pokonywania przeszkód', 'Przywództwo'],
    shadow: 'Skłonność do konfliktów i trudność z przyjęciem pomocy.',
    path: 'Kanalizuj swoją siłę w służbę innym — wtedy staje się prawdziwą mocą.',
  },
  'Garb rosnący': {
    title: 'Dusza Doskonalenia',
    desc: 'Masz głęboki wewnętrzny pęd do rozwijania się i ulepszania. Jesteś ostatnim krokiem przed kulminacją.',
    gifts: ['Perfekcjonizm konstruktywny', 'Zdolność do głębokiej wiedzy', 'Wierność celom', 'Analityczny umysł'],
    shadow: 'Nadmierna samokrytyka i lęk przed niedoskonałością.',
    path: 'Pozwól sobie na bycie "wystarczająco dobrą" — to też jest mądrość.',
  },
  'Pełnia': {
    title: 'Dusza Kulminacji',
    desc: 'Twoja dusza promienieje. Jesteś osobą, która naturalnie przyciąga uwagę i harmonizuje przeciwności.',
    gifts: ['Charyzma i magnetyzm', 'Zdolność do mediacji', 'Pełnia wyrazu', 'Głęboka empatia'],
    shadow: 'Intensywność emocjonalna i trudność z wyznaczaniem granic.',
    path: 'Dbaj o swoje granice tak samo, jak dbasz o innych.',
  },
  'Garb malejący': {
    title: 'Dusza Wdzięczności',
    desc: 'Twoja natura to dawanie i dzielenie się. Posiadasz dar przetwarzania doświadczeń w mądrość.',
    gifts: ['Hojność', 'Zdolność do nauczania', 'Wdzięczność', 'Głęboka mądrość życiowa'],
    shadow: 'Tendencja do zaniedbywania własnych potrzeb w trosce o innych.',
    path: 'Pamiętaj: daj sobie to, co dajesz światu — zasługujesz na własną troskę.',
  },
  'Ostatnia kwadra': {
    title: 'Dusza Transformacji',
    desc: 'Jesteś naturalna agentką zmiany. Widzisz to, co musi się skończyć, i masz odwagę to skończyć.',
    gifts: ['Odwaga zmian', 'Zdolność do uwolnienia', 'Wizja przyszłości', 'Siła w puszczaniu'],
    shadow: 'Zbyt szybkie porzucanie tego, co mogłoby jeszcze rozkwitnąć.',
    path: 'Rozróżniaj między tym, co należy uwolnić, a tym, co wymaga cierpliwości.',
  },
  'Sierp malejący': {
    title: 'Dusza Mądrości',
    desc: 'Urodziłaś się w najgłębszej ciszy cyklu. Twoja dusza jest starożytna, intuicyjna i wewnętrznie zintegrowana.',
    gifts: ['Głęboka mądrość', 'Mediumiczna intuicja', 'Zdolność do regeneracji', 'Wewnętrzna niezależność'],
    shadow: 'Izolacja i trudność z byciem w grupie przez długi czas.',
    path: 'Szukaj równowagi między potrzebą samotności a połączeniem z innymi.',
  },
};

// ── MOON JOURNAL PROMPTS PER PHASE ───────────────────────────
const JOURNAL_PROMPTS: Record<string, string[]> = {
  'Nów': [
    'Czego naprawdę pragnę w tym nowym cyklu?',
    'Co chcę zostawić za sobą przed nowym początkiem?',
    'Jakie jedno słowo opisuje moją wewnętrzną intencję na te 29 dni?',
  ],
  'Sierp rosnący': [
    'Jaki konkretny krok podjęłam dziś w kierunku moich celów?',
    'Co daje mi energię i entuzjazm do działania?',
    'Jaką przeszkodę widzę przed sobą i jak mogę ją przekroczyć?',
  ],
  'Pierwsza kwadra': [
    'Z czym się zmagam i co to mówi o moich wartościach?',
    'Czy moja ścieżka jest nadal właściwa, czy potrzebuję korekty kursu?',
    'Co mnie powstrzymuje i jak mogę to zmienić?',
  ],
  'Garb rosnący': [
    'Co jest gotowe do "dojrzenia" w moim życiu?',
    'Czemu ufam, nawet jeśli jeszcze nie widzę efektów?',
    'Za co chcę z wyprzedzeniem podziękować?',
  ],
  'Pełnia': [
    'Co się spełniło z moich intencji z nówu?',
    'Co chcę dziś uwolnić — myśl, przekonanie, relację?',
    'Co widzę w sobie wyraźniej w tym pełnym świetle?',
  ],
  'Garb malejący': [
    'Czego nauczyłam się w tym cyklu?',
    'Za co jestem głęboko wdzięczna — konkretnie, nie ogólnie?',
    'Co chcę przekazać dalej z tego, co otrzymałam?',
  ],
  'Ostatnia kwadra': [
    'Co posprzątałam — fizycznie lub emocjonalnie?',
    'Czemu powiedziałam "dosyć" w tym cyklu?',
    'Jak się czuję po uwolnieniu?',
  ],
  'Sierp malejący': [
    'Jakiego odpoczynku naprawdę potrzebuję teraz?',
    'Co pojawia się w moich snach lub intuicji?',
    'Jak chcę, żeby wyglądał mój następny cykl?',
  ],
};

// ── 3-MONTH INTENTIONS OVERVIEW ──────────────────────────────
function get3MonthCycles(baseYear: number, baseMonth: number): Array<{ year: number; month: number; newMoonDay: number; fullMoonDay: number }> {
  const result = [];
  let y = baseYear, m = baseMonth;
  for (let c = 0; c < 3; c++) {
    let nm = -1, fm = -1;
    const days = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const p = getMoonPhase(y, m + 1, d);
      if (nm === -1 && isNewMoon(p)) nm = d;
      if (fm === -1 && isFullMoon(p)) fm = d;
    }
    result.push({ year: y, month: m, newMoonDay: nm, fullMoonDay: fm });
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return result;
}

export const LunarCalendarScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { currentTheme, isLight } = useTheme();
  const insets = useSafeAreaInsets();
    const lunarIntentions = useAppStore(s => s.lunarIntentions);
  const addLunarIntent = useAppStore(s => s.addLunarIntent);
  const deleteLunarIntent = useAppStore(s => s.deleteLunarIntent);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const isDark = !isLight;
  const textColor = isLight ? '#1A1A1A' : '#F0F0F0';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.60)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.08)';

  const nowDate = new Date();
  const [viewYear, setViewYear] = useState(nowDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(nowDate.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(nowDate.getDate());
  const [intentModalType, setIntentModalType] = useState<'new_moon' | 'full_moon' | null>(null);
  const [intentText, setIntentText] = useState('');
  const [activeElementTab, setActiveElementTab] = useState<'Ogień' | 'Ziemia' | 'Powietrze' | 'Woda'>('Ogień');
  const [expandedPhaseGuide, setExpandedPhaseGuide] = useState<string | null>(null);
  const [expandedCollective, setExpandedCollective] = useState<number | null>(null);
  const [activeMoonNum, setActiveMoonNum] = useState<number | null>(null);
  // New sections state
  const [expandedPlantPhase, setExpandedPlantPhase] = useState<string | null>(null);
  const [showBirthMoon, setShowBirthMoon] = useState(false);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [expandedEncPhase, setExpandedEncPhase] = useState<string | null>(null);
  const [journalPhase, setJournalPhase] = useState<string | null>(null);
  const [journalText, setJournalText] = useState('');
  const [savedJournalEntries, setSavedJournalEntries] = useState<Array<{ date: string; phase: string; text: string; emotion: number }>>([]);
  const [journalEmotion, setJournalEmotion] = useState(3);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [show3MonthModal, setShow3MonthModal] = useState(false);
  const [lunarAiInsight, setLunarAiInsight] = useState<string>('');
  const [lunarAiLoading, setLunarAiLoading] = useState(false);

  const today = nowDate.toISOString().split('T')[0];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const offset = (firstDay + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const selectedPhase = selectedDay != null
    ? getMoonPhase(viewYear, viewMonth + 1, selectedDay)
    : null;
  const selectedPhaseName = selectedPhase != null ? phaseName(selectedPhase) : null;
  const selectedPhaseEnergy = selectedPhaseName ? PHASE_ENERGIES[selectedPhaseName] : null;
  const selectedIsNew = selectedPhase != null && isNewMoon(selectedPhase);
  const selectedIsFull = selectedPhase != null && isFullMoon(selectedPhase);

  const { nextFull, nextNew } = useMemo(() => {
    let nf = -1, nn = -1;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      const p = getMoonPhase(d.getFullYear(), d.getMonth() + 1, d.getDate());
      if (nf === -1 && isFullMoon(p)) nf = i;
      if (nn === -1 && isNewMoon(p)) nn = i;
      if (nf !== -1 && nn !== -1) break;
    }
    return { nextFull: nf, nextNew: nn };
  }, []);

  const monthIntentions = lunarIntentions.filter(i => {
    const [y, m] = i.date.split('-').map(Number);
    return y === viewYear && m === viewMonth + 1;
  });

  const saveIntent = () => {
    if (!intentText.trim() || !selectedDay || !intentModalType) return;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    const intent: LunarIntent = {
      id: `li_${Date.now()}`,
      date: dateStr,
      text: intentText.trim(),
      type: intentModalType,
    };
    addLunarIntent(intent);
    void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
    setIntentText('');
    setIntentModalType(null);
  };

  const CELL_W = (SW - layout.padding.screen * 2 - 12) / 7;

  // Current lunar meditation based on today's phase
  const todayPhase = getMoonPhase(nowDate.getFullYear(), nowDate.getMonth() + 1, nowDate.getDate());
  const todayPhaseName = phaseName(todayPhase);
  const lunarMed = LUNAR_MEDITATIONS[todayPhaseName] || LUNAR_MEDITATIONS['Nów'];

  // New computed values
  const todayIllumination = Math.round(getIllumination(todayPhase) * 100);
  const specialMoonName = getSpecialMoonName(nowDate.getFullYear(), nowDate.getMonth() + 1, nowDate.getDate());
  const todayMoonSign = getMoonZodiacSign(nowDate.getFullYear(), nowDate.getMonth() + 1, nowDate.getDate());
  const moonSignEmotional = MOON_SIGN_EMOTIONAL[todayMoonSign.name];
  const userData = useAppStore.getState().userData;
  const birthMoonPhase = useMemo(() => {
    if (!userData.birthDate) return null;
    const parts = userData.birthDate.split('-');
    if (parts.length < 3) return null;
    const [by, bm, bd] = parts.map(Number);
    const p = getMoonPhase(by, bm, bd);
    return { phase: p, name: phaseName(p), icon: phaseIcon(p) };
  }, [userData.birthDate]);
  const birthMoonMeaning = birthMoonPhase ? BIRTH_MOON_MEANINGS[birthMoonPhase.name] : null;
  const threemonthCycles = useMemo(() => get3MonthCycles(nowDate.getFullYear(), nowDate.getMonth()), []);
  const journalPrompts = JOURNAL_PROMPTS[todayPhaseName] || JOURNAL_PROMPTS['Nów'];

  const elementData = MOON_SIGN_ELEMENT_GUIDE[activeElementTab];

    const fetchLunarAi = async () => {
    setLunarAiLoading(true);
    HapticsService.notify();
    try {
      const prompt = "Aktualna faza ksiezica: " + todayPhaseName + ". Oswietlenie: " + todayIllumination + "%. Ksiezyc w znaku: " + todayMoonSign.name + " (" + todayMoonSign.element + "). Napisz krotka (3-4 zdania) interpretacje energii tego dnia w kontekscie fazy i znaku ksiezyca oraz jeden praktyczny rytual do wykonania dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setLunarAiInsight(result);
    } catch (e) {
      setLunarAiInsight("Blad pobierania interpretacji.");
    } finally {
      setLunarAiLoading(false);
    }
  };
return (
    <View style={[lc.container, { backgroundColor: currentTheme.background }]}>
      <LunarBg isDark={!isLight} />
      <SafeAreaView edges={['top']} style={lc.safe}>
        {/* HEADER */}
        <View style={lc.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Home')} style={lc.backBtn} hitSlop={20}>
            <ChevronLeft color={ACCENT} size={26} strokeWidth={1.6} />
          </Pressable>
          <View style={lc.headerCenter}>
            <Typography variant="premiumLabel" color={ACCENT}>Horoskop</Typography>
            <Typography variant="screenTitle" style={{ marginTop: 3 }}>Kalendarz Księżycowy</Typography>
          </View>
          <Pressable
            onPress={() => { if (isFavoriteItem('lunar_calendar')) { removeFavoriteItem('lunar_calendar'); } else { addFavoriteItem({ id: 'lunar_calendar', label: 'Kalendarz Księżyca', route: 'LunarCalendar', params: {}, icon: 'Star', color: ACCENT, addedAt: new Date().toISOString() }); } }}
            style={[lc.backBtn, { alignItems: 'center', justifyContent: 'center' }]}
            hitSlop={12}
          >
            <Star color={isFavoriteItem('lunar_calendar') ? ACCENT : ACCENT + '88'} size={18} strokeWidth={1.8} fill={isFavoriteItem('lunar_calendar') ? ACCENT : 'none'} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[lc.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') + 8 }]} showsVerticalScrollIndicator={false}>
          {/* STAT RAIL */}
          <Animated.View entering={FadeInDown.duration(500)} style={lc.statRail}>
            {[
              { label: 'Pełnia za', val: nextFull >= 0 ? nextFull + 'd' : '—' },
              { label: 'Nów za', val: nextNew >= 0 ? nextNew + 'd' : '—' },
              { label: 'Intencje', val: String(monthIntentions.length) },
              { label: 'Faza dziś', val: phaseIcon(getMoonPhase(nowDate.getFullYear(), nowDate.getMonth() + 1, nowDate.getDate())) },
            ].map((s, i) => (
              <View key={i} style={[lc.statItem, { backgroundColor: cardBg }]}>
                <Text style={[lc.statVal, { color: ACCENT }]}>{s.val}</Text>
                <Text style={[lc.statLabel, { color: subColor }]}>{s.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* LUNAR ORBIT 3D */}
          <LunarOrbit3D accent={ACCENT} />

          {/* MONTH NAVIGATION */}
          <Animated.View entering={FadeInDown.delay(60).duration(500)} style={[lc.monthNav, { marginHorizontal: layout.padding.screen }]}>
            <Pressable onPress={prevMonth} hitSlop={16}>
              <ChevronLeft color={ACCENT} size={22} strokeWidth={1.8} />
            </Pressable>
            <Text style={[lc.monthTitle, { color: textColor }]}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
            <Pressable onPress={nextMonth} hitSlop={16}>
              <ChevronRight color={ACCENT} size={22} strokeWidth={1.8} />
            </Pressable>
          </Animated.View>

          {/* DAY LABELS */}
          <View style={[lc.dayLabels, { marginHorizontal: layout.padding.screen }]}>
            {DAY_LABELS.map(d => (
              <Text key={d} style={[lc.dayLabel, { color: subColor, width: CELL_W }]}>{d}</Text>
            ))}
          </View>

          {/* CALENDAR GRID */}
          <Animated.View entering={FadeInDown.delay(120).duration(500)} style={[lc.grid, { marginHorizontal: layout.padding.screen }]}>
            {calendarDays.map((day, i) => {
              if (day === null) return <View key={i} style={{ width: CELL_W, height: 52 }} />;
              const phase = getMoonPhase(viewYear, viewMonth + 1, day);
              const icon = phaseIcon(phase);
              const isNew = isNewMoon(phase);
              const isFull = isFullMoon(phase);
              const isToday = today === `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDay === day;
                const fetchLunarAi = async () => {
    setLunarAiLoading(true);
    HapticsService.notify();
    try {
      const prompt = "Aktualna faza ksiezica: " + todayPhaseName + ". Oswietlenie: " + todayIllumination + "%. Ksiezyc w znaku: " + todayMoonSign.name + " (" + todayMoonSign.element + "). Napisz krotka (3-4 zdania) interpretacje energii tego dnia w kontekscie fazy i znaku ksiezyca oraz jeden praktyczny rytual do wykonania dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setLunarAiInsight(result);
    } catch (e) {
      setLunarAiInsight("Blad pobierania interpretacji.");
    } finally {
      setLunarAiLoading(false);
    }
  };
return (
                <Pressable
                  key={i}
                  onPress={() => { void HapticsService.selection(); setSelectedDay(day === selectedDay ? null : day); }}
                  style={[
                    lc.dayCell,
                    { width: CELL_W, height: 52 },
                    isSelected && { backgroundColor: ACCENT + '28', borderRadius: 10, borderWidth: 1, borderColor: ACCENT + '66' },
                    isToday && !isSelected && { borderWidth: 1, borderColor: ACCENT + '55', borderRadius: 10 },
                    (isNew || isFull) && !isSelected && { borderRadius: 10, borderWidth: 1.5, borderColor: (isNew ? '#A78BFA' : '#FBBF24') + '66' },
                  ]}
                >
                  <Text style={[lc.dayNum, { color: isSelected ? ACCENT : isToday ? ACCENT : textColor, fontWeight: isToday || isSelected ? '700' : '400' }]}>{day}</Text>
                  <Text style={lc.dayIcon}>{icon}</Text>
                </Pressable>
              );
            })}
          </Animated.View>

          {/* SELECTED DAY DETAIL */}
          {selectedDay && selectedPhase != null && selectedPhaseEnergy && (
            <Animated.View entering={FadeInDown.duration(400)} style={[lc.dayDetail, { backgroundColor: ACCENT + '10', borderColor: ACCENT + '33', marginHorizontal: layout.padding.screen }]}>
              <LinearGradient colors={[ACCENT + '16', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <View style={lc.dayDetailHeader}>
                <Text style={lc.dayDetailIcon}>{phaseIcon(selectedPhase)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[lc.dayDetailName, { color: ACCENT }]}>{selectedPhaseName}</Text>
                  <View style={[lc.modeBadge, { backgroundColor: ACCENT + '22' }]}>
                    <Text style={[lc.modeText, { color: ACCENT }]}>{selectedPhaseEnergy.mode}</Text>
                  </View>
                </View>
              </View>
              <Text style={[lc.dayDetailDesc, { color: subColor }]}>{selectedPhaseEnergy.desc}</Text>
              <View style={[lc.activityBox, { backgroundColor: cardBg }]}>
                <Text style={[lc.activityLabel, { color: ACCENT }]}>POLECANA AKTYWNOŚĆ</Text>
                <Text style={[lc.activityText, { color: textColor }]}>{selectedPhaseEnergy.activity}</Text>
              </View>
              {(selectedIsNew || selectedIsFull) && (
                <Pressable
                  onPress={() => setIntentModalType(selectedIsNew ? 'new_moon' : 'full_moon')}
                  style={[lc.intentBtn, { backgroundColor: selectedIsNew ? '#A78BFA' : '#FBBF24' }]}
                >
                  <BookOpen color="#fff" size={15} strokeWidth={2} />
                  <Text style={lc.intentBtnText}>{selectedIsNew ? 'Zapisz intencję Nówu' : 'Zapisz uwolnienie Pełni'}</Text>
                </Pressable>
              )}
            </Animated.View>
          )}

          {/* MONTH INTENTIONS */}
          {monthIntentions.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              <Text style={[lc.sectionTitle, { color: subColor, marginHorizontal: layout.padding.screen }]}>INTENCJE MIESIĄCA</Text>
              {monthIntentions.map((intent, i) => (
                <View key={i} style={[lc.intentCard, { backgroundColor: cardBg, borderColor: (intent.type === 'new_moon' ? '#A78BFA' : '#FBBF24') + '33', marginHorizontal: layout.padding.screen }]}>
                  <Text style={[lc.intentType, { color: intent.type === 'new_moon' ? '#A78BFA' : '#FBBF24' }]}>
                    {intent.type === 'new_moon' ? '🌑 Intencja Nówu' : '🌕 Uwolnienie Pełni'} · {intent.date.slice(5)}
                  </Text>
                  <Text style={[lc.intentText, { color: textColor }]}>{intent.text}</Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* RYTM LUNARNY — 4-phase grid */}
          <Animated.View entering={FadeInDown.delay(260).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 20 }}>
            <Text style={[lc.sectionTitle, { color: subColor }]}>🌊 RYTM LUNARNY</Text>
            <View style={lc.rhythmGrid}>
              {LUNAR_RHYTHM_PHASES.map((phase, i) => (
                <View key={i} style={[lc.rhythmCard, { backgroundColor: isLight ? 'rgba(255,246,230,0.95)' : 'rgba(255,255,255,0.05)', borderColor: phase.color + '33' }]}>
                  <LinearGradient colors={[phase.color + '14', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                  <Text style={lc.rhythmIcon}>{phase.icon}</Text>
                  <Text style={[lc.rhythmName, { color: phase.color }]}>{phase.name}</Text>
                  <Text style={[lc.rhythmTitle, { color: textColor }]}>{phase.title}</Text>
                  <Text style={[lc.rhythmDesc, { color: subColor }]}>{phase.desc}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── RYTM LUNARNY 13 KSIĘŻYCÓW ── */}
          <Animated.View entering={FadeInDown.delay(280).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[lc.sectionTitle, { color: subColor }]}>🌿 RYTM LUNARNY 13 KSIĘŻYCÓW</Text>
            <Text style={[lc.sectionDesc, { color: subColor }]}>Tradycja celtycka i rdzenna dzieli rok na 13 cykli księżycowych. Każdy księżyc nosi imię drzewa lub symbolu i przynosi własną energię.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
              {THIRTEEN_MOONS.map((moon, i) => {
                const isActive = activeMoonNum === moon.num;
                  const fetchLunarAi = async () => {
    setLunarAiLoading(true);
    HapticsService.notify();
    try {
      const prompt = "Aktualna faza ksiezica: " + todayPhaseName + ". Oswietlenie: " + todayIllumination + "%. Ksiezyc w znaku: " + todayMoonSign.name + " (" + todayMoonSign.element + "). Napisz krotka (3-4 zdania) interpretacje energii tego dnia w kontekscie fazy i znaku ksiezyca oraz jeden praktyczny rytual do wykonania dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setLunarAiInsight(result);
    } catch (e) {
      setLunarAiInsight("Blad pobierania interpretacji.");
    } finally {
      setLunarAiLoading(false);
    }
  };
return (
                  <Pressable
                    key={i}
                    onPress={() => setActiveMoonNum(isActive ? null : moon.num)}
                    style={[lc.moonCard, {
                      backgroundColor: isActive ? moon.color + '20' : cardBg,
                      borderColor: isActive ? moon.color + '66' : cardBorder,
                    }]}
                  >
                    <LinearGradient colors={[moon.color + '18', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                    <Text style={lc.moonCardNum}>{moon.num}</Text>
                    <Text style={lc.moonCardSymbol}>{moon.symbol}</Text>
                    <Text style={[lc.moonCardName, { color: moon.color }]}>{moon.name}</Text>
                    <Text style={[lc.moonCardMonth, { color: subColor }]}>{moon.approxMonth}</Text>
                    <View style={[lc.elementBadge, { backgroundColor: moon.color + '22' }]}>
                      <Text style={[lc.elementBadgeText, { color: moon.color }]}>{moon.element}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            {activeMoonNum !== null && (() => {
              const moon = THIRTEEN_MOONS.find(m => m.num === activeMoonNum)!;
                const fetchLunarAi = async () => {
    setLunarAiLoading(true);
    HapticsService.notify();
    try {
      const prompt = "Aktualna faza ksiezica: " + todayPhaseName + ". Oswietlenie: " + todayIllumination + "%. Ksiezyc w znaku: " + todayMoonSign.name + " (" + todayMoonSign.element + "). Napisz krotka (3-4 zdania) interpretacje energii tego dnia w kontekscie fazy i znaku ksiezyca oraz jeden praktyczny rytual do wykonania dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setLunarAiInsight(result);
    } catch (e) {
      setLunarAiInsight("Blad pobierania interpretacji.");
    } finally {
      setLunarAiLoading(false);
    }
  };
return (
                <View style={[lc.moonDetail, { backgroundColor: moon.color + '14', borderColor: moon.color + '33' }]}>
                  <LinearGradient colors={[moon.color + '20', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                  <Text style={[lc.moonDetailTitle, { color: moon.color }]}>{moon.symbol} {moon.name}</Text>
                  <Text style={[lc.moonDetailSub, { color: subColor }]}>{moon.approxMonth} · Żywioł: {moon.element}</Text>
                  <Text style={[lc.moonDetailDesc, { color: textColor }]}>{moon.desc}</Text>
                </View>
              );
            })()}
          </Animated.View>

          {/* ── FAZY I DZIAŁANIA ── */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[lc.sectionTitle, { color: subColor }]}>✦ FAZY I DZIAŁANIA</Text>
            <Text style={[lc.sectionDesc, { color: subColor }]}>Co robić w każdej z 8 faz księżyca. Dotknij fazy, aby rozwinąć konkretne wskazówki.</Text>
            {PHASE_GUIDE.map((pg, i) => {
              const isOpen = expandedPhaseGuide === pg.name;
                const fetchLunarAi = async () => {
    setLunarAiLoading(true);
    HapticsService.notify();
    try {
      const prompt = "Aktualna faza ksiezica: " + todayPhaseName + ". Oswietlenie: " + todayIllumination + "%. Ksiezyc w znaku: " + todayMoonSign.name + " (" + todayMoonSign.element + "). Napisz krotka (3-4 zdania) interpretacje energii tego dnia w kontekscie fazy i znaku ksiezyca oraz jeden praktyczny rytual do wykonania dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setLunarAiInsight(result);
    } catch (e) {
      setLunarAiInsight("Blad pobierania interpretacji.");
    } finally {
      setLunarAiLoading(false);
    }
  };
return (
                <View key={i} style={{ marginBottom: 8 }}>
                  <Pressable
                    onPress={() => { void HapticsService.selection(); setExpandedPhaseGuide(isOpen ? null : pg.name); }}
                    style={[lc.phaseGuideHeader, {
                      backgroundColor: isOpen ? pg.color + '18' : cardBg,
                      borderColor: isOpen ? pg.color + '55' : cardBorder,
                    }]}
                  >
                    <LinearGradient colors={[pg.color + '10', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                    <Text style={{ fontSize: 22 }}>{pg.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[lc.phaseGuideName, { color: pg.color }]}>{pg.name}</Text>
                      <Text style={[lc.phaseGuidePhase, { color: subColor }]}>{pg.phase}</Text>
                    </View>
                    <ChevronRight color={pg.color} size={16} strokeWidth={1.8}
                      style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }} />
                  </Pressable>
                  {isOpen && (
                    <View style={[lc.phaseGuideBody, { backgroundColor: pg.color + '0C', borderColor: pg.color + '22' }]}>
                      {pg.actions.map((action, j) => (
                        <View key={j} style={[lc.phaseAction, j > 0 && { borderTopWidth: 1, borderTopColor: pg.color + '18' }]}>
                          <View style={[lc.phaseActionNum, { backgroundColor: pg.color + '22' }]}>
                            <Text style={[lc.phaseActionNumText, { color: pg.color }]}>{j + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[lc.phaseActionTitle, { color: textColor }]}>{action.title}</Text>
                            <Text style={[lc.phaseActionDesc, { color: subColor }]}>{action.desc}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </Animated.View>

          {/* ── EKLIPSY I PORTALE ── */}
          <Animated.View entering={FadeInDown.delay(320).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[lc.sectionTitle, { color: subColor }]}>⚡ EKLIPSY I PORTALE</Text>
            <Text style={[lc.sectionDesc, { color: subColor }]}>Następne zaćmienia i ich energia rytualna. Portale zaćmień przyspieszają zmiany — warto być świadomą.</Text>
            {ECLIPSES.map((eclipse, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(340 + i * 60).duration(400)}
                style={[lc.eclipseCard, { backgroundColor: eclipse.color + '12', borderColor: eclipse.color + '40' }]}>
                <LinearGradient colors={[eclipse.color + '18', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                <View style={lc.eclipseHeader}>
                  <Text style={{ fontSize: 28 }}>{eclipse.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[lc.eclipseType, { color: eclipse.color }]}>{eclipse.type} · {eclipse.kind}</Text>
                    <Text style={[lc.eclipseDate, { color: textColor }]}>{eclipse.date}</Text>
                    <Text style={[lc.eclipseVisible, { color: subColor }]}>Widoczne: {eclipse.visible}</Text>
                  </View>
                </View>
                <Text style={[lc.eclipseRitual, { color: subColor }]}>{eclipse.ritual}</Text>
                <View style={[lc.eclipseGuidance, { backgroundColor: cardBg }]}>
                  {eclipse.guidance.map((g, j) => (
                    <View key={j} style={[lc.eclipseGuideRow, j > 0 && { borderTopWidth: 1, borderTopColor: eclipse.color + '18' }]}>
                      <Zap color={eclipse.color} size={13} strokeWidth={1.8} />
                      <Text style={[lc.eclipseGuideText, { color: textColor }]}>{g}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* ── WPŁYW NA ZODIAKI ── */}
          <Animated.View entering={FadeInDown.delay(360).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[lc.sectionTitle, { color: subColor }]}>♾ WPŁYW NA ŻYWIOŁY</Text>
            <Text style={[lc.sectionDesc, { color: subColor }]}>Jak księżyc w danym żywiole wpływa na Ciebie — i jakie rytuały są wtedy najbardziej skuteczne.</Text>
            <View style={lc.elementTabs}>
              {(['Ogień', 'Ziemia', 'Powietrze', 'Woda'] as const).map((el) => {
                const elData = MOON_SIGN_ELEMENT_GUIDE[el];
                const isActive = activeElementTab === el;
                  const fetchLunarAi = async () => {
    setLunarAiLoading(true);
    HapticsService.notify();
    try {
      const prompt = "Aktualna faza ksiezica: " + todayPhaseName + ". Oswietlenie: " + todayIllumination + "%. Ksiezyc w znaku: " + todayMoonSign.name + " (" + todayMoonSign.element + "). Napisz krotka (3-4 zdania) interpretacje energii tego dnia w kontekscie fazy i znaku ksiezyca oraz jeden praktyczny rytual do wykonania dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setLunarAiInsight(result);
    } catch (e) {
      setLunarAiInsight("Blad pobierania interpretacji.");
    } finally {
      setLunarAiLoading(false);
    }
  };
return (
                  <Pressable
                    key={el}
                    onPress={() => setActiveElementTab(el)}
                    style={[lc.elementTab, {
                      backgroundColor: isActive ? elData.color + '22' : cardBg,
                      borderColor: isActive ? elData.color + '66' : cardBorder,
                    }]}
                  >
                    <Text style={{ fontSize: 16 }}>{elData.icon}</Text>
                    <Text style={[lc.elementTabLabel, { color: isActive ? elData.color : subColor }]}>{el}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[lc.elementDetail, { backgroundColor: elementData.color + '10', borderColor: elementData.color + '33' }]}>
              <LinearGradient colors={[elementData.color + '1C', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <Text style={[lc.elementDetailTitle, { color: elementData.color }]}>{elementData.icon} Księżyc w {activeElementTab}</Text>
              <Text style={[lc.elementDetailSigns, { color: subColor }]}>{elementData.signs}</Text>
              <Text style={[lc.elementDetailEffect, { color: textColor }]}>{elementData.effect}</Text>
              <View style={[lc.elementCaution, { backgroundColor: elementData.color + '14', borderColor: elementData.color + '33' }]}>
                <Text style={[lc.elementCautionLabel, { color: elementData.color }]}>UWAGA</Text>
                <Text style={[lc.elementCautionText, { color: textColor }]}>{elementData.caution}</Text>
              </View>
              <View style={[lc.elementRitualBox, { backgroundColor: cardBg }]}>
                <Text style={[lc.elementRitualLabel, { color: elementData.color }]}>RYTUAŁ ŻYWIOŁU</Text>
                <Text style={[lc.elementRitualText, { color: textColor }]}>{elementData.ritual}</Text>
              </View>
              <View style={{ marginTop: 12 }}>
                <Text style={[lc.elementBestLabel, { color: subColor }]}>NAJLEPSZE DLA</Text>
                <View style={lc.elementBestRow}>
                  {elementData.bestFor.map((item, j) => (
                    <View key={j} style={[lc.elementBestChip, { backgroundColor: elementData.color + '18', borderColor: elementData.color + '33' }]}>
                      <Text style={[lc.elementBestChipText, { color: elementData.color }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── MEDYTACJA LUNARNA ── */}
          <Animated.View entering={FadeInDown.delay(390).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[lc.sectionTitle, { color: subColor }]}>🌙 MEDYTACJA LUNARNA</Text>
            <Text style={[lc.sectionDesc, { color: subColor }]}>Przewodnik medytacyjny dostosowany do dzisiejszej fazy księżyca: {phaseIcon(todayPhase)} {todayPhaseName}</Text>
            <View style={[lc.medCard, { backgroundColor: ACCENT + '10', borderColor: ACCENT + '33' }]}>
              <LinearGradient colors={[ACCENT + '18', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <View style={lc.medCardHeader}>
                <Text style={{ fontSize: 30 }}>{phaseIcon(todayPhase)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[lc.medCardTitle, { color: ACCENT }]}>{lunarMed.title}</Text>
                  <Text style={[lc.medCardDuration, { color: subColor }]}>{lunarMed.duration} · {todayPhaseName}</Text>
                </View>
              </View>
              {lunarMed.steps.map((step, i) => (
                <View key={i} style={[lc.medStep, i > 0 && { borderTopWidth: 1, borderTopColor: ACCENT + '18' }]}>
                  <View style={[lc.medStepNum, { backgroundColor: ACCENT + '22' }]}>
                    <Text style={[lc.medStepNumText, { color: ACCENT }]}>{i + 1}</Text>
                  </View>
                  <Text style={[lc.medStepText, { color: textColor }]}>{step}</Text>
                </View>
              ))}
              <Pressable
                onPress={() => navigation.navigate('Meditation')}
                style={[lc.medCta, { backgroundColor: ACCENT }]}
              >
                <Moon color="#fff" size={15} strokeWidth={2} />
                <Text style={lc.medCtaText}>Otwórz ekran medytacji</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* ── RYTUAŁY KOLEKTYWNE ── */}
          <Animated.View entering={FadeInDown.delay(420).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[lc.sectionTitle, { color: subColor }]}>👥 RYTUAŁY KOLEKTYWNE</Text>
            <Text style={[lc.sectionDesc, { color: subColor }]}>Rytuały przeznaczone do praktykowania w grupie — z rodziną, przyjaciółmi lub kręgiem duchowym.</Text>
            {COLLECTIVE_RITUALS.map((ritual, i) => {
              const isOpen = expandedCollective === i;
                const fetchLunarAi = async () => {
    setLunarAiLoading(true);
    HapticsService.notify();
    try {
      const prompt = "Aktualna faza ksiezica: " + todayPhaseName + ". Oswietlenie: " + todayIllumination + "%. Ksiezyc w znaku: " + todayMoonSign.name + " (" + todayMoonSign.element + "). Napisz krotka (3-4 zdania) interpretacje energii tego dnia w kontekscie fazy i znaku ksiezyca oraz jeden praktyczny rytual do wykonania dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setLunarAiInsight(result);
    } catch (e) {
      setLunarAiInsight("Blad pobierania interpretacji.");
    } finally {
      setLunarAiLoading(false);
    }
  };
return (
                <View key={i} style={{ marginBottom: 10 }}>
                  <Pressable
                    onPress={() => { void HapticsService.selection(); setExpandedCollective(isOpen ? null : i); }}
                    style={[lc.collectiveHeader, {
                      backgroundColor: isOpen ? ritual.color + '18' : cardBg,
                      borderColor: isOpen ? ritual.color + '55' : cardBorder,
                    }]}
                  >
                    <LinearGradient colors={[ritual.color + '12', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                    <Text style={{ fontSize: 24 }}>{ritual.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[lc.collectiveName, { color: ritual.color }]}>{ritual.name}</Text>
                      <Text style={[lc.collectiveMeta, { color: subColor }]}>{ritual.moon} · {ritual.participants} · {ritual.duration}</Text>
                    </View>
                    <ChevronRight color={ritual.color} size={16} strokeWidth={1.8}
                      style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }} />
                  </Pressable>
                  {isOpen && (
                    <View style={[lc.collectiveBody, { backgroundColor: ritual.color + '0C', borderColor: ritual.color + '22' }]}>
                      <Text style={[lc.collectiveDesc, { color: textColor }]}>{ritual.desc}</Text>
                      <Text style={[lc.collectiveStepsLabel, { color: ritual.color }]}>PRZEBIEG RYTUAŁU</Text>
                      {ritual.steps.map((step, j) => (
                        <View key={j} style={[lc.collectiveStep, j > 0 && { borderTopWidth: 1, borderTopColor: ritual.color + '18' }]}>
                          <View style={[lc.collectiveStepNum, { backgroundColor: ritual.color + '22' }]}>
                            <Text style={[lc.collectiveStepNumText, { color: ritual.color }]}>{j + 1}</Text>
                          </View>
                          <Text style={[lc.collectiveStepText, { color: subColor }]}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </Animated.View>

          {/* ── DZISIEJSZY KSIĘŻYC — HERO ── */}
          <Animated.View entering={FadeInDown.delay(430).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[lc.sectionTitle, { color: subColor }]}>🌕 DZISIEJSZY KSIĘŻYC</Text>
            <View style={[lc.heroMoonCard, { backgroundColor: ACCENT + '0E', borderColor: ACCENT + '30' }]}>
              <LinearGradient colors={[ACCENT + '1A', 'transparent', '#4F46E520']} style={StyleSheet.absoluteFillObject as any} />
              <View style={lc.heroMoonRow}>
                {/* Large SVG moon */}
                <Svg width={100} height={100} viewBox="0 0 100 100">
                  {/* Glow */}
                  <Circle cx={50} cy={50} r={48} fill={ACCENT} opacity={0.08} />
                  <Circle cx={50} cy={50} r={42} fill={ACCENT} opacity={0.05} />
                  {/* Moon body */}
                  <Circle cx={50} cy={50} r={36} fill="#D4D0C0" />
                  {/* Dark shadow overlay based on phase */}
                  {todayPhase < 0.5
                    ? <Path d={`M50,14 a36,36 0 1,0 0,72 a${Math.max(1, Math.abs((todayPhase - 0.25) * 4 * 36))},36 0 1,${todayPhase < 0.25 ? 1 : 0} 0,-72`} fill="#0A0A1A" opacity={0.88} />
                    : <Path d={`M50,14 a36,36 0 1,1 0,72 a${Math.max(1, Math.abs((todayPhase - 0.75) * 4 * 36))},36 0 1,${todayPhase < 0.75 ? 0 : 1} 0,-72`} fill="#0A0A1A" opacity={0.88} />
                  }
                  {/* Craters */}
                  <Circle cx={40} cy={44} r={4} fill="#BEB8A8" opacity={0.5} />
                  <Circle cx={58} cy={36} r={3} fill="#BEB8A8" opacity={0.4} />
                  <Circle cx={54} cy={56} r={2.5} fill="#BEB8A8" opacity={0.35} />
                  {/* Sheen */}
                  <Circle cx={38} cy={32} r={6} fill="#fff" opacity={0.12} />
                  {/* Ring */}
                  <Circle cx={50} cy={50} r={40} fill="none" stroke={ACCENT} strokeWidth={0.8} opacity={0.4} />
                </Svg>
                {/* Info */}
                <View style={{ flex: 1, paddingLeft: 16 }}>
                  <Text style={[lc.heroMoonPhase, { color: ACCENT }]}>{phaseIcon(todayPhase)} {todayPhaseName}</Text>
                  {specialMoonName && (
                    <View style={[lc.specialMoonBadge, { backgroundColor: '#FCD34D22', borderColor: '#FCD34D44' }]}>
                      <Text style={[lc.specialMoonBadgeText, { color: '#FCD34D' }]}>✨ {specialMoonName}</Text>
                    </View>
                  )}
                  <Text style={[lc.heroMoonSub, { color: subColor }]}>Oświetlenie: <Text style={{ color: textColor, fontWeight: '700' }}>{todayIllumination}%</Text></Text>
                  <Text style={[lc.heroMoonSub, { color: subColor }]}>Pełnia za: <Text style={{ color: textColor, fontWeight: '700' }}>{nextFull >= 0 ? nextFull + ' dni' : '—'}</Text></Text>
                  <Text style={[lc.heroMoonSub, { color: subColor }]}>Nów za: <Text style={{ color: textColor, fontWeight: '700' }}>{nextNew >= 0 ? nextNew + ' dni' : '—'}</Text></Text>
                </View>
              </View>
              {/* Energy bar */}
              <View style={lc.heroEnergyBar}>
                <Text style={[lc.heroEnergyLabel, { color: subColor }]}>ENERGIA CYKLU</Text>
                <View style={[lc.heroEnergyTrack, { backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)' }]}>
                  <View style={[lc.heroEnergyFill, { width: `${todayIllumination}%` as any, backgroundColor: ACCENT }]} />
                </View>
              </View>
              <Text style={[lc.heroEnergyDesc, { color: subColor }]}>{PHASE_ENERGIES[todayPhaseName]?.desc}</Text>
            </View>
          </Animated.View>

          {/* ── ENCYKLOPEDIA 8 FAZ ── */}
          <Animated.View entering={FadeInDown.delay(440).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Pressable
              onPress={() => { void HapticsService.selection(); setShowEncyclopedia(v => !v); }}
              style={[lc.sectionToggleHeader, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <Text style={[lc.sectionTitle, { color: subColor, marginBottom: 0 }]}>📚 ENCYKLOPEDIA 8 FAZ</Text>
              <ChevronRight color={subColor} size={16} strokeWidth={1.8}
                style={{ transform: [{ rotate: showEncyclopedia ? '90deg' : '0deg' }] }} />
            </Pressable>
            {showEncyclopedia && (
              <View style={{ marginTop: 8 }}>
                <Text style={[lc.sectionDesc, { color: subColor }]}>Pełny przewodnik po 8 fazach księżyca — ich energia, co zaczynać, czego unikać i jak każda z nich wpływa na Twoje życie duchowe.</Text>
                {[
                  { icon: '🌑', name: 'Nów', color: '#8B5CF6', polishName: 'Nowy Księżyc', energy: 'Ciemność, potencjał, cisza, intencje', start: 'Nowe projekty, marzenia, pragnienia serca, medytacje głębi', avoid: 'Wielkie decyzje, konflikty, nadmierna aktywność', moonGift: 'Dar ciszy — w jej wnętrzu mieszkają wszystkie możliwości.', emotionalKey: 'Wyciszenie, głęboki spokój, łączność z własną duszą', sacredAct: 'Napisz jedną intencję na całe 29 dni. Nie planuj — słuchaj.' },
                  { icon: '🌒', name: 'Sierp rosnący', color: '#7C3AED', polishName: 'Sierp Rosnący', energy: 'Budzenie, nadzieja, pierwsze kroki', start: 'Pierwsze działania, networking, zaczynanie nauki', avoid: 'Zniechęcania się, jeśli efekty są powolne', moonGift: 'Dar nadziei — nawet mały kiełek jest oznaką życia.', emotionalKey: 'Ciekawość, entuzjazm, lekki niepokój', sacredAct: 'Zrób jeden konkretny krok. Małość nie obniża jego wartości.' },
                  { icon: '🌓', name: 'Pierwsza kwadra', color: '#6366F1', polishName: 'Pierwsza Kwadra', energy: 'Wyzwanie, determinacja, przełom', start: 'Trudne rozmowy, konfrontacja z przeszkodami', avoid: 'Ucieczki od trudności — to czas na nie, nie od nich', moonGift: 'Dar siły — przeszkoda jest nauczycielką.', emotionalKey: 'Napięcie, determinacja, gotowość do walki', sacredAct: 'Zmierz się z jedną rzeczą, którą odkładałaś od nówu.' },
                  { icon: '🌔', name: 'Garb rosnący', color: '#3B82F6', polishName: 'Garb Rosnący', energy: 'Dopełnianie, zaufanie, ostatni sprint', start: 'Finalizowanie projektów, dopinanie detali', avoid: 'Zaczynania czegoś nowego — teraz kończysz, nie zaczynasz', moonGift: 'Dar zaufania — to, co posiane, dojrzewa w ciemności.', emotionalKey: 'Oczekiwanie, lekkość, wdzięczność z wyprzedzeniem', sacredAct: 'Podziękuj za spełnienie, zanim przyjdzie. Ufaj.' },
                  { icon: '🌕', name: 'Pełnia', color: '#FCD34D', polishName: 'Pełnia Księżyca', energy: 'Kulminacja, oświecenie, uwolnienie', start: 'Celebracja, rytuały uwalniające, wdzięczność', avoid: 'Przesadzania w działaniu — czas kulminacji, nie startu', moonGift: 'Dar oświecenia — księżyc pokazuje to, czego nie widziałaś.', emotionalKey: 'Intensywność, radość, łzy oczyszczające', sacredAct: 'Napisz uwolnienie. Spal lub zakop. Pozwól odejść.' },
                  { icon: '🌖', name: 'Garb malejący', color: '#10B981', polishName: 'Garb Malejący', energy: 'Integracja, wdzięczność, przekazywanie', start: 'Dzielenie się wiedzą, wdzięczność, dawanie', avoid: 'Przywiązywania do wyników — czas na integrację, nie ocenę', moonGift: 'Dar wdzięczności — każde doświadczenie było nauczycielką.', emotionalKey: 'Spokój, refleksja, ciepło serca', sacredAct: 'Napisz 3 konkretne rzeczy wdzięczności za ten cykl.' },
                  { icon: '🌗', name: 'Ostatnia kwadra', color: '#6EE7B7', polishName: 'Ostatnia Kwadra', energy: 'Puszczanie, sprzątanie, przebaczenie', start: 'Energetyczne porządki, przebaczenie, usuwanie tego, co nie służy', avoid: 'Zaczynania nowych projektów — teraz tylko kończysz', moonGift: 'Dar wolności — puszczenie jest siłą, nie słabością.', emotionalKey: 'Ulga, gotowość, pewna smutna nuta końca', sacredAct: 'Oczyść przestrzeń fizyczną. Usuń jedną rzecz, która ciąży.' },
                  { icon: '🌘', name: 'Sierp malejący', color: '#A78BFA', polishName: 'Sierp Malejący', energy: 'Regeneracja, cisza, głęboka intuicja', start: 'Odpoczynek, sny, medytacja, słuchanie wewnętrznego głosu', avoid: 'Nadmiernej aktywności i planowania — czas regeneracji', moonGift: 'Dar ciemności — w niej rodzi się nowe światło.', emotionalKey: 'Melancholia, głęboki spokój, otwartość na sny', sacredAct: 'Nic konkretnego. Po prostu bądź. Regeneracja jest pracą.' },
                ].map((ph, i) => {
                  const isOpen = expandedEncPhase === ph.name;
                    const fetchLunarAi = async () => {
    setLunarAiLoading(true);
    HapticsService.notify();
    try {
      const prompt = "Aktualna faza ksiezica: " + todayPhaseName + ". Oswietlenie: " + todayIllumination + "%. Ksiezyc w znaku: " + todayMoonSign.name + " (" + todayMoonSign.element + "). Napisz krotka (3-4 zdania) interpretacje energii tego dnia w kontekscie fazy i znaku ksiezyca oraz jeden praktyczny rytual do wykonania dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setLunarAiInsight(result);
    } catch (e) {
      setLunarAiInsight("Blad pobierania interpretacji.");
    } finally {
      setLunarAiLoading(false);
    }
  };
return (
                    <View key={i} style={{ marginBottom: 8 }}>
                      <Pressable
                        onPress={() => { void HapticsService.selection(); setExpandedEncPhase(isOpen ? null : ph.name); }}
                        style={[lc.encHeader, { backgroundColor: isOpen ? ph.color + '18' : cardBg, borderColor: isOpen ? ph.color + '55' : cardBorder }]}
                      >
                        <LinearGradient colors={[ph.color + '10', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                        <Text style={{ fontSize: 22 }}>{ph.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[lc.encName, { color: ph.color }]}>{ph.polishName}</Text>
                          <Text style={[lc.encEnergy, { color: subColor }]}>{ph.energy}</Text>
                        </View>
                        <ChevronRight color={ph.color} size={16} strokeWidth={1.8}
                          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }} />
                      </Pressable>
                      {isOpen && (
                        <View style={[lc.encBody, { backgroundColor: ph.color + '0A', borderColor: ph.color + '22' }]}>
                          <View style={[lc.encGiftBox, { backgroundColor: ph.color + '15', borderColor: ph.color + '33' }]}>
                            <Text style={[lc.encGiftText, { color: ph.color }]}>✦ {ph.moonGift}</Text>
                          </View>
                          <View style={lc.encRow}>
                            <View style={[lc.encCol, { backgroundColor: '#22C55E11', borderColor: '#22C55E22' }]}>
                              <Text style={[lc.encColLabel, { color: '#22C55E' }]}>ZACZYNAJ</Text>
                              <Text style={[lc.encColText, { color: textColor }]}>{ph.start}</Text>
                            </View>
                            <View style={[lc.encCol, { backgroundColor: '#EF444411', borderColor: '#EF444422' }]}>
                              <Text style={[lc.encColLabel, { color: '#EF4444' }]}>UNIKAJ</Text>
                              <Text style={[lc.encColText, { color: textColor }]}>{ph.avoid}</Text>
                            </View>
                          </View>
                          <View style={[lc.encEmotionBox, { backgroundColor: cardBg }]}>
                            <Text style={[lc.encEmotionLabel, { color: ph.color }]}>EMOCJONALNY KLUCZ</Text>
                            <Text style={[lc.encEmotionText, { color: textColor }]}>{ph.emotionalKey}</Text>
                          </View>
                          <View style={[lc.encSacredBox, { backgroundColor: ph.color + '12', borderColor: ph.color + '28' }]}>
                            <Moon color={ph.color} size={13} strokeWidth={1.8} />
                            <Text style={[lc.encSacredText, { color: textColor }]}>{ph.sacredAct}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {/* ── KSIĘŻYC W ZNAKU ZODIAKU ── */}
          <Animated.View entering={FadeInDown.delay(450).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[lc.sectionTitle, { color: subColor }]}>♾ KSIĘŻYC W ZNAKU ZODIAKU</Text>
            <View style={[lc.zodiacMoonCard, { backgroundColor: todayMoonSign.color + '10', borderColor: todayMoonSign.color + '33' }]}>
              <LinearGradient colors={[todayMoonSign.color + '1A', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <View style={lc.zodiacMoonHeader}>
                <View style={[lc.zodiacMoonBadge, { backgroundColor: todayMoonSign.color + '22', borderColor: todayMoonSign.color + '44' }]}>
                  <Text style={lc.zodiacMoonEmoji}>{todayMoonSign.emoji}</Text>
                  <Text style={[lc.zodiacMoonSign, { color: todayMoonSign.color }]}>{todayMoonSign.name}</Text>
                  <Text style={[lc.zodiacMoonElement, { color: subColor }]}>{todayMoonSign.element}</Text>
                </View>
                <View style={{ flex: 1, paddingLeft: 14 }}>
                  <Text style={[lc.zodiacMoonTitle, { color: textColor }]}>Księżyc jest dziś w znaku</Text>
                  <Text style={[lc.zodiacMoonSignName, { color: todayMoonSign.color }]}>{todayMoonSign.name}</Text>
                  <Text style={[lc.zodiacMoonElementText, { color: subColor }]}>Żywioł: {todayMoonSign.element}</Text>
                </View>
              </View>
              {moonSignEmotional && (
                <>
                  <Text style={[lc.zodiacMoonEmotionText, { color: textColor }]}>{moonSignEmotional.emotion}</Text>
                  <View style={[lc.zodiacMoonBox, { backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.05)' }]}>
                    <Text style={[lc.zodiacMoonBoxLabel, { color: todayMoonSign.color }]}>WSKAZÓWKA DNIA</Text>
                    <Text style={[lc.zodiacMoonBoxText, { color: textColor }]}>{moonSignEmotional.guidance}</Text>
                  </View>
                  <View style={[lc.zodiacMoonBox, { backgroundColor: '#EF444412', marginTop: 8 }]}>
                    <Text style={[lc.zodiacMoonBoxLabel, { color: '#EF4444' }]}>UWAŻAJ NA</Text>
                    <Text style={[lc.zodiacMoonBoxText, { color: textColor }]}>{moonSignEmotional.avoid}</Text>
                  </View>
                  <View style={[lc.zodiacAffBox, { backgroundColor: todayMoonSign.color + '14', borderColor: todayMoonSign.color + '33' }]}>
                    <Text style={[lc.zodiacAffText, { color: todayMoonSign.color }]}>"{moonSignEmotional.affirmation}"</Text>
                  </View>
                </>
              )}
            </View>
          </Animated.View>

          {/* ── OGRODNICTWO BIODYNAMICZNE ── */}
          <Animated.View entering={FadeInDown.delay(460).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[lc.sectionTitle, { color: subColor }]}>🌱 OGRODNICTWO BIODYNAMICZNE</Text>
            <Text style={[lc.sectionDesc, { color: subColor }]}>Księżyc wpływa na rośliny tak samo, jak na oceany. Biodynamiczny kalendarz ogrodniczy pomoże Ci sadzi, zbierać i pielęgnować w rytmie natury.</Text>
            {PLANTING_PHASES.map((pp, i) => {
              const isOpen = expandedPlantPhase === pp.phase;
                const fetchLunarAi = async () => {
    setLunarAiLoading(true);
    HapticsService.notify();
    try {
      const prompt = "Aktualna faza ksiezica: " + todayPhaseName + ". Oswietlenie: " + todayIllumination + "%. Ksiezyc w znaku: " + todayMoonSign.name + " (" + todayMoonSign.element + "). Napisz krotka (3-4 zdania) interpretacje energii tego dnia w kontekscie fazy i znaku ksiezyca oraz jeden praktyczny rytual do wykonania dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setLunarAiInsight(result);
    } catch (e) {
      setLunarAiInsight("Blad pobierania interpretacji.");
    } finally {
      setLunarAiLoading(false);
    }
  };
return (
                <View key={i} style={{ marginBottom: 8 }}>
                  <Pressable
                    onPress={() => { void HapticsService.selection(); setExpandedPlantPhase(isOpen ? null : pp.phase); }}
                    style={[lc.plantHeader, { backgroundColor: isOpen ? pp.color + '18' : cardBg, borderColor: isOpen ? pp.color + '55' : cardBorder }]}
                  >
                    <LinearGradient colors={[pp.color + '10', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                    <Text style={{ fontSize: 22 }}>{pp.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[lc.plantPhaseName, { color: pp.color }]}>{pp.phase}</Text>
                      <Text style={[lc.plantPhaseHint, { color: subColor }]} numberOfLines={1}>{pp.plant}</Text>
                    </View>
                    <ChevronRight color={pp.color} size={16} strokeWidth={1.8}
                      style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }} />
                  </Pressable>
                  {isOpen && (
                    <View style={[lc.plantBody, { backgroundColor: pp.color + '08', borderColor: pp.color + '20' }]}>
                      <View style={lc.plantGrid}>
                        <View style={[lc.plantCell, { backgroundColor: '#22C55E10', borderColor: '#22C55E20' }]}>
                          <Text style={[lc.plantCellIcon]}>🌱</Text>
                          <Text style={[lc.plantCellLabel, { color: '#22C55E' }]}>SADZENIE</Text>
                          <Text style={[lc.plantCellText, { color: textColor }]}>{pp.plant}</Text>
                        </View>
                        <View style={[lc.plantCell, { backgroundColor: '#F59E0B10', borderColor: '#F59E0B20' }]}>
                          <Text style={[lc.plantCellIcon]}>🌾</Text>
                          <Text style={[lc.plantCellLabel, { color: '#F59E0B' }]}>ZBIORY</Text>
                          <Text style={[lc.plantCellText, { color: textColor }]}>{pp.harvest}</Text>
                        </View>
                        <View style={[lc.plantCell, { backgroundColor: '#3B82F610', borderColor: '#3B82F620' }]}>
                          <Text style={[lc.plantCellIcon]}>💧</Text>
                          <Text style={[lc.plantCellLabel, { color: '#3B82F6' }]}>PODLEWANIE</Text>
                          <Text style={[lc.plantCellText, { color: textColor }]}>{pp.water}</Text>
                        </View>
                        <View style={[lc.plantCell, { backgroundColor: '#EF444410', borderColor: '#EF444420' }]}>
                          <Text style={[lc.plantCellIcon]}>🚫</Text>
                          <Text style={[lc.plantCellLabel, { color: '#EF4444' }]}>UNIKAJ</Text>
                          <Text style={[lc.plantCellText, { color: textColor }]}>{pp.avoid}</Text>
                        </View>
                      </View>
                      <View style={[lc.plantBestRow]}>
                        <Text style={[lc.plantBestLabel, { color: pp.color }]}>NAJLEPSZE ROŚLINY</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {pp.bestPlants.map((plant, j) => (
                            <View key={j} style={[lc.plantChip, { backgroundColor: pp.color + '18', borderColor: pp.color + '33' }]}>
                              <Text style={[lc.plantChipText, { color: pp.color }]}>{plant}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      <View style={[lc.plantRitualBox, { backgroundColor: pp.color + '12', borderColor: pp.color + '28' }]}>
                        <Wind color={pp.color} size={12} strokeWidth={1.8} />
                        <Text style={[lc.plantRitualText, { color: textColor }]}>{pp.ritual}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </Animated.View>

          {/* ── OSOBISTY CYKL KSIĘŻYCOWY — NARODZINY ── */}
          {birthMoonMeaning && (
            <Animated.View entering={FadeInDown.delay(470).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 24 }}>
              <Text style={[lc.sectionTitle, { color: subColor }]}>✨ TWÓJ KSIĘŻYC NARODZIN</Text>
              <Text style={[lc.sectionDesc, { color: subColor }]}>Faza księżyca w dniu Twoich narodzin kształtuje Twą duszową architekturę — jak reagujesz na emocje, jakie masz dary i ścieżkę.</Text>
              <Pressable
                onPress={() => { void HapticsService.selection(); setShowBirthMoon(v => !v); }}
                style={[lc.birthMoonHeader, { backgroundColor: ACCENT + '14', borderColor: ACCENT + '33' }]}
              >
                <LinearGradient colors={[ACCENT + '18', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                <Text style={{ fontSize: 32 }}>{birthMoonPhase?.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[lc.birthMoonTitle, { color: ACCENT }]}>{birthMoonMeaning.title}</Text>
                  <Text style={[lc.birthMoonPhase, { color: subColor }]}>Urodziłaś się podczas: {birthMoonPhase?.name}</Text>
                </View>
                <ChevronRight color={ACCENT} size={16} strokeWidth={1.8}
                  style={{ transform: [{ rotate: showBirthMoon ? '90deg' : '0deg' }] }} />
              </Pressable>
              {showBirthMoon && (
                <View style={[lc.birthMoonBody, { backgroundColor: ACCENT + '08', borderColor: ACCENT + '1A' }]}>
                  <Text style={[lc.birthMoonDesc, { color: textColor }]}>{birthMoonMeaning.desc}</Text>
                  <View style={[lc.birthMoonSection, { backgroundColor: '#22C55E0E', borderColor: '#22C55E20' }]}>
                    <Text style={[lc.birthMoonSectionLabel, { color: '#22C55E' }]}>TWOJE DARY LUNARNIE</Text>
                    {birthMoonMeaning.gifts.map((gift, i) => (
                      <View key={i} style={lc.birthMoonGiftRow}>
                        <View style={[lc.birthMoonDot, { backgroundColor: '#22C55E' }]} />
                        <Text style={[lc.birthMoonGiftText, { color: textColor }]}>{gift}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={[lc.birthMoonSection, { backgroundColor: '#F59E0B0E', borderColor: '#F59E0B20', marginTop: 8 }]}>
                    <Text style={[lc.birthMoonSectionLabel, { color: '#F59E0B' }]}>CIEŃ DO INTEGRACJI</Text>
                    <Text style={[lc.birthMoonShadowText, { color: textColor }]}>{birthMoonMeaning.shadow}</Text>
                  </View>
                  <View style={[lc.birthMoonSection, { backgroundColor: ACCENT + '10', borderColor: ACCENT + '22', marginTop: 8 }]}>
                    <Text style={[lc.birthMoonSectionLabel, { color: ACCENT }]}>ŚCIEŻKA DUSZY</Text>
                    <Text style={[lc.birthMoonPathText, { color: textColor }]}>{birthMoonMeaning.path}</Text>
                  </View>
                </View>
              )}
            </Animated.View>
          )}

          {/* ── PRZEGLĄD 3-MIESIĘCZNY ── */}
          <Animated.View entering={FadeInDown.delay(480).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[lc.sectionTitle, { color: subColor }]}>📅 INTENCJE — CYKL 3 MIESIĘCY</Text>
            <Text style={[lc.sectionDesc, { color: subColor }]}>Planuj intencje i uwolnienia z wyprzedzeniem. Pełnia i nów w kolejnych 3 miesiącach.</Text>
            {threemonthCycles.map((cycle, i) => {
              const intentionsForCycle = lunarIntentions.filter(it => {
                const [y, m] = it.date.split('-').map(Number);
                return y === cycle.year && m === cycle.month + 1;
              });
              const newMoonIntents = intentionsForCycle.filter(it => it.type === 'new_moon');
              const fullMoonIntents = intentionsForCycle.filter(it => it.type === 'full_moon');
                const fetchLunarAi = async () => {
    setLunarAiLoading(true);
    HapticsService.notify();
    try {
      const prompt = "Aktualna faza ksiezica: " + todayPhaseName + ". Oswietlenie: " + todayIllumination + "%. Ksiezyc w znaku: " + todayMoonSign.name + " (" + todayMoonSign.element + "). Napisz krotka (3-4 zdania) interpretacje energii tego dnia w kontekscie fazy i znaku ksiezyca oraz jeden praktyczny rytual do wykonania dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setLunarAiInsight(result);
    } catch (e) {
      setLunarAiInsight("Blad pobierania interpretacji.");
    } finally {
      setLunarAiLoading(false);
    }
  };
return (
                <Animated.View key={i} entering={FadeInDown.delay(490 + i * 40).duration(400)}
                  style={[lc.cycleCard, { backgroundColor: cardBg, borderColor: i === 0 ? ACCENT + '44' : cardBorder }]}>
                  <LinearGradient colors={i === 0 ? [ACCENT + '10', 'transparent'] : ['transparent', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                  <View style={lc.cycleCardHeader}>
                    <Text style={[lc.cycleCardMonth, { color: i === 0 ? ACCENT : textColor }]}>
                      {MONTH_NAMES[cycle.month]} {cycle.year}
                      {i === 0 && <Text style={{ color: ACCENT, fontSize: 10 }}> · OBECNY</Text>}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {cycle.newMoonDay > 0 && (
                        <View style={[lc.cycleBadge, { backgroundColor: '#A78BFA20' }]}>
                          <Text style={[lc.cycleBadgeText, { color: '#A78BFA' }]}>🌑 {cycle.newMoonDay}.{cycle.month + 1}</Text>
                        </View>
                      )}
                      {cycle.fullMoonDay > 0 && (
                        <View style={[lc.cycleBadge, { backgroundColor: '#FCD34D20' }]}>
                          <Text style={[lc.cycleBadgeText, { color: '#FCD34D' }]}>🌕 {cycle.fullMoonDay}.{cycle.month + 1}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {newMoonIntents.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      {newMoonIntents.map((it, j) => (
                        <View key={it.id || j} style={[lc.cycleIntent, { backgroundColor: '#A78BFA0E', borderColor: '#A78BFA22', flexDirection: 'row', alignItems: 'center' }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={[lc.cycleIntentType, { color: '#A78BFA' }]}>🌑 Intencja · {it.date.slice(5)}</Text>
                            <Text style={[lc.cycleIntentText, { color: textColor }]} numberOfLines={2}>{it.text}</Text>
                          </View>
                          <Pressable hitSlop={10} onPress={() => Alert.alert('Usuń intencję', 'Czy na pewno chcesz usunąć tę intencję?', [
                            { text: 'Anuluj', style: 'cancel' },
                            { text: 'Usuń', style: 'destructive', onPress: () => deleteLunarIntent(it.id) },
                          ])}>
                            <Trash2 size={14} color={'#EF4444'} strokeWidth={1.6} />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                  {fullMoonIntents.length > 0 && (
                    <View style={{ marginTop: 4 }}>
                      {fullMoonIntents.map((it, j) => (
                        <View key={it.id || j} style={[lc.cycleIntent, { backgroundColor: '#FCD34D0E', borderColor: '#FCD34D22', flexDirection: 'row', alignItems: 'center' }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={[lc.cycleIntentType, { color: '#FCD34D' }]}>🌕 Uwolnienie · {it.date.slice(5)}</Text>
                            <Text style={[lc.cycleIntentText, { color: textColor }]} numberOfLines={2}>{it.text}</Text>
                          </View>
                          <Pressable hitSlop={10} onPress={() => Alert.alert('Usuń intencję', 'Czy na pewno chcesz usunąć tę intencję?', [
                            { text: 'Anuluj', style: 'cancel' },
                            { text: 'Usuń', style: 'destructive', onPress: () => deleteLunarIntent(it.id) },
                          ])}>
                            <Trash2 size={14} color={'#EF4444'} strokeWidth={1.6} />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                  {newMoonIntents.length === 0 && fullMoonIntents.length === 0 && (
                    <Text style={[lc.cycleEmptyText, { color: subColor }]}>Brak zapisanych intencji. Kliknij w dzień nówu lub pełni w kalendarzu.</Text>
                  )}
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* ── DZIENNIK KSIĘŻYCOWY ── */}
          <Animated.View entering={FadeInDown.delay(490).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[lc.sectionTitle, { color: subColor }]}>📓 DZIENNIK KSIĘŻYCOWY</Text>
            <Text style={[lc.sectionDesc, { color: subColor }]}>Zapisuj stan emocjonalny w rytmie księżyca. Odkryj wzorce swoich nastrojów w cyklu 29-dniowym.</Text>
            {/* Today's prompt */}
            <View style={[lc.journalTodayCard, { backgroundColor: ACCENT + '0E', borderColor: ACCENT + '28' }]}>
              <LinearGradient colors={[ACCENT + '14', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <View style={lc.journalTodayHeader}>
                <Text style={[lc.journalTodayPhase, { color: ACCENT }]}>{phaseIcon(todayPhase)} Pytania na {todayPhaseName}</Text>
                <Text style={[lc.journalTodayDate, { color: subColor }]}>{today}</Text>
              </View>
              {journalPrompts.map((prompt, i) => (
                <Pressable
                  key={i}
                  onPress={() => { setJournalPhase(prompt); setJournalText(''); setJournalEmotion(3); setShowJournalModal(true); }}
                  style={[lc.journalPromptRow, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)', borderColor: ACCENT + '22' }]}
                >
                  <View style={[lc.journalPromptNum, { backgroundColor: ACCENT + '22' }]}>
                    <Text style={[lc.journalPromptNumText, { color: ACCENT }]}>{i + 1}</Text>
                  </View>
                  <Text style={[lc.journalPromptText, { color: textColor }]}>{prompt}</Text>
                  <ArrowRight color={ACCENT + '88'} size={14} strokeWidth={1.8} />
                </Pressable>
              ))}
            </View>
            {/* Past entries */}
            {savedJournalEntries.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={[lc.journalEntriesLabel, { color: subColor }]}>POPRZEDNIE WPISY</Text>
                {savedJournalEntries.slice(0, 5).map((entry, i) => (
                  <View key={i} style={[lc.journalEntryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <View style={lc.journalEntryHeader}>
                      <Text style={[lc.journalEntryPhase, { color: ACCENT }]}>{phaseIcon(getMoonPhase(...(entry.date.split('-').map(Number) as [number, number, number])))} {entry.phase}</Text>
                      <Text style={[lc.journalEntryDate, { color: subColor }]}>{entry.date}</Text>
                    </View>
                    <View style={lc.journalEntryEmotionRow}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <Text key={n} style={{ fontSize: 14, opacity: n <= entry.emotion ? 1 : 0.25 }}>🌙</Text>
                      ))}
                      <Text style={[lc.journalEntryEmotionLabel, { color: subColor }]}> Energia: {entry.emotion}/5</Text>
                    </View>
                    <Text style={[lc.journalEntryText, { color: textColor }]} numberOfLines={3}>{entry.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* CO DALEJ — quick links */}
          <Animated.View entering={FadeInDown.delay(460).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 24, marginBottom: 4 }}>
            <Text style={[lc.sectionTitle, { color: subColor }]}>✦ CO DALEJ?</Text>
            {[
              {
                icon: '✦',
                label: 'Rytuał lunarny',
                sub: 'Dobierz ceremonię do fazy księżyca',
                color: ACCENT,
                onPress: () => navigation.navigate('Rituals'),
              },
              {
                icon: '🙏',
                label: 'Wdzięczność w nówiu',
                sub: 'Zapisz trzy rzeczy wdzięczności tego cyklu',
                color: '#6EE7B7',
                onPress: () => navigation.navigate('Gratitude'),
              },
              {
                icon: '🎵',
                label: 'Kąpiel dźwiękowa',
                sub: 'Dźwięki do medytacji z księżycem',
                color: '#FCD34D',
                onPress: () => navigation.navigate('SoundBath'),
              },
            ].map((item, i) => (
              <Pressable
                key={i}
                onPress={item.onPress}
                style={[lc.nextCard, { backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.04)', borderColor: item.color + '28' }]}
              >
                <LinearGradient colors={[item.color + '10', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                <View style={[lc.nextIconBox, { backgroundColor: item.color + '18', borderColor: item.color + '33' }]}>
                  <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[lc.nextLabel, { color: textColor }]}>{item.label}</Text>
                  <Text style={[lc.nextSub, { color: subColor }]}>{item.sub}</Text>
                </View>
                <ArrowRight color={isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.30)'} size={16} strokeWidth={1.8} />
              </Pressable>
            ))}
          </Animated.View>

                  <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 16, backgroundColor: "#C4B5FD22", borderWidth: 1, borderColor: "#C4B5FD", padding: 16 }}>
          <Text style={{ color: "#C4B5FD", fontWeight: "700", fontSize: 13, letterSpacing: 1, marginBottom: 8 }}>AI INTERPRETACJA KSIEZYCA</Text>
          {lunarAiInsight ? (
            <Text style={{ color: "#E5E7EB", fontSize: 14, lineHeight: 22 }}>{lunarAiInsight}</Text>
          ) : null}
          <Pressable onPress={fetchLunarAi} disabled={lunarAiLoading} style={{ marginTop: 12, backgroundColor: "#C4B5FD", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
            <Text style={{ color: "#1F1035", fontWeight: "700", fontSize: 14 }}>{lunarAiLoading ? "Interpretuję..." : "Interpretuj"}</Text>
          </Pressable>
        </View>
<EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>

      {/* JOURNAL MODAL */}
      <Modal visible={showJournalModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <View style={lc.modalOverlay}>
            <View style={[lc.modalSheet, { backgroundColor: isLight ? '#FAFAFA' : '#0A0818' }]}>
              <LinearGradient colors={[ACCENT + '14', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <View style={lc.modalHeader}>
                <Text style={[lc.modalTitle, { color: ACCENT }]}>
                  {phaseIcon(todayPhase)} Dziennik Księżycowy
                </Text>
                <Pressable onPress={() => { setShowJournalModal(false); setJournalText(''); setJournalPhase(null); }} hitSlop={16}>
                  <X color={subColor} size={20} strokeWidth={1.8} />
                </Pressable>
              </View>
              {journalPhase && (
                <View style={[lc.journalModalPrompt, { backgroundColor: ACCENT + '14', borderColor: ACCENT + '28' }]}>
                  <Text style={[lc.journalModalPromptText, { color: ACCENT }]}>{journalPhase}</Text>
                </View>
              )}
              {/* Emotion slider */}
              <Text style={[lc.journalEmotionLabel, { color: subColor }]}>ENERGIA EMOCJONALNA DZIŚ</Text>
              <View style={lc.journalEmotionRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Pressable key={n} onPress={() => setJournalEmotion(n)} hitSlop={8}>
                    <Text style={{ fontSize: 28, opacity: n <= journalEmotion ? 1 : 0.25 }}>🌙</Text>
                  </Pressable>
                ))}
                <Text style={[{ fontSize: 13, color: subColor, marginLeft: 8 }]}>{journalEmotion}/5</Text>
              </View>
              <MysticalInput
                value={journalText}
                onChangeText={setJournalText}
                multiline
                placeholder="Zapisz swoje refleksje..."
                placeholderTextColor={subColor}
                textAlignVertical="top"
                autoFocus
                style={{ color: textColor, minHeight: 100, fontSize: 15, lineHeight: 24 }}
                containerStyle={{ marginBottom: 14 }}
              />
              <Pressable
                onPress={() => {
                  if (!journalText.trim()) return;
                  const entry = { date: today, phase: todayPhaseName, text: journalText.trim(), emotion: journalEmotion };
                  setSavedJournalEntries(prev => [entry, ...prev]);
                  void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
                  setShowJournalModal(false);
                  setJournalText('');
                  setJournalPhase(null);
                  setJournalEmotion(3);
                }}
                disabled={!journalText.trim()}
                style={[lc.modalSave, { backgroundColor: ACCENT, opacity: journalText.trim() ? 1 : 0.5 }]}
              >
                <Text style={lc.modalSaveText}>Zapisz w dzienniku</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* INTENT MODAL */}
      <Modal visible={!!intentModalType} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={lc.modalOverlay}>
          <View style={[lc.modalSheet, { backgroundColor: isLight ? '#FAFAFA' : '#0A0818' }]}>
            <LinearGradient colors={[ACCENT + '14', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
            <View style={lc.modalHeader}>
              <Text style={[lc.modalTitle, { color: ACCENT }]}>
                {intentModalType === 'new_moon' ? '🌑 Intencja Nówu' : '🌕 Uwolnienie Pełni'}
              </Text>
              <Pressable onPress={() => { setIntentModalType(null); setIntentText(''); }} hitSlop={16}>
                <X color={subColor} size={20} strokeWidth={1.8} />
              </Pressable>
            </View>
            <Text style={[lc.modalSub, { color: subColor }]}>
              {intentModalType === 'new_moon'
                ? 'Czego chcesz w tym cyklu? Co sadzisz w swoim życiu?'
                : 'Co chcesz puścić? Co zakończyło swój czas?'}
            </Text>
            <MysticalInput
              value={intentText}
              onChangeText={setIntentText}
              multiline
              placeholder={intentModalType === 'new_moon' ? 'Moja intencja na ten cykl...' : 'Chcę uwolnić...'}
              placeholderTextColor={subColor}
              textAlignVertical="top"
              autoFocus
              style={{ color: textColor, minHeight: 100, fontSize: 15, lineHeight: 24 }}
              containerStyle={{ marginBottom: 14 }}
            />
            <Pressable
              onPress={saveIntent}
              disabled={!intentText.trim()}
              style={[lc.modalSave, { backgroundColor: ACCENT, opacity: intentText.trim() ? 1 : 0.5 }]}
            >
              <Text style={lc.modalSaveText}>Zapisz</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const lc = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingVertical: 10, gap: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  scroll: { paddingTop: 8 },
  statRail: { flexDirection: 'row', gap: 8, marginHorizontal: layout.padding.screen, marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  statVal: { fontSize: 14, fontWeight: '700' },
  statLabel: { fontSize: 9, marginTop: 2, letterSpacing: 0.3, textAlign: 'center' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  dayLabels: { flexDirection: 'row', marginBottom: 4 },
  dayLabel: { textAlign: 'center', fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  dayCell: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  dayNum: { fontSize: 13, letterSpacing: -0.2 },
  dayIcon: { fontSize: 11, marginTop: 1 },
  // Day detail
  dayDetail: { borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, overflow: 'hidden' },
  dayDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  dayDetailIcon: { fontSize: 36 },
  dayDetailName: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  modeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  modeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  dayDetailDesc: { fontSize: 14, lineHeight: 22, marginBottom: 14 },
  activityBox: { borderRadius: 12, padding: 14, marginBottom: 14 },
  activityLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6 },
  activityText: { fontSize: 13, lineHeight: 20 },
  intentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  intentBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6, marginTop: 4 },
  sectionDesc: { fontSize: 12.5, lineHeight: 19, marginBottom: 12 },
  intentCard: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  intentType: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  intentText: { fontSize: 14, lineHeight: 22 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalSub: { fontSize: 13, marginBottom: 16, lineHeight: 20 },
  modalInput: { borderRadius: 14, padding: 16, minHeight: 100, fontSize: 15, lineHeight: 24, borderWidth: 1.5, marginBottom: 16 },
  modalSave: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Lunar rhythm grid
  rhythmGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  rhythmCard: { width: (SW - layout.padding.screen * 2 - 10) / 2, borderRadius: 18, borderWidth: 1, padding: 14, overflow: 'hidden', marginBottom: 0 },
  rhythmIcon: { fontSize: 26, marginBottom: 6 },
  rhythmName: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  rhythmTitle: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  rhythmDesc: { fontSize: 11.5, lineHeight: 17 },
  // Co dalej
  nextCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10, overflow: 'hidden' },
  nextIconBox: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  nextLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  nextSub: { fontSize: 11.5, lineHeight: 17 },
  // 13 moons
  moonCard: { width: 130, borderRadius: 16, borderWidth: 1, padding: 12, overflow: 'hidden', alignItems: 'flex-start' },
  moonCardNum: { fontSize: 10, fontWeight: '700', color: '#888', marginBottom: 4 },
  moonCardSymbol: { fontSize: 22, marginBottom: 4 },
  moonCardName: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  moonCardMonth: { fontSize: 10, lineHeight: 14, marginBottom: 6 },
  elementBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  elementBadgeText: { fontSize: 10, fontWeight: '700' },
  moonDetail: { borderRadius: 16, borderWidth: 1, padding: 16, overflow: 'hidden', marginTop: 10 },
  moonDetailTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  moonDetailSub: { fontSize: 11, marginBottom: 10 },
  moonDetailDesc: { fontSize: 13.5, lineHeight: 21 },
  // Phase guide
  phaseGuideHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, overflow: 'hidden' },
  phaseGuideName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  phaseGuidePhase: { fontSize: 11 },
  phaseGuideBody: { borderRadius: 14, borderWidth: 1, borderTopLeftRadius: 0, borderTopRightRadius: 0, padding: 14, overflow: 'hidden' },
  phaseAction: { flexDirection: 'row', gap: 12, paddingVertical: 12, alignItems: 'flex-start' },
  phaseActionNum: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  phaseActionNumText: { fontSize: 12, fontWeight: '700' },
  phaseActionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  phaseActionDesc: { fontSize: 12, lineHeight: 18 },
  // Eclipses
  eclipseCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12, overflow: 'hidden' },
  eclipseHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  eclipseType: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  eclipseDate: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  eclipseVisible: { fontSize: 11 },
  eclipseRitual: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  eclipseGuidance: { borderRadius: 12, padding: 12 },
  eclipseGuideRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 8 },
  eclipseGuideText: { fontSize: 12.5, lineHeight: 18, flex: 1 },
  // Elements
  elementTabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  elementTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, borderWidth: 1, gap: 4 },
  elementTabLabel: { fontSize: 10, fontWeight: '700' },
  elementDetail: { borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden' },
  elementDetailTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  elementDetailSigns: { fontSize: 11, marginBottom: 10 },
  elementDetailEffect: { fontSize: 13.5, lineHeight: 21, marginBottom: 12 },
  elementCaution: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  elementCautionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  elementCautionText: { fontSize: 12.5, lineHeight: 18 },
  elementRitualBox: { borderRadius: 12, padding: 12, marginBottom: 4 },
  elementRitualLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  elementRitualText: { fontSize: 12.5, lineHeight: 18 },
  elementBestLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  elementBestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  elementBestChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  elementBestChipText: { fontSize: 11, fontWeight: '600' },
  // Lunar meditation
  medCard: { borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden' },
  medCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  medCardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  medCardDuration: { fontSize: 11 },
  medStep: { flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'flex-start' },
  medStepNum: { width: 26, height: 26, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  medStepNumText: { fontSize: 11, fontWeight: '700' },
  medStepText: { fontSize: 12.5, lineHeight: 19, flex: 1 },
  medCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, marginTop: 14 },
  medCtaText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  // Collective rituals
  collectiveHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, overflow: 'hidden' },
  collectiveName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  collectiveMeta: { fontSize: 11 },
  collectiveBody: { borderRadius: 14, borderWidth: 1, borderTopLeftRadius: 0, borderTopRightRadius: 0, padding: 14, overflow: 'hidden' },
  collectiveDesc: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  collectiveStepsLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  collectiveStep: { flexDirection: 'row', gap: 10, paddingVertical: 10, alignItems: 'flex-start' },
  collectiveStepNum: { width: 26, height: 26, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  collectiveStepNumText: { fontSize: 11, fontWeight: '700' },
  collectiveStepText: { fontSize: 12.5, lineHeight: 18, flex: 1 },
  // Hero moon
  heroMoonCard: { borderRadius: 20, padding: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  heroMoonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  heroMoonPhase: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  heroMoonSub: { fontSize: 13, lineHeight: 20, marginBottom: 2 },
  specialMoonBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  specialMoonBadgeText: { fontSize: 11, fontWeight: '700' },
  heroEnergyBar: { marginBottom: 10 },
  heroEnergyLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.1, marginBottom: 6 },
  heroEnergyTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  heroEnergyFill: { height: 6, borderRadius: 3 },
  heroEnergyDesc: { fontSize: 13, lineHeight: 20 },
  // Section toggle header
  sectionToggleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
  // Encyclopedia
  encHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, overflow: 'hidden' },
  encName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  encEnergy: { fontSize: 11 },
  encBody: { borderRadius: 14, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderWidth: 1, padding: 14, overflow: 'hidden' },
  encGiftBox: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  encGiftText: { fontSize: 13.5, fontWeight: '600', lineHeight: 20, fontStyle: 'italic' },
  encRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  encCol: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10 },
  encColLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1.1, marginBottom: 4 },
  encColText: { fontSize: 11.5, lineHeight: 17 },
  encEmotionBox: { borderRadius: 12, padding: 12, marginBottom: 8 },
  encEmotionLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1.1, marginBottom: 4 },
  encEmotionText: { fontSize: 12.5, lineHeight: 18 },
  encSacredBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12 },
  encSacredText: { fontSize: 12.5, lineHeight: 18, flex: 1 },
  // Zodiac moon sign
  zodiacMoonCard: { borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden', marginBottom: 4 },
  zodiacMoonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  zodiacMoonBadge: { alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, padding: 12, minWidth: 80 },
  zodiacMoonEmoji: { fontSize: 24, marginBottom: 4 },
  zodiacMoonSign: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  zodiacMoonElement: { fontSize: 10, textAlign: 'center', marginTop: 2 },
  zodiacMoonTitle: { fontSize: 11, marginBottom: 2 },
  zodiacMoonSignName: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  zodiacMoonElementText: { fontSize: 11 },
  zodiacMoonEmotionText: { fontSize: 13.5, lineHeight: 21, marginBottom: 10 },
  zodiacMoonBox: { borderRadius: 12, padding: 12 },
  zodiacMoonBoxLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1.1, marginBottom: 4 },
  zodiacMoonBoxText: { fontSize: 12.5, lineHeight: 18 },
  zodiacAffBox: { borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 10, alignItems: 'center' },
  zodiacAffText: { fontSize: 14, fontWeight: '600', fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
  // Planting guide
  plantHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, overflow: 'hidden' },
  plantPhaseName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  plantPhaseHint: { fontSize: 11 },
  plantBody: { borderRadius: 14, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderWidth: 1, padding: 14, overflow: 'hidden' },
  plantGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  plantCell: { width: (SW - layout.padding.screen * 2 - 8) / 2 - 8, borderRadius: 12, borderWidth: 1, padding: 10 },
  plantCellIcon: { fontSize: 18, marginBottom: 4 },
  plantCellLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  plantCellText: { fontSize: 11.5, lineHeight: 17 },
  plantBestRow: { marginBottom: 10 },
  plantBestLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  plantChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  plantChipText: { fontSize: 11, fontWeight: '600' },
  plantRitualBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12 },
  plantRitualText: { fontSize: 12.5, lineHeight: 18, flex: 1 },
  // Birth moon
  birthMoonHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, borderWidth: 1, padding: 16, overflow: 'hidden' },
  birthMoonTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  birthMoonPhase: { fontSize: 11 },
  birthMoonBody: { borderRadius: 16, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderWidth: 1, padding: 16, overflow: 'hidden' },
  birthMoonDesc: { fontSize: 13.5, lineHeight: 21, marginBottom: 12 },
  birthMoonSection: { borderRadius: 12, borderWidth: 1, padding: 12 },
  birthMoonSectionLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1.1, marginBottom: 8 },
  birthMoonGiftRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  birthMoonDot: { width: 6, height: 6, borderRadius: 3 },
  birthMoonGiftText: { fontSize: 13, lineHeight: 19 },
  birthMoonShadowText: { fontSize: 13, lineHeight: 19 },
  birthMoonPathText: { fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
  // 3-month cycles
  cycleCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10, overflow: 'hidden' },
  cycleCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cycleCardMonth: { fontSize: 15, fontWeight: '700' },
  cycleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  cycleBadgeText: { fontSize: 10, fontWeight: '700' },
  cycleIntent: { borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 6 },
  cycleIntentType: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  cycleIntentText: { fontSize: 12.5, lineHeight: 18 },
  cycleEmptyText: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  // Moon journal
  journalTodayCard: { borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden', marginBottom: 4 },
  journalTodayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  journalTodayPhase: { fontSize: 13, fontWeight: '700' },
  journalTodayDate: { fontSize: 11 },
  journalPromptRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  journalPromptNum: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  journalPromptNumText: { fontSize: 11, fontWeight: '700' },
  journalPromptText: { fontSize: 13, lineHeight: 19, flex: 1 },
  journalEntriesLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.1, marginBottom: 8 },
  journalEntryCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8, overflow: 'hidden' },
  journalEntryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  journalEntryPhase: { fontSize: 11, fontWeight: '700' },
  journalEntryDate: { fontSize: 10 },
  journalEntryEmotionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  journalEntryEmotionLabel: { fontSize: 10 },
  journalEntryText: { fontSize: 12.5, lineHeight: 18 },
  // Journal modal
  journalModalPrompt: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 14 },
  journalModalPromptText: { fontSize: 13.5, lineHeight: 20, fontStyle: 'italic' },
  journalEmotionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.1, marginBottom: 8 },
  journalEmotionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
});
