// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated, Dimensions, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Defs, RadialGradient as SvgRadialGradient, Stop, G, Line } from 'react-native-svg';
import Reanimated, {
  FadeIn,
  FadeInDown,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import {
  ArrowDownCircle, ArrowRight, BarChart2, BedDouble, Bell,
  BookOpen, Brain, Calendar, ChevronDown, ChevronLeft, ChevronUp,
  Clock, Coins, Flame, Flower2, HeartPulse, Layers, MoonStar,
  Music, Pause, PenLine, Play, Shield, Smile, Meh, Frown,
  Sparkles, Star, Stars, Target, TimerReset, TrendingUp, Trophy,
  Volume2, VolumeX, Waves, Wind, X, Zap, CheckCircle2,
} from 'lucide-react-native';
import { Typography } from '../components/Typography';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { useAudioCleanup } from '../core/hooks/useAudioCleanup';
import {
  AudioService,
  type AmbientSoundscape,
  type BackgroundMusicCategory,
} from '../core/services/audio.service';
import { AiService } from '../core/services/ai.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { useTheme } from '../core/hooks/useTheme';

const { width: SW } = Dimensions.get('window');

// ─── Module-level animated components ────────────────────────────────────────
const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);
const AnimatedPath   = Reanimated.createAnimatedComponent(Path);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface MeditationProgram {
  id: string; title: string; eyebrow: string; category: string;
  durationMinutes: number; musicOptions: BackgroundMusicCategory[];
  ambientOptions: AmbientSoundscape[]; color: string;
  icon: React.ComponentType<any>; description: string;
  deeperDescription: string; focus: string[]; soundDesign: string[];
  guidance: string[]; aftercare: string; script?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAMS DATA  (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
const PROGRAMS: MeditationProgram[] = [
  {
    id: 'abundance', title: 'Medytacja obfitości', eyebrow: 'PRZEPŁYW I ODWAGA OTRZYMYWANIA',
    category: 'Obfitość', durationMinutes: 18,
    musicOptions: ['celestial', 'nature', 'serene'], ambientOptions: ['waves', 'forest', 'fire'],
    color: '#D9B56D', icon: Coins,
    description: 'Prowadzi z miejsca niedoboru do spokojnego poczucia zasobów, sprawczości i otwartości na więcej.',
    deeperDescription: 'To ścieżka dla osób, które chcą przestać reagować na pieniądze i możliwości z napięciem.',
    focus: ['przepływ finansowy', 'wdzięczność', 'rozszerzanie możliwości'],
    soundDesign: ['niebiański pad o długim oddechu', 'kojące fale jako warstwa tła', 'głos prowadzący z miękką pauzą'],
    guidance: [
      'Uspokój ciało i sprawdź, gdzie trzymasz napięcie związane z brakiem.',
      'Oddychaj tak, jakby każdy wdech robił więcej miejsca na dobro.',
      'Zakończ jedną decyzją, która potwierdza relację z obfitością.',
    ],
    aftercare: 'Po sesji wybierz jeden realny gest dostatku: porządek w finansach lub wdzięczność.',
    script: [
      'Usiądź wygodnie i zamknij oczy. Poczuj ciężar ciała na podłożu.',
      'Weź trzy głębokie oddechy, wypuszczając każdy wolno przez usta.',
      'Zauważ, gdzie w ciele trzymasz napięcie związane z pieniędzmi lub brakiem.',
      'Nie walcz z tym napięciem — po prostu je obserwuj z łagodnością.',
      'Wyobraź sobie złote światło, które wchodzi z każdym wdechem.',
      'To światło dotyka obszarów napięcia i delikatnie je rozluźnia.',
      'Pozwól sobie poczuć, że zasoby są dostępne.',
      'Przypomnij sobie trzy rzeczy, które już masz i za które możesz być wdzięczny.',
      'Poczuj w klatce piersiowej ciepło wdzięczności. Niech się rozszerza.',
      'Powiedz cicho: "Jestem otwarty na przepływ. Otrzymuję z łatwością."',
      'Wyobraź sobie siebie podejmującego decyzję finansową ze spokojem.',
      'Zostań przez chwilę w tym obrazie. Poczuj stabilność i pewność.',
      'Weź ostatni głęboki oddech i wróć do teraźniejszości ze spokojem w ciele.',
    ],
  },
  {
    id: 'health', title: 'Medytacja zdrowia i regeneracji', eyebrow: 'CIAŁO, ODDECH, POWRÓT DO RÓWNOWAGI',
    category: 'Zdrowie', durationMinutes: 20,
    musicOptions: ['healing', 'forestMist', 'relaxing'], ambientOptions: ['forest', 'waves', 'rain'],
    color: '#5BC98E', icon: HeartPulse,
    description: 'Miękka, somatyczna praktyka kierująca uwagę do miejsc przeciążonych i wymagających troski.',
    deeperDescription: 'Ta ścieżka nie próbuje "naprawiać" ciała siłą. Pomaga wrócić do jego sygnałów.',
    focus: ['oddech przeponowy', 'regulacja układu nerwowego', 'powrót do ciała'],
    soundDesign: ['ciepły leśny ambient', 'łagodny podkład relaksacyjny', 'cichy lektor w dłuższych odstępach'],
    guidance: [
      'Skanuj ciało bez oceniania i nazwij obszar, który potrzebuje wsparcia.',
      'Wydłuż wydech, aby ciało dostało wyraźny sygnał bezpieczeństwa.',
      'Zamknij sesję pytaniem: jaka forma troski byłaby dziś uzdrawiająca?',
    ],
    aftercare: 'Po medytacji napij się wody i daj ciału jedną konkretną odpowiedź.',
    script: [
      'Połóż się lub usiądź tak, aby ciało mogło w pełni się rozluźnić.',
      'Weź trzy wolne oddechy, z każdym wydechem pozwalając ciału osiąść głębiej.',
      'Zacznij od czubka głowy — czy czujesz tam napięcie lub ból?',
      'Przesuń uwagę do szyi i barków. Zauważ, co tam jest.',
      'Zejdź do klatki piersiowej. Jak pracuje dziś Twoje serce?',
      'Skieruj oddech do brzucha — to centrum Twojego układu nerwowego.',
      'Poczuj biodra, nogi, stopy — fundament Twojego ciała.',
      'Teraz wyślij ciepły, zielony oddech do miejsca, które potrzebuje wsparcia.',
      'Wyobraź sobie, że każdy wdech przynosi uzdrawiającą energię do tego miejsca.',
      'Powiedz do swojego ciała: "Dziękuję Ci. Słyszę Cię. Dbam o Ciebie."',
      'Zostań przez chwilę w tej ciszy i wdzięczności.',
      'Kiedy będziesz gotowy, delikatnie porusz palcami i wróć do teraźniejszości.',
    ],
  },
  {
    id: 'money', title: 'Medytacja pieniędzy i stabilności', eyebrow: 'UZIEMIENIE RELACJI Z MATERIĄ',
    category: 'Pieniądze', durationMinutes: 16,
    musicOptions: ['focus', 'motivating', 'zen'], ambientOptions: ['rain', 'fire', 'cave'],
    color: '#F2A74B', icon: Coins,
    description: 'Buduje spokojne poczucie bezpieczeństwa finansowego i pomaga wyjść z napięcia wokół zarabiania.',
    deeperDescription: 'To bardziej sesja regulacji niż motywacji. Przywraca poczucie gruntu.',
    focus: ['bezpieczeństwo', 'klarowność decyzji', 'stabilny dobrobyt'],
    soundDesign: ['miękki rytm focus', 'deszcz obniżający pobudzenie', 'jasny głos kierujący uwagę'],
    guidance: [
      'Poczuj podłogę pod stopami i wróć do realnych zasobów, które już istnieją.',
      'Oddychaj wolno i zauważ, że pieniądze nie muszą być związane z pośpiechem.',
      'Po sesji wybierz jedną konkretną decyzję porządkującą materię.',
    ],
    aftercare: 'Najlepiej działa wtedy, gdy po zakończeniu wykonasz jeden mały ruch w świecie materialnym.',
    script: [
      'Usiądź stabilnie, obydwie stopy płasko na podłodze.',
      'Poczuj kontakt stóp z ziemią — to Twój grunt, Twoja stabilność.',
      'Weź głęboki oddech i przy wydechu wyobraź sobie korzenie rosnące ze stóp.',
      'Przypomnij sobie zasoby, które już posiadasz — czas, umiejętności, relacje.',
      'Zauważ, jak ciało reaguje na słowo "pieniądze" — bez oceniania.',
      'Wyobraź sobie spokojną relację z finansami — stabilną, dojrzałą.',
      'Z każdym oddechem napięcie wokół pieniędzy delikatnie odpływa.',
      'Powiedz cicho: "Mam dostęp do wystarczających zasobów."',
      'Zostań w tej stabilności. Poczuj grunt pod sobą.',
      'Wróć do teraźniejszości z jedną klarowną intencją finansową na dziś.',
    ],
  },
  {
    id: 'cleansing', title: 'Medytacja oczyszczenia energii', eyebrow: 'UWOLNIENIE PRZECIĄŻENIA I CUDZEGO ŚLADU',
    category: 'Oczyszczenie', durationMinutes: 14,
    musicOptions: ['ritual', 'voxscape', 'deepMeditation'], ambientOptions: ['wind', 'fire', 'waves'],
    color: '#68D7C4', icon: Flower2,
    description: 'Pomaga odłożyć napięcie, cudze emocje i hałas dnia bez dramatycznego tonu.',
    deeperDescription: 'Zaprojektowana dla osób, które chłoną za dużo bodźców i potrzebują wrócić do centrum.',
    focus: ['granice energetyczne', 'powrót do centrum', 'domknięcie dnia'],
    soundDesign: ['rytualny pad w tle', 'wiatr jako warstwa oczyszczająca', 'krótkie guidance do wydechu'],
    guidance: [
      'Na każdym wydechu oddaj to, co nie jest Twoje.',
      'Wyobraź sobie, że wokół ciała robi się więcej czystej przestrzeni.',
      'Zakończ zdaniem granicy, które brzmi uczciwie i spokojnie.',
    ],
    aftercare: 'Po tej sesji nie wracaj od razu do hałasu. Daj sobie kilka minut bez ekranów.',
    script: [
      'Stań lub usiądź w sposób, który daje poczucie godności i stabilności.',
      'Weź głęboki wdech przez nos i powoli wydmuchnij przez usta — "haaa".',
      'Wyobraź sobie biały lub srebrny ogień otaczający Twoje ciało.',
      'Ten ogień nie parzy — oczyszcza, spala wszystko, co nie jest Twoje.',
      'Pomyśl o rozmowie lub sytuacji, która Cię dziś przeciążyła.',
      'Przy wydechu wyobraź sobie, że ta energia wraca do swojego źródła.',
      'Poczuj, jak Twoje pole energetyczne staje się klarowniejsze.',
      'Wyobraź sobie cienką, świetlistą granicę wokół ciała.',
      'Powiedz cicho: "Jestem sobą. To, co nie moje, odpływa."',
      'Weź jeszcze trzy oddechy oczyszczenia i wróć do teraźniejszości.',
    ],
  },
  {
    id: 'focus', title: 'Medytacja skupienia', eyebrow: 'JEDEN KIERUNEK, JEDEN RUCH',
    category: 'Skupienie', durationMinutes: 12,
    musicOptions: ['zen', 'focus', 'deepMeditation'], ambientOptions: ['cave', 'forest', 'waves'],
    color: '#76A8FF', icon: Brain,
    description: 'Czyści mentalny szum i zbiera uwagę wokół jednego zadania lub jednej intencji.',
    deeperDescription: 'Przeznaczona do pracy, nauki i decyzji. Daje klarowną, chłodniejszą przestrzeń mentalną.',
    focus: ['klarowność umysłu', 'redukcja rozproszeń', 'głęboka koncentracja'],
    soundDesign: ['stabilny focus loop', 'jaskiniowy ambience', 'rzadsze guidance'],
    guidance: [
      'Nie walcz z myślami. Zamiast tego zbieraj uwagę z powrotem do jednego punktu.',
      'Każdy powrót do oddechu to nie porażka, tylko trening uwagi.',
      'Po sesji zacznij od pierwszego małego kroku.',
    ],
    aftercare: 'Największy efekt daje przejście od razu do jednego zadania.',
    script: [
      'Usiądź prosto. Kręgosłup wyprostowany, ramiona swobodne.',
      'Wybierz jeden punkt skupienia — oddech, jedno słowo lub punkt przed sobą.',
      'Zamknij oczy i zacznij liczyć oddechy: wdech–wydech to jeden.',
      'Licz do dziesięciu, potem wracaj od jeden. Tylko to.',
      'Kiedy myśl przychodzi — zauważ ją bez oceniania i wróć do liczenia.',
      'Każdy powrót jest sukcesem. Trenowanie uwagi to jak trenowanie mięśni.',
      'Po kilku rundach przestań liczyć. Po prostu bądź z oddechem.',
      'Pozwól umysłowi być cichy. Nie wymagaj — tylko obserwuj.',
      'Wyobraź sobie klarowną, spokojną wodę. Żadnych fal.',
      'Wróć do zadania z jednym jasnym krokiem w głowie.',
    ],
  },
  {
    id: 'sleep', title: 'Medytacja snu', eyebrow: 'WYHAMOWANIE I MIĘKKIE WEJŚCIE W NOC',
    category: 'Sen', durationMinutes: 24,
    musicOptions: ['sleep', 'drift', 'serene'], ambientOptions: ['night', 'rain', 'waves'],
    color: '#9D8CFF', icon: BedDouble,
    description: 'Delikatna sesja do wieczornego wyciszenia i łagodnego zasypiania.',
    deeperDescription: 'Ma prowadzić układ nerwowy w dół, a nie wymuszać zaśnięcie.',
    focus: ['wyciszenie układu nerwowego', 'spowolnienie myśli', 'bezpieczne zasypianie'],
    soundDesign: ['sleep loop bez ostrych zmian', 'nocny ambience', 'cichy guidance'],
    guidance: [
      'Pozwól barkom opaść tak, jakby dzień dosłownie schodził z ciała.',
      'Nie próbuj zasnąć na siłę. Pozwól ciału usłyszeć, że niczego od niego nie chcesz.',
      'Zakończ zgodą na odpoczynek, nie walką o szybki efekt.',
    ],
    aftercare: 'Po sesji zostań bez telefonu.',
    script: [
      'Połóż się wygodnie w łóżku i zamknij oczy.',
      'Poczuj wagę swojego ciała — jak tonie w poduszce i materacu.',
      'Weź trzy bardzo powolne oddechy. Wydech dwa razy dłuższy od wdechu.',
      'Zacznij skanowanie ciała od czubka głowy — zwalniając każdą część.',
      'Czoło — rozluźnione. Szczęka — rozluźniona. Szyja — miękka.',
      'Barki opadają. Ręce ciężeją. Klatka piersiowa rozszerza się spokojnie.',
      'Brzuch, biodra, nogi — każda część odpuszcza napięcie dnia.',
      'Wyobraź sobie spokojne miejsce — ciepłe, bezpieczne, tylko Twoje.',
      'Nie musisz nic robić. Nie musisz nigdzie iść. Możesz po prostu być.',
      'Z każdym kolejnym wydechem stajesz się coraz cięższy i spokojniejszy.',
      'Pozwól myślom przepłynąć jak obłoki.',
      'Oddajesz się tej nocy. Jutro zadba o siebie samo.',
    ],
  },
  {
    id: 'anxiety', title: 'Medytacja ulgi w lęku', eyebrow: 'ODDECH, REGULACJA, POWRÓT DO TERAZ',
    category: 'Ukojenie', durationMinutes: 15,
    musicOptions: ['relaxing', 'healing', 'serene'], ambientOptions: ['rain', 'forest', 'waves'],
    color: '#F58EA8', icon: Shield,
    description: 'Praktyka stabilizująca przy napięciu, przeciążeniu i wzmożonym wewnętrznym alarmie.',
    deeperDescription: 'Projektowana tak, by nie przebodźcować. Pomaga zejść z alarmu w ciele.',
    focus: ['wydłużony wydech', 'bezpieczne zakotwiczenie', 'regulacja pobudzenia'],
    soundDesign: ['delikatny deszcz', 'spokojny podkład bez nagłych zmian', 'krótkie guidance'],
    guidance: [
      'Nazwij pięć rzeczy, które są teraz realne i bezpieczne.',
      'Wydychaj dłużej niż wdychasz, aby ciało dostało sygnał powrotu.',
      'Domknij sesję jednym zdaniem, które brzmi jak oparcie.',
    ],
    aftercare: 'Jeśli napięcie było duże, nie przechodź od razu do dużych bodźców.',
    script: [
      'Usiądź lub połóż się. Nie ma tutaj nic złego. Jesteś bezpieczny.',
      'Poczuj podłogę lub fotel pod ciałem — to jest realne i stabilne.',
      'Zacznij od 5 rzeczy, które widzisz. Nazywaj je powoli w myślach.',
      '4 rzeczy, które możesz dotknąć. Poczuj je — temperaturę, teksturę.',
      '3 dźwięki, które słyszysz. Pozwól im po prostu być.',
      '2 zapachy lub 2 oddechy z pełną uwagą.',
      '1 rzecz, za którą jesteś teraz wdzięczny — choć najmniejsza.',
      'Teraz: wdech przez 4 sekundy, wydech przez 7 sekund. Powtórz 5 razy.',
      'Poczuj, jak układ nerwowy dostaje sygnał: "Jest bezpiecznie."',
      'Powiedz cicho: "Jestem tu. Jestem teraz. Jestem bezpieczny."',
      'Zostań z tym spokojnym zdaniem przez chwilę.',
    ],
  },
  {
    id: 'gratitude', title: 'Medytacja wdzięczności', eyebrow: 'SERCE OTWARTE NA TO, CO JEST',
    category: 'Wdzięczność', durationMinutes: 10,
    musicOptions: ['serene', 'celestial', 'relaxing'], ambientOptions: ['forest', 'waves', 'fire'],
    color: '#F472B6', icon: Flower2,
    description: 'Miękka, serdeczna praktyka przebudzania wdzięczności.',
    deeperDescription: 'Wdzięczność nie jest ignorowaniem trudności. To świadome przeniesienie uwagi.',
    focus: ['otwarte serce', 'zauważanie dobra', 'regulacja nastroju'],
    soundDesign: ['ciepły leśny ambient', 'delikatny podkład melodyczny', 'miękkie prowadzenie'],
    guidance: [
      'Przypomnij sobie jeden moment z dnia, w którym czułeś się wspierany.',
      'Skup się na ciele: gdzie dziś dostałeś opiekę, spokój lub radość?',
      'Zamknij sesję jednym zdaniem: dziękuję za...',
    ],
    aftercare: 'Po sesji zapisz trzy konkretne osoby lub momenty wdzięczności.',
    script: [
      'Usiądź wygodnie i połóż dłoń na sercu.',
      'Poczuj bicie serca pod dłonią.',
      'Weź głęboki oddech i pomyśl: co w tym tygodniu poszło dobrze?',
      'Nawet małe rzeczy mają znaczenie. Herbata. Promień słońca.',
      'Przypomnij sobie osobę, która Cię wspiera lub inspiruje.',
      'Powiedz jej w myślach: "Dziękuję, że jesteś."',
      'Teraz pomyśl o swoim ciele — jak służy Ci każdego dnia.',
      'Powiedz sobie: "Dziękuję za każdy krok, każdy oddech, każdy dzień."',
      'Poczuj ciepło w klatce piersiowej — to jest wdzięczność.',
      'Wróć do teraźniejszości z otwartym sercem.',
    ],
  },
  {
    id: 'shadow', title: 'Medytacja integracji cienia', eyebrow: 'SPOTKANIE Z TYM, CO UKRYTE',
    category: 'Praca z cieniem', durationMinutes: 22,
    musicOptions: ['deepMeditation', 'ritual', 'voxscape'], ambientOptions: ['cave', 'rain', 'fire'],
    color: '#8B5CF6', icon: Brain,
    description: 'Jungowska praktyka łagodnego spotkania z odrzuconymi częściami siebie.',
    deeperDescription: 'Cień to nie zło. To wszystko, co uznaliśmy za niebezpieczne lub wstydliwe.',
    focus: ['akceptacja wewnętrznych sprzeczności', 'dialog z cieniem', 'integracja, nie walka'],
    soundDesign: ['głęboki ceremonialny ambient', 'długie pauzy', 'przestrzenny ton'],
    guidance: [
      'Zapytaj siebie: czego dziś się wstydzisz lub co starasz się nie czuć?',
      'Daj tej części siebie imię i zapytaj: czego chcesz?',
      'Nie próbuj zmieniać — tylko spotkać, usłyszeć i towarzyszyć.',
    ],
    aftercare: 'Po sesji daj sobie 5 minut ciszy i ewentualnie krótki zapis.',
    script: [
      'Usiądź w ciemnym lub półciemnym miejscu. Zamknij oczy.',
      'Weź trzy głębokie oddechy i pozwól ciału się uspokoić.',
      'Zapytaj siebie: co dziś ukrywam przed sobą lub przed innymi?',
      'Możesz poczuć opór. To normalne. Nie musisz wszystkiego wiedzieć.',
      'Wyobraź sobie, że po Twojej wewnętrznej stronie stoi postać — cień.',
      'Nie jest zła. Ona po prostu nie miała nigdy pozwolenia zaistnieć.',
      'Zapytaj ją łagodnie: "Czego potrzebujesz? Co chcesz mi powiedzieć?"',
      'Słuchaj bez oceniania. Bez dramatyzowania. Tylko słuchaj.',
      'Możesz powiedzieć: "Widzę Cię. Akceptuję, że jesteś częścią mnie."',
      'Nie musisz jej zmieniać — tylko spotkać.',
      'Weź głęboki oddech i wróć do teraźniejszości z otwartością.',
    ],
  },
  {
    id: 'morning_activation', title: 'Poranna aktywacja', eyebrow: 'PRZEBUDZENIE Z INTENCJĄ',
    category: 'Poranek', durationMinutes: 8,
    musicOptions: ['motivating', 'focus', 'zen'], ambientOptions: ['forest', 'waves', 'wind'],
    color: '#F59E0B', icon: Stars,
    description: 'Energetyzująca, krótka praktyka na start dnia.',
    deeperDescription: 'Zamiast scrollować, powitaj dzień świadomie. Te 8 minut ustawia ton całego dnia.',
    focus: ['energetyzacja ciała', 'ustawienie intencji', 'przebudzenie uwagi'],
    soundDesign: ['lekki motivating beat', 'naturalne dźwięki poranka', 'aktywne krótkie cue'],
    guidance: [
      'Trzy głębokie oddechy z pełnym wydechem — pobudź ciało.',
      'Jeden ruch rozciągający — powiedz ciału, że zaczyna się nowy dzień.',
      'Jedna intencja na dziś: nie zadanie, tylko jakość.',
    ],
    aftercare: 'Wychodząc z medytacji, przez 2 minuty żyj intencją, którą wybrałeś.',
    script: [
      'Wstań lub usiądź na krawędzi łóżka. Poczuj podłogę pod stopami.',
      'Przeciągnij się — ramiona do góry, weź pełny wdech.',
      'Przy wydechu opuść ramiona i poczuj, jak ciało się budzi.',
      'Zrób to trzy razy — powoli, z pełnym oddechem.',
      'Powiedz do siebie: "Dziś zaczynam nowy dzień."',
      'Wybierz jedną jakość na dziś: spokój, ciekawość, odwaga.',
      'Wyobraź sobie jeden moment dnia, w którym ta jakość będzie potrzebna.',
      'Poczuj ją w ciele — jak smakuje ta jakość jako stan.',
      'Weź głęboki oddech i wyraź zgodę na ten dzień.',
      'Wstań i rusz w dzień z tą intencją.',
    ],
  },
  {
    id: 'compassion', title: 'Medytacja samowspółczucia', eyebrow: 'ŁAGODNOŚĆ WOBEC SIEBIE',
    category: 'Samowspółczucie', durationMinutes: 16,
    musicOptions: ['forestMist', 'healing', 'serene'], ambientOptions: ['rain', 'forest', 'waves'],
    color: '#E879F9', icon: HeartPulse,
    description: 'Praktyka głębokiej łagodności wobec siebie.',
    deeperDescription: 'Samowspółczucie to fundament zdrowia psychicznego i punkt wyjścia do realnej zmiany.',
    focus: ['łagodność', 'akceptacja ograniczeń', 'wewnętrzny głos wsparcia'],
    soundDesign: ['ciepły, miękki podkład', 'łagodny głos', 'przestrzeń na emocje'],
    guidance: [
      'Co dziś było naprawdę trudne? Powiedz to wprost, bez minimalizowania.',
      'Co powiedziałbyś bliskiej osobie w tej samej sytuacji?',
      'Powiedz to teraz do siebie. Tak samo miękko.',
    ],
    aftercare: 'Po sesji napisz jedno zdanie troski dla siebie.',
    script: [
      'Usiądź wygodnie i połóż ręce na sercu lub kolanach.',
      'Weź trzy spokojne oddechy i pozwól ciału odpuścić.',
      'Pomyśl o czymś, co dziś było trudne lub czego się wstydzisz.',
      'Nie uciekaj od tego — zostań z tym uczuciem. To jest ludzkie.',
      'Powiedz sobie: "To boli. To jest trudne."',
      'Teraz pomyśl o bliskiej osobie w takiej samej sytuacji.',
      'Co byś jej powiedział? Jakim głosem? Z jaką miłością?',
      'Teraz powiedz to samo do siebie.',
      '"Robisz, co możesz. Jesteś wystarczający. Zasługujesz na troskę."',
      'Poczuj ciepło tych słów w klatce piersiowej.',
      'Weź jeszcze jeden oddech i pozwól sobie być niedoskonałym.',
    ],
  },
  {
    id: 'loving_kindness', title: 'Medytacja miłującej dobroci', eyebrow: 'METTA — MIŁOŚĆ BEZ WARUNKÓW',
    category: 'Metta', durationMinutes: 14,
    musicOptions: ['voxscape', 'healing', 'celestial'], ambientOptions: ['forest', 'waves', 'rain'],
    color: '#FB7185', icon: HeartPulse,
    description: 'Buddyjska praktyka metta — rozsyłania życzliwości do siebie i innych.',
    deeperDescription: 'Metta to ćwiczenie zdolności do życzliwości, która zaczyna się od siebie.',
    focus: ['bezwarunkowa życzliwość', 'przebaczenie', 'współczucie dla innych'],
    soundDesign: ['delikatny ambient leśny', 'miękki podkład', 'krótkie frazy życzliwości'],
    guidance: [
      'Zacznij od siebie — życzenia skierowane do siebie, nie do innych.',
      'Rozszerz życzliwość na kogoś bliskiego, potem na neutralną osobę.',
      'Na koniec — nawet na kogoś trudnego.',
    ],
    aftercare: 'Po sesji zanotuj, jak czujesz się w relacji z osobą, której wysyłałeś mettę.',
    script: [
      'Usiądź wygodnie. Zamknij oczy i skieruj uwagę do serca.',
      'Powiedz cicho do siebie: "Niech będę szczęśliwy. Niech będę bezpieczny."',
      '"Niech będę zdrowy. Niech żyję z łatwością."',
      'Powtórz te życzenia kilka razy. Poczuj je, nie tylko powiedz.',
      'Teraz pomyśl o osobie, którą kochasz. Wyobraź ją sobie.',
      '"Niech będzie szczęśliwa. Niech będzie bezpieczna."',
      'Teraz neutralna osoba — ktoś, kogo ledwo znasz.',
      'Wyślij jej te same życzenia z taką samą szczerością.',
      'Teraz osoba trudna. Ktoś, z kim masz konflikt.',
      '"Niech będzie szczęśliwa. Niech będzie bezpieczna."',
      'Na koniec: wszystkie istoty na Ziemi.',
      '"Niech wszystkie istoty żyją z łatwością i pokojem."',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// QUICK SESSIONS
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_SESSIONS = [
  { id: 'q1', label: '1 minuta', durationSeconds: 60, title: 'Chwila oddechu', color: '#76A8FF', icon: Wind, description: 'Jeden pełny cykl oddechowy — reset w 60 sekund.', script: 'Weź powolny wdech przez 4 sekundy. Zatrzymaj oddech na 2 sekundy. Wydech przez 6 sekund.' },
  { id: 'q2', label: '2 minuty', durationSeconds: 120, title: 'Zakotwiczenie', color: '#5BC98E', icon: Shield, description: 'Pięć zmysłów — szybka technika uziemienia.', script: 'Nazwij 5 rzeczy, które widzisz. 4 — które czujesz dotykiem. 3 — które słyszysz.' },
  { id: 'q3', label: '3 minuty', durationSeconds: 180, title: 'Spokojny umysł', color: '#D9B56D', icon: MoonStar, description: 'Prosta technika obserwacji myśli jak chmur.', script: 'Wyobraź sobie błękitne niebo. Myśli to chmury — przychodzą i odpływają.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURED PROGRAMS
// ─────────────────────────────────────────────────────────────────────────────
const STRUCTURED_PROGRAMS = [
  {
    id: 'p7', title: '7-dniowy fundament', duration: '7 dni', color: '#76A8FF',
    icon: Target, sessions: 7,
    description: 'Idealne dla osób zaczynających praktykę.',
    days: [
      { day: 1, title: 'Oddech i zakotwiczenie', programId: 'anxiety', desc: 'Naucz się regulować oddech.' },
      { day: 2, title: 'Skanowanie ciała', programId: 'health', desc: 'Wróć do kontaktu z ciałem.' },
      { day: 3, title: 'Skupienie i klarowność', programId: 'focus', desc: 'Trenuj uwagę.' },
      { day: 4, title: 'Wdzięczność', programId: 'gratitude', desc: 'Otwórz serce.' },
      { day: 5, title: 'Oczyszczenie energii', programId: 'cleansing', desc: 'Odłóż to, co nie Twoje.' },
      { day: 6, title: 'Samowspółczucie', programId: 'compassion', desc: 'Łagodność wobec siebie.' },
      { day: 7, title: 'Integracja i odnowa', programId: 'morning_activation', desc: 'Zamknij tydzień intencją.' },
    ],
  },
  {
    id: 'p21', title: '21-dniowa transformacja', duration: '21 dni', color: '#D9B56D',
    icon: TrendingUp, sessions: 21,
    description: 'Głęboki program zmiany nawyków mentalnych.',
    days: [
      { day: 1, title: 'Oddech jako fundament', programId: 'anxiety', desc: 'Regulacja układu nerwowego.' },
      { day: 2, title: 'Ciało i sygnały', programId: 'health', desc: 'Wróć do słuchania ciała.' },
      { day: 3, title: 'Skupienie', programId: 'focus', desc: 'Jeden punkt uwagi.' },
      { day: 4, title: 'Wdzięczność', programId: 'gratitude', desc: 'Zauważanie dobra w małym.' },
      { day: 5, title: 'Oczyszczenie', programId: 'cleansing', desc: 'Odłóż cudze energie.' },
      { day: 6, title: 'Samowspółczucie', programId: 'compassion', desc: 'Łagodność wobec siebie.' },
      { day: 7, title: 'Poranna intencja', programId: 'morning_activation', desc: 'Tydzień pierwszy zamknięty.' },
      { day: 8, title: 'Miłująca dobroć', programId: 'loving_kindness', desc: 'Rozszerz życzliwość.' },
      { day: 9, title: 'Praca z cieniem', programId: 'shadow', desc: 'Spotkaj ukryte części siebie.' },
      { day: 10, title: 'Stabilność finansowa', programId: 'money', desc: 'Uziemienie relacji z materią.' },
      { day: 11, title: 'Obfitość', programId: 'abundance', desc: 'Otwórz się na przepływ.' },
      { day: 12, title: 'Zdrowie i regeneracja', programId: 'health', desc: 'Głębsza somatyczna praca.' },
      { day: 13, title: 'Sen i odpoczynek', programId: 'sleep', desc: 'Naucz się naprawdę odpoczywać.' },
      { day: 14, title: 'Integracja tygodnia', programId: 'gratitude', desc: 'Połącz dwa tygodnie w całość.' },
      { day: 15, title: 'Integracja cienia II', programId: 'shadow', desc: 'Głębsze spotkanie z cieniem.' },
      { day: 16, title: 'Metta — życzliwość', programId: 'loving_kindness', desc: 'Rozszerz miłość.' },
      { day: 17, title: 'Skupienie zaawansowane', programId: 'focus', desc: 'Dłuższa sesja koncentracji.' },
      { day: 18, title: 'Oczyszczenie energetyczne', programId: 'cleansing', desc: 'Głębsze uwolnienie.' },
      { day: 19, title: 'Samowspółczucie II', programId: 'compassion', desc: 'Powrót do łagodności.' },
      { day: 20, title: 'Obfitość i sens', programId: 'abundance', desc: 'Poczucie pełni i kierunku.' },
      { day: 21, title: 'Zamknięcie i zobowiązanie', programId: 'morning_activation', desc: '21 dni za Tobą. Co dalej?' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GUIDED LIBRARY
// ─────────────────────────────────────────────────────────────────────────────
const GUIDED_LIBRARY = [
  { id: 'g_oddech', title: 'Oddech', color: '#76A8FF', icon: Wind, duration: '5–10 min', description: 'Podstawowa technika świadomego oddechu. Wdech przez nos, wydech przez usta.' },
  { id: 'g_skan', title: 'Skanowanie ciała', color: '#5BC98E', icon: Layers, duration: '15–20 min', description: 'Systematyczne przechodzenie uwagi przez każdą część ciała. Obserwacja bez oceniania.' },
  { id: 'g_uziemienie', title: 'Uziemienie', color: '#F2A74B', icon: Shield, duration: '8–12 min', description: 'Technika powrotu do teraźniejszości przez ciało i zmysły.' },
  { id: 'g_metta', title: 'Miłująca dobroć', color: '#FB7185', icon: HeartPulse, duration: '15–20 min', description: 'Buddyjska praktyka metta. Rozsyłanie życzliwości do siebie i innych.' },
  { id: 'g_wizualizacja', title: 'Wizualizacja', color: '#D9B56D', icon: Stars, duration: '12–18 min', description: 'Kierowana podróż wyobraźnią do bezpiecznego miejsca lub pożądanego stanu.' },
  { id: 'g_czakry', title: 'Czakry', color: '#8B5CF6', icon: Flower2, duration: '20–30 min', description: 'Praca z siedmioma energetycznymi centrami ciała.' },
  { id: 'g_mantra', title: 'Mantra', color: '#68D7C4', icon: Music, duration: '10–20 min', description: 'Powtarzanie świętego słowa lub frazy. "So Hum", "Om", "Sat Nam".' },
  { id: 'g_vipassana', title: 'Vipassana', color: '#F472B6', icon: Brain, duration: '20–45 min', description: 'Wgląd — obserwacja powstawania i znikania doznań bez przywiązania.' },
  { id: 'g_transcendentalna', title: 'Transcendentalna', color: '#F59E0B', icon: MoonStar, duration: '20 min', description: 'Technika z mantrą. Delikatne zanurzenie w ciszy transcendentnej.' },
  { id: 'g_zen', title: 'Zen / Zazen', color: '#9D8CFF', icon: Waves, duration: '20–40 min', description: 'Siedzenie w pustce bez obiektu. Sama obecność, bez celu.' },
  { id: 'g_jungian', title: 'Jungowska', color: '#8B5CF6', icon: BookOpen, duration: '25–35 min', description: 'Praca z aktywną wyobraźnią. Dialog z symbolami i archetypami.' },
  { id: 'g_kosmiczna', title: 'Kosmiczna', color: '#818CF8', icon: Sparkles, duration: '15–25 min', description: 'Rozszerzanie świadomości poza ciało — do galaktyk, do pierwotnej ciszy.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MILESTONES / DAILY TECHNIQUES / TIPS
// ─────────────────────────────────────────────────────────────────────────────
const MILESTONES = [
  { days: 7, label: '7 dni z rzędu', icon: '🌱', color: '#5BC98E' },
  { days: 21, label: '21 dni z rzędu', icon: '🔥', color: '#F2A74B' },
  { days: 108, label: '108 dni z rzędu', icon: '✨', color: '#D9B56D' },
];

const DAILY_TECHNIQUES = [
  { programId: 'morning_activation', label: 'Poranna aktywacja', benefit: 'Niedziela — idealna chwila na intencjonalne przebudzenie.', color: '#F59E0B' },
  { programId: 'focus', label: 'Medytacja skupienia', benefit: 'Poniedziałek — wejdź w tydzień z jednym wyraźnym kierunkiem.', color: '#76A8FF' },
  { programId: 'abundance', label: 'Medytacja obfitości', benefit: 'Wtorek — otwórz się na przepływ możliwości.', color: '#D9B56D' },
  { programId: 'health', label: 'Regeneracja i zdrowie', benefit: 'Środa — daj ciału sygnał bezpieczeństwa.', color: '#5BC98E' },
  { programId: 'cleansing', label: 'Oczyszczenie energii', benefit: 'Czwartek — wejdź w weekend lżejszy.', color: '#68D7C4' },
  { programId: 'gratitude', label: 'Medytacja wdzięczności', benefit: 'Piątek — zamknij tydzień z godnością i ciepłem.', color: '#F472B6' },
  { programId: 'sleep', label: 'Medytacja snu', benefit: 'Sobota — czas bez alarmu. Daj ciału naprawdę wypocząć.', color: '#9D8CFF' },
];

const PRACTICE_TIPS = [
  { title: 'Oddech jako kotwica', body: 'Kiedy umysł odpływa — wróć do oddechu bez oceniania siebie. Każdy powrót to sam trening uwagi.' },
  { title: 'Czas trwania nie jest ważniejszy od jakości', body: 'Pięć minut pełnej obecności działa głębiej niż dwadzieścia minut błądzenia myślami.' },
  { title: 'Po sesji — nie chwytaj od razu telefonu', body: 'Pierwsze dwie minuty po medytacji to czas, gdy to, co wewnętrzne, wciąż jest dostępne.' },
];

const MOOD_OPTIONS = [
  { id: 1, icon: Frown,    label: 'Trudno'   },
  { id: 2, icon: Meh,      label: 'Neutral'  },
  { id: 3, icon: Smile,    label: 'Dobrze'   },
  { id: 4, icon: Sparkles, label: 'Świetnie' },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const formatDuration = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

const MUSIC_LABELS: Record<string, string> = {
  forestMist: 'Leśna mgła', deepMeditation: 'Głęboka', serene: 'Serene', drift: 'Drift',
  voxscape: 'Voxscape', nature: 'Natura', healing: 'Healing', zen: 'Zen',
  celestial: 'Celestial', relaxing: 'Ukojenie', focus: 'Fokus', motivating: 'Impuls',
  sleep: 'Sen', ritual: 'Rytuał',
};

const AMBIENT_LABELS: Record<string, string> = {
  waves: 'Fale', forest: 'Las', rain: 'Deszcz', fire: 'Ogień',
  wind: 'Wiatr', night: 'Noc', cave: 'Jaskinia', ritual: 'Rytuał',
};

// ─────────────────────────────────────────────────────────────────────────────
// BREATHING CIRCLE — THE WOW CENTERPIECE
// ─────────────────────────────────────────────────────────────────────────────
const ORBC = 100; // center offset
const ORB_SVG = 200;

// Phase colours: inhale → hold → exhale → hold
const BREATH_PHASE_COLORS = ['#818CF8', '#A78BFA', '#4ADE80', '#FBBF24'];
const BREATH_PHASE_LABELS = ['WDECH', 'ZATRZYMAJ', 'WYDECH', 'ZATRZYMAJ'];

interface BreathingOrbProps {
  isRunning: boolean;
  color: string;
  progress: number; // 0..1 session progress
  remainingSeconds: number;
  totalSeconds: number;
}

// MODULE LEVEL animated components (already declared above)

const BreathingOrb: React.FC<BreathingOrbProps> = ({ isRunning, color, progress, remainingSeconds, totalSeconds }) => {
  const [breathPhase, setBreathPhase] = useState(0);
  const [breathCount, setBreathCount] = useState(4);
  const phaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reanimated values
  const outerRot    = useSharedValue(0);
  const innerScale  = useSharedValue(1);
  const glowOpacity = useSharedValue(0.15);
  const dashOffset  = useSharedValue(0);

  useEffect(() => {
    if (isRunning) {
      outerRot.value = withRepeat(withTiming(360, { duration: 18000, easing: Easing.linear }), -1, false);
      dashOffset.value = withRepeat(withTiming(-300, { duration: 6000, easing: Easing.linear }), -1, false);
      innerScale.value = withRepeat(
        withSequence(
          withTiming(1.22, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.82, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, false,
      );
      glowOpacity.value = withRepeat(
        withSequence(withTiming(0.40, { duration: 4000 }), withTiming(0.10, { duration: 4000 })),
        -1, false,
      );
    } else {
      cancelAnimation(outerRot);
      cancelAnimation(dashOffset);
      cancelAnimation(innerScale);
      cancelAnimation(glowOpacity);
      outerRot.value    = withTiming(0, { duration: 800 });
      innerScale.value  = withTiming(1, { duration: 600 });
      glowOpacity.value = withTiming(0.10, { duration: 600 });
    }
  }, [isRunning]);

  // Phase cycling timer
  useEffect(() => {
    if (!isRunning) {
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
      setBreathPhase(0);
      setBreathCount(4);
      return;
    }
    let phase = 0;
    let count = 4;
    setBreathPhase(0); setBreathCount(4);
    phaseTimerRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        phase = (phase + 1) % 4;
        count = 4;
        setBreathPhase(phase);
        setBreathCount(count);
      } else {
        setBreathCount(count);
      }
    }, 1000);
    return () => { if (phaseTimerRef.current) clearInterval(phaseTimerRef.current); };
  }, [isRunning]);

  // Animated props for the outer dashed ring
  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${outerRot.value}deg` }],
  }));

  // Inner orb scale (outer wrapper, no entering)
  const innerOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const phaseColor = isRunning ? BREATH_PHASE_COLORS[breathPhase] : color;
  const phaseLabel = isRunning ? BREATH_PHASE_LABELS[breathPhase] : 'GOTOWY';

  // Session progress arc
  const ARC_R = 96;
  const ARC_CIRCUM = 2 * Math.PI * ARC_R;
  const arcProgress = Math.min(progress, 1);
  const arcDashoffset = ARC_CIRCUM * (1 - arcProgress);

  // Particle positions (15 fixed)
  const PARTICLES = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const angle = (i / 15) * 360;
      const rad = (angle * Math.PI) / 180;
      const r = 82 + (i % 3) * 12;
      return { x: ORBC + r * Math.cos(rad), y: ORBC + r * Math.sin(rad), r: 1.5 + (i % 3) * 0.5 };
    });
  }, []);

  return (
    <View style={{ width: ORB_SVG, height: ORB_SVG, alignSelf: 'center' }}>
      {/* Glow layer (outer wrapper only, no entering) */}
      <Reanimated.View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }, glowStyle]}>
        <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: phaseColor }} />
      </Reanimated.View>

      {/* Outer rotating dashed ring */}
      <Reanimated.View style={[StyleSheet.absoluteFillObject, outerRingStyle]}>
        <Svg width={ORB_SVG} height={ORB_SVG}>
          <Circle
            cx={ORBC} cy={ORBC} r={90}
            stroke={phaseColor + '55'} strokeWidth={1.5}
            fill="none" strokeDasharray="8 5"
          />
          {PARTICLES.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={p.r} fill={phaseColor + '88'} />
          ))}
        </Svg>
      </Reanimated.View>

      {/* Progress arc — static (no transform) */}
      <View style={StyleSheet.absoluteFillObject}>
        <Svg width={ORB_SVG} height={ORB_SVG}>
          {/* Track */}
          <Circle cx={ORBC} cy={ORBC} r={ARC_R} stroke={phaseColor + '18'} strokeWidth={3} fill="none" />
          {/* Progress */}
          <Circle
            cx={ORBC} cy={ORBC} r={ARC_R}
            stroke={phaseColor} strokeWidth={3} fill="none"
            strokeDasharray={`${ARC_CIRCUM}`}
            strokeDashoffset={arcDashoffset}
            strokeLinecap="round"
            rotation="-90"
            originX={ORBC} originY={ORBC}
          />
        </Svg>
      </View>

      {/* Middle ring pulsing — outer wrapper no entering, inner has transform */}
      <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
        <Reanimated.View style={innerOrbStyle}>
          <Svg width={160} height={160}>
            <Circle cx={80} cy={80} r={68} stroke={phaseColor + '44'} strokeWidth={2} fill="none" strokeDasharray="15 6" />
            <Circle cx={80} cy={80} r={52} stroke={phaseColor + '66'} strokeWidth={1.5} fill="none" />
          </Svg>
        </Reanimated.View>
      </View>

      {/* Inner filled gradient circle */}
      <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{ width: 100, height: 100, borderRadius: 50, overflow: 'hidden', borderWidth: 1.5, borderColor: phaseColor + '55' }}>
          <LinearGradient
            colors={[phaseColor + 'CC', phaseColor + '66', phaseColor + '22']}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' }}>
              {phaseLabel}
            </Text>
            {isRunning && (
              <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '800', marginTop: 2 }}>
                {breathCount}
              </Text>
            )}
          </LinearGradient>
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETION BURST
// ─────────────────────────────────────────────────────────────────────────────
const CompletionBurst: React.FC<{ color: string }> = ({ color }) => {
  const stars = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const r = 60 + (i % 3) * 20;
    return {
      x: 80 + r * Math.cos((angle * Math.PI) / 180),
      y: 80 + r * Math.sin((angle * Math.PI) / 180),
    };
  }), []);
  return (
    <View style={{ alignItems: 'center', marginVertical: 16 }}>
      <Svg width={160} height={160}>
        {stars.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={3 + (i % 4)} fill={color + 'CC'} />
        ))}
        <Circle cx={80} cy={80} r={40} fill={color + '22'} stroke={color} strokeWidth={1.5} />
        <Path d="M74 80 l6-10 l6 10 l-6 4z" fill={color} />
      </Svg>
      <Text style={{ color, fontSize: 18, fontWeight: '800', letterSpacing: 1, marginTop: 4 }}>
        Sesja zakończona ✦
      </Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export const MeditationScreen: React.FC = ({ navigation }) => {
  const { t } = useTranslation();
  useAudioCleanup();
  const insets = useSafeAreaInsets();
  const meditationSessions  = useAppStore((s) => s.meditationSessions);
  const addMeditationSession = useAppStore((s) => s.addMeditationSession);
  const addFavoriteItem    = useAppStore((s) => s.addFavoriteItem);
  const isFavoriteItem     = useAppStore((s) => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore((s) => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const theme = currentTheme;

  const accent    = '#818CF8';
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor  = isLight ? '#6A5A48' : '#B0A393';
  const cardBg    = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.10)';
  const divColor  = isLight ? 'rgba(122,95,54,0.14)' : 'rgba(255,255,255,0.07)';
  const chipBg    = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)';

  // ─── Session state ───
  const [selectedId,    setSelectedId]    = useState(PROGRAMS[0].id);
  const [isRunning,     setIsRunning]     = useState(false);
  const [elapsed,       setElapsed]       = useState(0);
  const [musicBlend,    setMusicBlend]    = useState<'music' | 'ambient' | 'immersive'>('immersive');
  const [selectedMusic, setSelectedMusic] = useState<BackgroundMusicCategory>(PROGRAMS[0].musicOptions[0]);
  const [selectedAmbient, setSelectedAmbient] = useState<AmbientSoundscape>(PROGRAMS[0].ambientOptions[0]);
  const [expandedTip,   setExpandedTip]   = useState<number | null>(null);
  const [medAiInsight,  setMedAiInsight]  = useState<string>('');
  const [medAiLoading,  setMedAiLoading]  = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // ─── Pre/Post check-in ───
  const [showPreCheckIn,     setShowPreCheckIn]     = useState(false);
  const [showPostReflection, setShowPostReflection] = useState(false);
  const [preMood,            setPreMood]            = useState<number | null>(null);
  const [preEnergy,          setPreEnergy]          = useState(5);
  const [postMood,           setPostMood]           = useState<number | null>(null);
  const [starRating,         setStarRating]         = useState(0);
  const [insightNote,        setInsightNote]        = useState('');

  // ─── Quick sessions ───
  const [activeQuickId, setActiveQuickId] = useState<string | null>(null);
  const [quickElapsed,  setQuickElapsed]  = useState(0);
  const quickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Mute / body scan ───
  const [isMuted,       setIsMuted]       = useState(false);
  const [showBodyScan,  setShowBodyScan]  = useState(false);
  const [bodyScanStep,  setBodyScanStep]  = useState(0);
  const bodyScanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Library / programs expand ───
  const [expandedLibraryId,  setExpandedLibraryId]  = useState<string | null>(null);
  const [expandedProgramId,  setExpandedProgramId]  = useState<string | null>(null);

  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const cueIndexRef    = useRef(0);
  const scrollRef      = useRef<ScrollView>(null);
  const sessionAnchorY = useRef(0);
  const lastTap        = useRef({ id: '', at: 0 });

  const program = useMemo(() => PROGRAMS.find((p) => p.id === selectedId) || PROGRAMS[0], [selectedId]);
  const totalSeconds      = program.durationMinutes * 60;
  const remainingSeconds  = Math.max(totalSeconds - elapsed, 0);
  const progress          = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  const Icon              = program.icon;
  const BODY_SCAN_STEPS: string[] = program.script || PROGRAMS[1].script || [];

  // ─── Stats ───
  const totalMinutes = useMemo(() => meditationSessions.reduce((s, r) => s + (r.durationMinutes || 0), 0), [meditationSessions]);
  const avgLength    = useMemo(() => meditationSessions.length > 0 ? Math.round(totalMinutes / meditationSessions.length) : 0, [meditationSessions, totalMinutes]);
  const favTechnique = useMemo(() => {
    const counts: Record<string, number> = {};
    meditationSessions.forEach((s) => { counts[s.technique] = (counts[s.technique] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : '—';
  }, [meditationSessions]);
  const streak = useMemo(() => {
    const dates = [...new Set(meditationSessions.map((s) => s.date.slice(0, 10)))].sort().reverse();
    if (dates.length === 0) return 0;
    let count = 0;
    const cursor = new Date();
    for (const d of dates) {
      if (d === cursor.toISOString().slice(0, 10)) { count++; cursor.setDate(cursor.getDate() - 1); } else break;
    }
    return count;
  }, [meditationSessions]);
  const nextMilestone = useMemo(() => MILESTONES.find((m) => m.days > streak) || MILESTONES[MILESTONES.length - 1], [streak]);
  const monthlyData   = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const key   = d.toISOString().slice(0, 10);
      const label = ['Nd','Pn','Wt','Śr','Cz','Pt','Sb'][d.getDay()];
      const count = meditationSessions.filter((s) => s.date.slice(0, 10) === key).length;
      return { label, count };
    });
  }, [meditationSessions]);
  const maxBarCount   = Math.max(...monthlyData.map((d) => d.count), 1);
  const dailyTechnique = useMemo(() => DAILY_TECHNIQUES[new Date().getDay()], []);

  // ─── Audio + session ───
  const toggleMute = useCallback(async () => {
    if (isMuted) {
      if (isRunning) {
        if (musicBlend === 'music' || musicBlend === 'immersive') await AudioService.playMusicForSession(selectedMusic);
        if (musicBlend === 'ambient' || musicBlend === 'immersive') await AudioService.playAmbientForSession(selectedAmbient);
      }
    } else {
      await AudioService.stopSessionAudioImmediately();
    }
    setIsMuted((m) => !m);
  }, [isMuted, isRunning, musicBlend, selectedMusic, selectedAmbient]);

  const scrollToSession = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(sessionAnchorY.current - 24, 0), animated: true }), 140);
  }, []);

  const stopSession = useCallback(async () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsRunning(false);
    cueIndexRef.current = 0;
    await AudioService.stopSessionAudioImmediately();
  }, []);

  const handleSessionComplete = useCallback(async () => {
    await stopSession();
    const sessionMinutes = Math.max(Math.round(elapsed / 60), 1);
    addMeditationSession({ id: Date.now().toString(), date: new Date().toISOString(), durationMinutes: sessionMinutes, technique: program.title });
    setElapsed(0);
    setShowCompleted(true);
    setTimeout(() => { setShowCompleted(false); setShowPostReflection(true); }, 2200);
  }, [addMeditationSession, elapsed, program.title, stopSession]);

  const startSession = useCallback(async () => {
    await stopSession();
    setIsMuted(false);
    setShowCompleted(false);
    setIsRunning(true);
    scrollToSession();
    if (musicBlend === 'music' || musicBlend === 'immersive') { AudioService.setUserInteracted(); await AudioService.playMusicForSession(selectedMusic); }
    if (musicBlend === 'ambient' || musicBlend === 'immersive') { AudioService.setUserInteracted(); await AudioService.playAmbientForSession(selectedAmbient); }
    intervalRef.current = setInterval(() => {
      setElapsed((v) => {
        const next = v + 1;
        if (next >= totalSeconds) { void handleSessionComplete(); return totalSeconds; }
        return next;
      });
    }, 1000);
  }, [handleSessionComplete, musicBlend, scrollToSession, selectedAmbient, selectedMusic, stopSession, totalSeconds]);

  useEffect(() => { setSelectedMusic(program.musicOptions[0]); setSelectedAmbient(program.ambientOptions[0]); }, [program]);
  useEffect(() => { if (!isRunning) void AudioService.primeSessionAudio(selectedMusic, selectedAmbient, program.musicOptions); }, [selectedAmbient, selectedMusic, program.musicOptions, isRunning]);
  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (quickIntervalRef.current) clearInterval(quickIntervalRef.current);
    if (bodyScanIntervalRef.current) clearInterval(bodyScanIntervalRef.current);
  }, []);

  const chooseProgram = useCallback((id: string) => {
    if (isRunning) return;
    const now = Date.now();
    lastTap.current = { id, at: now };
    setSelectedId(id);
    const next = PROGRAMS.find((p) => p.id === id);
    if (next) { setSelectedMusic(next.musicOptions[0]); setSelectedAmbient(next.ambientOptions[0]); void AudioService.primeSessionAudio(next.musicOptions[0], next.ambientOptions[0], next.musicOptions); }
    scrollToSession();
  }, [isRunning, scrollToSession]);

  // ─── Quick sessions ───
  const startQuickSession = useCallback(async (id: string) => {
    if (quickIntervalRef.current) { clearInterval(quickIntervalRef.current); quickIntervalRef.current = null; }
    const qs = QUICK_SESSIONS.find((s) => s.id === id);
    if (!qs) return;
    setActiveQuickId(id); setQuickElapsed(0);
    AudioService.setUserInteracted();
    await AudioService.playAmbientForSession('forest');
    quickIntervalRef.current = setInterval(() => {
      setQuickElapsed((v) => {
        if (v + 1 >= qs.durationSeconds) { clearInterval(quickIntervalRef.current!); setActiveQuickId(null); void AudioService.stopSessionAudioImmediately(); return 0; }
        return v + 1;
      });
    }, 1000);
  }, []);

  const stopQuickSession = useCallback(async () => {
    if (quickIntervalRef.current) { clearInterval(quickIntervalRef.current); quickIntervalRef.current = null; }
    setActiveQuickId(null); setQuickElapsed(0);
    await AudioService.stopSessionAudioImmediately();
  }, []);

  // ─── Body scan ───
  const startBodyScan = useCallback(() => {
    if (BODY_SCAN_STEPS.length === 0) return;
    setShowBodyScan(true); setBodyScanStep(0);
    let step = 0;
    bodyScanIntervalRef.current = setInterval(() => {
      step++;
      if (step >= BODY_SCAN_STEPS.length) { clearInterval(bodyScanIntervalRef.current!); return; }
      setBodyScanStep(step);
    }, 12000);
  }, [BODY_SCAN_STEPS]);

  const stopBodyScan = useCallback(() => {
    if (bodyScanIntervalRef.current) { clearInterval(bodyScanIntervalRef.current); bodyScanIntervalRef.current = null; }
    setShowBodyScan(false); setBodyScanStep(0);
  }, []);

  // ─── AI insight ───
  const fetchMedAi = useCallback(async () => {
    setMedAiLoading(true);
    try {
      const prompt = `Medytacja: ${program.title}. Kategoria: ${program.category}. Czas: ${program.durationMinutes} min. Napisz krótką (3-4 zdania) personalizowaną wskazówkę jak najgłębiej wejść w tę sesję medytacyjną.`;
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight('Błąd pobierania wskazówki.');
    } finally {
      setMedAiLoading(false);
    }
  }, [program]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={[sh.container, { backgroundColor: theme.background }]}>
      {/* Cosmic background gradient */}
      <LinearGradient
        colors={isLight ? ['#FBF7FF', '#F0EBFF', '#EBF0FF'] : ['#06040F', '#0C0F1E', '#111628']}
        style={StyleSheet.absoluteFill}
      />
      {/* Program colour tint */}
      <LinearGradient
        colors={[program.color + '18', 'transparent', program.color + '0A']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top']} style={sh.safeArea}>
        {/* ── Header ── */}
        <View style={[sh.header, { borderBottomColor: divColor }]}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} hitSlop={14} style={sh.backBtn}>
            <ChevronLeft color={subColor} size={22} strokeWidth={1.8} />
          </Pressable>
          <Text style={[sh.headerTitle, { color: textColor }]}>{t('meditation.title', 'Medytacja')}</Text>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <MusicToggleButton color={accent} size={19} />
            <Pressable onPress={toggleMute} hitSlop={14}>
              {isMuted ? <VolumeX color={accent} size={19} strokeWidth={1.8} /> : <Volume2 color={accent + '88'} size={19} strokeWidth={1.8} />}
            </Pressable>
            <Pressable
              onPress={() => {
                if (isFavoriteItem('meditation')) removeFavoriteItem('meditation');
                else addFavoriteItem({ id: 'meditation', label: 'Medytacja', route: 'Meditation', params: {}, icon: 'MoonStar', color: accent, addedAt: new Date().toISOString() });
              }}
              hitSlop={14}
            >
              <Star color={isFavoriteItem('meditation') ? accent : accent + '88'} size={19} strokeWidth={1.8} fill={isFavoriteItem('meditation') ? accent : 'none'} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[sh.scrollContent, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') + 26 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ═══════════════════════════════════════════════════
              HERO — cosmic header
          ═══════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(0)} style={sh.heroSection}>
            <View style={sh.heroTop}>
              <View style={[sh.heroIcon, { backgroundColor: program.color + '18', borderColor: program.color + '44' }]}>
                <Icon color={program.color} size={26} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[sh.eyebrow, { color: program.color }]}>{program.eyebrow}</Text>
                <Text style={[sh.heroTitle, { color: textColor }]}>{t('meditation.medytacja_premium', 'Medytacja premium')}</Text>
              </View>
            </View>
            <Text style={[sh.heroBody, { color: subColor }]}>
              {t('meditation.kazda_sciezka_ma_wlasny_pejzaz', 'Każda ścieżka ma własny pejzaż dźwiękowy, rytm guidance i wyraźną intencję. To ceremonia z właściwym tonem, ciszą i słowem.')}
            </Text>
            <View style={sh.metricsRow}>
              {[
                { icon: MoonStar, label: `${program.durationMinutes} min` },
                { icon: Volume2,  label: 'ciągłe audio'     },
                { icon: Stars,    label: 'immersyjny ambient'},
              ].map((item) => {
                const MI = item.icon;
                return (
                  <View key={item.label} style={[sh.metricPill, { borderColor: program.color + '36', backgroundColor: program.color + '0D' }]}>
                    <MI color={program.color} size={13} />
                    <Text style={[sh.metricLabel, { color: program.color }]}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════
              STATS RAIL
          ═══════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(30)} style={[sh.statRail, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {[
              { icon: Clock,    val: totalMinutes,            label: 'minut łącznie', color: accent              },
              { icon: BarChart2, val: avgLength,              label: 'avg min',        color: accent              },
              { icon: Flame,    val: streak,                  label: 'dni z rzędu',    color: streak > 0 ? '#F2A74B' : subColor },
              { icon: Trophy,   val: meditationSessions.length, label: 'sesji',        color: accent              },
            ].map((item, i) => {
              const SI = item.icon;
              return (
                <React.Fragment key={i}>
                  {i > 0 && <View style={[sh.statDivider, { backgroundColor: divColor }]} />}
                  <View style={sh.statItem}>
                    <SI color={item.color} size={15} strokeWidth={1.7} />
                    <Text style={[sh.statValue, { color: textColor }]}>{item.val}</Text>
                    <Text style={[sh.statLabel, { color: subColor }]}>{item.label}</Text>
                  </View>
                </React.Fragment>
              );
            })}
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════
              STREAK + MILESTONES
          ═══════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(50)} style={[sh.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={sh.cardHeader}>
              <Flame color="#F2A74B" size={14} strokeWidth={1.7} />
              <Text style={[sh.eyebrow, { color: subColor }]}>{t('meditation.streak', 'SERIA').toUpperCase()}</Text>
            </View>
            <View style={sh.streakRow}>
              <View style={sh.streakBadge}>
                <Text style={sh.streakCount}>{streak}</Text>
                <Text style={[sh.streakDaysLabel, { color: subColor }]}>{t('meditation.dni_z_rzedu', 'dni z rzędu')}</Text>
              </View>
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={[sh.streakNextLabel, { color: subColor }]}>{t('meditation.nastepny_kamien_milowy', 'Następny kamień:')}</Text>
                <View style={[sh.milestoneRow, { borderColor: nextMilestone.color + '44', backgroundColor: nextMilestone.color + '0E' }]}>
                  <Text style={{ fontSize: 15 }}>{nextMilestone.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[sh.milestoneLabel, { color: textColor }]}>{nextMilestone.label}</Text>
                    <Text style={[sh.milestoneRemaining, { color: subColor }]}>{Math.max(nextMilestone.days - streak, 0)} dni do celu</Text>
                  </View>
                </View>
                <View style={[sh.milestoneTrack, { backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)' }]}>
                  <View style={[sh.milestoneFill, { width: `${Math.min((streak / nextMilestone.days) * 100, 100)}%`, backgroundColor: nextMilestone.color }]} />
                </View>
              </View>
            </View>
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════
              WEEKLY CHART
          ═══════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(70)} style={[sh.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={sh.cardHeader}>
              <Calendar color={accent} size={14} strokeWidth={1.7} />
              <Text style={[sh.eyebrow, { color: subColor }]}>{t('meditation.aktywnosc_7_dni', 'AKTYWNOŚĆ — 7 DNI')}</Text>
            </View>
            <View style={sh.chartRow}>
              {monthlyData.map((day, i) => (
                <View key={i} style={sh.chartCol}>
                  <View style={[sh.chartBarTrack, { backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)' }]}>
                    <View style={[sh.chartBar, { height: `${(day.count / maxBarCount) * 100}%`, backgroundColor: day.count > 0 ? accent : 'transparent' }]} />
                  </View>
                  <Text style={[sh.chartLabel, { color: subColor }]}>{day.label}</Text>
                  {day.count > 0 && <View style={[sh.chartDot, { backgroundColor: accent }]} />}
                </View>
              ))}
            </View>
            <Text style={[sh.chartLegendText, { color: subColor, borderTopColor: divColor }]}>
              Ulubiona technika: <Text style={{ color: textColor }}>{favTechnique}</Text>
            </Text>
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════
              DAILY TECHNIQUE
          ═══════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(50)}
            style={[sh.dailyCard, { backgroundColor: dailyTechnique.color + '0F', borderColor: dailyTechnique.color + '40' }]}
          >
            <LinearGradient colors={[dailyTechnique.color + '1A', 'transparent']} style={StyleSheet.absoluteFill} />
            <View style={sh.dailyHeader}>
              <Sparkles color={dailyTechnique.color} size={13} strokeWidth={1.7} />
              <Text style={[sh.eyebrow, { color: dailyTechnique.color }]}>{t('meditation.polecana_technika_dnia', '✦ POLECANA TECHNIKA DNIA')}</Text>
            </View>
            <Text style={[sh.dailyTitle, { color: textColor }]}>{dailyTechnique.label}</Text>
            <Text style={[sh.dailyBenefit, { color: subColor }]}>{dailyTechnique.benefit}</Text>
            <Pressable
              onPress={() => { if (!isRunning) chooseProgram(dailyTechnique.programId); }}
              style={[sh.dailyBtn, { backgroundColor: dailyTechnique.color }]}
            >
              <ArrowRight color="#fff" size={14} strokeWidth={2} />
              <Text style={sh.dailyBtnText}>{t('meditation.wybierz_te_technike', 'Wybierz tę technikę')}</Text>
            </Pressable>
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════
              MICRO SESSIONS
          ═══════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(30)}>
            <View style={sh.sectionHeaderRow}>
              <Zap color={accent} size={13} strokeWidth={1.9} />
              <Text style={[sh.eyebrow, { color: subColor }]}>{t('meditation.micro_sesje', 'MICRO SESJE')}</Text>
            </View>
            <Text style={[sh.sectionTitle, { color: textColor }]}>{t('meditation.szybka_chwila_spokoju', 'Szybka chwila spokoju')}</Text>
            <Text style={[sh.sectionBody, { color: subColor }]}>{t('meditation.1_2_lub_3_minuty', '1, 2 lub 3 minuty — natychmiastowy reset.')}</Text>
            <View style={sh.quickGrid}>
              {QUICK_SESSIONS.map((qs) => {
                const QI = qs.icon;
                const isActive = activeQuickId === qs.id;
                const qProg = isActive ? quickElapsed / qs.durationSeconds : 0;
                return (
                  <Pressable
                    key={qs.id}
                    onPress={() => isActive ? stopQuickSession() : startQuickSession(qs.id)}
                    style={[sh.quickCard, { borderColor: isActive ? qs.color + '66' : divColor, backgroundColor: isActive ? qs.color + '10' : cardBg }]}
                  >
                    <LinearGradient colors={[qs.color + '18', 'transparent']} style={StyleSheet.absoluteFill} />
                    <View style={[sh.quickIconBadge, { backgroundColor: qs.color + '1A' }]}>
                      <QI color={qs.color} size={22} strokeWidth={1.8} />
                    </View>
                    <Text style={[sh.quickChipLabel, { color: qs.color }]}>{qs.label}</Text>
                    <Text style={[sh.quickTitle, { color: textColor }]}>{qs.title}</Text>
                    <Text style={[sh.quickDesc, { color: subColor }]} numberOfLines={2}>{qs.description}</Text>
                    {isActive && (
                      <>
                        <View style={[sh.progressTrack, { backgroundColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)', marginTop: 8 }]}>
                          <View style={[sh.progressFill, { width: `${qProg * 100}%`, backgroundColor: qs.color }]} />
                        </View>
                        <Text style={[sh.quickTimeLeft, { color: qs.color }]}>{formatDuration(qs.durationSeconds - quickElapsed)}</Text>
                      </>
                    )}
                    <View style={[sh.quickActionBtn, { backgroundColor: isActive ? qs.color + '22' : qs.color }]}>
                      {isActive
                        ? <><Pause color={qs.color} size={14} /><Text style={[sh.quickBtnText, { color: qs.color }]}>{t('meditation.stop', 'Stop')}</Text></>
                        : <><Play color="#fff" size={14} /><Text style={[sh.quickBtnText, { color: '#fff' }]}>{t('meditation.start', 'Start')}</Text></>
                      }
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════
              PROGRAM SELECTOR
          ═══════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(12)} style={sh.selectorSection}>
            <Text style={[sh.eyebrow, { color: subColor, marginBottom: 4 }]}>🌿 {t('meditation.technique', 'TECHNIKA').toUpperCase()}</Text>
            <Text style={[sh.sectionTitle, { color: textColor }]}>{t('meditation.selectDuration', 'Wybierz ścieżkę')}</Text>
            <Text style={[sh.sectionBody, { color: subColor, marginTop: 6, marginBottom: 16 }]}>
              {t('meditation.kazda_sciezka_ma_wlasna_energie', 'Każda ścieżka ma własną energię. Po wyborze prowadzi Cię do aktywnego centrum sesji.')}
            </Text>
            {PROGRAMS.map((item) => {
              const PI = item.icon;
              const isActive = item.id === selectedId;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => chooseProgram(item.id)}
                  disabled={isRunning}
                  style={[sh.programRow, {
                    borderWidth: 1,
                    borderColor: isActive ? item.color + '66' : cardBorder,
                    backgroundColor: isActive ? item.color + '14' : cardBg,
                    borderLeftWidth: isActive ? 3 : 1,
                    borderLeftColor: isActive ? item.color : cardBorder,
                  }]}
                >
                  <View style={[sh.programBadge, { backgroundColor: item.color + '16' }]}>
                    <PI color={item.color} size={18} strokeWidth={1.9} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={sh.programTitleRow}>
                      <Text style={[sh.programTitle, { color: textColor, flex: 1 }]}>{item.title}</Text>
                      <Text style={[sh.eyebrow, { color: item.color }]}>{item.durationMinutes} min</Text>
                    </View>
                    <Text style={[sh.sectionBody, { color: subColor }]}>{item.description}</Text>
                    {isActive && <Text style={[sh.sectionBody, { color: subColor, marginTop: 4 }]}>{item.deeperDescription}</Text>}
                    <View style={sh.tagsRow}>
                      {item.focus.map((tag) => (
                        <View key={tag} style={[sh.tag, { borderColor: item.color + '30', backgroundColor: item.color + '0D' }]}>
                          <Text style={[sh.tagText, { color: item.color }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════
              SESSION CONTROLS
          ═══════════════════════════════════════════════════ */}
          <View style={sh.controlSection}>
            <Text style={[sh.eyebrow, { color: program.color, marginBottom: 12 }]}>{t('meditation.tryb_sesji', '🎵 TRYB SESJI')}</Text>
            <View style={sh.chipRow}>
              {([{ id: 'music', label: 'Muzyka' }, { id: 'ambient', label: 'Ambient' }, { id: 'immersive', label: 'Immersive' }]).map((opt) => {
                const isActive = musicBlend === opt.id;
                return (
                  <Pressable key={opt.id} onPress={() => !isRunning && setMusicBlend(opt.id as any)}
                    style={[sh.modeChip, { borderColor: isActive ? program.color + '55' : cardBorder, backgroundColor: isActive ? program.color + '14' : chipBg }]}
                  >
                    <Text style={[sh.tagText, { color: isActive ? program.color : subColor }]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[sh.controlDivider, { borderTopColor: divColor }]}>
              <Text style={[sh.eyebrow, { color: program.color, marginBottom: 10 }]}>{t('meditation.muzyka_tej_medytacji', 'Muzyka tej medytacji')}</Text>
              <View style={sh.chipRow}>
                {program.musicOptions.map((opt) => {
                  const isActive = selectedMusic === opt;
                  return (
                    <Pressable key={opt} onPress={() => !isRunning && setSelectedMusic(opt)}
                      style={[sh.choiceChip, { borderColor: isActive ? program.color + '55' : cardBorder, backgroundColor: isActive ? program.color + '14' : chipBg }]}
                    >
                      <Text style={[sh.tagText, { color: isActive ? program.color : subColor }]}>{MUSIC_LABELS[opt] || opt}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={[sh.controlDivider, { borderTopColor: divColor }]}>
              <Text style={[sh.eyebrow, { color: program.color, marginBottom: 10 }]}>{t('meditation.krajobraz_dzwiekowy', 'Krajobraz dźwiękowy')}</Text>
              <View style={sh.chipRow}>
                {program.ambientOptions.map((opt) => {
                  const isActive = selectedAmbient === opt;
                  return (
                    <Pressable key={opt} onPress={() => !isRunning && setSelectedAmbient(opt)}
                      style={[sh.choiceChip, { borderColor: isActive ? program.color + '55' : cardBorder, backgroundColor: isActive ? program.color + '14' : chipBg }]}
                    >
                      <Text style={[sh.tagText, { color: isActive ? program.color : subColor }]}>{AMBIENT_LABELS[opt] || opt}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════
              ACTIVE SESSION — BREATHING ORB
          ═══════════════════════════════════════════════════ */}
          <View
            onLayout={(e) => { sessionAnchorY.current = e.nativeEvent.layout.y; }}
            style={[sh.sessionSection, { borderTopWidth: 2, borderTopColor: program.color + '55' }]}
          >
            {/* Session header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <View style={[sh.sessionBadge, { backgroundColor: program.color + '1A', borderColor: program.color + '44' }]}>
                <Icon color={program.color} size={16} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[sh.eyebrow, { color: program.color }]}>⭐ {program.category}</Text>
                <Text style={[sh.sessionTitle, { color: textColor }]}>{program.title}</Text>
              </View>
            </View>
            <Text style={[sh.sectionBody, { color: subColor, marginBottom: 8 }]}>{program.deeperDescription}</Text>

            {/* ── BREATHING ORB ── */}
            <View style={sh.orbWrapper}>
              {/* Cosmic glow behind orb */}
              <LinearGradient
                colors={['transparent', program.color + '18', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 120 }]}
              />
              <BreathingOrb
                isRunning={isRunning}
                color={program.color}
                progress={progress}
                remainingSeconds={remainingSeconds}
                totalSeconds={totalSeconds}
              />
            </View>

            {/* Timer display below orb */}
            <View style={{ alignItems: 'center', marginTop: 12, gap: 4 }}>
              <Text style={[sh.timerTime, { color: textColor }]}>{formatDuration(remainingSeconds)}</Text>
              <Text style={[sh.timerLabel, { color: subColor }]}>{t('meditation.pozostalo', 'pozostało')}</Text>
            </View>

            {/* Progress bar */}
            <View style={[sh.progressTrack, { marginTop: 16, backgroundColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)' }]}>
              <LinearGradient
                colors={[program.color + 'AA', program.color + 'EE', program.color + 'AA']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[sh.progressFill, { width: `${Math.max(progress * 100, 2)}%` }]}
              />
            </View>

            {/* Completion burst */}
            {showCompleted && <CompletionBurst color={program.color} />}

            {/* Guidance */}
            <View style={[sh.guidancePanel, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', borderTopColor: program.color + '22', borderTopWidth: 1 }]}>
              <Text style={[sh.eyebrow, { color: program.color }]}>{t('meditation.prowadzeni_tej_sciezki', 'Prowadzenie tej ścieżki')}</Text>
              <Text style={[sh.sectionBody, { color: subColor }]}>
                {program.guidance[Math.min(cueIndexRef.current, program.guidance.length - 1)]}
              </Text>
              <Text style={[sh.captionText, { color: subColor, marginTop: 8 }]}>
                Aktywna ścieżka: {selectedMusic} · {selectedAmbient}
              </Text>
            </View>

            {/* Body scan button */}
            {!isRunning && program.script && program.script.length > 0 && (
              <Pressable
                onPress={startBodyScan}
                style={[sh.bodyScanBtn, { borderColor: program.color + '44', backgroundColor: program.color + '10' }]}
              >
                <Layers color={program.color} size={14} strokeWidth={1.8} />
                <Text style={[sh.tagText, { color: program.color }]}>{t('meditation.uruchom_skanowanie_ciala', 'Uruchom skanowanie ciała')}</Text>
              </Pressable>
            )}

            {/* Action row */}
            <View style={sh.actionRow}>
              <Pressable
                onPress={isRunning ? stopSession : () => setShowPreCheckIn(true)}
                style={[sh.primaryAction, { backgroundColor: program.color }]}
              >
                {isRunning ? <Pause color="#fff" size={18} /> : <Play color="#fff" size={18} />}
                <Text style={sh.primaryActionText}>
                  {isRunning ? t('meditation.finish', 'Zakończ') : t('meditation.start', 'Rozpocznij')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => !isRunning && setElapsed(0)}
                style={[sh.secondaryAction, { borderColor: program.color + '30' }]}
              >
                <TimerReset color={program.color} size={16} />
                <Text style={[sh.tagText, { color: program.color, marginLeft: 8 }]}>{t('meditation.reset', 'reset')}</Text>
              </Pressable>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════
              SOUND DESIGN
          ═══════════════════════════════════════════════════ */}
          <View style={sh.infoSection}>
            <Text style={[sh.eyebrow, { color: program.color, marginBottom: 4 }]}>{t('meditation.pejzaz_dzwiekowy', '🔮 PEJZAŻ DŹWIĘKOWY')}</Text>
            {program.soundDesign.map((item, i) => (
              <View key={item} style={[sh.infoRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: divColor }]}>
                <ArrowDownCircle color={program.color} size={15} />
                <Text style={[sh.sectionBody, { flex: 1, color: subColor }]}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ═══════════════════════════════════════════════════
              GUIDANCE STEPS
          ═══════════════════════════════════════════════════ */}
          <View style={sh.stepsSection}>
            <Text style={[sh.eyebrow, { color: program.color, marginBottom: 4 }]}>{t('meditation.co_wydarzy_sie_w_tej', '✦ CO WYDARZY SIĘ W TEJ SESJI')}</Text>
            {program.guidance.map((step, i) => (
              <View key={step} style={[sh.stepRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: divColor }]}>
                <View style={[sh.stepNumber, { backgroundColor: program.color + '18' }]}>
                  <Text style={[sh.eyebrow, { color: program.color }]}>{`0${i + 1}`}</Text>
                </View>
                <Text style={[sh.sectionBody, { flex: 1, color: subColor }]}>{step}</Text>
              </View>
            ))}
          </View>

          {/* ═══════════════════════════════════════════════════
              MEDITATION SCRIPT
          ═══════════════════════════════════════════════════ */}
          {program.script && program.script.length > 0 && (
            <Reanimated.View entering={FadeInDown.delay(12)} style={[sh.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={sh.cardHeader}>
                <PenLine color={program.color} size={14} strokeWidth={1.8} />
                <Text style={[sh.eyebrow, { color: subColor }]}>{t('meditation.skrypt_medytacji', 'SKRYPT MEDYTACJI')}</Text>
              </View>
              <Text style={[sh.sectionBody, { color: subColor }]}>
                {t('meditation.pelny_tekst_tej_sesji_mozesz', 'Pełny tekst tej sesji — możesz przeczytać przed startem lub podążać za nim podczas skanowania ciała.')}
              </Text>
              {program.script.map((line, i) => (
                <View key={i} style={[sh.scriptLine, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: divColor }]}>
                  <View style={[sh.scriptDot, { backgroundColor: program.color + '66' }]} />
                  <Text style={[sh.scriptText, { color: subColor }]}>{line}</Text>
                </View>
              ))}
            </Reanimated.View>
          )}

          {/* ═══════════════════════════════════════════════════
              GUIDED LIBRARY
          ═══════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(25)}>
            <View style={sh.sectionHeaderRow}>
              <BookOpen color={accent} size={13} strokeWidth={1.9} />
              <Text style={[sh.eyebrow, { color: subColor }]}>{t('meditation.biblioteka_technik', 'BIBLIOTEKA TECHNIK')}</Text>
            </View>
            <Text style={[sh.sectionTitle, { color: textColor }]}>{t('meditation.12_sciezek_medytacyjn', '12 ścieżek medytacyjnych')}</Text>
            <Text style={[sh.sectionBody, { color: subColor }]}>
              {t('meditation.od_prostego_oddechu_po_zaawansowa', 'Od prostego oddechu po zaawansowaną medytację jungowską.')}
            </Text>
            {GUIDED_LIBRARY.map((item, index) => {
              const LI = item.icon;
              const isOpen = expandedLibraryId === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setExpandedLibraryId(isOpen ? null : item.id)}
                  style={[sh.libraryRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: divColor }]}
                >
                  <View style={[sh.libraryBadge, { backgroundColor: item.color + '18' }]}>
                    <LI color={item.color} size={17} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={sh.libraryTitleRow}>
                      <Text style={[sh.libraryTitle, { color: textColor, flex: 1 }]}>{item.title}</Text>
                      <Text style={[sh.eyebrow, { color: item.color }]}>{item.duration}</Text>
                      {isOpen ? <ChevronUp color={subColor} size={13} strokeWidth={1.9} /> : <ChevronDown color={subColor} size={13} strokeWidth={1.9} />}
                    </View>
                    <Text style={[sh.sectionBody, { color: subColor }]} numberOfLines={isOpen ? undefined : 1}>{item.description}</Text>
                  </View>
                </Pressable>
              );
            })}
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════
              STRUCTURED PROGRAMS
          ═══════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(40)}>
            <View style={sh.sectionHeaderRow}>
              <Target color={accent} size={13} strokeWidth={1.9} />
              <Text style={[sh.eyebrow, { color: subColor }]}>{t('meditation.programy_struktural', 'PROGRAMY STRUKTURALNE')}</Text>
            </View>
            <Text style={[sh.sectionTitle, { color: textColor }]}>{t('meditation.transforma_krok_po_kroku', 'Transformacja krok po kroku')}</Text>
            <Text style={[sh.sectionBody, { color: subColor }]}>
              {t('meditation.7_lub_21_dni_codziennej', '7 lub 21 dni codziennej praktyki.')}
            </Text>
            {STRUCTURED_PROGRAMS.map((prog) => {
              const PRI = prog.icon;
              const isOpen = expandedProgramId === prog.id;
              return (
                <View key={prog.id} style={[sh.structuredCard, { borderColor: isOpen ? prog.color + '55' : cardBorder, backgroundColor: isOpen ? prog.color + '08' : cardBg }]}>
                  <Pressable onPress={() => setExpandedProgramId(isOpen ? null : prog.id)} style={sh.structuredCardHeader}>
                    <View style={[sh.structuredBadge, { backgroundColor: prog.color + '18' }]}>
                      <PRI color={prog.color} size={18} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[sh.structuredTitle, { color: textColor }]}>{prog.title}</Text>
                      <Text style={[sh.eyebrow, { color: subColor }]}>{prog.duration} · {prog.sessions} sesji</Text>
                    </View>
                    {isOpen ? <ChevronUp color={subColor} size={15} /> : <ChevronDown color={subColor} size={15} />}
                  </Pressable>
                  {isOpen && (
                    <View style={[sh.structuredBody, { borderTopColor: divColor }]}>
                      <Text style={[sh.sectionBody, { color: subColor }]}>{prog.description}</Text>
                      {prog.days.map((day) => (
                        <View key={day.day} style={[sh.structuredDayRow, { borderTopColor: divColor }]}>
                          <View style={[sh.structuredDayNum, { backgroundColor: prog.color + '18' }]}>
                            <Text style={[sh.eyebrow, { color: prog.color }]}>{day.day}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[sh.structuredDayTitle, { color: textColor }]}>{day.title}</Text>
                            <Text style={[sh.captionText, { color: subColor }]}>{day.desc}</Text>
                          </View>
                          <Pressable
                            onPress={() => { chooseProgram(day.programId); setExpandedProgramId(null); scrollToSession(); }}
                            style={[sh.structuredDayBtn, { borderColor: prog.color + '44' }]}
                          >
                            <Play color={prog.color} size={12} strokeWidth={2} />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════
              AFTERCARE
          ═══════════════════════════════════════════════════ */}
          <View>
            <Text style={[sh.eyebrow, { color: program.color, marginBottom: 10 }]}>{t('meditation.po_sesji', '🌱 PO SESJI')}</Text>
            <Text style={[sh.sectionBody, { color: subColor }]}>{program.aftercare}</Text>
          </View>

          {/* ═══════════════════════════════════════════════════
              PRACTICE TIPS
          ═══════════════════════════════════════════════════ */}
          <View style={[sh.tipsSection, { borderColor: cardBorder }]}>
            <Text style={[sh.eyebrow, { color: subColor }]}>💡 {t('meditation.meditationTips', 'WSKAZÓWKI PRAKTYKI').toUpperCase()}</Text>
            {PRACTICE_TIPS.map((tip, i) => {
              const isOpen = expandedTip === i;
              return (
                <View key={i} style={[sh.tipRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: divColor }]}>
                  <Pressable onPress={() => setExpandedTip(isOpen ? null : i)} style={sh.tipTitleRow}>
                    <Text style={[sh.libraryTitle, { color: textColor, flex: 1 }]}>{tip.title}</Text>
                    {isOpen ? <ChevronUp color={subColor} size={15} strokeWidth={1.8} /> : <ChevronDown color={subColor} size={15} strokeWidth={1.8} />}
                  </Pressable>
                  {isOpen && <Text style={[sh.sectionBody, { color: subColor, lineHeight: 21, marginTop: 10 }]}>{tip.body}</Text>}
                </View>
              );
            })}
          </View>

          {/* ═══════════════════════════════════════════════════
              AI INSIGHT
          ═══════════════════════════════════════════════════ */}
          <View style={{ borderRadius: 16, backgroundColor: program.color + '22', borderWidth: 1, borderColor: program.color, padding: 16 }}>
            <Text style={[sh.eyebrow, { color: program.color, marginBottom: 8 }]}>{t('meditation.ai_wskazowka_sesji', 'AI WSKAZÓWKA SESJI')}</Text>
            {medAiInsight ? <Text style={[sh.sectionBody, { color: isLight ? '#251D16' : '#E5E7EB', lineHeight: 22 }]}>{medAiInsight}</Text> : null}
            <Pressable
              onPress={fetchMedAi}
              disabled={medAiLoading}
              style={{ marginTop: 12, backgroundColor: program.color, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
            >
              <Text style={{ color: '#1F1035', fontWeight: '700', fontSize: 14 }}>{medAiLoading ? 'Analizuję...' : 'Analizuj'}</Text>
            </Pressable>
          </View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>

      {/* ═══════════════════════════════════════════════════════
          MODAL: PRE CHECK-IN
      ═══════════════════════════════════════════════════════ */}
      <Modal visible={showPreCheckIn} transparent animationType="slide" onRequestClose={() => setShowPreCheckIn(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={sh.modalOverlay}>
          <View style={[sh.sheet, { backgroundColor: isLight ? '#FAF6EE' : '#0E0C1A', borderColor: divColor }]}>
            <LinearGradient colors={isLight ? ['#F6ECDE', '#FAF6EE'] : ['#1A1430', '#0E0C1A']} style={StyleSheet.absoluteFill} />
            <Text style={[sh.sheetTitle, { color: textColor }]}>{t('meditation.jak_sie_teraz_czujesz', 'Jak się teraz czujesz?')}</Text>
            <Text style={[sh.sheetSub, { color: subColor }]}>{t('meditation.chwila_refleksji_przed_sesja_pozwal', 'Chwila refleksji przed sesją pozwala zobaczyć zmianę po jej zakończeniu.')}</Text>
            <Text style={[sh.sheetLabel, { color: subColor }]}>{t('meditation.nastroj', 'NASTRÓJ')}</Text>
            <View style={sh.moodRow}>
              {MOOD_OPTIONS.map((m) => {
                const MI = m.icon;
                const isActive = preMood === m.id;
                return (
                  <Pressable key={m.id} onPress={() => setPreMood(m.id)}
                    style={[sh.moodBtn, { borderColor: isActive ? program.color + '66' : divColor, backgroundColor: isActive ? program.color + '14' : cardBg }]}
                  >
                    <MI color={isActive ? program.color : subColor} size={22} strokeWidth={1.6} />
                    <Text style={[sh.captionText, { color: isActive ? program.color : subColor }]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[sh.sheetLabel, { color: subColor }]}>{t('meditation.energia_1_10', 'ENERGIA (1–10)')}</Text>
            <View style={sh.energyRow}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <Pressable key={n} onPress={() => setPreEnergy(n)}
                  style={[sh.energyBtn, { borderColor: n <= preEnergy ? program.color + '66' : divColor, backgroundColor: n <= preEnergy ? program.color + '14' : cardBg }]}
                >
                  <Text style={[sh.captionText, { color: n <= preEnergy ? program.color : subColor, fontWeight: '700' }]}>{n}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => { setShowPreCheckIn(false); void startSession(); }} style={[sh.sheetCta, { backgroundColor: program.color }]}>
              <Play color="#fff" size={15} strokeWidth={2} />
              <Text style={sh.sheetCtaText}>{t('meditation.start', 'Rozpocznij')}</Text>
            </Pressable>
            <Pressable onPress={() => { setShowPreCheckIn(false); void startSession(); }} style={sh.sheetSkip}>
              <Text style={[sh.captionText, { color: subColor }]}>{t('common.skip', 'Pomiń')}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL: POST REFLECTION
      ═══════════════════════════════════════════════════════ */}
      <Modal visible={showPostReflection} transparent animationType="slide" onRequestClose={() => setShowPostReflection(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={sh.modalOverlay}>
          <View style={[sh.sheet, { backgroundColor: isLight ? '#FAF6EE' : '#0E0C1A', borderColor: divColor }]}>
            <LinearGradient colors={isLight ? ['#F6ECDE', '#FAF6EE'] : ['#1A1430', '#0E0C1A']} style={StyleSheet.absoluteFill} />
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <CheckCircle2 color={program.color} size={32} strokeWidth={1.6} />
            </View>
            <Text style={[sh.sheetTitle, { color: textColor }]}>{t('meditation.session_complete', 'Sesja zakończona')}</Text>
            <Text style={[sh.sheetSub, { color: subColor }]}>{t('meditation.jak_sie_teraz_czujesz_krotka', 'Jak się teraz czujesz? Refleksja wzmacnia efekty praktyki.')}</Text>
            <Text style={[sh.sheetLabel, { color: subColor }]}>{t('meditation.nastroj_po_sesji', 'NASTRÓJ PO SESJI')}</Text>
            <View style={sh.moodRow}>
              {MOOD_OPTIONS.map((m) => {
                const MI = m.icon;
                const isActive = postMood === m.id;
                return (
                  <Pressable key={m.id} onPress={() => setPostMood(m.id)}
                    style={[sh.moodBtn, { borderColor: isActive ? program.color + '66' : divColor, backgroundColor: isActive ? program.color + '14' : cardBg }]}
                  >
                    <MI color={isActive ? program.color : subColor} size={22} strokeWidth={1.6} />
                    <Text style={[sh.captionText, { color: isActive ? program.color : subColor }]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[sh.sheetLabel, { color: subColor }]}>{t('meditation.ocena_sesji', 'OCENA SESJI')}</Text>
            <View style={sh.starRow}>
              {[1,2,3,4,5].map((n) => (
                <Pressable key={n} onPress={() => setStarRating(n)}>
                  <Star color={n <= starRating ? '#F59E0B' : subColor} size={26} fill={n <= starRating ? '#F59E0B' : 'none'} strokeWidth={1.6} />
                </Pressable>
              ))}
            </View>
            <Text style={[sh.sheetLabel, { color: subColor }]}>{t('meditation.przemyslen_opcjonalni', 'PRZEMYŚLENIE (opcjonalnie)')}</Text>
            <TextInput
              value={insightNote}
              onChangeText={setInsightNote}
              placeholder={t('meditation.co_zauwazyles_podczas_tej_sesji', 'Co zauważyłeś podczas tej sesji?')}
              placeholderTextColor={subColor}
              style={[sh.insightInput, { color: textColor, borderColor: divColor, backgroundColor: cardBg }]}
              multiline numberOfLines={3}
            />
            <Pressable onPress={() => setShowPostReflection(false)} style={[sh.sheetCta, { backgroundColor: program.color }]}>
              <Text style={sh.sheetCtaText}>{t('common.close', 'Zamknij')}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL: BODY SCAN
      ═══════════════════════════════════════════════════════ */}
      <Modal visible={showBodyScan} transparent animationType="slide" onRequestClose={stopBodyScan}>
        <View style={sh.modalOverlay}>
          <View style={[sh.bodyScanSheet, { backgroundColor: isLight ? '#FAF6EE' : '#0E0C1A', borderColor: divColor }]}>
            <LinearGradient colors={isLight ? ['#F6ECDE', '#FAF6EE'] : ['#1A1430', '#0E0C1A']} style={StyleSheet.absoluteFill} />
            <View style={sh.bodyScanHeader}>
              <Text style={[sh.sheetTitle, { color: textColor }]}>{t('meditation.skanowanie_ciala', 'Skanowanie ciała')}</Text>
              <Pressable onPress={stopBodyScan} hitSlop={14}>
                <X color={subColor} size={20} strokeWidth={1.8} />
              </Pressable>
            </View>
            <Text style={[sh.captionText, { color: subColor }]}>Krok {bodyScanStep + 1} z {BODY_SCAN_STEPS.length}</Text>
            <View style={[sh.bodyScanProgress, { backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)' }]}>
              <View style={[sh.bodyScanFill, { width: `${((bodyScanStep + 1) / Math.max(BODY_SCAN_STEPS.length, 1)) * 100}%`, backgroundColor: program.color }]} />
            </View>
            <Text style={[sh.bodyScanStepText, { color: textColor }]}>{BODY_SCAN_STEPS[bodyScanStep] || '—'}</Text>
            <Text style={[sh.captionText, { color: subColor }]}>{t('meditation.tekst_zmienia_sie_automatycz_co', 'Tekst zmienia się automatycznie co 12 sekund.')}</Text>
            <Pressable onPress={stopBodyScan} style={[sh.bodyScanStop, { backgroundColor: program.color + '22', borderColor: program.color + '44' }]}>
              <Text style={[sh.tagText, { color: program.color }]}>{t('meditation.zakoncz_skanowanie', 'Zakończ skanowanie')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const sh = StyleSheet.create({
  container:   { flex: 1 },
  safeArea:    { flex: 1 },
  scrollContent: { paddingHorizontal: layout.padding.screen, paddingTop: 0, gap: 28 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  backBtn:     { padding: 4 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center' },

  // Hero
  heroSection: { paddingTop: 18 },
  heroTop:     { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIcon:    { width: 56, height: 56, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  heroTitle:   { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginTop: 4 },
  heroBody:    { fontSize: 14, lineHeight: 24, marginTop: 14 },
  metricsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  metricPill:  { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  metricLabel: { marginLeft: 6, fontSize: 11, fontWeight: '700' },
  eyebrow:     { fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },

  // Stat rail
  statRail:    { flexDirection: 'row', borderRadius: 18, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 4 },
  statItem:    { flex: 1, alignItems: 'center', gap: 4 },
  statValue:   { fontSize: 18, fontWeight: '700' },
  statLabel:   { fontSize: 9, fontWeight: '600', letterSpacing: 0.4, textAlign: 'center' },
  statDivider: { width: 1, marginVertical: 4 },

  // Cards
  card:        { borderRadius: 20, borderWidth: 1, padding: 18, gap: 12, overflow: 'hidden' },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  sectionBody:  { fontSize: 13, lineHeight: 21 },
  captionText:  { fontSize: 10, lineHeight: 15 },

  // Streak
  streakRow:    { flexDirection: 'row', alignItems: 'center', gap: 16 },
  streakBadge:  { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(242,167,75,0.12)', borderWidth: 2, borderColor: 'rgba(242,167,75,0.30)', alignItems: 'center', justifyContent: 'center' },
  streakCount:  { fontSize: 28, fontWeight: '800', color: '#F2A74B' },
  streakDaysLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.4 },
  streakNextLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  milestoneLabel: { fontSize: 13, fontWeight: '600' },
  milestoneRemaining: { fontSize: 11 },
  milestoneTrack: { height: 5, borderRadius: 999, overflow: 'hidden' },
  milestoneFill: { height: '100%', borderRadius: 999 },

  // Chart
  chartRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 64 },
  chartCol:    { flex: 1, alignItems: 'center', gap: 4 },
  chartBarTrack: { flex: 1, width: '100%', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  chartBar:    { width: '100%', borderRadius: 4 },
  chartLabel:  { fontSize: 9, fontWeight: '600', letterSpacing: 0.3 },
  chartDot:    { width: 5, height: 5, borderRadius: 999 },
  chartLegendText: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, fontSize: 11 },

  // Daily card
  dailyCard:    { borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden' },
  dailyHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dailyTitle:   { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  dailyBenefit: { fontSize: 13, lineHeight: 21, marginBottom: 14 },
  dailyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start' },
  dailyBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Quick sessions
  quickGrid:    { flexDirection: 'row', gap: 10, marginTop: 12 },
  quickCard:    { flex: 1, borderRadius: 18, borderWidth: 1.2, paddingVertical: 14, paddingHorizontal: 12, gap: 5, overflow: 'hidden', minHeight: 142 },
  quickIconBadge: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  quickChipLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.7 },
  quickTitle:   { fontSize: 14, fontWeight: '700' },
  quickDesc:    { fontSize: 12, lineHeight: 17 },
  quickTimeLeft: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  quickActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 10, paddingVertical: 8, marginTop: 6 },
  quickBtnText: { fontSize: 12, fontWeight: '700' },

  // Program selector
  selectorSection: { gap: 0 },
  programRow:   { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 16, paddingHorizontal: 14, borderRadius: 14, marginBottom: 8 },
  programBadge: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  programTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  programTitle: { fontSize: 15, fontWeight: '700' },
  tagsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tag:          { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  tagText:      { fontSize: 11, fontWeight: '700' },

  // Controls
  controlSection: { gap: 0 },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modeChip:     { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 40, borderRadius: 14, borderWidth: 1, paddingHorizontal: 10 },
  choiceChip:   { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  controlDivider: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, marginTop: 12 },

  // Session — breathing orb section
  sessionSection: { borderRadius: 24, padding: 22, backgroundColor: 'transparent' },
  sessionBadge:   { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sessionTitle:   { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  orbWrapper:     { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 120, overflow: 'visible' },
  timerTime:      { fontSize: 48, fontWeight: '200', letterSpacing: -2 },
  timerLabel:     { fontSize: 10, fontWeight: '600', letterSpacing: 0.8 },
  progressTrack:  { height: 4, borderRadius: 999, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: 999 },
  guidancePanel:  { marginTop: 16, borderRadius: 14, padding: 14, gap: 8 },
  actionRow:      { flexDirection: 'row', gap: 10, marginTop: 18 },
  primaryAction:  { flex: 1, minHeight: 56, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryActionText: { color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 2 },
  secondaryAction: { minWidth: 108, minHeight: 56, borderRadius: 999, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  bodyScanBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 10, marginTop: 12 },

  // Info / steps
  infoSection: { gap: 0 },
  infoRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 14 },
  stepsSection: { gap: 0 },
  stepRow:     { flexDirection: 'row', gap: 12, paddingVertical: 14, alignItems: 'flex-start' },
  stepNumber:  { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Script
  scriptLine:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  scriptDot:   { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  scriptText:  { flex: 1, fontSize: 13, lineHeight: 22 },

  // Library
  libraryRow:  { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 14 },
  libraryBadge: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  libraryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  libraryTitle: { fontSize: 14, fontWeight: '700' },

  // Structured programs
  structuredCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 10 },
  structuredCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  structuredBadge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  structuredTitle: { fontSize: 15, fontWeight: '700' },
  structuredBody: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingBottom: 12 },
  structuredDayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  structuredDayNum: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  structuredDayTitle: { fontSize: 13, fontWeight: '700' },
  structuredDayBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Tips
  tipsSection: { borderWidth: 1, borderRadius: 20, padding: 16 },
  tipRow:      { paddingVertical: 14 },
  tipTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Modals
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:        { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 24, gap: 14, overflow: 'hidden' },
  sheetTitle:   { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  sheetSub:     { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  sheetLabel:   { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginTop: 4 },
  moodRow:      { flexDirection: 'row', gap: 8 },
  moodBtn:      { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, paddingVertical: 10, gap: 4 },
  energyRow:    { flexDirection: 'row', gap: 4 },
  energyBtn:    { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, paddingVertical: 8 },
  sheetCta:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, paddingVertical: 16, marginTop: 8 },
  sheetCtaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sheetSkip:    { alignItems: 'center', paddingVertical: 8 },
  starRow:      { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  insightInput: { borderRadius: 14, borderWidth: 1, padding: 12, fontSize: 14, lineHeight: 22, minHeight: 80, textAlignVertical: 'top' },

  // Body scan modal
  bodyScanSheet:   { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 28, gap: 16, overflow: 'hidden', minHeight: 380 },
  bodyScanHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bodyScanProgress: { height: 5, borderRadius: 999, overflow: 'hidden' },
  bodyScanFill:    { height: '100%', borderRadius: 999 },
  bodyScanStepText: { fontSize: 16, lineHeight: 28, fontWeight: '500' },
  bodyScanStop:    { borderRadius: 12, borderWidth: 1, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
});
