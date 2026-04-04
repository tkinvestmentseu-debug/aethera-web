import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
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
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  zodiacSign: string;
  archetype: string;
  avatarEmoji: string;
}

export const AuthService = {
  async register(data: RegisterData): Promise<User> {
    const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);
    await setDoc(doc(db, 'users', user.uid), {
      displayName: data.displayName,
      email: data.email,
      zodiacSign: data.zodiacSign,
      archetype: data.archetype,
      avatarEmoji: data.avatarEmoji,
      bio: '',
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
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
