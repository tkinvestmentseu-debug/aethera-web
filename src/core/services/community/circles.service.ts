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
      onIntentions(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id, authorId: data.authorId, authorName: data.authorName,
          authorEmoji: data.authorEmoji ?? '🌙', text: data.text,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
        };
      }));
    });
  },

  async joinCircle(user: { uid: string; displayName: string }): Promise<void> {
    const circleRef = doc(db, 'energyCircles', todayId());
    const partRef = doc(db, 'energyCircles', todayId(), 'participants', user.uid);
    if ((await getDoc(partRef)).exists()) return;
    if (!(await getDoc(circleRef)).exists()) {
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
    if (!(await getDoc(partRef)).exists()) return;
    await deleteDoc(partRef);
    await runTransaction(db, async tx => {
      const snap = await tx.get(circleRef);
      tx.update(circleRef, { participantCount: Math.max(0, (snap.data()?.participantCount ?? 1) - 1) });
    });
  },

  async addIntention(user: { uid: string; displayName: string; avatarEmoji: string }, text: string): Promise<void> {
    await addDoc(collection(db, 'energyCircles', todayId(), 'intentions'), {
      authorId: user.uid, authorName: user.displayName,
      authorEmoji: user.avatarEmoji, text: text.trim(),
      createdAt: serverTimestamp(),
    });
  },

  async isInCircle(userId: string): Promise<boolean> {
    return (await getDoc(doc(db, 'energyCircles', todayId(), 'participants', userId))).exists();
  },
};
