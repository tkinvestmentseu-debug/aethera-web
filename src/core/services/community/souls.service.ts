import {
  collection, doc, getDoc, getDocs, setDoc, query,
  orderBy, limit, startAfter, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export interface SoulProfile {
  uid: string;
  displayName: string;
  zodiacSign: string;
  archetype: string;
  avatarEmoji: string;
  bio: string;
}

const ELEM: Record<string, string> = {
  Baran: 'Ogień', Lew: 'Ogień', Strzelec: 'Ogień',
  Byk: 'Ziemia', Panna: 'Ziemia', Koziorożec: 'Ziemia',
  Bliźnięta: 'Powietrze', Waga: 'Powietrze', Wodnik: 'Powietrze',
  Rak: 'Woda', Skorpion: 'Woda', Ryby: 'Woda',
};

const COMPAT: Record<string, Record<string, number>> = {
  Ogień:     { Ogień: 90, Powietrze: 80, Ziemia: 55, Woda: 50 },
  Ziemia:    { Ziemia: 90, Woda: 80, Ogień: 55, Powietrze: 60 },
  Powietrze: { Powietrze: 90, Ogień: 80, Woda: 55, Ziemia: 60 },
  Woda:      { Woda: 90, Ziemia: 80, Powietrze: 55, Ogień: 50 },
};

export function calcSoulCompat(a: SoulProfile, b: SoulProfile): number {
  const ea = ELEM[a.zodiacSign] ?? 'Ogień';
  const eb = ELEM[b.zodiacSign] ?? 'Ogień';
  return COMPAT[ea]?.[eb] ?? 65;
}

export const SoulsService = {
  async browseProfiles(currentUserId: string, lastDoc?: any): Promise<{ profiles: SoulProfile[]; lastDoc: any }> {
    let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(20));
    if (lastDoc) q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(20), startAfter(lastDoc));
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
      initiatorId, status: 'pending',
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
    return (await getDoc(doc(db, 'connections', connectionId))).exists();
  },
};
