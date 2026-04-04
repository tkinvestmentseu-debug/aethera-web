// src/components/QuickOracle.tsx
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Modal, Platform,
  Pressable, ScrollView, StyleSheet, View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Typography } from './Typography';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

const DAILY_QUESTIONS = [
  'Jaka energia towarzyszy mi dziś?',
  'Co powinienem dziś zauważyć?',
  'Jaki dar przynosi mi ten dzień?',
  'Na czym warto dziś skupić uwagę?',
  'Co chce się przez mnie wyrazić dziś?',
  'Jaka lekcja czeka mnie dziś?',
  'Co przyniesie mi dzisiejszy dzień?',
];

function getTodayQuestion(): string {
  return DAILY_QUESTIONS[new Date().getDay() % DAILY_QUESTIONS.length];
}

const ACCENT = 'rgba(160,120,255,0.9)';

export const QuickOracle: React.FC = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer]   = useState('');
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const question  = getTodayQuestion();

  const openOracle = useCallback(async () => {
    HapticsService.impact('light');
    setVisible(true);
    setAnswer('');
    setLoading(true);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 15 }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
    try {
      const state    = useAppStore.getState();
      const resp = await AiService.chatWithOracle(
        [{ role: 'user', content: question }],
        (state as any).language ?? 'pl'
      )
      setAnswer(typeof resp === 'string' ? resp : (resp as any)?.text ?? '');
    } catch {
      setAnswer(t('oracle.quickFallback', { defaultValue: 'Oracle is quiet today. Return later for an answer.' }));
    } finally {
      setLoading(false);
    }
  }, [question]);

  const closeOracle = () => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 0.85, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  return (
    <>
      <Pressable onPress={openOracle} style={styles.fab}>
        <Typography style={{ fontSize: 20, color: '#fff' }}>✦</Typography>
      </Pressable>
      <Modal visible={visible} transparent statusBarTranslucent animationType="none" onRequestClose={closeOracle}>
        <Pressable style={styles.backdrop} onPress={closeOracle}>
          <Animated.View style={[styles.sheet, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.content}>
              <Typography variant="caption" style={{ textAlign: 'center', letterSpacing: 2, opacity: 0.6 }}>
                PYTANIE DNIA
              </Typography>
              <Typography variant="heading" style={{ textAlign: 'center', marginTop: 8 }}>
                {question}
              </Typography>
              <View style={styles.divider} />
              {loading ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <ActivityIndicator color={ACCENT} />
                  <Typography variant="caption" style={{ marginTop: 8, opacity: 0.6 }}>
                    {t('oracle.loading')}
                  </Typography>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  <Typography variant="body" style={{ textAlign: 'center', lineHeight: 26, opacity: 0.9 }}>
                    {answer}
                  </Typography>
                </ScrollView>
              )}
              <Pressable onPress={closeOracle} style={styles.closeBtn}>
                <Typography variant="caption" style={{ color: ACCENT }}>{t('common.close')}</Typography>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', bottom: 90, right: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(130,80,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 40 : 20,
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  content: { padding: 24 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  closeBtn: {
    marginTop: 20, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(160,120,255,0.5)', alignItems: 'center',
  },
});
