import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from './Typography';
import { layout } from '../core/theme/designSystem';
import { getResolvedTheme, isLightBg } from '../core/theme/tokens';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';

interface PremiumDatePickerSheetProps {
  visible: boolean;
  mode: 'date' | 'time';
  title: string;
  description?: string;
  value: Date;
  maximumDate?: Date;
  minimumDate?: Date;
  onCancel: () => void;
  onConfirm: (nextValue: Date) => void;
}

export const PremiumDatePickerSheet = ({
  visible,
  mode,
  title,
  description,
  value,
  maximumDate,
  minimumDate,
  onCancel,
  onConfirm,
}: PremiumDatePickerSheetProps) => {
  const { t } = useTranslation();
  const { currentTheme, isLight } = useTheme();
  const insets = useSafeAreaInsets();
  const { language } = useAppStore();
  const cardBg = isLight ? 'rgba(255,255,255,0.98)' : 'rgba(15,12,28,0.97)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.22)' : 'rgba(255,255,255,0.12)';
  const [draftValue, setDraftValue] = useState(value);
  const pickerLocale = language === 'pl' ? 'pl-PL' : undefined;
  const summary = mode === 'date'
    ? draftValue.toLocaleDateString(pickerLocale || undefined, { day: 'numeric', month: 'long', year: 'numeric' })
    : draftValue.toLocaleTimeString(pickerLocale || undefined, { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (visible) {
      setDraftValue(value);
    }
  }, [value, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(3, 5, 11, 0.74)' }]}>
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={styles.dismissLayer} onPress={onCancel} />
          <View style={[styles.sheet, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: StyleSheet.hairlineWidth, borderRadius: 24 }]}>
            <Typography variant="premiumLabel" color={currentTheme.primary}>
              {title}
            </Typography>
            {description ? (
              <Typography variant="bodySmall" style={styles.description}>
                {description}
              </Typography>
            ) : null}
            <View style={[styles.summaryPill, { backgroundColor: currentTheme.primary + '10', borderColor: currentTheme.primary + '22' }]}>
              <Typography variant="premiumLabel" color={currentTheme.primary}>
                {summary}
              </Typography>
            </View>
            <View
              style={[
                styles.pickerShell,
                {
                  backgroundColor: isLight ? '#FFFFFF' : '#0A0A14',
                  borderColor: currentTheme.glassBorder,
                },
              ]}
            >
              <DateTimePicker
                value={draftValue}
                mode={mode}
                display="spinner"
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                minuteInterval={1}
                onChange={(_event, nextValue) => {
                  if (nextValue) {
                    setDraftValue(nextValue);
                  }
                }}
                themeVariant={isLight ? 'light' : 'dark'}
                accentColor={currentTheme.primary}
                textColor={isLight ? '#1A1410' : '#F0EBE2'}
                {...(pickerLocale ? ({ locale: pickerLocale } as any) : {})}
              />
            </View>
            <View style={styles.actions}>
              <Pressable
                onPress={onCancel}
                style={[
                  styles.actionButton,
                  {
                    borderColor: currentTheme.glassBorder,
                    backgroundColor: currentTheme.glassBackground,
                  },
                ]}
              >
                <Typography variant="microLabel" color={currentTheme.primary}>
                  {t('common.cancel')}
                </Typography>
              </Pressable>
              <Pressable
                onPress={() => onConfirm(draftValue)}
                style={[
                  styles.actionButton,
                  {
                    borderColor: currentTheme.primary,
                    backgroundColor: currentTheme.primary,
                  },
                ]}
              >
                <Typography variant="microLabel" color={currentTheme.background}>
                  {t('common.confirm', { defaultValue: 'Confirm' })}
                </Typography>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 5, 11, 0.74)',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: layout.padding.screen,
  },
  dismissLayer: {
    flex: 1,
  },
  sheet: {
    padding: 18,
  },
  description: {
    marginTop: 10,
    lineHeight: 22,
    opacity: 0.82,
  },
  pickerShell: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 280,
  },
  summaryPill: {
    marginTop: 14,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
});
