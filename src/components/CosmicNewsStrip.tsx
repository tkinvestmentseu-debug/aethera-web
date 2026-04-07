// @ts-nocheck
/**
 * CosmicNewsStrip — poziomy pasek wiadomości kosmicznych.
 * Treści generowane deterministycznie z daty — astro, numerologia, księżyc, tarot.
 * Auto-scroll co 4 sekundy, możliwość ręcznego przewijania.
 */
import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width: SW } = Dimensions.get('window');
const CARD_W = Math.min(SW * 0.78, 300);
const CARD_H = 116;
const GAP = 10;

// ─── Dane kosmiczne ────────────────────────────────────────────────────────────

const PLANETARY_ASPECTS = [
  { pl: 'Wenus trygon Jupiter', en: 'Venus trine Jupiter', desc: 'Wyjątkowy dzień na miłość, obfitość i kreatywność. Otwórz serce na dobre.' },
  { pl: 'Mars seksyl Saturn', en: 'Mars sextile Saturn', desc: 'Twoja determinacja i dyscyplina pracują razem. Idealny czas na realizację planów.' },
  { pl: 'Merkury koniunkcja Słońce', en: 'Mercury conjunct Sun', desc: 'Twoje myśli są wyjątkowo jasne. Podpisuj umowy, prowadź ważne rozmowy.' },
  { pl: 'Księżyc opozycja Pluton', en: 'Moon opposite Pluto', desc: 'Intensywne emocje transformują Cię. Pozwól temu procesowi, on Cię uzdrawia.' },
  { pl: 'Słońce kwadrat Neptun', en: 'Sun square Neptune', desc: 'Uwaga na iluzje. Sprawdzaj informacje i słuchaj intuicji, nie oczekiwań.' },
  { pl: 'Jupiter trygon Uran', en: 'Jupiter trine Uranus', desc: 'Niespodziewane błogosławieństwo może pojawić się dziś. Bądź otwarty.' },
  { pl: 'Saturn seksyl Neptun', en: 'Saturn sextile Neptune', desc: 'Marzenia stają się planami. Czas połączyć wizję z konkretnym działaniem.' },
  { pl: 'Wenus kwadrat Mars', en: 'Venus square Mars', desc: 'Napięcie w relacjach może być iskrą kreatywności. Kanalizuj tę energię twórczo.' },
  { pl: 'Merkury trygon Uran', en: 'Mercury trine Uranus', desc: 'Genialne pomysły przychodzą z nikąd. Zapisuj wszystko co przyjdzie Ci do głowy.' },
  { pl: 'Słońce koniunkcja Chiron', en: 'Sun conjunct Chiron', desc: 'Stare rany proszą o uzdrowienie. Bądź łagodny dla siebie — to właśnie dziś.' },
  { pl: 'Księżyc trygon Wenus', en: 'Moon trine Venus', desc: 'Harmonia emocjonalna i relacyjna. Piękny czas na celebrowanie połączeń.' },
  { pl: 'Mars koniunkcja Pluton', en: 'Mars conjunct Pluto', desc: 'Ogromna moc transformacji. Twoja wola może zburzyć stare i zbudować nowe.' },
  { pl: 'Wenus wchodzi w Ryby', en: 'Venus enters Pisces', desc: 'Miłość nabiera wymiaru duchowego. Romantyzm, empatia i współczucie rosną.' },
  { pl: 'Retrograd Merkurego kończy się', en: 'Mercury retrograde ends', desc: 'Komunikacja się odblokuje. Czas wrócić do spraw zawieszonych przez ostatnie tygodnie.' },
  { pl: 'Wielka Koniunkcja Jowisz-Saturn', en: 'Jupiter-Saturn conjunction', desc: 'Raz na 20 lat — era zmian strukturalnych. Fundament pod nowe 20-lecie życia.' },
  { pl: 'Słońce wchodzi w Byka', en: 'Sun enters Taurus', desc: 'Sezon ziemski zachęca do uziemienia, zmysłowości i budowania trwałych podstaw.' },
  { pl: 'Pluton seksyl Neptun', en: 'Pluto sextile Neptune', desc: 'Zbiorowe przebudzenie duchowe. Twoja intuicja sięga głębiej niż zazwyczaj.' },
  { pl: 'Uran trygon Księżyc', en: 'Uranus trine Moon', desc: 'Nagłe objawienie emocjonalne. Coś czego nie rozumiałeś przez lata — nagle jasne.' },
  { pl: 'Chiron seksyl Saturn', en: 'Chiron sextile Saturn', desc: 'Uzdrowienie przez strukturę i granice. Powiedz "nie" tam, gdzie trzeba.' },
  { pl: 'Mars wchodzi w Barana', en: 'Mars enters Aries', desc: 'Ogień i inicjatywa. Zacznij projekt który od dawna czekał na odwagę.' },
];

const MOON_PHASES = [
  { phase: 'Nów Księżyca', emoji: '🌑', desc: 'Czas sadzenia nasion intencji. Zapisz czego pragniesz — wszechświat słucha.' },
  { phase: 'Sierp Księżyca', emoji: '🌒', desc: 'Pierwsze kiełki intencji. Podejmij jeden konkretny krok ku swojemu marzeniu.' },
  { phase: 'Księżyc Rosnący', emoji: '🌓', desc: 'Energia rośnie. Pracuj nad celami — masz wsparcie kosmicznych sił wzrostu.' },
  { phase: 'Garb Rosnący', emoji: '🌔', desc: 'Ostatni sprint przed pełnią. Dofinalizuj, dopracuj, daj z siebie wszystko.' },
  { phase: 'Pełnia Księżyca', emoji: '🌕', desc: 'Kulminacja i obfitość. Rytuał pełni księżyca potęguje każdą intencję stukrotnie.' },
  { phase: 'Garb Malejący', emoji: '🌖', desc: 'Czas wdzięczności za to co jest. Celebruj każdy mały krok na tej ścieżce.' },
  { phase: 'Księżyc Malejący', emoji: '🌗', desc: 'Odpuść to, co było. Czyścij przestrzeń — fizyczną i energetyczną — na nowe.' },
  { phase: 'Sierp Malejący', emoji: '🌘', desc: 'Ostatnie tchnienie cyklu. Medytuj, reflektuj, przygotuj się na nowy nów.' },
];

const NUMEROLOGY_DAY = [
  { n: 1, title: 'Dzień Przywódcy', desc: 'Jedynka rządzi dziś. Inicjatywa, niezależność i odwaga do pierwszego kroku.' },
  { n: 2, title: 'Dzień Harmonii', desc: 'Dwójka niesie współpracę i dyplomację. Słuchaj tak samo uważnie jak mówisz.' },
  { n: 3, title: 'Dzień Ekspresji', desc: 'Trójka to twórczość i radość. Wyraź siebie — słowem, kolorem, dźwiękiem.' },
  { n: 4, title: 'Dzień Fundamentu', desc: 'Czwórka buduje. Zrób porządek, zaplanuj, połóż kamień pod coś trwałego.' },
  { n: 5, title: 'Dzień Przygody', desc: 'Piątka przynosi zmiany i wolność. Spontaniczność dziś zaprocentuje.' },
  { n: 6, title: 'Dzień Miłości', desc: 'Szóstka niesie troskę i piękno. Zadbaj o bliskich i przestrzeń wokół siebie.' },
  { n: 7, title: 'Dzień Mistyki', desc: 'Siódemka zaprasza do głębi. Medytuj, badaj, odkrywaj wewnętrzną prawdę.' },
  { n: 8, title: 'Dzień Mocy', desc: 'Ósemka daje dostęp do siły i obfitości. Myśl ambitnie — możesz więcej niż myślisz.' },
  { n: 9, title: 'Dzień Mądrości', desc: 'Dziewiątka kończy cykl. Puść stare — zrób miejsce na nowy rozdział.' },
  { n: 11, title: 'Dzień Intuicji ✦', desc: 'Mistrz 11 — nadaje intensywność objawień. Ufaj przeczuciom bardziej niż logice.' },
  { n: 22, title: 'Dzień Budowniczego ✦', desc: 'Mistrz 22 — manifesty na wielką skalę. Co dziś zaczniesz może zmienić świat.' },
];

const TAROT_DAILY = [
  { card: 'Mag', emoji: '✨', desc: 'Wszystkie narzędzia do tworzenia są w Twoich rękach. Działaj z intencją.' },
  { card: 'Kapłanka', emoji: '🌙', desc: 'Intuicja mówi Ci to, czego logika nie dostrzeże. Słuchaj ciszy.' },
  { card: 'Cesarzowa', emoji: '🌿', desc: 'Obfitość i płodność. Pielęgnuj to co rośnie — w sobie i wokół siebie.' },
  { card: 'Cesarz', emoji: '⚡', desc: 'Czas wziąć odpowiedzialność i stanąć mocno na ziemi. Twoja wola tworzy rzeczywistość.' },
  { card: 'Papież', emoji: '🕊️', desc: 'Szukaj mądrości starszych i tradycji. Odpowiedź jest w tym, co wypróbowane.' },
  { card: 'Kochankowie', emoji: '💖', desc: 'Wybór przed Tobą jest ważny. Kieruj się sercem, nie strachem.' },
  { card: 'Rydwan', emoji: '🔥', desc: 'Zdyscyplinowana wola prowadzi do zwycięstwa. Kontrola nad siłami przeciwnymi.' },
  { card: 'Moc', emoji: '🦁', desc: 'Prawdziwa siła płynie z łagodności i miłości. Okiełznaj wewnętrznego lwa.' },
  { card: 'Pustelnik', emoji: '🕯️', desc: 'Czas cofnąć się i szukać mądrości wewnątrz. Cisza jest twoim nauczycielem.' },
  { card: 'Koło Fortuny', emoji: '🌀', desc: 'Los się obraca. Zaufaj cyklom — to co schodzi dziś, wzejdzie jutro.' },
  { card: 'Sprawiedliwość', emoji: '⚖️', desc: 'Karma działa bezbłędnie. Działaj etycznie — konsekwencje wracają z nawiązką.' },
  { card: 'Wisielec', emoji: '🌊', desc: 'Oddaj kontrolę. Nowa perspektywa przychodzi, gdy przestajemy walczyć z prądem.' },
  { card: 'Śmierć', emoji: '🦋', desc: 'Koniec jednej fazy, początek nowej. Nie bój się — to transformacja, nie strata.' },
  { card: 'Umiarkowanie', emoji: '🌈', desc: 'Równowaga i cierpliwość. Alchemia duszy wymaga czasu i harmonii.' },
  { card: 'Diabeł', emoji: '🔗', desc: 'Jakie kajdany nosisz nieświadomie? To jedynie przekonania — możesz je uwolnić.' },
  { card: 'Wieża', emoji: '⚡', desc: 'Gwałtowna zmiana odsłania prawdę. To, co kruszy się, nie było warte zachowania.' },
  { card: 'Gwiazda', emoji: '⭐', desc: 'Nadzieja po burzy. Jesteś prowadzony przez gwiazdy — ufaj tej ścieżce.' },
  { card: 'Księżyc', emoji: '🌕', desc: 'Iluzje i lęki wychodzą na powierzchnię. Zbadaj je ze współczuciem.' },
  { card: 'Słońce', emoji: '☀️', desc: 'Radość, sukces i klarowność. To jeden z twoich najbardziej świetlistych dni.' },
  { card: 'Sąd', emoji: '🎺', desc: 'Przebudzenie i nowe powołanie. Słyszysz wezwanie — czas je przyjąć.' },
  { card: 'Świat', emoji: '🌍', desc: 'Cykl zakończony w triumfie. Jesteś gotowy na zupełnie nowy rozdział życia.' },
  { card: 'Głupiec', emoji: '🌟', desc: 'Skok wiary z otwartym sercem. Nieznane jest zaproszeniem, nie zagrożeniem.' },
];

const ZODIAC_SEASON = [
  { sign: 'Koziorożec', emoji: '🌙', dates: '22.12–19.01', energy: 'Ambicja, struktura i wytrwałość. Szczyty zdobywa się krok po kroku.' },
  { sign: 'Wodnik', emoji: '⚡', dates: '20.01–18.02', energy: 'Rewolucja, oryginalność i humanitaryzm. Myśl poza schematami.' },
  { sign: 'Ryby', emoji: '🕊️', dates: '19.02–20.03', energy: 'Mistycyzm, empatia i transcendencja. Granica między snem a jawą się zaciera.' },
  { sign: 'Baran', emoji: '🔥', dates: '21.03–19.04', energy: 'Inicjatywa i odwaga. Ogień odnowy płonie — czas zaczynać od nowa.' },
  { sign: 'Byk', emoji: '🌿', dates: '20.04–20.05', energy: 'Zmysłowość, trwałość i obfitość. Zakorzenij się i ciesz pięknem.' },
  { sign: 'Bliźnięta', emoji: '✨', dates: '21.05–20.06', energy: 'Ciekawość, komunikacja i dualność. Naucz się czegoś zupełnie nowego.' },
  { sign: 'Rak', emoji: '🌊', dates: '21.06–22.07', energy: 'Emocje, intuicja i dom. Zadbaj o swoje sanktuarium.' },
  { sign: 'Lew', emoji: '🌺', dates: '23.07–22.08', energy: 'Kreatywność, serce i hojność. Śwież, twórz, kochaj pełnią.' },
  { sign: 'Panna', emoji: '🌸', dates: '23.08–22.09', energy: 'Doskonałość, uzdrowienie i służba. Szczegóły tworzą arcydzieła.' },
  { sign: 'Waga', emoji: '🦋', dates: '23.09–22.10', energy: 'Harmonia, piękno i sprawiedliwość. Szukaj równowagi we wszystkim.' },
  { sign: 'Skorpion', emoji: '🔮', dates: '23.10–21.11', energy: 'Transformacja, głębia i regeneracja. Nie bój się własnych cieni.' },
  { sign: 'Strzelec', emoji: '💫', dates: '22.11–21.12', energy: 'Przygoda, filozofia i wolność. Szukaj sensu poza horyzontem.' },
];

// ─── Generator treści na dany dzień ───────────────────────────────────────────

function getDayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

function calcDayNumerology(d: Date): number {
  const str = `${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}`;
  let sum = str.split('').reduce((a, c) => a + parseInt(c), 0);
  while (sum > 9 && sum !== 11 && sum !== 22) {
    sum = String(sum).split('').reduce((a, c) => a + parseInt(c), 0);
  }
  return sum;
}

function getMoonPhaseIndex(d: Date): number {
  const known = new Date(2000, 0, 6).getTime();
  const diff = (d.getTime() - known) / 86400000;
  const phase = ((diff % 29.53) + 29.53) % 29.53;
  return Math.floor(phase / (29.53 / 8));
}

// Hermes-safe date formatter (no toLocaleString with locale/options)
function formatDatePL(d: Date): string {
  const DAYS = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
  const MONTHS = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function buildDailyCosmicNews() {
  const d = new Date();
  const doy = getDayOfYear(d);
  const month = d.getMonth();
  const day = d.getDate();

  const aspect = PLANETARY_ASPECTS[doy % PLANETARY_ASPECTS.length];
  const moon = MOON_PHASES[getMoonPhaseIndex(d)];
  const numDay = calcDayNumerology(d);
  const numInfo = NUMEROLOGY_DAY.find(n => n.n === numDay) ?? NUMEROLOGY_DAY[0];
  const tarot = TAROT_DAILY[doy % TAROT_DAILY.length];

  const zodiacSeasonIdx = (() => {
    const m = month + 1, dd = day;
    if ((m === 12 && dd >= 22) || (m === 1 && dd <= 19)) return 0;
    if ((m === 1 && dd >= 20) || (m === 2 && dd <= 18)) return 1;
    if ((m === 2 && dd >= 19) || (m === 3 && dd <= 20)) return 2;
    if ((m === 3 && dd >= 21) || (m === 4 && dd <= 19)) return 3;
    if ((m === 4 && dd >= 20) || (m === 5 && dd <= 20)) return 4;
    if ((m === 5 && dd >= 21) || (m === 6 && dd <= 20)) return 5;
    if ((m === 6 && dd >= 21) || (m === 7 && dd <= 22)) return 6;
    if ((m === 7 && dd >= 23) || (m === 8 && dd <= 22)) return 7;
    if ((m === 8 && dd >= 23) || (m === 9 && dd <= 22)) return 8;
    if ((m === 9 && dd >= 23) || (m === 10 && dd <= 22)) return 9;
    if ((m === 10 && dd >= 23) || (m === 11 && dd <= 21)) return 10;
    return 11;
  })();
  const zodiac = ZODIAC_SEASON[zodiacSeasonIdx];

  return [
    {
      id: 'aspect',
      category: '🪐 Astrologia',
      categoryColor: '#818CF8',
      bigEmoji: '🪐',
      headline: aspect.pl,
      body: aspect.desc,
      darkGrad: ['#1E1B4B', '#2D2870'] as const,
    },
    {
      id: 'moon',
      category: `${moon.emoji} Księżyc`,
      categoryColor: '#C4B5FD',
      bigEmoji: moon.emoji,
      headline: moon.phase,
      body: moon.desc,
      darkGrad: ['#1A1040', '#2D1B69'] as const,
    },
    {
      id: 'numerology',
      category: '🔢 Numerologia',
      categoryColor: '#34D399',
      bigEmoji: '🔢',
      headline: `Wibracja ${numDay} — ${numInfo.title}`,
      body: numInfo.desc,
      darkGrad: ['#052E16', '#064E3B'] as const,
    },
    {
      id: 'tarot',
      category: `${tarot.emoji} Tarot dnia`,
      categoryColor: '#F472B6',
      bigEmoji: tarot.emoji,
      headline: tarot.card,
      body: tarot.desc,
      darkGrad: ['#2D0036', '#4C0068'] as const,
    },
    {
      id: 'zodiac',
      category: `${zodiac.emoji} Sezon Słońca`,
      categoryColor: '#CEAE72',
      bigEmoji: zodiac.emoji,
      headline: `Słońce w ${zodiac.sign}`,
      body: zodiac.energy,
      darkGrad: ['#292101', '#42340A'] as const,
    },
    {
      id: 'aspect2',
      category: '🪐 Aspekty',
      categoryColor: '#A5B4FC',
      bigEmoji: '✦',
      headline: PLANETARY_ASPECTS[(doy + 7) % PLANETARY_ASPECTS.length].pl,
      body: PLANETARY_ASPECTS[(doy + 7) % PLANETARY_ASPECTS.length].desc,
      darkGrad: ['#1E1B4B', '#312E81'] as const,
    },
  ];
}

// ─── Komponent karty ───────────────────────────────────────────────────────────

interface NewsItem {
  id: string;
  category: string;
  categoryColor: string;
  bigEmoji: string;
  headline: string;
  body: string;
  darkGrad: readonly [string, string];
}

const NewsCard = React.memo(({ item, isLight }: { item: NewsItem; isLight: boolean }) => {
  if (isLight) {
    return (
      <View style={[s.cardLight, { width: CARD_W }]}>
        {/* Left accent bar */}
        <View style={[s.accentBar, { backgroundColor: item.categoryColor }]} />
        {/* Big emoji background */}
        <View style={s.bgEmojiWrap} pointerEvents="none">
          <Text style={s.bgEmoji}>{item.bigEmoji}</Text>
        </View>
        <View style={s.cardInner}>
          <View style={[s.pill, { backgroundColor: item.categoryColor + '22', borderColor: item.categoryColor + '66' }]}>
            <Text style={[s.pillText, { color: item.categoryColor }]}>{item.category}</Text>
          </View>
          <Text style={s.headlineLight} numberOfLines={1}>{item.headline}</Text>
          <Text style={s.bodyLight} numberOfLines={2}>{item.body}</Text>
        </View>
      </View>
    );
  }
  return (
    <LinearGradient
      colors={item.darkGrad}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s.cardDark, { width: CARD_W }]}
    >
      {/* Left accent bar */}
      <View style={[s.accentBar, { backgroundColor: item.categoryColor }]} />
      {/* Big emoji background (decorative) */}
      <View style={s.bgEmojiWrap} pointerEvents="none">
        <Text style={s.bgEmoji}>{item.bigEmoji}</Text>
      </View>
      <View style={s.cardInner}>
        <View style={[s.pill, { backgroundColor: item.categoryColor + '28', borderColor: item.categoryColor + '55' }]}>
          <Text style={[s.pillText, { color: item.categoryColor }]}>{item.category}</Text>
        </View>
        <Text style={s.headlineDark} numberOfLines={1}>{item.headline}</Text>
        <Text style={s.bodyDark} numberOfLines={2}>{item.body}</Text>
      </View>
    </LinearGradient>
  );
});

// ─── Strip ─────────────────────────────────────────────────────────────────────

export const CosmicNewsStrip = React.memo(({ isLight, accent }: { isLight: boolean; accent: string }) => {
  const scrollRef = useRef<ScrollView>(null);
  const currentIndex = useRef(0);
  const [dotIndex, setDotIndex] = useState(0);
  const isPaused = useRef(false);
  const items = React.useMemo(() => buildDailyCosmicNews(), []);
  const totalCards = items.length;

  const scrollToIndex = useCallback((idx: number) => {
    currentIndex.current = idx;
    setDotIndex(idx);
    scrollRef.current?.scrollTo({ x: idx * (CARD_W + GAP), animated: true });
  }, []);

  const autoScroll = useCallback(() => {
    if (isPaused.current) return;
    scrollToIndex((currentIndex.current + 1) % totalCards);
  }, [scrollToIndex, totalCards]);

  useEffect(() => {
    const id = setInterval(autoScroll, 4200);
    return () => clearInterval(id);
  }, [autoScroll]);

  const onScrollBeginDrag = useCallback(() => { isPaused.current = true; }, []);
  const onScrollEndDrag = useCallback(() => {
    setTimeout(() => { isPaused.current = false; }, 3000);
  }, []);

  const onMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + GAP));
    currentIndex.current = idx;
    setDotIndex(idx);
  }, []);

  const dateStr = React.useMemo(() => formatDatePL(new Date()), []);

  return (
    <Animated.View entering={FadeInDown.delay(120).duration(380)} style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={[s.headerLabel, { color: accent }]}>✦ WIADOMOŚCI KOSMICZNE</Text>
          <Text style={[s.headerDate, { color: isLight ? 'rgba(30,20,60,0.45)' : 'rgba(220,210,240,0.40)' }]}>{dateStr}</Text>
        </View>
        <View style={[s.livePulse, { borderColor: accent + '66', backgroundColor: accent + '22' }]}>
          <View style={[s.liveDot, { backgroundColor: accent }]} />
          <Text style={[s.liveText, { color: accent }]}>LIVE</Text>
        </View>
      </View>

      {/* Strip */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_W + GAP}
        snapToAlignment="start"
        contentContainerStyle={s.scrollContent}
        scrollEventThrottle={16}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        {items.map((item, i) => (
          <NewsCard key={item.id + i} item={item} isLight={isLight} />
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={s.dots}>
        {items.map((_, i) => (
          <Pressable key={i} onPress={() => scrollToIndex(i)} hitSlop={8}>
            <View style={[
              s.dot,
              i === dotIndex
                ? { width: 18, backgroundColor: accent }
                : { width: 6, backgroundColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.20)' },
            ]} />
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
});

// ─── Style ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 12,
  },
  headerLeft: { gap: 2 },
  headerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  headerDate: {
    fontSize: 11,
    fontWeight: '400',
  },
  livePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    gap: GAP,
  },
  // ── Dark card ──
  cardDark: {
    height: CARD_H,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  // ── Light card ──
  cardLight: {
    height: CARD_H,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1.5,
    borderColor: 'rgba(139,100,42,0.14)',
    // shadow
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  bgEmojiWrap: {
    position: 'absolute',
    right: -4,
    top: -6,
    opacity: 0.12,
  },
  bgEmoji: {
    fontSize: 72,
  },
  cardInner: {
    flex: 1,
    paddingLeft: 18,
    paddingRight: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 5,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headlineDark: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: '#F0EBF8',
  },
  headlineLight: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: '#1A1340',
  },
  bodyDark: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(210,200,235,0.82)',
  },
  bodyLight: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(30,20,60,0.65)',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
