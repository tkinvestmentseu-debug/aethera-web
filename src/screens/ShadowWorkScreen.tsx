import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { KeyboardAvoidingView, Keyboard, Platform, Pressable, ScrollView, StyleSheet, View, Dimensions, Text, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Line, Ellipse, Circle as DkCircle, Line as DkLine } from 'react-native-svg';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing, cancelAnimation } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, Star, BookOpen, EyeOff, Clock, Brain, Sparkles, Gem, ShieldAlert, ArrowRight, Wand2, Wind, CheckSquare, Square, Heart, Zap, Shield, X, ChevronDown, ChevronUp, Users, Baby, TrendingUp, Trash2 } from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { useAppStore, ShadowSession } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { Typography } from '../components/Typography';
import { MysticalInput } from '../components/MysticalInput';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import * as Haptics from 'expo-haptics';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#8B5CF6';

// ── DARK SIGIL 3D ─────────────────────────────────────────────
const SIGIL_STARS = [
  { x: 71.6, y: 16.2, r: 1.0, op: 0.35 }, { x: 22.4, y: -79.3, r: 0.8, op: 0.25 },
  { x: -61.8, y: -46.3, r: 1.2, op: 0.45 }, { x: -82.5, y: 18.8, r: 0.7, op: 0.30 },
  { x: -35.7, y: 76.4, r: 1.0, op: 0.40 }, { x: 49.2, y: -68.4, r: 0.9, op: 0.28 },
  { x: 83.1, y: -26.7, r: 0.8, op: 0.22 }, { x: 12.5, y: 84.2, r: 1.1, op: 0.38 },
  { x: -74.3, y: 43.6, r: 0.7, op: 0.32 }, { x: 54.7, y: 64.1, r: 0.9, op: 0.42 },
  { x: -18.4, y: -84.7, r: 1.0, op: 0.27 }, { x: 77.2, y: -51.3, r: 0.8, op: 0.35 },
  { x: -55.6, y: -67.8, r: 1.2, op: 0.48 }, { x: -84.9, y: -12.4, r: 0.7, op: 0.24 },
  { x: 31.8, y: 81.5, r: 1.0, op: 0.37 }, { x: 68.3, y: 37.9, r: 0.9, op: 0.31 },
];
const SIGIL_OUTER = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return { x: 88 * Math.cos(a), y: 88 * Math.sin(a) };
});
const SIGIL_INNER = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2;
  return { x: 60 * Math.cos(a), y: 60 * Math.sin(a) };
});

const DarkSigil3D = ({ accent }: { accent: string }) => {
  const rot1  = useSharedValue(0);
  const rot2  = useSharedValue(360);
  const pulse = useSharedValue(0.9);
  const tiltX = useSharedValue(-8);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    rot1.value  = withRepeat(withTiming(360, { duration: 20000, easing: Easing.linear }), -1, false);
    rot2.value  = withRepeat(withTiming(0,   { duration: 14000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withSequence(withTiming(1.05, { duration: 3000 }), withTiming(0.9, { duration: 3000 })), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-22, Math.min(22, -8 + e.translationY * 0.15));
      tiltY.value = Math.max(-22, Math.min(22, e.translationX * 0.15));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-8, { duration: 800 });
      tiltY.value = withTiming(0, { duration: 800 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 560 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }, { scale: pulse.value }],
  }));
  const ring1Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot1.value}deg` }] }));
  const ring2Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot2.value}deg` }] }));




  return (
    <View style={{ alignItems: 'center', marginVertical: 16 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>
          <Svg width={220} height={220} viewBox="-110 -110 220 220" style={StyleSheet.absoluteFill}>
            <DkCircle r={85} fill="#000" opacity={0.5} />
            {SIGIL_STARS.map((s, i) => (
              <DkCircle key={`s${i}`} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.op} />
            ))}
            <Path d="M 0,-45 L 39,22 L -39,22 Z" fill="none" stroke={accent + '55'} strokeWidth={1} />
            <Ellipse cx={0} cy={0} rx={22} ry={14} fill={accent + '33'} stroke={accent} strokeWidth={1.5} />
            <DkCircle r={8} fill={accent} opacity={0.8} />
            <DkCircle r={3} fill="#000" />
          </Svg>
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring1Style]}>
            <Svg width={220} height={220} viewBox="-110 -110 220 220">
              <DkCircle r={88} fill="none" stroke={accent + '55'} strokeWidth={1} strokeDasharray="4 8" />
              {SIGIL_OUTER.map((m, i) => (
                <DkCircle key={`om${i}`} cx={m.x} cy={m.y} r={3} fill={accent} opacity={0.7} />
              ))}
            </Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring2Style]}>
            <Svg width={220} height={220} viewBox="-110 -110 220 220">
              <DkCircle r={60} fill="none" stroke={accent + '66'} strokeWidth={1.2} strokeDasharray="2 6" />
              {SIGIL_INNER.map((ln, i) => (
                <DkLine key={`il${i}`} x1={0} y1={0} x2={ln.x} y2={ln.y} stroke={accent + '44'} strokeWidth={0.8} />
              ))}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ── BACKGROUND — always dark ──────────────────────────────────
const ShadowBg = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={['#06030F', '#0A051A', '#0F0720', '#140A28']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={500} style={StyleSheet.absoluteFill} opacity={0.22}>
      <G>
        {/* Fog / mist circles */}
        {[0, 1, 2, 3].map(i => (
          <Ellipse key={i} cx={SW * (0.2 + i * 0.22)} cy={200 + i * 40}
            rx={80 + i * 30} ry={50 + i * 20}
            fill="#8B5CF6" opacity={0.04 + i * 0.015} />
        ))}
        {/* Mirror frame */}
        <Path
          d={`M${SW / 2 - 55} 100 Q${SW / 2 - 60} 60 ${SW / 2} 55 Q${SW / 2 + 60} 60 ${SW / 2 + 55} 100 L${SW / 2 + 58} 240 Q${SW / 2} 260 ${SW / 2 - 58} 240 Z`}
          stroke="#8B5CF6" strokeWidth={0.8} fill="none" opacity={0.2}
        />
        {/* Purple lightning */}
        {[0, 1, 2].map(i => (
          <Path key={'l' + i}
            d={`M${SW * 0.2 + i * SW * 0.3} 50 L${SW * 0.15 + i * SW * 0.32} 120 L${SW * 0.25 + i * SW * 0.28} 130 L${SW * 0.18 + i * SW * 0.31} 200`}
            stroke="#A78BFA" strokeWidth={0.6} fill="none" opacity={0.12} />
        ))}
        {/* Stars */}
        {Array.from({ length: 20 }, (_, i) => (
          <Circle key={'s' + i} cx={(i * 137 + 40) % SW} cy={(i * 89 + 30) % 460}
            r={i % 6 === 0 ? 1.8 : 0.7} fill="#C4B5FD" opacity={0.2} />
        ))}
      </G>
    </Svg>
  </View>
);

// ── SHADOW AREAS ──────────────────────────────────────────────
interface ShadowArea {
  id: string;
  label: string;
  color: string;
  desc: string;
  questions: string[];
}

const SHADOW_AREAS: ShadowArea[] = [
  {
    id: 'fear',
    label: 'Lęk',
    color: '#60A5FA',
    desc: 'Lęk często chroni coś cennego — wartość, potrzebę lub granicę. Zbadaj, co naprawdę strzeże.',
    questions: [
      'Czego tak naprawdę się boisz, że ten lęk istnieje? Co by się stało, gdyby to się spełniło?',
      'Kiedy po raz pierwszy poczułaś ten lęk? Co się wtedy działo wokół Ciebie?',
      'Jak ten lęk służy Ci teraz? Co by się zmieniło, gdybyś go nie miała?',
    ],
  },
  {
    id: 'anger',
    label: 'Gniew',
    color: '#EF4444',
    desc: 'Gniew jest granicą w ruchu. Ujawnia wartości przekroczone i potrzeby, które wołają o uznanie.',
    questions: [
      'Co tak bardzo cię zranił lub przekroczył, że gniew wydaje się jedyną odpowiedzią?',
      'Jaką wartość lub granicę ten gniew próbuje chronić?',
      'Czy jest w Tobie coś, czego nienawidzisz u innych, a co możesz też znaleźć w sobie?',
    ],
  },
  {
    id: 'grief',
    label: 'Żal',
    color: '#A78BFA',
    desc: 'Żal to miłość bez miejsca, gdzie może pójść. Każda strata kryje w sobie głębię tego, co było ważne.',
    questions: [
      'Czego tak naprawdę żałujesz — co zostało utracone, co się nie wydarzyło, co mogło być?',
      'Co ta strata mówi Ci o tym, co naprawdę cenisz?',
      'Jeśli żal mógłby przemówić, co chciałby, żebyś usłyszała i zapamiętała?',
    ],
  },
  {
    id: 'shame',
    label: 'Wstyd',
    color: '#F97316',
    desc: 'Wstyd żyje w ukryciu i rośnie w ciemności. Nazwanie go z łagodnością jest już aktem odwagi.',
    questions: [
      'Czego tak bardzo się wstydzisz, że schowałaś to głęboko i rzadko o tym mówisz?',
      'Skąd pochodzi ta ocena? Czyj głos słyszysz, kiedy czujesz wstyd?',
      'Co by powiedziała do siebie wersja Ciebie, która jest już po drugiej stronie tego wstydu?',
    ],
  },
  {
    id: 'projection',
    label: 'Projekcja',
    color: '#FBBF24',
    desc: 'Projekcja to cień wyświetlony na innych. To, co nas w innych irytuje, często jest tym, czego nie akceptujemy w sobie.',
    questions: [
      'Kto lub co najbardziej Cię teraz irytuje, złości lub odpycha? Opisz to dokładnie.',
      'Czy jest element tej cechy, która w jakiejś formie — może subtelnej — żyje też w Tobie?',
      'Co by się zmieniło w Twoim związku z tą osobą lub sytuacją, gdybyś zaakceptowała tę część siebie?',
    ],
  },
];

const EDU_CARDS = [
  { title: 'Czym jest cień?', body: 'Carl Jung opisał "cień" jako te aspekty siebie, które wyparliśmy lub odrzuciliśmy — bo były zbyt bolesne, nieakceptowane lub zakazane przez otoczenie.' },
  { title: 'Dlaczego to ważne?', body: 'Nieprzetworzone cienie rządzą naszymi zachowaniami z ukrycia. Integracja cienia — przyjęcie odrzuconych części — jest kluczem do autentycznej wolności.' },
  { title: 'Projekcja', body: 'Kiedy nie rozpoznajemy czegoś w sobie, wyświetlamy to na innych. Intensywne reakcje na innych są kompasem wskazującym w kierunku własnego cienia.' },
  { title: 'Praca, nie bitwa', body: 'Praca z cieniem to nie walka z sobą, ale archeologia — delikatne odkrywanie warstw, przyjmowanie ich z ciekawością i integracją zamiast odrzucenia.' },
];

// ── SHADOW MAPPING — 5-STEP RITUAL ──────────────────────────────
const SHADOW_MAP_STEPS = [
  {
    id: 'identyfikuj',
    label: 'Identyfikuj',
    icon: '🔍',
    color: '#60A5FA',
    guidance: 'Zatrzymaj się i zauważ: co mnie teraz aktywuje? Gdzie w ciele czuję napięcie lub reaktywność? Nie analizuj jeszcze — tylko obserwuj i nazwij uczucie jednym słowem.',
  },
  {
    id: 'sledz',
    label: 'Śledź',
    icon: '🗺️',
    color: '#A78BFA',
    guidance: 'Cofnij się w czasie: kiedy pierwszy raz poczułeś/aś to uczucie? Jak stare jest to wzorce? Czy widzisz je w różnych obszarach życia? Zanotuj co najmniej dwa inne momenty, gdy pojawiło się to samo.',
  },
  {
    id: 'odpowiedzialnosc',
    label: 'Weź odpowiedzialność',
    icon: '🤝',
    color: '#FBBF24',
    guidance: 'Pytanie kluczowe: jak ja sam/a biorę udział w tej dynamice? Nie chodzi o winę — chodzi o udział i sprawczość. Co możesz zrobić inaczej? Która część Ciebie tej sytuacji potrzebowała?',
  },
  {
    id: 'integruj',
    label: 'Integruj',
    icon: '🌊',
    color: '#34D399',
    guidance: 'Przyjmij odrzuconą część z łagodnością: "Ta część mnie, która [tu wstaw cień], próbowała mnie chronić." Jaka potrzeba kryje się za tym wzorcem? Co chce być uznane i zaakceptowane?',
  },
  {
    id: 'transformuj',
    label: 'Transformuj',
    icon: '🦋',
    color: '#F472B6',
    guidance: 'Jak ta zintegrowana część może stać się zasobem? Gniew staje się granicą. Wstyd staje się pokorą. Strach staje się czujnością. Jak przekształcić cień w dar?',
  },
];

// ── JUNGIAN SHADOW ARCHETYPES ────────────────────────────────────
const SHADOW_ARCHETYPES = [
  {
    id: 'tyran',
    name: 'Tyran',
    emoji: '👑',
    color: '#EF4444',
    desc: 'Kontroluje przez dominację, strach lub manipulację. Tyran w cieniu pojawia się gdy czujemy, że świat jest niebezpieczny i jedynym bezpieczeństwem jest władza.',
    signs: ['Potrzebuję mieć zawsze rację', 'Trudno mi słuchać sprzeciwu', 'Gniew jest moją pierwszą reakcją na zagrożenie', 'Inni powinni robić tak, jak mówię'],
    gift: 'Kiedy zintegrowany — staje się odważnym przywódcą, który wie, kiedy prowadzić, a kiedy ustąpić.',
    practice: 'Praktykuj jeden dzień pełnego słuchania — bez przerywania, bez oceniania, bez dawania rad. Pozwól innym mieć rację.',
  },
  {
    id: 'ofiara',
    name: 'Ofiara',
    emoji: '😔',
    color: '#60A5FA',
    desc: 'Czuje się bezsilna, skrzywdzona przez los i innych. Ofiara w cieniu szuka ratunku z zewnątrz, zamiast budować własną sprawczość.',
    signs: ['Dlaczego zawsze mi się to przytrafia?', 'Nikt mnie nie rozumie ani nie docenia', 'Jestem bezsilna wobec okoliczności', 'Inni zawsze mają lepiej'],
    gift: 'Kiedy zintegrowana — staje się wrażliwą osobą, która potrafi prosić o pomoc i budować autentyczne wsparcie.',
    practice: 'Zapisz trzy rzeczy, na które masz wpływ w trudnej sytuacji. Zacznij od najmniejszej zmiany — to wyjście z roli ofiary.',
  },
  {
    id: 'sabotazysta',
    name: 'Sabotażysta',
    emoji: '💣',
    color: '#F97316',
    desc: 'Niszczy własne starania tuż przed sukcesem. Sabotażysta działa z lęku przed porażką, odrzuceniem lub niebycia wystarczająco dobrym.',
    signs: ['Prokrastynatuję przed ważnymi sprawami', 'Niszczę relacje zanim staną się zbyt bliskie', 'Porzucam projekty tuż przed końcem', 'Nie zasługuję na powodzenie'],
    gift: 'Kiedy zintegrowany — staje się głosem roztropności, który zna własne granice i wie, kiedy powiedzieć "nie".',
    practice: 'Zauważaj momenty, gdy chcesz odpuścić. Zapytaj: "Czego się boję, że stanie się, gdy mi się uda?" Napisz odpowiedź.',
  },
  {
    id: 'uciekinier',
    name: 'Uciekinier',
    emoji: '🏃',
    color: '#34D399',
    desc: 'Ucieka od trudnych uczuć, sytuacji i odpowiedzialności przez rozrywkę, pracę, uzależnienia lub fantazjowanie.',
    signs: ['Kiedy jest trudno, szukam rozrywki', 'Mam problem z trwaniem w niewygodzie', 'Wolę wyobrażać przyszłość niż działać tu i teraz', 'Opuszczam relacje, gdy robi się głęboko'],
    gift: 'Kiedy zintegrowany — staje się wizjonerem, który potrafi zarówno marzyć, jak i zakorzenić się w działaniu.',
    practice: 'Siedź 5 minut z trudnym uczuciem bez żadnej ucieczki. Oddychaj i obserwuj — uczucia przemijają szybciej niż myślisz.',
  },
  {
    id: 'perfekcjonista',
    name: 'Perfekcjonista',
    emoji: '📐',
    color: '#FBBF24',
    desc: 'Nigdy nie jest wystarczająco dobry — ani on, ani inni. Perfekcjonista ukrywa głęboki wstyd lub lęk przed byciem niewystarczającym.',
    signs: ['Odkładam bo "jeszcze nie jest gotowe"', 'Krytykuję siebie i innych za błędy', 'Nie mogę odpocząć przy niedokończonej pracy', 'Sukces nie daje satysfakcji — już szukam kolejnego'],
    gift: 'Kiedy zintegrowany — staje się mistrzem jakości, który wie, kiedy "wystarczająco dobre" naprawdę wystarczy.',
    practice: 'Celowo zrób coś niedoskonale: wyślij wiadomość bez redagowania, zostaw naczynia na rano. Obserwuj reakcję ciała.',
  },
  {
    id: 'kontroler',
    name: 'Kontroler',
    emoji: '🔒',
    color: '#A78BFA',
    desc: 'Musi kontrolować ludzi i sytuacje, bo głęboko boi się chaosu lub utraty. Za potrzebą kontroli kryje się często przeżyta bezsilność.',
    signs: ['Muszę wiedzieć co się wydarzy', 'Nie ufam innym z ważnymi zadaniami', 'Spontaniczność mnie niepokoi', 'Muszę planować każdy szczegół'],
    gift: 'Kiedy zintegrowany — staje się ekspertem organizacji, który potrafi prowadzić projekty i jednocześnie ufać zespołowi.',
    practice: 'Pozwól komuś zająć się czymś bez Twojej kontroli — i obserwuj, czy naprawdę coś się posypało.',
  },
  {
    id: 'martyr',
    name: 'Martyr',
    emoji: '🕯️',
    color: '#F472B6',
    desc: 'Poświęca siebie dla innych, często oczekując uznania lub czując się winnym, gdy dba o siebie. Martyr płaci wysoką cenę za miłość.',
    signs: ['Dbanie o siebie wydaje się egoizmem', 'Pomagam nawet gdy jestem wyczerpana', 'Oczekuję, że inni docenią moje poświęcenie', 'Czuję się winna, gdy stawiam swoje potrzeby na pierwszym miejscu'],
    gift: 'Kiedy zintegrowany — staje się hojnym dawcą, który zna swoje granice i daje z pełni, nie z pustki.',
    practice: 'Powiedz "nie" jednej prośbie dzisiaj — bez tłumaczenia, bez przepraszania. To akt odwagi, nie egoizmu.',
  },
  {
    id: 'uzalezniony',
    name: 'Uzależniony',
    emoji: '🌀',
    color: '#EC4899',
    desc: 'Szuka ulgi od bólu w zewnętrznych substancjach lub zachowaniach. Za uzależnieniem zawsze kryje się ból, który szuka łagodzenia.',
    signs: ['Sięgam po coś zewnętrznego gdy jest trudno', 'Trudno mi siedzieć ze spokojem', 'Jedna porcja nigdy nie wystarczy', 'Wiem, że to mi nie służy, ale mimo to to robię'],
    gift: 'Kiedy zintegrowany — staje się osobą o głębokiej empatii dla ludzkiego bólu i ogromnej sile wewnętrznej.',
    practice: 'Zapytaj przy następnym "głodzie": "Co naprawdę potrzebuję teraz? Co ten ból chce mi powiedzieć?"',
  },
];

// ── PROJECTION INVENTORY ─────────────────────────────────────────
const PROJECTION_TRIGGERS = [
  { id: 'p1', trigger: 'Ktoś jest arogancki i wszystkowiedzący', shadow: 'Możliwe, że w Tobie żyje niepewność i pragnienie bycia dostrzeżonym. Arogancja innych boli nas najbardziej gdy sami boimy się być "zbyt dużo".', color: '#EF4444' },
  { id: 'p2', trigger: 'Ktoś jest leniwy i nic nie robi', shadow: 'Może Twój wewnętrzny perfekcjonista nie pozwala Ci odpocząć? Irytacja na "leni" często kryje wyparte pragnienie odpuszczenia.', color: '#F97316' },
  { id: 'p3', trigger: 'Ktoś jest zbyt emocjonalny lub wrażliwy', shadow: 'Często odrzucamy u innych to, co sami wyparliśmy. Czy pozwalasz sobie być wrażliwym/wrażliwą bez oceniania siebie?', color: '#60A5FA' },
  { id: 'p4', trigger: 'Ktoś jest zbyt pewny siebie', shadow: 'Pewność siebie innych może uaktywniać nasz wewnętrzny głos niepewności. Co by się stało gdybyś Ty tak ufał/a sobie?', color: '#FBBF24' },
  { id: 'p5', trigger: 'Ktoś nie dotrzymuje słowa', shadow: 'Czy jest obszar, gdzie Ty sam/a nie dotrzymujesz obietnic — sobie lub innym? Nierzetelność innych boli nas gdy sami walczymy z lojalnością wobec siebie.', color: '#A78BFA' },
  { id: 'p6', trigger: 'Ktoś jest zbyt głośny lub dominujący', shadow: 'Czy Twój własny głos gdzieś zamilkł? Intensywna reakcja na dominację często wskazuje na niewyraźne własne granice lub wyparte pragnienie bycia słyszanym.', color: '#34D399' },
  { id: 'p7', trigger: 'Ktoś jest ofiarą i ciągle narzeka', shadow: 'Gdzie Ty sam/a czujesz bezsilność, której nie przyznajesz? Irytacja na ofiary kryje często własny, schowany ból.', color: '#F472B6' },
  { id: 'p8', trigger: 'Ktoś jest materialny i skupiony na pieniądzach', shadow: 'Czy sam/a masz nierozwiązany stosunek do pieniędzy lub bezpieczeństwa materialnego? Czego się boisz stracić?', color: '#EC4899' },
  { id: 'p9', trigger: 'Ktoś zawsze musi mieć ostatnie słowo', shadow: 'Może jest temat, gdzie czujesz że nie masz prawa głosu? Potrzeba dominacji w rozmowie może odzwierciedlać miejsce, gdzie my sami czujemy się niesłyszani.', color: '#818CF8' },
  { id: 'p10', trigger: 'Ktoś jest zbyt zależny od innych', shadow: 'Czy boisz się prosić o pomoc? Intensywna reakcja na zależność innych często wskazuje na własną, wypieraną potrzebę bycia zaopiekowanym.', color: '#6EE7B7' },
];

// ── INNER CHILD VISUALIZATION ────────────────────────────────────
const INNER_CHILD_SCRIPT = [
  'Zamknij oczy i weź trzy głębokie oddechy. Z każdym wydechem ciało opada głębiej w spokój.',
  'Wyobraź sobie, że idziesz ścieżką przez spokojny las. Drzewa są wysokie, powietrze jest ciepłe i bezpieczne.',
  'Na polanie widzisz małe dziecko — to Ty. Może ma 4, 5, 7 lat. Obserwuj je przez chwilę. Jak wygląda? Co robi?',
  'Podejdź powoli. Dziecko Cię zauważa. Usiądź obok niego na trawie — na jego poziomie.',
  'Patrz mu w oczy. Jest tam jakaś potrzeba, jakaś prośba. Możesz ją poczuć zanim zostanie wyrażona słowami.',
  'Powiedz temu dziecku: "Jestem tutaj. Widzę cię. Nie odejdę."',
  'Zostań z nim przez chwilę w ciszy. Nie musisz nic naprawiać — wystarczy, że jesteś.',
];

// ── INTEGRATION TRACKER ──────────────────────────────────────────
const INTEGRATION_AREAS = [
  { id: 'fear', label: 'Lęk', color: '#60A5FA', desc: 'Postęp w konfrontacji i akceptacji własnych lęków' },
  { id: 'anger', label: 'Gniew', color: '#EF4444', desc: 'Praca z gniewem jako sygnałem, nie wrogiem' },
  { id: 'grief', label: 'Żal', color: '#A78BFA', desc: 'Przejście przez żal ku akceptacji i dalej' },
  { id: 'shame', label: 'Wstyd', color: '#F97316', desc: 'Oswajanie wstydu — od ukrycia do łagodności' },
  { id: 'projection', label: 'Projekcja', color: '#FBBF24', desc: 'Rozpoznawanie własnych wzorców w innych' },
];

// ── GROUNDING PRACTICES ──────────────────────────────────────────
const GROUNDING_PRACTICES = [
  { id: 'g1', emoji: '🌱', title: '5-4-3-2-1', desc: 'Nazwij: 5 rzeczy które widzisz, 4 które słyszysz, 3 które możesz dotknąć, 2 które czujesz węchem, 1 którą smakujesz. To zakotwicza w tu i teraz.', duration: '2 min' },
  { id: 'g2', emoji: '🌊', title: 'Oddech 4-7-8', desc: 'Wdech przez 4 sekundy, wstrzymaj przez 7, wydech przez 8. Powtórz 4 razy. Aktywuje nerw błędny i uspokaja układ nerwowy przed/po głębokiej pracy.', duration: '3 min' },
  { id: 'g3', emoji: '🌍', title: 'Stopy na ziemi', desc: 'Stań boso lub w skarpetkach. Poczuj podłogę pod stopami. Przejdź powoli po pomieszczeniu, czując każdy krok. Ziemia zawsze jest pod Tobą.', duration: '5 min' },
  { id: 'g4', emoji: '🤲', title: 'Chłodna woda', desc: 'Umyj ręce lub twarz chłodną wodą. Poczuj jej temperaturę, ciężar, ruch. To prosty a skuteczny reset układu nerwowego po intensywnej emocji.', duration: '1 min' },
  { id: 'g5', emoji: '💜', title: 'Ręka na sercu', desc: 'Połóż prawą dłoń na klatce piersiowej. Poczuj bicie serca. Powiedz sobie: "Jestem bezpieczna/y. To tylko uczucie. Minęło — lub minie."', duration: '2 min' },
];

export const ShadowWorkScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { addEntry, deleteEntry, entries: _journalEntries } = useJournalStore();
  const journalEntries = _journalEntries ?? [];
  const { themeName, shadowWorkSessions: _shadowWorkSessions, addShadowSession, deleteShadowSession, addFavoriteItem, isFavoriteItem, removeFavoriteItem, userData } = useAppStore();
  const shadowWorkSessions = _shadowWorkSessions ?? [];
  // Always dark aesthetic
  const textColor = '#F0E8FF';
  const subColor = 'rgba(255,255,255,0.50)';
  const cardBg = 'rgba(255,255,255,0.05)';
  const inputBg = 'rgba(255,255,255,0.07)';

  const [activeArea, setActiveArea] = useState<ShadowArea | null>(null);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [reflection, setReflection] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [workbenchAnchorY, setWorkbenchAnchorY] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const totalSessions = shadowWorkSessions.length;
  const recentAreas = [...new Set(shadowWorkSessions.slice(0, 5).map(s => s.areaId))];

  const handleAreaSelect = (area: ShadowArea) => {
    void HapticsService.selection();
    setActiveArea(area);
    setActiveQuestion(0);
    setReflection('');
    setAiResponse('');
    setSaved(false);
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(workbenchAnchorY - 40, 0), animated: true }), 220);
  };

  const focusIntoView = (offset = 0) => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(workbenchAnchorY + offset - 120, 0), animated: true }), 180);
  };

  const saveToJournal = () => {
    if (!activeArea || reflection.trim().length < 2) return;
    const session: ShadowSession = {
      id: `sw_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      areaId: activeArea.id,
    };
    addShadowSession(session);
    addEntry({

      title: `Praca z cieniem: ${activeArea.label}`,
      content: `**Pytanie:** ${activeArea.questions[activeQuestion]}\n\n${reflection}${aiResponse ? `\n\n**Oracle:** ${aiResponse}` : ''}`,
      type: 'shadow',
      mood: 'reflective',
    } as any);
    void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
  };

  const saveAnonymous = () => {
    if (!activeArea) return;
    const session: ShadowSession = {
      id: `sw_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      areaId: activeArea.id,
    };
    addShadowSession(session);
    void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setReflection('');
  };

  const askOracle = async () => {
    if (!activeArea || reflection.trim().length < 2) return;
    setLoadingAI(true);
    try {
      const sessionCount = shadowWorkSessions.length;
      const personLine = userData?.name ? `Osoba: ${userData.name}.` : '';
      const historyLine = sessionCount > 0 ? ` Przeprowadziła już ${sessionCount} sesji pracy z cieniem.` : ' To jej pierwsza sesja pracy z cieniem.';
      const response = await AiService.chatWithOracle([{
        role: 'user',
        content: `Jesteś głębokim przewodnikiem pracy z cieniem Jungowskim — mądrym, ciepłym, bez oceniania. ${personLine}${historyLine}

Obszar cienia: ${activeArea.label}
Pytanie, z którym pracuje: "${activeArea.questions[activeQuestion]}"
Jej/jego refleksja: "${reflection}"

Odpowiedz w jeden z dwóch sposobów (wybierz ten, który bardziej otwiera):
A) Jedno głębokie pytanie pogłębiające, które idzie tam, gdzie refleksja się zatrzymała
B) Jedna precyzyjna obserwacja Jungowska, która pokazuje ukryty wzorzec w tej refleksji

Zasady:
— Nie potwierdzaj i nie waliduj bezpośrednio
— Nie dawaj gotowych odpowiedzi — otwieraj, nie zamykaj
— Mów prosto i konkretnie, bez ezotorycznego żargonu
— Nawiąż do konkretnych słów z refleksji tej osoby
— Max 3-4 zdania

Pisz w języku użytkownika.`,
      }], i18n.language?.startsWith('en') ? 'en' : 'pl');
      setAiResponse(response);
    } catch {
      setAiResponse(i18n.language?.startsWith('en') ? 'The Oracle is quiet right now. Stay with your reflection — it already contains the answer.' : 'Oracle milczy teraz. Zostań ze swoją refleksją — ona sama jest odpowiedzią.');
    }
    setLoadingAI(false);
  };

  return (
    <View style={[sw.container, { backgroundColor: '#06030F' }]}>
      <ShadowBg />
      <SafeAreaView edges={['top']} style={sw.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* HEADER */}
          <View style={sw.header}>
            <Pressable onPress={() => goBackOrToMainTab(navigation, 'Home')} style={sw.backBtn} hitSlop={20}>
              <ChevronLeft color={ACCENT} size={26} strokeWidth={1.6} />
            </Pressable>
            <View style={sw.headerCenter}>
              <Typography variant="premiumLabel" color={ACCENT}>Ty</Typography>
              <Typography variant="screenTitle" style={{ marginTop: 3, color: textColor }}>Praca z cieniem</Typography>
            </View>
            <Pressable
              onPress={() => { if (isFavoriteItem('shadow_work')) { removeFavoriteItem('shadow_work'); } else { addFavoriteItem({ id: 'shadow_work', label: 'Praca z cieniem', route: 'ShadowWork', params: {}, icon: 'EyeOff', color: ACCENT, addedAt: new Date().toISOString() }); } }}
              style={[sw.backBtn, { alignItems: 'center', justifyContent: 'center' }]}
              hitSlop={12}
            >
              <Star color={isFavoriteItem('shadow_work') ? ACCENT : ACCENT + '88'} size={18} strokeWidth={1.8} fill={isFavoriteItem('shadow_work') ? ACCENT : 'none'} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[sw.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') + 100 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* DARK SIGIL 3D */}
            <DarkSigil3D accent={ACCENT} />

            {/* INTRO */}
            <Animated.View entering={FadeInDown.duration(500)} style={[sw.introCard, { backgroundColor: cardBg }]}>
              <Brain color={ACCENT} size={20} strokeWidth={1.5} />
              <Text style={[sw.introText, { color: subColor }]}>
                Praca z cieniem według Junga to odkrywanie i integrowanie odrzuconych części siebie. To przestrzeń na szczerość bez oceniania.
              </Text>
            </Animated.View>

            {/* JAK PRACOWAĆ Z CIENIEM — guide */}
            <Animated.View entering={FadeInDown.delay(30).duration(500)} style={[sw.guideCard, { backgroundColor: 'rgba(139,92,246,0.07)', borderColor: ACCENT + '28' }]}>
              <LinearGradient colors={['rgba(139,92,246,0.10)', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <Text style={[sw.guideTitle, { color: ACCENT }]}>🌑 JAK PRACOWAĆ Z CIENIEM</Text>
              {[
                { n: '1', title: 'Rozpoznaj', desc: 'Zauważ intensywną reakcję emocjonalną — gniew, wstyd, zazdrość — to cień daje o sobie znak.' },
                { n: '2', title: 'Zbadaj', desc: 'Zamiast odpychać uczucie, zejdź głębiej: skąd pochodzi? Co kryje w sobie ten wzorzec?' },
                { n: '3', title: 'Zintegruj', desc: 'Przyjmij odrzuconą część z łagodnością — integracja jest celem, nie eliminacja.' },
              ].map((tip) => (
                <View key={tip.n} style={sw.guideTip}>
                  <View style={[sw.guideBadge, { backgroundColor: ACCENT + '20', borderColor: ACCENT + '40' }]}>
                    <Text style={[sw.guideBadgeText, { color: ACCENT }]}>{tip.n}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[sw.guideTipTitle, { color: '#E0D4FF' }]}>{tip.title}</Text>
                    <Text style={[sw.guideTipDesc, { color: 'rgba(255,255,255,0.50)' }]}>{tip.desc}</Text>
                  </View>
                </View>
              ))}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(40).duration(500)} style={[sw.ritualCard, { backgroundColor: 'rgba(139,92,246,0.09)', borderColor: ACCENT + '32' }]}>
              <LinearGradient colors={[ACCENT + '18', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <Typography variant="premiumLabel" color={ACCENT}>Ceremonia zejścia głębiej</Typography>
              <Text style={[sw.ritualLead, { color: textColor }]}>Nie wybieraj obszaru, który brzmi najładniej. Wybierz ten, przy którym ciało lekko się napina. Tam zwykle zaczyna się prawdziwa praca.</Text>
              <View style={sw.ritualSteps}>
                {['Nazwij obszar, zamiast go obchodzić.', 'Wybierz pytanie, które otwiera napięcie, nie to najwygodniejsze.', 'Zapisz odpowiedź bez poprawiania siebie.'].map((step, index) => (
                  <View key={step} style={[sw.ritualStep, { borderColor: ACCENT + '1E' }]}>
                    <View style={[sw.ritualBadge, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '28' }]}>
                      <Text style={[sw.ritualBadgeText, { color: ACCENT }]}>{index + 1}</Text>
                    </View>
                    <Text style={[sw.ritualStepText, { color: subColor }]}>{step}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(50).duration(500)} style={[sw.chamberCard, { backgroundColor: 'rgba(255,255,255,0.045)', borderColor: ACCENT + '28' }]}>
              <LinearGradient colors={[ACCENT + '16', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <View style={sw.chamberTop}>
                <View style={[sw.chamberSeal, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '32' }]}>
                  <Gem color={ACCENT} size={16} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="premiumLabel" color={ACCENT}>KOMNATA INTEGRACJI</Typography>
                  <Text style={[sw.chamberLead, { color: textColor }]}>Ten ekran ma prowadzić Cię w dół, nie zasypywać Cię jedną kartą pod drugą. Każdy obszar cienia ma własny ton, własne pytania i własny rytm wejścia.</Text>
                </View>
              </View>
              <View style={sw.chamberRow}>
                <View style={[sw.chamberPill, { borderColor: '#60A5FA55', backgroundColor: '#60A5FA12' }]}><ShieldAlert color="#60A5FA" size={14} /><Text style={[sw.chamberPillText, { color: '#9DC4FF' }]}>obszar uruchamia ciało</Text></View>
                <View style={[sw.chamberPill, { borderColor: '#FBBF2455', backgroundColor: '#FBBF2410' }]}><Sparkles color="#FBBF24" size={14} /><Text style={[sw.chamberPillText, { color: '#FDD87B' }]}>oracle pogłębia, nie zamyka</Text></View>
              </View>
            </Animated.View>

            {/* STAT RAIL */}
            <Animated.View entering={FadeInDown.delay(60).duration(500)} style={sw.statRail}>
              {[
                { label: 'Sesje', val: String(totalSessions) },
                { label: 'Obszary', val: String(new Set(shadowWorkSessions.map(s => s.areaId)).size) + '/5' },
              ].map((s, i) => (
                <View key={i} style={[sw.statItem, { backgroundColor: cardBg }]}>
                  <Text style={[sw.statVal, { color: ACCENT }]}>{s.val}</Text>
                  <Text style={[sw.statLabel, { color: subColor }]}>{s.label}</Text>
                </View>
              ))}
            </Animated.View>

            {/* SESJA POPRZEDNIA */}
            {shadowWorkSessions.length > 0 && (() => {
              const last = shadowWorkSessions[shadowWorkSessions.length - 1];
              const lastArea = SHADOW_AREAS.find(a => a.id === last.areaId);
              const lastJournal = journalEntries.slice().reverse().find(e => (e.type as string) === 'shadow');
              const preview = lastJournal?.content ? lastJournal.content.replace(/\*\*[^*]+\*\*:\s*/g, '').replace(/\n/g, ' ').trim().slice(0, 80) : null;
              return (
                <Animated.View entering={FadeInDown.delay(100).duration(500)} style={[sw.prevCard, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: lastArea ? lastArea.color + '33' : ACCENT + '28' }]}>
                  <LinearGradient colors={[lastArea ? lastArea.color + '0D' : ACCENT + '0D', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                  <Text style={[sw.prevLabel, { color: subColor }]}>SESJA POPRZEDNIA</Text>
                  <View style={sw.prevRow}>
                    <View style={[sw.prevBadge, { backgroundColor: lastArea ? lastArea.color + '18' : ACCENT + '18', borderColor: lastArea ? lastArea.color + '44' : ACCENT + '44' }]}>
                      <Text style={[sw.prevBadgeText, { color: lastArea?.color || ACCENT }]}>{lastArea?.label || last.areaId}</Text>
                    </View>
                    <Text style={[sw.prevDate, { color: subColor }]}>{last.date}</Text>
                  </View>
                  {preview && (
                    <Text style={[sw.prevSnippet, { color: 'rgba(255,255,255,0.45)' }]} numberOfLines={2}>{preview}…</Text>
                  )}
                </Animated.View>
              );
            })()}

            {/* AREA CHIPS */}
            <Animated.View entering={FadeInDown.delay(120).duration(500)}>
              <Text style={[sw.sectionTitle, { color: subColor }]}>🌑 WYBIERZ OBSZAR CIENIA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sw.chipScroll} contentContainerStyle={{ paddingHorizontal: layout.padding.screen }}>
                {SHADOW_AREAS.map(area => (
                  <Pressable
                    key={area.id}
                    onPress={() => handleAreaSelect(area)}
                    style={[sw.chip, activeArea?.id === area.id && { backgroundColor: area.color + '22', borderColor: area.color }]}
                  >
                    <Text style={[sw.chipText, { color: activeArea?.id === area.id ? area.color : subColor }]}>{area.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>

            {/* ACTIVE AREA */}
            {activeArea && (
              <Animated.View entering={FadeInDown.duration(400)} style={{ marginHorizontal: layout.padding.screen }} onLayout={(event) => setWorkbenchAnchorY(event.nativeEvent.layout.y)}>
                <View style={[sw.areaHeader, { backgroundColor: activeArea.color + '14', borderColor: activeArea.color + '33' }]}>
                  <Text style={[sw.areaName, { color: activeArea.color }]}>{activeArea.label}</Text>
                  <Text style={[sw.areaDesc, { color: subColor }]}>{activeArea.desc}</Text>
                </View>

                {/* Question selector */}
                <Text style={[sw.sectionTitle, { color: subColor }]}>🔮 PYTANIE REFLEKSYJNE</Text>
                {activeArea.questions.map((q, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setActiveQuestion(i)}
                    style={[sw.questionCard, activeQuestion === i && { backgroundColor: activeArea.color + '15', borderColor: activeArea.color + '44' }]}
                  >
                    <View style={[sw.questionNum, { backgroundColor: activeQuestion === i ? activeArea.color : activeArea.color + '44' }]}>
                      <Text style={sw.questionNumText}>{i + 1}</Text>
                    </View>
                    <Text style={[sw.questionText, { color: activeQuestion === i ? textColor : subColor }]}>{q}</Text>
                  </Pressable>
                ))}

                {/* Reflection input */}
                <Text style={[sw.sectionTitle, { color: subColor, marginTop: 16 }]}>✍️ TWOJA REFLEKSJA</Text>
                <MysticalInput
                  value={reflection}
                  onChangeText={setReflection}
                  multiline
                  placeholder="Pisz szczerze i bez oceniania. Ten tekst jest tylko dla Ciebie..."
                  textAlignVertical="top"
                  containerStyle={{ marginBottom: 14 }}
                  style={{ minHeight: 120, fontSize: 15, lineHeight: 24, color: textColor }}
                  onFocusScroll={() => focusIntoView(210)}
                />

                {/* AI response */}
                {aiResponse ? (
                  <View style={[sw.aiCard, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '33' }]}>
                    <Text style={[sw.aiLabel, { color: ACCENT }]}>ORACLE</Text>
                    <Text style={[sw.aiText, { color: textColor }]}>{aiResponse}</Text>
                  </View>
                ) : null}

                {/* Saved banner — stays inline */}
                {saved && (
                  <View style={[sw.savedBanner, { backgroundColor: ACCENT + '18' }]}>
                    <Text style={[sw.savedText, { color: ACCENT }]}>✓ Sesja zapisana</Text>
                  </View>
                )}
              </Animated.View>
            )}

            {/* EDU CARDS */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              <Text style={[sw.sectionTitle, { color: subColor, marginHorizontal: layout.padding.screen }]}>📖 DLACZEGO PRACA Z CIENIEM</Text>
              {EDU_CARDS.map((c, i) => (
                <View key={i} style={[sw.eduCard, { backgroundColor: cardBg, marginHorizontal: layout.padding.screen }]}>
                  <View style={[sw.eduBar, { backgroundColor: ACCENT }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[sw.eduTitle, { color: textColor }]}>{c.title}</Text>
                    <Text style={[sw.eduBody, { color: subColor }]}>{c.body}</Text>
                  </View>
                </View>
              ))}
            </Animated.View>

            {/* HISTORY */}
            {shadowWorkSessions.length > 0 && (
              <Animated.View entering={FadeInDown.delay(280).duration(500)}>
                <Text style={[sw.sectionTitle, { color: subColor, marginHorizontal: layout.padding.screen }]}>🕯️ HISTORIA SESJI</Text>
                {shadowWorkSessions.slice(0, 5).map((s, i) => (
                  <View key={s.id || i} style={[sw.histItem, { backgroundColor: cardBg, marginHorizontal: layout.padding.screen }]}>
                    <Clock color={ACCENT} size={13} strokeWidth={1.5} />
                    <Text style={[sw.histText, { color: subColor, flex: 1 }]}>
                      {s.date} · {SHADOW_AREAS.find(a => a.id === s.areaId)?.label || s.areaId}
                    </Text>
                    <Pressable hitSlop={10} onPress={() => Alert.alert('Usuń sesję', 'Czy na pewno chcesz usunąć tę sesję?', [
                      { text: 'Anuluj', style: 'cancel' },
                      { text: 'Usuń', style: 'destructive', onPress: () => deleteShadowSession(s.id) },
                    ])}>
                      <Trash2 size={14} color={'#EF4444'} strokeWidth={1.6} />
                    </Pressable>
                  </View>
                ))}
              </Animated.View>
            )}

            {/* CO DALEJ */}
            <Animated.View entering={FadeInDown.delay(320).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginTop: 20, marginBottom: 4 }}>
              <Text style={[sw.sectionTitle, { color: subColor }]}>✦ CO DALEJ?</Text>
              {[
                {
                  icon: <Wand2 color={ACCENT} size={16} strokeWidth={1.8} />,
                  label: 'Zapytaj wyrocznię',
                  sub: 'Pogłębiona rozmowa z Oracle',
                  color: ACCENT,
                  onPress: () => navigation.navigate('Oracle'),
                },
                {
                  icon: <Wind color="#A0D8EF" size={16} strokeWidth={1.8} />,
                  label: 'Integracja przez ciszę',
                  sub: 'Medytacja po pracy z cieniem',
                  color: '#A0D8EF',
                  onPress: () => navigation.navigate('Meditation'),
                },
                {
                  icon: <BookOpen color="#C084FC" size={16} strokeWidth={1.8} />,
                  label: 'Zapisz w dzienniku',
                  sub: 'Który aspekt cienia ujawnił się dziś i co chcę z tym zrobić?',
                  color: '#C084FC',
                  onPress: () => navigation.navigate('JournalEntry', { prefillPrompt: 'Który aspekt cienia ujawnił się dziś i co chcę z tym zrobić?' }),
                },
              ].map((item, i) => (
                <Pressable
                  key={i}
                  onPress={item.onPress}
                  style={[sw.nextCard, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: item.color + '28' }]}
                >
                  <LinearGradient colors={[item.color + '10', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                  <View style={[sw.nextIconBox, { backgroundColor: item.color + '18', borderColor: item.color + '33' }]}>
                    {item.icon}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[sw.nextLabel, { color: '#E0D4FF' }]}>{item.label}</Text>
                    <Text style={[sw.nextSub, { color: 'rgba(255,255,255,0.45)' }]} numberOfLines={2}>{item.sub}</Text>
                  </View>
                  <ArrowRight color={'rgba(255,255,255,0.30)'} size={16} strokeWidth={1.8} />
                </Pressable>
              ))}
            </Animated.View>

            <EndOfContentSpacer size="standard" />
          </ScrollView>

          {/* FLOATING FOOTER — Oracle + save buttons when area is active and not yet saved */}
          {activeArea && !saved && (
            <View style={[sw.btnRow, { position: 'absolute', bottom: keyboardHeight > 0 ? Math.max(insets.bottom + 6, keyboardHeight + 4) : insets.bottom + 10, left: 16, right: 16 }]}>
              {AiService.isLaunchAvailable() && reflection.length > 20 && (
                <Pressable onPress={askOracle} style={[sw.oracleBtn, { borderColor: ACCENT }]} disabled={loadingAI}>
                  <Text style={[sw.oracleBtnText, { color: ACCENT }]}>{loadingAI ? 'Oracle myśli...' : 'Zapytaj Oracle'}</Text>
                </Pressable>
              )}
              <View style={sw.saveRow}>
                <Pressable onPress={saveToJournal} style={[sw.saveBtn, { backgroundColor: ACCENT }]} disabled={reflection.trim().length < 2}>
                  <BookOpen color="#fff" size={15} strokeWidth={2} />
                  <Text style={sw.saveBtnText}>Zapisz do dziennika</Text>
                </Pressable>
                <Pressable onPress={saveAnonymous} style={[sw.anonBtn, { borderColor: ACCENT + '44' }]}>
                  <EyeOff color={subColor} size={15} strokeWidth={1.8} />
                  <Text style={[sw.anonBtnText, { color: subColor }]}>Anonimowo</Text>
                </Pressable>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const sw = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingVertical: 10, gap: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  scroll: { paddingTop: 8 },
  introCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginHorizontal: layout.padding.screen, padding: 14, borderRadius: 14, marginBottom: 16 },
  introText: { flex: 1, fontSize: 13, lineHeight: 20 },
  ritualCard: { marginHorizontal: layout.padding.screen, borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 14, overflow: 'hidden', shadowColor: '#8B5CF6', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 14 } },
  chamberCard: { marginHorizontal: layout.padding.screen, borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 14, overflow: 'hidden' },
  chamberTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  chamberSeal: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chamberLead: { fontSize: 13.5, lineHeight: 22, marginTop: 6 },
  chamberRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  chamberPill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chamberPillText: { fontSize: 11.5, fontWeight: '700' },
  ritualLead: { marginTop: 10, fontSize: 15, lineHeight: 24, fontWeight: '600' },
  ritualSteps: { marginTop: 14, gap: 10 },
  ritualStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  ritualBadge: { width: 28, height: 28, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ritualBadgeText: { fontSize: 12, fontWeight: '800' },
  ritualStepText: { flex: 1, fontSize: 12.5, lineHeight: 19 },
  statRail: { flexDirection: 'row', gap: 10, marginHorizontal: layout.padding.screen, marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  statVal: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 2 },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10, marginTop: 16 },
  chipScroll: { marginBottom: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.06)' },
  chipText: { fontSize: 13, fontWeight: '600' },
  areaHeader: { borderRadius: 22, padding: 18, borderWidth: 1, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  areaName: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  areaDesc: { fontSize: 13, lineHeight: 20 },
  questionCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: 'transparent', marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.04)', shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  questionNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  questionNumText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  questionText: { flex: 1, fontSize: 13, lineHeight: 20 },
  input: { borderRadius: 14, padding: 16, minHeight: 120, fontSize: 15, lineHeight: 24, borderWidth: 1.5, marginBottom: 14 },
  aiCard: { borderRadius: 18, padding: 18, borderWidth: 1, marginBottom: 14, shadowColor: '#8B5CF6', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 10 } },
  aiLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6 },
  aiText: { fontSize: 14, lineHeight: 22 },
  btnRow: { gap: 10 },
  oracleBtn: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 6 },
  oracleBtnText: { fontSize: 14, fontWeight: '600' },
  saveRow: { flexDirection: 'row', gap: 10 },
  saveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  anonBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  anonBtnText: { fontSize: 13, fontWeight: '600' },
  savedBanner: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  savedText: { fontSize: 15, fontWeight: '700' },
  eduCard: { flexDirection: 'row', gap: 12, borderRadius: 14, padding: 14, marginBottom: 10 },
  eduBar: { width: 3, borderRadius: 2 },
  eduTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  eduBody: { fontSize: 13, lineHeight: 19 },
  histItem: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 8 },
  histText: { fontSize: 12, flex: 1 },
  // Guide card
  guideCard: { marginHorizontal: layout.padding.screen, borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14, overflow: 'hidden' },
  guideTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.3, marginBottom: 12 },
  guideTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  guideBadge: { width: 28, height: 28, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  guideBadgeText: { fontSize: 12, fontWeight: '800' },
  guideTipTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  guideTipDesc: { fontSize: 12, lineHeight: 18 },
  // Previous session
  prevCard: { marginHorizontal: layout.padding.screen, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14, overflow: 'hidden' },
  prevLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  prevRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  prevBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  prevBadgeText: { fontSize: 12, fontWeight: '700' },
  prevDate: { fontSize: 11 },
  prevSnippet: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  // Co dalej
  nextCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10, overflow: 'hidden' },
  nextIconBox: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  nextLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  nextSub: { fontSize: 11.5, lineHeight: 17 },
});



