import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TarotCardData, TarotSpread } from '../types';
import { ALL_CARDS } from '../data/cards';
import { AVAILABLE_TAROT_DECKS } from '../data/decks';

export interface SavedReading {
  id: string;
  date: string;
  spread: TarotSpread;
  deckId: string;
  cards: { slotIndex: number, card: TarotCardData, isReversed: boolean }[];
  question: string;
  aiInterpretation: string;
  moodBefore?: string;
}

export interface DailyTarotDraw {
  date: string;
  deckId: string;
  card: TarotCardData;
  isReversed: boolean;
}

interface TarotState {
  activeSpread: TarotSpread | null;
  drawnCards: { slotIndex: number, card: TarotCardData, isReversed: boolean }[];
  userQuestion: string;
  moodBefore: string;
  aiInterpretation: string;
  isGenerating: boolean;
  pastReadings: SavedReading[];
  selectedDeckId: string;
  dailyDraw: DailyTarotDraw | null;
  
  setActiveSpread: (spread: TarotSpread) => void;
  setUserQuestion: (question: string) => void;
  setMoodBefore: (mood: string) => void;
  drawCard: (slotIndex: number) => { slotIndex: number; card: TarotCardData; isReversed: boolean } | null;
  setAIInterpretation: (text: string) => void;
  saveReading: () => void;
  setSelectedDeck: (deckId: string) => void;
  drawDailyCard: () => DailyTarotDraw;
  clearExpiredDailyDraw: () => void;
  clearDailyDraw: () => void;
  deleteReading: (id: string) => void;
  resetReading: () => void;
}

const getTodayKey = () => new Date().toISOString().split('T')[0];

const drawUniqueCard = (excludedIds: string[] = []) => {
  const availableCards = ALL_CARDS.filter((card) => !excludedIds.includes(card.id));
  const randomIndex = Math.floor(Math.random() * availableCards.length);
  const card = availableCards[randomIndex];
  const isReversed = Math.random() > 0.7;

  return {
    card,
    isReversed,
  };
};

export const useTarotStore = create<TarotState>()(
  persist(
    (set, get) => ({
      activeSpread: null,
      drawnCards: [],
      userQuestion: '',
      moodBefore: '',
      aiInterpretation: '',
      isGenerating: false,
      pastReadings: [],
      selectedDeckId: AVAILABLE_TAROT_DECKS[0].id,
      dailyDraw: null,
      
      setActiveSpread: (spread) => set({ activeSpread: spread, drawnCards: [], aiInterpretation: '', userQuestion: '', moodBefore: '' }),
      setUserQuestion: (question) => set({ userQuestion: question }),
      setMoodBefore: (mood) => set({ moodBefore: mood }),
      setAIInterpretation: (text) => set({ aiInterpretation: text, isGenerating: false }),
      setSelectedDeck: (deckId) => set({ selectedDeckId: deckId }),
      
      drawCard: (slotIndex) => {
        const { drawnCards } = get();
        if (drawnCards.find(d => d.slotIndex === slotIndex)) return null;

        const drawn = drawUniqueCard(drawnCards.map((entry) => entry.card.id));
        const payload = { slotIndex, ...drawn };

        set({
          drawnCards: [...drawnCards, payload]
        });
        return payload;
      },

      saveReading: () => {
        const { activeSpread, drawnCards, userQuestion, aiInterpretation, moodBefore, pastReadings, selectedDeckId } = get();
        if (!activeSpread || drawnCards.length === 0) return;
        
        const newReading: SavedReading = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          spread: activeSpread,
          deckId: selectedDeckId,
          cards: drawnCards,
          question: userQuestion,
          aiInterpretation,
          moodBefore
        };
        
        set({ pastReadings: [newReading, ...pastReadings] });
      },

      drawDailyCard: () => {
        const today = getTodayKey();
        const { dailyDraw, selectedDeckId } = get();
        if (dailyDraw?.date === today) {
          return dailyDraw;
        }

        const drawn = drawUniqueCard();
        const nextDailyDraw: DailyTarotDraw = {
          date: today,
          deckId: selectedDeckId,
          ...drawn,
        };
        set({ dailyDraw: nextDailyDraw });
        return nextDailyDraw;
      },

      clearExpiredDailyDraw: () => {
        const today = getTodayKey();
        const { dailyDraw } = get();
        if (dailyDraw && dailyDraw.date !== today) {
          set({ dailyDraw: null });
        }
      },

      clearDailyDraw: () => set({ dailyDraw: null }),

      deleteReading: (id) => set((state) => ({
        pastReadings: state.pastReadings.filter((reading) => reading.id !== id),
      })),

      resetReading: () => set({ drawnCards: [], activeSpread: null, userQuestion: '', moodBefore: '', aiInterpretation: '' }),
    }),
    {
      name: 'aethera-tarot',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        pastReadings: state.pastReadings,
        selectedDeckId: state.selectedDeckId,
        dailyDraw: state.dailyDraw,
      }),
    }
  )
);
