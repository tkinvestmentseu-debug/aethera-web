// @ts-nocheck
import React, { useState, useMemo, useCallback } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  StyleSheet, View, ScrollView, Pressable, Text, Share, Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ChevronLeft, Sparkles, Moon, Trash2, Share2, Brain,
  Eye, RotateCcw, BookOpen, Repeat2, ArrowRight,
  Wand2, MoonStar,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#818CF8';

// ── Dream symbols dataset (shared with DreamsScreen) ─────────────────────────
const KNOWN_SYMBOLS = [
  { keyword: 'Woda',       emoji: '💧', color: '#60A5FA', cat: 'natura' },
  { keyword: 'Ogień',      emoji: '🔥', color: '#FB923C', cat: 'natura' },
  { keyword: 'Las',        emoji: '🌳', color: '#86EFAC', cat: 'natura' },
  { keyword: 'Góra',       emoji: '⛰️', color: '#94A3B8', cat: 'natura' },
  { keyword: 'Ocean',      emoji: '🌊', color: '#38BDF8', cat: 'natura' },
  { keyword: 'Piorun',     emoji: '⚡', color: '#EAB308', cat: 'natura' },
  { keyword: 'Dziecko',    emoji: '👶', color: '#F48DB0', cat: 'ludzie' },
  { keyword: 'Nieznajomy', emoji: '🧙', color: '#A3E635', cat: 'ludzie' },
  { keyword: 'Matka',      emoji: '👩', color: '#FDA4AF', cat: 'ludzie' },
  { keyword: 'Ojciec',     emoji: '👨', color: '#93C5FD', cat: 'ludzie' },
  { keyword: 'Klucz',      emoji: '🗝️', color: '#FCD34D', cat: 'obiekty' },
  { keyword: 'Lustro',     emoji: '🪞', color: ACCENT,   cat: 'obiekty' },
  { keyword: 'Drzwi',      emoji: '🚪', color: '#C4A882', cat: 'obiekty' },
  { keyword: 'Samochód',   emoji: '🚗', color: '#6EE7B7', cat: 'obiekty' },
  { keyword: 'Telefon',    emoji: '📱', color: '#6EE7B7', cat: 'obiekty' },
  { keyword: 'Dom',        emoji: '🏠', color: '#D9B56D', cat: 'miejsca' },
  { keyword: 'Szkoła',     emoji: '🏫', color: '#FCA5A5', cat: 'miejsca' },
  { keyword: 'Kościół',    emoji: '⛪', color: '#C084FC', cat: 'miejsca' },
  { keyword: 'Most',       emoji: '🌉', color: '#F9A8D4', cat: 'miejsca' },
  { keyword: 'Labirynt',   emoji: '🌀', color: '#C084FC', cat: 'miejsca' },
  { keyword: 'Lot',        emoji: '🕊️', color: '#67E8F9', cat: 'akcje' },
  { keyword: 'Pościg',     emoji: '🏃', color: '#FB923C', cat: 'akcje' },
  { keyword: 'Schody',     emoji: '🪜', color: '#A78BFA', cat: 'akcje' },
  { keyword: 'Śmierć',     emoji: '💀', color: '#6B7280', cat: 'akcje' },
  { keyword: 'Upadek',     emoji: '⬇️', color: '#94A3B8', cat: 'akcje' },
  { keyword: 'Księżyc',    emoji: '🌕', color: '#E2D4F0', cat: 'natura' },
  { keyword: 'Słońce',     emoji: '☀️', color: '#FBBF24', cat: 'natura' },
  { keyword: 'Drzewo',     emoji: '🌳', color: '#4ADE80', cat: 'natura' },
  { keyword: 'Wąż',        emoji: '🐍', color: '#4ADE80', cat: 'natura' },
  { keyword: 'Ptak',       emoji: '🦅', color: '#67E8F9', cat: 'natura' },
];

const extractSymbols = (text: string) =>
  KNOWN_SYMBOLS.filter(s => text.toLowerCase().includes(s.keyword.toLowerCase())).slice(0, 8);

// ── Tag metadata ─────────────────────────────────────────────────────────────
const DREAM_TAG_OPTIONS = [
  { id: 'koszmar',      label: 'Koszmar',         color: '#EF4444', emoji: '😱' },
  { id: 'prorocze',     label: 'Prorocze',         color: '#FBBF24', emoji: '🔮' },
  { id: 'powt',         label: 'Powtarzające się', color: '#F472B6', emoji: '🔄' },
  { id: 'lucid',        label: 'Świadome (lucid)', color: '#34D399', emoji: '💡' },
  { id: 'uzdrawiajace', label: 'Uzdrawiające',     color: '#86EFAC', emoji: '💚' },
  { id: 'astral',       label: 'Astral',           color: '#C084FC', emoji: '✨' },
];

const EMOTIONS = [
  { id: 'Strach',     emoji: '😨', color: '#60A5FA' },
  { id: 'Radość',     emoji: '😄', color: '#34D399' },
  { id: 'Smutek',     emoji: '😢', color: '#818CF8' },
  { id: 'Niepokój',   emoji: '😰', color: '#F97316' },
  { id: 'Spokój',     emoji: '😌', color: '#A78BFA' },
  { id: 'Ekscytacja', emoji: '🤩', color: '#FBBF24' },
  { id: 'Zagubienie', emoji: '😶', color: '#94A3B8' },
  { id: 'Zachwyt',    emoji: '🤩', color: '#F9A8D4' },
];

// ── AI interpretation section definitions ────────────────────────────────────
const AI_SECTIONS = [
  { key: 'SYMBOLE',     label: 'Symbole',           color: '#60A5FA', emoji: '🔮' },
  { key: 'TEMAT',       label: 'Temat emocjonalny', color: '#FBBF24', emoji: '💛' },
  { key: 'PRZESŁANIE',  label: 'Przesłanie',        color: ACCENT,    emoji: '✨' },
  { key: 'DZIAŁANIE',   label: 'Działanie',         color: '#34D399', emoji: '🌿' },
  { key: 'ARCHETYP',    label: 'Archetyp',          color: '#A78BFA', emoji: '🧿' },
];

// ── Background ───────────────────────────────────────────────────────────────
const DetailBg = React.memo(({ isDark }: { isDark: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isDark ? ['#010208', '#030412', '#06081A'] : ['#F0F0FB', '#E8E4F8', '#DDD8F5']}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={SW} height={240} style={{ position: 'absolute', top: 0 }} opacity={isDark ? 0.22 : 0.10}>
      <G>
        {Array.from({ length: 20 }, (_, i) => (
          <Circle
            key={i}
            cx={(i * 137 + 20) % SW}
            cy={(i * 89 + 10) % 200}
            r={i % 5 === 0 ? 2.5 : i % 3 === 0 ? 1.5 : 0.8}
            fill={i % 5 === 0 ? ACCENT : 'rgba(200,190,255,0.9)'}
            opacity={0.2 + (i % 5) * 0.1}
          />
        ))}
        <Circle cx={SW * 0.75} cy={60} r={40} stroke={ACCENT} strokeWidth={1} fill="none" opacity={0.25} />
      </G>
    </Svg>
  </View>
));

// ── Recurring badge toggle ───────────────────────────────────────────────────
const RecurringBadge = ({ active, onToggle, color }: { active: boolean; onToggle: () => void; color: string }) => (
  <Pressable
    onPress={onToggle}
    style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12,
      backgroundColor: active ? color + '22' : 'transparent',
      borderWidth: 1, borderColor: active ? color + '66' : 'rgba(128,128,128,0.20)',
    }}
  >
    <Repeat2 size={13} color={active ? color : 'rgba(128,128,128,0.55)'} strokeWidth={1.8} />
    <Text style={{ fontSize: 11, fontWeight: '600', color: active ? color : 'rgba(128,128,128,0.55)' }}>
      {active ? 'Powtarzający' : 'Oznacz jako powtarzający'}
    </Text>
  </Pressable>
);

// ── Main screen ──────────────────────────────────────────────────────────────
export const DreamDetailScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const userData = useAppStore(s => s.userData);
  const { isLight } = useTheme();
  const { updateEntry, deleteEntry } = useJournalStore();

  // Accept dream object from params, or id lookup
  const dream = route?.params?.dream;
  const isDark = !isLight;
  const textColor  = isLight ? '#1A1A1A' : '#F0EBE2';
  const subColor   = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.60)';
  const cardBg     = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.10)';

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [isRecurring, setIsRecurring] = useState(
    () => (dream?.tags || []).includes('powt')
  );
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // Derived
  const dreamText   = dream?.content || dream?.text || '';
  const dreamTitle  = dream?.title || 'Sen';
  const dreamDate   = dream?.date ? new Date(dream.date) : new Date();
  const emotMeta    = EMOTIONS.find(e => e.id === (dream?.mood));
  const clarityLevel = dream?.energyLevel ? Math.round(dream.energyLevel / 20) : 0;
  const detectedSymbols = useMemo(() => extractSymbols(dreamText), [dreamText]);
  const entryTags = useMemo(
    () => (dream?.tags || []).filter(tag => tag !== 'dream' && DREAM_TAG_OPTIONS.find(o => o.id === tag)),
    [dream]
  );

  // Format date nicely
  const MONTHS_LONG = ['Stycznia','Lutego','Marca','Kwietnia','Maja','Czerwca','Lipca','Sierpnia','Września','Października','Listopada','Grudnia'];
  const formattedDate = `${dreamDate.getDate()} ${MONTHS_LONG[dreamDate.getMonth()]} ${dreamDate.getFullYear()}`;

  // ── Parsed AI sections ─────────────────────────────────────────────────────
  const parsedSections = useMemo(() => {
    if (!aiResult) return [];
    return AI_SECTIONS.map(sd => {
      const allKeys = AI_SECTIONS.map(x => x.key + ':').join('|');
      const regex = new RegExp(`${sd.key}:\\s*([\\s\\S]*?)(?=(?:${allKeys})|$)`, 'i');
      const m = aiResult.match(regex);
      return { ...sd, text: m ? m[1].replace(/\*\*/g, '').replace(/\*/g, '').trim() : '' };
    }).filter(s => s.text.length > 0);
  }, [aiResult]);

  // ── AI analysis ────────────────────────────────────────────────────────────
  const analyzeWithAI = async () => {
    if (!dreamText.trim()) return;
    HapticsService.impact('medium');
    setAiLoading(true);
    setAiResult('');
    try {
      const name    = userData?.name    ? `Osoba: ${userData.name}.`           : '';
      const zodiac  = userData?.zodiacSign ? `Znak: ${userData.zodiacSign}.`   : '';
      const tagCtx  = entryTags.length  ? `Typ snu: ${entryTags.join(', ')}.`  : '';
      const symbols = detectedSymbols.map(s => s.keyword).join(', ');

      const prompt = `Jesteś Jungowskim interpretatorem snów.

${name} ${zodiac}
${tagCtx}
${dream?.mood ? `Dominująca emocja: ${dream.mood}.` : ''}
${clarityLevel ? `Wyrazistość: ${clarityLevel}/5.` : ''}
${symbols ? `Wykryte symbole: ${symbols}.` : ''}
${(dream?.tags || []).includes('lucid') ? 'To był sen świadomy (lucid dreaming).' : ''}
${(dream?.tags || []).includes('powt')  ? 'Ten sen się powtarza — to ważny sygnał.' : ''}

Sen: "${dreamText}"

Napisz pogłębioną Jungowską analizę. Użyj DOKŁADNIE tych nagłówków:

SYMBOLE: Zidentyfikuj 2-3 kluczowe symbole i ich Jungowskie znaczenie w kontekście tego snu. (3-4 zdania)

TEMAT: Jaki jest główny temat emocjonalny i psychologiczny tego snu? (2-3 zdania)

PRZESŁANIE: Co nieświadomość próbuje przekazać? Pisz bezpośrednio i odważnie. (2-3 zdania)

DZIAŁANIE: Zaproponuj jedno konkretne ćwiczenie lub pytanie do pracy z tym snem. (1-2 zdania)

ARCHETYP: Jaki Jungowski archetyp jest aktywny (np. Cień, Anima, Stary Mędrzec, Dziecko, Trickster)? (2 zdania)

Pisz w języku użytkownika. Ton: ciepły, głęboki, psychologicznie precyzyjny.`;

      const resp = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setAiResult(resp);
    } catch {
      setAiResult('Oracle milczy tej nocy. Zaufaj intuicji — ona już zna odpowiedź.');
    }
    setAiLoading(false);
  };

  // ── Recurring toggle ───────────────────────────────────────────────────────
  const toggleRecurring = useCallback(() => {
    if (!dream?.id) return;
    HapticsService.impact('medium');
    const newVal = !isRecurring;
    setIsRecurring(newVal);
    const currentTags = dream?.tags || [];
    const newTags = newVal
      ? [...currentTags.filter(tag => tag !== 'powt'), 'powt']
      : currentTags.filter(tag => tag !== 'powt');
    updateEntry(dream.id, { tags: newTags });
  }, [isRecurring, dream, updateEntry]);

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      await Share.share({
        message: `✦ ${dreamTitle}\n${formattedDate}\n\n${dreamText}${aiResult ? '\n\n— Interpretacja Aethera —\n' + aiResult.slice(0, 500) + '...' : ''}`,
        title: dreamTitle,
      });
    } catch {}
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      'Usuń sen',
      'Usunąć ten wpis ze snów? Tej operacji nie można cofnąć.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive',
          onPress: () => {
            if (dream?.id) deleteEntry(dream.id);
            navigation?.goBack();
          },
        },
      ]
    );
  };

  // ── Symbol lookup ──────────────────────────────────────────────────────────
  const selectedSymbolData = KNOWN_SYMBOLS.find(s => s.keyword === selectedSymbol);

  if (!dream) {
    return (
      <View style={{ flex: 1, backgroundColor: isLight ? '#F0F0FB' : '#010208', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: ACCENT, fontSize: 16 }}>{t('dreamDetail.sen_nie_zostal_znaleziony', 'Sen nie został znaleziony.')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: isLight ? '#F0F0FB' : '#010208' }}>
      <DetailBg isDark={!isLight} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <Pressable onPress={() => navigation?.goBack()} hitSlop={14} style={s.backBtn}>
            <ChevronLeft size={26} color={ACCENT} strokeWidth={1.6} />
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={[s.headerEyebrow, { color: ACCENT }]}>{t('dreamDetail.kraina_snow', 'KRAINA SNÓW')}</Text>
            <Text style={[s.headerTitle, { color: textColor }]} numberOfLines={1}>{dreamTitle}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable onPress={handleShare} hitSlop={12} style={s.iconBtn}>
              <Share2 size={17} color={ACCENT + 'CC'} strokeWidth={1.6} />
            </Pressable>
            <Pressable onPress={handleDelete} hitSlop={12} style={s.iconBtn}>
              <Trash2 size={17} color='#E8705A' strokeWidth={1.6} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── DATE & META ─────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(380)}>
            <View style={[s.metaCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
              <LinearGradient colors={[ACCENT + '14', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: ACCENT + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22 }}>
                    {(dream.tags || []).includes('lucid')   ? '💡'
                    : (dream.tags || []).includes('koszmar') ? '😱'
                    : (dream.tags || []).includes('astral')  ? '✨' : '🌙'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: textColor, fontWeight: '600' }}>{formattedDate}</Text>
                  {emotMeta && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                      <Text style={{ fontSize: 14 }}>{emotMeta.emoji}</Text>
                      <Text style={{ fontSize: 12, color: emotMeta.color, fontWeight: '600' }}>{emotMeta.id}</Text>
                    </View>
                  )}
                </View>
                {clarityLevel > 0 && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: ACCENT }}>{'★'.repeat(clarityLevel)}{'☆'.repeat(5 - clarityLevel)}</Text>
                    <Text style={{ fontSize: 9, color: subColor, marginTop: 2 }}>{t('dreamDetail.wyrazistos', 'Wyrazistość')}</Text>
                  </View>
                )}
              </View>
              {/* Tags */}
              {entryTags.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                  {entryTags.map(tag => {
                    const meta = DREAM_TAG_OPTIONS.find(o => o.id === tag);
                    return meta ? (
                      <View key={tag} style={{
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                        backgroundColor: meta.color + '22', borderWidth: 1, borderColor: meta.color + '44',
                      }}>
                        <Text style={{ fontSize: 10 }}>{meta.emoji}</Text>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: meta.color }}>{meta.label}</Text>
                      </View>
                    ) : null;
                  })}
                </View>
              )}
            </View>
          </Animated.View>

          {/* ── DREAM TEXT ─────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(40).duration(380)}>
            <View style={[s.dreamTextCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Moon size={15} color={ACCENT} strokeWidth={1.6} />
                <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.8, color: ACCENT }}>{t('dreamDetail.tresc_snu', 'TREŚĆ SNU')}</Text>
              </View>
              <Text style={{ fontSize: 15, color: textColor, lineHeight: 26, letterSpacing: 0.2 }}>
                {dreamText || 'Brak opisu snu.'}
              </Text>
            </View>
          </Animated.View>

          {/* ── DETECTED SYMBOLS ──────────────────────────────────────── */}
          {detectedSymbols.length > 0 && (
            <Animated.View entering={FadeInDown.delay(60).duration(380)}>
              <Text style={[s.sectionLabel, { color: ACCENT }]}>{t('dreamDetail.wykryte_symbole', 'WYKRYTE SYMBOLE')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {detectedSymbols.map(sym => {
                  const active = selectedSymbol === sym.keyword;
                  return (
                    <Pressable
                      key={sym.keyword}
                      onPress={() => {
                        HapticsService.impact('medium');
                        setSelectedSymbol(active ? null : sym.keyword);
                      }}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
                        backgroundColor: active ? sym.color + '28' : cardBg,
                        borderWidth: 1, borderColor: active ? sym.color + '66' : sym.color + '33',
                      }}
                    >
                      <Text style={{ fontSize: 14 }}>{sym.emoji}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: sym.color }}>{sym.keyword}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Symbol detail popover */}
              {selectedSymbolData && (
                <Animated.View entering={FadeInDown.duration(280)} style={{ marginTop: 8 }}>
                  <View style={{
                    borderRadius: 16, borderWidth: 1, padding: 14, overflow: 'hidden',
                    backgroundColor: selectedSymbolData.color + '10',
                    borderColor: selectedSymbolData.color + '44',
                  }}>
                    <LinearGradient
                      colors={[selectedSymbolData.color + '18', 'transparent']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <Text style={{ fontSize: 24 }}>{selectedSymbolData.emoji}</Text>
                      <View>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: selectedSymbolData.color }}>
                          {selectedSymbolData.keyword}
                        </Text>
                        <Text style={{ fontSize: 10, color: subColor, marginTop: 2 }}>{selectedSymbolData.cat}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12.5, color: textColor, lineHeight: 20 }}>
                      {t('dreamDetail.dotknij_symbolariu_w_dreamscree_aby', 'Dotknij "Symbolarium" w DreamScreen, aby zobaczyć pełną Jungowską interpretację tego symbolu, element Cienia i pytanie refleksyjne.')}
                    </Text>
                    <Pressable
                      onPress={() => navigation?.navigate('Dreams', { activeTab: 'symbolarium', symbol: selectedSymbolData.keyword })}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}
                    >
                      <BookOpen size={13} color={selectedSymbolData.color} />
                      <Text style={{ fontSize: 12, fontWeight: '600', color: selectedSymbolData.color }}>
                        {t('dreamDetail.zobacz_w_symbolariu', 'Zobacz w Symbolarium →')}
                      </Text>
                    </Pressable>
                  </View>
                </Animated.View>
              )}
            </Animated.View>
          )}

          {/* ── AI INTERPRETATION ─────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).duration(380)}>
            <Text style={[s.sectionLabel, { color: ACCENT }]}>{t('dreamDetail.interpreta_ai', 'INTERPRETACJA AI')}</Text>
            {!aiResult && !aiLoading ? (
              <Pressable
                onPress={analyzeWithAI}
                style={[s.aiCta, { backgroundColor: cardBg, borderColor: ACCENT + '55' }]}
              >
                <LinearGradient colors={[ACCENT + '1A', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={22} color={ACCENT} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: ACCENT }}>{t('dreamDetail.interpretu_ten_sen', 'Interpretuj ten sen')}</Text>
                  <Text style={{ fontSize: 12, color: subColor, marginTop: 2, lineHeight: 17 }}>
                    {t('dreamDetail.jungowska_analiza_symbole_temat_prz', 'Jungowska analiza: symbole, temat, przesłanie, działanie, archetyp')}
                  </Text>
                </View>
                <Sparkles size={15} color={ACCENT} />
              </Pressable>
            ) : aiLoading ? (
              <View style={[s.aiCta, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
                <Text style={{ fontSize: 20, marginRight: 10 }}>🌙</Text>
                <Text style={{ fontSize: 13, color: subColor, fontStyle: 'italic' }}>{t('dreamDetail.oracle_czyta_twoj_sen', 'Oracle czyta Twój sen...')}</Text>
              </View>
            ) : (
              <View style={[s.aiResultCard, { backgroundColor: cardBg, borderColor: ACCENT + '44' }]}>
                <LinearGradient colors={[ACCENT + '18', 'transparent']} style={StyleSheet.absoluteFill as any} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Wand2 size={16} color={ACCENT} strokeWidth={1.6} />
                  <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.8, color: ACCENT }}>{t('dreamDetail.jungowska_interpreta', 'JUNGOWSKA INTERPRETACJA')}</Text>
                  <View style={{ flex: 1 }} />
                  <Pressable onPress={analyzeWithAI} hitSlop={10}>
                    <Text style={{ fontSize: 10, color: ACCENT + 'AA', fontWeight: '600' }}>{t('dreamDetail.odswiez', 'Odśwież')}</Text>
                  </Pressable>
                </View>
                {parsedSections.length > 0 ? (
                  <View style={{ gap: 10 }}>
                    {parsedSections.map((sec, i) => (
                      <Animated.View key={sec.key} entering={FadeInDown.delay(i * 80).duration(350)}>
                        <View style={{
                          borderRadius: 14, borderWidth: 1, borderLeftWidth: 3,
                          borderColor: sec.color + '33', borderLeftColor: sec.color,
                          padding: 12, gap: 5,
                          backgroundColor: sec.color + '08',
                        }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 13 }}>{sec.emoji}</Text>
                            <Text style={{ color: sec.color, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }}>
                              {sec.label.toUpperCase()}
                            </Text>
                          </View>
                          <Text style={{ color: textColor, fontSize: 13.5, lineHeight: 21 }}>{sec.text}</Text>
                        </View>
                      </Animated.View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: textColor, fontSize: 14, lineHeight: 22 }}>{aiResult}</Text>
                )}
              </View>
            )}
          </Animated.View>

          {/* ── RECURRING TOGGLE ──────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(100).duration(380)}>
            <Text style={[s.sectionLabel, { color: ACCENT }]}>{t('dreamDetail.powracajac_motyw', 'POWRACAJĄCY MOTYW')}</Text>
            <View style={[s.recurCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#F472B6' + '22', alignItems: 'center', justifyContent: 'center' }}>
                  <RotateCcw size={18} color='#F472B6' strokeWidth={1.6} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: textColor, marginBottom: 4 }}>
                    {t('dreamDetail.czy_ten_sen_sie_powtarza', 'Czy ten sen się powtarza?')}
                  </Text>
                  <Text style={{ fontSize: 12, color: subColor, lineHeight: 18 }}>
                    {t('dreamDetail.powtarzaja_sie_sny_to_glos', 'Powtarzające się sny to głos podświadomości, który szczególnie domaga się uwagi. Jung widział w nich niespełnione zadania psychiczne.')}
                  </Text>
                </View>
              </View>
              <RecurringBadge
                active={isRecurring}
                onToggle={toggleRecurring}
                color='#F472B6'
              />
            </View>
          </Animated.View>

          {/* ── QUICK ACTIONS ─────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(120).duration(380)}>
            <Text style={[s.sectionLabel, { color: ACCENT }]}>{t('dreamDetail.eksploruj_dalej', 'EKSPLORUJ DALEJ')}</Text>
            <View style={[s.actionsCard, { backgroundColor: cardBg, borderColor: ACCENT + '33' }]}>
              <LinearGradient colors={[ACCENT + '10', 'transparent']} style={StyleSheet.absoluteFill} />
              {[
                {
                  label: 'Praca z Cieniem',
                  sub: 'Zbadaj, co ten sen ujawnia o Cieniu.',
                  icon: Eye, color: '#C084FC', route: 'ShadowWork',
                },
                {
                  label: 'Symbolarium',
                  sub: 'Przeglądaj 42+ symbole ze Jungowską interpretacją.',
                  icon: BookOpen, color: '#60A5FA', route: 'Dreams',
                  params: { activeTab: 'symbolarium' },
                },
                {
                  label: 'Kalendarz Księżycowy',
                  sub: 'Sprawdź, w jakiej fazie księżyca był ten sen.',
                  icon: MoonStar, color: ACCENT, route: 'LunarCalendar',
                },
              ].map((item, idx, arr) => {
                const Icon = item.icon;
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => navigation?.navigate(item.route, item.params)}
                    style={[
                      s.actionRow,
                      idx < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ACCENT + '18' },
                    ]}
                  >
                    <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: item.color + '1A', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={17} color={item.color} strokeWidth={1.6} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{item.label}</Text>
                      <Text style={{ fontSize: 11, color: subColor, marginTop: 2, lineHeight: 16 }}>{item.sub}</Text>
                    </View>
                    <ArrowRight size={14} color={ACCENT + '88'} />
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>

        {/* ── BOTTOM ACTION BAR ─────────────────────────────────────────── */}
        <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) + 4 }]}>
          <Pressable
            onPress={handleShare}
            style={[s.bottomBtn, { borderColor: ACCENT + '44', backgroundColor: cardBg }]}
          >
            <Share2 size={15} color={ACCENT} strokeWidth={1.6} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>{t('dreamDetail.udostepnij', 'Udostępnij')}</Text>
          </Pressable>
          {!aiResult && !aiLoading && (
            <Pressable
              onPress={analyzeWithAI}
              style={[s.bottomBtn, { flex: 2, backgroundColor: ACCENT, borderColor: ACCENT }]}
            >
              <Brain size={15} color='#FFF' strokeWidth={1.8} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>{t('dreamDetail.interpretu_sen', 'Interpretuj sen')}</Text>
            </Pressable>
          )}
          <Pressable
            onPress={handleDelete}
            style={[s.bottomBtn, { borderColor: '#E8705A44', backgroundColor: '#E8705A0C' }]}
          >
            <Trash2 size={15} color='#E8705A' strokeWidth={1.6} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#E8705A' }}>{t('dreamDetail.usun', 'Usuń')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  backBtn:      { width: 38 },
  iconBtn:      { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  headerEyebrow:{ fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  headerTitle:  { fontSize: 17, fontWeight: '700', marginTop: 2, letterSpacing: -0.2 },
  scroll:       { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 4, marginBottom: 8 },
  metaCard:     { borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden' },
  dreamTextCard:{ borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
  aiCta:        { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden' },
  aiResultCard: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden' },
  recurCard:    { borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden' },
  actionsCard:  { borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden' },
  actionRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  bottomBar:    { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.12)' },
  bottomBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 14, borderWidth: 1 },
});
