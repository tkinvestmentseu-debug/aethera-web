// @ts-nocheck
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, TextInput, FlatList, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ChevronLeft, Moon, Search, Star, Sparkles, BookOpen, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getResolvedTheme, isLightBg } from '../core/theme/tokens';
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
const SYMBOL_CATEGORIES = ['Wszystkie', 'Archetypy', 'Żywioły', 'Zwierzęta', 'Kolory', 'Miejsca', 'Przedmioty', 'Liczby'] as const;

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
  { id: 's21', emoji: '💎', name: 'Kryształ', category: 'Przedmioty', shortMeaning: 'Klarowność, wzmocnienie, prawda', deepMeaning: 'Kryształ to skrystalizowana ziemia — symbol doskonałości formy i klarowności umysłu. Jego wielość ścian symbolizuje różnorodne perspektywy jednej prawdy. W snach kryształ często sygnalizuje moment przejrzystości lub potrzebę skupienia energii.', questions: ['Co wymaga większej klarowności?', 'Jaką prawdę chcesz skrystalizować?'] },
  { id: 's22', emoji: '⭕', name: 'Koło/Mandala', category: 'Przedmioty', shortMeaning: 'Cykl, pełnia, nieskończoność', deepMeaning: 'Koło to archetyp pełni i wiecznego cyklu. Mandala jako koło z centrum symbolizuje integrację jaźni — wszystkie części psychiki wokół centralnego Ja. Pojawiający się okrąg w snach pyta o zakończenie cyklu lub powrót do centrum.', questions: ['Jaki cykl się kończy lub zaczyna?', 'Co jest twoim centrum?'] },
  { id: 's23', emoji: '🎭', name: 'Maska', category: 'Przedmioty', shortMeaning: 'Persona, ukrycie, rola społeczna', deepMeaning: 'Jungowska Persona — to co pokazujemy światu, nie to, kim naprawdę jesteśmy. Maska w snie pyta: komu gram teraz rolę? Zbyt sztywna persona odcina od autentyczności. Zdejmowanie maski to krok ku integracji.', questions: ['Jaką maskę nosisz najczęściej?', 'Przed kim się ukrywasz?'] },
  { id: 's24', emoji: '🏺', name: 'Naczynie/Czara', category: 'Przedmioty', shortMeaning: 'Pojemność, przyjęcie, płodność', deepMeaning: 'Naczynie symbolizuje zdolność przyjmowania — miłości, wiedzy, doświadczenia. Pełne naczynie oznacza obfitość; puste — gotowość lub poczucie pustki. Święty Graal to najwyższe naczynie: pytanie o to, czego szukasz w istocie.', questions: ['Czym jest teraz twoje wewnętrzne naczynie?', 'Co chcesz w sobie pomieścić?'] },
  // Żywioły (dodatkowe)
  { id: 's25', emoji: '⚡', name: 'Piorun/Burza', category: 'Żywioły', shortMeaning: 'Nagłe przebudzenie, przełom', deepMeaning: 'Piorun uderza bez ostrzeżenia — symbol nagłego przełomu, iluminacji lub wstrząsu burzącego stare struktury. W tradycjach szamańskich uderzenie piorunem to inicjacja. W snach symbolizuje nagłą zmianę lub przebudzenie, którego nie można już zignorować.', questions: ['Co uderzyło w twoje życie niespodziewanie?', 'Jakiego wstrząsu potrzebujesz?'] },
  { id: 's26', emoji: '🌫️', name: 'Mgła', category: 'Żywioły', shortMeaning: 'Niejasność, przejście, tajemnica', deepMeaning: 'Mgła zaciera granice między tym, co znane a nieznane — symbol stanów przejściowych, liminality. Często pojawia się w snach gdy stoimy na progu ważnej decyzji. Nie walcz z mgłą; poczekaj na jej rozwianie lub wejdź w nią z zaufaniem.', questions: ['Co jest teraz niejasne w twoim życiu?', 'Jakiego progu strzeże ta mgła?'] },
  { id: 's27', emoji: '❄️', name: 'Lód/Zima', category: 'Żywioły', shortMeaning: 'Zamrożone emocje, oczekiwanie', deepMeaning: 'Lód to woda stłumiona i zamrożona — emocje, które przestały płynąć. Może symbolizować ochronną izolację, stan uśpienia lub emocjonalne zablokowanie. Topniejący lód w snach to zawsze dobry znak: coś, co było zamarznięte, zaczyna się poruszać.', questions: ['Co jest w tobie zamrożone?', 'Kiedy ostatnio pozwoliłeś/aś sobie czuć?'] },
  // Zwierzęta (dodatkowe)
  { id: 's28', emoji: '🦁', name: 'Lew', category: 'Zwierzęta', shortMeaning: 'Odwaga, królewskość, serce', deepMeaning: 'Lew rządzi sercem — symbolizuje odwagę wynikającą nie z braku strachu, ale ze świadomego działania mimo niego. Królewskość lwa to nie dominacja, ale godność i majestat bycia sobą. Pyta: gdzie jesteś powołany do przywódczości?', questions: ['Gdzie wymaga się od ciebie odwagi?', 'Jak wyrażasz swoją godność?'] },
  { id: 's29', emoji: '🐦‍⬛', name: 'Kruk', category: 'Zwierzęta', shortMeaning: 'Magia, przeznaczenie, ciemna mądrość', deepMeaning: 'Kruk w mitologii nordyckiej to posłaniec Odina — symbol magii, przeznaczenia i wiedzy zdobytej przez zejście do ciemności. Pojawia się jako zwiastun zmiany lub przekaźnik między światami. Zawsze pyta o to, co ukryte i czego jeszcze nie widzisz.', questions: ['Co kryje się w twoim ślepe polu?', 'Jaka magia się właśnie aktywuje?'] },
  { id: 's30', emoji: '🐎', name: 'Koń', category: 'Zwierzęta', shortMeaning: 'Wolność, energia życiowa, podróż', deepMeaning: 'Koń symbolizuje życiową energię i siłę pragnień — instynkty, które chcą galopować bez ograniczeń. Oswojony koń to zintegrowana energia; dziki to nieujarzmione popędy. Jazda konno w snach oznacza harmonię z własną witalnością i podróż ku wolności.', questions: ['Jakie pragnienia chcesz uwolnić?', 'Dokąd zmierza twoja wewnętrzna podróż?'] },
  { id: 's31', emoji: '🐻', name: 'Niedźwiedź', category: 'Zwierzęta', shortMeaning: 'Hibernacja, siła, introspekcja', deepMeaning: 'Niedźwiedź zapada w sen zimowy — symbol świadomej introwersji i odpoczynku jako aktu siły, nie słabości. Budzi się z nową energią na wiosnę. W snach niedźwiedź często pyta: czy pozwalasz sobie na regenerację? Może też symbolizować opiekuńczą siłę lub granice.', questions: ['Czego potrzebuje twoje wewnętrzne życie?', 'Jak chronisz swoją przestrzeń?'] },
  { id: 's32', emoji: '🐬', name: 'Delfin', category: 'Zwierzęta', shortMeaning: 'Radość, wspólnota, inteligencja', deepMeaning: 'Delfin porusza się między wodą a powietrzem, między emocjami a umysłem — symbol integracji tych dwóch sfer. Symbolizuje też radość bez powodu, zabawę i współpracę. Pojawia się jako przypomnienie, by nie traktować życia zbyt poważnie.', questions: ['Kiedy ostatnio bawiłeś/aś się bez celu?', 'Jak balansować emocje z rozumem?'] },
  // Kolory (dodatkowe)
  { id: 's33', emoji: '🟢', name: 'Zielony', category: 'Kolory', shortMeaning: 'Wzrost, uzdrowienie, równowaga', deepMeaning: 'Kolor serca i natury. Zielony symbolizuje wzrost, regenerację i uzdrowienie — przyroda zawsze wraca do zieleni po zimie. To też kolor równowagi między niebem a ziemią, duchowością a materialnością. Pyta: co w tobie rośnie i potrzebuje pielęgnacji?', questions: ['Co rośnie w twoim życiu?', 'Czego potrzebuje twoje serce?'] },
  { id: 's34', emoji: '🟣', name: 'Fioletowy', category: 'Kolory', shortMeaning: 'Duchowość, intuicja, transmutacja', deepMeaning: 'Fioletowy łączy czerwień ziemi z niebieskim nieba — kolor transmutacji i najwyższej duchowości. W tradycji alchemicznej to kolor Wielkiego Dzieła. Intensywny fiolet w snach sygnalizuje aktywację wyższych stanów świadomości lub moment transformacji.', questions: ['Jaka transformacja jest w toku?', 'Jak ufasz własnej intuicji?'] },
  { id: 's35', emoji: '🟡', name: 'Złoty', category: 'Kolory', shortMeaning: 'Oświecenie, wartość, boska energia', deepMeaning: 'Złoto to niezmienność — nie rdzewieje, nie traci blasku. Symbolizuje wieczne, niezmienne Ja, boską iskrę w człowieku. W alchemii to cel Wielkiego Dzieła: transformacja ołowiu (przyziemności) w złoto (świadomość). Złote światło w snach to zawsze pozytywny znak.', questions: ['Co jest złotem twojego charakteru?', 'Co jest wieczne w tobie?'] },
  { id: 's36', emoji: '⚫', name: 'Czarny', category: 'Kolory', shortMeaning: 'Tajemnica, śmierć-odrodzenie, cień', deepMeaning: 'Czarny to nie kolor nicości, ale kolor pełni — zawiera wszystkie kolory. Symbol tajemnicy, nieświadomości i procesu śmierci-odrodzenia. W wielu tradycjach jest kolorem bogów podziemia, którzy są strażnikami transformacji, nie wrogami.', questions: ['Co przechodzi przez swój koniec?', 'Co niewidzialne chce zostać dostrzeżone?'] },
  // Miejsca (dodatkowe)
  { id: 's37', emoji: '🌲', name: 'Las', category: 'Miejsca', shortMeaning: 'Nieświadomość, zagubienie, odkrycie', deepMeaning: 'Las w bajkach to zawsze miejsce prób — symbolizuje wejście w nieświadomość lub sfery psychiki, które jeszcze nie zostały zmapowane. Zagubić się w lesie to wstęp do odnalezienia siebie. Gęsty las pyta: czego unikasz zbadać wewnątrz siebie?', questions: ['Gdzie jesteś "zagubiony/a"?', 'Co kryje twój wewnętrzny las?'] },
  { id: 's38', emoji: '⛰️', name: 'Góra', category: 'Miejsca', shortMeaning: 'Aspiracje, wyzwanie, perspektywa', deepMeaning: 'Góra łączy ziemię z niebem — symbol wspinaczki ku wyższym celom lub ideałom. Szczyt to punkt widzenia, z którego wszystko jest widoczne. Trudna wspinaczka to przezwyciężanie przeszkód. Pytaj nie tylko o szczyt, ale o to, jak się wspinasz.', questions: ['Ku czemu dążysz?', 'Jakiej perspektywy szukasz?'] },
  { id: 's39', emoji: '🌉', name: 'Most', category: 'Miejsca', shortMeaning: 'Przejście, decyzja, połączenie', deepMeaning: 'Most łączy dwa brzegi — symbol przejścia między dwoma stanami, decyzją, która nas zmienia. Stanie na moście w snach to moment wyboru. Zawalony most pyta o zerwane połączenia. Kto czeka po drugiej stronie?', questions: ['Między czym a czym jesteś teraz?', 'Jaki most chcesz zbudować lub przekroczyć?'] },
  { id: 's40', emoji: '🕳️', name: 'Jaskinia', category: 'Miejsca', shortMeaning: 'Regresja, powrót do źródeł, inicjacja', deepMeaning: 'Jaskinia to łono ziemi i symbol powrotu do początku. Szamańska inicjacja często odbywa się w jaskini — zejście do ciemności, by wynieść z niej mądrość. Jaskinia pyta: czego szukasz w swojej najgłębszej głębi? Co wymaga schowania przed światem?', questions: ['Co kryje się w twoich najgłębszych pokładach?', 'Jakiej inicjacji doświadczasz?'] },
  // Liczby
  { id: 's41', emoji: '③', name: 'Trójka (3)', category: 'Liczby', shortMeaning: 'Trójca, twórczość, synteza', deepMeaning: 'Trzy to liczba syntezy — tezy, antytezy i syntezy. Trójca pojawia się w każdej tradycji: Ojciec-Syn-Duch, Brahma-Wisznu-Sziwa, Przeszłość-Teraźniejszość-Przyszłość. Symbolizuje dynamiczną twórczość i ruch. Pyta: jakie trzy elementy musisz połączyć?', questions: ['Jakie trzy aspekty wymagają integracji?', 'Jak wyrażasz swoją kreatywność?'] },
  { id: 's42', emoji: '⑦', name: 'Siódemka (7)', category: 'Liczby', shortMeaning: 'Doskonałość, cykl, mądrość', deepMeaning: 'Siedem to liczba doskonałości cyklu — 7 dni tygodnia, 7 planet klasycznych, 7 czakr. W wielu tradycjach to liczba mistyczna oznaczająca zakończenie jednego porządku i otwarcie wyższego. Pojawia się jako znak, że cykl dobiegł końca lub właśnie się kończy.', questions: ['Jaki cykl dobiega końca?', 'Co wymaga zakończenia przed otwarciem nowego?'] },
  { id: 's43', emoji: '①①', name: 'Jedenastka (11)', category: 'Liczby', shortMeaning: 'Mistrzowska liczba, intuicja, przebudzenie', deepMeaning: 'Jedenaście to liczba mistrzowska w numerologii — wysoka wibracja intuicji i duchowego przebudzenia. Często pojawia się jako sygnał synchroniczności (11:11). Symbolizuje most między widzialnym a niewidzialnym, wzmocnione możliwości i gotowość do manifestacji.', questions: ['Na co zwraca uwagę twoja intuicja?', 'Jakie synchroniczności teraz zauważasz?'] },
  { id: 's44', emoji: '⑨', name: 'Dziewiątka (9)', category: 'Liczby', shortMeaning: 'Zakończenie, mądrość, humanitarność', deepMeaning: 'Dziewięć to ostatnia liczba pojedyncza — symbol zakończenia pełnego cyklu i mądrości zebranej przez doświadczenie. W numerologii to liczba altruizmu i służby wyższemu dobru. Pojawia się gdy nauczone już lekcje wymagają przekazania dalej lub gdy rozdział życia dobiega końca.', questions: ['Co zamykasz w tym cyklu?', 'Jaką mądrość chcesz przekazać?'] },
];

export const NightSymbolatorScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const themeName = useAppStore(s => s.themeName);
  const userData = useAppStore(s => s.userData);
  const nightSymbolFavorites = useAppStore(s => s.nightSymbolFavorites);
  const addNightSymbolFavorite = useAppStore(s => s.addNightSymbolFavorite);
  const removeNightSymbolFavorite = useAppStore(s => s.removeNightSymbolFavorite);
  const currentTheme = getResolvedTheme(themeName, userData?.preferences?.colorScheme);
  const isDark = !isLightBg(currentTheme.background);
  const isLight = !isDark;
  const textColor = isLight ? '#1A0A2E' : '#EDE9FE';
  const subColor = isLight ? 'rgba(26,10,46,0.5)' : 'rgba(237,233,254,0.5)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.09)';

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
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2 }}>{t('nightSymbolator.slownik_symboli', 'SŁOWNIK SYMBOLI')}</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>{t('nightSymbolator.symbolator_nocy', 'Symbolatorium Nocy')}</Text>
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
            <Text style={{ color: textColor, fontSize: 15, fontWeight: '700' }}>{t('nightSymbolator.brak_wynikow', 'Brak wyników')}</Text>
            <Text style={{ color: subColor, fontSize: 13, marginTop: 4 }}>{t('nightSymbolator.sprobuj_innej_frazy', 'Spróbuj innej frazy')}</Text>
          </View>
        )}

        {filteredSymbols.map((sym, i) => {
          const expanded = expandedId === sym.id;
          const isFav = nightSymbolFavorites.some(f => f.id === sym.id);
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
                    <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginBottom: 8 }}>{t('nightSymbolator.glebsze_znaczenie', 'GŁĘBSZE ZNACZENIE')}</Text>
                    <Text style={{ color: textColor, fontSize: 14, lineHeight: 22 }}>{sym.deepMeaning}</Text>

                    <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginTop: 14, marginBottom: 8 }}>{t('nightSymbolator.pytania_do_refleksji', 'PYTANIA DO REFLEKSJI')}</Text>
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

        <View style={[styles.aiBlock, { backgroundColor: cardBg, borderColor: ACCENT + '40' }]}>
          <View style={styles.aiBlockHeader}>
            <Sparkles size={14} color={ACCENT} />
            <Text style={[styles.aiBlockTitle, { color: ACCENT }]}>{t('nightSymbolator.ai_interpreta_symboli', 'AI INTERPRETACJA SYMBOLI')}</Text>
          </View>
          <Text style={[styles.aiBlockHint, { color: subColor }]}>
            Kategoria: <Text style={{ color: textColor, fontWeight: '600' }}>{selectedCategory}</Text>
            {' · '}{filteredSymbols.length} {filteredSymbols.length === 1 ? 'symbol' : 'symboli'}
          </Text>
          {symbolAiInsight ? (
            <Text style={[styles.aiBlockText, { color: textColor }]}>{symbolAiInsight}</Text>
          ) : (
            <Text style={[styles.aiBlockEmpty, { color: subColor }]}>
              {t('nightSymbolator.dotknij_przycisku_by_uzyskac_duchow', 'Dotknij przycisku, by uzyskać duchową interpretację wybranej kategorii symboli.')}
            </Text>
          )}
          <Pressable
            onPress={fetchSymbolAi}
            disabled={symbolAiLoading}
            style={[styles.aiBlockBtn, { opacity: symbolAiLoading ? 0.7 : 1 }]}
          >
            <Sparkles size={14} color="#fff" />
            <Text style={styles.aiBlockBtnText}>{symbolAiLoading ? 'Interpretuję...' : 'Interpretuj kategorię'}</Text>
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
  aiBlock: { marginHorizontal: 0, marginBottom: 16, borderRadius: 16, borderWidth: 1, padding: 16 },
  aiBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  aiBlockTitle: { fontWeight: '700', fontSize: 12, letterSpacing: 1.5 },
  aiBlockHint: { fontSize: 12, marginBottom: 10 },
  aiBlockText: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  aiBlockEmpty: { fontSize: 13, lineHeight: 20, marginBottom: 12, fontStyle: 'italic' },
  aiBlockBtn: { backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  aiBlockBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});