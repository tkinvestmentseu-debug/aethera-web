// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View, Dimensions, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Line, Text as SvgText, Polygon } from 'react-native-svg';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, Star, BarChart3 } from 'lucide-react-native';
import { getResolvedTheme, isLightBg } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#F59E0B';
const WHEEL_R = 130;
const CENTER = SW / 2;

const AREAS = [
  { id: 'career', label: 'Kariera', icon: '💼', color: '#60A5FA' },
  { id: 'health', label: 'Zdrowie', icon: '💪', color: '#34D399' },
  { id: 'love', label: 'Miłość', icon: '❤️', color: '#F472B6' },
  { id: 'family', label: 'Rodzina', icon: '👨‍👩‍👧', color: '#FBBF24' },
  { id: 'money', label: 'Finanse', icon: '💰', color: '#A78BFA' },
  { id: 'growth', label: 'Rozwój', icon: '📚', color: '#818CF8' },
  { id: 'social', label: 'Relacje', icon: '🤝', color: '#F97316' },
  { id: 'joy', label: 'Radość', icon: '🌟', color: '#EC4899' },
];

const WheelSvg = ({ scores, isDark }: { scores: Record<string, number>; isDark: boolean }) => {
  const n = AREAS.length;
  const angleStep = (2 * Math.PI) / n;
  const cx = WHEEL_R + 20;
  const cy = WHEEL_R + 20;
  const size = (WHEEL_R + 20) * 2;

  const spiderPoints = AREAS.map((area, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = ((scores[area.id] || 5) / 10) * WHEEL_R;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  const spiderPath = spiderPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  const gridPoints = (value: number) => AREAS.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (value / 10) * WHEEL_R;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="wheelGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={ACCENT} stopOpacity="0.2" />
          <Stop offset="100%" stopColor={ACCENT} stopOpacity="0.02" />
        </RadialGradient>
      </Defs>
      {[2, 4, 6, 8, 10].map(v => (
        <Polygon key={v} points={gridPoints(v)} stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(122,95,54,0.18)'} strokeWidth={0.7} fill="none" />
      ))}
      {AREAS.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return <Line key={i} x1={cx} y1={cy} x2={cx + WHEEL_R * Math.cos(angle)} y2={cy + WHEEL_R * Math.sin(angle)} stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,246,230,0.92)'} strokeWidth={0.7} />;
      })}
      <Polygon points={spiderPoints.map(p => `${p.x},${p.y}`).join(' ')} fill={ACCENT} fillOpacity={0.18} stroke={ACCENT} strokeWidth={1.5} />
      {AREAS.map((area, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelR = WHEEL_R + 14;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);
        return (
          <G key={area.id}>
            <Circle cx={spiderPoints[i].x} cy={spiderPoints[i].y} r={4} fill={area.color} />
            <SvgText x={x} y={y + 4} textAnchor="middle" fontSize={9} fill={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}>{area.icon}</SvgText>
          </G>
        );
      })}
      <Circle cx={cx} cy={cy} r={4} fill={ACCENT} opacity={0.6} />
    </Svg>
  );
};

export const LifeWheelScreen = ({ navigation }: any) => {
    const themeName = useAppStore(s => s.themeName);
  const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const currentTheme = getResolvedTheme(themeName, userData?.preferences?.colorScheme);
  const isDark = !isLightBg(currentTheme.background);
  const isLight = !isDark;
  const textColor = isLight ? '#1A0800' : '#FFF7E6';
  const subColor = isLight ? 'rgba(26,8,0,0.5)' : 'rgba(255,247,230,0.5)';
  const { t } = useTranslation();
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';

  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(AREAS.map(a => [a.id, 5]))
  );
  const [editArea, setEditArea] = useState<string | null>(null);

  const [aiAssessment, setAiAssessment] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  const fetchAiAssessment = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    HapticsService.impactLight();
    try {
      const scoreList = AREAS.map(a => a.label + ": " + scores[a.id] + "/10").join(", ");
      const lowestAreas = AREAS.slice().sort((a, b) => scores[a.id] - scores[b.id]).slice(0, 3).map(a => a.label).join(", ");
      const prompt = "Moje oceny kol zycia: " + scoreList + ". Najslabsze obszary to: " + lowestAreas + ". Daj mi krotka (4-5 zdan) duchowa i praktycznaocene mojego kola zycia. Zasugeruj jeden konkretny rytual lub dzialanie dla najslabszego obszaru.";
      const result = await AiService.chatWithOracle(prompt);
      setAiAssessment(result);
    } catch (e) {
      setAiAssessment("Nie udalo sie pobrac oceny. Sprobuj ponownie.");
    } finally {
      setAiLoading(false);
    }
  };

  const totalScore = Object.values(scores).reduce((s, v) => s + v, 0) / AREAS.length;
  const lowest = AREAS.slice().sort((a, b) => (scores[a.id] || 0) - (scores[b.id] || 0)).slice(0, 3);

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={isDark ? ['#0A0600', '#120900', '#1A0E00'] : ['#FFFBF0', '#FFF8E8', '#FFF4D8']} style={StyleSheet.absoluteFill} />
      </View>
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2 }}>{t('lifeWheel.eyebrow').toUpperCase()}</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>{t('lifeWheel.title')}</Text>
        </View>
        <Pressable style={styles.starBtn} hitSlop={12} onPress={() => { HapticsService.impact('light'); if (isFavoriteItem('life-wheel')) { removeFavoriteItem('life-wheel'); } else { addFavoriteItem({ id: 'life-wheel', label: 'Koło życia', route: 'LifeWheel', params: {}, icon: 'BarChart3', color: ACCENT, addedAt: new Date().toISOString() }); } }}>
          <Star size={18} color={isFavoriteItem('life-wheel') ? ACCENT : subColor} strokeWidth={1.8} fill={isFavoriteItem('life-wheel') ? ACCENT : 'none'} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen }}>
        {/* Wheel */}
        <Animated.View entering={FadeInDown.delay(60).duration(600)} style={{ alignItems: 'center', marginBottom: 16 }}>
          <WheelSvg scores={scores} isDark={isDark} />
          <View style={[styles.scoreBox, { backgroundColor: ACCENT + '20', borderColor: ACCENT + '40' }]}>
            <Text style={{ color: ACCENT, fontSize: 28, fontWeight: '200' }}>{totalScore.toFixed(1)}</Text>
            <Text style={{ color: subColor, fontSize: 11, letterSpacing: 2 }}>ŚREDNIA</Text>
          </View>
        </Animated.View>

        <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginBottom: 10 }}>OCENA OBSZARÓW (1-10)</Text>
        {AREAS.map((area, i) => (
          <Animated.View key={area.id} entering={FadeInDown.delay(80 + i * 40).duration(400)}>
            <Pressable onPress={() => setEditArea(area.id === editArea ? null : area.id)}
              style={[styles.areaCard, { backgroundColor: editArea === area.id ? area.color + '18' : cardBg, borderColor: editArea === area.id ? area.color + '44' : cardBorder }]}>
              <Text style={{ fontSize: 20 }}>{area.icon}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>{area.label}</Text>
                  <Text style={{ color: area.color, fontSize: 18, fontWeight: '300' }}>{scores[area.id]}</Text>
                </View>
                <View style={[styles.scoreBar, { backgroundColor: area.color + '22' }]}>
                  <View style={[styles.scoreFill, { width: `${(scores[area.id] / 10) * 100}%`, backgroundColor: area.color }]} />
                </View>
                {editArea === area.id && (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                      <Pressable key={v} onPress={() => { HapticsService.impactLight(); setScores(p => ({ ...p, [area.id]: v })); }}
                        style={[styles.scoreBtn, { backgroundColor: scores[area.id] === v ? area.color : area.color + '22', borderColor: area.color + '44' }]}>
                        <Text style={{ color: scores[area.id] === v ? '#fff' : area.color, fontSize: 12, fontWeight: '700' }}>{v}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </Pressable>
          </Animated.View>
        ))}

        <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginTop: 16, marginBottom: 10 }}>OBSZARY DO PRACY</Text>
        {lowest.map((area, i) => (
          <View key={area.id} style={[styles.focusCard, { backgroundColor: area.color + '12', borderColor: area.color + '28' }]}>
            <Text style={{ fontSize: 18 }}>{area.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>{area.label}: {scores[area.id]}/10</Text>
              <Text style={{ color: subColor, fontSize: 12 }}>Wymaga największej uwagi</Text>
            </View>
            <View style={[styles.rankBadge, { backgroundColor: area.color + '22' }]}>
              <Text style={{ color: area.color, fontSize: 11, fontWeight: '700' }}>#{i + 1}</Text>
            </View>
          </View>
        ))}

        <View style={[wheelAiStyles.card, { backgroundColor: ACCENT + "10", borderColor: ACCENT + "30" }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginTop: 8 }}>
            <Text style={{ color: ACCENT, fontSize: 13, fontWeight: "700", letterSpacing: 1 }}>{"AI OCENA KOLA"}</Text>
            <Pressable onPress={fetchAiAssessment} disabled={aiLoading}
              style={[wheelAiStyles.btn, { backgroundColor: ACCENT }]}>
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                {aiLoading ? "..." : "Analizuj"}
              </Text>
            </Pressable>
          </View>
          {aiAssessment ? (
            <Text style={{ color: textColor, fontSize: 13, lineHeight: 22, fontStyle: "italic" }}>{aiAssessment}</Text>
          ) : (
            <Text style={{ color: subColor, fontSize: 12, lineHeight: 20 }}>
              {"Ocen wszystkie obszary, a nastepnie nacisnij Analizuj aby otrzymac spersonalizowana interpretacje i sugestie."}
            </Text>
          )}
        </View>

        <EndOfContentSpacer />
      </ScrollView>
        </SafeAreaView>
</View>
  );
};

const wheelAiStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 12, marginBottom: 4 },
  btn:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
});

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingBottom: 12, gap: 12, paddingTop: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  starBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.08)' },
  scoreBox: { borderRadius: 16, borderWidth: 1, padding: 14, alignItems: 'center', marginTop: -10 },
  areaCard: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 7, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  scoreBar: { height: 4, borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: 2 },
  scoreBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  focusCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 7 },
  rankBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});
