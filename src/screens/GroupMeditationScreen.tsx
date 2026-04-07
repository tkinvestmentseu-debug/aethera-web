// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ChevronLeft, Users, Moon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme, isLightBg } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { HapticsService } from '../core/services/haptics.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useAuthStore } from '../store/useAuthStore';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../core/config/firebase.config';

const { width: SW } = Dimensions.get('window');
const ORB_SIZE = SW * 0.62;

const DAILY_INTENTIONS = [
  'Otwieram serce na miłość i obfitość',
  'Jestem spokojny i zakorzeniony',
  'Uwalniam to, co mnie nie służy',
  'Przyciągam pozytywną energię',
  'Jestem wdzięczny za wszystko co mam',
  'Ufam procesowi życia',
  'Jestem połączony z całym wszechświatem',
];

function formatMMSS(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getCountdown(): string {
  const now = new Date();
  const target = new Date();
  target.setHours(21, 0, 0, 0);
  if (now >= target) target.setDate(target.getDate() + 1);
  const diff = Math.floor((target.getTime() - now.getTime()) / 1000);
  const h = Math.floor(diff / 3600).toString().padStart(2, '0');
  const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
  const s = (diff % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export const GroupMeditationScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const themeName = useAppStore(s => s.themeName);
  const theme = getResolvedTheme(themeName);
  const isLight = isLightBg(theme.background);
  const { currentUser } = useAuthStore();

  const tc = isLight ? '#1A1008' : '#F0ECE4';
  const sc = isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.18)' : 'rgba(255,255,255,0.10)';

  const [joined, setJoined] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [meditatorNames, setMeditatorNames] = useState<string[]>([]);
  const [personalTimer, setPersonalTimer] = useState(0);
  const [countdown, setCountdown] = useState(getCountdown());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const todayIntention = DAILY_INTENTIONS[new Date().getDay()];

  // Orb pulse animation
  const pulse = useSharedValue(1);
  const ring1 = useSharedValue(1);
  const ring2 = useSharedValue(1);
  const ring3 = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1,
      false
    );
    ring1.value = withRepeat(withTiming(1.25, { duration: 3000 }), -1, true);
    ring2.value = withRepeat(withTiming(1.35, { duration: 4200 }), -1, true);
    ring3.value = withRepeat(withTiming(1.45, { duration: 5500 }), -1, true);
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1.value }],
    opacity: 2 - ring1.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2.value }],
    opacity: (2 - ring2.value) * 0.6,
  }));
  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring3.value }],
    opacity: (2 - ring3.value) * 0.3,
  }));

  // Real-time active meditators
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'activeMeditations'), snap => {
      setActiveCount(snap.size);
      const names = snap.docs
        .map(d => d.data().name)
        .filter(Boolean)
        .slice(0, 5);
      setMeditatorNames(names);
    }, err => console.warn('GroupMeditation snapshot error:', err));
    return () => unsub();
  }, []);

  // Countdown clock
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown(getCountdown());
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Personal timer when joined
  useEffect(() => {
    if (joined) {
      timerRef.current = setInterval(() => {
        setPersonalTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setPersonalTimer(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [joined]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (joined && currentUser?.uid) {
        deleteDoc(doc(db, 'activeMeditations', currentUser.uid)).catch(() => {});
      }
    };
  }, [joined, currentUser]);

  const handleJoin = useCallback(async () => {
    if (!currentUser) return;
    HapticsService.impact('medium');
    try {
      await setDoc(doc(db, 'activeMeditations', currentUser.uid), {
        joinedAt: serverTimestamp(),
        name: currentUser.displayName || null,
      });
      setJoined(true);
    } catch (e) {
      console.warn('GroupMeditation join error:', e);
    }
  }, [currentUser]);

  const handleLeave = useCallback(async () => {
    if (!currentUser) return;
    HapticsService.impact('medium');
    try {
      await deleteDoc(doc(db, 'activeMeditations', currentUser.uid));
      setJoined(false);
    } catch (e) {
      console.warn('GroupMeditation leave error:', e);
    }
  }, [currentUser]);

  return (
    <LinearGradient
      colors={isLight ? ['#FDF6EE', '#EDE8F5'] : ['#080612', '#0E0A1E', '#080612']}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={tc} />
          </Pressable>
          <View style={styles.headerTitles}>
            <Text style={[styles.headerTitle, { color: tc }]}>{t('groupMeditation.title', 'Grupowa Medytacja')}</Text>
            <Text style={[styles.headerSub, { color: sc }]}>{t('groupMeditation.subtitle', 'Każdego dnia o 21:00')}</Text>
          </View>
          <Moon size={22} color="#8B5CF6" />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Countdown */}
          {!joined && (
            <Animated.View entering={FadeInDown.duration(500)} style={[styles.countdownCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.countdownLabel, { color: sc }]}>{t('groupMeditation.nextSession', 'Następna sesja za')}</Text>
              <Text style={[styles.countdownValue, { color: '#A78BFA' }]}>{countdown}</Text>
            </Animated.View>
          )}

          {/* Orb */}
          <View style={styles.orbContainer}>
            <Animated.View style={[styles.orbRing3, ring3Style]} />
            <Animated.View style={[styles.orbRing2, ring2Style]} />
            <Animated.View style={[styles.orbRing1, ring1Style]} />
            <Animated.View style={[styles.orbWrap, orbStyle]}>
              <LinearGradient
                colors={['#6D28D9', '#8B5CF6', '#A78BFA']}
                style={styles.orb}
              >
                <Text style={styles.orbCount}>{activeCount}</Text>
                <Text style={styles.orbLabel}>{t('groupMeditation.peopleMeditating', 'osób medytuje teraz')}</Text>
                {joined && (
                  <Text style={styles.timerText}>{formatMMSS(personalTimer)}</Text>
                )}
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Joined status */}
          {joined && (
            <Animated.View entering={ZoomIn.duration(400)} style={styles.joinedBadge}>
              <Text style={styles.joinedText}>{t('groupMeditation.meditatingWith', '✦ Medytujesz razem ze wspólnotą')}</Text>
            </Animated.View>
          )}

          {/* Intention */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={[styles.intentionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.intentionLabel, { color: sc }]}>{t('groupMeditation.dailyIntention', 'Intencja dnia')}</Text>
            <Text style={[styles.intentionText, { color: tc }]}>"{todayIntention}"</Text>
          </Animated.View>

          {/* Active meditators */}
          {meditatorNames.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={[styles.namesCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.namesHeader}>
                <Users size={15} color="#8B5CF6" />
                <Text style={[styles.namesTitle, { color: sc }]}>{t('groupMeditation.activeMeditators', 'Aktywni medytujący')}</Text>
              </View>
              <View style={styles.namesPills}>
                {meditatorNames.map((name, i) => (
                  <View key={i} style={styles.namePill}>
                    <Text style={styles.namePillText}>{name}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Join / Leave button */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.btnWrap}>
            {!joined ? (
              <Pressable onPress={handleJoin}>
                <LinearGradient
                  colors={['#6D28D9', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.joinBtn}
                >
                  <Text style={styles.joinBtnText}>{t('groupMeditation.joinBtn', 'Dołącz do kręgu')}</Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <Pressable onPress={handleLeave} style={styles.leaveBtn}>
                <Text style={[styles.leaveBtnText, { color: sc }]}>{t('groupMeditation.leaveBtn', 'Zakończ medytację')}</Text>
              </Pressable>
            )}
          </Animated.View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.3 },
  headerSub: { fontSize: 12, marginTop: 2 },
  scrollContent: {
    paddingHorizontal: layout.padding.screen,
    alignItems: 'center',
    paddingBottom: 40,
  },
  countdownCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  countdownLabel: { fontSize: 13, marginBottom: 6 },
  countdownValue: { fontSize: 32, fontWeight: '700', letterSpacing: 4, fontVariant: ['tabular-nums'] },
  orbContainer: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  orbRing1: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.40)',
  },
  orbRing2: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
  },
  orbRing3: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.15)',
  },
  orbWrap: {
    width: ORB_SIZE * 0.72,
    height: ORB_SIZE * 0.72,
    borderRadius: ORB_SIZE * 0.36,
    overflow: 'hidden',
  },
  orb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ORB_SIZE * 0.36,
  },
  orbCount: { fontSize: 48, fontWeight: '800', color: '#fff' },
  orbLabel: { fontSize: 13, color: 'rgba(255,255,255,0.80)', textAlign: 'center', marginTop: 4 },
  timerText: { fontSize: 22, color: '#FDE68A', fontWeight: '700', marginTop: 8, letterSpacing: 3 },
  joinedBadge: {
    backgroundColor: 'rgba(139,92,246,0.20)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 16,
  },
  joinedText: { color: '#C4B5FD', fontSize: 13, fontWeight: '600' },
  intentionCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  intentionLabel: { fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  intentionText: { fontSize: 17, lineHeight: 26, fontStyle: 'italic', fontWeight: '500' },
  namesCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  namesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  namesTitle: { fontSize: 13, fontWeight: '600' },
  namesPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  namePill: {
    backgroundColor: 'rgba(139,92,246,0.18)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  namePillText: { color: '#C4B5FD', fontSize: 12, fontWeight: '600' },
  btnWrap: { width: '100%', marginTop: 8 },
  joinBtn: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinBtnText: { color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 0.5 },
  leaveBtn: {
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.30)',
  },
  leaveBtnText: { fontSize: 15, fontWeight: '600' },
});
