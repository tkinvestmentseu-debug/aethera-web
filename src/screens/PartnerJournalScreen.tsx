// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MysticalInput } from '../components/MysticalInput';
import Svg, {
  Circle as SvgCircle,
  Defs,
  Ellipse as SvgEllipse,
  Line as SvgLine,
  Path as SvgPath,
  RadialGradient as SvgRadialGradient,
  Rect as SvgRect,
  Stop,
} from 'react-native-svg';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Heart,
  Lightbulb,
  MessageCircle,
  Moon,
  PenLine,
  RotateCcw,
  Sparkles,
  Star,
  Sunrise,
  Target,
  Users,
  Wind,
  Zap,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import { DateWheelPicker } from '../components/DateWheelPicker';
import { useTheme } from '../core/hooks/useTheme';
const ACCENT = '#EC4899';
const SP = layout.padding.screen;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function reduceToSingle(n: number): number {
  if (n <= 9) return n;
  const sum = String(n).split('').reduce((a, c) => a + parseInt(c, 10), 0);
  return reduceToSingle(sum);
}

function birthDateToLifePath(dateStr: string): number {
  const digits = dateStr.replace(/\D/g, '');
  const sum = digits.split('').reduce((a, c) => a + parseInt(c, 10), 0);
  return reduceToSingle(sum);
}

function compatibilityDesc(a: number, b: number): { score: number; label: string; desc: string } {
  const diff = Math.abs(a - b);
  if (diff === 0) return { score: 95, label: 'Lustrzane dusze', desc: 'Identyczne ścieżki życia — rozumiecie się bez słów. Wzajemne wzmocnienie energii.' };
  if (diff <= 2) return { score: 88, label: 'Harmonijne połączenie', desc: 'Wasze liczby tworzą piękną harmonię — uzupełniacie się na głębokim poziomie.' };
  if (diff <= 4) return { score: 74, label: 'Komplementarne energie', desc: 'Różne perspektywy, ale wspólny cel. Uczycie się od siebie wzajemnie.' };
  if (diff <= 6) return { score: 60, label: 'Dynamiczny kontrast', desc: 'Napięcie twórcze — wyzwania stają się siłą, gdy oboje jesteście świadomi różnic.' };
  return { score: 45, label: 'Polaryzacja sił', desc: 'Duże różnice numerologiczne wymagają świadomej pracy nad komunikacją i zaufaniem.' };
}

function daysBetween(dateStr: string): number | null {
  try {
    const [d, m, y] = dateStr.split('.').map(Number);
    const start = new Date(y, m - 1, d);
    const diff = Date.now() - start.getTime();
    return Math.max(0, Math.floor(diff / 86400000));
  } catch { return null; }
}

const ENTRY_TYPES = [
  { id: 'together', label: 'Razem', color: '#EC4899' },
  { id: 'reflection', label: 'Refleksja', color: '#A78BFA' },
  { id: 'gratitude', label: 'Wdzięczność', color: '#34D399' },
  { id: 'challenge', label: 'Wyzwanie', color: '#FB923C' },
  { id: 'intention', label: 'Intencja', color: '#38BDF8' },
  { id: 'dream', label: 'Marzenie', color: '#F9A8D4' },
  { id: 'celebration', label: 'Celebracja', color: '#FBBF24' },
];

const LOVE_LANGUAGES = [
  { id: 'words', label: 'Słowa uznania', icon: '💬', desc: 'Wyrażasz miłość przez komplementy, słowa wsparcia i wdzięczność werbalną.' },
  { id: 'acts', label: 'Czyny usługi', icon: '🤝', desc: 'Pokazujesz miłość przez działanie — pomoc, organizację, troskę o szczegóły.' },
  { id: 'gifts', label: 'Prezenty', icon: '🎁', desc: 'Miłość przez dary — nie materialne, ale symboliczne gesty uwagi.' },
  { id: 'time', label: 'Czas razem', icon: '⏳', desc: 'Potrzebujesz obecności — wspólnych chwil, skupionej uwagi partnera.' },
  { id: 'touch', label: 'Dotyk fizyczny', icon: '🤗', desc: 'Czułość, bliskość ciał, przytulenia — Twój główny kanał bezpieczeństwa.' },
];

const CONFLICT_RITUALS = [
  { step: 1, title: 'Zatrzymaj się', icon: '🛑', desc: 'Przed odpowiedzią weź 3 sekundy pauzy. Nie kontynuuj, gdy ciało sygnalizuje stres.' },
  { step: 2, title: 'Zrób oddech', icon: '🌬️', desc: '4 sekundy wdech, 4 pauza, 6 wydech. Trzy razy. Reguluje układ nerwowy.' },
  { step: 3, title: 'Wysłuchaj', icon: '👂', desc: 'Powtórz własnymi słowami to, co usłyszałeś. Zapytaj: "Czy dobrze rozumiem?"' },
  { step: 4, title: 'Odpowiedz', icon: '🗣️', desc: 'Mów o swoich uczuciach ("Czuję..."), nie o zachowaniach partnera ("Ty zawsze...").' },
  { step: 5, title: 'Zamknij', icon: '🕊️', desc: 'Zakończ rozmowę gestem połączenia — dotykiem, słowem, wspólnym milczeniem.' },
];

// ─── Background ───────────────────────────────────────────────────────────────

const PartnerJournalBg = ({ isLight }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight ? ['#FFF5F9', '#FEE8F3', '#FDDCE9'] : ['#09050A', '#140A10', '#1C0D18']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <SvgRadialGradient id="pjglow" cx="50%" cy="25%" r="45%">
          <Stop offset="0%" stopColor={ACCENT} stopOpacity={isLight ? '0.07' : '0.09'} />
          <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </SvgRadialGradient>
      </Defs>
      <SvgRect x="0" y="0" width="390" height="844" fill="url(#pjglow)" />
      {[60, 110, 160, 210, 260].map((r, i) => (
        <SvgCircle key={i} cx={195} cy={195} r={r} fill="none"
          stroke={ACCENT} strokeWidth={0.5} strokeOpacity={isLight ? 0.05 : 0.04} />
      ))}
    </Svg>
  </View>
);

// ─── Soul Map Hero Widget ──────────────────────────────────────────────────────
// Two interlocking hearts with sacred geometry (vesica piscis) + shimmer + pan-tilt

const SoulMapWidget = ({ accent, isLight }) => {
  const { t } = useTranslation();

  const tiltX = useSharedValue(-5);
  const tiltY = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const pulse = useSharedValue(1);
  const orbitAngle = useSharedValue(0);

  React.useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 2200 }), -1, true);
    pulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 1600 }), withTiming(1, { duration: 1600 })),
      -1, true,
    );
    orbitAngle.value = withRepeat(withTiming(360, { duration: 18000 }), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-18, Math.min(18, -5 + e.translationY * 0.18));
      tiltY.value = Math.max(-18, Math.min(18, e.translationX * 0.18));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-5, { duration: 800 });
      tiltY.value = withTiming(0, { duration: 800 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 540 },
      { rotateX: tiltX.value + 'deg' },
      { rotateY: tiltY.value + 'deg' },
    ],
  }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const orbitStyle = useAnimatedStyle(() => ({ transform: [{ rotate: orbitAngle.value + 'deg' }] }));

  const SIZE = 200;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const ORBIT_R = 82;

  // Sacred geometry orbit dots
  const orbitPoints = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return { cx: CX + ORBIT_R * Math.cos(a), cy: CY + ORBIT_R * Math.sin(a), big: i % 4 === 0 };
  });
  // Inner hexagon vertices
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    return { cx: CX + 38 * Math.cos(a), cy: CY + 38 * Math.sin(a) };
  });

  // Heart path (left, right offset) for vesica piscis look
  const heartLeft = 'M72,88 C72,72 52,62 44,76 C36,90 52,104 72,120 C92,104 108,90 100,76 C92,62 72,72 72,88 Z';
  const heartRight = 'M118,88 C118,72 98,62 90,76 C82,90 98,104 118,120 C138,104 154,90 146,76 C138,62 118,72 118,88 Z';

  return (
    <View style={{ alignItems: 'center', marginVertical: 12 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>
          {/* Outer glow ring */}
          <View style={{
            position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2,
            backgroundColor: accent + '12',
          }} />
          {/* Orbit ring + dots */}
          <Animated.View style={[StyleSheet.absoluteFill, orbitStyle]}>
            <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <SvgCircle cx={CX} cy={CY} r={ORBIT_R} fill="none"
                stroke={accent} strokeWidth={0.7} strokeOpacity={0.22} strokeDasharray="3 5" />
              {orbitPoints.map((p, i) => (
                <SvgCircle key={i} cx={p.cx} cy={p.cy} r={p.big ? 3.2 : 1.4}
                  fill={accent} opacity={p.big ? 0.7 : 0.3} />
              ))}
            </Svg>
          </Animated.View>
          {/* Sacred geometry base */}
          <View style={StyleSheet.absoluteFill}>
            <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              {/* Vesica piscis circles */}
              <SvgCircle cx={CX - 18} cy={CY} r={36} fill="none"
                stroke={accent} strokeWidth={0.8} strokeOpacity={0.18} />
              <SvgCircle cx={CX + 18} cy={CY} r={36} fill="none"
                stroke={accent} strokeWidth={0.8} strokeOpacity={0.18} />
              {/* Hexagram lines */}
              {hexPoints.map((p, i) => {
                const next = hexPoints[(i + 3) % 6];
                return (
                  <SvgLine key={i} x1={p.cx} y1={p.cy} x2={next.cx} y2={next.cy}
                    stroke={accent} strokeWidth={0.6} strokeOpacity={0.15} />
                );
              })}
              {/* Centre dot */}
              <SvgCircle cx={CX} cy={CY} r={3} fill={accent} opacity={0.4} />
            </Svg>
          </View>
          {/* Pulsing hearts */}
          <Animated.View style={[StyleSheet.absoluteFill, pulseStyle]}>
            <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <SvgPath d={heartLeft} fill={accent} opacity={0.72} />
              <SvgPath d={heartRight} fill={accent} opacity={0.55} />
              {/* Shimmer highlight */}
              <SvgEllipse cx={CX - 10} cy={CY - 14} rx={10} ry={5}
                fill="#FFFFFF" opacity={isLight ? 0.18 : 0.28} />
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: accent, marginTop: 6, opacity: 0.72 }}>
        {t('partnerJournal.mapa_duszy_pary', 'MAPA DUSZY PARY')}
      </Text>
    </View>
  );
};

// ─── Legacy Heart Widget (used on setup screen) ────────────────────────────────

const HeartWidget3D = ({ accent }) => {
  const tiltX = useSharedValue(-6);
  const tiltY = useSharedValue(0);
  const pulse = useSharedValue(1);
  const rotate = useSharedValue(0);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 1400 }), withTiming(1, { duration: 1400 })),
      -1, true,
    );
    rotate.value = withRepeat(withTiming(360, { duration: 22000 }), -1, false);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-20, Math.min(20, -6 + e.translationY * 0.2));
      tiltY.value = Math.max(-20, Math.min(20, e.translationX * 0.2));
    })
    .onEnd(() => {
      tiltX.value = withTiming(-6, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 520 }, { rotateX: tiltX.value + 'deg' }, { rotateY: tiltY.value + 'deg' }],
  }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: rotate.value + 'deg' }] }));

  const SIZE = 180;
  const R = 70;
  const orbitDots = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { cx: SIZE / 2 + R * Math.cos(a), cy: SIZE / 2 + R * Math.sin(a) };
  });

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>
          <View style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: accent + '14', position: 'absolute' }} />
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ringStyle]}>
            <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              {orbitDots.map((d, i) => (
                <SvgCircle key={i} cx={d.cx} cy={d.cy} r={i % 3 === 0 ? 3 : 1.5}
                  fill={accent} opacity={i % 3 === 0 ? 0.65 : 0.3} />
              ))}
              <SvgCircle cx={SIZE / 2} cy={SIZE / 2} r={R + 8} fill="none"
                stroke={accent} strokeWidth={0.8} strokeOpacity={0.25} />
            </Svg>
          </Animated.View>
          <Animated.View style={heartStyle}>
            <Heart size={56} color={accent} fill={accent} strokeWidth={0} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ─── Entry Card ───────────────────────────────────────────────────────────────

const EntryCard = ({ entry, isLight }) => {
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.09)';
  const textColor = isLight ? '#1A1108' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.5)';
  const date = entry.date ? new Date(entry.date).toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'long' }) : '';
  const typeInfo = ENTRY_TYPES.find((t) => t.id === entry.type);
  return (
    <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: cardBorder, padding: 14, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {typeInfo && (
            <View style={{ backgroundColor: typeInfo.color + '28', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: typeInfo.color, letterSpacing: 0.8 }}>{typeInfo.label.toUpperCase()}</Text>
            </View>
          )}
          <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>{entry.title ?? 'Wpis'}</Text>
        </View>
        <Text style={{ fontSize: 10, color: subColor }}>{date}</Text>
      </View>
      <Text style={{ fontSize: 13.5, lineHeight: 20, color: textColor, opacity: 0.82 }} numberOfLines={3}>
        {entry.content}
      </Text>
    </View>
  );
};

// ─── Setup Form ───────────────────────────────────────────────────────────────

const SetupForm = ({ onSave, isLight, textColor, subColor, cardBg, cardBorder, onFieldFocus }) => {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const today = new Date();
  const [bdDay, setBdDay] = useState(1);
  const [bdMonth, setBdMonth] = useState(1);
  const [bdYear, setBdYear] = useState(1990);
  const [sdDay, setSdDay] = useState(today.getDate());
  const [sdMonth, setSdMonth] = useState(today.getMonth() + 1);
  const [sdYear, setSdYear] = useState(today.getFullYear());
  const [showStartDate, setShowStartDate] = useState(false);

  const canSave = name.trim().length >= 2;
  const birthDate = `${String(bdDay).padStart(2,'0')}.${String(bdMonth).padStart(2,'0')}.${bdYear}`;
  const startDate = `${String(sdDay).padStart(2,'0')}.${String(sdMonth).padStart(2,'0')}.${sdYear}`;

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={[s.setupCard, { backgroundColor: cardBg, borderColor: cardBorder, marginHorizontal: SP }]}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Heart size={36} color={ACCENT} fill={ACCENT + '66'} />
        <Text style={[s.setupTitle, { color: textColor }]}>{t('partnerJournal.poznajmy_twoja_druga_polowke', 'Poznajmy Twoją drugą połówkę')}</Text>
        <Text style={[s.setupSub, { color: subColor }]}>{t('partnerJournal.podaj_imie_i_date_urodzenia', 'Podaj imię i datę urodzenia partnera/ki, aby odblokować dziennik pary i analizę kompatybilności.')}</Text>
      </View>
      <Text style={[s.fieldLabel, { color: ACCENT }]}>{t('partnerJournal.imie_partnera_ki', 'IMIĘ PARTNERA/KI')}</Text>
      <MysticalInput
        value={name}
        onChangeText={setName}
        placeholder={t('partnerJournal.np_marta_tomasz', 'Np. Marta, Tomasz...')}
        placeholderTextColor={subColor}
        style={{ color: textColor }}
        containerStyle={{ marginBottom: 12 }}
        returnKeyType="done"
        onFocusScroll={() => onFieldFocus?.(120)}
      />
      <Text style={[s.fieldLabel, { color: ACCENT, marginTop: 14 }]}>{t('partnerJournal.data_urodzenia_partnera_ki', 'DATA URODZENIA PARTNERA/KI')}</Text>
      <DateWheelPicker
        day={bdDay} month={bdMonth} year={bdYear}
        onChange={(d, m, y) => { setBdDay(d); setBdMonth(m); setBdYear(y); }}
        textColor={textColor} accentColor={ACCENT}
        cardBg={isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)'}
      />
      <Pressable
        onPress={() => setShowStartDate(v => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 4 }}
      >
        <Calendar size={15} color={ACCENT} />
        <Text style={[s.fieldLabel, { color: ACCENT, marginTop: 0 }]}>{t('partnerJournal.data_poczatku_zwiazku_opcjonalni', 'DATA POCZĄTKU ZWIĄZKU (opcjonalnie)')}</Text>
        <Text style={{ color: ACCENT, fontSize: 13 }}>{showStartDate ? '▲' : '▼'}</Text>
      </Pressable>
      {showStartDate && (
        <DateWheelPicker
          day={sdDay} month={sdMonth} year={sdYear}
          onChange={(d, m, y) => { setSdDay(d); setSdMonth(m); setSdYear(y); }}
          textColor={textColor} accentColor={ACCENT}
          cardBg={isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)'}
        />
      )}
      <Pressable
        onPress={() => onSave(name.trim(), birthDate, showStartDate ? startDate : undefined)}
        disabled={!canSave}
        style={[s.setupBtn, { backgroundColor: canSave ? ACCENT : ACCENT + '55', marginTop: 18 }]}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{t('partnerJournal.stworz_dziennik_pary', 'Stwórz dziennik pary')}</Text>
      </Pressable>
    </Animated.View>
  );
};

// ─── Relationship Stats Bar ───────────────────────────────────────────────────

const RelationshipStats = ({ partnerData, partnerEntries, compat, isLight, textColor, subColor }) => {
  const days = partnerData?.startDate ? daysBetween(partnerData.startDate) : null;
  const stats = [
    { label: 'Dni razem', value: days != null ? String(days) : '—', icon: '🗓️' },
    { label: 'Wspólne wpisy', value: String(partnerEntries), icon: '📖' },
    { label: 'Harmonia', value: compat ? `${compat.score}%` : '—', icon: '💞' },
  ];
  return (
    <Animated.View entering={FadeInDown.delay(60).duration(500)}
      style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
      {stats.map((st) => (
        <View key={st.label} style={{
          flex: 1, borderRadius: 16, borderWidth: 1,
          backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)',
          borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.09)',
          padding: 12, alignItems: 'center',
        }}>
          <Text style={{ fontSize: 18 }}>{st.icon}</Text>
          <Text style={{ fontSize: 17, fontWeight: '800', color: ACCENT, marginTop: 4 }}>{st.value}</Text>
          <Text style={{ fontSize: 9, fontWeight: '600', color: subColor, marginTop: 2, letterSpacing: 0.5, textAlign: 'center' }}>{st.label.toUpperCase()}</Text>
        </View>
      ))}
    </Animated.View>
  );
};

// ─── Entry Type Chips ─────────────────────────────────────────────────────────

const EntryTypeChips = ({ selected, onSelect, isLight, subColor }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ paddingHorizontal: 0, gap: 8, paddingVertical: 4 }}
    style={{ marginBottom: 14 }}>
    {ENTRY_TYPES.map((t) => {
      const active = selected === t.id;
      return (
        <Pressable key={t.id}
          onPress={() => { onSelect(t.id); HapticsService.impact('light'); }}
          style={{
            paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
            borderWidth: 1,
            backgroundColor: active ? t.color + '28' : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)'),
            borderColor: active ? t.color + '88' : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'),
          }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: active ? t.color : subColor }}>
            {t.label}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

// ─── Shared Intention Board ───────────────────────────────────────────────────

const intentionSlots = [
  { key: 'i1', placeholder: 'Pierwsza wspólna intencja na ten cykl...' },
  { key: 'i2', placeholder: 'Druga intencja — co chcecie razem zbudować?' },
  { key: 'i3', placeholder: 'Trzecia intencja — wasze pragnienie na pełnię...' },
];

const IntentionBoard = ({ isLight, textColor, subColor, cardBg, cardBorder, accent }) => {
  const { t } = useTranslation();

  const [intentions, setIntentions] = useState({ i1: '', i2: '', i3: '' });
  const [agreed, setAgreed] = useState({ i1: false, i2: false, i3: false });
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current); };
  }, []);

  const handleAgree = (key: string) => {
    HapticsService.notify();
    setAgreed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    HapticsService.notify();
    setSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2400);
  };

  const moonLabel = (() => {
    const now = new Date();
    const month = now.toLocaleDateString(getLocaleCode(), { month: 'long' });
    return `Cykl ${month} ${now.getFullYear()}`;
  })();

  return (
    <Animated.View entering={FadeInDown.delay(80).duration(520)}
      style={[s.sectionBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Moon size={15} color={accent} />
        <Text style={[s.sectionTitle, { color: textColor }]}>{t('partnerJournal.tablica_intencji', 'TABLICA INTENCJI')}</Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 9, color: subColor, fontWeight: '600', letterSpacing: 0.6 }}>{moonLabel.toUpperCase()}</Text>
      </View>
      <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 14 }}>
        {t('partnerJournal.ustalcie_3_wspolne_intencje_na', 'Ustalcie 3 wspólne intencje na ten cykl księżycowy. Każde z was potwierdza swoją zgodę — razem zakorzenia je w energii pełni.')}
      </Text>
      {intentionSlots.map((slot) => (
        <View key={slot.key} style={{ marginBottom: 12 }}>
          <TextInput
            value={intentions[slot.key]}
            onChangeText={(v) => setIntentions((p) => ({ ...p, [slot.key]: v }))}
            placeholder={slot.placeholder}
            placeholderTextColor={subColor}
            multiline
            style={{
              fontSize: 13.5, lineHeight: 20, color: textColor,
              backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)',
              borderRadius: 14, borderWidth: 1,
              borderColor: agreed[slot.key] ? accent + '77' : (isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.09)'),
              padding: 12, minHeight: 64,
            }}
          />
          <Pressable
            onPress={() => handleAgree(slot.key)}
            style={{
              position: 'absolute', right: 10, bottom: 10,
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: agreed[slot.key] ? accent + '28' : (isLight ? 'rgba(255,246,230,0.92)' : 'rgba(255,255,255,0.08)'),
              borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
            }}>
            {agreed[slot.key]
              ? <CheckCircle2 size={12} color={accent} />
              : <Circle size={12} color={subColor} />}
            <Text style={{ fontSize: 9, fontWeight: '700', color: agreed[slot.key] ? accent : subColor }}>
              {agreed[slot.key] ? 'ZGODA' : 'POTWIERDŹ'}
            </Text>
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={handleSave}
        style={{
          marginTop: 4, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
          backgroundColor: saved ? '#34D39944' : accent + '22',
          borderWidth: 1, borderColor: saved ? '#34D399' : accent + '55',
        }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: saved ? '#34D399' : accent }}>
          {saved ? '✓ Intencje zapisane' : 'Zapisz intencje na ten cykl'}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

// ─── Relationship Timeline ────────────────────────────────────────────────────

const MILESTONE_DEFAULTS = [
  { id: 'm1', label: 'Pierwsze spotkanie', icon: '✨', color: '#F472B6' },
  { id: 'm2', label: 'Pierwsza randka', icon: '🌹', color: '#EC4899' },
  { id: 'm3', label: 'Wyznanie uczuć', icon: '💌', color: '#A78BFA' },
  { id: 'm4', label: 'Zaangażowanie', icon: '💍', color: '#FBBF24' },
  { id: 'm5', label: 'Wspólne doświadczenie', icon: '🌍', color: '#38BDF8' },
  { id: 'm6', label: 'Twój kamień milowy', icon: '⭐', color: '#34D399' },
];

const RelationshipTimeline = ({ isLight, textColor, subColor, cardBg, cardBorder, accent }) => {
  const { t } = useTranslation();

  const [dates, setDates] = useState({});
  const [notes, setNotes] = useState({});
  const [editing, setEditing] = useState(null);

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(520)}
      style={[s.sectionBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Calendar size={15} color={accent} />
        <Text style={[s.sectionTitle, { color: textColor }]}>{t('partnerJournal.os_czasu_relacji', 'OŚ CZASU RELACJI')}</Text>
      </View>
      <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 14 }}>
        {t('partnerJournal.znaczace_momenty_waszej_historii_do', 'Znaczące momenty Waszej historii. Dotknij kamienia milowego, by dodać datę i notatkę.')}
      </Text>
      {MILESTONE_DEFAULTS.map((m, idx) => (
        <View key={m.id}>
          <Pressable
            onPress={() => { setEditing(editing === m.id ? null : m.id); HapticsService.impact('light'); }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              paddingVertical: 12,
              borderBottomWidth: idx < MILESTONE_DEFAULTS.length - 1 ? 1 : 0,
              borderColor: isLight ? 'rgba(139,100,42,0.45)' : 'rgba(255,255,255,0.06)',
            }}>
            <View style={{
              width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
              backgroundColor: m.color + '22',
            }}>
              <Text style={{ fontSize: 18 }}>{m.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: textColor }}>{m.label}</Text>
              {dates[m.id] ? (
                <Text style={{ fontSize: 11, color: m.color, marginTop: 2, fontWeight: '600' }}>{dates[m.id]}</Text>
              ) : (
                <Text style={{ fontSize: 11, color: subColor, marginTop: 2 }}>{t('partnerJournal.dodaj_date', 'Dodaj datę...')}</Text>
              )}
            </View>
            <Text style={{ fontSize: 11, color: editing === m.id ? accent : subColor }}>
              {editing === m.id ? '▲' : '▼'}
            </Text>
          </Pressable>
          {editing === m.id && (
            <View style={{ paddingBottom: 12, gap: 8 }}>
              <TextInput
                value={dates[m.id] ?? ''}
                onChangeText={(v) => setDates((p) => ({ ...p, [m.id]: v }))}
                placeholder={t('partnerJournal.dd_mm_rrrr', 'DD.MM.RRRR')}
                placeholderTextColor={subColor}
                keyboardType="numeric"
                style={{
                  fontSize: 13, color: textColor, borderRadius: 10, borderWidth: 1,
                  borderColor: m.color + '55', padding: 10,
                  backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)',
                }}
              />
              <TextInput
                value={notes[m.id] ?? ''}
                onChangeText={(v) => setNotes((p) => ({ ...p, [m.id]: v }))}
                placeholder={t('partnerJournal.krotka_notatka_o_tym_momencie', 'Krótka notatka o tym momencie...')}
                placeholderTextColor={subColor}
                multiline
                style={{
                  fontSize: 13, color: textColor, borderRadius: 10, borderWidth: 1,
                  borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.08)',
                  padding: 10, minHeight: 56,
                  backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.04)',
                }}
              />
            </View>
          )}
        </View>
      ))}
    </Animated.View>
  );
};

// ─── Love Language Profile ────────────────────────────────────────────────────

const LoveLanguageProfile = ({ partnerName, isLight, textColor, subColor, cardBg, cardBorder, accent }) => {
  const { t } = useTranslation();

  const [myLang, setMyLang] = useState(null);
  const [partnerLang, setPartnerLang] = useState(null);

  const compatibility = myLang && partnerLang
    ? myLang === partnerLang
      ? { label: 'Idealne dopasowanie', color: '#34D399', desc: 'Mówicie tym samym językiem miłości — wasze potrzeby naturalnie się spotykają.' }
      : ['words', 'acts'].includes(myLang) && ['words', 'acts'].includes(partnerLang)
        ? { label: 'Dobra kompatybilność', color: '#FBBF24', desc: 'Różne języki, ale zbliżone potrzeby wyrażania troski — z odrobiną uważności wasze potrzeby są zaspokojone.' }
        : { label: 'Uzupełniające się', color: '#F472B6', desc: 'Różne języki miłości wymagają świadomego przekładu. Pytaj partnera o potrzeby zamiast zakładać.' }
    : null;

  return (
    <Animated.View entering={FadeInDown.delay(120).duration(520)}
      style={[s.sectionBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Heart size={15} color={accent} />
        <Text style={[s.sectionTitle, { color: textColor }]}>{t('partnerJournal.jezyki_milosci', 'JĘZYKI MIŁOŚCI')}</Text>
      </View>
      <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 16 }}>
        Wybierz główny język miłości dla siebie i {partnerName ?? 'partnera/ki'}.
      </Text>
      {(['Mój język', `Język ${partnerName ?? 'partnera/ki'}`] as const).map((label, li) => {
        const selected = li === 0 ? myLang : partnerLang;
        const setSelected = li === 0 ? setMyLang : setPartnerLang;
        return (
          <View key={label} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: accent, letterSpacing: 1.6, marginBottom: 10 }}>
              {label.toUpperCase()}
            </Text>
            {LOVE_LANGUAGES.map((ll) => {
              const active = selected === ll.id;
              return (
                <Pressable key={ll.id}
                  onPress={() => { setSelected(ll.id); HapticsService.impact('light'); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    padding: 12, borderRadius: 14, marginBottom: 6, borderWidth: 1,
                    backgroundColor: active ? accent + '18' : (isLight ? 'rgba(240,228,210,0.90)' : 'rgba(255,255,255,0.03)'),
                    borderColor: active ? accent + '66' : (isLight ? 'rgba(122,95,54,0.14)' : 'rgba(255,255,255,0.07)'),
                  }}>
                  <Text style={{ fontSize: 20 }}>{ll.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: active ? accent : textColor }}>{ll.label}</Text>
                    <Text style={{ fontSize: 11, color: subColor, lineHeight: 16, marginTop: 2 }}>{ll.desc}</Text>
                  </View>
                  {active && <CheckCircle2 size={16} color={accent} />}
                </Pressable>
              );
            })}
          </View>
        );
      })}
      {compatibility && (
        <View style={{
          borderRadius: 14, padding: 14, borderWidth: 1,
          backgroundColor: compatibility.color + '18',
          borderColor: compatibility.color + '55',
          marginTop: 4,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: compatibility.color, marginBottom: 4 }}>{compatibility.label}</Text>
          <Text style={{ fontSize: 12.5, color: textColor, lineHeight: 18, opacity: 0.85 }}>{compatibility.desc}</Text>
        </View>
      )}
    </Animated.View>
  );
};

// ─── Conflict Resolution Rituals ─────────────────────────────────────────────

const ConflictRituals = ({ isLight, textColor, subColor, cardBg, cardBorder, accent }) => {
  const { t } = useTranslation();

  const [activeStep, setActiveStep] = useState(null);

  return (
    <Animated.View entering={FadeInDown.delay(140).duration(520)}
      style={[s.sectionBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Wind size={15} color={accent} />
        <Text style={[s.sectionTitle, { color: textColor }]}>{t('partnerJournal.rytual_rozwiazywa_konfliktow', 'RYTUAŁ ROZWIĄZYWANIA KONFLIKTÓW')}</Text>
      </View>
      <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 16 }}>
        {t('partnerJournal.5_krokow_ktore_pomagaja_wrocic', '5 kroków, które pomagają wrócić do siebie w trudnych chwilach. Używajcie razem, gdy rozmowa staje się trudna.')}
      </Text>
      {CONFLICT_RITUALS.map((r, i) => {
        const isActive = activeStep === r.step;
        return (
          <Pressable key={r.step}
            onPress={() => { setActiveStep(isActive ? null : r.step); HapticsService.impact('light'); }}
            style={{
              flexDirection: 'row', alignItems: 'flex-start', gap: 12,
              padding: 14, borderRadius: 16, marginBottom: 8, borderWidth: 1,
              backgroundColor: isActive ? accent + '18' : (isLight ? 'rgba(240,228,210,0.90)' : 'rgba(255,255,255,0.03)'),
              borderColor: isActive ? accent + '66' : (isLight ? 'rgba(122,95,54,0.14)' : 'rgba(255,255,255,0.07)'),
            }}>
            <View style={{
              width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
              backgroundColor: isActive ? accent + '28' : (isLight ? 'rgba(255,246,230,0.92)' : 'rgba(255,255,255,0.08)'),
            }}>
              <Text style={{ fontSize: 16 }}>{r.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: isActive ? accent : subColor, letterSpacing: 1 }}>KROK {r.step}</Text>
              </View>
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: isActive ? accent : textColor, marginTop: 2 }}>
                {r.title}
              </Text>
              {isActive && (
                <Text style={{ fontSize: 12.5, color: subColor, lineHeight: 19, marginTop: 6 }}>{r.desc}</Text>
              )}
            </View>
            <Text style={{ fontSize: 11, color: isActive ? accent : subColor, marginTop: 2 }}>{isActive ? '▲' : '▼'}</Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
};

// ─── Daily Gratitude to Partner ───────────────────────────────────────────────

const DailyGratitude = ({ partnerName, isLight, textColor, subColor, cardBg, cardBorder, accent }) => {
  const { t } = useTranslation();

  const today = new Date().toISOString().slice(0, 10);
  const [log, setLog] = useState<Array<{ date: string; text: string }>>([]);
  const [input, setInput] = useState('');

  const todayEntry = log.find((e) => e.date === today);
  const streak = (() => {
    let s = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (log.find((e) => e.date === key)) s++;
      else break;
    }
    return s;
  })();

  const handleSave = () => {
    if (!input.trim()) return;
    HapticsService.notify();
    const entry = { date: today, text: input.trim() };
    setLog((prev) => [entry, ...prev.filter((e) => e.date !== today)]);
    setInput('');
  };

  const recent = log.slice(0, 5);

  return (
    <Animated.View entering={FadeInDown.delay(160).duration(520)}
      style={[s.sectionBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Sparkles size={15} color={accent} />
        <Text style={[s.sectionTitle, { color: textColor }]}>{t('partnerJournal.wdziecznos_dla_partnera', 'WDZIĘCZNOŚĆ DLA PARTNERA')}</Text>
        <View style={{ flex: 1 }} />
        {streak > 0 && (
          <View style={{ backgroundColor: '#FBBF2428', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#FBBF24' }}>{streak} DNI 🔥</Text>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 14 }}>
        Codziennie jedno zdanie — za co jesteś dziś wdzięczny/a {partnerName ?? 'partnerowi/ce'}?
      </Text>
      {todayEntry ? (
        <View style={{
          borderRadius: 14, padding: 14, borderWidth: 1,
          backgroundColor: accent + '14', borderColor: accent + '44',
        }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: accent, letterSpacing: 1.4, marginBottom: 6 }}>{t('partnerJournal.dzis_napisales_as', 'DZIŚ NAPISAŁEŚ/AŚ')}</Text>
          <Text style={{ fontSize: 14, color: textColor, lineHeight: 21, fontStyle: 'italic' }}>„{todayEntry.text}"</Text>
        </View>
      ) : (
        <View>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={`Dziękuję ${partnerName ?? 'Ci'} za...`}
            placeholderTextColor={subColor}
            multiline
            style={{
              fontSize: 13.5, lineHeight: 20, color: textColor,
              backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)',
              borderRadius: 14, borderWidth: 1,
              borderColor: isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.09)',
              padding: 12, minHeight: 72,
            }}
          />
          <Pressable
            onPress={handleSave}
            disabled={!input.trim()}
            style={{
              marginTop: 10, paddingVertical: 11, borderRadius: 14, alignItems: 'center',
              backgroundColor: input.trim() ? accent + '28' : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)'),
              borderWidth: 1, borderColor: input.trim() ? accent + '66' : 'transparent',
            }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: input.trim() ? accent : subColor }}>
              {t('partnerJournal.zapisz_wdziecznos', 'Zapisz wdzięczność')}
            </Text>
          </Pressable>
        </View>
      )}
      {recent.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: subColor, letterSpacing: 1.4, marginBottom: 8 }}>{t('partnerJournal.ostatnie_wpisy', 'OSTATNIE WPISY')}</Text>
          {recent.map((e, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
              <Text style={{ fontSize: 10, color: subColor, marginTop: 2, minWidth: 68 }}>
                {new Date(e.date).toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'short' })}
              </Text>
              <Text style={{ flex: 1, fontSize: 12.5, color: textColor, lineHeight: 18, opacity: 0.8, fontStyle: 'italic' }}>
                „{e.text}"
              </Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

// ─── Future Vision Board ──────────────────────────────────────────────────────

const VISION_HORIZONS = [
  { key: '1y', label: '1 rok', icon: '🌱', placeholder: 'Gdzie jesteście za rok? Co razem zbudowaliście?' },
  { key: '5y', label: '5 lat', icon: '🌳', placeholder: 'Jak wygląda Wasze wspólne życie za 5 lat?' },
  { key: 'life', label: 'Całe życie', icon: '∞', placeholder: 'Jaki ślad chcecie razem zostawić w świecie?' },
];

const FutureVisionBoard = ({ isLight, textColor, subColor, cardBg, cardBorder, accent }) => {
  const { t } = useTranslation();

  const [visions, setVisions] = useState({ '1y': '', '5y': '', life: '' });
  const [saved, setSaved] = useState(false);
  const visionSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (visionSavedTimerRef.current) clearTimeout(visionSavedTimerRef.current); };
  }, []);

  return (
    <Animated.View entering={FadeInDown.delay(180).duration(520)}
      style={[s.sectionBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Target size={15} color={accent} />
        <Text style={[s.sectionTitle, { color: textColor }]}>{t('partnerJournal.wizja_przyszlosc', 'WIZJA PRZYSZŁOŚCI')}</Text>
      </View>
      <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 16 }}>
        {t('partnerJournal.trzy_horyzonty_czasowe_waszego_zwia', 'Trzy horyzonty czasowe Waszego związku. Pisanie wizji razem jest aktem tworzenia wspólnej rzeczywistości.')}
      </Text>
      {VISION_HORIZONS.map((h) => (
        <View key={h.key} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 18 }}>{h.icon}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: accent, letterSpacing: 0.6 }}>{h.label.toUpperCase()}</Text>
          </View>
          <TextInput
            value={visions[h.key]}
            onChangeText={(v) => setVisions((p) => ({ ...p, [h.key]: v }))}
            placeholder={h.placeholder}
            placeholderTextColor={subColor}
            multiline
            style={{
              fontSize: 13.5, lineHeight: 20, color: textColor,
              backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)',
              borderRadius: 14, borderWidth: 1,
              borderColor: visions[h.key] ? accent + '55' : (isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.09)'),
              padding: 12, minHeight: 72,
            }}
          />
        </View>
      ))}
      <Pressable
        onPress={() => { HapticsService.notify(); setSaved(true); if (visionSavedTimerRef.current) clearTimeout(visionSavedTimerRef.current); visionSavedTimerRef.current = setTimeout(() => setSaved(false), 2200); }}
        style={{
          marginTop: 4, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
          backgroundColor: saved ? '#34D39944' : accent + '22',
          borderWidth: 1, borderColor: saved ? '#34D399' : accent + '55',
        }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: saved ? '#34D399' : accent }}>
          {saved ? '✓ Wizja zapisana' : 'Zapisz wspólną wizję'}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

// ─── Oracle dla Związku (AI) ──────────────────────────────────────────────────

const OracleRelationship = ({
  partnerData, myPath, partnerPath, compat,
  partnerEntries, isLight, textColor, subColor, cardBg, cardBorder, accent,
}) => {
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const ASK_PROMPTS = [
    'Jak możemy pogłębić nasze połączenie?',
    'Jakie wzorce powtarzają się w naszej relacji?',
    'Jak lepiej wspierać partnera?',
    'Co chce być uzdrowione w tej relacji?',
  ];

  const handleAsk = useCallback(async (text?: string) => {
    const question = text ?? query.trim();
    if (!question) return;
    setLoading(true);
    HapticsService.impact('light');
    try {
      const msgs = [
        {
          role: 'user' as const,
          content: `Jesteś Wyrocznią Związku — duchowym przewodnikiem w dziedzinie relacji, energii połączenia i wzajemnego wzrostu. Odpowiadasz w języku użytkownika, z mądrością i empatią.\n\nKontekst relacji:\n- Partner/ka: ${partnerData?.name ?? 'nieznany'}\n- Moja ścieżka numerologiczna: ${myPath ?? 'nieznana'}\n- Ścieżka partnera: ${partnerPath ?? 'nieznana'}\n- Harmonia numerologiczna: ${compat?.score ?? '?'}% (${compat?.label ?? ''})\n- Wspólne wpisy: ${partnerEntries}\n\nPytanie: ${question}\n\nOdpowiedz w 4-5 zdaniach: jedna główna obserwacja duchowa + jedna konkretna wskazówka.`,
        },
      ];
      const result = await AiService.chatWithOracle(msgs);
      setAnswer(result);
      HapticsService.notify();
    } catch {
      setAnswer('Wyrocznia milczy w tej chwili. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  }, [query, partnerData, myPath, partnerPath, compat, partnerEntries]);

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(520)}
      style={[s.sectionBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Sparkles size={15} color={accent} />
        <Text style={[s.sectionTitle, { color: textColor }]}>{t('partnerJournal.wyrocznia_dla_zwiazku', 'WYROCZNIA DLA ZWIĄZKU')}</Text>
      </View>
      <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginBottom: 14 }}>
        {t('partnerJournal.zadaj_pytanie_o_swoja_relacje', 'Zadaj pytanie o swoją relację — Wyrocznia patrzy przez pryzmat numerologii, wzorców i duchowych wzrostów.')}
      </Text>
      {/* Quick prompts */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
        {ASK_PROMPTS.map((p) => (
          <Pressable key={p}
            onPress={() => { setQuery(p); setAnswer(''); }}
            style={{
              paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
              borderWidth: 1, borderColor: accent + '44',
              backgroundColor: query === p ? accent + '22' : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)'),
            }}>
            <Text style={{ fontSize: 11, color: query === p ? accent : subColor, fontWeight: '600' }}>{p}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <TextInput
        value={query}
        onChangeText={(v) => { setQuery(v); setAnswer(''); }}
        placeholder={t('partnerJournal.wpisz_wlasne_pytanie_do_wyroczni', 'Wpisz własne pytanie do Wyroczni...')}
        placeholderTextColor={subColor}
        multiline
        style={{
          fontSize: 13.5, lineHeight: 20, color: textColor,
          backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)',
          borderRadius: 14, borderWidth: 1,
          borderColor: isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.09)',
          padding: 12, minHeight: 68,
        }}
      />
      <Pressable
        onPress={() => handleAsk()}
        disabled={loading || !query.trim()}
        style={{
          marginTop: 10, paddingVertical: 13, borderRadius: 14, alignItems: 'center',
          flexDirection: 'row', justifyContent: 'center', gap: 8,
          backgroundColor: query.trim() ? accent + '28' : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)'),
          borderWidth: 1, borderColor: query.trim() ? accent + '66' : 'transparent',
        }}>
        {loading
          ? <ActivityIndicator size="small" color={accent} />
          : <><Sparkles size={13} color={query.trim() ? accent : subColor} /><Text style={{ fontSize: 13, fontWeight: '700', color: query.trim() ? accent : subColor }}>{t('partnerJournal.zapytaj_wyrocznie', 'Zapytaj Wyrocznię')}</Text></>
        }
      </Pressable>
      {!!answer && (
        <View style={{
          marginTop: 14, borderRadius: 16, padding: 16, borderWidth: 1,
          backgroundColor: accent + '10', borderColor: accent + '33',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Sparkles size={12} color={accent} />
            <Text style={{ fontSize: 9, fontWeight: '700', color: accent, letterSpacing: 1.6 }}>{t('partnerJournal.odpowiedz_wyroczni', 'ODPOWIEDŹ WYROCZNI')}</Text>
          </View>
          <Text style={{ fontSize: 14, lineHeight: 22, color: textColor, opacity: 0.9, fontStyle: 'italic' }}>
            {answer}
          </Text>
          <Pressable
            onPress={() => { setAnswer(''); setQuery(''); }}
            style={{ marginTop: 12, alignSelf: 'flex-end' }}>
            <Text style={{ fontSize: 11, color: subColor }}>{t('partnerJournal.zadaj_nowe_pytanie', 'Zadaj nowe pytanie')}</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const PartnerJournalScreen = ({ navigation }) => {
  const { t } = useTranslation();
    const partnerData = useAppStore(s => s.partnerData);
  const setPartnerData = useAppStore(s => s.setPartnerData);
  const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
  const { entries, addEntry } = useJournalStore();
  const insets = useSafeAreaInsets();
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? '#6A5A48' : '#B0A393';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.10)';

  const [tab, setTab] = useState<'mine' | 'together' | 'rituals'>('together');
  const [selectedEntryType, setSelectedEntryType] = useState('together');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showStarModal, setShowStarModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const setupScrollRef = useRef<ScrollView>(null);

  const partnerTaggedEntries = entries.filter((e) => e.tags?.includes('partner'));
  const myEntries = entries.filter((e) => !e.tags?.includes('partner')).slice(0, 8);

  const myPath = userData?.birthDate ? birthDateToLifePath(userData.birthDate) : null;
  const partnerPath = partnerData?.birthDate ? birthDateToLifePath(partnerData.birthDate) : null;
  const compat = myPath && partnerPath ? compatibilityDesc(myPath, partnerPath) : null;

  const handleSetup = (name: string, birthDate: string, startDate?: string) => {
    setPartnerData({ name, birthDate, ...(startDate ? { startDate } : {}) });
    HapticsService.notify();
  };

  const generateAnalysis = useCallback(async () => {
    if (!partnerData) return;
    setAiLoading(true);
    HapticsService.impact('light');
    try {
      const recentEntries = partnerTaggedEntries.slice(0, 8).map((e) =>
        `[${e.type}] ${e.title ?? ''}: ${(e.content ?? '').slice(0, 80)}`
      ).join('\n');
      const messages = [
        {
          role: 'user' as const,
          content: `Jestem w związku z ${partnerData.name}. Moja liczba życia: ${myPath ?? 'nieznana'}. Partnera: ${partnerPath ?? 'nieznana'}. Kompatybilność: ${compat?.score ?? '?'}%.\n\nWpisy ze wspólnego dziennika:\n${recentEntries || 'Brak wpisów.'}\n\nProszę o krótką (3-4 zdania) duchową analizę harmonii tego związku i jedną wskazówkę na pogłębienie połączenia. W języku użytkownika.`,
        },
      ];
      const result = await AiService.chatWithOracle(messages);
      setAiAnalysis(result);
      HapticsService.notify();
    } catch {
      setAiAnalysis('Nie udało się pobrać analizy. Spróbuj ponownie.');
    } finally {
      setAiLoading(false);
    }
  }, [partnerData, myPath, partnerPath, compat, partnerTaggedEntries]);

  const addTogetherEntry = () => {
    const typeLabel = ENTRY_TYPES.find((t) => t.id === selectedEntryType)?.label ?? 'razem';
    navigation.navigate('JournalEntry', {
      type: selectedEntryType,
      prompt: `Wpis "${typeLabel}" z ${partnerData?.name ?? 'partnerem'}`,
    });
  };

  const TABS = [
    { id: 'together', label: 'Razem' },
    { id: 'mine', label: 'Moje' },
    { id: 'rituals', label: 'Rytuały' },
  ] as const;

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={[s.root, {}]} edges={['top']}>

      <PartnerJournalBg isLight={isLight} />

      {/* Header */}
      <View style={[s.header, { paddingHorizontal: SP }]}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={s.backBtn} hitSlop={12}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[s.headerEyebrow, { color: ACCENT }]}>{t('partnerJournal.wspolna_przestrzen', 'WSPÓLNA PRZESTRZEŃ')}</Text>
          <Text style={[s.headerTitle, { color: textColor }]}>{t('partnerJournal.dziennik_pary', 'Dziennik Pary')}</Text>
        </View>
        {partnerData ? (
          <Pressable onPress={() => setShowResetConfirm(true)} style={s.backBtn} hitSlop={12}>
            <RotateCcw size={17} color={subColor} />
          </Pressable>
        ) : null}
        <Pressable onPress={() => setShowStarModal(true)} style={s.backBtn} hitSlop={12}>
          <Star size={18} color={ACCENT} />
        </Pressable>
      </View>

      {/* Reset confirmation modal */}
      <Modal visible={showResetConfirm} transparent animationType="fade" onRequestClose={() => setShowResetConfirm(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setShowResetConfirm(false)}>
          <View style={{
            backgroundColor: isLight ? '#FFF' : '#1C0D18', borderRadius: 20, padding: 28,
            marginHorizontal: 32, borderWidth: 1, borderColor: ACCENT + '44',
          }}>
            <Text style={{ color: textColor, fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 10 }}>
              {t('partnerJournal.zmien_partnera_ke', 'Zmień partnera/kę?')}
            </Text>
            <Text style={{ color: subColor, fontSize: 14, textAlign: 'center', marginBottom: 22, lineHeight: 20 }}>
              Dane {partnerData?.name} zostaną usunięte. Będziesz mógł/mogła skonfigurować dziennik od nowa.
            </Text>
            <Pressable onPress={() => { setPartnerData(null); setShowResetConfirm(false); HapticsService.notify(); }}
              style={{ backgroundColor: ACCENT, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{t('partnerJournal.tak_zresetuj', 'Tak, zresetuj')}</Text>
            </Pressable>
            <Pressable onPress={() => setShowResetConfirm(false)}
              style={{ borderRadius: 12, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: subColor, fontSize: 14 }}>{t('partnerJournal.anuluj', 'Anuluj')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {!partnerData ? (
        <ScrollView
          ref={setupScrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <HeartWidget3D accent={ACCENT} />
          <Animated.View entering={FadeInDown.delay(40).duration(520)}
            style={[s.storyCard, { backgroundColor: cardBg, borderColor: ACCENT + '32', marginHorizontal: SP }]}>
            <View style={s.storyGlow} />
            <Text style={[s.storyEyebrow, { color: ACCENT }]}>{t('partnerJournal.przestrzen_dla_dwojga', 'PRZESTRZEŃ DLA DWOJGA')}</Text>
            <Text style={[s.storyLead, { color: textColor }]}>{t('partnerJournal.to_nie_zwykly_modul_relacji', 'To nie zwykły moduł relacji. To wspólne sanktuarium, w którym zapisujecie rytm, napięcia, czułość i kierunek waszej więzi.')}</Text>
            <Text style={[s.storyBody, { color: subColor }]}>{t('partnerJournal.po_konfigurac_otwieraja_sie_wspolne', 'Po konfiguracji otwierają się: wspólne wpisy, analiza harmonii, tablica intencji, oś czasu relacji i Wyrocznia Związku.')}</Text>
          </Animated.View>
          <SetupForm
            onSave={handleSetup}
            isLight={isLight}
            textColor={textColor}
            subColor={subColor}
            cardBg={cardBg}
            cardBorder={cardBorder}
            onFieldFocus={(y) => setTimeout(() => setupScrollRef.current?.scrollTo({ y, animated: true }), 180)}
          />
          <EndOfContentSpacer size="standard" />
        </ScrollView>
      ) : (
        <>
          {/* Tabs */}
          <View style={[s.tabRow, { marginHorizontal: SP, borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }]}>
            {TABS.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => { setTab(t.id); HapticsService.impact('light'); }}
                style={[s.tabBtn, tab === t.id && { backgroundColor: ACCENT + '22', borderColor: ACCENT + '55' }]}
              >
                <Text style={[s.tabLabel, { color: tab === t.id ? ACCENT : subColor }]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingHorizontal: SP }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Soul map hero widget */}
            <SoulMapWidget accent={ACCENT} isLight={isLight} />

            {/* Relationship Stats */}
            <RelationshipStats
              partnerData={partnerData}
              partnerEntries={partnerTaggedEntries.length}
              compat={compat}
              isLight={isLight}
              textColor={textColor}
              subColor={subColor}
            />

            {/* Compatibility card */}
            {compat && (
              <Animated.View entering={FadeInDown.duration(500)}
                style={[s.compatCard, { backgroundColor: cardBg, borderColor: cardBorder, marginBottom: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <View style={[s.compatBadge, { backgroundColor: ACCENT + '22' }]}>
                    <Text style={[s.compatScore, { color: ACCENT }]}>{compat.score}%</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.compatLabel, { color: ACCENT }]}>{compat.label}</Text>
                    <Text style={[s.compatSub, { color: subColor }]}>
                      Twoja ścieżka: {myPath} · {partnerData.name}: {partnerPath}
                    </Text>
                  </View>
                </View>
                <Text style={[s.compatDesc, { color: textColor }]}>{compat.desc}</Text>
              </Animated.View>
            )}

            {/* ── TAB: RAZEM ── */}
            {tab === 'together' && (
              <>
                {/* Story card */}
                <Animated.View entering={FadeInDown.delay(40).duration(520)}
                  style={[s.storyCard, { backgroundColor: cardBg, borderColor: ACCENT + '32' }]}>
                  <View style={s.storyGlow} />
                  <Text style={[s.storyEyebrow, { color: ACCENT }]}>{t('partnerJournal.dziennik_relacji', 'DZIENNIK RELACJI')}</Text>
                  <Text style={[s.storyLead, { color: textColor }]}>{t('partnerJournal.ta_przestrzen_zbiera_nie_tylko', 'Ta przestrzeń zbiera nie tylko wspomnienia, ale też wzorce bliskości, napięcia i sposoby, w jakie wracacie do siebie.')}</Text>
                  <Text style={[s.storyBody, { color: subColor }]}>{t('partnerJournal.uzywajcie_wspolnych_wpisow_jak_mapy', 'Używajcie wspólnych wpisów jak mapy relacji: co was wzmacnia, co oddala i co chce zostać nazwane spokojniej.')}</Text>
                </Animated.View>

                {/* AI Analysis */}
                <Animated.View entering={FadeInDown.delay(60).duration(500)}
                  style={[s.aiCard, { backgroundColor: cardBg, borderColor: cardBorder, marginBottom: 16 }]}>
                  <View style={s.aiCardHeader}>
                    <Sparkles size={14} color={ACCENT} />
                    <Text style={[s.aiCardTitle, { color: ACCENT }]}>{t('partnerJournal.analiza_harmonii_ai', 'ANALIZA HARMONII AI')}</Text>
                  </View>
                  {aiAnalysis ? (
                    <>
                      <Text style={[s.aiCardText, { color: textColor }]}>{aiAnalysis}</Text>
                      <Pressable onPress={() => setAiAnalysis('')} style={{ marginTop: 10, alignSelf: 'flex-end' }}>
                        <Text style={{ fontSize: 11, color: subColor }}>{t('partnerJournal.odswiez_analize', 'Odśwież analizę')}</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      onPress={generateAnalysis}
                      disabled={aiLoading}
                      style={[s.aiCta, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '44' }]}
                    >
                      {aiLoading
                        ? <ActivityIndicator size="small" color={ACCENT} />
                        : <Text style={[s.aiCtaText, { color: ACCENT }]}>{t('partnerJournal.analizuj_harmonie_zwiazku', '✨ Analizuj harmonię związku')}</Text>
                      }
                    </Pressable>
                  )}
                </Animated.View>

                {/* Entry type chips + new entry */}
                <View style={{ marginBottom: 6 }}>
                  <Text style={[s.sectionTitle, { color: textColor, marginBottom: 10 }]}>{t('partnerJournal.typ_wpisu', 'TYP WPISU')}</Text>
                  <EntryTypeChips
                    selected={selectedEntryType}
                    onSelect={setSelectedEntryType}
                    isLight={isLight}
                    subColor={subColor}
                  />
                </View>

                {/* Together entries */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={[s.sectionTitle, { color: textColor }]}>WSPÓLNE WPISY ({partnerTaggedEntries.length})</Text>
                  <Pressable
                    onPress={addTogetherEntry}
                    style={[s.addEntryBtn, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '55' }]}
                  >
                    <PenLine size={13} color={ACCENT} />
                    <Text style={[s.addEntryText, { color: ACCENT }]}>{t('partnerJournal.nowy_wpis', 'Nowy wpis')}</Text>
                  </Pressable>
                </View>
                {partnerTaggedEntries.length === 0 ? (
                  <View style={[s.emptyState, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <Heart size={28} color={ACCENT} strokeWidth={1.5} />
                    <Text style={[s.emptyStateTitle, { color: textColor }]}>{t('partnerJournal.brak_wspolnych_wpisow', 'Brak wspólnych wpisów')}</Text>
                    <Text style={[s.emptyStateSub, { color: subColor }]}>{t('partnerJournal.dodaj_pierwszy_wspolny_wpis_i', 'Dodaj pierwszy wspólny wpis i zacznijcie razem śledzić swoją duchową podróż.')}</Text>
                    <Pressable onPress={addTogetherEntry} style={[s.emptyBtn, { backgroundColor: ACCENT + 'DD' }]}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{t('partnerJournal.nowy_wpis_dla_nas', 'Nowy wpis dla nas')}</Text>
                    </Pressable>
                  </View>
                ) : (
                  partnerTaggedEntries.map((e) => <EntryCard key={e.id} entry={e} isLight={isLight} />)
                )}

                {/* Intention board */}
                <IntentionBoard
                  isLight={isLight} textColor={textColor} subColor={subColor}
                  cardBg={cardBg} cardBorder={cardBorder} accent={ACCENT}
                />

                {/* Daily gratitude */}
                <DailyGratitude
                  partnerName={partnerData.name}
                  isLight={isLight} textColor={textColor} subColor={subColor}
                  cardBg={cardBg} cardBorder={cardBorder} accent={ACCENT}
                />

                {/* Future vision board */}
                <FutureVisionBoard
                  isLight={isLight} textColor={textColor} subColor={subColor}
                  cardBg={cardBg} cardBorder={cardBorder} accent={ACCENT}
                />

                {/* Oracle */}
                <OracleRelationship
                  partnerData={partnerData} myPath={myPath} partnerPath={partnerPath}
                  compat={compat} partnerEntries={partnerTaggedEntries.length}
                  isLight={isLight} textColor={textColor} subColor={subColor}
                  cardBg={cardBg} cardBorder={cardBorder} accent={ACCENT}
                />
              </>
            )}

            {/* ── TAB: MOJE ── */}
            {tab === 'mine' && (
              <>
                <Text style={[s.sectionTitle, { color: textColor, marginTop: 4, marginBottom: 10 }]}>{t('partnerJournal.ostatnie_wpisy_1', 'OSTATNIE WPISY')}</Text>
                {myEntries.length === 0 ? (
                  <Text style={[s.emptyText, { color: subColor }]}>{t('partnerJournal.brak_wpisow_w_dzienniku', 'Brak wpisów w dzienniku.')}</Text>
                ) : (
                  myEntries.map((e) => <EntryCard key={e.id} entry={e} isLight={isLight} />)
                )}

                {/* Relationship timeline */}
                <RelationshipTimeline
                  isLight={isLight} textColor={textColor} subColor={subColor}
                  cardBg={cardBg} cardBorder={cardBorder} accent={ACCENT}
                />

                {/* Love language */}
                <LoveLanguageProfile
                  partnerName={partnerData.name}
                  isLight={isLight} textColor={textColor} subColor={subColor}
                  cardBg={cardBg} cardBorder={cardBorder} accent={ACCENT}
                />
              </>
            )}

            {/* ── TAB: RYTUAŁY ── */}
            {tab === 'rituals' && (
              <>
                <Animated.View entering={FadeInDown.delay(40).duration(500)}
                  style={[s.storyCard, { backgroundColor: cardBg, borderColor: ACCENT + '32' }]}>
                  <View style={s.storyGlow} />
                  <Text style={[s.storyEyebrow, { color: ACCENT }]}>{t('partnerJournal.rytualy_relacji', 'RYTUAŁY RELACJI')}</Text>
                  <Text style={[s.storyLead, { color: textColor }]}>{t('partnerJournal.narzedzia_do_budowania_bezpieczen_i', 'Narzędzia do budowania bezpieczeństwa, intymności i rozwiązywania napięć w związku.')}</Text>
                  <Text style={[s.storyBody, { color: subColor }]}>{t('partnerJournal.rytualy_to_nie_magia_to', 'Rytuały to nie magia — to powtarzalne gesty uwagi, które z czasem tworzą filar bezpiecznej relacji.')}</Text>
                </Animated.View>

                <ConflictRituals
                  isLight={isLight} textColor={textColor} subColor={subColor}
                  cardBg={cardBg} cardBorder={cardBorder} accent={ACCENT}
                />
              </>
            )}

            {/* ── Co dalej? ── */}
            <View style={{ marginTop: 8, marginBottom: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.8, color: ACCENT, marginBottom: 12 }}>{t('partnerJournal.co_dalej', '✦ CO DALEJ?')}</Text>
              {[
                { icon: Sparkles, label: 'Horoskop partnerski', sub: 'Sprawdź energię relacji w mapie nieba', color: '#A78BFA', route: 'PartnerHoroscope' },
                { icon: Heart, label: 'Zgodność znaków', sub: 'Zbadaj dynamikę żywiołów i trybów', color: '#F472B6', route: 'Compatibility' },
                { icon: BookOpen, label: 'Nowy wpis refleksyjny', sub: 'Zapisz, co czujesz w tej relacji dziś', color: ACCENT, route: 'JournalEntry', params: { type: 'reflection', prompt: 'W naszej relacji teraz...' } },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => navigation.navigate(item.route as any, (item as any).params)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10,
                      backgroundColor: cardBg, borderColor: item.color + '33',
                    }}
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
        </>
      )}

      {/* Star / Favorite modal */}
      <Modal visible={showStarModal} transparent animationType="fade" onRequestClose={() => setShowStarModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setShowStarModal(false)}>
          <View style={{
            width: 300, borderRadius: 24, padding: 24,
            backgroundColor: isLight ? '#FFF8FB' : '#1C0D18',
            borderWidth: 1, borderColor: ACCENT + '55',
          }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, textAlign: 'center', marginBottom: 8 }}>
              {t('partnerJournal.dodaj_do_ulubionych', 'Dodaj do ulubionych')}
            </Text>
            <Text style={{ fontSize: 13, color: subColor, textAlign: 'center', lineHeight: 19, marginBottom: 20 }}>
              {t('partnerJournal.dodaj_dziennik_pary_do_portalu', 'Dodaj Dziennik Pary do Portalu, aby mieć szybki dostęp z głównego ekranu.')}
            </Text>
            <Pressable
              onPress={() => setShowStarModal(false)}
              style={{ paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: ACCENT + '28', borderWidth: 1, borderColor: ACCENT + '66' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>{t('partnerJournal.dodaj_do_portalu', 'Dodaj do Portalu')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
        </SafeAreaView>
</View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  tabRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  compatCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  compatBadge: {
    width: 56, height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compatScore: {
    fontSize: 20,
    fontWeight: '800',
  },
  compatLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  compatSub: {
    fontSize: 10,
    fontWeight: '600',
  },
  compatDesc: {
    fontSize: 13.5,
    lineHeight: 20,
    opacity: 0.84,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  aiCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  aiCardTitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  aiCardText: {
    fontSize: 13.5,
    lineHeight: 21,
    opacity: 0.88,
  },
  aiCta: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  aiCtaText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  addEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  addEntryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyStateSub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    opacity: 0.72,
  },
  emptyBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  setupCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 22,
  },
  storyCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },
  storyGlow: {
    position: 'absolute', width: 180, height: 180, borderRadius: 999,
    backgroundColor: 'rgba(236,72,153,0.08)', top: -70, right: -20,
  },
  storyEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  storyLead: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '700',
    marginTop: 10,
  },
  storyBody: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  setupSub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    opacity: 0.72,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 6,
  },
  fieldInput: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14.5,
  },
  setupBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
});
