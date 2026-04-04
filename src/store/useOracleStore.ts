import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OracleMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context?: string; // e.g. "from_tarot_reading"
}

export type OracleMode = 'gentle' | 'ceremonial' | 'direct' | 'mystical' | 'therapeutic';
export type OracleSessionKind = 'general' | 'morning' | 'evening' | 'crisis' | 'manifestation' | 'integration';

export interface OracleSession {
  id: string;
  startedAt: string;
  messages: OracleMessage[];
  title?: string;
  topic?: string;
  mode?: OracleMode;
  kind?: OracleSessionKind;
  source?: string;
}

interface OracleState {
  currentSession: OracleSession | null;
  pastSessions: OracleSession[];
  
  startSession: (
    initialMessage?: Omit<OracleMessage, 'id' | 'timestamp'>,
    topic?: string,
    metadata?: Pick<OracleSession, 'mode' | 'kind' | 'source'>
  ) => void;
  addMessage: (message: Omit<OracleMessage, 'id' | 'timestamp'>) => void;
  updateSessionMeta: (metadata: Partial<Pick<OracleSession, 'mode' | 'kind' | 'title' | 'source'>>) => void;
  endSession: () => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  clearHistory: () => void;
}

export const useOracleStore = create<OracleState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      pastSessions: [],

      startSession: (initialMessage, topic, metadata) => {
        const newSession: OracleSession = {
          id: Date.now().toString(),
          startedAt: new Date().toISOString(),
          messages: initialMessage ? [{
            ...initialMessage,
            id: Date.now().toString() + '_init',
            timestamp: new Date().toISOString()
          }] : [],
          topic,
          mode: metadata?.mode || 'gentle',
          kind: metadata?.kind || 'general',
          source: metadata?.source,
        };
        set({ currentSession: newSession });
      },

      addMessage: (msg) => {
        const { currentSession } = get();
        if (!currentSession) {
          get().startSession(msg as any);
          return;
        }
        
        const fullMessage: OracleMessage = {
          ...msg,
          id: Date.now().toString() + Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString()
        };

        set({
          currentSession: {
            ...currentSession,
            messages: [...currentSession.messages, fullMessage]
          }
        });
      },

      updateSessionMeta: (metadata) => {
        const { currentSession } = get();
        if (!currentSession) return;

        set({
          currentSession: {
            ...currentSession,
            ...metadata,
          }
        });
      },

      endSession: () => {
        const { currentSession, pastSessions } = get();
        if (currentSession && currentSession.messages.length > 0) {
          // generate a title based on the first user message if missing
          const title = currentSession.title || (currentSession.messages.find(m => m.role === 'user')?.content.substring(0, 30) ?? 'Nowa sesja') + '...';
          const sessionToSave = { ...currentSession, title };
          set({ 
            pastSessions: [sessionToSave, ...pastSessions],
            currentSession: null 
          });
        } else {
          set({ currentSession: null });
        }
      },

      loadSession: (sessionId) => {
        const { currentSession, pastSessions } = get();
        const targetSession = pastSessions.find((session) => session.id === sessionId);
        if (!targetSession) return;

        const nextPastSessions = pastSessions.filter((session) => session.id !== sessionId);

        if (currentSession && currentSession.messages.length > 0) {
          const title = currentSession.title || (currentSession.messages.find(m => m.role === 'user')?.content.substring(0, 30) ?? 'Nowa sesja') + '...';
          const archivedCurrent = { ...currentSession, title };
          set({
            currentSession: targetSession,
            pastSessions: [archivedCurrent, ...nextPastSessions],
          });
          return;
        }

        set({
          currentSession: targetSession,
          pastSessions: nextPastSessions,
        });
      },

      deleteSession: (sessionId) => set((state) => ({
        currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
        pastSessions: state.pastSessions.filter((session) => session.id !== sessionId),
      })),

      clearHistory: () => set({ pastSessions: [], currentSession: null }),
    }),
    {
      name: 'aethera-oracle',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
