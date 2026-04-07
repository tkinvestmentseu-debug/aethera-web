// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeInDown, FadeIn } from 'react-native-reanimated';
import { ChevronLeft, Moon, Star, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
import { collection, onSnapshot, query, orderBy, limit, doc, runTransaction, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../core/config/firebase.config';
import { useAuthStore } from '../store/useAuthStore';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#818CF8';

const TRENDING = [
  { emoji: '🌊', name: 'Woda', trend: +18 },
  { emoji: '🐍', name: 'Wąż', trend: +34 },
  { emoji: '🏔', name: 'Góra', trend: -5 },
  { emoji: '🌕', name: 'Księżyc', trend: +22 },
  { emoji: '🔥', name: 'Ogień', trend: +11 },
  { emoji: '✈️', name: 'Lot', trend: +29 },
];

const SYMBOLS = [
  { emoji: '🌊', name: 'Woda', count: 312, meaning: 'Symbol emocji, nieświadomości i płynności zmian.', trend: +18 },
  { emoji: '🐍', name: 'Wąż', count: 198, meaning: 'Transformacja, uzdrowienie, wiedza ukryta pod powierzchnią.', trend: +34 },
  { emoji: '🌕', name: 'Księżyc', count: 276, meaning: 'Cykl, intuicja, połączenie z kobiecą mocą.', trend: +22 },
  { emoji: '🔥', name: 'Ogień', count: 241, meaning: 'Oczyszczenie, pasja, transformacja przez spalenie starych wzorców.', trend: +11 },
  { emoji: '🏔', name: 'Góra', count: 167, meaning: 'Cel, przeszkoda, wyzwanie duchowe wymagające wspinaczki.', trend: -5 },
  { emoji: '✈️', name: 'Lot', count: 224, meaning: 'Wolność, wznoszenie się ponad ograniczenia, nowy punkt widzenia.', trend: +29 },
];

const MOON_PHASES = [
  { phase: '🌑', name: 'Nów', symbols: 'Ciemność, pustka, nowe początki' },
  { phase: '🌒', name: 'Przybywający', symbols: 'Wzrost, nadzieja, ruch naprzód' },
  { phase: '🌕', name: 'Pełnia', symbols: 'Jasność, manifestacja, intensywne emocje' },
  { phase: '🌘', name: 'Ubywający', symbols: 'Uwalnianie, zakończenia, refleksja' },
];

const ARCHIVE = [
  { id: 'a1', date: '31.03', mood: 'spokojny', wordCount: 234 },
  { id: 'a2', date: '29.03', mood: 'żywy', wordCount: 189 },
  { id: 'a3', date: '27.03', mood: 'niespokojny', wordCount: 312 },
];

export const DreamSymbolsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { currentTheme, isLight } = useTheme();
  const tc = isLight ? '#1A1008' : '#F0ECE4';
  const sc = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';
  const cb = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const cbr = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)';

  const currentUser = useAuthStore(s => s.currentUser);
  const [symbols, setSymbols] = useState(SYMBOLS);
  const [trending, setTrending] = useState(TRENDING);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [dreamText, setDreamText] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [moods] = useState({ spokojny: 42, żywy: 38, niespokojny: 20 });
  const [reportedSymbols, setReportedSymbols] = useState<Set<string>>(new Set());

  const moonPulse = useSharedValue(1);
  useEffect(() => {
    moonPulse.value = withRepeat(withSequence(withTiming(1.1, { duration: 2000 }), withTiming(1, { duration: 2000 })), -1, false);
  }, []);

  // Real-time symbol trends from Firebase
  useEffect(() => {
    const q = query(collection(db, 'dreamSymbols'), orderBy('count', 'desc'), limit(12));
    const unsub = onSnapshot(q, (snap) => {
      if (snap.docs.length > 0) {
        const fbSymbols = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSymbols(fbSymbols.map(s => ({
          emoji: s.emoji ?? '🌊',
          name: s.name,
          count: s.count ?? 0,
          meaning: s.meaning ?? '',
          trend: s.trend ?? 0,
        })));
        setTrending(fbSymbols.slice(0, 6).map(s => ({
          emoji: s.emoji ?? '🌊',
          name: s.name,
          trend: s.trend ?? 0,
        })));
      }
    }, () => {/* keep seed data */});
    return () => unsub();
  }, []);

  const handleReportSymbol = (symbolName: string) => {
    if (reportedSymbols.has(symbolName)) return;
    setReportedSymbols(prev => new Set([...prev, symbolName]));
    HapticsService.impact('light');
    // Increment count in Firebase
    const symRef = doc(db, 'dreamSymbols', symbolName.toLowerCase().replace(/\s/g, '_'));
    runTransaction(db, async (tx) => {
      const snap = await tx.get(symRef);
      if (snap.exists()) {
        tx.update(symRef, { count: (snap.data().count ?? 0) + 1 });
      } else {
        const found = SYMBOLS.find(s => s.name === symbolName);
        tx.set(symRef, {
          name: symbolName,
          emoji: found?.emoji ?? '✨',
          meaning: found?.meaning ?? '',
          count: 1, trend: 0,
          createdAt: serverTimestamp(),
        });
      }
    }).catch(() => {});
  };
  const moonStyle = useAnimatedStyle(() => ({ transform: [{ scale: moonPulse.value }] }));

  const handleSubmitDream = async () => {
    if (!dreamText.trim()) return;
    HapticsService.impact('medium');
    setLoadingAi(true);
    // Write anonymous dream to community feed
    if (currentUser) {
      addDoc(collection(db, 'communityDreams'), {
        text: dreamText.trim(),
        anon: isAnon,
        authorId: isAnon ? null : currentUser.uid,
        authorName: isAnon ? 'Anonim' : currentUser.displayName,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    }
    try {
      const res = await AiService.chatWithOracle([{
        role: 'user',
        content: `Zanalizuj ten sen w stylu jungowskim, w języku użytkownika. Wskaż 3 symbole i ich znaczenie. Sen: "${dreamText}"`,
      }]);
      setAiResult(res);
    } catch {
      setAiResult('Woda w Twoim śnie symbolizuje nieuświadomione emocje szukające ujścia. Ruch, który czujesz we śnie, to zaproszenie do głębszego samopoznania.');
    }
    setLoadingAi(false);
    setDreamText('');
  };

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <LinearGradient
        colors={isLight ? ['#EEF2FF', '#E0E7FF', currentTheme.background] : ['#08061A', '#0E0A28', currentTheme.background]}
        style={StyleSheet.absoluteFill} pointerEvents="none"
      />
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={tc} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: tc }]}>Symbolarium Snów</Text>
          <Text style={[styles.headerSub, { color: ACCENT }]}>ZBIOROWE MARZENIA</Text>
        </View>
        <Animated.Text style={[{ fontSize: 24 }, moonStyle]}>🌕</Animated.Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

          {/* Tonight */}
          <View style={{ paddingHorizontal: layout.padding.screen, alignItems: 'center', marginTop: 8 }}>
            <View style={[styles.nightBadge, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '44' }]}>
              <Moon size={14} color={ACCENT} />
              <Text style={[styles.nightBadgeText, { color: ACCENT }]}>Wspólnota śniła 1 358 snów tej nocy</Text>
            </View>
          </View>

          {/* Trending Symbols */}
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.sectionTitle, { color: sc, paddingHorizontal: layout.padding.screen }]}>POPULARNE SYMBOLE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 8 }}>
              {TRENDING.map(s => (
                <View key={s.name} style={[styles.trendPill, { backgroundColor: cb, borderColor: cbr }]}>
                  <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                  <Text style={[styles.trendName, { color: tc }]}>{s.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    {s.trend > 0 ? <TrendingUp size={10} color="#10B981" /> : <TrendingDown size={10} color="#EF4444" />}
                    <Text style={{ fontSize: 10, color: s.trend > 0 ? '#10B981' : '#EF4444' }}>{s.trend > 0 ? '+' : ''}{s.trend}%</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Symbol Grid */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { color: sc }]}>SYMBOLARIUM</Text>
            <View style={styles.symbolGrid}>
              {SYMBOLS.map((s, i) => (
                <Animated.View key={s.name} entering={FadeInDown.delay(i * 60)} style={{ width: '48%' }}>
                  <Pressable
                    onPress={() => { HapticsService.impact('light'); setSelectedSymbol(selectedSymbol === s.name ? null : s.name); }}
                    style={[styles.symbolCard, { backgroundColor: selectedSymbol === s.name ? ACCENT + '22' : cb, borderColor: selectedSymbol === s.name ? ACCENT + '66' : cbr }]}
                  >
                    <Text style={{ fontSize: 32 }}>{s.emoji}</Text>
                    <Text style={[styles.symbolName, { color: tc }]}>{s.name}</Text>
                    <Text style={[styles.symbolCount, { color: sc }]}>{s.count} snów</Text>
                    {selectedSymbol === s.name && (
                      <Animated.View entering={FadeIn}>
                        <Text style={[styles.symbolMeaning, { color: sc }]}>{s.meaning}</Text>
                      </Animated.View>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Submit Dream */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { color: sc }]}>PODZIEL SIĘ SWOIM SNEM</Text>
            <View style={[styles.dreamInputCard, { backgroundColor: cb, borderColor: cbr }]}>
              <TextInput
                value={dreamText} onChangeText={setDreamText}
                placeholder="Opisz swój sen..." placeholderTextColor={sc}
                multiline style={[styles.dreamInput, { color: tc, minHeight: 100 }]}
              />
              <View style={styles.dreamFooter}>
                <Pressable onPress={() => setIsAnon(a => !a)} style={[styles.anonChip, { backgroundColor: isAnon ? ACCENT + '22' : cb, borderColor: isAnon ? ACCENT : cbr }]}>
                  <Text style={[{ fontSize: 12, fontWeight: '600' }, { color: isAnon ? ACCENT : sc }]}>
                    {isAnon ? '🔒 Anonimowo' : '👤 Moje imię'}
                  </Text>
                </Pressable>
                <Pressable onPress={handleSubmitDream} style={[styles.submitBtn, { backgroundColor: ACCENT }]}>
                  <Text style={styles.submitBtnText}>{loadingAi ? 'Analizuję...' : 'Interpretuj'}</Text>
                </Pressable>
              </View>
            </View>
            {!!aiResult && (
              <Animated.View entering={FadeIn} style={[styles.aiResultCard, { backgroundColor: ACCENT + '14', borderColor: ACCENT + '44' }]}>
                <Star size={14} color={ACCENT} style={{ marginBottom: 6 }} />
                <Text style={[styles.aiResultText, { color: tc }]}>{aiResult}</Text>
              </Animated.View>
            )}
          </View>

          {/* Collective Mood */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { color: sc }]}>NASTRÓJ ZBIOROWY DZIŚ</Text>
            <View style={[styles.moodCard, { backgroundColor: cb, borderColor: cbr }]}>
              {[{ label: 'Spokojny', pct: moods.spokojny, color: '#60A5FA' }, { label: 'Żywy', pct: moods.żywy, color: '#34D399' }, { label: 'Niespokojny', pct: moods.niespokojny, color: '#F87171' }].map(m => (
                <View key={m.label} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={[{ fontSize: 13 }, { color: tc }]}>{m.label}</Text>
                    <Text style={[{ fontSize: 13, fontWeight: '700' }, { color: m.color }]}>{m.pct}%</Text>
                  </View>
                  <View style={[styles.moodBar, { backgroundColor: cbr }]}>
                    <View style={[styles.moodFill, { width: `${m.pct}%`, backgroundColor: m.color }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Moon Phase Correlation */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { color: sc }]}>FAZY KSIĘŻYCA I SYMBOLE</Text>
            {MOON_PHASES.map((mp, i) => (
              <Animated.View key={mp.name} entering={FadeInDown.delay(i * 50)} style={[styles.moonPhaseRow, { backgroundColor: cb, borderColor: cbr }]}>
                <Text style={{ fontSize: 24, width: 36 }}>{mp.phase}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.moonPhaseName, { color: tc }]}>{mp.name}</Text>
                  <Text style={[{ fontSize: 12, lineHeight: 18 }, { color: sc }]}>{mp.symbols}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Archive */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { color: sc }]}>TWOJE SENNE ARCHIWUM</Text>
            {ARCHIVE.map(a => (
              <View key={a.id} style={[styles.archiveRow, { backgroundColor: cb, borderColor: cbr }]}>
                <Moon size={14} color={ACCENT} />
                <Text style={[{ fontSize: 13 }, { color: sc }]}>{a.date}</Text>
                <Text style={[{ fontSize: 13, flex: 1 }, { color: tc }]}>Nastrój: {a.mood}</Text>
                <Text style={[{ fontSize: 12 }, { color: sc }]}>{a.wordCount} słów</Text>
              </View>
            ))}
          </View>

          <EndOfContentSpacer />
        </ScrollView>
      </KeyboardAvoidingView>
        </SafeAreaView>
</View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingVertical: 12 },
  backBtn: { width: 38, height: 38, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 1 },
  nightBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  nightBadgeText: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  trendPill: { flexDirection: 'column', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, gap: 2 },
  trendName: { fontSize: 12, fontWeight: '600' },
  symbolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  symbolCard: { padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 4 },
  symbolName: { fontSize: 14, fontWeight: '700' },
  symbolCount: { fontSize: 11 },
  symbolMeaning: { fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 4 },
  dreamInputCard: { padding: 14, borderRadius: 14, borderWidth: 1 },
  dreamInput: { fontSize: 14, lineHeight: 22, textAlignVertical: 'top' },
  dreamFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 10 },
  anonChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  submitBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  aiResultCard: { marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  aiResultText: { fontSize: 14, lineHeight: 22 },
  moodCard: { padding: 16, borderRadius: 14, borderWidth: 1 },
  moodBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  moodFill: { height: 6, borderRadius: 3 },
  moonPhaseRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  moonPhaseName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  archiveRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
});
