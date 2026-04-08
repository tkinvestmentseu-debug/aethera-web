// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeInDown, FadeInUp,
  useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withSpring, withTiming, cancelAnimation,
} from 'react-native-reanimated';
import {
  ChevronLeft, Flame, Globe2, Heart, MoonStar,
  Music, Pause, Play, Send, Users, Volume2, VolumeX,
  Wind, Zap, Star, CheckCircle2, Clock, Eye, Sparkles,
  MessageSquare, X,
} from 'lucide-react-native';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { AudioService } from '../core/services/audio.service';
import { HapticsService } from '../core/services/haptics.service';
import { TTSService } from '../core/services/tts.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW, height: SH } = Dimensions.get('window');

// ��� Live chat messages that stream in ���������������������������������������
const LIVE_MESSAGES = [
  { id: 'm1', author: 'Luna V.', flag: '????', text: 'Czuj� ogromn� energi� ju� teraz ?', color: '#A78BFA' },
  { id: 'm2', author: 'Orion K.', flag: '????', text: 'Przyszed�em z intencj� uzdrowienia. Jestem gotowy.', color: '#6366F1' },
  { id: 'm3', author: 'Aria Sol', flag: '????', text: '?? Kocham t� wsp�lnot�. Razem jeste�my silniejsi.', color: '#F59E0B' },
  { id: 'm4', author: 'Vera M.', flag: '????', text: 'Oddycham razem z wami. Spok�j...' , color: '#10B981' },
  { id: 'm5', author: 'Sol R.', flag: '????', text: 'To m�j trzeci rytua� z t� grup� ?? Niesamowite.', color: '#EC4899' },
  { id: 'm6', author: 'Mira T.', flag: '????', text: 'Czuj� jak napi�cie odp�ywa z mojego cia�a.', color: '#60A5FA' },
  { id: 'm7', author: 'Ember K.', flag: '????', text: '? Manifest: przyci�gam to, czego naprawd� pragn�.', color: '#F97316' },
  { id: 'm8', author: 'Nox A.', flag: '????', text: 'Dzi�kuj� za t� przestrze�. �zy oczyszczenia ??', color: '#8B5CF6' },
  { id: 'm9', author: 'Kira B.', flag: '????', text: 'Prowadz�ca jest niesamowita! G��boko dotykam centrum.', color: '#34D399' },
  { id: 'm10', author: 'Zara W.', flag: '????', text: '?? Widz� pi�kne obrazy podczas wizualizacji...', color: '#FB7185' },
  { id: 'm11', author: 'Daan H.', flag: '????', text: 'Intencja: pok�j i jasno�� umys�u. Dzi�kuj�', color: '#6366F1' },
  { id: 'm12', author: 'Inara P.', flag: '????', text: '��cz� si� z wami wszystkimi ?? Ogromna mi�o��.', color: '#EC4899' },
];

// ��� Ritual phase steps �������������������������������������������������������
const RITUAL_PHASES: Record<string, { label: string; color: string; steps: string[] }> = {
  'KSIʯYC': {
    label: 'Ksi�ycowy Rytua� Uwalniania',
    color: '#818CF8',
    steps: [
      'Zapal �wiec� i po�� d�onie na sercu.',
      'We� trzy g��bokie oddechy. Poczuj ci�ar nocy.',
      'Napisz na kartce to, czego chcesz si� uwolni�.',
      'Powiedz g�o�no lub w ciszy: �Pozwalam, by to odesz�o."',
      'Wyobra� sobie jak ksi�yc poch�ania to, co puszczasz.',
      'Pozosta� w wdzi�czno�ci przez chwil� ciszy.',
    ],
  },
  'OGIE�': {
    label: 'Ogniste Oczyszczanie',
    color: '#F97316',
    steps: [
      'Usi�d� stabilnie. Poczuj �ar ognia w swojej klatce piersiowej.',
      'Z ka�dym wydechem wyobra� sobie p�omie� oczyszczaj�cy twoje pole.',
      'Nazwij to, co chcesz spali� � l�k, blokad�, win�.',
      'Oddychaj szybko i rytmicznie przez nos (3 cykle po 10 oddech�w).',
      'W ciszy poczuj woln�, oczyszczon� przestrze� wewn�trz.',
      'Zamknij rytua� s�owami: �Jestem wolny/a. Jestem nowy/a."',
    ],
  },
  'CZAKRY': {
    label: 'Aktywacja Czakry',
    color: '#10B981',
    steps: [
      'Po�� d�onie na centrum klatki piersiowej (czakra serca).',
      'Wyobra� sobie zielone �wiat�o rozszerzaj�ce si� z ka�dym wdechem.',
      'Powtarzaj mantr�: �YAM" � d�wi�k czakry serca.',
      'Poczuj jak serce otwiera si� jak kwiat.',
      'Wy�lij energi� do osoby, kt�ra potrzebuje mi�o�ci.',
      'Pozosta� w rozszerzonym polu mi�o�ci przez 3 minuty.',
    ],
  },
  'MEDYTACJA': {
    label: 'G��boka Medytacja Grupowa',
    color: '#6366F1',
    steps: [
      'Znajd� stabiln� pozycj�. Zamknij oczy.',
      'Pozw�l my�lom przep�yn�� bez anga�owania si� w nie.',
      'Skup uwag� na oddechu � sam oddech, nic wi�cej.',
      'Wejd� g��biej. Twoje cia�o staje si� coraz ci�sze.',
      'W polu zbiorowej ciszy � odpocznij. Po prostu b�d�.',
      'Powoli wracaj. Porusz palcami. Podzi�kuj ciszy.',
    ],
  },
};

const DEFAULT_PHASE = {
  label: 'Zbiorowy Rytua�',
  color: '#A78BFA',
  steps: [
    'Usi�d� wygodnie i zamknij oczy.',
    'Po��cz si� z intencj� dzisiejszego rytua�u.',
    'Oddychaj �wiadomie i poczuj zbiorow� energi�.',
    'Wizualizuj swoj� intencj� jako jasne �wiat�o.',
    'Razem wznie�my t� energi� ku spe�nieniu.',
    'Zako�cz w wdzi�czno�ci i otwarto�ci.',
  ],
};

const MUSIC_OPTS = [
  { id: 'ritual', label: 'Rytua�', emoji: '???', color: '#F59E0B' },
  { id: 'forest', label: 'Las', emoji: '??', color: '#34D399' },
  { id: 'waves', label: 'Fale', emoji: '??', color: '#60A5FA' },
  { id: 'deepMeditation', label: 'G��boka', emoji: '??', color: '#8B5CF6' },
  { id: 'voxscape', label: 'G�osy', emoji: '?', color: '#EC4899' },
];

// ��� Main Screen ��������������������������������������������������������������
export const RitualSessionScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const { currentTheme, isLight } = useTheme();
  const { ritual } = route?.params ?? {};
  const insets = useSafeAreaInsets();
  const tc = isLight ? '#120B1E' : '#F5F0FF';
  const sc = isLight ? 'rgba(18,11,30,0.55)' : 'rgba(245,240,255,0.55)';
  const cb = isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.06)';
  const cbr = isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.12)';

  const phase = RITUAL_PHASES[ritual?.type] ?? DEFAULT_PHASE;
  const ACCENT = phase.color;

  // �� State ������������������������������������������������������������������
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState((ritual?.participants ?? 120) as number);
  const [elapsed, setElapsed] = useState(0);
  const [totalSecs] = useState(ritual?.live ? 600 : 900); // 10 or 15 min
  const [stepsDone, setStepsDone] = useState<number[]>([]);
  const [messages, setMessages] = useState(LIVE_MESSAGES.slice(0, 3));
  const [chatInput, setChatInput] = useState('');
  const [selectedMusic, setSelectedMusic] = useState('ritual');
  const [musicMuted, setMusicMuted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showIntention, setShowIntention] = useState(false);
  const [intention, setIntention] = useState('');
  const [intentionSent, setIntentionSent] = useState(false);
  const [reactions, setReactions] = useState({ love: 234, light: 189, fire: 156 });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const msgIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const chatScrollRef = useRef<ScrollView>(null);
  const msgIndex = useRef(3);

  // �� Floating chat drawer state ���������������������������������������������
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [drawerInput, setDrawerInput] = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [drawerMessages, setDrawerMessages] = useState([
    { id: 'dm1', author: 'Luna V.', initials: 'L', avatarColor: '#8B5CF6', text: 'Czuj� niezwyk�� energi� ju� teraz ?', time: 'teraz', isOwn: false },
    { id: 'dm2', author: 'Orion K.', initials: 'O', avatarColor: '#6366F1', text: 'Przy��czam si� z intencj� uzdrowienia ??', time: '1 min', isOwn: false },
    { id: 'dm3', author: 'Aria Sol', initials: 'A', avatarColor: '#F59E0B', text: 'Razem tworzymy silne pole ??', time: '2 min', isOwn: false },
    { id: 'dm4', author: 'Vera M.', initials: 'V', avatarColor: '#10B981', text: 'Spok�j i wdzi�czno�� ??', time: '3 min', isOwn: false },
  ]);
  const drawerScrollRef = useRef<ScrollView>(null);

  const QUICK_EMOJIS = ['??', '?', '??', '??', '??', '??', '?', '???'];

  const chatTranslateY = useSharedValue(SH);
  const chatOverlayOpacity = useSharedValue(0);

  const openChatDrawer = () => {
    setChatDrawerOpen(true);
    chatTranslateY.value = withSpring(0, { damping: 22, stiffness: 160 });
    chatOverlayOpacity.value = withTiming(1, { duration: 250 });
    HapticsService.impact('light');
  };

  const closeChatDrawer = () => {
    chatTranslateY.value = withSpring(SH * 0.45, { damping: 22, stiffness: 160 });
    chatOverlayOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => setChatDrawerOpen(false), 280);
    HapticsService.impact('light');
  };

  const sendDrawerMessage = () => {
    if (!drawerInput.trim()) return;
    const msg = {
      id: `dm_user_${Date.now()}`,
      author: 'Ty',
      initials: 'T',
      avatarColor: ACCENT,
      text: drawerInput.trim(),
      time: 'teraz',
      isOwn: true,
    };
    setDrawerMessages(prev => [...prev, msg]);
    setDrawerInput('');
    setEmojiPickerOpen(false);
    HapticsService.impact('light');
    setTimeout(() => drawerScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendQuickEmoji = (emoji: string) => {
    const msg = {
      id: `dm_emoji_${Date.now()}`,
      author: 'Ty',
      initials: 'T',
      avatarColor: ACCENT,
      text: emoji,
      time: 'teraz',
      isOwn: true,
    };
    setDrawerMessages(prev => [...prev, msg]);
    setEmojiPickerOpen(false);
    HapticsService.impact('light');
    setTimeout(() => drawerScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const chatDrawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chatTranslateY.value }],
  }));

  const chatOverlayStyle = useAnimatedStyle(() => ({
    opacity: chatOverlayOpacity.value,
  }));

  // �� Animations �������������������������������������������������������������
  const pulseV = useSharedValue(0.96);
  const ringV = useSharedValue(0.15);
  const orbGlowV = useSharedValue(0.6);

  useEffect(() => {
    pulseV.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 2800 }), withTiming(0.96, { duration: 2800 })),
      -1, false,
    );
    ringV.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 3200 }), withTiming(0.15, { duration: 3200 })),
      -1, false,
    );
    orbGlowV.value = withRepeat(
      withSequence(withTiming(1, { duration: 2000 }), withTiming(0.55, { duration: 2000 })),
      -1, false,
    );
    return () => {
      cancelAnimation(pulseV);
      cancelAnimation(ringV);
      cancelAnimation(orbGlowV);
    };
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseV.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ringV.value }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: orbGlowV.value }));

  // �� Session timer ����������������������������������������������������������
  const startSession = useCallback(() => {
    setJoined(true);
    HapticsService.notify();

    // Play music
    if (!musicMuted) AudioService.playAmbientForSession(selectedMusic as any);

    // TTS intro
    setTimeout(() => {
      TTSService.speak(`Witaj w rytuale: ${phase.label}. Jeste�my razem. Zacznijmy.`);
    }, 800);

    // Session timer
    intervalRef.current = setInterval(() => {
      setElapsed(v => {
        if (v + 1 >= totalSecs) {
          endSession();
          return totalSecs;
        }
        return v + 1;
      });
      // Slowly add participants
      if (Math.random() < 0.08) setParticipants(p => p + Math.ceil(Math.random() * 3));
    }, 1000);

    // Stream live messages
    msgIntervalRef.current = setInterval(() => {
      if (msgIndex.current < LIVE_MESSAGES.length) {
        setMessages(prev => [...prev, LIVE_MESSAGES[msgIndex.current]]);
        msgIndex.current += 1;
        setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    }, 4500);
  }, [musicMuted, selectedMusic, phase.label, totalSecs]);

  const theme = currentTheme;

  const endSession = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (msgIntervalRef.current) { clearInterval(msgIntervalRef.current); msgIntervalRef.current = null; }
    setSessionEnded(true);
    setJoined(false);
    AudioService.pauseAmbientSound();
    TTSService.speak('Rytua� zako�czony. Zabierz ze sob� t� energi�. Dzi�kuj�, �e by�e� z nami.');
    HapticsService.notify();
  }, []);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
    AudioService.pauseAmbientSound();
    void TTSService.stop();
  }, []);

  const toggleMute = () => {
    const next = !musicMuted;
    setMusicMuted(next);
    if (next) AudioService.pauseAmbientSound();
    else if (joined) AudioService.playAmbientForSession(selectedMusic as any);
    HapticsService.impact('light');
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = {
      id: `user_${Date.now()}`,
      author: 'Ty',
      flag: '????',
      text: chatInput.trim(),
      color: ACCENT,
      isOwn: true,
    };
    setMessages(prev => [...prev, msg]);
    setChatInput('');
    HapticsService.impact('light');
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const toggleStep = (i: number) => {
    HapticsService.selection();
    setStepsDone(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i],
    );
  };

  const addReaction = (key: keyof typeof reactions) => {
    setReactions(r => ({ ...r, [key]: r[key] + 1 }));
    HapticsService.impact('light');
  };

  const progress = Math.min(elapsed / totalSecs, 1);
  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');
  const remaining = totalSecs - elapsed;
  const remMins = Math.floor(remaining / 60).toString().padStart(2, '0');
  const remSecs = (remaining % 60).toString().padStart(2, '0');

  const ICON_MAP: Record<string, React.ComponentType<any>> = {
    MoonStar, Flame, Zap, Globe2, Sparkles, Wind, Heart, Star,
  };
  const Icon = (ritual?.iconName ? ICON_MAP[ritual.iconName] : undefined) ?? ritual?.icon ?? Sparkles;

  return (
<View style={{ flex: 1, backgroundColor: theme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <LinearGradient
        colors={isLight
          ? [`${ACCENT}22`, `${ACCENT}08`, theme.background]
          : [`${ACCENT}40`, `${ACCENT}14`, theme.background]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* �� Header ����������������������������������������������������������� */}
      <View style={styles.header}>
        <Pressable onPress={() => { AudioService.pauseAmbientSound(); void TTSService.stop(); navigation.goBack(); }} hitSlop={14}>
          <ChevronLeft color={tc} size={24} strokeWidth={1.8} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={styles.headerBadge}>
            {ritual?.live && <View style={[styles.liveDot, { backgroundColor: '#EF4444' }]} />}
            <Text style={[styles.headerBadgeText, { color: ACCENT }]}>
              {ritual?.live ? 'NA �YWO' : ritual?.type ?? 'RYTUA�'}
            </Text>
          </View>
          <Text style={[styles.headerTitle, { color: tc }]} numberOfLines={1}>{phase.label}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <MusicToggleButton color={ACCENT} size={18} />
          <View style={[styles.paxBadge, { backgroundColor: ACCENT + '20', borderColor: ACCENT + '50' }]}>
            <Users size={11} color={ACCENT} />
            <Text style={[styles.paxCount, { color: ACCENT }]}>{participants.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* �� Central orb ���������������������������������������������������� */}
        <View style={styles.orbArea}>
          {[320, 270, 220].map((d, i) => (
            <Animated.View
              key={i}
              style={[{ position: 'absolute', width: d, height: d, borderRadius: d / 2, borderWidth: 1, borderColor: ACCENT + (['20', '38', '60'][i]) },
                i === 0 ? ringStyle : {}]}
            />
          ))}
          <Animated.View style={[pulseStyle, { width: 160, height: 160, borderRadius: 80, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }]}>
            <LinearGradient colors={[ACCENT + 'EE', ACCENT + '77']} style={StyleSheet.absoluteFill} />
            <Animated.View style={glowStyle}>
              <Icon color="#fff" size={32} strokeWidth={1.3} />
            </Animated.View>
            <Text style={styles.orbParticipants}>{participants.toLocaleString()}</Text>
            <Text style={styles.orbLabel}>DUSZ</Text>
          </Animated.View>
        </View>

        {/* �� Session completion banner ��������������������������������������� */}
        {sessionEnded && (
          <Animated.View entering={FadeInDown.duration(600)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 16 }}>
            <LinearGradient
              colors={[ACCENT + '28', ACCENT + '10']}
              style={[styles.endBanner, { borderColor: ACCENT + '60' }]}
            >
              <Star color={ACCENT} size={22} fill={ACCENT} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.endBannerTitle, { color: tc }]}>Rytua� zako�czony</Text>
                <Text style={[styles.endBannerSub, { color: sc }]}>
                  Przebywa�e� {mins}:{secs} w zbiorowym polu. Dzi�kujemy.
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* �� Timer + progress ������������������������������������������������ */}
        {joined && !sessionEnded && (
          <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: layout.padding.screen, marginBottom: 14 }}>
            <View style={[styles.timerCard, { backgroundColor: cb, borderColor: cbr }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} color={ACCENT} />
                  <Text style={[styles.timerLabel, { color: sc }]}>Czas sesji</Text>
                </View>
                <Text style={[styles.timerValue, { color: ACCENT }]}>{mins}:{secs}</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: ACCENT }]} />
              </View>
              <Text style={[styles.timerRemaining, { color: sc }]}>Pozosta�o: {remMins}:{remSecs}</Text>
            </View>
          </Animated.View>
        )}

        {/* �� CTA: Join / End ������������������������������������������������� */}
        {!sessionEnded && (
          <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 18 }}>
            <Pressable onPress={joined ? endSession : startSession}>
              <LinearGradient
                colors={joined ? ['#EF4444', '#B91C1C'] : [ACCENT, ACCENT + 'AA']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.joinBtn}
              >
                {joined ? <Pause color="#fff" size={20} /> : <Play color="#fff" size={20} />}
                <Text style={styles.joinBtnText}>
                  {joined ? 'Zako�cz rytua�' : 'Do��cz do rytua�u'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* �� Ritual steps ��������������������������������������������������� */}
        <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 18 }}>
          <Text style={[styles.sectionEye, { color: ACCENT }]}>KROKI RYTUA�U</Text>
          <View style={[styles.stepsCard, { backgroundColor: cb, borderColor: cbr }]}>
            {phase.steps.map((step, i) => {
              const done = stepsDone.includes(i);
              return (
                <Pressable key={i} onPress={() => toggleStep(i)}
                  style={[styles.stepRow, i < phase.steps.length - 1 && { borderBottomWidth: 1, borderBottomColor: cbr }]}>
                  <View style={[styles.stepCircle, { borderColor: done ? ACCENT : cbr, backgroundColor: done ? ACCENT : 'transparent' }]}>
                    {done && <CheckCircle2 color="#fff" size={14} />}
                    {!done && <Text style={[styles.stepNum, { color: sc }]}>{i + 1}</Text>}
                  </View>
                  <Text style={[styles.stepText, { color: done ? tc : sc, textDecorationLine: done ? 'line-through' : 'none' }]}>
                    {step}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* �� Intention ������������������������������������������������������� */}
        <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 18 }}>
          <Text style={[styles.sectionEye, { color: ACCENT }]}>TWOJA INTENCJA</Text>
          {!intentionSent ? (
            <View style={[styles.intentionCard, { backgroundColor: cb, borderColor: cbr }]}>
              <TextInput
                value={intention}
                onChangeText={setIntention}
                placeholder="Wpisz intencj�, kt�r� wnosisz do zbiorowego pola..."
                placeholderTextColor={sc}
                multiline
                style={[styles.intentionInput, { color: tc }]}
              />
              <Pressable
                onPress={() => { if (intention.trim()) { setIntentionSent(true); HapticsService.notify(); } }}
                style={[styles.intentionSend, { backgroundColor: ACCENT + '22', borderColor: ACCENT + '44' }]}
              >
                <Send size={14} color={ACCENT} />
                <Text style={[styles.intentionSendText, { color: ACCENT }]}>Wy�lij intencj� do kr�gu</Text>
              </Pressable>
            </View>
          ) : (
            <Animated.View entering={FadeIn.duration(400)} style={[styles.intentionSent, { backgroundColor: ACCENT + '15', borderColor: ACCENT + '40' }]}>
              <CheckCircle2 color={ACCENT} size={18} />
              <Text style={[styles.intentionSentText, { color: tc }]}>�{intention}"</Text>
            </Animated.View>
          )}
        </View>

        {/* �� Reactions ������������������������������������������������������� */}
        <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 18 }}>
          <Text style={[styles.sectionEye, { color: ACCENT }]}>ZBIOROWA ENERGIA</Text>
          <View style={styles.reactionsRow}>
            {[
              { key: 'love', emoji: '??', label: 'Mi�o��', count: reactions.love },
              { key: 'light', emoji: '?', label: '�wiat�o', count: reactions.light },
              { key: 'fire', emoji: '??', label: 'Przemiana', count: reactions.fire },
            ].map(r => (
              <Pressable key={r.key} onPress={() => addReaction(r.key as any)}
                style={[styles.reactionBtn, { backgroundColor: cb, borderColor: cbr }]}>
                <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                <Text style={[styles.reactionCount, { color: tc }]}>{r.count}</Text>
                <Text style={[styles.reactionLabel, { color: sc }]}>{r.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* �� Music selector �������������������������������������������������� */}
        <View style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.padding.screen, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Music size={13} color={ACCENT} />
              <Text style={[styles.sectionEye, { color: ACCENT, marginBottom: 0 }]}>MUZYKA RYTUA�U</Text>
            </View>
            <Pressable onPress={toggleMute} style={[styles.muteBtn, { borderColor: cbr, backgroundColor: cb }]}>
              {musicMuted ? <VolumeX size={14} color={sc} /> : <Volume2 size={14} color={ACCENT} />}
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 10 }}>
            {MUSIC_OPTS.map(opt => {
              const active = selectedMusic === opt.id;
              return (
                <Pressable key={opt.id}
                  onPress={() => {
                    setSelectedMusic(opt.id);
                    HapticsService.impact('light');
                    if (joined && !musicMuted) AudioService.playAmbientForSession(opt.id as any);
                  }}
                  style={[styles.musicChip, {
                    backgroundColor: active ? opt.color + '28' : cb,
                    borderColor: active ? opt.color : cbr,
                  }]}>
                  <Text style={{ fontSize: 18 }}>{opt.emoji}</Text>
                  <Text style={[styles.musicChipLabel, { color: active ? opt.color : sc }]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* �� Live chat ������������������������������������������������������� */}
        <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Eye size={13} color={ACCENT} />
            <Text style={[styles.sectionEye, { color: ACCENT, marginBottom: 0 }]}>�YWY CZAT KR�GU</Text>
          </View>
          <View style={[styles.chatContainer, { backgroundColor: cb, borderColor: cbr }]}>
            <ScrollView ref={chatScrollRef} style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}>
              {messages.map((msg: any) => (
                <View key={msg.id} style={[styles.chatMsg, msg.isOwn && styles.chatMsgOwn]}>
                  <View style={[styles.chatAvatar, { backgroundColor: msg.color + '28' }]}>
                    <Text style={{ fontSize: 11 }}>{msg.flag}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.chatAuthor, { color: msg.color }]}>{msg.author}</Text>
                    <Text style={[styles.chatText, { color: tc }]}>{msg.text}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={[styles.chatInputRow, { borderTopColor: cbr }]}>
              <TextInput
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Napisz do kr�gu..."
                placeholderTextColor={sc}
                style={[styles.chatInput, { color: tc }]}
                onSubmitEditing={sendChat}
                returnKeyType="send"
              />
              <Pressable onPress={sendChat} style={[styles.chatSend, { backgroundColor: ACCENT }]}>
                <Send size={14} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* �� Host info ������������������������������������������������������� */}
        {ritual?.host && (
          <View style={{ paddingHorizontal: layout.padding.screen, marginBottom: 18 }}>
            <View style={[styles.hostCard, { backgroundColor: cb, borderColor: cbr }]}>
              <View style={[styles.hostAvatar, { backgroundColor: ACCENT + '28' }]}>
                <Sparkles size={18} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.hostName, { color: tc }]}>{ritual.host}</Text>
                <Text style={[styles.hostRole, { color: sc }]}>Prowadz�ca rytua� � Mistrzyni ceremonii</Text>
              </View>
              <View style={[styles.hostOnline, { backgroundColor: '#10B981' }]} />
            </View>
          </View>
        )}

        <EndOfContentSpacer size="airy" />
      </ScrollView>

      {/* �� Floating chat toggle button ������������������������������������ */}
      <View style={[styles.chatFab, { bottom: insets.bottom + 90 }]}>
        <Pressable
          onPress={openChatDrawer}
          style={[styles.chatFabBtn, { backgroundColor: ACCENT }]}
        >
          <MessageSquare color="#fff" size={20} strokeWidth={2} />
          <Text style={styles.chatFabText}>Czat</Text>
        </Pressable>
      </View>

      {/* �� Sliding chat drawer ������������������������������������������� */}
      {chatDrawerOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Dim overlay */}
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }, chatOverlayStyle]}
            pointerEvents="auto"
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={closeChatDrawer} />
          </Animated.View>

          {/* Drawer panel */}
          <Animated.View
            style={[
              styles.chatDrawer,
              { height: SH * 0.45, bottom: 0 },
              chatDrawerStyle,
            ]}
          >
            <LinearGradient
              colors={['rgba(5,3,18,0.98)', 'rgba(10,6,30,0.97)']}
              style={StyleSheet.absoluteFill}
            />

            {/* Drawer handle bar */}
            <View style={styles.chatDrawerHandle} />

            {/* Drawer header */}
            <View style={[styles.chatDrawerHeader, { borderBottomColor: ACCENT + '30' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MessageSquare color={ACCENT} size={15} strokeWidth={2} />
                <Text style={[styles.chatDrawerTitle, { color: '#F0EBFF' }]}>CZAT RYTUA�U</Text>
                <View style={[styles.chatDrawerBadge, { backgroundColor: ACCENT + '28', borderColor: ACCENT + '50' }]}>
                  <Users size={10} color={ACCENT} />
                  <Text style={[styles.chatDrawerBadgeText, { color: ACCENT }]}>{participants.toLocaleString()}</Text>
                </View>
              </View>
              <Pressable onPress={closeChatDrawer} hitSlop={14}>
                <X color="rgba(255,255,255,0.6)" size={20} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Messages */}
            <ScrollView
              ref={drawerScrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 }}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => drawerScrollRef.current?.scrollToEnd({ animated: false })}
            >
              {drawerMessages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.drawerMsgRow,
                    msg.isOwn && styles.drawerMsgRowOwn,
                  ]}
                >
                  {!msg.isOwn && (
                    <View style={[styles.drawerAvatar, { backgroundColor: msg.avatarColor }]}>
                      <Text style={styles.drawerAvatarText}>{msg.initials}</Text>
                    </View>
                  )}
                  <View style={[styles.drawerMsgContent, msg.isOwn && { alignItems: 'flex-end' }]}>
                    {!msg.isOwn && (
                      <Text style={[styles.drawerMsgAuthor, { color: msg.avatarColor }]}>{msg.author}</Text>
                    )}
                    <View style={[
                      styles.drawerBubble,
                      msg.isOwn
                        ? { backgroundColor: ACCENT + 'CC', borderBottomRightRadius: 4 }
                        : { backgroundColor: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.09)', borderBottomLeftRadius: 4, borderWidth: isLight ? 1 : 0, borderColor: isLight ? 'rgba(139,100,42,0.18)' : 'transparent' },
                    ]}>
                      <Text style={[styles.drawerBubbleText, { color: msg.isOwn ? '#fff' : (isLight ? tc : '#E8E0F8') }]}>
                        {msg.text}
                      </Text>
                    </View>
                    <Text style={styles.drawerMsgTime}>{msg.time}</Text>
                  </View>
                  {msg.isOwn && (
                    <View style={[styles.drawerAvatar, { backgroundColor: msg.avatarColor }]}>
                      <Text style={styles.drawerAvatarText}>{msg.initials}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            {/* Quick emoji row */}
            {emojiPickerOpen && (
              <View style={[styles.emojiRow, { borderTopColor: ACCENT + '25' }]}>
                {QUICK_EMOJIS.map(e => (
                  <Pressable key={e} onPress={() => sendQuickEmoji(e)} style={styles.emojiBtn}>
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Input row */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={0}
            >
              <View style={[styles.drawerInputRow, {
                borderTopColor: ACCENT + '25',
                paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
              }]}>
                <Pressable
                  onPress={() => setEmojiPickerOpen(v => !v)}
                  style={[styles.drawerEmojiToggle, { borderColor: isLight ? 'rgba(139,100,42,0.22)' : 'rgba(255,255,255,0.15)' }]}
                >
                  <Text style={{ fontSize: 18 }}>??</Text>
                </Pressable>
                <TextInput
                  value={drawerInput}
                  onChangeText={setDrawerInput}
                  placeholder="Napisz do kr�gu..."
                  placeholderTextColor="rgba(200,185,255,0.40)"
                  style={[styles.drawerInput, { color: '#F0EBFF' }]}
                  onSubmitEditing={sendDrawerMessage}
                  returnKeyType="send"
                  onFocus={() => setEmojiPickerOpen(false)}
                />
                <Pressable
                  onPress={sendDrawerMessage}
                  style={[styles.drawerSendBtn, { backgroundColor: ACCENT }]}
                >
                  <Send color="#fff" size={16} />
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      )}
        </SafeAreaView>
</View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: layout.padding.screen, paddingVertical: 12, gap: 10,
  },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5 },
  headerBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.8 },
  headerTitle: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  paxBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  paxCount: { fontSize: 11, fontWeight: '700' },

  orbArea: { height: 240, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  orbParticipants: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4 },
  orbLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 9, letterSpacing: 1.8 },

  endBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 16 },
  endBannerTitle: { fontSize: 15, fontWeight: '700' },
  endBannerSub: { fontSize: 12, lineHeight: 18, marginTop: 2 },

  timerCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
  timerLabel: { fontSize: 12 },
  timerValue: { fontSize: 26, fontWeight: '800' },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(128,128,128,0.15)', overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 3 },
  timerRemaining: { fontSize: 11, textAlign: 'right' },

  joinBtn: { borderRadius: 18, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  sectionEye: { fontSize: 9, fontWeight: '800', letterSpacing: 1.8, marginBottom: 10 },

  stepsCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNum: { fontSize: 12, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 13, lineHeight: 20 },

  intentionCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  intentionInput: { fontSize: 13, lineHeight: 20, minHeight: 64, marginBottom: 10 },
  intentionSend: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, alignSelf: 'flex-end' },
  intentionSendText: { fontSize: 12, fontWeight: '700' },
  intentionSent: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  intentionSentText: { flex: 1, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  reactionsRow: { flexDirection: 'row', gap: 10 },
  reactionBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  reactionEmoji: { fontSize: 22 },
  reactionCount: { fontSize: 16, fontWeight: '800' },
  reactionLabel: { fontSize: 10, fontWeight: '600' },

  muteBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  musicChip: { alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, minWidth: 70 },
  musicChipLabel: { fontSize: 10, fontWeight: '700' },

  chatContainer: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  chatMsg: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  chatMsgOwn: { flexDirection: 'row-reverse' },
  chatAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chatAuthor: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  chatText: { fontSize: 12, lineHeight: 17 },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chatInput: { flex: 1, fontSize: 13, paddingVertical: 4 },
  chatSend: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  hostCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  hostAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  hostName: { fontSize: 14, fontWeight: '700' },
  hostRole: { fontSize: 11, marginTop: 2 },
  hostOnline: { width: 10, height: 10, borderRadius: 5 },

  // �� Floating chat FAB ������������������������������������������������������
  chatFab: {
    position: 'absolute',
    right: 18,
    zIndex: 30,
  },
  chatFabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  chatFabText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },

  // �� Chat drawer ������������������������������������������������������������
  chatDrawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(180,150,255,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 50,
  },
  chatDrawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  chatDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  chatDrawerTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  chatDrawerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  chatDrawerBadgeText: { fontSize: 10, fontWeight: '700' },

  // �� Drawer messages ��������������������������������������������������������
  drawerMsgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  drawerMsgRowOwn: { flexDirection: 'row-reverse' },
  drawerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  drawerAvatarText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  drawerMsgContent: { flex: 1, gap: 2 },
  drawerMsgAuthor: { fontSize: 10, fontWeight: '700', marginLeft: 4 },
  drawerBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    maxWidth: SW * 0.68,
  },
  drawerBubbleText: { fontSize: 13, lineHeight: 18 },
  drawerMsgTime: {
    fontSize: 10,
    color: 'rgba(200,185,255,0.38)',
    marginLeft: 4,
    marginRight: 4,
  },

  // �� Drawer input �����������������������������������������������������������
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  emojiBtn: { padding: 4 },
  drawerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
  },
  drawerEmojiToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  drawerInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  drawerSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
