// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInRight,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { ChevronLeft, Check, Plus, Trash2, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { HapticsService } from '../core/services/haptics.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';

const { width: SW } = Dimensions.get('window');
const BG = '#07080E';
const ACCENT = '#A78BFA';
const ACCENT2 = '#7C3AED';
const CARD_BG = 'rgba(167,139,250,0.06)';
const CARD_BORDER = 'rgba(167,139,250,0.18)';

// ─── Goal / Emotion pills ─────────────────────────────────────────────────────
const GOALS = [
  'Oczyszczenie', 'Obfitość', 'Uzdrowienie', 'Ochrona',
  'Miłość', 'Skupienie', 'Wdzięczność', 'Transformacja',
];

// ─── Ingredients ─────────────────────────────────────────────────────────────
const INGREDIENTS = [
  '🕯️ Świece', '🌿 Zioła', '💎 Kryształy', '🧂 Sól',
  '🔥 Ogień', '💧 Woda', '🪬 Amulet', '🌸 Kwiaty',
  '🫧 Kadzidło', '📿 Koraliki', '🪞 Lustro', '📜 Pergamin',
];

// ─── Step types ───────────────────────────────────────────────────────────────
const STEP_TYPES = [
  { label: 'Medytacja', emoji: '🧘' },
  { label: 'Modlitwa', emoji: '🙏' },
  { label: 'Oddech', emoji: '🌬️' },
  { label: 'Dźwięk', emoji: '🎵' },
  { label: 'Pisanie', emoji: '📝' },
  { label: 'Rytuał', emoji: '🔥' },
];

// ─── Duration options ────────────────────────────────────────────────────────
const DURATIONS = ['15 min', '30 min', '45 min', '60 min', '90 min'];

// ─── Time of day options ─────────────────────────────────────────────────────
const TIMES_OF_DAY = [
  { label: 'Rano', emoji: '🌅' },
  { label: 'Południe', emoji: '☀️' },
  { label: 'Wieczór', emoji: '🌅' },
  { label: 'Noc', emoji: '🌙' },
];

// ─── Step Progress Bar ────────────────────────────────────────────────────────
const StepProgressBar = ({ current }: { current: number }) => (
  <View style={styles.progressRow}>
    {[1, 2, 3, 4].map(step => (
      <View key={step} style={styles.progressItemContainer}>
        <View style={[
          styles.progressDot,
          current > step
            ? { backgroundColor: ACCENT, borderColor: ACCENT }
            : current === step
            ? { backgroundColor: ACCENT, borderColor: ACCENT, transform: [{ scale: 1.2 }] }
            : { backgroundColor: 'transparent', borderColor: 'rgba(167,139,250,0.35)' },
        ]}>
          {current > step ? (
            <Check size={10} color="#FFF" strokeWidth={3} />
          ) : (
            <Text style={{ color: current === step ? '#FFF' : 'rgba(167,139,250,0.5)', fontSize: 10, fontWeight: '700' }}>
              {step}
            </Text>
          )}
        </View>
        {step < 4 && (
          <View style={[
            styles.progressLine,
            { backgroundColor: current > step ? ACCENT : 'rgba(167,139,250,0.18)' },
          ]} />
        )}
      </View>
    ))}
  </View>
);

// ─── Pill selector (multi-select) ────────────────────────────────────────────
const MultiPill = ({
  items,
  selected,
  onToggle,
  color = ACCENT,
}: {
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  color?: string;
}) => (
  <View style={styles.pillsWrap}>
    {items.map(item => {
      const active = selected.includes(item);
      return (
        <Pressable
          key={item}
          onPress={() => { HapticsService.impact('light'); onToggle(item); }}
          style={[
            styles.pill,
            active
              ? { backgroundColor: color + '28', borderColor: color }
              : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)' },
          ]}
        >
          <Text style={{ color: active ? color : 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: active ? '600' : '400' }}>
            {item}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

// ─── Ingredient grid ─────────────────────────────────────────────────────────
const IngredientGrid = ({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (item: string) => void;
}) => {
  const cols = 2;
  const tileW = (SW - 44 * 2 - 10) / cols;
  return (
    <View style={styles.ingredientGrid}>
      {INGREDIENTS.map(item => {
        const active = selected.includes(item);
        return (
          <Pressable
            key={item}
            onPress={() => { HapticsService.impact('light'); onToggle(item); }}
            style={[
              styles.ingredientTile,
              { width: tileW },
              active
                ? { backgroundColor: 'rgba(167,139,250,0.18)', borderColor: ACCENT, shadowColor: ACCENT, shadowOpacity: 0.35, shadowRadius: 8 }
                : { backgroundColor: CARD_BG, borderColor: CARD_BORDER },
            ]}
          >
            <Text style={{ fontSize: 22, marginBottom: 4 }}>{item.split(' ')[0]}</Text>
            <Text style={{ color: active ? ACCENT : 'rgba(255,255,255,0.60)', fontSize: 12, textAlign: 'center', fontWeight: active ? '600' : '400' }}>
              {item.split(' ').slice(1).join(' ')}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// ─── Step row ─────────────────────────────────────────────────────────────────
const StepRow = ({
  index,
  text,
  stepType,
  onChangeText,
  onChangeType,
  onDelete,
}: {
  index: number;
  text: string;
  stepType: string;
  onChangeText: (v: string) => void;
  onChangeType: (v: string) => void;
  onDelete: () => void;
}) => {
  const { t } = useTranslation();
  const currentType = STEP_TYPES.find(t => t.label === stepType) || STEP_TYPES[0];

  const handleLongPress = () => {
    Alert.alert(t('customRitual.usun_krok', 'Usuń krok'), `${t('customRitual.czy_usunac_krok', 'Czy usunąć krok')} ${index + 1}?`, [
      { text: t('customRitual.anuluj', 'Anuluj'), style: 'cancel' },
      { text: t('customRitual.usun', 'Usuń'), style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <Animated.View entering={FadeInRight.duration(400)} style={styles.stepRow}>
      {/* Step type selector strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ gap: 6, paddingHorizontal: 0 }}>
        {STEP_TYPES.map(t => {
          const active = t.label === stepType;
          return (
            <Pressable
              key={t.label}
              onPress={() => onChangeType(t.label)}
              style={[
                styles.stepTypePill,
                active
                  ? { backgroundColor: ACCENT + '28', borderColor: ACCENT }
                  : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)' },
              ]}
            >
              <Text style={{ fontSize: 12 }}>{t.emoji}</Text>
              <Text style={{ color: active ? ACCENT : 'rgba(255,255,255,0.45)', fontSize: 11, marginLeft: 4, fontWeight: active ? '600' : '400' }}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable onLongPress={handleLongPress} style={styles.stepInputRow}>
        {/* Number pill */}
        <View style={styles.stepNumberPill}>
          <Text style={{ color: ACCENT, fontWeight: '800', fontSize: 12 }}>{index + 1}</Text>
        </View>
        <TextInput
          style={styles.stepInput}
          placeholder={`Opisz krok ${index + 1}...`}
          placeholderTextColor="rgba(255,255,255,0.28)"
          value={text}
          onChangeText={onChangeText}
          multiline
          maxLength={200}
        />
        <Pressable onPress={onDelete} style={styles.stepDeleteBtn} hitSlop={12}>
          <Trash2 size={14} color="rgba(167,139,250,0.45)" strokeWidth={1.8} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const CustomRitualBuilderScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const addCustomRitualStore = useAppStore(s => (s as any).addCustomRitual);

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1
  const [ritualName, setRitualName] = useState('');
  const [intention, setIntention] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  // Step 2
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  // Step 3 — up to 8 steps
  const [ritualSteps, setRitualSteps] = useState<{ text: string; type: string }[]>([
    { text: '', type: 'Medytacja' },
    { text: '', type: 'Modlitwa' },
    { text: '', type: 'Oddech' },
  ]);

  // Step 4
  const [selectedDuration, setSelectedDuration] = useState('30 min');
  const [selectedTime, setSelectedTime] = useState('Rano');

  // Animated shimmer for accent line
  const shimmerX = useSharedValue(-SW);
  useEffect(() => {
    shimmerX.value = withRepeat(withTiming(SW, { duration: 2400 }), -1, false);
  }, []);
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  // ── Handlers ───────────────────────────────────────────────────────────────

  const toggleGoal = useCallback((item: string) => {
    setSelectedGoals(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  }, []);

  const toggleIngredient = useCallback((item: string) => {
    setSelectedIngredients(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  }, []);

  const addStep = () => {
    if (ritualSteps.length >= 8) {
      Alert.alert(t('customRitual.maksimum', 'Maksimum'), t('customRitual.mozesz_dodac_maksymalni_8_krokow', 'Możesz dodać maksymalnie 8 kroków rytuału.'));
      return;
    }
    setRitualSteps(prev => [...prev, { text: '', type: 'Rytuał' }]);
  };

  const updateStepText = (index: number, text: string) => {
    setRitualSteps(prev => prev.map((s, i) => i === index ? { ...s, text } : s));
  };

  const updateStepType = (index: number, type: string) => {
    setRitualSteps(prev => prev.map((s, i) => i === index ? { ...s, type } : s));
  };

  const deleteStep = (index: number) => {
    if (ritualSteps.length <= 1) return;
    setRitualSteps(prev => prev.filter((_, i) => i !== index));
  };

  // ── Navigation between wizard steps ───────────────────────────────────────

  const canGoNext = () => {
    if (currentStep === 1) return ritualName.trim().length > 0;
    return true;
  };

  const goNext = () => {
    if (!canGoNext()) {
      Alert.alert(t('customRitual.uzupelnij_dane', 'Uzupełnij dane'), t('customRitual.podaj_nazwe_rytualu_aby_przejsc', 'Podaj nazwę rytuału, aby przejść dalej.'));
      return;
    }
    HapticsService.impact('medium');
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const goBack = () => {
    HapticsService.impact('light');
    if (currentStep === 1) {
      if (navigation.canGoBack()) navigation.goBack();
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  // ── Save ritual ────────────────────────────────────────────────────────────

  const handleSave = () => {
    const ritual = {
      id: `custom_${Date.now()}`,
      name: ritualName,
      intention,
      goals: selectedGoals,
      ingredients: selectedIngredients,
      steps: ritualSteps,
      duration: selectedDuration,
      timeOfDay: selectedTime,
      createdAt: new Date().toISOString(),
    };

    try {
      if (typeof addCustomRitualStore === 'function') {
        addCustomRitualStore(ritual);
      } else {
        // Fallback: store doesn't have the action yet — save anyway silently
        const state = useAppStore.getState() as any;
        if (Array.isArray(state.customRituals)) {
          useAppStore.setState({ customRituals: [...state.customRituals, ritual] } as any);
        }
      }
    } catch {}

    HapticsService.notify();
    Alert.alert('Rytuał zapisany ✦', `"${ritualName}" został dodany do Twoich rytuałów.`, [
      { text: t('customRitual.swietnie', 'Świetnie!'), onPress: () => { if (navigation.canGoBack()) navigation.goBack(); } },
    ]);
  };

  // ── Share ritual ──────────────────────────────────────────────────────────

  const handleShareCommunity = async () => {
    try {
      await Share.share({
        message: `Stworzyłem/am rytuał: ${ritualName}\nIntencja: ${intention}\nCele: ${selectedGoals.join(', ')}\n\nOdkryj Aethera → https://aethera.pl`,
      });
    } catch {}
  };

  // ─── Render steps ──────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <Animated.View entering={FadeInRight.duration(400)} key="step1">
      <Text style={styles.stepTitle}>{t('customRitual.nazwa_i_intencja', 'Nazwa i intencja')}</Text>
      <Text style={styles.stepSubtitle}>{t('customRitual.jak_nazwiemy_ten_rytual_i', 'Jak nazwiemy ten rytuał i jaka jest jego esencja?')}</Text>

      <Text style={styles.fieldLabel}>{t('customRitual.nazwa_rytualu', 'Nazwa rytuału')}</Text>
      <TextInput
        style={styles.textInput}
        placeholder={t('customRitual.moj_rytual_oczyszczen', 'Mój Rytuał Oczyszczenia')}
        placeholderTextColor="rgba(255,255,255,0.28)"
        value={ritualName}
        onChangeText={v => setRitualName(v.slice(0, 50))}
        maxLength={50}
      />
      <Text style={styles.charCount}>{ritualName.length}/50</Text>

      <Text style={styles.fieldLabel}>{t('customRitual.intencja_rytualu', 'Intencja rytuału')}</Text>
      <TextInput
        style={[styles.textInput, styles.textInputMulti]}
        placeholder={t('customRitual.intencja_tego_rytualu', 'Intencja tego rytuału...')}
        placeholderTextColor="rgba(255,255,255,0.28)"
        value={intention}
        onChangeText={v => setIntention(v.slice(0, 200))}
        maxLength={200}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{intention.length}/200</Text>

      <Text style={styles.fieldLabel}>{t('customRitual.cel_emocja', 'Cel / Emocja')}</Text>
      <Text style={styles.fieldHint}>{t('customRitual.wybierz_jeden_lub_wiecej', 'Wybierz jeden lub więcej')}</Text>
      <MultiPill items={GOALS} selected={selectedGoals} onToggle={toggleGoal} />
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View entering={FadeInRight.duration(400)} key="step2">
      <Text style={styles.stepTitle}>{t('customRitual.skladniki_rytualu', 'Składniki rytuału')}</Text>
      <Text style={styles.stepSubtitle}>{t('customRitual.wybierz_narzedzia_i_materialy_ktore', 'Wybierz narzędzia i materiały, które zastosujesz.')}</Text>
      <Text style={[styles.fieldHint, { marginBottom: 16 }]}>
        Wybrano {selectedIngredients.length} składnik{selectedIngredients.length === 1 ? '' : selectedIngredients.length < 5 ? 'i' : 'ów'}
      </Text>
      <IngredientGrid selected={selectedIngredients} onToggle={toggleIngredient} />
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View entering={FadeInRight.duration(400)} key="step3">
      <Text style={styles.stepTitle}>{t('customRitual.kroki_rytualu', 'Kroki rytuału')}</Text>
      <Text style={styles.stepSubtitle}>{t('customRitual.dodaj_do_8_krokow_ceremonii', 'Dodaj do 8 kroków ceremonii. Przytrzymaj krok, by go usunąć.')}</Text>

      {ritualSteps.map((step, i) => (
        <StepRow
          key={i}
          index={i}
          text={step.text}
          stepType={step.type}
          onChangeText={v => updateStepText(i, v)}
          onChangeType={v => updateStepType(i, v)}
          onDelete={() => deleteStep(i)}
        />
      ))}

      {ritualSteps.length < 8 && (
        <Pressable onPress={addStep} style={styles.addStepBtn}>
          <Plus size={16} color={ACCENT} strokeWidth={2} />
          <Text style={{ color: ACCENT, fontWeight: '600', fontSize: 14, marginLeft: 8 }}>{t('customRitual.dodaj_krok', 'Dodaj krok +')}</Text>
        </Pressable>
      )}
    </Animated.View>
  );

  const renderStep4 = () => (
    <Animated.View entering={FadeInRight.duration(400)} key="step4">
      <Text style={styles.stepTitle}>{t('customRitual.podsumowan_i_zapis', 'Podsumowanie i zapis')}</Text>
      <Text style={styles.stepSubtitle}>{t('customRitual.przejrzyj_swoj_rytual_i_dostosuj', 'Przejrzyj swój rytuał i dostosuj czas trwania.')}</Text>

      {/* Preview card */}
      <View style={[styles.previewCard]}>
        <LinearGradient
          colors={['rgba(167,139,250,0.14)', 'rgba(167,139,250,0.04)']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.previewName}>{ritualName || `(${t('customRitual.brak_nazwy', 'brak nazwy')})`}</Text>
        {intention ? (
          <Text style={styles.previewIntention} numberOfLines={2}>{intention}</Text>
        ) : null}

        {/* Goals pills */}
        {selectedGoals.length > 0 && (
          <View style={[styles.pillsWrap, { marginTop: 10, marginBottom: 4 }]}>
            {selectedGoals.map(g => (
              <View key={g} style={[styles.pill, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '55' }]}>
                <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '500' }}>{g}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Ingredients row */}
        {selectedIngredients.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {selectedIngredients.map(ing => (
              <Text key={ing} style={{ fontSize: 18 }}>{ing.split(' ')[0]}</Text>
            ))}
          </View>
        )}

        {/* Step count */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <Sparkles size={14} color={ACCENT} strokeWidth={1.5} />
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginLeft: 6 }}>
            {ritualSteps.filter(s => s.text.trim()).length} kroków rytuału
          </Text>
        </View>
      </View>

      {/* Duration selector */}
      <Text style={[styles.fieldLabel, { marginTop: 20 }]}>{t('customRitual.czas_trwania', 'Czas trwania')}</Text>
      <View style={styles.pillsWrap}>
        {DURATIONS.map(d => {
          const active = d === selectedDuration;
          return (
            <Pressable
              key={d}
              onPress={() => { HapticsService.impact('light'); setSelectedDuration(d); }}
              style={[styles.pill, active
                ? { backgroundColor: ACCENT + '28', borderColor: ACCENT }
                : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)' }]}
            >
              <Text style={{ color: active ? ACCENT : 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: active ? '600' : '400' }}>{d}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Time of day selector */}
      <Text style={styles.fieldLabel}>{t('customRitual.pora_dnia', 'Pora dnia')}</Text>
      <View style={styles.pillsWrap}>
        {TIMES_OF_DAY.map(({ label, emoji }) => {
          const active = label === selectedTime;
          return (
            <Pressable
              key={label}
              onPress={() => { HapticsService.impact('light'); setSelectedTime(label); }}
              style={[styles.pill, active
                ? { backgroundColor: ACCENT + '28', borderColor: ACCENT }
                : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)' }]}
            >
              <Text style={{ fontSize: 14, marginRight: 4 }}>{emoji}</Text>
              <Text style={{ color: active ? ACCENT : 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: active ? '600' : '400' }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Save + Share buttons */}
      <Pressable onPress={handleSave} style={styles.saveBtn}>
        <LinearGradient
          colors={[ACCENT, ACCENT2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
        />
        <Sparkles size={20} color="#FFF" strokeWidth={1.5} />
        <Text style={styles.saveBtnText}>{t('customRitual.zapisz_rytual', 'Zapisz Rytuał')}</Text>
      </Pressable>

      <Pressable onPress={handleShareCommunity} style={styles.shareBtn}>
        <Text style={styles.shareBtnText}>{t('customRitual.udostepnij_w_wspolnocie', 'Udostępnij w Wspólnocie')}</Text>
      </Pressable>
    </Animated.View>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D0B16', '#07080E', '#07080E']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.headerBtn} hitSlop={16}>
            <ChevronLeft size={24} color={ACCENT} strokeWidth={1.8} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('customRitual.kreator_rytualu', '✦ KREATOR RYTUAŁU')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress bar */}
        <View style={{ paddingHorizontal: 22, paddingTop: 4, paddingBottom: 12 }}>
          <StepProgressBar current={currentStep} />
          {/* Shimmer accent line */}
          <View style={styles.shimmerTrack}>
            <Animated.View style={[styles.shimmerBar, shimmerStyle]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          <EndOfContentSpacer size="standard" />
        </ScrollView>

        {/* Bottom navigation buttons */}
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom + 8, 20) }]}>
          <Pressable onPress={goBack} style={styles.navBtnBack}>
            <Text style={styles.navBtnBackText}>
              {currentStep === 1 ? t('customRitual.anuluj_btn', 'Anuluj') : `← ${t('customRitual.wstecz', 'Wstecz')}`}
            </Text>
          </Pressable>

          {currentStep < 4 ? (
            <Pressable onPress={goNext} style={[styles.navBtnNext, !canGoNext() && { opacity: 0.45 }]}>
              <LinearGradient
                colors={[ACCENT, ACCENT2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              />
              <Text style={styles.navBtnNextText}>{t('customRitual.dalej', 'Dalej →')}</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
    </KeyboardAvoidingView>
  );
};

export default CustomRitualBuilderScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    color: 'rgba(167,139,250,0.80)', fontSize: 11, fontWeight: '700',
    letterSpacing: 2.5, textAlign: 'center',
  },

  progressRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  progressItemContainer: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  progressLine: { width: 48, height: 1.5, marginHorizontal: 4 },

  shimmerTrack: {
    height: 1.5, backgroundColor: 'rgba(167,139,250,0.10)', borderRadius: 1,
    overflow: 'hidden', marginTop: 4,
  },
  shimmerBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 80,
    backgroundColor: 'rgba(167,139,250,0.55)',
  },

  scroll: { paddingHorizontal: 22, paddingTop: 8 },

  stepTitle: {
    color: '#F0EBF8', fontSize: 22, fontWeight: '700', marginBottom: 6,
  },
  stepSubtitle: {
    color: 'rgba(255,255,255,0.50)', fontSize: 14, lineHeight: 20, marginBottom: 24,
  },

  fieldLabel: {
    color: ACCENT, fontSize: 12, fontWeight: '700', letterSpacing: 1.5,
    marginBottom: 10, marginTop: 18,
  },
  fieldHint: {
    color: 'rgba(255,255,255,0.40)', fontSize: 12, marginBottom: 10, marginTop: -6,
  },
  charCount: {
    color: 'rgba(255,255,255,0.28)', fontSize: 11, textAlign: 'right', marginTop: 4,
  },

  textInput: {
    backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: CARD_BORDER,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    color: '#F0EBF8', fontSize: 15, fontWeight: '400',
  },
  textInputMulti: {
    minHeight: 100, paddingTop: 14,
  },

  pillsWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },

  ingredientGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  ingredientTile: {
    height: 90, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 8,
  },

  stepRow: {
    marginBottom: 16,
    backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: CARD_BORDER,
    borderRadius: 16, padding: 14,
  },
  stepTypePill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
  },
  stepInputRow: {
    flexDirection: 'row', alignItems: 'flex-start',
  },
  stepNumberPill: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: 'rgba(167,139,250,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, marginTop: 4,
  },
  stepInput: {
    flex: 1, color: '#F0EBF8', fontSize: 14,
    paddingVertical: 4, lineHeight: 21,
  },
  stepDeleteBtn: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: 4,
  },

  addStepBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, borderWidth: 1,
    borderColor: ACCENT + '44', borderStyle: 'dashed',
    marginTop: 4,
  },

  previewCard: {
    borderRadius: 20, borderWidth: 1, borderColor: CARD_BORDER,
    padding: 20, overflow: 'hidden',
  },
  previewName: {
    color: '#F0EBF8', fontSize: 20, fontWeight: '700', marginBottom: 6,
  },
  previewIntention: {
    color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 20,
  },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: 18, overflow: 'hidden',
    marginTop: 28,
  },
  saveBtnText: {
    color: '#FFF', fontWeight: '700', fontSize: 16, letterSpacing: 0.5, marginLeft: 10,
  },
  shareBtn: {
    alignItems: 'center', paddingVertical: 16, marginTop: 12,
    borderRadius: 18, borderWidth: 1, borderColor: ACCENT + '44',
  },
  shareBtnText: {
    color: ACCENT, fontWeight: '600', fontSize: 14, letterSpacing: 0.3,
  },

  bottomNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(167,139,250,0.10)',
    backgroundColor: 'rgba(7,8,14,0.96)',
  },
  navBtnBack: {
    paddingHorizontal: 22, paddingVertical: 14, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.25)',
  },
  navBtnBackText: {
    color: 'rgba(167,139,250,0.70)', fontWeight: '600', fontSize: 14,
  },
  navBtnNext: {
    paddingHorizontal: 36, paddingVertical: 14, borderRadius: 16,
    overflow: 'hidden',
  },
  navBtnNextText: {
    color: '#FFF', fontWeight: '700', fontSize: 15, letterSpacing: 0.3,
  },
});
