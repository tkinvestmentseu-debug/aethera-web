import {
  doc, getDoc, setDoc, addDoc, collection,
  runTransaction, serverTimestamp, Timestamp,
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
    if (snap.exists()) return { id: snap.id, ...snap.data() } as Affirmation;
    const weekIndex = Math.floor(Date.now() / (7 * 24 * 3600 * 1000)) % WEEKLY_SEED.length;
    const data: Omit<Affirmation, 'id'> = {
      text: WEEKLY_SEED[weekIndex], weekStart,
      votes: 0, reactions: { heart: 0, star: 0, flower: 0 },
      isHero: true, createdBy: 'system',
    };
    await setDoc(ref, { ...data, createdAt: serverTimestamp() });
    return { id: weekStart, ...data };
  },

  async vote(affirmationId: string, userId: string): Promise<boolean> {
    const voteRef = doc(db, 'affirmations', affirmationId, 'userVotes', userId);
    const affRef = doc(db, 'affirmations', affirmationId);
    let voted = false;
    await runTransaction(db, async tx => {
      const voteSnap = await tx.get(voteRef);
      const affSnap = await tx.get(affRef);
      if (voteSnap.exists()) {
        tx.update(affRef, { votes: Math.max(0, (affSnap.data()?.votes ?? 1) - 1) });
        tx.delete(voteRef);
        voted = false;
      } else {
        tx.update(affRef, { votes: (affSnap.data()?.votes ?? 0) + 1 });
        tx.set(voteRef, { votedAt: serverTimestamp() });
        voted = true;
      }
    });
    return voted;
  },

  async hasVoted(affirmationId: string, userId: string): Promise<boolean> {
    return (await getDoc(doc(db, 'affirmations', affirmationId, 'userVotes', userId))).exists();
  },

  async react(affirmationId: string, userId: string, reaction: 'heart'|'star'|'flower'): Promise<void> {
    const reactRef = doc(db, 'affirmations', affirmationId, 'userReactions', userId);
    const affRef = doc(db, 'affirmations', affirmationId);
    await runTransaction(db, async tx => {
      const reactSnap = await tx.get(reactRef);
      const affSnap = await tx.get(affRef);
      const reactions = { ...affSnap.data()?.reactions ?? { heart: 0, star: 0, flower: 0 } };
      if (reactSnap.exists()) {
        const prev = reactSnap.data().type as string;
        reactions[prev] = Math.max(0, (reactions[prev] ?? 1) - 1);
      }
      reactions[reaction] = (reactions[reaction] ?? 0) + 1;
      tx.update(affRef, { reactions });
      tx.set(reactRef, { type: reaction });
    });
  },

  async propose(user: { uid: string; displayName: string }, text: string): Promise<void> {
    await addDoc(collection(db, 'affirmationProposals'), {
      text: text.trim(), authorId: user.uid, authorName: user.displayName,
      votes: 0, createdAt: serverTimestamp(),
    });
  },
};
