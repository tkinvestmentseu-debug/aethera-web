import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { Typography } from './Typography';
import { NotificationsService, ReminderPrefs } from '../core/services/notifications.service';
import { getResolvedTheme } from '../core/theme/tokens';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

export const ReminderSettings: React.FC = () => {
  const { t } = useTranslation();
  const { themeName } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');
  const [prefs, setPrefs]                 = useState<ReminderPrefs | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    void NotificationsService.loadPrefs().then(setPrefs);
    void NotificationsService.requestPermission().then(setHasPermission);
  }, []);

  if (!prefs) return null;

  const update = async (partial: Partial<ReminderPrefs>) => {
    const next = { ...prefs, ...partial };
    setPrefs(next);
    if (hasPermission) await NotificationsService.savePrefs(next);
  };

  return (
    <View style={{ marginBottom: 24 }}>
      <Typography variant="title" style={{ marginBottom: 12 }}>
        {t('notifications.title')}
      </Typography>
      <View style={{
        padding: 16,
        borderRadius: 18,
        backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Typography variant="label">{t('notifications.morning_ritual', { defaultValue: 'Morning ritual' })}</Typography>
            <Typography variant="caption" muted>
              {prefs.morningHour.toString().padStart(2, '0')}:{prefs.morningMinute.toString().padStart(2, '0')}
            </Typography>
          </View>
          <Switch
            value={prefs.morningEnabled}
            onValueChange={(v) => update({ morningEnabled: v })}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#8050ff' }}
            thumbColor="#ffffff"
          />
        </View>
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Typography variant="label">{t('notifications.evening_reflection', { defaultValue: 'Evening reflection' })}</Typography>
            <Typography variant="caption" muted>
              {prefs.eveningHour.toString().padStart(2, '0')}:{prefs.eveningMinute.toString().padStart(2, '0')}
            </Typography>
          </View>
          <Switch
            value={prefs.eveningEnabled}
            onValueChange={(v) => update({ eveningEnabled: v })}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#8050ff' }}
            thumbColor="#ffffff"
          />
        </View>
        {!hasPermission && (
          <Typography variant="caption" style={{ color: '#FF6B6B', marginTop: 12 }}>
            {t('notifications.enableInSystem', { defaultValue: 'Allow notifications in system settings' })}
          </Typography>
        )}
      </View>
    </View>
  );
};
