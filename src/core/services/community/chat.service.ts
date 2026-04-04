import {
  collection, doc, addDoc, setDoc, getDoc, getDocs,
  onSnapshot, query, orderBy, limit, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export interface ChatMessage {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorEmoji: string;
  createdAt: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  emoji: string;
  description: string;
  memberCount: number;
}

const DEFAULT_ROOMS: Omit<ChatRoom, 'id' | 'memberCount'>[] = [
  { name: 'Ogólny',     emoji: '💬', description: 'Rozmowy o wszystkim' },
  { name: 'Tarot',      emoji: '🔮', description: 'Interpretacje i pytania o karty' },
  { name: 'Medytacja',  emoji: '🧘', description: 'Techniki i doświadczenia' },
  { name: 'Sny',        emoji: '🌙', description: 'Świadome śnienie i symbole' },
  { name: 'Astrologia', emoji: '⭐', description: 'Horoskopy i planety' },
  { name: 'Rytuały',    emoji: '🕯️', description: 'Ceremonie i rytuały' },
  { name: 'Wsparcie',   emoji: '💛', description: 'Wzajemna pomoc i energie' },
  { name: 'Afirmacje',  emoji: '✨', description: 'Codzienne afirmacje i intencje' },
];

export const ChatService = {
  async seedRoomsIfNeeded(): Promise<void> {
    for (const room of DEFAULT_ROOMS) {
      const roomId = room.name.toLowerCase().replace(/\s/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const ref = doc(db, 'chatRooms', roomId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { ...room, memberCount: 0 });
      }
    }
  },

  async getRooms(): Promise<ChatRoom[]> {
    const snap = await getDocs(collection(db, 'chatRooms'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatRoom));
  },

  listenToMessages(roomId: string, onMessages: (msgs: ChatMessage[]) => void): () => void {
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
          authorEmoji: data.authorEmoji ?? '🌙',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
        };
      });
      onMessages(msgs);
    });
  },

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
