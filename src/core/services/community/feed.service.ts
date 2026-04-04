import {
  collection, addDoc, getDocs, query, orderBy, limit,
  startAfter, doc, runTransaction, serverTimestamp, Timestamp,
  DocumentSnapshot, getDoc,
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
  async getPosts(userId: string, lastDoc?: DocumentSnapshot): Promise<{ posts: FeedPost[]; lastDoc: DocumentSnapshot | null }> {
    let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
    if (lastDoc) q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20), startAfter(lastDoc));
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
    return { posts, lastDoc: snap.docs[snap.docs.length - 1] ?? null };
  },

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
          reactions[prev] = Math.max(0, reactions[prev] - 1);
          tx.delete(reactionRef);
        } else {
          reactions[prev] = Math.max(0, reactions[prev] - 1);
          reactions[reaction] = (reactions[reaction] ?? 0) + 1;
          tx.set(reactionRef, { type: reaction });
        }
      } else {
        reactions[reaction] = (reactions[reaction] ?? 0) + 1;
        tx.set(reactionRef, { type: reaction });
      }
      tx.update(postRef, { reactions });
    });
  },

  async addComment(postId: string, author: { uid: string; displayName: string }, text: string): Promise<void> {
    await addDoc(collection(db, 'posts', postId, 'comments'), {
      authorId: author.uid,
      authorName: author.displayName,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    await runTransaction(db, async (tx) => {
      const postRef = doc(db, 'posts', postId);
      const snap = await tx.get(postRef);
      tx.update(postRef, { commentCount: (snap.data()?.commentCount ?? 0) + 1 });
    });
  },

  async getComments(postId: string): Promise<FeedComment[]> {
    const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id, authorId: data.authorId, authorName: data.authorName,
        text: data.text,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
      };
    });
  },
};
