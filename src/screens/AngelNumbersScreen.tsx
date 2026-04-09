// @ts-nocheck
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  View, Text, ScrollView, Pressable, StyleSheet, TextInput, Dimensions,
  Modal, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Polygon, G, Text as SvgText, Defs, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';
import {
  ChevronLeft, Star, Search, Hash, Sparkles, ArrowRight, Clock, Calendar, Zap, MessageCircle,
  BookOpen, Bell, User, Plus, Trash2, Eye, Heart, Shield, TrendingUp, Moon, Sun, Wind,
  CheckCircle, X, ChevronDown, ChevronRight,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { formatLocaleDate } from '../core/utils/localeFormat';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#F59E0B';

// ── AREA COLORS ───────────────────────────────────────────────
const AREA_COLORS: Record<string, string> = {
  miłość:        '#F472B6',
  obfitość:      '#34D399',
  transformacja: '#8B5CF6',
  ochrona:       '#60A5FA',
  intuicja:      '#A78BFA',
  misja:         '#FBBF24',
  zdrowie:       '#FB7185',
  kariera:       '#38BDF8',
};

// ── CHAKRA MAP ─────────────────────────────────────────────────
const CHAKRA_MAP: Record<string, { name: string; color: string; sanskrit: string }> = {
  '111': { name: 'Korony',      color: '#C084FC', sanskrit: 'Sahasrara' },
  '222': { name: 'Trzeciego Oka', color: '#818CF8', sanskrit: 'Ajna'      },
  '333': { name: 'Gardła',      color: '#60A5FA', sanskrit: 'Vishuddha'  },
  '444': { name: 'Serca',       color: '#34D399', sanskrit: 'Anahata'    },
  '555': { name: 'Splotu',      color: '#FBBF24', sanskrit: 'Manipura'   },
  '666': { name: 'Sakralnej',   color: '#FB923C', sanskrit: 'Svadhisthana' },
  '777': { name: 'Korony',      color: '#C084FC', sanskrit: 'Sahasrara'  },
  '888': { name: 'Serca',       color: '#34D399', sanskrit: 'Anahata'    },
  '999': { name: 'Korony',      color: '#C084FC', sanskrit: 'Sahasrara'  },
  '1111': { name: 'Korony',     color: '#C084FC', sanskrit: 'Sahasrara'  },
  '1212': { name: 'Serca',      color: '#34D399', sanskrit: 'Anahata'    },
  '1010': { name: 'Trzeciego Oka', color: '#818CF8', sanskrit: 'Ajna'    },
  '0':    { name: 'Podstawy',   color: '#FB923C', sanskrit: 'Muladhara'  },
};

// ── ANGEL NUMBERS DATA ────────────────────────────────────────
type AngelNumber = {
  number: string;
  title: string;
  message: string;
  affirmation: string;
  area: keyof typeof AREA_COLORS;
  color: string;
  actionGuidance?: string;
  lifeArea?: string;
};

const ANGEL_NUMBERS: AngelNumber[] = [
  {
    number: '111',
    title: 'Manifest',
    message: 'Twoje myśli są teraz magnesem — każde pragnienie wysyłasz bezpośrednio do Wszechświata. Brama manifestacji stoi otworem: wejdź z jasną intencją i pewnym sercem. To co widzisz w duchu, wkrótce ujrzysz oczami.',
    affirmation: 'Moje myśli tworzą moją rzeczywistość — wybieram tylko te, które mnie wznoszą.',
    area: 'misja',
    color: '#FBBF24',
    actionGuidance: 'Wypisz 3 konkretne intencje. Wizualizuj je jako już spełnione przez 5 minut.',
    lifeArea: 'Cel życiowy i manifest',
  },
  {
    number: '222',
    title: 'Równowaga',
    message: 'Wszechświat prosi Cię o cierpliwość — nasiona, które zasiałeś, kiełkują pod powierzchnią. Zaufaj procesowi i utrzymaj harmonię pomiędzy dawaniem a przyjmowaniem. Równowaga jest Twoim supermocarstwem.',
    affirmation: 'Ufam boskiemu harmonogramowi — wszystko nadchodzi we właściwym czasie.',
    area: 'ochrona',
    color: '#60A5FA',
    actionGuidance: 'Znajdź dziś 10 minut na cichy spokój. Zwróć uwagę gdzie dajesz za dużo lub za mało.',
    lifeArea: 'Relacje i partnerstwo',
  },
  {
    number: '333',
    title: 'Ekspansja',
    message: 'Wzniosłe istoty i twórcza energia otaczają Cię ze wszystkich stron, wzmacniając każdy Twój krok. Jesteś w środku kosmicznej amplifikacji — Twój głos ma moc, Twoja kreacja ma znaczenie. Wyraź się w pełni.',
    affirmation: 'Jestem kanałem boskiej twórczości, a mój wyraz dotyka serc innych.',
    area: 'transformacja',
    color: '#8B5CF6',
    actionGuidance: 'Stwórz coś dziś — napisz, narysuj, zaśpiewaj. Twój twórczy wyraz jest potrzebny światu.',
    lifeArea: 'Twórczość i wyrażanie siebie',
  },
  {
    number: '444',
    title: 'Fundament',
    message: 'Anielskie zastępy stoją murem za Twoimi snami — nie jesteś w tej podróży sam. Ziemia pod Twoimi stopami jest stabilna, a niebo nad głową sprzyja Twoim działaniom. Budujesz coś trwałego i świętego.',
    affirmation: 'Jestem chroniony, wsparty i prowadzony przez boską mądrość na każdym kroku.',
    area: 'ochrona',
    color: '#34D399',
    actionGuidance: 'Zrób jeden konkretny krok w kierunku swojego długoterminowego celu. Fundamenty wymagają codziennych cegieł.',
    lifeArea: 'Bezpieczeństwo i stabilność',
  },
  {
    number: '555',
    title: 'Przemiana',
    message: 'Wielka zmiana zbliża się ku Tobie jak przypływ — nie opieraj się, lecz płyń. To co odchodzi, robiło swoje; to co nadchodzi, jest doskonalszą wersją Twojej drogi. Zmiana jest dowodem, że rośniesz.',
    affirmation: 'Witam zmiany z otwartym sercem, bo każda transformacja prowadzi mnie wyżej.',
    area: 'transformacja',
    color: '#F97316',
    actionGuidance: 'Zidentyfikuj jeden obszar życia gdzie czujesz opór. Zapytaj siebie: czego tak naprawdę się boję?',
    lifeArea: 'Zmiana i wolność',
  },
  {
    number: '666',
    title: 'Harmonia',
    message: 'Wszechświat zaprasza Cię do wyrównania myśli, ciała i ducha w jedną spójną całość. Oderwij uwagę od tego co materialne i przywróć kontakt z tym co wieczne w sobie. Harmonia wewnętrzna przyciąga harmonię zewnętrzną.',
    affirmation: 'Równoważę swoje życie z łaską — moje ciało, umysł i duch tworzą jedno piękne całości.',
    area: 'intuicja',
    color: '#A78BFA',
    actionGuidance: 'Zrób przegląd równowagi: ciało (ruch/sen), umysł (nauka), duch (praktyka). Gdzie jest zaniedbanie?',
    lifeArea: 'Równowaga ciała i ducha',
  },
  {
    number: '777',
    title: 'Przebudzenie',
    message: 'Stąpasz ścieżką doskonale wyrównaną z Twoją duszą — boskie potwierdzenie brzmi jak dzwon. Każda decyzja, każde spotkanie i każda lekcja były potrzebne, byś dotarł właśnie tutaj. Trwaj na tej ścieżce z radością.',
    affirmation: 'Jestem na właściwej drodze i każdy krok napełnia mnie duchową pewnością.',
    area: 'misja',
    color: '#FBBF24',
    actionGuidance: 'Podziękuj za trzy trudne doświadczenia z przeszłości. Dostrzeż jak każde ukształtowało Cię na lepsze.',
    lifeArea: 'Duchowe przebudzenie i mądrość',
  },
  {
    number: '888',
    title: 'Obfitość',
    message: 'Nieskończony strumień obfitości płynie ku Tobie — finansowej, emocjonalnej i duchowej. Jesteś gotowy przyjąć hojność Wszechświata; otwórz ręce i serce bez lęku. Zasługujesz na wszystko co piękne i pełne.',
    affirmation: 'Obfitość jest moim naturalnym stanem — przyjmuję z wdzięcznością wszelkie dary losu.',
    area: 'obfitość',
    color: '#34D399',
    actionGuidance: 'Otwórz się na przyjmowanie. Powiedz dziś "dziękuję" zamiast "nie ma za co" gdy ktoś Ci coś daje.',
    lifeArea: 'Finansowa obfitość i dobrobyt',
  },
  {
    number: '999',
    title: 'Zakończenie',
    message: 'Jeden rozdział dobiega końca, by kolejny mógł zajaśnieć pełnym blaskiem. Puść z miłością to, co już wypełniło swoje zadanie, i podziękuj za każdą naukę. Zakończenie jest bramą do nowego, piękniejszego początku.',
    affirmation: 'Zwalniam to co minęło z wdzięcznością, robiąc miejsce dla cudownego nowego.',
    area: 'transformacja',
    color: '#C084FC',
    actionGuidance: 'Napisz list do zakończonego rozdziału. Wyraź wdzięczność i świadomie go zamknij.',
    lifeArea: 'Zakończenia i nowe początki',
  },
  {
    number: '1111',
    title: 'Portal',
    message: 'Brama Przebudzenia otworzyła się na oścież — Wszechświat zaprasza Cię do nowej wersji siebie. To moment synchroniczności rzadki jak wschód słońca przez chmury; zapisz swoje życzenie teraz. Jesteś widziany, słyszany i kochany przez wszystkie wymiary.',
    affirmation: 'Przechodzę przez portal przebudzenia gotowy na swoją najwyższą wersję.',
    area: 'misja',
    color: '#F59E0B',
    actionGuidance: 'Gdy widzisz 11:11, natychmiast wyślij najgłębsze pragnienie swojego serca w przestrzeń.',
    lifeArea: 'Brama przebudzenia i misja duszy',
  },
  {
    number: '1212',
    title: 'Harmonia kroków',
    message: 'Stary i nowy świat tańczą razem w Twoim życiu, wymagając subtelnej równowagi. Ufaj naprzemienności rytmu — raz dajesz, raz otrzymujesz, raz prowadzisz, raz podążasz. W tej harmonii kroków rodzi się piękno Twojej drogi.',
    affirmation: 'Poruszam się przez życie w harmonii, ufając boskiemu rytmowi zmian.',
    area: 'ochrona',
    color: '#38BDF8',
    actionGuidance: 'Oceń rytm swojego dnia. Czy jest miejsce na odpoczynek i na działanie w równiej proporcji?',
    lifeArea: 'Harmonia i równowaga życiowa',
  },
  {
    number: '1221',
    title: 'Odbicie',
    message: 'To czego szukasz na zewnątrz, czeka na Ciebie wewnątrz — lustro rzeczywistości nigdy nie kłamie. Twoje relacje, sytuacje i wyzwania są odzwierciedleniem Twojego wnętrza; zmień siebie, zmienisz świat. Patrz głębiej niż powierzchnia.',
    affirmation: 'Moje wnętrze kształtuje mój świat — kultywuję piękno od środka.',
    area: 'intuicja',
    color: '#818CF8',
    actionGuidance: 'Cokolwiek drażni Cię w kimś innym — zbadaj, czy to nie jest Twój własny cień.',
    lifeArea: 'Relacje jako zwierciadło',
  },
  {
    number: '2222',
    title: 'Trwałość',
    message: 'Cztery dwójki tworzą most między Twoim marzeniem a jego materializacją — fundamenty są gotowe. Wszystko co teraz budujesz, ma szansę przetrwać próbę czasu, jeśli gruntuje się w autentyczności. Trwaj w swoich wartościach.',
    affirmation: 'Buduję swoje życie na trwałych fundamentach miłości, prawdy i wytrwałości.',
    area: 'ochrona',
    color: '#60A5FA',
    actionGuidance: 'Wypisz 5 swoich kluczowych wartości. Oceń czy Twoje decyzje z ostatniego tygodnia były z nimi zgodne.',
    lifeArea: 'Trwałość i budowanie',
  },
  {
    number: '3333',
    title: 'Trójca',
    message: 'Umysł, ciało i duch są teraz zsynchronizowane z boską trójcą twórczości. Wyrażaj siebie bez cenzury — Twoja autentyczność jest darem dla świata. Twórcza moc tryska z Ciebie jak źródło, które nigdy nie wysycha.',
    affirmation: 'Wyrażam swój dar twórczy z odwagą, wiedząc że świat potrzebuje mojego głosu.',
    area: 'transformacja',
    color: '#F472B6',
    actionGuidance: 'Połącz trzy aspekty: intelekt (naucz się czegoś), emocje (wyraź coś), ciało (rusz się).',
    lifeArea: 'Twórczość i samowyrażenie',
  },
  {
    number: '4444',
    title: 'Forteca Światła',
    message: 'Cztery czwórki to najpotężniejsza tarcza anielska — jesteś otoczony ze wszystkich stron dosłownie i w przenośni. Żadna negatywna energia nie może przekroczyć tej granicy ochrony. Działaj z odwagą, bo jesteś bezpieczny.',
    affirmation: 'Jestem bezpieczny, chroniony i prowadzony. Działam z odwagą w pełnej ochronie.',
    area: 'ochrona',
    color: '#34D399',
    actionGuidance: 'Ustaw intencję ochrony energetycznej. Wyobraź sobie złotą bańkę wokół siebie na cały dzień.',
    lifeArea: 'Ochrona i bezpieczeństwo',
  },
  {
    number: '5555',
    title: 'Rewolucja',
    message: 'Pięć piętek to kosmiczna rewolucja w Twoim życiu — zmiany na skalę, której dotąd nie doświadczyłeś. Twoja dusza pragnie wolności absolutnej; cokolwiek Cię ogranicza, nie przetrwa tej fali. Bądź gotowy na skok w nieznane.',
    affirmation: 'Przyjmuję rewolucję w swoim życiu — jestem wolny, nieustraszony i gotowy na nowe.',
    area: 'transformacja',
    color: '#F97316',
    actionGuidance: 'Wypisz trzy rzeczy, które trzymają Cię z tyłu. Zapytaj siebie: co bym zrobił, gdybym się nie bał?',
    lifeArea: 'Radykalna zmiana i wolność',
  },
  {
    number: '6666',
    title: 'Mistrz Równowagi',
    message: 'Sześć szóstek to wezwanie do mistrzowskiej harmonii we wszystkich wymiarach Twojego życia. Nie ma przypadku w tej liczbie — Wszechświat precyzyjnie wskazuje gdzie przywrócić balans. Zadbaj o siebie jak o ogród wymagający stałej opieki.',
    affirmation: 'Dbam o siebie z miłością i mądrością, balansując każdy aspekt swojego życia.',
    area: 'zdrowie',
    color: '#A78BFA',
    actionGuidance: 'Przeprowadź pełny przegląd życia: zdrowie/praca/relacje/finanse/duchowość. Oceń każdy od 1-10.',
    lifeArea: 'Holistyczna równowaga',
  },
  {
    number: '7777',
    title: 'Mistyczny Dar',
    message: 'Cztery siódemki to rzadki skarb — sygnał, że Twoje duchowe dary są teraz wyjątkowo aktywne. Intuicja, poczucie energii i zdolność do synchroniczności osiągają szczyt. Ufaj swoim przeczuciom bezwarunkowo.',
    affirmation: 'Moje dary duchowe są prawdziwe i wartościowe. Ufam swojej intuicji absolutnie.',
    area: 'intuicja',
    color: '#FBBF24',
    actionGuidance: 'Medytuj przez 15 minut skupiając się na czakrze trzeciego oka. Zapisz obrazy które widzisz.',
    lifeArea: 'Dary duchowe i intuicja',
  },
  {
    number: '8888',
    title: 'Nieskończoność',
    message: 'Osiem ósemek tworzy znak nieskończoności czterokrotnie wzmocniony — strumień obfitości nigdy się dla Ciebie nie kończy. Pieniądze, miłość, zdrowie i możliwości przepływają przez Ciebie jak rzeka przez żyzną deltę.',
    affirmation: 'Jestem otwartym kanałem nieskończonej obfitości we wszystkich formach.',
    area: 'obfitość',
    color: '#34D399',
    actionGuidance: 'Daj coś bez oczekiwania na wzajemność. Szczodrość aktywuje kosmiczne prawa obfitości.',
    lifeArea: 'Nieskończona obfitość',
  },
  {
    number: '9999',
    title: 'Wielkie Domknięcie',
    message: 'Cztery dziewiątki oznaczają kompletne zamknięcie wielkiego rozdziału duszy — czegoś czego cykl sięgał może wiele lat. To nie jest koniec; to jest ukończenie na najwyższym poziomie. Twoja dusza awansuje.',
    affirmation: 'Kończę ten cykl z pełnią serca. Moja dusza dorasta do nowego, wyższego poziomu.',
    area: 'transformacja',
    color: '#C084FC',
    actionGuidance: 'Napisz podsumowanie "rozdziału" który czujesz że dobiega końca. Co wyniosłeś? Czego nauczyłeś innych?',
    lifeArea: 'Wielkie zakończenie i awans duszy',
  },
  {
    number: '1010',
    title: 'Cykl zamknięty',
    message: 'Jeden cykl dobiegł pełni, a Wszechświat przygotowuje dla Ciebie zupełnie czyste płótno. Jedynka symbolizuje nowe początki, zero — pełnię, z której wszystko wyłania się i do której wraca. Stoisz u progu cudownej transformacji.',
    affirmation: 'Stoję u progu nowego cyklu pełen wdzięczności za wszystko, co było.',
    area: 'misja',
    color: '#FBBF24',
    actionGuidance: 'Stwórz symboliczny rytuał domknięcia. Napisz co kończysz, potem napisz co zaczynasz.',
    lifeArea: 'Nowe początki i czyste płótno',
  },
  {
    number: '1234',
    title: 'Sekwencja wzrostu',
    message: 'Podążasz krok po kroku bożą sekwencją wzrostu — każdy etap prowadzi do kolejnego z gracją. Nie spiesz się, nie przeskakuj kroków; w procesie tkwi piękno i mądrość. Rozkoszuj się podróżą równie mocno co celem.',
    affirmation: 'Cieszę się każdym krokiem mojej podróży, wiedząc że wszystko dzieje się we właściwej kolejności.',
    area: 'obfitość',
    color: '#34D399',
    actionGuidance: 'Podziel swój cel na cztery kolejne kroki. Skup się tylko na krok nr 1 przez najbliższy tydzień.',
    lifeArea: 'Stopniowy wzrost i postęp',
  },
  {
    number: '911',
    title: 'Służba',
    message: 'Twoja dusza-misja woła głośniej niż kiedykolwiek — czas odpowiedzieć na wyższe powołanie. Twoje talenty, rany i mądrość zebrana przez lata są dokładnie tym, czego potrzebuje Twoje otoczenie. Stań się latarnią.',
    affirmation: 'Odpowiadam na wyższe powołanie z odwagą i pokorą, służąc swoim unikalnym darem.',
    area: 'misja',
    color: '#FB923C',
    actionGuidance: 'Zapytaj siebie: jak moje najgłębsze rany mogą stać się moim największym darem dla innych?',
    lifeArea: 'Misja i służba',
  },
  {
    number: '0',
    title: 'Pustka — źródło',
    message: 'Zero to nie nicość — to nieskończony potencjał przed każdą formą. W ciszy, w przestrzeni między myślami, mieszka cała moc stworzenia. Wróć do tej pierwotnej ciszy i posłuchaj, co Wszechświat chce przez Ciebie wyrazić.',
    affirmation: 'Spoczywam w błogosławionej pustce, z której wyłania się całe moje piękne życie.',
    area: 'intuicja',
    color: '#94A3B8',
    actionGuidance: 'Siedź w ciszy przez 20 minut bez żadnej praktyki. Tylko bycie. To jest Twoja praktyka na dziś.',
    lifeArea: 'Pustka i nieskończony potencjał',
  },
  {
    number: '303',
    title: 'Twórcze Wsparcie',
    message: 'Wzniosłe istoty twórcze — muzy i aniołowie sztuki — są teraz dosłownie tuż obok. Każda Twoja idea, każdy projekt, każde dzieło ma ich pełne wsparcie i błogosławieństwo. Stwórz bez oceniania, wyraź bez ograniczeń.',
    affirmation: 'Jestem wspierany i inspirowany przez kosmiczne siły twórcze przy każdym moim dziele.',
    area: 'transformacja',
    color: '#F472B6',
    actionGuidance: 'Poświęć godzinę na projekt twórczy który odkładałeś. Zacznij bez planu — pozwól płynąć.',
    lifeArea: 'Twórczość i inspiracja',
  },
  {
    number: '404',
    title: 'Anielska Kotwica',
    message: 'Zero między czwórkami tworzy unikalną kotwicę — Twoje anioły są nie tylko obecne, ale dosłownie zakorzenione w Twoim życiu. Uziemienie jest teraz kluczowe. Im głębiej zapuścisz korzenie, tym wyżej wzrośniesz.',
    affirmation: 'Jestem głęboko zakorzeniony i chroniony, gotowy wzrastać ku niebu bez lęku.',
    area: 'ochrona',
    color: '#34D399',
    actionGuidance: 'Stań boso na ziemi przez 5 minut (lub wyobraź sobie korzenie sięgające centrum Ziemi).',
    lifeArea: 'Uziemienie i ochrona',
  },
  {
    number: '505',
    title: 'Wolność przez Ciszę',
    message: 'Zmiana jest najpiękniejsza gdy zakorzeniona w spokoju. Nie musisz działać w chaosie — prawdziwa wolność rodzi się w ciszy między decyzjami. Zatrzymaj się, zanim zrobisz krok. Daj sobie przestrzeń na wybór.',
    affirmation: 'Wybieram wolność zakorzenioną w spokoju. Moje decyzje wypływają z centrum, nie z lęku.',
    area: 'transformacja',
    color: '#F97316',
    actionGuidance: 'Przed każdą decyzją dziś, weź 3 głębokie oddechy. Czy decyzja pochodzi ze strachu czy miłości?',
    lifeArea: 'Świadome zmiany',
  },
  {
    number: '606',
    title: 'Miłość Bezwarunkowa',
    message: 'Sześć jest liczbą miłości, a zero w centrum amplifikuje ją do nieskończoności. Ta sekwencja mówi: zacznij od kochania siebie bezwarunkowo — tylko wtedy możesz dawać i przyjmować miłość w pełni.',
    affirmation: 'Kocham siebie bezwarunkowo i ta miłość wypełnia wszystkie moje relacje.',
    area: 'miłość',
    color: '#F472B6',
    actionGuidance: 'Napisz 10 rzeczy za które kochasz siebie. Nie zasług — bycia.',
    lifeArea: 'Miłość własna i relacje',
  },
  {
    number: '707',
    title: 'Duchowy Przekaz',
    message: 'Silny sygnał od strażników mądrości — proszą Cię byś podzielił się tym co wiesz. Twoja historia, Twoje lekcje, Twoja mądrość mają leczyć innych. Nie zatrzymuj jej dla siebie.',
    affirmation: 'Moja mądrość jest cennym darem — dzielę się nią odważnie dla dobra innych.',
    area: 'misja',
    color: '#FBBF24',
    actionGuidance: 'Napisz post, list lub rozmowę gdzie dzielisz się czymś czego się nauczyłeś. Twój głos ma znaczenie.',
    lifeArea: 'Nauczanie i dzielenie mądrości',
  },
  {
    number: '808',
    title: 'Karmiczna Obfitość',
    message: 'Ósemka zamknięta w osi zerowej — to obfitość karmiczna. Dostajesz teraz plony dawno zasianych nasion. Być może nie pamiętasz kiedy je zasiałeś, ale Wszechświat dokładnie pamięta i płaci z nawiązką.',
    affirmation: 'Przyjmuję z wdzięcznością karmiczne plony mojej dobroci i wysiłku.',
    area: 'obfitość',
    color: '#34D399',
    actionGuidance: 'Pomyśl kto kiedyś Ci pomógł. Podziękuj tej osobie lub spłać dług dalej do innej osoby.',
    lifeArea: 'Karma i obfitość',
  },
  {
    number: '909',
    title: 'Służba i Nowy Cykl',
    message: 'Zakończenie (9) obramowane pustką zerową tworzy coś unikalnego — karmiczne zamknięcie z otwarciem na służbę wyższą. Jesteś gotowy na nowy poziom odpowiedzialności i wpływu na innych.',
    affirmation: 'Zamykam stary cykl i otwieram się na nowy poziom służby i wpływu.',
    area: 'misja',
    color: '#C084FC',
    actionGuidance: 'Zadaj sobie pytanie: jaką osobą chcę być w następnym rozdziale życia? Napisz opis.',
    lifeArea: 'Wyższa służba i misja',
  },
];

// ── SPECIAL SEQUENCES (SEKWENCJE PREMIOWANE) ─────────────────
type SpecialSeq = {
  seq: string;
  time: string;
  title: string;
  message: string;
  power: string;
  color: string;
};

const SPECIAL_SEQUENCES: SpecialSeq[] = [
  {
    seq: '11:11',
    time: '11:11',
    title: 'Brama Manifestacji',
    message: 'Najbardziej znana bramka — gdy zegar pokaże 11:11, zatrzymaj się na chwilę i wyślij jedno czyste życzenie. Portal jest otwarty przez 60 sekund. Twoje intencje mają teraz niezwykłą moc magnetyczną.',
    power: 'Manifestacja, przebudzenie, nowe początki',
    color: '#F59E0B',
  },
  {
    seq: '12:12',
    time: '12:12',
    title: 'Równoległa Ścieżka',
    message: 'Dwunastka to liczba kompletności cyklu — 12 miesięcy, 12 godzin, 12 apostołów. Gdy widzisz 12:12, Wszechświat potwierdza, że jesteś na właściwej ścieżce życiowej. Wszystko zmierza do spełnienia.',
    power: 'Kompletność, właściwa ścieżka, boska ochrona',
    color: '#38BDF8',
  },
  {
    seq: '22:22',
    time: '22:22',
    title: 'Architekt Rzeczywistości',
    message: 'Cztery dwójki to kod mistrzowski — jesteś w tym momencie architektem własnej rzeczywistości. To, co budujesz myślami i działaniami, materializuje się z podwójną siłą. Buduj mądrze.',
    power: 'Mistrzowska manifestacja, budowanie, trwałość',
    color: '#60A5FA',
  },
  {
    seq: '3:33',
    time: '3:33',
    title: 'Trójca Twórcza',
    message: 'Wzniosłe istoty cię obserwują i amplifikują Twoją energię twórczą. To czas ekspresji — wyraź siebie, stwórz coś, powiedz prawdę. Jesteś otoczony duchową ochroną i wsparciem.',
    power: 'Twórczość, ochrona duchowa, ekspansja',
    color: '#A78BFA',
  },
  {
    seq: '4:44',
    time: '4:44',
    title: 'Anielska Straż',
    message: 'Czwórki oznaczają anielskie wsparcie — jesteś otoczony przez anioły stróże z każdej strony. Nie musisz walczyć sam. Zaufaj i odpuść potrzebę kontroli. Pomoc nadchodzi.',
    power: 'Ochrona, wsparcie, uziemienie',
    color: '#34D399',
  },
  {
    seq: '5:55',
    time: '5:55',
    title: 'Wielka Zmiana',
    message: 'Pięć to energia zmian i wolności. Trójka piątek zapowiada transformację na poziomie życia. Coś znaczącego przychodzi — może to zmiana miejsca, pracy, relacji lub wewnętrzna rewolucja.',
    power: 'Zmiana, wolność, transformacja',
    color: '#F97316',
  },
  {
    seq: '0:00',
    time: '0:00',
    title: 'Północ — Reset Kosmiczny',
    message: 'Północ to moment, gdy czas symbolizuje nieskończoność. Zeros resetuje wszystko do stanu czystej możliwości. To idealna chwila na nową intencję, modlitwę lub rytuał nowego początku.',
    power: 'Reset, nieskończoność, nowe początki',
    color: '#E879F9',
  },
  {
    seq: '13:13',
    time: '13:13',
    title: 'Mistyczne Przejście',
    message: 'Trzynaście nie jest pechową liczbą — to liczba transformacji i księżycowych cykli. Widzisz ją jako potwierdzenie, że przechodzisz przez ważną przemianę. Nie bój się tego co się kończy.',
    power: 'Transformacja, zmiany, cykle',
    color: '#C084FC',
  },
  {
    seq: '10:10',
    time: '10:10',
    title: 'Nowy Cykl',
    message: '10:10 to kosmiczny restart — godzina gdy jedno zamknięcie i jedno otwarcie są doskonale zsynchronizowane. Każde zakończenie niesie w sobie nasiona nowego. Bądź gotowy zacząć coś świeżego z odwagą.',
    power: 'Nowy początek, zakończenie cyklu',
    color: '#FBBF24',
  },
  {
    seq: '21:12',
    time: '21:12',
    title: 'Lustrzany Portal',
    message: 'Palindrom czasu — 21:12. Lustrzana sekwencja oznacza że Twój zewnętrzny świat zaczyna odzwierciedlać Twoje wewnętrzne przebudzenie. To co siejesz wewnątrz, teraz kwitnie na zewnątrz.',
    power: 'Lustrzane odbicie, manifestacja wewnętrzna',
    color: '#818CF8',
  },
];

// ── NUMBER PATTERNS ────────────────────────────────────────────
type NumberPattern = {
  pattern: string;
  name: string;
  awakening: string;
  color: string;
  icon: string;
};

const NUMBER_PATTERNS: NumberPattern[] = [
  {
    pattern: '1234',
    name: 'Sekwencja Wstępująca',
    awakening: 'Krok po kroku wspinasz się ku swojemu celowi. Każda cyfra symbolizuje kolejny etap manifestacji: intencja (1), gestation (2), ekspresja (3), fundamenty (4). Jesteś dokładnie tam gdzie powinieneś być.',
    color: '#34D399',
    icon: '📈',
  },
  {
    pattern: '4321',
    name: 'Sekwencja Zstępująca',
    awakening: 'Czas na gruntowanie wzniosłych idei w praktyczną rzeczywistość. Zejdź z głowy do serca (4→3), z serca do działania (3→2), z działania do fundamentów (2→1). Ucieleśnij swoje marzenia.',
    color: '#60A5FA',
    icon: '📉',
  },
  {
    pattern: '1212',
    name: 'Rytm Dualizmu',
    awakening: 'Naprzemienność jest boskością w ruchu. Yin i Yang, dawanie i przyjmowanie, działanie i odpoczynek. Ten rytm jest Twoim kluczem do harmonii. Nie walcz z żadnym z biegunów.',
    color: '#38BDF8',
    icon: '☯️',
  },
  {
    pattern: '1122',
    name: 'Nowy Fundament',
    awakening: 'Nowe początki (11) budują trwałe fundamenty (22). Twoje przebudzenie nie jest chwilowe — wbudujesz je w strukturę swojego codziennego życia. To przebudzenie ma zostać na stałe.',
    color: '#FBBF24',
    icon: '🏗️',
  },
  {
    pattern: '1133',
    name: 'Twórcze Przebudzenie',
    awakening: 'Mistrzowskie przebudzenie (11) połączone z ekspansją twórczą (33) tworzy kanał dla najwyższej ekspresji. Jesteś powołany do tworzenia czegoś, co zmieni innych ludzi. Nie bój się swojej mocy.',
    color: '#F472B6',
    icon: '🎨',
  },
  {
    pattern: '2121',
    name: 'Boski Taniec',
    awakening: 'Dwójka i jedynka tańczą razem — relacje i misja, inni i Ty, partnerstwo i indywidualność. Nie musisz wybierać. Gdy Twoje relacje wspierają Twoją misję i odwrotnie, jesteś w doskonałej synchronii.',
    color: '#A78BFA',
    icon: '💃',
  },
  {
    pattern: '3636',
    name: 'Ziemska Trójca',
    awakening: 'Twórczość (3) i harmonia (6) w parze tworzą kosmiczną równowagę: piękno dla ducha i materialnej rzeczywistości. Czas tworzyć coś co jest zarówno duchowo głębokie jak i praktycznie użyteczne.',
    color: '#FB923C',
    icon: '⚖️',
  },
  {
    pattern: '9191',
    name: 'Wieczny Cykl',
    awakening: 'Zakończenie (9) i przebudzenie (1) w niekończącej się pętli — śmierć i odrodzenie, koniec i nowy początek. Twoja dusza rozumie cykliczną naturę wszystkiego. Nie trać się w żałobie; odrodzenie jest nieuniknione.',
    color: '#C084FC',
    icon: '🔄',
  },
];

// ── GUARDIAN ANGEL NUMBER DESCRIPTIONS ────────────────────────
const GUARDIAN_DESCRIPTIONS: Record<number, { title: string; power: string; message: string; color: string }> = {
  1:  { title: 'Pionier Duszy',       power: 'Liderstwo, inicjatywa, odwaga',         message: 'Twój anioł stróż nosi energię nowych początków i odważnych kroków. Prowadzi Cię ku samodzielnemu wyrażaniu siebie i przewodzeniu innym przez własny przykład.',              color: '#F59E0B' },
  2:  { title: 'Harmonizator',        power: 'Równowaga, intuicja, dyplomacja',        message: 'Twój anioł stróż jest mistrzem subtelności i harmonii. Pomaga Ci widzieć wszystkie strony medalu i tworzyć mosty między ludźmi i ideami.',                                  color: '#60A5FA' },
  3:  { title: 'Twórczy Kanał',       power: 'Ekspresja, radość, kreatywność',         message: 'Twój anioł stróż jest czystą twórczą energią — sprawa muzy, inspiratora, artysty. Każdy Twój wyraz artystyczny jest poświęcony i wzmacniany przez to połączenie.',       color: '#F472B6' },
  4:  { title: 'Budowniczy Świątyń',  power: 'Fundament, dyscyplina, trwałość',        message: 'Twój anioł stróż buduje razem z Tobą trwałe struktury. Jest architektem Twojego bezpieczeństwa i przewodnikiem w budowaniu czegoś pięknego i trwałego.',                  color: '#34D399' },
  5:  { title: 'Posłaniec Wolności',  power: 'Przygoda, zmiana, niezależność',         message: 'Twój anioł stróż ucieleśnia wolność absolutną. Towarzyszy Ci w każdej przygodzie, wspiera zmiany i chroni Cię gdy porzucasz stare dla nowego.',                          color: '#F97316' },
  6:  { title: 'Stróż Miłości',       power: 'Miłość, harmonia, uzdrowienie',          message: 'Twój anioł stróż jest strażnikiem Twojego serca. Przynosi uzdrowienie do Twoich relacji i przypomina że miłość — do siebie i innych — jest najwyższą siłą.',            color: '#FB7185' },
  7:  { title: 'Strażnik Mądrości',   power: 'Intuicja, mistycyzm, poszukiwanie',      message: 'Twój anioł stróż jest starożytną istotą mądrości. Prowadzi Cię w głąb Twoich wewnętrznych wymiarów, otwierając drzwi do wiedzy zarezerwowanej dla wtajemniczonych.',   color: '#FBBF24' },
  8:  { title: 'Kosmiczny Bankier',   power: 'Obfitość, siła, sprawiedliwość',         message: 'Twój anioł stróż zarządza karmicznym przepływem obfitości w Twoim życiu. Jest arbitrem kosmicznej sprawiedliwości i gwarantem że Twój wysiłek jest nagradzany.',         color: '#A3E635' },
  9:  { title: 'Uzdrowiciel Dusz',    power: 'Służba, współczucie, transcendencja',    message: 'Twój anioł stróż jest starodawnym uzdrowicielem. Przynosi głębię i współczucie do Twojej ścieżki, prowadząc Cię ku służbie i wyższemu sensowi istnienia.',              color: '#C084FC' },
  11: { title: 'Iluminator',          power: 'Duchowe przebudzenie, misja, telepatia', message: 'Masz mistrzową liczbę 11 jako opiekuna — istotę przebudzenia i iluminacji. Twoja dusza jest tu z misją do spełnienia na dużą skalę.',                                    color: '#F59E0B' },
  22: { title: 'Mistrz Budowniczy',   power: 'Misja globalna, architekt rzeczywistości', message: 'Mistrzowa liczba 22 to najpotężniejszy budowniczy. Jesteś tu aby tworzyć struktury (fizyczne lub energetyczne) które służą tysiącom.',                                   color: '#38BDF8' },
  33: { title: 'Mistrz Nauczyciel',   power: 'Przebudzenie kolektywne, miłość kosmiczna', message: 'Mistrzowa liczba 33 — Mistrz Nauczyciel. Twoje życie jest nauczaniem przez bycie. Twoja miłość i mądrość mogą dosłownie podnosić wibracje całych społeczności.',        color: '#F472B6' },
};

// ── JOURNAL LOG TYPE ──────────────────────────────────────────
type AngelSighting = {
  id: string;
  number: string;
  context: string;
  location: string;
  timestamp: string;
};

const GUIDE_TIPS = [
  { icon: '👁', title: 'Zwróć uwagę', body: 'Anielskie liczby pojawiają się na zegarach, tablicach, paragonach. Gdy je widzisz, zatrzymaj się i zapytaj: co teraz czuję lub myślę?' },
  { icon: '📔', title: 'Zapisuj synchroniczności', body: 'Prowadź dziennik spotkań z liczbami. Wzorce ujawniają się dopiero po czasie, gdy patrzysz wstecz na kilka tygodni.' },
  { icon: '🌬', title: 'Oddychaj i pytaj', body: 'Każdą odpowiedź otrzymujesz przez intuicję. Weź trzy głębokie oddechy, zamknij oczy i pozwól pierwszemu odczuciu do Ciebie przemówić.' },
  { icon: '💛', title: 'Wdzięczność jako odpowiedź', body: 'Gdy otrzymasz przekaz, podziękuj. Wdzięczność tworzy pętlę sprzężenia zwrotnego z wymiarem aniołów — przyciąga kolejne wskazówki.' },
  { icon: '🔢', title: 'Redukuj do cyfry', body: 'Każdą liczbę możesz zredukować do cifry podstawowej dodając cyfry. 1234 → 1+2+3+4 = 10 → 1+0 = 1. Znajdziesz jej podstawową energię.' },
  { icon: '🌙', title: 'Zapisuj po przebudzeniu', body: 'Liczby widziane zaraz po przebudzeniu lub tuż przed snem są szczególnie znaczące — jesteś bliżej wymiaru anielskiego.' },
];

// ── HELPERS ───────────────────────────────────────────────────
const reduceDateToAngelNumber = (date: Date): { raw: number; reduced: number } => {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  let raw = d + m + y;
  const reduceNum = (n: number): number => {
    while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
      n = String(n).split('').reduce((a, b) => a + Number(b), 0);
    }
    return n;
  };
  const digSum = String(d).split('').reduce((a, b) => a + Number(b), 0)
    + String(m).split('').reduce((a, b) => a + Number(b), 0)
    + String(y).split('').reduce((a, b) => a + Number(b), 0);
  return { raw, reduced: reduceNum(digSum) };
};

const getDayNumberEntry = (reduced: number): AngelNumber | null => {
  const num = String(reduced);
  return ANGEL_NUMBERS.find(a => a.number === num) || ANGEL_NUMBERS.find(a => a.number === '777') || null;
};

const getCalcInterpretation = (n: number): AngelNumber | null => {
  const exact = ANGEL_NUMBERS.find(a => a.number === String(n));
  if (exact) return exact;
  let r = n;
  while (r > 9 && r !== 11 && r !== 22 && r !== 33) {
    r = String(r).split('').reduce((a, b) => a + Number(b), 0);
  }
  return ANGEL_NUMBERS.find(a => a.number === String(r)) || null;
};

const calcGuardianNumber = (birthDate: string): number => {
  if (!birthDate) return 1;
  const digits = birthDate.replace(/[^0-9]/g, '').split('').map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split('').reduce((a, b) => a + Number(b), 0);
  }
  return sum;
};

const WEEKDAY_PL = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

// ── SACRED GEOMETRY SVG BACKGROUND ────────────────────────────
const SacredGeoBg = ({ color, size = 200 }: { color: string; size?: number }) => {
  const cx = size / 2;
  const r1 = size * 0.38;
  const r2 = size * 0.26;
  const r3 = size * 0.14;
  const pts = (r: number, n: number, offset = 0) =>
    Array.from({ length: n }, (_, i) => {
      const angle = (i * 2 * Math.PI) / n + offset;
      return `${cx + r * Math.cos(angle)},${cx + r * Math.sin(angle)}`;
    }).join(' ');
  return (
    <Svg width={size} height={size} style={{ position: 'absolute', opacity: 0.18 }}>
      <Circle cx={cx} cy={cx} r={r1} stroke={color} strokeWidth={0.8} fill="none" />
      <Circle cx={cx} cy={cx} r={r2} stroke={color} strokeWidth={0.8} fill="none" />
      <Circle cx={cx} cy={cx} r={r3} stroke={color} strokeWidth={0.8} fill="none" />
      <Polygon points={pts(r1, 6)} stroke={color} strokeWidth={0.7} fill="none" />
      <Polygon points={pts(r1, 6, Math.PI / 6)} stroke={color} strokeWidth={0.7} fill="none" />
      <Polygon points={pts(r2, 3, -Math.PI / 2)} stroke={color} strokeWidth={0.7} fill="none" />
      <Polygon points={pts(r2, 3, Math.PI / 6)} stroke={color} strokeWidth={0.7} fill="none" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <Line key={i}
            x1={cx + r3 * Math.cos(a)} y1={cx + r3 * Math.sin(a)}
            x2={cx + r1 * Math.cos(a)} y2={cx + r1 * Math.sin(a)}
            stroke={color} strokeWidth={0.5}
          />
        );
      })}
    </Svg>
  );
};

// ── ANIMATED NUMBER DISPLAY ────────────────────────────────────
const FloatingNumberDisplay = ({ entry, isLight }: { entry: AngelNumber; isLight?: boolean }) => {
  const floatY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);

  React.useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2200 }),
        withTiming(8, { duration: 2200 }),
      ),
      -1,
      true,
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1800 }),
        withTiming(0.3, { duration: 1800 }),
      ),
      -1,
      true,
    );
  }, [entry.number]);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
  const glowStyle  = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  return (
    <View style={{ alignItems: 'center', marginVertical: 16, position: 'relative' }}>
      <SacredGeoBg color={entry.color} size={220} />
      {/* outer glow ring */}
      <Animated.View style={[{
        width: 180, height: 180, borderRadius: 90, position: 'absolute',
        backgroundColor: entry.color + '18',
        borderWidth: 1.5, borderColor: entry.color + '50',
      }, glowStyle]} />
      {/* number float */}
      <Animated.View style={[{ alignItems: 'center', justifyContent: 'center', width: 160, height: 160 }, floatStyle]}>
        <LinearGradient
          colors={[entry.color + 'EE', entry.color + '99', entry.color + '44']}
          style={{ width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: entry.color + 'CC' }}
          start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        >
          <Text style={{ fontSize: entry.number.length > 3 ? 38 : 52, fontWeight: '900', color: isLight ? 'rgba(37,29,22,0.90)' : '#fff', letterSpacing: -2 }}>
            {entry.number}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: isLight ? 'rgba(37,29,22,0.85)' : 'rgba(255,255,255,0.85)', letterSpacing: 0.5, marginTop: 2 }}>
            {entry.title}
          </Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// ── PULSING ORB ───────────────────────────────────────────────
const PulsingOrb = () => (
  <View style={{ alignItems: 'center', marginVertical: 8 }}>
    <View style={{ width: 110, height: 110, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', width: 110, height: 110, borderRadius: 55,
        backgroundColor: ACCENT + '18', borderWidth: 1, borderColor: ACCENT + '40',
      }} />
      <View style={{
        position: 'absolute', width: 78, height: 78, borderRadius: 39,
        backgroundColor: ACCENT + '28', borderWidth: 1, borderColor: ACCENT + '60',
      }} />
      <LinearGradient
        colors={['#FDE68A', ACCENT, '#D97706']}
        style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}
      >
        <Hash size={22} color="#fff" />
      </LinearGradient>
    </View>
  </View>
);

// ── SCREEN ────────────────────────────────────────────────────
export const AngelNumbersScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
  const insets = useSafeAreaInsets();
  const textColor   = isLight ? '#1A1410' : '#F5F1EA';
  const subColor    = isLight ? '#6A5A48' : '#B0A393';
  const cardBg      = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const cardBorder  = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.10)';
  const dividerColor = 'rgba(128,128,128,0.12)';

  const [inputNumber, setInputNumber]   = useState('');
  const [activeNumber, setActiveNumber] = useState<AngelNumber | null>(null);
  const [notFound, setNotFound]         = useState(false);
  const [recentNumbers, setRecentNumbers] = useState<string[]>([]);
  const [activeTab, setActiveTab]       = useState<'oracle' | 'encyclopedia' | 'journal' | 'personal'>('oracle');

  // Calculator state
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState<{ entry: AngelNumber; reduced: number; original: number } | null>(null);

  // AI state
  const [aiMessage, setAiMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // AI affirmation per number
  const [affLoading, setAffLoading] = useState(false);
  const [affResult, setAffResult]   = useState('');
  const [affTarget, setAffTarget]   = useState<AngelNumber | null>(null);

  // Special sequences expanded
  const [expandedSeq, setExpandedSeq] = useState<string | null>(null);

  // Encyclopedia filter
  const [encSearch, setEncSearch] = useState('');
  const [encArea,   setEncArea]   = useState<string | null>(null);
  const [expandedEnc, setExpandedEnc] = useState<string | null>(null);

  // Journal / sightings
  const [sightings, setSightings] = useState<AngelSighting[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addNum,  setAddNum]  = useState('');
  const [addCtx,  setAddCtx]  = useState('');
  const [addLoc,  setAddLoc]  = useState('');
  const [journalFilter, setJournalFilter] = useState<string | null>(null);

  // Personal analysis
  const [guardianNum,   setGuardianNum]   = useState<number | null>(null);
  const [guardianEntry, setGuardianEntry] = useState<typeof GUARDIAN_DESCRIPTIONS[number] | null>(null);
  const [personalAiMsg, setPersonalAiMsg] = useState('');
  const [personalAiLoading, setPersonalAiLoading] = useState(false);
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  const isFav = isFavoriteItem('angel-numbers');

  // Today's day number
  const today = useMemo(() => new Date(), []);
  const { reduced: todayNumber } = useMemo(() => reduceDateToAngelNumber(today), [today]);
  const todayEntry = useMemo(() => getDayNumberEntry(todayNumber), [todayNumber]);

  // Last 7 days calendar pattern
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const { reduced } = reduceDateToAngelNumber(d);
      const entry = getDayNumberEntry(reduced);
      return { date: d, reduced, entry, isToday: i === 6 };
    });
  }, [today]);

  // Filtered encyclopedia
  const filteredEnc = useMemo(() => {
    return ANGEL_NUMBERS.filter(a => {
      const matchSearch = !encSearch || a.number.includes(encSearch) || a.title.toLowerCase().includes(encSearch.toLowerCase());
      const matchArea   = !encArea  || a.area === encArea;
      return matchSearch && matchArea;
    });
  }, [encSearch, encArea]);

  // Journal stats
  const sightingFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    sightings.forEach(s => { freq[s.number] = (freq[s.number] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [sightings]);

  const filteredSightings = useMemo(() => {
    if (!journalFilter) return sightings;
    return sightings.filter(s => s.number === journalFilter);
  }, [sightings, journalFilter]);

  // Guardian number calc on mount / when birthDate changes
  React.useEffect(() => {
    if (userData?.birthDate) {
      const gn = calcGuardianNumber(userData.birthDate);
      setGuardianNum(gn);
      setGuardianEntry(GUARDIAN_DESCRIPTIONS[gn] || GUARDIAN_DESCRIPTIONS[1]);
    }
  }, [userData?.birthDate]);

  const toggleFav = useCallback(() => {
    HapticsService.notify();
    if (isFav) {
      removeFavoriteItem('angel-numbers');
    } else {
      addFavoriteItem({
        id: 'angel-numbers',
        label: 'Liczby Anielskie',
        route: 'AngelNumbers',
        params: {},
        icon: 'Hash',
        color: ACCENT,
        addedAt: new Date().toISOString(),
      });
    }
  }, [isFav, addFavoriteItem, removeFavoriteItem]);

  const handleSearch = useCallback((query?: string) => {
    const q = (query ?? inputNumber).trim();
    if (!q) return;
    HapticsService.notify();
    const found = ANGEL_NUMBERS.find(n => n.number === q);
    setActiveNumber(found ?? null);
    setNotFound(!found);
    if (found) {
      setRecentNumbers(prev => {
        const filtered = prev.filter(r => r !== q);
        return [q, ...filtered].slice(0, 5);
      });
    }
    setActiveTab('oracle');
  }, [inputNumber]);

  const handleChipTap = useCallback((num: string) => {
    setInputNumber(num);
    handleSearch(num);
  }, [handleSearch]);

  const handleCalc = useCallback(() => {
    const n = parseInt(calcInput.trim(), 10);
    if (isNaN(n) || n < 0 || n > 9999) return;
    HapticsService.notify();
    const entry = getCalcInterpretation(n);
    let reduced = n;
    while (reduced > 9 && reduced !== 11 && reduced !== 22 && reduced !== 33) {
      reduced = String(reduced).split('').reduce((a, b) => a + Number(b), 0);
    }
    if (entry) setCalcResult({ entry, reduced, original: n });
  }, [calcInput]);

  const handleAiMessage = useCallback(async () => {
    if (aiLoading || !todayEntry) return;
    setAiLoading(true);
    setAiMessage('');
    try {
      const name = userData?.name?.trim() || '';
      const lifePath = userData?.lifePathNumber || '';
      const prompt = i18n.language?.startsWith('en')
        ? `You are an angelic messenger. Write a deep personal message from the angels to ${name || 'a seeking soul'}.

Today's angel number: ${todayNumber} — "${todayEntry.title}".
${lifePath ? `This person's life path number: ${lifePath}.` : ''}
Date: ${formatLocaleDate(today)}.

The message should:
- Be addressed directly to the recipient
- Link the energy of today's number with their personal context
- Include concrete guidance for today
- End with a sentence of love and support from the angels
- Be 4-5 sentences long — poetic, warm and deep

Write only the message itself, with no intro or heading.`
        : `Jesteś aniołem posłańcem. Napisz w języku użytkownika głęboką osobistą wiadomość od aniołów do ${name || 'poszukującej duszy'}.

Dzisiejsza liczba anielska dnia: ${todayNumber} — "${todayEntry.title}".
${lifePath ? `Liczba ścieżki życia tej osoby: ${lifePath}.` : ''}
Data: ${formatLocaleDate(today)}.

Wiadomość powinna:
- Być bezpośrednio zaadresowana do odbiorcy (używaj "Ty", "Twój")
- Łączyć energię liczby dnia z kontekstem osobistym
- Zawierać konkretne wskazówki na dziś
- Kończyć się zdaniem miłości i wsparcia od aniołów
- Mieć 4-5 zdań — poetycka, ciepła, głęboka

Pisz tylko samą wiadomość, bez wstępów ani nagłówków.`;
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }], i18n.language?.startsWith('en') ? 'en' : 'pl');
      setAiMessage(result);
    } catch {
      setAiMessage('Anioły otaczają Cię dziś miłością i spokojem. Liczba dnia jest Twoim przewodnikiem — ufaj jej przesłaniu z całego serca.');
    } finally {
      setAiLoading(false);
    }
  }, [aiLoading, todayEntry, todayNumber, today, userData]);

  const handleAiAffirmation = useCallback(async (entry: AngelNumber) => {
    if (affLoading) return;
    setAffLoading(true);
    setAffResult('');
    setAffTarget(entry);
    try {
      const name = userData?.name?.trim() || '';
      const prompt = i18n.language?.startsWith('en')
        ? `Write one powerful affirmation, maximum two sentences, for ${name || 'the practitioner'} in the context of angel number ${entry.number} — "${entry.title}".

Energy of this number: ${entry.area}. Life area: ${entry.lifeArea || entry.area}.
Message: ${entry.message.slice(0, 120)}...

The affirmation should:
- Start with "I am", "I have", "I choose" or "I create"
- Stay in present tense and positive framing
- Resonate with the energy of this specific number
- Feel personal, deep and poetic

Write only the affirmation itself.`
        : `Napisz w języku użytkownika jedną potężną afirmację (maksymalnie 2 zdania) dla osoby ${name || 'praktykującej'} w kontekście anielskiej liczby ${entry.number} — "${entry.title}".

Energia tej liczby: ${entry.area}. Obszar życia: ${entry.lifeArea || entry.area}.
Przesłanie: ${entry.message.slice(0, 120)}...

Afirmacja powinna:
- Zaczynać się od "Ja jestem", "Ja mam", "Ja wybieram" lub "Ja tworzę"
- Być w czasie teraźniejszym i pozytywna
- Rezonować z energią tej konkretnej liczby
- Być osobista, głęboka, poetycka

Pisz tylko samą afirmację bez dodatkowego tekstu.`;
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }], i18n.language?.startsWith('en') ? 'en' : 'pl');
      setAffResult(result);
    } catch {
      setAffResult(entry.affirmation);
    } finally {
      setAffLoading(false);
    }
  }, [affLoading, userData]);

  const handlePersonalAi = useCallback(async () => {
    if (personalAiLoading || !guardianEntry || !guardianNum) return;
    setPersonalAiLoading(true);
    setPersonalAiMsg('');
    try {
      const name = userData?.name?.trim() || '';
      const zodiac = userData?.zodiacSign || '';
      const prompt = i18n.language?.startsWith('en')
        ? `Write a deep personal angelic message for ${name || 'the soul'} whose guardian angel number is ${guardianNum} — "${guardianEntry.title}".

${zodiac ? `Zodiac sign: ${zodiac}.` : ''}
Power of the number: ${guardianEntry.power}.
Birth date: ${userData?.birthDate || 'unknown'}.

The message should:
- Describe this soul's unique mission on Earth
- Explain how the guardian angel of number ${guardianNum} supports this person
- Include the life areas where this number has the greatest influence
- End with blessing and encouragement
- Be 5-6 sentences long — mystical, poetic and deeply personal

Write only the message itself.`
        : `Napisz w języku użytkownika głęboki, osobisty przekaz anielski dla ${name || 'duszy'} której liczbą anioła stróża jest ${guardianNum} — "${guardianEntry.title}".

${zodiac ? `Znak zodiaku: ${zodiac}.` : ''}
Moc liczby: ${guardianEntry.power}.
Data urodzenia: ${userData?.birthDate || 'nieznana'}.

Przekaz powinien:
- Opisać unikalną misję tej duszy na Ziemi
- Wyjaśnić w jaki sposób anioł stróż z liczbą ${guardianNum} wspiera tę osobę
- Zawierać konkretne obszary życia gdzie ta liczba ma największy wpływ
- Zakończyć się błogosławieństwem i zachętą
- Mieć 5-6 zdań — mistyczny, poetycki, głęboko osobisty

Pisz tylko sam przekaz.`;
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }], i18n.language?.startsWith('en') ? 'en' : 'pl');
      setPersonalAiMsg(result);
    } catch {
      setPersonalAiMsg(`Twój anioł stróż o liczbie ${guardianNum} towarzyszy Ci od pierwszego oddechu. ${guardianEntry.message} Zaufaj tej kosmicznej obecności.`);
    } finally {
      setPersonalAiLoading(false);
    }
  }, [personalAiLoading, guardianEntry, guardianNum, userData]);

  const handleAddSighting = useCallback(() => {
    if (!addNum.trim()) return;
    HapticsService.notify();
    const newSighting: AngelSighting = {
      id: Date.now().toString(),
      number: addNum.trim(),
      context: addCtx.trim(),
      location: addLoc.trim(),
      timestamp: new Date().toISOString(),
    };
    setSightings(prev => [newSighting, ...prev]);
    setAddNum(''); setAddCtx(''); setAddLoc('');
    setShowAddModal(false);
  }, [addNum, addCtx, addLoc]);

  const handleDeleteSighting = useCallback((id: string) => {
    Alert.alert(t('angelNumbers.usun_zapis', 'Usuń zapis'), t('angelNumbers.czy_chcesz_usunac_ten_wpis', 'Czy chcesz usunąć ten wpis z dziennika?'), [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => setSightings(prev => prev.filter(s => s.id !== id)) },
    ]);
  }, []);

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'oracle',       label: 'Oracle'      },
    { key: 'encyclopedia', label: 'Encyklopedia' },
    { key: 'journal',      label: 'Dziennik'    },
    { key: 'personal',     label: 'Mój Anioł'   },
  ];

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={[an.root, {}]} edges={['top']}>

      <LinearGradient
        colors={isLight
          ? ['#FFFBEB', currentTheme.background, currentTheme.background]
          : ['#100B00', currentTheme.background, currentTheme.background]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* HEADER */}
      <View style={an.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={an.headerBtn} hitSlop={20}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[an.headerTitle, { color: ACCENT }]}>{t('angelNumbers.liczby_anielskie', '✦ LICZBY ANIELSKIE')}</Text>
          <Text style={[an.headerSub, { color: subColor }]}>{t('angelNumbers.odczytaj_swoj_przekaz', 'Odczytaj swój przekaz')}</Text>
        </View>
        <Pressable onPress={toggleFav} style={an.headerBtn} hitSlop={20}>
          <Star size={20} color={ACCENT} fill={isFav ? ACCENT : 'transparent'} />
        </Pressable>
      </View>

      {/* TAB BAR */}
      <View style={[an.tabBar, { borderBottomColor: cardBorder }]}>
        {tabs.map(t => (
          <Pressable key={t.key} onPress={() => setActiveTab(t.key)} style={an.tabItem}>
            <Text style={[an.tabLabel, { color: activeTab === t.key ? ACCENT : subColor }]}>
              {t.label}
            </Text>
            {activeTab === t.key && <View style={[an.tabUnderline, { backgroundColor: ACCENT }]} />}
          </Pressable>
        ))}
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 56}
      >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ══════════════════════════════════════════════════════
            ORACLE TAB
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'oracle' && (
          <Animated.View entering={FadeInDown.duration(400)}>

            {/* Animated number display when a number is selected */}
            {activeNumber ? (
              <Animated.View entering={FadeInDown.duration(500)}>
                <FloatingNumberDisplay entry={activeNumber} isLight={isLight} />
              </Animated.View>
            ) : (
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <PulsingOrb />
                <Text style={[an.poem, { color: subColor }]}>
                  {'Liczby to język aniołów —\nkażda sekwencja jest szeptem Wszechświata\nprzemawiającego wprost do Twojej duszy.'}
                </Text>
              </View>
            )}

            {/* LICZBA DNI */}
            {todayEntry && (
              <Animated.View entering={FadeInDown.delay(40).duration(400)}>
                <LinearGradient
                  colors={[todayEntry.color + 'CC', todayEntry.color + '55', todayEntry.color + '22']}
                  style={[an.dayNumberCard, { borderColor: todayEntry.color + '80' }]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <View style={an.dayNumberHeader}>
                    <Calendar size={14} color="rgba(255,255,255,0.80)" />
                    <Text style={[an.dayNumberLabel, isLight && { color: 'rgba(37,29,22,0.72)' }]}>
                      {(() => { const MN = ['STYCZNIA','LUTEGO','MARCA','KWIETNIA','MAJA','CZERWCA','LIPCA','SIERPNIA','WRZEŚNIA','PAŹDZIERNIKA','LISTOPADA','GRUDNIA']; return `PRZEKAZ DNIA — ${today.getDate()} ${MN[today.getMonth()]}`; })()}
                    </Text>
                  </View>
                  <Text style={[an.dayNumberMain, isLight && { color: 'rgba(37,29,22,0.90)' }]}>{todayNumber}</Text>
                  <Text style={[an.dayNumberTitle, isLight && { color: 'rgba(37,29,22,0.90)' }]}>{todayEntry.title}</Text>
                  <View style={[an.areaBadge, { backgroundColor: AREA_COLORS[todayEntry.area] + '30', borderColor: AREA_COLORS[todayEntry.area] + '70', alignSelf: 'center', marginBottom: 10 }]}>
                    <Sparkles size={12} color={AREA_COLORS[todayEntry.area]} style={{ marginRight: 4 }} />
                    <Text style={[an.areaBadgeText, { color: AREA_COLORS[todayEntry.area] }]}>{todayEntry.area.toUpperCase()}</Text>
                  </View>
                  <Text style={[an.dayNumberMessage, isLight && { color: 'rgba(37,29,22,0.88)' }]}>{todayEntry.message}</Text>

                  {/* Action guidance for today */}
                  {todayEntry.actionGuidance && (
                    <View style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 12, width: '100%', marginBottom: 12 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: isLight ? 'rgba(37,29,22,0.60)' : 'rgba(255,255,255,0.65)', marginBottom: 5 }}>{t('angelNumbers.dzialanie_na_dzis', 'DZIAŁANIE NA DZIŚ')}</Text>
                      <Text style={{ fontSize: 13, lineHeight: 20, color: isLight ? 'rgba(37,29,22,0.90)' : 'rgba(255,255,255,0.90)' }}>{todayEntry.actionGuidance}</Text>
                    </View>
                  )}

                  {/* Chakra connection */}
                  {CHAKRA_MAP[todayNumber] && (
                    <View style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.10)', borderRadius: 14, padding: 12, width: '100%', marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: CHAKRA_MAP[todayNumber].color + '44', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={14} color={CHAKRA_MAP[todayNumber].color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: isLight ? 'rgba(37,29,22,0.60)' : 'rgba(255,255,255,0.65)' }}>{t('angelNumbers.czakra', 'CZAKRA')}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: CHAKRA_MAP[todayNumber].color }}>
                          {CHAKRA_MAP[todayNumber].name} · {CHAKRA_MAP[todayNumber].sanskrit}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={[an.affirmBox, { backgroundColor: isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.12)' }]}>
                    <Text style={[an.affirmLabel, isLight && { color: 'rgba(37,29,22,0.55)' }]}>{t('angelNumbers.afirmacja_dnia', 'AFIRMACJA DNIA')}</Text>
                    <Text style={[an.affirmText, isLight && { color: 'rgba(37,29,22,0.90)' }]}>"{todayEntry.affirmation}"</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* WIADOMOŚĆ OD ANIOŁÓW (AI) */}
            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={{ marginTop: 16 }}>
              <View style={[an.sectionCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                <View style={an.sectionHead}>
                  <MessageCircle size={14} color={ACCENT} />
                  <Text style={[an.sectionTitle, { color: ACCENT }]}>{t('angelNumbers.wiadomosc_od_aniolow', '💌 WIADOMOŚĆ OD ANIOŁÓW')}</Text>
                </View>
                <Text style={[an.sectionDesc, { color: subColor }]}>
                  {t('angelNumbers.spersonali_wiadomosc_laczaca_twoja_', 'Spersonalizowana wiadomość łącząca Twoją liczbę dnia z indywidualną ścieżką.')}
                </Text>
                {aiMessage ? (
                  <Animated.View entering={FadeInUp.duration(500)}>
                    <Text style={[an.aiMessageText, { color: textColor }]}>{aiMessage}</Text>
                    <Pressable onPress={() => setAiMessage('')} style={[an.aiClearRow, { borderTopColor: dividerColor }]}>
                      <Text style={[an.aiClearText, { color: subColor }]}>{t('angelNumbers.wyczysc', 'Wyczyść')}</Text>
                    </Pressable>
                  </Animated.View>
                ) : null}
                <Pressable
                  onPress={handleAiMessage}
                  disabled={aiLoading}
                  style={[an.aiBtn, { backgroundColor: ACCENT + (aiLoading ? '30' : '15'), borderColor: ACCENT + '44' }]}
                >
                  <Sparkles size={14} color={ACCENT} />
                  <Text style={[an.aiBtnText, { color: ACCENT }]}>
                    {aiLoading ? 'Anioły piszą...' : aiMessage ? 'Nowa wiadomość' : 'Odbierz wiadomość AI'}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* KALKULATOR */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ marginTop: 16 }}>
              <View style={[an.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={an.sectionHead}>
                  <Zap size={14} color={ACCENT} />
                  <Text style={[an.sectionTitle, { color: ACCENT }]}>{t('angelNumbers.kalkulator_liczby', '🔢 KALKULATOR LICZBY')}</Text>
                </View>
                <Text style={[an.sectionDesc, { color: subColor }]}>
                  {t('angelNumbers.wpisz_dowolna_liczbe_od_1', 'Wpisz dowolną liczbę od 1 do 9999 — Aethera zredukuje ją i odczyta jej anielskie przesłanie.')}
                </Text>
                <View style={[an.searchRow, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)', borderColor: cardBorder }]}>
                  <Hash size={16} color={ACCENT} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[an.searchInput, { color: textColor, flex: 1 }]}
                    placeholder={t('angelNumbers.np_2024_369_108', 'Np. 2024, 369, 108…')}
                    placeholderTextColor={subColor}
                    value={calcInput}
                    onChangeText={v => { setCalcInput(v.replace(/[^0-9]/g, '')); setCalcResult(null); }}
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={handleCalc}
                  />
                  <Pressable onPress={handleCalc} style={[an.searchBtn, { backgroundColor: ACCENT }]}>
                    <Search size={14} color="#fff" />
                  </Pressable>
                </View>
                {calcResult && (
                  <Animated.View entering={FadeInUp.duration(400)} style={{ marginTop: 12 }}>
                    <LinearGradient
                      colors={[calcResult.entry.color + 'AA', calcResult.entry.color + '33']}
                      style={[an.calcResultCard, { borderColor: calcResult.entry.color + '66' }]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                      {calcResult.original !== calcResult.reduced && (
                        <Text style={[an.calcReduceText, isLight && { color: 'rgba(37,29,22,0.70)' }]}>{calcResult.original} → {calcResult.reduced}</Text>
                      )}
                      <Text style={[an.calcNumber, isLight && { color: 'rgba(37,29,22,0.90)' }]}>{calcResult.reduced}</Text>
                      <Text style={[an.calcTitle, isLight && { color: 'rgba(37,29,22,0.90)' }]}>{calcResult.entry.title}</Text>
                      <Text style={[an.calcMessage, isLight && { color: 'rgba(37,29,22,0.88)' }]}>{calcResult.entry.message}</Text>
                      <View style={[an.affirmBox, { backgroundColor: isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.12)' }]}>
                        <Text style={[an.affirmLabel, isLight && { color: 'rgba(37,29,22,0.55)' }]}>{t('angelNumbers.afirmacja', 'AFIRMACJA')}</Text>
                        <Text style={[an.affirmText, isLight && { color: 'rgba(37,29,22,0.90)' }]}>"{calcResult.entry.affirmation}"</Text>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                )}
              </View>
            </Animated.View>

            {/* SEKWENCJE PREMIOWANE */}
            <Animated.View entering={FadeInDown.delay(130).duration(400)} style={{ marginTop: 16 }}>
              <View style={[an.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={an.sectionHead}>
                  <Clock size={14} color={ACCENT} />
                  <Text style={[an.sectionTitle, { color: ACCENT }]}>{t('angelNumbers.sekwencje_premiowane', '⏰ SEKWENCJE PREMIOWANE')}</Text>
                </View>
                <Text style={[an.sectionDesc, { color: subColor }]}>
                  {t('angelNumbers.specjalne_kombinacje_na_zegarze_kaz', 'Specjalne kombinacje na zegarze — każda ma unikalną moc. Dotknij, by poznać pełne znaczenie.')}
                </Text>
                {SPECIAL_SEQUENCES.map((seq, idx) => (
                  <Pressable
                    key={seq.seq}
                    onPress={() => setExpandedSeq(expandedSeq === seq.seq ? null : seq.seq)}
                    style={[an.seqRow, { borderTopWidth: idx > 0 ? StyleSheet.hairlineWidth : 0, borderTopColor: dividerColor }]}
                  >
                    <View style={[an.seqTimeBadge, { backgroundColor: seq.color + '20', borderColor: seq.color + '55' }]}>
                      <Text style={[an.seqTimeText, { color: seq.color }]}>{seq.time}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[an.seqTitle, { color: textColor }]}>{seq.title}</Text>
                      <Text style={[an.seqPower, { color: seq.color }]}>{seq.power}</Text>
                      {expandedSeq === seq.seq && (
                        <Text style={[an.seqMessage, { color: subColor }]}>{seq.message}</Text>
                      )}
                    </View>
                    <ArrowRight size={14} color={subColor} style={{ transform: [{ rotate: expandedSeq === seq.seq ? '90deg' : '0deg' }] }} />
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* WZORCE LICZBOWE */}
            <Animated.View entering={FadeInDown.delay(155).duration(400)} style={{ marginTop: 16 }}>
              <View style={[an.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={an.sectionHead}>
                  <TrendingUp size={14} color={ACCENT} />
                  <Text style={[an.sectionTitle, { color: ACCENT }]}>{t('angelNumbers.wzorce_przebudzen', '🌀 WZORCE PRZEBUDZENIA')}</Text>
                </View>
                <Text style={[an.sectionDesc, { color: subColor }]}>
                  {t('angelNumbers.sekwencje_wielocyfro_niosa_przebudz', 'Sekwencje wielocyfrowe niosą "przebudzeniowe przesłanie" — czytaj je razem z energią dnia.')}
                </Text>
                {NUMBER_PATTERNS.map((p, idx) => (
                  <Pressable
                    key={p.pattern}
                    onPress={() => setExpandedPattern(expandedPattern === p.pattern ? null : p.pattern)}
                    style={[an.seqRow, { borderTopWidth: idx > 0 ? StyleSheet.hairlineWidth : 0, borderTopColor: dividerColor }]}
                  >
                    <View style={[an.seqTimeBadge, { backgroundColor: p.color + '20', borderColor: p.color + '55' }]}>
                      <Text style={[an.seqTimeText, { color: p.color, fontSize: 11 }]}>{p.pattern}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 16 }}>{p.icon}</Text>
                        <Text style={[an.seqTitle, { color: textColor }]}>{p.name}</Text>
                      </View>
                      {expandedPattern === p.pattern && (
                        <Text style={[an.seqMessage, { color: subColor }]}>{p.awakening}</Text>
                      )}
                    </View>
                    <ChevronDown size={14} color={subColor} style={{ transform: [{ rotate: expandedPattern === p.pattern ? '180deg' : '0deg' }] }} />
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* QUICK SEARCH */}
            <Animated.View entering={FadeInDown.delay(175).duration(400)} style={{ marginTop: 16 }}>
              <Text style={[an.sectionLabel, { color: subColor, marginBottom: 10 }]}>{t('angelNumbers.wyszukaj_dowolna_liczbe', 'WYSZUKAJ DOWOLNĄ LICZBĘ')}</Text>
              <View style={[an.searchRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Hash size={18} color={ACCENT} style={{ marginRight: 8 }} />
                <TextInput
                  style={[an.searchInput, { color: textColor, flex: 1 }]}
                  placeholder={t('angelNumbers.wpisz_liczbe_111_222_1111', 'Wpisz liczbę: 111, 222, 1111…')}
                  placeholderTextColor={subColor}
                  value={inputNumber}
                  onChangeText={v => { setInputNumber(v); setNotFound(false); }}
                  keyboardType="numeric"
                  returnKeyType="search"
                  onSubmitEditing={() => handleSearch()}
                />
                <Pressable onPress={() => handleSearch()} style={[an.searchBtn, { backgroundColor: ACCENT }]}>
                  <Search size={16} color="#fff" />
                </Pressable>
              </View>
            </Animated.View>

            {/* Result card */}
            {activeNumber && (
              <Animated.View entering={FadeInUp.duration(500)} style={{ marginTop: 16 }}>
                <LinearGradient
                  colors={[activeNumber.color + 'CC', activeNumber.color + '55', activeNumber.color + '22']}
                  style={[an.resultCard, { borderColor: activeNumber.color + '80' }]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Text style={[an.resultNumber, isLight && { color: 'rgba(37,29,22,0.90)' }]}>{activeNumber.number}</Text>
                  <Text style={[an.resultTitle, isLight && { color: 'rgba(37,29,22,0.90)' }]}>{activeNumber.title}</Text>
                  {activeNumber.lifeArea && (
                    <View style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.14)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 }}>
                      <Text style={{ fontSize: 11, color: isLight ? 'rgba(37,29,22,0.80)' : 'rgba(255,255,255,0.80)', fontWeight: '600' }}>{activeNumber.lifeArea}</Text>
                    </View>
                  )}
                  <View style={[an.areaBadge, { backgroundColor: AREA_COLORS[activeNumber.area] + '30', borderColor: AREA_COLORS[activeNumber.area] + '70' }]}>
                    <Sparkles size={12} color={AREA_COLORS[activeNumber.area]} style={{ marginRight: 4 }} />
                    <Text style={[an.areaBadgeText, { color: AREA_COLORS[activeNumber.area] }]}>{activeNumber.area.toUpperCase()}</Text>
                  </View>
                  <Text style={[an.resultMessage, isLight && { color: 'rgba(37,29,22,0.90)' }]}>{activeNumber.message}</Text>
                  {activeNumber.actionGuidance && (
                    <View style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.10)', borderRadius: 12, padding: 12, width: '100%', marginBottom: 12 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: isLight ? 'rgba(37,29,22,0.55)' : 'rgba(255,255,255,0.60)', marginBottom: 4 }}>{t('angelNumbers.dzialanie', 'DZIAŁANIE')}</Text>
                      <Text style={{ fontSize: 13, lineHeight: 20, color: isLight ? 'rgba(37,29,22,0.88)' : 'rgba(255,255,255,0.88)' }}>{activeNumber.actionGuidance}</Text>
                    </View>
                  )}
                  {CHAKRA_MAP[activeNumber.number] && (
                    <View style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.10)', borderRadius: 12, padding: 10, width: '100%', marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Zap size={14} color={CHAKRA_MAP[activeNumber.number].color} />
                      <Text style={{ fontSize: 12, color: CHAKRA_MAP[activeNumber.number].color, fontWeight: '700' }}>
                        Czakra {CHAKRA_MAP[activeNumber.number].name} ({CHAKRA_MAP[activeNumber.number].sanskrit})
                      </Text>
                    </View>
                  )}
                  <View style={[an.affirmBox, { backgroundColor: isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.12)' }]}>
                    <Text style={[an.affirmLabel, isLight && { color: 'rgba(37,29,22,0.55)' }]}>{t('angelNumbers.afirmacja_1', 'AFIRMACJA')}</Text>
                    <Text style={[an.affirmText, isLight && { color: 'rgba(37,29,22,0.90)' }]}>"{activeNumber.affirmation}"</Text>
                  </View>
                  {/* AI Affirmation button */}
                  <Pressable
                    onPress={() => handleAiAffirmation(activeNumber)}
                    disabled={affLoading}
                    style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.14)', borderRadius: 12, paddingVertical: 10 }}
                  >
                    <Sparkles size={13} color={isLight ? 'rgba(37,29,22,0.80)' : '#fff'} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: isLight ? 'rgba(37,29,22,0.90)' : '#fff' }}>
                      {affLoading && affTarget?.number === activeNumber.number ? 'Generuję afirmację...' : 'Wygeneruj AI afirmację'}
                    </Text>
                  </Pressable>
                  {affResult && affTarget?.number === activeNumber.number && (
                    <Animated.View entering={FadeInUp.duration(400)} style={{ marginTop: 10, backgroundColor: isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.10)', borderRadius: 12, padding: 12, width: '100%' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: isLight ? 'rgba(37,29,22,0.55)' : 'rgba(255,255,255,0.60)', marginBottom: 4 }}>{t('angelNumbers.twoja_ai_afirmacja', 'TWOJA AI AFIRMACJA')}</Text>
                      <Text style={{ fontSize: 14, fontStyle: 'italic', color: isLight ? 'rgba(37,29,22,0.90)' : '#fff', lineHeight: 22, textAlign: 'center' }}>"{affResult}"</Text>
                    </Animated.View>
                  )}
                </LinearGradient>
              </Animated.View>
            )}

            {notFound && (
              <Animated.View entering={FadeInDown.duration(350)} style={[an.notFoundCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[an.notFoundText, { color: subColor }]}>
                  Jeszcze nie znamy tej liczby.{'\n'}Spróbuj jednej ze znanych sekwencji anielskich.
                </Text>
              </Animated.View>
            )}

            {/* Recently viewed */}
            {recentNumbers.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={[an.sectionLabel, { color: subColor }]}>{t('angelNumbers.ostatnio_przegladan', 'OSTATNIO PRZEGLĄDANE')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {recentNumbers.map(n => {
                    const entry = ANGEL_NUMBERS.find(a => a.number === n);
                    return (
                      <Pressable key={n} onPress={() => handleChipTap(n)}
                        style={[an.recentChip, { backgroundColor: (entry?.color ?? ACCENT) + '22', borderColor: (entry?.color ?? ACCENT) + '60' }]}>
                        <Text style={[an.recentChipNum, { color: entry?.color ?? ACCENT }]}>{n}</Text>
                        {entry && <Text style={[an.recentChipTitle, { color: subColor }]}>{entry.title}</Text>}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Powiadomienia szybki link */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ marginTop: 20 }}>
              <Pressable
                onPress={() => navigation.navigate('NotificationsDetail')}
                style={[an.notifBanner, { backgroundColor: cardBg, borderColor: ACCENT + '40' }]}
              >
                <LinearGradient
                  colors={[ACCENT + '22', ACCENT + '08']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />
                <Bell size={18} color={ACCENT} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[{ fontSize: 13, fontWeight: '700', color: textColor }]}>{t('angelNumbers.ustaw_przypomnie_anielskie', 'Ustaw przypomnienie anielskie')}</Text>
                  <Text style={[{ fontSize: 12, color: subColor, marginTop: 2 }]}>{t('angelNumbers.codziennie_o_wybranej_godzinie_spra', 'Codziennie o wybranej godzinie — sprawdź swoją liczbę dnia')}</Text>
                </View>
                <ChevronRight size={16} color={subColor} />
              </Pressable>
            </Animated.View>

          </Animated.View>
        )}

        {/* ══════════════════════════════════════════════════════
            ENCYCLOPEDIA TAB
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'encyclopedia' && (
          <Animated.View entering={FadeInDown.duration(400)}>

            {/* Intro */}
            <View style={[an.introCard, { backgroundColor: cardBg, borderColor: cardBorder, marginBottom: 16 }]}>
              <Text style={[an.introTitle, { color: ACCENT }]}>{t('angelNumbers.kompletna_encykloped_anielska', 'Kompletna Encyklopedia Anielska')}</Text>
              <Text style={[an.introBody, { color: subColor }]}>
                {ANGEL_NUMBERS.length} sekwencji liczbowych z pełnymi interpretacjami, wskazówkami działania i połączeniami czakralnymi. Dotknij dowolnej liczby by zobaczyć pełen profil.
              </Text>
            </View>

            {/* Search bar */}
            <View style={[an.searchRow, { backgroundColor: cardBg, borderColor: cardBorder, marginBottom: 12 }]}>
              <Search size={16} color={subColor} style={{ marginRight: 8 }} />
              <TextInput
                style={[an.searchInput, { color: textColor, flex: 1 }]}
                placeholder={t('angelNumbers.szukaj_liczby_lub_tytulu', 'Szukaj liczby lub tytułu…')}
                placeholderTextColor={subColor}
                value={encSearch}
                onChangeText={setEncSearch}
                returnKeyType="search"
              />
              {encSearch ? (
                <Pressable onPress={() => setEncSearch('')}>
                  <X size={16} color={subColor} />
                </Pressable>
              ) : null}
            </View>

            {/* Area filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <Pressable
                onPress={() => setEncArea(null)}
                style={[an.areaFilterChip, {
                  backgroundColor: !encArea ? ACCENT + '20' : cardBg,
                  borderColor: !encArea ? ACCENT + '70' : cardBorder,
                }]}
              >
                <Text style={[an.areaFilterText, { color: !encArea ? ACCENT : subColor }]}>{t('angelNumbers.wszystkie', 'Wszystkie')}</Text>
              </Pressable>
              {Object.entries(AREA_COLORS).map(([area, color]) => (
                <Pressable
                  key={area}
                  onPress={() => setEncArea(encArea === area ? null : area)}
                  style={[an.areaFilterChip, {
                    backgroundColor: encArea === area ? color + '20' : cardBg,
                    borderColor: encArea === area ? color + '70' : cardBorder,
                  }]}
                >
                  <Text style={[an.areaFilterText, { color: encArea === area ? color : subColor, textTransform: 'capitalize' }]}>{area}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Results count */}
            <Text style={[an.sectionLabel, { color: subColor, marginBottom: 12 }]}>
              {filteredEnc.length} WYNIKÓW
            </Text>

            {/* Encyclopedia entries */}
            {filteredEnc.map((item, i) => (
              <Animated.View key={item.number} entering={FadeInDown.delay(i * 30).duration(350)}>
                <Pressable
                  onPress={() => setExpandedEnc(expandedEnc === item.number ? null : item.number)}
                  style={[an.encCard, {
                    backgroundColor: expandedEnc === item.number ? item.color + '14' : cardBg,
                    borderColor: expandedEnc === item.number ? item.color + '66' : (isLight ? 'rgba(100,70,20,0.15)' : 'rgba(255,255,255,0.10)'),
                    shadowColor: item.color,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: expandedEnc === item.number ? 0.18 : 0.06,
                    shadowRadius: 8,
                    elevation: expandedEnc === item.number ? 4 : 1,
                  }]}
                >
                  <LinearGradient
                    colors={[item.color + '0C', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  />
                  {/* Card header row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[an.encNumBadge, { backgroundColor: item.color + '28', borderColor: item.color + '66' }]}>
                      <Text style={[an.encNum, { color: item.color }]}>{item.number}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[an.encTitle, { color: textColor }]}>{item.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <View style={[an.areaTag, { backgroundColor: AREA_COLORS[item.area] + '25' }]}>
                          <Text style={[an.areaTagText, { color: AREA_COLORS[item.area] }]}>{item.area}</Text>
                        </View>
                        {item.lifeArea && (
                          <Text style={[{ fontSize: 11, color: subColor }]} numberOfLines={1}>{item.lifeArea}</Text>
                        )}
                      </View>
                    </View>
                    <ChevronDown size={16} color={subColor} style={{ transform: [{ rotate: expandedEnc === item.number ? '180deg' : '0deg' }] }} />
                  </View>

                  {/* Expanded content */}
                  {expandedEnc === item.number && (
                    <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 14 }}>
                      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: dividerColor, marginBottom: 14 }} />

                      <Text style={[{ fontSize: 14, lineHeight: 23, color: subColor, marginBottom: 12 }]}>{item.message}</Text>

                      {item.actionGuidance && (
                        <View style={[an.encBlock, { backgroundColor: item.color + '12', borderColor: item.color + '35' }]}>
                          <Text style={[an.encBlockLabel, { color: item.color }]}>{t('angelNumbers.dzialanie_1', 'DZIAŁANIE')}</Text>
                          <Text style={[an.encBlockText, { color: textColor }]}>{item.actionGuidance}</Text>
                        </View>
                      )}

                      {CHAKRA_MAP[item.number] && (
                        <View style={[an.encBlock, { backgroundColor: CHAKRA_MAP[item.number].color + '12', borderColor: CHAKRA_MAP[item.number].color + '35', flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                          <Zap size={14} color={CHAKRA_MAP[item.number].color} />
                          <View>
                            <Text style={[an.encBlockLabel, { color: CHAKRA_MAP[item.number].color }]}>{t('angelNumbers.czakra_1', 'CZAKRA')}</Text>
                            <Text style={[an.encBlockText, { color: textColor }]}>
                              {CHAKRA_MAP[item.number].name} — {CHAKRA_MAP[item.number].sanskrit}
                            </Text>
                          </View>
                        </View>
                      )}

                      <View style={[an.encBlock, { backgroundColor: AREA_COLORS[item.area] + '12', borderColor: AREA_COLORS[item.area] + '35' }]}>
                        <Text style={[an.encBlockLabel, { color: AREA_COLORS[item.area] }]}>{t('angelNumbers.afirmacja_2', 'AFIRMACJA')}</Text>
                        <Text style={[an.encBlockText, { color: textColor, fontStyle: 'italic' }]}>"{item.affirmation}"</Text>
                      </View>

                      <Pressable
                        onPress={() => { handleChipTap(item.number); }}
                        style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, backgroundColor: item.color + '15', borderRadius: 12, paddingVertical: 10 }]}
                      >
                        <Eye size={13} color={item.color} />
                        <Text style={[{ fontSize: 12, fontWeight: '700', color: item.color }]}>{t('angelNumbers.otworz_pelny_widok_oracle', 'Otwórz pełny widok Oracle')}</Text>
                      </Pressable>
                    </Animated.View>
                  )}
                </Pressable>
              </Animated.View>
            ))}

            {filteredEnc.length === 0 && (
              <View style={[an.emptyState, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Search size={34} color={subColor} style={{ marginBottom: 12 }} />
                <Text style={[an.emptyTitle, { color: textColor }]}>{t('angelNumbers.brak_wynikow', 'Brak wyników')}</Text>
                <Text style={[an.emptyBody, { color: subColor }]}>{t('angelNumbers.zmien_kryteria_wyszukiwan_lub_filtr', 'Zmień kryteria wyszukiwania lub filtr obszaru.')}</Text>
              </View>
            )}

          </Animated.View>
        )}

        {/* ══════════════════════════════════════════════════════
            JOURNAL TAB
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'journal' && (
          <Animated.View entering={FadeInDown.duration(400)}>

            {/* Header row with Add button */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text style={[{ fontSize: 16, fontWeight: '700', color: textColor }]}>{t('angelNumbers.dziennik_synchronic', 'Dziennik Synchroniczności')}</Text>
                <Text style={[{ fontSize: 12, color: subColor, marginTop: 2 }]}>{sightings.length} zapisanych spotkań</Text>
              </View>
              <Pressable
                onPress={() => setShowAddModal(true)}
                style={[an.addBtn, { backgroundColor: ACCENT }]}
              >
                <Plus size={18} color="#fff" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{t('angelNumbers.dodaj', 'Dodaj')}</Text>
              </Pressable>
            </View>

            {/* Frequency stats */}
            {sightingFreq.length > 0 && (
              <Animated.View entering={FadeInDown.delay(40).duration(350)}>
                <View style={[an.sectionCard, { backgroundColor: cardBg, borderColor: ACCENT + '33', marginBottom: 16 }]}>
                  <View style={an.sectionHead}>
                    <TrendingUp size={14} color={ACCENT} />
                    <Text style={[an.sectionTitle, { color: ACCENT }]}>{t('angelNumbers.twoje_wzorce_synchronic', 'TWOJE WZORCE SYNCHRONICZNOŚCI')}</Text>
                  </View>
                  <Text style={[an.sectionDesc, { color: subColor }]}>{t('angelNumbers.liczby_ktore_pojawiaja_sie_najczesc', 'Liczby, które pojawiają się najczęściej w Twoim życiu niosą największy przekaz.')}</Text>
                  {sightingFreq.map(([num, count], idx) => {
                    const entry = ANGEL_NUMBERS.find(a => a.number === num);
                    const barW = (count / sightingFreq[0][1]) * 100;
                    return (
                      <View key={num} style={{ marginBottom: idx < sightingFreq.length - 1 ? 10 : 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={[{ fontSize: 16, fontWeight: '900', color: entry?.color || ACCENT }]}>{num}</Text>
                            <Text style={[{ fontSize: 12, color: subColor }]}>{entry?.title || '—'}</Text>
                          </View>
                          <Text style={[{ fontSize: 13, fontWeight: '700', color: entry?.color || ACCENT }]}>{count}×</Text>
                        </View>
                        <View style={{ height: 4, borderRadius: 2, backgroundColor: (entry?.color || ACCENT) + '20', overflow: 'hidden' }}>
                          <View style={{ height: 4, borderRadius: 2, width: `${barW}%`, backgroundColor: entry?.color || ACCENT }} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* Filter chips */}
            {sightings.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <Pressable
                  onPress={() => setJournalFilter(null)}
                  style={[an.areaFilterChip, { backgroundColor: !journalFilter ? ACCENT + '20' : cardBg, borderColor: !journalFilter ? ACCENT + '70' : cardBorder }]}
                >
                  <Text style={[an.areaFilterText, { color: !journalFilter ? ACCENT : subColor }]}>Wszystkie ({sightings.length})</Text>
                </Pressable>
                {[...new Set(sightings.map(s => s.number))].map(num => {
                  const entry = ANGEL_NUMBERS.find(a => a.number === num);
                  const cnt   = sightings.filter(s => s.number === num).length;
                  return (
                    <Pressable
                      key={num}
                      onPress={() => setJournalFilter(journalFilter === num ? null : num)}
                      style={[an.areaFilterChip, {
                        backgroundColor: journalFilter === num ? (entry?.color || ACCENT) + '20' : cardBg,
                        borderColor: journalFilter === num ? (entry?.color || ACCENT) + '70' : cardBorder,
                      }]}
                    >
                      <Text style={[an.areaFilterText, { color: journalFilter === num ? (entry?.color || ACCENT) : subColor }]}>
                        {num} ({cnt})
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {/* Sightings list */}
            {filteredSightings.length === 0 ? (
              <View style={[an.emptyState, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <BookOpen size={34} color={subColor} style={{ marginBottom: 12 }} />
                <Text style={[an.emptyTitle, { color: textColor }]}>
                  {sightings.length === 0 ? 'Dziennik jest pusty' : 'Brak wpisów dla tej liczby'}
                </Text>
                <Text style={[an.emptyBody, { color: subColor }]}>
                  {sightings.length === 0
                    ? 'Gdy zobaczysz liczbę anielską, zapisz ją tutaj z kontekstem. Z czasem wzorce synchroniczności staną się wyraźne.'
                    : 'Wybierz inną liczbę z filtra powyżej.'}
                </Text>
                {sightings.length === 0 && (
                  <Pressable
                    onPress={() => setShowAddModal(true)}
                    style={[an.aiBtn, { borderColor: ACCENT + '44', backgroundColor: ACCENT + '15', marginTop: 16 }]}
                  >
                    <Plus size={14} color={ACCENT} />
                    <Text style={[an.aiBtnText, { color: ACCENT }]}>{t('angelNumbers.dodaj_pierwsze_spotkanie', 'Dodaj pierwsze spotkanie')}</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              filteredSightings.map((s, i) => {
                const entry = ANGEL_NUMBERS.find(a => a.number === s.number);
                const dt    = new Date(s.timestamp);
                return (
                  <Animated.View key={s.id} entering={FadeInDown.delay(i * 50).duration(350)}>
                    <View style={[an.historyCard, { backgroundColor: cardBg, borderColor: entry ? entry.color + '44' : cardBorder }]}>
                      <LinearGradient
                        colors={[entry ? entry.color + '50' : ACCENT + '50', entry ? entry.color + '10' : ACCENT + '10']}
                        style={an.historyColorBar}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={[an.historyNum, { color: entry?.color || ACCENT }]}>{s.number}</Text>
                          {entry && <Text style={[an.historyTitle, { color: textColor }]}>{entry.title}</Text>}
                        </View>
                        {s.context ? (
                          <Text style={[{ fontSize: 13, color: subColor, marginTop: 4, lineHeight: 19 }]} numberOfLines={2}>{s.context}</Text>
                        ) : null}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 }}>
                          <Text style={[an.historyDate, { color: subColor }]}>
                            {s.timestamp ? (() => { const MS = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru']; return `${dt.getDate()} ${MS[dt.getMonth()]} · ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`; })() : '—'}
                          </Text>
                          {s.location ? (
                            <Text style={[{ fontSize: 11, color: subColor }]}>📍 {s.location}</Text>
                          ) : null}
                        </View>
                      </View>
                      <Pressable onPress={() => handleDeleteSighting(s.id)} hitSlop={12} style={{ padding: 6 }}>
                        <Trash2 size={15} color={subColor} />
                      </Pressable>
                    </View>
                  </Animated.View>
                );
              })
            )}

            {/* 7-day calendar section */}
            <View style={{ marginTop: 24 }}>
              <Text style={[an.sectionLabel, { color: subColor, marginBottom: 16 }]}>{t('angelNumbers.energetycz_wzorzec_ostatnie_7_dni', 'ENERGETYCZNY WZORZEC — OSTATNIE 7 DNI')}</Text>
              <View style={an.calendarGrid}>
                {last7Days.map((day, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(i * 50).duration(350)}>
                    <Pressable
                      onPress={() => {
                        if (day.entry) { handleChipTap(String(day.reduced)); }
                      }}
                      style={[an.calDayCard, {
                        backgroundColor: day.isToday ? (day.entry?.color || ACCENT) + '20' : cardBg,
                        borderColor: day.isToday ? (day.entry?.color || ACCENT) + '66' : cardBorder,
                      }]}
                    >
                      <Text style={[an.calDayName, { color: day.isToday ? (day.entry?.color || ACCENT) : subColor }]}>
                        {WEEKDAY_PL[day.date.getDay()].slice(0, 3).toUpperCase()}
                      </Text>
                      <Text style={[an.calDayDate, { color: subColor }]}>
                        {day.date.getDate()}.{String(day.date.getMonth() + 1).padStart(2, '0')}
                      </Text>
                      <View style={[an.calNumBadge, { backgroundColor: (day.entry?.color || ACCENT) + '25' }]}>
                        <Text style={[an.calNum, { color: day.entry?.color || ACCENT }]}>{day.reduced}</Text>
                      </View>
                      <Text style={[an.calTitle, { color: textColor }]} numberOfLines={1}>{day.entry?.title || '—'}</Text>
                      {day.isToday && <View style={[an.calTodayDot, { backgroundColor: day.entry?.color || ACCENT }]} />}
                    </Pressable>
                  </Animated.View>
                ))}
              </View>

              {/* Pattern analysis */}
              <View style={[an.patternCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                <View style={an.sectionHead}>
                  <Sparkles size={14} color={ACCENT} />
                  <Text style={[an.sectionTitle, { color: ACCENT }]}>{t('angelNumbers.analiza_wzorcow_7_dniowych', 'ANALIZA WZORCÓW 7-DNIOWYCH')}</Text>
                </View>
                <Text style={[an.patternText, { color: subColor }]}>
                  {t('angelNumbers.dominujace_energie_ostatniego_tygod', 'Dominujące energie ostatniego tygodnia:')}
                </Text>
                <View style={an.patternAreas}>
                  {Object.entries(
                    last7Days.reduce((acc, day) => {
                      if (day.entry) { acc[day.entry.area] = (acc[day.entry.area] || 0) + 1; }
                      return acc;
                    }, {} as Record<string, number>)
                  ).sort((a, b) => b[1] - a[1]).map(([area, count]) => (
                    <View key={area} style={[an.patternAreaChip, { backgroundColor: AREA_COLORS[area] + '20', borderColor: AREA_COLORS[area] + '55' }]}>
                      <Text style={[an.patternAreaText, { color: AREA_COLORS[area] }]}>{area}</Text>
                      <Text style={[an.patternAreaCount, { color: AREA_COLORS[area] }]}>{count}×</Text>
                    </View>
                  ))}
                </View>
                <Text style={[an.patternDesc, { color: subColor }]}>
                  {t('angelNumbers.powtarzaja_sie_energia_wskazuje_gdz', 'Powtarzająca się energia wskazuje, gdzie Wszechświat kieruje Twoją uwagę w tym tygodniu. Zwróć szczególną uwagę na obszar dominujący.')}
                </Text>
              </View>
            </View>

          </Animated.View>
        )}

        {/* ══════════════════════════════════════════════════════
            PERSONAL TAB
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'personal' && (
          <Animated.View entering={FadeInDown.duration(400)}>

            {/* Guardian Angel Number */}
            {guardianNum && guardianEntry ? (
              <Animated.View entering={FadeInDown.delay(40).duration(400)}>
                <LinearGradient
                  colors={[guardianEntry.color + 'DD', guardianEntry.color + '66', guardianEntry.color + '22']}
                  style={[an.dayNumberCard, { borderColor: guardianEntry.color + '80', marginBottom: 16 }]}
                  start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
                >
                  <View style={an.dayNumberHeader}>
                    <User size={14} color="rgba(255,255,255,0.80)" />
                    <Text style={[an.dayNumberLabel, isLight && { color: 'rgba(37,29,22,0.72)' }]}>{t('angelNumbers.twoj_aniol_stroz', 'TWÓJ ANIOŁ STRÓŻ')}</Text>
                  </View>
                  <Text style={[an.dayNumberMain, isLight && { color: 'rgba(37,29,22,0.90)' }]}>{guardianNum}</Text>
                  <Text style={[an.dayNumberTitle, isLight && { color: 'rgba(37,29,22,0.90)' }]}>{guardianEntry.title}</Text>
                  <View style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.14)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, color: isLight ? 'rgba(37,29,22,0.85)' : 'rgba(255,255,255,0.85)', fontWeight: '600', textAlign: 'center' }}>{guardianEntry.power}</Text>
                  </View>
                  <Text style={[an.dayNumberMessage, isLight && { color: 'rgba(37,29,22,0.88)' }]}>{guardianEntry.message}</Text>
                  {personalAiMsg ? (
                    <Animated.View entering={FadeInUp.duration(500)} style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 14, width: '100%', marginBottom: 12 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: isLight ? 'rgba(37,29,22,0.55)' : 'rgba(255,255,255,0.60)', marginBottom: 6 }}>{t('angelNumbers.osobisty_przekaz', 'OSOBISTY PRZEKAZ')}</Text>
                      <Text style={{ fontSize: 14, lineHeight: 23, color: isLight ? 'rgba(37,29,22,0.90)' : 'rgba(255,255,255,0.92)', fontStyle: 'italic' }}>{personalAiMsg}</Text>
                    </Animated.View>
                  ) : null}
                  <Pressable
                    onPress={handlePersonalAi}
                    disabled={personalAiLoading}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.16)', borderRadius: 14, paddingVertical: 12, width: '100%' }}
                  >
                    <Sparkles size={14} color={isLight ? 'rgba(37,29,22,0.80)' : '#fff'} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isLight ? 'rgba(37,29,22,0.90)' : '#fff' }}>
                      {personalAiLoading ? 'Anioł przemawia...' : personalAiMsg ? 'Nowy przekaz AI' : 'Odbierz przekaz od anioła'}
                    </Text>
                  </Pressable>
                </LinearGradient>
              </Animated.View>
            ) : (
              <View style={[an.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder, marginBottom: 16 }]}>
                <View style={an.sectionHead}>
                  <User size={14} color={ACCENT} />
                  <Text style={[an.sectionTitle, { color: ACCENT }]}>{t('angelNumbers.twoj_aniol_stroz_1', 'TWÓJ ANIOŁ STRÓŻ')}</Text>
                </View>
                <Text style={[an.sectionDesc, { color: subColor }]}>
                  {t('angelNumbers.aby_obliczyc_twoja_osobista_liczbe', 'Aby obliczyć Twoją osobistą liczbę anielską, uzupełnij datę urodzenia w Profilu. Twój anioł stróż zostanie określony na podstawie numerologicznej redukcji daty urodzenia.')}
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('Profile')}
                  style={[an.aiBtn, { borderColor: ACCENT + '44', backgroundColor: ACCENT + '15' }]}
                >
                  <User size={14} color={ACCENT} />
                  <Text style={[an.aiBtnText, { color: ACCENT }]}>{t('angelNumbers.uzupelnij_profil', 'Uzupełnij profil')}</Text>
                </Pressable>
              </View>
            )}

            {/* Guardian number properties table */}
            {guardianNum && (
              <Animated.View entering={FadeInDown.delay(80).duration(400)}>
                <View style={[an.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder, marginBottom: 16 }]}>
                  <View style={an.sectionHead}>
                    <Zap size={14} color={ACCENT} />
                    <Text style={[an.sectionTitle, { color: ACCENT }]}>{t('angelNumbers.wlasciwosc_twojej_liczby', 'WŁAŚCIWOŚCI TWOJEJ LICZBY')}</Text>
                  </View>
                  {[
                    { label: 'Liczba Anioła',   value: String(guardianNum) },
                    { label: 'Archetyt',         value: guardianEntry?.title || '—' },
                    { label: 'Moce',             value: guardianEntry?.power || '—' },
                    { label: 'Obliczenie',       value: userData?.birthDate ? `z daty: ${userData.birthDate}` : '—' },
                    { label: 'Czakra',           value: CHAKRA_MAP[String(guardianNum)]?.name ? `${CHAKRA_MAP[String(guardianNum)].name} (${CHAKRA_MAP[String(guardianNum)].sanskrit})` : 'Bazowa' },
                  ].map((row, idx, arr) => (
                    <View key={row.label} style={[{
                      flexDirection: 'row', paddingVertical: 10,
                      borderBottomWidth: idx < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                      borderBottomColor: dividerColor,
                    }]}>
                      <Text style={[{ fontSize: 12, color: subColor, width: 120, fontWeight: '600' }]}>{row.label}</Text>
                      <Text style={[{ fontSize: 13, color: textColor, flex: 1, fontWeight: '500' }]}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* All Guardian number descriptions — mini cards */}
            <Animated.View entering={FadeInDown.delay(110).duration(400)}>
              <Text style={[an.sectionLabel, { color: subColor, marginBottom: 12 }]}>{t('angelNumbers.wszystkie_liczby_aniolow_strozow', 'WSZYSTKIE LICZBY ANIOŁÓW STRÓŻÓW')}</Text>
              {Object.entries(GUARDIAN_DESCRIPTIONS).map(([num, desc], i) => (
                <Animated.View key={num} entering={FadeInDown.delay(i * 30).duration(350)}>
                  <View style={[an.encCard, {
                    backgroundColor: guardianNum === Number(num) ? desc.color + '14' : cardBg,
                    borderColor: guardianNum === Number(num) ? desc.color + '55' : cardBorder,
                  }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[an.encNumBadge, { backgroundColor: desc.color + '25', borderColor: desc.color + '55' }]}>
                        <Text style={[an.encNum, { color: desc.color }]}>{num}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[an.encTitle, { color: textColor }]}>{desc.title}</Text>
                          {guardianNum === Number(num) && (
                            <View style={{ backgroundColor: desc.color + '25', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                              <Text style={{ fontSize: 9, fontWeight: '800', color: desc.color, letterSpacing: 0.8 }}>{t('angelNumbers.twoja', 'TWOJA')}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[{ fontSize: 11, color: subColor, marginTop: 2 }]} numberOfLines={1}>{desc.power}</Text>
                      </View>
                    </View>
                    <Text style={[{ fontSize: 13, color: subColor, lineHeight: 20, marginTop: 10 }]}>{desc.message}</Text>
                  </View>
                </Animated.View>
              ))}
            </Animated.View>

            {/* Guide tips */}
            <Animated.View entering={FadeInDown.delay(140).duration(400)}>
              <Text style={[an.sectionLabel, { color: subColor, marginTop: 24, marginBottom: 12 }]}>{t('angelNumbers.jak_pracowac_z_liczbami_anielskimi', 'JAK PRACOWAĆ Z LICZBAMI ANIELSKIMI')}</Text>
              {GUIDE_TIPS.map((tip, i) => (
                <Animated.View key={i} entering={FadeInDown.delay(i * 50).duration(350)}>
                  <View style={[an.tipCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <Text style={an.tipIcon}>{tip.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[an.tipTitle, { color: textColor }]}>{tip.title}</Text>
                      <Text style={[an.tipBody, { color: subColor }]}>{tip.body}</Text>
                    </View>
                    <ArrowRight size={16} color={subColor} />
                  </View>
                </Animated.View>
              ))}
            </Animated.View>

          </Animated.View>
        )}

        <EndOfContentSpacer size="standard" />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* ── ADD SIGHTING MODAL ─────────────────────────────── */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <Pressable style={an.modalOverlay} onPress={() => setShowAddModal(false)} />
        <View style={[an.modalSheet, { backgroundColor: isLight ? '#FFF8EE' : '#1A1410', paddingBottom: insets.bottom + 20 }]}>
          <View style={an.modalHandle} />
          <View style={[an.modalHeader, { borderBottomColor: dividerColor }]}>
            <Text style={[an.modalTitle, { color: textColor }]}>{t('angelNumbers.zapisz_synchronic', 'Zapisz Synchroniczność')}</Text>
            <Pressable onPress={() => setShowAddModal(false)} hitSlop={12}>
              <X size={20} color={subColor} />
            </Pressable>
          </View>

          <ScrollView style={{ paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
            <Text style={[an.modalLabel, { color: subColor, marginTop: 16 }]}>{t('angelNumbers.liczba_anielska', 'LICZBA ANIELSKA *')}</Text>
            <View style={[an.searchRow, { backgroundColor: cardBg, borderColor: addNum ? ACCENT + '60' : cardBorder, marginTop: 6 }]}>
              <Hash size={16} color={ACCENT} style={{ marginRight: 8 }} />
              <TextInput
                style={[an.searchInput, { color: textColor, flex: 1 }]}
                placeholder={t('angelNumbers.np_111_444_1111', 'np. 111, 444, 1111')}
                placeholderTextColor={subColor}
                value={addNum}
                onChangeText={v => setAddNum(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            {/* Quick number suggestions */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {['111','222','333','444','555','777','888','999','1111'].map(n => (
                <Pressable
                  key={n}
                  onPress={() => setAddNum(n)}
                  style={[an.recentChip, {
                    backgroundColor: addNum === n ? ACCENT + '25' : cardBg,
                    borderColor: addNum === n ? ACCENT + '70' : cardBorder,
                  }]}
                >
                  <Text style={[an.recentChipNum, { color: addNum === n ? ACCENT : subColor }]}>{n}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[an.modalLabel, { color: subColor, marginTop: 16 }]}>{t('angelNumbers.kontekst_co_sie_dzialo_gdy', 'KONTEKST (co się działo gdy ją zobaczyłeś?)')}</Text>
            <TextInput
              style={[an.modalTextArea, { backgroundColor: cardBg, borderColor: cardBorder, color: textColor }]}
              placeholder={t('angelNumbers.np_myslalem_o_zmianie_pracy', 'np. myślałem o zmianie pracy, byłem smutny, medytowałem…')}
              placeholderTextColor={subColor}
              value={addCtx}
              onChangeText={setAddCtx}
              multiline
              numberOfLines={3}
            />

            <Text style={[an.modalLabel, { color: subColor, marginTop: 14 }]}>{t('angelNumbers.miejsce_zrodlo_opcjonalni', 'MIEJSCE / ŹRÓDŁO (opcjonalnie)')}</Text>
            <View style={[an.searchRow, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 6 }]}>
              <TextInput
                style={[an.searchInput, { color: textColor, flex: 1 }]}
                placeholder={t('angelNumbers.np_zegar_w_samochodzi_numer', 'np. zegar w samochodzie, numer domu, paragon…')}
                placeholderTextColor={subColor}
                value={addLoc}
                onChangeText={setAddLoc}
              />
            </View>

            <Pressable
              onPress={handleAddSighting}
              disabled={!addNum.trim()}
              style={[an.modalSaveBtn, { backgroundColor: addNum.trim() ? ACCENT : ACCENT + '40', marginTop: 20 }]}
            >
              <CheckCircle size={16} color="#fff" />
              <Text style={[{ fontSize: 15, fontWeight: '700', color: '#fff' }]}>{t('angelNumbers.zapisz_w_dzienniku', 'Zapisz w dzienniku')}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

        </SafeAreaView>
</View>
  );
};

// ── STYLES ────────────────────────────────────────────────────
const an = StyleSheet.create({
  root:            { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerBtn:       { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { fontSize: 14, fontWeight: '700', letterSpacing: 3.5 },
  headerSub:       { fontSize: 12, marginTop: 2, letterSpacing: 0.5 },
  tabBar:          { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 4 },
  tabItem:         { flex: 1, alignItems: 'center', paddingVertical: 11, position: 'relative' },
  tabLabel:        { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  tabUnderline:    { position: 'absolute', bottom: 0, left: 8, right: 8, height: 2, borderRadius: 1 },
  poem:            { fontSize: 14, lineHeight: 22, textAlign: 'center', fontStyle: 'italic', marginTop: 10, paddingHorizontal: 20 },
  searchRow:       { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput:     { fontSize: 16, paddingVertical: 0 },
  searchBtn:       { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },

  // Result cards
  resultCard:      { borderRadius: 20, borderWidth: 1, padding: 22, alignItems: 'center' },
  resultNumber:    { fontSize: 72, fontWeight: '900', color: '#fff', letterSpacing: -2, lineHeight: 80 },
  resultTitle:     { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 10, letterSpacing: 0.5 },
  areaBadge:       { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 14 },
  areaBadgeText:   { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  resultMessage:   { fontSize: 15, lineHeight: 24, color: 'rgba(255,255,255,0.90)', textAlign: 'center', marginBottom: 18 },
  affirmBox:       { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 14, width: '100%', alignItems: 'center' },
  affirmLabel:     { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: 'rgba(255,255,255,0.60)', marginBottom: 6 },
  affirmText:      { fontSize: 14, fontStyle: 'italic', color: '#fff', textAlign: 'center', lineHeight: 22 },
  notFoundCard:    { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center', marginTop: 16 },
  notFoundText:    { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  sectionLabel:    { fontSize: 11, fontWeight: '700', letterSpacing: 1.8 },
  recentChip:      { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8, alignItems: 'center' },
  recentChipNum:   { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  recentChipTitle: { fontSize: 11, marginTop: 2 },

  // Intro
  introCard:       { borderRadius: 20, borderWidth: 1, padding: 18 },
  introTitle:      { fontSize: 16, fontWeight: '700', marginBottom: 8, letterSpacing: 0.3 },
  introBody:       { fontSize: 14, lineHeight: 22 },

  // Area tag (small pill inside cards)
  areaTag:         { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  areaTagText:     { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },

  // Area filter chips (horizontal scroll)
  areaFilterChip:  { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  areaFilterText:  { fontSize: 12, fontWeight: '600' },

  // Guide tips
  tipCard:         { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10, gap: 12 },
  tipIcon:         { fontSize: 24, width: 34, textAlign: 'center' },
  tipTitle:        { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  tipBody:         { fontSize: 13, lineHeight: 19 },

  // Empty state
  emptyState:      { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: 'center' },
  emptyTitle:      { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  emptyBody:       { fontSize: 14, lineHeight: 22, textAlign: 'center' },

  // History / journal cards
  historyCard:     { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, marginBottom: 10, overflow: 'hidden', paddingRight: 14, paddingVertical: 14 },
  historyColorBar: { width: 6, height: '100%', marginRight: 14 },
  historyNum:      { fontSize: 20, fontWeight: '900', letterSpacing: 0.3 },
  historyTitle:    { fontSize: 15, fontWeight: '700' },
  historyDate:     { fontSize: 12, marginTop: 3 },
  historyArea:     { fontSize: 12, fontWeight: '600', marginTop: 2, textTransform: 'capitalize' },

  // Day number card
  dayNumberCard:    { borderRadius: 20, borderWidth: 1, padding: 22, alignItems: 'center', marginBottom: 4 },
  dayNumberHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dayNumberLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.6, color: 'rgba(255,255,255,0.75)' },
  dayNumberMain:    { fontSize: 80, fontWeight: '900', color: '#fff', letterSpacing: -3, lineHeight: 90 },
  dayNumberTitle:   { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 10, letterSpacing: 0.3 },
  dayNumberMessage: { fontSize: 15, lineHeight: 24, color: 'rgba(255,255,255,0.88)', textAlign: 'center', marginBottom: 18 },

  // Section cards
  sectionCard:      { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 4 },
  sectionHead:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle:     { fontSize: 11, fontWeight: '700', letterSpacing: 1.8 },
  sectionDesc:      { fontSize: 13, lineHeight: 20, marginBottom: 12 },

  // AI message
  aiMessageText:    { fontSize: 15, lineHeight: 25, fontStyle: 'italic', marginBottom: 8 },
  aiClearRow:       { paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  aiClearText:      { fontSize: 12, fontWeight: '600' },
  aiBtn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 12, marginTop: 4 },
  aiBtnText:        { fontSize: 13, fontWeight: '700' },

  // Calculator
  calcResultCard:   { borderRadius: 18, borderWidth: 1, padding: 18, alignItems: 'center' },
  calcReduceText:   { fontSize: 13, color: 'rgba(255,255,255,0.70)', marginBottom: 4, letterSpacing: 0.5 },
  calcNumber:       { fontSize: 60, fontWeight: '900', color: '#fff', letterSpacing: -2, lineHeight: 70 },
  calcTitle:        { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  calcMessage:      { fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.88)', textAlign: 'center', marginBottom: 14 },

  // Special sequences
  seqRow:           { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 2 },
  seqTimeBadge:     { width: 60, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  seqTimeText:      { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  seqTitle:         { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  seqPower:         { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  seqMessage:       { fontSize: 13, lineHeight: 20, marginTop: 8 },

  // Calendar
  calendarGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  calDayCard:       { width: (SW - 40 - 24) / 4, borderRadius: 16, borderWidth: 1, padding: 10, alignItems: 'center', minHeight: 100 },
  calDayName:       { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 2 },
  calDayDate:       { fontSize: 10, marginBottom: 8 },
  calNumBadge:      { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  calNum:           { fontSize: 18, fontWeight: '900' },
  calTitle:         { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  calTodayDot:      { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  patternCard:      { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12 },
  patternText:      { fontSize: 13, lineHeight: 20, marginBottom: 10 },
  patternAreas:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  patternAreaChip:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  patternAreaText:  { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  patternAreaCount: { fontSize: 11, fontWeight: '800' },
  patternDesc:      { fontSize: 13, lineHeight: 20 },

  // Encyclopedia cards
  encCard:          { borderRadius: 18, borderWidth: 1, padding: 15, marginBottom: 10, overflow: 'hidden' },
  encNumBadge:      { width: 52, height: 52, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  encNum:           { fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  encTitle:         { fontSize: 14, fontWeight: '700' },
  encBlock:         { borderRadius: 12, borderWidth: 1, padding: 10, marginBottom: 8 },
  encBlockLabel:    { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  encBlockText:     { fontSize: 13, lineHeight: 20 },

  // Add button
  addBtn:           { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 },

  // Notification banner
  notifBanner:      { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 14, overflow: 'hidden' },

  // Modal
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet:       { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, maxHeight: '90%' },
  modalHandle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.30)', alignSelf: 'center', marginBottom: 12 },
  modalHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  modalTitle:       { fontSize: 17, fontWeight: '700' },
  modalLabel:       { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, marginBottom: 6 },
  modalTextArea:    { borderRadius: 14, borderWidth: 1, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginTop: 6 },
  modalSaveBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 14, marginBottom: 8 },

  // Legend (kept for backwards compat)
  legendCard:       { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12 },
  legendGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:        { width: 10, height: 10, borderRadius: 5 },
  legendText:       { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },

  // Numbers grid (guide tab legacy)
  numbersGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  numberChip:       { borderRadius: 16, borderWidth: 1, padding: 14, width: (SW - 40 - 16) / 3, alignItems: 'center' },
  numberChipNum:    { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  numberChipTitle:  { fontSize: 11, fontWeight: '600', marginTop: 3, textAlign: 'center' },
});
