// src/store/useOracleHistoryStore.ts
// Historia sesji Oracle — zapisuje podsumowanie każdej sesji
// Import w OraclePortalScreen jako lista historii
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OracleSession {
  id: string;
  date: string;       // ISO
  preview: string;    // pierwsze 100 znaków odpowiedzi
  mode: string;       // 'balanced' | 'brief' | 'deep'
  messageCount: number;
}

interface OracleHistoryState {
  sessions: OracleSession[];
  addSession: (session: Omit<OracleSession, 'id'>) => void;
  clearHistory: () => void;
}

export const useOracleHistoryStore = create<OracleHistoryState>()(
  persist(
    (set) => ({
      sessions: [],
      addSession: (session) =>
        set((s) => ({
          sessions: [
            {
              ...session,
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            },
            ...s.sessions.slice(0, 49), // max 50 sesji
          ],
        })),
      clearHistory: () => set({ sessions: [] }),
    }),
    {
      name: 'oracle-history-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// -------------------------------------------------------
// src/components/OracleSessionHistory.tsx
// Dodaj do OraclePortalScreen (sekcja na dole ekranu)
// -------------------------------------------------------

// Paste this into a separate file: src/components/OracleSessionHistory.tsx

/*
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useOracleHistoryStore } from '../store/useOracleHistoryStore';
import { Typography } from './Typography';
import { GlassCard } from './GlassCard';
import { HapticsService } from '../core/services/haptics.service';

const MODE_LABELS: Record<string, string> = {
  brief:    'Zwięźle',
  balanced: 'Balans',
  deep:     'Głęboko',
};

export const OracleSessionHistory: React.FC = () => {
  const sessions = useOracleHistoryStore((s) => s.sessions);

  if (sessions.length === 0) return null;

  return (
    <View style={{ marginTop: 24 }}>
      <Typography variant="sectionTitle" style={{ marginBottom: 12 }}>
        Historia sesji
      </Typography>
      {sessions.slice(0, 5).map((sess) => {
        const d = new Date(sess.date);
        const label = d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        return (
          <GlassCard key={sess.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={styles.meta}>
                <Typography variant="caption" muted style={{ fontSize: 10 }}>{label}</Typography>
                <View style={styles.modePill}>
                  <Typography variant="caption" style={{ fontSize: 10, opacity: 0.7 }}>
                    {MODE_LABELS[sess.mode] ?? sess.mode}
                  </Typography>
                </View>
              </View>
              <Typography variant="bodySmall" style={{ marginTop: 4, opacity: 0.8 }} numberOfLines={2}>
                {sess.preview}
              </Typography>
            </View>
          </GlassCard>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    padding: 14,
    marginBottom: 8,
    borderRadius: 14,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
  },
});
*/
