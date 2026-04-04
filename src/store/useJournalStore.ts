import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TarotCardData, TarotSpread } from '../features/tarot/types';

export type JournalEntryType = 'tarot' | 'matrix' | 'affirmation' | 'dream' | 'reflection' | 'gratitude' | 'shadow_work';

export interface JournalEntry {
  id: string;
  date: string;
  type: JournalEntryType;
  title: string;
  question?: string;
  spread?: TarotSpread;
  cards?: { slotIndex: number, card: TarotCardData, isReversed: boolean }[];
  interpretation?: string;
  isFavorite: boolean;
  content?: string; // For reflection/dreams
  mood?: 'excellent' | 'good' | 'neutral' | 'bad' | 'terrible' | string;
  energyLevel?: number; // 1-100
  tags?: string[];
}

interface JournalState {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, 'id' | 'date' | 'isFavorite'>) => void;
  updateEntry: (id: string, patch: Partial<Omit<JournalEntry, 'id' | 'date' | 'isFavorite'>>) => void;
  deleteEntry: (id: string) => void;
  toggleFavorite: (id: string) => void;
  getEntriesByType: (type: JournalEntryType | 'all') => JournalEntry[];
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (entryData) => set((state) => ({
        entries: [
          {
            ...entryData,
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            isFavorite: false,
          },
          ...state.entries
        ]
      })),
      updateEntry: (id, patch) => set((state) => ({
        entries: state.entries.map(e => e.id === id ? { ...e, ...patch } : e)
      })),
      getEntriesByType: (type) => type === 'all' ? get().entries : get().entries.filter((e: any) => e.type === type),
      toggleFavorite: (id) => set((state) => ({
        entries: state.entries.map(e => e.id === id ? { ...e, isFavorite: !e.isFavorite } : e)
      })),
      deleteEntry: (id) => set((state) => ({
        entries: state.entries.filter(e => e.id !== id)
      }))
    }),
    {
      name: 'aethera-journal',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
