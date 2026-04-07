import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../core/config/firebase.config';
import { AetheraUser } from '../core/services/auth.service';

interface AuthState {
  currentUser: AetheraUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  setUser: (user: AetheraUser | null) => void;
  setLoading: (v: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoggedIn: false,
  loading: true,

  setUser: (user) => set({ currentUser: user, isLoggedIn: !!user, loading: false }),

  setLoading: (v) => set({ loading: v }),

  logout: async () => {
    const { AuthService } = await import('../core/services/auth.service');
    await AuthService.logout();
    // Reset language selection so the app always shows LanguageSelection after logout
    const { useAppStore } = await import('./useAppStore');
    useAppStore.setState({ languageChosen: false });
    set({ currentUser: null, isLoggedIn: false, loading: false });
  },
}));

async function getFirebaseAuthFallbackUser(uid: string): Promise<void> {
  const { auth } = await import('../core/config/firebase.config');
  const fbUser = auth.currentUser;
  if (fbUser && fbUser.uid === uid) {
    useAuthStore.getState().setUser({
      uid,
      email: fbUser.email ?? '',
      displayName: fbUser.displayName ?? '',
      zodiacSign: '',
      archetype: '',
      avatarEmoji: '🌙',
      bio: '',
    });
    return;
  }
  // auth.currentUser can be temporarily null right after login due to AsyncStorage
  // async persistence reads. If the store already has this user logged in, keep them.
  const { isLoggedIn, currentUser } = useAuthStore.getState();
  if (isLoggedIn && currentUser?.uid === uid) {
    return; // User already set correctly — don't disturb the session
  }
  // auth.currentUser is null AND we don't have this user in the store — truly logged out
  if (!fbUser) {
    useAuthStore.getState().setUser(null);
  }
}

export async function hydrateUserProfile(uid: string): Promise<void> {
  try {
    const snap = await Promise.race([
      getDoc(doc(db, 'users', uid)),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
    if (!snap) {
      await getFirebaseAuthFallbackUser(uid);
      return;
    }
    if (snap.exists()) {
      const data = snap.data();
      useAuthStore.getState().setUser({
        uid,
        email: data.email ?? '',
        displayName: data.displayName ?? '',
        zodiacSign: data.zodiacSign ?? '',
        archetype: data.archetype ?? '',
        avatarEmoji: data.avatarEmoji ?? '🌙',
        bio: data.bio ?? '',
        birthDate: data.birthDate ?? undefined,
        birthPlace: data.birthPlace ?? undefined,
      });
      return;
    }
  } catch {
    // Firestore profile fetch failed — keep auth session alive via Firebase user.
  }

  // Firestore profile not found or unreadable — keep the user logged in from Auth.
  await getFirebaseAuthFallbackUser(uid);
}
