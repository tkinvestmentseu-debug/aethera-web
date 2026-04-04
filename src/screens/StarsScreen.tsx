import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet, View, ScrollView, Pressable, Text, Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, G, Path, Ellipse, Polygon } from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Sparkles, ArrowRight, MoonStar, Orbit,
  Stars, WandSparkles, HeartHandshake, SunMoon, Brain,
  BookOpen, Compass, Star, Moon, Globe, Zap, TrendingUp,
  Eye, Shield, Layers, Activity, Info, Sun, Telescope,
  BarChart3, User, Milestone
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { SoulEngineService } from '../core/services/soulEngine.service';
import { getLocaleCode } from '../core/utils/localeFormat';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { AiService } from '../core/services/ai.service';
import { navigateToDashboardSurface } from '../navigation/navigationFallbacks';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';

const { width: SW, height: SH } = Dimensions.get('window');
const ACCENT = '#60A5FA';

// ── TEMATYCZNE TŁO — Astrologia ──────────────────────────────
const AstrologyHeroBg = ({ isDark }: { isDark: boolean }) => {
  const starPositions = [
    [50,40],[130,30],[220,60],[300,35],[170,80],[80,110],[250,100],
    [350,50],[400,80],[60,160],[200,140],[330,130],[150,170],[280,160],
    [420,110],[20,120],[370,170],[100,190],[260,190],[340,90],
  ];
  const constellationLines = [[0,2],[2,4],[1,4],[5,6],[6,7],[8,7],[9,10],[10,11],[12,13],[14,13],[15,5],[16,11]];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={isDark
          ? ['#020810', '#050F1E', '#081426']
          : ['#EEF4FA', '#E4EEF8', '#D8E8F5']}
        style={StyleSheet.absoluteFill}
      />
      <Svg width={SW} height={SH} style={StyleSheet.absoluteFill} opacity={isDark ? 0.32 : 0.18}>
        <G>
          {constellationLines.map(([a,b], i) => (
            <Line key={i}
              x1={starPositions[a][0]} y1={starPositions[a][1]}
              x2={starPositions[b][0]} y2={starPositions[b][1]}
              stroke={ACCENT} strokeWidth={0.9} opacity={0.55}/>
          ))}
          {starPositions.map(([x,y], i) => (
            <Circle key={i} cx={x} cy={y}
              r={i%4===0?4:i%3===0?2.6:1.4}
              fill={i%4===0?ACCENT:i%3===0?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.5)'}
              opacity={0.65+(i%3)*0.15}/>
          ))}
          {/* Ekliptyka */}
          <Ellipse cx={SW/2} cy={SH*0.38} rx={SW*0.44} ry={SH*0.12}
            stroke={ACCENT} strokeWidth={0.7} fill="none"
            strokeDasharray="6 12" opacity={0.22}/>
          {/* Okrąg nieba */}
          <Circle cx={SW/2} cy={SH*0.32} r={148}
            stroke={ACCENT} strokeWidth={0.6} fill="none"
            strokeDasharray="5 10" opacity={0.18}/>
          <Circle cx={SW/2} cy={SH*0.32} r={92}
            stroke={ACCENT} strokeWidth={0.4} fill="none"
            strokeDasharray="3 7" opacity={0.12}/>
          {/* Promienie */}
          {Array.from({length:8}, (_,i) => {
            const a = i*45*Math.PI/180;
            return <Line key={`r${i}`}
              x1={SW/2} y1={SH*0.32}
              x2={SW/2+Math.cos(a)*148} y2={SH*0.32+Math.sin(a)*148}
              stroke={ACCENT} strokeWidth={0.3} opacity={0.1}/>;
          })}
          {/* Galaktyka w tle */}
          <Ellipse cx={SW*0.78} cy={SH*0.68} rx={55} ry={18}
            stroke={ACCENT} strokeWidth={0.5} fill="none"
            strokeDasharray="2 5" opacity={0.14}/>
        </G>
      </Svg>
    </View>
  );
};

// ── DANE ─────────────────────────────────────────────────────

const MOON_PHASES = [
  { icon: '🌑', name: 'Nów', key: 'new_moon', energy: 'Zasiew', color: '#94A3B8',
    copy: 'Czas zasiewu, ciszy i formowania intencji przed ruchem. Nie spiesz się z działaniem.' },
  { icon: '🌓', name: 'I Kwadra', key: 'first_quarter', energy: 'Tarcze', color: '#F59E0B',
    copy: 'Moment decyzji i testowania odwagi mimo oporu. Działaj przez napięcie.' },
  { icon: '🌕', name: 'Pełnia', key: 'full_moon', energy: 'Kulminacja', color: '#FBBF24',
    copy: 'Szczyt emocji i ujawniania prawdy. Kulminacja procesu. Uwolnij to, co spowalnia.' },
  { icon: '🌗', name: 'III Kwadra', key: 'last_quarter', energy: 'Domknięcie', color: '#8B9EC8',
    copy: 'Porządkowanie, oddawanie zbędnego i przygotowanie na nowy cykl.' },
];

const PLANETS_DATA = [
  { symbol: '☉', name: 'Słońce', domain: 'Tożsamość', cycle: '1 rok', currentSign: 'Ryby', energy: 'ekspansywna',
    desc: 'Rdzeń tożsamości i woli. Znak słoneczny definiuje centrum charakteru i kierunek rozrostu siły osobistej.' },
  { symbol: '☽', name: 'Księżyc', domain: 'Emocje', cycle: '28 dni', currentSign: 'Byk', energy: 'stabilizująca',
    desc: 'Instynktowne reakcje, potrzeby bezpieczeństwa i emocjonalny rytm dobowy. Zmienia znak co 2.5 dnia.' },
  { symbol: '☿', name: 'Merkury', domain: 'Komunikacja', cycle: '88 dni', currentSign: 'Ryby', energy: 'intuicyjna',
    desc: 'Myślenie, słowa i styl przetwarzania informacji. W retrogradacji — czas rewizji, nie nowych decyzji.' },
  { symbol: '♀', name: 'Wenus', domain: 'Miłość i wartości', cycle: '225 dni', currentSign: 'Baran', energy: 'aktywna',
    desc: 'Wzorce przyciągania, wartości i estetyka. Definiuje czego szukamy w relacjach i co naprawdę cenimy.' },
  { symbol: '♂', name: 'Mars', domain: 'Działanie', cycle: '687 dni', currentSign: 'Bliźnięta', energy: 'dynamiczna',
    desc: 'Napęd, pożądanie i siła. Determinuje jak walczymy, dążymy do celów i wyrażamy gniew lub zapał.' },
  { symbol: '♃', name: 'Jowisz', domain: 'Ekspansja', cycle: '12 lat', currentSign: 'Bliźnięta', energy: 'rozszerzająca',
    desc: 'Wzrost, szczęście i mądrość. Przez rok aktywuje konkretny obszar życia — gdzie masz teraz "kosmiczne wsparcie".' },
  { symbol: '♄', name: 'Saturn', domain: 'Struktura', cycle: '29.5 lat', currentSign: 'Ryby', energy: 'strukturyzująca',
    desc: 'Granice, lekcje i dojrzałość. Gdzie Saturn jest, tam presja — ale też miejsce, gdzie budujesz najtrwalszy fundament.' },
  { symbol: '♅', name: 'Uran', domain: 'Rewolucja', cycle: '84 lata', currentSign: 'Byk', energy: 'rewolucyjna',
    desc: 'Przełomy, zmiany systemu i nieoczekiwane odwroty. Generacyjna planeta rewolucji struktury.' },
];

const TRANSITS_DATA = [
  { title: 'Jowisz w Bliźniętach', period: '2025–2026', effect: 'Ekspansja przez komunikację, naukę i krótkie podróże. Czas na budowanie sieci i wymianę idei.', type: 'positive' },
  { title: 'Saturn w Rybach', period: '2023–2025', effect: 'Granice w obszarze emocji, intuicji i duchowości. Konieczność ustrukturyzowania swojego wewnętrznego świata.', type: 'challenging' },
  { title: 'Uran w Byku', period: '2018–2026', effect: 'Rewolucja w finansach, stabilności i wartościach materialnych. Zmiana relacji z posiadaniem.', type: 'generational' },
  { title: 'Neptun w Rybach', period: '2011–2026', effect: 'Rozmycie granic w spiritualności i empatii. Generacyjna fala mistycyzmu, sztuki i iluzji.', type: 'generational' },
];

const CELESTIAL_CYCLES = [
  { name: 'Cykl Saturna (Saturn Return)', years: '29.5', desc: 'Co 29.5 roku Saturn wraca do swojej pozycji urodzeniowej. To czas głębokiej rewizji i budowania dojrzałej tożsamości.' },
  { name: 'Cykl Jowisza', years: '12', desc: 'Co 12 lat Jowisz wraca do znaku urodzeniowego, aktywując silne poczucie sensu i możliwości ekspansji.' },
  { name: 'Cykl Księżycowych Węzłów', years: '18.6', desc: 'Cykl Rahu i Ketu — węzłów karmicznych. Aktywuje tematy przeznaczenia, destabilizacji i lekcji duszy.' },
  { name: 'Progresja Wtórna', years: '1', desc: 'Jeden dzień po urodzeniu = jeden rok życia. Metoda głębokiej analizy ewolucji wewnętrznej karty urodzeniowej.' },
  { name: 'Cykl Solarny', years: '1', desc: 'Powrót Słońca do pozycji urodzeniowej. Każde urodziny to nowy symboliczny rok i nowa warstwa zadania.' },
];

const WEEKLY_ENERGIES = [
  { day: 'Pn', planet: 'Księżyc', energy: 'emocje, intuicja', color: '#C4B5FD' },
  { day: 'Wt', planet: 'Mars', energy: 'działanie, odwaga', color: '#EF4444' },
  { day: 'Śr', planet: 'Merkury', energy: 'komunikacja, myśl', color: '#FBBF24' },
  { day: 'Cz', planet: 'Jowisz', energy: 'ekspansja, mądrość', color: '#F97316' },
  { day: 'Pt', planet: 'Wenus', energy: 'miłość, harmonia', color: '#F472B6' },
  { day: 'Sb', planet: 'Saturn', energy: 'struktura, dyscyplina', color: '#94A3B8' },
  { day: 'Nd', planet: 'Słońce', energy: 'witalność, świadomość', color: '#FBBF24' },
];

// getDay() returns 0=Sunday,1=Mon,...,6=Sat; map to our array index (Mon=0)
function getWeeklyEnergyIndex(jsDay: number): number {
  // Sunday(0)->6, Mon(1)->0, Tue(2)->1, ..., Sat(6)->5
  return jsDay === 0 ? 6 : jsDay - 1;
}

const COSMIC_WEATHER: Record<number, string> = {
  0: 'Niedziela nosi energię Słońca — dobry czas na świętowanie siebie i regenerację woli.',
  1: 'Poniedziałek należy do Księżyca — dzień zwiększonej wrażliwości i połączenia z instynktem.',
  2: 'Wtorek energii Marsa — idealna chwila na inicjowanie projektów i asertywne działanie.',
  3: 'Środa z Merkurym — czas na komunikację, pisanie, rozmowy i naukę nowych rzeczy.',
  4: 'Czwartek to dzień Jowisza — sprzyjający rozszerzaniu, podróżom i filozoficznemu myśleniu.',
  5: 'Piątek nosi wibrację Wenus — stwórz przestrzeń na piękno, relacje i przyjemność.',
  6: 'Sobota z Saturnem — dobra na strukturę, dyscyplinę i kończenie zaczętych spraw.',
};

const PLANET_WISDOM: Record<string, string> = {
  'Słońce': 'Twoja esencja promieni niezależnie od okoliczności. Świeć.',
  'Księżyc': 'Twoje emocje są mapą — nie przeszkodą, lecz kompasem.',
  'Merkury': 'Słowa mają moc tworzenia. Wybieraj je świadomie.',
  'Wenus': 'Piękno nie jest luksusem — jest językiem duszy.',
  'Mars': 'Twoja energia jest święta. Kieruj ją tam, gdzie chcesz rosnąć.',
  'Jowisz': 'Wszechświat jest po Twojej stronie. Odważ się rozwinąć.',
  'Saturn': 'Dyscyplina jest formą miłości do swojej przyszłości.',
  'Uran': 'Rewolucja zaczyna się od myśli, która nie mieści się w starych ramach.',
  'Neptun': 'W snach i intuicji mieszka mądrość, której umysł nie dosięgnie.',
  'Pluton': 'Transformacja wymaga śmierci tego, czym byłeś. Zaufaj procesowi.',
};

const ASTROLOGY_LINKS = [
  { label: 'Kalendarz Księżycowy', sub: 'Fazy księżyca, intencje i lunarne rytuały', route: 'LunarCalendar', icon: Moon, color: '#C4B5FD' },
  { label: 'Kosmiczna Pogoda', sub: 'Dzienny forecast energetyczny planet', route: 'CosmicWeather', icon: Sparkles, color: '#60A5FA' },
  { label: 'Numerologia', sub: 'Droga życia i rok osobisty', route: 'Numerology', icon: MoonStar, color: '#34D399' },
  { label: 'Matryca życia', sub: 'Wzorce liczb i osie napięć', route: 'Matrix', icon: WandSparkles, color: '#FBBF24' },
  { label: 'Zgodność', sub: 'Relacyjna mapa znaków', route: 'Compatibility', icon: HeartHandshake, color: '#F87171' },
  { label: 'Biblioteka wiedzy', sub: 'Symbole i święta tradycja', route: 'Knowledge', icon: SunMoon, color: ACCENT },
];

// ── NOWE DANE — tab Odkryj ─────────────────────────────────────

const PLANETS_TODAY = [
  { symbol: '☉', name: 'Słońce', sign: 'Ryby', element: '🌊 Woda', keyword: 'empatia i marzenia', color: '#FBBF24', desc: 'Słońce w Rybach wzmacnia intuicję i wrażliwość duchową. Czas na refleksję i twórcze zanurzenie.' },
  { symbol: '☽', name: 'Księżyc', sign: 'Byk', element: '🌿 Ziemia', keyword: 'trwałość i spokój', color: '#C4B5FD', desc: 'Księżyc w Byku stabilizuje emocje. Szukaj gruntu w ciele, naturze i prostych przyjemnościach.' },
  { symbol: '☿', name: 'Merkury', sign: 'Ryby', element: '🌊 Woda', keyword: 'intuicyjna komunikacja', color: '#60A5FA', desc: 'Merkury w Rybach myśli obrazami i metaforami. Sprzyjający czas na pisanie, medytację i sen lucydny.' },
  { symbol: '♀', name: 'Wenus', sign: 'Baran', element: '🔥 Ogień', keyword: 'odważna miłość', color: '#F472B6', desc: 'Wenus w Baranie przyciąga przez autentyczność i bezpośredniość. Czas inicjować nowe połączenia.' },
  { symbol: '♂', name: 'Mars', sign: 'Bliźnięta', element: '💨 Powietrze', keyword: 'wielokierunkowość', color: '#EF4444', desc: 'Mars w Bliźniętach energię rozprasza — świadomie kieruj ją w jedno zadanie naraz.' },
  { symbol: '♃', name: 'Jowisz', sign: 'Bliźnięta', element: '💨 Powietrze', keyword: 'ekspansja przez naukę', color: '#F97316', desc: 'Jowisz w Bliźniętach wspiera kursy, sieciowanie i wymianę idei. Nauka przynosi teraz realne efekty.' },
  { symbol: '♄', name: 'Saturn', sign: 'Ryby', element: '🌊 Woda', keyword: 'granice duchowe', color: '#94A3B8', desc: 'Saturn w Rybach uczy strukturyzowania duchowości i emocjonalnych granic. Presja z sensem.' },
  { symbol: '♅', name: 'Uran', sign: 'Byk', element: '🌿 Ziemia', keyword: 'rewolucja stabilności', color: '#34D399', desc: 'Uran w Byku rewolucjonizuje finanse i wartości. Zmiany materii mogą nastąpić nagle.' },
];

const BIRTH_STARS = [
  { months: [3, 4], name: 'Aldebaran', constellation: 'Byk', meaning: 'Oko Byka — gwiazda sukcesu i siły materialnej. Niesie talent do przywództwa i wytrwałości.', color: '#F59E0B' },
  { months: [5, 6], name: 'Rigel', constellation: 'Orion', meaning: 'Lewa stopa Oriona — gwiazda ambicji i przekraczania limitów. Wskazuje talent do eksploracji i innowacji.', color: '#60A5FA' },
  { months: [7, 8], name: 'Syriusz', constellation: 'Wielki Pies', meaning: 'Najjaśniejsza gwiazda nieba — gwiazda duszy, wierności i przebłysków geniuszu. Intensywna i transformująca.', color: '#A78BFA' },
  { months: [9, 10], name: 'Arcturus', constellation: 'Wolarze', meaning: 'Gwiazda strażnika — niesie energię mądrości, ochrony i harmonizowania sprzeczności.', color: '#34D399' },
  { months: [11, 12], name: 'Antares', constellation: 'Skorpion', meaning: 'Serce Skorpiona — gwiazda transformacji i odwagi serca. Niesie dar głębokiej zmiany przez intensywność.', color: '#EF4444' },
  { months: [1, 2], name: 'Fomalhaut', constellation: 'Ryby Południowe', meaning: 'Gwiazda mistyczna — niesie dar wyobraźni, wrażliwości na piękno i połączenia z wyższymi wymiarami.', color: '#C4B5FD' },
];

const CONSTELLATIONS = [
  { name: 'Orion', emoji: '⚔️', season: 'zima', stars: 7, story: 'Myśliwy z mitologii greckiej. Zawiera Bellatrix, Rigel i Betelgeuse. Widoczny globalnie — jeden z najbardziej rozpoznawalnych wzorców nieba.', significance: 'Czas inicjacji i odwagi. Gdy Orion dominuje zimowym niebem, sprzyja podejmowaniu wyzwań.' },
  { name: 'Krzyż Południa', emoji: '✝️', season: 'wiosna', stars: 4, story: 'Najważniejsza konstelacja półkuli południowej. Wskazuje południe. Przez wieki był kompasem nawigatorów.', significance: 'Orientacja i przeznaczenie. Symbolizuje zdolność do odnajdywania kierunku nawet w ciemności.' },
  { name: 'Wielka Niedźwiedzica', emoji: '🐻', season: 'cały rok', stars: 7, story: 'Znana jako Wielki Wóz — wskazuje na Gwiazdę Polarną. W mitologii greckiej: nimfa Kallisto przemieniona przez Zeusa.', significance: 'Stałość i niezawodność. Niezmienny punkt odniesienia w rotacji nieba.' },
  { name: 'Perseusz', emoji: '🗡️', season: 'jesień/zima', stars: 9, story: 'Bohater, który pokonał Meduzę. Konstelacja zawiera Algol — "oko demona", zmienną gwiazdę symbolizującą transformację.', significance: 'Odwaga i pokonywanie strachu. Algol — gdzie mamy demona do przepracowania?' },
  { name: 'Plejady', emoji: '💫', season: 'jesień/zima', stars: 9, story: 'Siedem Sióstr — córki Atlasa. Czczone przez kultury od Australijskich Aborygenów po Indian. Sygnalizują pory roku i święta.', significance: 'Połączenie z przodkami i zbiorową pamięcią. Gdy Plejady wschodzą, czas na ceremony.' },
  { name: 'Centaur', emoji: '🏹', season: 'wiosna', stars: 11, story: 'Zawiera Alpha Centauri — najbliższy nam układ gwiezdny (4.37 lat świetlnych). Chiron: mądry centaur, nauczyciel herosów.', significance: 'Mądrość wynikająca z własnych ran. Najbliższy sąsiad kosmiczny symbolizuje bliskość transformacji.' },
];

function getBirthStarFromDataset(
  birthDate: string,
  dataset: typeof BIRTH_STARS,
): typeof BIRTH_STARS[number] | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  return dataset.find(s => s.months.includes(m)) ?? dataset[0];
}

// ── Real-time sky map helpers ─────────────────────────────────

function getJulianDay(date: Date): number {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  const h = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + h / 24 + B - 1524.5;
}

function getLocalSiderealTime(date: Date, longitude = 20): number {
  const JD = getJulianDay(date);
  const T = (JD - 2451545.0) / 36525.0;
  const theta = 280.46061837 + 360.98564736629 * (JD - 2451545.0) + 0.000387933 * T * T;
  return ((theta + longitude) % 360 + 360) % 360;
}

function equatorialToHorizontal(ra: number, dec: number, lst: number, lat = 52): { alt: number; az: number } {
  const H = ((lst - ra * 15) % 360 + 360) % 360;
  const Hrad = H * Math.PI / 180, decRad = dec * Math.PI / 180, latRad = lat * Math.PI / 180;
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(Hrad);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180 / Math.PI;
  const cosAlt = Math.cos(alt * Math.PI / 180);
  const cosAz = cosAlt > 0.001
    ? (Math.sin(decRad) - Math.sin(alt * Math.PI / 180) * Math.sin(latRad)) / (cosAlt * Math.cos(latRad))
    : 0;
  const az = (Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180 / Math.PI) * (Math.sin(Hrad) > 0 ? -1 : 1);
  return { alt, az: (az + 360) % 360 };
}

const STARS_CATALOGUE = [
  { name: 'Syriusz',    ra: 6.752,  dec: -16.72, mag: -1.46 },
  { name: 'Canopus',   ra: 6.399,  dec: -52.70, mag: -0.72 },
  { name: 'Arcturus',  ra: 14.261, dec: 19.18,  mag: -0.05 },
  { name: 'Vega',      ra: 18.616, dec: 38.78,  mag: 0.03 },
  { name: 'Capella',   ra: 5.278,  dec: 46.00,  mag: 0.08 },
  { name: 'Rigel',     ra: 5.243,  dec: -8.20,  mag: 0.13 },
  { name: 'Procyon',   ra: 7.655,  dec: 5.22,   mag: 0.38 },
  { name: 'Betelgeuse',ra: 5.919,  dec: 7.41,   mag: 0.42 },
  { name: 'Achernar',  ra: 1.629,  dec: -57.24, mag: 0.46 },
  { name: 'Hadar',     ra: 14.064, dec: -60.37, mag: 0.60 },
  { name: 'Altair',    ra: 19.846, dec: 8.87,   mag: 0.76 },
  { name: 'Acrux',     ra: 12.443, dec: -63.10, mag: 0.77 },
  { name: 'Aldebaran', ra: 4.599,  dec: 16.51,  mag: 0.87 },
  { name: 'Antares',   ra: 16.490, dec: -26.43, mag: 1.06 },
  { name: 'Spica',     ra: 13.420, dec: -11.16, mag: 1.04 },
  { name: 'Pollux',    ra: 7.755,  dec: 28.03,  mag: 1.15 },
  { name: 'Fomalhaut', ra: 22.961, dec: -29.62, mag: 1.16 },
  { name: 'Deneb',     ra: 20.691, dec: 45.28,  mag: 1.25 },
  { name: 'Mimosa',    ra: 12.795, dec: -59.69, mag: 1.25 },
  { name: 'Regulus',   ra: 10.139, dec: 11.97,  mag: 1.35 },
];

interface StarProjected {
  x: number;
  y: number;
  size: number;
  name: string;
  mag: number;
}

const MAP_R = Math.min(SW * 0.42, 160);
const MAP_CX = SW / 2;
const MAP_CY = MAP_R + 10;

function projectStars(date: Date): StarProjected[] {
  const lst = getLocalSiderealTime(date);
  return STARS_CATALOGUE.map(star => {
    const { alt, az } = equatorialToHorizontal(star.ra, star.dec, lst);
    if (alt <= 0) return null;
    const rProj = Math.cos(alt * Math.PI / 180);
    const x = MAP_CX + rProj * MAP_R * Math.sin(az * Math.PI / 180);
    const y = MAP_CY - rProj * MAP_R * Math.cos(az * Math.PI / 180);
    const size = Math.max(0.8, 3 - star.mag * 1.5);
    return { x, y, size, name: star.name, mag: star.mag };
  }).filter(Boolean) as StarProjected[];
}

const RealTimeSkyMap = ({ isDark, accent: ac, starsAboveHorizonLabel }: { isDark: boolean; accent: string; starsAboveHorizonLabel: string }) => {
  const [stars, setStars] = useState<StarProjected[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const autoY = useSharedValue(0);

  useEffect(() => {
    const now = new Date();
    setStars(projectStars(now));
    setCurrentTime(now);
    intervalRef.current = setInterval(() => {
      const d = new Date();
      setStars(projectStars(d));
      setCurrentTime(d);
    }, 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    autoY.value = withRepeat(
      withSequence(withTiming(6, { duration: 8000 }), withTiming(-6, { duration: 8000 })),
      -1, false
    );
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-18, Math.min(18, e.translationY * 0.14));
      tiltY.value = Math.max(-22, Math.min(22, e.translationX * 0.14));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${tiltX.value + autoY.value * 0.2}deg` },
      { rotateY: `${tiltY.value + autoY.value * 0.5}deg` },
    ],
  }));

  const mapW = SW - 32;
  const mapH = MAP_R * 2 + 20;
  const timeStr = currentTime.toLocaleTimeString(getLocaleCode(), { hour: '2-digit', minute: '2-digit' });
  const dateStr = currentTime.toLocaleDateString(getLocaleCode(), { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Cardinal direction positions
  const cardinals = [
    { label: 'N', x: MAP_CX, y: MAP_CY - MAP_R - 14 },
    { label: 'S', x: MAP_CX, y: MAP_CY + MAP_R + 14 },
    { label: 'E', x: MAP_CX + MAP_R + 14, y: MAP_CY },
    { label: 'W', x: MAP_CX - MAP_R - 14, y: MAP_CY },
  ];

  return (
    <View style={{ alignItems: 'center' }}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ alignItems: 'center' }, animStyle]}>
          <Svg width={mapW} height={mapH + 28} viewBox={`0 0 ${mapW} ${mapH + 28}`}>
            {/* Background dome */}
            <Circle cx={MAP_CX} cy={MAP_CY} r={MAP_R} fill={isDark ? 'rgba(5,10,30,0.95)' : 'rgba(220,235,255,0.95)'} stroke={ac} strokeWidth={1.5} />
            {/* Altitude rings */}
            {[0.33, 0.66].map((frac, i) => (
              <Circle key={i} cx={MAP_CX} cy={MAP_CY} r={MAP_R * frac}
                stroke={ac} strokeWidth={0.4} fill="none" strokeDasharray="4 8" opacity={0.3} />
            ))}
            {/* Meridian cross */}
            <Line x1={MAP_CX} y1={MAP_CY - MAP_R} x2={MAP_CX} y2={MAP_CY + MAP_R} stroke={ac} strokeWidth={0.3} opacity={0.2} />
            <Line x1={MAP_CX - MAP_R} y1={MAP_CY} x2={MAP_CX + MAP_R} y2={MAP_CY} stroke={ac} strokeWidth={0.3} opacity={0.2} />
            {/* Stars */}
            {stars.map((s, i) => (
              <G key={i}>
                <Circle cx={s.x} cy={s.y} r={s.size + 1.5} fill={ac} opacity={0.12} />
                <Circle cx={s.x} cy={s.y} r={s.size} fill="white" opacity={Math.max(0.5, 1 - s.mag * 0.3)} />
              </G>
            ))}
            {/* Horizon ring */}
            <Circle cx={MAP_CX} cy={MAP_CY} r={MAP_R} fill="none" stroke={ac} strokeWidth={2} opacity={0.7} />
            {/* Cardinal labels */}
            {cardinals.map(c => (
              <G key={c.label}>
                <Circle cx={c.x} cy={c.y} r={10} fill={isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)'} />
                <Polygon
                  points={`${c.x},${c.y - 5} ${c.x - 4},${c.y + 3} ${c.x + 4},${c.y + 3}`}
                  fill={ac}
                  opacity={0}
                />
              </G>
            ))}
          </Svg>
          {/* Cardinal text labels drawn as Text outside SVG for font rendering */}
          {[
            { label: 'N', top: MAP_CY - MAP_R - 20, left: MAP_CX - 5 },
            { label: 'S', top: MAP_CY + MAP_R + 6, left: MAP_CX - 5 },
            { label: 'E', top: MAP_CY - 7, left: MAP_CX + MAP_R + 6 },
            { label: 'W', top: MAP_CY - 7, left: MAP_CX - MAP_R - 14 },
          ].map(c => (
            <Text
              key={c.label}
              style={{
                position: 'absolute',
                top: c.top,
                left: c.left,
                color: ac,
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.5,
              }}
            >
              {c.label}
            </Text>
          ))}
        </Animated.View>
      </GestureDetector>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <Text style={{ color: ac, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}>{timeStr}</Text>
        <Text style={{ color: ac + '66', fontSize: 10 }}>·</Text>
        <Text style={{ color: ac + 'AA', fontSize: 11 }}>{dateStr}</Text>
        <Text style={{ color: ac + '66', fontSize: 10 }}>·</Text>
        <Text style={{ color: ac + 'AA', fontSize: 11 }}>{stars.length} {starsAboveHorizonLabel}</Text>
      </View>
    </View>
  );
};

export const StarsScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const tr = (key: string, pl: string, en: string, options?: Record<string, unknown>) =>
    t(key, { defaultValue: i18n.language?.startsWith('en') ? en : pl, ...options });
  const insets = useSafeAreaInsets();
  const { themeName, addFavoriteItem, removeFavoriteItem, isFavoriteItem } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');
  const isDark = !isLight;
  const aiAvailable = AiService.isLaunchAvailable();
  const dailyPlan = useMemo(() => SoulEngineService.generateDailyPlan(), []);
  const moonPhase = dailyPlan.moonPhase;
  const [activeTab, setActiveTab] = useState<'niebo' | 'planety' | 'tranzyty' | 'cykle' | 'odkryj'>('niebo');
  const userData = useAppStore((state) => state.userData);
  const birthStars = useMemo(() => BIRTH_STARS.map((star, idx) => ({
    ...star,
    constellation: tr(`stars.birthStar.${idx}.constellation`, star.constellation, ({
      'Byk': 'Taurus',
      'Orion': 'Orion',
      'Wielki Pies': 'Canis Major',
      'Wolarze': 'Boötes',
      'Skorpion': 'Scorpius',
      'Ryby Południowe': 'Piscis Austrinus',
    } as Record<string, string>)[star.constellation] || star.constellation),
    meaning: tr(`stars.birthStar.${idx}.meaning`, star.meaning, [
      'The Eye of Taurus — a star of success and material strength. It carries a talent for leadership and perseverance.',
      'The left foot of Orion — a star of ambition and going beyond limits. It suggests talent for exploration and innovation.',
      'The brightest star in the sky — a star of soul, loyalty, and flashes of genius. Intense and transformative.',
      'A guardian star — it carries the energy of wisdom, protection, and harmonizing opposites.',
      'The heart of Scorpio — a star of transformation and courage of the heart. It brings the gift of deep change through intensity.',
      'A mystical star — it carries the gift of imagination, sensitivity to beauty, and connection with higher dimensions.',
    ][idx] || star.meaning),
  })), [tr]);
  const birthStar = useMemo(() => getBirthStarFromDataset(userData?.birthDate ?? '', birthStars), [birthStars, userData?.birthDate]);
  const constellations = useMemo(() => CONSTELLATIONS.map((item, idx) => ({
    ...item,
    name: tr(`stars.constellation.${idx}.name`, item.name, ({
      'Orion': 'Orion',
      'Krzyż Południa': 'Southern Cross',
      'Wielka Niedźwiedzica': 'Ursa Major',
      'Perseusz': 'Perseus',
      'Plejady': 'Pleiades',
      'Centaur': 'Centaurus',
    } as Record<string, string>)[item.name] || item.name),
    season: tr(`stars.constellation.${idx}.season`, item.season, ({
      'zima': 'winter',
      'wiosna': 'spring',
      'cały rok': 'all year',
      'jesień/zima': 'autumn/winter',
    } as Record<string, string>)[item.season] || item.season),
    story: tr(`stars.constellation.${idx}.story`, item.story, [
      'The hunter from Greek mythology. It contains Bellatrix, Rigel, and Betelgeuse. Visible globally — one of the most recognizable sky patterns.',
      'The most important constellation of the southern hemisphere. It points south. For centuries it served as a compass for navigators.',
      'Known as the Big Dipper — it points to the North Star. In Greek mythology: the nymph Callisto transformed by Zeus.',
      'The hero who defeated Medusa. The constellation contains Algol — the “demon eye,” a variable star symbolizing transformation.',
      'The Seven Sisters — daughters of Atlas. Revered by cultures from Aboriginal Australians to Indigenous peoples. They mark seasons and festivals.',
      'It contains Alpha Centauri — our nearest stellar system (4.37 light-years). Chiron: the wise centaur, teacher of heroes.',
    ][idx] || item.story),
    significance: tr(`stars.constellation.${idx}.significance`, item.significance, [
      'A time of initiation and courage. When Orion dominates the winter sky, it supports meeting challenges directly.',
      'Orientation and destiny. It symbolizes the ability to find direction even in darkness.',
      'Stability and reliability. An unchanging point of reference in the turning sky.',
      'Courage and overcoming fear. Algol asks where the inner demon still waits to be worked through.',
      'Connection with ancestors and collective memory. When the Pleiades rise, it is time for ceremony.',
      'Wisdom born from one’s own wounds. Our nearest cosmic neighbor symbolizes how close transformation truly is.',
    ][idx] || item.significance),
  })), [tr]);
  const [expandedConstellation, setExpandedConstellation] = useState<string | null>(null);
  const moonPhases = useMemo(() => MOON_PHASES.map((phase) => ({
    ...phase,
    name: tr(`stars.moon.${phase.key}.name`, phase.name, ({
      new_moon: 'New Moon',
      first_quarter: 'First Quarter',
      full_moon: 'Full Moon',
      last_quarter: 'Last Quarter',
    } as Record<string, string>)[phase.key] || phase.name),
    energy: tr(`stars.moon.${phase.key}.energy`, phase.energy, ({
      new_moon: 'Seeding',
      first_quarter: 'Shield',
      full_moon: 'Culmination',
      last_quarter: 'Closure',
    } as Record<string, string>)[phase.key] || phase.energy),
    copy: tr(`stars.moon.${phase.key}.copy`, phase.copy, ({
      new_moon: 'A time of seeding, silence, and forming intention before motion. Do not rush into action.',
      first_quarter: 'A moment of decision and testing courage in spite of resistance. Act through tension.',
      full_moon: 'The peak of emotion and truth revealed. Culmination of the process. Release what slows you down.',
      last_quarter: 'Ordering, releasing the unnecessary, and preparing for a new cycle.',
    } as Record<string, string>)[phase.key] || phase.copy),
  })), [tr]);
  const weeklyEnergies = useMemo(() => WEEKLY_ENERGIES.map((item, idx) => ({
    ...item,
    day: tr(`stars.week.${idx}.day`, item.day, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx] || item.day),
    planet: tr(`stars.week.${idx}.planet`, item.planet, ({
      'Księżyc': 'Moon', 'Mars': 'Mars', 'Merkury': 'Mercury', 'Jowisz': 'Jupiter', 'Wenus': 'Venus', 'Saturn': 'Saturn', 'Słońce': 'Sun',
    } as Record<string, string>)[item.planet] || item.planet),
    energy: tr(`stars.week.${idx}.energy`, item.energy, ({
      'emocje, intuicja': 'emotion, intuition',
      'działanie, odwaga': 'action, courage',
      'komunikacja, myśl': 'communication, thought',
      'ekspansja, mądrość': 'expansion, wisdom',
      'miłość, harmonia': 'love, harmony',
      'struktura, dyscyplina': 'structure, discipline',
      'witalność, świadomość': 'vitality, awareness',
    } as Record<string, string>)[item.energy] || item.energy),
  })), [tr]);
  const cosmicWeather = useMemo<Record<number, string>>(() => ({
    0: tr('stars.weather.0', COSMIC_WEATHER[0], 'Sunday carries the energy of the Sun — a good time to celebrate yourself and restore your will.'),
    1: tr('stars.weather.1', COSMIC_WEATHER[1], 'Monday belongs to the Moon — a day of heightened sensitivity and connection with instinct.'),
    2: tr('stars.weather.2', COSMIC_WEATHER[2], 'Tuesday has the energy of Mars — ideal for initiating projects and acting assertively.'),
    3: tr('stars.weather.3', COSMIC_WEATHER[3], 'Wednesday with Mercury — a time for communication, writing, conversations, and learning new things.'),
    4: tr('stars.weather.4', COSMIC_WEATHER[4], 'Thursday is the day of Jupiter — supportive for expansion, travel, and philosophical thinking.'),
    5: tr('stars.weather.5', COSMIC_WEATHER[5], 'Friday carries the vibration of Venus — create space for beauty, relationships, and pleasure.'),
    6: tr('stars.weather.6', COSMIC_WEATHER[6], 'Saturday with Saturn — good for structure, discipline, and finishing what has already begun.'),
  }), [tr]);
  const astrologyLinks = useMemo(() => ASTROLOGY_LINKS.map((link) => ({
    ...link,
    label: tr(`stars.links.${link.route}.label`, link.label, ({
      LunarCalendar: 'Lunar Calendar',
      CosmicWeather: 'Cosmic Weather',
      Numerology: 'Numerology',
      Matrix: 'Life Matrix',
      Compatibility: 'Compatibility',
      Knowledge: 'Knowledge Library',
    } as Record<string, string>)[link.route] || link.label),
    sub: tr(`stars.links.${link.route}.sub`, link.sub, ({
      LunarCalendar: 'Moon phases, intentions, and lunar rituals',
      CosmicWeather: 'Daily energetic forecast of the planets',
      Numerology: 'Life path and personal year',
      Matrix: 'Number patterns and axes of tension',
      Compatibility: 'A relational map of signs',
      Knowledge: 'Symbols and sacred tradition',
    } as Record<string, string>)[link.route] || link.sub),
  })), [tr]);
  const planetsData = useMemo(() => PLANETS_DATA.map((planet) => ({
    ...planet,
    name: tr(`stars.planet.${planet.symbol}.name`, planet.name, ({
      '☉': 'Sun', '☽': 'Moon', '☿': 'Mercury', '♀': 'Venus', '♂': 'Mars', '♃': 'Jupiter', '♄': 'Saturn', '♅': 'Uranus',
    } as Record<string, string>)[planet.symbol] || planet.name),
    domain: tr(`stars.planet.${planet.symbol}.domain`, planet.domain, ({
      'Tożsamość': 'Identity', 'Emocje': 'Emotions', 'Komunikacja': 'Communication', 'Miłość i wartości': 'Love and values', 'Działanie': 'Action', 'Ekspansja': 'Expansion', 'Struktura': 'Structure', 'Rewolucja': 'Revolution',
    } as Record<string, string>)[planet.domain] || planet.domain),
    currentSign: tr(`stars.planet.${planet.symbol}.sign`, planet.currentSign, ({
      'Ryby': 'Pisces', 'Byk': 'Taurus', 'Baran': 'Aries', 'Bliźnięta': 'Gemini',
    } as Record<string, string>)[planet.currentSign] || planet.currentSign),
    energy: tr(`stars.planet.${planet.symbol}.energy`, planet.energy, ({
      'ekspansywna': 'expansive', 'stabilizująca': 'stabilizing', 'intuicyjna': 'intuitive', 'aktywna': 'active', 'dynamiczna': 'dynamic', 'rozszerzająca': 'expanding', 'strukturyzująca': 'structuring', 'rewolucyjna': 'revolutionary',
    } as Record<string, string>)[planet.energy] || planet.energy),
    desc: tr(`stars.planet.${planet.symbol}.desc`, planet.desc, ({
      '☉': 'The core of identity and will. Your solar sign defines the center of character and the direction of personal growth.',
      '☽': 'Instinctive reactions, safety needs, and the emotional rhythm of the day. It changes sign every 2.5 days.',
      '☿': 'Thinking, words, and your style of processing information. In retrograde, it is a time for revision, not new decisions.',
      '♀': 'Patterns of attraction, values, and aesthetics. It defines what we seek in relationships and what we truly cherish.',
      '♂': 'Drive, desire, and force. It determines how we fight, pursue goals, and express anger or passion.',
      '♃': 'Growth, luck, and wisdom. For about a year it activates one life area — where you now have cosmic support.',
      '♄': 'Boundaries, lessons, and maturity. Where Saturn is, there is pressure — but also the place where you build the strongest foundation.',
      '♅': 'Breakthroughs, system changes, and unexpected reversals. A generational planet of revolution in structure.',
    } as Record<string, string>)[planet.symbol] || planet.desc),
  })), [tr]);
  const planetWisdom = useMemo<Record<string, string>>(() => Object.fromEntries(planetsData.map((planet) => [
    planet.name,
    tr(`stars.wisdom.${planet.symbol}`, PLANET_WISDOM[(Object.keys(PLANET_WISDOM) as Array<keyof typeof PLANET_WISDOM>).find(k => k === planet.name) as any] || PLANET_WISDOM[(Object.keys(PLANET_WISDOM)[0] as keyof typeof PLANET_WISDOM)], ({
      '☉': 'Your essence shines regardless of circumstance. Shine.',
      '☽': 'Your emotions are a map — not an obstacle, but a compass.',
      '☿': 'Words have the power to create. Choose them consciously.',
      '♀': 'Beauty is not a luxury — it is the language of the soul.',
      '♂': 'Your energy is sacred. Direct it where you want to grow.',
      '♃': 'The universe is on your side. Dare to expand.',
      '♄': 'Discipline is a form of love for your future.',
      '♅': 'Revolution begins with a thought that no longer fits inside old frames.',
    } as Record<string, string>)[planet.symbol] || ''),
  ])), [planetsData, tr]);
  const transitsData = useMemo(() => TRANSITS_DATA.map((item, idx) => ({
    ...item,
    title: tr(`stars.transit.${idx}.title`, item.title, ['Jupiter in Gemini', 'Saturn in Pisces', 'Uranus in Taurus', 'Neptune in Pisces'][idx] || item.title),
    effect: tr(`stars.transit.${idx}.effect`, item.effect, [
      'Expansion through communication, learning, and short journeys. A time for building networks and exchanging ideas.',
      'Boundaries in emotion, intuition, and spirituality. A need to structure your inner world.',
      'A revolution in finances, stability, and material values. A changed relationship with possession.',
      'A dissolving of boundaries in spirituality and empathy. A generational wave of mysticism, art, and illusion.',
    ][idx] || item.effect),
  })), [tr]);
  const celestialCycles = useMemo(() => CELESTIAL_CYCLES.map((cycle, idx) => ({
    ...cycle,
    name: tr(`stars.cycle.${idx}.name`, cycle.name, ['Saturn Cycle (Saturn Return)', 'Jupiter Cycle', 'Lunar Nodes Cycle', 'Secondary Progression', 'Solar Cycle'][idx] || cycle.name),
    desc: tr(`stars.cycle.${idx}.desc`, cycle.desc, [
      'Every 29.5 years Saturn returns to its natal position. It is a time of deep revision and building a mature identity.',
      'Every 12 years Jupiter returns to the natal sign, activating a strong sense of meaning and possibility for expansion.',
      'The cycle of Rahu and Ketu — karmic nodes. It activates themes of destiny, destabilization, and soul lessons.',
      'One day after birth equals one year of life. A method of deep analysis of inner evolution in the birth chart.',
      'The return of the Sun to its natal position. Every birthday is a new symbolic year and a new layer of purpose.',
    ][idx] || cycle.desc),
  })), [tr]);
  const planetsToday = useMemo(() => PLANETS_TODAY.map((planet, idx) => ({
    ...planet,
    name: tr(`stars.today.${idx}.name`, planet.name, ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus'][idx] || planet.name),
    sign: tr(`stars.today.${idx}.sign`, planet.sign, ({
      'Ryby': 'Pisces', 'Byk': 'Taurus', 'Baran': 'Aries', 'Bliźnięta': 'Gemini',
    } as Record<string, string>)[planet.sign] || planet.sign),
    element: tr(`stars.today.${idx}.element`, planet.element, ({
      '🌊 Woda': '🌊 Water', '🌿 Ziemia': '🌿 Earth', '🔥 Ogień': '🔥 Fire', '💨 Powietrze': '💨 Air',
    } as Record<string, string>)[planet.element] || planet.element),
    keyword: tr(`stars.today.${idx}.keyword`, planet.keyword, [
      'empathy and dreams', 'stability and calm', 'intuitive communication', 'courageous love',
      'multi-directionality', 'expansion through learning', 'spiritual boundaries', 'revolution of stability',
    ][idx] || planet.keyword),
    desc: tr(`stars.today.${idx}.desc`, planet.desc, [
      'The Sun in Pisces strengthens intuition and spiritual sensitivity. A time for reflection and creative immersion.',
      'The Moon in Taurus stabilizes emotions. Seek ground in the body, in nature, and in simple pleasures.',
      'Mercury in Pisces thinks in images and metaphors. A supportive time for writing, meditation, and lucid dreaming.',
      'Venus in Aries attracts through authenticity and directness. A time to initiate new connections.',
      'Mars in Gemini disperses energy — consciously guide it into one task at a time.',
      'Jupiter in Gemini supports courses, networking, and the exchange of ideas. Learning now brings real effects.',
      'Saturn in Pisces teaches the structuring of spirituality and emotional boundaries. Pressure with meaning.',
      'Uranus in Taurus revolutionizes finances and values. Changes in matter can arrive suddenly.',
    ][idx] || planet.desc),
  })), [tr]);

  const textColor = isLight ? '#1A1420' : '#E0F0FF';
  const subColor = isLight ? '#3A5A7A' : '#7A9AB8';
  const cardBg = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(96,165,250,0.10)';
  const cardBorder = isLight ? 'rgba(96,165,250,0.30)' : 'rgba(96,165,250,0.30)';

  return (
    <View style={[ss.container, { backgroundColor: isLight ? '#EEF4FA' : '#020810' }]}>
      <AstrologyHeroBg isDark={!isLight}/>
      <SafeAreaView edges={['top']} style={ss.safeArea}>

        {/* HEADER */}
        <View style={ss.header}>
          <Pressable onPress={() => { navigation.canGoBack() ? navigation.goBack() : navigateToDashboardSurface(navigation, 'horoscope'); }}
            style={ss.backBtn} hitSlop={14}>
            <ChevronLeft color={ACCENT} size={26} strokeWidth={1.6}/>
          </Pressable>
          <View style={ss.headerCenter}>
            <Text style={[ss.headerEyebrow, { color: ACCENT }]}>{tr('stars.header.eyebrow', 'OBSERWATORIUM KOSMICZNE', 'COSMIC OBSERVATORY')}</Text>
            <Text style={[ss.headerTitle, { color: textColor }]}>{tr('stars.header.title', 'Niebo, tranzyty i cykle', 'Sky, transits, and cycles')}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <MusicToggleButton color={ACCENT} size={18} />
            <Pressable
              onPress={() => {
                if (isFavoriteItem('stars')) {
                  removeFavoriteItem('stars');
                } else {
                  addFavoriteItem({ id: 'stars', label: tr('stars.favorite', 'Gwiazdy', 'Stars'), route: 'Stars', params: {}, icon: 'Stars', color: ACCENT, addedAt: new Date().toISOString() });
                }
              }}
              style={[ss.backBtn, { alignItems: 'center', justifyContent: 'center' }]}
              hitSlop={12}
            >
              <Star color={isFavoriteItem('stars') ? ACCENT : ACCENT + '88'} size={18} strokeWidth={1.8} fill={isFavoriteItem('stars') ? ACCENT : 'none'} />
            </Pressable>
          </View>
        </View>

        {/* TABS */}
        <View style={[ss.tabOuter, { backgroundColor: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.35)', borderColor: cardBorder }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ss.tabBar}>
            {(['niebo', 'planety', 'tranzyty', 'cykle', 'odkryj'] as const).map(tab => (
              <Pressable key={tab} onPress={() => setActiveTab(tab)}
                style={[ss.tab, activeTab === tab && { backgroundColor: ACCENT }]}>
                <Text style={[ss.tabText, { color: activeTab === tab ? '#FFF' : ACCENT + 'AA' }]}>
                  {{
                    niebo: tr('stars.tab.sky', 'Niebo', 'Sky'),
                    planety: tr('stars.tab.planets', 'Planety', 'Planets'),
                    tranzyty: tr('stars.tab.transits', 'Tranzyty', 'Transits'),
                    cykle: tr('stars.tab.cycles', 'Cykle', 'Cycles'),
                    odkryj: tr('stars.tab.discover', 'Odkryj', 'Discover'),
                  }[tab]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[ss.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') }]}
          showsVerticalScrollIndicator={false}
        >

          {/* ── TAB: NIEBO ── */}
          {activeTab === 'niebo' && (
            <>
              {/* Hero: Mapa nieba z kołem zodiakalnym */}
              <Animated.View entering={FadeInDown.duration(320)}>
                <View style={[ss.skyCard, { backgroundColor: cardBg, borderColor: ACCENT + '55' }]}>
                  <LinearGradient colors={[ACCENT + '20', ACCENT + '12', 'transparent']} style={StyleSheet.absoluteFill}/>
                  <View style={ss.skyCardHeader}>
                    <Text style={[ss.eyebrow, { color: ACCENT }]}>{tr('stars.sky.liveMap', 'MAPA NIEBA — CZAS RZECZYWISTY', 'SKY MAP — REAL TIME')}</Text>
                    <View style={[ss.liveChip, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '44' }]}>
                      <Activity color={ACCENT} size={10}/>
                      <Text style={[ss.liveText, { color: ACCENT }]}>{tr('stars.sky.active', 'AKTYWNA', 'ACTIVE')}</Text>
                    </View>
                  </View>
                  <RealTimeSkyMap
                    isDark={!isLight}
                    accent={ACCENT}
                    starsAboveHorizonLabel={tr('stars.sky.starsAboveHorizon', 'gwiazd nad horyzontem', 'stars above the horizon')}
                  />
                  <Text style={[ss.caption, { color: subColor }]}>{tr('stars.sky.caption', 'Aktualna pozycja gwiazd nad horyzontem (51°N, aktualizacja co 60s)', 'Current star positions above the horizon (51°N, updates every 60s)')}</Text>
                </View>
              </Animated.View>

              {/* Legenda mapy nieba */}
              <Animated.View entering={FadeInDown.delay(25).duration(260)}>
                <View style={[ss.skyCard, { backgroundColor: cardBg, borderColor: ACCENT + '33', paddingVertical: 16, paddingHorizontal: 18 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Info color={ACCENT} size={13} strokeWidth={1.6} />
                    <Text style={[ss.eyebrow, { color: ACCENT, letterSpacing: 1.5 }]}>{tr('stars.sky.legend', 'LEGENDA MAPY', 'MAP LEGEND')}</Text>
                  </View>
                  {[
                    { symbol: 'N/S/E/W', label: tr('stars.legend.directions', 'Kierunki świata', 'Cardinal directions'), desc: tr('stars.legend.directionsDesc', 'Mapa zorientowana na północ', 'The map is oriented to the north') },
                    { symbol: '●', label: tr('stars.legend.stars', 'Gwiazdy', 'Stars'), desc: tr('stars.legend.starsDesc', 'Jasność = wielkość gwiazdowa (20 najjaśniejszych)', 'Brightness = stellar magnitude (20 brightest stars)') },
                    { symbol: '○', label: tr('stars.legend.horizon', 'Horyzont', 'Horizon'), desc: tr('stars.legend.horizonDesc', 'Zewnętrzny pierścień = linia horyzontu', 'The outer ring marks the horizon line') },
                  ].map((item) => (
                    <View key={item.symbol} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                      <Text style={{ color: ACCENT, fontSize: 15, width: 30, fontWeight: '600' }}>{item.symbol}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: textColor, fontSize: 12, fontWeight: '600' }}>{item.label}</Text>
                        <Text style={{ color: subColor, fontSize: 11, marginTop: 1 }}>{item.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(65).duration(280)}>
                <View style={[ss.observatoryDeck, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                  <Text style={[ss.eyebrow, { color: ACCENT, marginBottom: 10 }]}>{tr('stars.observatory.eyebrow', 'KOMNATY OBSERWATORIUM', 'OBSERVATORY CHAMBERS')}</Text>
                  <View style={ss.observatoryGrid}>
                    {[
                      { title: tr('stars.observatory.live', 'Sky Live', 'Sky Live'), copy: tr('stars.observatory.liveCopy', 'Zobacz bieżące niebo, horyzont i najjaśniejsze gwiazdy.', 'See the current sky, horizon, and brightest stars.') },
                      { title: tr('stars.observatory.phase', 'Faza', 'Phase'), copy: tr('stars.observatory.phaseCopy', 'Połącz mapę nieba z aktualnym rytmem Księżyca.', 'Connect the sky map with the Moon’s current rhythm.') },
                      { title: tr('stars.observatory.interpretation', 'Interpretacja', 'Interpretation'), copy: tr('stars.observatory.interpretationCopy', 'Przejdź od astronomii do znaczenia i osobistego wglądu.', 'Move from astronomy to meaning and personal insight.') },
                    ].map((item) => (
                      <View key={item.title} style={[ss.observatoryTile, { borderColor: isLight ? ACCENT + '22' : ACCENT + '44', backgroundColor: isLight ? 'rgba(255,255,255,0.45)' : ACCENT + '22' }]}>
                        <Text style={[ss.observatoryTitle, { color: ACCENT }]}>{item.title}</Text>
                        <Text style={[ss.observatoryCopy, { color: subColor }]}>{item.copy}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Animated.View>

              {/* Energia Dnia + Kosmiczny Kalendarz Tygodnia */}
              {(() => {
                const todayJsDay = new Date().getDay();
                const todayEnergyIdx = getWeeklyEnergyIndex(todayJsDay);
                const todayEnergy = weeklyEnergies[todayEnergyIdx];
                const cosmicText = cosmicWeather[todayJsDay] ?? '';
                return (
                  <>
                    <Animated.View entering={FadeInDown.delay(70).duration(280)}>
                      <View style={[ss.cosmicWeatherCard, { backgroundColor: cardBg, borderColor: todayEnergy.color + '55' }]}>
                        <LinearGradient
                          colors={[todayEnergy.color + '18', todayEnergy.color + '06', 'transparent'] as const}
                          style={StyleSheet.absoluteFill}
                        />
                        <Text style={[ss.eyebrow, { color: todayEnergy.color, marginBottom: 8 }]}>{tr('stars.energyOfDay', 'ENERGIA DNIA', 'ENERGY OF THE DAY')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <View style={[ss.dayPlanetOrb, { backgroundColor: todayEnergy.color + '22', borderColor: todayEnergy.color + '55' }]}>
                            <Text style={[ss.dayPlanetSymbol, { color: todayEnergy.color }]}>{todayEnergy.planet[0]}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[ss.dayPlanetName, { color: todayEnergy.color }]}>{todayEnergy.planet}</Text>
                            <Text style={[ss.dayPlanetEnergy, { color: subColor }]}>{todayEnergy.energy}</Text>
                          </View>
                        </View>
                        <Text style={[ss.cosmicWeatherText, { color: subColor }]}>{cosmicText}</Text>
                      </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(75).duration(280)}>
                      <View style={[ss.weekCalCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                        <Text style={[ss.eyebrow, { color: ACCENT, marginBottom: 10 }]}>{tr('stars.weekCalendar', 'KALENDARZ TYGODNIA', 'WEEK CALENDAR')}</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={ss.weekRail}
                        >
                          {weeklyEnergies.map((we, idx) => {
                            const isToday = idx === todayEnergyIdx;
                            return (
                              <View
                                key={we.day}
                                style={[
                                  ss.weekChip,
                                  {
                                    borderColor: isToday ? we.color + '99' : cardBorder,
                                    backgroundColor: isToday ? we.color + '22' : 'transparent',
                                    borderWidth: isToday ? 1.5 : 1,
                                  },
                                ]}
                              >
                                <Text style={[ss.weekChipDay, { color: isToday ? we.color : subColor }]}>{we.day}</Text>
                                <Text style={[ss.weekChipPlanet, { color: isToday ? we.color : textColor }]}>{we.planet}</Text>
                                <Text style={[ss.weekChipEnergy, { color: isToday ? we.color + 'CC' : subColor + '99' }]}>{we.energy}</Text>
                              </View>
                            );
                          })}
                        </ScrollView>
                      </View>
                    </Animated.View>
                  </>
                );
              })()}

              {/* Faza księżyca — hero z danymi */}
              <Animated.View entering={FadeInDown.delay(50).duration(480)}>
                <View style={[ss.moonHeroCard, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}>
                  <LinearGradient colors={[ACCENT + '14', 'transparent']} style={StyleSheet.absoluteFill}/>
                  <View style={ss.moonHeroRow}>
                    <Text style={ss.moonBigIcon}>{moonPhase.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[ss.eyebrow, { color: ACCENT, marginBottom: 4 }]}>{tr('stars.moon.current', 'AKTUALNA FAZA KSIĘŻYCA', 'CURRENT MOON PHASE')}</Text>
                      <Text style={[ss.moonName, { color: ACCENT }]}>{moonPhase.name}</Text>
                      <View style={[ss.energyChip, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '33' }]}>
                        <Text style={[ss.energyText, { color: ACCENT }]}>
                          {moonPhases.find(m => m.key === moonPhase.key)?.energy || tr('stars.moon.active', 'aktywna', 'active')}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[ss.moonCopy, { color: subColor }]}>
                    {moonPhases.find(m => m.key === moonPhase.key)?.copy || tr('stars.moon.defaultCopy', 'Rytm nieba prowadzi rytm dnia.', 'The rhythm of the sky guides the rhythm of the day.')}
                  </Text>
                  {/* Szyna faz */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ss.phaseRail}>
                    {moonPhases.map(phase => {
                      const active = phase.key === moonPhase.key;
                      return (
                        <View key={phase.key}
                          style={[ss.phaseChip, {
                            borderColor: active ? phase.color + '88' : cardBorder,
                            backgroundColor: active ? phase.color + '22' : 'transparent'
                          }]}>
                          <Text style={ss.phaseIcon}>{phase.icon}</Text>
                          <Text style={[ss.phaseName, { color: active ? phase.color : subColor }]}>{phase.name}</Text>
                          <Text style={[ss.phaseEnergy, { color: active ? phase.color : subColor + '88' }]}>{phase.energy}</Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              </Animated.View>

              {/* Sygnał astrologiczny dnia */}
              <Animated.View entering={FadeInDown.delay(140).duration(480)}>
                <View style={[ss.signalCard, { backgroundColor: isLight ? ACCENT + '18' : ACCENT + '22', borderColor: ACCENT + '44' }]}>
                  <View style={ss.signalHeader}>
                    <View style={[ss.signalOrb, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '44' }]}>
                      <Zap color={ACCENT} size={16}/>
                    </View>
                    <Text style={[ss.eyebrow, { color: ACCENT, marginBottom: 0 }]}>{tr('stars.signal.eyebrow', 'SYGNAŁ ASTROLOGICZNY DNIA', 'ASTROLOGICAL SIGNAL OF THE DAY')}</Text>
                  </View>
                  <Text style={[ss.signalText, { color: textColor }]}>{dailyPlan.astrologyGuidance.headline}</Text>
                  <Text style={[ss.signalSub, { color: subColor }]}>{dailyPlan.astrologyGuidance.support}</Text>
                  {dailyPlan.astrologyGuidance.chineseInsight && (
                    <>
                      <View style={[ss.signalDivider, { backgroundColor: ACCENT + '22' }]}/>
                      <Text style={[ss.signalChineseLabel, { color: ACCENT }]}>{tr('stars.signal.chineseLayer', 'WARSTWA CHIŃSKA', 'CHINESE LAYER')}</Text>
                      <Text style={[ss.signalChinese, { color: subColor }]}>{dailyPlan.astrologyGuidance.chineseInsight}</Text>
                    </>
                  )}
                </View>
              </Animated.View>

              {/* Szybkie przejścia */}
              <Text style={[ss.sectionTitle, { color: ACCENT }]}>{tr('stars.relatedModules', 'POWIĄZANE MODUŁY', 'RELATED MODULES')}</Text>
              <View style={ss.linksGrid}>
                {astrologyLinks.map((link, i) => {
                  const Icon = link.icon;
                  return (
                    <Animated.View key={link.route} entering={FadeInUp.delay(180 + i*50).duration(260)} style={ss.linkWrap}>
                      <Pressable onPress={() => navigation.navigate(link.route)}
                        style={[ss.linkCard, { backgroundColor: cardBg, borderColor: link.color + '33' }]}>
                        <View style={[ss.linkIcon, { backgroundColor: link.color + '18', borderColor: link.color + '33' }]}>
                          <Icon color={link.color} size={20} strokeWidth={1.8}/>
                        </View>
                        <Text style={[ss.linkLabel, { color: textColor }]}>{link.label}</Text>
                        <Text style={[ss.linkSub, { color: subColor }]}>{link.sub}</Text>
                        <ArrowRight color={link.color} size={13} style={{ marginTop: 8, alignSelf: 'flex-end' }}/>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            </>
          )}

          {/* ── TAB: PLANETY ── */}
          {activeTab === 'planety' && (
            <>
              <Animated.View entering={FadeInDown.duration(320)}>
                <View style={[ss.card, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}>
                  <LinearGradient colors={[ACCENT + '16', 'transparent']} style={StyleSheet.absoluteFill}/>
                  <Text style={[ss.eyebrow, { color: ACCENT }]}>{tr('stars.planets.atlas', 'ATLAS PLANET — ZNACZENIE I CYKL', 'PLANET ATLAS — MEANING AND CYCLE')}</Text>
                  <Text style={[ss.cardIntro, { color: subColor }]}>
                    {tr('stars.planets.intro', 'Każda planeta rządzi innym obszarem życia i porusza się przez zodiak w swoim własnym rytmie. Znajomość cykli daje narzędzie rozumienia timing-u, a nie tylko charakteru.', 'Each planet rules a different area of life and moves through the zodiac in its own rhythm. Knowing the cycles gives you a tool for understanding timing, not only character.')}
                  </Text>
                </View>
              </Animated.View>

              {planetsData.map((planet, i) => (
                <Animated.View key={planet.symbol} entering={FadeInDown.delay(i*50).duration(250)}>
                  <View style={[ss.planetCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <View style={ss.planetTop}>
                      <View style={[ss.planetSymbolBox, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '33' }]}>
                        <Text style={[ss.planetSymbol, { color: ACCENT }]}>{planet.symbol}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={ss.planetNameRow}>
                          <Text style={[ss.planetName, { color: ACCENT }]}>{planet.name}</Text>
                          <View style={[ss.planetCycleChip, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '22' }]}>
                            <Text style={[ss.planetCycleText, { color: ACCENT }]}>{planet.cycle}</Text>
                          </View>
                        </View>
                        <Text style={[ss.planetDomain, { color: subColor }]}>{planet.domain}</Text>
                      </View>
                      <View style={[ss.energyDot, {
                        backgroundColor: planet.energy === 'ekspansywna' || planet.energy === 'rozszerzająca' ? '#34D399' :
                          planet.energy === 'rewolucyjna' ? '#F97316' :
                          planet.energy === 'strukturyzująca' ? '#94A3B8' : ACCENT,
                        opacity: 0.7
                      }]}/>
                    </View>
                    <Text style={[ss.planetDesc, { color: subColor }]}>{planet.desc}</Text>
                    <View style={[ss.currentSignRow, { borderTopColor: ACCENT + '18' }]}>
                      <Text style={[ss.currentSignLabel, { color: ACCENT }]}>{tr('stars.planets.currently', 'Aktualnie', 'Currently')}: </Text>
                      <Text style={[ss.currentSign, { color: textColor }]}>{planet.currentSign}</Text>
                      <Text style={[ss.currentEnergy, { color: subColor }]}> · {planet.energy}</Text>
                    </View>
                    {planetWisdom[planet.name] != null && (
                      <View style={[ss.wisdomRow, { borderTopColor: ACCENT + '12' }]}>
                        <Text style={[ss.wisdomText, { color: subColor }]}>
                          {'\u201C'}{planetWisdom[planet.name]}{'\u201D'}
                        </Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
              ))}

              {/* AI Astrolog */}
              {aiAvailable && (
                <Animated.View entering={FadeInDown.delay(400).duration(480)}>
                  <Pressable
                    onPress={() => navigation.navigate('Reports')}
                    style={[ss.aiCard, { backgroundColor: isLight ? ACCENT + '18' : ACCENT + '22', borderColor: ACCENT + '44' }]}
                  >
                    <Brain color={ACCENT} size={22} strokeWidth={1.8}/>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={[ss.aiTitle, { color: ACCENT }]}>{tr('stars.planets.transitReport', 'Raport tranzytów', 'Transit Report')}</Text>
                      <Text style={[ss.aiSub, { color: subColor }]}>{tr('stars.planets.transitReportDesc', 'Przejdź do raportu i nazwij, które planety oraz układy naprawdę wpływają teraz na Twoje decyzje.', 'Open the report and name which planets and alignments are truly influencing your decisions right now.')}</Text>
                    </View>
                    <ArrowRight color={ACCENT} size={16}/>
                  </Pressable>
                </Animated.View>
              )}
            </>
          )}

          {/* ── TAB: TRANZYTY ── */}
          {activeTab === 'tranzyty' && (
            <>
              {/* Aktywne wielkie tranzyty */}
              <Animated.View entering={FadeInDown.duration(320)}>
                <View style={[ss.card, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}>
                  <LinearGradient colors={[ACCENT + '16', 'transparent']} style={StyleSheet.absoluteFill}/>
                  <Text style={[ss.eyebrow, { color: ACCENT }]}>{tr('stars.transits.big', 'WIELKIE TRANZYTY 2024–2026', 'MAJOR TRANSITS 2024–2026')}</Text>
                  <Text style={[ss.cardIntro, { color: subColor }]}>
                    {tr('stars.transits.intro', 'Tranzyty wolnych planet (Jowisz–Pluton) trwają miesiącami i latami. Aktywują konkretne tematy u wszystkich — niezależnie od znaku urodzeniowego.', 'The transits of slow planets (Jupiter to Pluto) last for months and years. They activate concrete themes for everyone, regardless of birth sign.')}
                  </Text>
                </View>
              </Animated.View>

              {transitsData.map((transit, i) => {
                const typeColor = transit.type === 'positive' ? '#34D399' : transit.type === 'challenging' ? '#F97316' : ACCENT;
                return (
                  <Animated.View key={transit.title} entering={FadeInDown.delay(i*60).duration(260)}>
                    <View style={[ss.transitCard, { backgroundColor: cardBg, borderColor: typeColor + '33', borderLeftColor: typeColor, borderLeftWidth: 3 }]}>
                      <View style={ss.transitTop}>
                        <Text style={[ss.transitTitle, { color: textColor }]}>{transit.title}</Text>
                        <View style={[ss.transitPeriod, { backgroundColor: typeColor + '16', borderColor: typeColor + '33' }]}>
                          <Text style={[ss.transitPeriodText, { color: typeColor }]}>{transit.period}</Text>
                        </View>
                      </View>
                      <Text style={[ss.transitEffect, { color: subColor }]}>{transit.effect}</Text>
                    </View>
                  </Animated.View>
                );
              })}

              {/* Wielkie cykle astrologiczne */}
              <Animated.View entering={FadeInDown.delay(280).duration(480)}>
                <View style={[ss.card, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                  <Text style={[ss.eyebrow, { color: ACCENT }]}>{tr('stars.cycles.big', 'WIELKIE CYKLE ASTROLOGICZNE', 'GREAT ASTROLOGICAL CYCLES')}</Text>
                  {celestialCycles.map((cycle, i) => (
                    <View key={cycle.name} style={[ss.cycleRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ACCENT + '18' }]}>
                      <View style={ss.cycleLeft}>
                        <View style={[ss.cycleDot, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '44' }]}>
                          <Orbit color={ACCENT} size={13}/>
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={ss.cycleNameRow}>
                          <Text style={[ss.cycleName, { color: ACCENT }]}>{cycle.name}</Text>
                          <Text style={[ss.cycleYears, { color: ACCENT }]}>{cycle.years} {tr('stars.cycles.years', 'lat', 'years')}</Text>
                        </View>
                        <Text style={[ss.cycleDesc, { color: subColor }]}>{cycle.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>

              {/* Wiedza o aspektach */}
              <Animated.View entering={FadeInDown.delay(360).duration(480)}>
                <View style={[ss.card, { backgroundColor: cardBg, borderColor: ACCENT + '28' }]}>
                  <Text style={[ss.eyebrow, { color: ACCENT }]}>{tr('stars.aspects.dictionary', 'SŁOWNIK ASPEKTÓW', 'ASPECT DICTIONARY')}</Text>
                  {[
                    { asp: 'Koniunkcja 0°', meaning: 'Połączenie sił planet — wzmocnienie i fuzja energii.' },
                    { asp: 'Opozycja 180°', meaning: 'Napięcie biegunowe, niezbędne dopełnienie, konfrontacja z projekcją.' },
                    { asp: 'Kwadratura 90°', meaning: 'Dynamiczne tarcie, wyzwanie wymagające aktywnego działania.' },
                    { asp: 'Trygon 120°', meaning: 'Harmonia i przepływ — naturalne talenty i wsparcie.' },
                    { asp: 'Sekstyln 60°', meaning: 'Szansa wymagająca niewielkiego wysiłku, aby zaistniała.' },
                  ].map((item, i) => (
                    <View key={item.asp} style={[ss.aspectRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ACCENT + '14' }]}>
                      <Text style={[ss.aspectName, { color: ACCENT }]}>{item.asp}</Text>
                      <Text style={[ss.aspectMeaning, { color: subColor }]}>{item.meaning}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>

              {/* AI głęboka analiza */}
              {aiAvailable && (
                <Animated.View entering={FadeInDown.delay(440).duration(480)}>
                  <Pressable
                    onPress={() => navigation.navigate('JournalEntry', {
                      type: 'reflection',
                      prompt: tr(
                        'stars.transits.journalPrompt',
                        `Faza księżyca: ${moonPhase.name}. Jakie cykle i tranzyty najbardziej pracują teraz w moim życiu?`,
                        `Moon phase: ${moonPhase.name}. Which cycles and transits are working most strongly in my life right now?`,
                      ),
                    })}
                    style={[ss.aiCard, { backgroundColor: isLight ? ACCENT + '18' : ACCENT + '22', borderColor: ACCENT + '44' }]}
                  >
                    <Layers color={ACCENT} size={22} strokeWidth={1.8}/>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={[ss.aiTitle, { color: ACCENT }]}>{tr('stars.transits.note', 'Notatka o aktywnych cyklach', 'Note on Active Cycles')}</Text>
                      <Text style={[ss.aiSub, { color: subColor }]}>{tr('stars.transits.noteDesc', 'Zapisz, które tranzyty czujesz jako presję, a które jako realne wsparcie i timing na ruch.', 'Write down which transits feel like pressure and which feel like real support and timing for movement.')}</Text>
                    </View>
                    <ArrowRight color={ACCENT} size={16}/>
                  </Pressable>
                </Animated.View>
              )}
            </>
          )}

          {/* ── TAB: CYKLE ── */}
          {activeTab === 'cykle' && (
            <>
              <Animated.View entering={FadeInDown.duration(320)}>
                <View style={[ss.card, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}>
                  <LinearGradient colors={[ACCENT + '16', 'transparent']} style={StyleSheet.absoluteFill}/>
                  <Text style={[ss.eyebrow, { color: ACCENT }]}>{tr('stars.cycles.big', 'WIELKIE CYKLE ASTROLOGICZNE', 'GREAT ASTROLOGICAL CYCLES')}</Text>
                  <Text style={[ss.cardIntro, { color: subColor }]}>
                    {tr('stars.cycles.intro', 'Planety poruszają się przez zodiak w cyklach trwających od miesięcy do dekad. Znajomość tych rytmów zmienia sposób patrzenia na trudne okresy i wielkie szanse.', 'Planets move through the zodiac in cycles that last from months to decades. Knowing these rhythms changes how you see difficult periods and great opportunities.')}
                  </Text>
                </View>
              </Animated.View>

              {celestialCycles.map((cycle, i) => (
                <Animated.View key={cycle.name} entering={FadeInDown.delay(i*60).duration(260)}>
                  <View style={[ss.card, { backgroundColor: cardBg, borderColor: ACCENT + '28' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <View style={[ss.cycleDot, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '44' }]}>
                        <Orbit color={ACCENT} size={14}/>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[ss.cycleName, { color: ACCENT }]}>{cycle.name}</Text>
                        <Text style={[ss.cycleYears, { color: ACCENT + 'AA' }]}>{cycle.years} {tr('stars.cycles.years', 'lat', 'years')}</Text>
                      </View>
                    </View>
                    <Text style={[ss.cycleDesc, { color: subColor, fontSize: 14, lineHeight: 22 }]}>{cycle.desc}</Text>
                  </View>
                </Animated.View>
              ))}

              <Animated.View entering={FadeInDown.delay(360).duration(480)}>
                <View style={[ss.card, { backgroundColor: cardBg, borderColor: ACCENT + '28' }]}>
                  <Text style={[ss.eyebrow, { color: ACCENT }]}>{tr('stars.cycles.saturnReturn', 'SATURN RETURN — KLUCZ DO DOJRZAŁOŚCI', 'SATURN RETURN — THE KEY TO MATURITY')}</Text>
                  <Text style={[ss.cardIntro, { color: subColor }]}>
                    {tr('stars.cycles.saturnReturnDesc', 'Saturn Return w 29-30 roku zycia to jeden z najwazniejszych progów astrologicznych. Drugi Return (58-60 lat) przynosi dojrzalosc lidera i mentora. Kazdy Return wymaga rozliczenia z tym, co budowales przez ostatnie prawie 30 lat.', 'Saturn Return around ages 29–30 is one of the most important astrological thresholds. The second Return (58–60) brings the maturity of a leader and mentor. Every Return asks you to account for what you have built over the last nearly 30 years.')}
                  </Text>
                  {aiAvailable && (
                    <Pressable
                      onPress={() => navigation.navigate('JournalEntry', { type: 'reflection', prompt: 'Gdzie jestem dziś w swoich wielkich cyklach i co to oznacza dla moich obecnych wyzwań?' })}
                      style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ACCENT + '22', gap: 8 }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT, flex: 1 }}>{tr('stars.cycles.save', 'Zapisz moje cykle', 'Save my cycles')}</Text>
                      <ArrowRight color={ACCENT} size={14}/>
                    </Pressable>
                  )}
                </View>
              </Animated.View>
            </>
          )}

          {/* ── TAB: ODKRYJ ── */}
          {activeTab === 'odkryj' && (
            <>
              {/* Planeta dnia hero */}
              <Animated.View entering={FadeInDown.duration(280)}>
                <View style={[ss.card, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}>
                  <LinearGradient colors={[ACCENT + '18', ACCENT + '06', 'transparent']} style={StyleSheet.absoluteFill}/>
                  <Text style={[ss.eyebrow, { color: ACCENT }]}>{tr('stars.discover.planetsToday', 'PLANETY DZIŚ · ENERGIA KOSMICZNA', 'PLANETS TODAY · COSMIC ENERGY')}</Text>
                  <View style={{ gap: 12 }}>
                    {planetsToday.map((p) => (
                      <View key={p.name} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ACCENT + '18' }}>
                        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: p.color + '22', borderWidth: 1, borderColor: p.color + '44', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 22, color: p.color }}>{p.symbol}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{p.name}</Text>
                            <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: p.color + '22' }}>
                              <Text style={{ fontSize: 9, fontWeight: '700', color: p.color, letterSpacing: 0.5 }}>w {p.sign}</Text>
                            </View>
                            <Text style={{ fontSize: 10, color: p.color, opacity: 0.8 }}>{p.element}</Text>
                          </View>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: p.color, letterSpacing: 0.3, marginBottom: 4 }}>✦ {p.keyword}</Text>
                          <Text style={{ fontSize: 12, color: subColor, lineHeight: 18 }}>{p.desc}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </Animated.View>

              {/* Gwiazda urodzenia */}
              {birthStar && (
                <Animated.View entering={FadeInDown.delay(60).duration(280)}>
                  <View style={[ss.card, { backgroundColor: cardBg, borderColor: birthStar.color + '55', overflow: 'hidden' }]}>
                    <LinearGradient colors={[birthStar.color + '22', birthStar.color + '06', 'transparent']} style={StyleSheet.absoluteFill}/>
                    <Text style={[ss.eyebrow, { color: birthStar.color }]}>{tr('stars.birthStar.eyebrow', '✦ TWOJA GWIAZDA URODZENIA', '✦ YOUR BIRTH STAR')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
                      <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: birthStar.color + '22', borderWidth: 1, borderColor: birthStar.color + '55', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 28 }}>⭐</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: textColor, letterSpacing: -0.4 }}>{birthStar.name}</Text>
                        <Text style={{ fontSize: 12, color: birthStar.color, fontWeight: '600', marginBottom: 8 }}>{tr('stars.birthStar.constellation', 'Konstelacja', 'Constellation')} {birthStar.constellation}</Text>
                        <Text style={{ fontSize: 13, color: subColor, lineHeight: 20 }}>{birthStar.meaning}</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Konstelacje */}
              <Animated.View entering={FadeInDown.delay(100).duration(280)}>
                <Text style={[ss.sectionTitle, { color: ACCENT, marginBottom: 8 }]}>{tr('stars.constellations.title', 'KONSTELACJE I ICH ZNACZENIE', 'CONSTELLATIONS AND THEIR MEANING')}</Text>
              </Animated.View>
              {constellations.map((c, i) => (
                <Animated.View key={c.name} entering={FadeInDown.delay(120 + i * 40).duration(260)}>
                  <View style={[ss.card, { backgroundColor: cardBg, borderColor: ACCENT + '28' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                      <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: ACCENT + '18', borderWidth: 1, borderColor: ACCENT + '33', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 24 }}>{c.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>{c.name}</Text>
                          <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: ACCENT + '18' }}>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: ACCENT, letterSpacing: 0.5 }}>{c.season.toUpperCase()}</Text>
                          </View>
                          <Text style={{ fontSize: 10, color: subColor }}>{c.stars} {tr('stars.constellations.stars', 'gwiazd', 'stars')}</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 8 }}>{c.story}</Text>
                        <View style={{ borderLeftWidth: 2, borderLeftColor: ACCENT, paddingLeft: 10 }}>
                          <Text style={{ fontSize: 11, color: ACCENT, fontStyle: 'italic', lineHeight: 17 }}>{c.significance}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </>
          )}

          <EndOfContentSpacer size="standard"/>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const ss = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  backBtn: { width: 38 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  headerTitle: { fontSize: 17, fontWeight: '600', marginTop: 2 },

  tabOuter: { marginHorizontal: 20, marginBottom: 10, borderRadius: 16, borderWidth: 1, padding: 4 },
  tabBar: { flexDirection: 'row', gap: 4 },
  tab: { paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', borderRadius: 12 },
  tabText: { fontSize: 13, fontWeight: '600' },

  scroll: { paddingHorizontal: 20, paddingTop: 4, gap: 12 },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 4 },

  card: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 12 },
  caption: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  cardIntro: { fontSize: 14, lineHeight: 22 },

  skyCard: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden' },
  skyCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  observatoryDeck: { borderRadius: 22, borderWidth: 1, padding: 18 },
  observatoryGrid: { flexDirection: 'column', gap: 10 },
  observatoryTile: { borderRadius: 16, borderWidth: 1, padding: 14 },
  observatoryTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 8 },
  observatoryCopy: { fontSize: 12, lineHeight: 19 },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  liveText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },

  moonHeroCard: { borderRadius: 22, borderWidth: 1, padding: 20, overflow: 'hidden' },
  moonHeroRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  moonBigIcon: { fontSize: 52 },
  moonName: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  energyChip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  energyText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  moonCopy: { fontSize: 14, lineHeight: 21, marginBottom: 14 },
  phaseRail: { gap: 8 },
  phaseChip: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1, minWidth: 88 },
  phaseIcon: { fontSize: 22, marginBottom: 4 },
  phaseName: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  phaseEnergy: { fontSize: 9, textAlign: 'center', marginTop: 2, letterSpacing: 0.5 },

  signalCard: { borderRadius: 20, borderWidth: 1, padding: 18 },
  signalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  signalOrb: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  signalText: { fontSize: 18, fontWeight: '300', lineHeight: 28, marginBottom: 10 },
  signalSub: { fontSize: 14, lineHeight: 22, marginBottom: 10 },
  signalDivider: { height: 1, marginVertical: 12 },
  signalChineseLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: 6 },
  signalChinese: { fontSize: 13, lineHeight: 20 },

  linksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  linkWrap: { width: (SW - 40 - 10) / 2 },
  linkCard: { borderRadius: 18, borderWidth: 1, padding: 18, minHeight: 150 },
  linkIcon: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  linkLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  linkSub: { fontSize: 11, lineHeight: 16 },

  planetCard: { borderRadius: 18, borderWidth: 1, padding: 18 },
  planetTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  planetSymbolBox: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  planetSymbol: { fontSize: 22, fontWeight: '400' },
  planetNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  planetName: { fontSize: 16, fontWeight: '700' },
  planetCycleChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  planetCycleText: { fontSize: 10, fontWeight: '600' },
  planetDomain: { fontSize: 12 },
  energyDot: { width: 8, height: 8, borderRadius: 4, alignSelf: 'flex-start', marginTop: 6 },
  planetDesc: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  currentSignRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  currentSignLabel: { fontSize: 11, fontWeight: '600' },
  currentSign: { fontSize: 11, fontWeight: '700' },
  currentEnergy: { fontSize: 11 },

  transitCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 10 },
  transitTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  transitTitle: { fontSize: 15, fontWeight: '700', flex: 1, lineHeight: 22, flexShrink: 1 },
  transitPeriod: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, flexShrink: 0, maxWidth: 120 },
  transitPeriodText: { fontSize: 11, fontWeight: '700' },
  transitEffect: { fontSize: 14, lineHeight: 22 },

  cycleRow: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  cycleLeft: { flexShrink: 0 },
  cycleDot: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cycleNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cycleName: { fontSize: 13, fontWeight: '700', flex: 1 },
  cycleYears: { fontSize: 11, fontWeight: '600' },
  cycleDesc: { fontSize: 12, lineHeight: 18 },

  aspectRow: { paddingVertical: 10 },
  aspectName: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  aspectMeaning: { fontSize: 13, lineHeight: 19 },

  aiCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 18 },
  aiTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  aiSub: { fontSize: 13, lineHeight: 19 },

  // Cosmic weather / day energy
  cosmicWeatherCard: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
  dayPlanetOrb: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dayPlanetSymbol: { fontSize: 18, fontWeight: '700' },
  dayPlanetName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  dayPlanetEnergy: { fontSize: 12, lineHeight: 17 },
  cosmicWeatherText: { fontSize: 14, lineHeight: 22 },

  // Weekly calendar
  weekCalCard: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
  weekRail: { gap: 8 },
  weekChip: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 14, minWidth: 80 },
  weekChipDay: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  weekChipPlanet: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 3 },
  weekChipEnergy: { fontSize: 9, textAlign: 'center', lineHeight: 13 },

  // Planet wisdom
  wisdomRow: { paddingTop: 8, marginTop: 6, borderTopWidth: StyleSheet.hairlineWidth },
  wisdomText: { fontSize: 12, lineHeight: 19, fontStyle: 'italic' },
});

