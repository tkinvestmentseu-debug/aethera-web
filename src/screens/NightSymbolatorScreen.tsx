// @ts-nocheck
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, TextInput, FlatList, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ChevronLeft, Moon, Search, Star, Sparkles, BookOpen, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { MusicToggleButton } from '../components/MusicToggleButton';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#8B5CF6';

// ── Symbol database ───────────────────────────────────────────────────────────
const SYMBOL_CATEGORIES = ['Wszystkie', 'Archetypy', 'Żywioły', 'Zwierzęta', 'Kolory', 'Miejsca', 'Ludzie', 'Przedmioty'] as const;

const SYMBOLS = [
  // Archetypy
  { id: 's01', emoji: '👑', name: 'Król/Królowa', category: 'Archetypy', shortMeaning: 'Władza, odpowiedzialność', deepMeaning: 'Symbol władzy wewnętrznej i odpowiedzialności za swoje życie. Może oznaczać potrzebę przejęcia kontroli lub konfrontację z autorytetem. W snach reprezentuje ojcowską/macierzyńską energię lub Wyższe Ja.', questions: ['Kto sprawuje władzę w twoim życiu?', 'Jak reagujesz na autorytety?'] },
  { id: 's02', emoji: '🧙', name: 'Mędrzec/Mag', category: 'Archetypy', shortMeaning: 'Mądrość, transformacja', deepMeaning: 'Jungowski Stary Mędrzec — źródło głębokiej wiedzy i transformacji. Pojawia się gdy potrzebujesz kierunku lub gdy stoisz na progu zmiany. Symbol integracji cienia i dojrzałości psychicznej.', questions: ['Jakiej mądrości szukasz?', 'Co wymaga transformacji?'] },
  { id: 's03', emoji: '🤺', name: 'Wojownik', category: 'Archetypy', shortMeaning: 'Odwaga, walka, granice', deepMeaning: 'Energia wojownika symbolizuje potrzebę stanięcia w obronie wartości lub siebie. Może być wezwaniem do działania lub ostrzeżeniem przed agresją (własną lub cudzą). Pyta o granice.', questions: ['Z czym walczysz?', 'Jakich granic potrzebujesz?'] },
  { id: 's04', emoji: '🧒', name: 'Dziecko', category: 'Archetypy', shortMeaning: 'Wewnętrzne dziecko, niewinność', deepMeaning: 'Symbol wewnętrznego dziecka — tej części nas, która zachowała oryginalność, ciekawość i wrażliwość. Może sygnalizować niezaspokojone potrzeby z przeszłości lub twórczą spontaniczność.', questions: ['Jakiej troski potrzebuje twoje wewnętrzne dziecko?', 'Co cię bawiło jako dziecko?'] },
  { id: 's05', emoji: '👻', name: 'Cień', category: 'Archetypy', shortMeaning: 'Wyparty aspekt siebie', deepMeaning: 'Jungowski Cień — to czego nie akceptujemy w sobie, ale co wyraźnie widzimy w innych. Pojawienie się w snach to zaproszenie do integracji, nie walki. Cień zawiera często ukryte skarby.', questions: ['Co w tym symbolu cię niepokoi?', 'Co projektujesz na innych?'] },
  // Żywioły
  { id: 's06', emoji: '🔥', name: 'Ogień', category: 'Żywioły', shortMeaning: 'Pasja, transformacja, oczyszczenie', deepMeaning: 'Ogień to żywioł transformacji — niszczy stare formy, by zrobić miejsce nowym. Symbolizuje pasję, kreatywność i wolę. Może ostrzegać przed destrukcją lub zapraszać do przebudzenia.', questions: ['Co chcesz spalić w swoim życiu?', 'Gdzie czujesz wewnętrzny ogień?'] },
  { id: 's07', emoji: '💧', name: 'Woda', category: 'Żywioły', shortMeaning: 'Emocje, nieświadomość, flow', deepMeaning: 'Woda reprezentuje świat emocji i nieświadomości. Spokojne wody — harmonia emocjonalna. Burzliwe — stłumione uczucia. Głęboka ciemna woda — niezbadane rejony psychiki. Pytaj zawsze o stan wody.', questions: ['Jakie emocje są teraz dominujące?', 'Co przepływa przez twoje życie?'] },
  { id: 's08', emoji: '🌍', name: 'Ziemia', category: 'Żywioły', shortMeaning: 'Stabilność, ciało, materializacja', deepMeaning: 'Żywioł ziemi mówi o potrzebie zakorzenienia, bezpieczeństwa i materializacji. Pojawia się gdy zbyt długo jesteś "w głowie" lub gdy potrzebujesz solidnych fundamentów. Ciało ma do powiedzenia coś ważnego.', questions: ['Jak zakorzeniony/a jesteś?', 'Co wymaga uziemienia?'] },
  { id: 's09', emoji: '💨', name: 'Powietrze/Wiatr', category: 'Żywioły', shortMeaning: 'Umysł, zmiana, wolność', deepMeaning: 'Wiatr symbolizuje umysł, komunikację i zmiany, które przychodzą z zewnątrz lub wewnątrz. Delikatna bryza — subtelna inspiracja. Burza — nadchodzące zmiany lub wewnętrzny chaos myśli.', questions: ['Jakie myśli dominują?', 'Czego szuka twój umysł?'] },
  // Zwierzęta
  { id: 's10', emoji: '🐍', name: 'Wąż', category: 'Zwierzęta', shortMeaning: 'Transformacja, uzdrowienie, wiedza', deepMeaning: 'Jeden z najstarszych symboli ludzkości. Wąż to transformacja przez zrzucenie starej skóry, uzdrowienie (kaduceus), ale też wiedza zakazana i kuszenie. W snach często mówi o seksualnej energii lub głębokiej zmianie.', questions: ['Co w twoim życiu wymaga transformacji?', 'Jakiej wiedzy szukasz?'] },
  { id: 's11', emoji: '🦅', name: 'Orzeł/Ptak', category: 'Zwierzęta', shortMeaning: 'Wizja, wolność, perspektywa', deepMeaning: 'Orzeł widzi z wysoka — symbolizuje szerszą perspektywę i zdolność do wznoszenia się ponad codzienność. Wolność od ograniczeń, ale też samotność na szczycie. Jaką perspektywę chcesz zyskać?', questions: ['Co widzisz z góry?', 'Gdzie potrzebujesz wolności?'] },
  { id: 's12', emoji: '🐺', name: 'Wilk', category: 'Zwierzęta', shortMeaning: 'Instynkt, przynależność, dzikość', deepMeaning: 'Wilk symbolizuje pierwotne instynkty, lojalność wobec grupy i głos wewnętrznej dzikości. Może wzywać do zaufania intuicji lub wskazywać potrzebę wspólnoty. Samotny wilk pyta o izolację.', questions: ['Komu jesteś lojalny/a?', 'Kiedy ostatnio słuchałeś/aś instynktu?'] },
  { id: 's13', emoji: '🦋', name: 'Motyl', category: 'Zwierzęta', shortMeaning: 'Metamorfoza, dusza, lekkość', deepMeaning: 'Klasyczny symbol przemiany duszy. Motyl zawsze pyta: przez jaki kokoon przechodzisz lub właśnie wyszedłeś? Symbolizuje też ulotność, piękno i lekkość bycia — radość bez przywiązania.', questions: ['W jaką metamorfozę wchodzisz?', 'Co jest teraz twoim kokonem?'] },
  // Kolory
  { id: 's14', emoji: '🔴', name: 'Czerwony', category: 'Kolory', shortMeaning: 'Energia, gniew, namiętność', deepMeaning: 'Kolor życiowej energii, siły i namiętności. W snach może oznaczać gniew, pożądanie, niebezpieczeństwo lub żywotność. Dominujący czerwony często wskazuje na silne emocje lub niezaspokojone potrzeby energetyczne.', questions: ['Gdzie tłumisz energię?', 'Co budzi twoje najsilniejsze emocje?'] },
  { id: 's15', emoji: '🔵', name: 'Niebieski', category: 'Kolory', shortMeaning: 'Spokój, prawda, głębia', deepMeaning: 'Kolor nieba i głębokiego oceanu — spokoju, prawdy i komunikacji. Jasnoniebieski to klarowność umysłu. Ciemnoniebieski to głębia nieświadomości lub melancholia. Niebieski pyta o autentyczność.', questions: ['Gdzie szukasz prawdy?', 'Co próbujesz komunikować?'] },
  // Miejsca
  { id: 's16', emoji: '🏠', name: 'Dom', category: 'Miejsca', shortMeaning: 'Jaźń, bezpieczeństwo, rodzina', deepMeaning: 'Dom w snach to najczęściej symbol samego siebie — każdy pokój to inny aspekt psychiki. Piwnica to nieświadomość, poddasze to wyższe aspiracje. Stan domu mówi o stanie wewnętrznym.', questions: ['Jak wygląda dom w symbolu?', 'Jaki pokój dominuje?'] },
  { id: 's17', emoji: '🌊', name: 'Ocean/Morze', category: 'Miejsca', shortMeaning: 'Zbiorowa nieświadomość, emocje', deepMeaning: 'Ocean to jungowska zbiorowa nieświadomość i ogrom świata emocji. Spokojne morze — harmonia. Wzburzone fale — intensywne emocje lub nadchodzące zmiany. Co kryje się pod powierzchnią twojego oceanu?', questions: ['Co kryje się pod powierzchnią?', 'Boisz się głębiny czy ją szanujesz?'] },
  // Przedmioty
  { id: 's18', emoji: '🗝️', name: 'Klucz', category: 'Przedmioty', shortMeaning: 'Dostęp, rozwiązanie, wiedza', deepMeaning: 'Klucz zawsze otwiera coś, co było zamknięte. Jaki obszar życia lub psychiki czeka na otwarcie? Klucz może symbolizować odpowiedź na ważne pytanie, nowe możliwości lub gotowość do ujawnienia tajemnic.', questions: ['Co chcesz otworzyć?', 'Co trzymasz zamknięte?'] },
  { id: 's19', emoji: '🪞', name: 'Lustro', category: 'Przedmioty', shortMeaning: 'Samoobraz, prawda, odbicie', deepMeaning: 'Lustro pokazuje to, co nosimy w sobie — nie tylko twarz, ale obraz siebie. Rozbite lustro to zniekształcony samoobraz. Lustro może też symbolizować konfrontację z prawdą, której unikamy.', questions: ['Jak postrzegasz siebie?', 'Czego unikasz zobaczyć?'] },
  { id: 's20', emoji: '⚔️', name: 'Miecz', category: 'Przedmioty', shortMeaning: 'Decyzja, prawda, rozróżnianie', deepMeaning: 'Miecz tnie — oddziela prawdę od fałszu, ważne od nieważnego. Symbol siły umysłu i zdolności podejmowania trudnych decyzji. Może też wskazywać konflikt lub potrzebę stanowczości.', questions: ['Jaką trudną decyzję odkładasz?', 'Co musisz rozciąć w swoim życiu?'] },
];

export const NightSymbolatorScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeName, userData, nightSymbolFavorites, addNightSymbolFavorite, removeNightSymbolFavorite } = useAppStore();
  const currentTheme = getResolvedTheme(themeName, userData?.preferences?.colorScheme);
  const isDark = !currentTheme.background.startsWith('#F');
  const isLight = !isDark;
  const textColor = isLight ? '#1A0A2E' : '#EDE9FE';
  const subColor = isLight ? 'rgba(26,10,46,0.5)' : 'rgba(237,233,254,0.5)';
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.09)';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Wszystkie');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [symbolAiInsight, setSymbolAiInsight] = useState<string>('');
  const [symbolAiLoading, setSymbolAiLoading] = useState(false);
  // favIds moved to store as nightSymbolFavorites

  const filteredSymbols = useMemo(() => {
    let list = SYMBOLS;
    if (selectedCategory !== 'Wszystkie') {
      list = list.filter(s => s.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.shortMeaning.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery, selectedCategory]);

  const toggleFav = useCallback((id: string) => {
    HapticsService.impactLight();
    if (nightSymbolFavorites.some(f => f.id === id)) {
      removeNightSymbolFavorite(id);
    } else {
      addNightSymbolFavorite({ id, addedAt: new Date().toISOString() });
    }
  }, [nightSymbolFavorites, addNightSymbolFavorite, removeNightSymbolFavorite]);

  const toggleExpand = useCallback((id: string) => {
    HapticsService.impactLight();
    setExpandedId(prev => prev === id ? null : id);
  }, []);

    const fetchSymbolAi = async () => {
    setSymbolAiLoading(true);
    HapticsService.impactLight();
    try {
      const prompt = "Kategoria symboli: " + selectedCategory + ". Liczba symboli w filtrze: " + filteredSymbols.length + ". Napisz krotka (3-4 zdania) interpretacje jakie przeslanie niesie ta kategoria symbolow i jedno pytanie do refleksji dla uzytkownika.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setSymbolAiInsight(result);
    } catch (e) {
      setSymbolAiInsight("Blad pobierania interpretacji.");
    } finally {
      setSymbolAiLoading(false);
    }
  };
return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }} edges={['top']}>
      <LinearGradient
        colors={isDark ? ['#0A0818', '#0F0828', '#150A30'] : ['#F5F3FF', '#EDE9FE', '#FAF8FF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2 }}>SŁOWNIK SYMBOLI</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>Symbolatorium Nocy</Text>
        </View>
        <MusicToggleButton color={ACCENT} size={19} />
        <View style={[styles.moonBadge, { borderColor: ACCENT + '40', backgroundColor: ACCENT + '10' }]}>
          <Moon size={13} color={ACCENT} />
          <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700' }}>{SYMBOLS.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Search size={16} color={subColor} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('dreams.searchSymbol')}
          placeholderTextColor={subColor + '88'}
          style={{ flex: 1, color: textColor, fontSize: 14, marginLeft: 8 }}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
            <X size={14} color={subColor} />
          </Pressable>
        )}
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 46 }}
        contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 8, paddingVertical: 6 }}
      >
        {SYMBOL_CATEGORIES.map(cat => {
          const active = selectedCategory === cat;
            const fetchSymbolAi = async () => {
    setSymbolAiLoading(true);
    HapticsService.impactLight();
    try {
      const prompt = "Kategoria symboli: " + selectedCategory + ". Liczba symboli w filtrze: " + filteredSymbols.length + ". Napisz krotka (3-4 zdania) interpretacje jakie przeslanie niesie ta kategoria symbolow i jedno pytanie do refleksji dla uzytkownika.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setSymbolAiInsight(result);
    } catch (e) {
      setSymbolAiInsight("Blad pobierania interpretacji.");
    } finally {
      setSymbolAiLoading(false);
    }
  };
return (
            <Pressable
              key={cat}
              onPress={() => { HapticsService.impactLight(); setSelectedCategory(cat); }}
              style={[styles.catChip, { borderColor: active ? ACCENT : cardBorder, backgroundColor: active ? ACCENT + '18' : cardBg }]}
            >
              <Text style={{ color: active ? ACCENT : subColor, fontSize: 12, fontWeight: active ? '700' : '500' }}>{cat}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Results count */}
      <Text style={{ color: subColor, fontSize: 11, paddingHorizontal: layout.padding.screen, marginBottom: 6, marginTop: 2 }}>
        {filteredSymbols.length} {filteredSymbols.length === 1 ? 'symbol' : 'symboli'}
        {nightSymbolFavorites.length > 0 ? ` · ★ ${nightSymbolFavorites.length}` : ''}
      </Text>

      {/* Symbol list — ScrollView for proper scrolling */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: insets.bottom + 80 }}
      >
        {filteredSymbols.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={{ fontSize: 36, marginBottom: 10 }}>🔮</Text>
            <Text style={{ color: textColor, fontSize: 15, fontWeight: '700' }}>Brak wyników</Text>
            <Text style={{ color: subColor, fontSize: 13, marginTop: 4 }}>Spróbuj innej frazy</Text>
          </View>
        )}

        {filteredSymbols.map((sym, i) => {
          const expanded = expandedId === sym.id;
          const isFav = nightSymbolFavorites.some(f => f.id === sym.id);
            const fetchSymbolAi = async () => {
    setSymbolAiLoading(true);
    HapticsService.impactLight();
    try {
      const prompt = "Kategoria symboli: " + selectedCategory + ". Liczba symboli w filtrze: " + filteredSymbols.length + ". Napisz krotka (3-4 zdania) interpretacje jakie przeslanie niesie ta kategoria symbolow i jedno pytanie do refleksji dla uzytkownika.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setSymbolAiInsight(result);
    } catch (e) {
      setSymbolAiInsight("Blad pobierania interpretacji.");
    } finally {
      setSymbolAiLoading(false);
    }
  };
return (
            <Animated.View key={sym.id} entering={FadeInDown.delay(i * 30).duration(300)}>
              <Pressable
                onPress={() => toggleExpand(sym.id)}
                style={[styles.symbolCard, { backgroundColor: expanded ? ACCENT + '0A' : cardBg, borderColor: expanded ? ACCENT + '40' : cardBorder }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.emojiWrap, { backgroundColor: ACCENT + (expanded ? '18' : '0E') }]}>
                    <Text style={{ fontSize: 24 }}>{sym.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textColor, fontSize: 15, fontWeight: '700' }}>{sym.name}</Text>
                    <Text style={{ color: subColor, fontSize: 12, marginTop: 2, lineHeight: 17 }}>{sym.shortMeaning}</Text>
                    <View style={[styles.catBadge, { borderColor: ACCENT + '28', backgroundColor: ACCENT + '0A' }]}>
                      <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700' }}>{sym.category.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => toggleFav(sym.id)} hitSlop={12}>
                    <Star size={16} color={isFav ? '#FBBF24' : subColor} fill={isFav ? '#FBBF24' : 'none'} />
                  </Pressable>
                </View>

                {expanded && (
                  <Animated.View entering={FadeIn.duration(300)} style={styles.expandedContent}>
                    <View style={[styles.divider, { backgroundColor: ACCENT + '25' }]} />
                    <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginBottom: 8 }}>GŁĘBSZE ZNACZENIE</Text>
                    <Text style={{ color: textColor, fontSize: 14, lineHeight: 22 }}>{sym.deepMeaning}</Text>

                    <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginTop: 14, marginBottom: 8 }}>PYTANIA DO REFLEKSJI</Text>
                    {sym.questions.map((q, qi) => (
                      <View key={qi} style={[styles.questionRow, { borderColor: ACCENT + '20', backgroundColor: ACCENT + '06' }]}>
                        <Text style={{ color: ACCENT, fontSize: 14 }}>✦</Text>
                        <Text style={{ flex: 1, color: subColor, fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>{q}</Text>
                      </View>
                    ))}
                  </Animated.View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}

                <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 16, backgroundColor: "#8B5CF622", borderWidth: 1, borderColor: "#8B5CF6", padding: 16 }}>
          <Text style={{ color: "#8B5CF6", fontWeight: "700", fontSize: 13, letterSpacing: 1, marginBottom: 8 }}>AI INTERPRETACJA SYMBOLI</Text>
          {symbolAiInsight ? (
            <Text style={{ color: "#E5E7EB", fontSize: 14, lineHeight: 22 }}>{symbolAiInsight}</Text>
          ) : null}
          <Pressable onPress={fetchSymbolAi} disabled={symbolAiLoading} style={{ marginTop: 12, backgroundColor: "#8B5CF6", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{symbolAiLoading ? "Interpretuję..." : "Interpretuj"}</Text>
          </Pressable>
        </View>
<EndOfContentSpacer />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingBottom: 10, gap: 10, paddingTop: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  moonBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginHorizontal: layout.padding.screen, marginBottom: 10 },
  catChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  symbolCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  emojiWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catBadge: { alignSelf: 'flex-start', borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, marginTop: 5 },
  expandedContent: { marginTop: 12 },
  divider: { height: 1, marginBottom: 12 },
  questionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 6 },
  emptyCard: { borderRadius: 20, borderWidth: 1, padding: 40, alignItems: 'center', marginTop: 40 },
});