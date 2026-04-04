// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, Dimensions, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Polygon } from 'react-native-svg';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, Star, Sparkles, ChevronRight } from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#A855F7';

const ARCHETYPES = [
  { id: 'sage', name: 'Mędrzec', icon: '🦉', color: '#818CF8', shadow: 'Dogmatyzm',
    strengths: ['Głęboka wiedza', 'Analityczny umysł', 'Szukanie prawdy'],
    gifts: 'Rozumiesz rzeczy na poziomie, który inni rzadko osiągają. Twoja wiedza jest darem dla świata.',
    wound: 'Możesz bać się bycia postrzeganym jako głupi lub ignorant. Często nie ufasz własnym uczuciom.',
    path: 'Pozwól sobie nie wiedzieć. Ucz się przez doświadczenie, nie tylko przez umysł.' },
  { id: 'lover', name: 'Kochanek', icon: '🌹', color: '#F472B6', shadow: 'Uzależnienie',
    strengths: ['Głęboka empatia', 'Pasja i intensywność', 'Piękno we wszystkim'],
    gifts: 'Widzisz piękno wszędzie. Twoja miłość do życia jest zaraźliwa i uzdrawiająca.',
    wound: 'Możesz tracić siebie w relacjach lub uzależniać wartość od miłości innych.',
    path: 'Naucz się kochać siebie niezależnie od zewnętrznego potwierdzenia.' },
  { id: 'warrior', name: 'Wojownik', icon: '⚔️', color: '#EF4444', shadow: 'Brutalność',
    strengths: ['Odwaga i determinacja', 'Jasność celu', 'Ochrona słabszych'],
    gifts: 'Potrafisz walczyć o to, co ważne. Twoja siła broni i inspiruje.',
    wound: 'Możesz używać siły gdy nie jest potrzebna lub bać się wrażliwości jako słabości.',
    path: 'Odkryj, że prawdziwa siła to zdolność do miłości, nie tylko walki.' },
  { id: 'creator', name: 'Twórca', icon: '🎨', color: '#F59E0B', shadow: 'Perfekcjonizm',
    strengths: ['Kreatywność i innowacja', 'Wizja nowych możliwości', 'Ekspresja artystyczna'],
    gifts: 'Widzisz rzeczy, których inni nie widzą. Twoja twórczość zmienia świat.',
    wound: 'Możesz blokować się przed tworzeniem z powodu lęku przed oceną.',
    path: 'Twórz bez względu na efekt. Proces jest ważniejszy niż doskonałość.' },
  { id: 'caregiver', name: 'Opiekun', icon: '🤱', color: '#34D399', shadow: 'Poświęcenie',
    strengths: ['Bezwarunkowa miłość', 'Troska i wsparcie', 'Umiejętność słuchania'],
    gifts: 'Twoja troska uzdrawia. Ludzie czują się przy tobie bezpiecznie i kochani.',
    wound: 'Możesz zaniedywać własne potrzeby i odczuwać winę za ich wyrażanie.',
    path: 'Napełnij własny kubek, by móc nalewać innym. Troska o siebie jest dawaniem.' },
  { id: 'seeker', name: 'Poszukiwacz', icon: '🧭', color: '#06B6D4', shadow: 'Ucieczka',
    strengths: ['Ciekawość i otwartość', 'Odwaga bycia innym', 'Wolność ducha'],
    gifts: 'Twoja wolność i ciekawość otwierają nowe horyzonty dla siebie i innych.',
    wound: 'Możesz bać się zakorzenień, myląc stabilność z więzieniem.',
    path: 'Odkryj, że prawdziwa wolność rodzi się wewnątrz, nie w ciągłym ruchu.' },
  { id: 'magician', name: 'Mag', icon: '🔮', color: '#7C3AED', shadow: 'Manipulacja',
    strengths: ['Transformacja rzeczywistości', 'Widzenie wzorców', 'Moc manifestacji'],
    gifts: 'Rozumiesz jak myśl tworzy rzeczywistość. Twoja wiedza jest transformująca.',
    wound: 'Możesz używać swojej mocy do kontrolowania zamiast transformowania.',
    path: 'Używaj mocy do służenia, nie dominowania. Twoja magia służy całości.' },
  { id: 'ruler', name: 'Władca', icon: '👑', color: '#D4A853', shadow: 'Tyran',
    strengths: ['Naturalne przywództwo', 'Wizja i organizacja', 'Tworzenie porządku'],
    gifts: 'Potrafisz prowadzić innych i tworzyć struktury, które służą wielu.',
    wound: 'Możesz kontrolować z lęku przed chaosem zamiast przewodzić z miłości.',
    path: 'Przywódca służy tym, którymi przewodzi. Twoja moc jest dla wszystkich.' },
];

const QUIZ = [
  { q: 'Co jest dla ciebie najważniejsze?', options: [{ label: 'Wiedza i prawda', arch: 'sage' }, { label: 'Miłość i piękno', arch: 'lover' }, { label: 'Siła i sprawiedliwość', arch: 'warrior' }, { label: 'Tworzenie i ekspresja', arch: 'creator' }] },
  { q: 'Jak radzisz sobie w kryzysie?', options: [{ label: 'Analizuję i szukam rozwiązań', arch: 'sage' }, { label: 'Wsperam i jestem z innymi', arch: 'caregiver' }, { label: 'Walczę i działam', arch: 'warrior' }, { label: 'Szukam nowej drogi', arch: 'seeker' }] },
  { q: 'Co daje ci największą radość?', options: [{ label: 'Odkrywanie i nauka', arch: 'seeker' }, { label: 'Tworzenie i wyobraźnia', arch: 'creator' }, { label: 'Głębokie połączenie z innymi', arch: 'lover' }, { label: 'Transformacja i zmiana', arch: 'magician' }] },
];

export const SoulArchetypeScreen = ({ navigation }: any) => {
  const { themeName, userData, addFavoriteItem, isFavoriteItem, removeFavoriteItem } = useAppStore();
  const currentTheme = getResolvedTheme(themeName, userData?.preferences?.colorScheme);
  const isDark = !currentTheme.background.startsWith('#F');
  const isLight = !isDark;
  const textColor = isLight ? '#1A0040' : '#F8F0FF';
  const subColor = isLight ? 'rgba(26,0,64,0.5)' : 'rgba(248,240,255,0.5)';
  const { t } = useTranslation();
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';

  const [activeTab, setActiveTab] = useState<'quiz' | 'archetypes' | 'result'>('quiz');
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<typeof ARCHETYPES[0] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const answerQuiz = (arch: string) => {
    HapticsService.impactMedium();
    const newAnswers = [...quizAnswers, arch];
    if (quizStep < QUIZ.length - 1) {
      setQuizAnswers(newAnswers);
      setQuizStep(q => q + 1);
    } else {
      const counts = newAnswers.reduce((acc, a) => ({ ...acc, [a]: (acc[a] || 0) + 1 }), {});
      const topArch = Object.keys(counts).sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0];
      const found = ARCHETYPES.find(a => a.id === topArch) || ARCHETYPES[0];
      setResult(found);
      setActiveTab('result');
    }
  };

  const resetQuiz = () => { setQuizStep(0); setQuizAnswers([]); setResult(null); setActiveTab('quiz'); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }} edges={['top']}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={isDark ? ['#080014', '#0E0020', '#140030'] : ['#FAF5FF', '#F7F0FF', '#F5EBFF']} style={StyleSheet.absoluteFill} />
      </View>

      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2 }}>{t('soulArchetype.eyebrow').toUpperCase()}</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>{t('soulArchetype.title')}</Text>
        </View>
        <Pressable style={styles.starBtn} hitSlop={12} onPress={() => { HapticsService.impact('light'); if (isFavoriteItem('soul-archetype')) { removeFavoriteItem('soul-archetype'); } else { addFavoriteItem({ id: 'soul-archetype', label: 'Archetyp duszy', route: 'SoulArchetype', params: {}, icon: 'Sparkles', color: ACCENT, addedAt: new Date().toISOString() }); } }}>
          <Star size={18} color={isFavoriteItem('soul-archetype') ? ACCENT : subColor} strokeWidth={1.8} fill={isFavoriteItem('soul-archetype') ? ACCENT : 'none'} />
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {([['quiz', 'Quiz'], ['archetypes', 'Wszystkie'], ['result', 'Mój']] as const).map(([tab, label]) => {
          const active = activeTab === tab;
          return (
            <Pressable key={tab} onPress={() => { HapticsService.impactLight(); setActiveTab(tab); }}
              style={[styles.tabChip, active && { backgroundColor: ACCENT, borderColor: ACCENT }]}>
              <Text style={[styles.tabLabel, { color: active ? '#fff' : subColor }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen }}>
        {activeTab === 'quiz' && (
          <>
            <View style={[styles.quizCard, { backgroundColor: ACCENT + '14', borderColor: ACCENT + '28' }]}>
              <Text style={{ color: subColor, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>PYTANIE {quizStep + 1}/{QUIZ.length}</Text>
              <Text style={{ color: textColor, fontSize: 18, fontWeight: '700', lineHeight: 26, marginBottom: 20 }}>{QUIZ[quizStep].q}</Text>
              {QUIZ[quizStep].options.map((opt, i) => (
                <Pressable key={i} onPress={() => answerQuiz(opt.arch)}
                  style={[styles.quizOption, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={{ color: textColor, fontSize: 14, flex: 1 }}>{opt.label}</Text>
                  <ChevronRight size={16} color={subColor} />
                </Pressable>
              ))}
            </View>
          </>
        )}

        {activeTab === 'archetypes' && ARCHETYPES.map((arch, i) => (
          <Animated.View key={arch.id} entering={FadeInDown.delay(60 + i * 40).duration(400)}>
            <Pressable onPress={() => { HapticsService.impactLight(); setExpanded(arch.id === expanded ? null : arch.id); }}
              style={[styles.archCard, { backgroundColor: cardBg, borderColor: expanded === arch.id ? arch.color : cardBorder }]}>
              <View style={[styles.archIcon, { backgroundColor: arch.color + '20' }]}>
                <Text style={{ fontSize: 22 }}>{arch.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: textColor, fontSize: 15, fontWeight: '700' }}>{arch.name}</Text>
                  <Text style={{ color: arch.color + '88', fontSize: 10, letterSpacing: 1 }}>CIEŃ: {arch.shadow.toUpperCase()}</Text>
                </View>
                {expanded === arch.id && (
                  <>
                    <Text style={{ color: subColor, fontSize: 12, lineHeight: 18, marginTop: 6 }}>{arch.gifts}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {arch.strengths.map(s => (
                        <View key={s} style={[styles.tag, { backgroundColor: arch.color + '18', borderColor: arch.color + '30' }]}>
                          <Text style={{ color: arch.color, fontSize: 10 }}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </Pressable>
          </Animated.View>
        ))}

        {activeTab === 'result' && result && (
          <Animated.View entering={FadeInDown.duration(600)}>
            <View style={[styles.resultCard, { backgroundColor: result.color + '14', borderColor: result.color + '30' }]}>
              <Text style={{ fontSize: 60, marginBottom: 8 }}>{result.icon}</Text>
              <Text style={{ color: result.color, fontSize: 11, letterSpacing: 3, marginBottom: 4 }}>TWÓJ ARCHETYP</Text>
              <Text style={{ color: textColor, fontSize: 28, fontWeight: '800', marginBottom: 12 }}>{result.name}</Text>
              <Text style={{ color: subColor, fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 16 }}>{result.gifts}</Text>
              <View style={[styles.woundBox, { backgroundColor: result.color + '12', borderColor: result.color + '25' }]}>
                <Text style={{ color: result.color, fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>RANA DO UZDROWIENIA</Text>
                <Text style={{ color: textColor, fontSize: 13, lineHeight: 20 }}>{result.wound}</Text>
              </View>
              <View style={[styles.woundBox, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 8 }]}>
                <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>ŚCIEŻKA ROZWOJU</Text>
                <Text style={{ color: textColor, fontSize: 13, lineHeight: 20 }}>{result.path}</Text>
              </View>
              <Pressable onPress={resetQuiz} style={[styles.retakeBtn, { borderColor: result.color + '44' }]}>
                <Sparkles size={14} color={result.color} />
                <Text style={{ color: result.color, fontSize: 13 }}>Powtórz quiz</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
        {activeTab === 'result' && !result && (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔮</Text>
            <Text style={{ color: textColor, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Jeszcze nie znasz swojego archetypu</Text>
            <Text style={{ color: subColor, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>Wypełnij quiz, aby odkryć swój dominujący archetyp duszy</Text>
            <Pressable onPress={() => setActiveTab('quiz')} style={[styles.retakeBtn, { borderColor: ACCENT + '44' }]}>
              <Text style={{ color: ACCENT, fontSize: 14 }}>Przejdź do quizu →</Text>
            </Pressable>
          </View>
        )}

        <EndOfContentSpacer />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingBottom: 12, gap: 12, paddingTop: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  starBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', backgroundColor: 'rgba(168,85,247,0.08)' },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: layout.padding.screen, marginBottom: 12 },
  tabChip: { flex: 1, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)', backgroundColor: 'rgba(168,85,247,0.06)', alignItems: 'center' },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  quizCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 8 },
  quizOption: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  archCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  archIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  resultCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center' },
  woundBox: { borderRadius: 14, borderWidth: 1, padding: 14, width: '100%', marginBottom: 4 },
  retakeBtn: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginTop: 14, alignItems: 'center' },
});
