// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet,
  View, Text, TextInput, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, Path, G, Line, Ellipse, Polygon, Defs, RadialGradient, Stop,
  Circle as SvgC, Path as SvgP, Line as SvgL,
} from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Sparkles, Sun, Moon, Globe, Brain, Heart,
  Shield, Gem, Zap, Eye, BookOpen, ArrowRight, Clock, TrendingUp,
  Users, Wind, Flame, Layers, Hash, Activity, Trophy, Calendar,
  ChevronDown, ChevronUp, BarChart3,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { Typography } from '../components/Typography';
import { CelestialBackdrop } from '../components/CelestialBackdrop';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { useTheme } from '../core/hooks/useTheme';
const ACCENT = '#F59E0B';

// ── BACKGROUND ──────────────────────────────────────────────────
const SpiritualProfileBg = ({ isLight }: { isLight: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={
        isLight
          ? ['#FFFBEB', '#FEF3C7', '#FFF8E6']
          : ['#0A0700', '#130E03', '#1A1405']
      }
      style={StyleSheet.absoluteFill}
    />
    <Svg width="100%" height={600} style={StyleSheet.absoluteFill} opacity={isLight ? 0.10 : 0.18}>
      <G>
        {/* Zodiac ring suggestion */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <Circle
              key={`zr${i}`}
              cx={200 + 160 * Math.cos(a)}
              cy={300 + 160 * Math.sin(a)}
              r={4}
              fill={ACCENT}
              opacity={0.12}
            />
          );
        })}
        {/* Mandala lines */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <Line
              key={`ml${i}`}
              x1={200}
              y1={300}
              x2={200 + 140 * Math.cos(a)}
              y2={300 + 140 * Math.sin(a)}
              stroke={ACCENT}
              strokeWidth={0.5}
              opacity={0.1}
            />
          );
        })}
        {/* Scattered star dust */}
        {Array.from({ length: 22 }, (_, i) => (
          <Circle
            key={`sd${i}`}
            cx={(i * 151 + 35) % 400}
            cy={(i * 97 + 28) % 580}
            r={i % 8 === 0 ? 1.6 : 0.7}
            fill={ACCENT}
            opacity={0.14}
          />
        ))}
      </G>
    </Svg>
  </View>
);

// ── 3D MANDALA WIDGET ──────────────────────────────────────────
const ZODIAC_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const SACRED_GEO_PETALS = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2;
  return { cx: 20 * Math.cos(a), cy: 20 * Math.sin(a) };
});

const MandalaWidget3D = React.memo(({ accent }: { accent: string }) => {
  const rot1 = useSharedValue(0);
  const rot2 = useSharedValue(0);
  const pulse = useSharedValue(0.92);
  const tiltX = useSharedValue(-8);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    rot1.value = withRepeat(withTiming(360, { duration: 22000, easing: Easing.linear }), -1, false);
    rot2.value = withRepeat(withTiming(-360, { duration: 16000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 3000 }), withTiming(0.92, { duration: 3000 })),
      -1,
      false
    );
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-25, Math.min(25, -8 + e.translationY * 0.14));
      tiltY.value = Math.max(-25, Math.min(25, e.translationX * 0.14));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-8, { duration: 800 });
      tiltY.value = withTiming(0, { duration: 800 });
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

  return (
    <View style={{ alignItems: 'center', marginVertical: 18 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>

          {/* Static base layer: center sacred geometry + numerology grid */}
          <Svg width={220} height={220} viewBox="-110 -110 220 220" style={StyleSheet.absoluteFill}>
            {/* Background circle */}
            <Circle r={100} fill={accent + '0A'} />
            {/* 12 outer zodiac section dividers */}
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const a2 = ((i + 1) / 12) * Math.PI * 2;
              return (
                <Path
                  key={`zs${i}`}
                  d={`M0,0 L${92 * Math.cos(a)},${92 * Math.sin(a)} A92,92 0 0,1 ${92 * Math.cos(a2)},${92 * Math.sin(a2)} Z`}
                  fill={i % 2 === 0 ? accent + '08' : accent + '04'}
                  stroke={accent + '22'}
                  strokeWidth={0.6}
                />
              );
            })}
            {/* Inner ring */}
            <Circle r={70} fill="none" stroke={accent + '33'} strokeWidth={0.8} />
            {/* Mid ring */}
            <Circle r={48} fill="none" stroke={accent + '44'} strokeWidth={0.8} />
            {/* Center flower of life */}
            {SACRED_GEO_PETALS.map((p, i) => (
              <Circle key={`fp${i}`} cx={p.cx} cy={p.cy} r={20} fill="none" stroke={accent + '55'} strokeWidth={1} />
            ))}
            {/* Center core */}
            <Circle r={10} fill={accent + '66'} />
            <Circle r={5} fill={accent} />
            {/* 3x3 numerology grid suggestion */}
            {[-22, 0, 22].map((gx, xi) =>
              [-22, 0, 22].map((gy, yi) => (
                <Circle key={`ng${xi}${yi}`} cx={gx} cy={gy} r={3.5} fill={accent + '33'} stroke={accent + '55'} strokeWidth={0.6} />
              ))
            )}
          </Svg>

          {/* Rotating outer zodiac ring */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring1Style]}>
            <Svg width={220} height={220} viewBox="-110 -110 220 220">
              <Circle r={95} fill="none" stroke={accent + '33'} strokeWidth={1.2} strokeDasharray="3 7" />
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                return (
                  <Circle
                    key={`zo${i}`}
                    cx={95 * Math.cos(a)}
                    cy={95 * Math.sin(a)}
                    r={4.5}
                    fill={accent}
                    opacity={0.65}
                  />
                );
              })}
            </Svg>
          </Animated.View>

          {/* Counter-rotating inner pulse ring */}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring2Style]}>
            <Svg width={220} height={220} viewBox="-110 -110 220 220">
              <Circle r={70} fill="none" stroke={accent + '44'} strokeWidth={1} strokeDasharray="2 5" />
              {Array.from({ length: 9 }, (_, i) => {
                const a = (i / 9) * Math.PI * 2;
                return (
                  <Circle
                    key={`ir${i}`}
                    cx={70 * Math.cos(a)}
                    cy={70 * Math.sin(a)}
                    r={2.5}
                    fill={accent + 'CC'}
                  />
                );
              })}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

// ── NUMEROLOGY HELPERS ──────────────────────────────────────────
const reduceToSingle = (n: number): number => {
  while (n > 9) {
    n = String(n).split('').reduce((s, d) => s + parseInt(d, 10), 0);
  }
  return n;
};

const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'Y']);
const CONSONANTS = new Set(['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Z']);

const calcLifePath = (birthDate: string): number => {
  if (!birthDate) return 0;
  const parts = birthDate.split('-').map(Number);
  if (parts.length < 3 || !parts[0]) return 0;
  const sum = reduceToSingle(parts[0]) + reduceToSingle(parts[1]) + reduceToSingle(parts[2]);
  return reduceToSingle(sum);
};

const calcExpression = (name: string): number => {
  const upper = (name || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (!upper) return 0;
  return reduceToSingle(upper.split('').reduce((s, c) => s + (LETTER_VALUES[c] || 0), 0)) || 9;
};

const calcSoulUrge = (name: string): number => {
  const upper = (name || '').toUpperCase().replace(/[^A-Z]/g, '');
  const vowels = upper.split('').filter(c => VOWELS.has(c));
  if (!vowels.length) return 1;
  return reduceToSingle(vowels.reduce((s, c) => s + (LETTER_VALUES[c] || 0), 0)) || 1;
};

const calcPersonality = (name: string): number => {
  const upper = (name || '').toUpperCase().replace(/[^A-Z]/g, '');
  const consonants = upper.split('').filter(c => CONSONANTS.has(c));
  if (!consonants.length) return 1;
  return reduceToSingle(consonants.reduce((s, c) => s + (LETTER_VALUES[c] || 0), 0)) || 1;
};

const calcBirthday = (birthDate: string): number => {
  if (!birthDate) return 0;
  const parts = birthDate.split('-').map(Number);
  return reduceToSingle(parts[2] || 0);
};

const calcPersonalYear = (birthDate: string): number => {
  if (!birthDate) return 0;
  const parts = birthDate.split('-').map(Number);
  const currentYear = new Date().getFullYear();
  return reduceToSingle(reduceToSingle(parts[1]) + reduceToSingle(parts[2]) + reduceToSingle(currentYear));
};

// ── ZODIAC DATA ─────────────────────────────────────────────────
const ZODIAC_MAP: Record<number, { sign: string; element: string; modality: string; planet: string; symbol: string }> = {
  1: { sign: 'Koziorożec', element: 'Ziemia', modality: 'Kardynalny', planet: 'Saturn', symbol: '♑' },
  2: { sign: 'Wodnik', element: 'Powietrze', modality: 'Stały', planet: 'Uran', symbol: '♒' },
  3: { sign: 'Ryby', element: 'Woda', modality: 'Zmienny', planet: 'Neptun', symbol: '♓' },
  4: { sign: 'Baran', element: 'Ogień', modality: 'Kardynalny', planet: 'Mars', symbol: '♈' },
  5: { sign: 'Byk', element: 'Ziemia', modality: 'Stały', planet: 'Wenus', symbol: '♉' },
  6: { sign: 'Bliźnięta', element: 'Powietrze', modality: 'Zmienny', planet: 'Merkury', symbol: '♊' },
  7: { sign: 'Rak', element: 'Woda', modality: 'Kardynalny', planet: 'Księżyc', symbol: '♋' },
  8: { sign: 'Lew', element: 'Ogień', modality: 'Stały', planet: 'Słońce', symbol: '♌' },
  9: { sign: 'Panna', element: 'Ziemia', modality: 'Zmienny', planet: 'Merkury', symbol: '♍' },
  10: { sign: 'Waga', element: 'Powietrze', modality: 'Kardynalny', planet: 'Wenus', symbol: '♎' },
  11: { sign: 'Skorpion', element: 'Woda', modality: 'Stały', planet: 'Pluton', symbol: '♏' },
  12: { sign: 'Strzelec', element: 'Ogień', modality: 'Zmienny', planet: 'Jowisz', symbol: '♐' },
};

const getZodiacFromDate = (birthDate: string) => {
  if (!birthDate) return ZODIAC_MAP[1];
  const parts = birthDate.split('-').map(Number);
  const m = parts[1];
  const d = parts[2];
  if (!m || !d) return ZODIAC_MAP[1];
  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return ZODIAC_MAP[4];
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return ZODIAC_MAP[5];
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return ZODIAC_MAP[6];
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return ZODIAC_MAP[7];
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return ZODIAC_MAP[8];
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return ZODIAC_MAP[9];
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return ZODIAC_MAP[10];
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return ZODIAC_MAP[11];
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return ZODIAC_MAP[12];
  if ((m === 12 && d >= 22) || m === 1) return ZODIAC_MAP[1];
  return ZODIAC_MAP[2];
};

// ── NUMEROLOGY MEANINGS ─────────────────────────────────────────
const LP_MEANINGS: Record<number, string> = {
  1: 'Jesteś pionierem i liderem. Twoja droga prowadzi przez niezależność i tworzenie nowego.',
  2: 'Jesteś mediatorem i dyplomatą. Twoja droga to harmonia, partnerstwo i empatia.',
  3: 'Jesteś twórcą i wyrażasz siebie przez sztukę i komunikację. Radość jest Twoim paliwem.',
  4: 'Jesteś budowniczym i systematykiem. Twoja droga to solidne fundamenty i cierpliwość.',
  5: 'Jesteś poszukiwaczem wolności i przygody. Zmiana i różnorodność to Twój żywioł.',
  6: 'Jesteś opiekunem i harmonizatorem. Miłość, rodzina i piękno prowadzą Twoją ścieżkę.',
  7: 'Jesteś filozofem i mistykiem. Głęboka wiedza duchowa i analiza są Twoim powołaniem.',
  8: 'Jesteś administratorem i budującym potęgę. Ambicja i materialna realizacja to Twoja ścieżka.',
  9: 'Jesteś humanistą i uzdrowicielem świata. Twoja droga to służba i mądrość zamykająca cykl.',
};

const EXP_MEANINGS: Record<number, string> = {
  1: 'Twój talent to przywództwo i inicjowanie nowych kierunków. Wyrażasz się przez pionierstwo.',
  2: 'Twój talent to współpraca i dyplomacja. Wyrażasz się przez tworzenie pokojowych połączeń.',
  3: 'Twój talent to kreatywna ekspresja i komunikacja. Wyrażasz siebie przez słowo i twórczość.',
  4: 'Twój talent to organizacja i budowanie trwałych struktur. Wyrażasz się przez konkretne działanie.',
  5: 'Twój talent to adaptacja i przekazywanie wiedzy z różnych dziedzin. Wyrażasz siebie przez różnorodność.',
  6: 'Twój talent to troska i tworzenie piękna. Wyrażasz siebie przez harmonizowanie otoczenia.',
  7: 'Twój talent to analiza i duchowe badanie. Wyrażasz siebie przez pogłębioną mądrość.',
  8: 'Twój talent to realizacja wielkich projektów. Wyrażasz siebie przez materialne osiągnięcia.',
  9: 'Twój talent to inspirowanie innych i kończenie wielkich cykli. Wyrażasz siebie przez służbę.',
};

const SOUL_URGE_MEANINGS: Record<number, string> = {
  1: 'W duszy pragniesz niezależności i bycia pierwszym. Twoja dusza pali się do bycia wyjątkową.',
  2: 'W duszy pragniesz harmonii i miłości. Twoja głęboka potrzeba to pokojowe połączenia.',
  3: 'W duszy pragniesz ekspresji i radości. Twoja dusza chce się wyrażać bez cenzury.',
  4: 'W duszy pragniesz bezpieczeństwa i solidnych fundamentów. Chcesz budować coś trwałego.',
  5: 'W duszy pragniesz wolności i doświadczenia pełni życia. Twoja dusza nie chce granic.',
  6: 'W duszy pragniesz kochać i być kochana/kochany. Twoja dusza pragnie prawdziwej troski.',
  7: 'W duszy pragniesz głębokiego rozumienia rzeczywistości. Twoja dusza szuka prawdy poza pozorami.',
  8: 'W duszy pragniesz siły i realizacji wielkich ambicji. Twoja dusza chce naprawdę znaczyć.',
  9: 'W duszy pragniesz mieć wpływ na dobro świata. Twoja dusza chce pozostawić ślad miłości.',
};

const PERSONALITY_MEANINGS: Record<number, string> = {
  1: 'Na zewnątrz wyglądasz na pewną siebie, asertywną i niezależną osobę. Inni widzą w Tobie lidera.',
  2: 'Na zewnątrz jesteś postrzegana/postrzegany jako ciepła i łagodna osoba. Inni widzą w Tobie oparcie.',
  3: 'Na zewnątrz wyglądasz na radosną i żywiołową osobę. Inni widzą w Tobie zabawę i kreatywność.',
  4: 'Na zewnątrz jesteś postrzegana/postrzegany jako solidna i niezawodna osoba. Inni widzą w Tobie odpowiedzialność.',
  5: 'Na zewnątrz wyglądasz na spontaniczną i ekscytującą osobę. Inni widzą w Tobie przygodę.',
  6: 'Na zewnątrz jesteś postrzegana/postrzegany jako opiekuńcza i harmonijna osoba. Inni widzą w Tobie dom.',
  7: 'Na zewnątrz wyglądasz na tajemniczą i głęboko myślącą osobę. Inni widzą w Tobie mądrość.',
  8: 'Na zewnątrz jesteś postrzegana/postrzegany jako osoba władzy i sukcesu. Inni widzą w Tobie autorytet.',
  9: 'Na zewnątrz wyglądasz na mądrą i humanitarną osobę. Inni widzą w Tobie szerokość ducha.',
};

const BIRTHDAY_MEANINGS: Record<number, string> = {
  1: 'Urodzony/Urodzona 1. dnia miesiąca lub jego redukcji — naturalny talent do inicjowania.',
  2: 'Urodzony/Urodzona 2. — głęboka intuicja i zdolność do harmonizowania.',
  3: 'Urodzony/Urodzona 3. — wrodzona ekspresja i twórczy dar.',
  4: 'Urodzony/Urodzona 4. — talent do budowania i organizacji.',
  5: 'Urodzony/Urodzona 5. — wrodzona zdolność do adaptacji.',
  6: 'Urodzony/Urodzona 6. — naturalny talent do opieki i harmonizowania.',
  7: 'Urodzony/Urodzona 7. — wrodzone zdolności do analizy i głębokiego myślenia.',
  8: 'Urodzony/Urodzona 8. — naturalny talent do zarządzania i realizacji.',
  9: 'Urodzony/Urodzona 9. — wrodzona mądrość i zdolność do inspirowania.',
};

const PERSONAL_YEAR_MEANINGS: Record<number, { name: string; theme: string; opportunities: string; challenges: string }> = {
  1: {
    name: 'Rok Nowego Początku',
    theme: 'To rok inicjowania, odwagi i sadzenia nowych nasion. Stoisz na progu 9-letniego cyklu.',
    opportunities: 'Nowe projekty, relacje i kierunki życiowe dają nadzwyczajne rezultaty. Ryzyko jest teraz popierane przez kosmos.',
    challenges: 'Strach przed nowym i tendencja do trzymania się starego może blokować wielką szansę. Nie odkładaj początków.',
  },
  2: {
    name: 'Rok Partnerstwa',
    theme: 'To rok delikatności, współpracy i głębokich relacji. Twoje połączenia z innymi są teraz kluczem.',
    opportunities: 'Partnerstwa zawodowe i osobiste nabierają głębi. Intuicja jest teraz na wyjątkowo wysokim poziomie.',
    challenges: 'Niecierpliwość i próba wymuszania tempa wydarzeń. W tym roku cierpliwość jest supermocą.',
  },
  3: {
    name: 'Rok Twórczości',
    theme: 'To rok ekspresji, radości i celebrowania życia. Twoja twórczość jest teraz na szczycie.',
    opportunities: 'Wszelkie projekty artystyczne, komunikacyjne i twórcze kwitną. Czas świętować i wyrażać siebie.',
    challenges: 'Rozproszenie energii na zbyt wiele projektów. Skup się na tym, co naprawdę chcesz wyrażać.',
  },
  4: {
    name: 'Rok Pracy i Fundamentów',
    theme: 'To rok budowania, struktury i solidnych podstaw. Wyniki przyjdą z cierpliwości i systematyczności.',
    opportunities: 'Wszystko co zaczniesz budować teraz, będzie trwałe przez dekady. Czas porządkowania i planowania.',
    challenges: 'Frustracja wolnym tempem wyników. Pamiętaj, że fundamenty wymagają czasu.',
  },
  5: {
    name: 'Rok Zmian',
    theme: 'To rok transformacji, niespodziewanych zwrotów i wyzwolenia. Bądź gotowy/gotowa na nieoczekiwane.',
    opportunities: 'Nieoczekiwane zmiany otwierają nowe, ekscytujące kierunki. Twoja elastyczność teraz jest kluczowa.',
    challenges: 'Nadmierna impulsywność lub opór wobec zmian mogą prowadzić w dwie różne pułapki.',
  },
  6: {
    name: 'Rok Odpowiedzialności',
    theme: 'To rok rodziny, domu, relacji i troski. Twoja miłość i opieka przynoszą teraz wielkie owoce.',
    opportunities: 'Relacje głębieją. Sprawy rodzinne i domowe rozwiązują się pięknie. Czas uzdrawiania więzi.',
    challenges: 'Tendencja do poświęcania się za innych kosztem własnych potrzeb i granicy energetycznej.',
  },
  7: {
    name: 'Rok Refleksji',
    theme: 'To rok wyciszenia, studiowania i głębokiej introspekcji. Twoja mądrość rośnie w ciszy.',
    opportunities: 'Duchowe przebudzenia, ważne wglądy i naukowe odkrycia. Czas badań i kontemplacji.',
    challenges: 'Izolacja i nadmierna analiza zamiast działania. Balansuj ciszę wewnętrzną z obecnością.',
  },
  8: {
    name: 'Rok Siły i Obfitości',
    theme: 'To rok materializacji, sukcesu finansowego i rozpoznania. Twoja moc jest teraz widoczna.',
    opportunities: 'Przełomy finansowe i zawodowe. Czas na odważne decyzje materialne i inwestycje.',
    challenges: 'Obsesja na punkcie sukcesu kosztem relacji i zdrowia. Sukces to środek, nie cel.',
  },
  9: {
    name: 'Rok Zamknięcia',
    theme: 'To rok kończenia cykli, wybaczenia i głębokiego oczyszczenia. Wielkie pożegnanie.',
    opportunities: 'Głęboka transformacja przez puszczenie. Co puścisz teraz, zrobi miejsce na błogosławieństwo.',
    challenges: 'Trzymanie się tego co skończone. Lęk przed stratą. Wybaczenie — sobie i innym — jest kluczem.',
  },
};

// ── ARCHETYPES ──────────────────────────────────────────────────
interface Archetype {
  id: string;
  name: string;
  desc: string;
  color: string;
  lifePaths: number[];
  zodiacElements: string[];
}

const ARCHETYPES: Archetype[] = [
  { id: 'hero', name: 'Bohater', desc: 'Pokonuje przeszkody przez odwagę i determinację. Inspiruje innych do działania.', color: '#F87171', lifePaths: [1, 8], zodiacElements: ['Ogień'] },
  { id: 'sage', name: 'Mędrzec', desc: 'Szuka prawdy i dzieli się mądrością. Jego/jej słowa mają wagę wieków.', color: '#60A5FA', lifePaths: [7, 9], zodiacElements: ['Powietrze', 'Ziemia'] },
  { id: 'lover', name: 'Kochanek', desc: 'Żyje przez połączenie i piękno. Miłość jest jego/jej religią i drogą.', color: '#F9A8D4', lifePaths: [2, 6], zodiacElements: ['Woda'] },
  { id: 'creator', name: 'Twórca', desc: 'Wyraża się przez sztukę, innowację i kreatywność. Tworzy nową rzeczywistość.', color: '#FBBF24', lifePaths: [3], zodiacElements: ['Ogień', 'Powietrze'] },
  { id: 'ruler', name: 'Władca', desc: 'Sprawuje władzę z odpowiedzialnością. Buduje królestwa materialne i duchowe.', color: '#A78BFA', lifePaths: [8, 4], zodiacElements: ['Ziemia'] },
  { id: 'caregiver', name: 'Opiekun', desc: 'Troszczy się o innych z bezgraniczną miłością. Uzdrawia przez obecność.', color: '#34D399', lifePaths: [6, 2], zodiacElements: ['Woda', 'Ziemia'] },
  { id: 'explorer', name: 'Odkrywca', desc: 'Przekracza granice i odkrywa nowe terytoria. Wolność jest jego/jej duszą.', color: '#F97316', lifePaths: [5], zodiacElements: ['Ogień', 'Powietrze'] },
  { id: 'magician', name: 'Mag', desc: 'Transformuje rzeczywistość przez intencję i mądrość. Zna sekrety zmiany.', color: '#C084FC', lifePaths: [7, 11], zodiacElements: ['Woda', 'Ogień'] },
  { id: 'rebel', name: 'Buntownik', desc: 'Kwestionuje status quo i przynosi rewolucyjne zmiany. Żyje poza normą.', color: '#FB923C', lifePaths: [5, 1], zodiacElements: ['Ogień'] },
  { id: 'jester', name: 'Błazen', desc: 'Przynosi radość i lekkość. Przez zabawę pokazuje głębokie prawdy.', color: '#4ADE80', lifePaths: [3, 5], zodiacElements: ['Powietrze'] },
  { id: 'orphan', name: 'Wędrowiec', desc: 'Szuka przynależności przez doświadczenie. Jego/jej siłą jest empatia z wykluczeniem.', color: '#94A3B8', lifePaths: [4, 9], zodiacElements: ['Ziemia', 'Woda'] },
  { id: 'innocent', name: 'Niewinny', desc: 'Zachowuje wiarę i optymizm. Jego/jej czystość serca jest źródłem uzdrowienia.', color: '#E0F2FE', lifePaths: [2, 6], zodiacElements: ['Powietrze', 'Woda'] },
];

const getTopArchetypes = (lifePath: number, zodiacElement: string): string[] => {
  const scored = ARCHETYPES.map(a => {
    let score = 0;
    if (a.lifePaths.includes(lifePath)) score += 3;
    if (a.zodiacElements.includes(zodiacElement)) score += 2;
    return { id: a.id, score };
  }).sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(s => s.id);
};

// ── SPIRITUAL GIFTS ─────────────────────────────────────────────
interface SpiritualGift {
  icon: string;
  title: string;
  desc: string;
  lifePaths: number[];
  elements: string[];
}

const ALL_SPIRITUAL_GIFTS: SpiritualGift[] = [
  { icon: '🔮', title: 'Jasnowidztwo intuicyjne', desc: 'Odbierasz informacje poza logicznym rozumieniem. Twoje przeczucia są niezwykle precyzyjne.', lifePaths: [2, 7, 11], elements: ['Woda'] },
  { icon: '✍️', title: 'Dar słowa i wyrazu', desc: 'Twoje słowa mają moc uzdrawiania i inspirowania. Piszesz i mówisz prosto do serc innych.', lifePaths: [3, 5], elements: ['Powietrze'] },
  { icon: '🌿', title: 'Uzdrowicielskie ręce', desc: 'Twoja obecność fizyczna przynosi spokój i uzdrowienie. Energia płynie przez Ciebie do innych.', lifePaths: [6, 9], elements: ['Ziemia', 'Woda'] },
  { icon: '🔥', title: 'Dar przywództwa', desc: 'Inni naturalnie podążają za Tobą. Twoja wizja i odwaga inspirują do działania zbiorowe.', lifePaths: [1, 8], elements: ['Ogień'] },
  { icon: '📐', title: 'Mądrość architektury duszy', desc: 'Rozumiesz struktury niewidzialne i widzialne. Tworzysz systemy, które przetrwają wieki.', lifePaths: [4, 8], elements: ['Ziemia'] },
  { icon: '🌊', title: 'Emocjonalna głębia', desc: 'Twoja zdolność do głębokiego odczuwania jest rzadkim darem. Twoja empatia jest mostem.', lifePaths: [2, 6, 9], elements: ['Woda'] },
  { icon: '⚡', title: 'Transformacyjna energia', desc: 'Tam gdzie jesteś, dzieje się zmiana. Katalizujesz ewolucję w sobie i wokół siebie.', lifePaths: [5, 1], elements: ['Ogień'] },
  { icon: '🔑', title: 'Dostęp do wiedzy ukrytej', desc: 'Intuicyjnie rozumiesz to, czego nie uczono. Starożytna mądrość jest Ci naturalnie dostępna.', lifePaths: [7, 9], elements: ['Woda', 'Powietrze'] },
  { icon: '💎', title: 'Dar rozpoznawania istoty', desc: 'Widzisz natychmiast esencję człowieka i sytuacji. Twoja przenikliwość jest darem.', lifePaths: [7, 2], elements: ['Powietrze', 'Woda'] },
  { icon: '🌺', title: 'Tworzenie piękna', desc: 'Przetwarzasz doświadczenia w piękno. Twoja wrażliwość estetyczna jest formą duchowości.', lifePaths: [3, 6], elements: ['Ogień', 'Powietrze'] },
];

const getTopGifts = (lifePath: number, zodiacElement: string): SpiritualGift[] => {
  const scored = ALL_SPIRITUAL_GIFTS.map(g => {
    let score = 0;
    if (g.lifePaths.includes(lifePath)) score += 3;
    if (g.elements.includes(zodiacElement)) score += 2;
    return { gift: g, score };
  }).sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map(s => s.gift);
};

// ── SHADOW ASPECTS ──────────────────────────────────────────────
const SHADOW_BY_LP: Record<number, Array<{ title: string; desc: string }>> = {
  1: [
    { title: 'Tyraniczny kontroler', desc: 'Twoja siła może przechodzić w dominację lub nieumiejętność dzielenia się przestrzenią.' },
    { title: 'Strach przed zależnością', desc: 'Izolujesz się zamiast prosić o pomoc, co wyczerpuje Cię niepotrzebnie.' },
    { title: 'Perfekcjonizm blokujący', desc: 'Standardy, które stawiasz sobie i innym, mogą uniemożliwiać start i zakończenie.' },
  ],
  2: [
    { title: 'Utrata własnego głosu', desc: 'Poświęcasz swoje potrzeby dla harmonii — do momentu gdy eksplodujesz lub znikasz.' },
    { title: 'Zależność emocjonalna', desc: 'Twoje poczucie wartości może być zbyt silnie powiązane z akceptacją innych.' },
    { title: 'Pasywna agresja', desc: 'Gdy nie wyrażasz granic bezpośrednio, frustracja wyraża się niebezpośrednio.' },
  ],
  3: [
    { title: 'Powierzchowność', desc: 'Unikasz głębszych trudności przez żarty lub ciągłą zabawę, które są maską lęku.' },
    { title: 'Rozproszenie energii', desc: 'Zbyt wiele projektów zaczynasz i porzucasz, gdy stają się trudne.' },
    { title: 'Porównywanie siebie', desc: 'Twoja ekspresja jest blokowana przez strach, że nie jesteś wystarczająco dobry/a.' },
  ],
  4: [
    { title: 'Sztywność przekonań', desc: 'Twoja potrzeba porządku może przerodzić się w nieelastyczność wobec zmian.' },
    { title: 'Pracoholizm', desc: 'Zamiast odpoczywać, ciągle produkujesz — praca staje się ucieczką przed sobą.' },
    { title: 'Zamknięcie na spontaniczność', desc: 'Nadmierne planowanie może wykluczyć magię przypadkowych chwil.' },
  ],
  5: [
    { title: 'Ucieczka od zaangażowania', desc: 'Twoja potrzeba wolności może być maską strachu przed intymnym związaniem.' },
    { title: 'Nadmierna stymulacja', desc: 'Skaczenie z jednej rzeczy w drugą może być ucieczką przed ciszą z samym/ą sobą.' },
    { title: 'Brak zakończenia', desc: 'Zaczynasz pięknie, ale rzadko kończysz — gdzie tkwi prawdziwa przeszkoda?' },
  ],
  6: [
    { title: 'Kontrola przez troskę', desc: 'Twoja opieka może być subtelnym sposobem kontrolowania lub trzymania innych blisko.' },
    { title: 'Martyrologia', desc: 'Poświęcenie bez granic prowadzi do urazy, gdy nie jest doceniane.' },
    { title: 'Perfekcjonizm relacyjny', desc: 'Stawiasz ludziom zbyt wysokie standardy, co prowadzi do ciągłych rozczarowań.' },
  ],
  7: [
    { title: 'Arrogancja intelektualna', desc: 'Twoja wiedza może być używana do oddalania się od innych, nie łączenia się z nimi.' },
    { title: 'Cynizm duchowy', desc: 'Zbyt głęboka analiza może podważać Twoją własną wiarę i pasję.' },
    { title: 'Zimna izolacja', desc: 'Chowanie się za wiedzą zamiast otwierania serca.' },
  ],
  8: [
    { title: 'Obsesja sukcesu', desc: 'Twoja ambicja może pożerać relacje i zdrowie w drodze do wyznaczonych celów.' },
    { title: 'Nieufność wobec innych', desc: 'Przekonanie, że tylko Ty możesz to zrobić właściwie, blokuje współpracę.' },
    { title: 'Materializm jako wartość', desc: 'Utożsamianie swojej wartości z pozycją lub majątkiem tworzy fundamentalny błąd tożsamości.' },
  ],
  9: [
    { title: 'Nierealistyczny idealizm', desc: 'Rozczarowanie kiedy świat nie odpowiada Twojej głębokiej wizji jak powinno być.' },
    { title: 'Trudność z granicami', desc: 'Wchłaniasz energię innych jak gąbka, co powoduje chroniczne wyczerpanie.' },
    { title: 'Ucieczka przez misję', desc: 'Oddanie się wielkim celom może być sposobem unikania własnej, osobistej pracy.' },
  ],
};

// ── PROFILE COMPLETION ──────────────────────────────────────────
const PROFILE_MILESTONES = [
  'Imię i data urodzenia',
  'Horoskop zachodni',
  'Liczby numerologiczne',
  'Archetypy duchowe',
  'Dary duchowe',
  'Profil cienia',
];

// ── ORACLE QUICK PROMPTS ────────────────────────────────────────
const ORACLE_QUICK_PROMPTS = [
  'Jaka jest moja najważniejsza lekcja duchowa w tym roku?',
  'Jak mogę lepiej wyrażać swoje dary duchowe?',
  'Jakie aspekty cienia blokują mój duchowy wzrost?',
  'Jak moja kombinacja numerologiczna i astrologiczna współpracuje?',
];

// ── SCREEN COMPONENT ─────────────────────────────────────────────
export const SpiritualProfileScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const _meditationSessions = useAppStore(s => s.meditationSessions);
  const _breathworkSessions = useAppStore(s => s.breathworkSessions);
  const _gratitudeEntries = useAppStore(s => s.gratitudeEntries);
  const _shadowWorkSessions = useAppStore(s => s.shadowWorkSessions);
  const { currentTheme, isLight } = useTheme();
  const meditationSessions = _meditationSessions ?? [];
  const breathworkSessions = _breathworkSessions ?? [];
  const gratitudeEntries = _gratitudeEntries ?? [];
  const shadowWorkSessions = _shadowWorkSessions ?? [];

  const journalStore = useJournalStore();
  const journalEntries = journalStore?.entries || [];
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';

  const name = userData?.name || '';
  const birthDate = userData?.birthDate || '';

  const lifePath = useMemo(() => calcLifePath(birthDate), [birthDate]);
  const expressionNum = useMemo(() => calcExpression(name), [name]);
  const soulUrgeNum = useMemo(() => calcSoulUrge(name), [name]);
  const personalityNum = useMemo(() => calcPersonality(name), [name]);
  const birthdayNum = useMemo(() => calcBirthday(birthDate), [birthDate]);
  const personalYear = useMemo(() => calcPersonalYear(birthDate), [birthDate]);

  const zodiac = useMemo(() => getZodiacFromDate(birthDate), [birthDate]);
  const topArchetypeIds = useMemo(() => getTopArchetypes(lifePath, zodiac.element), [lifePath, zodiac]);
  const topGifts = useMemo(() => getTopGifts(lifePath, zodiac.element), [lifePath, zodiac]);
  const shadowAspects = useMemo(() => (SHADOW_BY_LP[lifePath] || SHADOW_BY_LP[1]).slice(0, 3), [lifePath]);
  const yearForecast = useMemo(() => PERSONAL_YEAR_MEANINGS[personalYear] || PERSONAL_YEAR_MEANINGS[1], [personalYear]);

  // Profile completion
  const profileCompletion = useMemo(() => {
    let filled = 0;
    if (name.length > 0) filled++;
    if (birthDate.length > 0) filled++;
    if (lifePath > 0) filled++;
    if (topArchetypeIds.length > 0) filled++;
    if (topGifts.length > 0) filled++;
    if (shadowAspects.length > 0) filled++;
    return Math.round((filled / PROFILE_MILESTONES.length) * 100);
  }, [name, birthDate, lifePath, topArchetypeIds, topGifts, shadowAspects]);

  // App usage milestones
  const firstUse = useMemo(() => {
    const dates = [
      ...meditationSessions.map(s => s.date),
      ...breathworkSessions.map(s => s.date),
      ...gratitudeEntries.map(e => e.date),
      ...shadowWorkSessions.map(s => s.date),
      ...journalEntries.map((e: any) => e.date || e.createdAt || ''),
    ].filter(Boolean).sort();
    return dates[0] || null;
  }, [meditationSessions, breathworkSessions, gratitudeEntries, shadowWorkSessions, journalEntries]);

  const daysSinceFirst = useMemo(() => {
    if (!firstUse) return 0;
    const diff = Date.now() - new Date(firstUse).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [firstUse]);

  const totalPractices = meditationSessions.length + breathworkSessions.length;
  const totalEntries = journalEntries.length + gratitudeEntries.length;

  // Oracle state
  const [oracleText, setOracleText] = useState('');
  const [oracleLoading, setOracleLoading] = useState(false);
  const [oracleResult, setOracleResult] = useState('');

  // Expanded sections
  const [expandedNumSection, setExpandedNumSection] = useState<string | null>(null);
  const [expandedArchetype, setExpandedArchetype] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  const handleAskOracle = async () => {
    if (!oracleText.trim()) return;
    setOracleLoading(true);
    HapticsService.notify();
    try {
      const profile = `
Imię: ${name || 'nieznane'}
Data urodzenia: ${birthDate || 'nieznana'}
Znak zodiaku: ${zodiac.sign} (${zodiac.element}, ${zodiac.modality})
Władca: ${zodiac.planet}
Liczba drogi życia: ${lifePath}
Liczba ekspresji: ${expressionNum}
Impuls duszy: ${soulUrgeNum}
Osobowość: ${personalityNum}
Rok osobisty 2026: ${personalYear} (${yearForecast.name})
Dominujące archetypy: ${topArchetypeIds.map(id => ARCHETYPES.find(a => a.id === id)?.name || id).join(', ')}
Dary duchowe: ${topGifts.slice(0, 3).map(g => g.title).join(', ')}`.trim();

      const msgs = [
        {
          role: 'user' as const,
          content: `Profil duchowy osoby:
${profile}

Pytanie: ${oracleText}

${i18n.language?.startsWith('en') ? 'Answer deeply, combining numerology, astrology and archetypal insight. Write in English, precise and wise. 4-5 sentences.' : 'Odpowiedz głęboko, łącząc numerologię, astrologię i wiedzę archetypową. Pisz w języku użytkownika, precyzyjnie i mądrze. 4-5 zdań.'}`,
        },
      ];
      const res = await AiService.chatWithOracle(msgs, i18n.language?.startsWith('en') ? 'en' : 'pl');
      setOracleResult(res);
    } catch {
      setOracleResult(i18n.language?.startsWith('en') ? 'Your spiritual profile is too deep to hold in a single answer. Your energetic combination is unique — ask the next question.' : 'Profil duchowy jest zbyt głęboki, by ująć go w jednej odpowiedzi. Twoja kombinacja energii jest wyjątkowa — zapraszam do kolejnego pytania.');
    }
    setOracleLoading(false);
  };

  const isFav = isFavoriteItem('spiritual_profile');

  const NUM_SECTIONS = useMemo(() => [
    { key: 'lp', label: 'Droga Życia', num: lifePath, meaning: LP_MEANINGS[lifePath] || LP_MEANINGS[1], color: '#F87171' },
    { key: 'exp', label: 'Liczba Ekspresji', num: expressionNum, meaning: EXP_MEANINGS[expressionNum] || EXP_MEANINGS[1], color: '#FBBF24' },
    { key: 'su', label: 'Impuls Duszy', num: soulUrgeNum, meaning: SOUL_URGE_MEANINGS[soulUrgeNum] || SOUL_URGE_MEANINGS[1], color: '#60A5FA' },
    { key: 'pers', label: 'Osobowość', num: personalityNum, meaning: PERSONALITY_MEANINGS[personalityNum] || PERSONALITY_MEANINGS[1], color: '#34D399' },
    { key: 'bday', label: 'Liczba Urodzenia', num: birthdayNum, meaning: BIRTHDAY_MEANINGS[birthdayNum] || BIRTHDAY_MEANINGS[1], color: '#C084FC' },
  ], [lifePath, expressionNum, soulUrgeNum, personalityNum, birthdayNum]);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <SpiritualProfileBg isLight={isLight} />
      <SafeAreaView edges={['top']} style={styles.safe}>

        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Home')} style={styles.headerBtn} hitSlop={20}>
            <ChevronLeft color={ACCENT} size={26} strokeWidth={1.6} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Typography variant="premiumLabel" color={ACCENT}>{t('spiritualProfile.profil_duchowy', 'Profil Duchowy')}</Typography>
            <Typography variant="screenTitle" style={{ color: textColor, marginTop: 3 }}>{t('spiritualProfile.moje_centrum_duszy', 'Moje Centrum Duszy')}</Typography>
          </View>
          <Pressable
            onPress={() => {
              HapticsService.notify();
              if (isFav) {
                removeFavoriteItem('spiritual_profile');
              } else {
                addFavoriteItem({ id: 'spiritual_profile', label: 'Profil Duchowy', route: 'SpiritualProfile', params: {}, icon: 'Star', color: ACCENT, addedAt: new Date().toISOString() });
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

            {/* ─── 1. 3D MANDALA WIDGET ───────────────────────────── */}
            <MandalaWidget3D accent={ACCENT} />

            {/* ─── 2. PROFILE COMPLETION ──────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(80).duration(600)}>
              <View style={[styles.section, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <View style={styles.sectionHeader}>
                  <BarChart3 color={ACCENT} size={18} strokeWidth={1.6} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('spiritualProfile.uzupelnien_profilu', 'Uzupełnienie Profilu')}</Text>
                  <Text style={[styles.completionPct, { color: ACCENT }]}>{profileCompletion}%</Text>
                </View>
                {/* Progress bar */}
                <View style={[styles.progressTrack, { backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)' }]}>
                  <View style={[styles.progressFill, { width: `${profileCompletion}%` as any, backgroundColor: ACCENT }]} />
                </View>
                <View style={styles.milestonesRow}>
                  {PROFILE_MILESTONES.map((m, i) => {
                    const done = i < Math.round((profileCompletion / 100) * PROFILE_MILESTONES.length);
                    return (
                      <View key={i} style={[styles.milestone, { borderColor: done ? ACCENT + '55' : cardBorder, backgroundColor: done ? ACCENT + '11' : cardBg }]}>
                        <Text style={{ color: done ? ACCENT : subColor, fontSize: 10, fontWeight: '600' }}>
                          {done ? '✓ ' : ''}{m}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Animated.View>

            {/* ─── 3. CORE IDENTITY SNAPSHOT ──────────────────────── */}
            <Animated.View entering={FadeInDown.delay(120).duration(600)}>
              <LinearGradient
                colors={isLight ? ['#FEF3C7', '#FFFBEB', '#FFF8E6'] : ['#F59E0B22', '#92400E11', '#1A1405']}
                style={[styles.identityCard, { borderColor: ACCENT + '44' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.identityTop}>
                  <View style={styles.identityLeft}>
                    <Text style={[styles.identityName, { color: textColor }]}>{name || 'Imię nieznane'}</Text>
                    <Text style={[styles.identitySubline, { color: subColor }]}>
                      {birthDate ? new Date(birthDate + 'T12:00:00').toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'long', year: 'numeric' }) : 'Data urodzenia nieznana'}
                    </Text>
                  </View>
                  <View style={[styles.identityBadge, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '66' }]}>
                    <Text style={{ color: ACCENT, fontSize: 28 }}>{zodiac.symbol}</Text>
                    <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '700', marginTop: 2 }}>{zodiac.sign}</Text>
                  </View>
                </View>
                <View style={styles.identityStats}>
                  <View style={styles.identityStat}>
                    <Text style={[styles.identityStatNum, { color: ACCENT }]}>{lifePath || '?'}</Text>
                    <Text style={[styles.identityStatLabel, { color: subColor }]}>{t('spiritualProfile.droga_zycia', 'Droga Życia')}</Text>
                  </View>
                  <View style={[styles.identityDivider, { backgroundColor: ACCENT + '33' }]} />
                  <View style={styles.identityStat}>
                    <Text style={[styles.identityStatNum, { color: ACCENT }]}>{expressionNum || '?'}</Text>
                    <Text style={[styles.identityStatLabel, { color: subColor }]}>{t('spiritualProfile.ekspresja', 'Ekspresja')}</Text>
                  </View>
                  <View style={[styles.identityDivider, { backgroundColor: ACCENT + '33' }]} />
                  <View style={styles.identityStat}>
                    <Text style={[styles.identityStatNum, { color: ACCENT }]}>{soulUrgeNum || '?'}</Text>
                    <Text style={[styles.identityStatLabel, { color: subColor }]}>{t('spiritualProfile.impuls_duszy', 'Impuls Duszy')}</Text>
                  </View>
                  <View style={[styles.identityDivider, { backgroundColor: ACCENT + '33' }]} />
                  <View style={styles.identityStat}>
                    <Text style={[styles.identityStatNum, { color: ACCENT }]}>{personalYear || '?'}</Text>
                    <Text style={[styles.identityStatLabel, { color: subColor }]}>{t('spiritualProfile.rok_2026', 'Rok 2026')}</Text>
                  </View>
                </View>
                <View style={[styles.identityArchRow, { borderTopColor: ACCENT + '22' }]}>
                  <Text style={[styles.identityArchLabel, { color: subColor }]}>{t('spiritualProfile.dominujace_archetypy', 'DOMINUJĄCE ARCHETYPY:')}</Text>
                  <Text style={[styles.identityArchValues, { color: textColor }]}>
                    {topArchetypeIds.map(id => ARCHETYPES.find(a => a.id === id)?.name || id).join('  ·  ')}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* ─── 4. NUMEROLOGY BREAKDOWN ────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(160).duration(600)}>
              <View style={[styles.section, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <View style={styles.sectionHeader}>
                  <Hash color={ACCENT} size={18} strokeWidth={1.6} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('spiritualProfile.numerologi', 'Numerologia')}</Text>
                </View>
                <Text style={[styles.sectionDesc, { color: subColor }]}>
                  {t('spiritualProfile.piec_liczb_ktore_tworza_twoj', 'Pięć liczb, które tworzą Twój numerologiczny DNA. Każda mówi inną warstwę prawdy o Tobie.')}
                </Text>
                {NUM_SECTIONS.map((ns, i) => {
                  const isExp = expandedNumSection === ns.key;
                  return (
                    <Pressable
                      key={ns.key}
                      onPress={() => {
                        HapticsService.notify();
                        setExpandedNumSection(isExp ? null : ns.key);
                      }}
                      style={[styles.numCard, { borderColor: isExp ? ns.color + '55' : cardBorder, backgroundColor: isExp ? ns.color + '08' : cardBg }]}
                    >
                      <View style={styles.numCardHeader}>
                        <View style={[styles.numBadge, { backgroundColor: ns.color + '22', borderColor: ns.color + '55' }]}>
                          <Text style={[styles.numBadgeText, { color: ns.color }]}>{ns.num || '?'}</Text>
                        </View>
                        <Text style={[styles.numLabel, { color: textColor }]}>{ns.label}</Text>
                        {isExp ? (
                          <ChevronUp color={subColor} size={16} strokeWidth={1.8} />
                        ) : (
                          <ChevronDown color={subColor} size={16} strokeWidth={1.8} />
                        )}
                      </View>
                      {isExp && (
                        <Text style={[styles.numMeaning, { color: subColor }]}>{ns.meaning}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* ─── 5. ASTROLOGICAL SNAPSHOT ───────────────────────── */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              <View style={[styles.section, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <View style={styles.sectionHeader}>
                  <Sun color={ACCENT} size={18} strokeWidth={1.6} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('spiritualProfile.profil_astrologic', 'Profil Astrologiczny')}</Text>
                </View>
                <LinearGradient
                  colors={isLight ? ['#FEF3C7', '#FFFBEB'] : ['#F59E0B18', '#F59E0B08']}
                  style={[styles.astroCard, { borderColor: ACCENT + '33' }]}
                >
                  <View style={styles.astroTop}>
                    <Text style={{ fontSize: 48, marginRight: 14 }}>{zodiac.symbol}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.astroSign, { color: textColor }]}>{zodiac.sign}</Text>
                      <Text style={[styles.astroPlanet, { color: ACCENT }]}>Władca: {zodiac.planet}</Text>
                    </View>
                  </View>
                  <View style={styles.astroChipsRow}>
                    {[
                      { label: zodiac.element, icon: '🌊' },
                      { label: zodiac.modality, icon: '🔄' },
                      { label: zodiac.planet, icon: '⭐' },
                    ].map((chip, i) => (
                      <View
                        key={i}
                        style={[styles.astroChip, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '44' }]}
                      >
                        <Text style={{ fontSize: 12 }}>{chip.icon}</Text>
                        <Text style={{ color: textColor, fontSize: 12, fontWeight: '600' }}>{chip.label}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={[styles.astroDesc, { color: subColor }]}>
                    {zodiac.element === 'Ogień' && 'Żywioł Ognia wnosi pasję, odwagę i twórczą energię. Jesteś natchnionym katalizatorem zmian.'}
                    {zodiac.element === 'Ziemia' && 'Żywioł Ziemi wnosi stabilność, praktyczność i wytrwałość. Jesteś fundamentem dla siebie i innych.'}
                    {zodiac.element === 'Powietrze' && 'Żywioł Powietrza wnosi intelekt, komunikację i perspektywę. Jesteś mostem między ideami i ludźmi.'}
                    {zodiac.element === 'Woda' && 'Żywioł Wody wnosi głębię emocjonalną, intuicję i uzdrowienie. Czujesz więcej niż widzisz.'}
                  </Text>
                </LinearGradient>
              </View>
            </Animated.View>

            {/* ─── 6. ARCHETYPE PROFILE ───────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(240).duration(600)}>
              <View style={[styles.section, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <View style={styles.sectionHeader}>
                  <Brain color={ACCENT} size={18} strokeWidth={1.6} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('spiritualProfile.archetypy_jungowskie', 'Archetypy Jungowskie')}</Text>
                </View>
                <Text style={[styles.sectionDesc, { color: subColor }]}>
                  {t('spiritualProfile.12_archetypow_tworzy_mape_ludzkich', '12 archetypów tworzy mapę ludzkich wzorców. Twoje trzy dominujące — wyznaczone przez kombinację drogi życia i znaku zodiaku — są Twoim duchowym DNA.')}
                </Text>
                {ARCHETYPES.map((archetype, i) => {
                  const isTop = topArchetypeIds.includes(archetype.id);
                  const isExp = expandedArchetype === archetype.id;
                  return (
                    <Pressable
                      key={archetype.id}
                      onPress={() => {
                        HapticsService.notify();
                        setExpandedArchetype(isExp ? null : archetype.id);
                      }}
                      style={[
                        styles.archetypeCard,
                        {
                          borderColor: isTop ? archetype.color + '66' : cardBorder,
                          backgroundColor: isTop ? archetype.color + '0E' : cardBg,
                        },
                      ]}
                    >
                      <View style={styles.archetypeHeader}>
                        <View style={[styles.archetypeDot, { backgroundColor: archetype.color }]} />
                        <Text style={[styles.archetypeName, { color: isTop ? archetype.color : textColor }]}>
                          {archetype.name}
                          {isTop ? '  ✦' : ''}
                        </Text>
                        {isTop && (
                          <View style={[styles.archetypeTopBadge, { backgroundColor: archetype.color + '22', borderColor: archetype.color + '55' }]}>
                            <Text style={{ color: archetype.color, fontSize: 9, fontWeight: '700' }}>{t('spiritualProfile.twoj', 'TWÓJ')}</Text>
                          </View>
                        )}
                        {isExp ? (
                          <ChevronUp color={subColor} size={14} strokeWidth={1.8} />
                        ) : (
                          <ChevronDown color={subColor} size={14} strokeWidth={1.8} />
                        )}
                      </View>
                      {isExp && (
                        <Text style={[styles.archetypeDesc, { color: subColor }]}>{archetype.desc}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* ─── 7. SPIRITUAL GIFTS ─────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(280).duration(600)}>
              <View style={[styles.section, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <View style={styles.sectionHeader}>
                  <Gem color={ACCENT} size={18} strokeWidth={1.6} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('spiritualProfile.dary_duchowe', 'Dary Duchowe')}</Text>
                </View>
                <Text style={[styles.sectionDesc, { color: subColor }]}>
                  {t('spiritualProfile.twoje_5_unikalnych_darow_duchowych', 'Twoje 5 unikalnych darów duchowych, wyznaczonych przez kombinację numerologiczną i astrologiczną.')}
                </Text>
                {topGifts.map((gift, i) => (
                  <Animated.View key={gift.title} entering={FadeInDown.delay(i * 60).duration(400)}>
                    <View style={[styles.giftCard, { borderColor: ACCENT + '33', backgroundColor: ACCENT + '08' }]}>
                      <View style={styles.giftIconBox}>
                        <Text style={{ fontSize: 22 }}>{gift.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.giftTitle, { color: textColor }]}>{gift.title}</Text>
                        <Text style={[styles.giftDesc, { color: subColor }]}>{gift.desc}</Text>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* ─── 8. SHADOW ASPECTS ──────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(320).duration(600)}>
              <View style={[styles.section, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <View style={styles.sectionHeader}>
                  <Moon color={ACCENT} size={18} strokeWidth={1.6} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('spiritualProfile.obszary_cienia', 'Obszary Cienia')}</Text>
                </View>
                <Text style={[styles.sectionDesc, { color: subColor }]}>
                  {t('spiritualProfile.aspekty_cienia_to_nie_wady', 'Aspekty cienia to nie wady — to ukryte potencjały, które wymagają integracji. Świadomość jest pierwszym krokiem uzdrowienia.')}
                </Text>
                {shadowAspects.map((shadow, i) => (
                  <Animated.View key={shadow.title} entering={FadeInDown.delay(i * 70).duration(400)}>
                    <View style={[styles.shadowCard, { borderColor: '#94A3B844', backgroundColor: '#94A3B808' }]}>
                      <View style={styles.shadowHeader}>
                        <View style={[styles.shadowDot, { backgroundColor: '#94A3B8' }]} />
                        <Text style={[styles.shadowTitle, { color: textColor }]}>{shadow.title}</Text>
                      </View>
                      <Text style={[styles.shadowDesc, { color: subColor }]}>{shadow.desc}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* ─── 9. ANNUAL FORECAST ─────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(360).duration(600)}>
              <LinearGradient
                colors={isLight ? ['#FEF3C7', '#FFF8E6'] : ['#F59E0B18', '#92400E0D', '#1A1405']}
                style={[styles.forecastCard, { borderColor: ACCENT + '44' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionHeader}>
                  <Calendar color={ACCENT} size={18} strokeWidth={1.6} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('spiritualProfile.prognoza_roczna_2026', 'Prognoza Roczna 2026')}</Text>
                </View>
                <View style={styles.forecastBadgeRow}>
                  <View style={[styles.forecastBadge, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '55' }]}>
                    <Text style={[styles.forecastBadgeNum, { color: ACCENT }]}>{personalYear}</Text>
                    <Text style={[styles.forecastBadgeLabel, { color: subColor }]}>{t('spiritualProfile.rok_osobisty', 'Rok Osobisty')}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.forecastName, { color: textColor }]}>{yearForecast.name}</Text>
                    <Text style={[styles.forecastTheme, { color: subColor }]}>{yearForecast.theme}</Text>
                  </View>
                </View>

                <View style={[styles.forecastBlock, { borderColor: '#34D39933', backgroundColor: '#34D39908' }]}>
                  <Text style={[styles.forecastBlockLabel, { color: '#34D399' }]}>{t('spiritualProfile.szanse_i_mozliwosci', 'SZANSE I MOŻLIWOŚCI')}</Text>
                  <Text style={[styles.forecastBlockText, { color: subColor }]}>{yearForecast.opportunities}</Text>
                </View>
                <View style={[styles.forecastBlock, { borderColor: '#F8717133', backgroundColor: '#F8717108', marginTop: 8 }]}>
                  <Text style={[styles.forecastBlockLabel, { color: '#F87171' }]}>{t('spiritualProfile.wyzwania_do_przekrocze', 'WYZWANIA DO PRZEKROCZENIA')}</Text>
                  <Text style={[styles.forecastBlockText, { color: subColor }]}>{yearForecast.challenges}</Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* ─── 10. SPIRITUAL MILESTONES ────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(400).duration(600)}>
              <View style={[styles.section, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <View style={styles.sectionHeader}>
                  <Trophy color={ACCENT} size={18} strokeWidth={1.6} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('spiritualProfile.kamienie_milowe', 'Kamienie Milowe')}</Text>
                </View>
                <Text style={[styles.sectionDesc, { color: subColor }]}>
                  {t('spiritualProfile.twoja_podroz_duchowa_w_liczbach', 'Twoja podróż duchowa w liczbach — każda sesja, każdy wpis, każda praktyka tworzy historię Twojej duszy.')}
                </Text>
                <View style={styles.milestonesGrid}>
                  {[
                    { icon: '📅', label: 'Dni z Aeherą', value: daysSinceFirst > 0 ? `${daysSinceFirst}` : '1', color: ACCENT },
                    { icon: '📓', label: 'Wpisy i notatki', value: `${totalEntries}`, color: '#60A5FA' },
                    { icon: '🧘', label: 'Praktyki', value: `${totalPractices}`, color: '#34D399' },
                    { icon: '🙏', label: 'Wdzięczność', value: `${gratitudeEntries.length}`, color: '#F9A8D4' },
                    { icon: '🌑', label: 'Sesje cienia', value: `${shadowWorkSessions.length}`, color: '#A78BFA' },
                    { icon: '✦', label: 'Odkryte ekrany', value: profileCompletion >= 100 ? 'Pełny' : `${profileCompletion}%`, color: ACCENT },
                  ].map((ms, i) => (
                    <View
                      key={i}
                      style={[styles.milestoneTile, { borderColor: ms.color + '33', backgroundColor: ms.color + '0A' }]}
                    >
                      <Text style={{ fontSize: 22 }}>{ms.icon}</Text>
                      <Text style={[styles.milestoneTileNum, { color: ms.color }]}>{ms.value}</Text>
                      <Text style={[styles.milestoneTileLabel, { color: subColor }]}>{ms.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* ─── 11. ORACLE AI ───────────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(440).duration(600)}>
              <View style={[styles.section, { borderColor: ACCENT + '33', backgroundColor: isLight ? '#FEF9EC' : ACCENT + '08' }]}>
                <View style={styles.sectionHeader}>
                  <Sparkles color={ACCENT} size={18} strokeWidth={1.6} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('spiritualProfile.zapytaj_o_swoj_profil', 'Zapytaj o swój profil')}</Text>
                </View>
                <Text style={[styles.sectionDesc, { color: subColor }]}>
                  {t('spiritualProfile.zadaj_pytanie_ze_swoja_kombinacja', 'Zadaj pytanie ze swoją kombinacją numerologiczną i astrologiczną jako kontekstem.')}
                </Text>

                {/* Quick prompts */}
                <View style={styles.quickPromptsCol}>
                  {ORACLE_QUICK_PROMPTS.map((prompt, i) => (
                    <Pressable
                      key={i}
                      onPress={() => {
                        HapticsService.notify();
                        setOracleText(prompt);
                      }}
                      style={[styles.quickPrompt, { borderColor: ACCENT + '44', backgroundColor: ACCENT + '0D' }]}
                    >
                      <Text style={[styles.quickPromptText, { color: ACCENT }]}>{prompt}</Text>
                      <ArrowRight color={ACCENT + '88'} size={14} strokeWidth={1.8} />
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  value={oracleText}
                  onChangeText={setOracleText}
                  placeholder={t('spiritualProfile.wpisz_swoje_pytanie', 'Wpisz swoje pytanie...')}
                  placeholderTextColor={subColor + '88'}
                  multiline
                  numberOfLines={3}
                  style={[styles.inputMulti, { color: textColor, borderColor: ACCENT + '33', backgroundColor: isLight ? 'rgba(245,158,11,0.06)' : ACCENT + '0A' }]}
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
                    <Text style={styles.ctaBtnText}>{t('spiritualProfile.analizuje_profil', 'Analizuję profil...')}</Text>
                  ) : (
                    <>
                      <Text style={styles.ctaBtnText}>{t('spiritualProfile.zapytaj_oracle', 'Zapytaj Oracle')}</Text>
                      <Sparkles color="#fff" size={16} strokeWidth={2} />
                    </>
                  )}
                </Pressable>

                {oracleResult.length > 0 && (
                  <Animated.View entering={FadeInDown.duration(500)}>
                    <View style={[styles.oracleResult, { borderColor: ACCENT + '44', backgroundColor: isLight ? '#FEF3C7' : ACCENT + '0D' }]}>
                      <Text style={[styles.oracleResultLabel, { color: ACCENT }]}>{t('spiritualProfile.oracle_odpowiada', 'ORACLE ODPOWIADA')}</Text>
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
    </View>
  );
};

// ── STYLES ───────────────────────────────────────────────────────
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

  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  sectionDesc: { fontSize: 13, lineHeight: 20, marginBottom: 12 },

  completionPct: { fontSize: 15, fontWeight: '800' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: 6, borderRadius: 3 },
  milestonesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  milestone: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },

  identityCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  identityTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  identityLeft: { flex: 1 },
  identityName: { fontSize: 22, fontWeight: '800', letterSpacing: 0.2 },
  identitySubline: { fontSize: 13, marginTop: 4 },
  identityBadge: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.06)',
  },
  identityStat: { alignItems: 'center' },
  identityStatNum: { fontSize: 22, fontWeight: '800' },
  identityStatLabel: { fontSize: 10, fontWeight: '600', marginTop: 2, letterSpacing: 0.3 },
  identityDivider: { width: 1, height: 32 },
  identityArchRow: { borderTopWidth: 1, paddingTop: 12 },
  identityArchLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  identityArchValues: { fontSize: 14, fontWeight: '600' },

  numCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  numCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBadgeText: { fontSize: 16, fontWeight: '800' },
  numLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  numMeaning: { fontSize: 13, lineHeight: 21, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.10)' },

  astroCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  astroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  astroSign: { fontSize: 22, fontWeight: '800' },
  astroPlanet: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  astroChipsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  astroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  astroDesc: { fontSize: 13, lineHeight: 20 },

  archetypeCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 6,
  },
  archetypeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  archetypeDot: { width: 8, height: 8, borderRadius: 4 },
  archetypeName: { flex: 1, fontSize: 14, fontWeight: '600' },
  archetypeTopBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  archetypeDesc: { fontSize: 13, lineHeight: 20, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.08)' },

  giftCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  giftIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  giftTitle: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  giftDesc: { fontSize: 12, lineHeight: 18 },

  shadowCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  shadowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  shadowDot: { width: 8, height: 8, borderRadius: 4 },
  shadowTitle: { fontSize: 14, fontWeight: '600' },
  shadowDesc: { fontSize: 13, lineHeight: 20 },

  forecastCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  forecastBadgeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  forecastBadge: {
    width: 60,
    height: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forecastBadgeNum: { fontSize: 24, fontWeight: '800' },
  forecastBadgeLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  forecastName: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  forecastTheme: { fontSize: 13, lineHeight: 20 },
  forecastBlock: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  forecastBlockLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  forecastBlockText: { fontSize: 13, lineHeight: 20 },

  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  milestoneTile: {
    width: '30%',
    minWidth: 90,
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  milestoneTileNum: { fontSize: 20, fontWeight: '800' },
  milestoneTileLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center', letterSpacing: 0.3 },

  quickPromptsCol: { gap: 8, marginBottom: 12 },
  quickPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickPromptText: { flex: 1, fontSize: 13, lineHeight: 18 },

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

  oracleResult: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 10,
  },
  oracleResultLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6 },
  oracleResultText: { fontSize: 14 },
});

export default SpiritualProfileScreen;
