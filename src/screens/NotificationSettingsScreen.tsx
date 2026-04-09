// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Switch, StyleSheet, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, Bell, BellOff, Clock, Moon, Star, Flame, BookOpen, Users, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useAppStore } from '../store/useAppStore';

// ── Always dark ──────────────────────────────────────────────────────────────
const isLight = false;
const BG = '#07080E';
const ACCENT = '#A78BFA';
const CARD_BG = 'rgba(255,255,255,0.05)';
const CARD_BORDER = 'rgba(167,139,250,0.18)';
const TEXT_PRIMARY = '#F5F1EA';
const TEXT_SUB = 'rgba(245,241,234,0.52)';

// ── Category definitions ─────────────────────────────────────────────────────
const NOTIF_CATEGORIES = [
  {
    id: 'daily_horoscope',
    icon: Star,
    label: 'Dzienny Horoskop',
    desc: 'Twój codzienny horoskop AI',
    color: '#F59E0B',
    defaultTime: '09:00',
    canSetTime: true,
  },
  {
    id: 'moon_phase',
    icon: Moon,
    label: 'Fazy Księżyca',
    desc: 'Alerty o pełni i nowiu',
    color: '#818CF8',
    defaultTime: '08:00',
    canSetTime: false,
  },
  {
    id: 'ritual_reminder',
    icon: Flame,
    label: 'Rytuały',
    desc: 'Przypomnienia o zaplanowanych rytuałach',
    color: '#EF4444',
    defaultTime: '19:00',
    canSetTime: true,
  },
  {
    id: 'oracle_message',
    icon: Zap,
    label: 'Wiadomość Wyroczni',
    desc: 'Codzienna wiadomość od Oracle',
    color: '#A78BFA',
    defaultTime: '07:30',
    canSetTime: true,
  },
  {
    id: 'journal_prompt',
    icon: BookOpen,
    label: 'Dziennik',
    desc: 'Przypomnienie o pisaniu dziennika',
    color: '#34D399',
    defaultTime: '21:00',
    canSetTime: true,
  },
  {
    id: 'community_updates',
    icon: Users,
    label: 'Wspólnota',
    desc: 'Nowe rytuały live i wyzwania',
    color: '#60A5FA',
    defaultTime: null,
    canSetTime: false,
  },
  {
    id: 'challenge_checkin',
    icon: Flame,
    label: 'Wyzwania',
    desc: 'Przypomnienie o check-inie',
    color: '#F472B6',
    defaultTime: '18:00',
    canSetTime: true,
  },
] as const;

type CategoryId = typeof NOTIF_CATEGORIES[number]['id'];

const TIME_OPTIONS = [
  '07:00', '07:30', '08:00', '09:00', '10:00',
  '12:00', '18:00', '19:00', '20:00', '21:00', '22:00',
];

// ── Helper to build default states ──────────────────────────────────────────
const buildDefaultEnabled = (): Record<string, boolean> => {
  const obj: Record<string, boolean> = {};
  NOTIF_CATEGORIES.forEach(c => { obj[c.id] = true; });
  return obj;
};

const buildDefaultTimes = (): Record<string, string> => {
  const obj: Record<string, string> = {};
  NOTIF_CATEGORIES.forEach(c => { if (c.defaultTime) obj[c.id] = c.defaultTime; });
  return obj;
};

// ── Main component ───────────────────────────────────────────────────────────
export const NotificationSettingsScreen = ({ navigation }: any) => {
  // Theme (always dark per spec, but hook still called at top)
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(buildDefaultEnabled());
  const [times, setTimes] = useState<Record<string, string>>(buildDefaultTimes());

  // ── Check permissions on mount ────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    Notifications.getPermissionsAsync().then(result => {
      if (mounted) setPermissionStatus(result.status);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // ── Request permission ────────────────────────────────────────────────────
  const requestPermission = useCallback(async () => {
    try {
      const result = await Notifications.requestPermissionsAsync();
      setPermissionStatus(result.status);
    } catch {}
  }, []);

  // ── Schedule notification ─────────────────────────────────────────────────
  const scheduleNotification = useCallback(async (id: string, label: string, desc: string, time: string) => {
    try {
      const [hourStr, minuteStr] = time.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      await Notifications.scheduleNotificationAsync({
        content: { title: label, body: desc, sound: true },
        trigger: { hour, minute, repeats: true },
      });
    } catch {}
  }, []);

  // ── Toggle category ───────────────────────────────────────────────────────
  const toggleCategory = useCallback((id: string, label: string, desc: string) => {
    setEnabled(prev => {
      const next = !prev[id];
      if (next) {
        const cat = NOTIF_CATEGORIES.find(c => c.id === id);
        const time = times[id] || cat?.defaultTime;
        if (time) {
          scheduleNotification(id, label, desc, time);
        }
      }
      return { ...prev, [id]: next };
    });
  }, [times, scheduleNotification]);

  // ── Show time picker ──────────────────────────────────────────────────────
  const showTimePicker = useCallback((id: string, label: string, desc: string) => {
    const buttons = TIME_OPTIONS.map(t => ({
      text: `⏰ ${t}`,
      onPress: () => {
        setTimes(prev => ({ ...prev, [id]: t }));
        scheduleNotification(id, label, desc, t);
      },
    }));
    buttons.push({ text: 'Anuluj', onPress: () => {}, style: 'cancel' } as any);
    Alert.alert('Wybierz godzinę', `Kiedy powiadamiać o: ${label}`, buttons);
  }, [scheduleNotification]);

  // ── Save settings ─────────────────────────────────────────────────────────
  const saveSettings = useCallback(() => {
    Alert.alert(t('notifSettings.zapisano', 'Zapisano'), t('notifSettings.ustawienia_powiadomie_zostaly_zaktu', 'Ustawienia powiadomień zostały zaktualizowane.'));
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  const permissionDenied = permissionStatus === 'denied' || permissionStatus === 'undetermined';

  return (
    <SafeAreaView style={sh.safe} edges={['top']}>
      {/* Background */}
      <LinearGradient
        colors={['#07080E', '#0D0E1A', '#07080E']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={sh.header}>
        <Pressable
          onPress={() => goBackOrToMainTab(navigation, 'Portal')}
          style={sh.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft color={ACCENT} size={22} strokeWidth={2} />
        </Pressable>
        <View style={sh.headerCenter}>
          <Bell color={ACCENT} size={16} strokeWidth={1.8} style={{ marginRight: 7 }} />
          <Text style={sh.headerTitle}>{t('notifSettings.powiadomie', 'POWIADOMIENIA')}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={sh.scroll}
        contentContainerStyle={sh.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Permission banner ── */}
        {permissionDenied && (
          <Animated.View entering={FadeInDown.delay(0).duration(400)}>
            <LinearGradient
              colors={['rgba(239,68,68,0.18)', 'rgba(239,68,68,0.08)']}
              style={sh.permBanner}
            >
              <View style={{ flex: 1 }}>
                <Text style={sh.permTitle}>{t('notifSettings.powiadomie_wylaczone', '🔕 Powiadomienia wyłączone')}</Text>
                <Text style={sh.permDesc}>{t('notifSettings.wlacz_powiadomie_aby_otrzymywac_alerty', 'Włącz powiadomienia, aby otrzymywać alerty i przypomnienia.')}</Text>
              </View>
              <Pressable
                onPress={requestPermission}
                style={({ pressed }) => [sh.permBtn, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Text style={sh.permBtnText}>{t('notifSettings.wlacz', 'Włącz')}</Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        )}

        {/* ── Master toggle ── */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={sh.masterCard}>
          <View style={sh.masterLeft}>
            {masterEnabled
              ? <Bell color={ACCENT} size={22} strokeWidth={1.8} />
              : <BellOff color='rgba(245,241,234,0.38)' size={22} strokeWidth={1.8} />
            }
            <View style={{ marginLeft: 14 }}>
              <Text style={sh.masterLabel}>{t('notifSettings.wszystkie_powiadomie', 'Wszystkie powiadomienia')}</Text>
              <Text style={sh.masterSub}>{masterEnabled ? 'Aktywne' : 'Wyciszone'}</Text>
            </View>
          </View>
          <Switch
            value={masterEnabled}
            onValueChange={setMasterEnabled}
            trackColor={{ false: 'rgba(255,255,255,0.10)', true: ACCENT + 'AA' }}
            thumbColor={masterEnabled ? ACCENT : 'rgba(255,255,255,0.50)'}
          />
        </Animated.View>

        {/* ── Category rows ── */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={sh.section}>
          <Text style={sh.sectionTitle}>{t('notifSettings.kategorie', 'KATEGORIE')}</Text>
          {NOTIF_CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            const isOn = masterEnabled && enabled[cat.id];
            const time = times[cat.id] || (cat.defaultTime ?? null);
            return (
              <Animated.View
                key={cat.id}
                entering={FadeInDown.delay(140 + idx * 50).duration(380)}
                style={[sh.categoryRow, idx < NOTIF_CATEGORIES.length - 1 && sh.rowBorder]}
              >
                {/* Icon + text */}
                <View style={sh.catLeft}>
                  <View style={[sh.iconCircle, { backgroundColor: cat.color + '22', borderColor: cat.color + '44' }]}>
                    <Icon color={cat.color} size={17} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[sh.catLabel, !masterEnabled && sh.dimText]}>{cat.label}</Text>
                    <Text style={sh.catDesc}>{cat.desc}</Text>
                    {/* Time pill */}
                    {cat.canSetTime && enabled[cat.id] && masterEnabled && time && (
                      <Pressable
                        onPress={() => showTimePicker(cat.id, cat.label, cat.desc)}
                        style={sh.timePill}
                      >
                        <Clock color={ACCENT} size={11} strokeWidth={2} style={{ marginRight: 4 }} />
                        <Text style={sh.timePillText}>{time}</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
                {/* Switch */}
                <Switch
                  value={isOn}
                  disabled={!masterEnabled}
                  onValueChange={() => toggleCategory(cat.id, cat.label, cat.desc)}
                  trackColor={{ false: 'rgba(255,255,255,0.10)', true: cat.color + 'AA' }}
                  thumbColor={isOn ? cat.color : 'rgba(255,255,255,0.45)'}
                />
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* ── Save button ── */}
        <Animated.View entering={FadeInDown.delay(560).duration(400)} style={{ marginTop: 28, marginHorizontal: 2 }}>
          <Pressable
            onPress={saveSettings}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <LinearGradient
              colors={['#7C3AED', '#A78BFA', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={sh.saveBtn}
            >
              <Bell color="#FFFFFF" size={17} strokeWidth={2} style={{ marginRight: 8 }} />
              <Text style={sh.saveBtnText}>{t('notifSettings.zapisz_ustawienia', 'Zapisz ustawienia')}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <EndOfContentSpacer size="standard" />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const sh = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(167,139,250,0.12)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(167,139,250,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.20)',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.5,
    color: TEXT_PRIMARY,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 40,
  },
  // Permission banner
  permBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.30)',
  },
  permTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FCA5A5',
    marginBottom: 4,
  },
  permDesc: {
    fontSize: 12,
    color: 'rgba(252,165,165,0.70)',
    lineHeight: 17,
  },
  permBtn: {
    marginLeft: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.50)',
  },
  permBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FCA5A5',
  },
  // Master toggle
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  masterLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  masterLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 3,
  },
  masterSub: {
    fontSize: 12,
    color: TEXT_SUB,
  },
  // Section
  section: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: ACCENT,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 4,
  },
  // Category row
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(167,139,250,0.10)',
  },
  catLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 2,
  },
  catLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  catDesc: {
    fontSize: 12,
    color: TEXT_SUB,
    lineHeight: 16,
  },
  dimText: {
    color: 'rgba(245,241,234,0.32)',
  },
  // Time pill
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(167,139,250,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.28)',
  },
  timePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: 0.3,
  },
  // Save button
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
