# Community Platform — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mocked/seeded data in 9 Wspólnota screens with real Firebase Firestore backend, enabling real-time communication, community rooms, live rituals, soul matching, challenges, and chronicles between actual users.

**Architecture:** Firebase JS SDK (not react-native-firebase) so Expo Go keeps working. Firestore for real-time data + Auth for email/password login. Each community feature gets its own service file. Zustand `useAuthStore` holds current user; all screens read from it.

**Tech Stack:** `firebase` JS SDK v10+, `@react-native-async-storage/async-storage` (already installed), Firebase Auth + Firestore + Storage (free Spark tier).

---

## File Map

### New files
| File | Purpose |
|---|---|
| `src/core/config/firebase.config.ts` | Firebase app init, exports `auth` and `db` |
| `src/core/services/auth.service.ts` | register, login, logout, onAuthChanged |
| `src/core/services/community/chat.service.ts` | Firestore CRUD for chatRooms + messages |
| `src/core/services/community/feed.service.ts` | Firestore CRUD for posts + reactions + comments |
| `src/core/services/community/rituals.service.ts` | Firestore CRUD for rituals + participants |
| `src/core/services/community/circles.service.ts` | Firestore CRUD for energyCircles + intentions |
| `src/core/services/community/challenges.service.ts` | Firestore CRUD for challenges + check-ins |
| `src/core/services/community/affirmations.service.ts` | Firestore CRUD for weekly affirmations + votes |
| `src/core/services/community/chronicles.service.ts` | Firestore CRUD for chronicles + comments |
| `src/core/services/community/souls.service.ts` | Firestore CRUD for soul connections + user profiles |
| `src/store/useAuthStore.ts` | Zustand: currentUser, isLoggedIn, loading |
| `src/screens/auth/LoginScreen.tsx` | Email + password login form |
| `src/screens/auth/RegisterScreen.tsx` | Registration: email, password, name, zodiac, archetype, emoji |

### Modified files
| File | Change |
|---|---|
| `package.json` | Add `firebase` dependency |
| `src/navigation/AppNavigator.tsx` | Add auth gate + register Auth screens |
| `src/screens/CommunityChatScreen.tsx` | Replace SEED_MESSAGES with Firestore real-time listener |
| `src/screens/GlobalShareScreen.tsx` | Replace SEED_POSTS/SEED_COMMENTS with Firestore |
| `src/screens/LiveRitualsScreen.tsx` | Replace mocked rituals with Firestore real-time |
| `src/screens/EnergyCircleScreen.tsx` | Replace mocked circle with Firestore real-time |
| `src/screens/SoulMatchScreen.tsx` | Replace RAW_PROFILES with real user profiles from Firestore |
| `src/screens/SpiritualChallengesScreen.tsx` | Replace mocked challenges with Firestore |
| `src/screens/CommunityAffirmationScreen.tsx` | Replace mocked affirmation with Firestore |
| `src/screens/CommunityChronicleScreen.tsx` | Replace ENTRIES with Firestore |

---

## ── PHASE 1: Firebase Setup + Auth ──────────────────────────────────────────

---

### Task 1: Install Firebase and create config

**Files:**
- Modify: `package.json`
- Create: `src/core/config/firebase.config.ts`

- [ ] **Step 1: Install firebase package**

```bash
npx expo install firebase
```

Expected output: `firebase` added to `node_modules` and `package.json`.

- [ ] **Step 2: Get Firebase config from Console**

1. Go to https://console.firebase.google.com → project `aethera`
2. Click gear icon → **Project settings**
3. Scroll to **"Your apps"** → click **Web** icon (`</>`)
4. App nickname: `aethera-rn` → click **Register app**
5. Copy the `firebaseConfig` object shown — you'll need it in Step 3

- [ ] **Step 3: Enable Firebase services in Console**

In Firebase Console:
1. **Authentication** → Get started → **Email/Password** → Enable → Save
2. **Firestore Database** → Create database → **Production mode** → Region: **europe-west** → Done
3. **Firestore** → **Rules** tab → paste these rules → Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /chatRooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      match /messages/{msgId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null
          && request.resource.data.authorId == request.auth.uid;
        allow delete: if request.auth.uid == resource.data.authorId;
      }
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

- [ ] **Step 4: Create firebase.config.ts**

Create `src/core/config/firebase.config.ts` — replace the placeholder values with your real config from Step 2:

```typescript
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your Firebase project config (Project Settings → Your apps → Web)
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
```

- [ ] **Step 5: Commit**

```bash
git add src/core/config/firebase.config.ts package.json
git commit -m "feat: add Firebase config and install firebase SDK"
```

---

### Task 2: Auth service

**Files:**
- Create: `src/core/services/auth.service.ts`

- [ ] **Step 1: Create auth.service.ts**

```typescript
// src/core/services/auth.service.ts
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
  /** Register new user, create Firestore profile doc */
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

  /** Login with email + password */
  async login(email: string, password: string): Promise<User> {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user;
  },

  /** Logout current user */
  async logout(): Promise<void> {
    await signOut(auth);
  },

  /** Subscribe to auth state changes. Returns unsubscribe function. */
  onAuthChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  },

  /** Get current Firebase Auth user (sync, may be null) */
  get currentFirebaseUser(): User | null {
    return auth.currentUser;
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/core/services/auth.service.ts
git commit -m "feat: add AuthService (register, login, logout, onAuthChanged)"
```

---

### Task 3: Auth Zustand store

**Files:**
- Create: `src/store/useAuthStore.ts`

- [ ] **Step 1: Create useAuthStore.ts**

```typescript
// src/store/useAuthStore.ts
import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../core/config/firebase.config';
import { AetheraUser, AuthService } from '../core/services/auth.service';

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
    await AuthService.logout();
    set({ currentUser: null, isLoggedIn: false });
  },
}));

/** Fetch full user profile from Firestore and update store */
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
```

- [ ] **Step 2: Commit**

```bash
git add src/store/useAuthStore.ts
git commit -m "feat: add useAuthStore with Firestore profile hydration"
```

---

### Task 4: LoginScreen

**Files:**
- Create: `src/screens/auth/LoginScreen.tsx`

- [ ] **Step 1: Create LoginScreen.tsx**

```typescript
// src/screens/auth/LoginScreen.tsx
// @ts-nocheck
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthService } from '../../core/services/auth.service';
import { hydrateUserProfile } from '../../store/useAuthStore';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Błąd', 'Podaj email i hasło.');
      return;
    }
    setLoading(true);
    try {
      const user = await AuthService.login(email.trim(), password);
      await hydrateUserProfile(user.uid);
    } catch (e: any) {
      const msg = e?.code === 'auth/invalid-credential'
        ? 'Nieprawidłowy email lub hasło.'
        : 'Nie udało się zalogować. Sprawdź połączenie.';
      Alert.alert('Błąd logowania', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0D0D1A', '#1A0D2E']} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <Text style={styles.logo}>✦ Aethera</Text>
          <Text style={styles.subtitle}>Zaloguj się do swojej duszy</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Hasło"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Wejdź ✦</Text>}
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Register')} style={{ marginTop: 20 }}>
            <Text style={styles.link}>Nie masz konta? <Text style={{ color: '#A78BFA' }}>Zarejestruj się</Text></Text>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logo: { fontSize: 36, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8, letterSpacing: 2 },
  subtitle: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 40, fontSize: 14 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, padding: 16, color: '#fff',
    marginBottom: 14, fontSize: 15,
  },
  btn: {
    backgroundColor: '#7C3AED', borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 14 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/auth/LoginScreen.tsx
git commit -m "feat: add LoginScreen (email/password)"
```

---

### Task 5: RegisterScreen

**Files:**
- Create: `src/screens/auth/RegisterScreen.tsx`

- [ ] **Step 1: Create RegisterScreen.tsx**

```typescript
// src/screens/auth/RegisterScreen.tsx
// @ts-nocheck
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthService } from '../../core/services/auth.service';
import { hydrateUserProfile } from '../../store/useAuthStore';

const ZODIAC_SIGNS = ['Baran','Byk','Bliźnięta','Rak','Lew','Panna','Waga','Skorpion','Strzelec','Koziorożec','Wodnik','Ryby'];
const ARCHETYPES = ['Mistyk','Wojownik','Mędrzec','Uzdrowiciel','Wizjoner','Strażnik','Twórca','Poszukiwacz'];
const EMOJIS = ['🌙','✨','🌸','🔮','🌿','🦋','🌊','🔥','💫','🌺','⚡','🕊️'];

export const RegisterScreen = ({ navigation }: any) => {
  const [step, setStep] = useState(1); // 1 = credentials, 2 = profile
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [zodiacSign, setZodiacSign] = useState('Baran');
  const [archetype, setArchetype] = useState('Mistyk');
  const [avatarEmoji, setAvatarEmoji] = useState('🌙');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName.trim()) { Alert.alert('Błąd', 'Podaj swoje imię.'); return; }
    setLoading(true);
    try {
      const user = await AuthService.register({ email, password, displayName, zodiacSign, archetype, avatarEmoji });
      await hydrateUserProfile(user.uid);
    } catch (e: any) {
      const msg = e?.code === 'auth/email-already-in-use'
        ? 'Ten email jest już zajęty.'
        : e?.code === 'auth/weak-password'
        ? 'Hasło musi mieć co najmniej 6 znaków.'
        : 'Błąd rejestracji. Sprawdź połączenie.';
      Alert.alert('Błąd', msg);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (!email.trim() || !password.trim()) { Alert.alert('Błąd', 'Podaj email i hasło.'); return; }
    if (password.length < 6) { Alert.alert('Błąd', 'Hasło musi mieć co najmniej 6 znaków.'); return; }
    setStep(2);
  };

  return (
    <LinearGradient colors={['#0D0D1A', '#1A0D2E']} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.logo}>✦ Aethera</Text>
            <Text style={styles.step}>{step === 1 ? 'Krok 1/2 — Dane konta' : 'Krok 2/2 — Twój profil'}</Text>

            {step === 1 ? (
              <>
                <TextInput style={styles.input} placeholder="Email" placeholderTextColor="rgba(255,255,255,0.4)"
                  value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                <TextInput style={styles.input} placeholder="Hasło (min. 6 znaków)" placeholderTextColor="rgba(255,255,255,0.4)"
                  value={password} onChangeText={setPassword} secureTextEntry />
                <Pressable style={styles.btn} onPress={nextStep}>
                  <Text style={styles.btnText}>Dalej →</Text>
                </Pressable>
              </>
            ) : (
              <>
                <TextInput style={styles.input} placeholder="Twoje imię" placeholderTextColor="rgba(255,255,255,0.4)"
                  value={displayName} onChangeText={setDisplayName} />

                <Text style={styles.label}>Znak zodiaku</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {ZODIAC_SIGNS.map(z => (
                    <Pressable key={z} onPress={() => setZodiacSign(z)}
                      style={[styles.chip, zodiacSign === z && styles.chipActive]}>
                      <Text style={[styles.chipText, zodiacSign === z && { color: '#fff' }]}>{z}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={styles.label}>Archetyp duszy</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {ARCHETYPES.map(a => (
                    <Pressable key={a} onPress={() => setArchetype(a)}
                      style={[styles.chip, archetype === a && styles.chipActive]}>
                      <Text style={[styles.chipText, archetype === a && { color: '#fff' }]}>{a}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={styles.label}>Twój symbol</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                  {EMOJIS.map(e => (
                    <Pressable key={e} onPress={() => setAvatarEmoji(e)}
                      style={[styles.emojiBtn, avatarEmoji === e && styles.emojiBtnActive]}>
                      <Text style={{ fontSize: 24 }}>{e}</Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable style={styles.btn} onPress={handleRegister} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Stwórz konto ✦</Text>}
                </Pressable>
                <Pressable onPress={() => setStep(1)} style={{ marginTop: 12 }}>
                  <Text style={styles.link}>← Wróć</Text>
                </Pressable>
              </>
            )}

            <Pressable onPress={() => navigation.navigate('Login')} style={{ marginTop: 16 }}>
              <Text style={styles.link}>Masz konto? <Text style={{ color: '#A78BFA' }}>Zaloguj się</Text></Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { padding: 32, paddingTop: 20 },
  logo: { fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 4, letterSpacing: 2 },
  step: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 32, fontSize: 13 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 16, color: '#fff', marginBottom: 14, fontSize: 15 },
  btn: { backgroundColor: '#7C3AED', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 14 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10, textTransform: 'uppercase' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  chipText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  emojiBtn: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  emojiBtnActive: { borderColor: '#A78BFA', backgroundColor: 'rgba(124,58,237,0.25)' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/auth/RegisterScreen.tsx
git commit -m "feat: add RegisterScreen (2-step: credentials + zodiac/archetype/emoji)"
```

---

### Task 6: Wire auth into AppNavigator

**Files:**
- Modify: `src/navigation/AppNavigator.tsx`

- [ ] **Step 1: Add imports at top of AppNavigator.tsx**

After the last existing import line, add:

```typescript
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { useAuthStore } from '../store/useAuthStore';
import { AuthService } from '../core/services/auth.service';
import { hydrateUserProfile } from '../store/useAuthStore';
```

- [ ] **Step 2: Add auth bootstrap effect**

Inside the main `AppNavigator` function (the one that returns `<NavigationContainer>`), add this at the top of the function body, after the existing hooks:

```typescript
const { setLoading, setUser } = useAuthStore();

useEffect(() => {
  const unsub = AuthService.onAuthChanged(async (firebaseUser) => {
    if (firebaseUser) {
      await hydrateUserProfile(firebaseUser.uid);
    } else {
      setUser(null);
    }
  });
  return unsub;
}, []);
```

- [ ] **Step 3: Add auth gate before NavigationContainer return**

Find the `return (` of the main `AppNavigator` function that wraps `<NavigationContainer>`. Just before it, add:

```typescript
const { isLoggedIn, loading: authLoading } = useAuthStore();

if (authLoading) {
  return (
    <LinearGradient colors={['#0D0D1A', '#1A0D2E']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#A78BFA', fontSize: 28 }}>✦</Text>
    </LinearGradient>
  );
}

if (!isLoggedIn) {
  return (
    <NavigationContainer>
      {(() => {
        const AuthStack = createNativeStackNavigator();
        return (
          <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
          </AuthStack.Navigator>
        );
      })()}
    </NavigationContainer>
  );
}
```

- [ ] **Step 4: Reload app and test**

In Expo Go: press `r` to reload. You should see the Login screen. Try:
1. Register with email + password + name + zodiac
2. Verify you land on the main app (Portal tab)
3. Close and reopen app — should stay logged in (AsyncStorage persistence)
4. Logout: add a temporary button in ProfileScreen or test by clearing app data

- [ ] **Step 5: Commit**

```bash
git add src/navigation/AppNavigator.tsx
git commit -m "feat: add auth gate to AppNavigator — shows Login/Register when not authenticated"
```

---

## ── PHASE 2: Community Chat ──────────────────────────────────────────────────

---

### Task 7: Chat service + seed rooms

**Files:**
- Create: `src/core/services/community/chat.service.ts`

- [ ] **Step 1: Create chat.service.ts**

```typescript
// src/core/services/community/chat.service.ts
import {
  collection, doc, addDoc, setDoc, getDoc, getDocs,
  onSnapshot, query, orderBy, limit, serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export interface ChatMessage {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorEmoji: string;
  createdAt: number; // ms timestamp
}

export interface ChatRoom {
  id: string;
  name: string;
  emoji: string;
  description: string;
  memberCount: number;
}

const DEFAULT_ROOMS: Omit<ChatRoom, 'id' | 'memberCount'>[] = [
  { name: 'Ogólny', emoji: '💬', description: 'Rozmowy o wszystkim' },
  { name: 'Tarot', emoji: '🔮', description: 'Interpretacje i pytania o karty' },
  { name: 'Medytacja', emoji: '🧘', description: 'Techniki i doświadczenia' },
  { name: 'Sny', emoji: '🌙', description: 'Świadome śnienie i symbole' },
  { name: 'Astrologia', emoji: '⭐', description: 'Horoskopy i planety' },
  { name: 'Rytuały', emoji: '🕯️', description: 'Ceremonie i rytuały' },
  { name: 'Wsparcie', emoji: '💛', description: 'Wzajemna pomoc i energie' },
  { name: 'Afirmacje', emoji: '✨', description: 'Codzienne afirmacje i intencje' },
];

export const ChatService = {
  /** Seed default rooms if they don't exist (call once on app start) */
  async seedRoomsIfNeeded(): Promise<void> {
    for (const room of DEFAULT_ROOMS) {
      const roomId = room.name.toLowerCase().replace(/\s/g, '_');
      const ref = doc(db, 'chatRooms', roomId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { ...room, memberCount: 0 });
      }
    }
  },

  /** Fetch all rooms (one-time read) */
  async getRooms(): Promise<ChatRoom[]> {
    const snap = await getDocs(collection(db, 'chatRooms'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatRoom));
  },

  /** Subscribe to last 60 messages in a room. Returns unsubscribe fn. */
  listenToMessages(
    roomId: string,
    onMessages: (msgs: ChatMessage[]) => void,
  ): () => void {
    const q = query(
      collection(db, 'chatRooms', roomId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(60),
    );
    return onSnapshot(q, (snap) => {
      const msgs: ChatMessage[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          text: data.text,
          authorId: data.authorId,
          authorName: data.authorName,
          authorEmoji: data.authorEmoji,
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toMillis()
            : Date.now(),
        };
      });
      onMessages(msgs);
    });
  },

  /** Send a message to a room */
  async sendMessage(
    roomId: string,
    text: string,
    author: { uid: string; displayName: string; avatarEmoji: string },
  ): Promise<void> {
    await addDoc(collection(db, 'chatRooms', roomId, 'messages'), {
      text: text.trim(),
      authorId: author.uid,
      authorName: author.displayName,
      authorEmoji: author.avatarEmoji,
      createdAt: serverTimestamp(),
    });
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/core/services/community/chat.service.ts
git commit -m "feat: add ChatService (seed rooms, real-time messages, send)"
```

---

### Task 8: Wire CommunityChatScreen to Firestore

**Files:**
- Modify: `src/screens/CommunityChatScreen.tsx`

- [ ] **Step 1: Replace SEED data and add Firebase hooks**

At the top of `CommunityChatScreen.tsx`, find and remove these imports/constants:
- `SEED_MESSAGES_BY_ROOM` and `AUTO_REPLIES` constant blocks
- Any static room definitions

Add these imports after the existing imports:

```typescript
import { ChatService, ChatMessage, ChatRoom } from '../core/services/community/chat.service';
import { useAuthStore } from '../store/useAuthStore';
```

- [ ] **Step 2: Replace state and effects**

Inside the `CommunityChatScreen` component, replace the `messagesByRoom` state and related effects with:

```typescript
const { currentUser } = useAuthStore();
const [rooms, setRooms] = useState<ChatRoom[]>([]);
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [activeRoomId, setActiveRoomId] = useState<string>('ogólny');
const [inputText, setInputText] = useState('');
const [sending, setSending] = useState(false);

// Seed rooms + load room list on mount
useEffect(() => {
  ChatService.seedRoomsIfNeeded().then(() =>
    ChatService.getRooms().then(r => {
      setRooms(r);
      if (r.length > 0) setActiveRoomId(r[0].id);
    })
  );
}, []);

// Subscribe to messages when active room changes
useEffect(() => {
  if (!activeRoomId) return;
  const unsub = ChatService.listenToMessages(activeRoomId, setMessages);
  return unsub;
}, [activeRoomId]);
```

- [ ] **Step 3: Replace send handler**

Find the existing send handler function and replace its body with:

```typescript
const handleSend = async () => {
  if (!inputText.trim() || !currentUser || sending) return;
  setSending(true);
  const text = inputText.trim();
  setInputText('');
  try {
    await ChatService.sendMessage(activeRoomId, text, {
      uid: currentUser.uid,
      displayName: currentUser.displayName,
      avatarEmoji: currentUser.avatarEmoji,
    });
  } catch (e) {
    console.warn('[Chat] send failed', e);
  } finally {
    setSending(false);
  }
};
```

- [ ] **Step 4: Update JSX for rooms tabs**

Replace the hardcoded category tabs with:

```typescript
{rooms.map(room => (
  <Pressable
    key={room.id}
    onPress={() => setActiveRoomId(room.id)}
    style={[styles.tab, activeRoomId === room.id && styles.tabActive]}
  >
    <Text style={styles.tabEmoji}>{room.emoji}</Text>
    <Text style={[styles.tabText, activeRoomId === room.id && styles.tabTextActive]}>
      {room.name}
    </Text>
  </Pressable>
))}
```

- [ ] **Step 5: Update JSX for messages list**

Replace the message list render with:

```typescript
{messages.map(msg => {
  const isOwn = msg.authorId === currentUser?.uid;
  return (
    <View key={msg.id} style={[styles.msgRow, isOwn && styles.msgRowOwn]}>
      {!isOwn && <Text style={styles.msgEmoji}>{msg.authorEmoji}</Text>}
      <View style={[styles.msgBubble, isOwn && styles.msgBubbleOwn]}>
        {!isOwn && <Text style={styles.msgAuthor}>{msg.authorName}</Text>}
        <Text style={styles.msgText}>{msg.text}</Text>
        <Text style={styles.msgTime}>
          {new Date(msg.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
})}
```

- [ ] **Step 6: Test**

In Expo Go: open CommunityChatScreen. You should see the 8 real rooms. Send a message — it should persist after reload and appear on another device/simulator.

- [ ] **Step 7: Commit**

```bash
git add src/screens/CommunityChatScreen.tsx
git commit -m "feat: CommunityChatScreen — real-time Firestore messages (replace SEED data)"
```

---

## ── PHASE 3: Global Feed ─────────────────────────────────────────────────────

---

### Task 9: Feed service

**Files:**
- Create: `src/core/services/community/feed.service.ts`

- [ ] **Step 1: Create feed.service.ts**

```typescript
// src/core/services/community/feed.service.ts
import {
  collection, addDoc, getDocs, onSnapshot, query,
  orderBy, limit, startAfter, doc, runTransaction,
  serverTimestamp, Timestamp, DocumentSnapshot, getDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export type PostType = 'TAROT'|'HOROSKOP'|'MEDYTACJA'|'AFIRMACJA'|'SEN'|'REFLEKSJA';
export type ReactionType = 'resonuje'|'prawda'|'czuje';

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorEmoji: string;
  authorZodiac: string;
  type: PostType;
  content: string;
  reactions: { resonuje: number; prawda: number; czuje: number };
  myReaction: ReactionType | null;
  commentCount: number;
  createdAt: number;
}

export interface FeedComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: number;
}

export const FeedService = {
  /** Fetch first page of posts (20). Returns posts + last doc for pagination. */
  async getPosts(
    userId: string,
    lastDoc?: DocumentSnapshot,
  ): Promise<{ posts: FeedPost[]; lastDoc: DocumentSnapshot | null }> {
    let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
    if (lastDoc) q = query(q, startAfter(lastDoc));
    const snap = await getDocs(q);

    const posts: FeedPost[] = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        const reactionSnap = await getDoc(doc(db, 'posts', d.id, 'userReactions', userId));
        return {
          id: d.id,
          authorId: data.authorId,
          authorName: data.authorName,
          authorEmoji: data.authorEmoji ?? '🌙',
          authorZodiac: data.authorZodiac ?? '',
          type: data.type,
          content: data.content,
          reactions: data.reactions ?? { resonuje: 0, prawda: 0, czuje: 0 },
          myReaction: reactionSnap.exists() ? reactionSnap.data().type : null,
          commentCount: data.commentCount ?? 0,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
        };
      })
    );
    const last = snap.docs[snap.docs.length - 1] ?? null;
    return { posts, lastDoc: last };
  },

  /** Create a new post */
  async createPost(
    author: { uid: string; displayName: string; avatarEmoji: string; zodiacSign: string },
    type: PostType,
    content: string,
  ): Promise<void> {
    await addDoc(collection(db, 'posts'), {
      authorId: author.uid,
      authorName: author.displayName,
      authorEmoji: author.avatarEmoji,
      authorZodiac: author.zodiacSign,
      type,
      content: content.trim(),
      reactions: { resonuje: 0, prawda: 0, czuje: 0 },
      commentCount: 0,
      createdAt: serverTimestamp(),
    });
  },

  /** Toggle reaction (add or change). Updates counter on post doc. */
  async toggleReaction(postId: string, userId: string, reaction: ReactionType): Promise<void> {
    const postRef = doc(db, 'posts', postId);
    const reactionRef = doc(db, 'posts', postId, 'userReactions', userId);
    await runTransaction(db, async (tx) => {
      const postSnap = await tx.get(postRef);
      const reactionSnap = await tx.get(reactionRef);
      const reactions = { ...postSnap.data()?.reactions ?? { resonuje: 0, prawda: 0, czuje: 0 } };

      if (reactionSnap.exists()) {
        const prev = reactionSnap.data().type as ReactionType;
        if (prev === reaction) {
          // remove reaction
          reactions[prev] = Math.max(0, reactions[prev] - 1);
          tx.delete(reactionRef);
        } else {
          // change reaction
          reactions[prev] = Math.max(0, reactions[prev] - 1);
          reactions[reaction] = (reactions[reaction] ?? 0) + 1;
          tx.set(reactionRef, { type: reaction });
        }
      } else {
        // add reaction
        reactions[reaction] = (reactions[reaction] ?? 0) + 1;
        tx.set(reactionRef, { type: reaction });
      }
      tx.update(postRef, { reactions });
    });
  },

  /** Add a comment to a post */
  async addComment(
    postId: string,
    author: { uid: string; displayName: string },
    text: string,
  ): Promise<void> {
    await addDoc(collection(db, 'posts', postId, 'comments'), {
      authorId: author.uid,
      authorName: author.displayName,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    // increment commentCount on post
    await runTransaction(db, async (tx) => {
      const postRef = doc(db, 'posts', postId);
      const snap = await tx.get(postRef);
      tx.update(postRef, { commentCount: (snap.data()?.commentCount ?? 0) + 1 });
    });
  },

  /** Fetch comments for a post */
  async getComments(postId: string): Promise<FeedComment[]> {
    const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        authorId: data.authorId,
        authorName: data.authorName,
        text: data.text,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
      };
    });
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/core/services/community/feed.service.ts
git commit -m "feat: add FeedService (posts, reactions, comments — Firestore)"
```

---

### Task 10: Wire GlobalShareScreen to Firestore

**Files:**
- Modify: `src/screens/GlobalShareScreen.tsx`

- [ ] **Step 1: Add imports**

```typescript
import { FeedService, FeedPost, PostType, ReactionType } from '../core/services/community/feed.service';
import { useAuthStore } from '../store/useAuthStore';
```

- [ ] **Step 2: Replace state and loading logic**

Inside `GlobalShareScreen`, replace the `posts` state initialization (which used SEED_POSTS) with:

```typescript
const { currentUser } = useAuthStore();
const [posts, setPosts] = useState<FeedPost[]>([]);
const [lastDoc, setLastDoc] = useState<any>(null);
const [loadingPosts, setLoadingPosts] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);

const loadPosts = async (reset = false) => {
  if (!currentUser) return;
  reset ? setLoadingPosts(true) : setLoadingMore(true);
  try {
    const result = await FeedService.getPosts(currentUser.uid, reset ? undefined : lastDoc);
    setPosts(prev => reset ? result.posts : [...prev, ...result.posts]);
    setLastDoc(result.lastDoc);
  } catch (e) {
    console.warn('[Feed] load failed', e);
  } finally {
    setLoadingPosts(false);
    setLoadingMore(false);
  }
};

useEffect(() => { loadPosts(true); }, [currentUser?.uid]);
```

- [ ] **Step 3: Replace create post handler**

Find the existing post creation handler and replace with:

```typescript
const handleCreatePost = async () => {
  if (!composeContent.trim() || !currentUser) return;
  setComposeLoading(true);
  try {
    await FeedService.createPost(
      { uid: currentUser.uid, displayName: currentUser.displayName, avatarEmoji: currentUser.avatarEmoji, zodiacSign: currentUser.zodiacSign },
      selectedType as PostType,
      composeContent,
    );
    setComposeVisible(false);
    setComposeContent('');
    loadPosts(true); // refresh
  } catch (e) {
    console.warn('[Feed] create post failed', e);
  } finally {
    setComposeLoading(false);
  }
};
```

- [ ] **Step 4: Replace reaction handler**

```typescript
const handleReaction = async (postId: string, reaction: ReactionType) => {
  if (!currentUser) return;
  // optimistic update
  setPosts(prev => prev.map(p => p.id !== postId ? p : {
    ...p,
    reactions: {
      ...p.reactions,
      [reaction]: p.reactions[reaction] + (p.myReaction === reaction ? -1 : 1),
      ...(p.myReaction && p.myReaction !== reaction ? { [p.myReaction]: p.reactions[p.myReaction] - 1 } : {}),
    },
    myReaction: p.myReaction === reaction ? null : reaction,
  }));
  await FeedService.toggleReaction(postId, currentUser.uid, reaction);
};
```

- [ ] **Step 5: Remove all SEED_POSTS and SEED_COMMENTS constants** from the file.

- [ ] **Step 6: Commit**

```bash
git add src/screens/GlobalShareScreen.tsx
git commit -m "feat: GlobalShareScreen — real Firestore posts, reactions, comments (replace SEED)"
```

---

## ── PHASE 4: Live Rituals + Energy Circle ────────────────────────────────────

---

### Task 11: Rituals service

**Files:**
- Create: `src/core/services/community/rituals.service.ts`

- [ ] **Step 1: Create rituals.service.ts**

```typescript
// src/core/services/community/rituals.service.ts
import {
  collection, doc, addDoc, setDoc, deleteDoc, getDoc, getDocs,
  onSnapshot, query, orderBy, runTransaction, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export interface Ritual {
  id: string;
  title: string;
  hostId: string;
  hostName: string;
  type: string;
  description: string;
  tips: string[];
  element: string;
  duration: number;
  maxParticipants: number;
  isLive: boolean;
  startTime: number;
  participantCount: number;
  createdAt: number;
}

const SEED_RITUALS = [
  { title: 'Krąg Księżycowy', type: 'KSIĘŻYC', element: 'Woda', description: 'Medytacja podczas pełni księżyca — połącz się z energią nocy.', tips: ['Zapal białą świecę','Medytuj przy oknie','Wypisz intencje'], duration: 30, maxParticipants: 50 },
  { title: 'Ogień Przemiany', type: 'OGIEŃ', element: 'Ogień', description: 'Rytuał uwalniania — spalanie tego, co już nie służy.', tips: ['Przygotuj papier i ołówek','Napisz co chcesz uwolnić','Wizualizuj przemianę'], duration: 20, maxParticipants: 30 },
  { title: 'Głęboka Medytacja', type: 'MEDYTACJA', element: 'Ziemia', description: 'Grupowa medytacja uziemienia i spokoju.', tips: ['Usiądź wygodnie','Zamknij oczy','Oddychaj głęboko'], duration: 45, maxParticipants: 100 },
  { title: 'Harmonizacja Czakr', type: 'CZAKRY', element: 'Eter', description: 'Praca z energią czakr i balansowanie aury.', tips: ['Skup się na sercu','Wizualizuj kolory','Oddychaj świadomie'], duration: 35, maxParticipants: 40 },
  { title: 'Kąpiel Dźwiękowa', type: 'WODA', element: 'Dźwięk', description: 'Uzdrawiające fale dźwiękowe — misy tybetańskie.', tips: ['Połóż się wygodnie','Zrelaksuj mięśnie','Pozwól dźwiękowi przepływać'], duration: 40, maxParticipants: 60 },
];

export const RitualsService = {
  async seedRitualsIfNeeded(hostUser: { uid: string; displayName: string }): Promise<void> {
    const snap = await getDocs(collection(db, 'rituals'));
    if (snap.size > 0) return;
    const now = Date.now();
    for (let i = 0; i < SEED_RITUALS.length; i++) {
      const r = SEED_RITUALS[i];
      await addDoc(collection(db, 'rituals'), {
        ...r,
        hostId: hostUser.uid,
        hostName: hostUser.displayName,
        isLive: i < 2,
        startTime: serverTimestamp(),
        participantCount: 0,
        createdAt: serverTimestamp(),
      });
    }
  },

  listenToRituals(onRituals: (rituals: Ritual[]) => void): () => void {
    const q = query(collection(db, 'rituals'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      const rituals = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title,
          hostId: data.hostId,
          hostName: data.hostName,
          type: data.type,
          description: data.description,
          tips: data.tips ?? [],
          element: data.element,
          duration: data.duration,
          maxParticipants: data.maxParticipants,
          isLive: data.isLive ?? false,
          startTime: data.startTime instanceof Timestamp ? data.startTime.toMillis() : Date.now(),
          participantCount: data.participantCount ?? 0,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
        } as Ritual;
      });
      onRituals(rituals);
    });
  },

  async joinRitual(ritualId: string, user: { uid: string; displayName: string }): Promise<void> {
    const partRef = doc(db, 'rituals', ritualId, 'participants', user.uid);
    const existing = await getDoc(partRef);
    if (existing.exists()) return;
    await setDoc(partRef, { joinedAt: serverTimestamp(), displayName: user.displayName });
    await runTransaction(db, async tx => {
      const ritualRef = doc(db, 'rituals', ritualId);
      const snap = await tx.get(ritualRef);
      tx.update(ritualRef, { participantCount: (snap.data()?.participantCount ?? 0) + 1 });
    });
  },

  async leaveRitual(ritualId: string, userId: string): Promise<void> {
    const partRef = doc(db, 'rituals', ritualId, 'participants', userId);
    const existing = await getDoc(partRef);
    if (!existing.exists()) return;
    await deleteDoc(partRef);
    await runTransaction(db, async tx => {
      const ritualRef = doc(db, 'rituals', ritualId);
      const snap = await tx.get(ritualRef);
      tx.update(ritualRef, { participantCount: Math.max(0, (snap.data()?.participantCount ?? 1) - 1) });
    });
  },

  async createRitual(
    host: { uid: string; displayName: string },
    data: { title: string; type: string; description: string; duration: number; element: string; maxParticipants: number },
  ): Promise<void> {
    await addDoc(collection(db, 'rituals'), {
      ...data,
      tips: [],
      hostId: host.uid,
      hostName: host.displayName,
      isLive: true,
      startTime: serverTimestamp(),
      participantCount: 0,
      createdAt: serverTimestamp(),
    });
  },

  async isParticipant(ritualId: string, userId: string): Promise<boolean> {
    const snap = await getDoc(doc(db, 'rituals', ritualId, 'participants', userId));
    return snap.exists();
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/core/services/community/rituals.service.ts
git commit -m "feat: add RitualsService (real-time rituals, join/leave, seed, create)"
```

---

### Task 12: Wire LiveRitualsScreen + create circles service

**Files:**
- Modify: `src/screens/LiveRitualsScreen.tsx`
- Create: `src/core/services/community/circles.service.ts`

- [ ] **Step 1: Create circles.service.ts**

```typescript
// src/core/services/community/circles.service.ts
import {
  doc, setDoc, deleteDoc, getDoc, addDoc, collection,
  onSnapshot, query, orderBy, limit, runTransaction, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export interface CircleIntention {
  id: string;
  authorId: string;
  authorName: string;
  authorEmoji: string;
  text: string;
  createdAt: number;
}

export interface EnergyCircle {
  participantCount: number;
  isActive: boolean;
}

function todayId(): string {
  return new Date().toISOString().split('T')[0];
}

export const CirclesService = {
  listenToCircle(onCircle: (circle: EnergyCircle) => void): () => void {
    return onSnapshot(doc(db, 'energyCircles', todayId()), snap => {
      if (snap.exists()) {
        const d = snap.data();
        onCircle({ participantCount: d.participantCount ?? 0, isActive: d.isActive ?? true });
      } else {
        onCircle({ participantCount: 0, isActive: true });
      }
    });
  },

  listenToIntentions(onIntentions: (intentions: CircleIntention[]) => void): () => void {
    const q = query(
      collection(db, 'energyCircles', todayId(), 'intentions'),
      orderBy('createdAt', 'desc'),
      limit(30),
    );
    return onSnapshot(q, snap => {
      const intentions = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          authorId: data.authorId,
          authorName: data.authorName,
          authorEmoji: data.authorEmoji ?? '🌙',
          text: data.text,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
        };
      });
      onIntentions(intentions);
    });
  },

  async joinCircle(user: { uid: string; displayName: string }): Promise<void> {
    const circleRef = doc(db, 'energyCircles', todayId());
    const partRef = doc(db, 'energyCircles', todayId(), 'participants', user.uid);
    const existing = await getDoc(partRef);
    if (existing.exists()) return;
    // auto-create circle doc if it doesn't exist
    const circleSnap = await getDoc(circleRef);
    if (!circleSnap.exists()) {
      await setDoc(circleRef, { participantCount: 0, isActive: true });
    }
    await setDoc(partRef, { joinedAt: serverTimestamp() });
    await runTransaction(db, async tx => {
      const snap = await tx.get(circleRef);
      tx.update(circleRef, { participantCount: (snap.data()?.participantCount ?? 0) + 1 });
    });
  },

  async leaveCircle(userId: string): Promise<void> {
    const circleRef = doc(db, 'energyCircles', todayId());
    const partRef = doc(db, 'energyCircles', todayId(), 'participants', userId);
    const existing = await getDoc(partRef);
    if (!existing.exists()) return;
    await deleteDoc(partRef);
    await runTransaction(db, async tx => {
      const snap = await tx.get(circleRef);
      tx.update(circleRef, { participantCount: Math.max(0, (snap.data()?.participantCount ?? 1) - 1) });
    });
  },

  async addIntention(
    user: { uid: string; displayName: string; avatarEmoji: string },
    text: string,
  ): Promise<void> {
    await addDoc(collection(db, 'energyCircles', todayId(), 'intentions'), {
      authorId: user.uid,
      authorName: user.displayName,
      authorEmoji: user.avatarEmoji,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
  },

  async isInCircle(userId: string): Promise<boolean> {
    const snap = await getDoc(doc(db, 'energyCircles', todayId(), 'participants', userId));
    return snap.exists();
  },
};
```

- [ ] **Step 2: Wire LiveRitualsScreen**

In `LiveRitualsScreen.tsx`, add imports:
```typescript
import { RitualsService, Ritual } from '../core/services/community/rituals.service';
import { useAuthStore } from '../store/useAuthStore';
```

Replace `RITUALS_BASE` and hardcoded state with:

```typescript
const { currentUser } = useAuthStore();
const [rituals, setRituals] = useState<Ritual[]>([]);
const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

useEffect(() => {
  if (!currentUser) return;
  RitualsService.seedRitualsIfNeeded(currentUser);
  const unsub = RitualsService.listenToRituals(setRituals);
  return unsub;
}, [currentUser?.uid]);

const handleJoin = async (ritualId: string) => {
  if (!currentUser) return;
  if (joinedIds.has(ritualId)) {
    await RitualsService.leaveRitual(ritualId, currentUser.uid);
    setJoinedIds(prev => { const s = new Set(prev); s.delete(ritualId); return s; });
  } else {
    await RitualsService.joinRitual(ritualId, currentUser);
    setJoinedIds(prev => new Set([...prev, ritualId]));
  }
};
```

- [ ] **Step 3: Wire EnergyCircleScreen**

In `EnergyCircleScreen.tsx`, add imports:
```typescript
import { CirclesService, CircleIntention, EnergyCircle } from '../core/services/community/circles.service';
import { useAuthStore } from '../store/useAuthStore';
```

Replace `SEED_INTENTIONS` state and effects with:

```typescript
const { currentUser } = useAuthStore();
const [circle, setCircle] = useState<EnergyCircle>({ participantCount: 0, isActive: true });
const [intentions, setIntentions] = useState<CircleIntention[]>([]);
const [isJoined, setIsJoined] = useState(false);
const [intentionText, setIntentionText] = useState('');

useEffect(() => {
  const u1 = CirclesService.listenToCircle(setCircle);
  const u2 = CirclesService.listenToIntentions(setIntentions);
  return () => { u1(); u2(); };
}, []);

const handleJoin = async () => {
  if (!currentUser) return;
  if (isJoined) {
    await CirclesService.leaveCircle(currentUser.uid);
  } else {
    await CirclesService.joinCircle(currentUser);
  }
  setIsJoined(!isJoined);
};

const handleSendIntention = async () => {
  if (!intentionText.trim() || !currentUser) return;
  await CirclesService.addIntention(currentUser, intentionText);
  setIntentionText('');
};
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/LiveRitualsScreen.tsx src/screens/EnergyCircleScreen.tsx src/core/services/community/circles.service.ts
git commit -m "feat: LiveRitualsScreen + EnergyCircleScreen — real Firestore data (replace mocks)"
```

---

## ── PHASE 5: Soul Match + Challenges + Affirmations + Chronicles ─────────────

---

### Task 13: Remaining services

**Files:**
- Create: `src/core/services/community/challenges.service.ts`
- Create: `src/core/services/community/affirmations.service.ts`
- Create: `src/core/services/community/chronicles.service.ts`
- Create: `src/core/services/community/souls.service.ts`

- [ ] **Step 1: Create challenges.service.ts**

```typescript
// src/core/services/community/challenges.service.ts
import {
  collection, doc, addDoc, setDoc, getDoc, getDocs, onSnapshot,
  query, orderBy, runTransaction, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export interface Challenge {
  id: string;
  title: string;
  days: number;
  description: string;
  task: string;
  benefits: string[];
  tips: string[];
  color: string;
  participantCount: number;
  createdBy: string;
  createdAt: number;
}

export interface ChallengeProgress {
  joinedAt: number;
  completedDays: string[];
  streak: number;
}

const SYSTEM_CHALLENGES = [
  { title: '7 dni wdzięczności', days: 7, description: 'Przez 7 dni zapisuj 3 rzeczy za które jesteś wdzięczna/y.', task: 'Zapisz dziś 3 rzeczy za które jesteś wdzięczna/y', benefits: ['Większy spokój','Pozytywne nastawienie','Lepszy sen'], tips: ['Rób to rano','Bądź konkretna/y','Czuj wdzięczność'], color: '#F472B6' },
  { title: '21 dni transformacji', days: 21, description: 'Codzienna medytacja i praca z intencją przez 21 dni.', task: 'Medytuj 10 minut i wypisz dzisiejszą intencję', benefits: ['Nowe nawyki','Głębsza intuicja','Więcej energii'], tips: ['Medytuj o tej samej porze','Pisz dziennik','Oddychaj głęboko'], color: '#818CF8' },
  { title: '30 dni przebudzenia', days: 30, description: 'Miesięczna podróż duchowa — rytuały, medytacje, afirmacje.', task: 'Wykonaj rytuał poranny i wieczorny', benefits: ['Duchowe przebudzenie','Synchroniczności','Głęboki spokój'], tips: ['Bądź konsekwentna/y','Świętuj małe sukcesy','Prowadź dziennik'], color: '#34D399' },
];

export const ChallengesService = {
  async seedIfNeeded(): Promise<void> {
    const snap = await getDocs(collection(db, 'challenges'));
    if (snap.size > 0) return;
    for (const c of SYSTEM_CHALLENGES) {
      await addDoc(collection(db, 'challenges'), { ...c, participantCount: 0, createdBy: 'system', createdAt: serverTimestamp() });
    }
  },

  listenToChallenges(onChallenges: (c: Challenge[]) => void): () => void {
    return onSnapshot(query(collection(db, 'challenges'), orderBy('days', 'asc')), snap => {
      onChallenges(snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data, createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0 } as Challenge;
      }));
    });
  },

  async joinChallenge(challengeId: string, userId: string): Promise<void> {
    const partRef = doc(db, 'challenges', challengeId, 'participants', userId);
    if ((await getDoc(partRef)).exists()) return;
    await setDoc(partRef, { joinedAt: serverTimestamp(), completedDays: [], streak: 0 });
    await runTransaction(db, async tx => {
      const ref = doc(db, 'challenges', challengeId);
      const snap = await tx.get(ref);
      tx.update(ref, { participantCount: (snap.data()?.participantCount ?? 0) + 1 });
    });
  },

  async checkIn(challengeId: string, userId: string): Promise<void> {
    const partRef = doc(db, 'challenges', challengeId, 'participants', userId);
    const snap = await getDoc(partRef);
    if (!snap.exists()) return;
    const today = new Date().toISOString().split('T')[0];
    const data = snap.data();
    const completed: string[] = data.completedDays ?? [];
    if (completed.includes(today)) return; // already checked in
    const newCompleted = [...completed, today];
    // compute streak
    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < newCompleted.length; i++) {
      const expected = cursor.toISOString().split('T')[0];
      if (newCompleted.slice().reverse()[i] === expected) { streak++; cursor.setDate(cursor.getDate() - 1); }
      else break;
    }
    await setDoc(partRef, { completedDays: newCompleted, streak, lastCheckIn: serverTimestamp() }, { merge: true });
  },

  async getProgress(challengeId: string, userId: string): Promise<ChallengeProgress | null> {
    const snap = await getDoc(doc(db, 'challenges', challengeId, 'participants', userId));
    if (!snap.exists()) return null;
    const d = snap.data();
    return { joinedAt: d.joinedAt instanceof Timestamp ? d.joinedAt.toMillis() : 0, completedDays: d.completedDays ?? [], streak: d.streak ?? 0 };
  },

  async createCustom(
    user: { uid: string; displayName: string },
    data: { title: string; days: number; task: string },
  ): Promise<void> {
    await addDoc(collection(db, 'challenges'), {
      title: data.title, days: data.days, task: data.task,
      description: `Wyzwanie stworzone przez ${user.displayName}`,
      benefits: [], tips: [], color: '#A78BFA',
      participantCount: 0, createdBy: user.uid, createdAt: serverTimestamp(),
    });
  },
};
```

- [ ] **Step 2: Create affirmations.service.ts**

```typescript
// src/core/services/community/affirmations.service.ts
import {
  doc, getDoc, setDoc, getDocs, addDoc, collection,
  query, where, orderBy, runTransaction, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export interface Affirmation {
  id: string;
  text: string;
  weekStart: string;
  votes: number;
  reactions: { heart: number; star: number; flower: number };
  isHero: boolean;
  createdBy: string;
}

const WEEKLY_SEED = [
  'Jestem gotow(a) przyjąć miłość, której szukam w sobie od dawna.',
  'Moje granice są wyrazem szacunku do siebie.',
  'Każdy dzień przynosi nowe możliwości wzrostu.',
  'Jestem połączona/y z mądrością wszechświata.',
  'Moje marzenia są wskazówkami mojej duszy.',
  'Jestem wystarczająca/y dokładnie taka/i jaka/i jestem.',
  'Zmiana zaczyna się od chwili obecnej.',
];

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export const AffirmationsService = {
  async getOrSeedHeroAffirmation(): Promise<Affirmation> {
    const weekStart = getWeekStart();
    const ref = doc(db, 'affirmations', weekStart);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Affirmation;
    }
    // seed weekly affirmation
    const weekIndex = Math.floor(Date.now() / (7 * 24 * 3600 * 1000)) % WEEKLY_SEED.length;
    const affirmation: Omit<Affirmation, 'id'> = {
      text: WEEKLY_SEED[weekIndex],
      weekStart,
      votes: 0,
      reactions: { heart: 0, star: 0, flower: 0 },
      isHero: true,
      createdBy: 'system',
    };
    await setDoc(ref, { ...affirmation, createdAt: serverTimestamp() });
    return { id: weekStart, ...affirmation };
  },

  async vote(affirmationId: string, userId: string): Promise<boolean> {
    const voteRef = doc(db, 'affirmations', affirmationId, 'userVotes', userId);
    const affRef = doc(db, 'affirmations', affirmationId);
    const existing = await getDoc(voteRef);
    if (existing.exists()) {
      // un-vote
      await runTransaction(db, async tx => {
        const snap = await tx.get(affRef);
        tx.update(affRef, { votes: Math.max(0, (snap.data()?.votes ?? 1) - 1) });
        tx.delete(voteRef);
      });
      return false;
    } else {
      await runTransaction(db, async tx => {
        const snap = await tx.get(affRef);
        tx.update(affRef, { votes: (snap.data()?.votes ?? 0) + 1 });
        tx.set(voteRef, { votedAt: serverTimestamp() });
      });
      return true;
    }
  },

  async hasVoted(affirmationId: string, userId: string): Promise<boolean> {
    const snap = await getDoc(doc(db, 'affirmations', affirmationId, 'userVotes', userId));
    return snap.exists();
  },

  async react(affirmationId: string, userId: string, reaction: 'heart'|'star'|'flower'): Promise<void> {
    const reactRef = doc(db, 'affirmations', affirmationId, 'userReactions', userId);
    const affRef = doc(db, 'affirmations', affirmationId);
    await runTransaction(db, async tx => {
      const reactSnap = await tx.get(reactRef);
      const affSnap = await tx.get(affRef);
      const reactions = { ...affSnap.data()?.reactions ?? { heart: 0, star: 0, flower: 0 } };
      if (reactSnap.exists()) {
        const prev = reactSnap.data().type;
        reactions[prev] = Math.max(0, reactions[prev] - 1);
      }
      reactions[reaction] = (reactions[reaction] ?? 0) + 1;
      tx.update(affRef, { reactions });
      tx.set(reactRef, { type: reaction });
    });
  },

  async propose(user: { uid: string; displayName: string }, text: string): Promise<void> {
    await addDoc(collection(db, 'affirmationProposals'), {
      text: text.trim(),
      authorId: user.uid,
      authorName: user.displayName,
      votes: 0,
      createdAt: serverTimestamp(),
    });
  },
};
```

- [ ] **Step 3: Create chronicles.service.ts**

```typescript
// src/core/services/community/chronicles.service.ts
import {
  collection, doc, addDoc, getDocs, onSnapshot, query,
  orderBy, where, limit, runTransaction, getDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export interface Chronicle {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  category: string;
  likes: number;
  commentCount: number;
  reads: number;
  createdAt: number;
}

export interface ChronicleComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: number;
}

const COLORS = ['#818CF8','#F472B6','#34D399','#FB923C','#A78BFA','#60A5FA'];

export const ChroniclesService = {
  listenToChronicles(
    category: string | null,
    onData: (chronicles: Chronicle[]) => void,
  ): () => void {
    let q = query(collection(db, 'chronicles'), orderBy('createdAt', 'desc'), limit(30));
    if (category) q = query(q, where('category', '==', category));
    return onSnapshot(q, snap => {
      onData(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id, title: data.title, body: data.body,
          authorId: data.authorId, authorName: data.authorName,
          authorInitials: data.authorInitials, authorColor: data.authorColor,
          category: data.category, likes: data.likes ?? 0,
          commentCount: data.commentCount ?? 0, reads: data.reads ?? 0,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
        } as Chronicle;
      }));
    });
  },

  async createChronicle(
    author: { uid: string; displayName: string },
    data: { title: string; body: string; category: string },
  ): Promise<void> {
    const initials = author.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    await addDoc(collection(db, 'chronicles'), {
      title: data.title, body: data.body, category: data.category,
      authorId: author.uid, authorName: author.displayName,
      authorInitials: initials, authorColor: color,
      likes: 0, commentCount: 0, reads: 0,
      createdAt: serverTimestamp(),
    });
  },

  async toggleLike(chronicleId: string, userId: string): Promise<void> {
    const likeRef = doc(db, 'chronicles', chronicleId, 'userLikes', userId);
    const chronicleRef = doc(db, 'chronicles', chronicleId);
    await runTransaction(db, async tx => {
      const likeSnap = await tx.get(likeRef);
      const chronicleSnap = await tx.get(chronicleRef);
      const currentLikes = chronicleSnap.data()?.likes ?? 0;
      if (likeSnap.exists()) {
        tx.delete(likeRef);
        tx.update(chronicleRef, { likes: Math.max(0, currentLikes - 1) });
      } else {
        tx.set(likeRef, { likedAt: serverTimestamp() });
        tx.update(chronicleRef, { likes: currentLikes + 1 });
      }
    });
  },

  async hasLiked(chronicleId: string, userId: string): Promise<boolean> {
    const snap = await getDoc(doc(db, 'chronicles', chronicleId, 'userLikes', userId));
    return snap.exists();
  },

  async addComment(chronicleId: string, author: { uid: string; displayName: string }, text: string): Promise<void> {
    await addDoc(collection(db, 'chronicles', chronicleId, 'comments'), {
      authorId: author.uid, authorName: author.displayName,
      text: text.trim(), createdAt: serverTimestamp(),
    });
    await runTransaction(db, async tx => {
      const ref = doc(db, 'chronicles', chronicleId);
      const snap = await tx.get(ref);
      tx.update(ref, { commentCount: (snap.data()?.commentCount ?? 0) + 1 });
    });
  },

  async getComments(chronicleId: string): Promise<ChronicleComment[]> {
    const q = query(collection(db, 'chronicles', chronicleId, 'comments'), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id, authorId: data.authorId, authorName: data.authorName,
        text: data.text, createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
      };
    });
  },

  async incrementReads(chronicleId: string): Promise<void> {
    await runTransaction(db, async tx => {
      const ref = doc(db, 'chronicles', chronicleId);
      const snap = await tx.get(ref);
      tx.update(ref, { reads: (snap.data()?.reads ?? 0) + 1 });
    });
  },
};
```

- [ ] **Step 4: Create souls.service.ts**

```typescript
// src/core/services/community/souls.service.ts
import {
  collection, doc, getDoc, getDocs, setDoc, query,
  orderBy, limit, startAfter, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { AetheraUser } from '../../services/auth.service';

export interface SoulProfile {
  uid: string;
  displayName: string;
  zodiacSign: string;
  archetype: string;
  avatarEmoji: string;
  bio: string;
}

const ELEM: Record<string, string> = { Baran:'Ogień',Lew:'Ogień',Strzelec:'Ogień', Byk:'Ziemia',Panna:'Ziemia',Koziorożec:'Ziemia', Bliźnięta:'Powietrze',Waga:'Powietrze',Wodnik:'Powietrze', Rak:'Woda',Skorpion:'Woda',Ryby:'Woda' };
const COMPAT: Record<string, Record<string, number>> = { Ogień:{Ogień:90,Powietrze:80,Ziemia:55,Woda:50}, Ziemia:{Ziemia:90,Woda:80,Ogień:55,Powietrze:60}, Powietrze:{Powietrze:90,Ogień:80,Woda:55,Ziemia:60}, Woda:{Woda:90,Ziemia:80,Powietrze:55,Ogień:50} };

export function calcSoulCompat(a: SoulProfile, b: SoulProfile): number {
  const ea = ELEM[a.zodiacSign] ?? 'Ogień';
  const eb = ELEM[b.zodiacSign] ?? 'Ogień';
  return COMPAT[ea]?.[eb] ?? 65;
}

export const SoulsService = {
  async browseProfiles(currentUserId: string, lastDoc?: any): Promise<{ profiles: SoulProfile[]; lastDoc: any }> {
    let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(20));
    if (lastDoc) q = query(q, startAfter(lastDoc));
    const snap = await getDocs(q);
    const profiles = snap.docs
      .filter(d => d.id !== currentUserId)
      .map(d => ({ uid: d.id, ...d.data() } as SoulProfile));
    return { profiles, lastDoc: snap.docs[snap.docs.length - 1] ?? null };
  },

  async connect(initiatorId: string, targetId: string, message: string): Promise<void> {
    const connectionId = [initiatorId, targetId].sort().join('_');
    await setDoc(doc(db, 'connections', connectionId), {
      users: [initiatorId, targetId],
      initiatorId,
      status: 'pending',
      message: message.trim(),
      createdAt: serverTimestamp(),
    });
  },

  async getConnections(userId: string): Promise<string[]> {
    const snap = await getDocs(query(collection(db, 'connections'), where('users', 'array-contains', userId)));
    return snap.docs.map(d => {
      const users: string[] = d.data().users;
      return users.find(u => u !== userId) ?? '';
    }).filter(Boolean);
  },

  async isConnected(userId: string, targetId: string): Promise<boolean> {
    const connectionId = [userId, targetId].sort().join('_');
    const snap = await getDoc(doc(db, 'connections', connectionId));
    return snap.exists();
  },
};
```

- [ ] **Step 5: Commit all services**

```bash
git add src/core/services/community/
git commit -m "feat: add challenges, affirmations, chronicles, souls Firestore services"
```

---

### Task 14: Wire Phase 5 screens

**Files:**
- Modify: `src/screens/SpiritualChallengesScreen.tsx`
- Modify: `src/screens/CommunityAffirmationScreen.tsx`
- Modify: `src/screens/CommunityChronicleScreen.tsx`
- Modify: `src/screens/SoulMatchScreen.tsx`

- [ ] **Step 1: Wire SpiritualChallengesScreen**

Add imports:
```typescript
import { ChallengesService, Challenge, ChallengeProgress } from '../core/services/community/challenges.service';
import { useAuthStore } from '../store/useAuthStore';
```

Replace challenge state:
```typescript
const { currentUser } = useAuthStore();
const [challenges, setChallenges] = useState<Challenge[]>([]);
const [progress, setProgress] = useState<Record<string, ChallengeProgress | null>>({});

useEffect(() => {
  ChallengesService.seedIfNeeded();
  const unsub = ChallengesService.listenToChallenges(setChallenges);
  return unsub;
}, []);

const handleJoin = async (challengeId: string) => {
  if (!currentUser) return;
  await ChallengesService.joinChallenge(challengeId, currentUser.uid);
  const p = await ChallengesService.getProgress(challengeId, currentUser.uid);
  setProgress(prev => ({ ...prev, [challengeId]: p }));
};

const handleCheckIn = async (challengeId: string) => {
  if (!currentUser) return;
  await ChallengesService.checkIn(challengeId, currentUser.uid);
  const p = await ChallengesService.getProgress(challengeId, currentUser.uid);
  setProgress(prev => ({ ...prev, [challengeId]: p }));
};
```

- [ ] **Step 2: Wire CommunityAffirmationScreen**

Add imports:
```typescript
import { AffirmationsService, Affirmation } from '../core/services/community/affirmations.service';
import { useAuthStore } from '../store/useAuthStore';
```

Replace hero affirmation state:
```typescript
const { currentUser } = useAuthStore();
const [heroAffirmation, setHeroAffirmation] = useState<Affirmation | null>(null);
const [hasVoted, setHasVoted] = useState(false);

useEffect(() => {
  AffirmationsService.getOrSeedHeroAffirmation().then(async aff => {
    setHeroAffirmation(aff);
    if (currentUser) {
      const voted = await AffirmationsService.hasVoted(aff.id, currentUser.uid);
      setHasVoted(voted);
    }
  });
}, [currentUser?.uid]);

const handleVote = async () => {
  if (!heroAffirmation || !currentUser) return;
  const nowVoted = await AffirmationsService.vote(heroAffirmation.id, currentUser.uid);
  setHasVoted(nowVoted);
  setHeroAffirmation(prev => prev ? { ...prev, votes: prev.votes + (nowVoted ? 1 : -1) } : prev);
};

const handlePropose = async (text: string) => {
  if (!currentUser) return;
  await AffirmationsService.propose(currentUser, text);
};
```

- [ ] **Step 3: Wire CommunityChronicleScreen**

Add imports:
```typescript
import { ChroniclesService, Chronicle } from '../core/services/community/chronicles.service';
import { useAuthStore } from '../store/useAuthStore';
```

Replace ENTRIES state:
```typescript
const { currentUser } = useAuthStore();
const [chronicles, setChronicles] = useState<Chronicle[]>([]);
const [activeCategory, setActiveCategory] = useState<string | null>(null);

useEffect(() => {
  const unsub = ChroniclesService.listenToChronicles(activeCategory, setChronicles);
  return unsub;
}, [activeCategory]);

const handlePublish = async (title: string, body: string, category: string) => {
  if (!currentUser) return;
  await ChroniclesService.createChronicle(currentUser, { title, body, category });
};

const handleLike = async (chronicleId: string) => {
  if (!currentUser) return;
  await ChroniclesService.toggleLike(chronicleId, currentUser.uid);
};
```

- [ ] **Step 4: Wire SoulMatchScreen**

Add imports:
```typescript
import { SoulsService, SoulProfile, calcSoulCompat } from '../core/services/community/souls.service';
import { useAuthStore } from '../store/useAuthStore';
```

Replace RAW_PROFILES state:
```typescript
const { currentUser } = useAuthStore();
const [profiles, setProfiles] = useState<SoulProfile[]>([]);
const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
const [lastDoc, setLastDoc] = useState<any>(null);

useEffect(() => {
  if (!currentUser) return;
  SoulsService.browseProfiles(currentUser.uid).then(({ profiles: p, lastDoc: ld }) => {
    setProfiles(p); setLastDoc(ld);
  });
  SoulsService.getConnections(currentUser.uid).then(ids => setConnectedIds(new Set(ids)));
}, [currentUser?.uid]);

const handleConnect = async (targetId: string, message: string) => {
  if (!currentUser) return;
  await SoulsService.connect(currentUser.uid, targetId, message);
  setConnectedIds(prev => new Set([...prev, targetId]));
};

// Use calcSoulCompat(currentUserProfile, targetProfile) for compatibility %
// currentUserProfile: { uid: currentUser.uid, zodiacSign: currentUser.zodiacSign, ... }
```

- [ ] **Step 5: Commit**

```bash
git add src/screens/SpiritualChallengesScreen.tsx src/screens/CommunityAffirmationScreen.tsx src/screens/CommunityChronicleScreen.tsx src/screens/SoulMatchScreen.tsx
git commit -m "feat: Phase 5 screens — SoulMatch, Challenges, Affirmations, Chronicles wired to Firestore"
```

---

## ── FINAL: Cleanup & Polish ──────────────────────────────────────────────────

---

### Task 15: Remove all remaining SEED_ constants

**Files:**
- Modify: all community screens that still have SEED_ data

- [ ] **Step 1: Search for remaining SEED_ constants**

```bash
grep -rn "SEED_\|MOCK_\|RAW_PROFILES\|RITUALS_BASE\|CHALLENGES\s*=\s*\[" src/screens/Community*.tsx src/screens/Global*.tsx src/screens/Live*.tsx src/screens/Energy*.tsx src/screens/Soul*.tsx src/screens/Spiritual*.tsx
```

- [ ] **Step 2: Remove each found constant**

For each file that still contains SEED_ data:
- Delete the constant definition
- Ensure the JSX references the Firestore state variables instead

- [ ] **Step 3: Final test**

1. Reload app fresh (no cached state)
2. Register two accounts on two devices/simulators
3. Open CommunityChatScreen on both — send a message on one, verify it appears on the other within 2 seconds
4. Open GlobalShareScreen — create a post, verify it appears on both devices
5. Join a ritual on one device — verify participantCount increases on both
6. Join energy circle on one device, add an intention — verify on other device

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: community platform complete — all 9 screens backed by Firebase Firestore"
```
