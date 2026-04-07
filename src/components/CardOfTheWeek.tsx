// src/components/CardOfTheWeek.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography } from './Typography';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { MAJOR_ARCANA } from '../features/tarot/data/cards';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { useTheme } from '../core/hooks/useTheme';
const STORAGE_KEY = 'card_of_week_v1';

interface WeekCardData {
  weekId: string;
  cardIndex: number;
  interpretation: string;
}

function getWeekId(): string {
  const d   = new Date();
  const jan = new Date(d.getFullYear(), 0, 1);
  const w   = Math.ceil((((d.getTime() - jan.getTime()) / 86400000) + jan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${w}`;
}

function pickCard(weekId: string, total: number): number {
  let hash = 0;
  for (let i = 0; i < weekId.length; i++) {
    hash = (hash * 31 + weekId.charCodeAt(i)) >>> 0;
  }
  return hash % total;
}

const ACCENT = 'rgba(160,120,255,0.9)';

export const CardOfTheWeek: React.FC = () => {
  const { t } = useTranslation();
  const { isLight } = useTheme();
  const cardBg = isLight ? 'rgba(122,95,54,0.08)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)';

  const [data, setData]         = useState<WeekCardData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lang = i18n.language?.startsWith('en') ? 'en' : 'pl';

  const cards: any[] = (typeof MAJOR_ARCANA !== 'undefined' ? (MAJOR_ARCANA as any) : null) ?? [];

  const load = useCallback(async () => {
    const weekId = getWeekId();
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored: WeekCardData = JSON.parse(raw) as WeekCardData;
        if (stored.weekId === weekId) { setData(stored); return; }
      }
      const total     = cards.length > 0 ? cards.length : 78;
      const cardIndex = pickCard(weekId, total);
      const card      = cards[cardIndex];
      if (!card) return;
      setLoading(true);
      const cardLabel = String(card.name ?? card.title ?? (lang === 'en' ? 'unknown' : 'nieznana'));
      const msg = lang === 'en'
        ? `Provide a short weekly tarot interpretation in 3-4 sentences for the card: ${cardLabel}. How will this energy show up during the week? Language: English.`
        : `Podaj krótką (3-4 zdania) interpretację tygodniową karty: ${cardLabel}. Jak ta energia przejawi się w ciągu tygodnia? Język: polski.`;
      const interpretation: string = await AiService.chatWithOracle(
        [{ role: 'user', content: msg }],
        lang
      )
      const nd: WeekCardData = { weekId, cardIndex, interpretation: String(interpretation) };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nd));
      setData(nd);
    } catch {
      const cardIndex = pickCard(weekId, 78);
      setData({ weekId, cardIndex, interpretation: lang === 'en' ? 'This card brings an important lesson for the week.' : 'Ta karta przynosi w tym tygodniu ważną lekcję.' });
    } finally {
      setLoading(false);
    }
  }, [cards, lang]);

  useEffect(() => { void load(); }, [load]);

  if (!data && !loading) return null;

  const card = cards[data?.cardIndex ?? 0];
  const cardName  = card ? String(card.name ?? card.title ?? (lang === 'en' ? 'Card' : 'Karta')) : (lang === 'en' ? 'Card of the Week' : 'Karta Tygodnia');
  const cardEmoji = card ? String(card.emoji ?? card.symbol ?? '🃏') : '🃏';

  return (
    <View style={{ marginBottom: 20 }}>
      <Typography variant="heading" style={{ marginBottom: 12, marginLeft: 4 }}>
        {t('cardOfWeek.heading', { defaultValue: lang === 'en' ? '✦ Card of the Week' : '✦ Karta Tygodnia' })}
      </Typography>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: StyleSheet.hairlineWidth }]}>
        {loading ? (
          <View style={{ alignItems: 'center', padding: 24 }}>
            <ActivityIndicator color={ACCENT} />
            <Typography variant="caption" style={{ marginTop: 8, opacity: 0.6 }}>
              {t('cardOfWeek.loading', { defaultValue: lang === 'en' ? 'Drawing the card of the week...' : 'Losuję kartę tygodnia...' })}
            </Typography>
          </View>
        ) : (
          <Pressable onPress={() => { HapticsService.selection(); setExpanded((e) => !e); }}>
            <View style={styles.row}>
              <View style={styles.cardEmoji}>
                <Typography style={{ fontSize: 36 }}>{cardEmoji}</Typography>
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="caption" style={{ letterSpacing: 1.5, opacity: 0.6 }}>
                  {t('cardOfWeek.eyebrow', { defaultValue: lang === 'en' ? 'CARD OF THE WEEK' : 'KARTA TYGODNIA' })}
                </Typography>
                <Typography variant="heading" style={{ marginTop: 2 }}>
                  {cardName}
                </Typography>
                <Typography variant="caption" style={{ color: ACCENT, marginTop: 4 }}>
                  {expanded
                    ? t('cardOfWeek.collapse', { defaultValue: lang === 'en' ? 'Collapse ▲' : 'Zwiń ▲' })
                    : t('cardOfWeek.expand', { defaultValue: lang === 'en' ? 'Read interpretation ▼' : 'Czytaj interpretację ▼' })}
                </Typography>
              </View>
            </View>
            {expanded && (
              <View>
                <View style={[styles.divider, { backgroundColor: isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)' }]} />
                <Typography variant="body" style={{ lineHeight: 24, opacity: 0.88 }}>
                  {data?.interpretation}
                </Typography>
              </View>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card:      { padding: 16, borderRadius: 20 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cardEmoji: {
    width: 60, height: 60, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  divider: { height: 1, marginVertical: 14 },
});
