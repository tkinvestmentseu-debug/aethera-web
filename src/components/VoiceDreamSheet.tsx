// @ts-nocheck
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, Modal, Dimensions, Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, withDelay,
  FadeIn, FadeOut, SlideInDown, SlideOutDown,
  cancelAnimation, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, MicOff, Square, Sparkles, X, BookOpen } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { useJournalStore } from '../store/useJournalStore';
import { AiService } from '../core/services/ai.service';
import { HapticsService } from '../core/services/haptics.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import i18n from '../core/i18n';

const { width: SW, height: SH } = Dimensions.get('window');
const ACCENT_PURPLE = '#818CF8';
const ACCENT_RED    = '#F87171';

// ── Waveform bar (module-level animated component) ──────────────────────────
const AnimatedView = Animated.View;

const WaveBar = React.memo(({ index, isActive }: { index: number; isActive: boolean }) => {
  const height = useSharedValue(4);

  useEffect(() => {
    if (isActive) {
      // Stagger each bar slightly
      const delay = (index * 37) % 300;
      height.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(4 + Math.random() * 28, { duration: 120 + (index % 5) * 30, easing: Easing.inOut(Easing.sin) }),
            withTiming(4 + Math.random() * 12, { duration: 100 + (index % 4) * 25, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          true,
        ),
      );
    } else {
      cancelAnimation(height);
      height.value = withTiming(4, { duration: 300 });
    }
  }, [isActive]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  const barColor = isActive ? ACCENT_RED : ACCENT_PURPLE + '55';

  return (
    <Animated.View
      style={[
        styles.waveBar,
        { backgroundColor: barColor },
        barStyle,
      ]}
    />
  );
});

// ── Pulsing ring (module-level) ──────────────────────────────────────────────
const PulseRing = React.memo(({ delay, isActive }: { delay: number; isActive: boolean }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 0 }),
            withTiming(1.9, { duration: 1400, easing: Easing.out(Easing.cubic) }),
          ),
          -1,
          false,
        ),
      );
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.55, { duration: 200 }),
            withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) }),
          ),
          -1,
          false,
        ),
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = withTiming(1, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isActive]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.pulseRing, ringStyle]}
      pointerEvents="none"
    />
  );
});

// ── Loading orb ──────────────────────────────────────────────────────────────
const LoadingOrb = React.memo(() => {
  const scale = useSharedValue(1);
  const glow  = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.14, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.94, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    return () => {
      cancelAnimation(scale);
      cancelAnimation(glow);
    };
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: glow.value,
  }));

  return (
    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
      <Animated.View style={[styles.loadingOrb, orbStyle]}>
        <LinearGradient
          colors={['#A78BFA', '#818CF8', '#60A5FA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={{ fontSize: 28 }}>🔮</Text>
      </Animated.View>
      <Text style={[styles.loadingText, { color: ACCENT_PURPLE }]}>
        Interpretowanie symboli...
      </Text>
    </View>
  );
});

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
interface VoiceDreamSheetProps {
  visible: boolean;
  onClose: () => void;
}

type SheetPhase =
  | 'idle'          // initial — ready to record
  | 'recording'     // actively recording
  | 'recorded'      // recording done, show details input
  | 'interpreting'  // AI loading
  | 'interpreted';  // AI result shown

export const VoiceDreamSheet: React.FC<VoiceDreamSheetProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const themeName = useAppStore(s => s.themeName);
  const theme     = getResolvedTheme(themeName);
  const isLight   = theme.background.startsWith('#F');
  const addEntry  = useJournalStore(s => s.addEntry);

  // ── Local state ─────────────────────────────────────────────────────────
  const [phase,         setPhase]         = useState<SheetPhase>('idle');
  const [timerSecs,     setTimerSecs]     = useState(0);
  const [details,       setDetails]       = useState('');
  const [aiResult,      setAiResult]      = useState('');
  const [recordingUri,  setRecordingUri]  = useState<string | null>(null);

  // ── Refs ────────────────────────────────────────────────────────────────
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Colours ─────────────────────────────────────────────────────────────
  const bg        = isLight ? '#F5F2FF' : '#0C0A1E';
  const cardBg    = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(22,16,48,0.95)';
  const textColor = isLight ? '#1A1230' : '#EDE8FF';
  const subColor  = isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.50)';
  const border    = isLight ? 'rgba(129,140,248,0.25)' : 'rgba(129,140,248,0.18)';

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  // ── Reset when sheet closes ──────────────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        setPhase('idle');
        setTimerSecs(0);
        setDetails('');
        setAiResult('');
        setRecordingUri(null);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      }, 400);
    }
  }, [visible]);

  // ── Format timer ────────────────────────────────────────────────────────
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ── Start recording ─────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
      setPhase('recording');
      setTimerSecs(0);
      HapticsService.impact('medium');

      timerRef.current = setInterval(() => {
        setTimerSecs(prev => prev + 1);
      }, 1000);
    } catch (e) {
      // silently fail if mic not available in simulator
    }
  }, []);

  // ── Stop recording ──────────────────────────────────────────────────────
  const stopRecording = useCallback(async () => {
    try {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (!recordingRef.current) return;
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setRecordingUri(uri || null);
      setPhase('recorded');
      HapticsService.notify();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (e) {
      setPhase('recorded');
    }
  }, []);

  // ── AI interpretation ────────────────────────────────────────────────────
  const interpretWithAI = useCallback(async () => {
    setPhase('interpreting');
    try {
      const dreamText = details.trim()
        ? `Sen nagrany głosem. Notatki: ${details}`
        : 'Sen nagrany głosem (bez tekstu). Zinterpretuj ogólne symbole nocne i podświadomości.';
      const prompt = `${dreamText}\n\nZinterpretuj symbole tego snu. Odpowiedz po polsku, strukturyzując odpowiedź w sekcjach:\n✦ Symbole snu: (wypunktuj kluczowe symbole)\n✦ Interpretacja: (główna interpretacja)\n✦ Wiadomość dla Ciebie: (osobiste przesłanie)`;
      const resp = await AiService.chatWithOracle(
        [{ role: 'user', content: prompt }],
        i18n.language?.startsWith('en') ? 'en' : 'pl',
      );
      setAiResult(resp || '');
      setPhase('interpreted');
    } catch {
      setAiResult('Nie udało się połączyć z wyrocznią. Zapisz sen i spróbuj ponownie później.');
      setPhase('interpreted');
    }
  }, [details]);

  // ── Save to journal ──────────────────────────────────────────────────────
  const saveDream = useCallback(() => {
    const content = details.trim() || 'Nagranie głosowe';
    addEntry({
      type: 'dream',
      title: `Sen głosowy ${new Date().getDate()}.${new Date().getMonth() + 1}`,
      content: aiResult ? `${content}\n\n--- AI ---\n${aiResult}` : content,
      interpretation: aiResult || undefined,
      tags: ['voice'],
    });
    HapticsService.notify();
    onClose();
  }, [details, aiResult, addEntry, onClose]);

  // ── AI sections parser ───────────────────────────────────────────────────
  const parsedSections = React.useMemo(() => {
    if (!aiResult) return [];
    const defs = [
      { key: '✦ Symbole snu',        color: '#60A5FA' },
      { key: '✦ Interpretacja',       color: '#A78BFA' },
      { key: '✦ Wiadomość dla Ciebie', color: ACCENT_PURPLE },
    ];
    return defs.map(d => {
      const allKeys = defs.map(x => x.key + ':').join('|');
      const regex = new RegExp(`${d.key.replace(/[✦ ]/g, s => '\\' + s + '?')}[:\\s]*([\\s\\S]*?)(?=${allKeys.replace(/[✦]/g, '\\✦')}|$)`, 'i');
      const m = aiResult.match(regex);
      // Fallback: simple split
      const idx = aiResult.indexOf(d.key);
      let text = '';
      if (idx !== -1) {
        const after = aiResult.slice(idx + d.key.length).replace(/^[:\s]+/, '');
        const nextIdx = defs.filter(x => x.key !== d.key).reduce((min, x) => {
          const i2 = after.indexOf(x.key);
          return i2 !== -1 && i2 < min ? i2 : min;
        }, after.length);
        text = after.slice(0, nextIdx).replace(/\*\*/g, '').replace(/\*/g, '').trim();
      }
      return { ...d, text };
    }).filter(s => s.text.length > 0);
  }, [aiResult]);

  const isRecording = phase === 'recording';
  const BARS = Array.from({ length: 20 }, (_, i) => i);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable
        style={styles.backdrop}
        onPress={phase === 'recording' ? undefined : onClose}
      >
        <View style={styles.backdropFill} />
      </Pressable>

      {/* Sheet */}
      <Animated.View
        entering={SlideInDown.duration(380).springify().damping(18)}
        exiting={SlideOutDown.duration(280)}
        style={[
          styles.sheet,
          {
            backgroundColor: bg,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        <LinearGradient
          colors={isLight
            ? ['rgba(129,140,248,0.12)', 'rgba(167,139,250,0.05)', 'transparent']
            : ['rgba(129,140,248,0.22)', 'rgba(16,10,40,0)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.18)' }]} />

        {/* Header row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.sheetTitle, { color: textColor }]}>Rejestrator Snów</Text>
            <Text style={[styles.sheetSub, { color: ACCENT_PURPLE }]}>✦ Głosowy dziennik snów</Text>
          </View>
          {phase !== 'recording' && (
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.10)' }]} hitSlop={10}>
              <X color={subColor} size={18} />
            </Pressable>
          )}
        </View>

        {/* ── PHASE: IDLE ──────────────────────────────────────────────── */}
        {phase === 'idle' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.phaseContainer}>
            <Text style={[styles.idleHint, { color: subColor }]}>
              Naciśnij i opowiedz swój sen{'\n'}zanim wspomnienia wyblakną
            </Text>

            {/* Big mic button */}
            <Pressable onPress={startRecording} style={styles.bigBtnWrapper}>
              <LinearGradient
                colors={['#6D28D9', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bigBtn}
              >
                <Mic color="#FFF" size={42} strokeWidth={1.5} />
              </LinearGradient>
            </Pressable>

            <Text style={[styles.startLabel, { color: ACCENT_PURPLE }]}>Nagraj sen</Text>
          </Animated.View>
        )}

        {/* ── PHASE: RECORDING ─────────────────────────────────────────── */}
        {phase === 'recording' && (
          <Animated.View entering={FadeIn.duration(250)} style={styles.phaseContainer}>
            <Text style={[styles.recordingHint, { color: subColor }]}>
              Mów teraz... opisz swój sen
            </Text>

            {/* Timer */}
            <Text style={[styles.timer, { color: ACCENT_RED }]}>
              {formatTime(timerSecs)}
            </Text>

            {/* Pulsing rings + record button */}
            <View style={styles.recordBtnContainer}>
              <PulseRing delay={0}   isActive={isRecording} />
              <PulseRing delay={450} isActive={isRecording} />
              <PulseRing delay={900} isActive={isRecording} />

              <Pressable onPress={stopRecording} style={styles.recordBtnWrapper}>
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.recordBtn}
                >
                  <Square color="#FFF" size={36} fill="#FFF" />
                </LinearGradient>
              </Pressable>
            </View>

            {/* Waveform */}
            <View style={styles.waveform}>
              {BARS.map(i => (
                <WaveBar key={i} index={i} isActive={isRecording} />
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── PHASE: RECORDED ──────────────────────────────────────────── */}
        {phase === 'recorded' && (
          <Animated.View entering={FadeIn.duration(280)} style={styles.phaseContainer}>
            {/* Success badge */}
            <View style={[styles.successBadge, { backgroundColor: '#34D399' + '22', borderColor: '#34D399' + '55' }]}>
              <Text style={{ fontSize: 22 }}>✓</Text>
              <Text style={{ color: '#34D399', fontWeight: '700', fontSize: 15 }}>Sen zapisany</Text>
            </View>

            {/* Optional details input */}
            <Text style={[styles.detailsLabel, { color: subColor }]}>
              Dodaj szczegóły (opcjonalnie)
            </Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Postacie, miejsca, emocje..."
              placeholderTextColor={subColor}
              multiline
              numberOfLines={3}
              style={[styles.detailsInput, {
                backgroundColor: cardBg,
                borderColor: border,
                color: textColor,
              }]}
              textAlignVertical="top"
            />

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <Pressable
                onPress={interpretWithAI}
                style={[styles.aiBtn, { backgroundColor: ACCENT_PURPLE + '22', borderColor: ACCENT_PURPLE + '55' }]}
              >
                <Sparkles color={ACCENT_PURPLE} size={16} />
                <Text style={[styles.aiBtnText, { color: ACCENT_PURPLE }]}>Interpretuj z AI ✦</Text>
              </Pressable>
              <Pressable
                onPress={saveDream}
                style={[styles.saveBtn, { backgroundColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)', borderColor: border }]}
              >
                <BookOpen color={subColor} size={16} />
                <Text style={[styles.saveBtnText, { color: subColor }]}>Zapisz bez interpretacji</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* ── PHASE: INTERPRETING ──────────────────────────────────────── */}
        {phase === 'interpreting' && (
          <Animated.View entering={FadeIn.duration(250)} style={styles.phaseContainer}>
            <LoadingOrb />
            <Text style={[styles.interpretingLabel, { color: subColor }]}>
              Wyrocznia odczytuje symbole Twojego snu...
            </Text>
          </Animated.View>
        )}

        {/* ── PHASE: INTERPRETED ───────────────────────────────────────── */}
        {phase === 'interpreted' && (
          <Animated.View entering={FadeIn.duration(280)} style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Section cards */}
              {parsedSections.length > 0 ? parsedSections.map((sec, i) => (
                <Animated.View
                  key={sec.key}
                  entering={FadeIn.delay(i * 120).duration(300)}
                  style={[styles.sectionCard, {
                    backgroundColor: sec.color + (isLight ? '14' : '0C'),
                    borderColor: sec.color + '44',
                    borderLeftColor: sec.color,
                  }]}
                >
                  <Text style={[styles.sectionKey, { color: sec.color }]}>{sec.key}</Text>
                  <Text style={[styles.sectionText, { color: textColor }]}>{sec.text}</Text>
                </Animated.View>
              )) : (
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: border, borderLeftColor: ACCENT_PURPLE }]}>
                  <Text style={[styles.sectionText, { color: textColor }]}>{aiResult}</Text>
                </View>
              )}

              {/* Save button */}
              <Pressable
                onPress={saveDream}
                style={styles.saveFinalBtn}
              >
                <LinearGradient
                  colors={['#6D28D9', '#4F46E5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveFinalGrad}
                >
                  <BookOpen color="#FFF" size={17} />
                  <Text style={styles.saveFinalText}>Zapisz do dziennika snów</Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </Animated.View>
        )}
      </Animated.View>
    </Modal>
  );
};

// ── StyleSheet ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.60)',
  },
  backdropFill: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: SH * 0.52,
    maxHeight: SH * 0.88,
    overflow: 'hidden',
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 4,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sheetSub: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Phase container
  phaseContainer: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 8,
    flex: 1,
  },

  // IDLE
  idleHint: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 32,
    marginTop: 8,
  },
  bigBtnWrapper: {
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  bigBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 16,
  },

  // RECORDING
  recordingHint: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  timer: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 24,
  },
  recordBtnContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: ACCENT_RED,
  },
  recordBtnWrapper: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  recordBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
  },

  // RECORDED
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    marginTop: 8,
  },
  detailsLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  detailsInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    lineHeight: 21,
    minHeight: 90,
    marginBottom: 16,
  },
  actionRow: {
    width: '100%',
    gap: 10,
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  aiBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // INTERPRETING
  loadingOrb: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  interpretingLabel: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // INTERPRETED
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  sectionKey: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  sectionText: {
    fontSize: 13.5,
    lineHeight: 21,
  },
  saveFinalBtn: {
    marginTop: 8,
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  saveFinalGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveFinalText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
