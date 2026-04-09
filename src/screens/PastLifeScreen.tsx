// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet,
  View, Text, TextInput, Alert, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, Path, G, Line, Ellipse, Defs, RadialGradient, Stop,
  Circle as SvgC, Line as SvgL, Path as SvgP, Polygon,
} from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing, cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Sparkles, Clock, BookOpen, ArrowRight,
  Hourglass, Eye, Moon, Scroll, ChevronDown, ChevronUp,
  Wind, Heart, Zap, Shield, Brain, Globe, Gem, History,
  Plus, X, ChevronRight, Sun,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { CelestialBackdrop } from '../components/CelestialBackdrop';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { formatLocaleDate } from '../core/utils/localeFormat';
import { useTheme } from '../core/hooks/useTheme';
const ACCENT = '#A78BFA';

// ── BACKGROUND ──────────────────────────────────────────────────
const PastLifeBg = ({ isLight }: { isLight: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight
        ? ['#FAF3E8', '#F2E5D0', '#E8D5B8']
        : ['#04020E', '#07031A', '#0B0524', '#10062E']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width="100%" height={600} style={StyleSheet.absoluteFill} opacity={isLight ? 0.10 : 0.22}>
      <G>
        {/* Spiral galaxy wisps */}
        {[0, 1, 2].map(i => (
          <Path
            key={`wsp${i}`}
            d={`M${80 + i * 120} 40 Q${200 + i * 40} 200 ${120 + i * 100} 380`}
            stroke="#A78BFA"
            strokeWidth={0.6}
            fill="none"
            opacity={0.10 + i * 0.04}
          />
        ))}
        {/* Hourglass silhouette */}
        <Path
          d="M160 80 L240 80 L200 180 L240 280 L160 280 L200 180 Z"
          stroke="#A78BFA"
          strokeWidth={0.8}
          fill="none"
          opacity={0.12}
        />
        {/* Star field */}
        {Array.from({ length: 28 }, (_, i) => (
          <Circle
            key={`st${i}`}
            cx={(i * 137 + 23) % 380}
            cy={(i * 89 + 17) % 560}
            r={i % 7 === 0 ? 1.8 : 0.7}
            fill="#C4B5FD"
            opacity={0.18 + (i % 5) * 0.04}
          />
        ))}
        {/* Eye of Horus faint */}
        <Ellipse cx={200} cy={310} rx={44} ry={22} stroke="#A78BFA" strokeWidth={0.6} fill="none" opacity={0.08} />
        <Circle cx={200} cy={310} r={9} fill="#A78BFA" opacity={0.06} />
      </G>
    </Svg>
  </View>
);

// ── 3D HOURGLASS + EYE OF HORUS + TIMELINE WIDGET ───────────────
const TIMELINE_ERAS = [
  { label: 'Egipt', angle: -80, color: '#F59E0B', r: 72 },
  { label: 'Średniowiecze', angle: -30, color: '#60A5FA', r: 76 },
  { label: 'Renesans', angle: 30, color: '#34D399', r: 72 },
  { label: 'Wiktoria', angle: 80, color: '#F9A8D4', r: 76 },
  { label: 'Nowoczesność', angle: 130, color: '#FBBF24', r: 72 },
];

const SandParticle = React.memo(({ idx, accent }: { idx: number; accent: string }) => {
  const y = useSharedValue(-28 + (idx % 4) * 7);
  useEffect(() => {
    const delay = idx * 200;
    const tid = setTimeout(() => {
      y.value = withRepeat(
        withSequence(withTiming(28, { duration: 2000 + idx * 150 }), withTiming(-28, { duration: 0 })),
        -1, false
      );
    }, delay);
    return () => { clearTimeout(tid); cancelAnimation(y); };
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: 0.6 - (idx % 3) * 0.15,
  }));
  return (
    <Animated.View
      style={[
        style,
        {
          position: 'absolute',
          width: 2,
          height: 2,
          borderRadius: 1,
          backgroundColor: accent,
          left: 98 + (idx % 5) * 3 - 4,
          top: 108,
        },
      ]}
    />
  );
});

const HourglassWidget3D = React.memo(({ accent }: { accent: string }) => {
  const rot = useSharedValue(0);
  const pulse = useSharedValue(0.95);
  const portalGlow = useSharedValue(0.4);
  const tiltX = useSharedValue(-10);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 26000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withSequence(withTiming(1.06, { duration: 3200 }), withTiming(0.95, { duration: 3200 })), -1, false);
    portalGlow.value = withRepeat(withSequence(withTiming(0.9, { duration: 2400 }), withTiming(0.4, { duration: 2400 })), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-24, Math.min(24, -10 + e.translationY * 0.15));
      tiltY.value = Math.max(-24, Math.min(24, e.translationX * 0.15));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-10, { duration: 800 });
      tiltY.value = withTiming(0, { duration: 800 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 580 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: pulse.value },
    ],
  }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot.value}deg` }] }));
  const portalStyle = useAnimatedStyle(() => ({ opacity: portalGlow.value }));

  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>

          {/* Base static SVG: hourglass + Eye of Horus + portal */}
          <Svg width={220} height={220} viewBox="-110 -110 220 220" style={StyleSheet.absoluteFill}>
            {/* Portal circle center */}
            <Circle r={36} fill={accent + '22'} stroke={accent} strokeWidth={1.2} />
            <Circle r={24} fill={accent + '18'} />
            <Circle r={12} fill={accent + '44'} />
            {/* Hourglass frame */}
            <Path d="M-28,-70 L28,-70 L8,-6 L28,70 L-28,70 L-8,-6 Z" fill="none" stroke={accent + '66'} strokeWidth={1.4} />
            {/* Hourglass top sand */}
            <Path d="M-20,-68 L20,-68 L4,-20 L-4,-20 Z" fill={accent + '44'} />
            {/* Hourglass bottom sand accumulation */}
            <Path d="M-18,48 L18,48 L10,30 L-10,30 Z" fill={accent + '55'} />
            {/* Eye of Horus */}
            <Ellipse cx={0} cy={0} rx={18} ry={9} fill="none" stroke={accent + 'CC'} strokeWidth={1.2} />
            <Circle cx={0} cy={0} r={5} fill={accent} opacity={0.9} />
            <Circle cx={0} cy={0} r={2} fill="#000" />
            {/* Horus eye markings */}
            <Path d="M-18,0 Q-22,6 -16,10" fill="none" stroke={accent + '88'} strokeWidth={1} />
            <Path d="M18,0 Q22,6 16,10" fill="none" stroke={accent + '88'} strokeWidth={1} />
            {/* Timeline spiral */}
            <Path
              d="M0,-88 Q50,-60 60,0 Q50,60 0,88 Q-50,60 -60,0 Q-50,-60 0,-88"
              fill="none"
              stroke={accent + '33'}
              strokeWidth={0.8}
              strokeDasharray="3 5"
            />
            {/* Era dots on spiral */}
            {TIMELINE_ERAS.map((era, i) => {
              const rad = (era.angle * Math.PI) / 180;
              return (
                <Circle
                  key={`era${i}`}
                  cx={era.r * Math.cos(rad)}
                  cy={era.r * Math.sin(rad)}
                  r={4}
                  fill={era.color}
                  opacity={0.8}
                />
              );
            })}
            {/* Background stars */}
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return (
                <Circle
                  key={`bst${i}`}
                  cx={95 * Math.cos(a)}
                  cy={95 * Math.sin(a)}
                  r={0.8}
                  fill="#C4B5FD"
                  opacity={0.3}
                />
              );
            })}
          </Svg>

          {/* Rotating ring with era labels */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ringStyle]}>
            <Svg width={220} height={220} viewBox="-110 -110 220 220">
              <Circle r={104} fill="none" stroke={accent + '33'} strokeWidth={0.8} strokeDasharray="2 6" />
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i / 8) * Math.PI * 2;
                return (
                  <Circle
                    key={`rm${i}`}
                    cx={104 * Math.cos(a)}
                    cy={104 * Math.sin(a)}
                    r={2}
                    fill={accent}
                    opacity={0.5}
                  />
                );
              })}
            </Svg>
          </Animated.View>

          {/* Portal glow overlay */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              portalStyle,
              { alignItems: 'center', justifyContent: 'center' },
            ]}
          >
            <Svg width={220} height={220} viewBox="-110 -110 220 220">
              <Circle r={36} fill={accent + '14'} />
            </Svg>
          </Animated.View>

          {/* Sand particles */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <SandParticle key={i} idx={i} accent={accent} />
          ))}
        </Animated.View>
      </GestureDetector>

      {/* Era labels */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 8 }}>
        {TIMELINE_ERAS.map((era, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 10,
              backgroundColor: era.color + '22',
              borderWidth: 1,
              borderColor: era.color + '44',
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: era.color }} />
            <Text style={{ color: era.color, fontSize: 10, fontWeight: '500' }}>{era.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

// ── KARMIC LESSON CARDS DATA ────────────────────────────────────
interface KarmicLesson {
  lifePath: number;
  title: string;
  color: string;
  icon: React.ReactNode;
  lesson: string;
  manifestation: string;
  resolution: string;
}

const KARMIC_LESSONS: KarmicLesson[] = [
  {
    lifePath: 1,
    title: 'Lekcja Niezależności',
    color: '#F87171',
    icon: null,
    lesson: 'Nauczyłeś się polegać na innych w poprzednich wcieleniach. Teraz Twoja dusza potrzebuje rozwinąć wewnętrzną siłę i odwagę do samodzielnych decyzji.',
    manifestation: 'Pojawia się jako strach przed samotnością, odkładanie decyzji, czekanie na innych. Możesz zmagać się z asertywnością lub nadmierną zależnością od akceptacji.',
    resolution: 'Podejmuj codziennie jedną decyzję bez konsultowania jej z innymi. Stwórz projekt wyłącznie dla siebie. Praktykuj chwile prawdziwej samotności jako siłę, nie jako brak.',
  },
  {
    lifePath: 2,
    title: 'Lekcja Jedności',
    color: '#60A5FA',
    icon: null,
    lesson: 'W poprzednich życiach działałeś zbyt indywidualnie, ignorując potrzeby wspólnoty. Twoja dusza teraz uczy się harmonii i delikatnej współpracy.',
    manifestation: 'Wyraża się przez trudności w relacjach partnerskich, strach przed odrzuceniem, nadmierne dostosowywanie się do innych kosztem własnych potrzeb.',
    resolution: 'Ćwicz wyrażanie swoich potrzeb bez przepraszania. Stwórz przestrzeń gdzie jesteś zarówno odbiorcą, jak i dawcą wsparcia — w równowadze.',
  },
  {
    lifePath: 3,
    title: 'Lekcja Wyrażania Siebie',
    color: '#FBBF24',
    icon: null,
    lesson: 'Milczałeś przez wiele wcieleń — z powodu strachu, zakazu lub braku możliwości. Teraz Twoja dusza prosi o pełny głos, kolor i ekspresję.',
    manifestation: 'Objawia się jako blokada twórcza, strach przed publicznym mówieniem, wewnętrzny krytyk tłumiący radość i spontaniczność.',
    resolution: 'Twórz bez celu i bez oceny — rysuj, śpiewaj, pisz dla siebie. Powiedz komuś bliskiej osobie coś pięknego, co myślisz, ale zazwyczaj zatrzymujesz dla siebie.',
  },
  {
    lifePath: 4,
    title: 'Lekcja Budowania',
    color: '#34D399',
    icon: null,
    lesson: 'Poprzednie wcielenia charakteryzowały się niestałością i chaosem. Teraz Twoja dusza pragnie solidnych fundamentów, cierpliwości i systematyczności.',
    manifestation: 'Przejawia się jako opór wobec rutyny, odkładanie ważnych decyzji, trudność z kończeniem projektów i brak zakorzenienia.',
    resolution: 'Stwórz jeden rytuał dnia, którego trzymasz się przez 21 dni. Skończ coś, co zacząłeś dawno temu. Zadbaj o konkretny wymiar swojego życia — dom, finanse, ciało.',
  },
  {
    lifePath: 5,
    title: 'Lekcja Wolności z Odpowiedzialnością',
    color: '#F97316',
    icon: null,
    lesson: 'W poprzednich wcieleniach byłeś ograniczany — przez system, więzienie myśli lub fizyczne kajdany. Teraz Twoja dusza szuka wolności, ale musi nauczyć się jej mądrości.',
    manifestation: 'Wyraża się jako ucieczka przed zaangażowaniem, nadmierna stymulacja, strach przed nudą i głębokimi zobowiązaniami.',
    resolution: 'Praktykuj wolność w jednym obszarze, jednocześnie trzymając odpowiedzialność w innym. Odkryj, że najgłębsza wolność rodzi się w centrum, nie na obrzeżach.',
  },
  {
    lifePath: 6,
    title: 'Lekcja Bezwarunkowej Miłości',
    color: '#F9A8D4',
    icon: null,
    lesson: 'Kochałeś warunkowo przez wiele żyć, lub byłeś kochany tylko pod warunkami. Twoja dusza uczy się teraz miłości bez granic i bez oczekiwań zwrotu.',
    manifestation: 'Pojawia się jako perfekcjonizm, potrzeba bycia potrzebnym, trudność z przyjmowaniem pomocy i poczucie winy gdy odpoczywasz zamiast pomagać.',
    resolution: 'Daj komuś dziś miłość bez oczekiwania podziękowania. Pozwól sobie na niedoskonałość bez samokrytyki. Przyjmij jedno wsparcie gracefully.',
  },
  {
    lifePath: 7,
    title: 'Lekcja Wiary',
    color: '#A78BFA',
    icon: null,
    lesson: 'Poprzednie wcielenia przyniosły głębokie rozczarowania wiarą — religijne, ludzkie lub metafizyczne. Twoja dusza uczy się teraz ufać bez dowodów.',
    manifestation: 'Objawia się jako cynizm duchowy, izolacja społeczna, nadmierna analiza zamiast odczuwania, trudność z zaufaniem innym ludziom.',
    resolution: 'Zacznij od małej wiary: uwierz, że jeden mały znak który dziś zobaczysz jest odpowiedzią na pytanie, które nosisz. Obserwuj co się wydarzy.',
  },
  {
    lifePath: 8,
    title: 'Lekcja Mądrości Władzy',
    color: '#6B7280',
    icon: null,
    lesson: 'Nadużyłeś władzy lub byłeś jej pozbawiony w poprzednich wcieleniach. Teraz Twoja dusza uczy się sprawowania siły z integralnością i służbą.',
    manifestation: 'Wyraża się jako strach przed sukcesem lub obsesja na punkcie sukcesu, trudne relacje z autorytetami, lęk przed odpowiedzialnością za innych.',
    resolution: 'Użyj swojej siły dziś dla kogoś, kto nie może się odwdzięczyć. Podejmij decyzję, która służy długoterminowemu dobru, choć krótkoterminowo kosztuje.',
  },
  {
    lifePath: 9,
    title: 'Lekcja Służby i Puszczania',
    color: '#818CF8',
    icon: null,
    lesson: 'Byłeś przywiązany do osób, miejsc i roli przez wiele wcieleń. Twoja dusza kończy teraz wielki cykl i uczy się puszczania z miłością.',
    manifestation: 'Pojawia się jako nostalgia za przeszłością, trudność z kończeniem relacji lub rozdziałów życia, poczucie misji bez jasnej formy.',
    resolution: 'Zidentyfikuj jedną rzecz, którą trzymasz długo po czasie. Podziękuj jej za lekcję i symbolicznie ją puść. Twoja dusza wie jak to zrobić — zaufaj jej.',
  },
];

// ── SOUL AGE LEVELS ─────────────────────────────────────────────
const SOUL_AGE_STATEMENTS = [
  { text: 'Świat wydaje mi się przytłaczający i niezrozumiały. Szukam bezpieczeństwa i prostych zasad.', weight: [3, 0, 0, 0, 0] },
  { text: 'Zależy mi na przynależności do grupy. Tradycja i zasady dają mi poczucie sensu.', weight: [0, 3, 0, 0, 0] },
  { text: 'Chcę osiągnąć sukces i udowodnić swoją wartość. Rywalizacja mnie motywuje.', weight: [0, 0, 3, 0, 0] },
  { text: 'Relacje i autentyczność są dla mnie ważniejsze niż sukces materialny.', weight: [0, 0, 0, 3, 0] },
  { text: 'Czuję głęboki spokój i szerszą perspektywę. Detachment jest moją siłą.', weight: [0, 0, 0, 0, 3] },
  { text: 'Często czuję, że „nie pasuję" do normalnego świata i nie wiem dlaczego.', weight: [0, 0, 0, 2, 1] },
];

const SOUL_AGE_LEVELS = [
  {
    id: 0,
    label: 'Dusza Dziecięca',
    polish: 'Infant Soul',
    color: '#F87171',
    desc: 'Jesteś na początku swojej podróży przez materialny świat. Twoja dusza dopiero uczy się jak poruszać się w fizycznej rzeczywistości — wszystko jest nowe, intensywne i wymaga nauki od podstaw.',
    traits: ['Szuka bezpiecznych struktur', 'Potrzebuje jasnych zasad', 'Uczy się przetrwania', 'Intensywne emocje'],
    gift: 'Twoja świeżość i bezpośredniość są darem — widzisz świat bez filtrów.',
  },
  {
    id: 1,
    label: 'Dusza Małego Dziecka',
    polish: 'Baby Soul',
    color: '#FBBF24',
    desc: 'Twoja dusza szuka porządku, przynależności i jasnych zasad moralnych. Tradycja, rodzina i wspólnota nadają Ci sens i bezpieczeństwo.',
    traits: ['Ceni tradycję i porządek', 'Silna moralność', 'Przynależność do grupy', 'Jasne reguły'],
    gift: 'Twoja zdolność do budowania wspólnoty i przestrzegania tradycji tworzy fundamenty cywilizacji.',
  },
  {
    id: 2,
    label: 'Dusza Młoda',
    polish: 'Young Soul',
    color: '#34D399',
    desc: 'Twoja dusza koncentruje się na materialnym sukcesie, rywalizacji i udowadnianiu swojej wartości. To czas wielkich osiągnięć i nauki o sile ego.',
    traits: ['Ambicja i sukces', 'Rywalizacja', 'Niezależność', 'Materializm'],
    gift: 'Twoja energia i determinacja budują cywilizację — osiągnięcia młodych dusz zmieniają świat.',
  },
  {
    id: 3,
    label: 'Dusza Dojrzała',
    polish: 'Mature Soul',
    color: '#A78BFA',
    desc: 'Twoja dusza poszukuje głębi, autentyczności i prawdziwych połączeń. Relacje, emocje i sens są ważniejsze niż sukcesy materialne.',
    traits: ['Autentyczność', 'Głębokie relacje', 'Emocjonalna inteligencja', 'Duchowe poszukiwanie'],
    gift: 'Twoja zdolność do empatii i tworzenia prawdziwych połączeń leczy rany wokół Ciebie.',
  },
  {
    id: 4,
    label: 'Dusza Stara',
    polish: 'Old Soul',
    color: '#C084FC',
    desc: 'Twoja dusza ma za sobą wiele wcieleń i osiągnęła głęboki spokój. Patrzysz na życie z szerszej perspektywy, z dystansem i mądrością transcendencji.',
    traits: ['Głęboki spokój', 'Szeroka perspektywa', 'Dystans i mądrość', 'Duchowa wolność'],
    gift: 'Twoja obecność sama w sobie jest lekiem — poczucie spokoju, które wnosisz do każdego pomieszczenia.',
  },
];

// ── HISTORICAL ERAS FOR TIMELINE ──────────────────────────────
const HISTORICAL_ERAS = [
  'Starożytny Egipt (3000–30 p.n.e.)',
  'Starożytna Grecja (800–146 p.n.e.)',
  'Rzym Antyczny (753 p.n.e.–476 n.e.)',
  'Wczesne Średniowiecze (476–1000)',
  'Późne Średniowiecze (1000–1400)',
  'Renesans (1400–1600)',
  'Barok i Oświecenie (1600–1800)',
  'Epoka Wiktoriańska (1837–1901)',
  'Wiek XX (1900–1970)',
  'Erą Współczesną (po 1970)',
];

// ── REGRESSION STAGES ──────────────────────────────────────────
const REGRESSION_STAGES = [
  {
    num: 1,
    title: 'Relaksacja ciała',
    duration: '2 min',
    breathing: '4–4–4',
    content: `Usiądź wygodnie lub połóż się. Zamknij oczy. Weź trzy głębokie oddechy — wdech przez nos na 4 sekundy, zatrzymaj na 4, wypuść na 4. Poczuj jak Twoje ciało staje się coraz cięższe z każdym wydechem. Zacznij od stóp — rozluźnij palce, śródstopie, pięty. Powoli wędrujesz w górę ciała: łydki, kolana, uda. Każda część ciała odpuszcza napięcie jak mokry piasek opadający przez palce.`,
  },
  {
    num: 2,
    title: 'Pogłębienie stanu alfa',
    duration: '1 min',
    breathing: 'naturalne',
    content: `Wyobraź sobie, że stoisz przed starożytnym schodami prowadzącymi w głąb spokojnej ziemi. Jest 10 stopni. Z każdym stopniem w dół, wchodzisz głębiej w stan spokoju i koncentracji. 10... poczuj jak umysł zwalnia. 9... 8... 7... myśli przychodzą i odpływają jak fale. 6... 5... 4... jesteś bezpieczny. 3... 2... 1... jesteś teraz na poziomie głębokiej relaksacji.`,
  },
  {
    num: 3,
    title: 'Wejście w Świątynię Duszy',
    duration: '1 min',
    breathing: 'naturalne',
    content: `Przed Tobą stoi starożytna świątynia. Może być egipska, grecka, orientalna — taka jaką ujrzy Twoja wyobraźnia. Wejdź do środka. Powietrze jest tu chłodne i spoiste. Na środku sali stoi lustro — ale nie zwykłe. To lustro czasu, które pokazuje nie to, kim jesteś teraz, lecz tęczę poprzednich jaźni, które Cię stworzyły.`,
  },
  {
    num: 4,
    title: 'Pierwsze przebłyski',
    duration: '2 min',
    breathing: 'powolne',
    content: `Zbliżasz się do lustra. Zacznij zadawać pytania w myślach: Gdzie byłem/byłam przed tym życiem? Kiedy? W jakiej roli? Nie szukaj odpowiedzi logicznie — poczekaj na pierwsze wrażenie. Może to obraz, kolor, uczucie, zapach, dźwięk lub słowo, które pojawi się bez Twojego wysiłku. Cokolwiek przyjdzie, jest właściwe. Zapamiętaj to pierwsze wrażenie.`,
  },
  {
    num: 5,
    title: 'Eksploracja życia',
    duration: '2 min',
    breathing: 'spokojne',
    content: `Wejdź głębiej w obraz który ujrzałeś. Kim jest ta osoba, którą dostrzegasz? Jakie nosi ubranie? Co czuje? Jaki ma zawód lub rolę w swojej społeczności? Spójrz na jej ręce — co robią? Jakie relacje tę osobę otaczają? Poczuj emocje tego życia. Czy jest spokój? Tęsknota? Siła? Cierpienie? Wszystko, co czujesz, jest wiadomością od Twojej duszy.`,
  },
  {
    num: 6,
    title: 'Lekcja i talent',
    duration: '1 min',
    breathing: 'głębokie wdechy',
    content: `Zapytaj tę przeszłą wersję siebie: "Jakiej lekcji nie dokończyłeś/dokończyłaś?" Poczekaj cierpliwie. Następnie zapytaj: "Jaki talent przyniosłeś/przyniosłaś ze sobą do tego życia?" Często talenty z poprzednich wcieleń przychodzą do nas jako umiejętności, których "zawsze byliśmy dobrzy" bez nauki, albo jako głęboka fascynacja. Zapamiętaj obie odpowiedzi.`,
  },
  {
    num: 7,
    title: 'Powrót i integracja',
    duration: '1 min',
    breathing: '4–4–8',
    content: `Pora wracać. Podziękuj tej przeszłej wersji siebie za lekcję i talent. Możesz powiedzieć w myślach: "Dziękuję. Przyjmuję dar, który zostawiłeś/zostawiłaś dla mnie." Powoli wróć po schodach — 1... 2... 3... zacznij czuć ciało. 4... 5... 6... powrót do oddechu. 7... 8... ruch w palcach. 9... 10... otwórz oczy powoli. Przywitaj się z teraźniejszością niosąc wiedzę z przeszłości.`,
  },
];

// ── QUICK ORACLE PROMPTS ────────────────────────────────────────
const ORACLE_QUICK_PROMPTS = [
  'Jaka jest moja główna niespełniona lekcja z poprzednich wcieleń?',
  'Jakie talenty przyniosłem/przyniosłam z poprzednich żyć?',
  'Jakie wzorce karmiczne wpływają na moje obecne relacje?',
  'Z jaką erą historyczną jest najsilniej związana moja dusza?',
];

// ── NUMBER HELPERS ──────────────────────────────────────────────
const reduceToSingle = (n: number): number => {
  while (n > 9) {
    n = String(n).split('').reduce((s, d) => s + parseInt(d, 10), 0);
  }
  return n;
};

const calcLifePath = (birthDate: string): number => {
  if (!birthDate) return 0;
  const parts = birthDate.split('-');
  if (parts.length < 3) return 0;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return 0;
  const sum =
    reduceToSingle(y) + reduceToSingle(m) + reduceToSingle(d);
  return reduceToSingle(sum);
};

const KARMIC_DEBT_NUMBERS = [13, 14, 16, 19];

const calcKarmicDebts = (birthDate: string): number[] => {
  if (!birthDate) return [];
  const [y, m, d] = birthDate.split('-').map(Number);
  const rawSum = y + m + d;
  const debts: number[] = [];
  KARMIC_DEBT_NUMBERS.forEach(kn => {
    // Simple heuristic: check if raw digits of birth add to known karmic sums
    const dayDigits = String(d).split('').reduce((a, b) => a + parseInt(b), 0);
    const monthDigits = String(m).split('').reduce((a, b) => a + parseInt(b), 0);
    if (kn === 13 && reduceToSingle(dayDigits + monthDigits) === 4 && rawSum % 13 < 4) debts.push(13);
    if (kn === 14 && reduceToSingle(d) === 5 && m % 5 === 0) debts.push(14);
    if (kn === 16 && reduceToSingle(d + m) === 7 && y % 7 < 3) debts.push(16);
    if (kn === 19 && reduceToSingle(d) === 1 && reduceToSingle(m) === 9) debts.push(19);
  });
  return debts;
};

const calcPastLifeIndicator = (birthDate: string): number => {
  if (!birthDate) return 0;
  const lp = calcLifePath(birthDate);
  const [, m, d] = birthDate.split('-').map(Number);
  return reduceToSingle(lp + reduceToSingle(m * d)) || 9;
};

const KARMIC_DEBT_MEANINGS: Record<number, string> = {
  13: 'Karma Lenistwa — poprzednie życie charakteryzowało się unikaniem pracy i odpowiedzialności. Teraz konieczna jest dyscyplina i wytrwałość.',
  14: 'Karma Nadużyć — swoboda była nadużywana ze szkodą dla innych lub siebie. Teraz potrzebujesz odpowiedzialnej wolności.',
  16: 'Karma Ego — nadmierna duma lub destrukcja relacji przez egocentryzm. Teraz ego musi służyć duszy.',
  19: 'Karma Samotności — nadużywanie władzy lub izolacja od innych. Teraz uczysz się dawać i przyjmować w prawdziwej wspólnocie.',
};

const PAST_LIFE_INDICATOR_MEANINGS: Record<number, string> = {
  1: 'Twoja dusza często była przywódcą — pionierem, odkrywcą, wojownikiem. Niosłeś/niosłaś decyzje samodzielnie przez wiele żyć.',
  2: 'Twoja dusza wielokrotnie pełniła rolę mediatora, kapłanki/kapłana lub dyplomaty. Harmonizowałeś/harmonizowałaś światy.',
  3: 'Byłeś/byłaś artystą/artystką, bardem lub uzdrowicielem przez słowo. Twoje talenty twórcze mają korzenie w wielu erach.',
  4: 'Twoja dusza budowała — świątynie, społeczności, systemy. Przyszedłeś/przyszłaś tym razem by dokończyć wielką budowę.',
  5: 'Byłeś/byłaś podróżnikiem, kupcem, odkrywcą. Twoja dusza zna wiele języków, kultur i lądów przez własne wcielenia.',
  6: 'Twoja dusza wielokrotnie opiekowała się innymi — jako matka, uzdrowicielka, nauczycielka. Teraz uczysz się o granicach miłości.',
  7: 'Byłeś/byłaś filozofem, mistykiem lub pustelnikiem. Twoja wiedza duchowa jest stara i głęboka.',
  8: 'Twoja dusza zarządzała królestwami, wioskami lub imperium. Lekcje władzy i materialności są Twoim starym terytorium.',
  9: 'Twoja dusza jest wędrowną mądrością — byłeś/byłaś nauczycielem, szamanem, mędrcą zamykającym wielkie cykle historii.',
};

// ── SCREEN COMPONENT ────────────────────────────────────────────
export const PastLifeScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';

  const lifePath = useMemo(() => calcLifePath(userData?.birthDate || ''), [userData?.birthDate]);
  const karmicDebts = useMemo(() => calcKarmicDebts(userData?.birthDate || ''), [userData?.birthDate]);
  const pastLifeIndicator = useMemo(() => calcPastLifeIndicator(userData?.birthDate || ''), [userData?.birthDate]);

  // Birth date reading
  const [birthInput, setBirthInput] = useState(userData?.birthDate || '');
  const [readingLoading, setReadingLoading] = useState(false);
  const [readingResult, setReadingResult] = useState('');
  const [readingEra, setReadingEra] = useState('');
  const [readingRole, setReadingRole] = useState('');
  const [readingLesson, setReadingLesson] = useState('');
  const [readingTalent, setReadingTalent] = useState('');
  const [readingChallenge, setReadingChallenge] = useState('');

  // Karmic lesson expanded
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);

  // Soul age quiz
  const [soulAgeSelections, setSoulAgeSelections] = useState<Set<number>>(new Set());
  const [soulAgeResult, setSoulAgeResult] = useState<number | null>(null);

  // Timeline memories
  const [memories, setMemories] = useState<Array<{ id: string; era: string; text: string; date: string }>>([]);
  const [memoryText, setMemoryText] = useState('');
  const [selectedEra, setSelectedEra] = useState(HISTORICAL_ERAS[0]);
  const [showEraModal, setShowEraModal] = useState(false);

  // Regression stages
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  // Oracle
  const [oracleText, setOracleText] = useState('');
  const [oracleLoading, setOracleLoading] = useState(false);
  const [oracleResult, setOracleResult] = useState('');

  const scrollRef = useRef<ScrollView>(null);

  const handleReadPastLife = async () => {
    if (!birthInput.trim()) {
      Alert.alert(t('pastLife.brak_daty_urodzenia', 'Brak daty urodzenia'), t('pastLife.wpisz_date_urodzenia_by_otrzymac', 'Wpisz datę urodzenia, by otrzymać odczyt.'));
      return;
    }
    setReadingLoading(true);
    HapticsService.notify();
    try {
      const lp = calcLifePath(birthInput);
      const pli = calcPastLifeIndicator(birthInput);
      const msgs = [
        {
          role: 'user' as const,
          content: `Proszę o odczyt poprzednich wcieleń dla osoby urodzonej ${birthInput}. Liczba drogi życia: ${lp}. Wskaźnik przeszłych żyć: ${pli}.

Przygotuj szczegółowy odczyt poprzednich żyć zawierający:

ERA I KULTURA: Określ konkretną erę historyczną i kulturę, gdzie dusza spędziła znaczące wcielenie (np. starożytny Egipt, średniowieczna Francja, dynastyczna Japonia). Opisz 2-3 zdaniami.

ROLA I ZAWÓD: Jaką konkretną rolę pełniła ta dusza w tamtym życiu? (np. kapłanka Izydy, rycerz templariusz, kupciec jedwabiu) Opisz szczegółowo 2-3 zdaniami.

LEKCJA KARMICZNA: Czego ta dusza nie dokończyła lub jaką lekcję przyniosła z tamtego życia do obecnego? Opisz jak to manifestuje się dziś, 2-3 zdania.

TALENT PRZENIESIONY: Jakie konkretne zdolności lub wiedza zostały przeniesione w postaci wrodzonego talentu lub instynktownej wiedzy? 2 zdania.

WYZWANIE DO PRZEZWYCIĘŻENIA: Jaki wzorzec lub ograniczenie z tamtego życia utrudnia obecne? Jak je rozwiązać? 2-3 zdania.

Pisz w języku użytkownika, z głębią, mądrością i konkretnością — jakbyś czytał z Kronik Akashicznych.`,
        },
      ];
      const localizedMsgs = i18n.language?.startsWith('en')
        ? [{
            role: 'user' as const,
            content: `Read from the Akashic Records and describe a past life for this soul.\n\nUse sections: ERA AND CULTURE, ROLE AND WORK, KARMIC LESSON, CARRIED TALENT, CHALLENGE TO OVERCOME.\n\nWrite in English with depth, wisdom and specificity, as if reading from the Akashic Records.`,
          }]
        : msgs;
      const result = await AiService.chatWithOracle(localizedMsgs, i18n.language?.startsWith('en') ? 'en' : 'pl');
      setReadingResult(result);

      // Try to parse sections
      const eraMatch = result.match(/ERA I KULTURA[:\s]+([^\n]+)/i);
      const roleMatch = result.match(/ROLA I ZAWÓD[:\s]+([^\n]+)/i);
      const lessonMatch = result.match(/LEKCJA KARMICZNA[:\s]+([^\n]+)/i);
      const talentMatch = result.match(/TALENT PRZENIESIONY[:\s]+([^\n]+)/i);
      const challengeMatch = result.match(/WYZWANIE DO PRZEZWYCIĘŻENIA[:\s]+([^\n]+)/i);

      if (eraMatch) setReadingEra(eraMatch[1].trim());
      if (roleMatch) setReadingRole(roleMatch[1].trim());
      if (lessonMatch) setReadingLesson(lessonMatch[1].trim());
      if (talentMatch) setReadingTalent(talentMatch[1].trim());
      if (challengeMatch) setReadingChallenge(challengeMatch[1].trim());
    } catch {
      setReadingResult(i18n.language?.startsWith('en') ? 'The Akashic Records are veiled in mist today. Try again in a moment — your story is waiting for the right time to reveal itself.' : 'Kroniki Akashiczne są dziś zasnute mgłą. Spróbuj ponownie za chwilę — Twoja historia czeka na właściwy moment objawienia.');
    }
    setReadingLoading(false);
  };

  const handleToggleSoulAgeStatement = (idx: number) => {
    HapticsService.notify();
    setSoulAgeSelections(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleComputeSoulAge = () => {
    HapticsService.notify();
    const scores = [0, 0, 0, 0, 0];
    soulAgeSelections.forEach(idx => {
      SOUL_AGE_STATEMENTS[idx].weight.forEach((w, si) => {
        scores[si] += w;
      });
    });
    const maxScore = Math.max(...scores);
    const result = scores.indexOf(maxScore);
    setSoulAgeResult(result);
  };

  const handleAddMemory = () => {
    if (!memoryText.trim()) return;
    HapticsService.notify();
    setMemories(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        era: selectedEra,
        text: memoryText.trim(),
      date: formatLocaleDate(new Date()),
      },
    ]);
    setMemoryText('');
  };

  const handleDeleteMemory = (id: string) => {
    HapticsService.notify();
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const handleOraclePrompt = (prompt: string) => {
    setOracleText(prompt);
  };

  const handleAskOracle = async () => {
    if (!oracleText.trim()) return;
    setOracleLoading(true);
    HapticsService.notify();
    try {
      const msgs = [
        {
          role: 'user' as const,
          content: `Kontekst: Osoba urodzona ${userData?.birthDate || 'brak daty'}, liczba drogi życia ${lifePath}, wskaźnik przeszłych żyć ${pastLifeIndicator}.

Pytanie o poprzednie wcielenia i karmę: ${oracleText}

Odpowiedz głęboko i konkretnie, korzystając z perspektywy Kronik Akashycznych i wiedzy o karmicznych wzorcach duszy. Pisz w języku użytkownika, z mądrością i precyzją. 3-5 zdań.`,
        },
      ];
      const localizedMsgs = i18n.language?.startsWith('en')
        ? [{
            role: 'user' as const,
            content: `Context: Person born on ${userData?.birthDate || 'unknown'}, life path ${lifePath}, past-life indicator ${pastLifeIndicator}.\n\nQuestion about past lives and karma: ${oracleText}\n\nAnswer deeply and concretely from the perspective of the Akashic Records and karmic soul patterns. Write in English, with wisdom and precision, in 3-5 sentences.`,
          }]
        : msgs;
      const res = await AiService.chatWithOracle(localizedMsgs, i18n.language?.startsWith('en') ? 'en' : 'pl');
      setOracleResult(res);
    } catch {
      setOracleResult(i18n.language?.startsWith('en') ? 'The Akashic Records answer with silence — and that is also an answer. Ask again when the heart is ready.' : 'Kroniki Akashiczne odpowiadają ciszą — to też jest odpowiedź. Zadam to pytanie ponownie, gdy serce będzie gotowe.');
    }
    setOracleLoading(false);
  };

  const isFav = isFavoriteItem('past_life');

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <PastLifeBg isLight={isLight} />
      <SafeAreaView edges={['top']} style={styles.safe}>

        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Home')} style={styles.headerBtn} hitSlop={20}>
            <ChevronLeft color={ACCENT} size={26} strokeWidth={1.6} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Typography variant="premiumLabel" color={ACCENT}>{t('pastLife.swiat_ty', 'Świat Ty')}</Typography>
            <Typography variant="screenTitle" style={{ color: textColor, marginTop: 3 }}>{t('pastLife.poprzednie_wcielenia', 'Poprzednie Wcielenia')}</Typography>
          </View>
          <Pressable
            onPress={() => {
              HapticsService.notify();
              if (isFav) {
                removeFavoriteItem('past_life');
              } else {
                addFavoriteItem({ id: 'past_life', label: 'Poprzednie Wcielenia', route: 'PastLife', params: {}, icon: 'Clock', color: ACCENT, addedAt: new Date().toISOString() });
              }
            }}
            style={styles.headerBtn}
            hitSlop={12}
          >
            <Star
              color={isFav ? ACCENT : ACCENT + '88'}
              size={18}
              strokeWidth={1.8}
              fill={isFav ? ACCENT : 'none'}
            />
          </Pressable>
        </View>

        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') + 8 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >

            {/* ─── 1. 3D WIDGET ─────────────────────────────────────── */}
            <HourglassWidget3D accent={ACCENT} />

            {/* ─── 2. AKASHIC RECORDS INTRO ─────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(80).duration(600)}>
              <LinearGradient
                colors={isLight
                  ? [ACCENT + '18', ACCENT + '0C', ACCENT + '06']
                  : ['#A78BFA22', '#7C3AED11', '#4C1D9511']}
                style={[styles.heroCard, { borderColor: ACCENT + '33' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.heroCardHeader}>
                  <Hourglass color={ACCENT} size={22} strokeWidth={1.5} />
                  <Text style={[styles.heroCardLabel, { color: ACCENT }]}>{t('pastLife.kroniki_akashiczne', 'KRONIKI AKASHICZNE')}</Text>
                </View>
                <Text style={[styles.heroCardTitle, { color: textColor }]}>
                  {t('pastLife.twoja_dusza_pamieta_wiecej_niz', 'Twoja dusza pamięta więcej niż myślisz')}
                </Text>
                <Text style={[styles.heroCardBody, { color: subColor }]}>
                  Każde wcielenie pozostawia ślad — w instynktach, talentach, lękach i fascynacjach. Regresja do poprzednich żyć to nie podróż w przeszłość, lecz odczytanie DNA Twojej duszy, zapisanego w niewidocznej bibliotece wszechświata zwanej Kronikami Akashicznymi.
                </Text>
                <Text style={[styles.heroCardBody, { color: subColor, marginTop: 8 }]}>
                  Eksperci szacują, że przeciętna dusza ludzka przeszła od 30 do 200 wcieleń przed obecnym życiem. Każde z nich pozostawiło niewidoczne, ale realne ślady w Twojej osobowości, relacjach i duchowych wyzwaniach.
                </Text>
                <Pressable
                  onPress={() => scrollRef.current?.scrollTo({ y: 600, animated: true })}
                  style={[styles.heroCta, { backgroundColor: ACCENT }]}
                >
                  <Text style={styles.heroCtaText}>{t('pastLife.zacznij_regresje', 'Zacznij regresję')}</Text>
                  <ArrowRight color="#fff" size={16} strokeWidth={2} />
                </Pressable>
              </LinearGradient>
            </Animated.View>

            {/* ─── 3. BIRTH DATA ANALYSIS ───────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(140).duration(600)}>
              <View style={[styles.section, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <View style={styles.sectionHeader}>
                  <Brain color={ACCENT} size={18} strokeWidth={1.6} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('pastLife.analiza_danych_urodzenia', 'Analiza Danych Urodzenia')}</Text>
                </View>
                <Text style={[styles.sectionDesc, { color: subColor }]}>
                  {t('pastLife.twoja_data_urodzenia_jest_zakodowan', 'Twoja data urodzenia jest zakodowaną mapą karmicznych wzorców duszy.')}
                </Text>
                <View style={styles.dataRow}>
                  <View style={[styles.dataBadge, { borderColor: ACCENT + '44', backgroundColor: ACCENT + '11' }]}>
                    <Text style={[styles.dataBadgeNum, { color: ACCENT }]}>{lifePath || '?'}</Text>
                    <Text style={[styles.dataBadgeLabel, { color: subColor }]}>{t('pastLife.droga_zycia', 'Droga Życia')}</Text>
                  </View>
                  <View style={[styles.dataBadge, { borderColor: '#F59E0B44', backgroundColor: '#F59E0B11' }]}>
                    <Text style={[styles.dataBadgeNum, { color: '#F59E0B' }]}>{pastLifeIndicator || '?'}</Text>
                    <Text style={[styles.dataBadgeLabel, { color: subColor }]}>{t('pastLife.wskaznik_pl', 'Wskaźnik PL')}</Text>
                  </View>
                  <View style={[styles.dataBadge, { borderColor: '#34D39944', backgroundColor: '#34D39911' }]}>
                    <Text style={[styles.dataBadgeNum, { color: '#34D399' }]}>
                      {karmicDebts.length > 0 ? karmicDebts.join(', ') : '—'}
                    </Text>
                    <Text style={[styles.dataBadgeLabel, { color: subColor }]}>{t('pastLife.dlug_karmiczny', 'Dług Karmiczny')}</Text>
                  </View>
                </View>

                {/* Past life indicator meaning */}
                {pastLifeIndicator > 0 && (
                  <View style={[styles.infoBox, { borderColor: ACCENT + '33', backgroundColor: ACCENT + '0D' }]}>
                    <Text style={[styles.infoBoxLabel, { color: ACCENT }]}>WSKAŹNIK DUSZY #{pastLifeIndicator}</Text>
                    <Text style={[styles.infoBoxText, { color: subColor }]}>
                      {PAST_LIFE_INDICATOR_MEANINGS[pastLifeIndicator] || 'Twoja dusza niesie unikalny ślad doświadczeń z wielu wcieleń.'}
                    </Text>
                  </View>
                )}

                {/* Karmic debts */}
                {karmicDebts.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={[styles.subsectionLabel, { color: ACCENT }]}>{t('pastLife.dlugi_karmiczne_wykryte', 'DŁUGI KARMICZNE WYKRYTE:')}</Text>
                    {karmicDebts.map(kd => (
                      <View key={kd} style={[styles.infoBox, { borderColor: '#F8717144', backgroundColor: '#F8717111', marginTop: 6 }]}>
                        <Text style={[styles.infoBoxLabel, { color: '#F87171' }]}>KARMA {kd}</Text>
                        <Text style={[styles.infoBoxText, { color: subColor }]}>{KARMIC_DEBT_MEANINGS[kd]}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Animated.View>

            {/* ─── 4. PAST LIFE READING ──────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(180).duration(600)}>
              <View style={[styles.section, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <View style={styles.sectionHeader}>
                  <Eye color={ACCENT} size={18} strokeWidth={1.6} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('pastLife.odczyt_poprzednic_zyc', 'Odczyt Poprzednich Żyć')}</Text>
                </View>
                <Text style={[styles.sectionDesc, { color: subColor }]}>
                  {t('pastLife.podaj_date_urodzenia_w_formacie', 'Podaj datę urodzenia w formacie RRRR-MM-DD, by otrzymać personalizowany odczyt z Kronik Akashicznych.')}
                </Text>
                <TextInput
                  value={birthInput}
                  onChangeText={setBirthInput}
                  placeholder={t('pastLife.np_1990_03_15', 'np. 1990-03-15')}
                  placeholderTextColor={subColor + '88'}
                  style={[styles.input, { color: textColor, borderColor: ACCENT + '44', backgroundColor: ACCENT + '0D' }]}
                  keyboardType="numeric"
                />
                <Pressable
                  onPress={handleReadPastLife}
                  disabled={readingLoading}
                  style={[styles.ctaBtn, { backgroundColor: readingLoading ? ACCENT + '55' : ACCENT }]}
                >
                  {readingLoading ? (
                    <Text style={styles.ctaBtnText}>{t('pastLife.odczytuje_kroniki', 'Odczytuję Kroniki...')}</Text>
                  ) : (
                    <>
                      <Text style={styles.ctaBtnText}>{t('pastLife.odczytaj', 'Odczytaj')}</Text>
                      <ArrowRight color="#fff" size={16} strokeWidth={2} />
                    </>
                  )}
                </Pressable>

                {readingResult.length > 0 && (
                  <View style={{ marginTop: 14 }}>
                    {[
                      { label: 'ERA I KULTURA', value: readingEra, color: '#F59E0B' },
                      { label: 'ROLA I ZAWÓD', value: readingRole, color: '#34D399' },
                      { label: 'LEKCJA KARMICZNA', value: readingLesson, color: '#F87171' },
                      { label: 'TALENT PRZENIESIONY', value: readingTalent, color: '#60A5FA' },
                      { label: 'WYZWANIE', value: readingChallenge, color: '#C084FC' },
                    ].filter(s => s.value.length > 0).map((section, i) => (
                      <Animated.View key={section.label} entering={FadeInDown.delay(i * 80).duration(500)}>
                        <View style={[styles.readingSection, { borderLeftColor: section.color, backgroundColor: section.color + '0D' }]}>
                          <Text style={[styles.readingSectionLabel, { color: section.color }]}>{section.label}</Text>
                          <Text style={[styles.readingSectionText, { color: textColor }]}>{section.value}</Text>
                        </View>
                      </Animated.View>
                    ))}

                    {(readingEra.length === 0) && (
                      <View style={[styles.infoBox, { borderColor: ACCENT + '33', backgroundColor: ACCENT + '0D' }]}>
                        <Text style={[styles.infoBoxText, { color: subColor }]}>{readingResult}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </Animated.View>

            {/* ─── 5. KARMIC LESSON CARDS ────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(220).duration(600)}>
              <View style={[styles.section, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <View style={styles.sectionHeader}>
                  <Scroll color={ACCENT} size={18} strokeWidth={1.6} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('pastLife.lekcje_karmiczne', 'Lekcje Karmiczne')}</Text>
                </View>
                <Text style={[styles.sectionDesc, { color: subColor }]}>
                  Każda liczba drogi życia niesie unikalną lekcję, którą dusza powtarza przez wcielenia. Twoja: {lifePath || '?'}.
                </Text>
                {KARMIC_LESSONS.map((lesson, i) => {
                  const isActive = lifePath === lesson.lifePath;
                  const isExpanded = expandedLesson === lesson.lifePath;
                  return (
                    <Pressable
                      key={lesson.lifePath}
                      onPress={() => {
                        HapticsService.notify();
                        setExpandedLesson(isExpanded ? null : lesson.lifePath);
                      }}
                      style={[
                        styles.lessonCard,
                        {
                          borderColor: isActive ? lesson.color + '66' : lesson.color + '22',
                          backgroundColor: isActive ? lesson.color + '11' : cardBg,
                        },
                      ]}
                    >
                      <View style={styles.lessonCardHeader}>
                        <View style={[styles.lessonNum, { backgroundColor: lesson.color + '22', borderColor: lesson.color + '44' }]}>
                          <Text style={[styles.lessonNumText, { color: lesson.color }]}>{lesson.lifePath}</Text>
                        </View>
                        <Text style={[styles.lessonTitle, { color: isActive ? lesson.color : textColor }]}>
                          {lesson.title}
                          {isActive ? '  ✦ Twoja' : ''}
                        </Text>
                        {isExpanded ? (
                          <ChevronUp color={subColor} size={16} strokeWidth={1.8} />
                        ) : (
                          <ChevronDown color={subColor} size={16} strokeWidth={1.8} />
                        )}
                      </View>

                      {isExpanded && (
                        <View style={styles.lessonBody}>
                          <Text style={[styles.lessonSubLabel, { color: lesson.color }]}>{t('pastLife.lekcja_duszy', 'LEKCJA DUSZY')}</Text>
                          <Text style={[styles.lessonText, { color: subColor }]}>{lesson.lesson}</Text>
                          <Text style={[styles.lessonSubLabel, { color: lesson.color, marginTop: 10 }]}>{t('pastLife.jak_sie_przejawia', 'JAK SIĘ PRZEJAWIA')}</Text>
                          <Text style={[styles.lessonText, { color: subColor }]}>{lesson.manifestation}</Text>
                          <Text style={[styles.lessonSubLabel, { color: lesson.color, marginTop: 10 }]}>{t('pastLife.jak_rozwiazac', 'JAK ROZWIĄZAĆ')}</Text>
                          <Text style={[styles.lessonText, { color: subColor }]}>{lesson.resolution}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* ─── 6. SOUL AGE LEVELS ───────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(260).duration(600)}>
              <View style={[styles.section, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <View style={styles.sectionHeader}>
                  <Globe color={ACCENT} size={18} strokeWidth={1.6} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('pastLife.wiek_duszy', 'Wiek Duszy')}</Text>
                </View>
                <Text style={[styles.sectionDesc, { color: subColor }]}>
                  {t('pastLife.zaznacz_stwierdzen_ktore_rezonuja_z', 'Zaznacz stwierdzenia, które rezonują z Tobą najbardziej. Odkryj jak dojrzała jest Twoja dusza.')}
                </Text>
                {SOUL_AGE_STATEMENTS.map((stmt, i) => {
                  const isSelected = soulAgeSelections.has(i);
                  return (
                    <Pressable
                      key={i}
                      onPress={() => handleToggleSoulAgeStatement(i)}
                      style={[
                        styles.soulStmt,
                        {
                          borderColor: isSelected ? ACCENT + '66' : cardBorder,
                          backgroundColor: isSelected ? ACCENT + '11' : cardBg,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.soulStmtCheck,
                          {
                            borderColor: isSelected ? ACCENT : subColor + '44',
                            backgroundColor: isSelected ? ACCENT : 'transparent',
                          },
                        ]}
                      >
                        {isSelected && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>}
                      </View>
                      <Text style={[styles.soulStmtText, { color: isSelected ? textColor : subColor }]}>{stmt.text}</Text>
                    </Pressable>
                  );
                })}

                <Pressable
                  onPress={handleComputeSoulAge}
                  style={[styles.ctaBtn, { backgroundColor: ACCENT, marginTop: 12 }]}
                >
                  <Text style={styles.ctaBtnText}>{t('pastLife.oblicz_wiek_duszy', 'Oblicz wiek duszy')}</Text>
                  <Sparkles color="#fff" size={16} strokeWidth={2} />
                </Pressable>

                {soulAgeResult !== null && (
                  <Animated.View entering={FadeInDown.duration(500)}>
                    <LinearGradient
                      colors={[SOUL_AGE_LEVELS[soulAgeResult].color + '22', SOUL_AGE_LEVELS[soulAgeResult].color + '0A']}
                      style={[styles.soulResultCard, { borderColor: SOUL_AGE_LEVELS[soulAgeResult].color + '44' }]}
                    >
                      <Text style={[styles.soulResultPolish, { color: SOUL_AGE_LEVELS[soulAgeResult].color }]}>
                        {SOUL_AGE_LEVELS[soulAgeResult].polish}
                      </Text>
                      <Text style={[styles.soulResultLabel, { color: textColor }]}>
                        {SOUL_AGE_LEVELS[soulAgeResult].label}
                      </Text>
                      <Text style={[styles.soulResultDesc, { color: subColor }]}>
                        {SOUL_AGE_LEVELS[soulAgeResult].desc}
                      </Text>
                      <View style={styles.soulTraitsRow}>
                        {SOUL_AGE_LEVELS[soulAgeResult].traits.map((t, ti) => (
                          <View
                            key={ti}
                            style={[styles.soulTrait, { backgroundColor: SOUL_AGE_LEVELS[soulAgeResult].color + '22', borderColor: SOUL_AGE_LEVELS[soulAgeResult].color + '44' }]}
                          >
                            <Text style={{ color: SOUL_AGE_LEVELS[soulAgeResult].color, fontSize: 11 }}>{t}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={[styles.soulGift, { color: subColor }]}>
                        ✦ {SOUL_AGE_LEVELS[soulAgeResult].gift}
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                )}
              </View>
            </Animated.View>

            {/* ─── 7. PAST LIFE TIMELINE ────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(300).duration(600)}>
              <View style={[styles.section, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <View style={styles.sectionHeader}>
                  <History color={ACCENT} size={18} strokeWidth={1.6} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('pastLife.os_czasu_duszy', 'Oś Czasu Duszy')}</Text>
                </View>
                <Text style={[styles.sectionDesc, { color: subColor }]}>
                  {t('pastLife.zapisuj_przeblyski_wspomnien_snow_l', 'Zapisuj przebłyski wspomnień, snów lub intuicji które mogą być echem poprzednich wcieleń.')}
                </Text>

                {/* Era selector */}
                <Pressable
                  onPress={() => setShowEraModal(true)}
                  style={[styles.eraSelector, { borderColor: ACCENT + '44', backgroundColor: ACCENT + '0D' }]}
                >
                  <Clock color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={[styles.eraSelectorText, { color: ACCENT }]}>{selectedEra}</Text>
                  <ChevronDown color={ACCENT} size={14} strokeWidth={1.8} />
                </Pressable>

                <TextInput
                  value={memoryText}
                  onChangeText={setMemoryText}
                  placeholder={t('pastLife.opisz_wspomnieni_sen_lub_przeblysk', 'Opisz wspomnienie, sen lub przebłysk intuicji...')}
                  placeholderTextColor={subColor + '88'}
                  multiline
                  numberOfLines={3}
                  style={[styles.inputMulti, { color: textColor, borderColor: ACCENT + '33', backgroundColor: ACCENT + '0A' }]}
                />

                <Pressable
                  onPress={handleAddMemory}
                  style={[styles.ctaBtn, { backgroundColor: ACCENT + 'CC', marginTop: 8 }]}
                >
                  <Plus color="#fff" size={16} strokeWidth={2} />
                  <Text style={styles.ctaBtnText}>{t('pastLife.dodaj_do_osi_czasu', 'Dodaj do osi czasu')}</Text>
                </Pressable>

                {/* Timeline entries */}
                {memories.length === 0 && (
                  <Text style={[styles.emptyText, { color: subColor }]}>
                    {t('pastLife.brak_wspomnien_dodaj_swoje_pierwsze', 'Brak wspomnień. Dodaj swoje pierwsze przebłyski z poprzednich wcieleń.')}
                  </Text>
                )}
                {memories.map((mem, i) => (
                  <Animated.View key={mem.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                    <View style={[styles.memoryItem, { borderColor: ACCENT + '33', backgroundColor: ACCENT + '0D' }]}>
                      <View style={styles.memoryHeader}>
                        <View style={[styles.memoryEraBadge, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '44' }]}>
                          <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '600' }}>{mem.era.split('(')[0].trim()}</Text>
                        </View>
                        <Text style={[styles.memoryDate, { color: subColor }]}>{mem.date}</Text>
                        <Pressable onPress={() => handleDeleteMemory(mem.id)} hitSlop={10}>
                          <X color={subColor + '88'} size={14} strokeWidth={2} />
                        </Pressable>
                      </View>
                      <Text style={[styles.memoryText, { color: textColor }]}>{mem.text}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* ─── 8. REGRESSION GUIDE ──────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(340).duration(600)}>
              <View style={[styles.section, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <View style={styles.sectionHeader}>
                  <Moon color={ACCENT} size={18} strokeWidth={1.6} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('pastLife.przewodnik_regresji', 'Przewodnik Regresji')}</Text>
                </View>
                <Text style={[styles.sectionDesc, { color: subColor }]}>
                  {t('pastLife.przewodnik_tekstowy_przez_7_etapow', 'Przewodnik tekstowy przez 7 etapów regresji do poprzednich wcieleń. Całkowity czas: ~10 minut. Znajdź ciche, wygodne miejsce.')}
                </Text>
                {REGRESSION_STAGES.map((stage, i) => {
                  const isExp = expandedStage === stage.num;
                  return (
                    <Pressable
                      key={stage.num}
                      onPress={() => {
                        HapticsService.notify();
                        setExpandedStage(isExp ? null : stage.num);
                      }}
                      style={[styles.stageCard, { borderColor: isExp ? ACCENT + '55' : cardBorder, backgroundColor: isExp ? ACCENT + '0A' : 'transparent' }]}
                    >
                      <View style={styles.stageCardHeader}>
                        <View style={[styles.stageNum, { backgroundColor: ACCENT + '22' }]}>
                          <Text style={[styles.stageNumText, { color: ACCENT }]}>{stage.num}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.stageTitle, { color: textColor }]}>{stage.title}</Text>
                          <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
                            <Text style={{ color: subColor, fontSize: 11 }}>⏱ {stage.duration}</Text>
                            <Text style={{ color: subColor, fontSize: 11 }}>💨 Oddech: {stage.breathing}</Text>
                          </View>
                        </View>
                        {isExp ? (
                          <ChevronUp color={ACCENT} size={16} strokeWidth={1.8} />
                        ) : (
                          <ChevronDown color={subColor} size={16} strokeWidth={1.8} />
                        )}
                      </View>
                      {isExp && (
                        <Text style={[styles.stageContent, { color: subColor }]}>{stage.content}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* ─── 9. ORACLE AI DEEPER DIVE ─────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(380).duration(600)}>
              <View style={[styles.section, { borderColor: ACCENT + '33', backgroundColor: ACCENT + '0A' }]}>
                <View style={styles.sectionHeader}>
                  <Sparkles color={ACCENT} size={18} strokeWidth={1.6} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('pastLife.oracle_glebszy_odczyt', 'Oracle — Głębszy Odczyt')}</Text>
                </View>
                <Text style={[styles.sectionDesc, { color: subColor }]}>
                  {t('pastLife.zadaj_wlasne_pytanie_lub_skorzystaj', 'Zadaj własne pytanie lub skorzystaj z szybkich promptów.')}
                </Text>

                {/* Quick prompts */}
                <View style={styles.quickPromptsRow}>
                  {ORACLE_QUICK_PROMPTS.map((prompt, i) => (
                    <Pressable
                      key={i}
                      onPress={() => handleOraclePrompt(prompt)}
                      style={[styles.quickPrompt, { borderColor: ACCENT + '44', backgroundColor: ACCENT + '0D' }]}
                    >
                      <Text style={[styles.quickPromptText, { color: ACCENT }]}>{prompt}</Text>
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  value={oracleText}
                  onChangeText={setOracleText}
                  placeholder={t('pastLife.twoje_pytanie_o_poprzednie_wcieleni', 'Twoje pytanie o poprzednie wcielenia...')}
                  placeholderTextColor={subColor + '88'}
                  multiline
                  numberOfLines={3}
                  style={[styles.inputMulti, { color: textColor, borderColor: ACCENT + '33', backgroundColor: ACCENT + '0A' }]}
                />

                <Pressable
                  onPress={handleAskOracle}
                  disabled={oracleLoading || !oracleText.trim()}
                  style={[
                    styles.ctaBtn,
                    { backgroundColor: oracleLoading || !oracleText.trim() ? ACCENT + '44' : ACCENT, marginTop: 8 },
                  ]}
                >
                  {oracleLoading ? (
                    <Text style={styles.ctaBtnText}>{t('pastLife.kroniki_odpowiadaj', 'Kroniki odpowiadają...')}</Text>
                  ) : (
                    <>
                      <Text style={styles.ctaBtnText}>{t('pastLife.zapytaj_kroniki', 'Zapytaj Kroniki')}</Text>
                      <Sparkles color="#fff" size={16} strokeWidth={2} />
                    </>
                  )}
                </Pressable>

                {oracleResult.length > 0 && (
                  <Animated.View entering={FadeInDown.duration(500)}>
                    <View style={[styles.oracleResult, { borderColor: ACCENT + '44', backgroundColor: ACCENT + '0D' }]}>
                      <Text style={[styles.oracleResultLabel, { color: ACCENT }]}>{t('pastLife.odpowiedz_kronik', 'ODPOWIEDŹ KRONIK')}</Text>
                      <Text style={[styles.oracleResultText, { color: textColor, lineHeight: 24 }]}>{oracleResult}</Text>
                    </View>
                  </Animated.View>
                )}
              </View>
            </Animated.View>

            <EndOfContentSpacer />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Era selection modal */}
      <Modal visible={showEraModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowEraModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: isLight ? '#F8F0E4' : '#0F0920' }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: textColor }]}>{t('pastLife.wybierz_ere', 'Wybierz Erę')}</Text>
            <ScrollView>
              {HISTORICAL_ERAS.map(era => (
                <Pressable
                  key={era}
                  onPress={() => {
                    setSelectedEra(era);
                    setShowEraModal(false);
                    HapticsService.notify();
                  }}
                  style={[
                    styles.eraOption,
                    {
                      backgroundColor: selectedEra === era ? ACCENT + '22' : 'transparent',
                      borderColor: selectedEra === era ? ACCENT + '66' : cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.eraOptionText, { color: selectedEra === era ? ACCENT : subColor }]}>{era}</Text>
                  {selectedEra === era && <Text style={{ color: ACCENT, fontSize: 14 }}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

// ── STYLES ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen,
    paddingVertical: 10,
  },
  headerBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  scroll: { paddingHorizontal: layout.padding.screen, paddingTop: 8 },

  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
  },
  heroCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  heroCardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  heroCardTitle: { fontSize: 20, fontWeight: '700', letterSpacing: 0.2, marginBottom: 8 },
  heroCardBody: { fontSize: 14, lineHeight: 22 },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  heroCtaText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionDesc: { fontSize: 13, lineHeight: 20, marginBottom: 12 },

  dataRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  dataBadge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dataBadgeNum: { fontSize: 24, fontWeight: '800' },
  dataBadgeLabel: { fontSize: 10, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },

  infoBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  infoBoxLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  infoBoxText: { fontSize: 13, lineHeight: 20 },

  subsectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6 },

  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    marginBottom: 10,
  },
  inputMulti: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 6,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  readingSection: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 8,
    paddingRight: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  readingSectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  readingSectionText: { fontSize: 13, lineHeight: 20 },

  lessonCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  lessonCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lessonNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumText: { fontSize: 13, fontWeight: '800' },
  lessonTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
  lessonBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.12)' },
  lessonSubLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  lessonText: { fontSize: 13, lineHeight: 20 },

  soulStmt: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  soulStmtCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  soulStmtText: { flex: 1, fontSize: 13, lineHeight: 20 },

  soulResultCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
  },
  soulResultPolish: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  soulResultLabel: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  soulResultDesc: { fontSize: 13, lineHeight: 21, marginBottom: 12 },
  soulTraitsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  soulTrait: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  soulGift: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  eraSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  eraSelectorText: { flex: 1, fontSize: 13, fontWeight: '500' },

  emptyText: { fontSize: 13, textAlign: 'center', marginVertical: 14, fontStyle: 'italic' },

  memoryItem: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  memoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  memoryEraBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  memoryDate: { flex: 1, fontSize: 11 },
  memoryText: { fontSize: 13, lineHeight: 20 },

  stageCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  stageCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stageNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageNumText: { fontSize: 13, fontWeight: '800' },
  stageTitle: { fontSize: 14, fontWeight: '600' },
  stageContent: { fontSize: 13, lineHeight: 22, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.12)' },

  quickPromptsRow: { flexDirection: 'column', gap: 8, marginBottom: 12 },
  quickPrompt: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  quickPromptText: { fontSize: 13, lineHeight: 18 },

  oracleResult: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 10,
  },
  oracleResultLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6 },
  oracleResultText: { fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.25)',
    alignSelf: 'center',
    marginVertical: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', marginBottom: 14 },
  eraOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  eraOptionText: { fontSize: 14 },
});

export default PastLifeScreen;
