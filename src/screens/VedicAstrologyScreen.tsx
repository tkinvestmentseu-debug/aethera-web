// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View,
  Dimensions, Modal, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText, Ellipse } from 'react-native-svg';
import Animated, {
  FadeInDown, FadeIn,
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withTiming, withSpring, withSequence,
  interpolate, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Sparkles, Sun, Moon, Zap, Eye, BookOpen,
  ArrowRight, Globe, Gem, Music, Hash,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#F97316'; // saffron orange

// ── VEDIC DATA ────────────────────────────────────────────────

const NAKSHATRA_LIST = [
  { name: 'Ashwini', sanskrit: 'अश्विनी', deity: 'Ashvins', symbol: 'Głowa konia', shakti: 'Moc uzdrowienia', nature: 'Deva', planet: 'Ketu', degrees: [0, 13.333] },
  { name: 'Bharani', sanskrit: 'भरणी', deity: 'Yama', symbol: 'Yoni', shakti: 'Moc oczyszczenia', nature: 'Manushya', planet: 'Wenus', degrees: [13.333, 26.667] },
  { name: 'Krittika', sanskrit: 'कृत्तिका', deity: 'Agni', symbol: 'Ostrze', shakti: 'Moc ognia', nature: 'Rakshasa', planet: 'Słońce', degrees: [26.667, 40] },
  { name: 'Rohini', sanskrit: 'रोहिणी', deity: 'Brahma', symbol: 'Rydwan', shakti: 'Moc wzrostu', nature: 'Manushya', planet: 'Księżyc', degrees: [40, 53.333] },
  { name: 'Mrigashira', sanskrit: 'मृगशिरा', deity: 'Soma', symbol: 'Głowa jelenia', shakti: 'Moc poszukiwania', nature: 'Deva', planet: 'Mars', degrees: [53.333, 66.667] },
  { name: 'Ardra', sanskrit: 'आर्द्रा', deity: 'Rudra', symbol: 'Diament', shakti: 'Moc wysiłku', nature: 'Manushya', planet: 'Rahu', degrees: [66.667, 80] },
  { name: 'Punarvasu', sanskrit: 'पुनर्वसु', deity: 'Aditi', symbol: 'Kołczan', shakti: 'Moc odrodzenia', nature: 'Deva', planet: 'Jowisz', degrees: [80, 93.333] },
  { name: 'Pushya', sanskrit: 'पुष्य', deity: 'Brihaspati', symbol: 'Kwiat', shakti: 'Moc tworzenia energii', nature: 'Deva', planet: 'Saturn', degrees: [93.333, 106.667] },
  { name: 'Ashlesha', sanskrit: 'आश्लेषा', deity: 'Naga', symbol: 'Wąż', shakti: 'Moc zatruwania', nature: 'Rakshasa', planet: 'Merkury', degrees: [106.667, 120] },
  { name: 'Magha', sanskrit: 'मघा', deity: 'Pitrs', symbol: 'Tron', shakti: 'Moc przodków', nature: 'Rakshasa', planet: 'Ketu', degrees: [120, 133.333] },
  { name: 'Purva Phalguni', sanskrit: 'पूर्वफाल्गुनी', deity: 'Bhaga', symbol: 'Hamak', shakti: 'Moc szczęścia', nature: 'Manushya', planet: 'Wenus', degrees: [133.333, 146.667] },
  { name: 'Uttara Phalguni', sanskrit: 'उत्तरफाल्गुनी', deity: 'Aryaman', symbol: 'Łóżko', shakti: 'Moc opieki', nature: 'Manushya', planet: 'Słońce', degrees: [146.667, 160] },
  { name: 'Hasta', sanskrit: 'हस्त', deity: 'Savitr', symbol: 'Dłoń', shakti: 'Moc umiejętności', nature: 'Deva', planet: 'Księżyc', degrees: [160, 173.333] },
  { name: 'Chitra', sanskrit: 'चित्रा', deity: 'Tvashtr', symbol: 'Perła', shakti: 'Moc tworzenia', nature: 'Rakshasa', planet: 'Mars', degrees: [173.333, 186.667] },
  { name: 'Swati', sanskrit: 'स्वाति', deity: 'Vayu', symbol: 'Korale', shakti: 'Moc wiatru', nature: 'Deva', planet: 'Rahu', degrees: [186.667, 200] },
  { name: 'Vishakha', sanskrit: 'विशाखा', deity: 'Indra', symbol: 'Łuk', shakti: 'Moc celu', nature: 'Rakshasa', planet: 'Jowisz', degrees: [200, 213.333] },
  { name: 'Anuradha', sanskrit: 'अनुराधा', deity: 'Mitra', symbol: 'Lotos', shakti: 'Moc oddania', nature: 'Deva', planet: 'Saturn', degrees: [213.333, 226.667] },
  { name: 'Jyeshtha', sanskrit: 'ज्येष्ठा', deity: 'Indra', symbol: 'Talizman', shakti: 'Moc odwagi', nature: 'Rakshasa', planet: 'Merkury', degrees: [226.667, 240] },
  { name: 'Mula', sanskrit: 'मूल', deity: 'Nirrti', symbol: 'Korzenie', shakti: 'Moc niszczenia', nature: 'Rakshasa', planet: 'Ketu', degrees: [240, 253.333] },
  { name: 'Purva Ashadha', sanskrit: 'पूर्वाषाढ़ा', deity: 'Apas', symbol: 'Wachlarz', shakti: 'Moc wody', nature: 'Manushya', planet: 'Wenus', degrees: [253.333, 266.667] },
  { name: 'Uttara Ashadha', sanskrit: 'उत्तराषाढ़ा', deity: 'Vishvadevas', symbol: 'Słoniowy kieł', shakti: 'Moc zwycięstwa', nature: 'Manushya', planet: 'Słońce', degrees: [266.667, 280] },
  { name: 'Shravana', sanskrit: 'श्रवण', deity: 'Vishnu', symbol: 'Ucho', shakti: 'Moc słuchania', nature: 'Deva', planet: 'Księżyc', degrees: [280, 293.333] },
  { name: 'Dhanishta', sanskrit: 'धनिष्ठा', deity: 'Vasus', symbol: 'Bęben', shakti: 'Moc bogactwa', nature: 'Rakshasa', planet: 'Mars', degrees: [293.333, 306.667] },
  { name: 'Shatabhisha', sanskrit: 'शतभिषा', deity: 'Varuna', symbol: '100 gwiazd', shakti: 'Moc leczenia', nature: 'Rakshasa', planet: 'Rahu', degrees: [306.667, 320] },
  { name: 'Purva Bhadrapada', sanskrit: 'पूर्वभाद्रपदा', deity: 'Aja Ekapad', symbol: 'Miecz', shakti: 'Moc ogrzewania', nature: 'Manushya', planet: 'Jowisz', degrees: [320, 333.333] },
  { name: 'Uttara Bhadrapada', sanskrit: 'उत्तरभाद्रपदा', deity: 'Ahir Budhnya', symbol: 'Łóżko', shakti: 'Moc deszczu', nature: 'Manushya', planet: 'Saturn', degrees: [333.333, 346.667] },
  { name: 'Revati', sanskrit: 'रेवती', deity: 'Pushan', symbol: 'Ryba', shakti: 'Moc odżywiania', nature: 'Deva', planet: 'Merkury', degrees: [346.667, 360] },
];

// Vedic signs (Rashi)
const RASHI = [
  { name: 'Mesha', polish: 'Baran wedyjski', sanskrit: 'मेष', traits: 'Pionierski, impulsywny, odważny, energiczny, przywódczy duch i szybkie decyzje', planet: 'Mars', element: 'Ogień', quality: 'Ruchomy' },
  { name: 'Vrishabha', polish: 'Byk wedyjski', sanskrit: 'वृषभ', traits: 'Wytrwały, zmysłowy, lojalny, praktyczny, głęboka potrzeba materialnego bezpieczeństwa', planet: 'Wenus', element: 'Ziemia', quality: 'Stały' },
  { name: 'Mithuna', polish: 'Bliźnięta wedyjskie', sanskrit: 'मिथुन', traits: 'Ciekawski, komunikatywny, wszechstronny, intelektualny, mistrz powiązań i słów', planet: 'Merkury', element: 'Powietrze', quality: 'Zmienny' },
  { name: 'Karka', polish: 'Rak wedyjski', sanskrit: 'कर्क', traits: 'Intuicyjny, opiekuńczy, emocjonalny, wrażliwy, głęboko związany z przeszłością i rodziną', planet: 'Księżyc', element: 'Woda', quality: 'Ruchomy' },
  { name: 'Simha', polish: 'Lew wedyjski', sanskrit: 'सिंह', traits: 'Kreatywny, szlachetny, ekspresyjny, charyzmatyczny, potrzeba bycia widzianym i docenianym', planet: 'Słońce', element: 'Ogień', quality: 'Stały' },
  { name: 'Kanya', polish: 'Panna wedyjska', sanskrit: 'कन्या', traits: 'Analityczny, perfekcjonistyczny, służący, skromny, wyczulony na szczegóły i zdrowie', planet: 'Merkury', element: 'Ziemia', quality: 'Zmienny' },
  { name: 'Tula', polish: 'Waga wedyjska', sanskrit: 'तुला', traits: 'Dyplomatyczny, harmonijny, estetyczny, sprawiedliwy, dążenie do równowagi w relacjach', planet: 'Wenus', element: 'Powietrze', quality: 'Ruchomy' },
  { name: 'Vrishchika', polish: 'Skorpion wedyjski', sanskrit: 'वृश्चिक', traits: 'Intensywny, transformujący, tajemniczy, głęboki, naturalny dar badania ukrytych prawd', planet: 'Mars', element: 'Woda', quality: 'Stały' },
  { name: 'Dhanu', polish: 'Strzelec wedyjski', sanskrit: 'धनु', traits: 'Filozoficzny, optymistyczny, wolny, ekspansywny, poszukiwanie wyższego sensu i mądrości', planet: 'Jowisz', element: 'Ogień', quality: 'Zmienny' },
  { name: 'Makara', polish: 'Koziorożec wedyjski', sanskrit: 'मकर', traits: 'Ambitny, zdyscyplinowany, cierpliwy, pragmatyczny, strukturalny budowniczy długofalowych celów', planet: 'Saturn', element: 'Ziemia', quality: 'Ruchomy' },
  { name: 'Kumbha', polish: 'Wodnik wedyjski', sanskrit: 'कुम्भ', traits: 'Innowacyjny, humanitarny, oryginalny, niezależny, wizjoner reformujący stare struktury', planet: 'Saturn', element: 'Powietrze', quality: 'Stały' },
  { name: 'Meena', polish: 'Ryby wedyjskie', sanskrit: 'मीन', traits: 'Mistyczny, współczujący, intuicyjny, wrażliwy, przepuszczalność granic i duchowa głębia', planet: 'Jowisz', element: 'Woda', quality: 'Zmienny' },
];

// Planetary periods (Vimshottari Dasha)
const DASHA_ORDER = ['Ketu', 'Wenus', 'Słońce', 'Księżyc', 'Mars', 'Rahu', 'Jowisz', 'Saturn', 'Merkury'];
const DASHA_YEARS = { Ketu: 7, Wenus: 20, Słońce: 6, Księżyc: 10, Mars: 7, Rahu: 18, Jowisz: 16, Saturn: 19, Merkury: 17 };
const DASHA_LIFE = { Ketu: 'Karmy i duchowej ewolucji', Wenus: 'Miłości, sztuki i dobrobytu', Słońce: 'Tożsamości i kariery', Księżyc: 'Emocji i intuicji', Mars: 'Działania i energii', Rahu: 'Ambicji i transformacji', Jowisz: 'Mądrości i wzrostu', Saturn: 'Dyscypliny i struktury', Merkury: 'Komunikacji i intelektu' };
const DASHA_COLORS = { Ketu: '#8B5CF6', Wenus: '#F472B6', Słońce: '#F59E0B', Księżyc: '#93C5FD', Mars: '#EF4444', Rahu: '#6366F1', Jowisz: '#F97316', Saturn: '#64748B', Merkury: '#34D399' };

// Planetary remedies
const PLANET_REMEDIES = [
  { planet: 'Słońce', symbol: '☉', gemstone: 'Rubin', mantra: 'Om Suryaya Namah', color: 'Złoty / Pomarańczowy', day: 'Niedziela', chakra: 'Sahasrara', color_hex: '#F59E0B' },
  { planet: 'Księżyc', symbol: '☽', gemstone: 'Perła', mantra: 'Om Chandraya Namah', color: 'Biały / Srebrny', day: 'Poniedziałek', chakra: 'Ajna', color_hex: '#93C5FD' },
  { planet: 'Mars', symbol: '♂', gemstone: 'Koral', mantra: 'Om Mangalaya Namah', color: 'Czerwony / Karmazynowy', day: 'Wtorek', chakra: 'Manipura', color_hex: '#EF4444' },
  { planet: 'Merkury', symbol: '☿', gemstone: 'Szmaragd', mantra: 'Om Budhaya Namah', color: 'Zielony', day: 'Środa', chakra: 'Anahata', color_hex: '#34D399' },
  { planet: 'Jowisz', symbol: '♃', gemstone: 'Żółty szafir', mantra: 'Om Brihaspataye Namah', color: 'Żółty / Złoty', day: 'Czwartek', chakra: 'Vishuddha', color_hex: '#FBBF24' },
  { planet: 'Wenus', symbol: '♀', gemstone: 'Diament / Kryształ górski', mantra: 'Om Shukraya Namah', color: 'Biały / Różowy', day: 'Piątek', chakra: 'Svadhisthana', color_hex: '#F472B6' },
  { planet: 'Saturn', symbol: '♄', gemstone: 'Niebieski szafir', mantra: 'Om Shanaischaraya Namah', color: 'Niebieski / Czarny', day: 'Sobota', chakra: 'Muladhara', color_hex: '#64748B' },
  { planet: 'Rahu', symbol: '☊', gemstone: 'Hessonit', mantra: 'Om Rahave Namah', color: 'Brązowy / Szary', day: 'Sobota', chakra: 'Ajna', color_hex: '#6366F1' },
  { planet: 'Ketu', symbol: '☋', gemstone: 'Koci oko', mantra: 'Om Ketave Namah', color: 'Szary / Wielobarwny', day: 'Wtorek', chakra: 'Sahasrara', color_hex: '#8B5CF6' },
];

// Vedic doshas (Ayurvedic)
const DOSHA_DATA = {
  vata: {
    name: 'Vata', sanskrit: 'वात', elements: 'Przestrzeń + Powietrze',
    traits: 'Kreatywność, szybkie myślenie, elastyczność, wyobraźnia, spontaniczność',
    imbalance: 'Lęk, niepokój, bezsenność, suchość, nieregularność',
    remedy: 'Rutyna, ciepłe potrawy, oleje, medytacja i stabilność',
    color: '#93C5FD', seasons: 'Jesień / Wczesna zima',
  },
  pitta: {
    name: 'Pitta', sanskrit: 'पित्त', elements: 'Ogień + Woda',
    traits: 'Inteligencja, przywództwo, pewność siebie, ostrość, transformacja',
    imbalance: 'Gniew, stan zapalny, krytycyzm, nadmierne ciepło, ambicja',
    remedy: 'Chłodne jedzenie, natura, słodkość, medytacja miłości, odpoczynek',
    color: '#EF4444', seasons: 'Lato',
  },
  kapha: {
    name: 'Kapha', sanskrit: 'कफ', elements: 'Ziemia + Woda',
    traits: 'Stabilność, cierpliwość, lojalność, miłość, wytrwałość, wytrzymałość',
    imbalance: 'Ospałość, przywiązanie, stagnacja, nadwaga, depresja',
    remedy: 'Ruch, ostre smaki, wyzwania, nowe doświadczenia, stymulacja',
    color: '#34D399', seasons: 'Wiosna / Zima',
  },
};

// ── CALCULATIONS ──────────────────────────────────────────────

function getTropicalDegrees(birthDate: string): number {
  try {
    const d = new Date(birthDate);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    // Approximate sun longitude in tropical zodiac
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
    return ((dayOfYear - 80) * (360 / 365) + 360) % 360;
  } catch {
    return 0;
  }
}

function getVedicSign(birthDate: string): string {
  const tropical = getTropicalDegrees(birthDate);
  const ayanamsa = 23.9; // Lahiri ayanamsa approximate
  const vedic = ((tropical - ayanamsa) + 360) % 360;
  const idx = Math.floor(vedic / 30);
  return RASHI[Math.max(0, Math.min(11, idx))].name;
}

function getWesternSignName(birthDate: string): string {
  try {
    const d = new Date(birthDate);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return 'Aries';
    if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return 'Taurus';
    if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return 'Gemini';
    if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return 'Cancer';
    if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return 'Leo';
    if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return 'Virgo';
    if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return 'Libra';
    if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return 'Scorpio';
    if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return 'Sagittarius';
    if ((m === 12 && day >= 22) || (m === 1 && day <= 19)) return 'Capricorn';
    if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return 'Aquarius';
    return 'Pisces';
  } catch { return 'Aries'; }
}

const WESTERN_POLISH: Record<string, string> = {
  Aries: 'Baran', Taurus: 'Byk', Gemini: 'Bliźnięta', Cancer: 'Rak',
  Leo: 'Lew', Virgo: 'Panna', Libra: 'Waga', Scorpio: 'Skorpion',
  Sagittarius: 'Strzelec', Capricorn: 'Koziorożec', Aquarius: 'Wodnik', Pisces: 'Ryby',
};

function getNakshatra(birthDate: string) {
  const tropical = getTropicalDegrees(birthDate);
  const ayanamsa = 23.9;
  const moonLon = ((tropical - ayanamsa) + 360) % 360; // approximate moon from birth date
  return NAKSHATRA_LIST.find(n => moonLon >= n.degrees[0] && moonLon < n.degrees[1]) || NAKSHATRA_LIST[0];
}

function getDominantDosha(birthDate: string): 'vata' | 'pitta' | 'kapha' {
  try {
    const d = new Date(birthDate);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const sum = day + month + d.getFullYear();
    const r = sum % 3;
    if (r === 0) return 'vata';
    if (r === 1) return 'pitta';
    return 'kapha';
  } catch { return 'vata'; }
}

function getCurrentDasha(birthDate: string): { mahadasha: string; antardasha: string; yearsLeft: number } {
  try {
    const d = new Date(birthDate);
    const now = new Date();
    const totalYears = (now.getTime() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
    const totalDashaCycle = 120;
    // Vimshottari starts with birth nakshatra lord — approximate with month offset
    const startOffset = (d.getMonth() * 10) % totalDashaCycle;
    let elapsed = (totalYears + startOffset) % totalDashaCycle;
    let dashaPlanet = '';
    let remaining = 0;
    for (const planet of DASHA_ORDER) {
      const yr = DASHA_YEARS[planet];
      if (elapsed < yr) { dashaPlanet = planet; remaining = yr - elapsed; break; }
      elapsed -= yr;
    }
    // Antardasha: subdivide remaining elapsed within mahadasha
    const mYears = DASHA_YEARS[dashaPlanet] || 10;
    const mElapsed = mYears - remaining;
    let antaPlanet = '';
    let subElapsed = mElapsed;
    const antaraRatio = DASHA_ORDER.map(p => ({ p, y: (DASHA_YEARS[p] / 120) * mYears }));
    for (const { p, y } of antaraRatio) {
      if (subElapsed < y) { antaPlanet = p; break; }
      subElapsed -= y;
    }
    return { mahadasha: dashaPlanet, antardasha: antaPlanet || dashaPlanet, yearsLeft: Math.round(remaining * 10) / 10 };
  } catch {
    return { mahadasha: 'Jowisz', antardasha: 'Księżyc', yearsLeft: 3.5 };
  }
}

function checkVedicYogas(birthDate: string): { name: string; present: boolean; desc: string }[] {
  try {
    const d = new Date(birthDate);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const sum = day + month + (year % 100);
    return [
      {
        name: 'Gaja Kesari Yoga',
        present: sum % 4 === 0,
        desc: 'Jowisz w kącie od Księżyca — mądrość, honor i trwały sukces. Słonie (siła) i lwy (królewskość) łączą swe moce.',
      },
      {
        name: 'Budhaditya Yoga',
        present: (day + month) % 3 === 1,
        desc: 'Słońce i Merkury w koniunkcji — wyjątkowa inteligencja, elokwencja i zdolności przywódcze.',
      },
      {
        name: 'Viparita Raja Yoga',
        present: (day * month) % 5 === 2,
        desc: 'Władcy domów 6, 8, 12 w swoich domach — paradoksalny sukces przez przezwyciężenie przeszkód.',
      },
    ];
  } catch {
    return [];
  }
}

function getVedicLuckyNumber(birthDate: string): number {
  try {
    const today = new Date();
    const d = new Date(birthDate);
    const n = d.getDate() + d.getMonth() + today.getDate() + today.getMonth();
    return (n % 9) + 1;
  } catch { return 7; }
}

// ── SVG: JYOTISH CHART HERO ───────────────────────────────────

const AnimatedG = Animated.createAnimatedComponent(G);

const VedicWheelHero = React.memo(({ accent }: { accent: string }) => {
  const rot1 = useSharedValue(0);
  const rot2 = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    rot1.value = withRepeat(withTiming(360, { duration: 28000, easing: Easing.linear }), -1, false);
    rot2.value = withRepeat(withTiming(-360, { duration: 18000, easing: Easing.linear }), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-22, Math.min(22, e.translationY * 0.14));
      tiltY.value = Math.max(-22, Math.min(22, e.translationX * 0.14));
    })
    .onEnd(() => {
      tiltX.value = withSpring(0, { damping: 16 });
      tiltY.value = withSpring(0, { damping: 16 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 700 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }],
  }));
  const orbit1Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot1.value}deg` }] }));
  const orbit2Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot2.value}deg` }] }));

  const S = 220;
  const cx = S / 2;
  const sq = 80;

  // House lines for Jyotish North Indian chart
  const houseLines = [
    [cx, cx - sq, cx, cx + sq], // vertical center
    [cx - sq, cx, cx + sq, cx], // horizontal center
    [cx - sq, cx - sq, cx + sq, cx + sq], // diagonal ↘
    [cx + sq, cx - sq, cx - sq, cx + sq], // diagonal ↙
  ];

  // Sanskrit house symbols (abbreviated)
  const houseSymbols = ['१','२','३','४','५','६','७','८','९','१०','११','१२'];
  const housePos = [
    [cx, cx - 54], [cx + 42, cx - 42], [cx + 54, cx],
    [cx + 42, cx + 42], [cx, cx + 54], [cx - 42, cx + 42],
    [cx, cx + 54], [cx - 42, cx + 42], [cx - 54, cx],
    [cx - 42, cx - 42], [cx, cx - 54], [cx + 42, cx - 42],
  ];
  // Simplified 12-house north Indian layout positions
  const houseCenters = [
    [cx, cx - 54], [cx + 42, cx - 42], [cx + 54, cx], [cx + 42, cx + 42],
    [cx, cx + 54], [cx - 42, cx + 42], [cx - 54, cx], [cx - 42, cx - 42],
    [cx - 26, cx - 26], [cx + 26, cx - 26], [cx + 26, cx + 26], [cx - 26, cx + 26],
  ];

  const planets = ['☉','☽','♂','☿','♃','♀','♄','☊'];
  const planetColors = ['#F59E0B','#93C5FD','#EF4444','#34D399','#F97316','#F472B6','#64748B','#6366F1'];
  const planetAngles = planets.map((_, i) => (i / planets.length) * Math.PI * 2);

  return (
    <View style={{ alignItems: 'center', marginVertical: 8, height: S }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[outerStyle, { width: S, height: S }]}>
          {/* Static Jyotish square chart */}
          <Svg width={S} height={S} style={StyleSheet.absoluteFill}>
            {/* Outer square */}
            <Rect x={cx - sq - 8} y={cx - sq - 8} width={(sq + 8) * 2} height={(sq + 8) * 2}
              stroke={accent + '55'} strokeWidth={1.5} fill="none" rx={4} />
            {/* Inner diamond */}
            <Path d={`M${cx},${cx - sq} L${cx + sq},${cx} L${cx},${cx + sq} L${cx - sq},${cx} Z`}
              stroke={accent + '44'} strokeWidth={1} fill={accent + '08'} />
            {/* House division lines */}
            {houseLines.map(([x1, y1, x2, y2], i) => (
              <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent + '33'} strokeWidth={0.8} />
            ))}
            {/* Center lozenge */}
            <Rect x={cx - 22} y={cx - 22} width={44} height={44} stroke={accent + '66'} strokeWidth={1.2} fill={accent + '10'} transform={`rotate(45 ${cx} ${cx})`} />
            {/* House numbers */}
            {houseCenters.slice(0, 8).map(([hx, hy], i) => (
              <SvgText key={i} x={hx} y={hy + 5} fontSize={9} fill={accent + 'BB'} textAnchor="middle" fontWeight="bold">
                {houseSymbols[i]}
              </SvgText>
            ))}
            {/* OM symbol in center */}
            <SvgText x={cx} y={cx + 7} fontSize={18} fill={accent} textAnchor="middle" fontWeight="bold" opacity={0.85}>
              ॐ
            </SvgText>
            {/* Star particles */}
            {Array.from({ length: 24 }, (_, i) => (
              <Circle key={'s' + i}
                cx={(i * 89 + 15) % S} cy={(i * 67 + 10) % S}
                r={i % 5 === 0 ? 1.6 : 0.8}
                fill={i % 3 === 0 ? accent : 'white'} opacity={0.22} />
            ))}
          </Svg>

          {/* Orbit ring 1: outer planets */}
          <Animated.View style={[StyleSheet.absoluteFill, orbit1Style, { alignItems: 'center', justifyContent: 'center' }]}>
            <Svg width={S} height={S}>
              <Ellipse cx={cx} cy={cx} rx={96} ry={30} stroke={accent + '22'} strokeWidth={0.8} fill="none" strokeDasharray="4 8" />
              {planets.slice(0, 5).map((p, i) => {
                const a = (i / 5) * Math.PI * 2;
                return (
                  <SvgText key={i} x={cx + 96 * Math.cos(a)} y={cx + 30 * Math.sin(a) + 5}
                    fontSize={12} fill={planetColors[i]} textAnchor="middle" opacity={0.9}>{p}</SvgText>
                );
              })}
            </Svg>
          </Animated.View>

          {/* Orbit ring 2: inner planets */}
          <Animated.View style={[StyleSheet.absoluteFill, orbit2Style, { alignItems: 'center', justifyContent: 'center' }]}>
            <Svg width={S} height={S}>
              <Ellipse cx={cx} cy={cx} rx={70} ry={22} stroke={accent + '18'} strokeWidth={0.7} fill="none" strokeDasharray="3 6" />
              {planets.slice(5).map((p, i) => {
                const a = (i / 3) * Math.PI * 2;
                return (
                  <SvgText key={i} x={cx + 70 * Math.cos(a)} y={cx + 22 * Math.sin(a) + 5}
                    fontSize={11} fill={planetColors[5 + i]} textAnchor="middle" opacity={0.85}>{p}</SvgText>
                );
              })}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

// ── SECTION HEADER ────────────────────────────────────────────

const SectionHeader = ({ label, accent }: { label: string; accent: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 28, marginBottom: 14 }}>
    <View style={{ flex: 1, height: 1, backgroundColor: accent + '28' }} />
    <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2.4, color: accent + 'CC', marginHorizontal: 12 }}>{label}</Text>
    <View style={{ flex: 1, height: 1, backgroundColor: accent + '28' }} />
  </View>
);

// ── INFO PILL ─────────────────────────────────────────────────

const InfoPill = ({ label, value, accent, isLight }: any) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: accent + '20' }}>
    <Text style={{ fontSize: 12, color: isLight ? '#6A5A48' : '#B0A393', fontWeight: '500' }}>{label}</Text>
    <Text style={{ fontSize: 13, color: isLight ? '#1A1410' : '#F5F1EA', fontWeight: '700' }}>{value}</Text>
  </View>
);

// ── PREMIUM CARD ──────────────────────────────────────────────

const PremiumCard = ({ gradient, children, style }: any) => (
  <View style={[{ borderRadius: 18, overflow: 'hidden', marginBottom: 12 }, style]}>
    <LinearGradient colors={gradient} style={{ padding: 18 }}>
      {children}
    </LinearGradient>
  </View>
);

// ── MAIN SCREEN ────────────────────────────────────────────────

export const VedicAstrologyScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const accent = ACCENT;
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.10)';

  const [expandedRashi, setExpandedRashi] = useState<number | null>(null);
  const [expandedRemedy, setExpandedRemedy] = useState<number | null>(null);
  const [aiReading, setAiReading] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const starred = isFavoriteItem('vedic_astrology');

  const birthDate = userData?.birthDate || '';
  const userName = userData?.name || 'Wędrowcze';

  const vedicSign = useMemo(() => getVedicSign(birthDate), [birthDate]);
  const westernSignKey = useMemo(() => getWesternSignName(birthDate), [birthDate]);
  const westernSign = WESTERN_POLISH[westernSignKey] || westernSignKey;
  const nakshatra = useMemo(() => getNakshatra(birthDate), [birthDate]);
  const dominantDosha = useMemo(() => getDominantDosha(birthDate), [birthDate]);
  const dasha = useMemo(() => getCurrentDasha(birthDate), [birthDate]);
  const yogas = useMemo(() => checkVedicYogas(birthDate), [birthDate]);
  const luckyNumber = useMemo(() => getVedicLuckyNumber(birthDate), [birthDate]);
  const vedicSignData = RASHI.find(r => r.name === vedicSign) || RASHI[0];
  const doshaData = DOSHA_DATA[dominantDosha];

  const handleStar = () => {
    HapticsService.notify();
    if (isFavoriteItem('vedic_astrology')) {
      removeFavoriteItem('vedic_astrology');
    } else {
      addFavoriteItem({ id: 'vedic_astrology', label: 'Astrologia Wedyjska', sublabel: 'Jyotish · Nakshatra · Dasha', route: 'VedicAstrology', icon: 'Globe', color: accent });
    }
  };

  const handleAiReading = async () => {
    if (aiLoading) return;
    HapticsService.notify();
    setAiLoading(true);
    try {
      const rashiName = vedicSignData.polish;
      const prompt = `Jesteś mistrzem astrologii wedyjskiej (Jyotish). Użytkownik ${userName} ma:
- Znak wedyjski (Rashi): ${vedicSign} (${rashiName})
- Znak zachodni: ${westernSign}
- Nakshatra: ${nakshatra.name} (${nakshatra.sanskrit}) — bóstwo: ${nakshatra.deity}, shakti: ${nakshatra.shakti}
- Dominująca dosha: ${doshaData.name} (${doshaData.sanskrit})
- Bieżąca Mahadasha: ${dasha.mahadasha} — obszar: ${DASHA_LIFE[dasha.mahadasha] || 'transformacji'}
- Zostało: ~${dasha.yearsLeft} lat Mahadashy

Przygotuj głęboki odczyt wedyjski (3-4 zdania, w języku użytkownika):
1. Połącz energie Rashi i Nakshatry w całość osobowości
2. Co obecna Mahadasha aktywuje w tym życiu?
3. Jedna praktyczna wskazówka wedyjska dla tego okresu

Pisz poetycko ale konkretnie. Bez listy punktów — ciągły akapit.`;

      const result = await AiService.chatWithOracle(
        [{ role: 'user', content: prompt }],
        'pl',
      );
      setAiReading(result.trim());
    } catch {
      setAiReading('Gwiazdy wedyjskie milczą w tej chwili — spróbuj ponownie za chwilę, kiedy niebiański szum ucichnie.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {isLight
          ? <LinearGradient colors={['#FEF3E8', '#FDE8CC', '#FEF3E8']} style={StyleSheet.absoluteFill} />
          : <LinearGradient colors={['#0C0805', '#14100A', '#1A1510']} style={StyleSheet.absoluteFill} />
        }
        <Svg width={SW} height={400} style={StyleSheet.absoluteFill} opacity={0.14}>
          <G>
            {[180, 130, 88, 50].map((r, i) => (
              <Circle key={i} cx={SW / 2} cy={200} r={r} stroke={accent} strokeWidth={0.7}
                fill="none" strokeDasharray={i % 2 === 0 ? '5 9' : '2 5'} opacity={0.5 - i * 0.09} />
            ))}
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * 30 - 90) * Math.PI / 180;
              return <Circle key={'n' + i} cx={SW / 2 + Math.cos(a) * 180} cy={200 + Math.sin(a) * 180}
                r={i % 3 === 0 ? 3.5 : 1.8} fill={accent} opacity={0.35} />;
            })}
            {Array.from({ length: 22 }, (_, i) => (
              <Circle key={'s' + i} cx={(i * 97 + 20) % SW} cy={(i * 73 + 40) % 380}
                r={i % 5 === 0 ? 1.6 : 0.9} fill="white" opacity={0.15} />
            ))}
          </G>
        </Svg>
      </View>

      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.headerBtn}>
            <ChevronLeft color={accent} size={22} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: textColor }]}>{t('vedicAstrology.astrologia_wedyjska', 'Astrologia Wedyjska')}</Text>
            <Text style={[styles.headerSub, { color: accent }]}>{t('vedicAstrology.jyotish_nauka_swiatla', 'JYOTISH · NAUKA ŚWIATŁA')}</Text>
          </View>
          <Pressable onPress={handleStar} style={styles.headerBtn}>
            <Star color={accent} size={20} fill={starred ? accent : 'none'} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO SVG CHART */}
          <Animated.View entering={FadeIn.duration(600)} style={{ alignItems: 'center', marginBottom: 4 }}>
            <VedicWheelHero accent={accent} />
            <Text style={[styles.heroEyebrow, { color: accent }]}>{t('vedicAstrology.kolo_jyotish', 'KOŁO JYOTISH')}</Text>
            <Text style={[styles.heroTitle, { color: textColor }]}>{t('vedicAstrology.mapa_swiatla', 'Mapa Światła')}</Text>
            <Text style={[styles.heroDesc, { color: subColor }]}>
              Jyotish — „nauka o świetle" — to starożytny indyjski system astronomii i mistyki urodzenia. Korzysta z siderycznego zodiaku (przesuniętego o ~24°), 27 Nakshatry (konstelacji księżycowych) i systemu Dasha planet.
            </Text>
          </Animated.View>

          {/* SIGN COMPARISON */}
          <Animated.View entering={FadeInDown.delay(80).duration(420)}>
            <SectionHeader label={t('vedicAstrology.znak_zachodni_vs_wedyjski', 'ZNAK ZACHODNI vs. WEDYJSKI')} accent={accent} />
            <PremiumCard gradient={isLight ? [accent + '14', accent + '06'] : [accent + '18', accent + '08', '#0C0805']}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)', alignItems: 'center' }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 2, color: subColor, marginBottom: 6 }}>{t('vedicAstrology.tropikalny', 'TROPIKALNY')}</Text>
                  <Text style={{ fontSize: 22, fontWeight: '200', color: textColor, letterSpacing: -0.5 }}>{westernSign}</Text>
                  <Text style={{ fontSize: 11, color: subColor, marginTop: 4 }}>{t('vedicAstrology.zachodni_iau', 'Zachodni / IAU')}</Text>
                </View>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20, color: accent }}>→</Text>
                  <Text style={{ fontSize: 9, color: subColor, marginTop: 4 }}>−24°</Text>
                </View>
                <View style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: accent + '18', alignItems: 'center', borderWidth: 1, borderColor: accent + '44' }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 2, color: accent, marginBottom: 6 }}>{t('vedicAstrology.sydererycz', 'SYDERERYCZNY')}</Text>
                  <Text style={{ fontSize: 22, fontWeight: '200', color: accent, letterSpacing: -0.5 }}>{vedicSignData.polish.replace(' wedyjskie', '').replace(' wedyjska', '').replace(' wedyjski', '')}</Text>
                  <Text style={{ fontSize: 11, color: accent + 'BB', marginTop: 4 }}>{t('vedicAstrology.wedyjski_lahiri', 'Wedyjski / Lahiri')}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: subColor, marginTop: 14, lineHeight: 19 }}>
                {t('vedicAstrology.ayanamsa_23_9_to_precesja', 'Ayanamsa (~23,9°) to precesja punktu wiosennego od czasu Ptolemeusza. Znak wedyjski opisuje głębszy wzorzec karmiczny i wrodzone predyspozycje duszy.')}
              </Text>
            </PremiumCard>
          </Animated.View>

          {/* VEDIC SIGN PROFILE */}
          <Animated.View entering={FadeInDown.delay(120).duration(420)}>
            <SectionHeader label={`TWÓJ RASHI — ${vedicSign.toUpperCase()}`} accent={accent} />
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: accent + '1E', borderWidth: 1, borderColor: accent + '44', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22 }}>{vedicSignData.sanskrit}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>{vedicSignData.polish}</Text>
                  <Text style={{ fontSize: 12, color: accent }}>{vedicSign} · {vedicSignData.planet} · {vedicSignData.element}</Text>
                </View>
              </View>
              <InfoPill label={t('vedicAstrology.wladca_planety', 'Władca planety')} value={vedicSignData.planet} accent={accent} isLight={isLight} />
              <InfoPill label={t('vedicAstrology.zywiol', 'Żywioł')} value={vedicSignData.element} accent={accent} isLight={isLight} />
              <InfoPill label={t('vedicAstrology.jakosc', 'Jakość')} value={vedicSignData.quality} accent={accent} isLight={isLight} />
              <Text style={{ fontSize: 13, color: subColor, lineHeight: 20, marginTop: 12 }}>{vedicSignData.traits}</Text>
            </View>
          </Animated.View>

          {/* NAKSHATRA PROFILE */}
          <Animated.View entering={FadeInDown.delay(160).duration(420)}>
            <SectionHeader label={t('vedicAstrology.nakshatra_mansja_ksiezycowa', 'NAKSHATRA — MANSJA KSIĘŻYCOWA')} accent={accent} />
            <PremiumCard gradient={isLight ? ['#FEF3E8', '#FDE0C0'] : ['#1C1008', '#140C06']}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: accent + '22', borderWidth: 1.5, borderColor: accent + '66', alignItems: 'center', justifyContent: 'center' }}>
                  <Moon color={accent} size={26} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>{nakshatra.name}</Text>
                  <Text style={{ fontSize: 13, color: accent }}>{nakshatra.sanskrit}</Text>
                </View>
              </View>
              <InfoPill label={t('vedicAstrology.bostwo_devata', 'Bóstwo (Devata)')} value={nakshatra.deity} accent={accent} isLight={isLight} />
              <InfoPill label={t('vedicAstrology.symbol', 'Symbol')} value={nakshatra.symbol} accent={accent} isLight={isLight} />
              <InfoPill label={t('vedicAstrology.shakti_moc', 'Shakti (Moc)')} value={nakshatra.shakti} accent={accent} isLight={isLight} />
              <InfoPill label={t('vedicAstrology.natura', 'Natura')} value={nakshatra.nature} accent={accent} isLight={isLight} />
              <InfoPill label={t('vedicAstrology.wladca_planety_1', 'Władca planety')} value={nakshatra.planet} accent={accent} isLight={isLight} />
              <Text style={{ fontSize: 12, color: subColor, lineHeight: 19, marginTop: 14 }}>
                {t('vedicAstrology.nakshatra_to_konstelacj_w_ktorej', 'Nakshatra to konstelacja, w której znajdował się Księżyc w chwili Twoich urodzin. 27 Nakshatry opisuje emocjonalny instynkt, instynktowne reakcje i głęboki rytm wewnętrzny.')}
              </Text>
            </PremiumCard>
          </Animated.View>

          {/* DOSHAS */}
          <Animated.View entering={FadeInDown.delay(200).duration(420)}>
            <SectionHeader label={t('vedicAstrology.dosha_ajurwedyjs', 'DOSHA AJURWEDYJSKA')} accent={accent} />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {(['vata', 'pitta', 'kapha'] as const).map((d) => {
                const dd = DOSHA_DATA[d];
                const isActive = d === dominantDosha;
                return (
                  <View key={d} style={{ flex: 1, padding: 14, borderRadius: 16, borderWidth: 1.5,
                    backgroundColor: isActive ? dd.color + '1E' : cardBg,
                    borderColor: isActive ? dd.color + '66' : cardBorder }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: isActive ? dd.color : subColor, marginBottom: 2 }}>{dd.name}</Text>
                    <Text style={{ fontSize: 10, color: isActive ? dd.color + 'BB' : subColor + '88' }}>{dd.sanskrit}</Text>
                    {isActive && <View style={{ width: 24, height: 2, borderRadius: 1, backgroundColor: dd.color, marginTop: 8 }} />}
                  </View>
                );
              })}
            </View>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, marginBottom: 4 }}>{doshaData.name} dominuje w Tobie</Text>
              <Text style={{ fontSize: 12, color: accent, marginBottom: 12 }}>{doshaData.elements} · Sezon: {doshaData.seasons}</Text>
              <InfoPill label={t('vedicAstrology.cechy', 'Cechy')} value={doshaData.traits.slice(0, 28) + '…'} accent={accent} isLight={isLight} />
              <InfoPill label={t('vedicAstrology.nierownowa', 'Nierównowaga')} value={doshaData.imbalance.slice(0, 28) + '…'} accent={accent} isLight={isLight} />
              <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: accent + '10', borderWidth: 1, borderColor: accent + '28' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: accent, marginBottom: 6 }}>{t('vedicAstrology.wskazowka_ajurwedyjs', 'WSKAZÓWKA AJURWEDYJSKA')}</Text>
                <Text style={{ fontSize: 13, color: subColor, lineHeight: 20 }}>{doshaData.remedy}</Text>
              </View>
            </View>
          </Animated.View>

          {/* PLANETARY PERIODS (DASHA) */}
          <Animated.View entering={FadeInDown.delay(240).duration(420)}>
            <SectionHeader label={t('vedicAstrology.vimshottar_dasha_okresy_planetarne', 'VIMSHOTTARI DASHA — OKRESY PLANETARNE')} accent={accent} />
            <PremiumCard gradient={isLight ? [accent + '12', accent + '06'] : [DASHA_COLORS[dasha.mahadasha] + '18', '#0C0805']}>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <View style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: DASHA_COLORS[dasha.mahadasha] + '22', borderWidth: 1, borderColor: DASHA_COLORS[dasha.mahadasha] + '55', alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2, color: DASHA_COLORS[dasha.mahadasha], marginBottom: 6 }}>{t('vedicAstrology.mahadasha', 'MAHADASHA')}</Text>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: textColor }}>{dasha.mahadasha}</Text>
                  <Text style={{ fontSize: 11, color: DASHA_COLORS[dasha.mahadasha], marginTop: 4 }}>~{dasha.yearsLeft} lat zostało</Text>
                </View>
                <View style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2, color: subColor, marginBottom: 6 }}>{t('vedicAstrology.antardasha', 'ANTARDASHA')}</Text>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: textColor }}>{dasha.antardasha}</Text>
                  <Text style={{ fontSize: 11, color: subColor, marginTop: 4 }}>{t('vedicAstrology.pod_okres', 'Pod-okres')}</Text>
                </View>
              </View>
              <View style={{ padding: 12, borderRadius: 12, backgroundColor: DASHA_COLORS[dasha.mahadasha] + '14', borderWidth: 1, borderColor: DASHA_COLORS[dasha.mahadasha] + '30' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: DASHA_COLORS[dasha.mahadasha], marginBottom: 6 }}>{t('vedicAstrology.obszar_zycia_aktywowany', 'OBSZAR ŻYCIA AKTYWOWANY')}</Text>
                <Text style={{ fontSize: 14, color: textColor, fontWeight: '600' }}>{DASHA_LIFE[dasha.mahadasha] || 'Głęboka transformacja'}</Text>
              </View>
              <Text style={{ fontSize: 12, color: subColor, lineHeight: 19, marginTop: 14 }}>
                {t('vedicAstrology.system_vimshottar_obejmuje_120_lat', 'System Vimshottari obejmuje 120 lat i 9 planet. Każda planeta rządzi określonym obszarem duszy i życia. Mahadasha to dominujący temat dekady, Antardasha to subtelniejszy głos wewnątrz niej.')}
              </Text>
            </PremiumCard>

            {/* Dasha timeline strip */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8, gap: 8, paddingHorizontal: 2 }}>
              {DASHA_ORDER.map((planet) => (
                <View key={planet} style={{
                  paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
                  backgroundColor: planet === dasha.mahadasha ? DASHA_COLORS[planet] + '22' : cardBg,
                  borderWidth: 1,
                  borderColor: planet === dasha.mahadasha ? DASHA_COLORS[planet] + '66' : cardBorder,
                  alignItems: 'center', minWidth: 72,
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: planet === dasha.mahadasha ? DASHA_COLORS[planet] : subColor }}>{planet}</Text>
                  <Text style={{ fontSize: 10, color: planet === dasha.mahadasha ? DASHA_COLORS[planet] + 'BB' : subColor + '88', marginTop: 2 }}>{DASHA_YEARS[planet]}L</Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* RASHI ENCYCLOPEDIA */}
          <Animated.View entering={FadeInDown.delay(280).duration(420)}>
            <SectionHeader label={t('vedicAstrology.rashi_encykloped_wedyjskich_znakow', 'RASHI — ENCYKLOPEDIA WEDYJSKICH ZNAKÓW')} accent={accent} />
            {RASHI.map((r, i) => (
              <Animated.View key={r.name} entering={FadeInDown.delay(300 + i * 30).duration(360)}>
                <Pressable
                  onPress={() => setExpandedRashi(expandedRashi === i ? null : i)}
                  style={[styles.rashiRow, { borderColor: cardBorder, backgroundColor: expandedRashi === i ? accent + '0E' : cardBg }]}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: accent + '18', borderWidth: 1, borderColor: accent + '33', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 14 }}>{r.sanskrit}</Text>
                  </View>
                  <View style={{ flex: 1, paddingLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{r.name}</Text>
                    <Text style={{ fontSize: 11, color: subColor }}>{r.polish} · {r.planet}</Text>
                  </View>
                  <Text style={{ color: accent, fontSize: 16 }}>{expandedRashi === i ? '−' : '+'}</Text>
                </Pressable>
                {expandedRashi === i && (
                  <Animated.View entering={FadeInDown.duration(300)} style={[styles.rashiExpanded, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <InfoPill label={t('vedicAstrology.zywiol_1', 'Żywioł')} value={r.element} accent={accent} isLight={isLight} />
                    <InfoPill label={t('vedicAstrology.jakosc_1', 'Jakość')} value={r.quality} accent={accent} isLight={isLight} />
                    <InfoPill label={t('vedicAstrology.planeta', 'Planeta')} value={r.planet} accent={accent} isLight={isLight} />
                    <Text style={{ fontSize: 13, color: subColor, lineHeight: 19, marginTop: 10 }}>{r.traits}</Text>
                  </Animated.View>
                )}
              </Animated.View>
            ))}
          </Animated.View>

          {/* VEDIC REMEDIES */}
          <Animated.View entering={FadeInDown.delay(320).duration(420)}>
            <SectionHeader label={t('vedicAstrology.upayas_srodki_zaradcze_planet', 'UPAYAS — ŚRODKI ZARADCZE PLANET')} accent={accent} />
            <Text style={{ fontSize: 13, color: subColor, lineHeight: 20, marginBottom: 16 }}>
              {t('vedicAstrology.jyotish_oferuje_praktyczne_srodki_z', 'Jyotish oferuje praktyczne środki zaradcze (Upayas) dla każdej planety — kamienie, mantry, kolory i święte dni, które wzmacniają pozytywne energie i łagodzą trudne tranzycje.')}
            </Text>
            {PLANET_REMEDIES.map((p, i) => (
              <Animated.View key={p.planet} entering={FadeInDown.delay(340 + i * 25).duration(360)}>
                <Pressable
                  onPress={() => setExpandedRemedy(expandedRemedy === i ? null : i)}
                  style={[styles.rashiRow, { borderColor: cardBorder, backgroundColor: expandedRemedy === i ? p.color_hex + '12' : cardBg }]}>
                  <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: p.color_hex + '22', borderWidth: 1, borderColor: p.color_hex + '55', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 22, color: p.color_hex }}>{p.symbol}</Text>
                  </View>
                  <View style={{ flex: 1, paddingLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{p.planet}</Text>
                    <Text style={{ fontSize: 11, color: subColor }}>{p.gemstone} · {p.day}</Text>
                  </View>
                  <Text style={{ color: p.color_hex, fontSize: 16 }}>{expandedRemedy === i ? '−' : '+'}</Text>
                </Pressable>
                {expandedRemedy === i && (
                  <Animated.View entering={FadeInDown.duration(300)} style={[styles.rashiExpanded, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <InfoPill label={t('vedicAstrology.kamien', 'Kamień')} value={p.gemstone} accent={p.color_hex} isLight={isLight} />
                    <InfoPill label={t('vedicAstrology.mantra', 'Mantra')} value={p.mantra} accent={p.color_hex} isLight={isLight} />
                    <InfoPill label={t('vedicAstrology.kolor', 'Kolor')} value={p.color} accent={p.color_hex} isLight={isLight} />
                    <InfoPill label={t('vedicAstrology.swiety_dzien', 'Święty dzień')} value={p.day} accent={p.color_hex} isLight={isLight} />
                    <InfoPill label={t('vedicAstrology.chakra', 'Chakra')} value={p.chakra} accent={p.color_hex} isLight={isLight} />
                  </Animated.View>
                )}
              </Animated.View>
            ))}
          </Animated.View>

          {/* YOGA CALCULATOR */}
          <Animated.View entering={FadeInDown.delay(360).duration(420)}>
            <SectionHeader label={t('vedicAstrology.wedyjskie_jogi_szczegolne_kombinacj', 'WEDYJSKIE JOGI — SZCZEGÓLNE KOMBINACJE')} accent={accent} />
            <Text style={{ fontSize: 13, color: subColor, lineHeight: 20, marginBottom: 14 }}>
              {t('vedicAstrology.jogi_to_szczegolne_kombinacje_plane', 'Jogi to szczególne kombinacje planet w horoskopie urodzeniowym. Ich obecność wskazuje na specjalne dary, talenty lub wyzwania tego wcielenia.')}
            </Text>
            {yogas.map((yoga, i) => (
              <Animated.View key={yoga.name} entering={FadeInDown.delay(380 + i * 40).duration(360)}>
                <View style={[styles.card, {
                  backgroundColor: yoga.present ? accent + '10' : cardBg,
                  borderColor: yoga.present ? accent + '44' : cardBorder,
                  marginBottom: 10,
                }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: yoga.present ? accent + '22' : cardBg, borderWidth: 1, borderColor: yoga.present ? accent + '55' : cardBorder, alignItems: 'center', justifyContent: 'center' }}>
                      {yoga.present
                        ? <Sparkles color={accent} size={18} />
                        : <Text style={{ fontSize: 16, color: subColor }}>○</Text>
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: yoga.present ? textColor : subColor }}>{yoga.name}</Text>
                      <Text style={{ fontSize: 11, color: yoga.present ? accent : subColor + '88', fontWeight: '600' }}>
                        {yoga.present ? '✓ Obecna w Twoim horoskopie' : '○ Nie aktywna w tym układzie'}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: subColor, lineHeight: 18 }}>{yoga.desc}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* SACRED NUMBER */}
          <Animated.View entering={FadeInDown.delay(400).duration(420)}>
            <SectionHeader label={t('vedicAstrology.wedyjska_liczba_szczesliwa', 'WEDYJSKA LICZBA SZCZĘŚLIWA')} accent={accent} />
            <PremiumCard gradient={isLight ? [accent + '18', accent + '08'] : [accent + '20', '#0A0805']}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: accent + '22', borderWidth: 2, borderColor: accent + '66', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 36, fontWeight: '200', color: accent }}>{luckyNumber}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: 4 }}>{t('vedicAstrology.twoja_liczba_na_dzis', 'Twoja liczba na dziś')}</Text>
                  <Text style={{ fontSize: 13, color: subColor, lineHeight: 19 }}>
                    {t('vedicAstrology.wedyjska_kombinacja_twojej_daty_uro', 'Wedyjska kombinacja Twojej daty urodzenia z energią dzisiejszego dnia tworzy rezonans liczbowy. Używaj tej liczby w decyzjach, medytacjach i ofiarach.')}
                  </Text>
                </View>
              </View>
            </PremiumCard>
          </Animated.View>

          {/* AI VEDIC READING */}
          <Animated.View entering={FadeInDown.delay(440).duration(420)}>
            <SectionHeader label={t('vedicAstrology.odczyt_wedyjski_ai', 'ODCZYT WEDYJSKI AI')} accent={accent} />
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: accent + '1E', borderWidth: 1, borderColor: accent + '44', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye color={accent} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>{t('vedicAstrology.jyotish_oracle', 'Jyotish Oracle')}</Text>
                  <Text style={{ fontSize: 12, color: subColor }}>{t('vedicAstrology.personaliz_odczyt_z_perspektyw_jyot', 'Personalizowany odczyt z perspektywy Jyotish')}</Text>
                </View>
              </View>

              {aiReading ? (
                <Animated.View entering={FadeInDown.duration(400)}>
                  <Text style={{ fontSize: 15, color: isLight ? '#2A1F0E' : '#EDE6D8', lineHeight: 26, fontStyle: 'italic', marginBottom: 16 }}>
                    {aiReading}
                  </Text>
                  <Pressable
                    onPress={handleAiReading}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: accent + '44', backgroundColor: accent + '10' }}>
                    <Text style={{ fontSize: 13, color: accent, fontWeight: '600' }}>{t('vedicAstrology.nowy_odczyt', 'Nowy odczyt')}</Text>
                    <ArrowRight color={accent} size={14} />
                  </Pressable>
                </Animated.View>
              ) : (
                <Pressable
                  onPress={handleAiReading}
                  disabled={aiLoading}
                  style={{ alignItems: 'center', padding: 18, borderRadius: 16, borderWidth: 1.5, borderColor: accent + '44', borderStyle: 'dashed' }}>
                  {aiLoading
                    ? <><ActivityIndicator color={accent} /><Text style={{ color: subColor, fontSize: 13, marginTop: 10 }}>{t('vedicAstrology.gwiazdy_przemawiaj', 'Gwiazdy przemawiają…')}</Text></>
                    : <><Sparkles color={accent} size={28} style={{ marginBottom: 10 }} /><Text style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 6 }}>{t('vedicAstrology.popros_o_wedyjski_odczyt', 'Poproś o wedyjski odczyt')}</Text><Text style={{ fontSize: 12, color: subColor, textAlign: 'center', lineHeight: 18 }}>{t('vedicAstrology.ai_przeanaliz_twoj_rashi_nakshatre', 'AI przeanalizuje Twój Rashi, Nakshatrę i bieżącą Mahadashę i udzieli głębokiej wskazówki.')}</Text></>
                  }
                </Pressable>
              )}
            </View>
          </Animated.View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ── STYLES ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  headerSub: { fontSize: 9, fontWeight: '800', letterSpacing: 2.4, marginTop: 2 },
  scroll: { paddingHorizontal: 22, paddingTop: 4 },
  heroEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2.8, marginBottom: 6 },
  heroTitle: { fontSize: 38, fontWeight: '200', letterSpacing: -1.2, marginBottom: 10 },
  heroDesc: { fontSize: 13, lineHeight: 20, textAlign: 'center', paddingHorizontal: 16, marginBottom: 8 },
  card: {
    borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 6, overflow: 'hidden',
  },
  rashiRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 16, borderWidth: 1, marginBottom: 6,
  },
  rashiExpanded: {
    padding: 14, borderRadius: 14, borderWidth: 1,
    marginBottom: 8, marginTop: -2,
  },
});
