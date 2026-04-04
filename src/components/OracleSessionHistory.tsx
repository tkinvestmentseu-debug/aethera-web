import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { useOracleHistoryStore } from '../store/useOracleHistoryStore';
import { Typography } from './Typography';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';

const MODE_LABELS: Record<string, string> = {
  brief:    'Zwiezle',
  balanced: 'Balans',
  deep:     'Gleboko',
};

export const OracleSessionHistory: React.FC = () => {
  const { t } = useTranslation();
  const { themeName } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';

  const sessions = useOracleHistoryStore((s) => s.sessions);

  if (sessions.length === 0) return null;

  return (
    <View style={{ marginTop: 24 }}>
      <Typography variant="title" style={{ marginBottom: 12 }}>
        {t('oracleSessionHistory.title', { defaultValue: 'Historia sesji' })}
      </Typography>
      {sessions.slice(0, 5).map((sess) => {
        const d = new Date(sess.date);
        const lang = i18n.language || 'pl';
        const locCode = lang.startsWith('en') ? 'en-US' : lang.startsWith('pl') ? 'pl-PL' : `${lang}-${lang.toUpperCase()}`;
        const label = d.toLocaleString(locCode, {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        });
        return (
          <View key={sess.id} style={[styles.row, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: StyleSheet.hairlineWidth }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.meta}>
                <Typography variant="caption" muted style={{ fontSize: 10 }}>{label}</Typography>
                <View style={styles.modePill}>
                  <Typography variant="caption" style={{ fontSize: 10, opacity: 0.7 }}>
                    {t(`oracleSessionHistory.modes.${sess.mode}`, { defaultValue: MODE_LABELS[sess.mode] ?? sess.mode })}
                  </Typography>
                </View>
              </View>
              <Typography variant="bodySmall" style={{ marginTop: 4, opacity: 0.8 }} numberOfLines={2}>
                {sess.preview}
              </Typography>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { padding: 14, marginBottom: 8, borderRadius: 14 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modePill: {
    paddingHorizontal: 8, paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6,
  },
});
