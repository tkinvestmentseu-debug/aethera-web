// src/core/services/notifications.service.ts
// Reminder notifications — poranny rytuał + wieczorna refleksja
// Użyj w ProfileScreen sekcja "Przypomnienia"
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'reminder_prefs_v1';

export interface ReminderPrefs {
  morningEnabled: boolean;
  morningHour: number;
  morningMinute: number;
  eveningEnabled: boolean;
  eveningHour: number;
  eveningMinute: number;
}

const DEFAULT_PREFS: ReminderPrefs = {
  morningEnabled: false,
  morningHour: 8,
  morningMinute: 0,
  eveningEnabled: false,
  eveningHour: 21,
  eveningMinute: 0,
};

const MORNING_MESSAGES = [
  'Dzień zaczyna się od intencji ✦',
  'Co dzisiaj chcesz stworzyć? 🌅',
  'Zacznij dzień z Aethera 🔮',
  'Twój poranny rytuał czeka ☀️',
];

const EVENING_MESSAGES = [
  'Czas na wieczorną refleksję 🌙',
  'Co dziś przeżyłeś? Zapisz to ✦',
  'Zamknij dzień z wdzięcznością 🕯️',
  'Oracle czeka na twoje przemyślenia 🔮',
];

function todayMessage(pool: string[]): string {
  return pool[new Date().getDay() % pool.length];
}

export const NotificationsService = {
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async loadPrefs(): Promise<ReminderPrefs> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  },

  async savePrefs(prefs: ReminderPrefs): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    await NotificationsService.reschedule(prefs);
  },

  async reschedule(prefs: ReminderPrefs): Promise<void> {
    // Anuluj stare
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (prefs.morningEnabled) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'morning_ritual',
        content: {
          title: 'Aethera ✦',
          body: todayMessage(MORNING_MESSAGES),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: prefs.morningHour,
          minute: prefs.morningMinute,
        },
      });
    }

    if (prefs.eveningEnabled) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'evening_reflection',
        content: {
          title: 'Aethera 🌙',
          body: todayMessage(EVENING_MESSAGES),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: prefs.eveningHour,
          minute: prefs.eveningMinute,
        },
      });
    }
  },
};

// -------------------------------------------------------
// src/components/ReminderSettings.tsx
// Dodaj do ProfileScreen jako osobna sekcja
// -------------------------------------------------------
/*
import React, { useEffect, useState } from 'react';
import { Platform, Switch, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { Typography } from './Typography';
import { NotificationsService, ReminderPrefs } from '../core/services/notifications.service';
import { useTheme } from '../core/theme/designSystem';

export const ReminderSettings: React.FC = () => {
  const { colors } = useTheme();
  const [prefs, setPrefs] = useState<ReminderPrefs | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    void NotificationsService.loadPrefs().then(setPrefs);
    void NotificationsService.requestPermission().then(setHasPermission);
  }, []);

  if (!prefs) return null;

  const update = async (partial: Partial<ReminderPrefs>) => {
    const next = { ...prefs, ...partial };
    setPrefs(next);
    if (hasPermission) {
      await NotificationsService.savePrefs(next);
    }
  };

  return (
    <View style={{ marginBottom: 24 }}>
      <Typography variant="sectionTitle" style={{ marginBottom: 12 }}>
        🔔 Przypomnienia
      </Typography>
      <GlassCard style={{ padding: 16, borderRadius: 18, gap: 16 }}>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Typography variant="labelSmall">Poranny rytuał</Typography>
            <Typography variant="caption" muted>
              {prefs.morningHour.toString().padStart(2,'0')}:{prefs.morningMinute.toString().padStart(2,'0')}
            </Typography>
          </View>
          <Switch
            value={prefs.morningEnabled}
            onValueChange={(v) => update({ morningEnabled: v })}
            trackColor={{ true: colors.accent }}
          />
        </View>

        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Typography variant="labelSmall">Wieczorna refleksja</Typography>
            <Typography variant="caption" muted>
              {prefs.eveningHour.toString().padStart(2,'0')}:{prefs.eveningMinute.toString().padStart(2,'0')}
            </Typography>
          </View>
          <Switch
            value={prefs.eveningEnabled}
            onValueChange={(v) => update({ eveningEnabled: v })}
            trackColor={{ true: colors.accent }}
          />
        </View>

        {!hasPermission && (
          <Typography variant="caption" style={{ color: '#FF6B6B', marginTop: 4 }}>
            Zezwól na powiadomienia w ustawieniach systemu
          </Typography>
        )}
      </GlassCard>
    </View>
  );
};
*/
