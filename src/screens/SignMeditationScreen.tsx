// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, Dimensions, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, useAnimatedProps, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, Star, Play, Pause, RotateCcw } from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';

const { width: SW } = Dimensions.get('window');

const AnimCircle = Animated.createAnimatedComponent(Circle);

const SIGNS = [
  { name: 'Baran', sym: '♈', color: '#EF4444', element: 'Ogień', mantra: 'Działam i tworzę', affirmation: 'Mam w sobie moc działania. Moja odwaga toruje nową drogę.', meditation: 'Wyobraź sobie płomień w centrum swojej klatki piersiowej. Z każdym wdechem rośnie i rozszerza się przez całe ciało. Jesteś ogniem i siłą.' },
  { name: 'Byk', sym: '♉', color: '#84CC16', element: 'Ziemia', mantra: 'Jestem i mam', affirmation: 'Moje ciało i zmysły są bramą do bogactwa. Zasługuję na przyjemność.', meditation: 'Poczuj ciężar swojego ciała. Stopy zakorzenione w ziemi jak dąb. Wzrastasz spokojnie, pewnie, z głębin ziemi.' },
  { name: 'Bliźnięta', sym: '♊', color: '#FBBF24', element: 'Powietrze', mantra: 'Myślę i komunikuję', affirmation: 'Mój umysł jest jasny i ciekaw. Słowa płyną z mądrości.', meditation: 'Wyobraź sobie wiatr przez twoją głowę niosący jasność. Wszystkie myśli są jak chmury przepływające. Obserwujesz je bez przywiązania.' },
  { name: 'Rak', sym: '♋', color: '#C4B5FD', element: 'Woda', mantra: 'Czuję i chronię', affirmation: 'Moje serce jest bezpiecznym schronieniem. Moja wrażliwość jest darem.', meditation: 'Otocz się miękką, srebrną mgłą księżyca. Twoje serce jest domem — ciepłym, bezpiecznym i pełnym miłości.' },
  { name: 'Lew', sym: '♌', color: '#F59E0B', element: 'Ogień', mantra: 'Świecę i wyrażam', affirmation: 'Moje serce jest słońcem. Mój blask ogrzewa i inspiruje innych.', meditation: 'Wyobraź sobie złote słońce w sercu. Z każdym oddechem promienie rozchodzą się przez ciało. Promieniujesz ciepłem i radością.' },
  { name: 'Panna', sym: '♍', color: '#34D399', element: 'Ziemia', mantra: 'Analizuję i doskonalę', affirmation: 'Służę z miłości, nie z obowiązku. Mój porządek jest wyrazem troski.', meditation: 'Wyobraź sobie swoją umiejętność jako łan zboża — każde ziarno jest doskonałe. Twoja praca jest rytuałem mądrości.' },
  { name: 'Waga', sym: '♎', color: '#60A5FA', element: 'Powietrze', mantra: 'Harmonizuję i łączę', affirmation: 'Przynoszę równowagę. Moje relacje są harmonijnym tańcem.', meditation: 'Wyobraź sobie wagi w sercu — lekkie jak powietrze. Każda relacja to muzyka. Znajdź tę nutę, która łączy.' },
  { name: 'Skorpion', sym: '♏', color: '#7C3AED', element: 'Woda', mantra: 'Transformuję i głębię', affirmation: 'Moja głębia jest darem. Transformuję ból w mądrość.', meditation: 'Zanurz się w ciemne wody swojej nieświadomości. Nie bój się — na dnie jest skarb. Twoja siła rodzi się z najgłębszych otchłani.' },
  { name: 'Strzelec', sym: '♐', color: '#F97316', element: 'Ogień', mantra: 'Szukam i odkrywam', affirmation: 'Moja wolność jest moją świadomością. Moje strzały trafiają w prawdę.', meditation: 'Wyobraź sobie otwartą przestrzeń bez horyzontu. Twoja strzała leci w kierunku prawdy. Jesteś wolny/a i pełen/na możliwości.' },
  { name: 'Koziorożec', sym: '♑', color: '#78716C', element: 'Ziemia', mantra: 'Buduję i odpowiadam', affirmation: 'Moja wytrwałość tworzy trwałe dzieła. Moje fundamenty są z granitu.', meditation: 'Wyobraź sobie górę — cierpliwą, starą, nieporuszoną. Ty jesteś tą górą. Z jej szczytu widzisz wszystko jasno.' },
  { name: 'Wodnik', sym: '♒', color: '#22D3EE', element: 'Powietrze', mantra: 'Budzę i wyzwalam', affirmation: 'Moja wyjątkowość jest darem dla świata. Budzę nowe możliwości.', meditation: 'Wyobraź sobie elektryczny prąd biegnący przez ciało — ożywczy, przyszłościowy. Jesteś falą zmiany w oceanie czasu.' },
  { name: 'Ryby', sym: '♓', color: '#818CF8', element: 'Woda', mantra: 'Czuję jedność', affirmation: 'Jestem połączony/a ze wszystkim. Moje sny są bramą do mądrości duszy.', meditation: 'Wyobraź sobie ocean — jesteś falą i oceanem jednocześnie. Twoja wrażliwość to most między światami. Płyniesz z prądem Wszechświata.' },
];

export const SignMeditationScreen = ({ navigation }: any) => {
  const { themeName, userData, addFavoriteItem, isFavoriteItem, removeFavoriteItem } = useAppStore();
  const currentTheme = getResolvedTheme(themeName, userData?.preferences?.colorScheme);
  const isDark = !currentTheme.background.startsWith('#F');
  const isLight = !isDark;
  const textColor = isLight ? '#0A0020' : '#F5F0FF';
  const subColor = isLight ? 'rgba(10,0,32,0.5)' : 'rgba(245,240,255,0.5)';
  const { t } = useTranslation();
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';

  const { userData: ud } = useAppStore();
  const userSign = ud?.zodiacSign || 'Baran';
  const [activeSign, setActiveSign] = useState(() => SIGNS.find(s => s.name === userSign) || SIGNS[0]);
  const [activeTab, setActiveTab] = useState<'meditation' | 'affirmation' | 'signs'>('meditation');
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<any>(null);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  const breathScale = useSharedValue(1);
  const glowPulse = useSharedValue(0.4);
  useEffect(() => {
    glowPulse.value = withRepeat(withSequence(withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }), withTiming(0.4, { duration: 3000 })), -1);
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowPulse.value }));

  const toggleTimer = () => {
    if (timerRunning) { clearInterval(intervalRef.current); setTimerRunning(false); }
    else { setTimerRunning(true); intervalRef.current = setInterval(() => setElapsed(p => p + 1), 1000); }
  };
  useEffect(() => () => clearInterval(intervalRef.current), []);
  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const fetchAiInsight = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    HapticsService.impactLight();
    try {
      const prompt = "Jestem urodzony pod znakiem " + activeSign.name + " (" + activeSign.element + "). Mantra: " + activeSign.mantra + ". Napisz krotka (3-4 zdania) interpretacje mojej dzisiejszej medytacji i afirmacji. Skup sie na praktycznym przeslaniu na dzis.";
      const result = await AiService.chatWithOracle(prompt);
      setAiInsight(result);
    } catch (e) {
      setAiInsight("Nie udalo sie pobrac interpretacji. Sprobuj ponownie.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }} edges={['top']}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={isDark ? ['#06030F', '#0A0520', '#0E0830'] : ['#F5F0FF', '#F2EEFF', '#EFE8FF']} style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
          <Svg width={SW} height={400} style={{ position: 'absolute', top: 40 }}>
            <Defs>
              <RadialGradient id="signGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={activeSign.color} stopOpacity={isDark ? "0.25" : "0.12"} />
                <Stop offset="100%" stopColor={activeSign.color} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={SW / 2} cy={160} r={140} fill="url(#signGlow)" />
            <SvgText x={SW / 2} y={180} textAnchor="middle" fontSize={90} fill={activeSign.color} opacity={isDark ? 0.18 : 0.08}>{activeSign.sym}</SvgText>
          </Svg>
        </Animated.View>
      </View>

      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2 }}>{t('signMeditation.eyebrow').toUpperCase()}</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>{t('signMeditation.title')}</Text>
        </View>
        <Pressable style={[styles.starBtn, { borderColor: activeSign.color + '40' }]} hitSlop={12} onPress={() => { HapticsService.impact('light'); if (isFavoriteItem('sign-meditation')) { removeFavoriteItem('sign-meditation'); } else { addFavoriteItem({ id: 'sign-meditation', label: 'Medytacja znaku', route: 'SignMeditation', params: {}, icon: 'Star', color: activeSign.color, addedAt: new Date().toISOString() }); } }}>
          <Star size={18} color={isFavoriteItem('sign-meditation') ? activeSign.color : subColor} strokeWidth={1.8} fill={isFavoriteItem('sign-meditation') ? activeSign.color : 'none'} />
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {([['meditation', t('signMeditation.tabMeditation')], ['affirmation', t('signMeditation.tabAffirmations')], ['signs', t('lucidDreaming.tabSigns')]] as const).map(([tab, label]) => {
          const active = activeTab === tab;
          return (
            <Pressable key={tab} onPress={() => { HapticsService.impactLight(); setActiveTab(tab); }}
              style={[styles.tabChip, active && { backgroundColor: activeSign.color, borderColor: activeSign.color }]}>
              <Text style={[styles.tabLabel, { color: active ? '#fff' : subColor }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen }}>
        {activeTab === 'meditation' && (
          <>
            <Animated.View entering={FadeInDown.delay(60).duration(500)}>
              <View style={[styles.signHero, { backgroundColor: activeSign.color + '14', borderColor: activeSign.color + '30' }]}>
                <Text style={{ fontSize: 56 }}>{activeSign.sym}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: textColor, fontSize: 22, fontWeight: '800' }}>{activeSign.name}</Text>
                  <Text style={{ color: activeSign.color, fontSize: 12, letterSpacing: 2 }}>{activeSign.element.toUpperCase()} · {activeSign.mantra}</Text>
                </View>
              </View>

              <View style={[styles.meditationCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={{ color: textColor, fontSize: 14, lineHeight: 24, fontStyle: 'italic' }}>{activeSign.meditation}</Text>
              </View>

              <View style={[styles.timerCard, { backgroundColor: activeSign.color + '12', borderColor: activeSign.color + '25' }]}>
                <Text style={{ color: textColor, fontSize: 40, fontWeight: '100', letterSpacing: 3 }}>{fmt(elapsed)}</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable onPress={toggleTimer} style={[styles.playBtn, { backgroundColor: activeSign.color }]}>
                    {timerRunning ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" />}
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{timerRunning ? 'Pauza' : 'Start'}</Text>
                  </Pressable>
                  <Pressable onPress={() => { clearInterval(intervalRef.current); setTimerRunning(false); setElapsed(0); HapticsService.impactLight(); }}
                    style={[styles.resetBtn, { borderColor: activeSign.color + '44' }]}>
                    <RotateCcw size={14} color={activeSign.color} />
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          </>
        )}

        {activeTab === 'affirmation' && (
          <Animated.View entering={FadeInDown.delay(60).duration(500)}>
            <View style={[styles.affCard, { backgroundColor: activeSign.color + '14', borderColor: activeSign.color + '30' }]}>
              <Text style={{ color: activeSign.color, fontSize: 60, textAlign: 'center' }}>{activeSign.sym}</Text>
              <Text style={{ color: activeSign.color, fontSize: 11, letterSpacing: 3, textAlign: 'center', marginBottom: 16 }}>AFIRMACJA {activeSign.name.toUpperCase()}</Text>
              <Text style={{ color: textColor, fontSize: 17, lineHeight: 28, textAlign: 'center', fontStyle: 'italic', fontWeight: '600' }}>"{activeSign.affirmation}"</Text>
            </View>
            <View style={[styles.tipCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={{ color: textColor, fontSize: 13, lineHeight: 20 }}>
                Powtarzaj tę afirmację rano przez 3 minuty, patrząc w lustro. Poczuj jej prawdziwość w ciele, nie tylko w głowie.
              </Text>
            </View>
          </Animated.View>
        )}

        {activeTab === 'signs' && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SIGNS.map((sign, i) => (
              <Animated.View key={sign.name} entering={FadeInDown.delay(40 + i * 30).duration(350)}>
                <Pressable onPress={() => { HapticsService.impactLight(); setActiveSign(sign); setActiveTab('meditation'); }}
                  style={[styles.signChip, { backgroundColor: activeSign.name === sign.name ? sign.color + '30' : cardBg, borderColor: activeSign.name === sign.name ? sign.color : cardBorder }]}>
                  <Text style={{ fontSize: 18 }}>{sign.sym}</Text>
                  <Text style={{ color: textColor, fontSize: 11 }}>{sign.name}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}

        {(activeTab === "meditation" || activeTab === "affirmation") && (
          <View style={[signAiStyles.card, { backgroundColor: activeSign.color + "12", borderColor: activeSign.color + "30" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Text style={{ color: activeSign.color, fontSize: 13, fontWeight: "700", letterSpacing: 1 }}>{"AI INTERPRETACJA"}</Text>
              <Pressable onPress={fetchAiInsight} disabled={aiLoading}
                style={[signAiStyles.btn, { backgroundColor: activeSign.color }]}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                  {aiLoading ? "..." : "Interpretuj"}
                </Text>
              </Pressable>
            </View>
            {aiInsight ? (
              <Text style={{ color: textColor, fontSize: 13, lineHeight: 22, fontStyle: "italic" }}>{aiInsight}</Text>
            ) : (
              <Text style={{ color: subColor, fontSize: 12, lineHeight: 20 }}>
                {"Nacisnij Interpretuj aby uzyskac spersonalizowana interpretacje dla znaku " + activeSign.name + "."}
              </Text>
            )}
          </View>
        )}

        <EndOfContentSpacer />
      </ScrollView>
    </SafeAreaView>
  );
};

const signAiStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 12, marginBottom: 4 },
  btn:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
});

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingBottom: 12, gap: 12, paddingTop: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  starBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: layout.padding.screen, marginBottom: 12 },
  tabChip: { flex: 1, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(128,128,255,0.25)', backgroundColor: 'rgba(128,128,255,0.06)', alignItems: 'center' },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  signHero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  meditationCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  timerCard: { borderRadius: 14, borderWidth: 1, padding: 16, alignItems: 'center', gap: 12 },
  playBtn: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  resetBtn: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  affCard: { borderRadius: 20, borderWidth: 1, padding: 24, marginBottom: 12 },
  tipCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  signChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 4, minWidth: 70 },
});
