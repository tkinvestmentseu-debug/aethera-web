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

const COLORS = ['#818CF8', '#F472B6', '#34D399', '#FB923C', '#A78BFA', '#60A5FA'];

export const ChroniclesService = {
  listenToChronicles(category: string | null, onData: (chronicles: Chronicle[]) => void): () => void {
    let q = query(collection(db, 'chronicles'), orderBy('createdAt', 'desc'), limit(30));
    if (category) q = query(collection(db, 'chronicles'), where('category', '==', category), orderBy('createdAt', 'desc'), limit(30));
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

  async createChronicle(author: { uid: string; displayName: string }, data: { title: string; body: string; category: string }): Promise<void> {
    const initials = author.displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    await addDoc(collection(db, 'chronicles'), {
      title: data.title, body: data.body, category: data.category,
      authorId: author.uid, authorName: author.displayName,
      authorInitials: initials, authorColor: color,
      likes: 0, commentCount: 0, reads: 0, createdAt: serverTimestamp(),
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
    return (await getDoc(doc(db, 'chronicles', chronicleId, 'userLikes', userId))).exists();
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
      return { id: d.id, authorId: data.authorId, authorName: data.authorName, text: data.text, createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now() };
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
