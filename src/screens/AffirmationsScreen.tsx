// @ts-nocheck
import { SpeakButton } from '../components/SpeakButton';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform, Share, Text, Modal, TextInput, Dimensions } from 'react-native';
import { MysticalInput } from '../components/MysticalInput';
import { SupportBackground } from '../components/ThematicBackground';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, luxury, screenContracts } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { ChevronLeft, Quote, Bookmark, Heart, Sun, Shield, ArrowRight, Stars, MoonStar, Sparkles, Check, Star, Users, FlipHorizontal, Trophy, BookOpen, Brain, Lightbulb, ChevronDown, ChevronUp, Mic, MicOff, Wind, Clock, Calendar, Zap, PenLine, Globe, TrendingUp, Repeat, Play, Pause, SkipForward, Trash2 } from 'lucide-react-native';
import { getLocaleCode } from '../core/utils/localeFormat';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, withDelay, Easing,
  interpolate, useAnimatedProps, cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Polygon, Circle as SvgGemCircle, Line as SvgGemLine, Circle as SvgCircle, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { AFFIRMATIONS } from '../features/affirmations/data/affirmations';
import { SoulEngineService } from '../core/services/soulEngine.service';
import { resolveUserFacingText } from '../core/utils/contentResolver';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { navigateToDashboardSurface } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { buildAffirmationShareMessage } from '../core/utils/share';
import { AudioService } from '../core/services/audio.service';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const SW = Dimensions.get('window').width;

const ACCENT = '#F472B6';

const CATEGORIES = [
  { id: 'love',           icon: Heart,       label: 'Miłość',        color: '#F472B6', desc: 'Serce, więź, miękkość' },
  { id: 'abundance',      icon: Stars,       label: 'Obfitość',      color: '#A78BFA', desc: 'Otwarcie, przepływ' },
  { id: 'healing',        icon: Sparkles,    label: 'Uzdrowienie',   color: '#34D399', desc: 'Regeneracja, uwalnianie' },
  { id: 'transformation', icon: Zap,         label: 'Transformacja', color: '#FB923C', desc: 'Zmiana, odwaga' },
  { id: 'peace',          icon: Shield,      label: 'Ochrona',       color: '#60A5FA', desc: 'Regulacja, oddech' },
  { id: 'success',        icon: Sun,         label: 'Pewność',       color: '#FBBF24', desc: 'Fokus, sprawczość' },
  { id: 'mission',        icon: TrendingUp,  label: 'Misja',         color: '#F97316', desc: 'Cel, powołanie' },
  { id: 'gratitude',      icon: MoonStar,    label: 'Wdzięczność',   color: '#C084FC', desc: 'Docenienie, pełnia' },
] as const;

// Extended 8-category color map
const CAT_COLOR_MAP_EXTENDED: Record<string, string> = {
  love:           '#F472B6',
  abundance:      '#A78BFA',
  healing:        '#34D399',
  transformation: '#FB923C',
  peace:          '#60A5FA',
  success:        '#FBBF24',
  mission:        '#F97316',
  gratitude:      '#C084FC',
};

// ── 108 REPETITIONS DATA ────────────────────────────────────────────────────
const REP_MILESTONES = [
  { at: 27,  label: 'Ziemia — zakorzenienie' },
  { at: 54,  label: 'Woda — oczyszczenie' },
  { at: 81,  label: 'Ogień — transformacja' },
  { at: 108, label: 'Przestrzeń — wyzwolenie' },
];

// ── AFFIRMATION OF THE HOUR ─────────────────────────────────────────────────
const HOURLY_AFFIRMATIONS: Record<number, string> = {
  0:  'W tej ciszy kryje się moja siła — jestem obecna w mroku i świetle.',
  1:  'Mój oddech jest kotwicą — wracam do siebie z każdym wdechem.',
  2:  'Ciemność jest bezpieczna — wszystko we mnie odpoczywa i się regeneruje.',
  3:  'Jestem prowadzona przez coś większego niż mój lęk.',
  4:  'Nowy świt rodzi się we mnie zanim pojawi się na niebie.',
  5:  'Wstaję z siłą i wdzięcznością za nowy początek.',
  6:  'Moje intencje na ten dzień są jasne i zakorzenione.',
  7:  'Poranek otwiera przede mną nowe możliwości — witam je z otwartością.',
  8:  'Jestem skupiona, gotowa i pełna energii do działania.',
  9:  'Moje słowa i czyny są spójne z moją najgłębszą prawdą.',
  10: 'Tworzę dziś coś, co ma sens i znaczenie.',
  11: 'Zbliżam się do południa ze spokojem i świadomością.',
  12: 'W środku dnia wracam do siebie — oddechem, chwilą, obecnością.',
  13: 'Moje centrum jest stabilne niezależnie od tego, co się dzieje wokół.',
  14: 'Każda chwila jest szansą na powrót do siebie.',
  15: 'Popołudnie przynosi mi kolejną okazję do wzrostu.',
  16: 'Kończę to, co zaczęłam, z cierpliwością i konsekwencją.',
  17: 'Zmierzch przypomina mi, by oddać to, co było — bez żalu.',
  18: 'Wieczór zaprasza mnie do łagodności wobec siebie.',
  19: 'Zasługuję na odpoczynek i regenerację po tym, co dzisiaj dałam.',
  20: 'Pozwalam dniu odejść z wdzięcznością za wszystko, czego nauczył.',
  21: 'Cisza wieczoru jest miejscem, w którym słyszę swoją duszę.',
  22: 'Przygotowuję się do snu z miłością do siebie.',
  23: 'Zamykam ten dzień w pokoju — jutro przyniesie wszystko, czego potrzebuję.',
};

// ── 30-DAY CHALLENGE DATA ───────────────────────────────────────────────────
const MONTHLY_CHALLENGE_THEMES = [
  { day: 1,  theme: 'Miłość własna',       affirmation: 'Jestem godna miłości dokładnie taka, jaka jestem.' },
  { day: 2,  theme: 'Pewność siebie',      affirmation: 'Ufam swoim instynktom i decyzjom.' },
  { day: 3,  theme: 'Obfitość',            affirmation: 'Otwieram się na przepływ dobra w moim życiu.' },
  { day: 4,  theme: 'Uzdrowienie',         affirmation: 'Moje ciało i dusza są w procesie głębokiego uzdrowienia.' },
  { day: 5,  theme: 'Wdzięczność',         affirmation: 'Jestem wdzięczna za każdy oddech i każdą chwilę.' },
  { day: 6,  theme: 'Transformacja',       affirmation: 'Zmiana jest moją sojuszniczką — witam ją.' },
  { day: 7,  theme: 'Spokój',              affirmation: 'Spokój jest moim naturalnym stanem.' },
  { day: 8,  theme: 'Misja',               affirmation: 'Moje życie ma cel, który przekracza to, co widzę.' },
  { day: 9,  theme: 'Relacje',             affirmation: 'Przyciągam relacje pełne wzajemnego szacunku.' },
  { day: 10, theme: 'Odwaga',              affirmation: 'Działam mimo lęku — to jest prawdziwa odwaga.' },
  { day: 11, theme: 'Mądrość',             affirmation: 'Słucham cicho głosu swojej wewnętrznej mądrości.' },
  { day: 12, theme: 'Przepływ',            affirmation: 'Pozwalam życiu przepływać przeze mnie bez oporu.' },
  { day: 13, theme: 'Ochrona',             affirmation: 'Jestem bezpieczna, chroniona i otoczona miłością.' },
  { day: 14, theme: 'Równowaga',           affirmation: 'Znajduję równowagę między dawaniem a braniem.' },
  { day: 15, theme: 'Twórczość',           affirmation: 'Jestem kanałem dla twórczej energii wszechświata.' },
  { day: 16, theme: 'Siła',               affirmation: 'Jestem silniejsza niż wszystkie przeszkody na mojej drodze.' },
  { day: 17, theme: 'Autentyczność',       affirmation: 'Pozwalam sobie być w pełni autentyczna.' },
  { day: 18, theme: 'Wybaczenie',          affirmation: 'Wybieram wybaczenie jako akt wolności dla siebie.' },
  { day: 19, theme: 'Intuicja',            affirmation: 'Ufam swojej intuicji bardziej niż zewnętrznym opiniom.' },
  { day: 20, theme: 'Radość',              affirmation: 'Pozwalam sobie na radość bez powodu i bez winy.' },
  { day: 21, theme: 'Zdrowie',             affirmation: 'Moje ciało jest mądrym sojusznikiem — dbam o nie z miłością.' },
  { day: 22, theme: 'Obfitość II',         affirmation: 'Pieniądze i zasoby płyną do mnie naturalnie i łatwo.' },
  { day: 23, theme: 'Zakorzenienie',       affirmation: 'Jestem zakorzeniona w sobie niezależnie od okoliczności.' },
  { day: 24, theme: 'Wizja',               affirmation: 'Widzę jasno to, do czego zmierzam.' },
  { day: 25, theme: 'Połączenie',          affirmation: 'Jestem połączona ze wszystkim, co żyje.' },
  { day: 26, theme: 'Lekkość',             affirmation: 'Pozwalam sobie na lekkość i humor nawet w trudnych chwilach.' },
  { day: 27, theme: 'Zasługiwanie',        affirmation: 'Zasługuję na wszystko, o czym głęboko marzę.' },
  { day: 28, theme: 'Czas',               affirmation: 'Mam wystarczająco dużo czasu na wszystko, co ważne.' },
  { day: 29, theme: 'Granice',             affirmation: 'Moje granice są jasne, spokojne i szanowane.' },
  { day: 30, theme: 'Nowy początek',       affirmation: 'Kończę ten miesiąc gotowa na nowy, głębszy rozdział.' },
];

// ── COMMUNITY AFFIRMATIONS ──────────────────────────────────────────────────
const COMMUNITY_AFFIRMATIONS = [
  { id: 'c1', text: 'Jestem wystarczająca — zawsze, we wszystkim, w każdej chwili.', hearts: 2847, category: 'love' },
  { id: 'c2', text: 'Moje granice są moją miłością wobec siebie.', hearts: 2341, category: 'peace' },
  { id: 'c3', text: 'Pieniądze przychodzą do mnie w niespodziewany i radosny sposób.', hearts: 1983, category: 'abundance' },
  { id: 'c4', text: 'Pozwalam sobie rozkwitać w własnym tempie.', hearts: 1756, category: 'healing' },
  { id: 'c5', text: 'Każdy koniec jest bramą do nowego początku.', hearts: 1623, category: 'transformation' },
  { id: 'c6', text: 'Moje ciało jest domem, który zasługuje na miłość.', hearts: 1544, category: 'healing' },
  { id: 'c7', text: 'Robię to, czego się boję, i właśnie to mnie wzmacnia.', hearts: 1421, category: 'mission' },
  { id: 'c8', text: 'Jestem wdzięczna za lekcje ukryte w trudnościach.', hearts: 1388, category: 'gratitude' },
  { id: 'c9', text: 'Moim naturalnym stanem jest spokój, nie pośpiech.', hearts: 1267, category: 'peace' },
  { id: 'c10', text: 'Wszystko, czego szukam, już jest we mnie.', hearts: 1189, category: 'love' },
];

const FLOW_STEPS = [
  { n: '01', title: 'Uspokój', copy: 'Najpierw pozwól zdaniu wyhamować wewnętrzny pośpiech. Czytaj powoli jak wers, nie jak notatkę.' },
  { n: '02', title: 'Poczuj', copy: 'Gdzie w ciele pojawia się ulga lub opór? Opór też jest informacją — oznacza, że temat jest żywy.' },
  { n: '03', title: 'Przenieś', copy: 'Zamień afirmację w mały ruch: zapis, rozmowę, rytuał, granicę. Zdanie bez ruchu zostaje tylko brzmieniem.' },
];

const GEM_OUTER_VERTS = [
  { x: 0, y: -62 }, { x: 53.7, y: -31 }, { x: 53.7, y: 31 },
  { x: 0, y: 62 }, { x: -53.7, y: 31 }, { x: -53.7, y: -31 },
];
const GEM_SPARKLES = [
  { cx: 26.85, cy: -46.5 }, { cx: 53.7, cy: 0 }, { cx: 26.85, cy: 46.5 },
  { cx: -26.85, cy: 46.5 }, { cx: -53.7, cy: 0 }, { cx: -26.85, cy: -46.5 },
];

// Weekly mantras – week-number based (0..51)
const WEEKLY_MANTRAS = [
  'Jestem wystarczająca dokładnie taka, jaka jestem teraz.',
  'Każdy dzień przybliża mnie do mojego prawdziwego ja.',
  'Spokój jest moim naturalnym stanem — wracam do niego zawsze.',
  'Zasługuję na miłość, którą daję innym.',
  'Moje granice są wyrazem szacunku do siebie.',
  'Wdzięczność otwiera we mnie przestrzeń na więcej dobra.',
  'Zaufam procesowi, nawet jeśli nie widzę całej drogi.',
  'Każdy oddech przywraca mnie do chwili obecnej.',
  'Jestem bezpieczna, kochana i prowadzona.',
  'Moje ciało jest mądrym przewodnikiem — słucham go.',
  'Obfitość przepływa przez mnie naturalnie i łatwo.',
  'Jestem godna wszystkiego, o czym marzę.',
  'Zmiana jest częścią mojego wzrostu.',
  'Wybaczam sobie i innym — uwalniam ciężar przeszłości.',
  'Moje serce jest otwarte na piękno każdego dnia.',
  'Jestem silniejsza niż wszystko, co mnie spotkało.',
  'Tworzę życie, które rezonuje z moją duszą.',
  'W ciszy słyszę własną mądrość.',
  'Każda trudność przynosi ze sobą naukę i wzrost.',
  'Jestem centrum spokoju i jasności.',
  'Moje słowa mają moc — wybieram je świadomie.',
  'Buduję siebie z cierpliwością i miłością.',
  'Jestem zdolna do głębokiej przemiany.',
  'Mój rytm jest właściwy — nie ścigam się z nikim.',
  'Wszystko, czego potrzebuję, jest już we mnie.',
  'Reaguję z łaską, nie z reaktywnością.',
  'Moje relacje są pełne wzajemnego szacunku.',
  'Wybieram myśli, które mnie wznoszą.',
  'Jestem prowadzona przez intuicję i serce.',
  'Nowy tydzień przynosi nowe możliwości.',
  'Oddycham głęboko i wracam do siebie.',
  'Moje marzenia są warte realizacji.',
  'Ufam sobie bardziej z każdym dniem.',
  'Jestem mostem między tym, kim jestem, a tym, kim chcę być.',
  'Moje potrzeby są ważne i godne uwagi.',
  'Zapraszam spokój do każdej przestrzeni w sobie.',
  'Jestem w pełni obecna w tym momencie.',
  'Moje serce wie, czego szukam.',
  'Leczę siebie z miłością i cierpliwością.',
  'Wybieram życie w harmonii z moją naturą.',
  'Mam wszystko, czego potrzebuję, by iść dalej.',
  'Moja wrażliwość jest siłą, nie słabością.',
  'Pozwalam sobie na radość bez powodu.',
  'Jestem zakorzeniona i jednocześnie otwarta na zmiany.',
  'Każda chwila jest nowym początkiem.',
  'Moje życie jest pełne znaczenia i celu.',
  'Niosę w sobie światło, nawet w ciemności.',
  'Jestem gotowa na to, co przynosi jutro.',
  'Moje serce jest domem — zawsze mogę do niego wrócić.',
  'Kończę ten tydzień wdzięczna za wszystko, czego doświadczyłam.',
  'Jestem ciągłym cudem w procesie stawania się.',
  'Nowy rok to nowa okazja do głębszego bycia sobą.',
];

const MIRROR_STEPS = [
  { n: '01', title: 'Znajdź ciszę', desc: 'Stań przed lustrem w spokojnym miejscu. Wyłącz telefon. Daj sobie 3 minuty tylko dla siebie.' },
  { n: '02', title: 'Spojrzyj w oczy', desc: 'Patrz spokojnie w swoje oczy przez 30 sekund, zanim zaczniesz mówić. To buduje kontakt z sobą.' },
  { n: '03', title: 'Mów na głos', desc: 'Powiedz afirmację wyraźnie, patrząc w lustro. Używaj swojego imienia: "Marta, jesteś..."' },
  { n: '04', title: 'Powtórz trzykrotnie', desc: 'Trzy powtórzenia pozwalają zdaniu dotrzeć głębiej. Przy każdym powtórzeniu zwolnij trochę.' },
  { n: '05', title: 'Zatrzymaj się', desc: 'Zostań przez chwilę w ciszy z tym, co się pojawiło. Bez oceniania — tylko obecność.' },
];

const SCIENCE_FACTS = [
  {
    title: 'Neuroplastyczność',
    body: 'Regularne powtarzanie pozytywnych stwierdzeń dosłownie przebudowuje ścieżki neuronalne w mózgu. Badania pokazują, że już po 3 tygodniach codziennej praktyki mierzalne są zmiany w aktywności kory przedczołowej.',
    icon: Brain,
    color: '#A78BFA',
  },
  {
    title: 'Efekt zakotwiczenia',
    body: 'Afirmacje połączone z odczuciem w ciele (a nie tylko słowami) aktywują układ limbiczny, który odpowiada za emocje i pamięć. Dlatego ćwiczenie lustrzane jest tak skuteczne — dodaje warstwę sensoryczną.',
    icon: Sparkles,
    color: '#F472B6',
  },
  {
    title: 'Synchronizacja intencji',
    body: 'W tradycjach duchowych, od vedyjskich mantr po zachodnie praktyki wizualizacji, powtarzanie intencji głosem traktowane jest jako most między myślą a rzeczywistością. Częstotliwość głosu rezonuje z polem energetycznym ciała.',
    icon: Lightbulb,
    color: '#FBBF24',
  },
];

const CAT_COLOR_MAP: Record<string, string> = {
  love:           '#F472B6',
  peace:          '#60A5FA',
  success:        '#FBBF24',
  abundance:      '#A78BFA',
  healing:        '#34D399',
  transformation: '#FB923C',
  mission:        '#F97316',
  gratitude:      '#C084FC',
};

// ── SVG ANIMATED CIRCLE for 108 Reps ring ──────────────────────────────────
const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);

// Rep ring constants
const REP_R = 80;
const REP_CIRCUM = 2 * Math.PI * REP_R;

const CrystalGem3D = React.memo(({ accent }: { accent: string }) => {
  const rot   = useSharedValue(0);
  const glow  = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    rot.value  = withRepeat(withTiming(360, { duration: 14000, easing: Easing.linear }), -1, false);
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 2000 }), withTiming(0.3, { duration: 2000 })), -1, false);
    return () => {
      cancelAnimation(rot);
      cancelAnimation(glow);
    };
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-20, Math.min(20, e.translationY * 0.3));
      tiltY.value = Math.max(-20, Math.min(20, e.translationX * 0.3));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 800 });
      tiltY.value = withTiming(0, { duration: 800 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 500 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }],
  }));
  const spinStyle  = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot.value}deg` }] }));
  const glowStyle  = useAnimatedStyle(() => ({ opacity: 0.1 + glow.value * 0.6 }));

  useFocusEffect(useCallback(() => { return () => { void AudioService.pauseBackgroundMusic(); void AudioService.pauseAmbientSound(); }; }, []));

  return (
    <View style={{ alignItems: 'center', marginVertical: 16 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={outerStyle}>
          <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, glowStyle]}>
            <Svg width={180} height={180} viewBox="-90 -90 180 180">
              <SvgGemCircle cx={0} cy={0} r={72} fill={accent + '22'} />
            </Svg>
          </Animated.View>
          <Animated.View style={spinStyle}>
            <Svg width={180} height={180} viewBox="-90 -90 180 180">
              <Polygon
                points="0,-62 53.7,-31 53.7,31 0,62 -53.7,31 -53.7,-31"
                fill={accent + '44'} stroke={accent} strokeWidth={1.5}
              />
              <Polygon
                points="0,-38 32.9,-19 32.9,19 0,38 -32.9,19 -32.9,-19"
                fill={accent + '22'} stroke={accent + '88'} strokeWidth={1}
              />
              {GEM_OUTER_VERTS.map((v, i) => (
                <SvgGemLine key={i} x1={0} y1={0} x2={v.x} y2={v.y} stroke={accent + '55'} strokeWidth={0.8} />
              ))}
              <SvgGemCircle cx={0} cy={0} r={12} fill={accent} opacity={0.85} />
              {GEM_SPARKLES.map((d, i) => (
                <SvgGemCircle key={i} cx={d.cx} cy={d.cy} r={3} fill="#fff" opacity={0.7} />
              ))}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

// ── 108 REPS RING COMPONENT ─────────────────────────────────────────────────
const RepRing = React.memo(({ count, accent }: { count: number; accent: string }) => {
  const progress = count / 108;
  const strokeDash = useSharedValue(REP_CIRCUM);

  useEffect(() => {
    strokeDash.value = withTiming(REP_CIRCUM * (1 - progress), { duration: 300 });
  }, [progress]);

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDash.value,
  }));

  const nearMilestone = REP_MILESTONES.find(m => count === m.at);
  const nextMilestone = REP_MILESTONES.find(m => m.at > count);
  const ringColor = count >= 108 ? '#34D399' : accent;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={200} height={200} viewBox="0 0 200 200">
        <SvgCircle cx={100} cy={100} r={REP_R} fill="none" stroke={ringColor + '22'} strokeWidth={10} />
        <AnimatedSvgCircle
          cx={100} cy={100} r={REP_R}
          fill="none"
          stroke={ringColor}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={REP_CIRCUM}
          animatedProps={animProps}
          transform="rotate(-90, 100, 100)"
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 48, fontWeight: '700', color: ringColor, letterSpacing: -2 }}>{count}</Text>
        <Text style={{ fontSize: 11, color: ringColor + 'BB', letterSpacing: 2, fontWeight: '600', marginTop: -4 }}>/ 108</Text>
        {nearMilestone && (
          <Text style={{ fontSize: 10, color: ringColor, marginTop: 6, textAlign: 'center', maxWidth: 100, lineHeight: 14 }}>{nearMilestone.label}</Text>
        )}
      </View>
    </View>
  );
});

export const AffirmationsScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const favoriteAffirmations = useAppStore(s => s.favoriteAffirmations);
  const toggleFavoriteAffirmation = useAppStore(s => s.toggleFavoriteAffirmation);
  const updateDailyProgress = useAppStore(s => s.updateDailyProgress);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const customAffirmations = useAppStore(s => s.customAffirmations);
  const addCustomAffirmation = useAppStore(s => s.addCustomAffirmation);
  const deleteCustomAffirmation = useAppStore(s => s.deleteCustomAffirmation);
  const dailyProgress = useAppStore(s => s.dailyProgress);
  const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const dailyPlan = useMemo(() => SoulEngineService.generateDailyPlan(), []);
  const initialCategory = route.params?.category || dailyPlan.affirmationGuidance.featured.category;
  const ritualTitle = route.params?.ritualTitle;
  const source = route.params?.source;
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [forSomeone, setForSomeone] = useState(false);
  const [fsName, setFsName] = useState('');
  const [fsNameInput, setFsNameInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAffText, setNewAffText] = useState('');
  const [showFsModal, setShowFsModal] = useState(false);

  // Mirror exercise state
  const [mirrorChecked, setMirrorChecked] = useState<boolean[]>([false, false, false, false, false]);

  // 21-day challenge state
  const [challengeDays, setChallengeDays] = useState<boolean[]>(Array(21).fill(false));

  // Science facts expand state
  const [expandedFact, setExpandedFact] = useState<number | null>(null);

  // ── 108 REPS STATE ─────────────────────────────────────────────────────────
  const [repCount, setRepCount] = useState(0);
  const [repActive, setRepActive] = useState(false);
  const [repComplete, setRepComplete] = useState(false);
  const [repElapsed, setRepElapsed] = useState(0); // seconds
  const repTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const repCelebrateScale = useSharedValue(1);

  // ── FEATURED HERO SHIMMER ───────────────────────────────────────────────────
  const shimmerX = useSharedValue(-SW);
  useEffect(() => {
    shimmerX.value = withRepeat(
      withSequence(
        withTiming(-SW, { duration: 0 }),
        withDelay(1800, withTiming(SW * 1.5, { duration: 900, easing: Easing.out(Easing.quad) })),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(shimmerX); };
  }, []);
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  // ── VOICE GUIDE / AUDIO MODE STATE ─────────────────────────────────────────
  const [audioModeActive, setAudioModeActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale'|'hold'|'exhale'>('inhale');
  const breathCircleScale = useSharedValue(0.7);
  const breathTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── MONTHLY CHALLENGE STATE ─────────────────────────────────────────────────
  const [monthlyDays, setMonthlyDays] = useState<boolean[]>(Array(30).fill(false));
  const [showMonthlyDetail, setShowMonthlyDetail] = useState<number | null>(null);

  // ── CUSTOM AFFIRMATION JOURNAL STATE ───────────────────────────────────────
  const [journalNote, setJournalNote] = useState('');
  const [journalHistory, setJournalHistory] = useState<Array<{id:string; text:string; note:string; date:string; category:string}>>([]);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalSelectedAff, setJournalSelectedAff] = useState('');
  const [journalNoteInput, setJournalNoteInput] = useState('');

  // ── COMMUNITY HEARTS STATE ──────────────────────────────────────────────────
  const [likedCommunity, setLikedCommunity] = useState<string[]>([]);

  // History: last 7 days categories used
  const today = new Date().toISOString().split('T')[0];

  // Hourly affirmation
  const hourlyAffirmation = useMemo(() => {
    const hour = new Date().getHours();
    return HOURLY_AFFIRMATIONS[hour] || HOURLY_AFFIRMATIONS[0];
  }, []);
  const currentHour = new Date().getHours();

  // Monthly challenge progress
  const monthlyCompleted = monthlyDays.filter(Boolean).length;
  const monthlyStreak = useMemo(() => {
    let streak = 0;
    for (let i = monthlyDays.length - 1; i >= 0; i--) {
      if (monthlyDays[i]) streak++;
      else break;
    }
    return streak;
  }, [monthlyDays]);

  const catScrollRef = useRef<ScrollView>(null);
  const aiAvailable = AiService.isLaunchAvailable();
  const aiState = AiService.getLaunchAvailabilityState();

  const activeCatMeta = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];
  const catColor = activeCatMeta.color;

  const categoryAffirmations = useMemo(() => AFFIRMATIONS.filter(a => a.category === activeCategory), [activeCategory]);
  const supportingAffirmations = useMemo(() => activeCategory === dailyPlan.affirmationGuidance.featured.category ? dailyPlan.affirmationGuidance.supporting : [], [activeCategory, dailyPlan]);

  // Weekly mantra based on ISO week number
  const weeklyMantra = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return WEEKLY_MANTRAS[weekNum % WEEKLY_MANTRAS.length];
  }, []);

  // Affirmation history: last 7 days — which categories were practiced
  const affiHistory = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const prog = dailyProgress[dateStr] || {};
      return {
        date: dateStr,
        day: ['Nd','Pn','Wt','Śr','Cz','Pt','Sb'][d.getDay()],
        done: prog.affirmationRead === true,
        category: prog.affirmationCategory || null,
      };
    });
  }, [dailyProgress]);

  // Saved affirmations list from store
  const savedAffirmationsList = useMemo(
    () => AFFIRMATIONS.filter(a => favoriteAffirmations.includes(a.id)),
    [favoriteAffirmations],
  );

  // Challenge streak calc
  const challengeStreak = useMemo(() => {
    let streak = 0;
    for (let i = challengeDays.length - 1; i >= 0; i--) {
      if (challengeDays[i]) streak++;
      else break;
    }
    return streak;
  }, [challengeDays]);

  const handleSave = (id: string) => {
    void HapticsService.impact(Haptics.ImpactFeedbackStyle.Light);
    AudioService.playTouchTone('confirm');
    toggleFavoriteAffirmation(id);
    updateDailyProgress(today, { affirmationRead: true });
  };

  const handleShare = async (text: string, rationale?: string) => {
    await Share.share({ message: buildAffirmationShareMessage(text, rationale) });
  };

  const featuredSaved = favoriteAffirmations.includes(dailyPlan.affirmationGuidance.featured.id);

  const toggleMirrorStep = (idx: number) => {
    void HapticsService.selection();
    setMirrorChecked(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const toggleChallengeDay = (idx: number) => {
    void HapticsService.impact(Haptics.ImpactFeedbackStyle.Light);
    setChallengeDays(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const mirrorAllDone = mirrorChecked.every(Boolean);

  // ── 108 REPS HANDLERS ───────────────────────────────────────────────────────
  const startRepSession = () => {
    setRepActive(true);
    setRepCount(0);
    setRepComplete(false);
    setRepElapsed(0);
    repTimerRef.current = setInterval(() => setRepElapsed(prev => prev + 1), 1000);
  };

  const stopRepSession = () => {
    setRepActive(false);
    if (repTimerRef.current) clearInterval(repTimerRef.current);
  };

  const handleRep = () => {
    if (!repActive || repComplete) return;
    void HapticsService.impact(Haptics.ImpactFeedbackStyle.Medium);
    const next = repCount + 1;
    setRepCount(next);
    // Milestone haptic
    if (REP_MILESTONES.some(m => m.at === next)) {
      void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
    }
    if (next >= 108) {
      setRepComplete(true);
      setRepActive(false);
      if (repTimerRef.current) clearInterval(repTimerRef.current);
      repCelebrateScale.value = withSequence(
        withTiming(1.18, { duration: 200 }),
        withTiming(0.9,  { duration: 160 }),
        withTiming(1.05, { duration: 120 }),
        withTiming(1.0,  { duration: 100 }),
      );
      void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
    }
  };

  const resetReps = () => {
    setRepCount(0);
    setRepActive(false);
    setRepComplete(false);
    setRepElapsed(0);
    if (repTimerRef.current) clearInterval(repTimerRef.current);
  };

  const formatRepTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── VOICE/BREATH GUIDE HANDLERS ─────────────────────────────────────────────
  const startAudioMode = () => {
    setAudioModeActive(true);
    setBreathPhase('inhale');
    let tick = 0;
    // inhale 4s, hold 2s, exhale 4s = 10s cycle
    breathCircleScale.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 2000 }),
        withTiming(0.7, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, false,
    );
    breathTimerRef.current = setInterval(() => {
      tick = (tick + 1) % 3;
      setBreathPhase((['inhale','hold','exhale'] as const)[tick]);
    }, tick === 0 ? 4000 : tick === 1 ? 2000 : 4000);
  };

  const stopAudioMode = () => {
    setAudioModeActive(false);
    if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    breathCircleScale.value = withTiming(0.7, { duration: 600 });
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (repTimerRef.current) clearInterval(repTimerRef.current);
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    };
  }, []);

  const celebrateStyle = useAnimatedStyle(() => ({ transform: [{ scale: repCelebrateScale.value }] }));
  const breathCircleStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathCircleScale.value }] }));

  // ── MONTHLY CHALLENGE HANDLER ────────────────────────────────────────────────
  const toggleMonthlyDay = (idx: number) => {
    void HapticsService.impact(Haptics.ImpactFeedbackStyle.Light);
    setMonthlyDays(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  // ── AFFIRMATION JOURNAL HANDLER ──────────────────────────────────────────────
  const saveJournalEntry = () => {
    if (!journalSelectedAff.trim()) return;
    const entry = {
      id: Date.now().toString(),
      text: journalSelectedAff,
      note: journalNoteInput.trim(),
      date: today,
      category: activeCategory,
    };
    setJournalHistory(prev => [entry, ...prev]);
    setJournalNoteInput('');
    setJournalSelectedAff('');
    setShowJournalModal(false);
    void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
  };

  // ── COMMUNITY LIKE HANDLER ───────────────────────────────────────────────────
  const toggleCommunityLike = (id: string) => {
    void HapticsService.impact(Haptics.ImpactFeedbackStyle.Light);
    setLikedCommunity(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ── AI ENHANCEMENT HANDLER ───────────────────────────────────────────────────
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const enhanceWithAI = async () => {
    if (!newAffText.trim() || aiEnhancing) return;
    setAiEnhancing(true);
    try {
      const resp = await AiService.chatWithOracle([
        { role: 'user', content: `Ulepsz tę afirmację, zachowując jej rdzeń, ale czyniąc ją głębszą, bardziej poetycką i duchową. Odpowiedz tylko jednym zdaniem — samą afirmacją, bez komentarza: "${newAffText.trim()}"` },
      ]);
      if (resp) setNewAffText(resp.trim().replace(/^["']|["']$/g, ''));
    } catch {}
    setAiEnhancing(false);
  };

  return (
    <View style={[af.container, { backgroundColor: currentTheme.background }]}>
      <SupportBackground color={ACCENT} isLight={isLight} />
      <SafeAreaView edges={['top']} style={af.safe}>

        {/* HEADER */}
        <View style={af.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Home')} style={af.backBtn} hitSlop={20}>
            <ChevronLeft color={catColor} size={26} strokeWidth={1.6} />
          </Pressable>
          <View style={af.headerCenter}>
            <Typography variant="premiumLabel" color={catColor}>{t('affirmations.wsparcie', 'Wsparcie')}</Typography>
            <Typography variant="screenTitle" style={{ marginTop: 3 }}>{t('affirmations.afirmacje', 'Afirmacje')}</Typography>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Pressable onPress={() => setShowFsModal(true)} style={[af.backBtn, { alignItems: 'center', justifyContent: 'center' }]} hitSlop={12}>
              <Users color={forSomeone ? catColor : catColor + '55'} size={18} strokeWidth={1.8} fill={forSomeone ? catColor + '33' : 'none'} />
            </Pressable>
            <Pressable
              onPress={() => { void HapticsService.selection(); if (isFavoriteItem('affirmations')) { removeFavoriteItem('affirmations'); } else { addFavoriteItem({ id: 'affirmations', label: 'Afirmacje', route: 'Affirmations', params: {}, icon: 'Heart', color: catColor, addedAt: new Date().toISOString() }); } }}
              style={[af.backBtn, { alignItems: 'center', justifyContent: 'center' }]}
              hitSlop={12}
            >
              <Star color={isFavoriteItem('affirmations') ? catColor : catColor + '88'} size={18} strokeWidth={1.8} fill={isFavoriteItem('affirmations') ? catColor : 'none'} />
            </Pressable>
          </View>
        </View>

        {forSomeone && (
          <View style={[af.fsBanner, { backgroundColor: catColor + '18', borderColor: catColor + '33' }]}>
            <Users color={catColor} size={13} strokeWidth={1.8} />
            <Typography variant="microLabel" color={catColor} style={{ marginLeft: 6 }}>Afirmacje dla: {fsName}</Typography>
            <Pressable onPress={() => setForSomeone(false)} hitSlop={10} style={{ marginLeft: 'auto' }}>
              <Text style={{ color: catColor, fontSize: 14, fontWeight: '600' }}>✕</Text>
            </Pressable>
          </View>
        )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[af.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') + 8 }]} showsVerticalScrollIndicator={false}>

          {/* HERO FEATURED */}
          <Animated.View entering={FadeInDown.duration(600)}>
            <View style={[af.featuredCard, {
              borderColor: catColor + '55',
              overflow: 'hidden',
              shadowColor: catColor,
              shadowOpacity: 0.45,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 12 },
              elevation: 14,
              backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(16,10,26,0.88)',
            }]}>
              {/* Diagonal gradient background */}
              <LinearGradient
                colors={[catColor + '40', catColor + '18', 'transparent', catColor + '10'] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {/* Top highlight line */}
              <LinearGradient
                colors={['transparent', catColor + 'CC', 'transparent'] as [string,string,string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }}
                pointerEvents="none"
              />
              {/* Shimmer sweep */}
              <Animated.View
                style={[
                  { position: 'absolute', top: 0, bottom: 0, width: 80 },
                  shimmerStyle,
                ]}
                pointerEvents="none"
              >
                <LinearGradient
                  colors={['transparent', isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.12)', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
              {/* Corner bracket accents */}
              <View style={{ position: 'absolute', top: 12, right: 18, width: 10, height: 10, borderTopWidth: 2, borderRightWidth: 2, borderColor: catColor + '99' }} pointerEvents="none" />
              <View style={{ position: 'absolute', bottom: 12, left: 18, width: 10, height: 10, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: catColor + '66' }} pointerEvents="none" />

              {/* Category pill badge */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={[af.heroCatPill, { backgroundColor: catColor + '28', borderColor: catColor + '55' }]}>
                  {React.createElement(activeCatMeta.icon, { color: catColor, size: 11, strokeWidth: 2 })}
                  <Text style={{ color: catColor, fontSize: 9, fontWeight: '800', letterSpacing: 2, marginLeft: 5 }}>
                    {source === 'ritual' ? 'PO RYTUALE' : forSomeone ? `DLA: ${fsName.toUpperCase()}` : activeCatMeta.label.toUpperCase()}
                  </Text>
                </View>
                <Pressable onPress={() => handleSave(dailyPlan.affirmationGuidance.featured.id)} hitSlop={16} style={af.bookmarkBtn}>
                  <Bookmark color={featuredSaved ? catColor : currentTheme.textMuted} fill={featuredSaved ? catColor : 'transparent'} size={20} />
                </Pressable>
              </View>

              {/* Big hero affirmation text */}
              <Typography variant="editorialHeader" style={[af.featuredText, {
                fontSize: 22,
                lineHeight: 33,
                textAlign: 'center',
                color: isLight ? '#1A0E26' : '#FFE8F4',
                marginBottom: 18,
              }]}>
                {dailyPlan.affirmationGuidance.featured.text}
              </Typography>

              <Typography variant="bodySmall" style={[af.featuredRationale, { textAlign: 'center' }]}>{dailyPlan.affirmationGuidance.rationale}</Typography>

              {ritualTitle && (
                <View style={[af.handoff, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', marginTop: 16 }]}>
                  <Typography variant="microLabel" color={catColor}>{t('affirmations.handoff_z_rytualu', 'HANDOFF Z RYTUAŁU')}</Typography>
                  <Typography variant="bodySmall" style={af.handoffCopy}>Po praktyce "{ritualTitle}" zostań przy jednym zdaniu i powtórz je w ciszy trzy razy.</Typography>
                </View>
              )}

              <View style={[af.featuredMeta, { justifyContent: 'center' }]}>
                <View style={[af.metaPill, { borderColor: catColor + '44', backgroundColor: catColor + '12' }]}>
                  <Sparkles color={catColor} size={12} />
                  <Typography variant="caption" style={[af.metaText, { marginLeft: 6 }]}>{dailyPlan.affirmationGuidance.bestMoment}</Typography>
                </View>
              </View>

              <Pressable style={[af.shareRow, { justifyContent: 'center', marginTop: 14 }]} onPress={() => handleShare(dailyPlan.affirmationGuidance.featured.text, dailyPlan.affirmationGuidance.rationale)}>
                <Typography variant="microLabel" color={catColor}>{t('affirmations.udostepnij_afirmacje', 'Udostępnij afirmację')}</Typography>
                <ArrowRight color={catColor} size={13} />
              </Pressable>
            </View>
          </Animated.View>

          {/* ── MANTRA TYGODNIA ──────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).duration(600)}>
            <View style={[af.mantraCard, {
              borderColor: '#FBBF24' + '55',
              backgroundColor: isLight ? 'rgba(251,191,36,0.06)' : 'rgba(251,191,36,0.08)',
              shadowColor: '#FBBF24',
              shadowOpacity: 0.25,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }]}>
              <LinearGradient colors={['#FBBF2420', '#FBBF2408', 'transparent']} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={['transparent', '#FBBF24AA', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 }} pointerEvents="none" />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <View style={[af.mantraIconWrap, { backgroundColor: '#FBBF2420' }]}>
                  <Stars color="#FBBF24" size={18} strokeWidth={1.6} />
                </View>
                <Typography variant="premiumLabel" color="#FBBF24">{t('affirmations.mantra_tygodnia', 'MANTRA TYGODNIA')}</Typography>
              </View>
              <Typography variant="editorialHeader" style={[af.mantraText, { color: isLight ? '#2A200A' : '#FEF3C7' }]}>
                {weeklyMantra}
              </Typography>
              <View style={[af.mantraFooter, { borderTopColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(251,191,36,0.14)' }]}>
                <Sparkles color="#FBBF24" size={12} />
                <Typography variant="microLabel" color="#FBBF24" style={{ marginLeft: 6 }}>{t('affirmations.nowa_mantra_kazdego_tygodnia', 'Nowa mantra każdego tygodnia')}</Typography>
              </View>
            </View>
          </Animated.View>

          {/* CRYSTAL GEM 3D */}
          <CrystalGem3D accent={catColor} />

          {/* ── AFIRMACJA GODZINY ──────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(60).duration(600)}>
            <View style={[af.hourCard, {
              borderColor: '#C084FC44',
              backgroundColor: isLight ? 'rgba(192,132,252,0.06)' : 'rgba(192,132,252,0.08)',
              shadowColor: '#C084FC',
              shadowOpacity: 0.22,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 7,
            }]}>
              <LinearGradient colors={['#C084FC18', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={[af.hourIconWrap, { backgroundColor: '#C084FC20' }]}>
                  <Clock color="#C084FC" size={18} strokeWidth={1.6} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="premiumLabel" color="#C084FC">{t('affirmations.afirmacja_godziny', 'AFIRMACJA GODZINY')}</Typography>
                  <Typography variant="caption" style={{ opacity: 0.62, marginTop: 1 }}>Godz. {currentHour}:00 — zmienia się co godzinę</Typography>
                </View>
              </View>
              <Typography variant="editorialHeader" style={{ fontSize: 17, lineHeight: 26, fontStyle: 'italic', color: isLight ? '#2A1A40' : '#EDE9FE', marginBottom: 12 }}>
                {hourlyAffirmation}
              </Typography>
              <Pressable
                onPress={() => handleShare(hourlyAffirmation)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Typography variant="microLabel" color="#C084FC">{t('affirmations.udostepnij_te_chwile', 'Udostępnij tę chwilę')}</Typography>
                <ArrowRight color="#C084FC" size={13} />
              </Pressable>
            </View>
          </Animated.View>

          {/* CATEGORY TABS */}
          <ScrollView ref={catScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={af.catScroll} style={af.catWrap}>
            {CATEGORIES.map((cat, catIdx) => {
              const active = activeCategory === cat.id;
              const Icon = cat.icon;
              return (
                <Pressable key={cat.id} onPress={() => {
                  void HapticsService.selection(); AudioService.playTouchTone(); setActiveCategory(cat.id);
                  const chipW = 120;
                  const offset = Math.max(0, catIdx * chipW - layout.window.width / 2 + chipW / 2);
                  catScrollRef.current?.scrollTo({ x: offset, animated: true });
                }}
                  style={[af.catChip, {
                    borderColor: active ? cat.color : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)'),
                    backgroundColor: 'transparent',
                    // glow shadow for active
                    shadowColor: active ? cat.color : 'transparent',
                    shadowOpacity: active ? 0.55 : 0,
                    shadowRadius: active ? 10 : 0,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: active ? 6 : 0,
                    overflow: 'hidden',
                  }]}>
                  {/* Active gradient fill */}
                  {active && (
                    <LinearGradient
                      colors={[cat.color + '30', cat.color + '16'] as [string,string]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  {!active && (
                    <View style={[StyleSheet.absoluteFill, {
                      backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)',
                    }]} />
                  )}
                  <Icon color={active ? cat.color : currentTheme.textMuted} size={14} strokeWidth={1.8} />
                  <Typography variant="premiumLabel" color={active ? cat.color : currentTheme.textMuted} style={{ marginLeft: 8 }}>{cat.label}</Typography>
                  {active && <View style={[af.catDot, { backgroundColor: cat.color }]} />}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* FLOW */}
          <View style={[af.flowCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', borderColor: isLight ? 'rgba(139,100,42,0.45)' : 'rgba(244,114,182,0.14)' }]}>
            <Typography variant="premiumLabel" color={catColor}>{t('affirmations.jak_dziala_wsparcie', 'Jak działa wsparcie')}</Typography>
            {FLOW_STEPS.map((s, i) => (
              <View key={s.n} style={[af.flowRow, i > 0 && af.flowBorder]}>
                <View style={[af.flowNum, { backgroundColor: catColor + '20' }]}>
                  <Typography variant="microLabel" color={catColor}>{s.n}</Typography>
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="cardTitle" style={af.flowTitle}>{s.title}</Typography>
                  <Typography variant="caption" style={af.flowCopy}>{s.copy}</Typography>
                </View>
              </View>
            ))}
          </View>

          {/* ── ĆWICZENIE LUSTRZANE ──────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(140).duration(600)}>
            <View style={[af.mirrorCard, {
              borderColor: '#60A5FA' + '44',
              backgroundColor: isLight ? 'rgba(96,165,250,0.05)' : 'rgba(96,165,250,0.07)',
            }]}>
              <LinearGradient colors={['#60A5FA18', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <View style={[af.mirrorIconWrap, { backgroundColor: '#60A5FA20' }]}>
                  <FlipHorizontal color="#60A5FA" size={18} strokeWidth={1.6} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="premiumLabel" color="#60A5FA">{t('affirmations.cwiczenie_lustrzane', 'ĆWICZENIE LUSTRZANE')}</Typography>
                  <Typography variant="caption" style={{ opacity: 0.72, marginTop: 2 }}>{t('affirmations.powiedz_afirmacje_patrzac_sobie_w', 'Powiedz afirmację patrząc sobie w oczy')}</Typography>
                </View>
                {mirrorAllDone && (
                  <View style={[af.mirrorDoneBadge, { backgroundColor: '#34D39920', borderColor: '#34D39944' }]}>
                    <Check color="#34D399" size={12} strokeWidth={2.5} />
                    <Typography variant="microLabel" color="#34D399" style={{ marginLeft: 4 }}>{t('affirmations.gotowe', 'Gotowe')}</Typography>
                  </View>
                )}
              </View>

              <View style={[af.mirrorAffBox, {
                backgroundColor: isLight ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.10)',
                borderColor: '#60A5FA33',
              }]}>
                <Typography variant="bodySmall" style={{ fontStyle: 'italic', lineHeight: 22, color: isLight ? '#1A1A40' : '#DBEAFE', textAlign: 'center' }}>
                  {dailyPlan.affirmationGuidance.featured.text}
                </Typography>
              </View>

              {MIRROR_STEPS.map((step, i) => {
                const checked = mirrorChecked[i];
                return (
                  <Pressable
                    key={step.n}
                    onPress={() => toggleMirrorStep(i)}
                    style={[af.mirrorStepRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.10)' }]}
                  >
                    <View style={[af.mirrorStepCheck, {
                      backgroundColor: checked ? '#60A5FA' : 'transparent',
                      borderColor: checked ? '#60A5FA' : (isLight ? 'rgba(0,0,0,0.20)' : 'rgba(255,255,255,0.25)'),
                    }]}>
                      {checked && <Check color="#fff" size={12} strokeWidth={3} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Typography variant="microLabel" color="#60A5FA">{step.n}</Typography>
                        <Typography variant="cardTitle" style={{ fontSize: 13, color: checked ? '#60A5FA' : (isLight ? '#1A1A40' : '#DBEAFE') }}>{step.title}</Typography>
                      </View>
                      <Typography variant="caption" style={{ marginTop: 3, lineHeight: 18, opacity: 0.72 }}>{step.desc}</Typography>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* ── 108 POWTÓRZEŃ ────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(160).duration(600)}>
            <View style={[af.repCard, {
              borderColor: catColor + '44',
              backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)',
              overflow: 'hidden',
            }]}>
              <LinearGradient colors={[catColor + '18', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <View style={[af.repIconWrap, { backgroundColor: catColor + '20' }]}>
                  <Repeat color={catColor} size={18} strokeWidth={1.6} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="premiumLabel" color={catColor}>{t('affirmations.108_powtorzen', '108 POWTÓRZEŃ')}</Typography>
                  <Typography variant="caption" style={{ opacity: 0.65, marginTop: 2 }}>{t('affirmations.swieta_liczba_w_tradycji_wedyjskiej', 'Święta liczba w tradycji wedyjskiej')}</Typography>
                </View>
                {repElapsed > 0 && (
                  <View style={[af.repTimerBadge, { backgroundColor: catColor + '18', borderColor: catColor + '33' }]}>
                    <Typography variant="microLabel" color={catColor}>{formatRepTime(repElapsed)}</Typography>
                  </View>
                )}
              </View>

              <Typography variant="caption" style={{ opacity: 0.72, lineHeight: 18, marginBottom: 20 }}>
                {t('affirmations.108_to_liczba_pojawia_sie', '108 to liczba pojawia się w wedyjskich mantrach, buddyjskich koralkach i astronomii. Podzielona na cztery kwadranty: 27 × 4 = 108 — każdy segment przynosi inne przebudzenie.')}
              </Typography>

              {/* Milestones */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {REP_MILESTONES.map(m => {
                  const reached = repCount >= m.at;
                  return (
                    <View key={m.at} style={[af.repMilestone, {
                      backgroundColor: reached ? catColor + '20' : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)'),
                      borderColor: reached ? catColor + '55' : (isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)'),
                    }]}>
                      {reached && <Check color={catColor} size={10} strokeWidth={2.5} style={{ marginRight: 4 }} />}
                      <Typography variant="microLabel" color={reached ? catColor : (isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.40)')} style={{ fontSize: 9 }}>
                        {m.at} — {m.label.split(' — ')[1] || m.label}
                      </Typography>
                    </View>
                  );
                })}
              </View>

              {/* Ring */}
              <Animated.View style={[{ alignItems: 'center', marginBottom: 20 }, celebrateStyle]}>
                <RepRing count={repCount} accent={catColor} />
              </Animated.View>

              {/* Affirmation text for practice */}
              <View style={[af.repAffBox, { backgroundColor: catColor + '10', borderColor: catColor + '26' }]}>
                <Typography variant="bodySmall" style={{ fontStyle: 'italic', lineHeight: 22, color: isLight ? '#1A1410' : '#F0EBE2', textAlign: 'center' }}>
                  {dailyPlan.affirmationGuidance.featured.text}
                </Typography>
              </View>

              {/* Controls */}
              <View style={af.repControls}>
                {!repActive && !repComplete && (
                  <Pressable
                    onPress={startRepSession}
                    style={[af.repStartBtn, { backgroundColor: catColor }]}
                  >
                    <Play color="#fff" size={16} strokeWidth={2} />
                    <Typography variant="microLabel" style={{ color: '#fff', marginLeft: 8 }}>{t('affirmations.rozpocznij_praktyke', 'Rozpocznij praktykę')}</Typography>
                  </Pressable>
                )}
                {repActive && (
                  <>
                    <Pressable
                      onPress={handleRep}
                      style={[af.repTapBtn, { backgroundColor: catColor, shadowColor: catColor, shadowOpacity: 0.5, shadowRadius: 20, elevation: 8 }]}
                    >
                      <Typography variant="premiumLabel" style={{ color: '#fff', fontSize: 16 }}>{t('affirmations.dotknij', 'DOTKNIJ')}</Typography>
                      <Typography variant="caption" style={{ color: '#ffffff99', fontSize: 11, marginTop: 2 }}>{t('affirmations.jedno_powtorzeni', 'jedno powtórzenie')}</Typography>
                    </Pressable>
                    <Pressable onPress={stopRepSession} style={[af.repStopBtn, { borderColor: catColor + '55' }]}>
                      <Pause color={catColor} size={16} strokeWidth={2} />
                    </Pressable>
                  </>
                )}
                {repComplete && (
                  <View style={[af.repCompleteBox, { backgroundColor: catColor + '15', borderColor: catColor + '44' }]}>
                    <Sparkles color={catColor} size={18} strokeWidth={1.6} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Typography variant="cardTitle" color={catColor}>{t('affirmations.108_powtorzen_ukonczone', '108 powtórzeń ukończone!')}</Typography>
                      <Typography variant="caption" style={{ opacity: 0.72, marginTop: 2 }}>
                        Czas: {formatRepTime(repElapsed)} · Głęboka transformacja zakorzeniona.
                      </Typography>
                    </View>
                  </View>
                )}
                {(repComplete || repCount > 0) && (
                  <Pressable onPress={resetReps} style={[af.repResetBtn, { borderColor: catColor + '33' }]}>
                    <SkipForward color={catColor} size={14} strokeWidth={2} />
                    <Typography variant="microLabel" color={catColor} style={{ marginLeft: 6 }}>{t('affirmations.reset', 'Reset')}</Typography>
                  </Pressable>
                )}
              </View>
            </View>
          </Animated.View>

          {/* ── TRYB AUDIO / ODDECH ──────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(180).duration(600)}>
            <View style={[af.audioCard, {
              borderColor: '#34D39944',
              backgroundColor: isLight ? 'rgba(52,211,153,0.05)' : 'rgba(52,211,153,0.07)',
              overflow: 'hidden',
            }]}>
              <LinearGradient colors={['#34D39918', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <View style={[af.audioIconWrap, { backgroundColor: '#34D39920' }]}>
                  {audioModeActive ? <Mic color="#34D399" size={18} strokeWidth={1.6} /> : <MicOff color="#34D399" size={18} strokeWidth={1.6} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="premiumLabel" color="#34D399">{t('affirmations.tryb_audio_rytm_oddechu', 'TRYB AUDIO — RYTM ODDECHU')}</Typography>
                  <Typography variant="caption" style={{ opacity: 0.65, marginTop: 2 }}>
                    {audioModeActive ? 'Aktywny — oddychaj zgodnie z kołem' : 'Połącz afirmację z oddechem'}
                  </Typography>
                </View>
                <Pressable
                  onPress={() => audioModeActive ? stopAudioMode() : startAudioMode()}
                  style={[af.audioToggle, {
                    backgroundColor: audioModeActive ? '#34D399' : (isLight ? 'rgba(255,246,230,0.92)' : 'rgba(52,211,153,0.14)'),
                    borderColor: audioModeActive ? '#34D399' : '#34D39933',
                  }]}
                >
                  <Typography variant="microLabel" style={{ color: audioModeActive ? '#fff' : '#34D399' }}>
                    {audioModeActive ? 'Stop' : 'Start'}
                  </Typography>
                </Pressable>
              </View>

              <Typography variant="caption" style={{ opacity: 0.72, lineHeight: 18, marginBottom: audioModeActive ? 20 : 0 }}>
                {audioModeActive
                  ? 'Wdech 4 sekundy → Zatrzymaj 2 sekundy → Wydech 4 sekundy. Powtarzaj afirmację przy wydechu.'
                  : 'Aktywuj rytm oddechu, by połączyć afirmację z ciałem. Oddech nadaje słowom energię.'
                }
              </Typography>

              {audioModeActive && (
                <View style={{ alignItems: 'center', gap: 16 }}>
                  {/* Animated breath circle */}
                  <Animated.View style={[af.breathCircleOuter, {
                    borderColor: '#34D39933',
                    backgroundColor: '#34D39908',
                  }, breathCircleStyle]}>
                    <View style={[af.breathCircleInner, { backgroundColor: '#34D39920', borderColor: '#34D39955' }]}>
                      <Typography variant="premiumLabel" color="#34D399" style={{ fontSize: 13 }}>
                        {breathPhase === 'inhale' ? 'WDECH' : breathPhase === 'hold' ? 'ZATRZYMAJ' : 'WYDECH'}
                      </Typography>
                    </View>
                  </Animated.View>

                  {/* Affirmation reminder */}
                  <View style={[af.breathAffBox, { backgroundColor: '#34D39912', borderColor: '#34D39930' }]}>
                    <Wind color="#34D399" size={14} strokeWidth={1.6} style={{ marginRight: 8 }} />
                    <Typography variant="caption" style={{ flex: 1, fontStyle: 'italic', lineHeight: 20, color: isLight ? '#0D3B2E' : '#A7F3D0' }}>
                      {dailyPlan.affirmationGuidance.featured.text}
                    </Typography>
                  </View>

                  {/* Phases guide */}
                  <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                    {(['inhale','hold','exhale'] as const).map((phase, i) => {
                      const labels = ['Wdech\n4s', 'Zatrzymaj\n2s', 'Wydech\n4s'];
                      const isActive = breathPhase === phase;
                      return (
                        <View key={phase} style={[af.breathPhaseChip, {
                          flex: 1,
                          backgroundColor: isActive ? '#34D39920' : (isLight ? 'rgba(240,228,210,0.90)' : 'rgba(255,255,255,0.04)'),
                          borderColor: isActive ? '#34D39966' : (isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)'),
                        }]}>
                          <Typography variant="microLabel" color={isActive ? '#34D399' : (isLight ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.45)')} style={{ textAlign: 'center', lineHeight: 16 }}>
                            {labels[i]}
                          </Typography>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </Animated.View>

          {/* SEQUENCE */}
          {supportingAffirmations.length > 0 && (
            <View style={[af.sequenceCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', borderColor: isLight ? 'rgba(139,100,42,0.45)' : 'rgba(244,114,182,0.14)' }]}>
              <Typography variant="premiumLabel" color={catColor}>{t('affirmations.sekwencja_na_dzis', 'Sekwencja na dziś')}</Typography>
              {supportingAffirmations.map((text, i) => (
                <View key={i} style={[af.seqRow, i > 0 && af.flowBorder]}>
                  <Typography variant="microLabel" color={catColor} style={{ minWidth: 28 }}>0{i + 1}</Typography>
                  <Typography variant="bodySmall" style={af.seqText}>{text}</Typography>
                </View>
              ))}
            </View>
          )}

          {/* ── MOJE ULUBIONE ────────────────────────────────────── */}
          {savedAffirmationsList.length > 0 && (
            <Animated.View entering={FadeInDown.delay(180).duration(600)}>
              <View style={[af.favSection, { borderColor: catColor + '33', backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <View style={[af.favIconWrap, { backgroundColor: catColor + '20' }]}>
                    <Bookmark color={catColor} size={16} strokeWidth={1.8} fill={catColor + '44'} />
                  </View>
                  <Typography variant="premiumLabel" color={catColor}>{t('affirmations.moje_ulubione', 'MOJE ULUBIONE')}</Typography>
                  <View style={[af.favCountBadge, { backgroundColor: catColor + '20', borderColor: catColor + '33' }]}>
                    <Typography variant="microLabel" color={catColor}>{savedAffirmationsList.length}</Typography>
                  </View>
                </View>
                {savedAffirmationsList.map((item, idx) => {
                  const txt = resolveUserFacingText(item.text);
                  const itemColor = CAT_COLOR_MAP[item.category] || catColor;
                  return (
                    <View
                      key={item.id}
                      style={[af.favRow, idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.10)' }]}
                    >
                      <View style={[af.favDot, { backgroundColor: itemColor }]} />
                      <Typography variant="bodySmall" style={[af.favText, { flex: 1, color: isLight ? '#1A1410' : '#F0EBE2' }]}>
                        {txt}
                      </Typography>
                      <Pressable
                        onPress={() => { void HapticsService.selection(); toggleFavoriteAffirmation(item.id); }}
                        hitSlop={12}
                        style={{ padding: 4 }}
                      >
                        <Bookmark color={itemColor} size={16} fill={itemColor + '44'} strokeWidth={1.8} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* ── HISTORIA AFIRMACJI (7-day calendar) ─────────────── */}
          <Animated.View entering={FadeInDown.delay(220).duration(600)}>
            <View style={[af.historyCard, {
              borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(244,114,182,0.18)',
              backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)',
            }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <View style={[af.histIconWrap, { backgroundColor: catColor + '18' }]}>
                  <BookOpen color={catColor} size={16} strokeWidth={1.8} />
                </View>
                <Typography variant="premiumLabel" color={catColor}>{t('affirmations.historia_afirmacji', 'HISTORIA AFIRMACJI')}</Typography>
                <Typography variant="caption" style={{ opacity: 0.55, marginLeft: 'auto' }}>{t('affirmations.7_dni', '7 dni')}</Typography>
              </View>
              <View style={af.histRow}>
                {affiHistory.map((item, idx) => {
                  const isToday = item.date === today;
                  const color = item.done
                    ? (item.category ? (CAT_COLOR_MAP[item.category] || catColor) : catColor)
                    : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)');
                  return (
                    <View key={item.date} style={af.histDayCol}>
                      <Typography variant="microLabel" style={{ fontSize: 9, opacity: 0.55, marginBottom: 6, textAlign: 'center' }}>
                        {item.day.toUpperCase().slice(0, 2)}
                      </Typography>
                      <View style={[af.histDayDot, {
                        backgroundColor: item.done ? color + '30' : 'transparent',
                        borderColor: isToday ? catColor : (item.done ? color : (isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)')),
                        borderWidth: isToday ? 2 : 1,
                      }]}>
                        {item.done
                          ? <Check color={color} size={12} strokeWidth={2.5} />
                          : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)' }} />
                        }
                      </View>
                    </View>
                  );
                })}
              </View>
              <Typography variant="caption" style={{ marginTop: 12, opacity: 0.60, lineHeight: 18 }}>
                {t('affirmations.kazdy_dzien_z_afirmacja_zapisuje', 'Każdy dzień z afirmacją zapisuje się tutaj. Kolor odpowiada kategorii praktyki.')}
              </Typography>
            </View>
          </Animated.View>

          {/* ── WYZWANIE 21 DNI ──────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(280).duration(600)}>
            <View style={[af.challengeCard, {
              borderColor: '#34D399' + '44',
              backgroundColor: isLight ? 'rgba(52,211,153,0.05)' : 'rgba(52,211,153,0.07)',
            }]}>
              <LinearGradient colors={['#34D39918', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <View style={[af.challengeIconWrap, { backgroundColor: '#34D39920' }]}>
                  <Trophy color="#34D399" size={18} strokeWidth={1.6} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="premiumLabel" color="#34D399">{t('affirmations.wyzwanie_21_dni', 'WYZWANIE 21 DNI')}</Typography>
                  <Typography variant="caption" style={{ opacity: 0.70, marginTop: 2 }}>{t('affirmations.codziennie_przez_3_tygodnie', 'Codziennie przez 3 tygodnie')}</Typography>
                </View>
                <View style={[af.challengeStreakBadge, {
                  backgroundColor: challengeStreak > 0 ? '#34D39920' : (isLight ? 'rgba(255,246,230,0.92)' : 'rgba(255,255,255,0.06)'),
                  borderColor: challengeStreak > 0 ? '#34D39944' : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'),
                }]}>
                  <Typography variant="microLabel" color={challengeStreak > 0 ? '#34D399' : currentTheme.textMuted}>
                    🔥 {challengeStreak} dni
                  </Typography>
                </View>
              </View>

              <Typography variant="caption" style={{ opacity: 0.72, lineHeight: 18, marginBottom: 16 }}>
                {t('affirmations.dotknij_dnia_aby_oznaczyc_go', 'Dotknij dnia, aby oznaczyć go jako ukończony. Badania pokazują, że 21 dni wystarczy, aby nowa praktyka stała się nawykowym wzorcem.')}
              </Typography>

              {/* 7×3 grid */}
              <View style={af.challengeGrid}>
                {challengeDays.map((done, idx) => {
                  const dayNum = idx + 1;
                  const week = Math.floor(idx / 7);
                  const weekColors = ['#34D399', '#60A5FA', '#A78BFA'];
                  const weekColor = weekColors[week];
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => toggleChallengeDay(idx)}
                      style={[af.challengeDay, {
                        backgroundColor: done ? weekColor + '28' : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)'),
                        borderColor: done ? weekColor : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'),
                      }]}
                    >
                      {done
                        ? <Check color={weekColor} size={12} strokeWidth={2.5} />
                        : <Typography variant="microLabel" style={{ fontSize: 10, color: isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.35)' }}>{dayNum}</Typography>
                      }
                    </Pressable>
                  );
                })}
              </View>

              {/* Week labels */}
              <View style={af.challengeWeeks}>
                {['Tydzień 1', 'Tydzień 2', 'Tydzień 3'].map((w, wi) => {
                  const wColors = ['#34D399', '#60A5FA', '#A78BFA'];
                  const completed = challengeDays.slice(wi * 7, wi * 7 + 7).filter(Boolean).length;
                  return (
                    <View key={w} style={af.challengeWeekItem}>
                      <View style={[af.challengeWeekDot, { backgroundColor: wColors[wi] }]} />
                      <Typography variant="microLabel" color={wColors[wi]}>{w}</Typography>
                      <Typography variant="caption" style={{ opacity: 0.55, marginLeft: 4 }}>{completed}/7</Typography>
                    </View>
                  );
                })}
              </View>

              {challengeDays.filter(Boolean).length === 21 && (
                <View style={[af.challengeCompleteBanner, { backgroundColor: '#34D39920', borderColor: '#34D39944' }]}>
                  <Check color="#34D399" size={16} strokeWidth={2.5} />
                  <Typography variant="cardTitle" color="#34D399" style={{ marginLeft: 8 }}>{t('affirmations.wyzwanie_ukonczone', 'Wyzwanie ukończone! ✨')}</Typography>
                </View>
              )}
            </View>
          </Animated.View>

          {/* LIBRARY */}
          <Text style={[af.sectionHeaderLabel, { color: catColor }]}>BIBLIOTEKA — {activeCatMeta.label.toUpperCase()}</Text>

          <Pressable
            onPress={() => setShowAddModal(true)}
            style={[af.addCustomBtn, { borderColor: catColor + '44', backgroundColor: catColor + '0A' }]}
          >
            <Text style={[af.addCustomBtnText, { color: catColor }]}>{t('affirmations.dodaj_wlasna_afirmacje', '+ Dodaj własną afirmację')}</Text>
          </Pressable>

          {customAffirmations.filter(a => !a.category || a.category === activeCategory).map((entry, idx) => (
            <Animated.View key={`custom-${entry.id}`} entering={FadeInDown.delay(idx * 40).duration(400)}>
              <View style={[af.affCard, {
                borderColor: catColor + '44',
                flexDirection: 'row',
                padding: 0,
              }]}>
                <LinearGradient
                  colors={[isLight ? 'rgba(255,255,255,0.97)' : catColor + '10', isLight ? catColor + '08' : catColor + '05'] as [string,string]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {/* Left accent bar */}
                <View style={{ width: 4, alignSelf: 'stretch', borderTopLeftRadius: 20, borderBottomLeftRadius: 20, backgroundColor: catColor, opacity: 0.85, flexShrink: 0 }} />
                <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2, color: catColor, marginBottom: 6, textTransform: 'uppercase' }}>{t('affirmations.moja_afirmacja', '💫 Moja afirmacja')}</Text>
                    <Text style={[af.affText, { color: isLight ? '#1A1410' : '#F0EBE2', fontSize: 16 }]}>{entry.text}</Text>
                  </View>
                  <Pressable hitSlop={10} style={{ padding: 8 }} onPress={() => Alert.alert(t('affirmations.usun_afirmacje', 'Usuń afirmację'), t('affirmations.czy_na_pewno_chcesz_usunac', 'Czy na pewno chcesz usunąć tę afirmację?'), [
                    { text: 'Anuluj', style: 'cancel' },
                    { text: 'Usuń', style: 'destructive', onPress: () => deleteCustomAffirmation(entry.id) },
                  ])}>
                    <Trash2 size={15} color={'#EF4444'} strokeWidth={1.6} />
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          ))}

          {categoryAffirmations.map((entry, idx) => {
            const translated = resolveUserFacingText(entry.text);
            const isSaved = favoriteAffirmations.includes(entry.id);
            return (
              <Animated.View key={entry.id} entering={FadeInUp.delay(idx * 80).duration(600)}>
                <View style={[af.affCard, {
                  borderColor: isSaved ? catColor + '77' : catColor + '33',
                  overflow: 'hidden',
                  shadowColor: catColor,
                  shadowOpacity: isSaved ? 0.40 : 0.18,
                  shadowRadius: isSaved ? 18 : 12,
                  shadowOffset: { width: 0, height: isSaved ? 8 : 4 },
                  elevation: isSaved ? 9 : 5,
                  flexDirection: 'row',
                  padding: 0,
                }]}>
                  {/* Gradient bg */}
                  <LinearGradient
                    colors={[
                      isLight ? 'rgba(255,255,255,0.97)' : catColor + '10',
                      isLight ? catColor + '08' : catColor + '06',
                    ] as [string,string]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Top shimmer line */}
                  <LinearGradient
                    colors={['transparent', catColor + '66', 'transparent'] as [string,string,string]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1 }}
                    pointerEvents="none"
                  />
                  {/* Left accent bar */}
                  <View style={{
                    width: 4,
                    alignSelf: 'stretch',
                    borderTopLeftRadius: 20,
                    borderBottomLeftRadius: 20,
                    backgroundColor: catColor,
                    opacity: 0.85,
                    flexShrink: 0,
                  }} />

                  {/* Main content */}
                  <View style={{ flex: 1, padding: 20 }}>
                    <View style={af.affTop}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={[af.quoteWrap, { backgroundColor: catColor + '18' }]}>
                          <Quote color={catColor} size={15} opacity={0.9} />
                        </View>
                        <View style={[af.catBadge, { backgroundColor: catColor + '20', borderColor: catColor + '40' }]}>
                          <Text style={[af.catBadgeText, { color: catColor }]}>{activeCatMeta.label.toUpperCase()}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[af.catBadgeText, { color: catColor, opacity: 0.55 }]}>{idx + 1}/{categoryAffirmations.length}</Text>
                        {/* Glowing star favorite */}
                        <Pressable
                          onPress={() => handleSave(entry.id)}
                          hitSlop={14}
                          style={[
                            af.starFavBtn,
                            isSaved && {
                              backgroundColor: catColor + '22',
                              shadowColor: catColor,
                              shadowOpacity: 0.6,
                              shadowRadius: 8,
                              elevation: 4,
                            },
                          ]}
                        >
                          <Star
                            color={isSaved ? catColor : currentTheme.textMuted}
                            fill={isSaved ? catColor : 'none'}
                            size={18}
                            strokeWidth={isSaved ? 1.5 : 1.8}
                          />
                        </Pressable>
                      </View>
                    </View>
                    <Typography variant="editorialHeader" style={[af.affText, { color: currentTheme.text, marginTop: 4 }]}>{translated}</Typography>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                      <SpeakButton text={translated} color={catColor} compact />
                    </View>
                    <Typography variant="caption" style={af.affSupport}>{t('affirmations.powtorz_trzy_razy_powoli_i', 'Powtórz trzy razy powoli i sprawdź, gdzie w ciele pojawia się ulga.')}</Typography>
                    <View style={af.affFooter}>
                      <View style={af.affFooterLeft}>
                        <MoonStar color={catColor} size={12} />
                        <Typography variant="microLabel" color={catColor} style={{ marginLeft: 6 }}>{t('affirmations.czytaj_jak_wers_nie_jak', 'Czytaj jak wers, nie jak notatkę')}</Typography>
                      </View>
                      <Pressable onPress={() => handleShare(translated)} style={af.affShare}>
                        <Typography variant="microLabel" color={catColor}>{t('affirmations.udostepnij', 'Udostępnij')}</Typography>
                        <ArrowRight color={catColor} size={12} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          })}

          {/* EKOSYSTEM */}
          <View style={[af.ecoCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', borderColor: isLight ? 'rgba(139,100,42,0.45)' : 'rgba(244,114,182,0.14)' }]}>
            <Typography variant="premiumLabel" color={catColor}>{t('affirmations.ekosystem_wsparcia', 'Ekosystem wsparcia')}</Typography>
            {[
              { title: 'Dziennik', copy: 'Kiedy potrzebujesz nazwać uczucie własnymi słowami przed działaniem.', onPress: () => navigation.navigate('Journal') },
              { title: 'Sny', copy: 'Kiedy materiał nocny niesie więcej prawdy niż dzienny hałas.', onPress: () => navigation.navigate('Dreams') },
              { title: 'Oczyszczanie', copy: 'Gdy napięcie wymaga uwolnienia zanim zdanie naprawdę zostanie.', onPress: () => navigateToDashboardSurface(navigation, 'cleansing') },
              { title: 'Oddech ukojenia', copy: 'Przejdź od słów do ciała i domknij wsparcie jednym regulującym rytmem.', onPress: () => navigation.navigate('Breathwork') },
            ].map((item, i) => (
              <Pressable key={item.title} style={[af.ecoRow, i > 0 && af.flowBorder]} onPress={item.onPress}>
                <View style={{ flex: 1 }}>
                  <Typography variant="microLabel" color={catColor}>{item.title}</Typography>
                  <Typography variant="caption" style={af.ecoCopy}>{item.copy}</Typography>
                </View>
                <ArrowRight color={catColor} size={13} />
              </Pressable>
            ))}
          </View>

          {/* ── NAUKA O AFIRMACJACH ──────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(320).duration(600)}>
            <View style={[af.scienceSection, { borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.08)', backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <View style={[af.scienceIconWrap, { backgroundColor: '#A78BFA20' }]}>
                  <Brain color="#A78BFA" size={16} strokeWidth={1.8} />
                </View>
                <Typography variant="premiumLabel" color="#A78BFA">{t('affirmations.nauka_o_afirmacjac', 'Nauka o afirmacjach')}</Typography>
              </View>
              {SCIENCE_FACTS.map((fact, idx) => {
                const expanded = expandedFact === idx;
                const Icon = fact.icon;
                return (
                  <Pressable
                    key={fact.title}
                    onPress={() => { void HapticsService.selection(); setExpandedFact(expanded ? null : idx); }}
                    style={[af.scienceFactCard, {
                      backgroundColor: expanded ? fact.color + '10' : (isLight ? 'rgba(240,228,210,0.90)' : 'rgba(255,255,255,0.04)'),
                      borderColor: expanded ? fact.color + '40' : (isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)'),
                      marginBottom: idx < SCIENCE_FACTS.length - 1 ? 8 : 0,
                    }]}
                  >
                    <View style={af.scienceFactRow}>
                      <View style={[af.scienceFactIcon, { backgroundColor: fact.color + '18' }]}>
                        <Icon color={fact.color} size={14} strokeWidth={1.8} />
                      </View>
                      <Typography variant="cardTitle" style={[af.scienceFactTitle, { color: expanded ? fact.color : (isLight ? '#1A1410' : '#F0EBE2'), flex: 1 }]}>
                        {fact.title}
                      </Typography>
                      {expanded
                        ? <ChevronUp color={fact.color} size={16} strokeWidth={2} />
                        : <ChevronDown color={currentTheme.textMuted} size={16} strokeWidth={2} />
                      }
                    </View>
                    {expanded && (
                      <Typography variant="caption" style={[af.scienceFactBody, { lineHeight: 20, opacity: 0.80 }]}>
                        {fact.body}
                      </Typography>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* JOURNAL CTA */}
          <Pressable style={[af.journalCta, { backgroundColor: isLight ? catColor + '0C' : 'rgba(255,255,255,0.05)', borderColor: isLight ? catColor + '33' : catColor + '26' }]} onPress={() => navigation.navigate('JournalEntry', { prompt: dailyPlan.journalPrompt })}>
            <LinearGradient colors={[catColor + '18', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <Typography variant="premiumLabel" color={catColor}>{t('affirmations.domknij_wsparcie_zapisem', 'Domknij wsparcie zapisem')}</Typography>
            <Typography variant="bodySmall" style={af.journalCtaCopy}>{t('affirmations.jesli_chcesz_zeby_to_zdanie', 'Jeśli chcesz, żeby to zdanie naprawdę zostało z Tobą, zapisz jedno zdanie o tym, co poruszyło się po jego powtórzeniu.')}</Typography>
            <View style={af.journalCtaRow}>
              <Typography variant="microLabel" color={catColor}>{t('affirmations.przejdz_do_dziennika', 'Przejdź do dziennika')}</Typography>
              <ArrowRight color={catColor} size={14} />
            </View>
          </Pressable>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={showFsModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowFsModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setShowFsModal(false)}>
          <Pressable onPress={e => e.stopPropagation()} style={[af.fsSheet, { backgroundColor: currentTheme.backgroundElevated, overflow: 'hidden', borderTopColor: catColor + '44', borderTopWidth: 1, borderLeftColor: catColor + '22', borderLeftWidth: 1, borderRightColor: catColor + '22', borderRightWidth: 1 }]}>
            <LinearGradient colors={[catColor + '18', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: catColor + '44', alignSelf: 'center', marginBottom: 18 }} />
            <Typography variant="cardTitle" style={{ color: currentTheme.text, marginBottom: 4 }}>{t('affirmations.dla_kogo_te_afirmacje', 'Dla kogo te afirmacje?')}</Typography>
            <Typography variant="bodySmall" style={{ color: currentTheme.textMuted, marginBottom: 20 }}>{t('affirmations.wpisz_imie_osoby_ktorej_poswiecasz', 'Wpisz imię osoby, której poświęcasz tę sesję.')}</Typography>
            <MysticalInput
              value={fsNameInput}
              onChangeText={setFsNameInput}
              placeholder={t('affirmations.imie_osoby', 'Imię osoby...')}
              placeholderTextColor={currentTheme.textMuted}
              style={{ color: currentTheme.text }}
              containerStyle={{ marginBottom: 4 }}
            />
            {forSomeone && (
              <Pressable onPress={() => { setForSomeone(false); setFsName(''); setShowFsModal(false); }} style={[af.fsCta, { backgroundColor: 'rgba(255,100,100,0.2)', borderColor: '#FB7185', borderWidth: 1, marginTop: 12 }]}>
                <Typography variant="caption" style={{ color: '#FB7185', fontWeight: '600' }}>{t('affirmations.wylacz_tryb_dla_kogos', 'Wyłącz tryb "Dla kogoś"')}</Typography>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                if (fsNameInput.trim()) {
                  setFsName(fsNameInput.trim());
                  setForSomeone(true);
                  setShowFsModal(false);
                }
              }}
              style={[af.fsCta, { backgroundColor: catColor, marginTop: forSomeone ? 10 : 16 }]}
            >
              <Typography variant="caption" style={{ color: '#FFF', fontWeight: '700' }}>{t('affirmations.potwierdz', 'Potwierdź')}</Typography>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showAddModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowAddModal(false)}>
        <Pressable style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.56)' }} onPress={() => setShowAddModal(false)}>
          <Pressable onPress={e => e.stopPropagation()} style={[af.addModalSheet, { backgroundColor: currentTheme.backgroundElevated || currentTheme.background, overflow: 'hidden', borderTopColor: catColor + '44', borderTopWidth: 1, borderLeftColor: catColor + '22', borderLeftWidth: 1, borderRightColor: catColor + '22', borderRightWidth: 1 }]}>
            <LinearGradient colors={[catColor + '18', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: catColor + '44', alignSelf: 'center', marginBottom: 18 }} />
            <Typography variant="premiumLabel" color={catColor}>{t('affirmations.wlasna_afirmacja', 'Własna afirmacja')}</Typography>
            <Typography variant="editorialHeader" style={[af.addModalTitle, { color: currentTheme.text }]}>{t('affirmations.nadaj_swojej_intencji_wlasny_jezyk', 'Nadaj swojej intencji własny język.')}</Typography>
            <Typography variant="bodySmall" style={[af.addModalCopy, { color: currentTheme.textMuted }]}>
              {t('affirmations.najmocniej_dziala_zdanie_krotkie_od', 'Najmocniej działa zdanie krótkie, oddechowe i prawdziwe. Zapisz je tak, aby brzmiało jak coś, do czego naprawdę chcesz wracać rano albo wieczorem.')}
            </Typography>
            <MysticalInput
              value={newAffText}
              onChangeText={setNewAffText}
              multiline
              textAlignVertical="top"
              maxLength={180}
              placeholder={t('affirmations.np_z_kazdym_oddechem_odzyskuje', 'Np. Z każdym oddechem odzyskuję spokój i wracam do swojego centrum.')}
              placeholderTextColor={currentTheme.textMuted}
              style={{ color: currentTheme.text, minHeight: 90, fontSize: 15, lineHeight: 24 }}
              containerStyle={{ marginTop: 8, marginBottom: 16 }}
            />
            <View style={af.addModalActions}>
              <Pressable onPress={() => { setShowAddModal(false); setNewAffText(''); }} style={[af.addModalSecondary, { borderColor: catColor + '26', backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)' }]}>
                <Typography variant="microLabel" color={catColor}>{t('affirmations.anuluj', 'Anuluj')}</Typography>
              </Pressable>
              <Pressable
                onPress={() => {
                  const clean = newAffText.trim();
                  if (!clean) return;
                  addCustomAffirmation(clean, activeCategory);
                  setNewAffText('');
                  setShowAddModal(false);
                  void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
                  AudioService.playTouchTone('confirm');
                }}
                style={[af.addModalPrimary, { backgroundColor: catColor, opacity: newAffText.trim() ? 1 : 0.45 }]}
                disabled={!newAffText.trim()}
              >
                <Typography variant="microLabel" style={{ color: '#FFF' }}>{t('affirmations.zapisz_afirmacje', 'Zapisz afirmację')}</Typography>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const af = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 76 },
  backBtn: { width: 40 },
  headerCenter: { flex: 1, alignItems: 'center' },
  scroll: { flexGrow: 1, paddingHorizontal: layout.padding.screen, paddingTop: 4 },

  featuredCard: { borderRadius: 28, borderWidth: 1.5, padding: 26, overflow: 'hidden', marginBottom: 22, backgroundColor: 'rgba(16,10,26,0.82)', shadowColor: '#F472B6', shadowOpacity: 0.38, shadowRadius: 30, shadowOffset: { width: 0, height: 16 }, elevation: 12 },
  featuredTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  featuredText: { marginTop: 12, fontSize: 20, lineHeight: 30, fontStyle: 'italic' },
  featuredRationale: { marginTop: 14, lineHeight: 22, opacity: 0.82 },
  bookmarkBtn: { paddingTop: 4 },
  handoff: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', gap: 6 },
  handoffCopy: { lineHeight: 20, opacity: 0.82 },
  featuredMeta: { marginTop: 16, gap: 8 },
  metaPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  metaText: { opacity: 0.8 },
  shareRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Mantra tygodnia
  mantraCard: { borderRadius: 26, borderWidth: 1.5, padding: 22, overflow: 'hidden', marginBottom: 18 },
  mantraIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  mantraText: { fontSize: 18, lineHeight: 28, fontStyle: 'italic', marginBottom: 16 },
  mantraFooter: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },

  catWrap: { marginBottom: 20 },
  catScroll: { gap: 10, paddingRight: 22 },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, gap: 4 },
  catDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 6 },
  heroCatPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  starFavBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  flowCard: { padding: 20, marginBottom: 18, borderRadius: 20, borderWidth: 1 },
  flowRow: { flexDirection: 'row', gap: 14, paddingVertical: 12, alignItems: 'flex-start' },
  flowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.12)' },
  flowNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  flowTitle: { fontSize: 14, marginBottom: 4 },
  flowCopy: { lineHeight: 18, opacity: 0.72 },

  // Mirror exercise
  mirrorCard: { borderRadius: 24, borderWidth: 1.2, padding: 20, overflow: 'hidden', marginBottom: 18 },
  mirrorIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  mirrorAffBox: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16, alignItems: 'center' },
  mirrorStepRow: { flexDirection: 'row', gap: 14, paddingVertical: 12, alignItems: 'flex-start' },
  mirrorStepCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  mirrorDoneBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },

  sequenceCard: { padding: 20, marginBottom: 18, borderRadius: 20, borderWidth: 1 },
  seqRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'flex-start' },
  seqText: { flex: 1, lineHeight: 20, opacity: 0.82 },

  // Ulubione
  favSection: { borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 18 },
  favIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  favCountBadge: { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 16, borderWidth: 1 },
  favRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  favDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  favText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },

  // Historia
  historyCard: { borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 18 },
  histIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  histRow: { flexDirection: 'row', justifyContent: 'space-between' },
  histDayCol: { alignItems: 'center', flex: 1 },
  histDayDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  // 21-day challenge
  challengeCard: { borderRadius: 24, borderWidth: 1.2, padding: 20, overflow: 'hidden', marginBottom: 18 },
  challengeIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  challengeStreakBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  challengeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  challengeDay: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center' },
  challengeWeeks: { flexDirection: 'row', gap: 14, marginBottom: 4 },
  challengeWeekItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  challengeWeekDot: { width: 7, height: 7, borderRadius: 3.5 },
  challengeCompleteBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 14 },

  libLabel: { marginBottom: 14, marginTop: 4 },
  sectionHeaderLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14, marginTop: 4 },

  affCard: { borderRadius: 20, borderWidth: 1.2, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  affTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  quoteWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  catBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  affText: { fontSize: 20, lineHeight: 31, fontStyle: 'italic', opacity: 0.96 },
  affSupport: { marginTop: 14, lineHeight: 19, opacity: 0.72 },
  affFooter: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  affFooterLeft: { flexDirection: 'row', alignItems: 'center' },
  affShare: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  ecoCard: { padding: 22, marginTop: 8, marginBottom: 16, borderRadius: 20, borderWidth: 1 },
  ecoRow: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  ecoCopy: { marginTop: 4, lineHeight: 18, opacity: 0.72 },

  // Science facts
  scienceSection: { borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 18 },
  scienceIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  scienceFactCard: { borderRadius: 18, borderWidth: 1, padding: 14, overflow: 'hidden' },
  scienceFactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scienceFactIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  scienceFactTitle: { fontSize: 14, fontWeight: '700' },
  scienceFactBody: { marginTop: 10, fontSize: 13 },

  // Rep / Audio / Hour icon wraps (were missing — added for circular shape)
  repCard: { borderRadius: 26, borderWidth: 1.2, padding: 22, overflow: 'hidden', marginBottom: 18 },
  repIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  repTimerBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  repMilestone: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  repAffBox: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 20, alignItems: 'center' },
  repControls: { gap: 10, alignItems: 'center' },
  repStartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 24 },
  repTapBtn: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center' },
  repStopBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  repCompleteBox: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, width: '100%' },
  repResetBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  audioCard: { borderRadius: 26, borderWidth: 1.2, padding: 22, overflow: 'hidden', marginBottom: 18 },
  audioIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  audioToggle: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  breathCircleOuter: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  breathCircleInner: { width: 100, height: 100, borderRadius: 50, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  breathAffBox: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 1, width: '100%' },
  breathPhaseChip: { paddingVertical: 10, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hourCard: { borderRadius: 26, borderWidth: 1.2, padding: 22, overflow: 'hidden', marginBottom: 18 },
  hourIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  journalCta: { padding: 22, marginBottom: 8, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  journalCtaCopy: { marginTop: 8, lineHeight: 20, opacity: 0.82 },
  journalCtaRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  fsBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1 },
  fsSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  fsInput: { minHeight: 52, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, fontSize: 15 },
  addCustomBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 22, borderWidth: 1, marginBottom: 14 },
  addCustomBtnText: { fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },
  fsCta: { minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  addModalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  addModalTitle: { marginBottom: 8 },
  addModalCopy: { lineHeight: 22, opacity: 0.78, marginBottom: 16 },
  addModalInput: { minHeight: 140, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 16, fontSize: 15 },
  addModalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  addModalSecondary: { flex: 1, minHeight: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  addModalPrimary: { flex: 1.35, minHeight: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
});
