// @ts-nocheck
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions,
  TextInput, Modal, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, Path, G, Line, Ellipse, Rect,
  Defs, RadialGradient, Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withSequence, withTiming, withSpring,
  withDelay, FadeInDown, FadeIn,
  interpolate, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Sparkles, ChevronRight, X,
  BookOpen, Eye, Leaf, Moon, Sun, Wind, Feather,
  Heart, Zap, RefreshCw, Play,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { screenContracts } from '../core/theme/designSystem';
import { HapticsService } from '../core/services/haptics.service';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '../core/utils/localeFormat';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#34D399';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── DATA ────────────────────────────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    question: 'Jakie środowisko najbardziej Cię pociąga?',
    options: [
      { label: 'Las — gęsty, tajemniczy, żywy', animals: ['wilk', 'jeleń', 'sowa', 'niedźwiedź', 'lis'] },
      { label: 'Ocean — niezmierzony, rytmiczny, głęboki', animals: ['delfin', 'wieloryb', 'krab', 'foka'] },
      { label: 'Góry — surowe, rozległe, milczące', animals: ['orzeł', 'niedźwiedź', 'kozica', 'lew'] },
      { label: 'Niebo — wolne, nieograniczone, jasne', animals: ['orzeł', 'jastrząb', 'jaskółka', 'kolibri'] },
      { label: 'Pustynia — bezkresna, gorąca, upalona', animals: ['wąż', 'jaszczurka', 'skarabeusz', 'lew'] },
      { label: 'Jaskinia — ukryta, ciemna, ochronna', animals: ['niedźwiedź', 'wilk', 'sowa', 'nietoperz'] },
    ],
  },
  {
    question: 'Jaka pora dnia przemawia do Twojej duszy?',
    options: [
      { label: 'Świt — gdy wszystko budzi się do życia', animals: ['jaskółka', 'kogut', 'jeleń', 'jastrząb'] },
      { label: 'Południe — pełen blask i aktywność', animals: ['lew', 'orzeł', 'koń', 'tygrys'] },
      { label: 'Zmierzch — czas między światami', animals: ['lis', 'sowa', 'jeleń', 'wilk'] },
      { label: 'Noc — głęboka, cicha, mistyczna', animals: ['sowa', 'wilk', 'niedźwiedź', 'wąż', 'krab'] },
      { label: 'Każda chwila jest pełna — bez preferencji', animals: ['delfin', 'pies', 'koń', 'orzeł'] },
    ],
  },
  {
    question: 'Jak reagujesz na wyzwania i trudności?',
    options: [
      { label: 'Stawiam czoła wprost, bez wahania', animals: ['lew', 'tygrys', 'wilk', 'orzeł'] },
      { label: 'Obserwuję i czekam na właściwy moment', animals: ['sowa', 'wąż', 'jastrząb', 'lis'] },
      { label: 'Szukam innej drogi, adaptuję się', animals: ['lis', 'delfin', 'wąż', 'krab'] },
      { label: 'Szukam wsparcia w grupie', animals: ['wilk', 'delfin', 'słoń', 'koń'] },
      { label: 'Wchodzę głębiej w siebie, medytuję', animals: ['niedźwiedź', 'sowa', 'wieloryb', 'jeleń'] },
    ],
  },
  {
    question: 'Co inni cenią w Tobie najbardziej?',
    options: [
      { label: 'Odwagę i zdolność przywódczą', animals: ['lew', 'orzeł', 'wilk', 'tygrys'] },
      { label: 'Mądrość i głębię spojrzenia', animals: ['sowa', 'wieloryb', 'wąż', 'niedźwiedź'] },
      { label: 'Lojalność i ciepło serca', animals: ['pies', 'wilk', 'delfin', 'koń'] },
      { label: 'Spryt i pomysłowość', animals: ['lis', 'delfin', 'krab', 'jaszczurka'] },
      { label: 'Łagodność i empatię', animals: ['jeleń', 'kolibri', 'gołąb', 'foka'] },
      { label: 'Siłę i stabilność', animals: ['niedźwiedź', 'słoń', 'koń', 'byk'] },
    ],
  },
  {
    question: 'Jaki element natury czujesz jako swój?',
    options: [
      { label: 'Ogień — namiętność, transformacja', animals: ['lew', 'tygrys', 'orzeł', 'jaszczurka'] },
      { label: 'Woda — głębia, intuicja, płynność', animals: ['delfin', 'wieloryb', 'foka', 'wąż', 'krab'] },
      { label: 'Ziemia — zakorzenienie, cierpliwość', animals: ['niedźwiedź', 'słoń', 'jeleń', 'koń'] },
      { label: 'Powietrze — wolność, wizja, komunikacja', animals: ['orzeł', 'jastrząb', 'jaskółka', 'kolibri'] },
      { label: 'Eter — intuicja, magia, tajemnica', animals: ['sowa', 'wilk', 'lis', 'wąż'] },
    ],
  },
  {
    question: 'Jak wyrażasz swoją duchowość?',
    options: [
      { label: 'Przez działanie i ceremonię', animals: ['wilk', 'orzeł', 'lew', 'koń'] },
      { label: 'Przez obserwację i kontemplację', animals: ['sowa', 'niedźwiedź', 'wieloryb', 'jeleń'] },
      { label: 'Przez relacje i miłość', animals: ['delfin', 'gołąb', 'kolibri', 'koń'] },
      { label: 'Przez poznanie i wiedzę', animals: ['sowa', 'lis', 'wąż', 'jastrząb'] },
      { label: 'Przez przemianę i uzdrowienie', animals: ['wąż', 'niedźwiedź', 'foka', 'delfin'] },
    ],
  },
  {
    question: 'Co odczuwasz, gdy jesteś sam ze sobą?',
    options: [
      { label: 'Spokój i głębokie zakorzenienie', animals: ['niedźwiedź', 'jeleń', 'wieloryb', 'sowa'] },
      { label: 'Energię i gotowość do działania', animals: ['wilk', 'orzeł', 'tygrys', 'koń'] },
      { label: 'Ciekawość i chęć odkrywania', animals: ['lis', 'delfin', 'jaszczurka', 'krab'] },
      { label: 'Tęsknotę za połączeniem z kimś', animals: ['wilk', 'delfin', 'gołąb', 'słoń'] },
      { label: 'Wizje i głęboka intuicja', animals: ['sowa', 'wąż', 'jastrząb', 'wieloryb'] },
    ],
  },
  {
    question: 'Jakie słowo najlepiej opisuje Twój wewnętrzny ogień?',
    options: [
      { label: 'Wolność', animals: ['orzeł', 'wilk', 'koń', 'jaskółka'] },
      { label: 'Mądrość', animals: ['sowa', 'wieloryb', 'niedźwiedź', 'wąż'] },
      { label: 'Siła', animals: ['lew', 'tygrys', 'niedźwiedź', 'słoń'] },
      { label: 'Czułość', animals: ['jeleń', 'delfin', 'kolibri', 'gołąb'] },
      { label: 'Spryt', animals: ['lis', 'delfin', 'krab', 'wąż'] },
      { label: 'Lojalność', animals: ['wilk', 'pies', 'słoń', 'koń'] },
    ],
  },
];

const SPIRIT_ANIMALS = [
  {
    id: 'wilk',
    name: 'Wilk',
    emoji: '🐺',
    subtitle: 'Duch stada i przywódca nocy',
    color: '#818CF8',
    powers: ['Przywództwo', 'Intuicja', 'Lojalność', 'Instynkt'],
    message: 'Twój instynkt jest starszy niż rozum — zaufaj mu, gdy mówi ci zawrócić lub ruszyć naprzód.',
    whenAppears: 'Gdy stoisz przed wyborem, który wymaga odwagi przywódcy lub gdy Twoja lojalność jest wystawiona na próbę.',
    howToConnect: 'Wyjdź o świcie lub zmierzchu. Stój w ciszy lasu lub parku. Oddychaj głęboko, wyobraź sobie księżyc nad Tobą.',
    meditation: 'Wyobraź sobie wilcze serce bijące rytmicznie w Twojej klatce piersiowej. Czujesz moc stada — jesteś częścią czegoś wielkiego. Rusz za instynktem.',
    shamanic: 'W tradycji lakotańskiej i słowiańskiej wilk jest strażnikiem ścieżek nocy i nauczycielem lojalności wobec clanu.',
    element: 'Ziemia + Księżyc',
    totemType: 'Przewodnik ścieżki',
    zodiac: 'Skorpion, Baran',
  },
  {
    id: 'orzeł',
    name: 'Orzeł',
    emoji: '🦅',
    subtitle: 'Posłaniec nieba i wizjoner',
    color: '#F59E0B',
    powers: ['Wizja', 'Wolność', 'Perspektywa', 'Połączenie z boskością'],
    message: 'Wznieś się ponad codzienność — z góry widać i więcej, i dalej. Perspektywa jest Twoim najcenniejszym darem.',
    whenAppears: 'Gdy utknąłeś w szczegółach i potrzebujesz szerszego spojrzenia. Gdy szukasz wyższego sensu lub łączności z duchowym wymiarem.',
    howToConnect: 'Wyjdź na otwartą przestrzeń, wzniesienie lub wzgórze. Patrz na horyzont. Rozłóż ramiona i poczuj wolność ciała.',
    meditation: 'Jesteś orłem szybującym nad lasami i górami. Pod Tobą kręci się mały świat ludzkich trosk. Widzisz wzorce — rozumiesz, co jest ważne.',
    shamanic: 'Orzeł jest boskim posłańcem w kulturach rdzennych Ameryki, Słowian i Celtów — niesie modlitwy do wyższych sfer.',
    element: 'Powietrze + Ogień',
    totemType: 'Posłaniec i strażnik',
    zodiac: 'Lew, Strzelec',
  },
  {
    id: 'niedźwiedź',
    name: 'Niedźwiedź',
    emoji: '🐻',
    subtitle: 'Uzdrowiciel i strażnik snu',
    color: '#92400E',
    powers: ['Siła', 'Uzdrowienie', 'Introspekcja', 'Ochrona'],
    message: 'Siła nie musi być głośna. Prawdziwa moc wynika ze spokojnej pewności i uzdrawiającej ciszy w środku.',
    whenAppears: 'W momentach głębokiego zmęczenia lub potrzeby regeneracji. Gdy musisz chronić siebie lub kogoś bliskiego.',
    howToConnect: 'Wejdź do lasu, przyciśnij plecami do pnia starego drzewa. Oddychaj brzuchem. Poczuj zakorzenienie.',
    meditation: 'Siedzisz w ciepłej, bezpiecznej jaskini. Ogień przed Tobą rzuca złote cienie. Niedźwiedź obok Ciebie śpi — jego oddech spowalnia Twój.',
    shamanic: 'Niedźwiedź to wśród Słowian i Syberyków symbol uzdrowiciela i strażnika zimowego snu — czasu wewnętrznej transformacji.',
    element: 'Ziemia',
    totemType: 'Strażnik i uzdrowiciel',
    zodiac: 'Byk, Rak',
  },
  {
    id: 'wąż',
    name: 'Wąż',
    emoji: '🐍',
    subtitle: 'Mistrz przemiany i mądrości',
    color: '#10B981',
    powers: ['Transformacja', 'Regeneracja', 'Mądrość', 'Uzdrowienie'],
    message: 'Nie bój się zrzucać starej skóry. Każde zakończenie jest początkiem — Twoja mądrość rośnie z każdą przemianą.',
    whenAppears: 'W czasach głębokiej zmiany, uzdrowienia lub przebudzenia. Gdy stara wersja Ciebie przestaje pasować.',
    howToConnect: 'Połóż się na ziemi. Oddychaj powoli, czując ciężar ciała. Wyobraź sobie jak wąż — wnikasz w każdą szczelinę rzeczywistości.',
    meditation: 'Jesteś wężem wijącym się przez kamienie i trawy. Twój dotyk poznaje prawdę powierzchni. Zrzucasz starą skórę — pod nią nowe, błyszczące łuski.',
    shamanic: 'W tradycji kuźni, alchemii i misteriów greckich wąż to caduceus — symbol uzdrowienia, dualności i wiedzy tajemnej.',
    element: 'Woda + Ziemia',
    totemType: 'Nauczyciel przemiany',
    zodiac: 'Skorpion, Panna',
  },
  {
    id: 'jeleń',
    name: 'Jeleń',
    emoji: '🦌',
    subtitle: 'Duch łagodności i czułej siły',
    color: '#F472B6',
    powers: ['Łagodność', 'Intuicja', 'Czułość', 'Piękno'],
    message: 'Łagodność to nie słabość — to najodważniejsza forma siły. Twoja czułość otwiera drzwi, których nie sforsuje żadna moc.',
    whenAppears: 'Gdy potrzebujesz przypomnienia o pięknie chwili. Gdy tracisz wrażliwość pod ciężarem codzienności.',
    howToConnect: 'Wyjdź o świcie do parku lub łąki. Siedź cicho. Obserwuj jak jeleń — bez pośpiechu, z pełną obecnością.',
    meditation: 'Stajesz na polanie we mgle świtu. Jesteś jeleniem — Twoje zmysły są wyostrzone. Słyszysz każdy szept trawy. Czujesz obecność lasu.',
    shamanic: 'Jeleń to w tradycji celtyckiej i nordyckiej posłaniec między światami — stoi na granicy natury i sacrum.',
    element: 'Powietrze + Ziemia',
    totemType: 'Posłaniec piękna',
    zodiac: 'Bliźnięta, Waga',
  },
  {
    id: 'lis',
    name: 'Lis',
    emoji: '🦊',
    subtitle: 'Trickster i mistrz obserwacji',
    color: '#F97316',
    powers: ['Spryt', 'Adaptacja', 'Obserwacja', 'Kreatywność'],
    message: 'Widzisz to, co inni przeoczają. Twój spryt to nie manipulacja — to sztuka widzenia ukrytych warstw rzeczywistości.',
    whenAppears: 'Gdy sytuacja wymaga dyplomacji i subtelności zamiast siły. Gdy nowe podejście otworzy drzwi.',
    howToConnect: 'Spaceruj o zmierzchu. Zatrzymuj się i obserwuj, jak lis — nieruchomo, z boku, całym ciałem słuchaj otoczenia.',
    meditation: 'Jesteś lisem przemierzającym granicę między miastem a lasem. Widzisz obie strony — znasz oba języki. Ta wiedza jest Twoją mocą.',
    shamanic: 'Lis to w japońskiej tradycji kitsune — duch mądry i wielowymiarowy, posłaniec bóstw Inari.',
    element: 'Ogień + Powietrze',
    totemType: 'Trickster i mądrość',
    zodiac: 'Bliźnięta, Waga',
  },
  {
    id: 'sowa',
    name: 'Sowa',
    emoji: '🦉',
    subtitle: 'Strażniczka nocy i mądrości',
    color: '#A78BFA',
    powers: ['Mądrość', 'Prawda', 'Przeznaczenie', 'Widzenie w ciemności'],
    message: 'Widzisz w ciemności — widzisz to, co ukryte. Nie bój się zadawać pytań, na które inni nie mają odwagi.',
    whenAppears: 'Gdy stoisz przed tajemnicą lub pytaniem wymagającym głębokiej prawdy. Gdy intuicja jest ważniejsza niż logika.',
    howToConnect: 'Siedź po zmroku w ciszy. Zamknij oczy i słuchaj nocnych dźwięków. Pytaj o prawdę, a nie o odpowiedź.',
    meditation: 'Siedzisz na gałęzi pradawnego dębu. Noc jest jasna od gwiazd. Twoje oczy widzą każdy cień. Wiesz, co inne sowy przemilczały.',
    shamanic: 'Sowa to w tradycji grecko-rzymskiej (Atena/Minerwa) symbol mądrości i przeznaczenia. W kulturach szamańskich — strażnik przejścia między światami.',
    element: 'Powietrze + Eter',
    totemType: 'Strażnik mądrości',
    zodiac: 'Panna, Koziorożec',
  },
  {
    id: 'lew',
    name: 'Lew',
    emoji: '🦁',
    subtitle: 'Król słońca i godności',
    color: '#F59E0B',
    powers: ['Odwaga', 'Godność', 'Przywództwo', 'Słoneczna siła'],
    message: 'Twoja godność to nie duma — to znajomość swojej wartości. Rządź przez inspirację, a Twoje królestwo będzie wierne.',
    whenAppears: 'Gdy Twoje przywództwo jest potrzebne. Gdy stoisz przed próbą odwagi lub musisz bronić swojego honoru.',
    howToConnect: 'Stań w słońcu. Wyprostuj się. Oddech do pełna. Poczuj słoneczną moc wchodzącą przez koronę głowy.',
    meditation: 'Leżysz na ciepłej skale w promieniach słońca. Jesteś lew — spokojny w swojej potędze. Każdy, kto przychodzi, przynosi szacunek.',
    shamanic: 'Lew to w afrykańskiej i egipskiej tradycji (Sekhmet, Sphinx) strażnik boskości, łącznik między sferą ludzką a boską.',
    element: 'Ogień + Słońce',
    totemType: 'Król i strażnik honoru',
    zodiac: 'Lew, Baran',
  },
  {
    id: 'delfin',
    name: 'Delfin',
    emoji: '🐬',
    subtitle: 'Ambasador radości i harmonii',
    color: '#38BDF8',
    powers: ['Radość', 'Komunikacja', 'Harmonia', 'Inteligencja emocjonalna'],
    message: 'Radość jest praktyką duchową. Twoja zdolność do harmonii z innymi jest rzadkim i cennym darem — pielęgnuj go.',
    whenAppears: 'Gdy potrzebujesz lekkości i zabawy. Gdy komunikacja wymaga empatii i mądrości serca.',
    howToConnect: 'Nurkuj — choćby wyobraźnią. Graj. Śmiej się. Połącz z innymi przez szczerość i lekkość.',
    meditation: 'Pływasz z delfinami w ciepłym, turkusowym oceanie. Komunikujecie się bez słów — czystą radością. Czujesz połączenie z każdą istotą.',
    shamanic: 'Delfin to w tradycji greckiej przewodnik dusz morza i symbol Apollona — boga muzyki, harmonii i przepowiedni.',
    element: 'Woda + Powietrze',
    totemType: 'Przewodnik harmonii',
    zodiac: 'Ryby, Bliźnięta',
  },
  {
    id: 'koń',
    name: 'Koń',
    emoji: '🐴',
    subtitle: 'Wolny duch i towarzyski podróżnik',
    color: '#D97706',
    powers: ['Wolność', 'Siła', 'Podróż', 'Towarzystwo'],
    message: 'Jesteś stworzony do ruchu i wolności. Zatrzymanie jest tylko snem — Twoja dusza żyje pełnią, gdy biegnie.',
    whenAppears: 'Gdy czujesz potrzebę zmiany, podróży lub wyzwolenia się z ograniczeń. Gdy tęsknisz za wolnością.',
    howToConnect: 'Wyjdź na otwartą przestrzeń. Biegnij lub idź szybko. Poczuj wiatr we włosach. Niech ciało prowadzi.',
    meditation: 'Galopujesz przez otwartą łąkę. Grzywą na wietrze. Żadnych granic — tylko ziemia pod kopytami i niebo nad Tobą. Jesteś wolny.',
    shamanic: 'Koń to w tradycji stepowych ludów Azji Środkowej i Celtów symbol wolności, podróży duszy i kosmicznej siły.',
    element: 'Powietrze + Ogień',
    totemType: 'Duch podróży',
    zodiac: 'Strzelec, Bliźnięta',
  },
  {
    id: 'tygrys',
    name: 'Tygrys',
    emoji: '🐯',
    subtitle: 'Samotnik i mistrz skupienia',
    color: '#EF4444',
    powers: ['Skupienie', 'Odwaga', 'Spontaniczność', 'Mistyczna siła'],
    message: 'Działasz najpiękniej, gdy jesteś sam ze swoją mocą. Twoja siła nie szuka poklasku — po prostu jest.',
    whenAppears: 'Gdy potrzebujesz skupienia i zdecydowania. Gdy nadszedł czas działania po długim przygotowaniu.',
    howToConnect: 'Wstań przed świtem. Ćwicz w skupieniu. Medytuj o jednym celu. Poczuj, jak moc zbiera się w Twoim centrum.',
    meditation: 'Idziesz przez dżunglę o zmroku. Każdy krok jest pewny i cichy. Znasz swoje terytorium — to przestrzeń Twojej mocy.',
    shamanic: 'Tygrys to w tradycji hinduskiej i chińskiej symbol kosmicznej siły, strażnik świętych gajów i bram duchowych.',
    element: 'Ogień + Ziemia',
    totemType: 'Strażnik i łowca',
    zodiac: 'Baran, Skorpion',
  },
  {
    id: 'słoń',
    name: 'Słoń',
    emoji: '🐘',
    subtitle: 'Strażnik pamięci i mądrości klanu',
    color: '#94A3B8',
    powers: ['Pamięć', 'Mądrość', 'Empatia', 'Cierpliwość', 'Ochrona rodziny'],
    message: 'Nosisz mądrość przodków — nie zapomnij jej szanować. Twoja siła jest w relacjach, nie w samotności.',
    whenAppears: 'Gdy potrzebujesz cierpliwości lub kiedy ważna jest pamięć o korzeniach. Gdy dbasz o innych.',
    howToConnect: 'Zasiądź z rodziną lub bliskimi przyjaciółmi. Opowiadajcie historie. Szanujcie przeszłość.',
    meditation: 'Idziesz z wielkim stadem przez sawannę. Słyszysz głęboki, spokojny oddech każdego. Jesteś połączony z każdym — pamięć stada to Twoja pamięć.',
    shamanic: 'Słoń to w tradycji hinduskiej Ganesha — pan początków, usuwacz przeszkód i strażnik mądrości.',
    element: 'Ziemia',
    totemType: 'Strażnik rodu',
    zodiac: 'Byk, Rak',
  },
  {
    id: 'jastrząb',
    name: 'Jastrząb',
    emoji: '🦅',
    subtitle: 'Posłaniec i obserwator wzorców',
    color: '#EC4899',
    powers: ['Obserwacja', 'Skupienie', 'Posłannictwo', 'Szybkość'],
    message: 'Widzisz wzorce, zanim inni je dostrzegą. Twoja uwaga jest najprecyzyjniejszym narzędziem, jakie posiadasz.',
    whenAppears: 'Gdy musisz podjąć szybką decyzję lub gdy ważne przesłanie próbuje do Ciebie dotrzeć.',
    howToConnect: 'Ćwicz uważną obserwację. Siądź i patrz na jeden punkt przez minutę. Zauważaj detale.',
    meditation: 'Szybujasz wysoko. Twoje oczy rejestrują wszystko poniżej z niesamowitą precyzją. Widzisz mysia ścieżka w trawie — wzorce życia.',
    shamanic: 'Jastrząb to w tradycji rdzennej Ameryki posłaniec Stwórcy — niesie wizje i nadchodzące zmiany.',
    element: 'Powietrze + Ogień',
    totemType: 'Posłaniec i obserwator',
    zodiac: 'Baran, Wodnicy',
  },
  {
    id: 'wieloryb',
    name: 'Wieloryb',
    emoji: '🐋',
    subtitle: 'Strażnik kosmicznej pieśni',
    color: '#60A5FA',
    powers: ['Głęboka mądrość', 'Pieśń duszy', 'Kosmiczna pamięć', 'Cierpliwość'],
    message: 'Nosisz w sobie kosmiczną pieśń starszą niż słowa. Kiedy jesteś cichy, słyszysz ją — i właśnie wtedy wiesz.',
    whenAppears: 'Gdy potrzebujesz dostępu do głębokiej, archaicznej mądrości. Gdy medytacja otwiera dalekie wizje.',
    howToConnect: 'Zanurkuj w ciszy. Słuchaj muzyki lub dźwięku wody. Medytuj dłużej niż zwykle — zejdź na głębię.',
    meditation: 'Jesteś wielorybem w przepaści oceanu. Twoja pieśń niesie się tysiące mil. Każdy dźwięk to słowo starszej mądrości niż ludzka.',
    shamanic: 'Wieloryb to w tradycji pacyficznych ludów strażnik skarbca pamięci oceanu i nośnik dusz między światami.',
    element: 'Woda + Eter',
    totemType: 'Strażnik kosmicznej pamięci',
    zodiac: 'Ryby, Rak',
  },
  {
    id: 'kolibri',
    name: 'Kolibri',
    emoji: '🐦',
    subtitle: 'Duch radości i chwili obecnej',
    color: '#34D399',
    powers: ['Radość', 'Chwila obecna', 'Piękno', 'Wytrwałość'],
    message: 'Najcenniejsza podróż odbywa się w chwili obecnej. Twoja lekkość jest siłą — nie wszyscy potrafią tak latać.',
    whenAppears: 'Gdy gubisz się w przeszłości lub przyszłości. Gdy piękno chwili czeka na Twoje zauważenie.',
    howToConnect: 'Zacznij dostrzegać małe piękna: kwiat, kolor nieba, smak herbaty. Ćwicz wdzięczność tu i teraz.',
    meditation: 'Wiszysz w powietrzu przed kwiatem. Czas zwolnił. Słyszysz każde uderzenie skrzydeł. Ta chwila jest doskonała i cała.',
    shamanic: 'Kolibri to w tradycji Majów i Azteków symbol nieśmiertelności duszy wojownika — powraca jako piękno i radość.',
    element: 'Powietrze + Ogień',
    totemType: 'Duch chwili',
    zodiac: 'Bliźnięta, Waga',
  },
  {
    id: 'krab',
    name: 'Krab',
    emoji: '🦀',
    subtitle: 'Strażnik granic i intuicji',
    color: '#F472B6',
    powers: ['Ochrona', 'Intuicja', 'Elastyczność', 'Granice'],
    message: 'Twoja skorupa jest mądrością, nie strachem. Wiedz, kiedy otworzyć się na świat, a kiedy chronić swoje sanktuarium.',
    whenAppears: 'Gdy musisz postawić zdrowe granice lub gdy intuicja mówi Ci, żeby się cofnąć.',
    howToConnect: 'Spaceruj brzegiem wody. Medytuj o granicach — co chronisz, co wpuszczasz. Pytaj: co naprawdę do mnie należy?',
    meditation: 'Idziesz bocznym krokiem po dnie oceanu. Czujesz każde prądy wody — to intuicja. Twoja skorupa chroni rdzeń najpiękniejszego.',
    shamanic: 'Krab to w tradycji chińskiej i oceanicznej symbol cyklu księżyca i intuicyjnej ochrony domowego ogniska.',
    element: 'Woda',
    totemType: 'Strażnik granic',
    zodiac: 'Rak, Ryby',
  },
  {
    id: 'foka',
    name: 'Foka',
    emoji: '🦭',
    subtitle: 'Duch zabawy i wodnego snu',
    color: '#7DD3FC',
    powers: ['Zabawa', 'Sen leczniczy', 'Elastyczność', 'Wyobraźnia'],
    message: 'Zabawa to modlitwa ciała. Kiedy się śmiejesz i tańczysz w wodzie, uzdrawiasz siebie głębiej niż w poważnej medytacji.',
    whenAppears: 'Gdy ciało i duch potrzebują oddechu, lekkości, zabawy. Gdy sen jest nieregularny.',
    howToConnect: 'Pływaj, jeśli możesz. Tańcz swobodnie. Śmiej się z przyjaciółmi. Odpuść powagę na jeden wieczór.',
    meditation: 'Pływasz w spokojnej zatoce. Woda niesie Cię jak sen. Obracasz się i nurkujesz bez celu — po prostu jesteś wodą i ciałem.',
    shamanic: 'Foka to w kulturze Inuit i celtyckich legendach selkie — duch kobiety-foki, strażniczki granicy między lśniącą wodą a lądem.',
    element: 'Woda',
    totemType: 'Duch snu i zabawy',
    zodiac: 'Ryby, Rak',
  },
  {
    id: 'jaszczurka',
    name: 'Jaszczurka',
    emoji: '🦎',
    subtitle: 'Mistrz snów i przetrwania',
    color: '#86EFAC',
    powers: ['Sny', 'Adaptacja', 'Przetrwanie', 'Regeneracja'],
    message: 'Jesteś mistrzem regeneracji — odrastasz to, co utraciłeś. Twoje sny są mapą tego, czego szuka Twoja dusza.',
    whenAppears: 'Gdy pracujesz ze snami lub gdy potrzebujesz odbudować się po stracie.',
    howToConnect: 'Zapisuj sny. Słońcuj się przez kilka minut dziennie. Ćwicz wizualizację przed snem.',
    meditation: 'Leżysz na ciepłym kamieniu w słońcu. Twoje ciało absorbuje ciepło i moc słońca. Sny z poprzedniej nocy wracają — tym razem rozumiesz ich język.',
    shamanic: 'Jaszczurka to w tradycji australijskich Aborygenów strażnik świata snów Dreaming — niesie wizje z zaświatów.',
    element: 'Ogień + Ziemia',
    totemType: 'Strażnik snów',
    zodiac: 'Panna, Skorpion',
  },
  {
    id: 'gołąb',
    name: 'Gołąb',
    emoji: '🕊️',
    subtitle: 'Posłaniec pokoju i nowego początku',
    color: '#E0F2FE',
    powers: ['Pokój', 'Miłość', 'Nowy początek', 'Posłannictwo'],
    message: 'Pokój, który nosisz w sobie, jest przesłaniem dla świata. Każde Twoje słowo może być gałązką oliwną.',
    whenAppears: 'Gdy świat wokół jest niespokojny. Gdy szukasz pojednania lub sensu w tym, co się dzieje.',
    howToConnect: 'Pisz listy, których nie wyślesz. Wybaczaj — nie dla nich, dla siebie. Medytuj o białym świetle.',
    meditation: 'Lecisz biały i cichy nad miastem. W dziobie trzymasz gałązkę — przesłanie nadziei. Każde miasto, które widzisz, jest Twoim domem.',
    shamanic: 'Gołąb to w tradycji chrześcijańskiej, sumeryjskiej (Isztar) i greckiej (Afrodyta) symbol pokoju, ducha i boskiej miłości.',
    element: 'Powietrze',
    totemType: 'Posłaniec pokoju',
    zodiac: 'Waga, Ryby',
  },
  {
    id: 'pies',
    name: 'Pies',
    emoji: '🐕',
    subtitle: 'Wierny strażnik serca',
    color: '#CEAE72',
    powers: ['Lojalność', 'Ochrona', 'Miłość bezwarunkowa', 'Instynkt'],
    message: 'Twoja lojalność jest najpiękniejszą formą miłości. Kochaj wiernie — to zmienia świat mocniej niż jakiekolwiek wielkie słowa.',
    whenAppears: 'Gdy relacje wymagają głębszego zaangażowania. Gdy ktoś bliski potrzebuje ochrony lub opieki.',
    howToConnect: 'Spędź czas z psem lub naturą. Ćwicz bezwarunkową obecność z kimś bliskim. Nie osądzaj — po prostu bądź.',
    meditation: 'Siedzisz obok istoty, którą kochasz. Nie mówisz nic. Twoja obecność jest całym językiem. To jest wystarczające.',
    shamanic: 'Pies to w tradycji egipskiej (Anubis), azteckiej (Xolotl) i słowiańskiej strażnik progu między życiem a zaświatami.',
    element: 'Ziemia',
    totemType: 'Strażnik progu',
    zodiac: 'Rak, Panna',
  },
  {
    id: 'jaskółka',
    name: 'Jaskółka',
    emoji: '🐦‍⬛',
    subtitle: 'Duch powrotu i nowej nadziei',
    color: '#A5B4FC',
    powers: ['Nadzieja', 'Powrót', 'Zwinność', 'Wiosna'],
    message: 'Zawsze wracasz — bo to, co kochasz, nie znika. Twoja zwinność w trudnych czasach jest cudem równym lotowi.',
    whenAppears: 'Na początku nowych cykli, gdy nadzieja wraca po ciemnej zimie. Gdy zakończenie okazuje się początkiem.',
    howToConnect: 'Obserwuj niebo o świcie. Śledź lot ptaków. Pozwól, żeby ich swoboda przypomniała Ci o Twoim potencjale.',
    meditation: 'Lecisz z innymi jaskółkami — setkami skrzydeł w jednym rytmie. Formacje zmieniają się płynnie. Wszyscy są jednością.',
    shamanic: 'Jaskółka to w tradycji słowiańskiej i japońskiej symbol duszy, która powraca do domu — symbol nieśmiertelności i cyklu.',
    element: 'Powietrze',
    totemType: 'Duch nadziei i cyklu',
    zodiac: 'Bliźnięta, Ryby',
  },
  {
    id: 'kozica',
    name: 'Kozica',
    emoji: '🦌',
    subtitle: 'Duch pewności na stromej ścieżce',
    color: '#D1FAE5',
    powers: ['Pewność kroku', 'Równowaga', 'Odwaga wysokości', 'Niezależność'],
    message: 'Tam, gdzie inni widzą przepaść, Ty widzisz ścieżkę. Twoja pewność siebie to praktyka, nie przypadek.',
    whenAppears: 'Gdy stoisz na skraju czegoś nieznanego. Gdy potrzebujesz zaufania do własnych kroków.',
    howToConnect: 'Chodź po nierównym terenie. Chodzenie boso po trawie lub kamieniach uziemia i buduje pewność ciała.',
    meditation: 'Stoisz na wąskiej półce skalnej tysiąc metrów nad doliną. Wiatr szumi. Twoje kopyta są pewne jak kotwice. Nie boisz się — jesteś u siebie.',
    shamanic: 'Kozica to w tradycji alpejskiej i kaukaskiej symbol błyskotliwości ducha, który pokonuje największe przeszkody z gracją.',
    element: 'Powietrze + Ziemia',
    totemType: 'Duch pewności',
    zodiac: 'Koziorożec, Baran',
  },
  {
    id: 'skarabeusz',
    name: 'Skarabeusz',
    emoji: '🐞',
    subtitle: 'Strażnik przemiany i odrodzenia',
    color: '#065F46',
    powers: ['Odrodzenie', 'Regeneracja', 'Transformacja', 'Ochrona'],
    message: 'Z każdego ciemnego miejsca możesz toczyć swoje słońce naprzód. Przemiana jest Twoim prawdziwym domem.',
    whenAppears: 'Gdy stare musi umrzeć, żeby nowe mogło żyć. Gdy przechodzisz przez inicjację lub kryzys tożsamości.',
    howToConnect: 'Obserwuj owady lub naturę regenerującą się po zimie. Zapisuj: co stare chcesz porzucić? Co nowe kiełkuje?',
    meditation: 'Toczysz przed sobą kula słońca. To kula Twojej intencji. Każdy krok przenosi ją dalej — każdy dzień jest odrodzeniem.',
    shamanic: 'Skarabeusz to w tradycji egipskiej (Chepri) symbol boga porannego słońca i odrodzenia — amulet nieśmiertelności.',
    element: 'Ogień + Ziemia',
    totemType: 'Strażnik odrodzenia',
    zodiac: 'Panna, Skorpion',
  },
  {
    id: 'byk',
    name: 'Byk',
    emoji: '🐂',
    subtitle: 'Siła ziemi i wytrwałości',
    color: '#92400E',
    powers: ['Wytrwałość', 'Płodność', 'Siła fizyczna', 'Zakorzenienie'],
    message: 'Prawdziwa siła nie spieszy się. Każdy krok, który stawiasz z determinacją, zmienia ziemię pod Twoimi nogami.',
    whenAppears: 'Gdy potrzebujesz wytrwałości w długim projekcie. Gdy brakuje Ci cierpliwości lub zakorzenienia.',
    howToConnect: 'Pracuj rękami — ogród, gotowanie, craft. Dbaj o ciało fizycznie. Zakorzenienie zaczyna się w stopach.',
    meditation: 'Stoisz na polu o świcie. Twoje kopyta schodzą głęboko w ziemię. Poczuj tę siłę — nieskończoną cierpliwość życia.',
    shamanic: 'Byk to w tradycji sumeryjskiej, minojskiej i hinduskiej symbol płodności ziemi, boskiej mocy i ofiary',
    element: 'Ziemia',
    totemType: 'Strażnik wytrwałości',
    zodiac: 'Byk, Koziorożec',
  },
  {
    id: 'nietoperz',
    name: 'Nietoperz',
    emoji: '🦇',
    subtitle: 'Przewodnik przez inicjację',
    color: '#6D28D9',
    powers: ['Inicjacja', 'Widzenie sonarowe', 'Transformacja', 'Odrodzenie'],
    message: 'Nie boisz się ciemności — nawigujesz przez nią. Twoja zdolność do odnajdywania drogi bez światła jest Twoim najcenniejszym zmysłem.',
    whenAppears: 'W momentach głębokiej inicjacji, gdy coś definitywnie się kończy, a nowe jeszcze nie przybyło.',
    howToConnect: 'Medytuj o zmroku. Zamknij oczy i zaufaj wewnętrznemu sonarowi. Idź tam, gdzie nie widać wyraźnie.',
    meditation: 'Latasz w zupełnej ciemności. Twój sonar maluje świat dźwiękiem. Widzisz bez oczu. Wiesz bez słów. Domu nie trzeba szukać — Ty zawsze wiesz.',
    shamanic: 'Nietoperz to w tradycji środkowoamerykańskiej (Camazotz) i europejskiej alchemii strażnik przejścia przez śmierć do odrodzenia.',
    element: 'Eter + Powietrze',
    totemType: 'Przewodnik inicjacji',
    zodiac: 'Skorpion, Ryby',
  },
  {
    id: 'żuraw',
    name: 'Żuraw',
    emoji: '🕊️',
    subtitle: 'Strażnik długiego życia i wdzięku',
    color: '#E0E7FF',
    powers: ['Wdzięk', 'Długowieczność', 'Cierpliwość', 'Skupienie'],
    message: 'Piękno jest w precyzji i skupieniu. Twoja cierpliwość i wdzięk to cechy rzadkie i bezcenne w tym hałaśliwym świecie.',
    whenAppears: 'Gdy pragniesz więcej wdzięku, cierpliwości i skupienia w swoich działaniach.',
    howToConnect: 'Ćwicz tai chi, jogę lub powolny taniec. Praktykuj precyzję w małych ruchach.',
    meditation: 'Stoisz jednonożnie w spokojnej wodzie. Jesteś żurawiem. Twoja nieruchomość jest perfekcją. Ryba sama podpływa do czekającego skupienia.',
    shamanic: 'Żuraw to w tradycji chińskiej i japońskiej symbol nieśmiertelności, szczęścia i niebiańskiej mądrości.',
    element: 'Powietrze + Woda',
    totemType: 'Strażnik wdzięku',
    zodiac: 'Panna, Waga',
  },
  {
    id: 'jeż',
    name: 'Jeż',
    emoji: '🦔',
    subtitle: 'Duch ochrony i ciekawości',
    color: '#D97706',
    powers: ['Ochrona', 'Ciekawość', 'Intuicja', 'Samoobrona'],
    message: 'Twoje granice są piękne i konieczne. Ciekawość otwiera Cię na świat — kolce chronią Twoje serce.',
    whenAppears: 'Gdy musisz wzmocnić granice lub gdy introwertwizm jest Twoją siłą, a nie słabością.',
    howToConnect: 'Spaceruj o zmierzchu w ciszy. Zatrzymaj się przy czymś małym i pięknym — poświęć mu uwagę.',
    meditation: 'Zwijasz się w kulę bezpieczeństwa. W środku jest Twój rdzeń — bezpieczny, ciepły, nienaruszony. Kolce to miłość, nie lęk.',
    shamanic: 'Jeż to w tradycji słowiańskiej i celtów symbol mądrości ziemi, ochrony domu i przemijania cykli natury.',
    element: 'Ziemia',
    totemType: 'Strażnik własnej przestrzeni',
    zodiac: 'Rak, Panna',
  },
];

// Compute result from quiz answers
function computeSpritAnimal(answers: number[][]): typeof SPIRIT_ANIMALS[0] {
  const score: Record<string, number> = {};
  SPIRIT_ANIMALS.forEach(a => { score[a.id] = 0; });
  answers.forEach((opts, qi) => {
    opts.forEach(optIdx => {
      const animals = QUIZ_QUESTIONS[qi].options[optIdx]?.animals || [];
      animals.forEach(a => { if (score[a] !== undefined) score[a] += 1; });
    });
  });
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0]?.[0];
  return SPIRIT_ANIMALS.find(a => a.id === best) || SPIRIT_ANIMALS[0];
}

const TOTEM_TYPES = [
  {
    id: 'power',
    label: 'Zwierzę Mocy',
    emoji: '⚡',
    desc: 'Towarzyszące przez całe życie, odzwierciedlające Twoją wrodzoną naturę i największy potencjał.',
    example: 'Jedno zwierzę, które zawsze przy Tobie było w snach i wyobraźni.',
  },
  {
    id: 'journey',
    label: 'Zwierzę Podróży',
    emoji: '🌊',
    desc: 'Pojawia się w konkretnym rozdziale życia — niesie lekcję, którą trzeba przeżyć, zanim odejdzie.',
    example: 'Może być inne w trudnym roku niż w czasie spokoju.',
  },
  {
    id: 'shadow',
    label: 'Zwierzę Cienia',
    emoji: '🌑',
    desc: 'Zwierzę, którego się boisz lub odrzucasz — niesie Twoje nieuświadomione zasoby i nieakceptowane cechy.',
    example: 'Strach przed wężem może oznaczać nieakceptowaną zdolność do transformacji.',
  },
  {
    id: 'messenger',
    label: 'Zwierzę Posłaniec',
    emoji: '💌',
    desc: 'Pojawia się w snach lub rzeczywistości, niosąc konkretne przesłanie — zwykle nieoczekiwanie.',
    example: 'Trzy razy trafiasz na zdjęcie sowy — ona niesie odpowiedź na Twoje pytanie.',
  },
];

const DAILY_MESSAGES: Record<string, string[]> = {
  wilk: ['Zaufaj swojemu instynktowi — mówi Ci prawdę, zanim umysł dotrze do logiki.','Dziś wyjdź w plener i stań chwilę w ciszy. Poczuj, co mówi las.','Lojalność to dar — ofiaruj go dzisiaj komuś, kto jej potrzebuje.','Twoje przywództwo jest potrzebne — nie bój się sięgać naprzód.','Księżyc jest po Twojej stronie. Pracuj nocą, gdy umysł jest najostrzejszy.','Stado Cię wspiera. Pozwól się wzmocnić przez tych, którym ufasz.','Poluj w ciszy — najlepsze wyniki rodzą się z koncentracji, nie z hałasu.'],
  orzeł: ['Wejdź na wyższe piętro — dosłownie lub w myślach. Perspektywa zmienia wszystko.','Dziś Twoje oczy widzą dalej. Ufaj wizji, którą masz.','Wolność jest wewnętrzna — nikt Ci jej nie może dać ani zabrać.','Skrzydła masz rozłożone — wystarczy jedno pchnięcie wiatru, żeby szybować.','Przelatuj ponad tym, co ciągnie w dół. Jesteś stworzony do wzlotu.','Posłanie do boskości: twoje modlitwy docierają tam, gdzie myśl nie sięga.','Widzisz wzorce — zaufaj im. To wgląd, który wyprzedza słowa.'],
  niedźwiedź: ['Dziś odpocznij bardziej, niż planujesz. To nie lenistwo — to mądrość.','Twoja siła jest spokojną pewnością, nie głośną siłą. Milcz i działaj.','Wejdź do lasu lub parku. Połóż plecami do drzewa. Poczuj wsparcie.','Zimowe dormancje kończą się — czas wybudzić się i działać ze świeżą energią.','Chroń swój wewnętrzny dom. Nie wszystko, co wchodzi, ma prawo zostać.','Uzdrowienie wymaga czasu — daj sobie tyle, ile potrzebujesz.','Introspekcja jest praktyką. Dziś wejdź głębiej w siebie.'],
  wąż: ['Co możesz dziś zrzucić, żeby stać się lżejszym? Zacznij od jednej rzeczy.','Twoja zdolność do regeneracji jest niezwykła — pamiętaj o tym, gdy jest trudno.','Mądrość jest nie w słowach, ale w ciszy między nimi.','Przemiana boli, ale każda nowa skóra jest piękniejsza.','Uzdrawiasz sam siebie — i innych — przez swoją obecność.','Spałeś z wężem w snach? To przesłanie transformacji czeka na odczytanie.','Rusz się powoli i świadomie. Czujesz ziemię pod każdym krokiem.'],
  jeleń: ['Zatrzymaj się przy pięknie — dzisiaj jedna chwila zachwytu wystarczy.','Łagodność jest odwagą najczystszej formy. Nie trać jej.','Twoje zmysły są wyostrzone — słuchaj subtelnych sygnałów.','Stój na granicy — tam, gdzie las spotyka polanę. To Twoje miejsce.','Czułość nie jest słabością — jest darem, który zmienia relacje.','Świt jest dla Ciebie. Wstań wcześnie i powitaj dzień w ciszy.','Poczuj, jak Twoje stopy dotykają ziemi. To wystarczy — jesteś tu, teraz.'],
  lis: ['Obserwuj, zanim zadziałasz. Zobaczyć więcej to wygrać więcej.','Spryt jest Twoją mocą — użyj go dzisiaj kreatywnie, nie manipulacyjnie.','Zmierzch jest Twoim czasem. O tej porze Twoja intuicja mówi najgłośniej.','Widzisz obie strony każdej historii — to jest rząd dusz niewielu.','Adaptacja jest mądrością. Dziś dopasuj plan do rzeczywistości.','Trickster w Tobie ma rację — nie bierz życia zbyt poważnie.','Granica między miastem a lasem jest Twoim domem. Żyj w obu światach.'],
  sowa: ['Zadaj dzisiaj pytanie, które boisz się zadać. Sowa nie boi się ciemności.','Twoja mądrość jest cenna — podziel się nią z kimś, kto pyta.','Widzisz to, co ukryte. Zaufaj temu widzeniu.','Noc przyniesie wgląd, jeśli pozwolisz jej mówić. Zapisz sny.','Milczenie jest częścią mądrości. Dziś mów mniej, słuchaj więcej.','Prawda jest zawsze lepsza niż komfort kłamstwa. Mów prawdę.','Przeznaczenie jest prawdziwsze niż przypadek — ufaj wzorcom, które widzisz.'],
};

function getDailyMessage(animalId: string): string {
  const msgs = DAILY_MESSAGES[animalId] || ['Twoje zwierzę ducha jest przy Tobie. Wsłuchaj się w ciszę.', 'Dziś idź za instynktem — jest mądrzejszy niż plan.', 'Połącz się z naturą. Choćby przez okno. Choćby przez chwilę.'];
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return msgs[dayOfYear % msgs.length];
}

// ─── SVG HERO ────────────────────────────────────────────────────────────────

const AnimatedPath = Animated.createAnimatedComponent(Path);

const SpiritForestHero = ({ accent }: { accent: string }) => {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const mist = useSharedValue(0);
  const eye1 = useSharedValue(0.3);
  const eye2 = useSharedValue(0.2);

  useEffect(() => {
    mist.value = withRepeat(
      withSequence(withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.sin) })),
      -1, false,
    );
    eye1.value = withDelay(800, withRepeat(
      withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 2200 }), withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 4000 })),
      -1, false,
    ));
    eye2.value = withDelay(2400, withRepeat(
      withSequence(withTiming(1, { duration: 300 }), withTiming(0.2, { duration: 1800 }), withTiming(1, { duration: 300 }), withTiming(0.2, { duration: 5000 })),
      -1, false,
    ));
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-18, Math.min(18, e.translationY * 0.10));
      tiltY.value = Math.max(-18, Math.min(18, e.translationX * 0.10));
    })
    .onEnd(() => {
      tiltX.value = withSpring(0, { damping: 14 });
      tiltY.value = withSpring(0, { damping: 14 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }],
  }));
  const mistStyle = useAnimatedStyle(() => ({
    opacity: interpolate(mist.value, [0, 1], [0.22, 0.44]),
  }));
  const eye1Style = useAnimatedStyle(() => ({ opacity: eye1.value }));
  const eye2Style = useAnimatedStyle(() => ({ opacity: eye2.value }));

  const H = 240;
  const cx = SW / 2;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[outerStyle, { height: H, overflow: 'hidden', marginBottom: 8 }]}>
        <LinearGradient
          colors={['#050D08', '#0A1A10', '#0D2015']}
          style={StyleSheet.absoluteFill}
        />
        <Svg width={SW} height={H}>
          <Defs>
            <RadialGradient id="moonGlow" cx="50%" cy="15%" r="30%">
              <Stop offset="0%" stopColor="#FFFDE7" stopOpacity="0.55" />
              <Stop offset="100%" stopColor="#FFFDE7" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="mistGrad" cx="50%" cy="100%" r="60%">
              <Stop offset="0%" stopColor={accent} stopOpacity="0.28" />
              <Stop offset="100%" stopColor={accent} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Moon glow */}
          <Circle cx={cx} cy={28} r={70} fill="url(#moonGlow)" />
          {/* Moon */}
          <Circle cx={cx} cy={28} r={22} fill="#FFFDE7" opacity={0.82} />
          <Circle cx={cx + 10} cy={22} r={18} fill="#0A1A10" />

          {/* Stars */}
          {[[cx - 80, 18], [cx + 90, 12], [cx - 140, 35], [cx + 150, 42], [cx - 60, 55], [cx + 70, 60], [cx - 110, 80], [cx + 120, 75]].map(([sx, sy], i) => (
            <Circle key={i} cx={sx} cy={sy} r={i % 3 === 0 ? 1.8 : 1} fill="white" opacity={0.6} />
          ))}

          {/* Far trees (small) */}
          {[[-60, 170, 22, 80], [-20, 160, 18, 70], [40, 175, 16, 65], [90, 165, 20, 75], [cx - 30, 155, 28, 95], [cx + 50, 158, 24, 88], [cx + 100, 162, 20, 78], [cx + 140, 170, 22, 80]].map(([tx, ty, w, th], i) => (
            <G key={'ft' + i}>
              <Path d={`M${tx + w / 2},${ty - th} L${tx},${ty} L${tx + w},${ty} Z`} fill="#0F2A18" opacity={0.7} />
              <Path d={`M${tx + w / 2},${ty - th * 0.65} L${tx - 4},${ty - th * 0.35} L${tx + w + 4},${ty - th * 0.35} Z`} fill="#0F2A18" opacity={0.7} />
            </G>
          ))}

          {/* Close trees (large, foreground) */}
          {[[0, H, 48, 145], [SW - 48, H, 48, 130], [cx - 120, H, 38, 110], [cx + 82, H, 44, 125]].map(([tx, ty, w, th], i) => (
            <G key={'ct' + i}>
              <Path d={`M${tx + w / 2},${ty - th} L${tx - 6},${ty} L${tx + w + 6},${ty} Z`} fill="#071410" opacity={0.95} />
              <Path d={`M${tx + w / 2},${ty - th * 0.62} L${tx - 10},${ty - th * 0.32} L${tx + w + 10},${ty - th * 0.32} Z`} fill="#071410" opacity={0.95} />
              <Path d={`M${tx + w / 2},${ty - th * 0.85} L${tx + 4},${ty - th * 0.6} L${tx + w - 4},${ty - th * 0.6} Z`} fill="#071410" opacity={0.95} />
            </G>
          ))}

          {/* Ground mist */}
          <Ellipse cx={cx} cy={H - 10} rx={SW * 0.7} ry={38} fill="url(#mistGrad)" />

          {/* Glowing animal eyes — left shadows */}
          <Circle cx={cx - 95} cy={H - 55} r={5} fill={accent} opacity={0.0} />
          <Circle cx={cx - 80} cy={H - 55} r={5} fill={accent} opacity={0.0} />

          {/* Glowing eyes right */}
          <Circle cx={cx + 85} cy={H - 62} r={5} fill="#A78BFA" opacity={0.0} />
          <Circle cx={cx + 100} cy={H - 62} r={5} fill="#A78BFA" opacity={0.0} />

          {/* Accent ground line */}
          <Line x1={0} y1={H - 8} x2={SW} y2={H - 8} stroke={accent} strokeWidth={1} opacity={0.18} />
        </Svg>

        {/* Animated eyes overlaid */}
        <Animated.View style={[StyleSheet.absoluteFill, eye1Style, { pointerEvents: 'none' }]}>
          <Svg width={SW} height={H} style={StyleSheet.absoluteFill}>
            <Circle cx={cx - 95} cy={H - 55} r={5.5} fill={accent} />
            <Circle cx={cx - 80} cy={H - 55} r={5.5} fill={accent} />
            <Circle cx={cx - 93} cy={H - 53} r={2} fill="black" />
            <Circle cx={cx - 78} cy={H - 53} r={2} fill="black" />
          </Svg>
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, eye2Style, { pointerEvents: 'none' }]}>
          <Svg width={SW} height={H} style={StyleSheet.absoluteFill}>
            <Circle cx={cx + 85} cy={H - 62} r={5} fill="#A78BFA" />
            <Circle cx={cx + 100} cy={H - 62} r={5} fill="#A78BFA" />
            <Circle cx={cx + 87} cy={H - 60} r={2} fill="black" />
            <Circle cx={cx + 102} cy={H - 60} r={2} fill="black" />
          </Svg>
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, mistStyle, { pointerEvents: 'none' }]}>
          <Svg width={SW} height={H} style={StyleSheet.absoluteFill}>
            <Ellipse cx={cx} cy={H} rx={SW * 0.9} ry={55} fill={accent} opacity={0.12} />
          </Svg>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

// ─── SCREEN ──────────────────────────────────────────────────────────────────

type TabId = 'quiz' | 'profile' | 'totem' | 'connect' | 'journal';

export const SpiritAnimalScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeName, userData, addFavoriteItem, isFavoriteItem, removeFavoriteItem } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.09)';

  const [activeTab, setActiveTab] = useState<TabId>('quiz');
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<number[][]>(Array(QUIZ_QUESTIONS.length).fill([]));
  const [quizDone, setQuizDone] = useState(false);
  const [primaryAnimal, setPrimaryAnimal] = useState<typeof SPIRIT_ANIMALS[0] | null>(null);
  const [expandedAnimal, setExpandedAnimal] = useState<string | null>(null);
  const [journalText, setJournalText] = useState('');
  const [journalEntries, setJournalEntries] = useState<{ date: string; text: string; tag: string }[]>([]);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalTag, setJournalTag] = useState('spostrzeżenie');
  const [showMeditationModal, setShowMeditationModal] = useState(false);
  const [meditationAnimal, setMeditationAnimal] = useState<typeof SPIRIT_ANIMALS[0] | null>(null);
  const [dailyMessage, setDailyMessage] = useState('');

  useEffect(() => {
    if (primaryAnimal) {
      setDailyMessage(getDailyMessage(primaryAnimal.id));
    }
  }, [primaryAnimal]);

  const handleQuizOption = (optIdx: number) => {
    HapticsService.impact('light');
    const newAnswers = [...answers];
    newAnswers[quizStep] = [optIdx];
    setAnswers(newAnswers);
    if (quizStep < QUIZ_QUESTIONS.length - 1) {
      setTimeout(() => setQuizStep(s => s + 1), 200);
    } else {
      const result = computeSpritAnimal(newAnswers);
      setPrimaryAnimal(result);
      setQuizDone(true);
      HapticsService.notify();
    }
  };

  const resetQuiz = () => {
    setQuizStep(0);
    setAnswers(Array(QUIZ_QUESTIONS.length).fill([]));
    setQuizDone(false);
  };

  const openMeditation = (animal: typeof SPIRIT_ANIMALS[0]) => {
    setMeditationAnimal(animal);
    setShowMeditationModal(true);
  };

  const saveJournalEntry = () => {
    if (!journalText.trim()) return;
    setJournalEntries(prev => [
      { date: formatLocaleDate(new Date()), text: journalText.trim(), tag: journalTag },
      ...prev,
    ]);
    setJournalText('');
    setShowJournalModal(false);
    HapticsService.notify();
  };

  const TABS: { id: TabId; label: string; icon: any }[] = [
    { id: 'quiz', label: 'Odkrycie', icon: Sparkles },
    { id: 'profile', label: 'Bestiariusz', icon: Feather },
    { id: 'totem', label: 'Totemy', icon: Leaf },
    { id: 'connect', label: 'Połączenie', icon: Eye },
    { id: 'journal', label: 'Dziennik', icon: BookOpen },
  ];

  return (
    <View style={[sa.container, { backgroundColor: currentTheme.background }]}>
      {/* Background gradient */}
      <LinearGradient
        colors={isLight ? ['#F0FAF4', '#E8F5EE', '#F5FBF8'] : ['#030D07', '#050F0A', '#040C08']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={sa.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} hitSlop={14}>
            <ChevronLeft color={ACCENT} size={22} strokeWidth={1.8} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2.2, color: ACCENT }}>DUCH ZWIERZĘCIA</Text>
            <Text style={{ fontSize: 12, color: subColor, marginTop: 1 }}>Zwierzę totemu i przewodnik duszy</Text>
          </View>
          <Pressable
            onPress={() => { if (isFavoriteItem('spirit_animal')) { removeFavoriteItem('spirit_animal'); } else { addFavoriteItem({ id: 'spirit_animal', label: 'Duch Zwierzęcia', route: 'SpiritAnimal', params: {}, icon: 'Feather', color: ACCENT, addedAt: new Date().toISOString() }); } }}
            hitSlop={14}
          >
            <Star
              color={isFavoriteItem('spirit_animal') ? ACCENT : ACCENT + '66'}
              size={18}
              strokeWidth={1.8}
              fill={isFavoriteItem('spirit_animal') ? ACCENT : 'none'}
            />
          </Pressable>
        </View>

        {/* TAB BAR */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 6 }} style={{ flexGrow: 0 }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => { setActiveTab(t.id); HapticsService.impact('light'); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, backgroundColor: isActive ? ACCENT + '18' : 'transparent', borderColor: isActive ? ACCENT : cardBorder }}
              >
                <Icon color={isActive ? ACCENT : subColor} size={13} strokeWidth={isActive ? 2.2 : 1.8} />
                <Text style={{ fontSize: 12, fontWeight: isActive ? '700' : '500', color: isActive ? ACCENT : subColor }}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
          keyboardVerticalOffset={insets.top + 56}
        >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') + 24 }}>

          {/* ── QUIZ TAB ─────────────────────────────────────────── */}
          {activeTab === 'quiz' && (
            <>
              <SpiritForestHero accent={ACCENT} />

              {!quizDone ? (
                <Animated.View key={quizStep} entering={FadeInDown.duration(360)}>
                  {/* Progress */}
                  <View style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.6, color: ACCENT }}>PYTANIE {quizStep + 1} / {QUIZ_QUESTIONS.length}</Text>
                      <Text style={{ fontSize: 10, color: subColor }}>{Math.round((quizStep / QUIZ_QUESTIONS.length) * 100)}%</Text>
                    </View>
                    <View style={{ height: 3, backgroundColor: cardBorder, borderRadius: 2 }}>
                      <View style={{ height: 3, width: `${(quizStep / QUIZ_QUESTIONS.length) * 100}%`, backgroundColor: ACCENT, borderRadius: 2 }} />
                    </View>
                  </View>

                  {/* Question card */}
                  <View style={{ padding: 20, borderRadius: 20, borderWidth: 1, borderColor: ACCENT + '30', backgroundColor: cardBg, marginBottom: 16 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: ACCENT, marginBottom: 8 }}>INTUICJA MÓWI</Text>
                    <Text style={{ fontSize: 17, fontWeight: '600', color: textColor, lineHeight: 24 }}>{QUIZ_QUESTIONS[quizStep].question}</Text>
                  </View>

                  {/* Options */}
                  {QUIZ_QUESTIONS[quizStep].options.map((opt, i) => (
                    <Pressable
                      key={i}
                      onPress={() => handleQuizOption(i)}
                      style={({ pressed }) => ([{
                        flexDirection: 'row', alignItems: 'center', gap: 14,
                        padding: 14, borderRadius: 14, borderWidth: 1,
                        borderColor: (answers[quizStep]?.[0] === i) ? ACCENT : cardBorder,
                        backgroundColor: (answers[quizStep]?.[0] === i) ? ACCENT + '12' : cardBg,
                        marginBottom: 8, opacity: pressed ? 0.75 : 1,
                      }])}
                    >
                      <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: (answers[quizStep]?.[0] === i) ? ACCENT + '28' : 'transparent', borderWidth: 1, borderColor: (answers[quizStep]?.[0] === i) ? ACCENT : cardBorder }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: (answers[quizStep]?.[0] === i) ? ACCENT : subColor }}>{String.fromCharCode(65 + i)}</Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, color: textColor, lineHeight: 20 }}>{opt.label}</Text>
                      {answers[quizStep]?.[0] === i && <ChevronRight color={ACCENT} size={15} />}
                    </Pressable>
                  ))}
                </Animated.View>
              ) : (
                primaryAnimal && (
                  <Animated.View entering={FadeInDown.duration(500)}>
                    {/* Result hero */}
                    <LinearGradient
                      colors={[primaryAnimal.color + '22', primaryAnimal.color + '0A', 'transparent']}
                      style={{ borderRadius: 24, padding: 24, borderWidth: 1, borderColor: primaryAnimal.color + '44', marginBottom: 20 }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: primaryAnimal.color, marginBottom: 8 }}>TWOJE ZWIERZĘ DUCHA</Text>
                      <Text style={{ fontSize: 54, textAlign: 'center', marginBottom: 4 }}>{primaryAnimal.emoji}</Text>
                      <Text style={{ fontSize: 28, fontWeight: '800', color: textColor, textAlign: 'center', marginBottom: 4 }}>{primaryAnimal.name}</Text>
                      <Text style={{ fontSize: 13, color: subColor, textAlign: 'center', marginBottom: 16, fontStyle: 'italic' }}>{primaryAnimal.subtitle}</Text>

                      {/* Powers */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                        {primaryAnimal.powers.map(p => (
                          <View key={p} style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: primaryAnimal.color + '1A', borderWidth: 1, borderColor: primaryAnimal.color + '44' }}>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: primaryAnimal.color }}>{p}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Message */}
                      <Text style={{ fontSize: 14, color: textColor, lineHeight: 22, textAlign: 'center', fontStyle: 'italic', marginBottom: 16 }}>"{primaryAnimal.message}"</Text>

                      {/* Element + Totem type */}
                      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: subColor }}>ŻYWIOŁ</Text>
                          <Text style={{ fontSize: 13, color: primaryAnimal.color, fontWeight: '600', marginTop: 2 }}>{primaryAnimal.element}</Text>
                        </View>
                        <View style={{ width: 1, backgroundColor: cardBorder }} />
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: subColor }}>TYP TOTEMU</Text>
                          <Text style={{ fontSize: 13, color: primaryAnimal.color, fontWeight: '600', marginTop: 2 }}>{primaryAnimal.totemType}</Text>
                        </View>
                        <View style={{ width: 1, backgroundColor: cardBorder }} />
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: subColor }}>ZODIAK</Text>
                          <Text style={{ fontSize: 13, color: primaryAnimal.color, fontWeight: '600', marginTop: 2 }}>{primaryAnimal.zodiac}</Text>
                        </View>
                      </View>
                    </LinearGradient>

                    {/* Daily message */}
                    <View style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: ACCENT + '28', backgroundColor: cardBg, marginBottom: 16 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.6, color: ACCENT, marginBottom: 6 }}>PRZESŁANIE NA DZIŚ</Text>
                      <Text style={{ fontSize: 14, color: textColor, lineHeight: 21 }}>{dailyMessage}</Text>
                    </View>

                    {/* Actions */}
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                      <Pressable onPress={resetQuiz} style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: cardBorder, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                        <RefreshCw color={subColor} size={14} strokeWidth={1.8} />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: subColor }}>Powtórz quiz</Text>
                      </Pressable>
                      <Pressable onPress={() => openMeditation(primaryAnimal)} style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: ACCENT + '44', backgroundColor: ACCENT + '12', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                        <Play color={ACCENT} size={14} strokeWidth={2} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>Medytacja</Text>
                      </Pressable>
                    </View>

                    {/* When it appears */}
                    <View style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: cardBorder, backgroundColor: cardBg, marginBottom: 12 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.6, color: subColor, marginBottom: 6 }}>KIEDY SIĘ POJAWIA</Text>
                      <Text style={{ fontSize: 13, color: textColor, lineHeight: 20 }}>{primaryAnimal.whenAppears}</Text>
                    </View>

                    {/* How to connect */}
                    <View style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: ACCENT + '20', backgroundColor: ACCENT + '06', marginBottom: 12 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.6, color: ACCENT, marginBottom: 6 }}>JAK SIĘ POŁĄCZYĆ</Text>
                      <Text style={{ fontSize: 13, color: textColor, lineHeight: 20 }}>{primaryAnimal.howToConnect}</Text>
                    </View>

                    {/* Shamanic context */}
                    <View style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: cardBorder, backgroundColor: cardBg, marginBottom: 12 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.6, color: subColor, marginBottom: 6 }}>PERSPEKTYWA SZAMAŃSKA</Text>
                      <Text style={{ fontSize: 13, color: textColor, lineHeight: 20 }}>{primaryAnimal.shamanic}</Text>
                    </View>

                    <Pressable
                      onPress={() => setActiveTab('profile')}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: ACCENT + '44', backgroundColor: ACCENT + '10' }}
                    >
                      <Feather color={ACCENT} size={14} strokeWidth={1.8} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>Przeglądaj bestiariusz wszystkich zwierząt</Text>
                    </Pressable>
                  </Animated.View>
                )
              )}

              {/* Intro (when quiz not started) */}
              {!quizDone && quizStep === 0 && (
                <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                  <View style={{ padding: 18, borderRadius: 16, borderWidth: 1, borderColor: ACCENT + '22', backgroundColor: cardBg, marginTop: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.6, color: ACCENT, marginBottom: 6 }}>JAK TO DZIAŁA</Text>
                    <Text style={{ fontSize: 13, color: subColor, lineHeight: 20 }}>Odpowiedz na 8 intuicyjnych pytań. Na ich podstawie odkryjemy Twoje pierwotne zwierzę ducha — przewodnika szamańskiego, który towarzyszy Ci przez całe życie.</Text>
                  </View>
                </Animated.View>
              )}
            </>
          )}

          {/* ── PROFILE TAB — Bestiariusz ─────────────────────── */}
          {activeTab === 'profile' && (
            <>
              <Animated.View entering={FadeInDown.duration(360)}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: ACCENT, marginBottom: 4, marginTop: 8 }}>BESTIARIUSZ DUCHOWY</Text>
                <Text style={{ fontSize: 13, color: subColor, lineHeight: 19, marginBottom: 20 }}>30+ zwierząt ducha — ich moce, przesłania i szamański kontekst. Dotknij, by rozwinąć pełen profil.</Text>
              </Animated.View>

              {primaryAnimal && (
                <Animated.View entering={FadeInDown.delay(60).duration(360)}>
                  <View style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: ACCENT + '44', backgroundColor: ACCENT + '0C', marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 28 }}>{primaryAnimal.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: ACCENT, marginBottom: 2 }}>TWOJE ZWIERZĘ DUCHA</Text>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>{primaryAnimal.name}</Text>
                    </View>
                    <Leaf color={ACCENT} size={16} strokeWidth={1.8} />
                  </View>
                </Animated.View>
              )}

              {SPIRIT_ANIMALS.map((animal, idx) => {
                const isExpanded = expandedAnimal === animal.id;
                const isPrimary = primaryAnimal?.id === animal.id;
                return (
                  <Animated.View key={animal.id} entering={FadeInDown.delay(idx * 30).duration(340)}>
                    <Pressable
                      onPress={() => { setExpandedAnimal(isExpanded ? null : animal.id); HapticsService.impact('light'); }}
                      style={{ borderRadius: 16, borderWidth: 1, borderColor: isPrimary ? animal.color + '55' : (isExpanded ? animal.color + '33' : cardBorder), backgroundColor: isPrimary ? animal.color + '0E' : (isExpanded ? animal.color + '07' : cardBg), marginBottom: 10, overflow: 'hidden' }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: animal.color + '18', borderWidth: 1, borderColor: animal.color + '33' }}>
                          <Text style={{ fontSize: 22 }}>{animal.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>{animal.name}</Text>
                            {isPrimary && <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: animal.color + '22' }}><Text style={{ fontSize: 9, fontWeight: '700', color: animal.color, letterSpacing: 0.8 }}>TWÓJ</Text></View>}
                          </View>
                          <Text style={{ fontSize: 12, color: subColor, marginTop: 2 }}>{animal.subtitle}</Text>
                        </View>
                        <ChevronRight color={isExpanded ? animal.color : subColor} size={16} strokeWidth={1.8} style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} />
                      </View>

                      {isExpanded && (
                        <View style={{ paddingHorizontal: 14, paddingBottom: 16 }}>
                          {/* Powers chips */}
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                            {animal.powers.map(p => (
                              <View key={p} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: animal.color + '1A', borderWidth: 1, borderColor: animal.color + '44' }}>
                                <Text style={{ fontSize: 11, fontWeight: '600', color: animal.color }}>{p}</Text>
                              </View>
                            ))}
                          </View>

                          {/* Message */}
                          <Text style={{ fontSize: 13, color: textColor, lineHeight: 20, fontStyle: 'italic', marginBottom: 12 }}>"{animal.message}"</Text>

                          {/* Details */}
                          <View style={{ gap: 8 }}>
                            <View>
                              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: subColor, marginBottom: 3 }}>KIEDY SIĘ POJAWIA</Text>
                              <Text style={{ fontSize: 12, color: textColor, lineHeight: 18 }}>{animal.whenAppears}</Text>
                            </View>
                            <View>
                              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: subColor, marginBottom: 3 }}>JAK SIĘ POŁĄCZYĆ</Text>
                              <Text style={{ fontSize: 12, color: textColor, lineHeight: 18 }}>{animal.howToConnect}</Text>
                            </View>
                            <View>
                              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: subColor, marginBottom: 3 }}>SZAMANIZM</Text>
                              <Text style={{ fontSize: 12, color: textColor, lineHeight: 18 }}>{animal.shamanic}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                              <View style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: animal.color + '12', alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: subColor }}>ŻYWIOŁ</Text>
                                <Text style={{ fontSize: 12, color: animal.color, fontWeight: '600', marginTop: 2 }}>{animal.element}</Text>
                              </View>
                              <View style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: animal.color + '12', alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: subColor }}>ZODIAK</Text>
                                <Text style={{ fontSize: 12, color: animal.color, fontWeight: '600', marginTop: 2, textAlign: 'center' }}>{animal.zodiac}</Text>
                              </View>
                            </View>
                          </View>

                          {/* Meditation button */}
                          <Pressable
                            onPress={() => openMeditation(animal)}
                            style={{ marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: animal.color + '44', backgroundColor: animal.color + '10', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                          >
                            <Play color={animal.color} size={13} strokeWidth={2} />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: animal.color }}>Wizualizacja medytacyjna</Text>
                          </Pressable>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </>
          )}

          {/* ── TOTEM TAB ────────────────────────────────────────── */}
          {activeTab === 'totem' && (
            <>
              <Animated.View entering={FadeInDown.duration(360)}>
                <View style={{ marginBottom: 20, marginTop: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: ACCENT, marginBottom: 6 }}>TYPY ZWIERZĄT TOTEMU</Text>
                  <Text style={{ fontSize: 13, color: subColor, lineHeight: 20 }}>W szamanizmie każda osoba ma kilka zwierząt duchowych, pełniących różne role na ścieżce duszy.</Text>
                </View>
              </Animated.View>

              {TOTEM_TYPES.map((tt, i) => (
                <Animated.View key={tt.id} entering={FadeInDown.delay(i * 80).duration(380)}>
                  <LinearGradient
                    colors={[ACCENT + '14', ACCENT + '06', 'transparent']}
                    style={{ borderRadius: 20, padding: 20, borderWidth: 1, borderColor: ACCENT + '28', marginBottom: 14 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <Text style={{ fontSize: 28 }}>{tt.emoji}</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>{tt.label}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: textColor, lineHeight: 21, marginBottom: 10 }}>{tt.desc}</Text>
                    <View style={{ padding: 12, borderRadius: 12, backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: cardBorder }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: ACCENT, marginBottom: 4 }}>PRZYKŁAD</Text>
                      <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, fontStyle: 'italic' }}>{tt.example}</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              ))}

              {/* Traditions section */}
              <Animated.View entering={FadeInDown.delay(360).duration(380)}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: ACCENT, marginTop: 12, marginBottom: 14 }}>TRADYCJE SZAMAŃSKIE</Text>
              </Animated.View>

              {[
                { culture: 'Rdzenne kultury Ameryki Północnej', desc: 'Każdy klan ma swoje zwierzę totemowe — fizyczne i duchowe — które definiuje tożsamość, prawa i obowiązki. Zwierzę ducha jest prywatne i objawia się przez wizję.', icon: '🌎' },
                { culture: 'Szamanizm syberyjski i tunguski', desc: 'Szaman podróżuje do dolnego lub górnego świata, by spotkać zwierzęce duchy przewodniki (chukchi: "tundravit"). Zwierzę chroni szamana w transie i udziela mocy.', icon: '🌿' },
                { culture: 'Tradycja słowiańska i nordycka', desc: 'Wilkołaki i niedźwiedzie to wojownicy zdolni wchodzić w naturę zwierzęcia. Szamani (volvy) podróżowali jako ptaki lub wilki podczas ekstatycznego transu seiðr.', icon: '⚡' },
                { culture: 'Tradycja celtycka', desc: 'Totemiczne zwierzęta klanu i osobiste duchy zwierząt pojawiają się na tarczach, chorągwiach i w imieniu. Druidzi obserwowali loty ptaków jako przepowiednie.', icon: '🌳' },
                { culture: 'Buddyzm tybetański i bon', desc: 'Dharmapalowie i bóstwa mają zwierzęce formy. Człowiek może mieć wrodzone powiązanie z konkretnym boskim zwierzęciem jako "la" — część duszy zewnętrznej.', icon: '🌸' },
                { culture: 'Tradycja afrykańska i buszmeńska', desc: 'Eland i lew to zwierzęta szamańskie w kulturach !Kung i San. Tańce lecznicze naśladują zwierzęta, by zainwokować ich uzdrawiającą moc.', icon: '🌍' },
              ].map((t, i) => (
                <Animated.View key={t.culture} entering={FadeInDown.delay(380 + i * 50).duration(360)}>
                  <View style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: cardBorder, backgroundColor: cardBg, marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <Text style={{ fontSize: 20 }}>{t.icon}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, flex: 1, lineHeight: 18 }}>{t.culture}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: subColor, lineHeight: 18 }}>{t.desc}</Text>
                  </View>
                </Animated.View>
              ))}
            </>
          )}

          {/* ── CONNECT TAB ──────────────────────────────────────── */}
          {activeTab === 'connect' && (
            <>
              <Animated.View entering={FadeInDown.duration(360)}>
                <View style={{ marginTop: 8, marginBottom: 20 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: ACCENT, marginBottom: 6 }}>PRZESŁANIE NA DZIŚ</Text>
                  {primaryAnimal ? (
                    <LinearGradient
                      colors={[primaryAnimal.color + '1E', primaryAnimal.color + '08', 'transparent']}
                      style={{ borderRadius: 18, padding: 18, borderWidth: 1, borderColor: primaryAnimal.color + '44' }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Text style={{ fontSize: 28 }}>{primaryAnimal.emoji}</Text>
                        <View>
                          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: primaryAnimal.color }}>{primaryAnimal.name.toUpperCase()}</Text>
                          <Text style={{ fontSize: 12, color: subColor }}>Twoje zwierzę ducha mówi:</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 15, color: textColor, lineHeight: 23, fontStyle: 'italic' }}>"{dailyMessage}"</Text>
                    </LinearGradient>
                  ) : (
                    <Pressable onPress={() => setActiveTab('quiz')} style={{ padding: 18, borderRadius: 16, borderWidth: 1, borderColor: ACCENT + '30', backgroundColor: cardBg }}>
                      <Text style={{ fontSize: 13, color: subColor, textAlign: 'center' }}>Odkryj swoje zwierzę ducha w quizie, aby zobaczyć codzienne przesłania.</Text>
                      <Text style={{ fontSize: 13, color: ACCENT, textAlign: 'center', marginTop: 8, fontWeight: '600' }}>Przejdź do quizu →</Text>
                    </Pressable>
                  )}
                </View>
              </Animated.View>

              {/* 30-day oracle: daily message bank */}
              <Animated.View entering={FadeInDown.delay(80).duration(360)}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: ACCENT, marginBottom: 14 }}>WYROCZNIA 30 DNI</Text>
              </Animated.View>

              {primaryAnimal && Array.from({ length: 7 }, (_, i) => {
                const msgs = DAILY_MESSAGES[primaryAnimal.id] || [];
                const all = [...msgs, ...Array(30).fill('').map((_, d) => `Dzień ${d + 1}: Twoje zwierzę ducha czuwa nad Twoją ścieżką. Dziś idź za intuicją — ona jest Twoim przewodnikiem.`)];
                const msg = all[i % all.length];
                const dayLabel = i === 0 ? 'Dziś' : `Za ${i} ${i === 1 ? 'dzień' : 'dni'}`;
                return (
                  <Animated.View key={i} entering={FadeInDown.delay(100 + i * 50).duration(340)}>
                    <View style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: i === 0 ? ACCENT + '44' : cardBorder, backgroundColor: i === 0 ? ACCENT + '08' : cardBg, marginBottom: 8, alignItems: 'flex-start' }}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: i === 0 ? ACCENT + '22' : cardBorder, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: i === 0 ? ACCENT : subColor }}>{dayLabel.split(' ')[0]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: i === 0 ? ACCENT : subColor, marginBottom: 4 }}>{dayLabel.toUpperCase()}</Text>
                        <Text style={{ fontSize: 13, color: textColor, lineHeight: 19 }}>{msg}</Text>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}

              {/* Meditation visualizations */}
              <Animated.View entering={FadeInDown.delay(500).duration(360)}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: ACCENT, marginTop: 20, marginBottom: 14 }}>WIZUALIZACJE MEDYTACYJNE</Text>
                <Text style={{ fontSize: 13, color: subColor, lineHeight: 20, marginBottom: 16 }}>Każde zwierzę ducha prowadzi Cię przez unikalną wizualizację medytacyjną. Zamknij oczy i pozwól, że poprowadzi Cię do swojego świata.</Text>
              </Animated.View>

              {SPIRIT_ANIMALS.slice(0, 8).map((animal, i) => (
                <Animated.View key={animal.id} entering={FadeInDown.delay(520 + i * 40).duration(340)}>
                  <Pressable
                    onPress={() => openMeditation(animal)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: cardBorder, backgroundColor: cardBg, marginBottom: 8 }}
                  >
                    <Text style={{ fontSize: 24 }}>{animal.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{animal.name}</Text>
                      <Text style={{ fontSize: 12, color: subColor, marginTop: 1 }}>{animal.meditation.slice(0, 55)}...</Text>
                    </View>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: animal.color + '18', borderWidth: 1, borderColor: animal.color + '33', alignItems: 'center', justifyContent: 'center' }}>
                      <Play color={animal.color} size={12} strokeWidth={2} />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </>
          )}

          {/* ── JOURNAL TAB ──────────────────────────────────────── */}
          {activeTab === 'journal' && (
            <>
              <Animated.View entering={FadeInDown.duration(360)}>
                <View style={{ marginTop: 8, marginBottom: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: ACCENT, marginBottom: 6 }}>DZIENNIK DUCHA ZWIERZĘCIA</Text>
                  <Text style={{ fontSize: 13, color: subColor, lineHeight: 20, marginBottom: 16 }}>Zapisuj sny, spostrzeżenia i spotkania z Twoim zwierzęciem totemu. Wzorce ujawniają się z czasem.</Text>

                  <Pressable
                    onPress={() => setShowJournalModal(true)}
                    style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: ACCENT + '44', backgroundColor: ACCENT + '10', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}
                  >
                    <BookOpen color={ACCENT} size={16} strokeWidth={1.8} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: ACCENT }}>Dodaj nowy wpis</Text>
                  </Pressable>
                </View>
              </Animated.View>

              {/* Tags / categories */}
              <Animated.View entering={FadeInDown.delay(80).duration(360)}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }} style={{ marginBottom: 8 }}>
                  {['spostrzeżenie', 'sen', 'spotkanie', 'synchroniczność', 'przesłanie', 'medytacja'].map(tag => (
                    <Pressable
                      key={tag}
                      onPress={() => setJournalTag(tag)}
                      style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: journalTag === tag ? ACCENT : cardBorder, backgroundColor: journalTag === tag ? ACCENT + '18' : cardBg }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: journalTag === tag ? ACCENT : subColor }}>{tag}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </Animated.View>

              {journalEntries.length === 0 ? (
                <Animated.View entering={FadeInDown.delay(120).duration(400)}>
                  <View style={{ alignItems: 'center', padding: 40, gap: 12 }}>
                    <Text style={{ fontSize: 36 }}>🌿</Text>
                    <Text style={{ fontSize: 14, color: subColor, textAlign: 'center', lineHeight: 21 }}>Twój dziennik jest pusty. Zacznij od prostego spostrzeżenia — czy coś dziś przypomniało Ci o Twoim zwierzęciu ducha?</Text>
                  </View>
                </Animated.View>
              ) : (
                journalEntries.map((entry, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(i * 50).duration(340)}>
                    <View style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: cardBorder, backgroundColor: cardBg, marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: ACCENT + '18', borderWidth: 1, borderColor: ACCENT + '33' }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: ACCENT, letterSpacing: 0.8 }}>{entry.tag.toUpperCase()}</Text>
                        </View>
                        <Text style={{ fontSize: 11, color: subColor }}>{entry.date}</Text>
                      </View>
                      <Text style={{ fontSize: 14, color: textColor, lineHeight: 21 }}>{entry.text}</Text>
                    </View>
                  </Animated.View>
                ))
              )}

              {/* Journaling prompts */}
              <Animated.View entering={FadeInDown.delay(200).duration(360)}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: ACCENT, marginTop: 20, marginBottom: 12 }}>PYTANIA DO REFLEKSJI</Text>
              </Animated.View>

              {[
                'Kiedy ostatnio czułeś obecność swojego zwierzęcia w snach lub rzeczywistości?',
                'Jaką konkretną cechę Twojego zwierzęcia chcesz wcielić w życie w tym tygodniu?',
                'Czy jest zwierzę, które Cię przeraża lub fascynuje? Co chce Ci powiedzieć?',
                'Czy pojawiło się nieoczekiwane zwierzę (w realu lub snach)? Co niesie za przesłanie?',
                'Jak zmieniło się Twoje zwierzę ducha przez ostatni rok? Co to mówi o Twojej ścieżce?',
                'W jakich sytuacjach życiowych czujesz się jak Twoje zwierzę? Co to zdradzą o Twojej naturze?',
              ].map((prompt, i) => (
                <Animated.View key={i} entering={FadeInDown.delay(220 + i * 40).duration(340)}>
                  <Pressable
                    onPress={() => { setJournalText(prompt + '\n\n'); setShowJournalModal(true); }}
                    style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: cardBorder, backgroundColor: cardBg, marginBottom: 8 }}
                  >
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: ACCENT }}>{i + 1}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 13, color: textColor, lineHeight: 19 }}>{prompt}</Text>
                    <ChevronRight color={ACCENT} size={14} opacity={0.5} />
                  </Pressable>
                </Animated.View>
              ))}
            </>
          )}

          <EndOfContentSpacer size="standard" />
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── MEDITATION MODAL ──────────────────────────────────── */}
      <Modal visible={showMeditationModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowMeditationModal(false)}>
        <View style={{ flex: 1, backgroundColor: isLight ? '#F0FAF4' : '#030D07' }}>
          <LinearGradient colors={isLight ? ['#E8F5EE', '#F0FAF4'] : ['#050F0A', '#030D07']} style={StyleSheet.absoluteFill} />
          <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: meditationAnimal?.color || ACCENT }}>WIZUALIZACJA MEDYTACYJNA</Text>
              <Pressable onPress={() => setShowMeditationModal(false)} hitSlop={12}>
                <X color={subColor} size={20} strokeWidth={1.8} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 8 }}>
              {meditationAnimal && (
                <>
                  <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <Text style={{ fontSize: 52, marginBottom: 8 }}>{meditationAnimal.emoji}</Text>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: textColor, marginBottom: 4 }}>{meditationAnimal.name}</Text>
                    <Text style={{ fontSize: 13, color: subColor, fontStyle: 'italic' }}>{meditationAnimal.subtitle}</Text>
                  </View>

                  <View style={{ padding: 20, borderRadius: 20, borderWidth: 1, borderColor: (meditationAnimal.color) + '40', backgroundColor: (meditationAnimal.color) + '0C', marginBottom: 20 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.6, color: meditationAnimal.color, marginBottom: 12 }}>WIZUALIZACJA</Text>
                    <Text style={{ fontSize: 16, color: textColor, lineHeight: 28, fontStyle: 'italic' }}>{meditationAnimal.meditation}</Text>
                  </View>

                  <View style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: cardBorder, backgroundColor: cardBg, marginBottom: 16 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: subColor, marginBottom: 8 }}>JAK PRAKTYKOWAĆ</Text>
                    {['Znajdź spokojne miejsce i usiądź lub połóż się wygodnie.', 'Zamknij oczy i weź trzy głębokie oddechy.', 'Czytaj wizualizację powoli lub poproś kogoś, by ją czytał.', 'Po wizualizacji zostań z uczuciem przez kilka minut.', 'Zapisz w dzienniku, co poczułeś lub zobaczyłeś.'].map((step, i) => (
                      <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: ACCENT }}>{i + 1}</Text>
                        </View>
                        <Text style={{ flex: 1, fontSize: 13, color: textColor, lineHeight: 19 }}>{step}</Text>
                      </View>
                    ))}
                  </View>

                  <Pressable
                    onPress={() => setShowMeditationModal(false)}
                    style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: ACCENT + '44', backgroundColor: ACCENT + '14', alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '700', color: ACCENT }}>Zamknij i praktykuj</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── JOURNAL MODAL ──────────────────────────────────────── */}
      <Modal visible={showJournalModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowJournalModal(false)}>
        <View style={{ flex: 1, backgroundColor: isLight ? '#F0FAF4' : '#030D07' }}>
          <LinearGradient colors={isLight ? ['#E8F5EE', '#F0FAF4'] : ['#050F0A', '#030D07']} style={StyleSheet.absoluteFill} />
          <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: ACCENT }}>NOWY WPIS</Text>
              <Pressable onPress={() => setShowJournalModal(false)} hitSlop={12}>
                <X color={subColor} size={20} strokeWidth={1.8} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 8 }} keyboardShouldPersistTaps="handled">
              {/* Tag selector */}
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: subColor, marginBottom: 10 }}>TYP WPISU</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
                {['spostrzeżenie', 'sen', 'spotkanie', 'synchroniczność', 'przesłanie', 'medytacja'].map(tag => (
                  <Pressable
                    key={tag}
                    onPress={() => setJournalTag(tag)}
                    style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: journalTag === tag ? ACCENT : cardBorder, backgroundColor: journalTag === tag ? ACCENT + '18' : cardBg }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: journalTag === tag ? ACCENT : subColor }}>{tag}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: subColor, marginBottom: 8 }}>TWÓJ WPIS</Text>
              <TextInput
                value={journalText}
                onChangeText={setJournalText}
                placeholder="Co chcesz zanotować? Sen, spostrzeżenie, wiadomość od przewodnika..."
                placeholderTextColor={subColor}
                multiline
                style={{ minHeight: 160, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: ACCENT + '30', backgroundColor: cardBg, color: textColor, fontSize: 14, lineHeight: 22, textAlignVertical: 'top', marginBottom: 20 }}
              />

              <Pressable
                onPress={saveJournalEntry}
                style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: ACCENT + '44', backgroundColor: ACCENT + '18', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: ACCENT }}>Zapisz wpis</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const sa = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
