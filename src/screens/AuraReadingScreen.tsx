// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, G, Defs, RadialGradient as SvgRadialGradient, Stop, Line, Path, Polygon, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps, withRepeat, withSequence, withTiming,
  withDelay, FadeInDown, interpolate, Easing, runOnJS, useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Sparkles, ArrowRight, X, Eye, Zap, Heart, Brain,
  Calendar, Gem, RefreshCw, BookOpen, Layers, Shield, Droplets, Wind,
  Sun, Moon, Flame, Users, CheckCircle,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { screenContracts } from '../core/theme/designSystem';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { Typography } from '../components/Typography';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#C084FC';

// ── Data ─────────────────────────────────────────────────────────

const AURA_COLORS = [
  { id: 'red', name: 'Czerwony', hex: '#EF4444', chakra: 'Korzenny', meaning: 'Witalność, pasja, silna wola. Czerwona aura wskazuje na osobę z ogromną energią życiową, zdeterminowaną i ukierunkowaną na działanie.', strengths: ['Determinacja', 'Odwaga', 'Przywództwo'], challenges: ['Gniew', 'Impulsywność', 'Dominacja'], keywords: ['moc', 'ogień', 'działanie'], element: 'Ogień', dayOfWeek: 'Wtorek', crystals: ['💎 Granat', '🔴 Rubin', '🪨 Obsydian'], personality: ['Lider z naturalnym autorytetem', 'Działasz szybko i instynktownie', 'Twoja energia inspiruje innych do czynu'], growthEdges: ['Nauka cierpliwości i słuchania', 'Kanalizowanie gniewu w twórczość'], harmonyStone: '🔴 Rubin — wzmacnia życiową siłę i odwagę', affirmation: 'Moja moc służy miłości i wyższemu celowi.', spiritualMeaning: 'Czerwień to pierwotna siła życia — Kundalini wzbierająca u podstawy kręgosłupa. To energia, która napędza manifestację na planie fizycznym.', howToStrengthen: ['Ćwiczenia fizyczne i praca z ciałem', 'Medytacja przy czerwonych świecach', 'Noszenie rubinu lub granatu', 'Kontakt ze ziemią i naturą'], shadows: ['Agresja i impulsywne decyzje', 'Trudność ze słuchaniem innych', 'Dominowanie zamiast współpracy'] },
  { id: 'orange', name: 'Pomarańczowy', hex: '#F97316', chakra: 'Sakralny', meaning: 'Kreatywność, radość, społeczność. Pomarańczowa aura promieniuje ciepłem i kreatywnością, przyciągając innych swoją energią.', strengths: ['Kreatywność', 'Entuzjazm', 'Towarzyskość'], challenges: ['Nadmiar', 'Zależność emocjonalna', 'Zmienność'], keywords: ['twórczość', 'relacje', 'radość'], element: 'Woda', dayOfWeek: 'Środa', crystals: ['🟠 Karneol', '🌙 Kamień księżycowy', '🟡 Cytryn'], personality: ['Dusza towarzyska z magnetycznym urokiem', 'Twórca i budowniczy relacji', 'Radość jest Twoim naturalnym stanem'], growthEdges: ['Budowanie niezależności emocjonalnej', 'Ustalanie zdrowych granic'], harmonyStone: '🟠 Karneol — rozbudza kreatywność i radość życia', affirmation: 'Moja kreatywność płynie swobodnie i obficie.', spiritualMeaning: 'Pomarańcz to energetyczne centrum kreacji i przyjemności. Sacrum — centrum twórczości, seksualności i radości z bycia w relacji z innymi.', howToStrengthen: ['Taniec i twórcza ekspresja', 'Rytuały przy wodzie', 'Noszenie karneolu', 'Dzielenie się sobą z innymi'], shadows: ['Nadmierna zależność od innych', 'Szukanie walidacji zewnętrznej', 'Rozproszenie energii twórczej'] },
  { id: 'yellow', name: 'Żółty', hex: '#EAB308', chakra: 'Słoneczny', meaning: 'Intelekt, optymizm, indywidualność. Żółta aura emanuje pozytywną energią mentalną i zdolnością do uczenia się.', strengths: ['Inteligencja', 'Optymizm', 'Analiza'], challenges: ['Perfekcjonizm', 'Niepokój', 'Samokrytyka'], keywords: ['umysł', 'światło', 'wiedza'], element: 'Powietrze', dayOfWeek: 'Środa', crystals: ['🟡 Cytryn', '💛 Bursztyn', '✨ Topaz'], personality: ['Jasny umysł z naturalną ciekawością', 'Uczysz się szybko i łatwo łączysz fakty', 'Optymizm jest Twoją tarczą'], growthEdges: ['Odpuszczanie perfekcjonizmu', 'Odpoczynek bez poczucia winy'], harmonyStone: '🟡 Cytryn — rozjaśnia myśli i rozprasza lęk', affirmation: 'Mój umysł jest jasny i pełen mądrości.', spiritualMeaning: 'Żółć to słoneczny splot nerwowy — centrum osobistej mocy, pewności siebie i zdolności transformacji lęku w odwagę.', howToStrengthen: ['Medytacja na słońcu', 'Ćwiczenia oddechowe', 'Nauka i studia', 'Noszenie cytrynu lub bursztynu'], shadows: ['Paraliż analityczny', 'Nadmierna samokrytyka', 'Lęk przed błędem'] },
  { id: 'green', name: 'Zielony', hex: '#22C55E', chakra: 'Sercowy', meaning: 'Uzdrowienie, balans, miłość. Zielona aura to dar terapeutyczny — osoby z tą aurą naturalnie uzdrawiają innych swoją obecnością.', strengths: ['Empatia', 'Uzdrowienie', 'Równowaga'], challenges: ['Zaniedbywanie siebie', 'Nadmierne dawanie', 'Granice'], keywords: ['natura', 'serce', 'harmonia'], element: 'Ziemia', dayOfWeek: 'Piątek', crystals: ['💚 Awenturyn', '🌿 Malachit', '💎 Szmaragd'], personality: ['Uzdrowiciel z wrodzoną empatią', 'Inni czują się przy Tobie bezpiecznie', 'Natura jest Twoją świątynią'], growthEdges: ['Stawianie siebie na pierwszym miejscu', 'Uczenie się mówienia nie'], harmonyStone: '💚 Awenturyn — wspiera serce i przyciąga obfitość', affirmation: 'Kocham siebie tak samo głęboko, jak kocham innych.', spiritualMeaning: 'Zieleń to bicie serca wszechświata — centrum bezwarunkowej miłości i uzdrowienia. Osoby z zieloną aurą są naturalnymi kanałami Boskiej Miłości.', howToStrengthen: ['Spacery w naturze i lesie', 'Praca z roślinami', 'Medytacje miłości własnej', 'Noszenie malachitu lub szmaragdu'], shadows: ['Martyrstwo i nadmierne poświęcenie', 'Niezdolność do przyjmowania pomocy', 'Zacieranie własnych potrzeb'] },
  { id: 'blue', name: 'Niebieski', hex: '#3B82F6', chakra: 'Gardłowy', meaning: 'Komunikacja, spokój, intuicja. Niebieska aura wskazuje na osobę głęboko komunikatywną i spokojną, która żyje w zgodzie ze swoją prawdą.', strengths: ['Komunikacja', 'Spokój', 'Uczciwość'], challenges: ['Zamknięcie', 'Lęk przed odrzuceniem', 'Perfekcja w mowie'], keywords: ['prawda', 'głos', 'spokój'], element: 'Powietrze', dayOfWeek: 'Czwartek', crystals: ['💙 Lapis Lazuli', '🌊 Akwamaryn', '🔵 Błękitny Topaz'], personality: ['Głos prawdy i autentyczności', 'Twój spokój jest darem dla otoczenia', 'Słowa mają dla Ciebie ogromną moc'], growthEdges: ['Otwieranie się na intymność', 'Odwaga mówienia o bólu'], harmonyStone: '💙 Lapis Lazuli — wzmacnia głos i intuicję', affirmation: 'Mówię swoją prawdę z miłością i odwagą.', spiritualMeaning: 'Błękit to wibracją mowy i kreatywności słownej. Czakra gardłowa jest bramą między sercem a umysłem — każde słowo jest magiczną intencją.', howToStrengthen: ['Śpiewanie i recytacja mantr', 'Pisanie dziennika', 'Noszenie lapis lazuli', 'Medytacja przy morzu lub rzece'], shadows: ['Strach przed mówieniem prawdy', 'Perfekcjonizm w komunikacji', 'Tłumienie twórczej ekspresji'] },
  { id: 'indigo', name: 'Indygo', hex: '#6366F1', chakra: 'Trzecie Oko', meaning: 'Intuicja, wizje, mądrość duchowa. Indygowa aura należy do osób o głębokiej intuicji i zdolności widzenia za zasłoną codzienności.', strengths: ['Intuicja', 'Wizjonerstwo', 'Głębia'], challenges: ['Izolacja', 'Overwhelm sensoryczny', 'Trudność zakorzenienia'], keywords: ['widzenie', 'intuicja', 'głębia'], element: 'Eter', dayOfWeek: 'Sobota', crystals: ['🔮 Ametyst', '🌑 Labradoryt', '💜 Czarny Turmalin'], personality: ['Widzisz to, co inni przeoczają', 'Twoja intuicja jest kompasem', 'Głęboka wrażliwość to Twój dar i wyzwanie'], growthEdges: ['Uziemianie się w ciele i naturze', 'Budowanie granic energetycznych'], harmonyStone: '🔮 Ametyst — wzmacnia intuicję i chroni przed nadmiarem', affirmation: 'Ufam swojej intuicji — prowadzi mnie ku prawdzie.', spiritualMeaning: 'Indygo to oko wewnętrzne — siedziba jasnowidzenia i kosmicznej pamięci. Osoby z tą aurą przyszły z misją widzenia i ujawniania ukrytych prawd.', howToStrengthen: ['Medytacja trzeciego oka', 'Praca ze snami i wizjami', 'Noszenie labrydorytu', 'Praktyki ciszy i odosobnienia'], shadows: ['Nadmierna wrażliwość na energie', 'Izolacja od świata fizycznego', 'Trudność w uziemieniu wizji'] },
  { id: 'violet', name: 'Fioletowy', hex: '#A855F7', chakra: 'Koronowy', meaning: 'Duchowość, transformacja, mistycyzm. Fioletowa aura jest aurą poszukiwaczy — osób, które nieustannie dążą do wyższego rozumienia.', strengths: ['Duchowość', 'Transformacja', 'Mądrość'], challenges: ['Odpinanie od ziemi', 'Nierealność', 'Samotność'], keywords: ['mistycyzm', 'korona', 'wyższy plan'], element: 'Eter', dayOfWeek: 'Niedziela', crystals: ['💜 Ametyst', '🌙 Selenit', '🔮 Czarny Kwarc'], personality: ['Dusza poszukująca głębszego sensu', 'Transformacja jest Twoim żywiołem', 'Intuicja przewyższa logikę'], growthEdges: ['Zakorzenienie w codzienności', 'Akceptacja materii i ciała'], harmonyStone: '🌙 Selenit — łączy z wyższą jaźnią i oczyszcza pole', affirmation: 'Jestem mostem między ziemią a niebem.', spiritualMeaning: 'Fiolet to wibracją kosmicznej świadomości i alchemicznej transformacji. Osoby z tą aurą są alchemikami duszy — przemieniają ciemność w światło.', howToStrengthen: ['Praca z akasza kroniki', 'Głęboka medytacja korony', 'Ceremonie transformacji', 'Noszenie selenitu lub ametystu'], shadows: ['Ucieczka od rzeczywistości', 'Poczucie wyższości duchowej', 'Trudność z materializacją wizji'] },
  { id: 'pink', name: 'Różowy', hex: '#EC4899', chakra: 'Sercowy+', meaning: 'Bezwarunkowa miłość, delikatność, akceptacja. Różowa aura otacza osoby, które kochają bez warunków i widzą dobro w każdej istocie.', strengths: ['Miłość bezwarunkowa', 'Akceptacja', 'Wrażliwość'], challenges: ['Naiwność', 'Łatwowierność', 'Samozaniedbanie'], keywords: ['miłość', 'łagodność', 'piękno'], element: 'Woda', dayOfWeek: 'Piątek', crystals: ['🌸 Kwarc Różowy', '💗 Morganit', '🔮 Rodochrozyt'], personality: ['Kochasz bez warunków i bez granic', 'Widzisz piękno nawet w ciemnych miejscach', 'Twoja wrażliwość to supermoc'], growthEdges: ['Rozwijanie zdrowego osądu', 'Kochanie siebie tak samo jak innych'], harmonyStone: '🌸 Kwarc Różowy — otwiera serce i przyciąga miłość', affirmation: 'Jestem miłością — daję i przyjmuję ją swobodnie.', spiritualMeaning: 'Różowy jest kolorem Boskiej Miłości Anielskiej — to wibracją istot, które przyszły na Ziemię aby szerzyć bezwarunkowe piękno i akceptację.', howToStrengthen: ['Afirmacje miłości własnej', 'Kąpiele z różami', 'Noszenie kwarcu różowego', 'Otaczanie się pięknem'], shadows: ['Bycie zbyt łatwowiernym', 'Poświęcanie siebie z lęku przed odrzuceniem', 'Unikanie konfrontacji'] },
  { id: 'gold', name: 'Złoto-Biały', hex: '#F59E0B', chakra: 'Transpersonalny', meaning: 'Boskość, oświecenie, czysty kanał. Złoto-biała aura pojawia się w stanach głębokiej medytacji, uzdrowienia lub szczytowych chwilach duchowych.', strengths: ['Kanałowanie', 'Ochrona', 'Oświecenie'], challenges: ['Trudność materializacji', 'Brak zakorzenienia', 'Izolacja'], keywords: ['boskość', 'czystość', 'kanał'], element: 'Ogień', dayOfWeek: 'Niedziela', crystals: ['✨ Piryt', '🌟 Złoty Cytryn', '☀️ Tygrysi Kamień'], personality: ['Naturalny kanał duchowej mądrości', 'Obecność w pełni — tu i teraz', 'Promieniujesz spokojem, który jest zaraźliwy'], growthEdges: ['Zakorzenienie w rzeczywistości materialnej', 'Dbanie o potrzeby ciała'], harmonyStone: '✨ Piryt — przyciąga obfitość i wzmacnia pewność siebie', affirmation: 'Jestem czystym kanałem boskości i miłości.', spiritualMeaning: 'Złoto-biały jest najrzadszą aurą — oznacza stan głębokiego oświecenia i kanałowania Boskiej Woli. To wibracją istot na ostatnich poziomach ewolucji duszy.', howToStrengthen: ['Cicha medytacja w naturze', 'Praca z wysokimi intencjami', 'Ceremonialne rytuały', 'Służba innym z czystego serca'], shadows: ['Oderwanie od codzienności', 'Trudność z dbaniem o siebie', 'Poczucie braku miejsca na Ziemi'] },
  { id: 'white', name: 'Biały', hex: '#E2E8F0', chakra: 'Koronowy+', meaning: 'Czystość, przebudzenie, wielowymiarowa świadomość. Biała aura jest niezwykle rzadka i pojawia się u osób, które przeszły głęboką transformację duchową.', strengths: ['Czystość intencji', 'Wielowymiarowość', 'Przebudzenie'], challenges: ['Izolacja', 'Nadwrażliwość', 'Trudność w zakorzenienie'], keywords: ['czystość', 'przebudzenie', 'bezczasowość'], element: 'Eter', dayOfWeek: 'Niedziela', crystals: ['🤍 Selenit', '💎 Kryształ górski', '🌙 Aniolit'], personality: ['Widzisz rzeczywistość wielowymiarowo', 'Twoja czystość intencji jest rzadkim darem', 'Jesteś naturalnym nauczycielem duchowym'], growthEdges: ['Akceptacja cielesności i materii', 'Budowanie mostów z innymi'], harmonyStone: '🤍 Selenit — utrzymuje czystość pola auretycznego', affirmation: 'Jestem czystym światłem emanującym z wiecznego źródła.', spiritualMeaning: 'Biały zawiera w sobie wszystkie kolory — to pełnia spektrum świadomości. Jest oznaką przebudzenia i wejścia w wielowymiarową rzeczywistość duszy.', howToStrengthen: ['Kontemplacja i cisza', 'Praca z selenitem', 'Modlitwa i intencja', 'Harmonijne środowisko'], shadows: ['Poczucie obcości w świecie', 'Nadwrażliwość na energię otoczenia', 'Trudność z decyzjami w codzienności'] },
  { id: 'silver', name: 'Srebrny', hex: '#94A3B8', chakra: 'Księżycowy', meaning: 'Intuicja księżycowa, zmienność, refleksja. Srebrna aura wskazuje osobę głęboko połączoną z cyklami księżyca i kobiecą energią mistyczną.', strengths: ['Intuicja', 'Adaptacja', 'Refleksja'], challenges: ['Zmienność nastrojów', 'Nadmiar wrażeń', 'Trudność ze stałością'], keywords: ['księżyc', 'cykle', 'mistycyzm'], element: 'Woda', dayOfWeek: 'Poniedziałek', crystals: ['🌙 Kamień księżycowy', '⚪ Perła', '💎 Labradoryt'], personality: ['Głęboko intuicyjny i cykliczny jak księżyc', 'Piszesz historię swojego życia w fazie księżyca', 'Twoja wrażliwość jest kompasem'], growthEdges: ['Stałość w codziennej rutynie', 'Zakorzenienie praktyk uziemiających'], harmonyStone: '🌙 Kamień księżycowy — synchronizuje z energiami cyklu', affirmation: 'Płynę z naturalnym rytmem wszechświata, w pełni sobą.', spiritualMeaning: 'Srebro jest wibracyjnym odbiciem Księżyca — wrażliwości, kobiecej mądrości i cyklicznej natury życia. Ta aura pojawia się u osób połączonych z mistyczną tradycją.', howToStrengthen: ['Rytuały księżycowe', 'Kąpiele przy świetle księżyca', 'Noszenie kamienia księżycowego', 'Praca z intuicją cykliczną'], shadows: ['Huśtawki emocjonalne', 'Trudność z konsekwencją', 'Przytłaczająca wrażliwość'] },
  { id: 'rainbow', name: 'Tęczowy', hex: '#FF6B9D', chakra: 'Wszystkie', meaning: 'Wielowymiarowość, misja duszy, kosmiczna świadomość. Tęczowa aura to niezwykle rzadkie zjawisko — osoba taka przynosi na Ziemię wiele kosmicznych energii jednocześnie.', strengths: ['Wielowymiarowość', 'Empatia totalna', 'Dary uzdrowicielskie'], challenges: ['Rozproszenie energii', 'Przeładowanie emocjonalne', 'Trudność ze skupieniem'], keywords: ['tęcza', 'misja', 'wielość'], element: 'Wszystkie', dayOfWeek: 'Wszystkie', crystals: ['🌈 Fluoryt', '✨ Tęczowy Kryształ', '🌟 Labradoryt'], personality: ['Jesteś żywą tęczą wibracji', 'Twoja misja obejmuje wszystkie wymiary', 'Inni czują przy Tobie unikalny spokój i moc'], growthEdges: ['Skupienie i uziemienie swoich darów', 'Nauka priorytetyzacji energii'], harmonyStone: '🌈 Fluoryt — porządkuje wielowymiarową energię i wspiera skupienie', affirmation: 'Jestem pełnym spektrum miłości i mądrości w służbie całości.', spiritualMeaning: 'Tęczowa aura to niezwykły przejaw duszy, która przynosi z sobą dary ze wszystkich warstw istnienia. Zazwyczaj wiąże się z głęboką misją uzdrawiania i transformacji.', howToStrengthen: ['Medytacja z tęczowym kryształem', 'Praca ze wszystkimi czakrami', 'Harmonizacja pola auretycznego', 'Skupienie na jednej misji naraz'], shadows: ['Rozproszenie w wielu kierunkach', 'Trudność z decyzjami', 'Energia zbyt intensywna dla otoczenia'] },
];

const QUIZ_QUESTIONS = [
  { q: 'Jak wchodzisz do nowego miejsca?', opts: [{ t: 'Aktywnie i pewnie', c: ['red', 'orange'] }, { t: 'Z obserwacją i ciekawością', c: ['yellow', 'indigo'] }, { t: 'Spokojnie, badając atmosferę', c: ['blue', 'green'] }, { t: 'Czuję energię przestrzeni', c: ['violet', 'pink'] }, { t: 'Szukam ciszy i spokoju', c: ['gold', 'indigo'] }] },
  { q: 'Co daje Ci najwięcej energii?', opts: [{ t: 'Działanie i wyzwania', c: ['red', 'yellow'] }, { t: 'Tworzenie i ekspresja', c: ['orange', 'pink'] }, { t: 'Pomaganie innym', c: ['green', 'blue'] }, { t: 'Medytacja i refleksja', c: ['indigo', 'violet'] }, { t: 'Głęboka rozmowa', c: ['blue', 'gold'] }] },
  { q: 'Jak reagujesz na konflikt?', opts: [{ t: 'Konfrontuję wprost', c: ['red', 'orange'] }, { t: 'Mediuję i łagodzę', c: ['green', 'blue'] }, { t: 'Analizuję sytuację', c: ['yellow', 'indigo'] }, { t: 'Wycofuję się do wewnątrz', c: ['violet', 'gold'] }, { t: 'Czuję i przeżywam', c: ['pink', 'indigo'] }] },
  { q: 'Jaki element natury przyciąga Cię najbardziej?', opts: [{ t: 'Ogień i słońce', c: ['red', 'yellow', 'orange'] }, { t: 'Woda i morze', c: ['blue', 'indigo'] }, { t: 'Ziemia i las', c: ['green', 'red'] }, { t: 'Powietrze i wiatr', c: ['yellow', 'blue'] }, { t: 'Niebo gwiaździste', c: ['violet', 'gold'] }] },
  { q: 'Co czujesz w tłumie?', opts: [{ t: 'Energię i podniecenie', c: ['red', 'orange'] }, { t: 'Ciekawość obserwatora', c: ['yellow', 'blue'] }, { t: 'Dużo emocji innych', c: ['pink', 'green'] }, { t: 'Overwhelm', c: ['indigo', 'violet'] }, { t: 'Obecność, ale spokój', c: ['gold', 'blue'] }] },
  { q: 'Jak podejmujesz ważne decyzje?', opts: [{ t: 'Intuicyjnie i szybko', c: ['red', 'indigo'] }, { t: 'Analizuję wszystkie opcje', c: ['yellow', 'blue'] }, { t: 'Pytam serce', c: ['pink', 'green'] }, { t: 'Konsultuję z innymi', c: ['orange', 'blue'] }, { t: 'Medytuję lub śnię', c: ['violet', 'gold'] }] },
  { q: 'Jaki kolor mają Twoje sny?', opts: [{ t: 'Intensywne i wyraźne', c: ['red', 'orange'] }, { t: 'Błękitne i spokojne', c: ['blue', 'indigo'] }, { t: 'Zielone i naturalne', c: ['green', 'yellow'] }, { t: 'Fioletowe i mistyczne', c: ['violet', 'gold'] }, { t: 'Różnorodne i emocjonalne', c: ['pink', 'orange'] }] },
  { q: 'Jak inni opisują Twoją energię?', opts: [{ t: 'Silna i inspirująca', c: ['red', 'gold'] }, { t: 'Ciepła i przyjazna', c: ['orange', 'pink'] }, { t: 'Spokojna i niezawodna', c: ['green', 'blue'] }, { t: 'Tajemnicza i głęboka', c: ['indigo', 'violet'] }, { t: 'Twórcza i oryginalna', c: ['yellow', 'orange'] }] },
];

// 7 Auric Body Layers (expanded from 5)
const AURA_LAYERS = [
  { n: 1, name: 'Eteryczny', color: '#94A3B8', chakra: 'Korzenny', desc: 'Najbliżej ciała fizycznego, ok. 2–5 cm od skóry. Odbija zdrowie i witalność — zwykle widoczny jako blada, lekko niebieskawa zarys ciała. Pierwsza warstwa, która reaguje na chorobę lub witalność.', hint: 'Wzmocnij go przez ruch, dotyk ziemi i głęboki oddech.', practice: 'Ćwiczenia fizyczne, joga, spacery boso po trawie' },
  { n: 2, name: 'Emocjonalny', color: '#FB923C', chakra: 'Sakralny', desc: 'Warstwa uczuć — rozciąga się do ok. 7 cm od ciała. Zmienia kolory z każdą emocją: jasne przy radości, ciemne przy lęku. Chaotyczna przy trudnych emocjach, klarowna przy wewnętrznym spokoju.', hint: 'Praca z tą warstwą: dziennik uczuć i oczyszczające rytuały.', practice: 'Terapia, dziennik emocji, płakanie i uwalnianie' },
  { n: 3, name: 'Mentalny', color: '#EAB308', chakra: 'Słoneczny', desc: 'Myśli i przekonania, 7–20 cm od ciała. Żółto-złoty u osób intensywnie myślących. Odzwierciedla jakość wewnętrznego dialogu — przekonania tworzą kolory tej warstwy.', hint: 'Medytacja i uważność kształtują tę warstwę.', practice: 'Medytacja, afirmacje, praca z przekonaniami' },
  { n: 4, name: 'Astralny', color: '#EC4899', chakra: 'Sercowy', desc: 'Most między wymiarem fizycznym a duchowym, ok. 20–30 cm od ciała. Centrum miłości — różowy lub zielony. Wzmacniany przez głębokie połączenia i miłość własną.', hint: 'Wzmacniaj go miłością własną i autentycznymi relacjami.', practice: 'Medytacje miłości, głębokie relacje, kąpiele energetyczne' },
  { n: 5, name: 'Eteryczny Szablon', color: '#3B82F6', chakra: 'Gardłowy', desc: 'Wzorzec całego istnienia na poziomie eteru — 30–45 cm od ciała. Zawiera negatyw Twojego zdrowia i przeznaczenia. Niebiesko-biały, często z geometrycznymi wzorami.', hint: 'Dźwięk, muzyka i mantra oczyszczają tę warstwę.', practice: 'Dźwiękoterpia, śpiew, mantra, ceremonialne rytuały' },
  { n: 6, name: 'Niebiański', color: '#C084FC', chakra: 'Trzecie Oko', desc: 'Warstwa duchowej ekstazy i oświecenia, 45–60 cm od ciała. Przejrzysta i opalizująca — pojawia się w głębokiej medytacji lub modlitwie. Tu odbija się połączenie z wyższą jaźnią.', hint: 'Głęboka medytacja i modlitwa otwierają tę warstwę.', practice: 'Kontemplacja, wizualizacja, praca z wyrocznią' },
  { n: 7, name: 'Ketheric — Kosmiczny', color: '#F59E0B', chakra: 'Koronowy', desc: 'Najbardziej zewnętrzna warstwa, 60–90 cm od ciała. Złoto-biała i złożona z ultrawysokiej wibracji. Zawiera całą historię duszy przez wszystkie wcielenia i połączenie z kosmicznym planem.', hint: 'Praca z akasza kronikami i wzniosłe intencje rozwijają tę warstwę.', practice: 'Medytacja korony, akasza kroniki, głęboka służba' },
];

// Aura cleansing rituals
const CLEANSING_RITUALS = [
  { id: 'smoke', icon: '🌿', name: 'Oczyszczanie Dymem', color: '#A78BFA', duration: '10–15 min', desc: 'Szałwia, palo santo lub kadzidło usuwają energetyczne zanieczyszczenia z pola auretycznego. Dym dociera do każdego zakątka aury, rozpraszając gęste energie.', steps: ['Otwórz okno lub balkon na kilka minut', 'Zapal szałwię lub palo santo', 'Zaczynam od stóp, powoli prowadź dym ku górze', 'Zatocz pełne koło wokół ciała', 'Z intencją: "Uwalniaj wszystko, co nie moje"', 'Na końcu skieruj dym nad głowę i wydmuch z intencją'] },
  { id: 'sound', icon: '🔔', name: 'Oczyszczanie Dźwiękiem', color: '#60A5FA', duration: '5–20 min', desc: 'Misy tybetańskie, gongi lub mantry rozbijają skrzepy energetyczne w polu auretycznym. Wibracja dźwięku przenika przez wszystkie 7 warstw aury.', steps: ['Usiądź spokojnie lub połóż się', 'Zacznij od 3 głębokich oddechów', 'Odtwórz lub zagraj mis tybetańskich na 432 Hz', 'Wyobraź sobie, że wibracja czyści każdą warstwę aury', 'Zakończ ciszą przez 2–3 minuty', 'Podziękuj polu energetycznemu za oczyszczenie'] },
  { id: 'water', icon: '💧', name: 'Rytuał Wody', color: '#22D3EE', duration: '15–20 min', desc: 'Kąpiel lub prysznic z intencją oczyszcza aurę na poziomie emocjonalnym i energetycznym. Woda jest doskonałym nośnikiem intencji uwalniania.', steps: ['Nastawiaj się psychicznie zanim wejdziesz do wody', 'Dodaj sól himalajską lub morską do kąpieli', 'Wyobraź sobie, że woda zmywa gęste energie', 'Deklaracja: "Niech woda oczyszcza moje pole"', 'Wyobraź sobie, że razem z wodą spływa wszystko nieczyste', 'Po kąpieli potrzyj ciało suchym ręcznikiem z intencją uszczelnienia'] },
  { id: 'sunlight', icon: '☀️', name: 'Kąpiel Słoneczna', color: '#F59E0B', duration: '10–30 min', desc: 'Słońce jest najpotężniejszym naturalnym oczyszczaczem aury. Promieniowanie UV niszczy negatywne wzorce energetyczne i doładowuje pole auretyczne złotą energią.', steps: ['Wyjdź na zewnątrz rano (7–10) lub po południu (15–17)', 'Stań lub usiądź twarzą do słońca', 'Wyobraź sobie złote promienie przenikające przez każdą warstwę', 'Otwórz dłonie ku słońcu z intencją przyjęcia', 'Trwaj minimum 10 minut w ciszy', 'Na koniec podziękuj słońcu za dar energii'] },
  { id: 'crystal', icon: '💎', name: 'Siatka Kryształowa', color: '#C084FC', duration: '20–30 min', desc: 'Ułóż kryształy wokół ciała, tworząc pole ochronne i oczyszczające. Selenyt czyści, czarny turmalin chroni, kwarc amplifikuje intencję.', steps: ['Połóż się wygodnie na macie', 'Umieść selenit nad głową, czarny turmalin przy stopach', 'Awenturyn przy sercu, ametyst przy trzecim oku', 'Zamknij oczy i oddychaj głęboko 3 minuty', 'Wyobraź sobie, że kryształy tworzą złotą sieć ochronną', 'Po 15–20 min zbierz kryształy i przeprowadź grounding'] },
];

// Aura protection practices
const PROTECTION_PRACTICES = [
  { id: 'bubble', icon: '🔵', name: 'Bańka Ochronna', color: '#3B82F6', desc: 'Klasyczna technika tworzenia ochronnej sfery energetycznej. Wyobraź sobie sferę z białego lub złotego światła, szczelnie otaczającą Twoje pole auretyczne. Intencja: "Tylko miłość wchodzi, tylko miłość wychodzi."', steps: ['Zamknij oczy i oddychaj spokojnie', 'Wyobraź sobie złote światło w centrum serca', 'Pozwól mu rozszerzać się coraz dalej', 'Tworzy idealna sfera o 1m od ciała', 'Zadeklaruj: "Ta bańka przepuszcza tylko miłość"', 'Możesz ją wzmocnić wizualizując złote zamki'] },
  { id: 'mirror', icon: '🪞', name: 'Lustrzana Tarcza', color: '#6366F1', desc: 'Technika odbijania negatywnych energii i intencji z powrotem do ich źródła. Nie chodzi o rewanż — lustro po prostu neutralnie odbija to, co nie jest Twoje.', steps: ['Wyobraź sobie, że przed Tobą stoi lustro', 'Skieruj je w stronę, skąd przychodzi trudna energia', 'Lustro odbija wszystko — bez osądzania, bez złości', 'Możesz też wizualizować lustro 360° wokół ciała', 'Mantra: "To, co nie moje, wraca do źródła z miłością"', 'Utrzymuj intencję spokojną i neutralną'] },
  { id: 'tree', icon: '🌳', name: 'Drzewo Uziemienia', color: '#22C55E', desc: 'Technika zakorzenienia i ochrony poprzez połączenie z energią Ziemi. Drzewo naturalne filtruje energetyczne toksyny i zasila aurę stabilną, ziemską mocą.', steps: ['Stań boso na trawie lub wyobraź sobie to', 'Z podstawy kręgosłupa wyślij korzenie głęboko w ziemię', 'Poczuj jak Ziemia trzyma Cię mocno', 'Z korony głowy wyśnij gałęzie ku niebu', 'Jesteś mostem między ziemią a niebem', 'Wszelkie trudne energie spływają przez korzenie do ziemi'] },
];

// Aura-Chakra connection map
const AURA_CHAKRA_MAP = [
  { layer: 'Eteryczny', chakra: 'Muladhara', chakraName: 'Korzenny', color: '#EF4444', symbol: '◼', connection: 'Pierwsza warstwa aury bezpośrednio odzwierciedla zdrowie korzeniowe — zakorzenienie, bezpieczeństwo i kondycję fizyczną.' },
  { layer: 'Emocjonalny', chakra: 'Svadhisthana', chakraName: 'Sakralny', color: '#F97316', symbol: '🌊', connection: 'Warstwa emocjonalna aury synchronizuje się z sakralnym centrum — tu mieszkają nieuświadomione emocje i wzorce relacyjne.' },
  { layer: 'Mentalny', chakra: 'Manipura', chakraName: 'Słoneczny splot', color: '#EAB308', symbol: '☀', connection: 'Warstwa mentalna rezonuje z centrum mocy osobistej — myśli i przekonania zabarwiają aurę żółcią lub ją przyciemniają.' },
  { layer: 'Astralny', chakra: 'Anahata', chakraName: 'Sercowy', color: '#22C55E', symbol: '♥', connection: 'Warstwa astralna jest mostem miłości — tu kształtują się wszystkie więzi z innymi ludźmi i naturą.' },
  { layer: 'Eteryczny Szablon', chakra: 'Vishuddha', chakraName: 'Gardłowy', color: '#3B82F6', symbol: '🔵', connection: 'Piąta warstwa przechowuje wzorzec pełni — prawdę o tym, kim jesteś, zanim zostałeś uwarunkowany przez świat.' },
  { layer: 'Niebiański', chakra: 'Ajna', chakraName: 'Trzecie Oko', color: '#6366F1', symbol: '👁', connection: 'Niebiańska warstwa to siedziba jasnowidzenia i połączenia z wyższą jaźnią — tu rodzi się intuicja i duchowe przeczucia.' },
  { layer: 'Ketheric', chakra: 'Sahasrara', chakraName: 'Koronowy', color: '#A855F7', symbol: '✦', connection: 'Najbardziej zewnętrzna warstwa łączy Cię z kosmicznym planem — tu zapisana jest misja Twojej duszy i połączenie z Absolutem.' },
];

// Partner aura compatibility
const AURA_COMPATIBILITY = [
  { a: 'red', b: 'blue', label: 'Czerwony + Niebieski', result: 'Napięcie uzdrawiające', desc: 'Ogień i woda — intensywne przyciąganie połączone z głębokim wyzwaniem. Czerwień aktywizuje, niebieski stabilizuje. Ta para tworzy dynamikę: jeden działa, drugi namyśla. Razem mogą osiągnąć wyjątkową równowagę, jeśli dadzą sobie przestrzeń.', synergy: '🔥💙 Dynamiczna komplementarność', challenge: 'Tempo i potrzeba ciszy', tip: 'Niebieski potrzebuje przestrzeni, czerwony — działania. Szanujcie swoje rytmy.' },
  { a: 'green', b: 'pink', label: 'Zielony + Różowy', result: 'Harmonia serca', desc: 'Dwa odcienie tej samej częstotliwości sercowej. Zielony uzdrawia, różowy kocha — razem tworzą najbardziej harmonijne połączenie energetyczne. Obie aury pracują na poziomie serca, co tworzy głębokie porozumienie.', synergy: '💚💗 Rezonans bezwarunkowej miłości', challenge: 'Oboje mogą zaniedbywać własne potrzeby', tip: 'Pamiętajcie, aby kochać też siebie — nie tylko siebie nawzajem.' },
  { a: 'violet', b: 'indigo', label: 'Fioletowy + Indygo', result: 'Duchowy tandem', desc: 'Dwie mistyczne natury — intuicja spotyka transformację. Razem mogą tworzyć niezwykłą duchową przestrzeń, ale mogą też odlecieć od rzeczywistości. Para o wyjątkowej głębi, ale potrzebuje uziemienia.', synergy: '🔮💜 Kosmiczne porozumienie', challenge: 'Brak zakorzenienia w codzienności', tip: 'Regularne spacery w naturze i wspólne gotowanie pomogą was zakotwiczyć.' },
  { a: 'yellow', b: 'orange', label: 'Żółty + Pomarańczowy', result: 'Kreatywna iskra', desc: 'Umysł spotyka serce twórcy. Żółty analizuje i planuje, pomarańczowy wykonuje z pasją. Ta para tworzy doskonały team — razem mogą realizować projekty twórcze z niespotykaną efektywnością.', synergy: '🟡🟠 Kreatywna synergia', challenge: 'Żółty może hamować, pomarańczowy — przyspieszać', tip: 'Ustalajcie wspólne tempo — żółty daje strukturę, pomarańczowy życie.' },
  { a: 'red', b: 'gold', label: 'Czerwony + Złoto-Biały', result: 'Moc i oświecenie', desc: 'Prymarna siła życia spotyka duchowe oświecenie. Czerwień zakorzeniona w ciele daje złotu dotknięcie ziemi, a złoto unosi czerwień ku wyższemu celowi. Para o wyjątkowym potencjale transformacyjnym.', synergy: '🔴✨ Wcielona boskość', challenge: 'Różne rytmy — złoty potrzebuje ciszy, czerwony — ruchu', tip: 'Medytujcie razem. To spaja wasze energie bez konfliktu.' },
  { a: 'blue', b: 'violet', label: 'Niebieski + Fioletowy', result: 'Mądrość mistyczna', desc: 'Głos prawdy spotyka ducha poszukiwacza. Razem mogą rozmawiać na każdy głęboki temat godzinami. Para filozofów i duchowych badaczy — wspierają się wzajemnie w eksploracji sensu życia.', synergy: '💙💜 Głębia i duchowość', challenge: 'Oboje potrzebują przestrzeni — uważajcie na dystans', tip: 'Ustalajcie rytuały bliskości — głębia łączy was, ale wymaga też obecności.' },
];

// Meditation visualizations per aura color
const AURA_MEDITATIONS: Record<string, { title: string; steps: string[] }> = {
  red: { title: 'Medytacja Ognia', steps: ['Usiądź wygodnie, wyobraź sobie płonący płomień w centrum klatki piersiowej.', 'Poczuj jego ciepło rozchodzące się przez kończyny — moc, która wypełnia Cię od środka.', 'Z każdym wdechem płomień rośnie, staje się głębszą czerwienią.', 'Pozwól mu oczyścić wszystko, co nie służy — gniew zamienia się w determinację.', 'Z wydechem uwalniasz ciepło na zewnątrz — Twoja aura świeci intensywną czerwienią.' ] },
  orange: { title: 'Medytacja Twórczości', steps: ['Zamknij oczy i wyobraź sobie zachód słońca nad spokojnym morzem.', 'Pomarańczowe i złote refleksy tańczą na wodzie — tak wygląda Twoja aura.', 'Poczuj w brzuchu ciepły, twórczy ogień — źródło Twojej ekspresji.', 'Z każdym oddechem radość wypełnia Twoje ciało, otwierając wszystkie blokady.', 'Wyobraź sobie, że Twoje dłonie emitują pomarańczowe światło — gotowe tworzyć.' ] },
  yellow: { title: 'Medytacja Słońca', steps: ['Wyobraź sobie, że stoisz w centrum wielkiego, złotego słońca.', 'Promienie przenikają każdą komórkę Twojego ciała — umysł staje się krystalicznie czysty.', 'Myśli porządkują się jak promienie wychodzące ze środka ku obwodowi.', 'Żółte światło rozjaśnia każdy zakątek umysłu, rozpraszając niepokój.', 'Jesteś inteligentnym, jasnym i spokojnym centrum własnego wszechświata.' ] },
  green: { title: 'Medytacja Lasu', steps: ['Wyobraź sobie, że siedzisz w sercu pradawnego lasu, otoczony zielenią.', 'Korzenie drzew splatają się pod Tobą — jesteś częścią tej sieci życia.', 'Z każdym wdechem absorbujesz uzdrawiającą moc natury — zieleń wypełnia Cię.', 'Poczuj, jak Twoje serce rozszerza się, obejmując miłością wszystkie istoty.', 'Twoja aura świeci głęboką, spokojną zielenią uzdrowiciela.' ] },
  blue: { title: 'Medytacja Głębokiego Oceanu', steps: ['Zanurkuj wyobraźnią w głąb spokojnego, błękitnego oceanu.', 'Woda jest cicha i kryształowo czysta — tak jak Twoja prawda.', 'Z każdym wydechem wypuszczasz bąbelki — każdy niesie słowo, które chciałeś powiedzieć.', 'Błękit otacza Cię ze wszystkich stron, wygładzając napięcie w gardle.', 'Twój głos jest piękny i wolny — niebieska aura promieniuje spokojem.' ] },
  indigo: { title: 'Medytacja Trzeciego Oka', steps: ['Skieruj uwagę na środek czoła — punkt między brwiami.', 'Wyobraź sobie tam głębokoniebieskie, indygowe światło powoli pulsujące.', 'Z każdym oddechem Twoje wewnętrzne oko otwiera się szerzej, wyraźniej.', 'Obrazy, symbole i intuicje zaczynają przepływać — obserwuj je bez oceniania.', 'Jesteś widzącym — Twoja aura indygo rozszerza się na metr wokół Ciebie.' ] },
  violet: { title: 'Medytacja Korony', steps: ['Wyobraź sobie fioletowy kwiat lotosu na czubku Twojej głowy.', 'Powoli otwiera płatki, odsłaniając kanał łączący Cię z kosmosem.', 'Fioletowe i białe światło spływa przez ten kanał, napełniając Cię mądrością.', 'Poczuj się częścią czegoś nieskończenie większego — jesteś wzorcem w kosmicznej tkaninie.', 'Twoja korona świeci, aura wibruje transformacją i oświeceniem.' ] },
  pink: { title: 'Medytacja Miłości', steps: ['Połóż dłonie na sercu i poczuj jego ciepłe bicie.', 'Wyobraź sobie różowe, miękkie światło wypełniające klatkę piersiową.', 'Z każdym wdechem miłość rośnie — do siebie, do innych, do wszystkiego co żyje.', 'Różowe promieniowanie rozszerza się: metr, dwa, dziesięć metrów wokół Ciebie.', 'Jesteś centrum bezwarunkowej miłości — Twoja aura jest darem dla świata.' ] },
  gold: { title: 'Medytacja Czystego Kanału', steps: ['Wyobraź sobie, że jesteś kryształowym naczyniem wypełnionym złotym światłem.', 'To światło przychodzi z góry, przez koronę, przez serce, przez stopy do ziemi.', 'Jesteś mostem: niebo i ziemia spotykają się w Tobie.', 'Złoto-białe promieniowanie oczyszcza każdy fragment Twojej istoty.', 'Kanał jest otwarty — jesteś oświeconym narzędziem miłości i mądrości.' ] },
};

// ── Enhanced 3D AuraOrb with Pan-Tilt + 7 Concentric Oval Rings ───

const AuraOrb = ({ dominantColor }: { dominantColor: string }) => {
  const pulse1 = useSharedValue(0.9);
  const pulse2 = useSharedValue(0.85);
  const pulse3 = useSharedValue(0.95);
  const ring1Rot = useSharedValue(0);
  const ring2Rot = useSharedValue(0);
  const ring3Rot = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    pulse1.value = withRepeat(withSequence(withTiming(1.1, { duration: 2200 }), withTiming(0.9, { duration: 2200 })), -1, false);
    pulse2.value = withRepeat(withSequence(withTiming(1.15, { duration: 3100 }), withTiming(0.85, { duration: 3100 })), -1, false);
    pulse3.value = withRepeat(withSequence(withTiming(1.05, { duration: 1800 }), withTiming(0.95, { duration: 1800 })), -1, false);
    ring1Rot.value = withRepeat(withTiming(360, { duration: 3000, easing: Easing.linear }), -1, false);
    ring2Rot.value = withRepeat(withTiming(-360, { duration: 5000, easing: Easing.linear }), -1, false);
    ring3Rot.value = withRepeat(withTiming(360, { duration: 8000, easing: Easing.linear }), -1, false);
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-20, Math.min(20, e.translationY / 6));
      tiltY.value = Math.max(-20, Math.min(20, e.translationX / 6));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 600 });
      tiltY.value = withTiming(0, { duration: 600 });
    });

  const orbContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));

  const s1 = useAnimatedStyle(() => ({ transform: [{ scale: pulse1.value }], opacity: 0.25 }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ scale: pulse2.value }], opacity: 0.15 }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ scale: pulse3.value }], opacity: 0.40 }));
  const r1Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${ring1Rot.value}deg` }] }));
  const r2Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${ring2Rot.value}deg` }] }));
  const r3Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${ring3Rot.value}deg` }] }));

  const sz = SW * 0.60;
  const cx = sz / 2;
  const cy = sz / 2;

  // 7 concentric oval ring radii and opacities
  const rings7 = [
    { rx: sz * 0.48, ry: sz * 0.38, opacity: 0.12, sw: 1, dash: '2 10' },
    { rx: sz * 0.44, ry: sz * 0.34, opacity: 0.18, sw: 1, dash: '3 8' },
    { rx: sz * 0.40, ry: sz * 0.30, opacity: 0.22, sw: 1.2, dash: '4 8' },
    { rx: sz * 0.35, ry: sz * 0.26, opacity: 0.28, sw: 1.4, dash: '5 7' },
    { rx: sz * 0.29, ry: sz * 0.22, opacity: 0.34, sw: 1.6, dash: '4 6' },
    { rx: sz * 0.22, ry: sz * 0.18, opacity: 0.40, sw: 1.8, dash: '3 5' },
    { rx: sz * 0.16, ry: sz * 0.14, opacity: 0.50, sw: 2, dash: '2 4' },
  ];

  // 12 sparkle particles drifting around outer ring
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const r = i % 2 === 0 ? sz * 0.47 : sz * 0.44;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, size: i % 3 === 0 ? 3.5 : 2 };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ width: sz, height: sz, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: 16 }, orbContainerStyle]}>
        {/* Outer pulse glows */}
        <Animated.View style={[StyleSheet.absoluteFill, s2]}>
          <View style={{ width: sz, height: sz, borderRadius: sz / 2, backgroundColor: dominantColor }} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, s1]}>
          <View style={{ width: sz * 0.75, height: sz * 0.75, borderRadius: sz, backgroundColor: dominantColor, marginTop: sz * 0.125, marginLeft: sz * 0.125 }} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, s3]}>
          <View style={{ width: sz * 0.5, height: sz * 0.5, borderRadius: sz, backgroundColor: dominantColor, marginTop: sz * 0.25, marginLeft: sz * 0.25 }} />
        </Animated.View>

        {/* 7 concentric oval rings (static, depth layers) */}
        <View style={StyleSheet.absoluteFill}>
          <Svg width={sz} height={sz}>
            <Defs>
              <SvgRadialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={dominantColor} stopOpacity="0.7" />
                <Stop offset="60%" stopColor={dominantColor} stopOpacity="0.2" />
                <Stop offset="100%" stopColor={dominantColor} stopOpacity="0" />
              </SvgRadialGradient>
            </Defs>
            {rings7.map((ring, i) => (
              <Ellipse
                key={i}
                cx={cx}
                cy={cy}
                rx={ring.rx}
                ry={ring.ry}
                stroke={dominantColor}
                strokeWidth={ring.sw}
                strokeOpacity={ring.opacity}
                fill="none"
                strokeDasharray={ring.dash}
              />
            ))}
            {/* Radial gradient fill at core */}
            <Circle cx={cx} cy={cy} r={sz * 0.18} fill="url(#orbGrad)" />
          </Svg>
        </View>

        {/* Rotating dashed rings with particles */}
        <Animated.View style={[StyleSheet.absoluteFill, r3Style]}>
          <Svg width={sz} height={sz}>
            <Circle cx={cx} cy={cy} r={sz * 0.47} stroke={dominantColor} strokeWidth={1} strokeOpacity={0.20} fill="none" strokeDasharray="4 12" />
          </Svg>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, r2Style]}>
          <Svg width={sz} height={sz}>
            <Circle cx={cx} cy={cy} r={sz * 0.38} stroke={dominantColor} strokeWidth={1.5} strokeOpacity={0.30} fill="none" strokeDasharray="6 10" />
          </Svg>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, r1Style]}>
          <Svg width={sz} height={sz}>
            <Circle cx={cx} cy={cy} r={sz * 0.30} stroke={dominantColor} strokeWidth={2} strokeOpacity={0.40} fill="none" strokeDasharray="3 6" />
            {particles.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={p.size} fill={dominantColor} fillOpacity={i % 2 === 0 ? 0.85 : 0.5} />
            ))}
          </Svg>
        </Animated.View>

        {/* Core orb */}
        <View style={{ position: 'absolute', width: sz * 0.26, height: sz * 0.26, borderRadius: sz, backgroundColor: dominantColor, opacity: 0.95 }} />
        {/* Inner specular glint */}
        <View style={{ position: 'absolute', width: sz * 0.10, height: sz * 0.06, borderRadius: sz, backgroundColor: '#FFFFFF', opacity: 0.35, top: sz * 0.30, left: sz * 0.34 }} />
      </Animated.View>
    </GestureDetector>
  );
};

// ── Kirlian Photo SVG Simulation ─────────────────────────────────

const KirlianPhoto = ({ mood, color, isLight }: { mood: string; color: string; isLight?: boolean }) => {
  const glow1 = useSharedValue(0.5);
  const glow2 = useSharedValue(0.3);

  useEffect(() => {
    glow1.value = withRepeat(withSequence(withTiming(0.9, { duration: 1800 }), withTiming(0.5, { duration: 1800 })), -1, false);
    glow2.value = withRepeat(withSequence(withTiming(0.6, { duration: 2600 }), withTiming(0.2, { duration: 2600 })), -1, false);
  }, []);

  const g1Style = useAnimatedStyle(() => ({ opacity: glow1.value }));
  const g2Style = useAnimatedStyle(() => ({ opacity: glow2.value }));

  const w = SW - 44;
  const h = 180;
  const cx = w / 2;
  const cy = h / 2;

  // Kirlian-style irregular corona rays
  const rays = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    const r1 = 48 + (i % 5) * 6;
    const r2 = r1 + 20 + (i % 3) * 14;
    return {
      x1: cx + Math.cos(angle) * r1,
      y1: cy + Math.sin(angle) * r1,
      x2: cx + Math.cos(angle) * r2,
      y2: cy + Math.sin(angle) * r2,
    };
  });

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <View style={{ backgroundColor: isLight ? 'rgba(245,235,255,0.92)' : '#050010', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: color + '30' }}>
        <Animated.View style={[StyleSheet.absoluteFill, g2Style, { backgroundColor: color + '08', borderRadius: 18 }]} />
        <Svg width={w} height={h}>
          <Defs>
            <SvgRadialGradient id="kg1" cx="50%" cy="50%" r="40%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.9" />
              <Stop offset="70%" stopColor={color} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={color} stopOpacity="0" />
            </SvgRadialGradient>
            <SvgRadialGradient id="kg2" cx="50%" cy="50%" r="50%">
              <Stop offset="30%" stopColor="transparent" stopOpacity="0" />
              <Stop offset="80%" stopColor={color} stopOpacity="0.15" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </SvgRadialGradient>
          </Defs>
          {/* Background glow */}
          <Circle cx={cx} cy={cy} r={h * 0.72} fill="url(#kg2)" />
          {/* Corona rays */}
          {rays.map((r, i) => (
            <Line
              key={i}
              x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
              stroke={color}
              strokeWidth={i % 4 === 0 ? 2.5 : 1}
              strokeOpacity={i % 3 === 0 ? 0.8 : 0.4}
            />
          ))}
          {/* Silhouette oval */}
          <Ellipse cx={cx} cy={cy} rx={44} ry={62} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1} strokeOpacity={0.6} />
          {/* Core glow */}
          <Circle cx={cx} cy={cy} r={32} fill="url(#kg1)" />
          {/* Inner body silhouette */}
          <Ellipse cx={cx} cy={cy} rx={20} ry={30} fill="#050010" fillOpacity={0.85} />
          {/* Head */}
          <Circle cx={cx} cy={cy - 44} r={16} fill="#050010" fillOpacity={0.85} stroke={color} strokeWidth={0.5} strokeOpacity={0.4} />
        </Svg>
        <Animated.View style={[{ position: 'absolute', bottom: 10, left: 0, right: 0, alignItems: 'center' }, g1Style]}>
          <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: color }}>FOTOGRAFIA KIRLIAŃSKA</Text>
        </Animated.View>
      </View>
      <Text style={{ fontSize: 11, color: color + 'AA', marginTop: 8, textAlign: 'center' }}>Nastrój: {mood || 'neutralny'} · Symulacja energetyczna</Text>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────

type TabId = 'quiz' | 'kolory' | 'warstwy' | 'dziennik' | 'kombinacje' | 'ochrona' | 'oczyszczanie';

interface DayEntry { dateStr: string; colorId: string; }
interface ReadingHistory { date: string; colorId: string; summary: string; }

const DAYS_PL = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];

function getDayLabel(date: Date): string {
  return DAYS_PL[date.getDay()];
}

function getDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getLast7Days(): Array<{ date: Date; dateStr: string; label: string; dayNum: number }> {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ date: d, dateStr: getDateStr(d), label: getDayLabel(d), dayNum: d.getDate() });
  }
  return days;
}

export const AuraReadingScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
  const accent = '#C084FC';
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';
  const divider = isLight ? 'rgba(255,246,230,0.92)' : 'rgba(255,255,255,0.06)';

  const [activeTab, setActiveTab] = useState<TabId>('quiz');
  const [quizStep, setQuizStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [quizDone, setQuizDone] = useState(false);
  const [aiReading, setAiReading] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState<typeof AURA_COLORS[0] | null>(null);
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null);
  const [expandedCleansingRitual, setExpandedCleansingRitual] = useState<string | null>(null);
  const [expandedProtection, setExpandedProtection] = useState<string | null>(null);
  const [expandedCompatibility, setExpandedCompatibility] = useState<number | null>(null);

  // Kirlian / mood state
  const [kirlianMood, setKirlianMood] = useState('');
  const [showKirlian, setShowKirlian] = useState(false);

  // Partner aura compatibility
  const [partnerColorA, setPartnerColorA] = useState<string>('');
  const [partnerColorB, setPartnerColorB] = useState<string>('');

  // Dziennik state
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const last7Days = useMemo(() => getLast7Days(), []);
  const todayStr = getDateStr(new Date());
  const todayEntry = dayEntries.find(e => e.dateStr === todayStr);
  const todayColor = todayEntry ? AURA_COLORS.find(c => c.id === todayEntry.colorId) : null;
  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < last7Days.length; i++) {
      const d = last7Days[last7Days.length - 1 - i];
      if (dayEntries.find(e => e.dateStr === d.dateStr)) count++;
      else break;
    }
    return count;
  }, [dayEntries, last7Days]);

  const [readingHistory, setReadingHistory] = useState<ReadingHistory[]>([]);

  const dominantAura = useMemo(() => {
    if (!quizDone) return AURA_COLORS[6];
    let best = AURA_COLORS[0];
    let bestScore = 0;
    AURA_COLORS.forEach(c => { if ((scores[c.id] || 0) > bestScore) { bestScore = scores[c.id] || 0; best = c; } });
    return best;
  }, [scores, quizDone]);

  const handleAnswer = (colors: string[]) => {
    HapticsService.impact('light');
    const newScores = { ...scores };
    colors.forEach(c => { newScores[c] = (newScores[c] || 0) + 1; });
    setScores(newScores);
    if (quizStep >= QUIZ_QUESTIONS.length - 1) setQuizDone(true);
    else setQuizStep(quizStep + 1);
  };

  const resetQuiz = () => { setScores({}); setQuizStep(0); setQuizDone(false); setAiReading(''); };

  const generateAiReading = async () => {
    setAiLoading(true);
    try {
      const zodiac = userData?.zodiacSign || 'nieznany';
      const name = userData?.name || 'przyjacielu';
      const res = await AiService.chatWithOracle([{
        role: 'user',
        content: `Napisz głębokie, spersonalizowane czytanie aury w języku użytkownika dla ${name} (zodiak: ${zodiac}) o dominującej aurze ${dominantAura.name}. Uwzględnij: ich mocne strony (${dominantAura.strengths.join(', ')}), wyzwania (${dominantAura.challenges.join(', ')}), chakrę (${dominantAura.chakra}), żywioł (${dominantAura.element}). Odwołaj się do duchowego znaczenia: "${dominantAura.spiritualMeaning}". Napisz 5–6 zdań w stylu mistycznym i poetyckim. Bez markdown. Zaadresuj bezpośrednio do ${name}.`,
      }]);
      setAiReading(res);
      const summary = res.split('.')[0] + '.';
      const now = new Date();
      const dateLabel = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
      setReadingHistory(prev => [{ date: dateLabel, colorId: dominantAura.id, summary }, ...prev].slice(0, 3));
    } catch {
      const fallback = `Twoja ${dominantAura.name.toLowerCase()} aura mówi o ${dominantAura.keywords[0]} i ${dominantAura.keywords[1]}. Jest w niej siła ${dominantAura.strengths[0].toLowerCase()} i dar ${dominantAura.strengths[1].toLowerCase()}. Wyzwanie to praca z ${dominantAura.challenges[0].toLowerCase()}.`;
      setAiReading(fallback);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSetTodayAura = (colorId: string) => {
    HapticsService.impact('light');
    setDayEntries(prev => {
      const filtered = prev.filter(e => e.dateStr !== todayStr);
      return [...filtered, { dateStr: todayStr, colorId }];
    });
    setShowColorPicker(false);
  };

  // Find compatibility result for selected partner colors
  const compatResult = useMemo(() => {
    if (!partnerColorA || !partnerColorB) return null;
    return AURA_COMPATIBILITY.find(
      c => (c.a === partnerColorA && c.b === partnerColorB) || (c.a === partnerColorB && c.b === partnerColorA)
    ) || null;
  }, [partnerColorA, partnerColorB]);

  const TABS: Array<{ id: TabId; label: string; icon: any }> = [
    { id: 'quiz', label: 'Quiz', icon: Eye },
    { id: 'kolory', label: 'Kolory', icon: Sparkles },
    { id: 'warstwy', label: 'Warstwy', icon: Layers },
    { id: 'dziennik', label: 'Dziennik', icon: Calendar },
    { id: 'kombinacje', label: 'Łączenia', icon: Gem },
    { id: 'oczyszczanie', label: 'Rytuały', icon: Droplets },
    { id: 'ochrona', label: 'Ochrona', icon: Shield },
  ];

  return (
    <View style={[ar.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient colors={isLight ? ['#FDF0FF', '#F5E8FF', '#EDE0FA'] : ['#0A050F', '#110820', '#0F0619']} style={StyleSheet.absoluteFill} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={ar.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} hitSlop={14}>
            <ChevronLeft color={accent} size={22} strokeWidth={1.8} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: accent }}>CZYTANIE AURY</Text>
            <Text style={{ fontSize: 13, color: subColor, marginTop: 2 }}>Pole energetyczne i jego kolory</Text>
          </View>
          <Pressable onPress={() => { if (isFavoriteItem('aura_reading')) { removeFavoriteItem('aura_reading'); } else { addFavoriteItem({ id: 'aura_reading', label: 'Czytanie Aury', route: 'AuraReading', params: {}, icon: 'Eye', color: accent, addedAt: new Date().toISOString() }); } }} hitSlop={14}>
            <Star color={isFavoriteItem('aura_reading') ? accent : accent + '66'} size={18} strokeWidth={1.8} fill={isFavoriteItem('aura_reading') ? accent : 'none'} />
          </Pressable>
        </View>

        {/* Tab Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 4 }} style={{ flexGrow: 0, marginBottom: 6 }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <Pressable key={t.id} onPress={() => { setActiveTab(t.id); HapticsService.impact('light'); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, backgroundColor: isActive ? accent + '18' : 'transparent', borderColor: isActive ? accent : cardBorder }}>
                <Icon color={isActive ? accent : subColor} size={13} strokeWidth={isActive ? 2.2 : 1.8} />
                <Text style={{ fontSize: 12, fontWeight: isActive ? '700' : '500', color: isActive ? accent : subColor }}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
          keyboardVerticalOffset={insets.top + 56}
        >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') + 20 }}>

          {/* ── QUIZ TAB ── */}
          {activeTab === 'quiz' && (
            <>
              <AuraOrb dominantColor={dominantAura.hex} />
              <Text style={{ fontSize: 10, color: subColor, textAlign: 'center', marginBottom: 16, marginTop: -8 }}>Przesuń kulę aby zobaczyć głębię</Text>

              {!quizDone ? (
                <Animated.View key={quizStep} entering={FadeInDown.duration(350)}>
                  <View style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent }}>PYTANIE {quizStep + 1} / {QUIZ_QUESTIONS.length}</Text>
                      <Text style={{ fontSize: 11, color: subColor }}>{Math.round(((quizStep) / QUIZ_QUESTIONS.length) * 100)}%</Text>
                    </View>
                    <View style={{ height: 4, backgroundColor: cardBorder, borderRadius: 2 }}>
                      <View style={{ height: 4, width: `${((quizStep) / QUIZ_QUESTIONS.length) * 100}%`, backgroundColor: accent, borderRadius: 2 }} />
                    </View>
                  </View>
                  <View style={{ padding: 20, borderRadius: 20, borderWidth: 1, borderColor: accent + '30', backgroundColor: cardBg, marginBottom: 16 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: textColor, textAlign: 'center', lineHeight: 26 }}>{QUIZ_QUESTIONS[quizStep].q}</Text>
                  </View>
                  {QUIZ_QUESTIONS[quizStep].opts.map((opt, i) => (
                    <Pressable key={i} onPress={() => handleAnswer(opt.c)} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: cardBorder, backgroundColor: cardBg, marginBottom: 8 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: accent + '18', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: accent }}>{String.fromCharCode(65 + i)}</Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, color: textColor }}>{opt.t}</Text>
                    </Pressable>
                  ))}
                </Animated.View>
              ) : (
                <Animated.View entering={FadeInDown.duration(480)}>
                  <LinearGradient colors={[dominantAura.hex + '28', dominantAura.hex + '10', 'transparent']} style={{ borderRadius: 22, padding: 22, borderWidth: 1, borderColor: dominantAura.hex + '50', marginBottom: 16 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: dominantAura.hex, marginBottom: 10 }}>TWOJA DOMINUJĄCA AURA</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: dominantAura.hex + '40', borderWidth: 2, borderColor: dominantAura.hex }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 26, fontWeight: '700', color: dominantAura.hex }}>{dominantAura.name}</Text>
                        <Text style={{ fontSize: 13, color: subColor }}>{dominantAura.chakra} · {dominantAura.keywords.join(' · ')}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 14, lineHeight: 22, color: textColor, marginBottom: 16 }}>{dominantAura.meaning}</Text>

                    {/* Spiritual meaning */}
                    <View style={{ padding: 14, borderRadius: 14, backgroundColor: dominantAura.hex + '12', borderWidth: 1, borderColor: dominantAura.hex + '25', marginBottom: 14 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: dominantAura.hex, marginBottom: 6 }}>ZNACZENIE DUCHOWE</Text>
                      <Text style={{ fontSize: 13, lineHeight: 20, color: textColor, fontStyle: 'italic' }}>{dominantAura.spiritualMeaning}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      {dominantAura.strengths.map(s => (
                        <View key={s} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: '#22C55E20', borderWidth: 1, borderColor: '#22C55E40' }}>
                          <Text style={{ fontSize: 12, color: '#22C55E', fontWeight: '600' }}>✓ {s}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      {dominantAura.challenges.map(c => (
                        <View key={c} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: '#F9731620', borderWidth: 1, borderColor: '#F9731640' }}>
                          <Text style={{ fontSize: 12, color: '#F97316', fontWeight: '600' }}>⚠ {c}</Text>
                        </View>
                      ))}
                    </View>
                  </LinearGradient>

                  {/* How to strengthen */}
                  <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ padding: 18, borderRadius: 18, borderWidth: 1, borderColor: dominantAura.hex + '35', backgroundColor: dominantAura.hex + '07', marginBottom: 14 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: dominantAura.hex, marginBottom: 10 }}>JAK WZMOCNIĆ AURĘ</Text>
                    {dominantAura.howToStrengthen?.map((tip, i) => (
                      <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                        <Text style={{ color: dominantAura.hex, fontSize: 14 }}>✦</Text>
                        <Text style={{ flex: 1, fontSize: 13, lineHeight: 20, color: textColor }}>{tip}</Text>
                      </View>
                    ))}
                  </Animated.View>

                  {/* Shadows section */}
                  <Animated.View entering={FadeInDown.delay(150).duration(400)} style={{ padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#F9731630', backgroundColor: '#F9731608', marginBottom: 14 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#F97316', marginBottom: 10 }}>CIEŃ AURY — OBSZARY DO PRACY</Text>
                    {dominantAura.shadows?.map((shadow, i) => (
                      <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                        <Text style={{ color: '#F97316', fontSize: 14 }}>◐</Text>
                        <Text style={{ flex: 1, fontSize: 13, lineHeight: 20, color: textColor }}>{shadow}</Text>
                      </View>
                    ))}
                  </Animated.View>

                  {aiReading ? (
                    <Animated.View entering={FadeInDown.delay(180).duration(400)} style={{ padding: 18, borderRadius: 18, borderWidth: 1, borderColor: accent + '30', backgroundColor: cardBg, marginBottom: 14 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 10 }}>✦ ODCZYT AURETYCZNY AI</Text>
                      <Text style={{ fontSize: 14, lineHeight: 24, color: textColor, fontStyle: 'italic' }}>{aiReading}</Text>
                    </Animated.View>
                  ) : (
                    <Pressable onPress={generateAiReading} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: accent + '40', backgroundColor: accent + '10', marginBottom: 14 }}>
                      {aiLoading ? <Text style={{ color: accent }}>Wczytywanie odczytu...</Text> : <><Eye color={accent} size={17} strokeWidth={1.8} /><Text style={{ fontSize: 15, fontWeight: '700', color: accent }}>Zinterpretuj aurę z AI</Text></>}
                    </Pressable>
                  )}

                  {/* Aura Meditation Card */}
                  {(() => {
                    const med = AURA_MEDITATIONS[dominantAura.id];
                    if (!med) return null;
                    return (
                      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ padding: 18, borderRadius: 18, borderWidth: 1, borderColor: dominantAura.hex + '40', backgroundColor: dominantAura.hex + '08', marginBottom: 14 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: dominantAura.hex, marginBottom: 10 }}>✦ MEDYTACJA AURY</Text>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, marginBottom: 12 }}>{med.title}</Text>
                        {med.steps.map((step, i) => (
                          <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: dominantAura.hex + '25', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: dominantAura.hex }}>{i + 1}</Text>
                            </View>
                            <Text style={{ flex: 1, fontSize: 13, lineHeight: 20, color: textColor }}>{step}</Text>
                          </View>
                        ))}
                        <Pressable onPress={() => { HapticsService.impact('light'); navigation.navigate('Meditation'); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: dominantAura.hex + '20', borderWidth: 1, borderColor: dominantAura.hex + '40' }}>
                          <Brain color={dominantAura.hex} size={15} strokeWidth={1.8} />
                          <Text style={{ fontSize: 14, fontWeight: '700', color: dominantAura.hex }}>Zacznij medytację</Text>
                        </Pressable>
                      </Animated.View>
                    );
                  })()}

                  {/* Reading History */}
                  {readingHistory.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ padding: 18, borderRadius: 18, borderWidth: 1, borderColor: cardBorder, backgroundColor: cardBg, marginBottom: 14 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: accent, marginBottom: 12 }}>HISTORIA ODCZYTÓW</Text>
                      {readingHistory.map((entry, i) => {
                        const c = AURA_COLORS.find(ac => ac.id === entry.colorId);
                        return (
                          <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: i < readingHistory.length - 1 ? 12 : 0, paddingBottom: i < readingHistory.length - 1 ? 12 : 0, borderBottomWidth: i < readingHistory.length - 1 ? 1 : 0, borderBottomColor: divider }}>
                            <View style={{ width: 4, borderRadius: 2, backgroundColor: c?.hex || accent, height: '100%', minHeight: 36, marginTop: 2 }} />
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Text style={{ fontSize: 11, color: subColor }}>{entry.date}</Text>
                                {c && <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: c.hex + '25' }}><Text style={{ fontSize: 10, fontWeight: '700', color: c.hex }}>{c.name}</Text></View>}
                              </View>
                              <Text style={{ fontSize: 13, lineHeight: 19, color: textColor, fontStyle: 'italic' }} numberOfLines={2}>{entry.summary}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </Animated.View>
                  )}

                  <Pressable onPress={resetQuiz} style={{ alignItems: 'center', paddingVertical: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <RefreshCw color={subColor} size={13} strokeWidth={1.8} />
                      <Text style={{ fontSize: 13, color: subColor }}>Resetuj quiz</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              )}
            </>
          )}

          {/* ── KOLORY TAB — Aura Color Encyclopedia ── */}
          {activeTab === 'kolory' && (
            <>
              <Animated.View entering={FadeInDown.duration(350)} style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 4 }}>ENCYKLOPEDIA KOLORÓW AURY</Text>
                <Text style={{ fontSize: 13, color: subColor, lineHeight: 20, marginBottom: 14 }}>Każdy kolor aury niesie unikalną wibrację i opowieść duszy. Dotknij koloru, aby zgłębić jego pełne znaczenie.</Text>
                {AURA_COLORS.map((c, i) => {
                  const isDominant = quizDone && c.id === dominantAura.id;
                  return (
                    <Pressable key={c.id} onPress={() => { setSelectedColor(c); HapticsService.impact('light'); }}>
                      <Animated.View entering={FadeInDown.delay(i * 40).duration(350)} style={{ padding: 14, borderRadius: 16, borderWidth: 1, borderColor: isDominant ? c.hex + '60' : cardBorder, backgroundColor: isDominant ? c.hex + '10' : cardBg, marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.hex + '30', borderWidth: 2, borderColor: c.hex }} />
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>{c.name}</Text>
                              {isDominant && <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: c.hex + '25' }}><Text style={{ fontSize: 10, fontWeight: '700', color: c.hex }}>TWOJA AURA</Text></View>}
                            </View>
                            <Text style={{ fontSize: 12, color: subColor }}>{c.chakra} · {c.keywords.join(', ')}</Text>
                          </View>
                          <ArrowRight color={subColor} size={14} />
                        </View>
                        {/* Preview traits */}
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                          {c.strengths.map(s => (
                            <View key={s} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: c.hex + '15' }}>
                              <Text style={{ fontSize: 11, color: c.hex, fontWeight: '600' }}>{s}</Text>
                            </View>
                          ))}
                        </View>
                      </Animated.View>
                    </Pressable>
                  );
                })}
              </Animated.View>
            </>
          )}

          {/* ── WARSTWY TAB — 7 Auric Bodies + Aura-Chakra Map ── */}
          {activeTab === 'warstwy' && (
            <>
              <Animated.View entering={FadeInDown.duration(350)}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 4 }}>7 CIAŁ AURETYCZNYCH</Text>
                <Text style={{ fontSize: 13, lineHeight: 20, color: subColor, marginBottom: 16 }}>Każdy człowiek otoczony jest siedmiowarstwowym polem energetycznym. Każda warstwa przechowuje inny wymiar Twojego istnienia. Dotknij warstwy, aby rozwinąć szczegóły.</Text>

                {AURA_LAYERS.map((layer, i) => {
                  const isExpanded = expandedLayer === layer.n;
                  return (
                    <Animated.View key={layer.n} entering={FadeInDown.delay(i * 60).duration(400)}>
                      <Pressable
                        onPress={() => { setExpandedLayer(isExpanded ? null : layer.n); HapticsService.impact('light'); }}
                        style={{ padding: 18, borderRadius: 18, borderWidth: 1, borderColor: isExpanded ? layer.color + '50' : cardBorder, backgroundColor: isExpanded ? layer.color + '08' : cardBg, marginBottom: 10 }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: layer.color + '25', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: layer.color + '60' }}>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: layer.color }}>{layer.n}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>{layer.name}</Text>
                            <Text style={{ fontSize: 11, color: subColor }}>Czakra: {layer.chakra}</Text>
                          </View>
                          <Text style={{ fontSize: 16, color: subColor }}>{isExpanded ? '▲' : '▼'}</Text>
                        </View>
                        {isExpanded && (
                          <Animated.View entering={FadeInDown.duration(280)} style={{ marginTop: 14 }}>
                            <Text style={{ fontSize: 14, lineHeight: 22, color: textColor, marginBottom: 10 }}>{layer.desc}</Text>
                            <View style={{ height: 1, backgroundColor: divider, marginBottom: 10 }} />
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                              <Zap color={layer.color} size={13} strokeWidth={1.8} style={{ marginTop: 2 }} />
                              <Text style={{ flex: 1, fontSize: 12, lineHeight: 18, color: layer.color, fontStyle: 'italic' }}>{layer.hint}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                              <CheckCircle color={accent} size={13} strokeWidth={1.8} style={{ marginTop: 2 }} />
                              <Text style={{ flex: 1, fontSize: 12, lineHeight: 18, color: subColor }}>{layer.practice}</Text>
                            </View>
                          </Animated.View>
                        )}
                      </Pressable>
                    </Animated.View>
                  );
                })}

                {/* Aura-Chakra Connection Map */}
                <View style={{ height: 1, backgroundColor: divider, marginVertical: 20 }} />
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 4 }}>✦ MAPA POŁĄCZEŃ: AURA — CZAKRY</Text>
                <Text style={{ fontSize: 13, color: subColor, lineHeight: 20, marginBottom: 14 }}>Każda warstwa auretyczna rezonuje z odpowiadającą jej czakrą — to kosmologiczny tandem, który kształtuje Twoje doświadczenie.</Text>
                {AURA_CHAKRA_MAP.map((item, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(i * 50).duration(380)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: item.color + '30', backgroundColor: item.color + '07', marginBottom: 8 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: item.color + '25', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: item.color + '50' }}>
                      <Text style={{ fontSize: 16 }}>{item.symbol}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: item.color }}>{item.layer}</Text>
                        <Text style={{ fontSize: 11, color: subColor }}>↔</Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>{item.chakraName}</Text>
                      </View>
                      <Text style={{ fontSize: 12, lineHeight: 18, color: subColor }}>{item.connection}</Text>
                    </View>
                  </Animated.View>
                ))}
              </Animated.View>
            </>
          )}

          {/* ── DZIENNIK TAB ── */}
          {activeTab === 'dziennik' && (
            <Animated.View entering={FadeInDown.duration(350)}>
              {/* Streak banner */}
              <LinearGradient colors={[accent + '22', accent + '08']} style={{ borderRadius: 18, padding: 18, borderWidth: 1, borderColor: accent + '35', marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: accent + '22', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap color={accent} size={22} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: accent }}>{streak} {streak === 1 ? 'dzień' : 'dni'} z rzędu</Text>
                  <Text style={{ fontSize: 13, color: subColor, marginTop: 2 }}>Śledź swoją aurę każdego dnia</Text>
                </View>
              </LinearGradient>

              {/* 7-day calendar strip */}
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 10 }}>OSTATNIE 7 DNI</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, justifyContent: 'space-between' }}>
                {last7Days.map((day) => {
                  const entry = dayEntries.find(e => e.dateStr === day.dateStr);
                  const c = entry ? AURA_COLORS.find(ac => ac.id === entry.colorId) : null;
                  const isToday = day.dateStr === todayStr;
                  return (
                    <View key={day.dateStr} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: isToday ? accent : subColor }}>{day.label}</Text>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c ? c.hex + '35' : cardBg, borderWidth: isToday ? 2 : 1, borderColor: isToday ? accent : c ? c.hex + '60' : cardBorder, alignItems: 'center', justifyContent: 'center' }}>
                        {c ? <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: c.hex }} /> : <Text style={{ fontSize: 9, color: subColor }}>{day.dayNum}</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Kirlian photo simulation */}
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 12 }}>✦ SYMULACJA FOTOGRAFII KIRLIAŃSKIEJ</Text>
              <Text style={{ fontSize: 13, color: subColor, lineHeight: 20, marginBottom: 12 }}>Wpisz swój nastrój i wygeneruj symulację zdjęcia energetycznego swojej aury.</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <TextInput
                  value={kirlianMood}
                  onChangeText={setKirlianMood}
                  placeholder="np. spokojny, podniecony, zmęczony..."
                  placeholderTextColor={subColor + '80'}
                  style={{ flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: cardBorder, backgroundColor: cardBg, color: textColor, fontSize: 13 }}
                />
                <Pressable onPress={() => { setShowKirlian(true); HapticsService.impact('medium'); }} style={{ paddingHorizontal: 16, borderRadius: 12, backgroundColor: accent + '20', borderWidth: 1, borderColor: accent + '50', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye color={accent} size={18} strokeWidth={1.8} />
                </Pressable>
              </View>
              {showKirlian && <KirlianPhoto mood={kirlianMood} color={todayColor?.hex || accent} isLight={isLight} />}

              {/* Today's aura */}
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 12, marginTop: 14 }}>DZISIEJSZA AURA</Text>
              {todayColor ? (
                <View style={{ padding: 18, borderRadius: 18, borderWidth: 1, borderColor: todayColor.hex + '50', backgroundColor: todayColor.hex + '10', marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: todayColor.hex + '40', borderWidth: 2, borderColor: todayColor.hex }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: todayColor.hex }}>Dziś: {todayColor.name}</Text>
                    <Text style={{ fontSize: 12, color: subColor }}>{todayColor.chakra} · {todayColor.element}</Text>
                    <Text style={{ fontSize: 12, color: subColor, marginTop: 2, fontStyle: 'italic' }}>{todayColor.affirmation}</Text>
                  </View>
                  <Pressable onPress={() => setShowColorPicker(true)} hitSlop={10}>
                    <RefreshCw color={subColor} size={16} strokeWidth={1.8} />
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => setShowColorPicker(true)} style={{ padding: 18, borderRadius: 18, borderWidth: 1, borderColor: accent + '40', backgroundColor: accent + '08', marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <Calendar color={accent} size={16} strokeWidth={1.8} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: accent }}>Ustaw aurę dnia</Text>
                </Pressable>
              )}

              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: subColor, marginBottom: 10 }}>WYBIERZ KOLOR</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                {AURA_COLORS.map(c => {
                  const isSelected = todayEntry?.colorId === c.id;
                  return (
                    <Pressable key={c.id} onPress={() => handleSetTodayAura(c.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, borderColor: isSelected ? c.hex : c.hex + '50', backgroundColor: isSelected ? c.hex + '25' : c.hex + '10' }}>
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.hex }} />
                      <Text style={{ fontSize: 12, fontWeight: isSelected ? '700' : '500', color: isSelected ? c.hex : textColor }}>{c.name}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {dayEntries.length > 0 && (
                <>
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 12 }}>ZAPISANE OBSERWACJE</Text>
                  {[...dayEntries].reverse().map((entry, i) => {
                    const c = AURA_COLORS.find(ac => ac.id === entry.colorId);
                    if (!c) return null;
                    const d = new Date(entry.dateStr);
                    const label = `${d.getDate()}.${d.getMonth() + 1}`;
                    return (
                      <View key={entry.dateStr} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: c.hex + '35', backgroundColor: c.hex + '08', marginBottom: 8 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.hex + '30', borderWidth: 2, borderColor: c.hex }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: c.hex }}>{c.name}</Text>
                          <Text style={{ fontSize: 12, color: subColor }}>{label} · {c.element} · {c.chakra}</Text>
                        </View>
                        <Text style={{ fontSize: 11, color: subColor }}>{getDayLabel(d)}</Text>
                      </View>
                    );
                  })}
                </>
              )}
            </Animated.View>
          )}

          {/* ── KOMBINACJE TAB — Crystals + Days + Elements + Partner ── */}
          {activeTab === 'kombinacje' && (
            <Animated.View entering={FadeInDown.duration(350)}>
              {/* Aura + Crystal */}
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 4 }}>✦ AURA + KRYSZTAŁ</Text>
              <Text style={{ fontSize: 13, color: subColor, lineHeight: 20, marginBottom: 14 }}>Każda aura rezonuje z konkretnymi kryształami, które wzmacniają jej naturalne właściwości.</Text>
              {AURA_COLORS.map((c, i) => (
                <Animated.View key={c.id} entering={FadeInDown.delay(i * 35).duration(350)} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: c.hex }} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{c.name}</Text>
                    <Text style={{ fontSize: 11, color: subColor, flex: 1 }}>— {c.harmonyStone.split('—')[0]?.trim()}</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {c.crystals.map((crystal, ci) => (
                      <View key={ci} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: c.hex + '50', backgroundColor: c.hex + '12' }}>
                        <Text style={{ fontSize: 13, color: c.hex, fontWeight: '600' }}>{crystal}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </Animated.View>
              ))}

              <View style={{ height: 1, backgroundColor: divider, marginVertical: 20 }} />

              {/* Partner Aura Compatibility */}
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 4 }}>✦ ZGODNOŚĆ AUR PARTNERÓW</Text>
              <Text style={{ fontSize: 13, color: subColor, lineHeight: 20, marginBottom: 14 }}>Co się dzieje gdy dwie aury spotkają się? Wybierz dwa kolory i odkryj ich energetyczną dynamikę.</Text>

              <Text style={{ fontSize: 11, color: subColor, marginBottom: 8 }}>PIERWSZA AURA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
                {AURA_COLORS.map(c => (
                  <Pressable key={c.id} onPress={() => { setPartnerColorA(c.id); HapticsService.impact('light'); }} style={{ alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: partnerColorA === c.id ? c.hex : c.hex + '40', backgroundColor: partnerColorA === c.id ? c.hex + '25' : c.hex + '08' }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.hex }} />
                    <Text style={{ fontSize: 11, fontWeight: partnerColorA === c.id ? '700' : '500', color: c.hex }}>{c.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={{ fontSize: 11, color: subColor, marginBottom: 8 }}>DRUGA AURA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
                {AURA_COLORS.map(c => (
                  <Pressable key={c.id} onPress={() => { setPartnerColorB(c.id); HapticsService.impact('light'); }} style={{ alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: partnerColorB === c.id ? c.hex : c.hex + '40', backgroundColor: partnerColorB === c.id ? c.hex + '25' : c.hex + '08' }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.hex }} />
                    <Text style={{ fontSize: 11, fontWeight: partnerColorB === c.id ? '700' : '500', color: c.hex }}>{c.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {partnerColorA && partnerColorB && (
                <Animated.View entering={FadeInDown.duration(380)}>
                  {compatResult ? (
                    <LinearGradient
                      colors={[AURA_COLORS.find(c => c.id === partnerColorA)?.hex + '20' || '#80808020', AURA_COLORS.find(c => c.id === partnerColorB)?.hex + '20' || '#80808020']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 20, padding: 20, borderWidth: 1, borderColor: accent + '30', marginBottom: 14 }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 6 }}>WYNIK ZGODNOŚCI</Text>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: 4 }}>{compatResult.label}</Text>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: accent, marginBottom: 12 }}>{compatResult.result}</Text>
                      <Text style={{ fontSize: 13, lineHeight: 21, color: textColor, marginBottom: 12 }}>{compatResult.desc}</Text>
                      <View style={{ padding: 12, borderRadius: 12, backgroundColor: accent + '12', borderWidth: 1, borderColor: accent + '30', marginBottom: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: accent, marginBottom: 4 }}>✦ SYNERGIA</Text>
                        <Text style={{ fontSize: 13, color: textColor }}>{compatResult.synergy}</Text>
                      </View>
                      <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#F9731612', borderWidth: 1, borderColor: '#F9731630', marginBottom: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#F97316', marginBottom: 4 }}>⚠ WYZWANIE</Text>
                        <Text style={{ fontSize: 13, color: textColor }}>{compatResult.challenge}</Text>
                      </View>
                      <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#22C55E12', borderWidth: 1, borderColor: '#22C55E30' }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#22C55E', marginBottom: 4 }}>💡 WSKAZÓWKA</Text>
                        <Text style={{ fontSize: 13, color: textColor }}>{compatResult.tip}</Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={{ padding: 18, borderRadius: 18, borderWidth: 1, borderColor: accent + '30', backgroundColor: cardBg, marginBottom: 14, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: textColor, textAlign: 'center', lineHeight: 22 }}>Interesująca kombinacja! Aury {AURA_COLORS.find(c => c.id === partnerColorA)?.name} i {AURA_COLORS.find(c => c.id === partnerColorB)?.name} tworzą unikalny taniec energetyczny — pełen możliwości wzajemnego uczenia się.</Text>
                    </View>
                  )}
                </Animated.View>
              )}

              <View style={{ height: 1, backgroundColor: divider, marginVertical: 20 }} />

              {/* Aura + Day */}
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 4 }}>✦ AURA + DZIEŃ TYGODNIA</Text>
              <Text style={{ fontSize: 13, color: subColor, lineHeight: 20, marginBottom: 14 }}>Każdy kolor aury ma swój dzień — czas najsilniejszego wyrazu i możliwości.</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
                {AURA_COLORS.map(c => (
                  <View key={c.id} style={{ alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: c.hex + '50', backgroundColor: c.hex + '10', minWidth: 84 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.hex + '35', borderWidth: 2, borderColor: c.hex }} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: c.hex, textAlign: 'center' }}>{c.name}</Text>
                    <Text style={{ fontSize: 11, color: subColor, textAlign: 'center' }}>{c.dayOfWeek}</Text>
                  </View>
                ))}
              </ScrollView>

              <View style={{ height: 1, backgroundColor: divider, marginVertical: 20 }} />

              {/* Aura + Element */}
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 4 }}>✦ AURA + ŻYWIOŁ</Text>
              <Text style={{ fontSize: 13, color: subColor, lineHeight: 20, marginBottom: 14 }}>Żywioły natury wzmacniają i rezonują z określonymi aurami — szukaj swojego elementu.</Text>
              {['Ogień', 'Woda', 'Ziemia', 'Powietrze', 'Eter', 'Wszystkie'].map((element, ei) => {
                const elementColors = AURA_COLORS.filter(c => c.element === element);
                if (elementColors.length === 0) return null;
                const elementEmoji = { Ogień: '🔥', Woda: '🌊', Ziemia: '🌿', Powietrze: '💨', Eter: '✨', Wszystkie: '🌈' }[element] || '⚡';
                return (
                  <Animated.View key={element} entering={FadeInDown.delay(ei * 60).duration(350)} style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: cardBorder, backgroundColor: cardBg, marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <Text style={{ fontSize: 20 }}>{elementEmoji}</Text>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>{element}</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {elementColors.map(c => (
                        <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: c.hex + '50', backgroundColor: c.hex + '15' }}>
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.hex }} />
                          <Text style={{ fontSize: 12, fontWeight: '600', color: c.hex }}>{c.name}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </Animated.View>
                );
              })}
            </Animated.View>
          )}

          {/* ── OCZYSZCZANIE TAB — 5 Cleansing Rituals ── */}
          {activeTab === 'oczyszczanie' && (
            <Animated.View entering={FadeInDown.duration(350)}>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 4 }}>5 RYTUAŁÓW OCZYSZCZANIA AURY</Text>
              <Text style={{ fontSize: 13, lineHeight: 20, color: subColor, marginBottom: 16 }}>Aura gromadzi energetyczne zanieczyszczenia z otoczenia, relacji i własnych myśli. Regularne oczyszczanie utrzymuje pole auretyczne czyste, jasne i wibrujące.</Text>

              {CLEANSING_RITUALS.map((ritual, i) => {
                const isExpanded = expandedCleansingRitual === ritual.id;
                return (
                  <Animated.View key={ritual.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                    <Pressable
                      onPress={() => { setExpandedCleansingRitual(isExpanded ? null : ritual.id); HapticsService.impact('light'); }}
                      style={{ padding: 18, borderRadius: 18, borderWidth: 1, borderColor: isExpanded ? ritual.color + '50' : cardBorder, backgroundColor: isExpanded ? ritual.color + '0A' : cardBg, marginBottom: 12 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: ritual.color + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: ritual.color + '40' }}>
                          <Text style={{ fontSize: 22 }}>{ritual.icon}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>{ritual.name}</Text>
                          <Text style={{ fontSize: 11, color: subColor }}>Czas: {ritual.duration}</Text>
                        </View>
                        <Text style={{ fontSize: 16, color: subColor }}>{isExpanded ? '▲' : '▼'}</Text>
                      </View>

                      {!isExpanded && (
                        <Text style={{ fontSize: 13, color: subColor, lineHeight: 19, marginTop: 10 }} numberOfLines={2}>{ritual.desc}</Text>
                      )}

                      {isExpanded && (
                        <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 14 }}>
                          <Text style={{ fontSize: 14, lineHeight: 22, color: textColor, marginBottom: 14 }}>{ritual.desc}</Text>
                          <View style={{ height: 1, backgroundColor: divider, marginBottom: 14 }} />
                          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: ritual.color, marginBottom: 10 }}>KROKI RYTUAŁU</Text>
                          {ritual.steps.map((step, si) => (
                            <View key={si} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: ritual.color + '20', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: ritual.color }}>{si + 1}</Text>
                              </View>
                              <Text style={{ flex: 1, fontSize: 13, lineHeight: 20, color: textColor }}>{step}</Text>
                            </View>
                          ))}
                          <Pressable
                            onPress={() => { HapticsService.impact('medium'); navigation.navigate('Meditation'); }}
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, paddingVertical: 12, borderRadius: 12, backgroundColor: ritual.color + '18', borderWidth: 1, borderColor: ritual.color + '40' }}
                          >
                            <Flame color={ritual.color} size={15} strokeWidth={1.8} />
                            <Text style={{ fontSize: 14, fontWeight: '700', color: ritual.color }}>Rozpocznij rytuał</Text>
                          </Pressable>
                        </Animated.View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}

              {/* Frequency of cleansing guide */}
              <View style={{ height: 1, backgroundColor: divider, marginVertical: 16 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 12 }}>✦ KIEDY OCZYSZCZAĆ AURĘ?</Text>
              {[
                { when: 'Codziennie', reason: 'Krótki rytuał wodny lub prysznic z intencją po każdym powrocie do domu', color: '#22C55E' },
                { when: 'Po trudnych rozmowach', reason: 'Oczyszczanie dymem lub dźwiękiem usuwa energię konfliktów', color: '#F97316' },
                { when: 'Po miejscach publicznych', reason: 'Tłumy zostawiają swoje energie — kąpiel krystaliczna lub słoneczna', color: '#3B82F6' },
                { when: 'Podczas nowiu i pełni', reason: 'Rytm księżyca sprzyja głębokiemu oczyszczeniu i odnowie pola', color: '#A855F7' },
                { when: 'Gdy czujesz się "ciężki"', reason: 'Symptom: zmęczenie, drażliwość, brak inspiracji — czas na oczyszczenie', color: '#EC4899' },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: item.color + '30', backgroundColor: item.color + '07' }}>
                  <View style={{ width: 8, borderRadius: 4, backgroundColor: item.color, minHeight: 44 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: item.color, marginBottom: 3 }}>{item.when}</Text>
                    <Text style={{ fontSize: 12, lineHeight: 18, color: subColor }}>{item.reason}</Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          )}

          {/* ── OCHRONA TAB — 3 Protection Practices ── */}
          {activeTab === 'ochrona' && (
            <Animated.View entering={FadeInDown.duration(350)}>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 4 }}>OCHRONA POLA AURETYCZNEGO</Text>
              <Text style={{ fontSize: 13, lineHeight: 20, color: subColor, marginBottom: 16 }}>Silna aura jest naturalną ochroną. Ale w trudnych sytuacjach — konfliktach, zatłoczonych miejscach, przy energetycznie wymagających osobach — warto aktywnie uszczelniać swoje pole.</Text>

              {PROTECTION_PRACTICES.map((practice, i) => {
                const isExpanded = expandedProtection === practice.id;
                return (
                  <Animated.View key={practice.id} entering={FadeInDown.delay(i * 80).duration(400)}>
                    <Pressable
                      onPress={() => { setExpandedProtection(isExpanded ? null : practice.id); HapticsService.impact('light'); }}
                      style={{ padding: 18, borderRadius: 18, borderWidth: 1, borderColor: isExpanded ? practice.color + '50' : cardBorder, backgroundColor: isExpanded ? practice.color + '08' : cardBg, marginBottom: 14 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: practice.color + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: practice.color + '40' }}>
                          <Text style={{ fontSize: 26 }}>{practice.icon}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>{practice.name}</Text>
                        </View>
                        <Text style={{ fontSize: 16, color: subColor }}>{isExpanded ? '▲' : '▼'}</Text>
                      </View>

                      {!isExpanded && (
                        <Text style={{ fontSize: 13, color: subColor, lineHeight: 20, marginTop: 12 }} numberOfLines={3}>{practice.desc}</Text>
                      )}

                      {isExpanded && (
                        <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 14 }}>
                          <Text style={{ fontSize: 14, lineHeight: 22, color: textColor, marginBottom: 14 }}>{practice.desc}</Text>
                          <View style={{ height: 1, backgroundColor: divider, marginBottom: 14 }} />
                          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: practice.color, marginBottom: 10 }}>WIZUALIZACJA KROK PO KROKU</Text>
                          {practice.steps.map((step, si) => (
                            <View key={si} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: practice.color + '20', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: practice.color }}>{si + 1}</Text>
                              </View>
                              <Text style={{ flex: 1, fontSize: 13, lineHeight: 20, color: textColor }}>{step}</Text>
                            </View>
                          ))}
                        </Animated.View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}

              {/* Daily protection ritual short */}
              <View style={{ height: 1, backgroundColor: divider, marginVertical: 8 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 12 }}>✦ CODZIENNA PRAKTYKA OCHRONNA</Text>
              <LinearGradient colors={[accent + '18', accent + '06']} style={{ padding: 18, borderRadius: 18, borderWidth: 1, borderColor: accent + '30', marginBottom: 14 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, marginBottom: 10 }}>Poranna bańka — 2 minuty</Text>
                {['Rano, przed wyjściem, zamknij oczy na 2 minuty.', 'Wyobraź sobie złote lub białe światło rozszerzające się z serca.', 'Otacza Cię sfera o 1m — przepuszcza tylko miłość i dobro.', 'Zadeklaruj: "Jestem chroniony/a. Moje pole jest czyste i silne."', 'Otwórz oczy. Gotowe — Twoja tarcza aktywna na cały dzień.'].map((step, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 7 }}>
                    <Text style={{ color: accent, fontSize: 13, fontWeight: '700' }}>{i + 1}.</Text>
                    <Text style={{ flex: 1, fontSize: 13, lineHeight: 20, color: textColor }}>{step}</Text>
                  </View>
                ))}
              </LinearGradient>

              {/* Energetic boundaries tips */}
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 12 }}>✦ ZNAKI OSŁABIONEJ AURY</Text>
              {[
                { sign: 'Ciągłe zmęczenie bez przyczyny', action: 'Kąpiel solna + rytuał słoneczny', color: '#EF4444' },
                { sign: 'Przejmowanie emocji innych', action: 'Technika lustra + medytacja uziemiająca', color: '#F97316' },
                { sign: 'Poczucie ciężkości w pomieszczeniach', action: 'Oczyszczanie dymem lub dźwiękiem', color: '#A855F7' },
                { sign: 'Trudność ze skupieniem', action: 'Siatka kryształowa + bańka ochronna', color: '#3B82F6' },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: item.color + '30', backgroundColor: item.color + '07' }}>
                  <View style={{ width: 8, borderRadius: 4, backgroundColor: item.color, minHeight: 40 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, marginBottom: 4 }}>{item.sign}</Text>
                    <Text style={{ fontSize: 12, color: item.color, fontWeight: '600' }}>→ {item.action}</Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          )}

          {/* ── CO DALEJ? ── */}
          {(activeTab === 'quiz' && quizDone) && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: accent, marginBottom: 12 }}>✦ CO DALEJ?</Text>
              {[
                { icon: Zap, label: 'Centra energetyczne', sub: '7 czakr i ich relacja z aurą', route: 'Chakra', color: '#A78BFA' },
                { icon: Brain, label: 'Medytacja wzmacniająca aurę', sub: 'Timer i techniki oczyszczenia pola', route: 'Meditation', color: '#60A5FA' },
                { icon: Sparkles, label: 'Portal Wyroczni', sub: 'Pytaj o swoją energię i kierunek', route: 'OraclePortal', color: accent },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Pressable key={item.route} onPress={() => { HapticsService.impact('light'); navigation.navigate(item.route as any); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: item.color + '30', backgroundColor: cardBg, marginBottom: 10 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: item.color + '18', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon color={item.color} size={17} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{item.label}</Text>
                      <Text style={{ fontSize: 12, color: subColor, marginTop: 2 }}>{item.sub}</Text>
                    </View>
                    <ArrowRight color={subColor} size={14} />
                  </Pressable>
                );
              })}
            </View>
          )}

          <EndOfContentSpacer size="standard" />
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Enhanced Color Detail Modal */}
      <Modal visible={!!selectedColor} transparent animationType="slide" onRequestClose={() => setSelectedColor(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <ScrollView style={{ backgroundColor: isLight ? '#FDF0FF' : '#180820', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' }} contentContainerStyle={{ padding: 28, paddingBottom: 48 }}>
            <Pressable onPress={() => setSelectedColor(null)} style={{ position: 'absolute', top: 18, right: 22, zIndex: 10 }}>
              <X color={subColor} size={20} />
            </Pressable>
            {selectedColor && <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: selectedColor.hex + '40', borderWidth: 2, borderColor: selectedColor.hex }} />
                <View>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: selectedColor.hex }}>{selectedColor.name}</Text>
                  <Text style={{ fontSize: 13, color: subColor }}>{selectedColor.chakra} · {selectedColor.element} · {selectedColor.dayOfWeek}</Text>
                </View>
              </View>

              <Text style={{ fontSize: 14, lineHeight: 22, color: textColor, marginBottom: 14 }}>{selectedColor.meaning}</Text>

              {/* Spiritual meaning */}
              <View style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: selectedColor.hex + '35', backgroundColor: selectedColor.hex + '0A', marginBottom: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: selectedColor.hex, marginBottom: 6 }}>ZNACZENIE DUCHOWE</Text>
                <Text style={{ fontSize: 13, lineHeight: 20, color: textColor, fontStyle: 'italic' }}>{selectedColor.spiritualMeaning}</Text>
              </View>

              {/* Keywords */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {selectedColor.keywords.map(k => (
                  <View key={k} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: selectedColor.hex + '20', borderWidth: 1, borderColor: selectedColor.hex + '40' }}>
                    <Text style={{ fontSize: 13, color: selectedColor.hex, fontWeight: '600' }}>{k}</Text>
                  </View>
                ))}
              </View>

              {/* Strengths + Shadows */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <View style={{ flex: 1, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#22C55E35', backgroundColor: '#22C55E08' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#22C55E', marginBottom: 8 }}>MOCNE STRONY</Text>
                  {selectedColor.strengths.map((s, i) => (
                    <Text key={i} style={{ fontSize: 12, color: textColor, marginBottom: 4 }}>✓ {s}</Text>
                  ))}
                </View>
                <View style={{ flex: 1, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#F9731635', backgroundColor: '#F9731608' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#F97316', marginBottom: 8 }}>CIEŃ</Text>
                  {(selectedColor.shadows || selectedColor.challenges).map((s, i) => (
                    <Text key={i} style={{ fontSize: 12, color: textColor, marginBottom: 4 }}>◐ {s}</Text>
                  ))}
                </View>
              </View>

              {/* Osobowość auretyczna */}
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: selectedColor.hex, marginBottom: 10 }}>OSOBOWOŚĆ AURETYCZNA</Text>
              <View style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: selectedColor.hex + '35', backgroundColor: selectedColor.hex + '08', marginBottom: 16 }}>
                {selectedColor.personality.map((trait, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: i < selectedColor.personality.length - 1 ? 8 : 0 }}>
                    <Text style={{ color: selectedColor.hex, fontSize: 14, marginTop: 1 }}>•</Text>
                    <Text style={{ flex: 1, fontSize: 13, lineHeight: 19, color: textColor }}>{trait}</Text>
                  </View>
                ))}
              </View>

              {/* How to strengthen */}
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#22C55E', marginBottom: 10 }}>JAK WZMACNIAĆ TĘ AURĘ</Text>
              <View style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#22C55E35', backgroundColor: '#22C55E08', marginBottom: 16 }}>
                {selectedColor.howToStrengthen?.map((tip, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: i < selectedColor.howToStrengthen.length - 1 ? 8 : 0 }}>
                    <Text style={{ color: '#22C55E', fontSize: 14, marginTop: 1 }}>✦</Text>
                    <Text style={{ flex: 1, fontSize: 13, lineHeight: 19, color: textColor }}>{tip}</Text>
                  </View>
                ))}
              </View>

              {/* Wyzwania */}
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#F97316', marginBottom: 10 }}>WYZWANIA I WZROST</Text>
              <View style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#F9731635', backgroundColor: '#F9731608', marginBottom: 16 }}>
                {selectedColor.growthEdges.map((edge, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: i < selectedColor.growthEdges.length - 1 ? 8 : 0 }}>
                    <Text style={{ color: '#F97316', fontSize: 14, marginTop: 1 }}>⚡</Text>
                    <Text style={{ flex: 1, fontSize: 13, lineHeight: 19, color: textColor }}>{edge}</Text>
                  </View>
                ))}
              </View>

              {/* Kamień harmonii */}
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: accent, marginBottom: 10 }}>KAMIEŃ HARMONII</Text>
              <View style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: accent + '35', backgroundColor: accent + '08', marginBottom: 16 }}>
                <Text style={{ fontSize: 14, lineHeight: 20, color: textColor }}>{selectedColor.harmonyStone}</Text>
              </View>

              {/* Crystals */}
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: selectedColor.hex, marginBottom: 10 }}>POLECANE KRYSZTAŁY</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {selectedColor.crystals.map((crystal, ci) => (
                  <View key={ci} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: selectedColor.hex + '50', backgroundColor: selectedColor.hex + '12' }}>
                    <Text style={{ fontSize: 13, color: selectedColor.hex, fontWeight: '600' }}>{crystal}</Text>
                  </View>
                ))}
              </View>

              {/* Afirmacja */}
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: selectedColor.hex, marginBottom: 10 }}>AFIRMACJA AURY</Text>
              <LinearGradient colors={[selectedColor.hex + '22', selectedColor.hex + '08']} style={{ padding: 16, borderRadius: 14, borderWidth: 1, borderColor: selectedColor.hex + '40', marginBottom: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: selectedColor.hex, textAlign: 'center', lineHeight: 22, fontStyle: 'italic' }}>"{selectedColor.affirmation}"</Text>
              </LinearGradient>
            </>}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const ar = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 12 },
});
