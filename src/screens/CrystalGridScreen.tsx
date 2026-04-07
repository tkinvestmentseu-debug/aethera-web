// @ts-nocheck
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions, TextInput,
  Modal, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, Line, G, Defs, RadialGradient as SvgRadialGradient, Stop,
  Polygon, Path, Ellipse, Text as SvgText,
} from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
  FadeInDown, FadeInUp, withDelay, Easing, interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Sparkles, ArrowRight, X, Check, Zap, Moon,
  BookOpen, Layers, Grid, Hexagon, RotateCcw, Plus, ChevronDown, ChevronUp,
  Heart, Shield, Leaf, Eye, Sun, Wind,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { screenContracts, layout } from '../core/theme/designSystem';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#A78BFA';

// ── Data ─────────────────────────────────────────────────────────────────────

const CRYSTALS = [
  { id: 'rose_quartz', name: 'Kwarc Różowy', emoji: '🌸', color: '#F472B6', element: 'Woda', chakra: 'Sercowy', chakraColor: '#34D399', intention: 'Miłość', zodiac: 'Byk, Waga', desc: 'Kamień bezwarunkowej miłości i serca. Przyciąga miłość, łagodzi ból emocjonalny i otwiera serce na głębokie połączenie.', ritual: 'Trzymaj w dłoniach podczas afirmacji miłości własnej. Możesz też umieścić pod poduszką aby przyciągnąć harmonię w związkach.', season: 'Wiosna', properties: ['miłość', 'uzdrowienie', 'akceptacja'], healing: 'Wspomaga pracę z traumą serca, buduje zdrowe granice z miłością i łagodzi gniew.' },
  { id: 'amethyst', name: 'Ametyst', emoji: '💜', color: '#A855F7', element: 'Powietrze', chakra: 'Koronowy', chakraColor: '#F9A8D4', intention: 'Intuicja', zodiac: 'Ryby, Wodnik', desc: 'Kamień intuicji i duchowej ochrony. Wzmacnia dary intuicyjne, chroni pole energetyczne i sprzyja spokojnemu snowi.', ritual: 'Połóż na czole podczas medytacji nocnej lub trzymaj przy lampce nocnej.', season: 'Zima', properties: ['intuicja', 'ochrona', 'spokój'], healing: 'Łagodzi napięcia, wspomaga transformację uzależnień i wprowadza głęboki spokój psychiczny.' },
  { id: 'obsidian', name: 'Obsydian', emoji: '⬛', color: '#374151', element: 'Ziemia', chakra: 'Korzenny', chakraColor: '#EF4444', intention: 'Ochrona', zodiac: 'Strzelec, Skorpion', desc: 'Kamień oczyszczenia i uziemienia. Pochłania negatywną energię i tworzy tarczę ochronną wokół aury.', ritual: 'Umieść przy wejściu do domu lub noś przy ciele. Regularnie oczyszczaj pod bieżącą wodą.', season: 'Zima', properties: ['ochrona', 'uziemienie', 'transformacja'], healing: 'Ujawnia ukryte blokady emocjonalne i przyspiesza ich przetworzenie. Doskonały do pracy z cieniem.' },
  { id: 'citrine', name: 'Cytryn', emoji: '✨', color: '#F59E0B', element: 'Ogień', chakra: 'Słoneczny', chakraColor: '#FBBF24', intention: 'Obfitość', zodiac: 'Bliźnięta, Lew', desc: 'Kamień obfitości i manifestacji. Przyciąga prosperity, pobudza kreatywność i budzi radość życia we wszystkich formach.', ritual: 'Trzymaj w portfelu lub na biurku podczas pracy. Nie wymaga oczyszczania — sam przemienia energię.', season: 'Lato', properties: ['obfitość', 'radość', 'manifestacja'], healing: 'Podnosi samoocenę, wzmacnia wolę i motywację. Rozprasza negatywne wzorce myślenia.' },
  { id: 'lapis', name: 'Lapis Lazuli', emoji: '🔵', color: '#1D4ED8', element: 'Woda', chakra: 'Gardłowy', chakraColor: '#60A5FA', intention: 'Mądrość', zodiac: 'Strzelec, Koziorożec', desc: 'Kamień prawdy i mądrości. Wspiera komunikację z wyższym Ja i otwiera kanał wiedzenia wewnętrznego.', ritual: 'Noś przy sobie podczas ważnych rozmów lub pisania. Aktywuje szczerość i głębię ekspresji.', season: 'Zima', properties: ['mądrość', 'prawda', 'komunikacja'], healing: 'Łagodzi migreny, wspiera pracę z tarczycą (energetycznie) i rozluźnia gardło.' },
  { id: 'malachite', name: 'Malachit', emoji: '🟢', color: '#16A34A', element: 'Ziemia', chakra: 'Sercowy', chakraColor: '#34D399', intention: 'Transformacja', zodiac: 'Byk, Koziorożec', desc: 'Kamień zmiany i uzdrowienia emocjonalnego. Przyspiesza transformację i uwalnia stare wzorce zapisane w ciele.', ritual: 'Używaj podczas rytualnego zapisywania przekonań, które chcesz zmienić. Ostrożnie — intensywny kamień.', season: 'Wiosna', properties: ['transformacja', 'uzdrowienie', 'wzrost'], healing: 'Przetwarza stare rany, wspiera zmiany życiowe i uwalnia energię stagnacji.' },
  { id: 'selenite', name: 'Selenyt', emoji: '🤍', color: '#C4B5FD', element: 'Eter', chakra: 'Koronowy', chakraColor: '#F9A8D4', intention: 'Oczyszczenie', zodiac: 'Rak, Ryby', desc: 'Kamień oczyszczenia i połączenia z wyższymi wymiarami. Nie wymaga oczyszczania — sam promieniuje czystą energią.', ritual: 'Połóż inne kryształy na selenicie przez noc, aby je naładować i oczyścić. Idealny na ołtarz.', season: 'Wszystkie', properties: ['oczyszczenie', 'jasność', 'połączenie'], healing: 'Łagodzi niepokój, przynosi klarowność umysłu i oczyszcza aurę z obcych wpływów.' },
  { id: 'labradorite', name: 'Labradoryt', emoji: '🌈', color: '#6366F1', element: 'Powietrze', chakra: 'Trzecie Oko', chakraColor: '#818CF8', intention: 'Magia', zodiac: 'Lew, Skorpion, Strzelec', desc: 'Kamień magii i intuicji. Wzmacnia synchroniczności, chroni aurę i otwiera portale między wymiarami.', ritual: 'Trzymaj podczas pisania dziennika snów lub rytuałów nową i pełną.', season: 'Jesień', properties: ['magia', 'synchroniczność', 'ochrona'], healing: 'Chroni przed energetycznymi "wampirami", wzmacnia niewidzialny płaszcz ochronny.' },
  { id: 'black_tourmaline', name: 'Czarny Turmalin', emoji: '🖤', color: '#4B5563', element: 'Ziemia', chakra: 'Korzenny', chakraColor: '#EF4444', intention: 'Ochrona', zodiac: 'Koziorożec, Byk', desc: 'Najsilniejszy kamień ochronny. Odpycha negatywne energie, EMF i tworzy nieprzeniknioną tarczę przez całą dobę.', ritual: 'Umieść w rogach pokoju lub sypialni dla ochrony 24h. Świetny przy komputerze i telefonie.', season: 'Zima', properties: ['ochrona', 'uziemienie', 'oczyszczenie'], healing: 'Doskonały na stres, przepracowanie i nadwrażliwość na środowiska zewnętrzne.' },
  { id: 'carnelian', name: 'Karneol', emoji: '🟠', color: '#EA580C', element: 'Ogień', chakra: 'Sakralny', chakraColor: '#F97316', intention: 'Kreatywność', zodiac: 'Baran, Lew', desc: 'Kamień twórczej mocy i pasji. Budzi energię sakralną, odwagę i inspirację artystyczną do działania.', ritual: 'Trzymaj podczas twórczej pracy lub przed ważnym krokiem wymagającym odwagi.', season: 'Lato', properties: ['kreatywność', 'pasja', 'odwaga'], healing: 'Wspomaga libido, pobudza trawienie i przywraca zablokowaną energię sakralną.' },
  { id: 'fluorite', name: 'Fluoryt', emoji: '💎', color: '#7C3AED', element: 'Powietrze', chakra: 'Trzecie Oko', chakraColor: '#818CF8', intention: 'Skupienie', zodiac: 'Koziorożec, Ryby', desc: 'Kamień mentalnej klarowności i skupienia. Porządkuje chaos umysłowy, wspiera decyzje i naukę.', ritual: 'Trzymaj w lewej dłoni podczas nauki lub medytacji. Doskonały do pracy koncepcyjnej.', season: 'Wiosna', properties: ['skupienie', 'klarowność', 'porządek'], healing: 'Łagodzi rozproszenie uwagi, wspomaga kręgosłup i system nerwowy (energetycznie).' },
  { id: 'clear_quartz', name: 'Kryształ Górski', emoji: '⬜', color: '#D1D5DB', element: 'Eter', chakra: 'Wszystkie', chakraColor: '#FFFFFF', intention: 'Amplifikacja', zodiac: 'Wszystkie znaki', desc: 'Mistrz wzmacniacz. Amplifikuje energię każdego kryształu i Twoje intencje. Programuje się na dowolny cel.', ritual: 'Umieść w centrum siatki aby wzmocnić każdy inny kamień i skupić strumień intencji.', season: 'Wszystkie', properties: ['amplifikacja', 'klarowność', 'wszechstronność'], healing: 'Wzmacnia działanie wszystkich innych kryształów. Jeden z najważniejszych kamieni do posiadania.' },
];

const GRID_PATTERNS = [
  {
    id: 'flower',
    name: 'Kwiat Życia',
    desc: 'Starożytna geometria stworzenia — 7 nakładających się kółek w harmonijnym wzorze.',
    intention: 'Wszechstronna intencja',
    steps: ['Umieść centralny kamień — mistrz wzmacniacz lub kamień intencji.', 'Dodaj 6 kamieni zewnętrznych w kółku — każdy aktywuje inny aspekt intencji.', 'Połącz kamienie mentalnie lub różdżką, rysując okrąg i linie gwiazdy.', 'Aktywuj wypowiadając intencję trzy razy.'],
    nodes: [
      { x: 0.5, y: 0.5, size: 18 },
      { x: 0.5, y: 0.25, size: 14 }, { x: 0.72, y: 0.375, size: 14 }, { x: 0.72, y: 0.625, size: 14 },
      { x: 0.5, y: 0.75, size: 14 }, { x: 0.28, y: 0.625, size: 14 }, { x: 0.28, y: 0.375, size: 14 },
    ],
  },
  {
    id: 'metatron',
    name: 'Metatron',
    desc: 'Sześcian Metatrona zawiera wszystkie figury świętej geometrii. Najpotężniejszy wzorzec.',
    intention: 'Całkowita transformacja i ochrona',
    steps: ['Centralny kamień — Kryształ Górski jako mistrz wzmacniacz.', 'Trzy kamienie w trójkącie skierowanym ku górze — energia aktywna.', 'Trzy kamienie w trójkącie ku dołowi — energia receptywna.', 'Aktywuj śpiewając "AUM" trzy razy lub uderzając w miskę tybetańską.'],
    nodes: [
      { x: 0.5, y: 0.5, size: 20 },
      { x: 0.5, y: 0.18, size: 14 }, { x: 0.78, y: 0.34, size: 14 }, { x: 0.78, y: 0.66, size: 14 },
      { x: 0.5, y: 0.82, size: 14 }, { x: 0.22, y: 0.66, size: 14 }, { x: 0.22, y: 0.34, size: 14 },
      { x: 0.64, y: 0.32, size: 11 }, { x: 0.64, y: 0.68, size: 11 }, { x: 0.36, y: 0.32, size: 11 },
      { x: 0.36, y: 0.68, size: 11 }, { x: 0.5, y: 0.5, size: 11 },
    ],
  },
  {
    id: 'star',
    name: 'Gwiazda Dawida',
    desc: 'Sześcioramienna gwiazda — równowaga nieba i ziemi, ducha i materii.',
    intention: 'Ochrona i harmonia',
    steps: ['Kamień centralny — Kwarc Różowy lub Ametyst.', 'Górne 3 punkty gwiazdy — kamienie energii nieba (Ametyst, Lapis, Selenyt).', 'Dolne 3 punkty — kamienie energii ziemi (Obsydian, Cytryn, Karneol).', 'Aktywuj okrążając siatkę zgodnie ze wskazówkami zegara 3 razy.'],
    nodes: [
      { x: 0.5, y: 0.5, size: 18 },
      { x: 0.5, y: 0.2, size: 14 }, { x: 0.76, y: 0.35, size: 14 }, { x: 0.76, y: 0.65, size: 14 },
      { x: 0.5, y: 0.8, size: 14 }, { x: 0.24, y: 0.65, size: 14 }, { x: 0.24, y: 0.35, size: 14 },
    ],
  },
  {
    id: 'vesica',
    name: 'Vesica Piscis',
    desc: 'Dwa nakładające się okręgi — portal między światami, symbol dualizmu i jedności.',
    intention: 'Intuicja i widzenie',
    steps: ['Dwa główne kamienie — jeden lewym (intuicja), drugi prawym (działanie) centrum.', 'Cztery kamienie na przecięciach kręgów aktywują przejście między stanami.', 'Kamień centralny spinze oba portale w jedność.', 'Aktywuj podczas medytacji wizualizując biały most światła.'],
    nodes: [
      { x: 0.35, y: 0.5, size: 18 }, { x: 0.65, y: 0.5, size: 18 },
      { x: 0.5, y: 0.3, size: 14 }, { x: 0.5, y: 0.7, size: 14 },
      { x: 0.2, y: 0.5, size: 12 }, { x: 0.8, y: 0.5, size: 12 }, { x: 0.5, y: 0.5, size: 16 },
    ],
  },
];

const INTENTIONS_DATA = [
  { id: 'Ochrona', icon: '🛡️', color: '#374151', desc: 'Budowanie energetycznej tarczy i odpychanie negatywnych wpływów', crystals: ['obsidian', 'black_tourmaline', 'amethyst', 'labradorite'] },
  { id: 'Obfitość', icon: '✨', color: '#F59E0B', desc: 'Przyciąganie prosperity, dobrobytu i radości we wszystkich formach', crystals: ['citrine', 'clear_quartz', 'carnelian', 'malachite'] },
  { id: 'Miłość', icon: '💗', color: '#F472B6', desc: 'Otwieranie serca, przyciąganie harmonii i miłości własnej', crystals: ['rose_quartz', 'malachite', 'selenite', 'clear_quartz'] },
  { id: 'Uzdrowienie', icon: '💚', color: '#16A34A', desc: 'Wspieranie procesów naprawczych na poziomie ciała, duszy i umysłu', crystals: ['malachite', 'selenite', 'amethyst', 'rose_quartz'] },
  { id: 'Transformacja', icon: '🔥', color: '#7C3AED', desc: 'Przyspieszanie zmian, uwalnianie starych wzorców i odrodzenie', crystals: ['obsidian', 'malachite', 'labradorite', 'black_tourmaline'] },
  { id: 'Klarowność', icon: '💎', color: '#60A5FA', desc: 'Oczyszczanie umysłu, zdobywanie wglądu i precyzji myślenia', crystals: ['clear_quartz', 'fluorite', 'selenite', 'lapis'] },
  { id: 'Energia', icon: '⚡', color: '#EA580C', desc: 'Pobudzanie witalności, motywacji i fizycznej mocy działania', crystals: ['carnelian', 'citrine', 'clear_quartz', 'lapis'] },
];

const ACTIVATION_STEPS = [
  {
    num: 1, title: 'Oczyszczenie', icon: '🌊', color: '#60A5FA',
    short: 'Oczyść kryształy i przestrzeń przed budowaniem siatki.',
    guidance: 'Użyj dymu szałwii, dźwięku misy tybetańskiej lub umieść kryształy na selenicie na minimum godzinę. Możesz też trzymać każdy kamień pod bieżącą wodą (nie dotyczy soli, selenitu i labradortu). Wizualizuj białe lub złote światło wypłukujące wszelkie obce energie. Powiedz na głos: "Oczyszczam ten kamień ze wszelkich energii, które do mnie nie należą."',
  },
  {
    num: 2, title: 'Intencja', icon: '🌱', color: '#34D399',
    short: 'Jasno sformułuj intencję zanim ułożysz siatkę.',
    guidance: 'Usiądź w ciszy i wejdź w medytacyjny stan. Sformułuj intencję jako pozytywne, teraźniejsze zdanie: "Jestem otoczona ochroną i bezpieczeństwem" zamiast "Chcę ochrony". Zapisz intencję na kartce i umieść ją pod centralnym kamieniem siatki. Wizualizuj efekt końcowy przez minimum 3 minuty.',
  },
  {
    num: 3, title: 'Aktywacja', icon: '⚡', color: '#FBBF24',
    short: 'Aktywuj siatkę gestem, dźwiękiem lub intencją.',
    guidance: 'Użyj różdżki kwarcu lub palca wskazującego, aby połączyć kamienie rysując niewidzialną linię od centralnego kamienia do każdego zewnętrznego, a następnie wracaj do centrum. Możesz śpiewać "AUM", uderzać w misę lub po prostu mocno wizualizować jak energia płynie między kamieniami niczym złoty strumień światła. Poczuj zmianę w przestrzeni.',
  },
  {
    num: 4, title: 'Utrzymanie', icon: '🌙', color: '#A78BFA',
    short: 'Regularnie odwiedzaj siatkę i odnawiaj intencję.',
    guidance: 'Aktywna siatka powinna być odwiedzana przynajmniej raz w tygodniu. Poświęć minutę na skupienie się na intencji. Raz w miesiącu, najlepiej przy pełni, oczyść wszystkie kamienie i odnów aktywację. Siatki ochronne można pozostawić na stałe. Siatki manifestacji demontuj gdy cel się spełni lub po 40 dniach.',
  },
];

const MOON_GUIDANCE = [
  { phase: '🌑 Nów', name: 'Nów Księżyca', color: '#374151', best: 'Zakładanie nowych siatek, sianie intencji, inicjowanie zmian', avoid: 'Demontaż siatek ochronnych', tip: 'Najlepsza pora na zaprogramowanie nowej siatki manifestacji. Energia nocy jest "pusta" i chłonnie przyjmuje Twoją intencję jak pustą kartkę.' },
  { phase: '🌒 Sierp', name: 'Rosnący Księżyc', color: '#6B7280', best: 'Wzmacnianie siatek wzrostu i obfitości, dodawanie kamieni', avoid: 'Oczyszczanie z negatywności', tip: 'Każda siatka postawiona w tym czasie naturalnie się rozrasta razem z Księżycem. Czas na aktywne działanie i stawianie pierwszych kroków.' },
  { phase: '🌕 Pełnia', name: 'Pełnia Księżyca', color: '#FBBF24', best: 'Ładowanie kamieni, aktywacja siatek miłości i intuicji, celebracja', avoid: 'Zakładania siatek uwalniania', tip: 'Najsilniejszy czas ładowania kryształów. Wystaw siatki na światło Księżyca lub na parapet. Energia pełni amplifikuje każdą intencję kilkukrotnie.' },
  { phase: '🌘 Ubywający', name: 'Ubywający Księżyc', color: '#7C3AED', best: 'Siatki oczyszczenia, uwalniania blokad, demontaż starych wzorców', avoid: 'Manifestacji i przyciągania', tip: 'Księżyc "wciąga" w siebie to, czego chcesz się pozbyć. Idealna chwila na siatkę transformacji i zakopanie symbolicznych "zobowiązań" które chcesz puścić.' },
];

const getMoonPhase = (): { emoji: string; name: string; guidance: typeof MOON_GUIDANCE[0] } => {
  const d = new Date();
  const jd = 2440587.5 + d.getTime() / 86400000;
  const age = ((jd - 2451550.1) % 29.53058868 + 29.53058868) % 29.53058868;
  if (age < 3.69) return { emoji: '🌑', name: 'Nów', guidance: MOON_GUIDANCE[0] };
  if (age < 7.38) return { emoji: '🌒', name: 'Rosnący sierp', guidance: MOON_GUIDANCE[1] };
  if (age < 11.07) return { emoji: '🌓', name: 'Pierwsza kwadra', guidance: MOON_GUIDANCE[1] };
  if (age < 14.77) return { emoji: '🌔', name: 'Rosnący garb', guidance: MOON_GUIDANCE[1] };
  if (age < 18.46) return { emoji: '🌕', name: 'Pełnia', guidance: MOON_GUIDANCE[2] };
  if (age < 22.15) return { emoji: '🌖', name: 'Gasnący garb', guidance: MOON_GUIDANCE[3] };
  if (age < 25.84) return { emoji: '🌗', name: 'Ostatnia kwadra', guidance: MOON_GUIDANCE[3] };
  return { emoji: '🌘', name: 'Stary sierp', guidance: MOON_GUIDANCE[3] };
};

// ── Crystal Mandala Hero (SVG + Pan-Tilt) ────────────────────────────────────

const CrystalMandalaHero = React.memo(({ accent }: { accent: string }) => {
  const rot1 = useSharedValue(0);
  const rot2 = useSharedValue(0);
  const pulse = useSharedValue(1.0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    rot1.value = withRepeat(withTiming(360, { duration: 22000, easing: Easing.linear }), -1, false);
    rot2.value = withRepeat(withTiming(-360, { duration: 15000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(
      withSequence(withTiming(1.07, { duration: 2400 }), withTiming(0.95, { duration: 2400 })),
      -1, false,
    );
  }, []);

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      tiltX.value = Math.max(-25, Math.min(25, e.translationY * 0.28));
      tiltY.value = Math.max(-25, Math.min(25, e.translationX * 0.28));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outer = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: pulse.value },
    ],
  }));
  const ring1Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot1.value}deg` }] }));
  const ring2Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot2.value}deg` }] }));

  const hexPoints = (cx: number, cy: number, r: number) => {
    return Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(' ');
  };

  const HEX_COLORS = ['#A78BFA', '#C4B5FD', '#818CF8', '#7C3AED', '#6D28D9', '#F472B6'];
  const NODE_COLS = ['#F472B6', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F9A8D4'];

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[outer, { width: 200, height: 200 }]}>
          {/* Layer 1: Static background rings */}
          <Svg width={200} height={200} viewBox="-100 -100 200 200" style={{ position: 'absolute' }}>
            <Defs>
              <SvgRadialGradient id="cgCoreGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={accent} stopOpacity={0.55} />
                <Stop offset="100%" stopColor={accent} stopOpacity={0.0} />
              </SvgRadialGradient>
            </Defs>
            <Circle cx={0} cy={0} r={96} fill="url(#cgCoreGlow)" />
            <Circle cx={0} cy={0} r={90} fill="none" stroke={accent + '18'} strokeWidth={0.7} />
            <Circle cx={0} cy={0} r={70} fill="none" stroke={accent + '14'} strokeWidth={0.5} />
            <Circle cx={0} cy={0} r={50} fill="none" stroke={accent + '20'} strokeWidth={0.5} />
            <Circle cx={0} cy={0} r={30} fill="none" stroke={accent + '28'} strokeWidth={0.6} />
          </Svg>

          {/* Layer 2: Rotating outer hexagon ring */}
          <Animated.View style={[ring1Style, { position: 'absolute', width: 200, height: 200 }]}>
            <Svg width={200} height={200} viewBox="-100 -100 200 200">
              {Array.from({ length: 6 }, (_, i) => {
                const a = (Math.PI / 3) * i;
                const x = 70 * Math.cos(a);
                const y = 70 * Math.sin(a);
                return (
                  <G key={i}>
                    <Polygon points={hexPoints(x, y, 11)} fill={HEX_COLORS[i] + '30'} stroke={HEX_COLORS[i] + '80'} strokeWidth={1} />
                    <Circle cx={x} cy={y} r={5} fill={HEX_COLORS[i]} opacity={0.85} />
                  </G>
                );
              })}
              <Polygon points={hexPoints(0, 0, 50)} fill="none" stroke={accent + '22'} strokeWidth={0.8} />
            </Svg>
          </Animated.View>

          {/* Layer 3: Counter-rotating inner ring */}
          <Animated.View style={[ring2Style, { position: 'absolute', width: 200, height: 200 }]}>
            <Svg width={200} height={200} viewBox="-100 -100 200 200">
              {Array.from({ length: 6 }, (_, i) => {
                const a = (Math.PI / 3) * i + Math.PI / 6;
                const x = 38 * Math.cos(a);
                const y = 38 * Math.sin(a);
                return <Circle key={i} cx={x} cy={y} r={4} fill={NODE_COLS[i]} opacity={0.9} />;
              })}
              {Array.from({ length: 12 }, (_, i) => {
                const a = (Math.PI / 6) * i;
                return (
                  <Line key={i} x1={0} y1={0} x2={50 * Math.cos(a)} y2={50 * Math.sin(a)} stroke={accent + '18'} strokeWidth={0.5} />
                );
              })}
            </Svg>
          </Animated.View>

          {/* Layer 4: Center crystal node */}
          <Svg width={200} height={200} viewBox="-100 -100 200 200" style={{ position: 'absolute' }}>
            <Circle cx={0} cy={0} r={18} fill={accent + '40'} stroke={accent + 'BB'} strokeWidth={1.5} />
            <Circle cx={0} cy={0} r={10} fill={accent} opacity={0.9} />
            <Circle cx={-3} cy={-3} r={3.5} fill="#FFFFFF" opacity={0.55} />
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

// ── Grid Canvas ──────────────────────────────────────────────────────────────

const GridCanvas = ({ pattern, placedCrystals, onNodePress }) => {
  const sz = SW - 44;
  const nodes = pattern.nodes;
  return (
    <View>
      <Svg width={sz} height={sz} style={{ alignSelf: 'center' }}>
        <Defs>
          <SvgRadialGradient id="bg" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={ACCENT} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
          </SvgRadialGradient>
        </Defs>
        <Circle cx={sz / 2} cy={sz / 2} r={sz * 0.46} fill="url(#bg)" stroke={ACCENT + '22'} strokeWidth={0.8} />
        <Circle cx={sz / 2} cy={sz / 2} r={sz * 0.33} fill="none" stroke={ACCENT + '14'} strokeWidth={0.6} />
        <Circle cx={sz / 2} cy={sz / 2} r={sz * 0.18} fill="none" stroke={ACCENT + '18'} strokeWidth={0.6} />
        {/* Connection lines */}
        {nodes.map((n, i) => nodes.slice(i + 1).map((m, j) => (
          <Line key={`l${i}-${j}`} x1={n.x * sz} y1={n.y * sz} x2={m.x * sz} y2={m.y * sz} stroke={ACCENT + '10'} strokeWidth={0.6} />
        )))}
        {/* Nodes */}
        {nodes.map((n, i) => {
          const cx = n.x * sz;
          const cy = n.y * sz;
          const crystal = placedCrystals[i];
          return (
            <G key={i}>
              {crystal ? (
                <>
                  <Circle cx={cx} cy={cy} r={n.size + 7} fill={crystal.color + '28'} stroke={crystal.color + '55'} strokeWidth={1.5} />
                  <Circle cx={cx} cy={cy} r={n.size} fill={crystal.color + '80'} stroke={crystal.color} strokeWidth={1} />
                  <Circle cx={cx - n.size * 0.25} cy={cy - n.size * 0.25} r={n.size * 0.28} fill="#FFFFFF" opacity={0.45} />
                </>
              ) : (
                <>
                  <Circle cx={cx} cy={cy} r={n.size} fill={ACCENT + '10'} stroke={ACCENT + '50'} strokeWidth={1.2} strokeDasharray="3,3" onPress={() => onNodePress(i)} />
                  <Circle cx={cx} cy={cy} r={3} fill={ACCENT + '40'} onPress={() => onNodePress(i)} />
                </>
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────

export const CrystalGridScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';

  const TABS = [
    { id: 'mandala', label: 'Mandala' },
    { id: 'kryształy', label: 'Kryształy' },
    { id: 'siatka', label: 'Siatka' },
    { id: 'intencja', label: 'Intencja' },
    { id: 'dziennik', label: 'Dziennik' },
  ] as const;
  type TabId = typeof TABS[number]['id'];

  const [activeTab, setActiveTab] = useState<TabId>('mandala');
  const [selectedPattern, setSelectedPattern] = useState(GRID_PATTERNS[0]);
  const [placedCrystals, setPlacedCrystals] = useState<Record<number, typeof CRYSTALS[0]>>({});
  const [pickingNode, setPickingNode] = useState<number | null>(null);
  const [intention, setIntention] = useState('');
  const [selectedIntention, setSelectedIntention] = useState<string | null>(null);
  const [ritualText, setRitualText] = useState('');
  const [ritualLoading, setRitualLoading] = useState(false);
  const [detailCrystal, setDetailCrystal] = useState<typeof CRYSTALS[0] | null>(null);
  const [activated, setActivated] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [expandedCrystal, setExpandedCrystal] = useState<string | null>(null);
  const [expandedMoon, setExpandedMoon] = useState<number | null>(null);

  // Journal state
  const [savedGrids, setSavedGrids] = useState<Array<{ id: string; intentionLabel: string; patternName: string; crystalNames: string[]; date: string; note: string }>>([]);
  const [journalNote, setJournalNote] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const placedCount = Object.keys(placedCrystals).length;
  const moonInfo = useMemo(() => getMoonPhase(), []);

  const handleNodePress = (nodeIdx: number) => { setPickingNode(nodeIdx); HapticsService.impact('light'); };
  const placeCrystal = (crystal: typeof CRYSTALS[0]) => {
    if (pickingNode !== null) {
      setPlacedCrystals(p => ({ ...p, [pickingNode]: crystal }));
      setPickingNode(null);
      HapticsService.impact('light');
    }
  };
  const clearNode = (nodeIdx: number) => {
    setPlacedCrystals(p => { const n = { ...p }; delete n[nodeIdx]; return n; });
  };

  const generateRitual = async () => {
    setRitualLoading(true);
    const crystalNames = Object.values(placedCrystals).map(c => c.name).join(', ');
    try {
      const text = await AiService.chatWithOracle([{
        role: 'user',
        content: `Napisz krótki rytual aktywacji siatki kryształów w języku użytkownika. Użyte kryształy: ${crystalNames || 'Kwarc Górski'}. Wzorzec: ${selectedPattern.name}. Intencja: ${intention || selectedIntention || 'harmonia i wzrost'}. Faza księżyca: ${moonInfo.name}. Format: 3 krótkie kroki aktywacji, po jednym zdaniu każdy, łącznie max 80 słów. Bez markdown. Zacznij od słów "Krok 1:".`,
      }]);
      setRitualText(text);
    } catch {
      setRitualText('Krok 1: Usiądź przy siatce i oddychaj spokojnie, czując połączenie z ziemią pod stopami. Krok 2: Dotknij kolejno każdego kryształu i poczuj jak energia przepływa między nimi. Krok 3: Wypowiedz intencję na głos trzy razy i wizualizuj złoty strumień światła aktywujący cały wzorzec.');
    } finally {
      setRitualLoading(false);
    }
  };

  const saveGrid = () => {
    if (!selectedIntention && !intention.trim()) {
      Alert.alert('Brak intencji', 'Dodaj intencję przed zapisaniem siatki.');
      return;
    }
    const entry = {
      id: Date.now().toString(),
      intentionLabel: selectedIntention || intention.slice(0, 40),
      patternName: selectedPattern.name,
      crystalNames: Object.values(placedCrystals).map(c => c.name),
      date: new Date().toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'long', year: 'numeric' }),
      note: journalNote,
    };
    setSavedGrids(p => [entry, ...p]);
    setShowSaveModal(false);
    setJournalNote('');
    HapticsService.notify();
    Alert.alert('Zapisano ✦', 'Siatka została zapisana w dzienniku kryształów.');
  };

  const intentionCrystals = useMemo(() => {
    if (!selectedIntention) return [];
    const data = INTENTIONS_DATA.find(i => i.id === selectedIntention);
    if (!data) return [];
    return data.crystals.map(id => CRYSTALS.find(c => c.id === id)).filter(Boolean);
  }, [selectedIntention]);

  return (
    <View style={[cg.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={isLight ? ['#F5F0FF', '#EDE8FF', '#E5DEFA'] : ['#07040F', '#0E0820', '#080516']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>

        {/* Header */}
        <View style={cg.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} hitSlop={14}>
            <ChevronLeft color={ACCENT} size={22} strokeWidth={1.8} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: ACCENT }}>SIATKA KRYSZTAŁÓW</Text>
            <Text style={{ fontSize: 12, color: subColor, marginTop: 2 }}>Geometria mocy i intencji</Text>
          </View>
          <Pressable
            onPress={() => { if (isFavoriteItem('crystal_grid')) { removeFavoriteItem('crystal_grid'); } else { addFavoriteItem({ id: 'crystal_grid', label: 'Siatka Kryształów', route: 'CrystalGrid', params: {}, icon: 'Sparkles', color: ACCENT, addedAt: new Date().toISOString() }); } }}
            hitSlop={14}
          >
            <Star color={ACCENT} size={18} strokeWidth={1.8} fill={isFavoriteItem('crystal_grid') ? ACCENT : 'none'} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
          keyboardVerticalOffset={insets.top + 56}
        >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') + 24 }}
        >

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 0, marginBottom: 12, marginHorizontal: -22 }} contentContainerStyle={{ flexDirection: 'row', paddingHorizontal: 22, gap: 8, alignItems: 'center' }}>
            {TABS.map(t => (
              <Pressable
                key={t.id}
                onPress={() => setActiveTab(t.id)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1,
                  backgroundColor: activeTab === t.id ? ACCENT + '18' : 'transparent',
                  borderColor: activeTab === t.id ? ACCENT : cardBorder,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: activeTab === t.id ? '700' : '500', color: activeTab === t.id ? ACCENT : subColor }}>{t.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* ── MANDALA TAB ── */}
          {activeTab === 'mandala' && (
            <>
              {/* Hero mandala */}
              <Animated.View entering={FadeInDown.duration(500)}>
                <CrystalMandalaHero accent={ACCENT} />
              </Animated.View>

              {/* Moon phase card */}
              <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ padding: 16, borderRadius: 18, borderWidth: 1, borderColor: ACCENT + '30', backgroundColor: cardBg, marginBottom: 16 }}>
                <LinearGradient colors={[ACCENT + '18', 'transparent']} style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Text style={{ fontSize: 24 }}>{moonInfo.emoji}</Text>
                  <View>
                    <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: ACCENT }}>AKTUALNA FAZA KSIĘŻYCA</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>{moonInfo.name}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, lineHeight: 20, color: subColor }}>{moonInfo.guidance.tip}</Text>
                <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#22C55E' + '22', borderWidth: 1, borderColor: '#22C55E' + '40' }}>
                    <Text style={{ fontSize: 11, color: '#22C55E', fontWeight: '600' }}>✓ {moonInfo.guidance.best.split(',')[0]}</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Sacred geometry layouts */}
              <Animated.View entering={FadeInDown.delay(150).duration(400)}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 12 }}>WZORCE ŚWIĘTEJ GEOMETRII</Text>
                {GRID_PATTERNS.map((p, i) => (
                  <Pressable
                    key={p.id}
                    onPress={() => { setSelectedPattern(p); setPlacedCrystals({}); setActiveTab('siatka'); HapticsService.impact('light'); }}
                  >
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: cardBorder, backgroundColor: cardBg, marginBottom: 10 }}
                    >
                      <LinearGradient colors={[ACCENT + '20', 'transparent']} style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
                      <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: ACCENT + '18', borderWidth: 1, borderColor: ACCENT + '35', alignItems: 'center', justifyContent: 'center' }}>
                        <Hexagon color={ACCENT} size={24} strokeWidth={1.4} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>{p.name}</Text>
                        <Text style={{ fontSize: 12, color: subColor, marginTop: 2 }}>{p.intention}</Text>
                        <Text style={{ fontSize: 11, color: subColor, marginTop: 4, lineHeight: 16 }} numberOfLines={2}>{p.desc}</Text>
                      </View>
                      <ArrowRight color={ACCENT} size={16} strokeWidth={1.8} />
                    </View>
                  </Pressable>
                ))}
              </Animated.View>

              {/* Activation ritual steps */}
              <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginTop: 8, marginBottom: 12 }}>KROKI AKTYWACJI SIATKI</Text>
                {ACTIVATION_STEPS.map((step, i) => {
                  const open = expandedStep === i;
                  return (
                    <Pressable key={step.num} onPress={() => { setExpandedStep(open ? null : i); HapticsService.impact('light'); }}>
                      <View
                        style={{ padding: 14, borderRadius: 18, borderWidth: 1, borderColor: step.color + '40', backgroundColor: cardBg, marginBottom: 10 }}
                      >
                        <LinearGradient colors={[step.color + '15', 'transparent']} style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: step.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 20 }}>{step.icon}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: step.color + '30' }}>
                                <Text style={{ fontSize: 10, fontWeight: '800', color: step.color }}>{step.num}</Text>
                              </View>
                              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>{step.title}</Text>
                            </View>
                            <Text style={{ fontSize: 12, color: subColor, marginTop: 4 }}>{step.short}</Text>
                          </View>
                          {open ? <ChevronUp color={subColor} size={16} /> : <ChevronDown color={subColor} size={16} />}
                        </View>
                        {open && (
                          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: step.color + '25' }}>
                            <Text style={{ fontSize: 13, lineHeight: 22, color: textColor }}>{step.guidance}</Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </Animated.View>

              <EndOfContentSpacer size="standard" />
            </>
          )}

          {/* ── KRYSZTAŁY TAB ── */}
          {activeTab === 'kryształy' && (
            <>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 12 }}>ENCYKLOPEDIA KRYSZTAŁÓW</Text>
              <Text style={{ fontSize: 13, color: subColor, marginBottom: 16, lineHeight: 20 }}>Dotknij kryształu, aby zobaczyć jego pełne właściwości, powiązania z czakrami i jak używać go w siatce.</Text>

              {CRYSTALS.map((c, i) => {
                const open = expandedCrystal === c.id;
                return (
                  <Pressable key={c.id} onPress={() => { setExpandedCrystal(open ? null : c.id); HapticsService.impact('light'); }}>
                    <Animated.View
                      entering={FadeInDown.delay(i * 30).duration(350)}
                      style={{
                        paddingVertical: 14, paddingHorizontal: 16,
                        borderRadius: 14, borderWidth: 1,
                        borderColor: open ? c.color + '55' : cardBorder,
                        backgroundColor: open ? (isLight ? 'rgba(255,248,234,0.92)' : 'rgba(255,255,255,0.08)') : cardBg,
                        marginBottom: 10, overflow: 'hidden',
                      }}
                    >
                      <LinearGradient colors={[c.color + '14', 'transparent']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
                      {/* Compact horizontal row */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {/* 40x40 emoji badge */}
                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.color + '28', borderWidth: 1.5, borderColor: c.color + '55', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Text style={{ fontSize: 20 }}>{c.emoji}</Text>
                        </View>
                        {/* Name + subtitle in middle */}
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{c.name}</Text>
                          <Text style={{ fontSize: 11, color: subColor, marginTop: 1 }}>{c.chakra} · {c.element}</Text>
                          <Text style={{ fontSize: 10, color: subColor, marginTop: 1 }} numberOfLines={1}>{c.properties.join(' · ')}</Text>
                        </View>
                        {/* Color accent badge on right */}
                        <View style={{ alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: c.color + '26', borderWidth: 1, borderColor: c.color + '44' }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: c.color }}>{c.intention}</Text>
                          </View>
                          {open ? <ChevronUp color={subColor} size={14} /> : <ChevronDown color={subColor} size={14} />}
                        </View>
                      </View>

                      {open && (
                        <Animated.View entering={FadeInDown.duration(250)} style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.color + '25' }}>
                          <Text style={{ fontSize: 13, lineHeight: 21, color: textColor, marginBottom: 12 }}>{c.desc}</Text>

                          {/* Chakra association */}
                          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                            <View style={{ flex: 1, padding: 10, borderRadius: 12, backgroundColor: c.chakraColor + '18', borderWidth: 1, borderColor: c.chakraColor + '35' }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: c.chakraColor, marginBottom: 3 }}>CZAKRA</Text>
                              <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>{c.chakra}</Text>
                            </View>
                            <View style={{ flex: 1, padding: 10, borderRadius: 12, backgroundColor: ACCENT + '12', borderWidth: 1, borderColor: ACCENT + '28' }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: ACCENT, marginBottom: 3 }}>ZODIAK</Text>
                              <Text style={{ fontSize: 12, fontWeight: '500', color: textColor }}>{c.zodiac}</Text>
                            </View>
                          </View>

                          {/* Healing */}
                          <View style={{ padding: 10, borderRadius: 12, backgroundColor: '#22C55E' + '12', borderWidth: 1, borderColor: '#22C55E' + '28', marginBottom: 10 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#22C55E', marginBottom: 3 }}>UZDRAWIANIE</Text>
                            <Text style={{ fontSize: 13, lineHeight: 20, color: textColor }}>{c.healing}</Text>
                          </View>

                          {/* Ritual */}
                          <View style={{ padding: 10, borderRadius: 12, backgroundColor: c.color + '12', borderWidth: 1, borderColor: c.color + '28', marginBottom: 12 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: c.color, marginBottom: 3 }}>RYTUAŁ</Text>
                            <Text style={{ fontSize: 13, lineHeight: 20, color: textColor }}>{c.ritual}</Text>
                          </View>

                          <Pressable
                            onPress={() => { setDetailCrystal(c); HapticsService.impact('light'); }}
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: ACCENT + '18', borderWidth: 1, borderColor: ACCENT + '35' }}
                          >
                            <Grid color={ACCENT} size={14} strokeWidth={1.8} />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>Dodaj do siatki</Text>
                          </Pressable>
                        </Animated.View>
                      )}
                    </Animated.View>
                  </Pressable>
                );
              })}

              <EndOfContentSpacer size="standard" />
            </>
          )}

          {/* ── SIATKA TAB ── */}
          {activeTab === 'siatka' && (
            <>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 10 }}>WZORZEC SIATKI</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ flexDirection: 'row', paddingRight: 22 }}>
                {GRID_PATTERNS.map(p => (
                  <Pressable
                    key={p.id}
                    onPress={() => { setSelectedPattern(p); setPlacedCrystals({}); HapticsService.impact('light'); }}
                    style={{ marginRight: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: selectedPattern.id === p.id ? ACCENT : cardBorder, backgroundColor: selectedPattern.id === p.id ? ACCENT + '18' : cardBg, maxWidth: 160 }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: selectedPattern.id === p.id ? '700' : '500', color: selectedPattern.id === p.id ? ACCENT : textColor }} numberOfLines={1}>{p.name}</Text>
                    <Text style={{ fontSize: 11, color: subColor, marginTop: 2 }} numberOfLines={1}>{p.intention}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Selected pattern description */}
              <Animated.View entering={FadeInDown.duration(300)} style={{ padding: 12, borderRadius: 14, borderWidth: 1, borderColor: ACCENT + '28', backgroundColor: ACCENT + '08', marginBottom: 14 }}>
                <Text style={{ fontSize: 13, lineHeight: 20, color: textColor }}>{selectedPattern.desc}</Text>
              </Animated.View>

              {/* Grid canvas */}
              <View style={{ padding: 12, borderRadius: 22, borderWidth: 1, borderColor: ACCENT + '30', backgroundColor: cardBg, marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: subColor, textAlign: 'center', marginBottom: 10 }}>Dotknij węzeł siatki, aby umieścić kryształ</Text>
                <GridCanvas pattern={selectedPattern} placedCrystals={placedCrystals} onNodePress={handleNodePress} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <Text style={{ fontSize: 12, color: subColor }}>{placedCount} / {selectedPattern.nodes.length} węzłów</Text>
                  {placedCount > 0 && (
                    <Pressable onPress={() => setPlacedCrystals({})}>
                      <Text style={{ fontSize: 12, color: '#EF4444' }}>Wyczyść siatkę</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Placement guide for pattern */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 10 }}>INSTRUKCJA UKŁADANIA</Text>
                {selectedPattern.steps.map((step, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: ACCENT + '28', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: ACCENT }}>{i + 1}</Text>
                    </View>
                    <Text style={{ fontSize: 13, lineHeight: 20, color: textColor, flex: 1 }}>{step}</Text>
                  </View>
                ))}
              </View>

              {/* Placed crystals list */}
              {placedCount > 0 && (
                <Animated.View entering={FadeInDown.duration(300)} style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 10 }}>UMIESZCZONE KRYSZTAŁY</Text>
                  {Object.entries(placedCrystals).map(([nodeIdx, crystal]) => (
                    <View key={nodeIdx} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: crystal.color + '35', backgroundColor: cardBg, marginBottom: 8 }}>
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: crystal.color, marginRight: 10 }} />
                      <Text style={{ fontSize: 22, marginRight: 10 }}>{crystal.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{crystal.name}</Text>
                        <Text style={{ fontSize: 12, color: subColor }}>Węzeł {Number(nodeIdx) + 1} · {crystal.intention}</Text>
                      </View>
                      <Pressable onPress={() => clearNode(Number(nodeIdx))} hitSlop={10}>
                        <X color={subColor} size={16} />
                      </Pressable>
                    </View>
                  ))}
                </Animated.View>
              )}

              {/* Activate button */}
              {placedCount >= 3 && (
                <Pressable
                  onPress={() => { HapticsService.impact('medium'); setActivated(true); setActiveTab('intencja'); }}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 18, backgroundColor: ACCENT, marginBottom: 16 }}
                >
                  <Zap color="#FFF" size={18} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF' }}>Aktywuj siatkę ({placedCount} kryształów)</Text>
                </Pressable>
              )}

              <EndOfContentSpacer size="standard" />
            </>
          )}

          {/* ── INTENCJA TAB ── */}
          {activeTab === 'intencja' && (
            <>
              {activated && (
                <Animated.View entering={FadeInDown.duration(400)} style={{ padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#22C55E50', backgroundColor: '#22C55E10', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Check color="#22C55E" size={20} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#22C55E' }}>Siatka aktywowana — {placedCount} kryształów gotowych</Text>
                  </View>
                </Animated.View>
              )}

              {/* Intention selector */}
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 12 }}>WYBIERZ CEL SIATKI</Text>
              {INTENTIONS_DATA.map((it, i) => {
                const active = selectedIntention === it.id;
                return (
                  <Pressable
                    key={it.id}
                    onPress={() => { setSelectedIntention(active ? null : it.id); HapticsService.impact('light'); }}
                  >
                    <Animated.View
                      entering={FadeInDown.delay(i * 45).duration(350)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 16, borderWidth: 1.5, borderColor: active ? it.color : cardBorder, backgroundColor: active ? it.color + '15' : cardBg, marginBottom: 8 }}
                    >
                      <Text style={{ fontSize: 22 }}>{it.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: active ? it.color : textColor }}>{it.id}</Text>
                        <Text style={{ fontSize: 12, color: subColor, marginTop: 2 }}>{it.desc}</Text>
                      </View>
                      {active && <Check color={it.color} size={16} strokeWidth={2.5} />}
                    </Animated.View>
                  </Pressable>
                );
              })}

              {/* Recommended crystals for selected intention */}
              {selectedIntention && intentionCrystals.length > 0 && (
                <Animated.View entering={FadeInDown.duration(350)} style={{ marginTop: 8, marginBottom: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 10 }}>
                    POLECANE KRYSZTAŁY — {selectedIntention.toUpperCase()}
                  </Text>
                  {intentionCrystals.map((c, i) => (
                    <Animated.View
                      key={c.id}
                      entering={FadeInDown.delay(i * 50).duration(300)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: c.color + '35', backgroundColor: cardBg, marginBottom: 8 }}
                    >
                      <LinearGradient colors={[c.color + '20', 'transparent']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
                      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: c.color + '28', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 20 }}>{c.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{c.name}</Text>
                        <Text style={{ fontSize: 11, color: subColor }}>{c.chakra} · {c.element}</Text>
                      </View>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: c.color + '25' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: c.color }}>
                          {i === 0 ? 'Centrum' : `Węzeł ${i + 1}`}
                        </Text>
                      </View>
                    </Animated.View>
                  ))}
                </Animated.View>
              )}

              {/* Custom intention text */}
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 8 }}>WŁASNA INTENCJA</Text>
              <TextInput
                value={intention}
                onChangeText={setIntention}
                placeholder="Napisz swoją intencję dla tej siatki..."
                placeholderTextColor={subColor}
                multiline
                style={{ padding: 14, borderRadius: 16, borderWidth: 1, borderColor: cardBorder, backgroundColor: cardBg, color: textColor, fontSize: 14, lineHeight: 22, minHeight: 80, marginBottom: 16 }}
              />

              {/* Moon phase */}
              <View style={{ padding: 14, borderRadius: 16, borderWidth: 1, borderColor: ACCENT + '30', backgroundColor: cardBg, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Moon color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT }}>FAZA KSIĘŻYCA</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>{moonInfo.emoji} {moonInfo.name}</Text>
                <Text style={{ fontSize: 12, color: subColor, marginTop: 4 }}>{moonInfo.guidance.tip}</Text>
              </View>

              {/* AI ritual generator */}
              <Pressable
                onPress={generateRitual}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: ACCENT + '40', backgroundColor: ACCENT + '10', marginBottom: 16 }}
              >
                {ritualLoading
                  ? <Text style={{ color: ACCENT }}>Generuję rytuał...</Text>
                  : <><Sparkles color={ACCENT} size={16} strokeWidth={1.8} /><Text style={{ fontSize: 15, fontWeight: '700', color: ACCENT }}>Generuj rytuał siatki AI</Text></>
                }
              </Pressable>

              {ritualText ? (
                <Animated.View entering={FadeInDown.duration(400)} style={{ padding: 18, borderRadius: 18, borderWidth: 1, borderColor: ACCENT + '30', backgroundColor: cardBg, marginBottom: 16 }}>
                  <LinearGradient colors={[ACCENT + '14', 'transparent']} style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 10 }}>✦ RYTUAŁ AKTYWACJI</Text>
                  <Text style={{ fontSize: 14, lineHeight: 24, color: textColor }}>{ritualText}</Text>
                </Animated.View>
              ) : null}

              {/* Save grid button */}
              {(selectedIntention || intention.trim()) && (
                <Pressable
                  onPress={() => setShowSaveModal(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#22C55E' + '50', backgroundColor: '#22C55E' + '10', marginBottom: 16 }}
                >
                  <BookOpen color="#22C55E" size={16} strokeWidth={1.8} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#22C55E' }}>Zapisz siatkę w dzienniku</Text>
                </Pressable>
              )}

              <EndOfContentSpacer size="standard" />
            </>
          )}

          {/* ── DZIENNIK TAB ── */}
          {activeTab === 'dziennik' && (
            <>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 6 }}>MÓJ DZIENNIK SIATEK</Text>
              <Text style={{ fontSize: 13, color: subColor, marginBottom: 16, lineHeight: 20 }}>Dokumentuj swoje siatki, intencje i obserwacje podczas pracy z kryształami.</Text>

              {savedGrids.length === 0 ? (
                <Animated.View entering={FadeInDown.duration(400)} style={{ padding: 32, borderRadius: 22, borderWidth: 1, borderColor: cardBorder, backgroundColor: cardBg, alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ fontSize: 36, marginBottom: 12 }}>💎</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 6 }}>Brak zapisanych siatek</Text>
                  <Text style={{ fontSize: 13, color: subColor, textAlign: 'center', lineHeight: 20 }}>Stwórz swoją pierwszą siatkę, ustaw intencję i zapisz ją tutaj aby śledzić postęp manifestacji.</Text>
                  <Pressable
                    onPress={() => setActiveTab('siatka')}
                    style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 14, backgroundColor: ACCENT + '18', borderWidth: 1, borderColor: ACCENT + '35' }}
                  >
                    <Plus color={ACCENT} size={15} strokeWidth={2} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>Utwórz siatkę</Text>
                  </Pressable>
                </Animated.View>
              ) : (
                savedGrids.map((g, i) => (
                  <Animated.View
                    key={g.id}
                    entering={FadeInDown.delay(i * 60).duration(350)}
                    style={{ padding: 16, borderRadius: 18, borderWidth: 1, borderColor: ACCENT + '30', backgroundColor: cardBg, marginBottom: 12 }}
                  >
                    <LinearGradient colors={[ACCENT + '12', 'transparent']} style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>{g.intentionLabel}</Text>
                        <Text style={{ fontSize: 12, color: subColor, marginTop: 2 }}>{g.patternName} · {g.date}</Text>
                      </View>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: ACCENT + '20' }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: ACCENT }}>{g.crystalNames.length} kryształów</Text>
                      </View>
                    </View>
                    {g.crystalNames.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: g.note ? 10 : 0 }}>
                        {g.crystalNames.map((cn, ci) => {
                          const found = CRYSTALS.find(c => c.name === cn);
                          return (
                            <View key={ci} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: (found?.color || ACCENT) + '20' }}>
                              <Text style={{ fontSize: 11 }}>{found?.emoji || '💎'}</Text>
                              <Text style={{ fontSize: 11, color: found?.color || ACCENT, fontWeight: '600' }}>{cn}</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                    {g.note ? (
                      <Text style={{ fontSize: 13, lineHeight: 20, color: subColor, fontStyle: 'italic' }}>"{g.note}"</Text>
                    ) : null}
                  </Animated.View>
                ))
              )}

              {/* Moon phase guidance section */}
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginTop: 8, marginBottom: 12 }}>AKTYWACJA PRZEZ FAZY KSIĘŻYCA</Text>
              {MOON_GUIDANCE.map((mg, i) => {
                const open = expandedMoon === i;
                return (
                  <Pressable key={i} onPress={() => { setExpandedMoon(open ? null : i); HapticsService.impact('light'); }}>
                    <Animated.View
                      entering={FadeInDown.delay(i * 50).duration(350)}
                      style={{ padding: 14, borderRadius: 18, borderWidth: 1, borderColor: mg.color + '40', backgroundColor: cardBg, marginBottom: 10 }}
                    >
                      <LinearGradient colors={[mg.color + '14', 'transparent']} style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ fontSize: 26 }}>{mg.phase.split(' ')[0]}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{mg.name}</Text>
                          <Text style={{ fontSize: 12, color: subColor, marginTop: 2 }} numberOfLines={1}>{mg.best}</Text>
                        </View>
                        {open ? <ChevronUp color={subColor} size={15} /> : <ChevronDown color={subColor} size={15} />}
                      </View>
                      {open && (
                        <Animated.View entering={FadeInDown.duration(250)} style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: mg.color + '22' }}>
                          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                            <View style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#22C55E' + '14', borderWidth: 1, borderColor: '#22C55E' + '30' }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#22C55E', marginBottom: 3 }}>POLECANE</Text>
                              <Text style={{ fontSize: 12, color: textColor, lineHeight: 18 }}>{mg.best}</Text>
                            </View>
                            <View style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#EF4444' + '12', borderWidth: 1, borderColor: '#EF4444' + '28' }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444', marginBottom: 3 }}>UNIKAJ</Text>
                              <Text style={{ fontSize: 12, color: textColor, lineHeight: 18 }}>{mg.avoid}</Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 13, lineHeight: 20, color: subColor, fontStyle: 'italic' }}>{mg.tip}</Text>
                        </Animated.View>
                      )}
                    </Animated.View>
                  </Pressable>
                );
              })}

              <EndOfContentSpacer size="standard" />
            </>
          )}

          {/* ── CO DALEJ? (shown only on mandala tab) ── */}
          {activeTab === 'mandala' ? null : (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 12 }}>✦ CO DALEJ?</Text>
              {[
                { label: 'Kalendarz Księżycowy', sub: 'Aktywuj siatkę przy nowiu lub pełni', route: 'LunarCalendar', color: '#818CF8' },
                { label: 'Kąpiel dźwiękowa', sub: 'Dźwięk wzmacnia energię kryształów', route: 'SoundBath', color: '#60A5FA' },
                { label: 'Zapisz intencję', sub: 'Udokumentuj siatkę i jej cel w dzienniku', route: 'JournalEntry', color: ACCENT },
              ].map(item => (
                <Pressable
                  key={item.route}
                  onPress={() => { HapticsService.impact('light'); navigation.navigate(item.route as any); }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: item.color + '30', backgroundColor: cardBg, marginBottom: 10 }}
                >
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: item.color + '18', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles color={item.color} size={16} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{item.label}</Text>
                    <Text style={{ fontSize: 12, color: subColor, marginTop: 2 }}>{item.sub}</Text>
                  </View>
                  <ArrowRight color={subColor} size={14} />
                </Pressable>
              ))}
            </View>
          )}

        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Crystal Picker Modal */}
      <Modal visible={pickingNode !== null} transparent animationType="slide" onRequestClose={() => setPickingNode(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: isLight ? '#F5F0FF' : '#0E0820', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 36, maxHeight: '65%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>Wybierz kryształ dla węzła {(pickingNode ?? 0) + 1}</Text>
              <Pressable onPress={() => setPickingNode(null)}><X color={subColor} size={20} /></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {CRYSTALS.map(c => (
                  <Pressable
                    key={c.id}
                    onPress={() => placeCrystal(c)}
                    style={{ width: (SW - 44 - 10 - 44) / 2, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: c.color + '40', backgroundColor: c.color + '10' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.color }} />
                      <Text style={{ fontSize: 18 }}>{c.emoji}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }} numberOfLines={1}>{c.name}</Text>
                    <Text style={{ fontSize: 11, color: subColor }}>{c.intention}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Crystal Detail Modal */}
      <Modal visible={!!detailCrystal} transparent animationType="slide" onRequestClose={() => setDetailCrystal(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: isLight ? '#F5F0FF' : '#0E0820', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 }}>
            <Pressable onPress={() => setDetailCrystal(null)} style={{ position: 'absolute', top: 18, right: 22 }}>
              <X color={subColor} size={20} />
            </Pressable>
            {detailCrystal && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: detailCrystal.color + '28', borderWidth: 2, borderColor: detailCrystal.color + '55', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 34 }}>{detailCrystal.emoji}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>{detailCrystal.name}</Text>
                    <Text style={{ fontSize: 13, color: subColor }}>{detailCrystal.chakra} · {detailCrystal.element}</Text>
                    <Text style={{ fontSize: 12, color: subColor }}>{detailCrystal.zodiac}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, lineHeight: 22, color: textColor, marginBottom: 12 }}>{detailCrystal.desc}</Text>
                <View style={{ padding: 12, borderRadius: 12, backgroundColor: detailCrystal.color + '15', borderWidth: 1, borderColor: detailCrystal.color + '30', marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: detailCrystal.color, marginBottom: 4 }}>RYTUAŁ</Text>
                  <Text style={{ fontSize: 13, lineHeight: 20, color: textColor }}>{detailCrystal.ritual}</Text>
                </View>
                <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#22C55E' + '12', borderWidth: 1, borderColor: '#22C55E' + '25', marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#22C55E', marginBottom: 4 }}>UZDRAWIANIE</Text>
                  <Text style={{ fontSize: 13, lineHeight: 20, color: textColor }}>{detailCrystal.healing}</Text>
                </View>
                <Pressable
                  onPress={() => { setDetailCrystal(null); setActiveTab('siatka'); }}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 16, backgroundColor: ACCENT + '18', borderWidth: 1, borderColor: ACCENT + '40' }}
                >
                  <Sparkles color={ACCENT} size={16} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: ACCENT }}>Dodaj do siatki</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Save Grid Modal */}
      <Modal visible={showSaveModal} transparent animationType="slide" onRequestClose={() => setShowSaveModal(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: isLight ? '#F5F0FF' : '#0E0820', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>Zapisz siatkę</Text>
              <Pressable onPress={() => setShowSaveModal(false)}><X color={subColor} size={20} /></Pressable>
            </View>
            <View style={{ padding: 14, borderRadius: 14, backgroundColor: ACCENT + '10', borderWidth: 1, borderColor: ACCENT + '28', marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>{selectedIntention || intention.slice(0, 40)}</Text>
              <Text style={{ fontSize: 12, color: subColor, marginTop: 3 }}>{selectedPattern.name} · {placedCount} kryształów</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: subColor, marginBottom: 8 }}>NOTATKA (opcjonalna)</Text>
            <TextInput
              value={journalNote}
              onChangeText={setJournalNote}
              placeholder="Jak się czujesz podczas tej siatki? Co obserwujesz?"
              placeholderTextColor={subColor}
              multiline
              style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: cardBorder, backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', color: textColor, fontSize: 13, lineHeight: 20, minHeight: 80, marginBottom: 16 }}
            />
            <Pressable
              onPress={saveGrid}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 18, backgroundColor: ACCENT }}
            >
              <BookOpen color="#FFF" size={16} strokeWidth={1.8} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF' }}>Zapisz w dzienniku</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const cg = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 12,
  },
});
