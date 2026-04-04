// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, View, Dimensions, Text, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Line, Circle as SvgCRing, Line as SvgLRing, Ellipse, Polygon } from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, Star, X, Layers, Zap, Clock, ArrowRight, Wind, Headphones, Moon, CheckCircle2, ChevronRight, Gem, Hand, BookOpen, History, BarChart3, Trash2 } from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { useAppStore, ChakraEntry } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import * as Haptics from 'expo-haptics';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#A78BFA';

// ── BACKGROUND ────────────────────────────────────────────────
const ChakraBg = ({ isDark }: { isDark: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isDark ? ['#06030F', '#0A051A', '#0E0820'] : ['#F5F0FF', '#F8F2FF', '#FBF5FF']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={600} style={StyleSheet.absoluteFill} opacity={isDark ? 0.16 : 0.10}>
      <G>
        <Line x1={SW / 2} y1={60} x2={SW / 2} y2={540} stroke="#A78BFA" strokeWidth={0.8} strokeDasharray="4 8" opacity={0.5} />
        {[100, 170, 240, 310, 380, 450, 520].map((y, i) => {
          const colors = ['#EF4444', '#F97316', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F9A8D4'];
          return (
            <G key={i}>
              <Circle cx={SW / 2} cy={y} r={28 + i % 2 * 4} stroke={colors[i]} strokeWidth={0.5} fill="none" opacity={0.3} />
              <Circle cx={SW / 2} cy={y} r={8} fill={colors[i]} opacity={0.12} />
            </G>
          );
        })}
        {Array.from({ length: 16 }, (_, i) => (
          <Circle key={'s' + i} cx={(i * 137 + 40) % SW} cy={(i * 91 + 50) % 580}
            r={i % 5 === 0 ? 1.5 : 0.7} fill="#A78BFA" opacity={0.13} />
        ))}
      </G>
    </Svg>
  </View>
);

// ── CHAKRA ENERGY RING ────────────────────────────────────────
const CHAKRA_RING_COLORS = ['#FF4444','#FF8C00','#FFD700','#44FF44','#4488FF','#8844FF','#FF44CC'];
const CHAKRA_RING_RADII  = [96, 82, 68, 54, 40, 28, 16];
const CHAKRA_DOT_ANGLES  = [0, 51, 103, 154, 206, 257, 308];

const ChakraEnergyRing = React.memo(({ accent }: { accent: string }) => {
  const rot   = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const pulse = useSharedValue(1.0);

  useEffect(() => {
    rot.value   = withRepeat(withTiming(360, { duration: 18000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withSequence(withTiming(1.08, { duration: 2200 }), withTiming(0.96, { duration: 2200 })), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-22, Math.min(22, e.translationY * 0.3));
      tiltY.value = Math.max(-22, Math.min(22, e.translationX * 0.3));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 560 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }, { scale: pulse.value }],
  }));
  const innerStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot.value}deg` }] }));

  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={outerStyle}>
          <Animated.View style={innerStyle}>
            <Svg width={220} height={220} viewBox="-110 -110 220 220">
              {CHAKRA_RING_RADII.map((r, i) => (
                <SvgCRing key={`ring_${i}`} cx={0} cy={0} r={r} stroke={CHAKRA_RING_COLORS[i]} strokeWidth={2.5} fill="none" opacity={0.35} />
              ))}
              {CHAKRA_DOT_ANGLES.map((deg, i) => {
                const rad = deg * Math.PI / 180;
                const outerR = CHAKRA_RING_RADII[0];
                return (
                  <SvgLRing key={`spoke_${i}`} x1={0} y1={0} x2={outerR * Math.cos(rad)} y2={outerR * Math.sin(rad)} stroke={accent} strokeWidth={1} opacity={0.2} strokeDasharray="2 4" />
                );
              })}
              {CHAKRA_DOT_ANGLES.map((deg, i) => {
                const rad = deg * Math.PI / 180;
                const outerR = CHAKRA_RING_RADII[0];
                return (
                  <SvgCRing key={`dot_${i}`} cx={outerR * Math.cos(rad)} cy={outerR * Math.sin(rad)} r={5} fill={CHAKRA_RING_COLORS[i]} opacity={0.9} />
                );
              })}
              <SvgCRing cx={0} cy={0} r={14} fill={accent} opacity={0.7} />
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

// ── DAY → CHAKRA MAPPING ──────────────────────────────────────
const DAY_CHAKRA: Record<number, string> = {
  0: 'sahasrara', 1: 'ajna', 2: 'manipura',
  3: 'vishuddha', 4: 'anahata', 5: 'svadhisthana', 6: 'muladhara',
};

// ── CHAKRA DATA ───────────────────────────────────────────────
interface Chakra {
  id: string;
  name: string;
  sanskrit: string;
  color: string;
  element: string;
  mantra: string;
  theme: string;
  blocked: string;
  open: string;
  exercises: string[];
  affirmation: string;
  bodyY: number;
  mudraName: string;
  mudraSVG: string; // description for SVG path hint
  crystals: { name: string; use: string }[];
  affirmations: string[];
  diagnosisQuestion: string;
}

const CHAKRAS: Chakra[] = [
  {
    id: 'sahasrara',
    name: 'Sahasrara',
    sanskrit: 'सहस्रार',
    color: '#F9A8D4',
    element: 'Świadomość',
    mantra: 'AH',
    theme: 'Połączenie z całością',
    blocked: 'Poczucie odłączenia, cynizm, brak sensu, depresja duchowa.',
    open: 'Głębokie połączenie z wszechświatem, spokój, widzenie szerokiej perspektywy.',
    exercises: ['Medytacja w ciszy przez 10 minut', 'Kontemplacja nieba i gwiazd', 'Dziennik wdzięczności za istnienie'],
    affirmation: 'Jestem częścią czegoś nieskończenie większego niż moje ograniczenia.',
    bodyY: 5,
    mudraName: 'Mudra Tysięcznolistna (Sahasrara Mudra)',
    mudraSVG: 'lotus',
    crystals: [
      { name: 'Ametyst', use: 'Trzymaj nad czubkiem głowy podczas medytacji przez 5 minut.' },
      { name: 'Kryształ górski', use: 'Połóż na poduszce podczas snu, by pogłębić wizje.' },
      { name: 'Selenit', use: 'Zamiataj łagodnie wzdłuż ciała, by wyczyścić pole energetyczne.' },
    ],
    affirmations: [
      'Jestem zjednoczony z wyższą mądrością wszechświata.',
      'Duchowe przewodnictwo przepływa przeze mnie z łatwością.',
      'Moja świadomość rozszerza się poza granice czasu i przestrzeni.',
    ],
    diagnosisQuestion: 'Czy czujesz połączenie z czymś większym niż codzienne życie i masz poczucie sensu istnienia?',
  },
  {
    id: 'ajna',
    name: 'Ajna',
    sanskrit: 'आज्ञा',
    color: '#A78BFA',
    element: 'Światło',
    mantra: 'OM',
    theme: 'Intuicja i jasnowidztwo',
    blocked: 'Trudności ze słuchaniem intuicji, zagubienie, bóle głowy.',
    open: 'Silna intuicja, jasność widzenia, zdolność do głębokich wglądów.',
    exercises: ['Zanotuj 3 przeczucia, które miałeś w tym tygodniu', 'Medytacja z wizualizacją fioletowego światła', 'Ćwiczenie "Nie wiem" — celowe zawieszenie osądów'],
    affirmation: 'Moja intuicja prowadzi mnie bezpiecznie przez wszystko.',
    bodyY: 18,
    mudraName: 'Mudra Jnana (Gyan Mudra)',
    mudraSVG: 'ok',
    crystals: [
      { name: 'Lapis lazuli', use: 'Przykładaj do środka czoła na 5 minut przy porannej medytacji.' },
      { name: 'Fluoryt', use: 'Trzymaj w niedominującej ręce podczas praktyk wizualizacji.' },
      { name: 'Sodalit', use: 'Noś przy sobie w ciągu dnia, by wspierać jasność myślenia.' },
    ],
    affirmations: [
      'Ufam wewnętrznemu oku, które widzi prawdę poza pozorami.',
      'Moje przeczucia są precyzyjne i pewne.',
      'Jasność wizji otwiera się we mnie z każdym oddechem.',
    ],
    diagnosisQuestion: 'Czy ufasz swoim przeczuciom i słuchasz wewnętrznego głosu w codziennych decyzjach?',
  },
  {
    id: 'vishuddha',
    name: 'Vishuddha',
    sanskrit: 'विशुद्ध',
    color: '#60A5FA',
    element: 'Eter',
    mantra: 'HAM',
    theme: 'Ekspresja i prawda',
    blocked: 'Strach przed mówieniem prawdy, trudności z komunikacją, bóle gardła.',
    open: 'Autentyczna ekspresja, zdolność do mówienia prawdy z miłością.',
    exercises: ['Zaśpiewaj lub zanucz mantry przez 5 minut', 'Napisz list, który nigdy nie zostanie wysłany', 'Powiedz coś trudnego komuś bliskiego'],
    affirmation: 'Moje słowa niosą prawdę i są słyszane z miłością.',
    bodyY: 33,
    mudraName: 'Mudra Vishuddha (Grantha Mudra)',
    mudraSVG: 'throat',
    crystals: [
      { name: 'Akwamaryn', use: 'Trzymaj przy gardle podczas śpiewania mantr lub głosowych medytacji.' },
      { name: 'Turkus', use: 'Noś jako naszyjnik, by wspierać autentyczną ekspresję przez cały dzień.' },
      { name: 'Angelit', use: 'Połóż na gardle podczas relaksacji, by uwolnić zablokowane słowa.' },
    ],
    affirmations: [
      'Mówię swoją prawdę z odwagą i miłością.',
      'Mój głos ma znaczenie i zasługuje na bycie usłyszanym.',
      'Autentyczna ekspresja przychodzi mi z naturalną łatwością.',
    ],
    diagnosisQuestion: 'Czy swobodnie wyrażasz siebie i mówisz prawdę, nawet gdy jest trudna do wypowiedzenia?',
  },
  {
    id: 'anahata',
    name: 'Anahata',
    sanskrit: 'अनाहत',
    color: '#34D399',
    element: 'Powietrze',
    mantra: 'YAM',
    theme: 'Miłość i więź',
    blocked: 'Zamknięcie emocjonalne, trudności w relacjach, ból serca.',
    open: 'Bezwarunkowa miłość, empatia, zdolność do dawania i przyjmowania.',
    exercises: ['Ćwiczenie kochającej dobroci (Metta)', 'Napisz 5 powodów, dla których kochasz siebie', 'Zrób coś dobrego dla obcej osoby'],
    affirmation: 'Moje serce jest otwarte na miłość, której zasługuję.',
    bodyY: 47,
    mudraName: 'Mudra Anahata (Padma Mudra)',
    mudraSVG: 'lotus',
    crystals: [
      { name: 'Różowy kwarc', use: 'Trzymaj przy sercu podczas medytacji miłości własnej przez 10 minut.' },
      { name: 'Malachit', use: 'Połóż na klatce piersiowej i oddychaj głęboko, wyobrażając zielone światło.' },
      { name: 'Zielony aventuryn', use: 'Noś przy sobie, by przyciągać ciepłe, serdeczne relacje.' },
    ],
    affirmations: [
      'Jestem godny miłości i oddaję miłość swobodnie.',
      'Moje serce jest bezpiecznym miejscem dla siebie i innych.',
      'Empatia i współczucie płyną przeze mnie naturalnie.',
    ],
    diagnosisQuestion: 'Czy czujesz się swobodnie dając i przyjmując miłość, troszcząc się o siebie i innych bez lęku?',
  },
  {
    id: 'manipura',
    name: 'Manipura',
    sanskrit: 'मणिपूर',
    color: '#FBBF24',
    element: 'Ogień',
    mantra: 'RAM',
    theme: 'Moc sprawcza',
    blocked: 'Brak pewności siebie, prokrastynacja, poczucie bezsilności.',
    open: 'Silna wola, pewność siebie, zdolność do działania i realizacji celów.',
    exercises: ['Zrób jedną rzecz, której się bałeś', 'Ćwiczenie Nauli lub głęboki oddech przeponowy', 'Zapisz 5 osiągnięć z ostatniego roku'],
    affirmation: 'Mam moc, by tworzyć życie, które wybieram.',
    bodyY: 60,
    mudraName: 'Mudra Manipura (Rudra Mudra)',
    mudraSVG: 'solar',
    crystals: [
      { name: 'Cytryn', use: 'Trzymaj w dominującej ręce podczas afirmacji siły woli.' },
      { name: 'Tygrysie oko', use: 'Noś przy sobie w trudnych rozmowach, by dodać pewności siebie.' },
      { name: 'Jaspis żółty', use: 'Połóż na brzuchu podczas relaksacji, by aktywować centrum mocy.' },
    ],
    affirmations: [
      'Moja wewnętrzna siła jest niezłomna i niezawodna.',
      'Działam z pewnością siebie i determinacją każdego dnia.',
      'Jestem panem swojego losu i twórcą swojej rzeczywistości.',
    ],
    diagnosisQuestion: 'Czy czujesz się pewnie we własnych działaniach i masz silne poczucie sprawczości w życiu?',
  },
  {
    id: 'svadhisthana',
    name: 'Svadhisthana',
    sanskrit: 'स्वाधिष्ठान',
    color: '#F97316',
    element: 'Woda',
    mantra: 'VAM',
    theme: 'Kreatywność i emocje',
    blocked: 'Zablokowana twórczość, poczucie winy, problemy z granicami.',
    open: 'Swobodna ekspresja twórcza, zdrowe emocje, radość z życia.',
    exercises: ['Rysuj lub pisz przez 10 minut bez celu', 'Taniec do ulubionej muzyki', 'Medytacja z wodą lub kąpiel z intencją'],
    affirmation: 'Moja kreatywność płynie swobodnie jak rzeka.',
    bodyY: 75,
    mudraName: 'Mudra Svadhisthana (Shakti Mudra)',
    mudraSVG: 'sacral',
    crystals: [
      { name: 'Karneol', use: 'Trzymaj podczas twórczej pracy, by rozbudzić flow i kreatywność.' },
      { name: 'Pomarańczowy kalcyt', use: 'Połóż na dolnym brzuchu podczas medytacji emocjonalnej.' },
      { name: 'Moonstone', use: 'Noś podczas fazy księżyca w nowiu, by zsynchronizować emocje z rytmem natury.' },
    ],
    affirmations: [
      'Moje emocje są moim kompasem, a nie ciężarem.',
      'Kreatywność wybucha ze mnie naturalnie i radośnie.',
      'Zasługuję na przyjemność, radość i świętowanie życia.',
    ],
    diagnosisQuestion: 'Czy czujesz się swobodnie z własnymi emocjami i wyrażasz kreatywność bez poczucia winy?',
  },
  {
    id: 'muladhara',
    name: 'Muladhara',
    sanskrit: 'मूलाधार',
    color: '#EF4444',
    element: 'Ziemia',
    mantra: 'LAM',
    theme: 'Bezpieczeństwo i ugruntowanie',
    blocked: 'Lęk, niepewność, brak stabilności, trudności finansowe.',
    open: 'Poczucie bezpieczeństwa, stabilność, głęboki związek z ciałem i ziemią.',
    exercises: ['Chodzenie boso po trawie lub ziemi przez 5 minut', 'Ćwiczenie uziemienia: poczuj stopy na podłodze', 'Zapisz 5 rzeczy, które dają Ci poczucie bezpieczeństwa'],
    affirmation: 'Jestem bezpieczna i ugruntowana w tej chwili.',
    bodyY: 90,
    mudraName: 'Mudra Muladhara (Prithivi Mudra)',
    mudraSVG: 'root',
    crystals: [
      { name: 'Hematyt', use: 'Trzymaj w obu dłoniach, stojąc boso na ziemi przez 3 minuty.' },
      { name: 'Obsydian czarny', use: 'Połóż u stóp podczas medytacji, by zakorzenić się i ochronić pole.' },
      { name: 'Czerwony jaspis', use: 'Noś przy sobie, gdy czujesz się niestabilnie lub zagrożony.' },
    ],
    affirmations: [
      'Jestem bezpieczny i ugruntowany w każdej chwili.',
      'Ziemia pode mną daje mi stabilność i pewność.',
      'Moje podstawowe potrzeby są zawsze zaspokojone.',
    ],
    diagnosisQuestion: 'Czy czujesz się bezpiecznie i stabilnie w swoim ciele, domu i podstawowych sprawach życiowych?',
  },
];

// Mudra SVG component — simple hand gesture illustrations
const MudraSVG = ({ type, color, size = 70 }: { type: string; color: string; size?: number }) => {
  const c = size / 2;
  if (type === 'ok' || type === 'root') {
    // Index touches thumb — circle gesture
    return (
      <Svg width={size} height={size} viewBox="0 0 70 70">
        <Circle cx={c} cy={c} r={28} fill={color + '15'} stroke={color + '40'} strokeWidth={1} />
        {/* Palm */}
        <Path d={`M22 50 Q18 42 20 35 L20 22 Q20 18 23 18 Q26 18 26 22 L26 33`} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M26 30 L26 20 Q26 16 29 16 Q32 16 32 20 L32 32`} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M32 32 L32 22 Q32 18 35 18 Q38 18 38 22 L38 34`} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        {/* Ring finger & pinky curve down */}
        <Path d={`M38 34 Q42 30 44 34 L44 46 Q44 50 40 52 L22 52 Q18 52 18 48 L18 46`} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        {/* Index-thumb circle */}
        <Circle cx={23} cy={40} r={5} fill="none" stroke={color} strokeWidth={1.8} />
      </Svg>
    );
  }
  if (type === 'lotus') {
    return (
      <Svg width={size} height={size} viewBox="0 0 70 70">
        <Circle cx={c} cy={c} r={28} fill={color + '15'} stroke={color + '40'} strokeWidth={1} />
        {/* Two palms facing up, wrists touching */}
        <Path d={`M20 48 Q16 44 16 38 L16 30 Q16 26 19 26 Q22 26 22 30 L22 42`} stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        <Path d={`M50 48 Q54 44 54 38 L54 30 Q54 26 51 26 Q48 26 48 30 L48 42`} stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        {/* Left fingers spread up */}
        <Path d={`M20 30 Q18 24 21 22 Q24 20 25 26`} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <Path d={`M22 28 Q22 20 25 18 Q28 16 28 24`} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <Path d={`M24 26 Q26 18 29 17 Q32 16 31 24`} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        {/* Right fingers spread up */}
        <Path d={`M50 30 Q52 24 49 22 Q46 20 45 26`} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <Path d={`M48 28 Q48 20 45 18 Q42 16 42 24`} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <Path d={`M46 26 Q44 18 41 17 Q38 16 39 24`} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        {/* Center dot */}
        <Circle cx={c} cy={46} r={3} fill={color} opacity={0.7} />
      </Svg>
    );
  }
  // Default: hands clasped / generic mudra
  return (
    <Svg width={size} height={size} viewBox="0 0 70 70">
      <Circle cx={c} cy={c} r={28} fill={color + '15'} stroke={color + '40'} strokeWidth={1} />
      <Path d={`M25 50 L25 28 Q25 22 30 22 Q35 22 35 28 L35 38`} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d={`M35 36 Q40 32 40 28 Q40 22 45 22 Q50 22 50 28 L50 50`} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d={`M30 24 Q30 18 35 18`} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Path d={`M40 22 Q38 16 35 18`} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Circle cx={c} cy={50} r={4} fill={color} opacity={0.6} />
    </Svg>
  );
};

// Body map component
const ChakraBodyMap = ({ activeId, onTap, isLight }: { activeId: string | null; onTap: (id: string) => void; isLight?: boolean }) => {
  const bodyHeight = 280;
  const cx = 75;

  return (
    <Svg width={150} height={bodyHeight} viewBox="0 0 150 280">
      <G>
        <Circle cx={cx} cy={28} r={22} stroke={isLight ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.25)"} strokeWidth={1.2} fill="none" />
        <Line x1={cx - 8} y1={50} x2={cx - 8} y2={68} stroke={isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)"} strokeWidth={8} strokeLinecap="round" />
        <Line x1={cx + 8} y1={50} x2={cx + 8} y2={68} stroke={isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)"} strokeWidth={8} strokeLinecap="round" />
        <Path d={`M${cx - 28} 68 L${cx - 32} 165 L${cx + 32} 165 L${cx + 28} 68 Z`} stroke={isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)"} strokeWidth={1} fill={isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)"} />
        <Path d={`M${cx - 28} 75 L${cx - 48} 145`} stroke={isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)"} strokeWidth={10} strokeLinecap="round" />
        <Path d={`M${cx + 28} 75 L${cx + 48} 145`} stroke={isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)"} strokeWidth={10} strokeLinecap="round" />
        <Path d={`M${cx - 18} 165 L${cx - 22} 252`} stroke={isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)"} strokeWidth={12} strokeLinecap="round" />
        <Path d={`M${cx + 18} 165 L${cx + 22} 252`} stroke={isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)"} strokeWidth={12} strokeLinecap="round" />
        <Line x1={cx} y1={50} x2={cx} y2={165} stroke={isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.10)"} strokeWidth={1} strokeDasharray="3 4" />

        {CHAKRAS.map((ch) => {
          const y = (ch.bodyY / 100) * bodyHeight;
          const isActive = activeId === ch.id;
          return (
            <G key={ch.id} onPress={() => onTap(ch.id)}>
              <Circle cx={cx} cy={y} r={isActive ? 13 : 10}
                fill={ch.color + (isActive ? 'CC' : '55')}
                stroke={ch.color}
                strokeWidth={isActive ? 2 : 1}
              />
              {isActive && (
                <Circle cx={cx} cy={y} r={18} fill="none" stroke={ch.color} strokeWidth={1} opacity={0.5} />
              )}
            </G>
          );
        })}
      </G>
    </Svg>
  );
};

// ── DIAGNOSIS QUESTIONS ───────────────────────────────────────
// One question per chakra, answered 1–5. Higher = more open.
const DIAGNOSIS_QUESTIONS = CHAKRAS.map(ch => ({
  id: ch.id,
  color: ch.color,
  name: ch.name,
  question: ch.diagnosisQuestion,
}));

// ── 7-DAY BALANCING PLAN ──────────────────────────────────────
const BALANCE_PLAN_ACTIONS: Record<string, string[]> = {
  sahasrara: ['10 min medytacja w ciszy — tylko obserwuj oddech bez ingerencji', 'Wyjdź na zewnątrz i spędź 5 min patrząc w niebo', 'Zapisz 3 pytania, na które nie musisz znać odpowiedzi'],
  ajna:      ['Zanotuj 3 przeczucia lub sny z ostatniego tygodnia', 'Medytacja wizualizacyjna — fioletowe światło w centrum czoła', 'Ćwicz „nie wiem" — przez 10 min zawieszaj sądy o ludziach'],
  vishuddha: ['Zaśpiewaj lub zanucz mantrę HAM przez 5 minut', 'Napisz list bez filtrowania — do siebie lub kogoś bliskiego', 'Powiedz głośno jedną prawdę, którą dotąd milczałeś'],
  anahata:   ['Ćwiczenie Metta — wyślij miłość sobie, bliskim, trudnym osobom', 'Zapisz 5 rzeczy, które kochasz w sobie bez ironii', 'Zrób jeden nieoczekiwany gest dobroci dla obcej osoby'],
  manipura:  ['Zrób jedną rzecz, której od dawna się bałeś', 'Głęboki oddech przeponowy: 10 wdechów z naciskiem na brzuch', 'Napisz 5 swoich osiągnięć z ostatniego roku'],
  svadhisthana: ['Rysuj, pisz lub śpiewaj przez 10 minut bez celu', 'Zatańcz do ulubionej muzyki w samotności', 'Weź kąpiel z intencją uwolnienia poczucia winy'],
  muladhara: ['Chodzenie boso po trawie lub ziemi przez 5 minut', 'Ćwiczenie uziemienia: stań, poczuj stopy, oddychaj 3 min', 'Zapisz 5 rzeczy dających poczucie bezpieczeństwa i stabilności'],
};

const generateBalancePlan = (scores: Record<string, number>): { day: number; chakraId: string; action: string }[] => {
  // Sort chakras by lowest score (most needing attention)
  const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  const plan: { day: number; chakraId: string; action: string }[] = [];
  for (let day = 1; day <= 7; day++) {
    const idx = (day - 1) % sorted.length;
    const [chakraId] = sorted[idx];
    const actions = BALANCE_PLAN_ACTIONS[chakraId] || [];
    const action = actions[(day - 1) % actions.length] || 'Medytacja z uwagą na tę chakrę przez 5 minut';
    plan.push({ day, chakraId, action });
  }
  return plan;
};

export const ChakraScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeName, chakraHistory, chakraFocus, addChakraEntry, deleteChakraEntry, setChakraFocus, addFavoriteItem, isFavoriteItem, removeFavoriteItem } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');
  const isDark = !isLight;
  const textColor = isLight ? '#1A1A1A' : '#F0F0F0';
  const subColor = isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.60)';
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.10)';
  const dividerColor = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)';

  const [activeId, setActiveId] = useState<string | null>(chakraFocus);
  const [modalVisible, setModalVisible] = useState(false);
  const [practiceChakra, setPracticeChakra] = useState<Chakra | null>(null);

  // Diagnosis state
  const [diagnosisActive, setDiagnosisActive] = useState(false);
  const [diagnosisStep, setDiagnosisStep] = useState(0);
  const [diagnosisScores, setDiagnosisScores] = useState<Record<string, number>>({});
  const [diagnosisDone, setDiagnosisDone] = useState(false);
  const [balancePlan, setBalancePlan] = useState<{ day: number; chakraId: string; action: string }[]>([]);

  // Section expand states
  const [showMudras, setShowMudras] = useState(false);
  const [showCrystals, setShowCrystals] = useState(false);
  const [showChakraAffirmations, setShowChakraAffirmations] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chakraAiInsight, setChakraAiInsight] = useState<string>('');
  const [chakraAiLoading, setChakraAiLoading] = useState(false);

  const fetchChakraInsight = async () => {
    if (chakraAiLoading) return;
    setChakraAiLoading(true);
    void HapticsService.selection();
    try {
      const chakraName = activeChakra ? activeChakra.name : todayChakra.name;
      const chakraTheme = activeChakra ? activeChakra.theme : todayChakra.theme;
      const chakraElement = activeChakra ? activeChakra.element : todayChakra.element;
      const prompt = 'Czakra: ' + chakraName + '. Temat: ' + chakraTheme + '. Zywiol: ' + chakraElement + '. Napisz krotka (3-4 zdania) duchowa interpretacje stanu tej czakry i praktyczne cwiczenie na dzis.';
      const result = await AiService.chatWithOracle(prompt);
      setChakraAiInsight(result);
    } catch (e) {
      setChakraAiInsight('Nie udalo sie pobrac interpretacji. Sprobuj ponownie.');
    } finally {
      setChakraAiLoading(false);
    }
  };

  const activeChakra = activeId ? CHAKRAS.find(c => c.id === activeId) : null;
  const todayChakra = CHAKRAS.find(c => c.id === DAY_CHAKRA[new Date().getDay()]) || CHAKRAS[0];
  const accent = activeChakra?.color || ACCENT;

  const handleTap = (id: string) => {
    void HapticsService.selection();
    setActiveId(id === activeId ? null : id);
    setChakraFocus(id === activeId ? null : id);
  };

  const openPractice = (ch: Chakra) => {
    setPracticeChakra(ch);
    setModalVisible(true);
  };

  const completePractice = () => {
    if (!practiceChakra) return;
    const entry: ChakraEntry = {
      id: `ch_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      chakraId: practiceChakra.id,
    };
    addChakraEntry(entry);
    void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
  };

  const totalSessions = chakraHistory.length;
  const uniqueChakras = new Set(chakraHistory.map(e => e.chakraId)).size;
  const streak = (() => {
    let s = 0; const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (chakraHistory.some(e => e.date === ds)) s++; else break;
    }
    return s;
  })();

  // Last 10 sessions for history
  const last10Sessions = chakraHistory.slice(0, 10);

  // Diagnosis handlers
  const handleDiagnosisAnswer = (score: number) => {
    const chakraId = DIAGNOSIS_QUESTIONS[diagnosisStep].id;
    const newScores = { ...diagnosisScores, [chakraId]: score };
    setDiagnosisScores(newScores);
    if (diagnosisStep < DIAGNOSIS_QUESTIONS.length - 1) {
      setDiagnosisStep(diagnosisStep + 1);
    } else {
      // Done
      const plan = generateBalancePlan(newScores);
      setBalancePlan(plan);
      setDiagnosisDone(true);
    }
  };

  const resetDiagnosis = () => {
    setDiagnosisStep(0);
    setDiagnosisScores({});
    setDiagnosisDone(false);
    setDiagnosisActive(true);
  };

  const DAYS_PL = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];

  return (
    <View style={[ck.container, { backgroundColor: currentTheme.background }]}>
      <ChakraBg isDark={!isLight} />
      <SafeAreaView edges={['top']} style={ck.safe}>
        {/* HEADER */}
        <View style={ck.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Home')} style={ck.backBtn} hitSlop={20}>
            <ChevronLeft color={accent} size={26} strokeWidth={1.6} />
          </Pressable>
          <View style={ck.headerCenter}>
            <Typography variant="premiumLabel" color={accent}>{t('home.worlds.support')}</Typography>
            <Typography variant="screenTitle" style={{ marginTop: 3 }}>{t('chakra.title')}</Typography>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <MusicToggleButton color={ACCENT} size={18} />
            <Pressable
              onPress={() => { if (isFavoriteItem('chakra')) { removeFavoriteItem('chakra'); } else { addFavoriteItem({ id: 'chakra', label: 'Chakry', route: 'Chakra', params: {}, icon: 'Layers', color: ACCENT, addedAt: new Date().toISOString() }); } }}
              style={[ck.backBtn, { alignItems: 'center', justifyContent: 'center' }]}
              hitSlop={12}
            >
              <Star color={isFavoriteItem('chakra') ? ACCENT : ACCENT + '88'} size={18} strokeWidth={1.8} fill={isFavoriteItem('chakra') ? ACCENT : 'none'} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={[ck.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') + 8 }]} showsVerticalScrollIndicator={false}>
          {/* CHAKRA ENERGY RING */}
          <Animated.View entering={FadeInDown.duration(600)}>
            <ChakraEnergyRing accent={currentTheme.primary} />
          </Animated.View>

          {/* STAT RAIL */}
          <Animated.View entering={FadeInDown.duration(500)} style={ck.statRail}>
            {[
              { label: 'Sesje', val: String(totalSessions) },
              { label: 'Aktywna', val: activeChakra?.name.substring(0, 7) || '—' },
              { label: 'Pasmo', val: String(streak) + 'd' },
              { label: 'Ukończone', val: String(uniqueChakras) + '/7' },
            ].map((s, i) => (
              <View key={i} style={[ck.statItem, { backgroundColor: cardBg }]}>
                <Text style={[ck.statVal, { color: accent }]}>{s.val}</Text>
                <Text style={[ck.statLabel, { color: subColor }]}>{s.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* BODY MAP + CHAKRA LIST */}
          <Animated.View entering={FadeInDown.delay(80).duration(500)} style={ck.mainLayout}>
            <View style={ck.bodyMapWrap}>
              <ChakraBodyMap activeId={activeId} onTap={handleTap} isLight={isLight} />
            </View>
            <ScrollView style={ck.chakraList} showsVerticalScrollIndicator={false}>
              {CHAKRAS.map((ch) => (
                <Pressable
                  key={ch.id}
                  onPress={() => handleTap(ch.id)}
                  style={[ck.chakraCard, { backgroundColor: activeId === ch.id ? ch.color + '18' : cardBg, borderColor: activeId === ch.id ? ch.color + '66' : cardBorder, borderWidth: 1 }]}
                >
                  <View style={[ck.chakraDot, { backgroundColor: ch.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[ck.chakraName, { color: activeId === ch.id ? ch.color : textColor }]}>{ch.name}</Text>
                    <Text style={[ck.chakraTheme, { color: subColor }]}>{ch.theme}</Text>
                  </View>
                  <Text style={[ck.chakraMantra, { color: ch.color + 'AA' }]}>{ch.mantra}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ACTIVE CHAKRA DETAIL */}
          {activeChakra && (
            <Animated.View entering={FadeInDown.duration(400)} style={[ck.detailCard, { backgroundColor: activeChakra.color + '10', borderColor: activeChakra.color + '33', marginHorizontal: layout.padding.screen }]}>
              <LinearGradient colors={[activeChakra.color + '18', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
              <View style={ck.detailHeader}>
                <View>
                  <Text style={[ck.detailName, { color: activeChakra.color }]}>{activeChakra.name}</Text>
                  <Text style={[ck.detailSanskrit, { color: subColor }]}>{activeChakra.sanskrit} · {activeChakra.element} · {activeChakra.mantra}</Text>
                </View>
                <Pressable onPress={() => openPractice(activeChakra)} style={[ck.practiceBtn, { backgroundColor: activeChakra.color }]}>
                  <Zap color="#fff" size={14} strokeWidth={2} />
                  <Text style={ck.practiceBtnText}>Praktykuj</Text>
                </Pressable>
              </View>
              <View style={ck.stateRow}>
                <View style={[ck.stateBox, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                  <Text style={[ck.stateLabel, { color: '#EF4444' }]}>🔴 ZABLOKOWANA</Text>
                  <Text style={[ck.stateBody, { color: subColor }]}>{activeChakra.blocked}</Text>
                </View>
                <View style={[ck.stateBox, { backgroundColor: 'rgba(52,211,153,0.1)' }]}>
                  <Text style={[ck.stateLabel, { color: '#34D399' }]}>✅ OTWARTA</Text>
                  <Text style={[ck.stateBody, { color: subColor }]}>{activeChakra.open}</Text>
                </View>
              </View>
              <View style={[ck.affirmBox, { backgroundColor: activeChakra.color + '15' }]}>
                <Text style={[ck.affirmText, { color: activeChakra.color }]}>"{activeChakra.affirmation}"</Text>
              </View>
              <Text style={[ck.exercisesTitle, { color: subColor }]}>⚡ {t('chakra.practice').toUpperCase()}</Text>
              {activeChakra.exercises.map((ex, i) => (
                <View key={i} style={ck.exerciseRow}>
                  <View style={[ck.exerciseDot, { backgroundColor: activeChakra.color }]} />
                  <Text style={[ck.exerciseText, { color: textColor }]}>{ex}</Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* CHAKRA DNIA */}
          {!activeChakra && (
            <Animated.View entering={FadeInDown.delay(160).duration(500)} style={{ marginHorizontal: layout.padding.screen }}>
              <Typography variant="microLabel" style={[ck.sectionLabel, { color: subColor }]}>🌀 {t('chakra.chakraOfDay')}</Typography>
              <View style={[ck.dayCard, { backgroundColor: todayChakra.color + '12', borderColor: todayChakra.color + '40' }]}>
                <LinearGradient colors={[todayChakra.color + '1A', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                <View style={ck.dayCardRow}>
                  <View style={[ck.dayDot, { backgroundColor: todayChakra.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[ck.dayChakraName, { color: todayChakra.color }]}>{todayChakra.name}</Text>
                    <Text style={[ck.dayChakraMeta, { color: subColor }]}>{todayChakra.sanskrit} · {todayChakra.element} · {todayChakra.mantra}</Text>
                  </View>
                  <Pressable onPress={() => openPractice(todayChakra)} style={[ck.dayPracticeBtn, { backgroundColor: todayChakra.color }]}>
                    <Zap color="#fff" size={13} strokeWidth={2} />
                  </Pressable>
                </View>
                <Text style={[ck.dayTheme, { color: subColor }]}>{todayChakra.theme}</Text>
                <View style={[ck.dayAffirmBox, { borderLeftColor: todayChakra.color }]}>
                  <Text style={[ck.dayAffirm, { color: todayChakra.color }]}>"{todayChakra.affirmation}"</Text>
                </View>
                <Text style={[ck.hintText, { color: subColor, marginTop: 10 }]}>Dotknij punkt na mapie ciała lub wybierz chakrę z listy, by zobaczyć pełne szczegóły i przeprowadzić praktykę.</Text>
              </View>
            </Animated.View>
          )}

          {/* ── NEW: DIAGNOZA CHAKRY ── */}
          <Animated.View entering={FadeInDown.delay(170).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <BarChart3 color={ACCENT} size={14} strokeWidth={1.8} />
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT }}>DIAGNOZA CHAKRY</Text>
              </View>
              {(diagnosisDone || !diagnosisActive) && (
                <Pressable onPress={resetDiagnosis} style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, backgroundColor: ACCENT + '18', borderWidth: 1, borderColor: ACCENT + '33' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: ACCENT }}>{diagnosisDone ? 'Ponów' : 'Rozpocznij'}</Text>
                </Pressable>
              )}
            </View>

            {!diagnosisActive && !diagnosisDone && (
              <View style={[ck.diagCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={{ fontSize: 14, lineHeight: 22, color: subColor }}>
                  Odpowiedz na 7 pytań (skala 1–5), by zobaczyć, które z twoich chakr wymagają uwagi, a które działają swobodnie.
                </Text>
                <Pressable onPress={() => setDiagnosisActive(true)} style={[ck.diagStartBtn, { backgroundColor: ACCENT }]}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Rozpocznij diagnozę</Text>
                </Pressable>
              </View>
            )}

            {diagnosisActive && !diagnosisDone && (
              <View style={[ck.diagCard, { backgroundColor: DIAGNOSIS_QUESTIONS[diagnosisStep].color + '0D', borderColor: DIAGNOSIS_QUESTIONS[diagnosisStep].color + '33' }]}>
                <LinearGradient colors={[DIAGNOSIS_QUESTIONS[diagnosisStep].color + '15', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: DIAGNOSIS_QUESTIONS[diagnosisStep].color + '22', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: DIAGNOSIS_QUESTIONS[diagnosisStep].color }}>{diagnosisStep + 1}/7</Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: DIAGNOSIS_QUESTIONS[diagnosisStep].color }}>{DIAGNOSIS_QUESTIONS[diagnosisStep].name}</Text>
                </View>
                <Text style={{ fontSize: 14, lineHeight: 22, color: textColor, marginBottom: 18 }}>
                  {DIAGNOSIS_QUESTIONS[diagnosisStep].question}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5].map((score) => (
                    <Pressable
                      key={score}
                      onPress={() => handleDiagnosisAnswer(score)}
                      style={{
                        width: 44, height: 44, borderRadius: 12,
                        backgroundColor: DIAGNOSIS_QUESTIONS[diagnosisStep].color + '22',
                        borderWidth: 1, borderColor: DIAGNOSIS_QUESTIONS[diagnosisStep].color + '55',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '800', color: DIAGNOSIS_QUESTIONS[diagnosisStep].color }}>{score}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ fontSize: 10, color: subColor }}>1 = Prawie wcale</Text>
                  <Text style={{ fontSize: 10, color: subColor }}>5 = Zdecydowanie tak</Text>
                </View>
                {/* Progress bar */}
                <View style={{ height: 3, borderRadius: 2, backgroundColor: dividerColor, marginTop: 16, overflow: 'hidden' }}>
                  <View style={{ height: 3, borderRadius: 2, backgroundColor: DIAGNOSIS_QUESTIONS[diagnosisStep].color, width: `${((diagnosisStep) / 7) * 100}%` }} />
                </View>
              </View>
            )}

            {diagnosisDone && (
              <View style={[ck.diagCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: subColor, marginBottom: 14 }}>WYNIKI DIAGNOZY</Text>
                {CHAKRAS.map((ch) => {
                  const score = diagnosisScores[ch.id] ?? 3;
                  const pct = (score / 5) * 100;
                  return (
                    <View key={ch.id} style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>{ch.name}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: ch.color }}>{score}/5</Text>
                      </View>
                      <View style={{ height: 5, borderRadius: 3, backgroundColor: ch.color + '22', overflow: 'hidden' }}>
                        <View style={{ height: 5, borderRadius: 3, backgroundColor: ch.color, width: `${pct}%` }} />
                      </View>
                    </View>
                  );
                })}
                <Text style={{ fontSize: 12, lineHeight: 19, color: subColor, marginTop: 10 }}>
                  Chakry z niskim wynikiem (1–2) wymagają największej uwagi. Plan równoważenia poniżej.
                </Text>
              </View>
            )}
          </Animated.View>

          {/* ── NEW: PLAN RÓWNOWAŻENIA ── */}
          {diagnosisDone && balancePlan.length > 0 && (
            <Animated.View entering={FadeInDown.delay(180).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CheckCircle2 color={ACCENT} size={14} strokeWidth={1.8} />
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT }}>PLAN RÓWNOWAŻENIA — 7 DNI</Text>
              </View>
              {balancePlan.map((item) => {
                const ch = CHAKRAS.find(c => c.id === item.chakraId);
                if (!ch) return null;
                return (
                  <View key={item.day} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: item.day < 7 ? 1 : 0, borderBottomColor: dividerColor }}>
                    <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: ch.color + '20', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: ch.color }}>D{item.day}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: ch.color, marginBottom: 3 }}>{ch.name}</Text>
                      <Text style={{ fontSize: 13, lineHeight: 20, color: subColor }}>{item.action}</Text>
                    </View>
                  </View>
                );
              })}
            </Animated.View>
          )}

          {/* ── NEW: MUDRY I MANTRY ── */}
          <Animated.View entering={FadeInDown.delay(190).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginBottom: 16 }}>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: showMudras ? 14 : 0, paddingVertical: 6 }}
              onPress={() => setShowMudras(!showMudras)}
            >
              <Hand color={ACCENT} size={14} strokeWidth={1.8} />
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, flex: 1 }}>MUDRY I MANTRY</Text>
              <ChevronRight color={ACCENT} size={14} strokeWidth={2} style={{ transform: [{ rotate: showMudras ? '90deg' : '0deg' }] }} />
            </Pressable>
            {showMudras && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -layout.padding.screen }}>
                <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: layout.padding.screen, paddingBottom: 4 }}>
                  {CHAKRAS.map((ch) => (
                    <View
                      key={ch.id}
                      style={{
                        width: 150,
                        borderRadius: 16,
                        backgroundColor: ch.color + '0D',
                        borderWidth: 1,
                        borderColor: ch.color + '33',
                        padding: 14,
                        alignItems: 'center',
                      }}
                    >
                      <MudraSVG type={ch.mudraSVG} color={ch.color} size={64} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: ch.color, marginTop: 10, textAlign: 'center' }}>{ch.name}</Text>
                      <Text style={{ fontSize: 11, color: subColor, marginTop: 3, textAlign: 'center', lineHeight: 16 }}>{ch.mudraName}</Text>
                      <View style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, backgroundColor: ch.color + '18' }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: ch.color, letterSpacing: 2 }}>{ch.mantra}</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: subColor, marginTop: 6, textAlign: 'center', lineHeight: 16 }}>Element: {ch.element}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </Animated.View>

          {/* ── NEW: KRYSZTAŁY CHAKRY ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginBottom: 16 }}>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: showCrystals ? 14 : 0, paddingVertical: 6 }}
              onPress={() => setShowCrystals(!showCrystals)}
            >
              <Gem color={ACCENT} size={14} strokeWidth={1.8} />
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, flex: 1 }}>KRYSZTAŁY CHAKRY</Text>
              <ChevronRight color={ACCENT} size={14} strokeWidth={2} style={{ transform: [{ rotate: showCrystals ? '90deg' : '0deg' }] }} />
            </Pressable>
            {showCrystals && (
              <>
                {/* Show for active chakra or all */}
                {(activeChakra ? [activeChakra] : CHAKRAS).map((ch) => (
                  <View key={ch.id} style={{ marginBottom: 14, borderRadius: 16, backgroundColor: ch.color + '0A', borderWidth: 1, borderColor: ch.color + '28', padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ch.color }} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: ch.color }}>{ch.name}</Text>
                    </View>
                    {ch.crystals.map((crystal, i) => (
                      <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: i < ch.crystals.length - 1 ? 10 : 0 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: ch.color + '20', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Gem color={ch.color} size={13} strokeWidth={1.8} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{crystal.name}</Text>
                          <Text style={{ fontSize: 12, lineHeight: 18, color: subColor, marginTop: 2 }}>{crystal.use}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
                {!activeChakra && (
                  <Text style={{ fontSize: 12, color: subColor, textAlign: 'center' }}>Wybierz chakrę, by zobaczyć tylko jej kryształy.</Text>
                )}
              </>
            )}
          </Animated.View>

          {/* ── NEW: AFIRMACJE CHAKRY ── */}
          <Animated.View entering={FadeInDown.delay(210).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginBottom: 16 }}>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: showChakraAffirmations ? 14 : 0, paddingVertical: 6 }}
              onPress={() => setShowChakraAffirmations(!showChakraAffirmations)}
            >
              <BookOpen color={ACCENT} size={14} strokeWidth={1.8} />
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, flex: 1 }}>AFIRMACJE CHAKRY</Text>
              <ChevronRight color={ACCENT} size={14} strokeWidth={2} style={{ transform: [{ rotate: showChakraAffirmations ? '90deg' : '0deg' }] }} />
            </Pressable>
            {showChakraAffirmations && (
              <>
                {(activeChakra ? [activeChakra] : CHAKRAS).map((ch) => (
                  <View key={ch.id} style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ch.color }} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: ch.color, letterSpacing: 0.5 }}>{ch.name}</Text>
                    </View>
                    {ch.affirmations.map((aff, i) => (
                      <View key={i} style={{ borderRadius: 12, backgroundColor: ch.color + '0D', borderWidth: 1, borderColor: ch.color + '28', padding: 14, marginBottom: 8 }}>
                        <Text style={{ fontSize: 14, lineHeight: 22, color: textColor, fontStyle: 'italic' }}>"{aff}"</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </>
            )}
          </Animated.View>

          {/* ── NEW: HISTORIA PRAKTYK ── */}
          <Animated.View entering={FadeInDown.delay(220).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginBottom: 16 }}>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: showHistory ? 14 : 0, paddingVertical: 6 }}
              onPress={() => setShowHistory(!showHistory)}
            >
              <History color={ACCENT} size={14} strokeWidth={1.8} />
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, flex: 1 }}>HISTORIA PRAKTYK</Text>
              <Text style={{ fontSize: 11, color: subColor, marginRight: 6 }}>{last10Sessions.length} sesji</Text>
              <ChevronRight color={ACCENT} size={14} strokeWidth={2} style={{ transform: [{ rotate: showHistory ? '90deg' : '0deg' }] }} />
            </Pressable>
            {showHistory && (
              <>
                {last10Sessions.length === 0 ? (
                  <View style={[ck.diagCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <Text style={{ fontSize: 14, color: subColor, textAlign: 'center' }}>Brak ukończonych sesji. Przeprowadź swoją pierwszą praktykę.</Text>
                  </View>
                ) : (
                  last10Sessions.map((session, i) => {
                    const ch = CHAKRAS.find(c => c.id === session.chakraId);
                    if (!ch) return null;
                    const sessionDate = new Date(session.date);
                    const dateStr = `${sessionDate.getDate()}.${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;
                    const dayStr = DAYS_PL[sessionDate.getDay()];
                    return (
                      <View
                        key={session.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 14,
                          paddingVertical: 11,
                          borderBottomWidth: i < last10Sessions.length - 1 ? 1 : 0,
                          borderBottomColor: dividerColor,
                        }}
                      >
                        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: ch.color + '20', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ch.color }} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: ch.color }}>{ch.name}</Text>
                          <Text style={{ fontSize: 11, color: subColor, marginTop: 1 }}>{ch.theme}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>{dateStr}</Text>
                          <Text style={{ fontSize: 10, color: subColor, marginTop: 1 }}>{dayStr}</Text>
                        </View>
                        <Pressable hitSlop={10} onPress={() => Alert.alert('Usuń sesję', 'Czy na pewno chcesz usunąć tę sesję czakry?', [
                          { text: 'Anuluj', style: 'cancel' },
                          { text: 'Usuń', style: 'destructive', onPress: () => deleteChakraEntry(session.id) },
                        ])}>
                          <Trash2 size={14} color={'#EF4444'} strokeWidth={1.6} />
                        </Pressable>
                      </View>
                    );
                  })
                )}
              </>
            )}
          </Animated.View>

          {/* ── Połączenie z praktyką ── */}
          <Animated.View entering={FadeInDown.delay(230).duration(500)} style={{ marginHorizontal: layout.padding.screen, marginBottom: 16 }}>
            <Typography variant="microLabel" style={{ color: subColor, letterSpacing: 1.5, marginBottom: 10 }}>✦ CO DALEJ?</Typography>
            {[
              { icon: Wind, label: 'Oddech dla chakry', sub: 'Breathwork aktywuje energię ciała', color: '#60A5FA', route: 'Breathwork' },
              { icon: Headphones, label: 'Kąpiel dźwiękowa', sub: 'Dźwięk rezonuje z każdą chakrą', color: ACCENT, route: 'SoundBath' },
              { icon: Moon, label: 'Faza księżyca', sub: 'Synchronizuj praktykę z rytmem lunarnym', color: '#34D399', route: 'LunarCalendar' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.route}
                  onPress={() => navigation.navigate(item.route as any)}
                  style={[ck.nextRow, { backgroundColor: cardBg, borderColor: item.color + '33' }]}
                >
                  <View style={[ck.nextIcon, { backgroundColor: item.color + '18' }]}>
                    <Icon color={item.color} size={17} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[ck.nextTitle, { color: textColor }]}>{item.label}</Text>
                    <Text style={[ck.nextSub, { color: subColor }]}>{item.sub}</Text>
                  </View>
                  <ArrowRight color={item.color} size={15} strokeWidth={1.5} />
                </Pressable>
              );
            })}
          </Animated.View>

          {/* AI CHAKRA INSIGHT */}
          <View style={{ marginHorizontal: layout.padding.screen, marginBottom: 16 }}>
            <View style={{ borderRadius: 16, borderWidth: 1, padding: 16, backgroundColor: (activeChakra ? activeChakra.color : ACCENT) + "10", borderColor: (activeChakra ? activeChakra.color : ACCENT) + "30" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.5, color: activeChakra ? activeChakra.color : ACCENT }}>{"AI INTERPRETACJA CZAKRY"}</Text>
                <Pressable onPress={fetchChakraInsight} disabled={chakraAiLoading}
                  style={{ backgroundColor: activeChakra ? activeChakra.color : ACCENT, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 }}>
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                    {chakraAiLoading ? "..." : "Interpretuj"}
                  </Text>
                </Pressable>
              </View>
              {chakraAiInsight ? (
                <Text style={{ color: textColor, fontSize: 13, lineHeight: 21, fontStyle: "italic" }}>{chakraAiInsight}</Text>
              ) : (
                <Text style={{ color: subColor, fontSize: 12, lineHeight: 20 }}>
                  {"Nacisnij Interpretuj aby uzyskac AI interpretacje wybranej czakry."}
                </Text>
              )}
            </View>
          </View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>

      {/* PRACTICE MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={ck.modalOverlay}>
          <View style={[ck.modalSheet, { backgroundColor: isLight ? '#FAFAFA' : 'rgba(255,255,255,0.06)' }]}>
            <LinearGradient colors={[(practiceChakra?.color || ACCENT) + '14', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
            <View style={ck.modalHeader}>
              <Text style={[ck.modalTitle, { color: practiceChakra?.color || ACCENT }]}>{practiceChakra?.name} — {t('chakra.practice')}</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={16}>
                <X color={subColor} size={20} strokeWidth={1.8} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[ck.modalSub, { color: subColor }]}>{t('chakra.element')}: {practiceChakra?.element} · {practiceChakra?.mantra}</Text>
              <Text style={[ck.modalSection, { color: subColor }]}>✦ {t('rituals.steps')}</Text>
              {practiceChakra?.exercises.map((ex, i) => (
                <View key={i} style={[ck.modalStep, { backgroundColor: (practiceChakra.color || ACCENT) + '12' }]}>
                  <View style={[ck.modalStepNum, { backgroundColor: practiceChakra.color || ACCENT }]}>
                    <Text style={ck.modalStepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={[ck.modalStepText, { color: textColor }]}>{ex}</Text>
                </View>
              ))}
              {/* Mudra inside modal */}
              {practiceChakra && (
                <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: subColor, marginBottom: 8 }}>MUDRA: {practiceChakra.mudraName}</Text>
                  <MudraSVG type={practiceChakra.mudraSVG} color={practiceChakra.color} size={80} />
                  <Text style={{ fontSize: 20, fontWeight: '800', color: practiceChakra.color, letterSpacing: 4, marginTop: 10 }}>{practiceChakra.mantra}</Text>
                  <Text style={{ fontSize: 12, color: subColor, marginTop: 4 }}>Powtarzaj mantrę 108 razy lub przez 5 minut</Text>
                </View>
              )}
              <View style={[ck.modalAffirm, { borderColor: (practiceChakra?.color || ACCENT) + '44' }]}>
                <Text style={[ck.modalAffirmText, { color: practiceChakra?.color || ACCENT }]}>"{practiceChakra?.affirmation}"</Text>
              </View>
              <View style={ck.modalTimer}>
                <Clock color={subColor} size={16} strokeWidth={1.5} />
                <Text style={[ck.modalTimerText, { color: subColor }]}>Sugerowany czas: 5 minut ciszy z mantrą</Text>
              </View>
              <Pressable onPress={completePractice} style={[ck.modalDone, { backgroundColor: practiceChakra?.color || ACCENT }]}>
                <Text style={ck.modalDoneText}>Zakończ praktykę ✓</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ck = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingVertical: 10, gap: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  scroll: { paddingTop: 8 },
  statRail: { flexDirection: 'row', gap: 8, marginHorizontal: layout.padding.screen, marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  statVal: { fontSize: 14, fontWeight: '700', letterSpacing: -0.3 },
  statLabel: { fontSize: 10, marginTop: 2, letterSpacing: 0.3 },
  mainLayout: { flexDirection: 'row', marginHorizontal: layout.padding.screen, gap: 12, marginBottom: 16 },
  bodyMapWrap: { alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 },
  chakraList: { flex: 1, maxHeight: 300 },
  chakraCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, marginBottom: 6 },
  chakraDot: { width: 14, height: 14, borderRadius: 7 },
  chakraName: { fontSize: 13, fontWeight: '600' },
  chakraTheme: { fontSize: 11, marginTop: 1 },
  chakraMantra: { fontSize: 12, fontWeight: '700' },
  detailCard: { borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, overflow: 'hidden' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  detailName: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  detailSanskrit: { fontSize: 12, marginTop: 3 },
  practiceBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  practiceBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stateRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  stateBox: { flex: 1, borderRadius: 12, padding: 12 },
  stateLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  stateBody: { fontSize: 12, lineHeight: 17 },
  affirmBox: { borderRadius: 12, padding: 14, marginBottom: 14 },
  affirmText: { fontSize: 14, fontStyle: 'italic', lineHeight: 22, textAlign: 'center' },
  exercisesTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  exerciseRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  exerciseDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  exerciseText: { flex: 1, fontSize: 13, lineHeight: 20 },
  sectionLabel: { marginBottom: 10, letterSpacing: 1.4 },
  dayCard: { borderRadius: 18, padding: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  dayCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  dayDot: { width: 16, height: 16, borderRadius: 8 },
  dayChakraName: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  dayChakraMeta: { fontSize: 11, marginTop: 2 },
  dayPracticeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayTheme: { fontSize: 13, marginBottom: 12 },
  dayAffirmBox: { borderLeftWidth: 3, paddingLeft: 12, marginBottom: 4 },
  dayAffirm: { fontSize: 14, fontStyle: 'italic', lineHeight: 22 },
  hintText: { fontSize: 13, lineHeight: 20, textAlign: 'center', paddingVertical: 4 },
  diagCard: { borderRadius: 16, padding: 16, borderWidth: 1, overflow: 'hidden' },
  diagStartBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, overflow: 'hidden', maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalSub: { fontSize: 13, marginBottom: 20 },
  modalSection: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 12 },
  modalStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, padding: 14, marginBottom: 10 },
  modalStepNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  modalStepNumText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  modalStepText: { flex: 1, fontSize: 13, lineHeight: 20 },
  modalAffirm: { borderRadius: 14, padding: 16, borderWidth: 1, marginVertical: 16 },
  modalAffirmText: { fontSize: 15, fontStyle: 'italic', lineHeight: 24, textAlign: 'center' },
  modalTimer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  modalTimerText: { fontSize: 13 },
  modalDone: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  modalDoneText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  nextIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nextTitle: { fontSize: 14, fontWeight: '700' },
  nextSub: { fontSize: 12, lineHeight: 18, marginTop: 2 },
});
