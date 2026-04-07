// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  Pressable, ScrollView, StyleSheet, View, Dimensions, Text,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Line, Ellipse } from 'react-native-svg';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, Easing, SharedValue,
} from 'react-native-reanimated';
import { ChevronLeft, Star, ArrowRight } from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#60A5FA';

// ── DATA ──────────────────────────────────────────────────────

interface Retrograde {
  planet: string;
  symbol: string;
  retroStart: string;
  retroEnd: string;
  effect: string;
  color: string;
  advice: string;
}

const RETROGRADES: Retrograde[] = [
  { planet: 'Merkury', symbol: '☿', retroStart: '2025-07-18', retroEnd: '2025-08-11', effect: 'Opóźnienia w komunikacji, rewizja umów i podróży', color: '#F59E0B', advice: 'Nie podpisuj nowych umów, przeglądaj stare decyzje' },
  { planet: 'Wenus',   symbol: '♀', retroStart: '2025-07-22', retroEnd: '2025-09-04', effect: 'Rewizja relacji, finansów i wartości',             color: '#F472B6', advice: 'Wróć do starych relacji, przemyśl wartości materialne' },
  { planet: 'Mars',    symbol: '♂', retroStart: '2026-01-06', retroEnd: '2026-02-23', effect: 'Spowolnienie działań, rewizja ambicji',             color: '#EF4444', advice: 'Odpoczywaj, nie zaczynaj nowych projektów siłą' },
  { planet: 'Jowisz',  symbol: '♃', retroStart: '2025-11-11', retroEnd: '2026-03-10', effect: 'Wewnętrzny wzrost zamiast zewnętrznego',            color: '#F97316', advice: 'Buduj wewnątrz zamiast ekspandować' },
  { planet: 'Saturn',  symbol: '♄', retroStart: '2025-07-13', retroEnd: '2025-11-27', effect: 'Rewizja struktur, obowiązków i granic',              color: '#64748B', advice: 'Przepracuj stare wzorce i buduj odpowiedzialnie' },
];

interface PlanetEnergy {
  planet: string;
  symbol: string;
  sign: string;
  energy: string;
  color: string;
}

const PLANETARY_ENERGIES: PlanetEnergy[] = [
  { planet: 'Słońce',  symbol: '☉', sign: 'Baran',      energy: 'Inicjatywa, odwaga, nowe początki',            color: '#F59E0B' },
  { planet: 'Księżyc', symbol: '☽', sign: 'Rak',        energy: 'Intuicja, emocje, wrażliwość',                  color: '#A78BFA' },
  { planet: 'Wenus',   symbol: '♀', sign: 'Byk',        energy: 'Zmysłowość, przyjemność, stabilność',           color: '#F472B6' },
  { planet: 'Mars',    symbol: '♂', sign: 'Strzelec',   energy: 'Entuzjazm, ekspansja, przygoda',                color: '#EF4444' },
  { planet: 'Merkury', symbol: '☿', sign: 'Ryby',       energy: 'Marzenia, intuicja, rozmyte granice',           color: '#34D399' },
  { planet: 'Jowisz',  symbol: '♃', sign: 'Baran',      energy: 'Szczęście w inicjatywach i nowych projektach',  color: '#F97316' },
  { planet: 'Saturn',  symbol: '♄', sign: 'Wodnik',     energy: 'Innowacja ze strukturą, reforma systemu',       color: '#64748B' },
];

const COSMIC_TIPS = [
  'Niedziela to czas Słońca — zadbaj o witalność i wyraź swoją tożsamość przez twórczość.',
  'Poniedziałek należy do Księżyca — słuchaj intuicji i emocji, zanim podejmiesz decyzje.',
  'Wtorek rządzi Mars — idealna chwila na działanie, sport i realizację celów.',
  'Środa to dzień Merkurego — zadbaj o komunikację, pisanie i kontakty z innymi.',
  'Czwartek jest pod wpływem Jowisza — rozwijaj się, ucz i myśl o wielkiej wizji.',
  'Piątek należy do Wenus — pielęgnuj relacje, piękno i przyjemności życia.',
  'Sobota to czas Saturna — porządkuj zobowiązania i buduj trwałe fundamenty.',
];

interface Aspect {
  aspect: string;
  planets: string;
  meaning: string;
  quality: string;
  color: string;
}

const CURRENT_ASPECTS: Aspect[] = [
  { aspect: 'Koniunkcja', planets: 'Jowisz–Uran',    meaning: 'Nagłe przełomy i innowacje',                   quality: 'sprzyjający',  color: '#34D399' },
  { aspect: 'Trygon',     planets: 'Wenus–Saturn',   meaning: 'Stabilna miłość i zobowiązania',               quality: 'sprzyjający',  color: '#60A5FA' },
  { aspect: 'Kwadrat',    planets: 'Słońce–Mars',    meaning: 'Wewnętrzne napięcie i działanie',              quality: 'wymagający',   color: '#F97316' },
  { aspect: 'Opozycja',   planets: 'Merkury–Neptun', meaning: 'Zamglone myśli, intuicja kontra logika',       quality: 'wymagający',   color: '#8B5CF6' },
];

const ASPECT_TIPS = [
  'Sprzyjające aspekty to momenty naturalnego przepływu — pozwól energii działać bez nadmiernego wysiłku.',
  'Wymagające aspekty to zaproszenie do wzrostu — napięcie pokazuje obszary, które proszą o uwagę.',
  'Obserwuj swoje emocje podczas aspektów i notuj w dzienniku, co wnosi każdy z nich.',
];

// ── HELPERS ───────────────────────────────────────────────────

const isCurrentlyRetrograde = (r: Retrograde): boolean => {
  const now = new Date();
  return now >= new Date(r.retroStart) && now <= new Date(r.retroEnd);
};

const isUpcomingRetrograde = (r: Retrograde): boolean => {
  const now = new Date();
  return now < new Date(r.retroStart);
};

type RetroStatus = 'AKTYWNY' | 'NADCHODZĄCY' | 'MINIONY';

const getRetroStatus = (r: Retrograde): RetroStatus => {
  if (isCurrentlyRetrograde(r)) return 'AKTYWNY';
  if (isUpcomingRetrograde(r)) return 'NADCHODZĄCY';
  return 'MINIONY';
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'short', year: 'numeric' });
};

// ── SOLAR SYSTEM HERO ─────────────────────────────────────────

const SolarSystemScene = () => {
  const rot1 = useSharedValue(0);
  const rot2 = useSharedValue(0);
  const rot3 = useSharedValue(60);
  const rot4 = useSharedValue(120);
  const rot5 = useSharedValue(200);

  useEffect(() => {
    rot1.value = withRepeat(withTiming(360, { duration: 6000,  easing: Easing.linear }), -1, false);
    rot2.value = withRepeat(withTiming(360, { duration: 10000, easing: Easing.linear }), -1, false);
    rot3.value = withRepeat(withTiming(360 + 60,  { duration: 16000, easing: Easing.linear }), -1, false);
    rot4.value = withRepeat(withTiming(360 + 120, { duration: 26000, easing: Easing.linear }), -1, false);
    rot5.value = withRepeat(withTiming(360 + 200, { duration: 42000, easing: Easing.linear }), -1, false);
  }, []);

  const makeOrbitalStyle = (sv: SharedValue<number>, rx: number, ry: number) =>
    useAnimatedStyle(() => {
      const rad = (sv.value * Math.PI) / 180;
      return {
        transform: [
          { translateX: rx * Math.cos(rad) },
          { translateY: ry * Math.sin(rad) },
        ],
      };
    });

  const s1 = makeOrbitalStyle(rot1, 38, 13);
  const s2 = makeOrbitalStyle(rot2, 58, 20);
  const s3 = makeOrbitalStyle(rot3, 80, 28);
  const s4 = makeOrbitalStyle(rot4, 104, 36);
  const s5 = makeOrbitalStyle(rot5, 126, 44);

  const CX = SW / 2;
  const CY = 100;

  return (
    <View style={{ height: 200, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SW} height={200} style={StyleSheet.absoluteFill}>
        {/* Background stars */}
        {Array.from({ length: 50 }, (_, i) => (
          <Circle key={i}
            cx={(i * 137 + 23) % SW}
            cy={(i * 79 + 11) % 200}
            r={i % 7 === 0 ? 1.6 : 0.7}
            fill="#FFFFFF"
            opacity={0.10 + (i % 5) * 0.05}
          />
        ))}
        {/* Orbital rings */}
        <Ellipse cx={CX} cy={CY} rx={38}  ry={13}  fill="none" stroke={ACCENT} strokeWidth={0.5} opacity={0.25} />
        <Ellipse cx={CX} cy={CY} rx={58}  ry={20}  fill="none" stroke={ACCENT} strokeWidth={0.5} opacity={0.22} />
        <Ellipse cx={CX} cy={CY} rx={80}  ry={28}  fill="none" stroke={ACCENT} strokeWidth={0.5} opacity={0.18} />
        <Ellipse cx={CX} cy={CY} rx={104} ry={36}  fill="none" stroke={ACCENT} strokeWidth={0.4} opacity={0.15} />
        <Ellipse cx={CX} cy={CY} rx={126} ry={44}  fill="none" stroke={ACCENT} strokeWidth={0.4} opacity={0.12} />
        {/* Sun glow */}
        <Circle cx={CX} cy={CY} r={20} fill="#F59E0B" opacity={0.15} />
        <Circle cx={CX} cy={CY} r={13} fill="#FCD34D" opacity={0.30} />
        <Circle cx={CX} cy={CY} r={8}  fill="#FBBF24" opacity={0.90} />
      </Svg>

      {/* Animated planet dots */}
      {[
        { style: s1, color: '#34D399', size: 5  },
        { style: s2, color: '#F472B6', size: 6  },
        { style: s3, color: '#EF4444', size: 5  },
        { style: s4, color: '#F97316', size: 8  },
        { style: s5, color: '#64748B', size: 7  },
      ].map((p, i) => (
        <Animated.View
          key={i}
          style={[
            {
              position: 'absolute',
              top: CY - p.size / 2,
              left: SW / 2 - p.size / 2,
              width: p.size,
              height: p.size,
              borderRadius: p.size,
              backgroundColor: p.color,
            },
            p.style,
          ]}
        />
      ))}
    </View>
  );
};

// ── BACKGROUND ────────────────────────────────────────────────

const AstrologyCyclesBg = ({ isLight }: { isLight: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight ? ['#EFF6FF', '#F0F4FF', '#F5F0FF'] : ['#030408', '#060914', '#080B1A']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={700} style={StyleSheet.absoluteFill} opacity={isLight ? 0.08 : 0.12}>
      <G>
        {Array.from({ length: 40 }, (_, i) => (
          <Circle key={i}
            cx={(i * 157 + 17) % SW}
            cy={(i * 103 + 31) % 700}
            r={i % 6 === 0 ? 1.8 : 0.8}
            fill={ACCENT}
            opacity={0.4 + (i % 3) * 0.2}
          />
        ))}
        <Ellipse cx={SW / 2} cy={200} rx={SW * 0.6} ry={180} fill="none" stroke={ACCENT} strokeWidth={0.5} opacity={0.15} />
        <Ellipse cx={SW / 2} cy={200} rx={SW * 0.4} ry={120} fill="none" stroke={ACCENT} strokeWidth={0.4} opacity={0.10} />
      </G>
    </Svg>
  </View>
);

// ── TIMELINE BAR ──────────────────────────────────────────────

const TimelineBar = ({ retro, isLight }: { retro: Retrograde; isLight: boolean }) => {
  // Show a 1-year window centred on today
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setMonth(windowStart.getMonth() - 3);
  const windowEnd = new Date(now);
  windowEnd.setMonth(windowEnd.getMonth() + 9);
  const windowMs = windowEnd.getTime() - windowStart.getTime();

  const rStart = new Date(retro.retroStart);
  const rEnd   = new Date(retro.retroEnd);

  const left  = Math.max(0, Math.min(1, (rStart.getTime() - windowStart.getTime()) / windowMs));
  const right = Math.max(0, Math.min(1, (rEnd.getTime()   - windowStart.getTime()) / windowMs));
  const todayPos = Math.max(0, Math.min(1, (now.getTime() - windowStart.getTime()) / windowMs));

  const barW = SW - layout.padding.screen * 2 - 32;

  return (
    <View style={{ marginTop: 10, paddingHorizontal: 0 }}>
      <View style={{ height: 6, backgroundColor: isLight ? 'rgba(255,246,230,0.95)' : 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        {/* Retrograde period */}
        <View style={{
          position: 'absolute',
          left: left * barW,
          width: Math.max(4, (right - left) * barW),
          top: 0, height: 6,
          backgroundColor: retro.color,
          borderRadius: 3,
          opacity: 0.85,
        }} />
        {/* Today marker */}
        <View style={{
          position: 'absolute',
          left: todayPos * barW - 1,
          top: -2, width: 2, height: 10,
          backgroundColor: '#FFFFFF',
          borderRadius: 1,
          opacity: 0.9,
        }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ fontSize: 9, color: isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.30)', letterSpacing: 0.3 }}>
          -{3}mies.
        </Text>
        <Text style={{ fontSize: 9, color: isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.30)', letterSpacing: 0.3 }}>
          +9mies.
        </Text>
      </View>
    </View>
  );
};

// ── MAIN SCREEN ───────────────────────────────────────────────

type TabId = 'dziś' | 'retrogady' | 'aspekty';

export const AstrologyCyclesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const themeName = useAppStore((s) => s.themeName);
  const themeMode = useAppStore((s) => s.themeMode);
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const theme = currentTheme;
  const [activeTab, setActiveTab] = useState<TabId>('dziś');
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchAiInsight = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    HapticsService.notify();
    try {
      const activeR = RETROGRADES.filter(r => isCurrentlyRetrograde(r));
      const retroNames = activeR.length > 0 ? activeR.map(r => r.planet).join(', ') : 'brak aktywnych retrogradow';
      const prompt = 'Aktywne retrogady dzisiaj: ' + retroNames + '. Aktualna konfiguracja planetarna: ' + PLANETARY_ENERGIES.slice(0, 3).map(p => p.planet + ' w ' + p.sign).join(', ') + '. Napisz krotka (3-4 zdania) interpretacje kosmicznego klimatu na dzis i praktyczna wskazowke dla uzytkownika.';
      const result = await AiService.chatWithOracle(prompt);
      setAiInsight(result);
    } catch (e) {
      setAiInsight('Nie udalo sie pobrac interpretacji. Sprobuj ponownie.');
    } finally {
      setAiLoading(false);
    }
  };

  const textColor  = isLight ? theme.text              : '#F0ECFF';
  const subColor   = isLight ? 'rgba(0,0,0,0.72)'      : 'rgba(255,255,255,0.48)';
  const cardBg     = isLight ? 'rgba(255,255,255,0.88)'      : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)'      : 'rgba(255,255,255,0.08)';
  const chipBg     = isLight ? 'rgba(255,248,234,0.92)'      : 'rgba(255,255,255,0.07)';

  const SCREEN_ID = 'AstrologyCycles';
  const isFav = isFavoriteItem(SCREEN_ID);

  const toggleFav = () => {
    HapticsService.notify();
    if (isFav) {
      removeFavoriteItem(SCREEN_ID);
    } else {
      addFavoriteItem({
        id: SCREEN_ID,
        label: 'Cykle Planet',
        sublabel: 'Retrogady i tranzyty',
        route: 'AstrologyCycles',
        icon: 'Globe',
        color: ACCENT,
        addedAt: new Date().toISOString(),
      });
    }
  };

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const tipIndex = dayOfWeek; // Sunday=0 → index 0
  const cosmicTip = COSMIC_TIPS[tipIndex];

  const activeRetrogrades = useMemo(() => RETROGRADES.filter(isCurrentlyRetrograde), []);

  const TABS: { id: TabId; label: string }[] = [
    { id: 'dziś',      label: 'Dziś' },
    { id: 'retrogady', label: 'Retrogady' },
    { id: 'aspekty',   label: 'Aspekty' },
  ];

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1 }} edges={['top']}>

      <AstrologyCyclesBg isLight={isLight} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: 6 }]}>
        <Pressable
          onPress={() => goBackOrToMainTab(navigation, 'Worlds')}
          hitSlop={12}
          style={styles.headerBtn}
        >
          <ChevronLeft color={isLight ? theme.text : '#C4B5FD'} size={22} strokeWidth={2} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: isLight ? theme.text : '#E2D9FF' }]}>
          ✦ CYKLE PLANET
        </Text>

        <Pressable onPress={toggleFav} hitSlop={12} style={styles.headerBtn}>
          <Star
            color={isFav ? ACCENT : (isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.40)')}
            fill={isFav ? ACCENT : 'none'}
            size={20}
            strokeWidth={1.8}
          />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(600).delay(60)}>
          <SolarSystemScene />
          <View style={{ alignItems: 'center', marginTop: -8, marginBottom: 20 }}>
            <Text style={[styles.heroTitle, { color: isLight ? theme.text : '#E2D9FF' }]}>
              Rytm Kosmiczny
            </Text>
            <Text style={[styles.heroSub, { color: subColor }]}>
              Planety mówią — naucz się słuchać
            </Text>
          </View>
        </Animated.View>

        {/* Tab bar */}
        <Animated.View entering={FadeInDown.duration(500).delay(180)} style={styles.tabBar}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => { HapticsService.notify(); setActiveTab(tab.id); }}
                style={[
                  styles.tab,
                  { backgroundColor: active ? ACCENT + '22' : chipBg },
                  active && { borderColor: ACCENT + '55' },
                ]}
              >
                <Text style={[
                  styles.tabLabel,
                  { color: active ? ACCENT : subColor },
                  active && { fontWeight: '700' },
                ]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>

        {/* ── TAB: DZIŚ ───────────────────────────────────────── */}
        {activeTab === 'dziś' && (
          <View style={{ paddingHorizontal: layout.padding.screen }}>

            {/* Active retrograde warning */}
            {activeRetrogrades.length > 0 && (
              <Animated.View entering={FadeInDown.duration(450).delay(80)}>
                <View style={[styles.warningBanner, {
                  borderColor: '#F59E0B55',
                  backgroundColor: isLight ? 'rgba(245,158,11,0.07)' : 'rgba(245,158,11,0.10)',
                }]}>
                  <Text style={styles.warningIcon}>⚠️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.warningTitle, { color: '#F59E0B' }]}>
                      AKTYWNE RETROGADY
                    </Text>
                    <Text style={[styles.warningText, { color: isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.65)' }]}>
                      {activeRetrogrades.map(r => `${r.symbol} ${r.planet}`).join(' · ')}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Energy section */}
            <Animated.View entering={FadeInDown.duration(450).delay(160)}>
              <Text style={[styles.eyebrow, { color: ACCENT }]}>ENERGIA DNI</Text>
            </Animated.View>

            {PLANETARY_ENERGIES.map((p, i) => (
              <Animated.View key={p.planet} entering={FadeInDown.duration(400).delay(200 + i * 55)}>
                <View style={[styles.planetRow, {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  borderLeftColor: p.color,
                }]}>
                  <Text style={[styles.planetSymbol, { color: p.color }]}>{p.symbol}</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[styles.planetName, { color: textColor }]}>{p.planet}</Text>
                      <Text style={[styles.planetSign, { color: p.color + 'CC' }]}>in {p.sign}</Text>
                    </View>
                    <Text style={[styles.planetEnergy, { color: subColor }]}>{p.energy}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}

            {/* Cosmic tip */}
            <Animated.View entering={FadeInDown.duration(450).delay(620)}>
              <View style={[styles.tipCard, {
                backgroundColor: isLight ? 'rgba(96,165,250,0.07)' : 'rgba(96,165,250,0.10)',
                borderColor: ACCENT + '33',
              }]}>
                <Text style={[styles.eyebrow, { color: ACCENT, marginBottom: 8 }]}>WSKAZÓWKA DNIA</Text>
                <Text style={[styles.tipText, { color: textColor }]}>{cosmicTip}</Text>
              </View>
            </Animated.View>
          </View>
        )}

        {/* ── TAB: RETROGADY ──────────────────────────────────── */}
        {activeTab === 'retrogady' && (
          <View style={{ paddingHorizontal: layout.padding.screen }}>
            <Animated.View entering={FadeInDown.duration(450).delay(60)}>
              <View style={[styles.introCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.introText, { color: subColor }]}>
                  Retrograd to zjawisko, gdy planeta pozornie porusza się wstecz po niebie. To czas rewizji, spowolnienia i głębszej refleksji w obszarach rządzonych przez daną planetę.
                </Text>
              </View>
            </Animated.View>

            {RETROGRADES.map((r, i) => {
              const status = getRetroStatus(r);
              const isExpanded = expandedPlanet === r.planet;
              const statusColor =
                status === 'AKTYWNY'      ? '#EF4444' :
                status === 'NADCHODZĄCY'  ? ACCENT     : subColor;
              const statusBg =
                status === 'AKTYWNY'      ? 'rgba(239,68,68,0.12)' :
                status === 'NADCHODZĄCY'  ? 'rgba(96,165,250,0.12)' : 'rgba(100,116,139,0.10)';

              return (
                <Animated.View key={r.planet} entering={FadeInDown.duration(400).delay(120 + i * 80)}>
                  <Pressable
                    onPress={() => {
                      HapticsService.notify();
                      setExpandedPlanet(isExpanded ? null : r.planet);
                    }}
                    style={[styles.retroCard, {
                      backgroundColor: cardBg,
                      borderColor: isExpanded ? r.color + '44' : cardBorder,
                    }]}
                  >
                    {/* Card header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.retroSymbol, { color: r.color }]}>{r.symbol}</Text>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={[styles.retroName, { color: textColor }]}>{r.planet}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                            <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
                          </View>
                        </View>
                        <Text style={[styles.retroDates, { color: subColor }]}>
                          {formatDate(r.retroStart)} – {formatDate(r.retroEnd)}
                        </Text>
                      </View>
                      <Text style={[styles.expandChevron, { color: isLight ? 'rgba(0,0,0,0.58)' : 'rgba(255,255,255,0.30)' }]}>
                        {isExpanded ? '▲' : '▼'}
                      </Text>
                    </View>

                    {/* Timeline bar */}
                    <TimelineBar retro={r} isLight={isLight} />

                    {/* Expanded content */}
                    {isExpanded && (
                      <View style={{ marginTop: 14 }}>
                        <View style={[styles.effectCard, {
                          backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)',
                          borderColor: r.color + '33',
                        }]}>
                          <Text style={[styles.effectLabel, { color: r.color }]}>WPŁYW</Text>
                          <Text style={[styles.effectText, { color: textColor }]}>{r.effect}</Text>
                        </View>
                        <View style={[styles.adviceCard, {
                          backgroundColor: isLight ? 'rgba(96,165,250,0.06)' : 'rgba(96,165,250,0.08)',
                          borderColor: ACCENT + '33',
                        }]}>
                          <Text style={[styles.effectLabel, { color: ACCENT }]}>WSKAZÓWKA</Text>
                          <Text style={[styles.effectText, { color: textColor }]}>{r.advice}</Text>
                        </View>
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* ── TAB: ASPEKTY ──────────────────────────────────── */}
        {activeTab === 'aspekty' && (
          <View style={{ paddingHorizontal: layout.padding.screen }}>
            <Animated.View entering={FadeInDown.duration(450).delay(60)}>
              <View style={[styles.introCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.introText, { color: subColor }]}>
                  Aspekty to kąty między planetami na mapie nieba. Opisują rodzaj relacji i napięcia energetycznego między ich wpływami w naszym życiu.
                </Text>
              </View>
            </Animated.View>

            {CURRENT_ASPECTS.map((a, i) => {
              const isPositive = a.quality === 'sprzyjający';
              return (
                <Animated.View key={a.planets} entering={FadeInDown.duration(400).delay(120 + i * 80)}>
                  <View style={[styles.aspectCard, {
                    backgroundColor: cardBg,
                    borderColor: a.color + '33',
                  }]}>
                    <View style={[styles.aspectIcon, { backgroundColor: a.color + '20' }]}>
                      <Text style={[styles.aspectIconText, { color: a.color }]}>
                        {a.aspect === 'Koniunkcja' ? '☌' :
                         a.aspect === 'Trygon'     ? '△' :
                         a.aspect === 'Kwadrat'    ? '□' : '☍'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text style={[styles.aspectName, { color: a.color }]}>{a.aspect}</Text>
                        <Text style={[styles.aspectPlanets, { color: textColor }]}>{a.planets}</Text>
                        <View style={[styles.qualityBadge, {
                          backgroundColor: isPositive ? 'rgba(52,211,153,0.12)' : 'rgba(249,115,22,0.12)',
                        }]}>
                          <Text style={[styles.qualityText, {
                            color: isPositive ? '#34D399' : '#F97316',
                          }]}>
                            {a.quality.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.aspectMeaning, { color: subColor }]}>{a.meaning}</Text>
                    </View>
                  </View>
                </Animated.View>
              );
            })}

            {/* Guide section */}
            <Animated.View entering={FadeInDown.duration(450).delay(500)}>
              <Text style={[styles.eyebrow, { color: ACCENT, marginTop: 24 }]}>JAK PRACOWAĆ Z ASPEKTAMI</Text>
              {ASPECT_TIPS.map((tip, i) => (
                <View key={i} style={[styles.guideTip, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                  <View style={[styles.guideNumber, { backgroundColor: ACCENT + '20' }]}>
                    <Text style={[styles.guideNumberText, { color: ACCENT }]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.guideText, { color: subColor }]}>{tip}</Text>
                </View>
              ))}
            </Animated.View>
          </View>
        )}

        {/* Co dalej? */}
        <Animated.View entering={FadeInDown.duration(450).delay(400)}
          style={{ paddingHorizontal: layout.padding.screen, marginTop: 32 }}>
          <Text style={[styles.eyebrow, { color: ACCENT }]}>CO DALEJ?</Text>
          {[
            { label: 'Horoskop', sublabel: 'Twój znak zodiakalny', route: 'Horoscope', symbol: '♈' },
            { label: 'Kalendarz Księżyca', sublabel: 'Fazy i intencje',  route: 'LunarCalendar', symbol: '☽' },
            { label: 'Obserwatorium',      sublabel: 'Mapa nieba na żywo', route: 'Stars', symbol: '✦' },
          ].map((link, i) => (
            <Pressable
              key={link.route}
              onPress={() => { HapticsService.notify(); navigation.navigate(link.route as never); }}
              style={[styles.linkCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <Text style={[styles.linkSymbol, { color: ACCENT }]}>{link.symbol}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.linkLabel, { color: textColor }]}>{link.label}</Text>
                <Text style={[styles.linkSublabel, { color: subColor }]}>{link.sublabel}</Text>
              </View>
              <ArrowRight color={subColor} size={16} strokeWidth={1.6} />
            </Pressable>
          ))}
        </Animated.View>

        {/* AI COSMIC INSIGHT */}
        <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 8, marginBottom: 8 }}>
          <View style={[{ borderRadius: 16, borderWidth: 1, padding: 16, backgroundColor: ACCENT + "10", borderColor: ACCENT + "30" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Text style={[styles.eyebrow, { color: ACCENT, marginBottom: 0 }]}>{"AI INTERPRETACJA CYKLI"}</Text>
              <Pressable onPress={fetchAiInsight} disabled={aiLoading}
                style={{ backgroundColor: ACCENT, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 }}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                  {aiLoading ? "..." : "Interpretuj"}
                </Text>
              </Pressable>
            </View>
            {aiInsight ? (
              <Text style={{ color: isLight ? "#1A1A2E" : "#E0D8FF", fontSize: 13, lineHeight: 21, fontStyle: "italic" }}>{aiInsight}</Text>
            ) : (
              <Text style={{ color: subColor, fontSize: 12, lineHeight: 20 }}>
                {"Nacisnij Interpretuj aby uzyskac AI analize aktualnych cykli planetarnych."}
              </Text>
            )}
          </View>
        </View>

        <EndOfContentSpacer size="airy" />
      </ScrollView>
        </SafeAreaView>
</View>
  );
};

// ── STYLES ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen,
    paddingBottom: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroSub: {
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: layout.padding.screen,
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginBottom: 12,
    marginTop: 4,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    gap: 10,
  },
  warningIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  warningTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 3,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 19,
  },
  planetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: 10,
  },
  planetSymbol: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  planetName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  planetSign: {
    fontSize: 12,
    fontWeight: '500',
  },
  planetEnergy: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  tipCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
  },
  introCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  introText: {
    fontSize: 13,
    lineHeight: 20,
  },
  retroCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  retroSymbol: {
    fontSize: 32,
    width: 40,
    textAlign: 'center',
  },
  retroName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  retroDates: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  expandChevron: {
    fontSize: 10,
    paddingLeft: 8,
  },
  effectCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  adviceCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  effectLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 6,
  },
  effectText: {
    fontSize: 13,
    lineHeight: 20,
  },
  aspectCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  aspectIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aspectIconText: {
    fontSize: 20,
    fontWeight: '700',
  },
  aspectName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  aspectPlanets: {
    fontSize: 13,
    fontWeight: '500',
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  qualityText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  aspectMeaning: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  guideTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  guideNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  guideNumberText: {
    fontSize: 12,
    fontWeight: '800',
  },
  guideText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  linkSymbol: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  linkSublabel: {
    fontSize: 12,
    marginTop: 2,
  },
});
