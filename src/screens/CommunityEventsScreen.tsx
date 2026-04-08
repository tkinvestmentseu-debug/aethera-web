// @ts-nocheck
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  Globe,
  Hash,
  Lock,
  Plus,
  Share2,
  Sparkles,
  Users,
  X,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
import { useAuthStore } from '../store/useAuthStore';
import { HapticsService } from '../core/services/haptics.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { EventsService, CommunityEvent } from '../core/services/community/events.service';
import { Typography } from '../components/Typography';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { layout } from '../core/theme/designSystem';

const { width: SW } = Dimensions.get('window');
const P = layout.padding.screen; // 22

// ─── Type colors / emojis ────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  CommunityEvent['type'],
  { label: string; emoji: string; gradient: [string, string] }
> = {
  meditation: { label: 'Medytacja', emoji: '🧘', gradient: ['#6366F1', '#818CF8'] },
  ritual:     { label: 'Rytuał',    emoji: '🕯️', gradient: ['#F59E0B', '#FBBF24'] },
  tarot:      { label: 'Tarot',     emoji: '🔮', gradient: ['#8B5CF6', '#A78BFA'] },
  meeting:    { label: 'Spotkanie', emoji: '💬', gradient: ['#10B981', '#34D399'] },
  workshop:   { label: 'Warsztat',  emoji: '📚', gradient: ['#EC4899', '#F472B6'] },
  astrology:  { label: 'Astrologia',emoji: '⭐', gradient: ['#3B82F6', '#60A5FA'] },
  breathwork: { label: 'Oddech',    emoji: '🌬️', gradient: ['#14B8A6', '#2DD4BF'] },
  oracle:     { label: 'Wyrocznia', emoji: '✨', gradient: ['#F97316', '#FB923C'] },
};

const TYPE_FILTER_TABS: Array<{ key: string; label: string }> = [
  { key: 'all',        label: 'Wszystkie' },
  { key: 'meditation', label: 'Medytacja' },
  { key: 'ritual',     label: 'Rytuał' },
  { key: 'tarot',      label: 'Tarot' },
  { key: 'meeting',    label: 'Spotkanie' },
];

// ─── Seed fallback events ────────────────────────────────────────────────────

const NOW = Date.now();
const H = 3600000;

const SEED_EVENTS: CommunityEvent[] = [
  {
    id: 'seed1',
    title: 'Wieczorna Medytacja Pełni Księżyca',
    description: 'Wspólna medytacja pod pełnym księżycem. Skupiamy się na uwolnieniu i wdzięczności.',
    hostId: 'host1',
    hostName: 'Luna Voss',
    hostEmoji: '🌙',
    startTime: NOW + 2 * H,
    endTime: NOW + 3 * H,
    type: 'meditation',
    maxParticipants: 100,
    participants: ['u1', 'u2', 'u3'],
    participantNames: ['Luna', 'Arion', 'Vera'],
    inviteCode: 'SEED01',
    isPrivate: false,
    coverEmoji: '🌕',
    tags: ['medytacja', 'księżyc'],
    timezone: 'Europe/Warsaw',
    createdAt: NOW - H,
    status: 'upcoming',
  },
  {
    id: 'seed2',
    title: 'Rytuał Nowego Początku',
    description: 'Rytuał oczyszczenia i intencji na nowy rozdział życia. Przynieś świecę i kartkę.',
    hostId: 'host2',
    hostName: 'Ember Kiran',
    hostEmoji: '🔥',
    startTime: NOW + 5 * H,
    endTime: NOW + 6.5 * H,
    type: 'ritual',
    maxParticipants: 30,
    participants: ['u1', 'u4'],
    participantNames: ['Luna', 'Solaris'],
    inviteCode: 'SEED02',
    isPrivate: false,
    coverEmoji: '🕯️',
    tags: ['rytuał', 'oczyszczenie'],
    timezone: 'Europe/Warsaw',
    createdAt: NOW - 2 * H,
    status: 'upcoming',
  },
  {
    id: 'seed3',
    title: 'Warsztaty Tarota dla Początkujących',
    description: 'Nauka czytania kart — od podstaw do pierwszego własnego spreadu. Bez wymagań wstępnych.',
    hostId: 'host3',
    hostName: 'Aria Sol',
    hostEmoji: '✨',
    startTime: NOW + 25 * H,
    endTime: NOW + 27 * H,
    type: 'tarot',
    maxParticipants: 20,
    participants: ['u1', 'u2', 'u5'],
    participantNames: ['Luna', 'Arion', 'Celeste'],
    inviteCode: 'SEED03',
    isPrivate: false,
    coverEmoji: '🔮',
    tags: ['tarot', 'nauka'],
    timezone: 'Europe/Warsaw',
    createdAt: NOW - 3 * H,
    status: 'upcoming',
  },
  {
    id: 'seed4',
    title: 'Krąg Oddechu — Techniki 4-7-8',
    description: 'Grupowa sesja oddechowa. Uspokojenie układu nerwowego i głęboki relaks.',
    hostId: 'host4',
    hostName: 'Orion Spark',
    hostEmoji: '🌬️',
    startTime: NOW + 48 * H,
    endTime: NOW + 49 * H,
    type: 'breathwork',
    maxParticipants: 50,
    participants: ['u1'],
    participantNames: ['Luna'],
    inviteCode: 'SEED04',
    isPrivate: false,
    coverEmoji: '💨',
    tags: ['oddech', 'relaks'],
    timezone: 'Europe/Warsaw',
    createdAt: NOW - 4 * H,
    status: 'upcoming',
  },
  {
    id: 'seed5',
    title: 'Sesja Wyroczni — Pytania i Odpowiedzi',
    description: 'Zadaj pytanie wyroczni. Każdy uczestnik otrzyma krótki przekaz podczas sesji.',
    hostId: 'host5',
    hostName: 'Mystic Zara',
    hostEmoji: '🔯',
    startTime: NOW - 15 * 60000,
    endTime: NOW + 45 * 60000,
    type: 'oracle',
    maxParticipants: 40,
    participants: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'],
    participantNames: ['Luna', 'Arion', 'Vera', 'Solaris', 'Celeste', 'Nova'],
    inviteCode: 'SEED05',
    isPrivate: false,
    coverEmoji: '🌟',
    tags: ['wyrocznia'],
    timezone: 'Europe/Warsaw',
    createdAt: NOW - 2 * H,
    status: 'live',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatEventTime(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (d.toDateString() === now.toDateString()) return `Dziś, ${hhmm}`;
  if (d.toDateString() === tomorrow.toDateString()) return `Jutro, ${hhmm}`;
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}, ${hhmm}`;
}

function formatDuration(startMs: number, endMs: number): string {
  const diffMin = Math.round((endMs - startMs) / 60000);
  if (diffMin < 60) return `${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function isToday(ms: number): boolean {
  return new Date(ms).toDateString() === new Date().toDateString();
}

function isThisWeek(ms: number): boolean {
  const now = Date.now();
  return ms > now && ms <= now + 7 * 24 * 3600000;
}

// ─── EventCard ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: CommunityEvent;
  isJoined: boolean;
  onJoin: (e: CommunityEvent) => void;
  onLeave: (e: CommunityEvent) => void;
  isLight: boolean;
  accentColor: string;
  index: number;
}

const EventCard = React.memo(function EventCard({
  event,
  isJoined,
  onJoin,
  onLeave,
  isLight,
  accentColor,
  index,
}: EventCardProps) {
  const { t } = useTranslation();
  const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.meeting;
  const tc = isLight ? '#1A1008' : '#F0ECE4';
  const sc = isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.94)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.18)' : 'rgba(255,255,255,0.10)';

  const isLive = event.status === 'live';
  const isFull = event.participants.length >= event.maxParticipants;
  const fillPct = Math.min(1, event.participants.length / Math.max(1, event.maxParticipants));

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()} style={{ marginBottom: 14 }}>
      <Pressable
        onPress={() => {
          HapticsService.impact('medium');
        }}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: cardBg, borderColor: cardBorder, opacity: pressed ? 0.92 : 1 },
        ]}
      >
        {/* Top gradient strip */}
        <LinearGradient
          colors={cfg.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardStrip}
        />

        <View style={styles.cardBody}>
          {/* Live badge */}
          {isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          )}

          {/* Header row */}
          <View style={styles.cardHeaderRow}>
            <LinearGradient
              colors={cfg.gradient}
              style={styles.coverEmojiBg}
            >
              <Text style={styles.coverEmoji}>{event.coverEmoji}</Text>
            </LinearGradient>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.cardTitle, { color: tc }]} numberOfLines={2}>
                {event.title}
              </Text>
              <View style={styles.cardMetaRow}>
                <Clock size={11} color={sc} />
                <Text style={[styles.cardMetaText, { color: sc }]}>
                  {' '}{formatEventTime(event.startTime)} · {formatDuration(event.startTime, event.endTime)}
                </Text>
              </View>
            </View>

            {event.isPrivate ? (
              <Lock size={14} color={sc} style={{ marginLeft: 8 }} />
            ) : (
              <Globe size={14} color={sc} style={{ marginLeft: 8 }} />
            )}
          </View>

          {/* Description */}
          {!!event.description && (
            <Text style={[styles.cardDesc, { color: sc }]} numberOfLines={2}>
              {event.description}
            </Text>
          )}

          {/* Type badge + host */}
          <View style={styles.cardTagRow}>
            <LinearGradient
              colors={[cfg.gradient[0] + '33', cfg.gradient[1] + '22']}
              style={styles.typeBadge}
            >
              <Text style={[styles.typeBadgeText, { color: cfg.gradient[0] }]}>
                {cfg.emoji} {cfg.label}
              </Text>
            </LinearGradient>
            <View style={styles.hostRow}>
              <View style={[styles.hostAvatar, { backgroundColor: cfg.gradient[0] + '33' }]}>
                <Text style={{ fontSize: 12 }}>{event.hostEmoji}</Text>
              </View>
              <Text style={[styles.hostName, { color: sc }]}>{event.hostName}</Text>
            </View>
          </View>

          {/* Participants bar */}
          <View style={styles.participantsRow}>
            <Users size={12} color={sc} />
            <Text style={[styles.participantText, { color: sc }]}>
              {' '}{event.participants.length}/{event.maxParticipants} {t('communityEvents.card.participants', 'uczestnikow')}
            </Text>
            <View style={styles.fillBarBg}>
              <View
                style={[
                  styles.fillBarFill,
                  { width: `${fillPct * 100}%`, backgroundColor: cfg.gradient[0] },
                ]}
              />
            </View>
          </View>

          {/* RSVP button */}
          <View style={styles.rsvpRow}>
            {isJoined ? (
              <Pressable
                onPress={() => {
                  HapticsService.impact('medium');
                  if (isLive) {
                    Alert.alert('Dołączanie do sesji', 'Funkcja wejścia live pojawi się wkrótce.');
                  } else {
                    onLeave(event);
                  }
                }}
                style={({ pressed }) => [
                  styles.rsvpBtn,
                  styles.rsvpBtnJoined,
                  { borderColor: cfg.gradient[0], opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Check size={14} color={cfg.gradient[0]} />
                <Text style={[styles.rsvpBtnText, { color: cfg.gradient[0] }]}>
                  {isLive ? t('communityEvents.card.enterNow', 'Wejdz teraz') : t('communityEvents.card.joined', 'Zapisany(a)')}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  HapticsService.impact('medium');
                  if (isFull) {
                    Alert.alert('Brak miejsc', 'To wydarzenie jest już pełne.');
                    return;
                  }
                  onJoin(event);
                }}
                style={({ pressed }) => [
                  styles.rsvpBtn,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <LinearGradient
                  colors={isFull ? ['#888', '#666'] : cfg.gradient}
                  style={styles.rsvpBtnGrad}
                >
                  <Text style={styles.rsvpBtnTextWhite}>
                    {isFull ? t('communityEvents.card.full', 'Brak miejsc') : isLive ? t('communityEvents.card.enterLive', '🔴 Wejdz Live') : t('communityEvents.card.join', 'Dolacz')}
                  </Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ─── CreateEventModal ─────────────────────────────────────────────────────────

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (eventId: string, code: string) => void;
  currentUser: any;
  isLight: boolean;
  accentColor: string;
}

const COVER_EMOJIS = ['🌕', '🔮', '🧘', '🕯️', '⭐', '🌿', '💨', '✨', '🌊', '🔯'];
const DURATIONS_MIN = [30, 60, 90, 120, 180];

const CreateEventModal = React.memo(function CreateEventModal({
  visible,
  onClose,
  onCreated,
  currentUser,
  isLight,
  accentColor,
}: CreateModalProps) {
  const { t } = useTranslation();
  const tc = isLight ? '#1A1008' : '#F0ECE4';
  const sc = isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.55)';
  const inputBg = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.07)';
  const inputBorder = isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.14)';
  const modalBg = isLight ? '#FAF7F3' : '#16101E';
  const sectionBg = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverEmoji, setCoverEmoji] = useState('🌕');
  const [type, setType] = useState<CommunityEvent['type']>('meditation');
  const [dateStr, setDateStr] = useState('');
  const [durationMin, setDurationMin] = useState(60);
  const [maxParticipants, setMaxParticipants] = useState('50');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Brak tytułu', 'Podaj tytuł wydarzenia.');
      return;
    }
    if (!currentUser) {
      Alert.alert('Błąd', 'Musisz być zalogowany(a).');
      return;
    }

    // Parse date string "DD.MM HH:MM"
    let startTime = Date.now() + 3600000; // default: 1h from now
    if (dateStr.trim()) {
      const [datePart, timePart] = dateStr.trim().split(' ');
      if (datePart && timePart) {
        const [dd, mm] = datePart.split('.').map(Number);
        const [hh, mn] = timePart.split(':').map(Number);
        if (dd && mm && !isNaN(hh) && !isNaN(mn)) {
          const year = new Date().getFullYear();
          const parsed = new Date(year, mm - 1, dd, hh, mn);
          if (!isNaN(parsed.getTime())) startTime = parsed.getTime();
        }
      }
    }

    const endTime = startTime + durationMin * 60000;
    const max = parseInt(maxParticipants, 10) || 50;

    setLoading(true);
    try {
      const { eventId, inviteCode } = await EventsService.createEvent({
        title: title.trim(),
        description: description.trim(),
        hostId: currentUser.uid,
        hostName: currentUser.displayName ?? 'Użytkownik',
        hostEmoji: currentUser.avatarEmoji ?? '✨',
        startTime,
        endTime,
        type,
        maxParticipants: max,
        isPrivate,
        coverEmoji,
        tags: [],
        timezone: 'Europe/Warsaw',
      });
      HapticsService.notify();
      onCreated(eventId, inviteCode);
      // Reset form
      setTitle('');
      setDescription('');
      setCoverEmoji('🌕');
      setType('meditation');
      setDateStr('');
      setDurationMin(60);
      setMaxParticipants('50');
      setIsPrivate(false);
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się stworzyć wydarzenia. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [styles.formInput, { backgroundColor: inputBg, borderColor: inputBorder, color: tc }];
  const labelStyle = [styles.formLabel, { color: sc }];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalRoot, { backgroundColor: modalBg }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: inputBorder }]}>
          <Text style={[styles.modalTitle, { color: tc }]}>{t('communityEvents.modal.newEvent', 'Nowe Wydarzenie')}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <X size={22} color={tc} />
          </Pressable>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ padding: P, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <Text style={labelStyle}>{t('communityEvents.modal.titleLabel', 'Tytul *')}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('communityEvents.modal.titlePlaceholder', 'Nazwa wydarzenia...')}
              placeholderTextColor={sc}
              style={inputStyle}
              maxLength={80}
            />

            {/* Description */}
            <Text style={[labelStyle, { marginTop: 14 }]}>{t('communityEvents.modal.descLabel', 'Opis')}</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t('communityEvents.modal.descPlaceholder', 'Krotki opis czego dotyczy spotkanie...')}
              placeholderTextColor={sc}
              style={[inputStyle, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
              multiline
              maxLength={300}
            />

            {/* Cover emoji */}
            <Text style={[labelStyle, { marginTop: 14 }]}>{t('communityEvents.modal.coverEmojiLabel', 'Emoji okladki')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {COVER_EMOJIS.map((em) => (
                <Pressable
                  key={em}
                  onPress={() => { HapticsService.impact('medium'); setCoverEmoji(em); }}
                  style={[
                    styles.emojiPickerItem,
                    coverEmoji === em && { borderColor: accentColor, borderWidth: 2, backgroundColor: accentColor + '22' },
                    { borderColor: inputBorder },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{em}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Type selector */}
            <Text style={[labelStyle, { marginTop: 14 }]}>{t('communityEvents.modal.typeLabel', 'Typ')}</Text>
            <View style={styles.typeGrid}>
              {(Object.entries(TYPE_CONFIG) as Array<[CommunityEvent['type'], typeof TYPE_CONFIG['meeting']]>).map(([key, cfg]) => {
                const selected = type === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => { HapticsService.impact('medium'); setType(key); }}
                    style={[
                      styles.typeTile,
                      { backgroundColor: sectionBg, borderColor: selected ? cfg.gradient[0] : inputBorder },
                      selected && { backgroundColor: cfg.gradient[0] + '22' },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{cfg.emoji}</Text>
                    <Text style={[styles.typeTileLabel, { color: selected ? cfg.gradient[0] : sc }]}>
                      {cfg.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Date/time */}
            <Text style={[labelStyle, { marginTop: 14 }]}>{t('communityEvents.modal.dateLabel', 'Data i czas (DD.MM HH:MM)')}</Text>
            <TextInput
              value={dateStr}
              onChangeText={setDateStr}
              placeholder={t('communityEvents.modal.datePlaceholder', 'np. 25.04 20:00')}
              placeholderTextColor={sc}
              style={inputStyle}
              keyboardType="numbers-and-punctuation"
              maxLength={11}
            />

            {/* Duration */}
            <Text style={[labelStyle, { marginTop: 14 }]}>{t('communityEvents.modal.durationLabel', 'Czas trwania')}</Text>
            <View style={styles.durationRow}>
              {DURATIONS_MIN.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => { HapticsService.impact('medium'); setDurationMin(d); }}
                  style={[
                    styles.durationChip,
                    { borderColor: durationMin === d ? accentColor : inputBorder },
                    durationMin === d && { backgroundColor: accentColor + '22' },
                  ]}
                >
                  <Text style={[styles.durationChipText, { color: durationMin === d ? accentColor : sc }]}>
                    {d < 60 ? `${d}min` : d === 60 ? '1h' : d === 90 ? '1,5h' : `${d / 60}h`}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Max participants */}
            <Text style={[labelStyle, { marginTop: 14 }]}>{t('communityEvents.modal.maxParticipantsLabel', 'Maks. uczestnikow')}</Text>
            <TextInput
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              placeholder="50"
              placeholderTextColor={sc}
              style={[inputStyle, { width: 100 }]}
              keyboardType="number-pad"
              maxLength={4}
            />

            {/* Private toggle */}
            <View style={[styles.toggleRow, { marginTop: 18 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: tc }]}>{t('communityEvents.modal.privateLabel', 'Prywatne wydarzenie')}</Text>
                <Text style={[styles.toggleSubLabel, { color: sc }]}>{t('communityEvents.modal.privateSubLabel', 'Tylko przez kod zaproszenia')}</Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={(v) => { HapticsService.impact('medium'); setIsPrivate(v); }}
                trackColor={{ false: inputBorder, true: accentColor + '88' }}
                thumbColor={isPrivate ? accentColor : '#ccc'}
              />
            </View>

            {/* Create button */}
            <Pressable
              onPress={handleCreate}
              disabled={loading}
              style={({ pressed }) => [{ marginTop: 28, opacity: loading || pressed ? 0.75 : 1 }]}
            >
              <LinearGradient
                colors={[accentColor, accentColor + 'CC']}
                style={styles.createBtn}
              >
                <Sparkles size={16} color="#FFF" />
                <Text style={styles.createBtnText}>
                  {loading ? t('communityEvents.modal.creating', 'Tworze...') : t('communityEvents.modal.createBtn', 'Utworz wydarzenie')}
                </Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});

// ─── JoinByCodeModal ──────────────────────────────────────────────────────────

interface JoinCodeModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  isLight: boolean;
  accentColor: string;
  onJoined: (eventTitle: string) => void;
}

const JoinByCodeModal = React.memo(function JoinByCodeModal({
  visible,
  onClose,
  currentUser,
  isLight,
  accentColor,
  onJoined,
}: JoinCodeModalProps) {
  const { t } = useTranslation();
  const tc = isLight ? '#1A1008' : '#F0ECE4';
  const sc = isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.55)';
  const inputBg = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.07)';
  const inputBorder = isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.14)';
  const modalBg = isLight ? '#FAF7F3' : '#16101E';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (code.trim().length < 4) {
      Alert.alert('Błąd', 'Podaj prawidłowy kod (min. 4 znaki).');
      return;
    }
    if (!currentUser) {
      Alert.alert('Błąd', 'Musisz być zalogowany(a).');
      return;
    }
    setLoading(true);
    try {
      const result = await EventsService.joinByCode(code.trim(), {
        uid: currentUser.uid,
        displayName: currentUser.displayName ?? 'Użytkownik',
      });
      if (result.success && result.eventTitle) {
        HapticsService.notify();
        onJoined(result.eventTitle);
        setCode('');
        onClose();
      } else {
        Alert.alert('Nie znaleziono', 'Kod jest nieprawidłowy lub wydarzenie nie istnieje.');
      }
    } catch {
      Alert.alert('Błąd', 'Nie udało się dołączyć. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.codeModalBox, { backgroundColor: modalBg }]}>
          <Text style={[styles.codeModalTitle, { color: tc }]}>{t('communityEvents.joinModal.title', 'Dolacz przez kod')}</Text>
          <Text style={[styles.codeModalSub, { color: sc }]}>
            {t('communityEvents.joinModal.subtitle', 'Wpisz 6-znakowy kod zaproszenia')}
          </Text>
          <View style={styles.codeInputRow}>
            <Hash size={16} color={sc} />
            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              placeholder="ABCDEF"
              placeholderTextColor={sc}
              style={[
                styles.codeInput,
                { backgroundColor: inputBg, borderColor: inputBorder, color: tc },
              ]}
              autoCapitalize="characters"
              maxLength={6}
              autoCorrect={false}
            />
          </View>
          <Pressable
            onPress={handleJoin}
            disabled={loading}
            style={({ pressed }) => [{ marginTop: 16, opacity: loading || pressed ? 0.75 : 1 }]}
          >
            <LinearGradient colors={[accentColor, accentColor + 'BB']} style={styles.codeJoinBtn}>
              <Text style={styles.codeJoinBtnText}>{loading ? t('communityEvents.joinModal.joining', 'Dolaczam...') : t('communityEvents.joinModal.joinBtn', 'Dolacz')}</Text>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export const CommunityEventsScreen = ({ navigation }: { navigation: any }) => {
  const { currentTheme, isLight } = useTheme();
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.currentUser);
  const insets = useSafeAreaInsets();

  const tc = isLight ? '#1A1008' : '#F0ECE4';
  const sc = isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.55)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.14)' : 'rgba(255,255,255,0.08)';
  const headerBg = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.4)';
  const accentColor = currentTheme.accent ?? '#8B5CF6';

  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [myEvents, setMyEvents] = useState<CommunityEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'mine' | 'past'>('upcoming');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const unsubRef = useRef<(() => void) | null>(null);

  // ─── Firebase subscription ────────────────────────────────────────────────

  useEffect(() => {
    // Sync statuses on mount
    EventsService.syncEventStatuses().catch(() => {});

    // Listen to upcoming events
    const unsub = EventsService.listenToUpcomingEvents((fbEvents) => {
      if (fbEvents.length > 0) {
        setEvents(fbEvents);
      } else {
        setEvents(SEED_EVENTS);
      }
    });
    unsubRef.current = unsub;

    // Fetch my events if logged in
    if (currentUser?.uid) {
      EventsService.getMyEvents(currentUser.uid)
        .then((mine) => setMyEvents(mine))
        .catch(() => {});
    }

    return () => {
      unsubRef.current?.();
    };
  }, [currentUser?.uid]);

  // ─── Computed ─────────────────────────────────────────────────────────────

  const joinedIds = useMemo(
    () => new Set(myEvents.map((e) => e.id)),
    [myEvents],
  );

  const filteredEvents = useMemo(() => {
    let base = events;
    if (typeFilter !== 'all') base = base.filter((e) => e.type === typeFilter);
    if (activeTab === 'mine') base = base.filter((e) => joinedIds.has(e.id));
    if (activeTab === 'past') base = base.filter((e) => e.status === 'ended');
    return base;
  }, [events, typeFilter, activeTab, joinedIds]);

  const todayEvents = useMemo(
    () => filteredEvents.filter((e) => isToday(e.startTime) || e.status === 'live'),
    [filteredEvents],
  );

  const weekEvents = useMemo(
    () =>
      filteredEvents.filter(
        (e) => isThisWeek(e.startTime) && !isToday(e.startTime) && e.status !== 'live',
      ),
    [filteredEvents],
  );

  const laterEvents = useMemo(
    () =>
      filteredEvents.filter(
        (e) =>
          !isToday(e.startTime) &&
          !isThisWeek(e.startTime) &&
          e.status !== 'live' &&
          e.status !== 'ended',
      ),
    [filteredEvents],
  );

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleJoin = useCallback(
    async (event: CommunityEvent) => {
      if (!currentUser) {
        Alert.alert('Zaloguj się', 'Musisz być zalogowany(a), aby dołączyć do wydarzenia.');
        return;
      }
      try {
        await EventsService.joinEvent(event.id, {
          uid: currentUser.uid,
          displayName: currentUser.displayName ?? 'Użytkownik',
        });
        setMyEvents((prev) => (prev.some((e) => e.id === event.id) ? prev : [...prev, event]));
        HapticsService.notify();
        Alert.alert('Zapisano! 🎉', `Dołączyłeś(aś) do: ${event.title}`);
      } catch {
        Alert.alert('Błąd', 'Nie udało się dołączyć do wydarzenia.');
      }
    },
    [currentUser],
  );

  const handleLeave = useCallback(
    async (event: CommunityEvent) => {
      if (!currentUser) return;
      try {
        await EventsService.leaveEvent(event.id, currentUser.uid);
        setMyEvents((prev) => prev.filter((e) => e.id !== event.id));
        HapticsService.impact('medium');
      } catch {
        Alert.alert('Błąd', 'Nie udało się opuścić wydarzenia.');
      }
    },
    [currentUser],
  );

  const handleCreated = useCallback((eventId: string, code: string) => {
    setShowCreateModal(false);
    Alert.alert(
      '🎉 Wydarzenie stworzone!',
      `Kod zaproszenia: ${code}\nUdostępnij go znajomym aby dołączyli.`,
      [
        {
          text: 'Skopiuj kod',
          onPress: () => {
            // Clipboard would go here
            Alert.alert('Skopiowano', code);
          },
        },
        { text: 'OK' },
      ],
    );
    // Refresh my events
    if (currentUser?.uid) {
      EventsService.getMyEvents(currentUser.uid)
        .then(setMyEvents)
        .catch(() => {});
    }
  }, [currentUser?.uid]);

  const handleJoinedByCode = useCallback((eventTitle: string) => {
    Alert.alert('Dołączono! 🎉', `Zostałeś(aś) dodany(a) do: ${eventTitle}`);
    if (currentUser?.uid) {
      EventsService.getMyEvents(currentUser.uid)
        .then(setMyEvents)
        .catch(() => {});
    }
  }, [currentUser?.uid]);

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderSection = (title: string, sectionEvents: CommunityEvent[], startIndex = 0) => {
    if (sectionEvents.length === 0) return null;
    return (
      <View style={{ marginTop: 20 }}>
        <Text style={[styles.sectionLabel, { color: sc }]}>{title}</Text>
        {sectionEvents.map((event, i) => (
          <EventCard
            key={event.id}
            event={event}
            isJoined={joinedIds.has(event.id)}
            onJoin={handleJoin}
            onLeave={handleLeave}
            isLight={isLight}
            accentColor={accentColor}
            index={startIndex + i}
          />
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>📅</Text>
      <Text style={[styles.emptyTitle, { color: tc }]}>{t('communityEvents.empty.title', 'Brak wydarzen')}</Text>
      <Text style={[styles.emptySubtitle, { color: sc }]}>
        {activeTab === 'mine'
          ? t('communityEvents.empty.mine', 'Nie jestes jeszcze zapisany(a) na zadne wydarzenie.')
          : t('communityEvents.empty.upcoming', 'Nie ma nadchodzacych wydarzen w tej kategorii.')}
      </Text>
    </View>
  );

  // ─── Header pulse animation ────────────────────────────────────────────────

  const headerOpacity = useSharedValue(0);
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500 });
  }, []);
  const headerAnimStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));

  const allEmpty =
    filteredEvents.length === 0 ||
    (todayEvents.length === 0 && weekEvents.length === 0 && laterEvents.length === 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }} edges={['top']}>
      <LinearGradient
        colors={[
          currentTheme.background,
          isLight ? '#F0EBE3' : '#0D0818',
          currentTheme.background,
        ]}
        style={StyleSheet.absoluteFill}
      />

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInUp.duration(400)}
        style={[styles.header, { paddingTop: 8, borderBottomColor: cardBorder }]}
      >
        <Pressable
          onPress={() => goBackOrToMainTab(navigation, 'Social')}
          hitSlop={12}
          style={styles.backBtn}
        >
          <ChevronLeft size={22} color={tc} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.headerTitle, { color: tc }]}>{t('communityEvents.title', 'Kalendarz Wydarzen')}</Text>
          <Text style={[styles.headerSubtitle, { color: sc }]}>
            {t('communityEvents.upcomingCount', '{{n}} nadchodzacych', { n: events.length })}
          </Text>
        </View>
        <Pressable
          onPress={() => { HapticsService.impact('medium'); setShowJoinModal(true); }}
          hitSlop={12}
          style={[styles.headerIconBtn, { backgroundColor: isLight ? 'rgba(139,100,42,0.10)' : 'rgba(255,255,255,0.08)' }]}
        >
          <Hash size={18} color={accentColor} />
        </Pressable>
        <Pressable
          onPress={() => { HapticsService.impact('medium'); setShowCreateModal(true); }}
          hitSlop={12}
          style={[styles.headerIconBtn, { backgroundColor: accentColor + '22', marginLeft: 8 }]}
        >
          <Plus size={18} color={accentColor} />
        </Pressable>
      </Animated.View>

      {/* ─── Tab bar (Upcoming / Mine / Past) ──────────────────────── */}
      <Animated.View entering={FadeInDown.delay(80).duration(350)} style={[styles.tabBar, { borderBottomColor: cardBorder }]}>
        {(['upcoming', 'mine', 'past'] as const).map((tab) => {
          const labels = {
            upcoming: t('communityEvents.tab.upcoming', 'Nadchodzace'),
            mine: t('communityEvents.tab.mine', 'Moje'),
            past: t('communityEvents.tab.past', 'Archiwum'),
          };
          const active = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => { HapticsService.impact('medium'); setActiveTab(tab); }}
              style={styles.tabItem}
            >
              <Text style={[styles.tabLabel, { color: active ? accentColor : sc }]}>
                {labels[tab]}
              </Text>
              {active && <View style={[styles.tabUnderline, { backgroundColor: accentColor }]} />}
            </Pressable>
          );
        })}
      </Animated.View>

      {/* ─── Type filter chips ───────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(140).duration(350)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: P, paddingVertical: 10, gap: 8 }}
        >
          {TYPE_FILTER_TABS.map(({ key, label }) => {
            const active = typeFilter === key;
            const cfg = key !== 'all' ? TYPE_CONFIG[key as CommunityEvent['type']] : null;
            const filterLabelMap: Record<string, string> = {
              all: t('communityEvents.filter.all', 'Wszystkie'),
              meditation: t('communityEvents.filter.meditation', 'Medytacja'),
              ritual: t('communityEvents.filter.ritual', 'Rytual'),
              tarot: t('communityEvents.filter.tarot', 'Tarot'),
              meeting: t('communityEvents.filter.meeting', 'Spotkanie'),
            };
            const displayLabel = filterLabelMap[key] ?? label;
            return (
              <Pressable
                key={key}
                onPress={() => { HapticsService.impact('medium'); setTypeFilter(key); }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active
                      ? (cfg ? cfg.gradient[0] + '22' : accentColor + '22')
                      : (isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.06)'),
                    borderColor: active
                      ? (cfg ? cfg.gradient[0] : accentColor)
                      : cardBorder,
                  },
                ]}
              >
                {cfg && <Text style={{ fontSize: 12, marginRight: 4 }}>{cfg.emoji}</Text>}
                <Text style={[
                  styles.filterChipText,
                  { color: active ? (cfg ? cfg.gradient[0] : accentColor) : sc },
                ]}>
                  {displayLabel}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* ─── Content ─────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: P, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {allEmpty ? (
          renderEmptyState()
        ) : (
          <>
            {renderSection(t('communityEvents.section.today', 'DZIS'), todayEvents, 0)}
            {renderSection(t('communityEvents.section.thisWeek', 'TEN TYDZIEN'), weekEvents, todayEvents.length)}
            {renderSection(t('communityEvents.section.later', 'POZNIEJ'), laterEvents, todayEvents.length + weekEvents.length)}
            {activeTab === 'mine' && filteredEvents.length > 0 && todayEvents.length === 0 && weekEvents.length === 0 && laterEvents.length === 0 &&
              filteredEvents.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isJoined={joinedIds.has(event.id)}
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                  isLight={isLight}
                  accentColor={accentColor}
                  index={i}
                />
              ))
            }
          </>
        )}
        <EndOfContentSpacer size="standard" />
      </ScrollView>

      {/* ─── Modals ───────────────────────────────────────────────────── */}
      <CreateEventModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreated}
        currentUser={currentUser}
        isLight={isLight}
        accentColor={accentColor}
      />

      <JoinByCodeModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        currentUser={currentUser}
        isLight={isLight}
        accentColor={accentColor}
        onJoined={handleJoinedByCode}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: P,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: P,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 24,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },

  // Filter chips
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 2,
  },

  // Event card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardStrip: {
    height: 4,
    width: '100%',
  },
  cardBody: {
    padding: 14,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    marginRight: 4,
  },
  liveBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  coverEmojiBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverEmoji: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  cardMetaText: {
    fontSize: 12,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  cardTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  hostAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  hostName: {
    fontSize: 12,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  participantText: {
    fontSize: 12,
    flex: 1,
  },
  fillBarBg: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.2)',
    overflow: 'hidden',
  },
  fillBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  rsvpRow: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  rsvpBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  rsvpBtnJoined: {
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 6,
  },
  rsvpBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  rsvpBtnGrad: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  rsvpBtnTextWhite: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: P,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modal root
  modalRoot: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: P,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Form
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  formInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 44,
  },

  // Emoji picker
  emojiPickerItem: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  // Type grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeTile: {
    width: (SW - P * 2 - 24) / 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  typeTileLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Duration row
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  durationChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  durationChipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },

  // Create button
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  createBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Join code modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: P,
  },
  codeModalBox: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
  },
  codeModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  codeModalSub: {
    fontSize: 13,
    marginBottom: 18,
  },
  codeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
  },
  codeJoinBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  codeJoinBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
