/**
 * Network status hook - always returns true.
 * AI calls handle their own error states gracefully.
 */
export const useNetworkStatus = (): boolean => true;
