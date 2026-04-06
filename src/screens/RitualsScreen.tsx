// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight, BookOpen, Brain, Calendar, ChevronLeft, Clock, Droplets, Eye, Flame,
  Heart, History, MoonStar, RefreshCw, Shield, Sparkles, Star, Wallet, Waves,
  Wind, Zap, Check, Target, Trophy, ListChecks,
} from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
  FadeInDown, FadeInUp,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { Typography } from '../components/Typography';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { useAudioCleanup } from '../core/hooks/useAudioCleanup';
import { AiService } from '../core/services/ai.service';
import { RITUALS } from '../features/rituals/data';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#CEAE72';

// ── ANIMATED RITUAL CIRCLE HERO ──────────────────────────────
const RitualCircleHero = React.memo(({ isLight }: { isLight: boolean }) => {
  const flameScale = useSharedValue(1);
  const orbitAngle = useSharedValue(0);

  useEffect(() => {
    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 900 }),
        withTiming(0.92, { duration: 700 }),
        withTiming(1.08, { duration: 600 }),
      ),
      -1, false
    );
    orbitAngle.value = withRepeat(withTiming(360, { duration: 18000 }), -1, false);
  }, []);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitAngle.value}deg` }],
  }));

  const ORBIT_R = 72;
  const PARTICLES = 8;
  const cx = 110, cy = 110;

return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: 200, overflow: 'hidden' }}>
      <LinearGradient
        colors={isLight
          ? ['#FBF2E6', '#F5E8D0', 'transparent'] as any
          : ['#1A1008', '#110C04', 'transparent'] as any}
        style={StyleSheet.absoluteFillObject as any}
      />
      <Svg width={220} height={220} viewBox="0 0 220 220">
        <Circle cx={cx} cy={cy} r={95} stroke={ACCENT + '18'} strokeWidth={1} fill="none" />
        <Circle cx={cx} cy={cy} r={82} stroke={ACCENT + '2A'} strokeWidth={1} fill="none" />
        {[0, 45, 90, 135].map((angle) => {
          const rad = (angle * Math.PI) / 180;
return (
            <Path
              key={angle}
              d={`M ${cx + Math.cos(rad) * 55} ${cy + Math.sin(rad) * 55} L ${cx + Math.cos(rad) * 88} ${cy + Math.sin(rad) * 88}`}
              stroke={ACCENT + '33'} strokeWidth={1} strokeLinecap="round"
            />
          );
        })}
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFillObject as any, { alignItems: 'center', justifyContent: 'center' }, orbitStyle]}>
        <Svg width={220} height={220} viewBox="0 0 220 220">
          {Array.from({ length: PARTICLES }, (_, i) => {
            const rad = (i * (360 / PARTICLES) * Math.PI) / 180;
            const px = cx + ORBIT_R * Math.cos(rad);
            const py = cy + ORBIT_R * Math.sin(rad);
return (
              <Circle key={i} cx={px} cy={py} r={i % 2 === 0 ? 3 : 2}
                fill={ACCENT + (i % 2 === 0 ? 'AA' : '55')} />
            );
          })}
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute' }, flameStyle]}>
        <View style={{
          width: 64, height: 64, borderRadius: 32,
          backgroundColor: isLight ? 'rgba(206,174,114,0.18)' : 'rgba(206,174,114,0.14)',
          borderWidth: 1, borderColor: ACCENT + '40',
          alignItems: 'center', justifyContent: 'center',
          shadowColor: ACCENT, shadowOpacity: 0.5, shadowRadius: 18,
        }}>
          <Flame color={ACCENT} size={28} strokeWidth={1.4} />
        </View>
      </Animated.View>
    </View>
  );
});

// ── PROGRESS RING ──────────────────────────────────────────────
const ProgressRing = ({ progress, size = 60, strokeWidth = 6, color = ACCENT }: { progress: number; size?: number; strokeWidth?: number; color?: string }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (progress / 100) * circ;
  const ringAnim = useSharedValue(0);
  useEffect(() => {
    ringAnim.value = withTiming(dash, { duration: 1200 });
  }, [dash]);
  const animStyle = useAnimatedStyle(() => ({ opacity: 1 }));
return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color + '22'} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// ── CATEGORY DATA ─────────────────────────────────────────────
export const CATEGORY_TILES = [
  { id: 'Cleansing',      label: 'Oczyszczanie',   emoji: '🌊', icon: Droplets,  color: '#63D0B3' },
  { id: 'Protection',     label: 'Ochrona',        emoji: '🛡️', icon: Shield,    color: '#76C7FF' },
  { id: 'Love',           label: 'Miłość',         emoji: '💖', icon: Heart,     color: '#F48DB0' },
  { id: 'Manifestation',  label: 'Manifestacja',   emoji: '✨', icon: Sparkles,  color: '#D9B56D' },
  { id: 'Abundance',      label: 'Obfitość',       emoji: '🌿', icon: Wallet,    color: '#F0A94A' },
  { id: 'Healing',        label: 'Uzdrowienie',    emoji: '🌸', icon: Flame,     color: '#FB923C' },
  { id: 'Moon',           label: 'Księżyc',        emoji: '🌙', icon: MoonStar,  color: ACCENT   },
  { id: 'Transformation', label: 'Transformacja',  emoji: '💫', icon: RefreshCw, color: '#C084FC' },
  { id: 'Vision',         label: 'Wizja',          emoji: '👁️', icon: Eye,       color: '#67E8F9' },
  { id: 'NewBeginning',   label: 'Nowy Początek',  emoji: '🌅', icon: Sparkles,  color: '#86EFAC' },
];

// ── INTENTION CATEGORIES for library filter ───────────────────
const INTENTION_CATS = [
  { id: 'all',            label: 'Wszystkie',      color: ACCENT },
  { id: 'Protection',     label: 'Ochrona',        color: '#76C7FF' },
  { id: 'Abundance',      label: 'Obfitość',       color: '#F0A94A' },
  { id: 'Healing',        label: 'Uzdrowienie',    color: '#FB923C' },
  { id: 'Transformation', label: 'Transformacja',  color: '#C084FC' },
  { id: 'seasonal',       label: 'Sezonowe',       color: '#86EFAC' },
  { id: 'daily',          label: 'Codzienne',      color: '#67E8F9' },
  { id: 'Cleansing',      label: 'Oczyszczanie',   color: '#63D0B3' },
  { id: 'Manifestation',  label: 'Manifestacja',   color: '#D9B56D' },
  { id: 'Love',           label: 'Miłość',         color: '#F48DB0' },
  { id: 'Moon',           label: 'Księżyc',        color: '#C084FC' },
];

// ── MOON PHASE calculation ─────────────────────────────────────
const getMoonPhase = (): { name: string; emoji: string; energy: string; color: string } => {
  const d = new Date();
  const julian = 367 * d.getFullYear()
    - Math.floor(7 * (d.getFullYear() + Math.floor((d.getMonth() + 10) / 12)) / 4)
    + Math.floor(275 * (d.getMonth() + 1) / 9)
    + d.getDate() + 1721013.5
    + d.getHours() / 24;
  const synodic = 29.53058770576;
  const knownNewMoon = 2451550.1;
  const age = ((julian - knownNewMoon) % synodic + synodic) % synodic;
  if (age < 1.85)  return { name: 'Nów',             emoji: '🌑', energy: 'Intencja i zasiew',       color: '#6B7280' };
  if (age < 7.38)  return { name: 'Sierp rosnący',   emoji: '🌒', energy: 'Wzrost i działanie',      color: '#93C5FD' };
  if (age < 11.08) return { name: 'Pierwsza kwadra', emoji: '🌓', energy: 'Decyzja i siła woli',     color: '#FCD34D' };
  if (age < 14.77) return { name: 'Gibbous rosnący', emoji: '🌔', energy: 'Kulminacja i skupienie',  color: '#F9A8D4' };
  if (age < 16.61) return { name: 'Pełnia',          emoji: '🌕', energy: 'Manifestacja i wdzięczność', color: ACCENT };
  if (age < 22.15) return { name: 'Gibbous malejący',emoji: '🌖', energy: 'Ocena i wyciszenie',      color: '#D4B896' };
  if (age < 25.84) return { name: 'Ostatnia kwadra', emoji: '🌗', energy: 'Puszczanie i integracja', color: '#A78BFA' };
  return                  { name: 'Sierp malejący',  emoji: '🌘', energy: 'Oczyszczenie i odpoczynek',color: '#67E8F9' };
};

// ── TODAY'S RECOMMENDATION ────────────────────────────────────
const DAY_RITUALS: Record<number, { title: string; reason: string; emoji: string; color: string; category: string; duration: string; ritualId: string }> = {
  0: { title: 'Rytuał odnowy i oddechu',        reason: 'Niedziela to dzień Słońca — czas powrotu do siebie, świadomego oddechu i regeneracji duszy przed nowym tygodniem.',     emoji: '☀️', color: '#FCD34D', category: 'Healing',        duration: '18 min', ritualId: 'r1'  },
  1: { title: 'Rytuał intencji tygodnia',        reason: 'Poniedziałek to dzień Księżyca — idealny czas na zasiew intencji i ustawienie energetycznego kierunku całego tygodnia.', emoji: '🌙', color: ACCENT,    category: 'Moon',           duration: '20 min', ritualId: 'r3'  },
  2: { title: 'Rytuał mocy i odwagi',            reason: 'Wtorek to dzień Marsa — energia napędowa, zdolność działania i gotowość do przekroczenia własnych granic.',              emoji: '🔥', color: '#FB923C', category: 'Transformation', duration: '15 min', ritualId: 'r4'  },
  3: { title: 'Rytuał oczyszczenia energetycznego', reason: 'Środa to dzień Merkurego — komunikacja, myśl i mentalne oczyszczenie. Idealna pora na usunięcie blokad umysłowych.',  emoji: '💨', color: '#67E8F9', category: 'Cleansing',     duration: '12 min', ritualId: 'r1'  },
  4: { title: 'Rytuał obfitości i manifestacji', reason: 'Czwartek to dzień Jowisza — planeta rozszerzania, dobrobytu i błogosławieństwa. Wzmacniaj intencje materialnego spełnienia.',emoji: '🌿', color: '#F0A94A', category: 'Abundance', duration: '22 min', ritualId: 'r5'  },
  5: { title: 'Rytuał serca i miłości',          reason: 'Piątek to dzień Wenus — miłość, piękno i relacje. Przywróć kontakt z sercem i tym, co pragniesz притягnąć w swoim życiu.',emoji: '💖', color: '#F48DB0', category: 'Love',      duration: '18 min', ritualId: 'r2'  },
  6: { title: 'Rytuał ochrony i uziemienia',     reason: 'Sobota to dzień Saturna — solidność, granice i ochrona. Zbuduj energetyczny mur spokojnie i świadomie.',                emoji: '🛡️', color: '#76C7FF', category: 'Protection',  duration: '16 min', ritualId: 'r8'  },
};

const getTodayRecommendation = () => {
  const dow = new Date().getDay();
  return DAY_RITUALS[dow];
};

// ── SEASONAL RITUALS ──────────────────────────────────────────
const getSeasonName = (): 'wiosna' | 'lato' | 'jesień' | 'zima' => {
  const m = new Date().getMonth(); // 0-11
  if (m >= 2 && m <= 4) return 'wiosna';
  if (m >= 5 && m <= 7) return 'lato';
  if (m >= 8 && m <= 10) return 'jesień';
  return 'zima';
};

const SEASONAL_RITUALS: Record<'wiosna' | 'lato' | 'jesień' | 'zima', {
  label: string; emoji: string; color: string; desc: string; gradStart: string;
  items: { title: string; desc: string; duration: string; moonPhase: string; difficulty: string; ingredients: string[] }[]
}> = {
  wiosna: {
    label: 'Rytuały Wiosny', emoji: '🌸', color: '#86EFAC', gradStart: '#86EFAC',
    desc: 'Wiosna to czas przebudzenia — kiedy ziemia otrzepuje się z zimowego snu, nasze ciało i dusza podążają za tym samym rytmem. Te rytuały towarzyszą procesowi odrodzenia.',
    items: [
      { title: 'Rytuał nowego początku', desc: 'Ceremonial zasiewu nowej intencji pod rosnącym Księżycem — wypisz to, co chcesz zrodzić z tej zimy, złóż papier i zakop go symbolicznie lub połóż pod kryształem.', duration: '20 min', moonPhase: 'Nów / Sierp rosnący', difficulty: '⭐⭐', ingredients: ['Kartka i długopis', 'Zielona świeca', 'Ziemia lub doniczka', 'Kryształ (awenturyn lub malachit)'] },
      { title: 'Oczyszczenie wiosennych progów', desc: 'Przejdź przez każdy pokój z otwartymi oknami, szałwią lub palo santo, wyobrażając sobie, jak zimowe stagnacje ulatują razem z dymem do wiosennego światła.', duration: '15 min', moonPhase: 'Każda faza', difficulty: '⭐', ingredients: ['Szałwia biała lub palo santo', 'Miska z solą', 'Woda różana w sprayu'] },
      { title: 'Aktywacja słoneczna — powrót blasku', desc: 'Stań w porannym słońcu, wyciągnij ramiona i poczuj, jak każdy promień ładuje Twoje pleksy energetyczne. Powtórz trzy afirmacje mocy na głos — niech je usłyszy ziemia.', duration: '10 min', moonPhase: 'Pełnia / Gibbous rosnący', difficulty: '⭐', ingredients: ['Czas na świeżym powietrzu', 'Cytrus lub olejek bergamoty'] },
    ],
  },
  lato: {
    label: 'Rytuały Lata', emoji: '☀️', color: '#FCD34D', gradStart: '#FCD34D',
    desc: 'Lato to szczyt ekspresji — słońce stoi wysoko, a energia jest na szczycie. Rytuały letnie wzmacniają manifestację, pewność siebie i pełne użycie swoich darów.',
    items: [
      { title: 'Rytuał solstycjum — szczytu mocy', desc: 'W najdłuższy dzień roku zbierz w garść to, co osiągnęłaś, i świadomie otwórz się na drugą połowę roku. Rozpal ogień i wrzuć do niego kartkę ze starym lękiem.', duration: '30 min', moonPhase: 'Pełnia', difficulty: '⭐⭐⭐', ingredients: ['Ognisko lub bezpieczna misa ognia', 'Kartka ze starym lękiem', 'Złota lub żółta świeca', 'Liść laurowy'] },
      { title: 'Kąpiel słoneczna z intencją', desc: 'Zanurz się w wodzie (morze, jezioro, prysznic) z intencją: niech woda zmyje wszystko, co nie jest już potrzebne, a słońce napełni to miejsce nową energią życiową.', duration: '18 min', moonPhase: 'Sierp rosnący / Pełnia', difficulty: '⭐', ingredients: ['Naturalna woda', 'Sól morska', 'Olejek cytrynowy', 'Kryształ cytryn'] },
      { title: 'Manifestacja w letnim ogniu', desc: 'Napisz 5 intencji na papierze, który trzymasz pod słońcem przez 11 minut, wizualizując, jak każda z nich staje się rzeczywistością pełną barw i szczegółów.', duration: '22 min', moonPhase: 'Gibbous rosnący / Pełnia', difficulty: '⭐⭐', ingredients: ['5 kartek', 'Słoneczny kryształ', 'Złota lub pomarańczowa świeca'] },
    ],
  },
  jesień: {
    label: 'Rytuały Jesieni', emoji: '🍂', color: '#F0A94A', gradStart: '#F0A94A',
    desc: 'Jesień uczy nas największej mądrości: zwalniania, oddawania i odchodzenia z gracją. Rytuały jesienne pomagają zintegrować to, co minęło, i przygotować przestrzeń na nowe.',
    items: [
      { title: 'Rytuał zwalniania i wdzięczności', desc: 'Zbierz liście z ziemi — każdy jeden symbolizuje coś, co minęło, ale dało Ci dar. Nałóż na nie swoje intencje wdzięczności i złóż je pod drzewem jako ofiarę ziemi.', duration: '25 min', moonPhase: 'Ostatnia kwadra / Sierp malejący', difficulty: '⭐⭐', ingredients: ['7 liści z drzewa', 'Czarna lub brązowa świeca', 'Dziennik'] },
      { title: 'Ceremonial pożegnania starego cyklu', desc: 'Napisz listę tego, co chcesz zostawić za sobą tej jesieni — wzorce, przekonania, relacje, wersje siebie. Spalisz listę lub zakopasz ją w ziemi jako akt świadomego zamknięcia.', duration: '20 min', moonPhase: 'Nów / Ostatnia kwadra', difficulty: '⭐⭐', ingredients: ['Kartka z listą', 'Czarna lub szara świeca', 'Misa ognioodporna', 'Marka soli ochronnej'] },
      { title: 'Rytuał ciemności — wejście w głąb', desc: 'Usiądź w ciemnym pokoju przy jednej świecy. Pozwól sobie poczuć wszystko, czego zwykle unikasz. Cień nie jest wrogiem — jest skarbnicą Twojej mocy.', duration: '30 min', moonPhase: 'Sierp malejący / Nów', difficulty: '⭐⭐⭐', ingredients: ['Jedna czarna lub fioletowa świeca', 'Dziennik', 'Kryształ obsydian lub czarny turmalin'] },
    ],
  },
  zima: {
    label: 'Rytuały Zimy', emoji: '❄️', color: '#93C5FD', gradStart: '#93C5FD',
    desc: 'Zima to czas świętej ciemności i wewnętrznej alchemii. Kiedy wszystko zastyga na zewnątrz, wewnątrz trwa największa przemiana. Te rytuały towarzyszą procesowi głębokiego uzdrowienia.',
    items: [
      { title: 'Rytuał zimowego solstycjum', desc: 'W najkrótszy dzień roku, gdy ciemność osiąga kulminację, zapal świecę i siedź z nią w ciszy. Noc solstycjum to moment, gdy światło rodzi się z ciemności — świadkuj tej przemianie w sobie.', duration: '35 min', moonPhase: 'Każda faza', difficulty: '⭐⭐⭐', ingredients: ['Biała lub złota świeca', 'Kadzidło jodłowe lub żywica', 'Kryształ kwarcu górskiego'] },
      { title: 'Kąpiel oczyszczająca z solą i rozmarynem', desc: 'Gorąca kąpiel z gruboziarnistą solą, rozmarynem i olejkiem eukaliptusowym — zimowe uzdrowienie ciała i energii. Pozwól, by woda zabrała ciężar tego, co niepotrzebne.', duration: '20 min', moonPhase: 'Sierp rosnący / Pierwsza kwadra', difficulty: '⭐', ingredients: ['Gruba sól morska', 'Gałązki rozmarynu', 'Olejek eukaliptusowy', 'Biała świeca'] },
      { title: 'Rytuał marzenia i wizji przyszłości', desc: 'Stwórz tablicę wizji lub napisz szczegółowy list do siebie z przyszłości — kim jesteś, jak żyjesz, co czujesz. Zima to czas zasiewu, który zakiełkuje wiosną.', duration: '40 min', moonPhase: 'Nów / Sierp rosnący', difficulty: '⭐⭐', ingredients: ['Dziennik lub tablica', 'Złota lub biała świeca', 'Herbata ziołowa (szałwia, tymianek)', 'Obrazy lub słowa wycinane z magazynów'] },
    ],
  },
};

// ── COMMUNITY FAVORITES ───────────────────────────────────────
const COMMUNITY_FAVORITES = [
  {
    id: 'cf1', rank: 1,
    title: 'Wielkie Oczyszczenie Energetyczne',
    desc: 'Najbardziej ulubiony rytuał w Aethera — kompleksowe oczyszczenie przestrzeni i aury, które łączy dym, wodę i intencję w jednej ceremonii.',
    emoji: '🌊', color: '#63D0B3', duration: '20 min', category: 'Cleansing',
    rating: 4.9, completions: 2841, difficulty: '⭐⭐',
    moonPhase: 'Pełnia / Nów',
    ritualId: 'r1',
  },
  {
    id: 'cf2', rank: 2,
    title: 'Rytuał Manifestacji Pełni Księżyca',
    desc: 'Ceremonia pisania intencji pod światłem pełni — tysiące użytkowniczek potwierdziło jego moc w przyciąganiu głębokich pragnień.',
    emoji: '🌕', color: ACCENT, duration: '30 min', category: 'Moon',
    rating: 4.8, completions: 2314, difficulty: '⭐⭐',
    moonPhase: 'Pełnia',
    ritualId: 'r3',
  },
  {
    id: 'cf3', rank: 3,
    title: 'Ochrona Energetyczna — Tarcza Duszy',
    desc: 'Trójwarstwowy rytuał ochronny, który buduje niewidzialne pole bezpieczeństwa przez oddech, wizualizację i intencję.',
    emoji: '🛡️', color: '#76C7FF', duration: '15 min', category: 'Protection',
    rating: 4.7, completions: 1987, difficulty: '⭐⭐',
    moonPhase: 'Każda faza',
    ritualId: 'r8',
  },
  {
    id: 'cf4', rank: 4,
    title: 'Rytuał Obfitości i Przyciągania Dobrobytu',
    desc: 'Siedmiokrokowy rytuał Jowiszowy, który otwiera kanały przepływu i usuwa blokady energetyczne związane z pieniędzmi i spełnieniem.',
    emoji: '🌿', color: '#F0A94A', duration: '22 min', category: 'Abundance',
    rating: 4.7, completions: 1754, difficulty: '⭐⭐',
    moonPhase: 'Gibbous rosnący / Pełnia',
    ritualId: 'r5',
  },
  {
    id: 'cf5', rank: 5,
    title: 'Ceremonial Transformacji Cienia',
    desc: 'Głęboka praca Jungowska — konfrontacja i integracja ciemnych aspektów siebie. Uwalniający rytuał, który zamienia zranienia w moc.',
    emoji: '🌑', color: '#C084FC', duration: '35 min', category: 'Transformation',
    rating: 4.6, completions: 1423, difficulty: '⭐⭐⭐',
    moonPhase: 'Sierp malejący / Nów',
    ritualId: 'r6',
  },
];

// ── RITUAL PLANNER — 7-day suggested sequence ─────────────────
const PLANNER_SEQUENCE = [
  { day: 'Nd', title: 'Odpoczynek i regeneracja',       emoji: '☀️', color: '#FCD34D', duration: '15 min', category: 'Healing'        },
  { day: 'Pn', title: 'Intencja tygodnia',              emoji: '🌙', color: ACCENT,    duration: '20 min', category: 'Moon'           },
  { day: 'Wt', title: 'Aktywacja mocy i odwagi',        emoji: '🔥', color: '#FB923C', duration: '15 min', category: 'Transformation' },
  { day: 'Śr', title: 'Oczyszczenie mentalne',          emoji: '💨', color: '#67E8F9', duration: '12 min', category: 'Cleansing'      },
  { day: 'Cz', title: 'Rytuał obfitości',               emoji: '🌿', color: '#F0A94A', duration: '22 min', category: 'Abundance'      },
  { day: 'Pt', title: 'Miłość i wdzięczność',           emoji: '💖', color: '#F48DB0', duration: '18 min', category: 'Love'           },
  { day: 'Sb', title: 'Ochrona i uziemienie',           emoji: '🛡️', color: '#76C7FF', duration: '16 min', category: 'Protection'    },
];

// ── RYTUAŁ TYGODNIA ───────────────────────────────────────────
const WEEKLY_RITUALS = [
  { title: 'Wielkie Oczyszczenie Tygodnia', emoji: '🌊', desc: 'Głęboki rytuał uwalniający stare wzorce i oczyszczający przestrzeń energetyczną. Idealna ceremonia na początek nowego cyklu — z wodą, dymem i intencją oddania ziemi tego, co już swoje zrobiło.', color: '#63D0B3', duration: '20 min', category: 'Cleansing' },
  { title: 'Manifestacja Pełni Księżyca', emoji: '🌕', desc: 'Rytuał pisania intencji pod pełnią, amplifikowany srebrzystym światłem księżyca. Każda napisana intencja staje się kodem wysłanym do pola, które odpowiada na rezonans, nie na prośbę.', color: ACCENT, duration: '30 min', category: 'Moon' },
  { title: 'Ochrona Energetyczna Tygodnia', emoji: '🛡️', desc: 'Zbuduj niewidzialne pole ochronne wokół swojej aury przez trzy warstwy: oddech, intencję i wizualizację. Rytuał szczególnie polecany po trudnych spotkaniach lub pracy z energiami cudzymi.', color: '#76C7FF', duration: '15 min', category: 'Protection' },
  { title: 'Rytuał Serca i Miłości Własnej', emoji: '💗', desc: 'Ceremonialny powrót do samej siebie — przez różowy kwarc, różaną wodę i trzy litery do wewnętrznego dziecka. Miłość własna nie jest egoizmem; to fundamentalna siła, z której wszystko inne może rosnąć.', color: '#F48DB0', duration: '25 min', category: 'Love' },
  { title: 'Uzdrowienie przez Dźwięk', emoji: '🔔', desc: 'Rytuał z użyciem mis tybetańskich lub kąpieli dźwiękowej — każda fala wnika głębiej niż każda myśl. Daj ciału szansę zapamiętać, jak to jest wibrować w harmonii, a nie w obronie.', color: '#FB923C', duration: '18 min', category: 'Healing' },
  { title: 'Transformacja Cienia', emoji: '🌑', desc: 'Głęboka praca z ciemnymi aspektami siebie — nie po to, by je naprawić, lecz by je zintegrować. To, co tłumisz, rządzi tobą. To, co akceptujesz, staje się źródłem mocy.', color: '#C084FC', duration: '35 min', category: 'Transformation' },
  { title: 'Rytuał Nowego Początku', emoji: '🌅', desc: 'Ceremonial powitania nowego rozdziału: spalenie starego, zasadzenie nowej intencji, symboliczne przekroczenie progu. Każdy koniec jest zaproszeniem, nie wyrokiem.', color: '#86EFAC', duration: '22 min', category: 'NewBeginning' },
];

const getWeeklyRitual = () => {
  const d = new Date();
  const weekNum = Math.floor((d.getFullYear() * 365 + d.getMonth() * 31 + d.getDate()) / 7);
  return WEEKLY_RITUALS[weekNum % WEEKLY_RITUALS.length];
};

// ── SZYBKIE RYTUAŁY 3 MIN ─────────────────────────────────────
const QUICK_3MIN_RITUALS = [
  {
    id: 'q3m1',
    title: '🌬️ Oddech Oczyszczający',
    duration: '3 min',
    steps: ['Usiądź prosto i zamknij oczy', 'Wdech nosem 4 sekundy — poczuj, jak brzuch się unosi', 'Zatrzymaj na 4 sekundy', 'Wydech ustami 8 sekund — wyobraź sobie, że uwalniasz szary dym', 'Powtórz 6 razy z intencją: "Puszczam wszystko, co nie moje"'],
    color: '#67E8F9',
    route: 'Breathwork',
    icon: Wind,
  },
  {
    id: 'q3m2',
    title: '✨ Intencja Chwili',
    duration: '3 min',
    steps: ['Połóż dłonie na sercu i weź jeden głęboki oddech', 'Zapytaj siebie: "Co chcę stworzyć teraz?"', 'Sformułuj jedno zdanie — jasno i w czasie teraźniejszym', 'Powtórz je trzy razy na głos', 'Poczuj to zdanie w ciele, nie tylko w głowie'],
    color: '#D9B56D',
    route: 'Rituals',
    icon: Sparkles,
  },
  {
    id: 'q3m3',
    title: '💛 Trzy Dary Dnia',
    duration: '3 min',
    steps: ['Zamknij oczy i weź trzy oddechy', 'Przypomnij sobie jedną małą rzecz, za którą jesteś wdzięczna', 'Dodaj drugą — coś z ciała: ruch, ciepło, zdrowie', 'Dodaj trzecią — kogoś lub chwilę połączenia', 'Zostań z tym uczuciem przez 30 sekund'],
    color: '#F48DB0',
    route: 'Gratitude',
    icon: Heart,
  },
];

// ── RYTUAŁ NA DZIŚ (rotating daily tip) ──────────────────────
const DAILY_RITUAL_TIPS = [
  { title: 'Oczyszczenie dymem', desc: 'Przeprowadź dom przez dym szałwii lub palo santo, zaczynając od narożników — tam zbiera się stagnująca energia. Visualizuj, jak gęsty, ciemny powłok unosi się i znika razem z dymem, zostawiając przestrzeń świeżą i otwartą.', emoji: '🌿', color: '#86EFAC' },
  { title: 'Rytuał świtu', desc: 'Zanim dotkniesz telefonu, stań boso na podłodze i weź trzy głębokie oddechy z intencją ustawioną na ten dzień. Pierwsze dziesięć minut po przebudzeniu to bramka — to, co przez nią przepuścisz, zabarwia cały dzień.', emoji: '🌅', color: '#FCD34D' },
  { title: 'Zapis intencji', desc: 'Napisz jedną intencję na dziś piórem lub ołówkiem — nie na klawiaturze, bo ręka łączy umysł z sercem inaczej niż ekran. Złóż papier, umieść pod świecą lub kryształem i pozwól intencji dojrzewać przez resztę dnia.', emoji: '📜', color: ACCENT },
  { title: 'Kąpiel oczyszczająca', desc: 'Do wody kąpielowej dodaj garść soli morskiej i kilka kropelek olejku lawendowego lub różanego, wyobrażając sobie, że woda zmywa warstwy cudzych energii. Zanurz się na co najmniej siedem minut, pozwalając ciału pamiętać, jak to jest być naprawdę czystym.', emoji: '🌊', color: '#60A5FA' },
  { title: 'Rytuał wdzięczności wieczornej', desc: 'Przed snem wyrecytuj na głos trzy rzeczy, za które jesteś wdzięczna — nie listownie, lecz jako żywą modlitwę skierowaną do dnia, który właśnie mija. Serce, które idzie spać w wdzięczności, budzi się z więcej miejsca na radość.', emoji: '💛', color: '#F48DB0' },
  { title: 'Dotyk ziemi', desc: 'Stań boso na trawie, piasku lub nagiej ziemi przez co najmniej pięć minut i poczuj, jak twoje stopy oddają napięcie wprost do podłoża. Ta ziemia przyjmuje wszystko — nie zatrzymuje, tylko transformuje.', emoji: '🌱', color: '#4ADE80' },
  { title: 'Meditacja świecy', desc: 'Zapal świecę w ciemnym pomieszczeniu i przez pięć minut obserwuj wyłącznie płomień — bez oceniania myśli, które przychodzą. Płomień jest żywym mandala: zawsze nierówny, zawsze tańczący, zawsze obecny w tej jednej chwili.', emoji: '🕯️', color: '#FB923C' },
  { title: 'Rytuał kamienia intencji', desc: 'Weź do dłoni ulubiony kryształ lub zwykły kamień, ogrzej go oddechem i szepnij do niego intencję, którą chcesz wzmocnić. Noś go dziś przy sobie jako kotwicę — gdy go dotkniesz, intencja odżywa w ciele, nie tylko w głowie.', emoji: '💎', color: '#A78BFA' },
  { title: 'Ceremonialny herbał', desc: 'Przygotuj filiżankę ziołowej herbaty z pełną uwagą — dobierz zioła intuicyjnie, obserwuj parę unoszącą się z kubka i wypij w ciszy jako akt komunii z własnym ciałem. To, co pijesz z intencją, staje się lekarstwem.', emoji: '🍵', color: '#6EE7B7' },
  { title: 'Rytuał pełni', desc: 'W noc lub dzień po pełni Księżyca wynieś swoje kryształy, talizmany lub symbole na zewnątrz, by wchłonęły księżycowe światło i zostały naładowane. Pełnia nie tylko oczyszcza — ona amplifikuje to, co już w sobie nosisz.', emoji: '🌕', color: '#F9A8D4' },
  { title: 'Oddech czterech stron', desc: 'Stań twarzą na wschód, południe, zachód i północ, wykonując przy każdym kierunku trzy oddechy z intencją: wschód — nowy początek, południe — siła, zachód — puszczanie, północ — zakorzenianie. Cztery strony to kompas Twojej duszy.', emoji: '🧭', color: '#67E8F9' },
  { title: 'Rytuał głosu', desc: 'Przez trzy minuty śpiewaj, nucić lub wydawaj dźwięki bez słów — nie dla nikogo, tylko dla siebie, aby głos otworzył przestrzeń, którą milczenie czasem zatyka. Dźwięk jest energią, która zmienia wibrację ciała szybciej niż każda myśl.', emoji: '🎶', color: '#C084FC' },
];

const getDailyRitualTip = () => {
  const d = new Date();
  const idx = (d.getFullYear() * 365 + d.getMonth() * 31 + d.getDate()) % DAILY_RITUAL_TIPS.length;
  return DAILY_RITUAL_TIPS[idx];
};

// Quick 5-min rituals
const QUICK_RITUALS = [
  { id: 'q1', title: '🌬️ Oddech intencji', desc: 'Trzy głębokie oddechy z wyraźną intencją na ten moment — reset i otwarcie zarazem.', duration: '2 min', icon: Wind, color: '#67E8F9', route: 'Breathwork' as const },
  { id: 'q2', title: '🧘 Chwila ciszy', desc: 'Zatrzymanie w biegu, skanowanie ciała od stóp po koronę, powrót do centrum.', duration: '5 min', icon: Brain, color: '#C084FC', route: 'Meditation' as const },
  { id: 'q3', title: '💛 Rytuał wdzięczności', desc: 'Trzy konkretne rzeczy, za które jesteś wdzięczna — jak kotwice w falującym dniu.', duration: '4 min', icon: Heart, color: '#F48DB0', route: 'Gratitude' as const },
];

// ── DIFFICULTY STARS ──────────────────────────────────────────
const difficultyStars = (d: string) => {
  if (d === 'gentle') return '⭐';
  if (d === 'grounded') return '⭐⭐';
  return '⭐⭐⭐';
};

// ── mini calendar days ─────────────────────────────────────────
const getWeekDays = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);
    const DAY_SHORT = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
    return {
      label: DAY_SHORT[d.getDay()],
      date: d.getDate(),
      full: d.toISOString().slice(0, 10),
      isToday: d.toISOString().slice(0, 10) === today.toISOString().slice(0, 10),
    };
  });
};

export const RitualsScreen: React.FC<any> = ({ navigation }: any) => {
  const { t } = useTranslation();
  useAudioCleanup();
  const insets = useSafeAreaInsets();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const dailyProgress = useAppStore(s => s.dailyProgress);
  const _meditationSessions = useAppStore(s => s.meditationSessions);
  const _breathworkSessions = useAppStore(s => s.breathworkSessions);
  const {currentTheme, isLight} = useTheme();
  const theme = currentTheme;
  const meditationSessions = _meditationSessions ?? [];
  const breathworkSessions = _breathworkSessions ?? [];
  const textColor = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';
  const divColor = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';

  // Intention filter state
  const [activeIntention, setActiveIntention] = useState('all');

  // Seasonal rituals active tab
  const [activeSeason, setActiveSeason] = useState<'wiosna' | 'lato' | 'jesień' | 'zima'>(getSeasonName());

  // Favorite rituals
  const [favoriteRitualIds, setFavoriteRitualIds] = useState<string[]>([]);
  const toggleFavoriteRitual = (id: string) => {
    setFavoriteRitualIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Scheduled days for mini calendar
  const [scheduledDays, setScheduledDays] = useState<string[]>([]);
  const toggleScheduledDay = (day: string) => {
    setScheduledDays(prev => prev.includes(day) ? prev.filter(x => x !== day) : [...prev, day]);
  };

  // Quick ritual detail modal
  const [quickRitualModal, setQuickRitualModal] = useState<typeof QUICK_3MIN_RITUALS[0] | null>(null);
  const [ritualsAiInsight, setRitualsAiInsight] = useState<string>('');
  const [ritualsAiLoading, setRitualsAiLoading] = useState(false);

  // Archive count: total completed rituals across all days
  const archiveCount = useMemo(() => {
    return Object.values(dailyProgress).reduce((sum, day: any) => {
      return sum + ((day?.completedRituals as string[] | undefined)?.length ?? 0);
    }, 0) + meditationSessions.length + breathworkSessions.length;
  }, [dailyProgress, meditationSessions, breathworkSessions]);

  // This week's completed count (Mon–Sun)
  const weeklyStats = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    let weekCount = 0;
    let monthCount = 0;
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    Object.entries(dailyProgress).forEach(([dateKey, day]: [string, any]) => {
      const d = new Date(dateKey);
      const completed = (day?.completedRituals as string[] | undefined)?.length ?? 0;
      if (d >= weekStart) weekCount += completed;
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) monthCount += completed;
    });
    weekCount += meditationSessions.filter(s => {
      const d = new Date(s.date || s.startedAt);
      return d >= weekStart;
    }).length;
    monthCount += meditationSessions.filter(s => {
      const d = new Date(s.date || s.startedAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    // Streak
    let streak = 0;
    const check = new Date(today);
    for (let i = 0; i < 30; i++) {
      const key = check.toISOString().slice(0, 10);
      const day = dailyProgress[key];
      const count = (day?.completedRituals as string[] | undefined)?.length ?? 0;
      if (count > 0 || (i === 0 && weekCount > 0)) { streak++; } else { break; }
      check.setDate(check.getDate() - 1);
    }

    const goal = 5;
    return { weekCount, monthCount, streak, goal, progress: Math.min(100, (weekCount / goal) * 100) };
  }, [dailyProgress, meditationSessions, breathworkSessions]);

  // Recent 2 rituals from store (today's completed, or fallback to featured)
  const recentRituals = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const completed = (dailyProgress[today]?.completedRituals as string[] | undefined) ?? [];
    const found = completed
      .map(id => RITUALS.find(r => r.id === id))
      .filter(Boolean)
      .slice(0, 2) as typeof RITUALS;
    if (found.length > 0) return found;
    return RITUALS.slice(0, 2);
  }, [dailyProgress]);

  // Filtered rituals for library
  const filteredRituals = useMemo(() => {
    if (activeIntention === 'all') return RITUALS.slice(0, 6);
    return RITUALS.filter(r => r.category === activeIntention).slice(0, 6);
  }, [activeIntention]);

  // Favorite rituals list
  const favoriteRituals = useMemo(() => {
    return RITUALS.filter(r => favoriteRitualIds.includes(r.id));
  }, [favoriteRitualIds]);

  const weeklyRitual = useMemo(() => getWeeklyRitual(), []);
  const dailyRitualTip = useMemo(() => getDailyRitualTip(), []);
  const weekDays = useMemo(() => getWeekDays(), []);
  const tileW = (SW - layout.padding.screen * 2 - 10) / 2;

  const handleCategory = (cat: typeof CATEGORY_TILES[0]) => {
    navigation?.navigate('RitualCategorySelection', { categoryId: cat.id, categoryLabel: cat.label, categoryEmoji: cat.emoji, categoryColor: cat.color });
  };

  const fetchRitualsAi = async () => {
    setRitualsAiLoading(true);
    try {
      const prompt = "Swiatynia rytualow. Aktywna intencja: " + activeIntention + ". Rytualy w tym tygodniu: " + weeklyStats.weekCount + ". Seria: " + weeklyStats.streak + " dni. Napisz krotka (3-4 zdania) spersonalizowana inspiracje rytualowa na dzis i jedno praktyczne zalecenie jak poglebic praktyce tego tygodnia.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setRitualsAiInsight(result);
    } catch (e) {
      setRitualsAiInsight("Blad pobierania inspiracji.");
    } finally {
      setRitualsAiLoading(false);
    }
  };

return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isLight
          ? ['#FBF6EE', '#F4E8D4', theme.background] as any
          : ['#100A04', '#1A1108', theme.background] as any}
        style={StyleSheet.absoluteFillObject as any}
      />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: screenContracts.bottomInset(insets.bottom, 'airy') }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HEADER ── */}
          <View style={[styles.header, { paddingHorizontal: layout.padding.screen }]}>
            <Pressable onPress={() => navigation?.canGoBack() ? navigation.goBack() : null} style={styles.headerBtn}>
              <ChevronLeft color={ACCENT} size={22} />
            </Pressable>
            <Typography variant="premiumLabel" color={ACCENT} style={{ letterSpacing: 2.5 }}>{t('rituals.title').toUpperCase()}</Typography>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {archiveCount > 0 && (
                <Pressable onPress={() => navigation.navigate('Reports')} style={[styles.archiveBadge, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '44' }]}>
                  <History color={ACCENT} size={12} strokeWidth={2} />
                  <Typography variant="microLabel" color={ACCENT} style={{ fontSize: 10, marginLeft: 3 }}>{archiveCount}</Typography>
                </Pressable>
              )}
              <MusicToggleButton color={ACCENT} size={18} />
              <Pressable
                onPress={() => { if (isFavoriteItem('rituals')) { removeFavoriteItem('rituals'); } else { addFavoriteItem({ id: 'rituals', label: 'Rytuały', route: 'Rituals', params: {}, icon: 'Flame', color: ACCENT, addedAt: new Date().toISOString() }); } }}
                style={styles.headerBtn}
              >
                <Star color={isFavoriteItem('rituals') ? ACCENT : ACCENT + '66'} size={18} strokeWidth={1.8} fill={isFavoriteItem('rituals') ? ACCENT : 'none'} />
              </Pressable>
            </View>
          </View>

          {/* ── HERO ── */}
          <RitualCircleHero isLight={isLight} />

          {/* ── TITLES ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={[styles.titlesBlock, { paddingHorizontal: layout.padding.screen }]}>
            <Typography variant="heroTitle" style={{ color: textColor, textAlign: 'center', fontSize: 24 }}>
              Sanktuarium Rytuałów
            </Typography>
            <Typography variant="bodySmall" style={{ color: subColor, textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
              Każdy rytuał to most między intencją a rzeczywistością. Wybierz ścieżkę, która rezonuje dziś — nie jutro, nie kiedyś. Ceremonia zaczyna się w chwili decyzji.
            </Typography>
          </Animated.View>

          {/* ── RYTUAŁ TYGODNIA ── */}
          <Animated.View entering={FadeInDown.delay(120).duration(540)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: divColor }} />
              <Typography variant="microLabel" color={weeklyRitual.color} style={{ marginHorizontal: 12, letterSpacing: 2 }}>🏆 RYTUAŁ TYGODNIA</Typography>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: divColor }} />
            </View>
            <Pressable
              style={[styles.weeklyCard, { backgroundColor: cardBg, borderColor: weeklyRitual.color + '55' }]}
              onPress={() => navigation?.navigate('DailyRitualAI')}
            >
              <LinearGradient
                colors={[weeklyRitual.color + '28', weeklyRitual.color + '08']}
                style={[StyleSheet.absoluteFillObject as any, { borderRadius: 22 }]}
              />
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={[styles.weeklyEmoji, { backgroundColor: weeklyRitual.color + '28', borderColor: weeklyRitual.color + '55' }]}>
                  <Typography style={{ fontSize: 28 }}>{weeklyRitual.emoji}</Typography>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <View style={[styles.weeklyPill, { backgroundColor: weeklyRitual.color + '28' }]}>
                      <Typography variant="microLabel" color={weeklyRitual.color} style={{ fontSize: 9, letterSpacing: 1 }}>{weeklyRitual.category.toUpperCase()}</Typography>
                    </View>
                    <View style={[styles.weeklyPill, { backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }]}>
                      <Clock color={subColor} size={9} strokeWidth={2} />
                      <Typography variant="microLabel" style={{ color: subColor, fontSize: 9, marginLeft: 3 }}>{weeklyRitual.duration}</Typography>
                    </View>
                  </View>
                  <Typography variant="cardTitle" style={{ color: textColor, fontSize: 16, lineHeight: 22 }}>{weeklyRitual.title}</Typography>
                </View>
              </View>
              <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 21 }} numberOfLines={3}>{weeklyRitual.desc}</Typography>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 }}>
                <View style={[styles.weeklyStartBtn, { backgroundColor: weeklyRitual.color }]}>
                  <Typography variant="microLabel" style={{ color: '#FFF', letterSpacing: 1, fontSize: 10 }}>{t('rituals.start')}</Typography>
                </View>
                <ArrowRight color={weeklyRitual.color} size={14} strokeWidth={2} />
              </View>
            </Pressable>
          </Animated.View>

          {/* ── MÓJ POSTĘP ── */}
          <Animated.View entering={FadeInDown.delay(140).duration(520)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: divColor }} />
              <Typography variant="microLabel" color="#34D399" style={{ marginHorizontal: 12, letterSpacing: 2 }}>📊 MÓJ POSTĘP</Typography>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: divColor }} />
            </View>
            <View style={[styles.progressCard, { backgroundColor: cardBg, borderColor: '#34D399' + '33' }]}>
              <LinearGradient
                colors={['#34D399' + '14', '#34D399' + '04']}
                style={[StyleSheet.absoluteFillObject as any, { borderRadius: 20 }]}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ alignItems: 'center' }}>
                  <ProgressRing progress={weeklyStats.progress} size={72} strokeWidth={7} color="#34D399" />
                  <Typography variant="microLabel" style={{ color: '#34D399', marginTop: 4, fontSize: 9 }}>
                    {weeklyStats.weekCount}/{weeklyStats.goal}
                  </Typography>
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="cardTitle" style={{ color: textColor, fontSize: 15, marginBottom: 10 }}>Aktywność tego tygodnia</Typography>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {[
                      { label: t('common.week'), value: weeklyStats.weekCount, color: '#34D399', icon: Target },
                      { label: t('common.month'), value: weeklyStats.monthCount, color: ACCENT, icon: Trophy },
                      { label: t('common.streak'), value: `${weeklyStats.streak}d`, color: '#F472B6', icon: Flame },
                    ].map(({ label, value, color, icon: Icon }) => (
                      <View key={label} style={{ flex: 1, backgroundColor: color + '18', borderRadius: 10, padding: 8, alignItems: 'center' }}>
                        <Icon color={color} size={14} strokeWidth={1.8} />
                        <Typography style={{ fontSize: 16, fontWeight: '800', color: color, marginTop: 4 }}>{value}</Typography>
                        <Typography variant="microLabel" style={{ color: subColor, fontSize: 9, marginTop: 1 }}>{label}</Typography>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              {weeklyStats.weekCount > 0 && (
                <View style={{ marginTop: 14, padding: 10, backgroundColor: '#34D399' + '18', borderRadius: 10 }}>
                  <Typography variant="caption" style={{ color: '#34D399', textAlign: 'center', lineHeight: 18 }}>
                    Wspaniale! Wykonałaś {weeklyStats.weekCount} {weeklyStats.weekCount === 1 ? 'rytuał' : 'rytuały'} w tym tygodniu. Cel tygodniowy to {weeklyStats.goal} praktyk.
                  </Typography>
                </View>
              )}
            </View>
          </Animated.View>

          {/* ── PLANOWANIE RYTUAŁÓW (7-day mini calendar) ── */}
          <Animated.View entering={FadeInDown.delay(145).duration(510)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: divColor }} />
              <Typography variant="microLabel" color="#A78BFA" style={{ marginHorizontal: 12, letterSpacing: 2 }}>📅 PLANOWANIE RYTUAŁÓW</Typography>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: divColor }} />
            </View>
            <View style={[styles.calCard, { backgroundColor: cardBg, borderColor: '#A78BFA' + '33' }]}>
              <LinearGradient
                colors={['#A78BFA' + '12', '#A78BFA' + '04']}
                style={[StyleSheet.absoluteFillObject as any, { borderRadius: 18 }]}
              />
              <Typography variant="bodySmall" style={{ color: subColor, marginBottom: 12, lineHeight: 19 }}>
                Zaznacz dni, w których planujesz rytuał — Twój cotygodniowy harmonogram ceremonii.
              </Typography>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {weekDays.map((day) => {
                  const isScheduled = scheduledDays.includes(day.full);
                return (
                    <Pressable
                      key={day.full}
                      onPress={() => toggleScheduledDay(day.full)}
                      style={[styles.calDay, {
                        backgroundColor: isScheduled ? '#A78BFA' : day.isToday ? '#A78BFA' + '28' : cardBg,
                        borderColor: day.isToday ? '#A78BFA' : isScheduled ? '#A78BFA' : divColor,
                        borderWidth: 1,
                      }]}
                    >
                      <Typography style={{ fontSize: 9, color: isScheduled ? '#FFF' : subColor, fontWeight: '600', marginBottom: 4 }}>{day.label}</Typography>
                      <Typography style={{ fontSize: 14, fontWeight: '800', color: isScheduled ? '#FFF' : day.isToday ? '#A78BFA' : textColor }}>{day.date}</Typography>
                      {isScheduled && (
                        <View style={{ marginTop: 3 }}>
                          <Check color="#FFF" size={9} strokeWidth={3} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
              {scheduledDays.length > 0 && (
                <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#A78BFA' }} />
                  <Typography variant="caption" style={{ color: '#A78BFA', fontSize: 12 }}>
                    {scheduledDays.length} {scheduledDays.length === 1 ? 'dzień zaplanowany' : 'dni zaplanowane'} w tym tygodniu
                  </Typography>
                </View>
              )}
            </View>
          </Animated.View>

          {/* ── RYTUAŁ NA DZIŚ ── */}
          <Animated.View entering={FadeInDown.delay(150).duration(520)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 8 }}>
            <View style={[styles.ritualNaDzisCard, { backgroundColor: cardBg, borderColor: dailyRitualTip.color + '44' }]}>
              <LinearGradient
                colors={[dailyRitualTip.color + '22', dailyRitualTip.color + '06']}
                style={[StyleSheet.absoluteFillObject as any, { borderRadius: 20 }]}
              />
              <View style={styles.ritualNaDzisHeader}>
                <Typography variant="microLabel" color={dailyRitualTip.color} style={{ letterSpacing: 2 }}>🕯️ RYTUAŁ NA DZIŚ</Typography>
                <View style={[styles.ritualNaDzisEmoji, { backgroundColor: dailyRitualTip.color + '22', borderColor: dailyRitualTip.color + '44' }]}>
                  <Typography style={{ fontSize: 22 }}>{dailyRitualTip.emoji}</Typography>
                </View>
              </View>
              <Typography variant="heroTitle" style={{ color: textColor, fontSize: 20, marginBottom: 8 }}>{dailyRitualTip.title}</Typography>
              <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 22 }}>{dailyRitualTip.desc}</Typography>
            </View>
          </Animated.View>

          {/* ── RYTUAŁ DNIA (Daily AI) ── */}
          <Animated.View entering={FadeInDown.delay(160).duration(500)}>
            <View style={[styles.sectionLabelRow, { paddingHorizontal: layout.padding.screen }]}>
              <View style={[styles.sectionLine, { backgroundColor: ACCENT + '44' }]} />
              <Typography variant="microLabel" color={ACCENT} style={{ marginHorizontal: 10, letterSpacing: 2 }}>🕯️ RYTUAŁ DNIA</Typography>
              <View style={[styles.sectionLine, { backgroundColor: ACCENT + '22' }]} />
            </View>
            <Pressable
              style={[styles.dailyRow, { paddingHorizontal: layout.padding.screen, backgroundColor: cardBg, borderColor: cardBorder, marginHorizontal: layout.padding.screen, borderRadius: 18, borderWidth: 1 }]}
              onPress={() => navigation?.navigate('DailyRitualAI')}
            >
              <View style={[styles.dailyIcon, { backgroundColor: ACCENT + '1A' }]}>
                <MoonStar color={ACCENT} size={22} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Typography variant="cardTitle" style={{ color: textColor, fontSize: 15 }}>Program Tygodniowy</Typography>
                <Typography variant="caption" style={{ color: subColor, marginTop: 3 }}>Ceremonialny rytuał z AI — spersonalizowany przebieg krok po kroku.</Typography>
              </View>
              <ArrowRight color={subColor} size={16} />
            </Pressable>
          </Animated.View>

          {/* ── SZYBKIE RYTUAŁY 3 MIN ── */}
          <Animated.View entering={FadeInDown.delay(195).duration(520)}>
            <View style={[styles.sectionDivider, { backgroundColor: divColor, marginHorizontal: layout.padding.screen }]} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.padding.screen, marginBottom: 12 }}>
              <Typography variant="premiumLabel" color="#F472B6" style={[styles.gridLabel, { marginTop: 0, marginBottom: 0 }]}>
                ⚡ SZYBKIE RYTUAŁY 3 MIN
              </Typography>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 10 }}>
              {QUICK_3MIN_RITUALS.map((q, i) => {
                const Icon = q.icon;
              return (
                  <Animated.View key={q.id} entering={FadeInUp.delay(210 + i * 60).duration(420)}>
                    <Pressable
                      style={[styles.quick3Card, { backgroundColor: cardBg, borderColor: q.color + '44', width: SW * 0.52 }]}
                      onPress={() => setQuickRitualModal(q)}
                    >
                      <LinearGradient
                        colors={[q.color + '22', q.color + '06']}
                        style={[StyleSheet.absoluteFillObject as any, { borderRadius: 18 }]}
                      />
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <View style={[styles.quickIcon, { backgroundColor: q.color + '28' }]}>
                          <Icon color={q.color} size={18} strokeWidth={1.5} />
                        </View>
                        <View style={[styles.durationPill, { backgroundColor: q.color + '22', marginLeft: 8, marginTop: 0 }]}>
                          <Clock color={q.color} size={9} strokeWidth={2} />
                          <Typography variant="microLabel" style={{ color: q.color, marginLeft: 3, fontSize: 9 }}>{q.duration}</Typography>
                        </View>
                      </View>
                      <Typography variant="cardTitle" style={{ color: textColor, fontSize: 13, lineHeight: 18 }}>{q.title}</Typography>
                      <Typography variant="caption" style={{ color: subColor, marginTop: 4, fontSize: 11, lineHeight: 16 }} numberOfLines={2}>
                        {q.steps[0]}
                      </Typography>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 }}>
                        <Typography variant="microLabel" style={{ color: q.color, fontSize: 10 }}>POKAŻ KROKI</Typography>
                        <ArrowRight color={q.color} size={10} strokeWidth={2} />
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* ── SZYBKI RYTUAŁ (5-min) ── */}
          <Animated.View entering={FadeInDown.delay(220).duration(520)}>
            <View style={[styles.sectionDivider, { backgroundColor: divColor, marginHorizontal: layout.padding.screen }]} />
            <Typography variant="premiumLabel" color={ACCENT} style={[styles.gridLabel, { paddingHorizontal: layout.padding.screen }]}>
              ⚡ SZYBKI RYTUAŁ
            </Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 10 }}>
              {QUICK_RITUALS.map((q, i) => {
                const Icon = q.icon;
              return (
                  <Animated.View key={q.id} entering={FadeInUp.delay(240 + i * 60).duration(420)}>
                    <Pressable
                      style={[styles.quickCard, { backgroundColor: cardBg, borderColor: q.color + '44', width: SW * 0.44 }]}
                      onPress={() => navigation?.navigate(q.route)}
                    >
                      <LinearGradient
                        colors={[q.color + '20', q.color + '06']}
                        style={[StyleSheet.absoluteFillObject as any, { borderRadius: 18 }]}
                      />
                      <View style={[styles.quickIcon, { backgroundColor: q.color + '22' }]}>
                        <Icon color={q.color} size={20} strokeWidth={1.5} />
                      </View>
                      <Typography variant="cardTitle" style={{ color: textColor, fontSize: 13, marginTop: 10 }}>{q.title}</Typography>
                      <Typography variant="caption" style={{ color: subColor, marginTop: 3, fontSize: 11, lineHeight: 16 }}>{q.desc}</Typography>
                      <View style={[styles.durationPill, { backgroundColor: q.color + '22' }]}>
                        <Clock color={q.color} size={10} strokeWidth={2} />
                        <Typography variant="microLabel" style={{ color: q.color, marginLeft: 4, fontSize: 10 }}>{q.duration}</Typography>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* ── BIBLIOTEKA INTENCJI ── */}
          <Animated.View entering={FadeInDown.delay(255).duration(520)}>
            <View style={[styles.sectionDivider, { backgroundColor: divColor, marginHorizontal: layout.padding.screen }]} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.padding.screen, marginBottom: 10 }}>
              <Typography variant="premiumLabel" color="#67E8F9" style={[styles.gridLabel, { marginTop: 0, marginBottom: 0 }]}>
                📚 BIBLIOTEKA INTENCJI
              </Typography>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 8, marginBottom: 14 }}>
              {INTENTION_CATS.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setActiveIntention(cat.id)}
                  style={[styles.intentionChip, {
                    backgroundColor: activeIntention === cat.id ? cat.color : cat.color + '18',
                    borderColor: cat.color + (activeIntention === cat.id ? 'FF' : '44'),
                  }]}
                >
                  <Typography variant="microLabel" style={{ color: activeIntention === cat.id ? '#FFF' : cat.color, fontSize: 11 }}>{cat.label}</Typography>
                </Pressable>
              ))}
            </ScrollView>
            {filteredRituals.map((ritual, idx, arr) => {
              const meta = CATEGORY_TILES.find(c => c.id === ritual.category);
              const color = meta?.color || ACCENT;
              const Icon = meta?.icon || Flame;
              const isFav = favoriteRitualIds.includes(ritual.id);
            return (
                <Pressable
                  key={ritual.id}
                  style={[styles.libraryRow, { paddingHorizontal: layout.padding.screen, borderBottomWidth: idx < arr.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: divColor }]}
                  onPress={() => navigation?.navigate('RitualDetail', { ritualId: ritual.id })}
                >
                  <View style={[styles.toolIcon, { backgroundColor: color + '1A' }]}>
                    <Icon color={color} size={18} strokeWidth={1.7} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Typography variant="cardTitle" style={{ color: textColor, fontSize: 14 }}>{ritual.title}</Typography>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 8 }}>
                      <Typography variant="caption" style={{ color: subColor }}>{ritual.duration}</Typography>
                      <Typography variant="caption" style={{ color: subColor }}>·</Typography>
                      <Typography variant="caption" style={{ color: color, fontSize: 11 }}>{difficultyStars(ritual.difficulty)}</Typography>
                    </View>
                  </View>
                  <Pressable onPress={() => toggleFavoriteRitual(ritual.id)} hitSlop={12} style={{ padding: 4 }}>
                    <Star color={isFav ? ACCENT : subColor} size={16} strokeWidth={1.8} fill={isFav ? ACCENT : 'none'} />
                  </Pressable>
                  <ArrowRight color={subColor} size={15} style={{ marginLeft: 4 }} />
                </Pressable>
              );
            })}
          </Animated.View>

          {/* ── RYTUAŁY SEZONOWE ── */}
          <Animated.View entering={FadeInDown.delay(260).duration(520)}>
            <View style={[styles.sectionDivider, { backgroundColor: divColor, marginHorizontal: layout.padding.screen }]} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingHorizontal: layout.padding.screen }}>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: divColor }} />
              <Typography variant="microLabel" color="#86EFAC" style={{ marginHorizontal: 12, letterSpacing: 2 }}>🌿 RYTUAŁY SEZONOWE</Typography>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: divColor }} />
            </View>
            {/* Season tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 8, marginBottom: 16 }}>
              {(['wiosna', 'lato', 'jesień', 'zima'] as const).map((season) => {
                const s = SEASONAL_RITUALS[season];
                const isActive = activeSeason === season;
                return (
                  <Pressable
                    key={season}
                    onPress={() => setActiveSeason(season)}
                    style={[styles.seasonTab, {
                      backgroundColor: isActive ? s.color : s.color + '18',
                      borderColor: isActive ? s.color : s.color + '44',
                    }]}
                  >
                    <Typography style={{ fontSize: 14, marginBottom: 2 }}>{s.emoji}</Typography>
                    <Typography variant="microLabel" style={{ color: isActive ? '#FFF' : s.color, fontSize: 10, letterSpacing: 0.5 }}>{s.label.split(' ')[1] || s.label}</Typography>
                  </Pressable>
                );
              })}
            </ScrollView>
            {/* Season description */}
            <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
              <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 21 }}>{SEASONAL_RITUALS[activeSeason].desc}</Typography>
            </View>
            {/* Season ritual cards */}
            <View style={{ paddingHorizontal: layout.padding.screen, gap: 12 }}>
              {SEASONAL_RITUALS[activeSeason].items.map((item, idx) => {
                const sData = SEASONAL_RITUALS[activeSeason];
                return (
                  <Animated.View key={idx} entering={FadeInDown.delay(280 + idx * 60).duration(400)}>
                    <Pressable
                      style={[styles.seasonCard, { backgroundColor: cardBg, borderColor: sData.color + '44' }]}
                      onPress={() => navigation?.navigate('DailyRitualAI')}
                    >
                      <LinearGradient
                        colors={[sData.color + '22', sData.color + '06']}
                        style={[StyleSheet.absoluteFillObject as any, { borderRadius: 18 }]}
                      />
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Typography variant="cardTitle" style={{ color: textColor, fontSize: 15, flex: 1, lineHeight: 20 }}>{item.title}</Typography>
                        <View style={[styles.durationPill, { backgroundColor: sData.color + '22', marginTop: 0, marginLeft: 8 }]}>
                          <Clock color={sData.color} size={9} strokeWidth={2} />
                          <Typography variant="microLabel" style={{ color: sData.color, marginLeft: 3, fontSize: 9 }}>{item.duration}</Typography>
                        </View>
                      </View>
                      <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 20, marginBottom: 10 }} numberOfLines={2}>{item.desc}</Typography>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        <View style={[styles.seasonInfoPill, { backgroundColor: sData.color + '18' }]}>
                          <MoonStar color={sData.color} size={9} strokeWidth={2} />
                          <Typography variant="microLabel" style={{ color: sData.color, fontSize: 9, marginLeft: 3 }}>{item.moonPhase}</Typography>
                        </View>
                        <View style={[styles.seasonInfoPill, { backgroundColor: sData.color + '18' }]}>
                          <Star color={sData.color} size={9} strokeWidth={2} />
                          <Typography variant="microLabel" style={{ color: sData.color, fontSize: 9, marginLeft: 3 }}>{item.difficulty}</Typography>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {item.ingredients.map((ing, iIdx) => (
                          <View key={iIdx} style={[styles.ingredientPill, { backgroundColor: sData.color + '14', borderColor: sData.color + '33' }]}>
                            <Typography variant="microLabel" style={{ color: sData.color, fontSize: 9 }}>{ing}</Typography>
                          </View>
                        ))}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.seasonCta, { backgroundColor: sData.color }]}>
                          <Typography variant="microLabel" style={{ color: '#FFF', letterSpacing: 1, fontSize: 10 }}>ODKRYJ</Typography>
                        </View>
                        <ArrowRight color={sData.color} size={13} strokeWidth={2} style={{ marginLeft: 8 }} />
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* ── MOJE ULUBIONE RYTUAŁY ── */}
          {favoriteRituals.length > 0 && (
            <Animated.View entering={FadeInDown.delay(265).duration(500)}>
              <View style={[styles.sectionDivider, { backgroundColor: divColor, marginHorizontal: layout.padding.screen }]} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.padding.screen, marginBottom: 10 }}>
                <Typography variant="premiumLabel" color={ACCENT} style={[styles.gridLabel, { marginTop: 0, marginBottom: 0 }]}>
                  ⭐ MOJE ULUBIONE RYTUAŁY
                </Typography>
                <Typography variant="microLabel" style={{ color: subColor, fontSize: 11 }}>{favoriteRituals.length} rytuałów</Typography>
              </View>
              {favoriteRituals.map((ritual, idx, arr) => {
                const meta = CATEGORY_TILES.find(c => c.id === ritual.category);
                const color = meta?.color || ACCENT;
                const Icon = meta?.icon || Flame;
              return (
                  <Pressable
                    key={ritual.id}
                    style={[styles.recentRow, { paddingHorizontal: layout.padding.screen, borderBottomWidth: idx < arr.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: divColor }]}
                    onPress={() => navigation?.navigate('RitualDetail', { ritualId: ritual.id })}
                  >
                    <View style={[styles.toolIcon, { backgroundColor: color + '1A' }]}>
                      <Icon color={color} size={18} strokeWidth={1.7} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Typography variant="cardTitle" style={{ color: textColor, fontSize: 14 }}>{ritual.title}</Typography>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 8 }}>
                        <Typography variant="caption" style={{ color: subColor }}>{ritual.duration}</Typography>
                        <Typography variant="caption" style={{ color: subColor }}>·</Typography>
                        <Typography variant="caption" style={{ color: color, fontSize: 11 }}>{difficultyStars(ritual.difficulty)}</Typography>
                      </View>
                    </View>
                    <Pressable onPress={() => toggleFavoriteRitual(ritual.id)} hitSlop={12} style={{ padding: 4 }}>
                      <Star color={ACCENT} size={16} strokeWidth={1.8} fill={ACCENT} />
                    </Pressable>
                    <ArrowRight color={subColor} size={15} style={{ marginLeft: 4 }} />
                  </Pressable>
                );
              })}
            </Animated.View>
          )}

          {/* ── KATEGORIE RYTUAŁÓW ── */}
          <Animated.View entering={FadeInDown.delay(300).duration(550)}>
            <View style={[styles.sectionDivider, { backgroundColor: divColor, marginHorizontal: layout.padding.screen }]} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.padding.screen, marginBottom: 12 }}>
              <Typography variant="premiumLabel" color={ACCENT} style={[styles.gridLabel, { marginTop: 0, marginBottom: 0 }]}>
                🌟 KATEGORIE RYTUAŁÓW
              </Typography>
              <Pressable onPress={() => navigation?.navigate('RitualCategorySelection', {})} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Typography variant="microLabel" color={subColor} style={{ marginRight: 4, fontSize: 11 }}>Przeglądaj wszystkie</Typography>
                <ArrowRight color={subColor} size={12} />
              </Pressable>
            </View>
            <View style={[styles.tileGrid, { paddingHorizontal: layout.padding.screen }]}>
              {CATEGORY_TILES.map((cat, i) => {
                const Icon = cat.icon;
                const count = RITUALS.filter(r => r.category === cat.id).length;
              return (
                  <Animated.View key={cat.id} entering={FadeInUp.delay(320 + i * 40).duration(400)} style={{ width: tileW }}>
                    <Pressable style={[styles.catTile, { borderColor: cat.color + (isLight ? '55' : '30') }]} onPress={() => handleCategory(cat)}>
                      <LinearGradient
                        colors={[cat.color + '28', cat.color + '08']}
                        style={[StyleSheet.absoluteFillObject as any, { borderRadius: 20 }]}
                      />
                      <Typography style={{ fontSize: 22, lineHeight: 28 }}>{cat.emoji}</Typography>
                      <View style={[styles.catTileIcon, { backgroundColor: cat.color + '22' }]}>
                        <Icon color={cat.color} size={20} strokeWidth={1.5} />
                      </View>
                      <Typography variant="cardTitle" style={{ color: textColor, fontSize: 12, marginTop: 8, textAlign: 'center' }}>{cat.label}</Typography>
                      {count > 0 && (
                        <Typography variant="microLabel" style={{ color: cat.color, fontSize: 10, marginTop: 2 }}>{count} rytuałów</Typography>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* ── NARZĘDZIA (SoundBath / Breathwork / Meditation) ── */}
          <Animated.View entering={FadeInDown.delay(460).duration(500)}>
            <View style={[styles.sectionDivider, { backgroundColor: divColor, marginHorizontal: layout.padding.screen }]} />
            <Typography variant="premiumLabel" color={ACCENT} style={[styles.gridLabel, { paddingHorizontal: layout.padding.screen }]}>
              🎵 PRZEWODNIKI I NARZĘDZIA
            </Typography>
            {[
              { label: '🌊 Kąpiel dźwiękowa', desc: 'Fale dźwięku, które przenikają ciało głębiej niż myśl — uzdrawiają przez rezonans.', icon: Waves, color: '#60A5FA', route: 'SoundBath' },
              { label: '🌬️ Ćwiczenia oddechowe', desc: 'Pranajama i precyzyjne techniki regulacji układu nerwowego na każdą porę dnia.', icon: Wind, color: '#86EFAC', route: 'Breathwork' },
              { label: '🧘 Medytacja prowadzona', desc: 'Pełne sesje z pejzażem dźwiękowym, lektorem i śladem Twojej praktyki.', icon: Brain, color: '#C084FC', route: 'Meditation' },
              { label: '📖 Biblioteka rytuałów', desc: 'Pełna kolekcja ceremonii Aethera — od oczyszczenia po manifestację.', icon: BookOpen, color: ACCENT, route: 'RitualCategorySelection' },
            ].map((item, idx, arr) => {
              const Icon = item.icon;
            return (
                <Pressable
                  key={item.label}
                  style={[
                    styles.toolRow,
                    {
                      paddingHorizontal: layout.padding.screen,
                      borderBottomWidth: idx < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                      borderBottomColor: divColor,
                    },
                  ]}
                  onPress={() => navigation?.navigate(item.route)}
                >
                  <View style={[styles.toolIcon, { backgroundColor: item.color + '1A' }]}>
                    <Icon color={item.color} size={20} strokeWidth={1.6} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Typography variant="cardTitle" style={{ color: textColor, fontSize: 15 }}>{item.label}</Typography>
                    <Typography variant="caption" style={{ color: subColor, marginTop: 3 }}>{item.desc}</Typography>
                  </View>
                  <ArrowRight color={subColor} size={16} />
                </Pressable>
              );
            })}
          </Animated.View>

          {/* ── OSTATNIO PRAKTYKOWANE ── */}
          <Animated.View entering={FadeInDown.delay(560).duration(480)}>
            <View style={[styles.sectionDivider, { backgroundColor: divColor, marginHorizontal: layout.padding.screen }]} />
            <Typography variant="premiumLabel" color={ACCENT} style={[styles.gridLabel, { paddingHorizontal: layout.padding.screen }]}>
              🔄 OSTATNIO PRAKTYKOWANE
            </Typography>
            {recentRituals.map((ritual, idx, arr) => {
              const meta = CATEGORY_TILES.find(c => c.id === ritual.category);
              const color = meta?.color || ACCENT;
              const Icon = meta?.icon || Flame;
            return (
                <Pressable
                  key={ritual.id}
                  style={[
                    styles.recentRow,
                    {
                      paddingHorizontal: layout.padding.screen,
                      borderBottomWidth: idx < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                      borderBottomColor: divColor,
                    },
                  ]}
                  onPress={() => navigation?.navigate('RitualDetail', { ritualId: ritual.id })}
                >
                  <View style={[styles.toolIcon, { backgroundColor: color + '1A' }]}>
                    <Icon color={color} size={18} strokeWidth={1.7} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Typography variant="cardTitle" style={{ color: textColor, fontSize: 14 }}>{ritual.title}</Typography>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 8 }}>
                      <Typography variant="caption" style={{ color: subColor }}>{ritual.duration}</Typography>
                      <Typography variant="caption" style={{ color: subColor }}>·</Typography>
                      <Typography variant="caption" style={{ color: color, fontSize: 11 }}>{difficultyStars(ritual.difficulty)}</Typography>
                    </View>
                  </View>
                  <ArrowRight color={subColor} size={15} />
                </Pressable>
              );
            })}
          </Animated.View>

          {/* ── FAVORYTKI SPOŁECZNOŚCI ── */}
          <Animated.View entering={FadeInDown.delay(580).duration(500)}>
            <View style={[styles.sectionDivider, { backgroundColor: divColor, marginHorizontal: layout.padding.screen }]} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: layout.padding.screen }}>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: divColor }} />
              <Typography variant="microLabel" color="#F59E0B" style={{ marginHorizontal: 12, letterSpacing: 2 }}>🏆 FAVORYTKI SPOŁECZNOŚCI</Typography>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: divColor }} />
            </View>
            <View style={{ paddingHorizontal: layout.padding.screen, gap: 12 }}>
              {COMMUNITY_FAVORITES.map((item, idx) => {
                const rankColor = item.rank === 1 ? '#F59E0B' : item.rank === 2 ? '#9CA3AF' : item.rank === 3 ? '#CD7F32' : subColor;
                const rankBg = item.rank === 1 ? '#F59E0B' : item.rank === 2 ? '#6B7280' : item.rank === 3 ? '#92400E' : cardBg;
                const cat = CATEGORY_TILES.find(c => c.id === item.category);
                const catColor = cat?.color || item.color;
                return (
                  <Animated.View key={item.id} entering={FadeInDown.delay(600 + idx * 70).duration(420)}>
                    <Pressable
                      style={[styles.cfCard, { backgroundColor: cardBg, borderColor: item.color + '44' }]}
                      onPress={() => navigation?.navigate('RitualDetail', { ritualId: item.ritualId })}
                    >
                      <LinearGradient
                        colors={[item.color + '28', item.color + '08']}
                        style={[StyleSheet.absoluteFillObject as any, { borderRadius: 20 }]}
                      />
                      {/* Rank badge + emoji row */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                        <View style={[styles.cfRankBadge, { backgroundColor: rankBg }]}>
                          <Typography style={{ fontSize: 11, fontWeight: '900', color: '#FFF' }}>#{item.rank}</Typography>
                        </View>
                        <View style={[styles.cfEmojiCircle, { backgroundColor: item.color + '28', borderColor: item.color + '55' }]}>
                          <Typography style={{ fontSize: 26 }}>{item.emoji}</Typography>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Typography variant="cardTitle" style={{ color: textColor, fontSize: 15, lineHeight: 20, marginBottom: 4 }}>{item.title}</Typography>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={[styles.cfPill, { backgroundColor: catColor + '22' }]}>
                              <Typography variant="microLabel" style={{ color: catColor, fontSize: 9 }}>{cat?.label || item.category}</Typography>
                            </View>
                            <View style={[styles.cfPill, { backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }]}>
                              <Clock color={subColor} size={9} strokeWidth={2} />
                              <Typography variant="microLabel" style={{ color: subColor, fontSize: 9, marginLeft: 3 }}>{item.duration}</Typography>
                            </View>
                          </View>
                        </View>
                      </View>
                      <Typography variant="bodySmall" style={{ color: subColor, lineHeight: 20, marginBottom: 12 }} numberOfLines={2}>{item.desc}</Typography>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Typography style={{ fontSize: 12 }}>⭐</Typography>
                            <Typography style={{ fontSize: 13, fontWeight: '700', color: '#F59E0B' }}>{item.rating}</Typography>
                          </View>
                          <Typography variant="caption" style={{ color: subColor, fontSize: 11 }}>{item.completions.toLocaleString()} praktyk</Typography>
                        </View>
                        <View style={[styles.cfStartBtn, { backgroundColor: item.color }]}>
                          <Typography variant="microLabel" style={{ color: '#FFF', letterSpacing: 1, fontSize: 10 }}>ZACZNIJ</Typography>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* ── PLAN TYGODNIA ── */}
          <Animated.View entering={FadeInDown.delay(660).duration(500)}>
            <View style={[styles.sectionDivider, { backgroundColor: divColor, marginHorizontal: layout.padding.screen }]} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: layout.padding.screen }}>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: divColor }} />
              <Typography variant="microLabel" color="#A78BFA" style={{ marginHorizontal: 12, letterSpacing: 2 }}>📅 PLAN TYGODNIA</Typography>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: divColor }} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 10, paddingBottom: 4 }}>
              {PLANNER_SEQUENCE.map((plannerDay, idx) => {
                const todayDowShort = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'][new Date().getDay()];
                const isToday = plannerDay.day === todayDowShort;
                const cat = CATEGORY_TILES.find(c => c.id === plannerDay.category);
                return (
                  <Animated.View key={plannerDay.day} entering={FadeInDown.delay(680 + idx * 50).duration(380)}>
                    <Pressable
                      style={[styles.plannerDayCard, {
                        backgroundColor: isToday ? plannerDay.color : cardBg,
                        borderColor: isToday ? plannerDay.color : plannerDay.color + '44',
                        shadowColor: isToday ? plannerDay.color : 'transparent',
                        shadowOpacity: isToday ? 0.45 : 0,
                        shadowRadius: isToday ? 12 : 0,
                        elevation: isToday ? 6 : 0,
                      }]}
                      onPress={() => {
                        if (cat) navigation?.navigate('RitualCategorySelection', {
                          categoryId: cat.id,
                          categoryLabel: cat.label,
                          categoryEmoji: cat.emoji,
                          categoryColor: cat.color,
                        });
                      }}
                    >
                      {!isToday && (
                        <LinearGradient
                          colors={[plannerDay.color + '20', plannerDay.color + '06']}
                          style={[StyleSheet.absoluteFillObject as any, { borderRadius: 18 }]}
                        />
                      )}
                      <Typography variant="microLabel" style={{ color: isToday ? '#FFF' : subColor, fontSize: 10, letterSpacing: 0.5, marginBottom: 8 }}>{plannerDay.day}</Typography>
                      <Typography style={{ fontSize: 26, marginBottom: 6 }}>{plannerDay.emoji}</Typography>
                      <Typography variant="microLabel" style={{ color: isToday ? '#FFF' : plannerDay.color, fontSize: 9, textAlign: 'center', lineHeight: 13 }} numberOfLines={2}>
                        {cat?.label || plannerDay.category}
                      </Typography>
                      <View style={[styles.plannerDurationPill, { backgroundColor: isToday ? 'rgba(255,255,255,0.25)' : plannerDay.color + '22' }]}>
                        <Clock color={isToday ? '#FFF' : plannerDay.color} size={8} strokeWidth={2} />
                        <Typography variant="microLabel" style={{ color: isToday ? '#FFF' : plannerDay.color, fontSize: 8, marginLeft: 2 }}>{plannerDay.duration}</Typography>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* ── CO DALEJ? ── */}
          <Animated.View entering={FadeInDown.delay(620).duration(500)}>
            <View style={[styles.sectionDivider, { backgroundColor: divColor, marginHorizontal: layout.padding.screen }]} />
            <Typography variant="premiumLabel" color={ACCENT} style={[styles.gridLabel, { paddingHorizontal: layout.padding.screen }]}>
              ✦ CO DALEJ?
            </Typography>
            {[
              { label: '🌬️ Ćwiczenia oddechowe', sub: 'Synchronizuj ciało z rytmem rytuału przez świadomy oddech.', icon: Wind, color: '#86EFAC', route: 'Breathwork' },
              { label: '🎵 Kąpiel dźwiękowa', sub: 'Zanurz się w falach dźwięku, które głęboko oczyszczają przestrzeń.', icon: Waves, color: '#60A5FA', route: 'SoundBath' },
              { label: '🌕 Kalendarz Księżycowy', sub: 'Sprawdź aktualną fazę Księżyca i dopasuj rytuał do cyklu.', icon: MoonStar, color: ACCENT, route: 'LunarCalendar' },
            ].map((item, idx, arr) => {
              const Icon = item.icon;
            return (
                <Pressable
                  key={item.label}
                  style={[
                    styles.toolRow,
                    {
                      paddingHorizontal: layout.padding.screen,
                      borderBottomWidth: idx < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                      borderBottomColor: divColor,
                    },
                  ]}
                  onPress={() => navigation?.navigate(item.route)}
                >
                  <View style={[styles.toolIcon, { backgroundColor: item.color + '1A' }]}>
                    <Icon color={item.color} size={20} strokeWidth={1.6} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Typography variant="cardTitle" style={{ color: textColor, fontSize: 15 }}>{item.label}</Typography>
                    <Typography variant="caption" style={{ color: subColor, marginTop: 3 }}>{item.sub}</Typography>
                  </View>
                  <ArrowRight color={subColor} size={16} />
                </Pressable>
              );
            })}
          </Animated.View>

                    <View style={{ marginHorizontal: layout.padding.screen, marginTop: 8, marginBottom: 8, borderRadius: 16, backgroundColor: "#CEAE7222", borderWidth: 1, borderColor: "#CEAE72", padding: 16 }}>
            <Text style={{ color: "#CEAE72", fontWeight: "700", fontSize: 13, letterSpacing: 1, marginBottom: 8 }}>AI INSPIRACJA RYTUALOWA</Text>
            {ritualsAiInsight ? (
              <Text style={{ color: isLight ? '#1A1208' : '#F0EBE2', fontSize: 14, lineHeight: 22 }}>{ritualsAiInsight}</Text>
            ) : null}
            <Pressable onPress={fetchRitualsAi} disabled={ritualsAiLoading} style={{ marginTop: 12, backgroundColor: "#CEAE72", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
              <Text style={{ color: "#1A1008", fontWeight: "700", fontSize: 14 }}>{ritualsAiLoading ? "Inspiruję..." : "Inspiruj"}</Text>
            </Pressable>
          </View>
<EndOfContentSpacer size="airy" />
        </ScrollView>
      </SafeAreaView>

      {/* ── QUICK 3-MIN RITUAL MODAL ── */}
      <Modal
        visible={!!quickRitualModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setQuickRitualModal(null)}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={() => setQuickRitualModal(null)}>
          <Pressable
            onPress={e => e.stopPropagation()}
            style={[styles.quickModal, { backgroundColor: isLight ? '#FBF6EE' : '#130F08', borderTopColor: (quickRitualModal?.color || ACCENT) + '55' }]}
          >
            <LinearGradient
              colors={[(quickRitualModal?.color || ACCENT) + '1A', 'transparent']}
              style={[StyleSheet.absoluteFillObject, { borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}
            />
            <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: (quickRitualModal?.color || ACCENT) + '55', alignSelf: 'center', marginBottom: 20 }} />
            {quickRitualModal && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: quickRitualModal.color + '28', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <quickRitualModal.icon color={quickRitualModal.color} size={22} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.durationPill, { backgroundColor: quickRitualModal.color + '22', marginTop: 0, marginBottom: 4, alignSelf: 'flex-start' }]}>
                      <Clock color={quickRitualModal.color} size={9} strokeWidth={2} />
                      <Typography variant="microLabel" style={{ color: quickRitualModal.color, marginLeft: 3, fontSize: 10 }}>{quickRitualModal.duration}</Typography>
                    </View>
                    <Typography variant="cardTitle" style={{ color: textColor, fontSize: 17 }}>{quickRitualModal.title}</Typography>
                  </View>
                </View>
                <Typography variant="microLabel" color={quickRitualModal.color} style={{ letterSpacing: 1.5, marginBottom: 12 }}>{t('rituals.steps').toUpperCase()}</Typography>
                {quickRitualModal.steps.map((step, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: quickRitualModal.color + '28', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: quickRitualModal.color }}>{i + 1}</Text>
                    </View>
                    <Typography variant="bodySmall" style={{ flex: 1, color: subColor, lineHeight: 21 }}>{step}</Typography>
                  </View>
                ))}
                <Pressable
                  style={[styles.quickModalCta, { backgroundColor: quickRitualModal.color }]}
                  onPress={() => { setQuickRitualModal(null); navigation?.navigate(quickRitualModal.route); }}
                >
                  <Typography variant="premiumLabel" style={{ color: '#FFF', letterSpacing: 1.5 }}>{t('rituals.start')}</Typography>
                  <ArrowRight color="#FFF" size={16} strokeWidth={2} style={{ marginLeft: 8 }} />
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 52, marginTop: 8,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  archiveBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1,
  },
  titlesBlock: { marginTop: 4, marginBottom: 20 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionLine: { flex: 1, height: 1 },
  dailyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, marginBottom: 4 },
  dailyIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  gridLabel: { marginTop: 16, marginBottom: 12, letterSpacing: 1.5 },
  sectionDivider: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  catTile: {
    height: 110, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 1, paddingVertical: 12,
  },
  catTileIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  quickCard: {
    borderRadius: 18, borderWidth: 1, overflow: 'hidden',
    padding: 14, minHeight: 130,
  },
  quick3Card: {
    borderRadius: 18, borderWidth: 1, overflow: 'hidden',
    padding: 14, minHeight: 140,
  },
  quickIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  durationPill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, marginTop: 8, alignSelf: 'flex-start',
  },
  toolRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  toolIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  libraryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  ritualNaDzisCard: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
  ritualNaDzisHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  ritualNaDzisEmoji: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  weeklyCard: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden' },
  weeklyEmoji: { width: 58, height: 58, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  weeklyPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  weeklyStartBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10, alignItems: 'center' },
  progressCard: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
  calCard: { borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden' },
  calDay: { width: (SW - layout.padding.screen * 2 - 36) / 7, aspectRatio: 0.8, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  intentionChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, borderWidth: 1 },
  quickModal: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44, borderTopWidth: 1 },
  quickModalCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 16, marginTop: 20 },
  // ── SEASONAL RITUALS ──
  seasonTab: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, alignItems: 'center', minWidth: 72 },
  seasonCard: { borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden' },
  seasonInfoPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ingredientPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  seasonCta: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  // ── COMMUNITY FAVORITES ──
  cfCard: { borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden' },
  cfRankBadge: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 10, alignSelf: 'flex-start', marginTop: 2 },
  cfEmojiCircle: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cfPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  cfStartBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, alignItems: 'center' },
  // ── PLAN TYGODNIA ──
  plannerDayCard: { width: 80, borderRadius: 18, borderWidth: 1, padding: 12, alignItems: 'center', overflow: 'hidden' },
  plannerDurationPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 8 },
});

export default RitualsScreen;
