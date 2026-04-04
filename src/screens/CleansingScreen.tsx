// @ts-nocheck
import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { KeyboardAvoidingView, Keyboard, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, Share, Modal, Alert } from 'react-native';
import { CleansingBackground } from '../components/ThematicBackground';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, HeartCrack, HeartHandshake, MoonStar, NotebookPen, ShieldCheck, Sparkles, Wind, Waves, ChevronLeft, Droplets, ArrowRight, Check, Star, Leaf, Music, Volume2, Droplet, Calendar, Brain, Zap, Shield, Sun, BookOpen, Send, Eye, Home, Scissors, Gem, X } from 'lucide-react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp,
  useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { Typography } from '../components/Typography';
import { MysticalInput } from '../components/MysticalInput';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { AiService } from '../core/services/ai.service';
import { RITUALS } from '../features/rituals/data';
import { useFocusEffect } from '@react-navigation/native';
import { AudioService } from '../core/services/audio.service';
import { buildCleansingShareMessage } from '../core/utils/share';
import { navigateToDashboardSurface } from '../navigation/navigationFallbacks';
import { useTranslation } from 'react-i18next';

const ACCENT = '#34D399';

// ── 3D PURIFICATION ORB ───────────────────────────────────────
const PurificationOrb = React.memo(({ isDark }: { isDark: boolean }) => {
  const tiltX = useSharedValue(-10);
  const tiltY = useSharedValue(0);
  const pulse = useSharedValue(1);
  const rot = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 2400 }), withTiming(0.96, { duration: 2400 })),
      -1, false
    );
    rot.value = withRepeat(withTiming(360, { duration: 22000 }), -1, false);
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tiltY.value = Math.max(-35, Math.min(35, e.translationX * 0.22));
      tiltX.value = Math.max(-35, Math.min(10, -10 + e.translationY * 0.18));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-10, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 540 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: pulse.value },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  const S = 160;
  const cx = S / 2;
  const OR = 58;

  return (
    <GestureDetector gesture={panGesture}>
      <View style={{ height: S, alignItems: 'center', justifyContent: 'center', marginVertical: 4 }}>
        <Animated.View style={[{ width: S, height: S, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>
          {/* Rotating orbit ring */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ringStyle]}>
            <Svg width={S} height={S}>
              <Circle cx={cx} cy={cx} r={OR + 18} fill="none" stroke={ACCENT + '30'} strokeWidth={1} strokeDasharray="5 9" />
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i * 45) * Math.PI / 180;
                return <Circle key={i} cx={cx + (OR + 18) * Math.cos(a)} cy={cx + (OR + 18) * Math.sin(a)} r={2.5} fill={ACCENT + '66'} />;
              })}
            </Svg>
          </Animated.View>
          {/* Static orb */}
          <Svg width={S} height={S}>
            {/* Glow rings */}
            <Circle cx={cx} cy={cx} r={OR + 8} fill={ACCENT + (isDark ? '15' : '10')} />
            <Circle cx={cx} cy={cx} r={OR + 3} fill={ACCENT + (isDark ? '22' : '18')} />
            {/* Main sphere */}
            <Circle cx={cx} cy={cx} r={OR} fill={isDark ? '#0A2A1E' : '#D4FFF0'} stroke={ACCENT} strokeWidth={2} />
            {/* Equator lines */}
            {[-18, 0, 18].map((offset, i) => (
              <G key={i}>
                <Circle cx={cx} cy={cx + offset} r={Math.sqrt(OR * OR - offset * offset)} fill="none" stroke={ACCENT + '28'} strokeWidth={0.8} />
              </G>
            ))}
            {/* Meridian lines */}
            {[0, 45, 90, 135].map((deg, i) => {
              const a = deg * Math.PI / 180;
              return (
                <Line key={i}
                  x1={cx - OR * Math.cos(a)} y1={cx - OR * Math.sin(a)}
                  x2={cx + OR * Math.cos(a)} y2={cx + OR * Math.sin(a)}
                  stroke={ACCENT + '20'} strokeWidth={0.6}
                />
              );
            })}
            {/* Droplet center symbol */}
            <Circle cx={cx} cy={cx} r={OR * 0.28} fill={ACCENT + '44'} />
            <Circle cx={cx} cy={cx} r={OR * 0.14} fill={ACCENT + 'AA'} />
            <Circle cx={cx} cy={cx} r={OR * 0.06} fill={ACCENT} />
          </Svg>
        </Animated.View>
      </View>
    </GestureDetector>
  );
});

const BURDENS = [
  { id: 'fear',        label: 'Lęk i napięcie',      copy: 'Ciało szybsze niż oddech, trudno zejść z alarmu.',             icon: HeartCrack,    color: '#F87171' },
  { id: 'attachments', label: 'Przywiązania',          copy: 'Relacja lub historia nadal żyje w środku bez Twojej zgody.',  icon: Flame,          color: '#FB923C' },
  { id: 'clutter',     label: 'Energetyczny bałagan',  copy: 'Wszystko miesza się naraz, nie wiadomo co jest Twoje.',       icon: Wind,           color: '#FBBF24' },
  { id: 'karma',       label: 'Ciężar karmiczny',      copy: 'Stara narracja winy, długi albo przymusu powraca.',           icon: Sparkles,       color: '#A78BFA' },
  { id: 'protection',  label: 'Potrzeba ochrony',      copy: 'Trzeba wrócić do granic i zamknąć zbyt otwartą przestrzeń.', icon: ShieldCheck,    color: '#60A5FA' },
] as const;

const RELEASE_STEPS = [
  { step: '01', title: 'Nazwij', copy: 'Jeden konkretny ciężar, nie wszystko naraz. Im bardziej precyzyjne, tym głębsze uwolnienie.' },
  { step: '02', title: 'Poczuj', copy: 'Gdzie w ciele mieszka ten ciężar? Barki, klatka, brzuch, szczęka? Dotknij tego miejsca.' },
  { step: '03', title: 'Odetchnij', copy: 'Trzy powolne wydechy. Z każdym wyobraź sobie, że nadmiar odpuszcza razem z powietrzem.' },
  { step: '04', title: 'Postaw granicę', copy: 'Jedno zdanie granicy: co zostawiasz za sobą i co zapraszasz do reszty dnia.' },
  { step: '05', title: 'Zapisz', copy: 'Jeden ślad na papierze utrzymuje ulgę, zanim dzień znowu przyspieszy.' },
];

const SOUNDSCAPES = [
  { id: 'rain',   label: 'Deszcz',     sub: 'Rozluźnienie' },
  { id: 'forest', label: 'Las',         sub: 'Ugruntowanie' },
  { id: 'fire',   label: 'Ogień',       sub: 'Domknięcie' },
  { id: 'waves',  label: 'Fale',        sub: 'Oczyszczenie' },
  { id: 'ritual', label: 'Ceremonia',   sub: 'Wycofanie' },
] as const;

const AFTERCARE = [
  { icon: MoonStar,     label: 'Afirmacje',     copy: 'Zakotwicz spokój jednym zdaniem.',                            route: 'Affirmations' },
  { icon: Sparkles,     label: 'Rytuał',         copy: 'Pełna półka praktyk uwalniania i domknięcia.',              route: 'Rituals' },
  { icon: HeartHandshake, label: 'Relacja',      copy: 'Jeśli ciężar dotyczy więzi, wejdź w warstwę zgodności.',   route: 'Compatibility' },
  { icon: NotebookPen,  label: 'Dziennik',       copy: 'Jedno zdanie o tym, co puściło i co chce zostać.',          route: 'JournalEntry' },
];

// ── ENERGIE DNIA — dzień tygodnia + faza księżyca ─────────────
const DAY_ENERGY = [
  { day: 'Niedziela', energy: 'Niedziela to dzień słońca — idealna do oczyszczenia własnego centrum i odbudowania jasności.' },
  { day: 'Poniedziałek', energy: 'Poniedziałek to dzień księżyca — czas uwalniania emocji i oczyszczania pola emocjonalnego.' },
  { day: 'Wtorek', energy: 'Wtorek to dzień Marsa — uwalnianie złości, blokad i energii zastoju działa dziś szczególnie głęboko.' },
  { day: 'Środa', energy: 'Środa to dzień Merkurego — oczyszczanie myśli, starych przekonań i mentalnych pętli.' },
  { day: 'Czwartek', energy: 'Czwartek to dzień Jowisza — uwalnianie ograniczeń i poszerzanie przestrzeni wewnętrznej.' },
  { day: 'Piątek', energy: 'Piątek to dzień Wenus — oczyszczanie relacji, przywiązań i energii sercowej.' },
  { day: 'Sobota', energy: 'Sobota to dzień Saturna — domknięcie cykli, spłata długów energetycznych i rytuały zakończenia.' },
];

const MOON_PHASES = [
  { name: 'Nów', symbol: '🌑', desc: 'Czas głębokiego oczyszczenia i pustego miejsca na nowe.' },
  { name: 'Przybywający', symbol: '🌒', desc: 'Oczyść to, co hamuje nową energię przed jej wzrostem.' },
  { name: 'Pierwsza kwadra', symbol: '🌓', desc: 'Usuń przeszkody stojące na drodze do działania.' },
  { name: 'Gibbus przybywający', symbol: '🌔', desc: 'Ostatnie oczyszczenie przed pełnią — uwolnij resztki ciężarów.' },
  { name: 'Pełnia', symbol: '🌕', desc: 'Pełnia wzmacnia każdy rytuał uwalniania — to szczytowy moment oczyszczenia.' },
  { name: 'Gibbus ubywający', symbol: '🌖', desc: 'Czas odpuszczania tego, co nie służy Twojemu wzrostowi.' },
  { name: 'Ostatnia kwadra', symbol: '🌗', desc: 'Głęboka praca z uwolnieniem nawyków i wzorców.' },
  { name: 'Ubywający', symbol: '🌘', desc: 'Finalne oczyszczenie przed nowiem — puść to, co pozostało.' },
];

function getMoonPhaseIndex(date: Date): number {
  const jd = Math.floor(date.getTime() / 86400000) + 2440587.5;
  const cycle = (jd - 2451549.5) / 29.53058867;
  const phase = cycle - Math.floor(cycle);
  return Math.round(phase * 8) % 8;
}

// ── TECHNIKI OCZYSZCZANIA ─────────────────────────────────────
const CLEANSING_TECHNIQUES = [
  {
    id: 'smudging',
    label: 'Smudging',
    icon: Leaf,
    color: '#86EFAC',
    short: 'Szałwia i dym',
    instructions: 'Otwórz okno. Zapal pęczek szałwii lub palo santo. Przeprowadź dym wokół ciała — od stóp w górę, zataczając okrąg. Przy głowie zrób trzy powolne okrążenia. Intencja: "Uwalniam wszystko, co nie jest moje." Pozwól dymowi unosić się swobodnie przez 3-5 minut.',
  },
  {
    id: 'sound',
    label: 'Dźwięk',
    icon: Music,
    color: '#93C5FD',
    short: 'Miska tybetańska',
    instructions: 'Trzymaj miskę tybetańską lub dzwonek na otwartej dłoni. Uderz delikatnie i pozwól dźwiękowi wypełnić przestrzeń. Przesuń miskę wokół ciała na odległość 15-20 cm od skóry. Wyobraź sobie, jak drgania rozbijają stagnującą energię. Powtórz 3-7 razy w każdym obszarze, gdzie czujesz ciężar.',
  },
  {
    id: 'salt',
    label: 'Sól',
    icon: Droplet,
    color: '#FDE68A',
    short: 'Kąpiel solna',
    instructions: 'Do wanny wlej 2 filiżanki soli himalajskiej lub morskiej. Dodaj kilka kropel olejku lawendowego lub eukaliptusowego. Zanurzając się, wypowiedz intencję oczyszczenia. Pozostań w wodzie 20-30 minut. Wyobraź sobie, jak sól wchłania zmęczenie, napięcie i obce energie. Spłucz zimną wodą na zakończenie.',
  },
  {
    id: 'water',
    label: 'Woda',
    icon: Droplets,
    color: '#6EE7F7',
    short: 'Rytuał zimnej wody',
    instructions: 'Stań pod prysznicem. Zacznij od ciepłej wody, stopniowo obniżaj temperaturę. W momencie zimnej wody powiedz w myślach: "Puściłam/em to." Wyobraź sobie, jak woda zmywa wszelkie napięcia z aurafery i ciała fizycznego. Zakończ 30 sekundami zimnej wody — to aktywuje układ nerwowy i zwalnia pole energetyczne.',
  },
];

// ── AFIRMACJE OCZYSZCZENIA (7 na dni tygodnia) ────────────────
const CLEANSING_AFFIRMATIONS = [
  'Jestem czysta/y jak woda po deszczu. Każde oczyszczenie otwiera mnie na nowe.',
  'Puszczam to, co nie jest moje. Moje ciało i duch odżywają w spokoju.',
  'Uwalniam złość, lęk i ciężar. Na ich miejscu rodzi się przestrzeń i swoboda.',
  'Moje myśli są jasne. Moje serce jest lekkie. Moje pole energetyczne jest chronione.',
  'Nie muszę nosić cudzych ciężarów. Oddaję każdemu, co do niego należy z miłością.',
  'Każda relacja jest oczyszczona z oczekiwań. Kocham swobodnie i z granic.',
  'Domykam ten cykl z wdzięcznością. Jestem gotowa/y na to, co niesie nowe.',
];

// ── INTENSYWNOŚĆ OCZYSZCZANIA ─────────────────────────────────
const CLEANSING_INTENSITIES = [
  {
    id: 'light',
    label: 'Lekkie',
    sub: 'Szybki reset energii',
    desc: 'Krótka intencja, jeden oddech, afirmacja. Idealne na codzienne poranne czyszczenie.',
    color: '#86EFAC',
    duration: '5–10 min',
    icon: Leaf,
  },
  {
    id: 'medium',
    label: 'Średnie',
    sub: 'Regularna praktyka',
    desc: 'Technika oczyszczania, praca z ciężarem i krótka medytacja uwalniająca.',
    color: ACCENT,
    duration: '15–20 min',
    icon: Droplets,
  },
  {
    id: 'deep',
    label: 'Głębokie',
    sub: 'Praca z korzeniami',
    desc: 'Pełna sekwencja: ciężar, rytuał, cień, kąpiel dźwiękowa lub solna. Na dni szczególnej potrzeby.',
    color: '#93C5FD',
    duration: '30–45 min',
    icon: Brain,
  },
  {
    id: 'full',
    label: 'Pełne oczyszczenie',
    sub: 'Ceremonia uwolnienia',
    desc: 'Kompletny rytuał: przestrzeń, aura, ciało, ciężar i ochrona po oczyszczeniu. Raz na nowiu lub pełni.',
    color: '#A78BFA',
    duration: '60–90 min',
    icon: Sparkles,
  },
] as const;

// ── TECHNIKI OCZYSZCZANIA AURY ────────────────────────────────
const AURA_TECHNIQUES = [
  {
    id: 'egg_scan',
    label: 'Skanowanie białkiem jaja',
    color: '#FDE68A',
    icon: Eye,
    desc: 'Weź surowe jajko i trzymaj je w prawej dłoni. Bardzo powoli przesuwaj je 5–8 cm od ciała — od korony głowy w dół wzdłuż kręgosłupa, potem po bokach. Jajko wchłania gęste, stagnujące energie z pola auralnego. Po zakończeniu rozbij je do szklanki z zimną wodą i spłucz do ubikacji z intencją "odchodzisz na zawsze".',
  },
  {
    id: 'selenite',
    label: 'Zamiatanie selenitem',
    color: '#E0E7FF',
    icon: Gem,
    desc: 'Chwyć różdżkę selenitu lub płytkę selenitową. Trzymając ją 10–15 cm od ciała, wykonuj długie, spokojne zamiatające ruchy — od góry w dół, zawsze w jednym kierunku. Selenit naturalnie rozbija bloki energetyczne i przywraca przepływ świetlny w aurze. Czyść różdżkę raz w tygodniu słońcem lub dźwiękiem.',
  },
  {
    id: 'sound_clear',
    label: 'Czyszczenie dźwiękiem',
    color: '#93C5FD',
    icon: Music,
    desc: 'Uderz w miskę tybetańską lub dzwonek na odległość wyciągniętej ręki od ciała i obchodź się wokół siebie zgodnie z ruchem wskazówek zegara. Zatrzymaj się w miejscach, gdzie dźwięk wydaje się "gęsty" lub szybko wygasa. Tam jest blok. Powtarzaj dźwięk w tym miejscu do momentu, aż nabierze pełni i rozbrzmewa swobodnie.',
  },
  {
    id: 'smoke',
    label: 'Okadzanie (smudging)',
    color: '#86EFAC',
    icon: Wind,
    desc: 'Zapal pęczek szałwii, palo santo lub lawendy. Wymachując piórem lub dłonią, kieruj dym wokół całego ciała — zacznij od stóp, przesuwaj w górę po zewnętrznej stronie obu nóg, przez tułów, ręce i kończąc na głowie. Okrążaj głowę trzy razy z intencją oczyszczenia wszystkich trzech aspektów: ciało, myśl, duch.',
  },
  {
    id: 'salt_water',
    label: 'Moczenie stóp w soli',
    color: '#6EE7F7',
    icon: Droplet,
    desc: 'Napełnij miednicę ciepłą wodą i dodaj trzy pełne garście soli morskiej lub himalajskiej. Zanurz stopy na 20 minut. Stopy to główne "porty wejściowe" energii — przez podeszwy pobieramy energię ziemi, ale też wchłaniamy to, co leży na powierzchniach, po których chodzimy. Sól odciąga wszystko, co zbędne. Po zakończeniu opłucz stopy zimną wodą.',
  },
] as const;

// ── OCZYSZCZANIE PRZESTRZENI ──────────────────────────────────
const SPACE_TOOLS = [
  { label: 'Sól himalajska', color: '#FDE68A', icon: Droplet, use: 'Rozsyp wzdłuż progów i parapetów — blokuje napływ gęstych energii z zewnątrz.' },
  { label: 'Szałwia / Palo Santo', color: '#86EFAC', icon: Leaf, use: 'Okadzanie każdego kąta pomieszczenia, szczególnie za drzwiami i oknami.' },
  { label: 'Dzwonek lub miska', color: '#93C5FD', icon: Music, use: 'Dźwięk rozbija energię stagnacji nagromadzoną w kątach i pod meblami.' },
  { label: 'Kryształy: turmalin, obsydian', color: '#A78BFA', icon: Gem, use: 'Ustaw w czterech rogach pomieszczenia lub przy wejściu jako ochrona.' },
];

const SPACE_ROOMS = [
  { room: 'Przedpokój', icon: Home, instructions: 'To pierwsze pole energetyczne wchodzące do domu. Oczyść progi solą. Zawieś dzwoneczek przy drzwiach. Usuń zbędne buty i płaszcze, które "niosą" energie z zewnątrz. Okadź wejście przed i po.' },
  { room: 'Sypialnia', icon: MoonStar, instructions: 'Oczyszczanie sypialni robi się przed snem. Okadź narożniki od sufitu do podłogi. Pod łóżkiem połóż czarny turmalin lub obsydian. Rozstaw krystaliczny kwarc na parapecie — pochłania napięcia w czasie snu.' },
  { room: 'Salon / kuchnia', icon: Flame, instructions: 'Miejsca o dużym przepływie ludzi gromadzą nawarstwiające się energie rozmów, emocji i konfliktów. Oczyszczaj co dwa tygodnie. Szczególna uwaga na kąty, przestrzeń pod sofą i blat kuchenny.' },
  { room: 'Biuro / praca', icon: Brain, instructions: 'Energetyczny bałagan w miejscu pracy objawia się jako niemoc twórcza i prokrastynacja. Postaw na biurku ametyst lub kwarc dymny. Okadź po każdym trudnym spotkaniu lub konflikcie.' },
];

// ── OCZYSZCZANIE ŻYWIOŁAMI ────────────────────────────────────
const ELEMENTAL_METHODS = [
  {
    element: 'Ziemia',
    symbol: '🜃',
    color: '#86EFAC',
    icon: Leaf,
    method: 'Kąpiel solna',
    duration: '30 min',
    instructions: 'Wsyp 2 filiżanki soli himalajskiej do ciepłej wanny. Dodaj 5 kropli olejku cederowego lub sandałowego. Zanurzając się, wypowiedz: "Oddaję Ziemi wszystko, czego nie potrzebuję." Wyobraź sobie, że sól wchłania ciężar jak czarna gleba — pochłania, transformuje, uzdrawia. Spłucz zimną wodą na koniec i zostań 3 minuty w ciszy.',
    intention: 'Uziemienie, uwolnienie fizycznych napięć, powrót do ciała',
  },
  {
    element: 'Woda',
    symbol: '🜄',
    color: '#6EE7F7',
    icon: Droplets,
    method: 'Rytuał zimnej wody',
    duration: '10 min',
    instructions: 'Stań pod prysznicem. Zacznij od ciepłej wody, oddychaj spokojnie przez 2 minuty. Następnie powoli obniżaj temperaturę. W momencie gdy woda staje się zimna — zatrzymaj się i wypowiedz: "Puściłam/em to." Wyobraź sobie, jak Woda zmywa wszystkie warstwy napięcia z pola energetycznego. Zakończ 30 sekundami zimnej wody — aktywuje układ nerwowy i rozładowuje pole magnetyczne.',
    intention: 'Oczyszczenie emocjonalne, uwolnienie starych uczuć i wspomnień',
  },
  {
    element: 'Ogień',
    symbol: '🜂',
    color: '#FB923C',
    icon: Flame,
    method: 'Rytuał świecy',
    duration: '20 min',
    instructions: 'Zapal białą lub czarną świecę. Siedź w ciszy, patrząc w płomień przez 5 minut. Weź kartkę i napisz, co chcesz puścić — jedno zdanie lub kilka słów. Powiedz na głos: "Ogień transformuje, nie niszczy. Oddaję Ci to, co mnie trzyma." Spal kartkę w płomieniu świecy (bezpiecznie — nad zlewem lub metalową misą). Obserwuj dym unoszący się w górę. Świecę dogaś (nie dmuchaj — zdmuchiwanie rozsiewa energię), dopiero gdy poczujesz spokój.',
    intention: 'Transformacja, spalenie starych wzorców, rytuał domknięcia',
  },
  {
    element: 'Powietrze',
    symbol: '🜁',
    color: '#C4B5FD',
    icon: Wind,
    method: 'Oddech i okadzanie',
    duration: '15 min',
    instructions: 'Usiądź przy otwartym oknie lub na zewnątrz. Weź 10 głębokich oddechów — z każdym wydechem wyobraź sobie, że wypuszczasz szary dym (napięcie, ciężar). Zapal palo santo lub kadzidło. Dym jest nośnikiem intencji — pozwól mu unosić się swobodnie, nie kieruj go. W myśli wyślij intencję: "Powietrze odnawia, oczyszcza, przynosi świeżość." Zostań w tej przestrzeni jeszcze 5 minut po zgaszeniu.',
    intention: 'Oczyszczenie umysłu, uwolnienie myśli i przekonań, odnowienie przepływu',
  },
] as const;

// ── RYTUAŁ PRZECIĘCIA SZNURÓW ─────────────────────────────────
const CORD_CUTTING_STEPS = [
  {
    num: '01',
    title: 'Nazwij połączenie',
    desc: 'Usiądź w ciszy. Pomyśl o osobie, sytuacji lub schemacie, który Cię drenuje. Nie osądzaj — po prostu nazwij: "Jestem połączona/y sznurem energetycznym z ______."',
  },
  {
    num: '02',
    title: 'Poczuj sznur',
    desc: 'Zamknij oczy. Gdzie w ciele czujesz to połączenie? Splot słoneczny? Serce? Gardło? Połóż dłoń na tym miejscu i oddychaj spokojnie przez minutę.',
  },
  {
    num: '03',
    title: 'Wyobraź sznur',
    desc: 'Zwizualizuj sznur, linę lub nić łączącą Cię z tą osobą/sytuacją. Jaki ma kolor? Jak gruba jest ta linia? Jaka jest jej faktura? Im dokładniej widzisz, tym głębsza praca.',
  },
  {
    num: '04',
    title: 'Wezwij narzędzie',
    desc: 'Wyobraź sobie nożyczki ze złotego lub srebrnego metalu — lub miecz ze światła. Trzymasz je pewnie. To Twoje narzędzie — stworzone dokładnie dla tej chwili.',
  },
  {
    num: '05',
    title: 'Przecięcie',
    desc: 'Jednym spokojnym, pewnym ruchem — przecinasz. Nie z agresji, ale ze spokojnej stanowczości. W momencie cięcia powiedz: "Zwalniam Cię. Zwalniam siebie. Jesteśmy wolni."',
  },
  {
    num: '06',
    title: 'Rana świetlna',
    desc: 'Tam, gdzie był sznur — zobaczysz ranę lub dziurę. Wyobraź sobie złote lub szmaragdowe światło, które powoli wypełnia to miejsce. Czujesz ciepło, pełnię i spokój.',
  },
  {
    num: '07',
    title: 'Domknięcie',
    desc: 'Oddychaj. Poczuj, że miejsce po sznurze jest teraz pełne Twojej własnej energii. Powiedz: "To, co moje — wraca do mnie. To, co nie moje — odchodzi w pokoju."',
  },
] as const;

// ── HARMONOGRAM KSIĘŻYCOWY ────────────────────────────────────
const LUNAR_SCHEDULE = [
  {
    phase: 'Nów',
    symbol: '🌑',
    color: '#A78BFA',
    timing: 'Każde 28–30 dni',
    practices: [
      'Głęboka kąpiel solna z czarną solą i węglem aktywnym',
      'Spalenie kartki ze starymi przekonaniami i wzorcami',
      'Cisza przez 30 minut — bez telefonu, bez dźwięku',
      'Ustawienie nowej intencji cyklu: czym chcę wypełnić tę przestrzeń?',
    ],
    affirmation: 'Jestem pustą misą gotową na nowe. Oczyszczam się do fundamentu.',
  },
  {
    phase: 'Pełnia',
    symbol: '🌕',
    color: '#FDE68A',
    timing: 'Każde 28–30 dni (po nowiu)',
    practices: [
      'Rytuał przecięcia sznurów energetycznych do drenujących relacji',
      'Wystawienie kryształów na światło księżyca przez noc',
      'Oczyszczanie przestrzeni dźwiękiem i okadzaniem',
      'Ceremonię wdzięczności — co wzrosło od nowiu? Co teraz puszczasz?',
    ],
    affirmation: 'W pełni swojej mocy, puszczam to, co swój czas już przeżyło.',
  },
  {
    phase: 'Przesilenie letnie / zimowe',
    symbol: '☀',
    color: '#FB923C',
    timing: '21 czerwca / 21 grudnia',
    practices: [
      'Przesilenie letnie: uwolnij to, co wyrosło za duże — przytnij, puść nadmiar energii',
      'Przesilenie zimowe: głębokie oczyszczenie przed nowym słonecznym cyklem',
      'Medytacja przy ogniu (świeca lub ognisko) przez min. 20 minut',
      'Odnowienie ochronnych symboli lub kryształów w domu',
    ],
    affirmation: 'Stoję w punkcie zwrotnym. Oddaję cień, zapraszam światło.',
  },
  {
    phase: 'Równonoc wiosenna / jesienna',
    symbol: '⚖',
    color: ACCENT,
    timing: '20 marca / 22 września',
    practices: [
      'Równonoc: oczyszczanie progu — dosłowne i energetyczne mycie podłóg solną wodą',
      'Przegląd i oczyszczenie kryształów, amuletów i narzędzi duchowych',
      'Rytuał równowagi: co oddaję, co zatrzymuję — zapis i ceremoniczne spalenie',
      'Spacer w naturze z intencją: obserwuj, co natura uwalnia lub kwitnie',
    ],
    affirmation: 'Jestem w równowadze między dawaniem a przyjmowaniem.',
  },
] as const;

// ── OCHRONA PO OCZYSZCZENIU ───────────────────────────────────
const PROTECTION_PRACTICES = [
  {
    id: 'shield',
    label: 'Wizualizacja tarczy',
    color: '#60A5FA',
    icon: Shield,
    desc: 'Zamknij oczy. Weź trzy głębokie oddechy. Wyobraź sobie złote lub niebieskie światło, które zaczyna się w centrum klatki piersiowej. Przy każdym wdechu — rośnie, rozszerza się, aż otoczy całe ciało w odległości 50 cm. To Twoja tarcza energetyczna. Jest przepuszczalna dla miłości i prawdy, nieprzepuszczalna dla cudzej złości, strachu i drenażu. Powiedz: "Jestem chroniona/y. Moje pole jest moje." Rób to codziennie rano przez 2 minuty.',
  },
  {
    id: 'crystal_grid',
    label: 'Kryształowa siatka ochrony',
    color: '#A78BFA',
    icon: Gem,
    desc: 'Potrzebujesz 4 czarnych turmalinów (lub obsydianów) i jednego centrum — przezroczystego kwarcu. Umieść kwarc w centrum swojej przestrzeni lub na ołtarzu. Cztery turmaliny ustaw na północy, południu, wschodzie i zachodzie (możesz użyć kompasu). Aktywuj siatkę rysując wyobraźnią linię połączenia od centrum przez każdy kamień i z powrotem. Powiedz: "Ta przestrzeń jest oczyszczona i chroniona." Naładuj siatkę raz w miesiącu na pełni.',
  },
  {
    id: 'affirmation_seal',
    label: 'Pieczęć afirmacyjna',
    color: ACCENT,
    icon: Sparkles,
    desc: 'Stań prosto, stopy na szerokość bioder. Połóż prawą dłoń na sercu. Powoli, wyraźnie wypowiedz na głos trzy razy: "Moje pole energetyczne jest czyste, silne i chronione. Wpuszczam do swojej przestrzeni tylko to, co mnie wspiera i karmię. Wszystko inne — przemija poza moją orbitą." Po każdym powtórzeniu rób krótką przerwę i czuj wibrację tych słów w klatce piersiowej. To jest Twoja pieczęć. Używaj jej po każdej sesji oczyszczania.',
  },
] as const;

// ── HARMONOGRAM MIESIĘCZNY (DZIENNIK OCZYSZCZEŃ) ──────────────
type CleansingLogEntry = {
  id: string;
  date: string;
  type: string;
  duration: number;
  energyBefore: number;
  energyAfter: number;
  notes: string;
};

export const CleansingScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeName, experience, setExperience, ambientSoundEnabled, setAmbientSoundEnabled, audioRuntimeState, audioRuntimeMessage, addFavoriteItem, isFavoriteItem, removeFavoriteItem, shadowWorkSessions } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const audioReady = audioRuntimeState !== 'initializing' && audioRuntimeState !== 'failed';
  const aiAvailable = AiService.isLaunchAvailable();
  const aiState = AiService.getLaunchAvailabilityState();
  const [selectedBurden, setSelectedBurden] = useState<typeof BURDENS[number]['id']>('fear');
  const [story, setStory] = useState('');
  const [showSaveCta, setShowSaveCta] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [synastryCopy, setSynastryCopy] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const burdensContainerY = useRef(0);
  const burdenItemYs = useRef<{ [id: string]: number }>({});

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Stop ambient sound when leaving screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        void AudioService.pauseAmbientSound();
      };
    }, [])
  );

  const cleansingRituals = useMemo(() => RITUALS.filter(r => r.category === 'Cleansing'), []);
  const activeBurden = BURDENS.find(b => b.id === selectedBurden)!;

  const ritualFrame = useMemo(() => {
    if (selectedBurden === 'attachments') return { title: 'Rytuał odcięcia i miękkiego odwiązania', body: 'Najpierw nazwij, do czego nadal wracasz z przymusu. Potem rozdziel pamięć od tego, co nadal zasila Twoją teraźniejszość.' };
    if (selectedBurden === 'karma') return { title: 'Rytuał uwolnienia ciężaru i starej narracji', body: 'Tu nie chodzi o magiczne skasowanie historii. Chodzi o świadome oddanie temu ciężarowi granic i zamknięcie tego, co nie jest już Twoją odpowiedzialnością.' };
    if (selectedBurden === 'protection') return { title: 'Rytuał ochrony i przywrócenia granic', body: 'Najpierw wracasz do ciała, potem do oddechu, a dopiero na końcu wzmacniasz granice między sobą a tym, co Cię drenuje.' };
    if (selectedBurden === 'clutter') return { title: 'Rytuał porządku energetycznego', body: 'Oczyszczanie bałaganu zaczyna się od rozsortowania: co jest Twoje, a co niesiesz tylko z przyzwyczajenia lub z cudzego napięcia.' };
    return { title: 'Rytuał oczyszczenia i odzyskania przejrzystości', body: 'Oczyszczanie jest drogą do lżejszego kontaktu z własnym środkiem. Chodzi o porządek i oddech, nie o dramat.' };
  }, [selectedBurden]);

  const handleSoundSelect = (id: typeof SOUNDSCAPES[number]['id']) => {
    setExperience({ ambientSoundscape: id });
    if (!ambientSoundEnabled) setAmbientSoundEnabled(true);
    AudioService.playAmbientSound(id);
    AudioService.playTouchTone('confirm');
  };

  const isLight = currentTheme.background.startsWith('#F');
  const isDark = !isLight;
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(52,211,153,0.12)';

  // ── ENERGIE DNIA ─────────────────────────────────────────────
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const dayEnergy = DAY_ENERGY[dayOfWeek];
  const moonPhaseIdx = getMoonPhaseIndex(today);
  const moonPhase = MOON_PHASES[moonPhaseIdx];

  // ── AFIRMACJA OCZYSZCZENIA (dzień tygodnia) ───────────────────
  const dailyAffirmation = CLEANSING_AFFIRMATIONS[dayOfWeek];

  // ── DZIENNIK UWALNIANIA — ciężary uwolnione w tym tygodniu ──
  const weeklyReleaseCount = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const sessions = (shadowWorkSessions ?? []) as any[];
    return sessions.filter(s => {
      const d = new Date(s.createdAt ?? s.date ?? 0);
      return d >= weekStart;
    }).length;
  }, [shadowWorkSessions]);

  const weeklyMessage = useMemo(() => {
    if (weeklyReleaseCount === 0) return 'Jeszcze nie zaczęłaś/eś tej tygodniowej podróży oczyszczenia. Każdy krok się liczy.';
    if (weeklyReleaseCount === 1) return 'Już jeden ciężar za sobą. To więcej, niż większość osób robi w tygodniu.';
    if (weeklyReleaseCount <= 3) return `${weeklyReleaseCount} sesje oczyszczenia w tym tygodniu. Twoje pole energetyczne jest w ruchu.`;
    return `${weeklyReleaseCount} sesji — systematyczna praca z oczyszczeniem przynosi trwałe zmiany.`;
  }, [weeklyReleaseCount]);

  // ── PROTOKÓŁ TYGODNIOWY — 7 dni ──────────────────────────────
  const weeklyDays = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);
      const sessions = (shadowWorkSessions ?? []) as any[];
      const didCleanse = sessions.some(s => {
        const sd = new Date(s.createdAt ?? s.date ?? 0);
        return sd >= d && sd < nextDay;
      });
      const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];
      days.push({ label: dayNames[d.getDay()], date: d.getDate(), active: didCleanse, isToday: i === 0 });
    }
    return days;
  }, [shadowWorkSessions]);

  return (
    <View style={[cs.container, { backgroundColor: currentTheme.background }]}>
      <CleansingBackground color={ACCENT} isLight={isLight} />
      <SafeAreaView edges={['top']} style={cs.safe}>
        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0} style={cs.safe}>
          <ScrollView ref={scrollRef} contentContainerStyle={[cs.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') + 110 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* NAV */}
            <View style={[cs.nav, { justifyContent: 'space-between' }]}>
              <Pressable onPress={() => navigation.canGoBack() ? navigation.goBack() : null} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ChevronLeft color={ACCENT} size={22} strokeWidth={1.8} />
                <Typography variant="microLabel" color={ACCENT} style={{ marginLeft: 6 }}>Wróć</Typography>
              </Pressable>
              <Pressable
                onPress={() => { if (isFavoriteItem('cleansing')) { removeFavoriteItem('cleansing'); } else { addFavoriteItem({ id: 'cleansing', label: 'Oczyszczanie', route: 'Cleansing', params: {}, icon: 'Wind', color: ACCENT, addedAt: new Date().toISOString() }); } }}
                style={{ padding: 8 }}
                hitSlop={12}
              >
                <Star color={isFavoriteItem('cleansing') ? ACCENT : ACCENT + '88'} size={18} strokeWidth={1.8} fill={isFavoriteItem('cleansing') ? ACCENT : 'none'} />
              </Pressable>
            </View>

            {/* 3D PURIFICATION ORB */}
            <PurificationOrb isDark={!isLight} />

            {/* HERO */}
            <Animated.View entering={FadeInDown.duration(600)}>
              <View style={cs.hero}>
                <LinearGradient colors={['rgba(52,211,153,0.16)', 'rgba(52,211,153,0.04)']} style={cs.heroGrad} />
                <Typography variant="premiumLabel" color={ACCENT}>OCZYSZCZANIE</Typography>
                <Typography variant="editorialHeader" style={[cs.heroTitle, { color: isLight ? '#1A4A38' : '#D4FFF0' }]}>Uwolnij to, co przykleja się do ciała, myśli i relacji.</Typography>
                <Typography variant="bodySmall" style={[cs.heroCopy, { color: isLight ? '#2A5A46' : undefined }]}>Ta przestrzeń służy uwolnieniu, regulacji, oddechowi i odzyskaniu lekkości. Najpierw pomaga puścić ciężar, zanim wejdziesz w głębszą pracę.</Typography>
                <View style={cs.heroStats}>
                  {[{ v: '5', l: 'Typów ciężaru' }, { v: '5', l: 'Kroków ulgi' }, { v: String(cleansingRituals.length), l: 'Rytuałów' }].map((s, i) => (
                    <React.Fragment key={s.l}>
                      {i > 0 && <View style={cs.statDiv} />}
                      <View style={cs.statCell}>
                        <Typography variant="cardTitle" color={ACCENT}>{s.v}</Typography>
                        <Typography variant="caption" style={cs.statLabel}>{s.l}</Typography>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* ══ ENERGIE DNIA ══ */}
            <Typography variant="premiumLabel" color={ACCENT} style={cs.sectionLabel}>Energie dnia</Typography>
            <Animated.View entering={FadeInDown.delay(80).duration(500)}>
              <View style={[cs.energyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <LinearGradient colors={[ACCENT + '10', 'transparent']} style={cs.heroGrad} />
                {/* Moon phase row */}
                <View style={cs.energyRow}>
                  <View style={[cs.energyIconBox, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '33' }]}>
                    <Typography style={{ fontSize: 22 }}>{moonPhase.symbol}</Typography>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Typography variant="microLabel" color={ACCENT}>FAZA KSIĘŻYCA</Typography>
                    <Typography variant="cardTitle" style={{ color: isLight ? '#1A1A1A' : '#F0EBE2', marginTop: 3 }}>{moonPhase.name}</Typography>
                    <Typography variant="caption" style={{ opacity: 0.72, lineHeight: 18, marginTop: 4 }}>{moonPhase.desc}</Typography>
                  </View>
                </View>
                {/* Day energy divider */}
                <View style={[cs.energyDivider, { backgroundColor: ACCENT + '20' }]} />
                {/* Day energy row */}
                <View style={cs.energyRow}>
                  <View style={[cs.energyIconBox, { backgroundColor: '#FDE68A22', borderColor: '#FDE68A44' }]}>
                    <Sparkles color="#FDE68A" size={20} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Typography variant="microLabel" color="#FDE68A">ENERGIA TYGODNIA</Typography>
                    <Typography variant="caption" style={{ opacity: 0.80, lineHeight: 20, marginTop: 4 }}>{dayEnergy.energy}</Typography>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* BURDEN SELECTOR */}
            <Typography variant="premiumLabel" color={ACCENT} style={cs.sectionLabel}>Nazwij swój ciężar</Typography>
            <View style={{ gap: 10, marginBottom: 16 }} onLayout={(e) => { burdensContainerY.current = e.nativeEvent.layout.y; }}>
              {BURDENS.map((b, idx) => {
                const Icon = b.icon;
                const active = selectedBurden === b.id;
                return (
                  <Animated.View key={b.id} entering={FadeInUp.delay(idx * 60).duration(500)} onLayout={(e) => { burdenItemYs.current[b.id] = e.nativeEvent.layout.y; }}>
                    <Pressable onPress={() => { AudioService.playTouchTone(); setSelectedBurden(b.id); setShowSaveCta(true); const y = burdensContainerY.current + (burdenItemYs.current[b.id] ?? 0) - 60; scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: true }); }}
                      style={[cs.burdenRow, { backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)' }, active && { borderColor: b.color + '88', backgroundColor: b.color + '12' }]}>
                      <View style={[cs.burdenIconCircle, { backgroundColor: b.color + '22', borderColor: b.color + '44' }]}>
                        <Icon color={b.color} size={22} strokeWidth={1.8} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Typography variant="cardTitle" style={{ color: isLight ? '#1A1A1A' : '#F0EBE2', marginBottom: 3 }}>{b.label}</Typography>
                        <Typography variant="caption" style={{ opacity: 0.68, lineHeight: 18 }}>{b.copy}</Typography>
                      </View>
                      {active && <Check color={b.color} size={18} strokeWidth={2.2} />}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            {/* ACTIVE RITUAL FRAME */}
            <Animated.View entering={FadeInDown.duration(500)}>
              <View style={[cs.ritualFrame, { borderColor: activeBurden.color + '44', backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)' }]}>
                <LinearGradient colors={[activeBurden.color + '14', 'transparent']} style={cs.heroGrad} />
                <Typography variant="premiumLabel" color={activeBurden.color}>{ritualFrame.title}</Typography>
                <Typography variant="bodySmall" style={cs.ritualCopy}>{ritualFrame.body}</Typography>
                <View style={[cs.ritualTag, { backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)' }]}>
                  <Typography variant="microLabel" color={activeBurden.color}>Aktywny temat: {activeBurden.label}</Typography>
                </View>
              </View>
            </Animated.View>

            {/* RELEASE STEPS */}
            <Typography variant="premiumLabel" color={ACCENT} style={cs.sectionLabel}>5 kroków ulgi</Typography>
            <View style={[cs.stepsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {RELEASE_STEPS.map((s, i) => (
                <View key={s.step} style={[cs.stepRow, i > 0 && cs.stepBorder]}>
                  <View style={[cs.stepNum, { backgroundColor: ACCENT + '20' }]}>
                    <Typography variant="microLabel" color={ACCENT}>{s.step}</Typography>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="cardTitle" style={cs.stepTitle}>{s.title}</Typography>
                    <Typography variant="caption" style={cs.stepCopy}>{s.copy}</Typography>
                  </View>
                </View>
              ))}
            </View>

            {/* ══ TECHNIKI OCZYSZCZANIA ══ */}
            <Typography variant="premiumLabel" color={ACCENT} style={cs.sectionLabel}>Techniki oczyszczania</Typography>
            <View style={{ gap: 12, marginBottom: 4 }}>
              {CLEANSING_TECHNIQUES.map((tech, idx) => {
                const Icon = tech.icon;
                return (
                  <Animated.View key={tech.id} entering={FadeInUp.delay(idx * 70).duration(500)}>
                    <View style={[cs.techniqueCard, { backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)', borderColor: tech.color + '33' }]}>
                      <LinearGradient colors={[tech.color + '0C', 'transparent']} style={cs.heroGrad} />
                      <View style={cs.techniqueHeader}>
                        <View style={[cs.techniqueIconBox, { backgroundColor: tech.color + '1A', borderColor: tech.color + '44' }]}>
                          <Icon color={tech.color} size={20} strokeWidth={1.8} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Typography variant="premiumLabel" color={tech.color}>{tech.label}</Typography>
                          <Typography variant="microLabel" style={{ opacity: 0.65, marginTop: 2 }}>{tech.short}</Typography>
                        </View>
                      </View>
                      <View style={[cs.techniqueDivider, { backgroundColor: tech.color + '20' }]} />
                      <Typography variant="caption" style={{ lineHeight: 20, opacity: 0.82 }}>{tech.instructions}</Typography>
                    </View>
                  </Animated.View>
                );
              })}
            </View>

            {/* STORY INPUT */}
            <Typography variant="premiumLabel" color={ACCENT} style={cs.sectionLabel}>Opisz swój ciężar</Typography>
            <View style={[cs.inputCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Typography variant="caption" style={cs.inputHint}>Nie potrzebujesz długiej historii. Jedno spokojne zdanie wystarczy, jeśli jest prawdziwe.</Typography>
              <MysticalInput
                value={story}
                onChangeText={setStory}
                placeholder="Napisz, co trzyma Cię dziś w lęku, ciężarze lub rozproszeniu..."
                multiline
                textAlignVertical="top"
                containerStyle={{ marginTop: 10 }}
                style={{ minHeight: 80, color: currentTheme.text, fontSize: 15, lineHeight: 24 }}
                onFocusScroll={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
              />
            </View>

            {/* SOUNDSCAPE */}
            <Typography variant="premiumLabel" color={ACCENT} style={cs.sectionLabel}>Pejzaż ulgi</Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 4, marginBottom: 8 }}>
              {SOUNDSCAPES.map(sc => {
                const active = experience.ambientSoundscape === sc.id;
                return (
                  <Pressable key={sc.id} disabled={!audioReady} onPress={() => handleSoundSelect(sc.id)}
                    style={[cs.soundChip, { backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)' }, active && { borderColor: ACCENT, backgroundColor: ACCENT + '18' }, !audioReady && { opacity: 0.45 }]}>
                    <Typography variant="microLabel" color={active ? ACCENT : currentTheme.textMuted}>{sc.label}</Typography>
                    <Typography variant="caption" style={[cs.soundSub, active && { color: ACCENT + 'CC' }]}>{sc.sub}</Typography>
                  </Pressable>
                );
              })}
            </ScrollView>
            {!audioReady && <Typography variant="caption" style={cs.audioNote}>{audioRuntimeState === 'initializing' ? 'Audio uruchamia się...' : audioRuntimeMessage || 'Audio chwilowo niedostępne.'}</Typography>}

            {/* ══ AFIRMACJA OCZYSZCZENIA ══ */}
            <Typography variant="premiumLabel" color={ACCENT} style={cs.sectionLabel}>Afirmacja oczyszczenia</Typography>
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <View style={[cs.affirmationCard, { backgroundColor: isLight ? 'rgba(52,211,153,0.06)' : 'rgba(52,211,153,0.08)', borderColor: ACCENT + '33' }]}>
                <LinearGradient colors={[ACCENT + '14', ACCENT + '04']} style={cs.heroGrad} />
                <View style={cs.affirmationBadgeRow}>
                  <View style={[cs.affirmationBadge, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '44' }]}>
                    <Typography variant="microLabel" color={ACCENT}>✦ AFIRMACJA NA {dayEnergy.day.toUpperCase()}</Typography>
                  </View>
                </View>
                <Typography variant="bodyRefined" style={[cs.affirmationText, { color: isLight ? '#1A4A38' : '#D4FFF0' }]}>
                  "{dailyAffirmation}"
                </Typography>
                <Typography variant="caption" style={{ opacity: 0.65, marginTop: 10, lineHeight: 18 }}>
                  Przeczytaj ją na głos trzy razy. Połóż dłoń na sercu i poczuj, jak te słowa rezonują w ciele.
                </Typography>
              </View>
            </Animated.View>

            {/* RITUALS */}
            <Typography variant="premiumLabel" color={ACCENT} style={cs.sectionLabel}>Rytuały oczyszczania</Typography>
            {cleansingRituals.map((r, idx) => (
              <Animated.View key={r.id} entering={FadeInUp.delay(idx * 80).duration(500)}>
                <Pressable style={cs.ritualCard} onPress={() => navigation.navigate('RitualDetail', { ritual: r, source: 'cleansing' })}>
                  <View style={{ flex: 1 }}>
                    <Typography variant="premiumLabel" color={ACCENT}>{r.title}</Typography>
                    <Typography variant="bodySmall" style={cs.ritualCardCopy}>{r.description}</Typography>
                    <View style={cs.ritualMeta}>
                      <View style={cs.ritualBadge}><Typography variant="microLabel" color={ACCENT}>{r.duration}</Typography></View>
                      <View style={cs.ritualBadge}><Typography variant="microLabel" color={ACCENT}>{r.difficulty}</Typography></View>
                    </View>
                  </View>
                  <ArrowRight color={ACCENT} size={15} style={{ marginTop: 4 }} />
                </Pressable>
              </Animated.View>
            ))}

            {/* ══ DZIENNIK UWALNIANIA ══ */}
            <Typography variant="premiumLabel" color={ACCENT} style={cs.sectionLabel}>Dziennik uwalniania</Typography>
            <Animated.View entering={FadeInDown.delay(120).duration(500)}>
              <View style={[cs.journalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <LinearGradient colors={['#A78BFA18', 'transparent']} style={cs.heroGrad} />
                <View style={cs.journalCountRow}>
                  <View style={[cs.journalCountBadge, { backgroundColor: '#A78BFA20', borderColor: '#A78BFA44' }]}>
                    <Typography style={{ fontSize: 32, fontWeight: '700', color: '#A78BFA', lineHeight: 40 }}>{weeklyReleaseCount}</Typography>
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Typography variant="premiumLabel" color="#A78BFA">Ciężarów uwolnionych</Typography>
                    <Typography variant="caption" style={{ opacity: 0.65, marginTop: 3 }}>w tym tygodniu</Typography>
                  </View>
                </View>
                <View style={[cs.journalDivider, { backgroundColor: '#A78BFA20' }]} />
                <Typography variant="bodySmall" style={{ lineHeight: 22, opacity: 0.82 }}>{weeklyMessage}</Typography>
              </View>
            </Animated.View>

            {/* ══ PROTOKÓŁ TYGODNIOWY ══ */}
            <Typography variant="premiumLabel" color={ACCENT} style={cs.sectionLabel}>Protokół tygodniowy</Typography>
            <Animated.View entering={FadeInDown.delay(140).duration(500)}>
              <View style={[cs.weekCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Typography variant="caption" style={{ opacity: 0.65, marginBottom: 14, lineHeight: 18 }}>
                  Zielone kółko oznacza dzień, w którym pracowałaś/eś z oczyszczaniem lub cień pracą.
                </Typography>
                <View style={cs.weekRow}>
                  {weeklyDays.map((d, i) => (
                    <View key={i} style={cs.weekDayCol}>
                      <Typography variant="microLabel" style={{ opacity: d.isToday ? 1 : 0.55, color: d.isToday ? ACCENT : undefined, marginBottom: 6 }}>{d.label}</Typography>
                      <View style={[
                        cs.weekDot,
                        { backgroundColor: d.active ? ACCENT + '30' : isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)', borderColor: d.active ? ACCENT : isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)' },
                        d.isToday && !d.active && { borderColor: ACCENT + '66' },
                      ]}>
                        {d.active && <View style={[cs.weekDotInner, { backgroundColor: ACCENT }]} />}
                        {d.isToday && !d.active && <View style={[cs.weekDotInner, { backgroundColor: ACCENT + '55' }]} />}
                      </View>
                      <Typography variant="caption" style={{ opacity: 0.55, marginTop: 5, fontSize: 10 }}>{d.date}</Typography>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* PO OCZYSZCZENIU */}
            <Typography variant="premiumLabel" color={ACCENT} style={cs.sectionLabel}>Po oczyszczeniu</Typography>
            <View style={[cs.afterCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Typography variant="bodySmall" style={cs.afterIntro}>Nie wracaj od razu do halasu. Sprawdź, czy ciało potrzebuje ciszy, jednego zdania, małej granicy czy dopiero dalszej rozmowy.</Typography>
              {AFTERCARE.map((a, i) => {
                const Icon = a.icon;
                return (
                  <Pressable key={a.label} style={[cs.afterRow, i > 0 && cs.afterBorder]}
                    onPress={() => a.route === 'Affirmations'
                      ? navigateToDashboardSurface(navigation, 'support', { supportCategory: 'peace', source: 'cleansing' })
                      : a.route === 'Rituals'
                        ? navigateToDashboardSurface(navigation, 'rituals', { ritualCategory: 'Cleansing' })
                        : a.route === 'JournalEntry'
                          ? navigation.navigate('JournalEntry', { prompt: `Co puściłam/em dziś: ${activeBurden.label}?`, type: 'reflection' })
                          : navigation.navigate(a.route)}>
                    <Icon color={ACCENT} size={16} strokeWidth={1.8} />
                    <View style={cs.afterText}>
                      <Typography variant="microLabel" color={ACCENT}>{a.label}</Typography>
                      <Typography variant="caption" style={cs.afterCopy}>{a.copy}</Typography>
                    </View>
                    <ArrowRight color={ACCENT} size={13} />
                  </Pressable>
                );
              })}
            </View>

            {/* ══ CO DALEJ — extended with SoundBath + Breathwork ══ */}
            <Typography variant="premiumLabel" color={ACCENT} style={cs.sectionLabel}>Co dalej?</Typography>
            <View style={[cs.afterCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Typography variant="caption" style={[cs.afterIntro, { opacity: 0.72 }]}>Oczyszczanie pogłębia się w ruchu, dźwięku i oddechu. Wybierz kolejny krok.</Typography>
              {[
                { icon: Waves, label: 'Kąpiel dźwiękowa', copy: 'Zanurz się w terapeutycznych dźwiękach — misach, deszczu i oceanie.', route: 'SoundBath', color: '#93C5FD' },
                { icon: Droplets, label: 'Praca z oddechem', copy: '6 technik oddechowych do głębokiego oczyszczenia układu nerwowego.', route: 'Breathwork', color: '#86EFAC' },
                { icon: MoonStar, label: 'Praca z cieniem', copy: 'Zbadaj głębsze warstwy tego, co chcesz uwolnić — Jungowskie lustro.', route: 'ShadowWork', color: '#A78BFA' },
                { icon: NotebookPen, label: 'Zapisz intencję', copy: 'Domknij sesję oczyszczenia w dzienniku.', route: 'JournalEntry', color: ACCENT },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <Pressable key={item.label} style={[cs.afterRow, i > 0 && cs.afterBorder]}
                    onPress={() => item.route === 'JournalEntry'
                      ? navigation.navigate('JournalEntry', { prompt: `Po sesji oczyszczenia (${activeBurden.label}): co puściłam/em i co chcę zaprosić w to miejsce?`, type: 'reflection' })
                      : navigation.navigate(item.route)
                    }>
                    <Icon color={item.color} size={16} strokeWidth={1.8} />
                    <View style={cs.afterText}>
                      <Typography variant="microLabel" color={item.color}>{item.label}</Typography>
                      <Typography variant="caption" style={cs.afterCopy}>{item.copy}</Typography>
                    </View>
                    <ArrowRight color={item.color + '88'} size={13} />
                  </Pressable>
                );
              })}
            </View>

            <EndOfContentSpacer size="standard" />
          </ScrollView>
        </KeyboardAvoidingView>

          {/* FLOATING FOOTER — AI CTA */}
          {showSaveCta && (
            <View style={{ position: 'absolute', bottom: keyboardHeight > 0 ? Math.max(insets.bottom + 6, keyboardHeight + 4) : insets.bottom + 10, left: 16, right: 16, zIndex: 20, elevation: 20 }}>
              <Pressable
                style={[cs.aiCta, { backgroundColor: isLight ? 'rgba(240,255,250,0.97)' : 'rgba(10,30,20,0.95)' }]}
                onPress={() =>
                  navigation.navigate('JournalEntry', {
                    prompt: `Chcę puścić: ${activeBurden.label}. ${story || 'Potrzebuję prowadzenia do oczyszczenia i przywrócenia jasności.'}\n\nJaki rytuał uwolnienia naprawdę pomoże mi domknąć ten ciężar i wrócić do klarowności?`,
                    type: 'reflection',
                  })
                }
              >
                <LinearGradient colors={[ACCENT + '28', ACCENT + '10']} style={cs.heroGrad} />
                <Droplets color={ACCENT} size={22} strokeWidth={1.8} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Typography variant="premiumLabel" color={ACCENT}>Zapisz rytuał uwolnienia</Typography>
                  <Typography variant="bodySmall" style={cs.aiCtaCopy}>Domknij oczyszczanie w dzienniku: ciężar, intencja, ochrona i ostatni ruch przywracający jasność.</Typography>
                </View>
                <ArrowRight color={ACCENT} size={16} />
              </Pressable>
              <Pressable
                onPress={() => setShowSaveCta(false)}
                hitSlop={12}
                style={{ position: 'absolute', top: -14, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: isLight ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)' }}
              >
                <X color={isLight ? '#333' : '#fff'} size={14} strokeWidth={2.5} />
              </Pressable>
            </View>
          )}
      </SafeAreaView>
    </View>
  );
};

const cs = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: layout.padding.screen, paddingTop: 4 },
  nav: { flexDirection: 'row', alignItems: 'center', minHeight: 56, marginBottom: 4, paddingTop: 6 },

  hero: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)', padding: 22, overflow: 'hidden', marginBottom: 20 },
  heroGrad: StyleSheet.absoluteFillObject as any,
  heroTitle: { marginTop: 10, lineHeight: 30, color: '#D4FFF0' },
  heroCopy: { marginTop: 8, lineHeight: 21, opacity: 0.78 },
  heroStats: { flexDirection: 'row', marginTop: 18, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(52,211,153,0.2)' },
  statCell: { flex: 1, alignItems: 'center' },
  statLabel: { marginTop: 3, opacity: 0.65, textAlign: 'center' },
  statDiv: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(52,211,153,0.2)', marginHorizontal: 8 },

  sectionLabel: { marginTop: 22, marginBottom: 12 },

  // Energie dnia
  energyCard: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden', marginBottom: 4 },
  energyRow: { flexDirection: 'row', alignItems: 'flex-start' },
  energyIconBox: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  energyDivider: { height: StyleSheet.hairlineWidth, marginVertical: 14 },

  burdenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  burdenCard: { width: '48%', minHeight: 138, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)', padding: 14 },
  burdenIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  burdenCheck: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  burdenLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, color: 'rgba(245,241,234,0.9)' },
  burdenCopy: { lineHeight: 17, opacity: 0.68 },
  burdenRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, minHeight: 76 },
  burdenIconCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  ritualFrame: { borderRadius: 22, borderWidth: 1, padding: 20, overflow: 'hidden', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.05)' },
  ritualCopy: { marginTop: 10, lineHeight: 22, opacity: 0.82 },
  ritualTag: { marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)' },

  stepsCard: { padding: 18, marginBottom: 4, borderRadius: 20, borderWidth: 1 },
  stepRow: { flexDirection: 'row', gap: 14, paddingVertical: 12, alignItems: 'flex-start' },
  stepBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(52,211,153,0.12)' },
  stepNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  stepTitle: { fontSize: 14, marginBottom: 4 },
  stepCopy: { lineHeight: 18, opacity: 0.72 },

  // Techniki oczyszczania
  techniqueCard: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
  techniqueHeader: { flexDirection: 'row', alignItems: 'center' },
  techniqueIconBox: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  techniqueDivider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },

  inputCard: { padding: 18, marginBottom: 4, borderRadius: 20, borderWidth: 1 },
  inputHint: { lineHeight: 18, opacity: 0.72, marginBottom: 10 },
  input: { minHeight: 72, fontSize: 15, lineHeight: 23, textAlignVertical: 'top' },

  soundRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  soundChip: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', minWidth: 72 },
  soundSub: { marginTop: 3, opacity: 0.6 },
  audioNote: { opacity: 0.6, lineHeight: 18, marginBottom: 8 },

  // Afirmacja oczyszczenia
  affirmationCard: { borderRadius: 22, borderWidth: 1, padding: 20, overflow: 'hidden', marginBottom: 4 },
  affirmationBadgeRow: { flexDirection: 'row', marginBottom: 14 },
  affirmationBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  affirmationText: { lineHeight: 28, fontStyle: 'italic', fontSize: 16 },

  aiCta: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)', padding: 16, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 8, overflow: 'hidden' },
  aiCtaCopy: { marginTop: 5, lineHeight: 20, opacity: 0.8 },

  ritualCard: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(52,211,153,0.18)', backgroundColor: 'rgba(52,211,153,0.05)', padding: 18, marginBottom: 10, gap: 12 },
  ritualCardCopy: { marginTop: 6, lineHeight: 20, opacity: 0.78 },
  ritualMeta: { flexDirection: 'row', gap: 8, marginTop: 10 },
  ritualBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(52,211,153,0.12)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)' },

  // Dziennik uwalniania
  journalCard: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden', marginBottom: 4 },
  journalCountRow: { flexDirection: 'row', alignItems: 'center' },
  journalCountBadge: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  journalDivider: { height: StyleSheet.hairlineWidth, marginVertical: 14 },

  // Protokół tygodniowy
  weekCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 4 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDayCol: { alignItems: 'center', flex: 1 },
  weekDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  weekDotInner: { width: 14, height: 14, borderRadius: 7 },

  afterCard: { padding: 18, borderRadius: 20, borderWidth: 1 },
  afterIntro: { lineHeight: 21, opacity: 0.78, marginBottom: 6 },
  afterRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  afterBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(52,211,153,0.1)' },
  afterText: { flex: 1 },
  afterCopy: { marginTop: 4, lineHeight: 18, opacity: 0.72 },
});
