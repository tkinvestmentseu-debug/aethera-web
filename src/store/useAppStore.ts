import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, ThemeName, ThemeMode, setActiveThemeMode, syncAutoThemePalette } from '../core/theme/tokens';
import i18n from '../core/i18n';
import { AmbientSoundscape, AudioRuntimeState, AudioService, BackgroundMusicCategory } from '../core/services/audio.service';
import { HapticsRuntimeState, HapticsService } from '../core/services/haptics.service';
import { FavoriteItem, PortalWidget, ReminderConfig, DEFAULT_PORTAL_WIDGETS } from '../features/portal/types';

export interface MeditationSession {
  id: string;
  date: string;
  durationMinutes: number;
  technique: string;
}

export interface BreathworkSession {
  id: string;
  date: string;
  durationMinutes: number;
  technique: string;
  cycles: number;
}

export interface ChakraEntry {
  id: string;
  date: string;
  chakraId: string;
  note?: string;
}

export interface ShadowSession {
  id: string;
  date: string;
  areaId: string;
}

export interface GratitudeEntry {
  id: string;
  date: string;
  items: string[];
  aiReflection?: string;
}

export interface LunarIntent {
  id: string;
  date: string;
  text: string;
  type: 'new_moon' | 'full_moon';
}

export interface IntentionCard {
  id: string;
  text: string;
  icon: string;
  color: string;
  createdAt: string;
  category?: string;
}

export interface SavedMantra {
  id: string;
  sanskrit: string;
  phonetic: string;
  meaning: string;
  affirmation: string;
  timing: string;
  intention: string;
  intentionColor: string;
  createdAt: number;
}

export interface AiForecastSection {
  title: string;
  body: string;
  color: string;
}

export interface AnnualForecastCache {
  year: number;
  personalYearNumber: number;
  sections: AiForecastSection[];
  generatedAt: number;
}

export interface AstroNoteEntry {
  id: string;
  template: string;
  text: string;
  date: string;
  aiInsight?: string;
}

export interface NightSymbolFavorite {
  id: string;
  addedAt: string;
}

export interface DailyAiContent {
  date: string;        // ISO date string 'YYYY-MM-DD'
  zodiacSign: string;  // e.g. 'Aquarius'
  horoscope: string;   // AI-generated horoscope text
  affirmation: string; // AI-generated affirmation
  ritualTip: string;   // short daily ritual tip
  generatedAt: number; // timestamp
}

interface AppState {
  themeName: ThemeName;
  themeMode: ThemeMode;
  language: string;
  languageChosen: boolean;
  isOnboarded: boolean;
  experience: {
    hapticsEnabled: boolean;
    touchSoundEnabled: boolean;
    backgroundMusicEnabled: boolean;
  musicVolume: number;
  ambientVolume: number;
    backgroundMusicCategory: BackgroundMusicCategory;
    ambientSoundscape: AmbientSoundscape;
    ritualCompletionSoundEnabled: boolean;
    motionStyle: 'minimal' | 'standard' | 'rich' | 'quiet';
    aiResponseLength: 'short' | 'medium' | 'deep';
    checkInEnabled: boolean;
    morningCheckInHour: number;
    eveningCheckInHour: number;
    backgroundStyle: 'subtleCelestial' | 'softMist' | 'sacredGeometry' | 'deepNight' | 'goldenRitual' | 'minimalClean' | 'moonGlow';
    narratorVoice: 'nova' | 'onyx';
    textScale: number;
  };
  userData: {
    name: string;
    lastName?: string;
    avatarUri?: string;
    birthDate: string;
    gender?: string;
    birthTime: string;
    birthPlace: string;
    relationshipMode: 'single' | 'in_relationship' | 'it_is_complicated' | '';
    interests: string[];
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | '';
    preferredTone: 'mystical' | 'gentle' | 'direct' | 'luxurious' | 'reflective' | '';
    primaryIntention: string;
    // New Spiritual Profile Fields
    spiritAnimal?: string;
    currentFocus?: string;
    spiritualGoals: string[];
    favoriteArchetypes: string[];
    preferredRitualCategory?: string;
    primaryGuidanceMode?: 'western_astrology' | 'chinese_astrology' | 'tarot' | 'mixed';
    soulPathState?: 'awakening' | 'healing' | 'manifesting' | 'protecting' | 'reflecting';
    // Auto-computed spiritual profile
    zodiacSign?: string;
    zodiacEmoji?: string;
    zodiacElement?: string;
    lifePathNumber?: number;
    ascendant?: string;
    ascendantEmoji?: string;
    profileRevealSeen?: boolean;
  };
  partnerData: {
    name: string;
    birthDate: string;
  } | null;
  streaks: {
    current: number;
    highest: number;
    lastCheckIn: string;
  };
  dailyProgress: {
    [date: string]: {
      tarotDrawn?: boolean;
      journalWritten?: boolean;
      ritualCompleted?: boolean;
      completedRituals?: string[];
      affirmationRead?: boolean;
      energyLevel?: number;
      energyScore?: number;
      mood?: string;
      gratitudeWritten?: boolean;
      checkInShownMorning?: boolean;
      checkInShownEvening?: boolean;
      mantraGenerated?: boolean;
      crystalGuideVisited?: boolean;
      habits?: Record<string, boolean>;
      morningRituals?: Record<string, boolean>;
      eveningRituals?: Record<string, boolean>;
    };
  };
  favoriteAffirmations: string[]; // IDs
  customAffirmations: { id: string; text: string; category: string }[];
  ambientSoundEnabled: boolean;
  audioRuntimeState: AudioRuntimeState;
  audioRuntimeMessage: string;
  hapticsRuntimeState: HapticsRuntimeState;
  hapticsRuntimeMessage: string;
  activeJourney: { id: string; currentDay: number; startDate: string } | null;

  // Daily cache - persisted for offline use
  dailyCache: {
    affirmation: string;
    affirmationDate: string;
    moonPhaseName: string;
    moonPhaseIcon: string;
    moonPhaseDate: string;
    soulMessage: string;
    soulMessageDate: string;
  };
  
  // Portal
  favoriteItems: FavoriteItem[];
  portalWidgets: PortalWidget[];
  scheduledReminders: ReminderConfig[];

  // Meditation
  meditationSessions: MeditationSession[];
  addMeditationSession: (s: MeditationSession) => void;
  deleteMeditationSession: (id: string) => void;

  // Breathwork
  breathworkSessions: BreathworkSession[];
  addBreathworkSession: (s: BreathworkSession) => void;
  deleteBreathworkSession: (id: string) => void;

  // Chakra
  chakraHistory: ChakraEntry[];
  chakraFocus: string | null;
  addChakraEntry: (e: ChakraEntry) => void;
  updateChakraEntry: (id: string, patch: Partial<ChakraEntry>) => void;
  deleteChakraEntry: (id: string) => void;
  setChakraFocus: (id: string | null) => void;

  // Shadow Work
  shadowWorkSessions: ShadowSession[];
  addShadowSession: (s: ShadowSession) => void;
  updateShadowSession: (id: string, patch: Partial<ShadowSession>) => void;
  deleteShadowSession: (id: string) => void;

  // Gratitude
  gratitudeEntries: GratitudeEntry[];
  addGratitudeEntry: (e: GratitudeEntry) => void;
  updateGratitudeEntry: (id: string, patch: Partial<GratitudeEntry>) => void;
  deleteGratitudeEntry: (id: string) => void;

  // Lunar
  lunarIntentions: LunarIntent[];
  addLunarIntent: (i: LunarIntent) => void;
  updateLunarIntent: (id: string, patch: Partial<LunarIntent>) => void;
  deleteLunarIntent: (id: string) => void;

  // Intention Cards
  intentionCards: IntentionCard[];
  addIntentionCard: (card: Omit<IntentionCard, 'id' | 'createdAt'>) => void;
  updateIntentionCard: (id: string, patch: Partial<IntentionCard>) => void;
  deleteIntentionCard: (id: string) => void;

  // Saved Mantras
  savedMantras: SavedMantra[];
  addSavedMantra: (m: SavedMantra) => void;
  removeSavedMantra: (id: string) => void;

  // Crystal Collection
  crystalCollection: string[];
  addCrystalToCollection: (id: string) => void;
  removeCrystalFromCollection: (id: string) => void;

  // Annual Forecast Cache
  annualForecastCache: AnnualForecastCache | null;
  // Astro Notes (persisted)
  astroNotes: AstroNoteEntry[];
  addAstroNote: (note: AstroNoteEntry) => void;
  deleteAstroNote: (id: string) => void;

  // Night Symbolator Favorites (persisted)
  nightSymbolFavorites: NightSymbolFavorite[];
  addNightSymbolFavorite: (fav: NightSymbolFavorite) => void;
  removeNightSymbolFavorite: (id: string) => void;
  setAnnualForecastCache: (cache: AnnualForecastCache | null) => void;

  // Astro Reading Cache
  astroReadingCache: { date: string; reading: string } | null;
  setAstroReadingCache: (cache: { date: string; reading: string } | null) => void;

  // Custom Affirmations
  deleteCustomAffirmation: (id: string) => void;
  updateCustomAffirmation: (id: string, text: string, category: string) => void;

  // Vision Board
  visionBoardIntentions: Record<string, { intention: string; affirmation: string; deadline: string; setAt: number }>;
  setVisionBoardIntention: (areaId: string, data: { intention: string; affirmation: string; deadline: string; setAt: number }) => void;
  clearVisionBoardIntention: (areaId: string) => void;

  // Release Letters (only metadata, not content — by design)
  releaseLetters: Array<{ id: string; target: string; name: string; date: string }>;
  addReleaseLetter: (letter: { id: string; target: string; name: string; date: string }) => void;
  clearReleaseLetters: () => void;

  // Emotional Anchors
  emotionalAnchors: string[];
  addEmotionalAnchor: (text: string) => void;
  removeEmotionalAnchor: (text: string) => void;

  // Interrupted session state (for "Continue?" prompt on re-entry)
  savedWrozkaSession: {
    dealedCards: any[];
    interpretations: Record<number, string>;
    chatMessages: any[];
    spreadId: string;
    topicId: string;
    phase: 'intro' | 'table' | 'complete';
    savedAt: number;
  } | null;
  saveWrozkaSession: (s: NonNullable<AppState['savedWrozkaSession']>) => void;
  clearWrozkaSession: () => void;

  // Auth & Sync Infrastructure
  session: any | null;
  isSyncing: boolean;

  setTheme: (name: ThemeName) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (lang: string) => void;
  setOnboarded: (value: boolean) => void;
  setUserData: (data: Partial<AppState['userData']>) => void;
  setPartnerData: (data: AppState['partnerData']) => void;
  checkInToday: () => void;
  updateDailyProgress: (date: string, progress: Partial<AppState['dailyProgress'][string]>) => void;
  setDailyProgress: (progress: Partial<AppState['dailyProgress'][string]>) => void;
  completeRitual: (ritualId: string) => void;
  uncompleteRitual: (ritualId: string) => void;
  toggleFavoriteAffirmation: (id: string) => void;
  addCustomAffirmation: (text: string, category: string) => void;
  toggleAmbientSound: () => void;
  setAmbientSoundEnabled: (value: boolean) => void;
  setExperience: (data: Partial<AppState['experience']>) => void;
  setAudioRuntime: (state: AudioRuntimeState, message?: string) => void;
  setHapticsRuntime: (state: HapticsRuntimeState, message?: string) => void;
  startJourney: (journeyId: string) => void;
  // Portal methods
  addFavoriteItem: (item: FavoriteItem) => void;
  removeFavoriteItem: (id: string) => void;
  isFavoriteItem: (id: string) => boolean;
  setPortalWidgets: (widgets: PortalWidget[]) => void;
  addReminder: (r: ReminderConfig) => void;
  removeReminder: (id: string) => void;
  updateReminder: (id: string, updates: Partial<ReminderConfig>) => void;

  // Daily AI Content
  dailyAiContent: DailyAiContent | null;
  setDailyAiContent: (content: DailyAiContent) => void;

  // Auth methods
  setAuthSession: (session: any | null) => void;
  setSyncing: (isSyncing: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      themeName: 'auto',
      themeMode: 'dark',
      language: 'pl',
      languageChosen: false,
      isOnboarded: true,
      experience: {
        hapticsEnabled: true,
        touchSoundEnabled: false,
        backgroundMusicEnabled: false,
        musicVolume: 0.5,
        ambientVolume: 0.5,
        backgroundMusicCategory: 'celestial',
        ambientSoundscape: 'forest',
        ritualCompletionSoundEnabled: true,
        motionStyle: 'standard',
        aiResponseLength: 'medium',
      checkInEnabled: true,
      morningCheckInHour: 8,
      eveningCheckInHour: 21,
        backgroundStyle: 'subtleCelestial',
        narratorVoice: 'nova',
        textScale: 1.0,
      },
      
      // Interrupted session state
      savedWrozkaSession: null,

      // Auth default state
      session: null,
      isSyncing: false,
      
      userData: {
        name: 'QA User',
        lastName: '',
        avatarUri: '',
        birthDate: '1996-06-14',
        gender: 'prefer_not',
        birthTime: '',
        birthPlace: 'Warszawa',
        relationshipMode: '',
        interests: [],
        experienceLevel: 'intermediate',
        preferredTone: 'gentle',
        primaryIntention: 'Spokój',
        spiritAnimal: '',
        currentFocus: 'Spokojne wejście',
        spiritualGoals: ['Poznanie siebie'],
        favoriteArchetypes: [],
        primaryGuidanceMode: 'mixed',
      },
      partnerData: null,
      streaks: {
        current: 0,
        highest: 0,
        lastCheckIn: '',
      },
      dailyProgress: {},
      favoriteAffirmations: [],
      customAffirmations: [],
      ambientSoundEnabled: true,
      audioRuntimeState: 'idle',
      audioRuntimeMessage: '',
      hapticsRuntimeState: 'idle',
      hapticsRuntimeMessage: '',
      activeJourney: null,
      dailyCache: {
        affirmation: '',
        affirmationDate: '',
        moonPhaseName: '',
        moonPhaseIcon: '',
        moonPhaseDate: '',
        soulMessage: '',
        soulMessageDate: '',
      },
      meditationSessions: [],
      breathworkSessions: [],
      chakraHistory: [],
      chakraFocus: null,
      shadowWorkSessions: [],
      gratitudeEntries: [],
      lunarIntentions: [],
      intentionCards: [],
      savedMantras: [],
      crystalCollection: [],
      annualForecastCache: null,
      astroNotes: [],
      nightSymbolFavorites: [],
      astroReadingCache: null,
      favoriteItems: [],
      portalWidgets: DEFAULT_PORTAL_WIDGETS,
      scheduledReminders: [],
      visionBoardIntentions: {},
      releaseLetters: [],
      emotionalAnchors: [],
      dailyAiContent: null,
      saveWrozkaSession: (s) => set({ savedWrozkaSession: s }),
      clearWrozkaSession: () => set({ savedWrozkaSession: null }),

      setAuthSession: (session) => set({ session }),
      setSyncing: (isSyncing) => set({ isSyncing }),
      setTheme: (name) => set({ themeName: name }),
      setThemeMode: (mode) => {
        // Sync module-level _activeThemeMode BEFORE setting store state so
        // all components get the correct theme during the re-render triggered
        // by the store update (useEffect fires AFTER render — too late).
        setActiveThemeMode(mode);
        if (mode === 'auto') syncAutoThemePalette();
        set({ themeMode: mode });
      },
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ language: lang, languageChosen: true });
      },
      setOnboarded: (value) => set({ isOnboarded: value }),
      setUserData: (data) => set((state) => ({ userData: { ...state.userData, ...data } })),
      setPartnerData: (data) => set({ partnerData: data }),
      checkInToday: () => {
        const today = new Date().toISOString().split('T')[0];
        const { streaks } = get();
        if (streaks.lastCheckIn === today) return;

        const lastCheckInDate = new Date(streaks.lastCheckIn);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        let newCurrent = streaks.current;
        if (streaks.lastCheckIn === yesterdayString) {
          newCurrent += 1;
        } else {
          newCurrent = 1;
        }

        const newHighest = Math.max(streaks.highest, newCurrent);

        set({
          streaks: {
            current: newCurrent,
            highest: newHighest,
            lastCheckIn: today,
          }
        });
      },
      updateDailyProgress: (date, progress) => set((state) => ({
        dailyProgress: {
          ...state.dailyProgress,
          [date]: {
            ...(state.dailyProgress[date] || {}),
            ...progress
          }
        }
      })),
      setDailyProgress: (progress) => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          dailyProgress: {
            ...state.dailyProgress,
            [today]: {
              ...(state.dailyProgress[today] || {}),
              ...progress
            }
          }
        }));
      },
      completeRitual: (ritualId) => {
        const today = new Date().toISOString().split('T')[0];
        const currentProgress = get().dailyProgress[today] || {};
        const completed = currentProgress.completedRituals || [];
        
        if (completed.includes(ritualId)) return;

        set((state) => ({
          dailyProgress: {
            ...state.dailyProgress,
            [today]: {
              ...currentProgress,
              ritualCompleted: true,
              completedRituals: [...completed, ritualId]
            }
          }
        }));
      },
      uncompleteRitual: (ritualId) => {
        const today = new Date().toISOString().split('T')[0];
        const currentProgress = get().dailyProgress[today] || {};
        const completed = currentProgress.completedRituals || [];
        if (!completed.includes(ritualId)) return;

        const nextCompleted = completed.filter((entry) => entry !== ritualId);
        set((state) => ({
          dailyProgress: {
            ...state.dailyProgress,
            [today]: {
              ...currentProgress,
              ritualCompleted: nextCompleted.length > 0,
              completedRituals: nextCompleted,
            },
          },
        }));
      },
      toggleFavoriteAffirmation: (id) => {
        const current = get().favoriteAffirmations;
        if (current.includes(id)) {
          set({ favoriteAffirmations: current.filter(favId => favId !== id) });
        } else {
          set({ favoriteAffirmations: [...current, id] });
        }
      },
      addCustomAffirmation: (text, category) => {
        const newAff = { id: `custom_${Date.now()}`, text, category };
        set((state) => ({ customAffirmations: [newAff, ...state.customAffirmations] }));
      },
      toggleAmbientSound: () => {
        const nextState = !get().ambientSoundEnabled;
        set({ ambientSoundEnabled: nextState });
        const exp = get().experience;
        if (!nextState) {
          void AudioService.pauseAmbientSound();
        }
        AudioService.applyPreferences({
          ambientEnabled: nextState,
          ambientSoundscape: exp.ambientSoundscape,
          backgroundMusicEnabled: exp.backgroundMusicEnabled,
          backgroundMusicCategory: exp.backgroundMusicCategory,
          musicVolume: exp.musicVolume ?? 0.5,
          ambientVolume: exp.ambientVolume ?? 0.5,
        });
      },
      setAmbientSoundEnabled: (value) => {
        set({ ambientSoundEnabled: value });
        const exp = get().experience;
        AudioService.applyPreferences({
          ambientEnabled: value,
          ambientSoundscape: exp.ambientSoundscape,
          backgroundMusicEnabled: exp.backgroundMusicEnabled,
          backgroundMusicCategory: exp.backgroundMusicCategory,
          musicVolume: exp.musicVolume ?? 0.5,
          ambientVolume: exp.ambientVolume ?? 0.5,
        });
        if (!value) void AudioService.pauseAmbientSound();
      },
      setExperience: (data) => {
        const nextExperience = { ...get().experience, ...data };
        set({ experience: nextExperience });
        HapticsService.syncEnabledState(nextExperience.hapticsEnabled);
        AudioService.applyPreferences({
          ambientEnabled: get().ambientSoundEnabled,
          ambientSoundscape: nextExperience.ambientSoundscape,
          backgroundMusicEnabled: nextExperience.backgroundMusicEnabled,
          backgroundMusicCategory: nextExperience.backgroundMusicCategory,
          touchSoundEnabled: nextExperience.touchSoundEnabled,
          hapticsEnabled: nextExperience.hapticsEnabled,
          ritualCompletionSoundEnabled: nextExperience.ritualCompletionSoundEnabled,
          motionStyle: nextExperience.motionStyle,
          musicVolume: nextExperience.musicVolume ?? 0.5,
          ambientVolume: nextExperience.ambientVolume ?? 0.5,
        });
        // Wyłącz muzykę natychmiast gdy toggle
        if (!nextExperience.backgroundMusicEnabled) {
          void AudioService.pauseBackgroundMusic();
        }
      },
      setAudioRuntime: (state, message) => set({
        audioRuntimeState: state,
        audioRuntimeMessage: message || '',
      }),
      setHapticsRuntime: (state, message) => set({
        hapticsRuntimeState: state,
        hapticsRuntimeMessage: message || '',
      }),
      startJourney: (journeyId) => set({
        activeJourney: {
          id: journeyId,
          currentDay: 1,
          startDate: new Date().toISOString()
        }
      }),
      addMeditationSession: (s) => set((state) => ({ meditationSessions: [s, ...state.meditationSessions] })),
      deleteMeditationSession: (id) => set((state) => ({ meditationSessions: state.meditationSessions.filter(s => s.id !== id) })),
      addBreathworkSession: (s) => set((state) => ({ breathworkSessions: [s, ...state.breathworkSessions] })),
      deleteBreathworkSession: (id) => set((state) => ({ breathworkSessions: state.breathworkSessions.filter(s => s.id !== id) })),
      addChakraEntry: (e) => set((state) => ({ chakraHistory: [e, ...state.chakraHistory] })),
      updateChakraEntry: (id, patch) => set((state) => ({ chakraHistory: state.chakraHistory.map(e => e.id === id ? { ...e, ...patch } : e) })),
      deleteChakraEntry: (id) => set((state) => ({ chakraHistory: state.chakraHistory.filter(e => e.id !== id) })),
      setChakraFocus: (id) => set({ chakraFocus: id }),
      addShadowSession: (s) => set((state) => ({ shadowWorkSessions: [s, ...state.shadowWorkSessions] })),
      updateShadowSession: (id, patch) => set((state) => ({ shadowWorkSessions: state.shadowWorkSessions.map(s => s.id === id ? { ...s, ...patch } : s) })),
      deleteShadowSession: (id) => set((state) => ({ shadowWorkSessions: state.shadowWorkSessions.filter(s => s.id !== id) })),
      addGratitudeEntry: (e) => set((state) => ({ gratitudeEntries: [e, ...state.gratitudeEntries] })),
      updateGratitudeEntry: (id, patch) => set((state) => ({ gratitudeEntries: state.gratitudeEntries.map(e => e.id === id ? { ...e, ...patch } : e) })),
      deleteGratitudeEntry: (id) => set((state) => ({ gratitudeEntries: state.gratitudeEntries.filter(e => e.id !== id) })),
      addLunarIntent: (i) => set((state) => ({ lunarIntentions: [i, ...state.lunarIntentions] })),
      updateLunarIntent: (id, patch) => set((state) => ({ lunarIntentions: state.lunarIntentions.map(i => i.id === id ? { ...i, ...patch } : i) })),
      deleteLunarIntent: (id) => set((state) => ({ lunarIntentions: state.lunarIntentions.filter(i => i.id !== id) })),
      addIntentionCard: (card) => set((state) => ({
        intentionCards: [{ ...card, id: `ic_${Date.now()}`, createdAt: new Date().toISOString() }, ...state.intentionCards],
      })),
      updateIntentionCard: (id, patch) => set((state) => ({ intentionCards: state.intentionCards.map(c => c.id === id ? { ...c, ...patch } : c) })),
      deleteIntentionCard: (id) => set((state) => ({ intentionCards: state.intentionCards.filter(c => c.id !== id) })),
      addSavedMantra: (m) => set((state) => ({ savedMantras: [m, ...state.savedMantras] })),
      removeSavedMantra: (id) => set((state) => ({ savedMantras: state.savedMantras.filter(m => m.id !== id) })),
      addCrystalToCollection: (id) => set((state) => {
        if (state.crystalCollection.includes(id)) return state;
        return { crystalCollection: [...state.crystalCollection, id] };
      }),
      removeCrystalFromCollection: (id) => set((state) => ({ crystalCollection: state.crystalCollection.filter(c => c !== id) })),
      setAnnualForecastCache: (cache) => set({ annualForecastCache: cache }),
      setAstroReadingCache: (cache) => set({ astroReadingCache: cache }),
      addAstroNote: (note) => set((state) => ({ astroNotes: [note, ...state.astroNotes] })),
      deleteAstroNote: (id) => set((state) => ({ astroNotes: state.astroNotes.filter(n => n.id !== id) })),
      addNightSymbolFavorite: (fav) => set((state) => {
        if (state.nightSymbolFavorites.find(f => f.id === fav.id)) return state;
        return { nightSymbolFavorites: [fav, ...state.nightSymbolFavorites] };
      }),
      removeNightSymbolFavorite: (id) => set((state) => ({ nightSymbolFavorites: state.nightSymbolFavorites.filter(f => f.id !== id) })),
      deleteCustomAffirmation: (id) => set((state) => ({ customAffirmations: state.customAffirmations.filter(a => a.id !== id) })),
      updateCustomAffirmation: (id, text, category) => set((state) => ({ customAffirmations: state.customAffirmations.map(a => a.id === id ? { ...a, text, category } : a) })),
      addFavoriteItem: (item) => set((state) => {
        if (state.favoriteItems.find(f => f.id === item.id)) return state;
        return { favoriteItems: [item, ...state.favoriteItems] };
      }),
      removeFavoriteItem: (id) => set((state) => ({ favoriteItems: state.favoriteItems.filter(f => f.id !== id) })),
      isFavoriteItem: (id) => get().favoriteItems.some(f => f.id === id),
      setPortalWidgets: (widgets) => set({ portalWidgets: widgets }),
      addReminder: (r) => set((state) => ({ scheduledReminders: [...state.scheduledReminders, r] })),
      removeReminder: (id) => set((state) => ({ scheduledReminders: state.scheduledReminders.filter(r => r.id !== id) })),
      updateReminder: (id, updates) => set((state) => ({
        scheduledReminders: state.scheduledReminders.map(r => r.id === id ? { ...r, ...updates } : r),
      })),
      setVisionBoardIntention: (areaId, data) => set(s => ({ visionBoardIntentions: { ...s.visionBoardIntentions, [areaId]: data } })),
      clearVisionBoardIntention: (areaId) => set(s => { const v = { ...s.visionBoardIntentions }; delete v[areaId]; return { visionBoardIntentions: v }; }),
      addReleaseLetter: (letter) => set(s => ({ releaseLetters: [letter, ...s.releaseLetters] })),
      clearReleaseLetters: () => set({ releaseLetters: [] }),
      addEmotionalAnchor: (text) => set(s => ({ emotionalAnchors: s.emotionalAnchors.includes(text) ? s.emotionalAnchors : [...s.emotionalAnchors, text] })),
      removeEmotionalAnchor: (text) => set(s => ({ emotionalAnchors: s.emotionalAnchors.filter(a => a !== text) })),
      setDailyAiContent: (content) => set({ dailyAiContent: content }),
    }),
    {
      name: 'aethera-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
