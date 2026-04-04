import React, { useMemo, useState, useEffect } from 'react';
import {
  Pressable, ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform, Text, Dimensions, Modal, TextInput
} from 'react-native';
import { MysticalInput } from '../components/MysticalInput';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, G, Text as SvgText } from 'react-native-svg';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ArrowRight, ChevronLeft, Heart, Moon, Sparkles, Sun,
  Users, Zap, Star, Brain, BookOpen, Globe, Compass,
  TrendingUp, Shield, Wind, Flame
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { SoulEngineService } from '../core/services/soulEngine.service';
import { getZodiacSign, ZODIAC_SYMBOLS, ZodiacSign } from '../features/horoscope/utils/astrology';
import { getChineseZodiac } from '../features/horoscope/data/chineseZodiac';
import { goBackOrToMainTab, navigateToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { PremiumDatePickerSheet } from '../components/PremiumDatePickerSheet';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { formatLocaleDate } from '../core/utils/localeFormat';

const { width: SW } = Dimensions.get('window');

// ── ZODIAC SVG ────────────────────────────────────────────────
const ZodiacSVG: Record<ZodiacSign, (color: string, size: number) => React.ReactNode> = {
  Aries: (c, s) => <Svg width={s} height={s} viewBox="0 0 48 48"><Path d="M24 38C24 38 14 28 14 18C14 12 18 8 24 8C30 8 34 12 34 18C34 28 24 38 24 38Z" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/><Path d="M24 8C22 4 17 4 15 7" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/><Path d="M24 8C26 4 31 4 33 7" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/><Line x1="24" y1="30" x2="24" y2="42" stroke={c} strokeWidth={2} strokeLinecap="round"/></Svg>,
  Taurus: (c, s) => <Svg width={s} height={s} viewBox="0 0 48 48"><Circle cx="24" cy="28" r="11" stroke={c} strokeWidth={2} fill="none"/><Path d="M13 28C13 28 13 18 24 14C35 18 35 28 35 28" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/><Path d="M13 19C9 17 7 12 10 8" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/><Path d="M35 19C39 17 41 12 38 8" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/></Svg>,
  Gemini: (c, s) => <Svg width={s} height={s} viewBox="0 0 48 48"><Line x1="16" y1="8" x2="16" y2="40" stroke={c} strokeWidth={2} strokeLinecap="round"/><Line x1="32" y1="8" x2="32" y2="40" stroke={c} strokeWidth={2} strokeLinecap="round"/><Path d="M16 8C20 6 28 6 32 8" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/><Path d="M16 40C20 42 28 42 32 40" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/><Path d="M16 24C20 22 28 22 32 24" stroke={c} strokeWidth={1.5} fill="none" strokeLinecap="round"/></Svg>,
  Cancer: (c, s) => <Svg width={s} height={s} viewBox="0 0 48 48"><Path d="M10 28C10 20 17 14 24 14C31 14 38 20 38 28" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/><Circle cx="9" cy="27" r="3.5" stroke={c} strokeWidth={1.8} fill="none"/><Circle cx="39" cy="27" r="3.5" stroke={c} strokeWidth={1.8} fill="none"/></Svg>,
  Leo: (c, s) => <Svg width={s} height={s} viewBox="0 0 48 48"><Circle cx="18" cy="18" r="8" stroke={c} strokeWidth={2} fill="none"/><Path d="M26 18C30 14 36 14 38 20C40 28 34 38 28 40" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/><Path d="M28 40C26 43 22 43 22 39" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/></Svg>,
  Virgo: (c, s) => <Svg width={s} height={s} viewBox="0 0 48 48"><Line x1="14" y1="8" x2="14" y2="36" stroke={c} strokeWidth={2} strokeLinecap="round"/><Line x1="22" y1="8" x2="22" y2="36" stroke={c} strokeWidth={2} strokeLinecap="round"/><Path d="M14 18C18 14 26 14 30 18C34 22 34 30 30 34C28 36 26 37 22 37" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/></Svg>,
  Libra: (c, s) => <Svg width={s} height={s} viewBox="0 0 48 48"><Line x1="10" y1="34" x2="38" y2="34" stroke={c} strokeWidth={2} strokeLinecap="round"/><Line x1="24" y1="34" x2="24" y2="14" stroke={c} strokeWidth={2} strokeLinecap="round"/><Path d="M14 24C14 18 19 14 24 14C29 14 34 18 34 24" stroke={c} strokeWidth={1.8} fill="none" strokeLinecap="round"/></Svg>,
  Scorpio: (c, s) => <Svg width={s} height={s} viewBox="0 0 48 48"><Line x1="12" y1="8" x2="12" y2="32" stroke={c} strokeWidth={2} strokeLinecap="round"/><Line x1="20" y1="8" x2="20" y2="32" stroke={c} strokeWidth={2} strokeLinecap="round"/><Path d="M12 20C16 14 24 14 28 20C32 26 32 34 28 36" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/><Path d="M12 32C18 32 28 32 34 36C36 38 38 36 36 34" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"/></Svg>,
  Sagittarius: (c, s) => <Svg width={s} height={s} viewBox="0 0 48 48"><Line x1="10" y1="38" x2="38" y2="10" stroke={c} strokeWidth={2} strokeLinecap="round"/><Path d="M22 10L38 10L38 26" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"/></Svg>,
  Capricorn: (c, s) => <Svg width={s} height={s} viewBox="0 0 48 48"><Path d="M12 8C12 8 12 24 12 28C12 35 17 39 23 39" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/><Path d="M12 22C14 16 20 14 26 16C32 18 36 25 34 32C32 38 26 40 22 39" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/></Svg>,
  Aquarius: (c, s) => <Svg width={s} height={s} viewBox="0 0 48 48"><Path d="M8 20C12 16 14 24 18 20C22 16 24 24 28 20C32 16 34 24 38 20" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/><Path d="M8 30C12 26 14 34 18 30C22 26 24 34 28 30C32 26 34 34 38 30" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/></Svg>,
  Pisces: (c, s) => <Svg width={s} height={s} viewBox="0 0 48 48"><Path d="M16 10C10 16 10 24 10 24C10 24 10 32 16 38" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/><Path d="M32 10C38 16 38 24 38 24C38 24 38 32 32 38" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round"/><Line x1="10" y1="24" x2="38" y2="24" stroke={c} strokeWidth={1.5} strokeLinecap="round"/></Svg>,
};

// ── DANE ZODIAKU ──────────────────────────────────────────────
const ZODIAC_LABELS: Record<ZodiacSign, string> = {
  Aries: 'Baran', Taurus: 'Byk', Gemini: 'Bli\u017ani\u0119ta', Cancer: 'Rak',
  Leo: 'Lew', Virgo: 'Panna', Libra: 'Waga', Scorpio: 'Skorpion',
  Sagittarius: 'Strzelec', Capricorn: 'Koziorożec', Aquarius: 'Wodnik', Pisces: 'Ryby',
};
const ZODIAC_DATES: Record<ZodiacSign, string> = {
  Aries: '21.03 – 19.04', Taurus: '20.04 – 20.05', Gemini: '21.05 – 20.06', Cancer: '21.06 – 22.07',
  Leo: '23.07 – 22.08', Virgo: '23.08 – 22.09', Libra: '23.09 – 22.10', Scorpio: '23.10 – 21.11',
  Sagittarius: '22.11 – 21.12', Capricorn: '22.12 – 19.01', Aquarius: '20.01 – 18.02', Pisces: '19.02 – 20.03',
};
const ZODIAC_ELEMENTS: Record<ZodiacSign, string> = {
  Aries: 'Ogień', Taurus: 'Ziemia', Gemini: 'Powietrze', Cancer: 'Woda',
  Leo: 'Ogień', Virgo: 'Ziemia', Libra: 'Powietrze', Scorpio: 'Woda',
  Sagittarius: 'Ogień', Capricorn: 'Ziemia', Aquarius: 'Powietrze', Pisces: 'Woda',
};
const ZODIAC_PLANETS: Record<ZodiacSign, string> = {
  Aries: 'Mars', Taurus: 'Wenus', Gemini: 'Merkury', Cancer: 'Księżyc',
  Leo: 'Słońce', Virgo: 'Merkury', Libra: 'Wenus', Scorpio: 'Pluton',
  Sagittarius: 'Jowisz', Capricorn: 'Saturn', Aquarius: 'Uran', Pisces: 'Neptun',
};
const ZODIAC_MODALITY: Record<ZodiacSign, string> = {
  Aries: 'Kardynalny', Taurus: 'Stały', Gemini: 'Zmienny', Cancer: 'Kardynalny',
  Leo: 'Stały', Virgo: 'Zmienny', Libra: 'Kardynalny', Scorpio: 'Stały',
  Sagittarius: 'Zmienny', Capricorn: 'Kardynalny', Aquarius: 'Stały', Pisces: 'Zmienny',
};
const ZODIAC_TRAITS: Record<ZodiacSign, string[]> = {
  Aries: ['Inicjatywa', 'Odwaga', 'Pasja', 'Przywódca'], Taurus: ['Wytrwałość', 'Zmysłowość', 'Stabilność', 'Cierpliwość'],
  Gemini: ['Komunikacja', 'Ciekawość', 'Adaptacja', 'Intelekt'], Cancer: ['Intuicja', 'Empatia', 'Opiekuńczość', 'Pamięć'],
  Leo: ['Kreatywność', 'Szczodrość', 'Przywództwo', 'Lojalność'], Virgo: ['Precyzja', 'Służba', 'Analiza', 'Praktyczność'],
  Libra: ['Równowaga', 'Harmonia', 'Sprawiedliwość', 'Dyplomacja'], Scorpio: ['Transformacja', 'Głębia', 'Intensywność', 'Regeneracja'],
  Sagittarius: ['Ekspansja', 'Filozofia', 'Wolność', 'Optymizm'], Capricorn: ['Ambicja', 'Dyscyplina', 'Struktura', 'Wytrwałość'],
  Aquarius: ['Innowacja', 'Humanitaryzm', 'Oryginalność', 'Wizja'], Pisces: ['Mistycyzm', 'Współczucie', 'Intuicja', 'Wrażliwość'],
};
const ZODIAC_COLORS: Record<ZodiacSign, { primary: string; bg: string; darkBg: string }> = {
  Aries: { primary: '#E8705A', bg: '#FDF2EF', darkBg: '#120402' }, Taurus: { primary: '#A8873A', bg: '#FBF6EC', darkBg: '#100A02' },
  Gemini: { primary: '#5B8FD4', bg: '#EEF4FC', darkBg: '#020A12' }, Cancer: { primary: '#6B8FCC', bg: '#EEF3FB', darkBg: '#020810' },
  Leo: { primary: '#D4903A', bg: '#FBF4EB', darkBg: '#100800' }, Virgo: { primary: '#5A9A6A', bg: '#EEF8F1', darkBg: '#020C06' },
  Libra: { primary: '#C06898', bg: '#FAF0F5', darkBg: '#10040A' }, Scorpio: { primary: '#9A5AAA', bg: '#F5EEF8', darkBg: '#0A020E' },
  Sagittarius: { primary: '#D47840', bg: '#FCF3EC', darkBg: '#100602' }, Capricorn: { primary: '#8A8A7A', bg: '#F5F5F2', darkBg: '#08080C' },
  Aquarius: { primary: '#4AAAB8', bg: '#EDFAFC', darkBg: '#020C10' }, Pisces: { primary: '#7878CC', bg: '#F0F0FB', darkBg: '#040412' },
};

const ZODIAC_WEEKLY_PROPHECY: Record<ZodiacSign, string> = {
  Aries: 'Ten tydzień przynosi intensywny Marsowy napęd — jesteś gotowy na inicjatywę, której dawno nie podejmowałeś. Nie czekaj na idealne warunki. Jeden odważny krok teraz przyspiesza całą resztę. Uważaj jednak na impulsywne decyzje w relacjach — Mars w napięciu z Wenus może tworzyć tarcia tam, gdzie potrzebujesz łagodności.',
  Taurus: 'Wenus sprzyja Ci — twórcze projekty, relacje i finanse zyskują naturalny impuls. To dobry tydzień, by zakotwiczyć to, czego naprawdę pragniesz i nie dać się ponieść presji otoczenia. Saturna tranzyt wzmacnia potrzebę struktury — zbuduj rutynę, która będzie służyć długo.',
  Gemini: 'Merkury aktywuje Twoją zdolność komunikacji i szybkiego myślenia. Idee napływają gęsto — zapisz je zanim przepłyną. Rozmowy, które zaczniesz w tym tygodniu, mogą zmienić tor ważnych spraw. Uważaj jednak na informacyjny przesyt — mózg potrzebuje ciszy, by przetworzyć to, co zbierasz.',
  Cancer: 'Księżyc jako Twój władca prowadzi Cię przez emocjonalne przypływy i odpływy. Ten tydzień stawia emocje w centrum — nie odpychaj tego, co czujesz. Intuicja jest na poziomie szczytowym. Ważna osoba z przeszłości może dać o sobie znać — zdecyduj, czy chcesz otworzyć tę bramę.',
  Leo: 'Słońce wzmacnia Twoją naturalną charyzę i potrzebę widzialności. To tydzień na wielkie gesty, odważne wystąpienia i deklaracje. Kreatywność jest na szczycie — użyj jej. W środę i czwartek energia jest szczególnie korzystna dla projektów twórczych i miłości. Lew w pełni blasku — bądź tym.',
  Virgo: 'Merkury w tranzytowaniu przez Twoją strefę pracy przynosi precyzję i produktywność. To tydzień na dopracowanie szczegółów, naprawienie tego, co kuleje, i stworzenie systemów, które oszczędzą Ci energii na miesiące. Nie zapomnij jednak, że perfekcja bywa wrogiem gotowości — puść coś z rąk i patrz, co się stanie.',
  Libra: 'Wenus w harmonii z Twoim znakiem tworzy magnetyczną aurę wokół relacji. Nowe i stare połączenia ożywają. Jeśli czekałeś na odpowiedni moment na ważną rozmowę — ten tydzień jest nim. Saturna obecność przypomina jednak: prawdziwa równowaga wymaga granic, nie tylko dyplomacji.',
  Scorpio: 'Pluton głęboko pracuje nad transformacją, której prawdopodobnie jeszcze nie w pełni rozumiesz. Ten tydzień przynosi kluczowe odkrycie dotyczące czegoś ukrytego — finansów, relacji lub własnej psychiki. Nie uciekaj od głębiny. To właśnie w tym, czego się boisz, czeka odpowiedź.',
  Sagittarius: 'Jowisz aktywuje ekspansję w obszarze, który na to czekał. Podróż — fizyczna lub wewnętrzna — przyniesie wgląd, którego nie da Ci żadna książka. W tym tygodniu intuicja filozoficzna jest celna — ufaj przeczuciom dotyczącym kierunku, w którym chcesz iść. Wolność wymaga jednak odpowiedzialności.',
  Capricorn: 'Saturn — Twój władca — wchodzi w fazę, która nagradza cierpliwość i dyscyplinę. To, co budowałeś mozolnie przez ostatnie miesiące, zaczyna dawać realne wyniki. Nie spiesz się z oceną — procesy kapricornowe działają długo, ale solidnie. W tym tygodniu najważniejsza jest konsekwencja.',
  Aquarius: 'Uran pobudza Twoją innowacyjność w niespodziewany sposób. Wpadniesz na pomysł, który na pozór wygląda nieracjonalnie — nie odrzucaj go od razu. Rewolucyjne zmiany często zaczynają się od iskry. Społeczność, z którą jesteś związany, staje się ważnym zasobem — podziel się swoją wizją.',
  Pisces: 'Neptun zanurza Cię w intuicyjny ocean — sny, synchroniczności i przeczucia są teraz niezwykle wymowne. Prowadź dziennik. Twórcza i duchowa praca jest w tym tygodniu wyjątkowo płodna. Uważaj jednak na granicę między empatią a pochłanianiem cudzych energii — chronij swoje pole.',
};
const ZODIAC_SHADOW: Record<ZodiacSign, string> = {
  Aries: 'Impulsywność, brak cierpliwości', Taurus: 'Upór, materializm', Gemini: 'Powierzchowność, rozproszenie',
  Cancer: 'Nadwrażliwość, zamknięcie', Leo: 'Egotyzm, potrzeba uznania', Virgo: 'Perfekcjonizm, krytycyzm',
  Libra: 'Niezdecydowanie, unikanie konfliktu', Scorpio: 'Zazdrość, obsesja', Sagittarius: 'Brak taktu, nieodpowiedzialność',
  Capricorn: 'Chłód emocjonalny, pracoholizm', Aquarius: 'Oderw. od emocji, buntowniczość', Pisces: 'Ucieczka od rzeczywistości, naiwność',
};
const ZODIAC_COMPATIBILITY: Record<ZodiacSign, ZodiacSign[]> = {
  Aries: ['Leo', 'Sagittarius', 'Aquarius'], Taurus: ['Virgo', 'Capricorn', 'Cancer'],
  Gemini: ['Libra', 'Aquarius', 'Aries'], Cancer: ['Scorpio', 'Pisces', 'Taurus'],
  Leo: ['Aries', 'Sagittarius', 'Gemini'], Virgo: ['Taurus', 'Capricorn', 'Cancer'],
  Libra: ['Gemini', 'Aquarius', 'Leo'], Scorpio: ['Cancer', 'Pisces', 'Virgo'],
  Sagittarius: ['Aries', 'Leo', 'Aquarius'], Capricorn: ['Taurus', 'Virgo', 'Scorpio'],
  Aquarius: ['Gemini', 'Libra', 'Sagittarius'], Pisces: ['Cancer', 'Scorpio', 'Taurus'],
};
const ZODIAC_LIFE_AREAS: Record<ZodiacSign, { love: string; work: string; health: string; finance: string }> = {
  Aries: { love: 'Szukasz intensywności i wzajemnego zapalenia. Potrzebujesz partnera, który nie gasi Twojego ognia.', work: 'Najlepiej w roli lidera lub pioniera. Initiattywa i odwaga to Twoje narzędzia.', health: 'Uważaj na głowę i nadnercza. Ruch jest dla Ciebie lekarstwem.', finance: 'Masz naturalny talent do szybkiego zarabiania, ale też do szybkiego wydawania. Buduj fundament.' },
  Taurus: { love: 'Budujesz powoli, ale lojalnie. Potrzebujesz stabilności i zmysłowego połączenia.', work: 'Najlepszy w projektach długoterminowych, finansach i sztuce. Konsekwencja to Twoja siła.', health: 'Dbaj o kark i gardło. Rytm i spokój to Twoje lekarstwo.', finance: 'Naturalny budowniczy majątku. Inwestujesz ostrożnie, ale skutecznie.' },
  Gemini: { love: 'Potrzebujesz intelektualnej stymulacji i wolności. Rozmowa jest miłością.', work: 'Komunikacja, media, edukacja, handel — tu błyszczycie. Zmienność to atut.', health: 'Dbaj o płuca i układ nerwowy. Zbyt dużo bodźców Cię drenuje.', finance: 'Masz wiele pomysłów na dochody. Kluczem jest nie rozpraszać się za bardzo.' },
  Cancer: { love: 'Głęboka lojalność i emocjonalne połączenie. Potrzebujesz bezpieczeństwa, by się otworzyć.', work: 'Opieka, edukacja, gastronomia, psychologia — tam gdzie pomagasz ludziom.', health: 'Żołądek i emocje są połączone. Spokój wewnętrzny to Twoje zdrowie.', finance: 'Instynktownie chronisz zasoby. Dom jest Twoją inwestycją.' },
  Leo: { love: 'Potrzebujesz admiracji i wzajemnej lojalności. Kochasz intensywnie i z dramatem.', work: 'Scena, zarządzanie, kreatywność i przywództwo. Potrzebujesz widoczności.', health: 'Serce i kręgosłup wymagają uwagi. Ruch i radość są lekarstwem.', finance: 'Lubisz luksus, ale masz też talent do zarabiania dużych kwot przez odwagę.' },
  Virgo: { love: 'Okazujesz miłość przez służbę i dbałość. Potrzebujesz partnera, który doceni szczegóły.', work: 'Analityka, medycyna, edukacja, organizacja — mistrz precyzji.', health: 'Układ pokarmowy i nerwy są Twoim centrum. Porządek to Twoje lekarstwo.', finance: 'Ostrożny i metodyczny. Budujesz bezpieczeństwo przez planowanie.' },
  Libra: { love: 'Harmonia i estetyka w związku są kluczowe. Unikasz konfliktów nawet kosztem siebie.', work: 'Prawo, dyplomacja, sztuka, design — tam gdzie liczy się równowaga.', health: 'Nerki i skóra wymagają uwagi. Harmonia wewnętrzna to Twoje zdrowie.', finance: 'Lubisz jakość. Uczysz się balansu między oszczędzaniem a przyjemnością.' },
  Scorpio: { love: 'Miłość jest dla Ciebie transformacją. Potrzebujesz głębokości, lojalności i prawdy.', work: 'Psychologia, badania, tajne służby, finansowe zarządzanie — głębokość to siła.', health: 'Układ rozrodczy i trawienie. Uwolnienie emocjonalne jest kluczowe dla zdrowia.', finance: 'Naturalny talent do inwestycji i zarządzania zasobami innych.' },
  Sagittarius: { love: 'Wolność i ekspansja są niezbędne. Kochasz partnera, który rośnie razem z Tobą.', work: 'Edukacja, podróże, filozofia, prawo, media — szeroka perspektywa to Twój atut.', health: 'Biodra i wątroba wymagają uwagi. Ruch na świeżym powietrzu to Twoje lekarstwo.', finance: 'Optymizm finansowy może być ryzykowny. Ucz się planowania długoterminowego.' },
  Capricorn: { love: 'Budujesz związek jak inwestycję — powoli, solidnie, na lata. Potrzebujesz szacunku.', work: 'Zarządzanie, finanse, budownictwo, polityka — ambicja i struktura to Twoje narzędzia.', health: 'Kości, stawy i skóra. Stres jest Twoim wrogiem — buduj rytuały odpoczynku.', finance: 'Jeden z najbardziej zdolnych finansowo znaków. Cierpliwość przynosi bogactwo.' },
  Aquarius: { love: 'Przyjaźń jako podstawa związku. Potrzebujesz intelektualnej wolności i szacunku.', work: 'Technologia, nauka, aktywizm, innowacje — tam gdzie zmieniasz świat.', health: 'Łydki i krążenie. Dbaj o regularność snu i kontakty społeczne.', finance: 'Niekonwencjonalne podejście do pieniędzy. Masz talent do przyszłościowych inwestycji.' },
  Pisces: { love: 'Romantyzm i duchowe połączenie. Potrzebujesz partnera, który rozumie Twoją wrażliwość.', work: 'Sztuka, muzyka, uzdrawianie, spirytualność — tam gdzie intuicja prowadzi.', health: 'Stopy i układ limfatyczny. Uważaj na ucieczkę w substancje.', finance: 'Płynne podejście do finansów wymaga nauki granic. Intuicja w inwestycjach może być silna.' },
};
const DAILY_FOCUS: Record<ZodiacSign, { morning: string; afternoon: string; evening: string }> = {
  Aries: { morning: 'Zacznij od jednej odważnej decyzji przed śniadaniem.', afternoon: 'Kanalizuj energię w ruch i inicjatywę.', evening: 'Uspokój ciało przed snem — inaczej myśli będą goniły.' },
  Taurus: { morning: 'Zacznij dzień powoli, z kawą i spokojnym oddechem.', afternoon: 'Buduj — jeden solidny krok naprzód.', evening: 'Zadbaj o ciało: kąpiel, muzyka, dobre jedzenie.' },
  Gemini: { morning: 'Zapisz trzy myśli, które kręcą się w głowie.', afternoon: 'Komunikuj się — rozmowa przyniesie jasność.', evening: 'Zatrzymaj bieg myśli przez ciszę lub medytację.' },
  Cancer: { morning: 'Sprawdź swoje emocje zanim wejdziesz w świat.', afternoon: 'Opiekuj się — sobą lub kimś bliskim.', evening: 'Dom i bezpieczeństwo — idealna pora na rytuały domowe.' },
  Leo: { morning: 'Zaplanuj jeden moment, w którym zaśwjesz.', afternoon: 'Twórz i przewodź — energia jest na Twoim szczycie.', evening: 'Odpocznij z wdzięcznością za uwagę, którą otrzymałeś.' },
  Virgo: { morning: 'Zrób listę — porządek to Twoje lekarstwo.', afternoon: 'Pracuj metodycznie, jeden punkt po punkcie.', evening: 'Puść kontrolę — ciało potrzebuje spokoju.' },
  Libra: { morning: 'Zrób jedno piękne dla siebie przed wyjściem.', afternoon: 'Szukaj równowagi w trudnych rozmowach.', evening: 'Kontakt z bliską osobą przywróci harmonię.' },
  Scorpio: { morning: 'Zbadaj, co czujesz — nie omijaj głębi.', afternoon: 'Skoncentruj się na tym, co ważne. Odetnij resztę.', evening: 'Uwolnij napięcie przez rytuał lub zapis.' },
  Sagittarius: { morning: 'Zaplanuj małą przygodę na dziś.', afternoon: 'Ekspanduj — ucz się lub odkrywaj coś nowego.', evening: 'Refleksja filozoficzna przed snem.' },
  Capricorn: { morning: 'Wyznacz jeden cel na dziś i zacznij od razu.', afternoon: 'Pracuj z konsekwencją — małe kroki budują góry.', evening: 'Pozwól sobie na odpoczynek bez poczucia winy.' },
  Aquarius: { morning: 'Zainspiruj się czymś niekonwencjonalnym.', afternoon: 'Wnoś swoją wyjątkowość w to, co robisz.', evening: 'Odłącz się od technologii i połącz z intuicją.' },
  Pisces: { morning: 'Zapisz sen i pierwszy obraz, który przyszedł po przebudzeniu.', afternoon: 'Twórz — muzyka, zapis, obraz lub rytuał.', evening: 'Granic emocjonalnych strzeż jak świętości.' },
};
const ZODIAC_AFFIRMATIONS: Record<ZodiacSign, string> = {
  Aries: 'Moja odwaga otwiera drzwi, których inni nie widzą.',
  Taurus: 'Buduję stabilność krok po kroku, bez pośpiechu.',
  Gemini: 'Mój intelekt jest mostem między ludźmi i ideami.',
  Cancer: 'Moja intuicja jest kompasem, któremu ufam.',
  Leo: 'Moje światło inspiruje innych bez umniejszania się.',
  Virgo: 'Doskonałość nie wyklucza miłości do siebie.',
  Libra: 'Równowaga zaczyna się ode mnie, nie od innych.',
  Scorpio: 'Każda transformacja przybliża mnie do prawdziwej siły.',
  Sagittarius: 'Moja wolność jest darem, który dzielę z mądrością.',
  Capricorn: 'Cierpliwość i dyscyplina budują moje królestwo.',
  Aquarius: 'Moja wyjątkowość jest darem, nie przekleństwem.',
  Pisces: 'Moja wrażliwość jest siłą, nie słabością.',
};

const ZODIAC_MONTHLY_FORECAST: Record<ZodiacSign, string> = {
  Aries: 'Ten miesiąc aktywuje Marsową dynamikę — inicjatywy, które zaczniesz teraz, będą miały długofalowe skutki. Skup się na odwadze w pracy i autentyczności w relacjach. Mars napędza Twój potencjał twórczy — użyj go bez odkładania.',
  Taurus: 'Wenus przeprowadza Cię przez miesiąc, który nagradza cierpliwość i zmysłowość. Finanse zyskują na stabilności, gdy trzymasz się sprawdzonego kursu. Nowe połączenia emocjonalne mogą przekształcić się w coś trwałego.',
  Gemini: 'Merkury wspiera komunikację na wszystkich frontach — to miesiąc ważnych rozmów, negocjacji i decyzji. Twój intelekt jest na szczycie. Uważaj na rozproszenie energii między zbyt wieloma projektami jednocześnie.',
  Cancer: 'Księżyc jako Twój władca tworzy głęboki miesiąc emocjonalny. Dom, rodzina i bezpieczeństwo są w centrum. Intuicja podpowie Ci więcej niż logika — słuchaj jej. Bliskie relacje wymagają Twojej świadomej obecności.',
  Leo: 'Słońce w szczycie Twojej charyzmy — wszystko, czego dotkniesz, zyska blask. To miesiąc na wielkie decyzje zawodowe i spektakularne gesty miłosne. Świat czeka na Twój głos — nie milcz przez skromność.',
  Virgo: 'Merkury w Twoim znaku przynosi wyjątkową precyzję analityczną. Napraw to, co od miesięcy wymaga uwagi. Zdrowie i rutyna są kluczowe — małe nawyki budowane teraz przynoszą efekty przez cały rok.',
  Libra: 'Wenus otacza Cię aurą piękna i harmonii — relacje rozkwitają. Partnerstwo, zarówno romantyczne jak i zawodowe, jest w centrum. Ważna decyzja wymaga od Ciebie odwagi, nie tylko dyplomacji.',
  Scorpio: 'Pluton uruchamia głęboki cykl transformacji. Coś, co trzymasz za zasłoną, chce wyjść na światło. Ten miesiąc nagradza odwagę bycia autentycznym. Finansowa i emocjonalna intuicja jest wyjątkowo celna.',
  Sagittarius: 'Jowisz wypycha Cię poza granice — to miesiąc ekspansji w wiedzy, podróżach i filozofii. Nowa perspektywa zmienia to, co myślisz o swoim kierunku. Nie bój się zacząć czegoś wielkiego od małego, zdecydowanego kroku.',
  Capricorn: 'Saturn nagradza wytrwałość — długoterminowe projekty wchodzą w decydującą fazę. Struktury, które budujesz teraz, staną się fundamentem na lata. Odpoczynek to nie słabość — zatrzymaj się i oceń jak daleko dotarłeś.',
  Aquarius: 'Uran aktywuje Twoją innowacyjną strefę — przełomowy pomysł czeka na realizację. Wspólnota jest siłą tego miesiąca. Twoja wyjątkowość przyciąga właściwych sojuszników, jeśli odważysz się ją w pełni pokazać.',
  Pisces: 'Neptun zanurza Cię w twórczą i duchową głębię. Sen, intuicja i synchroniczności są wyjątkowo aktywne. To miesiąc uzdrowienia — wewnętrznego i relacyjnego. Twórcze projekty przyniosą wyniki, które zaskoczą nawet Ciebie.',
};

const ZODIAC_YEARLY_OVERVIEW: Record<ZodiacSign, string> = {
  Aries: '2025 aktywuje Twój kardynalny potencjał — rok wielkich inicjatyw i przełomów w tożsamości. Jowisz wspiera Twój wzrost przez połowę roku. Kluczowe lekcje: cierpliwość po inicjatywie i dbanie o relacje podczas gonienia za celami.',
  Taurus: 'Rok 2025 to konsolidacja i głęboki wewnętrzny reset. Saturn przeprowadza Cię przez restrukturyzację wartości i finansów. To, co budujesz teraz z dyscypliną, wyda owoce przez następne 7 lat. Relacje dojrzewają.',
  Gemini: 'Dualne energie roku 2025 prowadzą Cię przez dwie równoległe ścieżki — zawodową i osobistą. Merkury wspiera komunikację i edukację. Kluczowy punkt: sierpień i wrzesień przyniosą jasność co do głównego kierunku.',
  Cancer: '2025 to rok głębokiego powrotu do domu — dosłownego i metaforycznego. Intensywne cykle emocjonalne przynoszą ewolucję relacji z rodziną. Twoja opiekuńczość zyska nowy wymiar — skieruj ją też ku sobie.',
  Leo: 'Rok 2025 przynosi Ci scenę, której szukałeś. Słońce aktywuje Twój twórczy szczyt w środku roku. Wielki potencjał w karierze i relacjach romantycznych. Lekcja: przywódca, który słucha, jest silniejszy niż ten, który tylko błyszczy.',
  Virgo: '2025 to rok detoksykacji i precyzji. Zdrowie jest priorytetem — ciało i umysł potrzebują nowego podejścia systemowego. Jesienny tranzyt przynosi duchowe przebudzenie, które zmieni Twoje priorytety.',
  Libra: 'Saturn zadaje pytania o granice i autentyczność w relacjach. 2025 to rok trudnych, ale ważnych rozmów. Wenus nagradza tych, którzy wybierają prawdziwe połączenie zamiast wygodnej harmonii. Transformacja relacji.',
  Scorpio: '2025 to rok odkrywania zasłoniętych prawd — finansowych, relacyjnych, duchowych. Odwaga pójścia w głębię jest nagrodzona przełomem. Twoja zdolność do transformacji jest Twoją największą siłą tego roku.',
  Sagittarius: 'Jowisz w Twoim znaku przez znaczną część roku 2025 to rzadki prezent — ekspansja, szczęście i szeroka perspektywa. Nowe możliwości podróżowania i nauki. Lekcja: skup się na jednym wielkim marzeniu, nie dziesiątku małych.',
  Capricorn: 'Saturn w harmonii z Twoim znakiem przynosi rok budowania trwałego dziedzictwa. 2025 nagradza cierpliwość i konsekwencję. Zawodowy szczyt w połowie roku. Lekcja: sukces nie musi kosztować Cię relacji.',
  Aquarius: '2025 to rok rewolucji — najpierw wewnętrznej. Uran aktywuje zmiany, których oczekiwałeś. Nowe sojusze zmieniają Twoje możliwości. Lekcja: innowacja potrzebuje solidnego gruntu, by przetrwać.',
  Pisces: 'Neptun prowadzi przez rok 2025 głębokimi wodami intuicji i twórczości. Czas uzdrowienia starych ran emocjonalnych i otwarcia na nowe duchowe przestrzenie. Twórcze projekty mogą przynieść niespodziewany przełom.',
};

const CHINESE_WEEKLY: Record<string, string> = {
  rat: 'Ten tydzień aktywuje Szczurzy instynkt adaptacji i spryt. Szybkie decyzje przyniosą korzyści — nie wahaj się, gdy okazja jest w zasięgu. Sojusze zawarte w tym tygodniu mają długoterminową wartość.',
  ox: 'Spokojny tydzień dla Wołu — Twoja wytrwałość jest nagrodzona konkretnymi wynikami. Finanse zyskują na stabilności gdy trzymasz kurs. Unikaj pochopnych decyzji w środku tygodnia.',
  tiger: 'Tygrys w pełni mocy — tydzień energii, odwagi i nagłych szans. Działaj bez wahania, instynkt prowadzi trafnie. Charyzma jest szczególnie magnetyczna — prezentacje i ważne spotkania zakończą się sukcesem.',
  rabbit: 'Subtelny tydzień dla Królika — relacje i estetyka są w centrum. Dyplomacja przynosi więcej niż konfrontacja. Intuicja w relacjach jest wyjątkowo celna — słuchaj sygnałów, nie tylko słów.',
  dragon: 'Smok rozbudza pełnię mocy — tydzień prezentacji, sukcesu i widoczności. Twoja energia przyciąga i inspiruje. Wielki gest lub odważna decyzja teraz przyniesie efekty przez długi czas.',
  snake: 'Wąż wchodzi w intuicyjny tryb — cicho obserwuj zanim zadziałasz. Głęboka mądrość jest Twoim głównym atutem. Finansowe i relacyjne sygnały wymagają uważnej analizy pod powierzchnią.',
  horse: 'Koń gna naprzód — tydzień ekspansji, nowych kontaktów i odkrywania nieznanych terytoriów. Swoboda przynosi radość i inspirację. Nie daj się zamknąć w jednym miejscu lub jednej perspektywie.',
  goat: 'Koza szuka harmonii i głębokiego piękna — tydzień twórczości, spokoju i uzdrowienia emocjonalnego. Bliskie relacje wymagają pielęgnacji. Twój artystyczny zmysł jest wyjątkowo wyrazisty.',
  monkey: 'Małpa błyszczy intelektem i sprytem — tydzień nieszablonowych rozwiązań i wesołych niespodzianek. Twoja elastyczność jest największym atutem. Nowe projekty wymagają właśnie Twojego sprytnego podejścia.',
  rooster: 'Kogut w trybie precyzji — tydzień planowania, organizacji i ważnych deklaracji. Mów jasno i konkretnie. Twoja metodyczność przynosi wyniki tam, gdzie inni się gubią w szczegółach.',
  dog: 'Pies stoi na straży lojalności — tydzień bliskich relacji, ochrony wartości i szczerości. Zaufaj instynktowi ochrony. Kluczowa osoba w Twoim życiu potrzebuje Twojej obecnej uwagi.',
  pig: 'Świnia w trybie obfitości i ciepła — tydzień hojności, przyjemności i otwartości na dobre rzeczy. Twoja autentyczność przyciąga właściwych ludzi. Finanse mogą zyskać przez niespodziewane źródło.',
};

const CHINESE_MONTHLY: Record<string, string> = {
  rat: 'Szczur nawiguje ten miesiąc z inteligencją i adaptacją. Finansowe szanse są otwarte — działaj szybko gdy widzisz okno możliwości. Relacje zyskują na głębokości gdy przejdziesz od informacji do autentycznego połączenia.',
  ox: 'Wół buduje solidny fundament przez cały miesiąc. Projekt wymagający cierpliwości i konsekwencji przynosi wymierne efekty. Zdrowie zyskuje gdy trzymasz się sprawdzonej rutyny i regularnego odpoczynku.',
  tiger: 'Tygrys ma magnetyczny miesiąc — charyzma i przywódczy instynkt przyciągają nowe możliwości. Wielki projekt wymaga Twojej pełnej odwagi. Relacje romantyczne są intensywne — działaj z sercem, nie z głową.',
  rabbit: 'Królik przechodzi miesiąc pełen estetycznej harmonii i dyplomatycznych wyzwań. Twoja intuicja w relacjach jest wyjątkowo celna — słuchaj jej. Twórcze projekty rozkwitają gdy dajesz im czas i przestrzeń.',
  dragon: 'Smok w szczycie mocy — ambicja i wizja są Twoimi głównymi narzędziami tego miesiąca. Zawodowe możliwości pojawią się nieoczekiwanie. Twoja energia jest zaraźliwa i autentycznie inspiruje innych.',
  snake: 'Wąż przeprowadza miesiąc głębokiej transformacji. Ukryte prawdy wychodzą na światło — przyjmij je z mądrością zamiast oporu. Finansowa intuicja jest wyjątkowo celna w drugiej połowie miesiąca.',
  horse: 'Koń ma miesiąc pełen dynamiki i zmieniającego się terenu. Nowe ścieżki otwierają się nagle — gotowość na zmianę kierunku jest siłą, nie słabością. Swoboda jest źródłem Twojej wyjątkowej energii.',
  goat: 'Koza przechodzi miesiąc uzdrowienia i twórczego wyrazu. Relacje wymagają troski i cierpliwości — nie spiesz się z wnioskami. Twój artystyczny i emocjonalny świat jest wyjątkowo bogaty — zanurz się w nim.',
  monkey: 'Małpa błyszczy inteligencją i zdolnością adaptacji przez cały miesiąc. Nieoczekiwane zwroty akcji działają na Twoją korzyść gdy zachowujesz elastyczność. Nowe projekty zyskują na Twoim sprytnym podejściu.',
  rooster: 'Kogut wchodzi w miesiąc precyzji i ważnych decyzji. Twój analityczny umysł jest najlepszym przewodnikiem. Zawodowe i finansowe działania wymagają konkretnego planu — improwizacja nie jest Twoją strategią.',
  dog: 'Pies ma miesiąc lojalności i głębokiego zaangażowania. Bliskie relacje są jednocześnie testem i skarbem. Twój instynkt ochrony tych, których kochasz, prowadzi Cię przez trudniejsze chwile trafnie.',
  pig: 'Świnia przechodzi miesiąc obfitości i emocjonalnej otwartości. Finansowe błogosławieństwo przychodzi przez hojność i zaufanie. Relacje romantyczne rozkwitają gdy jesteś szczery i otwarty na głębię połączenia.',
};

const CHINESE_YEARLY: Record<string, string> = {
  rat: '2025 to rok, w którym Szczurowata inteligencja i zdolność adaptacji są nagrodzone. Nowe sojusze i projekty przyniosą długoterminowy wzrost. Kluczowe wyzwanie: nie rozpraszaj energii na zbyt wiele frontów jednocześnie.',
  ox: 'Wół buduje przez 2025 rok stabilny i trwały fundament. Dyscyplina przynosi realne rezultaty. Drugą połowę roku warto poświęcić na relacje, które wymagały więcej Twojej uwagi niż im dawałeś.',
  tiger: 'Tygrys ma wielki rok — naturalny przywódczy potencjał jest w pełni aktywowany. Duże wyzwanie zawodowe lub osobiste staje się Twoim największym triumfem. Lekcja: odwaga bez cierpliwości nie buduje trwałości.',
  rabbit: 'Królik przechodzi 2025 rok z gracją i subtelnością. To rok dyplomatycznych zwycięstw i estetycznych triumfów. Relacje ewoluują — niektóre się pogłębiają, inne naturalnie kończą. To niezbędny porządek.',
  dragon: 'Smok ma rok transformacji i magnetycznej widoczności. Twoja energia przyciąga właściwe możliwości. Wielki projekt zainicjowany w tym roku niesie potencjał długoterminowego, trwałego sukcesu.',
  snake: 'Wąż wchodzi w 2025 z wyjątkową intuicją i mądrością. Rok odkrywania ukrytych zasobów — wewnętrznych i zewnętrznych. Finansowe i duchowe transformacje idą w parze. Zaufaj głębokiej wiedzy, nie powierzchownym danym.',
  horse: 'Koń galoperuje przez 2025 pełen energii i ekspansji. Nowe terytoria — geograficzne lub mentalne — otwierają się szeroko. Rok podróży i wewnętrznych przygód. Lekcja: zatrzymaj się czasem by zobaczyć jak daleko dotarłeś.',
  goat: 'Koza przechodzi 2025 rok twórczego uzdrowienia i emocjonalnej dojrzałości. Relacje zyskują na głębokości. Twoja artystyczna ekspresja może przynieść niespodziewany sukces i uznanie w połowie roku.',
  monkey: 'Małpa ma rok innowacji i przełomowych odkryć. Niekonwencjonalne podejście do problemów przynosi rozwiązania zaskakujące wszystkich. Nowe metody i technologie otwierają nowe możliwości zawodowe.',
  rooster: 'Kogut strukturyzuje 2025 z precyzją i determinacją. Ważne decyzje zawodowe wymagają odwagi i pełnej jasności. To rok autentycznych deklaracji — uczciwość jest Twoją największą siłą.',
  dog: 'Pies przechodzi 2025 rok lojalności i głębokiego zaangażowania w wartości. Bliskie relacje są sferą największego wzrostu. Zawodowe zaangażowanie w coś, w co wierzysz, przynosi trwałą satysfakcję.',
  pig: 'Świnia ma rok obfitości i otwartości serca. Finansowy wzrost przychodzi przez hojność i autentyczność. Relacje romantyczne i rodzinne są centrum roku. Twoja ciepłość przyciąga dokładnie właściwe osoby.',
};

const AREAS_CONFIG = [
  { key: 'love', icon: Heart, label: 'Miłość' },
  { key: 'work', icon: TrendingUp, label: 'Praca' },
  { key: 'health', icon: Shield, label: 'Zdrowie' },
  { key: 'finance', icon: Star, label: 'Finanse' },
] as const;

// ── ELEMENT ZNAKU ─────────────────────────────────────────────
const ELEMENT_ICON: Record<string, React.FC<any>> = {
  'Ogień': Flame,
  'Ziemia': Globe,
  'Powietrze': Wind,
  'Woda': Compass,
};
const ELEMENT_COLOR: Record<string, string> = {
  'Ogień': '#F97316',
  'Ziemia': '#84CC16',
  'Powietrze': '#38BDF8',
  'Woda': '#818CF8',
};
const ELEMENT_DESCRIPTION: Record<ZodiacSign, string> = {
  Aries:
    'Żywioł Ognia nadaje Baranowi wyjątkową zdolność inicjowania i przebijania się przez opór tam, gdzie inne znaki wyczekują sygnału. Twoja energia jest pierwotna i impulsywna — zapalasz iskrę, zanim ktokolwiek zdążył zapytać.',
  Leo:
    'Ogień Lwa płonie jako stałe, królewskie ognisko, które przyciąga i ogrzewa innych swoją hojnością. Twój żywioł wyraża się przez twórczość, serce i potrzebę zostawienia po sobie blasku w świecie.',
  Sagittarius:
    'Ogień Strzelca jest wolny i ekspansywny — szuka horyzontu, nie paleniska. Żywioł ten napędza filozoficzne poszukiwania, optymizm i nieustanne rozszerzanie perspektywy.',
  Taurus:
    'Ziemia Byka jest gęsta, żyzna i cierpliwa — to żywioł, który zamienia marzenia w namacalne struktury. Budujesz powoli, ale to, co stworzysz, przetrwa próbę czasu i zmienności.',
  Virgo:
    'Ziemia Panny wyraża się przez precyzję i służbę — żywioł ten daje zdolność dostrzegania szczegółów, które inni pomijają. Twoja moc leży w doskonaleniu, naprawianiu i czynieniu świata bardziej funkcjonalnym.',
  Capricorn:
    'Ziemia Koziorożca jest skalista i górska — wytrwała wobec wszelkich przeciwności. Żywioł ten nadaje strukturę ambicji i zamienia długoterminową wizję w realne, trwałe osiągnięcia.',
  Gemini:
    'Powietrze Bliźniąt jest szybkie, zmienne i twórcze — to żywioł idei w ciągłym ruchu. Twój umysł jest mostem między perspektywami, a komunikacja jest Twoją najsilniejszą formą magii.',
  Libra:
    'Powietrze Wagi poszukuje harmonii i piękna w każdej wymianie myśli i relacji. Żywioł ten daje Ci wyjątkową wrażliwość na sprawiedliwość i umiejętność dostrzegania racji po obu stronach.',
  Aquarius:
    'Powietrze Wodnika jest elektryczne i rewolucyjne — to żywioł przełomowych idei i zbiorowego przebudzenia. Myślisz wyprzedzając swój czas i widzisz połączenia, których inni jeszcze nie dostrzegli.',
  Cancer:
    'Woda Raka jest głęboka, opiekuńcza i pamięciowa — przechowuje emocje i połączenia jak kryształ pamięta kształt. Twój żywioł daje Ci niezrównaną intuicję i zdolność do autentycznej troski.',
  Scorpio:
    'Woda Skorpiona jest ciemna, transformująca i nieuchronna jak oceański prąd głębinowy. Żywioł ten nadaje Ci dostęp do prawd, które ukryte są pod powierzchnią każdej sytuacji i każdego człowieka.',
  Pisces:
    'Woda Ryb jest bezgraniczna i mistyczna — to żywioł snu, intuicji i łączności z tym, co niewidzialne. Twoja wrażliwość jest portalem do głębszych wymiarów rzeczywistości, które inni jedynie przeczuwają.',
};
const ELEMENT_KEYWORDS: Record<ZodiacSign, string[]> = {
  Aries:       ['Inicjatywa', 'Zapał', 'Odwaga'],
  Leo:         ['Blask', 'Serce', 'Szczodrość'],
  Sagittarius: ['Ekspansja', 'Wolność', 'Optymizm'],
  Taurus:      ['Wytrwałość', 'Zmysłowość', 'Fundament'],
  Virgo:       ['Precyzja', 'Służba', 'Doskonałość'],
  Capricorn:   ['Ambicja', 'Struktura', 'Dziedzictwo'],
  Gemini:      ['Komunikacja', 'Elastyczność', 'Ciekawość'],
  Libra:       ['Harmonia', 'Piękno', 'Równowaga'],
  Aquarius:    ['Innowacja', 'Wizja', 'Humanitaryzm'],
  Cancer:      ['Intuicja', 'Opiekuńczość', 'Pamięć'],
  Scorpio:     ['Transformacja', 'Głębia', 'Regeneracja'],
  Pisces:      ['Mistycyzm', 'Empatia', 'Wrażliwość'],
};

// Kolo zodiaku SVG
const ZodiacWheel = React.memo(({ activeSign, color, size = 160 }: { activeSign: ZodiacSign; color: string; size?: number }) => {
  const signs: ZodiacSign[] = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const r = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {signs.map((sign, i) => {
        const angle = (i * 30 - 90) * Math.PI / 180;
        const x = r + Math.cos(angle) * (r * 0.78);
        const y = r + Math.sin(angle) * (r * 0.78);
        const isActive = sign === activeSign;
        return (
          <G key={sign}>
            <Circle cx={x} cy={y} r={isActive ? 13 : 8}
              fill={isActive ? color : color + '28'}
              stroke={isActive ? color : color + '44'}
              strokeWidth={isActive ? 2 : 1}/>
            <Line x1={r} y1={r} x2={x} y2={y}
              stroke={isActive ? color + '55' : color + '18'}
              strokeWidth={isActive ? 1.2 : 0.4}/>
          </G>
        );
      })}
      <Circle cx={r} cy={r} r={r * 0.28} fill="rgba(255,255,255,0.85)" stroke={color + '33'} strokeWidth={1}/>
    </Svg>
  );
});


// ── 3D ZODIAC WHEEL ────────────────────────────────────────────
const ZODIAC_WHEEL_SIGNS: { sign: ZodiacSign; label: string; symbol: string; color: string }[] = [
  { sign: 'Aries', label: 'Baran', symbol: '♈', color: '#FF6B6B' },
  { sign: 'Taurus', label: 'Byk', symbol: '♉', color: '#4ECDC4' },
  { sign: 'Gemini', label: 'Bliźnięta', symbol: '♊', color: '#FFE66D' },
  { sign: 'Cancer', label: 'Rak', symbol: '♋', color: '#A8E6CF' },
  { sign: 'Leo', label: 'Lew', symbol: '♌', color: '#FFD93D' },
  { sign: 'Virgo', label: 'Panna', symbol: '♍', color: '#C3A6FF' },
  { sign: 'Libra', label: 'Waga', symbol: '♎', color: '#FF8ED4' },
  { sign: 'Scorpio', label: 'Skorpion', symbol: '♏', color: '#FF6B9D' },
  { sign: 'Sagittarius', label: 'Strzelec', symbol: '♐', color: '#FFA07A' },
  { sign: 'Capricorn', label: 'Koziorożec', symbol: '♑', color: '#87CEEB' },
  { sign: 'Aquarius', label: 'Wodnik', symbol: '♒', color: '#98FB98' },
  { sign: 'Pisces', label: 'Ryby', symbol: '♓', color: '#DDA0DD' },
];

const ZodiacWheel3D = React.memo(({ activeSign, accent, onSignPress }: {
  activeSign: ZodiacSign;
  accent: string;
  onSignPress: (sign: ZodiacSign) => void;
}) => {
  const tiltX = useSharedValue(-15);
  const tiltY = useSharedValue(0);
  const autoRot = useSharedValue(0);

  useEffect(() => {
    autoRot.value = withRepeat(withTiming(360, { duration: 60000 }), -1, false);
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tiltY.value = Math.max(-35, Math.min(35, e.translationX * 0.25));
      tiltX.value = Math.max(-35, Math.min(5, -15 + e.translationY * 0.15));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-15, { duration: 1000 });
      tiltY.value = withTiming(0, { duration: 1000 });
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));

  const W = Math.min(layout.window.width - 40, 300);
  const cx = W / 2;
  const R = W * 0.40;
  const cy = W * 0.42;

  return (
    <GestureDetector gesture={panGesture}>
      <View style={{ height: W * 0.90, alignItems: 'center', justifyContent: 'center', marginVertical: 8 }}>
        <Animated.View style={[{ width: W, height: W * 0.90, alignItems: 'center', justifyContent: 'center' }, animStyle]}>
          <Svg width={W} height={W * 0.90}>
            {/* Outer ring */}
            <Circle cx={cx} cy={cy} r={R + 8} fill="none" stroke={accent + '20'} strokeWidth={1.5} />
            <Circle cx={cx} cy={cy} r={R - 8} fill="none" stroke={accent + '15'} strokeWidth={0.7} />
            {/* Inner glow */}
            <Circle cx={cx} cy={cy} r={R * 0.35} fill={accent + '18'} />
            <Circle cx={cx} cy={cy} r={R * 0.25} fill={accent + '28'} />
            <Circle cx={cx} cy={cy} r={R * 0.14} fill={accent + '50'} />
            {/* Spoke lines */}
            {ZODIAC_WHEEL_SIGNS.map((_, i) => {
              const a = (i * 30 - 90) * Math.PI / 180;
              return (
                <Line key={i}
                  x1={cx + R * 0.32 * Math.cos(a)} y1={cy + R * 0.32 * Math.sin(a)}
                  x2={cx + R * 0.92 * Math.cos(a)} y2={cy + R * 0.92 * Math.sin(a)}
                  stroke={accent + '18'} strokeWidth={0.6}
                />
              );
            })}
            {/* Zodiac sign nodes */}
            {ZODIAC_WHEEL_SIGNS.map((item, i) => {
              const a = (i * 30 - 90) * Math.PI / 180;
              const sx = cx + R * Math.cos(a);
              const sy = cy + R * Math.sin(a);
              const isActive = item.sign === activeSign;
              const nodeR = isActive ? 16 : 12;
              return (
                <G key={item.sign} onPress={() => onSignPress(item.sign)}>
                  <Circle cx={sx} cy={sy} r={nodeR + 4} fill={item.color + (isActive ? '30' : '15')} />
                  <Circle cx={sx} cy={sy} r={nodeR} fill={item.color + (isActive ? 'EE' : '55')}
                    stroke={isActive ? item.color : item.color + '80'} strokeWidth={isActive ? 2 : 1}
                  />
                  <SvgText x={sx} y={sy + 4.5} textAnchor="middle"
                    fontSize={isActive ? 13 : 11} fill={isActive ? '#FFF' : '#FFFFFF99'}
                    fontWeight={isActive ? '700' : '400'}
                  >{item.symbol}</SvgText>
                </G>
              );
            })}
          </Svg>
        </Animated.View>
      </View>
    </GestureDetector>
  );
});

export const HoroscopeScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeName, userData, addFavoriteItem, isFavoriteItem, removeFavoriteItem } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');
  const aiAvailable = AiService.isLaunchAvailable();
  const aiState = AiService.getLaunchAvailabilityState();
  const dailyPlan = useMemo(() => SoulEngineService.generateDailyPlan(), []);

  const [activeArea, setActiveArea] = useState<'love' | 'work' | 'health' | 'finance'>('love');
  const [showPicker, setShowPicker] = useState(false);
  const [otherDateValue, setOtherDateValue] = useState(new Date(1990, 0, 1));
  const [otherBirthDate, setOtherBirthDate] = useState('');
  const [viewMode, setViewMode] = useState<'self' | 'other'>('self');
  const [activeTab, setActiveTab] = useState<'dzien' | 'znak' | 'obszary' | 'fokus'>('dzien');
  const [period, setPeriod] = useState<'dzien' | 'tydzien' | 'miesiac' | 'rok'>((route?.params?.initialPeriod as any) || 'dzien');

  // ── DLA KOGOŚ ──
  const [forSomeone, setForSomeone] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerSign, setPartnerSign] = useState<ZodiacSign | null>(null);
  const [showFsModal, setShowFsModal] = useState(false);
  const [fsNameInput, setFsNameInput] = useState('');
  const [fsSignInput, setFsSignInput] = useState<ZodiacSign | null>(null);
  const [otherGender, setOtherGender] = useState<'on' | 'ona'>('ona');

  const activeBirthDate = viewMode === 'other' ? otherBirthDate : userData.birthDate;
  const zodiac = useMemo(() => activeBirthDate ? getZodiacSign(activeBirthDate) : null, [activeBirthDate]);
  const chineseSign = useMemo(() => activeBirthDate ? getChineseZodiac(activeBirthDate) : null, [activeBirthDate]);

  const activeSign = (forSomeone && partnerSign ? partnerSign : zodiac) as ZodiacSign;

  const zodiacColors = activeSign ? ZODIAC_COLORS[activeSign] : { primary: '#A97A39', bg: '#FBF6EE', darkBg: '#0C0802' };
  const accent = zodiacColors.primary;
  const bgColor = isLight ? zodiacColors.bg : (zodiacColors.darkBg || '#0A0608');
  const textColor = isLight ? '#1A1410' : '#F0EBE4';
  const subColor = isLight ? '#6A5A48' : '#9A8E80';
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';

  // Losowe ale deterministyczne score na podstawie dnia i znaku
  const dayScore = useMemo(() => {
    const day = new Date().getDate();
    const signIdx = activeSign ? ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'].indexOf(activeSign) : 0;
    return {
      love: 55 + ((day * 3 + signIdx * 7) % 40),
      work: 50 + ((day * 5 + signIdx * 4) % 45),
      health: 60 + ((day * 2 + signIdx * 6) % 35),
      finance: 45 + ((day * 7 + signIdx * 3) % 50),
      overall: 58 + ((day * 4 + signIdx * 5) % 38),
    };
  }, [zodiac]);

  if (!zodiac) {
    return (
      <View style={[hs.container, { backgroundColor: isLight ? '#F7F1E8' : '#06070C' }]}>
        <SafeAreaView edges={['top']} style={hs.safeArea}>
          <View style={hs.header}>
            <Pressable onPress={() => goBackOrToMainTab(navigation, 'Home')} style={hs.backBtn} hitSlop={14}>
              <ChevronLeft color={currentTheme.primary} size={28} strokeWidth={1.5}/>
            </Pressable>
            <View style={{ flex: 1 }}/>
            <Pressable onPress={() => setViewMode(viewMode === 'self' ? 'other' : 'self')}
              style={[hs.modeBtn, { borderColor: currentTheme.primary + '44', backgroundColor: viewMode === 'other' ? currentTheme.primary + '18' : 'transparent', marginRight: 4 }]}>
              <Users color={currentTheme.primary} size={16} strokeWidth={1.8}/>
            </Pressable>
          </View>
          <View style={hs.emptyState}>
            {viewMode === 'other' ? (
              <>
                <Users color={currentTheme.primary} size={48} strokeWidth={1.2}/>
                <Text style={[hs.emptyTitle, { color: currentTheme.primary }]}>Wybierz datę urodzenia</Text>
                <Text style={[hs.emptySub, { color: isLight ? '#6A5A48' : '#9A8E80' }]}>
                  Podaj datę urodzenia drugiej osoby, aby wyświetlić jej znak i horoskop.
                </Text>
                <Pressable onPress={() => setShowPicker(true)} style={[hs.emptyBtn, { backgroundColor: currentTheme.primary }]}>
                  <Text style={[hs.emptyBtnText, { color: '#FFF' }]}>Wybierz datę →</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Sparkles color={currentTheme.primary} size={48} strokeWidth={1.2}/>
                <Text style={[hs.emptyTitle, { color: currentTheme.primary }]}>Uzupełnij datę urodzenia</Text>
                <Text style={[hs.emptySub, { color: isLight ? '#6A5A48' : '#9A8E80' }]}>
                  Horoskop potrzebuje daty urodzenia, aby pokazać Twój znak, ton dnia i personalne prognozy.
                </Text>
                <Pressable onPress={() => navigateToMainTab(navigation, 'Profile')}
                  style={[hs.emptyBtn, { backgroundColor: currentTheme.primary }]}>
                  <Text style={[hs.emptyBtnText, { color: '#FFF' }]}>Przejdź do Profilu</Text>
                </Pressable>
              </>
            )}
          </View>
        </SafeAreaView>
        <PremiumDatePickerSheet
          visible={showPicker}
          mode="date"
          title="Data urodzenia tej osoby"
          description="Tylko do jednorazowego odczytu znaku."
          value={otherDateValue}
          maximumDate={new Date()}
          onCancel={() => setShowPicker(false)}
          onConfirm={val => {
            setOtherDateValue(val);
            setOtherBirthDate(val.toISOString().split('T')[0]);
            setShowPicker(false);
          }}
        />
      </View>
    );
  }

  return (
    <View style={[hs.container, { backgroundColor: bgColor }]}>
      <LinearGradient
        colors={isLight
          ? [zodiacColors.bg, zodiacColors.bg + 'EE', '#F0E8DE']
          : [bgColor, accent + '12', '#000000']}
        style={StyleSheet.absoluteFill}/>

      <SafeAreaView edges={['top']} style={hs.safeArea}>
        {/* ── HEADER ── */}
        <View style={hs.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Home')} style={hs.backBtn} hitSlop={14}>
            <ChevronLeft color={accent} size={26} strokeWidth={1.6}/>
          </Pressable>
          <View style={hs.headerCenter}>
            <Text style={[hs.headerEyebrow, { color: accent }]}>♈ HOROSKOP</Text>
            <Text style={[hs.headerTitle, { color: textColor }]}>
              {zodiac ? ZODIAC_LABELS[activeSign] : 'Twój znak'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Pressable onPress={() => setShowFsModal(true)}
              style={[hs.modeBtn, { borderColor: accent + '44', backgroundColor: forSomeone ? accent + '22' : 'transparent' }]}>
              <Users color={forSomeone ? accent : accent + '88'} size={16} strokeWidth={1.8} fill={forSomeone ? accent + '33' : 'none'}/>
            </Pressable>
            <Pressable
              onPress={() => { if (isFavoriteItem('horoscope')) { removeFavoriteItem('horoscope'); } else { addFavoriteItem({ id: 'horoscope', label: 'Horoskop', sublabel: zodiac ? ZODIAC_LABELS[activeSign] : 'Twój znak', route: 'Horoscope', params: {}, icon: 'Star', color: accent, addedAt: new Date().toISOString() }); } }}
              style={[hs.modeBtn, { borderColor: accent + '44' }]}
              hitSlop={12}
            >
              <Star color={isFavoriteItem('horoscope') ? accent : accent + '88'} size={16} strokeWidth={1.8} fill={isFavoriteItem('horoscope') ? accent : 'none'} />
            </Pressable>
          </View>
        </View>

        {/* ── TABS ── */}
        <View style={[hs.tabBar, { borderColor: accent + '22', backgroundColor: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.05)' }]}>
          {([
            { id: 'dzien', label: 'Dziś' },
            { id: 'znak', label: 'Znak' },
            { id: 'obszary', label: 'Obszary' },
            { id: 'fokus', label: 'Fokus' },
          ] as const).map(tab => (
            <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)}
              style={[hs.tab, activeTab === tab.id && { backgroundColor: accent, borderRadius: 12 }]}>
              <Text style={[hs.tabText, { color: activeTab === tab.id ? '#FFF' : accent + 'BB' }]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[hs.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') }]}
          showsVerticalScrollIndicator={false}
        >
          {viewMode === 'other' && zodiac && (
            <Pressable onPress={() => setShowPicker(true)} style={[hs.otherBanner, { backgroundColor: accent + '14', borderColor: accent + '33' }]}>
              <Users color={accent} size={13} strokeWidth={1.8}/>
              <Text style={[hs.otherBannerText, { color: accent }]}>
                          {otherGender === 'on' ? 'On · ' : 'Ona · '}{ZODIAC_LABELS[activeSign]} · {formatLocaleDate(otherBirthDate)} · {i18n.language?.startsWith('en') ? 'Tap to change' : 'Dotknij, by zmienić'}
              </Text>
            </Pressable>
          )}

          {forSomeone && partnerSign && (
            <Pressable onPress={() => setShowFsModal(true)} style={[hs.otherBanner, { backgroundColor: accent + '18', borderColor: accent + '55' }]}>
              <Users color={accent} size={13} strokeWidth={1.8}/>
              <Text style={[hs.otherBannerText, { color: accent }]}>
                Horoskop dla: {partnerName || ZODIAC_LABELS[activeSign]} · {ZODIAC_LABELS[activeSign]} · Dotknij, by zmienić
              </Text>
            </Pressable>
          )}

          {/* ── 3D ZODIAC WHEEL ── */}
          {zodiac && (
            <Animated.View entering={FadeInDown.delay(40).duration(500)}>
              <ZodiacWheel3D
                activeSign={activeSign}
                accent={accent}
                onSignPress={(sign) => {
                  if (sign !== zodiac) {
                    setForSomeone(true);
                    setPartnerSign(sign);
                    setPartnerName('');
                  } else {
                    setForSomeone(false);
                    setPartnerSign(null);
                  }
                }}
              />
            </Animated.View>
          )}

          {/* ── HERO ZNAKU ── */}
          {zodiac && (
            <Animated.View entering={FadeInDown.duration(500)}>
              <View style={[hs.heroCard, { borderColor: accent + '33', backgroundColor: isLight ? 'rgba(255,255,255,0.94)' : 'rgba(255,255,255,0.10)' }]}>
                <LinearGradient colors={[accent + '28', accent + '10', 'transparent']} style={StyleSheet.absoluteFill}/>

                <View style={hs.heroTop}>
                  <View style={[hs.zodiacIconWrap, { backgroundColor: accent + '18', borderColor: accent + '44' }]}>
                    {ZodiacSVG[activeSign]?.(accent, 72)}
                  </View>
                  <View style={hs.heroInfo}>
                    <Text style={[hs.heroSign, { color: textColor }]}>{ZODIAC_LABELS[activeSign]}</Text>
                    <View style={hs.heroMetaRow}>
                      <Text style={[hs.heroMeta, { color: accent }]}>{ZODIAC_SYMBOLS[activeSign]} {ZODIAC_ELEMENTS[activeSign]}</Text>
                      <Text style={[hs.heroBullet, { color: accent + '66' }]}>·</Text>
                      <Text style={[hs.heroMeta, { color: accent }]}>{ZODIAC_PLANETS[activeSign]}</Text>
                      <Text style={[hs.heroBullet, { color: accent + '66' }]}>·</Text>
                      <Text style={[hs.heroMeta, { color: accent }]}>{ZODIAC_MODALITY[activeSign]}</Text>
                    </View>
                    <Text style={[hs.heroDates, { color: subColor }]}>{ZODIAC_DATES[activeSign]}</Text>
                    {chineseSign && (
                      <Text style={[hs.heroChineseLine, { color: accent + 'AA' }]}>
                        🏮 {chineseSign.element} · chiński zodiak
                      </Text>
                    )}
                  </View>
                  <ZodiacWheel activeSign={activeSign} color={accent} size={76}/>
                </View>

                {/* Cechy */}
                <View style={hs.traitsRow}>
                  {ZODIAC_TRAITS[activeSign].map(trait => (
                    <View key={trait} style={[hs.traitPill, { backgroundColor: accent + '14', borderColor: accent + '33' }]}>
                      <Text style={[hs.traitText, { color: accent }]}>{trait}</Text>
                    </View>
                  ))}
                </View>

                {/* Energy score */}
                <View style={[hs.energyStrip, { borderTopColor: accent + '22' }]}>
                  {([
                    { label: 'Miłość', score: dayScore.love },
                    { label: 'Praca', score: dayScore.work },
                    { label: 'Zdrowie', score: dayScore.health },
                    { label: 'Energia', score: dayScore.overall },
                  ]).map((e, i) => (
                    <View key={e.label} style={[hs.energyItem, i < 3 && { borderRightWidth: 1, borderRightColor: accent + '18' }]}>
                      <Text style={[hs.energyVal, { color: accent }]}>{e.score}%</Text>
                      <Text style={hs.energyLabel}>{e.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── HUB: INNE MODUŁY ── */}
          {zodiac && (
            <Animated.View entering={FadeInDown.delay(160).duration(500)}>
              <View style={[hs.hubSection, { paddingHorizontal: 0 }]}>
                <Text style={[hs.hubSectionLabel, { color: accent }]}>INNE MODUŁY HOROSKOPU</Text>
                {[
                  { label: 'Zodiak chiński',      desc: 'Twój chiński znak i element',           icon: Globe,      color: '#FB923C', onPress: () => navigation?.navigate('ChineseHoroscope') },
                  { label: 'Zgodność znaków',     desc: 'Energia połączenia dwóch znaków',       icon: Heart,      color: '#F472B6', onPress: () => navigation?.navigate('Compatibility') },
                  { label: 'Kalendarz księżycowy', desc: 'Fazy księżyca i intencje miesiąca',    icon: Moon,       color: '#A78BFA', onPress: () => navigation?.navigate('LunarCalendar') },
                  { label: 'Horoskop partnera',   desc: 'Odczyt dla bliskiej osoby',             icon: Users,      color: '#34D399', onPress: () => navigation?.navigate('PartnerHoroscope') },
                  { label: 'Raport tygodniowy AI', desc: 'Głęboka analiza AI Twojego tygodnia', icon: TrendingUp, color: '#60A5FA', onPress: () => navigation?.navigate('WeeklyReport') },
                ].map((item, idx, arr) => {
                  const Icon = item.icon;
                  return (
                    <Pressable key={item.label} style={[hs.hubRow, { borderBottomWidth: idx < arr.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }]} onPress={item.onPress}>
                      <View style={[hs.hubRowIcon, { backgroundColor: item.color + '1A' }]}>
                        <Icon color={item.color} size={19} strokeWidth={1.7} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={[hs.hubRowLabel, { color: textColor }]}>{item.label}</Text>
                        <Text style={[hs.hubRowDesc, { color: subColor }]}>{item.desc}</Text>
                      </View>
                      <ArrowRight color={subColor} size={15} />
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* ── TAB: DZIEN ── */}
          {activeTab === 'dzien' && zodiac && (
            <>
              {/* ── SELEKTOR OKRESU ── */}
              <View style={[hs.periodBar, { backgroundColor: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.05)', borderColor: accent + '22' }]}>
                {([
                  { id: 'dzien' as const, label: 'Dziś' },
                  { id: 'tydzien' as const, label: 'Tydzień' },
                  { id: 'miesiac' as const, label: 'Miesiąc' },
                  { id: 'rok' as const, label: 'Rok' },
                ]).map(p => (
                  <Pressable key={p.id} onPress={() => setPeriod(p.id)}
                    style={[hs.periodTab, period === p.id && { backgroundColor: accent, borderRadius: 10 }]}>
                    <Text style={[hs.periodTabText, { color: period === p.id ? '#FFF' : accent + 'BB' }]}>
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* ── DZIŚ ── */}
              {period === 'dzien' && (
                <>
                  <Animated.View entering={FadeInDown.delay(80).duration(480)}>
                    <View style={[hs.card, { borderColor: accent + '33', backgroundColor: cardBg }]}>
                      <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFill}/>
                      <Text style={[hs.eyebrow, { color: accent }]}>TON DNIA</Text>
                      <Text style={[hs.cardTitle, { color: textColor }]}>{dailyPlan.astrologyGuidance.headline}</Text>
                      <Text style={[hs.cardBody, { color: subColor }]}>{dailyPlan.astrologyGuidance.support}</Text>
                    </View>
                  </Animated.View>
                  <Animated.View entering={FadeInDown.delay(120).duration(480)}>
                    <View style={[hs.card, { borderColor: accent + '28', backgroundColor: cardBg }]}>
                      <Text style={[hs.eyebrow, { color: accent }]}>AFIRMACJA DNIA — {ZODIAC_LABELS[activeSign].toUpperCase()}</Text>
                      <Text style={[hs.quoteText, { color: textColor }]}>"{ZODIAC_AFFIRMATIONS[activeSign]}"</Text>
                    </View>
                  </Animated.View>
                  <Animated.View entering={FadeInDown.delay(160).duration(480)}>
                    <View style={[hs.card, { borderColor: accent + '28', backgroundColor: cardBg }]}>
                      <Text style={[hs.eyebrow, { color: accent }]}>RYTM DNIA</Text>
                      {([
                        { time: 'Rano', copy: DAILY_FOCUS[activeSign].morning, icon: Sun },
                        { time: 'Południe', copy: DAILY_FOCUS[activeSign].afternoon, icon: Zap },
                        { time: 'Wieczór', copy: DAILY_FOCUS[activeSign].evening, icon: Moon },
                      ]).map((phase, i) => {
                        const Icon = phase.icon;
                        return (
                          <View key={phase.time} style={[hs.phaseRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: accent + '18' }]}>
                            <View style={[hs.phaseIcon, { backgroundColor: accent + '14', borderColor: accent + '28' }]}>
                              <Icon color={accent} size={14} strokeWidth={2}/>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[hs.phaseTime, { color: accent }]}>{phase.time}</Text>
                              <Text style={[hs.phaseCopy, { color: subColor }]}>{phase.copy}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </Animated.View>
                  {chineseSign && (
                    <Animated.View entering={FadeInDown.delay(200).duration(480)}>
                      <View style={[hs.card, { borderColor: accent + '28', backgroundColor: cardBg }]}>
                        <Text style={[hs.eyebrow, { color: accent }]}>WARSTWA CHIŃSKA — DZIŚ</Text>
                        <Text style={[hs.cardTitle, { color: textColor }]}>
                          {chineseSign.element} · {chineseSign.id.charAt(0).toUpperCase() + chineseSign.id.slice(1)}
                        </Text>
                        <Text style={[hs.cardBody, { color: subColor }]}>
                          {CHINESE_WEEKLY[chineseSign.id] || dailyPlan.astrologyGuidance.chineseInsight}
                        </Text>
                        <Pressable onPress={() => navigation.navigate('ChineseHoroscope')}
                          style={[hs.linkRow, { borderTopColor: accent + '18' }]}>
                          <Text style={[hs.linkText, { color: accent }]}>Otwórz chiński horoskop</Text>
                          <ArrowRight color={accent} size={14}/>
                        </Pressable>
                      </View>
                    </Animated.View>
                  )}
                </>
              )}

              {/* ── TYDZIEŃ ── */}
              {period === 'tydzien' && (
                <>
                  <Animated.View entering={FadeInDown.delay(80).duration(480)}>
                    <View style={[hs.card, { borderColor: accent + '33', backgroundColor: cardBg }]}>
                      <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFill}/>
                      <Text style={[hs.eyebrow, { color: accent }]}>PROROCTWO TYGODNIA — {ZODIAC_LABELS[activeSign].toUpperCase()}</Text>
                      <Text style={[hs.cardBody, { color: textColor, lineHeight: 24 }]}>
                        {ZODIAC_WEEKLY_PROPHECY[activeSign]}
                      </Text>
                    </View>
                  </Animated.View>
                  <Animated.View entering={FadeInDown.delay(120).duration(480)}>
                    <View style={[hs.card, { borderColor: accent + '28', backgroundColor: cardBg }]}>
                      <Text style={[hs.eyebrow, { color: accent }]}>OBSZARY W TYM TYGODNIU</Text>
                      {AREAS_CONFIG.map(area => (
                        <View key={area.key} style={[hs.areaRow, { borderBottomColor: accent + '14' }]}>
                          <Text style={[hs.areaRowLabel, { color: textColor }]}>{area.label}</Text>
                          <View style={[hs.areaRowBar, { backgroundColor: accent + '14' }]}>
                            <View style={[hs.areaRowFill, { width: `${dayScore[area.key]}%` as any, backgroundColor: accent + 'AA' }]}/>
                          </View>
                          <Text style={[hs.areaRowVal, { color: accent }]}>{dayScore[area.key]}%</Text>
                        </View>
                      ))}
                    </View>
                  </Animated.View>
                  {chineseSign && (
                    <Animated.View entering={FadeInDown.delay(160).duration(480)}>
                      <View style={[hs.card, { borderColor: accent + '28', backgroundColor: cardBg }]}>
                        <Text style={[hs.eyebrow, { color: accent }]}>CHIŃSKI — TYDZIEŃ</Text>
                        <Text style={[hs.cardTitle, { color: textColor }]}>
                          {chineseSign.element} · {chineseSign.id.charAt(0).toUpperCase() + chineseSign.id.slice(1)}
                        </Text>
                        <Text style={[hs.cardBody, { color: subColor }]}>
                          {CHINESE_WEEKLY[chineseSign.id] || dailyPlan.astrologyGuidance.chineseInsight}
                        </Text>
                        <Pressable onPress={() => navigation.navigate('ChineseHoroscope')}
                          style={[hs.linkRow, { borderTopColor: accent + '18' }]}>
                          <Text style={[hs.linkText, { color: accent }]}>Pełny chiński horoskop</Text>
                          <ArrowRight color={accent} size={14}/>
                        </Pressable>
                      </View>
                    </Animated.View>
                  )}
                </>
              )}

              {/* ── MIESIĄC ── */}
              {period === 'miesiac' && (
                <>
                  <Animated.View entering={FadeInDown.delay(80).duration(480)}>
                    <View style={[hs.card, { borderColor: accent + '33', backgroundColor: cardBg }]}>
                      <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFill}/>
                      <Text style={[hs.eyebrow, { color: accent }]}>MIESIĘCZNA PROGNOZA — {ZODIAC_LABELS[activeSign].toUpperCase()}</Text>
                      <Text style={[hs.cardBody, { color: textColor, lineHeight: 24 }]}>
                        {ZODIAC_MONTHLY_FORECAST[activeSign]}
                      </Text>
                    </View>
                  </Animated.View>
                  <Animated.View entering={FadeInDown.delay(120).duration(480)}>
                    <View style={[hs.card, { borderColor: accent + '28', backgroundColor: cardBg }]}>
                      <Text style={[hs.eyebrow, { color: accent }]}>SFERY ŻYCIA W TYM MIESIĄCU</Text>
                      {([
                        { area: 'love' as const, label: 'Miłość' },
                        { area: 'work' as const, label: 'Praca' },
                        { area: 'health' as const, label: 'Zdrowie' },
                        { area: 'finance' as const, label: 'Finanse' },
                      ]).map((a, i) => (
                        <View key={a.area} style={[hs.phaseRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: accent + '14' }]}>
                          <Text style={[hs.phaseTime, { color: accent, minWidth: 60 }]}>{a.label}</Text>
                          <Text style={[hs.phaseCopy, { color: subColor, flex: 1 }]} numberOfLines={2}>
                            {ZODIAC_LIFE_AREAS[activeSign][a.area].slice(0, 85)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </Animated.View>
                  {chineseSign && (
                    <Animated.View entering={FadeInDown.delay(160).duration(480)}>
                      <View style={[hs.card, { borderColor: accent + '28', backgroundColor: cardBg }]}>
                        <Text style={[hs.eyebrow, { color: accent }]}>CHIŃSKI — MIESIĄC</Text>
                        <Text style={[hs.cardTitle, { color: textColor }]}>
                          {chineseSign.element} · {chineseSign.id.charAt(0).toUpperCase() + chineseSign.id.slice(1)}
                        </Text>
                        <Text style={[hs.cardBody, { color: subColor }]}>
                          {CHINESE_MONTHLY[chineseSign.id] || dailyPlan.astrologyGuidance.chineseInsight}
                        </Text>
                        <Pressable onPress={() => navigation.navigate('ChineseHoroscope')}
                          style={[hs.linkRow, { borderTopColor: accent + '18' }]}>
                          <Text style={[hs.linkText, { color: accent }]}>Pełny chiński horoskop</Text>
                          <ArrowRight color={accent} size={14}/>
                        </Pressable>
                      </View>
                    </Animated.View>
                  )}
                </>
              )}

              {/* ── ROK ── */}
              {period === 'rok' && (
                <>
                  <Animated.View entering={FadeInDown.delay(80).duration(480)}>
                    <View style={[hs.card, { borderColor: accent + '33', backgroundColor: cardBg }]}>
                      <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFill}/>
                      <Text style={[hs.eyebrow, { color: accent }]}>ROCZNY PRZEGLĄD — {ZODIAC_LABELS[activeSign].toUpperCase()}</Text>
                      <Text style={[hs.cardBody, { color: textColor, lineHeight: 24 }]}>
                        {ZODIAC_YEARLY_OVERVIEW[activeSign]}
                      </Text>
                    </View>
                  </Animated.View>
                  <Animated.View entering={FadeInDown.delay(120).duration(480)}>
                    <View style={[hs.card, { borderColor: accent + '28', backgroundColor: cardBg }]}>
                      <Text style={[hs.eyebrow, { color: accent }]}>TWÓJ HOROSKOPOWY PROFIL</Text>
                      <View style={hs.traitsRow}>
                        {ZODIAC_TRAITS[activeSign].map(trait => (
                          <View key={trait} style={[hs.traitPill, { backgroundColor: accent + '14', borderColor: accent + '33' }]}>
                            <Text style={[hs.traitText, { color: accent }]}>{trait}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={[hs.cardBody, { color: subColor, marginTop: 10 }]}>
                        Planeta {ZODIAC_PLANETS[activeSign]} kształtuje Twój roczny rytm. Modalność {ZODIAC_MODALITY[activeSign]} określa, jak podchodzisz do rocznych wyzwań i możliwości.
                      </Text>
                    </View>
                  </Animated.View>
                  {chineseSign && (
                    <Animated.View entering={FadeInDown.delay(160).duration(480)}>
                      <View style={[hs.card, { borderColor: accent + '28', backgroundColor: cardBg }]}>
                        <Text style={[hs.eyebrow, { color: accent }]}>CHIŃSKI — ROK</Text>
                        <Text style={[hs.cardTitle, { color: textColor }]}>
                          {chineseSign.element} · {chineseSign.id.charAt(0).toUpperCase() + chineseSign.id.slice(1)}
                        </Text>
                        <Text style={[hs.cardBody, { color: subColor }]}>
                          {CHINESE_YEARLY[chineseSign.id] || dailyPlan.astrologyGuidance.chineseInsight}
                        </Text>
                        <Pressable onPress={() => navigation.navigate('ChineseHoroscope')}
                          style={[hs.linkRow, { borderTopColor: accent + '18' }]}>
                          <Text style={[hs.linkText, { color: accent }]}>Pełny chiński horoskop</Text>
                          <ArrowRight color={accent} size={14}/>
                        </Pressable>
                      </View>
                    </Animated.View>
                  )}
                </>
              )}
            </>
          )}

          {/* ── TAB: ZNAK ── */}
          {activeTab === 'znak' && zodiac && (
            <>
              <Animated.View entering={FadeInDown.delay(60).duration(480)}>
                <View style={[hs.card, { borderColor: accent + '33', backgroundColor: cardBg }]}>
                  <LinearGradient colors={[accent + '14', 'transparent']} style={StyleSheet.absoluteFill}/>
                  <Text style={[hs.eyebrow, { color: accent }]}>PLANETA WŁADCA</Text>
                  <Text style={[hs.cardTitle, { color: textColor }]}>{ZODIAC_PLANETS[activeSign]}</Text>
                  <Text style={[hs.cardBody, { color: subColor }]}>
                    Planeta {ZODIAC_PLANETS[activeSign]} rządzi Twoim znakiem i kształtuje dominujące energie, sposób wyrażania siebie i główne lekcje życiowe.
                  </Text>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(100).duration(480)}>
                <View style={[hs.card, { borderColor: accent + '28', backgroundColor: cardBg }]}>
                  <Text style={[hs.eyebrow, { color: accent }]}>CIEŃ ZNAKU</Text>
                  <Text style={[hs.cardBody, { color: textColor }]}>{ZODIAC_SHADOW[activeSign]}</Text>
                  <Text style={[hs.cardBodySub, { color: subColor }]}>
                    Każdy znak ma swoje wyzwania. Świadomość cienia jest pierwszym krokiem do integracji.
                  </Text>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(140).duration(480)}>
                <View style={[hs.card, { borderColor: accent + '28', backgroundColor: cardBg }]}>
                  <Text style={[hs.eyebrow, { color: accent }]}>NAJLEPSZA ZGODNOŚĆ</Text>
                  <View style={hs.compatRow}>
                    {ZODIAC_COMPATIBILITY[activeSign].map(sign => (
                      <Pressable key={sign} onPress={() => navigation.navigate('Compatibility')}
                        style={[hs.compatChip, { borderColor: accent + '44', backgroundColor: accent + '12' }]}>
                        <Text style={[hs.compatSymbol, { color: accent }]}>{ZODIAC_SYMBOLS[sign]}</Text>
                        <Text style={[hs.compatLabel, { color: accent }]}>{ZODIAC_LABELS[sign]}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Pressable onPress={() => navigation.navigate('Compatibility')}
                    style={[hs.linkRow, { borderTopColor: accent + '18' }]}>
                    <Text style={[hs.linkText, { color: accent }]}>Sprawdź pełną zgodność</Text>
                    <ArrowRight color={accent} size={14}/>
                  </Pressable>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(160).duration(480)}>
                {(() => {
                  const elemName = ZODIAC_ELEMENTS[activeSign];
                  const ElemIcon = ELEMENT_ICON[elemName] ?? Flame;
                  const elemColor = ELEMENT_COLOR[elemName] ?? accent;
                  return (
                    <View style={[hs.card, { borderColor: elemColor + '44', backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)' }]}>
                      <LinearGradient colors={[elemColor + '18', 'transparent']} style={StyleSheet.absoluteFill} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: elemColor + '22', alignItems: 'center', justifyContent: 'center' }}>
                          <ElemIcon color={elemColor} size={18} strokeWidth={1.8} />
                        </View>
                        <Text style={[hs.eyebrow, { color: elemColor, marginBottom: 0 }]}>ELEMENT ZNAKU — {elemName.toUpperCase()}</Text>
                      </View>
                      <Text style={[hs.cardBody, { color: textColor, lineHeight: 23, marginBottom: 12 }]}>
                        {ELEMENT_DESCRIPTION[activeSign]}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                        {ELEMENT_KEYWORDS[activeSign].map(kw => (
                          <View key={kw} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: elemColor + '44', backgroundColor: elemColor + '12' }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: elemColor, letterSpacing: 0.4 }}>{kw}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })()}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).duration(480)}>
                <View style={[hs.card, { borderColor: accent + '28', backgroundColor: cardBg }]}>
                  <Text style={[hs.eyebrow, { color: accent }]}>WSZYSTKIE 12 ZNAKÓW</Text>
                  <View style={hs.allSignsGrid}>
                    {(['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'] as ZodiacSign[]).map(sign => (
                      <View key={sign}
                        style={[hs.signChip, sign === zodiac && { backgroundColor: accent + '22', borderColor: accent }]}>
                        <Text style={[hs.signChipSymbol, { color: sign === zodiac ? accent : '#8A7060' }]}>{ZODIAC_SYMBOLS[sign]}</Text>
                        <Text style={[hs.signChipLabel, { color: sign === zodiac ? accent : '#8A7060' }]}>{ZODIAC_LABELS[sign].slice(0, 4)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Animated.View>
            </>
          )}

          {/* ── TAB: OBSZARY ── */}
          {activeTab === 'obszary' && zodiac && (
            <>
              {/* Selektor obszarów */}
              <View style={hs.areaSelector}>
                {AREAS_CONFIG.map(area => {
                  const Icon = area.icon;
                  const active = activeArea === area.key;
                  return (
                    <Pressable key={area.key} onPress={() => setActiveArea(area.key)}
                      style={[hs.areaTab, active && { backgroundColor: accent, borderColor: accent }]}>
                      <Icon color={active ? '#FFF' : accent + 'AA'} size={16} strokeWidth={1.8}/>
                      <Text style={[hs.areaTabText, { color: active ? '#FFF' : accent + 'AA' }]}>{area.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Animated.View entering={FadeInDown.duration(400)}>
                <View style={[hs.areaCard, { borderColor: accent + '33', backgroundColor: cardBg }]}>
                  <LinearGradient colors={[accent + '16', 'transparent']} style={StyleSheet.absoluteFill}/>
                  <Text style={[hs.eyebrow, { color: accent }]}>{AREAS_CONFIG.find(a => a.key === activeArea)?.label.toUpperCase()} DLA {ZODIAC_LABELS[activeSign].toUpperCase()}</Text>

                  {/* Score */}
                  <View style={hs.scoreWrap}>
                    <Text style={[hs.scoreBig, { color: accent }]}>{dayScore[activeArea]}%</Text>
                    <Text style={[hs.scoreLabel, { color: subColor }]}>dzisiaj</Text>
                  </View>

                  {/* Progress bar */}
                  <View style={[hs.progressBg, { backgroundColor: accent + '18' }]}>
                    <View style={[hs.progressFill, { width: `${dayScore[activeArea]}%` as any, backgroundColor: accent }]}/>
                  </View>

                  {/* Opis */}
                  <Text style={[hs.areaDescription, { color: textColor }]}>
                    {ZODIAC_LIFE_AREAS[activeSign][activeArea]}
                  </Text>
                </View>
              </Animated.View>

              {/* Raport wszystkich obszarów */}
              <Animated.View entering={FadeInDown.delay(80).duration(480)}>
                <View style={[hs.card, { borderColor: accent + '28', backgroundColor: cardBg }]}>
                  <Text style={[hs.eyebrow, { color: accent }]}>PODSUMOWANIE DNIA</Text>
                  {AREAS_CONFIG.map(area => (
                    <View key={area.key} style={[hs.areaRow, { borderBottomColor: accent + '14' }]}>
                      <Text style={[hs.areaRowLabel, { color: textColor }]}>{area.label}</Text>
                      <View style={[hs.areaRowBar, { backgroundColor: accent + '14' }]}>
                        <View style={[hs.areaRowFill, { width: `${dayScore[area.key]}%` as any, backgroundColor: accent + 'AA' }]}/>
                      </View>
                      <Text style={[hs.areaRowVal, { color: accent }]}>{dayScore[area.key]}%</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            </>
          )}

          {/* ── TAB: FOKUS ── */}
          {activeTab === 'fokus' && zodiac && (
            <>
              <Animated.View entering={FadeInDown.delay(60).duration(480)}>
                <View style={[hs.card, { borderColor: accent + '33', backgroundColor: cardBg }]}>
                  <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFill}/>
                  <Text style={[hs.eyebrow, { color: accent }]}>SYGNAŁ DNIA</Text>
                  <Text style={[hs.cardTitle, { color: textColor }]}>{dailyPlan.patternSignal}</Text>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(100).duration(480)}>
                <View style={[hs.card, { borderColor: accent + '28', backgroundColor: cardBg }]}>
                  <Text style={[hs.eyebrow, { color: accent }]}>RYTM KSIĘŻYCA</Text>
                  <Text style={[hs.heroSign, { color: accent, fontSize: 32 }]}>
                    {dailyPlan.moonPhase.icon}
                  </Text>
                  <Text style={[hs.cardTitle, { color: accent }]}>{dailyPlan.moonPhase.name}</Text>
                  <Text style={[hs.cardBody, { color: subColor }]}>
                    {dailyPlan.astrologyGuidance.headline}
                  </Text>
                </View>
              </Animated.View>

              {/* Proroctwo tygodnia — unikalne per znak */}
              <Animated.View entering={FadeInDown.delay(140).duration(480)}>
                <View style={[hs.card, { borderColor: accent + '33', backgroundColor: cardBg }]}>
                  <LinearGradient colors={[accent + '12', 'transparent']} style={StyleSheet.absoluteFill}/>
                  <Text style={[hs.eyebrow, { color: accent }]}>PROROCTWO TYGODNIA — {ZODIAC_LABELS[activeSign].toUpperCase()}</Text>
                  <Text style={[hs.cardBody, { color: textColor, lineHeight: 24 }]}>
                    {ZODIAC_WEEKLY_PROPHECY[activeSign]}
                  </Text>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(180).duration(480)}>
                <View style={[hs.card, { borderColor: accent + '28', backgroundColor: cardBg }]}>
                  <Text style={[hs.eyebrow, { color: accent }]}>NA CO UWAŻAĆ DZIŚ</Text>
                  <Text style={[hs.cardBody, { color: subColor }]}>
                    {dailyPlan.astrologyGuidance.support}
                  </Text>
                  <View style={[hs.shadowBanner, { backgroundColor: accent + '10', borderColor: accent + '22', marginTop: 12 }]}>
                    <Text style={[hs.shadowLabel, { color: accent }]}>Cień: </Text>
                    <Text style={[hs.shadowText, { color: subColor }]}>{ZODIAC_SHADOW[activeSign]}</Text>
                  </View>
                </View>
              </Animated.View>
            </>
          )}

          {/* ── SEKCJA SZYBKICH AKCJI ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(480)}>
            <Text style={[hs.sectionTitle, { color: accent }]}>PRZEJDŹ DALEJ</Text>
            <View style={hs.actionsGrid}>
              {([
                { icon: Moon, label: 'Chiński horoskop', sub: 'Żywioł i rytm roku', route: 'ChineseHoroscope', color: accent },
                { icon: Heart, label: 'Zgodność', sub: 'Mapa relacji i znaków', route: 'Compatibility', color: '#E8705A' },
                { icon: Users, label: 'Horoskop partnera', sub: 'Odczyt dla drugiej osoby', route: 'PartnerHoroscope', color: '#C06898' },
                { icon: Star, label: 'Gwiazdy i cykle', sub: 'Głębsza warstwa nieba', route: 'Stars', color: '#5B8FD4' },
                { icon: Globe, label: 'Numerologia', sub: 'Droga życia i liczby', route: 'Numerology', color: '#5A9A6A' },
                { icon: Compass, label: 'Matryca życia', sub: 'Wzorce i osie napięć', route: 'Matrix', color: '#D47840' },
              ] as const).map((action, i) => {
                const Icon = action.icon;
                return (
                  <Animated.View key={action.route} entering={FadeInUp.delay(240 + i * 50).duration(400)}
                    style={hs.actionCardWrap}>
                    <Pressable onPress={() => navigation.navigate(action.route)}
                      style={[hs.actionCard, { borderColor: action.color + '33', backgroundColor: cardBg }]}>
                      <View style={[hs.actionIcon, { backgroundColor: action.color + '18', borderColor: action.color + '33' }]}>
                        <Icon color={action.color} size={20} strokeWidth={1.8}/>
                      </View>
                      <Text style={[hs.actionLabel, { color: textColor }]}>{action.label}</Text>
                      <Text style={[hs.actionSub, { color: subColor }]}>{action.sub}</Text>
                      <ArrowRight color={action.color} size={14} style={{ marginTop: 8, alignSelf: 'flex-end' }}/>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* ── AI HOROSKOP ── */}
          <Animated.View entering={FadeInDown.delay(320).duration(480)}>
            <Pressable
              onPress={() => navigation.navigate('JournalEntry', { type: 'reflection', prompt: `Dzisiejszy ton: ${dailyPlan.astrologyGuidance.headline}. Co ten horoskop naprawdę znaczy w praktyce dla mojej sytuacji?` })}
              style={[hs.aiCard, { borderColor: accent + '44', backgroundColor: accent + '0E' }]}
            >
              <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFill}/>
              <Brain color={accent} size={24} strokeWidth={1.6}/>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[hs.aiTitle, { color: accent }]}>Notatka po horoskopie</Text>
                <Text style={[hs.aiSub, { color: subColor }]}>
                  Przełóż dzisiejszy ton horoskopu na własne decyzje, granice, relacje i jeden konkretny ruch na teraz.
                </Text>
              </View>
              <ArrowRight color={accent} size={18}/>
            </Pressable>
          </Animated.View>

          {/* ── WIDŻET — PORÓWNANIE ZNAKÓW ── */}
          {!aiAvailable && (
            <Animated.View entering={FadeInDown.delay(360).duration(480)}>
              <Pressable
                onPress={() => navigation.navigate('JournalEntry', { prompt: `Mój znak ${zodiac ? ZODIAC_LABELS[activeSign] : ''}: ${dailyPlan.astrologyGuidance.headline}`, type: 'reflection' })}
                style={[hs.card, { borderColor: accent + '28', backgroundColor: cardBg }]}>
                <BookOpen color={accent} size={18}/>
                <Text style={[hs.eyebrow, { color: accent, marginTop: 8 }]}>ZAPISZ WGLĄD DNIA</Text>
                <Text style={[hs.cardBody, { color: subColor }]}>
                  AI chwilowo niedostępne. Zapisz najważniejszy sygnał astrologiczny na dziś.
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* ── CO DALEJ? ── */}
          {zodiac && (
            <Animated.View entering={FadeInDown.delay(380).duration(480)} style={{ marginTop: 4 }}>
              <Text style={[hs.sectionTitle, { color: accent, marginBottom: 10 }]}>✦ CO DALEJ?</Text>
              {([
                { icon: Users, label: 'Horoskop partnera', sub: 'Odczyt znaku dla bliskiej osoby', route: 'PartnerHoroscope', color: '#C06898' },
                { icon: Star,  label: 'Gwiazdy i niebo',   sub: 'Mapa nieba i planetarne cykle',  route: 'Stars',            color: '#5B8FD4' },
                { icon: Moon,  label: 'Kalendarz księżycowy', sub: 'Fazy Księżyca i intencje',    route: 'LunarCalendar',    color: '#A78BFA' },
              ] as const).map((item, i) => {
                const Icon = item.icon;
                return (
                  <Animated.View key={item.route} entering={FadeInDown.delay(400 + i * 60).duration(400)}>
                    <Pressable
                      onPress={() => navigation.navigate(item.route)}
                      style={[hs.codalejRow, { borderColor: item.color + '33', backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)' }]}
                    >
                      <View style={[hs.codalejIcon, { backgroundColor: item.color + '1A' }]}>
                        <Icon color={item.color} size={20} strokeWidth={1.8} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[hs.codalejLabel, { color: textColor }]}>{item.label}</Text>
                        <Text style={[hs.codalejSub, { color: subColor }]}>{item.sub}</Text>
                      </View>
                      <ArrowRight color={item.color} size={16} />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </Animated.View>
          )}

          <EndOfContentSpacer size="standard"/>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showFsModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowFsModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={() => setShowFsModal(false)}>
          <Pressable onPress={e => e.stopPropagation()} style={[hs.fsSheet, { backgroundColor: currentTheme.backgroundElevated, overflow: 'hidden', borderTopColor: accent + '44', borderTopWidth: 1, borderLeftColor: accent + '22', borderLeftWidth: 1, borderRightColor: accent + '22', borderRightWidth: 1 }]}>
            <LinearGradient colors={[accent + '18', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: accent + '44', alignSelf: 'center', marginBottom: 18 }}/>
            <Text style={[hs.fsTitle, { color: textColor }]}>Horoskop dla kogoś</Text>
            <Text style={[hs.fsSub, { color: subColor }]}>Podaj imię i wybierz znak zodiaku osoby, dla której chcesz zobaczyć horoskop.</Text>
            <MysticalInput
              value={fsNameInput}
              onChangeText={setFsNameInput}
              placeholder="Imię osoby (opcjonalnie)..."
              placeholderTextColor={subColor}
              style={{ color: textColor }}
              containerStyle={{ marginBottom: 14 }}
            />
            <Text style={[hs.fsPickerLabel, { color: accent }]}>ZNAK ZODIAKU</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={hs.fsSignScroll} contentContainerStyle={hs.fsSignScrollContent}>
              {(['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'] as ZodiacSign[]).map(sign => (
                <Pressable
                  key={sign}
                  onPress={() => setFsSignInput(sign)}
                  style={[hs.fsSignChip, {
                    backgroundColor: fsSignInput === sign ? accent + '22' : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.07)'),
                    borderColor: fsSignInput === sign ? accent : accent + '33',
                  }]}
                >
                  <Text style={[hs.fsSignSymbol, { color: fsSignInput === sign ? accent : subColor }]}>{ZODIAC_SYMBOLS[sign]}</Text>
                  <Text style={[hs.fsSignLabel, { color: fsSignInput === sign ? accent : subColor }]}>{ZODIAC_LABELS[sign]}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {forSomeone && (
              <Pressable
                onPress={() => { setForSomeone(false); setPartnerSign(null); setPartnerName(''); setShowFsModal(false); }}
                style={[hs.fsCta, { backgroundColor: 'rgba(255,100,100,0.15)', borderColor: '#FB7185', borderWidth: 1, marginTop: 10 }]}
              >
                <Text style={[hs.fsCtaText, { color: '#FB7185' }]}>Mój horoskop</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                if (fsSignInput) {
                  setPartnerSign(fsSignInput);
                  setPartnerName(fsNameInput.trim());
                  setForSomeone(true);
                  setShowFsModal(false);
                }
              }}
              style={[hs.fsCta, { backgroundColor: fsSignInput ? accent : accent + '55', marginTop: forSomeone ? 8 : 16 }]}
            >
              <Text style={[hs.fsCtaText, { color: '#FFF' }]}>Pokaż horoskop</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <PremiumDatePickerSheet
        visible={showPicker}
        mode="date"
        title="Data urodzenia drugiej osoby"
        description="Tylko do jednorazowego odczytu znaku."
        value={otherDateValue}
        maximumDate={new Date()}
        onCancel={() => setShowPicker(false)}
        onConfirm={val => {
          setOtherDateValue(val);
          setOtherBirthDate(val.toISOString().split('T')[0]);
          setShowPicker(false);
        }}
      />
    </View>
  );
};

const hs = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  backBtn: { width: 38 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  headerTitle: { fontSize: 20, fontWeight: '600', marginTop: 2 },
  modeBtn: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  otherBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1 },
  otherBannerText: { flex: 1, fontSize: 13, fontWeight: '600' },

  tabBar: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 10, borderRadius: 16, borderWidth: 1, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  tabText: { fontSize: 13, fontWeight: '600' },

  scroll: { paddingHorizontal: 20, paddingTop: 4, gap: 12 },

  heroCard: { borderRadius: 26, borderWidth: 1.5, padding: 20, overflow: 'hidden', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  zodiacIconWrap: { width: 88, height: 88, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  heroInfo: { flex: 1, gap: 3 },
  heroSign: { fontSize: 28, fontWeight: '700', lineHeight: 34, letterSpacing: -0.5 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  heroMeta: { fontSize: 12, fontWeight: '600' },
  heroBullet: { fontSize: 12 },
  heroDates: { fontSize: 11, marginTop: 2 },
  heroChineseLine: { fontSize: 11, marginTop: 3 },
  traitsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  traitPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  traitText: { fontSize: 12, fontWeight: '600' },
  energyStrip: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  energyItem: { flex: 1, alignItems: 'center', gap: 2 },
  energyVal: { fontSize: 18, fontWeight: '800' },
  energyLabel: { fontSize: 10, color: '#9A8E80' },

  card: { borderRadius: 18, borderWidth: 1, padding: 18, overflow: 'hidden' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: '500', lineHeight: 26, marginBottom: 8 },
  cardBody: { fontSize: 14, lineHeight: 22 },
  cardBodySub: { fontSize: 13, lineHeight: 20, marginTop: 6 },
  quoteText: { fontSize: 18, fontStyle: 'italic', lineHeight: 28 },
  phaseRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  phaseIcon: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  phaseTime: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 3 },
  phaseCopy: { fontSize: 13, lineHeight: 20 },

  compatRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4, marginBottom: 12 },
  compatChip: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  compatSymbol: { fontSize: 20, marginBottom: 4 },
  compatLabel: { fontSize: 11, fontWeight: '600' },

  allSignsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  signChip: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(169,122,57,0.2)', backgroundColor: 'rgba(255,255,255,0.06)', minWidth: 52 },
  signChipSymbol: { fontSize: 16, marginBottom: 2 },
  signChipLabel: { fontSize: 9, fontWeight: '600' },

  areaSelector: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  areaTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(169,122,57,0.22)', backgroundColor: 'rgba(255,255,255,0.07)' },
  areaTabText: { fontSize: 11, fontWeight: '700' },
  areaCard: { borderRadius: 20, borderWidth: 1, padding: 20, overflow: 'hidden' },
  scoreWrap: { alignItems: 'center', paddingVertical: 16 },
  scoreBig: { fontSize: 56, fontWeight: '700', lineHeight: 64 },
  scoreLabel: { fontSize: 13, marginTop: 2 },
  progressBg: { height: 8, borderRadius: 999, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', borderRadius: 999 },
  areaDescription: { fontSize: 15, lineHeight: 24 },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  areaRowLabel: { fontSize: 13, fontWeight: '600', minWidth: 60 },
  areaRowBar: { flex: 1, height: 6, borderRadius: 999, overflow: 'hidden' },
  areaRowFill: { height: '100%', borderRadius: 999 },
  areaRowVal: { fontSize: 13, fontWeight: '700', minWidth: 38, textAlign: 'right' },

  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  linkText: { fontSize: 13, fontWeight: '600' },

  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 4 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCardWrap: { width: '48%' },
  actionCard: { borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden', minHeight: 130 },
  actionIcon: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  actionSub: { fontSize: 11, lineHeight: 16 },

  aiCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden', gap: 0 },
  aiTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  aiSub: { fontSize: 13, lineHeight: 19 },

  shadowBanner: { flexDirection: 'row', alignItems: 'flex-start', padding: 10, borderRadius: 10, borderWidth: 1, flexWrap: 'wrap' },
  shadowLabel: { fontSize: 12, fontWeight: '700' },
  shadowText: { fontSize: 12, lineHeight: 18, flex: 1 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '600', textAlign: 'center' },
  emptySub: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 999, marginTop: 8 },
  emptyBtnText: { fontSize: 15, fontWeight: '700' },

  periodBar: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 12, gap: 2 },
  periodTab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  periodTabText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },

  fsSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
  fsTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  fsSub: { fontSize: 14, lineHeight: 20, marginBottom: 18 },
  fsInput: { minHeight: 52, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, fontSize: 15, marginBottom: 16 },
  fsPickerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 },
  fsSignScroll: { marginBottom: 4 },
  fsSignScrollContent: { gap: 8, paddingBottom: 4 },
  fsSignChip: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, minWidth: 72 },
  fsSignSymbol: { fontSize: 20, marginBottom: 4 },
  fsSignLabel: { fontSize: 11, fontWeight: '700' },
  fsCta: { minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  fsCtaText: { fontSize: 15, fontWeight: '700' },
  genderBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  genderBtnText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  // ── CO DALEJ ──
  codalejRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 10, overflow: 'hidden' },
  codalejIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  codalejLabel: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  codalejSub: { fontSize: 12, lineHeight: 17 },
  // ── HUB ──
  hubSection: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(169,122,57,0.15)', marginBottom: 4 },
  hubSectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },
  hubRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 },
  hubRowIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  hubRowLabel: { fontSize: 15, fontWeight: '600' },
  hubRowDesc: { fontSize: 12, marginTop: 2, lineHeight: 17 },
});
