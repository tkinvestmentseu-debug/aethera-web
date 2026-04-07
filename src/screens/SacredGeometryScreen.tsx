// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  Dimensions, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, Ellipse, G, Line, Path, Polygon, Defs,
  RadialGradient, LinearGradient as SvgLinearGradient, Stop,
} from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing, cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Sparkles, BookOpen, ArrowRight, Wand2,
  CheckCircle2, Circle as CircleIcon, Eye, Layers, Zap, Clock,
  ChevronDown, ChevronUp, Target, Gem,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#34D399';

// ── BACKGROUND ────────────────────────────────────────────────
const GeomBg = ({ isDark }: { isDark: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isDark ? ['#030A08', '#050F0B', '#071410'] : ['#ECFDF5', '#D1FAE5', '#A7F3D0']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={700} style={StyleSheet.absoluteFill} opacity={isDark ? 0.12 : 0.07}>
      {Array.from({ length: 5 }, (_, i) => (
        <Circle key={i} cx={SW / 2} cy={200 + i * 80} r={60 + i * 40}
          fill="none" stroke={ACCENT} strokeWidth={0.5} opacity={0.18} />
      ))}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <Line key={'sp' + i}
            x1={SW / 2} y1={60}
            x2={SW / 2 + 300 * Math.cos(a)} y2={60 + 300 * Math.sin(a)}
            stroke={ACCENT} strokeWidth={0.4} opacity={0.10}
          />
        );
      })}
      {Array.from({ length: 20 }, (_, i) => (
        <Circle key={'d' + i} cx={(i * 131 + 20) % SW} cy={(i * 97 + 40) % 680}
          r={i % 5 === 0 ? 1.6 : 0.8} fill={ACCENT} opacity={0.14} />
      ))}
    </Svg>
  </View>
);

// ── 3D SACRED GEOMETRY WIDGET ─────────────────────────────────
const SacredGeomWidget3D = React.memo(({ accent }: { accent: string }) => {
  const rot1  = useSharedValue(0);
  const rot2  = useSharedValue(360);
  const rot3  = useSharedValue(0);
  const pulse = useSharedValue(0.96);
  const tiltX = useSharedValue(-5);
  const tiltY = useSharedValue(0);
  const spiral = useSharedValue(0);

  useEffect(() => {
    rot1.value   = withRepeat(withTiming(360,  { duration: 22000, easing: Easing.linear }), -1, false);
    rot2.value   = withRepeat(withTiming(0,    { duration: 16000, easing: Easing.linear }), -1, false);
    rot3.value   = withRepeat(withTiming(360,  { duration: 35000, easing: Easing.linear }), -1, false);
    pulse.value  = withRepeat(withSequence(withTiming(1.04, { duration: 2800 }), withTiming(0.96, { duration: 2800 })), -1, false);
    spiral.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.out(Easing.cubic) }), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-22, Math.min(22, -5 + e.translationY * 0.16));
      tiltY.value = Math.max(-22, Math.min(22, e.translationX * 0.16));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-5, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: pulse.value },
    ],
  }));
  const ring1Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot1.value}deg` }] }));
  const ring2Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot2.value}deg` }] }));
  const ring3Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot3.value}deg` }] }));

  // Flower of Life: 7 circles (center + 6 around)
  const folCenters = [
    { cx: 0, cy: 0 },
    ...Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return { cx: 38 * Math.cos(a), cy: 38 * Math.sin(a) };
    }),
  ];
  // Metatron's cube lines (connect 13 points)
  const metaOuter = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return { x: 72 * Math.cos(a), y: 72 * Math.sin(a) };
  });
  const metaInner = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    return { x: 36 * Math.cos(a), y: 36 * Math.sin(a) };
  });
  // Outer nodes (12)
  const outerNodes = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { x: 106 * Math.cos(a), y: 106 * Math.sin(a) };
  });
  // Golden ratio spiral path approximation
  const goldenPath = 'M 0,0 Q 12,-12 18,0 Q 24,18 0,28 Q -42,38 -56,0 Q -70,-56 0,-70 Q 72,-84 90,0';

  return (
    <View style={{ alignItems: 'center', marginVertical: 12, height: 260 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: 250, height: 250, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>

          {/* Outer slow ring (12 nodes) */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring3Style]}>
            <Svg width={250} height={250} viewBox="-125 -125 250 250">
              <Circle cx={0} cy={0} r={106} fill="none" stroke={accent + '1A'} strokeWidth={0.8} />
              {outerNodes.map((n, i) => (
                <G key={i}>
                  <Circle cx={n.x} cy={n.y} r={i % 3 === 0 ? 3.5 : 2} fill={accent} opacity={i % 3 === 0 ? 0.75 : 0.40} />
                  {i % 3 === 0 && (
                    <Polygon
                      points={`${n.x},${n.y - 5} ${n.x + 4.3},${n.y + 2.5} ${n.x - 4.3},${n.y + 2.5}`}
                      fill={accent} opacity={0.25}
                    />
                  )}
                </G>
              ))}
            </Svg>
          </Animated.View>

          {/* Metatron's cube lines — counter-rotating */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring2Style]}>
            <Svg width={250} height={250} viewBox="-125 -125 250 250">
              {metaOuter.map((a, i) =>
                metaOuter.map((b, j) => j > i ? (
                  <Line key={`mo-${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={accent} strokeWidth={0.45} opacity={0.22} />
                ) : null)
              )}
              {metaOuter.map((a, i) =>
                metaInner.map((b, j) => (
                  <Line key={`mi-${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={accent} strokeWidth={0.4} opacity={0.16} />
                ))
              )}
              {metaOuter.map((n, i) => (
                <Circle key={i} cx={n.x} cy={n.y} r={3.5} fill={accent} opacity={0.60} />
              ))}
            </Svg>
          </Animated.View>

          {/* Flower of Life — slowly rotating */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring1Style]}>
            <Svg width={250} height={250} viewBox="-125 -125 250 250">
              {folCenters.map((c, i) => (
                <Circle key={i} cx={c.cx} cy={c.cy} r={38}
                  fill="none" stroke={accent} strokeWidth={0.85}
                  opacity={i === 0 ? 0.65 : 0.42}
                />
              ))}
              <Circle cx={0} cy={0} r={76} fill="none" stroke={accent + '55'} strokeWidth={0.7} />
            </Svg>
          </Animated.View>

          {/* Center golden spiral (static) */}
          <Svg width={250} height={250} viewBox="-125 -125 250 250" style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="gemGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#F0FDF4" stopOpacity="0.9" />
                <Stop offset="50%" stopColor={accent} stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#065F46" stopOpacity="0.8" />
              </RadialGradient>
            </Defs>
            <Path d={goldenPath} fill="none" stroke="#F6C90E" strokeWidth={1.4} opacity={0.45} strokeDasharray="3 6" />
            <Circle cx={0} cy={0} r={18} fill="url(#gemGrad)" />
            <Circle cx={0} cy={0} r={18} fill="none" stroke={accent} strokeWidth={1} opacity={0.70} />
            <Circle cx={0} cy={0} r={10} fill="none" stroke="#F6C90E" strokeWidth={0.8} opacity={0.55} />
            {/* Star of David inner */}
            {Array.from({ length: 6 }, (_, i) => {
              const a = (i / 6) * Math.PI * 2;
              const a2 = a + Math.PI / 6;
              return (
                <Line key={i} x1={12 * Math.cos(a)} y1={12 * Math.sin(a)}
                  x2={12 * Math.cos(a2 + Math.PI / 3)} y2={12 * Math.sin(a2 + Math.PI / 3)}
                  stroke={accent} strokeWidth={0.7} opacity={0.40}
                />
              );
            })}
            <Circle cx={0} cy={0} r={24} fill="none" stroke={accent + '30'} strokeWidth={0.6} />
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

// ── PATTERN DATA ──────────────────────────────────────────────
interface GeomPattern {
  id: string;
  name: string;
  origin: string;
  meaning: string;
  meditation: string;
  chakra: string;
  element: string;
  numbers: { n: number; desc: string }[];
  drawingSteps: string[];
  guideSteps: string[];
  color: string;
}

const PATTERNS: GeomPattern[] = [
  {
    id: 'flower_of_life',
    name: 'Kwiat Życia',
    origin: 'Starożytny Egipt, Chiny, Indie',
    meaning: 'Kwiat Życia to jeden z najświętszych wzorców geometrycznych znanych ludzkości. Zawiera w sobie matematyczny kod całego stworzenia — każdą żywą istotę, każdą formę w kosmosie. Jest mapą pola morfogenetycznego, z którego wyłania się materia. Medytowanie z nim otwiera na rozumienie jedności wszystkich form życia i nienaruszalnego porządku stworzenia.',
    meditation: 'Skup wzrok na centralnym kole. Pozwól, aby obraz rozszerzał się koncentrycznie ku zewnętrzu. Wyobraź sobie, że każde koło to oddzielna istota, a punkty ich zetknięcia to miejsca miłości.',
    chakra: 'Anahata (serce)',
    element: 'Eter / Akasha',
    numbers: [
      { n: 7,  desc: 'Siedem kół tworzy rdzeń — liczba pełni i duchowego ukończenia' },
      { n: 6,  desc: 'Sześcioramienna symetria — równowaga i harmonia sił' },
      { n: 19, desc: 'Dziewiętnaście kół w pełnym wzorze — cykl Metatona' },
    ],
    drawingSteps: [
      'Narysuj centralny okrąg i zaznacz jego środek',
      'Narysuj sześć okręgów tej samej średnicy z centrum na obwodzie pierwszego',
      'Każdy z nowych okręgów przechodzi przez środek centralnego',
      'Kolejna warstwa: kolejne sześć okręgów z centrum na obwodzie — razem 19',
      'Obrysuj zewnętrzny okrąg obejmujący cały wzorzec',
    ],
    guideSteps: [
      'Usiądź w wygodnej pozycji z wzorcem przed oczami lub wyobraź go sobie',
      'Zamknij oczy i wyobraź sobie centralny okrąg jako swoje serce',
      'Pozwól sześciu kołom rozszerzać się — każde z nich to ktoś, kogo kochasz',
      'Poczuj, jak wszystkie koła przenikają się — granice między tobą a innymi się zacierają',
      'Przez 5 minut oddychaj rytmicznie, wyobrażając sobie, że wzorzec oddycha razem z tobą',
    ],
    color: ACCENT,
  },
  {
    id: 'seed_of_life',
    name: 'Ziarno Życia',
    origin: 'Kabała, chrześcijaństwo gnostyckie',
    meaning: 'Ziarno Życia to siedem nakładających się kół tworzących centralny wzorzec Kwiatu Życia. Symbolizuje siedem dni stworzenia według tradycji judeochrześcijańskiej. Każde koło to jeden dzień, jeden tok energii kosmicznego powołania do istnienia. Jest to najpierwotniejszy wzorzec — pierwsze tchnienie formy wyłaniające się z bezformy.',
    meditation: 'Wyobraź sobie, że jesteś centralnym kołem. Wokół ciebie sześć kół — sześć wymiarów doświadczenia. Czujesz je wszystkie jednocześnie.',
    chakra: 'Sahasrara (korona)',
    element: 'Świetlisty Eter',
    numbers: [
      { n: 7,  desc: 'Siedem kół — siedem dni stworzenia, siedem nut, siedem chakr' },
      { n: 3,  desc: 'Trzy trójkąty wewnętrzne — Święta Trójca formy' },
      { n: 6,  desc: 'Sześć zewnętrznych kół wokół centrum — sześć kierunków przestrzeni' },
    ],
    drawingSteps: [
      'Narysuj centralny okrąg',
      'Umieść sześć okręgów tej samej wielkości wzdłuż obwodu centralnego',
      'Każdy kolejny okrąg zaczyna się od punktu przecięcia poprzednich',
      'Połącz liniami wszystkie siedem środków — tworzą heksagram',
      'Podkreśl obszary przecięcia — to "płatki" Ziarna Życia',
    ],
    guideSteps: [
      'Patrz na centralny punkt wzorca przez 30 sekund bez mrugania',
      'Poczuj, jak wzrok "wchodzi" w głąb wzorca — jakby miał głębię',
      'Przywołaj intencję lub pragnienie i umieść je mentalnie w centrum',
      'Przez 3 oddechy wyobraź sobie to pragnienie rozrastające się w sześć stron',
      'Zamknij oczy i utrzymuj obraz przez kolejne 5 minut',
    ],
    color: '#818CF8',
  },
  {
    id: 'vesica_piscis',
    name: 'Vesica Piscis',
    origin: 'Starożytna Grecja, geometria pitagorejska',
    meaning: 'Vesica Piscis — "rybi pęcherz" — to obszar przecięcia dwóch równych okręgów, których środki leżą na swoich obwodach. Symbolizuje spotkanie dwóch światów: materialnego i duchowego, żeńskiego i męskiego, widzialnego i niewidzialnego. Jest bramą narodzin — każda nowa forma wyłania się z vesica piscis. W tradycji chrześcijańskiej ten kształt otaczał Chrystusa na ikonach.',
    meditation: 'Wyobraź sobie dwa światy: świat wewnętrzny i zewnętrzny. Zamieszkaj w przestrzeni ich przecięcia — to tam jesteś naprawdę.',
    chakra: 'Ajna (trzecie oko)',
    element: 'Woda',
    numbers: [
      { n: 2,  desc: 'Dwa okręgi — dualność i jej przekroczenie przez spotkanie' },
      { n: 265, desc: 'Stosunek 265/153 — przybliżenie pierwiastka z 3, proporcja boskości' },
      { n: 153, desc: 'Liczba ryb w sieci — symbol vesica piscis w Ewangelii Jana' },
    ],
    drawingSteps: [
      'Narysuj pierwszy okrąg i zaznacz jego środek (punkt A)',
      'Środek drugiego okręgu umieść dokładnie na obwodzie pierwszego (punkt B)',
      'Oba okręgi mają identyczną średnicę',
      'Obszar przecięcia — mandorla — to właśnie Vesica Piscis',
      'Połącz dwa punkty przecięcia linią prostopadłą — uzyskasz "oś świata"',
    ],
    guideSteps: [
      'Skup uwagę na obszarze przecięcia — mandorli w centrum wzorca',
      'Oddycha lewy krąg — wyobraź sobie to, co widzisz w świecie zewnętrznym',
      'Oddycha prawy krąg — wyobraź sobie to, co czujesz w sobie',
      'Przenieś świadomość do punktu przecięcia — tam te dwa światy stają się jednym',
      'Siedź w tym punkcie środkowym przez 7 pełnych oddechów',
    ],
    color: '#60A5FA',
  },
  {
    id: 'golden_spiral',
    name: 'Złota Spirala',
    origin: 'Matematyka pitagorejska, natura',
    meaning: 'Złota Spirala wyrasta ze Złotego Podziału (φ = 1.618…) — jedynej proporcji, która odtwarza siebie w nieskończoność. Pojawia się w muszlach ślimaków, układzie liści, spiralach galaktyk. Symbolizuje kosmiczny wzorzec wzrostu — świadomość, która rośnie spiralnie, nigdy prostoliniowo. Każdy poziom zawiera wszystkie poprzednie.',
    meditation: 'Wyobraź sobie, że jesteś w środku spirali. Z każdym wydechem rozwijasz się o jeden obrót. Twoja świadomość rośnie, nie opuszczając centrum.',
    chakra: 'Manipura (splot słoneczny)',
    element: 'Ogień',
    numbers: [
      { n: 1618, desc: 'φ = 1,618 — Złoty Podział, proporcja universum' },
      { n: 144,  desc: '144 — liczba Fibonacciego pojawiająca się w muszli nautilusa' },
      { n: 89,   desc: '89 — poprzednia w ciągu Fibonacciego, podstawa spirali' },
    ],
    drawingSteps: [
      'Narysuj kwadrat o boku 1 cm',
      'Dobuduj kolejny kwadrat o boku 1 cm tworząc prostokąt',
      'Do prostokąta dobuduj kwadrat o boku 2 cm (suma poprzednich boków)',
      'Kontynuuj: 3, 5, 8, 13, 21 cm — kwadrat w każdym kroku',
      'W każdym kwadracie narysuj łuk od jednego narożnika do drugiego — razem tworzą spiralę',
    ],
    guideSteps: [
      'Wejdź wzrokiem w centrum spirali i pozwól oczom podążać po jej linii ku zewnętrzu',
      'Z każdym wdechem podążaj spiralą na zewnątrz — poczucie ekspansji',
      'Z każdym wydechem wróć do centrum — skupienie i zakorzenienie',
      'Przez 5 minut odczuwaj, jak Twoja energia "rośnie spiralnie" — nie stagnuje',
      'Zapytaj siebie: w którym obszarze życia jesteś teraz na spirali wzrostu?',
    ],
    color: '#FBBF24',
  },
  {
    id: 'metatrons_cube',
    name: 'Sześcian Metatrona',
    origin: 'Kabała, tradycja żydowska',
    meaning: 'Sześcian Metatrona zawiera wszystkie pięć brył Platońskich — podstawowych form trójwymiarowej materii. Jest geometrycznym planem całej rzeczywistości fizycznej i meta-fizycznej. Anioł Metatron, strażnik Tronu, zarządza tym wzorcem — jest on kodem budowania rzeczywistości z nieskończoności. Ćwiczenie z nim aktywuje wiedzę zakodowaną w geometrii samego bytu.',
    meditation: 'Patrz na wzorzec i pozwól mu "mówić" — jakie bryły widzisz? Tetraedry, sześciany, oktaedry wyłaniające się z linii? Każda jest jednym aspektem Twojej natury.',
    chakra: 'Vishuddha (gardło)',
    element: 'Wszystkie pięć żywiołów',
    numbers: [
      { n: 13, desc: '13 kół w podstawie — pełny wzorzec Kwiatu Życia' },
      { n: 5,  desc: 'Pięć brył Platońskich zakodowanych w sześcianie' },
      { n: 78, desc: '78 linii łączących 13 punktów — kompletna sieć połączeń' },
    ],
    drawingSteps: [
      'Narysuj Kwiat Życia z 13 kółkami (w tym zewnętrzną warstwą)',
      'Zaznacz środki wszystkich 13 kół — to węzły sześcianu',
      'Połącz każdy środek z każdym innym centrum prostą linią',
      'Uwydatnij linie tworzące gwiezdny heksagram (Gwiazdę Dawida)',
      'Rozpoznaj bryły Platońskie ukryte w strukturze: tetraedr, sześcian, oktaedr',
    ],
    guideSteps: [
      'Skup się na wzorcu przez pełne 2 minuty bez analizowania — tylko odczuwaj',
      'Przywołaj w myślach pytanie o strukturę Twojego życia lub problemu',
      'Które linie wzorca "odpowiadają" na Twoje pytanie? Zaufaj intuicji',
      'Zamknij oczy i wyobraź sobie, że siedzisz wewnątrz Sześcianu',
      'Poczuj jego stabilność ze wszystkich sześciu stron — jesteś bezpieczny',
    ],
    color: '#A78BFA',
  },
  {
    id: 'sri_yantra',
    name: 'Sri Yantra',
    origin: 'Tantra hinduska, Indie',
    meaning: 'Sri Yantra to najświętszy diagram w hinduskiej tradycji tantrycznej. Dziewięć przeplatających się trójkątów tworzy 43 mniejsze trójkąty — mapę kosmicznego stworzenia. Cztery trójkąty skierowane ku górze symbolizują Śiwę (świadomość), pięć skierowanych ku dołowi — Śakti (energię). W centrum, w bindu (punkcie), mieszczą się zjednoczone. Jest mapą samego umysłu.',
    meditation: 'Zacznij od bindu — centralnego punktu. To Ty, przed wszelką formą. Pozwól wzrokowi rozszerzać się koncentrycznie ku zewnętrzu — od centrum do lotusu, do kwadratowej bramy.',
    chakra: 'Muladhara i Sahasrara jednocześnie',
    element: 'Ziemia i Eter',
    numbers: [
      { n: 9,  desc: 'Dziewięć przeplatających się trójkątów — dziewięć poziomów stworzenia' },
      { n: 43, desc: '43 mniejsze trójkąty — pełna mapa kosmicznych energii' },
      { n: 1,  desc: 'Bindu w centrum — jedność przed wszelką dwoistością' },
    ],
    drawingSteps: [
      'Narysuj dwa koncentryczne okręgi jako ramy zewnętrzne',
      'Wewnątrz narysuj kwadrat z czterema "bramami" (T-kształtami) po każdej stronie',
      'Wstaw dwa okręgi z płatkami lotosu (16 i 8 płatków)',
      'Narysuj 5 trójkątów skierowanych wierzchołkiem ku dołowi (Śakti)',
      'Narysuj 4 trójkąty skierowane ku górze (Śiwa) — razem tworzą 43 małe trójkąty',
    ],
    guideSteps: [
      'Zacznij od zewnętrza — poczuj, jak kwadratowa brama cię ochrania',
      'Przejdź wzrokiem przez kolejne lotosowe kręgi ku środkowi',
      'Zatrzymaj się na każdym trójkącie i poczuj albo Śiwę (spokój), albo Śakti (ruch)',
      'Dotryj do bindu — centralnego punktu. Zamknij oczy i poczuj absolutną ciszę',
      'Przez 10 oddechów utrzymuj uwagę w bindu — miejscu, gdzie Ty i Wszechświat jesteście jednym',
    ],
    color: '#F87171',
  },
  {
    id: 'merkaba',
    name: 'Merkaba',
    origin: 'Kabała, starożytny Egipt, ezoteryka',
    meaning: 'Merkaba (hebr. "mer" = światło, "ka" = duch, "ba" = ciało) to interpenetrujące tetraedry — gwiazda trójwymiarowa. Symbolizuje ciało świetlne człowieka, pole energetyczne otaczające każdą istotę i zdolne do transportu świadomości między wymiarami. Jeden tetraedr wskazuje ku górze (ku duchowi), drugi ku dołowi (ku ziemi). W aktywowanej Merkabie oba obracają się w przeciwnych kierunkach.',
    meditation: 'Wyobraź sobie, że jesteś w centrum Merkaby. Górny tetraedr obraca się zgodnie z ruchem zegara — aktywując umysł i ducha. Dolny — przeciwnie — zakorzeniając Cię w ciele i ziemi.',
    chakra: 'Wszystkie siedem — integracja',
    element: 'Gwiezdne Światło',
    numbers: [
      { n: 2,  desc: 'Dwa tetraedry — dualność ducha i materii zintegrowana' },
      { n: 4,  desc: 'Cztery ściany każdego tetraedru — cztery żywioły w każdym z nich' },
      { n: 8,  desc: 'Osiem narożników wspólnych — ośmiokrotna symetria Merkaby' },
    ],
    drawingSteps: [
      'Narysuj pionowy, równoboczny trójkąt skierowany ku górze',
      'W tym samym centrum narysuj identyczny trójkąt skierowany ku dołowi',
      'Razem tworzą heksagram (Gwiazdę Dawida)',
      'Dla wersji 3D: dodaj do każdego trójkąta "wierzchołek" wysuniętego z płaszczyzny — tworzą tetraedry',
      'Cieniowaniem zaznacz górny tetraedr jasno, dolny ciemno',
    ],
    guideSteps: [
      'Zamknij oczy i wyobraź sobie Gwiazdę Dawida w poziomej płaszczyźnie wokół Twojego ciała',
      'Tetraedr wskazujący ku górze — wzrasta, gdy wdychasz i wznosisz uwagę ku głowie',
      'Tetraedr wskazujący ku dołowi — wzrasta, gdy wydychasz i opuszczasz uwagę ku ziemi',
      'W trzecim etapie wyobraź sobie oba obracające się — w przeciwnych kierunkach, szybciej z każdym oddechem',
      'Trwaj 7 minut w tym polu — to aktywacja Twojego ciała świetlnego',
    ],
    color: '#38BDF8',
  },
  {
    id: 'torus',
    name: 'Torus',
    origin: 'Fizyka, kosmologia, mistycyzm współczesny',
    meaning: 'Torus to trójwymiarowa figura toroidalna — "donut" energii, która nieprzerwanie przepływa z centrum na zewnątrz, okrąża i wraca z zewnątrz przez środek. To podstawowa forma pola energetycznego serca człowieka, Ziemi, gwiazd i galaktyk. Każda żywa istota posiada pole toroidalne. Medytacja z torusem synchronizuje Twoje pole z polem Wszechświata.',
    meditation: 'Wyobraź sobie energię wypływającą z Twojego serca ku górze, okrążającą Twoją głowę, spływającą z dołu i wracającą do serca. Nieustanny, zamknięty przepływ miłości.',
    chakra: 'Anahata (serce) — centrum torusa',
    element: 'Ogień Serca',
    numbers: [
      { n: 0,  desc: '0 — torus jako symbol pełni i pustki jednocześnie, nieskończona pętla' },
      { n: 360, desc: '360 stopni — pełny obieg energii bez początku i końca' },
      { n: 2,  desc: 'Dwa przepływy: od centrum na zewnątrz i z zewnątrz do centrum' },
    ],
    drawingSteps: [
      'Narysuj okrąg w widoku z góry — to przekrój poziomy torusa',
      'Narysuj mniejszy okrąg wewnątrz — to otwór w centrum torusa',
      'W widoku z boku narysuj elipsę',
      'Narysuj wewnętrzne elipsy symbolizujące "rury" torusa przepływające przez kształt',
      'Zaznacz strzałkami kierunek przepływu: ku górze na zewnątrz, ku dołowi przez centrum',
    ],
    guideSteps: [
      'Połóż dłoń na sercu. Poczuj jego bicie — to centrum Twojego torusa',
      'Z każdym uderzeniem wyobraź sobie energię pulsującą na zewnątrz jak fala',
      'Fala okrąża Twoje ciało i wraca przez serce — zamknięty, doskonały obieg',
      'Po 3 minutach rozszerz torusowe pole do rozmiarów pokoju, w którym siedzisz',
      'Po 5 minutach rozszerz je do nieba nad Tobą i ziemi pod Tobą — jesteś centrum Wszechświata',
    ],
    color: '#F472B6',
  },
];

// Day-of-week pattern resonance
const DOW_PATTERN_IDS = [
  'flower_of_life',   // Mon
  'golden_spiral',    // Tue
  'metatrons_cube',   // Wed
  'sri_yantra',       // Thu
  'vesica_piscis',    // Fri
  'merkaba',          // Sat
  'seed_of_life',     // Sun
];

// ── PATTERN SVGs ──────────────────────────────────────────────
const PatternSvg = React.memo(({ id, size = 180, accent: ac, isDark }: { id: string; size?: number; accent: string; isDark: boolean }) => {
  const c = size / 2;
  const r = size / 2 - 6;
  const pat = PATTERNS.find(p => p.id === id);
  const color = pat?.color ?? ac;

  const rot = useSharedValue(0);
  const pulse = useSharedValue(0.98);
  useEffect(() => {
    rot.value   = withRepeat(withTiming(360, { duration: 30000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withSequence(withTiming(1.03, { duration: 3000 }), withTiming(0.98, { duration: 3000 })), -1, false);
  }, [id]);
  const rotStyle  = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot.value}deg` }] }));
  const pulsStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const renderInner = () => {
    switch (id) {
      case 'flower_of_life': {
        const centers = [
          { cx: c, cy: c },
          ...Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return { cx: c + (r * 0.42) * Math.cos(a), cy: c + (r * 0.42) * Math.sin(a) };
          }),
        ];
        return centers.map((ct, i) => (
          <Circle key={i} cx={ct.cx} cy={ct.cy} r={r * 0.42}
            fill="none" stroke={color} strokeWidth={1} opacity={i === 0 ? 0.80 : 0.55} />
        ));
      }
      case 'seed_of_life': {
        const centers = [
          { cx: c, cy: c },
          ...Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return { cx: c + (r * 0.44) * Math.cos(a), cy: c + (r * 0.44) * Math.sin(a) };
          }),
        ];
        return (
          <>
            {centers.map((ct, i) => (
              <Circle key={i} cx={ct.cx} cy={ct.cy} r={r * 0.44}
                fill={i === 0 ? color + '08' : 'none'} stroke={color} strokeWidth={1.1}
                opacity={i === 0 ? 0.85 : 0.55} />
            ))}
            <Circle cx={c} cy={c} r={r * 0.88} fill="none" stroke={color + '40'} strokeWidth={0.7} />
          </>
        );
      }
      case 'vesica_piscis': {
        const off = r * 0.42;
        return (
          <>
            <Circle cx={c - off} cy={c} r={r * 0.75} fill="none" stroke={color} strokeWidth={1.2} opacity={0.7} />
            <Circle cx={c + off} cy={c} r={r * 0.75} fill="none" stroke={color} strokeWidth={1.2} opacity={0.7} />
            {/* Mandorla fill */}
            <Path d={`M ${c},${c - r * 0.61} A ${r * 0.75},${r * 0.75} 0 0,1 ${c},${c + r * 0.61} A ${r * 0.75},${r * 0.75} 0 0,1 ${c},${c - r * 0.61} Z`}
              fill={color + '1A'} stroke={color + '80'} strokeWidth={0.8} />
            <Line x1={c} y1={c - r * 0.61} x2={c} y2={c + r * 0.61} stroke={color + '60'} strokeWidth={0.8} />
          </>
        );
      }
      case 'golden_spiral': {
        const sq = [r * 0.14, r * 0.14, r * 0.28, r * 0.42, r * 0.70];
        return (
          <>
            <Circle cx={c} cy={c} r={r} fill="none" stroke={color + '30'} strokeWidth={0.6} />
            <Path d={`M ${c},${c} Q ${c + r * 0.18},${c - r * 0.18} ${c + r * 0.28},${c} Q ${c + r * 0.42},${c + r * 0.28} ${c},${c + r * 0.42} Q ${c - r * 0.65},${c + r * 0.56} ${c - r * 0.7},${c} Q ${c - r * 0.75},${c - r * 0.75} ${c},${c - r * 0.75}`}
              fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.85} />
            <Circle cx={c} cy={c} r={4} fill={color} opacity={0.9} />
          </>
        );
      }
      case 'metatrons_cube': {
        const outer6 = Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return { x: c + r * 0.75 * Math.cos(a), y: c + r * 0.75 * Math.sin(a) };
        });
        const inner6 = Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
          return { x: c + r * 0.37 * Math.cos(a), y: c + r * 0.37 * Math.sin(a) };
        });
        return (
          <>
            {outer6.map((a, i) => outer6.map((b, j) => j > i ? (
              <Line key={`o${i}${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={0.7} opacity={0.38} />
            ) : null))}
            {outer6.map((a, i) => inner6.map((b, j) => (
              <Line key={`i${i}${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={0.5} opacity={0.25} />
            )))}
            {outer6.map((n, i) => <Circle key={i} cx={n.x} cy={n.y} r={3.5} fill={color} opacity={0.80} />)}
            {inner6.map((n, i) => <Circle key={i} cx={n.x} cy={n.y} r={2.5} fill={color} opacity={0.60} />)}
            <Circle cx={c} cy={c} r={5} fill={color} />
          </>
        );
      }
      case 'sri_yantra': {
        // Simplified Sri Yantra with nested triangles
        const tUp = (scale: number, offs: number) => {
          const h = r * scale;
          return `${c},${c - h} ${c + h * 0.866},${c + h * 0.5} ${c - h * 0.866},${c + h * 0.5}`;
        };
        const tDn = (scale: number) => {
          const h = r * scale;
          return `${c},${c + h} ${c + h * 0.866},${c - h * 0.5} ${c - h * 0.866},${c - h * 0.5}`;
        };
        return (
          <>
            <Circle cx={c} cy={c} r={r} fill="none" stroke={color + '40'} strokeWidth={0.7} />
            <Circle cx={c} cy={c} r={r * 0.82} fill="none" stroke={color + '30'} strokeWidth={0.5} />
            {[0.80, 0.60, 0.42, 0.25].map((s, i) => (
              <Polygon key={'u' + i} points={tUp(s, 0)} fill="none" stroke={color} strokeWidth={0.9} opacity={0.55 - i * 0.08} />
            ))}
            {[0.70, 0.52, 0.36, 0.20, 0.10].map((s, i) => (
              <Polygon key={'d' + i} points={tDn(s)} fill="none" stroke={color} strokeWidth={0.9} opacity={0.60 - i * 0.08} />
            ))}
            <Circle cx={c} cy={c} r={5} fill={color} />
          </>
        );
      }
      case 'merkaba': {
        const h = r * 0.78;
        const pts1 = `${c},${c - h} ${c + h * 0.866},${c + h * 0.5} ${c - h * 0.866},${c + h * 0.5}`;
        const pts2 = `${c},${c + h} ${c + h * 0.866},${c - h * 0.5} ${c - h * 0.866},${c - h * 0.5}`;
        return (
          <>
            <Polygon points={pts1} fill={color + '14'} stroke={color} strokeWidth={1.5} opacity={0.85} />
            <Polygon points={pts2} fill={color + '0A'} stroke={color} strokeWidth={1.5} opacity={0.70} />
            <Circle cx={c} cy={c} r={r * 0.18} fill="none" stroke={color + '70'} strokeWidth={1} />
            <Circle cx={c} cy={c} r={5} fill={color} />
            {Array.from({ length: 6 }, (_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return <Circle key={i} cx={c + r * 0.78 * Math.cos(a)} cy={c + r * 0.78 * Math.sin(a)} r={3} fill={color} opacity={0.75} />;
            })}
          </>
        );
      }
      case 'torus': {
        return (
          <>
            {Array.from({ length: 7 }, (_, i) => {
              const scale = 0.25 + i * 0.12;
              return (
                <Ellipse key={i} cx={c} cy={c} rx={r * scale} ry={r * scale * 0.38}
                  fill="none" stroke={color} strokeWidth={0.8} opacity={0.15 + (3 - Math.abs(i - 3)) * 0.09} />
              );
            })}
            <Circle cx={c} cy={c} r={r * 0.88} fill="none" stroke={color} strokeWidth={1.2} opacity={0.65} />
            <Circle cx={c} cy={c} r={r * 0.28} fill="none" stroke={color} strokeWidth={1} opacity={0.55} />
            <Circle cx={c} cy={c} r={r * 0.08} fill={color} />
            {/* Flow arrows */}
            {[0, 90, 180, 270].map(deg => {
              const rad = (deg / 180) * Math.PI;
              const rx2 = r * 0.88;
              const x = c + rx2 * Math.cos(rad);
              const y = c + rx2 * Math.sin(rad);
              return <Circle key={deg} cx={x} cy={y} r={3} fill={color} opacity={0.70} />;
            })}
          </>
        );
      }
      default:
        return <Circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={1.2} opacity={0.6} />;
    }
  };

  return (
    <Animated.View style={pulsStyle}>
      <Animated.View style={rotStyle}>
        <Svg width={size} height={size}>
          <Circle cx={c} cy={c} r={r} fill="none" stroke={color + '22'} strokeWidth={0.7} />
          {renderInner()}
        </Svg>
      </Animated.View>
    </Animated.View>
  );
});

// Oracle prompts
const GEOM_ORACLE_PROMPTS = [
  'Jakie przesłanie niesie dla mnie ten wzorzec?',
  'Jak ta geometria łączy się z moją drogą duchową?',
  'Czego uczy mnie ta forma o mojej naturze?',
  'Jaki wzorzec geometryczny najlepiej oddaje moją obecną energię?',
];

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function SacredGeometryScreen({ navigation }: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const favoriteItems = useAppStore(s => s.favoriteItems);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const isDark = !isLight;
  const textColor  = isLight ? '#1A1410' : '#F5F1EA';
  const subColor   = isLight ? '#6A5A48' : '#B0A393';
  const cardBg     = isLight ? 'rgba(240,228,210,0.90)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';
  const accent     = ACCENT;

  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const dowIndex = dow === 0 ? 6 : dow - 1; // Mon=0..Sun=6
  const dailyPatternId = DOW_PATTERN_IDS[dowIndex];

  const [selectedId, setSelectedId] = useState('flower_of_life');
  const selectedPattern = useMemo(() => PATTERNS.find(p => p.id === selectedId) ?? PATTERNS[0], [selectedId]);

  // Meditation timer
  const [medDuration, setMedDuration] = useState(5);
  const [medRunning, setMedRunning] = useState(false);
  const [medSeconds, setMedSeconds] = useState(0);
  const medTimerRef = useRef<any>(null);
  const medProgress = medDuration > 0 ? Math.min(medSeconds / (medDuration * 60), 1) : 0;

  useEffect(() => {
    if (medRunning) {
      medTimerRef.current = setInterval(() => {
        setMedSeconds(s => {
          if (s >= medDuration * 60) {
            setMedRunning(false);
            clearInterval(medTimerRef.current);
            HapticsService.notify();
            return 0;
          }
          return s + 1;
        });
      }, 1000);
    } else {
      clearInterval(medTimerRef.current);
    }
    return () => clearInterval(medTimerRef.current);
  }, [medRunning, medDuration]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Drawing steps check
  const [drawChecked, setDrawChecked] = useState<boolean[]>(Array(6).fill(false));
  useEffect(() => {
    setDrawChecked(Array(selectedPattern.drawingSteps.length).fill(false));
  }, [selectedPattern.id]);

  // Oracle
  const [oracleInput, setOracleInput] = useState('');
  const [oracleResponse, setOracleResponse] = useState('');
  const [oracleLoading, setOracleLoading] = useState(false);
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [drawExpanded, setDrawExpanded] = useState(false);

  const askOracle = async (q?: string) => {
    const query = q ?? oracleInput;
    if (!query.trim()) return;
    setOracleLoading(true);
    setOracleResponse('');
    HapticsService.notify();
    try {
      const messages = [
        {
          role: 'system' as const,
          content: `Jesteś mistrzem świętej geometrii i przewodnikiem duchowej wiedzy. Aktualnie wybrany wzorzec: ${selectedPattern.name} (pochodzenie: ${selectedPattern.origin}). Użytkownik: ${userData?.name || 'poszukujący'}. Odpowiadaj głęboko i poetycko, łącząc geometrię z duchowością. Max 4 zdania.`,
        },
        { role: 'user' as const, content: query },
      ];
      const res = await AiService.chatWithOracle(messages);
      setOracleResponse(res);
    } catch {
      setOracleResponse('Wzorzec milczy, lecz mówi poprzez formę. Wróć do wizualizacji i pozwól geometrii przemówić.');
    } finally {
      setOracleLoading(false);
    }
  };

  // Favorite
  const isFav = favoriteItems?.some(f => f.route === 'SacredGeometry');
  const toggleFav = () => {
    HapticsService.notify();
    if (isFav) {
      const item = favoriteItems.find(f => f.route === 'SacredGeometry');
      if (item) removeFavoriteItem?.(item.id);
    } else {
      addFavoriteItem?.({ id: Date.now().toString(), label: 'Święta Geometria', route: 'SacredGeometry', icon: 'Layers', color: accent, addedAt: new Date().toISOString() });
    }
  };

  const dailyPattern = useMemo(() => PATTERNS.find(p => p.id === dailyPatternId) ?? PATTERNS[0], [dailyPatternId]);
  const DOW_NAMES = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <GeomBg isDark={!isLight} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.headerBtn} hitSlop={8}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Typography variant="label" style={{ color: subColor, letterSpacing: 2, fontSize: 10 }}>WZORCE KOSMICZNE</Typography>
          <Typography variant="h3" style={{ color: textColor, fontWeight: '700', marginTop: 1 }}>Święta Geometria</Typography>
        </View>
        <Pressable onPress={toggleFav} style={styles.headerBtn} hitSlop={8}>
          <Star size={20} color={accent} fill={isFav ? accent : 'none'} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 56}
      >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 3D Widget */}
        <SacredGeomWidget3D accent={accent} />

        {/* ── SECTION 1: Pattern Selector ─────────────────── */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <Typography variant="microLabel" style={[styles.sectionLabel, { color: subColor }]}>WYBIERZ WZORZEC</Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
              {PATTERNS.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => { setSelectedId(p.id); HapticsService.notify(); setOracleResponse(''); }}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
                    backgroundColor: selectedId === p.id ? p.color + '28' : cardBg,
                    borderWidth: 1, borderColor: selectedId === p.id ? p.color : cardBorder,
                  }}
                >
                  <Typography variant="caption" style={{ color: selectedId === p.id ? p.color : subColor, fontWeight: selectedId === p.id ? '700' : '400' }}>
                    {p.name}
                  </Typography>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* ── SECTION 2: Pattern Visualization ─────────────── */}
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, alignItems: 'center', paddingVertical: 24 }]}>
            <PatternSvg id={selectedId} size={200} accent={selectedPattern.color} isDark={!isLight} />
            <Typography variant="caption" style={{ color: selectedPattern.color, fontWeight: '700', marginTop: 10, letterSpacing: 1.5, fontSize: 10 }}>
              {selectedPattern.name.toUpperCase()}
            </Typography>
            <Typography variant="caption" style={{ color: subColor, marginTop: 4, fontSize: 11 }}>
              {selectedPattern.origin}
            </Typography>
          </View>
        </Animated.View>

        {/* ── SECTION 3: Pattern Meaning ─────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Typography variant="microLabel" style={[styles.sectionLabel, { color: subColor }]}>ZNACZENIE I SYMBOLIKA</Typography>
          <LinearGradient
            colors={isLight ? [selectedPattern.color + '10', selectedPattern.color + '05'] : [selectedPattern.color + '12', selectedPattern.color + '04']}
            style={[styles.card, { borderColor: selectedPattern.color + '40', borderWidth: 1 }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Typography variant="body" style={{ color: textColor, lineHeight: 24, marginBottom: 14 }}>
              {selectedPattern.meaning}
            </Typography>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: selectedPattern.color + '20', borderWidth: 1, borderColor: selectedPattern.color + '40' }}>
                <Typography variant="caption" style={{ color: selectedPattern.color, fontWeight: '600' }}>⬡ {selectedPattern.chakra}</Typography>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: selectedPattern.color + '15', borderWidth: 1, borderColor: selectedPattern.color + '30' }}>
                <Typography variant="caption" style={{ color: selectedPattern.color, fontWeight: '600' }}>✦ {selectedPattern.element}</Typography>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── SECTION 4: Geometry Meditation ────────────────── */}
        <Animated.View entering={FadeInDown.delay(260).springify()}>
          <Typography variant="microLabel" style={[styles.sectionLabel, { color: subColor }]}>MEDYTACJA Z WZORCEM</Typography>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Eye size={16} color={selectedPattern.color} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>Wizualizacja przewodnia</Typography>
            </View>
            <Typography variant="body" style={{ color: subColor, fontStyle: 'italic', lineHeight: 22, marginBottom: 14 }}>
              "{selectedPattern.meditation}"
            </Typography>

            {/* Duration chips */}
            <Typography variant="microLabel" style={{ color: subColor, letterSpacing: 1.5, fontSize: 9, marginBottom: 8 }}>CZAS MEDYTACJI</Typography>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {[3, 5, 7, 10].map(m => (
                <Pressable
                  key={m}
                  onPress={() => { if (!medRunning) { setMedDuration(m); setMedSeconds(0); HapticsService.notify(); } }}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
                    backgroundColor: medDuration === m ? selectedPattern.color : cardBg,
                    borderWidth: 1, borderColor: medDuration === m ? selectedPattern.color : cardBorder,
                  }}
                >
                  <Typography variant="caption" style={{ color: medDuration === m ? '#fff' : subColor, fontWeight: '600' }}>{m} min</Typography>
                </Pressable>
              ))}
            </View>

            {/* Timer row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: cardBorder, overflow: 'hidden' }}>
                <View style={{ height: 6, width: `${medProgress * 100}%`, borderRadius: 3, backgroundColor: selectedPattern.color }} />
              </View>
              <Typography variant="label" style={{ color: textColor, fontWeight: '700', width: 60, textAlign: 'right' }}>
                {formatTime(medSeconds)}
              </Typography>
              <Pressable
                onPress={() => { setMedRunning(p => !p); HapticsService.notify(); }}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: selectedPattern.color, alignItems: 'center', justifyContent: 'center' }}
              >
                <Clock size={20} color="#fff" />
              </Pressable>
            </View>

            {/* 5-step guide */}
            <Pressable
              onPress={() => { setGuideExpanded(p => !p); HapticsService.notify(); }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: cardBorder }}
            >
              <Typography variant="label" style={{ color: selectedPattern.color, fontWeight: '700' }}>Kroki medytacji</Typography>
              {guideExpanded ? <ChevronUp size={18} color={selectedPattern.color} /> : <ChevronDown size={18} color={selectedPattern.color} />}
            </Pressable>

            {guideExpanded && (
              <View style={{ marginTop: 10 }}>
                {selectedPattern.guideSteps.map((step, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(i * 60).springify()} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: selectedPattern.color + '28', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Typography variant="caption" style={{ color: selectedPattern.color, fontWeight: '800', fontSize: 11 }}>{i + 1}</Typography>
                    </View>
                    <Typography variant="body" style={{ color: textColor, flex: 1, lineHeight: 22 }}>{step}</Typography>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── SECTION 5: Daily Pattern ──────────────────────── */}
        <Animated.View entering={FadeInDown.delay(320).springify()}>
          <Typography variant="microLabel" style={[styles.sectionLabel, { color: subColor }]}>WZORZEC DNIA</Typography>
          <LinearGradient
            colors={isLight
              ? [dailyPattern.color + '18', dailyPattern.color + '08']
              : [dailyPattern.color + '18', dailyPattern.color + '06']}
            style={[styles.card, { borderColor: dailyPattern.color + '50', borderWidth: 1 }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <PatternSvg id={dailyPatternId} size={80} accent={dailyPattern.color} isDark={!isLight} />
              <View style={{ flex: 1 }}>
                <Typography variant="microLabel" style={{ color: dailyPattern.color, letterSpacing: 2, fontSize: 9, marginBottom: 2 }}>
                  REZONANS — {DOW_NAMES[dowIndex].toUpperCase()}
                </Typography>
                <Typography variant="h3" style={{ color: textColor, fontWeight: '800', fontSize: 18 }}>{dailyPattern.name}</Typography>
                <Typography variant="caption" style={{ color: subColor, marginTop: 4, lineHeight: 17 }} numberOfLines={3}>
                  {dailyPattern.meditation}
                </Typography>
              </View>
            </View>
            <Pressable
              onPress={() => { setSelectedId(dailyPatternId); HapticsService.notify(); }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 10 }}
            >
              <Typography variant="caption" style={{ color: dailyPattern.color, fontWeight: '700' }}>Zbadaj wzorzec</Typography>
              <ArrowRight size={14} color={dailyPattern.color} />
            </Pressable>
          </LinearGradient>
        </Animated.View>

        {/* ── SECTION 6: Number Significance ───────────────── */}
        <Animated.View entering={FadeInDown.delay(380).springify()}>
          <Typography variant="microLabel" style={[styles.sectionLabel, { color: subColor }]}>ZNACZENIE LICZB</Typography>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {selectedPattern.numbers.map((n, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.delay(400 + i * 60).springify()}
                  style={{ flex: 1, minWidth: (SW - layout.padding.screen * 2 - 24) / selectedPattern.numbers.length - 4 }}
                >
                  <View style={{ padding: 12, borderRadius: 12, backgroundColor: isLight ? selectedPattern.color + '10' : selectedPattern.color + '12', borderWidth: 1, borderColor: selectedPattern.color + '36', alignItems: 'center' }}>
                    <Typography variant="h2" style={{ color: selectedPattern.color, fontWeight: '900', fontSize: 28 }}>{n.n}</Typography>
                    <Typography variant="caption" style={{ color: subColor, textAlign: 'center', marginTop: 4, lineHeight: 16, fontSize: 11 }}>{n.desc}</Typography>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ── SECTION 7: Drawing Practice ───────────────────── */}
        <Animated.View entering={FadeInDown.delay(440).springify()}>
          <Typography variant="microLabel" style={[styles.sectionLabel, { color: subColor }]}>PRAKTYKA RYSOWANIA</Typography>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Target size={16} color={selectedPattern.color} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>Jak narysować {selectedPattern.name}</Typography>
            </View>
            <Typography variant="caption" style={{ color: subColor, marginBottom: 12, lineHeight: 18 }}>
              Ręczne rysowanie wzorca aktywuje wiedzę geometryczną w Twoim ciele. Zaznaczaj kroki po kolei.
            </Typography>

            <Pressable
              onPress={() => { setDrawExpanded(p => !p); HapticsService.notify(); }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Typography variant="label" style={{ color: selectedPattern.color, fontWeight: '700' }}>
                  Kroki ({drawChecked.filter(Boolean).length}/{selectedPattern.drawingSteps.length})
                </Typography>
              </View>
              {drawExpanded ? <ChevronUp size={18} color={selectedPattern.color} /> : <ChevronDown size={18} color={selectedPattern.color} />}
            </Pressable>

            {/* Progress bar */}
            <View style={{ height: 4, borderRadius: 2, backgroundColor: cardBorder, overflow: 'hidden', marginBottom: drawExpanded ? 14 : 0 }}>
              <View style={{
                height: 4,
                width: `${(drawChecked.filter(Boolean).length / (selectedPattern.drawingSteps.length || 1)) * 100}%`,
                borderRadius: 2, backgroundColor: selectedPattern.color,
              }} />
            </View>

            {drawExpanded && selectedPattern.drawingSteps.map((step, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(i * 50).springify()} style={{ flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                <Pressable onPress={() => { const n = [...drawChecked]; n[i] = !n[i]; setDrawChecked(n); HapticsService.notify(); }}>
                  {drawChecked[i]
                    ? <CheckCircle2 size={22} color={selectedPattern.color} />
                    : <CircleIcon size={22} color={subColor} />}
                </Pressable>
                <Typography variant="body" style={{ color: drawChecked[i] ? subColor : textColor, flex: 1, lineHeight: 22, textDecorationLine: drawChecked[i] ? 'line-through' : 'none' }}>
                  {step}
                </Typography>
              </Animated.View>
            ))}

            {drawChecked.every(Boolean) && drawChecked.length > 0 && (
              <Animated.View entering={FadeInUp.springify()} style={{ padding: 12, borderRadius: 10, backgroundColor: selectedPattern.color + '18', marginTop: 8 }}>
                <Typography variant="caption" style={{ color: selectedPattern.color, textAlign: 'center', fontStyle: 'italic', fontWeight: '600' }}>
                  ✦ Ukończyłeś/aś rysunek {selectedPattern.name}! Wzorzec aktywowany.
                </Typography>
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* ── SECTION 8: Oracle AI ──────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <Typography variant="microLabel" style={[styles.sectionLabel, { color: subColor }]}>WYROCZNIA GEOMETRII</Typography>
          <LinearGradient
            colors={isLight
              ? [accent + '10', accent + '04']
              : [accent + '12', accent + '04']}
            style={[styles.card, { borderColor: accent + '36', borderWidth: 1 }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Sparkles size={16} color={accent} />
              <Typography variant="label" style={{ color: textColor, fontWeight: '700' }}>Zapytaj o wzorzec</Typography>
            </View>

            {/* Quick prompts */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
                {GEOM_ORACLE_PROMPTS.map((p, i) => (
                  <Pressable
                    key={i}
                    onPress={() => { setOracleInput(p); askOracle(p); }}
                    style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: accent + '22', borderWidth: 1, borderColor: accent + '44' }}
                  >
                    <Typography variant="caption" style={{ color: accent, fontWeight: '600' }} numberOfLines={1}>{p}</Typography>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <TextInput
              style={[styles.input, { color: textColor, borderColor: cardBorder, backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)', minHeight: 72 }]}
              placeholder={`Zapytaj o ${selectedPattern.name}…`}
              placeholderTextColor={subColor}
              multiline
              value={oracleInput}
              onChangeText={setOracleInput}
            />
            <Pressable
              onPress={() => askOracle()}
              style={[styles.cta, { backgroundColor: oracleLoading ? accent + '80' : accent, marginTop: 10 }]}
              disabled={oracleLoading}
            >
              <Wand2 size={16} color="#fff" />
              <Typography variant="label" style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>
                {oracleLoading ? 'Wzorzec odpowiada…' : 'Zapytaj wyrocznię'}
              </Typography>
            </Pressable>

            {!!oracleResponse && (
              <Animated.View entering={FadeInDown.springify()} style={{ marginTop: 14, padding: 14, borderRadius: 12, backgroundColor: accent + '12', borderWidth: 1, borderColor: accent + '33' }}>
                <Typography variant="caption" style={{ color: accent, letterSpacing: 1.5, fontSize: 9, marginBottom: 6 }}>ODPOWIEDŹ WYROCZNI</Typography>
                <Typography variant="body" style={{ color: textColor, lineHeight: 24, fontStyle: 'italic' }}>{oracleResponse}</Typography>
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>

        <EndOfContentSpacer />
      </ScrollView>
      </KeyboardAvoidingView>
        </SafeAreaView>
</View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: {
    letterSpacing: 2, fontSize: 9, marginTop: 22, marginBottom: 8,
  },
  card: {
    borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 4,
  },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, lineHeight: 20,
  },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 14,
  },
});
