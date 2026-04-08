import {
  collection, doc, addDoc, setDoc, getDoc, getDocs, collectionGroup,
  onSnapshot, query, orderBy, limit, runTransaction, serverTimestamp, Timestamp,
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
  { title: '7 dni wdzięczności', days: 7, description: 'Przez 7 dni zapisuj 3 rzeczy za które jesteś wdzięczna/y.', task: 'Zapisz dziś 3 rzeczy za które jesteś wdzięczna/y', benefits: ['Większy spokój', 'Pozytywne nastawienie', 'Lepszy sen'], tips: ['Rób to rano', 'Bądź konkretna/y', 'Czuj wdzięczność'], color: '#F472B6' },
  { title: '21 dni transformacji', days: 21, description: 'Codzienna medytacja i praca z intencją przez 21 dni.', task: 'Medytuj 10 minut i wypisz dzisiejszą intencję', benefits: ['Nowe nawyki', 'Głębsza intuicja', 'Więcej energii'], tips: ['Medytuj o tej samej porze', 'Pisz dziennik', 'Oddychaj głęboko'], color: '#818CF8' },
  { title: '30 dni przebudzenia', days: 30, description: 'Miesięczna podróż duchowa — rytuały, medytacje, afirmacje.', task: 'Wykonaj rytuał poranny i wieczorny', benefits: ['Duchowe przebudzenie', 'Synchroniczności', 'Głęboki spokój'], tips: ['Bądź konsekwentna/y', 'Świętuj małe sukcesy', 'Prowadź dziennik'], color: '#34D399' },
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

  async joinChallenge(challengeId: string, userId: string, displayName?: string): Promise<void> {
    const partRef = doc(db, 'challenges', challengeId, 'participants', userId);
    if ((await getDoc(partRef)).exists()) return;
    await setDoc(partRef, { joinedAt: serverTimestamp(), completedDays: [], streak: 0, userId, displayName: displayName ?? 'Dusza' });
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
    if (completed.includes(today)) return;
    const newCompleted = [...completed, today].sort();
    let streak = 0;
    const cursor = new Date();
    for (let i = newCompleted.length - 1; i >= 0; i--) {
      const expected = cursor.toISOString().split('T')[0];
      if (newCompleted[i] === expected) { streak++; cursor.setDate(cursor.getDate() - 1); }
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

  async getLeaderboard(): Promise<Array<{ userId: string; displayName: string; streak: number; days: number }>> {
    try {
      const q = query(collectionGroup(db, 'participants'), orderBy('streak', 'desc'), limit(10));
      const snap = await getDocs(q);
      return snap.docs.map(d => {
        const data = d.data();
        return {
          userId: data.userId ?? d.id,
          displayName: data.displayName ?? `Dusza`,
          streak: data.streak ?? 0,
          days: (data.completedDays ?? []).length,
        };
      });
    } catch { return []; }
  },

  async createCustom(user: { uid: string; displayName: string }, data: { title: string; days: number; task: string }): Promise<void> {
    await addDoc(collection(db, 'challenges'), {
      title: data.title, days: data.days, task: data.task,
      description: `Wyzwanie stworzone przez ${user.displayName}`,
      benefits: [], tips: [], color: '#A78BFA',
      participantCount: 0, createdBy: user.uid, createdAt: serverTimestamp(),
    });
  },
};
