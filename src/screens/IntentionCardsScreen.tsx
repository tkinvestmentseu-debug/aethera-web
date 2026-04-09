// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput,
  KeyboardAvoidingView, Platform, Modal, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MysticalInput } from '../components/MysticalInput';
import Svg, {
  Circle as SvgCircle,
  Defs,
  RadialGradient as SvgRadialGradient,
  Rect as SvgRect,
  Stop,
  Text as SvgText,
  Line as SvgLine,
  Polygon as SvgPolygon,
} from 'react-native-svg';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { ArrowRight, ChevronLeft, Star, Trash2, Sparkles, X, Flame, Eye, Moon, CheckCircle2, RotateCcw, BookOpen, Wind } from 'lucide-react-native';

import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const ACCENT = '#F59E0B';
const SP = layout.padding.screen;
const SW = Dimensions.get('window').width;

const INTENTION_TIPS = [
  { title: 'Czytaj kartę rano', body: 'Przez pierwsze 3 minuty po przebudzeniu Twój umysł jest najbardziej podatny na sugestię. To najlepszy moment, by przeczytać swoją kartę i ustawić ton dnia.' },
  { title: 'Jedno słowo — jeden oddech', body: 'Zamiast czytać całe zdanie, weź jeden kluczowy wyraz z karty i powtórz go z każdym wydechem przez minutę. To osadza intencję głębiej niż wielokrotne czytanie.' },
  { title: 'Połącz kartę z gestem', body: 'Wybierz prosty gest — dłoń na sercu, palce skrzyżowane, delikatne dotknięcie nadgarstka. Wykonuj go zawsze gdy patrzysz na kartę. Z czasem sam gest przywróci Ci intencję.' },
  { title: 'Intencja to kierunek, nie wynik', body: 'Karty działają najlepiej, gdy opisują postawę — "Działam z klarownością" — a nie cel — "Dostanę awans". Kierunek tworzy nowe ścieżki. Cele zamykają na inne możliwości.' },
  { title: 'Wieczorne zamknięcie', body: 'Przed snem zapytaj siebie: w którym momencie dnia moja intencja była żywa? W którym zasnęła? To pytanie uczy Cię, kiedy i jak naprawdę działasz według swoich postanowień.' },
  { title: 'Kolor jako kotwica', body: 'Kolor karty to nie tylko estetyka — to kodowanie emocjonalne. Gdy w ciągu dnia zobaczysz "swój" kolor na ubraniu, kubku lub ścianie, potraktuj to jako sygnał powrotu do intencji.' },
];

const INTENTION_CATEGORIES = [
  { id: 'all', label: 'Wszystkie', emoji: '✦', color: '#F59E0B' },
  { id: 'kariera', label: 'Kariera', emoji: '🚀', color: '#60A5FA' },
  { id: 'milosc', label: 'Miłość', emoji: '♡', color: '#F472B6' },
  { id: 'zdrowie', label: 'Zdrowie', emoji: '🌿', color: '#34D399' },
  { id: 'obfitosc', label: 'Obfitość', emoji: '🌟', color: '#CEAE72' },
  { id: 'wzrost', label: 'Wzrost', emoji: '🌱', color: '#A78BFA' },
  { id: 'wolnosc', label: 'Wolność', emoji: '🦋', color: '#38BDF8' },
];

const CATEGORY_PROMPTS: Record<string, string> = {
  kariera: 'sukces zawodowy, realizacja celów, przywództwo, produktywność',
  milosc: 'miłość, związki, serce otwarte, głęboka więź, harmonia',
  zdrowie: 'zdrowie, witalność, uzdrowienie, energia ciała, równowaga',
  obfitosc: 'obfitość, dostatek, manifestacja, przepływ, bogactwo',
  wzrost: 'wzrost duchowy, mądrość, transformacja, świadomość, ewolucja',
  wolnosc: 'wolność, lekkość, autentyczność, odwaga, nowe horyzonty',
  all: 'intencja, duchowy kierunek, świadome życie, manifestacja',
};

const INTENTION_QUICK_LINKS = [
  { label: 'Fazy Księżyca', sublabel: 'Ustaw intencję w nowiu', route: 'LunarCalendar', color: '#818CF8' },
  { label: 'Medytacja', sublabel: 'Ugruntuj intencję ciałem', route: 'Meditation', color: '#34D399' },
  { label: 'Dziennik', sublabel: 'Zapisz: co chce się zamanifestować?', route: 'JournalEntry', params: { type: 'reflection', prompt: 'Jaka intencja chce się teraz zamanifestować w moim życiu?' }, color: ACCENT },
];

const ICON_OPTIONS = [
  { id: 'sparkles', glyph: '✦' },
  { id: 'star', glyph: '★' },
  { id: 'moon', glyph: '☽' },
  { id: 'sun', glyph: '☀' },
  { id: 'heart', glyph: '♡' },
  { id: 'leaf', glyph: '✿' },
  { id: 'zap', glyph: '⚡' },
  { id: 'shield', glyph: '⬡' },
  { id: 'infinity', glyph: '∞' },
  { id: 'eye', glyph: '◉' },
  { id: 'crown', glyph: '♛' },
  { id: 'lotus', glyph: '❋' },
];

const COLOR_OPTIONS = [
  '#F59E0B', '#818CF8', '#F472B6', '#34D399',
  '#CEAE72', '#60A5FA', '#A78BFA', '#F87171',
  '#38BDF8', '#86EFAC',
];

const ACTIVATION_AFFIRMATIONS = [
  'Ta karta jest aktywna. Jej energia przepływa przez mój dzień.',
  'Zapieczętowane. Intencja jest teraz żywa w polu energetycznym.',
  'Moc tej intencji wzrasta z każdą godziną.',
  'Wybieram ten kierunek świadomie i z pełnym zaangażowaniem.',
];

// ─── Nów Księżyca spread ───────────────────────────────────────────────────
const NOW_SPREAD = [
  { pos: 'I', title: 'Czego pragnę', desc: 'Nasiono tej intencji — co chcę zasadzić w nowym cyklu.' },
  { pos: 'II', title: 'Co sadzę', desc: 'Działanie, które uruchamiam już teraz, by intencja miała grunt.' },
  { pos: 'III', title: 'Co pielęgnuję', desc: 'Nawyk lub praktyka, która nakarmi ten wzrost każdego dnia.' },
  { pos: 'IV', title: 'Co zbiorę', desc: 'Plon, który pojawi się pod koniec cyklu księżycowego.' },
  { pos: 'V', title: 'Moje zobowiązanie', desc: 'Jedno konkretne przyrzeczenie, które składam sobie w tym nowiu.' },
];

// ─── Pełnia Księżyca spread ────────────────────────────────────────────────
const PELNIA_SPREAD = [
  { pos: 'I', title: 'Co trzymam', desc: 'To, co przyniosłem/am do tej pełni — wynik cyklu.' },
  { pos: 'II', title: 'Co uwolnię', desc: 'Przekonanie lub wzorzec gotowy do opuszczenia.' },
  { pos: 'III', title: 'Lekcja', desc: 'Mądrość wyciągnięta z tego cyklu — co ten czas mnie nauczył.' },
  { pos: 'IV', title: 'Co pozostaje', desc: 'Rdzeń, który niosę ze sobą w kolejny cykl.' },
  { pos: 'V', title: 'Błogosławieństwo', desc: 'Dar pełni — co ta energia otwiera lub ofiarowuje teraz.' },
];

// ─── Rytuał intencji steps ─────────────────────────────────────────────────
const RITUAL_STEPS = [
  {
    num: 1, title: 'Świeca', icon: '🕯',
    desc: 'Zapal świecę i patrz na płomień przez 60 sekund. Nie myśl — tylko obserwuj. Płomień jest teraz świadkiem Twojej intencji.',
  },
  {
    num: 2, title: 'Oddech', icon: '🌬',
    desc: 'Weź trzy głębokie oddechy: wdech 4 sekundy, zatrzymanie 4, wydech 6. Przy każdym wydechu wyobraź sobie, że wypuszczasz opór i wątpliwości.',
  },
  {
    num: 3, title: 'Deklaracja', icon: '📜',
    desc: 'Wypowiedz lub napisz swoją intencję na głos. Słowa wypowiedziane w obecności ognia i skupionego oddechu mają większą moc osadzenia niż zapisane w ciszy.',
  },
  {
    num: 4, title: 'Zamknięcie', icon: '✦',
    desc: 'Połóż dłoń na sercu i powiedz: "Ta intencja jest teraz żywa i działa przeze mnie." Zdmuchnij lub zagaś świecę, celebrując zakończenie rytuału.',
  },
];

const MAX_CHARS = 80;
const CARD_W = 150;
const CARD_H = 210;

// ─── helpers ────────────────────────────────────────────────────────────────
function getStreak(cards: any[]): number {
  if (!cards.length) return 0;
  const dates = new Set(cards.map((c) => c.createdAt?.split('T')[0]).filter(Boolean));
  const today = new Date();
  let streak = 0;
  let d = new Date(today);
  while (true) {
    const key = d.toISOString().split('T')[0];
    if (dates.has(key)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

// ─── background ─────────────────────────────────────────────────────────────
const IntentionCardsBg = ({ isLight }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={isLight ? ['#FFFBF0', '#FEF6E4', '#FDF0D5'] : ['#080608', '#100C14', '#18121E']} style={StyleSheet.absoluteFill} />
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <SvgRadialGradient id="iglow" cx="50%" cy="28%" r="42%">
          <Stop offset="0%" stopColor={ACCENT} stopOpacity={isLight ? '0.06' : '0.07'} />
          <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </SvgRadialGradient>
      </Defs>
      <SvgRect x="0" y="0" width="390" height="844" fill="url(#iglow)" />
      {Array.from({ length: 5 }, (_, i) => (
        <SvgCircle key={i} cx={195} cy={180} r={60 + i * 45} fill="none" stroke={ACCENT} strokeWidth={0.5} strokeOpacity={isLight ? 0.06 : 0.05} />
      ))}
    </Svg>
  </View>
);

// ─── sacred geometry back face ───────────────────────────────────────────────
const SacredGeometryBack = ({ W, H, color }) => (
  <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Defs>
      <SvgRadialGradient id="sgbg" cx="50%" cy="50%" r="60%">
        <Stop offset="0%" stopColor={color} stopOpacity="0.22" />
        <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
      </SvgRadialGradient>
    </Defs>
    <SvgRect x={0} y={0} width={W} height={H} rx={16} fill={`url(#sgbg)`} />
    <SvgRect x={1} y={1} width={W - 2} height={H - 2} rx={15} fill="none" stroke={color} strokeWidth={1.2} strokeOpacity={0.55} />
    <SvgRect x={8} y={8} width={W - 16} height={H - 16} rx={10} fill="none" stroke={color} strokeWidth={0.5} strokeOpacity={0.28} />
    {/* Flower of life circles */}
    {[0, 60, 120, 180, 240, 300].map((deg, i) => {
      const rad = (deg * Math.PI) / 180;
      const r = 22;
      const cx = W / 2 + r * Math.cos(rad);
      const cy = H / 2 + r * Math.sin(rad);
      return <SvgCircle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={0.6} strokeOpacity={0.30} />;
    })}
    <SvgCircle cx={W / 2} cy={H / 2} r={22} fill="none" stroke={color} strokeWidth={0.6} strokeOpacity={0.30} />
    {/* Star of David */}
    {[0, 60, 120, 180, 240, 300].map((deg, i) => {
      const rad = (deg * Math.PI) / 180;
      const x1 = W / 2 + 38 * Math.cos(rad);
      const y1 = H / 2 + 38 * Math.sin(rad);
      const x2 = W / 2 + 38 * Math.cos(rad + Math.PI);
      const y2 = H / 2 + 38 * Math.sin(rad + Math.PI);
      return <SvgLine key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={0.5} strokeOpacity={0.20} />;
    })}
    <SvgText x={W / 2} y={H / 2 + 6} textAnchor="middle" fontSize={18} fill={color} opacity={0.70}>✦</SvgText>
  </Svg>
);

// ─── card preview ───────────────────────────────────────────────────────────
const CardPreview = React.memo(({ color, glyph, text, size = 'large', category = null }) => {
  const W = size === 'large' ? CARD_W : size === 'detail' ? SW * 0.55 : 90;
  const H = size === 'large' ? CARD_H : size === 'detail' ? SW * 0.77 : 126;
  const pulse = useSharedValue(1);
  const catEmoji = INTENTION_CATEGORIES.find((c) => c.id === category)?.emoji ?? null;

  useEffect(() => {
    if (size !== 'small') {
      pulse.value = withRepeat(withSequence(withTiming(1.03, { duration: 2000 }), withTiming(1, { duration: 2000 })), -1, true);
    }
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Animated.View style={[{ width: W, height: H }, size !== 'small' && pulseStyle]}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <SvgRadialGradient id={`cg${color.replace('#', '')}`} cx="40%" cy="35%" r="60%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.15" />
          </SvgRadialGradient>
        </Defs>
        <SvgRect x={1} y={1} width={W - 2} height={H - 2} rx={16} ry={16} fill={`url(#cg${color.replace('#', '')})`} stroke={color} strokeWidth={1.5} strokeOpacity={0.6} />
        <SvgRect x={6} y={6} width={W - 12} height={H - 12} rx={12} ry={12} fill="none" stroke={color} strokeWidth={0.7} strokeOpacity={0.3} />
        <SvgText x={W / 2} y={H * 0.42} textAnchor="middle" fontSize={size === 'large' ? 36 : size === 'detail' ? 48 : 22} fill={color} opacity={0.9}>{glyph || '✦'}</SvgText>
        <SvgRect x={W * 0.2} y={H * 0.54} width={W * 0.6} height={0.8} fill={color} opacity={0.35} />
        {text ? (() => {
          const words = text.trim().split(' ');
          const lines = [];
          let cur = '';
          const maxW = size === 'detail' ? 22 : size === 'large' ? 18 : 11;
          for (const w of words) {
            if ((cur + ' ' + w).trim().length <= maxW) cur = (cur + ' ' + w).trim();
            else { if (cur) lines.push(cur); cur = w; }
          }
          if (cur) lines.push(cur);
          const lineH = size === 'detail' ? 20 : size === 'large' ? 16 : 11;
          const startY = H * 0.62 + (lines.length - 1) * -lineH / 2;
          return lines.slice(0, size === 'detail' ? 5 : size === 'large' ? 4 : 3).map((ln, i) => (
            <SvgText key={i} x={W / 2} y={startY + i * lineH} textAnchor="middle"
              fontSize={size === 'detail' ? 13 : size === 'large' ? 10.5 : 7.5}
              fill={color} opacity={0.85} fontWeight="600">{ln}</SvgText>
          ));
        })() : null}
        {catEmoji && (
          <SvgText x={W - 18} y={20} textAnchor="middle" fontSize={size === 'detail' ? 14 : 10} opacity={0.85}>{catEmoji}</SvgText>
        )}
      </Svg>
    </Animated.View>
  );
});

// ─── Animated 3D flip hero card ───────────────────────────────────────────────
const FlipHeroCard = ({ color, glyph, text, isLight }) => {
  const { t } = useTranslation();

  const rotateY = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);
  const W = SW - SP * 2;
  const H = W * 1.4;

  const frontStyle = useAnimatedStyle(() => ({
    backfaceVisibility: 'hidden',
    transform: [{ perspective: 1200 }, { rotateY: `${rotateY.value}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0, left: 0, width: W, height: H,
    transform: [{ perspective: 1200 }, { rotateY: `${rotateY.value + 180}deg` }],
  }));

  const handleFlip = () => {
    HapticsService.impact('medium');
    const target = flipped ? 0 : 180;
    rotateY.value = withTiming(target, { duration: 600 });
    setFlipped(!flipped);
  };

  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <Text style={[s.sectionLabel, { color: ACCENT, marginBottom: 12 }]}>{t('intentionCards.karta_intencji_dotknij_aby_odwrocic', '✦ KARTA INTENCJI — DOTKNIJ ABY ODWRÓCIĆ')}</Text>
      <Pressable onPress={handleFlip} style={{ width: W, height: H }}>
        {/* Front face — intention text */}
        <Animated.View style={[{ width: W, height: H }, frontStyle]}>
          <LinearGradient
            colors={[color + 'CC', color + '55', color + '22']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={[s.flipCard, { width: W, height: H }]}
          >
            <Text style={[s.flipGlyph, { color }]}>{glyph}</Text>
            <View style={[s.flipDivider, { backgroundColor: color + '66' }]} />
            <Text style={[s.flipText, isLight && { color: 'rgba(37,29,22,0.88)' }]}>{text || 'Twoja intencja pojawi się tutaj'}</Text>
            <Text style={[s.flipHint, { color: isLight ? 'rgba(37,29,22,0.5)' : 'rgba(255,255,255,0.50)' }]}>{t('intentionCards.dotknij_by_zobaczyc_geometrie', 'Dotknij, by zobaczyć geometrię')}</Text>
          </LinearGradient>
        </Animated.View>
        {/* Back face — sacred geometry */}
        <Animated.View style={backStyle}>
          <LinearGradient
            colors={isLight ? ['#FDF5E0', '#F5E8C0'] : ['#12080F', '#1E1028']}
            style={[s.flipCard, { width: W, height: H }]}
          >
            <SacredGeometryBack W={W} H={H} color={color} />
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 28 }]}>
              <Text style={[s.flipHint, { color: color + 'CC' }]}>{t('intentionCards.geometria_tej_intencji', 'Geometria tej intencji')}</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <RotateCcw size={13} color={ACCENT + 'AA'} />
        <Text style={[s.flipHint, { color: ACCENT + 'AA' }]}>{flipped ? 'Przód — intencja' : 'Tył — święta geometria'}</Text>
      </View>
    </View>
  );
};

// ─── Spread position card ─────────────────────────────────────────────────────
const SpreadPositionCard = ({ item, color, isLight }) => {
  const textColor = isLight ? '#1A1108' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.62)' : 'rgba(255,255,255,0.62)';
  return (
    <View style={[s.spreadPosCard, {
      backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.05)',
      borderColor: color + '44',
    }]}>
      <LinearGradient colors={[color + '18', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      <View style={[s.spreadPosBadge, { backgroundColor: color + '28', borderColor: color + '55' }]}>
        <Text style={[s.spreadPosNum, { color }]}>{item.pos}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.spreadPosTitle, { color: textColor }]}>{item.title}</Text>
        <Text style={[s.spreadPosDesc, { color: subColor }]}>{item.desc}</Text>
      </View>
    </View>
  );
};

// ─── gallery card ────────────────────────────────────────────────────────────
const GalleryCard = ({ item, onDelete, onPress }) => {
  const iconGlyph = ICON_OPTIONS.find((o) => o.id === item.icon)?.glyph ?? '✦';
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={[s.galleryCard, { borderColor: item.color + '44' }]}>
      <Pressable onPress={() => onPress(item)} style={{ alignItems: 'center' }}>
        <CardPreview color={item.color} glyph={iconGlyph} text={item.text} size="small" category={item.category} />
        <Pressable onPress={() => { HapticsService.impact('light'); onDelete(item.id); }} style={[s.deleteBtn, { backgroundColor: 'rgba(239,68,68,0.15)' }]} hitSlop={8}>
          <Trash2 size={13} color="#EF4444" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};

// ─── main screen ─────────────────────────────────────────────────────────────
export const IntentionCardsScreen = ({ navigation }) => {
  const { t } = useTranslation();
    const intentionCards = useAppStore(s => s.intentionCards);
  const addIntentionCard = useAppStore(s => s.addIntentionCard);
  const deleteIntentionCard = useAppStore(s => s.deleteIntentionCard);
  const { currentTheme, isLight } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const textColor = isLight ? '#1A1108' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.62)' : 'rgba(255,255,255,0.62)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(83,57,17,0.12)' : 'rgba(255,255,255,0.10)';
  const modalBg = isLight ? '#FBF5E8' : '#0F0A18';

  const [text, setText] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('sparkles');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  const [detailCard, setDetailCard] = useState(null);
  const [activating, setActivating] = useState(false);
  const activateScale = useSharedValue(1);

  // ── Weekly intentions state ────────────────────────────────────────────────
  const [weeklyIntentions, setWeeklyIntentions] = useState([
    { id: 'w1', text: '', manifesting: false },
    { id: 'w2', text: '', manifesting: false },
    { id: 'w3', text: '', manifesting: false },
  ]);
  const [weeklyEditIdx, setWeeklyEditIdx] = useState<number | null>(null);
  const [weeklyInput, setWeeklyInput] = useState('');

  // ── Ritual state ───────────────────────────────────────────────────────────
  const [ritualStep, setRitualStep] = useState(0);
  const [ritualActive, setRitualActive] = useState(false);
  const [ritualDone, setRitualDone] = useState(false);

  // ── Historia intencji ──────────────────────────────────────────────────────
  const [fulfilledIds, setFulfilledIds] = useState<Set<string>>(new Set());

  const selectedGlyph = ICON_OPTIONS.find((o) => o.id === selectedIcon)?.glyph ?? '✦';
  const streak = getStreak(intentionCards);

  const filteredCards = filterCategory === 'all'
    ? intentionCards
    : intentionCards.filter((c) => c.category === filterCategory);

  const historyCards = intentionCards.slice(0, 10);

  const focusIntoView = (y = 280) => requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: Math.max(y - 150, 0), animated: true }));

  const handleSave = () => {
    if (!text.trim()) return;
    HapticsService.impact('medium');
    addIntentionCard({ text: text.trim(), icon: selectedIcon, color: selectedColor, category: selectedCategory });
    setText('');
    setAiSuggestion('');
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    HapticsService.notify();
  };

  const handleDelete = (id) => Alert.alert(t('intentionCards.usun_karte_1', 'Usuń kartę'), t('intentionCards.na_pewno_usunac_te_karte', 'Na pewno usunąć tę kartę intencji?'), [
    { text: 'Anuluj', style: 'cancel' },
    { text: 'Usuń', style: 'destructive', onPress: () => deleteIntentionCard(id) },
  ]);

  const generateAffirmation = useCallback(async () => {
    const catContext = CATEGORY_PROMPTS[selectedCategory] ?? CATEGORY_PROMPTS.all;
    const userText = text.trim();
    setAiLoading(true);
    HapticsService.impact('light');
    try {
      const messages = [{
        role: 'user' as const,
        content: `Jesteś mistrzem manifestacji i tworzenia intencji duchowych. Napisz JEDNĄ krótką, potężną afirmację (max 12 słów) w języku użytkownika, idealną na kartę intencji.
Obszar: ${catContext}.
${userText ? `Kontekst użytkownika: "${userText}".` : ''}
Zasady: zacznij od "Ja " lub czasownika, bądź teraźniejsza, konkretna, pełna mocy. Bez cudzysłowów. Tylko samo zdanie.`,
      }];
      const resp = await AiService.chatWithOracle(messages);
      const cleaned = resp.replace(/["""„]/g, '').trim();
      setAiSuggestion(cleaned);
    } catch {
      setAiSuggestion('Jestem w przepływie i realizuję swoje najwyższe powołanie.');
    } finally {
      setAiLoading(false);
    }
  }, [selectedCategory, text]);

  const handleActivate = useCallback(() => {
    if (!detailCard) return;
    setActivating(true);
    HapticsService.impact('heavy');
    activateScale.value = withSequence(withSpring(1.08, { damping: 4 }), withSpring(1, { damping: 10 }));
    setTimeout(() => {
      setActivating(false);
      HapticsService.notify();
    }, 1800);
  }, [detailCard]);

  const activateStyle = useAnimatedStyle(() => ({ transform: [{ scale: activateScale.value }] }));

  // ── Weekly intentions helpers ──────────────────────────────────────────────
  const saveWeeklyIntention = (idx: number) => {
    if (!weeklyInput.trim()) { setWeeklyEditIdx(null); return; }
    const updated = weeklyIntentions.map((wi, i) =>
      i === idx ? { ...wi, text: weeklyInput.trim(), manifesting: false } : wi
    );
    setWeeklyIntentions(updated);
    setWeeklyEditIdx(null);
    setWeeklyInput('');
    HapticsService.impact('light');
  };

  const toggleManifesting = (idx: number) => {
    HapticsService.impact('medium');
    setWeeklyIntentions((prev) => prev.map((wi, i) =>
      i === idx ? { ...wi, manifesting: !wi.manifesting } : wi
    ));
  };

  // ── Ritual helpers ─────────────────────────────────────────────────────────
  const startRitual = () => {
    setRitualActive(true);
    setRitualStep(0);
    setRitualDone(false);
    HapticsService.impact('medium');
  };
  const advanceRitual = () => {
    if (ritualStep < RITUAL_STEPS.length - 1) {
      setRitualStep((s) => s + 1);
      HapticsService.impact('light');
    } else {
      setRitualDone(true);
      HapticsService.notify();
    }
  };
  const resetRitual = () => {
    setRitualActive(false);
    setRitualStep(0);
    setRitualDone(false);
  };

  // ── Historia toggle ────────────────────────────────────────────────────────
  const toggleFulfilled = (id: string) => {
    HapticsService.impact('light');
    setFulfilledIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const moonDay = new Date().getDate();
  const isNowPhase = moonDay <= 2 || moonDay >= 30;
  const isPelniaPhase = moonDay >= 14 && moonDay <= 17;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <SafeAreaView style={[s.root, { backgroundColor: currentTheme.background }]} edges={['top']}>
        <IntentionCardsBg isLight={isLight} />

        {/* Header */}
        <View style={[s.header, { paddingHorizontal: SP }]}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={s.backBtn} hitSlop={12}>
            <ChevronLeft size={22} color={textColor} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[s.headerEyebrow, { color: ACCENT }]}>{t('intentionCards.kreator', 'KREATOR')}</Text>
            <Text style={[s.headerTitle, { color: textColor }]}>{t('intentionCards.karty_intencji', 'Karty Intencji')}</Text>
          </View>
          {streak > 0 ? (
            <Pressable style={[s.streakBadge, { borderColor: ACCENT + '55', backgroundColor: ACCENT + '18' }]}>
              <Flame size={14} color={ACCENT} />
              <Text style={[s.streakNum, { color: ACCENT }]}>{streak}</Text>
            </Pressable>
          ) : <View style={{ width: 44 }} />}
        </View>

        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <Animated.View entering={FadeInDown.duration(500)} style={[s.heroCard, { backgroundColor: isLight ? 'rgba(255,248,236,0.82)' : 'rgba(21,15,26,0.82)', borderColor: cardBorder, marginHorizontal: SP }]}>
            <Text style={[s.heroEyebrow, { color: ACCENT }]}>{t('intentionCards.przestrzen_intencji', 'PRZESTRZEŃ INTENCJI')}</Text>
            <Text style={[s.heroTitle, { color: textColor }]}>{t('intentionCards.tworzysz_karte_ktora_ma_dzialac', 'Tworzysz kartę, która ma działać jak osobisty talizman kierunku.')}</Text>
            <Text style={[s.heroBody, { color: subColor }]}>{t('intentionCards.jedno_zdanie_jeden_symbol_i', 'Jedno zdanie, jeden symbol i jeden kolor wystarczą, żeby intencja miała własną aurę i wracała do Ciebie w ciągu dnia.')}</Text>
            {streak > 0 && (
              <View style={[s.streakRow, { borderColor: ACCENT + '44', backgroundColor: ACCENT + '12' }]}>
                <Flame size={15} color={ACCENT} />
                <Text style={[s.streakRowText, { color: ACCENT }]}>Seria {streak} {streak === 1 ? 'dzień' : streak < 5 ? 'dni' : 'dni'} z rzędu — Twoje intencje nabierają mocy!</Text>
              </View>
            )}
          </Animated.View>

          {/* ── 3D Flip Hero Card ─────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(60).duration(600)} style={{ marginHorizontal: SP }}>
            <FlipHeroCard
              color={selectedColor}
              glyph={selectedGlyph}
              text={aiSuggestion || text}
              isLight={isLight}
            />
          </Animated.View>

          {/* Preview deck */}
          <Animated.View entering={FadeInDown.delay(80).duration(500)} style={[s.previewDeck, { backgroundColor: isLight ? 'rgba(255,252,245,0.82)' : 'rgba(18,14,24,0.82)', borderColor: cardBorder, marginHorizontal: SP }]}>
            <Text style={[s.sectionLabel, { color: ACCENT }]}>{t('intentionCards.podglad_rytualu', 'PODGLĄD RYTUAŁU')}</Text>
            <Text style={[s.sectionBody, { color: subColor }]}>{t('intentionCards.ta_karta_ma_wygladac_jak', 'Ta karta ma wyglądać jak osobisty artefakt, nie jak prosty formularz. Zmieniaj symbol i kolor, aż poczujesz właściwe napięcie.')}</Text>
            <View style={s.previewRail}>
              {[selectedColor, '#CEAE72', '#818CF8'].map((color, idx) => (
                <View key={color + '-' + idx} style={s.previewMini}>
                  <CardPreview color={color} glyph={idx === 0 ? selectedGlyph : idx === 1 ? '☽' : '✦'} text={idx === 0 ? (aiSuggestion || text || 'Twoja intencja') : idx === 1 ? 'Zaufaj rytmowi' : 'Kieruj energię'} size="small" />
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Creator card */}
          <View style={[s.creatorCard, { backgroundColor: cardBg, borderColor: cardBorder, marginHorizontal: SP }]}>

            {/* Category chips */}
            <Text style={[s.sectionLabel, { color: ACCENT }]}>{t('intentionCards.obszar_intencji', 'OBSZAR INTENCJI')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8, paddingRight: 22 }}>
              {INTENTION_CATEGORIES.map((cat) => (
                <Pressable key={cat.id} onPress={() => { setSelectedCategory(cat.id); HapticsService.impact('light'); setAiSuggestion(''); }}
                  style={[s.catChip, {
                    backgroundColor: selectedCategory === cat.id ? cat.color + '28' : (isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.07)'),
                    borderColor: selectedCategory === cat.id ? cat.color : (isLight ? 'rgba(83,57,17,0.12)' : 'rgba(255,255,255,0.12)'),
                  }]}>
                  <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                  <Text style={[s.catLabel, { color: selectedCategory === cat.id ? cat.color : subColor, fontWeight: selectedCategory === cat.id ? '700' : '500' }]}>{cat.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[s.sectionLabel, { color: ACCENT }]}>{t('intentionCards.tresc_intencji', 'TREŚĆ INTENCJI')}</Text>
            <Text style={[s.sectionBody, { color: subColor }]}>{t('intentionCards.najmocniej_dziala_zdanie_ktore_mozn', 'Najmocniej działa zdanie, które można poczuć od razu po przeczytaniu.')}</Text>
            <MysticalInput
              value={text}
              onChangeText={(v) => { setText(v.slice(0, MAX_CHARS)); setAiSuggestion(''); }}
              placeholder={t('intentionCards.wpisz_swoja_intencje', 'Wpisz swoją intencję...')}
              placeholderTextColor={subColor}
              multiline
              onFocusScroll={() => focusIntoView()}
              style={{ color: textColor, minHeight: 80, fontSize: 15, lineHeight: 24 }}
              containerStyle={{ marginBottom: 4 }}
            />
            <Text style={[s.charCount, { color: subColor }]}>{text.length}/{MAX_CHARS}</Text>

            {/* AI Affirmation Generator */}
            <Pressable onPress={generateAffirmation} disabled={aiLoading}
              style={[s.aiBtn, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '55', opacity: aiLoading ? 0.7 : 1 }]}>
              {aiLoading ? (
                <ActivityIndicator size="small" color={ACCENT} />
              ) : (
                <Sparkles size={15} color={ACCENT} />
              )}
              <Text style={[s.aiBtnText, { color: ACCENT }]}>
                {aiLoading ? 'Generuję afirmację...' : 'Wygeneruj afirmację AI'}
              </Text>
            </Pressable>
            {aiSuggestion ? (
              <Animated.View entering={FadeIn.duration(400)} style={[s.suggestionCard, { backgroundColor: ACCENT + '14', borderColor: ACCENT + '44' }]}>
                <Text style={[s.suggestionLabel, { color: ACCENT }]}>{t('intentionCards.propozycja_ai', 'PROPOZYCJA AI')}</Text>
                <Text style={[s.suggestionText, { color: textColor }]}>"{aiSuggestion}"</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <Pressable onPress={() => { setText(aiSuggestion); setAiSuggestion(''); HapticsService.impact('light'); }}
                    style={[s.suggCta, { backgroundColor: ACCENT + '28', borderColor: ACCENT + '55', flex: 1 }]}>
                    <Text style={[s.suggCtaText, { color: ACCENT }]}>{t('intentionCards.uzyj_tej_tresci', 'Użyj tej treści')}</Text>
                  </Pressable>
                  <Pressable onPress={generateAffirmation}
                    style={[s.suggCta, { backgroundColor: 'transparent', borderColor: ACCENT + '33', flex: 1 }]}>
                    <Text style={[s.suggCtaText, { color: subColor }]}>{t('intentionCards.inna_propozycja', 'Inna propozycja')}</Text>
                  </Pressable>
                </View>
              </Animated.View>
            ) : null}

            {/* Icon selector */}
            <Text style={[s.sectionLabel, { color: ACCENT, marginTop: 16 }]}>{t('intentionCards.ikona', 'IKONA')}</Text>
            <View style={s.iconRow}>
              {ICON_OPTIONS.map((opt) => (
                <Pressable key={opt.id} onPress={() => { setSelectedIcon(opt.id); HapticsService.impact('light'); focusIntoView(240); }}
                  style={[s.iconChip, {
                    backgroundColor: selectedIcon === opt.id ? selectedColor + '33' : (isLight ? 'rgba(255,255,255,0.68)' : 'rgba(255,255,255,0.07)'),
                    borderColor: selectedIcon === opt.id ? selectedColor : (isLight ? 'rgba(83,57,17,0.12)' : 'rgba(255,255,255,0.12)'),
                  }]}>
                  <Text style={{ fontSize: 18 }}>{opt.glyph}</Text>
                </Pressable>
              ))}
            </View>

            {/* Color selector */}
            <Text style={[s.sectionLabel, { color: ACCENT, marginTop: 16 }]}>{t('intentionCards.kolor_karty', 'KOLOR KARTY')}</Text>
            <View style={s.colorRow}>
              {COLOR_OPTIONS.map((col) => (
                <Pressable key={col} onPress={() => { setSelectedColor(col); HapticsService.impact('light'); focusIntoView(240); }}
                  style={[s.colorChip, { backgroundColor: col }, selectedColor === col && s.colorChipSelected]}>
                  {selectedColor === col && <View style={s.colorCheckmark}><Text style={{ fontSize: 10, color: '#fff', fontWeight: '800' }}>✓</Text></View>}
                </Pressable>
              ))}
            </View>

            {/* Save button */}
            <Pressable onPress={handleSave} disabled={!text.trim() && !aiSuggestion}
              style={({ pressed }) => [s.saveBtn, { opacity: pressed || (!text.trim() && !aiSuggestion) ? 0.6 : 1 }]}>
              <LinearGradient colors={[selectedColor, selectedColor + 'AA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.saveBtnGrad}>
                <Star size={16} color="#fff" fill="#fff" />
                <Text style={s.saveBtnText}>{t('intentionCards.zapisz_karte', 'Zapisz kartę')}</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* ── Nów Księżyca Rozkład ─────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ marginTop: 28, marginHorizontal: SP }}>
            <View style={[s.moonSpreadHeader, { backgroundColor: isNowPhase ? '#818CF8' + '18' : cardBg, borderColor: isNowPhase ? '#818CF8' + '55' : cardBorder }]}>
              <Moon size={16} color="#818CF8" strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text style={[s.sectionLabel, { color: '#818CF8', marginBottom: 2 }]}>{t('intentionCards.now_ksiezyca_rozklad_intencji', 'NÓW KSIĘŻYCA — ROZKŁAD INTENCJI')}</Text>
                <Text style={[s.sectionBody, { color: subColor, marginBottom: 0 }]}>
                  {isNowPhase ? 'Nów księżyca jest teraz aktywny — to idealny moment na ten rozkład.' : 'Użyj w dniu nowiu, by zasadzić intencję w nowym cyklu.'}
                </Text>
              </View>
              {isNowPhase && (
                <View style={[s.activePhaseTag, { backgroundColor: '#818CF8' + '28', borderColor: '#818CF8' + '55' }]}>
                  <Text style={[s.activePhaseTagText, { color: '#818CF8' }]}>{t('intentionCards.aktywny', 'AKTYWNY')}</Text>
                </View>
              )}
            </View>
            {NOW_SPREAD.map((item, i) => (
              <Animated.View key={item.pos} entering={FadeInDown.delay(240 + i * 60).duration(500)}>
                <SpreadPositionCard item={item} color="#818CF8" isLight={isLight} />
              </Animated.View>
            ))}
          </Animated.View>

          {/* ── Pełnia Księżyca Rozkład ─────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(380).duration(600)} style={{ marginTop: 24, marginHorizontal: SP }}>
            <View style={[s.moonSpreadHeader, { backgroundColor: isPelniaPhase ? '#F59E0B' + '18' : cardBg, borderColor: isPelniaPhase ? '#F59E0B' + '55' : cardBorder }]}>
              <Text style={{ fontSize: 16 }}>🌕</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.sectionLabel, { color: ACCENT, marginBottom: 2 }]}>{t('intentionCards.pelnia_ksiezyca_rozklad_uwalniania', 'PEŁNIA KSIĘŻYCA — ROZKŁAD UWALNIANIA')}</Text>
                <Text style={[s.sectionBody, { color: subColor, marginBottom: 0 }]}>
                  {isPelniaPhase ? 'Pełnia księżyca jest teraz aktywna — czas na uwolnienie i wdzięczność.' : 'Użyj w dzień pełni, by podsumować cykl i świadomie uwolnić to, co już nie służy.'}
                </Text>
              </View>
              {isPelniaPhase && (
                <View style={[s.activePhaseTag, { backgroundColor: ACCENT + '28', borderColor: ACCENT + '55' }]}>
                  <Text style={[s.activePhaseTagText, { color: ACCENT }]}>{t('intentionCards.aktywny_1', 'AKTYWNY')}</Text>
                </View>
              )}
            </View>
            {PELNIA_SPREAD.map((item, i) => (
              <Animated.View key={item.pos} entering={FadeInDown.delay(420 + i * 60).duration(500)}>
                <SpreadPositionCard item={item} color={ACCENT} isLight={isLight} />
              </Animated.View>
            ))}
          </Animated.View>

          {/* ── Intencje Tygodnia ─────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(520).duration(600)} style={{ marginTop: 28, marginHorizontal: SP }}>
            <View style={[s.weeklyHeader, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <LinearGradient colors={['#34D399' + '18', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <CheckCircle2 size={15} color="#34D399" strokeWidth={1.5} />
                <Text style={[s.sectionLabel, { color: '#34D399', marginBottom: 0 }]}>{t('intentionCards.intencje_tygodnia', 'INTENCJE TYGODNIA')}</Text>
              </View>
              <Text style={[s.sectionBody, { color: subColor }]}>{t('intentionCards.ustaw_3_aktywne_intencje_na', 'Ustaw 3 aktywne intencje na ten tydzień. Kiedy poczujesz, że zaczynają się manifestować — oznacz je.')}</Text>
            </View>
            {weeklyIntentions.map((wi, idx) => (
              <Animated.View key={wi.id} entering={FadeInDown.delay(560 + idx * 70).duration(500)}>
                <View style={[s.weeklyItem, {
                  backgroundColor: wi.manifesting
                    ? '#34D399' + '14'
                    : (isLight ? 'rgba(240,228,210,0.90)' : 'rgba(255,255,255,0.05)'),
                  borderColor: wi.manifesting ? '#34D399' + '55' : cardBorder,
                }]}>
                  <View style={[s.weeklyNumBadge, { backgroundColor: '#34D399' + '22', borderColor: '#34D399' + '44' }]}>
                    <Text style={[s.weeklyNumText, { color: '#34D399' }]}>{idx + 1}</Text>
                  </View>
                  {weeklyEditIdx === idx ? (
                    <View style={{ flex: 1, gap: 8 }}>
                      <TextInput
                        value={weeklyInput}
                        onChangeText={setWeeklyInput}
                        placeholder={`Intencja ${idx + 1} na ten tydzień...`}
                        placeholderTextColor={subColor}
                        style={[s.weeklyInput, { color: textColor, borderColor: '#34D399' + '55', backgroundColor: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.07)' }]}
                        autoFocus
                        maxLength={60}
                      />
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable onPress={() => saveWeeklyIntention(idx)}
                          style={[s.weeklyConfirmBtn, { backgroundColor: '#34D399' + '28', borderColor: '#34D399' + '55' }]}>
                          <Text style={[s.weeklyConfirmText, { color: '#34D399' }]}>{t('intentionCards.zapisz', 'Zapisz')}</Text>
                        </Pressable>
                        <Pressable onPress={() => { setWeeklyEditIdx(null); setWeeklyInput(''); }}
                          style={[s.weeklyConfirmBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                          <Text style={[s.weeklyConfirmText, { color: subColor }]}>{t('intentionCards.anuluj', 'Anuluj')}</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable style={{ flex: 1 }} onPress={() => {
                      setWeeklyEditIdx(idx);
                      setWeeklyInput(wi.text);
                    }}>
                      <Text style={[s.weeklyText, {
                        color: wi.text ? (wi.manifesting ? '#34D399' : textColor) : subColor,
                        textDecorationLine: wi.manifesting ? 'line-through' : 'none',
                        fontStyle: wi.text ? 'normal' : 'italic',
                      }]}>
                        {wi.text || `Dotknij, by ustawić intencję ${idx + 1}...`}
                      </Text>
                    </Pressable>
                  )}
                  {wi.text && weeklyEditIdx !== idx && (
                    <Pressable onPress={() => toggleManifesting(idx)}
                      style={[s.manifestBtn, {
                        backgroundColor: wi.manifesting ? '#34D399' + '28' : (isLight ? 'rgba(255,246,230,0.92)' : 'rgba(255,255,255,0.08)'),
                        borderColor: wi.manifesting ? '#34D399' + '55' : cardBorder,
                      }]}>
                      <Text style={[s.manifestBtnText, { color: wi.manifesting ? '#34D399' : subColor, fontSize: 10 }]}>
                        {wi.manifesting ? '✦ Manifestuje się' : 'Oznacz'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* ── Rytuał Intencji ───────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(660).duration(600)} style={{ marginTop: 28, marginHorizontal: SP }}>
            <View style={[s.ritualContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <LinearGradient colors={[ACCENT + '14', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Flame size={15} color={ACCENT} strokeWidth={1.5} />
                <Text style={[s.sectionLabel, { color: ACCENT, marginBottom: 0 }]}>{t('intentionCards.rytual_intencji', 'RYTUAŁ INTENCJI')}</Text>
              </View>
              <Text style={[s.sectionBody, { color: subColor }]}>{t('intentionCards.czterostop_rytual_osadzajacy_intenc', 'Czterostopniowy rytuał osadzający intencję w ciele, oddechu i słowie.')}</Text>

              {!ritualActive && !ritualDone && (
                <Pressable onPress={startRitual}
                  style={[s.ritualStartBtn, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '55' }]}>
                  <Flame size={16} color={ACCENT} />
                  <Text style={[s.ritualStartText, { color: ACCENT }]}>{t('intentionCards.rozpocznij_rytual', 'Rozpocznij rytuał')}</Text>
                </Pressable>
              )}

              {ritualActive && !ritualDone && (
                <Animated.View entering={FadeIn.duration(400)}>
                  {/* Progress dots */}
                  <View style={s.ritualDots}>
                    {RITUAL_STEPS.map((_, i) => (
                      <View key={i} style={[s.ritualDot, {
                        backgroundColor: i <= ritualStep ? ACCENT : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'),
                        width: i === ritualStep ? 20 : 8,
                      }]} />
                    ))}
                  </View>
                  <LinearGradient
                    colors={[ACCENT + '28', ACCENT + '10']}
                    style={[s.ritualStepCard, { borderColor: ACCENT + '44' }]}
                  >
                    <Text style={s.ritualStepIcon}>{RITUAL_STEPS[ritualStep].icon}</Text>
                    <Text style={[s.ritualStepNum, { color: ACCENT }]}>KROK {RITUAL_STEPS[ritualStep].num} Z {RITUAL_STEPS.length}</Text>
                    <Text style={[s.ritualStepTitle, { color: textColor }]}>{RITUAL_STEPS[ritualStep].title}</Text>
                    <Text style={[s.ritualStepDesc, { color: subColor }]}>{RITUAL_STEPS[ritualStep].desc}</Text>
                  </LinearGradient>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <Pressable onPress={resetRitual}
                      style={[s.ritualNavBtn, { backgroundColor: cardBg, borderColor: cardBorder, flex: 1 }]}>
                      <Text style={[s.ritualNavText, { color: subColor }]}>{t('intentionCards.przerwij', 'Przerwij')}</Text>
                    </Pressable>
                    <Pressable onPress={advanceRitual}
                      style={[s.ritualNavBtn, { backgroundColor: ACCENT + '28', borderColor: ACCENT + '55', flex: 2 }]}>
                      <Text style={[s.ritualNavText, { color: ACCENT }]}>
                        {ritualStep < RITUAL_STEPS.length - 1 ? 'Następny krok →' : 'Zakończ rytuał ✦'}
                      </Text>
                    </Pressable>
                  </View>
                </Animated.View>
              )}

              {ritualDone && (
                <Animated.View entering={FadeIn.duration(500)} style={[s.ritualDoneCard, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '55' }]}>
                  <Text style={s.ritualDoneIcon}>✦</Text>
                  <Text style={[s.ritualDoneTitle, { color: ACCENT }]}>{t('intentionCards.rytual_zakonczony', 'Rytuał zakończony')}</Text>
                  <Text style={[s.ritualDoneDesc, { color: subColor }]}>{t('intentionCards.twoja_intencja_zostala_zapieczeto_w', 'Twoja intencja została zapieczętowana w rytuałem świecy, oddechu i słowa. Nosi ją teraz Twoje ciało.')}</Text>
                  <Pressable onPress={resetRitual}
                    style={[s.ritualRestartBtn, { borderColor: ACCENT + '44' }]}>
                    <Text style={[s.ritualNavText, { color: ACCENT }]}>{t('intentionCards.powtorz_rytual', 'Powtórz rytuał')}</Text>
                  </Pressable>
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {/* Gallery */}
          {intentionCards.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ marginTop: 28 }}>
              {/* Filter chips */}
              <View style={{ paddingHorizontal: SP, marginBottom: 10 }}>
                <Text style={[s.galleryTitle, { color: textColor, marginBottom: 8 }]}>MOJE KARTY <Text style={{ color: subColor }}>({filteredCards.length})</Text></Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {INTENTION_CATEGORIES.map((cat) => {
                    const count = cat.id === 'all' ? intentionCards.length : intentionCards.filter((c) => c.category === cat.id).length;
                    if (count === 0 && cat.id !== 'all') return null;
                    return (
                      <Pressable key={cat.id} onPress={() => setFilterCategory(cat.id)}
                        style={[s.filterChip, {
                          backgroundColor: filterCategory === cat.id ? cat.color + '28' : (isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.07)'),
                          borderColor: filterCategory === cat.id ? cat.color : (isLight ? 'rgba(83,57,17,0.12)' : 'rgba(255,255,255,0.12)'),
                        }]}>
                        <Text style={{ fontSize: 11 }}>{cat.emoji}</Text>
                        <Text style={[s.filterChipText, { color: filterCategory === cat.id ? cat.color : subColor }]}>{cat.label} {count > 0 && `(${count})`}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
              <Text style={[s.galleryBody, { color: subColor, marginHorizontal: SP }]}>{t('intentionCards.zachowaj_te_ktore_naprawde_utrzymuj', 'Zachowaj te, które naprawdę utrzymują kierunek. Dotknij, żeby zobaczyć szczegóły i aktywować.')}</Text>
              {filteredCards.length > 0 ? (
                <FlatList
                  data={filteredCards}
                  horizontal
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ paddingHorizontal: SP, gap: 12 }}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <GalleryCard item={item} onDelete={handleDelete} onPress={(c) => setDetailCard(c)} />
                  )}
                  style={{ marginTop: 12 }}
                />
              ) : (
                <Text style={[s.emptyText, { color: subColor, marginHorizontal: SP }]}>{t('intentionCards.brak_kart_w_tej_kategorii', 'Brak kart w tej kategorii.')}</Text>
              )}
            </Animated.View>
          )}

          {/* Stats strip */}
          {intentionCards.length > 0 && (
            <Animated.View entering={FadeInDown.delay(240).duration(500)} style={[s.statsStrip, { backgroundColor: cardBg, borderColor: cardBorder, marginHorizontal: SP, marginTop: 20 }]}>
              {[
                { label: 'Karty', val: intentionCards.length },
                { label: 'Seria', val: streak > 0 ? `${streak}d` : '—' },
                { label: 'Kategorie', val: new Set(intentionCards.map((c) => c.category).filter(Boolean)).size || 1 },
                { label: 'Najnowsza', val: intentionCards[0]?.createdAt ? new Date(intentionCards[0].createdAt).toLocaleDateString('pl', { day: '2-digit', month: 'short' }) : '—' },
              ].map((stat, i) => (
                <View key={stat.label} style={[s.statItem, i > 0 && { borderLeftWidth: 1, borderLeftColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.08)' }]}>
                  <Text style={[s.statVal, { color: textColor }]}>{stat.val}</Text>
                  <Text style={[s.statLabel, { color: subColor }]}>{stat.label}</Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* ── Historia Intencji ─────────────────────────────────────────────── */}
          {historyCards.length > 0 && (
            <Animated.View entering={FadeInDown.delay(700).duration(600)} style={{ marginTop: 28, marginHorizontal: SP }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <BookOpen size={14} color={ACCENT} strokeWidth={1.5} />
                <Text style={[s.sectionLabel, { color: ACCENT, marginBottom: 0 }]}>{t('intentionCards.historia_intencji', 'HISTORIA INTENCJI')}</Text>
              </View>
              <Text style={[s.sectionBody, { color: subColor, marginBottom: 14 }]}>{t('intentionCards.ostatnie_10_kart_oznacz_te', 'Ostatnie 10 kart — oznacz te, które zostały spełnione.')}</Text>
              {historyCards.map((card, i) => {
                const iconGlyph = ICON_OPTIONS.find((o) => o.id === card.icon)?.glyph ?? '✦';
                const catInfo = INTENTION_CATEGORIES.find((c) => c.id === card.category);
                const isFulfilled = fulfilledIds.has(card.id);
                const dateStr = card.createdAt
                  ? new Date(card.createdAt).toLocaleDateString('pl', { day: 'numeric', month: 'short', year: '2-digit' })
                  : '–';
                return (
                  <Animated.View key={card.id} entering={FadeInDown.delay(740 + i * 40).duration(450)}>
                    <View style={[s.historyRow, {
                      backgroundColor: isFulfilled
                        ? '#34D399' + '12'
                        : (isLight ? 'rgba(240,228,210,0.90)' : 'rgba(255,255,255,0.05)'),
                      borderColor: isFulfilled ? '#34D399' + '44' : cardBorder,
                    }]}>
                      <View style={[s.historyCardMini, { borderColor: card.color + '55', backgroundColor: card.color + '18' }]}>
                        <Text style={{ fontSize: 16, color: card.color }}>{iconGlyph}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.historyCardText, {
                          color: isFulfilled ? '#34D399' : textColor,
                          textDecorationLine: isFulfilled ? 'line-through' : 'none',
                        }]} numberOfLines={2}>
                          {card.text}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <Text style={[s.historyDate, { color: subColor }]}>{dateStr}</Text>
                          {catInfo && (
                            <View style={[s.historyCatTag, { backgroundColor: catInfo.color + '22', borderColor: catInfo.color + '44' }]}>
                              <Text style={{ fontSize: 9, color: catInfo.color }}>{catInfo.emoji} {catInfo.label}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Pressable onPress={() => toggleFulfilled(card.id)}
                        style={[s.fulfilledBtn, {
                          backgroundColor: isFulfilled ? '#34D399' + '28' : (isLight ? 'rgba(255,246,230,0.92)' : 'rgba(255,255,255,0.07)'),
                          borderColor: isFulfilled ? '#34D399' + '55' : cardBorder,
                        }]}>
                        <Text style={[s.fulfilledBtnText, { color: isFulfilled ? '#34D399' : subColor }]}>
                          {isFulfilled ? '✦ Spełniona' : 'Spełniona?'}
                        </Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                );
              })}
            </Animated.View>
          )}

          {/* Wskazówka dnia */}
          {(() => {
            const tip = INTENTION_TIPS[new Date().getDate() % 6];
            return (
              <Animated.View entering={FadeInDown.delay(280).duration(500)} style={{ marginTop: 24, marginHorizontal: SP }}>
                <Text style={[s.sectionLabel, { color: ACCENT, marginBottom: 10 }]}>{t('intentionCards.wskazowka_intencji', '🌟 WSKAZÓWKA INTENCJI')}</Text>
                <View style={[s.tipCard, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}>
                  <LinearGradient colors={[ACCENT + '14', 'transparent']} style={StyleSheet.absoluteFill} />
                  <Text style={[s.tipTitle, { color: textColor }]}>{tip.title}</Text>
                  <Text style={[s.tipBody, { color: subColor }]}>{tip.body}</Text>
                </View>
              </Animated.View>
            );
          })()}

          {/* All tips */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ marginTop: 20, marginHorizontal: SP }}>
            <Text style={[s.sectionLabel, { color: ACCENT, marginBottom: 10 }]}>{t('intentionCards.wszystkie_wskazowki', '📖 WSZYSTKIE WSKAZÓWKI')}</Text>
            {INTENTION_TIPS.map((tip, i) => (
              <View key={i} style={[s.allTipRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[s.allTipNum, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '44' }]}>
                  <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '800' }}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.allTipTitle, { color: textColor }]}>{tip.title}</Text>
                  <Text style={[s.allTipBody, { color: subColor }]}>{tip.body}</Text>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* Co dalej? */}
          <Animated.View entering={FadeInDown.delay(360).duration(500)} style={{ marginTop: 24, marginHorizontal: SP }}>
            <Text style={[s.sectionLabel, { color: ACCENT, marginBottom: 10 }]}>{t('intentionCards.co_dalej', '✦ CO DALEJ?')}</Text>
            {INTENTION_QUICK_LINKS.map((link, i) => (
              <Animated.View key={link.route + link.label} entering={FadeInDown.delay(400 + i * 60).duration(400)}>
                <Pressable
                  onPress={() => navigation.navigate(link.route as any, link.params)}
                  style={({ pressed }) => [s.quickLinkRow, { backgroundColor: cardBg, borderColor: link.color + '33', opacity: pressed ? 0.75 : 1 }]}>
                  <LinearGradient colors={[link.color + '18', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                  <View style={[s.quickLinkDot, { backgroundColor: link.color + '33', borderColor: link.color + '55' }]}>
                    <Text style={{ color: link.color, fontSize: 14, fontWeight: '700' }}>✦</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.quickLinkLabel, { color: textColor }]}>{link.label}</Text>
                    <Text style={[s.quickLinkSub, { color: subColor }]}>{link.sublabel}</Text>
                  </View>
                  <ArrowRight size={16} color={link.color} />
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>

        {/* Card Detail Modal */}
        <Modal visible={!!detailCard} transparent animationType="fade" onRequestClose={() => setDetailCard(null)}>
          <View style={s.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setDetailCard(null)} />
            {detailCard && (() => {
              const iconGlyph = ICON_OPTIONS.find((o) => o.id === detailCard.icon)?.glyph ?? '✦';
              const catInfo = INTENTION_CATEGORIES.find((c) => c.id === detailCard.category);
              const affirmIdx = Math.abs(detailCard.id?.charCodeAt(0) ?? 0) % ACTIVATION_AFFIRMATIONS.length;
              return (
                <Animated.View entering={FadeIn.duration(300)} style={[s.detailSheet, { backgroundColor: modalBg }]}>
                  <LinearGradient
                    colors={[detailCard.color + '22', detailCard.color + '08', 'transparent']}
                    style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
                  />
                  <Pressable onPress={() => setDetailCard(null)} style={s.detailClose}>
                    <X size={18} color={textColor} />
                  </Pressable>
                  {catInfo && (
                    <View style={[s.detailCatBadge, { backgroundColor: catInfo.color + '28', borderColor: catInfo.color + '55' }]}>
                      <Text style={{ fontSize: 13 }}>{catInfo.emoji}</Text>
                      <Text style={[s.detailCatText, { color: catInfo.color }]}>{catInfo.label}</Text>
                    </View>
                  )}
                  <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 20 }}>
                    <Animated.View style={activateStyle}>
                      <CardPreview color={detailCard.color} glyph={iconGlyph} text={detailCard.text} size="detail" category={detailCard.category} />
                    </Animated.View>
                  </View>
                  <Text style={[s.detailText, { color: textColor }]}>"{detailCard.text}"</Text>
                  <Text style={[s.detailAffirmation, { color: subColor }]}>{ACTIVATION_AFFIRMATIONS[affirmIdx]}</Text>
                  {detailCard.createdAt && (
                    <Text style={[s.detailDate, { color: subColor }]}>
                      Utworzona {new Date(detailCard.createdAt).toLocaleDateString('pl', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                  )}
                  <Pressable onPress={handleActivate} disabled={activating}
                    style={[s.activateBtn, { borderColor: detailCard.color + '66', opacity: activating ? 0.8 : 1 }]}>
                    <LinearGradient colors={[detailCard.color, detailCard.color + 'BB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.activateBtnGrad}>
                      {activating ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Sparkles size={16} color="#fff" />
                      )}
                      <Text style={s.activateBtnText}>{activating ? 'Aktywowanie...' : 'Aktywuj kartę'}</Text>
                    </LinearGradient>
                  </Pressable>
                  {activating && (
                    <Animated.View entering={FadeIn.duration(300)} style={[s.activatingMsg, { borderColor: detailCard.color + '44' }]}>
                      <Text style={[s.activatingText, { color: detailCard.color }]}>
                        {t('intentionCards.intencja_wysylana_w_przestrzen', '✦ Intencja wysyłana w przestrzeń... ✦')}
                      </Text>
                    </Animated.View>
                  )}
                  <Pressable onPress={() => { handleDelete(detailCard.id); setDetailCard(null); }}
                    style={s.detailDeleteBtn}>
                    <Trash2 size={14} color="rgba(239,68,68,0.7)" />
                    <Text style={s.detailDeleteText}>{t('intentionCards.usun_karte', 'Usuń kartę')}</Text>
                  </Pressable>
                </Animated.View>
              );
            })()}
          </View>
        </Modal>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.4 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  streakNum: { fontSize: 13, fontWeight: '800' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 10, borderRadius: 12, borderWidth: 1 },
  streakRowText: { fontSize: 12.5, fontWeight: '600', flex: 1 },
  heroCard: { borderRadius: 24, borderWidth: 1, padding: 18, overflow: 'hidden' },
  heroEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  heroTitle: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  heroBody: { fontSize: 14, lineHeight: 22, marginTop: 10 },

  // ── Flip card ──
  flipCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', padding: 28, overflow: 'hidden' },
  flipGlyph: { fontSize: 52, marginBottom: 16, opacity: 0.85 },
  flipDivider: { width: 60, height: 1, marginBottom: 18 },
  flipText: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center', lineHeight: 28, paddingHorizontal: 16 },
  flipHint: { fontSize: 11, marginTop: 16, letterSpacing: 0.8 },

  previewDeck: { borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 16 },
  previewRail: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 14 },
  previewMini: { flex: 1, alignItems: 'center' },
  creatorCard: { borderRadius: 20, borderWidth: 1, padding: 18 },
  sectionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: 8 },
  sectionBody: { fontSize: 13.5, lineHeight: 21, marginBottom: 10 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  catLabel: { fontSize: 12.5 },
  charCount: { fontSize: 10, textAlign: 'right', marginTop: 4 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 14, marginTop: 10 },
  aiBtnText: { fontSize: 13, fontWeight: '700' },
  suggestionCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginTop: 10 },
  suggestionLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1.6, marginBottom: 6 },
  suggestionText: { fontSize: 15, fontWeight: '600', lineHeight: 23, fontStyle: 'italic' },
  suggCta: { flexDirection: 'row', justifyContent: 'center', borderRadius: 10, borderWidth: 1, paddingVertical: 8 },
  suggCtaText: { fontSize: 12.5, fontWeight: '700' },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconChip: { width: 44, height: 44, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorChip: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  colorChipSelected: { borderWidth: 3, borderColor: '#fff' },
  colorCheckmark: { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 20 },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  // ── Moon spread ──
  moonSpreadHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, overflow: 'hidden' },
  activePhaseTag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  activePhaseTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  spreadPosCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8, overflow: 'hidden' },
  spreadPosBadge: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  spreadPosNum: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  spreadPosTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4, lineHeight: 20 },
  spreadPosDesc: { fontSize: 12.5, lineHeight: 19 },

  // ── Weekly intentions ──
  weeklyHeader: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, overflow: 'hidden' },
  weeklyItem: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8 },
  weeklyNumBadge: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  weeklyNumText: { fontSize: 12, fontWeight: '800' },
  weeklyText: { fontSize: 14, lineHeight: 21, fontWeight: '500' },
  weeklyInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  weeklyConfirmBtn: { borderRadius: 10, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 14, alignItems: 'center' },
  weeklyConfirmText: { fontSize: 13, fontWeight: '700' },
  manifestBtn: { borderRadius: 10, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 10 },
  manifestBtnText: { fontWeight: '700', letterSpacing: 0.3 },

  // ── Ritual ──
  ritualContainer: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
  ritualStartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1, paddingVertical: 12, marginTop: 10 },
  ritualStartText: { fontSize: 14, fontWeight: '700' },
  ritualDots: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 16 },
  ritualDot: { height: 8, borderRadius: 4 },
  ritualStepCard: { borderRadius: 18, borderWidth: 1, padding: 20, alignItems: 'center' },
  ritualStepIcon: { fontSize: 36, marginBottom: 10 },
  ritualStepNum: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  ritualStepTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  ritualStepDesc: { fontSize: 14, lineHeight: 23, textAlign: 'center' },
  ritualNavBtn: { borderRadius: 12, borderWidth: 1, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  ritualNavText: { fontSize: 13.5, fontWeight: '700' },
  ritualDoneCard: { borderRadius: 18, borderWidth: 1, padding: 20, alignItems: 'center', marginTop: 8 },
  ritualDoneIcon: { fontSize: 28, color: ACCENT, marginBottom: 8 },
  ritualDoneTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  ritualDoneDesc: { fontSize: 13.5, lineHeight: 22, textAlign: 'center', marginBottom: 14 },
  ritualRestartBtn: { borderRadius: 12, borderWidth: 1, paddingVertical: 9, paddingHorizontal: 20 },

  galleryTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8 },
  galleryBody: { fontSize: 13, lineHeight: 21, marginTop: 6 },
  galleryCard: { borderRadius: 16, borderWidth: 1, padding: 8, alignItems: 'center', position: 'relative' },
  deleteBtn: { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1 },
  filterChipText: { fontSize: 11.5, fontWeight: '600' },
  emptyText: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  statsStrip: { flexDirection: 'row', borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statVal: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 10, letterSpacing: 0.5 },

  // ── Historia intencji ──
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8 },
  historyCardMini: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  historyCardText: { fontSize: 13.5, fontWeight: '600', lineHeight: 20 },
  historyDate: { fontSize: 11, lineHeight: 16 },
  historyCatTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  fulfilledBtn: { borderRadius: 10, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 9 },
  fulfilledBtnText: { fontSize: 10.5, fontWeight: '700' },

  tipCard: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
  tipTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8, lineHeight: 22 },
  tipBody: { fontSize: 13.5, lineHeight: 22 },
  allTipRow: { flexDirection: 'row', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8, alignItems: 'flex-start' },
  allTipNum: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  allTipTitle: { fontSize: 13.5, fontWeight: '700', marginBottom: 4 },
  allTipBody: { fontSize: 12.5, lineHeight: 19 },
  quickLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10, overflow: 'hidden' },
  quickLinkDot: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  quickLinkLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  quickLinkSub: { fontSize: 12, lineHeight: 17 },
  // modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  detailSheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, overflow: 'hidden', alignItems: 'center' },
  detailClose: { position: 'absolute', top: 16, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(128,128,128,0.15)', alignItems: 'center', justifyContent: 'center' },
  detailCatBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginBottom: 4 },
  detailCatText: { fontSize: 12, fontWeight: '700' },
  detailText: { fontSize: 17, fontWeight: '700', textAlign: 'center', lineHeight: 26, marginBottom: 10, paddingHorizontal: 16 },
  detailAffirmation: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 8, paddingHorizontal: 20, fontStyle: 'italic' },
  detailDate: { fontSize: 11, marginBottom: 20, opacity: 0.7 },
  activateBtn: { width: '100%', borderRadius: 18, overflow: 'hidden', borderWidth: 1 },
  activateBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  activateBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  activatingMsg: { marginTop: 12, borderRadius: 12, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 20 },
  activatingText: { fontSize: 13, fontWeight: '700', textAlign: 'center', letterSpacing: 1 },
  detailDeleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, paddingVertical: 8 },
  detailDeleteText: { color: 'rgba(239,68,68,0.7)', fontSize: 13 },
});
