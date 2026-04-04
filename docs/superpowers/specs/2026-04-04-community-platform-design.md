# Aethera — Community Platform Design
**Date:** 2026-04-04
**Status:** Approved
**Scope:** Full Firebase-backed community platform replacing all mocked data in 9 Wspólnota screens

---

## 1. Goal

Replace all SEED_/hardcoded data in community screens with real Firebase backend. Users can communicate, create rooms, join live rituals and meditation circles, match with other souls, share chronicles, and vote on affirmations — all persisted and synced in real-time across devices.

---

## 2. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Database + real-time | Firebase Firestore | Real-time listeners, offline support, generous free tier |
| Authentication | Firebase Auth (email/password) | Works in Expo Go, no native modules needed |
| File storage | Firebase Storage | Profile avatars, post images (future) |
| Client SDK | `firebase` JS SDK (not react-native-firebase) | Works in Expo Go without custom dev build |

**Firebase plan:** Spark (free) — 50K reads/day, 20K writes/day, unlimited auth, 5GB storage.

---

## 3. Firestore Data Model

### 3.1 Users
```
/users/{userId}
  displayName: string          // "Zofia"
  email: string
  zodiacSign: string           // "Baran", "Byk", …
  archetype: string            // "Mistyk", "Wojownik", …
  avatarEmoji: string          // "🌙"
  bio: string
  createdAt: Timestamp
  lastSeen: Timestamp
```

### 3.2 Chat Rooms
```
/chatRooms/{roomId}            // roomId = "general", "tarot", "meditation", …
  name: string
  emoji: string
  description: string
  memberCount: number          // updated via client transaction

/chatRooms/{roomId}/messages/{messageId}
  text: string
  authorId: string
  authorName: string
  authorEmoji: string
  createdAt: Timestamp
```
8 default rooms seeded on first app launch: general, tarot, meditation, dreams, astrology, rituals, support, affirmations.
Messages limited to last 100 per room (client-side slice). Older messages not loaded.

### 3.3 Global Feed (Posts)
```
/posts/{postId}
  authorId: string
  authorName: string
  authorEmoji: string
  authorZodiac: string
  type: 'TAROT'|'HOROSKOP'|'MEDYTACJA'|'AFIRMACJA'|'SEN'|'REFLEKSJA'
  content: string
  reactions: { resonuje: number, prawda: number, czuje: number }
  commentCount: number
  createdAt: Timestamp

/posts/{postId}/comments/{commentId}
  authorId: string
  authorName: string
  text: string
  createdAt: Timestamp

/posts/{postId}/userReactions/{userId}
  type: string                 // which reaction this user gave
```
Feed ordered by createdAt desc. Pagination: 20 posts per load. Filter by type works client-side on loaded batch.

### 3.4 Live Rituals
```
/rituals/{ritualId}
  title: string
  hostId: string
  hostName: string
  type: 'KSIĘŻYC'|'OGIEŃ'|'MEDYTACJA'|'CZAKRY'|'WODA'
  description: string
  tips: string[]
  element: string
  duration: number             // minutes
  maxParticipants: number
  isLive: boolean
  startTime: Timestamp
  createdAt: Timestamp

/rituals/{ritualId}/participants/{userId}
  joinedAt: Timestamp
  displayName: string
```
participantCount derived from participants subcollection size (Firestore count query or denormalized on join/leave via transaction).

### 3.5 Energy Circle
```
/energyCircles/{date}          // date = "2026-04-04" (one per day, auto-created)
  isActive: boolean
  participantCount: number

/energyCircles/{date}/intentions/{intentionId}
  authorId: string
  authorName: string
  authorEmoji: string
  text: string
  createdAt: Timestamp

/energyCircles/{date}/participants/{userId}
  joinedAt: Timestamp
```
Daily circle auto-created on first join of the day. participantCount maintained via transaction.

### 3.6 Challenges
```
/challenges/{challengeId}
  title: string
  days: number                 // 7, 21, 30, or custom
  description: string
  task: string                 // daily task description
  benefits: string[]
  tips: string[]
  color: string
  participantCount: number
  createdBy: 'system' | userId
  createdAt: Timestamp

/challenges/{challengeId}/participants/{userId}
  joinedAt: Timestamp
  completedDays: string[]      // ["2026-04-01", "2026-04-02", …]
  streak: number
  lastCheckIn: Timestamp
```
3 system challenges seeded on app init (7/21/30 days). Users can create custom challenges.

### 3.7 Affirmations
```
/affirmations/{affirmationId}
  text: string
  weekStart: string            // "2026-03-31" (Monday)
  votes: number
  reactions: { heart: number, star: number, flower: number }
  isHero: boolean              // one hero per week
  createdBy: 'system' | userId
  createdAt: Timestamp

/affirmations/{affirmationId}/userVotes/{userId}
  votedAt: Timestamp

/affirmations/{affirmationId}/userReactions/{userId}
  type: 'heart'|'star'|'flower'
```
Weekly hero affirmation seeded by system. Users can propose affirmations for next week.

### 3.8 Chronicles
```
/chronicles/{chronicleId}
  title: string
  body: string
  authorId: string
  authorName: string
  authorInitials: string
  authorColor: string
  category: 'Transformacje'|'Cuda'|'Synchroniczności'|'Uzdrowienia'|'Wizje'
  likes: number
  commentCount: number
  reads: number
  createdAt: Timestamp

/chronicles/{chronicleId}/comments/{commentId}
  authorId: string
  authorName: string
  text: string
  createdAt: Timestamp

/chronicles/{chronicleId}/userLikes/{userId}
  likedAt: Timestamp
```

### 3.9 Soul Match
Soul matching uses the existing local compatibility algorithm but operates on real user profiles from Firestore.
```
/users/{userId}               // existing collection — no new collection needed
  zodiacSign, archetype        // used for compatibility calculation
```
Users discover other real users (paginated, 20 at a time). Connection state stored in:
```
/connections/{connectionId}   // connectionId = sorted([userId1, userId2]).join('_')
  users: [userId1, userId2]
  initiatorId: string
  status: 'pending' | 'connected'
  createdAt: Timestamp
  message: string             // optional ice-breaker message
```

---

## 4. Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users: read by anyone logged in, write only own doc
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Chat: read/write by any authenticated user; no delete of others' messages
    match /chatRooms/{roomId} {
      allow read: if request.auth != null;
      match /messages/{msgId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null
          && request.resource.data.authorId == request.auth.uid;
        allow delete: if request.auth.uid == resource.data.authorId;
      }
    }

    // Posts: read all, create own, delete own
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.resource.data.authorId == request.auth.uid;
      allow delete: if request.auth.uid == resource.data.authorId;
      match /comments/{commentId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow delete: if request.auth.uid == resource.data.authorId;
      }
      match /userReactions/{userId} {
        allow read, write: if request.auth.uid == userId;
      }
    }

    // Rituals, energyCircles, challenges, affirmations, chronicles: similar pattern
    match /{collection}/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null
        && resource.data.authorId == request.auth.uid;
    }
  }
}
```

---

## 5. New Files & Services

```
src/
  core/
    services/
      firebase.service.ts      // Firebase app init + Auth methods (login, register, logout)
      firestore.service.ts     // All Firestore CRUD: chat, posts, rituals, circles, etc.
    config/
      firebase.config.ts       // Firebase project config (from Firebase Console)
  store/
    useAuthStore.ts            // Zustand: currentUser, isLoggedIn, loading
  screens/
    auth/
      LoginScreen.tsx          // Email + password login form
      RegisterScreen.tsx       // Registration: email, password, displayName, zodiac, archetype
  navigation/
    AppNavigator.tsx           // Add auth gate: show auth screens if not logged in
```

---

## 6. Implementation Phases

### Phase 1 — Auth + User Profile (Foundation)
**Deliverables:**
- Install `firebase` npm package
- `firebase.config.ts` with project credentials
- `firebase.service.ts`: `login()`, `register()`, `logout()`, `onAuthStateChanged()`
- `useAuthStore.ts`: `currentUser`, `isLoggedIn`, `loading`
- `LoginScreen.tsx` + `RegisterScreen.tsx` (email, hasło, displayName, zodiac, archetype, avatarEmoji)
- Auth gate in `AppNavigator.tsx`: redirect to Login if not authenticated
- Write user doc to `/users/{uid}` on register

### Phase 2 — Community Chat
**Deliverables:**
- `firestore.service.ts`: `sendMessage()`, `listenToMessages()`, `getRooms()`
- Seed 8 default rooms on first launch (if not exist)
- `CommunityChatScreen.tsx`: replace SEED_MESSAGES_BY_ROOM with Firestore real-time listener
- Messages persist across sessions, visible to all users
- Show real author names/emojis from user profiles

### Phase 3 — Global Feed
**Deliverables:**
- `firestore.service.ts`: `createPost()`, `listenToPosts()`, `addReaction()`, `addComment()`
- `GlobalShareScreen.tsx`: replace SEED_POSTS/SEED_COMMENTS with Firestore
- Pagination (20 posts, load more on scroll)
- Reactions and comments persist
- New posts appear in real-time for all users

### Phase 4 — Live Rituals + Energy Circle
**Deliverables:**
- `firestore.service.ts`: `createRitual()`, `joinRitual()`, `leaveRitual()`, `listenToRituals()`
- `firestore.service.ts`: `joinEnergyCircle()`, `addIntention()`, `listenToCircle()`
- `LiveRitualsScreen.tsx`: real participant counts, real join/leave
- `EnergyCircleScreen.tsx`: real intentions, real participant sync
- Daily circle auto-created on first join

### Phase 5 — Soul Match + Challenges + Affirmations + Chronicles
**Deliverables:**
- `SoulMatchScreen.tsx`: browse real user profiles, real connections
- `SpiritualChallengesScreen.tsx`: real join, real daily check-ins, real streaks
- `CommunityAffirmationScreen.tsx`: real votes, real proposals
- `CommunityChronicleScreen.tsx`: real stories, real comments, real likes

---

## 7. Firebase Console Setup Checklist

1. Create project `aethera` at console.firebase.google.com
2. Enable **Authentication** → Sign-in method → **Email/Password**
3. Create **Firestore Database** → Start in **production mode** → Region: **europe-west1**
4. Enable **Storage** (for future avatar uploads)
5. Add **iOS app** → Bundle ID: from app.json → Download `GoogleService-Info.plist`
6. Copy **Web app config** (apiKey, authDomain, projectId, …) to `firebase.config.ts`
7. Paste **Security Rules** from Section 4 above

---

## 8. Key Design Decisions

- **No Cloud Functions** — all writes done from client to keep within free tier and avoid billing surprises
- **Denormalized counts** — participantCount, commentCount, likes stored directly on parent doc (avoid expensive subcollection counts)
- **Optimistic UI** — reactions and likes update locally before Firestore confirms
- **Last 100 messages** — chat history truncated client-side to avoid large reads
- **One energy circle per day** — auto-created, prevents fragmentation
- **Real-time listeners unsubscribed on screen unmount** — prevents memory leaks
