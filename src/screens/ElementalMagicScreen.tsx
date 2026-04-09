// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import Svg, {
  Circle, Ellipse, G, Line, Path, Polygon, Rect, Text as SvgText,
  Defs, RadialGradient, Stop, ClipPath,
} from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Flame, Wind, Droplets, Mountain, Sparkles,
  ChevronDown, ChevronUp, ArrowRight, BookOpen, CheckCircle2, Circle as CircleIcon,
  Wand2, Zap, MessageCircle, BarChart3, RefreshCw,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#F97316';

// ── BACKGROUND ─────────────────────────────────────────────────
const ElementalBg = ({ isDark }: { isDark: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isDark ? ['#0F0800', '#180C00', '#200E00'] : ['#FFF7ED', '#FFFBF5', '#FFF3E0']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={700} style={StyleSheet.absoluteFill} opacity={isDark ? 0.13 : 0.07}>
      <G>
        {[80, 180, 280, 380, 480, 580].map((y, i) => (
          <Circle key={i} cx={SW / 2} cy={y} r={50 + i * 12}
            stroke={ACCENT} strokeWidth={0.5} fill="none" opacity={0.22 - i * 0.02}
            strokeDasharray={i % 2 === 0 ? '5 8' : '2 6'} />
        ))}
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const cx = SW / 2 + 110 * Math.cos(a);
          const cy = 340 + 110 * Math.sin(a);
          return <Circle key={'e' + i} cx={cx} cy={cy} r={3} fill={ACCENT} opacity={0.20} />;
        })}
        {Array.from({ length: 18 }, (_, i) => (
          <Circle key={'s' + i}
            cx={(i * 127 + 15) % SW} cy={(i * 97 + 30) % 680}
            r={(i % 5 === 0) ? 1.4 : 0.7} fill={ACCENT} opacity={0.09} />
        ))}
      </G>
    </Svg>
  </View>
);

// ── ELEMENT DATA ───────────────────────────────────────────────
type ElementId = 'fire' | 'water' | 'earth' | 'air' | 'spirit';

interface ElementData {
  id: ElementId;
  name: string;
  polishName: string;
  symbol: string;
  color: string;
  direction: string;
  season: string;
  timeOfDay: string;
  zodiacSigns: string[];
  chakras: string[];
  keywords: string[];
  strengths: string[];
  shadow: string[];
  magicalUses: string[];
  description: string;
  ritualInvocation: string;
}

const ELEMENTS: ElementData[] = [
  {
    id: 'fire',
    name: 'Fire',
    polishName: 'Ogień',
    symbol: '△',
    color: '#EF4444',
    direction: 'Południe',
    season: 'Lato',
    timeOfDay: 'Południe',
    zodiacSigns: ['Baran', 'Lew', 'Strzelec'],
    chakras: ['Manipura (Splot Słoneczny)', 'Muladhara (Korzeniowy)'],
    keywords: ['transformacja', 'pasja', 'wola', 'twórczość', 'odwaga', 'energia', 'puryfikacja'],
    strengths: ['Silna wola i determinacja', 'Zdolność do szybkiego działania', 'Naturalny przywódca', 'Inspirowanie innych', 'Twórcza iskra i innowacja'],
    shadow: ['Niecierpliwość i impulsywność', 'Skłonność do wypalenia', 'Dominacja i ego', 'Trudność w słuchaniu innych', 'Tendencja do niszczenia tego, co stworzono'],
    magicalUses: ['Rytuały manifestacji', 'Wzmacnianie woli i odwagi', 'Ochrona i oczyszczenie przez ogień', 'Praca z pożądaniem i namiętnością', 'Przyspieszanie zmian'],
    description: 'Ogień to element transformacji, pasji i twórczej siły. Pali stare, aby zrobić miejsce na nowe. To energia słoneczna, aktywna, męska — siła która wprowadza zmianę, gdy trzeba działać, nie czekać.',
    ritualInvocation: 'Duchu Ognia, Guardiano Południa, przybądź do mnie ze swoją ognistą mocą. Wypełnij moje serce odwagą, moją wolę — determinacją, mój umysł — klarownością ognistego słońca. Niech twój płomień oczyści to, co stare, i rozświetli ścieżkę tego, co nowe. Zapraszam cię do tego rytuału, mocy Ognia.',
  },
  {
    id: 'water',
    name: 'Water',
    polishName: 'Woda',
    symbol: '▽',
    color: '#3B82F6',
    direction: 'Zachód',
    season: 'Jesień',
    timeOfDay: 'Zmierzch',
    zodiacSigns: ['Rak', 'Skorpion', 'Ryby'],
    chakras: ['Svadhisthana (Sakralny)', 'Anahata (Sercowy)'],
    keywords: ['intuicja', 'emocje', 'głębia', 'uzdrowienie', 'płynność', 'miłość', 'sny'],
    strengths: ['Głęboka empatia i wrażliwość', 'Silna intuicja', 'Zdolność do głębokiej miłości', 'Adaptacyjność i elastyczność', 'Połączenie z nieświadomością'],
    shadow: ['Nadmierna emocjonalność', 'Zatapianie się w cudzych problemach', 'Trudność z granicami', 'Unikanie konfrontacji', 'Skłonność do melancholii i odizolowania'],
    magicalUses: ['Praca z emocjami i uzdrowienie', 'Rytuały miłosne i relacyjne', 'Wzmacnianie intuicji i sów', 'Oczyszczenie przez wodę', 'Praca z nieświadomością i cieniem'],
    description: 'Woda to element emocji, intuicji i głębi podświadomości. Płynie po linii najmniejszego oporu, ale może stać się oceanem i pochłonąć wszystko. To energia księżyca, recepcji i uzdrowienia — przepływaj zamiast walczyć.',
    ritualInvocation: 'Duchu Wody, Guardiano Zachodu, przybądź do mnie ze swoją głęboką mądrością. Obmyj mnie ze swoją miłością, przepłyń przez moje emocje jak czysta rzeka. Naucz mnie płynąć z nurtem życia, słuchać głosu intuicji i kochać siebie w całej głębi. Zapraszam cię do tego rytuału, mocy Wody.',
  },
  {
    id: 'earth',
    name: 'Earth',
    polishName: 'Ziemia',
    symbol: '▽×',
    color: '#10B981',
    direction: 'Północ',
    season: 'Zima',
    timeOfDay: 'Północ',
    zodiacSigns: ['Byk', 'Panna', 'Koziorożec'],
    chakras: ['Muladhara (Korzeniowy)', 'Anahata (Sercowy)'],
    keywords: ['stabilność', 'cierpliwość', 'ciało', 'obfitość', 'natura', 'zakorzenienie', 'wytrwałość'],
    strengths: ['Głęboka stabilność i niezawodność', 'Cierpliwość i wytrwałość', 'Praktyczność i realizm', 'Połączenie z ciałem i naturą', 'Zdolność do budowania trwałych rzeczy'],
    shadow: ['Opór przed zmianą', 'Materializm i przywiązanie', 'Skostnienie i brak elastyczności', 'Lęk przed ryzykiem', 'Trudność z odpuszczaniem'],
    magicalUses: ['Manifestacja i przyciąganie obfitości', 'Rytuały zakorzenienia i ochrony', 'Uzdrowienie ciała fizycznego', 'Praca z lękiem i stabilizacją', 'Magia plonów i pracy'],
    description: 'Ziemia to element stabilności, cierpliwości i materialnej rzeczywistości. Daje zakorzenienie, niezawodność i poczucie ciągłości. To energia matczyną, recepcyjną — fundament, na którym wszystko inne może rosnąć.',
    ritualInvocation: 'Duchu Ziemi, Guardiano Północy, przybądź do mnie ze swoją odwieczną mądrością. Uziemij moje korzenie głęboko w świętą glebę, przywróć mi poczucie bezpieczeństwa i wytrwałości. Niech twoja cierpliwość stanie się moją siłą, twoja obfitość — moją rzeczywistością. Zapraszam cię do tego rytuału, mocy Ziemi.',
  },
  {
    id: 'air',
    name: 'Air',
    polishName: 'Powietrze',
    symbol: '△×',
    color: '#8B5CF6',
    direction: 'Wschód',
    season: 'Wiosna',
    timeOfDay: 'Świt',
    zodiacSigns: ['Bliźnięta', 'Waga', 'Wodnik'],
    chakras: ['Anahata (Sercowy)', 'Vishuddha (Gardłowy)', 'Ajna (Trzecia Oko)'],
    keywords: ['myśl', 'komunikacja', 'wolność', 'wiedza', 'ruch', 'zmiana', 'inspiracja'],
    strengths: ['Szybkie myślenie i adaptacja', 'Zdolność do komunikacji', 'Ciekawość i intelekt', 'Wolność i niezależność', 'Szerokie spojrzenie na sprawy'],
    shadow: ['Niestałość i brak skupienia', 'Oderwanie od emocji i ciała', 'Tendencja do intelektualizowania', 'Trudność z zaangażowaniem się', 'Chłód w relacjach'],
    magicalUses: ['Rytuały wiedzy i nauki', 'Magia komunikacji i słowa', 'Praca z myślami i przekonaniami', 'Wzmacnianie inspiracji i kreatywności', 'Rytuały wiatru i zmian'],
    description: 'Powietrze to element myśli, komunikacji i wolności. Jest wszędzie, niewidzialne, niezbędne. To energia świtu, początku, nowych idei — lekka, ruchoma, inspirująca. Powietrze połącza wszystkich i wszystko.',
    ritualInvocation: 'Duchu Powietrza, Guardiano Wschodu, przybądź do mnie ze swoją świeżą mądrością. Oczyść mój umysł jak wiosenny wiatr oczyściłby stary dom. Przynieś mi inspirację, klarowność myśli i słowa, które uzdrawiają. Niech twoja wolność stanie się moją śmiałością. Zapraszam cię do tego rytuału, mocy Powietrza.',
  },
  {
    id: 'spirit',
    name: 'Spirit',
    polishName: 'Duch',
    symbol: '✦',
    color: '#F59E0B',
    direction: 'Centrum',
    season: 'Wszystkie pory roku',
    timeOfDay: 'Wszelki czas',
    zodiacSigns: ['Wszystkie znaki'],
    chakras: ['Sahasrara (Koronowy)', 'Ajna (Trzecia Oko)'],
    keywords: ['świadomość', 'połączenie', 'transcendencja', 'jedność', 'boskość', 'cel', 'miłość bezwarunkowa'],
    strengths: ['Poczucie wyższego celu', 'Głęboka duchowość', 'Zdolność do widzenia całości', 'Połączenie ze źródłem', 'Mądrość i spokój'],
    shadow: ['Ucieczka od rzeczywistości', 'Bycie zbyt "wysoko" ponad praktyczność', 'Trudność z osadzeniem w ciele', 'Poczucie wyższości duchowej', 'Oderwanie od świata materialnego'],
    magicalUses: ['Rytuały połączenia z wyższym ja', 'Medytacje transcendentalne', 'Praca z przeznaczeniem i ścieżką duszy', 'Rytuały poświęcenia i wdzięczności', 'Praca z duchowymi przewodnikami'],
    description: 'Duch to piąty element — kwintesencja. To nie jest element stworzony z materii, lecz sama świadomość, która przenika wszystko inne. Duch jest tym, co nas łączy z pełnią istnienia, z boskością i z celem naszej duszy.',
    ritualInvocation: 'Duchu Świadomy, Kosmiczna Jedności, czuję cię we wszystkim i we mnie samym. Prowadź mnie ku głębszemu rozumieniu mojego celu, ku miłości, która nie ma granic. Niech moje działania będą wyrazem wyższej mądrości, niech moje serce stanie się otwartym kanałem dla boskości. Jestem tu, słucham. Duch jest tu, teraz.',
  },
];

const ZODIAC_ELEMENT: Record<string, ElementId> = {
  'Baran': 'fire', 'Lew': 'fire', 'Strzelec': 'fire',
  'Rak': 'water', 'Skorpion': 'water', 'Ryby': 'water',
  'Byk': 'earth', 'Panna': 'earth', 'Koziorożec': 'earth',
  'Bliźnięta': 'air', 'Waga': 'air', 'Wodnik': 'air',
};

const DOW_ELEMENT: Record<number, ElementId> = {
  0: 'spirit', 1: 'fire', 2: 'water', 3: 'air', 4: 'earth', 5: 'fire', 6: 'water',
};

const ELEMENT_QUIZ_QUESTIONS = [
  { text: 'Gdy stajesz przed trudną decyzją, zazwyczaj:', elementMap: { a: 'fire', b: 'water', c: 'earth', d: 'air' }, answers: ['Działasz szybko, ufając instynktowi', 'Czujesz przez długi czas, zanim zdecydujesz', 'Analizujesz wszystkie za i przeciw spokojnie', 'Zbierasz informacje i rozmawiasz z wieloma osobami'] },
  { text: 'Twoje ulubione miejsce w naturze to:', elementMap: { a: 'fire', b: 'water', c: 'earth', d: 'air' }, answers: ['Pustynia lub wzgórze oświetlone słońcem', 'Brzeg oceanu lub cicha rzeka', 'Gęsty las lub ogród', 'Szczyt góry lub otwarta łąka w wietrze'] },
  { text: 'W grupie ludzi najczęściej:', elementMap: { a: 'fire', b: 'water', c: 'earth', d: 'air' }, answers: ['Przejmujesz inicjatywę i prowadzisz', 'Słuchasz i wczuwasz się w emocje innych', 'Zapewniasz stabilność i praktyczną pomoc', 'Wnosisz nowe idee i inspirujesz dyskusję'] },
  { text: 'Twój naturalny rytm pracy to:', elementMap: { a: 'fire', b: 'water', c: 'earth', d: 'air' }, answers: ['Intensywne wybuchy energii z długim odpoczynkiem', 'Falujący rytm zależny od nastroju', 'Stały, metodyczny i cierpliwy', 'Chaotyczny, wielozadaniowy, inspirowany'] },
  { text: 'Kiedy czujesz się wypalony, szukasz:', elementMap: { a: 'fire', b: 'water', c: 'earth', d: 'air' }, answers: ['Nowych wyzwań, które cię rozpalą', 'Spokoju przy wodzie lub łzowego oczyszczenia', 'Kontaktu z ziemią, ogrodu, gotowania', 'Długich rozmów, czytania, zmiany miejsca'] },
  { text: 'Twoja moc tkwi przede wszystkim w:', elementMap: { a: 'fire', b: 'water', c: 'earth', d: 'air' }, answers: ['Odwadze i determinacji', 'Empatii i intuicji', 'Wytrwałości i niezawodności', 'Intelekcie i komunikacji'] },
  { text: 'W sytuacji konfliktu zazwyczaj:', elementMap: { a: 'fire', b: 'water', c: 'earth', d: 'air' }, answers: ['Konfrontujesz wprost i zdecydowanie', 'Wycofujesz się i przeżywasz emocjonalnie', 'Szukasz kompromisu, cierpliwie', 'Analizujesz i szukasz logicznego rozwiązania'] },
  { text: 'Twoje marzenia często dotyczą:', elementMap: { a: 'fire', b: 'water', c: 'earth', d: 'air' }, answers: ['Wielkich osiągnięć i uznania', 'Głębokiej miłości i połączeń', 'Bezpieczeństwa i obfitości', 'Wolności i nowych odkryć'] },
  { text: 'Kiedy uczysz się czegoś nowego:', elementMap: { a: 'fire', b: 'water', c: 'earth', d: 'air' }, answers: ['Nurzysz się w tym intensywnie i szybko', 'Czujesz i intuicyjnie rozumiesz, bez teorii', 'Uczysz się krok po kroku, metodycznie', 'Szukasz wielu źródeł i perspektyw naraz'] },
  { text: 'Twoja słabość, którą najchętniej przyznajesz, to:', elementMap: { a: 'fire', b: 'water', c: 'earth', d: 'air' }, answers: ['Niecierpliwość i pochopne działanie', 'Nadwrażliwość i trudność z granicami', 'Opór przed zmianą i przywiązanie', 'Rozproszenie i trudność z decyzjami'] },
];

const ELEMENTAL_PRACTICES: { element: ElementId; name: string; description: string; duration: string; materials: string; steps: string[] }[] = [
  {
    element: 'fire',
    name: 'Medytacja ze świecą',
    description: 'Skupienie wzroku na płomieniu świecy, aby aktywować wewnętrzny ogień i wolę.',
    duration: '10-15 minut',
    materials: 'Świeca (najlepiej czerwona lub pomarańczowa), spokojne miejsce',
    steps: [
      'Zapal świecę i ustaw ją na poziomie oczu.',
      'Siedź spokojnie i wpatruj się w płomień przez 2-3 minuty bez odwracania wzroku.',
      'Zauważaj, jak płomień tańczy i zmienia się. To życie w ruchu.',
      'Wyobraź sobie, że ten płomień pali się w centrum twojej klatki piersiowej.',
      'Zadaj sobie pytanie: "Co chcę stworzyć, czego jeszcze nie ma?"',
      'Siedź z odpowiedzią przez kilka minut, nie analizując, tylko odczuwając.',
    ],
  },
  {
    element: 'fire',
    name: 'Rytuał listy uwalniania',
    description: 'Zapisz to, co chcesz puścić, a następnie spal papier z intencją transformacji.',
    duration: '20-30 minut',
    materials: 'Papier, długopis, ogniotrwałe naczynie, świeczka lub zapalniczka',
    steps: [
      'Usiądź w ciszy i przez 5 minut notuj, co chcesz uwolnić: przekonania, lęki, stare wzorce.',
      'Przeczytaj na głos to, co napisałeś.',
      'Powiedz: "Puczam to do ognia. Niech transformacja się dokona."',
      'Spal papier w bezpiecznym naczyniu.',
      'Obserwuj, jak dym unosi się — to energie odchodzą.',
      'Siedź przez 5 minut w ciszy, czując lekkość po uwolnieniu.',
    ],
  },
  {
    element: 'fire',
    name: 'Taniec ognia',
    description: 'Swobodny taniec do muzyki bębnów jako ekspresja energii ognistej.',
    duration: '15-20 minut',
    materials: 'Muzyka perkusyjna lub bębny, wolna przestrzeń',
    steps: [
      'Włącz muzykę i stań w środku pokoju.',
      'Zacznij od prostego kołysania, nie myśląc o tym, jak wyglądasz.',
      'Pozwól ciału poruszać się tak, jak chce — bez choreografii.',
      'Wyobraź sobie, że jesteś płomieniem — nieregularnym, żywym.',
      'Gdy muzyka zwalnia, przejdź do spokojniejszego ruchu.',
      'Zakończ w bezruchu, z rękami na sercu, czując ciepło w ciele.',
    ],
  },
  {
    element: 'water',
    name: 'Kąpiel rytualna',
    description: 'Oczyszczająca kąpiel z solą i olejkami jako rytuał uzdrowienia emocjonalnego.',
    duration: '30-40 minut',
    materials: 'Wanna, sól morska, kilka kropel olejku (lawenda, jaśmin lub eukaliptus), świeczka',
    steps: [
      'Nalej ciepłą wodę, dodaj sól morską i kilka kropel olejku.',
      'Zapal świecę i wejdź do wody z intencją oczyszczenia.',
      'Zanurz się całkowicie, jeśli możesz, lub połóż dłonie na wodzie.',
      'Powiedz lub pomyśl: "Woda, oczyść mnie ze wszystkiego, co mi nie służy."',
      'Pozwól sobie poczuć emocje, które się pojawiają — woda je przyjmie.',
      'Przed opuszczeniem wanny wyobraź sobie, że wszystko, co niepotrzebne, odpływa.',
    ],
  },
  {
    element: 'water',
    name: 'Dziennik marzeń sennych',
    description: 'Codzienne zapisywanie snów jako rozmowa z nieświadomością i intuicją.',
    duration: 'Kilka minut każdego ranka',
    materials: 'Notatnik przy łóżku, długopis, spokój po przebudzeniu',
    steps: [
      'Tuż po przebudzeniu, zanim wstaniesz, leż nieruchomo przez chwilę.',
      'Przypomnij sobie sen — obrazy, emocje, ludzi, miejsca.',
      'Sięgnij po notatnik i zapisuj wszystko, co pamiętasz, bez oceniania.',
      'Zanotuj swoje emocje z tego snu, nie tylko fabułę.',
      'Zadaj pytanie: "Co ten sen mówi o mojej aktualnej sytuacji?"',
      'Nie szukaj od razu odpowiedzi — wróć do notatki wieczorem.',
    ],
  },
  {
    element: 'water',
    name: 'Mapa emocji',
    description: 'Wizualna mapa bieżących emocji jako narzędzie głębokiej samoobserwacji.',
    duration: '20-25 minut',
    materials: 'Duży arkusz papieru, kredki lub flamastry',
    steps: [
      'Narysuj zarys swojego ciała na papierze.',
      'Wyobraź sobie, gdzie w ciele czujesz różne emocje teraz.',
      'Zaznacz kolory odpowiadające emocjom w odpowiednich miejscach ciała.',
      'Obok każdego zaznaczenia napisz jedną lub dwa słowa opis.',
      'Przyjrzyj się całości i zauważ, jakie emocje dominują.',
      'Wybierz jedną emocję i napisz do niej list.',
    ],
  },
  {
    element: 'earth',
    name: 'Uziemienie w naturze',
    description: 'Bose chodzenie po trawie lub ziemi jako najprostsza forma zakorzenienia.',
    duration: '15-20 minut',
    materials: 'Dostęp do trawy, piasku lub gleby; boso',
    steps: [
      'Znajdź trawnik, ogród lub park. Zdejmij buty i skarpety.',
      'Stań na ziemi i poczuj jej dotyk pod stopami.',
      'Zamknij oczy i przez 3 minuty wyobrażaj sobie korzenie wyrastające z podeszew stóp.',
      'Te korzenie wnikają głęboko w ziemię — do jej centrum.',
      'Oddychaj powoli. Poczuj ciężar ciała — jesteś uziemiony.',
      'Spaceruj boso przez 10 minut, świadomie dotykając ziemi każdym krokiem.',
    ],
  },
  {
    element: 'earth',
    name: 'Rytuał sadzenia intencji',
    description: 'Posadź nasiono z konkretną intencją jako symbol manifestacji.',
    duration: '30-40 minut',
    materials: 'Doniczka, ziemia, nasiono, karteczka z intencją',
    steps: [
      'Napisz swoją intencję na małej karteczce — co chcesz zbudować lub zamanifestować.',
      'Włóż karteczkę do doniczki pod ziemię.',
      'Trzymaj nasiono w dłoniach przez minutę, wkładając w nie swoją intencję.',
      'Posadź nasiono i podlej wodą.',
      'Powiedz: "Tak jak to nasiono wzrośnie, tak moja intencja stanie się rzeczywistością."',
      'Pielęgnuj roślinę codziennie jako rytuał dbania o swoje marzenia.',
    ],
  },
  {
    element: 'earth',
    name: 'Rytuał wdzięczności za ciało',
    description: 'Namaszczanie ciała olejkiem z wdzięcznością za każdą jego część.',
    duration: '20-30 minut',
    materials: 'Olejek do masażu (np. migdałowy), cicha muzyka, ciepłe pomieszczenie',
    steps: [
      'Usiądź lub połóż się w ciepłym, spokojnym miejscu.',
      'Wlej olejek w dłonie i potrzyj je, aby się rozgrzać.',
      'Zacznij od stóp i wolno przesuwaj się w górę ciała.',
      'Do każdej części ciała mów lub myśl słowa wdzięczności: "Dziękuję stopom za niesienie mnie..."',
      'Kontynuuj po całym ciele, bez pośpiechu.',
      'Zakończ z dłońmi na sercu, czując ciepło i wdzięczność za życie w ciele.',
    ],
  },
  {
    element: 'air',
    name: 'Pisanie automatyczne',
    description: 'Nieprzerwane pisanie przez 15 minut jako uwolnienie głosu wewnętrznego.',
    duration: '15-20 minut',
    materials: 'Notatnik, długopis, timer',
    steps: [
      'Usiądź z notatnikiem i ustaw timer na 15 minut.',
      'Zacznij pisać i nie zatrzymuj się, niezależnie od tego, co piszesz.',
      'Nie poprawiaj, nie czytaj, nie myśl — po prostu pisz.',
      'Jeśli nie wiesz, co pisać, napisz "nie wiem co pisać" aż coś przyjdzie.',
      'Gdy timer się skończy, przeczytaj to, co napisałeś.',
      'Podkreśl zdania, które cię zaskakują lub dotykają.',
    ],
  },
  {
    element: 'air',
    name: 'Rytuał wiatru i słów',
    description: 'Wypowiedz intencję na wiatr jako rytuał posyłania pragnień w świat.',
    duration: '10-15 minut',
    materials: 'Dostęp do otwartej przestrzeni na zewnątrz, wietrzny dzień',
    steps: [
      'Znajdź otwarte miejsce na zewnątrz, gdzie wieje wiatr.',
      'Stań twarzą do wiatru z zamkniętymi oczami przez minutę.',
      'Sformułuj w myślach lub słowach jedną czystą intencję lub prośbę.',
      'Wypowiedz ją na głos, kierując słowa do wiatru.',
      'Powiedz: "Wiatr, nieś moje słowa tam, gdzie będą usłyszane."',
      'Stój w ciszy przez 5 minut, słuchając odpowiedzi, która może przyjść.',
    ],
  },
  {
    element: 'air',
    name: 'Limpia energetyczna dymem',
    description: 'Oczyszczanie przestrzeni i ciała aury dymem jako rytuał powietrza i oczyszczenia.',
    duration: '15-20 minut',
    materials: 'Biała szałwia, abalone shell lub ogniotrwałe naczynie, piórko (opcjonalnie)',
    steps: [
      'Otwórz okna i drzwi, aby dym miał gdzie odpływać.',
      'Zapal szałwię i puść dym.',
      'Zacznij od wejścia do pomieszczenia i poruszaj się zgodnie z ruchem wskazówek zegara.',
      'Skieruj dym w każdy kąt pomieszczenia, wypowiadając: "Wszystko, co mi nie służy, odchodzi."',
      'Oczyść swoje ciało aury, poruszając dymem od stóp do głowy.',
      'Zakończ przy wejściu, dziękując energii i prosząc o wejście nowych, świeżych energii.',
    ],
  },
];

const ORACLE_CHIPS: Record<ElementId, string> = {
  fire: 'Jak pracować z ogniem w tym tygodniu?',
  water: 'Jaką wiadomość niesie moja intuicja?',
  earth: 'Co powinienem zakorzenić w swoim życiu?',
  air: 'Jaka zmiana czeka mnie w powietrzu?',
  spirit: 'Jaki jest cel mojej duszy w tym czasie?',
};

// ── PENTAGRAM WIDGET 3D ────────────────────────────────────────
const PentagramWidget3D = React.memo(({ accent }: { accent: string }) => {
  const tiltX    = useSharedValue(-6);
  const tiltY    = useSharedValue(0);
  const pulse    = useSharedValue(0.95);
  const flamePulse = useSharedValue(1.0);
  const rotOuter  = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withSequence(
      withTiming(1.05, { duration: 3000 }),
      withTiming(0.95, { duration: 3000 })
    ), -1, false);
    flamePulse.value = withRepeat(withSequence(
      withTiming(1.2, { duration: 300, easing: Easing.inOut(Easing.ease) }),
      withTiming(0.9, { duration: 250, easing: Easing.inOut(Easing.ease) }),
      withTiming(1.1, { duration: 200 }),
      withTiming(0.85, { duration: 350 }),
    ), -1, false);
    rotOuter.value = withRepeat(withTiming(360, { duration: 30000, easing: Easing.linear }), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-22, Math.min(22, -6 + e.translationY * 0.2));
      tiltY.value = Math.max(-22, Math.min(22, e.translationX * 0.2));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-6, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: pulse.value },
    ],
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotOuter.value}deg` }],
  }));

  // Pentagram points (5 points, starting from top)
  const R = 88;
  const POINTS = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return { x: R * Math.cos(a), y: R * Math.sin(a) };
  });

  // Pentagram lines (connect every other point)
  const PENTA_LINES: [number, number][] = [[0,2],[2,4],[4,1],[1,3],[3,0]];

  const ELEMENT_POINTS = [
    { ...POINTS[0], color: '#EF4444', label: 'Ogień', symbol: '△' },   // top = fire
    { ...POINTS[1], color: '#8B5CF6', label: 'Powietrze', symbol: '~' }, // upper right = air
    { ...POINTS[2], color: '#10B981', label: 'Ziemia', symbol: '▽×' }, // lower right = earth
    { ...POINTS[3], color: '#3B82F6', label: 'Woda', symbol: '▽' },    // lower left = water
    { ...POINTS[4], color: '#F59E0B', label: 'Duch', symbol: '✦' },    // upper left = spirit
  ];

  const ORBIT_DOTS = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return { x: 106 * Math.cos(a), y: 106 * Math.sin(a) };
  });

  return (
    <View style={{ alignItems: 'center', marginVertical: 12 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: 250, height: 250, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>
          <Svg width={250} height={250} viewBox="-125 -125 250 250" style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="pglow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={accent} stopOpacity={0.25} />
                <Stop offset="100%" stopColor={accent} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={0} cy={0} r={118} fill="url(#pglow)" />
            <Circle cx={0} cy={0} r={98} stroke={accent} strokeWidth={0.6} fill="none" opacity={0.18} strokeDasharray="5 9" />
            <Circle cx={0} cy={0} r={R} stroke={accent} strokeWidth={0.4} fill="none" opacity={0.14} />
            {PENTA_LINES.map(([a, b], i) => (
              <Line key={i}
                x1={POINTS[a].x} y1={POINTS[a].y}
                x2={POINTS[b].x} y2={POINTS[b].y}
                stroke={accent} strokeWidth={0.7} opacity={0.30} />
            ))}
            {ELEMENT_POINTS.map((pt, i) => (
              <G key={i} transform={`translate(${pt.x}, ${pt.y})`}>
                <Circle cx={0} cy={0} r={14} fill={pt.color} opacity={0.18} />
                <Circle cx={0} cy={0} r={14} stroke={pt.color} strokeWidth={1} fill="none" opacity={0.55} />
                <SvgText x={0} y={5} textAnchor="middle" fill={pt.color} fontSize={9} fontWeight="700" opacity={0.9}>
                  {pt.symbol}
                </SvgText>
              </G>
            ))}
            <Circle cx={0} cy={0} r={6} fill={accent} opacity={0.35} />
          </Svg>
          <Animated.View style={[{ position: 'absolute', width: 250, height: 250, alignItems: 'center', justifyContent: 'center' }, orbitStyle]}>
            <Svg width={250} height={250} viewBox="-125 -125 250 250" style={StyleSheet.absoluteFill}>
              {ORBIT_DOTS.map((d, i) => (
                <Circle key={i} cx={d.x} cy={d.y} r={i % 4 === 0 ? 1.8 : 0.9}
                  fill={accent} opacity={i % 4 === 0 ? 0.50 : 0.22} />
              ))}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

// ── ZODIAC BIRTH ELEMENT ───────────────────────────────────────
function getBirthElement(birthDate: string): ElementId {
  if (!birthDate) return 'fire';
  const parts = birthDate.split('-');
  if (parts.length < 2) return 'fire';
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2] || '1', 10);
  let sign = '';
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) sign = 'Baran';
  else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) sign = 'Byk';
  else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) sign = 'Bliźnięta';
  else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) sign = 'Rak';
  else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) sign = 'Lew';
  else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) sign = 'Panna';
  else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) sign = 'Waga';
  else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) sign = 'Skorpion';
  else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) sign = 'Strzelec';
  else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) sign = 'Koziorożec';
  else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) sign = 'Wodnik';
  else sign = 'Ryby';
  return ZODIAC_ELEMENT[sign] || 'fire';
}

function getTodayElement(): ElementId {
  const dow = new Date().getDay();
  return DOW_ELEMENT[dow] || 'fire';
}

// ── MAIN SCREEN ────────────────────────────────────────────────
export default function ElementalMagicScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const isDark = !isLight;
  const textColor  = isLight ? '#1A1410' : '#F5F1EA';
  const subColor   = isLight ? '#6A5A48' : '#B0A393';
  const cardBg     = isLight ? 'rgba(240,228,210,0.90)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';
  const accent     = ACCENT;

  const scrollRef = useRef<ScrollView>(null);

  // Dominant element
  const birthElement = useMemo(() => getBirthElement(userData?.birthDate || ''), [userData?.birthDate]);
  const todayElement = useMemo(() => getTodayElement(), []);

  // Active element tab
  const [activeElementTab, setActiveElementTab] = useState<ElementId>('fire');

  // Quiz
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<Record<ElementId, number> | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Practices
  const [expandedPractice, setExpandedPractice] = useState<number | null>(null);

  // Ritual
  const [ritualStep, setRitualStep] = useState(-1);

  // Balance sliders
  const [balance, setBalance] = useState<Record<ElementId, number>>({
    fire: 50, water: 50, earth: 50, air: 50, spirit: 50,
  });

  // Oracle AI
  const [oracleLoading, setOracleLoading] = useState(false);
  const [oracleResponse, setOracleResponse] = useState('');
  const [oracleInput, setOracleInput] = useState('');

  const handleQuizAnswer = useCallback((questionIdx: number, answerKey: string) => {
    HapticsService.notify();
    setQuizAnswers(prev => ({ ...prev, [questionIdx]: answerKey }));
    if (questionIdx < ELEMENT_QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(questionIdx + 1);
    } else {
      // Calculate result
      const scores: Record<ElementId, number> = { fire: 0, water: 0, earth: 0, air: 0, spirit: 0 };
      Object.entries({ ...quizAnswers, [questionIdx]: answerKey }).forEach(([qIdx, aKey]) => {
        const q = ELEMENT_QUIZ_QUESTIONS[parseInt(qIdx)];
        if (q && q.elementMap[aKey]) {
          scores[q.elementMap[aKey] as ElementId] += 1;
        }
      });
      setQuizResult(scores);
    }
  }, [quizAnswers]);

  const resetQuiz = useCallback(() => {
    setQuizAnswers({});
    setQuizResult(null);
    setCurrentQuestion(0);
  }, []);

  const handleOracleAsk = useCallback(async (chipText?: string) => {
    const question = chipText || oracleInput;
    if (!question.trim()) return;
    setOracleLoading(true);
    setOracleResponse('');
    HapticsService.notify();
    try {
      const el = ELEMENTS.find(e => e.id === todayElement);
      const messages = [{
        role: 'user' as const,
        content: `Jestem użytkownikiem aplikacji Aethera pracującym z magią żywiołów. Mój urodzinowy żywioł to ${ELEMENTS.find(e => e.id === birthElement)?.polishName}. Dzisiejszy żywioł dnia to ${el?.polishName}. Pytanie: ${question}`,
      }];
      const resp = await AiService.chatWithOracle(messages);
      setOracleResponse(resp);
    } catch {
      setOracleResponse('Wyrocznia żywiołów milczy w tej chwili. Spróbuj ponownie za moment.');
    } finally {
      setOracleLoading(false);
    }
  }, [oracleInput, birthElement, todayElement]);

  const todayEl = ELEMENTS.find(e => e.id === todayElement)!;
  const birthEl = ELEMENTS.find(e => e.id === birthElement)!;
  const activeEl = ELEMENTS.find(e => e.id === activeElementTab)!;

  const RITUAL_STEPS = useMemo(() => [
    {
      title: 'Przygotowanie ołtarza',
      text: `Ustaw przedmioty związane z żywiołem ${todayEl.polishName} na swoim ołtarzu lub stole. Kierunek: ${todayEl.direction}. Pora rytuału: ${todayEl.timeOfDay}. Użyj koloru ${todayEl.polishName === 'Ogień' ? 'czerwonego lub pomarańczowego' : todayEl.polishName === 'Woda' ? 'niebieskiego lub srebrnego' : todayEl.polishName === 'Ziemia' ? 'zielonego lub brązowego' : todayEl.polishName === 'Powietrze' ? 'białego lub żółtego' : 'złotego lub białego'} do dekoracji.`,
    },
    {
      title: 'Oczyszczenie przestrzeni',
      text: `Oczyszcz przestrzeń odpowiednią metodą dla żywiołu ${todayEl.polishName}: ${
        todayEl.id === 'fire' ? 'zapal kadzidło lub świecę i pozwól dymowi oczyścić przestrzeń' :
        todayEl.id === 'water' ? 'spryskaj wodą z solą morską lub użyj dzwoneczka' :
        todayEl.id === 'earth' ? 'rozłóż kryształy lub sól wokół przestrzeni' :
        todayEl.id === 'air' ? 'otwórz okno i użyj piórka lub kadzideł' :
        'medytuj przez 3 minuty, wyobrażając sobie złote światło wypełniające przestrzeń'
      }. Powiedz: "Ta przestrzeń jest czysta i poświęcona pracy z żywiołem ${todayEl.polishName}."`,
    },
    {
      title: 'Wezwanie żywiołu',
      text: todayEl.ritualInvocation,
    },
    {
      title: 'Praca rytualna',
      text: `Wykonaj praktykę związaną z ${todayEl.polishName}. Możesz użyć jednej z 3 praktyk z sekcji Praktyki poniżej, lub po prostu siedź z energią żywiołu. Skup się na swojej intencji. Zapisz, co do ciebie przychodzi — obrazy, słowa, odczucia. Czas pracy: minimum 10 minut.`,
    },
    {
      title: 'Podziękowanie i zamknięcie',
      text: `Zakończ rytuał podziękowaniem: "Dziękuję, żywiole ${todayEl.polishName}, za twoją obecność i moc. Możesz odejść w pokoju, lub pozostać ze mną jako towarzysz. Niech energia tego rytuału przeniesie się w moje życie. Rytuał jest zamknięty." Zdmuchnij świece, jeśli zapalone. Zostań chwilę w ciszy.`,
    },
  ], [todayEl]);

  const BALANCE_REMEDIES: Record<ElementId, string> = {
    fire: 'Mało ognia: dodaj więcej aktywności fizycznej, twórczej ekspresji i podejmowania ryzyka. Za dużo ognia: medytacja przy wodzie, spacery, spowalnianie tempa.',
    water: 'Mało wody: pisz dziennik emocji, słuchaj muzyki, praktykuj empatię. Za dużo wody: uziemienie, ruch fizyczny, praca z granicami.',
    earth: 'Mało ziemi: ćwiczenia z uziemienia, gotowanie, prace ręczne, kontakt z naturą. Za dużo ziemi: nowe doświadczenia, podróże, swobodna twórczość.',
    air: 'Mało powietrza: czytanie, rozmowy, nauka czegoś nowego, oddechowe praktyki. Za dużo powietrza: medytacja w ciszy, joga, skupienie na ciele.',
    spirit: 'Mało ducha: medytacja, kontemplacja, rytuały połączenia. Za dużo ducha: zakorzenienie, praktyczne działanie, kontakt z materią.',
  };

  const s = useMemo(() => StyleSheet.create({
    safe: { flex: 1 },
    scroll: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: layout.padding.screen, paddingTop: 8, paddingBottom: 12,
    },
    headerTitle: { flex: 1, alignItems: 'center' },
    section: { marginHorizontal: layout.padding.screen, marginTop: 28 },
    sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: subColor, marginBottom: 12 },
    card: {
      backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder,
      borderRadius: 16, padding: 16, marginBottom: 10,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    chip: {
      borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
      marginRight: 8, marginBottom: 8, borderWidth: 1,
    },
    btn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
    btnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
    elementTab: {
      borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10,
      marginRight: 10, borderWidth: 1, alignItems: 'center', minWidth: 80,
    },
    practiceItem: { borderRadius: 16, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
    practiceHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16,
    },
    practiceBody: { paddingHorizontal: 16, paddingBottom: 16 },
    ritualStep: {
      borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1,
    },
    quizCard: {
      borderRadius: 16, padding: 20, borderWidth: 1,
    },
    quizAnswer: {
      borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1,
    },
    barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: cardBorder, marginHorizontal: 10, overflow: 'hidden' },
    oracleInput: {
      borderWidth: 1, borderRadius: 14, padding: 14, minHeight: 80,
      fontSize: 14, textAlignVertical: 'top',
    },
    sliderRow: { marginBottom: 18 },
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end',
    },
    modalBox: {
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 40, borderWidth: 1, borderBottomWidth: 0,
    },
    divider: { height: 1, marginVertical: 16, opacity: 0.12 },
  }), [cardBg, cardBorder, subColor]);

  const QUIZ_ANSWER_KEYS = ['a', 'b', 'c', 'd'];

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={[s.safe, {}]} edges={['top']}>

      <ElementalBg isDark={!isLight} />

      {/* HEADER */}
      <View style={s.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} hitSlop={12}>
          <ChevronLeft size={24} color={textColor} />
        </Pressable>
        <View style={s.headerTitle}>
          <Typography variant="title" style={{ color: textColor, fontSize: 17, fontWeight: '700' }}>
            {t('elementalMagic.magia_zywiolow', 'Magia Żywiołów')}
          </Typography>
          <Typography variant="caption" style={{ color: subColor, fontSize: 11, marginTop: 2 }}>
            {t('elementalMagic.ogien_woda_ziemia_powietrze_duch', 'OGIEŃ • WODA • ZIEMIA • POWIETRZE • DUCH')}
          </Typography>
        </View>
        <Pressable onPress={() => { if (isFavoriteItem('elemental_magic')) { removeFavoriteItem('elemental_magic'); } else { addFavoriteItem({ id: 'elemental_magic', label: 'Magia Żywiołów', route: 'ElementalMagic', params: {}, icon: 'Flame', color: accent, addedAt: new Date().toISOString() }); } }} hitSlop={12}>
          <Star size={22} color={accent} fill={isFavoriteItem('elemental_magic') ? accent : 'none'} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={insets.top + 60}>
        <ScrollView ref={scrollRef} style={s.scroll} showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}>

          {/* 3D PENTAGRAM WIDGET */}
          <PentagramWidget3D accent={accent} />

          <View style={s.section}>
            <Typography style={s.sectionLabel}>{t('elementalMagic.pentagram_zywiolow', 'PENTAGRAM ŻYWIOŁÓW')}</Typography>
            <Typography variant="body" style={{ color: subColor, fontSize: 13, lineHeight: 20 }}>
              {t('elementalMagic.obroc_widget_aby_poczuc_zywioly', 'Obróć widget, aby poczuć żywioły w przestrzeni. Każdy punkt pentagramu to inny żywioł.')}
            </Typography>
          </View>

          {/* DOMINANT ELEMENT */}
          <View style={[s.section, { marginTop: 28 }]}>
            <Typography style={s.sectionLabel}>{t('elementalMagic.twoj_dominujacy_zywiol', 'TWÓJ DOMINUJĄCY ŻYWIOŁ')}</Typography>
            <LinearGradient
              colors={[birthEl.color + '22', birthEl.color + '0A']}
              style={[s.card, { borderColor: birthEl.color + '35' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <View style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: birthEl.color + '25', borderWidth: 1, borderColor: birthEl.color + '50' }}>
                  <Typography style={{ fontSize: 22, color: birthEl.color }}>{birthEl.symbol}</Typography>
                </View>
                <View style={{ flex: 1 }}>
                  <Typography style={{ color: subColor, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 2 }}>
                    {t('elementalMagic.zywiol_urodzenia', 'ŻYWIOŁ URODZENIA')}
                  </Typography>
                  <Typography style={{ color: textColor, fontSize: 20, fontWeight: '800' }}>
                    {birthEl.polishName}
                  </Typography>
                  <Typography style={{ color: birthEl.color, fontSize: 12 }}>
                    {birthEl.direction} • {birthEl.season} • {birthEl.timeOfDay}
                  </Typography>
                </View>
              </View>
              <Typography style={{ color: subColor, fontSize: 13, lineHeight: 21, marginBottom: 12 }}>
                {birthEl.description}
              </Typography>
              <View style={{ marginBottom: 12 }}>
                <Typography style={{ color: textColor, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                  {t('elementalMagic.twoje_mocne_strony', 'TWOJE MOCNE STRONY')}
                </Typography>
                {birthEl.strengths.map((s2, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <CheckCircle2 size={14} color={birthEl.color} style={{ marginTop: 2 }} />
                    <Typography style={{ color: subColor, fontSize: 13, flex: 1 }}>{s2}</Typography>
                  </View>
                ))}
              </View>
              <View>
                <Typography style={{ color: textColor, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                  {t('elementalMagic.cien_do_pracy', 'CIEŃ DO PRACY')}
                </Typography>
                {birthEl.shadow.map((sh, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <CircleIcon size={14} color={subColor} style={{ marginTop: 2 }} />
                    <Typography style={{ color: subColor, fontSize: 13, flex: 1 }}>{sh}</Typography>
                  </View>
                ))}
              </View>
              <Pressable onPress={() => { setShowQuiz(true); setCurrentQuestion(0); resetQuiz(); }}
                style={[s.btn, { backgroundColor: birthEl.color + '22', borderWidth: 1, borderColor: birthEl.color + '40', marginTop: 16 }]}>
                <Typography style={{ color: birthEl.color, fontSize: 14, fontWeight: '700' }}>
                  {t('elementalMagic.zrob_ankiete_zywiolow', 'Zrób ankietę żywiołów')}
                </Typography>
              </Pressable>
            </LinearGradient>
          </View>

          {/* QUIZ MODAL */}
          <Modal visible={showQuiz} transparent animationType="slide">
            <View style={s.modalOverlay}>
              <View style={[s.modalBox, { backgroundColor: currentTheme.background, borderColor: cardBorder }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Typography style={{ color: textColor, fontSize: 16, fontWeight: '700' }}>
                    {t('elementalMagic.ankieta_zywiolow', 'Ankieta żywiołów')}
                  </Typography>
                  <Pressable onPress={() => setShowQuiz(false)} hitSlop={10}>
                    <Typography style={{ color: subColor, fontSize: 22 }}>✕</Typography>
                  </Pressable>
                </View>

                {quizResult === null ? (
                  <>
                    <Typography style={{ color: subColor, fontSize: 12, marginBottom: 14 }}>
                      Pytanie {currentQuestion + 1} z {ELEMENT_QUIZ_QUESTIONS.length}
                    </Typography>
                    <View style={{ height: 4, backgroundColor: cardBorder, borderRadius: 2, marginBottom: 16 }}>
                      <View style={{ height: 4, borderRadius: 2, backgroundColor: accent,
                        width: `${((currentQuestion + 1) / ELEMENT_QUIZ_QUESTIONS.length) * 100}%` }} />
                    </View>
                    <View style={[s.quizCard, { borderColor: cardBorder, backgroundColor: cardBg, marginBottom: 14 }]}>
                      <Typography style={{ color: textColor, fontSize: 15, fontWeight: '600', lineHeight: 22 }}>
                        {ELEMENT_QUIZ_QUESTIONS[currentQuestion].text}
                      </Typography>
                    </View>
                    {ELEMENT_QUIZ_QUESTIONS[currentQuestion].answers.map((ans, i) => {
                      const key = QUIZ_ANSWER_KEYS[i];
                      return (
                        <Pressable key={i} onPress={() => handleQuizAnswer(currentQuestion, key)}
                          style={[s.quizAnswer, {
                            borderColor: quizAnswers[currentQuestion] === key ? accent : cardBorder,
                            backgroundColor: quizAnswers[currentQuestion] === key ? accent + '14' : cardBg,
                          }]}>
                          <Typography style={{ color: quizAnswers[currentQuestion] === key ? accent : textColor, fontSize: 13, lineHeight: 20 }}>
                            {ans}
                          </Typography>
                        </Pressable>
                      );
                    })}
                  </>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Typography style={{ color: textColor, fontSize: 16, fontWeight: '700', marginBottom: 14 }}>
                      {t('elementalMagic.twoj_balans_zywiolow', 'Twój balans żywiołów')}
                    </Typography>
                    {ELEMENTS.map(el => {
                      const score = quizResult[el.id] || 0;
                      const maxScore = Math.max(...Object.values(quizResult)) || 1;
                      const pct = (score / maxScore) * 100;
                      return (
                        <View key={el.id} style={s.barRow}>
                          <View style={{ width: 28, alignItems: 'center' }}>
                            <Typography style={{ fontSize: 14 }}>{el.symbol}</Typography>
                          </View>
                          <View style={{ width: 60 }}>
                            <Typography style={{ color: el.color, fontSize: 12, fontWeight: '700' }}>{el.polishName}</Typography>
                          </View>
                          <View style={s.barTrack}>
                            <Animated.View entering={FadeInDown.delay(100).duration(500)}
                              style={{ height: 8, borderRadius: 4, backgroundColor: el.color, width: `${pct}%` }} />
                          </View>
                          <Typography style={{ color: subColor, fontSize: 12, width: 24 }}>{score}</Typography>
                        </View>
                      );
                    })}
                    {(() => {
                      const maxKey = (Object.entries(quizResult).sort((a, b) => b[1] - a[1])[0][0]) as ElementId;
                      const resultEl = ELEMENTS.find(e => e.id === maxKey)!;
                      return (
                        <View style={[s.card, { borderColor: resultEl.color + '35', backgroundColor: resultEl.color + '10', marginTop: 8 }]}>
                          <Typography style={{ color: resultEl.color, fontSize: 15, fontWeight: '800', marginBottom: 6 }}>
                            Twój wynikowy żywioł: {resultEl.polishName} {resultEl.symbol}
                          </Typography>
                          <Typography style={{ color: subColor, fontSize: 13, lineHeight: 20 }}>
                            {resultEl.description}
                          </Typography>
                        </View>
                      );
                    })()}
                    <Pressable onPress={resetQuiz} style={[s.btn, { backgroundColor: accent + '20', borderWidth: 1, borderColor: accent + '40' }]}>
                      <Typography style={{ color: accent, fontSize: 14, fontWeight: '700' }}>{t('elementalMagic.zrob_ponownie', 'Zrób ponownie')}</Typography>
                    </Pressable>
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>

          {/* ELEMENT PROFILES */}
          <View style={[s.section, { marginTop: 28 }]}>
            <Typography style={s.sectionLabel}>{t('elementalMagic.profile_zywiolow', 'PROFILE ŻYWIOŁÓW')}</Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16, marginBottom: 14 }}>
              {ELEMENTS.map(el => (
                <Pressable key={el.id} onPress={() => { setActiveElementTab(el.id); HapticsService.notify(); }}>
                  <View style={[s.elementTab, {
                    borderColor: activeElementTab === el.id ? el.color : cardBorder,
                    backgroundColor: activeElementTab === el.id ? el.color + '18' : cardBg,
                  }]}>
                    <Typography style={{ fontSize: 18, marginBottom: 4 }}>{el.symbol}</Typography>
                    <Typography style={{ color: activeElementTab === el.id ? el.color : subColor, fontSize: 12, fontWeight: '700' }}>
                      {el.polishName}
                    </Typography>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            <Animated.View entering={FadeInDown.duration(300)} key={activeElementTab}>
              <LinearGradient
                colors={[activeEl.color + '1A', activeEl.color + '08']}
                style={[s.card, { borderColor: activeEl.color + '30' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: activeEl.color + '22', borderWidth: 1, borderColor: activeEl.color + '45', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography style={{ fontSize: 18, color: activeEl.color }}>{activeEl.symbol}</Typography>
                  </View>
                  <View>
                    <Typography style={{ color: textColor, fontSize: 18, fontWeight: '800' }}>{activeEl.polishName}</Typography>
                    <Typography style={{ color: activeEl.color, fontSize: 12 }}>
                      {activeEl.direction} · {activeEl.season}
                    </Typography>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                  {activeEl.keywords.map((kw, i) => (
                    <View key={i} style={[s.chip, { borderColor: activeEl.color + '35', backgroundColor: activeEl.color + '12', marginBottom: 6 }]}>
                      <Typography style={{ color: activeEl.color, fontSize: 11 }}>{kw}</Typography>
                    </View>
                  ))}
                </View>
                <View style={{ marginBottom: 12 }}>
                  <Typography style={{ color: subColor, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>{t('elementalMagic.znaki_zodiaku', 'ZNAKI ZODIAKU')}</Typography>
                  <Typography style={{ color: textColor, fontSize: 13 }}>{activeEl.zodiacSigns.join(' · ')}</Typography>
                </View>
                <View style={{ marginBottom: 12 }}>
                  <Typography style={{ color: subColor, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>{t('elementalMagic.chakry', 'CHAKRY')}</Typography>
                  <Typography style={{ color: textColor, fontSize: 13 }}>{activeEl.chakras.join(' · ')}</Typography>
                </View>
                <View style={{ marginBottom: 12 }}>
                  <Typography style={{ color: subColor, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>{t('elementalMagic.zastosowan_magiczne', 'ZASTOSOWANIA MAGICZNE')}</Typography>
                  {activeEl.magicalUses.map((mu, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                      <Sparkles size={12} color={activeEl.color} style={{ marginTop: 3 }} />
                      <Typography style={{ color: subColor, fontSize: 13, flex: 1 }}>{mu}</Typography>
                    </View>
                  ))}
                </View>
                <View>
                  <Typography style={{ color: subColor, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>{t('elementalMagic.czas_dnia_i_kierunek', 'CZAS DNIA I KIERUNEK')}</Typography>
                  <Typography style={{ color: textColor, fontSize: 13 }}>
                    {activeEl.timeOfDay} · {activeEl.direction}
                  </Typography>
                </View>
              </LinearGradient>
            </Animated.View>
          </View>

          {/* TODAY'S ELEMENTAL WEATHER */}
          <View style={[s.section, { marginTop: 28 }]}>
            <Typography style={s.sectionLabel}>{t('elementalMagic.pogoda_zywiolow_dzis', 'POGODA ŻYWIOŁÓW DZIŚ')}</Typography>
            <LinearGradient
              colors={[todayEl.color + '28', todayEl.color + '0E']}
              style={[s.card, { borderColor: todayEl.color + '40' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: todayEl.color + '28', borderWidth: 1.5, borderColor: todayEl.color, alignItems: 'center', justifyContent: 'center' }}>
                  <Typography style={{ fontSize: 20 }}>{todayEl.symbol}</Typography>
                </View>
                <View>
                  <Typography style={{ color: subColor, fontSize: 10, fontWeight: '700', letterSpacing: 2 }}>
                    {t('elementalMagic.aktywny_zywiol_dzis', 'AKTYWNY ŻYWIOŁ DZIŚ')}
                  </Typography>
                  <Typography style={{ color: textColor, fontSize: 18, fontWeight: '800' }}>
                    {todayEl.polishName}
                  </Typography>
                </View>
              </View>
              <Typography style={{ color: textColor, fontSize: 14, fontWeight: '700', marginBottom: 10 }}>
                Pracuj dziś z {todayEl.polishName.toLowerCase()} — 3 praktyki na ten dzień:
              </Typography>
              {ELEMENTAL_PRACTICES.filter(p => p.element === todayEl.id).slice(0, 3).map((p, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: todayEl.color + '25', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography style={{ color: todayEl.color, fontSize: 11, fontWeight: '700' }}>{i + 1}</Typography>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography style={{ color: textColor, fontSize: 13, fontWeight: '700' }}>{p.name}</Typography>
                    <Typography style={{ color: subColor, fontSize: 12 }}>{p.duration}</Typography>
                  </View>
                </View>
              ))}
            </LinearGradient>
          </View>

          {/* ELEMENTAL PRACTICES */}
          <View style={[s.section, { marginTop: 28 }]}>
            <Typography style={s.sectionLabel}>{t('elementalMagic.praktyki_zywiolow', 'PRAKTYKI ŻYWIOŁÓW')}</Typography>
            {ELEMENTAL_PRACTICES.map((practice, i) => {
              const el = ELEMENTS.find(e => e.id === practice.element)!;
              const isOpen = expandedPractice === i;
              return (
                <View key={i} style={[s.practiceItem, { borderColor: isOpen ? el.color + '40' : cardBorder, backgroundColor: isOpen ? el.color + '08' : cardBg }]}>
                  <Pressable style={s.practiceHeader} onPress={() => {
                    setExpandedPractice(isOpen ? null : i);
                    HapticsService.notify();
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: el.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography style={{ fontSize: 13 }}>{el.symbol}</Typography>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography style={{ color: textColor, fontSize: 14, fontWeight: '700' }}>{practice.name}</Typography>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                          <Typography style={{ color: el.color, fontSize: 11 }}>{el.polishName}</Typography>
                          <Typography style={{ color: subColor, fontSize: 11 }}>• {practice.duration}</Typography>
                        </View>
                      </View>
                    </View>
                    {isOpen ? <ChevronUp size={16} color={subColor} /> : <ChevronDown size={16} color={subColor} />}
                  </Pressable>
                  {isOpen && (
                    <Animated.View entering={FadeInDown.duration(280)} style={s.practiceBody}>
                      <View style={{ height: 1, backgroundColor: cardBorder, marginBottom: 14 }} />
                      <Typography style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 12 }}>
                        {practice.description}
                      </Typography>
                      <View style={{ marginBottom: 12 }}>
                        <Typography style={{ color: textColor, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
                          {t('elementalMagic.materialy', 'MATERIAŁY')}
                        </Typography>
                        <Typography style={{ color: subColor, fontSize: 13 }}>{practice.materials}</Typography>
                      </View>
                      <Typography style={{ color: textColor, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
                        {t('elementalMagic.kroki', 'KROKI')}
                      </Typography>
                      {practice.steps.map((step, j) => (
                        <View key={j} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: el.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography style={{ color: el.color, fontSize: 10, fontWeight: '700' }}>{j + 1}</Typography>
                          </View>
                          <Typography style={{ color: subColor, fontSize: 13, lineHeight: 20, flex: 1 }}>{step}</Typography>
                        </View>
                      ))}
                    </Animated.View>
                  )}
                </View>
              );
            })}
          </View>

          {/* ELEMENTAL RITUAL */}
          <View style={[s.section, { marginTop: 28 }]}>
            <Typography style={s.sectionLabel}>{t('elementalMagic.rytual_zywiolu_dnia', 'RYTUAŁ ŻYWIOŁU DNIA')}</Typography>
            <View style={[s.card, { borderColor: todayEl.color + '30', marginBottom: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Typography style={{ fontSize: 18 }}>{todayEl.symbol}</Typography>
                <Typography style={{ color: textColor, fontSize: 15, fontWeight: '700' }}>
                  Rytuał {todayEl.polishName.charAt(0) === 'O' ? 'Ognia' : todayEl.polishName.charAt(0) === 'W' && todayEl.polishName !== 'Woda' ? 'Wiatru' : todayEl.polishName === 'Woda' ? 'Wody' : todayEl.polishName === 'Ziemia' ? 'Ziemi' : todayEl.polishName === 'Duch' ? 'Ducha' : todayEl.polishName}
                </Typography>
              </View>
              <Typography style={{ color: subColor, fontSize: 13 }}>
                {t('elementalMagic.tapnij_kazdy_krok_aby_oznaczyc', 'Tapnij każdy krok, aby oznaczyć postęp. Rytuał trwa 20-40 minut.')}
              </Typography>
            </View>
            {RITUAL_STEPS.map((step, i) => {
              const done = ritualStep >= i;
              const active = ritualStep === i - 1;
              return (
                <Pressable key={i} onPress={() => {
                  setRitualStep(i);
                  HapticsService.notify();
                }}>
                  <Animated.View entering={FadeInDown.delay(i * 60).duration(300)}>
                    <View style={[s.ritualStep, {
                      borderColor: done ? todayEl.color + '50' : active ? cardBorder : cardBorder,
                      backgroundColor: done ? todayEl.color + '10' : cardBg,
                    }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14,
                          backgroundColor: done ? todayEl.color : cardBorder,
                          alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                          {done
                            ? <CheckCircle2 size={16} color="#fff" />
                            : <Typography style={{ color: subColor, fontSize: 12, fontWeight: '700' }}>{i + 1}</Typography>
                          }
                        </View>
                        <View style={{ flex: 1 }}>
                          <Typography style={{ color: done ? todayEl.color : textColor, fontSize: 14, fontWeight: '700', marginBottom: 6 }}>
                            {step.title}
                          </Typography>
                          <Typography style={{ color: subColor, fontSize: 13, lineHeight: 21 }}>
                            {step.text}
                          </Typography>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                </Pressable>
              );
            })}
            {ritualStep >= RITUAL_STEPS.length - 1 && (
              <Animated.View entering={FadeInUp.duration(400)}>
                <LinearGradient
                  colors={[todayEl.color + '28', todayEl.color + '10']}
                  style={[s.card, { borderColor: todayEl.color + '40', marginTop: 6 }]}>
                  <Typography style={{ color: todayEl.color, fontSize: 15, fontWeight: '800', textAlign: 'center', marginBottom: 6 }}>
                    {t('elementalMagic.rytual_ukonczony', 'Rytuał ukończony')}
                  </Typography>
                  <Typography style={{ color: subColor, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                    Pięknie. Żywioł {todayEl.polishName} pracuje z tobą. Noś tę energię przez resztę dnia.
                  </Typography>
                </LinearGradient>
              </Animated.View>
            )}
          </View>

          {/* BALANCE ASSESSMENT */}
          <View style={[s.section, { marginTop: 28 }]}>
            <Typography style={s.sectionLabel}>{t('elementalMagic.ocena_balansu_zywiolow', 'OCENA BALANSU ŻYWIOŁÓW')}</Typography>
            <View style={[s.card]}>
              <Typography style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
                {t('elementalMagic.przesun_suwaki_aby_ocenic_swoj', 'Przesuń suwaki, aby ocenić swój aktualny balans każdego żywiołu (0 = nieobecny, 100 = dominujący).')}
              </Typography>
              {ELEMENTS.map(el => (
                <View key={el.id} style={s.sliderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Typography style={{ fontSize: 14 }}>{el.symbol}</Typography>
                      <Typography style={{ color: el.color, fontSize: 13, fontWeight: '700' }}>{el.polishName}</Typography>
                    </View>
                    <Typography style={{ color: subColor, fontSize: 12 }}>{balance[el.id]}%</Typography>
                  </View>
                  <Slider
                    minimumValue={0}
                    maximumValue={100}
                    step={1}
                    value={balance[el.id]}
                    onValueChange={(v) => setBalance(prev => ({ ...prev, [el.id]: Math.round(v) }))}
                    minimumTrackTintColor={el.color}
                    maximumTrackTintColor={cardBorder}
                    thumbTintColor={el.color}
                    style={{ height: 32 }}
                  />
                </View>
              ))}
            </View>
            <Typography style={{ color: textColor, fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 4 }}>
              {t('elementalMagic.rekomendac', 'REKOMENDACJE')}
            </Typography>
            {ELEMENTS.map(el => {
              const val = balance[el.id];
              const needsWork = val < 30 || val > 80;
              if (!needsWork) return null;
              return (
                <View key={el.id} style={[s.card, { borderColor: el.color + '30', backgroundColor: el.color + '08', marginBottom: 8 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Typography style={{ fontSize: 13 }}>{el.symbol}</Typography>
                    <Typography style={{ color: el.color, fontSize: 13, fontWeight: '700' }}>
                      {el.polishName} — {val < 30 ? 'za mało' : 'za dużo'}
                    </Typography>
                  </View>
                  <Typography style={{ color: subColor, fontSize: 12, lineHeight: 19 }}>
                    {BALANCE_REMEDIES[el.id]}
                  </Typography>
                </View>
              );
            })}
            {ELEMENTS.every(el => balance[el.id] >= 30 && balance[el.id] <= 80) && (
              <Animated.View entering={FadeInDown.duration(300)}>
                <LinearGradient
                  colors={[accent + '20', accent + '08']}
                  style={[s.card, { borderColor: accent + '35' }]}>
                  <Typography style={{ color: accent, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
                    {t('elementalMagic.twoj_balans_zywiolow_jest_harmonijn', 'Twój balans żywiołów jest harmonijny')}
                  </Typography>
                  <Typography style={{ color: subColor, fontSize: 13, textAlign: 'center', marginTop: 6 }}>
                    {t('elementalMagic.wszystkie_zywioly_dzialaja_w_zdrowy', 'Wszystkie żywioły działają w zdrowym zakresie. Kontynuuj swoją praktykę.')}
                  </Typography>
                </LinearGradient>
              </Animated.View>
            )}
          </View>

          {/* ORACLE AI */}
          <View style={[s.section, { marginTop: 28 }]}>
            <Typography style={s.sectionLabel}>{t('elementalMagic.wyrocznia_zywiolow', 'WYROCZNIA ŻYWIOŁÓW')}</Typography>
            <View style={[s.card, { borderColor: accent + '25', backgroundColor: accent + '08' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Wand2 size={18} color={accent} />
                <Typography style={{ color: textColor, fontSize: 14, fontWeight: '700' }}>
                  {t('elementalMagic.elementaln_wyrocznia', 'Elementalna Wyrocznia')}
                </Typography>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                {Object.entries(ORACLE_CHIPS).map(([elId, chip]) => {
                  const el = ELEMENTS.find(e => e.id === elId)!;
                  return (
                    <Pressable key={elId} onPress={() => handleOracleAsk(chip)}
                      style={[s.chip, { borderColor: el.color + '40', backgroundColor: el.color + '10' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Typography style={{ fontSize: 10 }}>{el.symbol}</Typography>
                        <Typography style={{ color: el.color, fontSize: 11 }}>{chip}</Typography>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                style={[s.oracleInput, { color: textColor, borderColor: cardBorder, backgroundColor: cardBg }]}
                value={oracleInput}
                onChangeText={setOracleInput}
                placeholder={t('elementalMagic.zapytaj_wyrocznie_o_zywioly_balans', 'Zapytaj wyrocznię o żywioły, balans lub praktykę…')}
                placeholderTextColor={subColor}
                multiline
              />
              <Pressable onPress={() => handleOracleAsk()} disabled={oracleLoading || !oracleInput.trim()}>
                <LinearGradient
                  colors={oracleLoading || !oracleInput.trim() ? (isLight ? ['#C0B8AF', '#ABA39A'] : ['#888', '#666']) : [accent, accent + 'BB']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[s.btn, { flexDirection: 'row', gap: 10 }]}>
                  <Sparkles size={16} color="#fff" />
                  <Typography style={s.btnText}>
                    {oracleLoading ? 'Wyrocznia mówi…' : 'Zapytaj wyrocznię'}
                  </Typography>
                </LinearGradient>
              </Pressable>
              {oracleResponse.length > 0 && (
                <Animated.View entering={FadeInDown.duration(400)}>
                  <View style={{ marginTop: 14 }}>
                    <View style={{ height: 1, backgroundColor: cardBorder, marginBottom: 14 }} />
                    <Typography style={{ color: subColor, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>
                      {t('elementalMagic.odpowiedz_wyroczni', 'ODPOWIEDŹ WYROCZNI')}
                    </Typography>
                    <Typography style={{ color: textColor, fontSize: 14, lineHeight: 24 }}>
                      {oracleResponse}
                    </Typography>
                  </View>
                </Animated.View>
              )}
            </View>
          </View>

          <EndOfContentSpacer />
        </ScrollView>
      </KeyboardAvoidingView>
        </SafeAreaView>
</View>
  );
}
