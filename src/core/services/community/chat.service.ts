import {
  collection, doc, addDoc, setDoc, getDoc, getDocs,
  onSnapshot, query, orderBy, limit, where, serverTimestamp, Timestamp,
  arrayUnion, arrayRemove, updateDoc,
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
  isPrivate?: boolean;
  creatorId?: string;
  inviteCode?: string;
  members?: string[];
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
        await setDoc(ref, { ...room, memberCount: 0, isPrivate: false, members: [] });
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

  // ─── New methods ──────────────────────────────────────────────────────────

  async createRoom(data: {
    name: string;
    emoji: string;
    description: string;
    isPrivate: boolean;
    creatorId: string;
    creatorName: string;
  }): Promise<{ roomId: string; inviteCode: string }> {
    const inviteCode = await _generateCode(6);
    const roomRef = await addDoc(collection(db, 'chatRooms'), {
      name: data.name.trim(),
      emoji: data.emoji,
      description: data.description.trim(),
      isPrivate: data.isPrivate,
      creatorId: data.creatorId,
      creatorName: data.creatorName,
      memberCount: 1,
      members: [data.creatorId],
      inviteCode,
      createdAt: serverTimestamp(),
    });
    // Save invite code lookup document
    await setDoc(doc(db, 'inviteCodes', inviteCode), {
      roomId: roomRef.id,
      createdAt: serverTimestamp(),
    });
    return { roomId: roomRef.id, inviteCode };
  },

  async generateInviteCode(roomId: string): Promise<string> {
    const code = await _generateCode(6);
    await setDoc(doc(db, 'inviteCodes', code), {
      roomId,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'chatRooms', roomId), { inviteCode: code });
    return code;
  },

  async joinByCode(
    code: string,
    user: { uid: string; displayName: string },
  ): Promise<{ success: boolean; roomId?: string; roomName?: string }> {
    const codeSnap = await getDoc(doc(db, 'inviteCodes', code.toUpperCase().trim()));
    if (!codeSnap.exists()) return { success: false };
    const { roomId } = codeSnap.data() as { roomId: string };
    const roomSnap = await getDoc(doc(db, 'chatRooms', roomId));
    if (!roomSnap.exists()) return { success: false };
    const roomData = roomSnap.data() as ChatRoom;
    await ChatService.joinRoom(roomId, user.uid, user.displayName);
    return { success: true, roomId, roomName: roomData.name };
  },

  async joinRoom(roomId: string, userId: string, displayName: string): Promise<void> {
    const ref = doc(db, 'chatRooms', roomId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as ChatRoom;
    const members: string[] = data.members ?? [];
    if (members.includes(userId)) return;
    await updateDoc(ref, {
      members: arrayUnion(userId),
      memberCount: (data.memberCount ?? 0) + 1,
    });
  },

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const ref = doc(db, 'chatRooms', roomId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as ChatRoom;
    const count = Math.max(0, (data.memberCount ?? 1) - 1);
    await updateDoc(ref, {
      members: arrayRemove(userId),
      memberCount: count,
    });
  },

  async getMyRooms(userId: string): Promise<ChatRoom[]> {
    const q = query(
      collection(db, 'chatRooms'),
      where('members', 'array-contains', userId),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatRoom));
  },

  listenToPublicRooms(callback: (rooms: ChatRoom[]) => void): () => void {
    const q = query(
      collection(db, 'chatRooms'),
      where('isPrivate', '==', false),
      orderBy('memberCount', 'desc'),
      limit(30),
    );
    return onSnapshot(q, (snap) => {
      const rooms: ChatRoom[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatRoom));
      callback(rooms);
    });
  },
};

// ─── Private helpers ────────────────────────────────────────────────────────

function _randomCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function _generateCode(length: number): Promise<string> {
  // Try up to 5 times to get a unique code
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = _randomCode(length);
    const snap = await getDoc(doc(db, 'inviteCodes', code));
    if (!snap.exists()) return code;
  }
  return _randomCode(length);
}
