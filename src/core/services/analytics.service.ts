// @ts-nocheck
import { logEvent as fbLogEvent } from 'firebase/analytics';
import { analytics } from '../config/firebase.config';

type EventName =
  | 'screen_view'
  | 'oracle_chat_started'
  | 'tarot_reading_done'
  | 'meditation_started'
  | 'ritual_started'
  | 'community_post_created'
  | 'premium_viewed'
  | 'premium_purchased'
  | 'journal_entry_created'
  | 'horoscope_viewed';

export const AnalyticsService = {
  logEvent(name: EventName, params?: Record<string, any>) {
    try {
      if (analytics) fbLogEvent(analytics, name, params);
    } catch (e) {
      // Analytics not available (e.g. simulator)
    }
  },

  logScreenView(screenName: string) {
    this.logEvent('screen_view', { screen_name: screenName, screen_class: screenName });
  },
};
