import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Wyłączamy problematyczny storage w Expo Go, aby uciszyć błędy Native Module
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Tymczasowo dla stabilności w Expo Go
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
