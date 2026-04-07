// @ts-nocheck
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, Dimensions, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path, G, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, Star, MapPin, Clock } from 'lucide-react-native';
import { getResolvedTheme, isLightBg } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#F59E0B';
const CHART_R = 130;

const ZODIAC_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const ZODIAC_COLORS = ['#EF4444','#F97316','#FBBF24','#4ADE80','#FCD34D','#34D399','#60A5FA','#F87171','#818CF8','#A78BFA','#22D3EE','#E879F9'];
const PLANETS = [
  { sym: '☉', name: 'Słońce', sign: 0, color: '#FCD34D' },
  { sym: '☽', name: 'Księżyc', sign: 3, color: '#C4B5FD' },
  { sym: '☿', name: 'Merkury', sign: 1, color: '#93C5FD' },
  { sym: '♀', name: 'Wenus', sign: 5, color: '#FDA4AF' },
  { sym: '♂', name: 'Mars', sign: 0, color: '#FCA5A5' },
  { sym: '♃', name: 'Jowisz', sign: 8, color: '#FDE68A' },
  { sym: '♄', name: 'Saturn', sign: 9, color: '#D1D5DB' },
  { sym: '♅', name: 'Uran', sign: 10, color: '#99F6E4' },
  { sym: '♆', name: 'Neptun', sign: 11, color: '#93C5FD' },
  { sym: '♇', name: 'Pluton', sign: 7, color: '#C4B5FD' },
];

const HOUSES = [
  { n: 1, title: 'Ja i wizerunek', desc: 'Twoja osobowość, wygląd i sposób, w jaki prezentujesz się światu.' },
  { n: 2, title: 'Wartości i zasoby', desc: 'Finanse, posiadłości, talenty i to, co cenisz.' },
  { n: 3, title: 'Komunikacja', desc: 'Mówienie, pisanie, rodzeństwo, bliskie otoczenie.' },
  { n: 4, title: 'Dom i korzenie', desc: 'Rodzina, przeszłość, bezpieczeństwo emocjonalne.' },
  { n: 5, title: 'Kreatywność i miłość', desc: 'Hobby, dzieci, romanse, twórcza ekspresja.' },
  { n: 6, title: 'Zdrowie i praca', desc: 'Rutyna, zdrowie, służba, codzienność.' },
  { n: 7, title: 'Partnerstwo', desc: 'Związki, małżeństwo, partnerzy biznesowi.' },
  { n: 8, title: 'Transformacja', desc: 'Śmierć i odrodzenie, seksualność, dziedzictwo.' },
  { n: 9, title: 'Filozofia', desc: 'Podróże, wyższe wykształcenie, religia, sens.' },
  { n: 10, title: 'Kariera', desc: 'Publiczny wizerunek, status, zawód, ambicja.' },
  { n: 11, title: 'Wspólnota', desc: 'Przyjaciele, marzenia, grupy, ideały.' },
  { n: 12, title: 'Mistycyzm', desc: 'Podświadomość, izolacja, karma, ukryte sprawy.' },
];

const ChartSvg = ({ isDark }: { isDark: boolean }) => {
  const size = (CHART_R + 50) * 2;
  const cx = size / 2;
  const cy = size / 2;
  const n = 12;
    const fetchNatalAi = async () => {
    setNatalAiLoading(true);
    HapticsService.impactLight();
    try {
      const prompt = "Karta urodzenia. Aktywna zakladka: " + activeTab + ". Slonce w znaku 0 (Baran), Ksiezyc w znaku 3 (Rak), Ascendent Waga. Napisz krotka (3-4 zdania) interpretacje dominujacych energii w tej karcie urodzenia i jedno praktyczne przeslanie na dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setNatalAiInsight(result);
    } catch (e) {
      setNatalAiInsight("Blad pobierania interpretacji.");
    } finally {
      setNatalAiLoading(false);
    }
  };
return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="chartGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={ACCENT} stopOpacity={isDark ? "0.15" : "0.08"} />
          <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={CHART_R + 20} fill="url(#chartGrad)" />
      {[CHART_R, CHART_R * 0.7, CHART_R * 0.4].map((r, i) => (
        <Circle key={i} cx={cx} cy={cy} r={r} stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(122,95,54,0.14)'} strokeWidth={1} fill="none" />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const angle = (i * 30 - 90) * Math.PI / 180;
        const angle2 = ((i + 1) * 30 - 90) * Math.PI / 180;
        const midAngle = ((i * 30 + 15) - 90) * Math.PI / 180;
        const x1 = cx + CHART_R * Math.cos(angle);
        const y1 = cy + CHART_R * Math.sin(angle);
        const slabelR = CHART_R + 30;
        const sx = cx + slabelR * Math.cos(midAngle);
        const sy = cy + slabelR * Math.sin(midAngle);
          const fetchNatalAi = async () => {
    setNatalAiLoading(true);
    HapticsService.impactLight();
    try {
      const prompt = "Karta urodzenia. Aktywna zakladka: " + activeTab + ". Slonce w znaku 0 (Baran), Ksiezyc w znaku 3 (Rak), Ascendent Waga. Napisz krotka (3-4 zdania) interpretacje dominujacych energii w tej karcie urodzenia i jedno praktyczne przeslanie na dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setNatalAiInsight(result);
    } catch (e) {
      setNatalAiInsight("Blad pobierania interpretacji.");
    } finally {
      setNatalAiLoading(false);
    }
  };
return (
          <G key={i}>
            <Line x1={cx} y1={cy} x2={x1} y2={y1} stroke={ZODIAC_COLORS[i]} strokeWidth={0.8} opacity={0.3} />
            <SvgText x={sx} y={sy + 5} textAnchor="middle" fontSize={12} fill={ZODIAC_COLORS[i]} opacity={0.7}>{ZODIAC_SYMBOLS[i]}</SvgText>
          </G>
        );
      })}
      {PLANETS.map((planet, i) => {
        const angle = (planet.sign * 30 + i * 6 - 90) * Math.PI / 180;
        const r = CHART_R * 0.55;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
          const fetchNatalAi = async () => {
    setNatalAiLoading(true);
    HapticsService.impactLight();
    try {
      const prompt = "Karta urodzenia. Aktywna zakladka: " + activeTab + ". Slonce w znaku 0 (Baran), Ksiezyc w znaku 3 (Rak), Ascendent Waga. Napisz krotka (3-4 zdania) interpretacje dominujacych energii w tej karcie urodzenia i jedno praktyczne przeslanie na dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setNatalAiInsight(result);
    } catch (e) {
      setNatalAiInsight("Blad pobierania interpretacji.");
    } finally {
      setNatalAiLoading(false);
    }
  };
return (
          <G key={planet.sym}>
            <Circle cx={px} cy={py} r={8} fill={planet.color} opacity={0.7} />
            <SvgText x={px} y={py + 4} textAnchor="middle" fontSize={9} fill="#fff" opacity={0.9}>{planet.sym}</SvgText>
          </G>
        );
      })}
      <Circle cx={cx} cy={cy} r={6} fill={ACCENT} opacity={0.8} />
    </Svg>
  );
};

export const NatalChartScreen = ({ navigation }: any) => {
    const themeName = useAppStore(s => s.themeName);
  const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const currentTheme = getResolvedTheme(themeName, userData?.preferences?.colorScheme);
  const isDark = !isLightBg(currentTheme.background);
  const isLight = !isDark;
  const textColor = isLight ? '#1A0800' : '#FFF7E0';
  const subColor = isLight ? 'rgba(26,8,0,0.5)' : 'rgba(255,247,224,0.5)';
  const { t } = useTranslation();
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';

  const [activeTab, setActiveTab] = useState<'chart' | 'planets' | 'houses'>('chart');
  const [expandedHouse, setExpandedHouse] = useState<number | null>(null);
  const [natalAiInsight, setNatalAiInsight] = useState<string>('');
  const [natalAiLoading, setNatalAiLoading] = useState(false);

    const fetchNatalAi = async () => {
    setNatalAiLoading(true);
    HapticsService.impactLight();
    try {
      const prompt = "Karta urodzenia. Aktywna zakladka: " + activeTab + ". Slonce w znaku 0 (Baran), Ksiezyc w znaku 3 (Rak), Ascendent Waga. Napisz krotka (3-4 zdania) interpretacje dominujacych energii w tej karcie urodzenia i jedno praktyczne przeslanie na dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setNatalAiInsight(result);
    } catch (e) {
      setNatalAiInsight("Blad pobierania interpretacji.");
    } finally {
      setNatalAiLoading(false);
    }
  };
return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={isDark ? ['#0A0500', '#120A00', '#1A1000'] : ['#FFFBF0', '#FFF8E8', '#FFF5E0']} style={StyleSheet.absoluteFill} />
      </View>
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2 }}>{t('natalChart.eyebrow').toUpperCase()}</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>{t('natalChart.title')}</Text>
        </View>
        <Pressable style={styles.starBtn} hitSlop={12} onPress={() => { HapticsService.impact('light'); if (isFavoriteItem('natal-chart')) { removeFavoriteItem('natal-chart'); } else { addFavoriteItem({ id: 'natal-chart', label: 'Karta urodzenia', route: 'NatalChart', params: {}, icon: 'Star', color: ACCENT, addedAt: new Date().toISOString() }); } }}>
          <Star size={18} color={isFavoriteItem('natal-chart') ? ACCENT : subColor} strokeWidth={1.8} fill={isFavoriteItem('natal-chart') ? ACCENT : 'none'} />
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {([['chart', t('natalChart.tabChart')], ['planets', t('natalChart.tabPlanets')], ['houses', t('natalChart.tabHouses')]] as const).map(([tab, label]) => {
          const active = activeTab === tab;
            const fetchNatalAi = async () => {
    setNatalAiLoading(true);
    HapticsService.impactLight();
    try {
      const prompt = "Karta urodzenia. Aktywna zakladka: " + activeTab + ". Slonce w znaku 0 (Baran), Ksiezyc w znaku 3 (Rak), Ascendent Waga. Napisz krotka (3-4 zdania) interpretacje dominujacych energii w tej karcie urodzenia i jedno praktyczne przeslanie na dzis.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setNatalAiInsight(result);
    } catch (e) {
      setNatalAiInsight("Blad pobierania interpretacji.");
    } finally {
      setNatalAiLoading(false);
    }
  };
return (
            <Pressable key={tab} onPress={() => { HapticsService.impactLight(); setActiveTab(tab); }}
              style={[styles.tabChip, active && { backgroundColor: ACCENT, borderColor: ACCENT }]}>
              <Text style={[styles.tabLabel, { color: active ? '#fff' : subColor }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen }}>
        {activeTab === 'chart' && (
          <>
            <Animated.View entering={FadeInDown.delay(60).duration(600)} style={{ alignItems: 'center', marginBottom: 12 }}>
              <ChartSvg isDark={isDark} />
            </Animated.View>
            <View style={[styles.infoCard, { backgroundColor: ACCENT + '14', borderColor: ACCENT + '28' }]}>
              <Text style={{ color: textColor, fontSize: 13, lineHeight: 20 }}>
                Karta urodzenia to mapa nieba w chwili twoich narodzin. Każda planeta w konkretnym znaku i domu opowiada historię twojej duszy.
              </Text>
            </View>
            <View style={[styles.statsRow, { borderColor: cardBorder }]}>
              {[['☉', 'Słońce', '♈'], ['☽', 'Księżyc', '♋'], ['↑', 'Ascendent', '♎']].map(([sym, label, sign]) => (
                <View key={label} style={[styles.statItem, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={{ color: ACCENT, fontSize: 20 }}>{sym}</Text>
                  <Text style={{ color: subColor, fontSize: 10, letterSpacing: 1 }}>{label.toUpperCase()}</Text>
                  <Text style={{ color: textColor, fontSize: 18 }}>{sign}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'planets' && PLANETS.map((planet, i) => (
          <Animated.View key={planet.sym} entering={FadeInDown.delay(60 + i * 40).duration(400)}>
            <View style={[styles.planetCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={[styles.planetIcon, { backgroundColor: planet.color + '22' }]}>
                <Text style={{ color: planet.color, fontSize: 18, fontWeight: '700' }}>{planet.sym}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>{planet.name}</Text>
                <Text style={{ color: subColor, fontSize: 12 }}>w znaku {ZODIAC_SYMBOLS[planet.sign]}</Text>
              </View>
              <View style={[styles.signBadge, { backgroundColor: ZODIAC_COLORS[planet.sign] + '22', borderColor: ZODIAC_COLORS[planet.sign] + '44' }]}>
                <Text style={{ color: ZODIAC_COLORS[planet.sign], fontSize: 16 }}>{ZODIAC_SYMBOLS[planet.sign]}</Text>
              </View>
            </View>
          </Animated.View>
        ))}

        {activeTab === 'houses' && HOUSES.map((house, i) => (
          <Animated.View key={house.n} entering={FadeInDown.delay(60 + i * 35).duration(400)}>
            <Pressable onPress={() => setExpandedHouse(house.n === expandedHouse ? null : house.n)}
              style={[styles.houseCard, { backgroundColor: cardBg, borderColor: expandedHouse === house.n ? ACCENT + '44' : cardBorder }]}>
              <View style={[styles.houseNum, { backgroundColor: ACCENT + '22' }]}>
                <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '700' }}>{house.n}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>Dom {house.n}: {house.title}</Text>
                {expandedHouse === house.n && <Text style={{ color: subColor, fontSize: 12, lineHeight: 18, marginTop: 4 }}>{house.desc}</Text>}
              </View>
            </Pressable>
          </Animated.View>
        ))}

                <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 16, backgroundColor: "#F59E0B22", borderWidth: 1, borderColor: "#F59E0B", padding: 16 }}>
          <Text style={{ color: "#F59E0B", fontWeight: "700", fontSize: 13, letterSpacing: 1, marginBottom: 8 }}>AI INTERPRETACJA KARTY</Text>
          {natalAiInsight ? (
            <Text style={{ color: "#E5E7EB", fontSize: 14, lineHeight: 22 }}>{natalAiInsight}</Text>
          ) : null}
          <Pressable onPress={fetchNatalAi} disabled={natalAiLoading} style={{ marginTop: 12, backgroundColor: "#F59E0B", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
            <Text style={{ color: "#1F1035", fontWeight: "700", fontSize: 14 }}>{natalAiLoading ? "Interpretuję..." : "Interpretuj"}</Text>
          </Pressable>
        </View>
<EndOfContentSpacer />
      </ScrollView>
        </SafeAreaView>
</View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingBottom: 12, gap: 12, paddingTop: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  starBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.08)' },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: layout.padding.screen, marginBottom: 12 },
  tabChip: { flex: 1, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)', backgroundColor: 'rgba(245,158,11,0.06)', alignItems: 'center' },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  infoCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statItem: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4 },
  planetCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 7 },
  planetIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  signBadge: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  houseCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 6 },
  houseNum: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
