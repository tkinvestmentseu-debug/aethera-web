// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Dimensions, Pressable, ScrollView, StyleSheet, Text, View, TextInput, ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay,
  Easing, FadeInDown, FadeInUp, withSpring, interpolate, runOnJS, useAnimatedProps,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle, Path, G, Line, Text as SvgText, Defs, RadialGradient, Stop,
  Polygon, Ellipse, LinearGradient as SvgLinearGradient,
} from 'react-native-svg';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import {
  Star, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Sparkles, Globe, Moon,
  Heart, BookOpen, Zap, Wind, Info,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── ZODIAC SIGN DATA ───────────────────────────────────────────────────────
const SIGNS = [
  {
    id: 'Aries', pl: 'Baran', symbol: '♈', element: 'Ogień', color: '#E8705A',
    dates: '21.03–19.04', ruler: 'Mars', quality: 'Kardynalny', polarity: 'Dodatnia',
    house: 'I Dom', bodyPart: 'Głowa i twarz',
    traits: ['Odważny', 'Energiczny', 'Pionierski', 'Impulsywny', 'Lider'],
    strengths: ['Naturalna odwaga w obliczu nowych wyzwań', 'Silna wola i inicjatywa', 'Pasja, która zapala innych'],
    shadows: ['Impulsywność bez refleksji', 'Trudność ze słuchaniem innych'],
    compatibility: ['Lew', 'Strzelec', 'Waga', 'Bliźnięta'],
    career: ['Przedsiębiorczość', 'Sport', 'Wojskowość', 'Przywództwo', 'Ratownictwo'],
    crystal: 'Karnelian, Czerwony Jaspis',
    herb: 'Echinacea, Czosnek',
    color_assoc: 'Szkarłat, Cynober',
    moonMeaning: 'Księżyc w Baranie wzmacnia instynkt działania, impuls i odwagę. Czas zaczynać, nie analizować.',
    desc: 'Baran otwiera koło zodiaku jako znak ognia i kardynalnego działania. Rządzony przez Marsa, wnosi w świat energię pionierską — impet pierwszego kroku, odwagę nowego początku. Barany nie czekają — tworzą.',
  },
  {
    id: 'Taurus', pl: 'Byk', symbol: '♉', element: 'Ziemia', color: '#A8873A',
    dates: '20.04–20.05', ruler: 'Wenus', quality: 'Stały', polarity: 'Ujemna',
    house: 'II Dom', bodyPart: 'Szyja i gardło',
    traits: ['Wytrwały', 'Zmysłowy', 'Niezawodny', 'Cierpliwy', 'Praktyczny'],
    strengths: ['Niezrównana wytrwałość i stabilność', 'Zmysłowość i umiłowanie piękna', 'Godność zaufania i wierność'],
    shadows: ['Upór graniczący ze sztywnością', 'Opór przed zmianą'],
    compatibility: ['Panna', 'Koziorożec', 'Skorpion', 'Rak'],
    career: ['Finanse', 'Sztuka', 'Kuchnia', 'Budownictwo', 'Muzyka'],
    crystal: 'Różowy Kwarc, Szmaragd',
    herb: 'Tymianek, Mięta',
    color_assoc: 'Zieleń, Złoto, Biel',
    moonMeaning: 'Księżyc w Byku to czas spokoju, zmysłowości i zakorzenienia. Zadbaj o ciało i otocz się pięknem.',
    desc: 'Byk jest znakiem ziemi rządzonym przez Wenus — boginię piękna i miłości. To patron stabilności, zmysłowości i głębokiej wierności. Tam, gdzie inni się spieszą, Byk buduje trwałe fundamenty.',
  },
  {
    id: 'Gemini', pl: 'Bliźnięta', symbol: '♊', element: 'Powietrze', color: '#5B8FD4',
    dates: '21.05–20.06', ruler: 'Merkury', quality: 'Przemienny', polarity: 'Dodatnia',
    house: 'III Dom', bodyPart: 'Ramiona i płuca',
    traits: ['Elokwentny', 'Ciekawy', 'Adaptacyjny', 'Błyskotliwy', 'Witki'],
    strengths: ['Mistrzowska komunikacja i słowo', 'Nieograniczona ciekawość intelektu', 'Zdolność widzenia wielu perspektyw'],
    shadows: ['Rozproszenie i trudność z głębią', 'Niestałość w relacjach'],
    compatibility: ['Waga', 'Wodnik', 'Strzelec', 'Baran'],
    career: ['Dziennikarstwo', 'Nauczanie', 'PR', 'Sprzedaż', 'Technologia'],
    crystal: 'Cytryn, Agatyt',
    herb: 'Lawenda, Melisa',
    color_assoc: 'Żółty, Srebrny, Turkus',
    moonMeaning: 'Księżyc w Bliźniętach przyspiesza umysł i komunikację. Świetny czas na rozmowy, pisanie, naukę.',
    desc: 'Bliźnięta to dwoisty znak powietrza, rządzony przez Merkurego. Żyją w świecie słów, idei i połączeń. Ich dar to widzieć wiele stron jednej prawdy — i przekazywać ją z wdziękiem.',
  },
  {
    id: 'Cancer', pl: 'Rak', symbol: '♋', element: 'Woda', color: '#6B8FCC',
    dates: '21.06–22.07', ruler: 'Księżyc', quality: 'Kardynalny', polarity: 'Ujemna',
    house: 'IV Dom', bodyPart: 'Piersi i żołądek',
    traits: ['Opiekuńczy', 'Intuicyjny', 'Empatyczny', 'Wyobraźniowy', 'Lojalny'],
    strengths: ['Głęboka intuicja emocjonalna', 'Opiekuńczość i troska bez granic', 'Silna więź z rodziną i korzeniami'],
    shadows: ['Nadmierna wrażliwość i urazy', 'Manipulacja przez emocje'],
    compatibility: ['Byk', 'Ryby', 'Koziorożec', 'Panna'],
    career: ['Opieka zdrowotna', 'Psychologia', 'Gotowanie', 'Historia', 'Nieruchomości'],
    crystal: 'Moonstone, Perła',
    herb: 'Rumianek, Biała lilia',
    color_assoc: 'Srebrny, Błękit, Biel',
    moonMeaning: 'Księżyc w Raku jest w domicylu — najsilniejszy. Emocje intensywne, intuicja ostra, instynkt opiekuńczy aktywowany.',
    desc: 'Rak rządzony przez Księżyc to najbardziej intuicyjny ze znaków. Żyje cyklami — jak pływy morskie, jak fazy księżyca. Jego siłą jest empatia tak głęboka, że czuje to, czego nikt nie powie.',
  },
  {
    id: 'Leo', pl: 'Lew', symbol: '♌', element: 'Ogień', color: '#D4903A',
    dates: '23.07–22.08', ruler: 'Słońce', quality: 'Stały', polarity: 'Dodatnia',
    house: 'V Dom', bodyPart: 'Serce i plecy',
    traits: ['Charyzmatyczny', 'Hojny', 'Twórczy', 'Lojalny', 'Dumny'],
    strengths: ['Magnetyczny blask i charyzma', 'Szczera hojność i ciepło serca', 'Twórcza siła wyrazu'],
    shadows: ['Potrzeba centrum uwagi', 'Duma ponad wszystko'],
    compatibility: ['Baran', 'Strzelec', 'Waga', 'Bliźnięta'],
    career: ['Aktorstwo', 'Polityka', 'Zarządzanie', 'Jubilerstwo', 'Sportowcy'],
    crystal: 'Słoneczny Kamień, Cytryn',
    herb: 'Nagietek, Szafran',
    color_assoc: 'Złoto, Purpura, Pomarańcz',
    moonMeaning: 'Księżyc w Lwie rozbudza potrzebę wyrażania siebie, bycia widzianym i tworzenia. Czas na scenę.',
    desc: 'Lew rządzony przez Słońce to znak najgłębszej ekspresji ego — w najszlachetniejszym sensie. Jego serce jest otwarte jak wejście do pałacu: hojne, ciepłe, dostojne.',
  },
  {
    id: 'Virgo', pl: 'Panna', symbol: '♍', element: 'Ziemia', color: '#5A9A6A',
    dates: '23.08–22.09', ruler: 'Merkury', quality: 'Przemienny', polarity: 'Ujemna',
    house: 'VI Dom', bodyPart: 'Jelita i układ trawienny',
    traits: ['Analityczny', 'Pomocny', 'Skrupulatny', 'Praktyczny', 'Pokorny'],
    strengths: ['Niezrównana precyzja i uwaga do szczegółu', 'Głęboka chęć służby i pomocy', 'Zdolność analizy i rozwiązywania problemów'],
    shadows: ['Skrajny perfekcjonizm i autokrytyka', 'Trudność z przyjmowaniem wdzięczności'],
    compatibility: ['Byk', 'Koziorożec', 'Ryby', 'Rak'],
    career: ['Medycyna', 'Nauka', 'Edytorstwo', 'Bibliotekoznawstwo', 'Ekologia'],
    crystal: 'Agat, Akwamaryn',
    herb: 'Koper włoski, Estragon',
    color_assoc: 'Zieleń, Brąz, Szarość',
    moonMeaning: 'Księżyc w Pannie skupia uwagę na zdrowiu, porządku i praktycznej służbie. Czas na porządki — wewnętrzne i zewnętrzne.',
    desc: 'Panna — ziemski znak Merkurego — jest patronem precyzji i służby. Za pozorną skromnością kryje się nieskończona inteligencja i niezrównana zdolność do praktycznego działania.',
  },
  {
    id: 'Libra', pl: 'Waga', symbol: '♎', element: 'Powietrze', color: '#C06898',
    dates: '23.09–22.10', ruler: 'Wenus', quality: 'Kardynalny', polarity: 'Dodatnia',
    house: 'VII Dom', bodyPart: 'Nerki i lędźwie',
    traits: ['Dyplomatyczny', 'Sprawiedliwy', 'Elegancki', 'Społeczny', 'Idealistyczny'],
    strengths: ['Mistrzowska dyplomacja i równowaga', 'Piękno i estetyczna wrażliwość', 'Zdolność do fair mediacji'],
    shadows: ['Niezdecydowanie i zależność od opinii', 'Unikanie konfliktu za wszelką cenę'],
    compatibility: ['Bliźnięta', 'Wodnik', 'Baran', 'Lew'],
    career: ['Prawo', 'Dyplomacja', 'Sztuka', 'Design', 'Doradztwo'],
    crystal: 'Lapis Lazuli, Opal',
    herb: 'Róża, Melisa',
    color_assoc: 'Różowy, Błękit, Ivory',
    moonMeaning: 'Księżyc w Wadze aktywuje potrzebę harmonii i pięknych relacji. Czas na budowanie mostów i estetycznych doznań.',
    desc: 'Waga — powietrzny znak Wenus — jest sztuką równowagi i harmonii. Widzi dwie strony każdej prawdy i szuka mostu między nimi. Jej królestwo to piękno, sprawiedliwość i subtelne relacje.',
  },
  {
    id: 'Scorpio', pl: 'Skorpion', symbol: '♏', element: 'Woda', color: '#9A5AAA',
    dates: '23.10–21.11', ruler: 'Pluton', quality: 'Stały', polarity: 'Ujemna',
    house: 'VIII Dom', bodyPart: 'Narządy płciowe i układ wydalniczy',
    traits: ['Intensywny', 'Magnetyczny', 'Transformujący', 'Tajemniczy', 'Lojalny'],
    strengths: ['Głębia emocjonalna bez dna', 'Niesamowita siła transformacji', 'Przenikliwa intuicja i psychika'],
    shadows: ['Obsesja i zazdrość', 'Skłonność do manipulacji'],
    compatibility: ['Rak', 'Ryby', 'Byk', 'Koziorożec'],
    career: ['Psychologia', 'Chirurgia', 'Detektywistyka', 'Okultyzm', 'Badania'],
    crystal: 'Obsydian, Czarny Turmalin',
    herb: 'Pokrzywa, Bylica',
    color_assoc: 'Czerń, Karmazyn, Burgund',
    moonMeaning: 'Księżyc w Skorpionie zanurza nas w głębinach emocji. Intensywna, transformująca energia. Czas na prawdę bez owijania w bawełnę.',
    desc: 'Skorpion rządzony przez Plutona jest znakiem transformacji, głębi i odrodzenia. Żyje na granicy światów — widzialnego i ukrytego. To strażnik tajemnic i mistrz alchemii duszy.',
  },
  {
    id: 'Sagittarius', pl: 'Strzelec', symbol: '♐', element: 'Ogień', color: '#D47840',
    dates: '22.11–21.12', ruler: 'Jowisz', quality: 'Przemienny', polarity: 'Dodatnia',
    house: 'IX Dom', bodyPart: 'Biodra i uda',
    traits: ['Optymistyczny', 'Filozoficzny', 'Przygodowy', 'Szczery', 'Rozwijający'],
    strengths: ['Nieskrępowany optymizm i wiara w życie', 'Filozoficzna głębia i poszukiwanie sensu', 'Zaraźliwa miłość do wolności'],
    shadows: ['Bezpośredniość bez taktu', 'Trudność ze stałością i zobowiązaniami'],
    compatibility: ['Baran', 'Lew', 'Bliźnięta', 'Waga'],
    career: ['Filozofia', 'Podróże', 'Prawo', 'Religia', 'Edukacja wyższa'],
    crystal: 'Turkus, Lapis Lazuli',
    herb: 'Szałwia, Jałowiec',
    color_assoc: 'Indygo, Fiolet, Granat',
    moonMeaning: 'Księżyc w Strzelcu poszerza horyzonty, rozbudza optymizm i chęć przygody. Czas na filozoficzne pytania.',
    desc: 'Strzelec rządzony przez Jowisza jest patronem wolności, ekspansji i wyższej mądrości. Jego strzała zawsze mierzy w horyzont — ku prawdzie, która wykracza poza to, co widzialne.',
  },
  {
    id: 'Capricorn', pl: 'Koziorożec', symbol: '♑', element: 'Ziemia', color: '#8A8A7A',
    dates: '22.12–19.01', ruler: 'Saturn', quality: 'Kardynalny', polarity: 'Ujemna',
    house: 'X Dom', bodyPart: 'Kolana i kości',
    traits: ['Ambitny', 'Zdyscyplinowany', 'Odpowiedzialny', 'Pragmatyczny', 'Wytrwały'],
    strengths: ['Niezłomna ambicja i dyscyplina', 'Zdolność do długofalowego myślenia', 'Niezawodność i poczucie odpowiedzialności'],
    shadows: ['Zimna kalkulacja kosztem serca', 'Pesymizm i nadmierna surowość wobec siebie'],
    compatibility: ['Byk', 'Panna', 'Rak', 'Ryby'],
    career: ['Biznes', 'Polityka', 'Budownictwo', 'Bankowość', 'Zarządzanie'],
    crystal: 'Onyx, Czarny Obsydian',
    herb: 'Comfrey, Skrzyp',
    color_assoc: 'Czerń, Brąz, Szarość',
    moonMeaning: 'Księżyc w Koziorożcu sprzyja strukturze, planowaniu i odpowiedzialności. Czas stawiać realistyczne cele.',
    desc: 'Koziorożec rządzony przez Saturna wchodzi w góry tam, gdzie inni rezygnują. Jest mistrzem czasu i wytrwałości — wie, że każde wielkie dzieło wymaga cierpliwości i konsekwencji.',
  },
  {
    id: 'Aquarius', pl: 'Wodnik', symbol: '♒', element: 'Powietrze', color: '#4AAAB8',
    dates: '20.01–18.02', ruler: 'Uran', quality: 'Stały', polarity: 'Dodatnia',
    house: 'XI Dom', bodyPart: 'Kostki i golenie',
    traits: ['Innowacyjny', 'Humanitarny', 'Niezależny', 'Oryginalny', 'Wizjonerski'],
    strengths: ['Rewolucyjne myślenie i oryginalność', 'Głęboki humanitaryzm', 'Zdolność widzenia przyszłości'],
    shadows: ['Emocjonalna odległość i chłód', 'Bunt dla zasady'],
    compatibility: ['Bliźnięta', 'Waga', 'Lew', 'Baran'],
    career: ['Technologia', 'Nauka', 'Aktywizm', 'Lotnictwo', 'Astrologia'],
    crystal: 'Ametyst, Akwamaryn',
    herb: 'Lukrecja, Kozłek',
    color_assoc: 'Turkus, Elektryczny błękit, Srebrny',
    moonMeaning: 'Księżyc w Wodniku aktywuje instynkt rewolucji i wolności. Dobry czas na oryginalność i oderwanie się od norm.',
    desc: 'Wodnik rządzony przez Uran jest dzieckiem przyszłości. Nosi w sobie ideę świata, który jeszcze nie nadszedł — i cierpliwie go buduje, jedno połączenie na raz.',
  },
  {
    id: 'Pisces', pl: 'Ryby', symbol: '♓', element: 'Woda', color: '#7878CC',
    dates: '19.02–20.03', ruler: 'Neptun', quality: 'Przemienny', polarity: 'Ujemna',
    house: 'XII Dom', bodyPart: 'Stopy i układ limfatyczny',
    traits: ['Wrażliwy', 'Mistyczny', 'Empatyczny', 'Artystyczny', 'Duchowy'],
    strengths: ['Mistyczna intuicja i duchowa głębia', 'Nieskończona empatia i współczucie', 'Twórcza wyobraźnia bez granic'],
    shadows: ['Ucieczka od rzeczywistości', 'Graniczna naiwność i łatwość manipulacji'],
    compatibility: ['Rak', 'Skorpion', 'Koziorożec', 'Byk'],
    career: ['Muzyka', 'Poezja', 'Terapia', 'Duchowość', 'Film'],
    crystal: 'Ametyst, Lazuryt',
    herb: 'Melisa, Lotosu',
    color_assoc: 'Morski błękit, Fiolet, Biel',
    moonMeaning: 'Księżyc w Rybach otwiera bramy nieświadomości. Czas na sny, medytację i kontakt z tym, co przekracza słowa.',
    desc: 'Ryby rządzone przez Neptuna zamieszkują granicę między widzialnym a ukrytym. To ostatni znak zodiaku — niosący pamięć wszystkich pozostałych i mądrość najgłębszego współczucia.',
  },
];

const ELEMENT_COLORS = { 'Ogień': '#E8705A', 'Ziemia': '#A8873A', 'Powietrze': '#5B8FD4', 'Woda': '#7878CC' };
const ELEMENT_LIGHT_COLORS = { 'Ogień': '#F0A090', 'Ziemia': '#C8A760', 'Powietrze': '#80AADA', 'Woda': '#9898DD' };

// ─── DECANS DATA ─────────────────────────────────────────────────────────────
const DECANS = {
  Aries:       { d1: { ruler: 'Mars', desc: 'Odwaga i impet pierwszego stopnia. Czysta siła woli.', dates: '21.03–30.03' }, d2: { ruler: 'Słońce', desc: 'Dramatyzm i przywódczy blask.', dates: '31.03–10.04' }, d3: { ruler: 'Wenus', desc: 'Zmysłowość pod impulsywną fasadą.', dates: '11.04–19.04' } },
  Taurus:      { d1: { ruler: 'Wenus', desc: 'Zmysłowość w czystej formie. Harmonia i piękno.', dates: '20.04–29.04' }, d2: { ruler: 'Merkury', desc: 'Intelektualna ciekawość w ziemskim znaku.', dates: '30.04–10.05' }, d3: { ruler: 'Saturn', desc: 'Dyscyplina i wytrwałość.', dates: '11.05–20.05' } },
  Gemini:      { d1: { ruler: 'Merkury', desc: 'Lotność umysłu, błyskotliwość w rozmowie.', dates: '21.05–31.05' }, d2: { ruler: 'Wenus', desc: 'Czar i umiejętność budowania połączeń.', dates: '01.06–10.06' }, d3: { ruler: 'Uran', desc: 'Oryginalność i niekonwencjonalne myślenie.', dates: '11.06–20.06' } },
  Cancer:      { d1: { ruler: 'Księżyc', desc: 'Głęboka empatia, silny instynkt opiekuńczy.', dates: '21.06–02.07' }, d2: { ruler: 'Pluton', desc: 'Intensywność emocjonalna, transformująca więź.', dates: '03.07–12.07' }, d3: { ruler: 'Neptun', desc: 'Mistyczna wrażliwość, intuicja na granicy telepatii.', dates: '13.07–22.07' } },
  Leo:         { d1: { ruler: 'Słońce', desc: 'Magnetyczny blask, naturalne przywódctwo.', dates: '23.07–01.08' }, d2: { ruler: 'Jowisz', desc: 'Hojność i ekspansywna siła twórcza.', dates: '02.08–12.08' }, d3: { ruler: 'Mars', desc: 'Namiętność i bojowy duch w ekspresji.', dates: '13.08–22.08' } },
  Virgo:       { d1: { ruler: 'Merkury', desc: 'Analityczna precyzja i mistrzostwo w detalach.', dates: '23.08–01.09' }, d2: { ruler: 'Saturn', desc: 'Dyscyplina, perfekcjonizm, wytrwała praca.', dates: '02.09–11.09' }, d3: { ruler: 'Wenus', desc: 'Estetyczna wrażliwość i zmysł do harmonii.', dates: '12.09–22.09' } },
  Libra:       { d1: { ruler: 'Wenus', desc: 'Elegancja, dyplomacja i miłość do harmonii.', dates: '23.09–02.10' }, d2: { ruler: 'Saturn', desc: 'Strukturyzowanie relacji, poczucie sprawiedliwości.', dates: '03.10–12.10' }, d3: { ruler: 'Merkury', desc: 'Intelektualne piękno, mistrzowska komunikacja.', dates: '13.10–22.10' } },
  Scorpio:     { d1: { ruler: 'Pluton', desc: 'Transformacja w czystej formie. Magnetyczna głębia.', dates: '23.10–01.11' }, d2: { ruler: 'Neptun', desc: 'Mistyczna intuicja i psychiczna wrażliwość.', dates: '02.11–12.11' }, d3: { ruler: 'Księżyc', desc: 'Emocjonalna intensywność i nieskończona pamięć.', dates: '13.11–21.11' } },
  Sagittarius: { d1: { ruler: 'Jowisz', desc: 'Optymizm i poszerzanie horyzontów.', dates: '22.11–01.12' }, d2: { ruler: 'Mars', desc: 'Energia działania dla wyższych celów.', dates: '02.12–11.12' }, d3: { ruler: 'Słońce', desc: 'Twórcze poszukiwanie sensu i prawdy.', dates: '12.12–21.12' } },
  Capricorn:   { d1: { ruler: 'Saturn', desc: 'Ambicja i żelazna dyscyplina.', dates: '22.12–01.01' }, d2: { ruler: 'Wenus', desc: 'Zmysłowość pod maską surowości.', dates: '02.01–10.01' }, d3: { ruler: 'Merkury', desc: 'Strategiczne myślenie i precyzyjne planowanie.', dates: '11.01–19.01' } },
  Aquarius:    { d1: { ruler: 'Uran', desc: 'Rewolucyjna oryginalność i innowacja.', dates: '20.01–29.01' }, d2: { ruler: 'Merkury', desc: 'Błyskotliwy intelekt w służbie idei.', dates: '30.01–08.02' }, d3: { ruler: 'Wenus', desc: 'Humanitaryzm z ciepłem i estetyką.', dates: '09.02–18.02' } },
  Pisces:      { d1: { ruler: 'Neptun', desc: 'Mistyczna wyobraźnia i duchowa czułość.', dates: '19.02–28.02' }, d2: { ruler: 'Księżyc', desc: 'Głęboka empatia i intuicja serca.', dates: '01.03–10.03' }, d3: { ruler: 'Pluton', desc: 'Transformacja przez wyrzeczenie. Alchemia duszy.', dates: '11.03–20.03' } },
};

// ─── ASPECT DATA ─────────────────────────────────────────────────────────────
const ASPECTS = [
  { name: 'Koniunkcja', angle: 0, symbol: '☌', color: '#CEAE72', desc: 'Fuzja energii — wzmocnienie lub przytłoczenie. Intensywne, jednopunktowe skupienie.' },
  { name: 'Trygon', angle: 120, symbol: '△', color: '#2ECC71', desc: 'Harmonia i przepływ. Najłatwiejszy aspekt — talenty, które przychodzą bez wysiłku.' },
  { name: 'Kwadrat', angle: 90, symbol: '□', color: '#E74C3C', desc: 'Napięcie i wyzwanie. Trudny, ale budujący — zmusza do działania i przełamywania blokad.' },
  { name: 'Opozycja', angle: 180, symbol: '☍', color: '#E67E22', desc: 'Polaryzacja i świadomość. Wymaga integracji przeciwnych energii — lustro duszy.' },
  { name: 'Sekstyl', angle: 60, symbol: '⚹', color: '#3498DB', desc: 'Szansa i możliwość. Łagodna harmonia, która wymaga odrobiny inicjatywy by ją uruchomić.' },
];

// ─── LEARNING CARDS ──────────────────────────────────────────────────────────
const LEARNING_CARDS = [
  {
    title: 'Żywioły',
    icon: '🔥',
    color: '#E8705A',
    content: 'Cztery żywioły — Ogień, Ziemia, Powietrze i Woda — opisują podstawowy temperament i sposób przetwarzania energii. Ogień: inspiracja i akcja. Ziemia: stabilność i praktyczność. Powietrze: intelekt i komunikacja. Woda: emocje i intuicja.',
  },
  {
    title: 'Modalności',
    icon: '⚙️',
    color: '#A8873A',
    content: 'Trzy modalności opisują sposób działania. Kardynalne (Baran, Rak, Waga, Koziorożec) inicjują i zaczynają. Stałe (Byk, Lew, Skorpion, Wodnik) podtrzymują i pogłębiają. Przemienne (Bliźnięta, Panna, Strzelec, Ryby) adaptują i łączą.',
  },
  {
    title: 'Polarności',
    icon: '☯️',
    color: '#9B59B6',
    content: 'Sześć par biegunowych — znaki leżące naprzeciw siebie na kole — tworzą osie uzupełniające się energii. Baran–Waga: jaźń vs relacja. Byk–Skorpion: wartości vs transformacja. Każda para uczy czegoś o drugiej stronie.',
  },
  {
    title: 'Domy',
    icon: '🏛️',
    color: '#3498DB',
    content: 'Dwanaście domów horoskopu odpowiada dwunastu sferom życia. I Dom to tożsamość, IV Dom to dom i korzenie, VII Dom to partnerstwo, X Dom to kariera i misja publiczna. Znaki rządzące domami nadają im swój kolor.',
  },
];

// ─── SIMPLE COMPATIBILITY MATRIX ─────────────────────────────────────────────
function getCompatibilityScore(a: string, b: string): number {
  const fire = ['Aries', 'Leo', 'Sagittarius'];
  const earth = ['Taurus', 'Virgo', 'Capricorn'];
  const air = ['Gemini', 'Libra', 'Aquarius'];
  const water = ['Cancer', 'Scorpio', 'Pisces'];
  const groups = [fire, earth, air, water];
  const ga = groups.findIndex((g) => g.includes(a));
  const gb = groups.findIndex((g) => g.includes(b));
  if (a === b) return 3;
  if (ga === gb) return 5; // same element
  const harmonious = [[0, 2], [1, 3]]; // fire+air, earth+water
  if (harmonious.some((p) => (p[0] === ga && p[1] === gb) || (p[0] === gb && p[1] === ga))) return 4;
  const tense = [[0, 1], [2, 3]]; // fire+earth, air+water
  if (tense.some((p) => (p[0] === ga && p[1] === gb) || (p[0] === gb && p[1] === ga))) return 2;
  return 3;
}

// ─── ZODIAC WHEEL WIDGET ─────────────────────────────────────────────────────
const WHEEL_R = Math.min(SW * 0.42, 145);
const WHEEL_CX = SW / 2;
const WHEEL_CY = WHEEL_R + 20;
const WIDGET_H2 = WHEEL_CY + WHEEL_R + 24;

function ZodiacWheelWidget({
  selectedIndex, userSignIndex, onSelectSign, isLight,
}: {
  selectedIndex: number;
  userSignIndex: number;
  onSelectSign: (i: number) => void;
  isLight: boolean;
}) {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const outerRotation = useSharedValue(0);
  const glowPulse = useSharedValue(1);

  useEffect(() => {
    outerRotation.value = withRepeat(
      withTiming(360, { duration: 28000, easing: Easing.linear }),
      -1,
      false,
    );
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = interpolate(e.translationX, [-SW / 2, SW / 2], [-14, 14]);
      tiltY.value = interpolate(e.translationY, [-WIDGET_H2 / 2, WIDGET_H2 / 2], [-8, 8]);
    })
    .onEnd(() => {
      tiltX.value = withSpring(0);
      tiltY.value = withSpring(0);
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${-tiltY.value}deg` },
      { rotateY: `${tiltX.value}deg` },
    ],
  }));

  const outerRingStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    transform: [{ rotate: `${outerRotation.value}deg` }],
  }));

  const sign = SIGNS[selectedIndex];
  const segAngle = (2 * Math.PI) / 12;

  // Handle tap on wheel segment
  const tapGesture = Gesture.Tap().onEnd((e) => {
    const dx = e.absoluteX - (SW / 2);
    const dy = e.absoluteY - (WHEEL_CY + 80); // rough offset
    const angle = Math.atan2(dy, dx);
    const normalised = (angle + Math.PI * 2.5) % (Math.PI * 2);
    const idx = Math.floor((normalised / (Math.PI * 2)) * 12) % 12;
    runOnJS(onSelectSign)(idx);
  });

  const combined = Gesture.Simultaneous(panGesture, tapGesture);

  return (
    <GestureDetector gesture={combined}>
      <Animated.View style={[{ width: SW, height: WIDGET_H2, overflow: 'hidden' }, containerStyle]}>
        <LinearGradient
          colors={isLight ? ['#FAF0E6', '#F2E8D8', '#EDE0C6'] : ['#08051A', '#0D0825', '#08051A']}
          style={{ flex: 1 }}
        >
          <Svg width={SW} height={WIDGET_H2}>
            <Defs>
              <RadialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={sign.color} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={sign.color} stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Outer decorative ring — animated via Animated.View overlay is tricky in SVG,
                so we rotate the SVG group statically — use JS-driven rotation for static snapshot */}
            <Circle cx={WHEEL_CX} cy={WHEEL_CY} r={WHEEL_R + 16} stroke={isLight ? 'rgba(140,100,40,0.2)' : 'rgba(206,174,114,0.18)'} strokeWidth={1} fill="none" strokeDasharray="4 8" />
            <Circle cx={WHEEL_CX} cy={WHEEL_CY} r={WHEEL_R + 24} stroke={isLight ? 'rgba(140,100,40,0.1)' : 'rgba(206,174,114,0.1)'} strokeWidth={0.5} fill="none" />

            {/* 12 Segments */}
            {SIGNS.map((s, i) => {
              const startAngle = (i / 12) * Math.PI * 2 - Math.PI / 2;
              const endAngle = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2;
              const midAngle = startAngle + segAngle / 2;
              const isSelected = i === selectedIndex;
              const isUser = i === userSignIndex;

              const x1 = WHEEL_CX + WHEEL_R * Math.cos(startAngle);
              const y1 = WHEEL_CY + WHEEL_R * Math.sin(startAngle);
              const x2 = WHEEL_CX + WHEEL_R * Math.cos(endAngle);
              const y2 = WHEEL_CY + WHEEL_R * Math.sin(endAngle);
              const innerR = isSelected ? 22 : 26;
              const ix1 = WHEEL_CX + innerR * Math.cos(startAngle);
              const iy1 = WHEEL_CY + innerR * Math.sin(startAngle);
              const ix2 = WHEEL_CX + innerR * Math.cos(endAngle);
              const iy2 = WHEEL_CY + innerR * Math.sin(endAngle);

              const pathD = [
                `M ${ix1} ${iy1}`,
                `A ${innerR} ${innerR} 0 0 1 ${ix2} ${iy2}`,
                `L ${x2} ${y2}`,
                `A ${WHEEL_R} ${WHEEL_R} 0 0 0 ${x1} ${y1}`,
                'Z',
              ].join(' ');

              const elColor = isLight ? ELEMENT_LIGHT_COLORS[s.element] : s.color;
              const opacity = isSelected ? 0.85 : (isUser ? 0.65 : (isLight ? 0.28 : 0.22));

              // Glyph position
              const glyphR = WHEEL_R * 0.72;
              const gx = WHEEL_CX + glyphR * Math.cos(midAngle);
              const gy = WHEEL_CY + glyphR * Math.sin(midAngle);

              return (
                <G key={s.id}>
                  <Path d={pathD} fill={elColor} opacity={opacity} />
                  {/* Segment border */}
                  <Path d={pathD} fill="none" stroke={isLight ? 'rgba(80,60,30,0.2)' : 'rgba(255,255,255,0.12)'} strokeWidth={isSelected ? 1.5 : 0.5} />
                  {/* Glyph */}
                  <SvgText
                    x={gx}
                    y={gy + 5}
                    fontSize={isSelected ? 18 : 14}
                    fill={isSelected ? '#fff' : (isLight ? 'rgba(60,40,20,0.7)' : 'rgba(255,255,255,0.75)')}
                    textAnchor="middle"
                    fontWeight={isSelected ? '700' : '400'}
                  >
                    {s.symbol}
                  </SvgText>
                  {/* User sign gold dot */}
                  {isUser && (
                    <Circle
                      cx={WHEEL_CX + (WHEEL_R - 8) * Math.cos(midAngle)}
                      cy={WHEEL_CY + (WHEEL_R - 8) * Math.sin(midAngle)}
                      r={3.5}
                      fill="#CEAE72"
                    />
                  )}
                </G>
              );
            })}

            {/* Center glow */}
            <Circle cx={WHEEL_CX} cy={WHEEL_CY} r={32} fill="url(#centerGrad)" />
            <Circle cx={WHEEL_CX} cy={WHEEL_CY} r={24} fill={isLight ? 'rgba(250,240,220,0.9)' : 'rgba(10,6,28,0.88)'} stroke={sign.color} strokeWidth={1.5} />

            {/* Center sign glyph */}
            <SvgText
              x={WHEEL_CX}
              y={WHEEL_CY - 4}
              fontSize={20}
              fill={sign.color}
              textAnchor="middle"
              fontWeight="700"
            >
              {sign.symbol}
            </SvgText>
            <SvgText
              x={WHEEL_CX}
              y={WHEEL_CY + 13}
              fontSize={8}
              fill={isLight ? 'rgba(80,60,30,0.55)' : 'rgba(220,200,160,0.55)'}
              textAnchor="middle"
              letterSpacing={1}
            >
              {sign.pl.toUpperCase()}
            </SvgText>

            {/* Spoke lines */}
            {SIGNS.map((_, i) => {
              const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
              return (
                <Line
                  key={i}
                  x1={WHEEL_CX + 26 * Math.cos(angle)}
                  y1={WHEEL_CY + 26 * Math.sin(angle)}
                  x2={WHEEL_CX + WHEEL_R * Math.cos(angle)}
                  y2={WHEEL_CY + WHEEL_R * Math.sin(angle)}
                  stroke={isLight ? 'rgba(80,60,30,0.15)' : 'rgba(255,255,255,0.1)'}
                  strokeWidth={0.5}
                />
              );
            })}
          </Svg>
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
}

// ─── ASPECT DIAGRAM ──────────────────────────────────────────────────────────
function AspectDiagram({ signIndex, isLight }: { signIndex: number; isLight: boolean }) {
  const R = 60;
  const cx = (SW - layout.padding.screen * 2) / 2;
  const cy = 80;
  const textColor = isLight ? '#2A1A0A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(50,30,10,0.55)' : 'rgba(220,200,160,0.55)';

  const aspectSigns = ASPECTS.map((asp) => {
    const signOffset = Math.round(asp.angle / 30);
    return (signIndex + signOffset) % 12;
  });

  return (
    <View style={{ marginHorizontal: layout.padding.screen, marginTop: 14 }}>
      <Svg width={SW - layout.padding.screen * 2} height={170}>
        {/* Outer ring */}
        <Circle cx={cx} cy={cy} r={R + 10} stroke={isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'} strokeWidth={1} fill="none" strokeDasharray="3 5" />

        {/* Signs on ring */}
        {SIGNS.map((s, i) => {
          const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const sx = cx + (R + 10) * Math.cos(angle);
          const sy = cy + (R + 10) * Math.sin(angle);
          const isHighlighted = aspectSigns.includes(i) || i === signIndex;
          return (
            <SvgText key={i} x={sx} y={sy + 4} fontSize={isHighlighted ? 12 : 9}
              fill={isHighlighted ? s.color : (isLight ? 'rgba(80,60,30,0.4)' : 'rgba(220,200,160,0.35)')}
              textAnchor="middle" fontWeight={isHighlighted ? '700' : '400'}>
              {s.symbol}
            </SvgText>
          );
        })}

        {/* Aspect lines */}
        {ASPECTS.map((asp, ai) => {
          const fromAngle = (signIndex / 12) * Math.PI * 2 - Math.PI / 2;
          const toAngle = (aspectSigns[ai] / 12) * Math.PI * 2 - Math.PI / 2;
          return (
            <Line key={ai}
              x1={cx + R * Math.cos(fromAngle)} y1={cy + R * Math.sin(fromAngle)}
              x2={cx + R * Math.cos(toAngle)} y2={cy + R * Math.sin(toAngle)}
              stroke={asp.color} strokeWidth={1} opacity={0.5} strokeDasharray={ai > 0 ? '3 3' : undefined}
            />
          );
        })}

        {/* Center dot */}
        <Circle cx={cx} cy={cy} r={5} fill={SIGNS[signIndex].color} />
      </Svg>

      {/* Aspect legend */}
      {ASPECTS.map((asp) => (
        <View key={asp.name} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${asp.color}22`, borderWidth: 1, borderColor: asp.color, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Text style={{ fontSize: 13, color: asp.color }}>{asp.symbol}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>{asp.name} · {asp.angle}°</Text>
            <Text style={{ fontSize: 11, color: subColor, lineHeight: 17, marginTop: 1 }}>{asp.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── COMPATIBILITY MINI GRID ─────────────────────────────────────────────────
function CompatGrid({ signId, isLight }: { signId: string; isLight: boolean }) {
  const scores = SIGNS.map((s) => ({ ...s, score: getCompatibilityScore(signId, s.id) }));
  const textColor = isLight ? '#2A1A0A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(50,30,10,0.5)' : 'rgba(220,200,160,0.5)';
  const scoreColor = (n: number) => {
    if (n >= 5) return '#2ECC71';
    if (n >= 4) return '#CEAE72';
    if (n >= 3) return '#3498DB';
    return '#E74C3C';
  };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {scores.map((s) => (
        <View key={s.id} style={{
          width: (SW - layout.padding.screen * 2 - 6 * 5) / 6,
          backgroundColor: `${scoreColor(s.score)}18`,
          borderRadius: 10, padding: 6, alignItems: 'center',
          borderWidth: 1, borderColor: `${scoreColor(s.score)}40`,
        }}>
          <Text style={{ fontSize: 16 }}>{s.symbol}</Text>
          <Text style={{ fontSize: 8, color: subColor, marginTop: 2 }} numberOfLines={1}>{s.pl.substring(0, 4)}</Text>
          <View style={{ width: 16, height: 3, borderRadius: 1.5, backgroundColor: scoreColor(s.score), marginTop: 3 }} />
        </View>
      ))}
    </View>
  );
}

// ─── SKELETON ────────────────────────────────────────────────────────────────
function SkeletonLoader2({ isLight }: { isLight: boolean }) {
  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, []);
  const shimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.25, 0.6]),
  }));
  return (
    <View style={{ padding: 16 }}>
      {[70, 50, 90, 40, 65].map((h, i) => (
        <Animated.View key={i} style={[{
          height: h, borderRadius: 10, marginBottom: 10,
          backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
        }, shimStyle]} />
      ))}
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export const ZodiacAtlasScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeName, userData, addFavoriteItem, removeFavoriteItem } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');

  const textColor = isLight ? '#2A1A0A' : '#F0EBE2';
  const subColor = isLight ? 'rgba(50,30,10,0.55)' : 'rgba(220,200,160,0.55)';
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const goldColor = isLight ? '#8B6914' : '#CEAE72';

  // Determine user sign index
  const userSignId = userData?.zodiacSign || 'Leo';
  const userSignIndex = useMemo(() => Math.max(0, SIGNS.findIndex((s) => s.id === userSignId || s.pl === userSignId)), [userSignId]);
  const [selectedIndex, setSelectedIndex] = useState(userSignIndex);
  const [activeTab, setActiveTab] = useState<'info' | 'decans' | 'aspects'>('info');
  const [expandedLearn, setExpandedLearn] = useState<number | null>(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [favId, setFavId] = useState<string | null>(null);
  const isFav = favId !== null;
  const scrollRef = useRef<ScrollView>(null);
  const prevSelectedRef = useRef(selectedIndex);

  const sign = SIGNS[selectedIndex];
  const decans = DECANS[sign.id];

  useEffect(() => {
    if (prevSelectedRef.current !== selectedIndex) {
      setAiResponse('');
      setAiError('');
      prevSelectedRef.current = selectedIndex;
    }
  }, [selectedIndex]);

  const handleSelectSign = useCallback((i: number) => {
    HapticsService.notify();
    setSelectedIndex(i);
    setActiveTab('info');
  }, []);

  const handleAddFavorite = useCallback(() => {
    HapticsService.notify();
    if (isFav && favId) {
      removeFavoriteItem(favId);
      setFavId(null);
    } else {
      const newId = `zodiac-atlas-${Date.now()}`;
      addFavoriteItem?.({ id: newId, label: 'Atlas Zodiaku', sublabel: `${sign.symbol} ${sign.pl}`, route: 'ZodiacAtlas', icon: 'Star', color: sign.color, addedAt: new Date().toISOString() });
      setFavId(newId);
    }
  }, [sign, addFavoriteItem, removeFavoriteItem, isFav, favId]);

  const handleAiForecast = useCallback(async () => {
    HapticsService.notify();
    setAiLoading(true);
    setAiError('');
    setAiResponse('');
    try {
      const name = userData?.name || 'Poszukujący';
      const messages = [
        {
          role: 'user' as const,
          content: `Jestem ${name}. Chciałbym/chciałabym otrzymać duchowy horoskop dla znaku ${sign.pl} (${sign.symbol}). Znak jest rządzony przez ${sign.ruler}, żywioł: ${sign.element}, modalność: ${sign.quality}. Kluczowe cechy: ${sign.traits.join(', ')}. Proszę o głęboki, poetycki i mądry wgląd duchowy dla tego znaku — jego lekcia duszy, wyzwanie wzrostu i aktualne rekomendacje. 4-5 zdań. W języku użytkownika.`,
        },
      ];
      const resp = await AiService.chatWithOracle(messages);
      setAiResponse(resp);
    } catch {
      setAiError('Nie udało się połączyć z Oracle. Spróbuj ponownie.');
    } finally {
      setAiLoading(false);
    }
  }, [sign, userData]);

  const bgColors = isLight
    ? ['#FAF6EE', '#F5EFE2', '#FAF6EE'] as const
    : ['#06040F', '#0B0720', '#06040F'] as const;

  const TABS = [
    { key: 'info', label: 'Informacje' },
    { key: 'decans', label: 'Dekanie' },
    { key: 'aspects', label: 'Aspekty' },
  ] as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }} edges={['top']}>
      <LinearGradient colors={bgColors} style={{ flex: 1 }}>
        {/* ── Header ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: layout.padding.screen, paddingTop: 8, paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)',
        }}>
          <Pressable
            onPress={() => { if (navigation.canGoBack()) navigation.goBack(); else navigation.navigate('Main'); }}
            style={{ padding: 6, marginRight: 8 }}
          >
            <ChevronLeft size={22} color={textColor} />
          </Pressable>

          <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: goldColor, letterSpacing: 2 }}>
            ✦ ATLAS ZODIAKU
          </Text>

          <Pressable onPress={handleAddFavorite} style={{ padding: 8 }}>
            <Star size={20} color={goldColor} fill={isFav ? goldColor : 'none'} />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        >
          {/* ── Zodiac Wheel Widget ── */}
          <ZodiacWheelWidget
            selectedIndex={selectedIndex}
            userSignIndex={userSignIndex}
            onSelectSign={handleSelectSign}
            isLight={isLight}
          />

          {/* ── Sign chip selector ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingVertical: 12, gap: 8 }}
          >
            {SIGNS.map((s, i) => {
              const active = i === selectedIndex;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => handleSelectSign(i)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: active ? s.color : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)'),
                    borderWidth: 1,
                    borderColor: active ? s.color : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'),
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                  }}
                >
                  <Text style={{ fontSize: 13, color: active ? '#fff' : s.color }}>{s.symbol}</Text>
                  <Text style={{ fontSize: 11, color: active ? '#fff' : textColor, fontWeight: active ? '700' : '400' }}>{s.pl}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ── Selected Sign Hero Card ── */}
          <Animated.View
            key={sign.id}
            entering={FadeInDown.springify()}
            style={{
              marginHorizontal: layout.padding.screen,
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: `${sign.color}55`,
              marginBottom: 16,
            }}
          >
            <LinearGradient
              colors={isLight
                ? [`${sign.color}20`, `${sign.color}08`, 'transparent']
                : [`${sign.color}30`, `${sign.color}0A`, 'transparent']}
              style={{ padding: 18 }}
            >
              {/* Sign header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <View style={{
                  width: 60, height: 60, borderRadius: 30,
                  backgroundColor: sign.color,
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 14,
                  shadowColor: sign.color, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
                }}>
                  <Text style={{ fontSize: 30, color: '#fff' }}>{sign.symbol}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: textColor }}>{sign.pl}</Text>
                  <Text style={{ fontSize: 12, color: subColor }}>{sign.dates}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 5 }}>
                    <View style={{ backgroundColor: `${ELEMENT_COLORS[sign.element]}22`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: `${ELEMENT_COLORS[sign.element]}44` }}>
                      <Text style={{ fontSize: 10, color: ELEMENT_COLORS[sign.element], fontWeight: '600' }}>{sign.element}</Text>
                    </View>
                    <View style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 10, color: subColor }}>{sign.quality}</Text>
                    </View>
                  </View>
                </View>
                {sign.id === SIGNS[userSignIndex].id && (
                  <View style={{ backgroundColor: goldColor, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>TWÓJ ZNAK</Text>
                  </View>
                )}
              </View>

              {/* Meta row */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'WŁADCA', val: sign.ruler },
                  { label: 'DOM', val: sign.house },
                  { label: 'POLARNOŚĆ', val: sign.polarity },
                ].map((m) => (
                  <View key={m.label} style={{ flex: 1, backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 10, alignItems: 'center' }}>
                    <Text style={{ fontSize: 8, color: subColor, letterSpacing: 1 }}>{m.label}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: textColor, marginTop: 3 }}>{m.val}</Text>
                  </View>
                ))}
              </View>

              {/* Description */}
              <Text style={{ fontSize: 13, color: subColor, lineHeight: 21, marginBottom: 14 }}>{sign.desc}</Text>

              {/* Traits */}
              <Text style={{ fontSize: 10, color: sign.color, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>KLUCZOWE CECHY</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {sign.traits.map((t) => (
                  <View key={t} style={{ backgroundColor: `${sign.color}20`, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: `${sign.color}44` }}>
                    <Text style={{ fontSize: 11, color: sign.color, fontWeight: '600' }}>{t}</Text>
                  </View>
                ))}
              </View>

              {/* Tabs */}
              <View style={{ flexDirection: 'row', backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 3, marginBottom: 14 }}>
                {TABS.map((tab) => (
                  <Pressable
                    key={tab.key}
                    onPress={() => { HapticsService.notify(); setActiveTab(tab.key); }}
                    style={{
                      flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center',
                      backgroundColor: activeTab === tab.key
                        ? (isLight ? '#fff' : 'rgba(255,255,255,0.12)')
                        : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: activeTab === tab.key ? '700' : '400', color: activeTab === tab.key ? textColor : subColor }}>
                      {tab.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Tab Content */}
              {activeTab === 'info' && (
                <View>
                  {/* Strengths */}
                  <Text style={{ fontSize: 10, color: '#2ECC71', fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>MOCNE STRONY</Text>
                  {sign.strengths.map((s, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#2ECC71', marginTop: 5, marginRight: 8 }} />
                      <Text style={{ flex: 1, fontSize: 13, color: textColor, lineHeight: 19 }}>{s}</Text>
                    </View>
                  ))}

                  {/* Shadow traits */}
                  <Text style={{ fontSize: 10, color: '#E74C3C', fontWeight: '700', letterSpacing: 1.5, marginTop: 12, marginBottom: 8 }}>CIEŃ</Text>
                  {sign.shadows.map((s, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E74C3C', marginTop: 5, marginRight: 8 }} />
                      <Text style={{ flex: 1, fontSize: 13, color: subColor, lineHeight: 19 }}>{s}</Text>
                    </View>
                  ))}

                  {/* Associations */}
                  <Text style={{ fontSize: 10, color: sign.color, fontWeight: '700', letterSpacing: 1.5, marginTop: 12, marginBottom: 8 }}>SKOJARZENIA</Text>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      { k: 'KAMIEŃ', v: sign.crystal },
                      { k: 'ZIOŁO', v: sign.herb },
                      { k: 'KOLOR', v: sign.color_assoc },
                      { k: 'CIAŁO', v: sign.bodyPart },
                    ].map((a) => (
                      <View key={a.k} style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10, minWidth: '44%', flex: 1 }}>
                        <Text style={{ fontSize: 8, color: subColor, letterSpacing: 1 }}>{a.k}</Text>
                        <Text style={{ fontSize: 11, color: textColor, marginTop: 3, fontWeight: '600' }}>{a.v}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Career */}
                  <Text style={{ fontSize: 10, color: sign.color, fontWeight: '700', letterSpacing: 1.5, marginTop: 12, marginBottom: 8 }}>KARIERY I POWOŁANIA</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {sign.career.map((c) => (
                      <View key={c} style={{ backgroundColor: `${sign.color}18`, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontSize: 11, color: sign.color }}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {activeTab === 'decans' && decans && (
                <View>
                  {(['d1', 'd2', 'd3'] as const).map((dk, di) => {
                    const d = decans[dk];
                    return (
                      <View key={dk} style={{
                        backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                        borderRadius: 14, padding: 14, marginBottom: 10,
                        borderLeftWidth: 3, borderLeftColor: sign.color,
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: sign.color, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{di + 1}</Text>
                          </View>
                          <View>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>Dekan {di + 1}</Text>
                            <Text style={{ fontSize: 10, color: subColor }}>{d.dates}</Text>
                          </View>
                          <View style={{ flex: 1 }} />
                          <View style={{ backgroundColor: `${sign.color}22`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                            <Text style={{ fontSize: 10, color: sign.color, fontWeight: '600' }}>{d.ruler}</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 12, color: subColor, lineHeight: 18 }}>{d.desc}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {activeTab === 'aspects' && (
                <AspectDiagram signIndex={selectedIndex} isLight={isLight} />
              )}
            </LinearGradient>
          </Animated.View>

          {/* ── Compatibility Section ── */}
          <Animated.View entering={FadeInDown.delay(120).springify()} style={{
            marginHorizontal: layout.padding.screen, marginBottom: 16,
            backgroundColor: cardBg, borderRadius: 18,
            borderWidth: 1, borderColor: cardBorder,
            padding: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Heart size={16} color="#E74C3C" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: goldColor, letterSpacing: 1.5 }}>KOMPATYBILNOŚĆ ZNAKOWA</Text>
            </View>
            <CompatGrid signId={sign.id} isLight={isLight} />
            <Text style={{ fontSize: 10, color: subColor, marginTop: 10, lineHeight: 15 }}>
              Zielony = wysoka harmonia · Złoty = dobra · Niebieski = neutralny · Czerwony = napięcie, które uczy
            </Text>
          </Animated.View>

          {/* ── Moon in Sign ── */}
          <Animated.View entering={FadeInDown.delay(160).springify()} style={{
            marginHorizontal: layout.padding.screen, marginBottom: 16,
            borderRadius: 18, overflow: 'hidden',
            borderWidth: 1, borderColor: isLight ? 'rgba(100,80,160,0.25)' : 'rgba(120,100,200,0.25)',
          }}>
            <LinearGradient
              colors={isLight ? ['rgba(100,80,160,0.1)', 'rgba(100,80,160,0.03)'] : ['rgba(120,100,200,0.15)', 'rgba(120,100,200,0.04)']}
              style={{ padding: 16 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Moon size={18} color="#9B59B6" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#9B59B6', letterSpacing: 1.5 }}>KSIĘŻYC W {sign.pl.toUpperCase()}</Text>
              </View>
              <Text style={{ fontSize: 13, color: subColor, lineHeight: 21 }}>{sign.moonMeaning}</Text>
            </LinearGradient>
          </Animated.View>

          {/* ── AI Oracle Forecast ── */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={{
            marginHorizontal: layout.padding.screen, marginBottom: 16,
            borderRadius: 18, overflow: 'hidden',
            borderWidth: 1, borderColor: isLight ? 'rgba(206,174,114,0.3)' : 'rgba(206,174,114,0.22)',
          }}>
            <LinearGradient
              colors={isLight ? ['#FAF0DC', '#F8EBD0'] : ['#12100A', '#1A1508']}
              style={{ padding: 16 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Sparkles size={18} color={goldColor} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>Oracle Horoskop</Text>
              </View>
              <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 12 }}>
                Poproś Oracle o duchowy horoskop dla znaku {sign.pl}. Otrzymasz poetycką, mądrą analizę lekcji duszy tego znaku.
              </Text>

              <Pressable
                onPress={handleAiForecast}
                disabled={aiLoading}
                style={{
                  backgroundColor: sign.color,
                  borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  opacity: aiLoading ? 0.7 : 1,
                }}
              >
                {aiLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                    <Sparkles size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Horoskop dla {sign.pl} z Oracle</Text>
                  </>
                }
              </Pressable>

              {aiLoading && <SkeletonLoader2 isLight={isLight} />}

              {!!aiError && (
                <View style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(231,76,60,0.12)', borderRadius: 10 }}>
                  <Text style={{ fontSize: 12, color: '#E74C3C' }}>{aiError}</Text>
                </View>
              )}

              {!!aiResponse && !aiLoading && (
                <Animated.View
                  entering={FadeInDown.springify()}
                  style={{
                    marginTop: 14, padding: 14,
                    backgroundColor: isLight ? `${sign.color}15` : `${sign.color}12`,
                    borderRadius: 14,
                    borderLeftWidth: 3,
                    borderLeftColor: sign.color,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 16, marginRight: 8 }}>{sign.symbol}</Text>
                    <Text style={{ fontSize: 10, color: sign.color, fontWeight: '700', letterSpacing: 1.5 }}>ORACLE O {sign.pl.toUpperCase()}</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: textColor, lineHeight: 22, fontStyle: 'italic' }}>
                    {aiResponse}
                  </Text>
                </Animated.View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ── Compatibility Best Matches Detail ── */}
          <Animated.View entering={FadeInDown.delay(240).springify()} style={{
            marginHorizontal: layout.padding.screen, marginBottom: 16,
            backgroundColor: cardBg, borderRadius: 18,
            borderWidth: 1, borderColor: cardBorder, padding: 16,
          }}>
            <Text style={{ fontSize: 10, color: goldColor, fontWeight: '700', letterSpacing: 2, marginBottom: 12 }}>NAJLEPSZE DOPASOWANIA</Text>
            {sign.compatibility.map((compPl) => {
              const compSign = SIGNS.find((s) => s.pl === compPl) || SIGNS[0];
              return (
                <Pressable
                  key={compPl}
                  onPress={() => { handleSelectSign(SIGNS.indexOf(compSign)); scrollRef.current?.scrollTo({ y: 0, animated: true }); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                    borderRadius: 12, padding: 12, marginBottom: 8,
                    borderWidth: 1, borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: compSign.color, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 18, color: '#fff' }}>{compSign.symbol}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{compSign.pl}</Text>
                    <Text style={{ fontSize: 11, color: subColor }}>{compSign.element} · {compSign.quality}</Text>
                  </View>
                  <ChevronRight size={14} color={subColor} />
                </Pressable>
              );
            })}
          </Animated.View>

          {/* ── Learning Cards ── */}
          <View style={{ marginHorizontal: layout.padding.screen, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <BookOpen size={16} color={goldColor} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: goldColor, letterSpacing: 2 }}>WIEDZA ASTROLOGICZNA</Text>
            </View>
            {LEARNING_CARDS.map((lc, i) => (
              <Animated.View key={lc.title} entering={FadeInDown.delay(280 + i * 60).springify()}>
                <Pressable
                  onPress={() => { HapticsService.notify(); setExpandedLearn(expandedLearn === i ? null : i); }}
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: 14, marginBottom: 8,
                    borderWidth: 1, borderColor: expandedLearn === i ? `${lc.color}50` : cardBorder,
                    overflow: 'hidden',
                  }}
                >
                  {expandedLearn === i && <View style={{ height: 2, backgroundColor: lc.color, opacity: 0.7 }} />}
                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                    <Text style={{ fontSize: 22, marginRight: 12 }}>{lc.icon}</Text>
                    <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: textColor }}>{lc.title}</Text>
                    {expandedLearn === i
                      ? <ChevronUp size={16} color={subColor} />
                      : <ChevronDown size={16} color={subColor} />
                    }
                  </View>
                  {expandedLearn === i && (
                    <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                      <Text style={{ fontSize: 13, color: subColor, lineHeight: 21 }}>{lc.content}</Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {/* ── All Signs Quick Reference ── */}
          <Animated.View entering={FadeInDown.delay(380).springify()} style={{
            marginHorizontal: layout.padding.screen,
            backgroundColor: cardBg, borderRadius: 18,
            borderWidth: 1, borderColor: cardBorder, padding: 16, marginBottom: 16,
          }}>
            <Text style={{ fontSize: 10, color: goldColor, fontWeight: '700', letterSpacing: 2, marginBottom: 14 }}>SZYBKI PRZEGLĄD — 12 ZNAKÓW</Text>
            {SIGNS.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => { handleSelectSign(SIGNS.indexOf(s)); scrollRef.current?.scrollTo({ y: 0, animated: true }); }}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 9,
                  borderBottomWidth: 1,
                  borderBottomColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                }}
              >
                <Text style={{ fontSize: 18, width: 32, textAlign: 'center', color: s.color }}>{s.symbol}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: s.id === sign.id ? '700' : '400', color: textColor }}>{s.pl}</Text>
                  <Text style={{ fontSize: 10, color: subColor }}>{s.dates}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 10, color: ELEMENT_COLORS[s.element], fontWeight: '600' }}>{s.element}</Text>
                  <Text style={{ fontSize: 10, color: subColor }}>{s.ruler}</Text>
                </View>
              </Pressable>
            ))}
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};
