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
    set({ currentUser: null, isLoggedIn: false });
  },
}));

export async function hydrateUserProfile(uid: string): Promise<void> {
  const snap = await getDoc(doc(db, 'users', uid));
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
    });
  } else {
    useAuthStore.getState().setUser(null);
  }
}
