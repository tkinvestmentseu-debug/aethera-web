// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions, TextInput, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeInDown, FadeIn, withSpring } from 'react-native-reanimated';
import { ChevronLeft, Sparkles, Send, Users, Eye } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
import { collection, addDoc, onSnapshot, query, orderBy, limit, doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../core/config/firebase.config';
import { useAuthStore } from '../store/useAuthStore';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#10B981';

const CATEGORIES = ['MIŁOŚĆ', 'OBFITOŚĆ', 'ZDROWIE', 'SPOKÓJ', 'TRANSFORMACJA'];
const CAT_COLORS = { MIŁOŚĆ: '#EC4899', OBFITOŚĆ: '#F59E0B', ZDROWIE: '#10B981', SPOKÓJ: '#60A5FA', TRANSFORMACJA: '#8B5CF6' };

const INITIAL_INTENTIONS = [
  { id: 'i1', text: 'Proszę o otwartość serca i gotowość na miłość, która już jest w drodze.', category: 'MIŁOŚĆ', time: '5 min temu', witnesses: 34, anon: false, name: 'Luna' },
  { id: 'i2', text: 'Manifestuję obfitość — w energii, w relacjach, w każdym aspekcie życia.', category: 'OBFITOŚĆ', time: '12 min temu', witnesses: 27, anon: true, name: null },
  { id: 'i3', text: 'Proszę o spokój umysłu i zdolność do oddychania w trudnych chwilach.', category: 'SPOKÓJ', time: '28 min temu', witnesses: 51, anon: false, name: 'Orion' },
  { id: 'i4', text: 'Transformuję stare wzorce i wybieram nową wersję siebie z miłością.', category: 'TRANSFORMACJA', time: '1h temu', witnesses: 89, anon: true, name: null },
  { id: 'i5', text: 'Wysyłam intencję zdrowia i witalności dla siebie i wszystkich bliskich.', category: 'ZDROWIE', time: '2h temu', witnesses: 43, anon: false, name: 'Vera' },
];

const MY_INTENTIONS = [
  { id: 'my1', text: 'Otwieram się na nowe możliwości z ufnością.', category: 'TRANSFORMACJA', witnesses: 12 },
  { id: 'my2', text: 'Wybieram spokój zamiast strachu każdego ranka.', category: 'SPOKÓJ', witnesses: 8 },
  { id: 'my3', text: 'Jestem gotowa(y) na obfitość we wszystkich formach.', category: 'OBFITOŚĆ', witnesses: 19 },
];

export const IntentionChamberScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { currentTheme, isLight } = useTheme();
  const currentUser = useAuthStore(s => s.currentUser);
  const tc = isLight ? '#1A1008' : '#F0ECE4';
  const sc = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';
  const cb = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const cbr = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)';

  const [selectedCat, setSelectedCat] = useState('MIŁOŚĆ');
  const [intentionText, setIntentionText] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  const [sent, setSent] = useState(false);
  const [intentions, setIntentions] = useState(INITIAL_INTENTIONS);
  const [witnessedIds, setWitnessedIds] = useState<string[]>([]);

  const glowScale = useSharedValue(1);
  const flyY = useSharedValue(0);
  const flyOpacity = useSharedValue(0);

  useEffect(() => {
    glowScale.value = withRepeat(withSequence(withTiming(1.12, { duration: 2500 }), withTiming(1, { duration: 2500 })), -1, false);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'globalIntentions'), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      if (snap.docs.length > 0) {
        const fbIntentions = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            text: data.text,
            category: data.category,
            witnesses: data.witnesses ?? 0,
            anon: data.anon ?? false,
            name: data.anon ? null : data.authorName,
            time: (() => {
              const diff = Date.now() - (data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now());
              const min = Math.floor(diff / 60000);
              if (min < 1) return 'teraz';
              if (min < 60) return `${min} min temu`;
              return `${Math.floor(min / 60)}h temu`;
            })(),
          };
        });
        setIntentions(fbIntentions);
      }
    }, () => {/* silently keep seed data on error */});
    return () => unsub();
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ transform: [{ scale: glowScale.value }] }));
  const flyStyle = useAnimatedStyle(() => ({ transform: [{ translateY: flyY.value }], opacity: flyOpacity.value }));

  const handleSend = () => {
    if (!intentionText.trim()) return;
    HapticsService.impact('heavy');
    const newItem = {
      id: Date.now().toString(), text: intentionText.trim(), category: selectedCat,
      time: 'teraz', witnesses: 0, anon: isAnon, name: isAnon ? null : 'Ty',
    };
    setIntentions(prev => [newItem, ...prev]);
    if (currentUser && intentionText.trim()) {
      addDoc(collection(db, 'globalIntentions'), {
        text: intentionText.trim(),
        category: selectedCat,
        anon: isAnon,
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        witnesses: 0,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    }
    setSent(true);
    flyOpacity.value = withTiming(1, { duration: 200 });
    flyY.value = withTiming(-60, { duration: 1200 });
    setTimeout(() => {
      flyY.value = 0; flyOpacity.value = 0;
      setSent(false); setIntentionText('');
    }, 2000);
  };

  const handleWitness = (id: string) => {
    if (witnessedIds.includes(id)) return;
    HapticsService.impact('light');
    setWitnessedIds(prev => [...prev, id]);
    setIntentions(prev => prev.map(i => i.id === id ? { ...i, witnesses: i.witnesses + 1 } : i));
    if (currentUser) {
      const ref = doc(db, 'globalIntentions', id);
      runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists()) tx.update(ref, { witnesses: (snap.data().witnesses ?? 0) + 1 });
      }).catch(() => {});
    }
  };

  const catColor = CAT_COLORS[selectedCat] || ACCENT;

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <LinearGradient
        colors={isLight ? ['#ECFDF5', '#D1FAE5', currentTheme.background] : ['#021A0E', '#031A0F', currentTheme.background]}
        style={StyleSheet.absoluteFill} pointerEvents="none"
      />
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={tc} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: tc }]}>Komora Intencji</Text>
          <Text style={[styles.headerSub, { color: ACCENT }]}>MANIFESTACJA ZBIOROWA</Text>
        </View>
        <Sparkles size={20} color={ACCENT} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

          {/* Hero quote */}
          <View style={{ paddingHorizontal: layout.padding.screen, alignItems: 'center', marginTop: 8, marginBottom: 20 }}>
            <Animated.View style={[styles.heroGlow, { borderColor: ACCENT + '30' }, glowStyle]} />
            <Text style={[styles.heroQuote, { color: tc }]}>
              Każda intencja wysłana{'\n'}z miłością zmienia rzeczywistość
            </Text>
          </View>

          {/* Composer */}
          <View style={{ paddingHorizontal: layout.padding.screen }}>
            <Text style={[styles.sectionTitle, { color: sc }]}>STWÓRZ INTENCJĘ</Text>
            <View style={[styles.composerCard, { backgroundColor: cb, borderColor: cbr }]}>
              {/* Category chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
                {CATEGORIES.map(cat => {
                  const col = CAT_COLORS[cat];
                  return (
                    <Pressable key={cat} onPress={() => { HapticsService.impact('light'); setSelectedCat(cat); }}
                      style={[styles.catChip, { backgroundColor: selectedCat === cat ? col + '28' : 'transparent', borderColor: selectedCat === cat ? col : cbr }]}>
                      <Text style={[styles.catChipText, { color: selectedCat === cat ? col : sc }]}>{cat}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <TextInput
                value={intentionText} onChangeText={setIntentionText}
                placeholder="Wpisz swoją intencję..." placeholderTextColor={sc}
                multiline textAlign="center"
                style={[styles.intentionInput, { color: tc, minHeight: 120, borderColor: cbr }]}
              />

              {/* Anon toggle */}
              <View style={styles.anonRow}>
                <Text style={[{ fontSize: 13 }, { color: sc }]}>Anonimowo</Text>
                <Switch value={isAnon} onValueChange={setIsAnon} trackColor={{ false: cbr, true: ACCENT + '88' }} thumbColor={isAnon ? ACCENT : sc} />
              </View>

              {/* Send button */}
              <View style={{ alignItems: 'center' }}>
                <Animated.View style={[styles.flyText, flyStyle]}>
                  <Text style={{ color: catColor, fontSize: 18, fontWeight: '700' }}>✦ Intencja wysłana ✦</Text>
                </Animated.View>
                <Pressable onPress={handleSend} style={{ width: '100%' }}>
                  <LinearGradient colors={[catColor, catColor + 'CC']} style={styles.sendBtn}>
                    <Send size={18} color="#fff" />
                    <Text style={styles.sendBtnText}>Wyślij intencję w kosmos</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Energy Meter */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { color: sc }]}>ENERGIA ZBIOROWA</Text>
            <View style={[styles.energyCard, { backgroundColor: cb, borderColor: cbr }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={[{ fontSize: 14, fontWeight: '600' }, { color: tc }]}>Poziom rezonansu</Text>
                <Text style={[{ fontSize: 16, fontWeight: '800' }, { color: ACCENT }]}>74%</Text>
              </View>
              <View style={[styles.energyBar, { backgroundColor: cbr }]}>
                <Animated.View style={[styles.energyFill, { width: '74%', backgroundColor: ACCENT }]} />
              </View>
              <Text style={[{ fontSize: 12, marginTop: 8 }, { color: sc }]}>1 247 aktywnych intencji w tej chwili</Text>
            </View>
          </View>

          {/* Feed */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { color: sc }]}>INTENCJE ZBIOROWE</Text>
            {intentions.map((item, i) => {
              const col = CAT_COLORS[item.category] || ACCENT;
              const witnessed = witnessedIds.includes(item.id);
              return (
                <Animated.View key={item.id} entering={FadeInDown.delay(i * 60)}>
                  <View style={[styles.intentionCard, { backgroundColor: cb, borderColor: cbr }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <View style={[styles.catBadge, { backgroundColor: col + '22', borderColor: col + '55' }]}>
                        <Text style={[{ fontSize: 10, fontWeight: '700' }, { color: col }]}>{item.category}</Text>
                      </View>
                      <Text style={[{ fontSize: 11 }, { color: sc }]}>{item.anon ? 'Anonimowo' : item.name}</Text>
                      <Text style={[{ fontSize: 11, marginLeft: 'auto' }, { color: sc }]}>{item.time}</Text>
                    </View>
                    <Text style={[styles.intentionText, { color: tc }]}>{item.text}</Text>
                    <Pressable onPress={() => handleWitness(item.id)} style={styles.witnessRow}>
                      <Eye size={13} color={witnessed ? col : sc} />
                      <Text style={[styles.witnessCount, { color: witnessed ? col : sc }]}>{item.witnesses} świadków</Text>
                      {!witnessed && <Text style={[{ fontSize: 11 }, { color: col }]}>Świadkuj</Text>}
                    </Pressable>
                  </View>
                </Animated.View>
              );
            })}
          </View>

          {/* My Intentions */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { color: sc }]}>TWOJE INTENCJE</Text>
            {MY_INTENTIONS.map((mi, i) => {
              const col = CAT_COLORS[mi.category] || ACCENT;
              return (
                <View key={mi.id} style={[styles.myIntentionCard, { backgroundColor: cb, borderColor: cbr }]}>
                  <View style={[styles.catBadge, { backgroundColor: col + '22', borderColor: col + '55' }]}>
                    <Text style={[{ fontSize: 9, fontWeight: '700' }, { color: col }]}>{mi.category}</Text>
                  </View>
                  <Text style={[styles.myIntentionText, { color: tc }]} numberOfLines={2}>{mi.text}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Users size={12} color={sc} />
                    <Text style={[{ fontSize: 11 }, { color: sc }]}>{mi.witnesses} świadków</Text>
                  </View>
                </View>
              );
            })}
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
  heroGlow: { position: 'absolute', width: 220, height: 100, borderRadius: 110, borderWidth: 1 },
  heroQuote: { fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 28, paddingVertical: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  composerCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  catChipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  intentionInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, lineHeight: 24, textAlignVertical: 'top', marginBottom: 12 },
  anonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  flyText: { position: 'absolute', bottom: 60, zIndex: 10 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  energyCard: { padding: 16, borderRadius: 14, borderWidth: 1 },
  energyBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  energyFill: { height: 8, borderRadius: 4 },
  intentionCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  intentionText: { fontSize: 14, lineHeight: 22, marginBottom: 10 },
  witnessRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  witnessCount: { fontSize: 12, flex: 1 },
  myIntentionCard: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 6 },
  myIntentionText: { fontSize: 13, lineHeight: 19 },
});
