// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Share, Pressable, ScrollView, StyleSheet, View, Text, TextInput, KeyboardAvoidingView, Platform, Dimensions, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, NotebookPen, Sparkles, BookmarkPlus, CheckCircle2, RotateCcw, Trash2, ArrowRight, Moon, Star, WandSparkles, SunMedium, Gem, Crown, Eye, BookOpen, Layers, Hash, Calendar, Heart, Brain, Hand, Footprints, Activity, TrendingUp, PenLine, Save, RefreshCw, Zap, Shield, Target, Feather, Sun, Wind, X, ChevronRight, MessageSquare, Share2, FlipHorizontal } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, withRepeat, withSequence, withTiming, useSharedValue, useAnimatedStyle, interpolate, runOnJS } from 'react-native-reanimated';
import { useAppStore } from '../store/useAppStore';
import { useTarotStore } from '../features/tarot/store/useTarotStore';
import { useJournalStore } from '../store/useJournalStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { Typography } from '../components/Typography';
import { PremiumButton } from '../components/PremiumButton';
import { getTarotDeckById } from '../features/tarot/data/decks';
import { TarotCardVisual } from '../features/tarot/components/TarotCardVisual';
import { resolveUserFacingText } from '../core/utils/contentResolver';
import { AiService } from '../core/services/ai.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { buildTarotCardInterpretation } from '../features/tarot/utils/tarotInterpretation';
import { TarotCardFlip } from '../components/TarotCardFlip';
import { AudioService } from '../core/services/audio.service';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Ellipse, G, Path, Line, Polygon, Rect, Defs, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const SW = Dimensions.get('window').width;
const ACCENT = '#CEAE72';

const DAYS_SHORT = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];
const DAYS_FULL = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

const NUMEROLOGY_NAMES: Record<number, string> = {
  0: 'Szaleniec — wolność, skok w nieznane, czysty potencjał', 1: 'Mag — wola, manifestacja, nowe początki',
  2: 'Kapłanka — intuicja, tajemnica, cicha wiedza', 3: 'Cesarzowa — płodność, obfitość, natura',
  4: 'Cesarz — struktura, autorytet, fundament', 5: 'Hierofant — tradycja, nauczanie, rytuał',
  6: 'Kochankowie — wybór, połączenie, wartości', 7: 'Rydwan — determinacja, kontrola, zwycięstwo',
  8: 'Siła — odwaga wewnętrzna, łagodność, moc', 9: 'Pustelnik — samotność, szukanie, mądrość',
  10: 'Koło Fortuny — cykl, los, zmiana', 11: 'Sprawiedliwość — równowaga, prawda, karma',
  12: 'Wisielec — zawieszenie, ofiara, perspektywa', 13: 'Śmierć — transformacja, zakończenie, przejście',
  14: 'Umiarkowanie — integracja, cierpliwość, synteza', 15: 'Diabeł — cień, uzależnienie, iluzja',
  16: 'Wieża — wstrząs, obalenie, przebudzenie', 17: 'Gwiazda — nadzieja, uzdrowienie, inspiracja',
  18: 'Księżyc — iluzja, lęk, podświadomość', 19: 'Słońce — radość, sukces, klarowność',
  20: 'Sąd — przebudzenie, przebaczenie, powołanie', 21: 'Świat — spełnienie, integracja, kompletność',
};
const MAJOR_NAMES = ['Szaleniec','Mag','Kapłanka','Cesarzowa','Cesarz','Hierofant','Kochankowie','Rydwan','Siła','Pustelnik','Koło Fortuny','Sprawiedliwość','Wisielec','Śmierć','Umiarkowanie','Diabeł','Wieża','Gwiazda','Księżyc','Słońce','Sąd','Świat'];
const MAJOR_ACCENT = ['#A78BFA','#CEAE72','#60A5FA','#34D399','#E8705A','#F97316','#F472B6','#CEAE72','#E8705A','#9CA3AF','#F9A8D4','#34D399','#818CF8','#6B7280','#A78BFA','#F59E0B','#EF4444','#60A5FA','#818CF8','#FBBF24','#F97316','#34D399'];
const MAJOR_ACCENT2 = ['#7C3AED','#B8860B','#2563EB','#059669','#C0392B','#D97706','#DB2777','#A07830','#C0392B','#4B5563','#EC4899','#047857','#4F46E5','#374151','#6D28D9','#B45309','#DC2626','#2563EB','#4338CA','#D97706','#EA580C','#047857'];
const MAJOR_SYMBOLS = ['🃏','✨','🌙','🌿','⚔️','🏛️','💕','🏆','🦁','🕯️','🎡','⚖️','🙃','💀','🏺','🐐','⚡','⭐','🌑','☀️','📯','🌍'];

// ── Multi-perspective tab interpretations ──────────────────────────────────────
type PerspectiveTab = 'Ogólnie' | 'Miłość' | 'Kariera' | 'Duchowość';
const PERSPECTIVE_TABS: PerspectiveTab[] = ['Ogólnie', 'Miłość', 'Kariera', 'Duchowość'];

const CARD_PERSPECTIVES: Record<number, Record<PerspectiveTab, string>> = {
  0:  { Ogólnie: 'Szaleniec przynosi energię spontanicznego skoku w nieznane. Dziś życie zaprasza cię do nieplanowanego kroku — odwagi bez gwarancji i lekkości bez bagażu.', Miłość: 'W miłości Szaleniec sugeruje otwarcie na kogoś niespodziewanego. Nie analizuj za wcześnie. Pozwól emocjom prowadzić cię przez pierwszy kontakt.', Kariera: 'Zawodowo Szaleniec mówi: czas na ryzyko, na próbę, na pomysł, który wydaje się zbyt szalony. Twój projekt potrzebuje odwagi, nie perfekcji.', Duchowość: 'Duchowo Szaleniec to czyste "tak" dla życia. Zacznij praktykę, którą odwlekałeś. Jeden krok bez mapy jest wart więcej niż sto kroków w miejscu.' },
  1:  { Ogólnie: 'Mag daje ci pełnię narzędzi i aktywną wolę. Każde działanie dziś jest wzmocnione — skup energię na jednym punkcie i obserwuj jak rzeczywistość ustępuje.', Miłość: 'W związku Mag mówi: ty masz moc, by zmienić dynamikę. Jeden szczery gest lub jasno powiedziane słowo potrafi przenieść relację na nowy poziom.', Kariera: 'Mag w karierze to mistrz manifestacji. Zbierz wszystkie zasoby, zaplanuj i działaj dziś — twoja sprawczość jest teraz na szczycie możliwości.', Duchowość: 'Mag to most między niebem a ziemią. Twoja praktyka duchowa jest teraz szczególnie skuteczna. Intencja ustawiona dziś rano wyjątkowo szybko manifestuje się w rzeczywistości.' },
  2:  { Ogólnie: 'Kapłanka zaprasza do głębokiego słuchania. Odpowiedź, której szukasz, jest już w tobie — wystarczy chwila ciszy, by ją usłyszeć.', Miłość: 'W miłości Kapłanka sugeruje tajemnicę i nie-spieszyć-się. Jeśli coś czujesz, ale nie rozumiesz — nie rozumiej. Poczucie jest wystarczającym kompasem.', Kariera: 'Zawodowo Kapłanka mówi: nie ujawniaj wszystkich kart. Twoje pomysły mają dojrzewać w ciszy przez chwilę. Zaufaj wewnętrznemu głosowi zamiast zewnętrznym opiniom.', Duchowość: 'Kapłanka to archetypowa inicjatorka misteriów. Dziś twoja medytacja lub cicha modlitwa ma szczególną głębię. Zapisz, co pojawia się między oddechami.' },
  3:  { Ogólnie: 'Cesarzowa przynosi obfitość i płodność. Cokolwiek pielęgnujesz z uwagą — rośnie. Zadbaj dziś o ciało, relacje i to, co tworzysz.', Miłość: 'W miłości Cesarzowa to pełnia i dawanie. Okarz troskę bez oczekiwań. Drobny gest — gotowanie, dotyk, czas razem — ma dziś wyjątkową moc łączenia.', Kariera: 'Cesarzowa w pracy mówi o twórczej produktywności. Twoje projekty rosną. Podlewaj je uwagą, nie stresem. Piękno i praktyczność mogą iść razem.', Duchowość: 'Duchowo Cesarzowa łączy cię z ziemią i naturą. Wyjdź na świeże powietrze, podbij boso trawę lub po prostu dotknij roślin. Natura jest twoim guru dziś.' },
  4:  { Ogólnie: 'Cesarz daje strukturę i fundamenty. Dziś jest dzień na plany, granice i jasne decyzje. Porządek zewnętrzny wynika z porządku wewnętrznego.', Miłość: 'W relacji Cesarz mówi o bezpieczeństwie i jasności. Zamiast impulsów — rozmowa. Ustalcie zasady, które służą obojgu. Miłość potrzebuje fundamentu.', Kariera: 'Zawodowo Cesarz to idealny dzień na decyzje strategiczne. Ustal priorytety, deleguj, wyznacz granice czasowe. Twój autorytet jest teraz naturalny i niekwestionowany.', Duchowość: 'Cesarz duchowy buduje rytuał, który wytrzyma codzienność. Wróć do sprawdzonych form praktyki — medytacja, oddech, dziennik. Stabilna forma niesie głębię.' },
  5:  { Ogólnie: 'Hierofant łączy cię z tradycją i mądrością większą niż ty. Dziś wartości, rytuały i sprawdzone ścieżki mają szczególną moc prowadzenia.', Miłość: 'W miłości Hierofant mówi o wartościach wspólnych. Czy twoje wartości i wartości partnera tworzą wspólny grunt? To pytanie warte zbadania — spokojnie i z szacunkiem.', Kariera: 'Hierofant w pracy sugeruje uczenie się od mentorów i szanowanie tradycji firmy. Sprawdzone metody działają. Twoje doświadczenie jest teraz cennym zasobem.', Duchowość: 'Hierofant to inicjacja w głębszą praktykę. Poszukaj nauczyciela, weź udział w grupowej ceremonii lub wróć do korzeni swojej duchowej ścieżki.' },
  6:  { Ogólnie: 'Kochankowie stawiają cię przed wyborem serca. Nie chodzi o romantykę — chodzi o wybór zgodny z twoimi głębokimi wartościami, nawet jeśli jest trudny.', Miłość: 'W miłości Kochankowie to piękna energia połączenia i harmonii. Jeśli jesteś w związku — zbliż się. Jeśli szukasz — otwórz się. Serce wie, kogo potrzebuje.', Kariera: 'Kochankowie w pracy mówią o partnerstwie i współtworzeniu. Projekt, który robisz z kimś bliskim ideowo, ma teraz szczególną moc. Zaufaj prawdziwemu połączeniu.', Duchowość: 'Duchowo Kochankowie integrują dwa aspekty — działanie i odczuwanie, logikę i intuicję. Twoja ścieżka duchowa jest dziś połączeniem tych dwóch języków.' },
  7:  { Ogólnie: 'Rydwan niesie cię ku celowi z siłą woli. Dziś nie zatrzymuj się z powodu zewnętrznych przeszkód — twoja determinacja jest silniejsza niż opory.', Miłość: 'W relacji Rydwan mówi o kierunku i intencji. Czy oboje zmierzacie w tym samym kierunku? Jeśli tak — przyspieszcie. Jeśli nie — czas to ustalić.', Kariera: 'Zawodowo Rydwan to dzień wielkich postępów. Działaj z precyzją i szybkością. Sukces jest nagrodą dla tych, którzy nie zatrzymują się pod pierwszym oporem.', Duchowość: 'Rydwan duchowy to panowanie nad własnym umysłem. Dziś praktykuj skupienie — jedna medytacja, jeden oddech, jeden cel. Twoja wola jest narzędziem transformacji.' },
  8:  { Ogólnie: 'Siła mówi o odwadze wewnętrznej wyrażonej łagodnością. Nie krzycz, nie pnij się siłą — wpuść swoją moc przez spokój i ciepło.', Miłość: 'W miłości Siła to delikatność silniejsza niż dominacja. Twoja łagodność wobec partnera jest teraz nie słabością, lecz największą siłą, jaką możesz okazać.', Kariera: 'Siła w pracy sugeruje spokojne liderstwo. Nie potrzebujesz autorytetu z zewnątrz — twoja pewność siebie wynika z wewnętrznej równowagi. Inni to czują.', Duchowość: 'Siła duchowa to integracja lwa i łagodności w jednym sercu. Dziś twoja praktyka jest spotkaniem z własnym wewnętrznym zwierzęciem — nie z lękiem, lecz z miłością.' },
  9:  { Ogólnie: 'Pustelnik prowadzi cię ku wnętrzu. Dzisiejsza odpowiedź nie przyjdzie z zewnątrz — znajdziesz ją w ciszy, samotności i refleksji.', Miłość: 'W miłości Pustelnik mówi o potrzebie samotności i przestrzeni. Zdrowa relacja dopuszcza odosobnienie. Twój czas sam ze sobą jest darem, nie ucieczką.', Kariera: 'Zawodowo Pustelnik to czas na głęboką analizę i strategiczne myślenie. Zamknij się z projektem na kilka godzin. Insights przychodzą w skupieniu, nie w hałasie.', Duchowość: 'Pustelnik to twój wewnętrzny mistrz i latarnik. Dziś szczególnie ważna jest samotna praktyka — medytacja w ciszy, dziennik, obserwacja własnego umysłu.' },
  10: { Ogólnie: 'Koło Fortuny przypomina, że zmiana jest jedyną stałą. Przyjmij to, co nadchodzi — każdy obrót koła niesie nową perspektywę i szansę.', Miłość: 'W miłości Koło Fortuny mówi o cyklach. Jeśli teraz czujesz dystans — koło wróci do bliskości. Jeśli czujesz ciepło — pielęgnuj je, bo cykl trwa.', Kariera: 'Zawodowo Koło przynosi niespodziewane obroty. Bądź elastyczny — plan może się zmienić, a zmiana może być dokładnie tym, czego potrzebujesz.', Duchowość: 'Koło Fortuny duchowe to prawo karmy w działaniu. Każde twoje działanie wraca do ciebie. Dziś siaj to, co chcesz zebrać — z pełną świadomością.' },
  11: { Ogólnie: 'Sprawiedliwość patrzy trzeźwym okiem. Dziś wyważ decyzje, mów prawdę z powagą i ufaj, że karma pracuje w twoim imieniu.', Miłość: 'W miłości Sprawiedliwość mówi o uczciwości i równowadze dawania. Czy relacja jest symetryczna? Uczciwa rozmowa jest dziś ważniejsza niż emocje.', Kariera: 'Sprawiedliwość w pracy to uczciwe rozliczenia, sprawiedliwa ocena i prawdziwe słowa. Zrób to, co jest słuszne — nawet jeśli trudne. Efekt będzie trwały.', Duchowość: 'Sprawiedliwość duchowa to życie z pełną odpowiedzialnością za swoje myśli i działania. Dziś spójrz na siebie bez oceniania i bez wymówek — tylko czysta obserwacja.' },
  12: { Ogólnie: 'Wisielec prosi o zatrzymanie i zmianę perspektywy. Najlepsze decyzje rodzą się nie z pośpiechu, lecz z dobrowolnego zawieszenia i refleksji.', Miłość: 'W miłości Wisielec sugeruje, że patrzysz na relację ze zbyt wąskiej perspektywy. Odwróć obraz — zobaczyć coś z pozycji drugiej osoby zmienia wszystko.', Kariera: 'Wisielec w pracy mówi: nie decyduj dziś o ważnych krokach. To czas na obserwację, nie akcję. Pauza jest strategiczną decyzją.', Duchowość: 'Wisielec to inicjacja przez wyrzeczenie. Praktykuj post — od jedzenia, mediów lub rozmów. W dobrowolnym ograniczeniu odkrywasz prawdziwą wolność.' },
  13: { Ogólnie: 'Śmierć to karta transformacji, nie końca. Coś w twoim życiu dobiegło kresu — pozwól mu odejść z wdzięcznością i zrób miejsce dla nowego.', Miłość: 'W miłości Śmierć może oznaczać koniec starego wzorca, nie relacji. Jaką starą historię o sobie lub partnerze chcesz dziś pochować?', Kariera: 'Zawodowo Śmierć zamyka stary rozdział. Projekt, rola lub sposób pracy dobiegają końca. Zaakceptuj to i zacznij planować nowy etap — z wolną przestrzenią.', Duchowość: 'Śmierć duchowa to ego-śmierć — jeden z najważniejszych etapów inicjacji. Jaki aspekt ego możesz dziś symbolicznie puścić? Co uwalniasz, by żyć bardziej autentycznie?' },
  14: { Ogólnie: 'Umiarkowanie to alchemia łączenia przeciwieństw. Dziś twoja mądrość polega na łączeniu — pracy i odpoczynku, dawania i przyjmowania, działania i bycia.', Miłość: 'W miłości Umiarkowanie mówi o cierpliwości i syntezie. Nie spiesz się z wnioskami. Mieszaj powoli — to alchemia, nie instant coffee.', Kariera: 'Umiarkowanie w pracy to balans projektów i priorytetów. Nie skacz między zadaniami — przepływaj między nimi z uwagą. Twój rytm jest twoją supermocą.', Duchowość: 'Umiarkowanie duchowe to integracja wszystkich aspektów ścieżki. Dziś praktykuj wyważenie — nie za dużo ascezy, nie za mało czułości. Złoty środek jest złotą ścieżką.' },
  15: { Ogólnie: 'Diabeł pokazuje łańcuchy, które zakładasz sam. Sama świadomość więzi zaczyna ją rozluźniać. Dziś obserwuj, nie uciekaj.', Miłość: 'W miłości Diabeł ujawnia uzależniające wzorce — gry, manipulacje, lęki przywiązania. Widzisz je? To pierwsza połowa wyzwolenia.', Kariera: 'Diabeł w pracy to obsesja i przymus. Sprawdź, czy pracujesz z pasji czy ze strachu. Odpowiedź zmienia wszystko w sposobie, w jaki działasz.', Duchowość: 'Diabeł duchowy to praca z cieniem. Nie uciekaj od najciemniejszych aspektów siebie — zintegruj je. Twój cień jest skarbem, dopóki nie stanie się mistrzem.' },
  16: { Ogólnie: 'Wieża przynosi nagłe przebudzenie. To, co się kruszy, było fałszywą strukturą. Błysk prawdy, choć bolesny, oczyszcza drogę do tego, co autentyczne.', Miłość: 'W miłości Wieża może ujawnić niewygodną prawdę. Ale relacja, która przeżyje wstrząs, jest prawdziwa. Fundament bez złudzeń jest trwalszy niż ściany z piasku.', Kariera: 'Wieża w pracy to nagła zmiana planów lub struktury. Nie walcz z tym — zaadaptuj się szybko. Ocalały fundament jest solidniejszy niż wyobrażałeś.', Duchowość: 'Wieża duchowa to kundo-lini przebudzenie — nagłe, intensywne, transformujące. Nie tłum tego, co wychodzi. Gruntuj się przez oddech i ciało.' },
  17: { Ogólnie: 'Gwiazda przynosi nadzieję i uzdrowienie. Po burzy — spokój i czyste niebo. Masz prawo do marzeń i leczenia się teraz.', Miłość: 'W miłości Gwiazda to uzdrowienie po zranieniu. Otwórz się na bliskość — twoje rany mogą stać się mostami do głębszego połączenia.', Kariera: 'Gwiazda w pracy to inspiracja i wizja. Masz pomysł, który świeci. Zapisz go dziś i zacznij planować — kosmiczne wsparcie jest teraz wyjątkowo silne.', Duchowość: 'Gwiazda to archetyp uzdrowiciela. Twoja modlitwa, intencja czy wizualizacja ma teraz szczególną moc. Prześlij światło tam, gdzie potrzeba uzdrowienia.' },
  18: { Ogólnie: 'Księżyc porusza podświadomość. Iluzje i lęki stają się widoczne w jego świetle. Nie uciekaj od tego, co widzisz — obserwuj z dystansem.', Miłość: 'W miłości Księżyc ujawnia ukryte lęki i projekcje. To, co widzisz w partnerze, może być lustrem twojego własnego wnętrza. Sprawdź to spokojnie.', Kariera: 'Księżyc w pracy sugeruje ostrożność — nie wszystko jest takie, jakim się wydaje. Przeczytaj uważnie, zapytaj dwa razy, zanim podpiszesz lub zdecydujesz.', Duchowość: 'Księżyc to strefa snów, wizji i podświadomych przekazów. Zapisuj sny rano. Twoja podświadomość mówi językiem obrazów — naucz się go tłumaczyć.' },
  19: { Ogólnie: 'Słońce rozświetla dzień radością i klarownością. Masz prawo do sukcesu, widoczności i świętowania. Dzisiejsza energia jest czysta jak świt.', Miłość: 'W miłości Słońce to czas otwartości i ciepła. Pokaż się — i pozwól, by ciebie widziano. Autentyczność jest twoim największym magnetyzmem.', Kariera: 'Słońce w pracy to klarowność celów i docenienie przez innych. Twoja praca jest dziś widoczna. Przyjmij uznanie bez umniejszania.', Duchowość: 'Słońce to świadomość jaźni — twoje duchowe centrum. Dziś medytuj na własne wewnętrzne słońce. Jesteś źródłem, nie tylko kanałem.' },
  20: { Ogólnie: 'Sąd wzywa do przebudzenia i odpowiedzi na głębsze powołanie. Co zostało odłożone za długo? Dziś odpowiedz na to wezwanie.', Miłość: 'W miłości Sąd mówi o przebaczeniu — sobie lub innym. Uzdrowienie relacji zaczyna się od jednej decyzji: wybrać wzrost zamiast urazy.', Kariera: 'Sąd w pracy to powołanie, nie tylko praca. Czy twoja praca jest odpowiedzią na głębsze wołanie duszy? Jeśli nie — co by nim było?', Duchowość: 'Sąd to przebudzenie karmiczne. Jesteś gotowy na nowy etap duchowy. Usłysz trąby — życie wzywa cię do bycia w pełni sobą, bez masek.' },
  21: { Ogólnie: 'Świat przynosi spełnienie i kompletność. Coś ważnego dobiegło do naturalnego końca. Celebruj to, a potem otwórz się na nowy cykl.', Miłość: 'W miłości Świat to pełnia połączenia — czujesz, że jesteś sobą i kochanym zarazem. Jeśli tego brak — wiesz już, czego szukasz.', Kariera: 'Świat w pracy to ukończenie ważnego projektu lub etapu kariery. Świętuj i zamknij ten rozdział z honorem przed otwarciem nowego.', Duchowość: 'Świat duchowy to kosmiczna tanecznica — archetyp integracji. Twoja ścieżka duchowa zamknęła jeden cykl. Jesteś gotowy na wyższy obrót spirali.' },
};

// ── Shadow aspects per card ────────────────────────────────────────────────────
const SHADOW_ASPECTS: Record<number, { title: string; shadow: string; gift: string }> = {
  0:  { title: 'Cień Szaleńca', shadow: 'Ucieczka od odpowiedzialności, wieczna niedojrzałość, strach przed zobowiązaniem — Szaleniec w cieniu nigdy nie ląduje.', gift: 'Dar cienia: gdy nauczysz się zostawiać ziemię pod stopami, twoja wolność staje się archetypową odwagą, a nie ucieczką.' },
  1:  { title: 'Cień Maga', shadow: 'Manipulacja, narcyzm sprawczy, instrumentalne traktowanie innych — Mag w cieniu używa mocy do kontrolowania, nie do tworzenia.', gift: 'Dar cienia: uświadomiona skłonność do manipulacji przemienia się w mistrzowską perswazję i autentyczne liderstwo.' },
  2:  { title: 'Cień Kapłanki', shadow: 'Tajemniczość jako broń, emocjonalna niedostępność, pasywna agresja przez milczenie — Kapłanka w cieniu izoluje zamiast chronić.', gift: 'Dar cienia: gdy twoje milczenie staje się świadome, twoja obecność ma moc inicjatorki, a nie chłodnej mury.' },
  3:  { title: 'Cień Cesarzowej', shadow: 'Nadopiekuńczość, uzależnienie innych od siebie, tworzenie emocjonalnych długów — Cesarzowa w cieniu pielęgnuje, by kontrolować.', gift: 'Dar cienia: gdy uświadomisz sobie tę skłonność, twoja troska staje się czystym darem, nie narzędziem.' },
  4:  { title: 'Cień Cesarza', shadow: 'Tyrania, sztywność, niemożność odpuszczenia kontroli — Cesarz w cieniu buduje mury zamiast fundamentów.', gift: 'Dar cienia: gdy twoja potrzeba kontroli wychodzi na jaw, możesz przetworzyć ją w autentyczną siłę przywódczą bez dominacji.' },
  5:  { title: 'Cień Hierofanta', shadow: 'Dogmatyzm, fanatyzm, poczucie posiadania jedynej prawdy — Hierofant w cieniu staje się inkwizytorem własnych przekonań.', gift: 'Dar cienia: gdy widzisz swoją sztywność, zaczynasz transmitować mądrość zamiast doktryny.' },
  6:  { title: 'Cień Kochanków', shadow: 'Niezdolność do wyboru, szukanie w relacji całości siebie — Kochankowie w cieniu tworzą uzależnienia miłosne, nie połączenie.', gift: 'Dar cienia: gdy zauważasz szukanie siebie w innych, uczysz się wybierać z pełności, nie z niedostatku.' },
  7:  { title: 'Cień Rydwanu', shadow: 'Obsesja na punkcie kontroli i zwycięstwa za wszelką cenę — Rydwan w cieniu niszczy relacje w drodze do celu.', gift: 'Dar cienia: gdy widzisz swoją potrzebę dominacji, możesz przekierować ją w służbę celowi, który naprawdę jest wart wysiłku.' },
  8:  { title: 'Cień Siły', shadow: 'Ukryta agresja pod łagodnością, martyrologia, bycie "dobrym" ze strachu przed własną mocą — Siła w cieniu tłumi zamiast integrować.', gift: 'Dar cienia: gdy pozwolisz sobie na gniew bez wstydu, twoja łagodność stanie się świadomym wyborem, nie przymusem.' },
  9:  { title: 'Cień Pustelnika', shadow: 'Izolacja jako obrona, elitaryzm duchowy, pogarda dla świata materialnego — Pustelnik w cieniu ucieka do jaskini i nie wraca.', gift: 'Dar cienia: gdy widzisz swoją ucieczkę, twoja samotność staje się Źródłem, do którego wracasz zasilony, nie opustoszały.' },
  10: { title: 'Cień Koła', shadow: 'Fatalizm, poczucie braku sprawczości, uzależnienie od "losu" — Koło Fortuny w cieniu zwalnia cię z odpowiedzialności.', gift: 'Dar cienia: gdy przestajesz mówić "los tak chciał", odkrywasz, że jesteś zarówno kołem, jak i jego środkiem.' },
  11: { title: 'Cień Sprawiedliwości', shadow: 'Bezwzględny osąd, zarówno siebie jak i innych, zimna logika bez serca — Sprawiedliwość w cieniu jest trybunałem, nie sędzią.', gift: 'Dar cienia: gdy twój perfekcjonizm wychodzi na jaw, możesz wybrać łaskę jako wyższe prawo od reguły.' },
  12: { title: 'Cień Wisielca', shadow: 'Chroniczne ofiarowanie się, bierność jako strategia, uzależnienie od roli ofiary — Wisielec w cieniu czeka na zbawienie, które nie nadchodzi.', gift: 'Dar cienia: gdy widzisz swój wzorzec pasywności, dobrowolne zawieszenie staje się inicjacją, a nie klatką.' },
  13: { title: 'Cień Śmierci', shadow: 'Lęk przed zakończeniem, kurczowe trzymanie się tego, co martwe — Śmierć w cieniu blokuje transformację przez opór.', gift: 'Dar cienia: gdy przyjmiesz nieuchronność końców, każde zakończenie staje się przestrzenią kreatywnego początku.' },
  14: { title: 'Cień Umiarkowania', shadow: 'Niezdolność do ekstremalnych emocji, chowanie się za "umiarkowaniem" przed autentycznym życiem — Umiarkowanie w cieniu jest emocjonalnym zamrożeniem.', gift: 'Dar cienia: gdy widzisz swój unik od intensywności, twoja alchemia staje się prawdziwą integracją, nie kompromisom.' },
  15: { title: 'Cień Diabła', shadow: 'Wszyscy mamy łańcuchy. Diabeł pokazuje te, które zakuwamy sami — uzależnienia, obsesje i wzorce, w których komfort zniewolenia jest znajomszy niż wolność.', gift: 'Dar cienia: świadomość własnych łańcuchów to pierwszy akt wolności. Twój "diabeł" może stać się twórczą siłą.' },
  16: { title: 'Cień Wieży', shadow: 'Katastrofizm, tworzenie kryzysów jako sposób na życie, destrukcja zamiast transformacji — Wieża w cieniu burzy, bo nie umie budować inaczej.', gift: 'Dar cienia: gdy widzisz własne wzorce destrukcji, możesz wybrać świadome obalanie zamiast nieświadomego chaosu.' },
  17: { title: 'Cień Gwiazdy', shadow: 'Naiwna wiara, idealizacja, niemożność zmierzenia się z rzeczywistością — Gwiazda w cieniu snuje piękne marzenia i nigdy nie buduje mostów do ich realizacji.', gift: 'Dar cienia: gdy twoja nadzieja spotka realizm, staje się kosmiczną wizją z nogami w ziemi.' },
  18: { title: 'Cień Księżyca', shadow: 'Chroniczne życie w iluzji, dezorientacja jako stan normalny, ucieczka w fantazję — Księżyc w cieniu generuje coraz gęstszą mgłę.', gift: 'Dar cienia: gdy rozpoznasz swoje projekcje jako własne, księżycowa wyobraźnia staje się poetycką inteligencją.' },
  19: { title: 'Cień Słońca', shadow: 'Zarozumiałość, nieumiejętność słuchania, oślepianie innych swoją energią — Słońce w cieniu pali zamiast ogrzewać.', gift: 'Dar cienia: gdy twój blask stanie się świadomy, zaczniesz oświetlać innych, a nie przyćmiewać.' },
  20: { title: 'Cień Sądu', shadow: 'Fanatyzm powołania, moralizowanie, poczucie wybrania do sądzenia innych — Sąd w cieniu trąbi nie dla przebudzenia, lecz dla autorytetu.', gift: 'Dar cienia: gdy widzisz swój moralizm, twoje powołanie staje się pokorną służbą, a nie dzierżeniem trąby.' },
  21: { title: 'Cień Świata', shadow: 'Uwięzienie w spełnieniu, strach przed nowym cyklem, utknięcie w laurach — Świat w cieniu tańczy w kole, nie widząc wyjścia.', gift: 'Dar cienia: gdy celebracja nie zamienia się w stagnację, twoja kompletność staje się bazą do kolejnego, wyższego cyklu.' },
};

// ── Numerological life-path connection ────────────────────────────────────────
const NUMEROLOGY_LIFE_PATH: Record<number, string> = {
  0:  'Szaleniec (0) nie ma liczby — jest poza systemem. Jeśli twoja liczba życia to 0 lub 22, żyjesz na granicy wszystkich ścieżek naraz.',
  1:  'Liczba 1 — Mag. Jeśli twoja liczba życia to 1, 10 lub 19, jesteś naturalnym kanałem tej energii. Twoja wola i sprawczość są twoją esencją.',
  2:  'Liczba 2 — Kapłanka. Ścieżki życiowe 2 i 11 rezonują z tą kartą — intuicja jest twoim nawigatorem, cisza twoim narzędziem.',
  3:  'Liczba 3 — Cesarzowa. Ścieżki 3 i 12 niosą płodną kreatywność tej karty. Tworzysz, pielęgnujesz i wyrażasz — to twój naturalny język.',
  4:  'Liczba 4 — Cesarz. Ścieżki 4 i 13 budują. Twoja misja to struktura, bezpieczeństwo i tworzenie trwałych fundamentów.',
  5:  'Liczba 5 — Hierofant. Ścieżki 5 i 14 uczą i transmitują. Jesteś mostem między mądrością tradycji a jej żywym przekazem.',
  6:  'Liczba 6 — Kochankowie. Ścieżki 6 i 15 rezonują z miłością i wartościami. Twoje życie obraca się wokół wyborów serca.',
  7:  'Liczba 7 — Rydwan. Ścieżki 7 i 16 pędzą do przodu. Twoja determinacja jest narzędziem, twoja wola — silnikiem.',
  8:  'Liczba 8 — Siła. Ścieżki 8 i 17 niosą wewnętrzną moc. Twoja droga to nauka łagodnego użycia siły bez kompromisu.',
  9:  'Liczba 9 — Pustelnik. Ścieżki 9 i 18 szukają. Twoja misja to szukanie światła i dzielenie się nim — latarnik dla innych.',
  10: 'Liczba 10 redukuje się do 1. Koło Fortuny łączy inicjację Maga z cykliczną naturą losu — twoja wizja wraca do początku.',
  11: 'Liczba 11 — Sprawiedliwość. Jako liczba mistrzowska, niesie szczególną wagę równowagi karmy i prawdy.',
  12: 'Liczba 12 redukuje się do 3. Wisielec zaprasza do odkrywania płodności przez pause — kreatywność przez zawieszenie.',
  13: 'Liczba 13 redukuje się do 4. Śmierć buduje nowe fundamenty przez rozkład starych. Transformacja jako forma konstrukcji.',
  14: 'Liczba 14 redukuje się do 5. Umiarkowanie to alchemiczne nauczanie — synteza przez doświadczenie.',
  15: 'Liczba 15 redukuje się do 6. Diabeł ujawnia cień wartości i relacji — co kochamy i co przez to tracimy.',
  16: 'Liczba 16 redukuje się do 7. Wieża burzy to, co blokowało determinację i postęp. Kryzys jako akcelerator.',
  17: 'Liczba 17 redukuje się do 8. Gwiazda uzdrawia przez łagodną siłę — nadzieja zbudowana na prawdziwej mocy wewnętrznej.',
  18: 'Liczba 18 redukuje się do 9. Księżyc doprowadza poszukiwania do granicy — gdzie kończy się wiedza, zaczyna się tajemnica.',
  19: 'Liczba 19 redukuje się do 1 i 10. Słońce zamyka cykl i otwiera nową spiralę — klarowność jako nowy początek.',
  20: 'Liczba 20 redukuje się do 2. Sąd budzi intuicję na nowym poziomie — wewnętrzna wiedza, która woła do działania.',
  21: 'Liczba 21 redukuje się do 3. Świat to pełna ekspresja płodności Cesarzowej — kompletność jako forma twórczości.',
};

// ── Action guidance — 3 steps per card ────────────────────────────────────────
const ACTION_GUIDANCE: Record<number, { steps: [string, string, string]; timeOfDay: string }> = {
  0:  { steps: ['Zrób dziś coś, czego nie planowałeś — jeden impulsywny, lekki krok bez oceniania konsekwencji.', 'Napisz 3 rzeczy, od których chcesz się uwolnić. Nie musisz tego robić dziś — wystarczy, że to widzisz.', 'Zaplanuj jeden krok w kierunku czegoś nowego, co nosiłeś w głowie dłużej niż 3 miesiące.'], timeOfDay: 'Rano — przed zaplanowaniem dnia' },
  1:  { steps: ['Wypisz 3 konkretne zasoby (umiejętności, kontakty, narzędzia), które masz teraz i z których nie korzystasz w pełni.', 'Wybierz jeden projekt lub cel i napisz jeden konkretny krok, który wykonasz do wieczora.', 'Rano powiedz głośno jedną intencję na dziś. Wróć do niej wieczorem i sprawdź, jak się spełniła.'], timeOfDay: 'Południe — w szczycie energii' },
  2:  { steps: ['Spędź 10 minut w ciszy przed telefonem i mailem. Zapisz, co pojawi się w głowie samo z siebie.', 'Zanotuj jedno przeczucie, które miałeś ostatnio i jeszcze go nie sprawdziłeś. Co by się stało, gdybyś za nim poszedł?', 'Przed ważną rozmową lub decyzją zapytaj ciało: jak się czuję z tym w brzuchu? i posłuchaj odpowiedzi.'], timeOfDay: 'Wcześnie rano lub późny wieczór' },
  3:  { steps: ['Zrób coś, co pielęgnuje twoje ciało — gotuj, spaceruj, masuj, kąp się. Nadaj temu rytuał, nie tylko czynność.', 'Wyraź troskę wobec kogoś bez oczekiwania czegoś w zamian. Sprawdź, jak to zmienia twój nastrój.', 'Podlej rośliny, posprzątaj coś małego lub zrób coś twórczego. Twoja przestrzeń jest odbiciem twojego wnętrza.'], timeOfDay: 'Popołudnie — czas pielęgnowania' },
  4:  { steps: ['Napisz listę 3 priorytetów na dziś. Zrób tylko je. Odsuń resztę bez poczucia winy.', 'Wyznacz jedną granicę — czas, przestrzeń lub energia — i trzymaj jej z szacunkiem dla siebie.', 'Zidentyfikuj jeden obszar życia, który potrzebuje porządku. Zrób jeden krok w tym kierunku.'], timeOfDay: 'Rano — zanim dzień cię pochłonie' },
  5:  { steps: ['Wróć do jednej praktyki lub rytuału, który kiedyś działał, a zaniedbałeś. Wykonaj go dziś choć raz.', 'Zapytaj kogoś mądrego o radę w sprawie, którą dźwigasz sam. Pokora w szukaniu mądrości jest siłą.', 'Zapisz jedną wartość, według której chcesz dziś żyć, i sprawdź wieczorem, jak ci się to udało.'], timeOfDay: 'Rano — przed pierwszą kawą' },
  6:  { steps: ['Przemyśl jedną ważną decyzję przez pryzmat wartości, nie tylko logiki. Co czujesz, nie tylko co myślisz?', 'Zrób jeden gest połączenia wobec osoby, na której ci zależy — wiadomość, spotkanie, uścisk.', 'Zidentyfikuj konflikt wartości w jakimś wyborze przed tobą. Napisz go wyraźnie i sprawdź, co naprawdę jest ważniejsze.'], timeOfDay: 'Wieczór — przy świecach' },
  7:  { steps: ['Wybierz jeden cel, który odkładasz i zaatakuj go dziś przez 45 minut bez przerwy. Bez telefonu, bez rozpraszaczy.', 'Usuń jeden element, który spowalnia twój postęp — aplikację, nawyk, zadanie, relację.', 'Zakończ jeden zaległy projekt lub zrób jeden krok finalizujący. Zwycięstwo zaczyna się od domknięcia.'], timeOfDay: 'Rano — pierwszy blok pracy' },
  8:  { steps: ['Kiedy pojawi się prowokacja lub konflikt, zatrzymaj się 5 sekund przed reakcją. Oceń odpowiedź z łagodnością, nie impulsem.', 'Powiedz coś trudnego komuś ważnemu — łagodnie, bez oskarżeń. Twoja delikatność jest siłą, nie słabością.', 'Wróć do ciała — oddech, spacer, rozciąganie. Siła rośnie tam, gdzie jest spokój.'], timeOfDay: 'Przez cały dzień — w momentach napięcia' },
  9:  { steps: ['Zaplanuj jeden blok ciszy na 20-30 minut. Brak telefonu, muzyki, rozmów. Tylko ty i twoje myśli.', 'Zapisz refleksję na pytanie: Co wiem, że jest prawdą, ale wolę tego nie widzieć? Odpowiedz szczerze.', 'Cofnij się od jednej sytuacji lub decyzji i obserwuj ją z dystansu zamiast reagować natychmiast.'], timeOfDay: 'Późny wieczór — przed snem' },
  10: { steps: ['Zapisz jedną zmianę, której się boisz i jeden sposób, w jaki mogłaby ci służyć, gdybyś zmienił perspektywę.', 'Zrób coś nowego zamiast sięgania po stary schemat. Nawet mała zmiana w rutynie sygnalizuje gotowość.', 'Wróć do czegoś, co zostawiłeś bez zakończenia. Koło kręci się dalej — daj mu szansę domknąć cykl.'], timeOfDay: 'W środku dnia — jako reset' },
  11: { steps: ['Zidentyfikuj jedną sytuację, w której nie byłeś uczciwy z sobą lub innym. Zrób jeden krok ku naprawieniu tego.', 'Podejmij jedną decyzję, którą odkładasz przez strach przed konsekwencjami. Prawda, nawet trudna, zawsze wychodzi na jaw.', 'Wykonaj jeden uczciwy przegląd tygodnia — co zrobiłem dobrze, co powinienem był zrobić inaczej — bez samoosądu.'], timeOfDay: 'Południe — w środku dnia jako bilans' },
  12: { steps: ['Zatrzymaj się przed podjęciem ważnej decyzji. Daj sobie 24 godziny. Wisdom nie spieszy.', 'Spójrz na trudną sytuację z perspektywy drugiej osoby — lub zupełnie nieznajomego. Co by zobaczył?', 'Wybierz dobrowolne ograniczenie na dziś — post od social media, od narzekania lub od jednej formy rozrywki. Co czujesz?'], timeOfDay: 'Przed ważną decyzją' },
  13: { steps: ['Wypisz 3 rzeczy w swoim życiu, które skończyły się lub wkrótce się skończą. Przywitaj się z tym faktem bez oporu.', 'Usuń jedną rzecz — obiekt, zadanie, relację online — która reprezentuje to, co się skończyło.', 'Napisz jedno zdanie o tym, co zaczyna się tam, gdzie coś się kończy. Transformacja wymaga świadomości przejścia.'], timeOfDay: 'Wieczór — zamykanie dnia' },
  14: { steps: ['Oceń swój dzień pod kątem balansu: praca / odpoczynek, działanie / bycie. Co potrzebuje wyrównania?', 'Zrób coś w zwolnionym tempie — jedzenie bez telefonu, spacer bez celu, rozmowa bez pośpiechu.', 'Zidentyfikuj dwa przeciwne impulsy, które czujesz teraz. Jak możesz je połączyć zamiast wybierać jeden?'], timeOfDay: 'Cały dzień — jako linia bazowa' },
  15: { steps: ['Zapisz jeden wzorzec lub nawyk, który wiesz, że cię ogranicza. Nie musisz go zmieniać — wystarczy nazwać.', 'Sprawdź, co robisz z lęku, a co z miłości. Jeden przykład każdego. Który chcesz powiększać?', 'Zrób 10 minut medytacji na temat: Co tak naprawdę trzyma mnie w miejscu? Pozwól odpowiedzi pojawić się bez filtrowania.'], timeOfDay: 'Wieczór — po zakończeniu dnia' },
  16: { steps: ['Zaakceptuj jedną rzecz, której nie możesz kontrolować. Napisz: "To nie jest moje do kontrolowania i to jest w porządku."', 'Zidentyfikuj jedno przekonanie, które runęło ostatnio. Jaką przestrzeń zostawiło? Co chcesz w niej zbudować?', 'Zaplanuj jeden krok odbudowy w obszarze, który przeżył wstrząs. Fundamenty po burzy są solidniejsze.'], timeOfDay: 'Po nieoczekiwanym wydarzeniu' },
  17: { steps: ['Napisz jedną rzecz, w którą chcesz dziś wierzyć, nawet jeśli masz wątpliwości. Nadzieja jest aktywną postawą.', 'Wykonaj jeden gest uzdrowienia wobec siebie — wybaczenie, troska, odpoczynek bez poczucia winy.', 'Podziel się jedną inspiracją z kimś, kto jej potrzebuje. Gwiazda świeci dla innych.'], timeOfDay: 'Rano — zasilenie na cały dzień' },
  18: { steps: ['Zapisz sen lub obrazy, które towarzyszyły ci od rana. Znajdź jeden symbol i zastanów się, co znaczy dla ciebie osobiście.', 'Zidentyfikuj jedną iluzję lub założenie, które nosisz w relacji lub pracy. Sprawdź, czy to fakty, czy projekcje.', 'Spędź czas w naturalnym świetle. Księżyc działa mocniej po ciemności — zadbaj o dostęp do światła w ciągu dnia.'], timeOfDay: 'Rano — zanim iluzje wezmą górę' },
  19: { steps: ['Świętuj jedno małe zwycięstwo z ostatnich dni. Nie czekaj na wielki sukces — małe radości budują energię słoneczną.', 'Pozwól sobie na widoczność — powiedz o czymś ważnym, co robisz, nie umniejszając wartości swojej pracy.', 'Zrób coś radosnego bez powodu i bez celu. Radość jest paliwem, nie nagrodą.'], timeOfDay: 'Południe — szczyt energii słonecznej' },
  20: { steps: ['Odpowiedz na jedno wezwanie duszy, które zbyt długo odkładałeś. Jeden krok, nie cała droga.', 'Przeprość lub przebacz sobie za jeden konkretny błąd z przeszłości. Napisz to zdanie na kartce.', 'Zapytaj siebie: Jak wyglądałoby moje życie, gdybym żył pełną odpowiedzią na to, kim jestem? Zapisz odpowiedź.'], timeOfDay: 'Wieczór — po zakończeniu cyklu dnia' },
  21: { steps: ['Świętuj jeden ukończony cykl — projekt, etap relacji, osobisty cel. Nie idź dalej zanim tego nie zaakceptujesz.', 'Zidentyfikuj, gdzie chcesz teraz "wejść w nowy cykl". Co jest pierwszym krokiem tego nowego początku?', 'Podziękuj za to, gdzie jesteś. Nawet jeśli to nie jest ideał — kompletność jest teraz.'], timeOfDay: 'Wieczór — domknięcie cyklu' },
};

// ── Body zones ─────────────────────────────────────────────────────────────────
const BODY_MAP: Record<number, { zone: string; icon: any; color: string; desc: string }> = {
  0:  { zone: 'Całe ciało', icon: Activity,   color: '#A78BFA', desc: 'Szaleniec energetyzuje całe ciało — czujesz lekkość i impuls do ruchu, jakby coś zrywało cię z miejsca.' },
  1:  { zone: 'Dłonie',     icon: Hand,        color: '#CEAE72', desc: 'Mag rezonuje w dłoniach — siła sprawcza, gotowość do działania i kreowania manifestuje się przez dotyk i ruch.' },
  2:  { zone: 'Głowa',      icon: Brain,       color: '#60A5FA', desc: 'Kapłanka mówi przez głowę — ciche przeczucia i wewnętrzna wiedza pojawiają się jako subtelne impulsy za czołem.' },
  3:  { zone: 'Serce',      icon: Heart,       color: '#34D399', desc: 'Cesarzowa rezyduje w sercu i brzuchu — ciepło, pełnia i gotowość do dawania.' },
  4:  { zone: 'Stopy',      icon: Footprints,  color: '#E8705A', desc: 'Cesarz zakorzeniony jest w stopach — stabilność i fundament czujesz jako ciężar i pewność gruntu pod nogami.' },
  5:  { zone: 'Gardło',     icon: Activity,    color: '#F97316', desc: 'Hierofant mówi przez gardło — to, co trzymasz w środku i co chcesz przekazać, napina ten obszar.' },
  6:  { zone: 'Serce',      icon: Heart,       color: '#F472B6', desc: 'Kochankowie żyją w sercu — ciągnięcie lub otwieranie w klatce piersiowej to ich sygnał.' },
  7:  { zone: 'Brzuch',     icon: Activity,    color: '#CEAE72', desc: 'Rydwan napędza się energią splotu słonecznego — wola i kierunek czuć jako napięcie i ogień w środku ciała.' },
  8:  { zone: 'Serce',      icon: Heart,       color: '#E8705A', desc: 'Siła działa przez serce — łagodna moc, która utrzymuje ciało spokojnym nawet w intensywnych chwilach.' },
  9:  { zone: 'Głowa',      icon: Brain,       color: '#9CA3AF', desc: 'Pustelnik skupia się w głowie i oczach — wewnętrzne widzenie, refleksja i cisza manifestują się przez zmęczenie oczu.' },
  10: { zone: 'Całe ciało', icon: Activity,    color: '#F9A8D4', desc: 'Koło Fortuny porusza wszystko — fala przez kręgosłup i poczucie zmieniającego się rytmu.' },
  11: { zone: 'Stopy',      icon: Footprints,  color: '#34D399', desc: 'Sprawiedliwość stoi mocno — równowaga i pewność gruntu to jej ciało.' },
  12: { zone: 'Głowa',      icon: Brain,       color: '#818CF8', desc: 'Wisielec zawiesza się w głowie — zmieniona perspektywa może dawać lekki zawrót lub uczucie zatrzymanego przepływu.' },
  13: { zone: 'Całe ciało', icon: Activity,    color: '#6B7280', desc: 'Śmierć transformuje wszystko — możesz odczuwać ogólną zmianę napięcia w ciele, jakby coś się przesuwało.' },
  14: { zone: 'Gardło',     icon: Activity,    color: '#A78BFA', desc: 'Umiarkowanie harmonizuje — przepływ między gardłem a sercem; balansowanie oddechu.' },
  15: { zone: 'Brzuch',     icon: Activity,    color: '#F59E0B', desc: 'Diabeł ściska w brzuchu — napięcie, ściśnięcie lub ciężkość w dolnej części tułowia.' },
  16: { zone: 'Głowa',      icon: Brain,       color: '#EF4444', desc: 'Wieża uderza w głowę — nagłe przebudzenia są jak błysk za oczami lub ból skroni.' },
  17: { zone: 'Serce',      icon: Heart,       color: '#60A5FA', desc: 'Gwiazda otwiera serce — lekkość i otwarcie w klatce piersiowej, spokojny rytm serca.' },
  18: { zone: 'Brzuch',     icon: Activity,    color: '#818CF8', desc: 'Księżyc mówi przez jelita — przeczucia "z brzucha", niepokój lub falowanie emocji w dolnym tułowiu.' },
  19: { zone: 'Całe ciało', icon: Activity,    color: '#FBBF24', desc: 'Słońce rozświetla wszystko — ciepło rozchodzi się od środka ciała na zewnątrz, witalność i lekkość.' },
  20: { zone: 'Serce',      icon: Heart,       color: '#F97316', desc: 'Sąd otwiera serce na przebaczenie — delikatne drżenie lub wzruszenie w klatce piersiowej.' },
  21: { zone: 'Całe ciało', icon: Activity,    color: '#34D399', desc: 'Świat wypełnia całe ciało — poczucie kompletności, zaokrąglenia, każda komórka spokojna i na miejscu.' },
};

// ── Card affirmations (7 per card, one per day of week) ────────────────────────
const CARD_AFFIRMATIONS: Record<number, string[]> = {
  0:  ['Dziś odważam się zrobić krok bez gwarancji', 'Zaufam, że skok w nieznane niesie mnie w dobrym kierunku', 'Jestem gotowy na nowy rozdział', 'Moja wolność zaczyna się od jednej decyzji', 'Porzucam to, co mnie ciąży, z lekkością', 'Otwieram się na przygodę, która czeka za rogiem', 'Czysty potencjał jest moim punktem startowym'],
  1:  ['Moje zamiary stają się rzeczywistością', 'Mam wszystkie narzędzia, których potrzebuję', 'Działam z mocą i świadomością', 'Moja wola tworzy świat wokół mnie', 'Koncentruję energię na jednym celu', 'Manifestuję z pełnym zaangażowaniem', 'Jestem kanałem dla wyższej siły sprawczej'],
  2:  ['Słucham cichego głosu intuicji', 'Moja wewnętrzna wiedza prowadzi mnie bezpiecznie', 'Zatrzymuję się, by usłyszeć odpowiedź', 'Tajemnica życia jest moim sprzymierzeńcem', 'Ufam temu, czego nie widać gołym okiem', 'Moja intuicja jest precyzyjna jak kompas', 'Cicha mądrość w środku zna drogę'],
  3:  ['Jestem płodna w pomysły i działania', 'Obfitość przepływa przez moje życie', 'Karmię to, co chcę, by wzrastało', 'Natura wspiera mój wzrost i rozkwit', 'Daję i przyjmuję z równą otwartością', 'Moje życie rozkwita jak ogród', 'Troska, którą daję, wraca do mnie wielokrotnie'],
  4:  ['Buduję fundament, który wytrzyma próbę czasu', 'Moja struktura daje mi wolność w granicach', 'Jestem silny i stabilny jak góra', 'Moje działania mają jasny cel i plan', 'Autorytet zaczyna się od szacunku do siebie', 'Każdy krok buduję na solidnym gruncie', 'Porządek wewnętrzny tworzy porządek zewnętrzny'],
  5:  ['Jestem otwarty na naukę i tradycję mądrości', 'Rytuał czyni dzień świętym', 'Przekazuję to, co wiem, z pokorą', 'Moje korzenie dają mi siłę do wzrastania', 'Szanuję wiedzę, która mnie poprzedza', 'Nauczanie jest formą miłości', 'Jestem zarówno uczniem, jak i nauczycielem'],
  6:  ['Dokonuję wyboru zgodnego z moimi wartościami', 'Moje relacje są odbiciem tego, czego pragnę', 'Kocham z pełną świadomością', 'Połączenie, które tworzę, jest prawdziwe', 'Moje serce i umysł działają razem', 'Wybory, które dziś robię, kształtują jutro', 'Miłość i wolność mogą istnieć razem'],
  7:  ['Jadę do celu z pełną determinacją', 'Kontroluję kierunek, nawet gdy droga jest wyboista', 'Zwycięstwo należy do tych, którzy nie zatrzymują się', 'Moja wola jest silniejsza niż przeszkody', 'Prowadzę życie z precyzją i intencją', 'Sukces jest wynikiem konsekwentnego działania', 'Jestem kapitanem swojego losu'],
  8:  ['Moja moc jest łagodna i niezłomna', 'Odwaga żyje w spokojnym sercu', 'Łagodność jest moją największą siłą', 'Nie muszę krzyczeć, by być słyszanym', 'Wewnętrzne lwy są pokonywane miłością', 'Moja cierpliwość jest narzędziem przemiany', 'Siła prawdziwa nie rani — ona uzdrawia'],
  9:  ['Cisza i samotność są moimi nauczycielami', 'Szukam odpowiedzi w sobie, nie na zewnątrz', 'Mój latarnik świeci nawet w ciemności', 'Cofam się, by zobaczyć więcej', 'Odosobnienie daje mi jasność', 'Mądrość rośnie w ciszy', 'Jestem swoim własnym duchowym przewodnikiem'],
  10: ['Zmiana, która nadchodzi, służy mojemu wzrostowi', 'Przyjmuję cykl życia bez oporu', 'Koło obraca się na moją korzyść', 'Przypadek i przeznaczenie współpracują w moim życiu', 'Każdy koniec jest nowym początkiem', 'Przepływ losu niesie mnie w dobrym kierunku', 'Szczęście sprzyja temu, kto jest gotowy'],
  11: ['Działam zgodnie z prawdą i sumieniem', 'Równowaga jest moją naturalną przestrzenią', 'Karma wyraża się przez moje codzienne wybory', 'Prawda, którą mówię, uwalnia', 'Sprawiedliwość zaczyna się od szacunku do siebie', 'Moje działania są spójne z moimi wartościami', 'Ziemia pode mną jest równa i pewna'],
  12: ['Zmieniam perspektywę zamiast walczyć z sytuacją', 'Zawieszenie przynosi wglądy, których nie oczekiwałem', 'Ofiara z czasu ujawnia skryte prawdy', 'Widzę świat do góry nogami i to zmienia wszystko', 'Spokojne czekanie jest formą mądrości', 'Rezygnuję z kontroli, by zyskać głębię', 'Moje ograniczenia uczą mnie wolności'],
  13: ['Transformacja jest moją naturą', 'Kończę to, co się skończyło, z wdzięcznością', 'Nowy rozdział zaczyna się właśnie teraz', 'Oddaję to, co już nie służy', 'Każde przejście prowadzi do nowego życia', 'Śmierć starych schematów uwalnia moją esencję', 'Zmiana jest dowodem, że żyję'],
  14: ['Integruję przeciwieństwa z cierpliwością', 'Mój wewnętrzny alchemik miesza złoto z ołowiem', 'Balans jest procesem, nie stanem', 'Nie spieszę się — wszystko ma swój czas', 'Harmonizuję swoje aspekty z łagodnością', 'Synteza jest wyższą formą mądrości', 'Cierpliwość jest moją ścieżką do pełni'],
  15: ['Dostrzegam łańcuchy i delikatnie je zdejmuję', 'Iluzje, które mnie wiążą, tracą moc w świetle uwagi', 'Wolność jest możliwa tu i teraz', 'Nazywam swoje cienie bez wstydu', 'Uzależnienia bledną, gdy widzę ich cenę', 'Jestem więcej niż swoje lęki', 'Prawda mnie wyzwala, nawet gdy boli'],
  16: ['Pozwalam starym strukturom runąć spokojnie', 'Przebudzenie, choć gwałtowne, oczyszcza', 'To, co upada, musiało upaść', 'Wstrząs otwiera drzwi, których nie widziałem', 'Po upadku wieży widzę prawdziwy fundament', 'Kryzys jest zaproszeniem do rebuildingu', 'Nowe zaczyna się tam, gdzie stare się kończy'],
  17: ['Nadzieja jest moim niezmiennym kompasem', 'Uzdrowienie jest możliwe i dostępne teraz', 'Inspiracja płynie jak gwiezdne światło', 'Moje rany mogą stać się darem', 'Kosmiczne wsparcie jest zawsze przy mnie', 'Odwracam wzrok ku górze i oddycham głębiej', 'Nadzieja nie jest słabością — to odwaga'],
  18: ['Przyjmuję głębię swojej podświadomości', 'Lęki z ciemności tracą siłę, gdy je nazywam', 'Intuicja i wyobraźnia to moje moce', 'Iluzje się rozpraszają w świetle uważności', 'Księżyc zmienia się, ale zawsze powraca', 'Moje głębiny są skarbnicą, nie więzieniem', 'W ciemności też można znaleźć drogę'],
  19: ['Radość jest moim naturalnym stanem', 'Jasność promieniuje ze mnie bez wysiłku', 'Sukces jest prostą konsekwencją moich działań', 'Świętluję istnienie bez powodu', 'Moja energia słoneczna ogrzewa wszystkich wokół', 'Klarowność pozwala mi widzieć właściwą drogę', 'Jestem tutaj i to wystarczy'],
  20: ['Słyszę swoje głębsze powołanie', 'Przebaczam sobie i innym z pełną szczerością', 'Przebudzenie przychodzi w idealnym momencie', 'Nowe życie wzywa mnie z głębin', 'Odpowiadam na wezwanie duszy bez zwłoki', 'Transformacja przez przebaczenie jest możliwa', 'Wstaję i idę tam, gdzie powołanie mnie prowadzi'],
  21: ['Spełnienie jest moim naturalnym punktem dojścia', 'Jestem całością — nic nie brakuje', 'Integracja wszystkich aspektów mnie przynosi pokój', 'Stąpam po ziemi z kosmiczną świadomością', 'Moje życie jest kompletną historią z każdym dniem', 'Świat jest moim domem', 'Taniec życia trwa i ja tańczę w nim w pełni'],
};

// ── Week/year helpers ───────────────────────────────────────────────────────────
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
};

const seedCard = (dateStr: string, slot: number) => {
  const d = dateStr.replace(/-/g, '');
  let h = 0;
  for (let i = 0; i < d.length; i++) h = (h * 31 + d.charCodeAt(i) + slot) & 0xffffffff;
  return Math.abs(h) % 22;
};

const seedWeekCard = (year: number, week: number): number => {
  let h = 0;
  const s = `${year}W${week}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i) + 7) & 0xffffffff;
  return Math.abs(h) % 22;
};

// Year card: sum digits of year, reduce to 1-22
const getYearCard = (year: number): number => {
  let sum = String(year).split('').reduce((a, c) => a + parseInt(c), 0);
  while (sum > 22) sum = String(sum).split('').reduce((a, c) => a + parseInt(c), 0);
  return sum === 0 ? 22 : sum - 1; // map 1-22 to 0-21
};

// Moon phase (approximate, 29.53 day cycle)
const getMoonPhase = (date: Date): { name: string; emoji: string; dayInCycle: number } => {
  const knownNew = new Date('2000-01-06').getTime();
  const cycleLen = 29.53 * 24 * 60 * 60 * 1000;
  const elapsed = date.getTime() - knownNew;
  const pos = ((elapsed % cycleLen) + cycleLen) % cycleLen;
  const day = pos / (24 * 60 * 60 * 1000);
  if (day < 1.85) return { name: 'Nów', emoji: '🌑', dayInCycle: Math.round(day) };
  if (day < 7.38) return { name: 'Przybywający sierp', emoji: '🌒', dayInCycle: Math.round(day) };
  if (day < 9.22) return { name: 'Pierwsza kwadra', emoji: '🌓', dayInCycle: Math.round(day) };
  if (day < 14.77) return { name: 'Przybywający garb', emoji: '🌔', dayInCycle: Math.round(day) };
  if (day < 16.61) return { name: 'Pełnia', emoji: '🌕', dayInCycle: Math.round(day) };
  if (day < 22.15) return { name: 'Ubywający garb', emoji: '🌖', dayInCycle: Math.round(day) };
  if (day < 23.99) return { name: 'Ostatnia kwadra', emoji: '🌗', dayInCycle: Math.round(day) };
  return { name: 'Ubywający sierp', emoji: '🌘', dayInCycle: Math.round(day) };
};

const REFLECTION_PROMPTS = [
  'Gdzie ta energia działa w moim życiu, zanim jeszcze zdążę to zauważyć?',
  'Co ta karta mówi o moim sposobie reagowania pod presją?',
  'Jaki jeden krok byłby zgodny z energią tej karty?',
];

const RITUAL_STEPS = [
  { n: '01', title: 'Zatrzymaj się', copy: 'Jeden spokojny oddech przed odsłonięciem. Nie przyspieszaj ceremonii.' },
  { n: '02', title: 'Postaw pytanie', copy: 'Jaka energia naprawdę chce prowadzić mój dzień? Jedno wewnętrzne zdanie wystarczy.' },
  { n: '03', title: 'Odkryj', copy: 'Dotknij karty i pozwól jej wejść bez oceniania, czy to dobra, czy zła karta.' },
  { n: '04', title: 'Poczuj', copy: 'Zobacz, gdzie w ciele pojawia się rezonans. To ważniejsze niż szybka interpretacja.' },
];

const WEEKLY_INTERPRETATIONS: Record<number, string> = {
  0:  'Tydzień pod znakiem Szaleńca przynosi świeży wiatr i impuls do zerwania ze schematem. Pozwól sobie na jeden nieplanowany ruch każdego dnia.',
  1:  'Mag tygodnia daje ci mistrzowski zestaw narzędzi. Skup energię na jednym kluczowym projekcie — manifestacja działa teraz z pełną mocą.',
  2:  'Kapłanka prowadzi tydzień w głąb. Słuchaj snów, przeczuć i cichych sygnałów. Odpowiedzi pojawiają się w ciszy, nie w pośpiechu.',
  3:  'Cesarzowa otacza tydzień żyznością. To czas pielęgnowania relacji, ciała i tego, co tworzysz. Obfitość rośnie tam, gdzie kierujesz uwagę.',
  4:  'Cesarz tygodnia wymaga struktury. Stwórz jeden solidny plan i trzymaj się go. Fundament, który budujesz teraz, będzie służył długo.',
  5:  'Hierofant prowadzi tydzień przez tradycję i rytuał. Wróć do sprawdzonych metod, a nauczyciel — wewnętrzny lub zewnętrzny — znajdzie cię sam.',
  6:  'Kochankowie zapraszają tydzień do świadomych wyborów. Każde spotkanie jest lustrem. Pytaj, jakie wartości chcesz wzmacniać.',
  7:  'Rydwan napędza tydzień siłą woli. Czas na decydujące działania i utrzymanie kursu. Zwycięstwo jest dla wytrwałych.',
  8:  'Siła otula tydzień łagodną mocą. Reaguj na wyzwania z cierpliwością zamiast oporu. Twoja łagodność jest tym razem silniejsza od siły.',
  9:  'Pustelnik zaprasza do tygodnia refleksji. Zmniejsz bodźce, zwiększ ciszę. Wgląd szukasz w sobie, nie w zewnętrznym hałasie.',
  10: 'Koło Fortuny kręci się — spodziewaj się nieoczekiwanych zmian. Pozostań elastyczny i przyjmuj każdy zwrot jako szansę, nie jako zagrożenie.',
  11: 'Sprawiedliwość patrzy na tydzień z troską. Wyrównuj rachunki, mów prawdę z umiarem i ufaj, że karma działa sprawnie.',
  12: 'Wisielec zawiesza tydzień między perspektywami. Czas na pauzę przed wielką decyzją. Widzisz więcej, kiedy przestajesz się spieszyć.',
  13: 'Śmierć oczyszcza tydzień z tego, co skończone. Puść jedną rzecz, która już nie służy. Nowa przestrzeń otworzy się natychmiast.',
  14: 'Umiarkowanie miesza tydzień alchemicznie. Balansuj pracę i odpoczynek, dawanie i przyjmowanie. Harmonia jest skutkiem świadomego łączenia.',
  15: 'Diabeł pyta tydzień o łańcuchy. Zauważ jeden wzorzec, który cię ogranicza. Samo zobaczenie zaczyna uwalniać.',
  16: 'Wieża otwiera tydzień przez wstrząs. To, co się chwieje, nie było trwałe. Fundament, który zostaje, jest prawdziwy.',
  17: 'Gwiazda oświetla tydzień nadzieją. Każdy drobny krok uzdrowienia ma znaczenie. Kosmiczne wsparcie jest przy tobie.',
  18: 'Księżyc prowadzi tydzień przez głębię. Śledź sny i obrazy z podświadomości. To, czego się boisz, traci moc w świetle uwagi.',
  19: 'Słońce świeci przez cały tydzień. Pozwól sobie na radość bez powodu i sukces bez przeprosin. Klarowność jest twoim darem.',
  20: 'Sąd dzwoni na tydzień przebudzenia. Czas odpowiedzieć na wewnętrzne wezwanie, które zbyt długo odkładałeś.',
  21: 'Świat dopełnia tydzień. Celebruj to, co ukończyłeś, i wejdź w nowy cykl z pełnym bagażem zdobytej mądrości.',
};

const MONTHLY_PATTERN_NOTES: Record<number, string> = {
  0: 'Miesiąc pełen spontanicznych decyzji i nowych zaczątków.',
  1: 'Silne impulsy twórcze i sprawcze dominowały ten miesiąc.',
  2: 'Intuicja i wewnętrzne wglądy były kluczowe w tym miesiącu.',
  3: 'Tematy obfitości i pielęgnowania powracały przez cały miesiąc.',
  4: 'Budowanie struktur i poszukiwanie stabilności było dominującym motywem.',
  5: 'Nauka, rytuał i duchowe tradycje odgrywały rolę w tym miesiącu.',
  6: 'Relacje i decyzje sercowe były główną osią tego miesiąca.',
  7: 'Determinacja i dążenie do celów napędzały ten miesiąc.',
  8: 'Łagodna siła i cierpliwość były twoim przewodnikiem w tym miesiącu.',
  9: 'Refleksja i wewnętrzne poszukiwania zdominowały ten miesiąc.',
  10: 'Zmiany i cykle były stałym towarzyszem — dobry miesiąc na adaptację.',
  11: 'Prawda i równowaga były tematami przewodnimi tego miesiąca.',
  12: 'Zmiana perspektywy i zawieszenie w ważnych kwestiach.',
  13: 'Miesiąc transformacji — coś kończyło się, by nowe mogło zacząć.',
  14: 'Balans i integracja różnych aspektów życia były kluczowe.',
  15: 'Czas konfrontacji z własnymi cieniami i ograniczeniami.',
  16: 'Niespodziewane przełomy i obalanie starych przekonań.',
  17: 'Nadzieja i uzdrowienie przeplatały się przez cały miesiąc.',
  18: 'Świat podświadomości był aktywny — sny i przeczucia wzmocnione.',
  19: 'Radość, sukces i klarowność dawały energię w tym miesiącu.',
  20: 'Przebudzenia i przebaczenia — miesiąc głębokich przemian wewnętrznych.',
  21: 'Miesiąc pełni i integracji — poczucie kompletności i spełnienia.',
};

// ── Sacred geometry card back SVG ─────────────────────────────────────────────
const CardBackGeometry = React.memo(({ accent, size }: { accent: string; size: number }) => {
  const cx = size / 2;
  const r1 = size * 0.38;
  const r2 = size * 0.26;
  const r3 = size * 0.14;
  const pts = (n: number, r: number, offset = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * 2 * Math.PI + offset;
      return `${cx + r * Math.cos(a)},${cx + r * Math.sin(a)}`;
    }).join(' ');
  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cx} r={size * 0.48} fill={accent + '08'} />
      <Circle cx={cx} cy={cx} r={r1} fill="none" stroke={accent + '33'} strokeWidth={0.8} />
      <Polygon points={pts(6, r1, 0)} fill="none" stroke={accent + '44'} strokeWidth={0.7} />
      <Polygon points={pts(6, r1, Math.PI / 6)} fill="none" stroke={accent + '30'} strokeWidth={0.6} />
      <Circle cx={cx} cy={cx} r={r2} fill="none" stroke={accent + '44'} strokeWidth={0.8} />
      <Polygon points={pts(3, r2, 0)} fill="none" stroke={accent + '55'} strokeWidth={0.9} />
      <Polygon points={pts(3, r2, Math.PI)} fill="none" stroke={accent + '40'} strokeWidth={0.8} />
      <Circle cx={cx} cy={cx} r={r3} fill={accent + '22'} stroke={accent + '66'} strokeWidth={1} />
      <Circle cx={cx} cy={cx} r={4} fill={accent} opacity={0.9} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * 2 * Math.PI;
        return <Circle key={i} cx={cx + r1 * 0.72 * Math.cos(a)} cy={cx + r1 * 0.72 * Math.sin(a)} r={2.5} fill={accent} opacity={0.5} />;
      })}
    </Svg>
  );
});

// ── Portal 3D orb ──────────────────────────────────────────────────────────────
const TarotPortal3D = React.memo(({ accent }: { accent: string }) => {
  const pulse = useSharedValue(0.92);
  const rot = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.08, { duration: 2500 }), withTiming(0.92, { duration: 2500 })), -1, false);
    rot.value = withRepeat(withTiming(360, { duration: 18000 }), -1, false);
  }, []);
  const pan = Gesture.Pan().onUpdate((e) => { tiltX.value = Math.max(-22, Math.min(22, e.translationY * 0.14)); tiltY.value = Math.max(-22, Math.min(22, e.translationX * 0.14)); }).onEnd(() => { tiltX.value = withTiming(0, { duration: 900 }); tiltY.value = withTiming(0, { duration: 900 }); });
  const outerStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 500 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }] }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const orbitStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot.value}deg` }] }));
  const sz = 130; const cx = sz / 2; const R = 40;
  return (
    <View style={{ height: 126, alignItems: 'center', justifyContent: 'center', marginVertical: 12 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={outerStyle}>
          <Animated.View style={pulseStyle}>
            <Svg width={sz} height={sz}><Circle cx={cx} cy={cx} r={56} fill={accent + '08'} /><Circle cx={cx} cy={cx} r={R} fill={accent + '18'} stroke={accent + '55'} strokeWidth={1.4} /><Ellipse cx={cx} cy={cx} rx={R} ry={R * 0.3} fill="none" stroke={accent + '44'} strokeWidth={0.9} /><Ellipse cx={cx} cy={cx} rx={R * 0.55} ry={R} fill="none" stroke={accent + '30'} strokeWidth={0.7} /><Circle cx={cx} cy={cx} r={6} fill={accent} opacity={0.95} /></Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, orbitStyle]}>
            <Svg width={sz} height={sz}><G>{[0,1,2,3,4,5,6].map((i) => { const a = (i / 7) * 2 * Math.PI; return <Circle key={i} cx={cx + 54 * Math.cos(a)} cy={cx + 54 * Math.sin(a) * 0.35} r={i % 2 === 0 ? 5 : 3} fill={accent} opacity={i % 2 === 0 ? 0.9 : 0.5} />; })}</G></Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
export const DailyTarotScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
  const { dailyDraw, drawDailyCard, clearExpiredDailyDraw, clearDailyDraw, selectedDeckId } = useTarotStore();
  const { entries, addEntry, deleteEntry } = useJournalStore();
  const [didRevealToday, setDidRevealToday] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [showReversed, setShowReversed] = useState(false);
  const [activeTab, setActiveTab] = useState<PerspectiveTab>('Ogólnie');
  const [cardNote, setCardNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedWeekDay, setSelectedWeekDay] = useState<number | null>(null);
  const [showYearCardModal, setShowYearCardModal] = useState(false);
  const mainScrollRef = useRef<ScrollView>(null);

  const textColor = isLight ? '#1A1410' : '#F0EBE2';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const dividerColor = isLight ? 'rgba(255,246,230,0.92)' : 'rgba(255,255,255,0.06)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';

  useEffect(() => { clearExpiredDailyDraw(); }, []);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const activeDraw = (dailyDraw?.date === todayStr && dailyDraw?.card) ? dailyDraw : null;
  const deck = getTarotDeckById(activeDraw?.deckId || selectedDeckId);
  const archivedEntry = useMemo(() => !activeDraw ? null : entries.find((e) => e.tags?.includes(`daily_card:${activeDraw.date}`)) || null, [activeDraw, entries]);
  const archived = Boolean(archivedEntry);
  const interpretation = activeDraw ? buildTarotCardInterpretation(activeDraw.card, activeDraw.isReversed, { question: 'Jaka energia prowadzi mnie dzisiaj?', mode: 'solo' }) : null;

  const todayCardIdx = activeDraw?.card?.arcana === 'major' ? (activeDraw.card.value ?? 0) : 0;
  const bodyZone = BODY_MAP[todayCardIdx] || BODY_MAP[0];
  const dayOfWeek = today.getDay();
  const affirmations = CARD_AFFIRMATIONS[todayCardIdx] || CARD_AFFIRMATIONS[0];
  const todayAffirmation = affirmations[dayOfWeek % 7];
  const weekNum = getWeekNumber(today);
  const weekCardIdx = seedWeekCard(today.getFullYear(), weekNum);
  const weekCardColor = MAJOR_ACCENT[weekCardIdx];
  const yearCardIdx = getYearCard(today.getFullYear());
  const moonPhase = getMoonPhase(today);
  const dayOfYear = getDayOfYear(today);
  const cardNumberInYear = Math.floor((dayOfYear / 365) * 22);
  const actionGuidance = ACTION_GUIDANCE[todayCardIdx] || ACTION_GUIDANCE[0];
  const shadowAspect = SHADOW_ASPECTS[todayCardIdx] || SHADOW_ASPECTS[0];
  const cardPerspective = CARD_PERSPECTIVES[todayCardIdx] || CARD_PERSPECTIVES[0];

  const last30 = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 29 + i);
      const ds = d.toISOString().split('T')[0];
      const idx = seedCard(ds, 0);
      return { ds, idx, isMajor: idx < 22, color: MAJOR_ACCENT[idx], name: MAJOR_NAMES[idx], dayNum: d.getDate(), monthNum: d.getMonth() };
    });
  }, []);

  const weekDays = useMemo(() => {
    const dow = today.getDay();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - dow + i);
      const ds = d.toISOString().split('T')[0];
      const idx = seedCard(ds, 0);
      return { label: DAYS_SHORT[i], fullLabel: DAYS_FULL[i], isToday: ds === todayStr, idx, color: MAJOR_ACCENT[idx], name: MAJOR_NAMES[idx], ds };
    });
  }, []);

  const monthPatterns = useMemo(() => {
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const counts: Record<number, number> = {};
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(currentYear, currentMonth, day);
      if (d > today) break;
      const ds = d.toISOString().split('T')[0];
      const idx = seedCard(ds, 0);
      counts[idx] = (counts[idx] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([idx, count]) => ({ idx: parseInt(idx), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, []);

  const cardAtmosphere = activeDraw ? [
    'Zatrzymaj pierwszy impuls oceniania i sprawdź, co w tej karcie porusza ciało szybciej niż umysł.',
    'Pozwól tej energii być tonem dnia, a nie tylko informacją do odhaczenia.',
    'Najmocniejsza praca z kartą zaczyna się wtedy, gdy przekładasz symbol na jedną realną decyzję albo postawę.',
  ] : [];

  const handleShare = async () => {
    try {
      const cardName = activeDraw ? resolveUserFacingText(activeDraw.card.name) : 'Karta dnia';
      await Share.share({
        title: `Moja karta dnia: ${cardName} — Aethera`,
        message: `Moja karta dnia to ${cardName}${activeDraw?.isReversed ? ' (odwrócona)' : ''}.\n\n${interpretation?.contextualMeaning || ''}\n\nAfirmacja: "${todayAffirmation}"\n\nOdkryj swoją kartę dnia w aplikacji Aethera.`,
      });
    } catch {}
  };

  const handleReveal = () => {
    drawDailyCard();
    setDidRevealToday(true);
    setTimeout(() => setCardFlipped(true), 400);
    setTimeout(() => mainScrollRef.current?.scrollTo({ y: 0, animated: true }), 200);
  };

  const handleArchive = () => {
    if (!activeDraw || archived) return;
    addEntry({
      type: 'tarot',
      title: `Karta dnia • ${resolveUserFacingText(activeDraw.card.name)}`,
      cards: [{ slotIndex: 0, card: activeDraw.card, isReversed: activeDraw.isReversed }],
      interpretation: interpretation?.contextualMeaning || resolveUserFacingText(activeDraw.isReversed ? activeDraw.card.meaningReversed : activeDraw.card.meaningUpright),
      tags: ['tarot', 'daily_card', `daily_card:${activeDraw.date}`],
      question: 'Jaka energia prowadzi mnie dzisiaj?',
    });
  };

  const handleSaveNote = () => {
    if (!activeDraw || !cardNote.trim()) return;
    addEntry({ type: 'free', title: `Notatka do karty • ${resolveUserFacingText(activeDraw.card.name)}`, content: cardNote.trim(), tags: ['tarot', 'card_note', `daily_card:${activeDraw.date}`], question: '' });
    setNoteSaved(true);
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim() || !activeDraw) return;
    setAiLoading(true);
    try {
      const cardName = resolveUserFacingText(activeDraw.card.name);
      const messages = [
        { role: 'system' as const, content: `Jesteś duchową wyrocznią tarota. Odpowiadasz w języku użytkownika, głęboko i poetycko, w 3-4 zdaniach. Karta dnia to ${cardName}${activeDraw.isReversed ? ' (odwrócona)' : ''}.` },
        { role: 'user' as const, content: aiQuestion.trim() },
      ];
      const resp = await AiService.chatWithOracle(messages);
      setAiAnswer(resp);
    } catch { setAiAnswer('Wyrocznia milczy w tej chwili. Spróbuj ponownie za chwilę.'); }
    setAiLoading(false);
  };

  const SectionDivider = () => (
    <View style={{ height: 1, backgroundColor: dividerColor, marginHorizontal: layout.padding.screen, marginVertical: 4 }} />
  );

  const actions = activeDraw ? [
    { icon: Sparkles, label: 'Zapisz trop z karty', onPress: () => navigation.navigate('JournalEntry', { prompt: `Moja karta dnia: ${interpretation?.cardName}. ${interpretation?.contextualMeaning} ${interpretation?.adviceLine}`, type: 'tarot' }) },
    { icon: NotebookPen, label: 'Zapisz odpowiedź w dzienniku', onPress: () => navigation.navigate('JournalEntry', { prompt: `Moja karta dnia: ${interpretation?.cardName}. ${interpretation?.adviceLine}`, type: 'tarot' }) },
    { icon: archived ? CheckCircle2 : BookmarkPlus, label: archived ? 'Karta zapisana w archiwum' : 'Zachowaj w archiwum', onPress: handleArchive, disabled: archived },
    ...(archived ? [{ icon: Trash2, label: 'Usuń z archiwum', onPress: () => archivedEntry && deleteEntry(archivedEntry.id), disabled: false }] : []),
    { icon: RotateCcw, label: 'Otwórz nową kartę jutro', onPress: () => { clearDailyDraw(); setDidRevealToday(false); setCardFlipped(false); }, disabled: false },
  ] : [];

  return (
    <View style={[dt.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={isLight
          ? (activeDraw ? ['#FBF4EA', '#F3E8D7', '#EADBC4'] as const : ['#F5F0F8', '#EDE3F3', '#E6D8EF'] as const)
          : (activeDraw ? ['#090603', '#120D08', '#1B140C'] as const : ['#05050B', '#0A0810', '#100A18'] as const)}
        style={StyleSheet.absoluteFillObject as any}
      />
      <LinearGradient colors={[ACCENT + '14', 'transparent', 'transparent']} style={StyleSheet.absoluteFillObject as any} />

      <SafeAreaView edges={['top']} style={dt.safe}>
        <ScrollView
          ref={mainScrollRef}
          contentContainerStyle={[dt.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'detail') }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top bar ── */}
          <View style={dt.topBar}>
            <Pressable onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.goBack()} style={dt.topAction}>
              <ChevronLeft color={ACCENT} size={20} />
              <Typography variant="microLabel" color={ACCENT} style={{ marginLeft: 6 }}>{t('dailyTarot.wroc', 'Wróć')}</Typography>
            </Pressable>
            <Typography variant="premiumLabel" color={ACCENT}>{t('dailyTarot.karta_dnia', '🃏 KARTA DNIA')}</Typography>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable onPress={handleShare}><Share2 color={ACCENT} size={16} /></Pressable>
              <Pressable onPress={() => { if (isFavoriteItem('daily_tarot')) { removeFavoriteItem('daily_tarot'); } else { addFavoriteItem({ id: 'daily_tarot', label: 'Karta dnia', route: 'DailyTarot', params: {}, icon: 'Star', color: ACCENT, addedAt: new Date().toISOString() }); } }}>
                <Star color={isFavoriteItem('daily_tarot') ? ACCENT : ACCENT + '88'} size={18} strokeWidth={1.8} fill={isFavoriteItem('daily_tarot') ? ACCENT : 'none'} />
              </Pressable>
            </View>
          </View>

          {!activeDraw ? (
            <>
              {/* ── Portal orb ── */}
              <TarotPortal3D accent={ACCENT} />

              {/* ── Entry heading ── */}
              <View style={{ paddingHorizontal: layout.padding.screen, alignItems: 'center', marginBottom: 28 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: ACCENT, marginBottom: 10 }}>{t('dailyTarot.ceremonia_poranka', 'CEREMONIA PORANKA')}</Text>
                <Text style={{ fontSize: 26, fontWeight: '300', letterSpacing: 0.5, color: textColor, textAlign: 'center', lineHeight: 34, marginBottom: 12 }}>
                  Jeden znak.{'\n'}Jeden ton. Jeden kierunek.
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 23, color: subColor, textAlign: 'center' }}>
                  {t('dailyTarot.to_nie_jest_szybkie_losowanie', 'To nie jest szybkie losowanie. To dzienny rytuał, który wraca raz na dobę i zostawia jeden wyraźny sygnał do niesienia przez cały dzień.')}
                </Text>
              </View>

              {/* ── Metrics row ── */}
              <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: layout.padding.screen, marginBottom: 28, justifyContent: 'center' }}>
                {[{ label: '1 karta', icon: Star }, { label: '1 pytanie', icon: WandSparkles }, { label: '1 kierunek', icon: SunMedium }].map((item) => {
                  const Icon = item.icon;
                  return (
                    <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 999, borderWidth: 1, borderColor: ACCENT + '30', backgroundColor: ACCENT + '0C', paddingHorizontal: 12, paddingVertical: 8 }}>
                      <Icon color={ACCENT} size={13} />
                      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: ACCENT, marginLeft: 7 }}>{item.label}</Text>
                    </View>
                  );
                })}
              </View>

              {/* ── Daily context chips (pre-reveal) ── */}
              <Animated.View entering={FadeInDown.delay(150).duration(500)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: ACCENT + '14', borderWidth: 1, borderColor: ACCENT + '28', paddingHorizontal: 12, paddingVertical: 7 }}>
                    <Text style={{ fontSize: 13 }}>{moonPhase.emoji}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: ACCENT }}>{moonPhase.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: ACCENT + '14', borderWidth: 1, borderColor: ACCENT + '28', paddingHorizontal: 12, paddingVertical: 7 }}>
                    <Calendar color={ACCENT} size={12} />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: ACCENT }}>{DAYS_FULL[dayOfWeek]}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: ACCENT + '14', borderWidth: 1, borderColor: ACCENT + '28', paddingHorizontal: 12, paddingVertical: 7 }}>
                    <Hash color={ACCENT} size={12} />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: ACCENT }}>Karta #{cardNumberInYear} roku</Text>
                  </View>
                </View>
              </Animated.View>

              {/* ── Face-down card hero (sacred geometry back) ── */}
              <Animated.View entering={FadeIn.delay(200).duration(800)} style={{ alignItems: 'center', marginBottom: 32 }}>
                <View style={{ width: SW - 80, height: (SW - 80) * 1.6, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT + '10', borderWidth: 1.5, borderColor: ACCENT + '40' }}>
                  <LinearGradient colors={isLight ? ['#FBF5E6', '#F0E6D0', '#E8D8BE'] : ['#0C0A14', '#181028', '#0F0820']} style={StyleSheet.absoluteFillObject} />
                  <CardBackGeometry accent={ACCENT} size={(SW - 80) * 0.7} />
                  <View style={{ position: 'absolute', bottom: 24, alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2.5, color: ACCENT + 'AA' }}>{t('dailyTarot.karta_czeka_na_ciebie', 'KARTA CZEKA NA CIEBIE')}</Text>
                  </View>
                </View>
              </Animated.View>

              <SectionDivider />

              {/* ── Ritual preparation ── */}
              <View style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 18 }}>{t('dailyTarot.rytual_przed_odslonieci', 'RYTUAŁ PRZED ODSŁONIĘCIEM')}</Text>
                {RITUAL_STEPS.map((step, i) => (
                  <View key={step.n}>
                    {i > 0 && <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 12 }} />}
                    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
                      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: ACCENT + '20', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1, color: ACCENT }}>{step.n}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: textColor, marginBottom: 5 }}>{step.title}</Text>
                        <Text style={{ fontSize: 13, lineHeight: 20, color: subColor }}>{step.copy}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <SectionDivider />

              {/* ── Three layers intro ── */}
              <View style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 28 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 18 }}>{t('dailyTarot.tarotowy_portal_dnia', 'TAROTOWY PORTAL DNIA')}</Text>
                {[
                  { icon: Gem, title: 'Symbol', copy: 'Jedna karta, która zbiera energię dnia do jednego znaku.' },
                  { icon: Eye, title: 'Wgląd', copy: 'Nie szybka wróżba, tylko świadome odczytanie tonu dnia.' },
                  { icon: Crown, title: 'Integracja', copy: 'Na końcu zostaje jeden ruch, który naprawdę niesiesz dalej.' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <View key={item.title}>
                      {i > 0 && <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 14 }} />}
                      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
                        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: ACCENT + '14', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon color={ACCENT} size={16} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: textColor, marginBottom: 5 }}>{item.title}</Text>
                          <Text style={{ fontSize: 13, lineHeight: 20, color: subColor }}>{item.copy}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              <SectionDivider />

              {/* ── Jak czytać kartę (pre-reveal) ── */}
              <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 16 }}>{t('dailyTarot.jak_czytac_karte', '💡 JAK CZYTAĆ KARTĘ')}</Text>
                {[
                  { icon: Eye,    title: 'Symbole',  copy: 'Zatrzymaj się na jednym obrazie — postaci, przedmiocie lub kolorze, który przyciąga wzrok. To on niesie pierwsze przesłanie.' },
                  { icon: Layers, title: 'Kolor',    copy: 'Dominujące barwy karty mają temperaturę emocjonalną. Złoto i czerwień aktywizują, błękit i fiolet pogłębiają, zieleń uzdrawia.' },
                  { icon: Gem,    title: 'Pozycja',  copy: 'Karta prosta wzmacnia energię; odwrócona prosi o rewizję, spowolnienie lub spojrzenie od wewnątrz.' },
                ].map((tip, i) => {
                  const Icon = tip.icon;
                  return (
                    <View key={tip.title}>
                      {i > 0 && <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 11 }} />}
                      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon color={ACCENT} size={14} strokeWidth={1.8} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, marginBottom: 3 }}>{tip.title}</Text>
                          <Text style={{ fontSize: 12, lineHeight: 19, color: subColor }}>{tip.copy}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </Animated.View>

              <SectionDivider />

              <View style={{ paddingHorizontal: layout.padding.screen, paddingTop: 18, paddingBottom: 8 }}>
                <Text style={{ fontSize: 13, lineHeight: 22, color: subColor, textAlign: 'center', marginBottom: 20 }}>
                  {t('dailyTarot.ten_ekran_ma_przypomina_maly', 'Ten ekran ma przypominać mały rytuał, nie zwykłe narzędzie. Karta dnia nie ma Cię przytłoczyć — ma zostawić jeden czysty motyw, który niesiesz dalej.')}
                </Text>
                <PremiumButton label={t('dailyTarot.odkryj_karte_dnia', 'Odkryj kartę dnia')} onPress={handleReveal} />
              </View>
            </>
          ) : (
            <>
              {/* ── Daily context bar ── */}
              <Animated.View entering={FadeIn.duration(400)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: ACCENT + '14', borderWidth: 1, borderColor: ACCENT + '28', paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ fontSize: 12 }}>{moonPhase.emoji}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: ACCENT }}>{moonPhase.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: ACCENT + '14', borderWidth: 1, borderColor: ACCENT + '28', paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Calendar color={ACCENT} size={11} />
                    <Text style={{ fontSize: 10, fontWeight: '600', color: ACCENT }}>{DAYS_FULL[dayOfWeek]}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: ACCENT + '14', borderWidth: 1, borderColor: ACCENT + '28', paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Hash color={ACCENT} size={11} />
                    <Text style={{ fontSize: 10, fontWeight: '600', color: ACCENT }}>#{cardNumberInYear} karta roku</Text>
                  </View>
                </View>
              </Animated.View>

              {/* ── Card name + reversed badge ── */}
              <View style={{ paddingHorizontal: layout.padding.screen, alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: ACCENT, marginBottom: 12 }}>
                  {didRevealToday ? 'KARTA WŁAŚNIE ODSŁONIĘTA' : 'DZISIEJSZY ZNAK'}
                </Text>
                <Text style={{ fontSize: 30, fontWeight: '300', letterSpacing: 0.5, color: textColor, textAlign: 'center', lineHeight: 38, marginBottom: 8 }}>
                  {resolveUserFacingText(activeDraw.card.name)}
                </Text>
                {activeDraw.isReversed && (
                  <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: ACCENT + '18', borderWidth: 1, borderColor: ACCENT + '35' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: ACCENT }}>{t('dailyTarot.energia_odwrocona', 'Energia odwrócona')}</Text>
                  </View>
                )}
              </View>

              {/* ── 3D Holographic Flip card hero ── */}
              <Animated.View entering={FadeIn.delay(100).duration(700)} style={{ alignItems: 'center', marginBottom: 16 }}>
                <TarotCardFlip
                  cardName={resolveUserFacingText(activeDraw.card.name)}
                  cardSymbol={MAJOR_SYMBOLS[todayCardIdx] ?? '✦'}
                  cardMeaning={(() => {
                    const full = NUMEROLOGY_NAMES[todayCardIdx] ?? '';
                    const dashIdx = full.indexOf('—');
                    return dashIdx !== -1 ? full.slice(dashIdx + 1).trim() : full;
                  })()}
                  cardColor={[MAJOR_ACCENT[todayCardIdx] ?? ACCENT, MAJOR_ACCENT2[todayCardIdx] ?? '#4A3060']}
                  isReversed={showReversed ? !activeDraw.isReversed : activeDraw.isReversed}
                  isFlipped={cardFlipped}
                  onFlip={() => setCardFlipped((v) => !v)}
                  isLight={isLight}
                  accent={ACCENT}
                />
                <Text style={{ fontSize: 11, color: subColor, marginTop: 12, textAlign: 'center' }}>
                  Dotknij kartę, by {cardFlipped ? 'zobaczyć tył' : 'zobaczyć przód'}
                </Text>
              </Animated.View>

              {/* ── Card controls row ── */}
              <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ flexDirection: 'row', gap: 10, paddingHorizontal: layout.padding.screen, marginBottom: 24, justifyContent: 'center' }}>
                <Pressable
                  onPress={() => setShowReversed((v) => !v)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, borderWidth: 1, borderColor: showReversed ? ACCENT : ACCENT + '44', backgroundColor: showReversed ? ACCENT + '20' : ACCENT + '0A', paddingHorizontal: 14, paddingVertical: 8 }}
                >
                  <FlipHorizontal color={ACCENT} size={13} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: ACCENT }}>
                    {showReversed ? 'Znaczenie odwrócone' : 'Pokaż odwrócenie'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleShare}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, borderWidth: 1, borderColor: ACCENT + '44', backgroundColor: ACCENT + '0A', paddingHorizontal: 14, paddingVertical: 8 }}
                >
                  <Share2 color={ACCENT} size={13} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: ACCENT }}>{t('dailyTarot.udostepnij', 'Udostępnij')}</Text>
                </Pressable>
              </Animated.View>

              <SectionDivider />

              {/* ── Narrative lead ── */}
              <View style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 14 }}>{t('dailyTarot.narracja_dnia', 'NARRACJA DNIA')}</Text>
                <Text style={{ fontSize: 16, lineHeight: 28, color: textColor, marginBottom: 12 }}>
                  {t('dailyTarot.nie_traktuj_tej_karty_jak', 'Nie traktuj tej karty jak suchej informacji. To klimat, napięcie i kierunek, który chce wejść do dzisiejszych decyzji.')}
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 24, color: subColor }}>
                  {t('dailyTarot.najbardzie_premium_odczyt_zaczyna_s', 'Najbardziej premium odczyt zaczyna się tam, gdzie przestajesz pytać, czy karta jest dobra, i zaczynasz pytać, gdzie ona już dziś działa.')}
                </Text>
              </View>

              <SectionDivider />

              {/* ── Esencja ── */}
              <View style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 14 }}>{t('dailyTarot.esencja_i_znaczenie', 'ESENCJA I ZNACZENIE')}</Text>
                <Text style={{ fontSize: 15, lineHeight: 26, color: textColor }}>
                  {showReversed
                    ? resolveUserFacingText(activeDraw.card.meaningReversed)
                    : (interpretation?.contextualMeaning || resolveUserFacingText(activeDraw.isReversed ? activeDraw.card.meaningReversed : activeDraw.card.meaningUpright))}
                </Text>
              </View>

              <SectionDivider />

              {/* ── Multi-perspective tabs ── */}
              <Animated.View entering={FadeInDown.delay(80).duration(500)} style={{ paddingTop: 24, paddingBottom: 20 }}>
                <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Layers color={ACCENT} size={14} strokeWidth={1.8} />
                    <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT }}>{t('dailyTarot.perspektyw_karty', 'PERSPEKTYWY KARTY')}</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {PERSPECTIVE_TABS.map((tab) => (
                        <Pressable
                          key={tab}
                          onPress={() => setActiveTab(tab)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 999,
                            backgroundColor: activeTab === tab ? ACCENT + '28' : ACCENT + '0A',
                            borderWidth: 1,
                            borderColor: activeTab === tab ? ACCENT : ACCENT + '30',
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT, letterSpacing: 0.3 }}>{tab}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                  <View style={{ borderRadius: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: isLight ? (ACCENT + '44') : (ACCENT + '25'), padding: 18, overflow: 'hidden',
                    shadowColor: ACCENT, shadowOpacity: isLight ? 0.12 : 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: isLight ? 4 : 2,
                  }}>
                    <LinearGradient colors={[ACCENT + (isLight ? '18' : '10'), 'transparent']} style={StyleSheet.absoluteFillObject} />
                    <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, color: ACCENT, marginBottom: 10 }}>{activeTab.toUpperCase()}</Text>
                    <Text style={{ fontSize: 14, lineHeight: 24, color: textColor }}>
                      {cardPerspective[activeTab]}
                    </Text>
                  </View>
                </View>
              </Animated.View>

              <SectionDivider />

              {/* ── Ton emocjonalny ── */}
              <View style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 14 }}>{t('dailyTarot.ton_emocjonaln', 'TON EMOCJONALNY')}</Text>
                <Text style={{ fontSize: 15, lineHeight: 26, color: textColor }}>{interpretation?.relationLine}</Text>
              </View>

              <SectionDivider />

              {/* ── Jeden ruch na dziś ── */}
              <View style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 14 }}>{t('dailyTarot.jeden_ruch_na_dzis', 'JEDEN RUCH NA DZIŚ')}</Text>
                <Text style={{ fontSize: 15, lineHeight: 26, color: textColor }}>{interpretation?.adviceLine}</Text>
              </View>

              <SectionDivider />

              {/* ── AFIRMACJA KARTY — large stylized ── */}
              <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Sparkles color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT }}>{t('dailyTarot.afirmacja_karty', 'AFIRMACJA KARTY')}</Text>
                </View>
                <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: ACCENT + '35' }}>
                  <LinearGradient
                    colors={isLight ? ['#FBF4E8', '#F3E8D0', '#EDE0BC'] : ['#1A1208', '#120E06', '#0D0904']}
                    style={{ padding: 28, alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2.5, color: ACCENT + 'AA', marginBottom: 18 }}>
                      ✦ {MAJOR_NAMES[todayCardIdx].toUpperCase()} ✦
                    </Text>
                    <Text style={{ fontSize: 20, lineHeight: 32, color: isLight ? '#2A1A08' : '#F5EDD8', fontStyle: 'italic', textAlign: 'center', fontWeight: '300', letterSpacing: 0.5 }}>
                      "{todayAffirmation}"
                    </Text>
                    <View style={{ width: 40, height: 1, backgroundColor: ACCENT + '55', marginVertical: 18 }} />
                    <Text style={{ fontSize: 11, color: ACCENT + 'AA', letterSpacing: 1.5, fontWeight: '600' }}>
                      {DAYS_FULL[dayOfWeek].toUpperCase()} · {moonPhase.emoji} {moonPhase.name.toUpperCase()}
                    </Text>
                  </LinearGradient>
                </View>
              </Animated.View>

              <SectionDivider />

              {/* ── ACTION GUIDANCE — 3 concrete steps ── */}
              <Animated.View entering={FadeInDown.delay(110).duration(500)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Target color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT }}>{t('dailyTarot.jak_wdrozyc_to_w_zycie', 'JAK WDROŻYĆ TO W ŻYCIE')}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 }}>
                  <Sun color={subColor} size={11} />
                  <Text style={{ fontSize: 11, color: subColor, fontStyle: 'italic' }}>{actionGuidance.timeOfDay}</Text>
                </View>
                {actionGuidance.steps.map((step, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: i < 2 ? 16 : 0 }}>
                    <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: ACCENT + '22', borderWidth: 1, borderColor: ACCENT + '40', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: ACCENT }}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1, paddingTop: 5 }}>
                      <Text style={{ fontSize: 13, lineHeight: 21, color: textColor }}>{step}</Text>
                    </View>
                  </View>
                ))}
              </Animated.View>

              <SectionDivider />

              {/* ── CIAŁO I KARTA ── */}
              <Animated.View entering={FadeInDown.delay(120).duration(500)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 20 }}>
                {(() => {
                  const zone = bodyZone;
                  const ZoneIcon = zone.icon;
                  return (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <ZoneIcon color={zone.color} size={14} strokeWidth={1.8} />
                        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT }}>{t('dailyTarot.cialo_i_karta', 'CIAŁO I KARTA')}</Text>
                      </View>
                      <View style={{ borderRadius: 16, backgroundColor: zone.color + '0D', borderWidth: 1, borderColor: zone.color + '33', padding: 18, flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
                        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: zone.color + '20', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ZoneIcon color={zone.color} size={22} strokeWidth={1.6} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: zone.color, marginBottom: 2, letterSpacing: 0.5 }}>{zone.zone}</Text>
                          <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1, color: subColor, marginBottom: 8 }}>{t('dailyTarot.strefa_rezonansu', 'STREFA REZONANSU')}</Text>
                          <Text style={{ fontSize: 13, lineHeight: 21, color: subColor }}>{zone.desc}</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, lineHeight: 18, color: subColor, marginTop: 12, textAlign: 'center' }}>
                        {t('dailyTarot.poloz_reke_na_tej_czesci', 'Połóż rękę na tej części ciała i oddychaj przez chwilę z tą kartą.')}
                      </Text>
                    </>
                  );
                })()}
              </Animated.View>

              <SectionDivider />

              {/* ── SHADOW ASPECT ── */}
              <Animated.View entering={FadeInDown.delay(130).duration(500)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Moon color={'#818CF8'} size={14} strokeWidth={1.8} />
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT }}>{t('dailyTarot.aspekt_cienia', 'ASPEKT CIENIA')}</Text>
                </View>
                <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#818CF8' + '30' }}>
                  <LinearGradient
                    colors={isLight ? ['#EDE8F8', '#E4DFF5', '#DDD8F2'] : ['#13101E', '#0F0C1A', '#0B0916']}
                    style={{ padding: 18 }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#818CF8', marginBottom: 10, letterSpacing: 0.3 }}>{shadowAspect.title}</Text>
                    <Text style={{ fontSize: 13, lineHeight: 22, color: isLight ? '#3D3060' : '#C4BAE8', marginBottom: 14 }}>
                      {shadowAspect.shadow}
                    </Text>
                    <View style={{ height: 1, backgroundColor: '#818CF8' + '25', marginBottom: 14 }} />
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                      <Zap color={'#818CF8'} size={14} style={{ marginTop: 2 }} />
                      <Text style={{ flex: 1, fontSize: 13, lineHeight: 21, color: isLight ? '#3D3060' : '#B8B0E0', fontStyle: 'italic' }}>
                        {shadowAspect.gift}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              </Animated.View>

              <SectionDivider />

              {/* ── NUMEROLOGIA — card number + life path connection ── */}
              <Animated.View entering={FadeInDown.delay(140).duration(500)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Hash color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT }}>{t('dailyTarot.polaczenie_numerologi', 'POŁĄCZENIE NUMEROLOGICZNE')}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <View style={{ width: 58, height: 58, borderRadius: 16, backgroundColor: ACCENT + '18', borderWidth: 1, borderColor: ACCENT + '40', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: ACCENT }}>{todayCardIdx}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, marginBottom: 4 }}>
                      {NUMEROLOGY_NAMES[todayCardIdx]?.split(' — ')[0]}
                    </Text>
                    <Text style={{ fontSize: 13, lineHeight: 20, color: subColor }}>
                      {NUMEROLOGY_NAMES[todayCardIdx]?.split(' — ')[1]}
                    </Text>
                  </View>
                </View>
                <View style={{ borderRadius: 14, backgroundColor: cardBg, borderWidth: 1, borderColor: ACCENT + '20', padding: 16 }}>
                  <Text style={{ fontSize: 13, lineHeight: 21, color: subColor }}>
                    {NUMEROLOGY_LIFE_PATH[todayCardIdx]}
                  </Text>
                </View>
              </Animated.View>

              <SectionDivider />

              {/* ── KARTA W KONTEKŚCIE ROKU ── */}
              <Animated.View entering={FadeInDown.delay(150).duration(500)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Sun color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT }}>{t('dailyTarot.karta_w_kontekscie_roku', 'KARTA W KONTEKŚCIE ROKU')}</Text>
                  <Pressable
                    onPress={() => setShowYearCardModal(true)}
                    style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: MAJOR_ACCENT[yearCardIdx] + '20', borderWidth: 1, borderColor: MAJOR_ACCENT[yearCardIdx] + '44' }}
                  >
                    <Text style={{ fontSize: 9, fontWeight: '700', color: MAJOR_ACCENT[yearCardIdx] }}>KARTA ROKU {today.getFullYear()}</Text>
                  </Pressable>
                </View>
                <View style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: MAJOR_ACCENT[yearCardIdx] + '35' }}>
                  <LinearGradient
                    colors={[MAJOR_ACCENT[yearCardIdx] + '18', MAJOR_ACCENT[yearCardIdx] + '08', 'transparent']}
                    style={{ padding: 18 }}
                  >
                    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: MAJOR_ACCENT[yearCardIdx] + '25', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: MAJOR_ACCENT[yearCardIdx] + '55' }}>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: MAJOR_ACCENT[yearCardIdx] }}>{yearCardIdx}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: MAJOR_ACCENT[yearCardIdx] }}>{MAJOR_NAMES[yearCardIdx]}</Text>
                        <Text style={{ fontSize: 11, color: subColor, marginTop: 2 }}>Karta roku {today.getFullYear()}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, lineHeight: 21, color: textColor }}>
                      {todayCardIdx === yearCardIdx
                        ? `Karta dnia pokrywa się z kartą roku — energia ${MAJOR_NAMES[yearCardIdx]} jest dziś szczególnie intensywna i rezonuje na głębszym poziomie. To rzadki moment wzmocnienia.`
                        : `Twoja karta dnia (${MAJOR_NAMES[todayCardIdx]}) działa w polu karty roku (${MAJOR_NAMES[yearCardIdx]}). Pytaj, jak dzisiejsza energia służy szerszemu tematowi roku.`}
                    </Text>
                    <Text style={{ fontSize: 12, lineHeight: 19, color: subColor, marginTop: 10 }}>
                      Karta #{cardNumberInYear} z 365 w {today.getFullYear()} roku · dzień {dayOfYear}
                    </Text>
                  </LinearGradient>
                </View>
              </Animated.View>

              <SectionDivider />

              {/* ── Pytanie do refleksji ── */}
              <View style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 14 }}>{t('dailyTarot.pytanie_do_refleksji', 'PYTANIE DO REFLEKSJI')}</Text>
                <Text style={{ fontSize: 15, lineHeight: 26, color: textColor, fontStyle: 'italic' }}>
                  {t('dailyTarot.co_w_tej_karcie_porusza', 'Co w tej karcie porusza mnie najbardziej i gdzie ta energia już próbuje przebić się do mojego dnia?')}
                </Text>
              </View>

              <SectionDivider />

              {/* ── Integracja: three layers ── */}
              <View style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 18 }}>{t('dailyTarot.trzy_warstwy_odczytu', 'TRZY WARSTWY ODCZYTU')}</Text>
                {[
                  { icon: Gem, title: 'Symbol', copy: 'Zobacz, jaki archetyp i jaki ruch psychiczny karta wnosi do dzisiejszego pola.' },
                  { icon: Eye, title: 'Napięcie', copy: 'Sprawdź, gdzie energia karty może już działać w ciele, relacji albo decyzji.' },
                  { icon: Crown, title: 'Integracja', copy: 'Przełóż kartę na jeden realny ruch, który niesiesz dalej po zakończeniu odczytu.' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <View key={item.title}>
                      {i > 0 && <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 14 }} />}
                      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
                        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: ACCENT + '14', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon color={ACCENT} size={16} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: textColor, marginBottom: 5 }}>{item.title}</Text>
                          <Text style={{ fontSize: 13, lineHeight: 20, color: subColor }}>{item.copy}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              <SectionDivider />

              {/* ── Integracja atmosfera ── */}
              <View style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 14 }}>{t('dailyTarot.integracja_karty', 'INTEGRACJA KARTY')}</Text>
                {cardAtmosphere.map((line, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: i < cardAtmosphere.length - 1 ? 14 : 0 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: ACCENT, marginTop: 9, flexShrink: 0 }} />
                    <Text style={{ flex: 1, fontSize: 14, lineHeight: 23, color: subColor }}>{line}</Text>
                  </View>
                ))}
              </View>

              <SectionDivider />

              {/* ── 7-DAY SPREAD VIEW ── */}
              <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Calendar color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT }}>{t('dailyTarot.rozklad_tygodnia_7_dni', 'ROZKŁAD TYGODNIA — 7 DNI')}</Text>
                </View>
                <Text style={{ fontSize: 12, color: subColor, marginBottom: 16 }}>{t('dailyTarot.dotknij_dnia_by_zobaczyc_jego', 'Dotknij dnia, by zobaczyć jego kartę')}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                  {weekDays.map((d, idx) => (
                    <Pressable
                      key={d.label}
                      onPress={() => setSelectedWeekDay(selectedWeekDay === idx ? null : idx)}
                      style={{ alignItems: 'center', flex: 1 }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '600', color: d.isToday ? ACCENT : (isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.40)'), marginBottom: 8, letterSpacing: 0.5 }}>{d.label}</Text>
                      <View style={{
                        width: 36,
                        height: 50,
                        borderRadius: 9,
                        backgroundColor: (selectedWeekDay === idx || d.isToday) ? d.color + '30' : (isLight ? 'rgba(255,248,234,0.92)' : 'rgba(255,255,255,0.06)'),
                        borderWidth: (selectedWeekDay === idx || d.isToday) ? 1.5 : 0.5,
                        borderColor: (selectedWeekDay === idx || d.isToday) ? d.color : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: (selectedWeekDay === idx || d.isToday) ? d.color : (isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.35)') }}>{d.idx}</Text>
                      </View>
                      {d.isToday && (
                        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: d.color, marginTop: 5 }} />
                      )}
                    </Pressable>
                  ))}
                </View>
                {selectedWeekDay !== null && (
                  <Animated.View entering={FadeInDown.duration(300)}>
                    <View style={{ borderRadius: 16, backgroundColor: weekDays[selectedWeekDay].color + '12', borderWidth: 1, borderColor: weekDays[selectedWeekDay].color + '35', padding: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: weekDays[selectedWeekDay].color + '25', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 18, fontWeight: '800', color: weekDays[selectedWeekDay].color }}>{weekDays[selectedWeekDay].idx}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: weekDays[selectedWeekDay].color }}>{weekDays[selectedWeekDay].name}</Text>
                          <Text style={{ fontSize: 11, color: subColor, marginTop: 2 }}>{weekDays[selectedWeekDay].fullLabel}</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 13, lineHeight: 21, color: textColor }}>
                        {CARD_PERSPECTIVES[weekDays[selectedWeekDay].idx]?.['Ogólnie'] || NUMEROLOGY_NAMES[weekDays[selectedWeekDay].idx]}
                      </Text>
                    </View>
                  </Animated.View>
                )}
              </Animated.View>

              <SectionDivider />

              {/* ── TYGODNIOWY PRZEGLĄD KART (compact) ── */}
              <Animated.View entering={FadeInDown.delay(210).duration(500)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 22, paddingBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Moon color={weekCardColor} size={14} strokeWidth={1.8} />
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT }}>{t('dailyTarot.karta_tygodnia', 'KARTA TYGODNIA')}</Text>
                  <View style={{ marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: weekCardColor + '20', borderWidth: 1, borderColor: weekCardColor + '44' }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1, color: weekCardColor }}>TYG. {weekNum}</Text>
                  </View>
                </View>
                <View style={{ borderRadius: 18, backgroundColor: weekCardColor + '0D', borderWidth: 1, borderColor: weekCardColor + '33', padding: 18, overflow: 'hidden' }}>
                  <LinearGradient colors={[weekCardColor + '15', 'transparent']} style={StyleSheet.absoluteFillObject as any} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <View style={{ width: 52, height: 52, borderRadius: 15, backgroundColor: weekCardColor + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: weekCardColor + '44' }}>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: weekCardColor }}>{weekCardIdx}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: weekCardColor, letterSpacing: -0.3 }}>{MAJOR_NAMES[weekCardIdx]}</Text>
                      <Text style={{ fontSize: 11, color: subColor, marginTop: 2 }}>{t('dailyTarot.arkana_wieksza_karta_tygodnia', 'Arkana Większa · Karta tygodnia')}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 14, lineHeight: 23, color: textColor }}>
                    {WEEKLY_INTERPRETATIONS[weekCardIdx]}
                  </Text>
                </View>
              </Animated.View>

              <SectionDivider />

              {/* ── JAK CZYTAĆ KARTĘ ── */}
              <Animated.View entering={FadeInDown.delay(220).duration(500)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 16 }}>{t('dailyTarot.jak_czytac_karte_1', '💡 JAK CZYTAĆ KARTĘ')}</Text>
                {[
                  { icon: Eye,    title: 'Symbole',  copy: 'Zatrzymaj się na jednym obrazie — postaci, przedmiocie lub kolorze, który przyciąga wzrok. To on niesie pierwsze przesłanie.' },
                  { icon: Layers, title: 'Kolor',    copy: 'Dominujące barwy karty mają temperaturę emocjonalną. Złoto i czerwień aktywizują, błękit i fiolet pogłębiają, zieleń uzdrawia.' },
                  { icon: Gem,    title: 'Pozycja',  copy: 'Karta prosta wzmacnia i otwiera energię; odwrócona prosi o rewizję, spowolnienie lub spojrzenie od środka.' },
                ].map((tip, i) => {
                  const Icon = tip.icon;
                  return (
                    <View key={tip.title}>
                      {i > 0 && <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 12 }} />}
                      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                        <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon color={ACCENT} size={15} strokeWidth={1.8} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, marginBottom: 4 }}>{tip.title}</Text>
                          <Text style={{ fontSize: 13, lineHeight: 20, color: subColor }}>{tip.copy}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </Animated.View>

              <SectionDivider />

              {/* ── PYTANIA DO REFLEKSJI — tap to journal ── */}
              <Animated.View entering={FadeInDown.delay(230).duration(500)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 22, paddingBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <NotebookPen color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT }}>{t('dailyTarot.pytania_do_refleksji', 'PYTANIA DO REFLEKSJI')}</Text>
                </View>
                {REFLECTION_PROMPTS.map((q, i) => (
                  <Pressable
                    key={i}
                    onPress={() => navigation.navigate('JournalEntry', { type: 'tarot', prompt: q })}
                    style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: i < REFLECTION_PROMPTS.length - 1 ? 1 : 0, borderBottomColor: dividerColor }}
                  >
                    <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: ACCENT }}>{i + 1}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 13, lineHeight: 20, color: isLight ? '#2A2018' : '#DDD5C8', fontStyle: 'italic' }}>{q}</Text>
                    <ArrowRight color={isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.25)'} size={13} />
                  </Pressable>
                ))}
              </Animated.View>

              <SectionDivider />

              {/* ── JOURNALING PROMPT — AI generated ── */}
              <Animated.View entering={FadeInDown.delay(240).duration(500)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <MessageSquare color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT }}>{t('dailyTarot.zapytaj_wyrocznie_o_karte', 'ZAPYTAJ WYROCZNIĘ O KARTĘ')}</Text>
                </View>
                <View style={{ borderRadius: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.10)', overflow: 'hidden', marginBottom: 12 }}>
                  <TextInput
                    value={aiQuestion}
                    onChangeText={setAiQuestion}
                    placeholder={`Co karta ${MAJOR_NAMES[todayCardIdx]} mówi mi o...`}
                    placeholderTextColor={subColor}
                    multiline
                    style={{ fontSize: 14, lineHeight: 22, color: textColor, padding: 16, minHeight: 72, textAlignVertical: 'top' }}
                  />
                </View>
                <Pressable
                  onPress={handleAskAI}
                  disabled={!aiQuestion.trim() || aiLoading}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, backgroundColor: ACCENT + '22', borderWidth: 1, borderColor: ACCENT + '44', paddingVertical: 13, opacity: (!aiQuestion.trim() || aiLoading) ? 0.5 : 1 }}
                >
                  <WandSparkles color={ACCENT} size={15} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>{aiLoading ? 'Wyrocznia myśli...' : 'Zapytaj Wyrocznię'}</Text>
                </Pressable>
                {aiAnswer.length > 0 && (
                  <Animated.View entering={FadeInDown.duration(400)} style={{ marginTop: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: ACCENT + '30' }}>
                    <LinearGradient colors={isLight ? ['#FBF4E8', '#F6EDD8'] : ['#1A1208', '#120E06']} style={{ padding: 18 }}>
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                        <Sparkles color={ACCENT} size={14} style={{ marginTop: 3 }} />
                        <Text style={{ flex: 1, fontSize: 14, lineHeight: 24, color: textColor, fontStyle: 'italic' }}>{aiAnswer}</Text>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                )}
              </Animated.View>

              <SectionDivider />

              {/* ── HISTORIA KART — last 30 days ── */}
              <Animated.View entering={FadeInDown.delay(250).duration(500)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 22, paddingBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Calendar color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT }}>{t('dailyTarot.historia_kart', 'HISTORIA KART')}</Text>
                  <Text style={{ marginLeft: 'auto', fontSize: 10, color: subColor }}>{t('dailyTarot.30_dni', '30 dni')}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: ACCENT }} />
                    <Text style={{ fontSize: 10, color: subColor }}>{t('dailyTarot.arkana_wieksza', 'Arkana Większa')}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 12 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#60A5FA' }} />
                    <Text style={{ fontSize: 10, color: subColor }}>{t('dailyTarot.arkana_mniejsze', 'Arkana Mniejsze')}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                  {last30.map((day, i) => {
                    const isToday2 = i === 29;
                    return (
                      <View
                        key={day.ds}
                        style={{
                          width: 34, height: 40, borderRadius: 9,
                          backgroundColor: isToday2 ? day.color + '30' : (day.isMajor ? ACCENT + '14' : '#60A5FA14'),
                          borderWidth: isToday2 ? 1.5 : 0.5,
                          borderColor: isToday2 ? day.color : (day.isMajor ? ACCENT + '30' : '#60A5FA30'),
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: '800', color: isToday2 ? day.color : (day.isMajor ? ACCENT + 'CC' : '#60A5FACC') }}>{day.idx}</Text>
                        <Text style={{ fontSize: 8, color: isToday2 ? day.color + 'AA' : subColor, marginTop: 2 }}>{day.dayNum}</Text>
                      </View>
                    );
                  })}
                </View>
              </Animated.View>

              <SectionDivider />

              {/* ── WZORCE MIESIĘCZNE ── */}
              <Animated.View entering={FadeInDown.delay(260).duration(500)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 22, paddingBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <TrendingUp color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT }}>{t('dailyTarot.wzorce_miesieczne', 'WZORCE MIESIĘCZNE')}</Text>
                </View>
                {monthPatterns.length === 0 ? (
                  <Text style={{ fontSize: 13, color: subColor }}>{t('dailyTarot.brak_danych_z_tego_miesiaca', 'Brak danych z tego miesiąca.')}</Text>
                ) : (
                  <>
                    {monthPatterns.map((p, i) => {
                      const pColor = MAJOR_ACCENT[p.idx];
                      return (
                        <View key={p.idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: i < monthPatterns.length - 1 ? 1 : 0, borderBottomColor: dividerColor }}>
                          <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: pColor + '22', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: pColor }}>{i + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: pColor }}>{MAJOR_NAMES[p.idx]}</Text>
                            <Text style={{ fontSize: 11, color: subColor, marginTop: 2 }}>Pojawiła się {p.count}× w tym miesiącu</Text>
                          </View>
                          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: pColor + '18' }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: pColor }}>{p.count}×</Text>
                          </View>
                        </View>
                      );
                    })}
                    <View style={{ marginTop: 14, borderRadius: 13, backgroundColor: ACCENT + '0A', borderWidth: 1, borderColor: ACCENT + '25', padding: 14 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: ACCENT, marginBottom: 6, letterSpacing: 0.8 }}>{t('dailyTarot.interpreta_wzorca', 'INTERPRETACJA WZORCA')}</Text>
                      <Text style={{ fontSize: 13, lineHeight: 21, color: subColor }}>
                        {MONTHLY_PATTERN_NOTES[monthPatterns[0]?.idx] || 'Miesiąc przynosi wyraźny wzorzec energetyczny.'}
                      </Text>
                    </View>
                  </>
                )}
              </Animated.View>

              <SectionDivider />

              {/* ── NOTATKA DO KARTY ── */}
              <Animated.View entering={FadeInDown.delay(270).duration(500)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 22, paddingBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <PenLine color={ACCENT} size={14} strokeWidth={1.8} />
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT }}>{t('dailyTarot.notatka_do_karty', 'NOTATKA DO KARTY')}</Text>
                </View>
                <View style={{ borderRadius: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
                  <TextInput
                    value={cardNote}
                    onChangeText={(t) => { setCardNote(t); setNoteSaved(false); }}
                    placeholder={t('dailyTarot.co_ta_karta_mowi_ci', 'Co ta karta mówi ci dziś? Wolna myśl, obserwacja, obraz...')}
                    placeholderTextColor={subColor}
                    multiline
                    style={{ fontSize: 14, lineHeight: 22, color: textColor, padding: 16, minHeight: 90, textAlignVertical: 'top' }}
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 12, paddingBottom: 12 }}>
                    <Pressable
                      onPress={handleSaveNote}
                      disabled={!cardNote.trim() || noteSaved}
                      style={[{
                        flexDirection: 'row', alignItems: 'center', gap: 7,
                        paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12,
                        backgroundColor: noteSaved ? '#34D39922' : ACCENT + '22',
                        opacity: !cardNote.trim() ? 0.4 : 1,
                      }]}
                    >
                      <Save color={noteSaved ? '#34D399' : ACCENT} size={14} strokeWidth={2} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: noteSaved ? '#34D399' : ACCENT }}>
                        {noteSaved ? 'Zapisano w dzienniku' : 'Zapisz notatkę'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>

              <SectionDivider />

              {/* ── DOMKNIJ PRACĘ Z KARTĄ ── */}
              <View style={{ paddingHorizontal: layout.padding.screen, paddingTop: 24, paddingBottom: 28 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 16 }}>{t('dailyTarot.domknij_prace_z_karta', 'DOMKNIJ PRACĘ Z KARTĄ')}</Text>
                {actions.map((action, i) => {
                  const Icon = action.icon as any;
                  return (
                    <Pressable
                      key={i}
                      style={[
                        { flexDirection: 'row', alignItems: 'center', minHeight: 54, paddingHorizontal: 18, paddingVertical: 14, marginBottom: 2 },
                        i < actions.length - 1 && { borderBottomWidth: 1, borderBottomColor: dividerColor },
                        (action as any).disabled && { opacity: 0.55 },
                      ]}
                      onPress={action.onPress}
                      disabled={(action as any).disabled}
                    >
                      <Icon color={ACCENT} size={17} strokeWidth={1.8} />
                      <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', letterSpacing: 0.3, color: ACCENT, marginLeft: 14 }}>{action.label}</Text>
                      <ArrowRight color={ACCENT} size={13} />
                    </Pressable>
                  );
                })}
              </View>

              <SectionDivider />

              {/* ── CO DALEJ? ── */}
              <Animated.View entering={FadeInDown.delay(290).duration(500)} style={{ paddingHorizontal: layout.padding.screen, paddingTop: 22, paddingBottom: 24 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ACCENT, marginBottom: 14 }}>{t('dailyTarot.co_dalej', '✦ CO DALEJ?')}</Text>
                {[
                  { icon: Star,         label: 'Tarot — pełna ceremonia',  sub: 'Głębszy rozkład kart — trójka, krzyż celtycki',                             route: 'Tarot',         params: undefined, color: ACCENT },
                  { icon: BookOpen,     label: 'Dziennik — trop z karty',  sub: 'Co karta dnia mówi mi o moim obecnym cyklu życia?',                         route: 'JournalEntry',  params: { prompt: 'Co karta dnia mówi mi o moim obecnym cyklu życia?', type: 'tarot' }, color: '#A78BFA' },
                  { icon: WandSparkles, label: 'Portal Wyroczni',          sub: 'Zapytaj Wyrocznię o głębszy sens karty',                                    route: 'OraclePortal',  params: undefined, color: '#60A5FA' },
                  { icon: Moon,         label: 'Kalendarz księżycowy',     sub: `Faza księżyca: ${moonPhase.name} — jak wpływa na kartę?`,                    route: 'LunarCalendar', params: undefined, color: '#818CF8' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <Pressable
                      key={item.route}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: dividerColor }}
                      onPress={() => navigation.navigate(item.route as any, item.params as any)}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: item.color + '1A', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Icon color={item.color} size={17} strokeWidth={1.8} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>{item.label}</Text>
                        <Text style={{ fontSize: 12, lineHeight: 18, color: subColor, marginTop: 2 }}>{item.sub}</Text>
                      </View>
                      <ArrowRight color={isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.30)'} size={14} />
                    </Pressable>
                  );
                })}
              </Animated.View>
            </>
          )}

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>

      {/* ── Year Card Modal ── */}
      <Modal visible={showYearCardModal} transparent animationType="fade" onRequestClose={() => setShowYearCardModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 }} onPress={() => setShowYearCardModal(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%', borderRadius: 22, overflow: 'hidden', borderWidth: 1.5, borderColor: MAJOR_ACCENT[yearCardIdx] + '55' }}>
            <LinearGradient colors={isLight ? ['#FBF4E8', '#F0E6CE'] : ['#1A1208', '#0F0B06']} style={{ padding: 28 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: MAJOR_ACCENT[yearCardIdx] }}>KARTA ROKU {today.getFullYear()}</Text>
                <Pressable onPress={() => setShowYearCardModal(false)}>
                  <X color={subColor} size={18} />
                </Pressable>
              </View>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: MAJOR_ACCENT[yearCardIdx] + '25', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: MAJOR_ACCENT[yearCardIdx] + '66', marginBottom: 12 }}>
                  <Text style={{ fontSize: 36, fontWeight: '800', color: MAJOR_ACCENT[yearCardIdx] }}>{yearCardIdx}</Text>
                </View>
                <Text style={{ fontSize: 24, fontWeight: '300', color: MAJOR_ACCENT[yearCardIdx], letterSpacing: 0.5 }}>{MAJOR_NAMES[yearCardIdx]}</Text>
                <Text style={{ fontSize: 12, color: subColor, marginTop: 6 }}>Arkana Większa · {today.getFullYear()}</Text>
              </View>
              <Text style={{ fontSize: 14, lineHeight: 24, color: isLight ? '#2A1808' : '#E8DCC8', textAlign: 'center', marginBottom: 16 }}>
                {WEEKLY_INTERPRETATIONS[yearCardIdx]}
              </Text>
              <Text style={{ fontSize: 12, lineHeight: 20, color: subColor, textAlign: 'center' }}>
                {NUMEROLOGY_LIFE_PATH[yearCardIdx]}
              </Text>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const dt = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flexGrow: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, marginTop: 10, paddingHorizontal: layout.padding.screen },
  topAction: { flexDirection: 'row', alignItems: 'center', minWidth: 60 },
});
