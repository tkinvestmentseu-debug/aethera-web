// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated, Dimensions, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import Reanimated, {
  FadeInDown,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
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
const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface MeditationProgram {
  id: string;
  title: string;
  eyebrow: string;
  category: string;
  durationMinutes: number;
  musicOptions: BackgroundMusicCategory[];
  ambientOptions: AmbientSoundscape[];
  color: string;
  icon: React.ComponentType<any>;
  description: string;
  deeperDescription: string;
  focus: string[];
  soundDesign: string[];
  guidance: string[];
  aftercare: string;
  script?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAMS DATA
// ─────────────────────────────────────────────────────────────────────────────
const PROGRAMS: MeditationProgram[] = [
  {
    id: 'abundance', title: 'Medytacja obfitości', eyebrow: 'PRZEPŁYW I ODWAGA OTRZYMYWANIA',
    category: 'Obfitość', durationMinutes: 18,
    musicOptions: ['celestial', 'nature', 'serene'], ambientOptions: ['waves', 'forest', 'fire'],
    color: '#D9B56D', icon: Coins,
    description: 'Prowadzi z miejsca niedoboru do spokojnego poczucia zasobów, sprawczości i otwartości na więcej.',
    deeperDescription: 'To ścieżka dla osób, które chcą przestać reagować na pieniądze i możliwości z napięciem. Sesja najpierw reguluje ciało, potem otwiera język wdzięczności i przyjmowania.',
    focus: ['przepływ finansowy', 'wdzięczność', 'rozszerzanie możliwości'],
    soundDesign: ['niebiański pad o długim oddechu', 'kojące fale jako warstwa tła', 'głos prowadzący z miękką pauzą'],
    guidance: [
      'Uspokój ciało i sprawdź, gdzie trzymasz napięcie związane z brakiem.',
      'Oddychaj tak, jakby każdy wdech robił więcej miejsca na dobro, wsparcie i właściwe okazje.',
      'Zakończ jedną decyzją, która potwierdza, że wchodzisz w relację z obfitością dojrzale, a nie desperacko.',
    ],
    aftercare: 'Po sesji wybierz jeden realny gest dostatku: porządek w finansach, wdzięczność albo zgodę na przyjęcie pomocy.',
    script: [
      'Usiądź wygodnie i zamknij oczy. Poczuj ciężar ciała na podłożu.',
      'Weź trzy głębokie oddechy, wypuszczając każdy wolno przez usta.',
      'Zauważ, gdzie w ciele trzymasz napięcie związane z pieniędzmi lub brakiem.',
      'Nie walcz z tym napięciem — po prostu je obserwuj z łagodnością.',
      'Wyobraź sobie złote światło, które wchodzi z każdym wdechem.',
      'To światło dotyka obszarów napięcia i delikatnie je rozluźnia.',
      'Pozwól sobie poczuć, że zasoby — nie tylko finansowe — są dostępne.',
      'Przypomnij sobie trzy rzeczy, które już masz i za które możesz być wdzięczny.',
      'Poczuj w klatce piersiowej ciepło wdzięczności. Niech się rozszerza.',
      'Powiedz cicho: "Jestem otwarty na przepływ. Otrzymuję z łatwością."',
      'Wyobraź sobie siebie podejmującego decyzję finansową ze spokojem, nie strachem.',
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
    deeperDescription: 'Ta ścieżka nie próbuje "naprawiać" ciała siłą. Pomaga wrócić do jego sygnałów, obniżyć napięcie i odzyskać subtelny kontakt z tym, co naprawdę potrzebuje troski.',
    focus: ['oddech przeponowy', 'regulacja układu nerwowego', 'powrót do ciała'],
    soundDesign: ['ciepły leśny ambient', 'łagodny podkład relaksacyjny', 'cichy lektor w dłuższych odstępach'],
    guidance: [
      'Skanuj ciało bez oceniania i nazwij obszar, który dziś potrzebuje najwięcej wsparcia.',
      'Wydłuż wydech, aby ciało dostało wyraźny sygnał bezpieczeństwa.',
      'Zamknij sesję pytaniem: jaka najmniejsza forma troski byłaby dziś naprawdę uzdrawiająca?',
    ],
    aftercare: 'Po medytacji napij się wody i daj ciału jedną konkretną odpowiedź: odpoczynek, ruch, ciepło albo ciszę.',
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
    deeperDescription: 'To bardziej sesja regulacji niż motywacji. Przywraca poczucie gruntu i pomaga zobaczyć pieniądze jako relację z bezpieczeństwem, a nie tylko z presją.',
    focus: ['bezpieczeństwo', 'klarowność decyzji', 'stabilny dobrobyt'],
    soundDesign: ['miękki rytm focus', 'deszcz obniżający pobudzenie', 'jasny głos kierujący uwagę do ciała'],
    guidance: [
      'Poczuj podłogę pod stopami i wróć do realnych zasobów, które już istnieją.',
      'Oddychaj wolno i zauważ, że pieniądze nie muszą być związane z pośpiechem.',
      'Po sesji wybierz jedną konkretną decyzję porządkującą materię.',
    ],
    aftercare: 'Najlepiej działa wtedy, gdy po zakończeniu wykonasz jeden mały ruch w świecie materialnym.',
    script: [
      'Usiądź stabilnie, obydwie stopy płasko na podłodze.',
      'Poczuj kontakt stóp z ziemią — to Twój grunt, Twoja stabilność.',
      'Weź głęboki oddech i przy wydechu wyobraź sobie korzenie rosnące ze stóp w ziemię.',
      'Przypomnij sobie zasoby, które już posiadasz — czas, umiejętności, relacje, pieniądze.',
      'Zauważ, jak ciało reaguje na słowo "pieniądze" — bez oceniania.',
      'Wyobraź sobie spokojną relację z finansami — stabilną, dojrzałą, bez dramatów.',
      'Z każdym oddechem napięcie wokół pieniędzy delikatnie odpływa.',
      'Powiedz cicho: "Mam dostęp do wystarczających zasobów. Działam z jasnym umysłem."',
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
    deeperDescription: 'Zaprojektowana dla osób, które chłoną za dużo bodźców i potrzebują wrócić do własnego centrum. Warstwa dźwiękowa jest bardziej ceremonialna i przestrzenna.',
    focus: ['granice energetyczne', 'powrót do centrum', 'domknięcie dnia'],
    soundDesign: ['rytualny pad w tle', 'wiatr jako warstwa oczyszczająca', 'krótkie guidance do wydechu i granic'],
    guidance: [
      'Na każdym wydechu oddaj to, co nie jest Twoje.',
      'Wyobraź sobie, że wokół ciała robi się więcej czystej przestrzeni.',
      'Zakończ zdaniem granicy, które brzmi uczciwie i spokojnie.',
    ],
    aftercare: 'Po tej sesji nie wracaj od razu do hałasu. Daj sobie kilka minut bez ekranów.',
    script: [
      'Stań lub usiądź w sposób, który daje poczucie godności i stabilności.',
      'Weź głęboki wdech przez nos i powoli wydmuchnij przez usta — z brzmiącym "haaa".',
      'Wyobraź sobie biały lub srebrny ogień otaczający Twoje ciało.',
      'Ten ogień nie parzy — oczyszcza, spala wszystko, co nie jest Twoje.',
      'Pomyśl o rozmowie, sytuacji lub osobie, która Cię dziś przeciążyła.',
      'Przy wydechu wyobraź sobie, że ta energia wraca do swojego źródła z miłością.',
      'Poczuj, jak Twoje pole energetyczne staje się klarowniejsze i własne.',
      'Wyobraź sobie cienką, świetlistą granicę wokół ciała — Twój energetyczny próg.',
      'Powiedz cicho: "Jestem sobą. To, co nie moje, odpływa. Zostaję sobą."',
      'Weź jeszcze trzy oddechy oczyszczenia i wróć do teraźniejszości.',
    ],
  },
  {
    id: 'focus', title: 'Medytacja skupienia', eyebrow: 'JEDEN KIERUNEK, JEDEN RUCH',
    category: 'Skupienie', durationMinutes: 12,
    musicOptions: ['zen', 'focus', 'deepMeditation'], ambientOptions: ['cave', 'forest', 'waves'],
    color: '#76A8FF', icon: Brain,
    description: 'Czyści mentalny szum i zbiera uwagę wokół jednego zadania lub jednej intencji.',
    deeperDescription: 'Przeznaczona do pracy, nauki i decyzji. Zamiast pięknej mgły daje klarowną, chłodniejszą przestrzeń mentalną i prosty rytm koncentracji.',
    focus: ['klarowność umysłu', 'redukcja rozproszeń', 'głęboka koncentracja'],
    soundDesign: ['stabilny focus loop', 'jaskiniowy ambience dla odcięcia bodźców', 'rzadsze guidance, żeby nie wybijać z rytmu'],
    guidance: [
      'Nie walcz z myślami. Zamiast tego zbieraj uwagę z powrotem do jednego punktu.',
      'Każdy powrót do oddechu to nie porażka, tylko trening uwagi.',
      'Po sesji zacznij od pierwszego małego kroku, bez przeciążania planu.',
    ],
    aftercare: 'Największy efekt daje przejście od razu do jednego zadania, bez skakania między aplikacjami.',
    script: [
      'Usiądź prosto. Kręgosłup wyprostowany, ramiona swobodne.',
      'Wybierz jeden punkt skupienia — oddech, jedno słowo lub punkt przed sobą.',
      'Zamknij oczy i zacznij liczyć oddechy: wdech–wydech to jeden.',
      'Licz do dziesięciu, potem wracaj od jeden. Tylko to.',
      'Kiedy myśl przychodzi — zauważ ją bez oceniania i wróć do liczenia.',
      'Każdy powrót jest sukcesem. Trenowanie uwagi to tak, jak trenowanie mięśni.',
      'Po kilku rundach przestań liczyć. Po prostu bądź z oddechem.',
      'Pozwól umysłowi być cichy. Nie wymagaj — tylko obserwuj.',
      'Wyobraź sobie klarowną, spokojną wodę. Żadnych fal, żadnego hałasu.',
      'Wróć do zadania, które czeka, z jednym jasnym krokiem w głowie.',
    ],
  },
  {
    id: 'sleep', title: 'Medytacja snu', eyebrow: 'WYHAMOWANIE I MIĘKKIE WEJŚCIE W NOC',
    category: 'Sen', durationMinutes: 24,
    musicOptions: ['sleep', 'drift', 'serene'], ambientOptions: ['night', 'rain', 'waves'],
    color: '#9D8CFF', icon: BedDouble,
    description: 'Delikatna sesja do wieczornego wyciszenia, redukcji przebodźcowania i łagodnego zasypiania.',
    deeperDescription: 'Ma prowadzić układ nerwowy w dół, a nie wymuszać zaśnięcie. Tło jest ciemniejsze, spokojniejsze i bardziej kojące, z naciskiem na zgodę na odpoczynek.',
    focus: ['wyciszenie układu nerwowego', 'spowolnienie myśli', 'bezpieczne zasypianie'],
    soundDesign: ['sleep loop bez ostrych zmian', 'nocny ambience', 'cichy guidance tylko przy ważnych przejściach'],
    guidance: [
      'Pozwól barkom opaść tak, jakby dzień dosłownie schodził z ciała.',
      'Nie próbuj zasnąć na siłę. Pozwól ciału usłyszeć, że już niczego od niego nie chcesz.',
      'Zakończ zgodą na odpoczynek, nie walką o szybki efekt.',
    ],
    aftercare: 'Po sesji zostań bez telefonu. To kluczowe dla prawdziwego domknięcia układu nerwowego.',
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
      'Pozwól myślom przepłynąć jak obłoki — nie zatrzymując żadnej.',
      'Oddajesz się tej nocy. Jutro zadba o siebie samo.',
    ],
  },
  {
    id: 'anxiety', title: 'Medytacja ulgi w lęku', eyebrow: 'ODDECH, REGULACJA, POWRÓT DO TERAZ',
    category: 'Ukojenie', durationMinutes: 15,
    musicOptions: ['relaxing', 'healing', 'serene'], ambientOptions: ['rain', 'forest', 'waves'],
    color: '#F58EA8', icon: Shield,
    description: 'Praktyka stabilizująca przy napięciu, przeciążeniu i wzmożonym wewnętrznym alarmie.',
    deeperDescription: 'Projektowana tak, by nie przebodźcować. Pomaga zejść z alarmu w ciele, wrócić do otoczenia i odzyskać kilka punktów oparcia tu i teraz.',
    focus: ['wydłużony wydech', 'bezpieczne zakotwiczenie', 'regulacja pobudzenia'],
    soundDesign: ['delikatny deszcz', 'spokojny podkład bez nagłych zmian', 'krótkie guidance do orientacji w otoczeniu'],
    guidance: [
      'Nazwij pięć rzeczy, które są teraz realne i bezpieczne.',
      'Wydychaj dłużej niż wdychasz, aby ciało dostało prosty sygnał powrotu.',
      'Domknij sesję jednym zdaniem, które brzmi bardziej jak oparcie niż motywacja.',
    ],
    aftercare: 'Jeśli napięcie było duże, po zakończeniu nie przechodź od razu do dużych bodźców lub rozmów.',
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
    description: 'Miękka, serdeczna praktyka przebudzania wdzięczności — nawet wtedy, gdy dzień był trudny.',
    deeperDescription: 'Wdzięczność nie jest ignorowaniem trudności. To świadome przeniesienie uwagi na to, co istnieje i co niesie wartość — cicho, bez wymagania.',
    focus: ['otwarte serce', 'zauważanie dobra', 'regulacja nastroju'],
    soundDesign: ['ciepły leśny ambient', 'delikatny podkład melodyczny', 'krótkie, miękkie prowadzenie do trzech momentów'],
    guidance: [
      'Przypomnij sobie jeden moment z dnia, w którym czułaś lub czułeś się wspierany.',
      'Skup się na ciele: gdzie dziś dostałaś lub dostałeś opiekę, spokój lub radość?',
      'Zamknij sesję jednym zdaniem do kogoś lub czegoś: dziękuję za...',
    ],
    aftercare: 'Po sesji zapisz trzy konkretne osoby lub momenty wdzięczności. Konkretność wzmacnia efekt.',
    script: [
      'Usiądź wygodnie i połóż dłoń na sercu.',
      'Poczuj bicie serca pod dłonią. To ciągłe poświęcenie ciała dla Ciebie.',
      'Weź głęboki oddech i pomyśl: co w tym tygodniu poszło dobrze?',
      'Nawet małe rzeczy mają znaczenie. Herbata. Promień słońca. Cisza przed odpowiedzią.',
      'Przypomnij sobie osobę, która Cię wspiera lub inspiruje.',
      'Powiedz jej w myślach: "Dziękuję, że jesteś."',
      'Teraz pomyśl o swoim ciele — o tym, jak służy Ci każdego dnia.',
      'Powiedz sobie: "Dziękuję za każdy krok, każdy oddech, każdy dzień."',
      'Poczuj ciepło w klatce piersiowej — to jest wdzięczność. Zostań z nią.',
      'Wróć do teraźniejszości z otwartym sercem i gotowością do zauważania dobra.',
    ],
  },
  {
    id: 'shadow', title: 'Medytacja integracji cienia', eyebrow: 'SPOTKANIE Z TYM, CO UKRYTE',
    category: 'Praca z cieniem', durationMinutes: 22,
    musicOptions: ['deepMeditation', 'ritual', 'voxscape'], ambientOptions: ['cave', 'rain', 'fire'],
    color: '#8B5CF6', icon: Brain,
    description: 'Jungowska praktyka łagodnego spotkania z odrzuconymi częściami siebie bez dramatyzowania i bez przymusu natychmiastowej zmiany.',
    deeperDescription: 'Cień to nie zło. To wszystko, co uznaliśmy za niebezpieczne, wstydliwe lub nieakceptowalne. Ta medytacja zaprasza te części do rozmowy.',
    focus: ['akceptacja wewnętrznych sprzeczności', 'dialog z cieniem', 'integracja, nie walka'],
    soundDesign: ['głęboki ceremonialny ambient', 'długie pauzy między prowadzeniem', 'przestrzenny, nieekspansywny ton'],
    guidance: [
      'Zapytaj siebie: czego dziś się wstydzisz lub co starasz się nie czuć?',
      'Daj tej części siebie imię i zapytaj: czego chcesz?',
      'Nie próbuj zmieniać — tylko spotkać, usłyszeć i towarzyszyć tej części.',
    ],
    aftercare: 'Po sesji nie wracaj od razu do aktywności. Daj sobie 5 minut ciszy i ewentualnie krótki zapis.',
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
      'Nie musisz jej zmieniać — tylko spotkać. To jest cały cel tej sesji.',
      'Weź głęboki oddech i wróć do teraźniejszości z otwartością.',
    ],
  },
  {
    id: 'morning_activation', title: 'Poranna aktywacja', eyebrow: 'PRZEBUDZENIE Z INTENCJĄ',
    category: 'Poranek', durationMinutes: 8,
    musicOptions: ['motivating', 'focus', 'zen'], ambientOptions: ['forest', 'waves', 'wind'],
    color: '#F59E0B', icon: Stars,
    description: 'Energetyzująca, krótka praktyka na start dnia. Łączy oddech, ruch i intencję, by ciało i umysł obudziły się razem.',
    deeperDescription: 'Zamiast scrollować, powitaj dzień świadomie. Te 8 minut ustawia ton całego dnia lepiej niż kawa bez uwagi.',
    focus: ['energetyzacja ciała', 'ustawienie intencji', 'przebudzenie uwagi'],
    soundDesign: ['lekki motivating beat', 'naturalne dźwięki poranka', 'aktywne krótkie cue'],
    guidance: [
      'Trzy głębokie oddechy z pełnym wydechem — pobudź ciało.',
      'Jeden ruch rozciągający — powiedz ciału, że zaczyna się nowy dzień.',
      'Jedna intencja na dziś: nie zadanie, tylko jakość.',
    ],
    aftercare: 'Wychodząc z medytacji, nie chwytaj od razu telefonu. Przez 2 minuty żyj intencją, którą wybrałaś lub wybrałeś.',
    script: [
      'Wstań lub usiądź na krawędzi łóżka. Poczuj podłogę pod stopami.',
      'Przeciągnij się — ramiona do góry, weź pełny wdech.',
      'Przy wydechu opuść ramiona i poczuj, jak ciało się budzi.',
      'Zrób to trzy razy — powoli, z pełnym oddechem.',
      'Powiedz do siebie: "Dziś zaczynam nowy dzień."',
      'Wybierz jedną jakość na dziś: spokój, ciekawość, odwaga, cierpliwość.',
      'Wyobraź sobie jeden moment dnia, w którym ta jakość będzie potrzebna.',
      'Poczuj ją w ciele — jak smakuje ta jakość jako stan, nie jako zadanie.',
      'Weź głęboki oddech i wyraź zgodę na ten dzień.',
      'Wstań i rusz w dzień z tą intencją.',
    ],
  },
  {
    id: 'compassion', title: 'Medytacja samowspółczucia', eyebrow: 'ŁAGODNOŚĆ WOBEC SIEBIE',
    category: 'Samowspółczucie', durationMinutes: 16,
    musicOptions: ['forestMist', 'healing', 'serene'], ambientOptions: ['rain', 'forest', 'waves'],
    color: '#E879F9', icon: HeartPulse,
    description: 'Praktyka głębokiej łagodności wobec siebie. Szczególnie skuteczna po trudnych dniach, błędach i momentach oceniania siebie.',
    deeperDescription: 'Samowspółczucie nie jest słabością. To fundament zdrowia psychicznego i punkt wyjścia do realnej zmiany, nie lęku przed oceną.',
    focus: ['łagodność', 'akceptacja ograniczeń', 'wewnętrzny głos wsparcia'],
    soundDesign: ['ciepły, miękki podkład', 'łagodny głos bez dydaktyzmu', 'przestrzeń na emocje'],
    guidance: [
      'Co dziś było naprawdę trudne? Powiedz to wprost, bez minimalizowania.',
      'Co powiedziałabyś lub powiedziałbyś bliskiej osobie w tej samej sytuacji?',
      'Powiedz to teraz do siebie. Tak samo miękko.',
    ],
    aftercare: 'Samowspółczucie to praktyka codzienna. Po sesji napisz jedno zdanie troski dla siebie.',
    script: [
      'Usiądź wygodnie i połóż ręce na sercu lub kolanach.',
      'Weź trzy spokojne oddechy i pozwól ciału odpuścić.',
      'Pomyśl o czymś, co dziś było trudne, co nie wyszło, czego się wstydzisz.',
      'Nie uciekaj od tego — zostań z tym uczuciem. To jest ludzkie.',
      'Powiedz sobie: "To boli. To jest trudne."',
      'Teraz pomyśl o bliskiej osobie w takiej samej sytuacji.',
      'Co byś jej powiedział? Jakim głosem? Z jaką miłością?',
      'Teraz powiedz to samo do siebie. Te same słowa, ten sam głos.',
      '"Robisz, co możesz. Jesteś wystarczający. Zasługujesz na troskę."',
      'Poczuj ciepło tych słów w klatce piersiowej.',
      'Weź jeszcze jeden oddech i pozwól sobie być niedoskonałym — i w porządku.',
    ],
  },
  {
    id: 'loving_kindness', title: 'Medytacja miłującej dobroci', eyebrow: 'METTA — MIŁOŚĆ BEZ WARUNKÓW',
    category: 'Metta', durationMinutes: 14,
    musicOptions: ['voxscape', 'healing', 'celestial'], ambientOptions: ['forest', 'waves', 'rain'],
    color: '#FB7185', icon: HeartPulse,
    description: 'Buddyjska praktyka metta — rozsyłania życzliwości do siebie i innych, nawet tych trudnych.',
    deeperDescription: 'Metta to nie performans miłości. To ćwiczenie zdolności do życzliwości, która zaczyna się od siebie i rozszerza na innych kręgami.',
    focus: ['bezwarunkowa życzliwość', 'przebaczenie', 'współczucie dla innych'],
    soundDesign: ['delikatny ambient leśny', 'miękki podkład bez dominującego rytmu', 'krótkie frazy życzliwości'],
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
      '"Niech będzie szczęśliwa. Niech będzie bezpieczna. Niech żyje z łatwością."',
      'Teraz neutralna osoba — ktoś, kogo ledwo znasz.',
      'Wyślij jej te same życzenia z taką samą szczerością.',
      'Teraz osoba trudna. Ktoś, z kim masz konflikt.',
      '"Niech będzie szczęśliwa. Niech będzie bezpieczna." — Nawet jeśli to trudne.',
      'Na koniec: wszystkie istoty na Ziemi.',
      '"Niech wszystkie istoty żyją z łatwością i pokojem."',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// QUICK MEDITATIONS (1–3 min micro-sessions)
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_SESSIONS = [
  {
    id: 'q1', label: '1 minuta', durationSeconds: 60, title: 'Chwila oddechu',
    color: '#76A8FF', icon: Wind,
    description: 'Jeden pełny cykl oddechowy — wdech, zatrzymanie, wydech. Reset w 60 sekund.',
    script: 'Weź powolny wdech przez 4 sekundy. Zatrzymaj oddech na 2 sekundy. Wydech przez 6 sekund. Powtarzaj przez całą minutę.',
  },
  {
    id: 'q2', label: '2 minuty', durationSeconds: 120, title: 'Zakotwiczenie',
    color: '#5BC98E', icon: Shield,
    description: 'Pięć zmysłów — szybka technika uziemienia przy przeciążeniu lub lęku.',
    script: 'Nazwij 5 rzeczy, które widzisz. 4 — które czujesz dotykiem. 3 — które słyszysz. 2 — zapachy. 1 — za którą jesteś wdzięczny.',
  },
  {
    id: 'q3', label: '3 minuty', durationSeconds: 180, title: 'Spokojny umysł',
    color: '#D9B56D', icon: MoonStar,
    description: 'Prosta technika obserwacji myśli jak chmur. Nic nie zatrzymujesz.',
    script: 'Wyobraź sobie błękitne niebo. Myśli to chmury — przychodzą i odpływają. Twoim zadaniem jest tylko obserwować. Oddychaj spokojnie przez trzy minuty.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURED PROGRAMS (7-day / 21-day)
// ─────────────────────────────────────────────────────────────────────────────
const STRUCTURED_PROGRAMS = [
  {
    id: 'p7', title: '7-dniowy fundament', duration: '7 dni', color: '#76A8FF',
    icon: Target, sessions: 7,
    description: 'Idealne dla osób zaczynających praktykę. Każdy dzień to inna technika — od oddechu po wdzięczność.',
    days: [
      { day: 1, title: 'Oddech i zakotwiczenie', programId: 'anxiety', desc: 'Naucz się regulować oddech — fundament każdej praktyki.' },
      { day: 2, title: 'Skanowanie ciała', programId: 'health', desc: 'Wróć do kontaktu z ciałem i jego sygnałami.' },
      { day: 3, title: 'Skupienie i klarowność', programId: 'focus', desc: 'Trenuj uwagę — powrót do jednego punktu.' },
      { day: 4, title: 'Wdzięczność', programId: 'gratitude', desc: 'Otwórz serce na to, co już istnieje.' },
      { day: 5, title: 'Oczyszczenie energii', programId: 'cleansing', desc: 'Odłóż to, co nie Twoje.' },
      { day: 6, title: 'Samowspółczucie', programId: 'compassion', desc: 'Praktyka łagodności wobec siebie.' },
      { day: 7, title: 'Integracja i odnowa', programId: 'morning_activation', desc: 'Zamknij tydzień intencją na kolejne 7 dni.' },
    ],
  },
  {
    id: 'p21', title: '21-dniowa transformacja', duration: '21 dni', color: '#D9B56D',
    icon: TrendingUp, sessions: 21,
    description: 'Głęboki program zmiany nawyków mentalnych. Trzy tygodnie to minimalny czas, by nowy wzorzec stał się naturalny.',
    days: [
      { day: 1, title: 'Oddech jako fundament', programId: 'anxiety', desc: 'Regulacja układu nerwowego.' },
      { day: 2, title: 'Ciało i sygnały', programId: 'health', desc: 'Wróć do słuchania ciała.' },
      { day: 3, title: 'Skupienie', programId: 'focus', desc: 'Jeden punkt uwagi.' },
      { day: 4, title: 'Wdzięczność', programId: 'gratitude', desc: 'Zauważanie dobra w małym.' },
      { day: 5, title: 'Oczyszczenie', programId: 'cleansing', desc: 'Odłóż cudze energie.' },
      { day: 6, title: 'Samowspółczucie', programId: 'compassion', desc: 'Łagodność wobec siebie.' },
      { day: 7, title: 'Poranna intencja', programId: 'morning_activation', desc: 'Tydzień pierwszy zamknięty.' },
      { day: 8, title: 'Miłująca dobroć', programId: 'loving_kindness', desc: 'Rozszerz życzliwość na innych.' },
      { day: 9, title: 'Praca z cieniem', programId: 'shadow', desc: 'Spotkaj ukryte części siebie.' },
      { day: 10, title: 'Stabilność finansowa', programId: 'money', desc: 'Uziemienie relacji z materią.' },
      { day: 11, title: 'Obfitość', programId: 'abundance', desc: 'Otwórz się na przepływ.' },
      { day: 12, title: 'Zdrowie i regeneracja', programId: 'health', desc: 'Głębsza somatyczna praca.' },
      { day: 13, title: 'Sen i odpoczynek', programId: 'sleep', desc: 'Naucz się naprawdę odpoczywać.' },
      { day: 14, title: 'Integracja tygodnia', programId: 'gratitude', desc: 'Połącz dwa tygodnie w całość.' },
      { day: 15, title: 'Integracja cienia II', programId: 'shadow', desc: 'Głębsze spotkanie z tym, co ukryte.' },
      { day: 16, title: 'Metta — życzliwość', programId: 'loving_kindness', desc: 'Rozszerz miłość na trudne relacje.' },
      { day: 17, title: 'Skupienie zaawansowane', programId: 'focus', desc: 'Dłuższa sesja koncentracji.' },
      { day: 18, title: 'Oczyszczenie energetyczne', programId: 'cleansing', desc: 'Głębsze uwolnienie.' },
      { day: 19, title: 'Samowspółczucie II', programId: 'compassion', desc: 'Powrót do łagodności.' },
      { day: 20, title: 'Obfitość i sens', programId: 'abundance', desc: 'Poczucie pełni i kierunku.' },
      { day: 21, title: 'Zamknięcie i zobowiązanie', programId: 'morning_activation', desc: '21 dni za Tobą. Co dalej?' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GUIDED LIBRARY (12 meditation traditions)
// ─────────────────────────────────────────────────────────────────────────────
const GUIDED_LIBRARY = [
  { id: 'g_oddech', title: 'Oddech', color: '#76A8FF', icon: Wind, duration: '5–10 min', description: 'Podstawowa technika świadomego oddechu. Wdech przez nos, wydech przez usta. Liczymy, wracamy, nie oceniamy.' },
  { id: 'g_skan', title: 'Skanowanie ciała', color: '#5BC98E', icon: Layers, duration: '15–20 min', description: 'Systematyczne przechodzenie uwagi przez każdą część ciała. Obserwacja bez oceniania i bez zmieniania.' },
  { id: 'g_uziemienie', title: 'Uziemienie', color: '#F2A74B', icon: Shield, duration: '8–12 min', description: 'Technika powrotu do teraźniejszości przez ciało i zmysły. Szczególnie pomocna przy lęku.' },
  { id: 'g_metta', title: 'Miłująca dobroć', color: '#FB7185', icon: HeartPulse, duration: '15–20 min', description: 'Buddyjska praktyka metta. Rozsyłanie życzliwości do siebie i innych kręgami — od najbliższych do trudnych.' },
  { id: 'g_wizualizacja', title: 'Wizualizacja', color: '#D9B56D', icon: Stars, duration: '12–18 min', description: 'Kierowana podróż wyobraźnią do bezpiecznego miejsca lub pożądanego stanu wewnętrznego.' },
  { id: 'g_czakry', title: 'Czakry', color: '#8B5CF6', icon: Flower2, duration: '20–30 min', description: 'Praca z siedmioma energetycznymi centrami ciała. Od korzenia (Muladhara) przez serce do korony (Sahasrara).' },
  { id: 'g_mantra', title: 'Mantra', color: '#68D7C4', icon: Music, duration: '10–20 min', description: 'Powtarzanie świętego słowa lub frazy jako obiektu koncentracji. "So Hum", "Om", "Sat Nam".' },
  { id: 'g_vipassana', title: 'Vipassana', color: '#F472B6', icon: Brain, duration: '20–45 min', description: 'Wgląd — obserwacja powstawania i znikania doznań bez przywiązania. Rdzeń buddyjskiej medytacji.' },
  { id: 'g_transcendentalna', title: 'Transcendentalna', color: '#F59E0B', icon: MoonStar, duration: '20 min', description: 'Technika z mantrą. Delikatne zanurzenie w ciszy transcendentnej dwa razy dziennie.' },
  { id: 'g_zen', title: 'Zen / Zazen', color: '#9D8CFF', icon: Waves, duration: '20–40 min', description: 'Siedzenie w pustce bez obiektu. Sama obecność, bez celu. Pozycja, oddech, milczenie — nic więcej.' },
  { id: 'g_jungian', title: 'Jungowska', color: '#8B5CF6', icon: BookOpen, duration: '25–35 min', description: 'Praca z aktywną wyobraźnią. Dialog z symbolami, archetypami i figurami wewnętrznymi w przestrzeni cienia.' },
  { id: 'g_kosmiczna', title: 'Kosmiczna', color: '#818CF8', icon: Sparkles, duration: '15–25 min', description: 'Rozszerzanie świadomości poza ciało — do galaktyk, do pierwotnej ciszy. Perspektywa skali kosmosu.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MILESTONES
// ─────────────────────────────────────────────────────────────────────────────
const MILESTONES = [
  { days: 7, label: '7 dni z rzędu', icon: '🌱', color: '#5BC98E' },
  { days: 21, label: '21 dni z rzędu', icon: '🔥', color: '#F2A74B' },
  { days: 108, label: '108 dni z rzędu', icon: '✨', color: '#D9B56D' },
];

// ─────────────────────────────────────────────────────────────────────────────
// DAILY TECHNIQUES (one per weekday)
// ─────────────────────────────────────────────────────────────────────────────
const DAILY_TECHNIQUES = [
  { programId: 'morning_activation', label: 'Poranna aktywacja', benefit: 'Niedzielny poranek to idealna chwila na intencjonalne przebudzenie. Kilka minut oddechu i ruchu ustawia spokojny ton na cały dzień.', color: '#F59E0B' },
  { programId: 'focus', label: 'Medytacja skupienia', benefit: 'Poniedziałkowy umysł jest świeży, ale rozproszony. Klarowność skupienia pomoże Ci wejść w tydzień z jednym wyraźnym kierunkiem.', color: '#76A8FF' },
  { programId: 'abundance', label: 'Medytacja obfitości', benefit: 'We wtorek otwórz się na przepływ możliwości. Praktyka recepcji wzmacnia gotowość do działania i łagodzi opór wobec nowego.', color: '#D9B56D' },
  { programId: 'health', label: 'Regeneracja i zdrowie', benefit: 'Środa to środek tygodnia — czas, by dać ciału sygnał bezpieczeństwa. Somatyczna medytacja przywraca balans.', color: '#5BC98E' },
  { programId: 'cleansing', label: 'Oczyszczenie energii', benefit: 'Czwartek gromadzi napięcia tygodnia. Ceremonialny oddech i uwolnienie cudzego śladu sprawia, że wchodzisz w weekend lżejsza lub lżejszy.', color: '#68D7C4' },
  { programId: 'gratitude', label: 'Medytacja wdzięczności', benefit: 'Piątek prosi o refleksję nad tygodniem. Otwarte serce na tym, co istnieje, zamyka tydzień z godnością i ciepłem.', color: '#F472B6' },
  { programId: 'sleep', label: 'Medytacja snu', benefit: 'Sobotni wieczór to dar: czas bez alarmu. Łagodna sesja nocna pozwala ciału naprawdę wypocząć.', color: '#9D8CFF' },
];

const PRACTICE_TIPS = [
  { title: 'Oddech jako kotwica', body: 'Kiedy umysł odpływa — a zawsze odpływa — wróć do oddechu bez oceniania siebie. Każdy powrót to nie porażka koncentracji, lecz sam trening uwagi. Im częściej wracasz, tym silniejsza staje się Twoja zdolność do bycia tu i teraz.' },
  { title: 'Czas trwania nie jest ważniejszy od jakości', body: 'Pięć minut pełnej obecności działa głębiej niż dwadzieścia minut błądzenia myślami. Zacznij od tego, na co dziś masz przestrzeń — i nie negocjuj z perfekcjonizmem.' },
  { title: 'Po sesji — nie chwytaj od razu telefonu', body: 'Pierwsze dwie minuty po medytacji to czas, gdy to, co wewnętrzne, wciąż jest dostępne. Siedź w ciszy, zapisz jedną myśl lub intencję, zanim zewnętrzny hałas ją przykryje.' },
];

const MOOD_OPTIONS = [
  { id: 1, icon: Frown, label: 'Trudno' },
  { id: 2, icon: Meh, label: 'Neutralnie' },
  { id: 3, icon: Smile, label: 'Dobrze' },
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
// SVG TIMER CIRCLE
// ─────────────────────────────────────────────────────────────────────────────
const CIRCLE_R = 88;
const CIRCLE_STROKE = 8;
const CIRCLE_CIRCUM = 2 * Math.PI * CIRCLE_R;
const CIRCLE_CENTER = CIRCLE_R + CIRCLE_STROKE + 8;
const CIRCLE_SVG_SIZE = CIRCLE_CENTER * 2;
const BREATH_R_BASE = 52;

function TimerCircle({
  progress, color, breathScale,
}: {
  progress: number;
  color: string;
  breathScale: Reanimated.SharedValue<number>;
}) {
  const strokeDashoffset = CIRCLE_CIRCUM * (1 - Math.min(progress, 1));
  const animBreathProps = useAnimatedProps(() => ({
    r: BREATH_R_BASE * breathScale.value,
  }));
    const fetchMedAi = async () => {
    setMedAiLoading(true);
    try {
      const prompt = "Medytacja: " + program.title + ". Kategoria: " + program.category + ". Czas: " + program.durationMinutes + " min. Napisz krotka (3-4 zdania) personalizowana wskazowke jak najglebiej wejsc w te sesje medytacyjna i co zaobserwowac podczas praktyki.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight("Blad pobierania wskazowki.");
    } finally {
      setMedAiLoading(false);
    }
  };
return (
    <Svg width={CIRCLE_SVG_SIZE} height={CIRCLE_SVG_SIZE}>
      {/* outer track */}
      <Circle
        cx={CIRCLE_CENTER} cy={CIRCLE_CENTER} r={CIRCLE_R}
        stroke={color + '22'} strokeWidth={CIRCLE_STROKE} fill="none"
      />
      {/* progress arc */}
      <Circle
        cx={CIRCLE_CENTER} cy={CIRCLE_CENTER} r={CIRCLE_R}
        stroke={color} strokeWidth={CIRCLE_STROKE} fill="none"
        strokeDasharray={`${CIRCLE_CIRCUM}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        originX={CIRCLE_CENTER} originY={CIRCLE_CENTER}
      />
      {/* breathing guide (inner animated circle) */}
      <AnimatedCircle
        cx={CIRCLE_CENTER} cy={CIRCLE_CENTER}
        stroke={color + '50'} strokeWidth={2}
        fill={color + '14'}
        animatedProps={animBreathProps}
      />
      {/* ambient particle dots */}
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg - 90) * (Math.PI / 180);
        const px = CIRCLE_CENTER + (CIRCLE_R + 20) * Math.cos(rad);
        const py = CIRCLE_CENTER + (CIRCLE_R + 20) * Math.sin(rad);
        return <Circle key={deg} cx={px} cy={py} r={2.5} fill={color + '66'} />;
      })}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export const MeditationScreen: React.FC = ({ navigation }) => {
  const { t } = useTranslation();
  useAudioCleanup();
  const insets = useSafeAreaInsets();
  const themeName = useAppStore((s) => s.themeName);
  const themeMode = useAppStore((s) => s.themeMode);
  const meditationSessions = useAppStore((s) => s.meditationSessions);
  const addMeditationSession = useAppStore((s) => s.addMeditationSession);
  const addFavoriteItem = useAppStore((s) => s.addFavoriteItem);
  const isFavoriteItem = useAppStore((s) => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore((s) => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const theme = currentTheme;

  const accent = '#818CF8';
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const divColor = isLight ? 'rgba(122,95,54,0.14)' : 'rgba(255,255,255,0.07)';
  const chipBorder = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.10)';
  const chipBg = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)';
  const sessionBg = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';

  // ─── Main session state ───
  const [selectedId, setSelectedId] = useState(PROGRAMS[0].id);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [musicBlend, setMusicBlend] = useState<'music' | 'ambient' | 'immersive'>('immersive');
  const [selectedMusic, setSelectedMusic] = useState<BackgroundMusicCategory>(PROGRAMS[0].musicOptions[0]);
  const [selectedAmbient, setSelectedAmbient] = useState<AmbientSoundscape>(PROGRAMS[0].ambientOptions[0]);
  const [expandedTip, setExpandedTip] = useState<number | null>(null);
  const [medAiInsight, setMedAiInsight] = useState<string>('');
  const [medAiLoading, setMedAiLoading] = useState(false);

  // ─── Pre/post check-in ───
  const [showPreCheckIn, setShowPreCheckIn] = useState(false);
  const [showPostReflection, setShowPostReflection] = useState(false);
  const [preMood, setPreMood] = useState<number | null>(null);
  const [preEnergy, setPreEnergy] = useState(5);
  const [postMood, setPostMood] = useState<number | null>(null);
  const [starRating, setStarRating] = useState(0);
  const [insightNote, setInsightNote] = useState('');

  // ─── Quick sessions ───
  const [activeQuickId, setActiveQuickId] = useState<string | null>(null);
  const [quickElapsed, setQuickElapsed] = useState(0);
  const quickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Mute toggle ───
  const [isMuted, setIsMuted] = useState(false);
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

  // ─── Guided library ───
  const [expandedLibraryId, setExpandedLibraryId] = useState<string | null>(null);

  // ─── Structured programs ───
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);

  // ─── Body scan modal ───
  const [showBodyScan, setShowBodyScan] = useState(false);
  const [bodyScanStep, setBodyScanStep] = useState(0);
  const bodyScanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dailyTechnique = useMemo(() => DAILY_TECHNIQUES[new Date().getDay()], []);
  const pulse = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cueIndexRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const sessionAnchorY = useRef(0);
  const lastTap = useRef({ id: '', at: 0 });

  // Reanimated breathing scale for SVG
  const breathScale = useSharedValue(1);

  const program = useMemo(
    () => PROGRAMS.find((p) => p.id === selectedId) || PROGRAMS[0],
    [selectedId],
  );
  const totalSeconds = program.durationMinutes * 60;
  const remainingSeconds = Math.max(totalSeconds - elapsed, 0);
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  const Icon = program.icon;

  // ─── Computed stats ───
  const totalMinutes = useMemo(
    () => meditationSessions.reduce((s, r) => s + (r.durationMinutes || 0), 0),
    [meditationSessions],
  );
  const avgLength = useMemo(
    () => (meditationSessions.length > 0 ? Math.round(totalMinutes / meditationSessions.length) : 0),
    [meditationSessions, totalMinutes],
  );
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
      if (d === cursor.toISOString().slice(0, 10)) {
        count++;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
    return count;
  }, [meditationSessions]);

  const nextMilestone = useMemo(
    () => MILESTONES.find((m) => m.days > streak) || MILESTONES[MILESTONES.length - 1],
    [streak],
  );

  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const label = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'][d.getDay()];
      const count = meditationSessions.filter((s) => s.date.slice(0, 10) === key).length;
      return { label, count };
    });
  }, [meditationSessions]);
  const maxBarCount = Math.max(...monthlyData.map((d) => d.count), 1);

  const BODY_SCAN_STEPS: string[] = program.script || PROGRAMS[1].script || [];

  // ─── Pulse animation ───
  useEffect(() => {
    if (!isRunning) {
      pulse.stopAnimation();
      pulse.setValue(0);
      breathScale.value = withTiming(1, { duration: 600 });
      return;
    }
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 4200, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 4200, useNativeDriver: true }),
    ]));
    anim.start();
    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.28, { duration: 4000 }),
        withTiming(0.80, { duration: 4000 }),
      ),
      -1, false,
    );
      const fetchMedAi = async () => {
    setMedAiLoading(true);
    try {
      const prompt = "Medytacja: " + program.title + ". Kategoria: " + program.category + ". Czas: " + program.durationMinutes + " min. Napisz krotka (3-4 zdania) personalizowana wskazowke jak najglebiej wejsc w te sesje medytacyjna i co zaobserwowac podczas praktyki.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight("Blad pobierania wskazowki.");
    } finally {
      setMedAiLoading(false);
    }
  };
return () => anim.stop();
  }, [isRunning]);

  const orbScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const orbOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.32] });

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
    addMeditationSession({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      durationMinutes: sessionMinutes,
      technique: program.title,
    });
    setElapsed(0);
    setShowPostReflection(true);
  }, [addMeditationSession, elapsed, program.title, stopSession]);

  const startSession = useCallback(async () => {
    await stopSession();
    // Ensure mute is off so the session audio is always audible
    setIsMuted(false);
    setIsRunning(true);
    scrollToSession();
    // Play music: use playAmbientForSession for ambient-type categories that
    // bypass the global backgroundMusicEnabled pref. Both session helpers
    // temporarily enable their respective layer for the duration of the call.
    if (musicBlend === 'music' || musicBlend === 'immersive') {
      AudioService.setUserInteracted();
      await AudioService.playMusicForSession(selectedMusic);
    }
    if (musicBlend === 'ambient' || musicBlend === 'immersive') {
      AudioService.setUserInteracted();
      await AudioService.playAmbientForSession(selectedAmbient);
    }
    intervalRef.current = setInterval(() => {
      setElapsed((v) => {
        const next = v + 1;
        if (next >= totalSeconds) {
          void handleSessionComplete();
          return totalSeconds;
        }
        return next;
      });
    }, 1000);
  }, [handleSessionComplete, musicBlend, program, scrollToSession, selectedAmbient, selectedMusic, stopSession, totalSeconds]);

  useEffect(() => {
    setSelectedMusic(program.musicOptions[0]);
    setSelectedAmbient(program.ambientOptions[0]);
  }, [program]);

  useEffect(() => {
    if (!isRunning) {
      void AudioService.primeSessionAudio(selectedMusic, selectedAmbient, program.musicOptions);
    }
  }, [selectedAmbient, selectedMusic, program.musicOptions, isRunning]);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (quickIntervalRef.current) clearInterval(quickIntervalRef.current);
    if (bodyScanIntervalRef.current) clearInterval(bodyScanIntervalRef.current);
  }, []);

  const chooseProgram = useCallback((id: string) => {
    if (isRunning) return;
    const now = Date.now();
    const isDouble = lastTap.current.id === id && now - lastTap.current.at < 360;
    lastTap.current = { id, at: now };
    setSelectedId(id);
    const next = PROGRAMS.find((p) => p.id === id);
    if (next) {
      setSelectedMusic(next.musicOptions[0]);
      setSelectedAmbient(next.ambientOptions[0]);
      void AudioService.primeSessionAudio(next.musicOptions[0], next.ambientOptions[0], next.musicOptions);
    }
    scrollToSession();
    if (isDouble) scrollToSession();
  }, [isRunning, scrollToSession]);

  // ─── Quick sessions ───
  const startQuickSession = useCallback((id: string) => {
    if (quickIntervalRef.current) { clearInterval(quickIntervalRef.current); quickIntervalRef.current = null; }
    const qs = QUICK_SESSIONS.find((s) => s.id === id);
    if (!qs) return;
    setActiveQuickId(id);
    setQuickElapsed(0);
    quickIntervalRef.current = setInterval(() => {
      setQuickElapsed((v) => {
        if (v + 1 >= qs.durationSeconds) {
          clearInterval(quickIntervalRef.current!);
          setActiveQuickId(null);
          return 0;
        }
        return v + 1;
      });
    }, 1000);
  }, []);

  const stopQuickSession = useCallback(async () => {
    if (quickIntervalRef.current) { clearInterval(quickIntervalRef.current); quickIntervalRef.current = null; }
    setActiveQuickId(null);
    setQuickElapsed(0);
  }, []);

  // ─── Body scan ───
  const startBodyScan = useCallback(() => {
    if (BODY_SCAN_STEPS.length === 0) return;
    setShowBodyScan(true);
    setBodyScanStep(0);
    let step = 0;
    bodyScanIntervalRef.current = setInterval(() => {
      step++;
      if (step >= BODY_SCAN_STEPS.length) {
        clearInterval(bodyScanIntervalRef.current!);
        return;
      }
      setBodyScanStep(step);
    }, 12000);
  }, [BODY_SCAN_STEPS]);

  const stopBodyScan = useCallback(() => {
    if (bodyScanIntervalRef.current) { clearInterval(bodyScanIntervalRef.current); bodyScanIntervalRef.current = null; }
    setShowBodyScan(false);
    setBodyScanStep(0);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
    const fetchMedAi = async () => {
    setMedAiLoading(true);
    try {
      const prompt = "Medytacja: " + program.title + ". Kategoria: " + program.category + ". Czas: " + program.durationMinutes + " min. Napisz krotka (3-4 zdania) personalizowana wskazowke jak najglebiej wejsc w te sesje medytacyjna i co zaobserwowac podczas praktyki.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight("Blad pobierania wskazowki.");
    } finally {
      setMedAiLoading(false);
    }
  };
return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isLight ? ['#FDF8F1', '#F6ECDE', '#EFE2D2'] : ['#04060D', '#0B1220', '#121C31']}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[program.color + '24', 'transparent', program.color + '10']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* ── Header ── */}
        <View style={[styles.header, { borderBottomColor: divColor }]}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} hitSlop={14} style={styles.backBtn}>
            <ChevronLeft color={subColor} size={22} strokeWidth={1.8} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('meditation.title')}</Text>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <MusicToggleButton color={accent} size={19} />
            <Pressable onPress={toggleMute} hitSlop={14}>
              {isMuted
                ? <VolumeX color={accent} size={19} strokeWidth={1.8} />
                : <Volume2 color={accent + '88'} size={19} strokeWidth={1.8} />
              }
            </Pressable>
            <Pressable
              onPress={() => { if (isFavoriteItem('meditation')) { removeFavoriteItem('meditation'); } else { addFavoriteItem({ id: 'meditation', label: 'Medytacja', route: 'Meditation', params: {}, icon: 'MoonStar', color: accent, addedAt: new Date().toISOString() }); } }}
              hitSlop={14}
            >
              <Star
                color={isFavoriteItem('meditation') ? accent : accent + '88'}
                size={19} strokeWidth={1.8}
                fill={isFavoriteItem('meditation') ? accent : 'none'}
              />
            </Pressable>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') + 26 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ═══════════════════════════════════════════════════════════════
              HERO
          ═══════════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(0)} style={styles.heroSection}>
            <View style={styles.heroTop}>
              <View style={[styles.heroIcon, { backgroundColor: program.color + '16', borderColor: program.color + '44' }]}>
                <Icon color={program.color} size={26} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="premiumLabel" color={program.color}>{program.eyebrow}</Typography>
                <Typography variant="heroTitle" style={{ color: theme.text, marginTop: 6 }}>Medytacja premium</Typography>
              </View>
            </View>
            <Typography variant="bodySmall" style={{ color: theme.textMuted, marginTop: 14, lineHeight: 24 }}>
              Każda ścieżka ma własny pejzaż dźwiękowy, rytm guidance i wyraźną intencję. To nie jest prosty timer — to ceremonia z właściwym tonem, ciszą i słowem na każdym etapie.
            </Typography>
            <View style={styles.metricsRow}>
              {[
                { icon: MoonStar, label: `${program.durationMinutes} min` },
                { icon: Volume2, label: 'ciągłe audio' },
                { icon: Stars, label: 'immersyjny ambient' },
              ].map((item) => {
                const MI = item.icon;
                  const fetchMedAi = async () => {
    setMedAiLoading(true);
    try {
      const prompt = "Medytacja: " + program.title + ". Kategoria: " + program.category + ". Czas: " + program.durationMinutes + " min. Napisz krotka (3-4 zdania) personalizowana wskazowke jak najglebiej wejsc w te sesje medytacyjna i co zaobserwowac podczas praktyki.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight("Blad pobierania wskazowki.");
    } finally {
      setMedAiLoading(false);
    }
  };
return (
                  <View key={item.label} style={[styles.metricPill, { borderColor: program.color + '36', backgroundColor: program.color + '0D' }]}>
                    <MI color={program.color} size={13} />
                    <Typography variant="microLabel" color={program.color} style={styles.metricLabel}>{item.label}</Typography>
                  </View>
                );
              })}
            </View>
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════════════════
              SESSION STATS RAIL
          ═══════════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(30)} style={[styles.statRail, { backgroundColor: cardBg, borderColor: divColor }]}>
            {[
              { icon: Clock, val: totalMinutes, label: 'minut łącznie', color: accent },
              { icon: BarChart2, val: avgLength, label: 'avg min', color: accent },
              { icon: Flame, val: streak, label: 'dni z rzędu', color: streak > 0 ? '#F2A74B' : subColor },
              { icon: Trophy, val: meditationSessions.length, label: 'sesji', color: accent },
            ].map((item, i) => {
              const SI = item.icon;
                const fetchMedAi = async () => {
    setMedAiLoading(true);
    try {
      const prompt = "Medytacja: " + program.title + ". Kategoria: " + program.category + ". Czas: " + program.durationMinutes + " min. Napisz krotka (3-4 zdania) personalizowana wskazowke jak najglebiej wejsc w te sesje medytacyjna i co zaobserwowac podczas praktyki.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight("Blad pobierania wskazowki.");
    } finally {
      setMedAiLoading(false);
    }
  };
return (
                <React.Fragment key={i}>
                  {i > 0 && <View style={[styles.statDivider, { backgroundColor: divColor }]} />}
                  <View style={styles.statItem}>
                    <SI color={item.color} size={15} strokeWidth={1.7} />
                    <Text style={[styles.statValue, { color: textColor }]}>{item.val}</Text>
                    <Text style={[styles.statLabel, { color: subColor }]}>{item.label}</Text>
                  </View>
                </React.Fragment>
              );
            })}
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════════════════
              STREAK + MILESTONES
          ═══════════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(50)} style={[styles.card, { backgroundColor: cardBg, borderColor: divColor }]}>
            <View style={styles.cardHeader}>
              <Flame color="#F2A74B" size={14} strokeWidth={1.7} />
              <Text style={[styles.eyebrow, { color: subColor }]}>{t('meditation.streak').toUpperCase()}</Text>
            </View>
            <View style={styles.streakRow}>
              <View style={styles.streakBadge}>
                <Text style={styles.streakCount}>{streak}</Text>
                <Text style={[styles.streakDaysLabel, { color: subColor }]}>dni z rzędu</Text>
              </View>
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={[styles.streakNextLabel, { color: subColor }]}>Następny kamień milowy:</Text>
                <View style={[styles.milestoneRow, { borderColor: nextMilestone.color + '44', backgroundColor: nextMilestone.color + '0E' }]}>
                  <Text style={styles.milestoneIcon}>{nextMilestone.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.milestoneLabel, { color: textColor }]}>{nextMilestone.label}</Text>
                    <Text style={[styles.milestoneRemaining, { color: subColor }]}>{Math.max(nextMilestone.days - streak, 0)} dni do celu</Text>
                  </View>
                </View>
                <View style={[styles.milestoneTrack, { backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)' }]}>
                  <View style={[styles.milestoneFill, { width: `${Math.min((streak / nextMilestone.days) * 100, 100)}%`, backgroundColor: nextMilestone.color }]} />
                </View>
              </View>
            </View>
            <View style={styles.achievedRow}>
              {MILESTONES.map((m) => {
                const done = streak >= m.days;
                  const fetchMedAi = async () => {
    setMedAiLoading(true);
    try {
      const prompt = "Medytacja: " + program.title + ". Kategoria: " + program.category + ". Czas: " + program.durationMinutes + " min. Napisz krotka (3-4 zdania) personalizowana wskazowke jak najglebiej wejsc w te sesje medytacyjna i co zaobserwowac podczas praktyki.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight("Blad pobierania wskazowki.");
    } finally {
      setMedAiLoading(false);
    }
  };
return (
                  <View key={m.days} style={[styles.achievedBadge, { borderColor: done ? m.color + '66' : divColor, backgroundColor: done ? m.color + '14' : 'transparent' }]}>
                    <Text style={{ fontSize: 15 }}>{m.icon}</Text>
                    <Text style={[styles.achievedLabel, { color: done ? m.color : subColor }]}>{m.label}</Text>
                  </View>
                );
              })}
            </View>
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════════════════
              WEEKLY CHART
          ═══════════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(70)} style={[styles.card, { backgroundColor: cardBg, borderColor: divColor }]}>
            <View style={styles.cardHeader}>
              <Calendar color={accent} size={14} strokeWidth={1.7} />
              <Text style={[styles.eyebrow, { color: subColor }]}>AKTYWNOŚĆ — 7 DNI</Text>
            </View>
            <View style={styles.chartRow}>
              {monthlyData.map((day, i) => (
                <View key={i} style={styles.chartCol}>
                  <View style={[styles.chartBarTrack, { backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)' }]}>
                    <View style={[styles.chartBar, {
                      height: `${(day.count / maxBarCount) * 100}%`,
                      backgroundColor: day.count > 0 ? accent : 'transparent',
                    }]} />
                  </View>
                  <Text style={[styles.chartLabel, { color: subColor }]}>{day.label}</Text>
                  {day.count > 0 && <View style={[styles.chartDot, { backgroundColor: accent }]} />}
                </View>
              ))}
            </View>
            <Text style={[styles.chartLegendText, { color: subColor, borderTopColor: divColor }]}>
              Ulubiona technika: <Text style={{ color: textColor }}>{favTechnique}</Text>
            </Text>
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════════════════
              DAILY TECHNIQUE
          ═══════════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(50)}
            style={[styles.dailyCard, { backgroundColor: dailyTechnique.color + '0F', borderColor: dailyTechnique.color + '40' }]}
          >
            <LinearGradient colors={[dailyTechnique.color + '1A', 'transparent']} style={StyleSheet.absoluteFill} />
            <View style={styles.dailyHeader}>
              <Sparkles color={dailyTechnique.color} size={13} strokeWidth={1.7} />
              <Text style={[styles.eyebrow, { color: dailyTechnique.color }]}>✦ POLECANA TECHNIKA DNIA</Text>
            </View>
            <Text style={[styles.dailyTitle, { color: textColor }]}>{dailyTechnique.label}</Text>
            <Text style={[styles.dailyBenefit, { color: subColor }]}>{dailyTechnique.benefit}</Text>
            <Pressable
              onPress={() => { if (!isRunning) chooseProgram(dailyTechnique.programId); }}
              style={[styles.dailyBtn, { backgroundColor: dailyTechnique.color }]}
            >
              <ArrowRight color="#fff" size={14} strokeWidth={2} />
              <Text style={styles.dailyBtnText}>Wybierz tę technikę</Text>
            </Pressable>
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════════════════
              QUICK / MICRO SESSIONS
          ═══════════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(30)}>
            <View style={styles.sectionHeaderRow}>
              <Zap color={accent} size={13} strokeWidth={1.9} />
              <Text style={[styles.eyebrow, { color: subColor }]}>MICRO SESJE</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Szybka chwila spokoju</Text>
            <Text style={[styles.sectionBody, { color: subColor }]}>1, 2 lub 3 minuty — kiedy potrzebujesz natychmiastowego resetu bez przygotowania.</Text>
            <View style={styles.quickGrid}>
              {QUICK_SESSIONS.map((qs) => {
                const QI = qs.icon;
                const isActive = activeQuickId === qs.id;
                const qProg = isActive ? quickElapsed / qs.durationSeconds : 0;
                  const fetchMedAi = async () => {
    setMedAiLoading(true);
    try {
      const prompt = "Medytacja: " + program.title + ". Kategoria: " + program.category + ". Czas: " + program.durationMinutes + " min. Napisz krotka (3-4 zdania) personalizowana wskazowke jak najglebiej wejsc w te sesje medytacyjna i co zaobserwowac podczas praktyki.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight("Blad pobierania wskazowki.");
    } finally {
      setMedAiLoading(false);
    }
  };
return (
                  <Pressable
                    key={qs.id}
                    onPress={() => isActive ? stopQuickSession() : startQuickSession(qs.id)}
                    style={[
                      styles.quickCard,
                      { borderColor: isActive ? qs.color + '66' : divColor, backgroundColor: isActive ? qs.color + '10' : cardBg },
                    ]}
                  >
                    <LinearGradient colors={[qs.color + '18', 'transparent']} style={StyleSheet.absoluteFill} />
                    <View style={[styles.quickIconBadge, { backgroundColor: qs.color + '1A' }]}>
                      <QI color={qs.color} size={22} strokeWidth={1.8} />
                    </View>
                    <Text style={[styles.quickChipLabel, { color: qs.color }]}>{qs.label}</Text>
                    <Text style={[styles.quickTitle, { color: textColor }]}>{qs.title}</Text>
                    <Text style={[styles.quickDesc, { color: subColor }]} numberOfLines={2}>{qs.description}</Text>
                    {isActive && (
                      <>
                        <View style={[styles.progressTrack, { backgroundColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)', marginTop: 8 }]}>
                          <View style={[styles.progressFill, { width: `${qProg * 100}%`, backgroundColor: qs.color }]} />
                        </View>
                        <Text style={[styles.quickTimeLeft, { color: qs.color }]}>
                          {formatDuration(qs.durationSeconds - quickElapsed)}
                        </Text>
                      </>
                    )}
                    <View style={[styles.quickActionBtn, { backgroundColor: isActive ? qs.color + '22' : qs.color }]}>
                      {isActive
                        ? <><Pause color={qs.color} size={14} /><Text style={[styles.quickBtnText, { color: qs.color }]}>Stop</Text></>
                        : <><Play color="#fff" size={14} /><Text style={[styles.quickBtnText, { color: '#fff' }]}>Start</Text></>
                      }
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════════════════
              PROGRAM SELECTOR
          ═══════════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(12)} style={styles.selectorSection}>
            <Typography variant="premiumLabel" color={theme.textMuted} style={{ marginBottom: 4 }}>🌿 {t('meditation.technique').toUpperCase()}</Typography>
            <Typography variant="screenTitle" style={{ color: theme.text }}>{t('meditation.selectDuration')}</Typography>
            <Typography variant="bodySmall" style={{ color: theme.textMuted, marginTop: 6, marginBottom: 16 }}>
              Każda ścieżka ma własną energię. Po wyborze ekran prowadzi Cię niżej, prosto do aktywnego centrum sesji.
            </Typography>
            {PROGRAMS.map((item, index) => {
              const PI = item.icon;
              const active = item.id === selectedId;
                const fetchMedAi = async () => {
    setMedAiLoading(true);
    try {
      const prompt = "Medytacja: " + program.title + ". Kategoria: " + program.category + ". Czas: " + program.durationMinutes + " min. Napisz krotka (3-4 zdania) personalizowana wskazowke jak najglebiej wejsc w te sesje medytacyjna i co zaobserwowac podczas praktyki.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight("Blad pobierania wskazowki.");
    } finally {
      setMedAiLoading(false);
    }
  };
return (
                <Pressable
                  key={item.id}
                  onPress={() => chooseProgram(item.id)}
                  disabled={isRunning}
                  style={[
                    styles.programRow,
                    {
                      borderWidth: 1,
                      borderColor: active ? item.color + '66' : (isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)'),
                      backgroundColor: active ? item.color + '14' : (isLight ? 'rgba(255,246,230,0.92)' : 'rgba(255,255,255,0.07)'),
                      borderLeftWidth: active ? 3 : 1,
                      borderLeftColor: active ? item.color : (isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)'),
                    },
                  ]}
                >
                  <View style={[styles.programBadge, { backgroundColor: item.color + '16' }]}>
                    <PI color={item.color} size={18} strokeWidth={1.9} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.programTitleRow}>
                      <Typography variant="cardTitle" style={{ color: theme.text, flex: 1 }}>{item.title}</Typography>
                      <Typography variant="premiumLabel" color={item.color}>{item.durationMinutes} min</Typography>
                    </View>
                    <Typography variant="bodySmall" style={{ color: theme.textMuted }}>{item.description}</Typography>
                    {active && (
                      <Typography variant="bodySmall" style={{ color: theme.textMuted, marginTop: 4 }}>{item.deeperDescription}</Typography>
                    )}
                    <View style={styles.tagsRow}>
                      {item.focus.map((tag) => (
                        <View key={tag} style={[styles.tag, { borderColor: item.color + '30', backgroundColor: item.color + '0D' }]}>
                          <Typography variant="microLabel" color={item.color}>{tag}</Typography>
                        </View>
                      ))}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════════════════
              SESSION CONTROLS
          ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.controlSection}>
            <Typography variant="premiumLabel" color={program.color} style={{ marginBottom: 12 }}>🎵 TRYB SESJI</Typography>
            <View style={styles.chipRow}>
              {([{ id: 'music', label: 'Muzyka' }, { id: 'ambient', label: 'Ambient' }, { id: 'immersive', label: 'Immersive' }]).map((opt) => {
                const active = musicBlend === opt.id;
                  const fetchMedAi = async () => {
    setMedAiLoading(true);
    try {
      const prompt = "Medytacja: " + program.title + ". Kategoria: " + program.category + ". Czas: " + program.durationMinutes + " min. Napisz krotka (3-4 zdania) personalizowana wskazowke jak najglebiej wejsc w te sesje medytacyjna i co zaobserwowac podczas praktyki.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight("Blad pobierania wskazowki.");
    } finally {
      setMedAiLoading(false);
    }
  };
return (
                  <Pressable key={opt.id} onPress={() => !isRunning && setMusicBlend(opt.id as any)} style={[styles.modeChip, { borderColor: active ? program.color + '55' : chipBorder, backgroundColor: active ? program.color + '14' : chipBg }]}>
                    <Typography variant="microLabel" color={active ? program.color : theme.textMuted}>{opt.label}</Typography>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.controlDivider, { borderTopColor: divColor }]}>
              <Typography variant="microLabel" color={program.color} style={{ marginBottom: 10 }}>Muzyka tej medytacji</Typography>
              <View style={styles.chipRow}>
                {program.musicOptions.map((opt) => {
                  const active = selectedMusic === opt;
                    const fetchMedAi = async () => {
    setMedAiLoading(true);
    try {
      const prompt = "Medytacja: " + program.title + ". Kategoria: " + program.category + ". Czas: " + program.durationMinutes + " min. Napisz krotka (3-4 zdania) personalizowana wskazowke jak najglebiej wejsc w te sesje medytacyjna i co zaobserwowac podczas praktyki.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight("Blad pobierania wskazowki.");
    } finally {
      setMedAiLoading(false);
    }
  };
return (
                    <Pressable key={opt} onPress={() => !isRunning && setSelectedMusic(opt)} style={[styles.choiceChip, { borderColor: active ? program.color + '55' : chipBorder, backgroundColor: active ? program.color + '14' : chipBg }]}>
                      <Typography variant="microLabel" color={active ? program.color : theme.textMuted}>{MUSIC_LABELS[opt] || opt}</Typography>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={[styles.controlDivider, { borderTopColor: divColor }]}>
              <Typography variant="microLabel" color={program.color} style={{ marginBottom: 10 }}>Krajobraz dźwiękowy</Typography>
              <View style={styles.chipRow}>
                {program.ambientOptions.map((opt) => {
                  const active = selectedAmbient === opt;
                    const fetchMedAi = async () => {
    setMedAiLoading(true);
    try {
      const prompt = "Medytacja: " + program.title + ". Kategoria: " + program.category + ". Czas: " + program.durationMinutes + " min. Napisz krotka (3-4 zdania) personalizowana wskazowke jak najglebiej wejsc w te sesje medytacyjna i co zaobserwowac podczas praktyki.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight("Blad pobierania wskazowki.");
    } finally {
      setMedAiLoading(false);
    }
  };
return (
                    <Pressable key={opt} onPress={() => !isRunning && setSelectedAmbient(opt)} style={[styles.choiceChip, { borderColor: active ? program.color + '55' : chipBorder, backgroundColor: active ? program.color + '14' : chipBg }]}>
                      <Typography variant="microLabel" color={active ? program.color : theme.textMuted}>{AMBIENT_LABELS[opt] || opt}</Typography>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════
              ACTIVE SESSION — SVG TIMER CIRCLE
          ═══════════════════════════════════════════════════════════════ */}
          <View
            onLayout={(e) => { sessionAnchorY.current = e.nativeEvent.layout.y; }}
            style={[styles.sessionSection, { backgroundColor: sessionBg, borderTopWidth: 2, borderTopColor: program.color + '44' }]}
          >
            <Typography variant="premiumLabel" color={program.color}>⭐ {program.category}</Typography>
            <Typography variant="editorialHeader" style={{ color: theme.text, marginTop: 8 }}>{program.title}</Typography>
            <Typography variant="bodySmall" style={{ color: theme.textMuted, marginTop: 10 }}>{program.deeperDescription}</Typography>

            {/* SVG Timer Circle */}
            <View style={styles.timerWrapper}>
              {/* Pulse glow behind circle */}
              <Animated.View style={[
                styles.timerGlow,
                { backgroundColor: program.color, opacity: orbOpacity, transform: [{ scale: orbScale }] },
              ]} />
              <TimerCircle progress={progress} color={program.color} breathScale={breathScale} />
              {/* Text overlay */}
              <View style={styles.timerTextOverlay}>
                <Text style={[styles.timerPercent, { color: program.color }]}>
                  {Math.round(progress * 100)}%
                </Text>
                <Text style={[styles.timerTime, { color: textColor }]}>
                  {formatDuration(remainingSeconds)}
                </Text>
                <Text style={[styles.timerRemLabel, { color: subColor }]}>pozostało</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={[styles.progressTrack, { backgroundColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)' }]}>
              <View style={[styles.progressFill, { width: `${Math.max(progress * 100, 2)}%`, backgroundColor: program.color }]} />
            </View>

            {/* Guidance panel */}
            <View style={[styles.guidancePanel, {
              backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)',
              borderTopColor: program.color + '22', borderTopWidth: 1,
            }]}>
              <Typography variant="microLabel" color={program.color}>Prowadzenie tej ścieżki</Typography>
              <Typography variant="bodySmall" style={{ color: theme.textMuted }}>
                {program.guidance[Math.min(cueIndexRef.current, program.guidance.length - 1)]}
              </Typography>
              <Typography variant="caption" style={{ color: theme.textMuted, marginTop: 8 }}>
                Aktywna ścieżka: {selectedMusic} · {selectedAmbient}
              </Typography>
            </View>

            {/* Body scan button */}
            {!isRunning && program.script && program.script.length > 0 && (
              <Pressable
                onPress={startBodyScan}
                style={[styles.bodyScanBtn, { borderColor: program.color + '44', backgroundColor: program.color + '10' }]}
              >
                <Layers color={program.color} size={14} strokeWidth={1.8} />
                <Text style={[styles.bodyScanBtnText, { color: program.color }]}>Uruchom skanowanie ciała</Text>
              </Pressable>
            )}

            {/* Action row */}
            <View style={styles.actionRow}>
              <Pressable
                onPress={isRunning ? stopSession : () => setShowPreCheckIn(true)}
                style={[styles.primaryAction, { backgroundColor: program.color }]}
              >
                {isRunning ? <Pause color="#fff" size={18} /> : <Play color="#fff" size={18} />}
                <Typography variant="button" style={styles.primaryActionText}>
                  {isRunning ? t('meditation.finish') : t('meditation.start')}
                </Typography>
              </Pressable>
              <Pressable
                onPress={() => !isRunning && setElapsed(0)}
                style={[styles.secondaryAction, { borderColor: program.color + '30' }]}
              >
                <TimerReset color={program.color} size={16} />
                <Typography variant="microLabel" color={program.color} style={{ marginLeft: 8 }}>reset</Typography>
              </Pressable>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════
              SOUND DESIGN
          ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.infoSection}>
            <Typography variant="premiumLabel" color={program.color} style={{ marginBottom: 4 }}>🔮 PEJZAŻ DŹWIĘKOWY</Typography>
            {program.soundDesign.map((item, i) => (
              <View key={item} style={[styles.infoRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: divColor }]}>
                <ArrowDownCircle color={program.color} size={15} />
                <Typography variant="bodySmall" style={{ flex: 1, color: theme.textMuted }}>{item}</Typography>
              </View>
            ))}
          </View>

          {/* ═══════════════════════════════════════════════════════════════
              GUIDANCE STEPS
          ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.stepsSection}>
            <Typography variant="premiumLabel" color={program.color} style={{ marginBottom: 4 }}>✦ CO WYDARZY SIĘ W TEJ SESJI</Typography>
            {program.guidance.map((step, i) => (
              <View key={step} style={[styles.stepRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: divColor }]}>
                <View style={[styles.stepNumber, { backgroundColor: program.color + '18' }]}>
                  <Typography variant="microLabel" color={program.color}>{`0${i + 1}`}</Typography>
                </View>
                <Typography variant="bodySmall" style={{ flex: 1, color: theme.textMuted }}>{step}</Typography>
              </View>
            ))}
          </View>

          {/* ═══════════════════════════════════════════════════════════════
              FULL MEDITATION SCRIPT
          ═══════════════════════════════════════════════════════════════ */}
          {program.script && program.script.length > 0 && (
            <Reanimated.View entering={FadeInDown.delay(12)} style={[styles.card, { backgroundColor: cardBg, borderColor: divColor }]}>
              <View style={styles.cardHeader}>
                <PenLine color={program.color} size={14} strokeWidth={1.8} />
                <Text style={[styles.eyebrow, { color: subColor }]}>SKRYPT MEDYTACJI</Text>
              </View>
              <Text style={[styles.sectionBody, { color: subColor }]}>
                Pełny tekst tej sesji — możesz przeczytać przed startem lub podążać za nim podczas skanowania ciała.
              </Text>
              {program.script.map((line, i) => (
                <View key={i} style={[styles.scriptLine, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: divColor }]}>
                  <View style={[styles.scriptDot, { backgroundColor: program.color + '66' }]} />
                  <Text style={[styles.scriptText, { color: subColor }]}>{line}</Text>
                </View>
              ))}
            </Reanimated.View>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              GUIDED LIBRARY (12 traditions)
          ═══════════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(25)}>
            <View style={styles.sectionHeaderRow}>
              <BookOpen color={accent} size={13} strokeWidth={1.9} />
              <Text style={[styles.eyebrow, { color: subColor }]}>BIBLIOTEKA TECHNIK</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: textColor }]}>12 ścieżek medytacyjnych</Text>
            <Text style={[styles.sectionBody, { color: subColor }]}>
              Od prostego oddechu po zaawansowaną medytację jungowską. Każda technika ma własny charakter, czas i cel.
            </Text>
            {GUIDED_LIBRARY.map((item, index) => {
              const LI = item.icon;
              const isOpen = expandedLibraryId === item.id;
                const fetchMedAi = async () => {
    setMedAiLoading(true);
    try {
      const prompt = "Medytacja: " + program.title + ". Kategoria: " + program.category + ". Czas: " + program.durationMinutes + " min. Napisz krotka (3-4 zdania) personalizowana wskazowke jak najglebiej wejsc w te sesje medytacyjna i co zaobserwowac podczas praktyki.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight("Blad pobierania wskazowki.");
    } finally {
      setMedAiLoading(false);
    }
  };
return (
                <Pressable
                  key={item.id}
                  onPress={() => setExpandedLibraryId(isOpen ? null : item.id)}
                  style={[styles.libraryRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: divColor }]}
                >
                  <View style={[styles.libraryBadge, { backgroundColor: item.color + '18' }]}>
                    <LI color={item.color} size={17} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={styles.libraryTitleRow}>
                      <Text style={[styles.libraryTitle, { color: textColor, flex: 1 }]}>{item.title}</Text>
                      <Text style={[styles.libraryDuration, { color: item.color }]}>{item.duration}</Text>
                      {isOpen
                        ? <ChevronUp color={subColor} size={13} strokeWidth={1.9} />
                        : <ChevronDown color={subColor} size={13} strokeWidth={1.9} />
                      }
                    </View>
                    <Text style={[styles.libraryDesc, { color: subColor }]} numberOfLines={isOpen ? undefined : 1}>
                      {item.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </Reanimated.View>

          {/* ═══════════════════════════════════════════════════════════════
              STRUCTURED PROGRAMS (7-day / 21-day)
          ═══════════════════════════════════════════════════════════════ */}
          <Reanimated.View entering={FadeInDown.delay(40)}>
            <View style={styles.sectionHeaderRow}>
              <Target color={accent} size={13} strokeWidth={1.9} />
              <Text style={[styles.eyebrow, { color: subColor }]}>PROGRAMY STRUKTURALNE</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Transformacja krok po kroku</Text>
            <Text style={[styles.sectionBody, { color: subColor }]}>
              7 lub 21 dni codziennej praktyki. Każdy dzień to inna technika — razem tworzą trwałą transformację.
            </Text>
            {STRUCTURED_PROGRAMS.map((prog) => {
              const PRI = prog.icon;
              const isOpen = expandedProgramId === prog.id;
                const fetchMedAi = async () => {
    setMedAiLoading(true);
    try {
      const prompt = "Medytacja: " + program.title + ". Kategoria: " + program.category + ". Czas: " + program.durationMinutes + " min. Napisz krotka (3-4 zdania) personalizowana wskazowke jak najglebiej wejsc w te sesje medytacyjna i co zaobserwowac podczas praktyki.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight("Blad pobierania wskazowki.");
    } finally {
      setMedAiLoading(false);
    }
  };
return (
                <View key={prog.id} style={[styles.structuredCard, { borderColor: isOpen ? prog.color + '55' : divColor, backgroundColor: isOpen ? prog.color + '08' : cardBg }]}>
                  <Pressable onPress={() => setExpandedProgramId(isOpen ? null : prog.id)} style={styles.structuredCardHeader}>
                    <View style={[styles.structuredBadge, { backgroundColor: prog.color + '18' }]}>
                      <PRI color={prog.color} size={18} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.structuredTitle, { color: textColor }]}>{prog.title}</Text>
                      <Text style={[styles.structuredSub, { color: subColor }]}>{prog.duration} · {prog.sessions} sesji</Text>
                    </View>
                    {isOpen ? <ChevronUp color={subColor} size={15} /> : <ChevronDown color={subColor} size={15} />}
                  </Pressable>
                  {isOpen && (
                    <View style={[styles.structuredBody, { borderTopColor: divColor }]}>
                      <Text style={[styles.structuredDesc, { color: subColor }]}>{prog.description}</Text>
                      {prog.days.map((day) => (
                        <View key={day.day} style={[styles.structuredDayRow, { borderTopColor: divColor }]}>
                          <View style={[styles.structuredDayNum, { backgroundColor: prog.color + '18' }]}>
                            <Text style={[styles.structuredDayNumText, { color: prog.color }]}>{day.day}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.structuredDayTitle, { color: textColor }]}>{day.title}</Text>
                            <Text style={[styles.structuredDayDesc, { color: subColor }]}>{day.desc}</Text>
                          </View>
                          <Pressable
                            onPress={() => { chooseProgram(day.programId); setExpandedProgramId(null); scrollToSession(); }}
                            style={[styles.structuredDayBtn, { borderColor: prog.color + '44' }]}
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

          {/* ═══════════════════════════════════════════════════════════════
              AFTERCARE
          ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.aftercareSection}>
            <Typography variant="premiumLabel" color={program.color} style={{ marginBottom: 10 }}>🌱 PO SESJI</Typography>
            <Typography variant="bodySmall" style={{ color: theme.textMuted }}>{program.aftercare}</Typography>
          </View>

          {/* ═══════════════════════════════════════════════════════════════
              PRACTICE TIPS
          ═══════════════════════════════════════════════════════════════ */}
          <View style={[styles.tipsSection, { borderColor: isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.09)' }]}>
            <Text style={[styles.tipsHeader, { color: isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)' }]}>💡 {t('meditation.meditationTips').toUpperCase()}</Text>
            {PRACTICE_TIPS.map((tip, i) => {
              const isOpen = expandedTip === i;
                const fetchMedAi = async () => {
    setMedAiLoading(true);
    try {
      const prompt = "Medytacja: " + program.title + ". Kategoria: " + program.category + ". Czas: " + program.durationMinutes + " min. Napisz krotka (3-4 zdania) personalizowana wskazowke jak najglebiej wejsc w te sesje medytacyjna i co zaobserwowac podczas praktyki.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight("Blad pobierania wskazowki.");
    } finally {
      setMedAiLoading(false);
    }
  };
return (
                <View key={i} style={[styles.tipRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: divColor }]}>
                  <Pressable onPress={() => setExpandedTip(isOpen ? null : i)} style={styles.tipTitleRow}>
                    <Text style={[styles.tipTitle, { color: theme.text, flex: 1 }]}>{tip.title}</Text>
                    {isOpen
                      ? <ChevronUp color={theme.textMuted} size={15} strokeWidth={1.8} />
                      : <ChevronDown color={theme.textMuted} size={15} strokeWidth={1.8} />
                    }
                  </Pressable>
                  {isOpen && <Text style={[styles.tipBody, { color: theme.textMuted }]}>{tip.body}</Text>}
                </View>
              );
            })}
          </View>

                  <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 16, backgroundColor: program.color + "22", borderWidth: 1, borderColor: program.color, padding: 16 }}>
          <Text style={{ color: program.color, fontWeight: "700", fontSize: 13, letterSpacing: 1, marginBottom: 8 }}>AI WSKAZOWKA SESJI</Text>
          {medAiInsight ? (
            <Text style={{ color: "#E5E7EB", fontSize: 14, lineHeight: 22 }}>{medAiInsight}</Text>
          ) : null}
          <Pressable onPress={fetchMedAi} disabled={medAiLoading} style={{ marginTop: 12, backgroundColor: program.color, borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
            <Text style={{ color: "#1F1035", fontWeight: "700", fontSize: 14 }}>{medAiLoading ? "Analizuję..." : "Analizuj"}</Text>
          </Pressable>
        </View>
<EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: PRE CHECK-IN
      ═══════════════════════════════════════════════════════════════════ */}
      <Modal visible={showPreCheckIn} transparent animationType="slide" onRequestClose={() => setShowPreCheckIn(false)}>
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={[styles.sheet, { backgroundColor: isLight ? '#FAF6EE' : '#0E0C1A', borderColor: divColor }]}>
            <LinearGradient colors={isLight ? ['#F6ECDE', '#FAF6EE'] : ['#1A1430', '#0E0C1A']} style={StyleSheet.absoluteFill} />
            <Text style={[styles.sheetTitle, { color: textColor }]}>Jak się teraz czujesz?</Text>
            <Text style={[styles.sheetSub, { color: subColor }]}>Chwila refleksji przed sesją pozwala zobaczyć zmianę po jej zakończeniu.</Text>

            <Text style={[styles.sheetLabel, { color: subColor }]}>NASTRÓJ</Text>
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((m) => {
                const MI = m.icon;
                const active = preMood === m.id;
                  const fetchMedAi = async () => {
    setMedAiLoading(true);
    try {
      const prompt = "Medytacja: " + program.title + ". Kategoria: " + program.category + ". Czas: " + program.durationMinutes + " min. Napisz krotka (3-4 zdania) personalizowana wskazowke jak najglebiej wejsc w te sesje medytacyjna i co zaobserwowac podczas praktyki.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight("Blad pobierania wskazowki.");
    } finally {
      setMedAiLoading(false);
    }
  };
return (
                  <Pressable key={m.id} onPress={() => setPreMood(m.id)}
                    style={[styles.moodBtn, { borderColor: active ? program.color + '66' : divColor, backgroundColor: active ? program.color + '14' : cardBg }]}
                  >
                    <MI color={active ? program.color : subColor} size={22} strokeWidth={1.6} />
                    <Text style={[styles.moodLabel, { color: active ? program.color : subColor }]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sheetLabel, { color: subColor }]}>ENERGIA (1–10)</Text>
            <View style={styles.energyRow}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <Pressable key={n} onPress={() => setPreEnergy(n)}
                  style={[styles.energyBtn, { borderColor: n <= preEnergy ? program.color + '66' : divColor, backgroundColor: n <= preEnergy ? program.color + '14' : cardBg }]}
                >
                  <Text style={[styles.energyNum, { color: n <= preEnergy ? program.color : subColor }]}>{n}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={() => { setShowPreCheckIn(false); void startSession(); }} style={[styles.sheetCta, { backgroundColor: program.color }]}>
              <Play color="#fff" size={15} strokeWidth={2} />
              <Text style={styles.sheetCtaText}>{t('meditation.start')}</Text>
            </Pressable>
            <Pressable onPress={() => { setShowPreCheckIn(false); void startSession(); }} style={styles.sheetSkip}>
              <Text style={[styles.sheetSkipText, { color: subColor }]}>{t('common.skip')}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: POST REFLECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <Modal visible={showPostReflection} transparent animationType="slide" onRequestClose={() => setShowPostReflection(false)}>
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={[styles.sheet, { backgroundColor: isLight ? '#FAF6EE' : '#0E0C1A', borderColor: divColor }]}>
            <LinearGradient colors={isLight ? ['#F6ECDE', '#FAF6EE'] : ['#1A1430', '#0E0C1A']} style={StyleSheet.absoluteFill} />
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <CheckCircle2 color={program.color} size={32} strokeWidth={1.6} />
            </View>
            <Text style={[styles.sheetTitle, { color: textColor }]}>{t('meditation.session_complete')}</Text>
            <Text style={[styles.sheetSub, { color: subColor }]}>Jak się teraz czujesz? Krótka refleksja wzmacnia efekty praktyki.</Text>

            <Text style={[styles.sheetLabel, { color: subColor }]}>NASTRÓJ PO SESJI</Text>
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((m) => {
                const MI = m.icon;
                const active = postMood === m.id;
                  const fetchMedAi = async () => {
    setMedAiLoading(true);
    try {
      const prompt = "Medytacja: " + program.title + ". Kategoria: " + program.category + ". Czas: " + program.durationMinutes + " min. Napisz krotka (3-4 zdania) personalizowana wskazowke jak najglebiej wejsc w te sesje medytacyjna i co zaobserwowac podczas praktyki.";
      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setMedAiInsight(result);
    } catch (e) {
      setMedAiInsight("Blad pobierania wskazowki.");
    } finally {
      setMedAiLoading(false);
    }
  };
return (
                  <Pressable key={m.id} onPress={() => setPostMood(m.id)}
                    style={[styles.moodBtn, { borderColor: active ? program.color + '66' : divColor, backgroundColor: active ? program.color + '14' : cardBg }]}
                  >
                    <MI color={active ? program.color : subColor} size={22} strokeWidth={1.6} />
                    <Text style={[styles.moodLabel, { color: active ? program.color : subColor }]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sheetLabel, { color: subColor }]}>OCENA SESJI</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setStarRating(n)}>
                  <Star color={n <= starRating ? '#F59E0B' : subColor} size={26} fill={n <= starRating ? '#F59E0B' : 'none'} strokeWidth={1.6} />
                </Pressable>
              ))}
            </View>

            <Text style={[styles.sheetLabel, { color: subColor }]}>PRZEMYŚLENIE (opcjonalnie)</Text>
            <TextInput
              value={insightNote}
              onChangeText={setInsightNote}
              placeholder="Co zauważyłeś podczas tej sesji?"
              placeholderTextColor={subColor}
              style={[styles.insightInput, { color: textColor, borderColor: divColor, backgroundColor: cardBg }]}
              multiline
              numberOfLines={3}
            />

            <Pressable onPress={() => setShowPostReflection(false)} style={[styles.sheetCta, { backgroundColor: program.color }]}>
              <Text style={styles.sheetCtaText}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: BODY SCAN
      ═══════════════════════════════════════════════════════════════════ */}
      <Modal visible={showBodyScan} transparent animationType="slide" onRequestClose={stopBodyScan}>
        <View style={styles.modalOverlay}>
          <View style={[styles.bodyScanSheet, { backgroundColor: isLight ? '#FAF6EE' : '#0E0C1A', borderColor: divColor }]}>
            <LinearGradient colors={isLight ? ['#F6ECDE', '#FAF6EE'] : ['#1A1430', '#0E0C1A']} style={StyleSheet.absoluteFill} />
            <View style={styles.bodyScanHeader}>
              <Text style={[styles.sheetTitle, { color: textColor }]}>Skanowanie ciała</Text>
              <Pressable onPress={stopBodyScan} hitSlop={14}>
                <X color={subColor} size={20} strokeWidth={1.8} />
              </Pressable>
            </View>
            <Text style={[styles.sheetLabel, { color: subColor }]}>
              Krok {bodyScanStep + 1} z {BODY_SCAN_STEPS.length}
            </Text>
            <View style={[styles.bodyScanProgress, { backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)' }]}>
              <View style={[styles.bodyScanFill, {
                width: `${((bodyScanStep + 1) / Math.max(BODY_SCAN_STEPS.length, 1)) * 100}%`,
                backgroundColor: program.color,
              }]} />
            </View>
            <Text style={[styles.bodyScanStepText, { color: textColor }]}>
              {BODY_SCAN_STEPS[bodyScanStep] || '—'}
            </Text>
            <Text style={[styles.bodyScanHint, { color: subColor }]}>Tekst zmienia się automatycznie co 12 sekund.</Text>
            <Pressable onPress={stopBodyScan} style={[styles.bodyScanStop, { backgroundColor: program.color + '22', borderColor: program.color + '44' }]}>
              <Text style={[styles.bodyScanStopText, { color: program.color }]}>Zakończ skanowanie</Text>
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
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: layout.padding.screen, paddingTop: 0, gap: 28 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center' },

  // Hero
  heroSection: { paddingTop: 18 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIcon: { width: 56, height: 56, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  metricPill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  metricLabel: { marginLeft: 6 },

  // Stat rail
  statRail: { flexDirection: 'row', borderRadius: 18, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 4 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.4, textAlign: 'center' },
  statDivider: { width: 1, marginVertical: 4 },

  // Cards
  card: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 12, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  sectionBody: { fontSize: 13, lineHeight: 21 },

  // Streak
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  streakBadge: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(242,167,75,0.12)', borderWidth: 2, borderColor: 'rgba(242,167,75,0.30)', alignItems: 'center', justifyContent: 'center' },
  streakCount: { fontSize: 28, fontWeight: '800', color: '#F2A74B' },
  streakDaysLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.4 },
  streakNextLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  milestoneIcon: { fontSize: 18 },
  milestoneLabel: { fontSize: 13, fontWeight: '600' },
  milestoneRemaining: { fontSize: 11 },
  milestoneTrack: { height: 5, borderRadius: 999, overflow: 'hidden' },
  milestoneFill: { height: '100%', borderRadius: 999 },
  achievedRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  achievedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  achievedLabel: { fontSize: 10, fontWeight: '600' },

  // Chart
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 64 },
  chartCol: { flex: 1, alignItems: 'center', gap: 4 },
  chartBarTrack: { flex: 1, width: '100%', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 4 },
  chartLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.3 },
  chartDot: { width: 5, height: 5, borderRadius: 999 },
  chartLegendText: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, fontSize: 11 },

  // Daily card
  dailyCard: { borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden' },
  dailyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dailyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  dailyBenefit: { fontSize: 13, lineHeight: 21, marginBottom: 14 },
  dailyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start' },
  dailyBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Quick sessions
  quickGrid: { flexDirection: 'row', gap: 10, marginTop: 12 },
  quickCard: { flex: 1, borderRadius: 18, borderWidth: 1.2, paddingVertical: 14, paddingHorizontal: 12, gap: 5, overflow: 'hidden', minHeight: 142 },
  quickIconBadge: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  quickChipLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.7 },
  quickTitle: { fontSize: 14, fontWeight: '700' },
  quickDesc: { fontSize: 12, lineHeight: 17 },
  quickTimeLeft: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  quickActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 10, paddingVertical: 8, marginTop: 6 },
  quickBtnText: { fontSize: 12, fontWeight: '700' },

  // Program selector
  selectorSection: { gap: 0 },
  programRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 16, paddingHorizontal: 14, borderRadius: 14, marginBottom: 8 },
  programBadge: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  programTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },

  // Controls
  controlSection: { gap: 0 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modeChip: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 40, borderRadius: 14, borderWidth: 1, paddingHorizontal: 10 },
  choiceChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  controlDivider: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14 },
  voiceRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 },
  voiceDot: { width: 10, height: 10, borderRadius: 5 },

  // Session
  sessionSection: { borderRadius: 24, padding: 22 },
  timerWrapper: { alignItems: 'center', justifyContent: 'center', marginVertical: 18, position: 'relative' },
  timerGlow: { position: 'absolute', width: CIRCLE_SVG_SIZE + 24, height: CIRCLE_SVG_SIZE + 24, borderRadius: (CIRCLE_SVG_SIZE + 24) / 2, zIndex: -1 },
  timerTextOverlay: { position: 'absolute', alignItems: 'center', gap: 3 },
  timerPercent: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  timerTime: { fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  timerRemLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.4 },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  guidancePanel: { marginTop: 16, borderRadius: 14, padding: 14, gap: 8 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  primaryAction: { flex: 1, minHeight: 54, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryActionText: { color: '#fff', marginLeft: 10 },
  secondaryAction: { minWidth: 108, minHeight: 54, borderRadius: 999, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  bodyScanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 10, marginTop: 12 },
  bodyScanBtnText: { fontSize: 13, fontWeight: '600' },

  // Info / steps
  infoSection: { gap: 0 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 14 },
  stepsSection: { gap: 0 },
  stepRow: { flexDirection: 'row', gap: 12, paddingVertical: 14, alignItems: 'flex-start' },
  stepNumber: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Script
  scriptLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  scriptDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  scriptText: { flex: 1, fontSize: 13, lineHeight: 22 },

  // Aftercare
  aftercareSection: {},

  // Guided library
  libraryRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 14 },
  libraryBadge: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  libraryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  libraryTitle: { fontSize: 14, fontWeight: '700' },
  libraryDuration: { fontSize: 10, fontWeight: '600' },
  libraryDesc: { fontSize: 12, lineHeight: 19 },

  // Structured programs
  structuredCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 10 },
  structuredCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  structuredBadge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  structuredTitle: { fontSize: 15, fontWeight: '700' },
  structuredSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  structuredBody: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingBottom: 12 },
  structuredDesc: { fontSize: 12, lineHeight: 19, paddingVertical: 10 },
  structuredDayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  structuredDayNum: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  structuredDayNumText: { fontSize: 11, fontWeight: '800' },
  structuredDayTitle: { fontSize: 13, fontWeight: '700' },
  structuredDayDesc: { fontSize: 11, lineHeight: 17 },
  structuredDayBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Practice tips
  tipsSection: { borderWidth: 1, borderRadius: 20, padding: 16 },
  tipsHeader: { fontSize: 9, fontWeight: '700', letterSpacing: 1.1, marginBottom: 12 },
  tipRow: { paddingVertical: 14 },
  tipTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipTitle: { fontSize: 14, fontWeight: '600' },
  tipBody: { fontSize: 13, lineHeight: 21, marginTop: 10 },

  // Modals
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 24, gap: 14, overflow: 'hidden' },
  sheetTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  sheetSub: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  sheetLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginTop: 4 },
  moodRow: { flexDirection: 'row', gap: 8 },
  moodBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, paddingVertical: 10, gap: 4 },
  moodLabel: { fontSize: 10, fontWeight: '600' },
  energyRow: { flexDirection: 'row', gap: 4 },
  energyBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, paddingVertical: 8 },
  energyNum: { fontSize: 12, fontWeight: '700' },
  sheetCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, paddingVertical: 16, marginTop: 8 },
  sheetCtaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sheetSkip: { alignItems: 'center', paddingVertical: 8 },
  sheetSkipText: { fontSize: 13 },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  insightInput: { borderRadius: 14, borderWidth: 1, padding: 12, fontSize: 14, lineHeight: 22, minHeight: 80, textAlignVertical: 'top' },

  // Body scan modal
  bodyScanSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 28, gap: 16, overflow: 'hidden', minHeight: 380 },
  bodyScanHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bodyScanProgress: { height: 5, borderRadius: 999, overflow: 'hidden' },
  bodyScanFill: { height: '100%', borderRadius: 999 },
  bodyScanStepText: { fontSize: 16, lineHeight: 28, fontWeight: '500' },
  bodyScanHint: { fontSize: 11, lineHeight: 18 },
  bodyScanStop: { alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, paddingVertical: 12, marginTop: 4 },
  bodyScanStopText: { fontSize: 14, fontWeight: '700' },
});

export default MeditationScreen;
