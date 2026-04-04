// @ts-nocheck
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions, TextInput, Modal, Animated as RNAnimated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, interpolate } from 'react-native-reanimated';
import Svg, { Circle, Path, Ellipse, G, Rect, Text as SvgText, Defs, RadialGradient as SvgRadialGradient, Stop, ClipPath } from 'react-native-svg';
import { ChevronLeft, Star, Leaf, Moon, Sun, Wind, Droplets, Flame, ArrowRight, Sparkles, Plus, Minus, Check, Clock, ChevronDown, ChevronUp, BookOpen, Flower2, Zap, Shield, Heart, Brain, Eye, Coins, Waves, ShoppingBag, AlertTriangle, FlaskConical, Beaker } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { useTranslation } from 'react-i18next';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#34D399';

// ── Herb data ────────────────────────────────────────────────────────────────
const HERBS = [
  {
    id: 'lawenda', name: 'Lawenda', emoji: '💜', latin: 'Lavandula angustifolia',
    element: 'powietrze', planet: 'Merkury', chakra: 'korona',
    moon: ['pełnia', 'rosnący'],
    color: '#A78BFA',
    uses: ['relaks', 'sen', 'ochrona', 'miłość'],
    desc: 'Lawenda to zioło spokoju i oczyszczenia. Jej delikatny aromat łagodzi napięcia układu nerwowego, sprzyja głębokiemu snowi i chroni przestrzeń duchową.',
    ritual: 'Spal suszoną lawendę podczas pełni, aby oczyścić przestrzeń z negatywnych energii i przyciągnąć spokój.',
    season: 'lato',
    preparation: 'Napar, poduszeczka, olejek eteryczny, kadzidło',
    combinesWith: ['melisa', 'rumianek'],
    combineIntention: 'Głęboki spokój i sen',
    harvestMoon: 'pełnia',
    meditationAffirm: 'Jestem otulona spokojem. Każdy oddech przynosi mi ciszę i ukojenie.',
  },
  {
    id: 'rozmaryn', name: 'Rozmaryn', emoji: '🌿', latin: 'Rosmarinus officinalis',
    element: 'ogień', planet: 'Słońce', chakra: 'splotu słonecznego',
    moon: ['rosnący', 'pełnia'],
    color: '#34D399',
    uses: ['ochrona', 'pamięć', 'oczyszczanie', 'miłość'],
    desc: 'Rozmaryn to zioło pamięci i ochrony. Wzmacnia koncentrację, oczyszcza przestrzeń i wzmacnia granice energetyczne. Nazywany "ziołem słońca".',
    ritual: 'Powiąż gałązkę rozmarynu czerwoną nitką i zawieś przy wejściu do domu dla ochrony.',
    season: 'wiosna',
    preparation: 'Napar, kąpiel ziołowa, kadzidło, olejek',
    combinesWith: ['szalwia', 'dziewanna'],
    combineIntention: 'Oczyszczenie przestrzeni i ochrona',
    harvestMoon: 'rosnący',
    meditationAffirm: 'Moja pamięć jest jasna jak słońce. Pamiętam wszystko, co ważne dla mojej drogi.',
  },
  {
    id: 'bylica', name: 'Bylica', emoji: '🌾', latin: 'Artemisia vulgaris',
    element: 'ziemia', planet: 'Księżyc', chakra: 'trzeciego oka',
    moon: ['nów', 'pełnia'],
    color: '#C084FC',
    uses: ['sny', 'intuicja', 'wróżbiarstwo', 'ochrona'],
    desc: 'Bylica to zioło księżyca i snów. Wzmacnia zdolności psychiczne, sprzyja świadomym snom i otwiera kanały intuicji. Tradycyjnie używana podczas wróżbiarstwa.',
    ritual: 'Wypij napar z bylicy przed snem, aby mieć bardziej żywe i pamiętane sny.',
    season: 'jesień',
    preparation: 'Napar, poduszeczka do snów, kadzidło',
    combinesWith: ['walerian', 'melisa'],
    combineIntention: 'Świadome śnienie i intuicja',
    harvestMoon: 'pełnia',
    meditationAffirm: 'Moje sny są moimi nauczycielami. Wsłuchuję się w mądrość nocy.',
  },
  {
    id: 'szalwia', name: 'Szałwia', emoji: '🌱', latin: 'Salvia officinalis',
    element: 'powietrze', planet: 'Jowisz', chakra: 'gardła',
    moon: ['zanikający', 'nów'],
    color: '#60A5FA',
    uses: ['mądrość', 'oczyszczanie', 'uzdrowienie', 'ochrona'],
    desc: 'Szałwia to zioło mądrości i oczyszczenia. Spala się podczas ceremonii smudgingu, aby oczyścić przestrzeń, ciało i umysł z energetycznych blokad.',
    ritual: 'Zapal pęczek szałwii i przeprowadź przez wszystkie kąty pomieszczenia ruchem zgodnym z ruchem wskazówek zegara.',
    season: 'lato',
    preparation: 'Kadzidło, napar, kąpiel, pęczek do smudgingu',
    combinesWith: ['rozmaryn', 'dziewanna'],
    combineIntention: 'Głębokie oczyszczenie i mądrość',
    harvestMoon: 'zanikający',
    meditationAffirm: 'Uwalniam to, co mnie ciągnie wstecz. Mądrość we mnie wzrasta z każdym dniem.',
  },
  {
    id: 'melisa', name: 'Melisa', emoji: '🍃', latin: 'Melissa officinalis',
    element: 'woda', planet: 'Księżyc', chakra: 'serca',
    moon: ['rosnący', 'pełnia'],
    color: '#FBBF24',
    uses: ['spokój', 'miłość', 'sen', 'relaks'],
    desc: 'Melisa to zioło łagodności i radości serca. Jej cytrynowy aromat przynosi spokój emocjonalny, łagodzi lęk i otwiera serce na miłość i wdzięczność.',
    ritual: 'Przygotuj napar z melisy podczas rosnącego księżyca i wypij go z intencją przyciągnięcia radości.',
    season: 'wiosna',
    preparation: 'Napar, aromaterapia, kąpiel',
    combinesWith: ['lawenda', 'rumianek'],
    combineIntention: 'Radość serca i spokój emocjonalny',
    harvestMoon: 'rosnący',
    meditationAffirm: 'Moje serce jest otwarte na miłość i radość. Przyjmuję piękno tego momentu.',
  },
  {
    id: 'rumianek', name: 'Rumianek', emoji: '🌼', latin: 'Matricaria chamomilla',
    element: 'woda', planet: 'Wenus', chakra: 'splotu słonecznego',
    moon: ['pełnia', 'rosnący'],
    color: '#F59E0B',
    uses: ['spokój', 'sen', 'uzdrowienie', 'szczęście'],
    desc: 'Rumianek to zioło dziecięcej łagodności i słonecznej energii. Przyciąga szczęście, łagodzi napięcia emocjonalne i sprzyja głębokiemu wypoczynkowi.',
    ritual: 'Rozsyp płatki rumianku wokół świecy podczas modlitwy o zdrowie i uzdrowienie.',
    season: 'lato',
    preparation: 'Napar, kąpiel, okłady, kadzidło',
    combinesWith: ['melisa', 'lawenda'],
    combineIntention: 'Uzdrowienie i słoneczny spokój',
    harvestMoon: 'pełnia',
    meditationAffirm: 'Jestem otoczona uzdrawiającym światłem słońca. Zdrowie i radość są moim naturalnym stanem.',
  },
  {
    id: 'dziewanna', name: 'Dziewanna', emoji: '🕯️', latin: 'Verbascum thapsus',
    element: 'ogień', planet: 'Saturn', chakra: 'podstawy',
    moon: ['nów', 'zanikający'],
    color: '#F97316',
    uses: ['ochrona', 'odwaga', 'uzdrowienie', 'wizje'],
    desc: 'Dziewanna to zioło ochrony i duchowego widzenia. Liście palono jako pochodnie w antycznych rytuałach, przyciągając mądrość i odwagę w ciemności.',
    ritual: 'Noś wysuszony liść dziewanny przy sobie jako ochronny talizman podczas trudnych decyzji.',
    season: 'jesień',
    preparation: 'Kadzidło, talizman, napar',
    combinesWith: ['rozmaryn', 'szalwia'],
    combineIntention: 'Ochrona i odwaga przed wyzwaniem',
    harvestMoon: 'nów',
    meditationAffirm: 'Jestem chroniona przez starożytną mądrość. Odwaga płynie przeze mnie jak ogień.',
  },
  {
    id: 'walerian', name: 'Kozłek lekarski', emoji: '🌸', latin: 'Valeriana officinalis',
    element: 'woda', planet: 'Wenus', chakra: 'podstawy',
    moon: ['zanikający', 'nów'],
    color: '#F472B6',
    uses: ['sen', 'spokój', 'ochrona', 'miłość'],
    desc: 'Kozłek to zioło głębokiej ciszy. Silne właściwości uspokajające sprawiają, że jest skarbem dla tych, którzy borykają się z bezsennością lub nadmiernym napięciem.',
    ritual: 'Dodaj korzeń kozłka do woreczka pod poduszką, aby głęboko spać i pamiętać sny.',
    season: 'zima',
    preparation: 'Napar, kapsułki, poduszeczka, talizman',
    combinesWith: ['bylica', 'lawenda'],
    combineIntention: 'Głęboki, spokojny sen i sny',
    harvestMoon: 'zanikający',
    meditationAffirm: 'Oddaję się ciszy. W spokoju znajduję swoją siłę i odnowę.',
    safety: 'Może nasilać działanie leków uspokajających. Nie stosować podczas prowadzenia pojazdów.',
  },
  {
    id: 'dziewanna_piołun', name: 'Piołun', emoji: '🌿', latin: 'Artemisia absinthium',
    element: 'ogień', planet: 'Mars', chakra: 'trzeciego oka',
    moon: ['nów', 'pełnia'],
    color: '#86EFAC',
    uses: ['wróżby', 'intuicja', 'sny', 'oczyszczenie'],
    desc: 'Piołun to zioło magów i wróżbitów. Wzmacnia zdolności jasnowidcze, otwiera trzecie oko i oczyszcza przestrzeń z ciężkich energii. Używany podczas wróżenia i rytuałów.',
    ritual: 'Spalaj piołun przed seansem wróżbiarskim lub podczas pracy z kartami tarota, aby wzmocnić intuicję.',
    season: 'jesień',
    preparation: 'Kadzidło, napar (w małych ilościach), woreczek talizmanowy',
    combinesWith: ['bylica', 'rozmaryn'],
    combineIntention: 'Wzmocnienie intuicji i zdolności wizyjnych',
    harvestMoon: 'nów',
    meditationAffirm: 'Moje wewnętrzne oko jest otwarte. Widzę prawdę poza zasłoną pozorów.',
    safety: 'NIE spożywać wewnętrznie — stosować wyłącznie jako kadzidło lub zewnętrznie. Toksyczny w dużych dawkach.',
  },
  {
    id: 'hibiskus', name: 'Hibiskus', emoji: '🌺', latin: 'Hibiscus sabdariffa',
    element: 'woda', planet: 'Wenus', chakra: 'serca',
    moon: ['rosnący', 'pełnia'],
    color: '#FB7185',
    uses: ['miłość', 'piękno', 'obfitość', 'intuicja'],
    desc: 'Hibiskus to kwiat miłości i boskiej kobiecości. Przyciąga romananse, wzmacnia piękno wewnętrzne i zewnętrzne, a jego głęboka czerwień symbolizuje ogień serca.',
    ritual: 'Zaparzyć napar z hibiskusa podczas pełni i wylać kilka kropel jako ofiarę dla sił miłości. Resztę wypiج z intencją otwarcia serca.',
    season: 'lato',
    preparation: 'Napar, kąpiel ziołowa, olejek, talizman miłości',
    combinesWith: ['rozmaryn', 'melisa'],
    combineIntention: 'Przyciąganie miłości i otwieranie serca',
    harvestMoon: 'pełnia',
    meditationAffirm: 'Jestem godna miłości. Otwieram serce na jej pełnię bez lęku i bez warunków.',
    safety: 'Bezpieczny w normalnych ilościach. Unikać w ciąży (działanie pobudzające macicę).',
  },
  {
    id: 'cynamon', name: 'Cynamon', emoji: '🍂', latin: 'Cinnamomum verum',
    element: 'ogień', planet: 'Słońce', chakra: 'splotu słonecznego',
    moon: ['rosnący', 'pełnia'],
    color: '#F59E0B',
    uses: ['obfitość', 'miłość', 'ochrona', 'sukces'],
    desc: 'Cynamon to zioło bogactwa i słonecznej energii. Przyciąga prosperitę, wzmacnia wolę i dodaje energii do manifestacji. W wielu tradycjach to "złote zioło" alchemii.',
    ritual: 'W pierwszy dzień miesiąca roznieś cynamon przy progu swojego domu, by przyciągnąć obfitość i szczęście.',
    season: 'zima',
    preparation: 'Kadzidło, woreczek zamożności, napar, przyprawa rytualna',
    combinesWith: ['rumianek', 'rozmaryn'],
    combineIntention: 'Manifestacja obfitości i sukcesu',
    harvestMoon: 'rosnący',
    meditationAffirm: 'Jestem otwarta na bogactwo we wszystkich jego formach. Prosperita płynie do mnie naturalnie.',
    safety: 'Olejek cynamonowy może podrażniać skórę — nie stosować nierozcieńczonego. Bezpieczny w kuchni.',
  },
  {
    id: 'majeranek', name: 'Majeranek', emoji: '🌿', latin: 'Origanum majorana',
    element: 'powietrze', planet: 'Merkury', chakra: 'serca',
    moon: ['rosnący', 'pełnia'],
    color: '#A3E635',
    uses: ['miłość', 'szczęście', 'uzdrowienie', 'spokój'],
    desc: 'Majeranek to zioło radości i serdeczności. Znany jako "zioło szczęścia", przyciąga miłość, chroni związki i przynosi poczucie ciepłego bezpieczeństwa.',
    ritual: 'Umieść majeranek pod poduszką lub w szufladzie z ubraniami, aby nosić ze sobą energię miłości i szczęścia.',
    season: 'lato',
    preparation: 'Napar, kadzidło, poduszeczka, przyprawa',
    combinesWith: ['lawenda', 'rumianek'],
    combineIntention: 'Szczęście w miłości i radość dnia codziennego',
    harvestMoon: 'rosnący',
    meditationAffirm: 'Szczęście jest moim naturalnym stanem. Otaczam się miłością i życzliwością.',
    safety: 'Bezpieczny w zwykłych ilościach. Unikać dużych dawek w ciąży.',
  },
  {
    id: 'dziurawiec', name: 'Dziurawiec', emoji: '🌼', latin: 'Hypericum perforatum',
    element: 'ogień', planet: 'Słońce', chakra: 'splotu słonecznego',
    moon: ['pełnia', 'rosnący'],
    color: '#FCD34D',
    uses: ['ochrona', 'radość', 'uzdrowienie', 'odwaga'],
    desc: 'Dziurawiec to "zioło słońca" — przynosi światło w ciemność, chroni przed złymi duchami i depresją. Tradycyjnie wieszano go nad drzwiami w noc świętojańską.',
    ritual: 'Zbierz dziurawiec podczas przesilenia letniego. Susz i umieść wiązkę nad wejściem do domu dla ochrony przez cały rok.',
    season: 'lato',
    preparation: 'Napar, olejek macerowany, kadzidło, talizman',
    combinesWith: ['melisa', 'rozmaryn'],
    combineIntention: 'Przywrócenie radości i ochrona duchowa',
    harvestMoon: 'pełnia',
    meditationAffirm: 'Noszę w sobie światło słońca. Ciemność we mnie przekształcam w radość i moc.',
    safety: 'Może wchodzić w interakcje z lekami (antydepresanty, antykoncepcja). Fotoalergenny — unikać słońca po zastosowaniu.',
  },
  {
    id: 'mięta', name: 'Mięta pieprzowa', emoji: '🌱', latin: 'Mentha piperita',
    element: 'powietrze', planet: 'Merkury', chakra: 'gardła',
    moon: ['rosnący', 'nów'],
    color: '#6EE7B7',
    uses: ['oczyszczenie', 'obfitość', 'ochrona', 'jasność'],
    desc: 'Mięta to zioło mentalnej jasności i oczyszczenia. Odświeża umysł, przyciąga prosperitę i oczyszcza przestrzeń z zastałej energii. Niezbędna w każdej apteczce duchowej.',
    ritual: 'Rozłóż świeże liście mięty w kącikach pokoju, by oczyścić energię i przyciągnąć świeże możliwości.',
    season: 'wiosna',
    preparation: 'Napar, aromaterapia, kąpiel, kadzidło',
    combinesWith: ['rozmaryn', 'szalwia'],
    combineIntention: 'Mentalna jasność i oczyszczenie przestrzeni',
    harvestMoon: 'rosnący',
    meditationAffirm: 'Mój umysł jest świeży i jasny. Przychodzę w czystości myśli do każdego zadania.',
    safety: 'Bezpieczna. Unikać stosowania u niemowląt (może powodować trudności z oddychaniem).',
  },
  {
    id: 'tymianek', name: 'Tymianek', emoji: '🌿', latin: 'Thymus vulgaris',
    element: 'powietrze', planet: 'Wenus', chakra: 'serca',
    moon: ['rosnący', 'pełnia'],
    color: '#86EFAC',
    uses: ['odwaga', 'ochrona', 'oczyszczenie', 'miłość'],
    desc: 'Tymianek to zioło waleczności i odwagi. Rycerze średniowieczni nosili go w hołdzie swej dumie. Oczyszcza przestrzeń, wzmacnia serce i dodaje siły w trudnych chwilach.',
    ritual: 'Noś tymianek ze sobą lub spalaj przed ważnym spotkaniem, aby dodać sobie odwagi i pewności siebie.',
    season: 'wiosna',
    preparation: 'Napar, kadzidło, kąpiel, przyprawa rytualna',
    combinesWith: ['rozmaryn', 'szalwia'],
    combineIntention: 'Siła, odwaga i ochrona w działaniu',
    harvestMoon: 'rosnący',
    meditationAffirm: 'Odwaga płynie przeze mnie. Jestem silna, zdecydowana i gotowa na każde wyzwanie.',
    safety: 'Bezpieczny w normalnych ilościach kulinarnych. Olejek eteryczny może podrażniać błony śluzowe.',
  },
  {
    id: 'bazylika', name: 'Bazylia', emoji: '🌿', latin: 'Ocimum basilicum',
    element: 'ogień', planet: 'Mars', chakra: 'splotu słonecznego',
    moon: ['rosnący', 'pełnia'],
    color: '#4ADE80',
    uses: ['obfitość', 'ochrona', 'miłość', 'szczęście'],
    desc: 'Bazylia to zioło bogactwa i ochrony domu. W wielu kulturach trzymano ją przy wejściu dla ochrony i dobrobytu. Jej intensywny aromat przyciąga pozytywne energie.',
    ritual: 'Umieść doniczkę z bazylią przy wejściu do domu lub w kuchni, by chronić przestrzeń i przyciągać dostatek.',
    season: 'lato',
    preparation: 'Świeże liście (rytualne), kadzidło, napar, olej',
    combinesWith: ['cynamon', 'rozmaryn'],
    combineIntention: 'Ochrona domu i przyciąganie dobrobytu',
    harvestMoon: 'rosnący',
    meditationAffirm: 'Mój dom jest chroniony i przepełniony miłością. Dostatek jest moim naturalnym prawem.',
    safety: 'Bezpieczna w kuchni. Olejek eteryczny nie dla dzieci poniżej 2 lat.',
  },
  {
    id: 'lawenda_wąskolistna', name: 'Liść laurowy', emoji: '🌿', latin: 'Laurus nobilis',
    element: 'ogień', planet: 'Słońce', chakra: 'splotu słonecznego',
    moon: ['rosnący', 'pełnia'],
    color: '#D4B896',
    uses: ['obfitość', 'mądrość', 'ochrona', 'sukces'],
    desc: 'Liść laurowy to zioło zwycięzców i mistrzów. Od czasów starożytnej Grecji symbolizuje sukces i mądrość. Spalony z intencją pomaga manifestować życzenia i marzenia.',
    ritual: 'Napisz swoje życzenie na liściu laurowym. Spalaj go z intencją podczas rosnącego księżyca i obserwuj jak spełnia się w ciągu 28 dni.',
    season: 'zima',
    preparation: 'Kadzidło (spalony z intencją), talizman, napar',
    combinesWith: ['cynamon', 'rozmaryn'],
    combineIntention: 'Manifestacja życzenia i sukcesu',
    harvestMoon: 'rosnący',
    meditationAffirm: 'Moje marzenia są warte spełnienia. Działam z mądrością i zdecydowaniem.',
    safety: 'Bezpieczny. Liście suszone — dekoracyjne, nie do spożycia (twarde). Olejek tylko zewnętrznie.',
  },
  {
    id: 'nagietek', name: 'Nagietek', emoji: '🌸', latin: 'Calendula officinalis',
    element: 'ogień', planet: 'Słońce', chakra: 'splotu słonecznego',
    moon: ['pełnia', 'rosnący'],
    color: '#FB923C',
    uses: ['uzdrowienie', 'ochrona', 'jasność', 'radość'],
    desc: 'Nagietek to słoneczne zioło uzdrowienia i jasności. Chroni energetycznie, wspomaga uzdrowienie emocjonalne i fizyczne, oraz nadaje przestrzeni słoneczną, ciepłą energię.',
    ritual: 'Umieść świeże kwiaty nagietka na ołtarzu lub w miseczce z wodą, aby napełnić przestrzeń słoneczną energią uzdrowienia.',
    season: 'lato',
    preparation: 'Napar, olej macerowany, kąpiel, kadzidło, talizman',
    combinesWith: ['rumianek', 'melisa'],
    combineIntention: 'Głębokie uzdrowienie i słoneczna ochrona',
    harvestMoon: 'pełnia',
    meditationAffirm: 'Uzdrowienie jest moim prawem. Przyjmuję jego moc z otwartością i wdzięcznością.',
    safety: 'Bezpieczny, łagodny. Unikać w ciąży w dużych ilościach. Alergeny: rodzina astrowatych.',
  },
  {
    id: 'cedrzyk', name: 'Cedr', emoji: '🌲', latin: 'Cedrus libani',
    element: 'ziemia', planet: 'Saturn', chakra: 'podstawy',
    moon: ['nów', 'zanikający'],
    color: '#92400E',
    uses: ['ochrona', 'uzdrowienie', 'mądrość', 'spokój'],
    desc: 'Cedr to drzewo mądrości i wieczności. Jego dym oczyszcza przestrzeń na najgłębszym poziomie energetycznym, przywołuje duchy przodków i wzmacnia połączenie z ziemią.',
    ritual: 'Spalaj wióry cedrowe podczas ceremonii przejścia, oczyszczenia domu lub pracy z traumą przodków.',
    season: 'zima',
    preparation: 'Kadzidło, olejek eteryczny, kąpiel, wosk',
    combinesWith: ['szalwia', 'dziewanna'],
    combineIntention: 'Głębokie oczyszczenie i uziemienie',
    harvestMoon: 'nów',
    meditationAffirm: 'Jestem zakorzeniona jak cedr. Czerpię mądrość przodków i moją siłę z głębi ziemi.',
    safety: 'Olejek eteryczny z cedru nie dla ciężarnych i dzieci poniżej 3 lat. Wióry do kadzenia — bezpieczne.',
  },
];

const SEASONS = [
  { id: 'wiosna', label: 'Wiosna', emoji: '🌱', color: '#34D399' },
  { id: 'lato', label: 'Lato', emoji: '☀️', color: '#FBBF24' },
  { id: 'jesień', label: 'Jesień', emoji: '🍂', color: '#F97316' },
  { id: 'zima', label: 'Zima', emoji: '❄️', color: '#60A5FA' },
];

const MOON_PHASES = [
  { id: 'nów', label: 'Nów', emoji: '🌑', desc: 'Siej intencje, zacznij nowe rytuały i praktyki ziołowe' },
  { id: 'rosnący', label: 'Rosnący', emoji: '🌒', desc: 'Zbieraj zioła dla wzrostu, przyciągania i manifestacji' },
  { id: 'pełnia', label: 'Pełnia', emoji: '🌕', desc: 'Maksymalna moc — ładuj zioła w świetle, rób nalewki' },
  { id: 'zanikający', label: 'Zanikający', emoji: '🌘', desc: 'Zbieraj dla oczyszczenia, uwalniania i ochrony' },
];

// ── New feature data ─────────────────────────────────────────────────────────

const RITUAL_RECIPES = [
  {
    id: 'herbata-spokoju',
    name: 'Herbata spokoju',
    emoji: '🍵',
    color: '#A78BFA',
    intention: 'Wyciszenie umysłu i odprężenie ciała',
    moon: 'pełnia',
    ingredients: ['1 łyżeczka suszonych kwiatów lawendy', '1 łyżeczka melisy', '½ łyżeczki rumianku', 'Szczypta cynamonu', '1 łyżeczka miodu (po zaparzeniu)'],
    steps: [
      'Zagrzej wodę do 85°C — wrzątek zniszczy delikatne olejki lawendy.',
      'Włóż zioła do zaparzacza lub muślinowego woreczka.',
      'Zaparzaj przez 7 minut z przykryciem, aby nie uciekł aromat.',
      'Przecedź i dodaj miód. Pij powoli, wciągając nosem parę.',
      'Wypij przy świetle świecy z intencją spokoju i głębokiego odpoczynku.',
    ],
  },
  {
    id: 'kadzidlo-ochrony',
    name: 'Kadzidło ochrony',
    emoji: '🕯️',
    color: '#F97316',
    intention: 'Ochrona przestrzeni i wzmocnienie granic energetycznych',
    moon: 'nów',
    ingredients: ['Garść suszonego rozmarynu', 'Kilka liści szałwii', '1 suszona gałązka dziewanny', 'Odrobina żywicy drzewnej', 'Żaroodporny pojemnik lub muszelka'],
    steps: [
      'Przed zapaleniem otwórz okno — negatywna energia musi mieć ujście.',
      'Ułóż zioła w pojemniku warstwowo: najpierw rozmaryn, potem szałwia, dziewanna na wierzchu.',
      'Zapal od jednego końca i pozwól się tlić powoli, dmuchając jeśli gaśnie.',
      'Przeprowadź dym przez wszystkie kąty pomieszczenia — od prawej do lewej.',
      'Zakończ przy wejściu do domu. Powiedz lub pomyśl: "To miejsce jest chronione."',
    ],
  },
  {
    id: 'napar-sily',
    name: 'Napar siły',
    emoji: '⚡',
    color: '#FBBF24',
    intention: 'Wzmocnienie energii, jasności umysłu i odwagi',
    moon: 'rosnący',
    ingredients: ['1 łyżeczka rozmarynu', '½ łyżeczki szałwii', '3 plasterki świeżego imbiru', 'Skórka z połowy cytryny', 'Opcjonalnie: odrobina cayenne'],
    steps: [
      'Zagotuj wodę i dodaj imbir — gotuj 3 minuty dla wydobycia siły korzenia.',
      'Zdejmij z ognia, dodaj rozmaryn i szałwię. Przykryj i zaparzaj 5 minut.',
      'Dodaj skórkę cytrynową i odczekaj jeszcze 2 minuty.',
      'Przecedź przez sito. Pij małymi łykami, nie mieszając z mlekiem.',
      'Wypij przed ważnym zadaniem, rozmową lub wyzwaniem dnia.',
    ],
  },
  {
    id: 'oklad-uzdrowienia',
    name: 'Okład uzdrowienia',
    emoji: '🌿',
    color: '#34D399',
    intention: 'Uzdrowienie, regeneracja ciała i spokój emocjonalny',
    moon: 'pełnia',
    ingredients: ['Garść świeżego lub suszonego rumianku', '½ szklanki płatków lawendy', 'Kilka liści melisy', 'Czysty bawełniany ręcznik', '2 litry ciepłej wody'],
    steps: [
      'Zaparzyć wszystkie zioła razem w dużym naczyniu przez 15 minut.',
      'Przecedź napar przez gęste sito lub gazę.',
      'Zamocz bawełniany ręcznik w ciepłym naparze i wyciśnij nadmiar płynu.',
      'Połóż okład na bolące lub zmęczone miejsce na ciele na 20 minut.',
      'Podczas zabiegu wizualizuj zielone, uzdrawiające światło wnikające w ciało.',
    ],
  },
  {
    id: 'amulet-szczescia',
    name: 'Amulet szczęścia',
    emoji: '🍀',
    color: '#60A5FA',
    intention: 'Przyciąganie dobrej energii, szczęścia i obfitości',
    moon: 'rosnący',
    ingredients: ['Mały woreczek z zielonej lub złotej tkaniny', 'Szczypta rumianku', 'Kilka kwiatków lawendy', 'Listek melisy', 'Mały kamień (kryształ lub biały kamyk)', 'Zielona lub złota wstążka'],
    steps: [
      'Wybierz czwartek lub piątek — dni Jowisza i Wenus, sprzyjające obfitości.',
      'Połóż każde zioło na dłoni i wyobraź sobie pożądany rezultat, zanim włożysz do woreczka.',
      'Umieść kamień jako ostatni — to serce amuletu.',
      'Zawiąż woreczek 7 razy, wypowiadając swoją intencję przy każdym węźle.',
      'Noś przy sobie przez 28 dni, po czym zakop ziemię lub spal z wdzięcznością.',
    ],
  },
];

const HERB_COMBINATIONS = [
  {
    herbs: ['lawenda', 'melisa', 'rumianek'],
    intention: 'Głęboki spokój i sen',
    color: '#A78BFA',
    emoji: '🌙',
    desc: 'Trio uspokajające — łagodzi lęk, wycisza myśli, prowadzi do głębokiego snu. Idealne przed snem lub po stresującym dniu.',
  },
  {
    herbs: ['rozmaryn', 'szalwia', 'dziewanna'],
    intention: 'Oczyszczenie i ochrona',
    color: '#34D399',
    emoji: '🛡️',
    desc: 'Kombinacja ochronna — oczyszcza przestrzeń, wzmacnia granice energetyczne i odpędza negatywne wpływy.',
  },
  {
    herbs: ['bylica', 'walerian'],
    intention: 'Sny i intuicja',
    color: '#C084FC',
    emoji: '🌀',
    desc: 'Duet księżycowy — otwiera bramy snów, wzmacnia intuicję i sprzyja wizyjnemu śnieniu.',
  },
  {
    herbs: ['melisa', 'rozmaryn'],
    intention: 'Koncentracja i radość',
    color: '#FBBF24',
    emoji: '☀️',
    desc: 'Połączenie słoneczne — pobudza umysł bez pobudzenia nerwowego, daje energię z radością.',
  },
  {
    herbs: ['lawenda', 'szalwia'],
    intention: 'Mądrość i spokój',
    color: '#60A5FA',
    emoji: '🌸',
    desc: 'Duo mądrości — łączy klarowność myśli z głębokim spokojem wewnętrznym. Doskonałe przed medytacją.',
  },
];

const HERB_OF_WEEK = () => {
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return HERBS[weekNum % HERBS.length];
};

const MEDITATION_STEPS = [
  { time: 60, title: 'Oddech i obecność', desc: 'Usiądź wygodnie. Zamknij oczy. Weź trzy głębokie oddechy. Poczuj kontakt ciała z podłożem.' },
  { time: 60, title: 'Powitanie zioła', desc: 'Wyobraź sobie wybrane zioło — jego kolor, kształt, aromat. Pozwól obrazowi wyłonić się bez wysiłku.' },
  { time: 90, title: 'Spotkanie z duchem rośliny', desc: 'W swojej wizualizacji zbliż się do rośliny. Co chce ci powiedzieć? Jaką mądrość niesie?' },
  { time: 60, title: 'Przyjęcie daru', desc: 'Poczuj właściwości zioła wnikające w twoje ciało. Może to ciepło, spokój, jasność lub siła.' },
  { time: 30, title: 'Wdzięczność i powrót', desc: 'Podziękuj roślinie za jej dar. Weź głęboki oddech i powoli powróć do świadomości ciała.' },
];

const getMoonPhase = () => {
  const known = new Date('2000-01-06');
  const now = new Date();
  const diff = (now.getTime() - known.getTime()) / 86400000;
  const age = diff % 29.53;
  if (age < 3.7) return 'nów';
  if (age < 14.8) return 'rosnący';
  if (age < 18.5) return 'pełnia';
  return 'zanikający';
};

const getCurrentSeason = () => {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return 'wiosna';
  if (m >= 5 && m <= 7) return 'lato';
  if (m >= 8 && m <= 10) return 'jesień';
  return 'zima';
};

// ── Decorative SVG ────────────────────────────────────────────────────────────
const HerbalBg = ({ isLight }: { isLight: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight ? ['#F0FFF4', '#DCFCE7', '#F9FAFB'] as const : ['#020C06', '#041409', '#061A0C'] as const}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={300} style={{ position: 'absolute', top: 0, opacity: isLight ? 0.08 : 0.12 }}>
      <Circle cx={SW * 0.85} cy={60} r={90} fill={ACCENT} />
      <Circle cx={SW * 0.1} cy={200} r={60} fill="#A78BFA" />
      <Ellipse cx={SW / 2} cy={280} rx={180} ry={40} fill={ACCENT} />
    </Svg>
  </View>
);

export const HerbalAlchemyScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { themeName, favoriteItems, addFavoriteItem, removeFavoriteItem } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');
  const textColor = isLight ? '#0A2E14' : '#E8F5E9';
  const subColor = isLight ? '#2E6B3A' : 'rgba(232,245,233,0.65)';
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.09)';

  const isFav = favoriteItems.some(f => f.route === 'HerbalAlchemy');
  const toggleFav = () => {
    if (isFav) removeFavoriteItem('HerbalAlchemy');
    else addFavoriteItem({ id: 'HerbalAlchemy', label: 'Alchemia Ziół', icon: 'Leaf', color: ACCENT, route: 'HerbalAlchemy', addedAt: new Date().toISOString() });
    HapticsService.impact('light');
  };

  const [activeTab, setActiveTab] = useState<'zioła' | 'kalendarz' | 'rytuały' | 'odkryj'>('zioła');
  const [selectedHerb, setSelectedHerb] = useState<typeof HERBS[0] | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [activeUse, setActiveUse] = useState<string | null>(null);
  const [activeSeason, setActiveSeason] = useState<string>(getCurrentSeason());

  // MOJE ZIOŁA
  const [myHerbIds, setMyHerbIds] = useState<string[]>([]);

  // RECEPTURY
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [herbAiInsight, setHerbAiInsight] = useState<string>("");
  const [herbAiLoading, setHerbAiLoading] = useState(false);

  const fetchHerbInsight = async () => {
    if (herbAiLoading) return;
    setHerbAiLoading(true);
    HapticsService.impact("light");
    try {
      const herb = herbOfWeek;
      const moonPhaseLabel = MOON_PHASES.find(m => m.id === currentMoonPhase)?.label || currentMoonPhase;
      const prompt = "Zioło tygodnia: " + herb.name + " (" + herb.latin + "). Element: " + herb.element + ". Planeta: " + herb.planet + ". Aktualna faza ksiezica: " + moonPhaseLabel + ". Pora roku: " + currentSeason + ". Napisz krotka (3-4 zdania) interpretacje jak pracowac z tym ziolem w tym kosmicznym kontekscie i jaki rytuał zaproponowac.";
      const result = await AiService.chatWithOracle(prompt);
      setHerbAiInsight(result);
    } catch (e) {
      setHerbAiInsight("Nie udalo sie pobrac interpretacji. Sprobuj ponownie.");
    } finally {
      setHerbAiLoading(false);
    }
  };

  // MEDYTACJA ZIOŁOWA
  const [showMeditation, setShowMeditation] = useState(false);
  const [meditHerbId, setMeditHerbId] = useState<string>(HERBS[0].id);
  const [meditRunning, setMeditRunning] = useState(false);
  const [meditStep, setMeditStep] = useState(0);
  const [meditSeconds, setMeditSeconds] = useState(0);
  const meditTimerRef = useRef<any>(null);

  const currentMoonPhase = getMoonPhase();
  const currentSeason = getCurrentSeason();
  const herbOfWeek = HERB_OF_WEEK();

  const moonHerbs = useMemo(() =>
    HERBS.filter(h => h.moon.includes(currentMoonPhase)),
    [currentMoonPhase]
  );

  const seasonHerbs = useMemo(() =>
    HERBS.filter(h => h.season === activeSeason),
    [activeSeason]
  );

  const filteredHerbs = useMemo(() => {
    if (!activeUse) return HERBS;
    return HERBS.filter(h => h.uses.includes(activeUse));
  }, [activeUse]);

  const allUses = useMemo(() => {
    const uses = new Set<string>();
    HERBS.forEach(h => h.uses.forEach(u => uses.add(u)));
    return Array.from(uses);
  }, []);

  const myHerbs = useMemo(() => HERBS.filter(h => myHerbIds.includes(h.id)), [myHerbIds]);

  const openHerb = (herb: typeof HERBS[0]) => {
    setSelectedHerb(herb);
    setShowDetail(true);
    HapticsService.impact('light');
  };

  const toggleMyHerb = (id: string) => {
    HapticsService.impact('light');
    setMyHerbIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Meditation timer
  const startMeditation = () => {
    setMeditStep(0);
    setMeditSeconds(MEDITATION_STEPS[0].time);
    setMeditRunning(true);
  };

  useEffect(() => {
    if (!meditRunning) return;
    meditTimerRef.current = setInterval(() => {
      setMeditSeconds(prev => {
        if (prev <= 1) {
          const nextStep = meditStep + 1;
          if (nextStep >= MEDITATION_STEPS.length) {
            setMeditRunning(false);
            clearInterval(meditTimerRef.current);
            return 0;
          }
          setMeditStep(nextStep);
          return MEDITATION_STEPS[nextStep].time;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(meditTimerRef.current);
  }, [meditRunning, meditStep]);

  const stopMeditation = () => {
    clearInterval(meditTimerRef.current);
    setMeditRunning(false);
    setMeditStep(0);
    setMeditSeconds(0);
  };

  const formatMeditTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const totalMeditTime = MEDITATION_STEPS.reduce((acc, s) => acc + s.time, 0);

  // Harvest calendar: group herbs by moon phase best for harvest
  const harvestByPhase = useMemo(() => {
    const map: Record<string, typeof HERBS> = { nów: [], rosnący: [], pełnia: [], zanikający: [] };
    HERBS.forEach(h => { if (map[h.harvestMoon]) map[h.harvestMoon].push(h); });
    return map;
  }, []);

  return (
    <View style={[ha.root, { backgroundColor: currentTheme.background }]}>
      <HerbalBg isLight={isLight} />
      <SafeAreaView style={ha.safe} edges={['top'] as any}>

        {/* Header */}
        <View style={ha.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={ha.backBtn} hitSlop={14}>
            <ChevronLeft color={ACCENT} size={26} strokeWidth={1.5} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[ha.headerEyebrow, { color: ACCENT }]}>🌿 ALCHEMIA ZIÓŁ</Text>
            <Text style={[ha.headerTitle, { color: textColor }]}>Mądrość Roślin</Text>
          </View>
          <Pressable onPress={toggleFav} hitSlop={14} style={ha.starBtn}>
            <Star color={ACCENT} size={20} strokeWidth={1.5} fill={isFav ? ACCENT : 'none'} />
          </Pressable>
        </View>

        {/* Tab bar */}
        <View style={[ha.tabRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {(['zioła', 'kalendarz', 'rytuały', 'odkryj'] as const).map(tab => (
            <Pressable
              key={tab}
              onPress={() => { setActiveTab(tab); HapticsService.impact('light'); }}
              style={[ha.tabBtn, activeTab === tab && { backgroundColor: ACCENT + '22', borderColor: ACCENT + '55', borderWidth: 1 }]}
            >
              <Text style={[ha.tabLabel, { color: activeTab === tab ? ACCENT : subColor }]}>
                {tab === 'zioła' ? '🌿' : tab === 'kalendarz' ? '🌙' : tab === 'rytuały' ? '🕯️' : '✦'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={ha.scroll} showsVerticalScrollIndicator={false}>

          {/* ═══════════════════════════ TAB: ZIOŁA ═══════════════════════════ */}
          {activeTab === 'zioła' && (
            <>
              {/* ZIOŁO TYGODNIA */}
              <Animated.View entering={FadeInDown.delay(0).duration(500)}>
                <Text style={[ha.sectionEyebrow, { color: ACCENT }]}>✦ ZIOŁO TYGODNIA</Text>
                <LinearGradient
                  colors={[herbOfWeek.color + '20', herbOfWeek.color + '08', 'transparent'] as const}
                  style={[ha.weekHeroCard, { borderColor: herbOfWeek.color + '55' }]}
                >
                  <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
                    <View style={[ha.weekHeroEmoji, { backgroundColor: herbOfWeek.color + '18', borderColor: herbOfWeek.color + '33' }]}>
                      <Text style={{ fontSize: 36 }}>{herbOfWeek.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[ha.weekHeroName, { color: herbOfWeek.color }]}>{herbOfWeek.name}</Text>
                      <Text style={[ha.weekHeroLatin, { color: subColor }]}>{herbOfWeek.latin}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {[herbOfWeek.element, herbOfWeek.planet, `Czakra ${herbOfWeek.chakra}`].map(b => (
                          <View key={b} style={[ha.weekHeroBadge, { backgroundColor: herbOfWeek.color + '18' }]}>
                            <Text style={[ha.weekHeroBadgeText, { color: herbOfWeek.color }]}>{b}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                  <Text style={[ha.weekHeroDesc, { color: isLight ? '#1A3A1E' : '#C8F0D0', marginTop: 14 }]}>{herbOfWeek.desc}</Text>
                  <View style={[ha.weekRitualBox, { backgroundColor: herbOfWeek.color + '10', borderColor: herbOfWeek.color + '30' }]}>
                    <Text style={[ha.weekRitualLabel, { color: herbOfWeek.color }]}>🕯️ RYTUAŁ TYGODNIA</Text>
                    <Text style={[ha.weekRitualText, { color: subColor }]}>{herbOfWeek.ritual}</Text>
                  </View>
                  <Text style={[ha.weekPrepText, { color: herbOfWeek.color }]}>Przygotowanie: {herbOfWeek.preparation}</Text>
                </LinearGradient>
              </Animated.View>

              {/* Moon phase recommendation */}
              <Animated.View entering={FadeInDown.delay(60).duration(500)}>
                <LinearGradient
                  colors={['rgba(52,211,153,0.14)', 'rgba(52,211,153,0.04)'] as const}
                  style={[ha.moonCard, { borderColor: ACCENT + '44' }]}
                >
                  <Text style={[ha.moonEyebrow, { color: ACCENT }]}>🌙 ZIOŁA NA TĘ FAZĘ KSIĘŻYCA</Text>
                  <Text style={[ha.moonPhase, { color: textColor }]}>
                    {MOON_PHASES.find(m => m.id === currentMoonPhase)?.emoji} {MOON_PHASES.find(m => m.id === currentMoonPhase)?.label}
                  </Text>
                  <Text style={[ha.moonDesc, { color: subColor }]}>
                    {MOON_PHASES.find(m => m.id === currentMoonPhase)?.desc}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {moonHerbs.map(h => (
                      <Pressable
                        key={h.id}
                        onPress={() => openHerb(h)}
                        style={[ha.moonHerbChip, { backgroundColor: h.color + '18', borderColor: h.color + '44' }]}
                      >
                        <Text style={{ fontSize: 13 }}>{h.emoji}</Text>
                        <Text style={[ha.moonHerbName, { color: h.color }]}>{h.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Use filter chips */}
              <Text style={[ha.sectionEyebrow, { color: ACCENT }]}>🔍 FILTRUJ PO ZASTOSOWANIU</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <Pressable
                  onPress={() => setActiveUse(null)}
                  style={[ha.useChip, !activeUse && { backgroundColor: ACCENT + '22', borderColor: ACCENT }]}
                >
                  <Text style={[ha.useChipText, { color: !activeUse ? ACCENT : subColor }]}>Wszystkie</Text>
                </Pressable>
                {allUses.map(use => (
                  <Pressable
                    key={use}
                    onPress={() => setActiveUse(use === activeUse ? null : use)}
                    style={[ha.useChip, activeUse === use && { backgroundColor: ACCENT + '22', borderColor: ACCENT }]}
                  >
                    <Text style={[ha.useChipText, { color: activeUse === use ? ACCENT : subColor }]}>{use}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Herb grid */}
              <Text style={[ha.sectionEyebrow, { color: ACCENT }]}>🌿 BIBLIOTEKA ZIÓŁ</Text>
              <View style={ha.herbGrid}>
                {filteredHerbs.map((herb, i) => (
                  <Animated.View key={herb.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                    <Pressable
                      onPress={() => openHerb(herb)}
                      style={[ha.herbCard, { backgroundColor: cardBg, borderColor: herb.color + '44' }]}
                    >
                      <LinearGradient colors={[herb.color + '16', 'transparent'] as const} style={StyleSheet.absoluteFillObject} />
                      <Text style={ha.herbEmoji}>{herb.emoji}</Text>
                      <Text style={[ha.herbName, { color: herb.color }]}>{herb.name}</Text>
                      <Text style={[ha.herbLatin, { color: subColor }]}>{herb.latin}</Text>
                      <View style={[ha.herbPlanetBadge, { backgroundColor: herb.color + '22' }]}>
                        <Text style={[ha.herbPlanetText, { color: herb.color }]}>{herb.planet}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                        {herb.uses.slice(0, 2).map(u => (
                          <View key={u} style={[ha.useTag, { backgroundColor: herb.color + '14' }]}>
                            <Text style={[ha.useTagText, { color: herb.color }]}>{u}</Text>
                          </View>
                        ))}
                      </View>
                      {/* My herbs toggle */}
                      <Pressable
                        onPress={() => toggleMyHerb(herb.id)}
                        hitSlop={8}
                        style={[ha.myHerbBtn, { backgroundColor: myHerbIds.includes(herb.id) ? herb.color + '22' : cardBg, borderColor: herb.color + '44' }]}
                      >
                        {myHerbIds.includes(herb.id)
                          ? <Check color={herb.color} size={12} strokeWidth={2.5} />
                          : <Plus color={herb.color} size={12} strokeWidth={2.5} />
                        }
                        <Text style={[ha.myHerbBtnText, { color: herb.color }]}>
                          {myHerbIds.includes(herb.id) ? 'Moje' : 'Dodaj'}
                        </Text>
                      </Pressable>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>

              {/* MOJE ZIOŁA */}
              {myHerbs.length > 0 && (
                <Animated.View entering={FadeInDown.duration(400)}>
                  <Text style={[ha.sectionEyebrow, { color: ACCENT, marginTop: 8 }]}>🌱 MOJE ZIOŁA ({myHerbs.length})</Text>
                  <LinearGradient
                    colors={['rgba(52,211,153,0.10)', 'rgba(52,211,153,0.03)'] as const}
                    style={[ha.myHerbsCard, { borderColor: ACCENT + '33' }]}
                  >
                    <Text style={[ha.myHerbsHint, { color: subColor }]}>Twoja kolekcja ziołowa. Dotknij zioła, aby zobaczyć szczegóły.</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                      {myHerbs.map(h => (
                        <Pressable
                          key={h.id}
                          onPress={() => openHerb(h)}
                          style={[ha.myHerbChip, { backgroundColor: h.color + '18', borderColor: h.color + '44' }]}
                        >
                          <Text style={{ fontSize: 18 }}>{h.emoji}</Text>
                          <View>
                            <Text style={[ha.myHerbChipName, { color: h.color }]}>{h.name}</Text>
                            <Text style={[ha.myHerbChipSub, { color: subColor }]}>{h.uses[0]}</Text>
                          </View>
                          <Pressable onPress={() => toggleMyHerb(h.id)} hitSlop={6}>
                            <Minus color={subColor} size={14} strokeWidth={2} />
                          </Pressable>
                        </Pressable>
                      ))}
                    </View>
                  </LinearGradient>
                </Animated.View>
              )}
            </>
          )}

          {/* ═══════════════════════════ TAB: KALENDARZ ═══════════════════════════ */}
          {activeTab === 'kalendarz' && (
            <>
              {/* Season selector */}
              <Animated.View entering={FadeInDown.delay(0).duration(400)}>
                <Text style={[ha.sectionEyebrow, { color: ACCENT }]}>🍃 PORA ROKU</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  {SEASONS.map(s => (
                    <Pressable
                      key={s.id}
                      onPress={() => setActiveSeason(s.id)}
                      style={[ha.seasonBtn, { borderColor: activeSeason === s.id ? s.color : cardBorder, backgroundColor: activeSeason === s.id ? s.color + '18' : cardBg }]}
                    >
                      <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
                      <Text style={[ha.seasonLabel, { color: activeSeason === s.id ? s.color : subColor }]}>{s.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>

              {/* Season herbs */}
              <Text style={[ha.sectionEyebrow, { color: ACCENT }]}>
                {SEASONS.find(s => s.id === activeSeason)?.emoji} ZIOŁA {activeSeason.toUpperCase()}
              </Text>
              {seasonHerbs.length === 0 ? (
                <View style={[ha.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[ha.emptyText, { color: subColor }]}>Brak ziół dla tej pory roku w bibliotece</Text>
                </View>
              ) : (
                seasonHerbs.map((herb, i) => (
                  <Animated.View key={herb.id} entering={FadeInDown.delay(i * 80).duration(400)}>
                    <Pressable
                      onPress={() => openHerb(herb)}
                      style={[ha.listHerbCard, { backgroundColor: cardBg, borderColor: herb.color + '33' }]}
                    >
                      <Text style={{ fontSize: 28 }}>{herb.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[ha.listHerbName, { color: textColor }]}>{herb.name}</Text>
                        <Text style={[ha.listHerbDesc, { color: subColor }]} numberOfLines={2}>{herb.desc}</Text>
                      </View>
                      <ArrowRight color={herb.color} size={16} strokeWidth={1.5} />
                    </Pressable>
                  </Animated.View>
                ))
              )}

              {/* KALENDARZ ZBIORÓW — Moon harvest calendar */}
              <Text style={[ha.sectionEyebrow, { color: ACCENT, marginTop: 8 }]}>🌾 KALENDARZ ZBIORÓW</Text>
              <Animated.View entering={FadeInDown.delay(0).duration(400)}>
                <LinearGradient
                  colors={['rgba(52,211,153,0.10)', 'transparent'] as const}
                  style={[ha.harvestCard, { borderColor: ACCENT + '33' }]}
                >
                  <Text style={[ha.harvestTitle, { color: textColor }]}>Najlepsze dni zbiorów według fazy Księżyca</Text>
                  <Text style={[ha.harvestDesc, { color: subColor }]}>
                    Starożytna wiedź ziołowa wskazuje, że pora zbioru wpływa na zawartość olejków eterycznych i moc leczniczą roślin. Zbieraj rano po rosie.
                  </Text>
                </LinearGradient>
              </Animated.View>

              {MOON_PHASES.map((phase, i) => {
                const phaseHerbs = harvestByPhase[phase.id] || [];
                return (
                  <Animated.View key={phase.id} entering={FadeInDown.delay(i * 70).duration(400)}>
                    <View style={[ha.harvestPhaseCard, { backgroundColor: cardBg, borderColor: phase.id === currentMoonPhase ? ACCENT + '66' : cardBorder }, phase.id === currentMoonPhase && { backgroundColor: ACCENT + '08' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Text style={{ fontSize: 26 }}>{phase.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[ha.phaseName, { color: phase.id === currentMoonPhase ? ACCENT : textColor }]}>
                            {phase.label} {phase.id === currentMoonPhase ? '← TERAZ' : ''}
                          </Text>
                          <Text style={[ha.phaseDesc, { color: subColor }]}>{phase.desc}</Text>
                        </View>
                      </View>
                      {phaseHerbs.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {phaseHerbs.map(h => (
                            <View key={h.id} style={[ha.moonHerbChip, { backgroundColor: h.color + '18', borderColor: h.color + '44' }]}>
                              <Text style={{ fontSize: 13 }}>{h.emoji}</Text>
                              <Text style={[ha.moonHerbName, { color: h.color }]}>{h.name}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {phaseHerbs.length === 0 && (
                        <Text style={[{ fontSize: 12, color: subColor, fontStyle: 'italic' }]}>Brak ziół do zbioru w tej fazie</Text>
                      )}
                    </View>
                  </Animated.View>
                );
              })}

              {/* ŁĄCZENIE ZIÓŁ */}
              <Text style={[ha.sectionEyebrow, { color: ACCENT, marginTop: 8 }]}>🔗 ŁĄCZENIE ZIÓŁ</Text>
              <Text style={[ha.combineIntro, { color: subColor }]}>
                Niektóre zioła wzmacniają wzajemne działanie, gdy są łączone. Oto sprawdzone kombinacje dla konkretnych intencji.
              </Text>
              {HERB_COMBINATIONS.map((combo, i) => {
                const comboHerbs = combo.herbs.map(id => HERBS.find(h => h.id === id)).filter(Boolean);
                return (
                  <Animated.View key={combo.intention} entering={FadeInDown.delay(i * 70).duration(400)}>
                    <LinearGradient
                      colors={[combo.color + '14', combo.color + '05'] as const}
                      style={[ha.comboCard, { borderColor: combo.color + '44' }]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Text style={{ fontSize: 26 }}>{combo.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[ha.comboIntention, { color: combo.color }]}>{combo.intention}</Text>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                            {comboHerbs.map(h => (
                              <View key={h.id} style={[ha.comboHerbBadge, { backgroundColor: h.color + '18' }]}>
                                <Text style={{ fontSize: 10 }}>{h.emoji}</Text>
                                <Text style={[ha.comboHerbBadgeText, { color: h.color }]}>{h.name}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                      <Text style={[ha.comboDesc, { color: subColor }]}>{combo.desc}</Text>
                    </LinearGradient>
                  </Animated.View>
                );
              })}

              {/* Moon phase guide */}
              <Text style={[ha.sectionEyebrow, { color: ACCENT, marginTop: 8 }]}>🌕 FAZY KSIĘŻYCA I ZIOŁA</Text>
              {MOON_PHASES.map((phase, i) => (
                <Animated.View key={phase.id} entering={FadeInDown.delay(i * 80).duration(400)}>
                  <View style={[ha.phaseCard, { backgroundColor: cardBg, borderColor: cardBorder }, phase.id === currentMoonPhase && { borderColor: ACCENT + '66', backgroundColor: ACCENT + '0A' }]}>
                    <Text style={{ fontSize: 28, marginRight: 14 }}>{phase.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[ha.phaseName, { color: phase.id === currentMoonPhase ? ACCENT : textColor }]}>
                        {phase.label} {phase.id === currentMoonPhase ? '← TERAZ' : ''}
                      </Text>
                      <Text style={[ha.phaseDesc, { color: subColor }]}>{phase.desc}</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </>
          )}

          {/* ═══════════════════════════ TAB: RYTUAŁY ═══════════════════════════ */}
          {activeTab === 'rytuały' && (
            <>
              <Animated.View entering={FadeInDown.delay(0).duration(400)}>
                <LinearGradient
                  colors={['rgba(52,211,153,0.12)', 'transparent'] as const}
                  style={[ha.ritualHeroCard, { borderColor: ACCENT + '33' }]}
                >
                  <Text style={[ha.ritualEyebrow, { color: ACCENT }]}>🕯️ RYTUAŁY ZIOŁOWE</Text>
                  <Text style={[ha.ritualHeroTitle, { color: textColor }]}>Ceremonie z Mocą Roślin</Text>
                  <Text style={[ha.ritualHeroDesc, { color: subColor }]}>
                    Każde zioło niesie swoją własną moc. Połącz ją z intencją, fazą księżyca i elementem, aby wzmocnić swój rytuał.
                  </Text>
                </LinearGradient>
              </Animated.View>

              {/* RECEPTURY RYTUALNE */}
              <Text style={[ha.sectionEyebrow, { color: ACCENT }]}>📜 RECEPTURY RYTUALNE</Text>
              {RITUAL_RECIPES.map((recipe, i) => {
                const isExpanded = expandedRecipe === recipe.id;
                return (
                  <Animated.View key={recipe.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                    <View style={[ha.recipeCard, { backgroundColor: cardBg, borderColor: recipe.color + '44' }]}>
                      <LinearGradient colors={[recipe.color + '10', 'transparent'] as const} style={StyleSheet.absoluteFillObject} />
                      <Pressable
                        onPress={() => { setExpandedRecipe(isExpanded ? null : recipe.id); HapticsService.impact('light'); }}
                        style={ha.recipeHeader}
                      >
                        <View style={[ha.recipeEmojiWrap, { backgroundColor: recipe.color + '18', borderColor: recipe.color + '33' }]}>
                          <Text style={{ fontSize: 24 }}>{recipe.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[ha.recipeName, { color: recipe.color }]}>{recipe.name}</Text>
                          <Text style={[ha.recipeIntention, { color: subColor }]}>{recipe.intention}</Text>
                          <View style={[ha.recipeMoonBadge, { backgroundColor: recipe.color + '14' }]}>
                            <Text style={[ha.recipeMoonText, { color: recipe.color }]}>
                              {MOON_PHASES.find(m => m.id === recipe.moon)?.emoji} {MOON_PHASES.find(m => m.id === recipe.moon)?.label}
                            </Text>
                          </View>
                        </View>
                        {isExpanded
                          ? <ChevronUp color={recipe.color} size={18} strokeWidth={1.8} />
                          : <ChevronDown color={recipe.color} size={18} strokeWidth={1.8} />
                        }
                      </Pressable>
                      {isExpanded && (
                        <View style={ha.recipeBody}>
                          <View style={[ha.recipeDivider, { backgroundColor: recipe.color + '22' }]} />
                          <Text style={[ha.recipeSubLabel, { color: recipe.color }]}>🧪 SKŁADNIKI</Text>
                          {recipe.ingredients.map((ing, idx) => (
                            <View key={idx} style={ha.ingredientRow}>
                              <View style={[ha.ingredientDot, { backgroundColor: recipe.color }]} />
                              <Text style={[ha.ingredientText, { color: subColor }]}>{ing}</Text>
                            </View>
                          ))}
                          <View style={[ha.recipeDivider, { backgroundColor: recipe.color + '22', marginTop: 12 }]} />
                          <Text style={[ha.recipeSubLabel, { color: recipe.color }]}>✦ KROKI</Text>
                          {recipe.steps.map((step, idx) => (
                            <View key={idx} style={ha.recipeStepRow}>
                              <View style={[ha.recipeStepNum, { backgroundColor: recipe.color + '18' }]}>
                                <Text style={[ha.recipeStepNumText, { color: recipe.color }]}>{idx + 1}</Text>
                              </View>
                              <Text style={[ha.recipeStepText, { color: isLight ? '#1A3A1E' : '#C8EDD0' }]}>{step}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </Animated.View>
                );
              })}

              {/* HERB RITUALS per herb */}
              <Text style={[ha.sectionEyebrow, { color: ACCENT, marginTop: 4 }]}>🌿 RYTUAŁY Z ZIOŁAMI</Text>
              {HERBS.map((herb, i) => (
                <Animated.View key={herb.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                  <View style={[ha.ritualCard, { backgroundColor: cardBg, borderColor: herb.color + '33' }]}>
                    <LinearGradient colors={[herb.color + '10', 'transparent'] as const} style={StyleSheet.absoluteFillObject} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <Text style={{ fontSize: 28 }}>{herb.emoji}</Text>
                      <View>
                        <Text style={[ha.ritualHerbName, { color: herb.color }]}>{herb.name}</Text>
                        <View style={[ha.ritualElementBadge, { backgroundColor: herb.color + '18' }]}>
                          <Text style={[ha.ritualElementText, { color: herb.color }]}>{herb.element} · {herb.planet}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={[ha.ritualText, { color: subColor }]}>{herb.ritual}</Text>
                    <Text style={[ha.ritualPrep, { color: herb.color }]}>Przygotowanie: {herb.preparation}</Text>
                  </View>
                </Animated.View>
              ))}
            </>
          )}

          {/* ═══════════════════════════ TAB: ODKRYJ ═══════════════════════════ */}
          {activeTab === 'odkryj' && (
            <>
              {/* MEDYTACJA ZIOŁOWA */}
              <Animated.View entering={FadeInDown.delay(0).duration(400)}>
                <Text style={[ha.sectionEyebrow, { color: ACCENT }]}>🧘 MEDYTACJA ZIOŁOWA</Text>
                <LinearGradient
                  colors={['rgba(52,211,153,0.14)', 'rgba(52,211,153,0.04)'] as const}
                  style={[ha.meditCard, { borderColor: ACCENT + '44' }]}
                >
                  <Text style={[ha.meditTitle, { color: textColor }]}>5-minutowa medytacja z duchem rośliny</Text>
                  <Text style={[ha.meditDesc, { color: subColor }]}>
                    Wybierz zioło, z którym chcesz pracować. Każda roślina ma swój własny duch i mądrość. Pozwól jej prowadzić twoją praktykę.
                  </Text>

                  {/* Herb selector */}
                  <Text style={[ha.meditSelectLabel, { color: ACCENT }]}>WYBIERZ ZIOŁO</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                    {HERBS.map(h => (
                      <Pressable
                        key={h.id}
                        onPress={() => { setMeditHerbId(h.id); HapticsService.impact('light'); }}
                        style={[ha.meditHerbChip, { backgroundColor: h.color + (meditHerbId === h.id ? '28' : '10'), borderColor: h.color + (meditHerbId === h.id ? '77' : '22') }]}
                      >
                        <Text style={{ fontSize: 16 }}>{h.emoji}</Text>
                        <Text style={[ha.meditHerbChipText, { color: h.color }]}>{h.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  {/* Selected herb affirmation */}
                  {(() => {
                    const mHerb = HERBS.find(h => h.id === meditHerbId);
                    if (!mHerb) return null;
                    return (
                      <View style={[ha.meditAffirmBox, { backgroundColor: mHerb.color + '10', borderColor: mHerb.color + '33' }]}>
                        <Text style={[ha.meditAffirmLabel, { color: mHerb.color }]}>✦ AFIRMACJA</Text>
                        <Text style={[ha.meditAffirmText, { color: isLight ? '#1A3A1E' : '#C8EDD0' }]}>{mHerb.meditationAffirm}</Text>
                      </View>
                    );
                  })()}

                  {/* Timer area */}
                  {meditRunning && (
                    <View style={[ha.meditTimerBox, { borderColor: ACCENT + '44', backgroundColor: ACCENT + '0A' }]}>
                      <Text style={[ha.meditStepNum, { color: ACCENT }]}>KROK {meditStep + 1} / {MEDITATION_STEPS.length}</Text>
                      <Text style={[ha.meditStepTitle, { color: textColor }]}>{MEDITATION_STEPS[meditStep].title}</Text>
                      <Text style={[ha.meditStepDesc, { color: subColor }]}>{MEDITATION_STEPS[meditStep].desc}</Text>
                      <Text style={[ha.meditTimer, { color: ACCENT }]}>{formatMeditTime(meditSeconds)}</Text>
                      {/* Progress bar */}
                      <View style={[ha.meditProgressBg, { backgroundColor: ACCENT + '18' }]}>
                        <View style={[ha.meditProgressFill, { width: `${((meditStep) / MEDITATION_STEPS.length) * 100}%`, backgroundColor: ACCENT }]} />
                      </View>
                    </View>
                  )}

                  {!meditRunning && meditSeconds === 0 && meditStep === 0 && (
                    <View style={{ gap: 8, marginTop: 4 }}>
                      {MEDITATION_STEPS.map((step, idx) => (
                        <View key={idx} style={[ha.meditStepPreview, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                          <View style={[ha.meditStepPreviewNum, { backgroundColor: ACCENT + '18' }]}>
                            <Text style={[{ fontSize: 10, fontWeight: '700', color: ACCENT }]}>{idx + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[ha.meditStepPreviewTitle, { color: textColor }]}>{step.title}</Text>
                            <Text style={[ha.meditStepPreviewTime, { color: subColor }]}>{step.time}s</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {meditRunning
                    ? (
                      <Pressable onPress={stopMeditation} style={[ha.meditBtn, { backgroundColor: '#EF4444' + 'CC' }]}>
                        <Text style={ha.meditBtnText}>Zatrzymaj medytację</Text>
                      </Pressable>
                    ) : (
                      <Pressable onPress={startMeditation} style={[ha.meditBtn, { backgroundColor: ACCENT }]}>
                        <Leaf color="#fff" size={16} strokeWidth={2} />
                        <Text style={ha.meditBtnText}>Rozpocznij medytację ({Math.ceil(totalMeditTime / 60)} min)</Text>
                      </Pressable>
                    )
                  }
                </LinearGradient>
              </Animated.View>

              {/* MOJE ZIOŁA — full section */}
              <Animated.View entering={FadeInDown.delay(60).duration(400)}>
                <Text style={[ha.sectionEyebrow, { color: ACCENT }]}>🌱 MOJE ZIOŁA</Text>
                <LinearGradient
                  colors={['rgba(52,211,153,0.10)', 'transparent'] as const}
                  style={[ha.myHerbsFullCard, { borderColor: ACCENT + '33' }]}
                >
                  <Text style={[ha.myHerbsFullTitle, { color: textColor }]}>Twoja kolekcja ziołowa</Text>
                  <Text style={[ha.myHerbsFullDesc, { color: subColor }]}>
                    Zbierz zioła, z którymi pracujesz lub chcesz pracować. Twoja kolekcja jest przewodnikiem po własnej ścieżce ziołowej.
                  </Text>
                  {myHerbs.length === 0 ? (
                    <View style={[ha.myHerbsEmpty, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                      <Text style={[ha.myHerbsEmptyText, { color: subColor }]}>
                        Przejdź do zakładki Zioła i dotknij "+" przy każdym ziole, które chcesz dodać do swojej kolekcji.
                      </Text>
                    </View>
                  ) : (
                    <>
                      {myHerbs.map((h, i) => (
                        <Animated.View key={h.id} entering={FadeInDown.delay(i * 60).duration(300)}>
                          <Pressable
                            onPress={() => openHerb(h)}
                            style={[ha.myHerbFullRow, { backgroundColor: h.color + '0A', borderColor: h.color + '33' }]}
                          >
                            <Text style={{ fontSize: 26 }}>{h.emoji}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={[ha.myHerbFullName, { color: h.color }]}>{h.name}</Text>
                              <Text style={[ha.myHerbFullSub, { color: subColor }]}>{h.uses.join(' · ')}</Text>
                            </View>
                            <Pressable onPress={() => toggleMyHerb(h.id)} hitSlop={8} style={[ha.myHerbRemoveBtn, { borderColor: subColor + '44' }]}>
                              <Minus color={subColor} size={13} strokeWidth={2} />
                            </Pressable>
                          </Pressable>
                        </Animated.View>
                      ))}
                      <Text style={[ha.myHerbsCount, { color: ACCENT }]}>{myHerbs.length} {myHerbs.length === 1 ? 'zioło' : myHerbs.length < 5 ? 'zioła' : 'ziół'} w kolekcji</Text>
                    </>
                  )}
                </LinearGradient>
              </Animated.View>

              {/* ŁĄCZENIE ZIÓŁ in discover tab too */}
              <Animated.View entering={FadeInDown.delay(120).duration(400)}>
                <Text style={[ha.sectionEyebrow, { color: ACCENT }]}>🔗 ŁĄCZENIE ZIÓŁ</Text>
                {HERB_COMBINATIONS.map((combo, i) => {
                  const comboHerbs = combo.herbs.map(id => HERBS.find(h => h.id === id)).filter(Boolean);
                  return (
                    <Animated.View key={combo.intention} entering={FadeInDown.delay(i * 70).duration(400)}>
                      <LinearGradient
                        colors={[combo.color + '14', combo.color + '05'] as const}
                        style={[ha.comboCard, { borderColor: combo.color + '44' }]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <Text style={{ fontSize: 22 }}>{combo.emoji}</Text>
                          <Text style={[ha.comboIntention, { color: combo.color }]}>{combo.intention}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                          {comboHerbs.map(h => (
                            <View key={h.id} style={[ha.comboHerbBadge, { backgroundColor: h.color + '18' }]}>
                              <Text style={{ fontSize: 10 }}>{h.emoji}</Text>
                              <Text style={[ha.comboHerbBadgeText, { color: h.color }]}>{h.name}</Text>
                            </View>
                          ))}
                        </View>
                        <Text style={[ha.comboDesc, { color: subColor }]}>{combo.desc}</Text>
                      </LinearGradient>
                    </Animated.View>
                  );
                })}
              </Animated.View>
            </>
          )}

          {/* Co dalej? */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ marginTop: 8 }}>
            <Text style={[ha.sectionEyebrow, { color: ACCENT }]}>✦ CO DALEJ?</Text>
            {[
              { icon: Moon, label: 'Kalendarz księżycowy', sub: 'Zsynchronizuj rytuały z fazami Księżyca', color: '#A78BFA', route: 'LunarCalendar' },
              { icon: Sparkles, label: 'Wyrocznia Aethery', sub: 'Zapytaj o zioło i jego znaczenie dla Ciebie', color: '#FBBF24', route: 'OraclePortal' },
              { icon: Leaf, label: 'Kąpiel dźwiękowa', sub: 'Połącz moc ziół z dźwiękiem i oddechem', color: ACCENT, route: 'SoundBath' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => navigation.navigate(item.route as any)}
                  style={[ha.nextRow, { backgroundColor: cardBg, borderColor: item.color + '33' }]}
                >
                  <View style={[ha.nextIcon, { backgroundColor: item.color + '18' }]}>
                    <Icon color={item.color} size={17} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[ha.nextTitle, { color: textColor }]}>{item.label}</Text>
                    <Text style={[ha.nextSub, { color: subColor }]}>{item.sub}</Text>
                  </View>
                  <ArrowRight color={item.color} size={15} strokeWidth={1.5} />
                </Pressable>
              );
            })}
          </Animated.View>

          {/* AI HERB INSIGHT */}
          <Animated.View entering={FadeInDown.delay(240).duration(500)} style={{ marginTop: 8, marginBottom: 8 }}>
            <Text style={[ha.sectionEyebrow, { color: ACCENT }]}>{"AI INTERPRETACJA ZIOLA"}</Text>
            <LinearGradient
              colors={[ACCENT + "14", ACCENT + "06"]}
              style={[ha.moonCard, { borderColor: ACCENT + "40" }]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ color: ACCENT, fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>{"ORACLE ZIOLOWY"}</Text>
                <Pressable onPress={fetchHerbInsight} disabled={herbAiLoading}
                  style={{ backgroundColor: ACCENT, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 }}>
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                    {herbAiLoading ? "..." : "Interpretuj zioło"}
                  </Text>
                </Pressable>
              </View>
              {herbAiInsight ? (
                <Text style={{ color: isLight ? "#0A2E14" : "#C8F0D0", fontSize: 13, lineHeight: 22, fontStyle: "italic" }}>{herbAiInsight}</Text>
              ) : (
                <Text style={{ color: subColor, fontSize: 12, lineHeight: 20 }}>
                  {"Nacisnij aby uzyskac AI interpretacje ziola tygodnia w kontekscie aktualnej fazy ksiezica i pory roku."}
                </Text>
              )}
            </LinearGradient>
          </Animated.View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>

      {/* Herb Detail Modal */}
      {showDetail && selectedHerb && (
        <Pressable
          onPress={() => setShowDetail(false)}
          style={ha.modalOverlay}
        >
          <Pressable
            onPress={e => e.stopPropagation()}
            style={[ha.modalCard, { backgroundColor: isLight ? '#FFF' : '#0D1F0F' }]}
          >
            <LinearGradient
              colors={[selectedHerb.color + '18', 'transparent'] as const}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 40 }}>{selectedHerb.emoji}</Text>
              <Pressable onPress={() => setShowDetail(false)} hitSlop={12}>
                <Text style={{ fontSize: 22, color: subColor }}>✕</Text>
              </Pressable>
            </View>
            <Text style={[ha.modalHerbName, { color: selectedHerb.color }]}>{selectedHerb.name}</Text>
            <Text style={[ha.modalLatin, { color: subColor }]}>{selectedHerb.latin}</Text>

            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12, flexWrap: 'wrap' }}>
              <View style={[ha.modalBadge, { backgroundColor: selectedHerb.color + '20' }]}>
                <Text style={[ha.modalBadgeText, { color: selectedHerb.color }]}>{selectedHerb.element}</Text>
              </View>
              <View style={[ha.modalBadge, { backgroundColor: selectedHerb.color + '20' }]}>
                <Text style={[ha.modalBadgeText, { color: selectedHerb.color }]}>{selectedHerb.planet}</Text>
              </View>
              <View style={[ha.modalBadge, { backgroundColor: selectedHerb.color + '20' }]}>
                <Text style={[ha.modalBadgeText, { color: selectedHerb.color }]}>Czakra {selectedHerb.chakra}</Text>
              </View>
              <View style={[ha.modalBadge, { backgroundColor: selectedHerb.color + '20' }]}>
                <Text style={[ha.modalBadgeText, { color: selectedHerb.color }]}>
                  {MOON_PHASES.find(m => m.id === selectedHerb.harvestMoon)?.emoji} Zbiory: {selectedHerb.harvestMoon}
                </Text>
              </View>
            </View>

            <Text style={[ha.modalDesc, { color: isLight ? '#1A3A1E' : '#D4F5DC' }]}>{selectedHerb.desc}</Text>

            <View style={[ha.modalRitualBox, { backgroundColor: selectedHerb.color + '10', borderColor: selectedHerb.color + '33' }]}>
              <Text style={[ha.modalRitualLabel, { color: selectedHerb.color }]}>🕯️ RYTUAŁ</Text>
              <Text style={[ha.modalRitualText, { color: isLight ? '#2E5A32' : '#B8E8BC' }]}>{selectedHerb.ritual}</Text>
            </View>

            {selectedHerb.combinesWith && (
              <View style={[ha.modalCombineBox, { backgroundColor: selectedHerb.color + '08', borderColor: selectedHerb.color + '22' }]}>
                <Text style={[ha.modalCombineLabel, { color: selectedHerb.color }]}>🔗 ŁĄCZY SIĘ Z</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {selectedHerb.combinesWith.map(cid => {
                    const ch = HERBS.find(h => h.id === cid);
                    if (!ch) return null;
                    return (
                      <View key={cid} style={[ha.modalBadge, { backgroundColor: ch.color + '18' }]}>
                        <Text style={[ha.modalBadgeText, { color: ch.color }]}>{ch.emoji} {ch.name}</Text>
                      </View>
                    );
                  })}
                </View>
                <Text style={[ha.modalCombineIntention, { color: subColor }]}>Intencja: {selectedHerb.combineIntention}</Text>
              </View>
            )}

            <Text style={[ha.modalPrepLabel, { color: selectedHerb.color }]}>Przygotowanie:</Text>
            <Text style={[ha.modalPrepText, { color: subColor }]}>{selectedHerb.preparation}</Text>

            <Pressable
              onPress={() => toggleMyHerb(selectedHerb.id)}
              style={[ha.modalMyHerbBtn, {
                backgroundColor: myHerbIds.includes(selectedHerb.id) ? selectedHerb.color + '22' : selectedHerb.color,
              }]}
            >
              {myHerbIds.includes(selectedHerb.id)
                ? <Check color={selectedHerb.color} size={16} strokeWidth={2.5} />
                : <Plus color="#fff" size={16} strokeWidth={2.5} />
              }
              <Text style={[ha.modalMyHerbBtnText, { color: myHerbIds.includes(selectedHerb.id) ? selectedHerb.color : '#fff' }]}>
                {myHerbIds.includes(selectedHerb.id) ? 'W mojej kolekcji' : 'Dodaj do kolekcji'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}
    </View>
  );
};

const ha = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  backBtn: { width: 40 },
  starBtn: { width: 40, alignItems: 'flex-end' },
  headerEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 8 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabLabel: { fontSize: 16, fontWeight: '700' },
  scroll: { padding: 20, paddingTop: 8 },
  sectionEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 12, marginTop: 8 },
  // Moon card
  moonCard: { borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 16, overflow: 'hidden' },
  moonEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  moonPhase: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  moonDesc: { fontSize: 13, lineHeight: 20 },
  moonHerbChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  moonHerbName: { fontSize: 12, fontWeight: '700' },
  // Use chips
  useChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'transparent', marginRight: 8 },
  useChipText: { fontSize: 12, fontWeight: '600' },
  // Herb grid
  herbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  herbCard: { width: (SW - 52) / 2, borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden', minHeight: 200 },
  herbEmoji: { fontSize: 32, marginBottom: 8 },
  herbName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  herbLatin: { fontSize: 10, fontStyle: 'italic', marginBottom: 8 },
  herbPlanetBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 6 },
  herbPlanetText: { fontSize: 10, fontWeight: '700' },
  useTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  useTagText: { fontSize: 10, fontWeight: '600' },
  // My herb button (in grid card)
  myHerbBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, borderWidth: 1, alignSelf: 'flex-start' },
  myHerbBtnText: { fontSize: 10, fontWeight: '700' },
  // Week hero card
  weekHeroCard: { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 16, overflow: 'hidden' },
  weekHeroEmoji: { width: 68, height: 68, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  weekHeroName: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  weekHeroLatin: { fontSize: 11, fontStyle: 'italic', marginBottom: 4 },
  weekHeroBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  weekHeroBadgeText: { fontSize: 10, fontWeight: '700' },
  weekHeroDesc: { fontSize: 14, lineHeight: 22 },
  weekRitualBox: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 14, marginBottom: 10 },
  weekRitualLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  weekRitualText: { fontSize: 13, lineHeight: 20 },
  weekPrepText: { fontSize: 11, fontWeight: '700', fontStyle: 'italic' },
  // Season
  seasonBtn: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 10, alignItems: 'center', gap: 4 },
  seasonLabel: { fontSize: 11, fontWeight: '700' },
  // List herb card
  listHerbCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 10, overflow: 'hidden' },
  listHerbName: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  listHerbDesc: { fontSize: 12, lineHeight: 18 },
  // Phase
  phaseCard: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  harvestPhaseCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  phaseName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  phaseDesc: { fontSize: 12, lineHeight: 18 },
  // Harvest calendar
  harvestCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 14 },
  harvestTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  harvestDesc: { fontSize: 13, lineHeight: 20 },
  // Combinations
  combineIntro: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  comboCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 10, overflow: 'hidden' },
  comboIntention: { fontSize: 15, fontWeight: '700', flex: 1 },
  comboHerbBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  comboHerbBadgeText: { fontSize: 10, fontWeight: '700' },
  comboDesc: { fontSize: 13, lineHeight: 20 },
  // Ritual
  ritualHeroCard: { borderRadius: 22, borderWidth: 1, padding: 20, marginBottom: 16, overflow: 'hidden' },
  ritualEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  ritualHeroTitle: { fontSize: 24, fontWeight: '800', marginBottom: 10 },
  ritualHeroDesc: { fontSize: 14, lineHeight: 22 },
  ritualCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12, overflow: 'hidden' },
  ritualHerbName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  ritualElementBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  ritualElementText: { fontSize: 10, fontWeight: '700' },
  ritualText: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  ritualPrep: { fontSize: 11, fontWeight: '700', fontStyle: 'italic' },
  // Recipe cards
  recipeCard: { borderRadius: 20, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  recipeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  recipeEmojiWrap: { width: 50, height: 50, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  recipeName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  recipeIntention: { fontSize: 12, lineHeight: 17, marginBottom: 6 },
  recipeMoonBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  recipeMoonText: { fontSize: 10, fontWeight: '700' },
  recipeBody: { paddingHorizontal: 16, paddingBottom: 16 },
  recipeDivider: { height: 1, marginBottom: 12 },
  recipeSubLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  ingredientDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  ingredientText: { fontSize: 13, lineHeight: 20, flex: 1 },
  recipeStepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  recipeStepNum: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  recipeStepNumText: { fontSize: 11, fontWeight: '800' },
  recipeStepText: { fontSize: 13, lineHeight: 21, flex: 1 },
  // Meditation
  meditCard: { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 16 },
  meditTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  meditDesc: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  meditSelectLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  meditHerbChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, borderWidth: 1, marginRight: 8 },
  meditHerbChipText: { fontSize: 12, fontWeight: '700' },
  meditAffirmBox: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  meditAffirmLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  meditAffirmText: { fontSize: 13, lineHeight: 21, fontStyle: 'italic' },
  meditTimerBox: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 14, alignItems: 'center' },
  meditStepNum: { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  meditStepTitle: { fontSize: 17, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  meditStepDesc: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 14 },
  meditTimer: { fontSize: 42, fontWeight: '300', letterSpacing: 2, marginBottom: 14 },
  meditProgressBg: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden' },
  meditProgressFill: { height: 4, borderRadius: 2 },
  meditStepPreview: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 10 },
  meditStepPreviewNum: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  meditStepPreviewTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  meditStepPreviewTime: { fontSize: 11, fontWeight: '600' },
  meditBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, paddingVertical: 14, marginTop: 14 },
  meditBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  // My herbs
  myHerbsCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 8 },
  myHerbsHint: { fontSize: 12, lineHeight: 18 },
  myHerbChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  myHerbChipName: { fontSize: 13, fontWeight: '700' },
  myHerbChipSub: { fontSize: 10 },
  myHerbsFullCard: { borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 8 },
  myHerbsFullTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  myHerbsFullDesc: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  myHerbsEmpty: { borderRadius: 14, borderWidth: 1, padding: 18, alignItems: 'center' },
  myHerbsEmptyText: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  myHerbFullRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 8 },
  myHerbFullName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  myHerbFullSub: { fontSize: 11, lineHeight: 16 },
  myHerbRemoveBtn: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  myHerbsCount: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  // Co dalej
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  nextIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nextTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  nextSub: { fontSize: 12, lineHeight: 17 },
  // Empty
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center' },
  // Modal
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end', zIndex: 100 },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, overflow: 'hidden', maxHeight: '92%' },
  modalHerbName: { fontSize: 26, fontWeight: '800', marginBottom: 2 },
  modalLatin: { fontSize: 12, fontStyle: 'italic', marginBottom: 4 },
  modalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  modalBadgeText: { fontSize: 11, fontWeight: '700' },
  modalDesc: { fontSize: 14, lineHeight: 22, marginBottom: 14 },
  modalRitualBox: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  modalRitualLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  modalRitualText: { fontSize: 13, lineHeight: 20 },
  modalCombineBox: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  modalCombineLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  modalCombineIntention: { fontSize: 12, fontStyle: 'italic', marginTop: 8 },
  modalPrepLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  modalPrepText: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
  modalMyHerbBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, paddingVertical: 14 },
  modalMyHerbBtnText: { fontSize: 14, fontWeight: '700' },
});

export default HerbalAlchemyScreen;
