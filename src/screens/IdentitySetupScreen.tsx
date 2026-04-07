// @ts-nocheck
import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  Dimensions,
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
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, ChevronLeft, ChevronRight, Sparkles, Star, CornerDownLeft } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { calcZodiacSign, calcLifePath, calcAscendant } from '../core/utils/astroCalculations';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
import { PremiumDatePickerSheet } from '../components/PremiumDatePickerSheet';
import { LinearGradient as LG } from 'expo-linear-gradient';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCENT = '#CEAE72';
const ACCENT_DIM = '#CEAE7299';
const BG_GRAD = ['#05030E', '#0A0618', '#0E0B22'] as const;
const CARD_BG = 'rgba(255,255,255,0.06)';
const CARD_BORDER = 'rgba(206,174,114,0.25)';
const CARD_BORDER_ACTIVE = ACCENT;
const TEXT_PRIMARY = '#F5F1EA';
const TEXT_SUB = 'rgba(245,241,234,0.55)';
const TOTAL_STEPS = 4;

// ─── Polish month names ───────────────────────────────────────────────────────

const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

// ─── Zodiac detection ─────────────────────────────────────────────────────────

const ZODIAC_SIGNS = [
  { name: 'Koziorożec', symbol: '♑', start: [12, 22], end: [1, 19] },
  { name: 'Wodnik',     symbol: '♒', start: [1, 20],  end: [2, 18] },
  { name: 'Ryby',       symbol: '♓', start: [2, 19],  end: [3, 20] },
  { name: 'Baran',      symbol: '♈', start: [3, 21],  end: [4, 19] },
  { name: 'Byk',        symbol: '♉', start: [4, 20],  end: [5, 20] },
  { name: 'Bliźnięta',  symbol: '♊', start: [5, 21],  end: [6, 20] },
  { name: 'Rak',        symbol: '♋', start: [6, 21],  end: [7, 22] },
  { name: 'Lew',        symbol: '♌', start: [7, 23],  end: [8, 22] },
  { name: 'Panna',      symbol: '♍', start: [8, 23],  end: [9, 22] },
  { name: 'Waga',       symbol: '♎', start: [9, 23],  end: [10, 22] },
  { name: 'Skorpion',   symbol: '♏', start: [10, 23], end: [11, 21] },
  { name: 'Strzelec',   symbol: '♐', start: [11, 22], end: [12, 21] },
];

const getZodiac = (day: number, month: number) => {
  if (!day || !month) return null;
  for (const z of ZODIAC_SIGNS) {
    const [sm, sd] = z.start;
    const [em, ed] = z.end;
    if (
      (month === sm && day >= sd) ||
      (month === em && day <= ed)
    ) return z;
  }
  return ZODIAC_SIGNS[0]; // Koziorożec fallback
};

// ─── Numerological energy from name ──────────────────────────────────────────

const LETTER_VALUES: Record<string, number> = {
  a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
  j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
  s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8,
  ą: 1, ć: 3, ę: 5, ł: 3, ń: 5, ó: 6, ś: 1, ź: 8, ż: 8,
};

const reduceToSingle = (n: number): number => {
  let v = n;
  while (v > 9 && v !== 11 && v !== 22 && v !== 33) {
    let s = 0;
    let tmp = v;
    while (tmp > 0) { s += tmp % 10; tmp = Math.floor(tmp / 10); }
    v = s;
  }
  return v || 1;
};

const calcNameEnergy = (name: string): number => {
  if (!name || name.length < 1) return 0;
  const lower = name.toLowerCase().replace(/[^a-ząćęłńóśźż]/g, '');
  if (!lower) return 0;
  let sum = 0;
  for (const ch of lower) {
    sum += LETTER_VALUES[ch] ?? 0;
  }
  return reduceToSingle(sum);
};

const ENERGY_LABELS: Record<number, string> = {
  1: 'Lider · Pionier',
  2: 'Dyplomata · Intuicja',
  3: 'Twórca · Ekspresja',
  4: 'Budowniczy · Porządek',
  5: 'Wolność · Zmiana',
  6: 'Opiekun · Harmonia',
  7: 'Mistyk · Wiedza',
  8: 'Moc · Obfitość',
  9: 'Mędrzec · Służba',
  11: 'Mistrz · Illuminacja',
  22: 'Mistrz Budowniczy',
  33: 'Mistrz Nauczyciel',
};

// ─── Experience level options ─────────────────────────────────────────────────

const EXPERIENCE_OPTIONS = [
  {
    id: 'beginner' as const,
    icon: '🌱',
    title: 'Zaczynający',
    desc: 'Dopiero odkrywam świat symboli i rytuałów',
    gradStart: 'rgba(134,239,172,0.12)',
    gradEnd: 'rgba(74,222,128,0.04)',
  },
  {
    id: 'intermediate' as const,
    icon: '🔮',
    title: 'Podróżnik',
    desc: 'Znam podstawy i chcę rozwijać praktykę',
    gradStart: 'rgba(167,139,250,0.14)',
    gradEnd: 'rgba(139,92,246,0.05)',
  },
  {
    id: 'advanced' as const,
    icon: '⭐',
    title: 'Adept',
    desc: 'Pracuję z symboliką i rytuałami od lat',
    gradStart: 'rgba(206,174,114,0.16)',
    gradEnd: 'rgba(206,174,114,0.05)',
  },
];

// ─── StarField background ─────────────────────────────────────────────────────

const STARS = Array.from({ length: 60 }, (_, i) => ({
  key: i,
  left: (i * 137.508) % 100,
  top: (i * 97.131) % 100,
  size: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 1.8 : 1.2,
  opacity: 0.15 + (i % 7) * 0.06,
}));

const StarField = () => (
  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    {STARS.map((s) => (
      <View
        key={s.key}
        style={{
          position: 'absolute',
          left: `${s.left}%`,
          top: `${s.top}%`,
          width: s.size,
          height: s.size,
          borderRadius: s.size / 2,
          backgroundColor: '#CEAE72',
          opacity: s.opacity,
        }}
      />
    ))}
  </View>
);

// ─── Progress dots ────────────────────────────────────────────────────────────

const ProgressDots = ({ step }: { step: number }) => (
  <View style={styles.dotsRow}>
    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
      <View
        key={i}
        style={[
          styles.dot,
          i < step ? styles.dotDone : i === step ? styles.dotActive : styles.dotIdle,
        ]}
      />
    ))}
  </View>
);

// ─── Styled input ─────────────────────────────────────────────────────────────

interface StyledInputProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoFocus?: boolean;
  icon?: React.ReactNode;
  returnKeyType?: 'done' | 'next' | 'go';
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
  multiline?: boolean;
}

const StyledInput = ({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'words',
  autoFocus = false,
  icon,
  returnKeyType = 'done',
  onSubmitEditing,
  blurOnSubmit = true,
  multiline = false,
}: StyledInputProps) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
      {icon && <View style={styles.inputIcon}>{icon}</View>}
      <TextInput
        style={[styles.input, icon ? { paddingLeft: 6 } : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(245,241,234,0.30)"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={blurOnSubmit}
        multiline={multiline}
        selectionColor={ACCENT}
      />
      {onSubmitEditing && (
        <Pressable onPress={onSubmitEditing} style={{ paddingLeft: 8, paddingRight: 4, paddingVertical: 4 }} hitSlop={8}>
          <CornerDownLeft color="rgba(206,174,114,0.45)" size={16} strokeWidth={1.5} />
        </Pressable>
      )}
    </View>
  );
};

// ─── CTA Button ───────────────────────────────────────────────────────────────

const CtaButton = ({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => (
  <Pressable
    onPress={disabled ? undefined : onPress}
    style={({ pressed }) => [styles.ctaOuter, pressed && { opacity: 0.82 }]}
  >
    <LinearGradient
      colors={disabled ? ['rgba(206,174,114,0.28)', 'rgba(206,174,114,0.14)'] : [ACCENT, ACCENT + 'CC']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.ctaGradient}
    >
      <Text style={[styles.ctaLabel, disabled && { color: 'rgba(245,241,234,0.35)' }]}>{label}</Text>
      {!disabled && <ChevronRight size={18} color="#05030E" />}
    </LinearGradient>
  </Pressable>
);

// ─── Back button ──────────────────────────────────────────────────────────────

const BackBtn = ({ onPress }: { onPress: () => void }) => (
  <Pressable onPress={onPress} hitSlop={12} style={styles.backBtn}>
    <ChevronLeft size={22} color={ACCENT} />
  </Pressable>
);

// ─── Energy Badge ─────────────────────────────────────────────────────────────

const EnergyBadge = ({ value }: { value: number }) => {
  const { isLight } = useTheme();
  if (!value) return null;
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.energyBadge}>
      <Text style={styles.energyNumber}>{value}</Text>
      <Text style={[styles.energyLabel, isLight && { color: 'rgba(0,0,0,0.60)' }]}>{ENERGY_LABELS[value] ?? 'Energia imienia'}</Text>
    </Animated.View>
  );
};

// ─── Zodiac Card ─────────────────────────────────────────────────────────────

const ZodiacCard = ({ sign }: { sign: { name: string; symbol: string } | null }) => {
  if (!sign) return null;
  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.zodiacCard}>
      <LinearGradient
        colors={['rgba(206,174,114,0.14)', 'rgba(206,174,114,0.04)']}
        style={styles.zodiacGrad}
      >
        <Text style={styles.zodiacSymbol}>{sign.symbol}</Text>
        <View>
          <Text style={styles.zodiacLabel}>Twój znak zodiaku</Text>
          <Text style={styles.zodiacName}>{sign.name}</Text>
        </View>
        <Sparkles size={16} color={ACCENT} style={{ marginLeft: 'auto' }} />
      </LinearGradient>
    </Animated.View>
  );
};

// ─── Picker row ───────────────────────────────────────────────────────────────

interface PickerRowProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
}

const PickerRow = ({ label, value, options, onSelect }: PickerRowProps) => {
  const [open, setOpen] = useState(false);
  const { isLight } = useTheme();
  return (
    <View style={styles.pickerGroup}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <Pressable
        style={[styles.pickerBtn, open && styles.pickerBtnOpen]}
        onPress={() => setOpen((o) => !o)}
      >
        <Text
          style={[value ? styles.pickerValue : styles.pickerPlaceholder, isLight && !value && { color: 'rgba(0,0,0,0.30)' }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value || 'Wybierz...'}
        </Text>
        <ChevronRight
          size={15}
          color={ACCENT_DIM}
          style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}
        />
      </Pressable>
      {open && (
        <Animated.View entering={FadeInDown.duration(200)} style={[styles.pickerDropdown, { backgroundColor: isLight ? '#FFFFFF' : '#0E0B22' }]}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
            {options.map((opt, idx) => (
              <Pressable
                key={idx}
                style={[styles.pickerOption, opt === value && styles.pickerOptionActive]}
                onPress={() => { onSelect(opt); setOpen(false); }}
              >
                <Text style={[styles.pickerOptionText, opt === value && { color: ACCENT }]}>
                  {opt}
                </Text>
                {opt === value && <Star size={12} color={ACCENT} />}
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
};

// ─── Step 1: Name ─────────────────────────────────────────────────────────────

const Step1 = ({
  name,
  setName,
  lastName,
  setLastName,
}: {
  name: string;
  setName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
}) => {
  const energy = useMemo(() => (name.length >= 3 ? calcNameEnergy(name) : 0), [name]);
  const lastRef = useRef<TextInput>(null);

  return (
    <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepEyebrow}>✦ KROK 1 / 4</Text>
        <Text style={styles.stepTitle}>Jak się nazywasz?</Text>
        <Text style={styles.stepSubtitle}>Twoje imię jest kodem Twojej duszy</Text>
      </View>

      <View style={styles.inputsGroup}>
        <StyledInput
          value={name}
          onChangeText={setName}
          placeholder="Imię"
          autoFocus
          returnKeyType="next"
          onSubmitEditing={() => lastRef.current?.focus()}
          blurOnSubmit={false}
        />
        <View style={{ height: 12 }} />
        <StyledInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Nazwisko"
          returnKeyType="done"
        />
      </View>

      {energy > 0 && <EnergyBadge value={energy} />}

      {name.length >= 3 && (
        <Animated.View entering={FadeInUp.duration(400)} style={styles.soulHint}>
          <Sparkles size={13} color={ACCENT} />
          <Text style={styles.soulHintText}>
            Energia wibracyjna imienia "{name}" — liczba {energy}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

// ─── Step 2: Birth Date ───────────────────────────────────────────────────────

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const YEAR_LIST = Array.from({ length: 71 }, (_, i) => String(2010 - i));

const Step2 = ({
  day, setDay,
  month, setMonth,
  year, setYear,
  birthTime, setBirthTime,
}: {
  day: string; setDay: (v: string) => void;
  month: string; setMonth: (v: string) => void;
  year: string; setYear: (v: string) => void;
  birthTime: string; setBirthTime: (v: string) => void;
}) => {
  const zodiac = useMemo(() => {
    const d = parseInt(day);
    const m = parseInt(month);
    if (d && m) return getZodiac(d, m);
    return null;
  }, [day, month]);

  const [showTimePicker, setShowTimePicker] = useState(false);

  // Build a Date from birthTime string (HH:MM) for the picker initial value
  const timePickerValue = useMemo(() => {
    if (birthTime && /^\d{1,2}:\d{2}$/.test(birthTime)) {
      const [h, m] = birthTime.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d;
    }
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }, [birthTime]);

  return (
    <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepEyebrow}>✦ KROK 2 / 4</Text>
        <Text style={styles.stepTitle}>Kiedy przyszłeś/aś na świat?</Text>
        <Text style={styles.stepSubtitle}>Data urodzenia otwiera mapę Twojej duszy</Text>
      </View>

      <View style={styles.dateRow}>
        <View style={{ flex: 1 }}>
          <PickerRow
            label="Dzień"
            value={day}
            options={DAYS}
            onSelect={setDay}
          />
        </View>
        <View style={{ width: 10 }} />
        <View style={{ flex: 2 }}>
          <PickerRow
            label="Miesiąc"
            value={month ? MONTHS_PL[parseInt(month) - 1] : ''}
            options={MONTHS_PL}
            onSelect={(v) => {
              const idx = MONTHS_PL.indexOf(v);
              setMonth(idx >= 0 ? String(idx + 1) : '');
            }}
          />
        </View>
        <View style={{ width: 10 }} />
        <View style={{ flex: 2 }}>
          <PickerRow
            label="Rok"
            value={year}
            options={YEAR_LIST}
            onSelect={setYear}
          />
        </View>
      </View>

      <ZodiacCard sign={zodiac} />

      <View style={{ marginTop: 20 }}>
        <Text style={styles.optionalLabel}>Godzina urodzenia (opcjonalnie)</Text>
        <Pressable
          onPress={() => setShowTimePicker(true)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: pressed ? 'rgba(206,174,114,0.12)' : CARD_BG,
            borderWidth: 1,
            borderColor: birthTime ? CARD_BORDER_ACTIVE : CARD_BORDER,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 15,
            marginTop: 6,
          })}
        >
          <Text style={{ fontSize: 18, marginRight: 10 }}>🕐</Text>
          <Text style={{
            flex: 1,
            fontSize: 16,
            color: birthTime ? TEXT_PRIMARY : TEXT_SUB,
            fontWeight: birthTime ? '600' : '400',
            letterSpacing: birthTime ? 1.5 : 0,
          }}>
            {birthTime || 'Wybierz godzinę...'}
          </Text>
          {birthTime ? (
            <Pressable
              onPress={(e) => { e.stopPropagation(); setBirthTime(''); }}
              hitSlop={10}
              style={{ paddingLeft: 8 }}
            >
              <Text style={{ color: TEXT_SUB, fontSize: 18 }}>×</Text>
            </Pressable>
          ) : (
            <ChevronRight size={18} color={ACCENT_DIM} />
          )}
        </Pressable>

        <Text style={styles.optionalHint}>
          Godzina urodzenia pozwala wyliczyć Twój ascendent i wykreślić pełny horoskop natywny.
        </Text>

        <PremiumDatePickerSheet
          visible={showTimePicker}
          mode="time"
          title="Godzina urodzenia"
          description="Wybierz godzinę i minutę urodzenia"
          value={timePickerValue}
          onCancel={() => setShowTimePicker(false)}
          onConfirm={(date) => {
            const h = String(date.getHours()).padStart(2, '0');
            const m = String(date.getMinutes()).padStart(2, '0');
            setBirthTime(`${h}:${m}`);
            setShowTimePicker(false);
          }}
        />
      </View>
    </Animated.View>
  );
};

// ─── Step 3: Birth Place ──────────────────────────────────────────────────────

const Step3 = ({
  birthPlace,
  setBirthPlace,
}: {
  birthPlace: string;
  setBirthPlace: (v: string) => void;
}) => (
  <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.stepContainer}>
    <View style={styles.stepHeader}>
      <Text style={styles.stepEyebrow}>✦ KROK 3 / 4</Text>
      <Text style={styles.stepTitle}>Gdzie zaczęło się{'\n'}Twoje życie?</Text>
      <Text style={styles.stepSubtitle}>
        Miejsce urodzenia definiuje Twój ascendent i kosmiczne zakorzenienie
      </Text>
    </View>

    <StyledInput
      value={birthPlace}
      onChangeText={setBirthPlace}
      placeholder="Miasto, kraj — np. Kraków, Polska"
      autoFocus
      autoCapitalize="words"
      icon={<MapPin size={17} color={ACCENT_DIM} />}
    />

    <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.placeInfoCard}>
      <LinearGradient
        colors={['rgba(206,174,114,0.10)', 'rgba(206,174,114,0.03)']}
        style={styles.placeInfoGrad}
      >
        <Text style={styles.placeInfoTitle}>Dlaczego to ważne?</Text>
        <Text style={styles.placeInfoText}>
          Położenie geograficzne w chwili narodzin wyznacza punkt wschodu zodiaku, czyli Twój
          ascendent — maskę, którą pokazujesz światu. To także centrum Twojego kosmicznego
          zakorzenienia, z którego wyrastają domy astrologiczne wykresu urodzeniowego.
        </Text>
      </LinearGradient>
    </Animated.View>
  </Animated.View>
);

// ─── Step 4: Experience ───────────────────────────────────────────────────────

const Step4 = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) => (
  <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.stepContainer}>
    <View style={styles.stepHeader}>
      <Text style={styles.stepEyebrow}>✦ KROK 4 / 4</Text>
      <Text style={styles.stepTitle}>Jak głęboko sięgasz?</Text>
      <Text style={styles.stepSubtitle}>
        Poziom doświadczenia pozwala nam dopasować język i głębię Wyroczni
      </Text>
    </View>

    <View style={styles.expOptions}>
      {EXPERIENCE_OPTIONS.map((opt, i) => {
        const isActive = selected === opt.id;
        return (
          <Animated.View key={opt.id} entering={FadeInDown.delay(i * 100).springify()}>
            <Pressable
              onPress={() => onSelect(opt.id)}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              <LinearGradient
                colors={isActive
                  ? ['rgba(206,174,114,0.22)', 'rgba(206,174,114,0.08)']
                  : [opt.gradStart, opt.gradEnd]}
                style={[
                  styles.expCard,
                  isActive && styles.expCardActive,
                ]}
              >
                <Text style={styles.expIcon}>{opt.icon}</Text>
                <View style={styles.expText}>
                  <Text style={[styles.expTitle, isActive && { color: ACCENT }]}>{opt.title}</Text>
                  <Text style={styles.expDesc}>{opt.desc}</Text>
                </View>
                {isActive && (
                  <Animated.View entering={FadeIn.duration(250)} style={styles.expCheck}>
                    <LinearGradient colors={[ACCENT, ACCENT + 'CC']} style={styles.expCheckGrad}>
                      <Text style={styles.expCheckText}>✓</Text>
                    </LinearGradient>
                  </Animated.View>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  </Animated.View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const IdentitySetupScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const setUserData = useAppStore(s => s.setUserData);
  const isOnboarded = useAppStore(s => s.isOnboarded);
  const storedUserData = useAppStore(s => s.userData);
  const currentUser = useAuthStore(s => s.currentUser);

  // Prefer appStore data, fall back to auth user data
  const prefillName = storedUserData?.name || (currentUser?.displayName ?? '').split(' ')[0] || '';
  const prefillLastName = storedUserData?.lastName || (currentUser?.displayName ?? '').split(' ').slice(1).join(' ') || '';
  const prefillBirthDate = storedUserData?.birthDate || currentUser?.birthDate || '';
  const prefillBirthPlace = storedUserData?.birthPlace || currentUser?.birthPlace || '';

  const parseBirthDatePart = (dateStr: string, part: 'day' | 'month' | 'year') => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (part === 'year') return parts[0] ?? '';
    if (part === 'month') return parts[1] ? String(parseInt(parts[1])) : '';
    if (part === 'day') return parts[2] ? String(parseInt(parts[2])) : '';
    return '';
  };

  // Step state
  const [step, setStep] = useState(0);

  // Step 1 — pre-fill from store/auth
  const [name, setName] = useState(() => prefillName);
  const [lastName, setLastName] = useState(() => prefillLastName);

  // Step 2 — pre-fill birth date
  const [day, setDay] = useState(() => parseBirthDatePart(prefillBirthDate, 'day'));
  const [month, setMonth] = useState(() => parseBirthDatePart(prefillBirthDate, 'month'));
  const [year, setYear] = useState(() => parseBirthDatePart(prefillBirthDate, 'year'));
  const [birthTime, setBirthTime] = useState(() => storedUserData?.birthTime ?? '');

  // Step 3
  const [birthPlace, setBirthPlace] = useState(() => prefillBirthPlace);

  // Step 4
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced' | ''>(() => storedUserData?.experienceLevel ?? '');

  // ── Validation ──
  const canContinue = useMemo(() => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return day !== '' && month !== '' && year !== '';
    if (step === 2) return birthPlace.trim().length >= 2;
    if (step === 3) return experienceLevel !== '';
    return false;
  }, [step, name, day, month, year, birthPlace, experienceLevel]);

  // ── Navigation ──
  const goNext = useCallback(() => {
    if (!canContinue) return;
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }
    // Final step — save & navigate
    const birthDate = year && month && day
      ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      : '';

    // Auto-compute spiritual profile from birth data
    const zodiacInfo = calcZodiacSign(birthDate);
    const lifePathInfo = calcLifePath(birthDate);
    const ascInfo = birthTime ? calcAscendant(birthDate, birthTime.trim()) : null;

    setUserData({
      name: name.trim(),
      lastName: lastName.trim(),
      birthDate,
      birthTime: birthTime.trim(),
      birthPlace: birthPlace.trim(),
      experienceLevel: experienceLevel as 'beginner' | 'intermediate' | 'advanced',
      // Computed spiritual profile
      zodiacSign: zodiacInfo?.sign ?? '',
      zodiacEmoji: zodiacInfo?.emoji ?? '⭐',
      zodiacElement: zodiacInfo?.element ?? '',
      lifePathNumber: lifePathInfo?.number ?? undefined,
      ascendant: ascInfo?.sign ?? '',
      ascendantEmoji: ascInfo?.emoji ?? '',
      profileRevealSeen: isOnboarded ? true : false, // existing users skip reveal
    });

    if (isOnboarded) {
      navigation.goBack();
    } else {
      navigation.navigate('SpiritualProfileReveal');
    }
  }, [canContinue, step, name, lastName, day, month, year, birthTime, birthPlace, experienceLevel, setUserData, navigation, isOnboarded]);

  const goBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
    else navigation.goBack();
  }, [step, navigation]);

  return (
    <LinearGradient colors={BG_GRAD} style={styles.container}>
      <StarField />

      {/* Radial glow top */}
      <View style={styles.glowTop} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header bar */}
        <View style={[styles.headerBar, { paddingTop: 8 }]}>
          <BackBtn onPress={goBack} />
          <ProgressDots step={step} />
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 24}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            {step === 0 && (
              <Step1
                name={name}
                setName={setName}
                lastName={lastName}
                setLastName={setLastName}
              />
            )}
            {step === 1 && (
              <Step2
                day={day} setDay={setDay}
                month={month} setMonth={setMonth}
                year={year} setYear={setYear}
                birthTime={birthTime} setBirthTime={setBirthTime}
              />
            )}
            {step === 2 && (
              <Step3
                birthPlace={birthPlace}
                setBirthPlace={setBirthPlace}
              />
            )}
            {step === 3 && (
              <Step4
                selected={experienceLevel}
                onSelect={(id) => setExperienceLevel(id as any)}
              />
            )}
          </ScrollView>

          {/* CTA */}
          <View style={[styles.ctaContainer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <CtaButton
              label={step < TOTAL_STEPS - 1 ? 'Dalej →' : 'Wejdź w swoją ścieżkę ✦'}
              onPress={goNext}
              disabled={!canContinue}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: SW * 0.5 - 180,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(206,174,114,0.07)',
  },

  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(206,174,114,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(206,174,114,0.18)',
  },

  // Progress dots
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    borderRadius: 6,
    height: 8,
  },
  dotIdle: {
    width: 8,
    backgroundColor: 'rgba(245,241,234,0.18)',
  },
  dotActive: {
    width: 24,
    backgroundColor: ACCENT,
  },
  dotDone: {
    width: 8,
    backgroundColor: 'rgba(206,174,114,0.55)',
  },

  // Scroll content
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },

  // Step container
  stepContainer: {
    flex: 1,
  },
  stepHeader: {
    marginBottom: 32,
  },
  stepEyebrow: {
    fontSize: 10,
    letterSpacing: 3,
    color: ACCENT,
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: 0.2,
    lineHeight: 36,
    marginBottom: 10,
  },
  stepSubtitle: {
    fontSize: 14,
    color: TEXT_SUB,
    lineHeight: 21,
  },

  // Inputs
  inputsGroup: {},
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputWrapFocused: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(206,174,114,0.06)',
  },
  inputIcon: {
    marginRight: 10,
    opacity: 0.8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: TEXT_PRIMARY,
    paddingVertical: 14,
    letterSpacing: 0.2,
  },

  // Energy badge
  energyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(206,174,114,0.10)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(206,174,114,0.22)',
  },
  energyNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: ACCENT,
    width: 36,
    textAlign: 'center',
  },
  energyLabel: {
    fontSize: 13,
    color: 'rgba(245,241,234,0.75)',
    letterSpacing: 0.3,
    flex: 1,
  },

  // Soul hint
  soulHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  soulHintText: {
    fontSize: 12,
    color: 'rgba(206,174,114,0.65)',
    flex: 1,
    lineHeight: 17,
  },

  // Date row
  dateRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  // Picker
  pickerGroup: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: TEXT_SUB,
    marginBottom: 6,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 13,
    minHeight: 48,
  },
  pickerBtnOpen: {
    borderColor: ACCENT,
  },
  pickerValue: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    flex: 1,
  },
  pickerPlaceholder: {
    fontSize: 13,
    color: 'rgba(245,241,234,0.30)',
    flex: 1,
  },
  pickerDropdown: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: '#0E0B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  pickerOptionActive: {
    backgroundColor: 'rgba(206,174,114,0.08)',
  },
  pickerOptionText: {
    fontSize: 13,
    color: TEXT_PRIMARY,
  },

  // Zodiac card
  zodiacCard: {
    marginBottom: 8,
  },
  zodiacGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(206,174,114,0.22)',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  zodiacSymbol: {
    fontSize: 30,
  },
  zodiacLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: TEXT_SUB,
    marginBottom: 3,
  },
  zodiacName: {
    fontSize: 18,
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: 0.3,
  },

  // Optional time
  optionalLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: TEXT_SUB,
    marginBottom: 8,
  },
  optionalHint: {
    fontSize: 11,
    color: TEXT_SUB,
    lineHeight: 16,
    marginTop: 8,
    paddingHorizontal: 4,
  },

  // Place info card
  placeInfoCard: {
    marginTop: 20,
  },
  placeInfoGrad: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(206,174,114,0.14)',
    padding: 18,
  },
  placeInfoTitle: {
    fontSize: 12,
    letterSpacing: 1.5,
    color: ACCENT,
    marginBottom: 8,
  },
  placeInfoText: {
    fontSize: 13,
    color: TEXT_SUB,
    lineHeight: 20,
  },

  // Experience options
  expOptions: {
    gap: 12,
  },
  expCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  expCardActive: {
    borderColor: ACCENT,
  },
  expIcon: {
    fontSize: 30,
    width: 40,
    textAlign: 'center',
  },
  expText: {
    flex: 1,
  },
  expTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  expDesc: {
    fontSize: 12,
    color: TEXT_SUB,
    lineHeight: 17,
  },
  expCheck: {
    marginLeft: 8,
  },
  expCheckGrad: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expCheckText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#05030E',
  },

  // CTA
  ctaContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: 'rgba(5,3,14,0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(206,174,114,0.10)',
  },
  ctaOuter: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    gap: 8,
    borderRadius: 18,
  },
  ctaLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#05030E',
    letterSpacing: 0.5,
  },
});
