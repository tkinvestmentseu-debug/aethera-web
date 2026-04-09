// @ts-nocheck
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, Text,
  TextInput, View, Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell, BellOff, ChevronLeft, ChevronRight, Clock, Flame,
  Heart, Minus, Moon, Plus, Sparkles, Star, Trash2, Sun,
  Zap, Calendar, Eye, CheckCircle2, AlertCircle, Timer,
  BarChart2, History, Volume2, VolumeX, Wind, Droplets,
  Users, MessageCircle, X, Edit3,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts, shadows } from '../core/theme/designSystem';
import { NotificationsService } from '../core/services/notifications.service';
import { ReminderConfig } from '../features/portal/types';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
// ── Constants ───────────────────────────────────────────────────────────────────
const DAYS_PL = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon–Sun display order
const ACCENT = '#A78BFA';

// ── Moon phase calculator ───────────────────────────────────────────────────────
function getMoonPhase(date: Date): { phase: number; name: string; emoji: string } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  // Julian Day Number approximation
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const phase = ((jd - 2451550.1) / 29.530588613) % 1;
  const p = phase < 0 ? phase + 1 : phase;
  const pct = p * 100;
  if (pct < 3 || pct > 97) return { phase: p, name: 'Nów', emoji: '🌑' };
  if (pct < 22) return { phase: p, name: 'Rosnący Sierp', emoji: '🌒' };
  if (pct < 28) return { phase: p, name: 'Pierwsza Kwadra', emoji: '🌓' };
  if (pct < 47) return { phase: p, name: 'Rosnący Garb', emoji: '🌔' };
  if (pct < 53) return { phase: p, name: 'Pełnia', emoji: '🌕' };
  if (pct < 72) return { phase: p, name: 'Malejący Garb', emoji: '🌖' };
  if (pct < 78) return { phase: p, name: 'Ostatnia Kwadra', emoji: '🌗' };
  return { phase: p, name: 'Malejący Sierp', emoji: '🌘' };
}

function getNextNewMoon(from: Date): Date {
  const jd0 = 2451550.1; // Jan 6 2000 known new moon
  const synodic = 29.530588613;
  const dayMs = 86400000;
  const fromJd = (from.getTime() / dayMs) + 2440587.5;
  const cycles = Math.ceil((fromJd - jd0) / synodic);
  const nextJd = jd0 + cycles * synodic;
  return new Date((nextJd - 2440587.5) * dayMs);
}

function getNextFullMoon(from: Date): Date {
  const jd0 = 2451550.1 + 14.765; // roughly half synodic after Jan 6 2000
  const synodic = 29.530588613;
  const dayMs = 86400000;
  const fromJd = (from.getTime() / dayMs) + 2440587.5;
  const cycles = Math.ceil((fromJd - jd0) / synodic);
  const nextJd = jd0 + cycles * synodic;
  return new Date((nextJd - 2440587.5) * dayMs);
}

function getNextEquinox(from: Date): { date: Date; name: string } {
  const y = from.getFullYear();
  // Spring equinox ~Mar 20, Autumn ~Sep 22
  const candidates = [
    { date: new Date(y, 2, 20, 11, 0, 0), name: 'Równonoc Wiosenna' },
    { date: new Date(y, 8, 22, 9, 0, 0), name: 'Równonoc Jesienna' },
    { date: new Date(y + 1, 2, 20, 11, 0, 0), name: 'Równonoc Wiosenna' },
  ];
  const future = candidates.find(c => c.date > from);
  return future || candidates[candidates.length - 1];
}

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'long' });
}

// ── Preset data ─────────────────────────────────────────────────────────────────
const PRESET_REMINDERS: Omit<ReminderConfig, 'id' | 'enabled'>[] = [
  {
    title: 'Dzień dobry, Wędrowcze ✨',
    body: 'Twoja dzienna afirmacja i horoskop czekają. Zacznij dzień z wysoką wibracją.',
    hour: 8, minute: 0, days: [1,2,3,4,5,6,0], screen: 'Affirmations', category: 'morning',
  },
  {
    title: 'Czas na refleksję 🌙',
    body: 'Dzień dobiega końca. Zapisz przemyślenia w Dzienniku Duszy.',
    hour: 21, minute: 0, days: [1,2,3,4,5,6,0], screen: 'Journal', category: 'evening',
  },
  {
    title: 'Rytuał dnia 🕯',
    body: 'Masz dziś czas na ceremonię? Twój rytuał dnia czeka.',
    hour: 18, minute: 0, days: [1,2,3,4,5], screen: 'RitualCategorySelection', category: 'ritual',
  },
  {
    title: 'Wieczorna afirmacja 💫',
    body: 'Jedno zdanie, które zmienia wibrację przed snem.',
    hour: 22, minute: 30, days: [1,2,3,4,5,6,0], screen: 'Affirmations', category: 'affirmation',
  },
];

// ── Rich preset packs ────────────────────────────────────────────────────────────
const RITUAL_PACKS = [
  {
    id: 'pack_morning',
    name: 'Poranek Duchowy',
    desc: 'Budzenie intencji, oddech, afirmacja',
    emoji: '☀️',
    color: '#FBBF24',
    reminders: [
      { title: 'Poranny Oddech ☀️', body: 'Zacznij od 5 minut oddechu i ugruntowania.', hour: 7, minute: 0, days: [1,2,3,4,5,6,0], screen: 'Breathwork', category: 'morning' as const },
      { title: 'Intencja Dnia ✨', body: 'Wyznacz jedną intencję na dziś.', hour: 7, minute: 30, days: [1,2,3,4,5,6,0], screen: 'Affirmations', category: 'morning' as const },
    ],
  },
  {
    id: 'pack_evening',
    name: 'Wieczorna Refleksja',
    desc: 'Dziennik, wdzięczność, cisza',
    emoji: '🌙',
    color: '#A78BFA',
    reminders: [
      { title: 'Wdzięczność Wieczorna 🙏', body: 'Zapisz 3 rzeczy za które jesteś wdzięczny/a.', hour: 20, minute: 0, days: [1,2,3,4,5,6,0], screen: 'Gratitude', category: 'evening' as const },
      { title: 'Dziennik Duszy 📖', body: 'Co przyniosło dziś doświadczenie duszy?', hour: 21, minute: 30, days: [1,2,3,4,5,6,0], screen: 'Journal', category: 'evening' as const },
    ],
  },
  {
    id: 'pack_lunar',
    name: 'Rytm Lunarny',
    desc: 'Cotygodniowe rytuały z fazami Księżyca',
    emoji: '🌕',
    color: '#60A5FA',
    reminders: [
      { title: 'Rytuał Pełni 🌕', body: 'Dziś pełnia — czas uwalniania i kulminacji.', hour: 20, minute: 0, days: [6], screen: 'LunarCalendar', category: 'ritual' as const },
      { title: 'Nów — Nowe Początki 🌑', body: 'Czas siać intencje i otwierać nowe ścieżki.', hour: 19, minute: 0, days: [0], screen: 'LunarCalendar', category: 'ritual' as const },
    ],
  },
  {
    id: 'pack_oracle',
    name: 'Czas Oracle',
    desc: 'Codzienna mądrość wyroczni',
    emoji: '🔮',
    color: '#34D399',
    reminders: [
      { title: 'Pytanie do Oracle 🔮', body: 'Jaką mądrość niesie dziś Wyrocznia?', hour: 9, minute: 0, days: [1,2,3,4,5], screen: 'OraclePortal', category: 'affirmation' as const },
      { title: 'Karta Dnia 🃏', body: 'Wyciągnij kartę tarotową na ten dzień.', hour: 8, minute: 15, days: [1,2,3,4,5,6,0], screen: 'Tarot', category: 'affirmation' as const },
    ],
  },
];

// ── Oracle wisdom messages ───────────────────────────────────────────────────────
const ORACLE_MESSAGES = [
  'Twoja dusza wie już to, czego umysł szuka. Zatrzymaj się i posłuchaj.',
  'Każda granica, którą przekraczasz w sobie, otwiera nowe niebo.',
  'Nie musisz rozumieć drogi — wystarczy zrobić kolejny krok w świetle.',
  'Cisza między myślami jest domem twojej prawdziwej mocy.',
  'Cokolwiek dziś czujesz — jest to żywe. Jest to prawdziwe. Jest to twoje.',
  'Transformacja nigdy nie jest przypadkowa. Jesteś dokładnie tam, gdzie powinieneś być.',
  'Twoja obecność jest darem, którego inni nie wiedzą, że potrzebują.',
  'Zaufaj rytmowi duszy. Ona wie, kiedy ruszyć, kiedy zatrzymać.',
];

function getDailyOracleMessage(): string {
  const today = new Date();
  const seed = today.getFullYear() * 1000 + today.getMonth() * 31 + today.getDate();
  return ORACLE_MESSAGES[seed % ORACLE_MESSAGES.length];
}

// buildReminderHistory derives a 3-day delivery log from scheduled reminders
function buildReminderHistory(reminders: import('../features/portal/types').ReminderConfig[]) {
  const now = new Date();
  const entries: Array<{ id: string; title: string; time: string; status: string; daysAgo: number }> = [];
  for (let daysAgo = 0; daysAgo <= 3; daysAgo++) {
    const day = new Date(now);
    day.setDate(now.getDate() - daysAgo);
    const weekday = day.getDay(); // 0=Sun
    reminders.forEach((r) => {
      if (!r.days.includes(weekday)) return;
      const timeStr = `${String(r.hour).padStart(2, '0')}:${String(r.minute).padStart(2, '0')}`;
      // Mark as missed if reminder is disabled, or if today and time hasn't passed yet
      let status = 'delivered';
      if (!r.enabled) status = 'missed';
      else if (daysAgo === 0) {
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const reminderMins = r.hour * 60 + r.minute;
        if (reminderMins > nowMins) status = 'missed';
      }
      entries.push({ id: `${r.id}-${daysAgo}`, title: r.title, time: timeStr, status, daysAgo });
    });
  }
  return entries.sort((a, b) => a.daysAgo - b.daysAgo || a.time.localeCompare(b.time));
}

// ── Category meta ────────────────────────────────────────────────────────────────
const CATEGORY_META: Record<ReminderConfig['category'], { label: string; color: string; emoji: string; icon: any }> = {
  morning: { label: 'Poranne', color: '#FBBF24', emoji: '☀️', icon: Sun },
  evening: { label: 'Wieczorne', color: '#A78BFA', emoji: '🌙', icon: Moon },
  ritual: { label: 'Rytuał', color: '#FB923C', emoji: '🕯', icon: Flame },
  affirmation: { label: 'Afirmacja', color: '#60A5FA', emoji: '💫', icon: Heart },
  custom: { label: 'Niestandardowe', color: '#34D399', emoji: '⚙️', icon: Sparkles },
};

const CUSTOM_ICONS = ['⚡','🌸','🦋','🔮','💎','🌿','🌊','🦅','🌅','🎯','🕊','🌙','☀️','⭐','🌺'];

// ── Helpers ──────────────────────────────────────────────────────────────────────
function formatTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── Sub-components ───────────────────────────────────────────────────────────────
const CustomToggle = ({ value, onChange, accentColor }: { value: boolean; onChange: (v: boolean) => void; accentColor: string }) => (
  <Pressable
    onPress={() => { void HapticsService.selection(); onChange(!value); }}
    style={[ns.toggle, { backgroundColor: value ? accentColor : 'rgba(128,128,128,0.18)' }]}
  >
    <View style={[ns.toggleThumb, { transform: [{ translateX: value ? 18 : 2 }] }]} />
  </Pressable>
);

const TimeAdjuster = ({
  value, onChange, min, max, step = 1, label, textColor, isLight,
}: { value: number; onChange: (n: number) => void; min: number; max: number; step?: number; label?: string; textColor?: string; isLight?: boolean }) => (
  <View style={ns.adjuster}>
    {label && <Text style={[ns.adjLabel, { color: textColor || 'rgba(255,255,255,0.5)' }]}>{label}</Text>}
    <View style={ns.adjRow}>
      <Pressable onPress={() => { void HapticsService.selection(); onChange(Math.max(min, value - step)); }} style={ns.adjBtn}>
        <Minus size={14} color={isLight ? 'rgba(37,29,22,0.72)' : '#fff'} />
      </Pressable>
      <Text style={[ns.adjValue, isLight && { color: 'rgba(37,29,22,0.88)' }]}>{String(value).padStart(2, '0')}</Text>
      <Pressable onPress={() => { void HapticsService.selection(); onChange(Math.min(max, value + step)); }} style={ns.adjBtn}>
        <Plus size={14} color={isLight ? 'rgba(37,29,22,0.72)' : '#fff'} />
      </Pressable>
    </View>
  </View>
);

// ── Main screen ─────────────────────────────────────────────────────────────────
export const NotificationsScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
    const scheduledReminders = useAppStore(s => s.scheduledReminders);
  const addReminder = useAppStore(s => s.addReminder);
  const removeReminder = useAppStore(s => s.removeReminder);
  const updateReminder = useAppStore(s => s.updateReminder);
  const { isLight } = useTheme();
  const insets = useSafeAreaInsets();
  const textColor = isLight ? '#1A1208' : '#F5F1EA';
  const subColor = isLight ? 'rgba(26,18,8,0.55)' : 'rgba(245,241,234,0.52)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.10)';

  // ── State ──────────────────────────────────────────────────────────────────────
  const [permGranted, setPermGranted] = useState<boolean | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Daily Oracle message toggle
  const [oracleEnabled, setOracleEnabled] = useState(true);
  const oracleMessage = useMemo(() => getDailyOracleMessage(), []);

  // Quiet Hours
  const [quietEnabled, setQuietEnabled] = useState(false);
  const [quietFrom, setQuietFrom] = useState({ hour: 22, minute: 0 });
  const [quietTo, setQuietTo] = useState({ hour: 8, minute: 0 });
  const [quietExpanded, setQuietExpanded] = useState(false);

  // Custom reminder modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [customHour, setCustomHour] = useState(10);
  const [customMinute, setCustomMinute] = useState(0);
  const [customDays, setCustomDays] = useState<number[]>([1,2,3,4,5,6,0]);
  const [customIcon, setCustomIcon] = useState('⭐');

  // History expand
  const [showHistory, setShowHistory] = useState(false);

  // Sections collapse
  const [presetsExpanded, setPresetsExpanded] = useState(true);
  const [packsExpanded, setPacksExpanded] = useState(false);
  const [cosmicExpanded, setCosmicExpanded] = useState(true);

  // ── Cosmic events ──────────────────────────────────────────────────────────────
  const now = useMemo(() => new Date(), []);
  const moonPhase = useMemo(() => getMoonPhase(now), [now]);
  const nextNewMoon = useMemo(() => getNextNewMoon(now), [now]);
  const nextFullMoon = useMemo(() => getNextFullMoon(now), [now]);
  const nextEquinox = useMemo(() => getNextEquinox(now), [now]);

  // ── Stats ──────────────────────────────────────────────────────────────────────
  const activeCount = scheduledReminders.filter(r => r.enabled).length;
  const totalCount = scheduledReminders.length;
  const reminderHistory = useMemo(() => buildReminderHistory(scheduledReminders), [scheduledReminders]);
  const deliveredCount = reminderHistory.filter(h => h.status === 'delivered').length;
  const longestStreak = activeCount > 0 ? Math.min(activeCount * 2, 7) : 0;

  // ── Effects ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    NotificationsService.requestPermission().then(setPermGranted);
  }, []);

  useEffect(() => {
    if (permGranted) {
      void NotificationsService.loadPrefs().then((p) => NotificationsService.reschedule(p));
    }
  }, [scheduledReminders, permGranted]);

  // ── Handlers ───────────────────────────────────────────────────────────────────
  const requestPerm = async () => {
    const granted = await NotificationsService.requestPermission();
    setPermGranted(granted);
  };

  const addPreset = (preset: Omit<ReminderConfig, 'id' | 'enabled'>) => {
    void HapticsService.impact('light');
    const existing = scheduledReminders.find(r => r.title === preset.title);
    if (existing) return;
    addReminder({ ...preset, id: `reminder_${Date.now()}`, enabled: true });
  };

  const addPack = (pack: typeof RITUAL_PACKS[0]) => {
    void HapticsService.impact('medium');
    pack.reminders.forEach((r, i) => {
      const exists = scheduledReminders.find(x => x.title === r.title);
      if (!exists) {
        setTimeout(() => addReminder({ ...r, id: `reminder_${Date.now() + i}`, enabled: true }), i * 10);
      }
    });
    Alert.alert('Pakiet dodany', `Dodano ${pack.name} — ${pack.reminders.length} przypomnienia aktywne.`);
  };

  const toggleReminder = (id: string, enabled: boolean) => {
    void HapticsService.selection();
    updateReminder(id, { enabled });
  };

  const deleteReminder = (id: string) => {
    void HapticsService.impact('medium');
    Alert.alert(t('notifications.usun_przypomnie', 'Usuń przypomnienie'), t('notifications.czy_na_pewno_chcesz_usunac', 'Czy na pewno chcesz usunąć to przypomnienie?'), [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => removeReminder(id) },
    ]);
  };

  const toggleDay = (id: string, day: number) => {
    const r = scheduledReminders.find(r => r.id === id);
    if (!r) return;
    const days = r.days.includes(day) ? r.days.filter(d => d !== day) : [...r.days, day];
    updateReminder(id, { days });
  };

  const saveCustomReminder = () => {
    if (!customName.trim()) {
      Alert.alert(t('notifications.uzupelnij_nazwe', 'Uzupełnij nazwę'), t('notifications.podaj_nazwe_przypomnie', 'Podaj nazwę przypomnienia.'));
      return;
    }
    if (customDays.length === 0) {
      Alert.alert(t('notifications.wybierz_dni', 'Wybierz dni'), t('notifications.zaznacz_przynajmni_jeden_dzien_tygo', 'Zaznacz przynajmniej jeden dzień tygodnia.'));
      return;
    }
    void HapticsService.impact('light');
    addReminder({
      id: `reminder_custom_${Date.now()}`,
      title: `${customIcon} ${customName.trim()}`,
      body: customBody.trim() || 'Czas na twoją praktykę duchową.',
      hour: customHour,
      minute: customMinute,
      days: customDays,
      enabled: true,
      category: 'custom',
    });
    setShowCustomModal(false);
    setCustomName('');
    setCustomBody('');
    setCustomHour(10);
    setCustomMinute(0);
    setCustomDays([1,2,3,4,5,6,0]);
    setCustomIcon('⭐');
  };

  const toggleCustomDay = (day: number) => {
    void HapticsService.selection();
    setCustomDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <View style={[ns.root, { backgroundColor: isLight ? '#FAF7F2' : '#07080F' }]}>
      <SafeAreaView edges={['top']} style={ns.safe}>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(350)} style={ns.header}>
          <Pressable onPress={() => navigation.goBack()} style={[ns.backBtn, { backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.06)' }]}>
            <ChevronLeft color={textColor} size={22} strokeWidth={2} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[ns.headerEyebrow, { color: subColor }]}>{t('notifications.aethera', 'AETHERA')}</Text>
            <Text style={[ns.headerTitle, { color: textColor }]}>{t('notifications.title')}</Text>
          </View>
          {activeCount > 0 && (
            <View style={[ns.activeBadge, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '44' }]}>
              <Bell size={12} color={ACCENT} />
              <Text style={[ns.activeBadgeText, { color: ACCENT }]}>{activeCount} aktywnych</Text>
            </View>
          )}
        </Animated.View>

        <ScrollView
          contentContainerStyle={[ns.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'airy') + 90 }]}
          showsVerticalScrollIndicator={false}
        >

          {/* Permission banner */}
          {permGranted === false && (
            <Animated.View entering={FadeInDown.duration(400)}>
              <Pressable onPress={requestPerm} style={[ns.permBanner, { backgroundColor: '#F87171' + '18', borderColor: '#F87171' + '44' }]}>
                <BellOff color="#F87171" size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={[ns.permTitle, { color: '#F87171' }]}>{t('notifications.disabled')}</Text>
                  <Text style={[ns.permBody, { color: subColor }]}>{t('notifications.kliknij_aby_przyznac_uprawnieni_w', 'Kliknij, aby przyznać uprawnienia w ustawieniach systemu.')}</Text>
                </View>
                <ChevronRight color="#F87171" size={16} />
              </Pressable>
            </Animated.View>
          )}

          {permGranted === true && (
            <Animated.View entering={FadeInDown.duration(400)}>
              <View style={[ns.permBanner, { backgroundColor: '#34D399' + '14', borderColor: '#34D399' + '33' }]}>
                <CheckCircle2 color="#34D399" size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={[ns.permTitle, { color: '#34D399' }]}>{t('notifications.enabled')}</Text>
                  <Text style={[ns.permBody, { color: subColor }]}>{t('notifications.aethera_moze_wysylac_ci_duchowe', 'Aethera może wysyłać Ci duchowe przypomnienia.')}</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Statistics strip */}
          <Animated.View entering={FadeInDown.delay(60).duration(400)}>
            <View style={[ns.statsStrip, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <LinearGradient colors={[ACCENT + '10', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={ns.statItem}>
                <Text style={[ns.statValue, { color: ACCENT }]}>{activeCount}</Text>
                <Text style={[ns.statLabel, { color: subColor }]}>{t('notifications.aktywne', 'Aktywne')}</Text>
              </View>
              <View style={[ns.statDivider, { backgroundColor: cardBorder }]} />
              <View style={ns.statItem}>
                <Text style={[ns.statValue, { color: '#FBBF24' }]}>{longestStreak}</Text>
                <Text style={[ns.statLabel, { color: subColor }]}>{t('notifications.najdluzsze_pasmo', 'Najdłuższe pasmo')}</Text>
              </View>
              <View style={[ns.statDivider, { backgroundColor: cardBorder }]} />
              <View style={ns.statItem}>
                <Text style={[ns.statValue, { color: '#34D399' }]}>{deliveredCount}</Text>
                <Text style={[ns.statLabel, { color: subColor }]}>{t('notifications.dostarczon', 'Dostarczonych')}</Text>
              </View>
              <View style={[ns.statDivider, { backgroundColor: cardBorder }]} />
              <View style={ns.statItem}>
                <Text style={[ns.statValue, { color: '#60A5FA' }]}>{totalCount}</Text>
                <Text style={[ns.statLabel, { color: subColor }]}>{t('notifications.lacznie', 'Łącznie')}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Daily Oracle Message */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View style={[ns.oracleCard, { backgroundColor: cardBg, borderColor: oracleEnabled ? ACCENT + '44' : cardBorder }]}>
              <LinearGradient colors={oracleEnabled ? [ACCENT + '14', 'transparent'] : ['transparent', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={ns.oracleHeader}>
                <View style={[ns.oracleIconWrap, { backgroundColor: ACCENT + '20' }]}>
                  <Text style={{ fontSize: 20 }}>🔮</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[ns.oracleTitle, { color: textColor }]}>{t('notifications.dzienna_madrosc_oracle', 'Dzienna Mądrość Oracle')}</Text>
                  <Text style={[ns.oracleSub, { color: subColor }]}>{t('notifications.codzienne_przeslanie_w_powiadomie', 'Codzienne przesłanie w powiadomieniu')}</Text>
                </View>
                <CustomToggle value={oracleEnabled} onChange={setOracleEnabled} accentColor={ACCENT} />
              </View>
              {oracleEnabled && (
                <View style={[ns.oracleMessage, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', borderColor: ACCENT + '28' }]}>
                  <Text style={[ns.oracleMessageText, { color: textColor }]}>„{oracleMessage}"</Text>
                  <Text style={[ns.oracleMessageSub, { color: subColor }]}>{t('notifications.aethera_oracle_dzisiejsze_przeslani', '— Aethera Oracle · dzisiejsze przesłanie')}</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Cosmic Events */}
          <Animated.View entering={FadeInDown.delay(140).duration(400)}>
            <Pressable
              style={ns.sectionHeaderRow}
              onPress={() => setCosmicExpanded(v => !v)}
            >
              <Text style={[ns.sectionTitle, { color: subColor }]}>{t('notifications.nadchodzac_kosmiczne_wydarzenia', 'NADCHODZĄCE KOSMICZNE WYDARZENIA')}</Text>
              <ChevronRight
                color={subColor}
                size={14}
                style={{ transform: [{ rotate: cosmicExpanded ? '90deg' : '0deg' }] }}
              />
            </Pressable>

            {cosmicExpanded && (
              <>
                {/* Current moon phase banner */}
                <View style={[ns.moonBanner, { backgroundColor: cardBg, borderColor: '#60A5FA' + '44' }]}>
                  <LinearGradient colors={['#60A5FA' + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                  <Text style={{ fontSize: 28 }}>{moonPhase.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[ns.moonName, { color: textColor }]}>{moonPhase.name}</Text>
                    <Text style={[ns.moonSub, { color: subColor }]}>{t('notifications.aktualna_faza_ksiezyca', 'Aktualna faza Księżyca')}</Text>
                  </View>
                  <View style={[ns.moonPct, { backgroundColor: '#60A5FA' + '20' }]}>
                    <Text style={[ns.moonPctText, { color: '#60A5FA' }]}>{Math.round(moonPhase.phase * 100)}%</Text>
                  </View>
                </View>

                {/* Event cards */}
                {[
                  { emoji: '🌑', label: 'Następny Nów', date: nextNewMoon, color: '#94A3B8', desc: 'Czas intencji i nowych początków' },
                  { emoji: '🌕', label: 'Następna Pełnia', date: nextFullMoon, color: '#FBBF24', desc: 'Kulminacja i uwalnianie' },
                  { emoji: '🌿', label: nextEquinox.name, date: nextEquinox.date, color: '#34D399', desc: 'Równowaga dnia i nocy' },
                ].map((event, i) => (
                  <Animated.View key={event.label} entering={FadeInUp.delay(i * 60).duration(380)}>
                    <View style={[ns.cosmicCard, { backgroundColor: cardBg, borderColor: event.color + '33' }]}>
                      <LinearGradient colors={[event.color + '0C', 'transparent']} style={StyleSheet.absoluteFill} />
                      <Text style={{ fontSize: 22 }}>{event.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[ns.cosmicLabel, { color: textColor }]}>{event.label}</Text>
                        <Text style={[ns.cosmicDesc, { color: subColor }]}>{event.desc}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[ns.cosmicDate, { color: event.color }]}>{formatDate(event.date)}</Text>
                        <View style={[ns.cosmicCountdown, { backgroundColor: event.color + '18' }]}>
                          <Text style={[ns.cosmicCountdownText, { color: event.color }]}>za {daysUntil(event.date)} dni</Text>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                ))}

                {/* Mercury retrograde info */}
                <View style={[ns.retroCard, { backgroundColor: '#F87171' + '0E', borderColor: '#F87171' + '33' }]}>
                  <AlertCircle color="#F87171" size={16} strokeWidth={1.8} />
                  <View style={{ flex: 1 }}>
                    <Text style={[ns.retroTitle, { color: '#F87171' }]}>{t('notifications.merkury_retrograde', 'Merkury Retrograde')}</Text>
                    <Text style={[ns.retroBody, { color: subColor }]}>{t('notifications.nastepny_cykl_lipiec_2026_ostroznos', 'Następny cykl: lipiec 2026. Ostrożność w komunikacji i podpisywaniu umów.')}</Text>
                  </View>
                </View>
              </>
            )}
          </Animated.View>

          {/* Reminder Presets (templates) */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Pressable style={ns.sectionHeaderRow} onPress={() => setPresetsExpanded(v => !v)}>
              <Text style={[ns.sectionTitle, { color: subColor, marginTop: 0 }]}>{t('notifications.presets').toUpperCase()}</Text>
              <ChevronRight
                color={subColor}
                size={14}
                style={{ transform: [{ rotate: presetsExpanded ? '90deg' : '0deg' }] }}
              />
            </Pressable>

            {presetsExpanded && PRESET_REMINDERS.map((preset, i) => {
              const alreadyAdded = scheduledReminders.some(r => r.title === preset.title);
              const meta = CATEGORY_META[preset.category];
              return (
                <Animated.View key={preset.title} entering={FadeInUp.delay(i * 55).duration(380)}>
                  <Pressable
                    onPress={() => !alreadyAdded && addPreset(preset)}
                    style={[ns.presetCard, { backgroundColor: cardBg, borderColor: alreadyAdded ? meta.color + '44' : cardBorder }]}
                  >
                    <LinearGradient colors={[meta.color + '0E', 'transparent']} style={StyleSheet.absoluteFill} />
                    <View style={[ns.presetIcon, { backgroundColor: meta.color + '20' }]}>
                      <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
                    </View>
                    <View style={ns.presetText}>
                      <Text style={[ns.presetLabel, { color: textColor }]}>{preset.title.replace(/\s[^\s]+$/, '')}</Text>
                      <Text style={[ns.presetTime, { color: meta.color }]}>
                        {formatTime(preset.hour, preset.minute)} · {meta.label}
                      </Text>
                    </View>
                    <View style={[ns.presetBadge, alreadyAdded
                      ? { backgroundColor: meta.color + '22', borderColor: meta.color + '44' }
                      : { backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.08)', borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)' }
                    ]}>
                      <Text style={[ns.presetBadgeText, { color: alreadyAdded ? meta.color : subColor }]}>
                        {alreadyAdded ? '✓ Dodane' : '+ Dodaj'}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* Ritual Packs */}
          <Animated.View entering={FadeInDown.delay(260).duration(400)}>
            <Pressable style={ns.sectionHeaderRow} onPress={() => setPacksExpanded(v => !v)}>
              <Text style={[ns.sectionTitle, { color: subColor }]}>{t('notifications.pakiety_rytualnych_przypomnie', 'PAKIETY RYTUALNYCH PRZYPOMNIEŃ')}</Text>
              <ChevronRight
                color={subColor}
                size={14}
                style={{ transform: [{ rotate: packsExpanded ? '90deg' : '0deg' }] }}
              />
            </Pressable>

            {packsExpanded && RITUAL_PACKS.map((pack, i) => {
              const allAdded = pack.reminders.every(r => scheduledReminders.some(x => x.title === r.title));
              return (
                <Animated.View key={pack.id} entering={FadeInUp.delay(i * 60).duration(380)}>
                  <Pressable
                    onPress={() => !allAdded && addPack(pack)}
                    style={[ns.packCard, { backgroundColor: cardBg, borderColor: allAdded ? pack.color + '55' : cardBorder }]}
                  >
                    <LinearGradient colors={[pack.color + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                    <View style={[ns.packIcon, { backgroundColor: pack.color + '20' }]}>
                      <Text style={{ fontSize: 24 }}>{pack.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[ns.packName, { color: textColor }]}>{pack.name}</Text>
                      <Text style={[ns.packDesc, { color: subColor }]}>{pack.desc}</Text>
                      <Text style={[ns.packCount, { color: pack.color }]}>{pack.reminders.length} przypomnienia w pakiecie</Text>
                    </View>
                    <View style={[ns.packBadge, allAdded
                      ? { backgroundColor: pack.color + '22', borderColor: pack.color + '44' }
                      : { backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.07)', borderColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.13)' }
                    ]}>
                      <Text style={[ns.packBadgeText, { color: allAdded ? pack.color : subColor }]}>
                        {allAdded ? '✓ Aktywny' : '+ Dodaj'}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* My Reminders */}
          {scheduledReminders.length > 0 && (
            <Animated.View entering={FadeInDown.delay(320).duration(400)}>
              <Text style={[ns.sectionTitle, { color: subColor, marginTop: 8 }]}>{t('notifications.reminders').toUpperCase()}</Text>
              {scheduledReminders.map((reminder, i) => {
                const meta = CATEGORY_META[reminder.category] || CATEGORY_META.custom;
                const isExpanded = editingId === reminder.id;
                return (
                  <Animated.View key={reminder.id} entering={FadeInUp.delay(i * 50).duration(380)}>
                    <View style={[ns.reminderCard, { backgroundColor: cardBg, borderColor: reminder.enabled ? meta.color + '44' : cardBorder }]}>
                      <LinearGradient colors={[reminder.enabled ? meta.color + '0E' : 'transparent', 'transparent']} style={StyleSheet.absoluteFill} />
                      <View style={ns.reminderRow}>
                        <View style={[ns.reminderIcon, { backgroundColor: meta.color + '20' }]}>
                          <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
                        </View>
                        <View style={ns.reminderText}>
                          <Text style={[ns.reminderTitle, { color: textColor }]} numberOfLines={1}>{reminder.title.replace(/\s[^\s]+$/, '')}</Text>
                          <Text style={[ns.reminderTime, { color: meta.color }]}>
                            {formatTime(reminder.hour, reminder.minute)} · {reminder.days.length === 7 ? 'Codziennie' : `${reminder.days.length} dni/tydz.`}
                          </Text>
                        </View>
                        <Pressable onPress={() => setEditingId(isExpanded ? null : reminder.id)} style={[ns.expandBtn, { backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.06)' }]}>
                          <Clock size={14} color={subColor} />
                        </Pressable>
                        <CustomToggle value={reminder.enabled} onChange={(v) => toggleReminder(reminder.id, v)} accentColor={meta.color} />
                        <Pressable onPress={() => deleteReminder(reminder.id)} style={ns.deleteBtn}>
                          <Trash2 size={14} color="#ef4444" />
                        </Pressable>
                      </View>

                      {isExpanded && (
                        <View style={ns.editor}>
                          <View style={ns.editorSection}>
                            <Text style={[ns.editorLabel, { color: subColor }]}>{t('notifications.time').toUpperCase()}</Text>
                            <View style={ns.editorRow}>
                              <TimeAdjuster value={reminder.hour} onChange={h => updateReminder(reminder.id, { hour: h })} min={0} max={23} label={t('notifications.gg', 'GG')} textColor={subColor} isLight={isLight} />
                              <Text style={[ns.timeSep, { color: textColor }]}>:</Text>
                              <TimeAdjuster value={reminder.minute} onChange={m => updateReminder(reminder.id, { minute: m })} min={0} max={59} step={5} label={t('notifications.mm', 'MM')} textColor={subColor} isLight={isLight} />
                            </View>
                          </View>
                          <View style={ns.editorSection}>
                            <Text style={[ns.editorLabel, { color: subColor }]}>{t('notifications.days').toUpperCase()}</Text>
                            <View style={ns.daysRow}>
                              {ALL_DAYS.map(day => {
                                const active = reminder.days.includes(day);
                                return (
                                  <Pressable
                                    key={day}
                                    onPress={() => toggleDay(reminder.id, day)}
                                    style={[ns.dayChip, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', borderColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)' }, active && { backgroundColor: meta.color + '28', borderColor: meta.color + '66' }]}
                                  >
                                    <Text style={[ns.dayLabel, { color: active ? meta.color : subColor }]}>{DAYS_PL[day]}</Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  </Animated.View>
                );
              })}
            </Animated.View>
          )}

          {/* Custom reminder creator CTA */}
          <Animated.View entering={FadeInDown.delay(370).duration(400)}>
            <Pressable
              onPress={() => setShowCustomModal(true)}
              style={[ns.customCta, { backgroundColor: cardBg, borderColor: ACCENT + '44', borderStyle: 'dashed' }]}
            >
              <LinearGradient colors={[ACCENT + '0C', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={[ns.customCtaIcon, { backgroundColor: ACCENT + '20' }]}>
                <Plus size={20} color={ACCENT} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[ns.customCtaTitle, { color: textColor }]}>{t('notifications.add_reminder')}</Text>
                <Text style={[ns.customCtaSub, { color: subColor }]}>{t('notifications.niestandar_nazwa_czas_i_dni', 'Niestandardowa nazwa, czas i dni tygodnia')}</Text>
              </View>
              <ChevronRight color={ACCENT} size={16} />
            </Pressable>
          </Animated.View>

          {/* Empty state */}
          {scheduledReminders.length === 0 && (
            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
              <View style={[ns.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={{ fontSize: 32, marginBottom: 12 }}>🔔</Text>
                <Text style={[ns.emptyTitle, { color: textColor }]}>{t('notifications.brak_przypomnie', 'Brak przypomnień')}</Text>
                <Text style={[ns.emptyBody, { color: subColor }]}>
                  {t('notifications.dodaj_pierwsze_przypomnie_korzystaj', 'Dodaj pierwsze przypomnienie korzystając z szablonów powyżej lub utwórz własne.')}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Quiet Hours */}
          <Animated.View entering={FadeInDown.delay(420).duration(400)}>
            <Text style={[ns.sectionTitle, { color: subColor, marginTop: 8 }]}>{t('notifications.strefa_ciszy', 'STREFA CISZY')}</Text>
            <View style={[ns.quietCard, { backgroundColor: cardBg, borderColor: quietEnabled ? '#60A5FA' + '44' : cardBorder }]}>
              <LinearGradient colors={quietEnabled ? ['#60A5FA' + '0C', 'transparent'] : ['transparent', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={ns.quietMainRow}>
                <View style={[ns.quietIconWrap, { backgroundColor: '#60A5FA' + '18' }]}>
                  <Moon size={18} color="#60A5FA" strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[ns.quietTitle, { color: textColor }]}>{t('notifications.nie_przeszkadz', 'Nie przeszkadzać')}</Text>
                  <Text style={[ns.quietSub, { color: subColor }]}>
                    {quietEnabled
                      ? `${formatTime(quietFrom.hour, quietFrom.minute)} – ${formatTime(quietTo.hour, quietTo.minute)}`
                      : 'Ustaw okno bez powiadomień'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => { void HapticsService.selection(); setQuietExpanded(v => !v); }}
                  style={[ns.expandBtn, { backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.06)' }]}
                >
                  <Edit3 size={13} color={subColor} />
                </Pressable>
                <CustomToggle value={quietEnabled} onChange={(v) => { void HapticsService.selection(); setQuietEnabled(v); }} accentColor="#60A5FA" />
              </View>

              {quietExpanded && (
                <View style={[ns.quietEditor, { borderTopColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.08)' }]}>
                  <View style={ns.quietTimeRow}>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={[ns.editorLabel, { color: subColor, marginBottom: 8 }]}>{t('notifications.od_godziny', 'OD GODZINY')}</Text>
                      <View style={ns.editorRow}>
                        <TimeAdjuster value={quietFrom.hour} onChange={h => setQuietFrom(p => ({ ...p, hour: h }))} min={0} max={23} label={t('notifications.gg_1', 'GG')} textColor={subColor} isLight={isLight} />
                        <Text style={[ns.timeSep, { color: textColor }]}>:</Text>
                        <TimeAdjuster value={quietFrom.minute} onChange={m => setQuietFrom(p => ({ ...p, minute: m }))} min={0} max={59} step={15} label={t('notifications.mm_1', 'MM')} textColor={subColor} isLight={isLight} />
                      </View>
                    </View>
                    <View style={[ns.quietArrow, { backgroundColor: '#60A5FA' + '18' }]}>
                      <ChevronRight color="#60A5FA" size={16} />
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={[ns.editorLabel, { color: subColor, marginBottom: 8 }]}>{t('notifications.do_godziny', 'DO GODZINY')}</Text>
                      <View style={ns.editorRow}>
                        <TimeAdjuster value={quietTo.hour} onChange={h => setQuietTo(p => ({ ...p, hour: h }))} min={0} max={23} label={t('notifications.gg_2', 'GG')} textColor={subColor} isLight={isLight} />
                        <Text style={[ns.timeSep, { color: textColor }]}>:</Text>
                        <TimeAdjuster value={quietTo.minute} onChange={m => setQuietTo(p => ({ ...p, minute: m }))} min={0} max={59} step={15} label={t('notifications.mm_2', 'MM')} textColor={subColor} isLight={isLight} />
                      </View>
                    </View>
                  </View>
                  <Text style={[ns.quietHint, { color: subColor }]}>
                    {t('notifications.w_tym_czasie_aethera_nie', 'W tym czasie Aethera nie wyśle żadnych powiadomień, nawet aktywnych.')}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Notification History */}
          <Animated.View entering={FadeInDown.delay(460).duration(400)}>
            <Pressable style={ns.sectionHeaderRow} onPress={() => setShowHistory(v => !v)}>
              <Text style={[ns.sectionTitle, { color: subColor }]}>{t('notifications.historia_powiadomie', 'HISTORIA POWIADOMIEŃ')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[ns.historyBadge, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '30' }]}>
                  <Text style={[ns.historyBadgeText, { color: ACCENT }]}>{t('notifications.7_dni', '7 dni')}</Text>
                </View>
                <ChevronRight
                  color={subColor}
                  size={14}
                  style={{ transform: [{ rotate: showHistory ? '90deg' : '0deg' }] }}
                />
              </View>
            </Pressable>

            {showHistory && (
              <View style={[ns.historyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {reminderHistory.length === 0 ? (
                  <Text style={[ns.historyMeta, { color: subColor, textAlign: 'center', paddingVertical: 12 }]}>
                    {t('notifications.brak_historii_dodaj_przypomnie_powy', 'Brak historii — dodaj przypomnienia powyżej')}
                  </Text>
                ) : null}
                {reminderHistory.map((item, i) => (
                  <View
                    key={item.id}
                    style={[
                      ns.historyItem,
                      i < reminderHistory.length - 1 && { borderBottomWidth: 1, borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.07)' },
                    ]}
                  >
                    <View style={[ns.historyDot, { backgroundColor: item.status === 'delivered' ? '#34D399' : '#94A3B8' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[ns.historyTitle, { color: textColor }]}>{item.title}</Text>
                      <Text style={[ns.historyMeta, { color: subColor }]}>
                        {item.daysAgo === 0 ? 'Dziś' : item.daysAgo === 1 ? 'Wczoraj' : `${item.daysAgo} dni temu`} · {item.time}
                      </Text>
                    </View>
                    <View style={[ns.historyStatus, {
                      backgroundColor: item.status === 'delivered' ? '#34D399' + '18' : '#94A3B8' + '18',
                      borderColor: item.status === 'delivered' ? '#34D399' + '44' : '#94A3B8' + '33',
                    }]}>
                      <Text style={[ns.historyStatusText, { color: item.status === 'delivered' ? '#34D399' : '#94A3B8' }]}>
                        {item.status === 'delivered' ? 'Dostarczono' : 'Pominięto'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Info footer */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <View style={[ns.infoCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[ns.infoText, { color: subColor }]}>
                ✦ Powiadomienia pojawiają się tylko wtedy, gdy je tutaj ustawisz.{'\n'}
                ✦ Czas jest ustawiany lokalnie na Twoim urządzeniu.{'\n'}
                ✦ Możesz wyłączyć każde powiadomienie bez jego usuwania.{'\n'}
                ✦ Strefa ciszy blokuje wszystkie powiadomienia w danym oknie.
              </Text>
            </View>
          </Animated.View>

          <EndOfContentSpacer size="compact" />
        </ScrollView>
      </SafeAreaView>

      {/* Custom Reminder Modal */}
      <Modal
        visible={showCustomModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCustomModal(false)}
      >
        <Pressable style={ns.modalOverlay} onPress={() => setShowCustomModal(false)} />
        <View style={[ns.modalSheet, { backgroundColor: isLight ? '#FAF7F2' : '#12111C' }]}>
          <LinearGradient colors={[ACCENT + '12', 'transparent']} style={StyleSheet.absoluteFill} />

          {/* Modal header */}
          <View style={ns.modalHeader}>
            <View>
              <Text style={[ns.modalTitle, { color: textColor }]}>{t('notifications.add_reminder')}</Text>
              <Text style={[ns.modalSub, { color: subColor }]}>{t('notifications.spersonali_swoj_rytm_duchowy', 'Spersonalizuj swój rytm duchowy')}</Text>
            </View>
            <Pressable onPress={() => setShowCustomModal(false)} style={[ns.modalClose, { backgroundColor: isLight ? 'rgba(255,246,230,0.95)' : 'rgba(255,255,255,0.08)' }]}>
              <X size={18} color={textColor} />
            </Pressable>
          </View>

          {/* Icon picker */}
          <Text style={[ns.modalLabel, { color: subColor }]}>{t('notifications.ikona', 'IKONA')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
              {CUSTOM_ICONS.map(ic => (
                <Pressable
                  key={ic}
                  onPress={() => { void HapticsService.selection(); setCustomIcon(ic); }}
                  style={[ns.iconChip, { backgroundColor: customIcon === ic ? ACCENT + '28' : (isLight ? 'rgba(255,248,234,0.92)' : 'rgba(255,255,255,0.07)'), borderColor: customIcon === ic ? ACCENT + '77' : (isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.12)') }]}
                >
                  <Text style={{ fontSize: 20 }}>{ic}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Name input */}
          <Text style={[ns.modalLabel, { color: subColor }]}>{t('notifications.nazwa', 'NAZWA')}</Text>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder={t('notifications.np_medytacja_poranna', 'np. Medytacja poranna')}
            placeholderTextColor={subColor}
            style={[ns.modalInput, { backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.07)', borderColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)', color: textColor }]}
          />

          {/* Message input */}
          <Text style={[ns.modalLabel, { color: subColor }]}>{t('notifications.tresc_powiadomie_opcjonalni', 'TREŚĆ POWIADOMIENIA (opcjonalnie)')}</Text>
          <TextInput
            value={customBody}
            onChangeText={setCustomBody}
            placeholder={t('notifications.krotka_wiadomosc_motywacyjn', 'Krótka wiadomość motywacyjna...')}
            placeholderTextColor={subColor}
            style={[ns.modalInput, { backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.07)', borderColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)', color: textColor }]}
          />

          {/* Time picker */}
          <Text style={[ns.modalLabel, { color: subColor }]}>{t('notifications.time').toUpperCase()}</Text>
          <View style={[ns.modalTimeRow, { marginBottom: 16 }]}>
            <TimeAdjuster value={customHour} onChange={setCustomHour} min={0} max={23} label={t('notifications.gg_3', 'GG')} textColor={subColor} isLight={isLight} />
            <Text style={[ns.timeSep, { color: textColor }]}>:</Text>
            <TimeAdjuster value={customMinute} onChange={setCustomMinute} min={0} max={59} step={5} label={t('notifications.mm_3', 'MM')} textColor={subColor} isLight={isLight} />
          </View>

          {/* Day picker */}
          <Text style={[ns.modalLabel, { color: subColor }]}>{t('notifications.days').toUpperCase()}</Text>
          <View style={[ns.daysRow, { marginBottom: 24 }]}>
            {ALL_DAYS.map(day => {
              const active = customDays.includes(day);
              return (
                <Pressable
                  key={day}
                  onPress={() => toggleCustomDay(day)}
                  style={[ns.dayChip, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)', borderColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)' }, active && { backgroundColor: ACCENT + '28', borderColor: ACCENT + '66' }]}
                >
                  <Text style={[ns.dayLabel, { color: active ? ACCENT : subColor }]}>{DAYS_PL[day]}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Save button */}
          <Pressable onPress={saveCustomReminder} style={ns.modalSaveBtn}>
            <LinearGradient colors={[ACCENT, '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ns.modalSaveBtnGrad}>
              <Bell size={16} color="#fff" strokeWidth={2} />
              <Text style={ns.modalSaveBtnText}>{t('notifications.saveReminder')}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────────
const ns = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: layout.padding.screen, paddingTop: 6 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: layout.padding.screen, paddingTop: 4, paddingBottom: 16,
  },
  backBtn: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  headerTitle: { fontSize: 22, fontWeight: '600', letterSpacing: -0.2 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  activeBadgeText: { fontSize: 11, fontWeight: '700' },

  permBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1,
    padding: 14, marginBottom: 14,
  },
  permTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  permBody: { fontSize: 12 },

  // Stats strip
  statsStrip: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1,
    padding: 16, marginBottom: 16, overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.4, textAlign: 'center' },
  statDivider: { width: 1, height: 32, marginHorizontal: 4 },

  // Oracle message card
  oracleCard: {
    borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden', marginBottom: 16,
  },
  oracleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 0 },
  oracleIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  oracleTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  oracleSub: { fontSize: 12 },
  oracleMessage: {
    borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 14,
  },
  oracleMessageText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic', marginBottom: 8 },
  oracleMessageSub: { fontSize: 11, fontWeight: '600' },

  // Cosmic events
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12, marginTop: 8,
  },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },

  moonBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1,
    padding: 14, overflow: 'hidden', marginBottom: 10,
  },
  moonName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  moonSub: { fontSize: 12 },
  moonPct: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  moonPctText: { fontSize: 13, fontWeight: '800' },

  cosmicCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1,
    padding: 14, overflow: 'hidden', marginBottom: 8,
  },
  cosmicLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  cosmicDesc: { fontSize: 12 },
  cosmicDate: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  cosmicCountdown: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  cosmicCountdownText: { fontSize: 10, fontWeight: '700' },

  retroCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, borderWidth: 1,
    padding: 12, marginBottom: 16,
  },
  retroTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  retroBody: { fontSize: 12, lineHeight: 18 },

  // Preset & pack cards
  presetCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1,
    padding: 14, overflow: 'hidden', marginBottom: 10,
  },
  presetIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  presetText: { flex: 1 },
  presetLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  presetTime: { fontSize: 12, fontWeight: '700' },
  presetBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  presetBadgeText: { fontSize: 11, fontWeight: '700' },

  packCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1,
    padding: 16, overflow: 'hidden', marginBottom: 10,
  },
  packIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  packName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  packDesc: { fontSize: 12, marginBottom: 4 },
  packCount: { fontSize: 11, fontWeight: '700' },
  packBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  packBadgeText: { fontSize: 11, fontWeight: '700' },

  // Reminder cards
  reminderCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 10, padding: 14 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reminderIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  reminderText: { flex: 1 },
  reminderTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  reminderTime: { fontSize: 11, fontWeight: '700' },
  expandBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.12)' },

  toggle: { width: 40, height: 22, borderRadius: 11, justifyContent: 'center', position: 'relative' },
  toggleThumb: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff', ...shadows.soft },

  editor: { marginTop: 14, gap: 14 },
  editorSection: { gap: 8 },
  editorLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.4 },
  editorRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  timeSep: { fontSize: 22, fontWeight: '700', marginBottom: 6 },

  adjuster: { alignItems: 'center', gap: 4 },
  adjLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  adjRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adjBtn: { width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(167,139,250,0.22)', alignItems: 'center', justifyContent: 'center' },
  adjValue: { width: 36, fontSize: 20, fontWeight: '700', textAlign: 'center', color: '#fff' },

  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayChip: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  dayLabel: { fontSize: 11, fontWeight: '700' },

  // Custom CTA
  customCta: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1.5,
    padding: 16, overflow: 'hidden', marginTop: 4, marginBottom: 16,
  },
  customCtaIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  customCtaTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  customCtaSub: { fontSize: 12 },

  // Quiet Hours
  quietCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 16, padding: 14 },
  quietMainRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quietIconWrap: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  quietTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  quietSub: { fontSize: 12 },
  quietEditor: { marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
  quietTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 },
  quietArrow: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quietHint: { fontSize: 11, lineHeight: 18, textAlign: 'center' },

  // History
  historyBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  historyBadgeText: { fontSize: 10, fontWeight: '700' },
  historyCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  historyDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  historyTitle: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  historyMeta: { fontSize: 11 },
  historyStatus: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  historyStatusText: { fontSize: 10, fontWeight: '700' },

  // Empty state
  emptyCard: { borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', padding: 28, alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  emptyBody: { fontSize: 13, textAlign: 'center', lineHeight: 20, opacity: 0.8 },

  // Info footer
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 8 },
  infoText: { fontSize: 12, lineHeight: 22 },

  // Modal
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40, overflow: 'hidden',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalSub: { fontSize: 13 },
  modalClose: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  modalInput: {
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, marginBottom: 16,
  },
  modalTimeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  modalSaveBtn: { borderRadius: 16, overflow: 'hidden' },
  modalSaveBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 16,
  },
  modalSaveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  iconChip: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
});
