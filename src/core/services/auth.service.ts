import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase.config';

export interface AetheraUser {
  uid: string;
  email: string;
  displayName: string;
  zodiacSign: string;
  archetype: string;
  avatarEmoji: string;
  bio: string;
  birthDate?: string;
  birthPlace?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  zodiacSign: string;
  archetype: string;
  avatarEmoji: string;
  birthDate?: string;
  birthPlace?: string;
}

export const AuthService = {
  async register(data: RegisterData): Promise<User> {
    const registerPromise = createUserWithEmailAndPassword(auth, data.email, data.password);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'auth/network-request-failed' })), 15000)
    );
    const { user } = await Promise.race([registerPromise, timeoutPromise]);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        displayName: data.displayName,
        email: data.email,
        zodiacSign: data.zodiacSign,
        archetype: data.archetype,
        avatarEmoji: data.avatarEmoji,
        bio: '',
        birthDate: data.birthDate ?? null,
        birthPlace: data.birthPlace ?? null,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      });
    } catch (error) {
      console.warn('[AuthService] Firestore profile creation failed, keeping auth account.', error);
    }
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const loginPromise = signInWithEmailAndPassword(auth, email, password);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'auth/network-request-failed' })), 15000)
    );
    const { user } = await Promise.race([loginPromise, timeoutPromise]);
    return user;
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  onAuthChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  },

  get currentFirebaseUser(): User | null {
    return auth.currentUser;
  },
};

export async function signInWithGoogle(idToken: string): Promise<void> {
  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
}

export async function signInWithApple(idToken: string, nonce: string): Promise<void> {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken, rawNonce: nonce });
  await signInWithCredential(auth, credential);
}
