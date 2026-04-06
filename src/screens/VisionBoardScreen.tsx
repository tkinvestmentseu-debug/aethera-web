// @ts-nocheck
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, Text, TextInput,
  Modal, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle as SvgCircle, G } from 'react-native-svg';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withSpring, withRepeat, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import {
  ChevronLeft, Star, Sparkles, Heart, Briefcase, Users, Palette,
  Compass, Moon, DollarSign, ArrowRight, ChevronDown, ChevronUp,
  BookOpen,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { resolveUserFacingText } from '../core/utils/contentResolver';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const GOLD = '#F59E0B';
const CELL_W = (SW - layout.padding.screen * 2 - 16) / 3;

// ── Life areas ────────────────────────────────────────────────────────────────
const AREAS = [
  { id: 'zdrowie',      label: 'Zdrowie',       icon: Heart,      color: '#10B981' },
  { id: 'milosc',       label: 'Miłość',         icon: Heart,      color: '#F472B6' },
  { id: 'obfitosc',     label: 'Obfitość',       icon: DollarSign, color: '#F59E0B' },
  { id: 'kariera',      label: 'Kariera',        icon: Briefcase,  color: '#6366F1' },
  { id: 'duchowosc',    label: 'Duchowość',      icon: Sparkles,   color: '#818CF8' },
  { id: 'rodzina',      label: 'Rodzina',        icon: Users,      color: '#38BDF8' },
  { id: 'kreatywnosc',  label: 'Kreatywność',    icon: Palette,    color: '#F97316' },
  { id: 'przygoda',     label: 'Przygoda',       icon: Compass,    color: '#84CC16' },
  { id: 'spokoj',       label: 'Spokój',         icon: Moon,       color: '#94A3B8' },
];

const DEADLINE_OPTIONS = ['30 dni', '3 miesiące', 'rok'];

const QUOTES = [
  'Myśl jest twórczą siłą. Co myślisz, tym się stajesz.',
  'Wszechświat zapisuje twoje intencje gwiazdami.',
  'Jestem magnesem dla dobroci i obfitości.',
  'Każda intencja to nasiono zasiane w kosmicznej glebie.',
  'Moje pragnienia są pragnieniami duszy.',
  'Tworzę rzeczywistość każdą myślą i słowem.',
];

const RITUAL_STEPS = [
  { id: 'read',    label: 'Przeczytaj na głos',   desc: 'Wymów każdą intencję wyraźnie, jakby już się spełniła.' },
  { id: 'visual',  label: 'Zwizualizuj',           desc: 'Zamknij oczy i poczuj realne spełnienie każdego obszaru.' },
  { id: 'feel',    label: 'Poczuj',                desc: 'Pozwól emocjom przyszłości wypełnić twoje ciało teraz.' },
  { id: 'release', label: 'Puść',                  desc: 'Oddaj intencje Wszechświatowi bez przywierania do formy.' },
  { id: 'gratitude', label: 'Wdzięczność',         desc: 'Podziękuj, jakby wszystko już się stało.' },
];

// ── Background ────────────────────────────────────────────────────────────────
const VisionBoardBg = ({ isLight }: { isLight: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight ? ['#FBF8FF', '#F5F0FF', '#EDE8F8'] : ['#0F0A1E', '#1A0F2E', '#0A0F1E']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={SW} style={StyleSheet.absoluteFill} opacity={0.08}>
      <G>
        <SvgCircle cx={SW / 2} cy={200} r={160} stroke={GOLD} strokeWidth={0.8} fill="none" strokeDasharray="4 10" />
        <SvgCircle cx={SW / 2} cy={200} r={110} stroke={GOLD} strokeWidth={0.5} fill="none" strokeDasharray="2 6" />
        <SvgCircle cx={SW / 2} cy={200} r={60}  stroke={GOLD} strokeWidth={1.2} fill="none" />
        {Array.from({ length: 16 }, (_, i) => (
          <SvgCircle
            key={i}
            cx={((i * 137 + 20) % SW)}
            cy={((i * 89 + 40) % SW)}
            r={i % 5 === 0 ? 1.4 : 0.7}
            fill="rgba(255,255,255,0.6)"
            opacity={0.2}
          />
        ))}
      </G>
    </Svg>
  </View>
);

// ── Circular progress ring ────────────────────────────────────────────────────
const ProgressRing = ({ filled, total, isLight }: { filled: number; total: number; isLight: boolean }) => {
  const R = 44;
  const CIRCUM = 2 * Math.PI * R;
  const dash = (filled / total) * CIRCUM;
  const textColor = isLight ? '#1A1410' : '#F0EAF8';
  return (
    <View style={{ alignItems: 'center', marginVertical: 16 }}>
      <View style={{ width: 110, height: 110, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={110} height={110} viewBox="0 0 110 110">
          <SvgCircle cx={55} cy={55} r={R} stroke={isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)'} strokeWidth={8} fill="none" />
          <SvgCircle
            cx={55} cy={55} r={R}
            stroke={GOLD}
            strokeWidth={8}
            fill="none"
            strokeDasharray={`${dash} ${CIRCUM}`}
            strokeLinecap="round"
            transform="rotate(-90 55 55)"
          />
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ color: GOLD, fontSize: 24, fontWeight: '700' }}>{filled}</Text>
          <Text style={{ color: textColor, fontSize: 11, opacity: 0.6 }}>z {total}</Text>
        </View>
      </View>
      <Text style={{ color: isLight ? '#4A3F6B' : 'rgba(245,240,255,0.7)', fontSize: 13, marginTop: 4 }}>
        intencji ustawionych
      </Text>
    </View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
export function VisionBoardScreen({ navigation }: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const visionBoardIntentions = useAppStore(s => s.visionBoardIntentions);
  const setVisionBoardIntention = useAppStore(s => s.setVisionBoardIntention);
  const clearVisionBoardIntention = useAppStore(s => s.clearVisionBoardIntention);
  const { currentTheme, isLight } = useTheme();
  // modal state
  const [modalArea, setModalArea] = useState<typeof AREAS[0] | null>(null);
  const [intentionText, setIntentionText] = useState('');
  const [affirmationText, setAffirmationText] = useState('');
  const [selectedDeadline, setSelectedDeadline] = useState('30 dni');
  const [modalAiLoading, setModalAiLoading] = useState(false);

  // ritual
  const [ritualOpen, setRitualOpen] = useState(false);
  const [ritualDone, setRitualDone] = useState<Record<string, boolean>>({});

  // AI activation
  const [activationLoading, setActivationLoading] = useState(false);
  const [activationResult, setActivationResult] = useState<{ theme: string; strongestArea: string; mantra: string } | null>(null);

  // new moon banner (day 1-3 approximation)
  const today = new Date();
  const isNewMoonPeriod = today.getDate() >= 1 && today.getDate() <= 3;

  const textColor = isLight ? '#1A1410' : '#F0EAF8';
  const subColor = isLight ? 'rgba(30,20,50,0.55)' : 'rgba(240,234,248,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)';

  const filledCount = Object.keys(visionBoardIntentions).length;

  // ── open modal ──────────────────────────────────────────────────────────────
  const openModal = useCallback((area: typeof AREAS[0]) => {
    const existing = visionBoardIntentions[area.id];
    setIntentionText(existing?.intention || '');
    setAffirmationText(existing?.affirmation || '');
    setSelectedDeadline(existing?.deadline || '30 dni');
    setModalArea(area);
    HapticsService.impact('light');
  }, [visionBoardIntentions]);

  const closeModal = useCallback(() => {
    setModalArea(null);
    setIntentionText('');
    setAffirmationText('');
    setModalAiLoading(false);
  }, []);

  const saveIntention = useCallback(() => {
    if (!modalArea) return;
    if (intentionText.trim().length < 2) {
      Alert.alert('Brak intencji', 'Wpisz swoją intencję przed zapisaniem.');
      return;
    }
    setVisionBoardIntention(modalArea.id, {
      intention: intentionText.trim(),
      affirmation: affirmationText.trim(),
      deadline: selectedDeadline,
      setAt: Date.now(),
    });
    HapticsService.notify();
    closeModal();
  }, [modalArea, intentionText, affirmationText, selectedDeadline]);

  const askOracleForAffirmation = useCallback(async () => {
    if (intentionText.trim().length < 2) {
      Alert.alert('Najpierw wpisz intencję', 'Wpisz intencję, aby Oracle mógł wesprzeć.');
      return;
    }
    setModalAiLoading(true);
    try {
      const messages = [
        {
          role: 'user' as const,
          content: t(
            'visionBoard.oracleAffirmationPrompt',
            'Obszar życia: {{area}}. Moja intencja: {{intention}}. Stwórz jedną krótką, pozytywną afirmację (max 15 słów) w stylu duchowym zaczynającą się od "Już jestem" lub "Już mam".',
            { area: modalArea?.label || '', intention: intentionText },
          ),
        },
      ];
      const res = await AiService.chatWithOracle(messages, i18n.language?.slice(0, 2) || 'pl');
      setAffirmationText(res?.trim() || '');
    } catch {
      Alert.alert('Błąd Oracle', 'Spróbuj ponownie za chwilę.');
    } finally {
      setModalAiLoading(false);
    }
  }, [intentionText, modalArea]);

  // ── AI board activation ─────────────────────────────────────────────────────
  const activateBoard = useCallback(async () => {
    if (filledCount === 0) {
      Alert.alert('Pusta tablica', 'Dodaj przynajmniej jedną intencję, aby aktywować tablicę.');
      return;
    }
    setActivationLoading(true);
    try {
      const intentionList = AREAS
        .filter(a => visionBoardIntentions[a.id])
        .map(a => `${a.label}: ${visionBoardIntentions[a.id].intention}`)
        .join('\n');
      const messages = [
        {
          role: 'user' as const,
          content: t(
            'visionBoard.activationPrompt',
            'Moja tablica manifestacji zawiera te intencje:\n{{intentionList}}\n\nOdpowiedz w formacie JSON:\n{"theme":"ogólny motyw manifestacji (1 zdanie)","strongestArea":"nazwa obszaru z najsilniejszą energią teraz","mantra":"afirmacja aktywacyjna na dziś (max 20 słów, poetycka)"}',
            { intentionList },
          ),
        },
      ];
      const res = await AiService.chatWithOracle(messages, i18n.language?.slice(0, 2) || 'pl');
      // parse JSON from response
      const jsonMatch = res?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setActivationResult(parsed);
      } else {
        setActivationResult({
          theme: resolveUserFacingText('Twoja energia manifestacji jest aktywna.'),
          strongestArea: AREAS.find(a => visionBoardIntentions[a.id])?.label || '',
          mantra: res?.slice(0, 120) || '',
        });
      }
      HapticsService.notify();
    } catch {
      Alert.alert('Błąd aktywacji', 'Spróbuj ponownie za chwilę.');
    } finally {
      setActivationLoading(false);
    }
  }, [visionBoardIntentions, filledCount]);

  // ── star button ─────────────────────────────────────────────────────────────
  const isFav = isFavoriteItem('visionboard');
  const handleStar = useCallback(() => {
    HapticsService.notify();
    if (isFavoriteItem('visionboard')) {
      removeFavoriteItem('visionboard');
    } else {
      addFavoriteItem({
        id: 'visionboard',
        label: resolveUserFacingText('Tablica Manifestacji'),
        sublabel: resolveUserFacingText('Kosmiczna mapa intencji'),
        route: 'VisionBoard',
        icon: 'Sparkles',
        color: GOLD,
        addedAt: Date.now(),
      });
    }
  }, [addFavoriteItem, removeFavoriteItem, isFavoriteItem]);

  // ── render ──────────────────────────────────────────────────────────────────
  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView edges={['top']} style={{ flex: 1 }}>

      <VisionBoardBg isLight={isLight} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: 4, paddingHorizontal: layout.padding.screen }]}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={styles.backBtn} hitSlop={12}>
          <ChevronLeft color={isLight ? '#4A3F6B' : 'rgba(245,240,255,0.75)'} size={22} strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: textColor }]}>TABLICA MANIFESTACJI</Text>
          <Text style={[styles.headerSub, { color: subColor }]}>Twoja kosmiczna mapa intencji</Text>
        </View>
        <Pressable onPress={handleStar} style={styles.backBtn} hitSlop={12}>
          <Star color={GOLD} size={20} fill={isFav ? GOLD : 'none'} strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress ring */}
        <Animated.View entering={FadeInDown.delay(60).duration(500)}>
          <ProgressRing filled={filledCount} total={9} isLight={isLight} />
        </Animated.View>

        {/* New moon banner */}
        {isNewMoonPeriod && (
          <Animated.View entering={FadeInDown.delay(120).duration(500)}>
            <LinearGradient
              colors={['rgba(129,140,248,0.25)', 'rgba(99,102,241,0.15)']}
              style={[styles.newMoonBanner, { borderColor: isLight ? '#818CF8' : 'rgba(129,140,248,0.40)' }]}
            >
              <Text style={styles.newMoonText}>🌑 Nów Księżyca — idealna pora na nowe intencje!</Text>
              <Pressable
                onPress={() => navigation.navigate('LunarCalendar')}
                style={[styles.newMoonBtn, { backgroundColor: '#818CF8' + '33', borderColor: '#818CF8' + '88' }]}
              >
                <Text style={{ color: '#818CF8', fontSize: 13, fontWeight: '600' }}>Ustaw Teraz</Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        )}

        {/* 3×3 grid */}
        <Animated.View entering={FadeInDown.delay(180).duration(500)}>
          <Text style={[styles.sectionLabel, { color: subColor }]}>OBSZARY ŻYCIA</Text>
          <View style={styles.grid}>
            {AREAS.map((area, idx) => {
              const ic = visionBoardIntentions[area.id];
              const Icon = area.icon;
              const hasBorder = !!ic;
              const borderCol = hasBorder ? area.color : area.color + '66';
              const bgCol = hasBorder
                ? isLight ? area.color + '18' : area.color + '20'
                : isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.04)';
              return (
                <Pressable
                  key={area.id}
                  onPress={() => openModal(area)}
                  style={({ pressed }) => [
                    styles.cell,
                    {
                      width: CELL_W,
                      borderColor: borderCol,
                      backgroundColor: bgCol,
                      opacity: pressed ? 0.80 : 1,
                    },
                  ]}
                >
                  <Icon color={area.color} size={20} strokeWidth={1.6} />
                  <Text style={[styles.cellLabel, { color: isLight ? '#1A1410' : '#F0EAF8' }]}>{area.label}</Text>
                  {ic ? (
                    <>
                      <Text style={[styles.cellPreview, { color: area.color }]} numberOfLines={2}>
                        {ic.intention.slice(0, 30)}{ic.intention.length > 30 ? '…' : ''}
                      </Text>
                      <View style={[styles.cellCheck, { backgroundColor: area.color }]}>
                        <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>✓</Text>
                      </View>
                    </>
                  ) : (
                    <Text style={[styles.cellPlaceholder, { color: subColor }]}>Dotknij, aby dodać intencję</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* AI Activation button */}
        <Animated.View entering={FadeInDown.delay(260).duration(500)}>
          <Pressable
            onPress={activateBoard}
            disabled={activationLoading}
            style={({ pressed }) => [
              styles.activateBtn,
              { opacity: pressed ? 0.80 : 1, borderColor: GOLD + '66' },
            ]}
          >
            <LinearGradient
              colors={['rgba(245,158,11,0.28)', 'rgba(217,119,6,0.18)']}
              style={styles.activateBtnInner}
            >
              <Sparkles color={GOLD} size={18} strokeWidth={1.6} />
              <Text style={[styles.activateBtnLabel, { color: GOLD }]}>
                {activationLoading ? 'Aktywowanie…' : 'Aktywuj Tablicę'}
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Activation result */}
        {activationResult && (
          <Animated.View entering={FadeInDown.duration(500)}>
            <LinearGradient
              colors={['rgba(245,158,11,0.20)', 'rgba(245,158,11,0.08)']}
              style={[styles.activationCard, { borderColor: GOLD + '55' }]}
            >
              <Text style={[styles.activationMantra, { color: GOLD }]}>{activationResult.mantra}</Text>
              <View style={[styles.activationDivider, { backgroundColor: GOLD + '44' }]} />
              <Text style={[styles.activationTheme, { color: textColor }]}>{activationResult.theme}</Text>
              {activationResult.strongestArea ? (
                <Text style={[styles.activationSub, { color: subColor }]}>
                  Najsilniejsza energia: <Text style={{ color: GOLD }}>{activationResult.strongestArea}</Text>
                </Text>
              ) : null}
            </LinearGradient>
          </Animated.View>
        )}

        {/* Manifestation ritual */}
        <Animated.View entering={FadeInDown.delay(320).duration(500)}>
          <Pressable
            onPress={() => setRitualOpen(v => !v)}
            style={[styles.ritualHeader, { borderColor: cardBorder, backgroundColor: cardBg }]}
          >
            <Text style={[styles.sectionLabel, { color: subColor, marginBottom: 0 }]}>RYTUAŁ MANIFESTACJI</Text>
            {ritualOpen
              ? <ChevronUp color={subColor} size={18} strokeWidth={2} />
              : <ChevronDown color={subColor} size={18} strokeWidth={2} />
            }
          </Pressable>
          {ritualOpen && (
            <View style={{ gap: 8, marginTop: 8 }}>
              {RITUAL_STEPS.map((step, i) => {
                const done = !!ritualDone[step.id];
                return (
                  <Pressable
                    key={step.id}
                    onPress={() => {
                      setRitualDone(prev => ({ ...prev, [step.id]: !prev[step.id] }));
                      HapticsService.impact('light');
                    }}
                    style={[
                      styles.ritualStep,
                      {
                        borderColor: done ? GOLD + '88' : cardBorder,
                        backgroundColor: done ? 'rgba(245,158,11,0.12)' : cardBg,
                      },
                    ]}
                  >
                    <View style={[styles.ritualStepNum, { backgroundColor: done ? GOLD : 'transparent', borderColor: done ? GOLD : cardBorder }]}>
                      <Text style={{ color: done ? '#000' : subColor, fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.ritualStepLabel, { color: done ? GOLD : textColor }]}>{step.label}</Text>
                      <Text style={[styles.ritualStepDesc, { color: subColor }]}>{step.desc}</Text>
                    </View>
                    {done && <Text style={{ color: GOLD, fontSize: 14 }}>✓</Text>}
                  </Pressable>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Inspiration quotes */}
        <Animated.View entering={FadeInDown.delay(380).duration(500)}>
          <Text style={[styles.sectionLabel, { color: subColor, marginTop: 24 }]}>INSPIRACJE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -layout.padding.screen }}>
            <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: layout.padding.screen, paddingBottom: 4 }}>
              {QUOTES.map((q, i) => (
                <View
                  key={i}
                  style={[
                    styles.quoteCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: i % 2 === 0 ? GOLD + '44' : 'rgba(129,140,248,0.35)',
                    },
                  ]}
                >
                  <Text style={[styles.quoteText, { color: textColor }]}>{q}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* CO DALEJ? */}
        <Animated.View entering={FadeInDown.delay(440).duration(500)}>
          <Text style={[styles.sectionLabel, { color: subColor, marginTop: 24 }]}>CO DALEJ?</Text>
          <View style={{ gap: 10 }}>
            {[
              { label: 'Generator Mantry', sub: 'Spersonalizowana mantra wedyjska', route: 'MantraGenerator', color: '#818CF8', Icon: Sparkles },
              { label: 'Wdzięczność', sub: 'Trzy sloty wdzięczności i refleksja', route: 'Gratitude', color: '#F472B6', Icon: Heart },
              { label: 'Rytuały', sub: 'Komnata praktyk i ceremonii', route: 'Rituals', color: GOLD, Icon: BookOpen },
            ].map(({ label, sub, route, color, Icon }) => (
              <Pressable
                key={route}
                onPress={() => navigation.navigate(route)}
                style={({ pressed }) => [
                  styles.nextCard,
                  { borderColor: color + '44', backgroundColor: cardBg, opacity: pressed ? 0.80 : 1 },
                ]}
              >
                <View style={[styles.nextIcon, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                  <Icon color={color} size={18} strokeWidth={1.6} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nextLabel, { color: textColor }]}>{label}</Text>
                  <Text style={[styles.nextSub, { color: subColor }]}>{sub}</Text>
                </View>
                <ArrowRight color={color} size={16} strokeWidth={1.8} />
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <EndOfContentSpacer />
      </ScrollView>

      {/* Intention Modal */}
      <Modal visible={!!modalArea} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={[
            styles.modalSheet,
            {
              backgroundColor: isLight ? '#F5F0FF' : '#1A0F2E',
              borderColor: modalArea ? modalArea.color + '55' : cardBorder,
            },
          ]}>
            {/* Modal header */}
            <View style={[styles.modalDrag, { backgroundColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)' }]} />
            {modalArea && (
              <>
                <View style={[styles.modalAreaIcon, { backgroundColor: modalArea.color + '22', borderColor: modalArea.color + '55' }]}>
                  {React.createElement(modalArea.icon, { color: modalArea.color, size: 22, strokeWidth: 1.6 })}
                </View>
                <Text style={[styles.modalTitle, { color: isLight ? '#1A1410' : '#F0EAF8' }]}>{modalArea.label}</Text>
              </>
            )}

            {/* Intention input */}
            <Text style={[styles.modalLabel, { color: subColor }]}>Twoja intencja</Text>
            <TextInput
              style={[styles.modalInput, {
                color: isLight ? '#1A1410' : '#F0EAF8',
                backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.07)',
                borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.14)',
              }]}
              placeholder="Wpisz swoją intencję..."
              placeholderTextColor={subColor}
              multiline
              maxLength={200}
              value={intentionText}
              onChangeText={setIntentionText}
              returnKeyType="done"
            />

            {/* Affirmation input */}
            <Text style={[styles.modalLabel, { color: subColor }]}>Afirmacja</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 48,
                color: isLight ? '#1A1410' : '#F0EAF8',
                backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.07)',
                borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.14)',
              }]}
              placeholder="Już mam/jestem..."
              placeholderTextColor={subColor}
              value={affirmationText}
              onChangeText={setAffirmationText}
              returnKeyType="done"
            />

            {/* Deadline pills */}
            <Text style={[styles.modalLabel, { color: subColor }]}>Horyzont czasowy</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {DEADLINE_OPTIONS.map(d => (
                <Pressable
                  key={d}
                  onPress={() => setSelectedDeadline(d)}
                  style={[
                    styles.deadlinePill,
                    {
                      backgroundColor: selectedDeadline === d ? GOLD + '33' : 'transparent',
                      borderColor: selectedDeadline === d ? GOLD + '88' : isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.20)',
                    },
                  ]}
                >
                  <Text style={{ color: selectedDeadline === d ? GOLD : subColor, fontSize: 13, fontWeight: selectedDeadline === d ? '600' : '400' }}>{d}</Text>
                </Pressable>
              ))}
            </View>

            {/* Oracle AI button */}
            <Pressable
              onPress={askOracleForAffirmation}
              disabled={modalAiLoading}
              style={[styles.oracleBtn, { borderColor: '#818CF8' + '66', backgroundColor: '#818CF8' + '18' }]}
            >
              <Sparkles color="#818CF8" size={16} strokeWidth={1.6} />
              <Text style={{ color: '#818CF8', fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                {modalAiLoading ? 'Oracle pracuje…' : 'Poproś Oracle o wsparcie'}
              </Text>
            </Pressable>

            {/* Save button */}
            <Pressable
              onPress={saveIntention}
              style={[styles.saveBtn, { backgroundColor: GOLD + '22', borderColor: GOLD + '88' }]}
            >
              <Text style={{ color: GOLD, fontSize: 15, fontWeight: '700', letterSpacing: 0.5 }}>Zapisz intencję</Text>
            </Pressable>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
        </SafeAreaView>
</View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  cell: {
    borderRadius: 16,
    padding: 14,
    minHeight: 100,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cellLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  cellPreview: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 14,
  },
  cellPlaceholder: {
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 13,
  },
  cellCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newMoonBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  newMoonText: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  newMoonBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  activateBtn: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  activateBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  activateBtnLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activationCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  activationMantra: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  activationDivider: {
    height: 1,
    width: '60%',
    marginVertical: 12,
  },
  activationTheme: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  activationSub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  ritualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  ritualStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  ritualStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ritualStepLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  ritualStepDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  quoteCard: {
    width: 200,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'center',
  },
  quoteText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  nextIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  nextSub: {
    fontSize: 11,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.60)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 20,
    paddingBottom: 32,
    gap: 0,
  },
  modalDrag: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalAreaIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  deadlinePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  oracleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    marginBottom: 10,
    marginTop: 4,
  },
  saveBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
});
