import { getLoadingMessage } from '../core/utils/loadingMessages';
import { useTheme } from '../core/hooks/useTheme';
// @ts-nocheck
import { SpeakButton } from '../components/SpeakButton';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet,
  Text, View, Image, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, G, Defs, RadialGradient, Stop, Ellipse, Line } from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowRight, BookOpen, Camera, ChevronLeft, Hand, Image as ImageIcon, Moon, Sparkles, Star, ZoomIn,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { AiService } from '../core/services/ai.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#D97706';
const ACCENT_LIGHT = '#F59E0B';
const BG_COLORS = ['#060400', '#0F0800', '#180C00'] as const;

// ─── Palm line data ────────────────────────────────────────────────────────────
const PALM_LINES = [
  {
    id: 'heart',
    name: 'Linia Serca',
    color: '#FF6B8A',
    eyebrow: 'EMOCJE I MIŁOŚĆ',
    tagline: 'Lustro Twoich głębokich uczuć',
    description:
      'Linia Serca przebiega poziomo w górnej części dłoni, tuż pod palcami. Odzwierciedla Twój emocjonalny świat — sposób, w jaki kochasz, odczuwasz i wchodzisz w relacje. Jej kształt, długość i charakter ujawniają, jak radzisz sobie z emocjami, jakich relacji pragniesz i co sprawia Ci ból. Jest jedną z najważniejszych linii na dłoni.',
    indicators: [
      { label: 'Długa i prosta', meaning: 'Osoba emocjonalnie stabilna, pragmatyczna w miłości. Ceni stałość i lojalność ponad romantyzm.' },
      { label: 'Długa i zakrzywiona', meaning: 'Głęboka wrażliwość i intensywne uczucia. Poszukujesz duchowej połowy i bezwarunkowej miłości.' },
      { label: 'Krótka i prosta', meaning: 'Niezależność emocjonalna. Miłość wyrażasz czynem, nie słowami — jesteś praktyczny i skupiony.' },
      { label: 'Sięga pod palec środkowy', meaning: 'Miłość namiętna i głęboka, lecz z tendencją do obsesji lub intensywnej zazdrości.' },
      { label: 'Przerywana lub łańcuszkowa', meaning: 'Zmienność emocjonalna, możliwe rozczarowania i huśtawki uczuciowe w relacjach.' },
      { label: 'Z wieloma drobnymi liniami', meaning: 'Wielka empatia i zdolność wyczuwania nastrojów innych — dar wrażliwości.' },
    ],
    svgPath: 'M 75,163 Q 118,153 155,158 Q 180,162 199,153',
  },
  {
    id: 'head',
    name: 'Linia Głowy',
    color: '#60A5FA',
    eyebrow: 'ROZUM I MYŚLENIE',
    tagline: 'Mapa Twojego umysłu',
    description:
      'Linia Głowy przebiega poziomo przez środek dłoni, poniżej Linii Serca. Jest mapą Twojego myślenia — inteligencji, kreatywności, stylu uczenia się i podejmowania decyzji. Im głębsza i wyraźniejsza, tym bardziej skupiony i analityczny umysł. Jej kierunek zdradza, czy myślisz praktycznie, czy artystycznie.',
    indicators: [
      { label: 'Prosta i pozioma', meaning: 'Myślenie analityczne, logiczne i praktyczne. Doskonały strateg i precyzyjny planer.' },
      { label: 'Opadająca ku nadgarstku', meaning: 'Wyobraźnia twórcza i artystyczna, myślenie intuicyjne i symboliczne.' },
      { label: 'Długa i głęboka', meaning: 'Wszechstronna inteligencja, zdolność głębokiej koncentracji i refleksji.' },
      { label: 'Krótka', meaning: 'Myślenie konkretne i szybkie, zorientowane na działanie i natychmiastowy efekt.' },
      { label: 'Rozwidlona na końcu', meaning: 'Zdolność widzenia wielu perspektyw jednocześnie — tak zwany "widelec pisarza".' },
      { label: 'Zaczyna razem z Linią Życia', meaning: 'Ostrożność, duża wrażliwość i głęboka refleksja przed każdym działaniem.' },
    ],
    svgPath: 'M 74,197 Q 118,190 155,194 Q 177,197 191,190',
  },
  {
    id: 'life',
    name: 'Linia Życia',
    color: '#34D399',
    eyebrow: 'WITALNOŚĆ I ZDROWIE',
    tagline: 'Nić Twojej ziemskiej podróży',
    description:
      'Linia Życia obiega poduszek kciuka i opada ku nadgarstkowi. Wbrew popularnemu mitowi nie wskazuje długości życia — lecz jego JAKOŚĆ. Opisuje Twoją witalność, energię, odporność i skłonność do wielkich zmian. Im głębsza i wyraźniejsza, tym bujniejsze i pełniejsze życie.',
    indicators: [
      { label: 'Długa i głęboka', meaning: 'Wielka witalność, silna energia życiowa i doskonałe zdrowie przez całe życie.' },
      { label: 'Krótka lub słaba', meaning: 'Tendencja do wyczerpania — wymaga szczególnej dbałości o równowagę energii.' },
      { label: 'Bliska kciuka (wąska)', meaning: 'Introwertyzm, skłonność do wyczerpania i potrzeba długiego odpoczynku.' },
      { label: 'Daleko od kciuka (szeroka)', meaning: 'Wielka energia, ciekawość świata i ogromny potencjał życiowy.' },
      { label: 'Z gałązkami ku górze', meaning: 'Sukcesy i wznoszące się osiągnięcia budowane własną pracą i determinacją.' },
      { label: 'Przerwana linia', meaning: 'Znaczące przełomy życiowe lub transformujące doświadczenia duchowe.' },
    ],
    svgPath: 'M 99,160 C 87,180 78,202 75,228 C 72,250 77,264 84,277',
  },
  {
    id: 'fate',
    name: 'Linia Losu',
    color: '#A78BFA',
    eyebrow: 'PRZEZNACZENIE I KARIERA',
    tagline: 'Ścieżka Twojego powołania',
    description:
      'Linia Losu (zwana też Linią Saturna) przebiega pionowo od nadgarstka ku palcowi środkowemu. Opisuje Twoje powołanie, karierę i wpływ sił wyższych na Twoje życie. Jej obecność sugeruje wyraźną ścieżkę życiową. Brak tej linii nie oznacza braku celu — lecz pełną wolność w kształtowaniu własnej drogi.',
    indicators: [
      { label: 'Głęboka i wyraźna', meaning: 'Silna świadomość życiowego celu, wyraźne powołanie i niezachwiana determinacja.' },
      { label: 'Zaczyna od Linii Życia', meaning: 'Kariera budowana własnym wysiłkiem od samego początku, bez szczególnej pomocy.' },
      { label: 'Zaczyna od środka dłoni', meaning: 'Sukces zawodowy i życiowy przychodzi w dojrzałym wieku — po wielu próbach.' },
      { label: 'Zaczyna od Linii Serca', meaning: 'Realizacja powołania opartego na miłości, emocjach i relacjach z innymi.' },
      { label: 'Przerywana', meaning: 'Zmiany kariery i zawodowe przełomy — wiele ścieżek i różnorodnych doświadczeń.' },
      { label: 'Brak linii losu', meaning: 'Pełna wolność wyboru — los jest w Twoich rękach, nic nie jest z góry zapisane.' },
    ],
    svgPath: 'M 130,278 C 130,248 129,218 130,190 C 131,168 130,154 128,143',
  },
  {
    id: 'sun',
    name: 'Linia Słońca',
    color: '#FBBF24',
    eyebrow: 'TALENT I SUKCES',
    tagline: 'Promień Twojego wewnętrznego blasku',
    description:
      'Linia Słońca (zwana Linią Apollo) biegnie wzdłuż palca serdecznego. Jest znakiem twórczego talentu, uznania i duchowego blasku. Osoby z wyraźną Linią Słońca mają dar inspirowania innych i naturalne zdolności artystyczne lub charyzmatyczne. Wzmacnia i rozświetla każdą inną linię dłoni.',
    indicators: [
      { label: 'Wyraźna i głęboka', meaning: 'Wielki talent twórczy, naturalne zdolności artystyczne i potencjał szerokiego uznania.' },
      { label: 'Krótka, tylko pod palcem', meaning: 'Wyspecjalizowany talent w konkretnej dziedzinie i sukcesy na tym wybranym polu.' },
      { label: 'Zaczyna przy nadgarstku', meaning: 'Zdolności artystyczne rozwijane od dziecka i towarzyszące przez całe życie.' },
      { label: 'Zaczyna przy Linii Głowy', meaning: 'Sukces artystyczny przychodzi po długich staraniach i świadomym rozwoju umiejętności.' },
      { label: 'Wiele krótkich linii', meaning: 'Rozproszony talent w wielu obszarach — artysta wszechstronny i twórczo niespokojny.' },
      { label: 'Brak linii', meaning: 'Sukces możliwy w każdej dziedzinie, lecz wymaga większego wysiłku i cierpliwości.' },
    ],
    svgPath: 'M 153,200 C 153,180 153,162 154,148',
  },
];

// ─── Background ───────────────────────────────────────────────────────────────
const PalmBg = ({ isLight }: { isLight?: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight ? ['#FBF5E8', '#F5EDD8', '#EDE0C6'] as const : BG_COLORS}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={500} style={{ position: 'absolute', top: 0 }} opacity={0.22}>
      <Defs>
        <RadialGradient id="palmGlow" cx="50%" cy="40%" r="50%">
          <Stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
          <Stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={SW / 2} cy={180} r={200} fill="url(#palmGlow)" />
      {Array.from({ length: 48 }, (_, i) => (
        <Circle
          key={i}
          cx={(i * 93 + 41) % SW}
          cy={(i * 71 + 33) % 480}
          r={i % 4 === 0 ? 1.5 : 0.8}
          fill={ACCENT_LIGHT}
          opacity={0.3 + (i % 5) * 0.08}
        />
      ))}
    </Svg>
  </View>
);

// ─── 3D Palm SVG ──────────────────────────────────────────────────────────────
const Palm3D = ({ selectedLine }: { selectedLine: string }) => {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const glowPulse = useSharedValue(0.7);

  const activeLine = PALM_LINES.find(l => l.id === selectedLine);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 1800 }), withTiming(0.65, { duration: 1800 })),
      -1, true,
    );
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltY.value = Math.max(-28, Math.min(28, e.translationX * 0.16));
      tiltX.value = Math.max(-18, Math.min(18, e.translationY * 0.11));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 750 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const handFill = 'rgba(220,185,130,0.18)';
  const handStroke = 'rgba(220,185,130,0.45)';
  const SW_PALM = Math.min(SW - 40, 300);
  const scale = SW_PALM / 260;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ alignItems: 'center' }, containerStyle]}>
        {/* Glow platform */}
        <Animated.View style={[{ position: 'absolute', bottom: -10 }, glowStyle]}>
          <Svg width={220} height={40} viewBox="-110 -20 220 40">
            <Ellipse cx={0} cy={0} rx={90} ry={14} fill={(activeLine?.color ?? ACCENT) + '30'} />
          </Svg>
        </Animated.View>

        <Svg
          width={SW_PALM}
          height={SW_PALM * 1.15}
          viewBox="0 0 260 300"
        >
          {/* ── Hand silhouette ── */}
          {/* Palm body */}
          <Path
            d="M 90,148 L 170,148 Q 188,148 188,166 L 188,264 Q 188,282 170,282 L 90,282 Q 72,282 72,264 L 72,166 Q 72,148 90,148 Z"
            fill={handFill} stroke={handStroke} strokeWidth={1}
          />
          {/* Index finger */}
          <Path
            d="M 99,52 Q 110,52 110,63 L 110,141 Q 110,152 99,152 Q 88,152 88,141 L 88,63 Q 88,52 99,52 Z"
            fill={handFill} stroke={handStroke} strokeWidth={1}
          />
          {/* Middle finger */}
          <Path
            d="M 126,36 Q 138,36 138,48 L 138,140 Q 138,152 126,152 Q 114,152 114,140 L 114,48 Q 114,36 126,36 Z"
            fill={handFill} stroke={handStroke} strokeWidth={1}
          />
          {/* Ring finger */}
          <Path
            d="M 153,50 Q 164,50 164,61 L 164,141 Q 164,152 153,152 Q 142,152 142,141 L 142,61 Q 142,50 153,50 Z"
            fill={handFill} stroke={handStroke} strokeWidth={1}
          />
          {/* Little finger */}
          <Path
            d="M 176,68 Q 185,68 185,77 L 185,143 Q 185,152 176,152 Q 167,152 167,143 L 167,77 Q 167,68 176,68 Z"
            fill={handFill} stroke={handStroke} strokeWidth={1}
          />
          {/* Thumb */}
          <G transform="rotate(-32 72 195)">
            <Path
              d="M 58,165 Q 68,165 68,175 L 68,219 Q 68,229 58,229 Q 48,229 48,219 L 48,175 Q 48,165 58,165 Z"
              fill={handFill} stroke={handStroke} strokeWidth={1}
            />
          </G>

          {/* ── Knuckle detail lines ── */}
          {[
            { x1: 90, x2: 108, y: 97 },
            { x1: 115, x2: 137, y: 80 },
            { x1: 143, x2: 163, y: 94 },
            { x1: 168, x2: 184, y: 110 },
          ].map((k, i) => (
            <Line key={i} x1={k.x1} y1={k.y} x2={k.x2} y2={k.y}
              stroke="rgba(220,185,130,0.20)" strokeWidth={0.8} />
          ))}

          {/* ── Palm lines (dim — not selected) ── */}
          {PALM_LINES.map(line => {
            const isActive = line.id === selectedLine;
            return (
              <Path
                key={line.id}
                d={line.svgPath}
                stroke={isActive ? line.color : line.color + '44'}
                strokeWidth={isActive ? 2.8 : 1.2}
                strokeLinecap="round"
                fill="none"
              />
            );
          })}

          {/* ── Active line glow (duplicate, wider) ── */}
          {activeLine && (
            <Path
              d={activeLine.svgPath}
              stroke={activeLine.color + '40'}
              strokeWidth={7}
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* ── Wrist lines ── */}
          <Line x1={80} y1={288} x2={180} y2={288} stroke="rgba(220,185,130,0.20)" strokeWidth={0.8} />
          <Line x1={85} y1={293} x2={175} y2={293} stroke="rgba(220,185,130,0.13)" strokeWidth={0.8} />
        </Svg>
      </Animated.View>
    </GestureDetector>
  );
};

// ─── Mini Palm (scan results illustration) ────────────────────────────────────
const PalmMini = ({ lineId, color }: { lineId: string | null; color: string }) => {
  const hF = 'rgba(220,185,130,0.14)';
  const hS = 'rgba(220,185,130,0.36)';
  const W = 72;
  const H = Math.round(W * 300 / 260);
  const activePath = lineId ? PALM_LINES.find(l => l.id === lineId)?.svgPath : null;
  return (
    <Svg width={W} height={H} viewBox="0 0 260 300">
      {/* Palm body */}
      <Path d="M 90,148 L 170,148 Q 188,148 188,166 L 188,264 Q 188,282 170,282 L 90,282 Q 72,282 72,264 L 72,166 Q 72,148 90,148 Z" fill={hF} stroke={hS} strokeWidth={2} />
      {/* Index */}
      <Path d="M 99,52 Q 110,52 110,63 L 110,141 Q 110,152 99,152 Q 88,152 88,141 L 88,63 Q 88,52 99,52 Z" fill={hF} stroke={hS} strokeWidth={2} />
      {/* Middle */}
      <Path d="M 126,36 Q 138,36 138,48 L 138,140 Q 138,152 126,152 Q 114,152 114,140 L 114,48 Q 114,36 126,36 Z" fill={hF} stroke={hS} strokeWidth={2} />
      {/* Ring */}
      <Path d="M 153,50 Q 164,50 164,61 L 164,141 Q 164,152 153,152 Q 142,152 142,141 L 142,61 Q 142,50 153,50 Z" fill={hF} stroke={hS} strokeWidth={2} />
      {/* Little */}
      <Path d="M 176,68 Q 185,68 185,77 L 185,143 Q 185,152 176,152 Q 167,152 167,143 L 167,77 Q 167,68 176,68 Z" fill={hF} stroke={hS} strokeWidth={2} />
      {/* Thumb */}
      <G transform="rotate(-32 72 195)">
        <Path d="M 58,165 Q 68,165 68,175 L 68,219 Q 68,229 58,229 Q 48,229 48,219 L 48,175 Q 48,165 58,165 Z" fill={hF} stroke={hS} strokeWidth={2} />
      </G>
      {/* All lines dim */}
      {PALM_LINES.map(line => (
        <Path key={line.id} d={line.svgPath} stroke="rgba(220,185,130,0.20)" strokeWidth={1.2} strokeLinecap="round" fill="none" />
      ))}
      {/* Active line highlight */}
      {activePath && (
        <>
          <Path d={activePath} stroke={color + '55'} strokeWidth={9} strokeLinecap="round" fill="none" />
          <Path d={activePath} stroke={color} strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </>
      )}
    </Svg>
  );
};

// ─── Typing dots ──────────────────────────────────────────────────────────────
const TypingDots = ({ color }: { color: string }) => {
  const d1 = useSharedValue(0);
  const d2 = useSharedValue(0);
  const d3 = useSharedValue(0);
  useEffect(() => {
    const anim = (v: any) =>
      (v.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 280 }),
          withTiming(0, { duration: 280 }),
        ),
        -1, false,
      ));
    const t1 = setTimeout(() => anim(d1), 0);
    const t2 = setTimeout(() => anim(d2), 160);
    const t3 = setTimeout(() => anim(d3), 320);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: d1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: d2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ translateY: d3.value }] }));
  return (
    <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 10, justifyContent: 'center' }}>
      {[s1, s2, s3].map((s, i) => (
        <Animated.View key={i} style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }, s]} />
      ))}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

// Helper: dzieli tekst AI na akapity dla lepszej czytelnosci
const formatPalmResponse = (text: string): string[] => {
  if (!text) return [];
  return text
    .split(/\n{2,}|\n(?=[A-Z•\-])/)
    .map(p => p.trim())
    .filter(p => p.length > 10);
};

export const PalmReadingScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
  const textColor = isLight ? '#2C1C08' : 'rgba(240,235,226,0.92)';
  const subColor = isLight ? '#5A3A18' : 'rgba(255,255,255,0.60)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)';
  const isFav = isFavoriteItem('palm-reading');

  const [activeTab, setActiveTab] = useState<'learn' | 'scan'>('learn');
  const [selectedLine, setSelectedLine] = useState('heart');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const activeLine = PALM_LINES.find(l => l.id === selectedLine)!;

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert(t('palmreading.brak_dostepu', 'Brak dostępu'), t('palmreading.zezwol_aplikacji_na_uzycie_aparatu', 'Zezwól aplikacji na użycie aparatu.')); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'] as any, quality: 0.8 });
    if (!result.canceled) { setImageUri(result.assets[0].uri); setAnalysis(''); }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert(t('palmreading.brak_dostepu_1', 'Brak dostępu'), t('palmreading.zezwol_aplikacji_na_dostep_do', 'Zezwól aplikacji na dostęp do galerii.')); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, quality: 0.8 });
    if (!result.canceled) { setImageUri(result.assets[0].uri); setAnalysis(''); }
  };

  const analyzePalm = async () => {
    if (!imageUri || loading) return;
    setLoading(true);
    setAnalysis('');
    try {
      const userName = userData?.name ? userData.name : '';
      const zodiac = userData?.birthDate
        ? (() => { try { const { getZodiacSign } = require('../features/horoscope/utils/astrology'); return getZodiacSign(userData.birthDate); } catch { return ''; } })()
        : '';
      const personContext = userName
        ? `osoby o imieniu ${userName}${zodiac ? ` (znak zodiaku: ${zodiac})` : ''}`
        : zodiac ? `osoby spod znaku ${zodiac}` : 'tej osoby';

      const prompt = `Jesteś mistrzem chiromancji z wieloletnim doświadczeniem — czytasz z dłoni łącząc tradycyjną chiromancję zachodnią z intuicją duchową. Patrzysz na zdjęcie dłoni ${personContext} i dajesz głęboki, w pełni spersonalizowany odczyt.

ZASADA NAJWAŻNIEJSZA: Dla każdej linii zacznij od opisu tego, co KONKRETNIE WIDZISZ na tym zdjęciu (długość, głębokość, kształt, przerwy, rozwidlenia, linie pomocnicze), a dopiero potem przejdź do interpretacji. Twoja odpowiedź ma być tak precyzyjna, że osoba po jej przeczytaniu poczuje: "tak, właśnie taka jestem". Żadnych ogólników.

Użyj dokładnie tych nagłówków sekcji (bez gwiazdek, bez oznaczeń):

LINIA SERCA:
[Opisz co widzisz: długość linii, czy sięga pod palec wskazujący czy środkowy, czy jest prosta czy zakrzywiona, czy ma przerwy lub drobne odgałęzienia, czy jest głęboka czy powierzchowna. Następnie: co to oznacza dla tej konkretnej osoby — jak kocha, jak przeżywa emocje, jakich relacji potrzebuje, czego się boi w miłości, jaki wzorzec uczuciowy ją definiuje. Nawiąż do znaku zodiaku jeśli jest podany. 5-6 zdań.]

LINIA GŁOWY:
[Opisz: kierunek (prosta, opadająca, steeply falling), długość (sięga środka dłoni czy do mały palec), głębokość, czy ma rozwidlenie na końcu (widelec pisarza). Następnie: jak ta osoba myśli i przetwarza informacje, czy jest intuicyjna czy analityczna, jak podejmuje decyzje, jaki jest jej dominujący styl intelektualny, jaka dziedzina życia jest jej naturalną strefą geniuszu. 5-6 zdań.]

LINIA ŻYCIA:
[Opisz: czy okalina kciuka jest szeroka czy wąska, jak głęboka jest linia, czy są przerwy, czy biegną od niej linie ku górze (sukcesy) czy ku dołowi, czy widać linię podwójną. Następnie: jakość energii życiowej tej osoby, jej witalność i odporność fizyczno-duchowa, czy widać przełomowe momenty transformacji, jak aktualnie prezentuje się jej energia i jaki potencjał niesie przyszłość. 5-6 zdań.]

LINIA LOSU:
[Opisz: czy linia jest widoczna i gdzie się zaczyna (nadgarstek, środek dłoni, Linia Życia), jak głęboka, czy ma przerwy lub zmienia kierunek. Jeśli brak linii — powiedz co to konkretnie oznacza dla tej osoby. Następnie: jej powołanie, droga kariery i relacja z przeznaczeniem — kiedy jej ścieżka staje się wyraźna, co ją wspiera, co blokuje. 4-5 zdań.]

LINIA SŁOŃCA:
[Opisz: czy linia jest widoczna, jak długa, skąd biegnie. Następnie: talent twórczy i charyzmatyczny tej osoby, w jakiej dziedzinie ma naturalny blask, jak jej energia twórcza chce się wyrażać w świecie. Jeśli linia słaba lub nieobecna — co to oznacza w kontekście innych linii. 4-5 zdań.]

PRZESŁANIE DŁONI:
[Wyjątkowe syntetyczne przesłanie dla TEJ konkretnej osoby. Co sprawia, że ta dłoń jest wyjątkowa? Jakie wielkie możliwości w niej drzemią? Jakie jedno zdanie powinno jej towarzyszyć jako mantra? Napisz jak do kogoś bliskiego — z troską, precyzją i głębią. 4-5 zdań poetyckim, duchowym językiem.]

Pisz w języku użytkownika. Każda sekcja zaczyna się dokładnie od podanego nagłówka zakończonego dwukropkiem. Nie używaj ogólnych stwierdzeń, które pasują do każdej osoby — każde zdanie ma być możliwe TYLKO dla tej konkretnej dłoni.`;
      const localizedPrompt = i18n.language?.startsWith('en')
        ? `${prompt}\n\nWrite in English. Each section must begin with the exact heading ending in a colon. Do not use generic statements that could fit any person — every sentence must belong to THIS specific hand.`
        : prompt;
      const answer = await AiService.chatWithOracle(
        [{ role: 'user', content: localizedPrompt }],
        i18n.language?.startsWith('en') ? 'en' : 'pl',
      );
      setAnalysis(answer);
    } catch {
      setAnalysis(i18n.language?.startsWith('en') ? 'Could not read your palm. Make sure the photo is clear and try again.' : 'Nie udało się odczytać Twojej dłoni. Upewnij się, że zdjęcie jest wyraźne i spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  const parsedSections = React.useMemo(() => {
    if (!analysis) return null;
    const SECTIONS = [
      { key: 'LINIA SERCA', lineId: 'heart' },
      { key: 'LINIA GŁOWY', lineId: 'head' },
      { key: 'LINIA ŻYCIA', lineId: 'life' },
      { key: 'LINIA LOSU', lineId: 'fate' },
      { key: 'LINIA SŁOŃCA', lineId: 'sun' },
      { key: 'PRZESŁANIE DŁONI', lineId: null },
    ];
    const results: { title: string; color: string; content: string; lineId: string | null }[] = [];
    SECTIONS.forEach(({ key, lineId }, i) => {
      const startIdx = analysis.indexOf(key + ':');
      if (startIdx === -1) return;
      const contentStart = startIdx + key.length + 1;
      const nextKey = SECTIONS[i + 1] ? analysis.indexOf(SECTIONS[i + 1].key + ':') : -1;
      const content = (nextKey > 0 ? analysis.slice(contentStart, nextKey) : analysis.slice(contentStart)).trim();
      const line = PALM_LINES.find(l => l.id === lineId);
      results.push({ title: key, color: line?.color ?? ACCENT, content, lineId });
    });
    return results.length > 0 ? results : null;
  }, [analysis]);

  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
      <PalmBg isLight={isLight} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* ── Header ── */}
        <View style={ps.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} hitSlop={12}>
            <ChevronLeft color={ACCENT} size={22} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={ps.eyebrow}>{t('palmreading.chiromancj', 'CHIROMANCJA')}</Text>
            <Text style={[ps.title, { color: textColor }]}>{t('palmreading.odczyt_dloni', 'Odczyt Dłoni')}</Text>
          </View>
          <Pressable
            onPress={() => { if (isFav) { removeFavoriteItem('palm-reading'); } else { addFavoriteItem({ id: 'palm-reading', label: 'Dłoń', route: 'PalmReading', params: {}, icon: 'Hand', color: ACCENT, addedAt: new Date().toISOString() }); } }}
            hitSlop={12}
          >
            <Star color={isFav ? ACCENT : ACCENT + '77'} size={18} fill={isFav ? ACCENT : 'none'} />
          </Pressable>
        </View>

        {/* ── Tab bar ── */}
        <View style={ps.tabRow}>
          {(['learn', 'scan'] as const).map(tab => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[ps.tabBtn, activeTab === tab && { borderColor: ACCENT, backgroundColor: ACCENT + '18' }]}
            >
              {tab === 'learn' ? <Hand color={activeTab === tab ? ACCENT : ACCENT + '66'} size={14} /> : <ZoomIn color={activeTab === tab ? ACCENT : ACCENT + '66'} size={14} />}
              <Text style={[ps.tabText, { color: subColor }, activeTab === tab && { color: ACCENT }]}>
                {tab === 'learn' ? 'Poznaj Linie' : 'Skanuj Dłoń'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        >
          <Animated.View entering={FadeInDown.delay(60).duration(480)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 12 }}>
            <View style={ps.chambersCard}>
              <LinearGradient colors={[ACCENT + '16', 'transparent'] as const} style={StyleSheet.absoluteFill} />
              <Text style={ps.sectionEyebrow}>{t('palmreading.komnaty_chiromancj', 'KOMNATY CHIROMANCJI')}</Text>
              <View style={ps.chambersGrid}>
                <Pressable onPress={() => setActiveTab('learn')} style={[ps.chamberTile, isLight && { backgroundColor: 'rgba(255,255,255,0.88)', borderColor: 'rgba(139,100,42,0.20)' }, activeTab === 'learn' && { borderColor: ACCENT + '66', backgroundColor: ACCENT + '12' }]}><Hand color={ACCENT} size={16} /><Text style={ps.chamberTitle}>{t('palmreading.poznaj_linie', 'Poznaj linie')}</Text><Text style={[ps.chamberCopy, { color: subColor }]}>{t('palmreading.uczysz_sie_znaczen_ukladow_i', 'Uczysz się znaczeń, układów i subtelnych wariantów dłoni.')}</Text></Pressable>
                <Pressable onPress={() => setActiveTab('scan')} style={[ps.chamberTile, isLight && { backgroundColor: 'rgba(255,255,255,0.88)', borderColor: 'rgba(139,100,42,0.20)' }, activeTab === 'scan' && { borderColor: ACCENT + '66', backgroundColor: ACCENT + '12' }]}><ZoomIn color={ACCENT} size={16} /><Text style={ps.chamberTitle}>{t('palmreading.skan_dloni', 'Skan dłoni')}</Text><Text style={[ps.chamberCopy, { color: subColor }]}>{t('palmreading.ai_rozklada_odczyt_na_sekcje', 'AI rozkłada odczyt na sekcje i syntetyczne przesłanie.')}</Text></Pressable>
                <View style={[ps.chamberTile, isLight && { backgroundColor: 'rgba(255,255,255,0.88)', borderColor: 'rgba(139,100,42,0.20)' }]}><Sparkles color={ACCENT} size={16} /><Text style={ps.chamberTitle}>{t('palmreading.przeslanie', 'Przesłanie')}</Text><Text style={[ps.chamberCopy, { color: subColor }]}>{t('palmreading.na_koncu_dostajesz_nie_tylko', 'Na końcu dostajesz nie tylko opis, ale osobisty ton całej dłoni.')}</Text></View>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(70).duration(480)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 10 }}>
            <View style={[ps.instructCard, { borderColor: ACCENT + '30' }]}> 
              <LinearGradient colors={[ACCENT + '12', 'transparent'] as const} style={StyleSheet.absoluteFill} />
              <Text style={ps.sectionEyebrow}>{activeTab === 'learn' ? 'BIBLIOTEKA LINII' : 'KOMNATA SKANU'}</Text>
              <Text style={[ps.lineName, { color: ACCENT, fontSize: 18 }]}>{activeTab === 'learn' ? 'Poznajesz znaczenie dłoni krok po kroku.' : 'Przechodzisz do odczytu AI z większą głębią.'}</Text>
              <Text style={[ps.instructText, { color: subColor, marginTop: 10 }]}>{activeTab === 'learn' ? 'Najpierw zobacz układ linii, potem czytaj niuanse. Ten ekran ma uczyć patrzenia, a nie tylko podawać definicje.' : 'Najlepszy efekt daje wyraźne zdjęcie dominującej dłoni, spokojne światło i pełne ujęcie od nadgarstka do palców.'}</Text>
            </View>
          </Animated.View>

          {/* ═══════════════ LEARN TAB ═══════════════ */}
          {activeTab === 'learn' && (
            <>
              {/* 3D Palm */}
              <Animated.View entering={FadeInDown.delay(80).duration(600)} style={{ alignItems: 'center', marginTop: 12, marginBottom: 4 }}>
                <Palm3D selectedLine={selectedLine} />
              </Animated.View>

              {/* Line selector chips */}
              <ScrollView
                horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 8, paddingVertical: 4 }}
                style={{ marginBottom: 16 }}
              >
                {PALM_LINES.map(line => (
                  <Pressable
                    key={line.id}
                    onPress={() => setSelectedLine(line.id)}
                    style={[
                      ps.lineChip,
                      selectedLine === line.id
                        ? { backgroundColor: line.color + '22', borderColor: line.color }
                        : { backgroundColor: 'rgba(128,128,128,0.08)', borderColor: 'rgba(128,128,128,0.18)' },
                    ]}
                  >
                    <View style={[ps.lineDot, { backgroundColor: line.color }]} />
                    <Text style={[ps.lineChipText, { color: subColor }, selectedLine === line.id && { color: line.color }]}>
                      {line.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Active line card */}
              <Animated.View
                key={selectedLine}
                entering={FadeInDown.duration(350)}
                style={{ paddingHorizontal: layout.padding.screen }}
              >
                {/* Header */}
                <View style={[ps.lineCard, { borderColor: activeLine.color + '44' }]}>
                  <LinearGradient
                    colors={[activeLine.color + '18', activeLine.color + '08'] as const}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={[ps.lineEyebrow, { color: activeLine.color + 'BB' }]}>{activeLine.eyebrow}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <View style={[ps.lineDotLg, { backgroundColor: activeLine.color }]} />
                    <Text style={[ps.lineName, { color: activeLine.color }]}>{activeLine.name}</Text>
                  </View>
                  <Text style={[ps.lineTagline, { color: subColor }]}>{activeLine.tagline}</Text>
                  <View style={[ps.lineDivider, { backgroundColor: activeLine.color + '33' }]} />
                  <Text style={[ps.lineDesc, { color: textColor }]}>{activeLine.description}</Text>
                </View>

                {/* Indicators */}
                <Text style={ps.indicatorsLabel}>{t('palmreading.znaczenie_konfigurac', 'ZNACZENIE KONFIGURACJI')}</Text>
                {activeLine.indicators.map((ind, i) => (
                  <Animated.View
                    key={i}
                    entering={FadeInDown.delay(i * 60).duration(350)}
                    style={[ps.indCard, { borderColor: activeLine.color + '28' }]}
                  >
                    <View style={[ps.indDot, { backgroundColor: activeLine.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[ps.indLabel, { color: activeLine.color }]}>{ind.label}</Text>
                      <Text style={[ps.indMeaning, { color: subColor }]}>{ind.meaning}</Text>
                    </View>
                  </Animated.View>
                ))}
              </Animated.View>
            </>
          )}

          {/* ═══════════════ SCAN TAB ═══════════════ */}
          {activeTab === 'scan' && (
            <Animated.View entering={FadeInDown.delay(80).duration(500)} style={{ paddingHorizontal: layout.padding.screen }}>
              {/* Instruction card */}
              <View style={ps.instructCard}>
                <LinearGradient colors={[ACCENT + '18', ACCENT + '08'] as const} style={StyleSheet.absoluteFill} />
                <Sparkles color={ACCENT} size={20} style={{ marginBottom: 8 }} />
                <Text style={ps.instructTitle}>{t('palmreading.jak_wykonac_skan', 'Jak wykonać skan?')}</Text>
                <Text style={[ps.instructText, { color: subColor }]}>
                  {t('palmreading.wyciagnij_dlon_i_uwyraznij_jej', 'Wyciągnij dłoń i uwyraźnij jej linie, delikatnie zaciskając palce. Zrób zdjęcie w dobrym oświetleniu, trzymając aparat prostopadle do dłoni. Im wyraźniejsze zdjęcie, tym dokładniejszy odczyt.')}
                </Text>
              </View>

              {/* Pick buttons */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <Pressable
                  onPress={pickFromCamera}
                  style={({ pressed }) => [ps.pickBtn, pressed && { opacity: 0.7 }]}
                >
                  <Camera color={ACCENT} size={20} />
                  <Text style={ps.pickBtnText}>{t('palmreading.aparat', 'Aparat')}</Text>
                </Pressable>
                <Pressable
                  onPress={pickFromGallery}
                  style={({ pressed }) => [ps.pickBtn, pressed && { opacity: 0.7 }]}
                >
                  <ImageIcon color={ACCENT} size={20} />
                  <Text style={ps.pickBtnText}>{t('palmreading.galeria', 'Galeria')}</Text>
                </Pressable>
              </View>

              {/* Image preview */}
              {imageUri && (
                <Animated.View entering={FadeInDown.duration(400)} style={ps.imageWrapper}>
                  <Image source={{ uri: imageUri }} style={ps.palmImage} resizeMode="cover" />
                  <LinearGradient
                    colors={['transparent', 'rgba(6,4,0,0.7)'] as const}
                    style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                  />
                  <View style={ps.imageOverlayRow}>
                    <Hand color={ACCENT} size={14} />
                    <Text style={ps.imageOverlayText}>{t('palmreading.dlon_gotowa_do_odczytu', 'Dłoń gotowa do odczytu')}</Text>
                  </View>
                </Animated.View>
              )}

              {/* Analyze button */}
              {imageUri && !loading && !analysis && (
                <Pressable
                  onPress={analyzePalm}
                  style={({ pressed }) => [ps.analyzeBtn, pressed && { opacity: 0.75 }]}
                >
                  <LinearGradient
                    colors={[ACCENT_LIGHT, ACCENT] as const}
                    style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
                  />
                  <Sparkles color="#1A0A00" size={16} />
                  <Text style={ps.analyzeBtnText}>{t('palmreading.odczytaj_moja_dlon', 'Odczytaj moją dłoń')}</Text>
                </Pressable>
              )}

              {/* Loading */}
              {loading && (
                <View style={ps.loadingCard}>
                  <TypingDots color={ACCENT} />
                  <Text style={ps.loadingText}>{t('palmreading.mistrzowie_chiromancj_odczytuja_two', 'Mistrzowie chiromancji odczytują Twoją dłoń…')}</Text>
                </View>
              )}

              {imageUri ? (
                <View style={[ps.resultCard, { borderColor: ACCENT + '30', backgroundColor: isLight ? 'rgba(255,255,255,0.68)' : 'rgba(255,255,255,0.05)' }]}>
                  <LinearGradient colors={[ACCENT + '10', 'transparent'] as const} style={StyleSheet.absoluteFill} />
                  <Text style={ps.sectionEyebrow}>{t('palmreading.komnata_odczytu', 'KOMNATA ODCZYTU')}</Text>
                  <Text style={[ps.resultText, { color: subColor }]}>{t('palmreading.to_miejsce_nie_sluzy_tylko', 'To miejsce nie służy tylko do analizy zdjęcia. Tutaj z ruchu linii, głębokości i kształtu powstaje osobiste przesłanie dłoni.')}</Text>
                </View>
              ) : null}

              {/* Analysis result */}
              {analysis ? (
                <Animated.View entering={FadeInDown.duration(500)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, paddingHorizontal: 4 }}>
                    <Hand color={ACCENT} size={16} />
                    <Text style={ps.resultTitle}>{t('palmreading.odczyt_twojej_dloni', 'Odczyt Twojej Dłoni')}</Text>
                  </View>
                  {parsedSections ? parsedSections.map((sec, i) => (
                    <Animated.View key={sec.title} entering={FadeInDown.delay(i * 80).duration(400)} style={[ps.sectionCard, { borderColor: sec.color + '44', overflow: 'hidden' }]}>
                      <LinearGradient colors={[sec.color + '14', 'transparent'] as const} style={StyleSheet.absoluteFill} />
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <View style={[ps.lineBadge, { backgroundColor: sec.color + '22', borderColor: sec.color + '55', alignSelf: 'flex-start', marginBottom: 8 }]}>
                            <Text style={[ps.lineBadgeText, { color: sec.color }]}>{sec.title}</Text>
                          </View>
                          <Text style={[ps.resultText, { color: textColor }]}>{sec.content}</Text>
                        </View>
                        <PalmMini lineId={sec.lineId} color={sec.color} />
                      </View>
                    </Animated.View>
                  )) : (
                    <View style={[ps.resultCard, { overflow: 'hidden' }]}>
                      <LinearGradient colors={[ACCENT + '18', 'transparent'] as const} style={StyleSheet.absoluteFill} />
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Text style={[ps.resultText, { color: textColor, flex: 1 }]}>{analysis}</Text>
                  <SpeakButton text={analysis} color={ACCENT} compact />
                </View>
                    </View>
                  )}
                  <Pressable
                    onPress={() => { setImageUri(null); setAnalysis(''); }}
                    style={ps.resetBtn}
                  >
                    <Text style={ps.resetBtnText}>{t('palmreading.nowy_odczyt', 'Nowy Odczyt')}</Text>
                  </Pressable>
                </Animated.View>
              ) : null}

              {!imageUri && !loading && (
                <View style={ps.emptyState}>
                  <Hand color={ACCENT + '55'} size={44} style={{ marginBottom: 14 }} />
                  <Text style={[ps.emptyTitle, { color: textColor }]}>{t('palmreading.otworz_dlon_na_madrosc', 'Otwórz dłoń na mądrość')}</Text>
                  <Text style={[ps.emptyText, { color: subColor }]}>
                    {t('palmreading.sfotografu_swoja_dlon_a_starozytna', 'Sfotografuj swoją dłoń, a starożytna sztuka chiromancji ujawni tajemnice Twojego życia, miłości i przeznaczenia.')}
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* ── Co dalej? ── */}
          <View style={{ paddingHorizontal: 22, marginTop: 8, marginBottom: 4 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.8, color: ACCENT, marginBottom: 12 }}>{t('palmreading.co_dalej', '✦ CO DALEJ?')}</Text>
            {[
              { icon: Sparkles, label: 'Wyrocznia Aethery', sub: 'Zapytaj o znaczenie linii w Twoim życiu', color: '#A78BFA', route: 'OraclePortal' },
              { icon: BookOpen, label: 'Dziennik refleksji', sub: 'Zapisz odkrycia z odczytu dłoni', color: ACCENT, route: 'JournalEntry', params: { type: 'reflection', prompt: 'Z odczytu mojej dłoni wynika, że...' } },
              { icon: Moon, label: 'Numerologia losu', sub: 'Połącz linie dłoni z liczbami życiowymi', color: '#60A5FA', route: 'Numerology' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => navigation.navigate(item.route as any, (item as any).params)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10, backgroundColor: cardBg, borderColor: item.color + '33' }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: item.color + '18' }}>
                    <Icon color={item.color} size={17} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{item.label}</Text>
                    <Text style={{ fontSize: 12, color: subColor, marginTop: 2, lineHeight: 18 }}>{item.sub}</Text>
                  </View>
                  <ArrowRight color={item.color} size={15} strokeWidth={1.5} />
                </Pressable>
              );
            })}
          </View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const ps = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.5, color: ACCENT + 'AA', marginBottom: 1 },
  title: { fontSize: 18, fontWeight: '700', color: '#F0EBE2' },

  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 8, gap: 10 },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.18)', backgroundColor: 'rgba(128,128,128,0.07)',
  },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },

  lineChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  lineDot: { width: 7, height: 7, borderRadius: 3.5 },
  lineDotLg: { width: 10, height: 10, borderRadius: 5 },
  lineChipText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },

  lineCard: {
    borderWidth: 1, borderRadius: 20, padding: 18,
    overflow: 'hidden', marginBottom: 18,
    backgroundColor: 'rgba(128,128,128,0.07)',
  },
  lineEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.2, marginBottom: 8 },
  lineName: { fontSize: 20, fontWeight: '700' },
  lineTagline: { fontSize: 13, color: 'rgba(255,255,255,0.60)', marginBottom: 12, fontStyle: 'italic' },
  lineDivider: { height: 1, marginBottom: 14 },
  lineDesc: { fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 23 },

  indicatorsLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 2.5,
    color: ACCENT + '99', marginBottom: 10,
  },
  indCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8,
    backgroundColor: 'rgba(128,128,128,0.08)',
  },
  indDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  indLabel: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  indMeaning: { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 20 },

  instructCard: {
    borderWidth: 1, borderColor: ACCENT + '33', borderRadius: 18,
    padding: 18, overflow: 'hidden', marginBottom: 16,
    backgroundColor: 'rgba(128,128,128,0.07)',
    alignItems: 'center',
  },
  instructTitle: { fontSize: 15, fontWeight: '700', color: ACCENT, marginBottom: 8 },
  instructText: { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 21, textAlign: 'center' },

  pickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 16,
    backgroundColor: 'rgba(128,128,128,0.10)', borderWidth: 1, borderColor: ACCENT + '44',
  },
  pickBtnText: { fontSize: 14, fontWeight: '600', color: ACCENT },

  imageWrapper: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 14,
    height: 220, borderWidth: 1, borderColor: ACCENT + '44',
  },
  palmImage: { width: '100%', height: '100%' },
  imageOverlayRow: {
    position: 'absolute', bottom: 12, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  imageOverlayText: { fontSize: 12, color: ACCENT, fontWeight: '600' },

  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 22, overflow: 'hidden',
    marginBottom: 16,
  },
  analyzeBtnText: { fontSize: 15, fontWeight: '700', color: '#1A0A00' },

  loadingCard: {
    alignItems: 'center', paddingVertical: 20, marginBottom: 12,
    borderWidth: 1, borderColor: ACCENT + '33', borderRadius: 16,
    backgroundColor: 'rgba(128,128,128,0.07)',
  },
  loadingText: { fontSize: 13, color: ACCENT + '99', fontStyle: 'italic' },

  resultCard: {
    borderWidth: 1, borderColor: ACCENT + '44', borderRadius: 20,
    padding: 18, overflow: 'hidden', marginBottom: 16,
    backgroundColor: 'rgba(128,128,128,0.07)',
  },
  resultTitle: { fontSize: 16, fontWeight: '700', color: ACCENT },
  resultText: { fontSize: 14, color: 'rgba(255,255,255,0.82)', lineHeight: 24 },
  resetBtn: {
    marginTop: 16, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: ACCENT + '55',
    backgroundColor: ACCENT + '14',
  },
  resetBtnText: { fontSize: 13, fontWeight: '600', color: ACCENT },

  emptyState: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: 'rgba(255,255,255,0.70)', marginBottom: 10 },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.40)', lineHeight: 22, textAlign: 'center' },

  sectionCard: {
    borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 10,
    backgroundColor: 'rgba(128,128,128,0.05)',
  },
  lineBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1,
  },
  lineBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  chambersCard: {
    borderWidth: 1, borderColor: ACCENT + '33', borderRadius: 22, padding: 18, overflow: 'hidden',
    backgroundColor: 'rgba(128,128,128,0.06)', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 8 },
  },
  sectionEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2.1, color: ACCENT, marginBottom: 10 },
  chambersGrid: { gap: 10 },
  chamberTile: { borderWidth: 1, borderColor: ACCENT + '22', borderRadius: 16, padding: 14, backgroundColor: 'rgba(255,255,255,0.03)' },
  chamberTitle: { fontSize: 14, fontWeight: '700', color: ACCENT, marginTop: 10 },
  chamberCopy: { fontSize: 12.5, lineHeight: 19, color: 'rgba(255,255,255,0.72)', marginTop: 6 },
});
