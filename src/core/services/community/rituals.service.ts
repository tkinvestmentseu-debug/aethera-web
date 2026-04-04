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
  { title: 'Krąg Księżycowy', type: 'KSIĘŻYC', element: 'Woda', description: 'Medytacja podczas pełni księżyca — połącz się z energią nocy.', tips: ['Zapal białą świecę', 'Medytuj przy oknie', 'Wypisz intencje'], duration: 30, maxParticipants: 50, isLive: true },
  { title: 'Ogień Przemiany', type: 'OGIEŃ', element: 'Ogień', description: 'Rytuał uwalniania — spalanie tego, co już nie służy.', tips: ['Przygotuj papier i ołówek', 'Napisz co chcesz uwolnić', 'Wizualizuj przemianę'], duration: 20, maxParticipants: 30, isLive: true },
  { title: 'Głęboka Medytacja', type: 'MEDYTACJA', element: 'Ziemia', description: 'Grupowa medytacja uziemienia i spokoju.', tips: ['Usiądź wygodnie', 'Zamknij oczy', 'Oddychaj głęboko'], duration: 45, maxParticipants: 100, isLive: false },
  { title: 'Harmonizacja Czakr', type: 'CZAKRY', element: 'Eter', description: 'Praca z energią czakr i balansowanie aury.', tips: ['Skup się na sercu', 'Wizualizuj kolory', 'Oddychaj świadomie'], duration: 35, maxParticipants: 40, isLive: false },
  { title: 'Kąpiel Dźwiękowa', type: 'WODA', element: 'Dźwięk', description: 'Uzdrawiające fale dźwiękowe — misy tybetańskie.', tips: ['Połóż się wygodnie', 'Zrelaksuj mięśnie', 'Pozwól dźwiękowi przepływać'], duration: 40, maxParticipants: 60, isLive: false },
];

export const RitualsService = {
  async seedRitualsIfNeeded(hostUser: { uid: string; displayName: string }): Promise<void> {
    const snap = await getDocs(collection(db, 'rituals'));
    if (snap.size > 0) return;
    for (const r of SEED_RITUALS) {
      await addDoc(collection(db, 'rituals'), {
        ...r,
        hostId: hostUser.uid,
        hostName: hostUser.displayName,
        participantCount: 0,
        startTime: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }
  },

  listenToRituals(onRituals: (rituals: Ritual[]) => void): () => void {
    const q = query(collection(db, 'rituals'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      onRituals(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id, title: data.title, hostId: data.hostId, hostName: data.hostName,
          type: data.type, description: data.description, tips: data.tips ?? [],
          element: data.element, duration: data.duration, maxParticipants: data.maxParticipants,
          isLive: data.isLive ?? false,
          startTime: data.startTime instanceof Timestamp ? data.startTime.toMillis() : Date.now(),
          participantCount: data.participantCount ?? 0,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
        } as Ritual;
      }));
    });
  },

  async joinRitual(ritualId: string, user: { uid: string; displayName: string }): Promise<void> {
    const partRef = doc(db, 'rituals', ritualId, 'participants', user.uid);
    if ((await getDoc(partRef)).exists()) return;
    await setDoc(partRef, { joinedAt: serverTimestamp(), displayName: user.displayName });
    await runTransaction(db, async tx => {
      const ref = doc(db, 'rituals', ritualId);
      const snap = await tx.get(ref);
      tx.update(ref, { participantCount: (snap.data()?.participantCount ?? 0) + 1 });
    });
  },

  async leaveRitual(ritualId: string, userId: string): Promise<void> {
    const partRef = doc(db, 'rituals', ritualId, 'participants', userId);
    if (!(await getDoc(partRef)).exists()) return;
    await deleteDoc(partRef);
    await runTransaction(db, async tx => {
      const ref = doc(db, 'rituals', ritualId);
      const snap = await tx.get(ref);
      tx.update(ref, { participantCount: Math.max(0, (snap.data()?.participantCount ?? 1) - 1) });
    });
  },

  async createRitual(
    host: { uid: string; displayName: string },
    data: { title: string; type: string; description: string; duration: number; element: string; maxParticipants: number },
  ): Promise<void> {
    await addDoc(collection(db, 'rituals'), {
      ...data, tips: [], hostId: host.uid, hostName: host.displayName,
      isLive: true, participantCount: 0,
      startTime: serverTimestamp(), createdAt: serverTimestamp(),
    });
  },

  async isParticipant(ritualId: string, userId: string): Promise<boolean> {
    return (await getDoc(doc(db, 'rituals', ritualId, 'participants', userId))).exists();
  },
};
