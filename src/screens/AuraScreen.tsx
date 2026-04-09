// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Dimensions, Image, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, Defs, RadialGradient as SvgRadialGradient, Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withSequence, withTiming, withDelay,
  Easing, FadeInDown,
  cancelAnimation,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Camera, ChevronLeft, Image as ImageIcon, Sparkles, Layers,
  Gem, ChevronDown, ChevronUp, Eye, Zap, CalendarDays,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';

const { width: SW } = Dimensions.get('window');
// ─── Warm Violet/Fuchsia/Rose color identity ─────────────────────────────────
const ACCENT = '#E879F9';
const ACCENT2 = '#C084FC';
const ACCENT3 = '#F0ABFC';
const HERO_H = 300;
const ORB_CENTER = HERO_H / 2 - 10;

// ─── AsyncStorage key for daily check-in log ──────────────────────────────────
const AURA_LOG_KEY = '@aura_daily_log';

// ─── Animated SVG circle component at module level ────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Aura color mapping by zodiac sign ────────────────────────────────────────
const ZODIAC_AURA: Record<string, { color: string; name: string; meaning: string; hex: string; gradient: readonly [string, string, string] }> = {
  Aries:       { color: 'Czerwona',            name: 'Czerwona',            meaning: 'Pasja i Wola',              hex: '#EF4444', gradient: ['#EF4444', '#DC2626', '#B91C1C'] },
  Baran:       { color: 'Czerwona',            name: 'Czerwona',            meaning: 'Pasja i Wola',              hex: '#EF4444', gradient: ['#EF4444', '#DC2626', '#B91C1C'] },
  Taurus:      { color: 'Zielona',             name: 'Zielona',             meaning: 'Uzdrowienie i Obfitość',    hex: '#22C55E', gradient: ['#22C55E', '#16A34A', '#15803D'] },
  Byk:         { color: 'Zielona',             name: 'Zielona',             meaning: 'Uzdrowienie i Obfitość',    hex: '#22C55E', gradient: ['#22C55E', '#16A34A', '#15803D'] },
  Gemini:      { color: 'Żółta',              name: 'Żółta',              meaning: 'Intelekt i Komunikacja',    hex: '#EAB308', gradient: ['#EAB308', '#CA8A04', '#A16207'] },
  Bliźnięta:  { color: 'Żółta',              name: 'Żółta',              meaning: 'Intelekt i Komunikacja',    hex: '#EAB308', gradient: ['#EAB308', '#CA8A04', '#A16207'] },
  Cancer:      { color: 'Srebrna',             name: 'Srebrna',             meaning: 'Intuicja i Ochrona',        hex: '#94A3B8', gradient: ['#CBD5E1', '#94A3B8', '#64748B'] },
  Rak:         { color: 'Srebrna',             name: 'Srebrna',             meaning: 'Intuicja i Ochrona',        hex: '#94A3B8', gradient: ['#CBD5E1', '#94A3B8', '#64748B'] },
  Leo:         { color: 'Złota',              name: 'Złota',              meaning: 'Kreacja i Ekspresja',       hex: '#F59E0B', gradient: ['#FBBF24', '#F59E0B', '#D97706'] },
  Lew:         { color: 'Złota',              name: 'Złota',              meaning: 'Kreacja i Ekspresja',       hex: '#F59E0B', gradient: ['#FBBF24', '#F59E0B', '#D97706'] },
  Virgo:       { color: 'Szmaragdowa',         name: 'Szmaragdowa',         meaning: 'Czystość i Analiza',        hex: '#10B981', gradient: ['#34D399', '#10B981', '#059669'] },
  Panna:       { color: 'Szmaragdowa',         name: 'Szmaragdowa',         meaning: 'Czystość i Analiza',        hex: '#10B981', gradient: ['#34D399', '#10B981', '#059669'] },
  Libra:       { color: 'Różowa',             name: 'Różowa',             meaning: 'Miłość i Harmonia',         hex: '#EC4899', gradient: ['#F472B6', '#EC4899', '#DB2777'] },
  Waga:        { color: 'Różowa',             name: 'Różowa',             meaning: 'Miłość i Harmonia',         hex: '#EC4899', gradient: ['#F472B6', '#EC4899', '#DB2777'] },
  Scorpio:     { color: 'Głęboka Fioletowa',   name: 'Głęboka Fioletowa',   meaning: 'Transformacja i Moc',       hex: '#7C3AED', gradient: ['#A855F7', '#7C3AED', '#5B21B6'] },
  Skorpion:    { color: 'Głęboka Fioletowa',   name: 'Głęboka Fioletowa',   meaning: 'Transformacja i Moc',       hex: '#7C3AED', gradient: ['#A855F7', '#7C3AED', '#5B21B6'] },
  Sagittarius: { color: 'Niebieska',           name: 'Niebieska',           meaning: 'Mądrość i Wolność',         hex: '#3B82F6', gradient: ['#60A5FA', '#3B82F6', '#2563EB'] },
  Strzelec:    { color: 'Niebieska',           name: 'Niebieska',           meaning: 'Mądrość i Wolność',         hex: '#3B82F6', gradient: ['#60A5FA', '#3B82F6', '#2563EB'] },
  Capricorn:   { color: 'Brązowo-Złota',       name: 'Brązowo-Złota',       meaning: 'Stabilność i Struktura',    hex: '#92400E', gradient: ['#B45309', '#92400E', '#78350F'] },
  Koziorożec:  { color: 'Brązowo-Złota',       name: 'Brązowo-Złota',       meaning: 'Stabilność i Struktura',    hex: '#92400E', gradient: ['#B45309', '#92400E', '#78350F'] },
  Aquarius:    { color: 'Elektryczna Niebieska', name: 'Elektryczna Niebieska', meaning: 'Wizja i Rewolucja',     hex: '#06B6D4', gradient: ['#22D3EE', '#06B6D4', '#0891B2'] },
  Wodnik:      { color: 'Elektryczna Niebieska', name: 'Elektryczna Niebieska', meaning: 'Wizja i Rewolucja',     hex: '#06B6D4', gradient: ['#22D3EE', '#06B6D4', '#0891B2'] },
  Pisces:      { color: 'Lawendowa',           name: 'Lawendowa',           meaning: 'Duchowość i Empatia',       hex: '#A78BFA', gradient: ['#C4B5FD', '#A78BFA', '#8B5CF6'] },
  Ryby:        { color: 'Lawendowa',           name: 'Lawendowa',           meaning: 'Duchowość i Empatia',       hex: '#A78BFA', gradient: ['#C4B5FD', '#A78BFA', '#8B5CF6'] },
};

const DEFAULT_AURA = { color: 'Fioletowa', name: 'Fioletowa', meaning: 'Intuicja i Duchowość', hex: '#A855F7', gradient: ['#C084FC', '#A855F7', '#7C3AED'] };

// ─── Aura ring data — warm violet/rose spectrum ───────────────────────────────
const AURA_RINGS = [
  { r: 56,  color: '#E879F9', opacity: 0.60, period: 3000, delay: 0,    dir: 1,  rotatePeriod: 20000 },
  { r: 72,  color: '#C084FC', opacity: 0.48, period: 4200, delay: 500,  dir: -1, rotatePeriod: 30000 },
  { r: 88,  color: '#F0ABFC', opacity: 0.40, period: 5500, delay: 1000, dir: 1,  rotatePeriod: 45000 },
  { r: 104, color: '#F9A8D4', opacity: 0.30, period: 6500, delay: 1600, dir: -1, rotatePeriod: 55000 },
  { r: 120, color: '#D946EF', opacity: 0.22, period: 7800, delay: 2200, dir: 1,  rotatePeriod: 65000 },
];

// ─── Daily check-in aura colors ───────────────────────────────────────────────
const CHECKIN_COLORS = [
  { hex: '#EF4444', name: 'Czerwona'    },
  { hex: '#F97316', name: 'Pomarańczowa'},
  { hex: '#EAB308', name: 'Żółta'      },
  { hex: '#22C55E', name: 'Zielona'    },
  { hex: '#2DD4BF', name: 'Turkusowa'  },
  { hex: '#3B82F6', name: 'Niebieska'  },
  { hex: '#8B5CF6', name: 'Fioletowa'  },
  { hex: '#EC4899', name: 'Różowa'     },
  { hex: '#F8F8FF', name: 'Biała'      },
  { hex: '#FBBF24', name: 'Złota'      },
  { hex: '#A78BFA', name: 'Lawendowa'  },
  { hex: '#1E293B', name: 'Czarna'     },
];

// ─── Color guide data ──────────────────────────────────────────────────────────
const COLOR_GUIDE = [
  { color: '#EF4444', name: 'Czerwona',   keywords: ['Pasja', 'Wola', 'Energia'],        gradient: ['#EF4444', '#DC2626'] as const },
  { color: '#F97316', name: 'Pomarańczowa', keywords: ['Kreatywność', 'Radość', 'Płodność'], gradient: ['#F97316', '#EA580C'] as const },
  { color: '#EAB308', name: 'Żółta',      keywords: ['Intelekt', 'Optymizm', 'Pewność'], gradient: ['#EAB308', '#CA8A04'] as const },
  { color: '#22C55E', name: 'Zielona',    keywords: ['Uzdrowienie', 'Miłość', 'Wzrost'], gradient: ['#22C55E', '#16A34A'] as const },
  { color: '#3B82F6', name: 'Niebieska',  keywords: ['Spokój', 'Prawda', 'Komunikacja'], gradient: ['#3B82F6', '#2563EB'] as const },
  { color: '#8B5CF6', name: 'Fioletowa',  keywords: ['Intuicja', 'Mądrość', 'Duchowość'], gradient: ['#8B5CF6', '#7C3AED'] as const },
  { color: '#EC4899', name: 'Różowa',     keywords: ['Miłość', 'Czułość', 'Harmonia'],  gradient: ['#EC4899', '#DB2777'] as const },
  { color: '#F8F8FF', name: 'Biała',      keywords: ['Czystość', 'Ochrona', 'Przebudzenie'], gradient: ['#F8F8FF', '#E2E8F0'] as const },
  { color: '#FBBF24', name: 'Złota',      keywords: ['Mądrość', 'Boskość', 'Sukces'],   gradient: ['#FBBF24', '#D97706'] as const },
  { color: '#67E8F9', name: 'Turkusowa',  keywords: ['Uzdrowienie', 'Kreatywność', 'Spokój'], gradient: ['#67E8F9', '#22D3EE'] as const },
  { color: '#A78BFA', name: 'Lawendowa',  keywords: ['Empatia', 'Wrażliwość', 'Mistycyzm'], gradient: ['#A78BFA', '#8B5CF6'] as const },
  { color: '#1E293B', name: 'Czarna',     keywords: ['Ochrona', 'Granica', 'Moc'],      gradient: ['#334155', '#1E293B'] as const },
];

// ─── Aura layers ───────────────────────────────────────────────────────────────
const AURA_LAYERS = [
  {
    n: 1, title: 'Warstwa Eteryczna', sub: '1–5 cm od ciała',
    color: '#94A3B8', icon: '🔲',
    desc: 'Najbliżej ciała fizycznego, odzwierciedla zdrowie i witalność. Pierwsza warstwa reaguje natychmiast na zmęczenie, chorobę lub pełnię energii. Jej intensywność ujawnia stan Twojego ciała fizycznego.',
    colors: 'Bladoniebieska, szara, srebrna',
    strengthen: 'Ruch fizyczny, kontakt z ziemią, głęboki oddech i joga wzmacniają tę warstwę.',
  },
  {
    n: 2, title: 'Warstwa Emocjonalna', sub: 'do 7 cm od ciała',
    color: '#FB923C', icon: '💫',
    desc: 'Centrum uczuć — zmienia kolory z każdą emocją. Jasna i klarowna przy radości i spokoju, chaotyczna i pociemniała przy lęku, gniewie lub smutku.',
    colors: 'Wszystkie kolory tęczy, zmienna dynamicznie',
    strengthen: 'Dziennik emocji, terapia, ceremonial uwalniania i świadome przeżywanie uczuć.',
  },
  {
    n: 3, title: 'Warstwa Mentalna', sub: 'do 20 cm od ciała',
    color: '#EAB308', icon: '☀️',
    desc: 'Myśli i przekonania tworzą tę warstwę. Żółto-złota u osób o intensywnym życiu intelektualnym, szara lub burzowa przy negatywnym wewnętrznym dialogu.',
    colors: 'Żółta, złota, intensywność zależna od jakości myśli',
    strengthen: 'Medytacja, afirmacje i świadoma praca z przekonaniami kształtują tę warstwę.',
  },
  {
    n: 4, title: 'Warstwa Astralna', sub: 'do 30 cm od ciała',
    color: '#EC4899', icon: '💗',
    desc: 'Most między wymiarem fizycznym a duchowym. Centrum miłości — różowo-zielona u osób otwartych sercowo. Tu kształtują się więzi z innymi ludźmi i naturą.',
    colors: 'Różowa, zielona, złota przy miłości i głębokich więziach',
    strengthen: 'Miłość własna, autentyczne relacje, kąpiele energetyczne i medytacje sercowe.',
  },
  {
    n: 5, title: 'Eteryczny Szablon', sub: 'do 45 cm od ciała',
    color: '#3B82F6', icon: '🔵',
    desc: 'Przechowuje wzorzec pełni i prawdy o tym, kim jesteś. Niebiesko-biała, często z geometrycznymi wzorami. Zawiera "negatyw" Twojego zdrowia i przeznaczenia.',
    colors: 'Niebieska, biała, geometryczne wzory świetlne',
    strengthen: 'Śpiew, mantra, dźwiękoterpia i ceremonialne rytuały oczyszczają tę warstwę.',
  },
  {
    n: 6, title: 'Warstwa Niebiańska', sub: 'do 60 cm od ciała',
    color: '#C084FC', icon: '🌙',
    desc: 'Warstwa duchowej ekstazy i oświecenia. Przejrzysta i opalizująca — pojawia się w głębokiej medytacji lub modlitwie. Tu odbija się połączenie z wyższą jaźnią.',
    colors: 'Opalizująca, perłowo-fioletowa, złoto-biała',
    strengthen: 'Głęboka medytacja, kontemplacja i praca z wyrocznią otwierają tę warstwę.',
  },
  {
    n: 7, title: 'Warstwa Ketheric', sub: 'do 90 cm od ciała',
    color: '#F59E0B', icon: '✦',
    desc: 'Najbardziej zewnętrzna warstwa — złoto-biała i złożona z ultrawysokiej wibracji. Zawiera całą historię duszy przez wszystkie wcielenia i połączenie z kosmicznym planem.',
    colors: 'Złoto-biała, kosmos w miniaturze',
    strengthen: 'Praca z akasza kronikami, wzniosłe intencje i głęboka służba innym.',
  },
];

// ─── Care practices ────────────────────────────────────────────────────────────
const CARE_PRACTICES = [
  {
    icon: '🧘', title: 'Medytacja białego światła',
    desc: 'Wizualizacja białego i złotego światła przenikającego przez wszystkie warstwy aury usuwa gęste energie i ładuje pole witalnością.',
    targetScreen: 'Meditation',
  },
  {
    icon: '💎', title: 'Kryształy uzdrawiające',
    desc: 'Selenit oczyszcza, kwarc górski amplifikuje, ametyst chroni. Ułóż je wokół siebie lub noś przy sobie przez cały dzień.',
    targetScreen: 'CrystalGuide',
  },
  {
    icon: '🧂', title: 'Kąpiel solna',
    desc: 'Sól morska lub himalajska w kąpieli absorbuje negatywne energie z pola auretycznego. Dodaj olejek lawendowy i intencję uwalniania.',
    targetScreen: 'SaltBath',
  },
  {
    icon: '🌿', title: 'Smudging ziołowy',
    desc: 'Dym szałwii, palo santo lub kadzidła oczyszcza aurę mechanicznie — przesuń dym powoli wzdłuż całego ciała od stóp do głowy.',
    targetScreen: 'Cleansing',
  },
  {
    icon: '🎵', title: 'Terapia dźwiękiem',
    desc: 'Misy tybetańskie, gongi i binaural beats na 432 Hz rozbijają gęste wzorce energetyczne i harmonizują wszystkie 7 warstw aury.',
    targetScreen: 'SoundBath',
  },
  {
    icon: '🌅', title: 'Kontakt z naturą',
    desc: 'Chodzenie boso po trawie (earthing) bezpośrednio ładuje eteryczną warstwę aury jonami ujemnymi z powierzchni Ziemi.',
    targetScreen: 'Portal',
  },
];

// ─── AI section icons ──────────────────────────────────────────────────────────
const AI_SECTION_ICONS = ['🎨', '🌊', '✨', '💌', '🌟'];
const AI_SECTION_TITLES = [
  'Główny kolor aury',
  'Warstwy energetyczne',
  'Obszary uzdrowienia',
  'Wiadomość duchowa',
  'Praktyki wzmacniające',
];

// ─── AuraOrb component ─────────────────────────────────────────────────────────
// Each shared value declared individually at top level to comply with Rules of Hooks
const AuraOrb = React.memo(({ auraData, initials }: { auraData: typeof DEFAULT_AURA; initials: string }) => {
  // 5 independent scale shared values — one per ring (fixed count, no hooks in loops)
  const scale0 = useSharedValue(1);
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const scale4 = useSharedValue(1);
  const centerPulse = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  // Grouped as stable array refs (not hooks — just references after declaration)
  const scaleRefs = [scale0, scale1, scale2, scale3, scale4];

  useEffect(() => {
    AURA_RINGS.forEach((ring, i) => {
      scaleRefs[i].value = withDelay(
        ring.delay,
        withRepeat(
          withSequence(
            withTiming(1.06, { duration: ring.period, easing: Easing.inOut(Easing.sin) }),
            withTiming(0.94, { duration: ring.period, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false,
        ),
      );
    });
    centerPulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.93, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2500 }),
        withTiming(0.3, { duration: 2500 }),
      ),
      -1,
      false,
    );

    return () => {
      scaleRefs.forEach(sv => cancelAnimation(sv));
      cancelAnimation(centerPulse);
      cancelAnimation(glowOpacity);
    };
  }, []);

  // useAnimatedProps declared individually (Rules of Hooks: no hooks in loops)
  const ringProps0 = useAnimatedProps(() => ({ r: AURA_RINGS[0].r * scale0.value, opacity: AURA_RINGS[0].opacity }));
  const ringProps1 = useAnimatedProps(() => ({ r: AURA_RINGS[1].r * scale1.value, opacity: AURA_RINGS[1].opacity }));
  const ringProps2 = useAnimatedProps(() => ({ r: AURA_RINGS[2].r * scale2.value, opacity: AURA_RINGS[2].opacity }));
  const ringProps3 = useAnimatedProps(() => ({ r: AURA_RINGS[3].r * scale3.value, opacity: AURA_RINGS[3].opacity }));
  const ringProps4 = useAnimatedProps(() => ({ r: AURA_RINGS[4].r * scale4.value, opacity: AURA_RINGS[4].opacity }));
  const allRingProps = [ringProps0, ringProps1, ringProps2, ringProps3, ringProps4];

  const centerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: centerPulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={s.orbContainer}>
      {/* Radial glow — animated wrapper div, not SVG (rendering-animate-svg-wrapper) */}
      <Animated.View style={[s.orbGlow, glowStyle, { backgroundColor: auraData.hex + '44' }]} />

      <Svg width={SW} height={HERO_H} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgRadialGradient id="radGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={auraData.hex} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={auraData.hex} stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        {/* Background glow circle */}
        <Circle
          cx={SW / 2}
          cy={ORB_CENTER}
          r={130}
          fill="url(#radGlow)"
        />
        {/* 5 aura rings — rendered individually to pair with individual animatedProps */}
        {AURA_RINGS.map((ring, i) => (
          <AnimatedCircle
            key={`ring-${i}`}
            cx={SW / 2}
            cy={ORB_CENTER}
            r={ring.r}
            stroke={ring.color}
            strokeWidth={i === 0 ? 2.5 : i === 1 ? 2 : 1.5}
            fill="none"
            animatedProps={allRingProps[i]}
          />
        ))}
      </Svg>

      {/* Central orb */}
      <View style={s.orbCenterWrapper}>
        <Animated.View style={centerStyle}>
          <LinearGradient
            colors={auraData.gradient}
            style={s.orbCenter}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={s.orbInitials}>{initials || '✦'}</Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
});

// ─── ColorGuideCard ────────────────────────────────────────────────────────────
const ColorGuideCard = React.memo(({ item }: { item: typeof COLOR_GUIDE[0] }) => {
  const dotPulse = useSharedValue(1);

  useEffect(() => {
    dotPulse.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 1200 }),
        withTiming(0.85, { duration: 1200 }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(dotPulse);
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotPulse.value }],
  }));

  return (
    <View style={s.colorCard}>
      <LinearGradient colors={[item.gradient[0], item.gradient[1]]} style={s.colorCardBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {/* Animated color dot */}
        <Animated.View style={[s.colorDot, dotStyle, { backgroundColor: item.color, borderColor: '#fff4', borderWidth: 1.5 }]} />
        <Text style={s.colorCardName}>{item.name}</Text>
        <View style={s.colorCardTags}>
          {item.keywords.map(kw => (
            <View key={kw} style={s.colorTag}>
              <Text style={s.colorTagText}>{kw}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
});

// ─── LayerAccordion ────────────────────────────────────────────────────────────
const LayerAccordion = React.memo(({ layer }: { layer: typeof AURA_LAYERS[0] }) => {
  const [open, setOpen] = useState(false);

  const handlePress = useCallback(() => {
    HapticsService.impact('light');
    setOpen(v => !v);
  }, []);

  return (
    <Animated.View entering={FadeInDown.delay(layer.n * 60).springify()}>
      <Pressable style={s.layerCard} onPress={handlePress}>
        <View style={s.layerHeader}>
          <View style={[s.layerDot, { backgroundColor: layer.color + '33', borderColor: layer.color }]}>
            <Text style={{ fontSize: 16 }}>{layer.icon}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.layerTitle}>{layer.title}</Text>
            <Text style={s.layerSub}>{layer.sub}</Text>
          </View>
          <View style={[s.layerNumBadge, { backgroundColor: layer.color + '22' }]}>
            <Text style={[s.layerNum, { color: layer.color }]}>{layer.n}</Text>
          </View>
          {open ? <ChevronUp size={16} color="#E879F9" /> : <ChevronDown size={16} color="#C084FC" />}
        </View>
        {open && (
          <View style={s.layerBody}>
            <Text style={s.layerDesc}>{layer.desc}</Text>
            <View style={s.layerMeta}>
              <Text style={s.layerMetaLabel}>🎨 Kolory:</Text>
              <Text style={s.layerMetaValue}>{layer.colors}</Text>
            </View>
            <View style={s.layerMeta}>
              <Text style={s.layerMetaLabel}>💪 Wzmocnij:</Text>
              <Text style={s.layerMetaValue}>{layer.strengthen}</Text>
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
type Props = { navigation: any };

export const AuraScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const themeName = useAppStore(s => s.themeName);
  const theme = getResolvedTheme(themeName);
  const isLight = theme.background.startsWith('#F');

  const userData = useAppStore(s => s.userData);
  const zodiacSign = userData?.zodiacSign ?? '';
  const auraData = ZODIAC_AURA[zodiacSign] ?? DEFAULT_AURA;

  // Derive initials from display name or email
  const displayName = userData?.displayName ?? '';
  const initials = displayName
    ? displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '✦';

  // Camera / gallery state
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiSections, setAiSections] = useState<string[]>([]);

  // Daily check-in state: { 'YYYY-MM-DD': { hex, name } }
  const [auraLog, setAuraLog] = useState<Record<string, { hex: string; name: string }>>({});
  const [todayCheckin, setTodayCheckin] = useState<string | null>(null); // hex of today's selection

  // Load persisted log on mount
  useEffect(() => {
    AsyncStorage.getItem(AURA_LOG_KEY).then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setAuraLog(parsed);
          const today = new Date().toISOString().slice(0, 10);
          if (parsed[today]) setTodayCheckin(parsed[today].hex);
        } catch {}
      }
    });
  }, []);

  const handleCheckin = useCallback(async (colorItem: typeof CHECKIN_COLORS[0]) => {
    HapticsService.impact('medium');
    const today = new Date().toISOString().slice(0, 10);
    const updated = { ...auraLog, [today]: { hex: colorItem.hex, name: colorItem.name } };
    setAuraLog(updated);
    setTodayCheckin(colorItem.hex);
    await AsyncStorage.setItem(AURA_LOG_KEY, JSON.stringify(updated));
  }, [auraLog]);

  // Last 7 days log for history section
  const last7Days = (() => {
    const days: Array<{ date: string; label: string; entry: { hex: string; name: string } | null }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
      const label = i === 0 ? 'Dziś' : dayNames[d.getDay()];
      days.push({ date: key, label, entry: auraLog[key] ?? null });
    }
    return days;
  })();

  // Loading aura pulse for AI analysis
  const loadingPulse = useSharedValue(0.85);
  const loadingRotate = useSharedValue(0);

  useEffect(() => {
    if (aiLoading) {
      loadingPulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 700 }),
          withTiming(0.85, { duration: 700 }),
        ),
        -1,
        false,
      );
      loadingRotate.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(loadingPulse);
      cancelAnimation(loadingRotate);
      loadingPulse.value = withTiming(1);
    }
  }, [aiLoading]);

  const loadingPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: loadingPulse.value }],
  }));

  // ─── Image picker handlers ─────────────────────────────────────────────────
  const handleCamera = useCallback(async () => {
    HapticsService.impact('medium');
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        t('aura.permDenied', 'Brak uprawnień'),
        t('aura.cameraPermMsg', 'Zezwól na dostęp do kamery w ustawieniach.'),
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setAiResult(null);
      setAiSections([]);
    }
  }, [t]);

  const handleGallery = useCallback(async () => {
    HapticsService.impact('medium');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        t('aura.permDenied', 'Brak uprawnień'),
        t('aura.galleryPermMsg', 'Zezwól na dostęp do galerii w ustawieniach.'),
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setAiResult(null);
      setAiSections([]);
    }
  }, [t]);

  const handleReadAura = useCallback(async () => {
    if (!photoUri) return;
    HapticsService.notify();
    setAiLoading(true);
    try {
      const prompt = `Jesteś mistycznym czytelnikiem aury z wieloletnią praktyką. Użytkownik przesłał swoje zdjęcie do odczytu aury. Na podstawie energii, symboliki i duchowej intuicji, opisz:
1. Główny kolor aury i jego znaczenie
2. Warstwy aury (fizyczna, emocjonalna, mentalna, astralna, etheryczna)
3. Obszary silnej energii i obszary wymagające uzdrowienia
4. Wiadomość duchowa na dziś
5. Praktyki wzmacniające aurę

Odpowiedź sformułuj poetycko, mistycznie i inspirująco. Mów bezpośrednio do użytkownika (Twoja aura...). Każdą z 5 sekcji oddziel dokładnie podwójną nową linią i zacznij ją od numeru (1., 2., itd.).`;

      const response = await AiService.chatWithOracle([
        { role: 'user', content: prompt },
      ], 'pl');

      if (response) {
        setAiResult(response);
        // Split into sections by numbered headings
        const parts = response.split(/\n\n(?=\d\.)/);
        setAiSections(parts.length >= 2 ? parts : [response]);
      }
    } catch (e) {
      Alert.alert(
        t('aura.aiError', 'Błąd odczytu'),
        t('aura.aiErrorMsg', 'Nie udało się odczytać aury. Spróbuj ponownie.'),
      );
    } finally {
      setAiLoading(false);
    }
  }, [photoUri, t]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      {/* Warm violet-to-deep-rose aura background */}
      <LinearGradient
        colors={['#1A0A2E', '#2D1054', '#1A0A2E']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top > 0 ? 0 : 8 }]}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={s.backBtn} hitSlop={10}>
          <ChevronLeft size={24} color="#E879F9" />
        </Pressable>
        <Text style={s.headerTitle}>{t('aura.title', 'Aura')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── SECTION 1: Hero Living Aura ─────────────────────────────────── */}
        <View style={s.heroContainer}>
          <AuraOrb auraData={auraData} initials={initials} />
          {/* Hero text */}
          <View style={s.heroText}>
            <Text style={s.heroEyebrow}>{t('aura.yourAura', 'TWOJA AURA')}</Text>
            <LinearGradient
              colors={auraData.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.heroColorBadge}
            >
              <Text style={s.heroColorName}>{auraData.name}</Text>
            </LinearGradient>
            <Text style={s.heroMeaning}>{auraData.meaning}</Text>
          </View>
        </View>

        {/* ── SECTION A: Daily Check-In ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={{ paddingHorizontal: layout.padding.screen }}>
          <View style={s.sectionHeader}>
            <CalendarDays size={18} color={ACCENT} />
            <View style={{ flex: 1 }}>
              <Text style={s.sectionEyebrow}>CODZIENNY CHECK-IN</Text>
              <Text style={s.sectionTitle}>Kolor Twojej Aury Dziś</Text>
            </View>
          </View>
          <Text style={s.sectionDesc}>
            Wybierz kolor, który najlepiej oddaje Twoją dzisiejszą energię — intuicyjnie, bez zastanowienia. Buduj świadomość swojej aury każdego dnia.
          </Text>

          <View style={s.checkinCard}>
            <LinearGradient
              colors={['rgba(232,121,249,0.08)', 'rgba(192,132,252,0.04)']}
              style={s.checkinCardInner}
            >
              <View style={s.checkinGrid}>
                {CHECKIN_COLORS.map(colorItem => {
                  const isSelected = todayCheckin === colorItem.hex;
                  return (
                    <Pressable
                      key={colorItem.hex}
                      style={s.checkinColorItem}
                      onPress={() => handleCheckin(colorItem)}
                    >
                      <View style={[
                        s.checkinCircleWrap,
                        isSelected && { borderColor: ACCENT, borderWidth: 2.5 },
                      ]}>
                        <View style={[
                          s.checkinCircle,
                          { backgroundColor: colorItem.hex },
                          colorItem.hex === '#F8F8FF' && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
                          colorItem.hex === '#1E293B' && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
                          isSelected && {
                            shadowColor: colorItem.hex,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.9,
                            shadowRadius: 8,
                            elevation: 8,
                          },
                        ]} />
                        {isSelected && (
                          <View style={s.checkinSelectedRing} />
                        )}
                      </View>
                      <Text style={[s.checkinColorName, isSelected && { color: ACCENT, fontWeight: '700' }]}>
                        {colorItem.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* ── SECTION B: Weekly Aura Log ───────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={{ paddingHorizontal: layout.padding.screen }}>
          <View style={s.sectionHeader}>
            <CalendarDays size={18} color={ACCENT3} />
            <Text style={s.sectionTitle}>Historia tygodnia</Text>
          </View>
          <Text style={s.sectionDesc}>
            Śledź wzorce energetyczne swojej aury przez ostatnie 7 dni. Powtarzające się kolory ujawniają dominujący stan Twojego pola.
          </Text>

          <View style={s.weekCard}>
            <LinearGradient
              colors={['rgba(192,132,252,0.08)', 'rgba(232,121,249,0.04)']}
              style={s.weekCardInner}
            >
              <View style={s.weekRow}>
                {last7Days.map(day => (
                  <View key={day.date} style={s.weekDayCol}>
                    <View style={[
                      s.weekCircle,
                      day.entry
                        ? { backgroundColor: day.entry.hex, borderColor: day.entry.hex + '88', borderWidth: 1.5 }
                        : { backgroundColor: 'transparent', borderColor: 'rgba(192,132,252,0.40)', borderWidth: 1.5, borderStyle: 'dashed' },
                    ]} />
                    <Text style={s.weekDayLabel}>{day.label}</Text>
                  </View>
                ))}
              </View>

              {todayCheckin && (() => {
                const todayEntry = last7Days.find(d => d.label === 'Dziś')?.entry;
                return todayEntry ? (
                  <View style={s.todayBanner}>
                    <Text style={s.todayBannerText}>Dzisiejsza aura: </Text>
                    <Text style={[s.todayBannerName, { color: todayEntry.hex }]}>{todayEntry.name}</Text>
                    <View style={[s.todayDot, { backgroundColor: todayEntry.hex }]} />
                  </View>
                ) : null;
              })()}
            </LinearGradient>
          </View>
        </Animated.View>

        {/* ── SECTION 2: Camera / Gallery Reading ─────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ paddingHorizontal: layout.padding.screen }}>
          <View style={s.sectionHeader}>
            <Eye size={18} color={ACCENT} />
            <Text style={s.sectionTitle}>{t('aura.readSection', 'Odczyt Aury AI')}</Text>
          </View>
          <Text style={s.sectionDesc}>
            Sztuczna inteligencja analizuje zdjęcie i odczytuje kolory, warstwy oraz energetyczny przekaz Twojej aury — mistycznie i precyzyjnie.
          </Text>

          <View style={s.cameraCard}>
            <LinearGradient
              colors={['rgba(232,121,249,0.08)', 'rgba(192,132,252,0.04)']}
              style={s.cameraCardInner}
            >
              <Text style={s.cameraCardDesc}>
                {t('aura.cameraDesc', 'Zrób zdjęcie lub wgraj fotografię, aby uzyskać mistyczny odczyt swojej aury przez AI.')}
              </Text>

              <View style={s.cameraButtons}>
                {/* Camera button */}
                <Pressable onPress={handleCamera} style={s.cameraBtn}>
                  <LinearGradient
                    colors={['#7C3AED', '#4F46E5']}
                    style={s.cameraBtnInner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Camera size={22} color="#fff" />
                    <Text style={s.cameraBtnText}>{t('aura.takePicture', 'Zrób zdjęcie')}</Text>
                  </LinearGradient>
                </Pressable>

                {/* Gallery button */}
                <Pressable onPress={handleGallery} style={s.cameraBtn}>
                  <View style={s.galleryBtnInner}>
                    <ImageIcon size={22} color={ACCENT} />
                    <Text style={s.galleryBtnText}>{t('aura.fromGallery', 'Wgraj z galerii')}</Text>
                  </View>
                </Pressable>
              </View>

              {/* Image preview */}
              {photoUri && (
                <Animated.View entering={FadeInDown.springify()} style={s.previewWrap}>
                  <Image source={{ uri: photoUri }} style={s.previewImage} resizeMode="cover" />
                  <View style={s.previewOverlay}>
                    <Pressable
                      onPress={handleReadAura}
                      disabled={aiLoading}
                      style={({ pressed }) => [s.readAuraBtn, pressed && { opacity: 0.85 }]}
                    >
                      <LinearGradient
                        colors={['#F59E0B', '#D97706', '#B45309']}
                        style={s.readAuraBtnInner}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        {aiLoading ? (
                          <Animated.View style={loadingPulseStyle}>
                            <Sparkles size={20} color="#fff" />
                          </Animated.View>
                        ) : (
                          <Sparkles size={20} color="#fff" />
                        )}
                        <Text style={s.readAuraBtnText}>
                          {aiLoading
                            ? t('aura.reading', 'Odczytuję aurę...')
                            : t('aura.readBtn', 'Odczytaj aurę AI ✦')}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </Animated.View>
              )}

              {/* AI Result */}
              {aiSections.length > 0 && (
                <Animated.View entering={FadeInDown.springify()} style={s.aiResultWrap}>
                  <Text style={s.aiResultTitle}>{t('aura.aiReadingTitle', '✦ Twój odczyt aury ✦')}</Text>
                  {aiSections.map((section, idx) => (
                    <View key={idx} style={s.aiSection}>
                      <View style={s.aiSectionHeader}>
                        <Text style={s.aiSectionIcon}>{AI_SECTION_ICONS[idx] ?? '✨'}</Text>
                        <Text style={s.aiSectionTitle}>{AI_SECTION_TITLES[idx] ?? `Sekcja ${idx + 1}`}</Text>
                      </View>
                      <Text style={s.aiSectionText}>{section.replace(/^\d+\.\s*/, '').trim()}</Text>
                    </View>
                  ))}
                  {aiSections.length === 1 && aiResult && (
                    <Text style={s.aiSectionText}>{aiResult}</Text>
                  )}
                </Animated.View>
              )}
            </LinearGradient>
          </View>
        </Animated.View>

        {/* ── SECTION 3: Color Guide ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={s.colorSection}>
          <View style={[s.sectionHeader, { paddingHorizontal: layout.padding.screen }]}>
            <Zap size={18} color={ACCENT} />
            <Text style={s.sectionTitle}>{t('aura.colorsSection', 'Kolory Aury')}</Text>
          </View>
          <Text style={[s.sectionDesc, { paddingHorizontal: layout.padding.screen }]}>
            Każdy kolor aury niesie unikalną wibrację i przesłanie. Przesuń, aby poznać słowa kluczowe i znaczenie każdego odcienia.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.colorScrollContent}
          >
            {COLOR_GUIDE.map(item => (
              <ColorGuideCard key={item.name} item={item} />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── SECTION 4: Aura Layers ───────────────────────────────────────── */}
        <View style={[s.layersSection, { paddingHorizontal: layout.padding.screen }]}>
          <View style={s.sectionHeader}>
            <Layers size={18} color={ACCENT} />
            <Text style={s.sectionTitle}>{t('aura.layersSection', '7 Warstw Aury')}</Text>
          </View>
          <Text style={s.layersSubtitle}>
            {t('aura.layersDesc', 'Każda warstwa aury przechowuje inny aspekt Twojego istnienia — dotknij, aby odkryć szczegóły.')}
          </Text>
          {AURA_LAYERS.map(layer => (
            <LayerAccordion key={layer.n} layer={layer} />
          ))}
        </View>

        {/* ── SECTION 5: Care Practices ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={[s.practicesSection, { paddingHorizontal: layout.padding.screen }]}>
          <View style={s.sectionHeader}>
            <Gem size={18} color={ACCENT} />
            <Text style={s.sectionTitle}>{t('aura.practicesSection', 'Pielęgnacja Aury')}</Text>
          </View>
          <Text style={s.sectionDesc}>
            Regularne praktyki wzmacniają, oczyszczają i harmonizują Twoje pole auretyczne. Dotknij praktyki, aby przejść do powiązanego modułu.
          </Text>
          {CARE_PRACTICES.map(p => (
            <Pressable
              key={p.title}
              style={({ pressed }) => [s.practiceCard, pressed && { opacity: 0.85 }]}
              onPress={() => {
                HapticsService.impact('light');
                if (p.targetScreen && p.targetScreen !== 'Portal') {
                  try { navigation.navigate(p.targetScreen); } catch {}
                }
              }}
            >
              <LinearGradient
                colors={['rgba(192,132,252,0.10)', 'rgba(129,140,248,0.06)']}
                style={s.practiceCardInner}
              >
                <View style={s.practiceIconWrap}>
                  <LinearGradient
                    colors={['#7C3AED', '#4F46E5']}
                    style={s.practiceIconBg}
                  >
                    <Text style={{ fontSize: 22 }}>{p.icon}</Text>
                  </LinearGradient>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.practiceName}>{p.title}</Text>
                  <Text style={s.practiceDesc} numberOfLines={2}>{p.desc}</Text>
                </View>
                <Text style={s.practiceArrow}>→</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </Animated.View>

        <EndOfContentSpacer size="standard" />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A0A2E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(232,121,249,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E9D5FF',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // ── Hero ──
  heroContainer: {
    height: HERO_H,
    width: SW,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: ORB_CENTER - 120,
    left: SW / 2 - 120,
  },
  orbCenterWrapper: {
    position: 'absolute',
    top: ORB_CENTER - 40,
    left: SW / 2 - 40,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  orbInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  heroText: {
    position: 'absolute',
    bottom: 16,
    alignItems: 'center',
    width: '100%',
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    color: 'rgba(196,181,253,0.7)',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  heroColorBadge: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  heroColorName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  heroMeaning: {
    fontSize: 13,
    color: 'rgba(196,181,253,0.75)',
    letterSpacing: 1,
    marginTop: 2,
  },

  // ── Section headers ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#E9D5FF',
    letterSpacing: 0.5,
  },

  // ── Section eyebrow ──
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    color: 'rgba(232,121,249,0.75)',
    textTransform: 'uppercase',
    marginBottom: 2,
  },

  // ── Section description ──
  sectionDesc: {
    fontSize: 13,
    color: 'rgba(196,181,253,0.70)',
    lineHeight: 19,
    marginBottom: 12,
    marginTop: -6,
  },

  // ── Daily check-in card ──
  checkinCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(232,121,249,0.30)',
  },
  checkinCardInner: {
    padding: 16,
  },
  checkinGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  checkinColorItem: {
    width: (SW - layout.padding.screen * 2 - 32 - 24) / 4,
    alignItems: 'center',
    marginBottom: 4,
  },
  checkinCircleWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 5,
  },
  checkinCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  checkinSelectedRing: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: 'rgba(232,121,249,0.50)',
  },
  checkinColorName: {
    fontSize: 10,
    color: 'rgba(196,181,253,0.7)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // ── Weekly log card ──
  weekCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.30)',
  },
  weekCardInner: {
    padding: 18,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  weekDayCol: {
    alignItems: 'center',
    gap: 6,
  },
  weekCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  weekDayLabel: {
    fontSize: 10,
    color: 'rgba(196,181,253,0.6)',
    fontWeight: '600',
    textAlign: 'center',
  },
  todayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(192,132,252,0.18)',
    gap: 4,
  },
  todayBannerText: {
    fontSize: 13,
    color: 'rgba(196,181,253,0.7)',
    fontWeight: '500',
  },
  todayBannerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  todayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 2,
  },

  // ── Camera card ──
  cameraCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.25)',
  },
  cameraCardInner: {
    padding: 20,
  },
  cameraCardDesc: {
    fontSize: 14,
    color: 'rgba(196,181,253,0.75)',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  cameraButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cameraBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cameraBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  cameraBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  galleryBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(192,132,252,0.5)',
    backgroundColor: 'rgba(192,132,252,0.08)',
  },
  galleryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C084FC',
  },

  // ── Image preview ──
  previewWrap: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  previewOverlay: {
    marginTop: 12,
  },
  readAuraBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  readAuraBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  readAuraBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },

  // ── AI Result ──
  aiResultWrap: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(192,132,252,0.2)',
    paddingTop: 18,
  },
  aiResultTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E9D5FF',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  aiSection: {
    backgroundColor: 'rgba(192,132,252,0.07)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.15)',
  },
  aiSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiSectionIcon: {
    fontSize: 18,
  },
  aiSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C084FC',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  aiSectionText: {
    fontSize: 14,
    color: 'rgba(233,213,255,0.85)',
    lineHeight: 22,
  },

  // ── Colors section ──
  colorSection: {
    marginTop: 4,
  },
  colorScrollContent: {
    paddingHorizontal: layout.padding.screen,
    gap: 12,
    paddingBottom: 4,
  },
  colorCard: {
    width: 160,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
  },
  colorCardBg: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  colorCardName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  colorCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  colorTag: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  colorTagText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },

  // ── Layers section ──
  layersSection: {
    marginTop: 4,
  },
  layersSubtitle: {
    fontSize: 13,
    color: 'rgba(196,181,253,0.65)',
    lineHeight: 19,
    marginBottom: 14,
    marginTop: -8,
  },
  layerCard: {
    backgroundColor: 'rgba(192,132,252,0.07)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.18)',
  },
  layerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  layerDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E9D5FF',
  },
  layerSub: {
    fontSize: 12,
    color: 'rgba(196,181,253,0.6)',
    marginTop: 2,
  },
  layerNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  layerNum: {
    fontSize: 13,
    fontWeight: '800',
  },
  layerBody: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(192,132,252,0.15)',
  },
  layerDesc: {
    fontSize: 13,
    color: 'rgba(233,213,255,0.82)',
    lineHeight: 20,
    marginBottom: 12,
  },
  layerMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  layerMetaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C084FC',
    minWidth: 90,
  },
  layerMetaValue: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(196,181,253,0.75)',
    lineHeight: 18,
  },

  // ── Practices section ──
  practicesSection: {
    marginTop: 4,
  },
  practiceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.2)',
  },
  practiceCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  practiceIconWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  practiceIconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E9D5FF',
    marginBottom: 4,
  },
  practiceDesc: {
    fontSize: 12,
    color: 'rgba(196,181,253,0.65)',
    lineHeight: 17,
  },
  practiceArrow: {
    fontSize: 18,
    color: '#C084FC',
    fontWeight: '700',
  },
});

export default AuraScreen;
