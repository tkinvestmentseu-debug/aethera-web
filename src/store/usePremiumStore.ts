import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PremiumEntitlement =
  | 'unlimited_oracle'
  | 'advanced_tarot'
  | 'premium_rituals'
  | 'soul_path_insights'
  | 'saved_library'
  | 'chinese_zodiac_advanced';

interface PremiumState {
  isPremium: boolean;
  entitlements: PremiumEntitlement[];
  trialExpiresAt: string | null;
  subscriptionPlan: 'monthly' | 'yearly' | 'lifetime' | null;

  // Usage limits for free tier
  usage: {
    oracleMessagesToday: number;
    tarotReadingsToday: number;
    lastResetDate: string;
    aiFeatureUsedToday: { dreams: boolean; numerology: boolean; palm: boolean; };
  };

  checkAccess: (feature: PremiumEntitlement) => boolean;
  trackUsage: (type: 'oracle' | 'tarot') => boolean; // Returns true if allowed, false if hit paywall
  trackAiFeature: (feature: 'dreams' | 'numerology' | 'palm') => boolean;
  unlockPremium: (plan: 'monthly' | 'yearly' | 'lifetime') => void;
  startTrial: () => void;
  restorePurchases: () => Promise<boolean>;
  resetUsageIfNewDay: () => void;
  }

  const FREE_LIMITS = {
  oracleMessages: 3,
  tarotReadings: 1,
  };

  export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      entitlements: [],
      trialExpiresAt: null,
      subscriptionPlan: null,

      usage: {
        oracleMessagesToday: 0,
        tarotReadingsToday: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
        aiFeatureUsedToday: { dreams: false, numerology: false, palm: false },
      },

      checkAccess: (feature) => {
        const state = get();
        if (state.isPremium) return true;
        if (feature === 'saved_library') return false;
        if (feature === 'soul_path_insights') return false;
        if (feature === 'advanced_tarot') return false;
        if (feature === 'premium_rituals') return false;
        if (feature === 'chinese_zodiac_advanced') return false;
        return true;
      },

      resetUsageIfNewDay: () => {
        const today = new Date().toISOString().split('T')[0];
        const { usage } = get();
        if (usage.lastResetDate !== today) {
          set({
            usage: {
              oracleMessagesToday: 0,
              tarotReadingsToday: 0,
              lastResetDate: today,
              aiFeatureUsedToday: { dreams: false, numerology: false, palm: false },
            }
          });
        }
      },

      trackUsage: (type) => {
        const state = get();
        state.resetUsageIfNewDay();

        if (state.isPremium) return true;

        if (type === 'oracle') {
          if (state.usage.oracleMessagesToday >= FREE_LIMITS.oracleMessages) return false;
          set({ usage: { ...state.usage, oracleMessagesToday: state.usage.oracleMessagesToday + 1 } });
          return true;
        }

        if (type === 'tarot') {
          if (state.usage.tarotReadingsToday >= FREE_LIMITS.tarotReadings) return false;
          set({ usage: { ...state.usage, tarotReadingsToday: state.usage.tarotReadingsToday + 1 } });
          return true;
        }

        return true;
      },

      trackAiFeature: (feature) => {
        const state = get();
        state.resetUsageIfNewDay();

        if (state.isPremium) return true;

        if (state.usage.aiFeatureUsedToday[feature]) return false;

        set({
          usage: {
            ...state.usage,
            aiFeatureUsedToday: { ...state.usage.aiFeatureUsedToday, [feature]: true },
          }
        });
        return true;
      },

      unlockPremium: (plan) => set({
        isPremium: true,
        subscriptionPlan: plan,
        entitlements: [
          'unlimited_oracle',
          'advanced_tarot',
          'premium_rituals',
          'soul_path_insights',
          'saved_library',
          'chinese_zodiac_advanced'
        ]
      }),

      startTrial: () => set({
        isPremium: true,
        subscriptionPlan: 'yearly',
        trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        entitlements: [
          'unlimited_oracle',
          'advanced_tarot',
          'premium_rituals',
          'soul_path_insights',
          'saved_library',
          'chinese_zodiac_advanced'
        ]
      }),

      restorePurchases: async () => {
        // Placeholder for RevenueCat / StoreKit restore logic
        return new Promise((resolve) => {
          setTimeout(() => {
            // Simulate finding no active sub for free user
            resolve(false);
          }, 1500);
        });
      }
    }),
    {
      name: 'aethera-premium',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
  );
