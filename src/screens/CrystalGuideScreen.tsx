// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, View,
  Dimensions, Text, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ChevronLeft, Star, Search, Gem, X, ChevronDown, ChevronRight,
  Layers, Headphones, ArrowRight, Sparkles, Moon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - layout.padding.screen * 2 - 12) / 2;

// ── BACKGROUND ──────────────────────────────────────────────────────────────
const CrystalBg = ({ isLight }: { isLight: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight ? ['#F8F4FF', '#F0EBF8', '#E8E0F5'] : ['#0D0B1E', '#150D2E', '#0A0819']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={700} style={StyleSheet.absoluteFill} opacity={isLight ? 0.10 : 0.14}>
      <G>
        {Array.from({ length: 18 }, (_, i) => (
          <Circle
            key={i}
            cx={(i * 139 + 30) % SW}
            cy={(i * 97 + 60) % 680}
            r={i % 4 === 0 ? 2 : 1}
            fill={i % 3 === 0 ? '#9B59B6' : i % 3 === 1 ? '#F48FB1' : '#D4E6F1'}
            opacity={0.18}
          />
        ))}
        {[80, 200, 340, 480, 600].map((y, i) => (
          <Circle key={'ring' + i} cx={SW / 2} cy={y} r={28 + i * 6}
            stroke="#9B59B6" strokeWidth={0.5} fill="none" opacity={0.12} />
        ))}
      </G>
    </Svg>
  </View>
);

// ── 3D WIDGET ────────────────────────────────────────────────────────────────
const CrystalWidget = React.memo(({ accent }: { accent: string }) => {
  const rot   = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const pulse = useSharedValue(1.0);

  useEffect(() => {
    rot.value   = withRepeat(withTiming(360, { duration: 14000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withSequence(withTiming(1.07, { duration: 2400 }), withTiming(0.95, { duration: 2400 })), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-20, Math.min(20, e.translationY * 0.28));
      tiltY.value = Math.max(-20, Math.min(20, e.translationX * 0.28));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 800 });
      tiltY.value = withTiming(0, { duration: 800 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 540 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }, { scale: pulse.value }],
  }));
  const innerStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot.value}deg` }] }));

  return (
    <View style={{ alignItems: 'center', marginVertical: 16 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={outerStyle}>
          <Animated.View style={innerStyle}>
            <Svg width={180} height={180} viewBox="-90 -90 180 180">
              <Defs>
                <RadialGradient id="cglow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={accent} stopOpacity="0.6" />
                  <Stop offset="100%" stopColor={accent} stopOpacity="0.0" />
                </RadialGradient>
              </Defs>
              <Circle cx={0} cy={0} r={80} fill="url(#cglow)" />
              {[70, 54, 38, 24].map((r, i) => (
                <Circle key={i} cx={0} cy={0} r={r} stroke={accent} strokeWidth={1.5}
                  fill="none" opacity={0.2 + i * 0.08} />
              ))}
              {Array.from({ length: 8 }, (_, i) => {
                const deg = i * 45;
                const rad = deg * Math.PI / 180;
                return (
                  <G key={'spoke' + i}>
                    <Line x1={0} y1={0} x2={70 * Math.cos(rad)} y2={70 * Math.sin(rad)}
                      stroke={accent} strokeWidth={0.8} opacity={0.18} strokeDasharray="3 5" />
                    <Circle cx={70 * Math.cos(rad)} cy={70 * Math.sin(rad)} r={4}
                      fill={accent} opacity={0.75} />
                  </G>
                );
              })}
              {/* Crystal gem shape */}
              <Path d="M0,-28 L14,-8 L8,18 L-8,18 L-14,-8 Z" fill={accent} opacity={0.55} />
              <Path d="M0,-28 L14,-8 L0,-4 Z" fill={accent} opacity={0.35} />
              <Path d="M0,-28 L-14,-8 L0,-4 Z" fill="#fff" opacity={0.12} />
              <Circle cx={0} cy={0} r={7} fill={accent} opacity={0.9} />
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

// ── DATA ─────────────────────────────────────────────────────────────────────
interface Crystal {
  id: string;
  name: string;
  namePl: string;
  color: string;
  category: 'Ochrona' | 'Miłość' | 'Uzdrowienie' | 'Duchowość' | 'Obfitość';
  properties: string[];
  chakra: string;
  element: string;
  zodiac: string[];
  description: string;
  howToUse: string[];
  howToClean: string[];
}

const CRYSTALS: Crystal[] = [
  { id: 'ametyst', name: 'Amethyst', namePl: 'Ametyst', color: '#9B59B6', category: 'Duchowość',
    properties: ['Uspokaja umysł', 'Pogłębia intuicję', 'Ochrona energetyczna', 'Ułatwia medytację', 'Łagodzi stres'],
    chakra: 'Ajna (Trzecie Oko)', element: 'Powietrze', zodiac: ['Ryby', 'Wodnik', 'Strzelec'],
    description: 'Ametyst to kamień duchowego przebudzenia i wewnętrznego spokoju. Jego fioletowy blask koi napięcia dnia codziennego i otwiera wrota wyższej świadomości. Od wieków służy jako ochroniarz przed negatywną energią i kamienny towarzysz medytacji.',
    howToUse: ['Połóż na czole podczas medytacji, by pogłębić skupienie.', 'Noś jako wisiorek blisko serca w trudnych dniach.', 'Umieść w sypialni na nocnym stoliku, by chronić sen.'],
    howToClean: ['Wystaw na światło księżyca w nów lub pełnię przez całą noc.', 'Okadzaj szałwią lub palo santo przez 30 sekund.'] },
  { id: 'rozowy_kwarc', name: 'Rose Quartz', namePl: 'Różowy Kwarc', color: '#F48FB1', category: 'Miłość',
    properties: ['Przyciąga miłość', 'Uzdrawia serce', 'Buduje miłość własną', 'Łagodzi żal', 'Harmonizuje relacje'],
    chakra: 'Anahata (Serce)', element: 'Woda', zodiac: ['Byk', 'Waga', 'Rak'],
    description: 'Różowy Kwarc to kamień bezwarunkowej miłości — do siebie i innych. Jego delikatne wibracje otwierają czakrę serca, pomagając uwolnić stare rany emocjonalne i na nowo przyjąć miłość z otwartością. Idealny towarzysz w procesie przebaczania.',
    howToUse: ['Trzymaj w dłoniach podczas afirmacji miłości własnej.', 'Połóż na klatce piersiowej podczas głębokiego oddechu.', 'Umieść w salonie, by promować harmonię domową.'],
    howToClean: ['Zakop na godzinę w ziemi, by odnowić energię.', 'Przepłucz pod bieżącą wodą z intencją oczyszczenia.'] },
  { id: 'obsydian', name: 'Obsidian', namePl: 'Obsydian', color: '#2C2C2C', category: 'Ochrona',
    properties: ['Ochrona energetyczna', 'Uziemienie', 'Ujawnia prawdę', 'Usuwa bloki', 'Oczyszcza aurorę'],
    chakra: 'Muladhara (Podstawa)', element: 'Ziemia/Ogień', zodiac: ['Skorpion', 'Koziorożec', 'Strzelec'],
    description: 'Obsydian powstał z żywego ognia wulkanu — jest kamieniem potężnej ochrony i surowej prawdy. Tnie przez iluzje i energetyczne więzy jak czarne lustro. Nosi w sobie ziemską moc i ogień przemiany jednocześnie.',
    howToUse: ['Trzymaj w lewej dłoni, by absorbował negatywną energię otoczenia.', 'Umieść przy wejściu do domu jako tarczę ochronną.', 'Użyj podczas pracy z cieniem jako zwierciadło wewnętrzne.'],
    howToClean: ['Wyczyść głosem — zaśpiewaj lub użyj miseczki tybetańskiej.', 'Okadzaj dymem szałwii przez 60 sekund z intencją.'] },
  { id: 'kryształ', name: 'Clear Quartz', namePl: 'Kryształ Górski', color: '#E8E8E8', category: 'Duchowość',
    properties: ['Wzmacnia inne kryształy', 'Jasność umysłu', 'Uzdrowienie wielopoziomowe', 'Amplifikacja intencji', 'Harmonia energetyczna'],
    chakra: 'Wszystkie czakry', element: 'Wszystkie żywioły', zodiac: ['Wszystkie znaki'],
    description: 'Kryształ Górski to mistrz wśród kamieni — jego przejrzystość symbolizuje czystość intencji i nieskończone możliwości. Wzmacnia energię każdego kryształu, z którym się styka, i jest najpotężniejszym narzędziem programowania zamiarów.',
    howToUse: ['Umieść pośrodku kryształowej siatki, by wzmocnić jej moc.', 'Trzymaj w dłoniach i wizualizuj swój cel w czystej formie.', 'Połóż na notesie z intencjami, by energetycznie je pieczętować.'],
    howToClean: ['Wyczyść innym kryształem selenitu lub citonitem.', 'Wystaw na bezpośrednie światło słoneczne na godzinę (nie za długo).'] },
  { id: 'tygrysie_oko', name: "Tiger's Eye", namePl: 'Tygrysie Oko', color: '#C68642', category: 'Obfitość',
    properties: ['Odwaga i pewność siebie', 'Wzmacnia wolę', 'Przyciąga obfitość', 'Ochrona w podróży', 'Klarowność decyzji'],
    chakra: 'Manipura (Splot Słoneczny)', element: 'Ogień/Ziemia', zodiac: ['Byk', 'Lew', 'Koziorożec'],
    description: 'Tygrysie Oko emanuje mocą kota o złotym spojrzeniu — odwagą, skupieniem i wewnętrzną siłą. Ten mienący się kamień wspiera podejmowanie odważnych decyzji i ruszanie naprzód mimo lęku. Ciągnie energię obfitości z głębi ziemi.',
    howToUse: ['Noś w kieszeni podczas ważnych spotkań lub prezentacji.', 'Trzymaj w dłoni przed trudną rozmową, by poczuć siłę.', 'Połóż na biurku, by utrzymać skupienie i produktywność.'],
    howToClean: ['Zakop w brązowym ryżu na noc — ryż absorbuje negatywną energię.', 'Okadzaj dymem cedrowego drewna.'] },
  { id: 'lapis', name: 'Lapis Lazuli', namePl: 'Lapis Lazuli', color: '#26619C', category: 'Duchowość',
    properties: ['Mądrość i prawda', 'Otwiera komunikację', 'Wzmacnia intuicję', 'Połączenie z wyższym ja', 'Pewność siebie w mówieniu'],
    chakra: 'Vishuddha (Gardło)', element: 'Woda', zodiac: ['Strzelec', 'Koziorożec', 'Waga'],
    description: 'Lapis Lazuli — kamień faraonów i filozofów — przenosi mądrość wieków. Jego głęboki niebieski kolor z złotymi iskrami pirytu to obraz nieba pełnego gwiazd. Otwiera gardło na autentyczny wyraz prawdy i łączy z kosmiczną mądrością.',
    howToUse: ['Trzymaj przy gardle podczas afirmacji głosowych lub śpiewu.', 'Umieść na biurku pisarza, mówcy lub terapeuty.', 'Medytuj z nim trzymanym na trzecim oku, by pogłębić intuicję.'],
    howToClean: ['Wyczyść przy świetle srebrnej świecy z intencją.', 'Owiń w jedwab i zostaw w spokojnym miejscu przez noc.'] },
  { id: 'cytryn', name: 'Citrine', namePl: 'Cytryn', color: '#F9A825', category: 'Obfitość',
    properties: ['Przyciąga obfitość', 'Radość i energia', 'Kreatywność', 'Samoakceptacja', 'Ładuje energetycznie'],
    chakra: 'Manipura (Splot Słoneczny)', element: 'Ogień', zodiac: ['Lew', 'Bliźnięta', 'Panna'],
    description: 'Cytryn to słoneczny kamień dobrobytu — jeden z niewielu kryształów, który nigdy nie przechowuje negatywnej energii. Promieniuje ciepłem, kreatywnością i radością życia. Znany jako "kamień kupca" od wieków przyciąga obfitość i szczęście.',
    howToUse: ['Umieść w portfelu lub kasie, by przyciągać dobrobyt.', 'Trzymaj w dłoni podczas twórczej pracy lub pisania.', 'Połóż przy oknie wychodzącym na wschód, by łapał poranne słońce.'],
    howToClean: ['Cytryn oczyszcza się sam — jednak raz w miesiącu wystaw go na słońce.', 'Przejedź delikatnie strusim piórem, by zdjąć stałą energię.'] },
  { id: 'malachit', name: 'Malachite', namePl: 'Malachit', color: '#27AE60', category: 'Uzdrowienie',
    properties: ['Transformacja i zmiana', 'Uzdrowienie serca', 'Połączenie z naturą', 'Ochrona w podróży', 'Absorpcja bólu'],
    chakra: 'Anahata (Serce)', element: 'Ziemia', zodiac: ['Byk', 'Koziorożec', 'Skorpion'],
    description: 'Malachit to kamień transformacji — jego zielone, koncentryczne wzory odzwierciedlają ścieżki zmiany, jakie wyrywa w ludzkim życiu. Absorbuje negatywne energie z otoczenia i ciała, wspierając uzdrowienie na głębokim poziomie. Wymaga regularnego czyszczenia.',
    howToUse: ['Połóż na miejscu bólu fizycznego i wizualizuj zieloną energię uzdrowienia.', 'Umieść przy roślinie, by wzmocnić jej energię wzrostu.', 'Trzymaj podczas zmiany pracy lub przeprowadzki, by ułatwić transformację.'],
    howToClean: ['NIGDY nie czyść wodą — malachit zawiera miedź. Używaj dźwięku lub dymu.', 'Okadzaj białą szałwią lub palo santo przez 45 sekund.'] },
  { id: 'labradoryt', name: 'Labradorite', namePl: 'Labradoryt', color: '#4A90D9', category: 'Duchowość',
    properties: ['Magia i transformacja', 'Pogłębia intuicję', 'Ochrona w pracy duchowej', 'Synchroniczności', 'Widzenie aury'],
    chakra: 'Ajna i Korona', element: 'Powietrze', zodiac: ['Lew', 'Strzelec', 'Wodnik'],
    description: 'Labradoryt migocze tęczowymi refleksami — jakby uwięził nordyjską zorzę polarną w kamieniu. To kamień magii i misteriów, który ujawnia ukryte prawdy i wzmacnia intuicję. Tworzy energetyczną tarczę podczas pracy duchowej.',
    howToUse: ['Trzymaj przy sobie podczas czytania kart lub wróżenia.', 'Połóż na stole ołtarzowym podczas pracy z energią.', 'Noś jako amulet ochronny podczas trudnych spotkań.'],
    howToClean: ['Wystawiaj na światło księżyca pełni raz w miesiącu.', 'Zakop w ziemi ogrodowej na dobę podczas wiosennej przemiany.'] },
  { id: 'hematyt', name: 'Hematite', namePl: 'Hematyt', color: '#424242', category: 'Ochrona',
    properties: ['Uziemienie i równowaga', 'Wzmacnia skupienie', 'Buduje siłę', 'Odprowadza nadmiar energii', 'Stabilność emocjonalna'],
    chakra: 'Muladhara (Podstawa)', element: 'Ziemia', zodiac: ['Baran', 'Wodnik', 'Panna'],
    description: 'Hematyt to żelazny kamień ziemi — ciężki, błyszczący i absolutnie uziemiający. Gdy świat kręci się za szybko, hematyt przywraca nogi na ziemię i umysł do chwili obecnej. Jest lustrem — dosłownie odbija energię.',
    howToUse: ['Trzymaj oboma dłońmi, by poczuć uziemienie podczas ataku lęku.', 'Połóż przy stopach podczas medytacji dla głębszego uziemienia.', 'Noś jako bransoletę po lewej stronie, by odprowadzać napięcia.'],
    howToClean: ['Połóż na surowym selenicie na kilka godzin.', 'Wyczyść dymem szałwii podczas nowego księżyca.'] },
  { id: 'moonstone', name: 'Moonstone', namePl: 'Kamień Księżycowy', color: '#D4E6F1', category: 'Miłość',
    properties: ['Intuicja i kobiecość', 'Nowe początki', 'Cykl i rytm', 'Równowaga emocjonalna', 'Mistyczne wizje'],
    chakra: 'Sahasrara i Svadhisthana', element: 'Woda', zodiac: ['Rak', 'Waga', 'Ryby'],
    description: 'Kamień Księżycowy nosi w sobie blask nocy i mistykę wody. Rezonuje z kobiecą energią cyklu i jest kamieniem nowych początków. Wspomaga intuicję, przynosi spokój emocjonalny i otwiera na mistyczne aspekty rzeczywistości.',
    howToUse: ['Medytuj z nim w pełnię księżyca, trzymając go w dłoniach.', 'Połóż pod poduszką w nów, by zaprogramować intencje nowego cyklu.', 'Noś podczas przełomów życiowych jako symbol transformacji.'],
    howToClean: ['Wystawiaj na księżyc pełni przez całą noc — to jego żywioł.', 'Okadzaj dymem lawendy lub różanego kadzidła.'] },
  { id: 'czarny_turmalin', name: 'Black Tourmaline', namePl: 'Czarny Turmalin', color: '#1A1A1A', category: 'Ochrona',
    properties: ['Tarcza przed EMF', 'Najsilniejsza ochrona', 'Uziemienie', 'Odbija negatywność', 'Oczyszcza przestrzeń'],
    chakra: 'Muladhara (Podstawa)', element: 'Ziemia', zodiac: ['Koziorożec', 'Baran', 'Strzelec'],
    description: 'Czarny Turmalin to jeden z najpotężniejszych kamieni ochronnych na Ziemi. Tworzy nieprzenikniony energetyczny mur wokół noszącego, pochłania promieniowanie elektromagnetyczne i odsyła złe intencje nadawcy. To kamień, który trzeba mieć w domu.',
    howToUse: ['Umieść w czterech rogach domu lub pokoju jako ochronną siatkę.', 'Połóż obok routera Wi-Fi lub komputera, by absorbował EMF.', 'Noś w kieszeni, wchodząc do tłumów lub trudnych środowisk.'],
    howToClean: ['Zakop w ziemi na dobę podczas nowiu księżyca.', 'Puść dźwięk miseczki tybetańskiej tuż nad kamieniem przez 3 minuty.'] },
  { id: 'szmaragd', name: 'Emerald', namePl: 'Szmaragd', color: '#1D8A50', category: 'Miłość',
    properties: ['Miłość i lojalność', 'Dobrobyt i szczęście', 'Mądrość serca', 'Uzdrowienie relacji', 'Płodność i wzrost'],
    chakra: 'Anahata (Serce)', element: 'Ziemia', zodiac: ['Byk', 'Bliźnięta', 'Rak'],
    description: 'Szmaragd — kamień Wenus — to symbol miłości w jej najdojrzalszej formie: lojalnej, mądrej i pielęgnowanej. Od czasów Kleopatry był symbolem życia i wiecznej młodości. Otwiera serce na miłość, która buduje, nie niszczy.',
    howToUse: ['Trzymaj podczas medytacji nad relacją, którą chcesz uzdrowić.', 'Noś na sercu, gdy chcesz przyciągnąć głęboką miłość.', 'Umieść w sypialni jako kamień harmonii związku.'],
    howToClean: ['Czyść delikatnie pod letnią wodą (nie gorącą) z intencją.', 'Wystawiaj na rosa poranna w cieniu (nie na pełne słońce).'] },
  { id: 'rubin', name: 'Ruby', namePl: 'Rubin', color: '#C0392B', category: 'Miłość',
    properties: ['Pasja i żywotność', 'Odwaga serca', 'Siła życiowa', 'Miłość namiętnościowa', 'Ochrona i dobrobyt'],
    chakra: 'Muladhara i Anahata', element: 'Ogień', zodiac: ['Baran', 'Rak', 'Lew'],
    description: 'Rubin płonie wewnętrznym ogniem — to kamień pasji, namiętności i bezkompromisowej siły życiowej. Wzmacnia odwagę i wolę działania. Od wieków nosili go wojownicy i zakochani, bo rubin chroni i rozpala jednocześnie.',
    howToUse: ['Trzymaj w prawej dłoni, gdy potrzebujesz odwagi do działania.', 'Noś przy sobie podczas pracy twórczej, by rozpalić pasję.', 'Medytuj z rubinem na czakrze podstawy dla wzmocnienia energii życiowej.'],
    howToClean: ['Okadzaj dymem franszpanu lub mirry — jego żywioł to ogień.', 'Wystawiaj na poranne słońce przez 15 minut.'] },
  { id: 'szafir', name: 'Sapphire', namePl: 'Szafir', color: '#2471A3', category: 'Duchowość',
    properties: ['Mądrość i lojalność', 'Prawda i uczzciwość', 'Połączenie z wyższą wiedzą', 'Spokój umysłu', 'Intuicja'],
    chakra: 'Vishuddha i Ajna', element: 'Powietrze', zodiac: ['Panna', 'Koziorożec', 'Strzelec'],
    description: 'Szafir — kamień nieba — jest symbolem mądrości i duchowej dyscypliny. Noszony przez królów i kapłanów, by chronić przed zdradą i naprowadzać na właściwą ścieżkę. Uspokaja myśli i otwiera na głębokie prawdy duszy.',
    howToUse: ['Medytuj z szafirem na trzecim oku, by pogłębić medytację.', 'Trzymaj podczas nauki lub badań naukowych.', 'Noś jako talizman prawdy w relacjach i pracy.'],
    howToClean: ['Czyść dźwiękiem — strojnik do kamień A lub misa kryształowa.', 'Wystaw na blask pełni pod czystym niebem.'] },
  { id: 'topaz', name: 'Topaz', namePl: 'Topaz', color: '#F39C12', category: 'Obfitość',
    properties: ['Manifestacja i obfitość', 'Radość i optymizm', 'Moc intencji', 'Pewność siebie', 'Dobrobyt'],
    chakra: 'Manipura (Splot Słoneczny)', element: 'Ogień', zodiac: ['Lew', 'Strzelec', 'Bliźnięta'],
    description: 'Topaz to słoneczny kamień manifestacji — ognisty posłaniec Wszechświata, który przyspiesza realizację zamierzeń. Promieniuje optymizmem i pewną siebie energią, która otwiera drzwi do obfitości we wszystkich formach.',
    howToUse: ['Trzymaj podczas wizualizacji i afirmacji dobrobytu.', 'Umieść na liście życzeniowej lub tablicy marzeń.', 'Noś przy sobie w dniu ważnych negocjacji lub rozmów o pieniądzach.'],
    howToClean: ['Wystawiaj na słońce poranne przez 20 minut.', 'Przemyj soloną wodą (1 łyżeczka soli morskiej w szklance wody).'] },
  { id: 'onyks', name: 'Onyx', namePl: 'Onyks', color: '#1C1C1C', category: 'Ochrona',
    properties: ['Siła i wytrzymałość', 'Skupienie i dyscyplina', 'Ochrona przed złym okiem', 'Pewność siebie', 'Uziemienie'],
    chakra: 'Muladhara (Podstawa)', element: 'Ziemia', zodiac: ['Lew', 'Koziorożec', 'Panna'],
    description: 'Onyks to kamień wojownika ducha — ciemny, mocny i skupiony jak czerń nocy przed bitwą. Buduje wewnętrzną siłę, by stawić czoła wyzwaniom, i chroni przed manipulacją i złą energią. To kamień dyscypliny i wytrwałości.',
    howToUse: ['Noś podczas trudnych egzaminów lub wyzwań wymagających skupienia.', 'Trzymaj w dłoni podczas ćwiczeń fizycznych, by wzmocnić determinację.', 'Umieść w przestrzeni pracy, by odpędzić rozproszenie.'],
    howToClean: ['Okadzaj cedrowym lub sandałowym dymem.', 'Połóż na kamiennej płycie podczas nowiu, by się zregenerował.'] },
  { id: 'selenit', name: 'Selenite', namePl: 'Selenit', color: '#F5F5DC', category: 'Uzdrowienie',
    properties: ['Głębokie oczyszczenie', 'Spokój i cisza', 'Połączenie z anielami', 'Czyści inne kryształy', 'Dostęp do wyższego ja'],
    chakra: 'Sahasrara (Korona)', element: 'Powietrze', zodiac: ['Rak', 'Byk', 'Ryby'],
    description: 'Selenit to brama do świata anielskiego — czysta jak śnieg, spokojna jak ciche niebo. Jeden z niewielu kamieni, który oczyszcza inne kryształy. Jego energia jest tak czysta, że samo trzymanie go wycisza myśli i przynosi natychmiastowy spokój.',
    howToUse: ['Połóż inne kryształy na selenitowej płycie przez noc, by je naładować.', 'Przesuń różdżkę selenitu wzdłuż ciała, by oczyścić aurę.', 'Trzymaj w dłoniach przed snem, by wyciszyć umysł.'],
    howToClean: ['Selenit czyści się sam — nigdy nie czyść wodą, rozpuszcza się!', 'Wystawiaj na delikatne białe światło lub dźwięk gongu.'] },
  { id: 'rodochrozyt', name: 'Rhodochrosite', namePl: 'Rodochrozyt', color: '#E8808A', category: 'Miłość',
    properties: ['Miłość własna', 'Uzdrowienie emocjonalne', 'Terapia dziecięcych ran', 'Radość i spontaniczność', 'Compassion'],
    chakra: 'Anahata (Serce)', element: 'Ogień', zodiac: ['Lew', 'Skorpion', 'Waga'],
    description: 'Rodochrozyt to kamień serdecznej miłości własnej, który sięga do najgłębszych warstw emocjonalnych zranień z dzieciństwa. Uczy, że zasługujesz na miłość bez warunków. Jego różowo-biały wzór to obraz złożoności serca ludzkiego.',
    howToUse: ['Trzymaj nad sercem podczas terapii lub coachingu emocjonalnego.', 'Medytuj z nim podczas pracy z wewnętrznym dzieckiem.', 'Noś, gdy przechodzisz przez proces żałoby lub rozstania.'],
    howToClean: ['Okadzaj różanym kadzidłem lub dymem lawendy.', 'Połóż na miękkim jedwabiu podczas pełni księżyca.'] },
  { id: 'fluoryt', name: 'Fluorite', namePl: 'Fluoryt', color: '#7FB3D3', category: 'Uzdrowienie',
    properties: ['Klarowność umysłu', 'Skupienie i koncentracja', 'Ochrona mentalna', 'Porządkuje myśli', 'Nauka i rozumienie'],
    chakra: 'Ajna (Trzecie Oko)', element: 'Powietrze', zodiac: ['Panna', 'Bliźnięta', 'Koziorożec'],
    description: 'Fluoryt to umysłowy porządkujący — oczyszcza mgłę myśli i przynosi krystaliczną jasność. W psychologii energetycznej to kamień uczniów, analityków i artystów, którym rozproszenie jest wrogiem. Wiele kolorów fluoritu — wiele aspektów umysłu.',
    howToUse: ['Trzymaj na biurku podczas nauki lub głębokiej pracy intelektualnej.', 'Połóż na serwerze lub komputerze, by mentalne wibracje były jasne.', 'Medytuj z nim, gdy czujesz chaos emocjonalny lub decyzyjny.'],
    howToClean: ['Delikatnie przemyj pod letnią wodą przez 20 sekund.', 'Okadzaj dymem szałwii lub palo santo.'] },
  { id: 'angelit', name: 'Angelite', namePl: 'Angelit', color: '#AED6F1', category: 'Duchowość',
    properties: ['Połączenie z aniołami', 'Wewnętrzny spokój', 'Komunikacja duchowa', 'Świadoma komunikacja', 'Uzdrowienie dźwiękiem'],
    chakra: 'Vishuddha (Gardło) i Korona', element: 'Powietrze', zodiac: ['Ryby', 'Wodnik', 'Koziorożec'],
    description: 'Angelit to kamień spokoju anielskiego — delikatnie niebieski jak letnie niebo — otwierający kanały komunikacji z wyższymi istotami i własną duszą. Przynosi ciszę w tumulcie i pomaga przekazywać prawdę z łagodnością i miłością.',
    howToUse: ['Trzymaj podczas modlitwy lub komunikacji z wyższą mocą.', 'Połóż na gardle podczas wokalizacji lub ekspresji twórczej.', 'Medytuj z nim przy głowie, by pogłębić senność i kontakt z przewodnikami.'],
    howToClean: ['NIGDY nie czyść wodą — angelit jest kruchy i wrażliwy na wilgoć.', 'Okadzaj dymem frankincense lub lawendy.'] },
  { id: 'akwamaryn', name: 'Aquamarine', namePl: 'Akwamaryn', color: '#7EC8E3', category: 'Uzdrowienie',
    properties: ['Odwaga i klarowność', 'Łagodzące emocje', 'Komunikacja serca', 'Głęboki spokój', 'Morska energia'],
    chakra: 'Vishuddha (Gardło)', element: 'Woda', zodiac: ['Bliźnięta', 'Ryby', 'Baran'],
    description: 'Akwamaryn niesie w sobie spokój głębokiego oceanu i odwagę marynarzy, którzy ufali jego ochronie. To kamień prawdziwej komunikacji — nie tylko słów, ale i serca. Łagodzi lęk i wnosi chłodne uzdrowienie do gorących emocji.',
    howToUse: ['Trzymaj przy sobie przed trudną rozmową wymagającą odwagi.', 'Umieść w łazience lub przy wannie, by wzmocnić wodny element.', 'Medytuj z nim trzymanym przy sercu podczas pracy z lękiem.'],
    howToClean: ['Przemyj pod delikatną bieżącą wodą z intencją.', 'Wystawiaj na blask pełni księżyca blisko zbiornika z wodą.'] },
  { id: 'piryt', name: 'Pyrite', namePl: 'Piryt', color: '#C8A951', category: 'Obfitość',
    properties: ['Bogactwo i dobrobyt', 'Pewność siebie', 'Manifestacja finansowa', 'Ochrona energetyczna', 'Działanie i inicjatywa'],
    chakra: 'Manipura (Splot Słoneczny)', element: 'Ogień/Ziemia', zodiac: ['Lew', 'Byk', 'Koziorożec'],
    description: 'Piryt — "złoto głupca" — mieni się jak prawdziwe złoto i przyciąga energię dobrobytu z nie mniejszą siłą. To kamień działania i inicjatywy finansowej. Wzmacnia przekonanie, że zasługujesz na obfitość i masz siłę ją tworzyć.',
    howToUse: ['Umieść w północno-zachodnim rogu domu lub biura (strefa bogactwa w Feng Shui).', 'Trzymaj w portfelu razem z banknotem, który "sieje" obfitość.', 'Połóż na kontrakcie lub umowie przed podpisaniem.'],
    howToClean: ['Okadzaj cedrowym dymem lub anyżowym kadzidłem.', 'Wystawiaj na poranne słońce przez 15–20 minut.'] },
  { id: 'karneol', name: 'Carnelian', namePl: 'Karneol', color: '#E74C3C', category: 'Uzdrowienie',
    properties: ['Kreatywność i witalność', 'Motywacja i inicjatywa', 'Siła życiowa', 'Odwaga działania', 'Pokonywanie blokad'],
    chakra: 'Svadhisthana (Sakralna)', element: 'Ogień', zodiac: ['Baran', 'Bliźnięta', 'Panna'],
    description: 'Karneol to kamień twórczego ognia — pomarańczowo-czerwony jak zachód słońca, pełen energii i ruchu. Pobudza wyobraźnię, wzmacnia wolę działania i przełamuje blokady twórcze. Idealny towarzysz artystów, przedsiębiorców i poszukiwaczy przygód.',
    howToUse: ['Trzymaj w prawej dłoni podczas twórczej pracy lub brainstormingu.', 'Noś przy brzuchu lub biodrach, by aktywować czakrę sakralną.', 'Połóż na notatniku z pomysłami, by rozpalić kreatywność.'],
    howToClean: ['Okadzaj dymem pomarańczowej lub cytrynowej skórki.', 'Wystawiaj na poranne słońce przez 20 minut.'] },
];

const CATEGORIES = ['Wszystkie', 'Ochrona', 'Miłość', 'Uzdrowienie', 'Duchowość', 'Obfitość'] as const;
type Category = typeof CATEGORIES[number];

const CAT_COLORS: Record<string, string> = {
  Wszystkie: '#9B59B6',
  Ochrona: '#555',
  Miłość: '#F48FB1',
  Uzdrowienie: '#27AE60',
  Duchowość: '#9B59B6',
  Obfitość: '#F9A825',
};

const ZODIAC_CRYSTALS: Record<string, string[]> = {
  Baran: ['rubin', 'karneol', 'hematyt'],
  Byk: ['szmaragd', 'rozowy_kwarc', 'malachit'],
  Bliźnięta: ['akwamaryn', 'cytryn', 'fluoryt'],
  Rak: ['moonstone', 'rozowy_kwarc', 'selenit'],
  Lew: ['cytryn', 'tygrysie_oko', 'rubin'],
  Panna: ['ametyst', 'hematyt', 'fluoryt'],
  Waga: ['lapis', 'rozowy_kwarc', 'labradoryt'],
  Skorpion: ['obsydian', 'ametyst', 'czarny_turmalin'],
  Strzelec: ['tygrysie_oko', 'topaz', 'labradoryt'],
  Koziorożec: ['hematyt', 'onyks', 'piryt'],
  Wodnik: ['angelit', 'labradoryt', 'ametyst'],
  Ryby: ['ametyst', 'akwamaryn', 'moonstone'],
};

const CARE_SECTIONS = [
  {
    id: 'cleanse',
    title: 'Oczyszczanie kryształów',
    icon: '🌕',
    content: [
      'Światło Księżyca: Wystawiaj kryształy na blasku pełni przez całą noc — najdelikatniejsza metoda dla wszystkich kamieni.',
      'Szałwia i Palo Santo: Okadzaj dymem przez 30–60 sekund z intencją oczyszczenia.',
      'Bieżąca woda: Trzymaj pod strumieniem wody przez 60 sekund (nie wszystkie kryształy lubią wodę — sprawdź karty).',
      'Ziemia: Zakop w ziemi lub brązowym ryżu na 12–24 godziny — doskonałe dla kamieni ochronnych.',
    ],
  },
  {
    id: 'program',
    title: 'Programowanie intencji',
    icon: '✨',
    content: [
      'Oczyść kryształ przed programowaniem — nowy kamień może nieść czyjeś wcześniejsze energie.',
      'Trzymaj kamień w dłoniach, zamknij oczy i skup się na jednej, jasno sformułowanej intencji.',
      'Wypowiedz intencję na głos 3 razy lub wdychaj ją w kamień przez 3 powolne oddechy.',
      'Dziękuj kryształowi za jego wsparcie i trzymaj go w pobliżu lub noś przy sobie.',
    ],
  },
  {
    id: 'store',
    title: 'Przechowywanie kryształów',
    icon: '🪨',
    content: [
      'Twardsze kryształy mogą zarysować miększe — przechowuj osobno lub w miękkich woreczkach.',
      'Unikaj bezpośredniego długotrwałego słońca — może wyblaknąć kolor ametystu, różowego kwarcu i cytrinu.',
      'Selenitowa płyta lub miseczka to idealny dom dla kolekcji — oczyszcza i ładuje sąsiednie kamienie.',
      'Kryształy intencyjne (te, z którymi pracujesz) trzymaj w widocznym miejscu lub przy ołtarzu.',
    ],
  },
];

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function CrystalGuideScreen({ navigation }: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { isLight } = useTheme();
  const textColor  = isLight ? '#1A0A2E' : '#F0EBF8';
  const subColor   = isLight ? 'rgba(26,10,46,0.55)' : 'rgba(240,235,248,0.55)';
  const cardBg     = isLight ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(155,89,182,0.18)' : 'rgba(155,89,182,0.22)';
  const ACCENT     = '#9B59B6';

  const [search, setSearch]             = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Wszystkie');
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiResult, setAiResult]         = useState('');
  const [modalAiText, setModalAiText]   = useState('');
  const [modalAiLoading, setModalAiLoading] = useState(false);
  const [openCare, setOpenCare]         = useState<string | null>(null);

  const zodiacSign = userData?.zodiacSign || 'Ryby';
  const zodiacKey  = zodiacSign.charAt(0).toUpperCase() + zodiacSign.slice(1).toLowerCase();
  const myCrystalIds = ZODIAC_CRYSTALS[zodiacKey] || ZODIAC_CRYSTALS['Ryby'];
  const myCrystals   = myCrystalIds.map(id => CRYSTALS.find(c => c.id === id)).filter(Boolean) as Crystal[];

  const filtered = CRYSTALS.filter(c => {
    const matchCat = activeCategory === 'Wszystkie' || c.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || c.namePl.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.properties.some(p => p.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const isFav = isFavoriteItem('crystal-guide');

  const handleStar = useCallback(() => {
    HapticsService.impact('medium');
    if (isFav) {
      removeFavoriteItem('crystal-guide');
    } else {
      addFavoriteItem({ id: 'crystal-guide', label: 'Przewodnik Kryształów', icon: 'Gem', color: ACCENT, route: 'CrystalGuide', addedAt: Date.now() });
    }
  }, [isFav, addFavoriteItem, removeFavoriteItem]);

  const handleAiReading = useCallback(async () => {
    HapticsService.impact('medium');
    setAiLoading(true);
    setAiResult('');
    try {
      const sign = zodiacKey;
      const archetype = userData?.archetype || 'Poszukiwacz';
      const messages = [
        {
          role: 'user' as const,
          content: `Jestem ${sign}, mój archetyp to ${archetype}. Faza księżyca: Pełnia. Mój obecny stan emocjonalny: Transformacja. Na podstawie tych informacji, wskaż mi 3 kryształy, które najlepiej wesprzą mnie w tym czasie. Dla każdego podaj: nazwę, konkretne wskazówki do użycia teraz (1-2 zdania). Na końcu dodaj krótką sugestię jak ułożyć je razem lub gdzie je umieścić. Odpowiedz w języku użytkownika, duchowo ale konkretnie.`,
        },
      ];
      const resp = await AiService.chatWithOracle(messages);
      setAiResult(resp || 'Brak odpowiedzi od Oracle.');
    } catch (e) {
      setAiResult('Oracle jest chwilowo niedostępny. Spróbuj ponownie za chwilę.');
    } finally {
      setAiLoading(false);
    }
  }, [zodiacKey, userData]);

  const handleModalAi = useCallback(async (crystal: Crystal) => {
    HapticsService.impact('light');
    setModalAiLoading(true);
    setModalAiText('');
    try {
      const messages = [
        {
          role: 'user' as const,
          content: `Jestem ${zodiacKey}. Chcę pracować z kryształem: ${crystal.namePl} (${crystal.name}). Jego energia: ${crystal.properties.join(', ')}. Daj mi spersonalizowaną wskazówkę jak ten kryształ może mi pomóc teraz — odczyt duchowy 3-4 zdania, intencja do wypowiedzenia przy nim, i jeden konkretny rytuał do wykonania dziś. Odpowiedz w języku użytkownika.`,
        },
      ];
      const resp = await AiService.chatWithOracle(messages);
      setModalAiText(resp || 'Brak odpowiedzi.');
    } catch {
      setModalAiText('Oracle jest chwilowo niedostępny.');
    } finally {
      setModalAiLoading(false);
    }
  }, [zodiacKey]);

  // ── CRYSTAL CARD ──────────────────────────────────────────────────────────
  const renderCrystalCard = useCallback(({ crystal, index }: { crystal: Crystal; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 35).duration(360)}>
      <Pressable
        onPress={() => { HapticsService.impact('light'); setSelectedCrystal(crystal); setModalAiText(''); }}
        style={[styles.crystalCard, { backgroundColor: cardBg, borderColor: cardBorder, borderLeftColor: crystal.color, width: CARD_W }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={[styles.colorDot, { backgroundColor: crystal.color }]} />
          <Text style={[styles.crystalName, { color: textColor }]}>{crystal.namePl}</Text>
        </View>
        <Text style={[styles.crystalEnName, { color: subColor }]}>{crystal.name}</Text>
        <View style={[styles.catTag, { backgroundColor: CAT_COLORS[crystal.category] + '22', borderColor: CAT_COLORS[crystal.category] + '55' }]}>
          <Text style={[styles.catTagText, { color: CAT_COLORS[crystal.category] }]}>{crystal.category}</Text>
        </View>
        <Text style={[styles.crystalProp, { color: subColor }]} numberOfLines={2}>{crystal.properties[0]}</Text>
      </Pressable>
    </Animated.View>
  ), [cardBg, cardBorder, textColor, subColor]);

  // ── DETAIL MODAL ──────────────────────────────────────────────────────────
  const renderModal = () => {
    if (!selectedCrystal) return null;
    const c = selectedCrystal;
    return (
      <Modal visible animationType="slide" transparent onRequestClose={() => setSelectedCrystal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isLight ? '#F8F4FF' : '#160D2A' }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={[styles.crystalCircle, { backgroundColor: c.color + '30', borderColor: c.color }]}>
                  <View style={[styles.crystalCircleInner, { backgroundColor: c.color }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>{c.namePl}</Text>
                  <Text style={[styles.modalSubtitle, { color: subColor }]}>{c.name}</Text>
                  <View style={[styles.catTag, { backgroundColor: CAT_COLORS[c.category] + '22', borderColor: CAT_COLORS[c.category] + '55', alignSelf: 'flex-start', marginTop: 4 }]}>
                    <Text style={[styles.catTagText, { color: CAT_COLORS[c.category] }]}>{c.category}</Text>
                  </View>
                </View>
                <Pressable onPress={() => setSelectedCrystal(null)} style={styles.closeBtn}>
                  <X size={20} color={subColor} />
                </Pressable>
              </View>

              {/* Description */}
              <Text style={[styles.modalDesc, { color: textColor }]}>{c.description}</Text>

              {/* Badges */}
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: c.color + '22', borderColor: c.color + '55' }]}>
                  <Text style={[styles.badgeText, { color: c.color }]}>⚡ {c.chakra}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.badgeText, { color: textColor }]}>🌿 {c.element}</Text>
                </View>
              </View>
              <View style={styles.badgeRow}>
                {c.zodiac.map(z => (
                  <View key={z} style={[styles.badge, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '44' }]}>
                    <Text style={[styles.badgeText, { color: ACCENT }]}>♦ {z}</Text>
                  </View>
                ))}
              </View>

              {/* Properties */}
              <Text style={[styles.sectionLabel, { color: ACCENT }]}>WŁAŚCIWOŚCI</Text>
              {c.properties.map((p, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={[styles.bullet, { backgroundColor: c.color }]} />
                  <Text style={[styles.bulletText, { color: textColor }]}>{p}</Text>
                </View>
              ))}

              {/* How to use */}
              <Text style={[styles.sectionLabel, { color: ACCENT, marginTop: 16 }]}>JAK UŻYWAĆ</Text>
              {c.howToUse.map((tip, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bulletNum, { color: c.color }]}>{i + 1}.</Text>
                  <Text style={[styles.bulletText, { color: textColor }]}>{tip}</Text>
                </View>
              ))}

              {/* How to clean */}
              <Text style={[styles.sectionLabel, { color: ACCENT, marginTop: 16 }]}>JAK CZYŚCIĆ</Text>
              {c.howToClean.map((tip, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bulletNum, { color: '#AED6F1' }]}>✦</Text>
                  <Text style={[styles.bulletText, { color: textColor }]}>{tip}</Text>
                </View>
              ))}

              {/* AI Oracle */}
              <Pressable
                onPress={() => handleModalAi(c)}
                style={[styles.aiBtn, { borderColor: c.color }]}
              >
                <LinearGradient colors={[c.color + '33', c.color + '15']} style={styles.aiBtnGrad}>
                  <Sparkles size={16} color={c.color} />
                  <Text style={[styles.aiBtnText, { color: c.color }]}>Poproś Oracle o wskazówki</Text>
                </LinearGradient>
              </Pressable>

              {modalAiLoading && (
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <ActivityIndicator color={c.color} />
                  <Text style={[styles.loadingText, { color: subColor }]}>Oracle przemawia...</Text>
                </View>
              )}
              {!!modalAiText && (
                <View style={[styles.aiResultCard, { backgroundColor: c.color + '14', borderColor: c.color + '44' }]}>
                  <Text style={[styles.aiResultText, { color: textColor }]}>{modalAiText}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1 }} edges={['top']}>

      <CrystalBg isLight={isLight} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: 4 }]}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: ACCENT }]}>KOLEKCJA</Text>
          <Text style={[styles.title, { color: textColor }]}>PRZEWODNIK KRYSZTAŁÓW</Text>
        </View>
        <Pressable onPress={handleStar} style={styles.headerBtn}>
          <Star size={20} color={isFav ? '#F9A825' : subColor} fill={isFav ? '#F9A825' : 'none'} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Search size={16} color={subColor} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Szukaj kryształu..."
          placeholderTextColor={subColor}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <Pressable onPress={() => setSearch('')}>
            <X size={14} color={subColor} />
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: insets.bottom + 16 }}
      >
        {/* 3D Widget */}
        <CrystalWidget accent={ACCENT} />

        {/* My Crystals */}
        {!search && (
          <Animated.View entering={FadeInUp.delay(100).duration(400)}>
            <Text style={[styles.sectionLabel, { color: ACCENT, marginBottom: 10 }]}>
              MOJE KRYSZTAŁY — {zodiacKey.toUpperCase()}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -layout.padding.screen }} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 10 }}>
              {myCrystals.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => { HapticsService.impact('light'); setSelectedCrystal(c); setModalAiText(''); }}
                  style={[styles.myCard, { backgroundColor: cardBg, borderColor: c.color + '55' }]}
                >
                  <View style={[styles.myColorCircle, { backgroundColor: c.color + '33', borderColor: c.color }]}>
                    <View style={[styles.myColorDot, { backgroundColor: c.color }]} />
                  </View>
                  <Text style={[styles.myCardName, { color: textColor }]}>{c.namePl}</Text>
                  <Text style={[styles.myCardCat, { color: subColor }]}>{c.category}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* AI Reading */}
        {!search && (
          <Animated.View entering={FadeInDown.delay(180).duration(400)} style={{ marginTop: 20 }}>
            <Pressable onPress={handleAiReading} disabled={aiLoading}>
              <LinearGradient
                colors={isLight ? ['rgba(155,89,182,0.14)', 'rgba(155,89,182,0.07)'] : ['rgba(155,89,182,0.22)', 'rgba(155,89,182,0.10)']}
                style={[styles.aiReadingBtn, { borderColor: ACCENT + '55' }]}
              >
                <Gem size={18} color={ACCENT} />
                <Text style={[styles.aiReadingText, { color: ACCENT }]}>Moje Kryształy na Ten Czas</Text>
                <Sparkles size={14} color={ACCENT} style={{ opacity: 0.7 }} />
              </LinearGradient>
            </Pressable>
            {aiLoading && (
              <View style={{ alignItems: 'center', paddingVertical: 14 }}>
                <ActivityIndicator color={ACCENT} />
                <Text style={[styles.loadingText, { color: subColor }]}>Oracle dobiera kryształy...</Text>
              </View>
            )}
            {!!aiResult && (
              <View style={[styles.aiResultCard, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '44', marginTop: 10 }]}>
                <Text style={[styles.aiResultLabel, { color: ACCENT }]}>✦ ODCZYT KRYSZTAŁOWY</Text>
                <Text style={[styles.aiResultText, { color: textColor }]}>{aiResult}</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Category Filter */}
        <View style={{ marginTop: 22, marginBottom: 4 }}>
          <Text style={[styles.sectionLabel, { color: ACCENT, marginBottom: 10 }]}>KOLEKCJA KRYSZTAŁÓW</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -layout.padding.screen }} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 8 }}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => { HapticsService.impact('light'); setActiveCategory(cat); }}
                  style={[styles.catChip, {
                    backgroundColor: isActive ? CAT_COLORS[cat] : cardBg,
                    borderColor: isActive ? CAT_COLORS[cat] : cardBorder,
                  }]}
                >
                  <Text style={[styles.catChipText, { color: isActive ? '#fff' : subColor }]}>{cat}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Crystal Grid */}
        <View style={styles.crystalGrid}>
          {filtered.map((c, i) => (
            <React.Fragment key={c.id}>{renderCrystalCard({ crystal: c, index: i })}</React.Fragment>
          ))}
          {filtered.length === 0 && (
            <View style={{ padding: 32, alignItems: 'center', width: '100%' }}>
              <Gem size={36} color={subColor} />
              <Text style={[styles.emptyText, { color: subColor }]}>Brak kryształów dla tej kategorii</Text>
            </View>
          )}
        </View>

        {/* Crystal Care */}
        {!search && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ marginTop: 24 }}>
            <Text style={[styles.sectionLabel, { color: ACCENT, marginBottom: 10 }]}>PIELĘGNACJA KRYSZTAŁÓW</Text>
            {CARE_SECTIONS.map(section => (
              <View key={section.id} style={[styles.accordionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Pressable
                  onPress={() => { HapticsService.impact('light'); setOpenCare(openCare === section.id ? null : section.id); }}
                  style={styles.accordionHeader}
                >
                  <Text style={styles.accordionIcon}>{section.icon}</Text>
                  <Text style={[styles.accordionTitle, { color: textColor }]}>{section.title}</Text>
                  <ChevronDown size={16} color={subColor} style={{ transform: [{ rotate: openCare === section.id ? '180deg' : '0deg' }] }} />
                </Pressable>
                {openCare === section.id && (
                  <View style={styles.accordionContent}>
                    {section.content.map((item, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <View style={[styles.bullet, { backgroundColor: ACCENT }]} />
                        <Text style={[styles.bulletText, { color: textColor }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </Animated.View>
        )}

        {/* CO DALEJ? */}
        {!search && (
          <Animated.View entering={FadeInDown.delay(360).duration(400)} style={{ marginTop: 24 }}>
            <Text style={[styles.sectionLabel, { color: ACCENT, marginBottom: 10 }]}>CO DALEJ?</Text>
            {[
              { label: 'Czakry', desc: 'Zbadaj 7 centrów energetycznych ciała', route: 'Chakra', icon: Layers, color: '#A78BFA' },
              { label: 'Medytacja', desc: 'Głęboka praktyka z kryształem w dłoni', route: 'Meditation', icon: Moon, color: '#60A5FA' },
              { label: 'Kąpiel dźwiękowa', desc: 'Uzdrawiające wibracje i kryształowe czyszczenie', route: 'SoundBath', icon: Headphones, color: '#34D399' },
            ].map((item, i) => (
              <Animated.View key={item.route} entering={FadeInDown.delay(380 + i * 60).duration(350)}>
                <Pressable
                  onPress={() => { HapticsService.impact('light'); navigation.navigate(item.route); }}
                  style={[styles.nextCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                >
                  <LinearGradient colors={[item.color + '22', item.color + '08']} style={styles.nextCardGrad}>
                    <View style={[styles.nextIconBox, { backgroundColor: item.color + '22' }]}>
                      <item.icon size={20} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.nextCardTitle, { color: textColor }]}>{item.label}</Text>
                      <Text style={[styles.nextCardDesc, { color: subColor }]}>{item.desc}</Text>
                    </View>
                    <ArrowRight size={16} color={subColor} />
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        <EndOfContentSpacer size="standard" />
      </ScrollView>

      {renderModal()}
        </SafeAreaView>
</View>
  );
}

// ── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen,
    paddingBottom: 10,
    gap: 10,
  },
  backBtn: { padding: 6 },
  headerBtn: { padding: 6 },
  eyebrow: { fontSize: 10, letterSpacing: 2.5, fontWeight: '600', opacity: 0.8 },
  title: { fontSize: 17, fontWeight: '700', letterSpacing: 1.5 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: layout.padding.screen,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  sectionLabel: { fontSize: 11, letterSpacing: 2.5, fontWeight: '700' },
  crystalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  crystalCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 12,
    minHeight: 110,
  },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  crystalName: { fontSize: 14, fontWeight: '700', flex: 1 },
  crystalEnName: { fontSize: 11, marginBottom: 6 },
  catTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  catTagText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  crystalProp: { fontSize: 11, lineHeight: 16 },
  myCard: {
    width: 100,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  myColorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myColorDot: { width: 22, height: 22, borderRadius: 11 },
  myCardName: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  myCardCat: { fontSize: 10, textAlign: 'center' },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipText: { fontSize: 13, fontWeight: '600' },
  aiReadingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  aiReadingText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  aiResultCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  aiResultLabel: { fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 8 },
  aiResultText: { fontSize: 14, lineHeight: 22 },
  loadingText: { fontSize: 13, marginTop: 8 },
  accordionCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  accordionIcon: { fontSize: 18 },
  accordionTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
  accordionContent: { paddingHorizontal: 14, paddingBottom: 14 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  bulletNum: { fontSize: 13, fontWeight: '700', minWidth: 18 },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 20 },
  nextCard: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  nextCardGrad: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  nextIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nextCardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  nextCardDesc: { fontSize: 12, lineHeight: 17 },
  emptyText: { fontSize: 14, marginTop: 12, textAlign: 'center' },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingTop: 20,
    paddingHorizontal: layout.padding.screen,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  crystalCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crystalCircleInner: { width: 28, height: 28, borderRadius: 14 },
  modalTitle: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  modalSubtitle: { fontSize: 13, marginTop: 2 },
  closeBtn: { padding: 6 },
  modalDesc: { fontSize: 14, lineHeight: 23, marginBottom: 14 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  aiBtn: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginTop: 18, marginBottom: 4 },
  aiBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  aiBtnText: { fontSize: 14, fontWeight: '700' },
});
